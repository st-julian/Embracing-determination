// mt/ui/title.js — the TITLE screen (state 'menu') as ONE pixel-art image. Owner: front-end screens.
//
// Everything visible is drawn on a single canvas at ART-PIXEL resolution and shown at an INTEGER device-px zoom Z
// (≈ 192–216 art rows tall, the Gen-5 top-screen scale), so the backdrop, the monsters, the logo and the text share
// one pixel grid, and every line in it is 1 art px (logo outlines, text strokes, sprite outlines, glyphs):
//   backdrop  concentric band "stage" (mt/ui/backdrop.js) in the spotlit monster's palette (fire / water / grass)
//   stage     the three starters (Cindle / Puddlet / Sproutle), "crisp" bakes (mt/ui/pixelclean.js crispSprite: flat
//             tone ramps, no specks, a clean 1-px outline; baked off-thread by title.worker.js); the spotlit one in full
//             colour at the stage scale, feet in the light pool under a cone; the rivals as FLAT one-tone near-black
//             silhouettes one raster step smaller, facing the centre. Cindle (warm palette) holds the spotlight for the
//             first 5.5 s, then it moves on every 5.5 s (palette cross-fade, sizes swap). Motes drift in the light.
//             Captures (software GL) run exactly this; only CSS animations are frozen there.
//   logo      SUNDERED VALE rasterised on the grid with 1-px lines (logo.js logoPixels thin), small, at the top
//   band      a translucent bottom band (Gen-5 menu text band) holding the ONE prompt "✕でスタート" / "タップでスタート" /
//             "Enter …" (pixel font 'Vale JP' set proportionally + a pixel glyph, gentle pulse) and, at its right end,
//             the language tab "◀ JA ▶" in the same font and scale
// The legacy title DOM (hud-*.js buildMenu) stays for input: its Play button and language picker are made invisible and
// laid exactly over the band (Play) and the tab (the picker's other-language option); pads use ✕ / Options /
// D-pad ← → (mt/ui/lobby.js), keys Enter / L / ← → (lobby.js, i18n dom.js). Layouts: 'center' (logo top, stage, band;
// 4:3) and 'side' (logo left, stage right, band; 16:9 / phones). The lobby reuses the backdrop (app.mtMenuGrid).
import { t, getLang, onLangChange } from '../i18n/index.js';
import { heroFrames } from './stage.js';
import { TITLE_CAST, TITLE_CRISP, TITLE_FRAMES, SIL_STEP } from './artspec.js';
import { silhouetteData } from './pixelclean.js';
import { logoPixels } from './logo.js';
import { drawBackdrop, drawSpot, Motes } from './backdrop.js';
import { textCanvas, glyphCanvas, rowCanvas, fontReady } from './pixeltext.js';

const CAST = TITLE_CAST;  // ids, palettes, silhouette tones (artspec.js; shared with the art baker)
const CRISP = TITLE_CRISP; // hero bake: flat tone ramps + a clean 1-art-px outline (pixelclean.js)
const BAND_H = 26;                      // bottom band (prompt + language tab), art px
const FIRST = 1;         // Cindle is spotlit first
const CYCLE = 5.5;       // seconds per spotlit starter
const MON_H = 50;        // tallest starter idle height at raster scale 1 (art px, incl. margin)

