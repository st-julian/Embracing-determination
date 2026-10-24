import {
  B as e,
  C as t,
  E as n,
  H as r,
  Ht as i,
  Jt as a,
  Nt as o,
  O as s,
  S as c,
  St as l,
  Ut as u,
  V as d,
  Wt as f,
  Yt as p,
  lt as m,
  ut as h,
  vt as g,
} from "./index-DHK-Ptzs.js";
import { r as _ } from "./BufferGeometryUtils-ZZwUU_DG.js";
var v = new p(),
  y = new p(),
  b = new h(),
  x = new m(),
  S = new l(),
  C = new e(),
  w = new p(),
  T = new s(),
  E = Math.PI / 180,
  D = 0.5,
  O = { k: 1 },
  k = (e, t = 4) => (O.k === 1 ? e : Math.max(t, Math.round(e * O.k))),
  A = (e, t, n) => {
    let r = Math.min(1, Math.max(0, (n - e) / (t - e)));
    return r * r * (3 - 2 * r);
  },
  j = (e, t, n) => e + (t - e) * n,
  M = (e, t, n) => (e < t ? t : e > n ? n : e),
  N = (e) => {
    let t = Math.sin(e * 127.1 + 311.7) * 43758.5453;
    return t - Math.floor(t);
  },
  P = (e, t) => {
    let n = Math.abs(e - t) % (Math.PI * 2);
    return n > Math.PI ? Math.PI * 2 - n : n;
  };
