import { drawSpot } from './backdrop.js';
import { artKey } from './artspec.js';
import BAKED from './title-art/manifest.js';
// mt/ui/stage.js — pixel-art "hero stage" for the title screen and the trainer lobby. Owner: front-end screens.
//
// One canvas at ART-PIXEL resolution holds the whole diorama: a lit stone dais with a turning rune ring, contact
// shadows, the animated hero sprites and the particles. The canvas is shown at an INTEGER device-pixel zoom with
// `image-rendering: pixelated`, so every element shares one pixel grid (no mixed densities, no blur).
// Sprites are native re-rasters of the art library (renderShowcase) at the stage's raster scale. The menu screens'
// sprites are PRE-BAKED (tools/bake-title-art.cjs -> mt/ui/title-art/*.png + manifest.js): the atlases start loading
// when this module loads (game boot), so the title / lobby stage is complete the moment it opens. Anything not baked
// (or an atlas that fails to load) is rendered off the main thread by title.worker.js (fallback: main thread, one
// frame per idle slice), optionally with a stage-light rim pass.
//
//   const st = new HeroStage(canvas, { cast: [{ id, x, y, flip, z }], dais: { r }, fx: true })
//   st.layout({ zoom, scale, w, h })  (art px canvas size)   st.update(dt)   st.ready   st.dispose()

const W_URL = new URL('./title.worker.js', import.meta.url);
let worker = null, workerBroken = false;
const pending = new Map();        // key -> entry
const cache = new Map();          // key -> entry { id, scale, frames:[{c,ax,ay}], n, fps, want }
let artMod = null;

function getWorker() {
  if (worker || workerBroken) return worker;
  try {
    worker = new Worker(W_URL, { type: 'module' });
    worker.onmessage = (ev) => {
      const m = ev.data; const e = cache.get(m.key); if (!e) return;
      if (m.error) { e.errors = (e.errors || 0) + 1; console.warn('[stage] render', m.key, m.error); if (m.i === 0) fallback(e); return; }
      const img = new ImageData(new Uint8ClampedArray(m.buf), m.w, m.h);
      const c = document.createElement('canvas'); c.width = m.w; c.height = m.h; c.getContext('2d').putImageData(img, 0, 0);
      e.frames[m.i] = { c, ax: m.ax, ay: m.ay, w: m.w, h: m.h };
      e.got++;
    };
    worker.onerror = (ev) => { console.warn('[stage] worker failed, rendering on the main thread', ev && ev.message); workerBroken = true; worker = null; for (const e of cache.values()) if (e.got < e.n) fallback(e); };
  } catch (e) { workerBroken = true; worker = null; }
  return worker;
}

/** main-thread fallback: one frame per idle slice */
function fallback(e) {
  if (e.fb) return; e.fb = true;
  const run = async () => {
    if (!artMod) artMod = await import('../../art/sprites/index.js');
    for (let i = 0; i < e.n; i++) {
      if (e.frames[i] || e.dead) continue;
      await new Promise((r) => (typeof requestIdleCallback === 'function' ? requestIdleCallback(r, { timeout: 200 }) : setTimeout(r, 16)));
      try {
        const r = e.view ? (() => { const [vw, rest] = String(e.view).split('|'), [an, fo] = (rest || '').split('@'); const b = artMod.renderSpriteTrimmed(e.id, vw, an || 'idle', i + (+fo || 0), { scale: e.scale, outline2: true, cache: false }); return { w: b.w, h: b.h, data: b.data, anchorX: b.ax, anchorY: b.ay }; })()
          : artMod.renderShowcase(e.id, { scale: e.scale, anim: 'idle', frame: i, margin: 3, canvas: false });
        if (e.clean) { const { applyClean } = await import('./pixelclean.js'); r.data = applyClean(r.data, r.w, r.h, e.clean); }
        const c = document.createElement('canvas'); c.width = r.w; c.height = r.h; c.getContext('2d').putImageData(new ImageData(r.data, r.w, r.h), 0, 0);
        e.frames[i] = { c, ax: r.anchorX, ay: r.anchorY, w: r.w, h: r.h }; e.got++;
      } catch (err) { console.warn('[stage] fallback', err); e.frames[i] = null; e.got++; }
    }
  };
  run();
}

