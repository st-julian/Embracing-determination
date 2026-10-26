// mt/sim/rules.js — match rules from the match OPTIONS: difficulty, mode (QUICK / CLASSIC) and starter monsters.
// Owner: gameplay & pacing. Data + contract: mt/data/options.js; rules: docs/DESIGN.md §2a / §3 / §15; tuning and
// measurements: docs/BALANCE.md "Difficulty & pacing".
//
// `world.mt.rules` (installed FIRST, so every other module can read it from its own install / hooks):
//   options {difficulty, mode} (normalized from `world.options`, i.e. app.newMatch({options}))
//   mode, M (mode table), D (difficulty table), quick (bool), lanes (lanes with waves + structures)
//   laneActive(lane), humanTeams() (frozen at match start from the roster), pve() (humans on exactly one team)
//   starterFor(player) -> form id | null                       (trainers.js, at trainer creation)
//   respawnMult(trainer), faintMult(trainer), xpMult(trainer)  (trainers.js / monsters.js / progression.js)
//   hpMult(trainer), monsterHpMult(owner)                      (trainers.js / monsters.js; Easy human handicap)
//   comeback(team) -> {bonus, gap}                             (progression.js)
//   botSkill(trainer) -> BOT_SKILL profile                     (mt/ai/*, combat.js auto-cast hold)
//   trainerSpeedMult(trainer), petSpeedMult(owner)             (move speed: QUICK ×1.35, base sprint)
//   assist (ASSIST profile), assisted(trainer), trainerHpMult(trainer), focusHuman(attacker, target), towerYield(tower, u), safeEvolve(),
//   holdFor(pet, target) (capture window), captureBonus(trainer), spawnPoint(team, slot), lastHit (credit stash for creditOf / faint events)
// Player assists (second playtest, docs/PLAYTEST.md): human trainers in a humans-vs-bots match get, per difficulty
// (options.js ASSIST): bots that focus them less, more trainer HP + regen, a low-HP rescue (shield + haste), an automatic
// potion for their monster, respawn guard, kill credit for team kills on enemies they hit, an execute bonus; everyone's
// evolution is safe on Easy / Normal. Pet damage now counts as its trainer's assist (legacy recentChampionHits). QUICK
// has a 15-min time limit (decided on points, mt_time_limit).
// Quick mode world edits (deterministic, at match start): top/bot towers + inhibitors removed (nav obstacles rebuilt),
// waves only in mid (first at waveFirst, then every waveInterval), recall channel, inhibitor respawn; jungle camps are
// filtered in jungle.js campDefs (reads rules.M.camps).
// Everything here is a pure function of the roster, the seed and sim state (no wall clock, no Math.random).

import { DEFAULT_OPTIONS, normalizeOptions, MODES, DIFFICULTY, BOT_SKILL, STARTER_LEVEL, NO_STARTER, isStarter, botStarter, EXTRA_HUMAN_HANDICAP, EXTRA_HUMAN_TEAM,
  ASSIST, TIME_LIMIT_SCORE, CAPTURE_WINDOW, SPAWN_RING } from '../data/options.js';
import { FORMS } from '../data/species.js';
import { XP, TRAINER } from '../data/balance.js';
import { KIND, TEAM, DT, dist, dist2, isPet, isTrainer, isWild } from './util.js';
import { i as FOUNTAINS } from '../../assets/map-oE9sOnNc.js';
import { usePotion } from './trainers.js';
import { publishGuide, trackSteps } from './guide.js';

export { DEFAULT_OPTIONS, STARTER_LEVEL };