const PS = { // DualSense symbol SVGs (12×12) in the PlayStation colours
  0: '<path d="M3.2 3.2L8.8 8.8M8.8 3.2L3.2 8.8" stroke="#9cc0ff" stroke-width="1.7" stroke-linecap="round"/>',
  1: '<circle cx="6" cy="6" r="3.2" stroke="#ff8a8a" stroke-width="1.5" fill="none"/>',
  2: '<rect x="3.1" y="3.1" width="5.8" height="5.8" rx=".5" stroke="#f7a6dc" stroke-width="1.5" fill="none"/>',
  3: '<path d="M6 2.7L9.5 8.7H2.5Z" stroke="#5fe0b8" stroke-width="1.4" stroke-linejoin="round" fill="none"/>',
};
const XB = { 0: ['A', '#5fd35f'], 1: ['B', '#ff6a5a'], 2: ['X', '#5aa8ff'], 3: ['Y', '#ffd23a'] };
/** controller-first glyph chips (title + lobby). fam 'ps' | 'xbox' | 'kbm'; b = face index 0..3 or 'L1' 'R1' 'LS' 'DPAD' or a key label */
export function chip(fam, b) {
  if (fam === 'kbm') return `<i class="tg k">${b}</i>`;
  if (b === 'DPAD') return '<i class="tg dp"><svg viewBox="0 0 12 12"><path d="M4.6 1h2.8v10H4.6z" fill="#7f89b8"/><path d="M1 4.6h3.8v2.8H1zM7.2 4.6H11v2.8H7.2z" fill="#ffd23a"/><path d="M1.7 6l1.7-1v2zM10.3 6l-1.7-1v2z" fill="#1b2350"/></svg></i>';
  if (b === 'OPT') return '<i class="tg sh"><svg viewBox="0 0 12 12"><path d="M2.6 3.4h6.8M2.6 6h6.8M2.6 8.6h6.8" stroke="#e9edff" stroke-width="1.4" stroke-linecap="round"/></svg></i>';
  if (typeof b === 'number') {
    if (fam === 'xbox') return `<i class="tg xb" style="--c:${XB[b][1]}">${XB[b][0]}</i>`;
    return `<i class="tg ps"><svg viewBox="0 0 12 12">${PS[b]}</svg></i>`;
  }
  const lab = fam === 'xbox' ? ({ L1: 'LB', R1: 'RB', LS: 'LS' }[b] || b) : ({ LS: 'L' }[b] || b);
  return `<i class="tg ${b === 'LS' ? 'st' : 'sh'}">${lab}</i>`;
}
export const TOUCH_ICON = '<i class="tg tc"><svg viewBox="0 0 12 12"><path d="M4.5 1.6a1 1 0 0 1 2 0v3.6l2.9.6c.8.2 1.3 1 1.2 1.8L10.2 10.6H5L2.7 7.7a.95.95 0 0 1 1.4-1.3l.4.4z" fill="#1b2350"/></svg></i>';

const URLP = (() => { try { return new URLSearchParams(location.search); } catch { return new URLSearchParams(''); } })();

const cnv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

/**
 * rival silhouette of a frame: ONE flat near-black tone, no interior shading (Gen-5 starter screen). The mask is
 * tidied first (lone spur pixels dropped, 1-px notches filled) so the outline reads cleanly.
 */
function silhouette(f, tone) {
  if (f.sil && f.silTone === tone) return f.sil;   // baked with the atlas (stage.js) — else derive it once here
  const { w, h } = f, c = cnv(w, h), g = c.getContext('2d'); g.drawImage(f.c, 0, 0);
  g.putImageData(new ImageData(silhouetteData(g.getImageData(0, 0, w, h).data, w, h, tone), w, h), 0, 0);
  f.sil = c; f.silTone = tone;
  return c;
}

export class TitleScreen {
  constructor(ctx) {
    this.ctx = ctx; this.app = ctx.app; this.root = null; this.on = false; this.t = 0; this.key = '';
    this.app.mtTitle = this;
    let l = document.getElementById('mt-title-css');
    if (!l) { l = document.createElement('link'); l.id = 'mt-title-css'; l.rel = 'stylesheet'; l.href = new URL('./title.css', import.meta.url).href; document.head.appendChild(l); }
    this.cssReady = !!(l.sheet && l.sheet.cssRules && l.sheet.cssRules.length);
    l.addEventListener('load', () => { this.cssReady = true; this.key = ''; });
    l.addEventListener('error', () => { this.cssReady = true; });
    onLangChange(() => { this.key = ''; this.texts = null; });
    addEventListener('resize', () => { this.key = ''; this.fontVars(); });
    try { document.fonts && document.fonts.addEventListener('loadingdone', () => { this.texts = null; }); } catch { /* old browsers */ }
    this.fontVars();
    this.active = FIRST; this.prevActive = FIRST; this.fade = 1; this.spotX = null; this.backs = new Map(); this.motes = new Motes(12, 7);
    globalThis.__mtTitle = { ready: () => this.ready(), complete: () => this.complete(), lobbyReady: () => { const L = this.app.mtLobby; return !L || !L.artReady || L.artReady(); }, screen: this };
  }
  /** all six starter frame sets (big + silhouette size) have their first frame */
  artReady() { return !!(this.laid && this.frames && this.frames.every((e) => e.frames[0])); }
  ready() { return !!(this.artReady() && this.texts); }
  complete() { return !!(this.frames && this.frames.every((e) => e.got >= e.n)); }
  // NOTE: no capture-only composition. Software GL (html.mt-swgl) only freezes CSS animations; the canvas runs the
  // same clock, cycle, blink and twinkle as live play, so a capture at t s after the title appears = a live frame at t s.

