// mt/render/fx-atlas.js — procedural PIXEL-ART effect glyphs (Gen-5 battle-effect style) + element palettes.
// Owner: VFX specialist. Pure data/canvas-free: produces an index-coded RGBA8 atlas (R = palette index × 40,
// A = coverage) that fx-gfx.js colours per particle through a palette texture, so one glyph serves every element.
//
// Palette index per pixel: 0 empty · 1 outline · 2 dark · 3 mid · 4 light · 5 hot (white-ish highlight).
// Glyphs live on a 16-px grid (some span 32 px). GLYPH[name] = { frames: [[u0, v0, du, dv, wPx, hPx], ...] }.

export const ATLAS_W = 256, ATLAS_H = 256;

class Pix {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Uint8Array(w * h); }
  get(x, y) { return x < 0 || y < 0 || x >= this.w || y >= this.h ? 0 : this.d[y * this.w + x]; }
  set(x, y, v) { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.d[y * this.w + x] = v; }
  each(fn) { for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) fn(x, y, x + 0.5, y + 0.5); }
  disk(cx, cy, r, v) { this.each((x, y, px, py) => { if ((px - cx) ** 2 + (py - cy) ** 2 <= r * r) this.set(x, y, v); }); return this; }
  ell(cx, cy, rx, ry, v, rot = 0) {
    const c = Math.cos(rot), s = Math.sin(rot);
    this.each((x, y, px, py) => { const dx = px - cx, dy = py - cy, u = (dx * c + dy * s) / rx, w = (-dx * s + dy * c) / ry; if (u * u + w * w <= 1) this.set(x, y, v); });
    return this;
  }
  ring(cx, cy, r0, r1, v) { this.each((x, y, px, py) => { const d = Math.hypot(px - cx, py - cy); if (d >= r0 && d <= r1) this.set(x, y, v); }); return this; }
  line(x0, y0, x1, y1, v, th = 1) {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2));
    for (let i = 0; i <= n; i++) {
      const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n;
      if (th <= 1) this.set(Math.floor(x), Math.floor(y), v); else this.dot(x, y, th / 2, v);
    }
    return this;
  }
  dot(cx, cy, r, v) { for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) this.set(x, y, v); return this; }
  poly(pts, v) {
    this.each((x, y, px, py) => {
      let inside = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i], [xj, yj] = pts[j];
        if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
      }
      if (inside) this.set(x, y, v);
    });
    return this;
  }
  /** Shade filled pixels (value `only` or any ≥2) by a light direction: light → 4, shadow → 2, keeps 5. */
  shade(cx, cy, r, lx = -0.62, ly = -0.78, hi = 0.35, lo = -0.25) {
    this.each((x, y, px, py) => {
      const v = this.get(x, y); if (v < 2 || v === 5) return;
      const d = ((px - cx) * lx + (py - cy) * ly) / r;
      this.set(x, y, d > hi ? 4 : d < lo ? 2 : 3);
    });
    return this;
  }
  /** 1-px outline (index 1) around everything that is ≥2 (4-neighbour), optionally 8-neighbour. */
  outline(diag = false) {
    const src = this.d.slice();
    const at = (x, y) => (x < 0 || y < 0 || x >= this.w || y >= this.h ? 0 : src[y * this.w + x]);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (at(x, y)) continue;
      let n = at(x + 1, y) >= 2 || at(x - 1, y) >= 2 || at(x, y + 1) >= 2 || at(x, y - 1) >= 2;
      if (!n && diag) n = at(x + 1, y + 1) >= 2 || at(x - 1, y - 1) >= 2 || at(x - 1, y + 1) >= 2 || at(x + 1, y - 1) >= 2;
      if (n) this.d[y * this.w + x] = 1;
    }
    return this;
  }
  /** Clear pixels by a predicate (holes / erosion). */
  cut(fn) { this.each((x, y, px, py) => { if (this.get(x, y) && fn(px, py, x, y)) this.set(x, y, 0); }); return this; }
}

