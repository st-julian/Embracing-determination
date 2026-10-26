// mt/voxel/world.js — the VOXEL WORLD (owner: environment): a high-detail voxel "Black/White overworld" built from the
// real map and rendered inside the live engine. Render only: collision, heights and walkable shapes stay the sim's
// (map-*.js / height-*.js); every column samples them, so the art matches where units can walk.
//
// Flag: ?world=voxel | 3d  ->  app.mtWorldStyle. In voxel mode world-art (world-*.js) builds this and hides its own
// terrain / water / props, and the structures system hides its tower / nexus / decor meshes.
//
// How the detail is made (iPad budget: ~300 draws, 1-1.5 M triangles):
//   ground  coarse 0.5 m block columns carry the height steps (walkable ground keeps 0.1 m steps so feet stay on
//           heightAt). Their TOPS read a baked 16 texel/m nearest-filtered map (GROUND_TPM): every texel is a 1/16 m
//           voxel top with its bevel and pattern baked in (BW paving with borders and kerbs, fine-patterned grass,
//           dirt paths with ragged edges, sand, forest floor). SIDES are patterned in the shader in the same 1/16 m
//           grid (cliff courses, soil, brick, sand banks) with a hanging grass lip under every top edge.
//   water   one quad per underwater column; the shader adds soft shore bands and travelling white wave crests from
//           the map's alpha channel (shore proximity), quantised to the same texel grid.
//   relief  real voxels where relief matters: tall grass, flowers, pebbles and kerbs at DETAIL_M (1/20 m), BW round
//           layered trees at 1/8 m with a lit highlight side and deep hue-shifted shade, packed into tree walls.
//   palette game/art/tiles/palette.js (ramps tuned against the BW references).

import { VoxelModel, meshArrays, hash3, mix, scale, VOXEL_M, TERRAIN_M, DETAIL_M } from './kit.js';
import { o as heightAt, a as WATER_Y } from '../../assets/height-CVtQdZ3e.js';
import { _ as WALK, a as LANES, o as LANE_W, u as RIVER, g as riverDist, t as BASES, n as BRUSH, l as PITS, r as CAMPS, i as FOUNTAINS, x as segDist } from '../../assets/map-oE9sOnNc.js';
import { PAL } from '../../art/tiles/palette.js';
import { VoxelStructures } from './structures.js';
import { fadeMaterial, FadeDriver } from './fade.js';

/** 'voxel' | '3d' from the URL (default 3d until the voxel world is the default) — also published as app.mtWorldStyle */
export function worldStyle() {
  let s = 'voxel';   // default look; ?world=3d keeps the legacy 3D world
  try { const q = new URLSearchParams(location.search).get('world'); if (q === 'voxel' || q === '3d') s = q; } catch (e) { /* no location */ }
  try { const a = globalThis.__moba; if (a) a.mtWorldStyle = s; } catch (e) { /* */ }
  return s;
}

// ------------------------------------------------------------------------------------------------ palette
const I = (c) => (c[0] << 16) | (c[1] << 8) | c[2];
const RP = {}; for (const k in PAL) RP[k] = PAL[k].map(I);          // ramps as 0xRRGGBB, dark -> light
const TEAM_RAMP = [RP.blue, RP.red], PAVE = [RP.paveBlue, RP.paveRed];

const X0 = -12, N = 288, B = TERRAIN_M;          // columns cover -12 .. 132 m (map 0..120 + a margin)
const VOID = -1e3, SKIRT = -6;                   // columns lower than this are not drawn; island skirt bottom
const CH = 32;                                    // columns per chunk side (16 m)
const TPM = 16;                                   // ground texels per metre (each texel = one 1/16 m voxel top)
const M0 = -4, MN = 2048;                         // ground map covers -4 .. 124 m

