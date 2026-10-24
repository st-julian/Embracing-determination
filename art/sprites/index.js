// Public API of the procedural sprite library.
//   import { buildAtlas, buildFormAtlas, SPECIES_ART, renderPortrait, renderShowcase,
//            renderIconCanvas, renderBadgeCanvas, renderElementIconCanvas } from './art/sprites/index.js'
import { renderFrame, animDefs, animList, viewList, getMats } from './rig.js';
import { toRGBA } from './raster.js';
import { FORMS, FORM_BY_ID, LINES } from './forms.js';
import { MINIONS, TEAM } from './minions.js';
import { TRAINERS } from './trainers.js';
import { captureOrb } from './orb.js';
import { galeclaw } from './species/boss.js';
import { renderIcon, renderBadge, renderElementIcon, ICON_IDS, ABILITY_NAMES, ELEMENT_COLORS } from './icons.js';
import { hexToRgb } from './color.js';

export { FORMS, FORM_BY_ID, LINES, MINIONS, TRAINERS, TEAM, ICON_IDS, ABILITY_NAMES, ELEMENT_COLORS };

const WORLD_H = [0.9, 1.3, 1.8];

// ---------------------------------------------------------------------------------------
// Sprite registry: every animated sprite id -> metadata. Team variants get their own id.
export const SPECIES_ART = {};
function register(id, def, variant) {
  const A = animDefs(def);
  SPECIES_ART[id] = {
    id, baseId: def.id, variant: variant || null, name: def.name, kind: def.kind || 'monster',
    line: def.line, stage: def.stage, types: def.types, spec: def.spec,
    cell: def.cell, pixelHeight: def.height, worldHeight: def.kind === 'boss' ? 3.5 : def.kind === 'trainer' ? 1.6 : def.kind === 'minion' ? (def.id === 'shellram' ? 1.1 : 0.7) : def.kind === 'item' ? 0.35 : WORLD_H[def.stage],
    shadowRadius: def.shadow, hover: def.hover || 0, views: viewList(def), flipViews: def.kind === 'trainer' ? { right: 'left' } : { 'front-right': 'front', 'back-left': 'back' },
    anims: Object.fromEntries(animList(def).map(a => [a, { ...A[a] }])),
    _def: def,
  };
}
for (const f of FORMS) register(f.id, f);
for (const m of MINIONS) for (const v of m.variants) register(m.id + '_' + v, m, v);
for (const t of TRAINERS) for (const v of t.variants) register(t.id + '_' + v, t, v);
register('orb', captureOrb);
register('galeclaw', galeclaw);
export const SPRITE_IDS = Object.keys(SPECIES_ART);

// ---------------------------------------------------------------------------------------
const idxCache = new Map();
function frameIdx(def, view, anim, i, scale, useCache = true) {
  const k = def.id + '|' + view + '|' + anim + '|' + i + '|' + (scale || 1);
  let r = useCache ? idxCache.get(k) : null;
  if (!r) {
    r = renderFrame(def, view, anim, i, scale && scale !== 1 ? { scale, cell: [Math.ceil(def.cell[0] * scale), Math.ceil(def.cell[1] * scale)] } : {});
    if (useCache) idxCache.set(k, r);
  }
  return r;
}
export function clearCache() { idxCache.clear(); }

const FLASH = ['#e6ecff', '#f4f7ff', '#ffffff', '#ffffff', '#ffffff', '#9aa4d8', '#c8d0f0', '#a8b2e2'];
const SIL = ['#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff'];
function variantPalette(base, mode) {
  if (!mode) return base;
  const src = mode === 'flash' ? FLASH : SIL;
  return base.map((c, i) => c == null ? c : src[i % 8]);
}

