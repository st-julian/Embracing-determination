// mt/ui/glyphs.js — input-device tracking (last input: keyboard/mouse, gamepad or touch) and button glyphs
// (keycaps or DualSense ✕○□△ L1 R1 L2 R2 / D-pad / touch button icons). Owner: HUD. Read-only w.r.t. input: it never sends commands.

import * as art from './art.js';

/** Action -> [keyboard label, pad button id] (DESIGN §2 controls table). */
export const BINDS = {
  attack: ['Space', 'cross'], capture: ['E', 'circle'], a1: ['Q', 'square'], a2: ['W', 'triangle'],
  swap: ['F', 'L1'], skill: ['R', 'R1'], potion: ['D', 'L2'], lock: ['Tab', 'R2'], evolve: ['T', 'up'],
  regroup: ['G', 'down'], recall: ['B', 'left'], score: ['`', 'create'], pause: ['Esc', 'options'], move: ['RMB', 'ls'],
};

const PS_COL = { cross: '#8fb4ff', circle: '#ff7a7a', square: '#f59ad8', triangle: '#52dcb0' };
const SHAPE = {
  cross: '<path d="M3 3L9 9M9 3L3 9" stroke-width="1.6" stroke-linecap="round"/>',
  circle: '<circle cx="6" cy="6" r="3.3" stroke-width="1.4" fill="none"/>',
  square: '<rect x="3" y="3" width="6" height="6" rx=".4" stroke-width="1.4" fill="none"/>',
  triangle: '<path d="M6 2.6L9.6 8.8H2.4Z" stroke-width="1.3" stroke-linejoin="round" fill="none"/>',
};
const DPAD = { up: 'M5 1h2v4H5z', down: 'M5 7h2v4H5z', left: 'M1 5h4v2H1z', right: 'M7 5h4v2H7z' };

// Xbox: face buttons by standard-mapping position (✕->A, ○->B, □->X, △->Y)
const XB = { cross: ['A', '#5fd35f'], circle: ['B', '#ff6a5a'], square: ['X', '#5aa8ff'], triangle: ['Y', '#ffd23a'] };
const XB_SH = { L1: 'LB', R1: 'RB', L2: 'LT', R2: 'RT', create: '\u29c9', options: '\u2261', ls: 'LS' };

// touch: hint chips show the icon of the on-screen button that does the action (same art as the cluster / card buttons)
const TOUCH_ICON = { capture: 'trainer/capture', swap: 'trainer/swap', potion: 'trainer/potion', recall: 'trainer/recall', skill: 'trainer/rally', evolve: 'trainer/evolve' };
const TOUCH_LAB = { a1: '1', a2: '2', attack: '\u25cf', lock: '\u25ce', regroup: '\u21b5', score: '\u2261', pause: '\u2261', move: '\u2725' };
const iconURL = new Map();
function touchGlyph(action) {
  const id = TOUCH_ICON[action];
  if (id) {
    let u = iconURL.get(id);
    if (u === undefined) { try { const c = art.icon(id, 10); u = c ? c.toDataURL() : ''; } catch { u = ''; } iconURL.set(id, u); }
    if (u) return `<span class="gp tch" aria-hidden="true"><img class="px" src="${u}" alt=""></span>`;
  }
  return `<span class="gp tch t" aria-hidden="true">${TOUCH_LAB[action] || '\u25cf'}</span>`;
}