const lin = (u) => { const s = u / 255; return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
const LIN = new Float32Array(256); for (let i = 0; i < 256; i++) LIN[i] = lin(i);
const K = { VOID: 0, GRASS: 1, PATH: 2, RIVER: 3, SHORE: 4, PLATEAU: 5, PLAZA: 6, PIT: 7, BRUSH: 8, CAMP: 9 };

function laneDist(x, z) {
  let d = 1e9;
  for (const k in LANES) { const P = LANES[k]; for (let i = 0; i < P.length - 1; i++) d = Math.min(d, segDist(x, z, P[i].x, P[i].y, P[i + 1].x, P[i + 1].y)); }
  return d;
}
// smooth value noise (for large-scale patches)
function vnoise(x, z, s) {
  const xi = Math.floor(x), zi = Math.floor(z), fx = x - xi, fz = z - zi;
  const a = hash3(xi, s, zi), b = hash3(xi + 1, s, zi), c = hash3(xi, s, zi + 1), d = hash3(xi + 1, s, zi + 1);
  const u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

// ------------------------------------------------------------------------------------------------ terrain columns
function sampleColumns() {
  const top = new Float32Array(N * N), kind = new Uint8Array(N * N), ld = new Float32Array(N * N), team = new Int8Array(N * N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const x = X0 + (i + 0.5) * B, z = X0 + (j + 0.5) * B, id = j * N + i;
    const h = heightAt(x, z);
    team[id] = -1;
    if (h < SKIRT + 0.5) { top[id] = VOID; kind[id] = K.VOID; ld[id] = 99; continue; }
    const w = WALK(x, z), r = riverDist(x, z), l = laneDist(x, z);
    ld[id] = l;
    let t = w > -0.25 || h < 0.6 ? Math.round(h / 0.1) * 0.1 : Math.round(h / 0.5) * 0.5;
    let k = K.GRASS;
    if (w <= -0.25 && h > 0.6) k = K.PLATEAU;
    else if (r < RIVER.halfWidth + 0.2 && t < WATER_Y - 0.02) {
      k = K.RIVER;
      if (l < LANE_W - 0.4) t = Math.max(t, Math.round((WATER_Y - 0.34) / 0.1) * 0.1);   // lane fords: shallow, units wade 0.34 m
    } else if (r < RIVER.halfWidth + 1.4) k = K.SHORE;
    else {
      let base = null;
      for (const b of BASES) if (Math.hypot(x - b.x, z - b.y) < b.radius - 1.5) base = b;
      let pit = false; for (const p of PITS) if (Math.hypot(x - p.x, z - p.y) < p.radius - 0.3) pit = true;
      let brush = false; for (const b of BRUSH) if (Math.hypot(x - b.x, z - b.y) < b.r + 0.1) brush = true;
      let camp = false; for (const cp of CAMPS) if (!cp.epic && Math.hypot(x - cp.x, z - cp.y) < 3.4) camp = true;
      if (pit) k = K.PIT;
      else if (base) { k = K.PLAZA; team[id] = base.team; }
      else if (brush) k = K.BRUSH;
      else if (l < LANE_W - 0.6) k = K.PATH;
      else if (camp) k = K.CAMP;
    }
    top[id] = t; kind[id] = k;
  }
  return { top, kind, ld, team };
}

// ------------------------------------------------------------------------------------------------ the ground map
// RGB: the voxel-top colour of every 1/16 m texel (patterns + bevels baked). A: water shore proximity (255 at the shore).
function bakeGround(S) {
  const { top, kind, ld } = S;
  const data = new Uint8Array(MN * MN * 4);
  const col = (x, z) => { const i = Math.floor((x - X0) / B), j = Math.floor((z - X0) / B); return i < 0 || j < 0 || i >= N || j >= N ? -1 : j * N + i; };
  // bilinear lane distance and bed height from the column samples (ragged path edges, soft shores)
  const bil = (A, x, z) => {
    const fx = (x - X0) / B - 0.5, fz = (z - X0) / B - 0.5, i = Math.max(0, Math.min(N - 2, Math.floor(fx))), j = Math.max(0, Math.min(N - 2, Math.floor(fz)));
    const u = Math.min(1, Math.max(0, fx - i)), v = Math.min(1, Math.max(0, fz - j));
    const a = A[j * N + i], b = A[j * N + i + 1], c = A[(j + 1) * N + i], d = A[(j + 1) * N + i + 1];
    return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
  };
  const G = RP.grass, GB = RP.grassB, F = RP.floor, D = RP.dirt, SA = RP.sand, T = RP.tall, RO = RP.rock, WH = RP.white;
  // a 2 m periodic grass tile: blades (light tip over a dark root texel) and specks, BW-regular
  const grassTex = (tx, tz, R) => {
    const px = tx & 31, pz = tz & 31;
    const bl = (a, b) => hash3(a & 31, 3, b & 31, 77) < 0.075;
    if (bl(px, pz)) return R[4];
    if (bl(px, pz - 1)) return R[1];
    const h = hash3(px, 5, pz, 78);
    if (h > 0.94) return R[3];
    if (h < 0.03) return R[1];
    return R[2];
  };
  const out = (o, c, a) => { data[o] = (c >> 16) & 255; data[o + 1] = (c >> 8) & 255; data[o + 2] = c & 255; data[o + 3] = a; };
  for (let v = 0; v < MN; v++) {
    const z = M0 + (v + 0.5) / TPM, tz = Math.floor(z * TPM);
    for (let u = 0; u < MN; u++) {
      const x = M0 + (u + 0.5) / TPM, tx = Math.floor(x * TPM), o = (v * MN + u) * 4;
      const id = col(x, z); if (id < 0) { out(o, F[2], 0); continue; }
      const k = kind[id];
      let c = G[2], a = 0;
      if (k === K.GRASS || k === K.CAMP || k === K.SHORE || k === K.PATH) {
        // grass fields, with the dirt path drawn from the smooth lane distance so its edge is ragged, not blocky
        const l = bil(ld, x, z) + (hash3(tx >> 1, 9, tz >> 1) - 0.5) * 0.22;
        const edge = LANE_W - 0.6;
        const patch = vnoise(x / 7, z / 7, 3) > 0.58;
        c = grassTex(tx, tz, patch ? GB : G);
        if (l < edge) {
          const hp = hash3(tx, 11, tz);
          c = hp < 0.05 ? D[2] : hp > 0.95 ? D[4] : (vnoise(x * 1.3, z * 1.3, 4) > 0.66 ? mix(D[3], D[2], 0.5) : D[3]);
          // pebbles: 2x2 texel stones, lit top-left
          const cx = tx >> 2, cz = tz >> 2;
          if (hash3(cx, 12, cz) < 0.025) { const lx = tx & 3, lz = tz & 3; if (lx < 2 && lz < 2) c = lx + lz === 0 ? RO[4] : lx + lz === 2 ? RO[2] : RO[3]; }
          if (l > edge - 0.13) c = D[1];                                         // dark rim texel row
        } else if (l < edge + 0.12 && hash3(tx, 13, tz) < 0.5) c = G[1];        // grass shade at the path edge
        if (k === K.CAMP) {
          let dc = 1e9; for (const cp of CAMPS) dc = Math.min(dc, Math.hypot(x - cp.x, z - cp.y));
          if (dc < 2.9 + (hash3(tx >> 1, 14, tz >> 1) - 0.5) * 0.4) { const hp = hash3(tx, 15, tz); c = hp < 0.08 ? D[1] : hp > 0.93 ? D[4] : D[2]; }
        }
        if (k === K.SHORE || riverDist(x, z) < RIVER.halfWidth + 1.4) {
          const r = riverDist(x, z) + (hash3(tx >> 1, 16, tz >> 1) - 0.5) * 0.25;
          if (r < RIVER.halfWidth + 1.05) { const hp = hash3(tx, 17, tz); c = r < RIVER.halfWidth + 0.45 ? (hp < 0.1 ? SA[2] : SA[3]) : (hp < 0.07 ? SA[2] : hp > 0.92 ? SA[5] : SA[4]); }
          else if (r < RIVER.halfWidth + 1.25) c = G[1];
        }
      } else if (k === K.RIVER) {
        const hp = hash3(tx, 18, tz);
        c = hp < 0.08 ? SA[1] : hp > 0.9 ? SA[3] : SA[2];
        const cx = tx >> 2, cz = tz >> 2;
        if (hash3(cx, 19, cz) < 0.08) { const lx = tx & 3, lz = tz & 3; if (lx < 3 && lz < 2) c = lx + lz === 0 ? RO[4] : RO[3]; }
        const bed = bil(top, x, z) + (hash3(tx >> 1, 24, tz >> 1) - 0.5) * 0.06;
        a = Math.round(255 * Math.min(1, Math.max(0, (WATER_Y - bed) / 1.0)));      // smooth depth 0..1 m
      } else if (k === K.PLATEAU) {
        const hp = hash3(tx, 20, tz), n = vnoise(x / 3, z / 3, 5);
        c = hp < 0.08 ? F[1] : hp > 0.93 ? F[4] : n > 0.6 ? F[3] : F[2];
      } else if (k === K.BRUSH) {
        const hp = hash3(tx, 21, tz); c = hp < 0.2 ? T[0] : hp > 0.85 ? T[2] : T[1];
      } else if (k === K.PIT) {
        // cracked dark slabs, 0.75 m
        const lx = tx % 12, lz = tz % 12, s = hash3(Math.floor(tx / 12), 22, Math.floor(tz / 12));
        c = lx === 0 || lz === 0 ? RO[0] : lx === 1 || lz === 1 ? RO[2] : s < 0.4 ? RO[1] : RO[2];
        if (hash3(tx, 23, tz) < 0.03) c = RO[0];
      } else if (k === K.PLAZA) c = plazaTex(x, z, tx, tz, S.team[id]);
      out(o, c, a);
    }
  }
  return data;
}

// BW paving: 0.5 m slabs (8x8 texels) with a mortar line, a lit top-left bevel and a dark bottom-right edge; patterned
// diamond borders round the plaza, the Nexus and the fountain, a team-colour line, white kerbs at the plaza edge.
function plazaTex(x, z, tx, tz, team) {
  const P = PAVE[team === 1 ? 1 : 0], TR = TEAM_RAMP[team === 1 ? 1 : 0], W = RP.white;
  const b = BASES[team === 1 ? 1 : 0];
  const dB = Math.hypot(x - b.x, z - b.y);
  let nx = null, fo = null;
  for (const s of [{ x: team === 1 ? 102 : 18, y: team === 1 ? 18 : 102 }]) nx = Math.hypot(x - s.x, z - s.y);
  for (const f of FOUNTAINS) if (f.team === team) fo = Math.hypot(x - f.x, z - f.y);
  const band = (d, r0, r1) => d >= r0 && d < r1;
  const diamond = () => {
    const lx = tx & 7, lz = tz & 7, q = Math.abs(lx - 3.5) + Math.abs(lz - 3.5);
    return q < 2 ? W[3] : q < 3 ? P[4] : q < 4 ? P[2] : P[3];
  };
  // kerb at the outer plaza edge
  if (dB > b.radius - 1.5 - 0.25) { const j = Math.floor(Math.atan2(z - b.y, x - b.x) * b.radius * 2); return (tx + tz) % 9 === 0 || j % 7 === 0 ? W[1] : dB > b.radius - 1.5 - 0.07 ? W[2] : W[4]; }
  // a darker border band of 0.5 m setts outside the diamond ring; grass breaks through its joints in patches
  if (band(dB, b.radius - 2.5, b.radius - 1.75)) {
    const g = vnoise(x * 0.9, z * 0.9, 41);
    if (g > 0.52 && hash3(tx, 42, tz) < (g - 0.52) * 2.4) return RP.grass[hash3(tx, 43, tz) < 0.5 ? 2 : 3];
    const lx = tx & 7, lz = tz & 7;
    if (lx === 7 || lz === 7) return g > 0.45 ? RP.grass[1] : P[1];
    if (lx === 0 || lz === 0) return P[3];
    return hash3(tx >> 3, 44, tz >> 3) < 0.3 ? P[2] : mix(P[2], P[3], 0.4);
  }
  // a mosaic emblem at the plaza centre: an eight-point team star in a white ring, gold heart, tesserae checker
  if (dB < 2.5) {
    const a = Math.atan2(z - b.y, x - b.x), star = 1.3 + 0.85 * Math.pow(Math.abs(Math.cos(a * 4)), 4), m = (tx + tz) & 1;
    if (dB > 2.36) return P[1];
    if (dB > 2.1) return m ? W[4] : W[3];
    if (dB < 0.32) return m ? RP.gold[3] : RP.gold[4];
    if (dB < star) return dB > star - 0.16 ? W[4] : (m ? TR[3] : TR[4]);
    return m ? TR[1] : TR[2];
  }
  if (band(dB, b.radius - 3.75, b.radius - 2.5)) {
    if (dB < b.radius - 3.62 || dB > b.radius - 2.63) return P[1];
    if (Math.abs(dB - (b.radius - 3.12)) < 0.07) return TR[3];
    return diamond();
  }
  if (nx != null && band(nx, 3.0, 4.25)) {
    if (nx < 3.1 || nx > 4.15) return P[1];
    if (Math.abs(nx - 3.62) < 0.07) return TR[4];
    return diamond();
  }
  if (fo != null && band(fo, 4.6, 5.6)) { if (fo > 5.48) return P[1]; if (Math.abs(fo - 5.05) < 0.07) return TR[3]; return diamond(); }
  // 1 m square slabs: a soft mortar line, a lit top-left bevel, a darker lower-right edge, gentle per-slab tone
  const lx = tx & 15, lz = tz & 15, s = hash3(tx >> 4, 31, tz >> 4);
  if (lx === 15 || lz === 15) return mix(P[2], P[1], 0.35);
  if (lx === 0 || lz === 0) return mix(P[3], P[4], 0.75);
  if (lx === 14 || lz === 14) return mix(P[3], P[2], 0.55);
  if (hash3(tx, 32, tz) < 0.012) return mix(P[3], P[2], 0.5);
  return s < 0.3 ? mix(P[3], P[4], 0.35) : s > 0.85 ? mix(P[3], P[2], 0.15) : mix(P[3], P[4], 0.12);
}

// ------------------------------------------------------------------------------------------------ terrain mesh
// per-vertex aMat: x = side pattern (1 rock courses, 2 soil, 3 brick, 4 sand), y = lip ramp (-1 none, 0 grass,
// 1 forest floor, 2 sand, 3 kerb stone), z = the column top (m)
const SIDE = { ROCK: 1, SOIL: 2, BRICK: 3, SAND: 4 };
function sideOf(k, y, t) {
  if (k === K.PLAZA) return [SIDE.BRICK, 3];
  if (k === K.RIVER || k === K.SHORE) return [SIDE.SAND, 2];
  if (k === K.PLATEAU) return [SIDE.ROCK, 0];
  if (k === K.PATH || k === K.CAMP) return [SIDE.SOIL, -1];
  if (k === K.PIT) return [SIDE.ROCK, -1];
  return [t - y < 0.45 ? SIDE.SOIL : SIDE.ROCK, 0];
}
function buildTerrain(THREE, S, mat) {
  const { top, kind } = S;
  const at = (i, j) => (i < 0 || j < 0 || i >= N || j >= N ? VOID : top[j * N + i]);
  const meshes = [];
  for (let cj = 0; cj < N; cj += CH) for (let ci = 0; ci < N; ci += CH) {
    const P = [], Nn = [], Cc = [], Mm = [], Ix = [];
    let v = 0;
    const quad = (a, b, c, d, n, tint, ao, m) => {
      P.push(...a, ...b, ...c, ...d);
      for (let q = 0; q < 4; q++) { Nn.push(n[0], n[1], n[2]); const s = tint * ao[q]; Cc.push(s, s, s); Mm.push(m[0], m[1], m[2], 0); }
      if (ao[0] + ao[2] < ao[1] + ao[3]) Ix.push(v + 1, v + 2, v + 3, v + 1, v + 3, v); else Ix.push(v, v + 1, v + 2, v, v + 2, v + 3);
      v += 4;
    };
    for (let j = cj; j < Math.min(N, cj + CH); j++) for (let i = ci; i < Math.min(N, ci + CH); i++) {
      const id = j * N + i, t = top[id]; if (t <= VOID + 1) continue;
      const x0 = X0 + i * B, z0 = X0 + j * B, x1 = x0 + B, z1 = z0 + B, k = kind[id];
      const hi = (di, dj) => at(i + di, j + dj) > t + 0.15;
      const cAO = (sx, sz) => { const s1 = hi(sx, 0), s2 = hi(0, sz), cr = hi(sx, sz); const l = s1 && s2 ? 3 : (s1 ? 1 : 0) + (s2 ? 1 : 0) + (cr ? 1 : 0); return [1, 0.8, 0.66, 0.55][l]; };
      quad([x0, t, z1], [x1, t, z1], [x1, t, z0], [x0, t, z0], [0, 1, 0], 1, [cAO(-1, 1), cAO(1, 1), cAO(1, -1), cAO(-1, -1)], [0, -1, t]);
      for (const [di, dj, n] of [[1, 0, [1, 0, 0]], [-1, 0, [-1, 0, 0]], [0, 1, [0, 0, 1]], [0, -1, [0, 0, -1]]]) {
        let nb = at(i + di, j + dj); if (nb <= VOID + 1) nb = SKIRT;
        if (nb >= t - 0.001) continue;
        const tint = n[0] ? 0.9 : n[2] > 0 ? 0.97 : 0.84;
        let yTop = t;
        while (yTop > nb + 1e-4) {
          const yBot = Math.max(nb, Math.ceil(yTop / 0.5 - 1e-6) * 0.5 - 0.5);
          const [side, lip] = sideOf(k, yTop, t);
          const aoB = yBot <= nb + 1e-4 && nb > SKIRT ? 0.7 : 1;
          let a, b, cc, d;
          if (di === 1) { a = [x1, yBot, z1]; b = [x1, yBot, z0]; cc = [x1, yTop, z0]; d = [x1, yTop, z1]; }
          else if (di === -1) { a = [x0, yBot, z0]; b = [x0, yBot, z1]; cc = [x0, yTop, z1]; d = [x0, yTop, z0]; }
          else if (dj === 1) { a = [x0, yBot, z1]; b = [x1, yBot, z1]; cc = [x1, yTop, z1]; d = [x0, yTop, z1]; }
          else { a = [x1, yBot, z0]; b = [x0, yBot, z0]; cc = [x0, yTop, z0]; d = [x1, yTop, z0]; }
          quad(a, b, cc, d, n, tint, [aoB, aoB, 1, 1], [side, lip, t]);
          yTop = yBot;
        }
      }
    }
    if (!v) continue;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(Nn), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(Cc), 3));
    g.setAttribute('aMat', new THREE.BufferAttribute(new Float32Array(Mm), 4));
    g.setIndex(new THREE.BufferAttribute(v > 65535 ? new Uint32Array(Ix) : new Uint16Array(Ix), 1));
    g.computeBoundingSphere();
    const m = new THREE.Mesh(g, mat);
    m.name = `voxel-terrain-${ci / CH}-${cj / CH}`; m.castShadow = false; m.receiveShadow = true; m.matrixAutoUpdate = false;   // perf: ground blocks stay out of the shadow pass
    meshes.push(m);
  }
  return meshes;
}