export function install(mt) {
  const w = mt.world;
  const options = normalizeOptions(w.options);
  const M = MODES[options.mode], D0 = DIFFICULTY[options.difficulty];
  // the human-team handicap is per mode (CLASSIC: a human laning alone needs more help for the same win rate)
  const D = { ...D0, humanTeam: D0.humanTeam[options.mode] || D0.humanTeam.quick };
  let teams = null, counts = [0, 0], hcap = [null, null];   // frozen human-team classification + per-team handicap
  const humanTeams = () => {
    if (teams) return teams;
    const set = [false, false], n = [0, 0];
    for (const p of w.players || []) if (p && !p.bot && (p.team === 0 || p.team === 1)) { set[p.team] = true; n[p.team]++; }
    if (w.players) {   // freeze once the roster exists (World ctor); before that: provisional
      teams = set; counts = n;
      // co-op: every extra human on the team scales the handicap's distance from ×1 (options.js EXTRA_HUMAN_HANDICAP)
      for (const tm of [0, 1]) {
        const H = D.humanTeam, extra = Math.max(0, n[tm] - 1), k = 1 + EXTRA_HUMAN_HANDICAP * extra, sc = (v) => 1 + ((v ?? 1) - 1) * k;
        const team = H.hp > 1 ? 1 + EXTRA_HUMAN_TEAM * extra : 1;   // not on Hard (no handicap there)
        hcap[tm] = k === 1 ? H : { ...H, hp: sc(H.hp), dmg: sc(H.dmg), teamHp: sc(H.teamHp) * team, teamDmg: sc(H.teamDmg) * team, respawn: Math.max(0.3, sc(H.respawn)),
          comeback: H.comeback ? { bonus: H.comeback.bonus * k, gap: H.comeback.gap } : null };
      }
    }
    return set;
  };
  const pve = () => { const h = humanTeams(); return h[0] !== h[1]; };
  const teamOf = (u) => (u && (u.team === 0 || u.team === 1) ? u.team : -1);
  /** handicap of the team of `u` (the human team in a humans-vs-bots match) or null */
  const handicap = (u) => { const tm = teamOf(u); return tm >= 0 && pve() && humanTeams()[tm] ? hcap[tm] || D.humanTeam : null; };
  /** the handicap of `team` (its minions / structures) or null */
  const teamHandicap = (team) => ((team === 0 || team === 1) && pve() && humanTeams()[team] ? hcap[team] || D.humanTeam : null);
  /** human trainer whose stats get the Easy boost */
  const boosted = (tr) => !!(tr && tr.mtTrainer && !isBotSlot(w, tr) && handicap(tr));

  const R = mt.rules = {
    options, mode: options.mode, difficulty: options.difficulty, M, D, quick: options.mode === 'quick',
    lanes: M.lanes.slice(),
    laneActive: (lane) => M.lanes.includes(lane),
    humanTeams, pve,
    /** form id of the starter this roster entry begins with, or null */
    starterFor(player) {
      if (!player) return null;
      if (typeof player.starterForm === 'string' && FORMS[player.starterForm]) return player.starterForm;   // debug / tests: any form
      const s = player.starter;
      if (s === NO_STARTER || s === null || s === false) return null;
      if (isStarter(s)) return s;
      // auto (omitted / unknown id): deterministic from the seed, varying across the team (team-mates' picks first)
      const auto = (p) => !(typeof p.starterForm === 'string' && FORMS[p.starterForm]) && !isStarter(p.starter) && p.starter !== NO_STARTER && p.starter !== null && p.starter !== false;
      const list = (w.players || []).filter((p) => p.team === player.team);
      const claimed = list.filter((p) => isStarter(p.starter)).map((p) => p.starter);
      let i = 0;
      for (const p of list) {
        if (p === player || (p.index != null && p.index === player.index)) break;
        if (auto(p)) { claimed.push(botStarter(w.seed, player.team, i, claimed)); i++; }
      }
      return botStarter(w.seed, player.team, i, claimed);
    },
    starterLevel: STARTER_LEVEL,
    respawnMult(tr) {
      const h = handicap(tr), L = M.respawnLate, t = w.time;
      const m = L ? M.respawn + (L.mult - M.respawn) * Math.min(1, Math.max(0, (t - L.from) / (L.to - L.from))) : M.respawn;
      return m * (h ? h.respawn : 1);
    },
    faintMult() { return M.faint; },
    xpMult() { return M.xp; },
    hpMult(tr) { const h = handicap(tr); return h ? (h.teamHp ?? 1) * (boosted(tr) ? h.hp : 1) : 1; },
    monsterHpMult(owner) { return R.hpMult(owner); },
    dmgMult(tr) { const h = handicap(tr); return h ? (h.teamDmg ?? 1) * (boosted(tr) ? h.dmg : 1) : 1; },
    comeback(team) {
      const h = (team === 0 || team === 1) && pve() && humanTeams()[team] ? (hcap[team] || D.humanTeam).comeback : null;
      return h || XP.comeback;
    },
    /** humans per team (frozen at match start) */
    humanCount: (team) => { humanTeams(); return counts[team] || 0; },
    /** skill profile for a bot trainer (fixed per match: team classification is frozen at match start) */
    botSkill(tr) {
      const tm = teamOf(tr), h = humanTeams();
      const key = tm >= 0 && h[tm] ? D.allyBots : D.enemyBots;
      return BOT_SKILL[key] || BOT_SKILL.normal;
    },
    trainerSpeedMult(tr) { return M.trainerSpeed * sprintMult(mt, tr); },
    petSpeedMult(owner) { return M.monsterSpeed * (owner ? sprintMult(mt, owner) : 1); },
  };

  // ---------------------------------------------------------------------------------------- player assists
  const AS = ASSIST[options.difficulty] || ASSIST.normal;
  R.assist = AS;
  /** a human trainer (roster slot, not a bot) on the human team of a humans-vs-bots match */
  R.assisted = (tr) => !!(tr && tr.mtTrainer && !isBotSlot(w, tr) && handicap(tr));
  R.trainerHpMult = (tr) => R.hpMult(tr) * (R.assisted(tr) ? AS.trainerHp : 1);
  /** weight of `target` for an attacker of `attackerTeam`: below 1 for a HUMAN trainer the bots should leave alone */
  R.focusHuman = (attackerTeam, target) => (target && target.mtTrainer && target.team !== attackerTeam && R.assisted(target) ? AS.focusHuman : 1);
  /** s: `tower` may drop HUMAN trainer `u` it is locked onto for any other target unless u / its monster hit one of the
   *  tower's trainers in its range within this window (structures.js); 0 = keep the target (bots, Normal / Hard) */
  R.towerYield = (tower, u) => (AS.towerYield > 0 && tower && u && u.mtTrainer && u.team !== tower.team && R.assisted(u) ? AS.towerYield : 0);
  R.safeEvolve = () => !!AS.safeEvolve;
  /** catch-chance bonus for `tr`'s throws (ASSIST.capture; `first` while the party holds only the starter) */
  R.captureBonus = (tr) => {
    const C = AS.capture;
    return C && R.assisted(tr) ? C.bonus + (tr.mtTrainer.party.length < 2 ? C.first : 0) : 0;
  };
  /** is `pet` holding its attacks on wild `target` so its trainer can throw an orb (capture window)? */
  R.holdFor = (pet, target) => {
    const H = target && target.mtHold;
    return !!(H && pet && pet.mtMon && H.by === pet.mtMon.ownerId && w.time < H.until && target.alive && !target.mtMon.capturing);
  };
  R.spawnPoint = spawnPoint;
  R.teamHandicap = teamHandicap;
  R.onRespawn = (tr) => {
    if (!R.assisted(tr) || !(AS.guard > 0)) return;
    tr.mtGuardUntil = w.time + AS.guard;
    mt.emit(mt.E.ASSIST, { trainer: tr.id, team: tr.team, kind: 'guard', until: tr.mtGuardUntil, x: tr.x, y: tr.y });
  };
  mt.damageScalers.push((mt, src, tgt) => assistScale(mt, src, tgt));
  mt.on('damage', onDamageAssist);

  publishGuide();   // app.mtGuide(unitId?) for the UI's on-screen objective guide (mt/sim/guide.js)
  trackSteps(mt);   // per-match guide steps (catch / lane / evolve / push achieved), read by guide.js only
  mt.on('ready', onReady);
  mt.on('preTick', preTick);
  mt.on('postTick', postTick);
  mt.on('kill', onKill);
  mt.on('cast', onCast);
  // recall channel length (QUICK): start the legacy recall here and shorten it before anyone reads the event
  if (M.recallTime) mt.on('command', (mt, unit, cmd) => {
    if (!cmd || cmd.type !== 'recall' || !isTrainer(unit) || typeof w.startRecall !== 'function') return undefined;
    const n = w.events.length, ok = w.startRecall(unit);
    if (ok) {
      unit.recallDuration = M.recallTime;
      for (let i = w.events.length - 1; i >= n; i--) if (w.events[i].type === mt.EVENT.RECALL_START && w.events[i].id === unit.id) w.events[i].duration = M.recallTime;
    }
    return ok;
  });
  mt.damageScalers.push((mt, src) => {
    if (!src || (src.team !== 0 && src.team !== 1)) return 1;
    const tr = isTrainer(src) ? src : isPet(src) ? w.units.get(src.mtMon.ownerId) : null;
    return tr ? R.dmgMult(tr) : 1;
  });
  void R;
}

