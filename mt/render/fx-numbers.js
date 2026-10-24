// mt/render/fx-numbers.js — pixel-font floating combat text for monster fights: damage numbers coloured by
// effectiveness ("SUPER EFFECTIVE!" gold + big, "NOT VERY EFFECTIVE..." grey + small), crits, damage taken by your
// monster, heals, and short world callouts ("LEVEL UP!", "GOTCHA!"). Canvas2D layer inside #overlay-root (under the
// HUD), glyphs pre-rendered at 1 px per font pixel and scaled with nearest-neighbour => crisp Gen-5 pixel text.
// Owner: VFX specialist. (Legacy overlays still draws the trainer's own sling numbers.)
// [HUD edit, authorised by the orchestrator] glyphs now come from the shared HUD pixel fonts ('Vale Pixel' /
// 'Vale Pixel Bold', 1 font px = 1 bitmap px) and Japanese from the i18n agent's 'Vale JP' faces at their native
// 16 px grid, so in-world text matches the HUD and Japanese callouts render; callouts are translated via mt/ui/tr.js.

import { o as heightAt } from '../../assets/height-CVtQdZ3e.js';
import { tr } from '../ui/tr.js';

const JA = /[\u2015-\u201f\u2025\u203b\u25a1\u25b3\u25cb\u2715\u266a\u3000-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff00-\uffef]/;
/** English callout literals used by fx.js / fx-moments.js -> localized text */
function localize(text) {
  if (text === 'SUPER EFFECTIVE!') return tr('callout.super', "It's super effective!").toUpperCase();
  if (text === 'NOT VERY EFFECTIVE...' || text === 'NOT VERY EFFECTIVE\u2026') return tr('callout.weak', 'Not very effective\u2026').toUpperCase();
  if (text === 'CRITICAL!') return tr('fx.crit', 'CRITICAL!');
  const m = /^LV (\d+)!$/.exec(text); if (m) return tr('fx.level', 'LV {n}!', { n: m[1] });
  if (text === 'GOTCHA!') return tr('banner.gotcha', 'Gotcha!').toUpperCase();
  return text;
}

// bold digits (6×7) + symbols
const D = {
  0: ['011110', '110011', '110111', '111011', '110011', '110011', '011110'],
  1: ['001100', '011100', '111100', '001100', '001100', '001100', '111111'],
  2: ['011110', '110011', '000011', '000110', '001100', '011000', '111111'],
  3: ['111110', '000011', '000011', '011110', '000011', '000011', '111110'],
  4: ['000110', '001110', '011110', '110110', '111111', '000110', '000110'],
  5: ['111111', '110000', '111110', '000011', '000011', '110011', '011110'],
  6: ['011110', '110000', '110000', '111110', '110011', '110011', '011110'],
  7: ['111111', '000011', '000110', '001100', '011000', '011000', '011000'],
  8: ['011110', '110011', '110011', '011110', '110011', '110011', '011110'],
  9: ['011110', '110011', '110011', '011111', '000011', '000011', '011110'],
  '+': ['000000', '001100', '001100', '111111', '001100', '001100', '000000'],
  '-': ['000000', '000000', '000000', '111111', '000000', '000000', '000000'],
};
// light caps (5×7)
const L = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'], B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'], D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'], F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01111', '10000', '10000', '10111', '10001', '10001', '01111'], H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['111', '010', '010', '010', '010', '010', '111'], J: ['00111', '00010', '00010', '00010', '10010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'], L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'], N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'], P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'], R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'], T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'], V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '10101', '01010'], X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'], Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  ' ': ['00', '00', '00', '00', '00', '00', '00'], '!': ['11', '11', '11', '11', '11', '00', '11'], '.': ['0', '0', '0', '0', '0', '0', '1'],
  '0': ['01110', '10011', '10101', '10101', '10101', '11001', '01110'], '1': ['010', '110', '010', '010', '010', '010', '111'],
  '2': ['01110', '10001', '00001', '00110', '01000', '10000', '11111'], '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['10010', '10010', '10010', '11111', '00010', '00010', '00010'], '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['01110', '10000', '10000', '11110', '10001', '10001', '01110'], '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'], '9': ['01110', '10001', '10001', '01111', '00001', '00001', '01110'],
  '+': ['000', '010', '010', '111', '010', '010', '000'],
};

