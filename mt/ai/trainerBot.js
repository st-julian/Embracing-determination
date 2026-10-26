// mt/ai/trainerBot.js — utility-based trainer bot brain (DESIGN.md §13). Owner: AI specialist.
//
// Integration (zero legacy edits): on the first mt preTick the legacy bot controller (`world.botController`) is
// REPLACED by `controller()`. Trainer bots are driven entirely by this module; the legacy brain only still runs
// for non-trainer bot champions (none in a normal mt match).
//
// Every THINK ticks (0.5 s, staggered per bot) each bot:
//   1. builds a context (party, threats, trade estimate, lane snapshot, team call),
//   2. fires instant ACTIONS (swap / potion / trainer skill) when their conditions hold,
//   3. scores every GOAL (utility 0..1 + reason string) and picks the best (with commitment hysteresis):
//        CAPTURE  FARM_LANE  JUNGLE  FIGHT  RETREAT  DEFEND  PUSH  OBJECTIVE  EVOLVE  RECALL  END
//   4. runs the goal's executor, which only issues world.command(trainerId, …) like a human would.
// A light micro step every MICRO ticks handles capture throw timing, tower-aggro escape and stuck recovery.
// Team coordination (lanes, calls, collapse) lives in ./team.js; arithmetic in ./assess.js; map in ./geo.js.
//
// QA: `__moba.mt.debug.botState()` (or `world.mt.trainerBot.state()`) lists each bot's goal + reasoning + scores.
// Add `?botdebug` to the URL for an on-screen panel (./overlay.js).

import { FORMS, LINES } from '../data/species.js';
import { CAPTURE, TRAINER, XP } from '../data/balance.js';
import { typeMultiplier, TYPE_NAMES } from '../data/types.js';
import { isCapturable, captureChance } from '../sim/capture.js';
import * as monsters from '../sim/monsters.js';
import { evolveReady } from '../sim/progression.js';
import { rand01 } from '../sim/util.js';
import { dist, fountainOf, pointAtTeam, progressOf, ownSide, BOSS_PIT, nearestLane } from './geo.js';
import { mult, formMult, dps, ehp, estimateFight, enemyTowerAt, lineValue, chanceAt, recordPower, TOWER_RANGE } from './assess.js';
import { makeTeam, updateTeam, laneState, reportFight, bossUnit, activeLevel } from './team.js';
import { BOT_SKILL } from '../data/options.js';

const THINK = 15;   // 0.5 s at 30 Hz
const MICRO = 3;
export const GOALS = ['CAPTURE', 'FARM_LANE', 'JUNGLE', 'FIGHT', 'RETREAT', 'DEFEND', 'PUSH', 'OBJECTIVE', 'EVOLVE', 'RECALL', 'END'];

export function install(mt) {
  mt.trainerBot = {
    brains: new Map(), teams: [makeTeam(0), makeTeam(1)],
    stats: { captureGoals: 0, captureThrows: 0, evolves: 0, benchEvolves: 0, swaps: 0, potions: 0, skills: 0, recalls: 0, laneSwaps: 0, goalChanges: 0, goalTime: {}, why: {} },
    state: () => botState(mt),
  };
  mt.on('preTick', hijackController);
  if (typeof window !== 'undefined' && typeof location !== 'undefined' && /[?&]botdebug\b/.test(location.search) && !globalThis.__mtBotOverlay) {
    globalThis.__mtBotOverlay = true;
    import('./overlay.js').then((m) => m.start()).catch((e) => console.warn('[mt:botOverlay]', e));
  }
}

function hijackController(mt) {
  const w = mt.world;
  if (!w.botController || w.botController === mt._botCtl) return;
  const legacy = w.botController;
  const ctl = (world) => controller(mt, world, legacy);
  ctl.legacy = legacy; ctl.ai = legacy.ai;
  mt._botCtl = ctl;
  w.botController = ctl;
}

function trackTelegraphs(mt, world) {
  const TB = mt.trainerBot, t = world.time;
  const tele = TB.tele || (TB.tele = []);
  for (const e of world.events) {
    if (e.type === 'mt_boss_gust') tele.push({ x: e.tx, y: e.ty, r: e.radius || 3, until: t + (e.delay || 0.9), team: 2, what: 'Gale Burst' });
    else if (e.type === 'fx' && e.kind === 'aoe_telegraph' && Number.isFinite(e.x)) tele.push({ x: e.x, y: e.y, r: e.radius || 2.5, until: t + (e.duration || 0.6), team: e.team, what: e.fx });
  }
  for (let i = tele.length - 1; i >= 0; i--) if (tele[i].until < t) tele.splice(i, 1);
}

function controller(mt, world, legacy) {
  const TB = mt.trainerBot;
  mt.guard('trainerBot.tele', () => trackTelegraphs(mt, world));
  let others = false;
  for (const u of world.champions) {
    if (!u.bot) continue;
    if (!u.mtTrainer) { others = true; continue; }
    const b = brainOf(mt, u);
    if ((world.tickNo + b.slot) % b.thinkEvery === 0) {
      const TM = TB.teams[u.team];
      mt.guard('trainerBot.team', () => updateTeam(mt, TM, TB.brains));
      mt.guard('trainerBot', () => think(mt, u, b, TM));
    } else if ((world.tickNo + b.slot) % MICRO === 0 && u.alive) mt.guard('trainerBot.micro', () => micro(mt, u, b));
  }
  if (others) {
    const tr = world.champions.filter((u) => u.bot && u.mtTrainer);
    for (const u of tr) u.bot = false;
    try { legacy(world); } finally { for (const u of tr) u.bot = true; }
  }
}

// ------------------------------------------------------------------------------------------------ brains
function brainOf(mt, u) {
  let b = mt.trainerBot.brains.get(u.id);
  if (b) return b;
  const w = mt.world, seed = (w.seed | 0) * 7919 + u.id * 104729;
  const r = (k) => { let h = Math.imul(seed ^ (k * 0x9e3779b1), 0x85ebca6b) >>> 0; h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35) >>> 0; h ^= h >>> 16; return h / 4294967296; };
  // difficulty (mt/data/options.js BOT_SKILL via mt/sim/rules.js): reaction delay, aggression, focus, kiting, misplays
  const skill = mt.rules ? mt.rules.botSkill(u) : BOT_SKILL.hard;
  const clampA = (v) => Math.min(0.95, Math.max(0.1, v));
  b = {
    id: u.id, name: u.name, team: u.team, slot: (u.id * 5) % THINK, skill, thinkEvery: Math.max(1, Math.round(THINK * skill.think)), mis: null,
    pers: { aggression: +clampA(0.3 + 0.55 * r(1) + skill.aggression).toFixed(2), greed: +(0.25 + 0.55 * r(2)).toFixed(2) },
    goal: 'IDLE', why: 'spawned', score: 0, since: w.time, top: [], targetId: -1, anchor: null,
    capture: null, jungle: null, moveReq: null, stuck: { x: u.x, y: u.y, t: w.time }, laneWhy: '',
    actions: [], history: [], lastGoalT: w.time, fightT: -99,
  };
  mt.trainerBot.brains.set(u.id, b);
  return b;
}

const cmd = (mt, u, c) => mt.world.command(u.id, c);
const rx = (r) => (r >= 10 ? '>10' : r.toFixed(2));

function act(mt, b, text, cat) {
  if (cat) { const W = mt.trainerBot.stats.why; W[cat] = (W[cat] || 0) + 1; }
  b.actions.push({ t: +mt.world.time.toFixed(1), text });
  if (b.actions.length > 8) b.actions.shift();
}

function moveTo(mt, u, b, x, y, force = false) {
  const w = mt.world, o = u.order;
  if (!force && b.kiteUntil > w.time) return;   // a kite step is in progress
  if (b.moveReq && o && o.type === 'move' && Math.hypot(b.moveReq.x - x, b.moveReq.y - y) < 1.5) return;
  if ((!o || o.type !== 'move') && Math.hypot(u.x - x, u.y - y) < 1.2) { if (o) cmd(mt, u, { type: 'stop' }); return; }
  b.moveReq = { x, y };
  cmd(mt, u, { type: 'move', x, y });
  void w;
}

function sling(mt, u, tgt) {
  if (!tgt || !tgt.alive) return false;
  if (u.order && u.order.type === 'attack' && u.order.targetId === tgt.id) return true;
  return cmd(mt, u, { type: 'attack', targetId: tgt.id });
}

function petFocus(mt, u, pet, tgt) {
  if (!pet || !pet.alive || !tgt || !tgt.alive) return false;
  const M = pet.mtMon, t = mt.world.time;
  if (M.focusId === tgt.id && M.focusUntil - t > 3) return true;
  return cmd(mt, u, { type: 'monsterAttack', targetId: tgt.id });
}

function petRelease(mt, u, pet) {
  if (pet && pet.alive && (pet.mtMon.focusId >= 0 || pet.targetId >= 0)) cmd(mt, u, { type: 'regroup' });
}

