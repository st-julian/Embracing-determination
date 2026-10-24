import {
  At as e,
  Bt as t,
  Ct as n,
  Kt as r,
  M as i,
  O as a,
  Yt as o,
  at as s,
  ft as c,
  kt as l,
  mt as u,
  ot as d,
  w as f,
} from "./index-DHK-Ptzs.js";
import { i as p } from "./geo-VdiuQ1XD.js";
import { t as m } from "./rim-zRZuAScU.js";
var h = [
    `paint`,
    `stone`,
    `metal`,
    `leather`,
    `cloth`,
    `hair`,
    `skin`,
    `fur`,
    `wood`,
    `coral`,
    `gem`,
    `hide`,
    `twill`,
  ],
  g = null;
function _() {
  g &&= (g.texture.dispose(), null);
}
function v() {
  if (g) return g;
  let e = h.length,
    t = new Uint8Array(102400 * e * 4),
    a = performance.now();
  for (let n = 0; n < e; n++) N(h[n], 320, t, n * 320 * 320 * 4);
  let o = new i(t, 320, 320, e);
  return (
    (o.format = n),
    (o.type = r),
    (o.wrapS = o.wrapT = l),
    (o.magFilter = s),
    (o.minFilter = d),
    (o.generateMipmaps = !0),
    (o.anisotropy = 4),
    (o.needsUpdate = !0),
    (g = { texture: o, ms: performance.now() - a }),
    g
  );
}
function y(e, t) {
  let n = new Float32Array(e * e),
    r = (t * 2654435761) >>> 0;
  for (let e = 0; e < n.length; e++)
    ((r ^= r << 13),
      (r >>>= 0),
      (r ^= r >>> 17),
      (r ^= r << 5),
      (r >>>= 0),
      (n[e] = (r & 65535) / 65535));
  return n;
}
var b = [];
for (let e = 0; e < 12; e++) b.push(y(128, 97 + e * 31));
function x(e, t, n, r) {
  let i = Math.floor(n),
    a = Math.floor(r),
    o = n - i,
    s = r - a,
    c = o * o * (3 - 2 * o),
    l = s * s * (3 - 2 * s),
    u = ((i % t) + t) % t,
    d = ((a % t) + t) % t,
    f = (u + 1) % t,
    p = (d + 1) % t,
    m = b[e],
    h = m[d * 128 + u],
    g = m[d * 128 + f],
    _ = m[p * 128 + u],
    v = m[p * 128 + f];
  return h + (g - h) * c + (_ + (v - _) * c - (h + (g - h) * c)) * l;
}
function S(e, t, n, r, i, a = 0.5) {
  let o = 0,
    s = 1,
    c = 0;
  for (let l = 0; l < i; l++)
    ((o += x((e + l) % 12, r, t * r, n * r) * s), (c += s), (s *= a), (r *= 2));
  return o / c;
}
function C(e, t, n, r, i, a) {
  let o = 0,
    s = 1,
    c = 0;
  for (let l = 0; l < a; l++) {
    let a = Math.max(r, i);
    ((o += w((e + l) % 12, r, i, t * r, n * i, a) * s),
      (c += s),
      (s *= 0.5),
      (r *= 2),
      (i *= 2));
  }
  return o / c;
}
function w(e, t, n, r, i) {
  let a = Math.floor(r),
    o = Math.floor(i),
    s = r - a,
    c = i - o,
    l = s * s * (3 - 2 * s),
    u = c * c * (3 - 2 * c),
    d = ((a % t) + t) % t,
    f = ((o % n) + n) % n,
    p = (d + 1) % t,
    m = (f + 1) % n,
    h = b[e],
    g = h[f * 128 + d],
    _ = h[f * 128 + p],
    v = h[m * 128 + d],
    y = h[m * 128 + p];
  return g + (_ - g) * l + (v + (y - v) * l - (g + (_ - g) * l)) * u;
}
var T = { f1: 0, f2: 0, id: 0 };
function E(e, t, n, r, i = 0.9) {
  let a = t * r,
    o = n * r,
    s = Math.floor(a),
    c = Math.floor(o),
    l = 9,
    u = 9,
    d = 0,
    f = b[e];
  for (let e = -1; e <= 1; e++)
    for (let t = -1; t <= 1; t++) {
      let n = s + t,
        p = c + e,
        m = ((n % r) + r) % r,
        h = (((p % r) + r) % r) * 128 + m,
        g = n + 0.5 + (f[h] - 0.5) * i,
        _ = p + 0.5 + (f[(h + 57) % f.length] - 0.5) * i,
        v = Math.hypot(g - a, _ - o);
      v < l ? ((u = l), (l = v), (d = h)) : v < u && (u = v);
    }
  return ((T.f1 = l), (T.f2 = u), (T.id = d), T);
}
var D = (e, t, n) => {
    let r = Math.min(1, Math.max(0, (n - e) / (t - e)));
    return r * r * (3 - 2 * r);
  },
  O = (e) => (e <= 0 ? 0 : e >= 1 ? 255 : (e * 255 + 0.5) | 0);