/** style: [top, bottom, outline, bold, scale, life] */
const STYLE = {
  dmg: ['#ffffff', '#ffd98a', '#2a1606', true, 2, 0.7],
  super: ['#fff8b8', '#ffa21a', '#4a1e00', true, 3, 0.85],
  weak: ['#eef0f6', '#9aa0b2', '#2c3038', true, 2, 0.6],
  crit: ['#fff2c4', '#ff4a1e', '#3a0600', true, 3, 0.8],
  taken: ['#ffe0d8', '#ff4838', '#3a0606', true, 2, 0.6],
  heal: ['#f0ffe8', '#3ad860', '#06300e', true, 2, 0.75],
  tagSuper: ['#fffbe0', '#ffc02a', '#5a2800', false, 2, 0.95],
  tagWeak: ['#f0f2f8', '#a8aec0', '#30343c', false, 2, 0.8],
  tagCrit: ['#ffffff', '#ff7a2a', '#3a0800', false, 2, 0.8],
  level: ['#fffbd8', '#ffc828', '#1a2a6a', false, 2, 1.3],
  gotcha: ['#ffffff', '#7ae8ff', '#0e2a6a', false, 3, 1.4],
  info: ['#ffffff', '#d8e4ff', '#1a2a5a', false, 2, 1.0],
};

/** size per style in font-pixel scale at 1080p (integer device px per font px; 720p ≈ 2/3) */
const SIZE = { dmg: 2, weak: 2, taken: 2, heal: 2, crit: 3, super: 3, tagSuper: 2, tagWeak: 2, tagCrit: 2, level: 2, gotcha: 3, info: 2 };
/** styles whose rapid ticks on one target merge into a single rising total */
const MERGE = { dmg: 1, weak: 1, taken: 1, heal: 1 };

function hex(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }

