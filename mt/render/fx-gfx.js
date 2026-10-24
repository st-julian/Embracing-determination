// mt/render/fx-gfx.js — GPU side of the monster-trainer VFX: 3 instanced batches (3 draw calls total) + a CPU
// particle system for crisp PIXEL-ART particles (Gen-5 battle-effect look). Owner: VFX specialist.
//
//   pix  : index-coded pixel glyphs (fx-atlas.js) coloured through a palette texture, alpha-tested, dithered fade
//   add  : same glyphs, additive (light accents that bloom)
//   spr  : full-colour art bitmaps (capture orb frames, white evolution/capture silhouettes) from game/art/sprites
//
// Smooth HD light (glows, flashes, decals, shockwaves) keeps using the legacy `vfx` helpers; this module adds the
// chunky pixel layer on top. Everything is render-only (no sim access besides reading positions).

import { buildFxAtlas, buildPaletteData, PAL_ROW, PAL_ROWS } from './fx-atlas.js';
import { o as heightAt } from '../../assets/height-CVtQdZ3e.js';

/** Default world units per atlas texel (= 1 / art pixels per metre). Live value: app.mtPixel.ppm (shared world pixel grid). */
export const TEXEL = 1 / 32;
/** Additive (translucent) blending is reserved for light: sparkles, glow motes and light pillars. Everything else is an
 *  opaque crisp pixel shape (blind-test R1: translucent smears muddied the focal point). */
const ADDITIVE_OK = new Set(['twinkle', 'pillar', 'dot', 'blob']);

const VS = `
attribute vec4 iPos; attribute vec4 iSize; attribute vec4 iUv; attribute vec4 iMisc;
uniform float uLean; uniform float uBias;
varying vec2 vUv; varying vec4 vMisc; varying vec2 vTex;
void main() {
  vec2 q = position.xy;
  vec3 camR = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
  vec3 camU = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
  vec3 camB = vec3(viewMatrix[0][2], viewMatrix[1][2], viewMatrix[2][2]);
  vec3 R = camR, U = camU;
  if (iPos.w > 0.5 && iPos.w < 1.5) { R = vec3(1.0, 0.0, 0.0); U = vec3(0.0, 0.0, -1.0); }
  else if (iPos.w > 1.5) {
    R = normalize(vec3(camR.x, 0.0, camR.z));
    vec3 F = normalize(vec3(-camB.x, 0.0, -camB.z));
    U = vec3(0.0, cos(uLean), 0.0) + F * sin(uLean);
  }
  float c = cos(iSize.z), s = sin(iSize.z);
  vec2 l = vec2((q.x - 0.5) * iSize.x, (q.y - iSize.w) * iSize.y);
  vec2 r = vec2(l.x * c - l.y * s, l.x * s + l.y * c);
  // sprites.js pulls monster sprites ~0.9 m toward the camera in depth: billboards need a similar pull to read on top
  // of the creature they hit; ground-flat quads only get a small one
  float bias = (iPos.w > 0.5 && iPos.w < 1.5) ? min(uBias, 0.15) : uBias;
  vec3 wp = iPos.xyz + R * r.x + U * r.y + camB * bias;
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
  vUv = vec2(iUv.x + q.x * iUv.z, iUv.y + (1.0 - q.y) * iUv.w);
  vTex = vUv;
  vMisc = iMisc;
}`;

const BAYER = `
float bayer4(vec2 p) {
  vec2 a = mod(floor(p), 4.0);
  float i = a.x + a.y * 4.0;
  // 4x4 ordered dither thresholds
  if (i < 0.5) return 0.03; if (i < 1.5) return 0.53; if (i < 2.5) return 0.16; if (i < 3.5) return 0.66;
  if (i < 4.5) return 0.78; if (i < 5.5) return 0.28; if (i < 6.5) return 0.91; if (i < 7.5) return 0.41;
  if (i < 8.5) return 0.22; if (i < 9.5) return 0.72; if (i < 10.5) return 0.09; if (i < 11.5) return 0.59;
  if (i < 12.5) return 0.97; if (i < 13.5) return 0.47; if (i < 14.5) return 0.84; return 0.34;
}`;

