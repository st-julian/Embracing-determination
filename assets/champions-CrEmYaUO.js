import { D as e, E as t, T as n } from "./map-oE9sOnNc.js";
import { t as r } from "./events-WjIX4JqM.js";
import {
  Dt as i,
  Ft as a,
  It as o,
  J as s,
  K as c,
  O as l,
  R as u,
  Tt as d,
  Xt as f,
  Y as p,
  Yt as m,
  Zt as h,
  b as g,
  bt as _,
  dt as v,
  jt as y,
  q as b,
  st as x,
  ut as S,
  v as C,
  yt as w,
} from "./index-DHK-Ptzs.js";
import { a as T, o as E } from "./height-CVtQdZ3e.js";
import { t as D } from "./palette-L_rDAXd8.js";
import { n as O } from "./sync-2oxeFGdP.js";
import { ensureLod as k, getType as A } from "./types-DoNhvZyi.js";
import {
  createChampionMaterial as ee,
  disposeSharedAssets as te,
  prepassMaterial as ne,
  sharedAssets as re,
  translucentTwin as ie,
} from "./material-BPS_1X92.js";
import { ChampionView as j } from "./view-DHHUoofK.js";
import { i as ae, n as oe, s as M, t as N } from "./lut-Ci_c3wOk.js";
import { champPrebuild as __mtChampPrebuild, legacyMeshes as __mtLegacyMeshes } from "../mt/render/loadtime.js"; // [MT-HOOK] legacyMeshes import (mt/render/loadtime.js)
var P = 1.9,
  se = 3,
  ce = 0.22,
  le = 0.05 * 0.05,
  ue = class {
    constructor(e, t) {
      ((this.scene = e),
        (this.registry = t || null),
        (this.ray = new i()),
        (this.ray.firstHitOnly = !1),
        this.ray.ray.direction.set(0, -1, 0),
        (this.meshes = []),
        (this.meshRoot = null),
        (this.meshStamp = -1),
        (this.zones = []),
        (this.nZones = 0),
        (this.cache = new Map()),
        (this.t = 0));
    }
    setWorld(e, t) {
      this.t = t;
      let n = e && e.structures;
      if (!n) {
        this.nZones = 0;
        return;
      }
      if (n.length !== this.nZones || this.zones.length < n.length) {
        this.zones.length = 0;
        for (let e = 0; e < n.length; e++) {
          let t = n[e],
            r =
              t.kind === `nexus`
                ? 4.6
                : t.kind === `inhibitor`
                  ? 3
                  : t.tier === 4
                    ? 3.4
                    : 3.2;
          this.zones.push({ x: t.x, z: t.y, r2: (r + 0.8) * (r + 0.8) });
        }
        this.nZones = n.length;
      } else
        for (let e = 0; e < n.length; e++) {
          let t = this.zones[e];
          ((t.x = n[e].x), (t.z = n[e].y));
        }
    }
    near(e, t) {
      for (let n = 0; n < this.nZones; n++) {
        let r = this.zones[n],
          i = e - r.x,
          a = t - r.z;
        if (i * i + a * a < r.r2) return !0;
      }
      return !1;
    }
    collect() {
      let e = this.scene && this.scene.getObjectByName(`structures`);
      if (!e) {
        ((this.meshes.length = 0), (this.meshRoot = null));
        return;
      }
      (e === this.meshRoot && this.meshes.length) ||
        ((this.meshRoot = e),
        (this.meshes.length = 0),
        e.traverse((e) => {
          e.isMesh &&
            !e.isSkinnedMesh &&
            e.visible &&
            e.material &&
            !e.material.transparent &&
            e.geometry &&
            this.meshes.push(e);
        }));
    }
    at(e, t, n) {
      let r = E(t, n),
        i =
          this.registry && this.registry.get && this.registry.get(`structures`);
      if (i && typeof i.surfaceHeightAt == `function`) {
        let e = i.surfaceHeightAt(t, n);
        return Number.isFinite(e) && e > r && e < r + P ? e : r;
      }
      if (!this.near(t, n)) return (this.cache.delete(e), r);
      let a = this.cache.get(e);
      if (
        a &&
        this.t - a.t < ce &&
        (a.x - t) * (a.x - t) + (a.z - n) * (a.z - n) < le
      )
        return a.y;
      let o = r;
      if ((this.collect(), this.meshes.length)) {
        let e = this.ray;
        (e.ray.origin.set(t, r + se, n), (e.near = 0), (e.far = 3.4));
        let i = -1e9;
        for (let t = 0; t < this.meshes.length; t++) {
          let n = e.intersectObject(this.meshes[t], !1);
          for (let e = 0; e < n.length; e++) {
            let t = n[e].point.y;
            t > i && t <= r + P && (i = t);
          }
        }
        i > r + 0.02 && (o = i);
      }
      return (
        a
          ? ((a.x = t), (a.z = n), (a.y = o), (a.t = this.t))
          : this.cache.set(e, { x: t, z: n, y: o, t: this.t }),
        o
      );
    }
    forget(e) {
      this.cache.delete(e);
    }
    dispose() {
      (this.cache.clear(), (this.meshes.length = 0), (this.meshRoot = null));
    }
  },
  F = null,
  I = null,
  L = null,
  R = null,
  z = null,
  B = null,
  V = null,
  H = null,
  U = null,
  W = null,
  G = null,
  K = new Map(),
  q = new Map(),
  J = new Map(),
  Y = new Set(),
  de = 4,
  X = 24;
