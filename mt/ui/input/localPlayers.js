// mt/ui/input/localPlayers.js — local human slots (DESIGN §2). Owner: input/lobby specialist.
//
// `app.locals` = LocalSlot[] — the single source of truth for "who is a local human, on which device, which colour".
// Rebuilt on every 'match' event from `world.players` entries with bot === false (fields written by the lobby /
// roster: device, localSlot, inputType, padId, look, wasd). Fires `app.fire('locals', app.locals)` on every change.
//
// Primary local (camera owner for 1 local, legacy HUD/audio owner, keyboard+mouse target):
//   app.playerId = the 'kbm' local's trainer if there is one, else P1's;  app.viewerTeam = that local's team.
// Vision (see docs/arch/input-lobby.md): app.mtView = {versus, teams:[...local teams], fog}
//   co-op (all locals on one team): normal fog of war for that team.
//   versus (locals on both teams): one shared screen cannot hide anything from players sitting side by side, so fog of
//   war is OFF (pipeline.fogOfWar = false) and render/HUD code should use app.mtSees(unit) = union vision of the local
//   teams instead of `unit.visible[viewerTeam]`.
//
// Commands for a local always go through world.command(slot.unitId, cmd) — never through app.playerId.

/**
 * @typedef {Object} LocalSlot
 * @property {number} slot        0..3 (P1..P4; stable from the lobby into the match)
 * @property {string} label       'P1'..'P4'
 * @property {number} unitId      trainer unit id
 * @property {number} team        0 blue | 1 red
 * @property {string} device      'kbm' | 'pad:<gamepad.index>'
 * @property {number} padIndex    gamepad index, -1 for keyboard+mouse
 * @property {string} padId       Gamepad.id ('' for kbm)
 * @property {'kbm'|'dualsense'|'dualshock'|'xbox'|'gamepad'} inputType
 * @property {'kbm'|'ps'|'xbox'|'touch'} glyphs   button glyphs to show for this local right now: pad glyphs by default
 *                                (controller-first), 'touch' after a touch, 'kbm' only after a real key press
 * @property {'pad'|'touch'|'kbm'} inputMode  last input family of this local
 * @property {boolean} lastInputGamepad   true when this local's most recent input came from a pad (P1 can use the
 *                                        keyboard/mouse AND a pad when nobody else holds the keyboard)
 * @property {string} color       HUD colour (P1 green, P2 yellow, P3 pink, P4 cyan)
 * @property {string} colorDark   outline/shadow shade of `color`
 * @property {string} colorName
 * @property {string} name
 * @property {'attack'|'healing'|'magic'} spec
 * @property {'attack'|'healing'|'magic'} look   trainer outfit (sprite 'trainer_<look>_<blue|red>'); also unit.mtLook
 * @property {boolean} wasd       keyboard local uses WASD movement (abilities move to Q/E, capture C)
 * @property {boolean} connected  false while the pad is unplugged (a bot drives the trainer meanwhile)
 */

export const SLOT_COLORS = ['#3fb64a', '#f5cf2c', '#e85fd0', '#4fd0e8'];
export const SLOT_DARK = ['#1f6e2a', '#9a7a08', '#8a2a7a', '#1a7488'];
export const SLOT_NAMES = ['Green', 'Yellow', 'Pink', 'Cyan'];

export class LocalPlayers {
  constructor(ctx) {
    this.app = ctx.app; this.ctx = ctx;
    this.app.locals = this.app.locals || [];
    this.app.mtLocals = this;
    this.app.mtView = this.app.mtView || { versus: false, teams: [0], fog: true };
    this.app.mtSees = (u) => sees(this.app, u);
    this.app.mtInputMode = null; this.setMode('pad'); // controller-first default (touch / keys switch it on real use)
    this.app.on('match', (w) => this.rebuild(w));
    if (this.app.world) this.rebuild(this.app.world);
    if (typeof window !== 'undefined') {
      window.addEventListener('gamepaddisconnected', (e) => this.padLost(e.gamepad.index));
      window.addEventListener('gamepadconnected', (e) => this.padBack(e.gamepad));
    }
  }