const linV = (THREE, c) => new THREE.Vector3(LIN[(c >> 16) & 255], LIN[(c >> 8) & 255], LIN[c & 255]);
function groundMaterial(THREE, tex) {
  // side ramps (6 each): rock = cliff, soil = dirt darks, brick = stone, sand; lips: grass, forest floor, sand, kerb
  const ledge = [0, 1, 2, 3, 4, 5].map((k) => mix(RP.rock[Math.min(4, k)], RP.cliff[k], 0.5));
  const ramps = [ledge, [RP.dirt[0], RP.dirt[0], RP.dirt[1], RP.dirt[1], RP.dirt[2], RP.dirt[3]], RP.stone, RP.sand,
    RP.grass, RP.floor, RP.sand, RP.white.concat([RP.white[4]])];
  const uR = []; for (const r of ramps) for (let k = 0; k < 6; k++) uR.push(linV(THREE, r[Math.min(k, r.length - 1)]));
  const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTop = { value: tex };
    sh.uniforms.uRamp = { value: uR };
    sh.vertexShader = 'attribute vec4 aMat;\nvarying vec4 vMat;\nvarying vec3 vW;\nvarying vec3 vNW;\n' + sh.vertexShader.replace('#include <project_vertex>',
      '#include <project_vertex>\n  vW = (modelMatrix * vec4(transformed, 1.0)).xyz; vMat = aMat; vNW = normal;');
    sh.fragmentShader = `uniform sampler2D uTop;
uniform vec3 uRamp[48];
varying vec4 vMat;
varying vec3 vW;
varying vec3 vNW;
float vxH(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
vec3 vxR(int r, int k) { return uRamp[r * 6 + clamp(k, 0, 5)]; }
vec3 vxSide(float a, float y) {
  float ta = floor(a * ${TPM}.0), ty = floor(y * ${TPM}.0), dTop = vMat.z - y;
  int side = int(vMat.x + 0.5), lip = int(vMat.y + 0.5);
  // the hanging lip of the top surface: grass / moss over the edge with ragged drips
  if (vMat.y > -0.5) {
    float hang = 2.0 + floor(vxH(vec2(ta, 7.0)) * 2.2);
    if (lip <= 1 && vxH(vec2(ta, 8.0)) < 0.22) hang += 2.0 + floor(vxH(vec2(ta, 9.0)) * 4.0);
    if (dTop * ${TPM}.0 < hang) return vxR(4 + lip, dTop * ${TPM}.0 < 1.0 ? 3 : (dTop * ${TPM}.0 > hang - 1.0 ? 0 : 1));
  }
  float h = vxH(vec2(ta, ty));
  if (side == 1) {            // rock ledges: rounded stones in 0.25 m courses, lit top rows, dark joints and undersides
    float row = floor(y * 4.0), u = ta + floor(vxH(vec2(row, 3.0)) * 8.0);
    float lx = mod(u, 9.0), ly = mod(ty, 4.0), st = vxH(vec2(floor(u / 9.0), row));
    if (lx < 1.0) return vxR(0, 0);
    if ((lx < 2.0 || lx > 7.0) && (ly < 1.0 || ly > 2.0)) return vxR(0, ly < 1.0 ? 0 : 1);
    if (ly < 1.0) return vxR(0, 1);
    if (ly > 2.0) return vxR(0, st < 0.5 ? 4 : 5);
    return vxR(0, st < 0.35 ? 2 : 3);
  }
  if (side == 2) return vxR(1, h < 0.12 ? 1 : h > 0.9 ? 4 : (mod(ty, 3.0) < 1.0 ? 2 : 3));
  if (side == 3) {            // brick: 0.25 x 0.125 m
    float row = floor(y * 8.0), lx = mod(ta + mod(row, 2.0) * 2.0, 4.0), ly = mod(ty, 2.0);
    if (ly < 1.0 && lx < 1.0) return vxR(2, 1);
    if (ly < 1.0) return vxR(2, 2);
    return vxR(2, vxH(vec2(floor((ta + mod(row, 2.0) * 2.0) / 4.0), row)) < 0.3 ? 3 : 4);
  }
  return vxR(3, mod(ty, 3.0) < 1.0 ? 2 : (h < 0.1 ? 1 : 3));
}
` + sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
  {
    vec3 pc;
    if (vNW.y > 0.5) pc = texture2D(uTop, (floor(vW.xz * ${TPM}.0) + 0.5 - ${(M0 * TPM).toFixed(1)}) / ${MN}.0).rgb;
    else pc = vxSide(abs(vNW.x) > 0.5 ? vW.z : vW.x, vW.y);
    diffuseColor.rgb *= pc;
  }`);
  };
  mat.customProgramCacheKey = () => 'voxel-ground-2';
  return mat;
}

// ------------------------------------------------------------------------------------------------ water
function buildWater(THREE, S, tex) {
  const { top } = S, P = [], Dd = [], Ix = [];
  let v = 0;
  const y = WATER_Y;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const t = top[j * N + i]; if (t <= VOID + 1 || t >= y - 0.01) continue;
    const x0 = X0 + i * B, z0 = X0 + j * B, d = Math.min(1, (y - t) / 1.0);
    P.push(x0, y, z0 + B, x0 + B, y, z0 + B, x0 + B, y, z0, x0, y, z0);
    Dd.push(d, d, d, d);
    Ix.push(v, v + 1, v + 2, v, v + 2, v + 3); v += 4;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3));
  g.setAttribute('aDepth', new THREE.BufferAttribute(new Float32Array(Dd), 1));
  g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(P.length).map((_, k) => (k % 3 === 1 ? 1 : 0)), 3));
  g.setIndex(new THREE.BufferAttribute(v > 65535 ? new Uint32Array(Ix) : new Uint16Array(Ix), 1));
  g.computeBoundingSphere();
  const W = RP.water, SH = RP.shallow;
  const mat = new THREE.MeshLambertMaterial({ transparent: true, depthWrite: false });
  mat.userData.uTime = { value: 0 };
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = mat.userData.uTime;
    sh.uniforms.uTop = { value: tex };
    sh.uniforms.uW = { value: [SH[2], SH[3], SH[4], W[4], W[1], W[5], W[3]].map((c) => linV(THREE, c)) };
    sh.vertexShader = 'attribute float aDepth;\nvarying float vD;\nvarying vec3 vW;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n  vD = aDepth; vW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = 'uniform float uTime;\nuniform sampler2D uTop;\nuniform vec3 uW[7];\nvarying float vD;\nvarying vec3 vW;\nfloat vxH(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }\n' +
      sh.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
  {
    vec2 cell = floor(vW.xz * ${TPM}.0);
    float d = texture2D(uTop, (cell + 0.5 - ${(M0 * TPM).toFixed(1)}) / ${MN}.0).a;
    float sh = clamp(1.0 - d / 0.4, 0.0, 1.0);                      // shore proximity
    vec3 c = d < 0.12 ? uW[2] : d < 0.3 ? uW[1] : d < 0.55 ? uW[0] : uW[6];
    float a = d < 0.12 ? 0.55 : d < 0.3 ? 0.66 : d < 0.55 ? 0.76 : 0.84;
    if (d >= 0.55) {                                                   // deep: darker swirl patches with ring ripples
      vec2 q = cell / 40.0, i0 = floor(q), f = fract(q); f = f * f * (3.0 - 2.0 * f);
      float n = mix(mix(vxH(i0), vxH(i0 + vec2(1.0, 0.0)), f.x), mix(vxH(i0 + vec2(0.0, 1.0)), vxH(i0 + vec2(1.0, 1.0)), f.x), f.y);
      if (n > 0.6) { c = uW[4]; if (fract(n * 14.0 - uTime * 0.15) < 0.12) c = uW[6]; }
      if (mod(cell.y + floor(cell.x / 6.0) * 3.0, 9.0) < 1.0 && vxH(floor(cell / vec2(6.0, 9.0))) > 0.55) c = uW[3];   // ripple dashes
    }
    // white wave crests travelling in to the shore, a solid foam line at the edge, the odd sparkle
    float grp = vxH(floor(cell / 12.0));
    float ph = fract(sh * 2.2 - uTime * 0.28 + grp * 0.5);
    if (sh > 0.12 && sh < 0.86 && ph < 0.085 && vxH(vec2(cell.x, cell.y * 0.37)) > 0.2) { c = uW[5]; a = 0.95; }
    if (sh > 0.86) { c = uW[5]; a = 0.9; }
    if (vxH(cell + floor(uTime * 1.5) * 7.13) > 0.9975) { c = uW[5]; a = 0.95; }
    if (sh < 0.05 && mod(cell.x + cell.y, 16.0) < 1.0 && vxH(floor(cell / 16.0) + floor(uTime * 0.5)) > 0.7) c = uW[6];
    diffuseColor = vec4(c, a);
  }`);
  };
  mat.customProgramCacheKey = () => 'voxel-water-2';
  const m = new THREE.Mesh(g, mat);
  m.name = 'voxel-water'; m.renderOrder = 2; m.receiveShadow = true; m.matrixAutoUpdate = false;
  return m;
}