/** a trainer driven by the bot brain from the start (roster bot); qa.human / takeover flips don't change stats mid-match */
function isBotSlot(w, tr) {
  const p = w.players && tr.mtPlayerIndex != null ? w.players[tr.mtPlayerIndex] : null;
  return p ? !!p.bot : !!tr.bot;
}

// ------------------------------------------------------------------------------------------------ base sprint
function sprintMult(mt, tr) {
  const S = mt.rules && mt.rules.M.sprint;
  if (!S || !tr || !tr.alive) return 1;
  const fo = FOUNTAINS[tr.team]; if (!fo) return 1;
  if (dist2(tr.x, tr.y, fo.x, fo.y) > S.radius * S.radius) return 1;
  const t = mt.world.time;
  const last = Math.max(tr.lastHitTime || -99, tr.lastAttackT || -99);
  return t - last >= S.calm ? S.mult : 1;
}

// ------------------------------------------------------------------------------------------------ match start
function onReady(mt) {
  const R = mt.rules, w = mt.world;
  R.humanTeams();   // freeze the team classification now that the roster exists
  // team-kill credit for the human (ASSIST.lastHit): wraps the kill-credit decision of trainers.js
  const base = mt.impl.creditOf;
  mt.impl.creditOf = (mt, u) => {
    const L = mt._lastHit;
    if (L && L.tick === w.tickNo && !L.victim.alive && L.victim.deathT === w.time) return L.to;
    return base(mt, u);
  };
  const H = R.M.structureHp;
  for (const s of w.structures) {
    const k = (H && H[s.kind]) || 1, h = R.teamHandicap(s.team), m = k * ((h && h.structureHp) || 1);
    if (m === 1) continue;
    s.maxHp *= m; s.hp = s.maxHp;
  }
  if (!R.quick) return;
  // QUICK: only the active lanes keep their towers / inhibitors (base towers + Nexus stay)
  const drop = w.structures.filter((s) => (s.kind === KIND.TOWER || s.kind === KIND.INHIBITOR) && s.lane && s.lane !== 'base' && !R.laneActive(s.lane));
  if (!drop.length) return;
  for (const s of drop) { w.removeUnit(s); const i = w.structures.indexOf(s); if (i >= 0) w.structures.splice(i, 1); }
  if (w.nav && w.nav.setObstacles) w.nav.setObstacles(w.structures);
  w.markMoved();
  w.visionDirty = true;
  R.removedStructures = drop.length;
}

