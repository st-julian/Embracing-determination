// mt/sim/util.js — small deterministic helpers shared by mt/sim modules. Owner: architecture (shared; additive edits OK).
// RULE: no Math.random / Date.now inside sim code. Use rand01(world, ...keys).

import { D as KIND, k as TEAM, E as DT } from '../../assets/map-oE9sOnNc.js';

export { KIND, TEAM, DT };

/** Deterministic 0..1 hash of the world seed, tick and any integer keys. */
export function rand01(world, a = 0, b = 0, c = 0) {
  let h = (Math.imul((world.seed | 0) ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(world.tickNo | 0, 0xc2b2ae35)) >>> 0;
  h = Math.imul(h ^ (a | 0), 0x27d4eb2f) >>> 0;
  h = Math.imul(h ^ ((b | 0) + 0x165667b1), 0x9e3779b1) >>> 0;
  h = Math.imul(h ^ ((c | 0) + 0x61c88647), 0x85ebca77) >>> 0;
  h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d) >>> 0; h ^= h >>> 12;
  return (h >>> 0) / 4294967296;
}

export const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
export const dist2 = (ax, ay, bx, by) => { const dx = bx - ax, dy = by - ay; return dx * dx + dy * dy; };
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

/** True for units that are owned/wild mt monsters. */
export const isMtMonster = (u) => !!(u && u.mtMon);
/** True for an owned (pet) monster. */
export const isPet = (u) => !!(u && u.mtMon && u.mtMon.ownerId >= 0);
/** True for a wild (neutral, capturable-type) mt monster. */
export const isWild = (u) => !!(u && u.mtMon && u.mtMon.ownerId < 0);
/** True for a trainer (champion-kind unit converted by mt). */
export const isTrainer = (u) => !!(u && u.mtTrainer);

/**
 * Units within radius r of (x,y) matching pred, nearest first. Uses the legacy world query (grid based).
 * @returns {Array<object>} a NEW array (safe to keep)
 */
export function unitsNear(world, x, y, r, pred) {
  const out = world.queryUnits(x, y, r, pred, []);
  out.sort((a, b) => dist2(x, y, a.x, a.y) - dist2(x, y, b.x, b.y) || a.id - b.id);
  return out;
}

/** Teleport a unit to (x,y), falling back toward (fromX,fromY) if (x,y) is not walkable. */
export function teleportUnit(world, u, x, y, fromX = x, fromY = y) {
  const p = world.nav.landingPoint(fromX, fromY, x, y);
  u.x = u.prevX = p.x; u.y = u.prevY = p.y; u.path = null; u.dash = null;
  world.grid.dirty = true;
}
