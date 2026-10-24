// mt/render/fx.js — monster-trainer VFX + SFX director (the 'fx' part of the mt-render subsystem). Owner: VFX specialist.
//
// Layers (Gen-5 battle-effect energy at Wild-Rift polish):
//   * pixel glyph particles (fx-gfx.js / fx-atlas.js): 3 instanced draw calls (cutout, additive, art sprites)
//   * HD light from the legacy `vfx` helpers (glow pops, decals, shockwaves, columns) — no extra draw calls
//   * floating pixel combat text (fx-numbers.js) and chiptune SFX (fx-audio.js)
// Inputs: frame events — mt events (mt/sim/events.js) + legacy FX/HIT/ATTACK/PROJECTILE/STRUCTURE_DESTROYED/VICTORY;
// projectile looks are registered as legacy PROJ_STYLES; ability FX/HIT handlers are registered in vfx.handlers so
// the legacy generic look is replaced by ours. Render-only: never mutates sim state.
// Debug: `__mtFx.preview(name)` (render-side synthetic events), `__mtFx.stats()`; sim-side fixtures: mt.debug.fx(name).

import { m as glowPop, n as implode, E as shockwave, y as glowDecal, w as scorch, p as fissures, d as energyCol, s as addShape,
  u as circleTele, v as lineTele, c as beamSpec, R as FR, PROJ_STYLES } from '../../assets/vfx-NxBbWgKl.js';
import { o as heightAt } from '../../assets/height-CVtQdZ3e.js';
import { E as DT } from '../../assets/map-oE9sOnNc.js';
import { t as EV } from '../../assets/events-WjIX4JqM.js';
import { MT_EVENT as E } from '../sim/events.js';
import { FORMS } from '../data/species.js';
import { ELEMENT_PAL } from './fx-atlas.js';
import { LEGACY_ELEMENT } from '../data/types.js';
import { FxGfx } from './fx-gfx.js';
import { FxNumbers } from './fx-numbers.js';
import { FxAudio } from './fx-audio.js';
import { loadArt, warm as warmArt } from './fx-art.js';
import { ABILITY, LINE_OF_FX, ATTACK_LINE, impact, projectileStyles, towerLook, field as fieldFx, status as statusFx } from './fx-kits.js';
import * as M from './fx-moments.js';

const HABITAT_LINES = { brute: 'fire', toads: 'water', warden: 'grass', golems: 'electric', stalkers: 'earth', wolves: 'wind' };
const LEGACY_TO_LINE = Object.fromEntries(Object.entries(LEGACY_ELEMENT).map(([k, v]) => [v, k]));
const KIND_NAME = { tower: 'tower', inhibitor: 'inhibitor', nexus: 'nexus' };

export class MtFx {
  constructor(ctx) {
    this.ctx = ctx; this.errors = 0; this.time = 0; this.world = null; this.V = null;
    this.gfx = new FxGfx(ctx);
    this.q = this.gfx.q;
    this.numbers = new FxNumbers(ctx);
    this.audio = new FxAudio(ctx);
    this.capture = new M.CaptureFx(this);
    this.evolve = new M.EvolveFx(this);
    this.tasks = []; this.onceKeys = new Map(); this.surge = new Map(); this.seenStruct = new Set();
    this.seed = 0x9e3779b9; this.r = () => { let s = this.seed; s ^= s << 13; s ^= s >>> 17; s ^= s << 5; this.seed = s >>> 0; return (s >>> 0) / 4294967296; };
    this.FR = FR; this.styles = projectileStyles(this); this.handlers = this.buildHandlers();
    this.habitats = null; this.slow = null; this.lastPos = new Map();
    this.counts = {}; this.frameNo = 0;
    loadArt();
    if (typeof window !== 'undefined') { window.__mtFx = this; window.__mtFxTowerLinks = true;   // [MT-HOOK] mtFxTowerLinks in vfx-*.js
      window.__mtFxOwnsCC = (e) => { const u = this.unit(e.src); return !!(u && u.mtMon); };   // [MT-HOOK] mtFxOwnsCC in vfx-*.js (legacy CC puffs were pale smoke)
 window.__mtFxMute = (e) => this.muteLegacy(e); }   // [MT-HOOK] mtFxMute in audio-*.js
    if (ctx.app && ctx.app.on) ctx.app.on('match', () => this.reset());
  }

