// mt/ui/input/hints.js — first-match "how to play" card + contextual tips (controller-first, localized). Owner: input.
//
// FIRST-MATCH CARD (once per browser, localStorage 'mt.hints.v2'; ?hints=1 forces it, ?hints=0 never shows it):
// three big visual hints drawn with the SAME art as the real controls of the current input family —
//   touch: the joystick, the big ATTACK button (with the monster's own basic-move icon), the ORB button with a drag arrow
//   pad:   left stick, ✕, ○ (DualSense; Xbox glyphs for Xbox pads)        keys: right-click / WASD, Space, E
// One short label + one short line each, Japanese wrapped only between phrases (keep-all). It sits below the HUD top
// bar between the top-left buttons and the minimap, hides (not dismissed) while a panel is open / the game is paused,
// and closes on a tap, any key, pad ✕ / ○ / Options — or after 12 s.
//
// CONTEXTUAL TIPS (after the card): a one-line bubble anchored to the real button when it first matters — ATTACK when
// the first enemy comes close, ORB when a wild monster is weak enough, MOVE 1 once a monster fights, EVOLVE when ready,
// POTION when the monster is low. Each tip at most 3 times per browser (localStorage 'mt.tips.v1'), one at a time,
// ≥ 40 s apart per tip, 5 s on screen; tapping the bubble (it never blocks a touch) or the button it points at hides it. Touch: above the button;
// pad / keys: above the bottom HUD with the button glyph.

import { t } from '../../i18n/index.js';
import * as art from '../art.js';
import { BTN, readPads } from './devices.js';
import { isCapturable } from '../../sim/capture.js';
import { activeUnit } from '../../sim/monsters.js';
import { evolveReady } from '../../sim/progression.js';
import { FORMS } from '../../data/species.js';

const KEY = 'mt.hints.v2', TIPS_KEY = 'mt.tips.v1';
const AUTO_CLOSE = 12, TIP_SHOW = 5, TIP_MAX = 3, TIP_GAP = 40, TIP_ANY_GAP = 6;