const FS_PIX = `
uniform sampler2D uAtlas; uniform sampler2D uPal; uniform vec2 uAtlasSize; uniform float uTag;
varying vec2 vUv; varying vec4 vMisc; varying vec2 vTex;
${BAYER}
void main() {
  vec4 t = texture2D(uAtlas, vUv);
  if (t.a < 0.5) discard;
  if (vMisc.y < 0.999 && vMisc.y <= bayer4(vTex * uAtlasSize)) discard;
  float idx = floor(t.r * 255.0 / 40.0 + 0.5);
  vec3 c = texture2D(uPal, vec2((idx + 0.5) / 8.0, (vMisc.z + 0.5) / ${PAL_ROWS.toFixed(1)})).rgb;
  c = pow(c, vec3(2.2));
  float g = vMisc.x * (idx > 4.5 ? 1.0 + vMisc.w : 1.0);
  gl_FragColor = vec4(c * g, uTag);      // 0.75 = 'carries its own outline' tag for the env outline pass
}`;

const FS_ADD = `
uniform sampler2D uAtlas; uniform sampler2D uPal; uniform float uAddK;
varying vec2 vUv; varying vec4 vMisc; varying vec2 vTex;
void main() {
  vec4 t = texture2D(uAtlas, vUv);
  if (t.a < 0.5) discard;
  float idx = floor(t.r * 255.0 / 40.0 + 0.5);
  if (idx < 1.5) discard;                 // additive glyphs drop their outline
  vec3 c = pow(texture2D(uPal, vec2((idx + 0.5) / 8.0, (vMisc.z + 0.5) / ${PAL_ROWS.toFixed(1)})).rgb, vec3(2.2));
  gl_FragColor = vec4(c * vMisc.x * vMisc.y * uAddK, 1.0);
}`;

const FS_SHADE = `
varying vec2 vUv; varying vec4 vMisc; varying vec2 vTex;
void main() {
  float d = length(vUv * 2.0 - 1.0);
  float a = (1.0 - smoothstep(vMisc.y, 1.0, d)) * vMisc.x;
  if (vMisc.z > 0.0) a *= smoothstep(vMisc.z * 0.75, vMisc.z, d);     // spotlight hole in the middle
  if (a < 0.004) discard;
  gl_FragColor = vec4(0.0, 0.0, 0.0, a);
}`;

const FS_SPR = `
uniform sampler2D uSpr; uniform vec2 uSprSize; uniform float uTag;
varying vec2 vUv; varying vec4 vMisc; varying vec2 vTex;
${BAYER}
void main() {
  vec4 t = texture2D(uSpr, vUv);
  if (t.a < 0.5) discard;
  if (vMisc.y < 0.999 && vMisc.y <= bayer4(vTex * uSprSize)) discard;
  vec3 c = pow(t.rgb, vec3(2.2));
  c = mix(c, vec3(1.0, 0.98, 0.94) * (1.0 + vMisc.w), clamp(vMisc.z, 0.0, 1.0));
  gl_FragColor = vec4(c * vMisc.x, uTag);
}`;

