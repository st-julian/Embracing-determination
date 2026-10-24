// mt/render/fx-kits.js — element basic-attack projectiles/impacts and every monster ability (DESIGN §5 incl. Final-form
// upgrades). Each recipe layers: anticipation flash → core pixel shapes → secondary particles → ground decal → HD light
// pulse → (rare) camera shake, Wild-Rift style, drawn in chunky Gen-5 pixel glyphs. Owner: VFX specialist.
//
// Coordinates: (x, z) = sim (x, y) ground plane; y = world height. `fx` is the MtFx instance (fx.js) providing
// emit/now/spr helpers, legacy-vfx light helpers, tasks (`fx.task`), sfx and RNG.

import { ELEMENT_PAL } from './fx-atlas.js';

const TAU = Math.PI * 2;
export const LINE_OF_FX = {
  ember_volley: 'fire', flame_pillar: 'fire', bubble_jet: 'water', tidal_mend: 'water', vine_lash: 'grass', thorn_bulwark: 'grass',
  spark_bolt: 'electric', static_dash: 'electric', rock_slam: 'earth', quake_charge: 'earth', gale_slash: 'wind', cyclone: 'wind',
};
export const ATTACK_LINE = (fx) => (typeof fx === 'string' && fx.startsWith('mt_') && fx.endsWith('_attack') ? fx.slice(3, -7) : null);

// ------------------------------------------------------------------------------------------------ building blocks
/** radial spray of glyph particles */
function spray(fx, glyph, pal, x, y, z, n, o = {}) {
  const r = fx.r;
  n = Math.max(1, Math.round(n * fx.q));
  for (let i = 0; i < n; i++) {
    const a = (o.a0 ?? 0) + (o.arc ?? TAU) * (o.arc ? (i + r()) / n - 0.5 : r()), sp = (o.speed ?? 3) * (0.55 + r() * 0.7);
    const up = (o.up ?? 0.4) * (0.5 + r());
    fx.emit({ glyph, pal, x: x + Math.cos(a) * (o.r0 || 0), y: y + (o.dy || 0), z: z + Math.sin(a) * (o.r0 || 0),
      vx: Math.cos(a) * sp, vy: up * sp, vz: Math.sin(a) * sp, g: o.g ?? 0, drag: o.drag ?? 2.5, life: (o.life ?? 0.5) * (0.7 + r() * 0.6),
      size: (o.size ?? 1) * (0.75 + r() * 0.5), s1: o.s1, fps: o.fps, frame: o.frame === 'rand' ? (r() * 4) | 0 : o.frame, loop: o.loop,
      spin: o.spin ? (r() - 0.5) * o.spin : 0, rot: o.rot === 'rand' ? r() * TAU : o.rot || 0, blend: o.blend, gain: o.gain, hot: o.hot,
      bounce: o.bounce, mode: o.mode, fout: o.fout, align: o.align, stretch: o.stretch, pop: o.pop, delay: o.delay ? r() * o.delay : 0, flip: r() < 0.5 });
  }
}
/** twinkle sparkles scattered in a sphere */
export function twinkles(fx, pal, x, y, z, n, rad, o = {}) {
  const r = fx.r; n = Math.max(1, Math.round(n * fx.q * 0.45));      // sparkles are accents: keep them rare
  for (let i = 0; i < n; i++) {
    const a = r() * TAU, d = Math.sqrt(r()) * rad;
    fx.emit({ glyph: 'twinkle', pal, x: x + Math.cos(a) * d, y: y + (r() - 0.3) * rad * (o.yk ?? 0.8), z: z + Math.sin(a) * d, vy: o.vy ?? 0.4, life: (o.life ?? 0.45) * (0.7 + r() * 0.6),
      size: (o.size ?? 1) * (0.8 + r() * 0.5), blend: o.blend ?? 1, gain: o.gain ?? 2.2, delay: r() * (o.delay ?? 0.15), fout: 0.2 });
  }
}
/** expanding pixel ring on the ground (built from segments, see FxGfx.ring) */
export function groundRing(fx, pal, x, z, r0, r1, life, o = {}) {
  const run = () => groundRingSegs(fx, pal, x, z, r0, r1, life, !!o.thick);
  if (o.delay) fx.later(o.delay, run); else run();
}
/** HD-2D style point light: a short coloured glow pooled on the ground + a small hot core (no big soft blobs). */
function light(fx, x, y, z, size, rgb, gain = 1.6, life = 0.2) { fx.pointLight(x, y, z, size, rgb, gain, life); }

// ------------------------------------------------------------------------------------------------ impacts per element
/**
 * Basic-attack / ability impact: fewer, bolder elements — a crisp opaque core burst (white-hot centre), 2–4 short-lived
 * element secondaries, a small coloured light pulse. s = scale, eff = 'super'|'weak'|null, (dx,dz) = hit direction.
 */