// ------------------------------------------------------------------------------------------------ per tick
function preTick(mt) {
  const R = mt.rules, w = mt.world, M = R.M;
  timeLimit(mt);
  // minion wave schedule (the legacy check `time >= nextWave` runs right after this hook and adds 30 s after a wave)
  if (M.waveFirst !== 30 || M.waveInterval !== 30) {
    if (R._waveNo === undefined) { R._waveNo = w.waveNo; R._nextWave = w.time + 1e-9 < M.waveFirst ? M.waveFirst : w.nextWave; }
    else if (w.waveNo !== R._waveNo) { R._waveNo = w.waveNo; R._nextWave = Math.max(R._nextWave + M.waveInterval, w.time + 1); }
    else if (w.nextWave !== R._waveSet) R._nextWave = w.nextWave;   // debug setTime / fixtures moved it
    w.nextWave = R._waveSet = R._nextWave;
  }
}

function postTick(mt) {
  const R = mt.rules, w = mt.world;
  for (const c of w.champions) if (c.mtTrainer) c.mtSpeedMul = R.trainerSpeedMult(c);
  assistTick(mt);
  // monster KOs per team (time-limit score; the same count as the HUD's KO column)
  for (const e of w.events) {
    if (e.type === 'mt_faint' && e.team >= 0) { const k = mt._monKOs || (mt._monKOs = [0, 0]); if (e.team === 0 || e.team === 1) k[1 - e.team]++; }
    else if (e.type === 'mt_capture_fail') reopenHold(mt, e);
  }
}