// Render one frame to an RGBA bitmap {w,h,data,ax,ay} (untrimmed cell). mode: 'flash' | 'silhouette'
export function renderSprite(id, view, anim, i = 0, o = {}) {
  const S = SPECIES_ART[id];
  if (!S) throw new Error('unknown sprite ' + id);
  const def = S._def;
  const img = frameIdx(def, view, anim, i, o.scale, o.cache !== false);
  const pal = variantPalette(getMats(def, S.variant).palette, o.mode);
  const bmp = toRGBA(img, pal);
  bmp.ax = img.ax; bmp.ay = img.ay;
  if (o.outline2) thickenOutline(bmp, img, pal);
  return bmp;
}
function thickenOutline(bmp, img, pal) {
  const { w, h, data } = bmp;
  const src = new Uint8Array(img.idx);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    if (src[i]) continue;
    let best = 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const xx = x + dx, yy = y + dy;
      if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
      const k = src[yy * w + xx];
      if (k && (k % 8) >= 5) { best = k - (k % 8) + 5; break; }
    }
    if (best) {
      const c = hexToRgb(pal[best]);
      data[i * 4] = c[0]; data[i * 4 + 1] = c[1]; data[i * 4 + 2] = c[2]; data[i * 4 + 3] = 255;
    }
  }
}

// Lighting data frame for the in-game renderer: RGBA8 = (material|flags, baked tone|shadow, normal x, normal y),
// trimmed, anchor relative to the trimmed rect. Geometry is variant independent (team colours = palette swap).
let POOL_OUT = new Uint8Array(1 << 16);
export function renderSpriteData(id, view, anim, i = 0, o = {}) {
  const S = SPECIES_ART[id];
  if (!S) throw new Error('unknown sprite ' + id);
  const def = S._def, scale = o.scale || 1;
  const img = renderFrame(def, view, anim, i, { data: true, noFx: !!o.noFx, ...(scale !== 1 ? { scale, cell: [Math.ceil(def.cell[0] * scale), Math.ceil(def.cell[1] * scale)] } : {}) });
  const { w, h, idx, data } = img;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (idx[y * w + x]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) { x0 = y0 = x1 = y1 = 0; }
  // o.pool: reuse one scratch output buffer (valid until the next pooled call; the in-game atlas copies it at once)
  const tw = x1 - x0 + 1, th = y1 - y0 + 1, n4 = tw * th * 4;
  const out = o.pool ? (POOL_OUT.length >= n4 ? POOL_OUT.subarray(0, n4) : (POOL_OUT = new Uint8Array(n4 * 2)).subarray(0, n4)) : new Uint8Array(n4);
  for (let y = 0; y < th; y++) out.set(data.subarray(((y + y0) * w + x0) * 4, ((y + y0) * w + x0 + tw) * 4), y * tw * 4);
  return { w: tw, h: th, data: out, ax: img.ax - x0, ay: img.ay - y0 };
}
/** Palette rows for a sprite id: hex colours, 8 per material (tones 0-4, outline, line, lit outline), row = material id. */
export function spritePalette(id) { const S = SPECIES_ART[id]; return getMats(S._def, S.variant).palette; }

// Trimmed frame (tight bounding box) with feet anchor relative to the trimmed rect.
export function renderSpriteTrimmed(id, view, anim, i = 0, o = {}) { return trim(renderSprite(id, view, anim, i, o)); }

function trim(bmp) {
  const { w, h, data } = bmp;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (data[(y * w + x) * 4 + 3]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) { x0 = y0 = 0; x1 = y1 = 0; }
  const tw = x1 - x0 + 1, th = y1 - y0 + 1;
  const out = new Uint8ClampedArray(tw * th * 4);
  for (let y = 0; y < th; y++) out.set(data.subarray(((y + y0) * w + x0) * 4, ((y + y0) * w + x0 + tw) * 4), y * tw * 4);
  return { w: tw, h: th, data: out, ax: bmp.ax - x0, ay: bmp.ay - y0, ox: x0, oy: y0 };
}

