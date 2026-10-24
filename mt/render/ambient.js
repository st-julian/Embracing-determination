// mt/render/ambient.js — WORLD ANIMATION & AMBIENT LIFE (the 'ambient' part of the mt-render subsystem).
// Owner: world animation / ambient-life artist. Render-only: reads the world, never touches sim state.
//
// A living map at the shared pixel grid (32 art px / m, crisp billboards like the unit sprites):
//   * wind-driven life: drifting cloud shadows (ambient-clouds.js), falling leaves under the canopy, petals over
//     meadows, pollen motes that only show in sunlight;
//   * fauna (clearly decorative: tiny, no plates, no rings): butterflies over meadows, sparrows that take off when
//     anyone approaches, dragonflies over the shallows, koi leaping in the river, fireflies glowing in the shade;
//   * water: sun glints and drifting caustic dashes on the river, waterfall foam / mist, ripples;
//   * habitat ambience: embers (fire), sparks arcing between conductor stones (electric), bubbles (water), leaf swirls
//     (grass), dust motes (earth), wind streak lines (wind);
//   * base life: nexus crystal glints and rising motes in the team colour, fountain sparkle.
// Budget: 3 draw calls (clouds decal, cutout batch, additive batch), instance caps per quality tier, everything
// culled to the camera footprint, spawning gated by a "calm" field so ambience thins out around fights and lanes.
// Debug: window.__mtAmbient (stats(), toggle(name), clouds, cloudAt(x, z)); URL `?ambient=0` disables the layer.
// Public: app.mtAmbient = { wind:{x,z,speed,gust}, cloudAt(x,z), clouds:{uniforms}, enabled, stats() }.

import { o as heightAt, a as WATER_Y, n as MOUTHS } from '../../assets/height-CVtQdZ3e.js';
import { a as LANES, o as LANE_HW, f as STRUCTS, i as FOUNTAINS, r as CAMPS, v as SDF, u as RIVER, p as BUSH_AT } from '../../assets/map-oE9sOnNc.js';
import { t as PALETTE } from '../../assets/palette-L_rDAXd8.js';
import { AmbientGfx } from './ambient-gfx.js';
import { AmbientClouds } from './ambient-clouds.js';
import { makeLife } from './ambient-life.js';

const QUALITY = { high: 1, medium: 0.75, low: 0.45 };
const HAB_LINES = { brute: 'fire', toads: 'water', warden: 'grass', golems: 'electric', stalkers: 'earth', wolves: 'wind', ...((PALETTE && PALETTE.habitat) || {}) };
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

function segDist(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az, l = dx * dx + dz * dz;
  let t = l > 0 ? ((px - ax) * dx + (pz - az) * dz) / l : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
  const x = ax + dx * t - px, z = az + dz * t - pz; return Math.sqrt(x * x + z * z);
}

export class AmbientSystem {
  constructor(ctx) {
    this.ctx = ctx; this.app = ctx.app;
    let off = false;
    try { off = new URLSearchParams(location.search).get('ambient') === '0'; } catch (e) { /* no location */ }
    this.enabled = !off;
    this.clouds = new AmbientClouds(ctx);
    // one-time terrain height bake for the cloud decal (~114k samples, ~0.2 s, part of boot/loading)
    if (this.enabled) { const t0 = performance.now(); this.clouds.bake(heightAt, 1e9); this.bakeMs = performance.now() - t0; }
    this.gfx = new AmbientGfx(ctx, this.clouds.uniforms);
    this.seed = 0x2545f491;
    this.t = 0; this.frame = 0; this.q = 1; this.quality = 'high';
    this.parts = [];                 // generic particles (see emit)
    this.pool = [];
    this.heat = [];                  // recent fight points {x, z, t}
    this.sig = new Map();            // unit id -> combat signature (attackSeq/hitSeq/castT)
    this.units = { n: 0, x: new Float32Array(256), z: new Float32Array(256), moving: new Uint8Array(256) };
    this.wind = { x: 0.821, z: 0.571, speed: 1.0, gust: 1 };
    this.sun = { x: -0.6, y: 0.7, z: -0.36 };
    this.view = { minX: 0, maxX: 0, minZ: 0, maxZ: 0, cx: 60, cz: 60, gy: 0, ppm: 32 };
    this.off = {};                   // per-feature kill switches (debug)
    this.ms = 0; this.msMax = 0; this.sites = null; this.nexusU = [undefined, undefined];
    this.life = makeLife(this);
    const self = this;
    const api = {
      wind: this.wind,
      cloudAt: (x, z) => this.clouds.cloudAt(x, z),
      clouds: { uniforms: this.clouds.uniforms },
      get enabled() { return self.enabled; },
      stats: () => this.stats(),
    };
    if (this.app) this.app.mtAmbient = api;
    if (typeof window !== 'undefined') window.__mtAmbient = this;
    if (this.app && this.app.on) this.app.on('match', () => this.reset());
  }