function k(e, t, n, r) {
  let i = ((((e - n) * t) % 1) + 1) % 1,
    a = Math.abs(i - 0.5) / t;
  return 1 - D(r * 0.35, r, a);
}
function A(e, t, n, r) {
  let i = ((((e - n) * t) % 1) + 1) % 1,
    a = Math.abs(i - 0.5) / t;
  return 1 - D(r * 0.35, r, a);
}
function j(e, t, n, r, i, a, o = 0.55) {
  let s = ((((e - r) * n) % 1) + 1) % 1,
    c = Math.abs(s - 0.5) / n,
    l = (((t * a) % 1) + 1) % 1,
    u = D(o, o - 0.16, l) * D(0, 0.1, l);
  return (1 - D(i * 0.45, i, c)) * u;
}
function M(e, t, n, r, i, a, o = 0.55) {
  let s = ((((t - r) * n) % 1) + 1) % 1,
    c = Math.abs(s - 0.5) / n,
    l = (((e * a) % 1) + 1) % 1,
    u = D(o, o - 0.16, l) * D(0, 0.1, l);
  return (1 - D(i * 0.45, i, c)) * u;
}
function N(e, t, n, r) {
  let i = 1 / t;
  for (let a = 0; a < t; a++) {
    let o = a * i;
    for (let s = 0; s < t; s++) {
      let c = s * i,
        l = 0.5,
        u = 0.5,
        d = 0.5,
        f = 0.5;
      switch (e) {
        case `paint`: {
          let e = S(0, c, o, 2, 3),
            t = C(3, c, o, 24, 3, 2),
            n = S(6, c, o, 3, 2);
          ((l = 0.5 + (e - 0.5) * 0.55 + (n - 0.5) * 0.5 + (t - 0.5) * 0.12),
            (u = 0.5 + (e - 0.5) * 0.3),
            (d = S(5, c, o, 6, 3)),
            (f = 0.5 + (S(7, c, o, 2, 2) - 0.5) * 0.7));
          break;
        }
        case `stone`: {
          let e = S(0, c, o, 2, 3) - 0.5,
            t = S(8, c, o, 5, 3) - 0.5,
            n = C(3, c + o, c - o + 1, 3, 30, 2),
            r = C(5, c - o + 1, c + o, 4, 26, 2),
            i = C(7, c, o, 2, 22, 2),
            p = S(10, c, o, 3, 2),
            m = D(0.36, 0.5, p) * (1 - D(0.5, 0.64, p)),
            h = D(0.5, 0.64, p),
            g = n * (1 - m - h) + i * m + r * h - 0.5,
            _ = E(
              1,
              c + (S(2, c, o, 4, 2) - 0.5) * 0.14,
              o + (S(4, c, o, 4, 2) - 0.5) * 0.1,
              4,
            ),
            v = _.f2 - _.f1,
            y = D(0.5, 0.64, S(11, c, o, 3, 2)),
            w = (1 - D(0.008, 0.04, v)) * y,
            T = D(0.03, 0.06, v) * (1 - D(0.06, 0.11, v)) * y,
            O = b[9][((a * 7) % 128) * 128 + ((s * 3) % 128)] - 0.5,
            k = D(0.8, 0.9, x(6, 40, c * 40, o * 40));
          ((l =
            0.5 *
            (1 + e * 1.2 + t * 0.5 + g * 0.5 + O * 0.1 + T * 0.18 - k * 0.12) *
            (1 - w * 0.5)),
            (u = 0.5 + w * 0.2 + k * 0.1 - g * 0.12),
            (d = 0.35 + T * 0.4 + (S(0, c, o, 6, 2) - 0.5) * 0.5 + g * 0.3),
            (f = 0.5 + e * 1.3 + t * 0.4));
          break;
        }
        case `metal`: {
          let e = C(1, c + o, c - o + 1, 72, 3, 2),
            t = C(3, c - o + 1, c + o, 30, 2, 2),
            n = D(0.05, 0.62, E(6, c, o, 14, 0.9).f1) - 0.5,
            r = x(4, 6, c * 6, o * 6),
            i = 1 - D(0, 0.012, Math.abs(r - 0.5)),
            a = x(5, 9, c * 9 + 3, o * 9),
            s = 1 - D(0, 0.008, Math.abs(a - 0.52)),
            p = S(2, c, o, 2, 3) - 0.5,
            m = S(8, c, o, 3, 2) - 0.5,
            h = D(0.58, 0.82, S(9, c, o, 4, 3));
          ((l =
            0.5 *
            (1 +
              (e - 0.5) * 0.36 +
              (t - 0.5) * 0.2 +
              n * 0.3 +
              p * 1.25 +
              m * 0.4 +
              (i * 0.7 + s * 0.5) * 0.3 -
              h * 0.2)),
            (u = 0.5 + (e - 0.5) * 0.45 - (i + s) * 0.15 + h * 0.2),
            (d = S(9, c, o, 5, 4) * 0.7 + i * 0.2 + (t - 0.5) * 0.2),
            (f = 0.5 - h * 0.35 + p * 0.9 + m * 0.3));
          break;
        }
        case `leather`: {
          let e = S(1, c, o, 5, 3) - 0.5,
            t = S(0, c, o, 2, 3) - 0.5,
            n = 1 - D(0.12, 0.62, E(3, c, o, 44, 0.85).f1),
            r = 1 - D(0, 0.022, Math.abs(C(4, c, o, 3, 12, 2) - 0.5)),
            i = (1 - D(0, 0.016, Math.abs(C(6, c, o, 10, 3, 2) - 0.5))) * 0.6,
            a = D(0.6, 0.78, S(6, c, o, 4, 4)),
            s = (C(9, c, o, 1, 4, 2) - 0.5) * 0.05,
            p = k(c + s, 2, 0.09, 0.013),
            m = k(c + s, 2, 0.115, 0.0085),
            h = j(c + s, o, 2, 0.048, 0.015, 26) * 0.85;
          ((l =
            0.5 *
            (1 + e * 0.5 + t * 1.2 + a * 0.24 + (n - 0.5) * 0.12 + m * 0.3) *
            (1 - r * 0.2) *
            (1 - i * 0.14) *
            (1 - p * 0.5) *
            (1 + h * 0.34)),
            (u =
              0.5 + e * 0.2 - a * 0.18 - n * 0.08 - h * 0.12 + (p + r) * 0.12),
            (d = a * 0.55 + S(8, c, o, 7, 3) * 0.4),
            (f = 0.5 + e * 0.6 + t * 0.9 + a * 0.15 + h * 0.2));
          break;
        }
        case `cloth`: {
          let e = C(2, c + (C(1, c, o, 2, 2, 2) - 0.5) * 0.12, o, 7, 1, 3),
            t = D(0.42, 0.22, e),
            n = D(0.58, 0.8, e),
            r = (S(4, c, o, 2, 2) - 0.5) * 0.14,
            i = Math.cos((c + r) * Math.PI * 4),
            p = (i * 0.5 + 0.5 - 0.5) * 2,
            m = (1 - D(0, 0.3, Math.abs(i))) * 0.7,
            h = (S(6, c + (e - 0.5) * 0.08, o, 2, 3) - 0.5) * 1.6,
            g = (C(9, c, o, 1, 3, 2) - 0.5) * 0.05,
            _ = A(o + (C(11, c, o, 3, 1, 2) - 0.5) * 0.05, 1, 0.09, 0.016),
            v = k(c + g, 4, 0.11, 0.009),
            y = Math.max(
              j(c + g, o, 4, 0.072, 0.012, 26),
              j(c + g, o, 4, 0.148, 0.011, 26) * 0.8,
              M(
                c,
                o + (C(11, c, o, 3, 1, 2) - 0.5) * 0.05,
                1,
                0.128,
                0.013,
                26,
              ) * 0.7,
            ),
            b = 0.5 + 0.5 * Math.cos(c * Math.PI * 2 * 48),
            x = 0.5 + 0.5 * Math.cos(o * Math.PI * 2 * 48),
            w = (((s >> 1) + (a >> 1)) & 1 ? 1 : -1) * 0.5 + 0.5,
            T = C(5, c, o, 16, 2, 2),
            E = S(8, c, o, 3, 3);
          ((l =
            0.5 *
            (1 -
              t * 0.42 +
              n * 0.2 +
              p * 0.22 +
              h * 0.3 +
              (w - 0.5) * 0.045 +
              (b - x) * 0.055 +
              (T - 0.5) * 0.16 +
              (E - 0.5) * 0.18 +
              y * 0.2) *
            (1 - _ * 0.26) *
            (1 - v * 0.34) *
            (1 - m * 0.16)),
            (u = 0.5 + t * 0.08 - n * 0.05 - y * 0.1 + (_ + v) * 0.1),
            (d = S(10, c, o, 6, 3) * 0.6 + n * 0.3 + (_ + v) * 0.2),
            (f =
              0.5 -
              t * 0.35 +
              n * 0.25 +
              p * 0.3 +
              (E - 0.5) * 0.3 +
              y * 0.18));
          break;
        }
        case `twill`: {
          let e = (S(4, c, o, 2, 2) - 0.5) * 0.14,
            t = Math.cos((c + e) * Math.PI * 4),
            n = S(2, c, o, 3, 2),
            r = (S(6, c + (n - 0.5) * 0.06, o, 2, 3) - 0.5) * 1.6,
            i =
              (0.5 + 0.5 * Math.cos((c + o) * Math.PI * 2 * 10)) *
              (0.72 +
                0.28 * (0.5 + 0.5 * Math.cos((c - o) * Math.PI * 2 * 40))),
            a = (C(9, c, o, 1, 3, 2) - 0.5) * 0.05,
            s = A(o + (C(11, c, o, 3, 1, 2) - 0.5) * 0.05, 1, 0.09, 0.016),
            p = k(c + a, 4, 0.11, 0.009),
            m = Math.max(
              j(c + a, o, 4, 0.072, 0.012, 26),
              M(
                c,
                o + (C(11, c, o, 3, 1, 2) - 0.5) * 0.05,
                1,
                0.128,
                0.013,
                26,
              ) * 0.7,
            ),
            h = S(8, c, o, 3, 3);
          ((l =
            0.5 *
            (1 +
              t * 0.2 +
              (n - 0.5) * 0.34 +
              r * 0.32 +
              (i - 0.5) * 0.2 +
              (h - 0.5) * 0.14 +
              m * 0.2) *
            (1 - s * 0.26) *
            (1 - p * 0.34)),
            (u = 0.5 + (0.5 - i) * 0.1 - m * 0.1 + (s + p) * 0.1),
            (d = i * 0.45 + S(10, c, o, 6, 3) * 0.3 + (s + p) * 0.2),
            (f =
              0.5 + t * 0.15 + (n - 0.5) * 0.3 + (h - 0.5) * 0.3 + m * 0.18));
          break;
        }
        case `hair`: {
          let e = (C(1, c, o, 2, 2, 2) - 0.5) * 0.25,
            t = C(2, c + e, o, 12, 1, 2),
            n = C(4, c + e, o, 96, 2, 1),
            r = C(6, c + e * 1.6, o, 3, 1, 2),
            i = D(0.25, 0.75, t),
            a = 1 - D(0.18, 0.36, t),
            s = 1 - D(0.22, 0.5, r);
          ((l =
            0.5 *
            (0.62 + 0.7 * i + (r - 0.5) * 0.34 + (n - 0.5) * 0.36) *
            (1 - a * 0.4) *
            (1 - s * 0.22)),
            (u = 0.5 - i * 0.2),
            (d = D(0.6, 0.9, t) * (0.6 + n * 0.4)),
            (f = 0.5 + (i - 0.5) * 0.5 + (r - 0.5) * 0.4));
          break;
        }
        case `skin`: {
          let e = S(1, c, o, 3, 3),
            t = S(4, c, o, 8, 3),
            n = S(3, c, o, 2, 2),
            r = D(0.5, 0.88, x(6, 64, c * 64, o * 64)),
            i = D(0.84, 0.95, x(9, 34, c * 34 + 7, o * 34));
          ((l =
            0.5 *
            (1 +
              Math.max(
                -0.17,
                Math.min(0.17, (e - 0.5) * 1.5 + (t - 0.5) * 0.62),
              ) *
                1 -
              i * 0.16 -
              r * 0.05)),
            (u = 0.5 + (t - 0.5) * 0.35 + r * 0.14 - i * 0.08),
            (d = S(8, c, o, 6, 2) * 0.6 + i * 0.4),
            (f = 0.5 + (n - 0.5) * 1.15 + (e - 0.5) * 0.45 + i * 0.15));
          break;
        }
        case `fur`: {
          let e = (S(1, c, o, 4, 2) - 0.5) * 0.08,
            t = C(2, c + e, o, 24, 6, 2),
            n = (o * 6 + x(3, 24, c * 24, 0.5) * 3) % 1,
            r = C(5, c + e, o, 3, 2, 2),
            i = (S(8, c + (r - 0.5) * 0.1, o, 3, 2) - 0.5) * 1.6;
          ((l =
            0.5 *
            (0.6 +
              0.75 * D(0.3, 0.75, t) * (0.55 + n * 0.45) +
              (r - 0.5) * 0.55 +
              i * 0.34)),
            (u = 0.6),
            (d = n * t),
            (f = 0.5 + (t - 0.5) * 0.5 + (r - 0.5) * 0.35));
          break;
        }
        case `wood`: {
          let e = C(1, c, o, 14, 1, 3) + S(2, c, o, 3, 2) * 0.6,
            t = 1 - D(0, 0.18, Math.abs(((e * 5) % 1) - 0.5)),
            n = 1 - D(0, 0.24, Math.abs(((e * 13) % 1) - 0.5)),
            r = 1 - D(0, 0.06, Math.hypot(c - 0.35, (o - 0.6) * 0.5)),
            i = k(c, 3, 0.12, 0.016),
            a = k(c, 3, 0.145, 0.009),
            s = ((Math.floor((c - 0.12) * 3) % 3) + 3) % 3,
            p = (b[0][s * 17 + 5] - 0.5) * 0.8 + (S(7, c, o, 2, 2) - 0.5) * 0.6,
            m = S(11, c, o, 2, 2) - 0.5;
          ((l =
            0.5 *
            (1 +
              (S(4, c, o, 3, 2) - 0.5) * 0.34 +
              p * 0.6 +
              m * 0.42 -
              t * 0.26 -
              n * 0.1 -
              r * 0.3 +
              a * 0.28) *
            (1 - i * 0.42)),
            (u = 0.5 + t * 0.1 + i * 0.12),
            (d = S(6, c, o, 6, 3)),
            (f = 0.5 + t * 0.2));
          break;
        }
        case `coral`: {
          let e = 1 - D(0.08, 0.2, E(1, c, o, 16, 0.8).f1),
            t = D(0, 0.6, E(3, c, o, 6).f1),
            n = E(5, c, o, 3, 0.85),
            r = D(0, 0.5, n.f1),
            i = 1 - D(0, 0.05, n.f2 - n.f1),
            a = 1 - D(0, 0.16, Math.abs(((C(7, c, o, 2, 9, 3) * 6) % 1) - 0.5)),
            s = (S(4, c, o, 3, 2) - 0.5) * 1.5;
          ((l =
            0.5 *
            (1 +
              (0.5 - t) * 0.3 +
              (0.45 - r) * 0.5 +
              s * 0.42 +
              (S(9, c, o, 5, 3) - 0.5) * 0.3 -
              a * 0.14) *
            (1 - e * 0.45) *
            (1 - i * 0.12)),
            (u = 0.5 + e * 0.2 + i * 0.12),
            (d = 1 - t),
            (f = 0.5 + (0.5 - t) * 0.6 + (0.45 - r) * 0.5));
          break;
        }
        case `hide`: {
          let e = S(1, c, o, 3, 3) - 0.5,
            t = S(4, c, o, 8, 2) - 0.5,
            n = S(0, c, o, 2, 2) - 0.5,
            r = 1 - D(0.12, 0.6, E(3, c + t * 0.04, o, 30, 0.8).f1),
            i = D(0.64, 0.8, S(9, c, o, 6, 2)),
            a = D(0.72, 0.85, x(8, 32, c * 32, o * 32));
          ((l =
            0.5 *
            (1 +
              e * 0.6 +
              t * 0.2 +
              n * 0.9 +
              (r - 0.5) * 0.12 -
              i * 0.2 +
              a * 0.16)),
            (u = 0.5 - r * 0.1 + i * 0.08 - a * 0.1),
            (d = (t + 0.5) * 0.6 + a * 0.4),
            (f = 0.5 + e * 0.9 + n * 0.6 - i * 0.3));
          break;
        }
        case `gem`: {
          let e = E(1, c, o, 3),
            t = E(4, c, o, 7),
            n = b[3][e.id] - 0.5,
            r = b[5][t.id] - 0.5;
          ((l =
            0.5 *
            (1 +
              n * 0.85 +
              r * 0.4 +
              (e.f2 - e.f1) * 0.6 +
              (t.f2 - t.f1) * 0.35)),
            (u = 0.4),
            (d = 0.5 + (e.f2 - e.f1) * 0.4),
            (f = 0.5 + n * 0.5));
          break;
        }
      }
      let p = r + (a * t + s) * 4;
      ((n[p] = O(l)), (n[p + 1] = O(u)), (n[p + 2] = O(d)), (n[p + 3] = O(f)));
    }
  }
}
var P = [
    {
      key: `metal`,
      url: new URL(
        new URL(`metal-detail-BjAvdG3j.jpg`, import.meta.url).href,
        `` + import.meta.url,
      ).href,
    },
    {
      key: `leather`,
      url: new URL(
        new URL(`leather-detail-CZAFz4Fq.jpg`, import.meta.url).href,
        `` + import.meta.url,
      ).href,
    },
    {
      key: `linen`,
      url: new URL(
        new URL(`linen-detail-CRbFgdTQ.jpg`, import.meta.url).href,
        `` + import.meta.url,
      ).href,
    },
    {
      key: `denim`,
      url: new URL(
        new URL(`denim-detail-DuYcfp5b.jpg`, import.meta.url).href,
        `` + import.meta.url,
      ).href,
    },
    {
      key: `grain`,
      url: new URL(
        new URL(`grain-detail-B6x3svJU.jpg`, import.meta.url).href,
        `` + import.meta.url,
      ).href,
    },
  ],
  F = null;
