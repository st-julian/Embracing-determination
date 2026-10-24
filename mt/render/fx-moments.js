// mt/render/fx-moments.js — the big presentation moments: CAPTURE (throw arc, absorb, drop, wobbles, success /
// failure), EVOLUTION (pulsing silhouettes, light pillar, particle rings, flash, reveal), level-up, faint, summon /
// swap-in burst, recall, trainer skills (Rally / Mend / Surge), potion, structure crumble, Nexus + match end
// (slow-mo, victory / defeat flourish) and cheap ambient habitat particles. Owner: VFX specialist.

import { ELEMENT_PAL } from './fx-atlas.js';
import { formFrame } from './fx-art.js';
import { twinkles, groundRing } from './fx-kits.js';
import { FORMS } from '../data/species.js';
import { PPM } from './sprites.js';
/** drawn height of an art bitmap at the sprite system's pixel scale (texels per metre) */
const spriteH = (f) => f.h / (PPM || 16);

const TAU = Math.PI * 2;
const lineOf = (form) => (FORMS[form] ? FORMS[form].line : 'fire');

/** per-target capture presentation state, driven by the capture events */
export class CaptureFx {
  constructor(fx) { this.fx = fx; this.caps = new Map(); }
  get(id) { return this.caps.get(id); }
  throw(ev) {
    const fx = this.fx, t = fx.unit(ev.trainer);
    const p = t ? fx.unitWorld(t) : null;
    if (p) { twinkles(fx, 'orb', p.x, p.gy + 1.2, p.z, 3, 0.25, { size: 0.8 }); fx.sfx('throw', p.x, p.z); }
  }
  start(ev) {
    const fx = this.fx, id = ev.target, u = fx.unit(id);
    const x = ev.x, z = ev.y, gy = fx.gy(x, z);
    const h = u ? u.height || 1 : (FORMS[ev.form] && FORMS[ev.form].height) || 1;
    const C = { id, x, z, gy, form: ev.form, h, t: 0, phase: 'absorb', wob: -1, wobN: 0, done: false, flash: 0 };
    this.caps.set(id, C);
    const top = gy + Math.max(1.1, h * 0.9);
    C.top = top;
    // absorb: beam + implode + white silhouette shrinking into the orb
    fx.glow(x, gy + h * 0.5, z, 2.6 + h, [1, 1, 1], 2.4, 0.3);
    fx.implodeAt(x, gy + h * 0.5, z, 1.4 + h * 0.4, [1, 1, 1], ELEMENT_PAL.water.glow);
    fx.emit({ glyph: 'pillar', pal: 'white', x, y: gy, z, mode: 2, aV: 0, px: 0.9 + h * 0.35, s0: 1, s1: 0.3, life: 0.32, blend: 1, gain: 2.2, sy: 1 });
    groundRing(fx, 'white', x, z, 1.4, 0.2, 0.35);
    fx.sfx('absorb', x, z);
  }
  wobble(ev) {
    const C = this.caps.get(ev.target); if (!C) return; const fx = this.fx;
    C.wob = 0; C.wobN = ev.n || 1;
    fx.sfx('wobble', C.x, C.z, { n: C.wobN });
    fx.emit({ glyph: 'puff', pal: 'dust', x: C.x - 0.25, y: C.gy + 0.08, z: C.z, vx: -0.6, vy: 0.3, life: 0.4, size: 0.5, s1: 0.8 });
    fx.emit({ glyph: 'puff', pal: 'dust', x: C.x + 0.25, y: C.gy + 0.08, z: C.z, vx: 0.6, vy: 0.3, life: 0.4, size: 0.5, s1: 0.8, delay: 0.12 });
    if (C.wobN >= 3) twinkles(fx, 'gold', C.x, C.gy + 0.4, C.z, 2, 0.3, { size: 0.7 });
  }
  success(ev) {
    const fx = this.fx, C = this.caps.get(ev.target) || { x: ev.x, z: ev.y, gy: fx.gy(ev.x, ev.y), id: ev.target, h: 1 };
    this.caps.set(C.id, C);
    C.phase = 'caught'; C.t = 0; C.done = false;
    const { x, z, gy } = C, y = gy + 0.35;
    fx.sfx('catch', x, z);
    fx.glow(x, y, z, 3.2, [1, 0.9, 0.5], 2.4, 0.4);
    // Gen-5 "click": three big stars arc up and out of the orb, then a sparkle shower
    for (let i = 0; i < 3; i++) {
      const a = -Math.PI / 2 + (i - 1) * 0.75;
      fx.emit({ glyph: 'starBig', pal: 'gold', x, y: y + 0.1, z, vx: Math.cos(a + Math.PI / 2) * 0 + (i - 1) * 1.6, vy: 4.6 - Math.abs(i - 1) * 0.8, vz: 0.15, g: 7.5, life: 1.0, size: 0.75, pop: 0.4, spin: (i - 1) * 6, hot: 1.4, gain: 1.3, fout: 0.25 });
    }
    twinkles(fx, 'gold', x, y + 0.5, z, 10, 0.9, { size: 1.1, delay: 0.3, life: 0.6 });
    twinkles(fx, 'white', x, y + 0.3, z, 6, 0.6, { size: 0.9, delay: 0.15 });
    groundRing(fx, 'gold', x, z, 0.3, 2.4, 0.5);
    fx.wave(x, z, 2.2, [1, 0.85, 0.4], 0.5);
  }
  fail(ev) {
    const fx = this.fx, C = this.caps.get(ev.target) || { x: ev.x, z: ev.y, gy: fx.gy(ev.x, ev.y), id: ev.target, h: 1, form: ev.form };
    this.caps.set(C.id, C);
    C.phase = 'burst'; C.t = 0; C.form = ev.form || C.form;
    const { x, z, gy } = C, y = gy + 0.35;
    fx.sfx('fail', x, z); fx.later(0.25, () => fx.sfx('angry', x, z));
    fx.glow(x, y + 0.3, z, 3.4, [1, 1, 1], 2.8, 0.25);
    for (let i = 0; i < Math.round(10 * fx.q); i++) { const a = fx.r() * TAU; fx.emit({ glyph: 'chip', frame: (fx.r() * 3) | 0, fps: 14, pal: i % 3 ? 'orb' : 'gold', x, y, z, vx: Math.cos(a) * 3.2, vy: 3 + fx.r() * 2, vz: Math.sin(a) * 3.2, g: 12, bounce: 0.3, life: 0.9, size: 1.4 }); }
    fx.emit({ glyph: 'burst', frame: 2, pal: 'white', x, y: y + 0.2, z, life: 0.22, size: 1.4, s1: 2.2, gain: 1.6 });
    twinkles(fx, 'white', x, y + 0.4, z, 6, 0.8);
    // angry pop-out marks near the head
    const h = C.h || 1;
    for (let i = 0; i < 2; i++) fx.emit({ glyph: 'anger', pal: 'rally', x: x + (i ? 0.45 : -0.35), y: gy + h * 1.05 + i * 0.15, z, life: 0.9, size: 0.75, pop: 0.8, delay: 0.12 + i * 0.12, follow: C.id, fout: 0.3 });
  }
  miss(ev) { this.caps.delete(ev.targetId); }
  /** per-frame layers around the orb (the orb sprite itself is drawn by sprites.js) */
  update(dt) {
    const fx = this.fx;
    for (const [id, C] of this.caps) {
      C.t += dt;
      const { x, z, gy } = C, orbY = gy + 0.35;
      if (C.phase === 'absorb') {
        const A = 0.32;
        if (C.t < A) {                          // the white monster shrinks down into the opened orb
          const k = C.t / A;
          fx.gfx.shade(x, gy, z, 3.2, 0.4 * (1 - k), 0.3, 0.9);
          const sf = formFrame(fx.gfx.sprAtlas, C.form, 'silhouette');
          if (sf) fx.gfx.sprNow(sf, x, gy + (orbY - gy) * k, z, Math.max(0.03, spriteH(sf) * (1 - k * 0.92)), { flash: 1, glow: 0.8, gain: 2.2 });
          if (fx.r() < 0.6) fx.emit({ glyph: 'twinkle', pal: 'white', x: x + (fx.r() - 0.5) * C.h, y: gy + fx.r() * C.h, z, vy: -2, life: 0.2, size: 0.8, blend: 1, gain: 2 });
        } else { C.phase = 'rest'; C.t = 0; }
      } else if (C.phase === 'rest') {
        if (C.t > 8) this.caps.delete(id);
      } else if (C.phase === 'caught') {
        if (C.t > 0.55 && C.t < 1.0 && fx.r() < 0.8) fx.emit({ glyph: 'twinkle', pal: fx.r() < 0.5 ? 'gold' : 'white', x: x + (fx.r() - 0.5) * 0.3, y: orbY + (C.t - 0.55) * 3, z, vy: 3, life: 0.3, size: 0.8, blend: 1, gain: 2.2 });
        if (C.t > 1.1) this.caps.delete(id);
      } else if (C.phase === 'burst') {
        const sf = formFrame(fx.gfx.sprAtlas, C.form, 'silhouette'), k = C.t / 0.24;
        if (k < 1 && fx.spriteFx(id, { scale: 0.35 + 0.65 * Math.min(1, k * 1.25), flash: 1 - k * 0.8 })) { /* real sprite pops out white */ }
        else if (sf && k < 1) {                        // white monster pops back out (covers the coloured sprite while it fades)
          const u = fx.unit(id), p = u ? fx.unitWorld(u) : { x, z, gy };
          const s = 0.35 + 0.65 * Math.min(1, k * 1.25);
          fx.gfx.sprNow(sf, p.x, p.gy, p.z, spriteH(sf) * s, { flash: 1, gain: 2.2, glow: 0.5 });
        }
        if (C.t > 0.4) this.caps.delete(id);
      }
    }
  }
  clear() { this.caps.clear(); }
}

