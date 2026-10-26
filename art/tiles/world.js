// game/art/tiles/world.js — the REAL Sundered Vale layout (legacy map tables) rasterised into the pixel-art world.
// Owner: pixel-world look-dev.
//
//   const W = buildWorld()                       // corner grids + prop plan (deterministic, ~50 ms)
//   const v = renderView(W, x0, y0, w, h, { frame })   // world art px rect -> { ground: Bitmap, objects: [...] }
//   composite(v, extraObjects)                   // y-sorted sprites + props + buildings over the ground -> Bitmap
//
// Data: lanes / river / structures / fountains / pits / camps / bases / brush come straight from
// game/assets/map-oE9sOnNc.js (the sim's own tables). Jungle trails are not exported there; TRAILS below is a verbatim
// copy of its `T` table (map-oE9sOnNc.js:173-193). Starter meadows = mt/sim/jungle.js MEADOWS. Walls = the sim's
// walkable signed-distance field < 0, so the pixel world and the sim agree on every walkable metre.

import * as MAP from '../../assets/map-oE9sOnNc.js';
import { TILE, FACE, LAYERS, maskAt, grassCol, lawnCol, floorCol, dirtCol, sandCol, waterCol, paveCol, tallBlade, cliffCol } from './ground.js';
import { Bitmap, hash2, vnoise, mix, shadeCol, rng } from './core.js';
import { PAL, teamRamp } from './palette.js';
import * as props from './props.js';
import * as bld from './buildings.js';

export const PPM = TILE;                       // art px per metre
const LANES = MAP.a, RIVER = MAP.u, STRUCTS = MAP.f, FOUNTAINS = MAP.i, PITS = MAP.l, CAMPS = MAP.r, BASES = MAP.t, BRUSH = MAP.n;
const sdf = MAP.v, segD = MAP.x, riverD = MAP.g;
const T0 = [[24, 44, 12, 44], [24, 44, 40, 56], [40, 56, 48, 48], [40, 56, 26, 64], [26, 64, 12, 70], [26, 64, 34, 86], [40, 56, 46, 74], [24, 44, 30, 30], [56, 88, 40, 80], [56, 88, 64, 80], [64, 80, 72, 72], [64, 80, 52, 68], [56, 88, 76, 96], [76, 96, 76, 108], [76, 96, 86, 86], [56, 88, 48, 108], [26, 64, 18, 80]];
export const TRAILS = [...T0, ...T0.map(([a, b, c, d]) => [b, a, d, c])];
const M0 = [{ x: 7.5, y: 96 }, { x: 25, y: 111 }];
export const MEADOWS = [...M0.map((m) => ({ ...m, team: 0 })), ...M0.map((m) => ({ x: m.y, y: m.x, team: 1 }))];
export const HABITAT = { brute: 'fire', toads: 'water', warden: 'grass', golems: 'electric', stalkers: 'earth', wolves: 'wind' };
const SHOP = [{ x: 6.4, y: 104, team: 0 }, { x: 104, y: 6.4, team: 1 }];

const d2 = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
/** concentric plaza slabs: rings 14 px wide, ~18 px long slabs, joints, lit inner edge, one team-tinted ring */
function ringSlab(X, Y, q, R) {
  const dx = X + 0.5 - q.x, dy = Y + 0.5 - q.y, r = Math.hypot(dx, dy), k = Math.floor(r / 14), lr = r - k * 14;
  const n = Math.max(6, Math.round((2 * Math.PI * (k + 0.5) * 14) / 18)), a = (Math.atan2(dy, dx) / (2 * Math.PI) + 1 + (k & 1) * 0.5 / n) % 1;
  const sp = a * n, si = Math.floor(sp), along = (sp - si) * (2 * Math.PI * r / n);
  if (lr < 1.1 || along < 1) return R[1];
  const team = Math.abs(r - q.ringAt) < 7;
  if (team) { const T = teamRamp(q.team); return lr < 2.2 ? T[4] : (si & 1) ? T[3] : mix(T[3], R[4], 0.45); }
  if (lr < 2.2 || along < 2) return R[4];
  const h = hash2(k, si, 171);
  return h < 0.2 ? R[2] : h > 0.85 ? R[4] : R[3];
}
const tuftAtCl = (x, y) => hash2(x >> 3, y >> 3, 151) < 0.12 && (x & 7) === 3 && ((y & 7) === 4 || (y & 7) === 5);
function laneDist(x, y) { let m = 1e9; for (const k in LANES) { const L = LANES[k]; for (let i = 0; i < L.length - 1; i++) m = Math.min(m, segD(x, y, L[i].x, L[i].y, L[i + 1].x, L[i + 1].y)); } return m; }
function trailDist(x, y) { let m = 1e9; for (const t of TRAILS) m = Math.min(m, segD(x, y, t[0], t[1], t[2], t[3])); return m; }
const habitats = () => CAMPS.filter((c) => HABITAT[String(c.id).replace(/^(blue|red)_/, '')]);
const baseOf = (x, y) => { for (const b of BASES) if (d2(x, y, b.x, b.y) < b.radius - 0.4) return b; return null; };
const nexusOf = (team) => STRUCTS.find((s) => s.kind === 'nexus' && s.team === team);