/** point `d` metres from `from` toward `to` */
function toward(from, to, d) {
  const dx = to.x - from.x, dy = to.y - from.y, l = Math.hypot(dx, dy) || 1;
  return { x: from.x + dx / l * d, y: from.y + dy / l * d };
}

// ------------------------------------------------------------------------------------------------ context
function buildCtx(mt, u, b, TM) {
  const w = mt.world, t = w.time, T = u.mtTrainer;
  const rec = monsters.activeRecord(u), pet = monsters.activeUnit(mt, u), bench = monsters.benchRecord(u);
  const petOk = !!(pet && pet.alive && !pet.mtMon.evolving);
  const cx = petOk ? (u.x + pet.x) / 2 : u.x, cy = petOk ? (u.y + pet.y) / 2 : u.y;
  const fight = estimateFight(mt, u.team, cx, cy, 11, { allyExtra: 4 });
  let nearest = null, nd = 1e9;
  for (const e of fight.enemies) { const d = dist(u.x, u.y, e.x, e.y); if (d < nd) { nd = d; nearest = e; } }
  const lane = TM.lanes.get(u.id) || 'mid';
  const L = laneState(mt, TM, lane);
  const fo = fountainOf(u.team);
  const hpT = u.hp / u.maxHp, hpP = petOk ? pet.hp / pet.maxHp : 0;
  const benchOk = !!(bench && !bench.fainted && bench.hpFrac > 0.45);
  const lvl = rec ? rec.level : 0;
  const inCombat = petOk && (pet.lastHitTime > t - 2 || (pet.mtMon.lastCombatT || -99) > t - 1.5);
  return {
    w, t, T, rec, pet, bench, petOk, fight, nearest, nearD: nd, lane, L, fo, hpT, hpP, benchOk, lvl, inCombat, TM,
    distFountain: dist(u.x, u.y, fo.x, fo.y), call: TM.call, partyN: T.party.length,
    noMonster: !T.party.length || T.party.every((r) => r.fainted) && !petOk,
    ts: progressOf(u.team, lane, u.x, u.y),
  };
}

// ------------------------------------------------------------------------------------------------ think
function think(mt, u, b, TM) {
  const w = mt.world, t = w.time, TB = mt.trainerBot;
  if (!u.alive) { setGoal(mt, b, 'DEAD', 0, `respawn in ${Math.max(0, (u.respawnAt || t) - t).toFixed(0)} s`); b.capture = null; return; }
  const c = buildCtx(mt, u, b, TM);
  if (u.recallStart != null) {
    if (c.nearest && c.nearD < 8 && u.lastHitTime > t - 1) { moveTo(mt, u, b, c.fo.x, c.fo.y); setGoal(mt, b, 'RETREAT', 1, 'recall interrupted: enemy on me'); }
    else { setGoal(mt, b, 'RECALL', 1, 'channelling recall'); }
    return;
  }
  // misplay (difficulty): for ~2 s the bot is 'distracted' (no potion / swap / skill), 'hesitant' (2nd-best goal) or
  // 'stubborn' (ignores retreat / recall), deterministic per seed + tick
  if (b.mis && t >= b.mis.until) b.mis = null;
  if (!b.mis && b.skill.misplay > 0 && rand01(w, u.id, 0x3157) < b.skill.misplay) {
    b.mis = { kind: ['distracted', 'hesitant', 'stubborn'][Math.floor(rand01(w, u.id, 0x3158) * 3) % 3], until: t + 1.5 + rand01(w, u.id, 0x3159) * 1.5 };
    TB.stats.misplays = (TB.stats.misplays || 0) + 1;
  }
  const mis = b.mis ? b.mis.kind : null;
  if (mis !== 'distracted') actions(mt, u, b, c);
  // score goals
  const cands = [];
  const add = (goal, s) => { if (s && s.u > 0) cands.push({ goal, ...s }); };
  add('CAPTURE', scoreCapture(mt, u, b, c));
  add('EVOLVE', scoreEvolve(mt, u, b, c));
  add('RECALL', scoreRecall(mt, u, b, c));
  add('RETREAT', scoreRetreat(mt, u, b, c));
  add('FIGHT', scoreFight(mt, u, b, c));
  add('DEFEND', scoreDefend(mt, u, b, c));
  add('OBJECTIVE', scoreObjective(mt, u, b, c));
  add('END', scoreEnd(mt, u, b, c));
  add('PUSH', scorePush(mt, u, b, c));
  add('JUNGLE', scoreJungle(mt, u, b, c));
  add('FARM_LANE', scoreFarm(mt, u, b, c));
  for (const k of cands) if (k.goal === b.goal) k.u += 0.08;  // commitment
  if (mis === 'stubborn') for (let i = cands.length - 1; i >= 0; i--) if (cands[i].goal === 'RETREAT' || cands[i].goal === 'RECALL') cands.splice(i, 1);
  cands.sort((a, z) => z.u - a.u);
  b.top = cands.slice(0, 4).map((k) => [k.goal, +k.u.toFixed(2)]);
  const best = mis === 'hesitant' && cands.length > 1 && cands[0].goal !== 'EVOLVE' ? cands[1] : cands[0];
  if (!best) { setGoal(mt, b, 'IDLE', 0, 'nothing to do'); return; }
  setGoal(mt, b, best.goal, best.u, mis ? best.why + ` [misplay: ${mis}]` : best.why);
  const ST = TB.stats; ST.goalTime[best.goal] = +((ST.goalTime[best.goal] || 0) + b.thinkEvery / 30).toFixed(1);
  best.run();
}

function setGoal(mt, b, goal, u, why) {
  const t = mt.world.time;
  if (goal !== b.goal) {
    b.history.push({ t: +t.toFixed(1), goal, why });
    if (b.history.length > 14) b.history.shift();
    const h = b.history;  // A -> B -> A with B lasting < 1.6 s = dithering (tracked for tuning)
    if (h.length >= 3 && h[h.length - 3].goal === goal && t - h[h.length - 2].t < 1.6) mt.trainerBot.stats.flips = (mt.trainerBot.stats.flips || 0) + 1;
    b.since = t; mt.trainerBot.stats.goalChanges++;
    if (b.goal === 'CAPTURE' && goal !== 'CAPTURE') b.capture = null;
  }
  b.goal = goal; b.score = +u.toFixed(2); b.why = why;
}

// ------------------------------------------------------------------------------------------------ actions
function actions(mt, u, b, c) {
  const { t, T, rec, pet, bench, petOk, hpP, inCombat } = c;
  const ST = mt.trainerBot.stats;
  // SWAP ------------------------------------------------------------------
  // EVOLVE the benched monster inside its orb (safe, any time)
  if (bench && !bench.fainted && !bench.evolving && !T.swap && evolveReady(bench) && !(rec && rec.evolving)) {
    if (cmd(mt, u, { type: 'evolve', bench: true })) { ST.benchEvolves++; act(mt, b, `EVOLVE bench ${FORMS[bench.form].name} in its orb`, 'evolve_bench'); }
  }
  if (bench && !bench.fainted && !bench.evolving && !T.swap && (!pet || !pet.mtMon.evolving) && !(rec && rec.evolving)) {
    let why = null, cat = null;
    if (rec && rec.fainted) { why = 'active fainted'; cat = 'swap_fainted'; }
    else if (petOk && t >= T.cdEnd.swap) {
      const opp = currentOpponent(mt, u, pet, c);
      if (opp && opp.mtMon) {
        const offA = mult(mt, pet, opp), defA = mult(mt, opp, pet);
        const offB = formMult(bench.form, opp.mtMon.form), defB = formMult(opp.mtMon.form, bench.form);
        const sA = Math.log(offA) - Math.log(defA) + 0.09 * rec.level + 0.5 * Math.log(hpP + 0.15);
        const sB = Math.log(offB) - Math.log(defB) + 0.09 * bench.level + 0.5 * Math.log(bench.hpFrac + 0.15);
        if ((offA <= 0.67 || defA >= 1.5) && sB > sA + 0.2 && bench.hpFrac > 0.6 && t - (b.lastSwapT || -99) > 12)
          { why = `type disadvantage vs ${opp.name} (×${offA.toFixed(2)} out, ×${defA.toFixed(2)} in) → ${FORMS[bench.form].name}`; cat = 'swap_type'; }
      }
      if (!why && inCombat && hpP < 0.25 && bench.hpFrac > 0.65 && bench.level >= rec.level - 3) { why = `${pet.name} low HP (${Math.round(hpP * 100)} %) → fresh ${FORMS[bench.form].name}`; cat = 'swap_lowhp'; }
      if (!why && !inCombat && !c.fight.enemies.length && hpP < 0.45 && bench.hpFrac > 0.9 && bench.level >= rec.level - 2 && t - (b.lastSwapT || -99) > 20) { why = `bench regen: rest ${pet.name} (${Math.round(hpP * 100)} %)`; cat = 'swap_regen'; }
      if (!why && !inCombat && !c.fight.enemies.length && bench.level >= rec.level + 2 && bench.hpFrac > 0.8 && b.goal !== 'CAPTURE') { why = `lead with stronger ${FORMS[bench.form].name} Lv${bench.level}`; cat = 'swap_lead'; }
    }
    if (why && cmd(mt, u, { type: 'swap' })) { ST.swaps++; b.lastSwapT = t; act(mt, b, 'SWAP: ' + why, cat); }
  }
  if (!petOk) return;
  // POTION ----------------------------------------------------------------
  if (t >= T.cdEnd.potion && ((inCombat && hpP < 0.45) || hpP < 0.3)) {
    if (cmd(mt, u, { type: 'potion' })) { ST.potions++; act(mt, b, `POTION: ${pet.name} at ${Math.round(hpP * 100)} %`, 'potion'); }
  }
  // TRAINER SKILL ---------------------------------------------------------
  if (t >= T.cdEnd.skill) {
    const foe = pet.targetId >= 0 ? c.w.units.get(pet.targetId) : null;
    const big = foe && foe.alive && (foe.kind === 'champion' || (foe.mtMon && foe.mtMon.ownerId >= 0) || foe.epic || foe.kind === 'tower' || foe.kind === 'inhibitor' || foe.kind === 'nexus');
    let why = null;
    if (T.spec === 'attack' && inCombat && big && hpP > 0.25) why = `Rally on ${foe.name || foe.kind}`;
    else if (T.spec === 'healing' && (hpP < 0.45 || c.hpT < 0.4) && (inCombat || hpP < 0.3)) why = `Mend (${pet.name} ${Math.round(hpP * 100)} %)`;
    else if (T.spec === 'magic' && inCombat && big && rec && (rec.cds.a1 <= t + 0.3 || rec.cds.a2 <= t + 0.3) && dist(pet.x, pet.y, foe.x, foe.y) < 7) why = `Surge before a move on ${foe.name || foe.kind}`;
    if (why && cmd(mt, u, { type: 'trainerSkill' })) { ST.skills++; act(mt, b, 'SKILL: ' + why, 'skill_' + T.spec); }
  }
}