  // ------------------------------------------------------------------------------------------ helpers for life
  r() { let s = this.seed; s ^= s << 13; s ^= s >>> 17; s ^= s << 5; this.seed = s >>> 0; return (s >>> 0) / 4294967296; }
  gy(x, z) { return heightAt(x, z); }
  isWater(x, z, depth = 0.06) { return heightAt(x, z) < WATER_Y - depth; }
  get waterY() { return WATER_Y; }
  sdf(x, z) { try { return SDF(x, z); } catch (e) { return 0; } }
  /** tall-grass bush id at a point (-1 = none) */
  bushAt(x, z) { try { return BUSH_AT(x, z); } catch (e) { return -1; } }
  laneDist(x, z) {
    let d = 1e9;
    for (const k in LANES) { const P = LANES[k]; for (let i = 1; i < P.length; i++) d = Math.min(d, segDist(x, z, P[i - 1].x, P[i - 1].y, P[i].x, P[i].y)); }
    return d;
  }
  /** 1 = calm, 0 = a fight is happening right here (recent attacks/hits/casts). */
  calm(x, z) {
    if (this.forceCalm) return 1;
    let c = 1;
    for (const h of this.heat) {
      const age = this.t - h.t, k = 1 - sstep(3, 5, age);
      if (k <= 0) continue;
      const d = Math.hypot(x - h.x, z - h.z);
      c = Math.min(c, 1 - k * (1 - sstep(4.5, 9, d)));
    }
    return c;
  }
  /** nearest unit (any kind, alive) -> distance and direction away from it */
  nearestUnit(x, z) {
    const U = this.units; let best = 1e9, bx = 0, bz = 0;
    for (let i = 0; i < U.n; i++) { const dx = x - U.x[i], dz = z - U.z[i], d = dx * dx + dz * dz; if (d < best) { best = d; bx = dx; bz = dz; } }
    const d = Math.sqrt(best); return { d, dx: d > 1e-4 ? bx / d : 1, dz: d > 1e-4 ? bz / d : 0 };
  }
  /** is a world point inside the camera view (NDC with margin)? */
  inView(x, y, z, m = 0.1) {
    const e = this.vp; if (!e) return true;
    const cx = e[0] * x + e[4] * y + e[8] * z + e[12], cy = e[1] * x + e[5] * y + e[9] * z + e[13], w = e[3] * x + e[7] * y + e[11] * z + e[15];
    if (w <= 0.01) return false;
    const lim = 1 + m; return Math.abs(cx / w) <= lim && Math.abs(cy / w) <= lim;
  }
  /** random ground point in the view footprint satisfying pred(x, z, gy) (or null after `tries`) */
  randInView(pred, tries = 8, m = 0.05) {
    const V = this.view;
    for (let i = 0; i < tries; i++) {
      const x = V.minX + this.r() * (V.maxX - V.minX), z = V.minZ + this.r() * (V.maxZ - V.minZ), g = heightAt(x, z);
      if (!this.inView(x, g, z, m)) continue;
      if (!pred || pred(x, z, g)) return { x, z, g };
    }
    return null;
  }
  /** the team's nexus unit (undefined = unknown, null = destroyed) */
  nexusUnit(team) { return this.nexusU[team]; }
  /** sun-projected ground offset for something `h` metres above the ground */
  shadowOff(h) { const s = this.sun, k = h / Math.max(0.25, s.y); return { x: -s.x * k, z: -s.z * k }; }
  /** world ground height used for ambient placement: never below the water surface */
  surf(x, z) { return Math.max(heightAt(x, z), WATER_Y); }