// ------------------------------------------------------------------------------------------------ evolution
export class EvolveFx {
  constructor(fx) { this.fx = fx; this.evo = new Map(); }
  start(ev) {
    const fx = this.fx, id = ev.unit; if (!(id >= 0)) return;
    const u = fx.unit(id); if (!u) return;
    const w = fx.world, dur = ev.duration || (ev.until && ev.t0 ? ev.until - ev.t0 : (u.mtMon && u.mtMon.evolving ? u.mtMon.evolving.until - w.time : 2.4));
    const to = ev.to || (u.mtMon && FORMS[u.mtMon.form] ? null : null);
    const E = { id, from: ev.form, to: to || nextForm(ev.form), t: 0, dur: Math.max(0.5, dur), nextRing: 0, el: lineOf(ev.form) };
    this.evo.set(id, E);
    const p = fx.unitWorld(u);
    if (p) {
      fx.decalGlow(p.x, p.z, 2.2, [1, 0.95, 0.7], 0.9, E.dur + 0.3);
      groundRing(fx, 'white', p.x, p.z, 2.6, 0.6, 0.6, { thick: true });
      fx.sfx('evolveRise', p.x, p.z, { duration: E.dur });
    }
  }
  cancel(ev) {
    const fx = this.fx, E = this.evo.get(ev.unit); this.evo.delete(ev.unit);
    const u = fx.unit(ev.unit), p = u ? fx.unitWorld(u) : null;
    if (p) {
      for (let i = 0; i < Math.round(8 * fx.q); i++) { const a = i / 8 * TAU; fx.emit({ glyph: 'puff', pal: 'grey', x: p.x + Math.cos(a) * 0.6, y: p.gy + 0.2, z: p.z + Math.sin(a) * 0.4, vx: Math.cos(a) * 1.5, vz: Math.sin(a) * 1.5, vy: -0.3, drag: 2, life: 0.6, size: 0.8, s1: 1.2 }); }
      fx.sfx('evolveCancel', p.x, p.z);
    }
    void E;
  }
  done(ev) {
    const fx = this.fx, id = ev.unit; this.evo.delete(id);
    const u = id >= 0 ? fx.unit(id) : null, p = u ? fx.unitWorld(u) : null; if (!p) return;
    const fin = (ev.stage ?? (FORMS[ev.to] ? FORMS[ev.to].stage : 1)) >= 2;
    const { x, z, gy } = p, y = gy + p.h * 0.55;
    fx.glow(x, y, z, 6 + (fin ? 2 : 0), [1, 1, 1], 3.2, 0.5);
    fx.glow(x, y, z, 3, [1, 0.9, 0.6], 2.4, 0.9);
    fx.emit({ glyph: 'pillar', pal: 'white', x, y: gy, z, mode: 2, aV: 0, px: 2.4, s0: 1, s1: 0.2, life: 0.55, blend: 1, gain: 3, fout: 0.7 });
    fx.task(0.5, (k) => fx.gfx.shade(x, gy, z, 6.5, 0.6 * (1 - k), 0.2, 1.6));
    fx.wave(x, z, 4.5, [1, 0.95, 0.75], 0.7);
    groundRing(fx, 'gold', x, z, 0.5, 4.2, 0.6, { thick: true });
    groundRing(fx, 'white', x, z, 0.3, 3.2, 0.45, { delay: 0.08 });
    const n = Math.round((fin ? 12 : 9) * fx.q);
    for (let i = 0; i < n; i++) { const a = i / n * TAU; fx.emit({ glyph: 'star', pal: 'gold', x, y, z, vx: Math.cos(a) * 5, vy: 2.2 + fx.r() * 1.5, vz: Math.sin(a) * 5, g: 4, drag: 1.6, life: 1.0, size: 0.75, spin: (fx.r() - 0.5) * 10, hot: 1.3 }); }
    for (let i = 0; i < Math.round(18 * fx.q); i++) { const a = fx.r() * TAU, d = fx.r() * 2; fx.emit({ glyph: 'chip', frame: (fx.r() * 3) | 0, fps: 12, pal: 'confettiA', x: x + Math.cos(a) * d, y: y + 1.5 + fx.r(), z: z + Math.sin(a) * d, vx: Math.cos(a) * 1.5, vy: 2 + fx.r() * 2, vz: Math.sin(a) * 1.5, g: 3.2, drag: 1.2, life: 1.6, size: 0.8, delay: fx.r() * 0.15 }); }
    twinkles(fx, 'white', x, y + 0.4, z, 14, 1.6, { size: 1.2, life: 0.8, delay: 0.4 });
    fx.shake(0.25, x, z);
    fx.sfx('evolveDone', x, z);
  }
  update(dt) {
    const fx = this.fx, w = fx.world;
    for (const [id, E] of this.evo) {
      const u = fx.unit(id); E.t += dt;
      if (!u || !u.alive || E.t > E.dur + 0.5) { this.evo.delete(id); continue; }
      const p = fx.unitWorld(u); if (!p) continue;
      const M = u.mtMon, k = Math.min(1, E.t / E.dur);
      // white silhouette of the NEXT form alternates with the sprite system's white-pulsing current form (antiphase)
      let ph = Math.sin(E.t * (6 + 30 * k * k));
      if (M && M.evolving && w) { const now = fx.simNow(), pp = Math.min(1, Math.max(0, 1 - (M.evolving.until - now) / 2.4)); ph = Math.sin(now * (6 + 34 * pp * pp)); }
      const showNew = ph < -0.1;
      fx.spriteFx(id, { hidden: showNew && !!formFrame(fx.gfx.sprAtlas, E.to, 'silhouette'), ttl: 0.1 });
      if (showNew) {
        const sf = formFrame(fx.gfx.sprAtlas, E.to, 'silhouette');
                if (sf) fx.gfx.sprNow(sf, p.x, p.gy, p.z, spriteH(sf), { flash: 1, glow: 0.6 + k * 0.8, gain: 2.2 });
      }
      // particle rings rising around the monster, faster and faster
      E.nextRing -= dt;
      if (E.nextRing <= 0) {
        E.nextRing = 0.42 - 0.3 * k;
        const n = Math.round(10 * fx.q), r0 = 1.0 + p.h * 0.3;
        for (let i = 0; i < n; i++) fx.emit({ glyph: i % 3 ? 'twinkle' : 'dot', frame: i % 3 ? undefined : 1, pal: i % 2 ? 'white' : 'gold', x: p.x, y: p.gy, z: p.z, life: 0.75, size: 0.9, blend: 1, gain: 2.2, fps: 10,
          orbit: { cx: p.x, cz: p.z, cy: p.gy + 0.05, r0, r1: r0 * 0.45, w: 2.8 + k * 3, a: i / n * TAU, vy: 2.4 + p.h * 0.6 }, follow: id });
      }
      if (fx.r() < (0.25 + k * 0.6) * fx.q) { const a = fx.r() * TAU, d = 1.8 + fx.r() * 1.5; fx.emit({ glyph: 'dot', frame: 1, pal: 'gold', x: p.x + Math.cos(a) * d, y: p.gy + 0.3 + fx.r() * p.h * 1.5, z: p.z + Math.sin(a) * d, vx: -Math.cos(a) * d * 1.6, vz: -Math.sin(a) * d * 1.6, life: 0.55, size: 1.1, blend: 1, gain: 2.4, fout: 0.2 }); }
      const ramp = Math.min(1, E.t / 0.35);
      fx.gfx.shade(p.x, p.gy, p.z, 7, 0.82 * ramp, 0.35, 1.3 + p.h * 0.3);                       // the world dims around the evolving monster
      const pw = (0.9 + p.h * 0.5) * (1 + 0.18 * Math.sin(E.t * (8 + 24 * k)));      // pulsing light pillar
      fx.gfx.now('pillar', 0, p.x, p.gy, p.z, pw, { pal: 'gold', mode: 2, aV: 0, blend: 1, gain: (0.7 + 0.8 * k) * ramp, sx: 1 });
      fx.gfx.queue[fx.gfx.queue.length - 1].sy = 3.6 / pw;
      if (fx.r() < (0.5 + k) * fx.q) { const a = fx.r() * TAU, d = 0.2 + fx.r() * 0.8; fx.emit({ glyph: 'streak', pal: 'gold', x: p.x + Math.cos(a) * d, y: p.gy + 0.2, z: p.z + Math.sin(a) * d, vy: 6 + k * 6, life: 0.45, size: 1.2, rot: Math.PI / 2, blend: 1, gain: 2.2 }); }
      fx.gfx.ring(p.x, p.gy + 0.06, p.z, 1.3 + Math.sin(E.t * 8) * 0.06, { pal: 'gold', gain: 1.4 + k, rot: E.t * 2, thick: true });
      fx.gfx.ring(p.x, p.gy + 0.06, p.z, 2.1 - 0.4 * k, { pal: 'white', gain: 1.0 + k, rot: -E.t * 3, dash: true });
    }
  }
  clear() { this.evo.clear(); }
}
function nextForm(form) {
  const f = FORMS[form]; if (!f) return form;
  const all = Object.values(FORMS).filter((g) => g.line === f.line).sort((a, b) => a.stage - b.stage);
  const n = all.find((g) => g.stage === f.stage + 1); return n ? n.id : form;
}