function currentOpponent(mt, u, pet, c) {
  const w = mt.world;
  const tg = pet.targetId >= 0 ? w.units.get(pet.targetId) : null;
  if (tg && tg.alive && tg.mtMon && tg.mtMon.ownerId >= 0) return tg;
  let best = null, bd = 10;
  for (const e of c.fight.enemies) if (e.mtMon) { const d = dist(pet.x, pet.y, e.x, e.y); if (d < bd) { bd = d; best = e; } }
  return best;
}

// ------------------------------------------------------------------------------------------------ goal: CAPTURE
function teamLines(mt, team, exceptId) {
  const out = [];
  for (const c of mt.world.champions) if (c.team === team && c.mtTrainer && c.id !== exceptId) for (const r of c.mtTrainer.party) out.push(FORMS[r.form].line);
  return out;
}
function enemyTypes(mt, team) {
  const out = [];
  for (const c of mt.world.champions) if (c.team !== team && c.mtTrainer) for (const r of c.mtTrainer.party) out.push(FORMS[r.form].types);
  return out;
}

function captureReason(line, myLines, eTypes, teamL) {
  const atk = LINES[line].forms[0].types[0];
  const strongVs = [...new Set(eTypes.filter((et) => typeMultiplier(atk, et) > 1.01).map((et) => TYPE_NAMES[et[0]]))];
  if (strongVs.length) return `strong vs enemy ${strongVs.join('/')}`;
  for (const ml of myLines) {
    const mine = LINES[ml].forms[0].types;
    const threats = Object.keys(LINES).filter((k) => typeMultiplier(k, mine) > 1.01 && typeMultiplier(atk, LINES[k].forms[0].types) > 1.01);
    if (threats.length) return `covers ${TYPE_NAMES[ml]}'s weakness to ${threats.map((k) => TYPE_NAMES[k]).join('/')}`;
  }
  if (line === 'earth' && !teamL.includes('earth')) return 'team needs a siege bruiser';
  if (!teamL.includes(line)) return 'new type for the team';
  return 'best available';
}

function pickCaptureTarget(mt, u, b, c, mode) {
  const w = mt.world, team = u.team, T = u.mtTrainer;
  const taken = new Set();
  for (const [id, ob] of mt.trainerBot.brains) if (id !== u.id && ob.capture && ob.goal === 'CAPTURE') taken.add(ob.capture.tid);
  const myLines = T.party.map((r) => FORMS[r.form].line), teamL = teamLines(mt, team, u.id), eT = enemyTypes(mt, team);
  const allL = []; for (const c2 of w.champions) if (c2.mtTrainer) for (const r of c2.mtTrainer.party) allL.push(FORMS[r.form].line);
  const vctx = { myLines, teamLines: teamL, enemyTypes: eT, allLines: allL };
  // leave the starter meadow nearest to an allied HUMAN who has no monster yet (first 90 s): don't race the player
  const reserved = new Set();
  if (w.time < 120) for (const h of w.champions) {
    if (h.team !== team || h.bot || !h.mtTrainer || h.mtTrainer.party.length >= TRAINER.maxParty) continue;   // a human with a free slot
    let bc = null, bd2 = 1e9;
    for (const [cid, st2] of w.campState) if (st2.camp.mtMeadow) { const dd = dist(h.x, h.y, st2.camp.x, st2.camp.y); if (dd < bd2) { bd2 = dd; bc = cid; } }
    if (bc) reserved.add(bc);
  }
  let best = null;
  for (const [cid, st] of w.campState) {
    if (st.camp.epic || reserved.has(cid)) continue;
    for (const id of st.unitIds) {
      const o = w.units.get(id);
      if (!isCapturable(o) || taken.has(o.id)) continue;
      const line = o.mtMon.line, lvl = o.level || 1;
      if (myLines.includes(line) && mode !== 'first') continue;
      const pAt = chanceAt(line, lvl, mode === 'first' && !c.petOk ? 0.3 : 0.15, false, CAPTURE);
      if (pAt < 0.22) continue;
      const d = dist(u.x, u.y, o.x, o.y);
      if (d > (mode === 'first' ? 140 : 42)) continue;
      // contested: visible enemy trainers/monsters around it
      let contested = 0;
      for (const e of w.queryUnits(o.x, o.y, 13, null, mt._aiScan4 || (mt._aiScan4 = []))) if (e.alive && e.team === 1 - team && (e.kind === 'champion' || (e.mtMon && e.mtMon.ownerId >= 0)) && !(e.visible && e.visible[team] === false)) contested++;
      if (contested) continue;
      let s = lineValue(line, vctx) * 1.2 - d / 28;
      if (mode === 'first' && !c.petOk) {
        // sling-only race: can the trainer wear it down to ~35 % before it wears the trainer down?
        const slingDps = TRAINER.attack.damage / TRAINER.attack.interval * 100 / (100 + (o.stats.armor || 0));
        const tWear = o.hp * 0.62 / slingDps + 3;
        const wildDps = (o.stats.ad || 30) * (o.stats.attackSpeed || 0.8) * 100 / (100 + (u.stats.armor || 20)) * (o.mtMon.meadow ? 0.5 : 1);
        const tDie = u.hp / Math.max(1, wildDps);
        if (tDie < tWear * 1.25) continue;
        s += Math.min(1, (tDie / tWear - 1.25) * 0.5);
      }
      if (mode === 'first') {
        if (o.mtMon.meadow) s += 1.0;                    // safe: meadow monsters hit for 50 %
        s -= 0.25 * Math.max(0, lvl - 1);
        if (!c.petOk) s -= LINES[line].base.atk / 40;    // sling-only: tough hitters are dangerous
      } else {
        if (o.mtMon.meadow) s -= 0.6 + 0.12 * c.lvl;     // a Lv1 bench is weak later on
        s += 0.18 * Math.min(lvl, c.lvl + 1);
        if (mode === 'replace' && c.bench) s += 0.25 * (lvl - c.bench.level) - 0.6;
      }
      if (ownSide(team, o.x, o.y) < -8) s -= 0.9 * (1 - b.pers.greed);
      s += pAt * 0.8;
      if (!best || s > best.s) best = { s, o, line, why: captureReason(line, myLines, eT, teamL) };
    }
  }
  return best;
}