// ---------------------------------------------------------------------------------------
export function makeCanvas(w, h) {
  if (typeof OffscreenCanvas !== 'undefined' && !(typeof document !== 'undefined')) return new OffscreenCanvas(w, h);
  if (typeof document !== 'undefined') { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  return null;
}
export function toCanvas(bmp) {
  const c = makeCanvas(bmp.w, bmp.h);
  if (!c) return null;
  const ctx = c.getContext('2d');
  ctx.putImageData(new ImageData(bmp.data, bmp.w, bmp.h), 0, 0);
  return c;
}

// shelf packer -> pages of power-of-two size. Tries several page widths and keeps the
// layout with the smallest total texture area.
function packWidth(sorted, W, maxSize, pad) {
  const pages = [];
  let page = null, x = 0, y = 0, rowH = 0;
  const pos = [];
  const newPage = () => { page = { w: W, h: 0, items: [] }; pages.push(page); x = pad; y = pad; rowH = 0; };
  newPage();
  for (const it of sorted) {
    if (x + it.w + pad > W) { x = pad; y += rowH + pad; rowH = 0; }
    if (y + it.h + pad > maxSize) newPage();
    pos.push([x, y, pages.length - 1]);
    page.items.push(it);
    x += it.w + pad; rowH = Math.max(rowH, it.h);
    page.h = Math.max(page.h, y + it.h + pad);
  }
  for (const p of pages) { let H = 64; while (H < p.h) H *= 2; p.h = H; }
  return { pages, pos, area: pages.reduce((s, p) => s + p.w * p.h, 0) };
}
function pack(items, maxSize, pad) {
  const sorted = items.slice().sort((a, b) => b.h - a.h || b.w - a.w);
  let best = null;
  for (let W = 256; W <= maxSize; W *= 2) {
    if (sorted.some(it => it.w + pad * 2 > W)) continue;
    const r = packWidth(sorted, W, maxSize, pad);
    const score = r.area * (1 + (r.pages.length - 1) * 3) + Math.abs(Math.log2(r.pages[0].w / r.pages[0].h)) * 1000;
    if (!best || score < best.score) best = { ...r, score };
  }
  sorted.forEach((it, k) => { [it.x, it.y, it.page] = best.pos[k]; });
  return best.pages;
}

// Build a texture atlas.
// opts.ids: sprite ids (default: all of SPRITE_IDS); opts.views / opts.anims filters;
// opts.flash (default true): adds '<id>/<view>/hurtFlash/<i>' frames
// opts.silhouette (default true for monsters): adds '<id>/front/silhouette/0' (white, for evolution)
// opts.maxSize (4096), opts.padding (2), opts.canvas (default true; false -> raw bitmaps only)
export function buildAtlas(opts = {}) {
  const t0 = now();
  const ids = opts.ids || SPRITE_IDS;
  const pad = opts.padding ?? 2;
  const items = [];
  const anims = {};
  for (const id of ids) {
    const S = SPECIES_ART[id];
    if (!S) throw new Error('unknown sprite ' + id);
    const A = {};
    anims[id] = A;
    A.fps = {}; A.loop = {}; A.events = {};
    for (const [a, d] of Object.entries(S.anims)) { A.fps[a] = d.fps; A.loop[a] = !!d.loop; if (d.hit !== undefined) A.events[a] = { hit: d.hit }; }
    A.views = S.views; A.flip = S.flipViews;
    A.shadowRadius = S.shadowRadius; A.worldHeight = S.worldHeight; A.hover = S.hover;
    for (const view of S.views) {
      if (opts.views && !opts.views.includes(view)) continue;
      A[view] = {};
      for (const a of Object.keys(S.anims)) {
        if (opts.anims && !opts.anims.includes(a)) continue;
        const keys = [];
        for (let i = 0; i < S.anims[a].n; i++) {
          const key = `${id}/${view}/${a}/${i}`;
          items.push({ key, bmp: trim(renderSprite(id, view, a, i)) });
          keys.push(key);
          if (a === 'hurt' && opts.flash !== false) {
            const fk = `${id}/${view}/hurtFlash/${i}`;
            items.push({ key: fk, bmp: trim(renderSprite(id, view, a, i, { mode: 'flash' })) });
            (A[view].hurtFlash ||= []).push(fk);
          }
        }
        A[view][a] = keys;
      }
      if (S.kind === 'monster' && view === 'front' && opts.silhouette !== false) {
        const sk = `${id}/front/silhouette/0`;
        items.push({ key: sk, bmp: trim(renderSprite(id, 'front', 'idle', 0, { mode: 'silhouette' })) });
        A.front.silhouette = [sk];
      }
    }
    // default-view shortcuts: anims[id].idle -> front/down keys
    const dv = S.views[0];
    if (A[dv]) for (const [a, keys] of Object.entries(A[dv])) A[a] = keys;
  }
  for (const it of items) { it.w = it.bmp.w; it.h = it.bmp.h; }
  const pages = pack(items, opts.maxSize || 4096, pad);
  const frames = {};
  const out = pages.map(p => ({ w: p.w, h: p.h, data: new Uint8ClampedArray(p.w * p.h * 4) }));
  for (const it of items) {
    const P = out[it.page];
    const b = it.bmp;
    for (let y = 0; y < b.h; y++) P.data.set(b.data.subarray(y * b.w * 4, (y + 1) * b.w * 4), ((it.y + y) * P.w + it.x) * 4);
    frames[it.key] = { x: it.x, y: it.y, w: b.w, h: b.h, anchorX: b.ax, anchorY: b.ay, page: it.page };
  }
  if (opts.keepCache !== true) idxCache.clear();
  const canvases = opts.canvas === false ? [] : out.map(toCanvas);
  return {
    canvas: canvases[0] || null, pages: canvases, bitmaps: out, frames, anims,
    meta: { size: out.map(p => [p.w, p.h]), frameCount: items.length, padding: pad, buildMs: Math.round(now() - t0), filter: 'nearest' },
  };
}
// Lazy, per-form atlas (fast; typically 30-150 ms)
export function buildFormAtlas(id, opts = {}) { return buildAtlas({ ...opts, ids: [id] }); }

// ---------------------------------------------------------------------------------------
// 96x96 HUD portrait (front idle frame, re-rendered at a scale that fills the frame)
export function renderPortrait(id, o = {}) {
  const size = o.size || 96;
  const S = SPECIES_ART[id];
  const base = trim(renderSprite(id, S.views[0], o.anim || 'idle', o.frame || 0));
  const fit = (size - (o.margin ?? 10)) / Math.max(base.w, base.h);
  const scale = Math.max(0.5, Math.min(o.maxScale ?? 2.5, Math.floor(fit * 4) / 4));
  const spr = trim(renderSprite(id, S.views[0], o.anim || 'idle', o.frame || 0, { scale }));
  const out = { w: size, h: size, data: new Uint8ClampedArray(size * size * 4) };
  if (o.bg !== false) paintPortraitBg(out, S.line || (S.kind === 'trainer' ? 'neutral' : 'neutral'));
  const ox = Math.round((size - spr.w) / 2), oy = Math.round((size - spr.h) / 2 + (o.dy || 0));
  blit(out, spr, ox, oy);
  return o.canvas === false ? out : toCanvas(out) || out;
}
function paintPortraitBg(out, el) {
  const E = ELEMENT_COLORS[el] || ELEMENT_COLORS.neutral;
  const c0 = hexToRgb(E.dark), c1 = hexToRgb(E.bg);
  const n = out.w, cx = n / 2, cy = n / 2;
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / (n / 2);
    if (d > 1) continue;
    const i = (y * n + x) * 4;
    let t = d > 0.94 ? 0 : d > 0.86 ? 0.25 : d > 0.62 ? 0.5 : 0.75;
    if (d > 0.62 && d <= 0.86 && ((x + y) & 1) && d > 0.8) t = 0.25;
    const c = c0.map((v, k) => v + (c1[k] - v) * t);
    out.data[i] = c[0]; out.data[i + 1] = c[1]; out.data[i + 2] = c[2]; out.data[i + 3] = 255;
  }
}
function blit(dst, src, ox, oy) {
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
    const X = x + ox, Y = y + oy;
    if (X < 0 || Y < 0 || X >= dst.w || Y >= dst.h) continue;
    const si = (y * src.w + x) * 4;
    if (!src.data[si + 3]) continue;
    const di = (Y * dst.w + X) * 4;
    dst.data[di] = src.data[si]; dst.data[di + 1] = src.data[si + 1]; dst.data[di + 2] = src.data[si + 2]; dst.data[di + 3] = 255;
  }
}