class Batch {
  constructor(T, parent, mat, name, cap) {
    this.T = T; this.cap = 0; this.count = 0; this.max = cap;
    const geo = this.geo = new T.InstancedBufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0], 3));
    geo.setIndex([0, 1, 2, 0, 2, 3]);
    geo.boundingSphere = new T.Sphere(new T.Vector3(), 1e5);
    this.mesh = new T.Mesh(geo, mat); this.mesh.frustumCulled = false; this.mesh.name = name; parent.add(this.mesh);
    this.a = {}; this.ensure(256);
  }
  ensure(n) {
    if (n <= this.cap) return;
    let c = Math.max(64, this.cap); while (c < n) c *= 2;
    for (const k of ['iPos', 'iSize', 'iUv', 'iMisc']) {
      const arr = new Float32Array(c * 4); if (this.a[k]) arr.set(this.a[k]); this.a[k] = arr;
      this.geo.setAttribute(k, new this.T.InstancedBufferAttribute(arr, 4).setUsage(this.T.DynamicDrawUsage));
    }
    this.cap = c;
  }
  begin() { this.count = 0; }
  /** push one quad. Returns false when the batch is at its budget. */
  push(x, y, z, mode, w, h, rot, aV, u0, v0, du, dv, m0, m1, m2, m3) {
    if (this.count >= this.max) return false;
    if (this.count >= this.cap) this.ensure(this.count + 1);
    const i = this.count++ * 4, A = this.a;
    A.iPos[i] = x; A.iPos[i + 1] = y; A.iPos[i + 2] = z; A.iPos[i + 3] = mode;
    A.iSize[i] = w; A.iSize[i + 1] = h; A.iSize[i + 2] = rot; A.iSize[i + 3] = aV;
    A.iUv[i] = u0; A.iUv[i + 1] = v0; A.iUv[i + 2] = du; A.iUv[i + 3] = dv;
    A.iMisc[i] = m0; A.iMisc[i + 1] = m1; A.iMisc[i + 2] = m2; A.iMisc[i + 3] = m3;
    return true;
  }
  end() {
    this.geo.instanceCount = this.count; this.mesh.visible = this.count > 0;
    if (this.count) for (const k in this.a) { const at = this.geo.attributes[k]; at.needsUpdate = true; at.clearUpdateRanges && (at.clearUpdateRanges(), at.addUpdateRange(0, this.count * 4)); }
  }
  dispose() { this.mesh.removeFromParent(); this.geo.dispose(); this.mesh.material.dispose(); }
}

/** Runtime atlas for full-colour art bitmaps ({w,h,data,ax,ay}); shelf-packed, lazily filled. */
class SprAtlas {
  constructor(T, w = 1024, h = 1024) {
    this.T = T; this.w = w; this.h = h; this.data = new Uint8Array(w * h * 4);
    this.tex = new T.DataTexture(this.data, w, h, T.RGBAFormat, T.UnsignedByteType);
    this.tex.magFilter = this.tex.minFilter = T.NearestFilter; this.tex.generateMipmaps = false; this.tex.flipY = false;
    this.tex.needsUpdate = true;
    this.map = new Map(); this.x = 1; this.y = 1; this.rowH = 0; this.dirty = false;
  }
  has(key) { return this.map.has(key); }
  get(key) { return this.map.get(key) || null; }
  /** add a bitmap under key; returns the frame record or null when full. */
  add(key, bmp) {
    if (this.map.has(key)) return this.map.get(key);
    if (!bmp || !bmp.w) return null;
    if (this.x + bmp.w + 1 > this.w) { this.x = 1; this.y += this.rowH + 1; this.rowH = 0; }
    if (this.y + bmp.h + 1 > this.h) return null;
    for (let j = 0; j < bmp.h; j++) this.data.set(bmp.data.subarray(j * bmp.w * 4, (j + 1) * bmp.w * 4), ((this.y + j) * this.w + this.x) * 4);
    const f = { u0: this.x / this.w, v0: this.y / this.h, du: bmp.w / this.w, dv: bmp.h / this.h, w: bmp.w, h: bmp.h,
      ax: bmp.ax ?? bmp.w / 2, ay: bmp.ay ?? bmp.h };
    this.map.set(key, f); this.x += bmp.w + 1; this.rowH = Math.max(this.rowH, bmp.h); this.dirty = true;
    return f;
  }
  flush() { if (this.dirty) { this.tex.needsUpdate = true; this.dirty = false; } }
}

const CAPS = { high: 2800, medium: 1900, low: 1100 };

