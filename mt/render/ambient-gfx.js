// mt/render/ambient-gfx.js — GPU side of the ambient-life layer: two instanced batches of pixel-art glyphs
// (2 draw calls), drawn exactly like the unit sprites so the whole frame shares one pixel grid:
//   * every glyph is a screen-aligned quad whose 3D anchor is projected and SNAPPED to the internal pixel grid
//     (app.mtPixel internalW/H), sized in whole internal pixels per art pixel -> crisp, square, non-swimming pixels;
//   * `cut`  = opaque cutout pixels lit like the sprites (sun / shade from the sun shadow map, cloud shadow), fades
//              by ordered (Bayer) dither instead of translucency (no sorting, no smears);
//   * `add`  = additive light pixels (glints, embers, fireflies, sparks) for things that emit or reflect light.
// Neither writes depth (the toon-outline post pass must not ink 5-pixel critters); both depth-test, so terrain,
// trees and units occlude them. Owner: world animation / ambient-life artist.

import { buildAmbientAtlas } from './ambient-atlas.js';

const BAYER = `
float bayer4(vec2 p) {
  vec2 a = mod(floor(p), 4.0);
  float i = a.x + a.y * 4.0;
  if (i < 0.5) return 0.03; if (i < 1.5) return 0.53; if (i < 2.5) return 0.16; if (i < 3.5) return 0.66;
  if (i < 4.5) return 0.78; if (i < 5.5) return 0.28; if (i < 6.5) return 0.91; if (i < 7.5) return 0.41;
  if (i < 8.5) return 0.22; if (i < 9.5) return 0.72; if (i < 10.5) return 0.09; if (i < 11.5) return 0.59;
  if (i < 12.5) return 0.97; if (i < 13.5) return 0.47; if (i < 14.5) return 0.84; return 0.34;
}`;

