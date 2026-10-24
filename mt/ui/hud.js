// mt/ui/hud.js — monster-trainer HUD (DESIGN §14), Gen-5 flavoured, premium MOBA layout. Owner: HUD specialist.
//
//   top-centre   TopBar: team KO scores, clock, towers, both teams' trainers with party mini-portraits
//   top-right    Minimap (pixel terrain, structures+HP, element camps, units, frustum, pings)
//   right        feed: KOs, faints, captures, evolutions, structures
//   centre       banners: "Gotcha!", "X evolved into Y!", structures, boss; "Super effective!" callouts
//   bottom       one SlotCard per local human (trainer card + active monster card + bench card);
//                compact colour-coded cards when 2+ locals share the screen
//   modals       Scoreboard (Tab / Create), Pause (Esc / Options), VICTORY / DEFEAT screen
//   world        overhead plates for every unit, painted into the legacy overlay canvas (plates.js)
// Legacy shop / gold / items / CS / KDA / skill-point / summoner UI is hidden (hud.css). Controller-first glyphs:
// DualSense ✕○□△ L1 R1 L2 R2 unless the last input was keyboard/mouse (keycaps) or touch (the on-screen button's icon).
// TOUCH LAYOUT (#mt-hud.touch, app.mtInputMode 'touch'): compact bottom-left card (leaves the left joystick zone free),
// Menu / Scores top-left, feed under the touch layer's top-left row, right side free for mt/ui/input/touch.js's
// cluster, safe-area insets, every tap target >= 48 CSS px; pause / scoreboard / victory tappable and pad-navigable.
//
// Layout space: "HUD px" — #mt-hud gets a CSS zoom u = k / dpr with k whole device px per HUD px (~540×304 HUD px,
// never below 480×270; touch ~600×270, never below 440×250; override ?hudscale=n) so every pixel-font glyph / border
// is screen-pixel exact.

import { h, setText, setCls, setHTML, pxCanvas, blit, tint } from './dom.js';
import { loadPixelFonts } from './pixelfont.js';
import { InputTracker, glyphHTML } from './glyphs.js';
import * as art from './art.js';
import { MatchStats } from './stats.js';
import { SlotCard } from './cards.js';
import { TopBar } from './topbar.js';
import { Minimap } from './minimap.js';
import { Plates } from './plates.js';
import { Scoreboard, PauseMenu } from './screens.js';
import { EndScreen } from './victory.js';
import { FORMS } from '../data/species.js';
import { TYPE_COLORS } from '../data/types.js';
import { MT_EVENT as E } from '../sim/events.js';
import { tr, onLang } from './tr.js';                 // i18n: every string below goes through tr(key, english, params)
import { bossName } from '../i18n/index.js';

const FALLBACK_COLOR = '#3fd26a';
/** display width weight: full-width (Japanese) glyphs count ~1.5 Latin pixel-font chars (banner h1 size rule) */
const wlen = (s) => { let n = 0; for (const c of String(s)) n += c.charCodeAt(0) > 0x2e7f ? 1.5 : 1; return n; };
/** 12×12 pixel icons for the touch Menu / Scores buttons (cream on navy, 1 px navy outline). */
function tbIcon(kind) {
  const c = pxCanvas(12, 12), g = c.getContext('2d');
  const box = (x, y, w, hh) => { g.fillStyle = '#0d1230'; g.fillRect(x - 1, y - 1, w + 2, hh + 2); };
  const fill = (x, y, w, hh, col) => { g.fillStyle = col; g.fillRect(x, y, w, hh); };
  if (kind === 'menu') { for (const y of [2, 5, 8]) box(2, y, 8, 2); for (const y of [2, 5, 8]) { fill(2, y, 8, 2, '#fffdf6'); fill(2, y + 1, 8, 1, '#d9cca8'); } }
  else {   // podium 2-1-3 with a star on the winner
    box(1, 6, 3, 5); box(4, 3, 4, 8); box(8, 7, 3, 4); box(5, 0, 2, 2);
    fill(1, 6, 3, 5, '#cfe2ff'); fill(4, 3, 4, 8, '#ffd23a'); fill(8, 7, 3, 4, '#ffb0a6'); fill(5, 0, 2, 2, '#fff1a8');
    fill(4, 3, 4, 1, '#fff1a8'); fill(5, 5, 2, 1, '#b97d00');
  }
  c.className = 'px ti'; return c;
}

