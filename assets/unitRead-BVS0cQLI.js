import "./map-oE9sOnNc.js";
import { Yt as e, ut as t } from "./index-DHK-Ptzs.js";
import { i as n, o as r, t as i } from "./height-CVtQdZ3e.js";
var a = null,
  o = null;
function s() {
  if (a) return a;
  let e = 120 / 512;
  a = new Float32Array(262144);
  for (let t = 0; t < 512; t++)
    for (let n = 0; n < 512; n++)
      a[t * 512 + n] = r((n + 0.5) * e, (t + 0.5) * e);
  return a;
}
function c() {
  if (o) return o;
  let e = s();
  o = new Float32Array(262144);
  for (let t = 0; t < 512; t++)
    for (let n = 0; n < 512; n++) {
      let r = -1e9;
      for (let i = -1; i <= 1; i++) {
        let a = t + i;
        if (!(a < 0 || a >= 512))
          for (let t = -1; t <= 1; t++) {
            let i = n + t;
            if (i < 0 || i >= 512) continue;
            let o = e[a * 512 + i];
            o > r && (r = o);
          }
      }
      o[t * 512 + n] = r + 0.15;
    }
  return o;
}
var l = {
  left: 0,
  top: 0,
  width: 1,
  height: 1,
  dirty: !0,
  bound: !1,
  el: null,
  calls: 0,
};
function u() {
  if (((l.bound = !0), typeof window > `u`)) return;
  let e = () => {
    l.dirty = !0;
  };
  (window.addEventListener(`resize`, e, { passive: !0 }),
    window.addEventListener(`scroll`, e, { passive: !0, capture: !0 }),
    document.addEventListener(`fullscreenchange`, e));
  let t = document.getElementById(`game-canvas`);
  if (((l.el = t), t && typeof ResizeObserver == `function`))
    try {
      new ResizeObserver(e).observe(t);
    } catch {}
}
function d() {
  if ((l.bound || u(), ++l.calls % 90 == 0 && (l.dirty = !0), l.dirty)) {
    ((l.dirty = !1),
      (!l.el || !l.el.isConnected) &&
        (l.el =
          typeof document < `u`
            ? document.getElementById(`game-canvas`)
            : null));
    let e = l.el ? l.el.getBoundingClientRect() : null;
    e && e.width > 1 && e.height > 1
      ? ((l.left = e.left),
        (l.top = e.top),
        (l.width = e.width),
        (l.height = e.height))
      : typeof window < `u` &&
        ((l.left = 0),
        (l.top = 0),
        (l.width = window.innerWidth || 1),
        (l.height = window.innerHeight || 1));
  }
  return l;
}
var f = null;
function p() {
  if (f !== null) return f;
  let e = 0;
  for (let t = -8; t <= 128; t += 1)
    for (let n = -8; n <= 128; n += 1) {
      let i = r(n, t);
      i > e && (e = i);
    }
  return ((e = Math.max(e, n + i + 0.6)), (f = e + 0.25), f);
}
var m = class {
    constructor(n) {
      ((this.camera = n),
        (this.vp = new t()),
        (this.e = this.vp.elements),
        (this.l = 0),
        (this.t = 0),
        (this.w = 1),
        (this.h = 1),
        (this._o = new e()),
        (this._d = new e()),
        (this._v = new e()),
        (this.rightX = 1),
        (this.rightZ = 0),
        (this.fwdX = 0),
        (this.fwdZ = -1),
        (this.pickSteps = 0),
        (this.upper = c()),
        (this.picks = 0),
        (this._key = new Float64Array(38).fill(NaN)),
        (this._hitX = 0),
        (this._hitY = 0),
        (this._hitOk = !1));
    }
    begin() {
      let e = this.camera,
        t = d();
      ((this.l = t.left),
        (this.t = t.top),
        (this.w = t.width),
        (this.h = t.height),
        this.vp.multiplyMatrices(e.projectionMatrix, e.matrixWorldInverse));
      let n = e.matrixWorld.elements,
        r = n[0],
        i = n[2],
        a = Math.sqrt(r * r + i * i) || 1;
      ((this.rightX = r / a), (this.rightZ = i / a));
      let o = -n[8],
        s = -n[10],
        c = Math.sqrt(o * o + s * s);
      return (
        c < 1e-4 &&
          ((o = -n[4]), (s = -n[6]), (c = Math.sqrt(o * o + s * s) || 1)),
        (this.fwdX = o / c),
        (this.fwdZ = s / c),
        this
      );
    }
    get left() {
      return this.l;
    }
    get top() {
      return this.t;
    }
    get right() {
      return this.l + this.w;
    }
    get bottom() {
      return this.t + this.h;
    }
    project(e, t, n, r) {
      let i = this.e,
        a = i[0] * e + i[4] * t + i[8] * n + i[12],
        o = i[1] * e + i[5] * t + i[9] * n + i[13],
        s = i[3] * e + i[7] * t + i[11] * n + i[15];
      if (s <= 1e-4)
        return ((r.visible = !1), (r.x = -1e5), (r.y = -1e5), (r.depth = s), r);
      let c = a / s,
        l = o / s;
      return (
        (r.x = this.l + (c * 0.5 + 0.5) * this.w),
        (r.y = this.t + (-l * 0.5 + 0.5) * this.h),
        (r.depth = s),
        (r.visible = c > -1.25 && c < 1.25 && l > -1.3 && l < 1.3),
        r
      );
    }
    screenDirToGround(e, t, n) {
      let r = this.rightX * e - this.fwdX * t,
        i = this.rightZ * e - this.fwdZ * t,
        a = Math.sqrt(r * r + i * i);
      return a < 1e-6
        ? ((n.x = 0), (n.y = 0), n)
        : ((n.x = r / a), (n.y = i / a), n);
    }
    screenToGround(e, t, n) {
      let i = this.camera,
        a = this._key,
        o = i.matrixWorld.elements,
        s = i.projectionMatrixInverse.elements,
        c =
          a[0] === e &&
          a[1] === t &&
          a[2] === this.l &&
          a[3] === this.t &&
          a[4] === this.w &&
          a[5] === this.h;
      if (c) {
        for (let e = 0; e < 16; e++)
          if (a[6 + e] !== o[e] || a[22 + e] !== s[e]) {
            c = !1;
            break;
          }
      }
      if (c)
        return (
          (n.x = this._hitX),
          (n.y = this._hitY),
          (n.ok = this._hitOk),
          n
        );
      (this.picks++,
        (a[0] = e),
        (a[1] = t),
        (a[2] = this.l),
        (a[3] = this.t),
        (a[4] = this.w),
        (a[5] = this.h));
      for (let e = 0; e < 16; e++) ((a[6 + e] = o[e]), (a[22 + e] = s[e]));
      let l = ((e - this.l) / this.w) * 2 - 1,
        u = -((t - this.t) / this.h) * 2 + 1,
        d = s[3] * l + s[7] * u + s[11] * 0.5 + s[15],
        f = (s[0] * l + s[4] * u + s[8] * 0.5 + s[12]) / d,
        m = (s[1] * l + s[5] * u + s[9] * 0.5 + s[13]) / d,
        h = (s[2] * l + s[6] * u + s[10] * 0.5 + s[14]) / d,
        g = o[12],
        _ = o[13],
        v = o[14],
        y = o[0] * f + o[4] * m + o[8] * h + o[12] - g,
        b = o[1] * f + o[5] * m + o[9] * h + o[13] - _,
        x = o[2] * f + o[6] * m + o[10] * h + o[14] - v,
        S = Math.sqrt(y * y + b * b + x * x) || 1;
      if (((y /= S), (b /= S), (x /= S), b > -1e-4))
        return (
          (this._hitX = g),
          (this._hitY = v),
          (this._hitOk = !1),
          (n.x = g),
          (n.y = v),
          (n.ok = !1),
          n
        );
      let C = Math.max(0, (p() - _) / b),
        w = (-1 - _) / b,
        T = Math.max(28, Math.ceil((w - C) / 0.35)),
        E = (w - C) / T,
        D = this.upper,
        O = 512 / 120,
        k = T,
        A = 0;
      for (let e = 0; e <= T; e++) {
        let t = C + E * e,
          n = g + y * t,
          r = v + x * t,
          i;
        if (n < 0 || r < 0 || n > 120 || r > 120) i = 1e9;
        else {
          let e = n * O - 0.5,
            t = r * O - 0.5;
          (e < 0 && (e = 0),
            t < 0 && (t = 0),
            e > 510.999 && (e = 510.999),
            t > 510.999 && (t = 510.999));
          let a = e | 0,
            o = t | 0,
            s = e - a,
            c = t - o,
            l = o * 512 + a;
          i =
            (D[l] * (1 - s) + D[l + 1] * s) * (1 - c) +
            (D[l + 512] * (1 - s) + D[l + 512 + 1] * s) * c;
        }
        if (_ + b * t - i <= 0) {
          k = e > 0 ? e - 1 : 0;
          break;
        }
      }
      let j = C + E * k,
        M = _ + b * j - r(g + y * j, v + x * j),
        N = -1;
      A = 1;
      for (let e = k + 1; e <= T; e++) {
        let t = C + E * e,
          n = _ + b * t - r(g + y * t, v + x * t);
        if ((A++, M > 0 && n <= 0)) {
          let e = j,
            n = t;
          for (let t = 0; t < 8; t++) {
            let t = (e + n) * 0.5;
            _ + b * t - r(g + y * t, v + x * t) > 0 ? (e = t) : (n = t);
          }
          ((A += 8), (N = (e + n) * 0.5));
          break;
        }
        ((j = t), (M = n));
      }
      let P = A;
      return (
        N < 0 && (N = (0 - _) / b),
        (this.pickSteps = P),
        (this._hitX = g + y * N),
        (this._hitY = v + x * N),
        (this._hitOk = !0),
        (n.x = this._hitX),
        (n.y = this._hitY),
        (n.ok = !0),
        n
      );
    }
    pixelsPerUnit(e, t, n) {
      let r = this.e,
        i = r[3] * e + r[7] * t + r[11] * n + r[15];
      return i <= 1e-4
        ? 0
        : Math.abs(
            (this.camera.projectionMatrix.elements[5] * 0.5 * this.h) / i,
          );
    }
  },
  h = new Float64Array(12),
  g = `
  U[0] = u.prevX + (u.x - u.prevX) * a; U[1] = u.prevY + (u.y - u.prevY) * a;
  U[2] = u.hp; U[3] = u.maxHp; const sh = u.shield; U[4] = sh > 0 ? sh : 0; U[5] = u.mana; U[6] = u.maxMana; U[7] = u.xp;
  const r = u.radius; U[8] = r > 0 ? r : 0.5; const h = u.height; U[9] = h > 0 ? h : 2;
  const rs = u.recallStart; U[10] = rs == null ? -1 : rs; U[11] = u.facing;`,
  _ = (e) => Function(`U`, `return function read_${e}(u, a) {${g}\n};`)(h),
  v = _(`minion`),
  y = _(`monster`),
  b = _(`tower`),
  x = _(`inhibitor`),
  S = _(`nexus`),
  C = _(`ward`),
  w = _(`projectile`),
  T = _(`other`),
  E = new Map(),
  D = null;