// Large high-detail render for collection / victory screens. The rig is re-rasterised at
// `scale` (native pixel detail, not an upscale); `pixel` then optionally upscales by nearest.
export function renderShowcase(id, o = {}) {
  const S = SPECIES_ART[id];
  const scale = o.scale || (S.kind === 'trainer' ? 5 : S.kind === 'minion' ? 5 : S.stage === 0 ? 6 : S.stage === 1 ? 4.5 : 3.5);
  const spr = trim(renderSprite(id, S.views[0], o.anim || 'idle', o.frame || 0, { scale, outline2: o.outline2 ?? true }));
  const px = o.pixel || 1;
  const m = o.margin ?? 8;
  const out = { w: (spr.w + m * 2) * px, h: (spr.h + m * 2) * px, data: null };
  out.data = new Uint8ClampedArray(out.w * out.h * 4);
  for (let y = 0; y < out.h; y++) for (let x = 0; x < out.w; x++) {
    const sx = Math.floor(x / px) - m, sy = Math.floor(y / px) - m;
    if (sx < 0 || sy < 0 || sx >= spr.w || sy >= spr.h) continue;
    const si = (sy * spr.w + sx) * 4;
    if (!spr.data[si + 3]) continue;
    const di = (y * out.w + x) * 4;
    out.data.set(spr.data.subarray(si, si + 4), di);
  }
  out.anchorX = (spr.ax + m) * px; out.anchorY = (spr.ay + m) * px;
  return o.canvas === false ? out : toCanvas(out) || out;
}