export class MtHud {
  constructor(ctx) {
    this.app = ctx.app; this.ctx = ctx;
    this.app.mtHud = this;
    loadPixelFonts().then((ok) => { this.fontOk = ok; document.body.classList.toggle('mt-font', ok); });
    if (!document.getElementById('mt-hud-css')) {
      const link = document.createElement('link'); link.id = 'mt-hud-css'; link.rel = 'stylesheet';
      link.href = new URL('./hud.css', import.meta.url).href; document.head.appendChild(link);
    }
    this.input = new InputTracker();
    this.stats = new MatchStats();
    this.root = h('div'); this.root.id = 'mt-hud'; document.body.appendChild(this.root);
    this.top = new TopBar(this); this.mm = new Minimap(this);
    this.feed = h('div.feed'); this.banner = h('div.banner'); this.se = h('div.se'); this.toasts = h('div.toasts');
    this.veilH = h('div.h1', { text: tr('hud.down', 'Your trainer is down') });
    this.veilN = h('div.n'); this.veil = h('div.veil', null, h('div.pn.vb', null, this.veilH, this.veilN));
    this.dock = h('div.dock');
    this.sb = new Scoreboard(this); this.pause = new PauseMenu(this); this.end = new EndScreen(this);
    // touch: Menu / Scores buttons (top-left, >= 48 CSS px hit area); the label is for screen readers, the icon is pixel art
    const tb = (label, panel, icon) => {
      const b = h('div.mbtn.tbn', { role: 'button', 'aria-label': label, 'data-play': true }, icon, h('i.hit'));
      b.addEventListener('pointerdown', (e) => { e.stopPropagation(); e.preventDefault(); this.app.fire('ui', { panel: this.panel === panel ? 'none' : panel }); });
      return b;
    };
    this.tbtns = h('div.tbtns', null, tb(tr('hud.menuBtn', '\u2261 Menu'), 'menu', tbIcon('menu')), tb(tr('hud.scoresBtn', 'Scores'), 'scoreboard', tbIcon('scores')));
    this.tpad = h('div.tpad');   // touch fallback cluster (used only while no input-layer touch cluster is active: app.mtTouch)
    this.game = h('div.game', null, this.veil, this.tbtns, this.top.el, this.mm.el, this.feed, this.se, this.banner, this.toasts, this.dock, this.tpad);
    this.root.append(this.game, this.sb.el, this.pause.el, this.end.el);
    this.cards = new Map(); this.multi = false; this.bannerQ = []; this.bannerOn = null; this.bannerT = 0; this.seT = 0; this.lastSE = 0;
    this.plates = new Plates(this);
    globalThis.__mtPlate = (bars, g, st, frame, bucket) => this.platesOn && this.plates.draw(bars, g, st, frame, bucket);
    globalThis.__mtHudRects = (out) => this.rects(out);
    globalThis.__mtFight = () => !!(this.platesOn && this.plates.fight);
    globalThis.__mtPlateRects = () => (this.platesOn && this.plates.rects && performance.now() - this.plates.rectsT < 250 ? this.plates.rects : null);
    globalThis.__mtPlatesFlush = (bars, g, frame) => { if (this.platesOn) this.plates.flush(bars, g, frame); };
    this.platesOn = !(this.app.params && this.app.params.get && this.app.params.get('mtplates') === '0');
    this.panel = 'none';
    this.app.on('ui', (p) => {
      const panel = (p && p.panel) || 'none';
      if (panel === 'shop') { this.app.fire('ui', { panel: 'none' }); return; }
      this.panel = panel;
    });
    this.app.on('match', () => { for (const c of this.cards.values()) c.dispose(); this.cards.clear(); this.feed.innerHTML = ''; this.bannerQ.length = 0; });
    onLang(() => this.relang()); // i18n: language switched (pause menu / lobby) -> re-render text
    this._resize = () => this.layout(); addEventListener('resize', this._resize); this.layout();
    // Esc opens / closes the pause menu in a match. Capture phase on window: the legacy hud capture listener (registered
    // earlier) already closes an open panel on Esc; the controls' settings capture listener records the panel state
    // *before* that as e.__svcPanel. We only act when no panel was open and no aim / attack-move is pending, and then
    // stop the event so the legacy controls don't toggle their (hidden) settings popup instead.
    this._esc = (e) => {
      if (e.code !== 'Escape' && e.key !== 'Escape') return;
      const app = this.app; if (app.state !== 'game' || e.repeat) return;
      const t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      const before = e.__svcPanel != null ? e.__svcPanel : (app.ui && app.ui.panel) || 'none';
      const ctl = app.registry && app.registry.get && app.registry.get('controls');
      if (before === 'none') {
        if (ctl && ((ctl.aim && ctl.aim.active) || (ctl.attackMove && ctl.attackMove.pending))) return; // legacy: cancel aim
        if (ctl && ctl.settingsUI && ctl.settingsUI.open) { ctl.settingsUI.setOpen && ctl.settingsUI.setOpen(false); }
        e.stopImmediatePropagation(); e.preventDefault();
        app.fire('ui', { panel: 'menu' });
      } else {
        e.stopImmediatePropagation(); e.preventDefault();
        if (app.ui && app.ui.panel !== 'none') app.fire('ui', { panel: 'none' });
      }
    };
    addEventListener('keydown', this._esc, true);
    this.t = 0; this.time = 0; this.lastDev = -1;
  }