// ------------------------------------------------------------------------------------------------ small moments
export function levelUp(fx, u, level) {
  const p = fx.unitWorld(u); if (!p) return;
  const id = u.id;
  for (let ring = 0; ring < 2; ring++) {
    const n = Math.round(10 * fx.q);
    for (let i = 0; i < n; i++) fx.emit({ glyph: 'twinkle', pal: ring ? 'white' : 'gold', x: p.x, y: p.gy, z: p.z, life: 0.65, size: 1.0, blend: 1, gain: 2.6, fps: 10, delay: ring * 0.18,
      orbit: { cx: p.x, cz: p.z, cy: p.gy + 0.05, r0: 0.75, r1: 0.6, w: 5, a: i / n * TAU, vy: (p.h + 0.4) / 0.6 }, follow: id });
  }
  for (let i = 0; i < 3; i++) fx.emit({ glyph: 'chevron', pal: 'gold', x: p.x + (i - 1) * 0.5, y: p.gy + 0.3 + (i === 1 ? 0.25 : 0), z: p.z, vy: 2.4, life: 0.9, size: 1.0, pop: 0.5, delay: 0.08 + i * 0.07, follow: id, fout: 0.3, hot: 1.2 });
  fx.emit({ glyph: 'pillar', pal: 'gold', x: p.x, y: p.gy, z: p.z, mode: 2, aV: 0, px: 0.8 + p.h * 0.4, s0: 1.2, s1: 0.3, sy: 1.2, life: 0.5, blend: 1, gain: 1.8, follow: id });
  groundRing(fx, 'gold', p.x, p.z, 0.4, 2.0, 0.5, { thick: true });
  fx.glow(p.x, p.gy + p.h * 0.6, p.z, 2.2, [1, 0.85, 0.4], 1.6, 0.35);
  fx.task(0.4, (k) => fx.spriteFx(id, { tint: [1, 0.85, 0.3, 0.55 * (1 - k)] }));
  fx.text('LV ' + level + '!', 'level', p.x, p.z, p.gy + p.h + 0.35, { rise: 22, life: 1.4 });
  fx.sfx('levelUp', p.x, p.z);
}