const TAU = Math.PI * 2;
const hash = (a, b = 0) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

// ------------------------------------------------------------------------------------------- glyph painters
// Each painter: (p: Pix, frame: number, frames: number) -> void. Sizes are px.
const PAINT = {
  /** 4-point twinkle sparkle (no outline, bright). frames: grow -> peak -> shrink */
  twinkle: [16, 16, 4, (p, f) => {
    const L = [2, 4, 7, 3][f], c = 7.5;
    for (let i = -L; i <= L; i++) { const v = Math.abs(i) <= 1 ? 5 : Math.abs(i) <= L * 0.5 ? 4 : 3; p.set(c + i, c, v); p.set(c, c + i, v); }
    if (f >= 1) { p.set(c - 1, c - 1, 4); p.set(c + 1, c + 1, 4); p.set(c - 1, c + 1, 4); p.set(c + 1, c - 1, 4); }
    if (f === 2) { p.set(c - 2, c - 2, 3); p.set(c + 2, c + 2, 3); p.set(c - 2, c + 2, 3); p.set(c + 2, c - 2, 3); }
    p.set(c, c, 5);
  }],
  /** chunky 5-point star with outline */
  star: [16, 16, 1, (p) => { p.poly(starPts(8, 8.4, 7.2, 3.1), 3); p.shade(8, 8, 7); p.set(7, 6, 5); p.set(6, 7, 5); p.outline(); }],
  starBig: [32, 32, 1, (p) => { p.poly(starPts(16, 16.8, 14.6, 6.4), 3); p.shade(16, 16, 14); p.dot(12.5, 12.5, 1.6, 5); p.outline(); }],
  /** small round dot / chip */
  dot: [8, 8, 2, (p, f) => { if (f === 0) { p.disk(4, 4, 2.6, 3); p.set(3, 3, 5); p.set(4, 3, 4); p.set(3, 4, 4); } else { p.disk(4, 4, 1.6, 5); } }],
  /** confetti chip (rotating: 3 frames) */
  chip: [8, 8, 3, (p, f) => { if (f === 0) { p.poly([[1, 2], [7, 2], [7, 6], [1, 6]], 3); p.line(1, 2, 7, 2, 4); } else if (f === 1) { p.poly([[2, 1], [6, 1], [6, 7], [2, 7]], 2); } else { p.poly([[3, 1], [5, 1], [5, 7], [3, 7]], 4); } p.outline(); }],
  /** flame tongue, 4-frame flicker (outlined) */
  ember: [16, 16, 4, (p, f) => {
    const sway = [0, 1, 0, -1][f], top = [2, 1, 3, 2][f];
    p.ell(8, 11, 4.6, 4.2, 2);
    p.poly([[3.6, 11], [12.4, 11], [8 + sway * 1.6, top]], 2);
    p.ell(8, 11.6, 3.1, 2.9, 3); p.poly([[5.2, 11.4], [10.8, 11.4], [8 + sway, top + 3.5]], 3);
    p.ell(8, 12.2, 1.7, 1.7, 4); p.set(8, 12, 5); p.set(8 + sway, 9, 4);
    p.outline();
  }],
  /** big flame column piece 32×32, 4 frames */
  flame: [32, 32, 4, (p, f) => {
    const s = [0, 1.5, 0, -1.5][f], h = [3, 1, 4, 2][f];
    p.ell(16, 23, 9.5, 7.5, 2); p.poly([[6.6, 22], [25.4, 22], [16 + s * 2, h]], 2);
    p.poly([[9, 21], [12, 21], [9.5 + s, 9 + f]], 2); p.poly([[20, 21], [23, 21], [22.5 + s, 10 - f]], 2);
    p.ell(16, 24, 6.6, 5.4, 3); p.poly([[9.6, 23], [22.4, 23], [16 + s * 1.4, h + 6]], 3);
    p.ell(16, 25, 3.8, 3.4, 4); p.poly([[12.4, 24.5], [19.6, 24.5], [16 + s, h + 12]], 4);
    p.ell(16, 25.5, 1.8, 1.8, 5);
    p.outline();
  }],
  /** fireball (head at +x), 2 frames */
  fireball: [16, 16, 2, (p, f) => {
    p.poly([[1, 8 + (f ? -1 : 1)], [8, 4], [8, 12]], 2); p.poly([[3, 4 + f], [8, 6], [7, 8]], 2); p.poly([[3, 12 - f], [8, 10], [7, 8]], 2);
    p.disk(10, 8, 4.6, 2); p.disk(10.6, 8, 3.4, 3); p.disk(11.2, 8, 2, 4); p.set(11, 7, 5); p.set(12, 7, 5);
    p.outline();
  }],
  /** soap bubble (hollow), with shine */
  bubble: [16, 16, 2, (p, f) => {
    if (f === 0) { p.ring(8, 8, 5.2, 6.6, 3); p.ring(8, 8, 4.4, 5.2, 4); p.cut((x, y) => (x - 8) * 0.7 + (y - 8) * 0.7 < -1 && Math.hypot(x - 8, y - 8) < 5.2); p.set(5, 5, 5); p.set(6, 5, 5); p.set(5, 6, 5); p.set(10, 11, 4); p.outline(); }
    else { for (let i = 0; i < 8; i++) { const a = i * TAU / 8; p.dot(8 + Math.cos(a) * 5.6, 8 + Math.sin(a) * 5.6, 1.1, i % 2 ? 4 : 3); } }
  }],
  /** water droplet (point up) */
  drop: [16, 16, 1, (p) => { p.disk(8, 10, 3.8, 3); p.poly([[4.6, 9.6], [11.4, 9.6], [8, 2.5]], 3); p.shade(8, 9, 4.5); p.set(6, 9, 5); p.set(6, 8, 5); p.outline(); }],
  /** splash crown 32×32, 3 frames */
  splash: [32, 32, 3, (p, f) => {
    const r = [6, 10, 13][f], hgt = [7, 11, 9][f];
    p.ell(16, 26, r + 2, 3.2, 2); p.ell(16, 26, r, 2, 3);
    if (f < 2) p.ell(16, 26, Math.max(1, r - 4), 1.2, 0);
    for (let i = 0; i < 5; i++) {
      const x = 16 + (i - 2) * (r * 0.42), top = 26 - hgt * (1 - Math.abs(i - 2) * 0.22);
      p.line(x, 25, x + (i - 2) * 1.3, top, i === 2 ? 4 : 3, 2.4);
      p.dot(x + (i - 2) * 1.8, top - 2 - f, 1.5, 4);
    }
    if (f === 2) p.cut((x, y) => y > 18 && y < 24 && hash(x | 0, y | 0) > 0.55);
    p.outline();
  }],
  /** leaf, 4 rotation frames */
  leaf: [16, 16, 4, (p, f) => {
    const a = f * Math.PI / 4 + 0.4, c = Math.cos(a), s = Math.sin(a);
    p.each((x, y, px, py) => { const u = ((px - 8) * c + (py - 8) * s) / 6.6, w = -(px - 8) * s + (py - 8) * c; if (Math.abs(u) <= 1 && Math.abs(w) <= 3.3 * Math.pow(1 - u * u, 0.75)) p.set(x, y, 3); });
    p.each((x, y, px, py) => { const v = p.get(x, y); if (!v) return; const w = -(px - 8) * s + (py - 8) * c; if (w < -1.2) p.set(x, y, 4); else if (w > 1.4) p.set(x, y, 2); });
    p.line(8 - c * 5.6, 8 - s * 5.6, 8 + c * 5.6, 8 + s * 5.6, 2);
    p.set(8 - c * 7, 8 - s * 7, 2);
    p.outline();
  }],
  /** petal / pollen mote (tiny, 2 frames) */
  petal: [8, 8, 2, (p, f) => { if (f) p.ell(4, 4, 2.6, 1.5, 3, 0.6); else p.ell(4, 4, 1.5, 2.6, 3, 0.3); p.set(3, 3, 4); p.outline(); }],
  /** vine segment along +x, thorny */
  vine: [16, 16, 2, (p, f) => {
    for (let x = 0; x < 16; x++) { const y = 8 + Math.sin((x + f * 4) * TAU / 16) * 2; p.dot(x + 0.5, y, 1.9, 3); p.set(x, Math.round(y) - 1, 4); }
    const t = f ? 4 : 11; p.poly([[t - 2, 8], [t + 2, 8], [t + 1, 2]], 2); p.poly([[t + 3, 9], [t + 6, 9], [t + 6, 14]], 2);
    p.outline();
  }],
  /** thorn spike, point up */
  thorn: [16, 16, 1, (p) => { p.poly([[4, 15], [12, 15], [8.6, 1.5]], 3); p.each((x, y, px) => { if (p.get(x, y) && px < 7.6) p.set(x, y, 4); if (p.get(x, y) && px > 10) p.set(x, y, 2); }); p.outline(); }],
  /** lightning bolt 32×32 (3 variants), long along +x */
  bolt: [32, 32, 3, (p, f) => {
    const pts = [[1, 16]]; let y = 16;
    for (let i = 1; i <= 7; i++) { y = 16 + (hash(i, f + 7) - 0.5) * 18; pts.push([1 + i * 4.3, y]); }
    pts[pts.length - 1][1] = 16;
    for (let i = 1; i < pts.length; i++) p.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], 3, 3.4);
    for (let i = 1; i < pts.length; i++) p.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], 5, 1.2);
    p.outline(true);
  }],
  /** small crackle spark, 3 frames */
  zap: [16, 16, 3, (p, f) => {
    const n = 3 + f;
    for (let i = 0; i < n; i++) {
      const a = hash(i, f) * TAU, L = 3 + hash(i, f + 3) * 4, mx = 8 + Math.cos(a + 0.5) * L * 0.5, my = 8 + Math.sin(a + 0.5) * L * 0.5;
      p.line(8, 8, mx, my, 4, 1); p.line(mx, my, 8 + Math.cos(a) * L, 8 + Math.sin(a) * L, 3, 1);
    }
    p.set(8, 8, 5); p.set(7, 8, 5); p.set(8, 7, 5);
    p.outline();
  }],
  /** rock chunk, 3 variants */
  rock: [16, 16, 3, (p, f) => {
    const n = 7, pts = [];
    for (let i = 0; i < n; i++) { const a = i * TAU / n + f; const r = 4.2 + hash(i, f + 11) * 2.6; pts.push([8 + Math.cos(a) * r, 8.5 + Math.sin(a) * r * 0.85]); }
    p.poly(pts, 3); p.shade(8, 8, 6, -0.5, -0.86, 0.3, -0.2);
    p.line(8 + (f - 1) * 2, 5, 8 + f, 10, 2);
    p.outline(true);
  }],
  /** pebble 8×8, 2 variants */
  pebble: [8, 8, 2, (p, f) => { p.ell(4, 4.4, f ? 2.8 : 2.2, f ? 2 : 2.6, 3); p.shade(4, 4, 3); p.outline(); }],
  /** dust puff, 4 frames dissipating (outlined early frames) */
  puff: [16, 16, 4, (p, f) => {
    const r = [3.2, 4.4, 5.4, 6][f];
    p.disk(8, 9, r, 3); p.disk(8 - r * 0.6, 10, r * 0.7, 3); p.disk(8 + r * 0.6, 10, r * 0.7, 3); p.disk(8, 8 - r * 0.3, r * 0.75, 3);
    p.shade(8, 8, r + 1.5);
    if (f >= 2) p.cut((x, y, ix, iy) => hash(ix, iy + f * 31) < (f === 2 ? 0.2 : 0.5));
    if (f <= 1) p.outline();
  }],
  puffBig: [32, 32, 4, (p, f) => {
    const r = [7, 9.5, 11.5, 12.5][f];
    p.disk(16, 18, r, 3); p.disk(16 - r * 0.62, 20, r * 0.66, 3); p.disk(16 + r * 0.62, 20, r * 0.66, 3); p.disk(16 + r * 0.2, 15 - r * 0.25, r * 0.7, 3);
    p.shade(16, 17, r + 3);
    if (f >= 2) p.cut((x, y, ix, iy) => hash(ix >> 1, (iy >> 1) + f * 17) < (f === 2 ? 0.22 : 0.55));
    if (f <= 1) p.outline();
  }],
  /** wind swirl arc 32×32, 4 rotation frames */
  swirl: [32, 32, 4, (p, f) => {
    const a0 = f * Math.PI / 2;
    for (let i = 0; i <= 60; i++) { const t = i / 60, a = a0 + t * TAU * 0.8, r = 4 + t * 10; p.dot(16 + Math.cos(a) * r, 16 + Math.sin(a) * r * 0.8, 0.6 + t * 1.6, t > 0.5 ? 4 : 3); }
    for (let i = 0; i <= 30; i++) { const t = i / 30, a = a0 + Math.PI + t * TAU * 0.45, r = 8 + t * 5; p.dot(16 + Math.cos(a) * r, 16 + Math.sin(a) * r * 0.8, 0.5 + t, 4); }
    p.outline();
  }],
  /** speed streak along +x */
  streak: [16, 16, 1, (p) => { p.line(1, 8, 15, 8, 4, 1); p.line(4, 8, 13, 8, 5, 1); p.line(6, 7, 12, 7, 3, 1); p.line(6, 9, 12, 9, 3, 1); }],
  /** slash crescent (opening to +x), 32×32 */
  crescent: [32, 32, 1, (p) => {
    p.each((x, y, px, py) => { const d1 = Math.hypot(px - 13, py - 16), d2 = Math.hypot(px - 8, py - 16); if (d1 < 14 && d2 > 13.4 && px > 8) p.set(x, y, d1 > 12.2 ? 5 : d2 < 15 ? 3 : 4); });
    p.outline();
  }],
  /** thin ring 32×32 (for ground pulses / halos), 2 variants: thin, thick */
  ring: [32, 32, 2, (p, f) => { if (f) { p.ring(16, 16, 11.5, 15.4, 3); p.ring(16, 16, 12.6, 14.2, 4); } else { p.ring(16, 16, 13.6, 15.4, 4); p.ring(16, 16, 14.1, 14.9, 5); } }],
  /** impact starburst 32×32, 3 frames */
  burst: [32, 32, 3, (p, f) => {
    const n = 8, R = [9, 15, 15.5][f], r = [4, 6, 9][f];
    const pts = []; for (let i = 0; i < n * 2; i++) { const a = i * Math.PI / n + 0.2, rr = i % 2 ? r : R * (0.75 + hash(i, 5) * 0.25); pts.push([16 + Math.cos(a) * rr, 16 + Math.sin(a) * rr]); }
    p.poly(pts, 4); p.disk(16, 16, r * 0.9, 5);
    if (f === 2) p.disk(16, 16, r * 0.95, 0);
    p.each((x, y, px, py) => { if (p.get(x, y) === 4 && Math.hypot(px - 16, py - 16) > R * 0.62) p.set(x, y, 3); });
    p.outline(true);
  }],
  /** stat-up chevron */
  chevron: [16, 16, 1, (p) => { p.poly([[2, 11], [8, 4], [14, 11], [14, 14], [8, 8], [2, 14]], 3); p.line(3, 11, 8, 5, 4); p.set(8, 5, 5); p.outline(); }],
  /** plus (heal) */
  plus: [16, 16, 1, (p) => { p.poly([[6, 2], [10, 2], [10, 6], [14, 6], [14, 10], [10, 10], [10, 14], [6, 14], [6, 10], [2, 10], [2, 6], [6, 6]], 3); p.line(6, 3, 6, 7, 4); p.line(3, 6, 6, 6, 4); p.set(7, 7, 5); p.outline(); }],
  /** hex shield shard */
  hex: [16, 16, 1, (p) => { const pts = []; for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + Math.PI / 6; pts.push([8 + Math.cos(a) * 6.5, 8 + Math.sin(a) * 6.5]); } p.poly(pts, 3); p.cut((x, y) => Math.hypot(x - 8, y - 8) < 3.6); p.shade(8, 8, 6); p.outline(); }],
  /** anger mark (four bent corners) */
  anger: [16, 16, 1, (p) => {
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const cx = 8 + sx * 3.6, cy = 8 + sy * 3.6; p.line(cx, cy, cx + sx * 3.2, cy, 3, 2.2); p.line(cx, cy, cx, cy + sy * 3.2, 3, 2.2); }
    p.outline();
  }],
  /** gem / diamond sparkle (surge) */
  gem: [16, 16, 1, (p) => { p.poly([[8, 1.5], [13.5, 7], [8, 14.5], [2.5, 7]], 3); p.poly([[8, 1.5], [13.5, 7], [8, 7]], 4); p.poly([[2.5, 7], [8, 14.5], [8, 7]], 2); p.set(7, 4, 5); p.set(6, 5, 5); p.outline(); }],
  /** radial ground crack 32×32 */
  crack: [32, 32, 2, (p, f) => {
    for (let i = 0; i < 7; i++) {
      let a = i * TAU / 7 + hash(i, f) * 0.6, x = 16, y = 16; const L = 9 + hash(i, f + 3) * 6;
      for (let k = 0; k < 4; k++) { const nx = x + Math.cos(a) * L / 4, ny = y + Math.sin(a) * L / 4; p.line(x, y, nx, ny, k < 2 ? 2 : 3, k < 2 ? 2 : 1); x = nx; y = ny; a += (hash(i, k + f * 9) - 0.5) * 0.9; }
    }
    p.disk(16, 16, 3, 2);
  }],
  /** X slash 32×32 */
  slashX: [32, 32, 1, (p) => { p.line(5, 5, 27, 27, 3, 3.6); p.line(27, 5, 5, 27, 3, 3.6); p.line(6, 6, 26, 26, 5, 1.2); p.line(26, 6, 6, 26, 5, 1.2); p.outline(true); }],
  /** "!" exclamation / taunt mark */
  bang: [16, 16, 1, (p) => { p.poly([[6, 1.5], [10, 1.5], [9.2, 10], [6.8, 10]], 3); p.disk(8, 13, 1.8, 3); p.line(6.8, 2.5, 7.4, 8, 4); p.outline(); }],
  /** dizzy swirl star (faint) — small spiral */
  spiral: [16, 16, 1, (p) => { for (let i = 0; i <= 40; i++) { const t = i / 40, a = t * TAU * 1.6, r = 0.8 + t * 5.6; p.dot(8 + Math.cos(a) * r, 8 + Math.sin(a) * r, 0.8, t > 0.6 ? 4 : 3); } p.outline(); }],
  /** soft round blob for big glows (no outline, mid→hot) */
  blob: [16, 16, 1, (p) => { p.disk(8, 8, 7, 3); p.disk(8, 8, 5, 4); p.disk(8, 8, 3, 5); }],
  /** ring segment (tangent along +x), for big rings built from pieces so pixel density stays sprite-like */
  seg: [16, 8, 2, (p, f) => {
    if (f === 0) { p.line(0, 4, 16, 4, 4, 1); p.line(0, 3, 16, 3, 3, 1); p.line(2, 4, 14, 4, 5, 1); }
    else { p.poly([[0, 2], [16, 2], [16, 6], [0, 6]], 3); p.line(0, 3, 16, 3, 4, 1); p.line(3, 4, 13, 4, 5, 1); p.line(0, 6, 16, 6, 2, 1); }
  }],
  /** vertical light column (additive), soft dithered edges + top fade */
  pillar: [16, 32, 1, (p) => {
    p.each((x, y, px, py) => {
      const dx = Math.abs(px - 8) / 8, top = py / 32, n = hash(x, y);
      const edge = dx < 0.25 ? 5 : dx < 0.5 ? 4 : dx < 0.8 ? 3 : (n < 0.45 ? 3 : 0);
      if (!edge) return;
      if (top < 0.35 && n > top / 0.35) return;
      p.set(x, y, edge);
    });
  }],
  /** music note (jingle flourish) */
  note: [16, 16, 1, (p) => { p.ell(5.5, 12, 3, 2.2, 3, -0.4); p.line(8, 12, 8, 2, 3, 1.6); p.line(8, 2.5, 12.5, 5, 3, 1.8); p.set(5, 11, 4); p.outline(); }],
};