// ------------------------------------------------------------------------------------------------ trees (1/8 m)
// BW round trees: two or three layered blobs with scalloped rims, a bright highlight upper-left, a deep hue-shifted
// shade lower-right (ramp darks are blue-green), a dark band where a layer overhangs the one below.
const LIGHT = (() => { const l = [-0.55, 0.72, 0.42], s = Math.hypot(...l); return l.map((v) => v / s); })();
function canopy(m, cx, cy, cz, rx, ry, R, seed, under) {
  const lumps = [];
  for (let k = 0; k < 9; k++) { const a = (k / 9) * Math.PI * 2 + seed; lumps.push([cx + Math.cos(a) * rx * 0.78, cy - ry * 0.15, cz + Math.sin(a) * rx * 0.78, rx * 0.36]); }
  for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) for (let z = Math.floor(cz - rx - 2); z <= Math.ceil(cz + rx + 2); z++) for (let x = Math.floor(cx - rx - 2); x <= Math.ceil(cx + rx + 2); x++) {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, dz = (z + 0.5 - cz) / rx;
    let inside = dx * dx + dy * dy * (dy < 0 ? 1.8 : 1) + dz * dz <= 1;
    if (!inside) for (const [lx, ly, lz, lr] of lumps) { const ex = x + 0.5 - lx, ey = (y + 0.5 - ly) * 1.25, ez = z + 0.5 - lz; if (ex * ex + ey * ey + ez * ez <= lr * lr) { inside = true; break; } }
    if (!inside) continue;
    const nx = dx, ny = dy, nz = dz, nl = Math.hypot(nx, ny, nz) || 1;
    let l = (nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]) / nl;
    l += (hash3(x >> 1, y >> 1, z >> 1, seed) - 0.5) * 0.35;                     // leaf clusters
    let k = l > 0.86 ? 5 : l > 0.58 ? 4 : l > 0.22 ? 3 : l > -0.15 ? 2 : 1;
    if (dy < -0.3) k = Math.min(k, 1);
    if (dy < -0.5 || (dx * dx + dz * dz > 0.86 && l < 0.05)) k = 0;            // ink rim: the underside and shaded outline
    m.set(x, y, z, R[k]);
  }
}
const TREE_M = 1 / 8;                                                 // trees: 1/8 m voxels (ground-detail grid)
function treeModel(kind, seed) {
  const L = [RP.leaf, RP.leafB, RP.pine][kind === 3 ? 2 : kind % 2], BK = RP.bark;
  if (kind === 3) {                                                     // a BW pine: stacked rounded tiers
    const m = new VoxelModel(28, 48, 28);
    m.box(12, 0, 12, 14, 8, 14, (x, y, z) => (x === 12 ? BK[3] : z === 14 ? BK[1] : BK[2]));
    const tiers = [[6, 13, 7], [16, 10, 6], [25, 8, 6], [33, 5, 5]];
    tiers.forEach(([y0, r, h], k) => canopy(m, 13.5, y0 + h * 0.55, 13.5, r, h * 0.7, L, seed + k * 3, k > 0));
    m.set(13, 42, 13, L[5]);
    return m;
  }
  const big = kind === 2, W = big ? 40 : 34, H = big ? 40 : 36, c = W / 2;
  const m = new VoxelModel(W, H, W);
  const tr = 2;
  m.box(c - tr, 0, c - tr, c + tr - 1, big ? 14 : 11, c + tr - 1, (x, y, z) => (x === c - tr ? BK[3] : z === c + tr - 1 ? BK[1] : (hash3(x, y, z, 2) < 0.2 ? BK[1] : BK[2])));
  m.box(c - tr - 1, 0, c - 1, c + tr, 0, c, BK[1]); m.box(c - 1, 0, c - tr - 1, c, 0, c + tr, BK[1]);
  if (big) {
    canopy(m, c, 20, c, 17.6, 8, L, seed, false);
    canopy(m, c - 1.6, 27, c + 0.8, 12, 6.4, L, seed + 4, true);
    canopy(m, c - 2.4, 33, c + 1.6, 6.4, 4, L, seed + 7, true);
  } else {
    canopy(m, c, 18, c, 14.4, 7.2, L, seed, false);
    canopy(m, c - 1.6, 25, c + 0.8, 9.6, 5.6, L, seed + 4, true);
    if (kind === 1) canopy(m, c - 2.4, 30, c + 1.6, 4.8, 3.2, L, seed + 7, true);
  }
  return m;
}

