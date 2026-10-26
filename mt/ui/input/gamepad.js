// mt/ui/input/gamepad.js — in-match gamepad control (DualSense / Xbox / any pad), DESIGN §2. Owner: input specialist.
//
// Pads are read through devices.js (standard layout whatever the browser reports, dead zones, curves). Each pad that
// belongs to a local (app.locals[i].device === 'pad:<index>') drives that local's trainer with world.command().
// An unassigned pad that presses ✕ or Options during a match joins it (takes a bot trainer, LocalPlayers.joinPad).
//
// Control map (standard indices; Xbox glyphs in brackets):
//   Left stick      move, camera-relative, analog speed (leashed to the shared camera when 2+ locals)
//   Right stick     aim: shows a ground reticle; abilities / orb go to the reticle. FLICK (out and back < 0.22 s)
//                   cycles the lock to the next target in the flick direction
//   ✕ 0 [A]         monster attacks the locked / aimed / nearest enemy (trainer slings it when no monster is out)
//   ○ 1 [B]         capture orb at the locked / aimed / nearest wild monster. Party full: HOLD ○ (0.6 s) confirms
//                   replacing the benched monster (or press again within 3 s)
//   □ 2 [X]         monster ability 1        △ 3 [Y]  monster ability 2
//   L1 4            swap monster             R1 5     trainer skill (Rally / Mend / Surge)
//   L2 6            potion                   R2 7     lock nearest target / cycle; HOLD R2 0.5 s clears the lock
//   D-pad ↑ 12      evolve   ↓ 13 regroup   ← 14 recall   → 15 / Create 8 (hold) scoreboard
//   Options 9       pause menu (pad menu navigation: D-pad/stick + ✕, ○ = back — padnav.js)
// Rumble (when the browser exposes an actuator): trainer / monster hit, capture wobble / success / fail, evolution, death.
//
// Shared state for HUD + reticle: app.mtAim[slot] = {active, x, y, dist, lockId, hold:{btn, t, need}|null, at}

import { isCapturable } from '../../sim/capture.js';
import { activeUnit } from '../../sim/monsters.js';
import { MT_EVENT as E } from '../../sim/events.js';
import { BTN, PadState, readPads, shapeStick, STICK, rumblePattern, glyphFamily } from './devices.js';
import { PadNav } from './padnav.js';
import { Reticles } from './reticle.js';
import { TouchControls } from './touch.js';
import { FirstMatchHints } from './hints.js';

const AIM_MIN = 2.2, AIM_MAX = 9.0;            // reticle distance range (m); 9 = capture throw range
const PICK_RANGE = 10.5, LOCK_RANGE = 13, LOCK_KEEP = 16;
const HOLD_CONFIRM = 0.6, HOLD_UNLOCK = 0.5;
const FLICK_TIME = 0.22;

export class GamepadInput {
  constructor(ctx, locals) {
    this.ctx = ctx; this.app = ctx.app; this.locals = locals;
    this.state = new Map(); // pad index -> PadState + per-pad game state
    this.app.mtAim = this.app.mtAim || [];
    this.app.mtPads = this; // debug / HUD: list of known pads
    this.pads = [];
    this.enabled = typeof navigator !== 'undefined' && !!navigator.getGamepads;
    // sub-parts owned by input (composed here so mt/ui/index.js needs no change): DOM menu navigation + ground reticles
    this.subs = [];
    const sub = (name, make) => { try { this.subs.push({ name, inst: make(), fails: 0 }); } catch (e) { console.error('[mt-input] ctor ' + name, e); } };
    sub('padnav', () => (this.padnav = new PadNav(ctx, locals, this)));
    sub('reticle', () => (this.reticles = new Reticles(ctx)));
    sub('touch', () => (this.touch = new TouchControls(ctx, locals, this)));
    sub('hints', () => (this.hints = new FirstMatchHints(ctx, locals, this)));
    // [load/hitch] the legacy loop calls this BEFORE the frame's sim ticks ([MT-HOOK] inputEarly in index-*.js qk):
    // stick / joystick movement reaches the sim one frame earlier than from update() (which runs after the ticks)
    this.app.mtInputEarly = (dt) => this.early(dt);
  }