export function faint(fx, u, ev) {
  const p = u ? fx.unitWorld(u) : { x: ev.x, z: ev.y, gy: fx.gy(ev.x, ev.y), h: 1 };
  if (!p) return;
  const id = u ? u.id : -1;
  for (let i = 0; i < 3; i++) fx.emit({ glyph: 'star', pal: 'gold', x: p.x, y: p.gy, z: p.z, life: 1.3, size: 0.75, spin: 6, hot: 1.2,
    orbit: { cx: p.x, cz: p.z, cy: p.gy + p.h * 0.95, r0: 0.45, r1: 0.35, w: 6, a: i / 3 * TAU, vy: -0.25 }, follow: id, fout: 0.35 });
  for (let i = 0; i < Math.round(6 * fx.q); i++) { const a = fx.r() * TAU; fx.emit({ glyph: 'puff', pal: 'smoke', x: p.x + Math.cos(a) * 0.3, y: p.gy + 0.25, z: p.z + Math.sin(a) * 0.3, vx: Math.cos(a) * 1.2, vy: 0.4, vz: Math.sin(a) * 1.2, drag: 2.5, life: 0.8, size: 0.9, s1: 1.4, delay: 0.25 }); }
  fx.emit({ glyph: 'spiral', pal: 'white', x: p.x, y: p.gy + p.h + 0.25, z: p.z, life: 1.1, size: 0.9, spin: -8, pop: 0.4, follow: id, fout: 0.3 });
  fx.sfx('faint', p.x, p.z);
}