function starPts(cx, cy, R, r) {
  const pts = [];
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r : R; pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
  return pts;
}

/** Build the index atlas. Returns {data: Uint8Array RGBA, w, h, glyphs}. */
export function buildFxAtlas() {
  const W = ATLAS_W, H = ATLAS_H, data = new Uint8Array(W * H * 4);
  const glyphs = {};
  // shelf pack (sorted by height desc keeps 32-px rows together)
  const items = Object.entries(PAINT).map(([name, [w, h, n, fn]]) => ({ name, w, h, n, fn }));
  items.sort((a, b) => b.h - a.h || b.w - a.w);
  let x = 0, y = 0, rowH = 0;
  for (const it of items) {
    const frames = [];
    for (let f = 0; f < it.n; f++) {
      if (x + it.w > W) { x = 0; y += rowH; rowH = 0; }
      if (y + it.h > H) throw new Error('fx atlas full at ' + it.name);
      const p = new Pix(it.w, it.h); it.fn(p, f, it.n);
      for (let j = 0; j < it.h; j++) for (let i = 0; i < it.w; i++) {
        const v = p.d[j * it.w + i]; if (!v) continue;
        const o = ((y + j) * W + x + i) * 4; data[o] = v * 40; data[o + 1] = 0; data[o + 2] = 0; data[o + 3] = 255;
      }
      frames.push([x / W, y / H, it.w / W, it.h / H, it.w, it.h]);
      x += it.w; rowH = Math.max(rowH, it.h);
    }
    glyphs[it.name] = { frames, w: it.w, h: it.h };
  }
  return { data, w: W, h: H, glyphs };
}