// ------------------------------------------------------------------------------------------------ pre-baked atlases
const ATLAS = new Map();          // file -> { img, ok, failed, wait: [entries] }
function atlas(file) {
  let A = ATLAS.get(file);
  if (!A && typeof Image !== 'undefined') {
    A = { img: new Image(), ok: false, failed: false, wait: [] };
    ATLAS.set(file, A);
    A.img.onload = () => { A.ok = true; for (const e of A.wait.splice(0)) sliceBaked(e, A); };
    A.img.onerror = () => { A.failed = true; console.warn('[stage] baked atlas failed, rendering procedurally:', file); for (const e of A.wait.splice(0)) { e.baked = null; procedural(e); } };
    A.img.src = new URL('./title-art/' + file, import.meta.url).href;
  }
  return A;
}
// start every atlas download now (module load = game boot): ~0.7 MB of small PNGs, long done before the title shows
try { for (const f of (BAKED && BAKED.atlases) || []) atlas(f); } catch { /* no Image (worker / node) */ }
/** cut the entry's frames (and silhouettes) out of its loaded atlas */
function sliceBaked(e, A) {
  if (e.dead) return;
  const b = e.baked, cut = (r) => { const c = document.createElement('canvas'); c.width = r[2]; c.height = r[3]; const g = c.getContext('2d'); g.drawImage(A.img, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]); return c; };
  for (let i = 0; i < e.n; i++) {
    const r = b.f[i % b.f.length];
    const fr = { c: cut(r), ax: r[4], ay: r[5], w: r[2], h: r[3] };
    if (b.s) { fr.sil = cut(b.s[i % b.s.length]); fr.silTone = b.tone; }   // title.js silhouette() cache
    e.frames[i] = fr;
  }
  e.got = e.n;
}
function procedural(e) {
  const w = getWorker();
  if (w) w.postMessage({ key: e.key, id: e.id, scale: e.scale, view: e.view, clean: e.clean, anim: 'idle', frames: [...Array(e.n).keys()], rim: e.rim == null ? [255, 236, 196] : e.rim });
  else fallback(e);
}
/** does a baked atlas cover this sprite (heroFrames arguments)? */
export function isBaked(id, scale, view, clean, rim) { return !!(BAKED && BAKED.keys[artKey(id, scale, view, clean, rim)]); }

/** Animated idle frames of a sprite at a raster scale (shared cache; pre-baked atlas when there is one). */
export function heroFrames(id, scale, n, fps, rim, view, clean) {
  const key = artKey(id, scale, view, clean, rim);
  let e = cache.get(key);
  if (!e) {
    e = { key, id, scale, n, fps, view, clean, rim, frames: new Array(n).fill(null), got: 0 };
    cache.set(key, e);
    const b = BAKED && BAKED.keys[key], A = b && atlas(b.a);
    if (A && !A.failed) { e.baked = b; if (A.ok) sliceBaked(e, A); else A.wait.push(e); }
    else procedural(e);
  }
  return e;
}
/** Drop cached scales nobody uses any more (resize). */
export function trimHeroCache(keep) {
  for (const [k, e] of cache) if (!keep.has(k)) { e.dead = true; cache.delete(k); if (worker) worker.postMessage({ cancel: k }); }
}

// ------------------------------------------------------------------------------------------------ helpers
const rgb = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** deterministic tiny PRNG (particles; render-only) */
function prng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; }; }

/**
 * The dais: an elliptical two-tone stone platform, spot-lit from above (4 dithered bands), carved rim, brick seams on
 * the side band, 1-px navy outline, crisp two-step ground shadow. Returns { c, cx, cy, rx, ry, T }.
 */