/** ground classes at a world point (metres) */
export function classify(x, y) {
  const out = { wall: 0, water: 0, deep: 0, sand: 0, dirt: 0, pave: 0, lawn: 0, tall: 0, team: -1 };
  if (x < 0 || y < 0 || x > 120 || y > 120 || sdf(x, y) < 0) { out.wall = 1; return out; }
  const ld = laneDist(x, y), rd = riverD(x, y), base = baseOf(x, y);
  let pd = 1e9; for (const p of PITS) pd = Math.min(pd, d2(x, y, p.x, p.y));
  let cd = 1e9; for (const c of habitats()) cd = Math.min(cd, d2(x, y, c.x, c.y));
  if (!base) {
    out.water = rd < 3.5 || pd < 4.4 ? 1 : 0;
    out.deep = (rd < 1.5 && ld > 7.5) || pd < 2.4 ? 1 : 0;
    out.sand = rd < 4.8 || pd < 5.7 ? 1 : 0;
    out.dirt = (ld < 2.6 || trailDist(x, y) < 0.75) && cd > 2.6 ? 1 : 0;
  } else {
    out.lawn = 1; out.team = base.team;
    const f = FOUNTAINS.find((q) => q.team === base.team), nx = nexusOf(base.team);
    let pv = d2(x, y, f.x, f.y) < 8.6 || d2(x, y, nx.x, nx.y) < 5.4 || ld < 2.3 || segD(x, y, f.x, f.y, nx.x, nx.y) < 1.8;
    for (const s of STRUCTS) if (s.team === base.team && s.kind !== 'nexus' && d2(x, y, s.x, s.y) < 2.4) pv = true;
    for (const s of SHOP) if (s.team === base.team && d2(x, y, s.x, s.y) < 2.2) pv = true;
    out.pave = pv ? 1 : 0;
  }
  for (const b of BRUSH) if (d2(x, y, b.x, b.y) < b.r + 0.45) out.tall = 1;
  for (const m of MEADOWS) if (d2(x, y, m.x, m.y) < 3.3) out.tall = 1;
  return out;
}

// ------------------------------------------------------------------------------------------------ world build
export function buildWorld() {
  const N = 121, grids = {}, team = new Int8Array(N * N).fill(-1);
  for (const L of LAYERS) grids[L] = new Uint8Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const c = classify(x, y);
    for (const L of LAYERS) grids[L][y * N + x] = c[L];
    team[y * N + x] = c.team;
  }
  const corner = {};
  for (const L of LAYERS) { const g = grids[L], wallish = L === 'wall'; corner[L] = (cx, cy) => (cx < 0 || cy < 0 || cx >= N || cy >= N ? (wallish ? 1 : 0) : g[cy * N + cx]); }
  const W = { N, grids, corner, team, geo: buildGeo() };
  W.mask = (L, x, y) => maskAt(corner[L], L, x, y);
  W.teamAt = (x, y) => { const cx = Math.round(x / TILE), cy = Math.round(y / TILE); const t = cx >= 0 && cy >= 0 && cx < N && cy < N ? team[cy * N + cx] : -1; return t < 0 ? (x + y < 120 * TILE ? 1 : 0) : t; };
  return W;
}

// ------------------------------------------------------------------------------------------------ vector layers
/**
 * Man-made / designed ground is vector-defined (exact circles and capsules on the art-px grid, like hand-placed
 * Pokémon plazas): base paving (plazas, roads, plinths), tower plinths, camp clearings, habitat ponds.
 */
function buildGeo() {
  const P = TILE, pave = [], clear = [], pond = [];
  for (const b of BASES) {
    const f = FOUNTAINS.find((q) => q.team === b.team), nx = nexusOf(b.team), clip = [b.x * P, b.y * P, (b.radius - 0.3) * P];
    pave.push({ c: [f.x * P, f.y * P], r: 8.4 * P, team: b.team, clip });
    pave.push({ c: [nx.x * P, nx.y * P], r: 5.2 * P, team: b.team, clip });
    pave.push({ s: [f.x * P, f.y * P, nx.x * P, nx.y * P], r: 1.8 * P, team: b.team, clip });
    for (const k in LANES) { const L = LANES[k]; for (let i = 0; i < L.length - 1; i++) pave.push({ s: [L[i].x * P, L[i].y * P, L[i + 1].x * P, L[i + 1].y * P], r: 2.2 * P, team: b.team, clip }); }
    for (const s of STRUCTS) if (s.team === b.team && (s.kind === 'inhibitor' || (s.kind === 'tower' && s.tier === 4))) pave.push({ c: [s.x * P, s.y * P], r: 2.4 * P, team: b.team, clip });
    for (const s of SHOP) if (s.team === b.team) pave.push({ c: [s.x * P, s.y * P], r: 2.3 * P, team: b.team, clip });
  }
  for (const s of STRUCTS) if (s.kind === 'tower' && s.tier < 4) pave.push({ c: [s.x * P, s.y * P], r: 1.75 * P, team: s.team });
  for (const c of habitats()) {
    clear.push({ c: [c.x * P, c.y * P], r: 2.7 * P });
    if (HABITAT[String(c.id).replace(/^(blue|red)_/, '')] === 'water') pond.push({ c: [c.x * P + 14, (c.y - 1.9) * P], r: 1.45 * P });
  }
  const inShape = (q, x, y) => {
    if (q.clip && Math.hypot(x - q.clip[0], y - q.clip[1]) > q.clip[2]) return false;
    if (q.c) return Math.hypot(x + 0.5 - q.c[0], y + 0.5 - q.c[1]) < q.r;
    return segD(x + 0.5, y + 0.5, q.s[0], q.s[1], q.s[2], q.s[3]) < q.r;
  };
  return {
    pave: (x, y) => { for (const q of pave) if (inShape(q, x, y)) return q.team; return -1; },
    clear: (x, y) => { for (const q of clear) if (inShape(q, x, y)) return 1; return 0; },
    clearAt: (x, y) => { for (const q of clear) if (inShape(q, x, y)) return [q.c[0], q.c[1], q.r]; return null; },
    pond: (x, y) => { for (const q of pond) if (inShape(q, x, y)) return 1; return 0; },
    ponds: pond, clears: clear,
  };
}

