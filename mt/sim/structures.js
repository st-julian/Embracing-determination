// mt/sim/structures.js — towers, structure gating, destruction (DESIGN.md §10). Owner: lane/structures specialist.
//
// Legacy kept: structure stats (F_/I_/L_), tower attack loop (zS), tower-vs-minion % max-HP shots ($v), fortify
// (tier-1 ×0.5 before 3:00 without minions), regen, inhibitor respawn, gold, ANNOUNCE/STRUCTURE_DESTROYED/VICTORY.
//
// mt rules on top:
//  * Target priority ([MT-HOOK] towerTarget): enemy trainer/monster that is hitting an allied trainer/monster in range
//    (aggro) > closest minion > closest monster > trainer. A tower keeps its current target while it stays valid
//    (LoL-style: no ping-pong between minions) unless an aggro target appears.
//  * Shots ramp +25 %/shot on the same monster/trainer (cap ×2); the ramp resets when the tower changes target or has
//    not fired for TOWER_CFG.heatResetAfter s. The legacy champion heat ramp is divided out for trainers.
//  * Aggro is recorded from ANY damage (basic attacks AND monster abilities) through the post-damage hook.
//  * Backdoor protection also covers monsters: a pet hitting a tier ≥ 2 tower / inhibitor / Nexus with no allied
//    minion within TOWER_CFG.backdoorRadius deals ×TOWER_CFG.backdoorMult (legacy only covered champions) —
//    sieging needs a minion wave, so lane farming/pushing matters all game.
//  * Gating: per lane Outer(T1) → Inner(T2) → T3 → Inhibitor; base tower(s) (tier 4) need ≥ 1 inhibitor down;
//    the Nexus needs ≥ 1 inhibitor down AND every base tower destroyed (an all-inhibitors-respawned base re-shields it).
//  * Destruction: `mt_structure_destroyed` (position/kind/team/lane/tier/killer + shake/debris hints) for VFX, and on
//    the Nexus `mt_match_end` (winner, slow-mo hint, team + trainer stats) for the victory/defeat screen.

import { STRUCTURES } from '../data/balance.js';
import { KIND, TEAM, dist2, isPet, isTrainer } from './util.js';
import { FORMS } from '../data/species.js';

const LANES = ['top', 'mid', 'bot'];
/** Seconds a unit counts as "hitting an ally" after damaging an allied trainer/monster (legacy aggroWindow = 2). */
const AGGRO_WINDOW = 2;
/** Destruction presentation hints (VFX / camera), per structure kind. */
const DESTROY_FX = {
  tower: { shake: 0.55, debris: 16 },
  inhibitor: { shake: 0.65, debris: 12 },
  nexus: { shake: 1, debris: 32 },
};
const NEXUS_SLOWMO = { scale: 0.25, duration: 2.6 };

export function install(mt) {
  mt.impl.towerTarget = pickTarget;
  mt.damageScalers.push(ramp, petBackdoor);
  mt.on('damage', recordAggro);
  mt.on('preTick', applyGating);
  mt.on('kill', onKill);
}

// ------------------------------------------------------------------------------------------------ aggro memory
/**
 * Post-damage: remember that `src` (enemy trainer/monster) just hurt a trainer/monster of the other team.
 * Read by tower targeting and by minions.js (call for help).
 */
function recordAggro(mt, src, tgt) {
  if (!src || !tgt || src === tgt) return;
  if (src.team !== TEAM.BLUE && src.team !== TEAM.RED) return;
  if (!(isTrainer(src) || isPet(src))) return;
  if (tgt.team === src.team || !(isTrainer(tgt) || isPet(tgt))) return;
  src.mtHitAllyT = mt.world.time; src.mtHitAllyId = tgt.id;
}

/**
 * Is `u` currently hurting a trainer/monster of `team` that stands within `radius` of (x, y)?
 * Shared with minions.js. Uses recorded damage (attacks + abilities) and attacks still winding up.
 */
export function hurtingAllyOf(mt, u, team, x, y, radius, window = AGGRO_WINDOW) {
  const w = mt.world;
  const r2 = radius * radius;
  const check = (id) => {
    const v = id >= 0 ? w.units.get(id) : null;
    return !!(v && v.alive && v.team === team && (isTrainer(v) || isPet(v)) && dist2(x, y, v.prevX, v.prevY) <= r2);
  };
  if (u.mtHitAllyT > w.time - window && check(u.mtHitAllyId)) return true;
  return u.attackWindupEnd > 0 && check(u.attackTargetId);
}