function I() {
  if (F) return F;
  let e = P.length,
    t = new Uint8Array(262144 * e * 4).fill(128),
    a = new i(t, 512, 512, e);
  return (
    (a.format = n),
    (a.type = r),
    (a.colorSpace = ``),
    (a.wrapS = a.wrapT = l),
    (a.magFilter = s),
    (a.minFilter = d),
    (a.generateMipmaps = !0),
    (a.anisotropy = 8),
    (a.needsUpdate = !0),
    (F = { texture: a, loaded: 0, failed: 0, total: e }),
    typeof document < `u` && typeof Image < `u` && L(F, t, 512),
    F
  );
}
function L(e, n, r) {
  let i = new t(),
    a = document.createElement(`canvas`);
  a.width = a.height = r;
  let o = a.getContext(`2d`, { willReadFrequently: !0 }),
    s = () => {
      F === e &&
        e.loaded + e.failed === e.total &&
        e.loaded > 0 &&
        (e.texture.needsUpdate = !0);
    };
  P.forEach((t, a) => {
    i.load(
      t.url,
      (t) => {
        if (F !== e) {
          t.dispose();
          return;
        }
        try {
          (o.clearRect(0, 0, r, r), o.drawImage(t.image, 0, 0, r, r));
          let i = o.getImageData(0, 0, r, r).data,
            s = a * r * r * 4;
          for (let e = 0; e < r * r; e++) {
            let t = e * 4,
              r = s + t;
            ((n[r] = i[t]),
              (n[r + 1] = i[t + 1]),
              (n[r + 2] = i[t + 2]),
              (n[r + 3] = 255));
          }
          e.loaded++;
        } catch {
          e.failed++;
        }
        (t.dispose(), s());
      },
      void 0,
      () => {
        (e.failed++, s());
      },
    );
  });
}
function R() {
  F &&= (F.texture.dispose(), null);
}
var z = null;
function B() {
  return (
    z ||
    ((z = {
      detail: v().texture,
      cc0: I().texture,
      env: H(),
      glow: U(128, `glow`),
      blob: U(128, `blob`),
      trail: W(),
    }),
    z)
  );
}
function V() {
  if (z) {
    for (let e of [`env`, `glow`, `blob`, `trail`]) z[e] && z[e].dispose();
    z = null;
  }
  (_(), R());
}
function H() {
  let t = document.createElement(`canvas`);
  ((t.width = 256), (t.height = 128));
  let n = t.getContext(`2d`),
    r = n.createLinearGradient(0, 0, 0, 128);
  (r.addColorStop(0, `#6f86a8`),
    r.addColorStop(0.3, `#a9bdd6`),
    r.addColorStop(0.48, `#e8dcc2`),
    r.addColorStop(0.53, `#7d7658`),
    r.addColorStop(0.72, `#3a4030`),
    r.addColorStop(1, `#1b1f18`),
    (n.fillStyle = r),
    n.fillRect(0, 0, 256, 128));
  let i = n.createRadialGradient(70, 30, 0, 70, 30, 40);
  (i.addColorStop(0, `rgba(255,248,225,0.9)`),
    i.addColorStop(1, `rgba(255,240,200,0)`),
    (n.fillStyle = i),
    n.fillRect(0, 0, 256, 128));
  let a = new f(t);
  return ((a.mapping = 303), (a.colorSpace = e), a);
}
function U(e, t) {
  let n = document.createElement(`canvas`);
  n.width = n.height = e;
  let r = n.getContext(`2d`),
    i = e / 2,
    a = r.createRadialGradient(i, i, 0, i, i, i);
  (t === `glow`
    ? (a.addColorStop(0, `rgba(255,255,255,1)`),
      a.addColorStop(0.18, `rgba(255,255,255,0.75)`),
      a.addColorStop(0.45, `rgba(255,255,255,0.22)`),
      a.addColorStop(1, `rgba(255,255,255,0)`))
    : (a.addColorStop(0, `rgba(255,255,255,0.95)`),
      a.addColorStop(0.45, `rgba(255,255,255,0.7)`),
      a.addColorStop(0.8, `rgba(255,255,255,0.18)`),
      a.addColorStop(1, `rgba(255,255,255,0)`)),
    (r.fillStyle = a),
    r.fillRect(0, 0, e, e));
  let o = new f(n);
  return ((o.colorSpace = ``), o);
}
function W() {
  let e = document.createElement(`canvas`);
  ((e.width = 128), (e.height = 64));
  let t = e.getContext(`2d`),
    n = t.createImageData(128, 64);
  for (let e = 0; e < 64; e++)
    for (let t = 0; t < 128; t++) {
      let r = t / 127,
        i = e / 63,
        a = (1 - r) ** 1.4 * Math.min(1, r * 14 + 0.25),
        o = i ** 1.6 * (1 - (Math.max(0, i - 0.9) / 0.1) ** 2),
        s = Math.exp(-(((i - 0.9) / 0.045) ** 2)) * (1 - r) ** 2.2,
        c = Math.min(1, a * o * 0.75 + s * 0.9),
        l = (e * 128 + t) * 4;
      ((n.data[l] = 255),
        (n.data[l + 1] = 255),
        (n.data[l + 2] = 255),
        (n.data[l + 3] = Math.round(c * 255)));
    }
  t.putImageData(n, 0, 0);
  let r = new f(e);
  return ((r.colorSpace = ``), r);
}
var G = `
attribute vec4 aMat; attribute vec3 aEmit; attribute vec2 aUV; attribute vec4 aPaint; attribute float aSeam; attribute vec2 aTri;
varying vec4 vMat; varying vec3 vEmit; varying vec3 vObjPos; varying vec2 vUVw; varying vec4 vPaint; varying vec3 vWN; varying float vSeam; varying float vWorldY;
varying vec2 vTri; varying vec3 vON;
`,
  K =
    `
varying vec4 vMat; varying vec3 vEmit; varying vec3 vObjPos; varying vec2 vUVw; varying vec4 vPaint; varying vec3 vWN; varying float vSeam; varying float vWorldY;
varying vec2 vTri; varying vec3 vON;
uniform highp sampler2DArray uDetail; uniform highp sampler2DArray uCC0; uniform float uWetY; uniform vec3 uTeamColor; uniform float uFlash;
uniform float uDissolve; uniform vec3 uDissolveColor; uniform float uOpacity; uniform float uRecall; uniform vec3 uElemColor;
uniform float uTime; uniform float uHeight; uniform float uEmitBoost; uniform float uDesat; uniform float uRimK;
// TRIPLANAR sampling of the painted library for parts whose UVs are a planar projection (extrudes, patches, plates):
// a planar projection is only correct for the faces parallel to its plane and collapses to zero UV area — infinite
// texel stretch — on every face perpendicular to it. Model-space triplanar has constant texel density by construction,
// so the same crackle reads at the same size on a pauldron dome, a chest slab and a thigh guard. The blend normal is
// the BIND-POSE object normal (vON), never the animated world normal: mixing an animated normal with a bind-pose
// position would make the texture swim across the surface every time the champion turns.
vec4 champTex(vec2 uv, vec3 tp, vec3 tw, float layer) {
  if (vTri.x < 0.5) return texture(uDetail, vec3(uv, layer));
  return texture(uDetail, vec3(tp.zy, layer)) * tw.x
       + texture(uDetail, vec3(tp.xz, layer)) * tw.y
       + texture(uDetail, vec3(tp.xy, layer)) * tw.z;
}
// round 5: photographed CC0 micro-detail (cc0.js), same UV / triplanar routing as champTex, its own sampler + scale
vec4 champCC0(vec2 uv, vec3 tp, vec3 tw, float layer) {
  if (vTri.x < 0.5) return texture(uCC0, vec3(uv, layer));
  return texture(uCC0, vec3(tp.zy, layer)) * tw.x + texture(uCC0, vec3(tp.xz, layer)) * tw.y + texture(uCC0, vec3(tp.xy, layer)) * tw.z;
}
` + m,
  q = {
    uRimColor: { value: new o(1, 0.9, 0.76) },
    uRimStrength: { value: 0.8 },
    uRimDir: { value: new o(-0.6, 0, -0.36).normalize() },
  };
