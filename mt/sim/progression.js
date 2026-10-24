// mt/sim/progression.js — monster XP, levels, evolution (DESIGN.md §7, §8). Owner: progression specialist.
//
// XP (DESIGN §7)
//  - Participation: every damage instance by a pet stamps `victim.mtHitBy: Map<petUnitId, time>`.
//    On a kill, XP goes to participating pets of the killer's team within 9 m that hit the victim in the last 6 s.
//  - Split: 1 participant -> 100 %; 2 -> killer 60 % / other 40 % (if the killer is one of them, else 50/50);
//    >= 3 -> equal split, killer +20 % on top of its share.
//  - INTERPRETATION (documented in DESIGN §7): with no participant, active monsters of the killer's team within 9 m
//    share it; if still none and the killer is a trainer, that trainer's active monster gets it.
//  - The ACTIVE record of a trainer receives the share; that trainer's BENCHED record gets 30 % of it on top
//    (trickle training). Team-wide sources (boss, tower) go to every trainer's active monster (+ bench trickle).
//  - Enemy owned monster: 120 × clamp(1 + 0.3 × (victimLv − recipientLv), 0.25, 2.2) — the level-gap factor is
//    evaluated PER RECIPIENT (the monster that actually earns the XP), so an underdog that helps gets more.
//  - Comeback: the team whose average monster level is ≥ 1.5 below the other team's gets +15 %.
//  - Level cap 13 (XP stops accruing at the cap).
//
// Evolution (DESIGN §8)
//  - {type:'evolve'} on a trainer: evolves the ACTIVE monster if it is ready; otherwise, if the BENCHED monster is
//    ready, it evolves inside its orb ({type:'evolve', bench:true} forces the bench). Bots use the same command.
//  - Active: 2.4 s channel, the monster can't act, takes 50 % damage (combat.js scaler reads mtMon.evolving),
//    a stun/knock-up interrupts it with a full refund (nothing is consumed; press again). Recall / faint /
//    trainer death also cancel (refund).
//  - Bench: same 2.4 s channel inside the orb (safe, but the bench can't be swapped in meanwhile).
//  - Done: the unit keeps its id; form/stats/size/moves change; HP %, level, XP and cooldowns are preserved
//    (a newly unlocked A2 starts ready).
//
// Pure helpers (exported for tests/progression.test.mjs): xpToNext, levelGapFactor, enemyMonsterXp, splitShares,
// applyXp, comebackMult.

import { XP, EVOLUTION } from '../data/balance.js';
import { FORMS, nextFormId } from '../data/species.js';
import { KIND, TEAM, dist, isPet } from './util.js';
import * as monsters from './monsters.js';
import { t } from '../i18n/index.js'; // player-facing refusal texts (mt_deny)

export function install(mt) {
  mt.on('damage', (mt, src, tgt) => {
    if (src && isPet(src) && tgt) (tgt.mtHitBy || (tgt.mtHitBy = new Map())).set(src.id, mt.world.time);
  });
  mt.on('kill', onKill);
  mt.on('postTick', stepEvolutions);
  // {type:'evolve', bench?} handled here (before the trainers.js router) so the full command reaches startEvolution
  mt.on('command', (mt, unit, cmd) => (unit && unit.mtTrainer && cmd.type === 'evolve' ? startEvolution(mt, unit, cmd) : undefined));
}

// --------------------------------------------------------------------------------------------- pure helpers
/** XP needed to go from level L to L+1 (DESIGN §7: 80 + 45 × (L − 1)); 0 at the cap. */
export function xpToNext(level) { return level >= XP.maxLevel ? 0 : XP.toNext(level); }

/** Enemy-owned-monster level-gap factor: clamp(1 + 0.3 × (victimLv − killerLv), 0.25, 2.2). */
export function levelGapFactor(victimLv, killerLv) { return Math.min(2.2, Math.max(0.25, 1 + 0.3 * (victimLv - killerLv))); }

/** XP for killing an enemy owned monster of level victimLv, earned by a monster of level killerLv. */
export function enemyMonsterXp(victimLv, killerLv) { return XP.enemyMonster(victimLv, killerLv); }

/** Comeback multiplier for a team: 1.15 if its avg level is ≥ 1.5 below the enemy's, else 1. */
export function comebackMult(myAvg, enemyAvg) { return enemyAvg - myAvg >= XP.comeback.gap ? 1 + XP.comeback.bonus : 1; }