/** capture window: a failed throw re-opens the hold for the thrower (it was weak enough to try: let them try again) */
function reopenHold(mt, e) {
  const w = mt.world, u = w.units.get(e.target), tr = w.units.get(e.trainer);
  if (!u || !u.alive || !isWild(u) || !tr || !tr.mtTrainer || isBotSlot(w, tr) || tr.mtTrainer.party.length >= TRAINER.maxParty) return;
  if (u.hp > u.maxHp * CAPTURE_WINDOW.holdHp) return;
  u.mtHold = { by: tr.id, until: w.time + CAPTURE_WINDOW.hold, saved: false };
  mt.emit(mt.E.ASSIST, { trainer: tr.id, team: tr.team, kind: 'hold', target: u.id, until: u.mtHold.until, x: u.x, y: u.y });
}

function onKill(mt, victim) {
  const R = mt.rules;
  if (victim && victim.kind === KIND.INHIBITOR && R.M.inhibitorRespawn && victim.respawnAt) victim.respawnAt = mt.world.time + R.M.inhibitorRespawn;
  const L = mt._lastHit;
  if (L && L.victim === victim) mt.emit(mt.E.ASSIST, { trainer: L.to.id, team: L.to.team, kind: 'credit', victim: victim.id, x: victim.x, y: victim.y });
}

// ------------------------------------------------------------------------------------------------ spawn ring
/** Spawn point of trainer slot `slot` (0..2) of `team`: a ring around the fountain statue toward the map centre. */
function spawnPoint(team, slot) {
  const fo = FOUNTAINS[team]; if (!fo) return null;
  const base = Math.atan2(60 - fo.y, 60 - fo.x);   // toward the map centre (same for both teams by symmetry)
  const a = base + (slot - 1) * SPAWN_RING.spread;
  // deterministic: plain + − × ÷ on module constants and the legacy deterministic trig would also do; atan2/cos/sin run
  // inside the World constructor, where online matches already have the deterministic Math installed (mt/net/detmath.js)
  return { x: fo.x + Math.cos(a) * SPAWN_RING.radius, y: fo.y + Math.sin(a) * SPAWN_RING.radius };
}