function scoreCapture(mt, u, b, c) {
  const { T } = c;
  const t = c.t / (mt.rules ? mt.rules.M.aiTime : 1);   // QUICK mode: the same plan in a shorter match
  let mode = null, base = 0;
  if (!T.party.length) { mode = 'first'; base = c.hpT < 0.5 ? 0.45 + 0.6 * c.hpT : 0.97; }
  else if (T.party.length === 1 && t < 420 + 200 * b.pers.greed) { mode = 'second'; base = 0.5 + 0.25 * b.pers.greed - Math.max(0, t - 240) / 900; }
  else if (T.party.length === 2 && c.bench && t < 720 && c.bench.level <= c.lvl - 4) { mode = 'replace'; base = 0.36; }
  if (!mode) return null;
  const keep = b.goal === 'CAPTURE';   // hysteresis: don't drop a hunt on a threshold edge
  if (mode !== 'first' && (!c.petOk || c.hpP < (keep ? 0.33 : 0.45) || c.hpT < (keep ? 0.3 : 0.4))) return null;
  if (mode !== 'first' && c.fight.enemies.length && c.fight.ratio < (keep ? 1.1 : 1.5)) return null;
  // keep the current target while it is valid
  let tgt = b.capture && c.w.units.get(b.capture.tid);
  if (!tgt || !(isCapturable(tgt) || (tgt.mtMon && tgt.mtMon.capturing && tgt.mtMon.capturing.trainer === u.id)) || c.t - b.capture.since > 75) {
    const pick = pickCaptureTarget(mt, u, b, c, mode);
    if (!pick) { b.capture = null; return null; }
    if (pick.s < (mode === 'first' ? -9 : 0.3)) return null;
    if (!b.capture || b.capture.tid !== pick.o.id) { mt.trainerBot.stats.captureGoals++; act(mt, b, `CAPTURE target: ${pick.o.name} Lv${pick.o.level} (${pick.why})`); }
    b.capture = { tid: pick.o.id, since: c.t, why: pick.why, line: pick.line, mode };
    tgt = pick.o;
  }
  let uu = base;
  const frac = tgt.hp / tgt.maxHp;
  if (frac < 0.7 && (mode !== 'first' || c.hpT > 0.3 || frac < 0.35)) uu += 0.15;              // invested
  if (tgt.mtMon.capturing) uu += 0.3;      // orb wobbling: wait for it
  return {
    u: uu, why: `${mode === 'first' ? 'no monster' : mode === 'second' ? 'party of one' : 'weak bench'}: catch ${tgt.name} Lv${tgt.level} — ${b.capture.why}`,
    run: () => runCapture(mt, u, b, c, tgt),
  };
}

function runCapture(mt, u, b, c, tgt) {
  const { t, T, pet, petOk } = c;
  b.targetId = tgt.id;
  if (tgt.mtMon.capturing) { if (u.order) cmd(mt, u, { type: 'stop' }); petRelease(mt, u, pet); return; }
  const d = dist(u.x, u.y, tgt.x, tgt.y);
  const p = captureChance(tgt, t);
  const hitDmg = petOk ? pet.stats.ad * mult(mt, pet, tgt) * 1.25 + 40 : TRAINER.attack.damage * 1.2;
  const killRisk = tgt.hp < hitDmg * (petOk ? 2.6 : 2);
  const greed = b.pers.greed;
  const pNeed = Math.max(0.3, 0.74 - 0.32 * greed - (c.noMonster && c.hpT < 0.5 ? 0.2 : 0));
  if (t >= T.cdEnd.capture && d <= CAPTURE.range - 0.4 && (p >= pNeed || (killRisk && p >= 0.18) || (c.hpT < 0.3 && p >= 0.2))) {
    if (cmd(mt, u, { type: 'capture', targetId: tgt.id, confirm: true })) {
      mt.trainerBot.stats.captureThrows++;
      act(mt, b, `THROW orb at ${tgt.name} (p=${(p * 100).toFixed(0)} %, hp ${Math.round(tgt.hp / tgt.maxHp * 100)} %)`);
      cmd(mt, u, { type: 'stop' }); petRelease(mt, u, pet);
    }
    return;
  }
  if (killRisk) {                      // weak enough: stop hitting it, close in and wait for the orb
    petRelease(mt, u, pet);
    if (u.order && u.order.type === 'attack') cmd(mt, u, { type: 'stop' });
    if (d > CAPTURE.range - 1.5) moveTo(mt, u, b, tgt.x, tgt.y);
    return;
  }
  // wear it down
  if (petOk) {
    petFocus(mt, u, pet, tgt);
    if (d > 6.5) moveTo(mt, u, b, tgt.x, tgt.y);
    else if (d <= TRAINER.attack.range + 0.3 && tgt.hp > hitDmg * 4) sling(mt, u, tgt);
    else if (u.order && u.order.type === 'move') cmd(mt, u, { type: 'stop' });
  } else {
    // sling only: kite at range (meadow juveniles are slow-ish melee for the most part)
    if (d > TRAINER.attack.range + 2 || !(tgt.visible && tgt.visible[u.team])) moveTo(mt, u, b, tgt.x, tgt.y);
    else sling(mt, u, tgt);
  }
}

// ------------------------------------------------------------------------------------------------ goal: EVOLVE
function scoreEvolve(mt, u, b, c) {
  const { rec, pet, petOk, t } = c;
  if (rec && rec.evolving && !rec.evolving.bench && pet && pet.alive) return { u: 0.99, why: `evolving ${pet.name}…`, run: () => { if (u.order) cmd(mt, u, { type: 'stop' }); } };
  if (!petOk || !rec || !evolveReady(rec) || rec.evolving) {
    if (pet && pet.alive && pet.mtMon.evolving) return { u: 0.99, why: `evolving ${pet.name}…`, run: () => { if (u.order) cmd(mt, u, { type: 'stop' }); } };
    return null;
  }
  const nextName = FORMS[LINES[FORMS[rec.form].line].forms[FORMS[rec.form].stage + 1].id].name;
  let minionNear = 0;
  for (const e of c.w.queryUnits(pet.x, pet.y, 7, null, mt._aiScan5 || (mt._aiScan5 = []))) if (e.alive && e.team === 1 - u.team && e.kind === 'minion') minionNear++;
  const safe = !c.fight.enemies.length && minionNear === 0 && pet.lastHitTime < t - 1.5 && !enemyTowerAt(mt, u.team, pet.x, pet.y, 3);
  if (safe) return { u: 0.92, why: `${pet.name} → ${nextName}: safe to evolve`, run: () => {
    if (cmd(mt, u, { type: 'evolve' })) { mt.trainerBot.stats.evolves++; act(mt, b, `EVOLVE ${pet.name} → ${nextName}`, 'evolve_active'); cmd(mt, u, { type: 'stop' }); }
  } };
  // ready but not safe: step back toward our side to find a quiet moment (unless a good fight is on)
  if (c.fight.enemies.length && c.fight.ratio > 1.3) return null;
  return { u: 0.5, why: `${pet.name} can evolve: backing off to a safe spot`, run: () => { petRelease(mt, u, pet); runFallback(mt, u, b, c, 6); } };
}

// ------------------------------------------------------------------------------------------------ goal: RECALL
function scoreRecall(mt, u, b, c) {
  const { hpT, hpP, petOk, rec, bench, distFountain, t } = c;
  const atBase = distFountain < 9;
  const benchUp = bench && !bench.fainted;
  const recUp = rec && !rec.fainted;
  if (atBase) {
    // heal up before leaving (trainers 8.4 %/s, monsters too)
    const needHeal = hpT < 0.9 || (petOk && hpP < 0.85) || (!petOk && recUp && rec.hpFrac < 0.85);
    if (needHeal) return { u: 0.8, why: `healing at fountain (trainer ${Math.round(hpT * 100)} %, monster ${Math.round((petOk ? hpP : rec ? rec.hpFrac : 0) * 100)} %)`, run: () => moveTo(mt, u, b, c.fo.x, c.fo.y) };
    return null;
  }
  const g = b.pers.greed;
  let need = 0, why = '';
  const tLow = 0.34 - 0.12 * g;
  if (hpT < tLow) { need = 1 - hpT; why = `trainer at ${Math.round(hpT * 100)} %`; }
  const petLow = petOk && hpP < 0.3 - 0.1 * g && !(benchUp && bench.hpFrac > 0.6);
  if (petLow) { need = Math.max(need, 0.7 + (0.3 - hpP)); why = `${c.pet.name} at ${Math.round(hpP * 100)} %, no healthy bench`; }
  const allDown = c.T.party.length && c.T.party.every((r) => r.fainted);
  if (allDown) { const back = Math.min(...c.T.party.map((r) => r.faintUntil)) - t; if (back > 12) { need = Math.max(need, 0.75); why = `whole party fainted (${back.toFixed(0)} s)`; } }
  if (!need || distFountain < 30) return null;
  let minionsNear = 0;
  for (const e of c.w.queryUnits(u.x, u.y, 9, null, mt._aiScanR || (mt._aiScanR = []))) if (e.alive && e.team === 1 - u.team && (e.kind === 'minion' || e.kind === 'tower')) minionsNear++;
  const danger = (c.nearest && c.nearD < 10) || minionsNear > 0 || u.lastHitTime > t - 2.5;
  const uu = (0.42 + need * 0.5) * (danger ? 0.45 : 1);
  return { u: danger ? Math.max(uu, 0.45 + need * 0.3) : uu, why: `RECALL: ${why}${danger ? ' (not safe to channel: walking out first)' : ''}`, run: () => {
    if (danger) { petRelease(mt, u, c.pet); runFallback(mt, u, b, c, 14); return; }
    petRelease(mt, u, c.pet);
    if (cmd(mt, u, { type: 'recall' })) { mt.trainerBot.stats.recalls++; act(mt, b, `RECALL: ${why}`, 'recall'); }
  } };
}

