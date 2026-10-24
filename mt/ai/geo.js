// mt/ai/geo.js — map knowledge for the trainer bot brain: lane polylines, lane progress, fountains, boss pit.
// Owner: AI specialist. Pure functions over the legacy MAP data (no world state, no DOM).
//
// Lane progress `s` is measured in metres along the lane polyline from the BLUE base (team 0). `teamS(team, …)`
// converts it to "progress toward the enemy base" for either team, so lane logic can be written once.

import { a as LANES, i as FOUNTAINS, l as PITS } from '../../assets/map-oE9sOnNc.js';

export const LANE_IDS = ['top', 'mid', 'bot'];

const G = {};
for (const id of LANE_IDS) {
  const pts = LANES[id], cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  G[id] = { pts, cum, len: cum[cum.length - 1] };
}

export const laneLen = (lane) => G[lane].len;

/** Project (x,y) onto a lane: s = metres from the blue end, d = distance to the polyline. */
export function project(lane, x, y) {
  const { pts, cum } = G[lane];
  let best = 1e9, bs = 0;
  for (let i = 1; i < pts.length; i++) {
    const ax = pts[i - 1].x, ay = pts[i - 1].y, dx = pts[i].x - ax, dy = pts[i].y - ay;
    const l2 = dx * dx + dy * dy;
    let k = l2 > 0 ? ((x - ax) * dx + (y - ay) * dy) / l2 : 0;
    k = k < 0 ? 0 : k > 1 ? 1 : k;
    const px = ax + dx * k, py = ay + dy * k, d = Math.hypot(x - px, y - py);
    if (d < best) { best = d; bs = cum[i - 1] + Math.sqrt(l2) * k; }
  }
  return { s: bs, d: best };
}

/** Point at progress s (blue frame) on a lane. */
export function pointAt(lane, s) {
  const { pts, cum, len } = G[lane];
  s = s < 0 ? 0 : s > len ? len : s;
  for (let i = 1; i < pts.length; i++) {
    if (s <= cum[i] || i === pts.length - 1) {
      const seg = cum[i] - cum[i - 1], k = seg > 0 ? (s - cum[i - 1]) / seg : 0;
      return { x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * k, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * k };
    }
  }
  return { x: pts[pts.length - 1].x, y: pts[pts.length - 1].y };
}

/** Blue-frame s -> team frame (progress toward the enemy base) and back (the mapping is its own inverse). */
export const teamS = (team, lane, s) => (team === 0 ? s : G[lane].len - s);
export const pointAtTeam = (team, lane, ts) => pointAt(lane, teamS(team, lane, ts));
/** Team-frame progress of a point on a lane. */
export const progressOf = (team, lane, x, y) => { const p = project(lane, x, y); return { ts: teamS(team, lane, p.s), d: p.d }; };

/** Nearest lane to a point. */
export function nearestLane(x, y) {
  let best = null;
  for (const id of LANE_IDS) { const p = project(id, x, y); if (!best || p.d < best.d) best = { lane: id, s: p.s, d: p.d }; }
  return best;
}

export const fountainOf = (team) => FOUNTAINS[team];
export const BOSS_PIT = (() => { const p = PITS.find((q) => q.id === 'drake') || { x: 85, y: 85, radius: 6.5 }; return { x: p.x, y: p.y, r: p.radius }; })();

/** Which half of the map a point is on: >0 = deeper into `team`'s own side. */
export function ownSide(team, x, y) { return team === 0 ? (y - x) : (x - y); }

export const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