/** One pixel particle. Plain pooled object. */
function blank() {
  return { on: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, g: 0, drag: 0, age: 0, life: 1, delay: 0,
    s0: 1, s1: 1, pop: 0, rot: 0, spin: 0, gl: null, f0: 0, nf: 1, fps: 0, loop: true, pal: 0, gain: 1.2, hot: 0.6,
    blend: 0, mode: 0, aV: 0.5, stretch: 0, fin: 0, fout: 0.3, bounce: -1, flip: 1, sy: 1, align: false,
    oc: false, ocx: 0, ocz: 0, ocy: 0, or0: 0, or1: 0, ow: 0, oa: 0, ovy: 0, follow: -1, fdx: 0, fdz: 0 };
}

export class FxGfx {
  constructor(ctx) {
    const T = this.T = ctx.THREE; this.ctx = ctx;
    const q = ctx.pipeline && ctx.pipeline.quality; this.quality = CAPS[q] ? q : 'high';
    this.q = this.quality === 'high' ? 1 : this.quality === 'medium' ? 0.75 : 0.5;  // emission scale for kits
    this.group = new T.Group(); this.group.name = 'mt-fx'; ctx.scene.add(this.group);
    const A = this.atlas = buildFxAtlas();
    this.glyphs = A.glyphs;
    this.atlasTex = new T.DataTexture(A.data, A.w, A.h, T.RGBAFormat, T.UnsignedByteType);
    this.atlasTex.magFilter = this.atlasTex.minFilter = T.NearestFilter; this.atlasTex.generateMipmaps = false; this.atlasTex.needsUpdate = true;
    this.palTex = new T.DataTexture(buildPaletteData(), 8, PAL_ROWS, T.RGBAFormat, T.UnsignedByteType);
    this.palTex.magFilter = this.palTex.minFilter = T.NearestFilter; this.palTex.generateMipmaps = false; this.palTex.needsUpdate = true;
    this.uLean = { value: 0.45 };
    this.uTag = { value: 1 };
    const common = { uAtlas: { value: this.atlasTex }, uPal: { value: this.palTex }, uAtlasSize: { value: new T.Vector2(A.w, A.h) }, uLean: this.uLean, uTag: this.uTag };
    const pixMat = new T.ShaderMaterial({ vertexShader: VS, fragmentShader: FS_PIX, side: T.DoubleSide,
      uniforms: { ...common, uBias: { value: 1.0 } } });
    // additive colour, destination alpha untouched (keeps the env's material tags: 0.75 sprites, 0.5 foliage)
    const addMat = new T.ShaderMaterial({ vertexShader: VS, fragmentShader: FS_ADD, side: T.DoubleSide, transparent: true, depthWrite: false,
      blending: T.CustomBlending, blendEquation: T.AddEquation, blendSrc: T.OneFactor, blendDst: T.OneFactor, blendSrcAlpha: T.ZeroFactor, blendDstAlpha: T.OneFactor, uniforms: { ...common, uBias: { value: 1.05 }, uAddK: this.uAddK = { value: 1 } } });
    this.sprAtlas = new SprAtlas(T);
    const sprMat = new T.ShaderMaterial({ vertexShader: VS, fragmentShader: FS_SPR, side: T.DoubleSide,
      uniforms: { uSpr: { value: this.sprAtlas.tex }, uSprSize: { value: new T.Vector2(this.sprAtlas.w, this.sprAtlas.h) }, uLean: this.uLean, uBias: { value: 1.05 }, uTag: this.uTag } });
    const cap = CAPS[this.quality];
    this.pix = new Batch(T, this.group, pixMat, 'mt-fx-pix', cap);
    this.add = new Batch(T, this.group, addMat, 'mt-fx-add', Math.round(cap * 0.6));
    this.spr = new Batch(T, this.group, sprMat, 'mt-fx-spr', 96);
    // ground darkening (spotlight for evolution / capture / big moments): multiply-style blend, smooth radial falloff
    // no depth test: base-plaza / structure floors sit above heightAt(); the spotlight dims everything around the subject
    // (sprites included) except the hole in the middle, then additive FX (renderOrder 5) draw bright on top
    const shadeMat = new T.ShaderMaterial({ vertexShader: VS, fragmentShader: FS_SHADE, transparent: true, depthWrite: false, depthTest: false, side: T.DoubleSide,
      blending: T.CustomBlending, blendEquation: T.AddEquation, blendSrc: T.ZeroFactor, blendDst: T.OneMinusSrcAlphaFactor, blendSrcAlpha: T.ZeroFactor, blendDstAlpha: T.OneFactor,
      polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -8, uniforms: { uLean: this.uLean, uBias: { value: 0 } } });
    this.shadeB = new Batch(T, this.group, shadeMat, 'mt-fx-shade', 24);
    this.shadeB.mesh.renderOrder = 10;
    this.shadeQ = [];
    this.pix.mesh.renderOrder = 3; this.spr.mesh.renderOrder = 3; this.add.mesh.renderOrder = 11;
    this.pool = []; this.live = []; this.cap = cap;
    for (let i = 0; i < cap; i++) this.pool.push(blank());
    this.queue = [];     // immediate quads queued between frames (projectile heads drawn from inside vfx.update)
    this.sprQueue = [];
    this.camR = [1, 0, 0]; this.camU = [0, 1, 0];
    this.stats = { live: 0, dropped: 0, peak: 0 };
    this.texel = TEXEL;
  }