// iPos  = world anchor xyz, flags (1 flip, 2 ground decal, 4 unlit, 8 front: 2.5 m depth pull for accents on big props)
// iRect = atlas rect in px (x, y from the top, w, h)
// iAnc  = anchor px (from the rect's left / bottom), alpha 0..1, sun mode (0 lit, 1 only in sunlight, 2 only in shade)
// iCol  = rgb tint, gain
const VS = `
attribute vec4 iPos; attribute vec4 iRect; attribute vec4 iAnc; attribute vec4 iCol;
uniform vec2 uViewport; uniform float uK; uniform vec2 uAtlas;
uniform sampler2D uShadowMap; uniform mat4 uShadowMatrix; uniform float uShadowOn; uniform vec2 uShadowTexel; uniform float uRev;
uniform sampler2D uCloudTex; uniform vec4 uCloudXf; uniform vec2 uCloudBand;
uniform vec3 uSunCol; uniform vec3 uShadeCol; uniform float uAdd;
varying vec2 vUv; varying vec3 vCol; varying float vA;
float sunVis(vec3 wp) {
  if (uShadowOn < 0.5) return 1.0;
  vec4 sc = uShadowMatrix * vec4(wp, 1.0); sc.xyz /= sc.w;
  if (sc.x < 0.0 || sc.x > 1.0 || sc.y < 0.0 || sc.y > 1.0 || sc.z > 1.0) return 1.0;
  float lit = 0.0;
  for (int i = 0; i < 2; i++) for (int j = 0; j < 2; j++) {
    float d = texture2D(uShadowMap, sc.xy + (vec2(float(i), float(j)) - 0.5) * uShadowTexel * 2.0).r;
    lit += uRev > 0.5 ? step(d, sc.z + 0.002) : step(sc.z - 0.002, d);
  }
  return lit * 0.25;
}
void main() {
  vec2 q = position.xy;
  float fl = iPos.w;
  float flip = mod(fl, 2.0);
  float ground = mod(floor(fl / 2.0), 2.0);
  float unlit = mod(floor(fl / 4.0), 2.0);
  float pullF = mod(floor(fl / 8.0), 2.0);                  // big depth pull: accents that hug large glowing props
  vec4 va = viewMatrix * vec4(iPos.xyz, 1.0);
  vec4 ca = projectionMatrix * va;
  vec2 px = floor((ca.xy / ca.w * 0.5 + 0.5) * uViewport + 0.5);      // anchor snapped to the pixel grid
  float ax = flip > 0.5 ? iRect.z - iAnc.x : iAnc.x;
  vec2 v = px + (vec2(q.x * iRect.z, q.y * iRect.w) - vec2(ax, iAnc.y)) * uK;
  vec4 cd = projectionMatrix * vec4(va.xy, va.z + (pullF > 0.5 ? 2.5 : ground > 0.5 ? 0.3 : 0.15), 1.0);
  gl_Position = vec4((v / uViewport * 2.0 - 1.0) * cd.w, cd.z, cd.w);
  float u = flip > 0.5 ? 1.0 - q.x : q.x;
  vUv = vec2(iRect.x + u * iRect.z, iRect.y + (1.0 - q.y) * iRect.w) / uAtlas;
  // light: sun visibility at the anchor (ground decals read it at the surface), cloud shadow on top
  float s = sunVis(iPos.xyz + vec3(0.0, 0.05, 0.0));
  float cl = texture2D(uCloudTex, (iPos.xz + uCloudXf.xy) * uCloudXf.z).r;
  float cden = smoothstep(uCloudBand.x, uCloudBand.y, cl);
  float cloud = (cden < 0.22 ? 0.0 : cden < 0.62 ? 0.55 : 1.0) * uCloudXf.w;
  s *= 1.0 - cloud * 0.55;
  float a = iAnc.z;
  if (iAnc.w > 0.5 && iAnc.w < 1.5) a *= smoothstep(0.35, 0.8, s);           // motes / glints: only in sunlight
  else if (iAnc.w > 1.5) a *= 1.0 - smoothstep(0.25, 0.85, s);              // fireflies: only glow in the shade
  vA = a;
  vec3 light = (uAdd > 0.5 || unlit > 0.5) ? vec3(1.0) : mix(uShadeCol, uSunCol, s);
  vCol = iCol.rgb * iCol.a * light;
}`;

const FS_CUT = `
uniform sampler2D uMap; uniform float uDebug;
varying vec2 vUv; varying vec3 vCol; varying float vA;
${BAYER}
void main() {
  vec4 c = texture2D(uMap, vUv);
  if (c.a < 0.5 || vA < 0.02) discard;
  if (vA < 0.999 && vA <= bayer4(gl_FragCoord.xy)) discard;
  gl_FragColor = uDebug > 0.5 ? vec4(3.0, 0.0, 3.0, 1.0) : vec4(c.rgb * vCol, 1.0);
  #include <colorspace_fragment>
}`;

const FS_ADD = `
uniform sampler2D uMap; uniform float uDebug;
varying vec2 vUv; varying vec3 vCol; varying float vA;
void main() {
  vec4 c = texture2D(uMap, vUv);
  if (c.a < 0.5 || vA < 0.01) discard;
  gl_FragColor = uDebug > 0.5 ? vec4(3.0, 0.0, 3.0, 1.0) : vec4(c.rgb * vCol * vA, 1.0);
}`;

const LAYOUT = { iPos: 4, iRect: 4, iAnc: 4, iCol: 4 };