// ------------------------------------------------------------------------------------------------ prop plan
/** deterministic props intersecting a world px rect (with margin): [{ bmp, x, y, flip, shadow:[rx, ry] }] */
function planProps(W, X0, Y0, X1, Y1, frame) {
  const out = [], P = TILE, wall = (x, y) => W.mask('wall', Math.round(x), Math.round(y));
  const free = (x, y) => !wall(x, y) && !W.mask('water', x, y) && !W.mask('dirt', x, y) && !W.mask('pave', x, y) && !W.mask('tall', x, y) && !W.mask('sand', x, y);
  // 1. forest on the plateaus: staggered rows (Pokémon tree walls), big -> small
  const rowH = 40, colW = 70;
  for (let r = Math.floor((Y0 - 40) / rowH); r * rowH < Y1 + 200; r++) {
    const off = (r & 1) * colW / 2;
    for (let c = Math.floor((X0 - 120) / colW); c * colW < X1 + 120; c++) {
      const jx = Math.round((hash2(c, r, 11) - 0.5) * 8), jy = Math.round((hash2(c, r, 12) - 0.5) * 6);
      const x = c * colW + off + jx, y = r * rowH + jy;
      const isPine = vnoise(x, y, 260, 7) > 0.6 || (hash2(c, r, 14) < 0.12);
      const tries = isPine ? [['pine', 1, 30, 112], ['tree', 0.78, 30, 86], ['bush', 1, 20, 28]] : [['tree', 1, 40, 108], ['tree', 0.8, 32, 88], ['bush', 1, 20, 28]];
      for (const [kind, s, R, Hh] of tries) {
        const pts = [[x, y], [x, y + FACE + 4], [x - R, y - 6], [x + R, y - 6], [x, y - Hh + 6], [x - R * 0.9, y - Hh * 0.55], [x + R * 0.9, y - Hh * 0.55], [x - R * 0.6, y - Hh * 0.85], [x + R * 0.6, y - Hh * 0.85]];
        if (!pts.every(([px, py]) => wall(px, py))) continue;
        const v = Math.floor(hash2(c, r, 13) * 4);
        const bmp = kind === 'pine' ? props.pine(v & 1, s) : kind === 'tree' ? props.tree(v, s, (v & 1) ? PAL.leafB : PAL.leaf) : props.bush(v, hash2(c, r, 15) < 0.3 ? PAL.flowerK : null);
        out.push({ bmp, x, y, kind, plateau: true, shadow: [R * 0.9, R * 0.32] });
        break;
      }
    }
  }
  // 1b. plateau gaps: small bushes / ferns where no trunk stands near (keeps the forest floor from reading flat)
  const trunks = out.map((o) => [o.x, o.y]);
  for (let gy = Math.floor((Y0 - 40) / 30); gy * 30 < Y1 + 60; gy++) for (let gx = Math.floor((X0 - 40) / 34); gx * 34 < X1 + 40; gx++) {
    const x = gx * 34 + ((gy & 1) * 17) + Math.round((hash2(gx, gy, 16) - 0.5) * 10), y = gy * 30 + Math.round((hash2(gx, gy, 17) - 0.5) * 8);
    if (!wall(x, y) || !wall(x - 22, y) || !wall(x + 22, y) || !wall(x, y - 28) || !wall(x, y + FACE + 2)) continue;
    if (trunks.some(([tx, ty]) => Math.abs(tx - x) < 34 && y - ty > -64 && y - ty < 22)) continue;
    const v = Math.floor(hash2(gx, gy, 18) * 4);
    out.push({ bmp: props.bush(v, hash2(gx, gy, 19) < 0.18 ? PAL.flowerK : null), x, y, kind: 'bush', plateau: true, shadow: [15, 5] });
    trunks.push([x, y]);
  }
  // 2. foot of the cliffs & open grass: bushes, rocks, stumps
  const g = 44;
  for (let gy = Math.floor(Y0 / g) - 1; gy * g < Y1 + 60; gy++) for (let gx = Math.floor(X0 / g) - 1; gx * g < X1 + 60; gx++) {
    const x = gx * g + Math.round(hash2(gx, gy, 21) * 30), y = gy * g + Math.round(hash2(gx, gy, 22) * 30);
    if (!free(x, y) || !free(x - 14, y) || !free(x + 14, y)) continue;
    const nearCliff = wall(x, y - 30) || wall(x - 30, y) || wall(x + 30, y);
    const h = hash2(gx, gy, 23), v = Math.floor(hash2(gx, gy, 24) * 4);
    if (nearCliff && h < 0.38) out.push({ bmp: props.bush(v, h < 0.1 ? PAL.flowerY : h < 0.18 ? PAL.flowerK : null), x, y, kind: 'bush', shadow: [16, 5] });
    else if (nearCliff && h < 0.5) out.push({ bmp: props.rock(v, 0.8 + (v & 1) * 0.5, v === 2), x, y, kind: 'rock', shadow: [11, 4] });
    else if (!nearCliff && h < 0.035) out.push({ bmp: props.rock(v, 0.6), x, y, kind: 'rock', shadow: [7, 3] });
    else if (!nearCliff && h > 0.985) out.push({ bmp: props.stump(), x, y, kind: 'stump', shadow: [9, 3] });
  }
  // 3. river: reeds on sand next to walls, lily pads (ground decals)
  for (let gy = Math.floor(Y0 / 26) - 1; gy * 26 < Y1 + 40; gy++) for (let gx = Math.floor(X0 / 26) - 1; gx * 26 < X1 + 40; gx++) {
    const x = gx * 26 + Math.round(hash2(gx, gy, 31) * 16), y = gy * 26 + Math.round(hash2(gx, gy, 32) * 16), h = hash2(gx, gy, 33);
    if (W.mask('sand', x, y) && !W.mask('water', x, y) && !wall(x, y) && (wall(x, y - 20) || wall(x + 16, y) || wall(x - 16, y)) && h < 0.4) out.push({ bmp: props.reeds(gx & 3), x, y, kind: 'reeds' });
    else if (W.mask('water', x, y) && !W.mask('deep', x, y) && W.mask('water', x + 10, y) && W.mask('water', x - 10, y) && h < 0.05) out.push({ bmp: props.lily(gx & 3), x, y, kind: 'lily', decal: true });
  }
  // 4. structures
  for (const s of STRUCTS) {
    const x = s.x * P, y = s.y * P;
    if (s.kind === 'tower') out.push({ bmp: bld.tower(s.team, s.tier, frame), x, y, kind: 'tower', shadow: [36, 12] });
    else if (s.kind === 'inhibitor') out.push({ bmp: bld.inhibitor(s.team, frame), x, y, kind: 'inhibitor', shadow: [40, 14] });
    else if (s.kind === 'nexus') out.push({ bmp: bld.nexus(s.team, frame), x, y, kind: 'nexus', shadow: [80, 22] });
  }
  for (const f of FOUNTAINS) out.push({ bmp: bld.fountainStatue(f.team, frame), x: f.x * P, y: f.y * P + 2, kind: 'fountain' });
  // 5. base dressing: lamps along the roads, planters around the Nexus plaza, meadow fences, shop
  for (const b of BASES) {
    const nx = nexusOf(b.team), f = FOUNTAINS.find((q) => q.team === b.team);
    for (const k in LANES) {
      const L = LANES[k]; const [a, c] = [L[0], L[1]];
      const len = d2(a.x, a.y, c.x, c.y), ux = (c.x - a.x) / len, uy = (c.y - a.y) / len;
      for (let t = 6; t < 19; t += 4.5) {
        const side = (Math.round(t / 4.5) & 1) ? 1 : -1, px = a.x + ux * t - uy * 2.9 * side, py = a.y + uy * t + ux * 2.9 * side;
        if (d2(px, py, b.x, b.y) > b.radius - 1.5 || W.mask('wall', px * P, py * P) || W.mask('pave', px * P, py * P)) continue;
        out.push({ bmp: props.lamp(b.team), x: px * P, y: py * P, kind: 'lamp', shadow: [8, 3] });
      }
    }
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.5, px = nx.x + Math.cos(a) * 6.6, py = nx.y + Math.sin(a) * 6.6;
      if (W.mask('pave', px * P, py * P) || W.mask('wall', px * P, py * P) || laneDist(px, py) < 3.5) continue;
      out.push({ bmp: props.planter(i), x: px * P, y: py * P, kind: 'planter', shadow: [30, 6] });
    }
    // fountain ring lamps
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + 0.2, px = f.x + Math.cos(a) * 9.4, py = f.y + Math.sin(a) * 9.4; if (!W.mask('wall', px * P, py * P) && !W.mask('pave', px * P, py * P) && laneDist(px, py) > 3) out.push({ bmp: props.lamp(b.team), x: px * P, y: py * P, kind: 'lamp', shadow: [8, 3] }); }
  }
  for (const s0 of SHOP) out.push({ bmp: bld.shop(s0.team), x: s0.x * P, y: s0.y * P + 20, kind: 'shop', shadow: [50, 12] });
  for (const m of MEADOWS) {
    // wooden ranch fence around the meadow (posts + rails), open toward the roads / paving
    const n = 22, ok = [];
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2, px = m.x + Math.cos(a) * 4.1, py = m.y + Math.sin(a) * 4.1;
      ok.push(!(W.mask('wall', px * P, py * P) || W.geo.pave(px * P, py * P) >= 0 || laneDist(px, py) < 3.0 || W.mask('wall', px * P, py * P + 10)) ? [px * P, py * P] : null);
    }
    for (let i = 0; i < n; i++) if (ok[i] && ok[i + 1]) { const [ax, ay] = ok[i], [bx, by] = ok[i + 1]; const f = props.fenceSpan(Math.round(bx - ax), Math.round(by - ay)); out.push({ bmp: f, x: Math.round(ax) - f.ox + f.ax, y: Math.round(ay) - f.oy + f.ay, kind: 'fence' }); }
  }
  // 5b. ornamental round trees + banners on the base lawns
  for (const b of BASES) {
    const f = FOUNTAINS.find((q) => q.team === b.team);
    for (let gy = Math.floor((b.y - b.radius) / 3.2); gy * 3.2 < b.y + b.radius; gy++) for (let gx = Math.floor((b.x - b.radius) / 3.4); gx * 3.4 < b.x + b.radius; gx++) {
      const px = gx * 3.4 + hash2(gx, gy, 41) * 1.6, py = gy * 3.2 + hash2(gx, gy, 42) * 1.4;
      if (hash2(gx, gy, 43) > 0.42 || d2(px, py, b.x, b.y) > b.radius - 2.2) continue;
      const okp = [[0, 0], [1.4, 0], [-1.4, 0], [0, 1.2], [0, -1.6], [0, -2.6], [1, -2.2], [-1, -2.2]].every(([dx, dy]) => { const X = (px + dx) * P, Y = (py + dy) * P; return !W.mask('wall', X, Y) && W.geo.pave(X, Y) < 0 && !W.mask('tall', X, Y); });
      if (!okp || laneDist(px, py) < 3.4 || MEADOWS.some((m) => d2(px, py, m.x, m.y) < 5.2)) continue;
      const v = Math.floor(hash2(gx, gy, 44) * 4);
      out.push({ bmp: hash2(gx, gy, 45) < 0.5 ? props.tree(v, 0.7) : props.bush(v, [PAL.flowerK, PAL.flowerY, PAL.flowerR, null][v]), x: px * P, y: py * P, kind: 'tree', shadow: [24, 8] });
    }
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.35, px = f.x + Math.cos(a) * 8.75, py = f.y + Math.sin(a) * 8.75;
      if (W.mask('wall', px * P, py * P) || W.geo.pave(px * P, py * P + 8) >= 0 || laneDist(px, py) < 2.6) continue;
      out.push({ bmp: props.banner(b.team), x: px * P, y: py * P, kind: 'banner', shadow: [7, 3] });
    }
  }
  // 5c. habitat ponds: lily pads, reeds and rocks on the rim
  for (const q of W.geo.ponds) {
    const [cx, cy] = q.c, r = q.r;
    out.push({ bmp: props.lily(1), x: cx - r * 0.35, y: cy + r * 0.1, kind: 'lily', decal: true });
    out.push({ bmp: props.lily(2), x: cx + r * 0.4, y: cy - r * 0.2, kind: 'lily', decal: true });
    out.push({ bmp: props.reeds(1), x: cx - r * 0.85, y: cy - r * 0.45, kind: 'reeds' });
    out.push({ bmp: props.reeds(2), x: cx + r * 0.9, y: cy - r * 0.35, kind: 'reeds' });
    out.push({ bmp: props.rock(3, 0.9, true), x: cx + r * 1.0, y: cy + r * 0.35, kind: 'rock', shadow: [9, 3] });
  }
  // 6. camps: ring of stones + habitat sign
  for (const c of habitats()) for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.3, px = c.x + Math.cos(a) * 3.1, py = c.y + Math.sin(a) * 3.1;
    if (W.mask('wall', px * P, py * P)) continue;
    if (W.geo.pond(px * P, py * P) || W.geo.pond(px * P, py * P - 10)) continue;
    out.push({ bmp: props.stone(i), x: px * P, y: py * P, kind: 'stone' });
  }
  for (const c of habitats()) {
    const el = HABITAT[String(c.id).replace(/^(blue|red)_/, '')];
    out.push({ bmp: props.sign(el), x: (c.x - 2.2) * P, y: (c.y - 2.3) * P, kind: 'sign', shadow: [9, 3] });
  }
  return out.filter((o) => o.x + o.bmp.w > X0 - 8 && o.x - o.bmp.w < X1 + 8 && o.y - o.bmp.h < Y1 + 8 && o.y > Y0 - 40);
}