// ------------------------------------------------------------------------------------------------ targeting
function valid(mt, tower, u) {
  return !!u && u.alive && !u.removed && u.team !== tower.team && u.team !== TEAM.NEUTRAL && u.kind !== KIND.WARD &&
    !mt.L.isStructure(u) && !(u.mtMon && (u.mtMon.capturing || u.mtMon.ownerId < 0)) && mt.L.isTargetable(mt.world, tower, u) &&
    mt.L.edgeDistPrev(tower, u) <= tower.stats.attackRange;
}

const CLASS = { aggro: 0, minion: 1, monster: 2, trainer: 3 };

function classOf(mt, tower, u) {
  if (u.kind === KIND.MINION) return CLASS.minion;
  if (u.mtTrainer && mt.rules && mt.rules.focusHuman(tower.team, u) < 0.5) return CLASS.trainer;   // Easy: a HUMAN trainer last
  if (hurtingAllyOf(mt, u, tower.team, tower.x, tower.y, tower.stats.attackRange + 1.5)) return CLASS.aggro;
  return u.mtMon ? CLASS.monster : CLASS.trainer;
}

/** [MT-HOOK] towerTarget. @returns {object|null} */
export function pickTarget(mt, tower) {
  const w = mt.world;
  let cur = tower.targetId >= 0 ? w.units.get(tower.targetId) : null;
  if (!valid(mt, tower, cur)) cur = null;
  const curCls = cur ? classOf(mt, tower, cur) : 9;
  const list = w.queryUnits(tower.x, tower.y, tower.stats.attackRange + 2.5, (u) => valid(mt, tower, u), mt._towerScan || (mt._towerScan = []));
  let best = null, bc = 9, bd = 1e9;
  for (const u of list) {
    const c = classOf(mt, tower, u);
    const d = dist2(tower.x, tower.y, u.prevX, u.prevY);
    if (c < bc || (c === bc && (d < bd || (d === bd && u.id < best.id)))) { best = u; bc = c; bd = d; }
  }
  // stickiness: keep a valid current target unless a punish (aggro) target shows up and the current one is not one
  if (cur && (curCls === CLASS.aggro || bc !== CLASS.aggro)) best = cur;
  if (best !== cur) {
    tower.mtRampId = best ? best.id : -1; tower.mtRampShots = 0;
    if (best) {
      mt.emit(mt.E.TOWER_TARGET, {
        tower: tower.id, target: best.id, team: tower.team, x: tower.x, y: tower.y, aggro: bc === CLASS.aggro,
        targetKind: best.kind === KIND.MINION ? 'minion' : best.mtMon ? 'monster' : 'trainer',
      });
    }
  }
  return best;
}

/** +25 %/shot on the same trainer/monster (cap ×2). Legacy heat (champions only) is divided out. */
function ramp(mt, src, tgt, type, source) {
  if (!src || src.kind !== KIND.TOWER || source !== 'tower' || !tgt) return 1;
  if (!(tgt.kind === KIND.CHAMPION || tgt.mtMon)) return 1;
  const t = mt.world.time, C = mt.L.TOWER_CFG;
  if (src.mtRampId !== tgt.id || t - (src.mtRampT ?? -99) > (C.heatResetAfter || 3)) { src.mtRampId = tgt.id; src.mtRampShots = 0; }
  const m = Math.min(STRUCTURES.rampCap, 1 + STRUCTURES.rampPerShot * (src.mtRampShots || 0));
  src.mtRampShots = (src.mtRampShots || 0) + 1; src.mtRampT = t;
  // legacy $v already multiplied champion shots by (1 + min(cap, stacks*perShot)) before _v; undo it.
  let legacy = 1;
  if (tgt.kind === KIND.CHAMPION) legacy = 1 + Math.min(C.warmupCap, Math.max(0, (src.heatStacks || 1) - 1) * C.warmupPerShot);
  return m / legacy;
}

/** Any living minion of `team` within r of (x, y)? */
function minionNear(mt, team, x, y, r) {
  const list = mt.world.queryUnits(x, y, r, (u) => u.alive && u.kind === KIND.MINION && u.team === team, mt._bdScan || (mt._bdScan = []));
  return list.length > 0;
}