  // ------------------------------------------------------------------------------------------ frame
  update(f) {
    const w = f.world; if (!w) return;
    const T0 = performance.now();
    if (w !== this.world) { this.reset(); this.world = w; }
    this.frame = f; this.alpha = f.alpha; this.viewerTeam = f.viewerTeam;
    this.gfx.beginFrame(); this.crits = null; this.frameNo++;
    const V = this.V = this.ctx.registry.get('vfx') || null;
    if (V) this.hookLegacy(V);
    const app = f.app || this.ctx.app;
    const ts = app && app.paused ? 0 : app && app.timeScale != null ? app.timeScale : 1;
    const dt = Math.min(0.1, Math.max(0, f.dt)) * Math.min(1, ts);
    this.time += dt; this.dt = dt;
    if (this.slow) this.stepSlowmo(f, app);
    if (f.events && f.events.length) {
      const evs = f.events, n = Math.min(evs.length, 600);
      for (let i = 0; i < n; i++) { const ev = evs[i]; if (ev && typeof ev.type === 'string') this.safe(ev); }
    }
    this.capture.update(dt); this.evolve.update(dt);
    this.towerLinks(w);
    this.combatAuras(w);
    this.runTasks(dt);
    if (!this.habitats) this.habitats = this.findHabitats(w);
    if (!(app && app.mtAmbient) && (this.q > 0.5 || (this.frameNo & 1))) M.ambient(this, dt, this.habitats);   // ambient-life.js owns habitat ambience when present
    warmArt(this.gfx.sprAtlas, 1);
    this.gfx.update(dt, this.ctx.camera, this._follow || (this._follow = (id) => { const u = w.units.get(id); return u && !u.removed ? this.lerpPos(u) : null; }));
    this.numbers.update(f, dt, this.ctx.camera);
    for (const [k, t] of this.onceKeys) if (t < this.time) this.onceKeys.delete(k);
    const ms = performance.now() - T0; this.ms = this.ms == null ? ms : this.ms * 0.95 + ms * 0.05; if (ms > (this.msMax || 0)) this.msMax = ms;
  }
  safe(ev) { try { this.on(ev); } catch (e) { if (++this.errors <= 5) console.error('[mt-fx]', ev.type, e); const a = this.ctx.app; if (a && a.errors) { const g = a.errors['mt-render:fx-event'] || (a.errors['mt-render:fx-event'] = { count: 0, last: '' }); g.count++; g.last = String(e && e.stack || e).slice(0, 300); } } }

  reset() {
    this.gfx.clear(); this.numbers.clear(); this.capture.clear(); this.evolve.clear();
    this.tasks.length = 0; this.onceKeys.clear(); this.surge.clear(); this.seenStruct.clear(); this.habitats = null;
    if (this.slow) { const a = this.ctx.app; if (a && this.slow.prev != null) a.timeScale = this.slow.prev; this.slow = null; }
  }

  // ------------------------------------------------------------------------------------------ legacy hooks
  hookLegacy(V) {
    if (!this._stylesOk) { try { for (const k in this.styles) PROJ_STYLES[k] = this.styles[k]; } catch (e) { console.warn('[mt-fx] PROJ_STYLES not extensible', e && e.message); } this._stylesOk = true; }
    // vfx.handlers is a FROZEN object (champion kit table, replaced once when that chunk loads): never mutate it,
    // swap in a merged copy instead (re-done whenever vfx replaces the table).
    if (V.handlers !== this._merged) { try { this._merged = V.handlers = { ...(V.handlers || {}), ...this.handlers }; } catch (e) { this._merged = V.handlers; } }
  }
  /** vfx.handlers entries: our ability FX kinds replace the legacy generic look; HITs we draw ourselves. */
  buildHandlers() {
    const H = { __mtfx: { tag: 1 } }, none = () => {}, hitTrue = () => true;
    const kinds = ['aoe_telegraph', 'aoe_burst', 'dash', 'dash_end', 'cone', 'leap', 'blink', 'windup', 'channel', 'channel_end', 'line_burst', 'impact', 'target',
      'line_telegraph', 'buff', 'tether', 'pull', 'beam', 'reset', 'zone', 'zone_tick', 'zone_end', 'wave', 'mark', 'end', 'break', 'land', 'detonate', 'empower', 'cast'];
    const mk = () => { const h = { hit: hitTrue }; for (const k of kinds) h[k] = none; return h; };
    for (const id of Object.keys(LINE_OF_FX)) { H[id] = mk(); H[id + '_field'] = mk(); }
    H.surge_field = mk(); H.surge_field_field = mk(); H.mt_burn = { hit: hitTrue };
    for (const line of ['fire', 'water', 'grass', 'electric', 'earth', 'wind']) H['mt_' + line + '_attack'] = { hit: hitTrue };
    H.mt_sling_attack = { hit: hitTrue };
    H.tower_attack = { hit: hitTrue };     // tower impacts: tower_attack projectile style end()
    H.mt_capture_orb = { hit: hitTrue };
    H.__mtfx = H.__mtfx; return H;
  }