export function impact(fx, el, x, y, z, s = 1, dx = 1, dz = 0, eff = null, crit = false) {
  const r = fx.r, E = ELEMENT_PAL[el] || ELEMENT_PAL.fire;
  if (eff === 'weak') s *= 0.75; else if (eff === 'super') s *= 1.12;
  const again = fx.recentImpact(x, z);          // volleys / multi-hits on one spot: smaller echo, no extra debris
  if (again) s *= 0.65;
  const dirA = Math.atan2(dz, dx), core = (pal, size, rot = r() * 6.283) => fx.emit({ glyph: 'burst', pal, x, y, z, life: 0.14, size: size * s * 0.6, s1: size * s * 0.8, gain: 1.4, hot: 1.8, rot, fout: 0 });
  const sp2 = (glyph, pal, X, Y, Z, n, o) => { if (!again) spray(fx, glyph, pal, X, Y, Z, n, o); };
  switch (el) {
    case 'fire':
      core('fireHot', 1.5);
      sp2('ember', 'fire', x, y, z, 3 * s, { speed: 3.4 * s, up: 0.55, g: -1, life: 0.32, size: 1.1 * s, s1: 0.4, fps: 14, a0: dirA, arc: Math.PI * 1.2 });
      break;
    case 'water':
      fx.emit({ glyph: 'splash', pal: 'water', x, y: fx.gy(x, z) + 0.05, z, life: 0.22, size: 0.95 * s, s1: 1.1 * s, mode: 2, aV: 0.1, hot: 1.3 });
      sp2('drop', 'water', x, y, z, 3 * s, { speed: 2.6 * s, up: 1.1, g: 12, life: 0.36, size: 1.0 * s, a0: dirA, arc: Math.PI * 1.4 });
      break;
    case 'grass': {
      const a = r() * 0.6 - 0.3;
      fx.emit({ glyph: 'crescent', pal: 'grass', x, y, z, life: 0.13, size: 1.25 * s, s1: 1.45 * s, rot: dirA + a + 0.8, gain: 1.3, hot: 1.4 });
      sp2('leaf', 'grass', x, y, z, 3 * s, { speed: 2.4 * s, up: 0.8, g: 3, drag: 2.6, life: 0.45, size: 1.0 * s, fps: 12, frame: 'rand' });
      break;
    }
    case 'electric':
      core('electric', 1.4);
      for (let i = 0; i < 2; i++) fx.emit({ glyph: 'bolt', frame: (r() * 3) | 0, pal: 'electric', x, y, z, life: 0.09, size: 0.8 * s, rot: r() * 6.283, gain: 1.6, hot: 1.5, delay: i * 0.04 });
      break;
    case 'earth': {
      core('earth', 1.3);
      sp2('pebble', 'earth', x, y, z, 2 * s, { speed: 2.6 * s, up: 1.2, g: 16, life: 0.4, size: 1.0, frame: 'rand', drag: 0.5, fout: 0.4 });
      sp2('puff', 'dust', x, fx.gy(x, z) + 0.2, z, 2, { speed: 1.2, up: 0.15, life: 0.35, size: 1.0 * s, s1: 1.3 * s, drag: 3 });
      break;
    }
    case 'wind':
      fx.emit({ glyph: 'crescent', pal: 'wind', x, y, z, life: 0.14, size: 1.4 * s, s1: 1.65 * s, rot: dirA + 1.5708, gain: 1.35, hot: 1.4 });
      sp2('streak', 'wind', x, y, z, 3 * s, { speed: 6 * s, up: 0.05, life: 0.16, size: 1.2, align: true, a0: dirA + Math.PI, arc: 1.0 });
      break;
    default:
      core('white', 1.2);
  }
  light(fx, x, y, z, 1.2 * s, E.glow, 1.2, 0.12);
  // impact mark on the ground under the target (0.6 s): readable in stills, never over the body
  if (!again) fx.emit({ glyph: 'crack', frame: (r() * 2) | 0, pal: E.main, x, y: fx.gy(x, z) + 0.04, z, mode: 1, px: 0.8 * s, life: 0.6, fout: 0.45, gain: 1.0, hot: 1.0 });
  if (!again) for (let i = 0; i < 2; i++) { const a = r() * 6.283; fx.emit({ glyph: 'chip', frame: (r() * 3) | 0, fps: 16, pal: E.main, x: x + Math.cos(a) * 0.2, y: y + 0.1, z: z + Math.sin(a) * 0.2, vx: Math.cos(a) * 1.4, vy: 1.2, vz: Math.sin(a) * 1.4, g: 4, drag: 2, life: 0.28, size: 1.0, fout: 0.35 }); }   // sparks linger ~0.3 s
  if (eff === 'super') {
    if (!again) fx.emit({ glyph: 'starBig', pal: 'gold', x, y: y + 0.15, z, life: 0.3, size: 0.7, pop: 0.5, spin: 5, gain: 1.3, hot: 1.3 });
    if (!again) spray(fx, 'star', 'gold', x, y, z, 2, { speed: 3.4, up: 1.0, g: 7, life: 0.42, size: 1.0, spin: 10, rot: 'rand' });
    fx.shake(0.06, x, z);
  } else if (eff === 'weak') {
    fx.emit({ glyph: 'puff', pal: 'grey', x: x - dx * 0.5, y: fx.gy(x, z) + 0.2, z: z - dz * 0.5, vy: 0.3, life: 0.3, size: 0.8, s1: 1.0 });   // off the body
  }
  if (crit && !again) fx.emit({ glyph: 'burst', frame: 1, pal: 'gold', x, y, z, life: 0.14, size: 0.9 * s, s1: 1.1 * s, gain: 1.3, hot: 1.4, rot: r() * 6.283, fout: 0 });
}

