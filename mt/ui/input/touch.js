// mt/ui/input/touch.js — complete touch controls for phones / tablets (iPhone SE → iPad Pro, Android). Owner: input.
//
// Auto-activates on the first real touch (LocalPlayers.setMode('touch') -> body.mt-touchui) and hides again as soon as a
// pad button or a real key is pressed. Drives the screen's own local (the 'kbm' device local = app.playerId).
// Pointer Events only; every finger is tracked by pointerId, so moving and casting work at the same time.
//
//   left half      FLOATING JOYSTICK: appears where the thumb lands (a faint ghost rests bottom-left), analog,
//                  camera-relative 'dir' orders, leashed to the shared camera like the pads
//   world tap      tap an enemy / wild monster on the right half of the screen = lock it + monster attacks it
//   right cluster  ATTACK (big; tap = attack the lock / nearest enemy, hold = keep attacking; trainer sling with no
//                  monster) · MOVE 1 / MOVE 2 and CAPTURE with DRAG-TO-AIM (drag out = aim on the ground with the
//                  shared reticle, release = cast; drag back to the centre = cancel; tap = auto-aim) · capture-chance
//                  ring + % on the targeted wild monster · SWAP · TRAINER SKILL · POTION · TARGET (tap = cycle lock,
//                  hold = clear) · EVOLVE (contextual, pulses when ready). With skill CARDS on, the card bar
//                  (skillcards.js, bottom between the HUD card and the cluster) replaces SKILL and TARGET takes its slot
//   top-left       PAUSE (≡) · SCOREBOARD · RECALL (hold 0.5 s to start the channel) · REGROUP
//   minimap        drag = camera peek (HUD minimap); long-press = ping
//   portrait       a "rotate to landscape" screen
// Cooldown sweeps + seconds, disabled / locked states, press feedback, ready flash. Sizes scale with the short screen
// side (every hit target >= 48 CSS px); positions respect env(safe-area-inset-*).

import { t } from '../../i18n/index.js';
import * as art from '../art.js';
import { isCapturable, captureChance } from '../../sim/capture.js';
import { activeUnit } from '../../sim/monsters.js';
import { evolveReady } from '../../sim/progression.js';
import { FORMS } from '../../data/species.js';
import { abilityFor } from '../../data/abilities.js';
import { CAPTURE, TRAINER, SPEC_SKILL_CD } from '../../data/balance.js';
import { isEnemy, pick } from './gamepad.js';

const SPEC_ICON = { attack: 'trainer/rally', healing: 'trainer/mend', magic: 'trainer/surge' };
const DRAG_MIN = 16;          // px: farther = aiming (else a tap)
const AIM_PX = 84;            // px of drag for full range
const RECALL_HOLD = 0.5, TARGET_HOLD = 0.55, PING_HOLD = 0.5;
const SWORD = '<svg viewBox="0 0 24 24" width="46%" height="46%"><path d="M4 20l5-5M6.5 17.5l-3-3M14 4h6v6L10 20l-6-6z" fill="#fffaf0" stroke="#1b2350" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/></svg>';
const TARGET_SVG = '<svg viewBox="0 0 24 24" width="56%" height="56%"><circle cx="12" cy="12" r="7.5" fill="none" stroke="#1b2350" stroke-width="2.6"/><path d="M12 1.5v5M12 17.5v5M1.5 12h5M17.5 12h5" stroke="#d2382a" stroke-width="2.6" stroke-linecap="round"/><circle cx="12" cy="12" r="2.2" fill="#d2382a"/></svg>';
const LOCK_SVG = '<svg viewBox="0 0 24 24"><path d="M7 11V8a5 5 0 0 1 10 0v3" fill="none" stroke="#1b2350" stroke-width="3.2"/><path d="M7 11V8a5 5 0 0 1 10 0v3" fill="none" stroke="#fffaf0" stroke-width="1.4"/><rect x="4.5" y="10.5" width="15" height="11" rx="2.5" fill="#ffd23a" stroke="#1b2350" stroke-width="2"/><circle cx="12" cy="15.6" r="1.7" fill="#1b2350"/></svg>';
const REGROUP_SVG = '<svg viewBox="0 0 24 24" width="56%" height="56%"><path d="M12 3a9 9 0 1 0 9 9" fill="none" stroke="#1b2350" stroke-width="2.6" stroke-linecap="round"/><path d="M21 3v6h-6" fill="none" stroke="#1b2350" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" fill="#3fb64a" stroke="#1b2350" stroke-width="1.6"/></svg>';

const el = (tag, cls, parent, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (parent) parent.appendChild(e); return e; };
const setCls = (e, c, on) => { if (e.classList.contains(c) !== !!on) e.classList.toggle(c, !!on); };
const setVar = (e, k, v) => { if (e.style.getPropertyValue(k) !== v) e.style.setProperty(k, v); };
const setTxt = (e, s) => { if (e.textContent !== s) e.textContent = s; };