  /**
   * Generic particle. o: {g, frames:[...]|null (played once, or cycled with loop:true), f, fps, loop, x,y,z, vx,vy,vz, gy (gravity, up +), drag, sway, swf, life,
   * a, fin, fout, add, r,g,b, gain, sun, ground, flip, land (lies on the ground when it lands), rest, buoy (rides
   * the water surface), calmFade}
   */
  emit(o) {
    if (this.parts.length >= this.cap) return null;
    const p = this.pool.pop() || {};
    p.g = o.g; p.frames = o.frames || null; p.f = o.f || 0; p.fps = o.fps || 0; p.loop = !!o.loop;
    p.x = o.x; p.y = o.y; p.z = o.z; p.vx = o.vx || 0; p.vy = o.vy || 0; p.vz = o.vz || 0;
    p.grav = o.grav || 0; p.drag = o.drag || 0; p.sway = o.sway || 0; p.swf = o.swf || 1; p.sph = this.r() * 6.283;
    p.life = o.life || 1; p.t = 0; p.a = o.a ?? 1; p.fin = o.fin ?? 0.1; p.fout = o.fout ?? 0.25;
    p.add = !!o.add; p.r = o.r ?? 1; p.gg = o.gg ?? 1; p.b = o.b ?? 1; p.gain = o.gain ?? 1; p.sun = o.sun || 0;
    p.ground = !!o.ground; p.flip = !!o.flip; p.land = !!o.land; p.rest = o.rest || 0; p.landed = -1; p.wind = o.wind || 0;
    p.unlit = !!o.unlit; p.front = !!o.front; p.calmFade = o.calmFade ?? 1; p.cf = 1; p.wob = o.wob || 0;
    this.parts.push(p); return p;
  }

  stepParts(dt) {
    const P = this.parts, W = this.wind;
    let n = 0;
    for (let i = 0; i < P.length; i++) {
      const p = P[i];
      p.t += dt;
      if (p.t >= p.life) { this.pool.push(p); continue; }
      if (p.landed < 0) {
        if (p.drag) { const k = Math.exp(-p.drag * dt); p.vx *= k; p.vy *= k; p.vz *= k; }
        p.vy += p.grav * dt;
        let sx = 0, sz = 0;
        if (p.sway) { const s = Math.sin(p.t * p.swf + p.sph) * p.sway; sx = s * -W.z; sz = s * W.x; }
        const wk = p.wind * W.speed * W.gust;
        p.x += (p.vx + sx + W.x * wk) * dt; p.y += p.vy * dt; p.z += (p.vz + sz + W.z * wk) * dt;
        if (p.land) { const g = this.surf(p.x, p.z) + 0.02; if (p.y <= g) { p.y = g; p.landed = p.t; p.life = Math.min(p.life, p.t + p.rest); } }
      }
      if (p.calmFade < 1) { const c = this.calm(p.x, p.z); p.cf = Math.max(0, Math.min(p.cf + (c < 0.5 ? -dt * 3 : dt), 1)); if (p.cf <= 0) { this.pool.push(p); continue; } }
      P[n++] = p;
    }
    P.length = n;
  }

