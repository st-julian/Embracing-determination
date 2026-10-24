// mt/sim/minions.js — minion waves (DESIGN.md §9). Owner: lane/minions specialist.
// The legacy wave scheduler (first 0:30, every 30 s), lanes, minion AI (fC) and creeps renderer are kept; this module
// changes the composition ([MT-HOOK] waveComposition), the stats/names ([MT-HOOK] minionSpawn), siege-vs-structure
// damage, and how minions treat trainers' monsters ([MT-HOOK] minionAggro).
//
// Legacy subtypes are kept: melee = Grubling, caster = Spitwing, siege = Shellram, super = Elder Shellram
// (super minions still appear in a lane whose enemy inhibitor is down — legacy rule kept by DESIGN §9).
//
// Minion aggro vs monsters (legacy treated every non-champion MONSTER as class 99 = "ignore unless alone"):
//   enemy monster/trainer hurting one of our trainers/monsters nearby  -> class 1 (call for help, like champions)
//   enemy monster hitting one of our minions                           -> class 5
//   any other enemy monster                                            -> class 7 (same as a champion)
// (legacy classes: 1 champ hits ally champ, 2 minion hits ally champ, 3 minion hits ally minion, 4 tower hits ally
//  minion, 5 champ hits ally minion, 6 minion, 7 champion, 8 structures; lower = preferred)
// Minions drop a monster they chase once they are dragged > laneLeash off their lane (legacy did this for champions).
//
// XP: minion kills train the monsters that took part / stand nearby — progression.js (XP.minion[subtype]); each minion
// carries `mtWaveMult` (its per-wave stat multiplier) for an optional late-game XP scale.

import { MINIONS } from '../data/balance.js';
import { KIND, TEAM, dist2, isPet, isTrainer } from './util.js';
import { hurtingAllyOf } from './structures.js';

const LANES = ['top', 'mid', 'bot'];

export function install(mt) {
  mt.impl.waveComposition = composition;
  mt.impl.onMinion = applyStats;
  mt.impl.minionAggro = aggroClass;
  mt.damageScalers.push((mt, src, tgt) => {
    if (src && src.kind === KIND.MINION && tgt && mt.L.isStructure(tgt)) {
      const T = MINIONS.types[src.subtype];
      if (T && T.structureMult) return T.structureMult;
    }
    return 1;
  });
  mt.on('preTick', leashMinions);
}

function inhibitorDown(mt, team, lane) {
  for (const s of mt.world.structures) if (s.kind === KIND.INHIBITOR && s.team === team && (lane == null || s.lane === lane) && s.alive) return false;
  return true;
}

/** Per-wave stat multiplier (DESIGN §9: +3 % per wave number, cap +60 %). Wave 1 = ×1. */
export function waveMult(waveNo) {
  return 1 + Math.min(MINIONS.perWaveCap, MINIONS.perWave * Math.max(0, (waveNo || 1) - 1));
}

/** [MT-HOOK] waveComposition. @returns {string[]} legacy subtypes in spawn order */
export function composition(mt, team, lane, waveNo) {
  const enemy = 1 - team, out = ['melee', 'melee', 'melee'];
  let kind = null;
  if (inhibitorDown(mt, enemy, lane)) { out.push('super'); kind = 'super'; }
  else if (waveNo % MINIONS.siegeEvery === 0) { out.push('siege'); kind = 'siege'; }
  out.push('caster', 'caster', 'caster');
  // one mt_wave event per team and wave (legacy composes lanes in order top, mid, bot)
  const W = mt._waveAcc || (mt._waveAcc = {});
  const key = team + ':' + waveNo;
  const acc = W[key] || (W[key] = { team, waveNo, lanes: [], siege: false, super: [] });
  acc.lanes.push(lane);
  if (kind === 'siege') acc.siege = true;
  if (kind === 'super') acc.super.push(lane);
  if (acc.lanes.length === LANES.length) {
    delete W[key];
    mt.emit(mt.E.WAVE, { team, waveNo, lanes: acc.lanes, siege: acc.siege, super: acc.super, mult: +waveMult(waveNo).toFixed(2) });
  }
  return out;
}

/** [MT-HOOK] minionSpawn: DESIGN stats × per-wave scaling, names. Called before the unit is added. */
export function applyStats(mt, u) {
  const T = MINIONS.types[u.subtype]; if (!T) return;
  const k = waveMult(u.waveNo);
  const legacy = mt.L.MINION_CFG && mt.L.MINION_CFG.base ? mt.L.MINION_CFG.base[u.subtype] : null;
  u.maxHp = u.hp = T.hp * k;
  u.stats.ad = T.ad * k;
  u.stats.attackRange = T.range;
  // armour: legacy base (siege/super are armoured) scaled with the wave instead of the legacy 75 s upgrade tiers
  if (legacy) u.stats.armor = (legacy.armor || 0) * k;
  u.name = T.name;
  u.mtWaveMult = k;
  mt.L.snapshotBaseStats(u);
}

/**
 * [MT-HOOK] minionAggro — aggro class of `other` for `minion` (lower = preferred), or undefined for the legacy rule.
 * Only called for trainers and mt monsters.
 */
export function aggroClass(mt, minion, other) {
  const R = (mt.L.MINION_CFG && mt.L.MINION_CFG.callForHelp) || 7;
  if (isPet(other)) {
    if (hurtingAllyOf(mt, other, minion.team, minion.x, minion.y, R, 1.5)) return 1;
    const w = mt.world;
    if (other.lastAttackT > w.time - 1.5) {
      const v = w.units.get(other.lastAttackTargetId);
      if (v && v.alive && v.team === minion.team && v.kind === KIND.MINION && dist2(v.prevX, v.prevY, minion.x, minion.y) <= R * R) return 5;
    }
    return 7;
  }
  if (isTrainer(other) && hurtingAllyOf(mt, other, minion.team, minion.x, minion.y, R, 1.5)) return 1;
  return undefined;
}

/** Distance of a minion from its current lane segment (legacy uC). */
function laneDist(u) {
  const p = u.path2; if (!p) return 0;
  const n = Math.max(1, Math.min(p.length - 1, u.laneIdx || 1));
  const a = p[n - 1], b = p[n];
  const dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy;
  let t = l2 > 0 ? ((u.x - a.x) * dx + (u.y - a.y) * dy) / l2 : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  return Math.hypot(u.x - (a.x + dx * t), u.y - (a.y + dy * t));
}

/** Minions stop chasing monsters that drag them off their lane (legacy only leashed champion chases). */
function leashMinions(mt) {
  const w = mt.world, leash = (mt.L.MINION_CFG && mt.L.MINION_CFG.laneLeash) || 11;
  if ((w.tickNo & 1) !== 0) return;
  for (const u of w.unitList) {
    if (u.kind !== KIND.MINION || !u.alive || u.targetId < 0) continue;
    const t = w.units.get(u.targetId);
    if (!t || !isPet(t) || u.team === TEAM.NEUTRAL) continue;
    if (laneDist(u) > leash && mt.L.edgeDistPrev(u, t) > u.stats.attackRange) { u.targetId = -1; u.aggroPrio = 99; }
  }
}