// ------------------------------------------------------------------------------------------------ relief (DETAIL_M)
function tallGrassModel(seed) {
  // BW tall grass: a dense 0.5 m clump of pointed blades, dark roots to bright tips
  const T = RP.tall, m = new VoxelModel(10, 12, 10);
  for (let z = 0; z < 10; z++) for (let x = 0; x < 10; x++) {
    const h0 = hash3(x, seed, z, 41); if (h0 > 0.5) continue;
    const h = 6 + Math.floor(hash3(x, seed + 1, z, 42) * 5) + ((x + z + seed) % 3 === 0 ? 1 : 0);
    for (let y = 0; y < h; y++) m.set(x, y, z, y >= h - 1 ? T[5] : y >= h - 3 ? T[4] : y > h * 0.45 ? T[3] : y > 1 ? T[2] : T[1]);
  }
  return m;
}
function flowerModel(seed) {
  const FL = [RP.flowerR, RP.flowerY, RP.flowerW, RP.flowerK, RP.flowerP][seed % 5], G = RP.grass;
  const m = new VoxelModel(10, 7, 10);
  for (const [x, z, h] of [[2, 2, 4], [7, 3, 3], [3, 7, 3], [7, 7, 4]].slice(0, 2 + (seed % 3))) {
    m.box(x, 0, z, x, h - 1, z, G[1]); m.set(x + 1, 1, z, G[3]);
    m.set(x, h, z, FL[3]); m.set(x - 1, h, z, FL[2]); m.set(x + 1, h, z, FL[2]); m.set(x, h, z - 1, FL[2]); m.set(x, h, z + 1, FL[1]);
  }
  return m;
}
function pebbleModel(seed) {
  const R = RP.rock, m = new VoxelModel(8, 4, 8);
  m.ellipsoid(4, 0.6, 4, 3.4, 2.4, 2.8, (x, y, z) => (y >= 2 ? (x < 4 ? R[4] : R[3]) : x + z > 8 ? R[1] : R[2]));
  if (seed % 2) m.ellipsoid(1.6, 0.4, 6, 1.6, 1.4, 1.6, R[3]);
  return m;
}
function bushModel(seed) {
  const L = seed % 2 ? RP.leafB : RP.leaf, m = new VoxelModel(16, 12, 16);
  canopy(m, 8, 5, 8, 7, 5, L, seed + 2, false);
  if (seed % 3 === 0) for (const [x, z] of [[4, 6], [10, 10], [7, 3], [12, 5]]) m.set(x, 10, z, RP.flowerR[2]);
  return m;
}
function lilyModel(seed) {
  const G = RP.grass, m = new VoxelModel(12, 3, 12);
  for (let z = 0; z < 12; z++) for (let x = 0; x < 12; x++) {
    const dx = x + 0.5 - 6, dz = z + 0.5 - 6, d = Math.hypot(dx, dz), a = Math.atan2(dz, dx);
    if (d > 5.6 || (a > 0.2 && a < 0.75 && d > 1)) continue;
    m.set(x, 0, z, d > 4.6 ? G[1] : (x + z) % 5 === 0 ? G[4] : dx < 0 ? G[3] : G[2]);
  }
  if (seed % 2) { m.box(3, 1, 4, 4, 1, 5, RP.flowerK[3]); m.set(3, 2, 4, RP.flowerY[3]); m.set(4, 1, 6, RP.flowerK[2]); }
  return m;
}
function reedModel(seed) {
  const m = new VoxelModel(10, 22, 10), G = RP.tall;
  for (let k = 0; k < 7 + (seed % 3); k++) {
    const x = 1 + Math.floor(hash3(k, 1, seed) * 8), z = 1 + Math.floor(hash3(k, 2, seed) * 8), h = 10 + Math.floor(hash3(k, 3, seed) * 10);
    for (let y = 0; y < h; y++) m.set(x, y, z, y > h - 3 ? G[4] : y > h * 0.5 ? G[3] : G[2]);
    if (k % 3 === 0) { m.box(x, h - 4, z, x, h - 1, z, RP.wood[1]); m.set(x, h, z, G[4]); }
  }
  return m;
}
function tuftModel(seed) {
  const G = RP.grass, m = new VoxelModel(6, 5, 6);
  for (let k = 0; k < 6; k++) { const x = Math.floor(hash3(k, 1, seed) * 6), z = Math.floor(hash3(k, 2, seed) * 6), h = 2 + Math.floor(hash3(k, 3, seed) * 3); for (let y = 0; y < h; y++) m.set(x, y, z, y === h - 1 ? G[4] : G[2]); }
  return m;
}
function rockModel(seed) {
  const R = RP.rock, m = new VoxelModel(16, 10, 14);
  m.ellipsoid(8, 2, 7, 7, 6, 6, (x, y, z) => { const l = (-(x - 8) * 0.5 + (y - 2) * 0.8 + (z - 7) * 0.3) / 6; return l > 0.5 ? R[4] : l > 0.1 ? R[3] : l > -0.3 ? R[2] : R[1]; });
  if (seed % 2) m.box(5, 6, 4, 9, 6, 8, RP.grass[3]);
  return m;
}