// ------------------------------------------------------------------------------------------------ projectile styles
/** Build legacy PROJ_STYLES entries that draw pixel heads/trails through fx (registered by fx.js). */
const TOWER = [{ pal: 'teamBlue', rgb: [0.35, 0.62, 1] }, { pal: 'teamRed', rgb: [1, 0.38, 0.26] }, { pal: 'gold', rgb: [1, 0.85, 0.4] }];
export const towerLook = (team) => TOWER[team] || TOWER[2];
export function projectileStyles(fx) {
  const head = (V, v, glyph, pal, size, o = {}) => {
    const rot = fx.screenRot(v.dx, v.dy, v.dz);
    fx.gfx.now(glyph, (v.age * (o.fps || 12)) | 0, v.x, v.y, v.z, size, { rot, pal, gain: o.gain ?? 1.35, hot: 1.1 });
    if (o.glow && V.sprites && fx.FR) V.sprites.add(v.x, v.y, v.z, o.glowSize || size * 1.6, fx.FR.GLOW, o.glow, o.glowGain ?? 0.9, 0.85);
  };
  const trail = (v, every, fn) => { v.mtAcc = (v.mtAcc || 0) + (v.moved || 0); while (v.mtAcc > every) { v.mtAcc -= every; fn(); } };
  const big = (v) => { const u = fx.unit(v.src); return u && u.mtMon ? u.mtMon.stage : 0; };
  return {
    mt_fire_attack: {
      init() {}, update(V, v) {
        head(V, v, 'fireball', 'fire', 0.72, { glow: ELEMENT_PAL.fire.glow, glowSize: 0.9 });
        fx.groundLight(v.x, v.z, 1.1, ELEMENT_PAL.fire.glow, 0.7);
        trail(v, 0.22, () => fx.emit({ glyph: 'ember', pal: 'fire', x: v.x - v.dx * 0.15, y: v.y, z: v.z - v.dz * 0.15, vy: 0.7, life: 0.28, size: 0.55, s1: 0.15, fps: 14, fout: 0.3 }));
      }, end() {},
    },
    ember_volley: {
      init() {}, update(V, v) {
        const st = big(v), s = st >= 2 ? 1.25 : 1;
        head(V, v, 'fireball', 'fireHot', 0.9 * s, { glow: ELEMENT_PAL.fire.glow, glowGain: 1.0, glowSize: 1.0 });
        fx.groundLight(v.x, v.z, 1.3, ELEMENT_PAL.fire.glow, 0.8);
        trail(v, 0.18, () => {
          fx.emit({ glyph: 'ember', pal: 'fire', x: v.x - v.dx * 0.2, y: v.y, z: v.z - v.dz * 0.2, vy: 0.9, vx: (fx.r() - 0.5) * 0.6, vz: (fx.r() - 0.5) * 0.6, life: 0.35, size: 0.75 * s, s1: 0.2, fps: 14 });
        });
      }, end(V, v) { if (!v.mtHit) fx.fizzle('fire', v.x, v.y, v.z); },
    },
    mt_electric_attack: {
      init() {}, update(V, v) {
        head(V, v, 'zap', 'electric', 0.78, { fps: 24, glow: ELEMENT_PAL.electric.glow, glowGain: 1.0, glowSize: 0.9 });
        fx.groundLight(v.x, v.z, 1.1, ELEMENT_PAL.electric.glow, 0.7);
        trail(v, 0.7, () => fx.emit({ glyph: 'dot', frame: 1, pal: 'electric', x: v.x - v.dx * 0.25, y: v.y, z: v.z - v.dz * 0.25, life: 0.12, size: 1.2, blend: 1, gain: 2 }));
      }, end() {},
    },
    bubble_jet: {
      init() {}, update(V, v) {
        const s = big(v) >= 2 ? 1.3 : 1;
        fx.gfx.now('bubble', 0, v.x, v.y, v.z, 0.9 * s, { pal: 'foam', gain: 1.3 });
        fx.groundLight(v.x, v.z, 1.2, ELEMENT_PAL.water.glow, 0.7);
        fx.gfx.now('blob', 0, v.x, v.y, v.z, 0.5 * s, { pal: 'water', gain: 1.4, blend: 1, alpha: 0.6 });
        if (V.sprites && fx.FR) V.sprites.add(v.x, v.y, v.z, 1.2 * s, fx.FR.GLOW, ELEMENT_PAL.water.glow, 0.9, 0.8);
        trail(v, 0.16, () => {
          const r = fx.r;
          fx.emit({ glyph: 'bubble', frame: 0, pal: r() < 0.5 ? 'foam' : 'water', x: v.x + (r() - 0.5) * 0.4, y: v.y + (r() - 0.5) * 0.3, z: v.z + (r() - 0.5) * 0.4, vy: 0.6 + r() * 0.6, life: 0.5 + r() * 0.4, size: (0.25 + r() * 0.3) * s, drag: 1 });
          if (r() < 0.4) fx.emit({ glyph: 'drop', pal: 'water', x: v.x, y: v.y, z: v.z, vx: (r() - 0.5) * 2, vy: 1.5, vz: (r() - 0.5) * 2, g: 10, life: 0.4, size: 0.35 });
        });
      }, end(V, v) { if (!v.mtHit) fx.fizzle('water', v.x, v.y, v.z); },
    },
    vine_lash: {
      init() {}, update(V, v) {
        const u = fx.unit(v.src), a = u ? fx.unitWorld(u) : null;
        if (a) drawVine(fx, a.x, a.gy + a.h * 0.45, a.z, v.x, v.y, v.z, 1, v.age * 30);
        fx.gfx.now('thorn', 0, v.x, v.y, v.z, 0.42, { rot: fx.screenRot(v.dx, v.dy, v.dz) - Math.PI / 2, pal: 'leafAlt', gain: 1.3 });
        trail(v, 0.5, () => fx.emit({ glyph: 'leaf', fps: 10, pal: 'grass', x: v.x, y: v.y, z: v.z, vy: 0.4, g: 1.5, life: 0.5, size: 0.45, frame: (fx.r() * 4) | 0 }));
      }, end(V, v) { if (!v.mtHit) fx.fizzle('grass', v.x, v.y, v.z); },
    },
    tower_attack: {        // tower shot: charged team-coloured crystal bolt with a crisp pixel trail
      init(V, v) {
        const T = towerLook(v.team), m = v.muzzle || v;
        fx.emit({ glyph: 'burst', pal: T.pal, x: m.x, y: m.y, z: m.z, life: 0.12, size: 1.1, s1: 1.4, gain: 1.4, hot: 1.7, rot: fx.r() * 6.283 });
        fx.emit({ glyph: 'twinkle', pal: T.pal, x: m.x, y: m.y, z: m.z, life: 0.16, size: 2.2, blend: 1, gain: 2.4 });
        fx.pointLight(m.x, m.y, m.z, 1.4, T.rgb, 1.6, 0.16);
      },
      update(V, v) {
        const T = towerLook(v.team), rot = fx.screenRot(v.dx, v.dy, v.dz);
        fx.gfx.now('gem', 0, v.x, v.y, v.z, 1.0, { rot: rot - Math.PI / 2, pal: T.pal, gain: 1.45, hot: 1.8 });
        fx.gfx.now('twinkle', ((v.age * 20) | 0) & 3, v.x, v.y, v.z, 1.3, { pal: T.pal, blend: 1, gain: 2.4 });
        if (V.sprites && fx.FR) V.sprites.add(v.x, v.y, v.z, 1.5, fx.FR.GLOW, T.rgb, 0.8, 0.85);
        fx.groundLight(v.x, v.z, 1.2, T.rgb, 0.8);
        trail(v, 0.2, () => fx.emit({ glyph: 'chip', frame: (fx.r() * 3) | 0, pal: T.pal, x: v.x - v.dx * 0.3 + (fx.r() - 0.5) * 0.15, y: v.y - v.dy * 0.3, z: v.z - v.dz * 0.3, life: 0.2, size: 1.6, s1: 0.6 }));
      },
      end(V, v) {
        const T = towerLook(v.team), gy = fx.gy(v.x, v.z);
        fx.emit({ glyph: 'burst', pal: T.pal, x: v.x, y: v.y, z: v.z, life: 0.16, size: 1.15, s1: 1.45, gain: 1.3, hot: 1.5, rot: fx.r() * 6.283 });
        spray(fx, 'chip', T.pal, v.x, v.y, v.z, 5, { speed: 3.6, up: 0.9, g: 11, life: 0.32, size: 1.5, fps: 14, fout: 0.3 });
        fx.emit({ glyph: 'crack', frame: (fx.r() * 2) | 0, pal: 'ash', x: v.x, y: gy + 0.04, z: v.z, mode: 1, px: 1.2, life: 0.9, fout: 0.5, gain: 0.9 });
        fx.pointLight(v.x, v.y, v.z, 1.6, T.rgb, 1.7, 0.2);
      },
    },
    mt_sling_attack: {
      init() {}, update(V, v) {
        fx.gfx.now('pebble', (v.age * 10) | 0, v.x, v.y, v.z, 0.26, { pal: 'rock', gain: 1.2 });
        trail(v, 0.35, () => fx.emit({ glyph: 'dot', frame: 1, pal: 'dust', x: v.x, y: v.y, z: v.z, life: 0.18, size: 0.7, blend: 1, gain: 1 }));
      }, end() {},
    },
  };
}

// ------------------------------------------------------------------------------------------------ abilities
/** cast anticipation (MONSTER_CAST) at the caster */
export function castFlash(fx, el, x, y, z, s = 1) {
  const E = ELEMENT_PAL[el] || ELEMENT_PAL.fire;
  fx.emit({ glyph: 'ring', frame: 0, pal: E.main, x, y, z, px: 1.6 * s, s0: 1.4, s1: 0.2, life: 0.18, blend: 1, gain: 2 });
  twinkles(fx, E.main, x, y, z, 4, 0.5 * s, { size: 0.9, life: 0.3 });
  light(fx, x, y, z, 1.6 * s, E.glow, 1.4, 0.18);
}