  rebuild(w) {
    const L = [];
    const used = new Set();
    // online match (mt/net/online.js): every human is bot:false, but only ONE is on this machine — app.mtNetLocal =
    // {slot, device, inputType, padId, wasd} names it (roster entries carry netSlot); remote humans keep their look
    const net = this.app.mtNetLocal;
    if (net) {
      for (const p of w.players || []) {
        if (p.bot || p.netSlot == null) continue;
        if (p.netSlot === net.slot) Object.assign(p, { device: net.device || 'kbm', localSlot: 0, inputType: net.inputType || (net.device && net.device.startsWith('pad:') ? 'gamepad' : 'kbm'), padId: net.padId || '', wasd: !!net.wasd });
        else { const u = w.units.get(p.unitId); if (u) u.mtLook = p.look || p.spec; }
      }
    }
    const humans = (w.players || []).filter((p) => !p.bot && !(net && p.netSlot != null && p.netSlot !== net.slot));
    for (const p of humans) if (Number.isInteger(p.localSlot) && p.localSlot >= 0 && p.localSlot < 4 && !used.has(p.localSlot)) used.add(p.localSlot); else p.localSlot = -1;
    for (const p of humans) {
      if (p.localSlot < 0) { let s = 0; while (used.has(s)) s++; p.localSlot = s; used.add(s); }
      const dev = p.device || (L.length === 0 ? 'kbm' : 'pad:' + (p.localSlot - 1));
      L.push(makeSlot(p.localSlot, p.unitId, p.team, dev, p));
    }
    L.sort((a, b) => a.slot - b.slot);
    for (const l of L) { const u = w.units.get(l.unitId); if (u) { u.mtLook = l.look; u.mtLocal = l.slot; } }
    // bots keep their spec as their look
    for (const c of w.champions || []) if (c.mtTrainer && c.mtLook == null) c.mtLook = c.mtTrainer.spec;
    this.app.locals = L;
    this.applyPrimary();
  }

  /** Primary local, view mode and fog; fires 'locals'. */
  applyPrimary() {
    const app = this.app, L = app.locals;
    if (L.length) {
      const prim = L.find((l) => l.device === 'kbm') || L[0];
      app.playerId = prim.unitId; app.viewerTeam = prim.team;
    }
    const teams = [...new Set(L.map((l) => l.team))].sort();
    const versus = teams.length > 1;
    app.mtView = { versus, teams: teams.length ? teams : [app.viewerTeam], fog: !versus, shared: L.length > 1 };
    const pl = app.pipeline; if (pl && 'fogOfWar' in pl) pl.fogOfWar = !versus;
    app.fire('locals', L);
  }

  byDevice(device) { return this.app.locals.find((l) => l.device === device) || null; }
  bySlot(slot) { return this.app.locals.find((l) => l.slot === slot) || null; }
  byUnit(id) { return this.app.locals.find((l) => l.unitId === id) || null; }
  /** The local that the keyboard + mouse drive (the 'kbm' local, else P1). */
  keyboardLocal() { return this.byDevice('kbm') || this.app.locals[0] || null; }

  /**
   * Mark which input family a local used last (HUD glyph prompts). CONTROLLER-FIRST: every local starts on pad glyphs
   * (DualSense unless it is an Xbox pad); the screen's own local switches to touch icons after a real touch and to
   * keycaps only after a real key press (mouse clicks do not switch). `src`: 'pad' | 'touch' | 'kbm' (true = 'pad',
   * false = 'kbm' for old callers). Also drives the global mode (see setMode).
   */
  noteInput(local, src) {
    const mode = src === true ? 'pad' : src === false ? 'kbm' : src;
    this.setMode(mode, local && local.device.startsWith('pad:') ? local.padGlyphs : null);
    if (!local) return;
    const glyphs = local.device.startsWith('pad:') && mode === 'pad' ? local.padGlyphs : mode === 'pad' ? (this.lastPadGlyphs || 'ps') : mode;
    const lig = mode === 'pad';
    if (local.lastInputGamepad === lig && local.glyphs === glyphs) return;
    local.lastInputGamepad = lig; local.glyphs = glyphs; local.inputMode = mode;
    this.app.fire('locals', this.app.locals);
  }

  /**
   * Global input mode of this screen: 'pad' (default) | 'touch' | 'kbm'. app.mtInputMode; <body> gets
   * .mt-touchui while touch is active (touch controls + bigger hit targets), .mt-padui while pad, .mt-kbmui while keys.
   * Fires app 'inputmode'.
   */
  setMode(mode, padGlyphs) {
    if (padGlyphs) this.lastPadGlyphs = padGlyphs;
    if (mode !== 'pad' && mode !== 'touch' && mode !== 'kbm') return;
    const app = this.app;
    if (app.mtInputMode === mode) return;
    app.mtInputMode = mode;
    if (typeof document !== 'undefined' && document.body) {
      const b = document.body.classList;
      b.toggle('mt-touchui', mode === 'touch'); b.toggle('mt-padui', mode === 'pad'); b.toggle('mt-kbmui', mode === 'kbm');
    }
    app.fire('inputmode', mode);
    app.fire('locals', app.locals || []);
  }

