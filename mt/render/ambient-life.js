// mt/render/ambient-life.js — the behaviours of the ambient-life layer (see ambient.js for the frame / budget side).
// Owner: world animation / ambient-life artist. Render-only, own PRNG (S.r), own clock (S.t).
//
// Modules (each: update(dt), draw(), reset(), count()):
//   butterflies   meadows off the lanes; flutter (4-frame flap + bob), wander around a home spot, flee units
//   birds         small sparrow flocks fly in and land, peck / hop / look; the whole flock bursts into the air when a
//                 unit (minion, monster, trainer) comes close or a fight starts nearby
//   dragonflies   hover-and-dart over the river shallows
//   fish          koi leaping out of the river (splash, ripple rings, droplets) + "rising fish" rings
//   water         sun glints (only on sunlit water) and drifting caustic dashes along the current
//   falls         foam at the waterfall lips, mist rising from the drop, spray glints
//   air           leaves falling from the canopy (land and lie for a moment), meadow petals, pollen in sunbeams
//   fireflies     blinking motes around crystals / lanterns and in jungle shade (fade out in sunlight)
//   habitats      embers (fire), conductor-stone arcs (electric), pond bubbles (water), leaf swirls (grass),
//                 dust motes (earth), wind streak lines (wind)
//   bases         nexus crystal glints + rising team-colour motes, fountain sparkle and droplets
// Ambience never clutters combat: spawns are gated by S.calm() (fights) and sparse over lanes.

import { o as LANE_HW, u as RIVER, v as SDF_RAW } from '../../assets/map-oE9sOnNc.js';