// ------------------------------------------------------------------------------------------------ goal: RETREAT
function safePoint(mt, u, c, depth = 3) {
  const { L, lane, ts } = c;
  if (ts.d < 14 && L.ownOuter && ts.ts > L.ownOuter.ts - depth + 1) return pointAtTeam(u.team, lane, L.ownOuter.ts - depth);
  // otherwise: nearest own alive tower behind us, else fountain
  let best = null, bd = 1e9;
  for (const s of c.w.structures) {
    if (!s.alive || s.team !== u.team || s.kind !== 'tower') continue;
    if (ownSide(u.team, s.x, s.y) < ownSide(u.team, u.x, u.y) - 2) continue;
    const d = dist(u.x, u.y, s.x, s.y); if (d < bd && d > 4) { bd = d; best = s; }
  }
  if (best) return toward(best, c.fo, 3);
  return { x: c.fo.x, y: c.fo.y };
}

function runFallback(mt, u, b, c, depth) { const p = safePoint(mt, u, c, depth); moveTo(mt, u, b, p.x, p.y); }

function scoreRetreat(mt, u, b, c) {
  const { fight, nearest, nearD, petOk, hpT, hpP } = c;
  if (!nearest) {
    // tower aggro without enemies around
    if (u.lastHitTime > c.t - 1 && enemyTowerAt(mt, u.team, u.x, u.y, 0.5)) return { u: 0.85, why: 'under enemy tower fire', run: () => runFallback(mt, u, b, c, 4) };
    return null;
  }
  const thr = 0.75 - 0.35 * b.pers.aggression;
  let uu = 0, why = '';
  if (fight.ratio < thr && nearD < 12) { uu = 0.55 + Math.min(0.35, (thr - fight.ratio) * 0.7); why = `losing trade (×${rx(fight.ratio)}: ${fight.allies.length} vs ${fight.enemies.length})`; }
  const petComing = c.T.swap || (c.rec && c.rec.evolving);
  if (!petOk && !petComing && nearD < (b.goal === 'RETREAT' ? 14 : 11) && fight.enemies.some((e) => e.mtMon)) { uu = Math.max(uu, 0.88); why = 'no monster out and enemy monsters near'; }
  if (hpT < 0.3 && nearD < 9) { uu = Math.max(uu, 0.8 + (0.3 - hpT)); why = `trainer at ${Math.round(hpT * 100)} %`; }
  if (petOk && hpP < 0.2 && !c.benchOk && nearD < 10) { uu = Math.max(uu, 0.7); why = `${c.pet.name} nearly fainted`; }
  if (!uu) return null;
  return { u: uu, why: 'RETREAT: ' + why, run: () => {
    petRelease(mt, u, c.pet);
    const p = safePoint(mt, u, c, hpT < 0.35 ? 12 : 5);
    // run directly away first if the safe point is past the enemy
    const away = { x: u.x + (u.x - nearest.x), y: u.y + (u.y - nearest.y) };
    const dp = dist(p.x, p.y, nearest.x, nearest.y), du = dist(u.x, u.y, nearest.x, nearest.y);
    const q = dp < du ? toward(u, away, 6) : p;
    moveTo(mt, u, b, q.x, q.y);
  } };
}

// ------------------------------------------------------------------------------------------------ goal: FIGHT
function pickFightTarget(mt, u, b, c, around, radius) {
  const { pet, petOk } = c;
  const src = petOk ? pet : u, myD = Math.max(1, dps(mt, src));
  const F = b.skill ? b.skill.focus : 1;   // difficulty: 1 = fastest kill / trainers first; lower blends toward "nearest"
  let best = null, bs = -1e9;
  for (const e of c.fight.enemies) {
    if (dist(around.x, around.y, e.x, e.y) > (e.id === b.targetId ? radius + 3 : radius)) continue;
    if (e.mtMon && e.mtMon.capturing) continue;
    const m = petOk ? mult(mt, pet, e) : 1;
    const ttk = ehp(e) / (myD * m);
    let s = -ttk * F;
    if (e.kind === 'champion') s += (2 + 3 * b.pers.aggression) * F;   // a downed trainer takes its monster off the map
    // difficulty (rules.js ASSIST.focusHuman): leave a HUMAN trainer mostly alone on Easy (go for its monster instead)
    const fh = mt.rules ? mt.rules.focusHuman(u.team, e) : 1;
    if (fh < 1) s -= (1 - fh) * (8 + 3 * b.pers.aggression);
    if (e.id === b.targetId) s += 1.5;
    const tw = enemyTowerAt(mt, u.team, e.x, e.y, 0.5);
    if (tw && !(e.hp / e.maxHp < 0.25 && c.fight.ratio > 2.2)) s -= 30;
    s -= dist(src.x, src.y, e.x, e.y) * (0.4 + 1.2 * (1 - F));
    if (s > bs) { bs = s; best = e; }
  }
  return best;
}

function engage(mt, u, b, c, tgt) {
  const { pet, petOk } = c;
  b.targetId = tgt.id; b.fightT = c.t;
  reportFight(c.TM, c.t, tgt.x, tgt.y, c.fight.ratio, u.id);
  if (petOk) {
    petFocus(mt, u, pet, tgt);
    const d = dist(u.x, u.y, tgt.x, tgt.y);
    // trainer: behind the monster, sling the target when it is in range and it is not too dangerous
    const exposed = c.hpT < 0.5 || (tgt.kind === 'champion' && c.hpT < 0.75 && b.pers.aggression < 0.5);
    if (d <= TRAINER.attack.range + 0.2 && !exposed && !enemyTowerAt(mt, u.team, u.x, u.y, 0)) { sling(mt, u, tgt); return; }
    const back = toward(tgt, pet, Math.min(7, dist(tgt.x, tgt.y, pet.x, pet.y) + 4.5));
    if (enemyTowerAt(mt, u.team, back.x, back.y, 0.8)) { runFallback(mt, u, b, c, 2); return; }
    moveTo(mt, u, b, back.x, back.y);
  } else {
    if (dist(u.x, u.y, tgt.x, tgt.y) <= TRAINER.attack.range + 0.2) sling(mt, u, tgt); else moveTo(mt, u, b, tgt.x, tgt.y);
  }
}

function scoreFight(mt, u, b, c) {
  const { fight, petOk, hpP, hpT, t } = c;
  if (!petOk || hpP < 0.22 || hpT < 0.25) return null;
  const thr = (1.25 - 0.55 * b.pers.aggression) * (b.goal === 'FIGHT' && c.t - b.fightT < 3 ? 0.85 : 1);   // hysteresis once engaged
  // 1. direct engagement around me
  if (fight.enemies.length && fight.ratio >= thr) {
    const tgt = pickFightTarget(mt, u, b, c, c.pet, 9);
    if (tgt) {
      const uu = Math.min(0.9, 0.5 + 0.22 * Math.log2(fight.ratio) + 0.15 * b.pers.aggression);
      return { u: uu, why: `FIGHT ${tgt.name}: trade ×${rx(fight.ratio)} (${fight.allies.length}v${fight.enemies.length}${fight.tower ? ', tower ' + (fight.tower > 0 ? 'ours' : 'theirs') : ''}, type ×${mult(mt, c.pet, tgt).toFixed(2)})`,
        run: () => engage(mt, u, b, c, tgt) };
    }
  }
  // 2. collapse on an ally's fight
  let fr = null, fd = 1e9;
  for (const f of c.TM.fights) {
    if (f.by === u.id || t - f.t > 1.6) continue;
    const d = dist(u.x, u.y, f.x, f.y);
    if (d < 32 && d < fd) { fd = d; fr = f; }
  }
  if (fr) {
    const est = estimateFight(mt, u.team, fr.x, fr.y, 11, { allyExtra: fd + 2 });
    if (est.ratio >= thr * 0.9 && !enemyTowerAt(mt, u.team, fr.x, fr.y, 0)) {
      const ally = c.w.units.get(fr.by);
      return { u: Math.min(0.82, 0.55 + 0.2 * Math.log2(est.ratio) + 0.1 * b.pers.aggression), why: `COLLAPSE on ${ally ? ally.name : 'ally'}'s fight (${fd.toFixed(0)} m, trade ×${rx(est.ratio)})`,
        run: () => {
          const tg = c.fight.enemies.length ? pickFightTarget(mt, u, b, c, c.pet, 9) : null;
          if (tg) engage(mt, u, b, c, tg); else moveTo(mt, u, b, fr.x, fr.y);
        } };
    }
  }
  return null;
}

