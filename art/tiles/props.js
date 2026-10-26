// game/art/tiles/props.js — big pixel prop sprites for the pixel-art world: trees (broadleaf / pine / bush), rocks,
// fences, lamp posts, signs, camp stones, reeds. Owner: pixel-world look-dev.
// Every prop is a Bitmap with a feet anchor (ax, ay) = the ground contact point used for y-sorting.
// Light from the upper-left; clusters shaded in 4–5 flat tones; inner lines between clumps; 1-px hue-tinted outline
// that lifts one tone on the sun side (selective outline), exactly like the unit sprites.

import { Bitmap, hash2, rng, mix } from './core.js';
import { PAL } from './palette.js';

const cache = new Map();
const memo = (k, fn) => { let v = cache.get(k); if (!v) { v = fn(); cache.set(k, v); } return v; };

/** selective outline: dark ink, one tone lighter on the upper-left (sun) side */
function selout(b, ink, lit) {
  const a = new Uint8Array(b.w * b.h); for (let i = 0; i < a.length; i++) a[i] = b.data[i * 4 + 3] > 0 ? 1 : 0;
  const at = (x, y) => (x < 0 || y < 0 || x >= b.w || y >= b.h ? 0 : a[y * b.w + x]);
  for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) {
    if (at(x, y)) continue;
    const r = at(x + 1, y), l = at(x - 1, y), d = at(x, y + 1), u = at(x, y - 1);
    if (!(r || l || d || u)) continue;
    b.set(x, y, (r || d) && !(l || u) ? lit : ink);
  }
  return b;
}

// ------------------------------------------------------------------------------------------------ trees
/**
 * Broadleaf tree: a canopy of overlapping leaf clumps (drawn back -> front, top -> bottom), each lit from the upper
 * left, with a dark inner line on the top edge of every front clump, scalloped leaf texture, a short trunk with roots.
 * size 1 = canopy ≈ 2.6 m wide (84 px), total ≈ 3.4 m tall.
 */
export function tree(variant = 0, size = 1, ramp = PAL.leaf) {
  return memo(`tree${variant}/${size}/${ramp[2]}`, () => {
    const R = ramp, B = PAL.bark, rnd = rng(1000 + variant * 77);
    const k = size, W = Math.round(96 * k) + 8, H = Math.round(116 * k) + 8;
    const cx = W / 2, cy = Math.round(54 * k) + 4, ay = H - 4;
    const b = new Bitmap(W, H, Math.round(cx), ay);
    const id = new Int16Array(W * H).fill(-1);
    // trunk first (canopy covers its top)
    const tw = Math.round(14 * k), tt = cy + Math.round(18 * k);
    for (let y = tt; y <= ay; y++) {
      const flare = y > ay - 5 ? (y - (ay - 5)) * 0.8 : 0;
      const hw = tw / 2 + flare;
      for (let x = Math.floor(cx - hw); x < Math.ceil(cx + hw); x++) {
        const u = (x + 0.5 - (cx - hw)) / (2 * hw);
        let c = u < 0.3 ? B[3] : u < 0.72 ? B[2] : B[1];
        if ((x * 7 + Math.floor(y / 5) * 3) % 9 === 0 && u > 0.2 && u < 0.85) c = B[1];
        if (y < tt + 6) c = B[1];                                   // under-canopy shade
        b.set(x, y, c);
      }
    }
    // clumps: [dx, dy, r] in px at k = 1, back (top) first
    const L = [
      [0, -30, 22], [-22, -18, 20], [22, -18, 20],
      [-8, -10, 24], [12, -8, 23], [-32, 2, 17], [32, 2, 17],
      [-18, 12, 20], [18, 12, 20], [0, 16, 20],
    ].map(([dx, dy, r], i) => [cx + dx * k + (rnd() - 0.5) * 3 * k, cy + dy * k + (rnd() - 0.5) * 3 * k, r * k * (0.92 + rnd() * 0.14), i]);
    for (const [lx, ly, r, i] of L) {
      for (let y = Math.floor(ly - r); y <= Math.ceil(ly + r); y++) for (let x = Math.floor(lx - r); x <= Math.ceil(lx + r); x++) {
        const u = (x + 0.5 - lx) / r, v = (y + 0.5 - ly) / r, q = u * u + v * v;
        if (q > 1 || x < 0 || y < 0 || x >= W || y >= H) continue;
        // per-clump light + global light (upper-left)
        const gl = -((x - cx) * 0.55 + (y - cy) * 0.85) / (48 * k);
        const d = -(u * 0.62 + v * 0.78) * 0.75 + gl * 0.55 - q * 0.18;
        let c = d > 0.42 ? R[4] : d > 0.08 ? R[3] : d > -0.3 ? R[2] : R[1];
        if (v > 0.72 && q > 0.75) c = R[1];
        b.set(x, y, c); id[y * W + x] = i;
      }
    }
    // inner lines: top edge of a front clump over a back clump
    const src = new Int16Array(id);
    for (let y = 1; y < H; y++) for (let x = 0; x < W; x++) {
      const i0 = src[y * W + x], up = src[(y - 1) * W + x];
      if (i0 < 0 || up < 0 || up === i0) continue;
      if (up < i0) { b.set(x, y, R[1]); if (y + 1 < H && src[(y + 1) * W + x] === i0 && b.get(x, y + 1)[1] !== R[1][1]) b.set(x, y + 1, (x - cx) < 4 * k ? R[4] : R[3]); }
    }
    // leaf scallops: tiny 3-px "u" marks in the lit tones; a few sparkle highlights
    for (let y = 2; y < cy + 34 * k; y += 5) for (let x = 2 + ((y / 5) & 1) * 3; x < W - 3; x += 6) {
      if (hash2(x, y, variant + 5) < 0.35) continue;
      const c = b.alpha(x, y) ? b.get(x, y) : null; if (!c) continue;
      const tone = R.findIndex((t) => t[0] === c[0] && t[1] === c[1] && t[2] === c[2]);
      if (tone < 2) continue;
      const mark = R[tone - 1];
      if (b.alpha(x - 1, y - 1) && b.alpha(x + 1, y - 1)) { b.set(x - 1, y - 1, mark); b.set(x, y, mark); b.set(x + 1, y - 1, mark); }
      if (tone === 4 && hash2(x, y, 9) < 0.25) b.set(x, y - 2, R[5]);
    }
    selout(b, R[0], mix(R[0], R[1], 0.6));
    return b;
  });
}