  /** [load/hitch] movement before the sim ticks: pad left sticks (handle() then reuses the result) + touch joystick. */
  early(dt) {
    dt = Math.min(0.1, dt || 0);
    try {
      const app = this.app, w = app.world;
      if (this.enabled && app.state === 'game' && w && !app.paused && !this.modal()) {
        const rig = this.ctx.pipeline && this.ctx.pipeline.cameraRig, yaw = (rig && rig.yaw) || 0;
        for (const pad of readPads()) {
          const local = this.locals.byDevice('pad:' + pad.index); if (!local) continue;
          const me = w.units.get(local.unitId); if (!me || !me.alive) continue;
          const s = this.st(pad.index);
          s.early = this.move(pad, s, me, dt, Math.cos(yaw), Math.sin(yaw));
        }
      }
    } catch (e) { this.earlyErr(e); }
    try { if (this.touch && this.touch.early) this.touch.early(dt); } catch (e) { this.earlyErr(e); }
  }
  earlyErr(e) {
    const app = this.app; if (!app || !app.errors) return;
    const g = app.errors['mt-ui:inputEarly'] || (app.errors['mt-ui:inputEarly'] = { count: 0, last: '' });
    if (++g.count <= 3) console.error('[mt-input:early]', e);
    g.last = String(e && e.stack || e).slice(0, 400);
  }

  updateSubs(f) {
    for (const p of this.subs) {
      if (p.fails > 120) continue;
      try { p.inst.update(f); p.fails = 0; } catch (e) {
        p.fails++;
        if (p.fails <= 3) console.error('[mt-input:' + p.name + ']', e);
        const app = this.app; if (app && app.errors) { const g = app.errors['mt-ui:' + p.name] || (app.errors['mt-ui:' + p.name] = { count: 0, last: '' }); g.count++; g.last = String(e && e.stack || e).slice(0, 400); }
      }
    }
  }

  st(index) {
    let s = this.state.get(index);
    if (!s) this.state.set(index, s = Object.assign(new PadState(), { dir: [0, 0], dirT: 0, lockId: -1, flick: null, aimOn: false, aimX: 0, aimY: 0, scoreHeld: false, joined: 0 }));
    return s;
  }

  update(f) {
    const dt = Math.min(0.1, f.dt || 0);
    this.pads = this.enabled ? readPads() : [];
    for (const pad of this.pads) {
      const s = this.st(pad.index);
      s.tick(pad, dt);
      if (s.any()) this.locals.setMode('pad', glyphFamily(pad.kind)); // a pad press anywhere -> pad UI (touch controls hide)
      this.handle(f, pad, s, dt);
    }
    for (const s of this.state.values()) s.early = null; // [load/hitch] an early() move is used by this frame's handle() only
    if (f.state === 'game' && f.world && this.pads.length) this.rumbleEvents(f);
    this.updateSubs(f);
  }

  /** Is a DOM modal open (pause menu / scoreboard / panels)? Then pads navigate menus instead (padnav.js). */
  modal() {
    const app = this.app;
    if (app.paused || (app.ui && app.ui.panel && app.ui.panel !== 'none' && app.ui.panel !== 'scoreboard')) return true;
    return this.legacyModal();
  }
  /** Legacy DOM menus (legacy HUD match menu / controls settings popup) — navigated by padnav.js. */
  legacyModal() {
    const app = this.app;
    const hud = app.registry && app.registry.get('hud');
    if (hud && hud.game && hud.game.menuOpen) return true;
    const c = app.registry && app.registry.get('controls');
    return !!(c && c.settingsUI && c.settingsUI.open);
  }