  drawParts() {
    const G = this.gfx;
    for (const p of this.parts) {
      if (!this.inView(p.x, p.y, p.z, 0.08)) continue;
      const u = p.t / p.life;
      let a = p.a;
      if (p.fin > 0 && u < p.fin) a *= u / p.fin;
      if (p.fout > 0 && u > 1 - p.fout) a *= (1 - u) / p.fout;
      if (p.cf < 1) a *= p.cf;
      if (a <= 0.01) continue;
      let f = p.f;
      if (p.frames) f = p.landed >= 0 ? p.frames[0] : p.loop ? p.frames[Math.floor(p.t * p.fps + p.sph) % p.frames.length] : p.frames[Math.min(p.frames.length - 1, Math.floor(p.t * p.fps))];
      else if (p.fps) f = p.f + Math.floor(p.t * p.fps);
      G.push(p.g, f, p.x, p.y, p.z, { add: p.add, a, r: p.r, g: p.gg, b: p.b, gain: p.gain, sun: p.sun, ground: p.ground || p.landed >= 0, flip: p.flip, unlit: p.unlit, front: p.front });
    }
  }

  // ------------------------------------------------------------------------------------------ world scan
  scanSites() {
    const S = { habitats: [], nexus: [], fountains: [], falls: [], glows: [] };
    for (const c of CAMPS || []) {
      const key = String(c.id).replace(/^(blue|red)_/, '');
      const line = HAB_LINES[key];
      if (line && !c.epic) S.habitats.push({ x: c.x, z: c.y, line, side: c.side, acc: 0 });
    }
    for (const s of STRUCTS || []) if (s.kind === 'nexus') S.nexus.push({ x: s.x, z: s.y, team: s.team, acc: 0 });
    for (const f of FOUNTAINS || []) S.fountains.push({ x: f.x, z: f.y, team: f.team, acc: 0 });
    // waterfall lips: march from each river mouth outward until the ground falls away
    for (const m of MOUTHS || []) {
      let lip = null;
      for (let d = -2; d < 40; d += 0.25) {
        const x = m.x + m.dx * d, z = m.y + m.dy * d;
        if (heightAt(x, z) < WATER_Y - 1.2) { lip = { x: m.x + m.dx * (d - 0.4), z: m.y + m.dy * (d - 0.4) }; break; }
      }
      if (lip) S.falls.push({ x: lip.x, z: lip.z, dx: m.dx, dz: m.dy, acc: 0, w: (RIVER && RIVER.halfWidth) || 4 });
    }
    // world-art glow points (crystals, conductor crowns, lanterns...) for fireflies / sparks
    const wa = this.ctx.registry && this.ctx.registry.get && this.ctx.registry.get('world-art');
    const glows = (wa && wa.props && wa.props.glows) || [];
    for (const g of glows) {
      const c = g.color || [1, 1, 1];
      S.glows.push({ x: g.x, y: g.y, z: g.z, c, size: g.size || 2 });
    }
    // conductor stones: yellow glow crowns inside an electric habitat
    for (const h of S.habitats) {
      if (h.line !== 'electric') continue;
      h.stones = S.glows.filter((g) => Math.hypot(g.x - h.x, g.z - h.z) < 10 && g.c[0] > 0.9 && g.c[1] > 0.75 && g.c[2] < 0.6);
    }
    // prop records (tree canopies, flowers, lily pads) when world-art exposes them
    S.records = (wa && wa.props && (wa.props.records || wa.props.instances)) || null;
    S.trees = []; S.flowers = []; S.lilies = [];
    if (Array.isArray(S.records)) for (const r of S.records) {
      const t = r.tpl; if (!t) continue;
      const hgt = (t.maxY || 0) * (r.sy || 1), rad = (t.radius || 0) * (r.sx || 1);
      if (hgt > 2.6 && rad > 1.2) S.trees.push({ x: r.x, z: r.z, y: r.y + hgt * 0.8, r: rad * 0.8 });
      else if (t.kind === 'flowers' || t.flowers) S.flowers.push({ x: r.x, z: r.z });
      else if (t.kind === 'lily' || t.lily || (Math.abs(r.y - WATER_Y) < 0.05 && hgt < 0.15)) S.lilies.push({ x: r.x, y: r.y, z: r.z });
    }
    return S;
  }