/** summon / swap-in / respawn: orb pops open, white materialisation, element burst */
export function summon(fx, u, ev) {
  const p = u ? fx.unitWorld(u) : null; if (!p) return;
  const form = ev.form || (u.mtMon && u.mtMon.form), el = lineOf(form), E = ELEMENT_PAL[el] || ELEMENT_PAL.fire, swap = ev.from === 'swap';
  const id = u.id, H = p.h;
  fx.glow(p.x, p.gy + H * 0.5, p.z, 2.6 + H, [1, 1, 1], 2.2, 0.25);
  groundRing(fx, E.main, p.x, p.z, 0.3, swap ? 2.6 : 1.8, 0.4, { thick: true });
  twinkles(fx, 'white', p.x, p.gy + H * 0.6, p.z, 6, 0.7, { delay: 0.1 });
  if (swap) {        // "the incoming monster enters with a short burst"
    const n = Math.round(10 * fx.q);
    for (let i = 0; i < n; i++) { const a = i / n * TAU; fx.emit({ glyph: 'streak', pal: E.main, x: p.x + Math.cos(a) * 0.4, y: p.gy + 0.2 + fx.r() * H, z: p.z + Math.sin(a) * 0.4, vx: Math.cos(a) * 7, vz: Math.sin(a) * 7, drag: 4, life: 0.3, size: 1.1, blend: 1, gain: 2.2, align: true }); }
    fx.wave(p.x, p.z, 2.6, E.glow, 0.4);
    fx.sfx('swap', p.x, p.z);
  }
  fx.emit({ glyph: 'pillar', pal: 'white', x: p.x, y: p.gy, z: p.z, mode: 2, aV: 0, px: 0.6 + H * 0.5, s0: 1.3, s1: 0.2, life: 0.3, blend: 1, gain: 2.4, follow: id });
  // Gen-5 send-out pop: the real sprite grows out of a white flash (sprites.js override)
  fx.task(0.36, (k) => { const s = k < 0.4 ? 0.3 + (k / 0.4) * 0.85 : 1.15 - ((k - 0.4) / 0.6) * 0.15; fx.spriteFx(id, { scale: s, flash: Math.max(0, 1 - k * 1.3) }); },
    () => fx.spriteFx(id, { scale: 1, flash: 0, ttl: 0.01 }));
  fx.sfx('summon', p.x, p.z);
}

export function recall(fx, ev) {
  const x = ev.x, z = ev.y; if (!Number.isFinite(x)) return;
  const gy = fx.gy(x, z), t = fx.unit(ev.trainer), tp = t ? fx.unitWorld(t) : null, form = ev.form, H = (FORMS[form] && FORMS[form].height) || 1.1;
  fx.glow(x, gy + H * 0.5, z, 2, [1, 1, 1], 1.8, 0.2);
  fx.task(0.35, (k) => {
    const sf = formFrame(fx.gfx.sprAtlas, form, 'silhouette');
    const tx = tp ? tp.x : x, tz = tp ? tp.z : z, ty = tp ? tp.gy + 1.1 : gy + 1;
    const cx = x + (tx - x) * k * k, cz = z + (tz - z) * k * k, cy = gy + (ty - gy) * k;
    if (sf) fx.gfx.sprNow(sf, cx, cy, cz, Math.max(0.05, spriteH(sf) * (1 - k * 0.92)), { flash: 1, gain: 2.2 });
    if (fx.r() < 0.8) fx.emit({ glyph: 'twinkle', pal: 'orb', x: cx, y: cy + 0.2, z: cz, life: 0.3, size: 0.7, blend: 1, gain: 2 });
  });
  fx.sfx('recall', x, z);
}