/** Pine / conifer: stacked jagged tiers, lit left, dark right, short trunk. size 1 ≈ 2 m wide, 3.6 m tall. */
export function pine(variant = 0, size = 1) {
  return memo(`pine${variant}/${size}`, () => {
    const R = PAL.pine, B = PAL.bark, k = size;
    const W = Math.round(70 * k) + 6, H = Math.round(122 * k) + 6, cx = W / 2, ay = H - 3;
    const b = new Bitmap(W, H, Math.round(cx), ay);
    const tw = Math.round(9 * k);
    for (let y = ay - Math.round(18 * k); y <= ay; y++) for (let x = Math.floor(cx - tw / 2); x < Math.ceil(cx + tw / 2); x++) { const u = (x + 0.5 - cx + tw / 2) / tw; b.set(x, y, u < 0.35 ? B[3] : u < 0.7 ? B[2] : B[1]); }
    const tiers = 4, top = 4, bot = ay - Math.round(14 * k);
    for (let t = 0; t < tiers; t++) {
      const y0 = top + (bot - top) * (t / (tiers + 0.6)), y1 = top + (bot - top) * ((t + 1.6) / (tiers + 0.6));
      const hw1 = (14 + t * 7.5) * k;
      for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
        const f = (y - y0) / (y1 - y0); if (f < 0 || f > 1) continue;
        const hw = 1 + hw1 * f;
        for (let x = Math.floor(cx - hw - 1); x <= Math.ceil(cx + hw + 1); x++) {
          const dx = x + 0.5 - cx;
          // jagged bottom edge: saw teeth every 6 px
          const tooth = ((Math.abs(dx) + 3) % 6) / 6;
          if (f > 0.86 && f > 1 - 0.14 * (1 - Math.abs(tooth - 0.5) * 2)) continue;
          if (Math.abs(dx) > hw) continue;
          const u = dx / hw;
          let c = u < -0.45 ? R[4] : u < 0.05 ? R[3] : u < 0.55 ? R[2] : R[1];
          if (f > 0.8) c = u < -0.3 ? R[2] : R[1];                       // tier underside shade
          if (f < 0.12 && u < 0.2) c = R[4];
          b.set(x, y, c);
        }
      }
      // inner line under each tier (over the next)
    }
    for (let y = 2; y < H; y += 6) for (let x = 2 + ((y / 6) & 1) * 3; x < W - 2; x += 6) if (b.alpha(x, y) && b.alpha(x, y - 2) && hash2(x, y, 31 + variant) < 0.5) { const c = b.get(x, y); if (c[1] === R[3][1] || c[1] === R[4][1]) b.set(x, y - 1, c[1] === R[4][1] ? R[5] : R[4]); }
    selout(b, R[0], R[1]);
    return b;
  });
}

