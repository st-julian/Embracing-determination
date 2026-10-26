// game/art/tiles/ground.js — procedural ground materials + corner (Wang) autotiling for the pixel-art world.
// Owner: pixel-world look-dev.
//
// Grid: 1 tile = 1 m = TILE (32) art px, the same density as every unit sprite (PPM 32 in mt/render/sprites.js).
// Each ground LAYER is a binary corner grid (one value per whole metre, like a Wang-corner / "blob" autotile set): the
// mask inside a tile is the bilinear blend of its 4 corners plus a small tileable wobble, thresholded hard at 0.5. So
// every tile is one of 16 corner cases per layer (× 16 wobble phases, period 128 px) — exactly a Wang tileset, also
// evaluable per pixel in a fragment shader from a 121×121 corner texture. Edge decoration (path lips, shore foam,
// cliff faces, contact shadows) is derived from the masks with neighbour rules, on whole art pixels, no dithering.
//
// Materials are tileable colour functions of world art px (period 32/64/128): grass, lawn, forest floor, dirt, sand,
// water (4 animated frames), stone paving (team tint), tall grass blades (2 sway frames), cliff faces.

import { PAL, paveRamp } from './palette.js';
import { hash2, vnoise, mix, shadeCol } from './core.js';

export const TILE = 32;
export const FACE = 44;          // cliff face height in art px (south-facing faces are drawn inside the wall footprint)
export const PERIOD = 128;       // wobble/texture period (4 tiles)

/** layer ids, bottom -> top */
export const LAYERS = ['lawn', 'dirt', 'pave', 'sand', 'water', 'deep', 'tall', 'wall'];
// [seed, amplitude, coarse cell px, fine cell px, fine weight]: paths/shores are smooth curves, cliffs a bit rockier
const WOBBLE = { lawn: [11, 0.5, 16, 4, 0.3], dirt: [21, 0.42, 32, 8, 0.18], pave: [31, 0.16, 16, 4, 0.3], sand: [41, 0.5, 32, 8, 0.2], water: [51, 0.5, 32, 8, 0.22], deep: [61, 0.32, 48, 16, 0.25], tall: [71, 0.45, 16, 4, 0.3], wall: [81, 0.62, 16, 4, 0.3] };

/** mask of a layer at world art px (x, y); corner(cx, cy) -> 0|1 */
export function maskAt(corner, layer, x, y) {
  const tx = Math.floor(x / TILE), ty = Math.floor(y / TILE);
  const u = (x - tx * TILE + 0.5) / TILE, v = (y - ty * TILE + 0.5) / TILE;
  const a = corner(tx, ty), b = corner(tx + 1, ty), c = corner(tx, ty + 1), d = corner(tx + 1, ty + 1);
  if (a === b && b === c && c === d) return a;
  const f = (a + (b - a) * u) * (1 - v) + (c + (d - c) * u) * v;
  const [seed, amp, c0, c1, w1] = WOBBLE[layer];
  const n = vnoise(x, y, c0, seed, PERIOD) * (1 - w1) + vnoise(x, y, c1, seed + 3, PERIOD) * w1 - 0.5;
  return f + amp * n > 0.5 ? 1 : 0;
}

// ------------------------------------------------------------------------------------------------ materials
const P = PAL;
const mod = (a, n) => ((a % n) + n) % n;

/** tiny tuft stamps (rows top -> bottom): d = dark, l = light, h = highlight */
const TUFTS = [
  ['d...d', '.d.d.', '..d..'],
  ['l.d', 'ldd', '.d.'],
  ['h..', 'l.d', '.dd'],
  ['.h.', 'l.d', 'd.d'],
];
const FLOWERS = [P.flowerW, P.flowerY, P.flowerR, P.flowerK, P.flowerP];

/** generic tuft-scatter texture: cells of `cell` px, probability p; returns 'd'|'l'|'h' or null */
function tuftAt(x, y, cell, p, seed) {
  const cx = Math.floor(x / cell), cy = Math.floor(y / cell);
  const pc = PERIOD / cell, hx = mod(cx, pc), hy = mod(cy, pc);
  if (hash2(hx, hy, seed) > p) return null;
  const t = TUFTS[Math.floor(hash2(hx, hy, seed + 1) * TUFTS.length)];
  const ox = Math.floor(hash2(hx, hy, seed + 2) * (cell - t[0].length)), oy = Math.floor(hash2(hx, hy, seed + 3) * (cell - t.length));
  const lx = x - cx * cell - ox, ly = y - cy * cell - oy;
  if (lx < 0 || ly < 0 || ly >= t.length || lx >= t[0].length) return null;
  const ch = t[ly][lx]; return ch === '.' ? null : ch;
}