  // ------------------------------------------------------------------------------------------ helpers for kits
  emit(o) { return this.gfx.emit(o); }
  gy(x, z) { return heightAt(x, z); }
  unit(id) { const w = this.world; if (!w || id == null || id < 0) return null; const u = w.units.get(id); return u && !u.removed ? u : null; }
  lerpPos(u) { const a = this.alpha ?? 1, px = u.prevX ?? u.x, pz = u.prevY ?? u.y; return { x: px + (u.x - px) * a, z: pz + (u.y - pz) * a }; }
  /** world-space anchor info of a unit: {x, z, gy (ground), y (chest), h (height)} */
  unitWorld(u) {
    if (!u) return null;
    const p = this.lerpPos(u), gy = heightAt(p.x, p.z), h = u.height || 1.2;
    return { x: p.x, z: p.z, gy, y: gy + h * 0.55, h, u };
  }
  simNow() { const w = this.world; return w ? w.time - DT * (1 - (this.alpha ?? 1)) : 0; }
  near(x, z, r = 34) { const V = this.V; return !V || V.near(x, z, r); }
  visibleAt(x, z) { const V = this.V; return !V || V.seenAt(x, z); }
  unitVisible(u) { return !u || !u.visible || u.visible[this.viewerTeam] !== false; }
  screenRot(dx, dy, dz) { const R = this.gfx.camR, U = this.gfx.camU; return Math.atan2(dx * U[0] + dy * U[1] + dz * U[2], dx * R[0] + dy * R[1] + dz * R[2]); }
  once(key, ttl) { if (this.onceKeys.has(key)) return false; this.onceKeys.set(key, this.time + ttl); return true; }
  /** task(dur, fn(k, dt) -> false stops, onEnd?) */
  task(dur, fn, onEnd) { this.tasks.push({ t: 0, dur: Math.max(0.001, dur), fn, onEnd }); }
  later(delay, fn) { this.tasks.push({ t: -delay, dur: 0.0001, fn: null, onEnd: fn }); }
  runTasks(dt) {
    const T = this.tasks; let w = 0;
    for (let i = 0; i < T.length; i++) {
      const t = T[i]; t.t += dt;
      if (t.t < 0) { T[w++] = t; continue; }
      let alive = t.t < t.dur;
      if (t.fn) { let r; try { r = t.fn(Math.min(1, t.t / t.dur), dt); } catch (e) { r = false; if (++this.errors <= 5) console.error('[mt-fx task]', e); } if (r === false) alive = false; }
      if (alive) T[w++] = t; else if (t.onEnd) { try { t.onEnd(); } catch (e) { if (++this.errors <= 5) console.error('[mt-fx task end]', e); } }
    }
    T.length = w;
    if (T.length > 400) T.splice(0, T.length - 400);
  }
  // legacy HD light / decal helpers (no-ops without vfx)
  // HD light pulses stay small and coloured: big soft white/orange blobs read as a wash over pixel art (blind-test R1)
  glow(x, y, z, size, rgb, gain = 1.5, life = 0.25) { const V = this.V; if (V) glowPop(V, x, y, z, Math.min(3.2, size * 0.7), rgb, Math.min(1.6, gain), Math.min(0.3, life)); }
  wave(x, z, r, rgb, life = 0.5) { const V = this.V; if (V) shockwave(V, x, z, r, rgb, 1.3, rgb, life, 0.14); }
  decalGlow(x, z, r, rgb, gain = 0.8, life = 0.6) { const V = this.V; if (V) glowDecal(V, x, z, r, rgb, gain, life); }
  /** HD-2D point light: coloured light pooled on the ground (decal) + small hot core at the source. */
  pointLight(x, y, z, r, rgb, gain = 1.5, life = 0.2) {
    const V = this.V; if (!V) return;
    glowDecal(V, x, z, Math.min(3, r), rgb, Math.min(1.4, gain * 0.8), Math.max(0.12, Math.min(0.35, life * 1.4)));
    glowPop(V, x, y, z, Math.min(1.0, r * 0.4), rgb, Math.min(1.1, gain * 0.8), Math.min(0.18, life));
  }
  /** per-frame ground light under a moving source (projectiles): tiny-life decal, re-issued each frame */
  groundLight(x, z, r, rgb, gain = 0.8) { const V = this.V; if (V) glowDecal(V, x, z, r, rgb, gain, 0.07, 0.01, 0.02, 0.02); }
  scorchAt(x, z, r, life = 3) { const V = this.V; if (V) scorch(V, x, z, r, life); }
  // legacy $t(V, x, z, radius, life, rimColor, glowColor, cracks=8, ...)
  fissure(x, z, r) { const V = this.V; if (V) fissures(V, x, z, r, 1.4, [0.42, 0.3, 0.18], [1, 0.62, 0.28], 8); }
  tele(x, z, r, dur) { const V = this.V; if (V) circleTele(V, x, z, r, dur, V.curTeam); }
  lineTele(x0, z0, x1, z1, wd, dur) { const V = this.V; if (V) lineTele(V, x0, z0, x1, z1, wd, dur, V.curTeam); }
  implodeAt(x, y, z, r, c0, c1) { const V = this.V; if (V) implode(V, x, y, z, r, Math.round(26 * this.q), 0.4, c0, c1, 0.1); }
  column(x, y, z, r, h, life, c0, c1, i1 = 1, i2 = 0.6) { const V = this.V; if (!V) return; const s = energyCol(V, x, y, z, r, h, life, c0, c1, i1, i2); if (s) addShape(V, s, x, z, r); }
  beamShape(x0, y0, z0, x1, y1, z1, w, life, c0, c1) { const V = this.V; if (!V) return; const s = beamSpec(V, x0, y0, z0, x1, y1, z1, w, life, c0, c1); if (s) addShape(V, s, (x0 + x1) / 2, (z0 + z1) / 2, 1); }
  shake(a, x, z) {
    const pl = this.ctx.pipeline, rig = pl && pl.cameraRig; if (!rig || !rig.shake) return;
    const d = Math.hypot(x - (rig.focusX ?? x), z - (rig.focusY ?? z)), k = Math.max(0, 1 - d / 32);
    if (a * k > 0.01) rig.shake(Math.min(0.9, a * k));
  }
  /** Render-only sprite override through sprites.js (flash / scale / hidden / tint); ttl in seconds. false if unavailable. */
  spriteFx(id, o) {
    const R = this.ctx.registry && this.ctx.registry.get('mt-render'), S = R && R.sprites;
    if (!S || !S.setOverride || !(id >= 0)) return false;
    const { ttl, ...rest } = o; S.setOverride(id, { ...rest, until: this.simNow() + (ttl ?? 0.12) }); return true;
  }
  /** Legacy audio events whose sound this module synthesizes itself (avoids doubled generic cast/burst/hit sounds). */
  muteLegacy(e) {
    if (!this.audio.enabled || !e) return false;
    const fx = e.fx;
    switch (e.type) {
      case EV.FX: return !!fx && (!!ABILITY[fx] || (fx.endsWith('_field') && (!!ABILITY[fx.slice(0, -6)] || fx.startsWith('surge_field'))));
      case EV.HIT: return !!fx && (!!ABILITY[fx] || !!ATTACK_LINE(fx) || fx === 'mt_burn' || fx === 'surge_field');
      case EV.PROJECTILE: case EV.PROJECTILE_END: return !!fx && !!ABILITY[fx];
      case EV.LEVEL_UP: { const u = this.unit(e.id); return !!(u && u.mtMon); }
    }
    return false;
  }
  sfx(name, x, z, p) { try { this.audio.play(name, x, z, p); } catch (e) { if (++this.errors <= 5) console.error('[mt-fx sfx]', e); } }
  text(text, style, x, z, y0, o = {}) { this.numbers.spawn(text, style, x, z, y0, { ...o, now: this.time }); }
  /** per-unit cap on concurrent big hit layers: true when this unit already took 2+ big hits in the last 0.4 s */
  hitBudget(id) {
    const M = this._hb || (this._hb = new Map()), t = this.time; let a = M.get(id); if (!a) M.set(id, a = []);
    while (a.length && t - a[0] > 0.4) a.shift(); a.push(t);
    if (M.size > 200) for (const [k, v] of M) if (!v.length || t - v[v.length - 1] > 1) M.delete(k);
    return a.length > 2;
  }
  /** true if an impact landed within 0.6 m in the last 0.15 s (and records this one) */
  recentImpact(x, z) {
    const L = this._imp || (this._imp = []), t = this.time; let hit = false;
    for (let i = L.length - 1; i >= 0; i--) { const e = L[i]; if (t - e[2] > 0.15) { L.splice(i, 1); continue; } if (Math.abs(e[0] - x) + Math.abs(e[1] - z) < 0.6) hit = true; }
    if (L.length < 64) L.push([x, z, t]);
    return hit;
  }
  fizzle(el, x, y, z) { impact(this, el, x, y, z, 0.55, 1, 0, null, false); }
  /** pixel lightning bolt between two points (segments of the 'bolt' glyph along the line, plus additive glow copies) */
  bolt(x0, y0, z0, x1, y1, z1, s = 1, delay = 0) {
    const len = Math.hypot(x1 - x0, y1 - y0, z1 - z0); if (len < 0.05) return;
    const seg = 0.95 * s, n = Math.max(1, Math.round(len / seg)), rot = this.screenRot(x1 - x0, y1 - y0, z1 - z0);
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n, fr = (this.r() * 3) | 0, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, z = z0 + (z1 - z0) * t;
      this.emit({ glyph: 'bolt', frame: fr, pal: 'electric', x, y, z, px: (len / n) * 1.1, life: 0.2, rot, gain: 1.7, hot: 1.4, delay, fout: 0.5 });
      this.emit({ glyph: 'bolt', frame: (fr + 1) % 3, pal: 'white', x, y, z, px: (len / n) * 1.05, life: 0.12, rot, blend: 1, gain: 1.6, delay: delay + 0.03 });
    }
    this.glow(x1, y1, z1, 1.6 * s, [1, 0.9, 0.3], 2.2, 0.18);
  }
  /** Protect-style bubble around a unit (dithered, upright) */
  shieldBubble(id, dur, pal) {
    this.task(dur, (k) => {
      const q = this.unitWorld(this.unit(id)); if (!q) return false;
      const fade = k > 0.85 ? (1 - k) / 0.15 : Math.min(1, k * 8);
      this.gfx.now('bubble', 0, q.x, q.gy + q.h * 0.5, q.z, q.h * 1.45 + 0.1 * Math.sin(k * 30), { pal, gain: 1.2, alpha: 0.55 * fade });
      if (this.r() < 0.2 * this.q) this.emit({ glyph: 'twinkle', pal, x: q.x + (this.r() - 0.5) * q.h, y: q.gy + this.r() * q.h * 1.2, z: q.z, life: 0.3, size: 0.6, blend: 1, gain: 2 });
    });
  }
  /** orbiting hex shards (Thorn Bulwark) */
  hexShell(id, dur, pal) {
    const n = Math.round(6 * this.q), u = this.unit(id), p = this.unitWorld(u); if (!p) return;
    for (let i = 0; i < n; i++) this.emit({ glyph: 'hex', pal, x: p.x, y: p.gy, z: p.z, life: dur, size: 0.55, fin: 0.05, fout: 0.15,
      orbit: { cx: p.x, cz: p.z, cy: p.gy + p.h * (0.3 + (i % 3) * 0.22), r0: 0.75 + p.h * 0.15, w: 2.2, a: i / n * Math.PI * 2, vy: 0 }, follow: id });
  }
  setSlowmo(scale, duration) {
    const app = this.ctx.app; if (!app) return;
    if (app.params && app.params.has && app.params.has('noslowmo')) return;
    if (!this.slow) this.slow = { prev: app.timeScale != null ? app.timeScale : 1 };
    this.slow.scale = scale; this.slow.left = duration; this.slow.real = performance.now();
    app.timeScale = this.slow.prev * scale;
  }
  stepSlowmo(f, app) {
    const S = this.slow, now = performance.now(), el = (now - S.real) / 1000; S.real = now; S.left -= Math.min(0.1, el);
    if (S.left <= 0 || !app) { if (app) app.timeScale = S.prev; this.slow = null; return; }
    const k = Math.min(1, S.left / 0.5);         // ease back to full speed over the last 0.5 s
    app.timeScale = S.prev * (S.scale + (1 - S.scale) * (1 - k));
  }

  // ------------------------------------------------------------------------------------------ event routing
  on(ev) {
    const t = ev.type;
    if (t.charCodeAt(0) === 109 && t.startsWith('mt_')) return this.onMt(ev);
    switch (t) {
      case EV.HIT: return this.onHit(ev);
      case EV.FX: return this.onFxEvent(ev);
      case EV.ATTACK: return this.onAttack(ev);
      case EV.HEAL: return this.onHeal(ev);
      case EV.STRUCTURE_DESTROYED: return this.onStructure(ev, false);
      case EV.VICTORY: return this.onVictory(ev);
    }
  }
  count(k) { this.counts[k] = (this.counts[k] || 0) + 1; }

  onMt(ev) {
    this.count(ev.type);
    switch (ev.type) {
      case E.CAPTURE_THROW: return this.capture.throw(ev);
      case E.CAPTURE_START: return this.capture.start(ev);
      case E.CAPTURE_WOBBLE: return this.capture.wobble(ev);
      case E.CAPTURE_SUCCESS: return this.capture.success(ev);
      case E.CAPTURE_FAIL: return this.capture.fail(ev);
      case E.CAPTURE_MISS: return this.capture.miss(ev);
      case E.EVOLVE_START: return this.evolve.start(ev);
      case E.EVOLVE: return this.evolve.done(ev);
      case E.EVOLVE_CANCEL: return this.evolve.cancel(ev);
      case E.LEVEL_UP: { const u = this.unit(ev.unit); if (u && this.unitVisible(u) && this.near(u.x, u.y)) M.levelUp(this, u, ev.level); return; }
      case E.FAINT: { const u = this.unit(ev.unit); if ((!u || this.unitVisible(u)) && this.near(ev.x ?? (u && u.x), ev.y ?? (u && u.y))) M.faint(this, u, ev); return; }
      case E.SUMMON: { const u = this.unit(ev.unit); if (u && this.unitVisible(u) && this.near(u.x, u.y)) M.summon(this, u, ev); return; }
      case E.RECALL: if (ev.reason !== 'evolve' && this.near(ev.x, ev.y) && this.visibleAt(ev.x, ev.y)) M.recall(this, ev); return;
      case E.MONSTER_CAST: return this.onCast(ev);
      case E.TRAINER_SKILL: { const t = this.unit(ev.trainer); if (t && this.unitVisible(t) && this.near(t.x, t.y)) M.trainerSkill(this, ev); return; }
      case E.POTION: { const u = this.unit(ev.unit); if (u && this.unitVisible(u) && this.near(u.x, u.y)) M.potion(this, ev); return; }
      case E.STRUCTURE_DESTROYED: return this.onStructure(ev, true);
      case E.HIT: return this.onMtHit(ev);
      case E.STATUS: return statusFx(this, ev);
      case E.FIELD: if (ev.phase === 'start' && this.near(ev.x, ev.y, 40) && this.visibleAt(ev.x, ev.y)) fieldFx(this, ev); return;
      case E.MATCH_END: return this.onMatchEnd(ev);
    }
  }

  onCast(ev) {
    const u = this.unit(ev.unit); if (!u || !this.unitVisible(u) || !this.near(u.x, u.y)) return;
    const K = ABILITY[ev.ability];
    this.sfx('cast', u.x, u.y, { el: ev.element || (u.mtMon && u.mtMon.types[0]) });
    if (ev.surged || this.surge.has(u.id)) { this.surge.delete(u.id); M.surgeRelease(this, u, ev); }
    if (K && K.cast) K.cast(this, u, ev);
    this.castStamp(ev, u);
  }

  onFxEvent(ev) {
    const K = ABILITY[ev.fx]; if (!K || !K.fx) return;
    const fn = K.fx[ev.kind]; if (!fn) return;
    const src = this.unit(ev.src);
    if (!this.near(ev.x, ev.y, 40) || !this.visibleAt(ev.x, ev.y)) { if (!src || !this.unitVisible(src)) return; }
    fn(this, ev, src);
  }
  findUnitAt(x, z, not) {
    const w = this.world; if (!w || !Number.isFinite(x)) return null;
    let best = null, bd = 0.6;
    for (const u of w.unitList) { if (!u.alive || u === not || u.kind === 'projectile') continue; const d = Math.abs(u.x - x) + Math.abs(u.y - z); if (d < bd) { bd = d; best = u; } }
    return best;
  }

  /** Basic attack wind-up (legacy ATTACK): type-coloured charge glow on the attacker; melee lines swing a slash arc. */
  onAttack(ev) {
    const line = ATTACK_LINE(ev.fx); if (!line || line === 'sling') return;
    const u = this.unit(ev.src); if (!u || !u.mtMon || !this.unitVisible(u) || !this.near(u.x, u.y, 30)) return;
    const t = this.unit(ev.tgt), E = ELEMENT_PAL[line] || ELEMENT_PAL.fire, wind = Math.max(0.12, Math.min(0.5, ev.windup || 0.25));
    const id = u.id, tid = t ? t.id : -1;
    void E;
    if (!ev.ranged) this.later(wind, () => this.meleeSlash(id, tid, line));   // the wind-up glow itself is state-driven (combatAuras)
  }
  /** melee swing: bold element-coloured slash arc between attacker and target + 2 short speed streaks */
  meleeSlash(id, tid, line) {
    const a = this.unitWorld(this.unit(id)), b = this.unitWorld(this.unit(tid)); if (!a || !b) return;
    const E = ELEMENT_PAL[line] || ELEMENT_PAL.fire;
    const x = a.x + (b.x - a.x) * 0.5, z = a.z + (b.z - a.z) * 0.5, y = a.gy + a.h * 0.4;
    const rot = this.screenRot(b.x - a.x, 0, b.z - a.z);
    this.emit({ glyph: 'crescent', pal: E.main, x, y, z, life: 0.16, size: 1.2, s1: 1.45, rot: rot + 0.4, gain: 1.3, hot: 1.5, fout: 0 });
    for (let i = 0; i < 2; i++) this.emit({ glyph: 'streak', pal: E.main, x: x - (b.x - a.x) * 0.2, y: y + (i - 0.5) * 0.3, z: z - (b.z - a.z) * 0.2, vx: (b.x - a.x) * 4, vz: (b.z - a.z) * 4, drag: 6, life: 0.14, size: 1.3, align: true });
    this.groundLight(x, z, 1.1, E.glow, 0.8);
  }
  /** cast stamp: a short-lived element field on the ground at the aim point (0.9 s) so stills catch every cast */
  castStamp(ev, u) {
    const el = ev.element || (u.mtMon && u.mtMon.types[0]) || 'fire', E = ELEMENT_PAL[el] || ELEMENT_PAL.fire;
    const self = ev.aim === 'self' || !Number.isFinite(ev.tx);
    const x = self ? u.x : ev.tx, z = self ? u.y : ev.ty; if (!Number.isFinite(x)) return;
    const R = Math.max(0.9, Math.min(2.8, ev.radius || (self ? 1.4 : 1.2))), gy = heightAt(x, z) + 0.06;
    this.stamps = (this.stamps || 0) + 1;
    this.task(0.9, (k) => {
      const e = Math.min(1, k * 5), crowd = 1 / (1 + 0.6 * Math.max(0, this.stamps - 1)), fade = (k > 0.7 ? (1 - k) / 0.3 : 1) * crowd;
      this.gfx.ring(x, gy, z, R * (0.7 + 0.3 * e), { pal: E.main, rot: k * 2, alpha: fade, gain: 1.0 });
      if (this.stamps < 3) this.gfx.ring(x, gy, z, R * 0.55 * e, { pal: E.alt || E.main, rot: -k * 3, dash: true, alpha: fade * 0.8, gain: 0.85 });
    }, () => { this.stamps--; });
    this.decalGlow(x, z, R * 1.1, E.glow, 0.7, 0.9);
  }
  /** in-combat cues: element aura ring + ground light under every monster that fought in the last 2.5 s */
  combatAuras(w) {
    const t = w.time, now = this.time, crowd = this._auraN > 3 ? 0.5 : 0.8; let n = 0;
    for (const u of w.unitList) {
      const M = u.mtMon; if (!M || !u.alive || M.capturing || !(u.lastCombatT > t - 2.5)) continue;
      if (!this.unitVisible(u) || !this.near(u.x, u.y, 26)) continue;
      const E = ELEMENT_PAL[M.types[0]] || ELEMENT_PAL.fire, p = this.unitWorld(u), r = Math.max(0.5, (u.radius || 0.5) * 1.25);
      const fade = Math.min(1, (u.lastCombatT - (t - 2.5)) / 0.6);
      n++; this.gfx.ring(p.x, p.gy + 0.05, p.z, r, { pal: E.main, rot: now * 1.4 + u.id, dash: true, alpha: fade * crowd, gain: 0.9, seg: 0.3 });
      // basic-attack wind-up (state, so any still during a wind-up shows it): element mote swelling at the attacker's front
      if (u.attackWindupEnd > t && u.attackT != null) {
        const tg = w.units.get(u.attackTargetId), wind = Math.max(0.1, u.attackWindupEnd - u.attackT), k = Math.min(1, Math.max(0, (t - u.attackT) / wind));
        let dx = tg ? tg.x - u.x : Math.cos(u.facing || 0), dz = tg ? tg.y - u.y : Math.sin(u.facing || 0); const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
        const x = p.x + dx * p.h * 0.35, z = p.z + dz * p.h * 0.35, y = p.gy + p.h * 0.5;
        this.gfx.now('twinkle', ((now * 16) | 0) & 3, x, y, z, 0.45 + 0.8 * k, { pal: E.main, blend: 1, gain: 1.4 + k });
        this.gfx.now('dot', 0, x, y, z, 0.16 + 0.2 * k, { pal: E.hot || E.main, gain: 1.4, hot: 1.8 });
        this.groundLight(x, z, 0.7 + 0.5 * k, E.glow, 0.3 + 0.4 * k);
      }
      if ((this.frameNo + u.id) % 2 === 0) this.groundLight(p.x, p.z, r * 1.6, E.glow, 0.4 * fade * crowd);
    }
    this._auraN = n;
  }



  onHit(ev) {
    const src = this.unit(ev.src);
    if (src && src.mtMon) { if (ev.crit) (this.crits || (this.crits = new Set())).add(ev.src + ':' + ev.tgt); return; }   // monster hits: see onMtHit
    const fxId = ev.fx; if (fxId !== 'mt_sling_attack') return;
    const tgt = this.unit(ev.tgt); if (tgt && !this.unitVisible(tgt)) return;
    const x = tgt ? tgt.x : ev.x, z = tgt ? tgt.y : ev.y; if (!Number.isFinite(x) || !this.near(x, z, 32)) return;
    const p = tgt ? this.unitWorld(tgt) : { x, z, gy: heightAt(x, z), y: heightAt(x, z) + 0.8, h: 1.2 };
    let dx = 1, dz = 0; if (src) { dx = x - src.x; dz = z - src.y; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l; }
    this.emit({ glyph: 'pebble', frame: 1, pal: 'rock', x: p.x, y: p.y, z: p.z, vx: -dx * 1.5, vy: 2, vz: -dz * 1.5, g: 12, life: 0.4, size: 0.9 });
    this.sfx('hit_sling', x, z);
  }

  /** mt_hit: every damage instance dealt by a monster (basic, ability, burn, field, reflect) */
  onMtHit(h) {
    const tgt = this.unit(h.tgt), src = this.unit(h.src);
    if (tgt && !this.unitVisible(tgt)) return;
    const x = tgt ? tgt.x : h.x, z = tgt ? tgt.y : h.y; if (!Number.isFinite(x) || !this.near(x, z, 32)) return;
    const p = tgt ? this.unitWorld(tgt) : { x, z, gy: heightAt(x, z), y: heightAt(x, z) + 0.8, h: 1.2 };
    const sx = src ? src.x : (h.sx ?? x - 1), sz = src ? src.y : (h.sy ?? z);
    let dx = x - sx, dz = z - sz; { const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l; }
    h = { ...h, dx, dz, crit: !!(this.crits && this.crits.has(h.src + ':' + h.tgt)) };
    const eff = h.eff || null, line = h.element || (src && src.mtMon && src.mtMon.types[0]) || 'fire';
    const isStruct = tgt && (tgt.kind === 'tower' || tgt.kind === 'inhibitor' || tgt.kind === 'nexus');
    const src0 = h.source;
    const busy = tgt ? this.hitBudget(tgt.id) : false;      // >2 big hits on this unit in 0.4 s: numbers only, no more layers
    if (busy && src0 !== 'dot' && src0 !== 'field') { /* skip visuals */ }
    else if (src0 === 'dot' || src0 === 'field') {
      if (this.r() < 0.6) this.emit({ glyph: line === 'fire' ? 'ember' : 'twinkle', pal: line, x: p.x + (this.r() - 0.5) * 0.4, y: p.y, z: p.z, vy: 1, life: 0.35, size: 0.5, fps: 14, blend: line === 'fire' ? 0 : 1, gain: line === 'fire' ? 1.2 : 2 });
    } else if (h.ability && h.ability !== 'basic') {
      const K = ABILITY[h.ability]; if (K && K.hit) K.hit(this, h, p, eff, src, tgt);
      else if (eff) impact(this, line, p.x, p.y, p.z, 0.7, dx, dz, eff, h.crit);
    } else {
      impact(this, line, isStruct ? p.x - dx * 0.8 : p.x - dx * 0.45, isStruct ? p.gy + 1.2 : p.gy + p.h * 0.45, isStruct ? p.z - dz * 0.8 : p.z - dz * 0.45, 0.9, dx, dz, eff, h.crit);
      this.sfx('hit_' + line, x, z, { weak: eff === 'weak' });
    }
    if (src0 !== 'dot' && src0 !== 'field') { if (eff === 'super') { this.sfx('super', x, z); if (tgt) this.spriteFx(tgt.id, { flash: 0.4, ttl: 0.07 }); } else if (eff === 'weak') this.sfx('weak', x, z); }
    this.damageNumber({ amount: h.amount, crit: h.crit, source: src0 }, tgt, src, p, src0 === 'dot' || src0 === 'field' ? null : eff);
  }

  /** floating numbers for monster combat (the legacy layer only shows the trainer's own hits) */
  damageNumber(ev, tgt, src, p, eff) {
    if (!(ev.amount >= 1) || !tgt) return;
    const app = this.ctx.app, locals = app && app.locals && app.locals.length ? app.locals.map((l) => l.unitId) : [this.frame.playerId];
    const srcOwner = src && src.mtMon ? src.mtMon.ownerId : -1, tgtOwner = tgt.mtMon ? tgt.mtMon.ownerId : -1;
    const mine = locals.includes(srcOwner), hitMine = locals.includes(tgtOwner);
    const y0 = p.gy + p.h, amt = Math.round(ev.amount), o = { tgt: tgt.id, amount: ev.amount, h: p.h };
    if (mine) {
      const dot = ev.source === 'dot' || ev.source === 'field';
      const style = dot ? 'dmg' : ev.crit ? 'crit' : eff === 'super' ? 'super' : eff === 'weak' ? 'weak' : 'dmg';
      this.text(String(amt), style, p.x, p.z, y0, { ...o, shake: ev.crit ? 1 : 0 });
      // (the HUD shows the "It's super effective!" callout for local monsters; numbers carry the colour coding)
    } else if (hitMine) this.text(String(amt), 'taken', p.x, p.z, y0, o);
  }

  onHeal(ev) {
    if (!(ev.amount >= 8)) return;
    const u = this.unit(ev.tgt); if (!u || !u.mtMon) return;
    const app = this.ctx.app, locals = app && app.locals && app.locals.length ? app.locals.map((l) => l.unitId) : [this.frame.playerId];
    if (!locals.includes(u.mtMon.ownerId)) return;
    const p = this.unitWorld(u); this.text('+' + Math.round(ev.amount), 'heal', p.x, p.z, p.gy + p.h + 0.15, { tgt: u.id, dx: 14 });
  }

  onStructure(ev, mt) {
    const id = ev.id; if (id != null && this.seenStruct.has(id)) return; if (id != null) this.seenStruct.add(id);
    let u = this.unit(id), x = ev.x, z = ev.y;
    if (!Number.isFinite(x) && u) { x = u.x; z = u.y; }
    if (!Number.isFinite(x) || !this.near(x, z, 40)) return;
    const kind = KIND_NAME[ev.kind] || (u && KIND_NAME[u.kind]) || 'tower';
    if (kind === 'nexus') return;            // handled by MATCH_END / VICTORY (bigger)
    M.structureDown(this, { ...ev, x, y: z, team: ev.team ?? (u && u.team) }, kind);
    void mt;
  }
  onMatchEnd(ev) {
    if (this.matchEnded === this.world) return; this.matchEnded = this.world;
    let x = ev.x, z = ev.y;
    if (!Number.isFinite(x)) { const nx = this.world.structures && this.world.structures.find((s) => s.kind === 'nexus' && s.team === ev.loser); if (nx) { x = nx.x; z = nx.y; } }
    M.matchEnd(this, { ...ev, x, y: z }, this.viewerTeam);
  }
  onVictory(ev) {
    const w = this.world; if (!w) return;
    const loser = ev.team === 0 ? 1 : 0, nx = w.structures && w.structures.find((s) => s.kind === 'nexus' && s.team === loser);
    if (nx) this.later(0.01, () => this.onMatchEnd({ winner: ev.team, loser, x: nx.x, y: nx.y }));
  }

  /** Tower target links (replaces the legacy red ribbon): dotted pixel arc flowing to the target + lock reticle. */
  towerLinks(w) {
    const V = this.V, S = w.structures; if (!S || !V) return;
    const tmp = this._tmpA || (this._tmpA = { x: 0, y: 0, z: 0 }), now = this.time;
    for (const s of S) {
      if (s.kind !== 'tower' || !s.alive || !(s.targetId >= 0) || !this.near(s.x, s.y, 36) || !this.unitVisible(s)) continue;
      const t = this.unit(s.targetId); if (!t || !t.alive || !this.unitVisible(t)) continue;
      const T = towerLook(s.team);
      let m; try { m = V.anchorTo(s, 'muzzle', tmp); } catch (e) { m = null; }
      const x0 = m ? m.x : s.x, y0 = m ? m.y : heightAt(s.x, s.y) + 5, z0 = m ? m.z : s.y;
      const q = this.unitWorld(t), x1 = q.x, y1 = q.gy + q.h * 0.55, z1 = q.z;
      const iv = 1 / Math.max(0.2, (s.stats && s.stats.attackSpeed) || 0.83), u = Math.min(1, Math.max(0, (w.time - (s.lastAttackT ?? -9)) / iv));
      const hero = t.kind === 'champion' || (t.mtMon && t.mtMon.ownerId >= 0), n = hero ? 9 : 6;
      for (let i = 0; i < n; i++) {
        const k = ((i + (now * 1.8) % 1) / n), y = y0 + (y1 - y0) * k + Math.sin(k * Math.PI) * 0.7;
        this.gfx.now('dot', 0, x0 + (x1 - x0) * k, y, z0 + (z1 - z0) * k, 0.18 + 0.12 * k, { pal: T.pal, gain: 1.3, hot: 1.3 });
      }
      if (hero) this.gfx.ring(x1, q.gy + 0.07, z1, 0.75 + 0.15 * (1 - u), { pal: T.pal, rot: now * 3, dash: true, thick: u > 0.7, gain: 1.2 + u });
    }
  }

  findHabitats(w) {
    const out = [];
    if (!w.campState) return out;
    for (const st of w.campState.values()) {
      const c = st.camp; if (!c) continue;
      const key = String(c.id || '').replace(/^(blue|red)_/, '');
      const line = HABITAT_LINES[key]; if (line) out.push({ x: c.x, z: c.y, line });
    }
    return out;
  }

  // ------------------------------------------------------------------------------------------ debug / preview
  /** Render-side preview of an effect at the camera focus (synthetic events; no sim change). */
  preview(name, opts = {}) {
    const w = this.world, pl = this.ctx.pipeline, rig = pl && pl.cameraRig;
    const x = opts.x ?? (rig ? rig.focusX : 60), z = opts.y ?? (rig ? rig.focusY : 60), gy = heightAt(x, z);
    const el = opts.el || 'fire';
    if (name === 'impact') return impact(this, el, x, gy + 0.8, z, opts.s || 1, 1, 0, opts.eff || null, !!opts.crit);
    if (name === 'structure') return M.structureDown(this, { x, y: z, team: 1 }, opts.kind || 'tower');
    if (name === 'nexus') return M.matchEnd(this, { x, y: z, winner: this.viewerTeam, loser: 1 - this.viewerTeam }, this.viewerTeam);
    if (name === 'text') return this.text(opts.text || '123', opts.style || 'super', x, z, gy + 1.5);
    void w;
  }
  stats() { return { live: this.gfx.liveCount, peak: this.gfx.stats.peak, dropped: this.gfx.stats.dropped, tasks: this.tasks.length, errors: this.errors, counts: { ...this.counts }, sfx: this.audio.played, quality: this.gfx.quality, ms: +(this.ms || 0).toFixed(3), msMax: +(this.msMax || 0).toFixed(2) }; }

  dispose() { this.gfx.dispose(); this.numbers.dispose(); }
}

// line of a form (used by kits/moments)
export const lineOfForm = (form) => (FORMS[form] ? FORMS[form].line : null);
export { LEGACY_TO_LINE };