// ------------------------------------------------------------------------------------------------ ground raster
/**
 * Ground for the world px rect [x0, x0+w) × [y0, y0+h): autotiled layers, edges, cliff faces, flowers and shadows.
 * Returns { ground, objects, masks } — objects are the y-sortable props/buildings (not yet drawn).
 */
export function renderView(W, x0, y0, w, h, o = {}) {
  const frame = o.frame || 0, M = FACE + 16;
  const X0 = x0 - M, Y0 = y0 - M, BW = w + 2 * M, BH = h + 2 * M;
  const mk = {};
  const geoL = { pave: (x, y) => (W.geo.pave(x, y) >= 0 ? 1 : 0), clear: W.geo.clear, pond: W.geo.pond };
  const fns = { ...Object.fromEntries(LAYERS.map((L) => [L, (x, y) => W.mask(L, x, y)])), ...geoL };
  const paveTeam = new Int8Array(BW * BH);
  for (const L of Object.keys(fns)) {
    const a = new Uint8Array(BW * BH), fn = fns[L];
    for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) {
      if (L === 'pave') { const t = W.geo.pave(X0 + x, Y0 + y); a[y * BW + x] = t >= 0 ? 1 : 0; paveTeam[y * BW + x] = t; }
      else a[y * BW + x] = fn(X0 + x, Y0 + y);
    }
    mk[L] = a;
  }
  const at = (L, x, y) => { const X = x - X0, Y = y - Y0; return X < 0 || Y < 0 || X >= BW || Y >= BH ? fns[L](x, y) : mk[L][Y * BW + X]; };
  const objects = o.noProps ? [] : planProps(W, x0, y0, x0 + w, y0 + h, frame);
  // shadow buffer: wall shadow (light from the upper-left) + object blob shadows
  const sh = new Uint8Array(w * h);
  for (const ob of objects) {
    if (!ob.shadow || ob.decal) continue;
    const [rx, ry] = ob.shadow, cx = ob.x - x0 + rx * 0.35, cy = ob.y - y0 + 1;
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      const u = (x + 0.5 - cx) / rx, v = (y + 0.5 - cy) / ry; if (u * u + v * v <= 1) sh[y * w + x] = 1;
    }
  }
  const G = new Bitmap(w, h);
  const fountains = FOUNTAINS.map((f) => ({ x: f.x * TILE, y: f.y * TILE, team: f.team }));
  const plazas = [...FOUNTAINS.map((f) => ({ x: f.x * TILE, y: f.y * TILE, r: 8.4 * TILE - 6, team: f.team, ringAt: 5.5 * TILE })), ...[0, 1].map((t) => { const n = nexusOf(t); return { x: n.x * TILE, y: n.y * TILE, r: 5.2 * TILE - 6, team: t, ringAt: 3.6 * TILE }; })];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const X = x + x0, Y = y + y0;
    let col, isFace = false;
    if (at('wall', X, Y)) {
      // cliff: face if open ground within FACE px below, else plateau top
      let k = 0; for (let j = 1; j <= FACE; j++) if (!at('wall', X, Y + j)) { k = j; break; }
      if (k) {
        isFace = true;
        // top of the face run (thin walls show a short face)
        let up = 0; for (let j = 1; j <= FACE; j++) { if (!at('wall', X, Y - j)) { up = j; break; } }
        const kk = up && up + k - 1 < FACE ? k + (FACE - (up + k - 1)) : k;   // keep the lip at the top of thin faces
        col = cliffCol(X, kk);
        // grass overhang hanging over the top of the face
        const topDist = FACE - kk;
        const hang = 2 + Math.floor(hash2(X >> 1, 0, 91) * 3) + (hash2(X >> 2, 1, 92) < 0.2 ? 3 : 0);
        if (topDist < hang) col = topDist === hang - 1 ? PAL.floor[1] : PAL.floor[4];
        // ends of a face against open ground / plateau: dark edge
        const lw = at('wall', X - 1, Y), rw = at('wall', X + 1, Y);
        if (!lw || !rw) col = PAL.cliff[0];
        else {
          let kl = 0; for (let j = 1; j <= FACE; j++) if (!at('wall', X - 1, Y + j)) { kl = j; break; }
          if (!kl) col = mix(col, PAL.cliff[4], 0.5);                     // corner: face turns, lit edge
        }
      } else {
        col = floorCol(X, Y);
        const n = !at('wall', X, Y - 1), wv = !at('wall', X - 1, Y), e = !at('wall', X + 1, Y);
        if (n || wv || e) col = PAL.cliff[0];
        else if (!at('wall', X, Y - 2) || !at('wall', X - 2, Y)) col = PAL.floor[5];
        else if (!at('wall', X + 2, Y)) col = PAL.floor[0];
        // the lit lip right above a face
        else if (at('wall', X, Y + 1) && !at('wall', X, Y + FACE + 1) && false) col = PAL.floor[4];
      }
    } else {
      const lawn = at('lawn', X, Y);
      col = lawn ? lawnCol(X, Y) : grassCol(X, Y);
      // flowers on open grass (zones)
      if (vnoise(X, Y, 90, 101) > (lawn ? 0.71 : 0.66)) {
        const cx = Math.floor(X / 6), cy = Math.floor(Y / 6), hh = hash2(cx, cy, 103);
        if (hh < 0.4) { const fx = cx * 6 + 1 + Math.floor(hash2(cx, cy, 104) * 3), fy = cy * 6 + 1 + Math.floor(hash2(cx, cy, 105) * 3), F = [PAL.flowerW, PAL.flowerY, PAL.flowerR, PAL.flowerK][Math.floor(hash2(Math.floor(X / 70), Math.floor(Y / 70), 106) * 4)];
          const lx = X - fx, ly = Y - fy;
          if ((lx === 0 && ly === 0)) col = PAL.flowerY[3]; else if (Math.abs(lx) + Math.abs(ly) === 1 && ly <= 0) col = F[2]; else if (lx === 0 && ly === 1) col = F[1]; else if (lx === 0 && ly === 2) col = PAL.grass[1]; }
      }
      const GR = lawn ? PAL.lawn : PAL.grass;
      // recessed dirt
      const d = at('dirt', X, Y);
      if (d) {
        col = dirtCol(X, Y);
        if (!at('dirt', X, Y - 1)) col = PAL.dirt[0]; else if (!at('dirt', X, Y - 2)) col = PAL.dirt[1];
        else if (!at('dirt', X - 1, Y) || !at('dirt', X + 1, Y)) col = PAL.dirt[1];
        else if (!at('dirt', X, Y + 1)) col = PAL.dirt[4];
      } else if (at('dirt', X, Y + 1)) col = GR[1];
      else if (at('dirt', X, Y - 1)) col = GR[4];
      else if (at('dirt', X - 1, Y) || at('dirt', X + 1, Y)) col = GR[1];
      // sand banks
      if (at('sand', X, Y) && !d) {
        col = sandCol(X, Y);
        if (!at('sand', X, Y - 1) || !at('sand', X - 1, Y) || !at('sand', X + 1, Y)) col = PAL.sand[1];
      }
      // camp clearing: trodden short grass with a worn dirt heart (noisy edge) and a soft dark ring
      if (at('clear', X, Y)) {
        const cc = W.geo.clearAt(X, Y), rr = cc ? Math.hypot(X - cc[0], Y - cc[1]) / cc[2] : 1;
        const worn = rr + (vnoise(X, Y, 10, 157) - 0.5) * 0.5 < 0.55;
        if (worn) col = dirtCol(X, Y); else { const g = grassCol(X, Y); col = g === PAL.grass[1] || g === PAL.grassB[1] ? PAL.grass[3] : g === PAL.grassB[2] ? PAL.grass[2] : g; }   // trodden: no dark tufts
        if (worn && !(rr + (vnoise(X, Y - 1, 10, 157) - 0.5) * 0.5 < 0.55)) col = PAL.dirt[1];
      }
      if (at('pond', X, Y)) {
        let dd = 9; for (let r = 1; r <= 5 && dd > 5; r++) if (!at('pond', X - r, Y) || !at('pond', X + r, Y) || !at('pond', X, Y - r) || !at('pond', X, Y + r)) dd = r;
        col = dd <= 1 ? PAL.rock[1] : dd <= 3 ? (dd === 2 ? PAL.rock[3] : PAL.rock[2]) : dd === 4 ? PAL.shallow[5] : waterCol(X, Y, dd, false, frame, true);
        if (dd > 4 && !at('pond', X, Y - 9)) col = PAL.shallow[1];            // bank shadow on the far (north) side
        else if (dd > 4 && !at('pond', X, Y - 11)) col = PAL.shallow[2];
        if (dd <= 3 && dd > 1 && hash2(X >> 2, Y >> 2, 160) < 0.25) col = PAL.rock[4];
      } else if (at('pond', X, Y - 1) || at('pond', X - 1, Y) || at('pond', X + 1, Y)) col = PAL.grass[1];
      // paving (raised 1 step): outline, 5-px curb band with joints, 2-px curb face at the bottom, plazas in rings
      if (at('pave', X, Y)) {
        const team = Math.max(0, paveTeam[(Y - Y0) * BW + (X - X0)]), R = team ? PAL.paveRed : PAL.paveBlue;
        let pl = null; for (const q of plazas) if (Math.hypot(X + 0.5 - q.x, Y + 0.5 - q.y) < q.r) { pl = q; break; }
        col = pl ? ringSlab(X, Y, pl, R) : paveCol(X, Y, team);
        const band = (k) => !at('pave', X - k, Y) || !at('pave', X + k, Y) || !at('pave', X, Y - k) || !at('pave', X, Y + k) || !at('pave', X - k + 1, Y - k + 1) || !at('pave', X + k - 1, Y + k - 1) || !at('pave', X - k + 1, Y + k - 1) || !at('pave', X + k - 1, Y - k + 1);
        if (!at('pave', X, Y + 1) || !at('pave', X - 1, Y) || !at('pave', X + 1, Y) || !at('pave', X, Y - 1)) col = R[0];
        else if (!at('pave', X, Y + 2) || !at('pave', X, Y + 3)) col = R[1];
        else if (band(5)) col = !at('pave', X, Y - 2) ? R[5] : ((X * 3 + Y * 5) % 23 === 0 ? R[1] : R[3]);
        else if (band(6)) col = R[1];
      } else if (at('pave', X, Y - 1) || at('pave', X, Y - 2)) col = mix(col, PAL.ink[0], 0.3);    // curb contact shadow
      // water
      if (at('water', X, Y)) {
        let dd = 9; for (let r = 1; r <= 4 && dd > 4; r++) { if (!at('water', X - r, Y) || !at('water', X + r, Y) || !at('water', X, Y - r) || !at('water', X, Y + r) || !at('water', X - r, Y - r) || !at('water', X + r, Y + r)) dd = r; }
        const deep = at('deep', X, Y);
        col = waterCol(X, Y, deep ? 30 : dd, deep, frame);
        if (deep) { let de = 0; for (let r = 1; r <= 4 && !de; r++) if (!at('deep', X - r, Y) || !at('deep', X + r, Y) || !at('deep', X, Y - r) || !at('deep', X, Y + r)) de = r; if (de) col = de <= 1 ? PAL.water[3] : mix(PAL.water[2], PAL.water[3], 0.5); }
        if (dd === 1) col = (hash2(X >> 1, Y >> 1, 140 + (frame >> 1)) < 0.78) ? PAL.water[5] : PAL.water[4];
        else if (dd === 2) col = PAL.water[4];
        // ford: the lane's sandy bed shows through shallow water
        if (!deep && dd > 2 && at('dirt', X, Y)) col = waterCol(X, Y, dd, false, frame, true);
      }
      // tall grass (Pokémon patch)
      if (at('tall', X, Y)) { const tb = tallBlade(X, Y, frame); col = tb || PAL.tall[1]; }
      // fountain pool
      if (!o.noFountain) for (const f of fountains) {
        const fc = bld.fountainGround(X - f.x, Y - f.y, 84, f.team, (dd) => waterCol(X, Y, dd, dd > 18, frame, true));
        if (fc) col = fc;
      }
      // wall shadow (light from the upper-left) and object shadows
      if (at('wall', X - 6, Y - 8) || at('wall', X - 3, Y - 4)) col = shadeCol(col, 0.8);
      else if (sh[y * w + x]) col = shadeCol(col, 0.7);
    }
    if (!isFace && sh[y * w + x] && at('wall', X, Y)) col = shadeCol(col, 0.55);
    G.set(x, y, col);
  }
  // ground decals (lily pads)
  for (const ob of objects) if (ob.decal) G.blit(ob.bmp, ob.x - x0 - ob.bmp.ax, ob.y - y0 - ob.bmp.ay);
  return { ground: G, objects: objects.filter((ob) => !ob.decal), x0, y0, w, h, at };
}