const TAU = Math.PI * 2;
const lin = (h) => [(h >> 16) & 255, (h >> 8) & 255, h & 255].map((c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
const RIVER_DIR = (() => { const dx = RIVER.b.x - RIVER.a.x, dz = RIVER.b.y - RIVER.a.y, l = Math.hypot(dx, dz) || 1; return { x: dx / l, z: dz / l }; })();
const ease = (u) => u * u * (3 - 2 * u);

const BFLY_COLS = [0xfaf6ea, 0xffe25a, 0xff9a3a, 0x7ac8ff, 0xff9ad0, 0xfaf6ea, 0xffe25a].map(lin);
const LEAF_COLS = [0x6cc04a, 0x58a83a, 0x86d05a, 0x6cc04a, 0xe8c040, 0xe8902a].map(lin);
const PETAL_COLS = [0xffb8d8, 0xfff4ec, 0xffd0e4, 0xfff0a0].map(lin);

/** rate accumulator: returns how many to spawn this frame */
function tick(o, key, rate, dt) { const A = o.__acc || (o.__acc = {}); A[key] = (A[key] || 0) + rate * dt; const n = Math.floor(A[key]); A[key] -= n; return Math.min(n, 6); }

// ------------------------------------------------------------------------------------------------ butterflies
class Butterflies {
  constructor(S) { this.S = S; this.name = 'butterflies'; this.list = []; this.acc = {}; }
  reset() { this.list.length = 0; }
  count() { return this.list.length; }
  spot() {
    const S = this.S, fl = S.sites.flowers;
    if (fl && fl.length && S.r() < 0.7) {
      for (let i = 0; i < 6; i++) { const f = fl[(S.r() * fl.length) | 0]; if (S.inView(f.x, S.gy(f.x, f.z), f.z, -0.05) && S.nearestUnit(f.x, f.z).d > 4.5 && S.calm(f.x, f.z) > 0.9) return { x: f.x, z: f.z }; }
    }
    return S.randInView((x, z, g) => g > S.waterY + 0.05 && g < 1.6 && S.sdf(x, z) > 2.4 && S.laneDist(x, z) > LANE_HW + 1.2
      && S.calm(x, z) > 0.9 && S.nearestUnit(x, z).d > 4.5, 10, -0.08);
  }
  add(p) {
    const S = this.S, c = BFLY_COLS[(S.r() * BFLY_COLS.length) | 0];
    this.list.push({ x: p.x, z: p.z, hx: p.x, hz: p.z, tx: p.x, tz: p.z, vx: 0, vz: 0, alt: 0.7 + S.r() * 0.5, altT: 0.6 + S.r() * 0.6,
      gy: S.surf(p.x, p.z), t: 0, next: 0, life: 22 + S.r() * 26, ph: S.r() * 10, c, fade: 0, leave: 0, glide: 0 });
  }
  update(dt) {
    const S = this.S, max = Math.round(Math.min(12, 7 * S.q * S.areaK));
    if (this.list.length < max && tick(this.acc, 's', 0.9, dt)) {
      const p = this.spot();
      if (p) this.add(p);
    }
    let n = 0;
    for (const b of this.list) {
      b.t += dt;
      const nu = S.nearestUnit(b.x, b.z);
      if (!b.leave && (nu.d < 2.6 || b.t > b.life || S.calm(b.x, b.z) < 0.55)) {
        b.leave = 1; const a = nu.d < 6 ? Math.atan2(nu.dz, nu.dx) : S.r() * TAU;
        b.lx = Math.cos(a); b.lz = Math.sin(a);
      }
      let ax, az;
      if (b.leave) {
        ax = (b.lx * 2.2 - b.vx) * 3; az = (b.lz * 2.2 - b.vz) * 3; b.altT = 3.5; b.fade -= dt * 0.45;
      } else {
        b.fade = Math.min(1, b.fade + dt * 1.2);
        if (b.t > b.next) { b.tx = b.hx + (S.r() - 0.5) * 5; b.tz = b.hz + (S.r() - 0.5) * 4; b.next = b.t + 0.8 + S.r() * 2.2; b.altT = 0.5 + S.r() * 0.8; if (S.r() < 0.25) b.glide = 0.35; }
        const dx = b.tx - b.x, dz = b.tz - b.z, d = Math.hypot(dx, dz) || 1, sp = Math.min(0.95, d * 0.8);
        ax = (dx / d * sp - b.vx) * 2.5 + Math.sin(b.t * 5.3 + b.ph) * 1.6; az = (dz / d * sp - b.vz) * 2.5 + Math.cos(b.t * 4.1 + b.ph * 2) * 1.6;
      }
      b.vx += ax * dt; b.vz += az * dt; b.x += b.vx * dt; b.z += b.vz * dt;
      b.alt += (b.altT - b.alt) * Math.min(1, dt * (b.leave ? 0.9 : 1.6));
      b.gy += (S.surf(b.x, b.z) - b.gy) * Math.min(1, dt * 3);
      b.glide = Math.max(0, b.glide - dt);
      if (b.fade <= 0 && b.leave) continue;
      if (b.t > 1.5 && !S.inView(b.x, b.gy + b.alt, b.z, 0.4)) continue;
      this.list[n++] = b;
    }
    this.list.length = n;
  }
  draw() {
    const S = this.S, G = S.gfx;
    for (const b of this.list) {
      const y = b.gy + b.alt + 0.12 * Math.sin(b.t * 6.5 + b.ph) + 0.04 * Math.sin(b.t * 17 + b.ph);
      if (!S.inView(b.x, y, b.z, 0.05)) continue;
      const fr = b.glide > 0 ? 0 : [0, 1, 2, 1][Math.floor(b.t * 15 + b.ph) & 3];
      const a = Math.max(0, Math.min(1, b.fade));
      G.push('bfly', fr, b.x, y, b.z, { r: b.c[0], g: b.c[1], b: b.c[2], a, flip: b.vx < 0 });
      const h = y - b.gy, so = S.shadowOff(h), sx = b.x + so.x, sz = b.z + so.z;
      if (h < 2.2 && a > 0.98) G.push('shadow', 0, sx, S.surf(sx, sz) + 0.01, sz, { ground: true, sun: 1 });
    }
  }
}

// ------------------------------------------------------------------------------------------------ birds
class Birds {
  constructor(S) { this.S = S; this.name = 'birds'; this.flocks = []; this.cool = 2; }
  reset() { this.flocks.length = 0; this.cool = 2; }
  count() { let n = 0; for (const f of this.flocks) n += f.birds.length; return n; }
  update(dt) {
    const S = this.S, max = S.quality === 'low' ? 1 : Math.min(3, Math.round(1.6 * S.areaK));
    this.cool -= dt;
    if (this.cool <= 0 && this.flocks.length < max) {
      this.cool = 3 + S.r() * 5;
      const p = this.perch();
      if (p) this.spawn(p);
    }
    let n = 0;
    for (const f of this.flocks) { this.step(f, dt); if (f.birds.length) this.flocks[n++] = f; }
    this.flocks.length = n;
  }
  /** an open, quiet patch of ground: off the water, not in tall grass / habitat thickets, nobody within 8 m */
  perch(cx, cz, r) {
    const S = this.S;
    const ok = (x, z, g) => g > S.waterY + 0.05 && g < 1.4 && S.sdf(x, z) > 3.2 && S.bushAt(x, z) < 0 && S.bushAt(x + 1, z + 1) < 0
      && !S.sites.habitats.some((h) => Math.abs(h.x - x) < 7.5 && Math.abs(h.z - z) < 7.5) && S.nearestUnit(x, z).d > 8 && S.calm(x, z) > 0.99;
    if (cx != null) {
      for (let i = 0; i < 40; i++) { const x = cx + (S.r() - 0.5) * 2 * r, z = cz + (S.r() - 0.5) * 2 * r, g = S.gy(x, z); if (ok(x, z, g)) return { x, z, g }; }
      // debug: why nothing fit (h = height, s = sdf, b = bush, hab = habitat, u = unit, c = calm)
      const x = cx, z = cz, g = S.gy(x, z);
      this.why = { h: g, s: S.sdf(x, z), b: S.bushAt(x, z), hab: S.sites.habitats.some((h) => Math.abs(h.x - x) < 7.5 && Math.abs(h.z - z) < 7.5), u: S.nearestUnit(x, z).d, c: S.calm(x, z) };
      return null;
    }
    return S.randInView((x, z, g) => g > S.waterY + 0.05 && g < 1.4 && S.sdf(x, z) > 3.2 && S.bushAt(x, z) < 0 && S.bushAt(x + 1, z + 1) < 0
      && !S.sites.habitats.some((h) => Math.abs(h.x - x) < 7.5 && Math.abs(h.z - z) < 7.5) && S.nearestUnit(x, z).d > 8 && S.calm(x, z) > 0.99, 12, -0.15);
  }
  spawn(p) {
    const S = this.S, k = (S.quality === 'low' ? 2 : 2 + ((S.r() * 3) | 0));
    const a0 = S.r() * TAU, f = { x: p.x, z: p.z, t: 0, life: 25 + S.r() * 30, state: 'in', birds: [] };
    for (let i = 0; i < k; i++) {
      const lx = p.x + (S.r() - 0.5) * 2.4, lz = p.z + (S.r() - 0.5) * 1.8, a = a0 + (S.r() - 0.5) * 0.6, d = 9 + S.r() * 3;
      f.birds.push({ lx, lz, sx: lx + Math.cos(a) * d, sz: lz + Math.sin(a) * d, sa: 5.5 + S.r() * 2, u: -i * 0.12 - S.r() * 0.2, dur: 1.9 + S.r() * 0.5,
        x: lx, z: lz, alt: 6, state: 'in', t: 0, act: 0, actT: 0.5 + S.r(), fr: 0, left: Math.cos(a) > 0, hop: 0, vx: 0, vz: 0, vy: 0, delay: 0, ph: S.r() * 4 });
    }
    this.flocks.push(f);
  }
  scare(f, ux, uz) {
    const S = this.S; f.state = 'out';
    for (const b of f.birds) {
      if (b.state === 'out') continue;
      let dx = b.x - ux, dz = b.z - uz; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
      const a = Math.atan2(dz, dx) + (S.r() - 0.5) * 1.1, sp = 4 + S.r() * 1.8;
      b.state = 'out'; b.vx = Math.cos(a) * sp; b.vz = Math.sin(a) * sp; b.vy = 2.3 + S.r() * 1.2; b.delay = S.r() * 0.28; b.t = 0;
      b.left = b.vx < 0;
    }
  }
  step(f, dt) {
    const S = this.S; f.t += dt;
    // threat: any unit close to the flock, a fight nearby, or simply time to go
    if (f.state !== 'out') {
      const nu = S.nearestUnit(f.x, f.z);
      const near = f.state === 'in' ? 6 : 3.8;
      if (nu.d < near || S.calm(f.x, f.z) < 0.75 || f.t > f.life) this.scare(f, f.x - nu.dx * nu.d, f.z - nu.dz * nu.d);
    }
    let n = 0;
    for (const b of f.birds) {
      b.t += dt;
      if (b.state === 'in') {
        b.u += dt / b.dur;
        const u = Math.max(0, Math.min(1, b.u)), e = ease(u);
        b.x = b.sx + (b.lx - b.sx) * e; b.z = b.sz + (b.lz - b.sz) * e; b.alt = b.sa * Math.pow(1 - u, 1.5);
        b.fr = u > 0.82 ? 0 : u > 0.6 ? 1 : [0, 1, 2, 1][Math.floor(b.t * 12 + b.ph) & 3];
        if (u >= 1) { b.state = 'sit'; b.alt = 0; b.t = 0; }
        b.vis = b.u > 0;
      } else if (b.state === 'sit') {
        b.actT -= dt; b.vis = true;
        if (b.actT <= 0) {
          const r = S.r();
          b.act = r < 0.55 ? 1 : r < 0.75 ? 2 : r < 0.9 ? 3 : 4;
          b.actT = b.act === 1 ? 0.16 + S.r() * 0.1 : b.act === 3 ? 0.26 : 0.4 + S.r() * 1.4;
          if (b.act === 3) { b.hx = (S.r() - 0.5) * 0.6; b.hz = (S.r() - 0.5) * 0.4; b.left = b.hx < 0; b.h0 = { x: b.x, z: b.z }; }
          if (b.act === 4) { b.left = !b.left; b.act = 0; }
        }
        if (b.act === 3) { const u = 1 - Math.max(0, b.actT) / 0.26; b.x = b.h0.x + b.hx * u; b.z = b.h0.z + b.hz * u; b.alt = Math.sin(u * Math.PI) * 0.12; if (b.actT <= 0.001) { b.act = 0; b.alt = 0; } }
        b.fr = b.act === 1 ? 1 : b.act === 2 ? 2 : 0;
        if (b.act === 1 && b.actT <= 0.02) b.act = 0;
      } else {
        if (b.delay > 0) { b.delay -= dt; b.vis = true; b.fr = 0; }
        else {
          b.x += b.vx * dt; b.z += b.vz * dt; b.alt += b.vy * dt; b.vy = Math.max(1.2, b.vy - dt * 0.8);
          b.fr = [0, 1, 2, 1][Math.floor(b.t * (b.t < 0.9 ? 18 : 12) + b.ph) & 3]; b.vis = true;
          if (b.alt > 12 || (b.t > 0.5 && !S.inView(b.x, S.surf(b.x, b.z) + b.alt, b.z, 0.3))) continue;
        }
      }
      f.birds[n++] = b;
    }
    f.birds.length = n;
  }
  draw() {
    const S = this.S, G = S.gfx;
    for (const f of this.flocks) for (const b of f.birds) {
      if (!b.vis) continue;
      const gy = S.surf(b.x, b.z), y = gy + b.alt;
      if (!S.inView(b.x, y, b.z, 0.05)) continue;
      const flying = b.state === 'in' ? b.u < 0.97 : b.state === 'out' && b.delay <= 0;
      if (flying) G.push('birdFly', b.fr, b.x, y, b.z, { flip: b.left });
      else G.push('birdSit', b.fr, b.x, y, b.z, { flip: b.left, ay: 0 });   // art faces right
      const so = S.shadowOff(b.alt), sx = b.x + so.x, sz = b.z + so.z;
      if (b.alt < 6) G.push('shadow', flying && b.alt < 3 ? 1 : 0, sx, S.surf(sx, sz) + 0.01, sz, { ground: true, sun: 1 });
    }
  }
}

// ------------------------------------------------------------------------------------------------ dragonflies
class Dragonflies {
  constructor(S) { this.S = S; this.name = 'dragonflies'; this.list = []; this.acc = {}; }
  reset() { this.list.length = 0; }
  count() { return this.list.length; }
  shallow(x, z) { const S = this.S, d = S.waterY - S.gy(x, z); return d > 0.04 && d < 0.4; }
  add(p) { const S = this.S; this.list.push({ x: p.x, z: p.z, alt: 0.45 + S.r() * 0.4, t: 0, next: 0.6 + S.r(), dart: 0, fx: p.x, fz: p.z, tx: p.x, tz: p.z, life: 18 + S.r() * 20, ph: S.r() * 9, flip: S.r() < 0.5, fade: 0, out: 0 }); }
  update(dt) {
    const S = this.S, max = Math.round(Math.min(4, 2.6 * S.q * S.areaK));
    if (this.list.length < max && tick(this.acc, 's', 0.6, dt)) {
      const p = S.randInView((x, z) => this.shallow(x, z) && S.nearestUnit(x, z).d > 3.5 && S.calm(x, z) > 0.9, 12, -0.1);
      if (p) this.add(p);
    }
    let n = 0;
    for (const d of this.list) {
      d.t += dt;
      const nu = S.nearestUnit(d.x, d.z);
      if (!d.out && (nu.d < 2.6 || d.t > d.life || S.calm(d.x, d.z) < 0.6)) { d.out = 1; const a = Math.atan2(nu.dz, nu.dx) + (S.r() - 0.5); d.fx = d.x; d.fz = d.z; d.tx = d.x + Math.cos(a) * 9; d.tz = d.z + Math.sin(a) * 9; d.dart = 0.0001; d.dd = 1.1; d.flip = d.tx < d.x; }
      d.fade = d.out ? d.fade - dt * 0.9 : Math.min(1, d.fade + dt * 1.5);
      if (d.dart > 0) {
        d.dart += dt / (d.dd || 0.35);
        const u = Math.min(1, d.dart), e = 1 - (1 - u) * (1 - u) * (1 - u);
        d.x = d.fx + (d.tx - d.fx) * e; d.z = d.fz + (d.tz - d.fz) * e;
        if (d.out) d.alt += dt * 1.5;
        if (u >= 1) { d.dart = 0; d.next = d.t + 0.5 + S.r() * 1.6; }
      } else if (d.t > d.next) {
        for (let i = 0; i < 6; i++) {
          const a = S.r() * TAU, r = 1 + S.r() * 2.4, tx = d.x + Math.cos(a) * r, tz = d.z + Math.sin(a) * r;
          if (S.isWater(tx, tz, 0.02)) { d.fx = d.x; d.fz = d.z; d.tx = tx; d.tz = tz; d.dart = 0.0001; d.dd = 0.22 + r * 0.06; d.flip = tx < d.x; d.alt = 0.35 + S.r() * 0.5; break; }
        }
        if (!d.dart) d.next = d.t + 0.4;
      }
      if (d.fade <= 0 && d.out) continue;
      if (d.t > 1 && !S.inView(d.x, S.waterY + d.alt, d.z, 0.35)) continue;
      this.list[n++] = d;
    }
    this.list.length = n;
  }
  draw() {
    const S = this.S, G = S.gfx;
    for (const d of this.list) {
      const hov = d.dart > 0 ? 0 : 1;
      const x = d.x + hov * 0.04 * Math.sin(d.t * 11 + d.ph), y = S.surf(d.x, d.z) + d.alt + hov * 0.03 * Math.sin(d.t * 7.3 + d.ph), z = d.z + hov * 0.03 * Math.cos(d.t * 9.1);
      if (!S.inView(x, y, z, 0.05)) continue;
      const a = Math.max(0, Math.min(1, d.fade));
      G.push('drag', Math.floor(d.t * 24) & 1, x, y, z, { flip: d.flip, a });
      const so = S.shadowOff(d.alt);
      if (a > 0.98) G.push('shadow', 0, x + so.x, S.surf(x + so.x, z + so.z) + 0.01, z + so.z, { ground: true, sun: 1 });
    }
  }
}

// ------------------------------------------------------------------------------------------------ fish
class Fish {
  constructor(S) { this.S = S; this.name = 'fish'; this.list = []; this.cool = 1.5; this.ring = 2; }
  reset() { this.list.length = 0; }
  count() { return this.list.length; }
  leap(p) {
    const S = this.S, s = S.r() < 0.5 ? 1 : -1, a = Math.atan2(RIVER_DIR.z, RIVER_DIR.x) + (s < 0 ? Math.PI : 0) + (S.r() - 0.5) * 0.9;
    this.list.push({ x0: p.x, z0: p.z, dx: Math.cos(a), dz: Math.sin(a), t: 0, dur: 0.75 + S.r() * 0.2, len: 1.1 + S.r() * 0.6, h: 0.45 + S.r() * 0.25, landed: false });
    this.splash(p.x, p.z, true);
  }
  deep(x, z) { const S = this.S; return S.waterY - S.gy(x, z) > 0.22 && S.nearestUnit(x, z).d > 3.5 && S.calm(x, z) > 0.8; }
  splash(x, z, big) {
    const S = this.S, y = S.waterY + 0.01;
    S.emit({ g: 'ripple', f: big ? 0 : 1, fps: 7, life: (big ? 6 : 5) / 7, x, y, z, ground: true, unlit: true, a: 1, r: 0.74, gg: 0.92, b: 1, gain: 1.15, fin: 0, fout: 0.4 });
    if (!big) return;
    S.emit({ g: 'splash', f: 0, fps: 10, life: 0.29, x, y, z, unlit: true, a: 1, r: 0.88, gg: 0.97, b: 1, gain: 1.25, fin: 0, fout: 0 });
    for (let i = 0; i < 3; i++) {
      const a = S.r() * TAU, sp = 0.6 + S.r() * 0.8;
      S.emit({ g: 'dot', f: 0, x, y: y + 0.05, z, vx: Math.cos(a) * sp, vz: Math.sin(a) * sp, vy: 1.6 + S.r() * 1.2, grav: -7, life: 0.45, unlit: true, a: 1, r: 0.88, gg: 0.97, b: 1, gain: 1.25, fin: 0, fout: 0.3 });
    }
  }
  update(dt) {
    const S = this.S;
    this.cool -= dt * Math.min(2, S.areaK);
    if (this.cool <= 0) {
      this.cool = 2.5 + S.r() * 4.5;
      const p = S.randInView((x, z) => this.deep(x, z), 10, -0.12);
      if (p) this.leap(p);
    }
    // a fish rising: just a ring
    this.ring -= dt * Math.min(2, S.areaK);
    if (this.ring <= 0) { this.ring = 1.2 + S.r() * 2.2; const p = S.randInView((x, z) => S.waterY - S.gy(x, z) > 0.12 && S.calm(x, z) > 0.8, 8, -0.1); if (p) this.splash(p.x, p.z, false); }
    let n = 0;
    for (const f of this.list) {
      f.t += dt;
      const u = f.t / f.dur;
      if (u >= 1 && !f.landed) { f.landed = true; this.splash(f.x0 + f.dx * f.len, f.z0 + f.dz * f.len, true); }
      if (u < 1) this.list[n++] = f;
    }
    this.list.length = n;
  }
  draw() {
    const S = this.S, G = S.gfx;
    for (const f of this.list) {
      const u = Math.min(1, f.t / f.dur), x = f.x0 + f.dx * f.len * u, z = f.z0 + f.dz * f.len * u, y = S.waterY + 4 * f.h * u * (1 - u) - 0.04;
      if (!S.inView(x, y, z, 0.05)) continue;
      const fr = u < 0.36 ? 0 : u < 0.64 ? 1 : 2;
      // facing: screen-right when the leap heads +x
      G.push('fish', fr, x, y, z, { flip: f.dx < 0 });
    }
  }
}

// ------------------------------------------------------------------------------------------------ water surface
class Water {
  constructor(S) { this.S = S; this.name = 'water'; this.acc = {}; this.has = 0; this.probe = 0; this.gl = null; }
  reset() { this.gl = null; }
  count() { return this.has; }
  update(dt) {
    const S = this.S;
    // cheap estimate of how much water is on screen (re-probed twice a second)
    this.probe -= dt;
    if (this.probe <= 0) { this.probe = 0.5; let w = 0; for (let i = 0; i < 16; i++) if (S.randInView((x, z) => S.isWater(x, z), 1)) w++; this.has = w / 16; }
    if (this.has <= 0) return;
    const k = S.q * S.areaK * Math.min(1, this.has * 2.5);
    // sun glitter: most glints cluster in a drifting patch of water (reads as the sun's reflection), a few are scattered
    const gl = this.gl;
    if (!gl || S.t > gl.until || !S.inView(gl.x, S.waterY, gl.z, -0.1)) {
      const p = S.randInView((x, z) => S.isWater(x, z, 0.15), 8, -0.15);
      this.gl = p ? { x: p.x, z: p.z, until: S.t + 4 + S.r() * 4 } : null;
    }
    const ng = tick(this.acc, 'g', 16 * k, dt);
    for (let i = 0; i < ng; i++) {
      let p = null;
      if (this.gl && S.r() < 0.65) {
        const a = S.r() * TAU, r = Math.sqrt(S.r()) * 2.6, x = this.gl.x + Math.cos(a) * r * 1.4, z = this.gl.z + Math.sin(a) * r;
        if (S.isWater(x, z, 0.08)) p = { x, z };
      }
      if (!p) p = S.randInView((x, z) => S.isWater(x, z, 0.08) && S.calm(x, z) > 0.4, 4);
      if (p) S.emit({ g: 'glint', frames: S.r() < 0.5 ? [0, 1, 2, 2, 1, 0] : [0, 1, 1, 0], fps: 12 + S.r() * 4, life: 0.45, x: p.x, y: S.waterY + 0.015, z: p.z, add: true, ground: true, sun: 1,
        r: 0.86, gg: 0.96, b: 1, gain: 2.6 + S.r() * 1.6, fin: 0, fout: 0, calmFade: 0.99 });
    }
    const nd = tick(this.acc, 'd', 7 * k, dt);
    for (let i = 0; i < nd; i++) {
      const p = S.randInView((x, z) => S.isWater(x, z, 0.12), 4);
      if (p) S.emit({ g: 'dash', frames: [0, 1, 2, 3, 4, 3, 2, 1, 0], fps: 6 + S.r() * 2, life: 1.4, x: p.x, y: S.waterY + 0.012, z: p.z, vx: RIVER_DIR.x * 0.45, vz: RIVER_DIR.z * 0.45,
        add: true, ground: true, sun: 1, r: 0.7, gg: 0.92, b: 1, gain: 1.3, fin: 0, fout: 0 });
    }
    // lily pads (when world-art exposes its prop records): an occasional wet glint on the pad edge
    const L = S.sites.lilies;
    if (L && L.length && tick(this.acc, 'l', 3 * k, dt)) {
      const l = L[(S.r() * L.length) | 0];
      if (S.inView(l.x, l.y, l.z, 0)) S.emit({ g: 'glint', frames: [0, 1, 0], fps: 8, life: 0.36, x: l.x + (S.r() - 0.5) * 0.4, y: l.y + 0.03, z: l.z + (S.r() - 0.5) * 0.3, add: true, ground: true, sun: 1, gain: 1.4, fin: 0, fout: 0 });
    }
  }
}

// ------------------------------------------------------------------------------------------------ waterfalls
class Falls {
  constructor(S) { this.S = S; this.name = 'falls'; this.acc = {}; this.on = 0; }
  reset() {}
  count() { return this.on; }
  update(dt) {
    const S = this.S; this.on = 0;
    for (const f of S.sites.falls) {
      if (!S.inView(f.x, S.waterY, f.z, 0.4)) continue;
      this.on++;
      const px = -f.dz, pz = f.dx, k = S.q;
      const nf = tick(f, 'foam', 16 * k, dt);
      for (let i = 0; i < nf; i++) {
        const o = (S.r() - 0.5) * 2 * f.w * 0.85, sp = 0.9 + S.r() * 0.8;
        S.emit({ g: 'foam', f: (S.r() * 3) | 0, x: f.x + px * o, y: S.waterY + 0.04, z: f.z + pz * o, vx: f.dx * sp, vz: f.dz * sp, vy: 0.2, grav: -7, life: 0.55 + S.r() * 0.3, unlit: true, a: 1, fin: 0, fout: 0.45, r: 0.9, gg: 0.98, b: 1, gain: 1.2 });
      }
      const nm = tick(f, 'mist', 5 * k, dt);
      for (let i = 0; i < nm; i++) {
        const o = (S.r() - 0.5) * 2 * f.w, d = 1 + S.r() * 2.2;
        S.emit({ g: 'puff', frames: [0, 1, 2, 2, 1, 0], fps: 2.5, x: f.x + px * o + f.dx * d, y: S.waterY - 1.5 - S.r() * 3, z: f.z + pz * o + f.dz * d, vy: 0.45, wind: 0.35, life: 2.4, add: true, a: 1, gain: 0.32, fin: 0.15, fout: 0.15, r: 0.9, gg: 0.96, b: 1 });
      }
      const ns = tick(f, 'spray', 5 * k, dt);
      for (let i = 0; i < ns; i++) {
        const o = (S.r() - 0.5) * 2 * f.w;
        S.emit({ g: 'glint', frames: [0, 1, 2, 1], fps: 12, life: 0.33, x: f.x + px * o + f.dx * 0.6, y: S.waterY - S.r() * 1.5, z: f.z + pz * o + f.dz * 0.6, add: true, sun: 1, gain: 1.6, r: 0.85, gg: 0.95, b: 1, fin: 0, fout: 0 });
      }
    }
  }
}

// ------------------------------------------------------------------------------------------------ air: leaves, petals, pollen
class Air {
  constructor(S) { this.S = S; this.name = 'air'; this.acc = {}; this.treesIn = []; this.scan = 0; }
  reset() {}
  count() { return this.treesIn.length; }
  update(dt) {
    const S = this.S, k = S.q * S.areaK, gust = S.wind.gust;
    // canopy sources in view (prop records when available, else the forest band along the walls)
    this.scan -= dt;
    if (this.scan <= 0) { this.scan = 0.5; this.treesIn = (S.sites.trees || []).filter((t) => S.inView(t.x, t.y, t.z, 0.15)); }
    const nl = tick(this.acc, 'l', 1.7 * k * gust, dt);
    for (let i = 0; i < nl; i++) {
      let x, y, z;
      if (this.treesIn.length) {
        const t = this.treesIn[(S.r() * this.treesIn.length) | 0], a = S.r() * TAU, r = Math.sqrt(S.r()) * t.r;
        x = t.x + Math.cos(a) * r; z = t.z + Math.sin(a) * r; y = t.y - S.r() * 0.8;
      } else {
        const p = S.randInView((px, pz, g) => { const s = S.sdf(px, pz); return s < -0.5 && s > -4.5 && g > S.waterY; }, 6, 0.02);
        if (!p) continue;
        x = p.x; z = p.z; y = p.g + 2.6 + S.r() * 1.6;
      }
      if (S.calm(x, z) < 0.7) continue;
      const c = LEAF_COLS[(S.r() * LEAF_COLS.length) | 0];
      S.emit({ g: 'leaf', loop: true, frames: [0, 1, 2, 3], fps: 5 + S.r() * 5, x, y, z, vy: -0.42 - S.r() * 0.18, wind: 0.5 + S.r() * 0.4, sway: 0.7, swf: 2 + S.r() * 1.5,
        land: true, rest: 1.8 + S.r() * 2.2, life: 16, a: 1, fin: 0.04, fout: 0.08, r: c[0], gg: c[1], b: c[2], flip: S.r() < 0.5, calmFade: 0.99 });
    }
    const np = tick(this.acc, 'p', 0.9 * k * gust, dt);
    for (let i = 0; i < np; i++) {
      const p = S.randInView((x, z, g) => g > S.waterY && g < 1.6 && S.sdf(x, z) > 1.5 && S.laneDist(x, z) > LANE_HW + 2 && S.calm(x, z) > 0.9, 6, 0.05);
      if (!p) continue;
      const c = PETAL_COLS[(S.r() * PETAL_COLS.length) | 0];
      S.emit({ g: 'petal', loop: true, frames: [0, 1, 2, 3], fps: 7 + S.r() * 4, x: p.x - S.wind.x * 2, y: p.g + 1.1 + S.r() * 0.9, z: p.z - S.wind.z * 2, vy: -0.22, wind: 0.85, sway: 0.45, swf: 3,
        land: true, rest: 1.2, life: 12, a: 1, fin: 0.05, fout: 0.1, r: c[0], gg: c[1], b: c[2], calmFade: 0.99 });
    }
    // pollen motes: warm 1-px specks that only show where the sun reaches (shader sun mode 1)
    const nm = tick(this.acc, 'm', 7 * k, dt);
    for (let i = 0; i < nm; i++) {
      const p = S.randInView((x, z, g) => g > S.waterY - 0.05 && (S.laneDist(x, z) > LANE_HW || S.r() < 0.3), 4, 0.05);
      if (!p) continue;
      S.emit({ g: 'dot', f: 0, x: p.x, y: S.surf(p.x, p.z) + 0.4 + S.r() * 1.9, z: p.z, vy: (S.r() - 0.4) * 0.08, wind: 0.22, sway: 0.18, swf: 1.3,
        life: 4 + S.r() * 3, add: true, sun: 1, a: 0.9, gain: 1.4 + S.r() * 0.8, r: 1, gg: 0.93, b: 0.7, fin: 0.3, fout: 0.35, calmFade: 0.99 });
    }
  }
}

// ------------------------------------------------------------------------------------------------ fireflies
class Fireflies {
  constructor(S) { this.S = S; this.name = 'fireflies'; this.list = []; this.acc = {}; this.glowsIn = []; this.scan = 0; }
  reset() { this.list.length = 0; }
  count() { return this.list.length; }
  update(dt) {
    const S = this.S, max = Math.round(Math.min(18, 11 * S.q * S.areaK));
    this.scan -= dt;
    if (this.scan <= 0) { this.scan = 0.6; this.glowsIn = S.sites.glows.filter((g) => S.inView(g.x, g.y, g.z, 0.2)); }
    if (this.list.length < max && tick(this.acc, 's', 3, dt)) {
      let p = null;
      if (this.glowsIn.length && S.r() < 0.6) {
        const g = this.glowsIn[(S.r() * this.glowsIn.length) | 0], a = S.r() * TAU, r = 0.6 + S.r() * 2.2;
        p = { x: g.x + Math.cos(a) * r, z: g.z + Math.sin(a) * r };
      } else p = S.randInView((x, z, g) => { const s = S.sdf(x, z); return s > -2.5 && s < 4 && g > S.waterY && S.laneDist(x, z) > LANE_HW + 1.5; }, 6, 0.02);
      if (p && S.calm(p.x, p.z) > 0.8) this.list.push({ hx: p.x, hz: p.z, x: p.x, z: p.z, alt: 0.4 + S.r() * 1.3, t: 0, life: 7 + S.r() * 8, ph: S.r() * TAU, w: 1.2 + S.r() * 1.4, rr: 0.4 + S.r() * 0.7 });
    }
    let n = 0;
    for (const f of this.list) {
      f.t += dt;
      f.x = f.hx + Math.sin(f.t * 0.45 + f.ph) * f.rr + Math.sin(f.t * 1.3 + f.ph * 2) * 0.15;
      f.z = f.hz + Math.cos(f.t * 0.37 + f.ph) * f.rr * 0.8;
      if (f.t < f.life && (f.t < 1 || S.inView(f.x, f.alt, f.z, 0.3)) && S.calm(f.x, f.z) > 0.3) this.list[n++] = f;
    }
    this.list.length = n;
  }
  draw() {
    const S = this.S, G = S.gfx;
    for (const f of this.list) {
      const y = S.surf(f.x, f.z) + f.alt + 0.15 * Math.sin(f.t * 0.9 + f.ph);
      if (!S.inView(f.x, y, f.z, 0.05)) continue;
      const blink = Math.pow(Math.max(0, Math.sin(f.t * f.w + f.ph)), 2.5), env = Math.min(1, f.t * 0.8, (f.life - f.t) * 0.8);
      const a = blink * env; if (a < 0.04) continue;
      G.push('fly', a > 0.45 ? 0 : 1, f.x, y, f.z, { add: true, sun: 2, a, r: 0.78, g: 1, b: 0.32, gain: 2.1 });
    }
  }
}

// ------------------------------------------------------------------------------------------------ habitats
const SDF_OUT = (x, z) => { const ox = x < 0 ? -x : x > 120 ? x - 120 : 0, oz = z < 0 ? -z : z > 120 ? z - 120 : 0, r = Math.hypot(ox, oz); return r > 0 ? -3 - r : SDF_RAW(x, z); };
class Habitats {
  constructor(S) { this.S = S; this.name = 'habitats'; this.arcs = []; this.on = 0; }
  reset() { this.arcs.length = 0; }
  count() { return this.on; }
  /** same deterministic pond spot as world-art's habPondSpot (water habitats) */
  pond(h) {
    if (h.pond !== undefined) return h.pond;
    let best = null, bs = -1e9;
    for (const rr of [5.2, 6.2]) for (let k = 0; k < 48; k++) {
      const a = (k / 48) * TAU, x = h.x + Math.cos(a) * rr, z = h.z + Math.sin(a) * rr;
      const sd = SDF_OUT(x, z), ln = this.S.laneDist(x, z);
      if (sd < 2.4 || ln < 8.5) continue;
      let sc = -Math.abs(sd - 3.2) * 2 + Math.min(ln, 14) * 0.15;
      for (let j = 0; j < 8; j++) { const b = (j / 8) * TAU; if (SDF_OUT(x + Math.cos(b) * 2.4, z + Math.sin(b) * 2.4) < 0.6) sc -= 3; }
      if (sc > bs) { bs = sc; best = { x, z, r: 2.3, y: this.S.gy(x, z) + 0.035 }; }
    }
    return (h.pond = best);
  }
  update(dt) {
    const S = this.S; this.on = 0;
    for (const h of S.sites.habitats) {
      const gy = S.gy(h.x, h.z);
      if (!S.inView(h.x, gy + 1, h.z, 0.35)) continue;
      this.on++;
      const calm = S.calm(h.x, h.z), k = S.q * calm;
      if (k < 0.05) continue;
      const ring = (r0, r1) => { const a = S.r() * TAU, r = r0 + Math.sqrt(S.r()) * (r1 - r0); const x = h.x + Math.cos(a) * r, z = h.z + Math.sin(a) * r; return { x, z, g: S.surf(x, z) }; };
      switch (h.line) {
        case 'fire': {
          const n = tick(h, 'e', 5 * k, dt);
          for (let i = 0; i < n; i++) {
            const p = ring(0.5, 5), hot = S.r() < 0.35;
            S.emit({ g: 'ember', frames: [0, 1, 1, 2], fps: 2.2, x: p.x, y: p.g + 0.1 + S.r() * 0.4, z: p.z, vy: 0.7 + S.r() * 0.6, wind: 0.25, sway: 0.25, swf: 3 + S.r() * 2,
              life: 1.5 + S.r() * 0.7, add: true, a: 1, r: 1, gg: hot ? 0.82 : 0.45, b: hot ? 0.35 : 0.1, gain: 1.9, fin: 0.1, fout: 0.4, calmFade: 0.99 });
          }
          break;
        }
        case 'electric': this.electric(h, dt, k); break;
        case 'water': {
          const P = this.pond(h);
          const n = tick(h, 'b', 3 * k, dt);
          for (let i = 0; i < n; i++) {
            let x, z, y;
            if (P) { const a = S.r() * TAU, r = Math.sqrt(S.r()) * P.r * 0.75; x = P.x + Math.cos(a) * r; z = P.z + Math.sin(a) * r; y = P.y + 0.01; }
            else { const p = S.randInView((px, pz) => S.isWater(px, pz) && Math.hypot(px - h.x, pz - h.z) < 9, 4); if (!p) continue; x = p.x; z = p.z; y = S.waterY + 0.01; }
            S.emit({ g: 'bubble', frames: [0, 0, 1, 1, 1, 2], fps: 5 + S.r() * 2, life: 1.05, x, y, z, ground: true, unlit: true, a: 1, r: 0.8, gg: 0.96, b: 1, gain: 1.2, fin: 0, fout: 0, calmFade: 0.99 });
          }
          break;
        }
        case 'grass': {
          const n = tick(h, 'l', 2.6 * k, dt);
          for (let i = 0; i < n; i++) {
            const p = ring(1, 6), c = S.r() < 0.7 ? LEAF_COLS[(S.r() * 3) | 0] : PETAL_COLS[(S.r() * PETAL_COLS.length) | 0];
            const a = Math.atan2(p.z - h.z, p.x - h.x) + Math.PI / 2, sp = 0.6 + S.r() * 0.5;    // a gentle swirl around the camp
            S.emit({ g: S.r() < 0.7 ? 'leaf' : 'petal', loop: true, frames: [0, 1, 2, 3], fps: 6 + S.r() * 4, x: p.x, y: p.g + 0.8 + S.r() * 1.4, z: p.z, vx: Math.cos(a) * sp, vz: Math.sin(a) * sp, vy: -0.18,
              drag: 0.3, wind: 0.3, sway: 0.4, swf: 2.5, land: true, rest: 1.5, life: 9, a: 1, fin: 0.06, fout: 0.12, r: c[0], gg: c[1], b: c[2], calmFade: 0.99 });
          }
          break;
        }
        case 'earth': {
          const n = tick(h, 'd', 4 * k, dt);
          for (let i = 0; i < n; i++) {
            const p = ring(0.5, 6), light = S.r() < 0.5;
            S.emit({ g: 'dot', f: S.r() < 0.3 ? 1 : 0, x: p.x, y: p.g + 0.12 + S.r() * 0.7, z: p.z, vy: 0.05 + S.r() * 0.08, wind: 0.55, sway: 0.2, swf: 2, life: 2.2 + S.r(), a: 1,
              r: light ? 0.62 : 0.42, gg: light ? 0.46 : 0.3, b: light ? 0.28 : 0.17, fin: 0.25, fout: 0.4, calmFade: 0.99 });
          }
          if (tick(h, 'c', 0.7 * k, dt)) {
            const p = ring(1, 5.5);
            S.emit({ g: 'puff', frames: [0, 1, 1, 0], fps: 2.2, x: p.x, y: p.g + 0.15, z: p.z, vy: 0.12, wind: 0.6, life: 1.8, a: 1, fin: 0, fout: 0, r: 0.78, gg: 0.64, b: 0.45, calmFade: 0.99 });
          }
          break;
        }
        case 'wind': {
          const n = tick(h, 's', 3.2 * k, dt);
          for (let i = 0; i < n; i++) {
            const p = ring(0, 7);
            S.emit({ g: 'streakD', frames: [0, 1, 2, 3, 4, 5], fps: 9, life: 0.66, x: p.x - S.wind.x * 1.5, y: p.g + 0.35 + S.r() * 1.6, z: p.z - S.wind.z * 1.5, wind: 3.6,
              add: true, a: 1, gain: 0.55, r: 0.95, gg: 1, b: 1, fin: 0, fout: 0, calmFade: 0.99 });
          }
          if (tick(h, 'l', 1.2 * k, dt)) {
            const p = ring(0, 6), c = LEAF_COLS[(S.r() * LEAF_COLS.length) | 0];
            S.emit({ g: 'leaf', loop: true, frames: [0, 1, 2, 3], fps: 12, x: p.x - S.wind.x * 3, y: p.g + 0.6 + S.r() * 1.2, z: p.z - S.wind.z * 3, vy: 0.15, wind: 2.6, sway: 0.5, swf: 4,
              life: 2.2, a: 1, fin: 0.08, fout: 0.2, r: c[0], gg: c[1], b: c[2], calmFade: 0.99 });
          }
          break;
        }
      }
    }
    let n = 0; for (const a of this.arcs) { a.t += dt; if (a.t < a.dur) this.arcs[n++] = a; } this.arcs.length = n;
  }
  electric(h, dt, k) {
    const S = this.S, st = h.stones || [];
    h.cd = (h.cd ?? 0.8) - dt * k;
    if (h.cd <= 0) {
      h.cd = 1.1 + S.r() * 2.2;
      let A, B;
      if (st.length >= 2) {
        const i = (S.r() * st.length) | 0; A = st[i];
        const cand = st.filter((s) => s !== A && Math.hypot(s.x - A.x, s.z - A.z) < 9);
        B = cand.length ? cand[(S.r() * cand.length) | 0] : null;
      }
      if (!A && st.length) A = st[0];
      if (!A) { const a = S.r() * TAU; A = { x: h.x + Math.cos(a) * 3.5, z: h.z + Math.sin(a) * 3.5 }; A.y = S.gy(A.x, A.z) + 2.2; }
      if (!B) { const a = S.r() * TAU, r = 1.2 + S.r() * 1.3; B = { x: A.x + Math.cos(a) * r, z: A.z + Math.sin(a) * r }; B.y = S.gy(B.x, B.z) + 0.05; }
      this.arcs.push({ ax: A.x, ay: A.y, az: A.z, bx: B.x, by: B.y, bz: B.z, t: 0, dur: 0.2 + S.r() * 0.12, seed: (S.r() * 1e6) | 0 });
      this.fired = (this.fired || 0) + 1;
      for (let i = 0; i < 4; i++) {
        const a = S.r() * TAU, sp = 0.8 + S.r() * 1.2;
        S.emit({ g: 'dot', f: 0, x: B.x, y: B.y + 0.05, z: B.z, vx: Math.cos(a) * sp, vz: Math.sin(a) * sp, vy: 1 + S.r() * 1.5, grav: -6, life: 0.4, add: true, a: 1, r: 1, gg: 0.95, b: 0.5, gain: 2, fin: 0, fout: 0.4 });
      }
    }
    // idle crackle on the crowns
    if (st.length && tick(h, 'z', 2.5 * k, dt)) {
      const s = st[(S.r() * st.length) | 0];
      S.emit({ g: 'zap', f: (S.r() * 3) | 0, x: s.x + (S.r() - 0.5) * 0.3, y: s.y + (S.r() - 0.3) * 0.4, z: s.z, life: 0.09, add: true, a: 1, r: 1, gg: 0.95, b: 0.55, gain: 2.2, fin: 0, fout: 0 });
    }
  }
  draw() {
    const S = this.S, G = S.gfx;
    for (const a of this.arcs) {
      if (!S.inView(a.ax, a.ay, a.az, 0.2)) continue;
      // jagged bolt re-rolled every 50 ms: 1-px additive dots along an arching path
      let s = (a.seed + Math.floor(a.t / 0.05) * 7919) >>> 0;
      const rnd = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; };
      const dx = a.bx - a.ax, dy = a.by - a.ay, dz = a.bz - a.az, L = Math.hypot(dx, dy, dz), n = Math.max(8, Math.min(90, Math.round(L * 30)));
      const kinks = 5 + ((rnd() * 4) | 0), off = [];
      for (let i = 0; i <= kinks; i++) off.push(i === 0 || i === kinks ? [0, 0] : [(rnd() - 0.5) * L * 0.18, (rnd() - 0.5) * L * 0.14]);
      const px = -dz / (Math.hypot(dx, dz) || 1), pz = dx / (Math.hypot(dx, dz) || 1);
      const fade = 1 - a.t / a.dur;
      for (let i = 0; i <= n; i++) {
        const u = i / n, ki = u * kinks, k0 = Math.floor(ki), k1 = Math.min(kinks, k0 + 1), f = ki - k0;
        const o0 = off[k0], o1 = off[k1], ox = o0[0] + (o1[0] - o0[0]) * f, oy = o0[1] + (o1[1] - o0[1]) * f;
        const arch = Math.sin(u * Math.PI) * L * 0.18;
        const X = a.ax + dx * u + px * ox, Y = a.ay + dy * u + oy + arch, Z = a.az + dz * u + pz * ox;
        // 2x2 electric-yellow body with a 1-px white-hot core: reads as a bolt, not a dotted line
        G.push('dot', 2, X, Y, Z, { add: true, a: fade, r: 1, g: 0.86, b: 0.25, gain: 0.9 });
        G.push('dot', 0, X, Y, Z, { add: true, a: fade, r: 1, g: 1, b: 0.85, gain: 3 });
      }
      G.push('star', a.t < 0.08 ? 2 : 1, a.ax, a.ay, a.az, { add: true, a: fade, r: 1, g: 0.95, b: 0.55, gain: 2.6 });
      G.push('star', a.t < 0.08 ? 2 : 1, a.bx, a.by, a.bz, { add: true, a: fade, r: 1, g: 0.95, b: 0.55, gain: 2.6 });
    }
  }
}

// ------------------------------------------------------------------------------------------------ bases
const TEAM_COL = [lin(0x7ec4ff), lin(0xff8a6a)];
class Bases {
  constructor(S) { this.S = S; this.name = 'bases'; this.on = 0; }
  reset() {}
  count() { return this.on; }
  update(dt) {
    const S = this.S; this.on = 0;
    const ST = S.ctx.registry && S.ctx.registry.get && S.ctx.registry.get('structures'), A = this.tmp || (this.tmp = { x: 0, y: 0, z: 0 });
    for (const nx of S.sites.nexus) {
      const u = S.nexusUnit && S.nexusUnit(nx.team);
      if (u === null) continue;      // destroyed
      // crystal position from the structures renderer (falls back to the nexus meta height 6.1 m)
      let cx = nx.x, cy = S.gy(nx.x, nx.z) + 6.1, cz = nx.z;
      if (u && ST && ST.getAnchor && ST.getAnchor(u, 1, 'head', A)) { cx = A.x; cy = A.y; cz = A.z; }
      cy += 3.6;   // measured in 720p captures: the drawn gem's heart sits ~3.6 m above the structures 'head' anchor
      if (!S.inView(cx, cy, cz, 0.3)) continue;
      this.on++;
      const c = TEAM_COL[nx.team] || TEAM_COL[0], k = S.q;
      if (tick(nx, 'g', 1.8 * k, dt)) {
        // on the camera-facing side of the gem (camera sits south = +z), so the crystal does not hide it
        const sd = S.r() < 0.5 ? -1 : 1;     // just outside the gem's silhouette (left / right edge), camera side
        S.emit({ g: 'star', frames: [0, 1, 2, 1, 0, 3], fps: 12, life: 0.5, x: cx + sd * (1.9 + S.r() * 0.8), y: cy + (S.r() - 0.3) * 2.2, z: cz + 0.6 + S.r() * 0.6,
          add: true, front: true, a: 1, r: c[0] * 0.5 + 0.5, gg: c[1] * 0.5 + 0.5, b: c[2] * 0.5 + 0.5, gain: 2.4, fin: 0, fout: 0 });
      }
      // heartbeat pulse: every ~2.6 s a ring of motes bursts out of the gem (front half, camera side)
      if (tick(nx, 'p', 0.38, dt)) {
        for (let i = 0; i < 9; i++) {
          const a = (i / 8) * Math.PI, sp = 1.7 + S.r() * 0.4;
          S.emit({ g: 'dot', f: 2, x: cx + Math.cos(a) * 1.9, y: cy - 0.6, z: cz + Math.sin(a) * 1.9, vx: Math.cos(a) * sp, vz: Math.sin(a) * sp, vy: 0.35, drag: 1.6,
            life: 0.95, add: true, front: true, a: 1, r: c[0], gg: c[1], b: c[2], gain: 2.4, fin: 0, fout: 0.6 });
        }
        S.emit({ g: 'star', frames: [1, 2, 2, 1, 3], fps: 10, life: 0.5, x: cx, y: cy + 0.2, z: cz + 1.3, add: true, front: true, a: 1, r: c[0] * 0.5 + 0.5, gg: c[1] * 0.5 + 0.5, b: c[2] * 0.5 + 0.5, gain: 2.6, fin: 0, fout: 0 });
      }
      const nm = tick(nx, 'm', 6 * k, dt);
      for (let i = 0; i < nm; i++) {
        const a = S.r() * Math.PI, r = 2.1 + S.r() * 0.9;     // front half-ring outside the ~3.5 m gem, rising past it
        S.emit({ g: 'dot', f: S.r() < 0.4 ? 2 : 1, x: cx + Math.cos(a) * r, y: cy - 2.4 + S.r() * 1.2, z: cz + Math.sin(a) * r, vy: 0.6 + S.r() * 0.45, sway: 0.15, swf: 2,
          life: 2.4 + S.r(), add: true, front: true, a: 1, r: c[0] * 0.6 + 0.4, gg: c[1] * 0.6 + 0.4, b: c[2] * 0.6 + 0.4, gain: 2.2, fin: 0.2, fout: 0.45, calmFade: 0.99 });
      }
    }
    for (const fo of S.sites.fountains) {
      let cx = fo.x, cy = S.gy(fo.x, fo.z) + 2.62, cz = fo.z;
      if (ST && ST.getFountainAnchor && ST.getFountainAnchor(fo.team, A)) { cx = A.x; cy = A.y; cz = A.z; }
      if (!S.inView(cx, cy, cz, 0.3)) continue;
      this.on++;
      const k = S.q, c = TEAM_COL[fo.team] || TEAM_COL[0], gy = S.gy(cx, cz);
      const ng = tick(fo, 'g', 4 * k, dt);
      for (let i = 0; i < ng; i++) {
        const a = S.r() * TAU, r = 0.6 + Math.sqrt(S.r()) * 2.2;
        S.emit({ g: 'glint', frames: [0, 1, 2, 1, 3], fps: 12, life: 0.42, x: cx + Math.cos(a) * r, y: gy + 0.25 + S.r() * 0.5, z: cz + Math.sin(a) * r, add: true, sun: 1, r: 0.85, gg: 0.96, b: 1, gain: 2.4, fin: 0, fout: 0 });
      }
      const nm = tick(fo, 'm', 3 * k, dt);
      for (let i = 0; i < nm; i++) {
        const a = S.r() * TAU, r = 0.3 + S.r() * 0.6;
        S.emit({ g: 'dot', f: 0, x: cx + Math.cos(a) * r, y: cy - 0.6 + S.r() * 0.8, z: cz + Math.sin(a) * r, vy: 0.5 + S.r() * 0.4, sway: 0.12, swf: 2.5,
          life: 2 + S.r(), add: true, front: true, a: 1, r: c[0], gg: c[1], b: c[2], gain: 1.8, fin: 0.2, fout: 0.45 });
      }
    }
  }
}

class Life {
  constructor(S) {
    this.S = S;
    this.mods = [new Water(S), new Falls(S), new Air(S), new Habitats(S), new Bases(S), new Fish(S), new Dragonflies(S), new Butterflies(S), new Birds(S), new Fireflies(S)];
  }
  update(dt) {
    const S = this.S;
    S.areaK = Math.max(0.6, Math.min(3, (S.view.area || 420) / 420));
    for (const m of this.mods) if (!S.off[m.name]) m.update(dt);
  }
  draw() { for (const m of this.mods) if (!this.S.off[m.name] && m.draw) m.draw(); }
  reset() { for (const m of this.mods) m.reset(); }
  stats() { const o = {}; for (const m of this.mods) o[m.name] = m.count(); const h = this.mod('habitats'); o.arcsFired = h.fired || 0; o.arcsLive = h.arcs.length; const b = this.mod('birds'); if (b.why) o.perchWhy = b.why; return o; }
  mod(name) { return this.mods.find((m) => m.name === name); }
  /** debug / capture helper: put a critter or event at a map point (render-only) */
  debugSpawn(kind, x, z) {
    const p = { x, z, g: this.S.gy(x, z) };
    if (kind === 'fish') this.mod('fish').leap(p);
    else if (kind === 'birds') { const b = this.mod('birds'), V = this.S.view, q = x == null ? b.perch(V.cx, V.cz, 5) : p; if (!q) return false; b.spawn(q); return q; }
    else if (kind === 'butterfly') this.mod('butterflies').add(p);
    else if (kind === 'dragonfly') this.mod('dragonflies').add(p);
    else return false;
    return true;
  }
}

export function makeLife(S) { return new Life(S); }
