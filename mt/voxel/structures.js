// mt/voxel/structures.js — the voxel world's architecture at DETAIL_M (1/20 m), in the Black/White overworld idiom:
// clean white and grey stone, coloured tiled roofs, framed windows, trims, banners, railings (owner: environment).
// Render only.
//
// Towers, inhibitors and the Nexus each have a stone body and a separate glowing crystal (team emissive material with
// a slow pulse). States follow the live sim: alive, damaged (< 50 % HP: chipped, scorched, pennant gone, cracked
// dimmer crystal) and destroyed (rubble, no crystal). Every geometry is built lazily and through a small per-frame
// queue (one model per frame), so loading never stalls on the whole set and damaged / rubble meshes only exist once
// a structure needs them. The crystal centres sit on the legacy anchor heights (crystalY: projectile origin, plates);
// ANCHORS gives the overhead (HP bar) heights of the taller voxel silhouettes.

import { VoxelModel, meshArrays, hash3, mix, scale, DETAIL_M } from './kit.js';
import { o as heightAt } from '../../assets/height-CVtQdZ3e.js';
import { i as FOUNTAINS, t as BASES, a as LANES, o as LANE_W, x as segDist, _ as WALK, f as STRUCTS, r as CAMPS, l as PITS } from '../../assets/map-oE9sOnNc.js';
import { PAL } from '../../art/tiles/palette.js';
import { fadeMaterial } from './fade.js';

const I = (c) => (c[0] << 16) | (c[1] << 8) | c[2];
const RP = {}; for (const k in PAL) RP[k] = PAL[k].map(I);
const WH = RP.white, ST = RP.stone, IR = RP.iron, GO = RP.gold, WD = RP.wood, GL = RP.blue;
const TR = [RP.blue, RP.red];                                   // team ramps, dark -> light (6)
const GEM = [0x6fd8ff, 0xc8102e], GLOW = [0x2f9dff, 0xb8001e], GEM_HI = [0xf0fbff, 0xff7a70];
const SOOT = 0x2e2a2c, V = 20;                                  // voxels per metre

const TOWER_CY = [0, 4.73, 4.94, 5.27, 5.66];                   // legacy crystal anchors (structures-*.js tier table)
const INHIB_CY = 1.74, NEXUS_CY = 6.1;
export const ANCHORS = {
  tower: (tier) => ({ overheadY: (TOWER_CY[tier] || TOWER_CY[2]) + 3.0 }),
  inhibitor: () => ({ overheadY: 3.3 }),
  nexus: () => ({ overheadY: 9.6 }),
};

function geo(THREE, model, pivot) {
  const a = meshArrays(model, { size: DETAIL_M, pivot });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(a.positions, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(a.normals, 3));
  g.setAttribute('color', new THREE.BufferAttribute(a.colors, 3));
  g.setIndex(new THREE.BufferAttribute(a.indices, 1));
  g.computeBoundingSphere();
  return g;
}

// ---- shared painters
/** white ashlar on a round body: 0.25 m courses, staggered joints around the circumference */
const ashlar = (cx, cz, seed, base = WH[3]) => (x, y, z) => {
  const row = Math.floor(y / 5), a = Math.atan2(z + 0.5 - cz, x + 0.5 - cx), u = Math.floor((a / (2 * Math.PI) + 0.5) * 48 + (row % 2) * 0.5);
  if (y % 5 === 0) return WH[2];
  const fu = (a / (2 * Math.PI) + 0.5) * 48 + (row % 2) * 0.5;
  if (fu - Math.floor(fu) < 0.09) return WH[2];
  return hash3(u, row, seed) < 0.3 ? WH[4] : base;
};
/** square ashlar for flat walls */
const blocks = (R, seed, cw = 8, ch = 5) => (x, y, z) => {
  const row = Math.floor(y / ch), off = (row % 2) * (cw >> 1), u = x + z + off;
  if (y % ch === 0) return R[1];
  if (u % cw === 0) return R[1];
  return hash3(Math.floor(u / cw), row, seed) < 0.3 ? R[Math.min(R.length - 1, 4)] : R[3];
};
function damage(m, from, seed) {
  m.paint((x, y, z, c) => {
    const h = hash3(x >> 1, y >> 1, z >> 1, seed);
    if (y > from && h < 0.1 + (y - from) * 0.003) return null;
    if (hash3(x, y, z, seed + 1) > 0.9) return mix(c, SOOT, 0.65);
    return c;
  });
  return m;
}
function gem(m, cx, cy, cz, rx, ry, col, seed, cracked) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let z = Math.floor(cz - rx); z <= Math.ceil(cz + rx); z++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, dz = (z + 0.5 - cz) / rx;
    if (Math.abs(dx) + Math.abs(dy) + Math.abs(dz) > 1) continue;
    const up = dy > 0, facet = (dx > 0) === (dz > 0);
    let c = mix(col, 0xffffff, up ? (facet ? 0.45 : 0.28) : (facet ? 0.1 : 0));
    if (!up) c = scale(c, facet ? 0.9 : 0.74);
    if (Math.abs(dx) + Math.abs(dz) < 0.16) c = mix(c, 0xffffff, 0.45);
    if (cracked) { const h = hash3(x >> 1, y >> 1, z >> 1, seed + 9); if (h < 0.08) continue; if (h > 0.84) c = mix(c, 0x1c1a22, 0.7); }
    m.set(x, y, z, c);
  }
}
/**
 * a faceted hexagonal crystal from base point B along direction D (voxel units): tapered tips, a light top, lit / mid /
 * dark side facets against the sun (from the left and a little in front), bright facet edges, inner glow bands.
 */