function O(e) {
  let t = E.get(e);
  return (
    t ||
    (E.size >= 64
      ? (D ||= _(`champion_any`))
      : ((t = _(`champion_${e | 0}`)), E.set(e, t), t))
  );
}
function k(e, t) {
  let n = e.kind;
  return (
    n === `minion`
      ? v(e, t)
      : n === `champion`
        ? O(e.id)(e, t)
        : n === `monster`
          ? y(e, t)
          : n === `tower`
            ? b(e, t)
            : n === `inhibitor`
              ? x(e, t)
              : n === `nexus`
                ? S(e, t)
                : n === `ward`
                  ? C(e, t)
                  : n === `projectile`
                    ? w(e, t)
                    : T(e, t),
    h
  );
}
var A = new Float64Array(1);
function j(e, t) {
  if (!e) return -1;
  let n = e.airborneUntil;
  return n > t
    ? ((A[0] = n), 0)
    : ((n = e.stunUntil),
      n > t
        ? ((A[0] = n), 1)
        : ((n = e.silenceUntil),
          n > t
            ? ((A[0] = n), 2)
            : ((n = e.rootUntil),
              n > t
                ? ((A[0] = n), 3)
                : ((n = e.slowUntil), n > t ? ((A[0] = n), 4) : -1))));
}
export { m as a, k as i, h as n, d as o, j as r, s, A as t };
