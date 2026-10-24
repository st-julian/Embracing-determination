import {
  _ as e,
  a as t,
  c as n,
  f as r,
  h as i,
  i as a,
  l as o,
  s,
  t as c,
  u as l,
} from "./map-oE9sOnNc.js";
var u = -0.12,
  d = 3.55,
  f = 0.5,
  p = 0.85,
  m = 1.15,
  h = (e, t, n) => {
    let r = (n - e) / (t - e);
    return ((r = r < 0 ? 0 : r > 1 ? 1 : r), r * r * (3 - 2 * r));
  },
  g = (e, t) =>
    0.26 * Math.sin(e * 0.43 + 1.3) * Math.cos(t * 0.37 - 0.7) +
    0.2 * Math.sin((e + t) * 0.21 + 0.4) +
    0.12 * Math.sin(e * 0.9 - t * 0.7);
function _(t, n) {
  return h(-0.22, -0.68, (e(t, n + 1.4) - e(t, n - 1.4)) / 2.8);
}
function v(e, t) {
  return 4.05 + g(e, t);
}
var y = l.a.x,
  b = l.a.y,
  x = l.b.x - l.a.x,
  S = l.b.y - l.a.y,
  C = x * x + S * S,
  w = Math.sqrt(C),
  T = [
    { x: l.a.x, y: l.a.y, dx: -x / w, dy: -S / w, ph: 0.4 },
    { x: l.b.x, y: l.b.y, dx: x / w, dy: S / w, ph: 2.1 },
  ],
  E = -0.47;
function D(e, t) {
  let n = 0;
  for (let r = 0; r < T.length; r++) {
    let i = T[r],
      a = e - i.x,
      o = t - i.y,
      s = a * i.dx + o * i.dy;
    if (s < -2.2 || s > 32) continue;
    let c = Math.abs(a * i.dy - o * i.dx);
    if (c > 5) continue;
    let l = 2.35 - s * 0.022 + 0.28 * Math.sin(s * 0.55 + i.ph),
      u = (1 - h(l, l + 1.9, c)) * h(-2.2, 0.8, s);
    u > n && (n = u);
  }
  return n;
}
var O = -8,
  k = 1,
  A = 137,
  j = new Float32Array(37538),
  M = (e, t, n, r, i, a) => {
    let o = i - n,
      s = a - r,
      c = o * o + s * s,
      l = c > 1e-9 ? ((e - n) * o + (t - r) * s) / c : 0;
    l = l < 0 ? 0 : l > 1 ? 1 : l;
    let u = e - (n + o * l),
      d = t - (r + s * l);
    return Math.sqrt(u * u + d * d);
  };
{
  let e = [];
  for (let t of r)
    e.push([
      t.x,
      t.y,
      t.kind === `nexus`
        ? 6.3
        : t.kind === `inhibitor`
          ? 3.7
          : t.tier === 4
            ? 4.1
            : 4,
    ]);
  for (let t of a) e.push([t.x, t.y, 8.5]);
  let n = [];
  for (let e in t) {
    let r = t[e];
    for (let e = 0; e < r.length - 1; e++)
      n.push([r[e].x, r[e].y, r[e + 1].x, r[e + 1].y]);
  }
  for (let t = 0; t < A; t++) {
    let r = O + t * k;
    for (let i = 0; i < A; i++) {
      let a = O + i * k,
        o = (t * A + i) * 2,
        s = 1;
      for (let e = 0; e < c.length; e++) {
        let t = c[e],
          n = Math.hypot(a - t.x, r - t.y),
          i = 1 - h(t.radius + 0.5, t.radius - 6, n);
        i < s && (s = i);
      }
      for (let t = 0; t < e.length; t++) {
        let n = e[t],
          i = Math.hypot(a - n[0], r - n[1]),
          o = h(n[2] - 1.6, n[2] + 0.2, i);
        o < s && (s = o);
      }
      let l = 1e9;
      for (let e = 0; e < n.length; e++) {
        let t = n[e],
          i = M(a, r, t[0], t[1], t[2], t[3]);
        i < l && (l = i);
      }
      ((j[o] = s), (j[o + 1] = (1 - h(0.7, 2.4, l)) * s));
    }
  }
}
function N(e, t, n) {
  let r = ((e - y) * x + (t - b) * S) / C;
  r = r < 0 ? 0 : r > 1 ? 1 : r;
  let i = e - (y + x * r),
    a = t - (b + S * r),
    o = (e + t) * 0.7071,
    s = (i * S - a * x) / w,
    c =
      0.88 * Math.sin(o * 0.17 + 1.1) +
      0.46 * Math.sin(o * 0.43 + 2.7) +
      0.3 * Math.sin(o * 2.35 + 0.6) +
      0.16 * Math.sin(o * 4.9 + 5.2),
    l =
      0.84 * Math.sin(o * 0.19 + 3.9) +
      0.44 * Math.sin(o * 0.37 + 0.8) +
      0.28 * Math.sin(o * 2.15 + 3.4) +
      0.15 * Math.sin(o * 5.3 + 1.9);
  return (
    (n.inward = Math.min(4.2 + c - s, s + 4.2 + l)),
    (n.width = 8.4 + c + l),
    (n.side = 4.2 + c - s < s + 4.2 + l ? 1 : -1),
    n
  );
}
var P = null,
  F = n - 1.001,
  I = new Float64Array(3);