function J({
  height: e = 2.2,
  element: t = `#ffffff`,
  team: n = `#3aa6ff`,
  pipeline: r = null,
  rimDir: i = null,
  rimColor: o = null,
  rimStrength: s = null,
  wetY: c = -1e6,
} = {}) {
  let l = B(),
    d = r && r.uniforms && r.uniforms.uRimColor ? r.uniforms : null,
    f = {
      uDetail: { value: l.detail },
      uCC0: { value: l.cc0 },
      uTeamColor: { value: new a(n) },
      uFlash: { value: 0 },
      uDissolve: { value: 0 },
      uDissolveColor: { value: new a(t).multiplyScalar(1.6) },
      uOpacity: { value: 1 },
      uRecall: { value: 0 },
      uElemColor: { value: new a(t) },
      uTime: { value: 0 },
      uHeight: { value: e },
      uEmitBoost: { value: 1 },
      uDesat: { value: 0 },
      uRimK: { value: 1 },
      uWetY: { value: c },
      uRimColor: d ? d.uRimColor : o ? { value: o.clone() } : q.uRimColor,
      uRimStrength: d
        ? d.uRimStrength
        : s == null
          ? q.uRimStrength
          : { value: s },
      uRimDir: d ? d.uRimDir : i ? { value: i.clone().normalize() } : q.uRimDir,
    },
    m = new u({
      vertexColors: !0,
      roughness: 1,
      metalness: 1,
      envMapIntensity: 1.25,
    });
  return (
    (m.userData.uniforms = f),
    (m.onBeforeCompile = (e) => {
      (Object.assign(e.uniforms, f),
        (e.vertexShader = e.vertexShader
          .replace(
            `#include <common>`,
            `#include <common>
` + G,
          )
          .replace(
            `#include <color_vertex>`,
            `#include <color_vertex>
  vMat = aMat; vEmit = aEmit; vObjPos = position; vUVw = aUV; vPaint = aPaint; vSeam = aSeam; vTri = aTri;`,
          )
          .replace(
            `#include <beginnormal_vertex>`,
            `#include <beginnormal_vertex>
  vON = objectNormal;`,
          )
          .replace(
            `#include <defaultnormal_vertex>`,
            `#include <defaultnormal_vertex>
  vWN = inverseTransformDirection(transformedNormal, viewMatrix);`,
          )
          .replace(
            `#include <project_vertex>`,
            `  vWorldY = (modelMatrix * vec4(transformed, 1.0)).y;
#include <project_vertex>`,
          )),
        (e.fragmentShader = e.fragmentShader
          .replace(
            `#include <common>`,
            `#include <common>
` + K,
          )
          .replace(
            `#include <color_fragment>`,
            `#include <color_fragment>
  // ---- painted material library: kind = floor(aMat.w) (see geo.js TEX), strength = fract·1.25
  // Three scales of the SAME material layer are mixed so the painting survives mip-down at gameplay distance: fine (one
  // TILE), mid (≈2 TILE) and large (≈4 TILE). The large scales carry MORE weight than the fine one, because at 56°
  // gameplay framing a champion is ≈100–200 px tall and everything finer than ≈4 px averages away.
  // Round 3: the LARGE sample used to be hard-wired to layer 0 ('paint'), so the biggest visible detail frequency on
  // stone, metal, leather, cloth, hair, skin and coral was the same soft vertical smear — the one thing the critic could
  // see on every surface. It now samples the part's own kind (each layer carries 2–3 large plate / fold features per
  // tile for exactly this sample), and layer 0 stays only as a low-weight cross-material breakup so two parts of the
  // same material never land in perfect lockstep.
  float kindF = floor(vMat.w + 0.001); float det = fract(vMat.w + 0.001) * 1.25;
  float isMetal = 1.0 - step(0.5, abs(kindF - 2.0));
  vec2 tuv = vUVw / ${p.toFixed(3)};
  vec3 tpo = (vObjPos + vec3(vTri.y)) / ${p.toFixed(3)};
  vec3 tnw = abs(normalize(vON)); tnw *= tnw; tnw *= tnw; tnw /= (tnw.x + tnw.y + tnw.z + 1e-5);
  vec4 D = champTex(tuv, tpo, tnw, kindF);
  vec4 Dm = champTex(tuv * 0.47 + vec2(0.31, 0.07), tpo * 0.47, tnw, kindF);
  vec4 Dl = champTex(tuv * 0.19 + vec2(0.17, 0.53), tpo * 0.19, tnw, kindF);
  vec4 Dp = champTex(tuv * 0.11 + vec2(0.63, 0.21), tpo * 0.11, tnw, 0.0);
  // Round 3 (director): "the painted library is invisible at play scale … push the largest material band to +-25 %
  // value". The LARGE sample is the only band a 100-200 px champion resolves, so it carries ~1.7x the weight it did.
  float val = (1.0 + (D.r * 2.0 - 1.0) * det * 1.3)
            * (1.0 + (Dm.r * 2.0 - 1.0) * (0.40 + 0.78 * det))
            * (1.0 + (Dl.r * 2.0 - 1.0) * (0.48 + 1.08 * det))
            * (1.0 + (Dp.r * 2.0 - 1.0) * 0.26);
  // ---- painted RELIEF. Everything the library draws — stitch rows, rivets, panel lines, plate breaks, hide plates —
  // was flat albedo: it could only ever darken a pixel, never catch the key light. That is the largest remaining
  // difference between this and the reference at close range, where a Wild Rift character's seams and rivets are lit
  // from one side and shadowed on the other. bumpH is a height field built from the FINE and MID samples only (the
  // large sample is silhouette-scale value, not relief) and applied as a surface-gradient perturbation of the shading
  // normal below. It costs no extra texture fetch, and because the derivative of a mipped sample collapses with
  // distance it fades out on its own exactly where it would start to alias — crisp at the victory close-up, gone at
  // gameplay framing.
  float bumpH = (D.r - 0.5) * (0.45 + 0.55 * det) + (Dm.r - 0.5) * 0.55;
  // ---- round 5: per-material CC0 micro-detail (fabric weave, leather pebble grain, scratched plate steel, skin/hide
  // grain). Layer and world-unit tile size per kind; all other kinds weigh 0. Neutral (0.5) until the images load and
  // mip-averages to neutral at gameplay distance, so it only adds the surface truth the close-ups were missing.
  // kinds: 2 metal, 3 leather, 4 cloth, 12 twill, 6 skin, 11 hide
  float ccL = kindF < 2.5 && kindF > 1.5 ? 0.0 : abs(kindF - 3.0) < 0.5 ? 1.0 : abs(kindF - 4.0) < 0.5 ? 2.0 : abs(kindF - 12.0) < 0.5 ? 3.0 : (abs(kindF - 6.0) < 0.5 || abs(kindF - 11.0) < 0.5) ? 4.0 : -1.0;
  float ccS = ccL < 0.5 ? 0.34 : ccL < 1.5 ? 0.2 : ccL < 2.5 ? 0.13 : ccL < 3.5 ? 0.17 : abs(kindF - 11.0) < 0.5 ? 0.26 : 0.1;
  vec4 CC = ccL < -0.5 ? vec4(0.5) : champCC0(vUVw / ccS + vec2(0.37, 0.11), (vObjPos + vec3(vTri.y)) / ccS, tnw, max(ccL, 0.0));
  // value / roughness / height weights: [metal, leather, cloth, twill, skin|hide]
  float ccV = ccL < -0.5 ? 0.0 : ccL < 0.5 ? 0.42 : ccL < 1.5 ? 0.5 : ccL < 2.5 ? 0.62 : ccL < 3.5 ? 0.66 : abs(kindF - 11.0) < 0.5 ? 0.4 : 0.1;
  float ccH = ccL < -0.5 ? 0.0 : ccL < 0.5 ? 0.9 : ccL < 1.5 ? 1.3 : ccL < 3.5 ? 2.2 : abs(kindF - 11.0) < 0.5 ? 1.2 : 1.1;
  float ccRough = (CC.g - 0.5) * (ccL < 0.5 ? 0.55 : 0.3) * step(-0.5, ccL);
  diffuseColor.rgb *= 1.0 + (CC.r - 0.5) * ccV;
  bumpH += (CC.b - 0.5) * ccH;
  float hue = (D.a - 0.5) * det * 0.9 + (Dm.a - 0.5) * 0.5 + (Dl.a - 0.5) * 0.45 + (Dp.a - 0.5) * 0.3;
  vec3 tint = hue > 0.0 ? vec3(1.1, 1.0, 0.84) : vec3(0.87, 0.96, 1.12);
  diffuseColor.rgb *= val * mix(vec3(1.0), tint, min(1.0, abs(hue) * 1.9));
  // ---- faction trim: TINT, never replace. The round-2 code did a full mix to uTeamColor after every painted term had
  // been computed, so the trim threw away the baked value ramp, the painted light, the crest strokes, the ink seams and
  // the wear — it read as a plastic sticker. Here the team hue is driven by the luminance the paint has already built,
  // and the mix happens BEFORE the painted light / crest / ink / wear lines, so all of that still draws on top of it.
  // The multiplier is CLAMPED: round 2's bands were authored on white, so tLum entering the tint was ≈0.95, the
  // multiplier hit 1.46 and the band clipped through the filmic curve into a flat white→cyan blob with no gradient and
  // no seam accent. Bands are now authored at a mid value (luma ≈0.5) and the highlight is built by the wash / crest /
  // rim terms below, on top of the tint, instead of by the tint itself.
  float tLum = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
  diffuseColor.rgb = mix(diffuseColor.rgb, uTeamColor * min(1.05, 0.34 + 1.18 * tLum), clamp(vMat.z, 0.0, 1.0));
  vec3 champN = normalize(vWN);
  // hand-painted light: warm lit top planes, cool shaded undersides (follows the animated pose)
  // Round-3 critic: "our 5th-percentile luminance is 0.063-0.083 against WR's 0.120-0.156, so our shadow side crushes
  // toward black and the lower half of each champion reads as a hole at gameplay size". The painted UNDERSIDE was the
  // largest single contributor: it multiplied the albedo by 0.62 before the light even ran. It keeps its cool hue
  // shift (that is the split-tone) but loses most of its value cut; the bounce floor below does the rest.
  float upK = smoothstep(-0.65, 0.95, champN.y);
  diffuseColor.rgb *= mix(vec3(0.78, 0.82, 0.99), vec3(1.2, 1.12, 0.99), upK);
  // painted crest highlights: forms facing the painted key (upper-left-front) get lighter, brushy strokes. A broad wash
  // carries the shape at distance; the stroke-broken core sits on top of it.
  float toKey = dot(champN, normalize(vec3(-0.45, 0.8, 0.42)));
  float wash = smoothstep(0.18, 0.86, toKey);
  float crest = smoothstep(0.55, 0.95, toKey) * smoothstep(0.24, 0.62, Dm.b * 0.6 + Dp.b * 0.6);
  diffuseColor.rgb *= 1.0 + wash * 0.2 * (1.0 - isMetal);
  diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 1.42 + vec3(0.03, 0.027, 0.019), crest * 0.7 * (1.0 - isMetal));
  // painted metal: dark base, a bright banded sweep and a narrow anisotropic stripe in VIEW space (matcap-like), so gold
  // and steel read as banded painted metal rather than glossy plastic
  vec3 champNV = normalize(mat3(viewMatrix) * champN);
  float mBand = exp(-pow((champNV.y - 0.42) / 0.22, 2.0));
  float mStripe = exp(-pow((champNV.y - 0.6) / 0.055, 2.0));
  float mSide = exp(-pow((champNV.x + 0.45) / 0.25, 2.0)) * smoothstep(-0.5, 0.3, champNV.y), mLow = smoothstep(0.1, -0.8, champNV.y);
  diffuseColor.rgb *= mix(1.0, 0.4 + 1.12 * mBand + 0.55 * mStripe + 0.34 * mSide - 0.3 * mLow + (Dm.r - 0.5) * 0.45, isMetal);
  // painted edge wear on convex rims (chipped by the wear mask) + cavity grime in creases
  float wear = smoothstep(0.2, 0.6, vPaint.x * 1.35 + (Dm.b - 0.5) * 0.6 + (Dp.b - 0.5) * 0.4) * min(1.0, det + 0.3);
  vec3 lit = diffuseColor.rgb * 1.8 + vec3(0.04, 0.035, 0.025);
  diffuseColor.rgb = mix(diffuseColor.rgb, min(lit, vec3(1.0)), wear * 0.8);
  diffuseColor.rgb *= 1.0 - smoothstep(0.0, 0.7, vPaint.y) * 0.72;
  // ink accents along part seams and open edges (painted line work): a tight dark core with a soft shoulder, and — the
  // half of the pair that actually sells hand-painted art — a lighter "lip" stroke on the up-facing side of the line
  float sCore = smoothstep(0.30, 0.72, vSeam), sWide = smoothstep(0.04, 0.44, vSeam);
  float ink = (0.76 * sCore + 0.24 * sWide) * (0.78 + 0.22 * D.g);
  diffuseColor.rgb *= mix(vec3(1.0), vec3(0.22, 0.19, 0.26), ink * 0.95);
  // The lighter "lip" of the ink pair only lifts on genuinely up-facing NON-metal surfaces, and backs off where the base
  // is already near white — otherwise it detached into hard white chips on Sable's hood rim, cuffs and cloak trim.
  float lipLum = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
  diffuseColor.rgb *= 1.0 + max(0.0, sWide - sCore) * smoothstep(0.15, 0.85, champN.y) * (1.0 - isMetal)
                      * (1.0 - 0.65 * smoothstep(0.5, 0.82, lipLum)) * 0.3;
  // ---- CHROMA (round-3 critic, measured on exact silhouette masks): ours 0.295-0.418 mean saturation against four
  // hand-placed boxes on the Wild Rift reference at 0.418-0.594 — and those boxes include ground pixels, so they are
  // diluted DOWNWARD. DESIGN §4 asks for "saturated but controlled colour". This is a luminance-PRESERVING chroma
  // expansion in the albedo path (never exposure, which would lift the terrain too): the value ladder every champion
  // was built around is untouched, only the distance from grey grows. Neutral greys stay neutral by construction —
  // that is why the stone/steel families were also re-hued per champion rather than left to this term.
  float chLum = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
  diffuseColor.rgb = max(vec3(0.0), mix(vec3(chLum), diffuseColor.rgb, 1.45));
  // ---- wading: wet darkening + a waterline band (uWetY = the river surface in world height; -1e6 = dry)
  float wetK = smoothstep(uWetY + 0.03, uWetY - 0.04, vWorldY);
  float wetLine = exp(-pow((vWorldY - uWetY) / 0.028, 2.0));
  diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.44, 0.52, 0.58), wetK * 0.85);
  diffuseColor.rgb += vec3(0.05, 0.08, 0.085) * wetLine * 0.7;
  float roughMod = (D.g - 0.5) * 0.7 * det - wear * 0.14 - wetK * 0.42 + ccRough;
  float dval = texture(uDetail, vec3(vObjPos.xz * 1.9 + vObjPos.y * 0.8, 0.0)).b * 0.6 + clamp(1.0 - vObjPos.y / uHeight, 0.0, 1.0) * 0.4;
  if (uDissolve > 0.0 && dval < uDissolve) discard;
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(dot(diffuseColor.rgb, vec3(0.3, 0.55, 0.15))), uDesat);
  // ---- BRUSH GHOST (uOpacity < 1; only the translucent twin is ever drawn in that state).
  // Round-3 critic: at 0.5 alpha "the result is a flat pale-blue wash with almost no internal value structure — the
  // champion stops reading as a character and reads as a rendering fault" (measured: silhouette mean luminance 77.5 →
  // 94.3 while the silhouette AREA fell 57k → 38k px as the internal detail washed out). Wild Rift keeps an ally in
  // brush fully readable. So the body stays essentially OPAQUE and keeps its albedo and its whole value ladder; what
  // says "in brush" is a −34 % saturation, a scrolling leaf dapple over the surface and a team-coloured fresnel edge
  // (added to emissive below). Only the grazing rim goes see-through, which is what reads as foliage in front of a body.
  float ghost = 1.0 - step(0.999, uOpacity);
  if (ghost > 0.5) {
    float gLum = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(gLum), 0.34);
    vec2 lf = vObjPos.xz * 2.3 + vObjPos.y * 0.7 + vec2(uTime * 0.06, uTime * 0.035);
    float leaf = texture(uDetail, vec3(lf, 7.0)).r;                       // fur layer = soft clumped blobs
    diffuseColor.rgb *= 0.86 + 0.42 * leaf;
    // ⚠ only a light grazing fade. At 0.45 the outline itself fell below the background-difference threshold in the
    // measurement, i.e. the champion was literally losing silhouette AREA in brush — the defect being fixed.
    float gf = pow(1.0 - clamp(abs(dot(champNV, normalize(vViewPosition))), 0.0, 1.0), 2.0);
    diffuseColor.a *= 1.0 - 0.20 * gf;
  }`,
          )
          .replace(
            `#include <roughnessmap_fragment>`,
            `float roughnessFactor = mix(clamp(vMat.x + roughMod, 0.06, 1.0), clamp(vMat.x + roughMod * 0.5, 0.36, 0.55), isMetal);`,
          )
          .replace(
            `#include <metalnessmap_fragment>`,
            `float metalnessFactor = vMat.y * mix(1.0, 0.82, isMetal);`,
          )
          .replace(
            `#include <normal_fragment_maps>`,
            `#include <normal_fragment_maps>
  {
    // hard materials take the full relief, cloth and skin almost none (a rivet on a pauldron, a pore on a cheek)
    float kindB = floor(vMat.w + 0.001);
    float bumpK = (abs(kindB - 2.0) < 0.5 || abs(kindB - 1.0) < 0.5) ? 1.0            // metal, stone
                : (abs(kindB - 6.0) < 0.5) ? 0.22                                     // skin
                : (abs(kindB - 11.0) < 0.5) ? 0.3                                     // hide (r4 c3: fine scales, no mosaic)
                : (abs(kindB - 4.0) < 0.5 || abs(kindB - 12.0) < 0.5) ? 0.45 : 0.75;  // cloth/twill : everything else
    // The height must be in WORLD UNITS, not in library value: a stitch stands ≈3 mm off the leather. Round 4's first
    // attempt fed the raw ±0.5 value straight in, i.e. ±27 cm of relief on a 2.2 m champion, and every surface
    // shattered into static. 0.0035 u is the amplitude of the real feature the library is drawing.
    float bhw = bumpH * 0.0035 * bumpK;
    vec3 bp = -vViewPosition;
    vec3 bdx = dFdx(bp), bdy = dFdy(bp);
    float bhx = dFdx(bhw), bhy = dFdy(bhw);
    vec3 bR1 = cross(bdy, normal), bR2 = cross(normal, bdx);
    float bDet = dot(bdx, bR1);
    vec3 bGrad = sign(bDet) * (bhx * bR1 + bhy * bR2);
    normal = normalize(abs(bDet) * normal - bGrad);
  }`,
          )
          .replace(
            `#include <emissivemap_fragment>`,
            `#include <emissivemap_fragment>
  vec3 champVV = normalize(vViewPosition);
  float champF = pow(1.0 - clamp(dot(normal, champVV), 0.0, 1.0), 3.0);
  vec3 champWN = normalize((vec4(normal, 0.0) * viewMatrix).xyz);
  vec3 champWV = normalize((vec4(champVV, 0.0) * viewMatrix).xyz);
  float champSpec = vPaint.z;
  totalEmissiveRadiance += vEmit * uEmitBoost * (0.8 + 0.4 * D.b);
  // WARM BOUNCE FLOOR (round-3 chroma/shadow major). A champion in Wild Rift never has a black side: the ground and
  // its own lit planes throw light back up into everything that faces away from the sun. This is an albedo-scaled
  // ambient (so it can never wash out a colour or invent one), weighted toward down- and away-facing surfaces, and
  // two decades under the ≈2.3 bloom knee so nothing here can glow.
  // ⚠ Partly ALBEDO-INDEPENDENT on purpose. Round 3's first attempt scaled the whole term by the albedo, which lifts
  // nothing at all exactly where the problem is: the pixels that crush to black are the ones whose albedo is already
  // near zero (a hood interior, black trousers, an ink seam). Measured, it moved the silhouette's 5th-percentile
  // luminance by ≈0.00. A quarter of the bounce is a flat floor, so a near-black surface still receives light from the
  // ground the way it does in the reference, and a bright surface still takes most of its bounce from its own colour.
  totalEmissiveRadiance += (diffuseColor.rgb * 0.76 + vec3(0.24)) * vec3(1.05, 0.97, 0.86) * (0.05 + 0.125 * smoothstep(0.40, -0.85, champN.y));
  // fake anisotropic metal glint: a narrow painted specular stripe that rides the view-space normal (never bloom-hot)
  totalEmissiveRadiance += isMetal * diffuseColor.rgb * (exp(-pow((champNV.y - 0.52) / 0.06, 2.0)) * 1.15 + exp(-pow((champNV.y - 0.28) / 0.16, 2.0)) * 0.3) * (0.5 + 0.5 * Dm.g) * (1.0 - wear * 0.5);
  // HAIR (kind 5): a narrow anisotropic band. Real hair's highlight is a sharp streak ACROSS the strand direction, not
  // a diffuse sheen — round-5 minor: "no anisotropic highlight; the hair reads as a moulded leather cap". The band is
  // modulated by the library's strand value so it breaks into strands instead of being one glossy stripe.
  float isHair = 1.0 - step(0.5, abs(kindF - 5.0));
  totalEmissiveRadiance += isHair * diffuseColor.rgb * exp(-pow((champNV.y - 0.46) / 0.085, 2.0)) * (0.45 + 0.95 * D.r) * 0.95;
  // MATERIAL CLASS SEPARATION (round-3 major: "metal, cloth, leather and skin all share one soft matte falloff plus a
  // broad pale rim … no anisotropy on brass/gold, no fabric weave, no leather grain, no subsurface"). Metal already had
  // its view-space band + stripe and hair its anisotropic streak; these are the two that were missing. SKIN takes a
  // warm subsurface wrap — thin tissue at a grazing angle passes red light, which is the single cue that separates a
  // face from painted clay. CLOTH takes a cool, coreless fuzz sheen — fabric scatters at the silhouette and never
  // produces a highlight with a centre. LEATHER is deliberately left matte, which is now a difference rather than the
  // default, and its roughness break-up comes from its own library layer.
  float isSkin = 1.0 - step(0.5, abs(kindF - 6.0));
  float isCloth = max(1.0 - step(0.5, abs(kindF - 4.0)), 1.0 - step(0.5, abs(kindF - 12.0)));   // 12 = twill (woven cloth)
  totalEmissiveRadiance += isSkin * diffuseColor.rgb * vec3(1.20, 0.44, 0.32) * champF * 0.45;
  // r4 c3: creature HIDE (Oru) is skin too — the critic read it as "green glass mosaic". It takes a softer, hue-kept
  // subsurface wrap (thin tissue passes its own colour, lifted toward warm) instead of none at all.
  float isHide = 1.0 - step(0.5, abs(kindF - 11.0));
  totalEmissiveRadiance += isHide * diffuseColor.rgb * vec3(0.95, 0.8, 0.62) * champF * 0.35;
  totalEmissiveRadiance += isCloth * diffuseColor.rgb * vec3(0.92, 0.95, 1.06) * pow(champF, 0.72) * 0.22;
  totalEmissiveRadiance += uTeamColor * vMat.z * val * 0.07;
  // the sun-side rim reaches every surface (cloth and skin included, not only shiny ones) — it is what lifts a champion
  // off the terrain at gameplay distance, exactly as in the refs. Team trim is painted cloth now, so it takes the rim
  // like the cloth next to it (round 2 suppressed the rim there, which is half of why the trim read as plastic).
  totalEmissiveRadiance += lookRim(champWN, champWV, diffuseColor.rgb) * uRimK * (0.6 + 0.4 * min(1.0, champSpec));
  totalEmissiveRadiance += uFlash * (0.3 + 1.2 * champF) * vec3(1.0, 0.93, 0.86);
  // team-coloured rim on the brush ghost: a 2-3 px lit edge that says WHOSE ghost this is (see the ghost block above)
  {
    float gh = 1.0 - step(0.999, uOpacity);
    float fres = pow(1.0 - clamp(abs(dot(normalize(champWN), normalize(champWV))), 0.0, 1.0), 2.4);
    totalEmissiveRadiance += uTeamColor * (gh * fres * 1.45 + gh * 0.05);
  }
  if (uDissolve > 0.0) totalEmissiveRadiance += uDissolveColor * (1.0 - smoothstep(0.0, 0.07, dval - uDissolve)) * 5.0;
  totalEmissiveRadiance += uElemColor * uRecall * (0.03 + champF * 0.9 + 0.35 * pow(max(0.0, sin(vObjPos.y * 13.0 - uTime * 4.5)), 8.0));`,
          )
          .replace(
            `#include <aomap_fragment>`,
            `#include <aomap_fragment>
  reflectedLight.directSpecular *= champSpec;
  reflectedLight.indirectSpecular *= champSpec * (0.35 + 0.65 * vPaint.w);`,
          )));
    }),
    (m.customProgramCacheKey = () => `champion-v14`),
    m
  );
}
function Y(e) {
  let t = new u({
    vertexColors: !0,
    roughness: 1,
    metalness: 1,
    envMapIntensity: 1.25,
    transparent: !0,
    depthWrite: !0,
  });
  return (
    (t.userData.uniforms = e.userData.uniforms),
    (t.onBeforeCompile = e.onBeforeCompile),
    (t.customProgramCacheKey = e.customProgramCacheKey),
    t
  );
}
function X() {
  return new c({ colorWrite: !1 });
}
export {
  J as createChampionMaterial,
  V as disposeSharedAssets,
  X as prepassMaterial,
  B as sharedAssets,
  Y as translucentTwin,
};
