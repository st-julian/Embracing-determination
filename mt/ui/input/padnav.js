// mt/ui/input/padnav.js — gamepad navigation of the legacy DOM menus (pause menu, settings, end screen, menu).
// Owner: input specialist.
//
// Active when a DOM screen owns the pads: app.state 'menu' | 'end' | 'loading', or a modal in 'game' (pause menu,
// settings, panels). The lobby ('lobby' state) has its own per-player navigation (lobby.js).
//   D-pad / left stick  move focus spatially among the visible, top-most buttons
//   ✕                   click the focused button      ○  back (Escape)      Options  Escape (toggle pause menu)
// Focus ring: `.mt-padfocus` (CSS below), coloured with the navigating local's colour when known.

import { BTN, readPads, PadState } from './devices.js';
import { pressKey, unlockAudio } from './gamepad.js';

const CSS = `.mt-padfocus{outline:4px solid var(--mt-pad,#ffd23a)!important;outline-offset:3px!important;border-radius:10px;box-shadow:0 0 0 7px #24305e88!important}`;
const SEL = 'button, [role="button"], a[href], [data-play], [data-play-again], input[type="range"], input[type="checkbox"], select';

export class PadNav {
  constructor(ctx, locals, gamepad) {
    this.app = ctx.app; this.locals = locals; this.gamepad = gamepad;
    this.state = new Map(); this.focus = null;
    if (typeof document !== 'undefined' && !document.getElementById('mt-padnav-css')) {
      const st = document.createElement('style'); st.id = 'mt-padnav-css'; st.textContent = CSS; document.head.appendChild(st);
    }
  }

  active(f) {
    const s = f.state;
    // the mt HUD (pause menu, scoreboard, end screen) reads the pads itself: never double-handle its screens
    const mh = typeof document !== 'undefined' && document.getElementById('mt-hud');
    const hudOwns = !!(mh && mh.style.display !== 'none' && (s === 'end' || mh.querySelector('.modal:not([hidden])')));
    if (hudOwns) return false;
    if (s === 'end') return true;
    if (s === 'menu') return !!(this.app.ui && this.app.ui.panel !== 'none');
    if (s === 'game') return !!(this.gamepad && this.gamepad.legacyModal());
    return false;
  }

  update(f) {
    const dt = Math.min(0.1, f.dt || 0);
    const pads = this.gamepad && this.gamepad.pads ? this.gamepad.pads : readPads();
    const on = this.active(f);
    if (!on) { this.blur(); }
    for (const pad of pads) {
      let s = this.state.get(pad.index); if (!s) this.state.set(pad.index, s = new PadState());
      s.tick(pad, dt);
      const dir = s.navDir(pad, dt);
      if (!on) continue;
      if (s.any()) unlockAudio(this.app);
      const local = this.locals.byDevice('pad:' + pad.index);
      if (f.state === 'game' && s.down(BTN.OPTIONS) && local) continue; // gamepad.js handles Options for locals
      if (dir) this.move(dir, local);
      if (s.down(BTN.CROSS)) { const el = this.current(local); if (el) { el.click(); this.app.fire('padnav', { action: 'click' }); } }
      if (s.down(BTN.CIRCLE) || (s.down(BTN.OPTIONS) && !local)) pressKey('Escape');
    }
  }

  candidates() {
    const out = [];
    if (typeof document === 'undefined') return out;
    const W = innerWidth, H = innerHeight;
    for (const el of document.querySelectorAll(SEL)) {
      if (el.disabled || el.closest('[hidden]') || el.closest('#mt-lobby') || el.closest('#mt-hud')) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4 || r.right < 0 || r.bottom < 0 || r.left > W || r.top > H) continue;
      const cx = Math.min(W - 1, Math.max(0, r.left + r.width / 2)), cy = Math.min(H - 1, Math.max(0, r.top + r.height / 2));
      const top = document.elementFromPoint(cx, cy);
      if (!top || (top !== el && !el.contains(top) && !top.contains(el))) continue;
      const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || +cs.opacity < 0.2) continue;
      out.push({ el, x: cx, y: cy });
    }
    return out;
  }

  current(local) {
    const c = this.candidates();
    if (this.focus && c.some((k) => k.el === this.focus)) return this.focus;
    // default: the primary button of the screen, else the first one
    const prim = c.find((k) => /primary|play|continue|resume/i.test(k.el.className + ' ' + (k.el.textContent || ''))) || c[0];
    this.set(prim ? prim.el : null, local);
    return this.focus;
  }

  move(dir, local) {
    const c = this.candidates(); if (!c.length) return;
    const cur = this.focus && c.find((k) => k.el === this.focus);
    if (!cur) { this.current(local); return; }
    const vx = dir === 'left' ? -1 : dir === 'right' ? 1 : 0, vy = dir === 'up' ? -1 : dir === 'down' ? 1 : 0;
    let best = null, bs = 1e9;
    for (const k of c) {
      if (k === cur) continue;
      const dx = k.x - cur.x, dy = k.y - cur.y, along = dx * vx + dy * vy;
      if (along <= 2) continue;
      const across = Math.abs(dx * vy - dy * vx), sc = along + across * 2.2;
      if (sc < bs) { bs = sc; best = k; }
    }
    if (best) { this.set(best.el, local); this.app.fire('padnav', { action: 'move' }); }
  }

  set(el, local) {
    if (this.focus === el) return;
    this.blur();
    this.focus = el;
    if (el) {
      el.classList.add('mt-padfocus');
      if (local) el.style.setProperty('--mt-pad', local.color);
      try { el.focus({ preventScroll: true }); } catch { /* not focusable */ }
    }
  }
  blur() { if (this.focus) { this.focus.classList.remove('mt-padfocus'); this.focus.style.removeProperty('--mt-pad'); } this.focus = null; }
}