  handle(f, pad, s, dt) {
    const app = this.app, w = f.world;
    if (f.state !== 'game' || !w) return;
    let local = this.locals.byDevice('pad:' + pad.index);
    if (!local) {
      if ((s.down(BTN.CROSS) || s.down(BTN.OPTIONS)) && !this.modal()) {
        local = this.locals.joinPad(pad);
        if (local) { rumblePattern(pad.index, 'join'); unlockAudio(app); }
      }
      return;
    }
    if (s.any() || Math.hypot(pad.raw[0], pad.raw[1]) > 0.5 || Math.hypot(pad.raw[2], pad.raw[3]) > 0.5) { this.locals.noteInput(local, 'pad'); if (s.any()) unlockAudio(app); }
    const me = w.units.get(local.unitId); if (!me) return;
    const aim = app.mtAim[local.slot] || (app.mtAim[local.slot] = { active: false, x: 0, y: 0, dist: 0, lockId: -1, hold: null, at: 0 });
    const send = (cmd) => w.command(me.id, cmd);

    // --- menu / scoreboard (work while dead too)
    if (s.down(BTN.OPTIONS)) { // pause menu (mt HUD PauseMenu opens on ui panel 'menu'; it has its own pad navigation)
      const open = app.ui && app.ui.panel === 'menu';
      if (!open && this.legacyModal()) pressKey('Escape'); else app.fire('ui', { panel: open ? 'none' : 'menu' });
      return;
    }
    if (this.modal()) { s.dir = [0, 0]; aim.active = false; return; } // padnav.js drives the DOM
    const sb = s.pressed(BTN.CREATE) || s.pressed(BTN.RIGHT);
    if (sb !== s.scoreHeld) { s.scoreHeld = sb; app.fire('ui', { panel: sb ? 'scoreboard' : 'none' }); }
    if (app.paused || !me.alive) { s.dir = [0, 0]; aim.active = false; aim.hold = null; return; }

    // --- movement (camera-relative, analog, leashed) — normally already sent by early(), before the sim ticks
    const rig = this.ctx.pipeline && this.ctx.pipeline.cameraRig, yaw = (rig && rig.yaw) || 0;
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const { dx, dy, moving } = s.early || this.move(pad, s, me, dt, cy, sy);

    // --- aim (right stick) + flick target cycling
    const [ax, ay, ak] = shapeStick(pad.raw[2], pad.raw[3], STICK.aimExp);
    const rawMag = Math.hypot(pad.raw[2], pad.raw[3]);
    const wx = ax * cy + ay * sy, wy = -ax * sy + ay * cy;
    const now = f.time;
    if (rawMag > STICK.flick && !s.flick) s.flick = { t0: now, dx: wx, dy: wy, cycled: false };
    if (s.flick && rawMag > STICK.flick) { s.flick.dx = wx; s.flick.dy = wy; }
    if (s.flick && rawMag < STICK.flickReset) {
      if (now - s.flick.t0 < FLICK_TIME && !s.flick.cycled) this.cycleLock(w, me, s, Math.atan2(s.flick.dy, s.flick.dx), true);
      s.flick = null;
    }
    const aiming = ak > 0 && !(s.flick && now - s.flick.t0 < FLICK_TIME * 0.6 && rawMag > STICK.flick);
    if (aiming) {
      const n = Math.hypot(wx, wy) || 1, dist = AIM_MIN + (AIM_MAX - AIM_MIN) * ak;
      aim.x = me.x + (wx / n) * dist; aim.y = me.y + (wy / n) * dist; aim.dist = dist; aim.dir = Math.atan2(wy, wx);
    }
    if (!aim.touch) { aim.active = aiming; aim.at = now; } // a touch drag-aim on the same local wins
    const aimDir = aiming ? aim.dir : moving ? Math.atan2(dy, dx) : (me.facing ?? 0);

    // --- lock upkeep
    let lock = s.lockId >= 0 ? w.units.get(s.lockId) : null;
    if (lock && (!lock.alive || !visibleTo(app, lock, me) || Math.hypot(lock.x - me.x, lock.y - me.y) > LOCK_KEEP)) { s.lockId = -1; lock = null; }
    if (s.down(BTN.R2)) this.cycleLock(w, me, s, aimDir, false);
    if (s.pressed(BTN.R2) && s.heldFor(BTN.R2) >= HOLD_UNLOCK && s.lockId >= 0) { s.lockId = -1; lock = null; }
    aim.lockId = local.lastInputGamepad || !(aim.kbLockId >= 0) ? s.lockId : aim.kbLockId;
    const enemyAt = () => {
      if (lock && isEnemy(me, lock, app)) return lock;
      if (aiming) return nearest(w, aim.x, aim.y, 3.2, (u) => isEnemy(me, u, app)) || pick(w, me, aimDir, PICK_RANGE, (u) => isEnemy(me, u, app));
      return pick(w, me, aimDir, PICK_RANGE, (u) => isEnemy(me, u, app));
    };

    // --- actions
    if (s.down(BTN.CROSS)) {
      const t = enemyAt();
      if (t) { if (!send({ type: 'monsterAttack', targetId: t.id })) send({ type: 'attack', targetId: t.id }); }
      else send({ type: 'attackNearest', range: 7 });
    }
    if (s.down(BTN.CIRCLE)) {
      const t = (lock && isCapturable(lock) ? lock : null) || (aiming ? nearest(w, aim.x, aim.y, 3.5, isCapturable) : null) || pick(w, me, aimDir, 9.5, isCapturable);
      if (t) { s.capT = t.id; send({ type: 'capture', targetId: t.id }); rumblePattern(pad.index, 'throw'); }
      else if (aiming) send({ type: 'capture', x: aim.x, y: aim.y });
      else app.fire('denied', { slot: 'E', type: 'capture', reason: 'no_target' });
    }
    aim.hold = null;
    if (s.pressed(BTN.CIRCLE) && s.capT != null) {
      const T = me.mtTrainer, pending = T && T.confirm && T.confirm.targetId === s.capT && w.time <= T.confirm.until;
      if (pending) {
        aim.hold = { btn: BTN.CIRCLE, what: 'replace', t: s.heldFor(BTN.CIRCLE), need: HOLD_CONFIRM };
        if (s.heldFor(BTN.CIRCLE) >= HOLD_CONFIRM) { send({ type: 'capture', targetId: s.capT, confirm: true }); s.capT = null; }
      }
    }
    if (s.up(BTN.CIRCLE)) s.capT = null;
    if (s.pressed(BTN.R2) && s.lockId >= 0 && s.heldFor(BTN.R2) > 0.15) aim.hold = { btn: BTN.R2, what: 'unlock', t: s.heldFor(BTN.R2), need: HOLD_UNLOCK };
    if (s.down(BTN.SQUARE) || s.down(BTN.TRIANGLE)) {
      const slot = s.down(BTN.SQUARE) ? 'a1' : 'a2';
      let t = null, x, y;
      if (aiming) { t = nearest(w, aim.x, aim.y, 2.5, (u) => isEnemy(me, u, app)); x = aim.x; y = aim.y; }
      else { t = enemyAt(); x = t ? t.x : me.x + Math.cos(aimDir) * 5; y = t ? t.y : me.y + Math.sin(aimDir) * 5; }
      if (send({ type: 'monsterCast', slot, targetId: t ? t.id : -1, x, y })) rumblePattern(pad.index, 'ability');
    }
    if (s.down(BTN.L1)) send({ type: 'swap' });
    if (s.down(BTN.R1)) send({ type: 'trainerSkill' });
    if (s.down(BTN.L2)) send({ type: 'potion' });
    if (s.down(BTN.UP)) send({ type: 'evolve' });
    if (s.down(BTN.DOWN)) send({ type: 'regroup' });
    if (s.down(BTN.LEFT)) send({ type: 'recall' });
  }