new m();
var Z = new g();
function fe(e) {
  if (q.has(e.id)) return q.get(e.id);
  let t = e.rig,
    n = t.index(`head`),
    r = new Set([
      ...((e.M.portrait && e.M.portrait.props) || []),
      ...(e.M.anim.cloth || []).flatMap((e) => e.bones),
    ]),
    i = t.names.map((e, i) => {
      if (r.has(e)) return !1;
      let a = i;
      for (; a >= 0; ) {
        if (a === n) return !0;
        if (r.has(t.names[a])) return !1;
        a = t.parents[a];
      }
      return !1;
    }),
    a = e.geometry.attributes.skinIndex,
    o = e.geometry.attributes.skinWeight,
    s = [];
  for (let e = 0; e < a.count; e += 2) {
    let t = 0;
    for (let n = 0; n < 4; n++)
      i[a.getComponent(e, n)] && (t += o.getComponent(e, n));
    t > 0.6 && s.push(e);
  }
  return (q.set(e.id, s), s);
}
var pe = `
precision highp float; precision highp sampler3D;
uniform sampler2D tSrc; uniform sampler3D tLut; uniform vec4 uCurve; uniform vec3 uCurveX; uniform float uExposure; uniform float uLutSize;
in vec2 vUv; out vec4 outColor;
float curve(float x) { float z = pow(x, uCurve.x); return z / (pow(z, uCurve.y) * uCurve.z + uCurve.w); }
vec3 filmic(vec3 c) {
  float peak = max(max(c.r, c.g), c.b); if (peak < 1e-5) return vec3(0.0);
  vec3 ratio = c / peak; float tp = clamp(curve(peak), 0.0, 1.0);
  ratio = pow(max(ratio, vec3(0.0)), vec3(uCurveX.x / uCurveX.y)); ratio = mix(ratio, vec3(1.0), pow(tp, uCurveX.z)); ratio = pow(ratio, vec3(uCurveX.y));
  return clamp(ratio * tp, 0.0, 1.0);
}
vec3 srgbOETF(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c)); }
void main() {
  vec4 s = texture(tSrc, vUv); float a = clamp(s.a, 0.0, 1.0);
  if (a < 1e-4) { outColor = vec4(0.0); return; }
  vec3 c = max(s.rgb / a, vec3(0.0)) * uExposure;
  c = srgbOETF(filmic(c));
  c = texture(tLut, c * ((uLutSize - 1.0) / uLutSize) + 0.5 / uLutSize).rgb;
  outColor = vec4(c * a, a);
}`;
function me() {
  ((F = new C({
    canvas: document.createElement(`canvas`),
    alpha: !0,
    antialias: !1,
    preserveDrawingBuffer: !0,
    premultipliedAlpha: !0,
  })),
    (F.outputColorSpace = x),
    (F.toneMapping = 0),
    F.setClearColor(0, 0),
    F.setPixelRatio(1),
    (I = new y()),
    (I.environment = re().env),
    (I.environmentIntensity = 0.5),
    (L = new w(24, 1, 0.05, 50)),
    (H = new p(`#c9d6ee`, `#6a5a40`, 0.68)),
    I.add(H),
    (z = new u(`#ffe6c8`, 4.2)),
    I.add(z, z.target),
    (B = new u(`#9fb8ff`, 0.8)),
    I.add(B, B.target),
    (V = new u(`#ffd8b0`, 0.9)),
    I.add(V, V.target),
    (R = new u(`#ffffff`, 3.4)),
    I.add(R, R.target));
  let e = ae,
    t = M(e.tmContrast, e.tmShoulder, e.tmMid, e.tmWhite, 0.18);
  ((G = oe(N, 33)),
    (U = new d({
      glslVersion: c,
      vertexShader: `in vec3 position; in vec2 uv; out vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: pe,
      uniforms: {
        tSrc: { value: null },
        tLut: { value: G },
        uCurve: { value: new f(t[0], t[1], t[2], t[3]) },
        uCurveX: { value: new m(e.tmSat, e.tmCrossSat, e.tmCross) },
        uExposure: { value: e.exposure * 1.9 },
        uLutSize: { value: 33 },
      },
      depthTest: !1,
      depthWrite: !1,
      blending: 0,
    })),
    (W = new v(new _(2, 2), U)),
    (W.frustumCulled = !1));
}
function he(e) {
  let t = J.get(e);
  if (t) return (J.delete(e), J.set(e, t), t);
  for (; J.size >= de; ) {
    let e = J.keys().next().value;
    (J.get(e).dispose(), J.delete(e));
  }
  return (
    (t = new h(e, e, { type: s, samples: 4, depthBuffer: !0, colorSpace: x })),
    J.set(e, t),
    t
  );
}
function ge() {
  for (let e of J.values()) e.dispose();
  if (
    (J.clear(),
    K.clear(),
    Y.clear(),
    q.clear(),
    (W &&= (W.geometry.dispose(), null)),
    (U &&= (U.dispose(), null)),
    (G &&= (G.dispose(), null)),
    F)
  ) {
    try {
      (F.dispose(), F.forceContextLoss());
    } catch {}
    F = null;
  }
  ((I = null),
    (L = null),
    (R = null),
    (z = null),
    (B = null),
    (V = null),
    (H = null));
}
function Q(e, t, n = 128, r = {}) {
  n = Math.max(32, Math.min(1024, Math.round(n)));
  let i = r.shot === `splash` ? `splash` : `bust`,
    a = r.team || `#d8b46a`,
    o = `${t}:${n}:${i}:${a}`;
  if (!r.refresh && K.has(o)) {
    let e = K.get(o);
    return (K.delete(o), K.set(o, e), e);
  }
  let s = K.get(o) || document.createElement(`canvas`);
  ((s.width = s.height = n), (s.dataset.champion = t));
  let c = null;
  try {
    F || me();
    let e = n * (n <= 512 ? 2 : 1),
      r = A(t),
      o = r.M.portrait || {},
      u = new l(o.rim || r.element);
    ((c = new j(r, {
      radius: 0.6,
      teamColor: a,
      rimDir: new m(0.7, 0.2, -0.7),
      rimColor: new l(1, 0.9, 0.76).multiplyScalar(2.6),
      rimStrength: 0.9,
      showcase: i === `splash`,
    })),
      (c.groundFn = () => 0),
      c.attach(I),
      o.props && i === `bust` && c.hideBones(o.props));
    let d = {
      x: 0,
      y: 0,
      prevX: 0,
      prevY: 0,
      facing: Math.PI / 2,
      alive: !0,
      moving: !1,
      speedNow: 0,
      attackSeq: 0,
      attackT: -99,
      castSeq: 0,
      castSlot: null,
      castT: -99,
      hitSeq: 0,
      cc: {},
      dash: null,
      recallStart: null,
      stats: { attackSpeed: 1 },
    };
    for (let e = 0, t = 0; e < 60; e++)
      ((t += 1 / 30), c.update(d, 1.3 + t, 1 / 30, 1, !0, !1));
    ((c.blob.visible = !1),
      c.trailMesh && (c.trailMesh.visible = !1),
      c.glow && (c.glow.visible = !0),
      c.group.updateMatrixWorld(!0));
    let f = r.geometry.attributes.position,
      p = fe(r),
      h = [],
      g = new m();
    for (let e of p) {
      let t = new m().fromBufferAttribute(f, e);
      (c.body.applyBoneTransform(e, t),
        t.applyMatrix4(c.body.matrixWorld),
        h.push(t),
        g.add(t));
    }
    h.length && g.multiplyScalar(1 / h.length);
    let _ = h.map((e) => e.distanceTo(g)).sort((e, t) => e - t),
      v = _.length
        ? _[Math.min(_.length - 1, Math.floor(_.length * 0.88))] * 1.08
        : 0.2;
    Z.makeEmpty();
    for (let e of h) e.distanceTo(g) <= v && Z.expandByPoint(e);
    if (Z.isEmpty()) for (let e of h) Z.expandByPoint(e);
    let y = Z.getCenter(new m()),
      b = Z.getSize(new m()),
      x = Math.max(0.2, b.y),
      S = Math.max(b.x, b.z, 0.2),
      C,
      w,
      T;
    if (i === `splash`) {
      let e = Z.max.y + 0.06,
        t = r.height * 0.44;
      ((C = (e - t) * 1.08),
        (w = new m(y.x, (e + t) * 0.5, y.z)),
        (T = (o.yaw ?? 0.3) + 0.25));
    } else {
      let e = Math.max(x, S * 0.86);
      ((C = e * 2.05 + (o.extra || 0) * 0.4),
        (w = new m(y.x, y.y - e * 0.3, y.z)),
        (T = o.yaw ?? 0.3));
    }
    let E = (C * 0.5) / Math.tan((L.fov * Math.PI) / 360);
    (L.position.set(
      w.x + Math.sin(T) * E,
      w.y + E * 0.05 + x * 0.2,
      w.z + Math.cos(T) * E,
    ),
      L.lookAt(w),
      (L.aspect = 1),
      L.updateProjectionMatrix(),
      z.position.set(w.x - 1.8, w.y + 2.2, w.z + 2.3),
      z.target.position.copy(w),
      B.position.set(w.x + 2.6, w.y + 0.3, w.z + 1.4),
      B.target.position.copy(w),
      V.position.set(w.x + 0.4, w.y - 2.4, w.z + 1.6),
      V.target.position.copy(w));
    let D = i === `splash`;
    ((z.intensity = D ? 4.2 * 1.32 : 4.2),
      (B.intensity = D ? 0.8 * 0.81 : 0.8),
      (V.intensity = D ? 0.45 : 0.9),
      R.color.copy(u).lerp(new l(`#ffffff`), 0.35),
      (R.intensity = 3.4 * (o.fill ?? 1)),
      R.position.set(w.x + 1.8, w.y + 1.4, w.z - 2.4),
      R.target.position.copy(w));
    let O = he(e);
    (F.setSize(e, e, !1),
      F.setRenderTarget(O),
      F.clear(),
      F.render(I, L),
      (U.uniforms.tSrc.value = O.texture),
      F.setRenderTarget(null),
      F.clear(),
      F.render(W, L));
    let k = s.getContext(`2d`);
    (k.clearRect(0, 0, n, n),
      (k.imageSmoothingEnabled = !0),
      (k.imageSmoothingQuality = `high`),
      k.drawImage(F.domElement, 0, 0, e, e, 0, 0, n, n));
  } catch (e) {
    console.error(`[champions] portrait failed`, e);
  }
  if ((c && c.dispose(), K.set(o, s), K.size > X))
    for (let e of [...K.keys()]) {
      if (K.size <= X) break;
      Y.has(e) || K.delete(e);
    }
  return s;
}
function $(e, t = 256) {
  let n = e.map((e) => [e, t]),
    r =
      globalThis.requestIdleCallback ||
      ((e) => setTimeout(() => e({ timeRemaining: () => 16 }), 50)),
    i = () => {
      let e = n.shift();
      if (!e) return;
      let t = `${e[0]}:${e[1]}:bust:#d8b46a`;
      (K.has(t) || Q(null, e[0], e[1]),
        Y.add(t),
        n.length && r(i, { timeout: 2e3 }));
    };
  r(i, { timeout: 2e3 });
}
var _e = class {
  constructor(e) {
    ((this.ctx = e),
      (this.scene = e.scene),
      (this.renderer = e.renderer),
      (this.pipeline = e.pipeline || null),
      (this.root = new b()),
      (this.root.name = `champions`),
      this.scene.add(this.root),
      (this.views = new Map()),
      (this.list = []),
      (this.frameNo = 0),
      (this.lastWorld = null),
      (this.camera = e.camera || null),
      (this.surface = new ue(this.scene, e.registry || null)),
      (this.portraitMaxSize = 1024));
    for (let e of __mtChampPrebuild(n, `types`)) // [MT-HOOK] legacyMeshes: mt builds only the types its players use (the trainer's, for the loading-screen art); ?legacymeshes=1 = all
      try {
        A(e);
      } catch (t) {
        console.error(`[champions] type build failed: ` + e, t);
      }
    e.app.on(`match`, () => this.clear());
    try {
      $(__mtChampPrebuild(n, `portraits`), 256); // [MT-HOOK] legacyMeshes (mt: only the players' portrait, not the 5 legacy champions')
    } catch (e) {
      console.error(`[champions] portrait prebake failed`, e);
    }
    {
      let e = globalThis.requestIdleCallback || ((e) => setTimeout(e, 30)),
        t = __mtChampPrebuild(n, `lod`).slice(), // [MT-HOOK] legacyMeshes (mt: no LOD builds, no in-world champion views exist)
        r = () => {
          let n = t.shift();
          if (n) {
            try {
              k(A(n));
            } catch (e) {
              console.error(`[champions] LOD failed ` + n, e);
            }
            t.length && e(r, { timeout: 1500 });
          }
        };
      e(r, { timeout: 1500 });
    }
    if (__mtLegacyMeshes()) try { // [MT-HOOK] legacyMeshes (no champion warm-up mesh: no champion material is ever drawn by the main renderer)
      let e = A(n[0]),
        t = e.rig.createBones(),
        r = new a(t, e.rig.inverses),
        i = ee({
          height: e.height,
          element: e.element,
          pipeline: this.pipeline,
          wetY: T,
        }),
        s = ie(i);
      ((s.userData.uniforms.uOpacity.value = 0.5),
        (this.warm = new b()),
        this.warm.position.set(60, -400, 60),
        this.warm.add(t[0]),
        (this.warmMats = [i, s]));
      for (let t of [s, ne()]) {
        let n = new o(e.geometry, t);
        (n.bind(r, new S()),
          (n.frustumCulled = !1),
          this.warm.add(n),
          t !== s && this.warmMats.push(t));
      }
      ((this.warmFrames = 6), this.root.add(this.warm));
    } catch (e) {
      (console.error(`[champions] warm-up failed`, e), (this.warm = null));
    }
  }
  clear() {
    for (let e = 0; e < this.list.length; e++) this.list[e].dispose();
    (this.views.clear(), (this.list.length = 0));
  }
  update(n) {
    this.warm && --this.warmFrames <= 0 && this.disposeWarm(!1);
    let i = n.world;
    if (!i) return;
    i !== this.lastWorld && (this.clear(), (this.lastWorld = i));
    let a = i.time - t * (1 - n.alpha),
      o = ++this.frameNo;
    this.surface.setWorld(i, a);
    let s = i.champions;
    for (let t = 0; t < s.length; t++) {
      let n = s[t];
      if (n.kind !== e.CHAMPION || n.mtSprite) continue; // [MT-HOOK] hideChampionModel (trainers are mt sprites)
      let r = this.views.get(n.id);
      if ((r && r.type.id !== n.champion && (this.remove(r), (r = null)), !r)) {
        r = new j(A(n.champion), {
          radius: n.radius,
          unitId: n.id,
          pipeline: this.pipeline,
          wetY: T,
        });
        let e = this.surface,
          t = n.id;
        ((r.groundFn = (n, r) => e.at(t, n, r)),
          r.attach(this.root),
          this.views.set(n.id, r),
          this.list.push(r));
      }
      r.stamp = o;
    }
    let c = n.events;
    if (c)
      for (let e = 0; e < c.length; e++) {
        let t = c[e];
        if (t.type === r.HIT) {
          let e = this.views.get(t.tgt);
          e && (e.anim.hitDamage = (e.anim.hitDamage || 0) + (t.amount || 0));
        }
      }
    for (let t = 0; t < s.length; t++) {
      let r = s[t];
      if (r.kind !== e.CHAMPION || r.mtSprite) continue; // [MT-HOOK] hideChampionModel
      let i = this.views.get(r.id);
      if (!i) continue;
      i.setTeamColor(r.team === n.viewerTeam ? D.ally : D.enemy);
      let o = !!(r.visible && r.visible[n.viewerTeam]),
        c = r.alive && r.team === n.viewerTeam && r.inBrush >= 0;
      (o && i.setLod(this.wantLod(i, r)), i.update(r, a, n.dt, n.alpha, o, c));
    }
    for (let e = this.list.length - 1; e >= 0; e--) {
      let t = this.list[e];
      t.stamp !== o && this.remove(t);
    }
  }
  wantLod(e, t) {
    let n = this.pipeline && this.pipeline.quality;
    if (n === `medium` || n === `low`) return !0;
    let r = this.camera;
    if (!r) return !1;
    let i = r.position.x - t.x,
      a = r.position.z - t.y,
      o = r.position.y - e.groundY,
      s = i * i + o * o + a * a;
    return e.lod ? s > 110.25 : s > 132.25;
  }
  remove(e) {
    (e.dispose(), this.views.delete(e.unitId), this.surface.forget(e.unitId));
    let t = this.list.indexOf(e);
    t >= 0 && this.list.splice(t, 1);
  }
  disposeWarm(e) {
    if (
      ((this.warm &&=
        (this.root.remove(this.warm),
        this.warm.traverse((e) => {
          e.isSkinnedMesh && e.skeleton && e.skeleton.dispose();
        }),
        null)),
      e && this.warmMats)
    ) {
      for (let e of this.warmMats) e.dispose();
      this.warmMats = null;
    }
  }
  getAnchor(t, n, r, i) {
    if (!t || t.kind !== e.CHAMPION) return !1;
    let a = this.views.get(t.id);
    if (!a || !a.ready || !a.visible) return (O(t, n, r, i), !0);
    let o = t.prevX + (t.x - t.prevX) * n,
      s = t.prevY + (t.y - t.prevY) * n,
      c =
        o === a.renderX && s === a.renderZ
          ? a.groundY
          : this.surface.at(t.id, o, s);
    if (r === `ground`) return ((i.x = o), (i.y = c), (i.z = s), !0);
    if (r === `overhead`)
      return (
        (i.x = o),
        (i.y =
          c +
          a.type.height +
          0.32 +
          (t.alive ? a.anim.lift : -a.type.height * 0.55)),
        (i.z = s),
        !0
      );
    let l = a.type.anchors[r] || a.type.anchors.chest;
    return (
      a.toWorld(l.i, l.p, i),
      (i.x += o - a.renderX),
      (i.z += s - a.renderZ),
      !0
    );
  }
  renderPortrait(e, t = 128, n) {
    return Q(this.renderer, e, t, n);
  }
  dispose() {
    (this.clear(),
      this.disposeWarm(!0),
      this.surface.dispose(),
      this.scene.remove(this.root));
    try {
      ge();
    } catch (e) {
      console.error(`[champions] portrait dispose failed`, e);
    }
    try {
      te();
    } catch (e) {
      console.error(`[champions] shared asset dispose failed`, e);
    }
  }
};
export { _e as default };