// ------------------------------------------------------------------------------------------------ goal: DEFEND
function scoreDefend(mt, u, b, c) {
  const { L, call, petOk, hpP } = c;
  if (!petOk || hpP < 0.35) return null;
  let s = null, prio = 0, why = '';
  if (call && call.kind === 'defend') {
    const d = dist(u.x, u.y, call.x, call.y);
    if (d < 75) { s = c.w.units.get(call.sid); prio = call.prio; why = 'team call: ' + call.why; }
  }
  if (!s && L.siege && (L.siege.pets || L.siege.mins >= 3)) { s = L.siege.s; prio = L.siege.order >= 4 ? 3 : L.siege.order >= 2 ? 2 : 1; why = `my ${c.lane} ${s.kind}${s.tier ? ' T' + s.tier : ''} under siege`; }
  if (!s || !s.alive) return null;
  const d = dist(u.x, u.y, s.x, s.y);
  const est = estimateFight(mt, u.team, s.x, s.y, TOWER_RANGE + 4, { allyExtra: 6 });
  if (est.enemies.length && est.ratio < 0.45 - 0.2 * b.pers.aggression && d < 20) return null; // hopeless: don't feed
  const uu = 0.5 + 0.1 * prio - Math.min(0.2, d / 300) + (L.siege && L.siege.s === s && !L.siege.pets ? -0.08 : 0);
  return { u: uu, why: `DEFEND: ${why}`, run: () => {
    const tg = pickDefendTarget(mt, u, c, s);
    if (tg && dist(u.x, u.y, s.x, s.y) < 14) {
      if (tg.kind === 'minion') { petFocus(mt, u, c.pet, tg); const p = toward(s, c.fo, 2.5); moveTo(mt, u, b, p.x, p.y); if (dist(u.x, u.y, tg.x, tg.y) < TRAINER.attack.range) sling(mt, u, tg); }
      else engage(mt, u, b, c, tg);
    } else { const p = toward(s, c.fo, 2.5); moveTo(mt, u, b, p.x, p.y); }
  } };
}

function pickDefendTarget(mt, u, c, s) {
  let best = null, bs = -1e9;
  for (const e of c.w.queryUnits(s.x, s.y, TOWER_RANGE + 5, null, mt._aiScan6 || (mt._aiScan6 = []))) {
    if (!e.alive || e.team !== 1 - u.team || (e.visible && e.visible[u.team] === false)) continue;
    if (!(e.kind === 'minion' || e.kind === 'champion' || e.mtMon)) continue;
    let sc = e.kind === 'minion' ? (e.subtype === 'siege' || e.subtype === 'super' ? 3 : 1) - e.hp / 400 : 4 - ehp(e) / 1500;
    if (mt.rules && e.kind === 'champion') sc -= (1 - mt.rules.focusHuman(u.team, e)) * 6;
    sc -= dist(s.x, s.y, e.x, e.y) * 0.15;
    if (sc > bs) { bs = sc; best = e; }
  }
  return best;
}

// ------------------------------------------------------------------------------------------------ goal: PUSH / END
function alliedMinionsNear(mt, team, x, y, r) {
  let n = 0;
  for (const e of mt.world.queryUnits(x, y, r, null, mt._aiScanM || (mt._aiScanM = []))) if (e.alive && e.kind === 'minion' && e.team === team) n++;
  return n;
}

/**
 * Siege assessment of the next enemy structure in a lane. Pets deal ×0.34 to protected structures (T2+, inhibitor,
 * Nexus) without an allied minion within the backdoor radius, and towers shoot minions first — so sieges ride waves.
 */
function siegeLane(mt, u, b, c, lane, mode) {
  const TM = c.TM, L = laneState(mt, TM, lane), team = u.team;
  const nx = L.enemyNext; if (!nx) return null;
  const s = nx.s, isTower = s.kind === 'tower';
  const minsUnder = L.minionsUnderNext;
  const minsNear = alliedMinionsNear(mt, team, s.x, s.y, (mt.L.TOWER_CFG && mt.L.TOWER_CFG.backdoorRadius) || 10.5);
  const est = estimateFight(mt, team, s.x, s.y, TOWER_RANGE + 6, { allyExtra: 8 });
  const grouped = est.allies.filter((a) => a.kind === 'champion').length;
  const noBackdoor = mt.rules && mt.rules.M.backdoor === false;   // QUICK mode: monsters hit every structure fully
  const protectedKind = !noBackdoor && ((isTower && s.tier >= 2) || !isTower);
  const dmgOk = !protectedKind || minsNear >= 1 || (mode === 'END' && TM.adv.aliveTheirs === 0);
  const tankOk = isTower && grouped >= 2 && c.hpP > 0.55 && (TM.adv.aliveTheirs <= 1 || s.hp < s.maxHp * 0.3 || (noBackdoor && est.ratio > 1.4));
  const canHit = !s.invulnerable && dmgOk && (!isTower || minsUnder >= 1 || tankOk);
  return { s, L, invuln: s.invulnerable, mins: minsUnder, minsNear, est, grouped, canHit, ts: nx.ts, isTower };
}

function runSiege(mt, u, b, c, lane, info) {
  const team = u.team, { s, L } = info;
  const d = dist(u.x, u.y, s.x, s.y);
  const outside = info.isTower ? TOWER_RANGE + s.radius + 1.1 : 6;
  const stand = toward(s, pointAtTeam(team, lane, Math.max(0, info.ts - 16)), outside);
  // enemies defending: fight them first if we can, else hold back
  const foe = c.fight.enemies.length ? pickFightTarget(mt, u, b, c, c.pet, 9) : null;
  if (foe && c.fight.ratio > 0.9 && d < 26) { engage(mt, u, b, c, foe); return; }
  if (info.canHit) {
    moveTo(mt, u, b, stand.x, stand.y);
    if (d < 20) { petFocus(mt, u, c.pet, s); b.targetId = s.id; }
    return;
  }
  // can't damage it properly yet: stage just behind our wave (or outside tower range) and clear their minions
  const front = L.ownFront != null ? L.ownFront - 3 : info.ts - 15;
  const stage = pointAtTeam(team, lane, Math.max(6, Math.min(front, info.ts - (info.isTower ? 9.5 : 7))));
  moveTo(mt, u, b, stage.x, stage.y);
  let best = null, bd = 1e9;
  for (const e of c.w.queryUnits(c.pet.x, c.pet.y, 8, null, mt._aiScan7 || (mt._aiScan7 = []))) {
    if (!e.alive || e.team !== 1 - team || e.kind !== 'minion') continue;
    if (enemyTowerAt(mt, team, e.x, e.y, -0.5) && info.mins < 2) continue;
    const dd = dist(c.pet.x, c.pet.y, e.x, e.y); if (dd < bd) { bd = dd; best = e; }
  }
  if (best) petFocus(mt, u, c.pet, best);
  else if (c.pet.mtMon.focusId === s.id || enemyTowerAt(mt, team, c.pet.x, c.pet.y, 0)) petRelease(mt, u, c.pet);
}

function scorePush(mt, u, b, c) {
  const { petOk, hpP, call } = c;
  if (!petOk || hpP < 0.4) return null;
  const callLane = call && call.kind === 'push' ? call.lane : null;
  const lane = callLane || c.lane;
  const info = siegeLane(mt, u, b, c, lane, 'PUSH'); if (!info) return null;
  if (info.est.ratio < 0.8 && info.est.enemies.length) return null;
  let uu = 0, why = '';
  const d = dist(u.x, u.y, info.s.x, info.s.y);
  if (callLane) { uu = 0.66 + 0.08 * b.pers.aggression; why = `team call: ${call.why} → ${lane} ${info.s.kind}`; }
  else if (info.canHit && info.mins >= 2 && d < 30) { uu = 0.58 + 0.1 * b.pers.aggression; why = `${info.mins} minions tanking ${lane} ${info.s.kind}${info.s.tier ? ' T' + info.s.tier : ''} (${Math.round(info.s.hp / info.s.maxHp * 100)} %)`; }
  else if (info.canHit && mt.rules && mt.rules.M.backdoor === false && info.grouped >= 2 && d < 30) { uu = 0.56 + 0.1 * b.pers.aggression; why = `group siege on ${lane} ${info.s.kind}${info.s.tier ? ' T' + info.s.tier : ''} (${info.grouped} of us, ${Math.round(info.s.hp / info.s.maxHp * 100)} %)`; }
  if (!uu) return null;
  return { u: uu, why: 'PUSH: ' + why, run: () => runSiege(mt, u, b, c, lane, info) };
}

function scoreEnd(mt, u, b, c) {
  const { call, petOk, hpP } = c;
  if (!call || call.kind !== 'end' || !petOk || hpP < 0.35) return null;
  const info = siegeLane(mt, u, b, c, call.lane, 'END'); if (!info) return null;
  return { u: 0.74, why: `END: ${call.why} → ${call.lane} ${info.s.kind} (${Math.round(info.s.hp / info.s.maxHp * 100)} %)`, run: () => runSiege(mt, u, b, c, call.lane, info) };
}

