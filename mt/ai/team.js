// mt/ai/team.js — per-team coordination for trainer bots: lane assignment (one trainer per lane, rebalanced by
// type matchups / empty lanes), lane state snapshots, and team CALLS (objective, defend, push, end) plus a fight
// registry so allies collapse on fights. Owner: AI specialist. Read-only over the world (outputs live in brains).

import { FORMS } from '../data/species.js';
import { typeMultiplier } from '../data/types.js';
import * as monsters from '../sim/monsters.js';
import { LANE_IDS, progressOf, pointAtTeam, nearestLane, BOSS_PIT, laneLen } from './geo.js';
import { minionsUnder, estimateFight, TOWER_RANGE, dps, ehp } from './assess.js';

const ROLE_LANE = { baron: 'top', mid: 'mid', duo: 'bot', support: 'bot', jungle: 'mid' };
/** lanes with waves + structures this match (QUICK mode: mid only — mt/sim/rules.js) */
export const lanesOf = (mt) => (mt.rules ? mt.rules.lanes : LANE_IDS);
const laneOk = (mt, l) => lanesOf(mt).includes(l);
/** team-level bot skill (difficulty): the profile of this team's bots (mt/data/options.js BOT_SKILL) */
function teamSkill(mt, team) {
  const c = mt.world.champions.find((x) => x.team === team && x.mtTrainer && x.bot);
  return c && mt.rules ? mt.rules.botSkill(c) : null;
}

export function makeTeam(team) {
  return {
    team, lanes: new Map(), enemyLane: new Map(), nextLaneEval: 20, call: null, fights: [], laneCache: new Map(),
    log: [], nextUpdate: 0, adv: { level: 0, alive: 0, structures: 0 },
  };
}

const trainersOf = (w, team) => w.champions.filter((c) => c.team === team && c.mtTrainer);
export const activeLevel = (c) => { const r = monsters.activeRecord(c); return r ? r.level : 0; };
function avgLevel(list) { let s = 0, n = 0; for (const c of list) for (const r of c.mtTrainer.party) { s += r.level; n++; } return n ? s / n : 0; }

function note(TM, t, text) { TM.log.push({ t: +t.toFixed(1), text }); if (TM.log.length > 30) TM.log.shift(); }

// ------------------------------------------------------------------------------------------------ lane state
/**
 * Snapshot of one lane from `team`'s point of view (team-frame progress `ts`: 0 = own base, len = enemy base).
 * Cached per tick.
 */
export function laneState(mt, TM, lane) {
  const w = mt.world, key = lane, c = TM.laneCache.get(key);
  if (c && c.tick === w.tickNo) return c;
  const team = TM.team, len = laneLen(lane);
  let ownFront = null, enemyFront = null, own = 0, enemy = 0;
  for (const u of w.unitList) {
    if (u.kind !== 'minion' || !u.alive || u.lane !== lane) continue;
    if (u.team !== team && u.visible && u.visible[team] === false) continue;
    const { ts } = progressOf(team, lane, u.x, u.y);
    if (u.team === team) { own++; if (ownFront === null || ts > ownFront) ownFront = ts; }
    else { enemy++; if (enemyFront === null || ts < enemyFront) enemyFront = ts; }
  }
  // structures in lane order
  const order = (s) => (s.kind === 'tower' ? (s.lane === 'base' ? 5 : s.tier) : s.kind === 'inhibitor' ? 4 : 6);
  const mine = [], theirs = [];
  for (const s of w.structures) {
    if (!(s.lane === lane || s.lane === 'base' || s.kind === 'nexus')) continue;
    const e = { s, order: order(s), ts: progressOf(team, lane, s.x, s.y).ts };
    (s.team === team ? mine : theirs).push(e);
  }
  mine.sort((a, b) => a.order - b.order); theirs.sort((a, b) => a.order - b.order);
  const ownOuter = mine.find((e) => e.s.alive && e.s.kind === 'tower') || null;     // outermost alive own tower
  const enemyNext = theirs.find((e) => e.s.alive) || null;                         // next enemy structure to take
  // siege on my structures: enemies inside range
  let siege = null;
  for (const e of mine) {
    if (!e.s.alive) continue;
    let pets = 0, mins = 0;
    for (const u of w.queryUnits(e.s.x, e.s.y, TOWER_RANGE + 4, null, mt._aiScan3 || (mt._aiScan3 = []))) {
      if (!u.alive || u.team === team || u.team === 2) continue;
      if (u.visible && u.visible[team] === false) continue;
      if (u.kind === 'minion') mins++; else if (u.kind === 'champion' || u.mtMon) pets++;
    }
    if (pets || mins >= 2) { siege = { s: e.s, ts: e.ts, pets, mins, order: e.order }; break; }
  }
  const res = { tick: w.tickNo, lane, len, ownFront, enemyFront, own, enemy, ownOuter, enemyNext, mine, theirs, siege,
    minionsUnderNext: enemyNext ? minionsUnder(mt, enemyNext.s, team) : 0 };
  TM.laneCache.set(key, res);
  return res;
}