  get liveCount() { return this.live.length; }

  /**
   * Emit one pixel particle. o: {glyph, frame?, x,y,z, vx,vy,vz, g (+ = falls), drag, life, delay, size|s0,s1 (in texels ×),
   * px (size in world units, overrides), pop, rot, spin, fps, loop, pal (name|row), gain, hot, blend (0|1), mode (0 bb,1 ground,2 upright),
   * aV, stretch (velocity streak factor), fin, fout, bounce, align (rotate to velocity), orbit:{cx,cz,cy,r0,r1,w,a,vy}, follow, flip}
   */
  emit(o) {
    const g = this.glyphs[o.glyph]; if (!g) return null;
    let p = this.pool.pop();
    if (!p) { this.stats.dropped++; return null; }
    p.on = true; p.gl = g;
    p.x = o.x; p.y = o.y; p.z = o.z; p.vx = o.vx || 0; p.vy = o.vy || 0; p.vz = o.vz || 0;
    p.g = o.g || 0; p.drag = o.drag || 0; p.age = 0; p.life = o.life || 0.6; p.delay = o.delay || 0;
    const base = o.px != null ? o.px : g.w * this.texel * (o.size || 1);
    p.s0 = base * (o.s0 != null ? o.s0 : 1); p.s1 = base * (o.s1 != null ? o.s1 : (o.s0 != null ? o.s0 : 1));
    p.pop = o.pop || 0; p.rot = o.rot || 0; p.spin = o.spin || 0;
    p.nf = g.frames.length; p.f0 = o.frame != null ? Math.min(o.frame, p.nf - 1) : 0;
    p.fps = o.fps != null ? o.fps : 0; p.loop = o.loop !== false;
    if (o.frame != null && o.fps == null) p.nf = 1;           // fixed frame
    p.pal = typeof o.pal === 'number' ? o.pal : PAL_ROW[o.pal] ?? 0;
    p.gain = o.gain != null ? o.gain : 1.15; p.hot = o.hot != null ? o.hot : 0.7;
    p.blend = o.blend && (o.blend === 2 || ADDITIVE_OK.has(o.glyph)) ? 1 : 0; p.mode = o.mode || 0;
    if (o.blend && !p.blend) p.gain = Math.min(p.gain, 1.35);           // additive request downgraded to opaque p.aV = o.aV != null ? o.aV : 0.5;
    p.stretch = o.stretch || 0; p.fin = o.fin || 0; p.fout = o.fout != null ? o.fout : ((p.life < 0.26 && !p.blend) || o.glyph === 'puff' || o.glyph === 'puffBig' ? 0 : 0.3);   // crisp: pops end hard, puffs dissolve by their erosion frames   // short pops end crisp (no dither smear)
    p.bounce = o.bounce != null ? o.bounce : -1; p.align = !!o.align; p.flip = o.flip ? -1 : 1; p.sy = o.sy || 1;
    const ob = o.orbit;
    if (ob) { p.oc = true; p.ocx = ob.cx; p.ocz = ob.cz; p.ocy = ob.cy != null ? ob.cy : o.y; p.or0 = ob.r0; p.or1 = ob.r1 != null ? ob.r1 : ob.r0; p.ow = ob.w || 0; p.oa = ob.a || 0; p.ovy = ob.vy || 0; }
    else p.oc = false;
    p.follow = o.follow != null ? o.follow : -1; p.fdx = 0; p.fdz = 0;
    this.live.push(p);
    return p;
  }