  /**
   * A gamepad joins mid-match: it takes over a bot trainer (P1's team first = co-op, else the other team).
   * @param {{index:number,id:string,kind:string}} pad normalised pad (devices.js)
   */
  joinPad(pad) {
    const app = this.app, w = app.world; if (!w) return null;
    if (app.mtNet && app.mtNet.active) return null; // online: the roster is shared by every peer (no drop-in)
    const dev = 'pad:' + pad.index;
    if (this.byDevice(dev)) return this.byDevice(dev);
    if (app.locals.length >= 4) return null;
    const pref = app.locals.length ? app.locals[0].team : app.viewerTeam;
    const cand = w.champions.find((c) => c.team === pref && c.bot && c.mtTrainer && c.alive) || w.champions.find((c) => c.team === pref && c.bot && c.mtTrainer) ||
      w.champions.find((c) => c.bot && c.mtTrainer);
    if (!cand) return null;
    let s = 0; while (this.bySlot(s)) s++;
    cand.bot = false;
    const p = w.players.find((q) => q.unitId === cand.id) || {};
    Object.assign(p, { bot: false, device: dev, localSlot: s, padId: pad.id, inputType: pad.kind, look: cand.mtLook || cand.mtTrainer.spec, spec: cand.mtTrainer.spec });
    const l = makeSlot(s, cand.id, cand.team, dev, p);
    cand.mtLocal = s; cand.mtLook = l.look;
    if (cand.mtTrainer) cand.mtTrainer.device = dev;
    app.locals.push(l); app.locals.sort((a, b) => a.slot - b.slot);
    this.applyPrimary();
    return l;
  }

  /** Give a local's trainer back to the bots (not the last local). */
  leave(slot) {
    const app = this.app, l = this.bySlot(slot); if (!l || app.locals.length <= 1) return false;
    if (app.mtNet && app.mtNet.active) return false; // online: unit.bot changes only through the lockstep (takeover)
    const u = app.world && app.world.units.get(l.unitId);
    if (u) { u.bot = true; u.mtLocal = undefined; }
    const p = app.world && app.world.players.find((q) => q.unitId === l.unitId); if (p) p.bot = true;
    app.locals.splice(app.locals.indexOf(l), 1);
    this.applyPrimary();
    return true;
  }

  padLost(index) {
    const l = this.byDevice('pad:' + index); if (!l) return;
    l.connected = false;
    const u = this.app.world && this.app.world.units.get(l.unitId);
    const online = !!(this.app.mtNet && this.app.mtNet.active); // online: a local unplug must not change the shared sim
    if (u && this.app.state === 'game' && !online) u.bot = true; // keep the trainer playing until the pad comes back
    this.app.fire('locals', this.app.locals);
  }
  padBack(gp) {
    const l = this.byDevice('pad:' + gp.index); if (!l || l.connected) return;
    l.connected = true;
    const u = this.app.world && this.app.world.units.get(l.unitId);
    if (u && !(this.app.mtNet && this.app.mtNet.active)) u.bot = false;
    this.app.fire('locals', this.app.locals);
  }
}

const screenMode = () => (globalThis.__moba && globalThis.__moba.mtInputMode) || 'pad';
const screenGlyphs = () => { const m = screenMode(); return m === 'pad' ? 'ps' : m; };

function makeSlot(slot, unitId, team, device, p = {}) {
  const pad = device.startsWith('pad:');
  const kind = pad ? (p.inputType && p.inputType !== 'kbm' ? p.inputType : 'gamepad') : 'kbm';
  const padGlyphs = kind === 'dualsense' || kind === 'dualshock' ? 'ps' : 'xbox';
  return {
    slot, label: 'P' + (slot + 1), unitId, team, device,
    padIndex: pad ? +device.slice(4) : -1, padId: p.padId || '', inputType: kind,
    glyphs: pad ? padGlyphs : screenGlyphs(), padGlyphs, lastInputGamepad: pad || screenMode() === 'pad', inputMode: pad ? 'pad' : screenMode(),
    color: SLOT_COLORS[slot % 4], colorDark: SLOT_DARK[slot % 4], colorName: SLOT_NAMES[slot % 4],
    name: p.name || 'Player ' + (slot + 1), spec: p.spec || 'attack', look: p.look || p.spec || 'attack',
    wasd: !!p.wasd, connected: true,
  };
}

/** Union vision of the local teams in versus, else the viewer team's vision. */
function sees(app, u) {
  if (!u) return false;
  if (!u.visible) return true;
  const v = app.mtView;
  if (v && v.versus) { for (const t of v.teams) if (u.visible[t] !== false) return true; return false; }
  return u.visible[app.viewerTeam] !== false;
}
