// mt/ui/art.js — HUD art cache over the art agent's procedural sprite library (game/art/sprites). Owner: HUD.
// Everything is rendered lazily, once, at native pixel size (no smoothing) and displayed with integer CSS zoom
// + `image-rendering: pixelated`. Expensive renders (animated portraits, showcases) go through a small
// per-frame job queue so a burst of requests never stalls a frame.

import {
  SPECIES_ART, renderPortrait, renderShowcase, renderIconCanvas, renderBadgeCanvas, renderElementIconCanvas,
} from '../../art/sprites/index.js';

const cache = new Map();
const jobs = [];
let pending = new Set();

export function trainerSpriteId(spec, team) {
  const id = 'trainer_' + (spec || 'attack') + '_' + (team === 1 ? 'red' : 'blue');
  return SPECIES_ART[id] ? id : 'trainer_attack_blue';
}
export const hasSprite = (id) => !!SPECIES_ART[id];

function memo(key, make) {
  let v = cache.get(key);
  if (v === undefined) { try { v = make(); } catch (e) { console.error('[mt-ui art]', key, e); v = null; } cache.set(key, v); }
  return v;
}
function queue(key, make) {
  if (cache.has(key)) return cache.get(key);
  if (!pending.has(key)) { pending.add(key); jobs.push([key, make]); }
  return null;
}
/** Run queued renders within a small time budget (ms). Call once per frame. */
export function pumpArt(budgetMs = 6) {
  const t0 = performance.now();
  while (jobs.length && performance.now() - t0 < budgetMs) {
    const [key, make] = jobs.shift(); pending.delete(key);
    try { cache.set(key, make()); } catch (e) { console.error('[mt-ui art]', key, e); cache.set(key, null); }
  }
}

/** 9×7 pixel chevron ▼ in a local player's colour (navy outline, light top edge): "this one is yours" — drawn over the
 *  local active monster in the world (plates.js) and on that monster's portrait in the card. */
export function chevron(color) {
  return memo('chev|' + color, () => {
    const c = document.createElement('canvas'); c.width = 9; c.height = 7; const g = c.getContext('2d');
    const rows = ['#########', '#hhhhhhh#', '.#ccccc#.', '..#ccc#..', '...#c#...', '....#....', '.........'];
    rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === '.') return; g.fillStyle = ch === '#' ? '#0d1230' : ch === 'h' ? '#ffffff' : color; g.fillRect(x, y, 1, 1); }));
    g.globalAlpha = 0.55; g.fillStyle = color; g.fillRect(2, 1, 5, 1); g.globalAlpha = 1;   // tinted highlight
    return c;
  });
}
/** Ability / trainer icon canvas (`fire/a1`, `trainer/capture`, ...). */
export const icon = (id, size = 28) => memo('i|' + id + '|' + size, () => renderIconCanvas(id, size));
/** Type badge pill canvas. */
export const badge = (type, h = 12) => memo('b|' + type + '|' + h, () => renderBadgeCanvas(type, h));
/** Round element symbol. */
export const typeIcon = (type, size = 12) => memo('t|' + type + '|' + size, () => renderElementIconCanvas(type, size));

/** Static portrait (first idle frame), transparent background. */
export function portrait(id, size = 48) {
  if (!SPECIES_ART[id]) return null;
  return memo('p|' + id + '|' + size, () => renderPortrait(id, { size, bg: false, margin: 4 }));
}
/** Animated idle portrait frames (queued). Returns {frames, fps} or null while rendering. */
export function portraitAnim(id, size = 48) {
  const S = SPECIES_ART[id]; if (!S) return null;
  const A = S.anims.idle || { n: 1, fps: 6 };
  return queue('pa|' + id + '|' + size, () => {
    const frames = []; for (let i = 0; i < A.n; i++) frames.push(renderPortrait(id, { size, bg: false, margin: 4, frame: i }));
    return { frames, fps: A.fps || 6 };
  });
}
/** Head-and-shoulders crop (trainers) — the top part of a big portrait render. Works on the raw RGBA the art library
 *  returns (canvas:false): no getImageData readback (a GPU-canvas readback stalled the first frames — QA perf bug 7). */
export function bust(id, size = 24) {
  if (!SPECIES_ART[id]) return null;
  return memo('h|' + id + '|' + size, () => {
    const big = renderPortrait(id, { size: size * 2, bg: false, margin: 0, canvas: false });
    const W = big.w, H = big.h, d = big.data;
    // anchor the crop on the head: the top-most opaque row
    let top = 0; outer: for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3]) { top = y; break outer; }
    const sx = Math.round(size / 2), sy = Math.max(0, top - 1), img = new ImageData(size, size);
    for (let y = 0; y < size && sy + y < H; y++) img.data.set(d.subarray(((sy + y) * W + sx) * 4, ((sy + y) * W + sx + size) * 4), y * size * 4);
    const c = document.createElement('canvas'); c.width = c.height = size;
    c.getContext('2d').putImageData(img, 0, 0);
    return c;
  });
}
/** Big showcase render (queued) for the end screen. */
export function showcase(id, maxH = 0, maxW = 0) {
  const S = SPECIES_ART[id]; if (!S) return null;
  return queue('s|' + id + '|' + maxH + '|' + maxW, () => {
    let r = renderShowcase(id, {});
    const f = Math.min(maxH ? (maxH - 16) / (r.height - 16) : 1, maxW ? (maxW - 16) / (r.width - 16) : 1);
    if (f < 1) {
      // re-rasterise natively at a smaller scale (stays pixel-crisp; no resampling)
      const base = S.kind === 'trainer' || S.kind === 'minion' ? 5 : S.stage === 0 ? 6 : S.stage === 1 ? 4.5 : 3.5;
      r = renderShowcase(id, { scale: Math.max(1, Math.floor(base * f * 4) / 4) });
    }
    return r;
  });
}
