// mt/voxel/units/placeholder.js — stand-in voxel models for units whose designer model (mt/voxel/models/) is not in yet.
// Owner: voxel units runtime. Same contract as MODELS[id](opts): { anim, parts, height, radius } — a coloured blob with
// eyes per rig type, sized from the sprite art's world height and coloured from its palette, so a missing model never
// blocks the runtime (and reads as "which unit is this" at a glance). `at` of a child part = its joint in the PARENT's
// grid; the character's left is +x (designer convention, mt/voxel/models/rig.js).
import { VoxelModel, speckle, scale, mix } from '../kit.js';

const TEAM_COL = { blue: 0x3d7fe0, red: 0xe0473c, wild: 0x9aa3a8, neutral: 0x9aa3a8 };
const EYE = 0x1a1420, EYE_HI = 0xffffff;

const lum = (c) => 0.3 * ((c >> 16) & 255) + 0.59 * ((c >> 8) & 255) + 0.11 * (c & 255);
/** three body colours (main, dark, light) from a sprite palette (array of '#rrggbb' / null) */
function colours(pal, fallback) {
  const cs = (pal || []).filter(Boolean).map((h) => parseInt(String(h).slice(1), 16)).filter((c) => lum(c) > 40 && lum(c) < 235);
  if (!cs.length) return [fallback, scale(fallback, 0.65), mix(fallback, 0xffffff, 0.45)];
  // the most saturated mid-tone reads as the body colour
  const sat = (c) => { const r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255; return Math.max(r, g, b) - Math.min(r, g, b); };
  const main = cs.slice().sort((a, b) => sat(b) + (lum(b) > 70 ? 40 : 0) - sat(a) - (lum(a) > 70 ? 40 : 0))[0];
  return [main, scale(main, 0.62), mix(main, 0xffffff, 0.45)];
}

function eyes(m, cx, y, z, gap, big) {
  for (const s of [-1, 1]) {
    const x = Math.round(cx + s * gap - (s > 0 ? 1 : 0));
    m.box(x, y, z, x + (big ? 1 : 0), y + 1, z, EYE);
    m.set(x + (big ? 1 : 0), y + 1, z, EYE_HI);
  }
}

/** biped: legs, body, head, arms (trainers, upright minions) */
function biped(H, [c0, c1, c2], acc) {
  const s = H / 16;                                 // 16 voxels = a 1.6 m trainer
  const L = Math.max(3, Math.round(5 * s)), B = Math.max(4, Math.round(6 * s)), Hd = Math.max(4, Math.round(6 * s));
  const W = Math.max(5, Math.round(8 * s)), D = Math.max(3, Math.round(5 * s));
  const leg = () => new VoxelModel(3, L, 3).box(0, 0, 0, 2, L - 1, 2, speckle(c1, 0.05)).box(0, 0, 0, 2, 0, 2, 0x2a2430);
  const arm = () => new VoxelModel(2, B, 2).box(0, 0, 0, 1, B - 1, 1, speckle(acc, 0.05)).box(0, 0, 0, 1, 1, 1, c2);
  const body = new VoxelModel(W, B, D).box(0, 0, 0, W - 1, B - 1, D - 1, speckle(acc, 0.05)).box(1, 0, D - 1, W - 2, B - 2, D - 1, speckle(c0, 0.05));
  const hw = W + 1, head = new VoxelModel(hw, Hd, hw - 1).box(0, 0, 0, hw - 1, Hd - 1, hw - 2, speckle(c2, 0.04)).box(0, Hd - 2, 0, hw - 1, Hd - 1, hw - 2, speckle(c0, 0.06));
  eyes(head, hw / 2, Math.max(1, Math.round(Hd * 0.35)), hw - 2, Math.max(1, Math.round(hw * 0.2)), hw >= 8);
  return {
    anim: 'biped', height: L + B + Hd, radius: Math.ceil(W / 2) + 1,
    parts: {
      legL: { model: leg(), pivot: [1.5, L, 1.5], at: [W / 4, L, 0] },
      legR: { model: leg(), pivot: [1.5, L, 1.5], at: [-W / 4, L, 0] },
      body: { model: body, pivot: [W / 2, 0, D / 2], at: [0, L, 0] },
      head: { model: head, pivot: [hw / 2, 0, (hw - 1) / 2], at: [W / 2, B, D / 2], parent: 'body' },
      armL: { model: arm(), pivot: [1, B, 1], at: [W + 1, B, D / 2], parent: 'body' },
      armR: { model: arm(), pivot: [1, B, 1], at: [-1, B, D / 2], parent: 'body' },
    },
  };
}