const LW = (() => { const l = [-0.62, 0.5, 0.6], s = Math.hypot(...l); return l.map((v) => v / s); })();
function prism(m, bx, by, bz, dx, dy, dz, r, L, col, seed, cracked, hi = 0xffffff) {
  const dl = Math.hypot(dx, dy, dz); dx /= dl; dy /= dl; dz /= dl;
  let ux = -dz, uz = dx, ul = Math.hypot(ux, uz); if (ul < 1e-3) { ux = 1; uz = 0; ul = 1; } ux /= ul; uz /= ul;
  const uy = 0, wx = dy * uz - dz * uy, wy = dz * ux - dx * uz, wz = dx * uy - dy * ux;
  const ext = r + 2, x0 = Math.floor(Math.min(bx, bx + dx * L) - ext), x1 = Math.ceil(Math.max(bx, bx + dx * L) + ext);
  const y0 = Math.floor(Math.min(by, by + dy * L) - ext), y1 = Math.ceil(Math.max(by, by + dy * L) + ext);
  const z0 = Math.floor(Math.min(bz, bz + dz * L) - ext), z1 = Math.ceil(Math.max(bz, bz + dz * L) + ext);
  const light = mix(col, hi, 0.5), lit = mix(col, hi, 0.26), dark = mix(scale(col, 0.62), 0x3a2a72, 0.28), edge = mix(col, hi, 0.62);
  for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
    const vx = x + 0.5 - bx, vy = y + 0.5 - by, vz = z + 0.5 - bz, a = vx * dx + vy * dy + vz * dz;
    if (a < 0 || a > L) continue;
    const t = a / L, rr = r * Math.min(1, t / 0.2, (1 - t) / 0.26);
    const lu = vx * ux + vy * uy + vz * uz, lw = vx * wx + vy * wy + vz * wz, q = Math.abs(lu), w = Math.abs(lw);
    if (q * 0.866 + w * 0.5 > rr || w > rr) continue;
    const ang = Math.atan2(lw, lu), f = Math.floor((ang + Math.PI) / (Math.PI / 3)), fa = -Math.PI + (f + 0.5) * Math.PI / 3;
    const nx = ux * Math.cos(fa) + wx * Math.sin(fa), ny = uy * Math.cos(fa) + wy * Math.sin(fa), nz = uz * Math.cos(fa) + wz * Math.sin(fa);
    const l = nx * LW[0] + ny * LW[1] + nz * LW[2];
    let c = l > 0.35 ? lit : l > -0.25 ? col : dark;
    if (t > 0.74) c = l > -0.1 ? light : lit;                         // the top facets catch the sky
    else if (t < 0.2) c = l > 0.2 ? col : dark;
    const fr = (ang + Math.PI) / (Math.PI / 3) - f;
    if ((fr < 0.08 || fr > 0.92) && rr - Math.max(q * 0.866 + w * 0.5, w) < 1.6) c = mix(c, edge, 0.6);   // facet edges
    if (t > 0.2 && t < 0.74 && Math.floor(a / 3) % 7 === 3) c = mix(c, hi, 0.3);                           // inner glow bands
    if (cracked) { const h = hash3(x >> 1, y >> 1, z >> 1, seed + 9); if (h < 0.08) continue; if (h > 0.85) c = mix(c, 0x1c1a22, 0.7); }
    m.set(x, y, z, c);
  }
}
/** a conical tiled roof: scalloped eaves, tile rows (dark lower lip, lit upper-left), team ramp */
function coneRoof(m, cx, cz, y0, r0, h, R, seed) {
  for (let y = 0; y <= h; y++) {
    const r = r0 * (1 - y / (h + 1)), row = Math.floor(y / 3);
    for (let z = Math.floor(cz - r - 1); z <= Math.ceil(cz + r + 1); z++) for (let x = Math.floor(cx - r - 1); x <= Math.ceil(cx + r + 1); x++) {
      const dx = x + 0.5 - cx, dz = z + 0.5 - cz, d = Math.hypot(dx, dz), a = Math.atan2(dz, dx);
      const scal = y < 2 ? Math.abs(Math.sin(a * Math.max(8, Math.round(r0 * 0.7)))) * 1.2 : 0;
      if (d > r + 0.6 - scal) continue;
      const lit = (-dx * 0.7 + dz * 0.35 - 0 * 0) / Math.max(1, d);
      let k = y % 3 === 0 ? 1 : lit > 0.35 ? 4 : lit > -0.2 ? 3 : 2;
      if (y < 1) k = 1;
      const tile = Math.floor((a / (2 * Math.PI) + 0.5) * Math.max(10, r * 1.2) + (row % 2) * 0.5);
      if (y % 3 !== 0 && hash3(tile, row, seed) < 0.12) k = Math.max(1, k - 1);
      m.set(x, y0 + y, z, R[k]);
    }
  }
}
function pennant(m, x, y0, z, T, seed) {
  m.box(x, y0, z, x + 1, y0 + 16, z + 1, IR[2]); m.box(x, y0 + 17, z, x + 1, y0 + 18, z + 1, GO[3]);
  for (let k = 2; k <= 15; k++) {
    const w = Math.max(1, 6 - Math.floor(k / 3)), wz = z + Math.round(Math.sin(k * 0.55 + seed) * 1.2);
    for (let y = 0; y < w; y++) m.set(x + k, y0 + 15 - y, wz, y === 0 ? T[4] : T[3]);
  }
}
/** a framed arched window punched into a wall facing +z (or rotated by caller via setter) */
function windowAt(set, u, y, w, h) {
  for (let a = -1; a <= w; a++) for (let b = -1; b <= h + 1; b++) {
    const frame = a === -1 || a === w || b === -1 || b === h + 1 || (b === h && (a === 0 || a === w - 1));
    if (frame) { set(u + a, y + b, 1, WH[4]); continue; }
    const glass = b > h * 0.55 && a === 1 ? GL[4] : b === Math.floor(h / 2) ? WH[3] : a === Math.floor(w / 2) ? WH[3] : GL[1];
    set(u + a, y + b, -1, glass);
  }
  for (let a = -2; a <= w + 1; a++) set(u + a, y - 2, 2, ST[2]);   // sill
}

// ---- tower: a white round keep on a stone plinth, framed windows, a team door and banners, a railed balcony, an open
// lantern holding the crystal, a conical team roof with a pennant. 2.8 m footprint (collision radius 1.1 m).
function towerModel(team, tier, state) {
  const T = TR[team], cy = Math.round(TOWER_CY[tier] * V), yb = cy - 28, C = 28, R = 15 + (tier >= 3 ? 1 : 0);
  const m = new VoxelModel(56, cy + 88, 56);
  m.box(2, 0, 2, 53, 4, 53, (x, y, z) => (y === 4 && (x === 2 || x === 53 || z === 2 || z === 53) ? ST[4] : (x % 8 === 0 || z % 8 === 0) ? ST[2] : ST[3]));
  m.box(6, 5, 6, 49, 7, 49, (x, y, z) => (y === 7 && (x === 6 || x === 49 || z === 6 || z === 49) ? WH[4] : ST[4]));
  if (state === 2) {                                                         // rubble
    m.cylinder(C, C, 8, 30, R, R, ashlar(C, C, 3));
    m.paint((x, y, z, c) => (y > 10 && hash3(x >> 1, y >> 1, z >> 1, 9) < 0.18 + (y - 10) * 0.035 ? null : c));
    for (let k = 0; k < 26; k++) {
      const a = k * 2.39, r = 8 + hash3(k, 1, team) * 18, x = Math.round(C + Math.cos(a) * r), z = Math.round(C + Math.sin(a) * r), s = 2 + (k % 4);
      m.box(x, 8, z, x + s, 8 + 1 + (k % 3), z + s - 1, k % 5 === 0 ? T[2] : k % 5 === 1 ? T[3] : k % 3 ? WH[3] : WH[2]);
    }
    for (let x = 34; x < 50; x++) for (let z = 10; z < 22; z++) if ((x - 34) + (z - 10) < 18) m.set(x, 8 + Math.floor((x - 34) / 6), z, (x + z) % 3 ? T[3] : T[1]);   // a fallen roof slab
    m.paint((x, y, z, c) => (hash3(x, y, z, 21) < 0.1 ? mix(c, SOOT, 0.7) : c));
    return m;
  }
  m.cylinder(C, C, 8, 13, R + 2, R + 2, (x, y, z) => (y === 13 ? T[3] : y === 12 ? GO[3] : ST[3]));   // skirt + trim
  m.cylinder(C, C, 14, yb - 1, R, R, ashlar(C, C, 3));                   // keep
  m.cylinder(C, C, yb - 9, yb - 7, R + 1, R + 1, (x, y) => (y === yb - 8 ? T[3] : GO[3]));   // team band
  // door (+z), windows on four sides, banners on +-x
  const face = (dir) => (u, y, depth, c) => {                               // u along the face, depth: +out, -in
    const s = Math.sign(depth) || 1, d = Math.abs(depth);
    for (let k = 0; k < d; k++) {
      const off = s > 0 ? R + k : R - k - 1, uu = C + u - 1;
      if (dir === 0) m.set(uu, y, C + off, c); else if (dir === 1) m.set(uu, y, C - off - 1, c); else if (dir === 2) m.set(C + off, y, uu, c); else m.set(C - off - 1, y, uu, c);
    }
  };
  const fz = face(0);
  for (let a = -6; a <= 6; a++) for (let y = 14; y <= 40; y++) {
    const arch = y > 34 && Math.hypot(a, (y - 34) * 1.1) > 6.2; if (arch) continue;
    const edge = Math.abs(a) === 6 || Math.hypot(a, (y - 34) * 1.1) > 5.2 && y > 34;
    if (edge) fz(a, y, 1, WH[4]); else fz(a, y, -2, Math.abs(a) < 1 ? T[1] : (y - 14) % 6 === 0 ? T[1] : T[2]);
  }
  fz(3, 26, -2, GO[3]); for (let a = -8; a <= 8; a++) { fz(a, 13, 3, ST[4]); fz(a, 12, 4, ST[3]); }
  const winY = [44].concat(yb - 10 > 80 ? [64] : []);
  for (const dir of [0, 1]) for (const wy of winY) {
    const f = face(dir);
    windowAt((u, y, d, c) => f(u, y, d, c), -3, wy, 6, 12);
  }
  for (const dir of [2, 3]) {                                               // banners hanging from gold rods
    const f = face(dir), y1 = yb - 12, y0 = y1 - 26;
    for (let a = -6; a <= 5; a++) f(a, y1 + 1, 2, GO[3]);
    for (let y = y0; y <= y1; y++) for (let a = -5; a <= 4; a++) {
      if (y < y0 + 5 && Math.abs(a + 0.5) < (y0 + 5 - y) * 1.1) continue;
      const em = Math.abs(a + 0.5) + Math.abs(y - (y0 + 15)) < 4;
      f(a, y, 1, a === -5 || a === 4 ? T[1] : em ? (Math.abs(a + 0.5) + Math.abs(y - (y0 + 15)) < 2 ? WH[4] : GO[3]) : T[3]);
    }
  }
  // balcony with corbels and a railing
  for (let k = 0; k < 4; k++) m.cylinder(C, C, yb - 4 + k, yb - 4 + k, R + 1 + k * 1.6, R + 1 + k * 1.6, ST[3]);
  m.cylinder(C, C, yb, yb + 2, R + 8, R + 8, (x, y, z) => (y === yb + 2 ? (Math.hypot(x + 0.5 - C, z + 0.5 - C) > R + 6.5 ? WH[4] : ST[4]) : WH[3]));
  for (let k = 0; k < 40; k++) { const a = (k / 40) * Math.PI * 2, x = Math.round(C - 0.5 + Math.cos(a) * (R + 7)), z = Math.round(C - 0.5 + Math.sin(a) * (R + 7)); m.box(x, yb + 3, z, x, yb + 9, z, IR[2]); }
  for (let y of [yb + 6, yb + 10]) for (let k = 0; k < 160; k++) { const a = (k / 160) * Math.PI * 2; m.set(Math.round(C - 0.5 + Math.cos(a) * (R + 7)), y, Math.round(C - 0.5 + Math.sin(a) * (R + 7)), y === yb + 10 ? T[3] : IR[3]); }
  // lantern: four white pillars round the crystal, a gold ring, the roof
  m.cylinder(C, C, yb + 3, yb + 5, 11, 11, (x, y) => (y === yb + 5 ? GO[3] : WH[3]));
  for (const [x, z] of [[C - 11, C - 11], [C + 8, C - 11], [C - 11, C + 8], [C + 8, C + 8]]) m.box(x, yb + 3, z, x + 2, cy + 18, z + 2, (x2, y) => (y > cy + 15 || y < yb + 6 ? GO[3] : (y % 5 === 0 ? WH[2] : WH[4])));
  m.cylinder(C, C, cy + 19, cy + 21, R + 6, R + 6, (x, y) => (y === cy + 19 ? T[1] : WH[3]));
  coneRoof(m, C, C, cy + 22, R + 9, 30 + tier * 2, T, tier);
  const top = cy + 22 + 30 + tier * 2;
  m.box(C - 1, top, C - 1, C, top + 2, C, GO[3]);
  pennant(m, C - 1, top + 3, C - 1, T, tier);
  if (state === 1) { damage(m, yb - 18, 11); m.box(C - 2, top + 3, C - 2, C + 17, top + 24, C + 3, null); }
  return m;
}
function towerCrystal(team, tier, cracked) {
  const cy = Math.round(TOWER_CY[tier] * V), m = new VoxelModel(56, cy + 20, 56);
  prism(m, 28, cy - 13, 28, 0, 1, 0, 6.5 + tier * 0.5, 26, GEM[team], 8, cracked, GEM_HI[team]);
  return m;
}

