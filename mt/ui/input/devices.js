// mt/ui/input/devices.js — Gamepad API normalisation (DESIGN §2). Owner: input specialist.
//
// readPads() turns every connected pad into a NormPad whose `b[]` follows the W3C "standard" layout whatever the
// browser reports, with radial dead zones + response curves on the sticks. Everything else (lobby, in-game pad
// control, menu navigation, rumble) reads pads only through this module.
//
// Standard indices: 0 ✕/A  1 ○/B  2 □/X  3 △/Y  4 L1  5 R1  6 L2  7 R2  8 Create/View  9 Options/Menu  10 L3  11 R3
//                   12 ↑  13 ↓  14 ←  15 →  16 PS/Guide  17 touchpad      axes: 0 LX 1 LY 2 RX 3 RY (down/right = +)
//
// Non-standard fallbacks (mapping === ''), detected from the pad id:
//   DualSense / DualShock (id contains 'DualSense', 'Wireless Controller' or vendor '054c'):
//     'dinput' layout (Chrome/Edge on Windows/macOS without the standard mapping; ≥14 buttons, hat switch on an axis):
//        buttons □0 ✕1 ○2 △3 L1 4 R1 5 L2 6 R2 7 Create 8 Options 9 L3 10 R3 11 PS 12 Pad 13; axes LX0 LY1 RX2 RY5, hat axis 9 (or last)
//     'evdev' layout (Firefox / Linux hid-playstation; 13 buttons, 8 axes):
//        buttons ✕0 ○1 △2 □3 L1 4 R1 5 L2 6 R2 7 Create 8 Options 9 PS 10 L3 11 R3 12; axes LX0 LY1 L2 2 RX3 RY4 R2 5 dpadX6 dpadY7
//   anything else non-standard: indices are taken as-is (best effort; most XInput pads report 'standard' anyway).

import { t as i18n, tOr } from '../../i18n/index.js';

export const BTN = Object.freeze({ CROSS: 0, CIRCLE: 1, SQUARE: 2, TRIANGLE: 3, L1: 4, R1: 5, L2: 6, R2: 7, CREATE: 8, OPTIONS: 9, L3: 10, R3: 11, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15, HOME: 16, PAD: 17 });

/** Stick tuning (radial dead zone, outer saturation, response exponent). */
export const STICK = Object.freeze({ inner: 0.16, outer: 0.94, moveExp: 1.0, aimExp: 1.6, flick: 0.85, flickReset: 0.35 });

/** Button glyphs per family (HUD prompts / lobby). */
export const GLYPHS = Object.freeze({
  ps: { 0: '✕', 1: '○', 2: '□', 3: '△', 4: 'L1', 5: 'R1', 6: 'L2', 7: 'R2', 8: 'Create', 9: 'Options', 12: '↑', 13: '↓', 14: '←', 15: '→' },
  xbox: { 0: 'A', 1: 'B', 2: 'X', 3: 'Y', 4: 'LB', 5: 'RB', 6: 'LT', 7: 'RT', 8: 'View', 9: 'Menu', 12: '↑', 13: '↓', 14: '←', 15: '→' },
});

/** @returns {'dualsense'|'dualshock'|'xbox'|'gamepad'} */
export function padKind(id = '') {
  const s = String(id).toLowerCase();
  if (s.includes('dualsense') || s.includes('0ce6') || s.includes('0df2')) return 'dualsense';
  if (s.includes('054c') || s.includes('dualshock') || s.includes('wireless controller') || s.includes('playstation')) return 'dualshock';
  if (s.includes('xbox') || s.includes('xinput') || s.includes('045e')) return 'xbox';
  return 'gamepad';
}
export const glyphFamily = (kind) => (kind === 'dualsense' || kind === 'dualshock' ? 'ps' : 'xbox');
export const kindLabel = (kind) => tOr('dev.' + kind, i18n('dev.gamepad')); // i18n: dev.dualsense|dualshock|xbox|gamepad

function layoutOf(gp, kind) {
  if (gp.mapping === 'standard') return 'standard';
  if (kind === 'dualsense' || kind === 'dualshock') {
    if (gp.buttons.length <= 13 && gp.axes.length >= 8) return 'evdev';
    return 'dinput';
  }
  return 'standard';
}

const pressedOf = (b) => !!(b && (b.pressed || b.value > 0.5));
const valOf = (b) => (b ? (typeof b.value === 'number' ? b.value : b.pressed ? 1 : 0) : 0);