/**
 * Share fractions of a kill's XP among n participants (killerIdx = index of the killer among them, or -1).
 * 1 -> [1]; 2 -> killer .6 / other .4 (no killer among them: .5/.5); ≥3 -> equal, killer × 1.2.
 * @returns {number[]} fraction of the base amount per participant (sum may exceed 1 with the killer bonus)
 */
export function splitShares(n, killerIdx = -1) {
  if (n <= 0) return [];
  if (n === 1) return [1];
  if (n === 2) {
    if (killerIdx < 0) return [0.5, 0.5];
    return [0, 1].map((i) => (i === killerIdx ? XP.killerSoloShare : 1 - XP.killerSoloShare));
  }
  const each = 1 / n;
  return Array.from({ length: n }, (_, i) => each * (i === killerIdx ? 1 + XP.killerBonus : 1));
}

/**
 * Add XP to a level/xp pair (pure). Returns the new state and the levels gained.
 * @param {{level:number, xp:number}} s
 * @returns {{level:number, xp:number, levels:number[]}}
 */
export function applyXp(s, amount) {
  let level = s.level, xp = s.xp; const levels = [];
  if (level >= XP.maxLevel || !(amount > 0)) return { level, xp: level >= XP.maxLevel ? 0 : xp, levels };
  xp += amount;
  while (level < XP.maxLevel && xp >= XP.toNext(level)) { xp -= XP.toNext(level); level++; levels.push(level); }
  if (level >= XP.maxLevel) xp = 0;
  return { level, xp, levels };
}

/** Can this record evolve now (level gate only)? */
export function evolveReady(rec) {
  const f = rec && FORMS[rec.form];
  return !!(f && nextFormId(rec.form) && rec.level >= f.evolveLevel);
}

// --------------------------------------------------------------------------------------------- XP
function teamAvgLevel(mt, team) {
  let s = 0, n = 0;
  for (const c of mt.world.champions) if (c.team === team && c.mtTrainer) for (const r of c.mtTrainer.party) { s += r.level; n++; }
  return n ? s / n : 1;
}

/**
 * Give XP to a record (and the 30 % bench trickle to its trainer's other monster).
 * @param {object} [meta] {source, comeback} forwarded into the mt_xp events
 */
export function grantXp(mt, trainer, rec, amount, bench = true, meta = {}) {
  if (!rec || !(amount > 0)) return;
  const other = trainer ? monsters.benchRecord(trainer) : null;
  addXp(mt, trainer, rec, amount, meta, false);
  if (bench && other && other !== rec) addXp(mt, trainer, other, amount * XP.benchShare, meta, true);
}

function addXp(mt, trainer, rec, amount, meta, isBench) {
  if (rec.level >= XP.maxLevel) return;
  const u = monsters.unitOf(mt, rec);
  const prev = rec.level;
  const r = applyXp(rec, amount);
  rec.xp = r.xp; rec.level = r.level;
  const tid = trainer ? trainer.id : -1, team = trainer ? trainer.team : -1;
  const px = u ? u.x : trainer ? trainer.x : 0, py = u ? u.y : trainer ? trainer.y : 0;
  mt.emit(mt.E.XP, {
    trainer: tid, team, unit: u ? u.id : -1, ...monsters.describe(rec), amount: Math.round(amount), xp: Math.floor(rec.xp),
    toNext: xpToNext(rec.level), bench: isBench, source: meta.source || null, comeback: !!meta.comeback, x: px, y: py,
  });
  if (!r.levels.length) return;
  for (const lv of r.levels) {
    mt.stats.levelUps++;
    mt.stats.maxMonsterLevel = Math.max(mt.stats.maxMonsterLevel, lv);
  }
  if (u) { u.level = rec.level; monsters.refreshMonsterStats(mt, u); }
  const ready = evolveReady(rec);
  mt.emit(mt.E.LEVEL_UP, {
    trainer: tid, team, unit: u ? u.id : -1, ...monsters.describe(rec), level: rec.level, prevLevel: prev, bench: isBench,
    xp: Math.floor(rec.xp), toNext: xpToNext(rec.level), evolveReady: ready, x: px, y: py,
  });
  if (u) mt.world.emit(mt.EVENT.LEVEL_UP, { id: u.id, level: rec.level });
  if (ready && !rec.evolveNotified) {
    rec.evolveNotified = true;
    const to = nextFormId(rec.form);
    mt.emit(mt.E.EVOLVE_READY, { trainer: tid, team, unit: u ? u.id : -1, ...monsters.describe(rec), bench: isBench, to, toName: FORMS[to].name });
  }
}