/** Backdoor protection for monsters (legacy hv() only covers champion attackers). */
function petBackdoor(mt, src, tgt) {
  if (!src || !tgt || !mt.L.isStructure(tgt) || (src.team !== 0 && src.team !== 1) || tgt.team === src.team) return 1;
  // QUICK mode overtime (rules.js): structures take more damage the longer the match runs
  const OT = mt.rules && mt.rules.M.overtime, t = mt.world.time;
  const ot = OT && t > OT.from ? Math.min(OT.cap, 1 + OT.perMin * (t - OT.from) / 60) + (OT.late && t > OT.late ? OT.latePerMin * (t - OT.late) / 60 : 0) : 1;
  if (!isPet(src) || (mt.rules && mt.rules.M.backdoor === false)) return ot;
  const protectedKind = (tgt.kind === KIND.TOWER && tgt.tier >= 2) || tgt.kind === KIND.INHIBITOR || tgt.kind === KIND.NEXUS;
  if (!protectedKind) return ot;
  const C = mt.L.TOWER_CFG;
  return (minionNear(mt, src.team, tgt.x, tgt.y, C.backdoorRadius) ? 1 : C.backdoorMult) * ot;
}

// ------------------------------------------------------------------------------------------------ gating
/**
 * Recompute which structures can be damaged (legacy VS() + the DESIGN Nexus rule). Cheap; runs every tick so the
 * Nexus re-shields when every inhibitor has respawned.
 */
function applyGating(mt) {
  const S = mt.world.structures;
  // alive[team] = { 'top:1': true, ..., 'inhib:top': true, base: n }
  const alive = [{ base: 0, inhibs: 0 }, { base: 0, inhibs: 0 }];
  for (const s of S) {
    if (!s.alive || (s.team !== 0 && s.team !== 1)) continue;
    const A = alive[s.team];
    if (s.kind === KIND.TOWER) { A[s.lane + ':' + s.tier] = true; if (s.tier === 4) A.base++; }
    else if (s.kind === KIND.INHIBITOR) { A['inhib:' + s.lane] = true; A.inhibs++; }
  }
  const lanes = mt.rules ? mt.rules.lanes : LANES;   // QUICK mode: mid only (top/bot structures were removed)
  for (const s of S) {
    if (s.team !== 0 && s.team !== 1) continue;
    const A = alive[s.team];
    const allInhibs = lanes.every((l) => A['inhib:' + l]);
    let inv = false;
    if (s.kind === KIND.TOWER) inv = s.tier === 1 ? false : s.tier === 4 ? allInhibs : !!A[s.lane + ':' + (s.tier - 1)];
    else if (s.kind === KIND.INHIBITOR) inv = !!A[s.lane + ':3'];
    else if (s.kind === KIND.NEXUS) inv = A.base > 0 || allInhibs;
    else continue;
    s.invulnerable = inv;
  }
}

/** Can `s` be damaged right now? (for AI/HUD: same rule as the gating) */
export function isAttackable(s) { return !!(s && s.alive && !s.invulnerable); }

// ------------------------------------------------------------------------------------------------ destruction
function onKill(mt, victim, killer, credited) {
  if (!mt.L.isStructure(victim)) return;
  const w = mt.world, by = killer || credited || null;
  const fx = DESTROY_FX[victim.kind] || DESTROY_FX.tower;
  mt.emit(mt.E.STRUCTURE_DESTROYED, {
    id: victim.id, kind: victim.kind, team: victim.team, lane: victim.lane || null, tier: victim.tier || 0,
    x: victim.x, y: victim.y, radius: victim.radius, height: victim.height,
    killer: by ? by.id : -1, killerTeam: by ? by.team : -1, killerName: by ? by.name : null,
    shake: fx.shake, debris: fx.debris,
  });
  if (victim.kind !== KIND.NEXUS) return;
  const winner = w.winner !== null && w.winner !== undefined ? w.winner : 1 - victim.team;
  const lane = mt.laneState || {};
  mt.emit(mt.E.MATCH_END, {
    winner, loser: 1 - winner, nexus: victim.id, x: victim.x, y: victim.y, time: w.time,
    slowmo: { ...NEXUS_SLOWMO },
    teams: [0, 1].map((t) => {
      const ts = w.teamStats[t] || {};
      return {
        team: t, kills: ts.kills || 0, towers: ts.towers || 0, inhibitors: ts.inhibitors || 0,
        bosses: lane.bossKills ? lane.bossKills[t] : 0,
        structuresLeft: w.structures.filter((s) => s.team === t && s.alive).length,
      };
    }),
    trainers: w.champions.filter((c) => c.mtTrainer).map((c) => ({
      id: c.id, name: c.name, team: c.team, kills: c.kills || 0, deaths: c.deaths || 0, assists: c.assists || 0,
      party: c.mtTrainer.party.map((r) => ({ form: r.form, name: FORMS[r.form] ? FORMS[r.form].name : r.form, level: r.level })),
    })),
    mtStats: JSON.parse(JSON.stringify(mt.stats)),
  });
}