// ---- inhibitor: a round white rune altar with six short pillars; the crystal hovers low (1.74 m)
function inhibitorModel(team, state) {
  const T = TR[team], C = 32, m = new VoxelModel(64, 52, 64);
  m.cylinder(C, C, 0, 3, 30, 30, (x, y, z) => (y === 3 && Math.hypot(x + 0.5 - C, z + 0.5 - C) > 28.8 ? ST[4] : ST[3]));
  m.cylinder(C, C, 4, 8, 24, 24, (x, y, z) => { const d = Math.hypot(x + 0.5 - C, z + 0.5 - C); return y === 8 ? (Math.abs(d - 18) < 0.8 ? T[3] : d > 22.8 ? WH[4] : WH[3]) : (Math.floor(Math.atan2(z - C, x - C) * 8) % 2 ? WH[3] : WH[2]); });
  if (state === 2) {
    m.ellipsoid(C, 8, C, 22, 8, 22, (x, y, z) => (hash3(x >> 1, y >> 1, z >> 1, 4) < 0.5 ? null : hash3(x, y, z, 5) < 0.18 ? T[2] : WH[3]));
    m.paint((x, y, z, c) => (hash3(x, y, z, 6) < 0.1 ? mix(c, SOOT, 0.6) : c));
    return m;
  }
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + 0.52, x = Math.round(C - 2 + Math.cos(a) * 21), z = Math.round(C - 2 + Math.sin(a) * 21);
    m.box(x, 9, z, x + 3, 40, z + 3, (x2, y) => (y > 37 ? GO[3] : y === 30 || y === 31 ? T[3] : y % 6 === 0 ? WH[2] : WH[4]));
    m.box(x + 1, 41, z + 1, x + 2, 42, z + 2, T[4]);
  }
  m.cylinder(C, C, 9, 11, 9, 9, (x, y) => (y === 11 ? GO[3] : ST[4]));
  if (state === 1) damage(m, 14, 12);
  return m;
}
function inhibitorCrystal(team, cracked) { const m = new VoxelModel(64, 52, 64); prism(m, 32, Math.round(INHIB_CY * V) - 14, 32, 0, 1, 0, 8, 28, GEM[team], 5, cracked, GEM_HI[team]); return m; }

// ---- Nexus: the hero. A patterned four-step octagonal dais with stairs on every side, four white obelisks capped with
// team gems, a gold claw socket and the huge floating crystal (centre 6.1 m) with orbiting shards. 6 m footprint.
function octo(m, cx, cz, y0, y1, h, c) {
  for (let y = y0; y <= y1; y++) for (let z = Math.floor(cz - h); z < Math.ceil(cz + h); z++) for (let x = Math.floor(cx - h); x < Math.ceil(cx + h); x++) {
    const dx = Math.abs(x + 0.5 - cx), dz = Math.abs(z + 0.5 - cz);
    if (dx + dz > h * 1.42) continue;
    m.set(x, y, z, typeof c === 'function' ? c(x, y, z, dx, dz) : c);
  }
}
function nexusModel(team, state) {
  const T = TR[team], C = 60, m = new VoxelModel(120, 110, 120);
  const riser = (top) => (x, y, z, dx, dz) => {
    if (y === top) return Math.max(dx, dz) > (top < 6 ? 58.5 : 0) ? WH[4] : WH[3];
    const u = Math.floor((dx > dz ? z : x) / 4), v = y % 6;
    return (u + Math.floor(y / 3)) % 4 === 0 && v > 1 ? T[3] : v === 0 ? ST[2] : ST[3];
  };
  octo(m, C, C, 0, 5, 60, riser(5));
  octo(m, C, C, 6, 11, 52, riser(11));
  octo(m, C, C, 12, 17, 44, riser(17));
  octo(m, C, C, 18, 23, 36, (x, y, z, dx, dz) => {                         // the top: concentric patterned paving
    if (y < 23) return riser(23)(x, y, z, dx, dz);
    const d = Math.hypot(dx, dz);
    if (Math.abs(d - 30) < 1) return GO[3];
    if (Math.abs(d - 24) < 0.8) return T[3];
    const q = (Math.floor(d / 3) + Math.floor((Math.atan2(dz, dx) / Math.PI) * 16)) % 2;
    return d > 24 ? (q ? WH[3] : WH[4]) : (q ? ST[4] : WH[3]);
  });
  // stairs on four sides: 0.15 m treads up to the top
  for (let s = 0; s < 4; s++) for (let r = 0; r < 24; r++) {
    const h = Math.min(23, Math.round(r + 1)), u0 = 50, u1 = 69;
    const c = (x, y, z) => (y === h ? (r % 2 ? WH[4] : WH[3]) : ST[3]);
    if (s === 0) m.box(u0, 0, 119 - r, u1, h, 119 - r, c); else if (s === 1) m.box(u0, 0, r, u1, h, r, c);
    else if (s === 2) m.box(119 - r, 0, u0, 119 - r, h, u1, c); else m.box(r, 0, u0, r, h, u1, c);
  }
  for (const [x, z] of [[47, 104], [70, 104]]) m.box(x, 6, z, x + 1, 10, z + 1, GO[3]);
  if (state === 2) {
    m.ellipsoid(C, 24, C, 34, 10, 34, (x, y, z) => (hash3(x >> 1, y >> 1, z >> 1, 5) < 0.4 ? null : hash3(x, y, z, 6) < 0.12 ? T[2] : WH[3]));
    for (let k = 0; k < 18; k++) { const a = k * 2.4, r = 16 + (k % 5) * 6, x = Math.round(C + Math.cos(a) * r), z = Math.round(C + Math.sin(a) * r); gem(m, x, 26, z, 3, 5 + (k % 3), mix(GEM[team], 0x404048, 0.55), k); }
    m.paint((x, y, z, c) => (hash3(x, y, z, 31) < 0.08 ? mix(c, SOOT, 0.7) : c));
    return m;
  }
  for (const [x, z] of [[30, 30], [86, 30], [30, 86], [86, 86]]) {           // four obelisks
    for (let y = 18; y <= 92; y++) {
      const w = y < 30 ? 4 : y < 80 ? 3 : 2 - Math.floor((y - 80) / 6);
      if (w < 0) break;
      const c = y === 30 || y === 60 ? GO[3] : (y === 31 || y === 61) ? T[3] : y % 6 === 0 ? WH[2] : WH[4];
      m.box(x + 2 - w, y, z + 2 - w, x + 1 + w, y, z + 1 + w, c);
    }
  }
  // gold cradle: a ring with a glowing pool, six claws rising out and curling in to grip the crystal's lower tip
  m.cylinder(C, C, 24, 29, 19, 19, (x, y, z) => { const d = Math.hypot(x + 0.5 - C, z + 0.5 - C); return d < 15.5 ? (y === 24 ? T[4] : null) : y === 29 ? GO[4] : y === 24 ? GO[1] : GO[2]; });
  for (let z = C - 16; z <= C + 16; z++) for (let x = C - 16; x <= C + 16; x++) { const d = Math.hypot(x + 0.5 - C, z + 0.5 - C); if (d < 15.5) for (let y = 25; y <= 28; y++) m.set(x, y, z, null); }
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + Math.PI / 6;
    for (let s2 = 0; s2 <= 60; s2++) {
      const t = s2 / 60, r = 17.5 + 7 * Math.sin(Math.PI * t) - 9 * t, y = Math.round(29 + 43 * t), w = t > 0.85 ? 1 : 2;
      const px = C - 0.5 + Math.cos(a) * r, pz = C - 0.5 + Math.sin(a) * r;
      const col = t > 0.88 ? T[3] : (s2 % 12 === 0 ? GO[4] : GO[3]);
      m.box(Math.round(px - w / 2), y - 1, Math.round(pz - w / 2), Math.round(px + w / 2), y, Math.round(pz + w / 2), col);
    }
  }
  if (state === 1) damage(m, 20, 13);
  return m;
}
function nexusCrystal(team, cracked) {
  // a cluster: the main hexagonal crystal (centre on the 6.1 m anchor) and four smaller ones leaning out of its foot
  const m = new VoxelModel(120, 190, 120), col = GEM[team], cy = Math.round(NEXUS_CY * V);
  prism(m, 60, cy - 58, 60, 0, 1, 0, 19, 116, col, 6, cracked, GEM_HI[team]);
  [[0.6, 11, 62, 9.5], [2.2, 10, 54, 8.5], [3.75, 11, 66, 10], [5.2, 9, 48, 8]].forEach(([a, off, len, r], k) => {
    const ox = Math.cos(a), oz = Math.sin(a);
    prism(m, 60 + ox * off, cy - 50 + k * 3, 60 + oz * off, ox * 0.48, 1, oz * 0.48, r, len, mix(col, team ? TR[1][3] : TR[0][4], 0.15 + k * 0.06), 30 + k, cracked, GEM_HI[team]);
  });
  for (const [x, z] of [[30, 30], [86, 30], [30, 86], [86, 86]]) prism(m, x + 2, 94, z + 2, 0, 1, 0, 4, 12, team ? TR[1][3] : TR[0][4], 7, cracked, GEM_HI[team]);
  return m;
}
function nexusShards(team) {
  const m = new VoxelModel(120, 30, 120);
  for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2 + 0.4; gem(m, 60 + Math.cos(a) * 46, 15, 60 + Math.sin(a) * 46, 4, 9, TR[team][4], 20 + k); }
  return m;
}