/**
 * Compose: ground + y-sorted objects (props, buildings, units). Unit objects may carry
 * { mark: { rx, ry, team, ring } } (contact shadow + team ring), { wade: px } (submerged rows), { grass: true }
 * (tall-grass blades drawn over the feet), { flip }, { over: fn(bitmap) } (VFX / bars drawn after).
 */
export function composite(v, extra = [], o = {}) {
  const out = new Bitmap(v.w, v.h); out.data.set(v.ground.data);
  const list = [...v.objects, ...extra].sort((a, b) => (a.y - b.y) || ((a.z || 0) - (b.z || 0)));
  const frame = o.frame || 0;
  for (const ob of list) {
    const sx = Math.round(ob.x - v.x0), sy = Math.round(ob.y - v.y0);
    if (ob.mark) {
      const { rx, ry, team, ring } = ob.mark;
      out.ell(sx, sy, rx, ry, (x, y) => mix(out.get(x, y), PAL.ink[0], 0.42));
      if (ring) {
        const T = teamRamp(team);
        for (let y = Math.floor(sy - ry - 3); y <= sy + ry + 3; y++) for (let x = Math.floor(sx - rx - 4); x <= sx + rx + 4; x++) {
          if (!out.inside(x, y)) continue;
          const u = (x + 0.5 - sx) / (rx + 2.5), w = (y + 0.5 - sy) / (ry + 1.5), q = u * u + w * w;
          const u2 = (x + 0.5 - sx) / (rx + 0.6), w2 = (y + 0.5 - sy) / (ry - 0.2), q2 = u2 * u2 + w2 * w2;
          if (q <= 1 && q2 > 1) out.set(x, y, w < -0.2 ? T[1] : T[3]);
        }
      }
    }
    const b = ob.bmp; if (!b) { if (ob.over) ob.over(out, sx, sy); continue; }
    const ax = ob.flip ? b.w - b.ax : b.ax;
    if (ob.wade) {
      // rows below the waterline: water-tinted, swaying, then a foam line + ring
      const wl = b.ay - ob.wade;
      out.blit(b, sx - ax, sy - b.ay, { flip: ob.flip, rows: [0, Math.round(wl)], tint: ob.tint });
      out.blit(b, sx - ax + ((frame & 1) ? 1 : 0), sy - b.ay, { flip: ob.flip, rows: [Math.round(wl), b.h], tint: [PAL.water[2][0], PAL.water[2][1], PAL.water[2][2], 0.62] });
      const rx = Math.max(8, b.w * 0.42), ry = 3;
      for (let x = Math.floor(-rx - 2); x <= rx + 2; x++) { const yy = Math.round(ry * Math.sqrt(Math.max(0, 1 - (x / (rx + 2)) ** 2))); out.set(sx + x, sy - ob.wade + yy, PAL.water[5]); if (Math.abs(x) > rx * 0.6) out.set(sx + x, sy - ob.wade - yy, PAL.water[4]); }
    } else out.blit(b, sx - ax, sy - b.ay, { flip: ob.flip, tint: ob.tint });
    if (ob.grass) {
      // Pokémon tall grass: the blades in front of the feet are redrawn over the sprite's bottom rows
      for (let y = sy - 13; y <= sy + 2; y++) for (let x = sx - ax; x < sx - ax + b.w; x++) {
        const X = x + v.x0, Y = y + v.y0; if (!v.at('tall', X, Y) || !out.inside(x, y)) continue;
        const tb = tallBlade(X, Y, frame); if (tb && (Y % 16) > 3) out.set(x, y, tb);
      }
    }
    if (ob.over) ob.over(out, sx, sy);
  }
  return out;
}