  // ------------------------------------------------------------------------------------------ frame
  reset() { for (const p of this.parts) this.pool.push(p); this.parts.length = 0; this.heat.length = 0; this.sig.clear(); this.nexusU = [undefined, undefined]; if (this.life) this.life.reset(); }

  updateView() {
    const cam = this.ctx.camera; cam.updateMatrixWorld();
    if (!this._m) this._m = new this.ctx.THREE.Matrix4();
    this._m.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
    this.vp = this._m.elements;
    // ground footprint: rays through the 4 screen corners onto the plane at the focus ground height
    const e = cam.matrixWorld.elements, ox = e[12], oy = e[13], oz = e[14];
    const inv = cam.projectionMatrixInverse.elements;
    const V = this.view;
    const fdx = -e[8], fdy = -e[9], fdz = -e[10];
    const tf = fdy < -0.05 ? (oy - 0) / -fdy : 30;
    V.cx = ox + fdx * tf; V.cz = oz + fdz * tf;
    const gy = this.view.gy = Math.max(WATER_Y, heightAt(V.cx, V.cz));
    let minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9;
    for (const [nx, ny] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const w = inv[3] * nx + inv[7] * ny + inv[11] * 0.5 + inv[15];
      const px = (inv[0] * nx + inv[4] * ny + inv[8] * 0.5 + inv[12]) / w, py = (inv[1] * nx + inv[5] * ny + inv[9] * 0.5 + inv[13]) / w, pz = (inv[2] * nx + inv[6] * ny + inv[10] * 0.5 + inv[14]) / w;
      let dx = e[0] * px + e[4] * py + e[8] * pz, dy = e[1] * px + e[5] * py + e[9] * pz, dz = e[2] * px + e[6] * py + e[10] * pz;
      const l = Math.hypot(dx, dy, dz) || 1; dx /= l; dy /= l; dz /= l;
      const t = dy < -0.02 ? Math.min(90, (oy - gy) / -dy) : 90;
      const x = ox + dx * t, z = oz + dz * t;
      minX = Math.min(minX, x); maxX = Math.max(maxX, x); minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
    }
    V.minX = minX - 1.5; V.maxX = maxX + 1.5; V.minZ = minZ - 1.5; V.maxZ = maxZ + 1.5;
    V.area = (V.maxX - V.minX) * (V.maxZ - V.minZ);
  }

  updateUnits(f) {
    const w = f.world, U = this.units, a = f.alpha ?? 1;
    U.n = 0;
    if (!w || !w.unitList) return;
    for (const u of w.unitList) {
      if (u && u.kind === 'nexus' && (u.team === 0 || u.team === 1)) this.nexusU[u.team] = u.alive ? u : null;
      if (!u || !u.alive || u.removed) continue;
      const x = u.prevX + (u.x - u.prevX) * a, z = u.prevY + (u.y - u.prevY) * a;
      // critters react to creatures, not to buildings
      const bld = u.kind === 'tower' || u.kind === 'inhibitor' || u.kind === 'nexus' || u.kind === 'structure';
      if (!bld && U.n < U.x.length) { U.x[U.n] = x; U.z[U.n] = z; U.moving[U.n] = u.moving ? 1 : 0; U.n++; }
      const s = (u.attackSeq | 0) * 3 + (u.hitSeq | 0) * 7 + (u.castT ? Math.round(u.castT * 10) : 0);
      const prev = this.sig.get(u.id);
      this.sig.set(u.id, s);
      if (prev !== undefined && prev !== s) this.addHeat(x, z);
    }
    if (this.sig.size > 600) this.sig.clear();
    // drop old heat
    let n = 0; for (const h of this.heat) if (this.t - h.t < 5) this.heat[n++] = h; this.heat.length = n;
  }
  addHeat(x, z) {
    for (const h of this.heat) if (Math.abs(h.x - x) < 3 && Math.abs(h.z - z) < 3) { h.t = this.t; h.x = (h.x + x) / 2; h.z = (h.z + z) / 2; return; }
    if (this.heat.length < 48) this.heat.push({ x, z, t: this.t });
  }