// ---- fountain: the spawn platform (radius 4.6 m) as a sculpted BW fountain: patterned paving, a round white basin of
// water, a two-tier column with bowls spilling water, the team crystal on top
function fountainModel(team) {
  const T = TR[team], R = 92, C = 92, m = new VoxelModel(184, 92, 184);
  for (let z = 0; z < 184; z++) for (let x = 0; x < 184; x++) {
    const d = Math.hypot(x + 0.5 - C, z + 0.5 - C); if (d > R) continue;
    const a = Math.atan2(z + 0.5 - C, x + 0.5 - C);
    let c;
    if (d > R - 2) c = WH[4];
    else if (d > R - 4) c = T[3];
    else if (d > 40) c = (Math.floor(d / 6) + Math.floor((a / Math.PI) * 18)) % 2 ? WH[3] : ST[4];
    else c = (Math.floor(d / 4) + Math.floor((a / Math.PI) * 12)) % 2 ? WH[4] : WH[3];
    m.set(x, 0, z, c);
  }
  // basin: a 0.5 m white wall with a carved lip, water inside with ripple rings
  for (let z = 0; z < 184; z++) for (let x = 0; x < 184; x++) {
    const d = Math.hypot(x + 0.5 - C, z + 0.5 - C);
    if (d <= 36 && d > 32) for (let y = 1; y <= 10; y++) m.set(x, y, z, y === 10 ? (d > 35 ? WH[4] : WH[3]) : y === 9 ? WH[2] : (y % 4 === 0 ? WH[2] : WH[3]));
    else if (d <= 32) { m.box(x, 1, z, x, 6, z, ST[2]); m.set(x, 7, z, Math.abs(d - 22) < 0.8 || Math.abs(d - 14) < 0.7 ? RP.shallow[5] : d > 28 ? RP.shallow[3] : RP.water[3]); }
  }
  // column, bowls, streams
  m.cylinder(C, C, 8, 58, 5, 5, (x, y) => (y % 6 === 0 ? WH[2] : WH[4]));
  for (const [y0, r] of [[34, 18], [60, 10]]) {
    for (let k = 0; k < 5; k++) m.cylinder(C, C, y0 + k, y0 + k, r * (0.45 + k * 0.14), r * (0.45 + k * 0.14), k === 4 ? WH[4] : WH[3]);
    m.cylinder(C, C, y0 + 5, y0 + 5, r - 1, r - 1, RP.shallow[4]);
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2 + y0, x = Math.round(C - 0.5 + Math.cos(a) * (r + 0.5)), z = Math.round(C - 0.5 + Math.sin(a) * (r + 0.5));
      for (let y = 8; y < y0 + 5; y++) if ((y + k) % 5 !== 0) m.set(x, y, z, (y + k) % 3 ? RP.shallow[5] : RP.shallow[4]);
    }
  }
  m.cylinder(C, C, 66, 70, 4, 4, GO[3]);
  m.cylinder(C, C, 71, 72, 6, 6, T[3]);
  return m;
}
function fountainCrystal(team) { const m = new VoxelModel(184, 100, 184); prism(m, 92, 73, 92, 0, 1, 0, 6, 24, GEM[team], 4, false, GEM_HI[team]); return m; }