const CSS = `
#mt-hints{position:fixed;left:3vw;top:12%;width:min(94vw,640px);box-sizing:border-box;z-index:7;pointer-events:auto;display:none;
  background:linear-gradient(#fffaf0,#f3ead2);border:3px solid #1b2350;border-radius:18px;box-shadow:0 6px 0 rgba(14,18,44,.45),0 16px 40px rgba(0,0,0,.35);
  padding:10px 14px 9px;color:#1b2350;font:800 14px/1.3 system-ui,-apple-system,"Segoe UI",sans-serif;opacity:0;transition:opacity .3s;
  -webkit-user-select:none;user-select:none;-webkit-touch-callout:none;touch-action:none;word-break:keep-all;line-break:strict;overflow-wrap:normal}
#mt-hints.on{display:block}#mt-hints.vis{opacity:1}#mt-hints.hold{display:none}
#mt-hints *{pointer-events:none} /* the card is the target (its icon canvases would read as the game canvas to the touch layer) */
#mt-hints h3{margin:0 0 8px;font-size:15px;letter-spacing:.5px;display:flex;align-items:center;gap:8px}
#mt-hints h3:before{content:"";width:18px;height:18px;border-radius:50%;background:linear-gradient(#5fe0e8 0 46%,#0c1230 46% 54%,#2a3466 54%);border:2px solid #0c1230;flex:none}
#mt-hints .tiles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
#mt-hints .tile{display:flex;flex-direction:column;align-items:center;text-align:center;gap:5px;min-width:0}
#mt-hints .pic{height:var(--pic,84px);width:100%;display:grid;place-items:center;position:relative}
#mt-hints .nm{font-size:18px;font-weight:900;white-space:nowrap}
#mt-hints .sub{font-size:12.5px;color:#4a5280;line-height:1.25}
#mt-hints .ft{margin-top:8px;text-align:center;font-size:12px;color:#56608a}
/* the same art as the touch controls */
#mt-hints .disc{width:var(--d);height:var(--d);border-radius:50%;display:grid;place-items:center;position:relative;
  background:radial-gradient(circle at 36% 28%,#fff 0,#fffaf0 42%,#efe4c8 100%);box-shadow:0 0 0 3px #1b2350,0 4px 0 3px rgba(14,18,44,.45),inset 0 -4px 0 rgba(27,35,80,.12)}
#mt-hints .disc.big{background:radial-gradient(circle at 36% 28%,#fff4d6 0,#ffd56a 45%,#f0a636 100%)}
#mt-hints .disc canvas{width:56%;height:56%;image-rendering:pixelated}
#mt-hints .disc svg{width:50%;height:50%}
#mt-hints .joy{width:var(--d);height:var(--d);border-radius:50%;position:relative;background:radial-gradient(circle closest-side,rgba(27,35,80,.18),rgba(27,35,80,.06) 72%,transparent 100%);
  box-shadow:inset 0 0 0 3px rgba(27,35,80,.55),inset 0 0 0 6px rgba(255,250,240,.6)}
#mt-hints .joy i{position:absolute;left:50%;top:50%;width:42%;height:42%;margin:-21% 0 0 -21%;border-radius:50%;background:radial-gradient(circle at 38% 30%,#fff,#f4ecd8 58%,#d6c9a4);
  box-shadow:0 0 0 3px #1b2350,0 4px 0 rgba(14,18,44,.4);animation:mtHjoy 2.4s ease-in-out infinite}
@keyframes mtHjoy{0%,100%{left:50%;top:50%}30%{left:66%;top:34%}60%{left:36%;top:40%}}
#mt-hints .drag{position:absolute;right:4%;top:2%;width:42%;height:42%;pointer-events:none}
#mt-hints .glyph{width:var(--d);height:var(--d);border-radius:50%;display:grid;place-items:center;background:#1b2350;color:#fff;font:900 calc(var(--d)*.46)/1 system-ui,sans-serif;
  box-shadow:0 0 0 3px #fffaf0,0 4px 0 3px rgba(14,18,44,.45)}
#mt-hints .glyph.ps0{color:#8fb4ff}#mt-hints .glyph.ps1{color:#ff7b86}#mt-hints .glyph.x0{background:#3fb64a}#mt-hints .glyph.x1{background:#e8574f}
#mt-hints .glyph.stick{font-size:calc(var(--d)*.3);background:radial-gradient(circle at 40% 35%,#3a4680,#1b2350)}
#mt-hints .key{min-width:calc(var(--d)*.7);height:calc(var(--d)*.6);padding:0 10px;border-radius:10px;display:grid;place-items:center;background:#fff;color:#1b2350;border:3px solid #1b2350;
  box-shadow:0 4px 0 #1b2350;font:900 calc(var(--d)*.24)/1 system-ui,sans-serif;white-space:nowrap;box-sizing:border-box}
#mt-hints .g{display:inline-grid;place-items:center;min-width:20px;height:20px;padding:0 5px;border-radius:10px;background:#1b2350;color:#fff;font-size:12px;font-weight:900;vertical-align:-3px}
#mt-hints .g.ps0{color:#8fb4ff}#mt-hints .g.x0{background:#3fb64a}
html.lang-ja #mt-hints,html.lang-ja #mt-tip{font-family:'Vale JP',system-ui,sans-serif;font-weight:400}
html.lang-ja #mt-hints *,html.lang-ja #mt-tip *{font-weight:400!important}
@media (max-height:430px){#mt-hints{padding:6px 10px 6px;--pic:62px}#mt-hints h3{font-size:13px;margin-bottom:4px}#mt-hints .nm{font-size:15px}#mt-hints .sub{font-size:11.5px}#mt-hints .ft{margin-top:4px}}
/* contextual tip bubble */
#mt-tip{position:fixed;left:0;top:0;z-index:6;display:none;pointer-events:none;max-width:min(70vw,340px);box-sizing:border-box;
  background:#fffaf0;border:3px solid #1b2350;border-radius:14px;padding:6px 12px 6px;color:#1b2350;font:800 15px/1.3 system-ui,-apple-system,sans-serif;
  box-shadow:0 4px 0 rgba(14,18,44,.45);word-break:keep-all;line-break:strict;-webkit-user-select:none;user-select:none;touch-action:none;
  animation:mtTipIn .25s ease-out}
#mt-tip.on{display:block}
#mt-tip:after{content:"";position:absolute;left:var(--ax,50%);bottom:-11px;width:16px;height:16px;margin-left:-8px;background:#fffaf0;border-right:3px solid #1b2350;border-bottom:3px solid #1b2350;transform:rotate(45deg)}
#mt-tip.side:after{left:auto;right:-11px;bottom:auto;top:var(--ay,50%);margin:-8px 0 0;border-bottom:0;border-top:3px solid #1b2350}
#mt-tip .g{display:inline-grid;place-items:center;min-width:22px;height:22px;padding:0 5px;margin:0 2px;border-radius:11px;background:#1b2350;color:#fff;font-size:13px;font-weight:900;vertical-align:-3px}
#mt-tip .g.ps0{color:#8fb4ff}#mt-tip .g.ps1{color:#ff7b86}#mt-tip .g.ps2{color:#f6a3e6}#mt-tip .g.ps3{color:#4fe0b0}
#mt-tip .g.x0{background:#3fb64a}#mt-tip .g.x1{background:#e8574f}#mt-tip .g.x2{background:#4f8fe8}#mt-tip .g.x3{background:#e8b82a}
#mt-tip .g.k{border-radius:5px;background:#fff;color:#1b2350;border:2px solid #1b2350}
@keyframes mtTipIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
`;