/** XP value of a victim. amount(lvl) is evaluated per recipient for enemy owned monsters (level gap). */
function xpValue(mt, victim) {
  const K = KIND;
  if (victim.kind === K.MINION) return { source: 'minion', amount: () => XP.minion[victim.subtype] || XP.minion.melee };
  if (victim.kind === K.MONSTER) {
    if (victim.epic) return { source: 'boss', amount: () => XP.boss, team: true };
    if (victim.mtMon && victim.mtMon.ownerId < 0) return { source: 'wild', amount: () => XP.wild(victim.level || 1) };
    if (victim.mtMon) { const vl = victim.level || 1; return { source: 'monster', amount: (kl) => XP.enemyMonster(vl, kl || vl) }; }
    return { source: 'wild', amount: () => XP.wild(1) };
  }
  if (victim.kind === K.CHAMPION) return { source: 'trainer', amount: () => XP.enemyTrainer };
  if (victim.kind === K.TOWER || victim.kind === K.INHIBITOR) return { source: 'tower', amount: () => XP.tower, team: true };
  return null;
}

function onKill(mt, victim, killer) {
  const w = mt.world;
  if (victim.kind === KIND.TOWER && killer) { const kt = killer.team; if (kt === 0 || kt === 1) mt.stats.towerKills[kt]++; }
  if (victim.mtMon && victim.mtMon.capturing) return; // safety: a monster inside an orb can't die
  const val = xpValue(mt, victim); if (!val) return;
  let kt = killer ? killer.team : victim.kind === KIND.MINION ? 1 - victim.team : -1;
  if (kt !== TEAM.BLUE && kt !== TEAM.RED) { if (victim.kind === KIND.MINION) kt = 1 - victim.team; else return; }
  const cb = comebackMult(teamAvgLevel(mt, kt), teamAvgLevel(mt, 1 - kt));
  const meta = { source: val.source, comeback: cb > 1 };

  if (val.team) {
    for (const c of w.champions) {
      if (c.team !== kt || !c.mtTrainer) continue;
      const rec = monsters.activeRecord(c);
      if (rec) grantXp(mt, c, rec, val.amount(rec.level) * cb, true, meta);
    }
    return;
  }
  // participants
  const R = XP.participationRadius, now = w.time, parts = [];
  if (victim.mtHitBy) for (const [id, t] of victim.mtHitBy) {
    if (now - t > XP.participationWindow) continue;
    const p = w.units.get(id);
    if (p && p.alive && p.team === kt && p.mtMon && p.mtMon.rec && dist(p.x, p.y, victim.x, victim.y) <= R) parts.push(p);
  }
  if (!parts.length) {
    for (const c of w.champions) {
      if (c.team !== kt || !c.mtTrainer) continue;
      const p = monsters.activeUnit(mt, c);
      if (p && p.alive && dist(p.x, p.y, victim.x, victim.y) <= R) parts.push(p);
    }
  }
  if (!parts.length && killer && killer.mtTrainer) {
    const rec = monsters.activeRecord(killer);
    if (rec) grantXp(mt, killer, rec, val.amount(rec.level) * cb, true, meta);
    return;
  }
  if (!parts.length) return;
  parts.sort((a, b) => a.id - b.id);
  const ki = parts.indexOf(killer);
  const shares = splitShares(parts.length, ki);
  parts.forEach((p, i) => {
    const tr = w.units.get(p.ownerId), rec = p.mtMon.rec;
    grantXp(mt, tr, rec, val.amount(rec.level) * cb * shares[i], true, meta);
    if (i === ki) rec.kills++;
  });
}

// --------------------------------------------------------------------------------------------- evolution
/**
 * {type:'evolve', bench?:boolean} — start evolving the active monster (or the benched one, see header).
 * @returns {boolean} started
 */