  /** Queue a quad for exactly one frame (projectile heads etc.). */
  now(glyph, frame, x, y, z, sizeWorld, opts = {}) {
    const g = this.glyphs[glyph]; if (!g) return;
    if (opts.blend && opts.blend !== 2 && !ADDITIVE_OK.has(glyph) && opts.gain > 1.35) opts = { ...opts, gain: 1.35 };
    this.queue.push({ g, f: frame % g.frames.length, x, y, z, s: sizeWorld, rot: opts.rot || 0, pal: typeof opts.pal === 'number' ? opts.pal : PAL_ROW[opts.pal] ?? 0,
      gain: opts.gain ?? 1.2, hot: opts.hot ?? 0.8, alpha: opts.alpha ?? 1, blend: opts.blend && (opts.blend === 2 || ADDITIVE_OK.has(glyph)) ? 1 : 0, mode: opts.mode || 0, aV: opts.aV ?? 0.5, sx: opts.sx || 1, sy: opts.sy || 1, flip: opts.flip ? -1 : 1 });
  }

  /** Queue an art-sprite quad for this frame. f = SprAtlas frame; h = world height; anchor 'feet'|'center'. */
  sprNow(f, x, y, z, h, opts = {}) {
    if (!f) return;
    this.sprQueue.push({ f, x, y, z, h, rot: opts.rot || 0, flash: opts.flash || 0, glow: opts.glow || 0, alpha: opts.alpha ?? 1, gain: opts.gain ?? 1.15,
      mode: opts.mode ?? 0, center: !!opts.center, flip: opts.flip ? -1 : 1, sx: opts.sx || 1, sy: opts.sy || 1 });
  }

  /** Darken the ground around (x,z) this frame: radius r, strength 0..1, inner (0..1 = where the falloff starts). */
  shade(x, y, z, r, strength, inner = 0.25, hole = 0) { this.shadeQ.push(x, y, z, r, strength, inner, hole); }

  /** Pixel ring built from tangent segments (keeps sprite-like pixel density at any radius). mode 1 = on ground. */
  ring(x, y, z, r, opts = {}) {
    const g = this.glyphs.seg; if (!g || r <= 0.05) return;
    const n = Math.max(8, Math.min(opts.max || 56, Math.round((Math.PI * 2 * r) / (opts.seg || 0.42))));
    const len = (Math.PI * 2 * r) / n * (opts.gap ?? 1.08), a0 = opts.rot || 0, F = g.frames[opts.thick ? 1 : 0];
    const pal = typeof opts.pal === 'number' ? opts.pal : PAL_ROW[opts.pal] ?? 0, gain = opts.gain ?? 1.6, alpha = opts.alpha ?? 1;
    const add = opts.blend === 2, batch = add ? this.add : this.pix, h = len * (F[5] / F[4]) * (opts.thick ? 1.2 : 1);
    for (let i = 0; i < n; i++) {
      if (opts.dash && (i & 1)) continue;
      const a = a0 + (i / n) * Math.PI * 2, px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r;
      batch.push(px, y, pz, 1, len, h, -a - Math.PI / 2, 0.5, F[0], F[1], F[2], F[3], add ? gain : Math.min(1.5, gain * 0.75), alpha, pal, add ? 0 : 0.8);
    }
  }