export function trainerSkill(fx, ev) {
  const u = fx.unit(ev.unit), p = u ? fx.unitWorld(u) : null, t = fx.unit(ev.trainer), tp = t ? fx.unitWorld(t) : null;
  const skill = ev.skill;
  const tint = { rally: [1, 0.45, 0.15], mend: [0.35, 1, 0.45], surge: [0.75, 0.35, 1] }[skill];
  if (u && tint) fx.task(0.5, (k) => fx.spriteFx(u.id, { tint: [...tint, 0.6 * (1 - k)] }));
  if (skill === 'rally') {
    if (tp) { fx.emit({ glyph: 'bang', pal: 'rally', x: tp.x, y: tp.gy + 2.0, z: tp.z, life: 0.7, size: 1.0, pop: 0.8, follow: t.id }); groundRing(fx, 'rally', tp.x, tp.z, 0.3, 1.4, 0.35); }
    if (!p) return;
    fx.emit({ glyph: 'burst', frame: 1, pal: 'rally', x: p.x, y: p.gy + p.h * 0.55, z: p.z, life: 0.25, size: 1.4, s1: 1.9 });
    fx.emit({ glyph: 'pillar', pal: 'rally', x: p.x, y: p.gy, z: p.z, mode: 2, aV: 0, px: 1 + p.h * 0.4, s0: 1.2, s1: 0.3, life: 0.45, blend: 1, gain: 2, follow: u.id });
    for (let i = 0; i < 6; i++) fx.emit({ glyph: 'chevron', pal: 'rally', x: p.x + Math.cos(i) * 0.6, y: p.gy + 0.2 + (i % 3) * 0.3, z: p.z + Math.sin(i) * 0.3, vy: 2.6, life: 0.7, size: 0.75, pop: 0.4, delay: i * 0.05, follow: u.id });
    groundRing(fx, 'rally', p.x, p.z, 0.4, 2.2, 0.45, { thick: true });
    fx.glow(p.x, p.gy + p.h * 0.5, p.z, 2.4, [1, 0.45, 0.2], 1.8, 0.3);
    const id = u.id;
    fx.task(5, (k) => {          // 5 s aura: speed lines + rising sparks
      const q = fx.unitWorld(fx.unit(id)); if (!q) return false;
      if (fx.r() < 0.35 * fx.q) fx.emit({ glyph: 'streak', pal: 'rally', x: q.x + (fx.r() - 0.5) * 0.7, y: q.gy + q.h * (0.2 + fx.r() * 0.6), z: q.z + (fx.r() - 0.5) * 0.4, vy: 1.2, life: 0.3, size: 0.9, blend: 1, gain: 2, rot: Math.PI / 2 });
      if (fx.r() < 0.08 * fx.q) fx.emit({ glyph: 'chevron', pal: 'rally', x: q.x, y: q.gy + 0.2, z: q.z, vy: 1.8, life: 0.6, size: 0.55, follow: id });
      fx.gfx.now('ring', 0, q.x, q.gy + 0.06, q.z, 1.5 + 0.1 * Math.sin(k * 60), { pal: 'rally', mode: 1, blend: 1, gain: 1.2 * (1 - k * 0.5) });
    });
    fx.sfx('rally', p.x, p.z);
  } else if (skill === 'mend') {
    for (const q of [p, tp]) {
      if (!q) continue;
      for (let i = 0; i < Math.round(8 * fx.q); i++) fx.emit({ glyph: 'plus', pal: 'heal', x: q.x + (fx.r() - 0.5) * 1.1, y: q.gy + 0.2 + fx.r() * q.h, z: q.z + (fx.r() - 0.5) * 0.8, vy: 1.4, life: 0.9, size: 0.6, pop: 0.5, delay: fx.r() * 0.4 });
      for (let i = 0; i < Math.round(6 * fx.q); i++) fx.emit({ glyph: i % 2 ? 'petal' : 'leaf', fps: 10, pal: i % 2 ? 'pink' : 'grass', x: q.x, y: q.gy, z: q.z, life: 1.0, size: 0.6,
        orbit: { cx: q.x, cz: q.z, cy: q.gy + 0.1, r0: 0.9, r1: 0.5, w: 4, a: i, vy: q.h * 0.9 } });
      groundRing(fx, 'heal', q.x, q.z, 0.3, 1.8, 0.5, { thick: true });
      fx.emit({ glyph: 'pillar', pal: 'heal', x: q.x, y: q.gy, z: q.z, mode: 2, aV: 0, px: 0.9 + q.h * 0.4, s0: 1.2, s1: 0.4, life: 0.6, blend: 1, gain: 1.8 });
      fx.glow(q.x, q.gy + q.h * 0.5, q.z, 2.2, [0.4, 1, 0.5], 1.6, 0.4);
    }
    if (p) fx.sfx('mend', p.x, p.z);
  } else if (skill === 'surge') {
    if (!p) return;
    const id = u.id;
    fx.emit({ glyph: 'burst', frame: 1, pal: 'arcane', x: p.x, y: p.gy + p.h * 0.55, z: p.z, life: 0.25, size: 1.3, s1: 1.8, gain: 1.5 });
    fx.emit({ glyph: 'pillar', pal: 'arcane', x: p.x, y: p.gy, z: p.z, mode: 2, aV: 0, px: 1 + p.h * 0.4, s0: 1.3, s1: 0.3, life: 0.5, blend: 1, gain: 2.2, follow: u.id });
    twinkles(fx, 'arcane', p.x, p.gy + p.h * 0.6, p.z, 10, 1.0, { size: 1.1 });
    groundRing(fx, 'arcane', p.x, p.z, 2, 0.4, 0.4, { thick: true });
    fx.glow(p.x, p.gy + p.h * 0.5, p.z, 2.6, [0.7, 0.35, 1], 2, 0.35);
    fx.surge.set(id, fx.time + 10);
    fx.task(10, (k) => {          // charged until the next ability (or 10 s)
      const uu = fx.unit(id), q = fx.unitWorld(uu); if (!q || !fx.surge.has(id)) return false;
      const rec = uu.mtMon && uu.mtMon.rec; if (rec && rec.surgeUntil != null && rec.surgeUntil <= fx.world.time && k > 0.02) { fx.surge.delete(id); return false; }
      if (fx.r() < 0.25 * fx.q) fx.emit({ glyph: 'gem', pal: 'arcane', x: q.x, y: q.gy, z: q.z, life: 0.8, size: 0.5, orbit: { cx: q.x, cz: q.z, cy: q.gy + 0.2, r0: 0.7, r1: 0.6, w: 3, a: fx.r() * TAU, vy: q.h * 0.9 }, follow: id });
    });
    fx.sfx('surge', p.x, p.z);
  }
}

