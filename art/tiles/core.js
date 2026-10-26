// game/art/tiles/core.js — pure-JS pixel helpers for the procedural pixel-art world (no canvas, Node + browser).
// Bitmap = { w, h, data: Uint8ClampedArray RGBA } with an optional feet anchor (ax, ay). Colours are [r, g, b] arrays.

export const hex = (h) => { const n = parseInt(h.replace('#', ''), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
export const mix = (a, b, t) => [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)];
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const smooth = (t) => t * t * (3 - 2 * t);

/** shade a colour into shadow: darker, cooler (hue-shifted toward blue-violet) — pixel-art shadow, never grey */
export const shadeCol = (c, k = 1) => mix(c, [c[0] * 0.56 + 6, c[1] * 0.62 + 10, c[2] * 0.78 + 30], k);
/** warm sunlit lift */
export const lightCol = (c, k = 1) => mix(c, [Math.min(255, c[0] * 1.12 + 20), Math.min(255, c[1] * 1.1 + 16), Math.min(255, c[2] * 1.02 + 4)], k);

// ------------------------------------------------------------------------------------------------ hashing / noise
export function hash2(x, y, s = 0) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
const fade = (t) => t * t * (3 - 2 * t);
/** value noise, lattice step `cell` px, optional period (px, multiple of cell) for tileable textures */
export function vnoise(x, y, cell, seed = 0, period = 0) {
  const fx = x / cell, fy = y / cell, ix = Math.floor(fx), iy = Math.floor(fy), tx = fade(fx - ix), ty = fade(fy - iy);
  const P = period ? period / cell : 0;
  const w = (i) => (P ? ((i % P) + P) % P : i);
  const a = hash2(w(ix), w(iy), seed), b = hash2(w(ix + 1), w(iy), seed), c = hash2(w(ix), w(iy + 1), seed), d = hash2(w(ix + 1), w(iy + 1), seed);
  return (a + (b - a) * tx) + ((c + (d - c) * tx) - (a + (b - a) * tx)) * ty;
}
export function fbm(x, y, cell, seed = 0, oct = 3, period = 0) {
  let s = 0, a = 1, n = 0;
  for (let o = 0; o < oct; o++) { s += vnoise(x, y, cell, seed + o * 17, period) * a; n += a; a *= 0.5; cell /= 2; if (cell < 1) break; }
  return s / n;
}
/** deterministic PRNG (render-only) */
export function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

// ------------------------------------------------------------------------------------------------ bitmap
export class Bitmap {
  constructor(w, h, ax = 0, ay = 0) { this.w = w; this.h = h; this.data = new Uint8ClampedArray(w * h * 4); this.ax = ax; this.ay = ay; }
  inside(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  set(x, y, c, a = 255) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= this.w || y >= this.h) return; const i = (y * this.w + x) * 4; this.data[i] = c[0]; this.data[i + 1] = c[1]; this.data[i + 2] = c[2]; this.data[i + 3] = a; }
  alpha(x, y) { return x < 0 || y < 0 || x >= this.w || y >= this.h ? 0 : this.data[(y * this.w + x) * 4 + 3]; }
  get(x, y) { const i = (y * this.w + x) * 4; return [this.data[i], this.data[i + 1], this.data[i + 2]]; }
  fill(c) { for (let i = 0; i < this.w * this.h; i++) { this.data[i * 4] = c[0]; this.data[i * 4 + 1] = c[1]; this.data[i * 4 + 2] = c[2]; this.data[i * 4 + 3] = 255; } return this; }
  rect(x, y, w, h, c) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, c); return this; }
  /** filled ellipse (pixel centres) — fn(x, y, u, v) may return a colour or null */
  ell(cx, cy, rx, ry, c) {
    for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
      const u = (x + 0.5 - cx) / rx, v = (y + 0.5 - cy) / ry; if (u * u + v * v > 1) continue;
      const col = typeof c === 'function' ? c(x, y, u, v) : c; if (col) this.set(x, y, col);
    }
    return this;
  }
  poly(pts, c) {
    let y0 = 1e9, y1 = -1e9, x0 = 1e9, x1 = -1e9; for (const [px, py] of pts) { y0 = Math.min(y0, py); y1 = Math.max(y1, py); x0 = Math.min(x0, px); x1 = Math.max(x1, px); }
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) for (let x = Math.floor(x0); x <= Math.ceil(x1); x++) {
      const px = x + 0.5, py = y + 0.5; let ins = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) ins = !ins; }
      if (ins) { const col = typeof c === 'function' ? c(x, y) : c; if (col) this.set(x, y, col); }
    }
    return this;
  }
  line(x0, y0, x1, y1, c) { const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)))); for (let i = 0; i <= n; i++) this.set(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), c); return this; }
  /** 1-px outline around opaque pixels (4-neighbour) in colour `c` (or fn(x,y) per pixel) */
  outline(c, diag = false) {
    const a = new Uint8Array(this.w * this.h); for (let i = 0; i < a.length; i++) a[i] = this.data[i * 4 + 3] > 0 ? 1 : 0;
    const at = (x, y) => (x < 0 || y < 0 || x >= this.w || y >= this.h ? 0 : a[y * this.w + x]);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (at(x, y)) continue;
      let n = at(x + 1, y) || at(x - 1, y) || at(x, y + 1) || at(x, y - 1);
      if (!n && diag) n = at(x + 1, y + 1) || at(x - 1, y - 1) || at(x - 1, y + 1) || at(x + 1, y - 1);
      if (n) this.set(x, y, typeof c === 'function' ? c(x, y) : c);
    }
    return this;
  }
  /** replace every opaque pixel touching transparency with an outline tone derived from itself (selective outline) */
  innerOutline(fn) {
    const a = new Uint8Array(this.w * this.h); for (let i = 0; i < a.length; i++) a[i] = this.data[i * 4 + 3] > 0 ? 1 : 0;
    const at = (x, y) => (x < 0 || y < 0 || x >= this.w || y >= this.h ? 0 : a[y * this.w + x]);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (at(x, y) && !(at(x + 1, y) && at(x - 1, y) && at(x, y + 1) && at(x, y - 1))) this.set(x, y, fn(this.get(x, y), x, y));
    return this;
  }
  /** alpha-blit `src` with its top-left at (dx, dy); flip mirrors horizontally; mask(x,y)->false skips a dest pixel */
  blit(src, dx, dy, o = {}) {
    dx = Math.round(dx); dy = Math.round(dy);
    for (let y = 0; y < src.h; y++) {
      const Y = dy + y; if (Y < 0 || Y >= this.h) continue;
      if (o.rows && (y < o.rows[0] || y >= o.rows[1])) continue;
      for (let x = 0; x < src.w; x++) {
        const X = dx + x; if (X < 0 || X >= this.w) continue;
        const sx = o.flip ? src.w - 1 - x : x, si = (y * src.w + sx) * 4, a = src.data[si + 3];
        if (a < 128) continue;
        const di = (Y * this.w + X) * 4;
        let r = src.data[si], g = src.data[si + 1], b = src.data[si + 2];
        if (o.tint) { const t = o.tint; r += (t[0] - r) * t[3]; g += (t[1] - g) * t[3]; b += (t[2] - b) * t[3]; }
        if (o.op != null && o.op < 1) { r = this.data[di] + (r - this.data[di]) * o.op; g = this.data[di + 1] + (g - this.data[di + 1]) * o.op; b = this.data[di + 2] + (b - this.data[di + 2]) * o.op; }
        this.data[di] = r; this.data[di + 1] = g; this.data[di + 2] = b; this.data[di + 3] = 255;
      }
    }
    return this;
  }
  /** integer upscale */
  scale(k) {
    const o = new Bitmap(this.w * k, this.h * k, this.ax * k, this.ay * k);
    for (let y = 0; y < o.h; y++) { const sy = (y / k) | 0; for (let x = 0; x < o.w; x++) { const si = (sy * this.w + ((x / k) | 0)) * 4, di = (y * o.w + x) * 4; o.data[di] = this.data[si]; o.data[di + 1] = this.data[si + 1]; o.data[di + 2] = this.data[si + 2]; o.data[di + 3] = this.data[si + 3]; } }
    return o;
  }
  crop(x0, y0, w, h) { const o = new Bitmap(w, h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const X = x + x0, Y = y + y0; if (!this.inside(X, Y)) continue; const si = (Y * this.w + X) * 4, di = (y * w + x) * 4; for (let k = 0; k < 4; k++) o.data[di + k] = this.data[si + k]; } return o; }
}

/** wrap {w,h,data,ax,ay} from the sprite library */
export const fromRGBA = (b) => { const o = new Bitmap(b.w, b.h, b.ax ?? b.anchorX ?? b.w / 2, b.ay ?? b.anchorY ?? b.h); o.data.set(b.data); return o; };