const stageOf = (u) => (u && u.mtMon ? u.mtMon.stage : 0);
const posOf = (fx, id, x, z) => { const u = fx.unit(id); if (u) return fx.unitWorld(u); if (!Number.isFinite(x)) return null; const gy = fx.gy(x, z); return { x, z, gy, y: gy + 0.7, h: 1.2 }; };

/**
 * Per ability: cast(fx, u, ev) on mt_monster_cast · fx[kind](fx, ev, src) on legacy FX kinds of that ability ·
 * hit(fx, h, p, eff, src, tgt) on mt_hit (source 'ability') · projectile looks live in projectileStyles().
 */
export const ABILITY = {
  // ---------------------------------------------------------------- FIRE
  ember_volley: {
    cast(fx, u) { const p = fx.unitWorld(u); if (!p) return; castFlash(fx, 'fire', p.x, p.y + p.h * 0.1, p.z, 1.1); fx.sfx('volley', p.x, p.z); },
    fx: {
      cone(fx, ev, src) {
        const p = src ? fx.unitWorld(src) : null; if (!p) return;
        const a = Math.atan2(ev.ty - p.z, ev.tx - p.x);
        spray(fx, 'ember', 'fireHot', p.x + Math.cos(a) * 0.4, p.y, p.z + Math.sin(a) * 0.4, 7, { speed: 4.5, up: 0.25, a0: a, arc: 0.9, life: 0.3, size: 0.7, s1: 0.2, fps: 14, drag: 4 });
        light(fx, p.x + Math.cos(a) * 0.5, p.y, p.z + Math.sin(a) * 0.5, 2.2, [1, 0.5, 0.15], 2, 0.16);
      },
    },
    hit(fx, h, p, eff, src) { impact(fx, 'fire', p.x, p.y, p.z, stageOf(src) >= 2 ? 1.3 : 1.12, h.dx, h.dz, eff, h.crit); },
  },
  flame_pillar: {
    cast(fx, u) { const p = fx.unitWorld(u); if (p) castFlash(fx, 'fire', p.x, p.y, p.z, 0.9); },
    fx: {
      aoe_telegraph(fx, ev) {
        const x = ev.x, z = ev.y, R = ev.radius || 2.5, dur = ev.duration || 0.6, gy = fx.gy(x, z) + 0.05;
        fx.tele(x, z, R, dur);
        fx.task(dur, (k) => {
          fx.gfx.ring(x, gy, z, R * (1.1 - 0.1 * k), { pal: 'fire', gain: 1.4 + k * 1.6, rot: k * 1.5, thick: k > 0.6 });
          fx.gfx.shade(x, gy, z, R * 1.2, 0.18 * k, 0.5);
          if (fx.r() < 0.55 * fx.q) { const a = fx.r() * TAU, d = Math.sqrt(fx.r()) * R * 0.9; fx.emit({ glyph: 'ember', pal: 'fire', x: x + Math.cos(a) * d, y: gy + 0.1, z: z + Math.sin(a) * d, vy: 1.4 + k * 2.5, life: 0.4, size: 0.55, s1: 0.2, fps: 14 }); }
        });
        fx.sfx('telegraph', x, z);
      },
      aoe_burst(fx, ev, src) {
        const x = ev.x, z = ev.y, R = ev.radius || 2.5, gy = fx.gy(x, z), fin = stageOf(src) >= 2;
        // light pillar core (additive) + roaring pixel flames rising out of it
        fx.emit({ glyph: 'pillar', pal: 'fireHot', x, y: gy, z, mode: 2, aV: 0, px: R * 1.1, s0: 1, s1: 0.5, life: 0.45, blend: 1, gain: 2.6, fout: 0.6 });
        const n = Math.round(9 * fx.q);
        for (let i = 0; i < n; i++) {
          const a = fx.r() * TAU, d = fx.r() * R * 0.45;
          fx.emit({ glyph: 'flame', pal: i % 3 ? 'fire' : 'fireHot', x: x + Math.cos(a) * d, y: gy + 0.05, z: z + Math.sin(a) * d, vy: 4 + fx.r() * 4, drag: 2.2, life: 0.5 + fx.r() * 0.25,
            size: 1.5 + fx.r() * 0.8, s1: 0.6, fps: 16, frame: (fx.r() * 4) | 0, mode: 2, aV: 0.1, delay: fx.r() * 0.08, hot: 1.4, gain: 1.45, flip: fx.r() < 0.5 });
        }
        const m = Math.round(16 * fx.q);
        for (let i = 0; i < m; i++) { const a = i / m * TAU; fx.emit({ glyph: 'ember', pal: 'fire', x: x + Math.cos(a) * 0.5, y: gy + 0.05, z: z + Math.sin(a) * 0.5, vx: Math.cos(a) * R * 2.6, vz: Math.sin(a) * R * 2.6, drag: 3.6, life: 0.45, size: 1.2, s1: 0.4, fps: 14, mode: 2, aV: 0.05, gain: 1.4 }); }
        spray(fx, 'ember', 'fireHot', x, gy + 0.8, z, 6, { speed: 3.5, up: 1.6, g: 3, life: 0.5, size: 0.8, s1: 0.3, fps: 12 });
                fx.gfx.ring(x, gy + 0.06, z, R, { pal: 'fireHot', gain: 2.4, thick: true });
        groundRingSegs(fx, 'fire', x, z, R * 0.4, R * 1.25, 0.4);
        light(fx, x, gy + 1.2, z, R * 1.1, [1, 0.5, 0.15], 1.6, 0.22);
        fx.wave(x, z, R * 1.15, [1, 0.5, 0.15], 0.45);
        fx.emit({ glyph: 'crack', frame: 1, pal: 'fire', x, y: gy + 0.04, z, mode: 1, px: R * 1.5, life: fin ? 1.2 : 0.8, fout: 0.5, gain: 1.1 });
        fx.shake(0.2, x, z);
        fx.sfx('pillar', x, z, { power: 1 });
      },
    },
    hit(fx, h, p, eff) { impact(fx, 'fire', p.x, p.y, p.z, 0.75, h.dx, h.dz, eff, h.crit); },
  },
  // ---------------------------------------------------------------- WATER
  bubble_jet: {
    cast(fx, u) { const p = fx.unitWorld(u); if (!p) return; castFlash(fx, 'water', p.x, p.y, p.z); fx.sfx('bubbles', p.x, p.z); },
    fx: { line_telegraph(fx, ev) { fx.lineTele(ev.x, ev.y, ev.tx, ev.ty, ev.width || 1.4, 0.25); } },
    hit(fx, h, p, eff, src) { impact(fx, 'water', p.x, p.y, p.z, stageOf(src) >= 2 ? 1.45 : 1.3, h.dx, h.dz, eff, h.crit); },
  },
  tidal_mend: {
    cast(fx, u) { const p = fx.unitWorld(u); if (p) castFlash(fx, 'water', p.x, p.y, p.z, 1.1); },
    fx: {
      buff(fx, ev, src) {
        const u = src, p = u ? fx.unitWorld(u) : null; if (!p) return;
        const n = Math.round(12 * fx.q);
        for (let i = 0; i < n; i++) { const a = i / n * TAU; fx.emit({ glyph: 'drop', pal: 'water', x: p.x + Math.cos(a) * 0.5, y: p.gy + 0.1, z: p.z + Math.sin(a) * 0.5, vx: Math.cos(a) * 1.3, vy: 5 + fx.r() * 1.5, vz: Math.sin(a) * 1.3, g: 12, life: 0.85, size: 0.65 }); }
        fx.emit({ glyph: 'pillar', pal: 'water', x: p.x, y: p.gy, z: p.z, mode: 2, aV: 0, px: 1.3, s0: 1.4, s1: 0.6, life: 0.4, blend: 1, gain: 1.6 });
        groundRingSegs(fx, 'water', p.x, p.z, 0.4, 2.2, 0.5);
        for (let i = 0; i < Math.round(6 * fx.q); i++) fx.emit({ glyph: 'plus', pal: 'heal', x: p.x + (fx.r() - 0.5) * 1.2, y: p.gy + 0.3 + fx.r() * p.h, z: p.z + (fx.r() - 0.5) * 1.2, vy: 1.2, life: 0.9, size: 0.6, pop: 0.5, delay: fx.r() * 0.35 });
        light(fx, p.x, p.gy + p.h * 0.5, p.z, 2.6, [0.3, 0.7, 1], 1.6, 0.35);
        fx.shieldBubble(u.id, ev.duration || 4, 'foam');
        fx.sfx('heal', p.x, p.z); fx.sfx('shield', p.x, p.z);
      },
      aoe_burst(fx, ev, src) {     // Final: splash heal for allies — tidal ring
        const p = src ? fx.unitWorld(src) : null; if (!p) return;
        const R = Math.max(2.5, (ev.radius || 3) * 2);
        fx.wave(p.x, p.z, R, [0.3, 0.65, 1], 0.6);
        const m = Math.round(20 * fx.q);
        for (let i = 0; i < m; i++) { const a = i / m * TAU; fx.emit({ glyph: 'splash', frame: 1, pal: 'water', x: p.x + Math.cos(a), y: p.gy + 0.05, z: p.z + Math.sin(a), vx: Math.cos(a) * R * 1.6, vz: Math.sin(a) * R * 1.6, drag: 2.4, life: 0.6, size: 0.55, mode: 2, aV: 0.1, delay: 0.08 }); }
      },
    },
  },
  // ---------------------------------------------------------------- GRASS
  vine_lash: {
    cast(fx, u) { const p = fx.unitWorld(u); if (p) { castFlash(fx, 'grass', p.x, p.y, p.z, 0.9); fx.sfx('vine', p.x, p.z); } },
    fx: {
      tether(fx, ev, src) {     // vine holds the target while it is pulled in
        const sid = src ? src.id : -1, tid = ev.tgt, dur = ev.duration || 0.6;
        fx.task(dur, (k) => {
          const a = fx.unitWorld(fx.unit(sid)), b = fx.unitWorld(fx.unit(tid)); if (!a || !b) return false;
          drawVine(fx, a.x, a.gy + a.h * 0.45, a.z, b.x, b.gy + b.h * 0.45, b.z, 1, k * 20);
        });
      },
      pull(fx, ev) { const p = posOf(fx, ev.tgt, ev.x, ev.y); if (p) spray(fx, 'leaf', 'grass', p.x, p.y, p.z, 6, { speed: 2.6, up: 0.7, g: 2, life: 0.8, size: 0.55, fps: 10, frame: 'rand' }); },
    },
    hit(fx, h, p, eff) { impact(fx, 'grass', p.x, p.y, p.z, 1.15, h.dx, h.dz, eff, h.crit); },
  },
  thorn_bulwark: {
    cast(fx, u) { const p = fx.unitWorld(u); if (p) castFlash(fx, 'grass', p.x, p.y, p.z, 1.1); },
    fx: {
      buff(fx, ev, src) {
        const u = src, p = u ? fx.unitWorld(u) : null; if (!p) return;
        const n = Math.round(10 * fx.q);
        for (let i = 0; i < n; i++) { const a = i / n * TAU; fx.emit({ glyph: 'thorn', pal: i % 2 ? 'grass' : 'leafAlt', x: p.x + Math.cos(a) * 0.85, y: p.gy, z: p.z + Math.sin(a) * 0.85, life: 0.75, size: 1.15, pop: 0.6, mode: 2, aV: 0, fout: 0.4, follow: u.id }); }
        groundRingSegs(fx, 'grass', p.x, p.z, 0.4, 1.8, 0.45, true);
        spray(fx, 'leaf', 'grass', p.x, p.gy + p.h * 0.5, p.z, 8, { speed: 2.6, up: 0.6, g: 1.6, life: 0.9, size: 0.6, fps: 10, frame: 'rand' });
        light(fx, p.x, p.gy + p.h * 0.5, p.z, 2.2, [0.35, 0.95, 0.3], 1.4, 0.3);
        fx.hexShell(u.id, ev.duration || 4, 'grass');
        fx.sfx('thorns', p.x, p.z); fx.sfx('shield', p.x, p.z);
      },
      aoe_burst(fx, ev, src) {     // Final: taunt pulse
        const p = src ? fx.unitWorld(src) : null; if (!p) return;
        const R = ev.radius || 4;
        fx.emit({ glyph: 'bang', pal: 'rally', x: p.x, y: p.gy + p.h + 0.45, z: p.z, life: 0.9, size: 1.3, pop: 0.8, follow: src.id, fout: 0.3 });
        groundRingSegs(fx, 'rally', p.x, p.z, 0.6, R, 0.55, true);
        fx.wave(p.x, p.z, R, [1, 0.45, 0.2], 0.5);
      },
    },
    hit(fx, h, p) { if (h.source === 'reflect') fx.emit({ glyph: 'thorn', pal: 'grass', x: p.x, y: p.y, z: p.z, life: 0.25, size: 0.6, pop: 0.5, rot: fx.r() * TAU }); },
  },
  // ---------------------------------------------------------------- ELECTRIC
  spark_bolt: {
    cast(fx, u) { const p = fx.unitWorld(u); if (!p) return; castFlash(fx, 'electric', p.x, p.y + p.h * 0.1, p.z, 1); fx.sfx('zap', p.x, p.z); },
    fx: {
      beam(fx, ev, src) {
        const a = ev.x === (src && src.x) && ev.y === (src && src.y) && src ? fx.unitWorld(src) : (posOf(fx, -1, ev.x, ev.y));
        const fromU = src && Math.abs(ev.x - src.x) < 0.01 && Math.abs(ev.y - src.y) < 0.01;
        const A = fromU ? fx.unitWorld(src) : (fx.findUnitAt(ev.x, ev.y) ? fx.unitWorld(fx.findUnitAt(ev.x, ev.y)) : a);
        const B = posOf(fx, ev.tgt, ev.tx, ev.ty); if (!A || !B) return;
        fx.bolt(A.x, A.gy + A.h * 0.6, A.z, B.x, B.gy + B.h * 0.55, B.z, stageOf(src) >= 2 ? 1.2 : 1, 0);
      },
      impact(fx, ev, src) { const p = posOf(fx, ev.tgt, ev.x, ev.y); if (p) impact(fx, 'electric', p.x, p.y, p.z, 0.8 + 0.4 * (ev.power ?? 1), 1, 0, null, false); fx.sfx('hit_electric', ev.x, ev.y); void src; },
    },
    hit(fx, h, p, eff) { if (eff) impact(fx, 'electric', p.x, p.y, p.z, 0.6, h.dx, h.dz, eff, false); },
  },
  static_dash: {
    cast(fx, u) { const p = fx.unitWorld(u); if (p) castFlash(fx, 'electric', p.x, p.y, p.z, 1.2); },
    fx: {
      dash(fx, ev, src) {
        if (!src) return; const id = src.id;
        fx.sfx('dash', src.x, src.y);
        fx.task(0.4, () => {
          const q = fx.unitWorld(fx.unit(id)); if (!q) return false;
          fx.emit({ glyph: 'zap', pal: 'electric', x: q.x + (fx.r() - 0.5) * 0.4, y: q.gy + q.h * (0.3 + fx.r() * 0.5), z: q.z + (fx.r() - 0.5) * 0.4, life: 0.2, size: 0.75, fps: 20 });
          fx.emit({ glyph: 'twinkle', pal: 'electric', x: q.x, y: q.gy + q.h * 0.5, z: q.z, life: 0.22, size: 1.2, blend: 1, gain: 2.4 });
          if (!q.u.dash) return false;
        });
      },
      impact(fx, ev) { const p = posOf(fx, ev.tgt, ev.x, ev.y); if (p) { impact(fx, 'electric', p.x, p.y, p.z, 1.3, 1, 0, null, false); fx.sfx('zap', p.x, p.z); } },
      dash_end(fx, ev, src) { const p = src ? fx.unitWorld(src) : posOf(fx, -1, ev.x, ev.y); if (!p) return; groundRingSegs(fx, 'electric', p.x, p.z, 0.3, 1.8, 0.3); twinkles(fx, 'electric', p.x, p.y, p.z, 5, 0.6); },
    },
    hit(fx, h, p, eff) { if (eff) impact(fx, 'electric', p.x, p.y, p.z, 0.6, h.dx, h.dz, eff, false); },
  },
  // ---------------------------------------------------------------- EARTH
  rock_slam: {
    cast(fx, u) { const p = fx.unitWorld(u); if (p) spray(fx, 'pebble', 'earth', p.x, p.gy + 0.1, p.z, 5, { speed: 1.2, up: 2.5, g: 14, life: 0.5, size: 0.8, frame: 'rand' }); },
    fx: {
      aoe_burst(fx, ev, src) {
        const p = src ? fx.unitWorld(src) : null; const x = p ? p.x : ev.x, z = p ? p.z : ev.y, gy = fx.gy(x, z), R = ev.radius || 2;
        fx.emit({ glyph: 'crack', frame: 0, pal: 'earth', x, y: gy + 0.04, z, mode: 1, px: R * 1.6, life: 1.4, fout: 0.4, gain: 1.0, pop: 0.2 });
        const n = Math.round(4 * fx.q * R / 2);
        for (let i = 0; i < n; i++) { const a = fx.r() * TAU, d = 0.3 + fx.r() * R * 0.6; fx.emit({ glyph: 'rock', frame: (fx.r() * 3) | 0, pal: 'earth', x: x + Math.cos(a) * d, y: gy + 0.1, z: z + Math.sin(a) * d, vx: Math.cos(a) * 1.5, vy: 5 + fx.r() * 2, vz: Math.sin(a) * 1.5, g: 18, spin: (fx.r() - 0.5) * 14, life: 0.55, size: 0.9, fout: 0.35 }); }
        const m = Math.round(8 * fx.q);
        for (let i = 0; i < m; i++) { const a = i / m * TAU; fx.emit({ glyph: 'puff', pal: 'dust', x: x + Math.cos(a) * 0.5, y: gy + 0.25, z: z + Math.sin(a) * 0.5, vx: Math.cos(a) * R * 3, vz: Math.sin(a) * R * 3, vy: 0.2, drag: 4, life: 0.45, size: 1.3, s1: 1.7 }); }
        groundRingSegs(fx, 'dust', x, z, 0.4, R * 1.1, 0.35, true);
        fx.wave(x, z, R * 1.2, [0.9, 0.7, 0.45], 0.45);
        fx.fissure(x, z, R);
        light(fx, x, gy + 0.6, z, R * 0.9, [1, 0.7, 0.4], 0.9, 0.14);
        fx.shake(R > 2.5 ? 0.4 : 0.28, x, z);
        fx.sfx('slam', x, z);
      },
    },
  },
  quake_charge: {
    fx: {
      dash(fx, ev, src) {
        if (!src) return; const id = src.id; fx.sfx('dash', src.x, src.y);
        fx.task(0.6, () => {
          const q = fx.unitWorld(fx.unit(id)); if (!q) return false;
          fx.emit({ glyph: 'puff', pal: 'dust', x: q.x + (fx.r() - 0.5) * 0.5, y: q.gy + 0.2, z: q.z + (fx.r() - 0.5) * 0.5, vy: 0.5, life: 0.5, size: 0.9, s1: 1.4 });
          if (fx.r() < 0.5) fx.emit({ glyph: 'pebble', frame: (fx.r() * 2) | 0, pal: 'earth', x: q.x, y: q.gy + 0.2, z: q.z, vx: (fx.r() - 0.5) * 3, vy: 3, vz: (fx.r() - 0.5) * 3, g: 14, life: 0.5, size: 0.8, bounce: 0.3 });
          if (!q.u.dash) return false;
        });
        fx.task(4, () => {       // +80 % vs structures for 4 s: orange chevrons rising
          const q = fx.unitWorld(fx.unit(id)); if (!q) return false;
          if (fx.r() < 0.12 * fx.q) fx.emit({ glyph: 'chevron', pal: 'rally', x: q.x + (fx.r() - 0.5) * 0.8, y: q.gy + 0.3, z: q.z + (fx.r() - 0.5) * 0.8, vy: 1.6, life: 0.6, size: 0.55, fout: 0.4 });
        });
      },
      aoe_burst(fx, ev, src) {
        const p = src ? fx.unitWorld(src) : null; const x = p ? p.x : ev.x, z = p ? p.z : ev.y, gy = fx.gy(x, z);
        impact(fx, 'earth', x, gy + 0.6, z, 1.5, 1, 0, null, false);
        fx.emit({ glyph: 'crack', frame: 1, pal: 'earth', x, y: gy + 0.04, z, mode: 1, px: 2.8, life: 1.1, fout: 0.4 });
        fx.wave(x, z, 2.2, [0.9, 0.7, 0.45], 0.4);
        fx.shake(0.22, x, z); fx.sfx('slam', x, z);
      },
    },
    hit(fx, h, p, eff) { impact(fx, 'earth', p.x, p.y, p.z, 0.7, h.dx, h.dz, eff, h.crit); },
  },
  // ---------------------------------------------------------------- WIND
  gale_slash: {
    cast(fx, u) { const p = fx.unitWorld(u); if (p) castFlash(fx, 'wind', p.x, p.y, p.z, 1); },
    fx: {
      dash(fx, ev, src) {
        if (!src) return; const id = src.id; fx.sfx('dash', src.x, src.y);
        fx.task(0.35, () => {
          const q = fx.unitWorld(fx.unit(id)); if (!q) return false;
          for (let i = 0; i < 2; i++) fx.emit({ glyph: 'streak', pal: 'wind', x: q.x + (fx.r() - 0.5) * 0.5, y: q.gy + q.h * (0.25 + fx.r() * 0.6), z: q.z + (fx.r() - 0.5) * 0.5, life: 0.22, size: 1.2, blend: 1, gain: 2.2 });
          if (!q.u.dash) return false;
        });
      },
      dash_end(fx, ev, src) {
        const p = src ? fx.unitWorld(src) : posOf(fx, -1, ev.x, ev.y); if (!p) return;
        fx.emit({ glyph: 'slashX', pal: 'wind', x: p.x, y: p.y, z: p.z, life: 0.2, size: 1.3, s1: 1.6, gain: 1.5, rot: 0.2 });
        fx.sfx('slash', p.x, p.z);
      },
      impact(fx, ev) {       // Final: second cut
        const p = posOf(fx, ev.tgt, ev.x, ev.y); if (!p) return;
        fx.emit({ glyph: 'slashX', pal: 'white', x: p.x, y: p.y + 0.1, z: p.z, life: 0.2, size: 1.45, s1: 1.8, gain: 1.6, rot: 0.95 });
        impact(fx, 'wind', p.x, p.y, p.z, 1.1, -1, 0, null, false); fx.sfx('slash', p.x, p.z, { key: '2' });
      },
      reset(fx, ev, src) {
        const p = src ? fx.unitWorld(src) : null; if (!p) return;
        groundRingSegs(fx, 'wind', p.x, p.z, 1.6, 0.3, 0.3); twinkles(fx, 'wind', p.x, p.y, p.z, 8, 0.8); fx.sfx('sparkle', p.x, p.z);
      },
    },
    hit(fx, h, p, eff) { impact(fx, 'wind', p.x, p.y, p.z, 1.05, h.dx, h.dz, eff, h.crit); },
  },
  cyclone: {
    cast(fx, u) { const p = fx.unitWorld(u); if (p) castFlash(fx, 'wind', p.x, p.y, p.z, 1.2); },
    fx: {
      aoe_burst(fx, ev, src) {
        if (!src) return; const id = src.id, fin = stageOf(src) >= 2, R = ev.radius || 2.5;
        const p = fx.unitWorld(src); if (!p) return;
        fx.sfx('cyclone', p.x, p.z, { duration: 2 });
        fx.task(2.05, (k) => {
          const q = fx.unitWorld(fx.unit(id)); if (!q) return false;
          const n = fx.q >= 1 ? 3 : 2;
          for (let i = 0; i < n; i++) {
            const g = fx.r(), glyph = g < 0.55 ? 'streak' : g < 0.8 ? 'leaf' : 'pebble';
            fx.emit({ glyph, pal: glyph === 'leaf' ? 'grass' : glyph === 'pebble' ? 'dust' : 'wind', x: q.x, y: q.gy, z: q.z, life: 0.6, size: glyph === 'streak' ? 1.3 : 0.6, fps: 12,
              blend: glyph === 'streak' ? 1 : 0, gain: 2, align: glyph === 'streak',
              orbit: { cx: q.x, cz: q.z, cy: q.gy + 0.1 + fx.r() * 0.4, r0: fin ? R * 1.05 : R * 0.7, r1: fin ? R * 0.25 : R * 0.95, w: 7 + fx.r() * 3, a: fx.r() * TAU, vy: 1.4 + fx.r() * 1.2 }, follow: id });
          }
          fx.gfx.ring(q.x, q.gy + 0.07, q.z, R * (0.95 + 0.05 * Math.sin(k * 30)), { pal: 'wind', gain: 0.9, rot: -k * 14, dash: true, alpha: 0.75 * Math.min(1, (1 - k) * 4) });
        });
      },
      zone_tick(fx, ev, src) { const p = src ? fx.unitWorld(src) : null; if (p) fx.emit({ glyph: 'swirl', pal: 'wind', x: p.x, y: p.gy + p.h * 0.6, z: p.z, life: 0.3, size: 1.6, s1: 2.2, fps: 18, gain: 1.3 }); },
    },
    hit(fx, h, p, eff) { if (eff || fx.r() < 0.5) impact(fx, 'wind', p.x, p.y, p.z, 0.6, h.dx, h.dz, eff, false); },
  },
};