/** round bush (≈1.2 m wide), optional berries/flowers */
export function bush(variant = 0, flowers = null) {
  return memo(`bush${variant}/${flowers ? flowers[2] : ''}`, () => {
    const R = variant & 1 ? PAL.leafB : PAL.leaf, rnd = rng(500 + variant);
    const W = 46, H = 34, b = new Bitmap(W, H, 23, 31);
    const L = [[15, 17, 11], [31, 17, 11], [23, 13, 12], [12, 23, 9], [34, 23, 9], [23, 22, 12]];
    const id = new Int16Array(W * H).fill(-1);
    L.forEach(([lx, ly, r], i) => {
      lx += (rnd() - 0.5) * 2; r *= 0.94 + rnd() * 0.12;
      b.ell(lx, ly, r, r * 0.86, (x, y, u, v) => { id[y * W + x] = i; const d = -(u * 0.6 + v * 0.8); return d > 0.4 ? R[4] : d > 0 ? R[3] : d > -0.45 ? R[2] : R[1]; });
    });
    for (let y = 1; y < H; y++) for (let x = 0; x < W; x++) { const a = id[y * W + x], u = id[(y - 1) * W + x]; if (a >= 0 && u >= 0 && u < a) b.set(x, y, R[1]); }
    if (flowers) for (let i = 0; i < 7; i++) { const x = 9 + Math.floor(rnd() * 28), y = 8 + Math.floor(rnd() * 16); if (b.alpha(x, y) && b.alpha(x + 1, y + 1)) { b.set(x, y, flowers[2]); b.set(x + 1, y, flowers[1]); b.set(x, y + 1, flowers[1]); b.set(x + 1, y + 1, flowers[0]); } }
    selout(b, R[0], R[1]);
    return b;
  });
}

// ------------------------------------------------------------------------------------------------ rocks
export function rock(variant = 0, size = 1, moss = false) {
  return memo(`rock${variant}/${size}/${moss}`, () => {
    const R = PAL.rock, M = PAL.grass, rnd = rng(900 + variant * 13);
    const rx = 11 * size, ry = 8 * size, W = Math.ceil(rx * 2) + 6, H = Math.ceil(ry * 2.2) + 6;
    const b = new Bitmap(W, H, Math.round(W / 2), H - 3);
    const cx = W / 2, cy = H - 3 - ry;
    const pts = []; const n = 9;
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, rr = 0.82 + rnd() * 0.22; pts.push([cx + Math.cos(a) * rx * rr, cy + Math.sin(a) * ry * rr * (Math.sin(a) < 0 ? 1.25 : 1)]); }
    b.poly(pts, (x, y) => {
      const u = (x + 0.5 - cx) / rx, v = (y + 0.5 - cy) / ry, d = -(u * 0.55 + v * 0.85);
      if (moss && v < -0.5 + Math.sin(x * 0.9) * 0.15) return d > 0.3 ? M[4] : M[3];
      return d > 0.55 ? R[4] : d > 0.12 ? R[3] : d > -0.35 ? R[2] : R[1];
    });
    // facet line
    for (let x = Math.round(cx - rx * 0.3); x < cx + rx * 0.5; x++) { const y = Math.round(cy + 1 + (x - cx) * 0.25); if (b.alpha(x, y) && b.alpha(x, y + 2)) b.set(x, y, R[1]); }
    selout(b, R[0], R[1]);
    return b;
  });
}