// one geometry per model; drop the faces the camera never sees (downward, and the back faces pointing away from it)
function instGeo(THREE, model, size) {
  const a = meshArrays(model, { size });
  const keep = []; for (let q = 0; q < a.faces; q++) if (a.normals[q * 12 + 1] > -0.5 && a.normals[q * 12 + 2] > -0.5) keep.push(q);
  const P = new Float32Array(keep.length * 12), Nn = new Float32Array(keep.length * 12), Cc = new Float32Array(keep.length * 12), Ix = new Uint32Array(keep.length * 6);
  keep.forEach((q, k) => {
    P.set(a.positions.subarray(q * 12, q * 12 + 12), k * 12); Nn.set(a.normals.subarray(q * 12, q * 12 + 12), k * 12); Cc.set(a.colors.subarray(q * 12, q * 12 + 12), k * 12);
    for (let e = 0; e < 6; e++) Ix[k * 6 + e] = a.indices[q * 6 + e] - q * 4 + k * 4;
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(Nn, 3));
  g.setAttribute('color', new THREE.BufferAttribute(Cc, 3));
  g.setIndex(new THREE.BufferAttribute(keep.length * 4 > 65535 ? Ix : new Uint16Array(Ix), 1));
  g.computeBoundingSphere();
  return g;
}
/**
 * One InstancedMesh per model, culled on the CPU: every frame only the instances inside the camera's ground footprint
 * (widened toward the sun so off-screen casters still shade the view) are copied into the instance buffer. One draw
 * per model instead of one per cell, and nothing outside the view is vertex-processed.
 */
class VegLayer {
  constructor(THREE, g, mat, list, opts = {}) {
    this.n = list.length; this.xs = new Float32Array(this.n); this.zs = new Float32Array(this.n); this.src = new Float32Array(this.n * 16);
    list.forEach((it, k) => { this.xs[k] = it.x; this.zs[k] = it.z; it.m.toArray ? it.m.toArray(this.src, k * 16) : null; });
    this.im = new THREE.InstancedMesh(g, mat, Math.max(1, this.n));
    this.im.count = 0; this.im.frustumCulled = false;
    this.im.castShadow = opts.cast !== false; this.im.receiveShadow = true;
    this.key = '';
  }
  cull(box, key) {
    if (key === this.key) return; this.key = key;
    const dst = this.im.instanceMatrix.array; let k = 0;
    for (let i = 0; i < this.n; i++) {
      const x = this.xs[i], z = this.zs[i];
      if (x < box[0] || x > box[1] || z < box[2] || z > box[3]) continue;
      for (let e = 0; e < 16; e++) dst[k * 16 + e] = this.src[i * 16 + e];
      k++;
    }
    this.im.count = k; this.im.instanceMatrix.needsUpdate = true;
  }
}

function placeVegetation(THREE, S, fadeMat, plainMat, edgeMat, bushMat) {
  const out = [], { top, kind } = S;
  const M4 = () => new THREE.Matrix4(), Q = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0);
  const at = (x, z) => { const i = Math.floor((x - X0) / B), j = Math.floor((z - X0) / B); return i < 0 || j < 0 || i >= N || j >= N ? null : j * N + i; };
  const mk = (x, y, z, rot, s) => { Q.setFromAxisAngle(Y, rot); return { x, z, m: M4().compose(new THREE.Vector3(x, y, z), Q, new THREE.Vector3(s, s, s)) }; };
  const NT = 4, trees = [...Array(NT)].map(() => [[], []]);
  // tree walls: a packed jittered 2.2 m grid on every plateau / outer wall; trees near walkable ground cast shadows
  for (let z = -10; z < 130; z += 2.7) for (let x = -10; x < 130; x += 2.7) {
    const jx = x + (hash3(Math.round(x * 10), 7, Math.round(z * 10)) - 0.5) * 1.4, jz = z + (hash3(Math.round(x * 10), 8, Math.round(z * 10)) - 0.5) * 1.4;
    const id = at(jx, jz); if (id == null || kind[id] !== K.PLATEAU) continue;
    const w = WALK(jx, jz); if (w > -1.6) continue;                     // crowns never overhang where units walk
    const r = hash3(Math.round(jx * 7), 3, Math.round(jz * 7));
    const rim = w > -5.5, edge = w > -3.4;                              // edge: right next to walkable ground
    if (!rim && r < 0.35) continue;
    // trees beside walkable ground stay small (their crowns sit near units on screen); the wall interior grows big
    const t = edge ? (r < 0.5 ? 0 : r < 0.8 ? 1 : 3) : r < 0.4 ? 0 : r < 0.7 ? 1 : r < 0.88 ? 2 : 3;
    const sc = edge ? 0.55 + hash3(Math.round(jx), 5, Math.round(jz)) * 0.15 : 0.95 + hash3(Math.round(jx), 5, Math.round(jz)) * 0.3;
    trees[t][rim ? 0 : 1].push(mk(jx, top[id], jz, hash3(Math.round(jx * 3), 4, Math.round(jz * 3)) * 6.283, sc));
  }
  const grass = [[], [], []], flowers = [...Array(5)].map(() => []), pebbles = [[], []], bushes = [[], []], rocks = [[], []], lilies = [[], []], reeds = [[], []], tufts = [[], []];
  const isRiver = (i, j) => i >= 0 && j >= 0 && i < N && j < N && kind[j * N + i] === K.RIVER;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const id = j * N + i, k = kind[id]; if (k === K.VOID) continue;
    const x = X0 + (i + 0.5) * B, z = X0 + (j + 0.5) * B, t = top[id], h = hash3(i, 13, j), h2 = hash3(i, 14, j);
    if (k === K.BRUSH) { grass[Math.floor(h * 3)].push(mk(x, t, z, Math.floor(h2 * 4) * Math.PI / 2, 1)); continue; }
    if (k === K.RIVER) {
      const dep = WATER_Y - t, nearShore = !isRiver(i + 2, j) || !isRiver(i - 2, j) || !isRiver(i, j + 2) || !isRiver(i, j - 2);
      if (nearShore && dep > 0.1 && dep < 0.6 && S.ld[id] > LANE_W + 0.6 && h < 0.16) lilies[h < 0.05 ? 1 : 0].push(mk(x + (h2 - 0.5) * 0.3, WATER_Y + 0.012, z, h2 * 6.283, 0.8 + h * 2));
      continue;
    }
    if (k === K.SHORE && S.ld[id] > LANE_W + 0.6 && (isRiver(i + 1, j) || isRiver(i - 1, j) || isRiver(i, j + 1) || isRiver(i, j - 1)) && h < 0.3) { reeds[h < 0.15 ? 0 : 1].push(mk(x, Math.max(t, WATER_Y) - 0.05, z, h2 * 6.283, 0.9 + h)); continue; }
    if (k === K.PLAZA) {
      for (const b of BASES) { const dB = Math.hypot(x - b.x, z - b.y); if (dB > b.radius - 2.5 && dB < b.radius - 1.7 && vnoise(x * 0.9, z * 0.9, 41) > 0.55 && h < 0.5) tufts[h < 0.25 ? 0 : 1].push(mk(x + (h2 - 0.5) * 0.35, t, z + (h - 0.25) * 0.5, h2 * 6.283, 1)); }
      continue;
    }
    if (k === K.GRASS) {
      const meadow = vnoise(x / 5, z / 5, 9);
      if (meadow > 0.6 && h < 0.5) flowers[Math.floor(vnoise(x / 9, z / 9, 10) * 5) % 5].push(mk(x + (h2 - 0.5) * 0.3, t, z + (h - 0.25) * 0.4, h2 * 6.283, 1));
      else if (h < 0.05 && WALK(x, z) < 0.7) rocks[h < 0.025 ? 0 : 1].push(mk(x, t, z, h2 * 6.283, 0.7 + h2 * 0.4));
      else if (h > 0.97 && WALK(x, z) < 0.5) bushes[h2 < 0.5 ? 0 : 1].push(mk(x, t, z, h2 * 6.283, 0.8 + h2 * 0.3));
    } else if (k === K.PATH && h < 0.012) pebbles[h < 0.006 ? 0 : 1].push(mk(x + (h2 - 0.5) * 0.3, t, z, h2 * 6.283, 1));
    else if (k === K.PLATEAU && WALK(x, z) > -1.6 && h < 0.08) bushes[h < 0.09 ? 0 : 1].push(mk(x, t, z, h2 * 6.283, 0.9 + h2 * 0.4));
    else if (k === K.SHORE && h < 0.03) pebbles[1].push(mk(x, t, z, h2 * 6.283, 1.3));
  }
  const lay = (g, mat, L, o) => L.length && out.push(new VegLayer(THREE, g, mat, L, o));
  for (let t = 0; t < NT; t++) {
    const g = instGeo(THREE, treeModel(t, 3 + t * 5), TREE_M);
    lay(g, edgeMat, trees[t][0]); lay(g, edgeMat, trees[t][1], { cast: false });
  }
  grass.forEach((L, k) => lay(instGeo(THREE, tallGrassModel(k * 7 + 1), DETAIL_M), plainMat, L, { cast: false }));
  flowers.forEach((L, k) => lay(instGeo(THREE, flowerModel(k), DETAIL_M), plainMat, L, { cast: false }));
  pebbles.forEach((L, k) => lay(instGeo(THREE, pebbleModel(k), DETAIL_M), plainMat, L, { cast: false }));
  bushes.forEach((L, k) => lay(instGeo(THREE, bushModel(k + 1), TREE_M), bushMat, L, { cast: false }));
  rocks.forEach((L, k) => lay(instGeo(THREE, rockModel(k), DETAIL_M * 2), plainMat, L));
  lilies.forEach((L, k) => lay(instGeo(THREE, lilyModel(k), DETAIL_M), plainMat, L, { cast: false }));
  reeds.forEach((L, k) => lay(instGeo(THREE, reedModel(k + 2), DETAIL_M), plainMat, L, { cast: false }));
  tufts.forEach((L, k) => lay(instGeo(THREE, tuftModel(k + 5), DETAIL_M), plainMat, L, { cast: false }));
  out.forEach((l, k) => (l.im.name = 'voxel-veg-' + k));
  return out;
}

