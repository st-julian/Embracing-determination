// mt/ui/pixeltext.js — pixel text + button glyphs drawn ON the art-pixel grid (menu canvases). Owner: front-end screens.
//
// Text uses 'Vale JP' (Unifont-JP subset: kana/kanji AND Latin, 16-px grid) at 16 px = one font pixel per art pixel,
// thresholded to hard pixels, with a 1-px outline. Glyphs (✕ / A / hand / keycap) are tiny hand-made pixel icons.

import { loadPixelFonts } from './pixelfont.js';

export const FONT = '16px "Vale JP"';
export const FONT_S = '10px "Vale Pixel Bold"';   // HUD pixel face: 1 font px = 1 art px, cap height 7 (small UI text)
try { loadPixelFonts(); } catch { /* no FontFace */ }
export function fontReady() { try { return !document.fonts || (document.fonts.check(FONT) && document.fonts.check(FONT_S)); } catch { return true; } }

const cnv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const hex = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };

/** one glyph's hard-pixel mask, trimmed to its ink columns: { m, w, h } */
function glyphMask(ch, font, h, base) {
  const tmp = cnv(8, 8).getContext('2d'); tmp.font = font;
  const cw = Math.ceil(tmp.measureText(ch).width) + 4, c = cnv(cw, h), g = c.getContext('2d');
  g.font = font; g.textBaseline = 'alphabetic'; g.fillStyle = '#fff'; g.fillText(ch, 2, base);
  const d = g.getImageData(0, 0, cw, h).data;
  let x0 = cw, x1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < cw; x++) if (d[(y * cw + x) * 4 + 3] > 110) { if (x < x0) x0 = x; if (x > x1) x1 = x; }
  if (x1 < 0) return { m: null, w: 0, h };
  const w = x1 - x0 + 1, m = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) m[y * w + x] = d[(y * cw + x + x0) * 4 + 3] > 110 ? 1 : 0;
  return { m, w, h };
}

/**
 * text -> canvas (hard pixels). o: { color, outline, shadow, small, tight } ; height 21 (16 em + outline/shadow room).
 * tight: proportional setting — every glyph trimmed to its ink and set 1 px apart (a space = 4 px), so kana sit evenly
 * (Unifont's fixed 16-px cells leave uneven gaps around で, ー, ト …).
 */
export function textCanvas(str, o = {}) {
  const font = o.small ? FONT_S : FONT;
  const h = o.small ? 13 : 21, base = o.small ? 10 : 16;
  let w, mask;
  if (o.tight) {
    const gs = [...str].map((ch) => (ch === ' ' ? { sp: 1 } : glyphMask(ch, font, h, base)));
    const gap = o.gap ?? 1, sp = o.space ?? 4;
    w = 4 + gs.reduce((a, gm, i) => a + (gm.sp ? sp : gm.w + (i < gs.length - 1 && !gs[i + 1].sp ? gap : 0)), 0);
    mask = new Uint8Array(w * h);
    let x = 2;
    gs.forEach((gm, i) => {
      if (gm.sp) { x += sp; return; }
      if (gm.m) for (let y = 0; y < h; y++) for (let k = 0; k < gm.w; k++) if (gm.m[y * gm.w + k]) mask[y * w + x + k] = 1;
      x += gm.w + (i < gs.length - 1 && !gs[i + 1].sp ? gap : 0);
    });
  } else {
    const tmp = cnv(8, 8).getContext('2d'); tmp.font = font;
    w = Math.ceil(tmp.measureText(str).width) + 4;
    const c0 = cnv(w, h), g0 = c0.getContext('2d');
    g0.font = font; g0.textBaseline = 'alphabetic'; g0.fillStyle = '#fff'; g0.fillText(str, 2, base);
    const d0 = g0.getImageData(0, 0, w, h).data; mask = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) mask[i] = d0[i * 4 + 3] > 110 ? 1 : 0;
  }
  const c = cnv(w, h), g = c.getContext('2d');
  const img = g.createImageData(w, h), d = img.data;
  const col = hex(o.color || '#fff6dc'), ol = o.outline ? hex(o.outline) : null, sh = o.shadow ? hex(o.shadow) : null;
  const at = (x, y) => x >= 0 && y >= 0 && x < w && y < h && mask[y * w + x];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x; let p = null;
    if (mask[i]) p = col;
    else if (ol && (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1) || at(x - 1, y - 1) || at(x + 1, y - 1) || at(x - 1, y + 1) || at(x + 1, y + 1))) p = ol;
    else if (sh && o.drop && (at(x - 1, y) || at(x, y - 1) || at(x - 1, y - 1))) p = sh;   // 1-px drop shadow (down-right)
    else if (sh && !o.drop && (at(x - 1, y - 2) || at(x, y - 2) || at(x - 2, y - 2))) p = sh;
    if (p) { d[i * 4] = p[0]; d[i * 4 + 1] = p[1]; d[i * 4 + 2] = p[2]; d[i * 4 + 3] = 255; } else d[i * 4 + 3] = 0;
  }
  g.putImageData(img, 0, 0);
  return c;
}

/**
 * pixel button glyphs (one art px per pixel, like the text): DualSense 'cross' 'circle' 'square' 'tri' 'opt',
 * Xbox 'xa' 'xb' 'xx' 'xy' 'menu', 'hand' (tap), 'key:<label>' (keycap; 'key:LR' = ◀▶ arrows).
 */