// ------------------------------------------------------------------------------------------------ man-made
/** horizontal wooden fence segment, `n` posts 16 px apart */
export function fence(n = 3) {
  return memo(`fence${n}`, () => {
    const W = PAL.wood, w = (n - 1) * 16 + 6, h = 22, b = new Bitmap(w + 2, h + 2, 1, h);
    for (let r of [6, 12]) for (let x = 1; x < w; x++) { b.set(x, r, W[3]); b.set(x, r + 1, W[2]); b.set(x, r + 2, W[1]); }
    for (let i = 0; i < n; i++) {
      const x0 = 1 + i * 16;
      for (let y = 2; y < h; y++) for (let x = x0; x < x0 + 4; x++) b.set(x, y, x === x0 ? W[4] : x === x0 + 3 ? W[1] : W[3]);
      b.set(x0 + 1, 1, W[3]); b.set(x0 + 2, 1, W[3]);
    }
    selout(b, W[0], W[1]);
    return b;
  });
}
export function fencePost() {
  return memo('post', () => { const W = PAL.wood, b = new Bitmap(8, 24, 4, 22); for (let y = 2; y < 22; y++) for (let x = 2; x < 6; x++) b.set(x, y, x === 2 ? W[4] : x === 5 ? W[1] : W[3]); b.set(3, 1, W[3]); b.set(4, 1, W[3]); selout(b, W[0], W[1]); return b; });
}