/** HTML for a button glyph. style: false/'kbm' keys, true/'ps' DualSense, 'xbox' Xbox, 'touch' tap mark. */
export function glyphHTML(action, pad) {
  const b = BINDS[action]; if (!b) return '';
  if (pad === 'touch') return touchGlyph(action);   // touch: the on-screen button's own icon (the button is tapped directly)
  if (pad === 'xbox') {
    const id = b[1];
    if (XB[id]) return `<span class="gp face xb" style="color:${XB[id][1]}">${XB[id][0]}</span>`;
    if (XB_SH[id]) return `<span class="gp sh${id[1] === '2' ? ' trig' : ''}">${XB_SH[id]}</span>`;
    pad = true;
  }
  if (!pad || pad === 'kbm') {
    const k = b[0];
    return `<span class="gk${k.length > 2 ? ' wide' : ''}">${k}</span>`;
  }
  const id = b[1];
  if (SHAPE[id]) return `<span class="gp face"><svg viewBox="0 0 12 12" stroke="${PS_COL[id]}" fill="${PS_COL[id]}">${SHAPE[id]}</svg></span>`;
  if (DPAD[id]) {
    const arms = Object.entries(DPAD).map(([k, d]) => `<path d="${d}" fill="${k === id ? '#ffd23a' : '#5a6490'}"/>`).join('');
    return `<span class="gp dpad"><svg viewBox="0 0 12 12"><rect x="5" y="5" width="2" height="2" fill="#5a6490"/>${arms}</svg></span>`;
  }
  const lab = { L1: 'L1', R1: 'R1', L2: 'L2', R2: 'R2', create: '≡', options: '≡', ls: 'L' }[id] || id;
  return `<span class="gp sh${id[1] === '2' ? ' trig' : ''}">${lab}</span>`;
}

/** Tracks the last used input family globally ('kbm' | 'pad' | 'touch'); touch is sticky once seen. */
export class InputTracker {
  constructor() {
    this.last = 'none'; this.touchSeen = false; this.padSeen = false; this.version = 0;
    const set = (v) => { if (this.last !== v) { this.last = v; this.version++; } };
    this._k = () => set('kbm');
    this._p = (e) => {
      if (e.pointerType === 'touch') { if (!this.touchSeen) { this.touchSeen = true; this.version++; document.body.classList.add('mt-touch'); } set('touch'); } else set('kbm');
    };
    this._t = () => { if (!this.touchSeen) { this.touchSeen = true; this.version++; document.body.classList.add('mt-touch'); } set('touch'); };
    addEventListener('keydown', this._k, true); addEventListener('pointerdown', this._p, true); addEventListener('touchstart', this._t, { capture: true, passive: true });
    this.prevPad = new Map();
  }
  /** Poll gamepads once per frame: any new button press / big stick move -> 'pad'. */
  poll() {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return;
    let list; try { list = navigator.getGamepads(); } catch { return; }
    for (const gp of list) {
      if (!gp || !gp.connected) continue;
      let sig = 0;
      for (let i = 0; i < gp.buttons.length; i++) if (gp.buttons[i] && (gp.buttons[i].pressed || gp.buttons[i].value > 0.5)) sig |= 1 << i;
      for (let i = 0; i < Math.min(4, gp.axes.length); i++) if (Math.abs(gp.axes[i]) > 0.5) sig |= 1 << (24 + i);
      const prev = this.prevPad.get(gp.index) || 0;
      if (sig && sig !== prev) { if (!this.padSeen) { this.padSeen = true; } if (this.last !== 'pad') { this.last = 'pad'; this.version++; } }
      this.prevPad.set(gp.index, sig);
    }
  }
  /** Should HUD glyphs for this local show pad buttons? */
  /**
   * Glyph style for a local: 'ps' | 'xbox' | 'kbm' | 'touch'. Controller-first: DualSense unless the last input
   * on this machine was touch ('touch') or keyboard/mouse ('kbm'); a pad-driven local uses its own pad family.
   */
  styleFor(local, single) {
    // the input layer tracks this per local (controller-first: 'ps' until keys / touch / an Xbox pad are used)
    if (local && (local.glyphs === 'ps' || local.glyphs === 'xbox' || local.glyphs === 'kbm' || local.glyphs === 'touch')) return local.glyphs;
    if (this.last === 'touch') return 'touch';
    if (local && local.device && local.device.startsWith('pad')) return local.glyphs === 'xbox' ? 'xbox' : 'ps';
    if (this.last === 'kbm' && (single || !local || local.device === 'kbm')) return 'kbm';
    if (local && local.device && local.device.startsWith('pad') && local.padGlyphs === 'xbox') return 'xbox';
    return 'ps';
  }
  dispose() {
    removeEventListener('keydown', this._k, true); removeEventListener('pointerdown', this._p, true);
    removeEventListener('touchstart', this._t, { capture: true });
  }
}