// ---- base dressing (DETAIL_M)
function shopModel(team) {
  const T = TR[team], m = new VoxelModel(52, 56, 32);
  m.box(0, 0, 0, 51, 1, 31, (x, y, z) => (x % 8 === 0 || z % 8 === 0 ? ST[3] : ST[4]));
  m.box(4, 2, 12, 47, 18, 22, (x, y, z) => (y % 4 === 1 ? WD[2] : z === 22 && x % 6 === 0 ? WD[1] : WD[3]));   // counter
  m.box(3, 19, 11, 48, 20, 23, WH[4]);
  for (const [x, z] of [[3, 6], [46, 6], [3, 26], [46, 26]]) m.box(x, 2, z, x + 2, 44, z + 2, (x2, y) => (y % 10 === 0 ? WD[1] : WD[3]));
  for (let x = 0; x < 52; x++) for (let z = 0; z < 32; z++) {                // striped awning, sloped to the front, scalloped
    const y = 45 + Math.floor((31 - z) / 6), stripe = Math.floor(x / 6) % 2;
    m.set(x, y, z, stripe ? T[3] : WH[4]);
    if (z === 31) for (let k = 1; k <= (x % 6 < 4 ? 3 : 1); k++) m.set(x, y - k, z, stripe ? T[2] : WH[3]);
  }
  for (const [x, c] of [[7, RP.flowerR], [13, RP.flowerY], [19, RP.blue], [25, RP.flowerK]]) { m.box(x, 21, 15, x + 3, 27, 18, (x2, y) => (y > 25 ? WH[4] : x2 === x ? c[3] : c[2])); m.box(x + 1, 28, 16, x + 2, 29, 17, WD[2]); }
  m.box(32, 21, 14, 44, 24, 20, WD[4]); m.box(33, 25, 15, 43, 26, 19, RP.flowerY[2]);
  m.box(19, 50, 31, 32, 56, 31, (x, y) => (y === 50 || y === 56 || x === 19 || x === 32 ? GO[3] : T[1]));
  m.box(24, 52, 31, 27, 54, 31, WH[4]);
  return m;
}
function lampModel() {
  const L = RP.lamp, m = new VoxelModel(12, 52, 12);
  m.box(3, 0, 3, 8, 2, 8, IR[2]); m.box(4, 3, 4, 7, 4, 7, IR[1]);
  m.box(5, 5, 5, 6, 40, 6, (x, y) => (y % 12 === 0 ? IR[3] : IR[1]));
  m.box(2, 41, 2, 9, 41, 9, IR[2]);
  m.box(3, 42, 3, 8, 47, 8, (x, y, z) => (x === 3 || x === 8 || z === 3 || z === 8 ? (y % 5 === 0 ? IR[1] : L[2]) : L[3]));
  m.box(2, 48, 2, 9, 48, 9, IR[2]); m.box(4, 49, 4, 7, 50, 7, IR[1]); m.box(5, 51, 5, 6, 51, 6, GO[3]);
  return m;
}
function benchModel() {
  const m = new VoxelModel(28, 18, 10);
  for (const x of [2, 24]) { m.box(x, 0, 1, x + 1, 8, 2, IR[1]); m.box(x, 0, 7, x + 1, 8, 8, IR[1]); m.box(x, 8, 1, x + 1, 16, 1, IR[1]); }
  m.box(0, 9, 1, 27, 9, 8, (x, y, z) => (z % 3 === 2 ? WD[1] : WD[3]));
  for (const y of [12, 15]) m.box(0, y, 0, 27, y + 1, 0, WD[3]);
  return m;
}
function flowerBedModel(seed) {
  const m = new VoxelModel(32, 10, 18), FL = [RP.flowerR, RP.flowerY, RP.flowerK, RP.flowerW][seed % 4];
  m.box(0, 0, 0, 31, 3, 17, (x, y, z) => (y === 3 ? WH[4] : (x + Math.floor(y / 2) * 2) % 4 === 0 ? RP.paveRed[2] : RP.paveRed[3]));
  m.box(1, 3, 1, 30, 3, 16, WD[0]);
  for (let z = 2; z < 16; z += 3) for (let x = 2 + (z % 2); x < 30; x += 3) {
    const h = 5 + (hash3(x, seed, z) < 0.5 ? 1 : 0);
    m.box(x, 4, z, x, h - 1, z, RP.grass[1]); m.set(x + 1, 4, z, RP.grass[3]);
    m.set(x, h, z, FL[3]); m.set(x - 1, h, z, FL[2]); m.set(x + 1, h, z, FL[2]); m.set(x, h, z + 1, FL[1]);
  }
  return m;
}
function railingModel(team, len) {
  const T = TR[team], m = new VoxelModel(len, 22, 3);
  m.box(0, 0, 0, len - 1, 2, 2, ST[3]); m.box(0, 2, 0, len - 1, 2, 2, ST[4]);
  for (let x = 0; x < len; x += 5) m.box(x, 3, 1, x, 19, 1, IR[2]);
  for (let x = 0; x < len; x++) { m.set(x, 8, 1, IR[3]); m.set(x, 16, 1, IR[3]); if (x % 5 === 2) { m.set(x, 11, 1, T[3]); m.set(x, 12, 1, T[4]); m.set(x, 13, 1, T[3]); } }
  m.box(0, 20, 0, len - 1, 21, 2, T[3]); m.box(0, 21, 0, len - 1, 21, 2, T[4]);
  for (let x = 0; x < len; x += 20) m.box(x, 0, 0, x + 2, 21, 2, WH[3]);
  return m;
}
function kerbModel() { const m = new VoxelModel(10, 2, 3); m.box(0, 0, 0, 9, 1, 2, (x, y) => (y === 1 ? (x === 0 ? WH[2] : WH[4]) : WH[3])); return m; }