const SWORD = '<svg viewBox="0 0 24 24"><path d="M4 20l5-5M6.5 17.5l-3-3M14 4h6v6L10 20l-6-6z" fill="#fffaf0" stroke="#1b2350" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/></svg>';
const DRAG = '<svg viewBox="0 0 40 40"><path d="M6 34 Q 14 14 32 8" fill="none" stroke="#1b2350" stroke-width="7" stroke-linecap="round"/><path d="M6 34 Q 14 14 32 8" fill="none" stroke="#ffd23a" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="5 5"/><path d="M24 5 L34 7 L30 16" fill="#ffd23a" stroke="#1b2350" stroke-width="2.5" stroke-linejoin="round"/></svg>';
const MOUSE = '<svg viewBox="0 0 24 24" width="58%" height="58%"><rect x="5" y="2" width="14" height="20" rx="7" fill="#fff" stroke="#1b2350" stroke-width="2"/><path d="M12 2v8h7V9a7 7 0 0 0-7-7z" fill="#ffd23a" stroke="#1b2350" stroke-width="2"/></svg>';

const PSF = ['✕', '○', '□', '△'], XBF = ['A', 'B', 'X', 'Y'];
const SH = { ps: { 4: 'L1', 5: 'R1', 6: 'L2', 12: '↑' }, xbox: { 4: 'LB', 5: 'RB', 6: 'LT', 12: '↑' } };
/** inline glyph for the tip / footer text */
function g(fam, b) {
  if (fam === 'kbm') return `<span class="g k">${b}</span>`;
  if (typeof b === 'number' && b < 4) return fam === 'xbox' ? `<span class="g x${b}">${XBF[b]}</span>` : `<span class="g ps${b}">${PSF[b]}</span>`;
  return `<span class="g">${SH[fam === 'xbox' ? 'xbox' : 'ps'][b] || b}</span>`;
}
/** tip -> [touch button, pad button, key] */
const TIP_BTN = { attack: ['attack', BTN.CROSS, 'Space'], orb: ['capture', BTN.CIRCLE, 'E'], a1: ['a1', BTN.SQUARE, 'Q'], evolve: ['evolve', BTN.UP, 'T'], potion: ['potion', BTN.L2, 'D'] };
const TIP_ORDER = ['evolve', 'orb', 'potion', 'a1', 'attack'];