  /** Advance + draw. dt in seconds (already time-scaled). follow(id) -> {x,z}|null for attached particles. */
  update(dt, cam, follow) {
    const mp = this.ctx.app && this.ctx.app.mtPixel; this.texel = mp && mp.ppm > 0 ? 1 / mp.ppm : TEXEL; this.uTag.value = mp ? 0.75 : 1;
    const pix = this.pix, add = this.add, spr = this.spr;
    // NB: begin() happened at the end of the previous update (rings/immediates may be pushed in between)
    // camera axes (for velocity-aligned rotation)
    if (cam) {
      const e = cam.matrixWorldInverse.elements;
      this.camR[0] = e[0]; this.camR[1] = e[4]; this.camR[2] = e[8];
      this.camU[0] = e[1]; this.camU[1] = e[5]; this.camU[2] = e[9];
    }
    const L = this.live, R = this.camR, U = this.camU;
    let w = 0;
    for (let i = 0; i < L.length; i++) {
      const p = L[i];
      if (p.delay > 0) { p.delay -= dt; L[w++] = p; continue; }
      p.age += dt;
      if (p.age >= p.life) { p.on = false; this.pool.push(p); continue; }
      L[w++] = p;
      const k = p.age / p.life;
      if (p.oc) {
        const r = p.or0 + (p.or1 - p.or0) * k, a = p.oa + p.ow * p.age;
        let cx = p.ocx, cz = p.ocz;
        if (p.follow >= 0 && follow) { const f = follow(p.follow); if (f) { cx = f.x; cz = f.z; } }
        p.x = cx + Math.cos(a) * r; p.z = cz + Math.sin(a) * r; p.y = p.ocy + p.ovy * p.age;
      } else {
        if (p.drag) { const d = Math.exp(-p.drag * dt); p.vx *= d; p.vy *= d; p.vz *= d; }
        p.vy -= p.g * dt;
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
        if (p.follow >= 0 && follow) {
          const f = follow(p.follow);
          if (f) { if (p.fdx === 0 && p.fdz === 0) { p.fdx = f.x; p.fdz = f.z; } p.x += f.x - p.fdx; p.z += f.z - p.fdz; p.fdx = f.x; p.fdz = f.z; }
        }
        if (p.bounce >= 0 && p.vy < 0) {
          const gy = heightAt(p.x, p.z) + 0.04;
          if (p.y < gy) { p.y = gy; p.vy = -p.vy * p.bounce; p.vx *= 0.6; p.vz *= 0.6; p.spin *= 0.5; if (p.vy < 0.4) { p.vy = 0; p.g = 0; p.vx *= 0.3; p.vz *= 0.3; } }
        }
      }
      p.rot += p.spin * dt;
      // size curve: linear s0->s1, with optional 'pop' overshoot at birth
      let s = p.s0 + (p.s1 - p.s0) * k;
      if (p.pop) s *= k < 0.15 ? 0.4 + (k / 0.15) * (0.6 + p.pop) : 1 + p.pop * Math.max(0, 1 - (k - 0.15) / 0.2);
      // frame
      const fr = p.gl.frames;
      let fi = p.f0;
      if (p.nf > 1) {
        if (p.fps > 0) { const n = Math.floor(p.age * p.fps); fi = p.loop ? (p.f0 + n) % fr.length : Math.min(fr.length - 1, p.f0 + n); }
        else fi = Math.min(fr.length - 1, Math.floor(k * fr.length));
      }
      const F = fr[fi];
      // alpha
      let a = 1;
      if (p.fin > 0 && k < p.fin) a = k / p.fin;
      if (p.fout > 0 && k > 1 - p.fout) a = Math.min(a, (1 - k) / p.fout);
      if (!p.blend) { const qs = F[4] * this.texel * 0.5; s = Math.max(qs, Math.round(s / qs) * qs); }   // pixel-grid scale steps
      let rot = p.rot, sx = s * p.flip, sy = s * p.sy * F[5] / F[4];
      if (p.align || p.stretch) {
        const vx = p.oc ? -Math.sin(p.oa + p.ow * p.age) * p.ow : p.vx, vy = p.oc ? p.ovy : p.vy, vz = p.oc ? Math.cos(p.oa + p.ow * p.age) * p.ow : p.vz;
        if (p.mode === 1) rot = Math.atan2(-vz, vx);
        else rot = Math.atan2(vx * U[0] + vy * U[1] + vz * U[2], vx * R[0] + vy * R[1] + vz * R[2]);
        if (p.stretch) sx *= 1 + p.stretch * Math.min(3, Math.hypot(vx, vy, vz) * 0.12);
      }
      if (p.blend) add.push(p.x, p.y, p.z, p.mode, sx, sy, rot, p.aV, F[0], F[1], F[2], F[3], p.gain, a, p.pal, 0);
      else pix.push(p.x, p.y, p.z, p.mode, sx, sy, rot, p.aV, F[0], F[1], F[2], F[3], p.gain, a, p.pal, p.hot);
    }
    L.length = w;
    for (const o of this.queue) {
      const F = o.g.frames[o.f], sx = o.s * o.sx * o.flip, sy = o.s * (o.sy || 1) * F[5] / F[4];
      if (o.blend) add.push(o.x, o.y, o.z, o.mode, sx, sy, o.rot, o.aV, F[0], F[1], F[2], F[3], o.gain, o.alpha, o.pal, 0);
      else pix.push(o.x, o.y, o.z, o.mode, sx, sy, o.rot, o.aV, F[0], F[1], F[2], F[3], o.gain, o.alpha, o.pal, o.hot);
    }
    this.queue.length = 0;
    for (const o of this.sprQueue) {
      const f = o.f, h = o.h * o.sy, wv = o.h * (f.w / f.h) * o.sx * o.flip;
      // anchor: feet (ay/h from top) or centre
      const aV = o.center ? 0.5 : 1 - f.ay / f.h;
      spr.push(o.x, o.y, o.z, o.mode, wv, h, o.rot, aV, f.u0, f.v0, f.du, f.dv, o.gain, o.alpha, o.flash, o.glow);
    }
    this.sprQueue.length = 0;
    const S = this.shadeB, Q = this.shadeQ; S.begin();
    for (let i = 0; i < Q.length; i += 7) S.push(Q[i], Q[i + 1] + 0.08, Q[i + 2], 1, Q[i + 3] * 2, Q[i + 3] * 2, 0, 0.5, 0, 0, 1, 1, Math.min(0.85, Q[i + 4]), Q[i + 5], Q[i + 6] / Q[i + 3], 0);
    Q.length = 0; S.end();
    this.sprAtlas.flush();
    // crowded additive layers dim each other instead of stacking to white
    this.uAddK.value = 1 / (1 + Math.max(0, add.count - 24) / 48);
    pix.end(); add.end(); spr.end();
    this._ended = true;
    this.stats.live = L.length; if (L.length > this.stats.peak) this.stats.peak = L.length;
  }

  /** called once per frame AFTER the GPU arrays were uploaded: open the batches for the next frame's immediates */
  beginFrame() { if (this._ended) { this.pix.begin(); this.add.begin(); this.spr.begin(); this._ended = false; } }

  clear() { for (const p of this.live) { p.on = false; this.pool.push(p); } this.live.length = 0; this.queue.length = 0; this.sprQueue.length = 0; }

  dispose() { this.pix.dispose(); this.add.dispose(); this.spr.dispose(); this.shadeB.dispose(); this.atlasTex.dispose(); this.palTex.dispose(); this.sprAtlas.tex.dispose(); this.ctx.scene.remove(this.group); }
}