  /** i18n: re-render every static / cached text after a language switch */
  relang() {
    setText(this.veilH, tr('hud.down', 'Your trainer is down'));
    const [m, sc] = this.tbtns.children; if (m) m.setAttribute('aria-label', tr('hud.menuBtn', '\u2261 Menu')); if (sc) sc.setAttribute('aria-label', tr('hud.scoresBtn', 'Scores'));
    for (const c of this.cards.values()) c.dispose(); this.cards.clear();
    for (const p of [this.top, this.mm, this.sb, this.pause, this.end]) if (p && p.relang) { try { p.relang(); } catch (e) { console.error('[mt-ui] relang', e); } }
    if (this.plates && this.plates.names) this.plates.names.clear();
  }

  // ------------------------------------------------------------------ helpers
  layout() {
    // uCss = CSS px per HUD px (~540×304 HUD px on screen — 4× at 1080p, never less than 480×270); k = whole DEVICE px per HUD px
    // (so pixel glyphs/borders stay crisp at DPR 1.25 / 1.5 / 2); the CSS zoom is k / dpr.
    const dpr = window.devicePixelRatio || 1, W = innerWidth, H = innerHeight;
    const q = this.app.params && this.app.params.get && parseInt(this.app.params.get('hudscale'), 10);
    const uCss = q > 0 ? q : Math.max(1, Math.min(Math.floor(Math.min(W / 480, H / 270)), Math.round(Math.min(W / 540, H / 304))));
    // touch layout (phones 844×390 … tablets): larger — k = whole device px per HUD px rounded UP from ~600×270 HUD px,
    // then stepped down until the canvas keeps >= 440×250 HUD px (iPhone 844×390@3 -> k 4, 633×292; @2 -> k 3, 563×260)
    const touch = !!(this.input && this.touch); this._touchL = touch;
    let k;
    if (touch && !(q > 0)) {
      const uC = Math.max(uCss, Math.min(W / 600, H / 270));
      k = Math.max(1, Math.ceil(uC * dpr - 0.15));
      while (k > 1 && (W * dpr / k < 440 || H * dpr / k < 250)) k--;
    } else k = Math.max(1, Math.floor(uCss * dpr + 1e-6));   // whole device px per HUD px (floor keeps >= 480x270 HUD px)
    const u = k / dpr;
    this.k = k; this.u = u; this.dpr = dpr; this.root.style.zoom = String(u); this.root.style.setProperty('--zu', String(u)); this.root.classList.toggle('touch', touch); this.root.style.setProperty('--k', String(k)); this.plates.setScale(u); this.mm.resize(u);
    // safe-area insets (notch / home bar; viewport-fit=cover) and the 48 CSS px minimum tap size, in whole HUD px
    const sa = this.safeArea(), hp = (v) => Math.ceil(v / u - 1e-6) + 'px';
    this.root.style.setProperty('--sal', hp(sa.l)); this.root.style.setProperty('--sat', hp(sa.t)); this.root.style.setProperty('--sar', hp(sa.r)); this.root.style.setProperty('--sab', hp(sa.b));
    this.root.style.setProperty('--tap', hp(48));
    this.hudW = W / u; this.hudH = H / u;
    this.root.classList.toggle('short', H / u < 280);     // phones
    if (!touch) { this.feed.style.top = ''; this.top.el.style.left = ''; }
  }
  /** Touch: size the Menu / Scores buttons like the touch layer's small buttons and stack the feed under whatever the
   *  touch layer put at the top-left (its RECALL / REGROUP row), in whole HUD px. */
  touchPlace() {
    const u = this.u || 1, T = this.app.mtTouch;
    let tu = T && T.sz && T.sz.tu;
    if (!tu) { const r = document.getElementById('mt-touch'); tu = r ? parseFloat(r.style.getPropertyValue('--tu')) : 0; }
    const bs = Math.max(24, Math.round((tu || 48) / u));
    if (bs !== this._tbs) { this._tbs = bs; this.root.style.setProperty('--tbn', bs + 'px'); setCls(this.tbtns, 'lg', bs >= 32); this._kick = 2; }
    let bot = 0, right = 0;
    for (const c of this.tbtns.children) { const r = c.getBoundingClientRect(); if (r.height > 0) { bot = Math.max(bot, r.bottom); right = Math.max(right, r.right); } }
    // top bar: centred in the gap between the Menu / Scores buttons and the minimap; team strips drop out when it's too narrow
    const mm = this.mm.el.getBoundingClientRect(), L0 = right / u + 6, R0 = (mm.width > 0 ? mm.left : innerWidth) / u - 6;
    if (!this.root.classList.contains('tnarrow')) { const r = this.top.el.getBoundingClientRect(); if (r.width > 0) this.topFull = r.width / u; }
    setCls(this.root, 'tnarrow', R0 - L0 < (this.topFull || 312));
    const cx = Math.round((L0 + R0) / 2) + 'px'; if (this.top.el.style.left !== cx) this.top.el.style.left = cx;
    let lr = right;   // right edge of the top-left column (our buttons + the touch layer's row under them)
    if (T && T.active && T.rects) {
      for (const r of T.rects()) if (r && r.height > 0 && r.left < innerWidth * 0.35 && r.top < innerHeight * 0.4) { bot = Math.max(bot, r.bottom + 16); lr = Math.max(lr, r.right); }   // + its label
    }
    // banner / prompts: centred in the gap between that column and the minimap, wrapped to its width
    const gl = lr / u + 6, gw = Math.max(160, Math.floor(R0 - gl)), gc = Math.round(gl + gw / 2) + 'px';
    if (this._gapc !== gc) { this._gapc = gc; this.root.style.setProperty('--gapc', gc); this.root.style.setProperty('--gapw', gw + 'px'); }
    const top = Math.ceil(bot / u) + 4 + 'px';
    if (this.feed.style.top !== top) this.feed.style.top = top;
  }
  /** Re-run the touch layer's layout (it reads touchZones()); until it polls layoutVer itself. */
  relayoutTouch() {
    try { const ui = this.app.registry && this.app.registry.get && this.app.registry.get('mt-ui'), tc = ui && ui.gamepad && ui.gamepad.touch; if (tc && tc.layout) tc.layout(); } catch (e) { console.error('[mt-ui] touch relayout', e); }
  }
  /** Safe-area insets in CSS px: env(safe-area-inset-*) via a probe, or ?mtsafe=l,t,r,b (tests). */
  safeArea() {
    const q = this.app.params && this.app.params.get && this.app.params.get('mtsafe');
    if (q) { const [l, t, r, b] = q.split(',').map((v) => +v || 0); return { l, t, r, b }; }
    let p = this._saProbe;
    if (!p) {
      p = this._saProbe = document.createElement('div');
      p.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)';
      document.body.appendChild(p);
    }
    const cs = getComputedStyle(p);
    return { l: parseFloat(cs.paddingLeft) || 0, t: parseFloat(cs.paddingTop) || 0, r: parseFloat(cs.paddingRight) || 0, b: parseFloat(cs.paddingBottom) || 0 };
  }
  localList() {
    const L = this.app.locals;
    if (L && L.length) return L;
    return [{ slot: 0, unitId: this.app.playerId, team: this.app.viewerTeam, device: 'kbm', color: FALLBACK_COLOR }];
  }
  localMap() {
    const L = this.localList();
    if (this._lmSrc !== L || this._lmN !== L.length) { this._lmSrc = L; this._lmN = L.length; this._lm = new Map(L.map((l) => [l.unitId, l])); }
    return this._lm;
  }
  localIds() { return this.localMap(); }
  primaryUnitId() { const L = this.localList(); const k = L.find((l) => l.device === 'kbm'); return (k || L[0]).unitId; }
  isLocal(id) { return this.localMap().has(id); }
  /** glyph style for a local: 'kbm' | 'ps' | 'xbox' (falsy-compatible: 'kbm' -> keyboard glyphs) */
  padFor(l) { if (this.touch && (!l || !l.device || !l.device.startsWith('pad'))) return 'touch'; const s = this.input.styleFor(l, this.localList().length === 1); return s === 'kbm' || s === 'touch' ? (s === 'touch' ? 'ps' : false) : s; }
  /** True while the touch layout is active: the input layer's screen mode (app.mtInputMode 'touch' — set on a real touch,
   *  left again when a pad button / real key is used); without the input layer, after the first real touch. */
  get touch() { const m = this.app.mtInputMode; return m ? m === 'touch' : !!this.input.touchSeen; }
  /**
   * For the input layer's touch cluster (mt/ui/input/touch.js): per-action button state of a local trainer, refreshed
   * every HUD frame by its card. { a1, a2, capture, skill, potion, swap, recall: { icon, ready, cool, cdLeft, cdFrac,
   * locked, off, hidden }, evolve: { ready, evolving }, bench: { form, level, hpFrac, fainted } | null, hasMon, alive }.
   * `icon` is an mt/ui/art.js icon id (art.icon(id, size) gives the same pixel-art canvas the HUD uses).
   */
  abilityState(unitId = this.primaryUnitId()) { const c = this.cards.get(unitId); return c ? c.state : null; }
  /** Screen rects (CSS px, DOMRect) the touch controls should keep clear of: { card, top, minimap, feed, buttons[] }. */
  touchZones() {
    const r = (el) => (el && el.getBoundingClientRect ? el.getBoundingClientRect() : null);
    const c = this.cards.get(this.primaryUnitId());
    let card = null;   // the card's whole visual extent: frame + trainer tab + bench chip + evolve tag
    if (c) for (const e of [c.root, c.trn, c.bench, c.evotag]) {
      const b = r(e); if (!b || !(b.width > 0)) continue;
      card = card ? new DOMRect(Math.min(card.left, b.left), Math.min(card.top, b.top), Math.max(card.right, b.right) - Math.min(card.left, b.left), Math.max(card.bottom, b.bottom) - Math.min(card.top, b.top)) : b;
    }
    return { card, top: r(this.top.el), minimap: r(this.mm.el), feed: r(this.feed), buttons: [...this.tbtns.children].map(r) };
  }

  /** Client rects of every HUD element that world plates must hide under (cards, minimap, top bar, feed, banner,
   *  toasts, callout). Used by the legacy occluders and, per frame, by plates.flush() (plates are hidden, not faded). */
  maskEls() {
    const out = [];
    for (const c of this.dock.querySelectorAll('.pn, .ab')) out.push(c);
    out.push(this.mm.el);
    for (const c of this.top.el.children) out.push(c);
    for (const c of this.feed.children) out.push(c);
    for (const c of this.banner.querySelectorAll('.bn')) out.push(c);
    for (const c of this.toasts.children) out.push(c);
    if (this.se.classList.contains('on')) out.push(this.se);
    if (this.touch) { for (const c of this.tbtns.children) out.push(c); for (const c of this.tpad.children) if (!c.hidden) out.push(c); }
    for (const c of document.querySelectorAll('.mt-hudmask')) out.push(c);   // other layers' on-screen controls (touch cluster)
    return out;
  }
  rects(out) {
    if (this.app.state !== 'game') return;
    for (const c of this.maskEls()) { const r = c.getBoundingClientRect(); if (r.width > 0 && r.height > 0) out.push(r); }
    for (const r of this.touchRects()) out.push(r);
  }
  /** the touch layer's on-screen buttons (plates hide under them too); its joystick (>= 120 CSS px, translucent) is skipped */
  touchRects() { const T = this.app.mtTouch; try { return T && T.active && T.rects ? T.rects().filter((r) => r && r.width > 0 && r.height > 0 && r.width < 118) : []; } catch { return []; } }
  /** Same rects in overlay device px ([x0,y0,x1,y1], padded), refreshed at most every 80 ms. */
  maskRects(D) {
    const now = performance.now();
    if (this._mr && now - this._mrT < 80 && this._mrD === D) return this._mr;
    const out = [];
    if (this.app.state === 'game') for (const c of this.maskEls()) { const r = c.getBoundingClientRect(); if (r.width > 0 && r.height > 0) out.push([(r.left - 2) * D, (r.top - 2) * D, (r.right + 2) * D, (r.bottom + 2) * D]); }
    if (this.app.state === 'game') for (const r of this.touchRects()) out.push([(r.left - 2) * D, (r.top - 2) * D, (r.right + 2) * D, (r.bottom + 2) * D]);
    // the strip under the bottom cards down to the screen edge (plates of units standing just below the dock)
    if (this.app.state === 'game') { const r = this.dock.getBoundingClientRect(); if (r.width > 0) out.push([(r.left - 2) * D, (r.top + 8) * D, (r.right + 2) * D, innerHeight * D + 50]); }
    this._mr = out; this._mrT = now; this._mrD = D;
    return out;
  }

  toast(text, kind = '', glyph = '') {
    const t = h('div.toast' + (kind ? '.' + kind : ''), { html: `<span>${text}</span>${glyph || ''}` });
    this.toasts.appendChild(t); while (this.toasts.children.length > 3) this.toasts.firstChild.remove();
    setTimeout(() => t.remove(), kind === 'ask' ? 3000 : 1800);
  }
  /** queue a centre banner: {h1, h2, icon:formId|spriteId, kind:'gold'|'blue'|'red'|''} */
  bannerPush(b) { this.bannerQ.push(b); if (this.bannerQ.length > 4) this.bannerQ.shift(); }
  showBanner(b) {
    const icon = pxCanvas(32, 32); const src = b.icon ? (art.portrait(b.icon, 32) || null) : null; blit(icon, src);
    const bi = h('div.bi', null, icon);
    if (b.icon && FORMS[b.icon]) { const tc = TYPE_COLORS[FORMS[b.icon].types[0]]; bi.style.setProperty('--tc', tc); bi.style.setProperty('--tc-l', tint(tc, 0.6)); }
    const el = h('div.pn.bn.on' + (b.kind ? '.' + b.kind : ''), null, b.icon ? bi : null, h('div.bt', null, h('div.h1' + (wlen(b.h1) > 12 ? '.sm' : ''), { text: b.h1 }), b.h2 ? h('div.h2', { text: b.h2 }) : null));
    el.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'touch' || this.bannerOn !== el) return; e.stopPropagation(); this.bannerT = Math.min(this.bannerT, 0.01); });
    this.banner.innerHTML = ''; this.banner.appendChild(el); this.bannerOn = el; this.bannerT = Math.min(2.2, b.t || 1.9);
    setCls(this.root, 'bn-on', true);
  }
  callout(text, weak) {
    const now = performance.now() / 1000; if (now - this.lastSE < (weak ? 3 : 1.6)) return; this.lastSE = now;
    this.se.textContent = text; setCls(this.se, 'nve', !!weak); this.se.classList.remove('on'); void this.se.offsetWidth; this.se.classList.add('on');
  }
  feedRow(cls, parts) {
    // coalesce repeats: the same line again within 8 s bumps a ×N counter instead of adding a row
    const key = cls + '|' + parts.map((p) => (typeof p === 'string' ? p : p && p.icon !== undefined ? '@' + p.icon : p ? p.text : '')).join('|');
    const last = this.feed.lastElementChild;
    if (last && last._key === key && this.time - last._t0 < 8 && !last.classList.contains('out')) {
      last._n = (last._n || 1) + 1; last._t0 = this.time;
      let c = last.querySelector('.cnt'); if (!c) { c = h('span.cnt'); last.appendChild(c); }
      c.textContent = '\u00d7' + last._n; last.classList.remove('bump'); void last.offsetWidth; last.classList.add('bump');
      return;
    }
    const row = h('div.fr' + (cls ? '.' + cls : '')); row._key = key;
    for (const p of parts) {
      if (typeof p === 'string') row.appendChild(h('span.ar', { text: p }));
      else if (p.icon !== undefined) {
        const c = pxCanvas(16, 16); blit(c, p.bust ? art.bust(p.icon, 16) : art.portrait(p.icon, 16));
        const fi = h('span.fi', null, c); fi.style.setProperty('--fc', p.col || '#ddd'); row.appendChild(fi);
      } else row.appendChild(h('span.t' + (p.side ? '.' + p.side : ''), { text: p.text }));
    }
    this.feed.appendChild(row); while (this.feed.children.length > (!this.touch ? 4 : this.hudH < 300 ? 2 : 3)) this.feed.firstChild.remove();
    row._t0 = this.time;   // expiry runs on HUD frame time (see update), not wall-clock timers
  }

  // ------------------------------------------------------------------ events
  unitIcon(w, id) {
    const u = w.units.get(id);
    if (!u) return null;
    if (u.mtTrainer) return { icon: art.trainerSpriteId(u.mtTrainer.spec, u.team), bust: true, col: u.team === 0 ? '#cfe2ff' : '#ffd5cf' };
    if (u.mtMon) { const f = FORMS[u.mtMon.form]; return { icon: u.mtMon.form, col: tint(TYPE_COLORS[f.types[0]], 0.55) }; }
    return null;
  }
  side(w, f, id) { const u = w.units.get(id); return !u ? '' : u.team === f.viewerTeam ? 'a' : u.team === 2 ? '' : 'e'; }
  events(f) {
    const w = f.world, view = f.viewerTeam;
    for (const ev of f.events || []) {
      switch (ev.type) {
        case E.CAPTURE_SUCCESS: {
          const tu = w.units.get(ev.trainer); const mine = this.isLocal(ev.trainer);
          const lv = { name: ev.name, level: ev.level, trainer: tu ? tu.name : '' };
          if (mine || (tu && tu.team === view)) this.bannerPush({ h1: tr('banner.gotcha', 'Gotcha!'), h2: (mine || !tu ? tr('banner.caught', '{name} (Lv{level}) was caught!', lv) : tr('banner.caughtBy', '{trainer}: {name} (Lv{level}) was caught!', lv)) + (ev.slot === 'bench' ? tr('banner.toBench', ' Sent to the bench.') : ''), icon: ev.form, kind: 'gold' });
          const ti = this.unitIcon(w, ev.trainer);
          this.feedRow('cap', [ti || '', { text: tu ? tu.name : tr('feed.trainer', 'Trainer'), side: this.side(w, f, ev.trainer) }, tr('feed.caught', 'caught'), { icon: ev.form, col: tint(TYPE_COLORS[FORMS[ev.form].types[0]], 0.55) }, { text: ev.name }]);
          break;
        }
        case E.EVOLVE: {
          const tu = w.units.get(ev.trainer), mine = this.isLocal(ev.trainer);
          if (mine || (tu && tu.team === view)) this.bannerPush({ h1: tr('banner.congrats', 'Congratulations!'), h2: tr('banner.evolved', '{from} evolved into {to}!', { from: ev.fromName, to: ev.name }), icon: ev.to, kind: 'gold', t: 3 });
          this.feedRow('evo', [{ icon: ev.from, col: '#fff3b0' }, '→', { icon: ev.to, col: '#ffe36a' }, { text: tr('feed.evolved', '{name}!', { name: ev.name }), side: this.side(w, f, ev.trainer) }]);
          break;
        }
        case E.FAINT: {
          const killer = this.unitIcon(w, ev.killer);
          this.feedRow('', [killer || '⚔', '▶', { icon: ev.form, col: '#e6e0d0' }, { text: tr('feed.fainted', '{name} fainted', { name: ev.name }), side: this.side(w, f, ev.trainer) }]);
          if (this.isLocal(ev.trainer)) this.toast(tr('toast.fainted', '{name} fainted! Swap', { name: ev.name }), 'warn', glyphHTML('swap', this.padFor(this.localMap().get(ev.trainer))));
          break;
        }
        case 'kill': {
          const v = w.units.get(ev.victim); if (!v || !v.mtTrainer) break;
          const k = this.unitIcon(w, ev.killer);
          const kn = w.units.get(ev.killer);
          this.feedRow('', [k || '⚔', { text: kn ? kn.name : '', side: this.side(w, f, ev.killer) }, '▶', this.unitIcon(w, ev.victim), { text: v.name, side: this.side(w, f, ev.victim) }]);
          if (v.team === view && this.isLocal(v.id)) { /* veil shows it */ } else if (kn && this.isLocal(kn.id)) this.bannerPush({ h1: tr('banner.trainerDown', '{name} is down!', { name: v.name }), h2: tr('banner.trainerKO', 'Trainer KO'), kind: 'blue', t: 1.8 });
          break;
        }
        case E.STRUCTURE_DESTROYED: {
          const ours = ev.team === view, nm = ev.kind === 'nexus' ? tr('struct.nexus', 'Nexus') : ev.kind === 'inhibitor' ? tr('struct.inhibitor', 'Inhibitor') : tr('struct.tower', 'Tower');
          if (ev.kind !== 'nexus') this.bannerPush({ h1: ours ? tr('banner.ourFell', 'Our {s} fell!', { s: nm }) : tr('banner.enemyDestroyed', 'Enemy {s} destroyed!', { s: nm }), h2: (ev.lane ? tr('lane.' + ev.lane, ev.lane.toUpperCase() + ' lane') : ''), kind: ours ? 'red' : 'blue', t: 2 });
          this.feedRow('struct', [{ text: ours ? tr('feed.ourFell', 'Our {s} fell', { s: nm.toLowerCase() }) : tr('feed.destroyed', '{s} destroyed', { s: nm }), side: ours ? 'e' : 'a' }]);
          break;
        }
        case 'mt_team_buff': if (ev.buff === 'galeclaw') { const bp = { pct: Math.round((ev.dmgPct || 0.15) * 100), s: Math.round(ev.duration || 90) }; this.bannerPush({ h1: ev.team === view ? tr('banner.bossSlain', 'Ancient Galeclaw slain!') : tr('banner.bossSlainEnemy', 'Enemy slew the Galeclaw!'), h2: ev.team === view ? tr('banner.buffOurs', 'Your team: +{pct}% damage for {s}s', bp) : tr('banner.buffTheirs', 'Their team: +{pct}% damage for {s}s', bp), kind: ev.team === view ? 'gold' : 'red', t: 2.6 }); } break;
        case 'mt_wave': if (ev.team === view && ev.siege && !this._siegeToast) { this._siegeToast = true; this.toast(tr('toast.siege', 'Siege minions are marching!')); } break;
        case E.CAPTURE_FAIL: if (this.isLocal(ev.trainer)) this.toast(tr('toast.breakFree', 'Oh no! It broke free!'), 'warn'); break;
        case E.CAPTURE_READY: if (this.isLocal(ev.trainer)) { this.plates.captureHint.set(ev.target, performance.now()); this.toast(tr('toast.weak', '{name} is weak — throw an orb!', { name: ev.name }), 'ask', glyphHTML('capture', this.padFor(this.localMap().get(ev.trainer)))); } break;
        case E.CONFIRM_REPLACE: if (this.isLocal(ev.trainer)) this.toast(ev.targetName ? tr('toast.release', 'Release {name} Lv{level} for {target}? Throw again', { name: ev.name, level: ev.level, target: ev.targetName }) : tr('toast.partyFull', 'Party full — throw again to release {name}', { name: ev.name || tr('toast.bench', 'bench') }), 'ask', glyphHTML('capture', this.padFor(this.localMap().get(ev.trainer)))); break;
        case E.DENY: if (this.isLocal(ev.trainer) && ev.code !== 'cooldown') this.toast(ev.text || ev.code, 'warn'); break;
        case E.HIT: {
          if (!ev.eff) break;
          const src = w.units.get(ev.src); const owner = src && src.mtMon ? src.mtMon.ownerId : -1;
          if (owner >= 0 && this.isLocal(owner) && ev.source !== 'dot') this.callout(ev.eff === 'super' ? tr('callout.super', "It's super effective!") : tr('callout.weak', 'Not very effective…'), ev.eff !== 'super');
          break;
        }
        case 'announce': if (ev.team === 2 && ((ev.key && /_spawn$/.test(ev.key)) || (ev.text && /spawn/i.test(ev.text)))) this.bannerPush({ h1: tr('banner.bossSpawn', '{name} has spawned', { name: bossName() }), kind: '', t: 2.2 }); break; // i18n: by key (the legacy text is English)
      }
    }
    // stale capture hints
    if (this.plates.captureHint.size) { const now = performance.now(); for (const [k, t] of this.plates.captureHint) if (now - t > 8000 || !(w.units.get(k) || {}).alive) this.plates.captureHint.delete(k); }
  }

  // ------------------------------------------------------------------ frame
  update(f) {
    const w = f.world, dt = Math.min(0.1, f.dt || 0);
    this.time += dt;
    this.input.poll();
    art.pumpArt(this.app.state === 'end' ? 12 : 4);
    const inGame = (f.state === 'game' || f.state === 'end') && !!w;
    document.body.classList.toggle('mt-ingame', f.state === 'game');
    this.root.style.display = inGame ? '' : 'none';
    this.platesOn = inGame;
    if (!inGame) { if (this.pause.open) this.pause.setOpen(false); return; }
    this.stats.consume(f);
    this.game.hidden = f.state === 'end';
    this.end.update(f, this.stats);
    if (f.state === 'end') { this.sb.update(w, f, this.stats, false); this.pause.setOpen(false); return; }
    this.events(f);
    this.mm.update(f, dt);
    for (const row of this.feed.children) { const age = this.time - (row._t0 || 0); if (age > 7 && !row.classList.contains('out')) row.classList.add('out'); if (age > 7.5) { row.remove(); break; } }
    // banners
    if (this.bannerOn) { this.bannerT -= dt; if (this.bannerT <= 0) { this.bannerOn.classList.remove('on'); this.bannerOn.classList.add('off'); const el = this.bannerOn; setTimeout(() => { el.remove(); if (!this.bannerOn) setCls(this.root, 'bn-on', false); }, 320); this.bannerOn = null; this.bannerT = -0.25; } }
    else if (this.bannerT < 0) this.bannerT += dt;
    else if (this.bannerQ.length) this.showBanner(this.bannerQ.shift());
    // modals
    this.pause.setOpen(this.panel === 'menu'); this.pause.update(dt);
    this.sb.update(w, f, this.stats, this.panel === 'scoreboard');
    // cards (per local)
    if (this.touch !== this._touchL) this.layout();
    // touch: the compact bottom-left card for a solo player too; ability buttons come from the input layer's touch cluster
    // (app.mtTouch, mt/ui/input/touch.js) or, only if that layer doesn't exist, from the HUD's fallback cluster (.tpad)
    const L = this.localList(), touch = this.touch, multi = L.length > 1 || touch;
    const tmode = !touch ? '' : this.app.mtTouch ? 'cl' : 'fb';
    if (tmode !== this.tmode) { this.tmode = tmode; setCls(this.root, 'tcl', tmode === 'cl'); setCls(this.root, 'tfb', tmode === 'fb'); }
    // layout signature: the touch layer (mt/ui/input/touch.js) places its joystick ghost / top-left buttons from
    // touchZones(); bump layoutVer when our geometry changes and, in touch, ask it to re-layout a few frames later
    const lsig = (touch ? 1 : 0) + tmode + '|' + L.length + '|' + this.k + '|' + this.cards.size;
    if (lsig !== this._lsig) { this._lsig = lsig; this.layoutVer = (this.layoutVer || 0) + 1; this._kick = touch ? 3 : 0; }
    if (this._kick > 0 && --this._kick === 0) this.relayoutTouch();
    if (multi !== this.multi) { this.multi = multi; setCls(this.dock, 'multi', multi); }
    const tight = L.length > 3; setCls(this.dock, 'n4', tight);
    const seen = new Set();
    for (const l of L) {
      const u = w.units.get(l.unitId); if (!u || !u.mtTrainer) continue;
      seen.add(l.unitId);
      let c = this.cards.get(l.unitId);
      if (!c) { c = new SlotCard(this, l); this.cards.set(l.unitId, c); this.dock.appendChild(c.root); }
      c.setMode(multi, l, tight, tmode && l.unitId === this.primaryUnitId() ? tmode : '', L.length > 1);
      c.update(w, w.time, this.padFor(l), this.time);
    }
    for (const [id, c] of this.cards) if (!seen.has(id)) { c.dispose(); this.cards.delete(id); }
    // trainer-down veil (single local only)
    const me = w.units.get(L[0].unitId);
    const down = L.length === 1 && me && !me.alive;
    setCls(this.veil, 'on', !!down);
    if (down) setText(this.veilN, tr('common.sec', '{n}s', { n: Math.max(0, Math.ceil((me.respawnAt || w.time) - w.time)) }));
    this.t += dt; if (this.t >= 0.1) {
      this.t = 0; this.top.update(w, f, this.stats);
      if (touch) this.touchPlace();
      const H = innerHeight || 1, tb = this.top.el.getBoundingClientRect(), db = this.dock.getBoundingClientRect();
      const ins = this.app.mtHudInsets || (this.app.mtHudInsets = { top: 0.09, bottom: 0.2 });
      if (tb.height > 0) ins.top = Math.min(0.3, tb.bottom / H);
      if (db.height > 0) ins.bottom = Math.min(0.4, (H - db.top) / H);
    }
  }
  dispose() {
    removeEventListener('resize', this._resize); removeEventListener('keydown', this._esc, true); this.input.dispose(); if (this.end.dispose) this.end.dispose(); this.root.remove();
    const s = document.getElementById('mt-hud-css'); if (s) s.remove();
    delete globalThis.__mtPlate; delete globalThis.__mtHudRects; delete globalThis.__mtPlatesFlush; delete globalThis.__mtFight; delete globalThis.__mtPlateRects;
  }
}
void setHTML;
