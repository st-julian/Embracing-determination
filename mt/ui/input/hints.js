// mt/ui/input/hints.js — first-match controls overlay (controller-first, localized). Owner: input specialist.
//
// Shown once per browser (localStorage 'mt.hints.v1') ~1 s into the first match, for the screen's current input family:
// DualSense / Xbox glyph map (default), touch guide (after a touch) or keys (after a real key press). It follows a mode
// switch while open. Dismiss: any pad ✕ / ○ / Options, a tap / click on it, any key — or it fades after 16 s.
// It starts below the HUD top bar (app.mtHudInsets.top) and is hidden (not dismissed) while a panel is open, the game
// is paused or the state is not 'game', so it never covers the pause menu / scoreboard.
// ?hints=1 forces it (screenshots), ?hints=0 never shows it.

import { t } from '../../i18n/index.js';
import { BTN, readPads } from './devices.js';

const KEY = 'mt.hints.v1';
const AUTO_CLOSE = 16;

const CSS = `
#mt-hints{position:fixed;left:3vw;top:max(14%,calc(env(safe-area-inset-top,0px) + 56px));width:min(94vw,700px);box-sizing:border-box;z-index:7;pointer-events:auto;display:none;
  background:linear-gradient(#fffaf0,#f3ead2);border:3px solid #1b2350;border-radius:16px;box-shadow:0 6px 0 rgba(14,18,44,.45),0 16px 40px rgba(0,0,0,.35);
  padding:10px 16px 10px;color:#1b2350;font:800 14px/1.3 system-ui,-apple-system,"Segoe UI",sans-serif;opacity:0;transition:opacity .35s;
  -webkit-user-select:none;user-select:none;-webkit-touch-callout:none;touch-action:none}
#mt-hints.on{display:block}#mt-hints.vis{opacity:1}#mt-hints.hold{display:none}
#mt-hints h3{margin:0 0 6px;font-size:16px;letter-spacing:.5px;display:flex;align-items:center;gap:8px}
#mt-hints h3:before{content:"";width:18px;height:18px;border-radius:50%;background:linear-gradient(#5fe0e8 0 46%,#0c1230 46% 54%,#2a3466 54%);border:2px solid #0c1230;flex:none}
#mt-hints .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px 18px}
#mt-hints .r{display:flex;align-items:center;gap:7px;min-width:0;line-height:1.2}
#mt-hints .r span:last-child{min-width:0}
#mt-hints .gs{display:inline-flex;gap:3px;flex:none;min-width:56px;justify-content:flex-end}
#mt-hints .g{display:inline-grid;place-items:center;min-width:22px;height:22px;padding:0 5px;border-radius:11px;background:#1b2350;color:#fff;font-size:12px;font-weight:900;box-sizing:border-box}
#mt-hints .g.k{border-radius:5px;background:#fff;color:#1b2350;border:2px solid #1b2350}
#mt-hints .g.t{border-radius:6px;background:#3fb64a;border:2px solid #1b2350}
#mt-hints .g.ps0{color:#8fb4ff}#mt-hints .g.ps1{color:#ff7b86}#mt-hints .g.ps2{color:#f6a3e6}#mt-hints .g.ps3{color:#4fe0b0}
#mt-hints .g.x0{background:#3fb64a}#mt-hints .g.x1{background:#e8574f}#mt-hints .g.x2{background:#4f8fe8}#mt-hints .g.x3{background:#e8b82a}
#mt-hints .ft{margin-top:8px;text-align:center;font-size:12px;color:#56608a}
html.lang-ja #mt-hints{font-family:'Vale JP',system-ui,sans-serif;font-weight:400}
html.lang-ja #mt-hints *{font-weight:400!important}
@media (max-height:430px){#mt-hints{top:calc(env(safe-area-inset-top,0px) + 8px);padding:7px 12px;font-size:12px}#mt-hints h3{font-size:14px;margin-bottom:3px}#mt-hints .grid{gap:2px 14px}#mt-hints .g{height:19px;min-width:19px;font-size:11px}#mt-hints .ft{margin-top:4px}}
`;