/** quadruped: round body, head in front, four stubby legs, a tail */
function quadruped(H, [c0, c1, c2]) {
  const s = Math.max(0.5, H / 10);                  // 10 voxels = a 1 m monster
  const BW = Math.max(5, Math.round(8 * s)), BH = Math.max(4, Math.round(6 * s)), BL = Math.max(6, Math.round(10 * s));
  const LH = Math.max(2, Math.round(3 * s)), HR = Math.max(3, Math.round(4 * s));
  const body = new VoxelModel(BW, BH, BL).ellipsoid(BW / 2, BH / 2, BL / 2, BW / 2, BH / 2, BL / 2, speckle(c0, 0.06))
    .paint((x, y, z, c) => (y < BH * 0.35 ? mix(c, c2, 0.5) : c));
  const hd = HR * 2, head = new VoxelModel(hd, hd, hd).sphere(hd / 2, hd / 2, hd / 2, hd / 2, speckle(c0, 0.05));
  eyes(head, hd / 2, Math.round(hd * 0.5), hd - 1, Math.max(1, Math.round(hd * 0.22)), hd >= 7);
  const leg = () => new VoxelModel(2, LH, 2).box(0, 0, 0, 1, LH - 1, 1, speckle(c1, 0.05));
  const tail = new VoxelModel(2, 2, Math.max(3, Math.round(5 * s))).box(0, 0, 0, 1, 1, Math.max(2, Math.round(5 * s)) - 1, speckle(c1, 0.05));
  const y0 = LH;
  return {
    anim: 'quadruped', height: y0 + BH + Math.round(hd * 0.4), radius: Math.ceil(BL / 2),
    parts: {
      body: { model: body, pivot: [BW / 2, 0, BL / 2], at: [0, y0, 0] },
      head: { model: head, pivot: [hd / 2, hd * 0.3, hd * 0.3], at: [BW / 2, BH * 0.6, BL - 1], parent: 'body' },
      legFL: { model: leg(), pivot: [1, LH, 1], at: [BW / 2 - 1.5, y0, BL / 2 - 2] },
      legFR: { model: leg(), pivot: [1, LH, 1], at: [-BW / 2 + 1.5, y0, BL / 2 - 2] },
      legBL: { model: leg(), pivot: [1, LH, 1], at: [BW / 2 - 1.5, y0, -BL / 2 + 2] },
      legBR: { model: leg(), pivot: [1, LH, 1], at: [-BW / 2 + 1.5, y0, -BL / 2 + 2] },
      tail: { model: tail, pivot: [1, 1, tail.sz], at: [BW / 2, BH * 0.55, 1], parent: 'body' },
    },
  };
}

/** flyer: body + head + two wings (hovers; the animator adds the height) */
function flyer(H, [c0, c1, c2]) {
  const s = Math.max(0.5, H / 10);
  const BW = Math.max(5, Math.round(7 * s)), BH = Math.max(4, Math.round(6 * s)), BL = Math.max(5, Math.round(8 * s));
  const body = new VoxelModel(BW, BH, BL).ellipsoid(BW / 2, BH / 2, BL / 2, BW / 2, BH / 2, BL / 2, speckle(c0, 0.06));
  const hd = Math.max(4, Math.round(5 * s)), head = new VoxelModel(hd, hd, hd).sphere(hd / 2, hd / 2, hd / 2, hd / 2, speckle(c0, 0.05));
  eyes(head, hd / 2, Math.round(hd * 0.5), hd - 1, Math.max(1, Math.round(hd * 0.22)), hd >= 7);
  const WS = Math.max(5, Math.round(9 * s)), WL = Math.max(3, Math.round(6 * s));
  const wing = () => new VoxelModel(WS, 1, WL).box(0, 0, 0, WS - 1, 0, WL - 1, speckle(c2, 0.07)).box(0, 0, 0, WS - 1, 0, 0, c1);
  return {
    anim: 'flyer', height: BH + Math.round(hd * 0.6), radius: Math.ceil(WS + BW / 2),
    parts: {
      body: { model: body, pivot: [BW / 2, 0, BL / 2], at: [0, 0, 0] },
      head: { model: head, pivot: [hd / 2, hd * 0.3, hd * 0.3], at: [BW / 2, BH * 0.55, BL - 1], parent: 'body' },
      wingL: { model: wing(), pivot: [0, 0, WL / 2], at: [BW - 1, BH * 0.65, BL / 2], parent: 'body' },
      wingR: { model: wing(), pivot: [WS, 0, WL / 2], at: [1, BH * 0.65, BL / 2], parent: 'body' },
    },
  };
}

/** floater: a bobbing orb-ish body with a face */
function floater(H, [c0, c1, c2]) {
  const s = Math.max(0.5, H / 10), R = Math.max(3, Math.round(4.5 * s)), d = R * 2;
  const body = new VoxelModel(d, d, d).sphere(R, R, R, R, speckle(c0, 0.06)).paint((x, y, z, c) => (y < R * 0.6 ? mix(c, c1, 0.4) : c));
  eyes(body, R, Math.round(R * 1.1), d - 1, Math.max(1, Math.round(R * 0.45)), d >= 8);
  const fx = new VoxelModel(3, 3, 3).box(0, 0, 0, 2, 2, 2, c2);
  return {
    anim: 'floater', height: d, radius: R + 1,
    parts: { body: { model: body, pivot: [R, 0, R], at: [0, 0, 0] }, fx: { model: fx, pivot: [1.5, 1.5, 1.5], at: [R, d + 3, R], parent: 'body' } },
  };
}

/**
 * Placeholder for an art id. info = {kind, worldHeight, hover, palette, team} (from the sprite art registry).
 * Trainers / upright minions: biped; flying minions and the boss: flyer; hovering monsters: floater; else quadruped.
 */
export function placeholderModel(id, info = {}) {
  const team = info.team || 'wild', acc = TEAM_COL[team] || TEAM_COL.wild;
  const H = Math.max(4, Math.round((info.worldHeight || 0.9) * 10));
  const cols = colours(info.palette, acc);
  if (info.kind === 'trainer') return biped(H, cols, acc);
  if (info.kind === 'boss') return flyer(H * 0.7, cols);
  if (info.kind === 'minion') return /spitwing/.test(id) ? flyer(H, cols) : /grubling/.test(id) ? quadruped(H, cols) : biped(H, cols, acc);
  if (info.hover >= 5) return floater(H, cols);
  return quadruped(H, cols);
}