// ---- more base dressing, camps and pits (DETAIL_M)
const LEAF = RP.leaf, LEAFB = RP.leafB, BARK = RP.bark;
const LT = (() => { const l = [-0.55, 0.72, 0.42], s = Math.hypot(...l); return l.map((v) => v / s); })();
function blob(m, cx, cy, cz, rx, ry, R, seed) {
  // a BW round canopy blob at DETAIL_M: lit upper-left, hue-shifted dark lower-right, ink rim underneath
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let z = Math.floor(cz - rx); z <= Math.ceil(cz + rx); z++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, dz = (z + 0.5 - cz) / rx;
    const d2 = dx * dx + dy * dy + dz * dz; if (d2 > 1 - hash3(x >> 1, y >> 1, z >> 1, seed) * 0.12) continue;
    const l = (dx * LT[0] + dy * LT[1] + dz * LT[2]) / Math.sqrt(d2 || 1) + (hash3(x >> 1, y >> 1, z >> 1, seed + 1) - 0.5) * 0.3;
    m.set(x, y, z, dy < -0.55 ? R[0] : R[l > 0.7 ? 4 : l > 0.35 ? 3 : l > -0.05 ? 2 : 1]);
  }
}
function hedgeModel(seed) {
  const m = new VoxelModel(10, 14, 9), R = seed % 2 ? LEAFB : LEAF;
  for (let y = 0; y < 13; y++) for (let z = 0; z < 9; z++) for (let x = 0; x < 10; x++) {
    if (y > 10 && (z === 0 || z === 8) && hash3(x, y, z, seed) < 0.5) continue;
    const top = y >= 11, front = z === 8, h = hash3(x >> 1, y >> 1, z, seed);
    m.set(x, y, z, top ? (h < 0.3 ? R[3] : R[4]) : front ? (y < 2 ? R[0] : h < 0.35 ? R[1] : R[2]) : (h < 0.4 ? R[1] : R[2]));
  }
  if (seed % 3 === 0) for (const [x, z] of [[2, 8], [7, 8], [4, 8]]) m.set(x, 6 + (x % 3), z + 0, RP.flowerW[2]);
  return m;
}
function planterTreeModel(seed) {
  const m = new VoxelModel(24, 48, 24);
  m.box(2, 0, 2, 21, 8, 21, (x, y, z) => (y === 8 ? (x === 2 || x === 21 || z === 2 || z === 21 ? WH[4] : BARK[1]) : (x + z + Math.floor(y / 3)) % 5 === 0 ? ST[2] : ST[3]));
  m.box(11, 9, 11, 12, 22, 12, (x) => (x === 11 ? BARK[3] : BARK[2]));
  blob(m, 12, 30, 12, 10, 9, seed % 2 ? LEAFB : LEAF, seed);
  blob(m, 10.5, 38, 13, 6, 5, seed % 2 ? LEAFB : LEAF, seed + 3);
  if (seed % 2 === 0) for (let k = 0; k < 8; k++) { const a = k * 0.8 + seed; m.set(Math.round(12 + Math.cos(a) * 9), Math.round(30 + Math.sin(a * 1.7) * 6), Math.round(12 + Math.sin(a) * 9), RP.flowerR[2]); }
  return m;
}
function statueModel(team, kind) {
  const T = TR[team], m = new VoxelModel(22, 60, 22);
  m.box(0, 0, 0, 21, 3, 21, ST[3]); m.box(0, 3, 0, 21, 3, 21, WH[4]);
  m.box(3, 4, 3, 18, 24, 18, (x, y, z) => (y === 24 || y === 4 ? WH[4] : (x === 3 || x === 18 || z === 3 || z === 18) && y > 8 && y < 20 && ((x + z + y) % 4 === 0) ? T[3] : WH[3]));
  m.box(6, 12, 19, 15, 17, 19, (x, y) => (Math.abs(x - 10.5) + Math.abs(y - 14.5) < 3 ? GO[3] : T[2]));   // crest
  m.box(2, 25, 2, 19, 27, 19, ST[4]);
  if (kind === 0) {                                     // a stone orb in a gold band
    for (let y = 28; y < 48; y++) for (let z = 1; z < 21; z++) for (let x = 1; x < 21; x++) {
      const dx = x + 0.5 - 11, dy = y + 0.5 - 38, dz = z + 0.5 - 11, d = Math.hypot(dx, dy, dz); if (d > 9.5) continue;
      const l = (dx * LT[0] + dy * LT[1] + dz * LT[2]) / d;
      m.set(x, y, z, Math.abs(dy) < 1.2 ? GO[3] : l > 0.4 ? WH[4] : l > -0.2 ? WH[3] : WH[2]);
    }
    m.box(10, 48, 10, 11, 50, 11, GO[3]);
  } else {                                              // a stone urn spilling flowers
    for (let y = 28; y < 44; y++) { const r = y < 32 ? 4 + (y - 28) : y < 40 ? 8 : 9 - (y - 40) * 0.5; m.cylinder(11, 11, y, y, r, r, y === 43 ? WH[4] : y % 5 === 0 ? T[3] : WH[3]); }
    blob(m, 11, 47, 11, 8, 5, LEAF, 3);
    for (let k = 0; k < 12; k++) { const a = k * 0.53; m.set(Math.round(11 + Math.cos(a) * 7), 49 + (k % 3), Math.round(11 + Math.sin(a) * 7), [RP.flowerK, RP.flowerY, RP.flowerW][k % 3][2]); }
  }
  return m;
}
function bannerPoleModel(team) {
  const T = TR[team], m = new VoxelModel(14, 64, 4);
  m.box(4, 0, 0, 9, 2, 3, ST[3]); m.box(6, 3, 1, 7, 60, 2, IR[1]); m.box(5, 61, 1, 8, 62, 2, GO[3]); m.box(6, 63, 1, 7, 63, 2, GO[4]);
  m.box(1, 56, 1, 12, 56, 2, GO[2]);
  for (let y = 30; y <= 55; y++) for (let x = 2; x <= 11; x++) {
    if (y < 34 && Math.abs(x - 6.5) < (34 - y) * 1.2) continue;
    const edge = x === 2 || x === 11, em = Math.abs(x - 6.5) + Math.abs(y - 45) < 3.5;
    m.set(x, y, 0, edge ? T[1] : em ? (Math.abs(x - 6.5) + Math.abs(y - 45) < 1.6 ? WH[4] : GO[3]) : (y % 6 === 0 ? T[2] : T[3]));
  }
  return m;
}
function potModel(seed) {
  const m = new VoxelModel(12, 16, 12), FL = [RP.flowerR, RP.flowerY, RP.flowerK, RP.flowerW][seed % 4], TC = RP.paveRed;
  for (let y = 0; y < 8; y++) m.cylinder(6, 6, y, y, 3.4 + y * 0.3, 3.4 + y * 0.3, y === 7 ? TC[4] : y === 6 ? TC[2] : (y % 3 === 0 ? TC[2] : TC[3]));
  m.cylinder(6, 6, 7, 7, 4.5, 4.5, RP.wood[0]);
  blob(m, 6, 10, 6, 5, 3.5, RP.leaf, seed + 11);
  for (let k = 0; k < 7; k++) { const a = k * 0.9 + seed; m.set(Math.round(6 + Math.cos(a) * 3.5), 12 + (k % 2), Math.round(6 + Math.sin(a) * 3.5), FL[2 + (k % 2)]); }
  return m;
}
function bollardModel(team) {
  const m = new VoxelModel(6, 14, 6);
  m.box(0, 0, 0, 5, 1, 5, ST[3]); m.box(1, 2, 1, 4, 10, 4, (x, y) => (y === 7 ? TR[team][3] : x === 1 ? WH[4] : WH[3])); m.box(1, 11, 1, 4, 11, 4, GO[3]); m.box(2, 12, 2, 3, 12, 3, GO[4]);
  return m;
}
function campStoneModel(seed) {
  const R = RP.rock, m = new VoxelModel(10, 8, 9);
  m.ellipsoid(5, 1, 4.5, 4.5, 6 + (seed % 3), 4, (x, y, z) => { const l = (-(x - 5) * 0.6 + (y - 1) * 0.6 + (z - 4.5) * 0.4) / 5; return y > 5 && seed % 2 ? RP.grass[3] : l > 0.4 ? R[4] : l > 0 ? R[3] : R[2]; });
  return m;
}
function totemModel(col) {
  // a carved wooden totem: three stacked faces, wings, an element gem on top, a stone footing
  const m = new VoxelModel(18, 46, 12), W = RP.wood;
  m.box(2, 0, 1, 15, 3, 10, RP.rock[3]); m.box(2, 3, 1, 15, 3, 10, RP.rock[4]);
  for (let k = 0; k < 3; k++) {
    const y0 = 4 + k * 11;
    m.box(4, y0, 2, 13, y0 + 10, 9, (x, y, z) => (y === y0 ? W[1] : x === 4 ? W[3] : W[2]));
    m.box(5, y0 + 6, 10, 7, y0 + 7, 10, k === 1 ? col : WH[4]); m.box(10, y0 + 6, 10, 12, y0 + 7, 10, k === 1 ? col : WH[4]);   // eyes
    m.box(6, y0 + 2, 10, 11, y0 + 3, 10, W[0]);                                                                                  // mouth
    m.box(8, y0 + 4, 10, 9, y0 + 5, 11, W[3]);                                                                                   // nose
  }
  m.box(0, 26, 4, 3, 30, 7, W[3]); m.box(14, 26, 4, 17, 30, 7, W[3]); m.box(0, 30, 4, 1, 31, 7, col); m.box(16, 30, 4, 17, 31, 7, col);
  m.box(6, 37, 4, 11, 37, 7, GO[3]);
  for (let y = 38; y < 46; y++) { const r = y < 42 ? (y - 37) * 0.8 : (46 - y) * 0.8; m.box(Math.round(8.5 - r), y, Math.round(5.5 - r * 0.6), Math.round(8.5 + r) - 1, y, Math.round(5.5 + r * 0.6), y > 41 ? mix(col, 0xffffff, 0.35) : col); }
  return m;
}
function monolithModel(col, seed) {
  const R = RP.rock, m = new VoxelModel(16, 50, 14);
  for (let y = 0; y < 48; y++) { const w = 6 - Math.floor(y / 14), tilt = Math.floor(y / 16) * (seed % 2 ? 1 : -1); m.box(8 - w + tilt, y, 7 - w + 1, 8 + w - 1 + tilt, y, 7 + w - 2, (x, yy, z) => (x <= 8 - w + tilt ? R[3] : z === 7 + w - 2 ? R[2] : R[1])); }
  for (let y = 12; y < 40; y += 6) m.box(7, y, 12, 9, y + 2, 12, col);                                                         // glowing runes
  return m;
}
const CAMP_COL = { verdant_warden: 0x5ad06a, crimson_brute: 0xe0503a, thornback: 0x9acb4a, mire_toad: 0x9a6ad8, ash_stalker: 0xf08a3a, shard_golem: 0x6ad8f0, rift_skitter: 0xc06af0 };

function laneDistAt(x, z) {
  let d = 1e9;
  for (const k in LANES) { const P = LANES[k]; for (let i = 0; i < P.length - 1; i++) d = Math.min(d, segDist(x, z, P[i].x, P[i].y, P[i + 1].x, P[i + 1].y)); }
  return d;
}