export { props, bld };

/**
 * One Wang-corner autotile of `layer` (32×32): corner case c = TL | TR<<1 | BL<<2 | BR<<3 over the `base` layers
 * ({ sand: 1, ... } = layers set everywhere). Rendered through the same raster as the world (edges, faces, foam).
 */
export function wangTile(layer, c, base = {}, frame = 0) {
  const bit = (cx, cy) => { const i = Math.min(1, Math.max(0, cx - 1)), j = Math.min(1, Math.max(0, cy - 1)); return (c >> (j * 2 + i)) & 1; };
  const corner = {}; for (const L of LAYERS) corner[L] = L === layer ? bit : () => (base[L] ? 1 : 0);
  const Wf = { corner, mask: (L, x, y) => maskAt(corner[L], L, x, y), geo: { pave: () => -1, clear: () => 0, pond: () => 0, clearAt: () => null }, teamAt: () => 0 };
  return renderView(Wf, TILE, TILE, TILE, TILE, { frame, noProps: true, noFountain: true }).ground;
}

/** material swatches (size×size) for the tileset sheet: [name, Bitmap][] */
export function materialSwatches(n = 64) {
  const sw = (fn) => { const b = new Bitmap(n, n); for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) b.set(x, y, fn(x, y)); return b; };
  const out = [
    ['GRASS', sw((x, y) => grassCol(x, y))], ['LAWN', sw((x, y) => lawnCol(x, y))], ['FLOOR', sw((x, y) => floorCol(x, y))],
    ['DIRT', sw((x, y) => dirtCol(x, y))], ['SAND', sw((x, y) => sandCol(x, y))],
  ];
  for (let f = 0; f < 4; f++) out.push(['WATER F' + f, sw((x, y) => waterCol(x, y, 9, false, f))]);
  out.push(['DEEP', sw((x, y) => waterCol(x, y, 30, true, 0))], ['SHALLOW', sw((x, y) => waterCol(x, y, 9, false, 0, true))]);
  out.push(['PAVE B', sw((x, y) => paveCol(x, y, 0))], ['PAVE R', sw((x, y) => paveCol(x, y, 1))]);
  for (let f = 0; f < 2; f++) out.push(['TALL F' + f, sw((x, y) => tallBlade(x, y, f) || PAL.tall[1])]);
  out.push(['CLIFF', sw((x, y) => (y < FACE ? cliffCol(x, FACE - y) : PAL.grass[2]))]);
  return out;
}
export const MAPDATA = { LANES, RIVER, STRUCTS, FOUNTAINS, PITS, CAMPS, BASES, BRUSH, TRAILS, MEADOWS, SHOP, habitats };
void rng;