export class TouchControls {
  constructor(ctx, locals, gamepad) {
    this.ctx = ctx; this.app = ctx.app; this.locals = locals; this.gamepad = gamepad;
    this.joy = null;          // {id, x0, y0, x, y}
    this.taps = new Map();    // world taps: pointerId -> {x, y, t}
    this.btn = {};            // name -> button record
    this.lockId = -1; this.lastDir = [0, 0]; this.dirT = 0; this.time = 0; this.vis = false;
    this.capTarget = -1;
    // contract for the HUD: is the cluster on screen + where (plate masks / card placement)
    this.app.mtTouch = { active: false, rects: () => this.rects() };
    if (typeof document === 'undefined') return;
    if (!document.getElementById('mt-touch-css')) {
      const l = document.createElement('link'); l.id = 'mt-touch-css'; l.rel = 'stylesheet'; l.href = new URL('./touch.css', import.meta.url).href; document.head.appendChild(l);
    }
    this.build();
    this.onDown = (e) => this.down(e);
    this.onMove = (e) => this.move(e);
    this.onUp = (e) => this.up(e);
    addEventListener('pointerdown', this.onDown, true);
    addEventListener('pointermove', this.onMove, true);
    addEventListener('pointerup', this.onUp, true);
    addEventListener('pointercancel', this.onUp, true);
    // no pinch-zoom / double-tap zoom / long-press callouts / rubber-band scrolling while playing on glass
    this.onGesture = (e) => e.preventDefault();
    this.onTouchMove = (e) => { if (this.app.state === 'game' || e.touches.length > 1) e.preventDefault(); };
    document.addEventListener('gesturestart', this.onGesture, { passive: false });
    document.addEventListener('touchmove', this.onTouchMove, { passive: false });
    this.onCtx = (e) => { if (this.app.mtInputMode === 'touch') e.preventDefault(); };
    addEventListener('contextmenu', this.onCtx, true);
    this.onResize = () => this.layout();
    addEventListener('resize', this.onResize); addEventListener('orientationchange', this.onResize);
    this.layout();
  }

