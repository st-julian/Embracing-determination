// mt/ui/input/keyboard.js — keyboard + mouse additions on top of the legacy controls (DESIGN §2). Owner: input specialist.
//
// The legacy controls subsystem (controls-*.js) handles mouse/keyboard for app.playerId (= the 'kbm' local, see
// localPlayers.js) and sends legacy commands that mt translates for trainers (mt/sim/trainers.js routeCommand):
//   RMB move / attack (the monster follows the trainer's target) · Space attack nearest · Q / W monster moves (aim + release)
//   E capture at cursor · R trainer skill · D potion · F swap · B recall · 1 potion · Esc menu · arrow keys move.
// This module listens in the capture phase (before the legacy listeners) and adds / changes:
//   T evolve · G regroup · P (legacy shop) swallowed
//   Tab            lock / cycle target near the cursor (the monster focuses it)   middle mouse  lock the unit under the cursor
//   ` or Shift     hold: scoreboard
//   WASD movement option (local.wasd, toggled in the lobby or with F1 in game; remembered in localStorage 'mt.input.wasd'):
//     W A S D  move (camera-relative, via the legacy arrow-key path)     Q  monster ability 1     E  monster ability 2
//     C  capture orb at cursor     X / 1  potion     (R, F, Space, B, T, G unchanged)
// A real key press switches the screen's local to keycap glyphs (controller-first default; mouse clicks don't switch).

import { t as i18n } from '../../i18n/index.js'; // i18n: F1 toast text (aliased: handlers use a local `t`)

const WASD_MAP = { KeyW: 'ArrowUp', KeyA: 'ArrowLeft', KeyS: 'ArrowDown', KeyD: 'ArrowRight', KeyE: 'KeyW', KeyC: 'KeyE' };
const LS_KEY = 'mt.input.wasd';

export function loadWasdPref() { try { return localStorage.getItem(LS_KEY) === '1'; } catch { return false; } }
export function saveWasdPref(on) { try { localStorage.setItem(LS_KEY, on ? '1' : '0'); } catch { /* private mode */ } }

export class KeyboardInput {
  constructor(ctx, locals) {
    this.app = ctx.app; this.ctx = ctx; this.locals = locals;
    this.mouse = { x: -1, y: -1 }; this.synth = false; this.held = new Set(); this.scoreKeys = new Set();
    this.lockId = -1;
    this.onKey = (e) => this.handle(e, true);
    this.onKeyUp = (e) => this.handle(e, false);
    this.onMove = (e) => { this.mouse.x = e.clientX; this.mouse.y = e.clientY; };
    this.onDown = (e) => this.pointer(e);
    this.onBlur = () => this.releaseAll();
    window.addEventListener('keydown', this.onKey, true);
    window.addEventListener('keyup', this.onKeyUp, true);
    window.addEventListener('pointermove', this.onMove, { passive: true, capture: true });
    window.addEventListener('pointerdown', this.onDown, true);
    window.addEventListener('blur', this.onBlur);
  }
  local() { return this.locals.keyboardLocal(); }
  me() { const l = this.local(); return l ? l.unitId : this.app.playerId; }

  handle(e, down) {
    const app = this.app;
    if (this.synth) return; // our own synthetic events pass straight to the legacy listeners
    // controller-first glyphs: only a REAL key press switches the screen to keycaps (any state; not modifier-only)
    if (down && e.isTrusted !== false && !/^(Shift|Control|Alt|Meta)/.test(e.code || '')) this.locals.noteInput(this.local(), 'kbm');
    if (app.state !== 'game' || e.ctrlKey || e.metaKey || e.altKey) { if (!down) this.held.delete(e.code); return; }
    const t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    const local = this.local();
    const code = e.code;

    // Esc -> pause menu is handled by mt/ui/hud.js (it knows the panel state before the legacy capture listener)

    // scoreboard hold (` or a lone Shift); Shift still reaches the legacy listeners
    if (code === 'Backquote' || code === 'ShiftLeft' || code === 'ShiftRight') {
      if (down && !e.repeat) { this.scoreKeys.add(code); if (app.ui.panel === 'none') app.fire('ui', { panel: 'scoreboard' }); }
      if (!down) { this.scoreKeys.delete(code); if (!this.scoreKeys.size && app.ui.panel === 'scoreboard') app.fire('ui', { panel: 'none' }); }
      if (code === 'Backquote') { e.preventDefault(); e.stopImmediatePropagation(); }
      return;
    }
    if (code === 'Tab') {
      e.preventDefault(); e.stopImmediatePropagation();
      if (down && !e.repeat && !app.paused) this.cycleLock();
      return;
    }
    if (code === 'F1') {
      e.preventDefault(); e.stopImmediatePropagation();
      if (down && !e.repeat && local) { this.releaseAll(); local.wasd = !local.wasd; saveWasdPref(local.wasd); app.fire('locals', app.locals); app.fire('toast', { text: local.wasd ? i18n('toast.wasdOn') : i18n('toast.wasdOff') }); }
      return;
    }

    let cmd = null;
    if (code === 'KeyT') cmd = { type: 'evolve' };
    else if (code === 'KeyG') cmd = { type: 'regroup' };
    else if (code === 'KeyP') { e.stopImmediatePropagation(); e.preventDefault(); return; }
    else if (local && local.wasd && code === 'KeyX') cmd = { type: 'potion' };
    if (cmd) {
      e.stopImmediatePropagation(); e.preventDefault();
      if (down && !e.repeat && !app.paused && app.world) app.world.command(this.me(), cmd);
      return;
    }

    // WASD movement mode: remap to the legacy codes (arrow keys move camera-relative; E -> W (ability 2); C -> E (capture))
    if (local && local.wasd && WASD_MAP[code]) {
      e.stopImmediatePropagation(); e.preventDefault();
      if (down) this.held.add(code); else this.held.delete(code);
      this.dispatch(down ? 'keydown' : 'keyup', WASD_MAP[code], e);
    }
  }