/** iron street lamp ≈ 2.3 m with a warm lantern */
export function lamp(team = 0) {
  return memo(`lamp${team}`, () => {
    const I = PAL.iron, L = PAL.lamp, T = team ? PAL.red : PAL.blue, b = new Bitmap(22, 80, 11, 77);
    // base plinth
    for (let y = 70; y < 78; y++) for (let x = 6; x < 16; x++) b.set(x, y, y < 72 ? I[3] : x < 8 ? I[3] : x > 13 ? I[1] : I[2]);
    // pole
    for (let y = 18; y < 70; y++) for (let x = 9; x < 13; x++) b.set(x, y, x === 9 ? I[4] : x === 12 ? I[1] : I[2]);
    for (const y of [40, 41, 62, 63]) for (let x = 8; x < 14; x++) b.set(x, y, y & 1 ? I[1] : I[3]);
    // lantern
    for (let y = 6; y < 18; y++) for (let x = 5; x < 17; x++) { const fr = x === 5 || x === 16 || y === 6 || y === 17; b.set(x, y, fr ? I[1] : y < 9 ? L[3] : x < 9 ? L[3] : x > 13 ? L[1] : L[2]); }
    for (let y = 7; y < 17; y++) b.set(11, y, I[2]);
    for (let x = 4; x < 18; x++) { b.set(x, 5, T[2]); b.set(x, 4, T[3]); }
    for (let x = 6; x < 16; x++) b.set(x, 3, T[2]); for (let x = 8; x < 14; x++) b.set(x, 2, T[1]); b.set(10, 1, PAL.gold[3]); b.set(11, 1, PAL.gold[2]);
    selout(b, I[0], I[1]);
    return b;
  });
}
const EL_GLYPH = {
  water: ['...x...', '..xxx..', '.xxxxx.', '.xhxxx.', 'xhxxxxx', 'xxxxxxx', 'xxxxxxx', '.xxxxx.', '..xxx..'],
  fire: ['..x....', '..xx...', '.xxx.x.', '.xxxxx.', 'xxhxxxx', 'xxhhxxx', 'xhhhhxx', '.xhhxx.', '..xxx..'],
  grass: ['....xxx', '..xxxxx', '.xxxhxx', 'xxxhxxx', 'xxhxxx.', 'xhxxx..', 'hxxx...', 'x......', 'x......'],
  electric: ['...xxx.', '..xxx..', '.xxx...', 'xxxxxx.', '..hxx..', '.xxx...', '.xx....', 'xx.....', 'x......'],
  earth: ['..xxx..', '.xxxxx.', 'xxhxxxx', 'xhxxxxx', 'xxxxxxx', 'xxxxxx.', '.xxxxx.', '.......', '.......'],
  wind: ['.xxxx..', 'x....x.', '..xx..x', '.x..x.x', '.x.xx.x', '.x....x', '..xxxx.', '.......', '.......'],
};
const EL_COL = { water: ['#2a64c8', '#bfe4ff'], fire: ['#e8501e', '#ffd25a'], grass: ['#3a9a3a', '#b8ec7a'], electric: ['#e0a810', '#fff6a0'], earth: ['#9a6a3a', '#e0c08a'], wind: ['#3aa8a0', '#c8fff4'] };
/** wooden signpost; el = habitat element (draws its glyph) */
export function sign(el = null) {
  return memo(`sign${el}`, () => {
    const W = PAL.wood, b = new Bitmap(30, 38, 15, 36);
    for (let y = 18; y < 37; y++) for (let x = 13; x < 17; x++) b.set(x, y, x === 13 ? W[4] : x === 16 ? W[1] : W[3]);
    for (let y = 3; y < 20; y++) for (let x = 2; x < 28; x++) b.set(x, y, y === 3 || y === 19 ? W[1] : y < 6 ? W[4] : x > 25 ? W[2] : W[3]);
    if (el && EL_GLYPH[el]) {
      const g = EL_GLYPH[el], [c0, c1] = EL_COL[el].map((h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
      // parchment plate
      for (let y = 6; y < 17; y++) for (let x = 9; x < 21; x++) b.set(x, y, y === 6 || x === 9 ? [255, 246, 214] : [240, 226, 186]);
      g.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '.') b.set(11 + i, 7 + j, ch === 'h' ? c1 : c0); }));
    } else for (let x = 4; x < 26; x += 7) for (let y = 7; y < 18; y += 5) b.set(x, y, W[2]);
    selout(b, W[0], W[1]);
    return b;
  });
}
/** team banner on an iron pole (≈ 2.7 m) */
export function banner(team = 0) {
  return memo(`banner${team}`, () => {
    const I = PAL.iron, G = PAL.gold, T = team ? PAL.red : PAL.blue, b = new Bitmap(26, 92, 6, 89);
    for (let y = 6; y < 88; y++) for (let x = 5; x < 8; x++) b.set(x, y, x === 5 ? I[4] : x === 7 ? I[1] : I[2]);
    for (let x = 3; x < 10; x++) { b.set(x, 87, I[2]); b.set(x, 88, I[1]); }
    b.set(6, 3, G[4]); b.set(5, 4, G[3]); b.set(6, 4, G[3]); b.set(7, 4, G[2]); b.set(6, 5, G[2]);
    for (let x = 4; x < 24; x++) { b.set(x, 9, G[3]); b.set(x, 10, G[1]); }
    // pennant with a swallowtail and a gold diamond
    for (let y = 11; y < 46; y++) for (let x = 9; x < 23; x++) {
      const tail = y > 38 && Math.abs(x - 15.5) < (y - 38) * 0.9; if (tail) continue;
      let c = x < 11 ? T[4] : x > 20 ? T[1] : T[2];
      if (y === 11) c = T[1];
      b.set(x, y, c);
    }
    for (let j = -4; j <= 4; j++) for (let i = -4 + Math.abs(j); i <= 4 - Math.abs(j); i++) b.set(16 + i, 24 + j, Math.abs(i) + Math.abs(j) === 4 ? G[1] : i + j < 0 ? G[4] : G[3]);
    for (let y = 12; y < 38; y += 2) b.set(10, y, T[5]);
    selout(b, mix(T[0], [16, 18, 34], 0.4), I[2]);
    return b;
  });
}
/** flat flower bed planter (≈ 2 × 1 m) */
export function planter(variantFlowers = 0) {
  return memo(`planter${variantFlowers}`, () => {
    const S = PAL.stone, Fs = [PAL.flowerR, PAL.flowerY, PAL.flowerW, PAL.flowerK], G = PAL.leaf, W = 66, H = 38, b = new Bitmap(W, H, 33, 35), rnd = rng(77 + variantFlowers);
    for (let y = 10; y < 36; y++) for (let x = 2; x < 64; x++) { const face = y >= 26; b.set(x, y, face ? (y === 26 ? S[4] : x < 4 ? S[3] : y > 33 ? S[1] : S[2]) : (x < 5 || x > 60 || y < 13) ? S[3] : (y === 13 ? G[1] : G[2])); }
    for (let i = 0; i < 26; i++) { const x = 7 + Math.floor(rnd() * 52), y = 8 + Math.floor(rnd() * 15), F = Fs[(variantFlowers + (i % 2)) % Fs.length];
      b.set(x, y + 2, G[3]); b.set(x, y + 3, G[1]); b.set(x - 1, y, F[1]); b.set(x + 1, y, F[1]); b.set(x, y - 1, F[2]); b.set(x, y + 1, F[1]); b.set(x, y, PAL.flowerY[3]); }
    selout(b, S[0], S[1]);
    return b;
  });
}
/** stepping stone / camp ring stone */
export function stone(variant = 0) {
  return memo(`stone${variant}`, () => {
    const R = PAL.rock, b = new Bitmap(16, 12, 8, 10);
    b.ell(8, 7, 6 + (variant & 1), 4, (x, y, u, v) => { const d = -(u * 0.5 + v * 0.85); return d > 0.4 ? R[4] : d > -0.1 ? R[3] : R[2]; });
    selout(b, R[0], R[1]); return b;
  });
}
/** reed clump at a shore */
export function reeds(variant = 0) {
  return memo(`reeds${variant}`, () => {
    const G = PAL.tall, Bk = PAL.bark, b = new Bitmap(22, 34, 11, 32), rnd = rng(300 + variant);
    for (let i = 0; i < 6; i++) {
      const x0 = 4 + i * 3 + Math.floor(rnd() * 2), h = 16 + Math.floor(rnd() * 12), lean = (rnd() - 0.5) * 6;
      for (let t = 0; t < h; t++) { const x = Math.round(x0 + lean * (t / h) ** 2); b.set(x, 32 - t, t > h - 3 ? G[5] : x0 < 11 ? G[4] : G[3]); }
      if (i % 2 === 0) { const x = Math.round(x0 + lean * 0.8); for (let t = 0; t < 5; t++) { b.set(x, 32 - h + 2 + t, Bk[2]); b.set(x + 1, 32 - h + 2 + t, Bk[1]); } }
    }
    selout(b, G[0], G[1]); return b;
  });
}
/** lily pad decal (ground layer, on water) */
export function lily(variant = 0) {
  return memo(`lily${variant}`, () => {
    const G = PAL.leaf, b = new Bitmap(18, 12, 9, 6);
    b.ell(9, 6, 7, 4.2, (x, y, u, v) => (u > 0.05 && Math.abs(v) < 0.25 && u < 1 ? null : (-(u * 0.5 + v * 0.8) > 0.2 ? G[4] : G[3])));
    if (variant & 1) { b.set(7, 4, PAL.flowerK[2]); b.set(8, 4, PAL.flowerK[3]); b.set(7, 3, PAL.flowerK[3]); b.set(8, 5, PAL.flowerK[1]); }
    selout(b, G[1], G[2]); return b;
  });
}
export function stump() {
  return memo('stump', () => {
    const B = PAL.bark, b = new Bitmap(24, 20, 12, 18);
    for (let y = 7; y < 18; y++) for (let x = 4; x < 20; x++) b.set(x, y, x < 7 ? B[3] : x > 16 ? B[1] : B[2]);
    b.ell(12, 7, 8, 3.5, (x, y, u, v) => (u * u + v * v < 0.35 ? PAL.wood[4] : PAL.wood[3]));
    selout(b, B[0], B[1]); return b;
  });
}