export function grassCol(x, y, R = P.grass) {
  const patch = vnoise(x, y, 56, 5, PERIOD * 2) > 0.62;
  const ramp = patch ? P.grassB : R;
  const t = tuftAt(x, y, 8, 0.5, 7);
  if (t === 'd') return ramp[1];
  if (t === 'l') return ramp[3];
  if (t === 'h') return ramp[4];
  return ramp[2];
}
/** mown lawn: 1-tile stripes, alternate tone, sparse tufts */
export function lawnCol(x, y) {
  const R = P.lawn, s = Math.floor(x / (TILE * 2)) & 1;
  const t = tuftAt(x, y, 11, 0.24, 13);
  if (t === 'd') return R[1];
  if (t === 'h' || t === 'l') return R[4];
  return s ? R[3] : R[2];
}
export function floorCol(x, y) {
  const R = P.floor;
  const t = tuftAt(x, y, 7, 0.5, 23);
  if (t === 'd') return R[0];
  if (t) return R[3];
  return vnoise(x, y, 24, 29, PERIOD) > 0.55 ? R[1] : R[2];
}
export function dirtCol(x, y) {
  const R = P.dirt;
  // pebbles: 2-px stones (light top, dark under) on a jittered 7-px grid
  const cell = 7, cx = Math.floor(x / cell), cy = Math.floor(y / cell), pc = PERIOD / cell;
  const hx = mod(cx, Math.floor(pc)), hy = mod(cy, Math.floor(pc));
  if (hash2(hx, hy, 33) < 0.16) {
    const ox = 1 + Math.floor(hash2(hx, hy, 34) * (cell - 3)), oy = 1 + Math.floor(hash2(hx, hy, 35) * (cell - 3));
    const lx = x - cx * cell - ox, ly = y - cy * cell - oy, big = hash2(hx, hy, 36) < 0.4;
    if (ly === 0 && lx >= 0 && lx < (big ? 2 : 1)) return R[4];
    if (ly === 1 && lx >= 0 && lx < (big ? 2 : 1)) return R[1];
  }
  // light 2×1 specks and rare dark grains; flat base like the HGSS / B2W2 dirt routes
  const sx = Math.floor(x / 5), sy = Math.floor(y / 4), hs = hash2(mod(sx, 25), mod(sy, 32), 39);
  if (hs < 0.22) { const ox = Math.floor(hash2(sx, sy, 40) * 3); if (y - sy * 4 === 1 && x - sx * 5 >= ox && x - sx * 5 < ox + 2) return R[3]; }
  if (hash2(x, y, 38) < 0.01) return R[1];
  return R[2];
}
export function sandCol(x, y) {
  const R = P.sand;
  const t = tuftAt(x, y, 8, 0.2, 43);
  if (t === 'd') return R[1];
  if (t) return R[4];
  return vnoise(x, y, 24, 47, PERIOD) > 0.6 ? R[3] : R[2];
}
/** water body colour; d = Chebyshev distance (px) to the shore (capped), deep 0/1, f = animation frame 0..3 */
export function waterCol(x, y, d, deep, f, shallowRamp = false) {
  const R = shallowRamp ? P.shallow : P.water;
  // drifting wave crests: short 3–6 px light dashes on a staggered 16×12 lattice, slide 1 px per frame
  const xx = x + f * 2, row = Math.floor(y / 12), ly = mod(y, 12);
  const sx = mod(xx + (row & 1) * 8 + Math.floor(hash2(0, mod(row, 11), 51) * 16), 16);
  const len = 3 + Math.floor(hash2(Math.floor((xx + (row & 1) * 8) / 16), row, 52 + (f >> 1)) * 4);
  const crest = ly === 5 && sx < len, under = ly === 6 && sx >= 1 && sx < len - 1;
  if (deep) {
    if (crest) return R[3];
    return d > 22 ? R[1] : R[2];
  }
  if (crest) return R[4];
  if (under) return R[2];
  return R[3];
}
export function paveCol(x, y, team = 0) {
  const R = paveRamp(team);
  // 16×16 slabs, rows offset by 8 (running bond); 1-px joints; lit top-left inner edge
  const row = Math.floor(y / 16), lx = mod(x + (row & 1) * 8, 16), ly = mod(y, 16);
  const sid = hash2(Math.floor((x + (row & 1) * 8) / 16), row, 61);
  if (ly === 15 || lx === 15) return R[1];
  if (ly === 0 || lx === 0) return R[4];
  if (sid < 0.08 && lx > 3 && lx < 11 && ly === 7 + (lx & 1)) return R[2];    // crack
  return sid > 0.6 ? R[3] : sid < 0.15 ? R[2] : R[3];
}