// ------------------------------------------------------------------------------------------------ lanes
function matchup(myRec, theirRec) {
  if (!myRec || !theirRec) return 0;
  const a = FORMS[myRec.form], b = FORMS[theirRec.form];
  const off = typeMultiplier(a.types[0], b.types), def = typeMultiplier(b.types[0], a.types);
  return Math.log(off) - Math.log(def) + 0.12 * (myRec.level - theirRec.level);
}

function permutations(arr) {
  if (arr.length <= 1) return [arr.slice()];
  const out = [];
  arr.forEach((x, i) => { for (const p of permutations([...arr.slice(0, i), ...arr.slice(i + 1)])) out.push([x, ...p]); });
  return out;
}

function updateLanes(mt, TM, brains) {
  const w = mt.world, team = TM.team, t = w.time;
  const mates = trainersOf(w, team);
  // remember where enemies lane (only when seen near a lane, laning phase)
  for (const e of trainersOf(w, 1 - team)) {
    if (!e.alive || (e.visible && e.visible[team] === false)) continue;
    const nl = nearestLane(e.x, e.y);
    if (nl.d < 9) { const { ts } = progressOf(team, nl.lane, e.x, e.y); if (ts > 25 && ts < laneLen(nl.lane) - 25) TM.enemyLane.set(e.id, nl.lane); }
  }
  // initial / human lanes
  const lanes = lanesOf(mt);
  for (const c of mates) {
    if (!TM.lanes.has(c.id) || !laneOk(mt, TM.lanes.get(c.id))) TM.lanes.set(c.id, laneOk(mt, ROLE_LANE[c.role]) ? ROLE_LANE[c.role] : lanes.includes('mid') ? 'mid' : lanes[0]);
    if (!c.bot && c.alive) { const nl = nearestLane(c.x, c.y); if (nl.d < 10 && laneOk(mt, nl.lane)) TM.lanes.set(c.id, nl.lane); }
  }
  const bots = mates.filter((c) => c.bot && brains.has(c.id));
  if (!bots.length) return;
  if (lanes.length === 1) { for (const b of bots) TM.lanes.set(b.id, lanes[0]); return; }   // QUICK: everyone plays mid
  const humanLanes = new Set(mates.filter((c) => !c.bot).map((c) => TM.lanes.get(c.id)));
  const free = lanes.filter((l) => !humanLanes.has(l));
  while (free.length < bots.length) free.push('mid');
  if (t < TM.nextLaneEval) {
    // repair: two bots on one lane while a lane is empty (e.g. a human moved lanes)
    const used = new Map(); for (const b of bots) { const l = TM.lanes.get(b.id); used.set(l, (used.get(l) || 0) + 1); }
    const empty = free.filter((l) => !used.get(l));
    for (const b of bots) {
      const l = TM.lanes.get(b.id);
      if (empty.length && (used.get(l) > 1 || humanLanes.has(l))) { const nl = empty.shift(); used.set(l, used.get(l) - 1); TM.lanes.set(b.id, nl); note(TM, t, `${b.name} rotates to ${nl} (lane was empty)`); }
    }
    return;
  }
  TM.nextLaneEval = t + 45;
  if (t < 150 || t > 600) return; // parties settle first; lanes stop mattering once the team groups up
  // matchup-driven permutation (counter-picking the enemy laner by type)
  const enemyByLane = {};
  for (const e of trainersOf(w, 1 - team)) { const l = TM.enemyLane.get(e.id); if (l) (enemyByLane[l] || (enemyByLane[l] = [])).push(e); }
  const lanesForBots = free.slice(0, bots.length);
  let best = null, bestScore = -1e9, cur = 0;
  const scoreOf = (perm) => {
    let s = 0;
    perm.forEach((lane, i) => {
      const me = monsters.activeRecord(bots[i]);
      for (const e of enemyByLane[lane] || []) s += matchup(me, monsters.activeRecord(e));
      // walking across the map costs XP: travel distance to the lane's middle
      if (TM.lanes.get(bots[i].id) !== lane) { const mid = pointAtTeam(team, lane, laneLen(lane) * 0.42); s -= 0.3 + Math.hypot(bots[i].x - mid.x, bots[i].y - mid.y) / 55; }
    });
    return s;
  };
  cur = scoreOf(bots.map((b) => TM.lanes.get(b.id)));
  for (const perm of permutations(lanesForBots)) { const s = scoreOf(perm); if (s > bestScore + 1e-9) { bestScore = s; best = perm; } }
  if (best && bestScore > cur + 0.8) {
    bots.forEach((b, i) => {
      const from = TM.lanes.get(b.id);
      if (from !== best[i]) {
        TM.lanes.set(b.id, best[i]);
        const br = brains.get(b.id); if (br) { br.laneWhy = `lane swap ${from}→${best[i]} (type matchup)`; br.laneWhyT = t; }
        if (mt.trainerBot) mt.trainerBot.stats.laneSwaps++;
        note(TM, t, `${b.name} swaps ${from}→${best[i]} for a better type matchup`);
      }
    });
  }
}