function L(e, t) {
  return ((I[1] = e), (I[2] = t), R(), I[0]);
}
function R() {
  let e = I[1],
    t = I[2],
    r = (P ||= i());
  if (e < 0 || t < 0 || e > 120 || t > 120) z();
  else {
    let i = 0.5,
      a = 0.5,
      c = 0.5,
      l = 0,
      u = 0,
      h = 0.5,
      g = 0.5,
      _ = 0,
      v = 0,
      T =
        0.26 * Math.sin(e * 0.43 + 1.3) * Math.cos(t * 0.37 - 0.7) +
        0.2 * Math.sin((e + t) * 0.21 + 0.4) +
        0.12 * Math.sin(e * 0.9 - t * 0.7);
    ((a = e / s - 0.5),
      (a = a < 0 ? 0 : a > F ? F : a),
      (c = t / s - 0.5),
      (c = c < 0 ? 0 : c > F ? F : c),
      (l = a | 0),
      (u = c | 0),
      (h = a - l),
      (g = c - u),
      (_ = u * n + l));
    let E =
      (r[_] * (1 - h) + r[_ + 1] * h) * (1 - g) +
      (r[_ + n] * (1 - h) + r[_ + n + 1] * h) * g;
    if (E < 0) {
      let o = 0;
      if (!(E < -2.9)) {
        ((a = e / s - 0.5),
          (a = a < 0 ? 0 : a > F ? F : a),
          (c = (t + 1.4) / s - 0.5),
          (c = c < 0 ? 0 : c > F ? F : c),
          (l = a | 0),
          (u = c | 0),
          (h = a - l),
          (g = c - u),
          (_ = u * n + l));
        let d =
          (r[_] * (1 - h) + r[_ + 1] * h) * (1 - g) +
          (r[_ + n] * (1 - h) + r[_ + n + 1] * h) * g;
        ((c = (t - 1.4) / s - 0.5),
          (c = c < 0 ? 0 : c > F ? F : c),
          (u = c | 0),
          (g = c - u),
          (_ = u * n + l),
          (i =
            ((d -
              ((r[_] * (1 - h) + r[_ + 1] * h) * (1 - g) +
                (r[_ + n] * (1 - h) + r[_ + n + 1] * h) * g)) /
              2.8 -
              -0.22) /
            (-0.68 - -0.22)),
          (i = i < 0 ? 0 : i > 1 ? 1 : i),
          (o = i * i * (3 - 2 * i)));
      }
      let p = -E;
      ((i = (p - 0.12) / 1.13), (i = i < 0 ? 0 : i > 1 ? 1 : i));
      let m = i * i * (3 - 2 * i);
      ((i = (p - 0.25) / 2.55), (i = i < 0 ? 0 : i > 1 ? 1 : i));
      let y = i * i * (3 - 2 * i);
      ((i = (p - 1.4) / 4.6), (i = i < 0 ? 0 : i > 1 ? 1 : i));
      let b = i * i * (3 - 2 * i);
      ((i = (p - 1.4) / 2.2), (i = i < 0 ? 0 : i > 1 ? 1 : i));
      let x = i * i * (3 - 2 * i);
      v += (m + (y - m) * o) * d + b * f + T * x;
    }
    let D = 0;
    for (let n = 0; n < o.length; n++) {
      let r = o[n],
        a = e - r.x,
        s = t - r.y,
        c = a * a + s * s,
        l = r.radius + 0.5;
      if (c < l * l) {
        ((i =
          (Math.sqrt(c) - (r.radius - 2)) / (r.radius + 0.35 - (r.radius - 2))),
          (i = i < 0 ? 0 : i > 1 ? 1 : i));
        let e = 1 - i * i * (3 - 2 * i);
        e > D && (D = e);
      }
    }
    ((i = ((e - y) * x + (t - b) * S) / C), (i = i < 0 ? 0 : i > 1 ? 1 : i));
    let M = e - (y + x * i),
      N = t - (b + S * i),
      P = (e + t) * 0.7071,
      L = (M * S - N * x) / w,
      R =
        0.88 * Math.sin(P * 0.17 + 1.1) +
        0.46 * Math.sin(P * 0.43 + 2.7) +
        0.3 * Math.sin(P * 2.35 + 0.6) +
        0.16 * Math.sin(P * 4.9 + 5.2),
      z =
        0.84 * Math.sin(P * 0.19 + 3.9) +
        0.44 * Math.sin(P * 0.37 + 0.8) +
        0.28 * Math.sin(P * 2.15 + 3.4) +
        0.15 * Math.sin(P * 5.3 + 1.9),
      B = 4.2 + R - L,
      V = L + 4.2 + z,
      H = B < V ? B : V,
      U = 4.2 - H;
    if (
      (U < 4.2 &&
        ((i = (U - 1.2) / 3),
        (i = i < 0 ? 0 : i > 1 ? 1 : i),
        (v -= (1 - i * i * (3 - 2 * i)) * (1 - D) * p)),
      D > 0)
    )
      v -= D * m;
    else if (E > 0) {
      let n = 0,
        r = (e - O) / k,
        a = (t - O) / k;
      if (!(r < 0 || a < 0 || r > 135.998 || a > 135.998)) {
        let i = r | 0,
          o = a | 0,
          s = r - i,
          c = a - o,
          l = 1 - s,
          u = 1 - c,
          d = (o * A + i) * 2,
          f = d + 274,
          p = (j[d] * l + j[d + 2] * s) * u + (j[f] * l + j[f + 2] * s) * c,
          m =
            (j[d + 1] * l + j[d + 3] * s) * u +
            (j[f + 1] * l + j[f + 3] * s) * c;
        (p < 0.002 && m < 0.002) ||
          (n =
            (0.075 * Math.sin(e * 0.53 + 0.7) * Math.cos(t * 0.47 - 1.2) +
              0.048 * Math.sin((e + t) * 0.31 + 1.1) +
              0.028 * Math.sin(e * 0.91 - t * 0.77 + 2.4)) *
              p -
            0.062 * m);
      }
      if (
        ((i = (E - 0) / 1.6),
        (i = i < 0 ? 0 : i > 1 ? 1 : i),
        (n *= i * i * (3 - 2 * i)),
        H > -7.5)
      ) {
        ((i = (-H - 4.5) / 3), (i = i < 0 ? 0 : i > 1 ? 1 : i));
        let e = 1 - i * i * (3 - 2 * i);
        (n < 0 && (n = n * (1 - e) + e * (-0.06 * (1 - Math.exp(n / 0.06)))),
          (i = (-H - 0) / 1.6),
          (i = i < 0 ? 0 : i > 1 ? 1 : i),
          (n *= i * i * (3 - 2 * i) * e + (1 - e)));
      }
      v += n;
    }
    I[0] = v;
  }
  let a = e + t,
    c = I[0];
  if (a < 29.2 || a > 210.8) {
    let n = 0;
    for (let r = 0; r < T.length; r++) {
      let i = T[r],
        a = e - i.x,
        o = t - i.y,
        s = a * i.dx + o * i.dy;
      if (s < -2.2 || s > 32) continue;
      let c = Math.abs(a * i.dy - o * i.dx);
      if (c > 5) continue;
      let l = 2.35 - s * 0.022 + 0.28 * Math.sin(s * 0.55 + i.ph),
        u = (c - l) / (l + 1.9 - l);
      u = u < 0 ? 0 : u > 1 ? 1 : u;
      let d = u * u * (3 - 2 * u);
      ((u = (s - -2.2) / 3), (u = u < 0 ? 0 : u > 1 ? 1 : u));
      let f = u * u * (3 - 2 * u),
        p = (1 - d) * f;
      p > n && (n = p);
    }
    if (n > 0) {
      let e = c + (E - c) * n;
      e < c && (I[0] = e);
    }
  }
}
function z() {
  let e = I[1],
    t = I[2],
    n = 0.5,
    r = e < 0 ? -e : e > 120 ? e - 120 : 0,
    i = t < 0 ? -t : t > 120 ? t - 120 : 0,
    a =
      0.26 * Math.sin(e * 0.43 + 1.3) * Math.cos(t * 0.37 - 0.7) +
      0.2 * Math.sin((e + t) * 0.21 + 0.4) +
      0.12 * Math.sin(e * 0.9 - t * 0.7),
    o = Math.sqrt(r * r + i * i),
    s =
      3.2 +
      1.1 * Math.sin((e - t) * 0.23 + 0.8) +
      0.6 * Math.sin((e + t) * 0.51),
    c = 3 + o;
  ((n = (c - 0.12) / 1.13), (n = n < 0 ? 0 : n > 1 ? 1 : n));
  let l = n * n * (3 - 2 * n);
  ((n = (c - 0.25) / 2.55), (n = n < 0 ? 0 : n > 1 ? 1 : n));
  let u = n * n * (3 - 2 * n);
  ((n = (c - 1.4) / 4.6), (n = n < 0 ? 0 : n > 1 ? 1 : n));
  let p = n * n * (3 - 2 * n);
  ((n = (c - 1.4) / 2.2), (n = n < 0 ? 0 : n > 1 ? 1 : n));
  let m = n * n * (3 - 2 * n),
    h = (l + (u - l) * 0) * d + p * f + a * m;
  if (o <= s) {
    I[0] = h;
    return;
  }
  ((n = (o - s) / (s + 3.6 - s)), (n = n < 0 ? 0 : n > 1 ? 1 : n));
  let g = n * n * (3 - 2 * n),
    _ = (o - s) * 0.08;
  I[0] =
    h +
    (-26 +
      3.5 * Math.sin(e * 0.07 + 0.5) * Math.cos(t * 0.06 - 0.3) +
      2.2 * Math.sin((e - t) * 0.11) +
      (_ < 10 ? _ : 10) -
      h) *
      g;
}
var B = 26,
  V = 8.5;
function H(e, t) {
  let n = e - y,
    r = t - b,
    i = (n * x + r * S) / w;
  if (i < -26 || i > w + B) return 0;
  let a = (n * S - r * x) / w;
  if (a < -8.5 || a > V) return 0;
  for (let n = 0; n < o.length; n++) {
    let r = o[n],
      i = e - r.x,
      a = t - r.y,
      s = r.radius + 0.34;
    if (i * i + a * a < s * s) return 0;
  }
  let s = u - L(e, t);
  return s > 0 && s <= 1 ? s : 0;
}
export {
  u as a,
  v as c,
  H as d,
  d as i,
  N as l,
  T as n,
  L as o,
  E as r,
  D as s,
  f as t,
  _ as u,
};