  /**
   * Japanese pixel-font sizes for the DOM menu screens (lobby): whole multiples of the 16-px grid, never below ~11 CSS px.
   */
  fontVars() {
    const dpr = devicePixelRatio || 1, Hd = innerHeight * dpr;
    const m1 = Math.max(1, Math.ceil((11 * dpr) / 16 - 1e-6), Math.round((Hd * 0.018) / 16));
    const m2 = Math.max(1, Math.ceil((14 * dpr) / 16 - 1e-6), Math.round((Hd * 0.03) / 16));
    const de = document.documentElement.style;
    de.setProperty('--mt-j1', ((16 * m1) / dpr).toFixed(4) + 'px'); de.setProperty('--mt-j2', ((16 * m2) / dpr).toFixed(4) + 'px');
  }

  /** software WebGL (SwiftShader / llvmpipe): html.mt-swgl freezes CSS animations only (the canvas runs as live) */
  softGL() {
    if (this.sw != null) return this.sw;
    this.sw = false;
    try {
      const gl = this.app.pipeline && this.app.pipeline.renderer && this.app.pipeline.renderer.getContext();
      const ext = gl && gl.getExtension('WEBGL_debug_renderer_info');
      const r = gl ? String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER)) : '';
      this.sw = /swiftshader|llvmpipe|softpipe|software/i.test(r);
    } catch { /* no GL info */ }
    if (URLP.get('ttstatic') === '1') this.sw = true;
    document.documentElement.classList.toggle('mt-swgl', this.sw);
    return this.sw;
  }

  build() {
    if (this.root) return;
    this.softGL();
    const r = this.root = document.createElement('div'); r.id = 'mt-title'; r.setAttribute('aria-hidden', 'true');
    this.canvas = document.createElement('canvas'); this.canvas.className = 'tt-px'; r.appendChild(this.canvas);
    this.g = this.canvas.getContext('2d');
    const hud = document.getElementById('hud-root');
    if (hud && hud.parentNode) hud.parentNode.insertBefore(r, hud); else document.body.appendChild(r);
  }

  // ------------------------------------------------------------------ grid + layout (art px)
  grid(lobby) {
    const W = innerWidth, H = innerHeight, dpr = devicePixelRatio || 1, Wd = Math.round(W * dpr), Hd = Math.round(H * dpr);
    // title: ~200 art rows (Gen-5 top screen); lobby: ~384 rows — there the DOM text (16-px pixel font, 1 font px =
    // 1 art px), every panel stroke (1 art px) and the line-up sprites all share this one grid (lobby.js --u)
    const Z = Math.max(2, Math.round(Hd / (lobby ? 384 : 200)));
    const aw = Math.ceil(Wd / Z), ah = Math.ceil(Hd / Z);
    return { W, H, dpr, Z, aw, ah };
  }
  layoutNow(lobby) {
    const G = this.G = this.grid(lobby), { aw, ah, Z, dpr } = G;
    if (this.canvas.width !== aw) this.canvas.width = aw;
    if (this.canvas.height !== ah) this.canvas.height = ah;
    this.g.imageSmoothingEnabled = false;
    Object.assign(this.canvas.style, { width: (aw * Z) / dpr + 'px', height: (ah * Z) / dpr + 'px' });
    this.app.mtMenuGrid = { Z, dpr, aw, ah, lobby: !!lobby };
    this.backs.clear();
    if (lobby) { this.laid = true; return; }
    const side = URLP.get('ttl') ? URLP.get('ttl') === 'side' : aw / ah >= 1.5;
    this.side = side;
    // logo: the biggest letter size that fits its box; every outline line 1 art px (the scale of the text + sprites).
    // Stroke widths stay whole pixels (letter stroke = 2.5 units: u = 1.2 / 1.6 / 2 -> 3 / 4 / 5 px).
    const bandY = ah - BAND_H;
    const fit = side ? [aw * 0.33, bandY * 0.5] : [aw * 0.38, ah * 0.29];
    let logo = null;
    for (const [u1, u2] of [[2, 4], [1.6, 3.2], [1.2, 2.4], [1.2, 2]]) { const c = logoPixels(u1, u2, { thin: true, ext: Math.max(2, Math.round(u2)), close: 2 }); logo = c; if (c.width <= fit[0] && c.height <= fit[1]) break; }
    this.logo = logo;
    this.texts = null; this.makeTexts();
    const L = { bandY };
    L.promptCx = aw / 2;
    if (!side) {
      L.logo = [Math.round((aw - logo.width) / 2), 2];
      L.floor = bandY - 13;                               // pool centre = the hero's feet, clear of the band
      const top = L.logo[1] + logo.height + 6;            // breathing room under the logo
      L.S = Math.max(1, Math.min(2.5, Math.floor(((L.floor - top) / MON_H) * 4) / 4));
      L.cx = aw / 2; L.spread = Math.min(aw * 0.32, 62 * L.S); L.back = Math.round(26 * L.S);
    } else {
      const colX = aw * 0.21;
      L.logo = [Math.round(colX - logo.width / 2), Math.max(3, Math.round((bandY - logo.height) / 2))];
      L.floor = bandY - 12;
      const colR = L.logo[0] + logo.width + 4;            // the stage keeps clear of the logo column
      L.cx = Math.round((colR + aw) / 2 + 4);
      const room = aw - colR - 8;                        // three starters side by side, ~34 art px apart per scale unit
      const byH = (L.floor - 14) / MON_H, byW = room / (3 * 42);
      L.S = Math.max(1, Math.min(2.5, Math.floor(Math.min(byH, byW) * 4) / 4));
      L.spread = Math.min(room / 3, 46 * L.S); L.back = Math.round(18 * L.S);
    }
    this.L = L;
    // frames at the stage scale (clean shading, no rim: bold Gen-5 clusters). Every starter has two sizes: lit = L.S,
    // silhouette = one raster step (0.5) smaller; the spotlit one is drawn big, the other two small, swapping as the spotlight cycles.
    // Bake order: the opening composition first (Cindle big, the rivals small), then the rest.
    const sS = Math.max(1, L.S - SIL_STEP), bake = (i, s) => heroFrames(CAST[i].id, s, TITLE_FRAMES, 8, false, undefined, CRISP);
    const first = [bake(FIRST, L.S), ...CAST.map((m, i) => (i === FIRST ? null : bake(i, sS)))];
    this.big = CAST.map((m, i) => (i === FIRST ? first[0] : bake(i, L.S)));
    this.small = CAST.map((m, i) => (i === FIRST ? bake(i, sS) : first[i + 1]));
    this.frames = [...this.big, ...this.small];
    this.backs.clear();
    this.placeDom();
    this.laid = true;
  }
  /** text pieces (rebuilt on language / input-mode change and when the pixel font arrives) */
  makeTexts() {
    if (!fontReady()) { this.texts = null; return; }
    const { mode, fam } = this.inputMode();
    const shade = '#1a1430', light = '#fff6dc';
    const glyph = mode === 'touch' ? glyphCanvas('hand') : mode === 'kbm' ? glyphCanvas('key:Enter') : glyphCanvas(fam === 'xbox' ? 'xa' : 'cross');
    const raw = mode === 'touch' ? '\u0001' + t('title.tapStart') : t('title.pxStart', { g: '\u0001' });
    const parts = raw.split('\u0001').map((s) => s.trim());
    const pieces = [];
    // one pixel font at one scale (16-px 'Vale JP', 1 font px = 1 art px), set proportionally (even kana spacing)
    parts.forEach((s, i) => { if (i) pieces.push(glyph); if (s) pieces.push(textCanvas(s, { color: light, shadow: shade, drop: true, tight: true })); });
    if (mode === 'touch') pieces.shift();                 // the hand icon is not part of "タップでスタート"
    const prompt = rowCanvas(pieces, 2);
    // language tab: "◀ JA ▶" in the same font + scale, sitting in the band (D-pad ← → / tap to switch)
    const lab = textCanvas(getLang() === 'ja' ? 'JA' : 'EN', { color: light, shadow: shade, drop: true, tight: true });
    const arrow = (dir) => { const c = cnv(4, 7), g = c.getContext('2d'); g.fillStyle = '#ffd23a'; for (let k = 0; k < 4; k++) { const x = dir < 0 ? k : 3 - k; g.fillRect(x, 3 - k, 1, k * 2 + 1); } return c; };
    const chip = rowCanvas([arrow(-1), lab, arrow(1)], 3);
    this.texts = { prompt, chip, key: mode + fam + getLang() };
  }

  /** the legacy Play button and language picker, invisible, exactly over the prompt and the chip */
  placeDom() {
    const menu = document.querySelector('.sv-menu'); if (!menu || !this.G || !this.texts) return;
    const stageEl = document.querySelector('.sv-stage');
    let n = stageEl ? parseFloat(stageEl.style.getPropertyValue('--s')) : NaN; if (!(n > 0)) n = 1;
    const { Z, dpr } = this.G, k = Z / dpr / n;   // art px -> legacy design px
    const C = this.chipBox(), bY = this.L.bandY, { aw } = this.G;
    // Play = the band left of the language tab (a big target); the tab = the picker, whose CURRENT language option
    // collapses to zero width so a click / tap anywhere on "◀ JA ▶" switches to the other language
    const P = [0, bY, C[0] - 3, BAND_H], CT = [C[0] - 3, bY, aw - C[0] + 3, BAND_H];
    const set = (name, v) => menu.style.setProperty(name, v * k + 'px');
    set('--mt-px', P[0]); set('--mt-py', P[1]); set('--mt-pw', P[2]); set('--mt-ph', P[3]);
    set('--mt-cx', CT[0]); set('--mt-cy', CT[1]); set('--mt-cw', CT[2]); set('--mt-ch', CT[3]);
    menu.style.setProperty('--mt-cs', getLang() === 'ja' ? '0' : '1');
    menu.dataset.mtLayout = this.side ? 'side' : 'center';
    this.domKey = menu;
  }
  promptBox() { const p = this.texts.prompt, L = this.L; return [Math.round(L.promptCx - p.width / 2), L.bandY + Math.round((BAND_H - p.height) / 2), p.width, p.height]; }
  chipBox() { const c = this.texts.chip, L = this.L, { aw } = this.G; return [aw - c.width - 6, L.bandY + Math.round((BAND_H - c.height) / 2), c.width, c.height]; }

  inputMode() {
    let mode = this.app.mtInputMode || 'pad';
    const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
    const pads = this.app.mtPads && this.app.mtPads.pads;
    if (mode === 'pad' && coarse && !(pads && pads.length)) mode = 'touch';
    const fam = mode === 'pad' ? (this.app.mtLocals && this.app.mtLocals.lastPadGlyphs) || 'ps' : mode;
    return { mode, fam };
  }

  // ------------------------------------------------------------------ drawing
  back(pal) {
    let c = this.backs.get(pal);
    if (!c) { const { aw, ah } = this.G, L = this.L; c = drawBackdrop(aw, ah, pal, L ? L.cx : aw / 2, L ? L.floor - 2 : ah * 0.8); this.backs.set(pal, c); }
    return c;
  }
  draw(dt) {
    const g = this.g, { aw, ah } = this.G, L = this.L;
    // never an empty stage: the light pool, the cone and the starters fade in together (0.4 s) once ALL three
    // starters' art is there (pre-baked atlases: at once), and the spotlight clock only runs from then on —
    // Cindle (warm) for the first CYCLE s, then Sproutle, Puddlet, ...
    // (art there on the first title frame — the normal case with the baked atlases — shows the full stage at once)
    const ok = this.artReady();
    if (ok) { this.stageA = this.stageA == null ? 1 : Math.min(1, this.stageA + dt / 0.4); this.cycT = (this.cycT || 0) + dt; }
    else if (this.stageA == null) this.stageA = 0;
    const SA = ok ? this.stageA : 0;
    if (this.cycT > CYCLE) { this.cycT = 0; this.prevActive = this.active; this.active = (this.active + 1) % CAST.length; this.fade = 0; }
    this.fade = Math.min(1, this.fade + dt / 0.7);
    if (this.fade >= 1) this.prevActive = this.active;
    const pos = (i) => [Math.round(L.cx + (i - 1) * L.spread), L.floor - (i === 1 ? 0 : L.back)];
    const tx = pos(this.active)[0];
    this.spotX = this.spotX == null ? tx : this.spotX + (tx - this.spotX) * Math.min(1, dt * 4);
    const palA = CAST[this.active].pal, palB = CAST[this.prevActive].pal;
    g.globalAlpha = 1; g.drawImage(this.back(palB), 0, 0);
    if (this.fade < 1 && palA !== palB) { g.globalAlpha = this.fade; g.drawImage(this.back(palA), 0, 0); g.globalAlpha = 1; } else if (palA !== palB) g.drawImage(this.back(palA), 0, 0);
    const fy = pos(this.active)[1];
    if (SA > 0) drawSpot(g, palA, this.spotX, fy, Math.round(15 * L.S), Math.round(28 * L.S), SA);
    this.motes.update(dt, aw, ah); this.motes.draw(g, palA);
    // starters: rivals first (behind), the spotlit one last
    const order = [0, 2, 1].sort((a, b) => (a === this.active) - (b === this.active));
    for (const i of order) {
      if (SA <= 0) break;
      const lit = i === this.active ? this.fade : i === this.prevActive && this.fade < 1 ? 1 - this.fade : 0;
      // idle frame: 8 fps, starters 3 frames apart, phase centred so t = whole seconds sits mid-frame
      const pick = (e) => { const f0 = e.frames[0]; return f0 && (e.frames[Math.floor(this.t * 8 + i * 3 + 0.5) % e.n] || f0); };
      const fb = pick(this.big[i]), fs = pick(this.small[i]);
      const [x, y] = pos(i), flip = i === 0;   // both rivals face the centre
      const draw = (src, f) => { if (flip) { g.save(); g.translate(x * 2, 0); g.scale(-1, 1); g.drawImage(src, x - f.ax, y - f.ay); g.restore(); } else g.drawImage(src, x - f.ax, y - f.ay); };
      if (lit < 1 && fs) { g.globalAlpha = SA; draw(silhouette(fs, CAST[i].sil), fs); }
      const f = fb;
      if (lit > 0 && f) {
        // contact shadow on the pool, then the sprite
        g.globalAlpha = 0.35 * lit * SA; g.fillStyle = '#3a1c0c';
        const sw = Math.round(f.w * 0.3), sh = Math.max(2, Math.round(sw * 0.25));
        for (let j = -sh; j <= sh; j++) { const w = Math.round(sw * Math.sqrt(1 - (j * j) / (sh * sh))); g.fillRect(x - w, y + j, w * 2 + 1, 1); }
        g.globalAlpha = lit * SA; draw(f.c, f);
      }
      g.globalAlpha = 1;
    }
    // logo + twinkle
    g.drawImage(this.logo, L.logo[0], L.logo[1]);
    { // sparkle for 0.8 s of every 3.2 s (t mod 3.2 in [1.6, 2.4))
      const tw = ((this.t + 1.6) % 3.2) / 3.2;
      if (tw < 0.25) { const k = tw < 0.12 ? 2 : 1, sx = L.logo[0] + this.logo.width - 8, sy = L.logo[1] + 6; g.fillStyle = '#fff'; g.fillRect(sx - k, sy, k * 2 + 1, 1); g.fillRect(sx, sy - k, 1, k * 2 + 1); }
    }
    // bottom band (Gen-5 menu text band): translucent dark, 1-px darker top line; prompt centred, language tab right
    g.globalAlpha = 0.5; g.fillStyle = '#140f2c'; g.fillRect(0, L.bandY, aw, BAND_H);
    g.globalAlpha = 0.35; g.fillRect(0, L.bandY, aw, 1); g.globalAlpha = 1;
    if (this.texts) {
      const P = this.promptBox(), C = this.chipBox();
      g.globalAlpha = 0.8 + 0.2 * (0.5 + 0.5 * Math.cos(this.t * 3.4));   // a gentle pulse, never faded out
      g.drawImage(this.texts.prompt, P[0], P[1]);
      g.globalAlpha = 1; g.drawImage(this.texts.chip, C[0], C[1]);
    }
  }
  /** lobby: the same grid, lobby palette, no stage */
  drawLobby(dt) {
    const g = this.g, { aw, ah } = this.G;
    let c = this.backs.get('lobby:');
    if (!c) { c = drawBackdrop(aw, ah, 'lobby', aw / 2, ah * 0.46, { asp: 0.5 }); this.backs.set('lobby:', c); }
    g.globalAlpha = 1; g.drawImage(c, 0, 0);
    // a soft spotlight from the top centre onto the arena floor (between the two teams) + drifting motes
    drawSpot(g, 'lobby', Math.round(aw / 2), Math.round(ah * 0.5), Math.round(aw * 0.05), Math.round(aw * 0.2), 0.55);
    if (!this.lmotes) this.lmotes = new Motes(26, 11);
    this.lmotes.update(dt, aw, ah); this.lmotes.draw(g, 'lobby', 0.9);
  }

  update(f) {
    const dt = Math.min(0.1, f.dt || 0);
    const menu = f.state === 'menu', lobby = f.state === 'lobby', vis = menu || lobby;
    if (vis && !this.root) this.build();
    if (!this.root) return;
    if (vis !== this.on || lobby !== this.inLobby) {
      this.on = vis; this.inLobby = lobby;
      this.root.classList.toggle('on', vis); this.root.classList.toggle('lobby', lobby);
      if (menu) { this.key = ''; this.t = 0; this.active = FIRST; this.prevActive = FIRST; this.fade = 1; this.cycT = 0; this.stageA = null; this.spotX = null; }
    }
    document.documentElement.classList.toggle('mt-title-on', menu);
    if (!vis) { if (this.root.style.display !== 'none') { this.offT = (this.offT || 0) + dt; if (this.offT > 0.6) this.root.style.display = 'none'; } return; }
    this.offT = 0; if (this.root.style.display === 'none') this.root.style.display = '';
    if (!this.cssReady) { try { const l = document.getElementById('mt-title-css'); if (l && l.sheet && l.sheet.cssRules.length) this.cssReady = true; } catch { this.cssReady = true; } if (!this.cssReady) return; }
    this.t += dt;
    const gk = innerWidth + 'x' + innerHeight + '@' + (devicePixelRatio || 1) + (lobby ? 'L' : 'T');
    if (gk !== this.key) { this.key = gk; this.layoutNow(lobby); }
    if (lobby) { this.drawLobby(dt); return; }
    const { mode, fam } = this.inputMode();
    if (!this.texts || this.texts.key !== mode + fam + getLang()) { this.makeTexts(); this.placeDom(); }
    const menuEl = document.querySelector('.sv-menu');
    if (menuEl && menuEl !== this.domKey) this.placeDom();
    this.draw(dt);
  }
  dispose() { if (this.root) this.root.remove(); }
}