  /** Left stick -> 'dir' order (camera-relative, analog, leashed). Returns the direction for aim / facing. */
  move(pad, s, me, dt, cy, sy) {
    const [mx, my, mk] = shapeStick(pad.raw[0], pad.raw[1], STICK.moveExp);
    let dx = 0, dy = 0;
    if (mk > 0) {
      const sp = (0.38 + 0.62 * mk) / mk;
      dx = (mx * cy + my * sy) * sp; dy = (-mx * sy + my * cy) * sp;
      const cam = this.app.mtCamera; if (cam && cam.filterDir) [dx, dy] = cam.filterDir(me, dx, dy);
    }
    s.dirT -= dt;
    const moving = dx !== 0 || dy !== 0;
    const ordDir = me.order && me.order.type === 'dir';
    if (Math.abs(dx - s.dir[0]) > 0.04 || Math.abs(dy - s.dir[1]) > 0.04 || (moving && !ordDir && s.dirT <= 0)) {
      if (moving || ordDir) this.app.world.command(me.id, { type: 'dir', dx, dy });
      s.dir = [dx, dy]; s.dirT = 0.12;
    }
    return { dx, dy, moving };
  }

  /** Lock the next target. directional: best match to `dir` excluding the current lock; else nearest / next by distance. */
  cycleLock(w, me, s, dir, directional) {
    const app = this.app;
    const cands = w.queryUnits(me.x, me.y, LOCK_RANGE, (u) => isEnemy(me, u, app) || (isCapturable(u) && visibleTo(app, u, me)), []);
    if (!cands.length) { s.lockId = -1; return; }
    if (directional) {
      let best = null, bs = 1e9;
      for (const u of cands) {
        if (u.id === s.lockId) continue;
        const d = Math.hypot(u.x - me.x, u.y - me.y);
        let da = Math.abs(Math.atan2(u.y - me.y, u.x - me.x) - dir); if (da > Math.PI) da = 2 * Math.PI - da;
        if (da > 1.1) continue;
        const sc = da * 6 + d * 0.25 + structurePenalty(u);
        if (sc < bs || (sc === bs && u.id < best.id)) { bs = sc; best = u; }
      }
      if (best) s.lockId = best.id;
      return;
    }
    cands.sort((a, b) => (Math.hypot(a.x - me.x, a.y - me.y) + structurePenalty(a)) - (Math.hypot(b.x - me.x, b.y - me.y) + structurePenalty(b)) || a.id - b.id);
    const i = cands.findIndex((u) => u.id === s.lockId);
    s.lockId = cands[(i + 1) % cands.length].id;
  }