/** Surge consumed by an ability: empowered flash at the caster + an elemental ring at the aim point */
export function surgeRelease(fx, u, ev) {
  const p = fx.unitWorld(u); if (!p) return;
  const el = ev.element || (u.mtMon && u.mtMon.types[0]) || 'fire', E = ELEMENT_PAL[el] || ELEMENT_PAL.fire;
  fx.emit({ glyph: 'burst', frame: 2, pal: 'arcane', x: p.x, y: p.gy + p.h * 0.55, z: p.z, life: 0.25, size: 1.5, s1: 2.2, gain: 1.6 });
  twinkles(fx, 'arcane', p.x, p.gy + p.h * 0.6, p.z, 8, 0.8);
  if (Number.isFinite(ev.tx)) { groundRing(fx, E.main, ev.tx, ev.ty, 0.5, 2.5, 0.6, { thick: true }); fx.wave(ev.tx, ev.ty, 2.5, E.glow, 0.5); }
}

export function potion(fx, ev) {
  const u = fx.unit(ev.unit), p = u ? fx.unitWorld(u) : null; if (!p) return;
  const id = u.id;
  fx.task(2, (k) => {
    const q = fx.unitWorld(fx.unit(id)); if (!q) return false;
    if (fx.r() < 0.4 * fx.q) fx.emit({ glyph: 'plus', pal: 'heal', x: q.x + (fx.r() - 0.5) * 0.8, y: q.gy + 0.2 + fx.r() * q.h * 0.8, z: q.z + (fx.r() - 0.5) * 0.6, vy: 1.1, life: 0.7, size: 0.5, pop: 0.4 });
    if (fx.r() < 0.3 * fx.q) fx.emit({ glyph: 'bubble', frame: 0, pal: 'heal', x: q.x + (fx.r() - 0.5) * 0.6, y: q.gy + 0.2, z: q.z, vy: 1.3, life: 0.6, size: 0.35 });
    void k;
  });
  fx.emit({ glyph: 'splash', frame: 1, pal: 'heal', x: p.x, y: p.gy + p.h + 0.1, z: p.z, life: 0.35, size: 0.8, mode: 2, aV: 0.2 });
  groundRing(fx, 'heal', p.x, p.z, 0.3, 1.3, 0.4);
  fx.sfx('potion', p.x, p.z);
}

// ------------------------------------------------------------------------------------------------ structures & match end
export function structureDown(fx, ev, kind) {
  const x = ev.x, z = ev.y; if (!Number.isFinite(x)) return;
  const nexus = kind === 'nexus', inhib = kind === 'inhibitor', gy = fx.gy(x, z), R = nexus ? 7 : inhib ? 4.5 : 4;
  const pal = ev.team === 0 ? 'teamBlue' : 'teamRed';
  // rolling dust ring
  const n = Math.round((nexus ? 16 : 10) * fx.q);
  for (let i = 0; i < n; i++) { const a = i / n * TAU + fx.r() * 0.2; fx.emit({ glyph: 'puffBig', pal: 'dust', x: x + Math.cos(a) * 1.2, y: gy + 0.4, z: z + Math.sin(a) * 1.2, vx: Math.cos(a) * R * 2.2, vz: Math.sin(a) * R * 2.2, vy: 0.4, drag: 2.6, life: 0.9, size: nexus ? 0.9 : 0.7, s1: nexus ? 1.5 : 1.2, delay: 0.1 + fx.r() * 0.15 }); }
  // chunky debris
  const m = Math.round((nexus ? 10 : 6) * fx.q);
  for (let i = 0; i < m; i++) { const a = fx.r() * TAU, sp = 2 + fx.r() * (nexus ? 7 : 5); fx.emit({ glyph: 'rock', frame: (fx.r() * 3) | 0, pal: i % 3 === 0 ? pal : 'dust', x, y: gy + 1.5 + fx.r() * 2, z, vx: Math.cos(a) * sp, vy: 4 + fx.r() * 5, vz: Math.sin(a) * sp, g: 16, spin: (fx.r() - 0.5) * 16, life: 0.9, size: 0.9, fout: 0.35 }); }
  // crystal sparks in team colour
  twinkles(fx, pal, x, gy + 2, z, nexus ? 10 : 5, 2.2, { size: 1.4, life: 0.5, vy: 2 });
  fx.wave(x, z, R * 1.4, [1, 0.9, 0.7], 0.8);
  fx.glow(x, gy + 2, z, R * 0.8, [1, 0.85, 0.6], 1.6, 0.3);
  groundRing(fx, 'dust', x, z, 1, R * 1.3, 0.7, { thick: true, blend: 0 });
  fx.shake(nexus ? 0.9 : 0.45, x, z);
  fx.sfx('crumble', x, z, { power: nexus ? 1.8 : 1 });
}