// ------------------------------------------------------------------------------------------------ calls
export function bossUnit(mt) {
  const st = mt.world.campState && mt.world.campState.get('drake');
  if (!st) return null;
  for (const id of st.unitIds) { const u = mt.world.units.get(id); if (u && u.alive) return u; }
  return null;
}

function computeAdvantage(mt, TM) {
  const w = mt.world, team = TM.team;
  const mine = trainersOf(w, team), theirs = trainersOf(w, 1 - team);
  const alive = (l) => l.filter((c) => c.alive && c.mtTrainer.party.some((r) => !r.fainted)).length;
  const lostStructs = (tm) => w.structures.filter((s) => s.team === tm && !s.alive).length;
  TM.adv = {
    level: avgLevel(mine) - avgLevel(theirs),
    alive: alive(mine) - alive(theirs),
    aliveMine: alive(mine), aliveTheirs: alive(theirs),
    structures: lostStructs(1 - team) - lostStructs(team),
    enemyInhibDown: w.structures.some((s) => s.team !== team && s.kind === 'inhibitor' && !s.alive),
    enemyBaseOpen: w.structures.some((s) => s.team !== team && s.kind === 'tower' && s.lane === 'base' && !s.alive),
    avgActive: mine.length ? mine.reduce((a, c) => a + activeLevel(c), 0) / mine.length : 0,
  };
  return TM.adv;
}