  update(f) {
    const T0 = performance.now();
    const app = f.app || this.app, w = f.world;
    this.gfx.group.visible = this.enabled; this.clouds.mesh.visible = false;
    if (!this.enabled || !w) return;
    const pipe = this.ctx.pipeline;
    this.quality = (pipe && pipe.quality) || 'high';
    this.q = QUALITY[this.quality] ?? 1;
    this.cap = Math.round(900 * this.q);
    const ts = app && app.paused ? 0 : app && app.timeScale != null ? Math.min(1, app.timeScale) : 1;
    const dt = Math.min(0.1, Math.max(0, f.dt || 0)) * ts;
    this.t += dt; this.dt = dt; this.frame++;
    if (!this.sites) this.sites = this.scanSites();
    // wind + sun
    const wa = this.ctx.registry && this.ctx.registry.get && this.ctx.registry.get('world-art');
    const uw = wa && wa.shared && wa.shared.uWind && wa.shared.uWind.value;
    if (uw) { const l = Math.hypot(uw.x, uw.y) || 1; this.wind.x = uw.x / l; this.wind.z = uw.y / l; }
    const t = this.t;
    this.wind.gust = 1 + 0.32 * Math.sin(t * 0.31) * Math.sin(t * 0.117 + 1.3) + 0.12 * Math.sin(t * 1.7);
    this.wind.speed = 1.0;
    const L = pipe && pipe.lights;
    if (L && L.sunDir) { this.sun.x = L.sunDir.x; this.sun.y = L.sunDir.y; this.sun.z = L.sunDir.z; }
    this.updateView();
    this.updateUnits(f);
    // clouds (decal off on the low tier: it is a full-screen blended layer)
    this.clouds.setBanded(!!(app && app.mtPixel));
    if (!this.off.clouds) this.clouds.update(dt, { x: this.wind.x, z: this.wind.z, speed: 1.15 }, this.view, heightAt, this.quality !== 'low');
    // life
    this.gfx.beginFrame(app);
    this.life.update(dt);
    this.stepParts(dt);
    this.drawParts();
    this.life.draw();
    this.gfx.endFrame();
    const ms = performance.now() - T0;
    this.ms = this.ms ? this.ms * 0.95 + ms * 0.05 : ms; if (this.frame > 5 && ms > this.msMax) this.msMax = ms;
  }

  stats() {
    return { ms: +this.ms.toFixed(3), msMax: +this.msMax.toFixed(2), parts: this.parts.length, cut: this.gfx.cut.count, add: this.gfx.add.count,
      quality: this.quality, heat: this.heat.length, units: this.units.n, cloudRebuilds: this.clouds.rebuilds, cloudRebuildMs: +(this.clouds.rebuildMs || 0).toFixed(2), bakeMs: Math.round(this.bakeMs || 0), view: { ...this.view }, life: this.life.stats() };
  }
  /** debug / captures: slide the cloud field so a cloud edge (shadow amount ~0.5) sits at map point (x, z) */
  cloudEdgeAt(x, z) {
    const C = this.clouds, ox = C.ox, oz = C.oz;
    for (let i = 0; i < 400; i++) {
      C.ox = ox + i * 0.9; C.oz = oz + i * 0.37;
      const a = C.cloudAt(x, z), b = C.cloudAt(x + 3, z);
      if (a > 0.35 && a < 0.65 && Math.abs(a - b) > 0.12) return true;
    }
    C.ox = ox; C.oz = oz; return false;
  }
  /** debug: __mtAmbient.spawn('fish'|'birds'|'butterfly'|'dragonfly', x, z) */
  spawn(kind, x, z) { if (!this.sites) return false; return this.life.debugSpawn(kind, x, z); }
  toggle(name, on) { this.off[name] = on === undefined ? !this.off[name] : !on; return !this.off[name]; }
  dispose() { this.gfx.dispose(); this.clouds.dispose(); }
}