/** tall grass blades (Pokémon tall-grass patch): staggered rows of outlined pointed blades; null = gap */
export function tallBlade(x, y, f = 0) {
  const R = P.tall;
  // a 16×16 cell holds one clump of 3 blades; rows offset by 8 px
  const cell = 16, row = Math.floor(y / cell), ox = (row & 1) * 8;
  const lx = mod(x + ox, cell), ly = mod(y, cell);
  const sway = f & 1 ? 1 : 0;
  // clump drawn in local coords: blades at bases (3, 15), (8, 15), (13, 15), heights 11 / 14 / 10
  const blades = [[4, 11, -1], [8, 14, 0], [12, 10, 1]];
  let hit = null;
  for (const [bx, bh, lean] of blades) {
    const top = 15 - bh;
    if (ly < top || ly > 15) continue;
    const t = (ly - top) / bh;                      // 0 tip .. 1 base
    const cx = bx + lean * (1 - t) * 2 + (t < 0.35 ? sway : 0);
    const hw = 0.6 + t * 2.1;                       // half width grows to the base
    const dx = lx + 0.5 - cx;
    if (Math.abs(dx) > hw + 1) continue;
    if (Math.abs(dx) > hw) { if (!hit) hit = R[0]; continue; }   // outline
    hit = dx < -hw * 0.3 ? (t < 0.3 ? R[5] : R[4]) : dx > hw * 0.45 ? R[2] : R[3];
    if (ly >= 14) hit = R[1];
  }
  return hit;
}

/** cliff face colour: x world px, k = px above the face's bottom (1..FACE), top = FACE */
export function cliffCol(x, k) {
  const R = P.cliff, top = FACE - k;               // top = px below the face's top edge
  if (k <= 2) return R[0];                          // contact line at the foot
  // three rock strata (ledges) with wobbly boundaries; each stratum is a row of rounded boulder blocks
  const b1 = 13 + Math.round((vnoise(x, 0, 18, 74, PERIOD) - 0.5) * 5), b2 = 28 + Math.round((vnoise(x, 9, 18, 75, PERIOD) - 0.5) * 5);
  const bi = top < b1 ? 0 : top < b2 ? 1 : 2, y0 = bi === 0 ? 0 : bi === 1 ? b1 : b2, y1 = bi === 0 ? b1 : bi === 1 ? b2 : FACE;
  const bh = y1 - y0, ly = top - y0;
  const edge = (i) => i * 16 + Math.floor(hash2(i, bi, 76) * 9) + bi * 7;
  let c = Math.floor((x - bi * 7) / 16); if (edge(c) > x) c--; if (edge(c + 1) <= x) c++;
  const x0 = edge(c), cw = edge(c + 1) - x0, lx = x - x0;
  if (lx === cw - 1 || ly === bh - 1) return R[0];                     // crevices
  if (ly === bh - 2 && lx > cw - 4) return R[0];                        // rounded lower-right corner
  if (ly === 0) return hash2(c, bi, 77) < 0.22 && lx > 2 && lx < 7 ? P.grass[(lx & 1) ? 3 : 2] : R[5];   // lit ledge top (+ moss tufts)
  if (lx === 0) return R[3];
  const u = (lx + 0.5) / cw, v = (ly + 0.5) / bh;
  let d = -(u - 0.45) * 0.8 - (v - 0.35) * 1.1 + (hash2(c, bi, 78) - 0.5) * 0.3;
  d -= bi * 0.18;                                    // lower strata are in deeper shade
  if (hash2(x >> 2, top >> 2, 79) < 0.06 && v > 0.3) return R[1];   // pits / grain
  return d > 0.5 ? R[4] : d > 0.12 ? R[3] : d > -0.32 ? R[2] : R[1];
}

export const shade = shadeCol;