// ------------------------------------------------------------------------------------------------ assists
/** damage scalers: respawn guard, the human's execute bonus */
function assistScale(mt, src, tgt) {
  const R = mt.rules, A = R.assist, w = mt.world, t = w.time;
  let m = 1;
  if (tgt && (tgt.team === 0 || tgt.team === 1)) {
    const tr = isTrainer(tgt) ? tgt : isPet(tgt) ? w.units.get(tgt.mtMon.ownerId) : null;
    if (tr && tr.mtGuardUntil > t && (!src || src.team !== tgt.team)) m *= A.guardTaken;
  }
  if (A.execute > 0 && src && isPet(src) && tgt && tgt.alive && (isTrainer(tgt) || isPet(tgt)) && tgt.team !== src.team && tgt.hp < tgt.maxHp * 0.3) {
    const tr = w.units.get(src.mtMon.ownerId);
    if (tr && R.assisted(tr)) m *= 1 + A.execute;
  }
  return m;
}

/** post-damage: pet assists, human hit memory + team-kill credit, capture window (hold + linger) */
function onDamageAssist(mt, src, tgt, amount) {
  const R = mt.rules, A = R.assist, w = mt.world, t = w.time;
  if (!src || !tgt) return;
  const srcTr = isTrainer(src) ? src : isPet(src) ? w.units.get(src.mtMon.ownerId) : null;
  // a monster's hit counts as its trainer's hit for kill credit / assists (legacy only recorded champion hits)
  if (isPet(src) && srcTr && tgt.kind === KIND.CHAMPION && tgt.team !== src.team && tgt.recentChampionHits) tgt.recentChampionHits.set(srcTr.id, t);
  // capture window: a HUMAN with a free party slot weakened a wild monster
  if (isWild(tgt) && tgt.alive && !tgt.epic && !tgt.mtMon.capturing) {
    const W = CAPTURE_WINDOW;
    if (srcTr && !isBotSlot(w, srcTr) && srcTr.mtTrainer.party.length < TRAINER.maxParty && tgt.hp <= tgt.maxHp * W.holdHp &&
        !(tgt.mtHold && t < tgt.mtHold.until + 10)) {
      tgt.mtHold = { by: srcTr.id, until: t + W.hold, saved: false };
      mt.emit(mt.E.ASSIST, { trainer: srcTr.id, team: srcTr.team, kind: 'hold', target: tgt.id, until: tgt.mtHold.until, x: tgt.x, y: tgt.y });
    }
    const H = tgt.mtHold;
    if (tgt.hp <= 0 && H && t < H.until) {
      const by = w.units.get(H.by);
      if (by && by.alive && dist(by.x, by.y, tgt.x, tgt.y) <= W.radius && (!H.saved || t < H.lingerUntil)) {
        if (!H.saved) { H.saved = true; H.lingerUntil = t + W.linger; H.until = Math.max(H.until, H.lingerUntil); }
        tgt.hp = 1;   // it lingers: the kill below (legacy, hp <= 0) does not happen
      }
    }
    return;
  }
  // human hit memory on enemy trainers / monsters
  if (!(isTrainer(tgt) || isPet(tgt)) || (tgt.team !== 0 && tgt.team !== 1)) return;
  if (srcTr && tgt.team !== srcTr.team && R.assisted(srcTr)) { tgt.mtHumanHit = srcTr.id; tgt.mtHumanHitT = t; }
  // a lethal blow by the human's team on an enemy the human hit recently -> credit the human (creditOf / faint event)
  if (tgt.hp <= 0 && tgt.alive && A.lastHit > 0 && tgt.mtHumanHitT > t - A.lastHit) {
    const human = w.units.get(tgt.mtHumanHit);
    if (human && human.team === src.team && human !== srcTr) mt._lastHit = { victim: tgt, to: human, tick: w.tickNo };
  }
  void amount;
}