export class FirstMatchHints {
  constructor(ctx, locals) {
    this.ctx = ctx; this.app = ctx.app; this.locals = locals; this.t = 0; this.shown = false; this.open = false; this.fam = '';
    const p = this.app.params && this.app.params.get ? this.app.params.get('hints') : null;
    this.force = p === '1'; this.never = p === '0';
    this.tip = null; this.tipLast = {}; this.tipAny = -99; this.time = 0;
    if (typeof document === 'undefined') return;
    const st = document.createElement('style'); st.id = 'mt-hints-css'; st.textContent = CSS; document.head.appendChild(st);
    this.el = document.createElement('div'); this.el.id = 'mt-hints'; document.body.appendChild(this.el);
    this.el.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); this.close(); });
    this.tipEl = document.createElement('div'); this.tipEl.id = 'mt-tip'; document.body.appendChild(this.tipEl);
    // the bubble never takes a touch (it may sit over another button): a press on it, or on the button it points at,
    // hides it and goes through
    this.onBtn = (e) => {
      if (!this.tip) return;
      const r = this.tipEl.getBoundingClientRect();
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) { this.hideTip(); return; }
      const b = e.target && e.target.closest && e.target.closest('#mt-touch .tb'); if (b && TIP_BTN[this.tip.id][0] === b.dataset.tb) this.hideTip();
    };
    addEventListener('pointerdown', this.onBtn, true);
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

  // ------------------------------------------------------------------ first-match card
  /** the picture of each tile: the real control art of this input family */
  pic(fam, which) {
    if (fam === 'touch') {
      if (which === 'move') return '<div class="joy" style="--d:var(--pic,84px)"><i></i></div>';
      const big = which === 'attack';
      const live = document.querySelector('#mt-touch .tb[data-tb="attack"] canvas.ic');
      const inner = big ? (live && live.style.display !== 'none' && live.width ? '<canvas width="32" height="32" data-copy="attack"></canvas>' : SWORD)
        : '<canvas width="32" height="32" data-icon="trainer/capture"></canvas>';
      return `<div class="disc${big ? ' big' : ''}" style="--d:calc(var(--pic,84px) * ${big ? 0.95 : 0.78})">${inner}</div>${big ? '' : `<div class="drag">${DRAG}</div>`}`;
    }
    if (fam === 'kbm') {
      if (which === 'move') return `<div style="display:flex;gap:8px;align-items:center;--d:var(--pic,84px)"><div class="disc" style="--d:calc(var(--pic,84px)*.7)">${MOUSE}</div><div class="key">WASD</div></div>`;
      return `<div class="key" style="--d:var(--pic,84px)">${which === 'attack' ? 'Space' : 'E'}</div>`;
    }
    if (which === 'move') return `<div class="glyph stick" style="--d:calc(var(--pic,84px)*.85)">${fam === 'xbox' ? 'LS' : 'L'}</div>`;
    const i = which === 'attack' ? 0 : 1;
    return `<div class="glyph ${fam === 'xbox' ? 'x' : 'ps'}${i}" style="--d:calc(var(--pic,84px)*.85)">${fam === 'xbox' ? XBF[i] : PSF[i]}</div>`;
  }
  render() {
    const fam = this.family(); this.fam = fam;
    const sub = (w) => t((fam === 'touch' ? 'hint3.t.' : fam === 'kbm' ? 'hint3.k.' : 'hint3.p.') + w);
    const close = fam === 'touch' ? t('hint.close.touch') : fam === 'kbm' ? t('hint.close.kbm') : t('hint.close.pad', { g: g(fam, 0) });
    const tile = (w) => `<div class="tile"><div class="pic">${this.pic(fam, w)}</div><div class="nm">${t('hint3.' + w)}</div><div class="sub">${sub(w)}</div></div>`;
    this.el.innerHTML = `<h3>${t('hint3.title')}</h3><div class="tiles">${tile('move')}${tile('attack')}${tile('catch')}</div><div class="ft">${close}</div>`;
    // the replicas use the live button icons (the monster's own basic move) / the same pixel icons as the cluster
    for (const c of this.el.querySelectorAll('.disc canvas')) {
      const gc = c.getContext('2d'); gc.imageSmoothingEnabled = false;
      if (c.dataset.icon) { const ic = art.icon(c.dataset.icon, 32); if (ic) gc.drawImage(ic, 0, 0); continue; }
      const live = document.querySelector('#mt-touch .tb[data-tb="attack"] canvas.ic');
      if (live && live.width) gc.drawImage(live, 0, 0, 32, 32);
    }
  }
  show() {
    this.shown = true; this.open = true; this.t = 0; this.render();
    this.el.classList.add('on'); requestAnimationFrame(() => this.el.classList.add('vis'));
  }
  close() {
    if (!this.open) return;
    this.open = false; this.tipAny = this.time; try { localStorage.setItem(KEY, '1'); } catch { /* private mode */ }
    this.el.classList.remove('vis'); setTimeout(() => { if (!this.open) this.el.classList.remove('on'); }, 320);
  }
  /** Below the HUD top bar and the notch; between the top-left buttons and the minimap. */
  place() {
    const app = this.app, ins = app.mtHudInsets, H = innerHeight || 1;
    const q = app.params && app.params.get && app.params.get('mtsafe');
    const st = q ? (+String(q).split(',')[1] || 0) : 0;
    const top = Math.round(Math.max(ins && ins.top > 0 ? ins.top * H + 8 : H * 0.12, st + 8));
    const v = top + 'px'; if (this.el.style.top !== v) this.el.style.top = v;
    const W = innerWidth || 1;
    let lo = 8, hi = W - 8;
    const zones = app.mtHud && app.mtHud.touchZones ? app.mtHud.touchZones() : null, mm = zones && zones.minimap;
    if (mm && mm.width > 0 && mm.bottom > top) hi = Math.min(hi, mm.left - 10);
    const rs = (app.mtTouch && app.mtTouch.active && app.mtTouch.rects ? app.mtTouch.rects() : []).concat(zones && zones.buttons ? zones.buttons.filter(Boolean) : []);
    for (const r of rs) if (r && r.width > 0 && r.left < W * 0.3 && r.bottom > top && r.top < top + 140) lo = Math.max(lo, r.right + 10);
    const w = Math.max(260, Math.min(640, hi - lo)), left = Math.round(Math.max(4, lo + (hi - lo - w) / 2));
    const lv = left + 'px', wv = Math.round(w) + 'px';
    if (this.el.style.left !== lv) this.el.style.left = lv;
    if (this.el.style.width !== wv) this.el.style.width = wv;
  }

  // ------------------------------------------------------------------ contextual tips
  counts() { try { return JSON.parse(localStorage.getItem(TIPS_KEY) || '{}') || {}; } catch { return {}; } }
  bump(id) { const c = this.counts(); c[id] = (c[id] || 0) + 1; try { localStorage.setItem(TIPS_KEY, JSON.stringify(c)); } catch { /* private mode */ } }
  hideTip() { if (this.tip) { this.tip = null; this.tipEl.classList.remove('on'); } }
  /** Which tip matters right now for the screen's local (or null). */
  pickTip(w) {
    const L = this.locals.keyboardLocal ? this.locals.keyboardLocal() : (this.app.locals || [])[0];
    const me = L && w.units.get(L.unitId); if (!me || !me.alive || !me.mtTrainer) return null;
    const T = me.mtTrainer, now = w.time, rec = T.activeIdx >= 0 ? T.party[T.activeIdx] : null;
    const pet = w.mt ? activeUnit(w.mt, me) : null;
    const enemyNear = (r) => w.queryUnits(me.x, me.y, r, (u) => u.alive && u.team !== me.team && (u.team !== 2 || u.kind === 'monster') && (u.kind === 'champion' || u.kind === 'monster' || u.kind === 'minion') && (!u.visible || u.visible[me.team] !== false), []).length > 0;
    const ok = {
      evolve: () => !!rec && !rec.evolving && !rec.fainted && evolveReady(rec),
      orb: () => (T.cdEnd.capture || 0) <= now && w.queryUnits(me.x, me.y, 9, (u) => isCapturable(u) && u.hp <= u.maxHp * 0.45, []).length > 0,
      potion: () => !!pet && pet.alive && pet.hp < pet.maxHp * 0.35 && (T.cdEnd.potion || 0) <= now,
      a1: () => !!pet && pet.alive && !!rec && (rec.cds.a1 || 0) <= now && !!FORMS[rec.form] && enemyNear(8),
      attack: () => enemyNear(6.5),
    };
    const c = this.counts();
    for (const id of TIP_ORDER) {
      if ((c[id] || 0) >= TIP_MAX || this.time - (this.tipLast[id] ?? -99) < TIP_GAP) continue;
      if (ok[id]()) return id;
    }
    return null;
  }
  showTip(id) {
    const fam = this.family(), [tb, pb, key] = TIP_BTN[id];
    const txt = fam === 'touch' ? t('tip3.' + id + '.touch') : t('tip3.' + id + '.pad', { g: fam === 'kbm' ? g('kbm', key) : g(fam, pb) });
    this.tipEl.innerHTML = txt;
    this.tip = { id, t0: this.time, fam, tb };
    this.tipLast[id] = this.time; this.tipAny = this.time; this.bump(id);
    this.tipEl.classList.add('on');
    this.placeTip();
  }
  /**
   * Touch: next to the real button without covering another one — above it, else to its left (arrow pointing right),
   * else above the whole cluster; pad / keys: centred above the bottom HUD.
   */
  placeTip() {
    const tp = this.tip; if (!tp) return;
    const W = innerWidth, H = innerHeight, el = this.tipEl, bw = el.offsetWidth || 200, bh = el.offsetHeight || 40;
    let L = (W - bw) / 2, T = H * 0.72 - bh, ax = '50%', ay = '50%', side = false;
    if (tp.fam === 'touch') {
      const b = document.querySelector(`#mt-touch .tb[data-tb="${tp.tb}"]`);
      const r = b && !b.classList.contains('hidden') ? b.getBoundingClientRect() : null;
      if (r && r.width > 0) {
        const others = [...document.querySelectorAll('#mt-touch .tb')].filter((e) => e !== b && !e.classList.contains('hidden') && e.offsetParent !== null)
          .map((e) => e.getBoundingClientRect()).filter((q) => q.width > 0);
        const hits = (l, t) => l < 4 || t < 4 || l + bw > W - 4 || t + bh > H - 4 || others.some((q) => l < q.right && l + bw > q.left && t < q.bottom && t + bh > q.top);
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const above = (bottom) => ({ l: Math.min(W - bw - 8, Math.max(8, cx - bw / 2)), t: bottom - 14 - bh });
        const top = Math.min(r.top, ...others.filter((q) => q.left > W * 0.45 && q.top > H * 0.3).map((q) => q.top));
        const cand = [{ ...above(r.top) }, { l: r.left - 14 - bw, t: Math.min(H - bh - 8, Math.max(8, cy - bh / 2)), side: true }, { ...above(top) }];
        const c = cand.find((q) => !hits(q.l, q.t)) || cand[0];
        L = c.l; T = c.t; side = !!c.side;
        if (side) ay = Math.round(Math.min(bh - 12, Math.max(12, cy - T))) + 'px'; else ax = Math.round(Math.min(bw - 14, Math.max(14, cx - L))) + 'px';
      }
    } else {
      const ins = this.app.mtHudInsets; T = H * (1 - ((ins && ins.bottom) || 0.2)) - 16 - bh;
    }
    el.classList.toggle('side', side);
    el.style.left = Math.round(L) + 'px'; el.style.top = Math.round(T) + 'px'; el.style.setProperty('--ax', ax); el.style.setProperty('--ay', ay);
  }

  // ------------------------------------------------------------------ frame
  update(f) {
    if (!this.el || this.never) return;
    const dt = Math.min(0.1, f.dt || 0);
    if (f.state !== 'game') { if (this.open) this.close(); this.hideTip(); this.t = 0; return; }
    // never over the pause menu / scoreboard / any panel: hidden (not dismissed) while one is open or the game is paused
    const app = this.app, blocked = !!(app.paused || (app.ui && app.ui.panel && app.ui.panel !== 'none'));
    this.el.classList.toggle('hold', blocked); this.tipEl.style.visibility = blocked ? 'hidden' : '';
    if (blocked) { this.prev.clear(); return; } // pad presses in the pause menu must not dismiss anything
    this.time += dt;
    if (!this.open) {
      if (!this.shown && (this.force || !this.seen())) { this.t += dt; if (this.t > 1.0) { this.place(); this.show(); } return; }
      this.tips(f);
      return;
    }
    this.place();
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
  tips(f) {
    const w = f.world; if (!w) return;
    if (this.tip) {
      if (this.time - this.tip.t0 > TIP_SHOW || this.family() !== this.tip.fam) this.hideTip(); else this.placeTip();
      return;
    }
    if (this.time - this.tipAny < TIP_ANY_GAP) return;
    this.tipCheck = (this.tipCheck || 0) - 1; if (this.tipCheck > 0) return; this.tipCheck = 10; // ~3 checks / s
    const id = this.pickTip(w); if (id) this.showTip(id);
  }
  dispose() {
    if (this.el) this.el.remove(); if (this.tipEl) this.tipEl.remove();
    removeEventListener('keydown', this.onKey, true); removeEventListener('pointerdown', this.onBtn, true);
  }
}