// ------------------------------------------------------------------------------------------------ the system
export class VoxelWorld {
  constructor(ctx) {
    const T0 = performance.now(), THREE = ctx.THREE;
    this.ctx = ctx; this.THREE = THREE;
    this.group = new THREE.Group(); this.group.name = 'voxel-world';
    const S = sampleColumns();
    const tS = performance.now();
    const tex = new THREE.DataTexture(bakeGround(S), MN, MN, THREE.RGBAFormat);
    tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false;
    tex.colorSpace = THREE.SRGBColorSpace; tex.needsUpdate = true; this.tex = tex;
    const tB = performance.now();
    this.groundMat = groundMaterial(THREE, tex);
    for (const m of buildTerrain(THREE, S, this.groundMat)) this.group.add(m);
    const tT = performance.now();
    this.water = buildWater(THREE, S, tex); this.group.add(this.water);
    this.fadeMat = fadeMaterial(THREE);
    this.plainMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    this.edgeMat = fadeMaterial(THREE, 'vx-fade-edge-1', {}, { edge: true });
    this.bushMat = fadeMaterial(THREE, 'vx-fade-edge-bush-1', {}, { edge: true, edgeY: 0.25 });
    this.veg = placeVegetation(THREE, S, this.fadeMat, this.plainMat, this.edgeMat, this.bushMat);
    for (const l of this.veg) this.group.add(l.im);
    const tV = performance.now();
    this.fade = new FadeDriver(THREE);
    this.structures = new VoxelStructures(THREE, ctx, this.group);
    this.group.traverse((o) => { if (o.isMesh && !o.isInstancedMesh) o.updateMatrix(); });
    this.group.updateMatrixWorld(true);
    ctx.scene.add(this.group);
    const pipe = ctx.pipeline;
    // look: AO is baked, so no screen-space AO; a light bloom for the crystals. A higher, whiter sun from the left and a
    // little in front (block faces towards the camera catch light, shadows fall right and away), stronger sky fill.
    try { pipe && pipe.setLook && pipe.setLook({ aoStrength: 0, bloomStrength: 0.2, sunDir: [-0.62, 1.0, 0.3], sunColor: [1, 0.95, 0.88], hemiIntensity: 0.8, skyColor: [0.66, 0.74, 1.0], groundColor: [0.5, 0.48, 0.62] }); } catch (e) { /* */ }
    let faces = 0; this.group.traverse((o) => { if (o.isMesh && !o.isInstancedMesh && o.geometry.index) faces += o.geometry.index.count / 6; });
    for (const l of this.veg) faces += l.im.geometry.index.count / 6 * l.n;
    this.stats = { buildMs: Math.round(performance.now() - T0), sampleMs: Math.round(tS - T0), bakeMs: Math.round(tB - tS), terrainMs: Math.round(tT - tB), vegMs: Math.round(tV - tT), quads: Math.round(faces) };
    try { console.info('[voxel-world] built', JSON.stringify(this.stats)); } catch (e) { /* */ }
  }
  update(t) {
    const u = this.water.material.userData.uTime; if (u) u.value = t.time || 0;
    const pipe = this.ctx.pipeline, post = pipe && pipe.post; if (post && post.aoPass) post.aoPass.enabled = false;
    if (pipe && pipe.sun && pipe.sun.shadow) pipe.sun.shadow.intensity = 0.62;          // soft BW shade on flat colours
    const cam = this.ctx.camera || (pipe && pipe.camera);
    this.fade.update(t.world, t.time, cam);
    this.cullVeg(cam);
    this.structures.update(t);
  }
  /** the camera's ground footprint (rays through the screen corners onto y = 1), widened toward the sun */
  cullVeg(cam) {
    let box = [-1e9, 1e9, -1e9, 1e9];
    try {
      const T = this.THREE, v = this._v || (this._v = new T.Vector3()), o = cam.position;
      cam.updateMatrixWorld(); let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
      for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, 1], [0, -1]]) {
        v.set(sx, sy, 0.5).unproject(cam).sub(o).normalize();
        let d = v.y < -0.05 ? (o.y - 1) / -v.y : 70; d = Math.min(d, 70);
        const x = o.x + v.x * d, z = o.z + v.z * d;
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z);
      }
      box = [x0 - 9, x1 + 4, z0 - 5, z1 + 9];          // sun from the left / front: casters there shade the view
    } catch (e) { /* no camera: draw everything */ }
    const key = box.map((b) => Math.round(b / 2)).join(',');
    for (const l of this.veg) l.cull(box, key);
  }
  dispose() {
    this.group.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    this.tex.dispose();
    this.ctx.scene.remove(this.group);
  }
}