/** Expanding ring of pixel segments on the ground (r0 -> r1 over life). */
export function groundRingSegs(fx, pal, x, z, r0, r1, life, thick = false) {
  const gy = fx.gy(x, z) + 0.06;
  fx.task(life, (k) => { const e = 1 - Math.pow(1 - k, 2.2); fx.gfx.ring(x, gy, z, r0 + (r1 - r0) * e, { pal, thick, gain: 2.2 * (1 - k * 0.6), alpha: k > 0.6 ? (1 - k) / 0.4 : 1, rot: k * 0.6 }); });
}

/** draw a vine between two points this frame */
export function drawVine(fx, x0, y0, z0, x1, y1, z1, ext = 1, phase = 0) {
  const len = Math.hypot(x1 - x0, y1 - y0, z1 - z0), seg = 0.42, n = Math.max(2, Math.ceil(len / seg)), rot = fx.screenRot(x1 - x0, y1 - y0, z1 - z0);
  const m = Math.ceil(n * ext);
  for (let i = 0; i < m; i++) {
    const t = (i + 0.5) / n, wob = Math.sin(t * 9 + phase) * 0.1 * (1 - t);
    fx.gfx.now('vine', (i + (phase | 0)) & 1, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + wob, z0 + (z1 - z0) * t, seg * 1.3, { rot, pal: 'grass', gain: 1.25 });
  }
}