// ------------------------------------------------------------------------------------------- palettes
// Each palette: [outline, dark, mid, light, hot] as sRGB hex. Row index = order in PALETTES.
export const PALETTES = {
  fire: ['#5a1206', '#d8361a', '#ff7a1c', '#ffd23a', '#fff6d0'],
  fireHot: ['#7a2208', '#ff6a1a', '#ffb52e', '#ffe98a', '#ffffff'],
  water: ['#0e2a6a', '#2c66dc', '#52aaff', '#bfeaff', '#ffffff'],
  foam: ['#2a5a9a', '#8ccaff', '#d4f0ff', '#f4fcff', '#ffffff'],
  grass: ['#123f10', '#2f8f2a', '#5fcb48', '#c6f27a', '#f6ffd8'],
  leafAlt: ['#3a3a08', '#8aa21e', '#c8d838', '#f0f48a', '#ffffff'],
  pollen: ['#6a5a10', '#e8c838', '#fff07a', '#fffbd0', '#ffffff'],
  electric: ['#5a3c00', '#e8a400', '#ffe22a', '#fffbb0', '#ffffff'],
  earth: ['#36220e', '#7a5430', '#b08850', '#e8cc90', '#fff4dc'],
  rock: ['#2a2420', '#6a5a50', '#9a8a7a', '#cfc2b0', '#f4ece0'],
  dust: ['#3e2c1c', '#7a5c3c', '#9c7c56', '#bea07a', '#dcc6a0'],      // darker, warm: dust never washes sprites out
  wind: ['#1c5660', '#4aa8b0', '#9fe6dc', '#e6fffa', '#ffffff'],
  gold: ['#6a3a00', '#e09a10', '#ffd23c', '#fff3b0', '#ffffff'],
  white: ['#5a6a9a', '#c8d4ff', '#eef2ff', '#ffffff', '#ffffff'],
  grey: ['#2a2e36', '#5c6270', '#848a98', '#aeb4c0', '#d8dce4'],
  heal: ['#0f4a20', '#2fbf5a', '#8ff07a', '#e2ffd8', '#ffffff'],
  arcane: ['#2e0a5a', '#9a40ff', '#d08cff', '#f6e4ff', '#ffffff'],
  rally: ['#5a1008', '#e0402a', '#ff8a3a', '#ffe08a', '#ffffff'],
  orb: ['#123a5a', '#2ca8c8', '#5ee6ee', '#c8fcff', '#ffffff'],
  teamBlue: ['#0a2a6a', '#2a6ae8', '#5aa8ff', '#c8e4ff', '#ffffff'],
  teamRed: ['#5a0a0a', '#d8302a', '#ff6a4a', '#ffc8b0', '#ffffff'],
  smoke: ['#221c1c', '#4a4040', '#6a5e5a', '#8c807a', '#b0a49c'],
  ash: ['#1a1a1e', '#3a3a40', '#5a5a64', '#8a8a94', '#c0c0c8'],
  pink: ['#6a1a3a', '#e0508a', '#ff8ab8', '#ffd8e8', '#ffffff'],
  confettiA: ['#0a2a6a', '#ff5a7a', '#ffd23c', '#7ae0ff', '#ffffff'],
};
export const PAL_ROW = Object.fromEntries(Object.keys(PALETTES).map((k, i) => [k, i]));
export const PAL_ROWS = 32;