/** Hat-switch axis value -> [up, down, left, right]. Neutral is ~1.29 (outside [-1, 1]). */
function hat(v) {
  if (typeof v !== 'number' || v > 1.05 || v < -1.05) return [false, false, false, false];
  const i = Math.round((v + 1) / (2 / 7)); // 0 up, 1 up-right, 2 right, 3 down-right, 4 down, 5 down-left, 6 left, 7 up-left
  return [i === 0 || i === 1 || i === 7, i >= 3 && i <= 5, i >= 5 && i <= 7, i >= 1 && i <= 3];
}

/** Radial dead zone + response curve. Returns [x, y, magnitude 0..1]. */
export function shapeStick(x, y, exp = 1) {
  x = x || 0; y = y || 0;
  const m = Math.hypot(x, y);
  if (m <= STICK.inner) return [0, 0, 0];
  const t = Math.min(1, (m - STICK.inner) / (STICK.outer - STICK.inner));
  const k = Math.pow(t, exp);
  return [(x / m) * k, (y / m) * k, k];
}

/**
 * @typedef {Object} NormPad
 * @property {number} index        Gamepad.index
 * @property {string} id
 * @property {string} kind         'dualsense'|'dualshock'|'xbox'|'gamepad'
 * @property {string} layout       'standard'|'dinput'|'evdev'
 * @property {boolean[]} b         pressed, standard indices 0..17
 * @property {number[]} v          analog values (L2 = v[6], R2 = v[7])
 * @property {number[]} raw        raw stick axes [lx, ly, rx, ry] (no dead zone)
 * @property {Gamepad} gp
 */

/** @returns {NormPad} */
export function normalize(gp) {
  const kind = padKind(gp.id), layout = layoutOf(gp, kind);
  const B = gp.buttons, A = gp.axes;
  const b = new Array(18).fill(false), v = new Array(18).fill(0);
  let raw;
  const put = (std, i) => { b[std] = pressedOf(B[i]); v[std] = valOf(B[i]); };
  if (layout === 'dinput') {
    put(0, 1); put(1, 2); put(2, 0); put(3, 3);
    for (let i = 4; i <= 11; i++) put(i, i);
    put(16, 12); put(17, 13);
    const h = hat(A.length > 9 ? A[9] : A[A.length - 1]);
    for (let k = 0; k < 4; k++) { b[12 + k] = h[k]; v[12 + k] = h[k] ? 1 : 0; }
    raw = [A[0] || 0, A[1] || 0, A[2] || 0, A.length > 5 ? A[5] || 0 : A[3] || 0];
  } else if (layout === 'evdev') {
    put(0, 0); put(1, 1); put(2, 3); put(3, 2); put(4, 4); put(5, 5); put(6, 6); put(7, 7); put(8, 8); put(9, 9); put(16, 10); put(10, 11); put(11, 12);
    const dx = A[6] || 0, dy = A[7] || 0;
    b[12] = dy < -0.5; b[13] = dy > 0.5; b[14] = dx < -0.5; b[15] = dx > 0.5;
    for (let k = 12; k < 16; k++) v[k] = b[k] ? 1 : 0;
    raw = [A[0] || 0, A[1] || 0, A[3] || 0, A[4] || 0];
  } else {
    for (let i = 0; i < 18 && i < B.length; i++) put(i, i);
    raw = [A[0] || 0, A[1] || 0, A[2] || 0, A[3] || 0];
  }
  return { index: gp.index, id: gp.id, kind, layout, b, v, raw, gp };
}

/** All connected pads, normalised. */
export function readPads() {
  const out = [];
  if (typeof navigator === 'undefined' || !navigator.getGamepads) return out;
  let list;
  try { list = navigator.getGamepads(); } catch { return out; }
  for (const gp of list || []) if (gp && gp.connected !== false && gp.buttons && gp.axes) out.push(normalize(gp));
  return out;
}