  /** Lock id of a local's pad (reticle / HUD). */
  lockOf(local) { const s = local && local.padIndex >= 0 ? this.state.get(local.padIndex) : null; return s ? s.lockId : -1; }

  rumbleEvents(f) {
    const app = this.app, w = f.world, L = app.locals || [];
    if (!f.events || !f.events.length || !L.length) return;
    const pads = L.filter((l) => l.padIndex >= 0 && l.connected !== false);
    if (!pads.length) return;
    const pet = new Map();
    for (const l of pads) { const t = w.units.get(l.unitId); const p = t && t.mtTrainer ? activeUnit(w.mt, t) : null; if (p) pet.set(p.id, l); }
    const byTrainer = (id) => pads.find((l) => l.unitId === id);
    for (const e of f.events) {
      switch (e.type) {
        case 'hit': {
          if (!e.amount) break;
          const lt = byTrainer(e.tgt); if (lt) { rumblePattern(lt.padIndex, 'hitTrainer'); break; }
          const lp = pet.get(e.tgt); if (lp) { const u = w.units.get(e.tgt); if (u && e.amount > u.maxHp * 0.04) rumblePattern(lp.padIndex, 'hitMonster'); }
          break;
        }
        case 'death': { const l = byTrainer(e.id); if (l) rumblePattern(l.padIndex, 'death'); break; }
        case E.CAPTURE_WOBBLE: { const l = byTrainer(e.trainer); if (l) rumblePattern(l.padIndex, 'wobble'); break; }
        case E.CAPTURE_SUCCESS: { const l = byTrainer(e.trainer); if (l) rumblePattern(l.padIndex, 'capture'); break; }
        case E.CAPTURE_FAIL: { const l = byTrainer(e.trainer); if (l) rumblePattern(l.padIndex, 'captureFail'); break; }
        case E.EVOLVE_START: { const l = byTrainer(e.trainer); if (l) rumblePattern(l.padIndex, 'evolveStart'); break; }
        case E.EVOLVE: { const l = byTrainer(e.trainer); if (l) rumblePattern(l.padIndex, 'evolve'); break; }
        case E.LEVEL_UP: { const l = byTrainer(e.trainer); if (l && !e.bench) rumblePattern(l.padIndex, 'levelUp'); break; }
        default: break;
      }
    }
  }
}