export function glyphCanvas(kind) {
  if (kind.startsWith('key:')) {
    const lab = kind.slice(4);
    let t;
    if (lab === 'LR') { // pixel ◀ ▶ (the font subset has no arrows)
      t = cnv(15, 21); const g2 = t.getContext('2d'); g2.fillStyle = '#1b2350';
      for (let k = 0; k < 4; k++) { g2.fillRect(2 + k, 9 - k, 1, k * 2 + 1); g2.fillRect(12 - k, 9 - k, 1, k * 2 + 1); }
    } else t = textCanvas(lab, { color: '#1b2350', tight: true });
    const w = t.width + 4, h = 19, c = cnv(w, h), g = c.getContext('2d');
    g.fillStyle = '#0d1230'; g.fillRect(1, 1, w - 2, h - 1); g.fillStyle = '#fff6dc'; g.fillRect(2, 1, w - 4, h - 4); g.fillRect(1, 2, w - 2, h - 6);
    g.drawImage(t, 2, -2);
    return c;
  }
  if (kind === 'opt' || kind === 'menu') { // small pill with ≡
    const w = 15, h = 13, c = cnv(w, h), g = c.getContext('2d');
    g.fillStyle = '#e9edff'; g.fillRect(1, 0, w - 2, h); g.fillRect(0, 1, w, h - 2);
    g.fillStyle = '#24305e'; g.fillRect(2, 1, w - 4, h - 2); g.fillRect(1, 2, w - 2, h - 4);
    g.fillStyle = '#e9edff'; for (const y of [3, 6, 9]) g.fillRect(4, y, w - 8, 1);
    return c;
  }
  const S = 17, c = cnv(S, S), g = c.getContext('2d'), r = 7.6, cx = 8.5, cy = 8.5;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const e = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
    if (e <= r) { g.fillStyle = e > r - 1.3 ? '#e9edff' : e > r - 2.3 ? '#0d1230' : '#24305e'; g.fillRect(x, y, 1, 1); }
  }
  if (kind === 'cross') {
    g.fillStyle = '#9cc0ff';
    for (let k = -3; k <= 3; k++) { g.fillRect(8 + k, 8 + k, 1, 1); g.fillRect(9 + k, 8 + k, 1, 1); g.fillRect(8 + k, 8 - k, 1, 1); g.fillRect(9 + k, 8 - k, 1, 1); }
  } else if (kind === 'circle') {
    g.fillStyle = '#ff8a8a';
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const e = Math.hypot(x + 0.5 - cx, y + 0.5 - cy); if (e <= 4.1 && e > 2.7) g.fillRect(x, y, 1, 1); }
  } else if (kind === 'square') {
    g.fillStyle = '#f7a6dc'; g.fillRect(5, 5, 7, 1); g.fillRect(5, 11, 7, 1); g.fillRect(5, 5, 1, 7); g.fillRect(11, 5, 1, 7);
  } else if (kind === 'tri') {
    g.fillStyle = '#5fe0b8';
    for (let k = 0; k < 6; k++) { g.fillRect(8 - k, 5 + k, 1, 1); g.fillRect(8 + k, 5 + k, 1, 1); } g.fillRect(3, 11, 11, 1);
  } else if (kind === 'xa' || kind === 'xb' || kind === 'xx' || kind === 'xy') {
    const L = { xa: ['A', '#6fe06f'], xb: ['B', '#ff6a5a'], xx: ['X', '#5aa8ff'], xy: ['Y', '#ffd23a'] }[kind];
    const t = textCanvas(L[0], { color: L[1], tight: true }); g.drawImage(t, Math.round((S - t.width) / 2) + 1, -2);
  } else if (kind === 'hand') {
    g.clearRect(0, 0, S, S);
    const H = ['....##.....', '...#ww#....', '...#ww#....', '...#ww###..', '...#ww#ww##', '.###ww#ww#w#', '#ww#wwwwwww#', '#wwwwwwwwww#', '.#wwwwwwwww#', '..#wwwwwww#.', '...#wwwwww#.', '...########.'];
    H.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '#') { g.fillStyle = '#0d1230'; g.fillRect(x + 3, y + 3, 1, 1); } else if (ch === 'w') { g.fillStyle = '#fff6dc'; g.fillRect(x + 3, y + 3, 1, 1); } }));
  }
  return c;
}

/** a row of pieces (canvases) laid out left to right with `gap`, vertically centred; returns a canvas */
export function rowCanvas(pieces, gap = 3) {
  const w = pieces.reduce((a, p) => a + p.width, 0) + gap * Math.max(0, pieces.length - 1), h = Math.max(...pieces.map((p) => p.height));
  const c = cnv(Math.max(1, w), Math.max(1, h)), g = c.getContext('2d'); let x = 0;
  for (const p of pieces) { g.drawImage(p, x, Math.round((h - p.height) / 2)); x += p.width + gap; }
  return c;
}

/** pixel pill box (cut corners) behind a content canvas: dark translucent body, light 1-px rim */
export function pillCanvas(content, o = {}) {
  const px = o.padX ?? 7, py = o.padY ?? 3, w = content.width + px * 2, h = content.height + py * 2;
  const c = cnv(w, h), g = c.getContext('2d');
  g.fillStyle = o.rim || '#fff3d6'; g.fillRect(2, 0, w - 4, h); g.fillRect(0, 2, w, h - 4); g.fillRect(1, 1, w - 2, h - 2);
  g.fillStyle = o.fill || 'rgba(16,20,52,.86)'; g.clearRect(2, 1, w - 4, h - 2); g.clearRect(1, 2, w - 2, h - 4);
  g.fillRect(2, 1, w - 4, h - 2); g.fillRect(1, 2, w - 2, h - 4);
  g.drawImage(content, px, py);
  return c;
}