/** per-tick assists for human trainers: regen, low-HP rescue, automatic potion */
function assistTick(mt) {
  const R = mt.rules, A = R.assist, w = mt.world, t = w.time, L = mt.L;
  if (mt._lastHit && mt._lastHit.tick !== w.tickNo) mt._lastHit = null;
  if (!(A.regen > 0) && !A.rescue && !(A.petPotion > 0)) return;
  for (const u of w.champions) {
    if (!u.alive || !R.assisted(u)) continue;
    if (A.regen > 0 && u.hp < u.maxHp && !(u.lastHitTime > t - 3)) u.hp = Math.min(u.maxHp, u.hp + u.maxHp * A.regen * DT);
    const S = A.rescue;
    if (S && u.hp < u.maxHp * S.hp && u.lastHitTime > t - 1 && !(u.mtRescueReady > t)) {
      u.mtRescueReady = t + S.cd;
      L.addShield(w, u, u.maxHp * S.shield, S.dur, 'mt_rescue');
      L.addBuff(w, u, 'mt_rescue', S.dur, { msPct: S.haste });
      mt.emit(mt.E.ASSIST, { trainer: u.id, team: u.team, kind: 'rescue', until: t + S.dur, x: u.x, y: u.y });
    }
    if (A.petPotion > 0 && t >= u.mtTrainer.cdEnd.potion) {
      const rec = u.mtTrainer.activeIdx >= 0 ? u.mtTrainer.party[u.mtTrainer.activeIdx] : null;
      const pet = rec && rec.unitId >= 0 ? w.units.get(rec.unitId) : null;
      if (pet && pet.alive && pet.hp < pet.maxHp * A.petPotion && pet.lastHitTime > t - 2 && usePotion(mt, u)) {
        mt.emit(mt.E.ASSIST, { trainer: u.id, team: u.team, kind: 'potion', x: pet.x, y: pet.y });
      }
    }
  }
}

// ------------------------------------------------------------------------------------------------ time limit (QUICK)
function teamScore(mt, team) {
  const w = mt.world, S = TIME_LIMIT_SCORE;
  let n = 0;
  for (const s of w.structures) if (s.team === 1 - team && !s.alive) n += S.structure;
  for (const c of w.champions) if (c.team === team) n += (c.kills || 0) * S.kill;
  n += (mt._monKOs ? mt._monKOs[team] : 0) * S.monsterKO;
  return n;
}
function timeLimit(mt) {
  const R = mt.rules, w = mt.world, lim = R.M.timeLimit, t = w.time;
  if (!(lim > 0) || w.winner !== null || R._timeUp) return;
  const score = [teamScore(mt, 0), teamScore(mt, 1)];
  if (!R._timeWarned && t >= lim - 60) { R._timeWarned = true; mt.emit(mt.E.TIME_LIMIT, { phase: 'warn', at: lim, score }); }
  if (t < lim) return;
  R._timeUp = true;
  // decide: points, then the team whose remaining structures are more damaged loses, then the lower total HP, then red
  const hpLeft = (team) => { let h = 0, mx = 0; for (const s of w.structures) if (s.team === team && s.alive) { h += s.hp; mx += s.maxHp; } return { frac: mx ? h / mx : 0, hp: h }; };
  let loser;
  if (score[0] !== score[1]) loser = score[0] < score[1] ? 0 : 1;
  else { const a = hpLeft(0), b = hpLeft(1); loser = a.frac !== b.frac ? (a.frac < b.frac ? 0 : 1) : a.hp !== b.hp ? (a.hp < b.hp ? 0 : 1) : 1; }
  mt.emit(mt.E.TIME_LIMIT, { phase: 'end', at: lim, score, winner: 1 - loser });
  const nx = w.structures.find((s) => s.kind === KIND.NEXUS && s.team === loser && s.alive);
  if (nx) { nx.invulnerable = false; nx.hp = 0; w.kill(nx, null); }
}

/** bot-owned monsters hold their next auto-cast after each cast: (1 − abilityUse) × 5 s */
function onCast(mt, u) {
  if (!isPet(u)) return;
  const owner = mt.world.units.get(u.mtMon.ownerId);
  if (!owner || !owner.bot || !owner.mtTrainer) return;
  const S = mt.rules.botSkill(owner);
  if (S.abilityUse < 1) u.mtCastHold = mt.world.time + (1 - S.abilityUse) * 5;
}