// icons & badges --------------------------------------------------------------------------
function idxToBmp(img) { return toRGBA(img); }
export function renderIconBitmap(id, size = 40) { return idxToBmp(renderIcon(id, size)); }
export function renderIconCanvas(id, size = 40) { return toCanvas(renderIconBitmap(id, size)); }
export function renderBadgeBitmap(el, h = 16) { return idxToBmp(renderBadge(el, h)); }
export function renderBadgeCanvas(el, h = 16) { return toCanvas(renderBadgeBitmap(el, h)); }
export function renderElementIconBitmap(el, size = 16) { return idxToBmp(renderElementIcon(el, size)); }
export function renderElementIconCanvas(el, size = 16) { return toCanvas(renderElementIconBitmap(el, size)); }
// ability icon ids per line: `${line}/basic`, `${line}/a1`, `${line}/a2`; trainer: 'trainer/rally' etc.
export function abilityIconsFor(line) { return [`${line}/basic`, `${line}/a1`, `${line}/a2`]; }

// UI atlas: all icons (40px), element icons (16 & 24px), badges, portraits (96px)
export function buildUIAtlas(opts = {}) {
  const t0 = now();
  const items = [];
  const size = opts.iconSize || 40;
  for (const id of ICON_IDS) items.push({ key: 'icon/' + id, bmp: renderIconBitmap(id, size) });
  for (const el of LINES) {
    items.push({ key: 'badge/' + el, bmp: renderBadgeBitmap(el, 16) });
    items.push({ key: 'type16/' + el, bmp: renderElementIconBitmap(el, 16) });
    items.push({ key: 'type24/' + el, bmp: renderElementIconBitmap(el, 24) });
  }
  if (opts.portraits !== false) for (const id of SPRITE_IDS) if (id !== 'orb') items.push({ key: 'portrait/' + id, bmp: renderPortrait(id, { canvas: false, bg: opts.portraitBg }) });
  for (const it of items) { it.w = it.bmp.w; it.h = it.bmp.h; }
  const pages = pack(items, 4096, 2);
  const out = pages.map(p => ({ w: p.w, h: p.h, data: new Uint8ClampedArray(p.w * p.h * 4) }));
  const frames = {};
  for (const it of items) {
    const P = out[it.page], b = it.bmp;
    for (let y = 0; y < b.h; y++) P.data.set(b.data.subarray(y * b.w * 4, (y + 1) * b.w * 4), ((it.y + y) * P.w + it.x) * 4);
    frames[it.key] = { x: it.x, y: it.y, w: b.w, h: b.h, page: it.page };
  }
  const canvases = opts.canvas === false ? [] : out.map(toCanvas);
  return { canvas: canvases[0] || null, pages: canvases, bitmaps: out, frames, meta: { size: out.map(p => [p.w, p.h]), buildMs: Math.round(now() - t0) } };
}

function now() { return typeof performance !== 'undefined' ? performance.now() : Date.now(); }