  // ------------------------------------------------------------------ DOM
  build() {
    const r = this.root = el('div', null, document.body); r.id = 'mt-touch';
    this.joyEl = el('div', 'joy mt-hudmask', r); this.knob = el('div', 'knob', this.joyEl); this.arrow = el('div', 'arrow', this.joyEl);
    this.chance = el('div', 'chance', r); this.chlab = el('div', 'chlab', r); this.lkChip = el('div', 'chlab lkchip', r); this.lkT = -1;
    const mk = (name, size, opts = {}) => {
      const b = el('div', 'tb ' + size + (opts.cls ? ' ' + opts.cls : ''), opts.parent || r);
      b.dataset.tb = name;
      const rec = { name, el: b, size, icon: '', ic: null, glyph: null, cd: el('i', 'cd', b), num: el('span', 'num', b), hold: el('i', 'hold', b), lab: el('span', 'lab', b), aimr: null, aimk: null, cool: false, seen: false };
      if (opts.svg) { rec.glyph = el('span', 'glyph', b, opts.svg); } else { rec.ic = document.createElement('canvas'); rec.ic.className = 'ic'; b.insertBefore(rec.ic, rec.cd); }
      if (opts.text) { rec.glyph = el('span', 'glyph', b, opts.text); }
      if (opts.aim) { rec.aimr = el('i', 'aimr', b); rec.aimk = el('i', 'aimk', b); }
      rec.lk = el('span', 'lk', b, LOCK_SVG);
      b.addEventListener('pointerdown', (e) => this.btnDown(rec, e));
      b.addEventListener('pointermove', (e) => this.btnMove(rec, e));
      b.addEventListener('pointerup', (e) => this.btnUp(rec, e, false));
      b.addEventListener('pointercancel', (e) => this.btnUp(rec, e, true));
      b.addEventListener('lostpointercapture', (e) => { if (rec.pid === e.pointerId) this.btnUp(rec, e, true); });
      this.btn[name] = rec;
      return rec;
    };
    mk('attack', 'big', { svg: SWORD });
    mk('a1', 'mid', { aim: true }); mk('a2', 'mid', { aim: true }); mk('capture', 'mid', { aim: true });
    mk('swap', 'sm'); mk('skill', 'sm'); mk('potion', 'sm'); mk('target', 'sm', { svg: TARGET_SVG }); mk('evolve', 'sm', { cls: 'evo hidden' });
    const sys = this.sysEl = el('div', 'sys', r), sys2 = this.sys2El = el('div', 'sys2', r);
    mk('pause', 'sm', { cls: 'sys-b', parent: sys, text: '≡' }); mk('score', 'sm', { cls: 'sys-b', parent: sys, text: '☰' });
    mk('recall', 'sm', { parent: sys2 }); mk('regroup', 'sm', { parent: sys2, svg: REGROUP_SVG });
    this.setIcon(this.btn.capture, 'trainer/capture'); this.setIcon(this.btn.potion, 'trainer/potion'); this.setIcon(this.btn.swap, 'trainer/swap');
    this.setIcon(this.btn.recall, 'trainer/recall'); this.setIcon(this.btn.evolve, 'trainer/evolve');
    // rotate prompt (portrait)
    this.rot = el('div', null, document.body); this.rot.id = 'mt-rotate';
    this.rotIn = el('div', null, this.rot); el('div', 'ph', this.rotIn); this.rotTxt = el('div', null, this.rotIn);
    // safe-area probe
    this.probe = el('div', null, document.body);
    this.probe.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)';
    this.relabel();
  }

  relabel() {
    const L = { a1: 'touch.a1', a2: 'touch.a2', capture: 'touch.capture', swap: 'touch.swap', skill: 'touch.skill', potion: 'touch.potion', target: 'touch.target',
      evolve: 'touch.evolve', pause: 'touch.pause', score: 'touch.score', recall: 'touch.recall', regroup: 'touch.regroup' };
    for (const [k, key] of Object.entries(L)) if (this.btn[k]) setTxt(this.btn[k].lab, t(key));
    setTxt(this.rotTxt, t('touch.rotate'));
    this.langKey = this.app && globalThis.__mtI18n && globalThis.__mtI18n.getLang ? globalThis.__mtI18n.getLang() : '';
  }

  setIcon(b, id) {
    if (!b.ic || b.icon === id) return; b.icon = id;
    const c = id ? art.icon(id, 32) : null;
    b.ic.width = 32; b.ic.height = 32; const g = b.ic.getContext('2d'); g.clearRect(0, 0, 32, 32); if (c) g.drawImage(c, 0, 0);
  }

  /** Sizes + positions from the viewport and safe areas (called on resize / orientation change). */
  layout() {
    if (!this.root) return;
    const W = innerWidth, H = innerHeight, s = Math.min(W, H);
    const sa = this.safeArea();
    const cl = (v, a, b) => Math.max(a, Math.min(b, v));
    const tb = Math.round(cl(s * 0.2, 74, 112)), ta = Math.round(cl(s * 0.15, 56, 84)), tu = Math.round(cl(s * 0.125, 48, 66));
    const pad = Math.round(cl(s * 0.04, 12, 28));
    const jr = Math.round(cl(s * 0.17, 60, 96));
    this.sz = { tb, ta, tu, jr, sa, W, H };
    if (this.app.mtTouch) this.app.mtTouch.sz = { tb, ta, tu, jr, sa: { ...sa } }; // the HUD sizes its Menu / Scores to tu
    const R = this.root;
    setVar(R, '--sl', sa.l + 'px'); setVar(R, '--sr', sa.r + 'px'); setVar(R, '--st', sa.t + 'px'); setVar(R, '--sb', sa.b + 'px');
    setVar(R, '--tb', tb + 'px'); setVar(R, '--ta', ta + 'px'); setVar(R, '--tu', tu + 'px');
    setVar(R, '--jr2', jr * 2 + 'px'); setVar(R, '--jk', Math.round(jr * 0.8) + 'px'); setVar(R, '--aimR', Math.round(AIM_PX * 0.6) + 'px');
    // attack centre, then rings around it (angles: 0 = left, 90 = up)
    const ax = W - sa.r - pad - tb / 2, ay = H - Math.max(sa.b, 4) - pad - tb / 2;
    const R1 = tb / 2 + ta / 2 + Math.round(s * 0.03) + 8, R2 = R1 + ta / 2 + tu / 2 + Math.round(s * 0.03) + 8;
    const at = (b, R0, deg) => { const a = deg * Math.PI / 180; this.place(b, ax - R0 * Math.cos(a), ay - R0 * Math.sin(a)); };
    this.place(this.btn.attack, ax, ay);
    at(this.btn.a1, R1, 0); at(this.btn.a2, R1, 45); at(this.btn.capture, R1, 90);
    // ring 2: SWAP, SKILL, POTION, EVOLVE (contextual) — squeezed below the minimap when it hangs low (phones)
    let a2max = 68;
    const hudZ = this.hud(), zz = hudZ && hudZ.touch && hudZ.touchZones ? hudZ.touchZones() : null, mm = zz && zz.minimap;
    if (mm && mm.width > 0) {
      const lim = (ay - (mm.bottom + 6 + tu / 2)) / R2;
      if (lim < Math.sin(a2max * Math.PI / 180)) a2max = Math.max(36, Math.asin(Math.max(-1, Math.min(1, lim))) * 180 / Math.PI);
    }
    const a2s = [-4, -4 + (a2max + 4) / 3, -4 + (a2max + 4) * 2 / 3, a2max];
    // skill CARDS on (skillcards.js): the card bar replaces SKILL; TARGET takes SKILL's ring slot so the bottom row left
    // of the cluster is free for the 5 cards
    const cards = this.cardsOn = !!(this.app.mtCardsUI && this.app.mtCardsUI.on);
    at(this.btn.swap, R2, a2s[0]); at(this.btn.potion, R2, a2s[2]); at(this.btn.evolve, R2, a2s[3]);
    if (cards) at(this.btn.target, R2, a2s[1]);
    else {
      at(this.btn.skill, R2, a2s[1]);
      // TARGET: on the bottom row, left of the cluster (right thumb reach)
      this.place(this.btn.target, ax - R2 - tu - Math.round(s * 0.02) - 8, ay + Math.round(tb * 0.12));
    }
    // joystick ghost rest position + zone
    this.joyRest = { x: sa.l + pad + jr + 8, y: H - Math.max(sa.b, 4) - pad - jr - 4 };
    this.zoneX = Math.min(W * 0.48, this.btn.target.x - tu);   // left of the cluster (and its TARGET button)
    this.zoneTop = sa.t + tu + 18;                   // below the system buttons
    // top-left: my Menu/Scores row (unless the HUD shows its own), then RECALL / REGROUP below whatever is there
    let top2 = sa.t + 8 + (this.hudSys ? 0 : tu + 12);
    const hud = this.hud(), z = hud && hud.touch && hud.touchZones ? hud.touchZones() : null;
    if (z) {
      const bt = (z.buttons || []).filter(Boolean).reduce((m, r) => Math.max(m, r.bottom), 0);
      if (this.hudSys && bt > 0) top2 = bt + 12;
      // keep the joystick ghost clear of the bottom-left card
      if (z.card && z.card.width > 0 && z.card.left < W * 0.4) this.joyRest.y = Math.min(this.joyRest.y, z.card.top - jr - 10);
    }
    this.sys2El.style.top = Math.round(top2) + 'px';
    if (!this.joy) this.joyAt(this.joyRest.x, this.joyRest.y);
    this.portrait();
  }
  /** Safe-area insets (CSS px): env(safe-area-inset-*) via a probe, or ?mtsafe=l,t,r,b (simulated notch, same as the HUD). */
  safeArea() {
    const q = this.app.params && this.app.params.get && this.app.params.get('mtsafe');
    if (q) { const [l, t, r, b] = String(q).split(',').map((v) => +v || 0); return { l, t, r, b }; }
    const cs = getComputedStyle(this.probe);
    return { t: parseFloat(cs.paddingTop) || 0, r: parseFloat(cs.paddingRight) || 0, b: parseFloat(cs.paddingBottom) || 0, l: parseFloat(cs.paddingLeft) || 0 };
  }
  place(b, x, y) { b.x = x; b.y = y; b.el.style.left = x.toFixed(1) + 'px'; b.el.style.top = y.toFixed(1) + 'px'; }
  joyAt(x, y) { this.joyEl.style.left = x + 'px'; this.joyEl.style.top = y + 'px'; }

  portrait() {
    const coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
    setCls(this.rot, 'on', (coarse || this.app.mtInputMode === 'touch') && innerHeight > innerWidth * 1.05);
  }

  // ------------------------------------------------------------------ helpers
  hud() { const ui = this.app.registry && this.app.registry.get('mt-ui'); return ui && ui.hud ? ui.hud : null; }
  rects() {
    const out = [];
    if (!this.vis) return out;
    for (const b of Object.values(this.btn)) if (b.el.offsetParent !== null && !b.el.classList.contains('hidden')) out.push(b.el.getBoundingClientRect());
    out.push(this.joyEl.getBoundingClientRect());
    return out;
  }
  local() { return this.locals.keyboardLocal(); }
  me() { const l = this.local(), w = this.app.world; return l && w ? w.units.get(l.unitId) : null; }
  send(cmd) { const l = this.local(), w = this.app.world; return !!(l && w && w.command(l.unitId, cmd)); }
  active() { return this.app.mtInputMode === 'touch' && this.app.state === 'game'; }
  modal() { const a = this.app; return a.paused || (a.ui && a.ui.panel && a.ui.panel !== 'none') || (this.gamepad && this.gamepad.legacyModal && this.gamepad.legacyModal()); }
  /** screen offset (px, y down) -> world direction (camera-relative) */
  toWorld(dx, dy) {
    const rig = this.ctx.pipeline && this.ctx.pipeline.cameraRig, yaw = (rig && rig.yaw) || 0, c = Math.cos(yaw), s = Math.sin(yaw);
    return [dx * c + dy * s, -dx * s + dy * c];
  }
  aimState() {
    const l = this.local(); if (!l) return null;
    const A = this.app.mtAim || (this.app.mtAim = []);
    return A[l.slot] || (A[l.slot] = { active: false, x: 0, y: 0, dist: 0, lockId: -1, hold: null, at: 0 });
  }
  noteTouch() { const l = this.local(); this.locals.noteInput(l, 'touch'); }

  // ------------------------------------------------------------------ world pointers (joystick / taps)
  down(e) {
    if (e.pointerType !== 'touch') return;
    this.noteTouch();
    if (this.app.state !== 'game' || this.modal()) return;
    const tg = e.target;
    const world = tg && (tg.tagName === 'CANVAS' || tg.id === 'overlay-root' || tg.id === 'hud-root' || tg === document.body || tg.id === 'mt-touch' || tg.id === 'mt-ptags');
    if (!world) { // buttons, minimap, HUD panels handle their own pointers; the minimap also gets long-press = ping
      const mm = tg && tg.closest && tg.closest('.mmap');
      if (mm) { const r = mm.getBoundingClientRect(); this.mmPress = { id: e.pointerId, x: e.clientX, y: e.clientY, t: this.time, r }; }
      return;
    }
    e.preventDefault(); e.stopImmediatePropagation(); // the legacy controls must not also act on this finger
    const x = e.clientX, y = e.clientY;
    if (!this.joy && x < this.zoneX && y > this.zoneTop) {
      const jr = this.sz.jr, cx = Math.max(this.sz.sa.l + jr + 4, Math.min(this.zoneX, x)), cy = Math.max(jr + 4, Math.min(innerHeight - jr - 4, y));
      this.joy = { id: e.pointerId, x0: cx, y0: cy, x, y };
      this.joyAt(cx, cy); setCls(this.joyEl, 'act', true); this.knobAt(x - cx, y - cy);
      return;
    }
    this.taps.set(e.pointerId, { x, y, t: performance.now() });
  }
  move(e) {
    if (e.pointerType !== 'touch') return;
    if (this.mmPress && e.pointerId === this.mmPress.id && Math.hypot(e.clientX - this.mmPress.x, e.clientY - this.mmPress.y) > 10) this.mmPress = null;
    if (this.joy && e.pointerId === this.joy.id) { this.joy.x = e.clientX; this.joy.y = e.clientY; this.knobAt(this.joy.x - this.joy.x0, this.joy.y - this.joy.y0); e.preventDefault(); e.stopImmediatePropagation(); return; }
    if (this.taps.has(e.pointerId)) { e.stopImmediatePropagation(); }
  }
  up(e) {
    if (e.pointerType !== 'touch') return;
    if (this.mmPress && e.pointerId === this.mmPress.id) this.mmPress = null;
    if (this.joy && e.pointerId === this.joy.id) {
      this.joy = null; setCls(this.joyEl, 'act', false); this.knobAt(0, 0); this.joyAt(this.joyRest.x, this.joyRest.y);
      e.stopImmediatePropagation(); return;
    }
    const tp = this.taps.get(e.pointerId);
    if (tp) {
      this.taps.delete(e.pointerId); e.stopImmediatePropagation();
      if (Math.hypot(e.clientX - tp.x, e.clientY - tp.y) < 14 && performance.now() - tp.t < 450) this.worldTap(tp.x, tp.y);
    }
  }
  knobAt(dx, dy) {
    const R = this.sz.jr, m = Math.hypot(dx, dy), k = m > R ? R / m : 1;
    this.knob.style.transform = `translate(${(dx * k).toFixed(1)}px,${(dy * k).toFixed(1)}px)`;
    this.arrow.style.transform = `rotate(${Math.atan2(dx, -dy).toFixed(3)}rad) translateY(${(-R * 0.98).toFixed(1)}px)`;
    setCls(this.arrow, 'on', m > 8);
  }
  /** tap on the battlefield: lock the unit under the finger and send the monster at it */
  worldTap(x, y) {
    const rig = this.ctx.pipeline && this.ctx.pipeline.cameraRig, w = this.app.world, me = this.me();
    if (!rig || !w || !me || !me.alive) return;
    const g = rig.screenToGround(x, y, { x: 0, y: 0 });
    let best = null, bd = 2.6;
    for (const u of w.queryUnits(g.x, g.y, 2.6, (u) => isEnemy(me, u) || isCapturable(u), [])) { const d = Math.hypot(u.x - g.x, u.y - g.y) - (u.kind === 'champion' || u.kind === 'monster' ? 0.6 : 0); if (d < bd) { bd = d; best = u; } }
    if (!best) return;
    this.setLock(best.id);
    if (isEnemy(me, best)) { if (!this.send({ type: 'monsterAttack', targetId: best.id })) this.send({ type: 'attack', targetId: best.id }); }
  }
  setLock(id) { this.lockId = id; const a = this.aimState(); if (a) a.lockId = id; }

  // ------------------------------------------------------------------ buttons
  /** a tap on a locked move: a quiet chip above it (「しんかで かいほう」) instead of a refusal toast */
  lockedTap(b) {
    this.app.fire('touchlocked', { button: b.name });
    const r = b.el.getBoundingClientRect(), c = this.lkChip;
    setTxt(c, t('touch.locked'));
    c.style.left = Math.round(Math.min(innerWidth - 70, Math.max(70, r.left + r.width / 2))) + 'px'; c.style.top = Math.round(r.top - 6) + 'px';
    setCls(c, 'on', true); this.lkT = this.time + 1.8;
  }
  btnDown(b, e) {
    e.preventDefault(); e.stopPropagation();
    if (e.pointerType === 'touch') this.noteTouch();
    if (b.pid != null) return; // already held by another finger
    // unusable buttons (locked move, nothing to swap to, no monster, trainer down) do nothing — no press, no refusal toast
    const cl = b.el.classList;
    if (cl.contains('lock') || cl.contains('off') || cl.contains('hidden')) { if (cl.contains('lock')) this.lockedTap(b); return; }
    b.pid = e.pointerId; b.t0 = this.time; b.dragged = false; b.cancel = false; b.fired = false;
    try { b.el.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    setCls(b.el, 'down', true);
    const r = b.el.getBoundingClientRect(); b.cx = r.left + r.width / 2; b.cy = r.top + r.height / 2;
    switch (b.name) {
      case 'attack': this.attack(); b.next = this.time + 0.35; break;
      case 'a1': case 'a2': case 'capture': this.aimStart(b); break;
      case 'pause': this.app.fire('ui', { panel: this.app.ui && this.app.ui.panel === 'menu' ? 'none' : 'menu' }); break;
      case 'score': this.app.fire('ui', { panel: this.app.ui && this.app.ui.panel === 'scoreboard' ? 'none' : 'scoreboard' }); break;
      case 'swap': this.send({ type: 'swap' }); break;
      case 'skill': this.send({ type: 'trainerSkill' }); break;
      case 'potion': this.send({ type: 'potion' }); break;
      case 'regroup': this.send({ type: 'regroup' }); break;
      case 'evolve': this.send({ type: 'evolve' }); break;
      default: break; // recall / target act on hold / release
    }
  }
  btnMove(b, e) {
    if (b.pid !== e.pointerId) return;
    e.preventDefault(); e.stopPropagation();
    if (b.aimr) this.aimMove(b, e.clientX - b.cx, e.clientY - b.cy);
  }
  btnUp(b, e, cancelled) {
    if (b.pid !== e.pointerId) return;
    if (e.preventDefault) e.preventDefault();
    b.pid = null; setCls(b.el, 'down', false); setCls(b.el, 'holding', false);
    if (b.aimr) { this.aimEnd(b, cancelled); return; }
    if (cancelled) return;
    if (b.name === 'target' && !b.fired) this.cycleLock();
  }

  /** hold-to-act buttons + attack repeat (called every frame) */
  holds() {
    const now = this.time; // game-frame time (hold timings follow the frames the player actually saw)
    const mp = this.mmPress;
    if (mp && now - mp.t >= PING_HOLD) { // minimap long-press -> ping there
      this.mmPress = null;
      const x = ((mp.x - mp.r.left) / mp.r.width) * 120, y = ((mp.y - mp.r.top) / mp.r.height) * 120;
      this.send({ type: 'ping', x: Math.max(0, Math.min(120, x)), y: Math.max(0, Math.min(120, y)) });
    }
    const at = this.btn.attack; if (at.pid != null && this.time >= at.next) { this.attack(); at.next = this.time + 0.35; }
    for (const [name, need, fn] of [['recall', RECALL_HOLD, () => this.send({ type: 'recall' })], ['target', TARGET_HOLD, () => this.setLock(-1)]]) {
      const b = this.btn[name]; if (b.pid == null || b.fired) continue;
      const h = now - b.t0;
      setCls(b.el, 'holding', h > 0.08); setVar(b.el, '--h', Math.min(1, h / need).toFixed(3));
      if (h >= need) { b.fired = true; setCls(b.el, 'holding', false); fn(); }
    }
  }

  attack() {
    const w = this.app.world, me = this.me(); if (!w || !me || !me.alive) return;
    const lock = this.lockId >= 0 ? w.units.get(this.lockId) : null;
    let t = lock && isEnemy(me, lock) ? lock : null;
    if (!t) { const pet = activeUnit(w.mt, me); const o = pet && pet.alive ? pet : me; t = pick(w, o, me.facing || 0, 10, (u) => isEnemy(me, u)); }
    if (t) { if (!this.send({ type: 'monsterAttack', targetId: t.id })) this.send({ type: 'attack', targetId: t.id }); }
    else this.send({ type: 'attackNearest', range: 7 });
  }

  cycleLock() {
    const w = this.app.world, me = this.me(); if (!w || !me || !me.alive) return;
    const c = w.queryUnits(me.x, me.y, 13, (u) => isEnemy(me, u) || isCapturable(u), []);
    if (!c.length) { this.setLock(-1); return; }
    const pen = (u) => (u.kind === 'minion' ? 2 : 0) + (u.kind === 'tower' || u.kind === 'inhibitor' || u.kind === 'nexus' ? 4 : 0);
    c.sort((a, b) => (Math.hypot(a.x - me.x, a.y - me.y) + pen(a)) - (Math.hypot(b.x - me.x, b.y - me.y) + pen(b)) || a.id - b.id);
    const i = c.findIndex((u) => u.id === this.lockId);
    this.setLock(c[(i + 1) % c.length].id);
  }

  // ---- drag-to-aim (a1 / a2 / capture)
  range(b) {
    if (b.name === 'capture') return CAPTURE.range || 9;
    const me = this.me(), w = this.app.world, T = me && me.mtTrainer, rec = T && T.activeIdx >= 0 ? T.party[T.activeIdx] : null;
    const f = rec && FORMS[rec.form], ab = f && abilityFor(f.line, b.name, f.stage);
    return ab && ab.range > 0 ? ab.range : 7;
  }
  origin() { const w = this.app.world, me = this.me(); if (!me) return null; const pet = w && w.mt ? activeUnit(w.mt, me) : null; return pet && pet.alive && pet.mtMon ? pet : me; }
  aimStart(b) { b.aimX = b.aimY = 0; setCls(b.el, 'aiming', false); setCls(b.el, 'cancel', false); b.aimk.style.transform = ''; }
  aimMove(b, dx, dy) {
    const m = Math.hypot(dx, dy);
    if (!b.dragged && m > DRAG_MIN) b.dragged = true;
    if (!b.dragged) return;
    const k = Math.min(1, m / AIM_PX), R = AIM_PX * 0.6, kk = m > 0 ? Math.min(m, R) / m : 0;
    b.aimk.style.transform = `translate(${(dx * kk).toFixed(1)}px,${(dy * kk).toFixed(1)}px)`;
    setCls(b.el, 'aiming', true);
    b.cancel = m < DRAG_MIN * 0.8; setCls(b.el, 'cancel', b.cancel);
    const a = this.aimState(), o = this.origin();
    if (!a || !o || b.cancel) { if (a) a.active = false; return; }
    const [wx, wy] = this.toWorld(dx, dy), n = Math.hypot(wx, wy) || 1, d = 1.2 + (this.range(b) - 1.2) * k;
    a.active = true; a.x = o.x + (wx / n) * d; a.y = o.y + (wy / n) * d; a.dist = d; a.dir = Math.atan2(wy, wx); a.at = this.time; a.touch = b.name;
  }
  aimEnd(b, cancelled) {
    setCls(b.el, 'aiming', false); setCls(b.el, 'cancel', false);
    const a = this.aimState(); const aimed = a && a.active && a.touch === b.name; if (a) { a.active = false; a.touch = null; }
    if (cancelled || b.cancel) return;
    const w = this.app.world, me = this.me(); if (!w || !me || !me.alive) return;
    if (b.name === 'capture') {
      let tg = null;
      if (b.dragged && aimed) tg = near(w, a.x, a.y, 3.5, isCapturable);
      else { const lk = this.lockId >= 0 ? w.units.get(this.lockId) : null; tg = lk && isCapturable(lk) ? lk : near(w, me.x, me.y, 9.5, isCapturable); }
      if (tg) this.send({ type: 'capture', targetId: tg.id });
      else if (b.dragged && aimed) this.send({ type: 'capture', x: a.x, y: a.y });
      else this.app.fire('denied', { slot: 'E', type: 'capture', reason: 'no_target' });
      return;
    }
    let tg = null, x, y;
    if (b.dragged && aimed) { tg = near(w, a.x, a.y, 2.5, (u) => isEnemy(me, u)); x = a.x; y = a.y; }
    else {
      const lk = this.lockId >= 0 ? w.units.get(this.lockId) : null;
      const o = this.origin() || me;
      tg = lk && isEnemy(me, lk) ? lk : pick(w, o, me.facing || 0, 10, (u) => isEnemy(me, u));
      x = tg ? tg.x : o.x + Math.cos(me.facing || 0) * 4; y = tg ? tg.y : o.y + Math.sin(me.facing || 0) * 4;
    }
    this.send({ type: 'monsterCast', slot: b.name, targetId: tg ? tg.id : -1, x, y });
  }

  // ------------------------------------------------------------------ frame
  update(f) {
    const dt = Math.min(0.1, f.dt || 0); this.time += dt;
    if (this.lkT >= 0 && this.time > this.lkT) { this.lkT = -1; setCls(this.lkChip, 'on', false); }
    if (!this.root) return;
    const lk = globalThis.__mtI18n && globalThis.__mtI18n.getLang ? globalThis.__mtI18n.getLang() : '';
    if (lk !== this.langKey) this.relabel();
    if ((this._pw | 0) !== innerWidth || (this._ph | 0) !== innerHeight) { this._pw = innerWidth; this._ph = innerHeight; this.layout(); }
    const lv = this.app.mtHud && this.app.mtHud.layoutVer; // HUD geometry changed (touch on, card mode, locals, scale)
    if (lv !== undefined && lv !== this.hudLayoutVer) { this.hudLayoutVer = lv; this.layout(); }
    if (!!(this.app.mtCardsUI && this.app.mtCardsUI.on) !== !!this.cardsOn) this.layout(); // cards on / off: SKILL ⇄ card bar
    const show = this.active() && !this.modal();
    if (show !== this.vis) {
      this.vis = show; setCls(this.root, 'on', show); this.app.mtTouch.active = show;
      if (!show) this.releaseAll(); else this.layout();
    }
    // the HUD's own top-left Menu / Scores buttons win when present (no duplicates)
    const hud = this.hud(), hudSys = !!(hud && hud.tbtns && hud.touch);
    if (hudSys !== this.hudSys) { this.hudSys = hudSys; setCls(this.sysEl, 'hidden', hudSys); this.layout(); }
    this.portrait();
    if (!show) { this.chanceOff(); return; }
    const w = f.world, me = this.me(); if (!w || !me) return;
    this.holds();
    if (this.drove) this.drove = false; else this.drive(f, me, dt); // [load/hitch] normally driven by early(), before the sim ticks
    this.refresh(w, me, w.time);
    this.chanceRing(f, w, me);
    // lock upkeep
    if (this.lockId >= 0) { const u = w.units.get(this.lockId); if (!u || !u.alive || Math.hypot(u.x - me.x, u.y - me.y) > 16 || (u.visible && u.visible[me.team] === false)) this.setLock(-1); }
    const a = this.aimState(); if (a && this.app.mtInputMode === 'touch') a.lockId = this.lockId;
  }

  /** [load/hitch] app.mtInputEarly (GamepadInput.early, before the frame's sim ticks): the joystick order goes out now
   *  instead of after the ticks in update() — one frame less touch -> move latency. */
  early(dt) {
    this.drove = false;
    if (!this.root || !this.vis || this.modal()) return;
    const me = this.me(); if (!me) return;
    this.drive(null, me, dt); this.drove = true;
  }

  /** joystick -> 'dir' orders (analog, camera-relative, leashed) */
  drive(f, me, dt) {
    let dx = 0, dy = 0;
    if (this.joy && me.alive) {
      const R = this.sz.jr, ox = this.joy.x - this.joy.x0, oy = this.joy.y - this.joy.y0, m = Math.hypot(ox, oy) / R;
      if (m > 0.14) {
        const k = Math.min(1, (m - 0.14) / 0.76), sp = 0.38 + 0.62 * k, n = Math.hypot(ox, oy);
        [dx, dy] = this.toWorld((ox / n) * sp, (oy / n) * sp);
        const cam = this.app.mtCamera; if (cam && cam.filterDir) [dx, dy] = cam.filterDir(me, dx, dy);
      }
    }
    this.dirT -= dt;
    const moving = dx !== 0 || dy !== 0, ordDir = me.order && me.order.type === 'dir';
    if (Math.abs(dx - this.lastDir[0]) > 0.04 || Math.abs(dy - this.lastDir[1]) > 0.04 || (moving && !ordDir && this.dirT <= 0)) {
      if (moving || ordDir) this.send({ type: 'dir', dx, dy });
      this.lastDir = [dx, dy]; this.dirT = 0.12;
    }
  }

  /** cooldowns, availability, contextual buttons */
  refresh(w, me, now) {
    const T = me.mtTrainer; if (!T) return;
    const alive = me.alive, A = me.abilities || [], S = me.spells || [];
    const rec = T.activeIdx >= 0 ? T.party[T.activeIdx] : null, bench = T.party.find((r, i) => i !== T.activeIdx) || null;
    const f = rec && FORMS[rec.form];
    const B = this.btn;
    // attack icon: the monster's basic move, else the trainer's sling (sword glyph)
    if (f) { if (!B.attack.ic) { B.attack.ic = document.createElement('canvas'); B.attack.ic.className = 'ic'; B.attack.el.insertBefore(B.attack.ic, B.attack.cd); } this.setIcon(B.attack, f.line + '/basic'); B.attack.glyph.style.display = 'none'; B.attack.ic.style.display = ''; }
    else { B.attack.glyph.style.display = ''; if (B.attack.ic) B.attack.ic.style.display = 'none'; }
    this.cd(B.attack, now, 0, 1, { off: !alive });
    const a1 = f && abilityFor(f.line, 'a1', f.stage), a2 = f && abilityFor(f.line, 'a2', f.stage);
    if (f) { this.setIcon(B.a1, f.line + '/a1'); this.setIcon(B.a2, f.line + '/a2'); } else { this.setIcon(B.a1, ''); this.setIcon(B.a2, ''); }
    const monOff = !rec || rec.fainted || !alive || rec.unitId < 0;
    this.cd(B.a1, now, rec ? rec.cds.a1 : 0, (A[0] && A[0].cdTotal) || (a1 ? a1.cd : 1), { off: monOff, locked: !a1 });
    this.cd(B.a2, now, rec ? rec.cds.a2 : 0, (A[1] && A[1].cdTotal) || (a2 ? a2.cd : 1), { off: monOff, locked: !a2 });
    if (!a2 && f && Number.isFinite(f.evolveLevel)) { const lv = 'Lv' + f.evolveLevel; if (B.a2.el.dataset.lv !== lv) B.a2.el.dataset.lv = lv; } else if (B.a2.el.dataset.lv) B.a2.el.dataset.lv = '';
    if (!a1) { if (B.a1.el.dataset.lv !== '?') B.a1.el.dataset.lv = '?'; } else if (B.a1.el.dataset.lv) B.a1.el.dataset.lv = '';
    this.cd(B.capture, now, T.cdEnd.capture, (A[2] && A[2].cdTotal) || CAPTURE.cooldown, { off: !alive });
    this.setIcon(B.skill, SPEC_ICON[T.spec] || 'trainer/rally');
    setCls(B.skill.el, 'hidden', !!this.cardsOn); // the card bar replaces the single trainer skill
    this.cd(B.skill, now, T.cdEnd.skill, (A[3] && A[3].cdTotal) || SPEC_SKILL_CD, { off: !rec || !alive });
    this.cd(B.potion, now, T.cdEnd.potion, (S[0] && S[0].cdTotal) || TRAINER.potion.cooldown, { off: !rec || !alive });
    setCls(B.swap.el, 'hidden', !bench); // nothing to swap to: no button (it appears with the second monster)
    this.cd(B.swap, now, T.cdEnd.swap, (S[1] && S[1].cdTotal) || TRAINER.swapCooldown, { off: !bench || bench.fainted || !alive || !!T.swap });
    this.cd(B.target, now, 0, 1, { off: !alive });
    setCls(B.target.el, 'on', this.lockId >= 0);
    this.cd(B.regroup, now, 0, 1, { off: !rec || !alive });
    const recalling = me.recallStart != null && me.recallStart >= 0 && alive;
    this.cd(B.recall, now, 0, 1, { off: !alive }); setCls(B.recall.el, 'on', recalling);
    const evo = !!rec && !rec.evolving && !rec.fainted && evolveReady(rec) && alive;
    setCls(B.evolve.el, 'hidden', !evo && !(rec && rec.evolving));
    setCls(B.evolve.el, 'off', !!(rec && rec.evolving));
    // the capture button glows while a party-full replace is waiting for a second throw
    setCls(B.capture.el, 'on', !!(T.confirm && now <= T.confirm.until));
  }
  cd(b, now, end, total, o = {}) {
    const cool = end > now + 0.05 && !o.locked && !o.off;
    setCls(b.el, 'cool', cool); setCls(b.el, 'off', !!o.off && !o.locked); setCls(b.el, 'lock', !!o.locked);
    if (cool) { const r = end - now; setVar(b.el, '--p', Math.min(1, r / Math.max(0.1, total)).toFixed(3)); setTxt(b.num, r < 1 ? r.toFixed(1) : String(Math.ceil(r))); }
    if (b.cool && !cool && !o.off && !o.locked && b.seen) { setCls(b.el, 'flash', false); void b.el.offsetWidth; setCls(b.el, 'flash', true); }
    b.seen = true; b.cool = cool;
  }

  /** capture chance ring + % on the wild monster a capture would target (always while aiming; else when weak) */
  chanceRing(f, w, me) {
    const b = this.btn.capture, a = this.aimState(), rig = this.ctx.pipeline && this.ctx.pipeline.cameraRig;
    let tg = null;
    if (a && a.active && a.touch === 'capture') tg = near(w, a.x, a.y, 3.5, isCapturable);
    else {
      const lk = this.lockId >= 0 ? w.units.get(this.lockId) : null;
      tg = lk && isCapturable(lk) ? lk : near(w, me.x, me.y, 9.5, isCapturable);
      if (tg && b.pid == null && tg.hp > tg.maxHp * 0.6) tg = null; // passive: only once it is worth a throw
    }
    if (!tg || !rig || !me.alive) { this.chanceOff(); return; }
    let p = 0; try { p = captureChance(tg, w.time); } catch { p = 0; }
    const x = tg.prevX + (tg.x - tg.prevX) * f.alpha, y = tg.prevY + (tg.y - tg.prevY) * f.alpha;
    const o = rig.worldToScreen(x, (tg.height || 1) * 0.5 + 0.4, y, {});
    if (!o || o.visible === false) { this.chanceOff(); return; }
    const col = p >= 0.6 ? '#3fb64a' : p >= 0.35 ? '#ffd23a' : '#ff7a4a';
    for (const e of [this.chance, this.chlab]) { setVar(e, '--cc', col); }
    setVar(this.chance, '--p', p.toFixed(3));
    this.chance.style.left = o.x.toFixed(1) + 'px'; this.chance.style.top = o.y.toFixed(1) + 'px';
    const top = rig.worldToScreen(x, (tg.height || 1) + 1.1, y, {});
    this.chlab.style.left = top.x.toFixed(1) + 'px'; this.chlab.style.top = top.y.toFixed(1) + 'px';
    const txt = t('touch.chance', { p: Math.round(p * 100) });
    if (this.chlab.dataset.t !== txt) { this.chlab.dataset.t = txt; this.chlab.innerHTML = txt.replace(/(\d+%)/, '<b>$1</b>'); }
    setCls(this.chance, 'on', true); setCls(this.chlab, 'on', true);
    this.capTarget = tg.id;
  }
  chanceOff() { if (this.chance) { setCls(this.chance, 'on', false); setCls(this.chlab, 'on', false); } this.capTarget = -1; }

  releaseAll() {
    if (this.joy) { this.joy = null; setCls(this.joyEl, 'act', false); this.knobAt(0, 0); if (this.joyRest) this.joyAt(this.joyRest.x, this.joyRest.y); }
    const me = this.me(); if (me && me.order && me.order.type === 'dir') this.send({ type: 'dir', dx: 0, dy: 0 });
    this.lastDir = [0, 0];
    for (const b of Object.values(this.btn)) { b.pid = null; setCls(b.el, 'down', false); setCls(b.el, 'aiming', false); setCls(b.el, 'holding', false); }
    const a = this.aimState(); if (a && a.touch) { a.active = false; a.touch = null; }
    this.taps.clear();
  }

  dispose() {
    removeEventListener('pointerdown', this.onDown, true); removeEventListener('pointermove', this.onMove, true);
    removeEventListener('pointerup', this.onUp, true); removeEventListener('pointercancel', this.onUp, true);
    document.removeEventListener('gesturestart', this.onGesture); document.removeEventListener('touchmove', this.onTouchMove);
    removeEventListener('contextmenu', this.onCtx, true); removeEventListener('resize', this.onResize); removeEventListener('orientationchange', this.onResize);
    if (this.root) this.root.remove(); if (this.rot) this.rot.remove(); if (this.probe) this.probe.remove();
  }
}

function near(w, x, y, r, pred) {
  let best = null, bd = 1e9;
  for (const u of w.queryUnits(x, y, r, pred, [])) { const d = Math.hypot(u.x - x, u.y - y); if (d < bd || (d === bd && u.id < best.id)) { bd = d; best = u; } }
  return best;
}