export class FxNumbers {
  constructor(ctx) {
    this.ctx = ctx; this.cache = new Map(); this.items = []; this.max = 48; this.v = null; this.stackT = new Map();
    this.cv = document.createElement('canvas'); this.cv.className = 'mt-fx-text';
    this.cv.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:1;image-rendering:pixelated';
    (document.getElementById('overlay-root') || document.body).appendChild(this.cv);
    this.g = this.cv.getContext('2d');
    globalThis.__mtOwnNumbers = true;   // [HUD] legacy overlay combat text is off ([MT-HOOK] mtOwnNumbers); trainer hits are drawn here
    this.healT = new Map();
  }
  /** [HUD] trainer sling hits / damage taken by local trainers (the legacy overlay used to draw these). */
  trainerHits(f) {
    const w = f.world; if (!w || !f.events) return;
    const app = f.app || this.ctx.app, locals = app && app.locals && app.locals.length ? app.locals.map((l) => l.unitId) : [f.playerId];
    for (const ev of f.events) {
      if (ev.type !== 'hit' || !(ev.amount >= 1)) continue;
      const src = w.units.get(ev.src), tgt = w.units.get(ev.tgt);
      if (!tgt) continue;
      const mine = src && src.mtTrainer && locals.includes(src.id), hurt = tgt.mtTrainer && locals.includes(tgt.id);
      if (!mine && !hurt) continue;
      const x = tgt.x, z = tgt.y, y0 = heightAt(x, z) + (tgt.height || 1.6) + 0.1;
      this.spawn(String(Math.round(ev.amount)), hurt ? 'taken' : ev.crit ? 'crit' : 'dmg', x, z, y0, { tgt: tgt.id, now: w.time, amount: ev.amount, h: tgt.height || 1.6 });
    }
  }
  glyphs(text, bold) {
    const out = [];
    for (const ch of String(text).toUpperCase()) out.push(bold && D[ch] ? D[ch] : L[ch] || D[ch] || L[' ']);
    return out;
  }
  /** Pre-render a string in a style at 1 px / font pixel (with outline + shadow). */
  bitmap(text, style) {
    const key = style + '|' + text; let c = this.cache.get(key); if (c) return c;
    const S = STYLE[style] || STYLE.dmg, bold = S[3] || style.startsWith('tag') || style === 'level' || style === 'gotcha';
    // 1) rasterise the string as a 1-bit mask: Latin from Vale Pixel (10 px em = 1 font px per px, cap 7, baseline 8),
    //    Japanese from Vale JP (16 px Unifont grid, baseline 14); both share one baseline row.
    const latF = `10px '${bold ? 'Vale Pixel Bold' : 'Vale Pixel'}'`, jaF = `16px '${bold ? 'Vale JP Bold' : 'Vale JP'}', 'Vale JP'`;
    const hasJa = JA.test(text), str = hasJa ? String(text) : String(text).toUpperCase();
    const ready = document.fonts ? document.fonts.check(latF) && (!hasJa || document.fonts.check(jaF)) : true;
    const tmp = this.tmp || (this.tmp = document.createElement('canvas')), tg = tmp.getContext('2d', { willReadFrequently: true });
    const base = hasJa ? 15 : 9, MH = hasJa ? 18 : 11;
    let w = 0; const runs = [];
    for (const ch of str) { const ja = JA.test(ch); tg.font = ja ? jaF : latF; const adv = Math.round(tg.measureText(ch).width); runs.push([ch, ja, w]); w += adv + (ja ? 0 : 0); }
    const W = Math.max(1, w) + 4, H = MH + 4;
    tmp.width = W; tmp.height = H; tg.clearRect(0, 0, W, H); tg.fillStyle = '#fff'; tg.textBaseline = 'alphabetic';
    for (const [ch, ja, x] of runs) { tg.font = ja ? jaF : latF; tg.fillText(ch, 2 + x, 2 + base); }
    const a = tg.getImageData(0, 0, W, H).data, on = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) on[i] = a[i * 4 + 3] >= 128 ? 1 : 0;
    // 2) style: outline (8-neighbour), soft shadow, 2-tone vertical gradient with a highlight band
    c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'), img = g.createImageData(W, H), d = img.data;
    const top = hex(S[0]), bot = hex(S[1]), ol = hex(S[2]);
    const put = (i, col, al = 255) => { d[i * 4] = col[0]; d[i * 4 + 1] = col[1]; d[i * 4 + 2] = col[2]; d[i * 4 + 3] = al; };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x; if (on[i]) continue;
      let n = false; for (let dy = -1; dy <= 1 && !n; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < W && yy < H && on[yy * W + xx]) { n = true; break; } }
      if (n) put(i, ol); else if (y > 1 && x > 1 && on[(y - 2) * W + x - 1]) put(i, ol, 150);
    }
    let y0 = H, y1 = 0; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (on[y * W + x]) { if (y < y0) y0 = y; if (y > y1) y1 = y; }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x; if (!on[i]) continue;
      const k = (y - y0) / Math.max(1, y1 - y0), c3 = k < 0.45 ? top : k < 0.6 ? [(top[0] + bot[0]) >> 1, (top[1] + bot[1]) >> 1, (top[2] + bot[2]) >> 1] : bot;
      put(i, c3);
    }
    g.putImageData(img, 0, 0);
    c.lw = W; c.lh = H;
    if (ready) { this.cache.set(key, c); if (this.cache.size > 400) this.cache.delete(this.cache.keys().next().value); }
    return c;
  }
  /**
   * spawn text beside a world point (sim x,y; y0 = top of the target). o: {tgt, now, h (target height), amount, big, life,
   * rise, delay, shake, tag, small}. Rapid hits of the same style on the same target merge into one rising total.
   */
  spawn(text, style, x, z, y0, o = {}) {
    text = localize(String(text));
    // [HUD] no '+N' heal spam: during fights (HUD plates report one) and at most one per target per 1.5 s
    if (style === 'heal') {
      const fight = globalThis.__mtFight && globalThis.__mtFight(), k = o.tgt ?? -1, now = o.now || 0, last = this.healT.get(k);
      if (fight || (last != null && now - last < 1.5)) return;
      this.healT.set(k, now);
    }
    if (JA.test(text)) o = { ...o, small: true };   // 16 px Japanese glyphs: half the scale of 7 px Latin caps
    const S = STYLE[style] || STYLE.dmg;
    const tgt = o.tgt ?? -1, amt = o.amount;
    // merge: a number of the same style on the same target younger than 0.35 s absorbs this one (ticks -> one total)
    if (tgt >= 0 && Number.isFinite(amt) && MERGE[style]) {
      for (const it of this.items) if (it.tgt === tgt && it.style === style && it.age < 0.35 && Number.isFinite(it.amount)) {
        it.amount += amt; it.text = String(Math.round(it.amount)); it.age = Math.min(it.age, 0.12); it.life = Math.max(it.life, S[5]); it.pop = 0.06; return;
      }
    }
    if (this.items.length >= this.max) this.items.shift();
    // slot: lateral lanes beside the target (alternating sides), first free one wins
    let slot = 0;
    if (tgt >= 0) { const used = new Set(); for (const it of this.items) if (it.tgt === tgt && it.age < it.life * 0.8) used.add(it.slot); while (used.has(slot) && slot < 5) slot++; }
    const big = style === 'crit' || style === 'super';
    this.items.push({ text, style, x, z, y0, h: o.h || 1.2, tgt, slot, amount: amt, age: 0, life: (o.life || S[5]), size: (o.small ? 1 : SIZE[style] || 2) + (o.big || 0),
      dx: o.dx, dy: o.dy, rise: o.rise ?? (big ? 18 : 14), delay: o.delay || 0, shake: o.shake || 0, tag: !!o.tag, pop: big ? 0.08 : 0.04 });
  }
  update(f, dt, camera) {
    try { this.trainerHits(f); } catch (e) { /* never break VFX */ }
    const cv = this.cv, g = this.g;
    const dpr = Math.min(2, window.devicePixelRatio || 1), W = Math.round(window.innerWidth * dpr), H = Math.round(window.innerHeight * dpr);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    if (!this.items.length) { if (this.dirty) { g.clearRect(0, 0, W, H); this.dirty = false; } return; }
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H); g.imageSmoothingEnabled = false; this.dirty = true;
    const T = this.ctx.THREE; if (!this.v) { this.v = new T.Vector3(); this.v2 = new T.Vector3(); }
    const v = this.v, v2 = this.v2, k1080 = H / 1080, unit = Math.max(1, Math.round(H / 540));
    const plates = globalThis.__mtPlateRects ? globalThis.__mtPlateRects() : null;
    const placed = [];
    let w = 0;
    // big numbers first so small ones fan out around them
    const order = this.items.slice().sort((a, b) => (b.size - a.size) || (a.age - b.age));
    const keep = new Set();
    for (const it of order) {
      if (it.delay > 0) { it.delay -= dt; keep.add(it); continue; }
      it.age += dt; if (it.age >= it.life) continue; keep.add(it);
      v.set(it.x, it.y0, it.z).project(camera); if (v.z > 1) continue;
      v2.set(it.x, it.y0 - it.h, it.z).project(camera);
      const k = it.age / it.life;
      const sx = (v.x * 0.5 + 0.5) * W, sy = (-v.y * 0.5 + 0.5) * H, foot = (-v2.y * 0.5 + 0.5) * H, bodyH = Math.max(8, foot - sy);
      // integer device-pixel scale per font pixel, sized for the ~0.5x world plates (1080p: normal 2, crit/super 3)
      const sc = Math.max(1, Math.round(it.size * k1080)) + (it.age < it.pop ? 1 : 0);
      const bm = this.bitmap(it.text, it.style), bw = bm.lw * sc, bh = bm.lh * sc;
      // lanes beside the body (never over it): slot 0 right, 1 left, 2 upper-right, 3 upper-left, 4 above
      const side = it.slot === 4 ? 0 : (it.slot % 2 ? -1 : 1), lift = it.slot >= 2 ? (it.slot === 4 ? bodyH * 0.55 + bh : bh * 0.9) : 0;
      const lateral = side * (bodyH * 0.42 + 4 * unit) + (it.dx ? it.dx * unit : 0);
      const rise = (1 - Math.pow(1 - Math.min(1, k * 1.8), 3)) * it.rise * unit;
      let px = Math.round(sx + lateral - (side < 0 ? bw : side > 0 ? 0 : bw / 2)), py = Math.round(sy + bodyH * 0.25 - lift - rise - bh + (it.dy ? it.dy * unit : 0));
      if (it.shake && it.age < 0.2) px += Math.round(Math.sin(it.age * 90) * unit);
      // never cover a plate ([HUD] __mtPlateRects) or another number: hop up/out until free
      const hits = (x0, y0) => { if (plates) for (const r of plates) if (x0 < r[2] && x0 + bw > r[0] && y0 < r[3] && y0 + bh > r[1]) return r; for (const r of placed) if (x0 < r[2] && x0 + bw > r[0] && y0 < r[3] && y0 + bh > r[1]) return r; return null; };
      for (let pass = 0; pass < 6; pass++) {
        const r = hits(px, py); if (!r) break;
        if (pass % 2 === 0) { const nx = side < 0 ? r[0] - bw - 2 : r[2] + 2; if (nx >= 0 && nx + bw <= W) { px = Math.round(nx); continue; } }
        py = Math.round(r[1] - bh - 2);
      }
      placed.push([px, py, px + bw, py + bh]);
      g.globalAlpha = k > 0.75 ? Math.max(0, (1 - k) / 0.25) : 1;
      g.drawImage(bm, px, py, bw, bh);
    }
    for (const it of this.items) if (keep.has(it)) this.items[w++] = it;
    this.items.length = w; g.globalAlpha = 1;
  }
  clear() { this.items.length = 0; this.stackT.clear(); }
  dispose() { this.cv.remove(); }
}

export { heightAt };