export class VoxelStructures {
  constructor(THREE, ctx, parent) {
    this.THREE = THREE; this.ctx = ctx; this.group = new THREE.Group(); this.group.name = 'voxel-structures';
    parent.add(this.group);
    this.mat = fadeMaterial(THREE);
    this.plain = new THREE.MeshLambertMaterial({ vertexColors: true });
    this.crystalMat = GLOW.map((c) => new THREE.MeshLambertMaterial({ vertexColors: true, emissive: new THREE.Color(c), emissiveIntensity: 0.5 }));
    this.cache = new Map(); this.views = new Map(); this.world = null; this.queue = []; this.inst = new Map();
    for (const f of FOUNTAINS) {
      this.place(`fountain:${f.team}`, () => fountainModel(f.team), [92, 0, 92], f.x, f.y, 0, this.mat);
      this.place(`fountainC:${f.team}`, () => fountainCrystal(f.team), [92, 0, 92], f.x, f.y, 0, this.crystalMat[f.team]);
    }
    for (const team of [0, 1]) {
      const p = team === 0 ? { x: 6.4, y: 104, fx: 12.5, fy: 108.5 } : { x: 104, y: 6.4, fx: 108.5, fy: 12.5 };   // legacy shop anchor (mirrored x<->y)
      this.place(`shop:${team}`, () => shopModel(team), [26, 0, 16], p.x, p.y, Math.atan2(p.fx - p.x, p.fy - p.y), this.mat);
    }
    for (const b of BASES) this.dressBase(b);
    this.dressCamps();
    try { if (globalThis.__moba) globalThis.__moba.mtVoxelAnchors = ANCHORS; } catch (e) { /* */ }
  }
  /** a static placement: all placements of one key become one InstancedMesh, built from the per-frame queue */
  place(key, build, pivot, x, z, rotY, mat, y, cast = true, sc = 1) {
    let e = this.inst.get(key);
    if (!e) {
      e = { list: [], mat: mat || this.mat, cast: cast && mat !== this.crystalMat[0] && mat !== this.crystalMat[1] };
      this.inst.set(key, e);
      this.need(key, build, pivot, (g) => {
        const im = new this.THREE.InstancedMesh(g, e.mat, e.list.length);
        e.list.forEach((m4, k) => im.setMatrixAt(k, m4));
        im.instanceMatrix.needsUpdate = true; im.castShadow = e.cast; im.receiveShadow = true;
        im.computeBoundingSphere && im.computeBoundingSphere();
        im.name = 'voxel-deco-' + key; this.group.add(im);
      });
    }
    const T = this.THREE, q = new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), rotY || 0);
    e.list.push(new T.Matrix4().compose(new T.Vector3(x, y != null ? y : heightAt(x, z), z), q, new T.Vector3(sc, sc, sc)));
  }
  need(key, build, pivot, done) {
    const g = this.cache.get(key);
    if (g && g.isBufferGeometry) { done(g); return; }
    if (g) { g.push(done); return; }
    this.cache.set(key, [done]);
    this.queue.push({ key, build, pivot });
  }
  pump(budgetMs) {
    const t0 = performance.now();
    while (this.queue.length && performance.now() - t0 < budgetMs) {
      const q = this.queue.shift(), waiting = this.cache.get(q.key);
      const g = geo(this.THREE, q.build(), q.pivot);
      this.cache.set(q.key, g);
      for (const f of waiting) f(g);
    }
  }
  dressBase(b) {
    const T = b.team, R = b.radius;
    const blockers = [...STRUCTS.filter((q) => q.team === T).map((q) => [q.x, q.y, q.kind === 'nexus' ? 5.2 : 2.6])];
    for (const f of FOUNTAINS) if (f.team === T) blockers.push([f.x, f.y, 6.6]);
    blockers.push(T === 0 ? [6.4, 104, 3.4] : [104, 6.4, 3.4]);
    const free = (x, z, pad = 0) => x > 1 && z > 1 && x < 119 && z < 119 && !blockers.some(([bx, bz, r]) => Math.hypot(x - bx, z - bz) < r + pad);
    // hedges frame the plaza just inside the kerb, opening for every lane / path; team banners on poles at the openings
    const RH = R - 2.05, nH = Math.ceil((2 * Math.PI * RH) / 0.5), mouths = [];
    let prevOk = null;
    for (let k = 0; k <= nH; k++) {
      const a = (k / nH) * Math.PI * 2, x = b.x + Math.cos(a) * RH, z = b.y + Math.sin(a) * RH;
      const ok = WALK(x, z) > 0.5 && laneDistAt(x, z) > LANE_W + 1.0 && free(x, z);
      if (prevOk !== null && ok !== prevOk && WALK(x, z) > 0.5 && laneDistAt(x, z) < LANE_W + 1.6) mouths.push([x, z, a]);
      prevOk = ok;
      if (ok && k < nH) this.place(`hedge:${k % 3}`, () => hedgeModel(k % 3), [5, 0, 4.5], x, z, -a - Math.PI / 2, this.plain, null, false);
    }
    const seen = [];
    for (const [x, z, a] of mouths) {
      if (seen.some(([px, pz]) => Math.hypot(px - x, pz - z) < 2)) continue; seen.push([x, z]);
      this.place(`bpole:${T}`, () => bannerPoleModel(T), [7, 0, 2], x, z, -a - Math.PI / 2, this.mat);
    }
    // an inner ring of life: lamps, planter trees, benches, flower beds, statues
    // rings of life (dressing only, no collision): a dense ring of lamps, pots, planter trees, benches, beds and statues,
    // bollards with pots on the diamond band, an inner ring of pots and lamps, lamps and pots lining every lane path
    const used = [];
    const put = (kind, x, z, rot, minD = 0.95) => {
      if (used.some(([ux, uz]) => Math.hypot(ux - x, uz - z) < minD)) return; used.push([x, z]);
      if (kind === 'lamp') this.place('lamp', lampModel, [6, 0, 6], x, z, 0);
      else if (kind === 'pot') this.place(`pot:${used.length % 4}`, () => potModel(used.length % 4), [6, 0, 6], x, z, rot, this.plain, null, false);
      else if (kind === 'bollard') this.place(`bollard:${T}`, () => bollardModel(T), [3, 0, 3], x, z, 0, this.plain, null, false);
      else if (kind === 'tree') this.place(`ptree:${used.length % 2}`, () => planterTreeModel(used.length % 2), [12, 0, 12], x, z, rot, this.mat);
      else if (kind === 'bench') this.place('bench', benchModel, [14, 0, 5], x, z, rot + Math.PI);
      else if (kind === 'bed') this.place(`bed:${used.length % 4}`, () => flowerBedModel(used.length % 4), [16, 0, 9], x, z, rot, this.plain, null, false);
      else this.place(`statue:${T}:${kind === 'statue' ? 0 : 1}`, () => statueModel(T, kind === 'statue' ? 0 : 1), [11, 0, 11], x, z, rot, this.mat);
    };
    const ring = (r, slots, kinds, pad = 0.6) => {
      let n = 0;
      for (let k = 0; k < slots; k++) {
        const a = (k / slots) * Math.PI * 2, x = b.x + Math.cos(a) * r, z = b.y + Math.sin(a) * r;
        if (WALK(x, z) < 0.8 || laneDistAt(x, z) < LANE_W + pad || !free(x, z)) continue;
        put(kinds[n++ % kinds.length], x, z, -a - Math.PI / 2);
      }
    };
    ring(R - 4.6, 80, ['lamp', 'pot', 'tree', 'pot', 'bench', 'bed', 'pot', 'statue', 'pot', 'lamp', 'tree', 'pot', 'bed', 'bench', 'pot', 'statue2']);
    ring(R - 3.1, 64, ['bollard', 'pot', 'bollard', 'bollard', 'pot', 'bollard'], 0.3);
    ring(R - 7.0, 44, ['pot', 'lamp', 'pot', 'bed', 'pot', 'tree'], 0.4);
    // a jittered scatter over the open plaza (lane centre lines, the emblem and the Nexus ring stay clear)
    for (let gz = b.y - R; gz <= b.y + R; gz += 2.3) for (let gx = b.x - R; gx <= b.x + R; gx += 2.3) {
      const hx = hash3(Math.round(gx * 10), 61, Math.round(gz * 10)), hz = hash3(Math.round(gx * 10), 62, Math.round(gz * 10)), h = hash3(Math.round(gx * 10), 63, Math.round(gz * 10));
      const x = gx + (hx - 0.5) * 1.1, z = gz + (hz - 0.5) * 1.1, dB = Math.hypot(x - b.x, z - b.y);
      if (dB > R - 2.8 || dB < 2.9 || h < 0.3) continue;
      if (WALK(x, z) < 0.8 || laneDistAt(x, z) < 2.6 || !free(x, z)) continue;
      const kind = h < 0.52 ? 'pot' : h < 0.64 ? 'lamp' : h < 0.75 ? 'bed' : h < 0.85 ? 'tree' : h < 0.94 ? 'bench' : 'statue2';
      put(kind, x, z, Math.floor(hx * 4) * Math.PI / 2, 1.5);
    }
    for (const key in LANES) {                                                // lamps and pots line the lane paths
      const P = LANES[key];
      for (let i = 0; i < P.length - 1; i++) {
        const ax = P[i].x, az = P[i].y, bx = P[i + 1].x, bz = P[i + 1].y, L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L;
        for (let d = 1; d < L; d += 2.6) for (const side of [-1, 1]) {
          const x = ax + ux * d - uz * side * (LANE_W + 0.35), z = az + uz * d + ux * side * (LANE_W + 0.35);
          const dB = Math.hypot(x - b.x, z - b.y);
          if (dB > R - 2.6 || dB < 5 || WALK(x, z) < 0.8 || !free(x, z)) continue;
          put(Math.round(d / 2.6) % 2 ? 'lamp' : 'pot', x, z, Math.atan2(ux, uz));
        }
      }
    }
    // the plaza interior: statues and planter trees round the emblem, flower beds and lamps round the Nexus ring
    for (let k = 0; k < 4; k++) {
      const a = Math.PI / 4 + (k * Math.PI) / 2, x = b.x + Math.cos(a) * 3.1, z = b.y + Math.sin(a) * 3.1;
      if (!free(x, z, -1.2) || laneDistAt(x, z) < LANE_W - 1) continue;
      if (k % 2) this.place(`statue:${T}:${k % 4 === 1 ? 0 : 1}`, () => statueModel(T, k % 4 === 1 ? 0 : 1), [11, 0, 11], x, z, -a - Math.PI / 2, this.mat);
      else this.place(`ptree:${k % 4 === 0 ? 0 : 1}`, () => planterTreeModel(k % 4 === 0 ? 0 : 1), [12, 0, 12], x, z, -a, this.mat);
    }
    const nx = STRUCTS.find((q) => q.kind === 'nexus' && q.team === T);
    if (nx) for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 + Math.PI / 8, x = nx.x + Math.cos(a) * 4.75, z = nx.y + Math.sin(a) * 4.75;
      if (WALK(x, z) < 0.8 || laneDistAt(x, z) < LANE_W - 0.4) continue;
      if (k % 2) this.place('lamp', lampModel, [6, 0, 6], x, z, 0);
      else this.place(`bed:${k % 4}`, () => flowerBedModel(k % 4), [16, 0, 9], x, z, -a - Math.PI / 2, this.plain, null, false);
    }
    // railings on the unwalkable ring just outside the plaza (BW iron railings with a team rail)
    const RW = R + 1.6, nR = 120, ok = [];
    for (let k = 0; k < nR; k++) {
      const a = (k / nR) * Math.PI * 2, x = b.x + Math.cos(a) * RW, z = b.y + Math.sin(a) * RW;
      const xi = b.x + Math.cos(a) * (R - 1.0), zi = b.y + Math.sin(a) * (R - 1.0);
      ok.push(x > 0.6 && z > 0.6 && x < 119.4 && z < 119.4 && WALK(x, z) < -0.4 && WALK(xi, zi) > 0.3 && heightAt(x, z) < 1.2);
    }
    const len = Math.ceil((2 * Math.PI * RW / nR) * V) + 1;
    for (let k = 0; k < nR; k++) {
      if (!ok[k]) continue;
      const a = ((k + 0.5) / nR) * Math.PI * 2, x = b.x + Math.cos(a) * RW, z = b.y + Math.sin(a) * RW;
      this.place(`rail:${T}:${len}`, () => railingModel(T, len), [len / 2, 0, 1.5], x, z, -a - Math.PI / 2, this.plain, Math.max(0, heightAt(x, z)), false);
    }
    // kerb stones along the plaza edge (the painted kerb's relief)
    const RK = R - 1.62;
    for (let k = 0; k < 220; k++) {
      const a = (k / 220) * Math.PI * 2, x = b.x + Math.cos(a) * RK, z = b.y + Math.sin(a) * RK;
      if (x < 0.5 || z < 0.5 || x > 119.5 || z > 119.5 || WALK(x, z) < 0.2) continue;
      this.place('kerb', kerbModel, [5, 0, 1.5], x, z, -a - Math.PI / 2, this.plain, null, false);
    }
  }
  dressCamps() {
    for (const cp of CAMPS) {
      if (cp.epic) continue;
      const col = CAMP_COL[cp.monster] || 0xd0d0d0;
      // the totem stands on the clearing's wall side; a ring of stones round the clearing
      let best = null;
      for (let k = 0; k < 24; k++) { const a = (k / 24) * Math.PI * 2, x = cp.x + Math.cos(a) * 3.9, z = cp.y + Math.sin(a) * 3.9, w = WALK(x, z); if (!best || w < best.w) best = { a, x, z, w }; }
      const key = `totem:${cp.monster}`;
      this.place(key, () => totemModel(col), [9, 0, 6], best.x, best.z, Math.atan2(cp.x - best.x, cp.y - best.z), this.mat, null, true, 2);
      for (let k = 0; k < 11; k++) {
        const a = best.a + ((k + 0.5) / 11) * Math.PI * 2, r = 3.35 + (hash3(k, 3, Math.round(cp.x)) - 0.5) * 0.3;
        const x = cp.x + Math.cos(a) * r, z = cp.y + Math.sin(a) * r;
        if (Math.abs(((a - best.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI) < 0.45) continue;   // leave the totem's spot
        this.place(`cstone:${k % 3}`, () => campStoneModel(k % 3), [5, 0, 4.5], x, z, a, this.plain, null, false);
      }
    }
    for (const p of PITS) {
      const col = p.id === 'tyrant' ? 0xb05af0 : 0x5ac8ff;
      for (let k = 0; k < 9; k++) {
        const a = (k / 9) * Math.PI * 2 + 0.3, x = p.x + Math.cos(a) * (p.radius + 0.4), z = p.y + Math.sin(a) * (p.radius + 0.4);
        if (laneDistAt(x, z) < LANE_W + 0.5) continue;
        this.place(`mono:${p.id}:${k % 2}`, () => monolithModel(col, k % 2), [8, 0, 7], x, z, -a + Math.PI / 2);
      }
    }
  }
  /** the body + crystal meshes of one state (queued on first need) */
  stateParts(v, st) {
    if (v.parts[st]) return v.parts[st];
    const { team, kind, tier } = v, out = [];
    const add = (key, build, pivot, mat, extra) => {
      const m = new this.THREE.Mesh(undefined, mat || this.mat);
      m.visible = false; m.castShadow = !mat; m.receiveShadow = true; m.userData.ready = false;
      Object.assign(m.userData, extra || {});
      v.g.add(m); out.push(m);
      this.need(key, build, pivot, (g) => { m.geometry = g; m.userData.ready = true; m.visible = v.state === st; });
    };
    if (kind === 'tower') {
      add(`tower:${team}:${tier}:${st}`, () => towerModel(team, tier, st), [28, 0, 28]);
      if (st < 2) add(`towerC:${team}:${tier}:${st}`, () => towerCrystal(team, tier, st === 1), [28, 0, 28], this.crystalMat[team]);
    } else if (kind === 'inhibitor') {
      add(`inhib:${team}:${st}`, () => inhibitorModel(team, st), [32, 0, 32]);
      if (st < 2) add(`inhibC:${team}:${st}`, () => inhibitorCrystal(team, st === 1), [32, 0, 32], this.crystalMat[team]);
    } else {
      add(`nexus:${team}:${st}`, () => nexusModel(team, st), [60, 0, 60]);
      if (st < 2) {
        add(`nexusC:${team}:${st}`, () => nexusCrystal(team, st === 1), [60, 0, 60], this.crystalMat[team], { bob: 1 });
        if (st === 0) add(`nexusS:${team}`, () => nexusShards(team), [60, 15, 60], this.crystalMat[team], { spin: 1 });
      }
    }
    v.parts[st] = out;
    return out;
  }
  buildView(s) {
    const team = s.team === 1 ? 1 : 0, kind = s.kind, tier = s.tier || 1;
    const g = new this.THREE.Group(); g.name = `voxel-${kind}-${s.id}`;
    g.position.set(s.x, heightAt(s.x, s.y), s.y);
    g.rotation.y = kind === 'nexus' ? 0 : team === 0 ? Math.PI * 0.25 : -Math.PI * 0.75;   // doors face down the lane
    this.group.add(g);
    return { g, team, kind, tier, parts: [null, null, null], state: -1 };
  }
  update(t) {
    const time = (t && t.time) || 0;
    for (let k = 0; k < 2; k++) this.crystalMat[k].emissiveIntensity = 0.45 + 0.18 * Math.sin(time * 1.7 + k * 1.3);
    const w = t && t.world;
    if (w && w.structures) {
      if (this.world !== w) { for (const v of this.views.values()) this.group.remove(v.g); this.views.clear(); this.world = w; }
      for (const s of w.structures) {
        if (s.kind !== 'tower' && s.kind !== 'inhibitor' && s.kind !== 'nexus') continue;
        let v = this.views.get(s.id); if (!v) this.views.set(s.id, (v = this.buildView(s)));
        const st = !s.alive ? 2 : s.maxHp > 0 && s.hp / s.maxHp < 0.5 ? 1 : 0;
        if (st !== v.state) {
          const prev = v.state; v.state = st; this.stateParts(v, st);
          // keep the old state showing until the new one is built (no blank frame)
          v.parts.forEach((P, k) => P && P.forEach((p) => (p.visible = p.userData.ready && (k === st || (k === prev && !v.parts[st].every((q) => q.userData.ready))))));
        } else if (v.parts[st] && v.parts.some((P, k) => k !== st && P && P.some((p) => p.visible)) && v.parts[st].every((q) => q.userData.ready)) {
          v.parts.forEach((P, k) => P && P.forEach((p) => (p.visible = k === st)));
        }
        if (v.kind === 'nexus' && st < 2) for (const p of v.parts[st]) {
          if (p.userData.bob) p.position.y = Math.sin(time * 1.3) * 0.1;
          if (p.userData.spin) { p.rotation.y = time * 0.45; p.position.y = 4.6 + Math.sin(time * 1.1) * 0.15; }
        }
      }
    }
    this.pump(this.queue.length > 6 ? 40 : 12);
  }
}