export function drawDais(R, opt = {}) {
  const rx = Math.round(R), ry = Math.max(6, Math.round(R * (opt.tilt || 0.3))), T = Math.max(4, Math.round(R * 0.12));
  const pad = Math.round(R * 0.16) + 2;
  const W = rx * 2 + pad * 2 + 1, H = ry * 2 + T + pad * 2 + Math.round(ry * 0.5);
  const cx = rx + pad, cy = ry + pad;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'); const img = g.createImageData(W, H); const d = img.data;
  const top = (opt.top || ['#f1f2f7', '#d3d7e6', '#adb3cb', '#868ead', '#5f6688']).map(rgb);
  const side = (opt.side || ['#5c6690', '#454e78', '#333a60', '#252b4c']).map(rgb);
  const gold = (opt.gold || ['#fff1b8', '#ffd45a', '#d9a03a', '#9a6a26']).map(rgb);
  const OUT = rgb(opt.outline || '#11162e');
  const warm = rgb(opt.warm || '#fff0c8');
  const put = (x, y, col, a = 255) => { const i = (y * W + x) * 4; d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = a; };
  const ext = (x) => { const u = (x - cx) / rx; return u * u <= 1 ? ry * Math.sqrt(1 - u * u) : -1; };
  const dith = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];
  // ground shadow (two crisp steps)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const u = (x - cx) / (rx * 1.12), v = (y - (cy + T + ry * 0.12)) / (ry * 1.25), q = u * u + v * v;
    if (q <= 1) put(x, y, [8, 10, 24], q < 0.72 ? 120 : 64);
  }
  const band = 1.6 / ry;  // ~1.6 px ring width in the ellipse metric (y-radius)
  // body
  for (let x = cx - rx; x <= cx + rx; x++) {
    const e = ext(x); if (e < 0) continue;
    const y0 = Math.ceil(cy - e), y1 = Math.floor(cy + e), y2 = Math.floor(cy + e + T);
    for (let y = y0; y <= y2; y++) {
      if (y <= y1) {
        // top face: slate, spot-lit (centred a bit behind the middle), 5 dithered bands + a warm tint in the pool
        const u = (x - cx) / rx, v = (y - cy + ry * 0.18) / ry;
        const dist = Math.sqrt(u * u * 0.9 + v * v * 1.1);
        const lv = Math.min(3.999, Math.max(0, dist * 3.6 - 0.35));
        const rr = Math.sqrt(((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2);
        const b = Math.floor(lv); let k = lv - b > dith(x, y) ? b + 1 : b;
        let col;
        if (rr > 0.9 - band * 0.5 && rr < 0.9 + band) {         // gold inlay ring, lit on the front half
          col = gold[y > cy ? (Math.abs(u) < 0.6 ? 0 : 1) : (Math.abs(u) < 0.5 ? 2 : 3)];
        } else {
          if (Math.abs(rr - 0.58) < band * 0.55) k = Math.min(4, k + 1);   // engraved inner ring
          if (rr > 0.9) k = Math.min(4, k + (y < cy ? 1 : 0));            // outer lip
          col = top[Math.min(4, k)];
          const w = Math.max(0, 1 - dist * 1.25); if (w > 0) col = mixc(col, warm, w * 0.35);
        }
        put(x, y, col);
      } else {
        // side band: navy stone lit from the upper left; gold trim on the top course; brick seams
        const u = (x - cx) / rx, ty = (y - y1) / T;
        if (y === y1 + 1) { put(x, y, gold[u < -0.3 ? 0 : u < 0.4 ? 1 : 2]); continue; }
        let k = u < -0.35 ? 0 : u < 0.3 ? 1 : 2; if (ty > 0.72) k++;
        const ang = Math.asin(Math.max(-1, Math.min(1, u)));
        const seam = Math.abs(((ang / Math.PI) * 20 + (ty > 0.55 ? 0.5 : 0)) % 1) < 0.07 && ty > 0.2 && ty < 0.95;
        const course = Math.abs(ty - 0.55) < 0.5 / T;
        put(x, y, side[Math.min(3, k + (seam || course ? 1 : 0))]);
      }
    }
    // rim highlight: the front top edge catches the spot
    const yf = Math.floor(cy + e);
    if (Math.abs((x - cx) / rx) < 0.9) put(x, yf, mixc(top[0], warm, 0.5));
  }
  // outline (1 px, outside the silhouette)
  const src = new Uint8ClampedArray(d);
  const solid = (x, y) => x >= 0 && y >= 0 && x < W && y < H && src[(y * W + x) * 4 + 3] === 255;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (solid(x, y)) continue;
    if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) put(x, y, OUT);
  }
  g.putImageData(img, 0, 0);
  return { c, cx, cy, rx, ry, T, W, H };
}