class Batch {
  constructor(T, parent, mat, name, cap) {
    this.T = T; this.cap = cap; this.count = 0;
    const geo = this.geo = new T.InstancedBufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0], 3));
    geo.setIndex([0, 1, 2, 0, 2, 3]);
    geo.boundingSphere = new T.Sphere(new T.Vector3(), 1e5);
    this.a = {};
    for (const k in LAYOUT) {
      const arr = this.a[k] = new Float32Array(cap * LAYOUT[k]);
      geo.setAttribute(k, new T.InstancedBufferAttribute(arr, LAYOUT[k]).setUsage(T.DynamicDrawUsage));
    }
    geo.instanceCount = 0;
    this.mesh = new T.Mesh(geo, mat); this.mesh.frustumCulled = false; this.mesh.name = name; this.mesh.visible = false;
    parent.add(this.mesh);
  }
  begin() { this.count = 0; }
  end() {
    const n = this.count;
    this.geo.instanceCount = n; this.mesh.visible = n > 0;
    if (!n) return;
    for (const k in LAYOUT) {
      const at = this.geo.attributes[k];
      if (at.clearUpdateRanges) { at.clearUpdateRanges(); at.addUpdateRange(0, n * LAYOUT[k]); }
      at.needsUpdate = true;
    }
  }
  dispose() { this.mesh.removeFromParent(); this.geo.dispose(); this.mesh.material.dispose(); }
}