// ------------------------------------------------------------------------------------------------ fields & statuses
/** mt_field start: persistent ground field visuals (Final Flame Pillar, Final Static Dash trail, Magic Surge field). */
export function field(fx, ev) {
  const dur = Math.max(0.3, ev.duration || 2), el = ev.element || 'fire', E = ELEMENT_PAL[el] || ELEMENT_PAL.fire, R = ev.radius || 2;
  const seg = Number.isFinite(ev.x2);
  const surge = ev.ability === 'surge_field';
  if (seg) {        // charged trail segment
    const x0 = ev.x, z0 = ev.y, x1 = ev.x2, z1 = ev.y2, L = Math.hypot(x1 - x0, z1 - z0), rot = Math.atan2(-(z1 - z0), x1 - x0);
    fx.task(dur, (k) => {
      const n = Math.max(1, Math.round(L / 0.45)), fade = k > 0.8 ? (1 - k) / 0.2 : 1;
      for (let i = 0; i < n; i++) { const t = (i + 0.5) / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t; fx.gfx.now('streak', 0, x, fx.gy(x, z) + 0.07, z, (L / n) * 1.3, { pal: E.main, mode: 1, rot, blend: 1, gain: 1.4 + 0.6 * Math.sin(k * 50 + i), alpha: fade }); }
      if (fx.r() < 0.9 * fx.q) { const t = fx.r(), x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t; fx.emit({ glyph: 'zap', pal: E.main, x: x + (fx.r() - 0.5) * R, y: fx.gy(x, z) + 0.2, z: z + (fx.r() - 0.5) * R, life: 0.16, size: 0.75, fps: 22 }); }
    });
    return;
  }
  const x = ev.x, z = ev.y, gy = fx.gy(x, z);
  const glyph = { fire: 'ember', water: 'bubble', grass: 'leaf', electric: 'zap', earth: 'pebble', wind: 'streak' }[el] || 'twinkle';
  fx.task(dur, (k) => {
    const fade = k > 0.85 ? (1 - k) / 0.15 : Math.min(1, k * 6);
    fx.gfx.ring(x, gy + 0.06, z, R, { pal: surge ? 'arcane' : E.main, gain: 1.4 * fade, rot: k * 2, thick: true, alpha: fade });
    if (surge) fx.gfx.ring(x, gy + 0.06, z, R * 0.92, { pal: E.main, gain: 1.2 * fade, rot: -k * 3, dash: true, alpha: fade });
    fx.gfx.shade(x, gy, z, R * 1.05, 0.12 * fade, 0.6);
    if (fx.r() < 1.2 * fx.q) {
      const a = fx.r() * TAU, d = Math.sqrt(fx.r()) * R * 0.9, px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d;
      if (el === 'fire') fx.emit({ glyph: fx.r() < 0.25 ? 'flame' : 'ember', pal: fx.r() < 0.3 ? 'fireHot' : 'fire', x: px, y: gy + 0.05, z: pz, vy: 0.8, life: 0.55, size: 0.9 + fx.r() * 0.5, s1: 0.3, fps: 12, mode: 2, aV: 0.05, frame: (fx.r() * 4) | 0 });
      else fx.emit({ glyph, frame: glyph === 'bubble' ? 0 : undefined, fps: 12, pal: E.main, x: px, y: gy + 0.15, z: pz, vy: 0.7, life: 0.5, size: 0.6, align: glyph === 'streak', vx: glyph === 'streak' ? 2 : 0 });
    }
  });
}