/** Synthesise a key press for the legacy listeners (Escape = pause menu / back). */
export function pressKey(code, key = code) {
  try {
    window.dispatchEvent(new KeyboardEvent('keydown', { code, key, bubbles: true, cancelable: true }));
    window.dispatchEvent(new KeyboardEvent('keyup', { code, key, bubbles: true, cancelable: true }));
  } catch { /* old browsers */ }
}

/** Try to start audio from a pad press (works where the browser counts pad input as activation; else the lobby's key/click does it). */
export function unlockAudio(app) {
  const a = app && app.registry && app.registry.get('audio');
  if (!a || (a.ac && a.ac.state === 'running')) return;
  try { a.resume && a.resume(); } catch { /* not allowed yet */ }
}

function visibleTo(app, u, me) {
  if (app.mtSees) return app.mtSees(u) || u.team === me.team;
  return !u.visible || u.visible[me.team] !== false;
}

function structurePenalty(u) { return u.kind === 'tower' || u.kind === 'inhibitor' || u.kind === 'nexus' ? 4 : u.kind === 'minion' ? 1.5 : 0; }

// eslint-disable-next-line no-unused-vars
export function isEnemy(me, u, _app) {
  return !!u && u.alive && u.team !== me.team && (u.team !== 2 || u.kind === 'monster') && !u.untargetable && !u.invulnerable && (!u.visible || u.visible[me.team] !== false) &&
    (u.kind === 'champion' || u.kind === 'minion' || u.kind === 'monster' || u.kind === 'tower' || u.kind === 'inhibitor' || u.kind === 'nexus');
}

function nearest(w, x, y, r, pred) {
  let best = null, bd = 1e9;
  for (const u of w.queryUnits(x, y, r, pred, [])) { const d = Math.hypot(u.x - x, u.y - y) + structurePenalty(u) * 0.3; if (d < bd || (d === bd && u.id < best.id)) { bd = d; best = u; } }
  return best;
}

/** Best unit around `me` along direction `dir` (angle-weighted distance). */
export function pick(w, me, dir, range, pred) {
  let best = null, bs = 1e9;
  for (const u of w.queryUnits(me.x, me.y, range, pred, [])) {
    const d = Math.hypot(u.x - me.x, u.y - me.y);
    let da = Math.abs(Math.atan2(u.y - me.y, u.x - me.x) - dir); if (da > Math.PI) da = 2 * Math.PI - da;
    const s = d * (1 + da * 0.9) + structurePenalty(u);
    if (s < bs || (s === bs && u.id < best.id)) { bs = s; best = u; }
  }
  return best;
}