// ------------------------------------------------------------------------------------------------ goal: OBJECTIVE
function scoreObjective(mt, u, b, c) {
  const { call, petOk, hpP } = c;
  if (!call || call.kind !== 'objective' || !petOk || hpP < 0.45) return null;
  const boss = bossUnit(mt); if (!boss) return null;
  const d = dist(u.x, u.y, boss.x, boss.y);
  if (d > 90) return null;
  return { u: 0.68 + 0.05 * b.pers.aggression, why: `OBJECTIVE: ${call.why} (Ancient ${Math.round(boss.hp / boss.maxHp * 100)} %)`, run: () => {
    // gather on the near edge of the pit, start when two monsters are there (or it is already going)
    const stand = toward(boss, c.fo, 8);
    let ready = 0, onIt = 0;
    for (const m of c.w.champions) {
      if (m.team !== u.team || !m.alive) continue;
      const p = monsters.activeUnit(mt, m); if (!p || !p.alive) continue;
      if (dist(m.x, m.y, boss.x, boss.y) < 16) ready++;
      if (m !== u && (p.mtMon.focusId === boss.id || p.targetId === boss.id)) onIt++;
    }
    const foe = c.fight.enemies.length ? pickFightTarget(mt, u, b, c, c.pet, 9) : null;
    if (foe) { engage(mt, u, b, c, foe); return; }
    moveTo(mt, u, b, stand.x, stand.y);
    if (ready >= 2 || onIt >= 1 || boss.hp < boss.maxHp * 0.25) { petFocus(mt, u, c.pet, boss); b.targetId = boss.id; }
    else if (c.pet.mtMon.focusId === boss.id || c.pet.targetId === boss.id) petRelease(mt, u, c.pet);
  } };
}

// ------------------------------------------------------------------------------------------------ goal: JUNGLE
function pickCamp(mt, u, b, c) {
  const w = mt.world, team = u.team;
  const taken = new Set();
  for (const [id, ob] of mt.trainerBot.brains) if (id !== u.id && ob.goal === 'JUNGLE' && ob.jungle) taken.add(ob.jungle.camp);
  let best = null;
  for (const [cid, st] of w.campState) {
    if (st.camp.epic || taken.has(cid)) continue;
    const units = st.unitIds.map((id) => w.units.get(id)).filter((o) => o && o.alive && o.mtMon && !o.mtMon.capturing);
    if (!units.length) continue;
    const lvl = Math.max(...units.map((o) => o.level || 1));
    if (lvl > c.lvl + 1 + (c.rec && FORMS[c.rec.form].stage ? 2 : 0)) continue;
    const d = dist(u.x, u.y, st.camp.x, st.camp.y);
    if (d > 48) continue;
    if (units[0].mtMon.meadow && (c.lvl > 3 || meadowForHuman(mt, team, cid))) continue;
    let contested = 0;
    for (const e of w.queryUnits(st.camp.x, st.camp.y, 14, null, mt._aiScan8 || (mt._aiScan8 = []))) if (e.alive && e.team === 1 - team && (e.kind === 'champion' || (e.mtMon && e.mtMon.ownerId >= 0)) && !(e.visible && e.visible[team] === false)) contested++;
    if (contested) continue;
    const xp = units.reduce((a, o) => a + XP.wild(o.level || 1), 0);
    let s = xp / (d / 3.6 + 10);
    if (ownSide(team, st.camp.x, st.camp.y) < -6) s *= 0.55 + 0.5 * b.pers.greed;     // invading costs safety
    const ln = nearestLane(st.camp.x, st.camp.y); if (ln.lane === c.lane) s *= 1.15;
    if (!best || s > best.s) best = { s, cid, st, units, xp, lvl };
  }
  return best;
}

/** the starter meadow nearest a team-mate HUMAN with a free party slot (first 2 minutes): bots leave it to them */
function meadowForHuman(mt, team, cid) {
  const w = mt.world; if (w.time >= 120) return false;
  for (const h of w.champions) {
    if (h.team !== team || h.bot || !h.mtTrainer || h.mtTrainer.party.length >= TRAINER.maxParty) continue;
    let bc = null, bd = 1e9;
    for (const [id, st] of w.campState) if (st.camp.mtMeadow) { const d = dist(h.x, h.y, st.camp.x, st.camp.y); if (d < bd) { bd = d; bc = id; } }
    if (bc === cid) return true;
  }
  return false;
}

function scoreJungle(mt, u, b, c) {
  const { petOk, hpP, L, t } = c;
  if (!petOk || hpP < 0.5 || t < 60) return null;
  let cur = b.jungle && c.w.campState.get(b.jungle.camp);
  let units = cur ? cur.unitIds.map((id) => c.w.units.get(id)).filter((o) => o && o.alive && o.mtMon && !o.mtMon.capturing) : [];
  let pick = null;
  if (!units.length || t - b.jungle.since > 40) {
    pick = pickCamp(mt, u, b, c);
    if (!pick) { b.jungle = null; return null; }
    b.jungle = { camp: pick.cid, since: t }; cur = pick.st; units = pick.units;
  }
  const xp = units.reduce((a, o) => a + XP.wild(o.level || 1), 0);
  // lane needs me?  enemy wave pushing with no own wave = lane is fine for the tower to hold briefly
  const laneBusy = L.enemy >= 3 && L.own >= 2 && c.ts.d < 20;
  const lanePressure = L.siege && L.siege.s.kind === 'tower';
  let uu = 0.3 + Math.min(0.25, xp / 900) + 0.15 * b.pers.greed;
  if (laneBusy) uu -= 0.15;
  if (lanePressure) uu -= 0.25;
  if (!L.enemy) uu += 0.12;   // nothing to farm in lane
  const tid = units[0].id;
  return { u: uu, why: `JUNGLE: ${cur.camp.id.replace(/^(blue|red)_/, '')} camp (${units.map((o) => o.name + ' Lv' + o.level).join(', ')}, ~${Math.round(xp)} XP)`, run: () => {
    const tgt = units.slice().sort((a, z) => a.hp - z.hp)[0] || c.w.units.get(tid);
    const d = dist(u.x, u.y, tgt.x, tgt.y);
    b.targetId = tgt.id;
    if (d > 9) { moveTo(mt, u, b, tgt.x, tgt.y); if (d < 14) petFocus(mt, u, c.pet, tgt); return; }
    petFocus(mt, u, c.pet, tgt);
    if (d <= TRAINER.attack.range) sling(mt, u, tgt); else moveTo(mt, u, b, tgt.x, tgt.y);
  } };
}

// ------------------------------------------------------------------------------------------------ goal: FARM_LANE
function scoreFarm(mt, u, b, c) {
  const { L, petOk } = c;
  let uu = petOk ? 0.42 : 0.12;
  if (L.enemy) uu += 0.08;
  const lw = b.laneWhy && c.t - (b.laneWhyT || 0) < 30 ? ' — ' + b.laneWhy : '';
  return { u: uu, why: `FARM ${c.lane}: ${L.own} ours vs ${L.enemy} theirs${lw}`, run: () => runFarm(mt, u, b, c) };
}

function laneAnchor(mt, u, c) {
  const { L } = c;
  let a;
  if (L.ownFront != null && L.enemyFront != null && L.enemyFront - L.ownFront < 16) a = (L.ownFront + L.enemyFront) / 2 - 6;
  else if (L.ownFront != null) a = L.ownFront - 3;
  else if (L.enemyFront != null) a = L.enemyFront - 7;
  else a = L.ownOuter ? L.ownOuter.ts + 10 : L.len / 2 - 10;
  if (L.enemyNext && L.enemyNext.s.kind === 'tower') a = Math.min(a, L.enemyNext.ts - (L.minionsUnderNext >= 2 ? 8.6 : 10));
  if (L.ownOuter && L.enemyFront != null && L.enemyFront < L.ownOuter.ts + 4) a = Math.min(a, L.ownOuter.ts - 2.5);
  return Math.max(6, a);
}

function runFarm(mt, u, b, c) {
  const { L, pet, petOk } = c;
  const a = laneAnchor(mt, u, c);
  const p = pointAtTeam(u.team, c.lane, a);
  moveTo(mt, u, b, p.x, p.y);
  if (!petOk) return;
  // pick a minion for the monster: lowest effective hp within reach, never under the enemy tower
  let best = null, bs = 1e9;
  for (const e of c.w.queryUnits(pet.x, pet.y, 8.5, null, mt._aiScan9 || (mt._aiScan9 = []))) {
    if (!e.alive || e.team !== 1 - u.team || e.kind !== 'minion') continue;
    if (enemyTowerAt(mt, u.team, e.x, e.y, 0.3) && L.minionsUnderNext < 2) continue;
    const sc = e.hp + dist(pet.x, pet.y, e.x, e.y) * 25;
    if (sc < bs) { bs = sc; best = e; }
  }
  if (best && dist(u.x, u.y, best.x, best.y) < 11) {
    petFocus(mt, u, pet, best); b.targetId = best.id;
    if (dist(u.x, u.y, best.x, best.y) <= TRAINER.attack.range && !c.fight.enemies.length && !enemyTowerAt(mt, u.team, best.x, best.y, 0.5)) sling(mt, u, best);
  } else if (pet.mtMon.focusId >= 0 && enemyTowerAt(mt, u.team, pet.x, pet.y, 0)) petRelease(mt, u, pet);
}