/** Per-pad edge/hold tracker. `tick(pad, dt)` once per frame, then `down(i)`, `held(i, s)`, `heldFor(i)`. */
export class PadState {
  constructor() { this.prev = new Array(18).fill(false); this.cur = new Array(18).fill(false); this.holdT = new Array(18).fill(0); this.flickArmed = true; this.repeatT = 0; this.lastDir = ''; }
  tick(pad, dt) {
    const p = this.prev; this.prev = this.cur; this.cur = p;
    for (let i = 0; i < 18; i++) { this.cur[i] = pad.b[i]; this.holdT[i] = this.cur[i] ? this.holdT[i] + dt : 0; }
  }
  down(i) { return this.cur[i] && !this.prev[i]; }
  up(i) { return !this.cur[i] && this.prev[i]; }
  pressed(i) { return this.cur[i]; }
  heldFor(i) { return this.holdT[i]; }
  any() { for (let i = 0; i < 18; i++) if (this.cur[i] && !this.prev[i]) return true; return false; }
  /**
   * Menu navigation direction from D-pad or left stick with auto-repeat (0.32 s delay, then every 0.12 s).
   * @returns {''|'up'|'down'|'left'|'right'}
   */
  navDir(pad, dt) {
    const [x, y] = shapeStick(pad.raw[0], pad.raw[1]);
    let d = '';
    if (pad.b[BTN.UP] || y < -0.6) d = 'up'; else if (pad.b[BTN.DOWN] || y > 0.6) d = 'down';
    else if (pad.b[BTN.LEFT] || x < -0.6) d = 'left'; else if (pad.b[BTN.RIGHT] || x > 0.6) d = 'right';
    if (!d) { this.lastDir = ''; return ''; }
    if (d !== this.lastDir) { this.lastDir = d; this.repeatT = 0.32; return d; }
    this.repeatT -= dt;
    if (this.repeatT <= 0) { this.repeatT = 0.12; return d; }
    return '';
  }
}

// ------------------------------------------------------------------------------------------------- rumble
const lastRumble = new Map(); // pad index -> {until, strong}

/**
 * Rumble a pad if the browser exposes an actuator (Chrome: vibrationActuator 'dual-rumble'; Firefox: hapticActuators).
 * Overlapping requests keep the stronger one; silently does nothing when unsupported.
 */
export function rumble(padIndex, strong, weak, ms) {
  if (typeof navigator === 'undefined' || !navigator.getGamepads) return false;
  let gp = null;
  try { gp = navigator.getGamepads()[padIndex]; } catch { return false; }
  if (!gp) return false;
  const now = typeof performance !== 'undefined' ? performance.now() : 0;
  const prev = lastRumble.get(padIndex);
  if (prev && now < prev.until && prev.strong > strong + 0.05) return false;
  lastRumble.set(padIndex, { until: now + ms, strong });
  try {
    const va = gp.vibrationActuator;
    if (va && typeof va.playEffect === 'function') {
      const p = va.playEffect(va.type === 'trigger-rumble' ? 'trigger-rumble' : 'dual-rumble', { startDelay: 0, duration: ms, strongMagnitude: Math.min(1, strong), weakMagnitude: Math.min(1, weak) });
      if (p && p.catch) p.catch(() => {});
      return true;
    }
    const ha = gp.hapticActuators && gp.hapticActuators[0];
    if (ha && typeof ha.pulse === 'function') { const p = ha.pulse(Math.min(1, Math.max(strong, weak)), ms); if (p && p.catch) p.catch(() => {}); return true; }
  } catch { /* unsupported */ }
  return false;
}

/** Named rumble patterns (strong, weak, ms). Patterns with several pulses are scheduled with setTimeout. */
export const RUMBLE = Object.freeze({
  hitTrainer: [[0.55, 0.35, 110]],
  hitMonster: [[0.18, 0.32, 70]],
  ability: [[0.0, 0.28, 60]],
  throw: [[0.0, 0.22, 50]],
  wobble: [[0.32, 0.0, 90]],
  capture: [[0.25, 0.6, 120], [0, 0, 80], [0.6, 1.0, 260]],
  captureFail: [[0.7, 0.2, 180]],
  evolveStart: [[0.1, 0.3, 300], [0.2, 0.45, 400], [0.35, 0.6, 500]],
  evolve: [[1.0, 1.0, 420]],
  levelUp: [[0.0, 0.45, 120]],
  death: [[1.0, 0.6, 500]],
  ui: [[0.0, 0.18, 35]],
  join: [[0.3, 0.6, 140]],
});

export function rumblePattern(padIndex, name) {
  const P = RUMBLE[name]; if (!P) return;
  let t = 0;
  for (const [s, w, ms] of P) {
    if (s || w) { if (t === 0) rumble(padIndex, s, w, ms); else setTimeout(() => rumble(padIndex, s, w, ms), t); }
    t += ms;
  }
}