/** mt_status visuals not covered by the ability recipes (stun stars, roots, burns, slows, knock-ups, taunts). */
export function status(fx, ev) {
  const u = fx.unit(ev.tgt); if (!u || !fx.unitVisible(u)) return;
  const p = fx.unitWorld(u); if (!p) return;
  const dur = Math.max(0.2, Math.min(6, ev.duration || 0.6)), id = u.id;
  switch (ev.status) {
    case 'stun':
      for (let i = 0; i < 3; i++) fx.emit({ glyph: 'star', pal: 'gold', x: p.x, y: p.gy, z: p.z, life: dur, size: 0.42, spin: 6, hot: 1.2, fout: 0.2,
        orbit: { cx: p.x, cz: p.z, cy: p.gy + p.h + 0.2, r0: 0.38, r1: 0.38, w: 7, a: i / 3 * TAU, vy: 0 }, follow: id });
      break;
    case 'root': {
      const n = Math.round(6 * fx.q);
      for (let i = 0; i < n; i++) { const a = i / n * TAU + 0.3; fx.emit({ glyph: 'thorn', pal: i % 2 ? 'grass' : 'leafAlt', x: p.x + Math.cos(a) * 0.55, y: p.gy, z: p.z + Math.sin(a) * 0.55, life: dur, size: 0.8 + fx.r() * 0.3, pop: 0.5, mode: 2, aV: 0, fout: 0.2, delay: i * 0.02, follow: id }); }
      fx.emit({ glyph: 'vine', frame: 0, pal: 'grass', x: p.x, y: p.gy + 0.25, z: p.z, life: dur, size: 1.0, follow: id, fout: 0.2, pop: 0.3 });
      fx.emit({ glyph: 'vine', frame: 1, pal: 'grass', x: p.x, y: p.gy + 0.5, z: p.z, life: dur, size: 0.9, rot: 0.5, follow: id, fout: 0.2, pop: 0.3 });
      break;
    }
    case 'slow': {
      if (!fx.once('slow' + id, 0.5)) break;
      const n = Math.round(5 * fx.q), pal = ev.ability === 'static_dash' ? 'electric' : 'foam', glyph = ev.ability === 'static_dash' ? 'zap' : 'bubble';
      for (let i = 0; i < n; i++) fx.emit({ glyph, frame: glyph === 'bubble' ? 0 : undefined, fps: 18, pal, x: p.x, y: p.gy, z: p.z, life: dur, size: 0.35, fout: 0.3,
        orbit: { cx: p.x, cz: p.z, cy: p.gy + 0.25 + (i % 2) * 0.2, r0: 0.62, r1: 0.5, w: 2.4, a: i / n * TAU, vy: 0.05 }, follow: id });
      break;
    }
    case 'knockup':
      spray(fx, 'puff', 'dust', p.x, p.gy + 0.15, p.z, 5, { speed: 1.6, up: 0.2, life: 0.5, size: 0.8, s1: 1.2, drag: 3 });
      break;
    case 'taunt':
      fx.emit({ glyph: 'bang', pal: 'rally', x: p.x, y: p.gy + p.h + 0.3, z: p.z, life: Math.min(1.2, dur), size: 0.8, pop: 0.7, follow: id, fout: 0.3 });
      break;
    case 'burn':
      if (!fx.once('burn' + id, 0.9)) break;
      fx.task(Math.min(3, dur), () => { const q = fx.unitWorld(fx.unit(id)); if (!q) return false; if (fx.r() < 0.25 * fx.q) fx.emit({ glyph: 'ember', pal: 'fire', x: q.x + (fx.r() - 0.5) * q.h * 0.6, y: q.gy + fx.r() * q.h * 0.8, z: q.z, vy: 1.2, life: 0.4, size: 0.5, s1: 0.15, fps: 14 }); });
      break;
    case 'cleanse':
      twinkles(fx, 'white', p.x, p.y, p.z, 6, 0.6);
      break;
  }
}