// ------------------------------------------------------------------------------------------------ micro
function micro(mt, u, b) {
  const w = mt.world, t = w.time;
  if (u.recallStart != null) return;
  // capture throw timing between thinks
  if (b.goal === 'CAPTURE' && b.capture) {
    const tgt = w.units.get(b.capture.tid), T = u.mtTrainer;
    if (tgt && isCapturable(tgt) && t >= T.cdEnd.capture && dist(u.x, u.y, tgt.x, tgt.y) <= CAPTURE.range - 0.4) {
      const p = captureChance(tgt, t), pet = monsters.activeUnit(mt, u);
      const hitDmg = pet && pet.alive ? pet.stats.ad * mult(mt, pet, tgt) * 1.25 + 40 : TRAINER.attack.damage * 1.2;
      const pNeed = Math.max(0.3, 0.74 - 0.32 * b.pers.greed);
      if (p >= pNeed || (tgt.hp < hitDmg * 1.6 && p >= 0.18)) {
        if (cmd(mt, u, { type: 'capture', targetId: tgt.id, confirm: true })) {
          mt.trainerBot.stats.captureThrows++;
          act(mt, b, `THROW orb at ${tgt.name} (p=${(p * 100).toFixed(0)} %)`);
          cmd(mt, u, { type: 'stop' }); petRelease(mt, u, pet);
        }
      }
    }
  }
  // kite: an enemy monster/trainer is attacking ME -> step back toward safety (the monster keeps fighting)
  if (t >= (b.kiteUntil || 0) + 0.4 && t >= (b.kiteSkipUntil || 0) && b.goal !== 'DEAD') {
    let att = null, ad = 7.5;
    for (const e of w.queryUnits(u.x, u.y, 7.5, null, mt._aiScanK || (mt._aiScanK = []))) {
      if (!e.alive || e.team !== 1 - u.team || !(e.mtMon || e.kind === 'champion')) continue;
      const on = e.targetId === u.id || e.attackTargetId === u.id || (e.order && e.order.targetId === u.id) || (e.mtMon && e.mtMon.focusId === u.id);
      if (!on) continue;
      const d = dist(u.x, u.y, e.x, e.y); if (d < ad) { ad = d; att = e; }
    }
    const tough = b.goal === 'FIGHT' && u.hp / u.maxHp > 0.7 && b.pers.aggression > 0.6;
    // difficulty: a sloppier bot misses most kite opportunities (and does not re-check for a moment)
    const misses = att && !tough && b.skill && b.skill.kite < 1 && rand01(w, u.id, 0x4b17) > b.skill.kite;
    if (misses) b.kiteSkipUntil = t + 1.2;
    else if (att && !tough && (att.mtMon || u.hp / u.maxHp < 0.8)) {
      const fo = fountainOf(u.team);
      const ax = u.x - att.x, ay = u.y - att.y, al = Math.hypot(ax, ay) || 1;
      const fx = fo.x - u.x, fy = fo.y - u.y, fl = Math.hypot(fx, fy) || 1;
      let dx = ax / al * 0.65 + fx / fl * 0.35, dy = ay / al * 0.65 + fy / fl * 0.35; const dl = Math.hypot(dx, dy) || 1;
      dx /= dl; dy /= dl;
      const p = w.nav && w.nav.walkable && !w.nav.walkable(u.x + dx * 4, u.y + dy * 4, 0.4) ? { x: u.x + fx / fl * 4, y: u.y + fy / fl * 4 } : { x: u.x + dx * 4, y: u.y + dy * 4 };
      b.moveReq = null; moveTo(mt, u, b, p.x, p.y, true); b.kiteUntil = t + 0.9;
      if (!b._kiteT || t - b._kiteT > 3) { b._kiteT = t; act(mt, b, `kite away from ${att.name}`, 'kite'); }
    }
  }
  // dodge telegraphed AoE (boss Gale Burst, enemy Flame Pillar): trainer steps out, a hurt monster is pulled back
  for (const g of mt.trainerBot.tele || []) {
    if (g.team === u.team || g.until - t < 0.1) continue;
    if (b.skill && b.skill.kite < 1) {   // difficulty: each telegraph is noticed (or not) once
      const dec = g.dec || (g.dec = {});
      if (dec[u.id] === undefined) dec[u.id] = rand01(w, u.id, 0x4b18) <= b.skill.kite;
      if (!dec[u.id]) continue;
    }
    const du = dist(u.x, u.y, g.x, g.y);
    if (du < g.r + 0.6) {
      const p = du > 0.2 ? toward(g, { x: u.x, y: u.y }, g.r + 1.6) : { x: g.x + g.r + 1.6, y: g.y };
      b.moveReq = null; moveTo(mt, u, b, p.x, p.y, true);
      if (!b._dodgeT || t - b._dodgeT > 2) { b._dodgeT = t; act(mt, b, `dodge ${g.what}`, 'dodge'); }
    }
    const pt = monsters.activeUnit(mt, u);
    if (pt && pt.alive && pt.hp / pt.maxHp < 0.6 && g.until - t > 0.35 && dist(pt.x, pt.y, g.x, g.y) < g.r + 0.3 && dist(u.x, u.y, g.x, g.y) > g.r + 1) {
      petRelease(mt, u, pt);
      if (!b._pdodgeT || t - b._pdodgeT > 2) { b._pdodgeT = t; act(mt, b, `pull ${pt.name} out of ${g.what}`, 'dodge_pet'); }
    }
  }
  // tower dance: our monster is the tower's target and getting low -> pull it back so the tower retargets
  const pet = monsters.activeUnit(mt, u);
  if (pet && pet.alive && pet.lastHitTime > t - 0.5 && pet.hp / pet.maxHp < 0.5 && !(b.skill && b.skill.kite < 0.5)) {
    const src = w.units.get(pet.lastDamagedBy);
    if (src && src.kind === 'tower' && src.targetId === pet.id && src.team !== u.team) {
      petRelease(mt, u, pet);
      if (dist(u.x, u.y, src.x, src.y) < TOWER_RANGE + 3.5) { const p = toward(src, { x: u.x, y: u.y }, TOWER_RANGE + src.radius + 3); b.moveReq = null; moveTo(mt, u, b, p.x, p.y); }
      if (!b._danceT || t - b._danceT > 3) { b._danceT = t; act(mt, b, `tower dance: pull ${pet.name} out of ${src.kind} fire`, 'tower_dance'); }
    }
  }
  // tower aggro escape
  if (u.lastHitTime > t - 0.4 && b.goal !== 'END') {
    const src = w.units.get(u.lastDamagedBy);
    if (src && src.kind === 'tower' && src.team !== u.team) {
      const p = toward(src, { x: u.x, y: u.y }, TOWER_RANGE + src.radius + 2.5);
      b.moveReq = null; moveTo(mt, u, b, p.x, p.y, true);
    }
  }
  // stuck watchdog
  const o = u.order;
  if (o && o.type === 'move') {
    if (dist(u.x, u.y, b.stuck.x, b.stuck.y) > 0.6) b.stuck = { x: u.x, y: u.y, t };
    else if (t - b.stuck.t > 2.5) {
      const a = rand01(w, u.id, 77) * Math.PI * 2;
      b.moveReq = null; b.stuck = { x: u.x, y: u.y, t };
      cmd(mt, u, { type: 'move', x: u.x + Math.cos(a) * 3, y: u.y + Math.sin(a) * 3 });
    }
  } else b.stuck = { x: u.x, y: u.y, t };
}

// ------------------------------------------------------------------------------------------------ debug
export function botState(mt) {
  const w = mt.world, TB = mt.trainerBot;
  const bots = [];
  for (const u of w.champions) {
    if (!u.mtTrainer) continue;
    const b = TB.brains.get(u.id);
    const party = u.mtTrainer.party.map((r, i) => `${FORMS[r.form].name} Lv${r.level}${r.fainted ? ' (fainted)' : ''}${i === u.mtTrainer.activeIdx ? '*' : ''}`).join(' / ') || '—';
    const tg = b && b.targetId >= 0 ? w.units.get(b.targetId) : null;
    bots.push({
      id: u.id, name: u.name, team: u.team, bot: !!u.bot, alive: u.alive, spec: u.mtTrainer.spec,
      lane: TB.teams[u.team].lanes.get(u.id) || null, party, hp: Math.round(u.hp / u.maxHp * 100),
      goal: b ? b.goal : u.bot ? 'IDLE' : 'HUMAN', why: b ? b.why : '', score: b ? b.score : 0,
      since: b ? +b.since.toFixed(1) : 0, top: b ? b.top : [], target: tg ? `${tg.name || tg.kind}#${tg.id}` : null,
      pers: b ? b.pers : null, actions: b ? b.actions.slice(-4) : [], history: b ? b.history.slice(-6) : [],
      x: +u.x.toFixed(1), y: +u.y.toFixed(1),
    });
  }
  return {
    time: +w.time.toFixed(1), bots,
    teams: TB.teams.map((TM) => ({ team: TM.team, call: TM.call ? { kind: TM.call.kind, lane: TM.call.lane || null, why: TM.call.why } : null, adv: TM.adv, log: TM.log.slice(-6) })),
    stats: TB.stats,
  };
}

void recordPower; void activeLevel; void ehp;