/** darkened copy of a frame (bots in the lobby line-up), cached on the frame */
function dimmed(f, k) {
  const key = 'dim' + k; if (f[key]) return f[key];
  const c = document.createElement('canvas'); c.width = f.w; c.height = f.h; const g = c.getContext('2d');
  g.drawImage(f.c, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = `rgba(16,20,48,${k})`; g.fillRect(0, 0, f.w, f.h);
  return (f[key] = c);
}

// ------------------------------------------------------------------------------------------------ stage
const FX = {
  fire: { cols: ['#fff3b0', '#ffd23a', '#ff9a2a', '#e8502a', '#9a2a2a'], kind: 'ember' },
  water: { cols: ['#e8fbff', '#9fe6ff', '#58b8f0'], kind: 'bubble' },
  grass: { cols: ['#c8f07a', '#7fd05a', '#ffb3d0', '#3f9a4a'], kind: 'leaf' },
};

export class HeroStage {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {{cast:Member[], dais?:object, motes?:number, seed?:number, ring?:string}} o
   * Member = { id, x, y, d?=0 (dais index), flip?, fx?: 'fire'|'water'|'grass', phase?, n?, fps?, view?, rim?,
   *            dim?: 0..1 (darken: bots), mark?: '#rrggbb' (pixel ring at the feet: a local player), shadow? }
   *   x/y: feet position relative to its dais centre, in dais x-radii / y-radii; members are drawn in list order.
   */
  constructor(canvas, o) {
    this.canvas = canvas; this.g = canvas.getContext('2d'); this.o = o;
    this.t = 0; this.parts = []; this.rand = prng(o.seed || 7); this.scale = 0; this.daises = [];
    this.entries = []; this.spawnAcc = {}; this.cast = o.cast || [];
  }
  /**
   * art-px canvas size, sprite raster scale and the daises: either {R, cx, cy} (one) or daises:[{R, cx, cy, opt}]
   */
  layout({ w, h, scale, R, cx, cy, daises }) {
    w = Math.max(8, Math.round(w)); h = Math.max(8, Math.round(h));
    if (this.canvas.width !== w) this.canvas.width = w;
    if (this.canvas.height !== h) this.canvas.height = h;
    this.g.imageSmoothingEnabled = false;
    const list = daises || [{ R, cx, cy, opt: this.o.dais }];
    this.daises = list.map((d, i) => {
      const old = this.daises[i], key = Math.round(d.R) + JSON.stringify(d.opt || {});
      const art = old && old.key === key ? old.art : drawDais(d.R, d.opt || {});
      return { key, art, cx: Math.round(d.cx), cy: Math.round(d.cy), ring: (d.opt && d.opt.ring) || this.o.ring, spot: d.spot };
    });
    if (scale !== this.scale) { this.scale = scale; this.parts.length = 0; this.setCast(this.cast, true); }
  }
  /** replace the cast (lobby: team / look changes); frames come from the shared cache */
  setCast(cast, force) {
    this.cast = cast;
    if (!this.scale) return;
    const k = cast.map((m) => m.id + (m.view || '')).join(',');
    if (!force && k === this.castKey) { this.entries.forEach((x, i) => { x.m = cast[i]; }); return; }
    this.castKey = k;
    this.entries = cast.map((m) => ({ m, e: heroFrames(m.id, this.scale, m.n || 8, m.fps || 8, m.rim, m.view, m.clean) }));
  }
  get ready() { return this.entries.length > 0 && this.entries.every((x) => x.e.frames[0]); }
  get complete() { return this.entries.length > 0 && this.entries.every((x) => x.e.got >= x.e.n); }
  keys() { return this.entries.map((x) => x.e.key); }

  /** feet position of a cast member in canvas art px */
  feet(m) { const D = this.daises[m.d || 0]; return [D.cx + Math.round(m.x * D.art.rx), D.cy + Math.round(m.y * D.art.ry) + Math.round(m.dy || 0)]; }
  /** top-centre of a member's current frame (art px), for DOM name tags */
  head(m) { if (!m._box) return null; const [x, y, w] = m._box; return [x + w / 2, y + 3]; }

  update(dt) {
    this.t += dt;
    const g = this.g, W = this.canvas.width, H = this.canvas.height; if (!this.daises.length) return;
    g.clearRect(0, 0, W, H);
    this.particles(dt, 'back');
    for (const D of this.daises) {
      if (D.spot) drawSpot(g, D.spot, D.cx, D.cy, Math.round(D.art.rx * 0.45), Math.round(D.art.rx * 0.8), 0.9);
      g.drawImage(D.art.c, D.cx - D.art.cx, D.cy - D.art.cy);
      this.ring(D.cx, D.cy, D.art, D.ring);
    }
    // contact shadows (+ player marks), then sprites in list order
    for (const { m, e } of this.entries) {
      const f = e.frames[0]; if (!f) continue;
      const [fx, fy] = this.feet(m);
      const sw = Math.round((m.shadow || 0.34) * f.w * 0.5), sh = Math.max(2, Math.round(sw * 0.28));
      if (m.mark) {
        const p = 0.5 + 0.5 * Math.sin(this.t * 4 + (m.phase || 0) * 6);
        g.fillStyle = m.mark; g.globalAlpha = 0.55 + 0.45 * p; this.ring2(fx, fy, sw + 3, sh + 2); g.globalAlpha = 1;
      }
      g.fillStyle = 'rgba(12,14,34,.34)'; this.ellipse(fx, fy, sw, sh);
      g.fillStyle = 'rgba(12,14,34,.32)'; this.ellipse(fx, fy, Math.round(sw * 0.7), Math.max(1, Math.round(sh * 0.7)));
    }
    for (const { m, e } of this.entries) {
      const n = e.n, fps = m.fps || 8;
      const fi = Math.floor((this.t + (m.phase || 0)) * fps) % n;
      let f = e.frames[fi] || e.frames[0]; if (!f) continue;
      const [fx, fy] = this.feet(m);
      const src = m.dim ? dimmed(f, m.dim) : f.c;
      if (m.flip) { g.save(); g.translate(fx * 2, 0); g.scale(-1, 1); g.drawImage(src, fx - f.ax, fy - f.ay); g.restore(); }
      else g.drawImage(src, fx - f.ax, fy - f.ay);
      m._box = [m.flip ? fx - (f.w - f.ax) : fx - f.ax, fy - f.ay, f.w, f.h, m.flip];
      m._f = f;
    }
    this.particles(dt, 'front');
  }

  ellipse(x, y, rx, ry) {
    const g = this.g;
    for (let j = -ry; j <= ry; j++) { const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (j * j) / (ry * ry)))); g.fillRect(x - w, y + j, w * 2 + 1, 1); }
  }
  /** 1-px pixel ellipse outline (2 px on the front half) */
  ring2(x, y, rx, ry) {
    const g = this.g, n = Math.max(24, Math.round((rx + ry) * 3));
    let lx = null, ly = null;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2, px = Math.round(x + Math.cos(a) * rx), py = Math.round(y + Math.sin(a) * ry);
      if (px === lx && py === ly) continue; lx = px; ly = py;
      g.fillRect(px, py, 1, Math.sin(a) > 0.2 ? 2 : 1);
    }
  }

  /** turning rune ring on the dais top (dashes = carved runes catching the light) */
  ring(cx, cy, D, col) {
    const g = this.g, R = D.rx * 0.7, r2 = D.ry * 0.7, n = Math.max(18, Math.round(R / 3.2));
    const a0 = this.t * 0.25, pulse = 0.55 + 0.45 * Math.sin(this.t * 2.1);
    g.fillStyle = col || '#ffe7a0';
    for (let i = 0; i < n; i++) {
      const a = a0 + (i / n) * Math.PI * 2, s = Math.sin(a), co = Math.cos(a);
      if (i % 3 === 2) continue;
      const x = Math.round(cx + co * R), y = Math.round(cy + s * r2);
      g.globalAlpha = (s > 0 ? 0.9 : 0.45) * pulse;  // front half brighter
      g.fillRect(x, y, i % 3 === 0 ? 2 : 1, 1);
    }
    g.globalAlpha = 1;
  }

  spawn(kind, x, y, cols) {
    const r = this.rand, P = { kind, x, y, t: 0, cols };
    if (kind === 'mote') { P.vx = (r() - 0.5) * 3; P.vy = -(3 + r() * 6); P.life = 3 + r() * 4; P.ph = r() * 6.28; P.layer = r() < 0.5 ? 'back' : 'front'; P.s = r() < 0.18 ? 2 : 1; }
    else if (kind === 'ember') { P.vx = (r() - 0.5) * 8; P.vy = -(10 + r() * 14); P.life = 0.9 + r() * 0.9; P.layer = 'front'; P.s = r() < 0.3 ? 2 : 1; P.ph = r() * 6.28; }
    else if (kind === 'bubble') { P.vx = (r() - 0.5) * 2; P.vy = -(6 + r() * 6); P.life = 1.6 + r() * 1.2; P.layer = 'front'; P.s = r() < 0.4 ? 3 : 2; P.ph = r() * 6.28; }
    else { P.vx = 6 + r() * 6; P.vy = 3 + r() * 4; P.life = 2.2 + r() * 1.5; P.layer = 'front'; P.s = 1; P.ph = r() * 6.28; P.col = cols[Math.floor(r() * cols.length)]; }
    this.parts.push(P);
  }

  particles(dt, layer) {
    const g = this.g, r = this.rand, W = this.canvas.width, H = this.canvas.height;
    if (layer === 'back' && dt > 0) {
      // spawn: light motes in the spotlight cone + element particles from each monster's silhouette box
      const motes = this.o.motes ?? 26;
      this.spawnAcc.m = (this.spawnAcc.m || 0) + dt * motes / 5;
      while (this.spawnAcc.m > 1 && this.parts.length < 220) {
        this.spawnAcc.m--;
        const D = this.daises[Math.floor(r() * this.daises.length)], A = D.art;
        this.spawn('mote', D.cx + (r() - 0.5) * A.rx * 2.1, D.cy - r() * H * 0.62 + A.ry * 0.4);
      }
      for (const { m } of this.entries) {
        const fx = FX[m.fx]; if (!fx || !m._box) continue;
        const k = m.id; const rate = m.fxRate || (fx.kind === 'ember' ? 9 : fx.kind === 'bubble' ? 2.2 : 1.6);
        this.spawnAcc[k] = (this.spawnAcc[k] || 0) + dt * rate;
        while (this.spawnAcc[k] > 1) {
          this.spawnAcc[k]--;
          const [bx, by, bw, bh] = m._box;
          const pt = this.pick(m, bx, by, bw, bh, fx.kind);
          if (pt) this.spawn(fx.kind, pt[0], pt[1], fx.cols);
        }
      }
    }
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const P = this.parts[i];
      if (P.layer !== layer) continue;
      if (dt > 0) {
        P.t += dt;
        if (P.t >= P.life) { this.parts.splice(i, 1); continue; }
        P.x += (P.vx + Math.sin(P.t * 2 + P.ph) * (P.kind === 'leaf' ? 6 : 2)) * dt; P.y += P.vy * dt;
        if (P.kind === 'ember') P.vy *= 1 - dt * 0.6;
      }
      const u = P.t / P.life; const x = Math.round(P.x), y = Math.round(P.y);
      if (x < -4 || y < -4 || x > W + 4 || y > H + 4) continue;
      if (P.kind === 'mote') {
        const tw = 0.5 + 0.5 * Math.sin(P.t * 5 + P.ph);
        g.globalAlpha = Math.min(1, u * 4, (1 - u) * 3) * (0.35 + 0.65 * tw);
        g.fillStyle = P.s > 1 ? '#fff6d8' : '#ffe9a8'; g.fillRect(x, y, 1, 1);
        if (P.s > 1 && tw > 0.8) { g.globalAlpha *= 0.55; g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3); }
      } else if (P.kind === 'ember') {
        const ci = Math.min(P.cols.length - 1, Math.floor(u * P.cols.length));
        g.globalAlpha = u > 0.75 ? (1 - u) * 4 : 1; g.fillStyle = P.cols[ci]; g.fillRect(x, y, P.s, P.s);
      } else if (P.kind === 'bubble') {
        g.globalAlpha = Math.min(1, (1 - u) * 3) * 0.9; g.fillStyle = P.cols[1];
        if (P.s >= 3) { g.fillRect(x, y - 1, 1, 1); g.fillRect(x - 1, y, 1, 1); g.fillRect(x + 1, y, 1, 1); g.fillRect(x, y + 1, 1, 1); g.fillStyle = P.cols[0]; g.fillRect(x - 1, y - 1, 1, 1); }
        else { g.fillRect(x, y, 2, 1); g.fillRect(x, y + 1, 2, 1); g.fillStyle = P.cols[0]; g.fillRect(x, y, 1, 1); }
      } else {
        g.globalAlpha = Math.min(1, u * 5, (1 - u) * 3); g.fillStyle = P.col;
        const flip = Math.sin(P.t * 4 + P.ph) > 0; g.fillRect(x, y, flip ? 2 : 1, flip ? 1 : 2);
      }
    }
    g.globalAlpha = 1;
  }

  /** a spawn point on the sprite's upper silhouette (flames / back / crown), sampled from the current frame */
  pick(m, bx, by, bw, bh, kind) {
    const f = m._f; if (!f) return null;
    if (!f.alpha) { try { f.alpha = f.c.getContext('2d').getImageData(0, 0, f.w, f.h).data; } catch { f.alpha = null; } }
    const A = f.alpha; const r = this.rand;
    for (let k = 0; k < 12; k++) {
      const u = r(), v = kind === 'leaf' ? r() * 0.5 : r() * (kind === 'ember' ? 0.55 : 0.6);
      const sx = Math.floor(u * f.w), sy = Math.floor(v * f.h);
      if (!A || A[(sy * f.w + sx) * 4 + 3]) return [bx + (m._box[4] ? f.w - 1 - sx : sx), by + sy];
    }
    return null;
  }
}