  dispatch(type, code, src) {
    this.synth = true;
    try {
      window.dispatchEvent(new KeyboardEvent(type, { code, key: code.startsWith('Arrow') ? code : code.slice(3).toLowerCase(), repeat: !!(src && src.repeat), shiftKey: false, bubbles: true, cancelable: true }));
    } catch { /* ignore */ } finally { this.synth = false; }
  }

  releaseAll() {
    for (const c of this.held) this.dispatch('keyup', WASD_MAP[c]);
    this.held.clear();
  }

  pointer(e) {
    if (this.app.state !== 'game') return;
    this.mouse.x = e.clientX; this.mouse.y = e.clientY;
    if (e.button === 1 && e.target && e.target.tagName === 'CANVAS') {
      e.preventDefault();
      const g = this.cursorGround(); if (!g) return;
      const w = this.app.world, me = w && w.units.get(this.me()); if (!me) return;
      let best = null, bd = 2.8;
      for (const u of w.queryUnits(g.x, g.y, 2.8, (u) => this.targetable(me, u), [])) { const d = Math.hypot(u.x - g.x, u.y - g.y); if (d < bd) { bd = d; best = u; } }
      this.setLock(me, best);
    }
  }

  cursorGround() {
    const rig = this.ctx.pipeline && this.ctx.pipeline.cameraRig;
    if (!rig || this.mouse.x < 0) return null;
    return rig.screenToGround(this.mouse.x, this.mouse.y, { x: 0, y: 0 });
  }

  targetable(me, u) {
    return u && u.alive && u.id !== me.id && u.team !== me.team && (u.team !== 2 || u.kind === 'monster') && !u.untargetable &&
      (!u.visible || u.visible[me.team] !== false) && (u.kind === 'champion' || u.kind === 'minion' || u.kind === 'monster');
  }

  /** Tab: next target, nearest to the cursor first (within 13 m of the trainer). */
  cycleLock() {
    const w = this.app.world, me = w && w.units.get(this.me()); if (!me || !me.alive) return;
    const g = this.cursorGround() || { x: me.x, y: me.y };
    const c = w.queryUnits(me.x, me.y, 13, (u) => this.targetable(me, u), []);
    if (!c.length) { this.setLock(me, null); return; }
    c.sort((a, b) => (Math.hypot(a.x - g.x, a.y - g.y) + (a.kind === 'minion' ? 2 : 0)) - (Math.hypot(b.x - g.x, b.y - g.y) + (b.kind === 'minion' ? 2 : 0)) || a.id - b.id);
    const i = c.findIndex((u) => u.id === this.lockId);
    this.setLock(me, c[(i + 1) % c.length]);
  }

  setLock(me, u) {
    this.lockId = u ? u.id : -1;
    const l = this.local(); if (!l) return;
    const aim = this.app.mtAim || (this.app.mtAim = []);
    const a = aim[l.slot] || (aim[l.slot] = { active: false, x: 0, y: 0, dist: 0, lockId: -1, hold: null, at: 0 });
    // a pad shared by P1 keeps its own lock in gamepad.js; the keyboard lock is shown when the keyboard was used last
    a.kbLockId = this.lockId;
    if (!l.lastInputGamepad) a.lockId = this.lockId;
    if (u) this.app.world.command(me.id, { type: 'monsterAttack', targetId: u.id });
  }

  update(f) {
    // drop a dead / invisible keyboard lock
    if (this.lockId < 0 || !f.world) return;
    const u = f.world.units.get(this.lockId), me = f.world.units.get(this.me());
    if (!u || !me || !u.alive || (u.visible && u.visible[me.team] === false) || Math.hypot(u.x - me.x, u.y - me.y) > 16) {
      this.lockId = -1; const l = this.local(); const a = l && this.app.mtAim && this.app.mtAim[l.slot];
      if (a) { a.kbLockId = -1; if (!l.lastInputGamepad) a.lockId = -1; }
    }
  }

  dispose() {
    window.removeEventListener('keydown', this.onKey, true);
    window.removeEventListener('keyup', this.onKeyUp, true);
    window.removeEventListener('pointermove', this.onMove, true);
    window.removeEventListener('pointerdown', this.onDown, true);
    window.removeEventListener('blur', this.onBlur);
  }
}