export class AmbientGfx {
  /** @param {object} ctx mt-render ctx  @param {object} shared extra uniforms (cloud) to merge in */
  constructor(ctx, shared, caps = { cut: 900, add: 900 }) {
    const T = this.T = ctx.THREE; this.ctx = ctx;
    this.group = new T.Group(); this.group.name = 'mt-ambient'; ctx.scene.add(this.group);
    const at = this.atlas = buildAmbientAtlas();
    const tex = this.tex = new T.DataTexture(at.data, at.w, at.h, T.RGBAFormat, T.UnsignedByteType);
    tex.magFilter = tex.minFilter = T.NearestFilter; tex.generateMipmaps = false; tex.flipY = false;
    tex.colorSpace = T.SRGBColorSpace; tex.needsUpdate = true;
    this.G = at.glyphs;
    const ph = new T.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1); ph.needsUpdate = true;
    this.uniforms = {
      uMap: { value: tex }, uAtlas: { value: new T.Vector2(at.w, at.h) },
      uViewport: { value: new T.Vector2(1, 1) }, uK: { value: 1 }, uAdd: { value: 0 }, uDebug: { value: 0 },
      uShadowMap: { value: ph }, uShadowMatrix: { value: new T.Matrix4() }, uShadowOn: { value: 0 }, uShadowTexel: { value: new T.Vector2(1 / 2048, 1 / 2048) }, uRev: { value: 0 },
      uSunCol: { value: new T.Vector3(1.05, 1.0, 0.94) }, uShadeCol: { value: new T.Vector3(0.6, 0.66, 0.84) },
      ...shared,
    };
    const cut = new T.ShaderMaterial({ vertexShader: VS, fragmentShader: FS_CUT, uniforms: this.uniforms, transparent: true, blending: T.NoBlending,
      depthWrite: false, depthTest: true, side: T.DoubleSide });
    const addU = { ...this.uniforms, uAdd: { value: 1 } };
    // additive light that keeps the destination ALPHA (the scene alpha is a tag: 0.75 = unit sprite pixels, which the
    // post chain treats differently — light passing over a sprite must not re-tag it)
    const add = new T.ShaderMaterial({ vertexShader: VS, fragmentShader: FS_ADD, uniforms: addU, transparent: true,
      blending: T.CustomBlending, blendEquation: T.AddEquation, blendSrc: T.OneFactor, blendDst: T.OneFactor,
      blendEquationAlpha: T.AddEquation, blendSrcAlpha: T.ZeroFactor, blendDstAlpha: T.OneFactor,
      depthWrite: false, depthTest: true, side: T.DoubleSide });
    this.cut = new Batch(T, this.group, cut, 'mt-ambient-cut', caps.cut);
    this.add = new Batch(T, this.group, add, 'mt-ambient-add', caps.add);
    this.cut.mesh.renderOrder = 4; this.add.mesh.renderOrder = 5;
    this.k = 1; this.vw = 1; this.vh = 1;
    this.tmp = { a: new T.Vector3(), d: new T.Vector3() };
  }

  /** Per-frame camera / light uniforms. Returns internal px per metre at the focus (for culling decisions). */
  beginFrame(app) {
    const U = this.uniforms, cam = this.ctx.camera, r = this.ctx.renderer;
    const PX = app && app.mtPixel;
    if (PX && PX.internalW > 0) U.uViewport.value.set(PX.internalW, PX.internalH);
    else { r.getDrawingBufferSize(U.uViewport.value); }
    this.vw = U.uViewport.value.x; this.vh = U.uViewport.value.y;
    // internal px per art px: the world is drawn on a 32 px/m grid in pixel mode (k = 1); otherwise derive it
    let k = 1;
    if (PX && PX.ppmInternal > 0) k = Math.max(1, Math.round(PX.ppmInternal / 32));
    else {
      const fovR = ((cam.fov || 26) * Math.PI) / 180;
      cam.updateMatrixWorld();
      const e = cam.matrixWorld.elements, dy = -e[9], cy = e[13];
      const dist = dy < -0.05 ? cy / -dy : 25;
      const ppm = this.vh / (2 * Math.max(1, dist) * Math.tan(fovR / 2));
      k = Math.max(1, Math.round(ppm / 32));
    }
    U.uK.value = this.k = k;
    this.updateLights();
    this.cut.begin(); this.add.begin();
  }

  updateLights() {
    const L = this.ctx.pipeline && this.ctx.pipeline.lights, U = this.uniforms;
    const sun = L && L.sun;
    if (!sun) { U.uShadowOn.value = 0; return; }
    const c = sun.color, inten = Math.min(1.12, 0.9 + sun.intensity * 0.03);
    U.uSunCol.value.set(c.r * inten, c.g * inten, c.b * inten);
    const map = sun.shadow && sun.shadow.map, tex = map && (map.depthTexture || null);
    if (tex && sun.castShadow) {
      U.uShadowMap.value = tex; U.uShadowMatrix.value = sun.shadow.matrix; U.uShadowOn.value = 1;
      U.uShadowTexel.value.set(1 / map.width, 1 / map.height);
      U.uRev.value = this.ctx.renderer.capabilities && this.ctx.renderer.capabilities.reversedDepthBuffer ? 1 : 0;
    } else U.uShadowOn.value = 0;
  }

  /**
   * Queue one glyph. g = glyph name, fi = frame index, (x,y,z) world anchor.
   * o: {add, flip, ground, unlit, front, a (alpha), sun (0|1|2), r,g,b (tint), gain}
   */
  push(g, fi, x, y, z, o) {
    const frames = this.G[g]; if (!frames) return;
    const F = frames[Math.min(frames.length - 1, Math.max(0, fi | 0))];
    const B = o && o.add ? this.add : this.cut;
    if (B.count >= B.cap) return;
    const i = B.count++, A = B.a, j = i * 4;
    A.iPos[j] = x; A.iPos[j + 1] = y; A.iPos[j + 2] = z;
    A.iPos[j + 3] = (o && o.flip ? 1 : 0) + (o && o.ground ? 2 : 0) + (o && o.unlit ? 4 : 0) + (o && o.front ? 8 : 0);
    A.iRect[j] = F.x; A.iRect[j + 1] = F.y; A.iRect[j + 2] = F.w; A.iRect[j + 3] = F.h;
    A.iAnc[j] = o && o.ax != null ? o.ax : F.ax; A.iAnc[j + 1] = o && o.ay != null ? o.ay : F.ay;
    A.iAnc[j + 2] = o && o.a != null ? o.a : 1; A.iAnc[j + 3] = (o && o.sun) || 0;
    A.iCol[j] = o && o.r != null ? o.r : 1; A.iCol[j + 1] = o && o.g != null ? o.g : 1; A.iCol[j + 2] = o && o.b != null ? o.b : 1;
    A.iCol[j + 3] = o && o.gain != null ? o.gain : 1;
  }

  endFrame() { this.cut.end(); this.add.end(); }
  get count() { return this.cut.count + this.add.count; }
  dispose() { this.cut.dispose(); this.add.dispose(); this.tex.dispose(); this.group.removeFromParent(); }
}