const PSF = ['✕', '○', '□', '△'], XBF = ['A', 'B', 'X', 'Y'];
const SH = { ps: { 4: 'L1', 5: 'R1', 6: 'L2', 7: 'R2', 9: 'Options', 12: '↑', 13: '↓', 14: '←', 15: '→', ls: 'L', rs: 'R' }, xbox: { 4: 'LB', 5: 'RB', 6: 'LT', 7: 'RT', 9: 'Menu', 12: '↑', 13: '↓', 14: '←', 15: '→', ls: 'LS', rs: 'RS' } };
function g(fam, b) {
  if (fam === 'kbm') return `<span class="g k">${b}</span>`;
  if (fam === 'touch') return `<span class="g t">${b}</span>`;
  if (typeof b === 'number' && b < 4) return fam === 'xbox' ? `<span class="g x${b}">${XBF[b]}</span>` : `<span class="g ps${b}">${PSF[b]}</span>`;
  return `<span class="g">${SH[fam === 'xbox' ? 'xbox' : 'ps'][b] || b}</span>`;
}

/** [glyphs..., i18n key] rows per input family */
function rows(fam) {
  if (fam === 'touch') return [
    [g('touch', '◐'), 'hint.t.move'], [g('touch', '⚔'), 'hint.t.attack'],
    [g('touch', '①②'), 'hint.t.moves'], [g('touch', '◎'), 'hint.t.capture'],
    [g('touch', '⌖'), 'hint.t.target'], [g('touch', '★'), 'hint.t.evolve'],
    [g('touch', '⇆'), 'hint.t.swap'], [g('touch', '▣'), 'hint.t.map'],
  ];
  if (fam === 'kbm') return [
    [g('kbm', 'RMB') + g('kbm', 'WASD'), 'hint.k.move'], [g('kbm', 'Space'), 'hint.attack'],
    [g('kbm', 'Q') + g('kbm', 'W'), 'hint.moves'], [g('kbm', 'E'), 'hint.capture'],
    [g('kbm', 'F'), 'hint.swap'], [g('kbm', 'R') + g('kbm', 'D'), 'hint.skillPotion'],
    [g('kbm', 'T'), 'hint.evolve'], [g('kbm', 'Tab'), 'hint.target'],
  ];
  return [
    [g(fam, 'ls'), 'hint.p.move'], [g(fam, 0), 'hint.attack'],
    [g(fam, 2) + g(fam, 3), 'hint.moves'], [g(fam, 1), 'hint.capture'],
    [g(fam, 4), 'hint.swap'], [g(fam, 5) + g(fam, 6), 'hint.skillPotion'],
    [g(fam, 12), 'hint.evolve'], [g(fam, 7) + g(fam, 'rs'), 'hint.target'],
  ];
}