export function matchEnd(fx, ev, viewerTeam) {
  const x = ev.x, z = ev.y; if (!Number.isFinite(x)) return;
  const s = ev.slowmo || {};
  fx.setSlowmo(s.scale || 0.3, s.duration || 1.8);
  const gy = fx.gy(x, z);
  for (let r = 0; r < 3; r++) fx.later(r * 0.25, () => { fx.wave(x, z, 6 + r * 4, [1, 0.9, 0.7], 0.9); groundRing(fx, 'white', x, z, 1, 8 + r * 3, 0.8, { thick: true }); fx.glow(x, gy + 3, z, 8 + r * 2, [1, 0.9, 0.7], 2.8, 0.5); });
  fx.later(0.05, () => structureDown(fx, { ...ev, team: ev.loser }, 'nexus'));
  const won = ev.winner === viewerTeam;
  fx.later(1.0, () => fx.sfx(won ? 'victory' : 'defeat', x, z, { ui: true }));
  // flourish over the fallen Nexus for ~4 s: fireworks + confetti (victory) or ash (defeat)
  fx.task(4.5, (k) => {
    if (won) {
      if (fx.r() < 0.06 * fx.q + 0.02) {
        const fx0 = x + (fx.r() - 0.5) * 10, fz0 = z + (fx.r() - 0.5) * 8, fy = gy + 5 + fx.r() * 3, pal = fx.r() < 0.5 ? 'gold' : (viewerTeam === 0 ? 'teamBlue' : 'teamRed');
        fx.emit({ glyph: 'starBig', pal, x: fx0, y: fy, z: fz0, life: 0.5, size: 0.9, pop: 0.6, hot: 1.4 });
        for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; fx.emit({ glyph: 'twinkle', pal, x: fx0, y: fy, z: fz0, vx: Math.cos(a) * 4, vy: Math.sin(a) * 4, g: 2, drag: 1.5, life: 0.9, size: 1, blend: 1, gain: 2.4 }); }
        fx.sfx('sparkle', fx0, fz0);
      }
      if (fx.r() < 0.6 * fx.q) fx.emit({ glyph: 'chip', fps: 12, frame: (fx.r() * 3) | 0, pal: 'confettiA', x: x + (fx.r() - 0.5) * 14, y: gy + 7, z: z + (fx.r() - 0.5) * 12, vx: (fx.r() - 0.5), vy: -1, g: 0.6, drag: 0.8, life: 3, size: 0.8 });
    } else if (fx.r() < 0.5 * fx.q) fx.emit({ glyph: 'puff', pal: 'ash', x: x + (fx.r() - 0.5) * 10, y: gy + 0.5, z: z + (fx.r() - 0.5) * 8, vy: 0.8, life: 2, size: 1.3, s1: 2 });
    void k;
  });
}

// ------------------------------------------------------------------------------------------------ ambient habitats
const AMB = {
  fire: (fx, x, y, z) => fx.emit({ glyph: 'ember', pal: fx.r() < 0.3 ? 'fireHot' : 'fire', x, y, z, vy: 0.5 + fx.r() * 0.6, vx: (fx.r() - 0.5) * 0.3, life: 1.6 + fx.r(), size: 0.55 + fx.r() * 0.3, s1: 0.15, fps: 10, fin: 0.2, fout: 0.4, gain: 1.6, hot: 1.2 }),
  water: (fx, x, y, z) => fx.r() < 0.6 ? fx.emit({ glyph: 'twinkle', pal: 'foam', x, y: y - 0.3, z, life: 0.6, size: 0.7, blend: 1, gain: 1.8 }) : fx.emit({ glyph: 'bubble', frame: 0, pal: 'foam', x, y: y - 0.4, z, vy: 0.5, life: 1.4, size: 0.25 + fx.r() * 0.15, fin: 0.2 }),
  grass: (fx, x, y, z) => fx.emit({ glyph: 'petal', fps: 4, pal: fx.r() < 0.5 ? 'pollen' : 'pink', x, y, z, vx: 0.3 + fx.r() * 0.3, vy: -0.05, vz: (fx.r() - 0.5) * 0.3, life: 3, size: 1, fin: 0.2, fout: 0.3 }),
  electric: (fx, x, y, z) => fx.r() < 0.5 ? fx.emit({ glyph: 'zap', pal: 'electric', x, y: y - 0.4, z, life: 0.15, size: 0.5, fps: 20 }) : fx.emit({ glyph: 'twinkle', pal: 'electric', x, y, z, life: 0.5, size: 0.7, blend: 1, gain: 2 }),
  earth: (fx, x, y, z) => fx.emit({ glyph: 'dot', frame: 0, pal: 'dust', x, y, z, vx: 0.15, vy: 0.15, life: 2.5, size: 0.9, fin: 0.3, fout: 0.4 }),
  wind: (fx, x, y, z) => fx.r() < 0.6 ? fx.emit({ glyph: 'streak', pal: 'wind', x, y, z, vx: 3.2, vz: -0.6, life: 0.5, size: 1.4, blend: 1, gain: 1.4, align: true, fin: 0.2 }) : fx.emit({ glyph: 'leaf', fps: 8, pal: 'grass', x, y, z, vx: 1.6, vy: 0.1, vz: -0.3, life: 1.6, size: 0.5, fin: 0.2 }),
};
export function ambient(fx, dt, habitats) {
  if (!habitats || !habitats.length) return;
  for (const h of habitats) {
    if (!fx.near(h.x, h.z, 26)) continue;
    h.acc = (h.acc || 0) + dt * 4.5 * fx.q;
    while (h.acc >= 1) {
      h.acc -= 1;
      const a = fx.r() * TAU, d = Math.sqrt(fx.r()) * 5.5, x = h.x + Math.cos(a) * d, z = h.z + Math.sin(a) * d;
      const fn = AMB[h.line]; if (fn) fn(fx, x, fx.gy(x, z) + 0.3 + fx.r() * 1.4, z);
    }
  }
}