function F(e, t, n) {
  let r = (e - t) ** 2 / (e + t + 1e-9) ** 2;
  return j(
    Math.PI * (e + t) * (1 + (3 * r) / (10 + Math.sqrt(4 - 3 * r))),
    4 * (e + t),
    M((n - 2) / 5, 0, 1) * 0.9,
  );
}
function I(e, n = {}) {
  let i = k(n.seg || 12, n.arc ? 3 : 5),
    a = e.length,
    o = e.map((e) => new p(...e.p)),
    s = o.map((e, t) => {
      let n = o[Math.max(0, t - 1)],
        r = o[Math.min(a - 1, t + 1)];
      return new p().subVectors(r, n).normalize();
    }),
    c = new p(...(n.hint || [0, 0, 1]));
  Math.abs(c.dot(s[0])) > 0.92 &&
    c.set(0, 1, 0).sub(s[0].clone().multiplyScalar(s[0].y));
  let l = [],
    u = [],
    d = c
      .clone()
      .sub(s[0].clone().multiplyScalar(c.dot(s[0])))
      .normalize();
  for (let e = 0; e < a; e++) {
    let t = s[e],
      n = d.clone().sub(t.clone().multiplyScalar(d.dot(t)));
    (n.lengthSq() < 1e-8 && n.copy(d),
      n.normalize(),
      (d = n),
      l.push(n),
      u.push(new p().crossVectors(n, t).normalize()));
  }
  let f = n.arc,
    m = !!f,
    h = i + 1,
    g = [0];
  for (let e = 1; e < a; e++) g.push(g[e - 1] + o[e].distanceTo(o[e - 1]));
  let _ = 0;
  for (let t of e) _ += F(t.rx, t.rz ?? t.rx, t.e || 2);
  ((_ /= a), m && (_ *= (f[1] - f[0]) / 360));
  let v = n.radial,
    y = [],
    b = [],
    x = [],
    S = [],
    C = (t, n, r, a, c) => {
      let d = e[t],
        p = 2 / (d.e || 2),
        h = (d.tw || 0) * E,
        b = m ? (f[0] + (f[1] - f[0]) * (n / i)) * E : (n / i) * Math.PI * 2,
        S = v ? v(c, b, t) : 1,
        C = d.rx * r * S,
        w = (d.rz ?? d.rx) * r * S,
        T = u[t],
        D = l[t],
        O = o[t],
        k = s[t],
        A = Math.cos(h),
        j = Math.sin(h),
        M = T.x * A + D.x * j,
        N = T.y * A + D.y * j,
        P = T.z * A + D.z * j,
        F = -T.x * j + D.x * A,
        I = -T.y * j + D.y * A,
        L = -T.z * j + D.z * A,
        R = Math.cos(b),
        z = Math.sin(b),
        B = Math.sign(R) * Math.abs(R) ** +p * C,
        V = Math.sign(z) * Math.abs(z) ** +p * w;
      (y.push(
        O.x + M * B + F * V + k.x * a,
        O.y + N * B + I * V + k.y * a,
        O.z + P * B + L * V + k.z * a,
      ),
        x.push((n / i) * _, g[t] + a));
    },
    w = [],
    T = (e, t, n) => {
      let r = y.length / 3,
        o = a > 1 ? e / (a - 1) : 0;
      for (let r = 0; r < h; r++) C(e, r, t, n, o);
      (m || S.push([r, r + i]), w.push(r));
    },
    D = (t, n, r) => {
      let i = e[t],
        a = n * Math.max(i.rx, i.rz ?? i.rx) * r,
        o = [];
      for (let e = 1; e <= 3; e++) {
        let t = ((e / 3) * Math.PI) / 2,
          n = Math.max(0.001, Math.cos(t));
        o.push([n, Math.sin(t) * a]);
      }
      return o;
    },
    O = !m && typeof n.start == `number` ? D(0, n.start, -1).reverse() : [];
  for (let [e, t] of O) T(0, e, t);
  for (let e = 0; e < a; e++) T(e, 1, 0);
  let A = !m && typeof n.end == `number` ? D(a - 1, n.end, 1) : [];
  for (let [e, t] of A) T(a - 1, e, t);
  for (let e = 0; e < w.length - 1; e++) {
    let t = w[e],
      n = w[e + 1];
    for (let e = 0; e < i; e++) {
      let r = t + e,
        i = t + e + 1,
        a = n + e + 1,
        o = n + e;
      b.push(r, i, a, r, a, o);
    }
  }
  if (!m) {
    if (n.start === `flat`) {
      let e = y.length / 3;
      (y.push(o[0].x, o[0].y, o[0].z), x.push(_ * 0.5, -0.05));
      for (let t = 0; t < i; t++) b.push(e, w[0] + t + 1, w[0] + t);
    }
    if (n.end === `flat`) {
      let e = w[w.length - 1],
        t = y.length / 3;
      (y.push(o[a - 1].x, o[a - 1].y, o[a - 1].z),
        x.push(_ * 0.5, g[a - 1] + 0.05));
      for (let n = 0; n < i; n++) b.push(t, e + n, e + n + 1);
    }
  }
  let j = new t();
  return (
    j.setAttribute(`position`, new r(y, 3)),
    j.setAttribute(`uvw`, new r(x, 2)),
    j.setIndex(b),
    (j.userData.seams = S),
    m || (j.userData.uPeriod = _),
    L(j),
    n.flipNormals && te(j),
    j
  );
}
function L(e) {
  e.computeVertexNormals();
  let t = e.userData.seams;
  if (!t || !t.length) return e;
  let n = e.attributes.normal;
  for (let [e, r] of t)
    (y
      .set(n.getX(e) + n.getX(r), n.getY(e) + n.getY(r), n.getZ(e) + n.getZ(r))
      .normalize(),
      n.setXYZ(e, y.x, y.y, y.z),
      n.setXYZ(r, y.x, y.y, y.z));
  return e;
}
function R(e, t = {}) {
  return I(
    e.map((e) => ({
      p: [e[4] || 0, e[0], e[5] || 0],
      rx: e[1],
      rz: e[2] ?? e[1],
      e: e[3] || 2,
    })),
    { seg: 16, ...t },
  );
}
function z(e, t, n, r = {}) {
  let i = k(r.rings || 9, 4),
    a = [];
  for (let o = 0; o <= i; o++) {
    let s = -Math.PI / 2 + (o / i) * Math.PI,
      c = Math.max(0.02, Math.cos(s));
    a.push({ p: [0, Math.sin(s) * t, 0], rx: e * c, rz: n * c, e: r.e || 2 });
  }
  let o = I(a, { seg: r.seg || 14, radial: r.radial });
  return (r.fn && J(o, r.fn), o);
}
function B(e, t, r = {}) {
  let i = e.map((e) => (e.isVector3 ? e : new p(...e))),
    a = i;
  return (
    r.curve !== !1 &&
      i.length > 2 &&
      (a = new n(i).getPoints(
        Math.max(
          Math.min(i.length, 4) - 1,
          k(r.samples || i.length * 3, 3) - 1,
        ),
      )),
    I(
      a.map((e, n) => {
        let i = n / (a.length - 1),
          o = typeof t == `function` ? t(i) : t,
          s = typeof r.rz == `function` ? r.rz(i) : (r.rz ?? o);
        return {
          p: [e.x, e.y, e.z],
          rx: o,
          rz: s,
          e: typeof r.e == `function` ? r.e(i) : r.e || 2,
          tw: r.twist ? r.twist(i) : 0,
        };
      }),
      {
        seg: r.seg || 8,
        start: r.start ?? 0.6,
        end: r.end ?? 0.6,
        hint: r.hint,
        radial: r.radial,
      },
    )
  );
}
function V(e, t, n = 0.03, r = {}) {
  return B(e, (e) => (typeof t == `function` ? t(e) : t) * 0.5, {
    rz: typeof n == `function` ? (e) => n(e) * 0.5 : n * 0.5,
    e: r.e || 6,
    seg: r.seg || 10,
    start: 0,
    end: 0,
    curve: r.curve,
    samples: r.samples,
    hint: r.hint || [0, 0, 1],
    radial: r.radial,
    twist: r.twist,
  });
}
function H(e, t, n = {}) {
  let r = new o(e.map(([e, t]) => new a(e, t)));
  if (n.holes)
    for (let e of n.holes) r.holes.push(new g(e.map(([e, t]) => new a(e, t))));
  let i = n.bevel ?? Math.min(t * 0.45, 0.03),
    s = new d(r, {
      depth: t,
      bevelEnabled: i > 0,
      bevelThickness: i,
      bevelSize: n.bevelSize ?? i,
      bevelSegments: n.bevelSeg || 2,
      curveSegments: k(n.curveSeg || 8, 2),
      steps: 1,
    });
  (s.translate(0, 0, -t / 2), s.deleteAttribute(`uv`));
  let c = s;
  return (
    n.smooth
      ? (s.deleteAttribute(`normal`), (c = ne(s)), c.computeVertexNormals())
      : n.crease && (c = _(s, (n.crease * Math.PI) / 180)),
    Y(c, `xy`),
    c
  );
}
function U(e, t = 48, n = !0) {
  let r = e.map(([e, t]) => new a(e, t)),
    i = r.length,
    o = [],
    s = (e) => r[n ? ((e % i) + i) % i : M(e, 0, i - 1)],
    c = n ? i : i - 1;
  for (let e = 0; e < t; e++) {
    let n = (e / t) * c,
      r = Math.floor(n),
      i = n - r,
      a = s(r - 1),
      l = s(r),
      u = s(r + 1),
      d = s(r + 2),
      f = i * i,
      p = f * i;
    o.push([
      0.5 *
        (2 * l.x +
          (-a.x + u.x) * i +
          (2 * a.x - 5 * l.x + 4 * u.x - d.x) * f +
          (-a.x + 3 * l.x - 3 * u.x + d.x) * p),
      0.5 *
        (2 * l.y +
          (-a.y + u.y) * i +
          (2 * a.y - 5 * l.y + 4 * u.y - d.y) * f +
          (-a.y + 3 * l.y - 3 * u.y + d.y) * p),
    ]);
  }
  return (n || o.push([r[i - 1].x, r[i - 1].y]), o);
}
function W(e, t, n, r = {}) {
  let i = r.e || 6,
    a = t / 2;
  return I(
    [
      { p: [0, -a, 0], rx: e / 2, rz: n / 2, e: i },
      { p: [0, a, 0], rx: (r.topW ?? e) / 2, rz: (r.topD ?? n) / 2, e: i },
    ],
    { seg: r.seg || 12, start: `flat`, end: `flat` },
  );
}
function G(e, t, n = {}) {
  let r = k(n.tube || 6, 4),
    a = k(n.seg || 24, 6),
    o = new i(e, t, r, a, (n.arc ?? 360) * E),
    s = o.attributes.uv,
    l = new Float32Array(s.count * 2),
    u = e * (n.arc ?? 360) * E,
    d = 2 * Math.PI * t;
  for (let e = 0; e < s.count; e++)
    ((l[e * 2] = s.getX(e) * u), (l[e * 2 + 1] = s.getY(e) * d));
  (o.deleteAttribute(`uv`), o.setAttribute(`uvw`, new c(l, 2)));
  let f = [];
  for (let e = 0; e <= r; e++) f.push([e * (a + 1), e * (a + 1) + a]);
  for (let e = 0; e <= a; e++) f.push([e, r * (a + 1) + e]);
  return ((o.userData.seams = f), L(o), o);
}
function K(e, t, n = {}) {
  return R(
    [
      [0, e, n.rz ?? e, n.e || 2],
      [t, 0.002, 0.002],
    ],
    { seg: n.seg || 8, start: `flat` },
  );
}
function ee(e, n, r, i = {}) {
  let a = k(e, 4),
    o = k(n, 4),
    s = i.shell || 0,
    l = a + 1,
    u = l * (o + 1),
    d = new Float32Array(u * 3),
    f = new p();
  for (let e = 0; e <= o; e++)
    for (let t = 0; t <= a; t++) {
      r((t / a) * 2 - 1, e / o, f);
      let n = (e * l + t) * 3;
      ((d[n] = f.x), (d[n + 1] = f.y), (d[n + 2] = f.z));
    }
  let m = [];
  for (let e = 0; e < o; e++)
    for (let t = 0; t < a; t++) {
      let n = e * l + t,
        r = n + 1,
        i = n + l + 1,
        a = n + l;
      m.push(n, r, i, n, i, a);
    }
  let h = d;
  if (s > 0) {
    let e = q(d, m, u);
    ((h = new Float32Array(u * 6)), h.set(d, 0));
    for (let t = 0; t < u; t++)
      ((h[u * 3 + t * 3] = d[t * 3] - e[t * 3] * s),
        (h[u * 3 + t * 3 + 1] = d[t * 3 + 1] - e[t * 3 + 1] * s),
        (h[u * 3 + t * 3 + 2] = d[t * 3 + 2] - e[t * 3 + 2] * s));
    for (let e = 0; e < o; e++)
      for (let t = 0; t < a; t++) {
        let n = u + e * l + t,
          r = n + 1,
          i = n + l + 1,
          a = n + l;
        m.push(n, i, r, n, a, i);
      }
    let t = [];
    for (let e = 0; e <= a; e++) t.push(e);
    for (let e = 1; e <= o; e++) t.push(e * l + a);
    for (let e = a - 1; e >= 0; e--) t.push(o * l + e);
    for (let e = o - 1; e >= 1; e--) t.push(e * l);
    for (let e = 0; e < t.length; e++) {
      let n = t[e],
        r = t[(e + 1) % t.length];
      m.push(n, r, u + r, n, u + r, u + n);
    }
  }
  let g = new t();
  return (
    g.setAttribute(`position`, new c(h, 3)),
    g.setIndex(m),
    Y(g, i.uvPlane || `xy`),
    g.computeVertexNormals(),
    g
  );
}
function q(e, t, n) {
  let r = new Float32Array(n * 3);
  for (let n = 0; n < t.length; n += 3) {
    let i = t[n] * 3,
      a = t[n + 1] * 3,
      o = t[n + 2] * 3,
      s = e[a] - e[i],
      c = e[a + 1] - e[i + 1],
      l = e[a + 2] - e[i + 2],
      u = e[o] - e[i],
      d = e[o + 1] - e[i + 1],
      f = e[o + 2] - e[i + 2],
      p = c * f - l * d,
      m = l * u - s * f,
      h = s * d - c * u;
    for (let e of [i, a, o]) ((r[e] += p), (r[e + 1] += m), (r[e + 2] += h));
  }
  for (let e = 0; e < n; e++) {
    let t = e * 3,
      n = Math.hypot(r[t], r[t + 1], r[t + 2]) || 1;
    ((r[t] /= n), (r[t + 1] /= n), (r[t + 2] /= n));
  }
  return r;
}
function J(e, t) {
  let n = e.attributes.position;
  for (let e = 0; e < n.count; e++)
    (v.fromBufferAttribute(n, e), t(v, e), n.setXYZ(e, v.x, v.y, v.z));
  return (L(e), e);
}
function Y(e, t = `xy`) {
  let n = e.attributes.position,
    r = new Float32Array(n.count * 2),
    [i, a] = t.split(``);
  for (let e = 0; e < n.count; e++)
    (v.fromBufferAttribute(n, e), (r[e * 2] = v[i]), (r[e * 2 + 1] = v[a]));
  return (e.setAttribute(`uvw`, new c(r, 2)), (e.userData.planar = 1), e);
}
function te(e) {
  let t = e.index.array;
  for (let e = 0; e < t.length; e += 3) {
    let n = t[e + 1];
    ((t[e + 1] = t[e + 2]), (t[e + 2] = n));
  }
  let n = e.attributes.normal;
  for (let e = 0; e < n.count; e++)
    n.setXYZ(e, -n.getX(e), -n.getY(e), -n.getZ(e));
}
function ne(e) {
  let n = e.attributes.position,
    i = new Map(),
    a = [],
    o = [];
  for (let e = 0; e < n.count; e++) {
    let t = `${n.getX(e).toFixed(4)},${n.getY(e).toFixed(4)},${n.getZ(e).toFixed(4)}`,
      r = i.get(t);
    (r === void 0 &&
      ((r = a.length / 3),
      i.set(t, r),
      a.push(n.getX(e), n.getY(e), n.getZ(e))),
      o.push(r));
  }
  let s = new t();
  return (s.setAttribute(`position`, new r(a, 3)), s.setIndex(o), s);
}
var X = {
    none: 0,
    stone: 1,
    metal: 2,
    leather: 3,
    cloth: 4,
    hair: 5,
    skin: 6,
    fur: 7,
    wood: 8,
    coral: 9,
    gem: 10,
    hide: 11,
    twill: 12,
  },
  re = [0.45, 0.3, 1, 0.4, 0.1, 0.55, 0.16, 0.08, 0.3, 0.3, 1, 0.3, 0.1],
  Z = (e) => (e && e.isColor ? e : T.set(e)).clone(),
  ie = class {
    constructor(e, t = {}) {
      ((this.rig = e),
        (this.height = t.height || 2.2),
        (this.pos = []),
        (this.nrm = []),
        (this.col = []),
        (this.mat = []),
        (this.emi = []),
        (this.si = []),
        (this.sw = []),
        (this.idx = []),
        (this.uv = []),
        (this.spec = []),
        (this.tri = []),
        (this.glow = []),
        (this.parts = []));
    }
    add(e, t = {}) {
      return t.mirror
        ? (this._add(e, { ...t, mirror: !1 }), this._add(e, oe(t)), this)
        : this._add(e, t);
    }
    _add(e, t) {
      let n = e.index ? e : ae(e);
      n.attributes.uvw || Y(n, `xy`);
      let r = n.attributes.position,
        i = n.attributes.normal,
        a = n.attributes.uvw,
        o = r.count,
        s = this.pos.length / 3,
        c =
          typeof t.scale == `number`
            ? w.set(t.scale, t.scale, t.scale)
            : w.set(...(t.scale || [1, 1, 1])),
        l = (Math.abs(c.x) + Math.abs(c.y) + Math.abs(c.z)) / 3,
        u = t.rot || [0, 0, 0];
      (C.set(u[0] * E, u[1] * E, u[2] * E, t.order || `XYZ`),
        S.setFromEuler(C),
        b.compose(v.set(...(t.at || [0, 0, 0])), S, c),
        t.flipX && b.premultiply(new h().makeScale(-1, 1, 1)),
        x.getNormalMatrix(b));
      let d = b.determinant();
      n.computeBoundingBox();
      let f = n.boundingBox,
        m = t.gradAxis || `y`,
        g = f.min[m],
        _ = f.max[m],
        O = t.grad
          ? Z(t.grad[0])
          : t.color === void 0
            ? Z(`#888888`)
            : Z(t.color),
        k = t.grad ? Z(t.grad[1]) : O,
        M = t.emit == null ? null : Z(t.emit),
        P = t.ei ?? 1,
        F = X[t.tex] || 0,
        I = t.r ?? 0.62,
        L = t.m ?? 0,
        R = typeof t.team == `number` ? t.team : +!!t.team,
        z = t.detail ?? 0.55,
        B = t.ao === !1 ? 0 : 1,
        V = t.spec ?? (t.tex ? re[F] : j(0.3, 1, L)),
        H = n.userData.uPeriod,
        U = (t.uvScale || 1) * l,
        W =
          H && H * U > 0.3 ? (Math.max(1, Math.round((H * U) / D)) * D) / H : U,
        G = this.parts.length,
        K = t.uvPhase || [
          N(G * 3.17 + 0.71) * 0.5 * 8,
          N(G * 7.91 + 4.33) * 0.5 * 8,
        ];
      this.lastPhase = K;
      let ee = t.tri == null ? +!!n.userData.planar : +!!t.tri,
        q = new p();
      for (let e = 0; e < o; e++) {
        (q.fromBufferAttribute(r, e),
          v.copy(q).applyMatrix4(b),
          y.fromBufferAttribute(i, e).applyMatrix3(x).normalize(),
          this.pos.push(v.x, v.y, v.z),
          this.nrm.push(y.x, y.y, y.z),
          this.uv.push(
            a.getX(e) * W + (t.uvOff || 0) + K[0],
            a.getY(e) * U + K[1],
          ));
        let n;
        if (t.paint) {
          let r = t.paint(q, v, y, e);
          n = r && r.isColor ? r : T.set(r);
        } else {
          let e = _ > g ? (q[m] - g) / (_ - g) : 0.5;
          n = T.copy(O).lerp(k, t.gradEase ? A(0, 1, e) : e);
        }
        if (
          (this.col.push(n.r, n.g, n.b, B),
          this.mat.push(
            I,
            L,
            t.teamFn ? t.teamFn(q, v, y, e) : R,
            F + Math.min(1, Math.max(0, z)) * 0.8,
          ),
          this.spec.push(V),
          this.tri.push(ee, K[0]),
          M)
        ) {
          let n = t.emitFn ? t.emitFn(q, v, e) : 1;
          this.emi.push(M.r * P * n, M.g * P * n, M.b * P * n);
        } else this.emi.push(0, 0, 0);
        let o = this.skinWeights(t, v);
        for (let e = 0; e < 4; e++)
          (this.si.push(o[e] ? o[e][0] : 0), this.sw.push(o[e] ? o[e][1] : 0));
      }
      let J = n.index.array;
      if (
        (this.parts.push([
          s,
          s + o,
          t.shade ?? 1,
          t.edge ??
            (F === X.metal || F === X.stone
              ? 1.2
              : F === X.cloth || F === X.twill || F === X.skin
                ? 0.5
                : 0.9),
          t.aoK ?? (F === X.skin ? 0.45 : 1),
          t.seam ?? (M && P > 1.2 ? 0 : F === X.skin ? 0.5 : 1),
        ]),
        globalThis.__cmStats)
      ) {
        let e = (
          (Error().stack || ``)
            .split(
              `
`,
            )
            .find((e) => /models\//.test(e)) || `?`
        )
          .replace(/^.*models\//, ``)
          .replace(/\)$/, ``);
        globalThis.__cmStats[e] =
          (globalThis.__cmStats[e] || 0) +
          (J.length / 3) * (t.mirror === !1 && t.flipX, 1);
      }
      for (let e = 0; e < J.length; e += 3)
        d < 0
          ? this.idx.push(s + J[e], s + J[e + 2], s + J[e + 1])
          : this.idx.push(s + J[e], s + J[e + 1], s + J[e + 2]);
      return this;
    }
    skinWeights(e, t) {
      let n = this.rig;
      return e.skin
        ? e.skin(t, n)
        : e.chain
          ? $(n, e.chain, t, e.bw ?? 0.06, e.chainAxis)
          : [[n.index(e.bone || `root`), 1]];
    }
    glowCard(e, t, n, r, i = 1, a = {}) {
      return (
        this.glow.push({
          bone: e,
          p: t,
          size: n,
          color: Z(r),
          intensity: i,
          stretch: a.stretch || 1,
          mirror: a.mirror,
        }),
        a.mirror &&
          this.glow.push({
            bone: Q(e),
            p: [-t[0], t[1], t[2]],
            size: n,
            color: Z(r),
            intensity: i,
            stretch: a.stretch || 1,
          }),
        this
      );
    }
    build() {
      let e = this.height,
        n = this.pos.length / 3,
        i = new Float32Array(n * 3),
        a = new Float32Array(n * 4),
        o = globalThis.__cmTime,
        s = o ? performance.now() : 0,
        l = (e) => {
          if (o) {
            let t = performance.now();
            ((o[e] = (o[e] || 0) + t - s), (s = t));
          }
        },
        d = ue(this.pos, this.nrm, this.idx);
      l(`occlusion`);
      let p = new Float32Array(n),
        m = new Uint16Array(n),
        h = this.pos,
        g = this.nrm,
        _ = this.idx,
        v = (e, t) => {
          let n = h[t * 3] - h[e * 3],
            r = h[t * 3 + 1] - h[e * 3 + 1],
            i = h[t * 3 + 2] - h[e * 3 + 2],
            a = Math.hypot(n, r, i);
          a < 1e-6 ||
            ((p[e] += (g[e * 3] * n + g[e * 3 + 1] * r + g[e * 3 + 2] * i) / a),
            m[e]++);
        };
      for (let e = 0; e < _.length; e += 3) {
        let t = _[e],
          n = _[e + 1],
          r = _[e + 2];
        (v(t, n), v(t, r), v(n, t), v(n, r), v(r, t), v(r, n));
      }
      let y = new Float32Array(n).fill(1),
        b = new Float32Array(n).fill(1),
        x = new Float32Array(n).fill(1),
        S = new Float32Array(n).fill(1),
        C = new Int32Array(n);
      for (let t = 0; t < this.parts.length; t++) {
        let [n, r, i, a, o, s] = this.parts[t];
        for (let e = n; e < r; e++) ((x[e] = o), (S[e] = s), (C[e] = t));
        let c = Math.min(1, i);
        for (let t = n; t < r; t++) {
          let n = M(h[t * 3 + 1] / e, 0, 1);
          ((y[t] = 1 + (j(0.78, 1.14, A(0, 1, n)) - 1) * c), (b[t] = a));
        }
      }
      for (let t = 0; t < n; t++) {
        let n = this.pos[t * 3 + 1],
          r = this.nrm[t * 3 + 1],
          o = this.col[t * 4 + 3],
          s = m[t] ? p[t] / m[t] : 0,
          c = Math.min(1, Math.max(0, -s * 4.5)) * b[t],
          l = Math.min(1, Math.max(0, s * 4)) * b[t],
          u = 1 - (1 - d[t]) * x[t],
          f = o
            ? (0.64 + 0.45 * A(-0.05, e * 1.02, n)) *
              (0.78 + 0.3 * (r * 0.5 + 0.5)) *
              (0.3 + 0.7 * u) *
              y[t]
            : 1;
        ((i[t * 3] = this.col[t * 4] * f),
          (i[t * 3 + 1] = this.col[t * 4 + 1] * f),
          (i[t * 3 + 2] = this.col[t * 4 + 2] * f),
          (a[t * 4] = o ? c : 0),
          (a[t * 4 + 1] = o ? Math.max(l, (1 - u) * 0.66) : 0),
          (a[t * 4 + 2] = this.spec[t]),
          (a[t * 4 + 3] = d[t]));
      }
      let w = new t();
      (w.setAttribute(`position`, new r(this.pos, 3)),
        w.setAttribute(`normal`, new r(this.nrm, 3)),
        w.setAttribute(`color`, new c(i, 3)),
        w.setAttribute(`aMat`, new r(this.mat, 4)),
        w.setAttribute(`aEmit`, new r(this.emi, 3)),
        w.setAttribute(`aUV`, new r(this.uv, 2)),
        w.setAttribute(`aTri`, new r(this.tri, 2)),
        w.setAttribute(`aPaint`, new c(a, 4)),
        l(`paint`));
      let T = this.seamSource
        ? pe(this.seamSource, this.pos, C)
        : de(this.pos, this.nrm, this.idx, C, this.parts.length, { skip: S });
      for (let e = 0; e < n; e++) T[e] *= S[e];
      return (
        (w.userData.seamData = {
          pos: Float32Array.from(this.pos),
          seam: T,
          partOf: C,
        }),
        l(this.seamSource ? `seamTransfer` : `seams`),
        w.setAttribute(`aSeam`, new c(T, 1)),
        w.setAttribute(`skinIndex`, new u(this.si, 4)),
        w.setAttribute(`skinWeight`, new r(this.sw, 4)),
        w.setIndex(n > 65535 ? new f(this.idx, 1) : new u(this.idx, 1)),
        w.computeBoundingSphere(),
        w
      );
    }
  };
function ae(e) {
  let t = e.attributes.position.count,
    n = e.clone(),
    r = [];
  for (let e = 0; e < t; e++) r.push(e);
  return (n.setIndex(r), n.attributes.normal || n.computeVertexNormals(), n);
}
var Q = (e) =>
  e &&
  (/L$/.test(e)
    ? e.slice(0, -1) + `R`
    : /R$/.test(e)
      ? e.slice(0, -1) + `L`
      : /L(\d)$/.test(e)
        ? e.replace(/L(\d)$/, `R$1`)
        : /R(\d)$/.test(e)
          ? e.replace(/R(\d)$/, `L$1`)
          : e);
function oe(e) {
  let t = { ...e, flipX: !e.flipX, mirror: !1 };
  if (
    (e.bone && (t.bone = Q(e.bone)),
    e.chain && (t.chain = e.chain.map(Q)),
    e.skin)
  ) {
    let n = e.skin;
    t.skin = (e, t) =>
      n(new p(-e.x, e.y, e.z), t).map(([e, n]) => [t.index(Q(t.names[e])), n]);
  }
  if (e.paint) {
    let n = e.paint;
    t.paint = (e, t, r, i) => n(e, new p(-t.x, t.y, t.z), r, i);
  }
  if (e.emitFn) {
    let n = e.emitFn;
    t.emitFn = (e, t, r) => n(e, new p(-t.x, t.y, t.z), r);
  }
  if (e.teamFn) {
    let n = e.teamFn;
    t.teamFn = (e, t, r, i) =>
      n(e, new p(-t.x, t.y, t.z), new p(-r.x, r.y, r.z), i);
  }
  return (e.uvOff === void 0 && (t.uvOff = 0.37), t);
}
var se = new p(),
  ce = new p();
function $(e, t, n, r, i) {
  let a = t.map((t) => e.bindPos(t)),
    o = a[a.length - 1],
    s = a[a.length - 2] || a[0],
    c = i
      ? new p(...i).add(o)
      : o.clone().add(o.clone().sub(s).normalize().multiplyScalar(2)),
    l = [...a, c],
    u = 1e9,
    d = 0,
    f = 0,
    m = [];
  for (let e = 0; e < l.length - 1; e++) {
    let t = l[e],
      r = l[e + 1],
      i = se.subVectors(r, t),
      a = i.length(),
      o = a > 1e-6 ? ce.subVectors(n, t).dot(i) / (a * a) : 0,
      s = Math.min(1, Math.max(e === 0 ? -5 : 0, o)),
      c = t.x + i.x * s - n.x,
      p = t.y + i.y * s - n.y,
      h = t.z + i.z * s - n.z,
      g = c * c + p * p + h * h;
    (g < u - 1e-9 && ((u = g), (d = f + s * a)), (f += a), m.push(f));
  }
  let h = [];
  for (let n = 0; n < t.length; n++) {
    let i = n === 0 ? -1e9 : m[n - 1],
      a = n === t.length - 1 ? 1e9 : m[n],
      o = A(i - r, i + r, d) - A(a - r, a + r, d);
    o > 0.001 && h.push([e.index(t[n]), o]);
  }
  h.sort((e, t) => t[1] - e[1]);
  let g = h.slice(0, 4),
    _ = g.reduce((e, t) => e + t[1], 0) || 1;
  return (g.forEach((e) => (e[1] /= _)), g.length ? g : [[e.index(t[0]), 1]]);
}
function le(e, t, n, r = 0.08, i = `x`, a = null) {
  let o = n[i],
    s = 0;
  for (; s < t.length - 2 && o > t[s + 1].x; ) s++;
  let c = t[s],
    l = t[Math.min(t.length - 1, s + 1)],
    u = c === l ? 0 : A(0, 1, (o - c.x) / (l.x - c.x)),
    d = $(e, c.chain, n, r),
    f = c === l ? [] : $(e, l.chain, n, r),
    p = new Map();
  for (let [e, t] of d) p.set(e, (p.get(e) || 0) + t * (1 - u));
  for (let [e, t] of f) p.set(e, (p.get(e) || 0) + t * u);
  if (a) {
    let [t, n] = a,
      r = e.index(t);
    for (let [e, t] of p) p.set(e, t * (1 - n));
    p.set(r, (p.get(r) || 0) + n);
  }
  let m = [...p.entries()]
      .filter((e) => e[1] > 0.002)
      .sort((e, t) => t[1] - e[1])
      .slice(0, 4),
    h = m.reduce((e, t) => e + t[1], 0) || 1;
  return m.map(([e, t]) => [e, t / h]);
}
function ue(e, t, n, r = {}) {
  let i = e.length / 3,
    a = new Float32Array(i).fill(1);
  if (!i) return a;
  let o = 1e9,
    s = 1e9,
    c = 1e9,
    l = -1e9,
    u = -1e9,
    d = -1e9;
  for (let t = 0; t < i; t++) {
    let n = e[t * 3],
      r = e[t * 3 + 1],
      i = e[t * 3 + 2];
    (n < o && (o = n),
      r < s && (s = r),
      i < c && (c = i),
      n > l && (l = n),
      r > u && (u = r),
      i > d && (d = i));
  }
  let f = r.cell || 0.035,
    p = f * 8;
  ((o -= p), (s -= p), (c -= p));
  let m = Math.ceil((l - o + p) / f),
    h = Math.ceil((u - s + p) / f),
    g = Math.ceil((d - c + p) / f),
    _ = new Uint8Array(m * h * g),
    v = (e, t, n) => {
      let r = ((e - o) / f) | 0,
        i = ((t - s) / f) | 0,
        a = ((n - c) / f) | 0;
      r >= 0 &&
        i >= 0 &&
        a >= 0 &&
        r < m &&
        i < h &&
        a < g &&
        (_[(a * h + i) * m + r] = 1);
    };
  for (let t = 0; t < n.length; t += 3) {
    let r = n[t] * 3,
      i = n[t + 1] * 3,
      a = n[t + 2] * 3,
      o = e[r],
      s = e[r + 1],
      c = e[r + 2],
      l = e[i],
      u = e[i + 1],
      d = e[i + 2],
      p = e[a],
      m = e[a + 1],
      h = e[a + 2],
      g = Math.max(
        Math.hypot(l - o, u - s, d - c),
        Math.hypot(p - o, m - s, h - c),
        Math.hypot(p - l, m - u, h - d),
      ),
      _ = Math.min(64, Math.max(1, Math.ceil(g / (f * 0.7))));
    for (let e = 0; e <= _; e++)
      for (let t = 0; t <= _ - e; t++) {
        let n = e / _,
          r = t / _,
          i = 1 - n - r;
        v(o * i + l * n + p * r, s * i + u * n + m * r, c * i + d * n + h * r);
      }
  }
  let y = (e, t, n) => {
      let r = ((e - o) / f) | 0,
        i = ((t - s) / f) | 0,
        a = ((n - c) / f) | 0;
      return (
        r >= 0 &&
        i >= 0 &&
        a >= 0 &&
        r < m &&
        i < h &&
        a < g &&
        _[(a * h + i) * m + r] === 1
      );
    },
    b = [];
  for (let e = 0; e < 14; e++) {
    let t = (e + 0.5) / 14,
      n = e * 2.39996,
      r = Math.sqrt(t) * 0.92,
      i = Math.sqrt(1 - r * r);
    b.push([Math.cos(n) * r, i, Math.sin(n) * r]);
  }
  let x = [1.6, 2.6, 3.8, 5.4, 7.5];
  for (let n = 0; n < i; n++) {
    let i = e[n * 3],
      o = e[n * 3 + 1],
      s = e[n * 3 + 2],
      c = t[n * 3],
      l = t[n * 3 + 1],
      u = t[n * 3 + 2],
      d = Math.abs(l) < 0.9 ? 0 : 1,
      p = +(Math.abs(l) < 0.9),
      m = l * 0 - u * p,
      h = u * d - c * 0,
      g = c * p - l * d,
      _ = Math.hypot(m, h, g) || 1;
    ((m /= _), (h /= _), (g /= _));
    let v = h * u - g * l,
      S = g * c - m * u,
      C = m * l - h * c,
      w = 0;
    for (let [e, t, n] of b) {
      let r = m * e + c * t + v * n,
        a = h * e + l * t + S * n,
        d = g * e + u * t + C * n;
      for (let e = 0; e < x.length; e++) {
        let t = x[e] * f;
        if (y(i + r * t, o + a * t, s + d * t)) {
          w += 1 - e * 0.14;
          break;
        }
      }
    }
    a[n] = 1 - Math.min(1, w / b.length) * (r.strength ?? 0.95);
  }
  return a;
}
function de(e, t, n, r, i, a = {}) {
  let o = a.skip || null,
    s = e.length / 3,
    c = new Float32Array(s),
    l = a.radius ?? 0.024,
    u = a.cell ?? 0.035,
    d = a.widen ?? 0.026,
    f = n.length / 3;
  if (!s || !f) return c;
  let p = 1e9,
    m = 1e9,
    h = 1e9,
    g = -1e9,
    _ = -1e9,
    v = -1e9;
  for (let t = 0; t < s; t++) {
    let n = e[t * 3],
      r = e[t * 3 + 1],
      i = e[t * 3 + 2];
    (n < p && (p = n),
      r < m && (m = r),
      i < h && (h = i),
      n > g && (g = n),
      r > _ && (_ = r),
      i > v && (v = i));
  }
  ((p -= l), (m -= l), (h -= l));
  let y = Math.ceil((g - p + l) / u) + 1,
    b = Math.ceil((_ - m + l) / u) + 1,
    x = Math.ceil((v - h + l) / u) + 1,
    S = (e, t, n) => {
      let r = Math.floor((e - n) / u);
      return r < 0 ? 0 : r >= t ? t - 1 : r;
    },
    C = new Float32Array(f * 3),
    w = new Int32Array(f),
    T = new Int32Array(f * 6),
    E = new Float32Array(f * 6),
    D = new Int32Array(y * b * x + 1);
  for (let t = 0; t < f; t++) {
    let i = n[t * 3] * 3,
      a = n[t * 3 + 1] * 3,
      o = n[t * 3 + 2] * 3;
    w[t] = r[n[t * 3]];
    let s = e[a] - e[i],
      c = e[a + 1] - e[i + 1],
      u = e[a + 2] - e[i + 2],
      d = e[o] - e[i],
      f = e[o + 1] - e[i + 1],
      g = e[o + 2] - e[i + 2],
      _ = c * g - u * f,
      v = u * d - s * g,
      O = s * f - c * d,
      k = Math.hypot(_, v, O) || 1;
    ((C[t * 3] = _ / k), (C[t * 3 + 1] = v / k), (C[t * 3 + 2] = O / k));
    let A = t * 6;
    ((E[A] = Math.min(e[i], e[a], e[o]) - l),
      (E[A + 1] = Math.max(e[i], e[a], e[o]) + l),
      (E[A + 2] = Math.min(e[i + 1], e[a + 1], e[o + 1]) - l),
      (E[A + 3] = Math.max(e[i + 1], e[a + 1], e[o + 1]) + l),
      (E[A + 4] = Math.min(e[i + 2], e[a + 2], e[o + 2]) - l),
      (E[A + 5] = Math.max(e[i + 2], e[a + 2], e[o + 2]) + l),
      (T[A] = S(Math.min(e[i], e[a], e[o]), y, p)),
      (T[A + 1] = S(Math.max(e[i], e[a], e[o]), y, p)),
      (T[A + 2] = S(Math.min(e[i + 1], e[a + 1], e[o + 1]), b, m)),
      (T[A + 3] = S(Math.max(e[i + 1], e[a + 1], e[o + 1]), b, m)),
      (T[A + 4] = S(Math.min(e[i + 2], e[a + 2], e[o + 2]), x, h)),
      (T[A + 5] = S(Math.max(e[i + 2], e[a + 2], e[o + 2]), x, h)));
    for (let e = T[A + 4]; e <= T[A + 5]; e++)
      for (let t = T[A + 2]; t <= T[A + 3]; t++)
        for (let n = T[A]; n <= T[A + 1]; n++) D[(e * b + t) * y + n + 1]++;
  }
  for (let e = 1; e < D.length; e++) D[e] += D[e - 1];
  let O = new Int32Array(D[D.length - 1]),
    k = D.slice(0, D.length - 1);
  for (let e = 0; e < f; e++) {
    let t = e * 6;
    for (let n = T[t + 4]; n <= T[t + 5]; n++)
      for (let r = T[t + 2]; r <= T[t + 3]; r++)
        for (let i = T[t]; i <= T[t + 1]; i++) O[k[(n * b + r) * y + i]++] = e;
  }
  let j = new Int32Array(f).fill(-1),
    M = [0, 0, 0];
  for (let i = 0; i < s; i++) {
    if (o && o[i] <= 0) continue;
    let a = e[i * 3],
      s = e[i * 3 + 1],
      u = e[i * 3 + 2],
      d = r[i],
      f = 0,
      g = S(a - l, y, p),
      _ = S(a + l, y, p),
      v = S(s - l, b, m),
      T = S(s + l, b, m),
      k = S(u - l, x, h),
      N = S(u + l, x, h),
      P = t[i * 3],
      F = t[i * 3 + 1],
      I = t[i * 3 + 2];
    for (let t = k; t <= N; t++)
      for (let r = v; r <= T; r++)
        for (let o = g; o <= _; o++) {
          let c = (t * b + r) * y + o,
            p = D[c + 1];
          for (let t = D[c]; t < p; t++) {
            let r = O[t];
            if (j[r] === i || w[r] === d) continue;
            j[r] = i;
            let o = r * 6;
            if (
              a < E[o] ||
              a > E[o + 1] ||
              s < E[o + 2] ||
              s > E[o + 3] ||
              u < E[o + 4] ||
              u > E[o + 5]
            )
              continue;
            let c = n[r * 3] * 3,
              p = r * 3,
              m =
                (a - e[c]) * C[p] +
                (s - e[c + 1]) * C[p + 1] +
                (u - e[c + 2]) * C[p + 2];
            if (m < -0.006 || m > l) continue;
            let h = Math.abs(P * C[p] + F * C[p + 1] + I * C[p + 2]);
            if (h > 0.97) continue;
            let g = 1 - A(0.55, 0.95, h) * 0.9,
              _ = m < 0 ? 0 : m;
            if ((1 - _ / l) * (1 - _ / l) * g <= f) continue;
            fe(e, n[p], n[p + 1], n[p + 2], a, s, u, M);
            let v = Math.hypot(M[0] - a, M[1] - s, M[2] - u);
            if (v >= l) continue;
            let y = (1 - v / l) * (1 - v / l) * g;
            y > f && (f = y);
          }
        }
    c[i] = f;
  }
  let N = new Int32Array(s + 1);
  for (let e = 0; e < f * 3; e++) N[n[e] + 1] += 2;
  for (let e = 1; e <= s; e++) N[e] += N[e - 1];
  let P = new Int32Array(N[s]),
    F = N.slice(0, s);
  for (let e = 0; e < f; e++)
    for (let t = 0; t < 3; t++) {
      let r = n[e * 3 + t],
        i = n[e * 3 + ((t + 1) % 3)];
      ((P[F[r]++] = i), (P[F[i]++] = r));
    }
  for (let e = 0; e < s; e++) {
    let t = N[e],
      n = N[e + 1];
    if (!(n - t > 64))
      for (let r = t; r < n; r++) {
        let i = P[r],
          a = 0;
        for (let e = t; e < n; e++) P[e] === i && a++;
        if (a === 1) {
          c[e] < 0.5 && (c[e] = 0.5);
          break;
        }
      }
  }
  if (d > 0) {
    let t = c,
      n = new Float32Array(s);
    for (let r = 0; r < 2; r++) {
      n.set(t);
      for (let r = 0; r < s; r++) {
        let i = N[r],
          a = N[r + 1],
          o = e[r * 3],
          s = e[r * 3 + 1],
          c = e[r * 3 + 2],
          l = t[r];
        for (let n = i; n < a; n++) {
          let r = P[n];
          if (t[r] <= l) continue;
          let i = Math.hypot(e[r * 3] - o, e[r * 3 + 1] - s, e[r * 3 + 2] - c),
            a = t[r] * (1 - Math.min(1, i / d));
          a > l && (l = a);
        }
        n[r] = l;
      }
      let r = t;
      ((t = n), (n = r));
    }
    t !== c && c.set(t);
  }
  return c;
}
function fe(e, t, n, r, i, a, o, s) {
  let c = e[t * 3],
    l = e[t * 3 + 1],
    u = e[t * 3 + 2],
    d = e[n * 3],
    f = e[n * 3 + 1],
    p = e[n * 3 + 2],
    m = e[r * 3],
    h = e[r * 3 + 1],
    g = e[r * 3 + 2],
    _ = d - c,
    v = f - l,
    y = p - u,
    b = m - c,
    x = h - l,
    S = g - u,
    C = i - c,
    w = a - l,
    T = o - u,
    E = _ * C + v * w + y * T,
    D = b * C + x * w + S * T;
  if (E <= 0 && D <= 0) {
    ((s[0] = c), (s[1] = l), (s[2] = u));
    return;
  }
  let O = i - d,
    k = a - f,
    A = o - p,
    j = _ * O + v * k + y * A,
    M = b * O + x * k + S * A;
  if (j >= 0 && M <= j) {
    ((s[0] = d), (s[1] = f), (s[2] = p));
    return;
  }
  let N = E * M - j * D;
  if (N <= 0 && E >= 0 && j <= 0) {
    let e = E / (E - j);
    ((s[0] = c + _ * e), (s[1] = l + v * e), (s[2] = u + y * e));
    return;
  }
  let P = i - m,
    F = a - h,
    I = o - g,
    L = _ * P + v * F + y * I,
    R = b * P + x * F + S * I;
  if (R >= 0 && L <= R) {
    ((s[0] = m), (s[1] = h), (s[2] = g));
    return;
  }
  let z = L * D - E * R;
  if (z <= 0 && D >= 0 && R <= 0) {
    let e = D / (D - R);
    ((s[0] = c + b * e), (s[1] = l + x * e), (s[2] = u + S * e));
    return;
  }
  let B = j * R - L * M;
  if (B <= 0 && M - j >= 0 && L - R >= 0) {
    let e = (M - j) / (M - j + (L - R));
    ((s[0] = d + (m - d) * e),
      (s[1] = f + (h - f) * e),
      (s[2] = p + (g - p) * e));
    return;
  }
  let V = 1 / (B + z + N),
    H = z * V,
    U = N * V;
  ((s[0] = c + _ * H + b * U),
    (s[1] = l + v * H + x * U),
    (s[2] = u + y * H + S * U));
}
function pe(e, t, n) {
  let r = t.length / 3,
    i = new Float32Array(r),
    a = 0.03,
    o = new Map(),
    s = (e, t, n, r) => ((e * 256 + t + 128) * 256 + n + 128) * 256 + r + 128;
  for (let t = 0; t < e.seam.length; t++) {
    let n = s(
        e.partOf[t],
        Math.floor(e.pos[t * 3] / a),
        Math.floor(e.pos[t * 3 + 1] / a),
        Math.floor(e.pos[t * 3 + 2] / a),
      ),
      r = o.get(n);
    (r || o.set(n, (r = [])), r.push(t));
  }
  for (let c = 0; c < r; c++) {
    let r = t[c * 3],
      l = t[c * 3 + 1],
      u = t[c * 3 + 2],
      d = Math.floor(r / a),
      f = Math.floor(l / a),
      p = Math.floor(u / a),
      m = 1e9,
      h = 0;
    for (let t = -1; t <= 1; t++)
      for (let i = -1; i <= 1; i++)
        for (let a = -1; a <= 1; a++) {
          let g = o.get(s(n[c], d + t, f + i, p + a));
          if (g)
            for (let t of g) {
              let n =
                (e.pos[t * 3] - r) ** 2 +
                (e.pos[t * 3 + 1] - l) ** 2 +
                (e.pos[t * 3 + 2] - u) ** 2;
              n < m && ((m = n), (h = e.seam[t]));
            }
        }
    i[c] = h;
  }
  return i;
}
export {
  G as C,
  U as S,
  j as _,
  P as a,
  ee as b,
  M as c,
  J as d,
  z as f,
  I as g,
  R as h,
  D as i,
  le as l,
  N as m,
  O as n,
  W as o,
  H as p,
  ie as r,
  $ as s,
  E as t,
  K as u,
  L as v,
  B as w,
  A as x,
  V as y,
};