export function startEvolution(mt, trainer, cmd = {}) {
  const w = mt.world, rec = monsters.activeRecord(trainer), u = monsters.activeUnit(mt, trainer), bench = monsters.benchRecord(trainer);
  const deny = (c, t) => { mt.emit(mt.E.DENY, { trainer: trainer.id, code: c, text: t }); return false; };
  if (!trainer.alive) return deny('dead', t('deny.dead'));
  const T = trainer.mtTrainer;
  const benchOk = bench && !bench.fainted && !bench.evolving && evolveReady(bench) && !(T.swap && T.party[T.swap.to] === bench);
  const activeOk = rec && u && u.alive && evolveReady(rec) && !rec.evolving;
  if (cmd.bench || (!activeOk && benchOk && !(rec && rec.evolving))) {
    if (!bench) return deny('no_bench', t('deny.noBench'));
    if (bench.evolving) return deny('busy', t('deny.alreadyEvolving'));
    if (bench.fainted) return deny('fainted', t('deny.benchFainted', { name: FORMS[bench.form].name }));
    if (!evolveReady(bench)) return deny('not_ready', t('deny.notReady', { name: FORMS[bench.form].name }));
    return beginChannel(mt, trainer, bench, null);
  }
  if (!rec || !u || !u.alive) return deny('no_monster', t('deny.noMonster'));
  if (rec.evolving) return deny('busy', t('deny.alreadyEvolving'));
  if (!evolveReady(rec)) {
    const f = FORMS[rec.form];
    return deny('not_ready', nextFormId(rec.form) ? t('deny.evolvesAt', { name: f.name, lv: f.evolveLevel }) : t('deny.fullyEvolved', { name: f.name }));
  }
  if (mt.L.isDisabled(w, u)) return deny('disabled', t('deny.disabled'));
  if (T.swap) return deny('busy', t('deny.swappingShort'));
  return beginChannel(mt, trainer, rec, u);
}

function beginChannel(mt, trainer, rec, u) {
  const w = mt.world, to = nextFormId(rec.form);
  const ev = { t0: w.time, until: w.time + EVOLUTION.channel, from: rec.form, to, bench: !u };
  rec.evolving = ev;
  if (u) {
    u.mtMon.evolving = ev;
    mt.L.cancelAttack(w, u, false);
    u.path = null; u.targetId = -1; u.order = null;
  }
  mt.emit(mt.E.EVOLVE_START, {
    trainer: trainer.id, team: trainer.team, unit: u ? u.id : -1, ...monsters.describe(rec), to, toName: FORMS[to].name,
    t0: ev.t0, until: ev.until, duration: EVOLUTION.channel, bench: !u, x: u ? u.x : trainer.x, y: u ? u.y : trainer.y,
  });
  return true;
}

function stepEvolutions(mt) {
  const w = mt.world;
  for (const tr of w.champions) {
    const T = tr.mtTrainer; if (!T) continue;
    for (const rec of T.party) {
      const ev = rec.evolving; if (!ev) continue;
      const u = monsters.unitOf(mt, rec);
      if (!ev.bench) {
        if (!u || !u.alive) { monsters.cancelEvolution(mt, tr, rec, 'fainted'); continue; }
        if (mt.L.isDisabled(w, u)) { monsters.cancelEvolution(mt, tr, rec, 'stunned'); continue; }
        u.moving = false; u.state = 'idle';
      } else if (u) {
        // a benched evolution whose record got deployed (should not happen: swap is refused) -> finish on the unit
        ev.bench = false; u.mtMon.evolving = ev;
      }
      if (w.time < ev.until) continue;
      finishEvolution(mt, tr, rec, u);
    }
  }
}

function finishEvolution(mt, trainer, rec, u) {
  const from = rec.form, to = nextFormId(from);
  rec.evolving = null;
  if (u) u.mtMon.evolving = null;
  if (!to) return;
  const f = FORMS[to];
  const hadA2 = FORMS[from].stage >= 1;
  rec.form = to; rec.evolveNotified = false;
  if (!hadA2) rec.cds.a2 = 0;           // newly unlocked move starts ready
  if (u) {
    const M = u.mtMon;
    M.form = to; M.line = f.line; M.stage = f.stage; M.types = f.types.slice();
    M.evolvedAt = mt.world.time; M.evolvedFrom = from;
    monsters.refreshMonsterStats(mt, u);  // preserves HP % (level unchanged)
  }
  mt.stats.evolutions++;
  mt.emit(mt.E.EVOLVE, {
    trainer: trainer.id, team: trainer.team, unit: u ? u.id : -1, rid: rec.rid, from, to, name: f.name, fromName: FORMS[from].name,
    level: rec.level, stage: f.stage, types: f.types.slice(), line: f.line, bench: !u, unlocked: hadA2 ? null : 'a2',
    x: u ? u.x : trainer.x, y: u ? u.y : trainer.y,
  });
  monsters.emitParty(mt, trainer, 'evolve');
  // Lv 10+ juvenile evolving to Evolved is immediately ready again -> notify
  if (evolveReady(rec)) {
    rec.evolveNotified = true;
    const nx = nextFormId(rec.form);
    mt.emit(mt.E.EVOLVE_READY, { trainer: trainer.id, team: trainer.team, unit: u ? u.id : -1, ...monsters.describe(rec), bench: !u, to: nx, toName: FORMS[nx].name });
  }
}