function updateCalls(mt, TM, brains) {
  const w = mt.world, team = TM.team, t = w.time, A = computeAdvantage(mt, TM);
  const prev = TM.call;
  const LANES = lanesOf(mt);
  const S = teamSkill(mt, team), obj = (S ? S.objective : 1) / (mt.rules ? mt.rules.M.aiTime : 1);   // difficulty: objective greed (< 1 = later, more cautious) / QUICK: shorter match (push calls earlier)
  let call = null;
  // DEFEND: base / inner structures under siege outrank everything
  for (const lane of LANES) {
    const L = laneState(mt, TM, lane);
    if (!L.siege) continue;
    const prio = L.siege.order >= 4 ? 3 : L.siege.order >= 2 ? 2 : 1;
    if (prio < 2 && L.siege.pets < 2) continue;
    if (!L.siege.pets && (prio < 3 || L.siege.mins < 3)) continue;   // minion-only pressure: the lane owner handles it
    if (!call || prio > call.prio) call = { kind: 'defend', x: L.siege.s.x, y: L.siege.s.y, lane, prio, sid: L.siege.s.id, why: `${L.siege.s.kind} ${lane} under siege (${L.siege.pets} monsters, ${L.siege.mins} minions)` };
  }
  // END: enemy base is open and we are not behind in numbers -> group and push the open lane
  const endKeep = prev && prev.kind === 'end' && A.aliveMine >= 2 && A.alive >= -1;
  if (!call && (A.enemyInhibDown || A.enemyBaseOpen) && ((A.alive >= 0 && A.aliveMine >= 2) || endKeep)) {
    let lane = null, bestN = 99;
    for (const l of LANES) { const L = laneState(mt, TM, l); if (!L.enemyNext) continue; const n = L.enemyNext.order; if (L.theirs.some((e) => e.s.kind === 'inhibitor' && !e.s.alive)) { lane = l; break; } if (6 - n < bestN) { bestN = 6 - n; lane = l; } }
    if (endKeep && prev.lane && laneState(mt, TM, prev.lane).enemyNext) lane = prev.lane;
    if (lane) call = { kind: 'end', lane, why: 'enemy base open: group and end' };
  }
  // OBJECTIVE: Ancient boss when ahead / safe
  const boss = bossUnit(mt);
  if (!call && boss) {
    const near = estimateFight(mt, team, BOSS_PIT.x, BOSS_PIT.y, 20);
    const enemiesNear = near.enemies.filter((u) => u.kind === 'champion').length;
    const ahead = A.alive >= 1 || A.level >= 1 || (t > 840 && A.alive >= 0 && A.level >= 0.4 && !enemiesNear);
    // can we actually kill it?  team monster DPS vs its EHP, and our EHP vs its damage (incl. Gale Burst)
    const bossEhp = boss.hp * (1 + (boss.stats.armor || 35) / 100);
    const bossDps = (boss.stats.ad || 90) * (boss.stats.attackSpeed || 0.6) * 0.75 + 130 / 7 * 1.5;
    let tDps = 0, tEhp = 0, n = 0, onIt = 0;
    for (const c of trainersOf(w, team)) {
      const p = monsters.activeUnit(mt, c);
      if (!c.alive || !p || !p.alive) continue;
      if (p.targetId === boss.id || p.mtMon.focusId === boss.id) onIt++;
      if (p.hp / p.maxHp < 0.45) continue;
      tDps += dps(mt, p); tEhp += ehp(p); n++;
    }
    const ttk = bossEhp / Math.max(1, tDps), tSurv = tEhp / bossDps;
    const og = S ? S.objective : 1;
    const feasible = n >= 2 && ttk < 50 * og && ttk < tSurv * 0.75 * og;
    const committed = prev && prev.kind === 'objective' && onIt >= 1 && boss.hp < boss.maxHp * 0.7 && A.alive >= 0;
    if ((ahead && feasible && A.aliveMine >= 2 && enemiesNear <= A.aliveMine - 1) || committed) {
      call = { kind: 'objective', x: boss.x, y: boss.y, bossId: boss.id, ttk: Math.round(ttk),
        why: committed ? 'finish the Ancient' : `Ancient: ahead (alive ${A.alive >= 0 ? '+' : ''}${A.alive}, lvl ${A.level >= 0 ? '+' : ''}${A.level.toFixed(1)}), ~${Math.round(ttk)} s kill` };
    }
  }
  // PUSH: numbers advantage mid/late game, or late-game grouping to force the end
  const pushKeep = prev && prev.kind === 'push' && t - prev.since < 75 && A.alive >= 0 && A.aliveMine >= 2;
  if (!call && ((t >= 480 / obj && A.alive >= 2) || (t >= 600 / obj && A.alive >= 1 && A.level >= -0.5) || (t >= 960 / obj && A.alive >= 0 && A.aliveMine >= 2) || pushKeep)) {
    let lane = null, bestOrder = -1, bestMins = -1;
    for (const l of LANES) {
      const L = laneState(mt, TM, l); if (!L.enemyNext) continue;
      if (L.enemyNext.order > bestOrder || (L.enemyNext.order === bestOrder && L.own > bestMins)) { bestOrder = L.enemyNext.order; bestMins = L.own; lane = l; }
    }
    if (prev && (prev.kind === 'push') && prev.lane && laneState(mt, TM, prev.lane).enemyNext) lane = prev.lane;
    if (lane) call = { kind: 'push', lane, why: A.alive >= 1 ? `numbers advantage (+${A.alive})` : 'late game: group and siege' };
  }
  if (call) call.since = prev && prev.kind === call.kind && prev.lane === call.lane ? prev.since : t;
  if (call && (!prev || prev.kind !== call.kind || prev.lane !== call.lane)) note(TM, t, `CALL ${call.kind}${call.lane ? ' ' + call.lane : ''}: ${call.why}`);
  if (!call && prev) note(TM, t, `call ${prev.kind} ended`);
  TM.call = call;
}

/** Brains report engagements here; allies use them to collapse. */
export function reportFight(TM, t, x, y, ratio, by) {
  TM.fights = TM.fights.filter((f) => t - f.t < 2 && f.by !== by);
  TM.fights.push({ t, x, y, ratio, by });
}

export function updateTeam(mt, TM, brains) {
  const t = mt.world.time;
  if (t < TM.nextUpdate) return;
  TM.nextUpdate = t + 1;
  TM.laneCache.clear();
  updateLanes(mt, TM, brains);
  updateCalls(mt, TM, brains);
  TM.fights = TM.fights.filter((f) => t - f.t < 2);
}

export { pointAtTeam };
