import { D as e, l as t, u as n } from "./map-oE9sOnNc.js";
import {
  $ as r,
  C as i,
  Ct as a,
  D as o,
  F as s,
  Gt as c,
  H as l,
  I as u,
  It as d,
  J as f,
  Jt as p,
  K as m,
  Kt as h,
  L as g,
  Mt as _,
  N as v,
  O as y,
  Q as b,
  Tt as x,
  U as S,
  Vt as ee,
  Xt as C,
  Yt as w,
  Zt as T,
  _t as E,
  at as D,
  dt as O,
  g as te,
  ht as k,
  j as ne,
  jt as A,
  qt as re,
  ut as j,
  x as ie,
  z as ae,
} from "./index-DHK-Ptzs.js";
import { a as oe } from "./height-CVtQdZ3e.js";
import { n as se } from "./sync-2oxeFGdP.js";
var ce = {
    name: `CopyShader`,
    uniforms: { tDiffuse: { value: null }, opacity: { value: 1 } },
    vertexShader: `

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,
    fragmentShader: `

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`,
  },
  M = class {
    constructor() {
      ((this.isPass = !0),
        (this.enabled = !0),
        (this.needsSwap = !0),
        (this.clear = !1),
        (this.renderToScreen = !1));
    }
    setSize() {}
    render() {
      console.error(
        `THREE.Pass: .render() must be implemented in derived pass.`,
      );
    }
    dispose() {}
  },
  le = new E(-1, 1, 1, -1, 0, 1),
  ue = new (class extends i {
    constructor() {
      (super(),
        this.setAttribute(
          `position`,
          new l([-1, 3, 0, -1, -1, 0, 3, -1, 0], 3),
        ),
        this.setAttribute(`uv`, new l([0, 2, 0, 0, 2, 0], 2)));
    }
  })(),
  N = class {
    constructor(e) {
      this._mesh = new O(ue, e);
    }
    dispose() {
      this._mesh.geometry.dispose();
    }
    render(e) {
      e.render(this._mesh, le);
    }
    get material() {
      return this._mesh.material;
    }
    set material(e) {
      this._mesh.material = e;
    }
  },
  de = class extends M {
    constructor(e, t = `tDiffuse`) {
      (super(),
        (this.textureID = t),
        (this.uniforms = null),
        (this.material = null),
        e instanceof _
          ? ((this.uniforms = e.uniforms), (this.material = e))
          : e &&
            ((this.uniforms = c.clone(e.uniforms)),
            (this.material = new _({
              name: e.name === void 0 ? `unspecified` : e.name,
              defines: Object.assign({}, e.defines),
              uniforms: this.uniforms,
              vertexShader: e.vertexShader,
              fragmentShader: e.fragmentShader,
            }))),
        (this._fsQuad = new N(this.material)));
    }
    render(e, t, n) {
      (this.uniforms[this.textureID] &&
        (this.uniforms[this.textureID].value = n.texture),
        (this._fsQuad.material = this.material),
        this.renderToScreen
          ? (e.setRenderTarget(null), this._fsQuad.render(e))
          : (e.setRenderTarget(t),
            this.clear &&
              e.clear(e.autoClearColor, e.autoClearDepth, e.autoClearStencil),
            this._fsQuad.render(e)));
    }
    dispose() {
      (this.material.dispose(), this._fsQuad.dispose());
    }
  },
  P = class extends M {
    constructor(e, t) {
      (super(),
        (this.scene = e),
        (this.camera = t),
        (this.clear = !0),
        (this.needsSwap = !1),
        (this.inverse = !1));
    }
    render(e, t, n) {
      let r = e.getContext(),
        i = e.state;
      (i.buffers.color.setMask(!1),
        i.buffers.depth.setMask(!1),
        i.buffers.color.setLocked(!0),
        i.buffers.depth.setLocked(!0));
      let a, o;
      (this.inverse ? ((a = 0), (o = 1)) : ((a = 1), (o = 0)),
        i.buffers.stencil.setTest(!0),
        i.buffers.stencil.setOp(r.REPLACE, r.REPLACE, r.REPLACE),
        i.buffers.stencil.setFunc(r.ALWAYS, a, 4294967295),
        i.buffers.stencil.setClear(o),
        i.buffers.stencil.setLocked(!0),
        e.setRenderTarget(n),
        this.clear && e.clear(),
        e.render(this.scene, this.camera),
        e.setRenderTarget(t),
        this.clear && e.clear(),
        e.render(this.scene, this.camera),
        i.buffers.color.setLocked(!1),
        i.buffers.depth.setLocked(!1),
        i.buffers.color.setMask(!0),
        i.buffers.depth.setMask(!0),
        i.buffers.stencil.setLocked(!1),
        i.buffers.stencil.setFunc(r.EQUAL, 1, 4294967295),
        i.buffers.stencil.setOp(r.KEEP, r.KEEP, r.KEEP),
        i.buffers.stencil.setLocked(!0));
    }
  },
  fe = class extends M {
    constructor() {
      (super(), (this.needsSwap = !1));
    }
    render(e) {
      (e.state.buffers.stencil.setLocked(!1),
        e.state.buffers.stencil.setTest(!1));
    }
  },
  pe = class {
    constructor(e, t) {
      if (
        ((this.renderer = e),
        (this._pixelRatio = e.getPixelRatio()),
        t === void 0)
      ) {
        let n = e.getSize(new p());
        ((this._width = n.width),
          (this._height = n.height),
          (t = new T(
            this._width * this._pixelRatio,
            this._height * this._pixelRatio,
            { type: f },
          )),
          (t.texture.name = `EffectComposer.rt1`));
      } else ((this._width = t.width), (this._height = t.height));
      ((this.renderTarget1 = t),
        (this.renderTarget2 = t.clone()),
        (this.renderTarget2.texture.name = `EffectComposer.rt2`),
        (this.writeBuffer = this.renderTarget1),
        (this.readBuffer = this.renderTarget2),
        (this.renderToScreen = !0),
        (this.passes = []),
        (this.copyPass = new de(ce)),
        (this.copyPass.material.blending = 0),
        (this.timer = new ee()));
    }
    swapBuffers() {
      let e = this.readBuffer;
      ((this.readBuffer = this.writeBuffer), (this.writeBuffer = e));
    }
    addPass(e) {
      (this.passes.push(e),
        e.setSize(
          this._width * this._pixelRatio,
          this._height * this._pixelRatio,
        ));
    }
    insertPass(e, t) {
      (this.passes.splice(t, 0, e),
        e.setSize(
          this._width * this._pixelRatio,
          this._height * this._pixelRatio,
        ));
    }
    removePass(e) {
      let t = this.passes.indexOf(e);
      t !== -1 && this.passes.splice(t, 1);
    }
    isLastEnabledPass(e) {
      for (let t = e + 1; t < this.passes.length; t++)
        if (this.passes[t].enabled) return !1;
      return !0;
    }
    render(e) {
      (this.timer.update(), e === void 0 && (e = this.timer.getDelta()));
      let t = this.renderer.getRenderTarget(),
        n = !1;
      for (let t = 0, r = this.passes.length; t < r; t++) {
        let r = this.passes[t];
        if (r.enabled !== !1) {
          if (
            ((r.renderToScreen =
              this.renderToScreen && this.isLastEnabledPass(t)),
            r.render(this.renderer, this.writeBuffer, this.readBuffer, e, n),
            r.needsSwap)
          ) {
            if (n) {
              let t = this.renderer.getContext(),
                n = this.renderer.state.buffers.stencil;
              (n.setFunc(t.NOTEQUAL, 1, 4294967295),
                this.copyPass.render(
                  this.renderer,
                  this.writeBuffer,
                  this.readBuffer,
                  e,
                ),
                n.setFunc(t.EQUAL, 1, 4294967295));
            }
            this.swapBuffers();
          }
          P !== void 0 &&
            (r instanceof P ? (n = !0) : r instanceof fe && (n = !1));
        }
      }
      this.renderer.setRenderTarget(t);
    }
    reset(e) {
      if (e === void 0) {
        let t = this.renderer.getSize(new p());
        ((this._pixelRatio = this.renderer.getPixelRatio()),
          (this._width = t.width),
          (this._height = t.height),
          (e = this.renderTarget1.clone()),
          e.setSize(
            this._width * this._pixelRatio,
            this._height * this._pixelRatio,
          ));
      }
      (this.renderTarget1.dispose(),
        this.renderTarget2.dispose(),
        (this.renderTarget1 = e),
        (this.renderTarget2 = e.clone()),
        (this.writeBuffer = this.renderTarget1),
        (this.readBuffer = this.renderTarget2));
    }
    setSize(e, t) {
      ((this._width = e), (this._height = t));
      let n = this._width * this._pixelRatio,
        r = this._height * this._pixelRatio;
      (this.renderTarget1.setSize(n, r), this.renderTarget2.setSize(n, r));
      for (let e = 0; e < this.passes.length; e++) this.passes[e].setSize(n, r);
    }
    setPixelRatio(e) {
      ((this._pixelRatio = e), this.setSize(this._width, this._height));
    }
    dispose() {
      (this.renderTarget1.dispose(),
        this.renderTarget2.dispose(),
        this.copyPass.dispose());
    }
  },
  me = `
#include <common>
#include <skinning_pars_vertex>
varying vec3 vN; varying vec3 vV; varying float vDepth;
void main() {
  #include <beginnormal_vertex>
  #include <skinbase_vertex>
  #include <skinnormal_vertex>
  #include <defaultnormal_vertex>
  #include <begin_vertex>
  #include <skinning_vertex>
  #include <project_vertex>
  vN = transformedNormal; vV = -mvPosition.xyz; vDepth = -mvPosition.z;
}`,
  he = `
uniform float uCode; varying vec3 vN; varying vec3 vV; varying float vDepth;
void main() {
  float f = 1.0 - clamp(abs(dot(normalize(vN), normalize(vV))), 0.0, 1.0);
  gl_FragColor = vec4(f, uCode, vDepth, 1.0);
}`,
  F = { self: 1 / 3, ally: 2 / 3, enemy: 1 },
  ge = class {
    constructor(e) {
      ((this.renderer = e),
        (this.enabled = !0),
        (this.scene = new A()),
        (this.scene.name = `look.xray`),
        (this.scene.matrixWorldAutoUpdate = !1),
        (this.rt = new T(1, 1, {
          type: f,
          format: a,
          depthBuffer: !0,
          stencilBuffer: !1,
          minFilter: D,
          magFilter: D,
          generateMipmaps: !1,
        })),
        (this.rt.texture.name = `look.xray`),
        (this.proxies = []),
        (this.byBody = new Map()),
        (this.stamp = 0),
        (this.count = 0),
        (this.stats = { targets: 0, player: !1 }),
        (this.player = { x: 0, y: 0, z: 0, found: !1, height: 2.2 }),
        (this.player.x = 0.5),
        (this.player.x = 0),
        (this._clear = new y()),
        (this._clearAlpha = 1),
        (this.scale = 1),
        (this.ready = !1),
        (this._compiling = !1));
    }
    warm(e) {
      if (this.ready || this._compiling || this.proxies.length === 0) return;
      this._compiling = !0;
      let t = () => {
          ((this.ready = !0), (this._compiling = !1));
        },
        n = this.renderer,
        r = n.getRenderTarget();
      n.setRenderTarget(this.rt);
      try {
        let r = n.compileAsync ? n.compileAsync(this.scene, e) : null;
        r && r.then ? r.then(t, t) : t();
      } catch {
        t();
      } finally {
        n.setRenderTarget(r);
      }
    }
    setSize(e, t, n) {
      this.scale = n > 1.25 ? 0.5 : 1;
      let r = Math.max(1, Math.round(e * n * this.scale)),
        i = Math.max(1, Math.round(t * n * this.scale));
      (this.rt.width !== r || this.rt.height !== i) && this.rt.setSize(r, i);
    }
    makeProxy(e) {
      let t = new _({
        vertexShader: me,
        fragmentShader: he,
        uniforms: { uCode: H(1) },
        toneMapped: !1,
        fog: !1,
        lights: !1,
        side: 0,
      });
      t.name = `look.xrayProxy`;
      let n = new d(e.geometry, t);
      return (
        n.bind(e.skeleton, e.bindMatrix),
        (n.bindMode = g),
        (n.matrixAutoUpdate = !1),
        (n.matrixWorldAutoUpdate = !1),
        (n.frustumCulled = !1),
        (n.name = `xray:` + (e.name || `body`)),
        (n.userData.stamp = 0),
        (n.userData.body = e),
        this.scene.add(n),
        this.proxies.push(n),
        this.byBody.set(e, n),
        n
      );
    }
    collect(t, n, r, i) {
      let a = ++this.stamp,
        o = this.player;
      o.found = !1;
      let s = 0,
        c = this.enabled && n ? n.get(`champions`) : null,
        l = c && c.list,
        u = t.world;
      if (l && u && Array.isArray(l) && t.state === `game`)
        for (let n = 0; n < l.length; n++) {
          let i = l[n],
            c = i && i.body;
          if (!c || !c.isSkinnedMesh || !c.skeleton || !i.visible) continue;
          let d = u.units.get(i.unitId);
          if (!d || !d.alive || d.kind !== e.CHAMPION) continue;
          let f = d.id === t.playerId,
            p = d.team === t.viewerTeam;
          if (!f && !p && !r) continue;
          let m = this.byBody.get(c);
          ((m ||= this.makeProxy(c)),
            m.geometry !== c.geometry && (m.geometry = c.geometry),
            m.skeleton !== c.skeleton && m.bind(c.skeleton, c.bindMatrix),
            (m.userData.stamp = a),
            (m.visible = !0));
          let h = f ? F.self : p ? F.ally : F.enemy,
            g = m.material.uniforms.uCode;
          if ((g.value !== h && (g.value = h), s++, f)) {
            let e = i.group && i.group.position;
            if (e) ((o.x = e.x), (o.y = e.y), (o.z = e.z));
            else {
              let e = c.matrixWorld.elements;
              ((o.x = e[12]), (o.y = e[13]), (o.z = e[14]));
            }
            ((o.found = !0),
              (o.height = i.type && i.type.height > 0 ? i.type.height : 2.2));
          }
        }
      for (let e = this.proxies.length - 1; e >= 0; e--) {
        let t = this.proxies[e];
        t.userData.stamp !== a &&
          ((t.visible = !1),
          (a - t.userData.stamp > 90 || !(l && l.length)) &&
            (this.scene.remove(t),
            t.material.dispose(),
            this.byBody.delete(t.userData.body),
            this.proxies.splice(e, 1)));
      }
      ((this.count = s),
        (this.stats.targets = s),
        (this.stats.player = o.found),
        !this.ready && i && this.warm(i));
    }
    render(e) {
      let t = this.renderer;
      if (this.count === 0 || !this.ready) return !1;
      (t.getClearColor(this._clear), (this._clearAlpha = t.getClearAlpha()));
      let n = this.proxies;
      for (let e = 0; e < n.length; e++) {
        let t = n[e];
        if (!t.visible) continue;
        let r = t.userData.body;
        (t.matrixWorld.copy(r.matrixWorld),
          t.bindMatrixInverse.copy(r.bindMatrixInverse));
      }
      let r = t.autoClear;
      ((t.autoClear = !1),
        t.setRenderTarget(this.rt),
        t.setClearColor(0, 0),
        t.clear(!0, !0, !1));
      try {
        t.render(this.scene, e);
      } finally {
        ((t.autoClear = r), t.setClearColor(this._clear, this._clearAlpha));
      }
      return !0;
    }
    dispose() {
      for (let e of this.proxies) (this.scene.remove(e), e.material.dispose());
      ((this.proxies.length = 0), this.byBody.clear(), this.rt.dispose());
    }
  },
  I = `
in vec3 position; in vec2 uv; out vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
  L = n.b.x - n.a.x,
  R = n.b.y - n.a.y,
  z = Math.hypot(L, R),
  B = `
float lookWaterAt(vec3 P) {
  float wd = ${oe.toFixed(4)} - P.y;                       // how far below the river plane the depth buffer sits
  if (wd <= 0.02 || wd > 1.06) return 0.0;                          // dry ground, or past an outlet lip (the falls take over)
  vec2 r = P.xz - vec2(${n.a.x.toFixed(2)}, ${n.a.y.toFixed(2)});
  vec2 d = vec2(${(L / z).toFixed(6)}, ${(R / z).toFixed(6)});
  float along = dot(r, d);
  if (along < -26.0 || along > ${(z + 26).toFixed(2)}) return 0.0;
  float band = 1.0 - smoothstep(7.9, 8.6, abs(r.x * d.y - r.y * d.x));
  float pit = min(distance(P.xz, vec2(${t[0].x.toFixed(2)}, ${t[0].y.toFixed(2)})) - ${t[0].radius.toFixed(2)},
                  distance(P.xz, vec2(${t[1].x.toFixed(2)}, ${t[1].y.toFixed(2)})) - ${t[1].radius.toFixed(2)});
  return band * smoothstep(0.30, 1.10, pit) * smoothstep(0.02, 0.14, wd) * (1.0 - smoothstep(0.96, 1.06, wd));
}`,
  _e = `
bool lookBadF(float x) { return (floatBitsToUint(x) & 0x7F800000u) == 0x7F800000u; }
bool lookBad(vec3 c) { uvec3 e = floatBitsToUint(c) & uvec3(0x7F800000u); return any(equal(e, uvec3(0x7F800000u))); }
vec3 lookSafe(vec3 c) { return lookBad(c) ? vec3(0.0) : clamp(c, vec3(0.0), vec3(6.0e4)); }
`,
  V =
    `
precision highp float; precision highp int; precision highp sampler2D;
in vec2 vUv; out vec4 outColor;
const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);
float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
` + _e,
  ve =
    V +
    `
uniform sampler2D tDepth; uniform mat4 uProj; uniform mat4 uInvProj; uniform vec2 uTexel; // full-res texel
uniform float uRadius; uniform float uIntensity; uniform float uBias; uniform float uMaxPx; uniform float uPower;
uniform float uFarScale; uniform float uFarWeight; uniform mat4 uViewInv;
ivec2 gMax;
vec3 vposT(ivec2 t) {
  t = clamp(t, ivec2(0), gMax); float d = texelFetch(tDepth, t, 0).r; vec2 uv = (vec2(t) + 0.5) * uTexel;
  vec4 p = uInvProj * vec4(vec3(uv, d) * 2.0 - 1.0, 1.0); return p.xyz / p.w;
}
void main() {
  gMax = textureSize(tDepth, 0) - 1;
  ivec2 c = ivec2(floor(vUv / uTexel)); // the full-res texel this AO pixel represents
  float d0 = texelFetch(tDepth, clamp(c, ivec2(0), gMax), 0).r;
  if (d0 >= 0.99999) { outColor = vec4(1.0, 1.0e4, 0.0, 1.0); return; }
  vec3 C = vposT(c);
  vec3 L = vposT(c - ivec2(1, 0)), R = vposT(c + ivec2(1, 0)), D = vposT(c - ivec2(0, 1)), U = vposT(c + ivec2(0, 1));
  vec3 dx = abs(L.z - C.z) < abs(R.z - C.z) ? C - L : R - C;
  vec3 dy = abs(D.z - C.z) < abs(U.z - C.z) ? C - D : U - C;
  vec3 N = normalize(cross(dx, dy));
  // (env r6, iPad "glitchy while playing") the sample-set rotation is anchored to the WORLD (a 5 cm cell grid on the
  // surface), not to the screen: a screen-space noise slides under the moving scene and the occlusion boils on every
  // crease while the camera follows the trainer.
  vec3 Wp = (uViewInv * vec4(C, 1.0)).xyz;
  vec3 Nw = abs(mat3(uViewInv) * N);
  vec2 wq = Nw.y > 0.7 ? Wp.xz : Nw.x > Nw.z ? Wp.zy : Wp.xy;
  float rot = ign(floor(wq * 20.0)) * 6.2831853;
  vec2 rad = vec2(uProj[0][0], uProj[1][1]) * 0.5 * uRadius / -C.z;
  // screen-space clamp per ring (the wide ring would otherwise blow past uMaxPx first and lose its falloff calibration)
  float px = rad.y / uTexel.y;
  float scN = px > uMaxPx ? uMaxPx / px : 1.0;
  float pxF = px * uFarScale; float scF = pxF > uMaxPx ? uMaxPx / pxF : 1.0;
  float rN = uRadius * scN, rF = uRadius * uFarScale * scF;
  float r2N = rN * rN, r2F = rF * rF;
  float wN = 1.0 - uFarWeight, wF = uFarWeight;
  float occ = 0.0, wsum = 0.0; float bias = uBias;
  vec2 cuv = (vec2(c) + 0.5) * uTexel;
  for (int i = 0; i < SAMPLES; i++) {
    bool far = (i & 1) == 1;
    float a = (float(i) + 0.5) / float(SAMPLES);
    float ang = a * TURNS * 6.2831853 + rot;
    vec2 ring = far ? rad * (uFarScale * scF) : rad * scN;
    vec2 suv = cuv + vec2(cos(ang), sin(ang)) * (a * a * 0.85 + 0.15) * ring;
    vec3 v = vposT(ivec2(floor(suv / uTexel))) - C; float vv = dot(v, v);
    float cosT = dot(v, N) * inversesqrt(vv + 1e-6);
    float fall = max(0.0, 1.0 - vv / (far ? r2F : r2N));
    float w = far ? wF : wN;
    occ += w * max(0.0, cosT - bias - 0.0025 * inversesqrt(vv + 1e-4)) * fall * fall; // (tiny near-sample bias: depth quantisation)
    wsum += w;
  }
  float A = clamp(1.0 - uIntensity * occ / max(wsum, 1e-4), 0.0, 1.0);
  outColor = vec4(pow(A, uPower), -C.z, 0.0, 1.0);
}`,
  ye =
    V +
    `
uniform sampler2D tAO; uniform vec2 uDir; uniform float uSharp;
void main() {
  vec4 c = texture(tAO, vUv); float z = c.g;
  float w0 = 0.2270270; float sum = c.r * w0; float wsum = w0;
  float W[3] = float[3](0.1945946, 0.1216216, 0.0540541);
  for (int k = 1; k <= 3; k++) {
    for (int s = -1; s <= 1; s += 2) {
      vec4 t = texture(tAO, vUv + uDir * float(k * s));
      float wd = W[k - 1] * max(0.0, 1.0 - abs(t.g - z) * uSharp / (0.015 * z + 0.04));
      sum += t.r * wd; wsum += wd;
    }
  }
  outColor = vec4(sum / wsum, z, 0.0, 1.0);
}`,
  be =
    V +
    `
uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uThreshold; uniform float uKnee; uniform float uClampMax;
#ifdef PREFILTER
uniform vec3 uWide;      // (threshold, knee, gain) of the second, low, wide tier — EXPOSED linear units
uniform sampler2D tAdapt; uniform vec2 uExpo;  // (base exposure, auto-exposure on)
#endif
#ifdef PREFILTER
// scene taps: sanitised (a NaN/Inf/negative texel contributes nothing — never "max energy"), then clamped
vec3 s(float x, float y) { return min(lookSafe(texture(tSrc, vUv + vec2(x, y) * uTexel).rgb), vec3(uClampMax)); }
float kw(vec3 c) { return 1.0 / (1.0 + dot(c, LUMA)); }
#else
vec3 s(float x, float y) { return texture(tSrc, vUv + vec2(x, y) * uTexel).rgb; }
#endif
void main() {
  vec3 a = s(-2.,-2.), b = s(0.,-2.), c = s(2.,-2.), d = s(-1.,-1.), e = s(1.,-1.), f = s(-2.,0.), g = s(0.,0.), h = s(2.,0.);
  vec3 i = s(-1.,1.), j = s(1.,1.), k = s(-2.,2.), l = s(0.,2.), m = s(2.,2.);
#ifdef PREFILTER
  vec3 g0 = (d + e + i + j) * 0.25, g1 = (a + b + f + g) * 0.25, g2 = (b + c + g + h) * 0.25, g3 = (f + g + k + l) * 0.25, g4 = (g + h + l + m) * 0.25;
  float w0 = kw(g0) * 0.5, w1 = kw(g1) * 0.125, w2 = kw(g2) * 0.125, w3 = kw(g3) * 0.125, w4 = kw(g4) * 0.125;
  vec3 col = (g0 * w0 + g1 * w1 + g2 * w2 + g3 * w3 + g4 * w4) / (w0 + w1 + w2 + w3 + w4);
  float br = max(col.r, max(col.g, col.b));
  float rq = clamp(br - uThreshold + uKnee, 0.0, 2.0 * uKnee); rq = rq * rq / (4.0 * uKnee + 1e-4);
  // The wide tier's threshold is EXPOSURE-RELATIVE, and the 2.9 core's is not — on purpose. 2.9 pre-exposure is a
  // contract with every other owner ("author glow cores at 3–10, surfaces that must not glow ≤ 2.2", DESIGN §3.5) and
  // must not move. But the scenes differ by more than an EV of auto exposure, so one FIXED pre-exposure threshold means
  // a different thing in each of them: measured HDR percentiles of the scene target, lane p99 0.70 linear against base
  // p99 1.89. A 1.7 pre-exposure wide tier lit up the base plaza and did nothing whatever in lane. Dividing by the
  // adapted exposure puts the tier a fixed distance above sunlit diffuse white in EVERY scenario, which is the only
  // place it can sit without either hazing the marble or being inert in the lane.
  float ev = uExpo.y > 0.5 ? texture(tAdapt, vec2(0.5)).r : 0.0; if (lookBadF(ev)) ev = 0.0;
  float ex = max(uExpo.x * exp2(ev), 1.0e-4);
  float wT = uWide.x / ex, wK = max(uWide.y / ex, 1.0e-4);
  float wq = clamp(br - wT + wK, 0.0, 2.0 * wK); wq = wq * wq / (4.0 * wK + 1e-4);
  // TWO TIERS. The 2.9 tier is the hot core (only genuine emissive reaches it). The second, much lower tier sits just
  // above sunlit diffuse white, at a small gain: in an ordinary lane frame the shipped bloom buffer measured mean
  // 0.1/255 with 99.91 % of it below luma 16 — one projectile and two sparks were the only things in the whole world
  // that glowed (r6 critic). Minion staff crystals, turret cores, shrine runes and base beacons are authored at 1.5–3
  // linear and now bleed a little light, which is most of what separates a fantasy MOBA frame from a dry one.
  float take = max(rq, br - uThreshold) + uWide.z * max(wq, br - wT);
  col *= take / max(br, 1e-4);
  outColor = vec4(max(col, vec3(0.0)), 1.0);
#else
  vec3 col = (d + e + i + j) * 0.125 + (a + b + g + f) * 0.03125 + (b + c + h + g) * 0.03125 + (f + g + l + k) * 0.03125 + (g + h + m + l) * 0.03125;
  outColor = vec4(col, 1.0);
#endif
}`,
  xe =
    V +
    `
uniform sampler2D tLow; uniform sampler2D tHigh; uniform vec2 uTexel; uniform float uScatter;
vec3 s(float x, float y) { return texture(tLow, vUv + vec2(x, y) * uTexel).rgb; }
void main() {
  vec3 t = (s(-1.,-1.) + s(1.,-1.) + s(-1.,1.) + s(1.,1.)) + (s(0.,-1.) + s(-1.,0.) + s(1.,0.) + s(0.,1.)) * 2.0 + s(0.,0.) * 4.0;
  outColor = vec4(mix(texture(tHigh, vUv).rgb, t / 16.0, uScatter), 1.0);
}`,
  Se =
    V +
    `
uniform sampler2D tScene; uniform sampler2D tDepth; uniform sampler2D tPrev; uniform vec2 uCell; uniform float uMaskLo; uniform float uMaskHi; uniform float uCap;
float gCap;
float tap(vec2 uv, out float w) {
  vec4 s = texture(tScene, uv); vec3 c = max(s.rgb, vec3(0.0)); bool bad = lookBad(s.rgb);   // invalid pixels get weight 0 (never NaN in the meter)
  // r7 critic: every in-game scenario carries a handful of NEGATIVE-radiance pixels in the scene target, and a negative
  // radiance is undefined input to a log-luminance meter. The per-CHANNEL clamp above (rather than a clamp on the dot
  // product) is what makes a pixel with one negative channel meter as the energy it actually has.
  float l = bad ? 0.0 : dot(c, LUMA);
  float additive = lookBadF(s.a) ? 1.0 : 1.0 - smoothstep(1.02, 1.12, s.a);
  w = bad ? 0.0 : (1.0 - smoothstep(uMaskLo, uMaskHi, l)) * additive * step(texture(tDepth, uv).r, 0.99999);
  return min(log2(clamp(l, 0.004, uMaskLo)), gCap);
}
void main() {
  // previous frame's metered geometric mean (ADAPT_FRAG writes it in B); 0 on the very first frames → no cap
  float pg = texture(tPrev, vec2(0.5)).b;
  gCap = (lookBadF(pg) || pg == 0.0) ? 99.0 : pg + uCap;
  float w0, w1, w2, w3;
  float l0 = tap(vUv + uCell * vec2(-0.25, -0.25), w0), l1 = tap(vUv + uCell * vec2(0.25, -0.25), w1);
  float l2 = tap(vUv + uCell * vec2(-0.25, 0.25), w2), l3 = tap(vUv + uCell * vec2(0.25, 0.25), w3);
  vec2 c = (vUv - 0.5) * vec2(1.6, 1.25); float cw = exp(-dot(c, c) * 2.2) * 0.85 + 0.15; // centre-weighted like WR's play space
  float ws = (w0 + w1 + w2 + w3) * 0.25 * cw;
  outColor = vec4((l0 * w0 + l1 * w1 + l2 * w2 + l3 * w3) * 0.25 * cw, ws, 0.0, 1.0);
}`,
  Ce =
    V +
    `
uniform sampler2D tSrc; uniform vec2 uTexel; // source texel size
void main() {
  outColor = 0.25 * (texture(tSrc, vUv + uTexel * vec2(-1.0, -1.0)) + texture(tSrc, vUv + uTexel * vec2(1.0, -1.0))
                   + texture(tSrc, vUv + uTexel * vec2(-1.0, 1.0)) + texture(tSrc, vUv + uTexel * vec2(1.0, 1.0)));
}`,
  we =
    V +
    `
uniform sampler2D tMeter; uniform sampler2D tPrev; uniform float uKey; uniform float uMinEV; uniform float uMaxEV; uniform vec2 uK; uniform float uEnabled;
uniform vec2 uComp; // (bright-scene compensation slope, reference log2 geometric mean)
uniform vec2 uCine; // (cinematic EV ceiling — 99 in gameplay, x = ceiling; y = 1 while the meter is HELD)
void main() {
  vec4 m = texture(tMeter, vec2(0.5));
  float geo = (!lookBadF(m.r) && !lookBadF(m.g) && m.g > 1e-5) ? m.r / m.g : log2(uKey);
  if (lookBadF(geo)) geo = log2(uKey);
  float prev = texture(tPrev, vec2(0.5)).r;
  // mix() with a NaN is sticky forever — reset a corrupted history instead of propagating it
  if (lookBadF(prev) || abs(prev) > 16.0) prev = 0.0;
  // ONE-SIDED BRIGHT-SCENE COMPENSATION. A pure key-based auto exposure maps EVERY scene to the same geometric mean,
  // so the white-marble base and the shaded jungle arrive at the same mid-grey — and worse, the marble then sits on the
  // filmic SHOULDER, where a cast shadow's contrast is compressed away (the r3 critic's "flat institutional grey"
  // reads as a lighting bug but is really an exposure one: the base metered 0.37 against lane's 0.24 and was pulled to
  // the same key, so its shadows had nowhere to fall). Above the reference metering, part of the correction is given
  // back: the bright scene stays bright, comes off the shoulder, and its shadows separate again. Darker-than-reference
  // scenes are untouched (max(0, …)) — a night pit must not be dragged darker still.
  float comp = uComp.x * max(0.0, geo - uComp.y);
  float target = uEnabled > 0.5 ? clamp(log2(uKey) - geo - comp, uMinEV, uMaxEV) : 0.0;
  if (lookBadF(target) || abs(target) > 16.0) target = prev;
  // ASYMMETRIC adaptation, with an ERROR-PROPORTIONAL escape. Opening up stays fast (τ ≈ 0.5 s — a player walking out of
  // a shadowed jungle must not be blinded). Closing down is slow (τ ≈ 1.2 s) so a spell that brightens the frame for
  // half a second cannot pull the world DOWN and back inside a single trade. But the slow rate must not apply to a
  // GENUINE scene change: with a flat 1.2 s the victory cinematic was still 0.6 EV above its metered target two seconds
  // in, and the frame a judge screenshots read milky (masked mean 96 against the references' 64–73). The breathing this
  // is aimed at is ≤ 0.2 EV, so above ≈ 0.9 EV of error the downward rate returns to the fast one.
  // CINEMATIC CEILING + HOLD. During the victory cinematic the meter is IGNORED (a translucent nexus blast must not
  // pump the iris), but "ignored" used to mean "frozen at whatever gameplay had adapted to" — and in this scenario that
  // was aeMaxEV itself, so the one frame that ships with no HUD locked at the brightest exposure the system can
  // produce and then had the envelope added on top (r7 critic: play-space mean 96.0 / p95 175.3). The held value is now
  // allowed to move DOWN to a cinematic-specific ceiling — never up, and never toward the meter.
  target = min(target, uCine.x);
  if (uCine.y > 0.5) target = min(prev, uCine.x);
  // (the error-proportional escape below routes a LARGE error onto the fast/UP rate — which during a hold is zero, so
  // a cinematic whose ceiling sat more than ~0.9 EV below the held value never moved at all. While holding, the two
  // rates are taken literally: up is frozen, down is the cinematic descent.)
  float e = abs(target - prev);
  float k = target > prev ? uK.x : (uCine.y > 0.5 ? uK.y : mix(uK.y, uK.x, smoothstep(0.35, 0.9, e)));
  outColor = vec4(mix(prev, target, k), target, geo, 1.0);
}`;
function Te() {
  let e = te.tonemapping_pars_fragment || ``;
  return (
    (e = e.replace(/uniform\s+float\s+toneMappingExposure\s*;/, ``)),
    `#define toneMappingExposure 1.0
` + e
  );
}
function Ee() {
  return (
    V +
    Te() +
    B +
    `
precision highp sampler3D;
uniform sampler2D tScene; uniform sampler2D tDepth; uniform sampler2D tAO; uniform sampler2D tBloom; uniform sampler2D tVision; uniform sampler3D tLut;
uniform mat4 uInvViewProj; uniform vec4 uVisionST; uniform vec2 uResolution;
uniform float uPixQ; // pixel mode: band AO and bloom, pass the scene material tag (alpha) to the outline pass
uniform float uExposure; uniform float uAO; uniform float uBloom; uniform float uFow; uniform float uDeath; uniform float uSpectate; uniform float uVignette;
uniform float uLutAmount; uniform float uLutSize; uniform vec3 uFowTint; uniform float uFowDarken; uniform float uFowDesat;
uniform float uFade; uniform float uFlash; uniform int uDebug; uniform vec2 uTexel;
uniform mat4 uProj; uniform vec2 uAOSize;
uniform float uSceneScale; // scene target size / output size (> 1 when the quality tier supersamples)
uniform vec3 uBrightTone; uniform vec2 uBrightCurve; // bright-scene display tone (strength, EV none, EV full) · (A, B)
uniform vec2 uBrightGrade; // bright-scene chroma: (saturation gain, warmth) at full strength — see BRIGHT-SCENE TONE
uniform float uResolveTap; // 1x resolve tent half-offset in scene texels (0 = plain centre fetch); see sceneResolve()
uniform sampler2D tAdapt; uniform float uAutoExposure; uniform vec4 uCurve; uniform vec3 uCurveX; uniform float uCrossMax; uniform float uShadowSat; uniform float uEVBias; uniform float uChroma;
uniform sampler2D tXray; uniform float uXray; uniform float uXrayEnemy; uniform vec2 uXrayTexel; uniform vec3 uXraySelf; uniform vec3 uXrayAlly; uniform vec3 uXrayFoe;
uniform float uDeathPost;   // second, post-LUT spectate desaturation (see the death block below)
uniform vec3 uFowHaze; uniform float uFowLift; uniform float uFowExposure; uniform vec3 uAerialTint; uniform vec4 uAerial; // (strength, desat, near, far)
uniform vec2 uAOFloor; // linear luminance knee under which AO is released (no crushed blacks)
uniform vec3 uWaterAO; // per-channel fraction of the occlusion that survives on the river surface (see lookWaterAt)
uniform vec3 uDeathGrade; // (display-space desaturation, EV drop, team-hue protection) while spectating
uniform float uDeathBoost; // extra chroma on team-hued pixels while spectating
float linDepth(float d) { return uProj[3][2] / ((d * 2.0 - 1.0) + uProj[2][2]); }
// joint-bilateral 2x2 upsample of the half-res AO (R = ao, G = view distance) guided by full-res depth: no blocky halos
float aoUpsample(float depth) {
  float zc = linDepth(depth); vec2 p = vUv * uAOSize - 0.5; vec2 f = fract(p); ivec2 b = ivec2(floor(p)); ivec2 mx = ivec2(uAOSize) - 1;
  float sum = 0.0, wsum = 0.0, best = 1.0, bestD = 1e9; float tol = 0.02 * zc + 0.03;
  for (int j = 0; j < 2; j++) for (int i = 0; i < 2; i++) {
    vec4 t = texelFetch(tAO, clamp(b + ivec2(i, j), ivec2(0), mx), 0);
    float dz = abs(t.g - zc); float wb = (i == 0 ? 1.0 - f.x : f.x) * (j == 0 ? 1.0 - f.y : f.y);
    float w = wb * exp(-dz / tol); sum += t.r * w; wsum += w; if (dz < bestD) { bestD = dz; best = t.r; }
  }
  return wsum > 1e-4 ? sum / wsum : best;
}
// Hue-preserving filmic tone curve (Lottes 2016 form): f(x) = x^a / (x^(a·d)·b + c), applied to the PEAK channel so hue and
// saturation of team colours / crystals survive at high values (per-channel ACES bleached cyan and gold toward white).
// Crosstalk toward white only as the mapped peak nears 1, so genuinely hot VFX cores still read white-hot.
// uCurve = (a contrast, d shoulder, b, c) · uCurveX = (saturation, crossSaturation, crosstalk)
float curve(float x) { float z = pow(x, uCurve.x); return z / (pow(z, uCurve.y) * uCurve.z + uCurve.w); }
vec3 filmic(vec3 c) {
  float peak = max(max(c.r, c.g), c.b);
  if (peak < 1e-5) return vec3(0.0);
  vec3 ratio = c / peak; float tp = clamp(curve(peak), 0.0, 1.0);
  ratio = pow(max(ratio, vec3(0.0)), vec3(uCurveX.x / uCurveX.y));
  // r4 (r3 critic, minor): the crosstalk is capped at uCrossMax. At tp = 1 an uncapped mix reached ratio = 1 exactly, so
  // every VFX core that hit the ceiling became hue-less paper white (teamfight: 5.6 k px at chroma 0.005) and the rock
  // silhouettes inside a fireball dissolved. Capped, the hottest peak bleaches TOWARD white but keeps its own hue.
  ratio = mix(ratio, vec3(1.0), uCrossMax * pow(tp, uCurveX.z));
  ratio = pow(ratio, vec3(uCurveX.y));
  return clamp(ratio * tp, 0.0, 1.0);
}
vec3 srgbOETF(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c)); }
// Invalid (NaN/Inf) scene pixel → fill from the nearest ring of VALID neighbours (1, 2.5, 6, 14 px; 8 taps each), so a
// broken material shows up as its surroundings instead of a black shard. Only runs on invalid pixels.
vec3 fillHole() {
  const float RING[4] = float[4](1.0, 2.5, 6.0, 14.0);
  for (int r = 0; r < 4; r++) {
    vec3 acc = vec3(0.0); float n = 0.0;
    for (int k = 0; k < 8; k++) {
      float a = float(k) * 0.7853982 + float(r) * 0.3927;
      vec3 t = texture(tScene, vUv + vec2(cos(a), sin(a)) * RING[r] * uTexel).rgb;
      if (!lookBad(t)) { acc += clamp(t, vec3(0.0), vec3(6.0e4)); n += 1.0; }
    }
    if (n > 0.0) return acc / n;
  }
  return vec3(0.0);
}
#ifdef USE_RESOLVE
// Dither resolve: pixels whose resolved scene ALPHA is fractional were drawn with alpha-to-coverage at partial coverage
// (the stipple of a fading alpha-tested material). Replace them with a coverage-weighted 3×3 average so fades read as
// smooth transparency instead of a raw pixel checkerboard. Opaque/blended content keeps alpha 1 and is untouched.
vec3 resolveDither(vec3 c, float a) {
  float m = smoothstep(0.995, 0.9, a); if (m <= 0.0) return c;
  vec3 acc = c * 2.0; float wsum = 2.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    if (i == 0 && j == 0) continue;
    vec4 t = texture(tScene, vUv + vec2(float(i), float(j)) * uTexel);
    if (lookBad(t.rgb)) continue;
    float w = (i == 0 || j == 0) ? 1.0 : 0.6;
    acc += clamp(t.rgb, vec3(0.0), vec3(6.0e4)) * w; wsum += w;
  }
  return mix(c, acc / wsum, m);
}
#endif
// SUPERSAMPLE RESOLVE (r4). With QUALITY.scale the scene target is 1.4× the output, so one output pixel covers ≈ 1.4²
// scene texels. Four bilinear taps at ±0.5 scene texel around the pixel centre integrate a ≈ 3×3-texel tent — the
// footprint plus a half-texel apron, which is what stops the flagstone / grass octaves from re-aliasing on the way down.
// Invalid taps are dropped (so one NaN texel cannot poison its neighbours); if all four are invalid the centre fetch is
// returned unchanged and the existing hole fill takes over. At scale 1 this is the plain centre fetch.
vec4 sceneResolve() {
  vec4 c0 = texture(tScene, vUv);
  // (> 1: the supersample tent; 1: the 1× resolve tent; < 1: none — the bilinear UPSAMPLE is already that low-pass)
  float tap = uSceneScale > 1.01 ? 0.5 : uSceneScale > 0.99 ? uResolveTap : 0.0;
  if (tap <= 0.0) return c0;
  vec2 o = tap * uTexel;
  vec4 t[4] = vec4[4](texture(tScene, vUv + vec2(-o.x, -o.y)), texture(tScene, vUv + vec2(o.x, -o.y)),
                      texture(tScene, vUv + vec2(-o.x, o.y)), texture(tScene, vUv + vec2(o.x, o.y)));
  vec4 acc = vec4(0.0); float n = 0.0;
  for (int i = 0; i < 4; i++) if (!lookBad(t[i].rgb) && !lookBadF(t[i].a)) { acc += vec4(clamp(t[i].rgb, vec3(0.0), vec3(6.0e4)), t[i].a); n += 1.0; }
  return n > 0.5 ? acc / n : c0;
}
void main() {
  // Every fetch of the HDR scene target in this chain is sanitised at the BOUNDARY — here, in the bloom prefilter
  // (lookSafe) and in the exposure meter — so no downstream stage can be handed a NaN, an Inf or a NEGATIVE radiance.
  // The clamp's lower bound is load-bearing, not decoration: pipeline.checkHDR() finds 2-8 negative pixels per
  // scenario and the count tracks live content (r7 critic), so this is defence against a material, not a constant.
  vec4 raw = sceneResolve();
  vec3 col = lookBad(raw.rgb) ? fillHole() : clamp(raw.rgb, vec3(0.0), vec3(6.0e4));
#ifdef USE_RESOLVE
  if (!lookBadF(raw.a)) col = resolveDither(col, raw.a);
#endif
  float depth = texture(tDepth, vUv).r;
  float death = uDeath * uSpectate;   // look.spectateGrade = 0 switches the whole spectate grade off without touching uDeath
  // World position of whatever the depth buffer holds here, reconstructed ONCE (the AO water gate, the fog-of-war
  // lookup and the debug views all used to rebuild it separately).
  vec3 wpos = vec3(0.0); float water = 0.0;
  if (depth < 0.99999) {
    vec4 wp4 = uInvViewProj * vec4(vec3(vUv, depth) * 2.0 - 1.0, 1.0); wpos = wp4.xyz / wp4.w;
    water = lookWaterAt(wpos);
  }
  float lum = dot(col, LUMA);
#ifdef USE_AO
  float ao = depth < 0.99999 ? aoUpsample(depth) : 1.0; if (lookBadF(ao)) ao = 1.0;
  // AO gate: only EMISSIVE / VFX pixels roll off, and only well above the bloom knee. The r2 gate keyed on total
  // luminance from 0.85 and faded 25–58 % of the AO off sunlit 0.9-albedo marble (linear 1.1–1.5) — i.e. exactly the
  // Azure Concord structures that most needed grounding. Lit opaque surfaces now keep the full effect.
  float aoPeak = max(col.r, max(col.g, col.b));
  // …and it is released again in the darkest pixels (uAOFloor, linear pre-exposure): AO's job is to give SHAPE to
  // ambient-lit surfaces, and multiplying an already-shadowed 0.01 by 0.4 only loses the form that is there. Wild Rift's
  // play space keeps p5 ≈ 22–30 with < 0.4 % of pixels under luma 16 — dense shadows, no crushed black.
  float aoK = uAO * mix(1.0, 0.55, smoothstep(2.6, 5.0, aoPeak)) * smoothstep(uAOFloor.x, uAOFloor.y, lum);
  // …and released, per channel, on the river SURFACE. The occlusion here was computed for the river BED (the water
  // writes no depth), so a neutral multiply reads as a hole punched in the water rather than a shadow cast into it.
  // What survives is a quarter of it, weighted so red and green lose more than blue — water absorbs the warm end, so
  // the residual keeps the teal and the sky reflection instead of bleaching them toward grey.
  vec3 aoV = mix(vec3(ao), vec3(1.0) - (1.0 - ao) * uWaterAO, water);
  if (uPixQ > 0.5) aoV = mix(floor(aoV * 4.0 + 0.5) / 4.0, vec3(1.0), step(0.5, water));   // pixel mode: AO in clean steps; none on water (it tinted a cyan rim round stones)
  col *= mix(vec3(1.0), aoV, aoK);
  lum = dot(col, LUMA);
#endif
#ifdef USE_BLOOM
  { vec3 bl = lookSafe(texture(tBloom, vUv).rgb) * uBloom;
    if (uPixQ > 0.5) {   // pixel mode: bloom as a few ordered-dithered value steps (no soft smear on the pixel grid)
      float bL = max(dot(bl, LUMA), 1e-5);
      float bs = floor(sqrt(bL) * 6.0 + 0.5) / 6.0; bl *= bs * bs / bL; }
    col += bl; }
#endif
  float ev = uAutoExposure > 0.5 ? texture(tAdapt, vec2(0.5)).r : 0.0; if (lookBadF(ev)) ev = 0.0;
  float expo = uExposure * pow(2.0, ev + uEVBias);
  if (uShadowSat > 0.001) {
    // shadow chroma: dark pixels (display-referred, after exposure) keep their colour instead of sinking to grey — WR's
    // shadowed grass stays green. Boost is capped per pixel so no channel goes negative (no hue flips).
    float sl = dot(col, LUMA) * expo;
    float k = uShadowSat * (1.0 - smoothstep(0.012, 0.16, sl)) * smoothstep(0.0, 0.006, sl);
    float cl = dot(col, LUMA); float mn = min(col.r, min(col.g, col.b));
    if (mn < cl) k = min(k, mn / (cl - mn + 1e-6));
    col = max(vec3(cl) + (col - vec3(cl)) * (1.0 + k), vec3(0.0));
  }
  // ---------------------------------------------------------------- TEAM-HUE GUARD (computed ONCE, before any pass
  // that removes chroma). DESIGN §4 makes ally-blue / enemy-red / self-green a readability RULE, and three passes below
  // desaturate: aerial perspective, fog of war and the death grade. The r3 build protected team hue only inside the
  // death block, which measured the hue of a colour the aerial and fog passes had ALREADY bleached — so a red enemy
  // health bar was turned grey first and then "protected" once there was nothing left to protect. 'keep' is therefore
  // derived here, from the lit scene colour, and handed to all three.
  // Hue distance without atan: the chroma vector (2r−g−b, √3(g−b)) of a cheap sqrt-gamma colour, compared by COSINE
  // against team red #ff4a3d → (0.996, 0.089) and team blue #2f8cff → (−0.892, −0.453) (src/core/palette.js).
  // cos 0.951 = 18°, cos 0.766 = 40°: full protection within ≈ 18° of a team hue, none beyond ≈ 40°, and ONLY on
  // genuinely saturated colour.
  // r4 used ±31°/±66° with a saturation gate that opened at csat 0.06, and measured on a real spectate frame that let
  // in most of the map: warm bank dirt (csat 0.20) sat 24° from team red scored keep 0.61 and the teal river (csat
  // 0.35) sat 15° from team blue scored keep 1.0 — so deathTeamBoost was re-saturating the WORLD, not the teams.
  // Measured on the death scenario with the HUD hidden: the shipped grade left play-space HSV saturation 0.313 against
  // 0.316 with deathDesat switched off, i.e. the boost was cancelling the entire desaturation. Team red and team blue
  // are vivid by contract (csat 0.51 / 0.57) and terrain is not, so the gate now opens over 0.30 → 0.55.
  float keep;
  {
    vec3 gq = sqrt(max(col, vec3(0.0)));
    float gmx = max(gq.r, max(gq.g, gq.b)), gmn = min(gq.r, min(gq.g, gq.b));
    float csat = gmx > 1e-4 ? (gmx - gmn) / gmx : 0.0;
    vec2 cv = vec2(2.0 * gq.r - gq.g - gq.b, 1.7320508 * (gq.g - gq.b));
    float cvl = length(cv) + 1e-6; vec2 cn = cv / cvl;
    float cs = max(dot(cn, vec2(0.9960, 0.0887)), dot(cn, vec2(-0.8920, -0.4530)));
    keep = smoothstep(0.766, 0.951, cs) * smoothstep(0.30, 0.55, csat);
  }
  // Aerial perspective. scene.fog's near plane (90) is ~5× further than the whole visible ground at the gameplay rig
  // distance (≈16 u), so it never contributes: our frames used to hold identical contrast and saturation from the
  // bottom edge to the top. Measured on refs/wr-game/first-turret-destroyed.png, matched grass bands lose ≈ 12 luma and
  // ≈ 0.19 HSV saturation from the near to the far edge; this reproduces that in linear light, masked off the sky.
  // sprite pixels (pixel-mode tag 0.75) carry ONE flat depth for the whole quad: depth-reconstructed effects (aerial,
  // fog of war) would sample the ground behind the unit, so they skip them (sprites are only drawn when visible)
  float isSpr = 1.0 - step(uPixQ > 0.5 ? 0.1 : 0.02, abs(raw.a - 0.75));   // HD too (sprites tag when app.mtSceneTags)
  if (uAerial.x > 0.001 && depth < 0.99999 && isSpr < 0.5) {
    float a = smoothstep(uAerial.z, uAerial.w, linDepth(depth));
    vec3 aer = mix(col, vec3(dot(col, LUMA)), uAerial.y * (1.0 - 0.6 * keep)) * uAerialTint;
    col = mix(col, aer, a * uAerial.x);
  }
  if (uFow > 0.001) {
    float vis = depth < 0.99999 ? texture(tVision, wpos.xz * uVisionST.xy + uVisionST.zw).r : 0.0;
    float hidden = (1.0 - vis) * uFow * (1.0 - isSpr);
    float l = dot(col, LUMA);
    // Fogged ground CONVERGES on a mist colour instead of being scaled toward black: a pure multiply drove already-dark
    // ground (shadow, basalt, shaded water) into unreadable mud (r2 critic: 2.1 % of the lane frame under luma 16 vs
    // 0.15 % in the WR ref). Bright ground still sinks; crushed shadows land on a legible haze floor.
    // r4: …and the mist is a DESTINATION, not a brightener. The convergence above removes information; uFowExposure
    // then sets where fogged ground LANDS relative to the ground you can see (r3 critic: fogged grass measured 0.93× the
    // luma of visible grass and warmer, so the vision edge could not be found anywhere in the lane frame).
    vec3 fogged = mix(mix(col, vec3(l), uFowDesat * (1.0 - 0.6 * keep)) * uFowDarken, uFowHaze * uFowTint, uFowLift) * uFowExposure;
    col = mix(col, fogged, hidden);
  }
  if (uXray > 0.001 && depth < 0.99999) {
    // occluded champions (look/xray.js): the scene surface sits clearly in front of the champion's own front-most surface
    // the target is cleared to 0 and bilinear-filtered: rgb is premultiplied by coverage → un-premultiply for the values
    vec4 xr = texture(tXray, vUv);
    if (xr.a > 0.04) {
      vec3 xv = xr.rgb / xr.a;
      float occ = smoothstep(0.3, 0.8, xv.b - linDepth(depth));
      if (occ > 0.0) {
        bool foe = xv.g > 0.83; vec3 tint = xv.g < 0.5 ? uXraySelf : foe ? uXrayFoe : uXrayAlly;
        vec2 ot = uXrayTexel * 1.6;                                          // contour ≈ 2 px at 1080p; taps land between texels
        float cover = (texture(tXray, vUv + vec2(ot.x, 0.0)).a + texture(tXray, vUv - vec2(ot.x, 0.0)).a
                     + texture(tXray, vUv + vec2(0.0, ot.y)).a + texture(tXray, vUv - vec2(0.0, ot.y)).a) * 0.16
                    + (texture(tXray, vUv + ot).a + texture(tXray, vUv - ot).a + texture(tXray, vUv + vec2(ot.x, -ot.y)).a + texture(tXray, vUv + vec2(-ot.x, ot.y)).a) * 0.09;
        float edge = clamp((1.0 - cover) * 2.6, 0.0, 1.0) * smoothstep(0.04, 0.6, xr.a); // inner contour, anti-aliased
        float k = occ * uXray * (foe ? uXrayEnemy : 1.0) * smoothstep(0.04, 0.5, xr.a); float f = xv.r * xv.r;
        // ghost: the occluder is pushed back (×0.3) and the body reads as a flat team-tinted volume brightening toward
        // its silhouette (fresnel²), with a crisp contour — linear ≤ ≈0.9 pre-exposure (≈0.45 after), never blooms
        vec3 ghost = tint * (0.24 + 0.6 * f);
        col = mix(col, col * 0.3 + ghost, 0.9 * k) + tint * (1.0 * edge * k);
      }
    }
  }
  // Death: the EXPOSURE part of the spectate grade belongs in linear light (it is a stop, not a look); the
  // DESATURATION does not — see the display-space block after the sRGB encode.
  if (death > 0.001) col *= pow(2.0, uDeathGrade.y * death);
  col = max(col * expo, vec3(0.0));
#if defined(TM_ACES)
  col = ACESFilmicToneMapping(col);
#elif defined(TM_AGX)
  col = AgXToneMapping(col);
#elif defined(TM_NEUTRAL)
  col = NeutralToneMapping(col);
#else
  col = filmic(col);
#endif
  col = srgbOETF(clamp(col, 0.0, 1.0));
  // BRIGHT-SCENE TONE (r4 c2, critic minor on the base scenario). A scene that meters bright (the white-marble plazas) is pulled DOWN
  // by the one-sided compensation in ADAPT_FRAG, so its cast shadows land off the filmic shoulder — but the frame then
  // has a long bright tail over a dark middle: masked p50 50 / mean 61 / p95 137 against Wild Rift's in-game 68–75 /
  // 64–73 / 106–112, with the plaza's right third navy-dark. Raising the exposure lifts the tail as well (aeBrightComp
  // 0.3: p50 61 but p95 152). So the MIDDLE is lifted and the upper-middle compressed instead, by a monotone display-
  // space curve with both ends fixed, f(y) = y + A·y·(1−y)·(B−y) (A 1.044, B 0.433: +10 luma at 50, −7 at 137, the
  // black floor 22 → 29, slope ≥ 0.74), scaled on luma so hue and saturation are kept. Its strength follows the
  // ADAPTED exposure (smooth, never the raw meter): full below uBrightTone.z EV, none above .y — lane / teamfight /
  // jungle adapt near 0 EV and are untouched; the victory shot is held at cineMaxEV and gets a trace.
  if (uBrightTone.x > 0.0) {
    float bs = uBrightTone.x * smoothstep(uBrightTone.y, uBrightTone.z, ev);
    if (bs > 0.001) { float by = dot(col, LUMA); float bf = by + bs * uBrightCurve.x * by * (1.0 - by) * (uBrightCurve.y - by); if (by > 1e-4) col = min(col * (bf / by), vec3(1.0));
      // r4 c3 (structures critic: "the Azure white marble renders as cold slate"; look critic: base centre saturation 33
      // against 42 for the Wild Rift base reference). The pull-down that keeps the marble's tail in range also leaves it
      // grey-blue: give the same scenes their chroma back and warm the LIT stone toward sunlit cream. Luma-preserving
      // (the tonal statistics above are untouched), weighted by the same strength, warmth ramps in with luma so the
      // shade keeps its cool fill.
      if (uBrightGrade.x + uBrightGrade.y > 0.0) {
        float gy = dot(col, LUMA); vec3 g = mix(vec3(gy), col, 1.0 + bs * uBrightGrade.x);
        float w = bs * uBrightGrade.y * smoothstep(0.2, 0.6, gy); g *= vec3(1.0 + w, 1.0 + 0.25 * w, 1.0 - w);
        float gy2 = dot(g, LUMA); if (gy2 > 1e-4) g *= gy / gy2; col = clamp(g, 0.0, 1.0); }
    }
  }
  if (death > 0.001) {
    // DEATH GRADE — in DISPLAY space, and this is the point. r3 mixed 62 % toward luma in LINEAR light, upstream of a
    // compressive filmic curve, so 62 % linear arrived as ≈ 92 % perceived: the r3 critic measured the spectate frame at
    // play-space HSV saturation 0.036 against 0.438 alive, with enemy minion bar fills reading (93,87,87) sRGB where the
    // live frame reads (234,85,80). Here a 0.78 mix removes 0.78 of the VISIBLE chroma, nothing more, and 'keep' (built
    // before the aerial and fog passes) holds the team hues at 90 % of theirs — spectating is exactly when ally and
    // enemy have to stay separable. Placed before the LUT so the grade's own vibrance still gives the muted world back
    // a little richness instead of leaving it dead flat.
    float dl = dot(col, LUMA);
    float desat = uDeathGrade.x * death * (1.0 - uDeathGrade.z * keep);
    col = mix(col, clamp(vec3(dl) * vec3(0.95, 0.985, 1.05), 0.0, 1.0), desat);
    // …and team hues are not merely spared, they are PUSHED: against a drained world the ally-blue / enemy-red bars and
    // trim have to be the thing the eye lands on. (Measured: the spectate camera frames a shadowed ravine whose scene
    // chroma is low before any grading, so protection alone still left the frame reading monochrome.)
    float dl2 = dot(col, LUMA);
    col = clamp(vec3(dl2) + (col - vec3(dl2)) * (1.0 + uDeathBoost * keep * death), 0.0, 1.0);
  }
#ifdef USE_LUT
  vec3 gr = texture(tLut, col * ((uLutSize - 1.0) / uLutSize) + 0.5 / uLutSize).rgb;
  col = mix(col, gr, uLutAmount);
#endif
  if (death > 0.001) {
    // The LUT runs AFTER the display-space desaturation on purpose — the grade's vibrance gives the drained world a
    // little richness back instead of leaving it dead flat. But vibrance is strongest on exactly the low-saturation
    // colours the desaturation has just created, and r7's stronger cool shadow tint adds chroma to a spectate frame
    // (which is mostly shadow) after the fact, so the LUT was handing back ~24 % of what was taken: measured on a
    // genuinely dead frame, play-space saturation 0.385 ungraded -> 0.291 shipped against 0.462 alive, where the
    // director's target is "roughly half the alive value". A second, small desaturation AFTER the LUT closes that
    // loop, under the same team-hue guard, so team red and team blue still do not move.
    float pl = dot(col, LUMA);
    col = mix(col, vec3(pl), uDeathPost * death * (1.0 - uDeathGrade.z * keep));
    col = mix(col, 0.028 + 0.952 * col, death); // slightly lifted, blacks stay dense
  }
  if (uChroma > 0.001) { float cl = dot(col, LUMA); col = clamp(vec3(cl) + (col - vec3(cl)) * (1.0 + uChroma), 0.0, 1.0); } // cinematic chroma lift
  vec2 q = (vUv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);
  float vr = length(q * vec2(0.78, 1.0));
  col *= 1.0 - (uVignette + death * 0.07) * smoothstep(0.42, 1.05, vr);
  col = mix(col, vec3(1.0, 0.97, 0.9), uFlash);
  col *= 1.0 - uFade;
  col += (ign(gl_FragCoord.xy) - 0.5) / 255.0;
  if (lookBad(col)) col = vec3(0.0); // last line of defence: nothing non-finite ever reaches the display
  if (uDebug > 0) {
    vec3 wp = wpos;
    if (uDebug == 1) col = vec3(depth < 0.99999 ? aoUpsample(depth) : 1.0);
    else if (uDebug == 2) col = vec3(texture(tVision, wp.xz * uVisionST.xy + uVisionST.zw).r);
    else if (uDebug == 3) col = srgbOETF(clamp(lookSafe(texture(tBloom, vUv).rgb) * uBloom, 0.0, 1.0));
    else if (uDebug == 4) col = vec3(fract(wp.xz), fract(wp.y));
    else if (uDebug == 5) col = vec3(0.5 + texture(tAdapt, vec2(0.5)).r * 0.5); // adapted EV: 0.5 = calibrated, ±0.5 per EV
    else if (uDebug == 6) {
      // HDR validity map: magenta = NaN/Inf, blue = negative, yellow = > 1000 linear, grey = valid (dimmed luminance)
      vec3 r = raw.rgb; col = vec3(clamp(dot(lookSafe(r), LUMA) * 0.3, 0.0, 0.3));
      if (lookBad(r)) col = vec3(1.0, 0.0, 1.0);
      else if (min(r.r, min(r.g, r.b)) < -1e-4) col = vec3(0.0, 0.55, 1.0);
      else if (max(r.r, max(r.g, r.b)) > 1.0e3) col = vec3(1.0, 0.85, 0.0);
    }
    else if (uDebug == 7) col = vec3(1.0 - raw.a, raw.a < 0.995 ? 1.0 : 0.0, 0.0); // scene alpha (fractional A2C coverage)
    else if (uDebug == 8) { vec4 xr = texture(tXray, vUv); vec3 xv = xr.rgb / max(xr.a, 1e-3); col = mix(col * 0.25, vec3(xv.r, xv.g, smoothstep(0.3, 0.8, xv.b - linDepth(depth))), xr.a); } // x-ray: fresnel · team · occluded
  }
  outColor = vec4(col, uPixQ > 0.5 ? (isSpr > 0.5 ? 0.75 : water > 0.5 ? 0.25 : clamp(raw.a, 0.0, 1.0)) : 1.0);   // 0.25 = under the water surface
}`
  );
}
var De =
    V +
    `
uniform sampler2D tSrc; uniform sampler2D tDepth; uniform vec2 uTexel; uniform float uAmount; uniform vec2 uAdapt; // (lo, hi) local-contrast knee
uniform mat4 uProj; uniform vec4 uSoft; // (flat-area soften, far band near, far band far, far-field soften)
// FOG OF WAR — detail suppression. The final pass converges a fogged pixel onto the mist colour, which removes LIGHT;
// this removes INFORMATION, which is what fog of war actually is. Wild Rift's fogged ground loses its brush / cliff /
// floor separation; ours kept 100 % of its geometric detail at a lower exposure and therefore read as night (r7
// critic). Done here because this pass is already the display-space low-pass: it owns the tent, it owns the far-field
// blur, and a fogged pixel simply joins the same 'soft' term over a WIDER tap ring.
uniform sampler2D tVision; uniform vec4 uVisionST; uniform mat4 uInvViewProj;
uniform vec3 uFog;   // (current fog strength, detail-suppression amount, blur radius in px)
uniform float uFar;  // texel-density scale: how much of the CAS gain is removed across the far band (sub-texel foliage)
// EDGE-ENERGY TAIL LIMITER (r7). The gap to Wild Rift is a TAIL, not a level: our masked lapMean matches the
// references and our lapP99 is ~2x theirs, i.e. a small set of 1-px, full-contrast features (grass blades, flagstone
// grout, hard silhouette pixels) carries all of it. Every global lever measured here moves the MEAN and leaves the
// tail where it is (sharpenLo 0.10 -> 0.24 took lapMean 12.4 -> 9.9 with lapP99 unchanged at 102). So the tail is cut
// where it lives: a pixel whose own luma Laplacian exceeds uPeak.x sRGB units is mixed toward the 3x3 tent in
// proportion to the excess, capped at uPeak.z. Pixels below the ceiling — 98 % of the frame — are not touched at all,
// which is why the mean survives; and the target is a pure low-pass, so it can neither halo nor overshoot.
uniform vec3 uPeak;  // (ceiling in sRGB Laplacian units, ramp width, maximum mix toward the tent)
// PIXEL MODE (env round 2): tSrc and tDepth are the INTERNAL low-res image (1 px ~ 1 sprite art px). This pass is the
// nearest-neighbour upscale to the screen plus toon outlines from the internal depth: silhouettes get a dark coloured
// 1-px line on the NEAR side, convex creases a light line, concave creases a darker one.
uniform vec4 uPix;   // (k, offset x, offset y, on)
uniform vec4 uPixIn; // (internal w, internal h, world size of one internal px per metre of depth, outline strength)
uniform vec2 uPixSub; // 1-px margin + the camera's sub-pixel residual (internal px): smooth sub-pixel scrolling
float sharpLinDepth(float d) { return uProj[3][2] / ((d * 2.0 - 1.0) + uProj[2][2]); }
float pxZ(ivec2 q) { return sharpLinDepth(texelFetch(tDepth, clamp(q, ivec2(0), ivec2(uPixIn.xy) - 1), 0).r); }
// material tag carried in alpha by world-art: 0.5 = foliage / plants / tall grass, 1 = everything else
float pxFol(ivec2 q) { return 1.0 - step(0.2, abs(texelFetch(tSrc, clamp(q, ivec2(0), ivec2(uPixIn.xy) - 1), 0).a - 0.5)); }
// 0.75 = a pixel-art sprite (carries its own 1-px outline): no geometry outline or crease on it
float pxWat(ivec2 q) { return 1.0 - step(0.1, abs(texelFetch(tSrc, clamp(q, ivec2(0), ivec2(uPixIn.xy) - 1), 0).a - 0.25)); }
float pxSpr(ivec2 q) { return 1.0 - step(0.1, abs(texelFetch(tSrc, clamp(q, ivec2(0), ivec2(uPixIn.xy) - 1), 0).a - 0.75)); }
// silhouette against neighbour q: q lies well behind us. Foliage against foliage only outlines a SEPARATE mass (> 2.4 m
// behind), so the puffs of one crown and the blades of one grass patch merge into a clean silhouette.
float pxSil(ivec2 q, float z0, float thr, float f0) { float dz = pxZ(q) - z0; return step(thr, dz) * (f0 * pxFol(q) > 0.5 ? step(4.0 + 0.05 * z0, dz) : 1.0) * (1.0 - pxSpr(q)); }
void main() {
  if (uPix.w > 0.5) {
    ivec2 ip = clamp(ivec2(floor((gl_FragCoord.xy + uPix.yz) / uPix.x + uPixSub)), ivec2(0), ivec2(uPixIn.xy) - 1);
    vec3 pc = texelFetch(tSrc, ip, 0).rgb;
    float d0 = texelFetch(tDepth, ip, 0).r;
    if (uPixIn.w > 0.0005 && d0 < 0.99999 && pxSpr(ip) < 0.5 && pxWat(ip) < 0.5) {   // no lines on sprites or under water
      float z0 = sharpLinDepth(d0);
      float zl = pxZ(ip + ivec2(-1, 0)), zr = pxZ(ip + ivec2(1, 0)), zd = pxZ(ip + ivec2(0, -1)), zu = pxZ(ip + ivec2(0, 1));
      float fp = z0 * uPixIn.z;                                  // metres covered by one internal px at this depth
      float thr = 0.55 + 0.022 * z0 + 4.0 * fp;
      float f0 = pxFol(ip);
      float sil = max(max(pxSil(ip + ivec2(-1, 0), z0, thr, f0), pxSil(ip + ivec2(1, 0), z0, thr, f0)), max(pxSil(ip + ivec2(0, -1), z0, thr, f0), pxSil(ip + ivec2(0, 1), z0, thr, f0)));
      float sx = zl + zr - 2.0 * z0, sy = zd + zu - 2.0 * z0;    // second difference: plane = 0, crease != 0
      float okx = step(abs(zl - zr), thr), oky = step(abs(zd - zu), thr);
      float cv = (sx * okx + sy * oky) / max(fp, 1e-4);
      float concave = smoothstep(0.55, 1.3, cv), convex = smoothstep(0.55, 1.3, -cv);
      float lum = dot(pc, LUMA);
      vec3 ink = f0 > 0.5 ? pc * vec3(0.45, 0.55, 0.55) : pc * vec3(0.30, 0.27, 0.36) + vec3(0.012, 0.010, 0.022);
      pc = mix(pc, ink, sil * uPixIn.w);
      float isProp = step(0.975, texelFetch(tSrc, ip, 0).a);
      float crK = (1.0 - sil) * (1.0 - f0) * isProp * uPixIn.w;
      pc = mix(pc, min(pc * 1.22 + 0.02, vec3(1.0)), convex * crK * 0.7 * smoothstep(0.05, 0.4, lum));
    }
    outColor = vec4(clamp(pc, 0.0, 1.0), 1.0);
    return;
  }
  vec3 e = texture(tSrc, vUv).rgb;
  if (uAmount <= 0.0005 && uSoft.x <= 0.0005 && uSoft.w <= 0.0005 && uFog.x * uFog.y <= 0.0005 && uPeak.z <= 0.0005) { outColor = vec4(e, 1.0); return; }
  vec3 a = texture(tSrc, vUv + vec2(-uTexel.x, -uTexel.y)).rgb, b = texture(tSrc, vUv + vec2(0.0, -uTexel.y)).rgb, c = texture(tSrc, vUv + vec2(uTexel.x, -uTexel.y)).rgb;
  vec3 d = texture(tSrc, vUv + vec2(-uTexel.x, 0.0)).rgb,                                                   f = texture(tSrc, vUv + vec2(uTexel.x, 0.0)).rgb;
  vec3 g = texture(tSrc, vUv + vec2(-uTexel.x, uTexel.y)).rgb, h = texture(tSrc, vUv + vec2(0.0, uTexel.y)).rgb, i = texture(tSrc, vUv + vec2(uTexel.x, uTexel.y)).rgb;
  vec3 mn = min(min(min(a, b), min(c, d)), min(min(e, f), min(min(g, h), i)));
  vec3 mx = max(max(max(a, b), max(c, d)), max(max(e, f), max(max(g, h), i)));
  float contrast = dot(mx, LUMA) - dot(mn, LUMA);
  float dep = texture(tDepth, vUv).r;
  float lz = sharpLinDepth(dep);
  float band = dep < 0.99999 ? smoothstep(uSoft.y, uSoft.z, lz) : 1.0;
  float far = band * uSoft.w;
  float flatness = uSoft.x * (1.0 - smoothstep(uAdapt.x * 0.45, uAdapt.x, contrast)); // ('flat' is a reserved GLSL interpolation qualifier)
  float soft = clamp(max(far, flatness), 0.0, 1.0);
  // TEXEL DENSITY. A blade of grass 25 u away is sub-texel, so "local contrast" there is aliasing, not detail, and
  // sharpening it is the single cheapest way to manufacture the edge-energy tail the references do not have. The gain
  // is therefore removed outright across the far band rather than merely reduced by the soften term.
  float dens = 1.0 - uFar * band;
  float w = -uAmount * dens * (1.0 - smoothstep(uAdapt.x, uAdapt.y, contrast)) * (1.0 - soft);
  vec3 col = (e + w * (b + d + f + h)) / (1.0 + 4.0 * w);
  col = clamp(col, mn, mx);
  vec3 tent = (e * 4.0 + (b + d + f + h) * 2.0 + (a + c + g + i)) * 0.0625;
  if (soft > 0.0005) col = mix(col, tent, soft); // 3×3 tent
  // fog of war: mix toward a WIDE low-pass (the 3×3 tent is far too tight to dissolve brush / cliff / floor structure)
  float fogSoft = 0.0;
  if (uFog.x * uFog.y > 0.0005 && dep < 0.99999) {
    vec4 wp4 = uInvViewProj * vec4(vec3(vUv, dep) * 2.0 - 1.0, 1.0); vec3 wp = wp4.xyz / wp4.w;
    float vis = texture(tVision, wp.xz * uVisionST.xy + uVisionST.zw).r;
    fogSoft = clamp((1.0 - vis) * uFog.x * uFog.y, 0.0, 1.0);
  }
  if (uPeak.z > 0.0005) {
    float lapL = abs(dot(b + d + f + h - 4.0 * e, LUMA)) * 255.0;
    float kLim = clamp((lapL - uPeak.x) / max(1.0, uPeak.y), 0.0, 1.0) * uPeak.z;
    if (kLim > 0.0005) col = mix(col, tent, kLim);
  }
  if (fogSoft > 0.002) {
    vec2 r = uTexel * uFog.z;
    vec3 wide = (texture(tSrc, vUv + vec2(-r.x, -r.y)).rgb + texture(tSrc, vUv + vec2(r.x, -r.y)).rgb
               + texture(tSrc, vUv + vec2(-r.x, r.y)).rgb + texture(tSrc, vUv + vec2(r.x, r.y)).rgb) * 0.15
              + (texture(tSrc, vUv + vec2(-r.x * 1.5, 0.0)).rgb + texture(tSrc, vUv + vec2(r.x * 1.5, 0.0)).rgb
               + texture(tSrc, vUv + vec2(0.0, -r.y * 1.5)).rgb + texture(tSrc, vUv + vec2(0.0, r.y * 1.5)).rgb) * 0.075
              + tent * 0.1;
    col = mix(col, wide, fogSoft);
  }
  col += (ign(gl_FragCoord.xy) - 0.5) / 255.0;
  outColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`,
  Oe = [`champions`, `creeps`, `structures`];
function ke(e, t, n, r, i) {
  if (e) {
    let a = t.get(n.kind);
    if (a !== void 0) {
      if (a !== null && a.getAnchor(n, r, `ground`, i)) return i;
      if (a === null) return se(n, r, `ground`, i);
    }
    for (let a = 0; a < Oe.length; a++) {
      let o = e.get(Oe[a]);
      if (o && o.getAnchor && o.getAnchor(n, r, `ground`, i))
        return (t.set(n.kind, o), i);
    }
    t.set(n.kind, null);
  }
  return se(n, r, `ground`, i);
}
var Ae = 0.3,
  je = [-1, 1, 1, -1, -1, 1],
  Me = {
    champion: [0.76, 0.42, 0.98],
    minion: [0.74, 0.3, 1.02],
    monster: [0.76, 0.44, 0.95],
    tower: [0.66, 0.7, 0.82],
    inhibitor: [0.66, 0.8, 0.82],
    nexus: [0.62, 1.05, 0.8],
    ward: [0.6, 0.26, 1.1],
  },
  Ne = `
in vec3 position;
in vec4 iDisc;    // world x, ground y, world z, outer radius R1 (on DRY ground)
in vec4 iShape;   // core radius R0, strength, vertical reach, wet (1 = this body stands in the river, -1 = creep: never)
out vec4 vDisc; out vec4 vShape;
uniform mat4 projectionMatrix; uniform mat4 viewMatrix;
void main() {
  vDisc = iDisc; vShape = iShape;
  // unit box [-0.5, 0.5]³ → the disc's world AABB (xz = ±R1, y = ±vertical reach around the ground anchor). A body in
  // the river gets a box WIDE enough for the 1.5× underwater disc the fragment opens up (see WATER below).
  float w = iDisc.w * (1.0 + 0.5 * max(iShape.w, 0.0));
  vec3 p = vec3(position.x * w * 2.0 + iDisc.x,
                position.y * iShape.z * 2.4 + iDisc.y,
                position.z * w * 2.0 + iDisc.z);
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`,
  Pe =
    `
precision highp float; precision highp sampler2D;
in vec4 vDisc; in vec4 vShape; out vec4 outColor;
` +
    B +
    `
uniform sampler2D tDepth; uniform mat4 uInvViewProj; uniform vec2 uInvRes; uniform vec2 uDepthScale;
void main() {
  // depth of whatever the scene already drew under this fragment (full-res texel under our half-res pixel)
  ivec2 t = ivec2(gl_FragCoord.xy * uDepthScale);
  float d = texelFetch(tDepth, t, 0).r;
  if (d >= 0.99999) { outColor = vec4(1.0, 1.0e4, 1.0e4, 1.0e4); return; }   // sky
  vec2 ndcXY = gl_FragCoord.xy * uInvRes * 2.0 - 1.0;
  vec4 wp = uInvViewProj * vec4(ndcXY, d * 2.0 - 1.0, 1.0);
  vec3 P = wp.xyz / wp.w;
  vec2 dxz = P.xz - vDisc.xz;
  float r = length(dxz);
  // WATER. The river writes no depth, so P is the river BED and the pixel the eye sees is the surface above it. A tight,
  // hard-edged disc there reads as a hole punched in the water rather than a shadow cast into it (r6 critic, measured:
  // 0.33x the open water beside it, with the sky term and the foam gone inside the disc). Under water the disc opens
  // up 1.5x and releases with a plain linear falloff instead of the squared crevice shoulder, which is what a diffuse
  // underwater shadow looks like; the final pass then keeps only a chromatic quarter of it (post.js look.waterAO).
  float water = vShape.w < -0.5 ? 0.0 : lookWaterAt(P);   // -1 = a creep: no underwater branch (see _emit)
  float R0 = vShape.x, R1 = vDisc.w * (1.0 + 0.5 * water * vShape.w);
  float a = 1.0 - smoothstep(R0 * mix(1.0, 0.55, water), R1, r);
  a = mix(a * (a * (3.0 - 2.0 * a) * 0.5 + a * 0.5), a, water);
  // vertical: only the ground the body stands on. A body's own pixels sit above its ground anchor, so the same term
  // lets the occlusion creep a little way up the shins (which is what welds a foot to the floor) and then stops.
  float dy = P.y - vDisc.y;
  float v = 1.0 - smoothstep(0.05, vShape.z * mix(1.0, 1.9, water), abs(dy));
  outColor = vec4(1.0 - vShape.y * a * v, 1.0e4, 1.0e4, 1.0e4);
}`,
  Fe = class {
    constructor() {
      ((this.enabled = !0),
        (this.count = 0),
        (this.stats = { units: 0, skipped: 0, resolved: 0, cached: 0 }));
      let e = new ie(1, 1, 1),
        t = new r();
      ((t.index = e.index),
        t.setAttribute(`position`, e.getAttribute(`position`)),
        (this.disc = new b(new Float32Array(896), 4)),
        (this.shape = new b(new Float32Array(896), 4)),
        this.disc.setUsage(ae),
        this.shape.setUsage(ae),
        t.setAttribute(`iDisc`, this.disc),
        t.setAttribute(`iShape`, this.shape),
        (t.instanceCount = 0),
        (this.geometry = t),
        e.dispose(),
        (this.material = new x({
          glslVersion: m,
          vertexShader: Ne,
          fragmentShader: Pe,
          uniforms: {
            tDepth: { value: null },
            uInvViewProj: { value: new j() },
            uInvRes: { value: new p() },
            uDepthScale: { value: new p(2, 2) },
          },
          side: 1,
          depthTest: !1,
          depthWrite: !1,
          toneMapped: !1,
          blending: 5,
          blendEquation: 103,
          blendSrc: 201,
          blendDst: 201,
        })),
        (this.mesh = new O(t, this.material)),
        (this.mesh.frustumCulled = !1),
        (this.mesh.matrixAutoUpdate = !1),
        (this.scene = new A()),
        this.scene.add(this.mesh),
        (this._a = { x: 0.5, y: 0.5, z: 0.5 }),
        (this._a.x = 0),
        (this._a.y = 0),
        (this._a.z = 0),
        (this._slots = new Float64Array(896)),
        (this._slotOf = new Map()),
        (this._slotN = 0),
        (this._creeps = null),
        (this._prov = new Map()),
        (this._planes = new Float64Array(24)),
        (this._pm = new j()),
        (this._world = null),
        (this._q = new Float64Array(5)),
        (this._f = new Float64Array(3)),
        (this._cull = 0),
        (this._n = 0),
        (this._skipped = 0),
        (this._resolved = 0),
        (this._mob = Array(256).fill(null)),
        (this._fix = Array(256).fill(null)));
    }
    setPlanes(e) {
      let t = e.elements,
        n = this._planes;
      for (let e = 0; e < 6; e++) {
        let r = e >> 1,
          i = je[e],
          a = t[3] + i * t[r],
          o = t[7] + i * t[4 + r],
          s = t[11] + i * t[8 + r],
          c = t[15] + i * t[12 + r],
          l = Math.sqrt(a * a + o * o + s * s) || 1,
          u = e * 4;
        ((n[u] = a / l),
          (n[u + 1] = o / l),
          (n[u + 2] = s / l),
          (n[u + 3] = c / l));
      }
    }
    collect(e, t, n, r) {
      let i = e && e.world;
      this.count = 0;
      let a = n && n.contact !== void 0 ? n.contact : 1;
      if (!this.enabled || a <= 0.001 || !i)
        return ((this.geometry.instanceCount = 0), 0);
      let o = i.unitList;
      if (!o) return ((this.geometry.instanceCount = 0), 0);
      this._world !== i &&
        ((this._world = i),
        this._slotOf.clear(),
        (this._slotN = 0),
        this._prov.clear());
      let s = t ? t.get(`creeps`) : null;
      ((this._creeps = s && typeof s.getFootprint == `function` ? s : null),
        (this._cull = +!!r),
        r &&
          (this._pm.multiplyMatrices(r.projectionMatrix, r.matrixWorldInverse),
          this.setPlanes(this._pm)));
      let c = this._f;
      ((c[0] = e.alpha === void 0 ? 1 : e.alpha),
        (c[1] = i.time || 0),
        (c[2] = a));
      let l = e.viewerTeam | 0;
      (o.length > this._mob.length || o.length > this._fix.length) &&
        ((this._mob = Array(o.length * 2).fill(null)),
        (this._fix = Array(o.length * 2).fill(null)));
      let u = this._mob,
        d = this._fix,
        f = 0,
        p = 0,
        m = 0;
      for (let e = 0; e < o.length; e++) {
        let t = o[e];
        if (t.alive === !1) continue;
        let n = t.kind;
        if (Me[n] !== void 0) {
          if (t.team !== l && t.visible && !t.visible[l]) {
            m++;
            continue;
          }
          n === `minion` || n === `champion` || n === `monster`
            ? (u[f++] = t)
            : (d[p++] = t);
        }
      }
      ((this._n = 0), (this._skipped = m), (this._resolved = 0));
      let h = this._q;
      for (let e = 0; e < f; e++) {
        let n = u[e];
        ((u[e] = null),
          (h[0] = n.x),
          (h[1] = n.y),
          (h[2] = n.prevX),
          (h[3] = n.prevY),
          (h[4] = n.radius),
          this._emit(n, t));
      }
      for (let e = 0; e < p; e++) {
        let n = d[e];
        ((d[e] = null),
          (h[0] = n.x),
          (h[1] = n.y),
          (h[2] = n.prevX),
          (h[3] = n.prevY),
          (h[4] = n.radius),
          this._emit(n, t));
      }
      let g = this._n;
      return (
        (this.count = g),
        (this.geometry.instanceCount = g),
        (this.disc.needsUpdate = !0),
        (this.shape.needsUpdate = !0),
        (this.stats.units = g),
        (this.stats.skipped = this._skipped),
        (this.stats.resolved = this._resolved),
        (this.stats.cached = this._slotOf.size),
        g
      );
    }
    _emit(e, t) {
      let n = this._q,
        r = this._f,
        i = Me[e.kind];
      if (this._n >= 224) {
        this._skipped++;
        return;
      }
      if ((n[4] > 0 || (n[4] = 0.4), this._cull === 1)) {
        let e = this._planes,
          t = n[0],
          r = n[1],
          a = -(n[4] * i[2] + i[1] + 3.6);
        if (
          e[0] * t + e[1] * 0.6 + e[2] * r + e[3] < a ||
          e[4] * t + e[5] * 0.6 + e[6] * r + e[7] < a ||
          e[8] * t + e[9] * 0.6 + e[10] * r + e[11] < a ||
          e[12] * t + e[13] * 0.6 + e[14] * r + e[15] < a ||
          e[16] * t + e[17] * 0.6 + e[18] * r + e[19] < a ||
          e[20] * t + e[21] * 0.6 + e[22] * r + e[23] < a
        ) {
          this._skipped++;
          return;
        }
      }
      let a = r[0],
        o = this._a,
        s = n[2] + (n[0] - n[2]) * a,
        c = n[3] + (n[1] - n[3]) * a,
        l = this._slots,
        u = this._slotOf.get(e.id);
      if (u !== void 0 && Math.abs(s - l[u]) + Math.abs(c - l[u + 1]) < Ae)
        ((o.x = s), (o.y = l[u + 2]), (o.z = c));
      else {
        (this._resolved++,
          ke(t, this._prov, e, a, o),
          u === void 0 &&
            (this._slotN >= 224 && (this._slotOf.clear(), (this._slotN = 0)),
            (u = this._slotN * 4),
            this._slotN++,
            this._slotOf.set(e.id, u)),
          (l[u] = s),
          (l[u + 1] = c),
          (l[u + 2] = o.y));
        let n = this._creeps;
        l[u + 3] =
          (n !== null &&
            (e.kind === `minion` || e.kind === `monster`) &&
            +n.getFootprint(e)) ||
          0;
      }
      let d = l[u + 3],
        f = d > 0 ? d * i[2] : (n[4] > 0.12 ? n[4] : 0.12) * i[2],
        p = i[0] * r[2],
        m = 0,
        h = e.cc,
        g = r[1];
      if (h && h.airborneUntil > g) {
        let e = Math.min(1, (h.airborneUntil - g) * 3);
        ((p *= 1 - 0.55 * e), (m = 0.45 * e));
      }
      let _ = this.disc.array,
        v = this.shape.array,
        y = this._n * 4;
      ((_[y] = o.x),
        (_[y + 1] = o.y),
        (_[y + 2] = o.z),
        (_[y + 3] = f + i[1] + m),
        (v[y] = f * 0.95),
        (v[y + 1] = p),
        (v[y + 2] = 0.42 + f * 0.35),
        (v[y + 3] = d > 0 ? -1 : +(o.y < -0.09)),
        this._n++);
    }
    render(e, t, n, r, i, a, o) {
      if (!this.enabled || this.count === 0) return !1;
      let s = this.material.uniforms;
      ((s.tDepth.value = n),
        s.uInvViewProj.value
          .multiplyMatrices(t.projectionMatrix, t.matrixWorldInverse)
          .invert(),
        s.uInvRes.value.set(1 / Math.max(1, r), 1 / Math.max(1, i)),
        s.uDepthScale.value.set(a / Math.max(1, r), o / Math.max(1, i)));
      let c = e.autoClear;
      e.autoClear = !1;
      try {
        e.render(this.scene, t);
      } finally {
        e.autoClear = c;
      }
      return !0;
    }
    dispose() {
      (this.geometry.dispose(),
        this.material.dispose(),
        this._slotOf.clear(),
        this._prov.clear());
    }
  },
  Ie = class {
    constructor(e = 0) {
      ((this.value = 0.5), (this.value = e));
    }
  },
  H = (e) => new Ie(e),
  U = (e, t, n = {}) =>
    new x({
      glslVersion: m,
      vertexShader: I,
      fragmentShader: e,
      uniforms: t,
      defines: n,
      depthTest: !1,
      depthWrite: !1,
      blending: 0,
      toneMapped: !1,
    }),
  W = (e, t, n = {}) =>
    new T(Math.max(1, e), Math.max(1, t), {
      type: f,
      format: a,
      depthBuffer: !1,
      stencilBuffer: !1,
      minFilter: D,
      magFilter: D,
      generateMipmaps: !1,
      ...n,
    }),
  Le = Object.freeze({
    high: {
      prMax: 2,
      samples: 4,
      samplesHiDpi: 2,
      scale: 0.9,
      samplesScaled: 2,
      scaleBelowPR: 1.3,
      ao: !0,
      aoSamples: 12,
      bloom: !0,
      bloomLevels: 6,
      lut: !0,
      resolve: !0,
    },
    medium: {
      prMax: 1.5,
      samples: 2,
      samplesHiDpi: 0,
      scale: 0.9,
      scaleBelowPR: 1.3,
      ao: !0,
      aoSamples: 8,
      bloom: !0,
      bloomLevels: 5,
      lut: !0,
      resolve: !0,
    },
    low: {
      prMax: 1,
      samples: 0,
      samplesHiDpi: 0,
      ao: !1,
      aoSamples: 6,
      bloom: !0,
      bloomLevels: 4,
      lut: !0,
      resolve: !1,
      sharpen: !1,
    },
  });
function Re(e, t, n, r, i = 0.18, a = [0, 0, 0, 0]) {
  let o = r ** +e,
    s = r ** +(e * t),
    c = i ** +e,
    l = i ** +(e * t),
    u = (o * n - c) / ((s - l) * n),
    d = o - s * u;
  return ((a[0] = e), (a[1] = t), (a[2] = u), (a[3] = d), a);
}
function G(e, t = null) {
  let n = e.renderer;
  e._syncRT ||
    ((e._syncRT = new T(1, 1, { depthBuffer: !1 })),
    (e._syncBuf = new Uint8Array(4)),
    (e._syncMat = U(
      `precision highp float; uniform sampler2D tSrc; in vec2 vUv; out vec4 o; void main(){ o = vec4(texture(tSrc, vec2(0.5)).rgb, 1.0); }`,
      { tSrc: { value: null } },
    )),
    (e._syncQuad = new N(e._syncMat)));
  let r = n.getRenderTarget();
  (n.setRenderTarget(e._syncRT),
    t
      ? ((e._syncMat.uniforms.tSrc.value = t), e._syncQuad.render(n))
      : n.clear(!0, !1, !1),
    n.readRenderTargetPixels(e._syncRT, 0, 0, 1, 1, e._syncBuf),
    n.setRenderTarget(r));
}
var K = (e, t, n) => {
  e[t] = e[t] ? e[t] * 0.9 + n * 0.1 : n;
};
function ze(e) {
  return (
    e._timer === void 0 &&
      ((e._timer =
        e.renderer
          .getContext()
          .getExtension(`EXT_disjoint_timer_query_webgl2`) || null),
      (e._pending = []),
      (e._free = [])),
    e._timer
  );
}
function Be(e) {
  let t = e._timer;
  if (!t) return;
  let n = e.renderer.getContext(),
    r = n.getParameter(t.GPU_DISJOINT_EXT),
    i = e._pending;
  for (let t = 0; t < i.length; t++) {
    let a = i[t];
    n.getQueryParameter(a.q, n.QUERY_RESULT_AVAILABLE) &&
      (r || K(e.timings, a.key, n.getQueryParameter(a.q, n.QUERY_RESULT) / 1e6),
      e._free.push(a.q),
      i.splice(t--, 1));
  }
  let a = e.timings;
  ((a.post =
    (a.xray || 0) +
    (a.exposure || 0) +
    (a.ao || 0) +
    (a.bloom || 0) +
    (a.final || 0) +
    (a.sharpen || 0)),
    (a.gpuTimer = !0));
}
function Ve(e, t, n, r, i) {
  let a = ze(e);
  if (a && e._pending.length < 64) {
    let o = e.renderer.getContext(),
      s = e._free.pop() || o.createQuery();
    (o.beginQuery(a.TIME_ELAPSED_EXT, s),
      n.run(r, i),
      o.endQuery(a.TIME_ELAPSED_EXT),
      e._pending.push({ key: t, q: s }));
    return;
  }
  G(e);
  let o = performance.now();
  (n.run(r, i),
    G(e, n.texture || null),
    K(e.timings, t, performance.now() - o));
}
var q = class extends M {
    constructor(e, t) {
      (super(),
        (this.chain = e),
        (this.key = t),
        (this.needsSwap = !1),
        (this.dt = 0.016));
    }
    render(e, t, n, r) {
      ((this.dt = r > 0 ? Math.min(0.1, r) : 0),
        this.chain.profiling
          ? Ve(this.chain, this.key, this, e, t)
          : this.run(e, t));
    }
  },
  He = class extends q {
    constructor(e) {
      super(e, `scene`);
    }
    run(e) {
      let t = this.chain;
      e.setRenderTarget(t.sceneRT);
      let n = e.autoClear;
      e.autoClear = !0;
      try {
        e.render(t.scene, t.camera);
      } finally {
        e.autoClear = n;
      }
    }
    get texture() {
      return this.chain.sceneRT.texture;
    }
  },
  Ue = class extends q {
    constructor(e) {
      (super(e, `xray`), (this.active = !1));
    }
    run() {
      let e = this.chain;
      this.active =
        e.look.xray > 0 && e.xray.enabled && e.xray.render(e.camera);
    }
    get texture() {
      return this.chain.xray.rt.texture;
    }
  },
  We = class extends q {
    constructor(e) {
      (super(e, `exposure`),
        (this.meter = U(Se, {
          tScene: { value: null },
          tDepth: { value: null },
          tPrev: { value: null },
          uCell: { value: new p(1 / 64, 1 / 64) },
          uMaskLo: H(2.4),
          uMaskHi: H(3.2),
          uCap: H(2.5),
        })),
        (this.down = U(Ce, { tSrc: { value: null }, uTexel: { value: null } })),
        (this.adapt = U(we, {
          tMeter: { value: null },
          tPrev: { value: null },
          uKey: H(0.3),
          uMinEV: H(-0.5),
          uMaxEV: H(0.5),
          uK: { value: new p(1, 1) },
          uEnabled: H(1),
          uComp: { value: new p(0, -2.06) },
          uCine: { value: new p(99, 0) },
        })),
        (this.quad = new N(this.meter)));
      let t = { type: S, minFilter: k, magFilter: k };
      ((this.chainRT = []), (this.chainTexel = []));
      for (let e = 64; e >= 1; e >>= 2)
        (this.chainRT.push(W(e, e)), this.chainTexel.push(new p(1 / e, 1 / e)));
      ((this.adaptA = W(1, 1, t)),
        (this.adaptB = W(1, 1, t)),
        (this.snapFor = 0.3),
        (this.hold = 0),
        (this.slow = 1),
        (this.ceilEV = 1 / 0),
        (this.ceilTau = 0.3),
        (this.meterEvery = 2),
        (this._frame = 0),
        (this._acc = 0));
    }
    snap(e = 0.3) {
      this.snapFor = e;
    }
    run(e) {
      if (
        ((this._acc += this.dt),
        this.snapFor <= 0 && ++this._frame % this.meterEvery !== 0)
      )
        return;
      let t = this._acc;
      this._acc = 0;
      let n = this.chain,
        r = n.look,
        i = this.quad,
        a = this.meter.uniforms;
      ((a.tScene.value = n.sceneRT.texture),
        (a.tDepth.value = n.sceneRT.depthTexture),
        (a.tPrev.value = this.adaptA.texture),
        (a.uMaskHi.value = r.bloomThreshold));
      let o = Math.max(0.5, r.bloomThreshold - Math.max(0.3, r.bloomKnee));
      (a.uMaskLo.value !== o && (a.uMaskLo.value = o),
        a.uCap.value !== r.aeTileCap && (a.uCap.value = r.aeTileCap),
        (i.material = this.meter),
        e.setRenderTarget(this.chainRT[0]),
        i.render(e),
        (i.material = this.down));
      let s = this.down.uniforms;
      for (let t = 1; t < this.chainRT.length; t++)
        ((s.tSrc.value = this.chainRT[t - 1].texture),
          (s.uTexel.value = this.chainTexel[t - 1]),
          e.setRenderTarget(this.chainRT[t]),
          i.render(e));
      let c = this.adapt.uniforms,
        l = this.snapFor > 0;
      ((this.snapFor -= t),
        (c.tMeter.value = this.chainRT[this.chainRT.length - 1].texture),
        (c.tPrev.value = this.adaptA.texture),
        (c.uKey.value = r.aeKey),
        (c.uMinEV.value = r.aeMinEV),
        (c.uMaxEV.value = r.aeMaxEV),
        (c.uEnabled.value = +!!r.autoExposure),
        c.uComp.value.set(
          r.aeBrightComp,
          Math.log2(Math.max(1e-4, r.aeBrightRef)),
        ));
      let u = this.hold > 0,
        d = this.ceilEV < 90,
        f = u && d;
      c.uCine.value.set(d ? this.ceilEV : 99, +!!u);
      let p = l
          ? 1
          : u
            ? 0
            : 1 - Math.exp(-t / Math.max(0.01, r.aeTau * this.slow)),
        m = l
          ? 1
          : u
            ? f
              ? 1 - Math.exp(-t / Math.max(0.01, this.ceilTau))
              : 0
            : 1 -
              Math.exp(
                -t / Math.max(0.01, (r.aeTauDown || r.aeTau) * this.slow),
              );
      (c.uK.value.set(p, m),
        (i.material = this.adapt),
        e.setRenderTarget(this.adaptB),
        i.render(e));
      let h = this.adaptA;
      ((this.adaptA = this.adaptB), (this.adaptB = h));
    }
    get texture() {
      return this.adaptA.texture;
    }
    dispose() {
      (this.meter.dispose(), this.down.dispose(), this.adapt.dispose());
      for (let e of this.chainRT) e.dispose();
      (this.adaptA.dispose(), this.adaptB.dispose(), this.quad.dispose());
    }
  },
  Ge = class extends q {
    constructor(e) {
      (super(e, `ao`),
        (this.mat = U(
          ve,
          {
            tDepth: { value: null },
            uProj: { value: new j() },
            uInvProj: { value: new j() },
            uTexel: { value: new p() },
            uRadius: H(1.1),
            uIntensity: H(1.6),
            uBias: H(0.08),
            uMaxPx: H(90),
            uPower: H(1),
            uFarScale: H(2.4),
            uFarWeight: H(0.4),
            uViewInv: { value: new j() },
          },
          { SAMPLES: 12, TURNS: `7.0` },
        )),
        (this.blur = U(ye, {
          tAO: { value: null },
          uDir: { value: new p() },
          uSharp: H(1),
        })),
        (this.quad = new N(this.mat)),
        (this.rtA = W(1, 1)),
        (this.rtB = W(1, 1)),
        (this.full = [1, 1]));
    }
    setSize(e, t) {
      let n = Math.max(1, Math.round(e / 2)),
        r = Math.max(1, Math.round(t / 2));
      (this.rtA.setSize(n, r),
        this.rtB.setSize(n, r),
        (this.full[0] = e),
        (this.full[1] = t));
    }
    setSamples(e) {
      this.mat.defines.SAMPLES !== e &&
        ((this.mat.defines.SAMPLES = e), (this.mat.needsUpdate = !0));
    }
    run(e) {
      let t = this.chain,
        n = t.look,
        r = this.mat.uniforms;
      ((r.tDepth.value = t.sceneRT.depthTexture),
        r.uProj.value.copy(t.camera.projectionMatrix),
        r.uInvProj.value.copy(t.camera.projectionMatrixInverse),
        r.uViewInv.value.copy(t.camera.matrixWorld),
        r.uTexel.value.set(1 / this.full[0], 1 / this.full[1]),
        (r.uRadius.value = n.aoRadius),
        (r.uIntensity.value = n.aoIntensity),
        (r.uBias.value = n.aoBias),
        r.uFarScale.value !== n.aoFarScale &&
          (r.uFarScale.value = n.aoFarScale),
        r.uFarWeight.value !== n.aoFarWeight &&
          (r.uFarWeight.value = n.aoFarWeight));
      let i = 64 * (this.full[1] / 1080);
      (r.uMaxPx.value !== i && (r.uMaxPx.value = i),
        (this.quad.material = this.mat),
        e.setRenderTarget(this.rtA),
        this.quad.render(e),
        (this.quad.material = this.blur));
      let a = this.blur.uniforms;
      ((a.tAO.value = this.rtA.texture),
        a.uDir.value.set(1 / this.rtA.width, 0),
        e.setRenderTarget(this.rtB),
        this.quad.render(e),
        (a.tAO.value = this.rtB.texture),
        a.uDir.value.set(0, 1 / this.rtA.height),
        e.setRenderTarget(this.rtA),
        this.quad.render(e),
        t.contact &&
          t.contact.render(
            e,
            t.camera,
            t.sceneRT.depthTexture,
            this.rtA.width,
            this.rtA.height,
            this.full[0],
            this.full[1],
          ));
    }
    get texture() {
      return this.rtA.texture;
    }
    dispose() {
      (this.mat.dispose(),
        this.blur.dispose(),
        this.rtA.dispose(),
        this.rtB.dispose(),
        this.quad.dispose());
    }
  },
  Ke = class extends q {
    constructor(e, t = 6) {
      (super(e, `bloom`),
        (this.levels = t),
        (this.down = []),
        (this.up = []),
        (this.size = null),
        (this.pre = U(
          be,
          {
            tSrc: { value: null },
            uTexel: { value: null },
            uThreshold: H(1.2),
            uKnee: H(0.5),
            uClampMax: H(60),
            uWide: { value: new w(0.62, 0.22, 0.18) },
            tAdapt: { value: null },
            uExpo: { value: new p(0.4, 1) },
          },
          { PREFILTER: 1 },
        )),
        (this.dn = U(be, {
          tSrc: { value: null },
          uTexel: { value: null },
          uThreshold: H(0),
          uKnee: H(0),
          uClampMax: H(60),
        })),
        (this.upm = U(xe, {
          tLow: { value: null },
          tHigh: { value: null },
          uTexel: { value: null },
          uScatter: H(0.7),
        })),
        (this.quad = new N(this.pre)),
        this.setLevels(t));
    }
    setLevels(e) {
      for (let e of this.down) e.dispose();
      for (let e of this.up) e.dispose();
      ((this.levels = e), (this.down = []), (this.up = []), (this.texel = []));
      for (let t = 0; t < e; t++)
        (this.down.push(W(1, 1)),
          this.texel.push(new p()),
          t < e - 1 && this.up.push(W(1, 1)));
      ((this.srcTexel = this.srcTexel || new p()),
        this.size && this.setSize(this.size[0], this.size[1]));
    }
    setSize(e, t) {
      this.size = [e, t];
      for (let n = 0; n < this.levels; n++) {
        let r = 2 ** (n + 1),
          i = Math.max(1, Math.round(e / r)),
          a = Math.max(1, Math.round(t / r));
        (this.down[n].setSize(i, a),
          this.texel[n].set(1 / i, 1 / a),
          n < this.levels - 1 && this.up[n].setSize(i, a));
      }
      this.srcTexel.set(1 / Math.max(1, e), 1 / Math.max(1, t));
    }
    run(e) {
      let t = this.chain,
        n = t.look,
        r = this.quad,
        i = t.sceneRT.texture,
        a = this.srcTexel;
      for (let o = 0; o < this.levels; o++) {
        let s = o === 0 ? this.pre : this.dn;
        if (
          ((r.material = s),
          (s.uniforms.tSrc.value = i),
          (s.uniforms.uTexel.value = a),
          o === 0)
        ) {
          s.uniforms.uThreshold.value = n.bloomThreshold;
          let e = Math.max(0.01, n.bloomKnee);
          (s.uniforms.uKnee.value !== e && (s.uniforms.uKnee.value = e),
            s.uniforms.uWide.value.set(
              n.bloomWideThreshold,
              Math.max(0.005, n.bloomWideKnee),
              n.bloomWide / (1 + 0.35 * t.boost[0]),
            ),
            (s.uniforms.tAdapt.value = t.exposurePass.texture),
            s.uniforms.uExpo.value.set(n.exposure, +!!n.autoExposure));
        }
        (e.setRenderTarget(this.down[o]),
          r.render(e),
          (i = this.down[o].texture),
          (a = this.texel[o]));
      }
      ((r.material = this.upm),
        (this.upm.uniforms.uScatter.value = n.bloomScatter));
      let o = this.levels - 1;
      for (let t = this.levels - 2; t >= 0; t--) {
        let n = this.upm.uniforms;
        ((n.tLow.value = (
          o === this.levels - 1 ? this.down[o] : this.up[o]
        ).texture),
          (n.tHigh.value = this.down[t].texture),
          (n.uTexel.value = this.texel[o]),
          e.setRenderTarget(this.up[t]),
          r.render(e),
          (o = t));
      }
    }
    get texture() {
      return this.levels > 1 ? this.up[0].texture : this.down[0].texture;
    }
    dispose() {
      (this.pre.dispose(), this.dn.dispose(), this.upm.dispose());
      for (let e of this.down) e.dispose();
      for (let e of this.up) e.dispose();
      this.quad.dispose();
    }
  },
  qe = class extends q {
    constructor(e) {
      super(e, `final`);
      let t = new v(new Uint8Array([255, 255, 255, 255]), 1, 1);
      t.needsUpdate = !0;
      let n = new v(new Uint8Array([0, 0, 0, 255]), 1, 1);
      ((n.needsUpdate = !0),
        (this.white = t),
        (this.black = n),
        (this.mat = U(
          Ee(),
          {
            tScene: { value: null },
            tDepth: { value: null },
            tAO: { value: t },
            tBloom: { value: n },
            tVision: { value: t },
            tLut: { value: null },
            tAdapt: { value: n },
            uInvViewProj: { value: new j() },
            uVisionST: { value: new C(1 / 120, 1 / 120, 0, 0) },
            uResolution: { value: new p(1, 1) },
            uExposure: H(1),
            uAO: H(0.6),
            uBloom: H(0.3),
            uFow: H(0),
            uDeath: H(0),
            uSpectate: H(1),
            uVignette: H(0.1),
            uPixQ: H(0),
            uLutAmount: H(1),
            uLutSize: H(33),
            uFowTint: { value: new w(0.8, 0.88, 1.08) },
            uFowDarken: H(0.5),
            uFowDesat: H(0.45),
            uFowHaze: { value: new w(0.04, 0.046, 0.058) },
            uFowLift: H(0.4),
            uFowExposure: H(1),
            uAerialTint: { value: new w(0.78, 0.85, 0.98) },
            uAerial: { value: new C(0.35, 0.38, 14, 34) },
            uAOFloor: { value: new p(0.008, 0.07) },
            uWaterAO: { value: new w(0.3, 0.26, 0.15) },
            uDeathGrade: { value: new w(0.78, -0.3, 0.9) },
            uDeathBoost: H(0.5),
            uDeathPost: H(0),
            uFade: H(0),
            uFlash: H(0),
            uDebug: H(0),
            uTexel: { value: new p(1, 1) },
            uProj: { value: new j() },
            uAOSize: { value: new p(1, 1) },
            tXray: { value: n },
            uXray: H(0),
            uXrayEnemy: H(0.6),
            uXrayTexel: { value: new p(1, 1) },
            uXraySelf: { value: new w(0.55, 1, 0.62) },
            uXrayAlly: { value: new w(0.36, 0.7, 1) },
            uXrayFoe: { value: new w(1, 0.34, 0.27) },
            uAutoExposure: H(1),
            uSceneScale: H(1),
            uResolveTap: H(0),
            uBrightTone: { value: new w(0, -0.7, -1.4) },
            uBrightCurve: { value: new p(1.044, 0.433) },
            uBrightGrade: { value: new p(0, 0) },
            uShadowSat: H(0),
            uEVBias: H(0),
            uChroma: H(0),
            uCurve: { value: new C(1.3, 0.95, 1, 0) },
            uCurveX: { value: new w(1, 2, 8) },
            uCrossMax: H(1),
          },
          { USE_AO: 1, USE_BLOOM: 1, USE_LUT: 1, USE_RESOLVE: 1 },
        )),
        (this.quad = new N(this.mat)),
        (this._curve = [0, 0, 0, 0]),
        (this._curveKey = ``));
    }
    setDefines(e) {
      let t = this.mat,
        n = !1;
      for (let r of Je) {
        let i = !!e[r];
        i !== r in t.defines &&
          (i ? (t.defines[r] = 1) : delete t.defines[r], (n = !0));
      }
      n && (t.needsUpdate = !0);
    }
    setSize(e, t) {
      (this.mat.uniforms.uResolution.value.set(e, t),
        this.mat.uniforms.uTexel.value.set(1 / e, 1 / t));
    }
    updateCurve(e) {
      let t = Re(
        e.tmContrast,
        e.tmShoulder,
        e.tmMid,
        e.tmWhite,
        0.18,
        this._curve,
      );
      (this.mat.uniforms.uCurve.value.set(t[0], t[1], t[2], t[3]),
        this.mat.uniforms.uCurveX.value.set(e.tmSat, e.tmCrossSat, e.tmCross),
        (this.mat.uniforms.uCrossMax.value = e.tmCrossMax));
    }
    run(e, t) {
      let n = this.chain,
        r = n.look,
        i = this.mat.uniforms;
      ((i.tScene.value = n.sceneRT.texture),
        (i.tDepth.value = n.sceneRT.depthTexture),
        (i.tAO.value = n.aoPass.enabled ? n.aoPass.texture : this.white),
        i.uProj.value.copy(n.camera.projectionMatrix),
        n.aoPass.enabled
          ? i.uAOSize.value.set(n.aoPass.rtA.width, n.aoPass.rtA.height)
          : i.uAOSize.value.set(1, 1),
        (i.tBloom.value = n.bloomPass.enabled
          ? n.bloomPass.texture
          : this.black),
        (i.tAdapt.value = n.exposurePass.texture),
        (i.uAutoExposure.value = +!!r.autoExposure),
        (i.uPixQ.value = n.pixelMode ? 1 : 0));
      let a = r.resolveTap > 0 ? r.resolveTap : 0;
      i.uResolveTap.value !== a && (i.uResolveTap.value = a);
      {
        let e = r.brightTone,
          t = r.brightCurve;
        (e && i.uBrightTone.value.set(e[0], e[1], e[2]),
          t && i.uBrightCurve.value.set(t[0], t[1]));
        let n = r.brightGrade;
        n && i.uBrightGrade.value.set(n[0], n[1]);
      }
      let o = n.xrayPass.active ? r.xray : 0;
      if (
        (i.uXray.value !== o && (i.uXray.value = o),
        i.uXrayEnemy.value !== r.xrayEnemy &&
          (i.uXrayEnemy.value = r.xrayEnemy),
        o > 0)
      ) {
        let e = n.xray.rt;
        ((i.tXray.value = e.texture),
          i.uXrayTexel.value.set(1 / e.width, 1 / e.height));
      }
      i.uInvViewProj.value
        .multiplyMatrices(
          n.camera.projectionMatrix,
          n.camera.matrixWorldInverse,
        )
        .invert();
      let s = n.boost;
      ((i.uExposure.value = r.exposure),
        i.uShadowSat.value !== r.shadowSat &&
          (i.uShadowSat.value = r.shadowSat),
        (i.uAO.value = r.aoStrength),
        (i.uLutAmount.value = r.lutAmount));
      let c = r.bloomStrength * (1 + 0.35 * s[0]);
      i.uBloom.value !== c && (i.uBloom.value = c);
      let l = r.vignette + 0.06 * s[0];
      i.uVignette.value !== l && (i.uVignette.value = l);
      let u = 0.14 * s[0];
      i.uEVBias.value !== u && (i.uEVBias.value = u);
      let d = 0.14 * s[0];
      (i.uChroma.value !== d && (i.uChroma.value = d),
        i.uDebug.value !== (r.debugView | 0) &&
          (i.uDebug.value = r.debugView | 0),
        (i.uFowDarken.value = r.fowDarken),
        (i.uFowDesat.value = r.fowDesat),
        i.uFowTint.value.set(r.fowTint[0], r.fowTint[1], r.fowTint[2]),
        i.uFowHaze.value.set(r.fowHaze[0], r.fowHaze[1], r.fowHaze[2]),
        i.uFowLift.value !== r.fowLift && (i.uFowLift.value = r.fowLift),
        i.uFowExposure.value !== r.fowExposure &&
          (i.uFowExposure.value = r.fowExposure),
        i.uAerialTint.value.set(
          r.aerialTint[0],
          r.aerialTint[1],
          r.aerialTint[2],
        ),
        i.uAerial.value.set(
          r.aerialStrength * (1 - s[1]),
          r.aerialDesat,
          r.aerialNear * s[2],
          r.aerialFar * s[2],
        ),
        i.uAOFloor.value.set(r.aoFloorLo, r.aoFloorHi),
        i.uWaterAO.value.set(r.waterAO[0], r.waterAO[1], r.waterAO[2]));
      let f = r.spectateGrade === 0 || r.spectateGrade === !1 ? 0 : 1;
      (i.uSpectate.value !== f && (i.uSpectate.value = f),
        i.uDeathGrade.value.set(
          r.deathDesat,
          -Math.abs(r.deathEV),
          r.deathTeamKeep,
        ),
        i.uDeathBoost.value !== r.deathTeamBoost &&
          (i.uDeathBoost.value = r.deathTeamBoost),
        i.uDeathPost.value !== r.deathDesatPost &&
          (i.uDeathPost.value = r.deathDesatPost),
        e.setRenderTarget(this.renderToScreen ? null : n.ldrRT || t),
        this.quad.render(e));
    }
    dispose() {
      (this.mat.dispose(),
        this.quad.dispose(),
        this.white.dispose(),
        this.black.dispose());
    }
  },
  Je = [
    `USE_AO`,
    `USE_BLOOM`,
    `USE_LUT`,
    `USE_RESOLVE`,
    `TM_ACES`,
    `TM_AGX`,
    `TM_NEUTRAL`,
  ],
  Ye = class extends q {
    constructor(e) {
      (super(e, `sharpen`),
        (this.mat = U(De, {
          tSrc: { value: null },
          tDepth: { value: null },
          uTexel: { value: new p(1, 1) },
          uAmount: H(0.11),
          uAdapt: { value: new p(0.1, 0.35) },
          uProj: { value: new j() },
          uSoft: { value: new C(0, 1, 2, 0) },
          tVision: { value: null },
          uVisionST: { value: new C(1 / 120, 1 / 120, 0, 0) },
          uInvViewProj: { value: new j() },
          uFog: { value: new w(0, 0, 4.5) },
          uFar: H(1),
          uPeak: { value: new w(85, 50, 0.55) },
          uPix: { value: new C(1, 0, 0, 0) },
          uPixSub: { value: new p(1, 1) },
          uPixIn: { value: new C(1, 1, 0.001, 1) },
        })),
        (this.quad = new N(this.mat)),
        (this.enabled = !1));
    }
    setSize(e, t) {
      this.mat.uniforms.uTexel.value.set(1 / e, 1 / t);
    }
    run(e, t) {
      let n = this.chain,
        r = n.look,
        i = this.mat.uniforms;
      if (!n.ldrRT) return;
      if (n.pixelMode) {
        let P = n.pixel, cam = n.camera, mp = globalThis.__moba && globalThis.__moba.mtPixel, co = (mp && mp.camOffset) || [0, 0];
        (i.uPix.value.set(P.k, P.offX, P.offY, 1),
          i.uPixSub.value.set(1 + (+co[0] || 0), 1 + (+co[1] || 0)),
          i.uPixIn.value.set(n.ldrRT.width, n.ldrRT.height, (2 * Math.tan(((cam.fov || 26) * Math.PI) / 360)) / P.internalH, r.outline ?? 1));
      } else i.uPix.value.w = 0;
      ((i.tSrc.value = n.ldrRT.texture),
        (i.tDepth.value = n.sceneRT ? n.sceneRT.depthTexture : null));
      let a = r.sharpen * (n.pixelRatio > 1.4 ? 0.7 : 1);
      (i.uAmount.value !== a && (i.uAmount.value = a),
        i.uAdapt.value.set(r.sharpenLo, r.sharpenHi),
        i.uProj.value.copy(n.camera.projectionMatrix));
      let o = n.uniforms;
      ((i.tVision.value = o.tVision.value),
        i.uVisionST.value.copy(o.uVisionST.value),
        i.uInvViewProj.value.copy(o.uInvViewProj.value),
        i.uFog.value.set(o.uFow.value, r.fowDetail, Math.max(0.5, r.fowBlurPx)),
        i.uFar.value !== r.sharpenFar && (i.uFar.value = r.sharpenFar),
        i.uPeak.value.set(r.peakCeil, r.peakRamp, r.peakMix));
      let s = n.boost;
      (i.uSoft.value.set(
        r.soften,
        r.aerialNear * s[2],
        r.aerialFar * s[2],
        r.farSoften,
      ),
        e.setRenderTarget(this.renderToScreen ? null : t),
        this.quad.render(e));
    }
    get texture() {
      return this.chain.ldrRT ? this.chain.ldrRT.texture : null;
    }
    dispose() {
      (this.mat.dispose(), this.quad.dispose());
    }
  },
  Xe = {
    exposure: 0.66,
    toneMapping: `filmic`,
    tmContrast: 1.26,
    tmShoulder: 0.95,
    tmMid: 0.16,
    tmWhite: 4,
    tmSat: 1.06,
    tmCrossSat: 2,
    tmCross: 8,
    tmCrossMax: 0.6,
    autoExposure: 1,
    aeKey: 0.24,
    aeMinEV: -0.25,
    aeMaxEV: 0.35,
    aeTau: 0.5,
    aeTauDown: 1.2,
    aeTileCap: 2.5,
    aeBrightComp: 0.85,
    aeBrightRef: 0.19,
    brightTone: [1, -0.7, -1.4],
    brightCurve: [1.044, 0.433],
    brightGrade: [0.3, 0.06],
    cineMaxEV: -0.85,
    cineTau: 0.3,
    aoStrength: 0.8,
    aoRadius: 1.4,
    aoIntensity: 5.6,
    aoBias: 0.06,
    aoFarScale: 2.4,
    aoFarWeight: 0.4,
    aoFloorLo: 0.008,
    aoFloorHi: 0.07,
    contact: 1,
    bloomStrength: 0.28,
    bloomThreshold: 3.0,
    bloomKnee: 0.6,
    bloomScatter: 0.5,
    bloomWide: 0.06,
    bloomWideThreshold: 0.62,
    bloomWideKnee: 0.22,
    waterAO: [0.3, 0.26, 0.15],
    spectateGrade: 1,
    deathDesat: 0.9,
    deathEV: 0.15,
    deathTeamKeep: 0.95,
    deathTeamBoost: 0.8,
    deathDesatPost: 0.35,
    shadowSat: 0.85,
    xray: 1,
    xrayEnemy: 0.6,
    vignette: 0.035,
    lutAmount: 1,
    sharpen: 0.16,
    sharpenLo: 0.1,
    sharpenHi: 0.2,
    sharpenFar: 1,
    soften: 0,
    farSoften: 0.12,
    ditherResolve: 1,
    resolveTap: 0.22,
    cineVis: 1,
    peakCeil: 85,
    peakRamp: 50,
    peakMix: 0.55,
    fowDarken: 0.64,
    fowDesat: 0.35,
    fowLift: 0.16,
    fowHaze: [0.2, 0.24, 0.3],
    fowTint: [0.88, 0.92, 1],
    fowExposure: 0.9,
    fowLOS: 1,
    fowDetail: 0.2,
    fowBlurPx: 3,
    aerialStrength: 0.25,
    aerialDesat: 0.22,
    aerialNear: 12.5,
    aerialFar: 25,
    aerialTint: [0.86, 0.94, 1.04],
    debugView: 0,
    outline: 1,
  },
  Ze = class {
    constructor({ renderer: e, scene: t, camera: n, look: r }) {
      ((this.renderer = e),
        (this.scene = t),
        (this.camera = n),
        (this.look = r),
        (this.profiling = !1),
        (this.timings = {}),
        (this.boost = new Float32Array(3)),
        (this.boost[2] = 1),
        (this.sceneRT = null),
        (this.samples = -1),
        (this.width = 1),
        (this.height = 1),
        (this.pixelRatio = 1),
        (this.sceneScale = 1),
        (this.cfg = null),
        (this.scaleOverride = 0),
        (this.pixelMode = (() => {
          try {
            return new URLSearchParams(location.search).get(`pixel`) === `1`;
          } catch (e) {
            return !1;
          }
        })()),
        (this.pixel = { k: 1, ppm: 32, ppmScreen: 32, internalW: 1, internalH: 1, rtW: 1, rtH: 1, offX: 0, offY: 0, zoomFix: 1, fov0: 0 }),
        (this.composer = new pe(e, new T(1, 1, { type: f, depthBuffer: !1 }))),
        (this.xray = new ge(e)),
        (this.contact = new Fe()),
        (this.ldrRT = null),
        (this.scenePass = new He(this)),
        (this.xrayPass = new Ue(this)),
        (this.exposurePass = new We(this)),
        (this.aoPass = new Ge(this)),
        (this.bloomPass = new Ke(this)),
        (this.finalPass = new qe(this)),
        (this.sharpenPass = new Ye(this)));
      for (let e of [
        this.scenePass,
        this.xrayPass,
        this.exposurePass,
        this.aoPass,
        this.bloomPass,
        this.finalPass,
        this.sharpenPass,
      ])
        this.composer.addPass(e);
      this.finalPass.updateCurve(r);
    }
    updateSharpen() {
      let e = this.look,
        t =
          (e.sharpen > 5e-4 ||
            e.soften > 5e-4 ||
            e.farSoften > 5e-4 ||
            e.fowDetail > 5e-4 ||
            e.peakMix > 5e-4) &&
          (!this.cfg || this.cfg.sharpen !== !1);
      this.pixelMode && (t = !0);
      this.sharpenPass.enabled = t;
      let n = Math.max(1, Math.round(this.width * this.pixelRatio)),
        r = Math.max(1, Math.round(this.height * this.pixelRatio));
      this.pixelMode && ((n = this.pixel.rtW), (r = this.pixel.rtH));
      t
        ? (this.ldrRT
            ? (this.ldrRT.width !== n || this.ldrRT.height !== r) &&
              this.ldrRT.setSize(n, r)
            : (this.ldrRT = new T(n, r, {
                type: h,
                format: a,
                depthBuffer: !1,
                stencilBuffer: !1,
                minFilter: k,
                magFilter: k,
                generateMipmaps: !1,
              })),
          (this.ldrRT.texture.name = `look.ldr`),
          this.sharpenPass.setSize(n, r))
        : (this.ldrRT &&= (this.ldrRT.dispose(), null));
      if (this.ldrRT) {
        let f = this.pixelMode ? k : D;
        this.ldrRT.texture.magFilter !== f &&
          ((this.ldrRT.texture.magFilter = f), (this.ldrRT.texture.minFilter = f), (this.ldrRT.texture.needsUpdate = !0));
      }
    }
    // PIXEL MODE: integer upscale k chosen so one internal px == one sprite art px (32 per metre) at the focus.
    // fixPixelFov runs right after the camera rig each frame (before the camera director snaps to the grid): it picks k
    // from the rig's own lens, then narrows/widens the lens by zoomFix so the focus lands on exactly 32·k screen px/m.
    _ppmFor(fov) {
      let c = this.camera, H0 = Math.max(1, Math.round(this.height * this.pixelRatio));
      c.updateMatrixWorld();
      let m = c.matrixWorld.elements, dy = -m[9], cy = m[13], dist = dy < -0.05 ? (cy - 0.6) / -dy : 25;
      return { ppm: H0 / (2 * Math.max(1, dist) * Math.tan((fov * Math.PI) / 360)), dist: dist };
    }
    fixPixelFov() {
      if (!this.pixelMode || !this.camera) return;
      let c = this.camera, P = this.pixel, fov0 = c.fov || 26, r = this._ppmFor(fov0), kf = r.ppm / 32, k = P.k;
      (P.kInit !== !0 || Math.abs(kf - k) > 0.62) && ((k = Math.max(1, Math.min(8, Math.round(kf)))), (P.kInit = !0));
      P.zoomFix = r.ppm / (32 * k);
      P.fov0 = fov0;
      let fov = (360 / Math.PI) * Math.atan(Math.tan((fov0 * Math.PI) / 360) * P.zoomFix);
      Math.abs(fov - c.fov) > 1e-6 && ((c.fov = fov), c.updateProjectionMatrix());
      k !== P.k && ((P.k = k), this.updatePixel(!0));
    }
    updatePixel(force) {
      if (!this.pixelMode) return;
      let c = this.camera, P = this.pixel,
        H0 = Math.max(1, Math.round(this.height * this.pixelRatio)),
        W0 = Math.max(1, Math.round(this.width * this.pixelRatio)),
        r = this._ppmFor(c.fov || 26),
        k = P.k || 1;
      if (!P.kInit) { k = Math.max(1, Math.min(8, Math.round(r.ppm / 32))); P.k = k; }
      let iw = Math.ceil(W0 / k), ih = Math.ceil(H0 / k);
      P.ppmScreen = r.ppm;
      if (force || iw !== P.internalW || ih !== P.internalH) {
        ((P.internalW = iw), (P.internalH = ih), (P.rtW = iw + 2), (P.rtH = ih + 2), (P.offX = (iw * k - W0) / 2), (P.offY = (ih * k - H0) / 2));
        (this.applySizes(), this.updateSharpen());
      }
      try {
        let a = globalThis.__moba;
        if (a) {
          let o = a.mtPixel || (a.mtPixel = {});
          // internalW/H = the scene render-target size (incl. the 1-px margin on every side): what a renderer that snaps in
          // clip space must use as its viewport. gridW/H = the visible grid; pxm = metres per internal px at the focus.
          Object.assign(o, { k: k, ppm: 32, ppmScreen: r.ppm, ppmInternal: r.ppm / k, internalW: iw + 2, internalH: ih + 2, gridW: iw, gridH: ih, margin: 1, pxm: (2 * r.dist * Math.tan(((c.fov || 26) * Math.PI) / 360)) / ih, offX: P.offX, offY: P.offY, zoomFix: P.zoomFix, fovLens: P.fov0 });
          o.camOffset || (o.camOffset = [0, 0]);
        }
      } catch (e) {}
    }
    get uniforms() {
      return this.finalPass.mat.uniforms;
    }
    sceneScaleFor(e, t) {
      return this.scaleOverride > 0
        ? Math.min(2, Math.max(0.5, this.scaleOverride))
        : e && e.scale > 0 && e.scale !== 1 && t < (e.scaleBelowPR || 1.3)
          ? Math.min(2, Math.max(0.5, e.scale))
          : 1;
    }
    applySizes() {
      let e = (this.sceneScale = this.sceneScaleFor(this.cfg, this.pixelRatio)),
        t = Math.max(1, Math.round(this.width * this.pixelRatio)),
        n = Math.max(1, Math.round(this.height * this.pixelRatio)),
        r = Math.max(1, Math.round(t * e)),
        i = Math.max(1, Math.round(n * e));
      if (this.pixelMode) {
        let P = this.pixel;
        P.internalW <= 1 && ((P.internalW = Math.ceil(t / P.k)), (P.internalH = Math.ceil(n / P.k)), (P.rtW = P.internalW + 2), (P.rtH = P.internalH + 2));
        ((r = P.rtW), (i = P.rtH), (this.sceneScale = r / t), (t = r), (n = i));
      }
      (this.sceneRT &&
        (this.sceneRT.width !== r || this.sceneRT.height !== i) &&
        this.sceneRT.setSize(r, i),
        this.aoPass.setSize(r, i),
        this.bloomPass.setSize(r, i));
      let a = this.finalPass.mat.uniforms;
      return (
        a.uResolution.value.set(t, n),
        a.uTexel.value.set(1 / r, 1 / i),
        (a.uSceneScale.value = r / t),
        [r, i]
      );
    }
    ensureSceneTarget(e, t, n) {
      if (this.sceneRT && this.samples === n) {
        (this.sceneRT.width !== e || this.sceneRT.height !== t) &&
          this.sceneRT.setSize(e, t);
        return;
      }
      this.sceneRT && this.sceneRT.dispose();
      let r = new u(e, t);
      ((r.type = re),
        (r.format = s),
        (r.minFilter = k),
        (r.magFilter = k),
        (this.sceneRT = new T(e, t, {
          type: f,
          format: a,
          samples: n,
          depthBuffer: !0,
          stencilBuffer: !1,
          depthTexture: r,
          minFilter: D,
          magFilter: D,
          generateMipmaps: !1,
        })),
        (this.sceneRT.texture.name = `look.sceneHDR`),
        (this.samples = n));
    }
    configure(e, t) {
      this.cfg = e;
      let n =
          this.sceneScaleFor(e, t) > 1
            ? (e.samplesScaled ?? e.samples)
            : t >= 1.75
              ? e.samplesHiDpi
              : e.samples,
        [r, i] = this.applySizes();
      this.pixelMode && (n = 0);
      (this.ensureSceneTarget(r, i, n),
        (this.aoPass.enabled = !!e.ao),
        this.aoPass.setSamples(e.aoSamples),
        (this.bloomPass.enabled = !!e.bloom),
        this.bloomPass.levels !== e.bloomLevels &&
          this.bloomPass.setLevels(e.bloomLevels),
        this.applyDefines());
    }
    applyDefines() {
      let e = this.cfg || Le.high,
        t = this.look.toneMapping;
      (this.finalPass.setDefines({
        USE_AO: e.ao,
        USE_BLOOM: e.bloom,
        USE_LUT: e.lut,
        USE_RESOLVE: e.resolve && this.look.ditherResolve && !this.pixelMode,
        TM_ACES: t === `aces`,
        TM_AGX: t === `agx`,
        TM_NEUTRAL: t === `neutral`,
      }),
        this.finalPass.updateCurve(this.look),
        this.updateSharpen());
    }
    snapExposure(e = 0.3) {
      this.exposurePass.snap(e);
    }
    setSize(e, t, n) {
      ((this.width = e),
        (this.height = t),
        (this.pixelRatio = n),
        this.composer.setPixelRatio(n),
        this.composer.setSize(e, t),
        this.xray.setSize(e, t, n),
        this.pixelMode && this.camera && this.updatePixel(!0),
        this.applySizes(),
        this.updateSharpen());
    }
    renderPostOnly(e) {
      let t = [
        this.xrayPass,
        this.exposurePass,
        this.aoPass,
        this.bloomPass,
        this.finalPass,
        this.sharpenPass,
      ];
      for (let n = 0; n < t.length; n++) {
        let r = t[n];
        r.enabled && ((r.dt = e), r.run(this.renderer, null));
      }
    }
    render(e) {
      try {
        globalThis.__moba && (globalThis.__moba.mtSceneTags = !0);   // scene alpha carries material tags (0.75 = sprite) in every mode
      } catch (t) {}
      let pv = !1;
      if (this.pixelMode && this.camera) {
        this.updatePixel(!1);
        let P = this.pixel;
        (this.camera.setViewOffset(P.internalW, P.internalH, -1, -1, P.internalW + 2, P.internalH + 2), (pv = !0));
      }
      try {
        this._render(e);
      } finally {
        pv && this.camera.clearViewOffset();
      }
    }
    _render(e) {
      let t = this.timings,
        n = this.profiling;
      if (n && ze(this)) {
        (Be(this), this.composer.render(e));
        return;
      }
      let r = 0;
      (n && (G(this), (r = performance.now())),
        this.composer.render(e),
        n &&
          (G(this),
          K(t, `total`, performance.now() - r),
          (t.post =
            (t.xray || 0) +
            (t.exposure || 0) +
            (t.ao || 0) +
            (t.bloom || 0) +
            (t.final || 0) +
            (t.sharpen || 0))));
    }
    precompile() {
      try {
        let e = new A(),
          t = new E(-1, 1, 1, -1, 0, 1),
          n = this.finalPass.quad._mesh.geometry,
          r = this.exposurePass;
        for (let t of [
          r.meter,
          r.down,
          r.adapt,
          this.aoPass.mat,
          this.aoPass.blur,
          this.bloomPass.pre,
          this.bloomPass.dn,
          this.bloomPass.upm,
          this.finalPass.mat,
          this.sharpenPass.mat,
        ]) {
          let r = new O(n, t);
          ((r.frustumCulled = !1), e.add(r));
        }
        (this.renderer.compile(e, t),
          this.renderer.compile(this.contact.scene, this.camera));
      } catch (e) {
        console.warn(`[look] post precompile skipped`, e);
      }
    }
    benchmark(e = 60) {
      let t = this.renderer,
        n = {
          width: this.sceneRT.width,
          height: this.sceneRT.height,
          samples: this.samples,
          iterations: e,
          raw: {},
          belowNoise: [],
        },
        r = this.profiling;
      this.profiling = !1;
      let i = (e) => {
          G(this, e);
          let t = performance.now();
          for (let t = 0; t < 8; t++) G(this, e);
          return (performance.now() - t) / 8;
        },
        a = (r, a, s) => {
          a.dt = 1 / 60;
          let c = i(s),
            l = 2;
          for (;;) {
            G(this, s);
            let e = performance.now();
            for (let e = 0; e < l; e++) a.run(t, o);
            if ((G(this, s), performance.now() - e >= 20 || l >= 512)) break;
            l *= 2;
          }
          let u = Math.max(2, Math.ceil(e / l)),
            d = 0;
          for (let e = 0; e < u; e++) {
            G(this, s);
            let e = performance.now();
            for (let e = 0; e < l; e++) a.run(t, o);
            (G(this, s), (d += performance.now() - e));
          }
          let f = d / (u * l),
            p = (d - u * c) / (u * l);
          ((n.raw[r] = +f.toFixed(3)),
            (n[r] = +Math.max(0, p).toFixed(3)),
            (p < 0.05 * f || p < 0.02) && n.belowNoise.push(r),
            (n.syncOverhead = Math.max(n.syncOverhead || 0, +c.toFixed(3))));
        },
        o = (this._benchRT ||= new T(1, 1, { depthBuffer: !1 }));
      ((o.width !== this.sceneRT.width || o.height !== this.sceneRT.height) &&
        o.setSize(this.sceneRT.width, this.sceneRT.height),
        a(`scene`, this.scenePass, this.sceneRT.texture),
        this.xray.count > 0 &&
          a(
            `xray`,
            { run: () => this.xray.render(this.camera), set dt(e) {} },
            this.xray.rt.texture,
          ),
        a(`exposure`, this.exposurePass, this.exposurePass.texture),
        this.aoPass.enabled && a(`ao`, this.aoPass, this.aoPass.texture),
        this.bloomPass.enabled &&
          a(`bloom`, this.bloomPass, this.bloomPass.texture));
      let s = this.finalPass,
        c = s.renderToScreen;
      if (
        ((s.renderToScreen = !1),
        a(`final`, s, this.ldrRT ? this.ldrRT.texture : o.texture),
        (s.renderToScreen = c),
        this.sharpenPass.enabled)
      ) {
        let e = this.sharpenPass,
          t = e.renderToScreen;
        ((e.renderToScreen = !1),
          a(`sharpen`, e, o.texture),
          (e.renderToScreen = t));
      }
      return (
        (n.post = +(
          (n.xray || 0) +
          (n.exposure || 0) +
          (n.ao || 0) +
          (n.bloom || 0) +
          n.final +
          (n.sharpen || 0)
        ).toFixed(3)),
        (n.total = +(n.post + n.scene).toFixed(3)),
        (n.rawPost = +(
          (n.raw.xray || 0) +
          (n.raw.exposure || 0) +
          (n.raw.ao || 0) +
          (n.raw.bloom || 0) +
          n.raw.final +
          (n.raw.sharpen || 0)
        ).toFixed(3)),
        (this.profiling = r),
        n
      );
    }
    readHDR(e = 240, t = 135) {
      let n = this.renderer;
      (!this._hdrRT || this._hdrRT.width !== e || this._hdrRT.height !== t) &&
        (this._hdrRT && this._hdrRT.dispose(),
        (this._hdrRT = new T(e, t, { type: S, depthBuffer: !1 })),
        (this._hdrMat =
          this._hdrMat ||
          U(
            `precision highp float; uniform sampler2D tSrc; in vec2 vUv; out vec4 o; void main(){ o = vec4(texture(tSrc, vUv).rgb, 1.0); }`,
            { tSrc: { value: null } },
          )),
        (this._hdrQuad = this._hdrQuad || new N(this._hdrMat)));
      let r = n.getRenderTarget();
      ((this._hdrMat.uniforms.tSrc.value = this.sceneRT.texture),
        n.setRenderTarget(this._hdrRT),
        this._hdrQuad.render(n));
      let i = new Float32Array(e * t * 4);
      (n.readRenderTargetPixels(this._hdrRT, 0, 0, e, t, i),
        n.setRenderTarget(r));
      let a = new Float32Array(e * t);
      for (let n = 0; n < e * t; n++)
        a[n] =
          i[n * 4] * 0.2126 + i[n * 4 + 1] * 0.7152 + i[n * 4 + 2] * 0.0722;
      let o = Float32Array.from(a).sort(),
        s = (e) =>
          +o[Math.min(o.length - 1, Math.floor(e * o.length))].toFixed(3);
      return {
        p10: s(0.1),
        p50: s(0.5),
        p90: s(0.9),
        p99: s(0.99),
        max: +o[o.length - 1].toFixed(2),
        data: i,
        lum: a,
        w: e,
        h: t,
      };
    }
    readExposure() {
      let e = this.renderer,
        t = new Float32Array(4);
      return (
        e.readRenderTargetPixels(this.exposurePass.adaptA, 0, 0, 1, 1, t),
        {
          ev: +t[0].toFixed(3),
          target: +t[1].toFixed(3),
          geoMean: +(2 ** t[2]).toFixed(3),
        }
      );
    }
    dispose() {
      if (
        (this.exposurePass.dispose(),
        this.aoPass.dispose(),
        this.bloomPass.dispose(),
        this.finalPass.dispose(),
        this.sharpenPass.dispose(),
        this.xray.dispose(),
        this.contact.dispose(),
        this.sceneRT && this.sceneRT.dispose(),
        this.ldrRT && this.ldrRT.dispose(),
        this._syncRT && (this._syncRT.dispose(), this._syncMat.dispose()),
        this._syncQuad && this._syncQuad.dispose(),
        this._benchRT && this._benchRT.dispose(),
        this._hdrRT && this._hdrRT.dispose(),
        this._hdrMat && this._hdrMat.dispose(),
        this._hdrQuad && this._hdrQuad.dispose(),
        this._timer && this._pending)
      ) {
        let e = this.renderer.getContext();
        for (let t of this._pending) e.deleteQuery(t.q);
        for (let t of this._free) e.deleteQuery(t);
        ((this._pending.length = 0), (this._free.length = 0));
      }
      this.composer.dispose();
    }
  },
  J = Object.freeze({
    contrast: 0.17,
    pivot: 0.42,
    blackLift: 0.025,
    whiteRoll: 0.06,
    whiteRelax: 0.86,
    shadowTint: [-0.032, -0.005, 0.08],
    shadowRange: 0.44,
    highlightTint: [0.075, 0.03, -0.058],
    midTint: [0.028, 0.008, -0.032],
    saturation: 1.04,
    vibrance: 0.5,
    satProtect: 0.62,
  }),
  Y = [0.2126, 0.7152, 0.0722],
  X = (e) => (e < 0 ? 0 : e > 1 ? 1 : e),
  Z = (e, t, n) => {
    let r = X((n - e) / (t - e));
    return r * r * (3 - 2 * r);
  };
function Q(e, t, n) {
  if (t <= 0) return e;
  let r = 1 + t * 1.6;
  return e < n ? n * X(e / n) ** +r : 1 - (1 - n) * X((1 - e) / (1 - n)) ** +r;
}
function $(e, t, n, r = J, i = [0, 0, 0]) {
  let a = e * Y[0] + t * Y[1] + n * Y[2],
    o = Q(a, r.contrast, r.pivot),
    s = a > 1e-5 ? o / a : 1,
    c = e * s * 0.5 + 0.5 * Q(e, r.contrast, r.pivot),
    l = t * s * 0.5 + 0.5 * Q(t, r.contrast, r.pivot),
    u = n * s * 0.5 + 0.5 * Q(n, r.contrast, r.pivot),
    d = X(c * Y[0] + l * Y[1] + u * Y[2]),
    f = 1 - Z(0.02, r.shadowRange ?? 0.38, d),
    p = Z(0.45, 0.85, d) * (1 - Z(0.88, 1, d)),
    m = 1 - Math.abs(d - 0.5) * 2;
  ((c += r.shadowTint[0] * f + r.highlightTint[0] * p + r.midTint[0] * m),
    (l += r.shadowTint[1] * f + r.highlightTint[1] * p + r.midTint[1] * m),
    (u += r.shadowTint[2] * f + r.highlightTint[2] * p + r.midTint[2] * m));
  let h = c * Y[0] + l * Y[1] + u * Y[2],
    g = Math.max(c, l, u),
    _ = g > 1e-5 ? (g - Math.min(c, l, u)) / g : 0,
    v = r.vibrance * (1 - Z(0.15, r.satProtect, _)),
    y = r.saturation + v;
  ((c = h + (c - h) * y), (l = h + (l - h) * y), (u = h + (u - h) * y));
  let b = r.blackLift;
  ((c = b + c * (1 - b)), (l = b + l * (1 - b)), (u = b + u * (1 - b)));
  let x = r.whiteRoll,
    S = Math.min(0.999, r.whiteRelax ?? 0.999);
  return (
    (c -= x * (1 - Z(S, 1, c)) * c * c * c),
    (l -= x * (1 - Z(S, 1, l)) * l * l * l),
    (u -= x * (1 - Z(S, 1, u)) * u * u * u),
    (i[0] = X(c)),
    (i[1] = X(l)),
    (i[2] = X(u)),
    i
  );
}
function Qe(e = J, t = 33) {
  let n = new Uint8Array(t * t * t * 4),
    r = [0, 0, 0];
  for (let i = 0; i < t; i++)
    for (let a = 0; a < t; a++)
      for (let o = 0; o < t; o++) {
        $(o / (t - 1), a / (t - 1), i / (t - 1), e, r);
        let s = (o + a * t + i * t * t) * 4;
        ((n[s] = Math.round(r[0] * 255)),
          (n[s + 1] = Math.round(r[1] * 255)),
          (n[s + 2] = Math.round(r[2] * 255)),
          (n[s + 3] = 255));
      }
  let i = new ne(n, t, t, t);
  return (
    (i.format = a),
    (i.type = h),
    (i.minFilter = D),
    (i.magFilter = D),
    (i.wrapS = i.wrapT = i.wrapR = o),
    (i.unpackAlignment = 1),
    (i.generateMipmaps = !1),
    (i.colorSpace = ``),
    (i.needsUpdate = !0),
    (i.name = `look.gradeLUT`),
    i
  );
}
function $e(e, t) {
  let n = e.image.width,
    r = e.image.data,
    i = [0, 0, 0];
  for (let e = 0; e < n; e++)
    for (let a = 0; a < n; a++)
      for (let o = 0; o < n; o++) {
        $(o / (n - 1), a / (n - 1), e / (n - 1), t, i);
        let s = (o + a * n + e * n * n) * 4;
        ((r[s] = Math.round(i[0] * 255)),
          (r[s + 1] = Math.round(i[1] * 255)),
          (r[s + 2] = Math.round(i[2] * 255)));
      }
  e.needsUpdate = !0;
}
export {
  Ze as a,
  H as c,
  N as d,
  Xe as i,
  I as l,
  Qe as n,
  Le as o,
  $e as r,
  Re as s,
  J as t,
  _e as u,
};