/** fence span between two posts (dx, dy px from the first post's base); fields ox/oy = first post base in the bitmap */
export function fenceSpan(dx, dy) {
  return memo(`fspan${dx}/${dy}`, () => {
    const W = PAL.wood, pad = 4, H0 = 20;
    const minx = Math.min(0, dx) - pad, miny = Math.min(0, dy) - H0 - pad, maxx = Math.max(0, dx) + pad + 3, maxy = Math.max(0, dy) + pad;
    const b = new Bitmap(maxx - minx + 1, maxy - miny + 1);
    const ox = -minx, oy = -miny;
    // rails (behind posts)
    for (const h of [7, 13]) {
      const n = Math.max(Math.abs(dx), Math.abs(dy), 1);
      for (let i = 0; i <= n; i++) { const x = Math.round(ox + 2 + dx * i / n), y = Math.round(oy - h + dy * i / n); b.set(x, y - 1, W[4]); b.set(x, y, W[3]); b.set(x, y + 1, W[1]); }
    }
    for (const [px, py] of [[ox, oy], [ox + dx, oy + dy]]) for (let y = py - H0; y < py; y++) for (let x = px; x < px + 4; x++) b.set(x, y, y === py - H0 ? W[4] : x === px ? W[4] : x === px + 3 ? W[1] : W[3]);
    selout(b, W[0], W[1]);
    b.ox = ox; b.oy = oy;
    if (dy > 0) { b.ax = ox + dx + 2; b.ay = oy + dy; } else { b.ax = ox + 2; b.ay = oy; }
    return b;
  });
}