export class FirstMatchHints {
  constructor(ctx, locals) {
    this.app = ctx.app; this.locals = locals; this.t = 0; this.shown = false; this.open = false; this.fam = '';
    const p = this.app.params && this.app.params.get ? this.app.params.get('hints') : null;
    this.force = p === '1'; this.never = p === '0';
    if (typeof document === 'undefined') return;
    const st = document.createElement('style'); st.id = 'mt-hints-css'; st.textContent = CSS; document.head.appendChild(st);
    this.el = document.createElement('div'); this.el.id = 'mt-hints'; document.body.appendChild(this.el);
    this.el.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); this.close(); });
    this.onKey = (e) => { if (this.open && e.isTrusted !== false) this.close(); };
    addEventListener('keydown', this.onKey, true);
    this.prev = new Map();
  }
  seen() { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } }
  family() {
    const m = this.app.mtInputMode;
    if (m === 'touch' || m === 'kbm') return m;
    const L = this.app.locals || [], pad = L.find((l) => l.device && l.device.startsWith('pad:'));
    return (pad && pad.padGlyphs) || this.locals.lastPadGlyphs || 'ps';
  }
  render() {
    const fam = this.family(); this.fam = fam;
    const close = fam === 'touch' ? t('hint.close.touch') : fam === 'kbm' ? t('hint.close.kbm') : t('hint.close.pad', { g: g(fam, 0) });
    this.el.innerHTML = `<h3>${t('hint.title')}</h3><div class="grid">${rows(fam).map(([gs, k]) => `<div class="r"><span class="gs">${gs}</span><span>${t(k)}</span></div>`).join('')}</div><div class="ft">${close}</div>`;
  }
  show() {
    this.shown = true; this.open = true; this.t = 0; this.render();
    this.el.classList.add('on'); requestAnimationFrame(() => this.el.classList.add('vis'));
  }
  close() {
    if (!this.open) return;
    this.open = false; try { localStorage.setItem(KEY, '1'); } catch { /* private mode */ }
    this.el.classList.remove('vis'); setTimeout(() => { if (!this.open) this.el.classList.remove('on'); }, 360);
  }
  /** Start below the HUD top bar (app.mtHudInsets.top) and the notch. */
  place() {
    const app = this.app, ins = app.mtHudInsets, H = innerHeight || 1;
    const q = app.params && app.params.get && app.params.get('mtsafe');
    const st = q ? (+String(q).split(',')[1] || 0) : 0;
    const top = Math.round(Math.max(ins && ins.top > 0 ? ins.top * H + 8 : H * 0.12, st + 8));
    const v = top + 'px'; if (this.el.style.top !== v) this.el.style.top = v;
    // horizontally: between the top-left buttons (touch RECALL / REGROUP, HUD Menu / Scores) and the minimap
    const W = innerWidth || 1;
    let lo = 8, hi = W - 8;
    const zones = app.mtHud && app.mtHud.touchZones ? app.mtHud.touchZones() : null, mm = zones && zones.minimap;
    if (mm && mm.width > 0 && mm.bottom > top) hi = Math.min(hi, mm.left - 10);
    const rs = (app.mtTouch && app.mtTouch.active && app.mtTouch.rects ? app.mtTouch.rects() : []).concat(zones && zones.buttons ? zones.buttons.filter(Boolean) : []);
    for (const r of rs) if (r && r.width > 0 && r.left < W * 0.3 && r.bottom > top && r.top < top + 140) lo = Math.max(lo, r.right + 10);
    const w = Math.max(260, Math.min(700, hi - lo)), left = Math.round(Math.max(4, lo + (hi - lo - w) / 2));
    const lv = left + 'px', wv = Math.round(w) + 'px';
    if (this.el.style.left !== lv) this.el.style.left = lv;
    if (this.el.style.width !== wv) this.el.style.width = wv;
  }
  update(f) {
    if (!this.el || this.never) return;
    const dt = Math.min(0.1, f.dt || 0);
    if (f.state !== 'game') { if (this.open) this.close(); this.t = 0; return; }
    // never over the pause menu / scoreboard / any panel: hidden (not dismissed) while one is open or the game is paused
    const app = this.app, blocked = !!(app.paused || (app.ui && app.ui.panel && app.ui.panel !== 'none'));
    this.el.classList.toggle('hold', blocked);
    if (!this.open) {
      if (this.shown || (!this.force && this.seen())) return;
      if (blocked) return;
      this.t += dt; if (this.t > 1.0) { this.place(); this.show(); }
      return;
    }
    this.place();
    if (blocked) { this.prev.clear(); return; } // pad presses in the pause menu must not dismiss it
    this.t += dt;
    if (this.family() !== this.fam) this.render();
    // any pad ✕ / ○ / Options closes it
    for (const p of readPads()) {
      const sig = (p.b[BTN.CROSS] ? 1 : 0) | (p.b[BTN.CIRCLE] ? 2 : 0) | (p.b[BTN.OPTIONS] ? 4 : 0), prev = this.prev.get(p.index) || 0;
      if (sig & ~prev) this.close();
      this.prev.set(p.index, sig);
    }
    if (this.t > AUTO_CLOSE) this.close();
  }
  dispose() { if (this.el) this.el.remove(); removeEventListener('keydown', this.onKey, true); }
}