/** RGBA8 palette texture data: 8 columns (index 0..7) × PAL_ROWS rows, sRGB bytes. */
export function buildPaletteData() {
  const d = new Uint8Array(8 * PAL_ROWS * 4);
  Object.values(PALETTES).forEach((pal, row) => {
    pal.forEach((hex, i) => {
      const n = parseInt(hex.slice(1), 16), o = (row * 8 + i + 1) * 4;
      d[o] = (n >> 16) & 255; d[o + 1] = (n >> 8) & 255; d[o + 2] = n & 255; d[o + 3] = 255;
    });
  });
  return d;
}

/** Element (mt type) -> palette names {main, alt, light} used by the effect kits. */
export const ELEMENT_PAL = {
  fire: { main: 'fire', hot: 'fireHot', alt: 'fireHot', glow: [1, 0.45, 0.12], core: [1, 0.85, 0.5] },
  water: { main: 'water', hot: 'foam', alt: 'foam', glow: [0.25, 0.6, 1], core: [0.75, 0.92, 1] },
  grass: { main: 'grass', hot: 'leafAlt', alt: 'leafAlt', glow: [0.35, 0.95, 0.3], core: [0.85, 1, 0.6] },
  electric: { main: 'electric', hot: 'white', alt: 'electric', glow: [1, 0.85, 0.15], core: [1, 1, 0.75] },
  earth: { main: 'earth', hot: 'dust', alt: 'rock', glow: [0.9, 0.62, 0.3], core: [1, 0.9, 0.7] },
  wind: { main: 'wind', hot: 'white', alt: 'wind', glow: [0.55, 1, 0.92], core: [0.9, 1, 1] },
};
