import {
  C as e,
  Dt as t,
  E as n,
  H as r,
  O as i,
  Rt as a,
  Ut as o,
  X as s,
  Yt as c,
  dt as l,
  ft as u,
} from "./index-DHK-Ptzs.js";
import {
  C as d,
  S as f,
  _ as p,
  a as m,
  b as h,
  c as g,
  d as _,
  f as v,
  g as y,
  h as b,
  l as x,
  m as S,
  n as C,
  o as w,
  p as T,
  r as E,
  s as D,
  t as O,
  u as k,
  v as A,
  w as j,
  x as M,
  y as N,
} from "./geo-VdiuQ1XD.js";
import { n as P, o as F, r as I } from "./rig-rgJEAbls.js";
var L = `#8d9196`,
  R = `#787c81`,
  z = (e, t) => Math.exp(-(e * e) / (t * t)),
  B = (e, t, n, r, i, a, o) => o * z(e - n, i) * z(m(t, r * O), a * O),
  ee = (e, t) => (n, r) => {
    let i = t ? t(n, r) : 1;
    for (let t of e) i += B(n, r, t[0], t[1], t[2], t[3], t[4]);
    return i;
  };
function te(e, t, n, r, i = {}) {
  let a = n.map((e) => t.bindPos(e).clone()),
    o = a[0].clone().add(new c(...(i.from || [0, 0, 0]))),
    s = a[a.length - 1],
    l = s
      .clone()
      .sub(a[a.length - 2] || a[0])
      .normalize(),
    u = s.clone().addScaledVector(l, i.ext || 0),
    d = [o, ...a.slice(1), u],
    f = [],
    m = 0;
  for (let e = 0; e < d.length - 1; e++) {
    let t = d[e].distanceTo(d[e + 1]);
    (f.push(t), (m += t));
  }
  let h = (e) => {
      let t = e * m;
      for (let e = 0; e < f.length; e++) {
        if (t <= f[e] || e === f.length - 1)
          return d[e]
            .clone()
            .lerp(d[e + 1], Math.min(1, t / Math.max(1e-6, f[e])));
        t -= f[e];
      }
      return u.clone();
    },
    g = [],
    _ =
      C.k === 1
        ? i.rings || 18
        : Math.max(5, Math.round((i.rings || 18) * C.k));
  for (let e = 0; e <= _; e++) {
    let t = e / _,
      n = 0;
    for (; n < r.length - 2 && r[n + 1][0] < t; ) n++;
    let i = r[n],
      a = r[Math.min(r.length - 1, n + 1)],
      o = a[0] > i[0] ? M(0, 1, (t - i[0]) / (a[0] - i[0])) : 0,
      s = (e, t) => p(i[e] ?? t, a[e] ?? t, o);
    g.push([t, s(1), s(2, s(1)), s(3, 2), s(4, 0), s(5, 0)]);
  }
  let v = g.map((e) => {
      let t = h(e[0]);
      return { p: [t.x + e[4], t.y, t.z + e[5]], rx: e[1], rz: e[2], e: e[3] };
    }),
    b = y(v, {
      seg: i.seg || 14,
      start: i.start ?? 0.5,
      end: i.end ?? 0.5,
      hint: i.hint,
      radial: i.radial,
    });
  return (e.add(b, { ...i, chain: n, bw: i.bw ?? 0.07 }), b);
}
function V(e, t, n, r, i, a, o = 0) {
  let s = i * O,
    c = a * O,
    l = Math.cos(s) * Math.sin(c),
    u = Math.sin(s),
    d = Math.cos(s) * Math.cos(c);
  return [e[0] + l * (t + o), e[1] + u * (n + o), e[2] + d * (r + o)];
}
function ne(e, t, n, r, i = {}) {
  let a = N(t, n, i.thick || 0.01, {
    curve: i.curve ?? !0,
    hint: i.hint || [0, 1, 0],
    samples: i.samples || Math.min(12, t.length * 3),
    seg: i.seg || 6,
  });
  return (e.add(a, { color: r, r: 0.5, detail: 0, ao: !1, ...i }), a);
}
function re(e, t, n, r, i = {}) {
  let [a, o, s] = t,
    l = i.curl ?? 0.85,
    u = i.thumb ?? l,
    f = i.spread ?? 1,
    p = i.fat ?? 1,
    m = -n,
    h = { bone: i.bone, ...(i.mat || {}) },
    g = 0.1 * r,
    _ = 0.056 * r * p,
    b = 0.032 * r * p,
    x = y(
      [
        { p: [a, o + 0.014 * r, s], rx: b * 0.92, rz: _ * 0.74, e: 2.4 },
        {
          p: [a + m * 0.003 * r, o - g * 0.4, s + 0.004 * r],
          rx: b * 1.1,
          rz: _ * 0.98,
          e: 3,
        },
        {
          p: [a + m * 0.005 * r, o - g * 0.86, s],
          rx: b * 1,
          rz: _ * 1.04,
          e: 3.4,
        },
        {
          p: [a + m * 0.006 * r, o - g * 1, s],
          rx: b * 0.86,
          rz: _ * 0.98,
          e: 3.2,
        },
      ],
      {
        seg: 12,
        start: 0.5,
        end: 0.45,
        radial: (e, t) =>
          1 +
          B(e, t, 0.55, 180, 0.35, 45, -0.1 * n) +
          B(e, t, 0.9, 0, 0.12, 40, 0.07 * n),
      },
    );
  (e.add(x, h),
    e.add(v(0.024 * r * p, 0.042 * r, 0.026 * r * p, { rings: 7, seg: 10 }), {
      ...h,
      at: [a + m * 0.012 * r, o - 0.034 * r, s + _ * 0.56],
    }));
  let C = [0.05, 0.038, 0.03],
    w = [55, 90, 60],
    T = [],
    E = i.jitter ?? 1,
    D = (t, c, u, f, p) => {
      let _ = 1 + (S(p * 3.1 + 0.4) - 0.5) * 0.14 * E,
        y = 1 + (S(p * 7.7 + 1.9) - 0.5) * 0.12 * E,
        b = (t - s) * (0.5 + 0.9 * (1 - l)),
        x = [a + m * 0.005 * r, o - g * 0.92, t],
        D = x[0],
        k = x[1],
        A = t,
        M = [[D, k, A]],
        N = (S(p * 5.3) - 0.5) * 7 * E * O,
        P = [];
      for (let e = 0; e < 3; e++) {
        ((N += l * w[e] * O + (e === 0 ? 5 * O : 0)), P.push(N));
        let t = C[e] * r * c * _;
        ((D += m * Math.sin(N) * t),
          (k -= Math.cos(N) * t),
          M.push([D, k, A + b * 0.22 * (e + 1)]),
          (A += b * 0.22));
      }
      let F = u * y,
        I = f * (i.flat ?? 0.84),
        L = i.fseg || 7;
      for (let t = 0; t < 3; t++) {
        let r = M[t],
          i = M[t + 1],
          a = t < 2 ? 0.1 : 0,
          o = [
            i[0] + (i[0] - r[0]) * a,
            i[1] + (i[1] - r[1]) * a,
            i[2] + (i[2] - r[2]) * a,
          ],
          s = [(r[0] + o[0]) / 2, (r[1] + o[1]) / 2, (r[2] + o[2]) / 2],
          c = F * (1.02 - (t / 3) * 0.16),
          l = F * (1.02 - ((t + 1) / 3) * 0.16),
          u = (e) =>
            (c + (l - c) * e) *
            (0.9 + 0.1 * Math.sin(Math.PI * Math.min(1, e * 1.15)));
        if (
          (e.add(
            j([r, s, o], u, {
              seg: L,
              samples: 6,
              start: t === 0 ? 0.3 : 0.55,
              end: t === 2 ? 0.9 : 0.55,
              rz: (e) => u(e) * I,
            }),
            h,
          ),
          t < 2)
        ) {
          let r = (P[t] + P[t + 1]) * 0.5,
            a = F * (1 - ((t + 1) / 3) * 0.16);
          e.add(v(a * 0.62, a * 0.5, a * 0.78, { rings: 5, seg: 8 }), {
            ...h,
            at: [
              i[0] + n * Math.cos(r) * a * 0.42,
              i[1] - Math.sin(r) * a * 0.42,
              i[2],
            ],
            rot: [0, 0, n * (90 - r / O)],
          });
        }
      }
      if ((T.push([t, F]), i.creaseMat))
        for (let t of [1, 2]) {
          let n = (P[t - 1] + P[t]) * 0.5,
            r = t / 3;
          e.add(d(1, 0.16, { seg: 10, tube: 4 }), {
            ...h,
            ...i.creaseMat,
            at: M[t],
            rot: [90, 0, (m * n) / O],
            order: `ZYX`,
            scale: [
              F * (1.02 - r * 0.16) * 0.93,
              F * (1.02 - r * 0.16) * 0.93,
              F * (1.02 - r * 0.16) * 0.93,
            ],
            r: 0.9,
            detail: 0.2,
            edge: 0,
          });
        }
      return (
        i.nail &&
          e.add(v(F * 0.6, F * 0.3, F * 0.72, { rings: 5, seg: 8 }), {
            ...h,
            at: [
              D - m * Math.sin(N) * 0.004 * r + n * Math.cos(N) * F * 0.55,
              k + Math.cos(N) * 0.006 * r + Math.sin(N) * F * 0.4,
              A,
            ],
            rot: [0, 0, n * (90 - N / O)],
            color: i.nail,
            r: 0.3,
            detail: 0.2,
          }),
        N
      );
    },
    k = 0.0215 * r * p;
  (D(s + 0.038 * r * p * f, 1, k * 1.02, 1, 1),
    D(s + 0.011 * r * p, 1.07, k * 1.06, 1.05, 2),
    D(s - 0.015 * r * p, 1, k * 1.02, 1.05, 3),
    D(s - 0.04 * r * p, 0.84, k * 0.92, 1, 4));
  let A = i.knuckle || {},
    M = A.k || [1.12, 0.96, 1];
  for (let [t, r] of T)
    e.add(
      v(r * M[0], r * M[1], r * M[2], {
        rings: 6,
        seg: 10,
        ...(A.e ? { e: A.e } : {}),
      }),
      {
        ...h,
        at: [a + n * b * (A.k ? 0.5 : 0.56), o - g * 0.84 + r * 0.18, t],
      },
    );
  {
    let t = T.length
        ? [T[0][0], T[T.length - 1][0]]
        : [s + 0.04 * r, s - 0.04 * r],
      c = 0.0085 * r * p;
    (e.add(
      j(
        [
          [a + n * b * 0.52, o - g * 0.7, t[0] + c],
          [a + n * b * 0.58, o - g * 0.72, s],
          [a + n * b * 0.52, o - g * 0.7, t[1] - c],
        ],
        (e) => c * (0.6 + 0.6 * Math.sin(Math.PI * e)),
        { seg: 5, samples: 7, start: 0.3, end: 0.3 },
      ),
      { ...h, ...(i.creaseMat || {}), r: 0.9, detail: 0.4 },
    ),
      e.add(
        N(
          [
            [a + m * 0.012 * r, o - 0.032 * r, s + _ * 0.72],
            [a + m * 0.014 * r, o - g * 0.62, s + _ * 0.92],
            [a + m * 0.004 * r, o - g * 0.9, s + 0.042 * r * p * f],
          ],
          (e) => (0.03 - e * 0.012) * r,
          0.009 * r,
          { hint: [1, 0, 0], samples: 8 },
        ),
        { ...h, ...(i.webMat || {}) },
      ));
  }
  i.webbed &&
    e.add(
      N(
        [
          [a + m * 0.01 * r, o - g * 1.05, s + 0.03 * r],
          [a + m * (0.01 + 0.03 * l) * r, o - g * 1.25, s],
          [a + m * 0.01 * r, o - g * 1.05, s - 0.03 * r],
        ],
        0.03 * r,
        0.006 * r,
        { hint: [1, 0, 0] },
      ),
      { ...h, ...(i.webbed.opts || {}) },
    );
  let P = [a + m * 0.018 * r, o - 0.03 * r, s + _ * 0.78],
    F = new c(m * (0.46 + 0.3 * u), -0.6, 0.5 - 0.4 * u).normalize(),
    I = new c(
      m * (0.44 + 0.42 * u),
      -0.66 + 0.3 * u,
      0.3 - 0.85 * u,
    ).normalize(),
    L = [
      P[0] + F.x * 0.046 * r,
      P[1] + F.y * 0.046 * r,
      P[2] + F.z * 0.046 * r,
    ],
    R = [L[0] + I.x * 0.04 * r, L[1] + I.y * 0.04 * r, L[2] + I.z * 0.04 * r],
    z = [
      R[0] + I.x * 0.018 * r,
      R[1] + I.y * 0.018 * r,
      R[2] + I.z * 0.018 * r,
    ];
  if (
    (e.add(
      j([P, L, R, z], (e) => 0.025 * r * p * (1.12 - e * 0.32), {
        seg: 7,
        samples: 9,
        start: 0.5,
        end: 0.9,
      }),
      h,
    ),
    i.guard &&
      e.add(
        y(
          [
            {
              p: [a - n * 0.026 * r * p, o - g * 0.3, s],
              rx: 0.013 * r,
              rz: _ * 1.04,
              e: 4,
            },
            {
              p: [a - n * 0.032 * r * p, o - g * 0.95, s],
              rx: 0.017 * r,
              rz: _ * 1.16,
              e: 4,
            },
          ],
          { seg: 12, start: `flat`, end: `flat` },
        ),
        { ...h, ...i.guard },
      ),
    i.cuff)
  ) {
    let t = i.cuff,
      n = o + (t.y ?? 0.012 * r),
      c = t.mat || i.mat || {};
    se(e, [a, n, s], b * (t.k ?? 1.22), _ * (t.k ?? 1.22), {
      bone: i.bone,
      mirror: c.mirror,
      bead: t.r ?? 0.011 * r,
      seg: 14,
      flare: t.flare ?? 0.1,
      flareH: t.h ?? 0.03 * r,
      flareDrop: t.drop ?? 0,
      studs: t.studs ?? 0,
      studR: t.studR ?? 0.009 * r,
      studH: (t.studR ?? 0.009 * r) * 0.7,
      studY: -0.006 * r,
      mat: t.mat || i.mat,
      lipMat: t.lipMat || t.mat || i.mat,
      studMat: t.studMat || t.mat || i.mat,
    });
  }
}
function ie(e, t, n, r, i = {}) {
  let [a, o, s] = t,
    c = o + (i.lift ?? 0),
    l = (i.w ?? 0.085) * r,
    u = (i.toe ?? 0.2) * r,
    d = (i.heel ?? 0.1) * r,
    f = (i.soleH ?? 0.024) * r,
    p = (i.proud ?? 0.012) * r,
    m = {
      bone: i.bone,
      chain: i.chain,
      skin: i.skin,
      bw: i.bw,
      mirror: i.mirror,
    },
    h = { ...(i.soleMat || i.mat || {}) },
    g = i.mat || {},
    _ = [
      [-1, 0.7],
      [-0.72, 0.88],
      [-0.3, 0.99],
      [0.1, 1],
      [0.5, 0.97],
      [0.8, 0.84],
      [1, 0.58],
    ].map(([e, t]) => ({
      p: [a, c + f * 0.5, s + (e < 0 ? e * d : e * u)],
      rx: (l + p) * t,
      rz: f * 0.5,
      e: 4.2,
    }));
  e.add(y(_, { seg: 14, start: 0.35, end: 0.5, hint: [0, 1, 0] }), {
    ...m,
    ...h,
    edge: 1.6,
  });
  let b = [];
  for (let e = 0; e <= 13; e++) {
    let t = (e / 13) * Math.PI * 2,
      n = Math.cos(t),
      r = Math.sin(t),
      i = n > 0 ? n * u * 0.94 : n * d * 0.94,
      o = 1 - 0.34 * Math.abs(n) ** 2.2;
    b.push([a + r * (l + p) * o, c + f * 0.92, s + i]);
  }
  (ce(e, b, {
    ...m,
    r: f * 0.26,
    stitch: i.stitch ?? 15,
    up: [0, 1, 0],
    curve: !0,
    mat: h,
    stitchMat: i.stitchMat || h,
  }),
    e.add(
      y(
        [
          {
            p: [a, c + f * 0.9, s - d * 0.96],
            rx: l * 0.78,
            rz: f * 0.55,
            e: 4,
          },
          {
            p: [a, c + f * 1.9, s - d * 0.9],
            rx: l * 0.86,
            rz: f * 1.1,
            e: 3.4,
          },
          {
            p: [a, c + f * 2.3, s - d * 0.36],
            rx: l * 0.92,
            rz: f * 1.25,
            e: 3,
          },
        ],
        { seg: 12, start: `flat`, end: 0.4, hint: [0, 1, 0] },
      ),
      { ...m, ...(i.heelMat || h), edge: 1.5 },
    ));
  let x = i.toes || `cap`;
  if (x === `cap`) {
    let t = [];
    for (let e = 0; e <= 8; e++) {
      let n = (e / 8 - 0.5) * 2;
      t.push([
        a + n * l * 0.86,
        c + f * 1.05 + (1 - n * n) * (i.capH ?? 0.03) * r,
        s + u * 0.52 - Math.abs(n) * u * 0.1,
      ]);
    }
    ce(e, t, {
      ...m,
      r: f * 0.3,
      stitch: i.capStitch ?? 7,
      up: [0, 0.6, 0.8],
      mat: i.toeMat || g,
      stitchMat: i.toeMat || g,
    });
  } else if (x === `lobes`)
    for (let t = 0; t < 3; t++) {
      let r = (t - 1) / 1,
        o = l * (0.5 - Math.abs(r) * 0.09);
      (e.add(v(o, o * 0.86, o * 1.18, { rings: 7, seg: 11, e: 2.3 }), {
        ...m,
        ...(i.toeMat || g),
        at: [
          a + r * l * 0.94 * n,
          c + f + o * 0.78,
          s + u * (0.86 - Math.abs(r) * 0.1),
        ],
      }),
        e.add(v(o * 0.42, o * 0.3, o * 0.5, { rings: 4, seg: 8 }), {
          ...m,
          ...(i.nailMat || i.toeMat || g),
          at: [
            a + r * l * 0.94 * n,
            c + f + o * 1.3,
            s + u * (0.9 - Math.abs(r) * 0.1),
          ],
          rot: [-24, 0, 0],
        }));
    }
}
function ae(e, t, n, r = {}) {
  let i = r.thick ?? 0.3,
    a = r.twist ?? 40,
    o = r.taper ?? 0.85,
    s = r.strands || 0,
    c = s
      ? (e, t) => 1 - 0.085 * Math.abs(Math.sin(t * s * 0.5 + e * 2.1)) ** 0.6
      : void 0;
  e.add(
    j(t, (e) => n * (1 - e ** 1.5 * o) * (0.9 + 0.1 * Math.sin(e * 9)), {
      seg: r.seg || (s ? 9 : 7),
      samples: r.samples || 10,
      rz: (e) => n * i * (1 - e * 0.5),
      twist: (e) => a * e,
      start: 0.4,
      end: 0.8,
      hint: r.hint,
      e: 2.3,
      radial: c,
    }),
    r.mat,
  );
}
function oe(e, t, n, r, i, a, o, s = null, c = 5) {
  let l = [];
  for (let s = 0; s <= c; s++) {
    let u = s / c,
      d = p(n, i, u),
      f = p(r, a, u);
    l.push(V(e, t[0], t[1], t[2], d, f, o * (1 + u * 0.4)));
  }
  if (s) {
    let e = l[l.length - 1];
    l.push(
      [e[0] + s[0] * 0.55, e[1] + s[1] * 0.55, e[2] + s[2] * 0.55],
      [e[0] + s[0], e[1] + s[1], e[2] + s[2]],
    );
  }
  return l;
}
function se(e, t, n, r, i = {}) {
  let [a, o, s] = t,
    c = i.arc || [0, 360],
    l = c[1] - c[0] >= 359.9,
    u = Math.max(8, Math.round((i.seg || 26) * (C.k === 1 ? 1 : 0.55))),
    d = {
      bone: i.bone,
      chain: i.chain,
      skin: i.skin,
      bw: i.bw,
      mirror: i.mirror,
    },
    f = (i.tilt || 0) * O,
    m = Math.cos(f),
    h = Math.sin(f),
    g = (e, t, i) => {
      let c = Math.cos(e) * n * t,
        l = Math.sin(e) * r * t;
      return [a + c, o + i * m - l * h, s + l * m + i * h];
    };
  if (i.bead !== 0) {
    let t = [],
      n = u,
      r = (c[1] - c[0]) * O;
    for (let e = 0; e <= n; e++) {
      let i = c[0] * O + (e / n) * r;
      t.push(g(i, 1, 0));
    }
    (l && t.push(t[1]),
      e.add(
        j(t, i.bead ?? 0.011, {
          seg: 6,
          samples: Math.round(n * 1.4),
          curve: !1,
          hint: [0, 1, 0],
          start: l ? 0 : 0.5,
          end: l ? 0 : 0.5,
        }),
        { ...d, ...(i.mat || {}), edge: 1.45 },
      ));
  }
  if (i.flare) {
    let t = 1 + i.flare,
      f = i.flareH ?? 0.016,
      m = i.flareDrop ?? 0,
      h = [];
    for (let e = 0; e <= 3; e++) {
      let i = e / 3;
      h.push({
        p: [a, o + m - f * i, s],
        rx: p(n, n * t, i * i),
        rz: p(r, r * t, i * i),
      });
    }
    (e.add(y(h, { seg: u, arc: l ? void 0 : c }), {
      ...d,
      ...(i.lipMat || i.mat || {}),
      edge: 1.5,
    }),
      l &&
        e.add(
          y(
            h.map((e) => ({ ...e, rx: e.rx * 0.93, rz: e.rz * 0.93 })),
            { seg: Math.max(8, u >> 1), flipNormals: !0 },
          ),
          { ...d, ...(i.lipMat || i.mat || {}) },
        ));
  }
  if (i.studs) {
    let t = Math.max(3, Math.round(i.studs * (C.k === 1 ? 1 : 0.6))),
      a = i.studR ?? 0.013,
      o = i.studH ?? a * 0.72,
      s = v(a, o, a, {
        rings: C.k === 1 ? 6 : 3,
        seg: C.k === 1 ? 13 : 5,
        e: i.studE || 2,
      }),
      u = (c[1] - c[0]) * O,
      f = l ? t : t - 1;
    for (let a = 0; a < t; a++) {
      let t = c[0] * O + (a / Math.max(1, f)) * u + 0,
        o = g(t, 1 + (i.studOut ?? 0.004) / Math.max(n, r), i.studY ?? 0);
      e.add(s, {
        ...d,
        ...(i.studMat || i.mat || {}),
        at: o,
        rot: [90 + (i.tilt || 0), 0, -t / O],
        order: `YZX`,
        detail: 0.25,
      });
    }
  }
}
function ce(e, t, n = {}) {
  let r = {
      bone: n.bone,
      chain: n.chain,
      skin: n.skin,
      bw: n.bw,
      mirror: n.mirror,
    },
    i = n.r ?? 0.012;
  if (
    (e.add(
      j(t, (e) => i * (n.taper ? 1 - n.taper * e : 1), {
        seg: 6,
        samples: n.samples || Math.max(8, t.length * 3),
        curve: n.curve ?? !0,
        hint: n.hint || [0, 1, 0],
        start: 0.4,
        end: 0.4,
      }),
      { ...r, ...(n.mat || {}), edge: 1.5 },
    ),
    n.stitch)
  ) {
    let a = Math.max(3, Math.round(n.stitch * (C.k === 1 ? 1 : 0.5))),
      o = v(i * 0.42, i * 0.3, i * 0.42, { rings: 3, seg: 5 }),
      s = n.up || [0, 1, 0];
    for (let c = 0; c < a; c++) {
      let l = ((c + 0.5) / a) * (t.length - 1),
        u = t[Math.floor(l)],
        d = t[Math.min(t.length - 1, Math.floor(l) + 1)],
        f = l - Math.floor(l);
      e.add(o, {
        ...r,
        ...(n.stitchMat || n.mat || {}),
        at: [
          p(u[0], d[0], f) + s[0] * i * 1.5,
          p(u[1], d[1], f) + s[1] * i * 1.5,
          p(u[2], d[2], f) + s[2] * i * 1.5,
        ],
        detail: 0.2,
      });
    }
  }
}
function le(t, n, i, a = {}) {
  let o = {
      bone: a.bone,
      chain: a.chain,
      skin: a.skin,
      bw: a.bw,
      mirror: a.mirror,
    },
    s = a.r ?? 0.005,
    l = n.map((e) => new c(...e)),
    u = i.map((e) => new c(...e).normalize());
  a.welt !== !1 &&
    t.add(
      j(n, s, {
        seg: 5,
        samples: Math.max(8, n.length * 2),
        curve: a.curve ?? !0,
        start: 0.4,
        end: 0.4,
      }),
      { ...o, ...(a.mat || {}), edge: 1.4 },
    );
  let d = [0];
  for (let e = 1; e < l.length; e++)
    d.push(d[e - 1] + l[e].distanceTo(l[e - 1]));
  let f = d[d.length - 1],
    p = (a.gap ?? 0.022) / (C.k === 1 ? 1 : 0.6),
    m = Math.max(2, Math.floor(f / p)),
    h = p * (a.dash ?? 0.55),
    g = (e, t, n) => {
      let r = 1;
      for (; r < d.length - 1 && d[r] < e; ) r++;
      let i = (e - d[r - 1]) / Math.max(1e-6, d[r] - d[r - 1]);
      return (
        t.lerpVectors(l[r - 1], l[r], i),
        n.lerpVectors(u[r - 1], u[r], i).normalize(),
        t
      );
    },
    _ = [],
    v = [],
    y = [],
    b = [],
    x = new c(),
    S = new c(),
    w = new c(),
    T = new c(),
    E = new c(),
    D = new c(),
    O = new c(),
    k = new c(),
    A = new c(),
    M = [
      [0, 2, 3],
      [0, 3, 4],
      [0, 4, 5],
      [0, 5, 2],
      [1, 3, 2],
      [1, 4, 3],
      [1, 5, 4],
      [1, 2, 5],
    ];
  for (let e = 0; e < m; e++) {
    let t = ((e + 0.5) * f) / m;
    (g(Math.max(0, t - h / 2), x, w), g(Math.min(f, t + h / 2), S, T));
    let n = a.lift ?? s * 0.95;
    (x.addScaledVector(w, n),
      S.addScaledVector(T, n),
      E.addVectors(x, S).multiplyScalar(0.5),
      D.subVectors(S, x).normalize(),
      O.addVectors(w, T).normalize(),
      k.crossVectors(D, O).normalize(),
      O.crossVectors(k, D).normalize());
    let r = s * 0.5,
      i = s * 0.34,
      o = [
        x,
        S,
        A.copy(E).addScaledVector(O, i).clone(),
        E.clone().addScaledVector(k, r),
        E.clone().addScaledVector(O, -i * 0.3),
        E.clone().addScaledVector(k, -r),
      ];
    for (let [e, n, r] of M) {
      let i = _.length / 3,
        a = o[n].clone().sub(o[e]),
        s = o[r].clone().sub(o[e]),
        c = a.cross(s).normalize(),
        l = o[e]
          .clone()
          .add(o[n])
          .add(o[r])
          .multiplyScalar(1 / 3),
        u = c.dot(l.sub(E)) < 0;
      for (let i of u ? [e, r, n] : [e, n, r])
        (_.push(o[i].x, o[i].y, o[i].z),
          v.push(u ? -c.x : c.x, u ? -c.y : c.y, u ? -c.z : c.z),
          y.push(t, 0));
      b.push(i, i + 1, i + 2);
    }
  }
  let N = new e();
  (N.setAttribute(`position`, new r(_, 3)),
    N.setAttribute(`normal`, new r(v, 3)),
    N.setAttribute(`uvw`, new r(y, 2)),
    N.setIndex(b),
    t.add(N, {
      ...o,
      ...(a.stitchMat || { color: `#d8cfe8`, r: 0.7, tex: `cloth` }),
      detail: 0.15,
      edge: 0.4,
      seam: 0,
    }));
}
function ue(e, t, n, r = {}) {
  let i = r.thick ?? 0.03,
    a = (r.lat0 ?? -8) * O,
    o = r.rings || 10,
    s = r.seg || 22,
    l = (i, o = r.rings || 10, s = r.seg || 22) => {
      let c = [];
      for (let s = 0; s <= o; s++) {
        let l = a + (Math.PI / 2 - a) * (s / o),
          u = Math.max(0.015, Math.cos(l));
        c.push({
          p: [0, Math.sin(l) * t * i - Math.sin(a) * t, 0],
          rx: e * i * u,
          rz: n * i * u,
          e: r.e || 2,
        });
      }
      return y(c, { seg: s, start: 0, end: 0, radial: r.radial });
    },
    u = l(1),
    d = l(
      1 - i / Math.max(e, n),
      r.innerRings || Math.max(3, Math.round(o * 0.5)),
      r.innerSeg || Math.max(8, Math.round(s * 0.6)),
    );
  if ((H(d), r.planar !== !1)) {
    let r = (e + n) * 0.5,
      i = [0],
      o = [0],
      s = 0,
      c = t,
      l = 0;
    for (let e = 1; e <= 24; e++) {
      let n = Math.PI / 2 + (a - Math.PI / 2) * (e / 24),
        u = Math.cos(n) * r,
        d = Math.sin(n) * t;
      ((l += Math.hypot(u - s, d - c)),
        (s = u),
        (c = d),
        i.push(Math.max(u, i[e - 1] + 1e-4)),
        o.push(l));
    }
    let d = (e) => {
        if (e <= 0) return 0;
        for (let t = 1; t < i.length; t++)
          if (e <= i[t] || t === i.length - 1) {
            let n = (e - i[t - 1]) / Math.max(1e-6, i[t] - i[t - 1]);
            return (
              o[t - 1] + (o[t] - o[t - 1]) * Math.max(0, Math.min(1.35, n))
            );
          }
        return l;
      },
      f = u.attributes.position,
      p = u.attributes.uvw;
    for (let e = 0; e < f.count; e++) {
      let t = f.getX(e),
        n = f.getZ(e),
        r = Math.hypot(t, n),
        i = r > 1e-5 ? d(r) / r : 1;
      p.setXY(e, t * i, n * i);
    }
    ((p.needsUpdate = !0), delete u.userData.uPeriod);
  }
  let f = [],
    p = Math.cos(a);
  for (let t = 0; t <= s; t++) {
    let a = (t / s) * Math.PI * 2,
      o = r.radial ? r.radial(0, a) : 1;
    f.push(
      new c(
        Math.cos(a) * e * p * o * (1 - (i * 0.5) / e),
        0,
        Math.sin(a) * n * p * o * (1 - (i * 0.5) / n),
      ),
    );
  }
  return {
    outer: u,
    inner: d,
    rim: y(
      f.map((e) => ({
        p: [e.x, e.y, e.z],
        rx: r.rimR ?? i * 0.75,
        rz: r.rimR ?? i * 0.75,
      })),
      { seg: 7, start: 0, end: 0, hint: [0, 1, 0] },
    ),
  };
}
function H(e) {
  let t = e.index.array;
  for (let e = 0; e < t.length; e += 3) {
    let n = t[e + 1];
    ((t[e + 1] = t[e + 2]), (t[e + 2] = n));
  }
  let n = e.attributes.normal;
  for (let e = 0; e < n.count; e++)
    n.setXYZ(e, -n.getX(e), -n.getY(e), -n.getZ(e));
}
function U(e, t, n, r, i, a, o, s, c, l, u = {}) {
  let d = (e) => {
      let l = [];
      for (let d = 0; d <= 4; d++) {
        let f = d / 4,
          m = 1 + (u.bulge ?? 0.06) * Math.sin(Math.PI * f);
        l.push({
          p: [t, p(r, i, f), n],
          rx: p(a, s, f) * m * e,
          rz: p(o, c, f) * m * e,
        });
      }
      return l;
    },
    f = {
      bone: u.bone,
      chain: u.chain,
      bw: u.bw,
      skin: u.skin,
      mirror: u.mirror,
    };
  (e.add(y(d(1), { seg: u.seg || 12, arc: l }), { ...f, ...u.mat, edge: 1.4 }),
    e.add(
      y(d(0.9), {
        seg: Math.max(6, (u.seg || 12) >> 1),
        arc: l,
        flipNormals: !0,
      }),
      { ...f, ...(u.inner || u.mat) },
    ));
  for (let [d, m] of [
    [r, [a, o]],
    [i, [s, c]],
  ]) {
    let r = [];
    for (let e = 0; e <= 10; e++) {
      let i = p(l[0], l[1], e / 10) * O;
      r.push([t + Math.cos(i) * m[0] * 0.97, d, n + Math.sin(i) * m[1] * 0.97]);
    }
    e.add(j(r, u.rimR ?? 0.008, { seg: 5, samples: 14 }), {
      ...f,
      ...(u.rim || u.mat),
    });
  }
}
function W(e, t, n = 1, r = 0, i = 0) {
  return (a, o) => {
    let s = r ? M(0.1, 1, r === 1 ? a : 1 - a) : 1,
      c =
        Math.sin(o * e + n + Math.sin(o * 2 + n) * 0.8) * 0.65 +
        Math.sin(o * (e * 2 + 1) + n * 2.3) * 0.35;
    return 1 + t * (i + (1 - i) * s) * c;
  };
}
var de = (e, t = 1, n = 0.04, r = 5) =>
    (Math.abs(Math.sin(e * r * 6.1 + t)) * 0.6 +
      S(Math.floor(e * r * 4 + t)) * 0.4) *
    n,
  G = (e, t) => Math.exp(-(e * e) / (t * t));
function K(e) {
  let t = [...e].sort((e, t) => e[0] - t[0]),
    n = t.length,
    r = t.map((e) => e[0]),
    i = t.map((e) => e[1]),
    a = [];
  for (let e = 0; e < n - 1; e++)
    a.push((i[e + 1] - i[e]) / Math.max(1e-9, r[e + 1] - r[e]));
  let o = Array(n);
  ((o[0] = a[0]), (o[n - 1] = a[n - 2]));
  for (let e = 1; e < n - 1; e++)
    o[e] = a[e - 1] * a[e] <= 0 ? 0 : (a[e - 1] + a[e]) / 2;
  for (let e = 0; e < n - 1; e++) {
    if (a[e] === 0) {
      ((o[e] = 0), (o[e + 1] = 0));
      continue;
    }
    let t = o[e] / a[e],
      n = o[e + 1] / a[e],
      r = t * t + n * n;
    if (r > 9) {
      let i = 3 / Math.sqrt(r);
      ((o[e] = i * t * a[e]), (o[e + 1] = i * n * a[e]));
    }
  }
  return (e) => {
    if (e <= r[0]) return i[0];
    if (e >= r[n - 1]) return i[n - 1];
    let t = 0;
    for (; t < n - 2 && e > r[t + 1]; ) t++;
    let a = r[t + 1] - r[t],
      s = (e - r[t]) / a,
      c = s * s,
      l = c * s;
    return (
      (2 * l - 3 * c + 1) * i[t] +
      (l - 2 * c + s) * a * o[t] +
      (-2 * l + 3 * c) * i[t + 1] +
      (l - c) * a * o[t + 1]
    );
  };
}
var q = {
    top: 1,
    bottom: -1.03,
    width: [
      [1, 0],
      [0.96, 0.3],
      [0.86, 0.6],
      [0.6, 0.86],
      [0.3, 0.98],
      [0.08, 1],
      [-0.12, 0.99],
      [-0.32, 0.93],
      [-0.52, 0.8],
      [-0.7, 0.63],
      [-0.85, 0.45],
      [-0.95, 0.28],
      [-1.01, 0.1],
      [-1.03, 0],
    ],
    front: [
      [1, 0],
      [0.96, 0.3],
      [0.86, 0.62],
      [0.62, 0.88],
      [0.4, 0.97],
      [0.26, 1],
      [0.12, 0.94],
      [-0.05, 0.95],
      [-0.3, 0.97],
      [-0.46, 1],
      [-0.6, 0.98],
      [-0.71, 0.9],
      [-0.84, 0.94],
      [-0.94, 0.78],
      [-1, 0.5],
      [-1.03, 0],
    ],
    back: [
      [1, 0],
      [0.95, 0.36],
      [0.82, 0.72],
      [0.5, 1],
      [0.1, 1.02],
      [-0.25, 0.93],
      [-0.55, 0.72],
      [-0.8, 0.55],
      [-0.97, 0.35],
      [-1.03, 0],
    ],
    eFront: [
      [1, 2],
      [0.55, 2.3],
      [0.1, 2.55],
      [-0.35, 2.45],
      [-0.6, 2.15],
      [-0.85, 1.75],
      [-1.03, 1.6],
    ],
    eBack: 2.05,
    eyeY: 0.02,
    eyeX: 0.42,
    socket: 0.07,
    brow: 0.06,
    browY: 0.25,
    noseTop: 0.13,
    noseY: -0.28,
    nose: 0.27,
    bridge: 0.05,
    noseW: 0.15,
    alae: 0.07,
    cheek: 0.055,
    cheekY: -0.16,
    hollow: 0.035,
    mouthY: -0.56,
    muzzle: 0.03,
    lipU: 0.05,
    lipL: 0.06,
    crease: 0.03,
    chin: 0.05,
    chinY: -0.86,
    jawCorner: 0,
  },
  fe = {
    fine: {
      bottom: -0.925,
      width: [
        [1, 0],
        [0.96, 0.3],
        [0.86, 0.6],
        [0.6, 0.86],
        [0.3, 0.98],
        [0.08, 1],
        [-0.14, 0.99],
        [-0.34, 0.95],
        [-0.52, 0.88],
        [-0.66, 0.75],
        [-0.78, 0.55],
        [-0.87, 0.33],
        [-0.915, 0.11],
        [-0.925, 0],
      ],
      nose: 0.22,
      bridge: 0.035,
      noseW: 0.13,
      alae: 0.05,
      noseY: -0.27,
      brow: 0.035,
      socket: 0.06,
      cheek: 0.05,
      hollow: 0.02,
      lipU: 0.045,
      lipL: 0.06,
      chin: 0.045,
      chinY: -0.8,
      eyeY: 0,
      jawCorner: 0.055,
    },
    heroic: {
      width: [
        [1, 0],
        [0.96, 0.3],
        [0.86, 0.6],
        [0.6, 0.86],
        [0.3, 0.98],
        [0.08, 1],
        [-0.12, 1],
        [-0.34, 0.97],
        [-0.56, 0.9],
        [-0.74, 0.78],
        [-0.88, 0.58],
        [-0.97, 0.36],
        [-1.02, 0.12],
        [-1.04, 0],
      ],
      nose: 0.33,
      bridge: 0.07,
      noseW: 0.18,
      alae: 0.09,
      brow: 0.1,
      socket: 0.09,
      cheek: 0.07,
      hollow: 0.03,
      chin: 0.07,
      jawCorner: 0.06,
      lipU: 0.045,
      lipL: 0.05,
    },
  };
function pe(t, n = {}, i = {}) {
  let a = { ...q, ...n },
    [o, s, l] = t,
    u = K(a.width),
    d = K(a.front),
    f = K(a.back),
    m = K(a.eFront),
    h = a.eBack,
    _ = (e, t) => {
      let n = Math.abs(t),
        r = 0,
        i = 1,
        o = M(a.noseTop, a.noseY, e),
        s =
          e >= a.noseY
            ? p(a.bridge, a.nose, o ** 1.7) * M(a.noseTop + 0.1, a.noseTop, e)
            : a.nose * M(a.noseY - 0.1, a.noseY, e),
        c = p(a.noseW * 0.5, a.noseW, o);
      ((r += s * G(t, c) * (1 + 0.12 * G(e - a.noseY, 0.05))),
        (r +=
          a.alae *
          G(e - (a.noseY - 0.03), 0.06) *
          G(n - a.noseW * 0.8, a.noseW * 0.42)),
        (r +=
          a.brow *
          G(e - a.browY, a.browS ?? 0.075) *
          M(0.98, 0.55, n) *
          (1 - 0.4 * G(t, 0.1))),
        (r -= a.socket * G(e - a.eyeY, 0.11) * G(n - a.eyeX, 0.21)),
        (r += a.muzzle * G(e - a.mouthY, 0.16) * G(t, 0.36)),
        (r += a.lipU * G(e - (a.mouthY + 0.055), 0.05) * G(t, 0.25)),
        (r += a.lipL * G(e - (a.mouthY - 0.075), 0.05) * G(t, 0.2)),
        (r -= a.crease * G(e - a.mouthY, 0.026) * G(t, 0.3)),
        (r += a.chin * G(e - a.chinY, 0.1) * G(t, 0.3)),
        (i += a.cheek * G(e - a.cheekY, 0.13) * G(n - 0.72, 0.2)),
        (i -= a.hollow * G(e - (a.cheekY - 0.3), 0.14) * G(n - 0.7, 0.2)),
        (i +=
          a.jawCorner * G(e - (a.mouthY - 0.12), 0.14) * G(n - 0.84, 0.16)));
      let l = a.planes ?? 1;
      return (
        l > 0 &&
          ((r +=
            a.brow *
            l *
            0.55 *
            M(a.browY - 0.13, a.browY - 0.05, e) *
            M(a.browY + 0.24, a.browY + 0.06, e) *
            M(0.95, 0.62, n)),
          (i +=
            a.cheek *
            l *
            0.55 *
            M(a.cheekY - 0.19, a.cheekY - 0.1, e) *
            M(a.cheekY + 0.26, a.cheekY + 0.05, e) *
            M(0.42, 0.6, n) *
            M(1.02, 0.86, n)),
          (r -=
            0.028 *
            l *
            M(0.3, 0.55, n) *
            M(a.cheekY - 0.02, a.cheekY - 0.14, e) *
            M(a.chinY - 0.02, a.mouthY - 0.02, e))),
        [i, r]
      );
    },
    v = (e, t, n) => {
      let r = u(e) * o,
        i = d(e) * l,
        a = f(e) * l,
        s = Math.sin(t),
        c = Math.cos(t),
        p = 2 / (c > 0 ? m(e) : h);
      return (
        (n[0] = Math.sign(s) * Math.abs(s) ** +p * r),
        (n[2] = Math.sign(c) * Math.abs(c) ** +p * (c > 0 ? i : a)),
        n
      );
    },
    y = [0, 0, 0],
    b = (e, t, n) => {
      v(e, t, y);
      let r = y[0],
        i = y[2],
        a = d(e) * l,
        c = a > 1e-5 ? M(-0.05, 0.3, i / a) : 0;
      if (c > 0) {
        let [t, a] = _(e, r / o),
          s = 1 + (t - 1) * c;
        ((n[0] = r * s), (n[2] = i * s + a * l * c));
      } else ((n[0] = r), (n[2] = i));
      return ((n[1] = e * s), n);
    },
    x = (e, t, n, r) => {
      let i = [0];
      for (let n = 1; n <= 400; n++) {
        let a = p(e, t, (n - 0.5) / 400);
        i.push(i[n - 1] + r(a));
      }
      let a = i[400],
        o = [],
        s = 0;
      for (let r = 0; r <= n; r++) {
        let c = (a * r) / n;
        for (; s < 400 && i[s + 1] < c; ) s++;
        let l = i[s + 1] > i[s] ? (c - i[s]) / (i[s + 1] - i[s]) : 0;
        o.push(p(e, t, (s + l) / 400));
      }
      return o;
    },
    S = Math.max(14, Math.round((i.rows || 42) * C.k)),
    w = 2 * Math.max(8, Math.round(((i.seg || 48) * C.k) / 2)),
    T = x(
      a.bottom + 0.012,
      a.top - 0.012,
      S,
      (e) => 1 + 1.7 * G(e + 0.32, 0.55),
    ).reverse(),
    E = x(-Math.PI, Math.PI, w, (e) => 1 + 2.4 * G(e, 0.6)),
    D = [],
    O = [],
    k = [],
    j = [],
    N = [0, 0, 0],
    P = Math.PI * (o + l);
  (D.push(0, a.top * s, 0), O.push(P * 0.5, a.top * s));
  for (let e = 0; e < T.length; e++) {
    let t = D.length / 3;
    for (let t = 0; t <= w; t++)
      (b(T[e], E[t], N),
        D.push(N[0], N[1], N[2]),
        O.push(((E[t] + Math.PI) / (Math.PI * 2)) * P, N[1]));
    j.push([t, t + w]);
  }
  let F = D.length / 3;
  (D.push(0, a.bottom * s, 0), O.push(P * 0.5, a.bottom * s));
  let I = (e) => 1 + e * (w + 1);
  for (let e = 0; e < w; e++) k.push(0, I(0) + e, I(0) + e + 1);
  for (let e = 0; e < T.length - 1; e++)
    for (let t = 0; t < w; t++) {
      let n = I(e) + t,
        r = n + 1,
        i = I(e + 1) + t + 1,
        a = I(e + 1) + t;
      k.push(n, a, i, n, i, r);
    }
  let L = I(T.length - 1);
  for (let e = 0; e < w; e++) k.push(F, L + e, L + e + 1);
  let R = new e();
  (R.setAttribute(`position`, new r(D, 3)),
    R.setAttribute(`uvw`, new r(O, 2)),
    R.setIndex(k),
    (R.userData.seams = j),
    A(R));
  {
    let e = R.attributes.normal,
      t = 0;
    for (let n = 0; n < e.count; n++)
      t +=
        e.getX(n) * R.attributes.position.getX(n) +
        e.getY(n) * R.attributes.position.getY(n) +
        e.getZ(n) * R.attributes.position.getZ(n);
    if (t < 0) {
      let e = R.index.array;
      for (let t = 0; t < e.length; t += 3) {
        let n = e[t + 1];
        ((e[t + 1] = e[t + 2]), (e[t + 2] = n));
      }
      A(R);
    }
  }
  let z = (e, t, n = new c()) => {
    let r = u(e),
      i = d(e),
      a = m(e),
      f =
        i * (1 - g(Math.abs(t) / Math.max(1e-4, r), 0, 0.999) ** +a) ** (1 / a),
      [p, h] = _(e, t);
    return n.set(t * o * p, e * s, f * l * p + h * l);
  };
  return {
    geo: R,
    point: z,
    normal: (e, t, n = new c()) => {
      let r = 0.01,
        i = z(e, t + r),
        a = z(e, t - r),
        o = z(e + r, t),
        s = z(e - r, t),
        l = i.sub(a),
        u = o.sub(s);
      return n.crossVectors(l, u).normalize();
    },
    uvAt: (e, t, n = [0, 0]) => {
      let r = u(e),
        i = m(e),
        a = g(Math.abs(t) / Math.max(1e-4, r), 0, 0.999);
      return (
        (n[0] =
          ((Math.asin(g(Math.sign(t) * a ** (i * 0.5), -1, 1)) + Math.PI) /
            (Math.PI * 2)) *
          P),
        (n[1] = e * s),
        n
      );
    },
    S: a,
    R: t,
  };
}
function me(t, n, i, a, o = 0) {
  let s = n.length,
    l = [],
    u = [];
  for (let [e, r] of n)
    (l.push(t.point(e, r, new c())), u.push(t.normal(e, r, new c())));
  let d = [],
    f = [],
    p = new c(),
    m = new c();
  for (let e = 0; e < s; e++) {
    let t = s > 1 ? e / (s - 1) : 0;
    (p.subVectors(l[Math.min(s - 1, e + 1)], l[Math.max(0, e - 1)]),
      p.lengthSq() < 1e-12 && p.set(1, 0, 0),
      m.crossVectors(p, u[e]),
      m.lengthSq() < 1e-12 && m.set(1, 0, 0),
      m.normalize());
    let n = typeof i == `function` ? i(t) : i,
      r = typeof a == `function` ? a(t) : a,
      c = l[e].x + u[e].x * o,
      f = l[e].y + u[e].y * o,
      h = l[e].z + u[e].z * o;
    for (let [t, i] of [
      [-1, 0],
      [-1, 1],
      [1, 1],
      [1, 0],
    ])
      d.push(
        c + m.x * t * n + u[e].x * i * r,
        f + m.y * t * n + u[e].y * i * r,
        h + m.z * t * n + u[e].z * i * r,
      );
  }
  for (let e = 0; e < s - 1; e++)
    for (let t = 0; t < 4; t++) {
      let n = e * 4 + t,
        r = e * 4 + ((t + 1) % 4),
        i = (e + 1) * 4 + ((t + 1) % 4),
        a = (e + 1) * 4 + t;
      f.push(n, r, i, n, i, a);
    }
  let h = (s - 1) * 4;
  f.push(0, 2, 1, 0, 3, 2, h, h + 1, h + 2, h, h + 2, h + 3);
  let g = new e();
  (g.setAttribute(`position`, new r(d, 3)),
    g.setIndex(f),
    g.computeVertexNormals());
  {
    let e = g.attributes.normal,
      t = 0;
    for (let n = 0; n < e.count; n++) {
      let r = Math.min(s - 1, n >> 2);
      t += e.getX(n) * u[r].x + e.getY(n) * u[r].y + e.getZ(n) * u[r].z;
    }
    if (t < 0) {
      let e = g.index.array;
      for (let t = 0; t < e.length; t += 3) {
        let n = e[t + 1];
        ((e[t + 1] = e[t + 2]), (e[t + 2] = n));
      }
      g.computeVertexNormals();
    }
  }
  return g;
}
function he(e, t, n, r = {}) {
  let { S: i } = t,
    a = [],
    o = r.width ?? 0.42,
    s = r.drop ?? 0.055;
  for (let e = 0; e < 9; e++) {
    let t = e / 8,
      n = p(-o, o, t);
    a.push([i.mouthY + (r.lift ?? 0) - s * (Math.abs(n) / o) ** 2.2 * 0.35, n]);
  }
  let c = me(
    t,
    a,
    (e) => (r.thick ?? 0.006) * (0.55 + 0.45 * Math.sin(Math.PI * e)),
    0.004,
    -0.004,
  );
  e.add(c, {
    at: n,
    bone: r.bone || `head`,
    color: r.color || `#3a1a12`,
    r: 0.7,
    detail: 0.2,
    tex: `skin`,
    spec: 0.1,
    shade: 0,
    edge: 0,
    seam: 0,
    ao: !1,
    uvPhase: r.uvPhase,
  });
}
function ge(t, n, a, o, s) {
  let l = o.mat || {},
    u = Math.max(12, Math.round((o.nu || 48) * C.k)),
    d = Math.max(8, Math.round((o.nv || 24) * C.k)),
    f = [],
    m = [],
    h = [],
    g = [],
    _ = [],
    v = new c(),
    y = new c(),
    b = [0, 0];
  for (let e = 0; e <= d; e++)
    for (let t = 0; t <= u; t++) {
      let r = t / u,
        a = e / d,
        c = p(o.q0, o.q1, r),
        l = p(o.e0, o.e1, a),
        _ = M(0, 0.25, Math.min(r, 1 - r)) * M(0, 0.25, Math.min(a, 1 - a));
      (n.point(l, c, v),
        n.normal(l, c, y),
        f.push(v.x + y.x * 6e-4, v.y + y.y * 6e-4, v.z + y.z * 6e-4),
        g.push(y.x, y.y, y.z),
        n.uvAt(l, c, b),
        h.push(b[0], b[1]));
      let x = s ? s(v.clone()).clone() : new i(o.skin || `#888888`),
        S = o.fn ? o.fn(l, c, x.clone()) : x;
      (S.lerp(x, 1 - _), m.push(S.r, S.g, S.b));
    }
  for (let e = 0; e < d; e++)
    for (let t = 0; t < u; t++) {
      let n = e * (u + 1) + t,
        r = n + 1,
        i = n + u + 2,
        a = n + u + 1;
      _.push(n, r, i, n, i, a);
    }
  let x = new e();
  (x.setAttribute(`position`, new r(f, 3)),
    x.setAttribute(`uvw`, new r(h, 2)),
    x.setIndex(_),
    x.computeVertexNormals());
  {
    let e = x.attributes.normal,
      t = 0;
    for (let n = 0; n < e.count; n++)
      t +=
        e.getX(n) * g[n * 3] +
        e.getY(n) * g[n * 3 + 1] +
        e.getZ(n) * g[n * 3 + 2];
    if (t < 0) {
      let e = x.index.array;
      for (let t = 0; t < e.length; t += 3) {
        let n = e[t + 1];
        ((e[t + 1] = e[t + 2]), (e[t + 2] = n));
      }
    }
  }
  x.setAttribute(`normal`, new r(g, 3));
  let S = new i();
  t.add(x, {
    at: a,
    bone: o.bone || `head`,
    paint: (e, t, n, r) => S.setRGB(m[r * 3], m[r * 3 + 1], m[r * 3 + 2]),
    r: l.r ?? 0.55,
    detail: l.detail ?? 0.25,
    tex: l.tex || `skin`,
    ao: !0,
    aoK: l.aoK ?? ((l.tex || `skin`) === `skin` ? 0.45 : 1),
    spec: l.spec ?? 0.16,
    shade: l.shade ?? 0,
    edge: l.edge ?? 0,
    seam: 0,
    uvPhase: o.uvPhase,
    tri: l.tri,
  });
}
function _e(e, t) {
  let { S: n, R: r } = e,
    [a, o] = r,
    s = new i(t.skin),
    c = new i(t.skinDark),
    l = new i(t.blush || `#e0907a`),
    u = new i(t.lip || `#b0584a`),
    d = u.clone().lerp(s, 0.35).multiplyScalar(1.08),
    f = new i(t.shade || t.skinDark),
    p = s.clone().multiplyScalar(1.12).lerp(new i(`#fff2e4`), 0.12),
    m = new i(t.mouth || `#4a1f1a`),
    h = new i();
  return (e) => {
    let r = e.y / o,
      i = e.x / a,
      g = Math.abs(i),
      _ = M(-0.02, 0.06, e.z);
    return (
      h.copy(c).lerp(s, 0.5 + 0.5 * M(-1, 0.35, r)),
      h.lerp(c, 0.22 * M(0.45, 1.05, g) * (1 - M(0.4, 0.9, r))),
      h.lerp(l, 0.2 * G(r - (n.cheekY - 0.06), 0.15) * G(g - 0.6, 0.18) * _),
      h.lerp(
        p,
        0.4 *
          G(i, 0.07) *
          M(n.noseTop + 0.08, n.noseTop - 0.05, r) *
          M(n.noseY - 0.06, n.noseY + 0.04, r) *
          _,
      ),
      h.lerp(p, 0.22 * G(r - (n.browY + 0.1), 0.1) * M(0.8, 0.3, g) * _),
      h.lerp(f, 0.32 * G(r - (n.eyeY + 0.12), 0.07) * G(g - n.eyeX, 0.22) * _),
      h.lerp(f, 0.42 * G(r - (n.noseY - 0.1), 0.05) * G(i, 0.15) * _),
      h.lerp(f, 0.45 * M(n.bottom + 0.19, n.bottom + 0.01, r)),
      h.lerp(
        m,
        0.55 *
          G(r - (n.noseY - 0.035), 0.028) *
          G(g - n.noseW * 0.78, n.noseW * 0.34) *
          _,
      ),
      h.lerp(l, 0.3 * G(r - (n.noseY + 0.01), 0.055) * G(i, n.noseW * 1.5) * _),
      h.lerp(l, 0.26 * M(0.78, 1, g) * M(-0.62, -0.2, r) * M(0.45, 0.1, r)),
      t.lips !== !1 &&
        (h.lerp(u, 0.8 * G(r - (n.mouthY + 0.05), 0.04) * M(0.28, 0.16, g) * _),
        h.lerp(
          d,
          0.75 * G(r - (n.mouthY - 0.08), 0.045) * M(0.24, 0.13, g) * _,
        ),
        h.lerp(m, 0.7 * G(r - n.mouthY, 0.018) * M(0.3, 0.2, g) * _)),
      h
    );
  };
}
function ve(t, n, o, s = {}, l = null) {
  let { S: u, R: d } = n,
    [f, m] = d,
    h = s.bone || `head`,
    _ = s.mat || {},
    v = new i(s.iris || `#3b6a3a`),
    y = new i(s.irisHi || v.clone().lerp(new i(`#ffffff`), 0.45)),
    b = v.clone().multiplyScalar(0.3),
    x = new i(s.pupil || `#120c0a`),
    S = new i(s.white || `#f2ece4`),
    w = S.clone().multiplyScalar(0.55).lerp(new i(`#7a6a78`), 0.25),
    T = new i(s.lash || `#1e1410`),
    E = new i(s.lower || `#7a4a40`),
    D = new i(s.lid || s.lower || `#8a5a50`),
    O = new i(s.skin || `#d8a080`),
    k = (s.eyeW ?? 0.3) * f,
    A = (s.eyeH ?? 0.16) * m,
    j = (s.tilt ?? 6) / 60,
    N = s.look ?? 0.1,
    P = (e) => 0.96 * Math.max(0, 1 - e * e) ** 0.72 + j * e,
    F = (e) => -0.78 * Math.max(0, 1 - e * e) ** 0.95 + j * 0.4 * e,
    I = new c(),
    L = new c(),
    R = new c();
  for (let d of [1, -1]) {
    let z = d * (s.eyeX ?? u.eyeX),
      B = u.eyeY + (s.lat || 0),
      ee = k / f,
      te = A / m,
      V = 2 * Math.max(7, Math.round(24 * C.k)),
      ne = 2 * Math.max(6, Math.round(17 * C.k)),
      re = 1.5,
      ie = 1.55,
      ae = (e) => 0.5 * e + 0.5 * e * e * e,
      oe = (e) => 0.55 * e + 0.45 * e * e * e,
      se = [],
      ce = [],
      le = [],
      ue = [],
      H = [],
      U = [],
      W = [],
      de = [0, 0],
      K = (e, t, r, i) => {
        let a = z + d * e * ee,
          o = B + t * te;
        return (n.point(o, a, i), n.normal(o, a, L), i.addScaledVector(L, r));
      };
    for (let e = 0; e <= ne; e++)
      for (let t = 0; t <= V; t++) {
        let r = re * ae(p(-1, 1, t / V)),
          i = oe(p(-1, 1, e / ne)) * (e < ne / 2 ? 1.35 : ie),
          a = P(r),
          o = F(r),
          c =
            Math.abs(r) < 1
              ? M(0, 0.08, Math.min(a - i, i - o)) * M(1, 0.94, Math.abs(r))
              : 0,
          u = M(
            1,
            0.75,
            Math.max(Math.abs(r) / re, i >= 0 ? i / ie : i / -1.35),
          ),
          f =
            A *
            0.22 *
            Math.sqrt(Math.max(0, 1 - r * r * 0.8 - i * i * 0.5)) *
            c,
          m = z + d * r * ee,
          h = B + i * te;
        (n.point(h, m, I), n.normal(h, m, L));
        let g = 6e-4 + f * u;
        (se.push(I.x + L.x * g, I.y + L.y * g, I.z + L.z * g),
          U.push(L.x, L.y, L.z),
          W.push(c),
          n.uvAt(h, m, de),
          H.push(de[0], de[1]),
          R.set(I.x, I.y, I.z));
        let _ = l ? l(R).clone() : O.clone(),
          C = _.clone(),
          T =
            G(i - (a + 0.42), 0.16) *
            M(1.25, 0.6, Math.abs(r)) *
            (1 - c) *
            u *
            (i > 0 ? M(ie, ie * 0.62, i) : 1);
        _.lerp(D, 0.35 * T);
        let j =
          G(i - o, 0.07) *
          M(1.05, 0.2, Math.abs(r) + (r < 0 ? 0.35 : 0)) *
          (1 - c * 0.3) *
          u;
        _.lerp(E, 0.55 * j);
        let ue = _,
          K = 0;
        if (c > 0) {
          let e = (r + N) * k,
            t = (i + 0.06) * A,
            n = Math.hypot(e, t) / (A * (s.irisK ?? 0.8)),
            l = M(a - 0.8, a - 0.02, i),
            u = M(o + 0.62, o + 0.03, i),
            d = S.clone().lerp(
              w,
              Math.max(
                l * 0.95,
                Math.max(u * 0.42, M(0.7, 1, Math.abs(r)) * 0.4),
              ),
            ),
            f = s.pupilAspect ?? 1,
            p = f === 1 ? n : Math.hypot(e / f, t * f) / (A * (s.irisK ?? 0.8));
          if (n < 1.05) {
            let r = v.clone().lerp(y, M(0.1, -0.85, t / A) * 0.85);
            (r.lerp(b, M(0.6, 0.98, n)),
              r.lerp(x, M(0.52, 0.4, p)),
              r.multiplyScalar(
                1 + 0.17 * Math.sin(Math.atan2(t, e) * 15) * M(0.34, 0.9, n),
              ),
              r.multiplyScalar(1 - 0.62 * l),
              d.lerp(r, M(1.05, 0.95, n)),
              (K =
                M(1.05, 0.95, n) *
                M(0.36, 0.5, n) *
                (1 - M(0.74, 0.97, n) * 0.75) *
                (0.45 + 0.55 * M(0.5, -0.8, t / A)) *
                (1 - 0.6 * l) *
                M(0.4, 0.55, p)));
          }
          ((ue = _.lerp(d, c)), (K *= c));
        }
        (ue.lerp(C, 1 - u), ce.push(ue.r, ue.g, ue.b), le.push(K * u));
      }
    for (let e = 0; e < ne; e++)
      for (let t = 0; t < V; t++) {
        let n = e * (V + 1) + t,
          r = n + 1,
          i = n + V + 2,
          a = n + V + 1;
        d > 0 ? ue.push(n, r, i, n, i, a) : ue.push(n, i, r, n, a, i);
      }
    let q = new e();
    (q.setAttribute(`position`, new r(se, 3)),
      q.setAttribute(`uvw`, new r(H, 2)),
      q.setIndex(ue),
      q.computeVertexNormals());
    {
      let e = q.attributes.normal;
      n.normal(B, z, L);
      let t = 0;
      for (let n = 0; n < e.count; n++)
        t += e.getX(n) * L.x + e.getY(n) * L.y + e.getZ(n) * L.z;
      if (t < 0) {
        let e = q.index.array;
        for (let t = 0; t < e.length; t += 3) {
          let n = e[t + 1];
          ((e[t + 1] = e[t + 2]), (e[t + 2] = n));
        }
        q.computeVertexNormals();
      }
    }
    {
      let e = q.attributes.normal;
      for (let t = 0; t < e.count; t++) {
        let n = Math.min(1, W[t] * 1.7),
          r = p(U[t * 3], e.getX(t), n),
          i = p(U[t * 3 + 1], e.getY(t), n),
          a = p(U[t * 3 + 2], e.getZ(t), n),
          o = Math.hypot(r, i, a) || 1;
        e.setXYZ(t, r / o, i / o, a / o);
      }
    }
    let fe = new i();
    t.add(q, {
      at: o,
      bone: h,
      paint: (e, t, n, r) => fe.setRGB(ce[r * 3], ce[r * 3 + 1], ce[r * 3 + 2]),
      emit: s.glow || null,
      ei: s.glow ? (s.ei ?? 1.7) : 0,
      emitFn: s.glow ? (e, t, n) => le[n] : null,
      r: _.r ?? 0.55,
      detail: _.detail ?? 0.25,
      tex: _.tex || `skin`,
      ao: !0,
      uvPhase: s.uvPhase,
      aoK: _.aoK ?? ((_.tex || `skin`) === `skin` ? 0.45 : 1),
      spec: _.spec ?? 0.16,
      shade: _.shade ?? 0,
      edge: _.edge ?? 0,
      seam: 0,
      tri: _.tri,
    });
    let pe = [];
    for (let e = 0; e <= 10; e++) {
      let t = p(-1, 1.02, e / 10),
        n = K(t, P(t) + 0.02, A * 0.05, new c());
      pe.push([o[0] + n.x, o[1] + n.y, o[2] + n.z]);
    }
    {
      let e = K(1.2, P(1) + 0.3 + j * 0.5, A * 0.03, new c());
      pe.push([o[0] + e.x, o[1] + e.y, o[2] + e.z]);
    }
    t.add(
      xe(pe, (e) => A * 0.07 * (0.6 + M(0, 0.8, e)), {
        rz: (e) =>
          A *
          (s.lashT ?? 0.16) *
          (0.3 + 1 * M(0.05, 0.75, e)) *
          (1 - M(0.9, 1, e) * 0.8),
      }),
      {
        bone: h,
        color: T,
        r: 0.8,
        detail: 0,
        spec: 0.1,
        ao: !1,
        shade: 0,
        edge: 0,
        seam: 0,
      },
    );
    {
      let e = [];
      for (let t = 0; t <= 8; t++) {
        let n = p(-0.92, 0.98, t / 8),
          r = K(n, F(n) - 0.05, A * 0.02, new c());
        e.push([o[0] + r.x, o[1] + r.y, o[2] + r.z]);
      }
      t.add(
        xe(
          e,
          (e) =>
            A * 0.045 * (0.5 + 0.8 * Math.sin(Math.PI * Math.min(1, e * 1.15))),
          { rz: () => A * 0.075 },
        ),
        {
          bone: h,
          color: s.lower || `#8a5040`,
          r: 0.7,
          detail: 0.2,
          tex: `skin`,
          spec: 0.14,
          ao: !1,
          shade: 0,
          edge: 0,
          seam: 0,
        },
      );
    }
    {
      let e = K(-N + 0.34, 0.36, A * 0.26, new c()),
        r = A * 0.8;
      n.normal(B, z, L);
      let i = new a(1, 8, 6);
      i.scale(r * 0.15, r * 0.15, r * 0.06);
      let l = Math.atan2(L.x, L.z) / ye,
        u = -Math.asin(g(L.y, -1, 1)) / ye;
      t.add(i, {
        at: [o[0] + e.x, o[1] + e.y, o[2] + e.z],
        rot: [u, l, 0],
        order: `YXZ`,
        bone: h,
        color: `#ffffff`,
        emit: `#ffffff`,
        ei: s.catch ?? 1.5,
        r: 0.1,
        detail: 0,
        ao: !1,
        shade: 0,
        edge: 0,
        seam: 0,
      });
      let d = K(-N - 0.22, -0.3, A * 0.24, new c()),
        f = new a(1, 7, 5);
      (f.scale(r * 0.075, r * 0.075, r * 0.05),
        t.add(f, {
          at: [o[0] + d.x, o[1] + d.y, o[2] + d.z],
          rot: [u, l, 0],
          order: `YXZ`,
          bone: h,
          color: `#eef4ff`,
          emit: `#cfe0ff`,
          ei: (s.catch ?? 1.5) * 0.35,
          r: 0.1,
          detail: 0,
          ao: !1,
          shade: 0,
          edge: 0,
          seam: 0,
        }));
    }
    if (s.brow !== null) {
      let e = s.browW ?? 0.36,
        r = [];
      for (let t = 0; t < 11; t++) {
        let n = t / 10,
          i = d * p(0.1, 0.1 + e * 1.62, n),
          a =
            u.browY +
            0.035 +
            (s.browLift ?? 0) +
            Math.sin(Math.PI * g(n * 0.95 + 0.06, 0, 1)) * 0.055 -
            (s.browTilt ?? 0.06) * (n - 0.35);
        r.push([a, i]);
      }
      let i = (e) =>
          A *
          (s.browT ?? 0.3) *
          (1.15 - e * 0.55) *
          (0.5 + 0.5 * Math.sin(Math.PI * Math.min(1, e * 1.5 + 0.22))) *
          (1 - 0.88 * M(0.72, 1, e)),
        a = s.browHi || null;
      t.add(
        me(n, r, i, (e) => A * 0.085 * (1.1 - e * 0.5), A * 0.01),
        {
          at: o,
          bone: h,
          grad: a ? [s.brow || `#4a2a18`, a] : null,
          color: a ? void 0 : s.brow || `#4a2a18`,
          gradAxis: `y`,
          r: 0.85,
          detail: 0.5,
          tex: `hair`,
          spec: 0.1,
          shade: 0,
          edge: 0,
          seam: 0,
        },
      );
      let c = Math.max(
        0,
        Math.round((s.browHairs || 0) * (C.k === 1 ? 1 : 0.5)),
      );
      for (let e = 0; e < c; e++) {
        let l = be(e * 3.7 + 1.3),
          u = be(e * 8.1 + 5.9),
          d = be(e * 2.3 + 9.1),
          f = (e / Math.max(1, c - 1) - 0.5) * 2,
          p = r.map(([e, t], n) => {
            let a = n / (r.length - 1);
            return [
              e +
                (f * i(a) * 0.62) / m +
                (l - 0.5) * 0.012 +
                Math.sin(a * 3.1 + u * 6) * 0.006,
              t * (0.86 + 0.26 * d),
            ];
          });
        t.add(
          me(
            n,
            p,
            (e) =>
              A *
              0.055 *
              (1 - e * 0.55) *
              (0.55 + 0.9 * u) *
              (1 - 0.9 * M(0.6 + d * 0.3, 1, e)),
            (e) => A * 0.05 * (1.1 - e * 0.5),
            A * (0.05 + 0.03 * l),
          ),
          {
            at: o,
            bone: h,
            grad: [s.brow || `#4a2a18`, a || `#8a5030`],
            gradAxis: `y`,
            r: 0.72,
            detail: 0.9,
            tex: `hair`,
            spec: 0.22,
            shade: 0,
            edge: 0,
            seam: 0,
          },
        );
      }
    }
  }
}
var ye = Math.PI / 180,
  be = (e) => {
    let t = Math.sin(e * 127.1 + 311.7) * 43758.5453;
    return t - Math.floor(t);
  };
function xe(t, i, a = {}) {
  let o = t.map((e) => new c(...e)),
    s = new n(o).getPoints(Math.max(8, o.length * 3)),
    l = [],
    u = [],
    d = new c(0, 0, 1);
  for (let e = 0; e < s.length; e++) {
    let t = e / (s.length - 1),
      n = s[Math.max(0, e - 1)],
      r = s[Math.min(s.length - 1, e + 1)].clone().sub(n).normalize(),
      o = d.clone().sub(r.clone().multiplyScalar(d.dot(r)));
    (o.lengthSq() < 1e-8 && o.set(0, 1, 0), o.normalize(), d.copy(o));
    let u = new c().crossVectors(r, o),
      f = Math.max(1e-5, i(t)),
      p = a.rz ? Math.max(1e-5, a.rz(t)) : f;
    for (let t = 0; t <= 6; t++) {
      let n = (t / 6) * Math.PI * 2,
        r = Math.cos(n) * f,
        i = Math.sin(n) * p;
      l.push(
        s[e].x + o.x * r + u.x * i,
        s[e].y + o.y * r + u.y * i,
        s[e].z + o.z * r + u.z * i,
      );
    }
  }
  for (let e = 0; e < s.length - 1; e++)
    for (let t = 0; t < 6; t++) {
      let n = e * 7 + t,
        r = n + 1,
        i = n + 6 + 2,
        a = n + 6 + 1;
      u.push(n, r, i, n, i, a);
    }
  let f = new e();
  return (
    f.setAttribute(`position`, new r(l, 3)),
    f.setIndex(u),
    f.computeVertexNormals(),
    f
  );
}
var J = {
    under: `#4a2f1d`,
    leather: `#7a4722`,
    leatherDark: `#3d2210`,
    skin: `#dc9260`,
    skinDark: `#a2552c`,
    stone: `#6f86a6`,
    stoneDark: `#33414f`,
    basalt: `#232833`,
    bronze: `#8e5019`,
    bronzeHi: `#d9933d`,
    ember: `#ff8a2a`,
    emberHot: `#ffd07a`,
    fur: `#c7a978`,
    furDark: `#6c5528`,
    beard: `#e87a34`,
    beardDark: `#9c4212`,
    cloth: `#9c3d18`,
    clothDark: `#57200c`,
    trim: `#f0842c`,
    helm: `#eef4ff`,
    helmLo: `#b6c8e6`,
    helmDeep: `#5f7186`,
  },
  Y = {
    hipY: 1.04,
    hipX: 0.17,
    hipDrop: 0.03,
    thigh: 0.45,
    shin: 0.45,
    spineOff: 0.08,
    spine: 0.28,
    chest: 0.44,
    neck: 0.1,
    neckZ: 0.02,
    clavX: 0.1,
    clavY: 0.33,
    shoulderX: 0.3,
    upperArm: 0.36,
    foreArm: 0.34,
  },
  Se = [0, 2.06, 0.035],
  Ce = [0.135, 0.155, 0.14];
function we(e) {
  let t = F(e),
    n = (e, n, r, i, a) => t.push({ name: e, parent: n, pos: [r, i, a] });
  (n(`weaponR`, `handR`, 0, -0.08, 0),
    n(`tabF1`, `hips`, 0, 0.02, 0.23),
    n(`tabF2`, `tabF1`, 0, -0.2, 0.02),
    n(`tabF3`, `tabF2`, 0, -0.2, 0.01));
  for (let [e, t] of [
    [`L`, 0.09],
    [`R`, -0.09],
  ])
    (n(`tabB${e}1`, `hips`, t, 0.02, -0.21),
      n(`tabB${e}2`, `tabB${e}1`, t * 0.1, -0.21, -0.02),
      n(`tabB${e}3`, `tabB${e}2`, t * 0.1, -0.21, -0.01));
  return (
    n(`beard1`, `head`, 0, -0.13, 0.17),
    n(`beard2`, `beard1`, 0, -0.13, 0.03),
    t
  );
}
function Te(t, n, a) {
  let o = { r: 0.86, m: 0, detail: 1, tex: `stone` },
    s = { r: 0.34, m: 0.85, detail: 0.8, tex: `metal` },
    c = { r: 0.72, m: 0, detail: 0.9, tex: `leather` },
    l = { r: 0.55, m: 0, detail: 0.6, tex: `skin` },
    u = { r: 0.95, detail: 1, tex: `fur` };
  (t.add(
    y(
      [
        { p: [0, 0.9, 0], rx: 0.17, rz: 0.13 },
        { p: [0, 1, 0], rx: 0.25, rz: 0.18 },
        { p: [0, 1.16, 0], rx: 0.27, rz: 0.19 },
        { p: [0, 1.32, 0.01], rx: 0.3, rz: 0.2 },
        { p: [0, 1.5, 0.02], rx: 0.35, rz: 0.23 },
        { p: [0, 1.66, 0.02], rx: 0.36, rz: 0.23 },
        { p: [0, 1.78, 0], rx: 0.29, rz: 0.19 },
        { p: [0, 1.88, 0.01], rx: 0.14, rz: 0.12 },
      ],
      { seg: 20, start: 0.6, end: 0.4 },
    ),
    {
      chain: [`hips`, `spine`, `chest`, `neck`],
      bw: 0.1,
      grad: [J.leatherDark, J.under],
      ...c,
    },
  ),
    t.add(
      y(
        [
          { p: [0, 1.25, 0.012], rx: 0.305, rz: 0.215, e: 2.4 },
          { p: [0, 1.4, 0.02], rx: 0.335, rz: 0.235, e: 2.4 },
          { p: [0, 1.56, 0.03], rx: 0.375, rz: 0.255, e: 2.5 },
          { p: [0, 1.7, 0.025], rx: 0.37, rz: 0.245, e: 2.5 },
          { p: [0, 1.8, 0], rx: 0.3, rz: 0.2, e: 2.2 },
          { p: [0, 1.85, 0], rx: 0.2, rz: 0.15 },
        ],
        {
          seg: 28,
          start: 0,
          end: 0,
          radial: ee([
            [0.5, 55, 0.2, 30, 0.05],
            [0.5, 125, 0.2, 30, 0.05],
            [0.45, 270, 0.25, 25, 0.04],
          ]),
        },
      ),
      {
        chain: [`spine`, `chest`],
        bw: 0.12,
        grad: [J.bronze, J.bronzeHi],
        gradEase: !0,
        ...s,
      },
    ));
  for (let [e, n, r] of [
    [1.255, 0.307, 0.217],
    [1.845, 0.205, 0.155],
  ])
    t.add(d(1, 0.022, { seg: 28, tube: 6 }), {
      at: [0, e, e > 1.5 ? 0 : 0.012],
      rot: [90, 0, 0],
      scale: [n, r, 1],
      chain: [`spine`, `chest`],
      bw: 0.05,
      color: J.bronzeHi,
      ...s,
    });
  let m = T(
    [
      [-0.19, -0.14],
      [0.19, -0.14],
      [0.23, 0.05],
      [0.14, 0.2],
      [-0.14, 0.2],
      [-0.23, 0.05],
    ],
    0.07,
    { bevel: 0.025, smooth: !1 },
  );
  (t.add(m, {
    at: [0, 1.56, 0.255],
    rot: [-8, 0, 0],
    bone: `chest`,
    grad: [J.stoneDark, J.stone],
    ...o,
    edge: 1.5,
  }),
    t.add(
      T(
        [
          [0, 0.075],
          [0.05, 0],
          [0, -0.085],
          [-0.05, 0],
        ],
        0.04,
        { bevel: 0.015 },
      ),
      {
        at: [0, 1.57, 0.3],
        rot: [-8, 0, 0],
        bone: `chest`,
        color: J.emberHot,
        emit: J.ember,
        ei: 2.1,
        r: 0.3,
        detail: 0,
        ao: !1,
      },
    ),
    t.glowCard(`chest`, [0, 1.57, 0.33], 0.3, J.ember, 0.45));
  for (let e of [
    [
      [0, 1.655, 0.305],
      [0.03, 1.69, 0.3],
      [0.015, 1.73, 0.29],
    ],
    [
      [0.045, 1.57, 0.305],
      [0.1, 1.6, 0.3],
      [0.16, 1.58, 0.285],
    ],
    [
      [-0.04, 1.55, 0.305],
      [-0.09, 1.5, 0.3],
      [-0.08, 1.45, 0.29],
      [-0.13, 1.42, 0.28],
    ],
    [
      [0.02, 1.48, 0.303],
      [0.05, 1.44, 0.296],
    ],
  ])
    ne(t, e, 0.016, J.emberHot, {
      bone: `chest`,
      emit: J.ember,
      ei: 2.2,
      hint: [0, 0, 1],
      curve: !1,
    });
  for (let [e, n, r] of [
    [1.19, 0.285, 0.2],
    [1.27, 0.3, 0.212],
  ])
    t.add(d(1, 0.035, { seg: 26, tube: 6 }), {
      at: [0, e, 0.01],
      rot: [90, 0, 0],
      scale: [n, r, 1.1],
      chain: [`spine`, `chest`],
      color: J.bronze,
      ...s,
    });
  t.add(
    b(
      [
        [1.045, 0.286, 0.21, 2.3],
        [1.09, 0.294, 0.218],
        [1.135, 0.286, 0.21],
      ],
      { seg: 28, start: 0, end: 0 },
    ),
    {
      bone: `hips`,
      grad: [R, L],
      gradEase: !0,
      team: 1,
      r: 0.7,
      tex: `leather`,
      detail: 0.6,
    },
  );
  for (let e of [1.04, 1.14])
    t.add(d(1, 0.022, { seg: 28, tube: 6 }), {
      at: [0, e, 0],
      rot: [90, 0, 0],
      scale: [0.29, 0.214, 1],
      bone: `hips`,
      color: J.leatherDark,
      ...c,
    });
  (t.add(
    b(
      [
        [-0.03, 0.085, 0.085, 2],
        [0, 0.1, 0.1],
        [0.03, 0.07, 0.07],
      ],
      { seg: 18, start: `flat`, end: `flat` },
    ),
    {
      at: [0, 1.09, 0.215],
      rot: [90, 0, 0],
      bone: `hips`,
      color: J.bronzeHi,
      ...s,
    },
  ),
    t.add(
      T(
        [
          [0, 0.04],
          [0.035, 0],
          [0, -0.045],
          [-0.035, 0],
        ],
        0.02,
        { bevel: 0.008 },
      ),
      { at: [0, 1.09, 0.255], bone: `hips`, color: J.stone, ...o },
    ));
  for (let e = 0; e < 14; e++) {
    let n = (e / 14) * Math.PI * 2;
    (Math.abs(Math.cos(n)) > 0.93 && Math.sin(n) > 0) ||
      t.add(v(0.017, 0.017, 0.012, { rings: 5, seg: 8 }), {
        at: [Math.sin(n) * 0.292, 1.09, Math.cos(n) * 0.216],
        rot: [0, (n / Math.PI) * 180, 0],
        bone: `hips`,
        color: J.bronzeHi,
        ...s,
      });
  }
  for (let e = 0; e < 12; e++) {
    let n = (e / 12) * Math.PI * 2;
    t.add(v(0.014, 0.014, 0.01, { rings: 5, seg: 8 }), {
      at: [Math.sin(n) * 0.312, 1.257, 0.012 + Math.cos(n) * 0.222],
      rot: [0, (n / Math.PI) * 180, 0],
      chain: [`spine`, `chest`],
      bw: 0.05,
      color: J.bronzeHi,
      ...s,
    });
  }
  t.add(
    v(0.13, 0.15, 0.17, {
      fn: (e) => {
        e.x < 0 && (e.x *= 0.25);
      },
    }),
    {
      at: [0.25, 0.98, 0],
      rot: [0, 0, 12],
      skin: (e, t) => [
        [t.index(`hips`), 0.55],
        [t.index(`thighL`), 0.45],
      ],
      grad: [J.stoneDark, J.stone],
      mirror: !0,
      ...o,
    },
  );
  let h = (e, n, r, i, a) => {
    let o = N(e, n, 0.03, {
      seg: 10,
      samples: 10,
      radial: W(2, 0.1, i, 1, 0.2),
    });
    (_(o, (e) => {
      e.y < a + 0.08 && (e.y += de(e.x, i, 0.05, 4) * M(a + 0.08, a, e.y));
    }),
      t.add(o, {
        ...r,
        paint: (e, t) =>
          t.y < a + 0.09 ? J.trim : t.y > 1.02 ? J.clothDark : J.cloth,
        r: 0.8,
        detail: 1,
        tex: `cloth`,
      }));
  };
  h(
    [
      [0, 1.1, 0.215],
      [0, 0.95, 0.235],
      [0, 0.78, 0.25],
      [0, 0.56, 0.25],
    ],
    (e) => 0.3 - e * 0.06,
    { chain: [`tabF1`, `tabF2`, `tabF3`], bw: 0.08 },
    1.3,
    0.56,
  );
  for (let [e, t] of [
    [`L`, 0.09],
    [`R`, -0.09],
  ])
    h(
      [
        [t, 1.1, -0.19],
        [t * 1.05, 0.94, -0.215],
        [t * 1.1, 0.74, -0.235],
        [t * 1.12, 0.5, -0.24],
      ],
      (e) => 0.17 - e * 0.02,
      { chain: [1, 2, 3].map((t) => `tabB${e}${t}`), bw: 0.08 },
      t * 30,
      0.5,
    );
  let g = ee([
    [0.16, 90, 0.12, 50, 0.08],
    [0.2, 0, 0.14, 40, 0.05],
    [0.25, 270, 0.14, 50, 0.05],
    [0.62, 270, 0.1, 45, 0.1],
  ]);
  te(
    t,
    a,
    [`thighL`, `shinL`, `footL`],
    [
      [0, 0.155, 0.165],
      [0.1, 0.165, 0.17],
      [0.28, 0.15, 0.155],
      [0.46, 0.118, 0.125],
      [0.58, 0.125, 0.135],
      [0.76, 0.1, 0.105],
      [0.94, 0.085, 0.09],
    ],
    {
      from: [0, 0.06, 0],
      seg: 13,
      rings: 14,
      start: 0,
      end: 0,
      color: J.leather,
      radial: g,
      mirror: !0,
      ...c,
    },
  );
  let x = ue(0.1, 0.07, 0.12, {
    thick: 0.02,
    lat0: -10,
    seg: 12,
    rings: 4,
    rimR: 0.012,
    innerSeg: 8,
    innerRings: 2,
  });
  for (let [e, n] of [
    [x.outer, { grad: [J.stoneDark, J.stone], ...o }],
    [x.inner, { color: J.leatherDark, ...c }],
    [x.rim, { color: J.bronze, ...s }],
  ])
    t.add(e, {
      at: [0.17, 0.58, 0.07],
      rot: [80, 0, 0],
      bone: `shinL`,
      mirror: !0,
      ...n,
    });
  (t.add(v(0.028, 0.028, 0.02), {
    at: [0.17, 0.59, 0.175],
    bone: `shinL`,
    color: J.bronzeHi,
    mirror: !0,
    ...s,
  }),
    t.add(
      b(
        [
          [0.1, 0.12, 0.13, 3],
          [0.26, 0.128, 0.135, 3],
          [0.42, 0.135, 0.14, 3],
          [0.45, 0.12, 0.125, 3],
        ],
        { seg: 16, start: `flat`, end: `flat` },
      ),
      {
        at: [0.17, 0, 0.005],
        chain: [`shinL`, `footL`],
        bw: 0.03,
        grad: [J.leatherDark, J.leather],
        mirror: !0,
        ...c,
      },
    ));
  let C = d(1, 0.04, { seg: 20, tube: 6 });
  (_(C, (e) => {
    let t = Math.atan2(e.y, e.x);
    e.z *= 1 + 0.4 * Math.sin(t * 11);
  }),
    t.add(C, {
      at: [0.17, 0.43, 0.005],
      rot: [90, 0, 0],
      scale: [0.145, 0.15, 1],
      bone: `shinL`,
      grad: [J.furDark, J.fur],
      mirror: !0,
      ...u,
    }),
    t.add(
      y(
        [
          { p: [0, 0.07, -0.12], rx: 0.095, rz: 0.07, e: 3 },
          { p: [0, 0.075, -0.02], rx: 0.115, rz: 0.085, e: 3 },
          { p: [0, 0.07, 0.12], rx: 0.115, rz: 0.075, e: 3 },
          { p: [0, 0.06, 0.22], rx: 0.1, rz: 0.06, e: 3 },
        ],
        { seg: 14, start: 0.3, end: 0.8, hint: [0, 1, 0] },
      ),
      {
        at: [0.17, 0, 0],
        bone: `footL`,
        grad: [J.leatherDark, J.leather],
        mirror: !0,
        ...c,
      },
    ),
    t.add(
      v(0.1, 0.05, 0.085, {
        fn: (e) => {
          e.y < 0 && (e.y *= 0.2);
        },
      }),
      {
        at: [0.17, 0.09, 0.16],
        bone: `footL`,
        grad: [J.stoneDark, J.stone],
        mirror: !0,
        ...o,
      },
    ),
    ie(t, [0.17, 0, 0.02], 1, 1.28, {
      bone: `footL`,
      mirror: !0,
      w: 0.092,
      toe: 0.165,
      heel: 0.108,
      soleH: 0.022,
      proud: 0.011,
      stitch: 15,
      capH: 0.03,
      mat: { grad: [J.leatherDark, J.leather], ...c },
      soleMat: { color: `#2a180e`, ...c, r: 0.85 },
      toeMat: { color: J.leather, ...c },
      heelMat: { color: `#2a180e`, ...c },
    }),
    se(t, [0.17, 0.108, 0.005], 0.126, 0.132, {
      chain: [`shinL`, `footL`],
      bw: 0.03,
      mirror: !0,
      bead: 0.012,
      seg: 18,
      studs: 8,
      studR: 0.013,
      studH: 0.009,
      studY: 0.006,
      mat: { color: J.leatherDark, ...c },
      studMat: { color: J.bronzeHi, ...s },
    }));
  let E = ee([
    [0.05, 0, 0.1, 80, 0.1],
    [0.28, 90, 0.11, 45, 0.12],
    [0.25, 270, 0.12, 50, 0.09],
    [0.6, 40, 0.1, 55, 0.09],
    [0.47, 90, 0.04, 40, -0.05],
  ]);
  (te(
    t,
    a,
    [`armL`, `foreL`, `handL`],
    [
      [0, 0.12, 0.12],
      [0.1, 0.14, 0.145],
      [0.3, 0.13, 0.135],
      [0.48, 0.1, 0.105],
      [0.62, 0.118, 0.125],
      [0.88, 0.09, 0.095],
      [1, 0.085, 0.09],
    ],
    {
      from: [0, 0.06, 0],
      seg: 15,
      rings: 13,
      start: 0.3,
      end: 0,
      grad: [J.skinDark, J.skin],
      radial: E,
      mirror: !0,
      ...l,
      aoK: 0.8,
    },
  ),
    t.add(
      b(
        [
          [1.06, 0.118, 0.125, 3.2],
          [1.18, 0.13, 0.138, 3.2],
          [1.3, 0.132, 0.138, 3.2],
        ],
        { seg: 16, start: `flat`, end: `flat`, radial: W(5, 0.03, 1, 0, 1) },
      ),
      {
        at: [0.4, 0, 0],
        bone: `foreL`,
        grad: [J.stoneDark, J.stone],
        mirror: !0,
        ...o,
      },
    ));
  for (let e of [1.075, 1.29])
    t.add(d(1, 0.02, { seg: 16, tube: 5 }), {
      at: [0.4, e, 0],
      rot: [90, 0, 0],
      scale: [0.132, 0.14, 1],
      bone: `foreL`,
      color: J.bronzeHi,
      mirror: !0,
      ...s,
    });
  (ne(
    t,
    [
      [0.4, 1.12, 0.137],
      [0.41, 1.18, 0.14],
      [0.398, 1.25, 0.14],
    ],
    0.016,
    J.emberHot,
    { bone: `foreL`, emit: J.ember, ei: 2, hint: [0, 0, 1], mirror: !0 },
  ),
    t.add(d(1, 0.03, { seg: 16, tube: 6 }), {
      at: [0.4, 1.02, 0.005],
      rot: [90, 0, 0],
      scale: [0.1, 0.105, 1],
      bone: `handL`,
      color: J.leatherDark,
      mirror: !0,
      ...c,
    }),
    t.add(
      b(
        [
          [1.52, 0.142, 0.15],
          [1.58, 0.15, 0.158],
          [1.64, 0.146, 0.154],
        ],
        { seg: 18, start: 0, end: 0, radial: W(4, 0.05, 1.3, 0, 1) },
      ),
      {
        at: [0.4, 0, 0],
        bone: `armL`,
        grad: [R, L],
        gradEase: !0,
        team: 0.7,
        r: 0.8,
        tex: `cloth`,
        detail: 0.5,
        mirror: !0,
      },
    ));
  let D = {
    mat: { grad: [J.skinDark, J.skin], ...l },
    nail: `#efd3b4`,
    creaseMat: { color: `#7a4228`, ...l },
    webMat: { color: J.skinDark, ...l },
    guard: { color: J.bronze, ...s },
    cuff: {
      studs: 6,
      mat: { grad: [J.bronze, J.bronzeHi], ...s },
      studMat: { color: J.bronzeHi, ...s },
    },
  };
  (re(t, [0.4, 1.03, 0.005], 1, 1.3, {
    bone: `handL`,
    curl: 0.62,
    thumb: 0.5,
    fat: 1.12,
    ...D,
  }),
    re(t, [-0.4, 1.03, 0.005], -1, 1.3, {
      bone: `handR`,
      curl: 0.97,
      thumb: 0.9,
      fat: 1.12,
      ...D,
    }));
  let O = [0.425, 1.7, 0],
    A = (e, t) => [
      [t.index(`clavL`), 0.55],
      [t.index(`armL`), 0.45],
    ],
    P = ue(0.205, 0.175, 0.205, {
      thick: 0.032,
      lat0: -12,
      seg: 24,
      rings: 9,
      rimR: 0.024,
      radial: (e, t) => 1 + 0.035 * Math.sin(t * 5 + 1),
    });
  (t.add(P.outer, {
    at: O,
    rot: [0, 0, -16],
    skin: A,
    grad: [J.stoneDark, J.stone],
    gradEase: !0,
    mirror: !0,
    ...o,
    edge: 1.4,
  }),
    t.add(P.inner, {
      at: O,
      rot: [0, 0, -16],
      skin: A,
      color: J.leatherDark,
      mirror: !0,
      ...c,
    }),
    t.add(P.rim, {
      at: O,
      rot: [0, 0, -16],
      skin: A,
      color: J.bronzeHi,
      mirror: !0,
      ...s,
    }),
    se(t, [0.425, 1.658, 0], 0.211, 0.211, {
      skin: A,
      mirror: !0,
      bead: 0,
      seg: 22,
      flare: 0.085,
      flareH: 0.048,
      studs: 11,
      studR: 0.0145,
      studH: 0.01,
      studY: -0.005,
      tilt: 0,
      lipMat: { grad: [J.stoneDark, J.stone], ...o },
      studMat: { color: J.bronzeHi, ...s },
    }));
  let F = ue(0.2, 0.09, 0.208, {
      thick: 0.024,
      lat0: -20,
      seg: 20,
      rings: 5,
      rimR: 0.017,
    }),
    I = [0.475, 1.558, 0];
  (t.add(F.outer, {
    at: I,
    rot: [0, 0, -34],
    skin: A,
    grad: [J.bronze, J.bronzeHi],
    mirror: !0,
    ...s,
  }),
    t.add(F.inner, {
      at: I,
      rot: [0, 0, -34],
      skin: A,
      color: J.leatherDark,
      mirror: !0,
      ...c,
    }),
    t.add(F.rim, {
      at: I,
      rot: [0, 0, -34],
      skin: A,
      color: J.bronzeHi,
      mirror: !0,
      ...s,
    }),
    t.add(k(0.062, 0.2, { seg: 9, rz: 0.05 }), {
      at: [0.45, 1.83, -0.07],
      rot: [-38, 0, -52],
      skin: A,
      grad: [J.stone, J.stoneDark],
      mirror: !0,
      ...o,
    }),
    t.add(k(0.04, 0.12, { seg: 8 }), {
      at: [0.39, 1.855, 0.07],
      rot: [16, 0, -44],
      skin: A,
      grad: [J.stone, J.stoneDark],
      mirror: !0,
      ...o,
    }));
  let z = (e) =>
    ne(
      t,
      e.map(([e, t]) => {
        let n = V([0, 0, 0], 0.209, 0.179, 0.209, e, t, 0.004),
          r = (-16 * Math.PI) / 180;
        return [
          O[0] + n[0] * Math.cos(r) - n[1] * Math.sin(r),
          O[1] +
            0.175 * Math.sin((12 * Math.PI) / 180) +
            n[0] * Math.sin(r) +
            n[1] * Math.cos(r),
          n[2],
        ];
      }),
      0.02,
      J.emberHot,
      { skin: A, emit: J.ember, ei: 2.4, mirror: !0, hint: [0, 1, 0] },
    );
  (z([
    [10, 10],
    [30, 40],
    [45, 55],
    [60, 95],
  ]),
    z([
      [25, 140],
      [42, 120],
      [55, 150],
    ]),
    t.glowCard(`clavL`, [0.445, 1.8, 0.05], 0.26, J.ember, 0.3, {
      mirror: !0,
    }));
  let B = d(1, 0.1, { seg: 28, tube: 7 });
  (_(B, (e) => {
    let t = Math.atan2(e.y, e.x),
      n = 0.6 + 0.55 * Math.sin(t * 2 + 0.9);
    e.z *= 1 + 0.4 * Math.sin(t * 5 + 0.4) * n * 0.5;
    let r = 1 + 0.1 * Math.sin(t * 6 + 1.7) * n + 0.05 * Math.cos(t * 3.5);
    ((e.x *= r), (e.y *= r));
  }),
    t.add(B, {
      at: [0, 1.83, -0.01],
      rot: [90, 0, 0],
      scale: [0.27, 0.22, 0.9],
      chain: [`chest`, `neck`],
      bw: 0.05,
      grad: [J.furDark, J.fur],
      ...u,
    }));
  let oe = pe(Ce, { ...fe.heroic, browY: 0.22, brow: 0.13 }),
    le = _e(oe, {
      skin: J.skin,
      skinDark: J.skinDark,
      blush: `#d9785a`,
      lip: `#9a4a36`,
      shade: `#7a4430`,
      mouth: `#3a160c`,
    });
  t.add(oe.geo, {
    at: Se,
    bone: `head`,
    paint: le,
    ...l,
    detail: 0.3,
    shade: 0,
  });
  let H = t.lastPhase;
  (ve(
    t,
    oe,
    Se,
    {
      iris: `#e8943a`,
      irisHi: `#ffd07a`,
      pupil: `#140a04`,
      glow: J.ember,
      ei: 1.5,
      white: `#f0d6b0`,
      lash: `#2a1208`,
      brow: `#8a3a18`,
      lower: `#7a4430`,
      eyeW: 0.26,
      eyeH: 0.13,
      browW: 0.44,
      browT: 0.32,
      browTilt: -0.1,
      browLift: -0.075,
      tilt: -3,
      look: 0.05,
      catch: 1.75,
      mat: { ...l, detail: 0.3 },
      uvPhase: H,
    },
    le,
  ),
    he(t, oe, Se, {
      width: 0.4,
      color: `#3a1610`,
      thick: 0.0085,
      lift: 0.02,
      uvPhase: H,
    }));
  for (let e of [1, -1])
    t.glowCard(`head`, [e * 0.054, 2.08, 0.16], 0.09, J.emberHot, 0.7);
  for (let e of [1, -1])
    t.add(v(0.022, 0.04, 0.018), {
      at: [e * 0.132, 2.05, 0.02],
      rot: [0, 0, e * -10],
      bone: `head`,
      grad: [J.skinDark, J.skin],
      ...l,
    });
  let U = {
    bone: `head`,
    grad: [J.beardDark, J.beard],
    r: 0.9,
    detail: 1,
    tex: `hair`,
  };
  for (let e = 0; e < 7; e++) {
    let n = -78 + e * 26 + (S(e * 4.3 + 0.7) - 0.5) * 9,
      r =
        (0.16 + 0.09 * Math.cos((n * Math.PI) / 180)) *
        (0.8 + 0.4 * S(e * 2.7 + 1.1)),
      i = V(Se, Ce[0], Ce[1], Ce[2], -41 - Math.abs(n) * 0.12, n, -0.005);
    ae(
      t,
      [
        i,
        [i[0] * 1.08, i[1] - r * 0.4, i[2] + 0.05],
        [i[0] * 0.9, i[1] - r * 0.8, i[2] + 0.06],
        [i[0] * 0.7, i[1] - r, i[2] + 0.03],
      ],
      0.058 * (0.86 + 0.3 * S(e * 6.9 + 2.3)),
      {
        twist: (e % 2 ? 1 : -1) * (28 + 28 * S(e * 3.1)),
        thick: 0.55,
        taper: 0.7,
        seg: 6,
        samples: 8,
        mat: U,
      },
    );
  }
  for (let [e, n, r, i, a] of [
    [1, 1, 700, 0, [1.76, 1.69]],
    [-1, 0.86, -520, 0.012, [1.78]],
  ]) {
    let o = [];
    for (let t = 0; t <= 5; t++) {
      let r = t / 5;
      o.push([
        e * (0.05 + r * 0.02) + i * r * r,
        1.88 - r * 0.24 * n,
        0.21 + r * 0.02,
      ]);
    }
    t.add(
      j(o, (t) => 0.036 * (1 - t * 0.4) * (e > 0 ? 1 : 0.92), {
        seg: 8,
        samples: 18,
        twist: (e) => e * r,
        radial: (e, t) => 1 + 0.2 * Math.abs(Math.sin(e * 22 + t)) - 0.08,
        start: 0.5,
        end: 0.6,
      }),
      {
        chain: [`beard1`, `beard2`],
        bw: 0.06,
        grad: [J.beardDark, J.beard],
        r: 0.9,
        detail: 1,
        tex: `hair`,
      },
    );
    for (let n of a)
      t.add(d(1, 0.011, { seg: 12, tube: 5 }), {
        at: [e * (0.05 + ((1.88 - n) / 0.24) * 0.02), n, 0.22],
        rot: [80, 0, 0],
        scale: [0.034, 0.032, 1],
        chain: [`beard1`, `beard2`],
        bw: 0.02,
        color: J.bronzeHi,
        ...s,
      });
  }
  ae(
    t,
    [
      [-0.085, 1.845, 0.2],
      [-0.115, 1.79, 0.215],
      [-0.1, 1.735, 0.2],
      [-0.13, 1.69, 0.185],
    ],
    0.026,
    {
      twist: -70,
      thick: 0.6,
      taper: 0.7,
      samples: 10,
      mat: {
        chain: [`beard1`, `beard2`],
        bw: 0.06,
        grad: [J.beardDark, J.beard],
        r: 0.9,
        detail: 1,
        tex: `hair`,
      },
    },
  );
  for (let e of [1, -1])
    ae(
      t,
      [
        [e * 0.018, 2.022, 0.162],
        [e * 0.076, 2.018, 0.154],
        [e * 0.122, 2, 0.128],
        [e * 0.146, 1.968, 0.1],
        [e * 0.142, 1.938, 0.082],
      ],
      0.018,
      { twist: e * 30, thick: 0.8, taper: 0.45, samples: 12, mat: U },
    );
  let G = ue(0.178, 0.194, 0.187, {
      thick: 0.02,
      lat0: -2,
      seg: 26,
      rings: 9,
      rimR: 0.026,
    }),
    K = { at: [0, 2.114, 0.025], rot: [-6, 0, 0], bone: `head` },
    q = new i(`#f0a868`),
    me = new i(J.helmLo),
    ge = new i(J.helm),
    ye = new i();
  (t.add(G.outer, {
    ...K,
    paint: (e) =>
      ye
        .copy(me)
        .lerp(ge, M(0, 0.19, e.y))
        .lerp(q, 0.42 * M(0.034, 0, e.y)),
    ...s,
    r: 0.24,
    m: 0.45,
    spec: 1.15,
    detail: 0.55,
    edge: 1.5,
  }),
    t.add(G.inner, { ...K, color: J.leatherDark, ...c }),
    t.add(G.rim, { ...K, color: J.bronzeHi, ...s }));
  {
    let e = b(
      [
        [-0.056, 0.139, 0.146, 2.2],
        [-0.03, 0.146, 0.153],
        [-0.004, 0.153, 0.16],
        [0.012, 0.155, 0.163],
      ],
      { seg: 22, start: 0, end: 0, arc: [138, 402] },
    );
    t.add(e, {
      ...K,
      paint: (e) =>
        Math.sin(Math.atan2(e.z, e.x) * 11) > 0.55
          ? J.under
          : e.y > -0.02
            ? J.leather
            : J.leatherDark,
      r: 0.9,
      detail: 0.9,
      tex: `cloth`,
      edge: 0.6,
    });
    let n = b(
      [
        [-0.056, 0.132, 0.139, 2.2],
        [0.012, 0.148, 0.156],
      ],
      { seg: 14, start: 0, end: 0, arc: [138, 402], flipNormals: !0 },
    );
    t.add(n, { ...K, color: J.under, ...c });
    let r = [];
    for (let e = 0; e <= 18; e++) {
      let t = (p(138, 402, e / 18) * Math.PI) / 180;
      r.push([Math.cos(t) * 0.141, -0.05, Math.sin(t) * 0.148]);
    }
    ce(
      t,
      r.map((e) => [e[0], e[1] + K.at[1], e[2] + K.at[2]]),
      {
        bone: `head`,
        r: 0.007,
        stitch: 12,
        up: [0, 1, 0],
        mat: { color: J.leatherDark, ...c },
        stitchMat: { color: J.bronzeHi, ...s },
      },
    );
    let a = (e, t) =>
      b(
        [
          [0.004, 0.183 * e, 0.192 * e, 2.3],
          [-0.05, 0.19 * e, 0.203 * e],
          [-0.1, 0.2 * e, 0.216 * e],
          [-0.128, 0.208 * e, 0.225 * e],
        ],
        { seg: 16, start: 0, end: 0, arc: [212, 328], flipNormals: t },
      );
    (t.add(a(1, !1), {
      ...K,
      paint: (e) =>
        ye.copy(me).lerp(new i(J.helmDeep), M(-0.02, -0.12, e.y) * 0.55),
      ...s,
      r: 0.28,
      m: 0.45,
      spec: 1.1,
      detail: 0.55,
      edge: 1.6,
    }),
      t.add(a(0.9, !0), { ...K, color: J.leatherDark, ...c }));
    let o = [];
    for (let e = 0; e <= 12; e++) {
      let t = (p(214, 326, e / 12) * Math.PI) / 180;
      o.push([Math.cos(t) * 0.198, -0.128, Math.sin(t) * 0.215]);
    }
    let l = (-6 * Math.PI) / 180,
      u = o.map(([e, t, n]) => [
        e,
        K.at[1] + t * Math.cos(l) - n * Math.sin(l),
        K.at[2] + t * Math.sin(l) + n * Math.cos(l),
      ]);
    t.add(j(u, 0.012, { seg: 6, samples: 20 }), {
      bone: `head`,
      color: J.helm,
      ...s,
      r: 0.26,
      m: 0.4,
      spec: 1.1,
      detail: 0.5,
      edge: 1.6,
    });
    for (let e of [232, 270, 308]) {
      let n = (e * Math.PI) / 180,
        r = [Math.cos(n) * 0.208, -0.06, Math.sin(n) * 0.218];
      t.add(v(0.013, 0.013, 0.009, { rings: 5, seg: 11 }), {
        at: [
          r[0],
          K.at[1] + r[1] * Math.cos(l) - r[2] * Math.sin(l),
          K.at[2] + r[1] * Math.sin(l) + r[2] * Math.cos(l),
        ],
        rot: [0, 90 - e, 0],
        bone: `head`,
        color: J.bronzeHi,
        ...s,
        r: 0.22,
        spec: 1.5,
      });
    }
  }
  for (let e of [1])
    t.add(
      N(
        [
          [e * 0.15, 2.115, 0.03],
          [e * 0.158, 2.06, 0.055],
          [e * 0.145, 2, 0.07],
        ],
        (e) => 0.075 - e * 0.03,
        0.02,
        { hint: [1, 0, 0] },
      ),
      { bone: `head`, grad: [J.bronze, J.bronzeHi], mirror: !0, ...s },
    );
  for (let e = 0; e < 10; e++) {
    let n = (e / 10) * Math.PI * 2;
    (Math.abs(Math.sin(n)) > 0.95 && Math.cos(n) < 0) ||
      t.add(v(0.013, 0.013, 0.01, { rings: 5, seg: 10 }), {
        at: [Math.cos(n) * 0.18, 2.127, 0.025 + Math.sin(n) * 0.189],
        bone: `head`,
        color: J.bronzeHi,
        ...s,
      });
  }
  (se(t, [0, 2.127, 0.025], 0.183, 0.192, {
    bone: `head`,
    bead: 0.014,
    seg: 24,
    studs: 0,
    mat: { color: J.helm, ...s, r: 0.26, m: 0.4, spec: 1.1, detail: 0.5 },
  }),
    ne(
      t,
      [
        [0, 2.13, 0.19],
        [0, 2.22, 0.14],
        [0, 2.265, 0.02],
      ],
      0.03,
      J.bronzeHi,
      {
        bone: `head`,
        r: 0.3,
        m: 0.9,
        tex: `metal`,
        detail: 0.6,
        ao: !0,
        hint: [0, 0.6, 0.8],
        thick: 0.012,
      },
    ));
  let be = T(
    f(
      [
        [-0.235, 0],
        [0.21, 0],
        [0.285, 0.07],
        [0.19, 0.185],
        [0.02, 0.246],
        [-0.145, 0.185],
        [-0.285, 0.055],
      ],
      72,
    ),
    0.076,
    { bevel: 0.018, bevelSeg: 3, crease: 50 },
  );
  (t.add(be, {
    at: [0, 2.228, -0.01],
    rot: [0, 90, 0],
    bone: `head`,
    grad: [J.helmDeep, J.helmLo],
    gradEase: !0,
    teamFn: (e) => M(0.015, 0.055, e.y) * (1 - M(0.175, 0.225, e.y)),
    ...s,
    r: 0.32,
    m: 0.4,
    spec: 1,
    detail: 0.5,
    edge: 1.7,
  }),
    ne(
      t,
      [
        [0, 2.3, 0.175],
        [0, 2.43, 0.05],
        [0, 2.42, -0.08],
        [0, 2.3, -0.205],
      ],
      0.05,
      J.emberHot,
      { bone: `head`, emit: J.ember, ei: 3.4, hint: [1, 0, 0], thick: 0.11 },
    ));
  {
    let e = [];
    for (let t = 0; t <= 72; t++) {
      let n = (t / 72) * Math.PI * 2;
      e.push([Math.cos(n) * 0.186, 2.112, 0.025 + Math.sin(n) * 0.195]);
    }
    let n = (e) => {
      let t = 1;
      for (let n of [0.26, Math.PI - 0.26, Math.PI / 2]) {
        let r = Math.abs(Math.atan2(Math.sin(e - n), Math.cos(e - n)));
        t *= M(0.035, 0.12, r);
      }
      return t;
    };
    t.add(
      j(
        e,
        (e) =>
          0.0118 *
          (1 +
            0.2 *
              Math.sin(e * Math.PI * 2 * 3 + 1.3) *
              Math.sin(e * Math.PI * 2 * 5 + 0.4)),
        { seg: 6, samples: 110, curve: !1, start: 0, end: 0 },
      ),
      {
        bone: `head`,
        paint: (e) =>
          n(Math.atan2(e.z - 0.025, e.x)) < 0.4 ? J.basalt : J.emberHot,
        emit: J.ember,
        ei: 1.3,
        emitFn: (e) => {
          let t = Math.atan2(e.z - 0.025, e.x);
          return n(t) * (0.35 + 0.65 * M(-0.6, 0.7, Math.sin(t)));
        },
        r: 0.35,
        detail: 0,
        ao: !1,
        seam: 0,
      },
    );
  }
  t.glowCard(`head`, [0, 2.35, -0.01], 0.42, J.ember, 0.55);
  let xe = a.bindPos(`weaponR`),
    Y = (e, t, n) => [xe.x + e, xe.y + t, xe.z + n],
    we = { bone: `weaponR` };
  (t.add(
    j(
      [
        [0, -0.42, 0],
        [0, 0.26, 0],
      ],
      0.036,
      { seg: 10, curve: !1 },
    ),
    {
      ...we,
      at: Y(0, 0, 0),
      paint: (e) => (Math.sin(e.y * 60) > 0.2 ? J.leatherDark : J.leather),
      ...c,
    },
  ),
    t.add(v(0.065, 0.07, 0.065, { e: 2.6 }), {
      ...we,
      at: Y(0, -0.46, 0),
      color: J.bronzeHi,
      ...s,
    }),
    t.add(v(0.03, 0.03, 0.03), {
      ...we,
      at: Y(0, -0.52, 0),
      color: J.emberHot,
      emit: J.ember,
      ei: 2.5,
      ao: !1,
      detail: 0,
    }),
    t.add(w(0.132, 0.115, 0.168, { e: 3.4 }), {
      ...we,
      at: Y(0, 0.285, 0.02),
      grad: [J.stoneDark, J.stone],
      ...o,
      edge: 1.6,
    }),
    se(t, Y(0, 0.222, 0), 0.052, 0.052, {
      ...we,
      bead: 0.011,
      seg: 14,
      studs: 6,
      studR: 0.01,
      studH: 0.007,
      studY: 0.006,
      tilt: 90,
      mat: { color: J.bronzeHi, ...s },
      studMat: { color: J.bronzeHi, ...s },
    }),
    t.add(
      T(
        [
          [-0.03, -0.028],
          [0.03, -0.028],
          [0.021, 0.026],
          [-0.021, 0.026],
        ],
        0.052,
        { bevel: 0.006 },
      ),
      {
        ...we,
        at: Y(0, 0.352, 0),
        rot: [0, 90, 0],
        color: J.bronzeHi,
        ...s,
        edge: 1.6,
      },
    ),
    t.add(
      j([Y(0, 0.336, -0.028), Y(0, 0.336, 0.028)], 0.006, {
        seg: 5,
        curve: !1,
      }),
      { ...we, color: J.leatherDark, ...c },
    ));
  for (let e of [-0.3, 0.1])
    se(t, Y(0, e, 0), 0.042, 0.042, {
      ...we,
      bead: 0.009,
      seg: 12,
      studs: 5,
      studR: 0.01,
      studH: 0.007,
      studY: 0.004,
      tilt: 90,
      mat: { color: J.bronze, ...s },
      studMat: { color: J.bronzeHi, ...s },
    });
  for (let e of [0.245, 0.325])
    for (let n = 0; n < 5; n++) {
      let r = -0.052 + n * 0.038;
      (t.add(v(0.015, 0.011, 0.015, { rings: 6, seg: 13 }), {
        ...we,
        at: Y(0.07, e, r),
        rot: [0, 0, 90],
        color: J.bronzeHi,
        ...s,
        r: 0.2,
        spec: 1.6,
        detail: 0.2,
      }),
        t.add(v(0.015, 0.011, 0.015, { rings: 6, seg: 13 }), {
          ...we,
          at: Y(-0.07, e, r),
          rot: [0, 0, 90],
          color: J.bronzeHi,
          ...s,
          r: 0.2,
          spec: 1.6,
          detail: 0.2,
        }));
    }
  t.add(
    T(
      f(
        [
          [-0.075, 0.3],
          [0.075, 0.3],
          [0.115, 0.44],
          [0.285, 0.625],
          [0.405, 0.96],
          [0.435, 1.19],
          [0.335, 1.365],
          [0.235, 1.515],
          [0.145, 1.435],
          [0.02, 1.375],
          [-0.1, 1.235],
          [-0.055, 0.86],
          [-0.095, 0.56],
        ],
        64,
      ),
      0.085,
      { bevel: 0.026, bevelSeg: 3 },
    ),
    {
      ...we,
      at: Y(0, 0, 0),
      rot: [0, -90, 0],
      grad: [`#333e4f`, `#7e8da8`],
      gradEase: !0,
      r: 0.72,
      detail: 0.34,
      tex: `stone`,
      edge: 1.6,
    },
  );
  for (let [e, n, r, i] of [
    [0.5, 0.545, 0.245, 0.009],
    [0.83, 0.875, 0.345, 0.0075],
    [1.17, 1.21, 0.37, 0.0065],
  ])
    for (let a of [1, -1])
      t.add(
        j(
          [
            Y(a * 0.0625, e, -0.03),
            Y(a * 0.0625, e + (n - e) * 0.5, r * 0.5),
            Y(a * 0.0625, n, r),
          ],
          i,
          { seg: 5, samples: 8 },
        ),
        {
          ...we,
          grad: [J.stoneDark, `#b6c0cd`],
          gradAxis: `y`,
          r: 0.6,
          detail: 0.35,
          tex: `stone`,
          edge: 1.7,
        },
      );
  {
    let n = f(
        [
          [0.115, 0.255],
          [0.165, 0.405],
          [0.345, 0.6],
          [0.475, 0.95],
          [0.505, 1.215],
          [0.395, 1.4],
          [0.275, 1.565],
        ],
        48,
        !1,
      ),
      a = f(
        [
          [0.075, 0.3],
          [0.115, 0.44],
          [0.285, 0.625],
          [0.405, 0.96],
          [0.435, 1.19],
          [0.335, 1.365],
          [0.235, 1.515],
        ],
        48,
        !1,
      ),
      o = Math.min(n.length, a.length),
      s = [],
      c = [],
      l = [],
      u = (e) => p(0.071, 0.005, e ** 0.8) + 0.006 * Math.sin(Math.PI * e),
      d = 0;
    for (let e = 0; e < o; e++) {
      let [t, r] = n[e],
        [i, c] = a[e],
        f = Math.min(1, e / 4, (o - 1 - e) / 4);
      e && (d += Math.hypot(n[e][0] - n[e - 1][0], n[e][1] - n[e - 1][1]));
      for (let e = 0; e <= 10; e++) {
        let n = e <= 5 ? e / 5 : (10 - e) / 5,
          a = e <= 5 ? 1 : -1,
          o = p(i - 0.012, t, n),
          m = p(c, r, n),
          h = u(n) * (0.35 + 0.65 * f) * a;
        (s.push(xe.x + h, xe.y + m, xe.z + o), l.push(d, (e / 10) * 0.3));
      }
    }
    for (let e = 0; e < o - 1; e++)
      for (let t = 0; t < 10; t++) {
        let n = e * 11 + t,
          r = n + 11;
        c.push(n, r, n + 1, n + 1, r, r + 1);
      }
    let m = new e();
    (m.setAttribute(`position`, new r(s, 3)),
      m.setAttribute(`uvw`, new r(l, 2)),
      m.setIndex(c),
      m.computeVertexNormals());
    {
      let e = m.attributes.normal,
        t = 0;
      for (let n = 0; n < e.count; n++) t += e.getX(n) * (s[n * 3] - xe.x);
      if (t < 0) {
        let e = m.index.array;
        for (let t = 0; t < e.length; t += 3) {
          let n = e[t + 1];
          ((e[t + 1] = e[t + 2]), (e[t + 2] = n));
        }
        m.computeVertexNormals();
      }
    }
    let h = new i(J.bronze),
      g = new i(`#ffd49a`),
      _ = new i();
    (t.add(m, {
      ...we,
      paint: (e, t, n, r) => {
        let i = r % 11 <= 5 ? (r % 11) / 5 : (10 - (r % 11)) / 5;
        return _.copy(h).lerp(g, M(0.25, 1, i));
      },
      r: 0.26,
      m: 0.5,
      spec: 1.35,
      detail: 0.35,
      tex: `metal`,
      edge: 1.8,
    }),
      t.add(
        j(
          n.slice(2, -2).map(([e, t]) => Y(0, t, e)),
          0.0045,
          { seg: 5, samples: 60 },
        ),
        {
          ...we,
          color: `#ffe6b8`,
          r: 0.18,
          m: 0.3,
          spec: 1.6,
          detail: 0,
          edge: 2,
        },
      ));
  }
  let Te = [
      [
        [0.02, 0.4],
        [0.1, 0.62],
        [0.05, 0.8],
        [0.18, 1.05],
        [0.12, 1.25],
        [0.2, 1.38],
      ],
      [
        [0.1, 0.62],
        [0.24, 0.72],
        [0.3, 0.9],
      ],
      [
        [0.18, 1.05],
        [0.3, 1.12],
      ],
    ],
    Ee = (e, t) => (n) =>
      e *
      Math.sin(Math.PI * Math.min(1, Math.max(0, n))) ** 0.55 *
      (1 + 0.28 * Math.sin(n * 19 + t) * Math.sin(n * 7.3 + t * 2));
  for (let e of [1, -1])
    Te.forEach((n, r) => {
      let i = (t) => n.map(([n, r]) => Y(-e * t, r, n));
      (ne(t, i(0.0676), Ee(0.075, r), `#8a5236`, {
        ...we,
        hint: [1, 0, 0],
        curve: !1,
        thick: 0.002,
        r: 0.8,
        detail: 0.3,
        tex: `stone`,
        seam: 0,
      }),
        ne(t, i(0.0688), Ee(0.04, r + 3), `#c25a24`, {
          ...we,
          emit: J.ember,
          ei: 0.55,
          hint: [1, 0, 0],
          curve: !1,
          thick: 0.002,
        }),
        ne(t, i(0.07), Ee(0.014, r + 7), J.emberHot, {
          ...we,
          emit: J.ember,
          ei: 1.75,
          hint: [1, 0, 0],
          curve: !1,
          thick: 0.002,
        }));
      let [a, o] = n[n.length - 1],
        [s, c] = n[n.length - 2],
        l = Math.atan2(o - c, a - s);
      for (let n of [-0.6, 0.55]) {
        let i = 0.05 + 0.02 * ((r + +(n > 0)) % 2);
        ne(
          t,
          [
            Y(-e * 0.0702, o, a),
            Y(
              -e * 0.0702,
              o + Math.sin(l + n) * i * 0.5,
              a + Math.cos(l + n) * i * 0.5,
            ),
            Y(
              -e * 0.0702,
              o + Math.sin(l + n * 1.3) * i,
              a + Math.cos(l + n * 1.3) * i,
            ),
          ],
          Ee(0.006, r + n),
          J.emberHot,
          {
            ...we,
            emit: J.ember,
            ei: 1.2,
            hint: [1, 0, 0],
            curve: !0,
            thick: 0.002,
          },
        );
      }
    });
  (t.glowCard(`weaponR`, Y(0, 0.75, 0.14), 0.55, J.ember, 0.2, {
    stretch: 1.8,
  }),
    t.glowCard(`weaponR`, Y(0, 1.2, 0.2), 0.45, J.ember, 0.18));
}
var Ee = (e, t, n, r = 0, i = 0, a = 0) => ({
    wIK: 1,
    wX: e,
    wY: t,
    wZ: n,
    wRX: r,
    wRY: i,
    wRZ: a,
  }),
  De = {
    stance: {
      hipT: [0, -0.07, 0],
      hips: [0, 8, 0],
      spine: [9, -4, 0],
      chest: [9, -6, 0],
      neck: [-6, 4, 0],
      head: [-10, 6, 0],
      clavL: [0, 0, -3],
      armL: [-8, 0, 16],
      foreL: [-28, 0, 0],
      handL: [0, 0, 0],
      clavR: [0, 0, 6],
      armR: [-16, 6, -26],
      foreR: [-78, 0, 22],
      handR: [0, 0, -6],
      weaponR: [92, -20, 0],
      footL: [0.07, 0, 0.12, 0],
      footR: [-0.06, 0, -0.12, 0],
      tabF1: [4, 0, 0],
      tabBL1: [-4, 0, 3],
      tabBR1: [-4, 0, -3],
      beard1: [-4, 0, 0],
    },
    idle: {},
    splash: {
      extends: `stance`,
      hipT: [-0.04, -0.09, -0.03],
      hips: [0, 20, 4],
      spine: [6, -6, -2],
      chest: [2, -12, -2],
      neck: [-6, 4, 0],
      head: [-10, 6, -4],
      ...Ee(-0.3, 1.3, 0.18, 6.5, -69.6, 38.3),
      armL: [-40, 20, 30],
      foreL: [-40, 0, 0],
      ikL: 1,
      footL: [0.12, 0, 0.18, 0],
      footR: [-0.1, 0, -0.14, 18],
    },
    run: {
      extends: `stance`,
      hipT: [0, -0.05, 0],
      hips: [0, 0, 0],
      spine: [16, 0, 0],
      chest: [8, 0, 0],
      neck: [-10, 0, 0],
      head: [-12, 0, 0],
      armL: [-6, 0, 14],
      foreL: [-55, 0, 0],
      footL: [0, 0, 0, 0],
      footR: [0, 0, 0, 0],
    },
    aWind: {
      extends: `stance`,
      hipT: [0, -0.04, -0.05],
      hips: [-6, -12, 0],
      spine: [-12, -8, 0],
      chest: [-14, -10, 0],
      neck: [10, 4, 0],
      head: [12, 4, 0],
      ...Ee(-0.22, 1.98, -0.12, -58, 14, -38),
      armL: [-150, 10, 20],
      foreL: [-60, 0, 0],
      ikL: 1,
      footL: [0.07, 0, 0.2, 0],
      footR: [-0.08, 0, -0.16, 0],
    },
    aStrike: {
      extends: `stance`,
      hipT: [0, -0.2, 0.08],
      hips: [16, -4, 0],
      spine: [18, 0, 0],
      chest: [16, 0, 0],
      neck: [-14, 0, 0],
      head: [-12, 0, 0],
      ...Ee(-0.1, 1.12, 0.46, 96, -10, -48),
      armL: [-70, 0, 14],
      foreL: [-20, 0, 0],
      ikL: 1,
      trail: 1,
      footL: [0.08, 0, 0.3, 0],
      footR: [-0.08, 0, -0.22, 0],
    },
    aFollow: {
      extends: `aStrike`,
      hipT: [0, -0.24, 0.1],
      spine: [22, 0, 0],
      chest: [20, 0, 0],
      ...Ee(-0.06, 0.96, 0.44, 116, -12, -52),
      trail: 0,
    },
    bWind: {
      extends: `stance`,
      hipT: [0, -0.1, 0],
      hips: [0, -26, 0],
      spine: [6, -18, 0],
      chest: [6, -22, 0],
      neck: [-6, 22, 0],
      head: [-8, 22, 0],
      armR: [-80, 10, -70],
      foreR: [-40, 0, 0],
      handR: [0, 0, 0],
      weaponR: [-70, 180, 0],
      armL: [-40, 0, 40],
      foreL: [-60, 0, 0],
      footL: [0.1, 0, 0.2, 0],
      footR: [-0.1, 0, -0.16, 0],
    },
    bStrike: {
      extends: `bWind`,
      hipT: [0, -0.14, 0.04],
      hips: [4, 24, 0],
      spine: [10, 16, 0],
      chest: [10, 24, 0],
      neck: [-8, -24, 0],
      head: [-8, -22, 0],
      armR: [-86, -40, 30],
      foreR: [-20, 0, 0],
      weaponR: [-80, 180, 0],
      armL: [-20, 0, 30],
      trail: 1,
    },
    bFollow: {
      extends: `bStrike`,
      hips: [4, 34, 0],
      chest: [10, 32, 0],
      armR: [-70, -60, 50],
      weaponR: [-70, 180, 0],
      trail: 0,
    },
    qWind: {
      extends: `bWind`,
      hips: [0, -34, 0],
      chest: [6, -30, 0],
      armR: [-60, 10, -85],
      hipT: [0, -0.16, -0.04],
    },
    qStrike: {
      extends: `bStrike`,
      hips: [6, 40, 0],
      chest: [12, 36, 0],
      armR: [-88, -60, 50],
      hipT: [0, -0.22, 0.1],
      footL: [0.12, 0, 0.36, 0],
      footR: [-0.1, 0, -0.26, 0],
      trail: 1,
      emit: 0.8,
    },
    wRoar: {
      extends: `stance`,
      hipT: [0, -0.12, 0],
      spine: [-8, 0, 0],
      chest: [-14, 0, 0],
      neck: [8, 0, 0],
      head: [-30, 0, 0],
      armL: [-40, 0, 58],
      foreL: [-80, -30, 0],
      armR: [-40, 0, -58],
      foreR: [-80, 30, 0],
      weaponR: [-40, 0, 0],
      footL: [0.14, 0, 0.05, 0],
      footR: [-0.14, 0, -0.05, 0],
      emit: 1.4,
    },
    rRaise: {
      extends: `aWind`,
      hipT: [0, -0.24, -0.02],
      spine: [-16, 0, 0],
      chest: [-18, 0, 0],
      head: [20, 0, 0],
      armR: [-176, 10, -4],
      foreR: [-30, 0, 0],
      armL: [-170, 0, 10],
      emit: 1,
    },
    rSlam: {
      extends: `aStrike`,
      hipT: [0, -0.34, 0.14],
      spine: [28, 0, 0],
      chest: [26, 0, 0],
      neck: [-26, 0, 0],
      head: [-20, 0, 0],
      armR: [-60, 12, -4],
      weaponR: [-78, 90, 0],
      footL: [0.1, 0, 0.36, 0],
      footR: [-0.1, 0, -0.3, 0],
      emit: 1.6,
      trail: 1,
    },
    charge: {
      extends: `stance`,
      hipT: [0, -0.16, 0.06],
      hips: [18, -28, 0],
      spine: [22, -12, 0],
      chest: [16, -10, 0],
      neck: [-18, 20, 0],
      head: [-20, 22, 0],
      armL: [-60, 0, 30],
      foreL: [-80, 0, 0],
      armR: [20, 0, -30],
      foreR: [-40, 0, 0],
      weaponR: [120, 90, 0],
      footL: [0.06, 0.1, 0.3, -20],
      footR: [-0.06, 0.02, -0.34, 30],
    },
    recall: {
      extends: `stance`,
      hipT: [0, -0.42, -0.06],
      hips: [0, 0, 0],
      spine: [18, 0, 0],
      chest: [10, 0, 0],
      neck: [10, 0, 0],
      head: [16, 0, 0],
      footL: [0.12, 0, 0.22, 0],
      footR: [-0.12, 0.18, -0.34, 60],
      armR: [-58, 0, 6],
      foreR: [-40, 0, 0],
      handR: [0, 0, 0],
      weaponR: [-60, 0, 0],
      armL: [-60, 0, -6],
      foreL: [-44, 0, 0],
      ikL: 0,
      emit: 0.6,
    },
    stun: {
      extends: `stance`,
      hipT: [0, -0.21, -0.07],
      hips: [8, 6, 0],
      spine: [18, 0, 4],
      chest: [16, 0, 4],
      neck: [14, 0, 6],
      head: [22, 10, 16],
      armL: [10, 0, 6],
      foreL: [-8, 0, 0],
      handL: [10, 0, 0],
      ...Ee(-0.34, 0.84, 0.3, 118, -14, -72),
      footL: [0.12, 0, 0.08, 0],
      footR: [-0.12, 0, -0.06, 0],
    },
    air: {
      extends: `stance`,
      spine: [-6, 0, 0],
      chest: [-5, 0, 0],
      head: [10, 0, 0],
      armL: [-100, 0, 60],
      foreL: [-30, 0, 0],
      armR: [-110, 0, -50],
      foreR: [-40, 0, 0],
      footL: [0.05, 0.25, 0.1, 30],
      footR: [-0.05, 0.05, -0.2, -20],
      weaponR: [0, 90, 0],
    },
    flinch: {
      extends: null,
      hipT: [0, -0.02, -0.05],
      spine: [-6, 0, 0],
      chest: [-8, 0, 0],
      head: [14, 0, 0],
      armL: [4, 0, 6],
    },
    deathA: {
      extends: `stance`,
      hipT: [0, 0, -0.08],
      spine: [-18, 0, 0],
      chest: [-20, 0, 0],
      head: [30, 0, 0],
      armL: [-30, 0, 40],
      armR: [-50, 0, -50],
      foreR: [-40, 0, 0],
      weaponR: [0, 90, 0],
    },
    deathB: {
      extends: `deathA`,
      hipT: [0, -0.5, -0.1],
      spine: [30, 0, 0],
      chest: [24, 0, 0],
      head: [20, 0, 0],
      footL: [0.1, 0, 0.3, 0],
      footR: [-0.1, 0, 0.2, 0],
      armL: [20, 0, 20],
      armR: [30, 0, -20],
      foreR: [-10, 0, 0],
    },
    deathC: {
      extends: `deathB`,
      root: [88, 0, 8],
      rootT: [0, 0.32, -0.6],
      hipT: [0, -0.3, 0],
      hips: [-10, 0, 0],
      spine: [-6, 0, 0],
      chest: [-8, 0, 0],
      neck: [-10, 30, 0],
      head: [-10, 30, 0],
      armL: [-130, 0, 50],
      foreL: [-30, 0, 0],
      armR: [-100, 0, -60],
      foreR: [-20, 0, 0],
      footL: [0.18, 0.12, 0.2, 20],
      footR: [-0.14, 0, 0.05, 10],
    },
  },
  Oe = (e, t, n) => ({
    bones: e,
    tip: [0, -0.1, 0],
    stiffRoot: 0.45,
    stiffTip: 0.05,
    drag: 2.6,
    gravity: 1,
    hang: 0.5,
    maxAngle: n ? 30 : 24,
    flutter: 0.35,
    freq: 5 + t,
    phase: t * 1.7,
    collide: [`thighL`, `thighR`, `shinL`, `shinR`],
    ...(n
      ? { plane: { bone: `hips`, n: [0, 0, -1], d: 0.12 } }
      : { plane: { bone: `hips`, n: [0, 0, 1], d: 0.15 } }),
  }),
  ke = {
    id: `brannoc`,
    height: 2.35,
    element: `#ff8a2a`,
    rim: `#ffe0b8`,
    proportions: Y,
    bones: we,
    build: Te,
    poses: De,
    grips: { L: { bone: `weaponR`, p: [0, -0.28, 0] } },
    kneeOut: 0.3,
    elbowPole: [0.7, -0.4, -0.5],
    aimBone: `weaponR`,
    anchors: {
      weapon: { bone: `weaponR`, p: [0, 1.3, 0.3] },
      muzzle: { bone: `weaponR`, p: [0, 1, 0.25] },
      head: { bone: `head`, p: [0, 0.14, 0.03] },
      chest: { bone: `chest`, p: [0, 0.18, 0.14] },
    },
    trails: [
      {
        bone: `weaponR`,
        a: [0, 0.5, 0.2],
        b: [0, 1.42, 0.35],
        color: `#ff9a3c`,
      },
    ],
    portrait: {
      yaw: 0.3,
      props: [`weaponR`],
      rim: `#ff8a2a`,
      fill: 1,
      extra: 0.08,
    },
    colliders: {
      hips: { bone: `hips`, a: [-0.14, 0, 0], b: [0.14, 0, 0], r: 0.2 },
      thighL: { bone: `thighL`, a: [0, 0, 0], b: [0, -0.45, 0], r: 0.17 },
      thighR: { bone: `thighR`, a: [0, 0, 0], b: [0, -0.45, 0], r: 0.17 },
      shinL: { bone: `shinL`, a: [0, 0, 0], b: [0, -0.44, 0], r: 0.14 },
      shinR: { bone: `shinR`, a: [0, 0, 0], b: [0, -0.44, 0], r: 0.14 },
    },
    anim: {
      run: {
        stride: 2.05,
        lift: 0.2,
        bob: 0.07,
        twist: 12,
        roll: 5,
        headLead: 0.3,
        carry: 0.9,
        armL: 34,
        armR: 0,
      },
      center: 1,
      airHeight: 1,
      airTumble: 30,
      attackFollow: 0.14,
      attackHold: 0.1,
      breath: 3.8,
      attacks: [
        { wind: `aWind`, strike: `aStrike`, follow: `aFollow` },
        { wind: `bWind`, strike: `bStrike`, follow: `bFollow` },
      ],
      casts: {
        Q: {
          keys: [
            [0, `qWind`],
            [0.12, `qStrike`, `i`],
            [0.34, `qStrike`],
          ],
          len: 0.34,
          out: 0.3,
        },
        W: {
          keys: [
            [0, `stance`],
            [0.16, `wRoar`, `o`],
            [0.6, `wRoar`],
          ],
          len: 0.6,
          out: 0.35,
        },
        E: { keys: [[0, `charge`]], len: 0.2, out: 0.2 },
        R: {
          keys: [
            [0, `stance`],
            [0.22, `rRaise`, `o`],
            [0.46, `rRaise`],
            [0.56, `rSlam`, `i`],
            [0.95, `rSlam`],
          ],
          len: 0.95,
          out: 0.35,
        },
        spell: { keys: [[0, `stance`]], len: 0.05, out: 0.1, upper: !0 },
      },
      dash: {
        default: { keys: [[0, `charge`]] },
        E: { keys: [[0, `charge`]] },
        R: {
          keys: [
            [0, `rRaise`],
            [0.62, `rRaise`],
            [0.9, `rSlam`, `i`],
            [1, `rSlam`],
          ],
        },
      },
      recall: {
        keys: [
          [0, `stance`],
          [0.45, `recall`, `o`],
        ],
      },
      death: {
        keys: [
          [0, `deathA`],
          [0.1, `deathA`, `o`],
          [0.36, `deathB`, `i`],
          [0.68, `deathC`, `i`],
        ],
      },
      cloth: [
        Oe([`tabF1`, `tabF2`, `tabF3`], 0, !1),
        Oe([`tabBL1`, `tabBL2`, `tabBL3`], 1, !0),
        Oe([`tabBR1`, `tabBR2`, `tabBR3`], 2, !0),
        {
          bones: [`beard1`, `beard2`],
          tip: [0, -0.1, 0.01],
          stiffRoot: 0.6,
          stiffTip: 0.3,
          drag: 3,
          hang: 0.3,
          maxAngle: 20,
          flutter: 0.1,
        },
      ],
      chains: [],
    },
  },
  X = {
    suit: `#7a66ad`,
    suitHi: `#ab97dd`,
    leather: `#7a60ba`,
    leatherHi: `#b89ceb`,
    violet: `#a468ff`,
    violetDeep: `#6b46b8`,
    violetMid: `#8458e6`,
    lav: `#d5c3ff`,
    steel: `#5a5484`,
    steelHi: `#c6bee8`,
    teal: `#39f5d0`,
    tealDeep: `#0f8f7c`,
    void: `#0a0810`,
    hood: `#7a5ec4`,
    hoodDeep: `#4b3782`,
    hoodHi: `#cdb6ff`,
    wrap: `#4a3e66`,
    mask: `#a89ec4`,
    maskHi: `#e6ddf6`,
    maskLo: `#8d84b0`,
    maskJaw: `#8a80ad`,
    maskJawLo: `#6f669a`,
    maskSocket: `#150f22`,
    brow: `#241a36`,
    capeHi: `#b6a2e8`,
    legDark: `#2c2450`,
    legMid: `#4a3e78`,
    tealTrim: `#2fae9a`,
    tealTrimLo: `#1b6f65`,
    violetTrim: `#7a58c0`,
  },
  Ae = {
    hipY: 1,
    hipX: 0.1,
    hipDrop: 0.02,
    thigh: 0.44,
    shin: 0.45,
    spineOff: 0.06,
    spine: 0.22,
    chest: 0.34,
    neck: 0.08,
    neckZ: 0.01,
    clavX: 0.06,
    clavY: 0.27,
    shoulderX: 0.15,
    upperArm: 0.29,
    foreArm: 0.27,
  },
  je = [
    [`L`, 0.125, 0.56],
    [`C`, 0, 0.46],
    [`R`, -0.125, 0.6],
  ];
function Me(e) {
  let t = F(e),
    n = (e, n, r, i, a) => t.push({ name: e, parent: n, pos: [r, i, a] });
  (n(`weaponL`, `handL`, 0, -0.07, 0.01),
    n(`weaponR`, `handR`, 0, -0.07, 0.01),
    n(`hoodTip`, `head`, 0, 0.2, -0.1));
  let r = [0, e.hipY + e.spineOff + e.spine, 0];
  for (let [e, t, i] of je) {
    let i = [1.5, 1.25, 1, 0.76],
      a = [-0.18, -0.215, -0.235, -0.245],
      o = r;
    i.forEach((r, i) => {
      let s = [t * (1 + i * 0.12), r, a[i]];
      (n(
        `cape${e}${i + 1}`,
        i === 0 ? `chest` : `cape${e}${i}`,
        s[0] - o[0],
        s[1] - o[1],
        s[2] - o[2],
      ),
        (o = s));
    });
  }
  return (
    n(`scarf1`, `neck`, 0, 0, -0.12),
    n(`scarf2`, `scarf1`, 0.01, -0.13, -0.14),
    n(`scarf3`, `scarf2`, 0.01, -0.13, -0.12),
    n(`scarf4`, `scarf3`, 0.01, -0.12, -0.1),
    n(`sash1`, `hips`, 0.16, 0.03, 0.08),
    n(`sash2`, `sash1`, 0.012, -0.15, 0.01),
    n(`sash3`, `sash2`, 0.008, -0.14, 0),
    t
  );
}
var Ne = 2.6;
function Pe(e, n, r) {
  let i = new l(n, new u({ side: 2 }));
  i.updateMatrixWorld(!0);
  let a = new t(),
    o = new c(),
    s = (e, t, n) => {
      a.set(new c(...e), o.set(...t).normalize());
      let r = a.intersectObject(i, !1)[0];
      if (!r || r.point.y < n) return null;
      let s = r.face.normal.clone();
      return (s.dot(o) > 0 && s.negate(), [r.point.toArray(), s.toArray()]);
    },
    d = (e) => {
      let t = [],
        n = [];
      for (let r of e) {
        if (!r) {
          if (t.length > 2) break;
          ((t.length = 0), (n.length = 0));
          continue;
        }
        (t.push(r[0]), n.push(r[1]));
      }
      return t.length > 2 ? [t, n] : null;
    },
    f = {
      mat: { color: X.hoodDeep, r: 0.85, detail: 0.6, tex: `twill` },
      stitchMat: { color: X.lav, r: 0.7, tex: `twill` },
    },
    m = [];
  for (let e of [1, -1])
    (m.push(
      d(
        Array.from({ length: 14 }, (t, n) =>
          s([e * 0.092, 2.4, p(0.05, -0.15, n / 13)], [0, -1, 0], 1.84),
        ),
      ),
    ),
      m.push(
        d(
          Array.from({ length: 12 }, (t, n) =>
            s(
              [e * 0.6, p(1.86, 1.6, n / 11), -0.035 - (0.02 * n) / 11],
              [-e, 0, 0],
              1.5,
            ),
          ),
        ),
      ));
  m.push(
    d(
      Array.from({ length: 13 }, (e, t) =>
        s([p(-0.15, 0.15, t / 12), 2.4, -0.105], [0, -1, 0], 1.8),
      ),
    ),
  );
  for (let t of m)
    t && le(e, t[0], t[1], { skin: r, r: 0.0048, gap: 0.022, ...f });
}
function Fe(e, t, n) {
  let r = { r: 0.85, m: 0, detail: 0.85, tex: `twill` },
    a = { r: 0.6, m: 0, detail: 0.85, tex: `leather` },
    o = { r: 0.3, m: 0.88, detail: 0.7, tex: `metal` },
    l = (e) => n.index(e);
  (e.add(
    y(
      [
        { p: [0, 0.9, 0], rx: 0.11, rz: 0.09 },
        { p: [0, 0.99, 0], rx: 0.155, rz: 0.12 },
        { p: [0, 1.12, 0], rx: 0.138, rz: 0.104 },
        { p: [0, 1.27, 0.01], rx: 0.172, rz: 0.124 },
        { p: [0, 1.41, 0.015], rx: 0.205, rz: 0.136 },
        { p: [0, 1.52, 0], rx: 0.204, rz: 0.13 },
        { p: [0, 1.562, -0.004], rx: 0.158, rz: 0.114 },
        { p: [0, 1.596, -0.004], rx: 0.106, rz: 0.088 },
        { p: [0, 1.645, 0.002], rx: 0.076, rz: 0.07 },
        { p: [0, 1.705, 0.01], rx: 0.062, rz: 0.062 },
      ],
      {
        seg: 22,
        start: 0.6,
        end: 0.3,
        radial: ee([
          [0.62, 60, 0.1, 28, 0.06],
          [0.62, 120, 0.1, 28, 0.06],
          [0.6, 235, 0.1, 30, 0.05],
          [0.6, 305, 0.1, 30, 0.05],
          [0.3, 90, 0.12, 40, -0.04],
        ]),
      },
    ),
    {
      chain: [`hips`, `spine`, `chest`, `neck`],
      bw: 0.08,
      grad: [X.suit, X.suitHi],
      ...r,
      uvScale: Ne,
    },
  ),
    e.add(
      y(
        [
          { p: [0, 1.15, 0.006], rx: 0.15, rz: 0.114, e: 2.3 },
          { p: [0, 1.3, 0.016], rx: 0.186, rz: 0.136, e: 2.3 },
          { p: [0, 1.44, 0.022], rx: 0.217, rz: 0.15, e: 2.4 },
          { p: [0, 1.55, 0.006], rx: 0.207, rz: 0.137 },
          { p: [0, 1.6, 0], rx: 0.142, rz: 0.102 },
        ],
        { seg: 26, start: 0, end: 0, radial: W(5, 0.025, 1.7, 0, 1) },
      ),
      {
        chain: [`spine`, `chest`],
        bw: 0.1,
        grad: [X.leather, X.leatherHi],
        gradEase: !0,
        ...a,
      },
    ));
  for (let t of [1.155, 1.595])
    e.add(d(1, 0.012, { seg: 26, tube: 5 }), {
      at: [0, t, t > 1.5 ? 0 : 0.006],
      rot: [90, 0, 0],
      scale: t > 1.5 ? [0.146, 0.106, 1] : [0.154, 0.118, 1],
      chain: [`spine`, `chest`],
      bw: 0.05,
      color: X.wrap,
      ...a,
    });
  (ne(
    e,
    [
      [-0.13, 1.51, 0.15],
      [0, 1.37, 0.172],
      [0.13, 1.51, 0.15],
    ],
    0.028,
    X.tealTrim,
    {
      bone: `chest`,
      emit: X.teal,
      ei: 0.3,
      hint: [0, 0, 1],
      curve: !1,
      r: 0.55,
      detail: 0.5,
      tex: `leather`,
    },
  ),
    ne(
      e,
      [
        [-0.085, 1.43, 0.163],
        [0, 1.31, 0.168],
        [0.085, 1.43, 0.163],
      ],
      0.015,
      X.tealTrimLo,
      {
        bone: `chest`,
        hint: [0, 0, 1],
        curve: !1,
        r: 0.6,
        detail: 0.5,
        tex: `leather`,
      },
    ),
    e.add(
      N(
        [
          [0.2, 1.56, 0.06],
          [0.05, 1.41, 0.165],
          [-0.12, 1.21, 0.145],
          [-0.17, 1.06, 0.06],
        ],
        0.048,
        0.02,
        { hint: [0, 0, 1] },
      ),
      { chain: [`hips`, `spine`, `chest`], bw: 0.12, color: X.wrap, ...a },
    ),
    e.add(
      T(
        [
          [-0.032, -0.032],
          [0.032, -0.032],
          [0.032, 0.032],
          [-0.032, 0.032],
        ],
        0.02,
        { bevel: 0.008 },
      ),
      {
        at: [0.03, 1.395, 0.178],
        rot: [0, 0, 40],
        bone: `chest`,
        color: X.steelHi,
        ...o,
      },
    ),
    e.add(
      b(
        [
          [0.985, 0.162, 0.126, 2.2],
          [1.01, 0.168, 0.132],
          [1.045, 0.165, 0.128],
        ],
        { seg: 26, start: 0, end: 0 },
      ),
      {
        bone: `hips`,
        grad: [X.wrap, X.suitHi],
        r: 0.7,
        tex: `leather`,
        detail: 0.6,
      },
    ),
    e.add(d(1, 0.022, { seg: 26, tube: 6 }), {
      at: [0, 0.975, 0],
      rot: [90, 0, 0],
      scale: [0.166, 0.128, 1.2],
      bone: `hips`,
      grad: [X.violetDeep, X.violet],
      gradAxis: `x`,
      ...r,
    }),
    e.add(
      v(0.048, 0.044, 0.04, {
        fn: (e) => {
          e.y += Math.sin(e.x * 60) * 0.006;
        },
      }),
      { at: [0.145, 1, 0.085], bone: `hips`, color: X.violetMid, ...r },
    ),
    e.add(
      N(
        [
          [0.16, 1, 0.1],
          [0.172, 0.85, 0.11],
          [0.18, 0.7, 0.1],
          [0.185, 0.58, 0.09],
        ],
        (e) => 0.085 - e * 0.04,
        0.014,
        { hint: [0, 0, 1] },
      ),
      {
        chain: [`sash1`, `sash2`, `sash3`],
        bw: 0.06,
        grad: [X.violet, X.violetDeep],
        ...r,
        emit: X.violet,
        ei: 0.25,
        emitFn: (e, t) => M(0.72, 0.6, t.y),
      },
    ),
    te(
      e,
      n,
      [`thighL`, `shinL`, `footL`],
      [
        [0, 0.104, 0.112],
        [0.1, 0.116, 0.122],
        [0.3, 0.094, 0.1],
        [0.46, 0.062, 0.068],
        [0.52, 0.061, 0.066],
        [0.62, 0.07, 0.078],
        [0.84, 0.046, 0.05],
        [0.97, 0.041, 0.043],
      ],
      {
        from: [0, 0.05, 0],
        seg: 14,
        rings: 16,
        start: 0,
        end: 0,
        paint: (e, t) =>
          t.y < 0.62 ? X.legDark : t.y < 0.86 ? X.legMid : X.suit,
        radial: ee([
          [0.15, 90, 0.12, 55, 0.1],
          [0.22, 0, 0.12, 40, 0.06],
          [0.25, 270, 0.14, 50, 0.06],
          [0.62, 270, 0.09, 45, 0.18],
          [0.58, 200, 0.08, 40, 0.08],
          [0.47, 90, 0.04, 40, -0.06],
        ]),
        mirror: !0,
        ...r,
        uvScale: Ne,
      },
    ));
  let u = ee([[0.62, 180, 0.14, 50, 0.12]]);
  (e.add(
    b(
      [
        [0.07, 0.052, 0.062, 2.2],
        [0.13, 0.046, 0.054],
        [0.24, 0.058, 0.07],
        [0.32, 0.07, 0.082],
        [0.4, 0.07, 0.08],
        [0.46, 0.074, 0.082],
        [0.5, 0.08, 0.088],
      ],
      {
        seg: 16,
        start: `flat`,
        end: 0,
        radial: (e, t) => u(e, t) * W(4, 0.03, 0.4, 0, 1)(e, t),
      },
    ),
    {
      at: [0.1, 0, 0.005],
      chain: [`shinL`, `footL`],
      bw: 0.03,
      paint: (e) =>
        e.y < 0.12 ? X.wrap : e.y > 0.44 ? X.leatherHi : X.leather,
      mirror: !0,
      ...a,
    },
  ),
    e.add(d(1, 0.012, { seg: 16, tube: 5 }), {
      at: [0.1, 0.5, 0.005],
      rot: [90, 0, 0],
      scale: [0.084, 0.092, 1],
      bone: `shinL`,
      color: X.tealTrim,
      mirror: !0,
      r: 0.5,
      detail: 0.4,
      tex: `leather`,
      edge: 1.5,
    }));
  {
    let t = [
        [0.07, 0.052, 0.062],
        [0.13, 0.046, 0.054],
        [0.24, 0.058, 0.07],
        [0.32, 0.07, 0.082],
        [0.4, 0.07, 0.08],
        [0.46, 0.074, 0.082],
      ],
      n = (e) => {
        let n = 1;
        for (; n < t.length - 1 && t[n][0] < e; ) n++;
        let r = g((e - t[n - 1][0]) / (t[n][0] - t[n - 1][0]), 0, 1);
        return [p(t[n - 1][1], t[n][1], r), p(t[n - 1][2], t[n][2], r)];
      };
    for (let t of [1, -1]) {
      let r = [],
        i = [];
      for (let e = 0; e <= 26; e++) {
        let a = e / 26,
          o = p(0.13, 0.43, a),
          s = Math.PI / 2 + t * a * Math.PI * 2.1,
          [c, l] = n(o);
        (r.push([
          0.1 + Math.cos(s) * (c + 0.004),
          o,
          0.005 + Math.sin(s) * (l + 0.004),
        ]),
          i.push([Math.cos(s), 0, Math.sin(s)]));
      }
      le(e, r, i, {
        chain: [`shinL`, `footL`],
        bw: 0.03,
        mirror: !0,
        r: 0.0085,
        gap: 0.026,
        lift: 0.009,
        mat: { color: X.wrap, ...a },
        stitchMat: { color: X.leatherHi, r: 0.6, tex: `leather` },
      });
    }
  }
  for (let [t, n, r, i, s] of [
    [0.3, 0.52, 0.086, 0.094, X.tealTrim],
    [0.1, 0.33, 0.072, 0.088, X.violetTrim],
  ])
    U(e, 0.1, 0.012, t, n, r, r * 1.1, i, i * 1.1, [15, 165], {
      bone: `shinL`,
      mirror: !0,
      mat: { grad: [X.steel, X.steelHi], ...o },
      inner: { color: X.wrap, ...a },
      rim: { color: s, ...o, emit: s === X.tealTrim ? X.teal : null, ei: 0.3 },
      bulge: 0.05,
      seg: 12,
    });
  (e.add(
    v(0.058, 0.066, 0.042, {
      fn: (e) => {
        e.z < 0 && (e.z *= 0.3);
      },
    }),
    {
      at: [0.1, 0.56, 0.064],
      bone: `shinL`,
      grad: [X.steel, X.steelHi],
      mirror: !0,
      ...o,
    },
  ),
    e.add(
      y(
        [
          { p: [0, 0.05, -0.08], rx: 0.054, rz: 0.05, e: 2.4 },
          { p: [0, 0.06, 0], rx: 0.064, rz: 0.058, e: 2.5 },
          { p: [0, 0.05, 0.1], rx: 0.058, rz: 0.044, e: 2.5 },
          { p: [0, 0.042, 0.16], rx: 0.046, rz: 0.034 },
        ],
        { seg: 14, start: 0.4, end: 0.7, hint: [0, 1, 0] },
      ),
      {
        at: [0.1, 0, 0],
        bone: `footL`,
        grad: [X.wrap, X.leather],
        mirror: !0,
        ...a,
      },
    ),
    e.add(
      v(0.05, 0.03, 0.05, {
        fn: (e) => {
          e.y < 0 && (e.y *= 0.3);
        },
      }),
      {
        at: [0.1, 0.05, 0.13],
        bone: `footL`,
        grad: [X.steel, X.steelHi],
        mirror: !0,
        ...o,
      },
    ),
    ie(e, [0.1, 0, 0.02], 1, 0.85, {
      bone: `footL`,
      mirror: !0,
      w: 0.066,
      toe: 0.175,
      heel: 0.105,
      soleH: 0.03,
      proud: 0.014,
      stitch: 14,
      capH: 0.03,
      mat: { grad: [X.wrap, X.leather], ...a },
      soleMat: { color: `#221c33`, ...a, r: 0.85 },
      toeMat: { color: X.leatherHi, ...a },
      heelMat: { color: `#221c33`, ...a },
    }),
    se(e, [0.1, 0.492, 0.005], 0.083, 0.091, {
      chain: [`shinL`, `footL`],
      bw: 0.03,
      mirror: !0,
      bead: 0.0078,
      seg: 16,
      studs: 6,
      studR: 0.0072,
      studH: 0.0052,
      studY: 0.004,
      mat: { color: X.wrap, ...a },
      studMat: { color: X.steelHi, ...o },
    }));
  let f = ee([
    [0.06, 0, 0.08, 70, 0.08],
    [0.3, 90, 0.1, 45, 0.08],
    [0.25, 270, 0.1, 50, 0.06],
    [0.62, 30, 0.1, 50, 0.07],
  ]);
  (te(
    e,
    n,
    [`armL`, `foreL`, `handL`],
    [
      [0, 0.074, 0.074],
      [0.12, 0.082, 0.084],
      [0.36, 0.066, 0.068],
      [0.5, 0.05, 0.052],
      [0.64, 0.062, 0.064],
      [0.9, 0.044, 0.046],
      [1, 0.04, 0.042],
    ],
    {
      from: [0, 0.04, 0],
      seg: 12,
      rings: 14,
      start: 0.3,
      end: 0,
      grad: [X.suit, X.suitHi],
      radial: f,
      mirror: !0,
      ...r,
      uvScale: Ne,
    },
  ),
    e.add(
      b(
        [
          [1, 0.058, 0.06, 3],
          [1.1, 0.07, 0.072, 3],
          [1.2, 0.073, 0.075, 3],
        ],
        { seg: 14, start: `flat`, end: `flat` },
      ),
      {
        at: [0.21, 0, 0],
        bone: `foreL`,
        grad: [X.steel, X.steelHi],
        mirror: !0,
        ...o,
      },
    ),
    e.add(
      T(
        [
          [0, 0],
          [0.16, 0],
          [0.02, 0.07],
        ],
        0.012,
        { bevel: 0.005 },
      ),
      {
        at: [0.285, 1.05, -0],
        rot: [0, 90, 90],
        bone: `foreL`,
        grad: [X.steel, X.tealTrim],
        mirror: !0,
        ...o,
        emit: X.teal,
        ei: 0.3,
      },
    ));
  for (let t of [1, 1.2])
    e.add(d(1, 0.011, { seg: 14, tube: 5 }), {
      at: [0.21, t, 0],
      rot: [90, 0, 0],
      scale: [0.074, 0.076, 1],
      bone: `foreL`,
      color: X.violetTrim,
      mirror: !0,
      r: 0.45,
      detail: 0.4,
      tex: `metal`,
      edge: 1.5,
    });
  for (let t of [1, -1])
    e.add(v(0.019, 0.011, 0.019, { rings: 6, seg: 12, e: 2.2 }), {
      at: [t * 0.21, 0.962, t * 0.016 + 0.052],
      rot: [0, 0, t * 12],
      bone: t > 0 ? `handL` : `handR`,
      color: `#d8fff4`,
      emit: X.teal,
      ei: 1.5,
      ao: !1,
      detail: 0,
      spec: 1.1,
    });
  (re(e, [0.21, 0.99, 0.005], 1, 1.7, {
    bone: `handL`,
    curl: 0.78,
    thumb: 0.9,
    spread: 1.15,
    fat: 0.96,
    jitter: 1.2,
    flat: 0.74,
    fseg: 5,
    knuckle: { k: [0.78, 0.9, 0.98], e: 3.2 },
    mat: { grad: [X.wrap, X.leather], mirror: !0, ...a },
    nail: `#cfc4ee`,
    creaseMat: { color: `#221b33`, mirror: !0, ...a },
    webMat: { color: X.wrap, mirror: !0, ...a },
    guard: { color: X.steel, ...o },
    cuff: {
      studs: 5,
      mat: { grad: [X.steel, X.steelHi], mirror: !0, ...o },
      studMat: { color: X.steelHi, mirror: !0, ...o },
    },
  }),
    e.add(
      b(
        [
          [1.288, 0.0845, 0.0865],
          [1.322, 0.0878, 0.0898],
          [1.438, 0.0878, 0.0898],
          [1.468, 0.0845, 0.0865],
        ],
        { seg: 16, start: 0, end: 0, radial: W(5, 0.018, 1.4, 0, 1) },
      ),
      {
        at: [0.21, 0, 0],
        bone: `armL`,
        grad: [R, L],
        gradEase: !0,
        team: 1,
        r: 0.6,
        tex: `twill`,
        detail: 0.5,
        mirror: !0,
      },
    ));
  for (let t of [1.296, 1.46]) {
    let n = [],
      r = [];
    for (let e = 0; e <= 18; e++) {
      let i = (e / 18) * Math.PI * 2;
      (n.push([0.21 + Math.cos(i) * 0.0905, t, Math.sin(i) * 0.0925]),
        r.push([Math.cos(i), 0, Math.sin(i)]));
    }
    le(e, n, r, {
      bone: `armL`,
      mirror: !0,
      r: 0.0042,
      gap: 0.024,
      mat: { color: X.wrap, ...a },
      stitchMat: { color: X.lav, r: 0.7, tex: `twill` },
    });
  }
  let x = () => [
    [l(`clavL`), 0.5],
    [l(`armL`), 0.5],
  ];
  for (let t = 0; t < 3; t++) {
    let n = 1 - t * 0.18,
      r = ue(0.12 * n + 0.02, 0.055, 0.12 * n + 0.02, {
        thick: 0.016,
        lat0: -4,
        seg: 22,
        rings: 7,
        rimR: 0.01,
        e: 2.6,
        radial: (e, t) =>
          1 +
          0.45 * Math.exp(-((m(t, 0) / 0.42) ** 2)) +
          0.12 * Math.exp(-((m(t, Math.PI / 2) / 0.5) ** 2)),
      }),
      i = {
        at: [0.22 + t * 0.035, 1.6 - t * 0.07, 0],
        rot: [0, 0, -22 - t * 14],
        skin: x,
      };
    (e.add(r.outer, { ...i, grad: [X.steel, X.steelHi], ...o }),
      e.add(r.inner, { ...i, color: X.wrap, ...a }),
      e.add(r.rim, { ...i, color: X.tealTrim, ...o, emit: X.teal, ei: 0.3 }));
  }
  (se(e, [0.222, 1.556, 0], 0.145, 0.145, {
    skin: x,
    bead: 0.0075,
    seg: 20,
    flare: 0.1,
    flareH: 0.026,
    studs: 7,
    studR: 0.0082,
    studH: 0.0058,
    studY: 0.004,
    tilt: -22,
    arc: [-96, 104],
    mat: { color: X.steelHi, ...o },
    lipMat: { grad: [X.steel, X.steelHi], ...o },
    studMat: { color: X.steelHi, ...o },
  }),
    e.add(d(1, 0.018, { seg: 16, tube: 5 }), {
      at: [-0.19, 1.54, 0],
      rot: [0, 90, 20],
      scale: [0.09, 0.1, 1],
      skin: (e, t) => [
        [t.index(`clavR`), 0.5],
        [t.index(`armR`), 0.5],
      ],
      color: X.wrap,
      ...a,
    }));
  let C = y(
      [
        { p: [0, 1.52, -0.01], rx: 0.232, rz: 0.206 },
        { p: [0, 1.62, -0.01], rx: 0.212, rz: 0.196 },
        { p: [0, 1.72, -0.005], rx: 0.192, rz: 0.196 },
        { p: [0, 1.83, -0.02], rx: 0.194, rz: 0.198 },
        { p: [0, 1.915, -0.048], rx: 0.176, rz: 0.18 },
        { p: [0, 1.968, -0.112], rx: 0.098, rz: 0.1 },
        { p: [0, 1.95, -0.178], rx: 0.056, rz: 0.054 },
        { p: [0, 1.912, -0.244], rx: 0.032, rz: 0.03 },
        { p: [0, 1.862, -0.3], rx: 0.004, rz: 0.004 },
      ],
      { seg: 30, start: 0, end: 0, radial: W(5, 0.03, 0.9, 0, 1) },
    ),
    w = new Float32Array(C.attributes.position.count);
  _(C, (e, t) => {
    let n =
      M(1.63, 1.69, e.y) *
      M(1.975, 1.865, e.y) *
      M(0.165, 0.06, Math.abs(e.x)) *
      M(0, 0.09, e.z);
    ((w[t] = n), n > 0 && (e.z -= (e.z - 0.005) * 0.9 * n));
    let r =
      M(1.79, 1.9, e.y) * M(0.235, 0.06, Math.abs(e.x)) * M(-0.03, 0.08, e.z);
    if (
      (r > 0 && ((e.z -= r * 0.165), (e.y += r * 0.035)),
      e.y > 1.64 && e.y < 1.9 && e.z > 0.06)
    ) {
      let t = M(0.1, 0.16, Math.abs(e.x));
      e.z += t * 0.02;
    }
  });
  let E = (e, t) => {
    let n = M(-0.1, -0.24, e.z) * M(1.86, 1.95, e.y),
      r = M(1.66, 1.56, e.y);
    return [
      [t.index(`head`), (1 - n) * (1 - r)],
      [t.index(`hoodTip`), n],
      [t.index(`neck`), (1 - n) * r],
    ].filter((e) => e[1] > 0.001);
  };
  (e.add(C, {
    skin: E,
    shade: 0.45,
    paint: (e, t, n, r) =>
      w[r] > 0.3
        ? X.void
        : e.z < -0.105
          ? e.y > 1.92
            ? X.hood
            : X.hoodDeep
          : e.y > 1.855 && e.z > 0 && Math.abs(e.x) < 0.17
            ? X.brow
            : e.y > 1.885
              ? X.hoodHi
              : e.y > 1.845
                ? X.hood
                : e.y < 1.58
                  ? X.violetDeep
                  : e.y > 1.76
                    ? X.hood
                    : X.hoodDeep,
    r: 0.85,
    detail: 0.9,
    tex: `twill`,
    aoK: 0.8,
    uvScale: Ne,
  }),
    Pe(e, C, E));
  for (let [t, n] of [
    [1, !1],
    [0.88, !0],
  ]) {
    let r = y(
      [
        { p: [0, 1.6, -0.03], rx: 0.155 * t, rz: 0.15 * t },
        { p: [0, 1.7, -0.05], rx: 0.175 * t, rz: 0.168 * t },
        { p: [0, 1.8, -0.085], rx: 0.185 * t, rz: 0.175 * t },
      ],
      {
        seg: 22,
        arc: [150, 390],
        radial: W(4, 0.035, 1.4, 0, 1),
        flipNormals: n,
      },
    );
    e.add(r, {
      chain: [`chest`, `neck`],
      bw: 0.04,
      paint: (e) => (n ? X.wrap : e.y > 1.74 ? X.hoodHi : X.hood),
      r: 0.85,
      detail: 0.85,
      tex: `twill`,
      uvScale: Ne,
    });
  }
  {
    let t = [];
    for (let e = 0; e <= 22; e++) {
      let n = (p(150, 390, e / 22) * Math.PI) / 180;
      t.push([Math.cos(n) * 0.187, 1.802, Math.sin(n) * 0.177 - 0.085]);
    }
    e.add(j(t, 0.011, { seg: 5, samples: 26 }), {
      chain: [`chest`, `neck`],
      bw: 0.04,
      color: X.tealTrim,
      r: 0.5,
      detail: 0.4,
      tex: `leather`,
      edge: 1.5,
    });
  }
  let D = [];
  for (let e = 0; e <= 26; e++) {
    let t = (e / 26) * Math.PI * 2,
      n = Math.sin(t),
      r = 1.772 + n * 0.122,
      i = Math.cos(t) * 0.134 * (1 - 0.15 * Math.max(0, -n));
    D.push([
      i,
      r,
      0.112 +
        0.035 * (1 - Math.abs(n)) -
        0.062 * Math.max(0, n) +
        (r < 1.68 ? 0.02 : 0),
    ]);
  }
  (e.add(
    j(D, (e) => 0.018, { seg: 6, samples: 40, start: 0, end: 0 }),
    {
      bone: `head`,
      grad: [X.violetDeep, X.violetMid],
      r: 0.8,
      tex: `twill`,
      detail: 0.6,
    },
  ),
    e.add(
      j(
        D.map((e) => [e[0] * 1.07, e[1] + 0.004, e[2] + 0.012]),
        (e) => 0.0065,
        { seg: 5, samples: 40, start: 0, end: 0 },
      ),
      {
        bone: `head`,
        color: X.tealTrimLo,
        r: 0.6,
        detail: 0.4,
        tex: `twill`,
        edge: 1.4,
      },
    ),
    e.add(v(0.098, 0.115, 0.072), {
      at: [0, 1.78, -0.012],
      bone: `head`,
      color: X.void,
      r: 1,
      detail: 0,
      ao: !1,
    }));
  let O = (e) =>
      0.03 +
      0.034 * M(1.652, 1.704, e) +
      0.028 * M(1.7, 1.772, e) -
      0.01 * M(1.8, 1.846, e) -
      0.03 * M(1.846, 1.878, e),
    k = (e, t) => {
      let n = (Math.abs(e) - 0.046) / 0.04,
        r =
          (t - 1.8055) /
          (0.0175 * (1 - 0.25 * Math.max(0, (Math.abs(e) - 0.046) / 0.04)));
      return M(1.25, 0.45, Math.hypot(n, r));
    },
    A = (e, t) => {
      let n = Math.abs(e),
        r =
          0.052 +
          0.05 * M(1.652, 1.712, t) +
          0.018 * M(1.7, 1.782, t) -
          0.024 * M(1.8, 1.852, t) -
          0.036 * M(1.848, 1.878, t);
      return (
        (r -= 3.1 * e * e),
        (r +=
          0.03 * M(0.052, 0.004, n) * M(1.714, 1.784, t) * M(1.872, 1.806, t)),
        (r +=
          0.02 *
          M(0.028, 0.07, n) *
          M(0.108, 0.066, n) *
          M(1.702, 1.742, t) *
          M(1.8, 1.756, t)),
        (r +=
          0.021 * M(1.802, 1.834, t) * M(1.87, 1.838, t) * M(0.09, 0.062, n)),
        (r -= 0.013 * M(1.73, 1.698, t)),
        (r -= 0.014 * k(e, t)),
        r
      );
    },
    P = (-24 * Math.PI) / 180,
    F = [1.762, 0.082],
    I = Math.cos(P),
    z = Math.sin(P),
    B = (e, t, n) => [
      e,
      F[0] + (t - F[0]) * I - (n - F[1]) * z,
      F[1] + (t - F[0]) * z + (n - F[1]) * I,
    ],
    V = (e) => {
      let t = e.y - F[0],
        n = e.z - F[1];
      return { x: e.x, y: F[0] + t * I + n * z, z: F[1] - t * z + n * I };
    },
    ae = (e, t) => B(e, t, A(e, t)),
    oe = (P * 180) / Math.PI,
    H = h(
      40,
      46,
      (e, t, n) => {
        let r = p(1.652, 1.878, t),
          i = e * O(r),
          a = B(i, r, A(i, r));
        n.set(a[0], a[1], a[2]);
      },
      { shell: 0.014 },
    ),
    G = {};
  for (let e of [`mask`, `maskHi`, `maskLo`, `maskJaw`, `maskJawLo`])
    G[e] = new i(X[e]);
  let K = new i(`#2e2549`),
    q = new i(`#4e4580`),
    fe = new i(),
    pe = new i(),
    me = (e, t, n) => pe.copy(e).lerp(t, n),
    he = (e) => {
      let t = V(e),
        n = t.x,
        r = t.y,
        i = Math.abs(n),
        a = me(G.mask, G.maskHi, M(0.018, 0.04, i));
      fe.copy(G.maskJawLo)
        .lerp(G.maskJaw, M(1.664, 1.7, r))
        .lerp(G.maskLo, M(1.698, 1.736, r))
        .lerp(a, M(1.726, 1.772, r));
      let o = Math.hypot(
        i / 0.098,
        (r - 1.826) / (0.046 + 0.012 * M(0, 0.08, i)),
      );
      (fe
        .lerp(G.maskHi, M(1.2, 0.45, o) * 0.92)
        .lerp(G.mask, M(1.838, 1.878, r) * 0.8),
        fe.lerp(G.maskJawLo, M(0.042, 0.03, t.z)));
      let s = M(0.03, 0.008, i) * M(1.73, 1.74, r) * M(1.756, 1.745, r),
        c = Math.max(
          0,
          1 - Math.hypot((i - 0.011) / 0.0085, (r - 1.7425) / 0.0055),
        );
      fe.lerp(q, Math.min(1, s * 0.55 + M(0, 1, c) * 0.5));
      let l = Math.max(
        0,
        1 - Math.hypot((i - 0.036) / 0.012, (r - 1.718) / 0.006),
      );
      return (
        fe.lerp(q, M(0, 1, l) * 0.4),
        fe.lerp(K, M(0.08, 0.9, k(n, r)) * 0.9)
      );
    },
    ge = {
      r: 0.4,
      detail: 0.2,
      tex: `paint`,
      spec: 0.55,
      shade: 0.35,
      aoK: 0.4,
      tri: 1,
      edge: 0.4,
      seam: 0,
    };
  e.add(H, {
    bone: `head`,
    paint: he,
    ...ge,
    emit: X.hoodHi,
    ei: 0.28,
    emitFn: (e) => M(1.772, 1.676, V(e).y) * 0.62,
  });
  let _e = e.lastPhase,
    ye = [0.092, 0.113, 0.06],
    be = 1.765,
    xe = {
      R: ye,
      S: { eyeX: 0.5, eyeY: 0.038000000000000034 / ye[1], browY: 0.62 },
      point: (e, t, n = new c()) => {
        let r = be + e * ye[1],
          i = O(r) * 0.96,
          a = g(t * ye[0], -i, i),
          o = B(a, r, A(a, r));
        return n.set(o[0], o[1], o[2]);
      },
      raw: (e, t, n = new c()) => {
        let r = t * ye[0],
          i = be + e * ye[1],
          a = B(r, i, A(r, i));
        return n.set(a[0], a[1], a[2]);
      },
      normal: (e, t, n = new c()) => {
        let r = 0.01,
          i = xe.raw(e, t + r),
          a = xe.raw(e, t - r),
          o = xe.raw(e + r, t),
          s = xe.raw(e - r, t);
        return n.crossVectors(i.sub(a), o.sub(s)).normalize();
      },
      uvAt: (e, t, n = [0, 0]) => (
        (n[0] = t * ye[0]),
        (n[1] = be + e * ye[1]),
        n
      ),
    },
    J = new i();
  ve(
    e,
    xe,
    [0, 0, 0],
    {
      iris: X.teal,
      irisHi: `#e2fff8`,
      pupil: `#0a0810`,
      glow: X.teal,
      ei: 1.45,
      white: `#cfc8e0`,
      lash: X.brow,
      lower: `#3a2e58`,
      lid: `#6f669a`,
      brow: null,
      eyeW: 0.34,
      eyeH: 0.14,
      irisK: 0.88,
      tilt: -6,
      look: 0.06,
      catch: 1.6,
      lashT: 0.2,
      mat: ge,
      uvPhase: _e,
    },
    (e) => J.set(he(e)),
  );
  for (let t of [1, -1]) {
    let n = t * 0.046,
      r = 1.805;
    (e.add(v(0.028, 0.0026, 0.004, { rings: 4, seg: 10 }), {
      at: B(n, 1.7872, A(n, 1.7872) + 0.003),
      rot: [oe, 0, t * -9],
      bone: `head`,
      color: `#bff6ea`,
      emit: X.teal,
      ei: 1.2,
      ao: !1,
      detail: 0,
    }),
      e.add(
        j(
          [
            B(t * 0.014, 1.8145, A(t * 0.014, 1.8145) + 0.006),
            B(n, 1.8195, A(n, 1.8195) + 0.012),
            B(t * 0.082, 1.8145, A(t * 0.082, 1.8145) + 0.005),
          ],
          (e) => 0.0064 * (0.45 + 0.75 * Math.sin(Math.PI * e)),
          { seg: 9, samples: 12, start: 0.5, end: 0.5 },
        ),
        {
          bone: `head`,
          paint: (e) =>
            fe.copy(G.maskLo).lerp(G.maskJawLo, M(0.03, 0.085, Math.abs(e.x))),
          r: 0.6,
          detail: 0.2,
          tex: `paint`,
          seam: 0,
          edge: 1.2,
        },
      ),
      e.add(
        j(
          [ae(t * 0.074, 1.782), ae(t * 0.067, 1.772), ae(t * 0.06, 1.762)].map(
            (e) => [e[0], e[1], e[2] - 0.0024],
          ),
          (e) => 0.0032 * (0.45 + 0.7 * Math.sin(Math.PI * e)),
          { seg: 7, samples: 7, start: 0.6, end: 0.6 },
        ),
        {
          bone: `head`,
          color: X.tealDeep,
          r: 0.5,
          detail: 0.2,
          ao: !1,
          seam: 0,
        },
      ),
      e.glowCard(`head`, B(n, r, A(n, r) + 0.02), 0.075, X.teal, 0.3));
  }
  e.add(
    j(
      [
        ae(-0.034, 1.7178),
        ae(-0.012, 1.7162),
        ae(0.012, 1.7162),
        ae(0.034, 1.7178),
      ].map((e) => [e[0], e[1], e[2] - 0.0012]),
      (e) => 0.0031 * (0.35 + 0.75 * Math.sin(Math.PI * e)),
      { seg: 5, samples: 12 },
    ),
    { bone: `head`, color: `#3a3060`, r: 0.75, detail: 0.2, ao: !1 },
  );
  for (let t of [1, -1])
    e.add(
      j(
        [
          ae(t * 0.02, 1.7045),
          ae(t * 0.023, 1.6975),
          ae(t * 0.026, 1.6905),
        ].map((e) => [e[0], e[1], e[2] - 0.0022]),
        (e) => 0.0028 * (0.45 + 0.7 * Math.sin(Math.PI * e)),
        { seg: 7, samples: 7, start: 0.6, end: 0.6 },
      ),
      { bone: `head`, color: X.tealDeep, r: 0.5, detail: 0.2, ao: !1, seam: 0 },
    );
  {
    let t = [];
    for (let e = 0; e <= 10; e++) {
      let n = (e / 10 - 0.5) * 2,
        r = n * 0.072,
        i = 1.6545 + Math.abs(n) * 0.062;
      t.push(B(r, i, A(g(r, -O(i), O(i)), i) - 0.004));
    }
    e.add(
      j(
        t.map((e) => [e[0], e[1], e[2] - 0.002]),
        (e) => 0.0046 * (0.5 + 0.8 * Math.sin(Math.PI * e)),
        { seg: 8, samples: 15, start: 0.4, end: 0.4 },
      ),
      {
        bone: `head`,
        paint: (e) =>
          fe.copy(G.maskJawLo).lerp(G.maskJaw, M(1.664, 1.712, V(e).y)),
        r: 0.44,
        detail: 0.2,
        tex: `paint`,
        edge: 1.3,
        seam: 0,
      },
    );
  }
  {
    let t = [];
    for (let e = 0; e <= 8; e++) {
      let n = e / 8,
        r = p(1.872, 1.948, Math.sin(n * Math.PI * 0.5));
      t.push([0, r - n * n * 0.05, p(0.052, -0.175, n)]);
    }
    ce(e, t, {
      bone: `head`,
      r: 0.0125,
      stitch: 0,
      curve: !0,
      up: [0, 1, 0],
      mat: { color: X.hoodHi, r: 0.8, detail: 0.7, tex: `twill` },
    });
    let n = [];
    for (let e = 0; e <= 10; e++) {
      let t = (e / 10 - 0.5) * 2;
      n.push([t * 0.158, 1.905 - t * t * 0.05, -0.028 - t * t * 0.05]);
    }
    ce(e, n, {
      bone: `head`,
      r: 0.011,
      stitch: 0,
      curve: !0,
      up: [0, 1, 0],
      mat: { color: X.hoodHi, r: 0.8, detail: 0.7, tex: `twill` },
    });
  }
  (e.add(
    v(0.052, 0.046, 0.044, {
      rings: 8,
      seg: 14,
      e: 2.3,
      fn: (e) => {
        e.y += Math.sin(e.x * 42) * 0.006;
      },
    }),
    {
      at: [0, 1.874, -0.163],
      bone: `head`,
      grad: [X.hoodDeep, X.hoodHi],
      gradEase: !0,
      r: 0.85,
      detail: 0.9,
      tex: `twill`,
      edge: 1.4,
    },
  ),
    e.add(d(1, 0.0125, { seg: 16, tube: 6 }), {
      at: [0, 1.878, -0.152],
      rot: [72, 0, 0],
      scale: [0.056, 0.05, 1],
      bone: `head`,
      color: X.violetTrim,
      r: 0.5,
      detail: 0.4,
      tex: `metal`,
      emit: X.violet,
      ei: 0.5,
    }));
  for (let t of [1, -1]) {
    let n = [
      [t * 0.022, 1.856, -0.186],
      [t * (0.05 + 0.02 * t), 1.8 + t * 0.012, -0.236],
      [t * (0.062 + 0.03 * t), 1.735 - t * 0.02, -0.262],
    ];
    e.add(
      j(n, (e) => 0.026 * (1 - e * 0.62), {
        seg: 7,
        samples: 10,
        rz: (e) => 0.013 * (1 - e * 0.4),
        twist: (e) => e * 60 * t,
        start: 0.4,
        end: 0.7,
      }),
      {
        bone: `head`,
        grad: [X.hoodDeep, X.hood],
        r: 0.88,
        detail: 0.9,
        tex: `twill`,
      },
    );
  }
  e.add(
    b(
      [
        [1.69, 0.126, 0.118, 2.4],
        [1.735, 0.134, 0.126],
        [1.775, 0.126, 0.118],
      ],
      { seg: 20, start: 0, end: 0, arc: [168, 372] },
    ),
    {
      at: [0, 0, -0.02],
      chain: [`neck`, `head`],
      bw: 0.05,
      grad: [`#120d1e`, X.wrap],
      r: 0.95,
      detail: 0.6,
      tex: `twill`,
      edge: 1.2,
    },
  );
  let Y = (e, t) =>
      y(
        [
          { p: [0, 1.68, -0.02], rx: 0.215 + e, rz: 0.168 + e },
          { p: [0, 1.58, -0.035], rx: 0.325 + e, rz: 0.238 + e },
          { p: [0, 1.46, -0.05], rx: 0.352 + e, rz: 0.262 + e },
          { p: [0, 1.4, -0.055], rx: 0.356 + e, rz: 0.266 + e },
        ],
        {
          seg: 26,
          arc: [-205, 25],
          radial: W(4, 0.04, 2, 1, 0.3),
          flipNormals: t,
        },
      ),
    Se = (e) => {
      let t = e.x >= 0 ? `L` : `R`,
        n = M(0.1, 0.26, Math.abs(e.x)) * 0.4;
      return [
        [l(`chest`), 1 - n],
        [l(`clav` + t), n],
      ];
    };
  e.add(Y(0.01, !1), {
    skin: Se,
    grad: [X.hoodDeep, X.capeHi],
    gradEase: !0,
    teamFn: (e) => 0.55 + 0.45 * (1 - M(1.612, 1.552, e.y)),
    ...r,
    edge: 0.8,
    uvScale: Ne,
  });
  {
    let t = [],
      n = [];
    for (let e = 0; e <= 24; e++) {
      let r = (p(-205, 25, e / 24) * Math.PI) / 180;
      (t.push([
        Math.cos(r) * 0.37,
        1.452 + Math.sin((e * 1.7 * 20) / 24) * 0.008,
        Math.sin(r) * 0.279 - 0.05,
      ]),
        n.push([Math.cos(r), 0.25, Math.sin(r)]));
    }
    le(e, t, n, {
      skin: Se,
      r: 0.0042,
      gap: 0.03,
      mat: { color: X.wrap, ...r },
      stitchMat: { color: X.lav, r: 0.7, tex: `twill` },
    });
  }
  e.add(Y(-0.004, !0), { skin: Se, color: X.wrap, ...r });
  let Ce = [];
  for (let e = 0; e <= 20; e++) {
    let t = (p(-205, 25, e / 20) * Math.PI) / 180;
    Ce.push([
      Math.cos(t) * 0.362,
      1.4 + Math.sin(e * 1.7) * 0.012,
      Math.sin(t) * 0.272 - 0.05,
    ]);
  }
  e.add(j(Ce, 0.012, { seg: 5, samples: 30 }), {
    skin: Se,
    color: X.tealTrim,
    ...r,
    r: 0.7,
    detail: 0.5,
    edge: 1.5,
  });
  {
    let t = [];
    for (let e = 0; e <= 20; e++) {
      let n = (p(-205, 25, e / 20) * Math.PI) / 180;
      t.push([
        Math.cos(n) * 0.368,
        1.418 + Math.sin(e * 1.7) * 0.008,
        Math.sin(n) * 0.278 - 0.05,
      ]);
    }
    e.add(
      j(t, (e) => 0.036, {
        seg: 5,
        samples: 30,
        rz: () => 0.012,
        hint: [0, 1, 0],
      }),
      {
        skin: Se,
        grad: [R, L],
        gradEase: !0,
        team: 1,
        r: 0.7,
        tex: `twill`,
        detail: 0.4,
      },
    );
  }
  for (let [t, n, r] of je) {
    let i = [1, 2, 3, 4].map((e) => `cape${t}${e}`),
      a = t === `C` ? 0.25 : 0.215,
      o =
        t === `C`
          ? [
              [0, 1.55, -0.17],
              [0, 1.3, -0.215],
              [0, 1.04, -0.25],
              [0, 0.78, -0.3],
              [0, 0.54, -0.375],
              [0, 0.34, -0.46],
            ]
          : [
              [n * 0.9, 1.55, -0.17],
              [n, 1.3, -0.205],
              [n * 1.12, 1.05, -0.228],
              [n * 1.25, 0.8, -0.24],
              [n * 1.35, r, -0.245],
            ],
      s = N(
        o,
        t === `C` ? (e) => a * (1 - 0.86 * e * e) : (e) => a - e * 0.06,
        (e) => 0.02 - e * 0.008,
        {
          seg: 14,
          samples: 16,
          hint: [0, 0, 1],
          radial: W(2, 0.12, S(n * 9) * 6, 1, 0.2),
        },
      ),
      c = S(n * 13) * 10;
    (_(s, (e) => {
      e.y < r + 0.12 && (e.y += de(e.x, c, 0.08, 3) * M(r + 0.12, r, e.y));
    }),
      e.add(s, {
        chain: i,
        bw: 0.1,
        paint: (e, t, n) =>
          n.z > 0.2 ? X.wrap : t.y > 1.4 ? X.violetDeep : X.hood,
        r: 0.9,
        detail: 0.95,
        tex: `twill`,
        emit: X.violet,
        ei: 0.3,
        emitFn: (e, t) => M(r + 0.22, r, t.y),
        uvScale: Ne,
      }));
    {
      let n = t === `C` ? (e) => a * (1 - 0.86 * e * e) : (e) => a - e * 0.06,
        r = t === `C` ? 0.78 : 0.8,
        s = o.length - 1,
        c = (e) => {
          let t = e * s,
            n = Math.min(s - 1, Math.floor(t)),
            r = t - n;
          return [
            p(o[n][0], o[n + 1][0], r),
            p(o[n][1], o[n + 1][1], r),
            p(o[n][2], o[n + 1][2], r),
          ];
        };
      for (let t of [1, -1]) {
        let a = [];
        for (let e = 0; e <= 12; e++) {
          let i = (r * e) / 12,
            o = c(i);
          a.push([o[0] + t * n(i) * 0.46, o[1], o[2] - 0.012]);
        }
        le(
          e,
          a,
          a.map(() => [0, 0, -1]),
          {
            chain: i,
            bw: 0.1,
            r: 0.0052,
            gap: 0.028,
            mat: { color: X.violetTrim, r: 0.8, detail: 0.5, tex: `twill` },
            stitchMat: { color: X.lav, r: 0.7, tex: `twill` },
          },
        );
      }
    }
  }
  (e.add(
    N(
      [
        [0.02, 1.66, -0.1],
        [0.03, 1.55, -0.25],
        [0.04, 1.42, -0.39],
        [0.05, 1.3, -0.5],
        [0.06, 1.2, -0.6],
      ],
      (e) => 0.075 - e * 0.035,
      0.012,
      { hint: [0, 1, 0.4], seg: 8, samples: 14 },
    ),
    {
      chain: [`scarf1`, `scarf2`, `scarf3`, `scarf4`],
      bw: 0.08,
      grad: [X.violetDeep, X.violet],
      gradAxis: `z`,
      r: 0.85,
      detail: 0.8,
      tex: `twill`,
      emit: X.teal,
      ei: 0.35,
      emitFn: (e, t) => M(-0.48, -0.6, t.z),
    },
  ),
    e.add(d(1, 0.03, { seg: 22, tube: 6 }), {
      at: [0, 1.64, -0.005],
      rot: [96, 0, 0],
      scale: [0.105, 0.1, 1],
      chain: [`chest`, `neck`],
      bw: 0.03,
      grad: [X.violetDeep, X.violet],
      ...r,
    }));
  let we = 1.62;
  for (let t of [`L`, `R`]) {
    let r = n.bindPos(`weapon` + t),
      i = (e, t, n) => [r.x + e, r.y + t, r.z + n],
      c = { bone: `weapon` + t };
    (e.add(
      j(
        [
          [0, 0.14, 0],
          [0, -0.08, 0],
        ],
        0.032,
        { seg: 8, curve: !1 },
      ),
      {
        ...c,
        at: i(0, 0, 0),
        paint: (e) => (Math.sin(e.y * 90) > 0 ? X.wrap : X.leather),
        ...a,
      },
    ),
      e.add(new s(0.034, 1), {
        ...c,
        at: i(0, 0.17, 0),
        rot: [18, 30, 0],
        scale: [1, 1.32, 1],
        color: `#8f63e8`,
        r: 0.1,
        m: 0.2,
        spec: 1.7,
        detail: 0,
        tex: `gem`,
        emit: X.violet,
        ei: 0.4,
        ao: !1,
        edge: 1.4,
      }),
      e.add(new s(0.015, 1), {
        ...c,
        at: i(0, 0.17, 0),
        rot: [40, 0, 20],
        color: `#f0e2ff`,
        emit: X.lav,
        ei: 1.3,
        r: 0.2,
        detail: 0,
        ao: !1,
      }),
      e.add(d(1, 0.16, { seg: 18, tube: 6 }), {
        ...c,
        at: i(0, 0.158, 0),
        rot: [90, 0, 0],
        scale: [0.034, 0.034, 0.034],
        color: X.steelHi,
        ...o,
        edge: 1.4,
      }));
    for (let t = 0; t < 4; t++) {
      let n = ((t + 0.5) * Math.PI) / 2;
      e.add(
        j(
          [
            [Math.cos(n) * 0.035, 0.152, Math.sin(n) * 0.035],
            [Math.cos(n) * 0.033, 0.176, Math.sin(n) * 0.033],
            [Math.cos(n) * 0.022, 0.19, Math.sin(n) * 0.022],
          ],
          0.0042,
          { seg: 5, samples: 6 },
        ),
        { ...c, at: i(0, 0, 0), color: X.steelHi, ...o, edge: 1.2 },
      );
    }
    (se(e, i(0, 0.115, 0), 0.037, 0.037, {
      ...c,
      bead: 0.0062,
      seg: 12,
      studs: 4,
      studR: 0.0068,
      studH: 0.0048,
      tilt: 90,
      mat: { color: X.steelHi, ...o },
      studMat: { color: X.tealTrim, ...o },
    }),
      se(e, i(0, -0.062, 0), 0.036, 0.036, {
        ...c,
        bead: 0.0068,
        seg: 12,
        studs: 0,
        tilt: 90,
        mat: { color: X.steelHi, ...o },
      }),
      e.add(
        T(
          [
            [-0.075, -0.03],
            [0.12, -0.03],
            [0.15, 0.03],
            [-0.105, 0.03],
          ],
          0.072,
          { bevel: 0.014, crease: 50 },
        ),
        {
          ...c,
          at: i(0, -0.09, 0),
          rot: [0, -90, 0],
          grad: [X.violetDeep, X.steel],
          ...o,
          edge: 1.6,
        },
      ));
    for (let t of [1, -1])
      e.add(
        T(
          [
            [-0.05, -0.012],
            [0.1, -0.012],
            [0.118, 0.014],
            [-0.072, 0.014],
          ],
          0.006,
          { bevel: 0.002, crease: 50 },
        ),
        {
          ...c,
          at: i(t * 0.05, -0.09, 0),
          rot: [0, -90, 0],
          color: X.tealTrim,
          ...o,
          emit: X.teal,
          ei: 0.55,
          edge: 1.2,
        },
      );
    {
      let t = [
          [-0.089, -0.044],
          [0.128, -0.044],
          [0.166, 0.044],
          [-0.121, 0.044],
        ],
        n = [];
      for (let e = 0; e <= 4; e++) {
        let [r, a] = t[e % 4];
        n.push(i(0, -0.09 + a, r));
      }
      e.add(j(n, 0.0075, { seg: 6, samples: 40, curve: !1 }), {
        ...c,
        color: X.steelHi,
        ...o,
        edge: 1.4,
      });
    }
    e.add(Be(we), {
      ...c,
      at: i(0, 0, 0),
      rot: [0, -90, 0],
      grad: [`#4e4480`, `#d9cff8`],
      gradAxis: `x`,
      ...o,
      edge: 1.6,
    });
    for (let t of [1, -1]) {
      let n = [];
      for (let e = 1; e < 14; e++) {
        let r = ze(we, e / 14, 0.88);
        n.push(i(t * (r.h + 0.0025), r.y, r.x));
      }
      ne(e, n, 0.022, X.teal, {
        ...c,
        emit: X.teal,
        ei: 1.35,
        hint: [1, 0, 0],
        thick: 0.006,
      });
    }
    e.glowCard(`weapon` + t, i(0, -0.33 * we, 0.1 * we), 0.55, X.violet, 0.45, {
      stretch: 1.5,
    });
  }
}
var Ie = [0, 0.14, 0.4, 0.72, 1],
  Le = [0.34, 0.8, 1, 0.5, 0.05],
  Re = 0.021;
function ze(e, t, n) {
  let r = ((80 - 150 * t) * Math.PI) / 180,
    i = ((62 - 118 * t) * Math.PI) / 180,
    a = (-0.2 + Math.cos(r) * 0.34) * e,
    o = (-0.36 + Math.sin(r) * 0.33) * e,
    s = (-0.25 + Math.cos(i) * 0.3) * e,
    c = (-0.37 + Math.sin(i) * 0.29) * e,
    l = 0.25 + 0.75 * Math.sin(Math.PI * Math.min(1, 0.08 + t * 0.92)),
    u = 0;
  for (; u < Ie.length - 2 && n > Ie[u + 1]; ) u++;
  let d = (n - Ie[u]) / (Ie[u + 1] - Ie[u]),
    f = Le[u] + (Le[u + 1] - Le[u]) * Math.min(1, Math.max(0, d));
  return { x: s + (a - s) * n, y: c + (o - c) * n, h: Re * f * l };
}
function Be(t) {
  let n = Ie,
    i = [],
    a = [],
    o = n.length * 2;
  for (let e = 0; e <= 30; e++) {
    let r = e / 30;
    for (let e of [1, -1])
      for (let a = 0; a < n.length; a++) {
        let o = ze(t, r, n[e > 0 ? a : n.length - 1 - a]);
        i.push(o.x, o.y, e * o.h);
      }
  }
  for (let e = 0; e < 30; e++)
    for (let t = 0; t < o; t++) {
      let n = e * o + t,
        r = e * o + ((t + 1) % o),
        i = (e + 1) * o + ((t + 1) % o),
        s = (e + 1) * o + t;
      a.push(n, r, i, n, i, s);
    }
  for (let e of [0, 30]) {
    let t = e * o;
    for (let n = 1; n < o - 1; n++)
      e === 0 ? a.push(t, t + n + 1, t + n) : a.push(t, t + n, t + n + 1);
  }
  let s = new e();
  (s.setAttribute(`position`, new r(i, 3)),
    s.setIndex(a),
    s.computeVertexNormals());
  {
    let e = s.attributes.normal,
      t = 0;
    for (let n = 0; n < e.count; n++)
      t += e.getZ(n) * s.attributes.position.getZ(n);
    if (t < 0) {
      let e = s.index.array;
      for (let t = 0; t < e.length; t += 3) {
        let n = e[t + 1];
        ((e[t + 1] = e[t + 2]), (e[t + 2] = n));
      }
      s.computeVertexNormals();
    }
  }
  return s;
}
var Ve = {
    stance: {
      hipT: [0, -0.15, -0.02],
      hips: [8, 12, 0],
      spine: [12, -6, 0],
      chest: [8, -8, 0],
      neck: [-4, 4, 0],
      head: [-12, 6, 0],
      armL: [-40, 20, 24],
      foreL: [-82, 0, 0],
      handL: [0, 0, 10],
      weaponL: [180, 0, 0],
      armR: [-18, -20, -30],
      foreR: [-70, 0, 0],
      handR: [0, 0, -10],
      weaponR: [180, 0, 0],
      footL: [0.09, 0, 0.2, 0],
      footR: [-0.08, 0.02, -0.16, 14],
      capeL1: [6, 0, 5],
      capeC1: [8, 0, 0],
      capeR1: [6, 0, -5],
      scarf1: [-35, 0, 0],
      sash1: [0, 0, 6],
    },
    idle: {},
    splash: {
      extends: `stance`,
      hipT: [-0.04, -0.27, -0.06],
      hips: [14, 30, 4],
      spine: [16, -10, -3],
      chest: [8, -16, -2],
      neck: [-8, 6, 0],
      head: [-16, 12, -5],
      armL: [-66, 34, 34],
      foreL: [-34, 0, 0],
      handL: [0, 0, 24],
      armR: [22, -10, -38],
      foreR: [-84, 0, 0],
      handR: [0, 0, -20],
      footL: [0.13, 0, 0.3, 0],
      footR: [-0.11, 0.02, -0.24, 20],
      capeL1: [14, 0, 8],
      capeC1: [18, 0, 0],
      capeR1: [14, 0, -8],
      scarf1: [-50, 0, 0],
    },
    run: {
      hipT: [0, -0.2, -0.02],
      hips: [10, 0, 0],
      spine: [8, 0, 0],
      chest: [4, 0, 0],
      neck: [-8, 0, 0],
      head: [-12, 0, 0],
      armL: [52, 0, 26],
      foreL: [-30, 0, 0],
      armR: [52, 0, -26],
      foreR: [-30, 0, 0],
      handL: [26, 0, 0],
      handR: [26, 0, 0],
      weaponL: [205, 0, 0],
      weaponR: [205, 0, 0],
      footL: [0, 0, 0, 0],
      footR: [0, 0, 0, 0],
      capeL1: [-26, 0, 5],
      capeC1: [-24, 0, 0],
      capeR1: [-26, 0, -5],
      scarf1: [-10, 0, 0],
    },
    aWind: {
      hipT: [0, -0.18, -0.03],
      hips: [6, -20, 0],
      spine: [8, -14, 0],
      chest: [4, -20, 0],
      neck: [0, 18, 0],
      head: [-6, 16, 0],
      armR: [-120, 0, -70],
      foreR: [-50, 0, 0],
      handR: [0, 0, -20],
      armL: [-50, 10, 30],
    },
    aStrike: {
      extends: `aWind`,
      hipT: [0, -0.22, 0.06],
      hips: [14, 22, 0],
      spine: [18, 12, 0],
      chest: [12, 24, 0],
      neck: [-10, -20, 0],
      head: [-12, -18, 0],
      armR: [-78, 50, 30],
      foreR: [-16, 0, 0],
      handR: [0, 0, 20],
      trail2: 1,
      footL: [0.09, 0, 0.3, 0],
      footR: [-0.08, 0.02, -0.2, 14],
    },
    aFollow: {
      extends: `aStrike`,
      chest: [12, 30, 0],
      armR: [-60, 60, 44],
      trail2: 0,
    },
    bWind: {
      hipT: [0, -0.18, -0.03],
      hips: [6, 22, 0],
      spine: [8, 14, 0],
      chest: [4, 22, 0],
      neck: [0, -18, 0],
      head: [-6, -16, 0],
      armL: [-120, 0, 70],
      foreL: [-50, 0, 0],
      handL: [0, 0, 20],
      armR: [-40, -10, -20],
    },
    bStrike: {
      extends: `bWind`,
      hipT: [0, -0.22, 0.06],
      hips: [14, -22, 0],
      spine: [18, -12, 0],
      chest: [12, -24, 0],
      neck: [-10, 20, 0],
      head: [-12, 18, 0],
      armL: [-78, -50, -30],
      foreL: [-16, 0, 0],
      handL: [0, 0, -20],
      trail: 1,
      footL: [0.09, 0, 0.26, 0],
      footR: [-0.08, 0.02, -0.22, 14],
    },
    bFollow: {
      extends: `bStrike`,
      chest: [12, -30, 0],
      armL: [-60, -60, -44],
      trail: 0,
    },
    lunge: {
      hipT: [0, -0.3, 0.1],
      hips: [26, 0, 0],
      spine: [24, 0, 0],
      chest: [8, 0, 0],
      neck: [-18, 0, 0],
      head: [-20, 0, 0],
      armL: [-84, 0, 12],
      foreL: [-12, 0, 0],
      armR: [-84, 0, -12],
      foreR: [-12, 0, 0],
      handL: [0, 0, 0],
      handR: [0, 0, 0],
      weaponL: [90, 0, 0],
      weaponR: [90, 0, 0],
      footL: [0.08, 0.04, 0.5, 0],
      footR: [-0.08, 0.12, -0.46, 50],
      trail: 1,
      trail2: 1,
      scarf1: [-5, 0, 0],
      capeL1: [-30, 0, 8],
      capeC1: [-30, 0, 0],
      capeR1: [-30, 0, -8],
    },
    qStab: {
      extends: `lunge`,
      hipT: [0, -0.26, 0.08],
      armL: [-72, 0, 14],
      armR: [-72, 0, -14],
      trail: 0,
      trail2: 0,
      emit: 0.6,
    },
    wGuard: {
      hipT: [0, -0.34, -0.04],
      hips: [16, 0, 0],
      spine: [18, 0, 0],
      chest: [8, 0, 0],
      head: [-8, 0, 0],
      armL: [-100, 0, -30],
      foreL: [-100, 0, 0],
      armR: [-100, 0, 30],
      foreR: [-100, 0, 0],
      handL: [0, 0, 0],
      handR: [0, 0, 0],
      footL: [0.14, 0, 0.14, 0],
      footR: [-0.14, 0.02, -0.12, 14],
      emit: 1.4,
      scarf1: [5, 0, 0],
      capeL1: [10, 0, 22],
      capeC1: [12, 0, 0],
      capeR1: [10, 0, -22],
    },
    eWind: {
      hipT: [0, -0.3, 0],
      hips: [10, -30, 0],
      spine: [16, -10, 0],
      chest: [6, -20, 0],
      armL: [-60, 0, -10],
      foreL: [-110, 0, 0],
      armR: [-40, 0, -60],
      foreR: [-40, 0, 0],
      footL: [0.16, 0, 0.1, 0],
      footR: [-0.16, 0, -0.1, 0],
    },
    eSpin: {
      extends: `eWind`,
      root: [0, 360, 0],
      hips: [6, 0, 0],
      chest: [4, 0, 0],
      armL: [-90, 0, 84],
      foreL: [-10, 0, 0],
      armR: [-90, 0, -84],
      foreR: [-10, 0, 0],
      weaponL: [90, 0, 0],
      weaponR: [90, 0, 0],
      trail: 1,
      trail2: 1,
      capeL1: [40, 0, 40],
      capeC1: [45, 0, 0],
      capeR1: [40, 0, -40],
      scarf1: [15, 0, 0],
      emit: 0.8,
    },
    eSpinEnd: { extends: `eSpin`, root: [0, 0, 0], trail: 0, trail2: 0 },
    rLeap: {
      rootT: [0, 0.55, 0.1],
      hipT: [0, -0.12, 0],
      hips: [-10, 0, 0],
      spine: [-14, 0, 0],
      chest: [-12, 0, 0],
      neck: [10, 0, 0],
      head: [16, 0, 0],
      armL: [-170, 0, 20],
      foreL: [-30, 0, 0],
      armR: [-170, 0, -20],
      foreR: [-30, 0, 0],
      handL: [0, 0, 0],
      handR: [0, 0, 0],
      weaponL: [0, 0, 0],
      weaponR: [0, 0, 0],
      footL: [0.06, 0.28, 0.1, 30],
      footR: [-0.06, 0.16, -0.2, 40],
      emit: 1.2,
      capeL1: [-20, 0, 10],
      capeC1: [-20, 0, 0],
      capeR1: [-20, 0, -10],
    },
    rPlunge: {
      extends: `rLeap`,
      rootT: [0, 0, 0.3],
      hipT: [0, -0.42, 0.1],
      hips: [30, 0, 0],
      spine: [30, 0, 0],
      chest: [14, 0, 0],
      neck: [-24, 0, 0],
      head: [-10, 0, 0],
      armL: [-40, 0, 10],
      foreL: [-10, 0, 0],
      armR: [-40, 0, -10],
      foreR: [-10, 0, 0],
      weaponL: [-60, 0, 0],
      weaponR: [-60, 0, 0],
      footL: [0.14, 0, 0.34, 0],
      footR: [-0.12, 0.2, -0.36, 60],
      trail: 1,
      trail2: 1,
      emit: 2,
      capeL1: [40, 0, 20],
      capeC1: [40, 0, 0],
      capeR1: [40, 0, -20],
    },
    recall: {
      hipT: [0, -0.44, -0.08],
      hips: [10, 0, 0],
      spine: [14, 0, 0],
      chest: [6, 0, 0],
      neck: [16, 0, 0],
      head: [14, 0, 0],
      armL: [-40, 0, -20],
      foreL: [-100, 0, 0],
      armR: [-40, 0, 20],
      foreR: [-100, 0, 0],
      handL: [0, 0, 0],
      handR: [0, 0, 0],
      footL: [0.12, 0, 0.22, 0],
      footR: [-0.1, 0.2, -0.3, 70],
      emit: 0.8,
    },
    stun: {
      hipT: [0, -0.1, -0.05],
      spine: [24, 0, 0],
      chest: [10, 0, 0],
      neck: [20, 0, 0],
      head: [20, 0, 0],
      armL: [0, 0, 10],
      foreL: [-20, 0, 0],
      armR: [0, 0, -10],
      foreR: [-20, 0, 0],
      footL: [0.08, 0, 0.04, 0],
      footR: [-0.08, 0, -0.04, 0],
    },
    air: {
      spine: [-6, 0, 0],
      chest: [-5, 0, 0],
      head: [10, 0, 0],
      armL: [-110, 0, 60],
      foreL: [-30, 0, 0],
      armR: [-100, 0, -60],
      foreR: [-40, 0, 0],
      footL: [0.05, 0.3, 0.1, 30],
      footR: [-0.05, 0.08, -0.2, -20],
    },
    flinch: {
      extends: null,
      hipT: [0, -0.02, -0.05],
      spine: [-8, 0, 0],
      chest: [-8, 0, 0],
      head: [16, 0, 0],
    },
    deathA: {
      hipT: [0, -0.1, -0.06],
      spine: [-16, 0, 0],
      chest: [-18, 0, 0],
      head: [30, 0, 0],
      armL: [-40, 0, 40],
      armR: [-40, 0, -40],
      foreR: [-20, 0, 0],
      foreL: [-20, 0, 0],
    },
    deathB: {
      extends: `deathA`,
      hipT: [0, -0.52, 0],
      spine: [30, 0, 0],
      chest: [20, 0, 0],
      head: [30, 0, 0],
      footL: [0.1, 0, 0.26, 0],
      footR: [-0.1, 0, 0.2, 0],
      armL: [10, 0, 16],
      armR: [10, 0, -16],
    },
    deathC: {
      extends: `deathB`,
      root: [-84, 0, 10],
      rootT: [0, 0.18, 0.62],
      hipT: [0, -0.34, 0],
      hips: [10, 0, 0],
      spine: [4, 0, 0],
      chest: [4, 0, 0],
      neck: [-20, -40, 0],
      head: [-20, -30, 0],
      armL: [-150, 0, 40],
      foreL: [-20, 0, 0],
      armR: [-20, 0, -30],
      foreR: [-40, 0, 0],
      footL: [0.14, 0.1, 0.1, -40],
      footR: [-0.1, 0.2, 0, -50],
    },
  },
  He = (e, t) => ({
    bones: [1, 2, 3, 4].map((t) => `cape${e}${t}`),
    tip: [0, e === `C` ? -0.3 : -0.22, 0],
    stiffRoot: 0.42,
    stiffTip: 0.035,
    drag: 2.8,
    gravity: 1,
    hang: 0.65,
    maxAngle: 28,
    flutter: 0.55,
    freq: 6 + t * 0.9,
    phase: t * 2.1,
    collide: [`hips`, `thighL`, `thighR`, `shinL`, `shinR`],
    plane: { bone: `chest`, n: [0, 0, -1], d: 0.1 },
  }),
  Ue = {
    id: `sable`,
    height: 2,
    element: `#8a4dff`,
    rim: `#c9b4ff`,
    proportions: Ae,
    bones: Me,
    build: Fe,
    poses: Ve,
    kneeOut: 0.25,
    elbowPole: [0.6, -0.3, -0.7],
    anchors: {
      weapon: { bone: `weaponR`, p: [0, -0.8, 0.23] },
      muzzle: { bone: `weaponR`, p: [0, -0.57, 0.19] },
      head: { bone: `head`, p: [0, 0.1, 0] },
      chest: { bone: `chest`, p: [0, 0.14, 0.1] },
    },
    trails: [
      {
        bone: `weaponL`,
        a: [0, -0.28, 0.13],
        b: [0, -0.9, 0.23],
        color: `#9d6bff`,
      },
      {
        bone: `weaponR`,
        a: [0, -0.28, 0.13],
        b: [0, -0.9, 0.23],
        color: `#9d6bff`,
      },
    ],
    portrait: {
      yaw: 0.35,
      props: [`weaponL`, `weaponR`],
      rim: `#9a5cff`,
      fill: 0.9,
    },
    colliders: {
      hips: {
        bone: `hips`,
        a: [-0.08, 0, -0.02],
        b: [0.08, 0, -0.02],
        r: 0.15,
      },
      thighL: { bone: `thighL`, a: [0, 0, 0], b: [0, -0.44, 0], r: 0.11 },
      thighR: { bone: `thighR`, a: [0, 0, 0], b: [0, -0.44, 0], r: 0.11 },
      shinL: { bone: `shinL`, a: [0, 0, 0], b: [0, -0.44, 0], r: 0.09 },
      shinR: { bone: `shinR`, a: [0, 0, 0], b: [0, -0.44, 0], r: 0.09 },
      chest: { bone: `chest`, a: [0, 0, -0.02], b: [0, 0.28, -0.02], r: 0.16 },
      head: { bone: `head`, a: [0, 0.08, 0], b: [0, 0.08, 0], r: 0.19 },
    },
    anim: {
      run: { stride: 2.55, lift: 0.2, bob: 0.07, twist: 14, armL: 9, armR: 9 },
      center: 0.8,
      airHeight: 1.2,
      airTumble: 58,
      attackFollow: 0.1,
      attackHold: 0.06,
      breath: 3,
      attacks: [
        { wind: `aWind`, strike: `aStrike`, follow: `aFollow` },
        { wind: `bWind`, strike: `bStrike`, follow: `bFollow` },
      ],
      casts: {
        Q: {
          keys: [
            [0, `lunge`],
            [0.2, `lunge`],
            [0.3, `qStab`, `o`],
          ],
          len: 0.38,
          out: 0.25,
        },
        W: {
          keys: [
            [0, `stance`],
            [0.14, `wGuard`, `o`],
            [0.45, `wGuard`],
          ],
          len: 0.45,
          out: 0.3,
        },
        E: {
          keys: [
            [0, `eWind`],
            [0.06, `eWind`],
            [0.3, `eSpin`, `l`],
            [0.3001, `eSpinEnd`, `l`],
            [0.4, `eSpinEnd`],
          ],
          len: 0.4,
          out: 0.25,
        },
        R: {
          keys: [
            [0, `stance`],
            [0.16, `rLeap`, `o`],
            [0.3, `rLeap`],
            [0.42, `rPlunge`, `i`],
            [0.8, `rPlunge`],
          ],
          len: 0.8,
          out: 0.3,
        },
        spell: { keys: [[0, `stance`]], len: 0.05, out: 0.1, upper: !0 },
      },
      dash: { default: { keys: [[0, `lunge`]] }, Q: { keys: [[0, `lunge`]] } },
      recall: {
        keys: [
          [0, `stance`],
          [0.45, `recall`, `o`],
        ],
      },
      death: {
        keys: [
          [0, `deathA`],
          [0.1, `deathA`, `o`],
          [0.36, `deathB`, `i`],
          [0.68, `deathC`, `i`],
        ],
      },
      cloth: [
        ...je.map(([e], t) => He(e, t)),
        {
          bones: [`scarf1`, `scarf2`, `scarf3`, `scarf4`],
          tip: [0.01, -0.1, -0.1],
          stiffRoot: 0.3,
          stiffTip: 0.03,
          drag: 2.4,
          gravity: 0.8,
          hang: 0.45,
          maxAngle: 32,
          flutter: 0.9,
          freq: 8,
          collide: [`chest`, `head`],
          plane: { bone: `chest`, n: [0, 0, -1], d: 0.1 },
        },
        {
          bones: [`sash1`, `sash2`, `sash3`],
          tip: [0, -0.12, 0],
          stiffRoot: 0.35,
          stiffTip: 0.06,
          drag: 2.4,
          hang: 0.6,
          maxAngle: 28,
          flutter: 0.4,
          collide: [`thighL`],
        },
      ],
      chains: [
        {
          bones: [`hoodTip`],
          drag: 3,
          max: 15,
          flutter: 1.5,
          side: 2,
          k: 120,
          d: 12,
        },
      ],
    },
  },
  Z = {
    navy: `#1f2c63`,
    navyDeep: `#111a3d`,
    navyHi: `#34478c`,
    lav: `#9d7bff`,
    lavHi: `#d2c0ff`,
    lavDeep: `#5a45a8`,
    gold: `#c99a3a`,
    goldHi: `#f6d27a`,
    cyan: `#7ff6ff`,
    cyanDeep: `#2aa9c9`,
    skin: `#f2d2bf`,
    skinDark: `#c79484`,
    hair: `#eef0fb`,
    hairDark: `#8e95c6`,
    paper: `#efe2c4`,
    leather: `#3a2a5e`,
    lining: `#2a1f55`,
  },
  We = {
    hipY: 0.98,
    hipX: 0.09,
    hipDrop: 0.02,
    thigh: 0.43,
    shin: 0.44,
    spineOff: 0.06,
    spine: 0.24,
    chest: 0.36,
    neck: 0.08,
    neckZ: 0.01,
    clavX: 0.06,
    clavY: 0.28,
    shoulderX: 0.15,
    upperArm: 0.29,
    foreArm: 0.27,
  },
  Ge = [0, 1.84, 0.02],
  Ke = [0.112, 0.138, 0.122],
  qe = (e) => {
    let t = M(1.04, 0.04, e);
    return [p(0.165, 0.4, t ** 0.85), p(0.14, 0.34, t ** 0.85)];
  },
  Je = [
    [`FL`, 48, `skirtF`],
    [`FR`, -48, `skirtF`],
    [`BL`, 138, `skirtB`],
    [`BR`, -138, `skirtB`],
  ];
function Ye(e) {
  let t = F(e),
    n = (e, n, r, i, a) => t.push({ name: e, parent: n, pos: [r, i, a] });
  (n(`orbR`, `handR`, 0, -0.37, 0.05),
    n(`ring1`, `orbR`, 0, 0, 0),
    n(`ring2`, `orbR`, 0, 0, 0),
    n(`ring3`, `orbR`, 0, 0, 0),
    n(`tomeRoot`, `chest`, 0, 0, 0),
    n(`tome`, `tomeRoot`, 0.44, -0.06, 0.2),
    n(`tomeCL`, `tome`, 0, 0, 0),
    n(`tomeCR`, `tome`, 0, 0, 0),
    n(`halo`, `head`, 0, 0.14, -0.14),
    n(`pony1`, `head`, 0, 0.1, -0.13),
    n(`pony2`, `pony1`, 0, -0.17, -0.05),
    n(`pony3`, `pony2`, 0, -0.17, -0.03),
    n(`pony4`, `pony3`, 0, -0.16, -0.01));
  for (let e of [`skirtF`, `skirtB`, `skirtL`, `skirtR`]) n(e, `hips`, 0, 0, 0);
  let r = e.hipY;
  for (let [e, t, i] of Je) {
    let a = (t * Math.PI) / 180,
      o = (e) => {
        let [t, n] = qe(e);
        return [Math.sin(a) * (t + 0.03), e, Math.cos(a) * (n + 0.03)];
      },
      s = [0.95, 0.66, 0.38],
      c = [0, r, 0];
    s.forEach((t, r) => {
      let a = o(t);
      (n(
        `coat${e}${r + 1}`,
        r === 0 ? i : `coat${e}${r}`,
        a[0] - c[0],
        a[1] - c[1],
        a[2] - c[2],
      ),
        (c = a));
    });
  }
  return (
    n(`sash1`, `hips`, 0.19, 0.04, 0.12),
    n(`sash2`, `sash1`, 0.05, -0.16, 0.04),
    n(`sash3`, `sash2`, 0.04, -0.16, 0.03),
    t
  );
}
function Xe(e, t, n) {
  let r = { r: 0.84, m: 0, detail: 0.8, tex: `cloth` },
    i = { r: 0.6, m: 0, detail: 0.7, tex: `cloth`, spec: 0.22 },
    a = { r: 0.3, m: 0.9, detail: 0.6, tex: `metal` },
    o = { r: 0.6, m: 0, detail: 0.5, tex: `skin` },
    s = { r: 0.5, detail: 1, tex: `hair` },
    c = (e) => n.index(e),
    l = (e, t = 0.006) =>
      T(
        [
          [0, e],
          [e * 0.25, e * 0.25],
          [e, 0],
          [e * 0.25, -e * 0.25],
          [0, -e],
          [-e * 0.25, -e * 0.25],
          [-e, 0],
          [-e * 0.25, e * 0.25],
        ],
        t,
        { bevel: 0.002, bevelSeg: 1 },
      ),
    u = (e) => {
      let t = M(1, 0.25, e.y),
        n = Math.atan2(e.x, e.z),
        r = Math.cos(n),
        i = Math.sin(n);
      return [
        [c(`hips`), 1 - t],
        [c(`skirtF`), t * Math.max(0, r) ** 2],
        [c(`skirtB`), t * Math.max(0, -r) ** 2],
        [c(`skirtL`), t * Math.max(0, i) ** 2],
        [c(`skirtR`), t * Math.max(0, -i) ** 2],
      ]
        .filter((e) => e[1] > 0.002)
        .sort((e, t) => t[1] - e[1])
        .slice(0, 4);
    },
    f = [];
  for (let e = 0; e <= 13; e++) {
    let t = p(0.05, 1.05, e / 13),
      [n, r] = qe(t);
    f.push([t, n, r]);
  }
  let m = b(f, { seg: 72, start: 0, end: 0, radial: W(7, 0.14, 1.3, 2, 0.1) });
  (_(m, (e) => {
    let t = Math.atan2(e.z, e.x),
      n = M(1.04, 0.22, e.y),
      r = Math.cos(t * 7 + 0.6),
      i = 1 + 0.075 * n * r * Math.abs(r);
    ((e.x *= i),
      (e.z *= i),
      e.y < 0.14 &&
        (e.y += (0.5 + 0.5 * Math.cos(t * 18)) * 0.022 * M(0.14, 0.05, e.y)));
  }),
    e.add(m, {
      skin: u,
      paint: (e) =>
        e.y < 0.1
          ? Z.goldHi
          : e.y < 0.135
            ? Z.gold
            : e.y < 0.165
              ? Z.lavDeep
              : e.y > 0.92
                ? Z.navyDeep
                : Z.navy,
      ...r,
    }),
    e.add(
      b(
        [
          [0.07, qe(0.07)[0] * 0.84, qe(0.07)[1] * 0.84],
          [0.26, qe(0.26)[0] * 0.82, qe(0.26)[1] * 0.82],
        ],
        { seg: 32, start: 0, end: 0, flipNormals: !0 },
      ),
      { skin: u, color: Z.navyDeep, ...r, ao: !1 },
    ));
  for (let t = 0; t < 12; t++) {
    let n = S(t * 3.1) * 360,
      r = 0.22 + S(t * 7.7) * 0.62,
      i = 0.018 + S(t * 1.9) * 0.02,
      [a, o] = qe(r),
      s = (n * Math.PI) / 180,
      c = Math.sin(s) * a * 1.11,
      d = Math.cos(s) * o * 1.11;
    e.add(l(i), {
      at: [c, r, d],
      rot: [0, n, 0],
      skin: u,
      color: Z.goldHi,
      emit: Z.cyan,
      ei: 0.9,
      ao: !1,
      r: 0.3,
      detail: 0,
    });
  }
  for (let [t, r, o] of Je) {
    let s = [1, 2, 3].map((e) => `coat${t}${e}`),
      l = t[0] === `F`,
      u = l ? 38 : 44,
      d = 90 - r,
      f = l
        ? t[1] === `L`
          ? [d - u + 10, d + u]
          : [d - u, d + u - 10]
        : [d - u, d + u],
      m = (e, t = 14) => {
        let n = [];
        for (let r = 0; r <= t; r++) {
          let i = p(1.02, l ? 0.16 : 0.1, r / t),
            [a, o] = qe(i);
          n.push({ p: [0, i, 0], rx: a + 0.03 + e, rz: o + 0.03 + e });
        }
        return n;
      },
      h = n.bindPos(s[0]).y,
      g = (e) => {
        let t = M(h - 0.01, h + 0.07, e.y),
          r = n ? Ze(n, s, e) : [];
        return [[c(o), t], ...r.map(([e, n]) => [e, n * (1 - t)])]
          .filter((e) => e[1] > 0.002)
          .sort((e, t) => t[1] - e[1])
          .slice(0, 4);
      },
      v = W(l ? 5 : 6, 0.115, r * 0.1, 1, 0.16),
      b = y(m(0.006), { seg: 30, arc: f, radial: v }),
      x = y(m(-0.008, 9), { seg: 16, arc: f, radial: v, flipNormals: !0 });
    _(b, (e) => {
      let t = Math.atan2(e.z, e.x),
        n = M(1.02, l ? 0.16 : 0.1, e.y);
      Math.hypot(e.x, e.z);
      let i = 1 + Math.cos(t * (l ? 5 : 6) * 2 + r * 0.2) * 0.035 * n * n;
      ((e.x *= i), (e.z *= i));
    });
    let S = l ? 0.16 : 0.1;
    (e.add(b, {
      skin: g,
      paint: (e) =>
        e.y < S + 0.05 ? Z.goldHi : e.y > 0.97 ? Z.lavDeep : Z.lav,
      teamFn: (e) =>
        M(S + 0.265, S + 0.23, e.y) * (1 - M(S + 0.115, S + 0.088, e.y)),
      ...i,
      shade: 1,
    }),
      e.add(x, {
        skin: g,
        color: Z.lining,
        team: 1,
        r: 0.8,
        detail: 0.5,
        tex: `cloth`,
        ao: !0,
      }));
    let C = (e, t, n) => {
        let r = [];
        for (let i = 0; i <= 8; i++) {
          let a = p(t, n, i / 8),
            [o, s] = qe(a),
            c = (e * Math.PI) / 180,
            l = v(0, c);
          r.push([
            Math.cos(c) * (o + 0.03) * l,
            a,
            Math.sin(c) * (s + 0.03) * l,
          ]);
        }
        return r;
      },
      w = [];
    for (let e = 0; e <= 12; e++) {
      let t = (p(f[0], f[1], e / 12) * Math.PI) / 180,
        [n, r] = qe(S),
        i = v(1, t);
      w.push([Math.cos(t) * (n + 0.03) * i, S, Math.sin(t) * (r + 0.03) * i]);
    }
    e.add(j(w, 0.013, { seg: 5, samples: 14 }), {
      skin: g,
      color: Z.goldHi,
      ...a,
    });
    for (let t of f)
      e.add(j(C(t, 1, S), 0.012, { seg: 5, samples: 10 }), {
        skin: g,
        color: Z.gold,
        ...a,
      });
  }
  (e.add(
    y(
      [
        { p: [0, 0.92, 0], rx: 0.155, rz: 0.125 },
        { p: [0, 1.02, 0], rx: 0.165, rz: 0.13 },
        { p: [0, 1.14, 0], rx: 0.145, rz: 0.115 },
        { p: [0, 1.29, 0.012], rx: 0.172, rz: 0.13 },
        { p: [0, 1.43, 0.02], rx: 0.2, rz: 0.14 },
        { p: [0, 1.54, 0], rx: 0.198, rz: 0.131 },
        { p: [0, 1.578, -0.004], rx: 0.152, rz: 0.114 },
        { p: [0, 1.61, -0.004], rx: 0.098, rz: 0.088 },
        { p: [0, 1.655, 0.002], rx: 0.07, rz: 0.066 },
        { p: [0, 1.715, 0.012], rx: 0.054, rz: 0.054 },
      ],
      {
        seg: 24,
        start: 0.5,
        end: 0.3,
        radial: ee([
          [0.6, 60, 0.12, 30, 0.08],
          [0.6, 120, 0.12, 30, 0.08],
        ]),
      },
    ),
    {
      chain: [`hips`, `spine`, `chest`, `neck`],
      bw: 0.08,
      paint: (e) =>
        e.z > 0.1 && Math.abs(e.x) < 0.028 && e.y < 1.58
          ? Z.goldHi
          : e.z > 0.1 && Math.abs(e.x) < 0.04 && e.y < 1.58
            ? Z.gold
            : e.y < 1.2
              ? Z.navyDeep
              : Z.navy,
      ...r,
    },
  ),
    e.add(d(1, 0.05, { seg: 32, tube: 8 }), {
      at: [0, 1.03, 0],
      rot: [90, 0, 0],
      scale: [0.172, 0.14, 1],
      bone: `hips`,
      grad: [Z.lavDeep, Z.lav],
      gradAxis: `x`,
      ...i,
    }),
    e.add(d(1, 0.016, { seg: 32, tube: 6 }), {
      at: [0, 1.03, 0],
      rot: [90, 0, 0],
      scale: [0.195, 0.162, 1],
      bone: `hips`,
      color: Z.goldHi,
      ...a,
    }),
    e.add(
      b(
        [
          [1.38, 0.088, 0.088],
          [1.45, 0.09, 0.09],
        ],
        { seg: 18, start: 0, end: 0 },
      ),
      {
        at: [0.21, 0, 0],
        bone: `armL`,
        grad: [R, L],
        gradEase: !0,
        team: 1,
        r: 0.6,
        tex: `cloth`,
        detail: 0.4,
        mirror: !0,
      },
    ),
    e.add(
      v(0.05, 0.045, 0.04, {
        fn: (e) => {
          e.y += Math.sin(e.x * 60) * 0.006;
        },
      }),
      { at: [0.17, 1.03, 0.11], bone: `hips`, color: Z.lav, ...i },
    ));
  let h = N(
    [
      [0.19, 1.02, 0.12],
      [0.24, 0.86, 0.16],
      [0.28, 0.7, 0.19],
      [0.3, 0.56, 0.2],
    ],
    (e) => 0.075 - e * 0.02,
    0.012,
    { hint: [0.5, 0, 0.85] },
  );
  (e.add(h, {
    chain: [`sash1`, `sash2`, `sash3`],
    bw: 0.06,
    paint: (e, t) => (t.y < 0.62 ? Z.goldHi : Z.lav),
    ...i,
  }),
    se(e, [0, 1.028, 0], 0.197, 0.164, {
      bone: `hips`,
      bead: 0,
      studs: 18,
      studR: 0.0125,
      studH: 0.0085,
      studOut: 0.006,
      seg: 24,
      studMat: { color: Z.goldHi, ...a },
    }),
    e.add(l(0.05, 0.012), {
      at: [0, 1.03, 0.2],
      bone: `hips`,
      color: Z.goldHi,
      ...a,
    }));
  for (let [t, n, r, o] of [
    [1.49, 0.31, 0.225, Z.lavDeep],
    [1.555, 0.275, 0.2, Z.lav],
  ]) {
    let s = b(
      [
        [t - 0.11, n, r, 2.2],
        [t - 0.02, n * 0.86, r * 0.86],
        [t + 0.06, n * 0.54, r * 0.62],
        [t + 0.1, 0.12, 0.1],
      ],
      { seg: 42, start: 0, end: 0, radial: W(6, 0.05, t * 10, 0, 0) },
    );
    _(s, (e) => {
      if (e.y < t - 0.05) {
        let t = Math.atan2(e.z, e.x);
        e.y += (0.5 + 0.5 * Math.cos(t * 6)) * 0.034;
      }
    });
    let l = (e) => {
      let t = e.x >= 0 ? `L` : `R`,
        n = M(0.12, 0.3, Math.abs(e.x)) * 0.35;
      return [
        [c(`chest`), 1 - n],
        [c(`clav` + t), n],
      ];
    };
    e.add(s, {
      skin: l,
      grad: [o, Z.lavHi],
      gradEase: !0,
      teamFn:
        t < 1.5
          ? (e) => 0.8 * (1 - M(t - 0.105, t - 0.052, e.y))
          : (e) => 0.92 * (1 - M(t - 0.105, t + 0.004, e.y)),
      ...i,
    });
    let u = [];
    for (let e = 0; e <= 42; e++) {
      let i = (e / 42) * Math.PI * 2,
        a = 1 + 0.05 * Math.sin(i * 6 + t * 10);
      u.push([
        Math.cos(i) * n * a,
        t - 0.11 + (0.5 + 0.5 * Math.cos(i * 6)) * 0.034,
        Math.sin(i) * r * a,
      ]);
    }
    e.add(j(u, 0.012, { seg: 5, curve: !1, start: 0, end: 0 }), {
      skin: l,
      color: Z.goldHi,
      ...a,
    });
    for (let i = 0; i < 6; i++) {
      let o = (i / 6) * Math.PI * 2 + 0.52,
        s = 1 + 0.05 * Math.sin(o * 6 + t * 10);
      e.add(v(0.017, 0.012, 0.017, { rings: 4, seg: 8 }), {
        skin: l,
        at: [
          Math.cos(o) * n * s * 0.97,
          t - 0.104 + (0.5 + 0.5 * Math.cos(o * 6)) * 0.034,
          Math.sin(o) * r * s * 0.97,
        ],
        color: Z.goldHi,
        ...a,
      });
    }
  }
  for (let [t, n] of [
    [1, !1],
    [0.9, !0],
  ]) {
    let r = y(
      [
        { p: [0, 1.6, -0.01], rx: 0.115 * t, rz: 0.1 * t },
        { p: [0, 1.72, -0.02], rx: 0.15 * t, rz: 0.13 * t },
        { p: [0, 1.83, -0.05], rx: 0.21 * t, rz: 0.165 * t },
      ],
      { seg: 24, arc: [140, 400], flipNormals: n },
    );
    e.add(r, {
      chain: [`chest`, `neck`],
      bw: 0.03,
      paint: (e) => (e.y > 1.8 ? Z.goldHi : n ? Z.navyDeep : Z.lav),
      teamFn: n ? null : (e) => 0.85 * M(1.81, 1.7, e.y) * M(1.59, 1.64, e.y),
      ...i,
    });
  }
  {
    let t = [];
    for (let e = 0; e <= 24; e++) {
      let n = (p(150, 390, e / 24) * Math.PI) / 180;
      t.push([
        Math.cos(n) * 0.131,
        1.644 + Math.sin(e * 1.3) * 0.004,
        Math.sin(n) * 0.114 - 0.012,
      ]);
    }
    (e.add(
      j(t, (e) => 0.052 * (0.78 + 0.22 * Math.sin(Math.PI * e)), {
        seg: 6,
        samples: 30,
        rz: () => 0.026,
        hint: [0, 1, 0],
      }),
      {
        chain: [`chest`, `neck`],
        bw: 0.03,
        grad: [R, L],
        gradEase: !0,
        team: 1,
        r: 0.7,
        tex: `cloth`,
        detail: 0.5,
      },
    ),
      e.add(
        j(
          t.map((e) => [e[0] * 1.03, e[1] + 0.017, e[2] * 1.03]),
          0.0085,
          { seg: 5, samples: 30 },
        ),
        { chain: [`chest`, `neck`], bw: 0.03, color: Z.goldHi, ...a },
      ));
    for (let t = 0; t < 5; t++) {
      let n = (p(170, 370, t / 4) * Math.PI) / 180;
      e.add(v(0.015, 0.011, 0.015, { rings: 5, seg: 11 }), {
        chain: [`chest`, `neck`],
        bw: 0.03,
        at: [Math.cos(n) * 0.136, 1.646, Math.sin(n) * 0.119 - 0.012],
        color: Z.goldHi,
        ...a,
      });
    }
  }
  (te(
    e,
    n,
    [`thighL`, `shinL`, `footL`],
    [
      [0, 0.07, 0.075],
      [0.3, 0.058, 0.062],
      [0.5, 0.045, 0.048],
      [0.8, 0.04, 0.042],
      [0.97, 0.038, 0.04],
    ],
    {
      from: [0, 0.04, 0],
      seg: 10,
      start: 0,
      end: 0,
      color: Z.navyDeep,
      mirror: !0,
      ...r,
      rings: 8,
    },
  ),
    e.add(
      y(
        [
          { p: [0, 0.05, -0.07], rx: 0.05, rz: 0.05 },
          { p: [0, 0.058, 0.02], rx: 0.058, rz: 0.054 },
          { p: [0, 0.042, 0.13], rx: 0.04, rz: 0.034 },
          { p: [0, 0.07, 0.21], rx: 0.01, rz: 0.01 },
        ],
        { seg: 12, start: 0.4, end: 0, hint: [0, 1, 0] },
      ),
      {
        at: [0.09, 0, 0],
        bone: `footL`,
        grad: [Z.lavDeep, Z.lav],
        mirror: !0,
        ...i,
      },
    ),
    ie(e, [0.09, 0, 0.015], 1, 0.8, {
      bone: `footL`,
      mirror: !0,
      w: 0.056,
      toe: 0.17,
      heel: 0.085,
      soleH: 0.024,
      proud: 0.011,
      stitch: 12,
      capH: 0.022,
      mat: { grad: [Z.lavDeep, Z.lav], ...i },
      soleMat: { color: Z.navyDeep, ...i, r: 0.85 },
      toeMat: { color: Z.goldHi, ...a },
      heelMat: { color: Z.navyDeep, ...i },
    }),
    te(
      e,
      n,
      [`armL`, `foreL`, `handL`],
      [
        [0, 0.078, 0.078],
        [0.15, 0.082, 0.082],
        [0.45, 0.08, 0.08],
        [0.72, 0.1, 0.1],
        [0.94, 0.13, 0.125],
        [1, 0.128, 0.122],
      ],
      {
        from: [0, 0.04, 0],
        ext: -0.02,
        seg: 16,
        rings: 12,
        start: 0.3,
        end: `flat`,
        radial: W(4, 0.06, 2.1, 1, 0.3),
        paint: (e, t) =>
          t.y < 1.01
            ? Z.navyDeep
            : t.y < 1.05
              ? Z.goldHi
              : t.y < 1.09
                ? Z.lavHi
                : Z.navy,
        mirror: !0,
        ...r,
      },
    ),
    te(
      e,
      n,
      [`foreL`, `handL`],
      [
        [0.55, 0.036, 0.036],
        [0.85, 0.034, 0.036],
        [1, 0.03, 0.032],
      ],
      {
        ext: 0.01,
        seg: 10,
        start: 0,
        end: 0,
        grad: [Z.skinDark, Z.skin],
        mirror: !0,
        ...o,
        rings: 6,
      },
    ),
    re(e, [0.21, 0.985, 0.005], 1, 1.42, {
      bone: `handL`,
      curl: 0.45,
      thumb: 0.35,
      spread: 1.15,
      fat: 1.1,
      jitter: 1.5,
      mat: { grad: [Z.skinDark, Z.skin], mirror: !0, ...o },
      nail: `#f6dcd0`,
      creaseMat: { color: Z.skinDark, mirror: !0, ...o },
      webMat: { color: Z.skinDark, mirror: !0, ...o },
      cuff: {
        studs: 6,
        flare: 0.08,
        mat: { grad: [Z.gold, Z.goldHi], mirror: !0, ...a },
        studMat: { color: Z.goldHi, mirror: !0, ...a },
      },
    }));
  let g = pe(Ke, { ...fe.fine }),
    x = _e(g, {
      skin: Z.skin,
      skinDark: Z.skinDark,
      blush: `#eea2a0`,
      lip: `#c47386`,
      shade: `#a98aa6`,
      mouth: `#6a3048`,
    });
  e.add(g.geo, {
    at: Ge,
    bone: `head`,
    paint: x,
    ...o,
    detail: 0.25,
    edge: 0.3,
    shade: 0,
  });
  let C = e.lastPhase;
  ve(
    e,
    g,
    Ge,
    {
      iris: `#35d8ee`,
      irisHi: `#d8ffff`,
      glow: `#2bb8d0`,
      ei: 1.5,
      white: `#eef2fa`,
      lash: `#1c1638`,
      brow: `#aeb2dc`,
      lower: `#8a6a96`,
      lid: `#9a86c0`,
      eyeW: 0.31,
      eyeH: 0.17,
      browW: 0.34,
      browT: 0.28,
      browTilt: 0.05,
      tilt: 5,
      mat: { ...o, detail: 0.25 },
      uvPhase: C,
    },
    x,
  );
  for (let t of [1, -1])
    e.add(v(0.018, 0.034, 0.014), {
      at: [t * 0.108, 1.83, 0.005],
      rot: [0, 0, t * -10],
      bone: `head`,
      grad: [Z.skinDark, Z.skin],
      ...o,
    });
  let E = v(Ke[0] + 0.012, Ke[1] + 0.01, Ke[2] + 0.012, {
    rings: 14,
    seg: 28,
    e: 2.1,
    fn: (e) => {
      (e.z > 0.035 &&
        e.y < 0.07 &&
        (e.z = 0.035 + (e.z - 0.035) * 0.12 - (0.07 - e.y) * 0.35),
        e.y < -0.07 && e.z > -0.06 && (e.y = -0.07));
    },
  });
  e.add(E, {
    at: [Ge[0], Ge[1] + 0.025, Ge[2] - 0.006],
    bone: `head`,
    grad: [Z.hairDark, Z.hair],
    gradEase: !0,
    ...s,
  });
  let D = [Ge[0], Ge[1] + 0.025, Ge[2] - 0.006],
    O = [Ke[0] + 0.02, Ke[1] + 0.018, Ke[2] + 0.02],
    k = { bone: `head`, grad: [Z.hairDark, Z.hair], ...s };
  for (let t = 0; t < 11; t++) {
    let n = -150 + t * 30 + (S(t) - 0.5) * 8,
      r = Math.abs(n) > 70;
    Math.abs(n) < 45 ||
      ae(
        e,
        oe(
          D,
          O,
          78,
          n * 0.3,
          r ? -25 : 5,
          n,
          0.006,
          r ? [Math.sin((n * Math.PI) / 180) * 0.04, -0.08, -0.03] : null,
        ),
        0.06,
        { twist: 30 + S(t * 2) * 40, thick: 0.26, mat: k },
      );
  }
  for (let [t, n] of [
    [18, 40],
    [-10, -45],
    [40, 55],
  ])
    ae(
      e,
      oe(D, O, 70, t * 0.4, 32, n, 0.008, [Math.sign(n) * 0.03, -0.02, 0.01]),
      0.055,
      { twist: Math.sign(n) * 50, thick: 0.25, mat: k },
    );
  for (let t of [1, -1])
    ae(
      e,
      [
        [t * 0.1, 1.93, 0.07],
        [t * 0.128, 1.84, 0.1],
        [t * 0.125, 1.72, 0.1],
        [t * 0.11, 1.6, 0.07],
        [t * 0.1, 1.53, 0.04],
      ],
      0.042,
      { twist: t * 70, thick: 0.32, taper: 0.7, mat: k },
    );
  let A = [];
  for (let e = 0; e <= 8; e++) {
    let t = e / 8;
    A.push([Math.sin(t * 7) * 0.008, 1.94 - t * 0.64, -0.14 - t * 0.1]);
  }
  e.add(
    j(A, (e) => 0.042 * (1 - e * 0.45), {
      seg: 10,
      samples: 40,
      twist: (e) => e * 900,
      radial: (e, t) => 1 + 0.22 * Math.abs(Math.sin(e * 34 + t)) - 0.1,
      start: 0.6,
      end: 0.4,
    }),
    {
      chain: [`pony1`, `pony2`, `pony3`, `pony4`],
      bw: 0.07,
      grad: [Z.hairDark, Z.hair],
      ...s,
    },
  );
  for (let [t, n] of [
    [1.92, -0.145],
    [1.32, -0.235],
  ])
    e.add(d(1, 0.012, { seg: 16 }), {
      at: [0, t, n],
      rot: [90 + (t > 1.5 ? 20 : 8), 0, 0],
      scale: [0.036, 0.036, 1],
      chain: [`pony1`, `pony2`, `pony3`, `pony4`],
      bw: 0.02,
      color: Z.goldHi,
      ...a,
    });
  (e.add(
    v(0.03, 0.05, 0.03, {
      fn: (e) => {
        e.y < 0 && (e.x *= 1 + e.y * 4);
      },
    }),
    {
      at: [0, 1.26, -0.24],
      chain: [`pony3`, `pony4`],
      bw: 0.02,
      color: Z.hairDark,
      ...s,
    },
  ),
    e.add(d(1, 0.011, { seg: 36 }), {
      at: [0, 1.915, 0.012],
      rot: [100, 0, 0],
      scale: [0.132, 0.14, 1],
      bone: `head`,
      color: Z.goldHi,
      ...a,
    }),
    e.add(l(0.026, 0.01), {
      at: [0, 1.948, 0.142],
      rot: [-20, 0, 45],
      bone: `head`,
      color: Z.gold,
      ...a,
    }));
  let P = n.bindPos(`halo`),
    F = 0.3;
  (e.add(d(F, 0.013, { seg: 56 }), {
    at: [P.x, P.y, P.z],
    rot: [26, 0, 0],
    bone: `halo`,
    color: Z.goldHi,
    ...a,
    emit: Z.goldHi,
    ei: 0.3,
  }),
    e.add(d(F * 0.72, 0.008, { seg: 44 }), {
      at: [P.x, P.y, P.z + 0.03],
      rot: [26, 0, 34],
      bone: `halo`,
      color: Z.gold,
      ...a,
      emit: Z.goldHi,
      ei: 0.22,
    }));
  for (let t = 0; t < 9; t++) {
    let n = (t / 9) * Math.PI * 2,
      r = [
        P.x + Math.cos(n) * F,
        P.y + Math.sin(n) * F * Math.cos((26 * Math.PI) / 180),
        P.z + Math.sin(n) * F * Math.sin((26 * Math.PI) / 180),
      ];
    e.add(l(t === 1 ? 0.055 : 0.032), {
      at: r,
      rot: [26, 0, n * 57.3],
      bone: `halo`,
      color: `#ffffff`,
      emit: Z.cyan,
      ei: 2.2,
      ao: !1,
      detail: 0,
    });
  }
  e.glowCard(`halo`, [P.x, P.y + 0.3, P.z], 0.2, Z.cyan, 0.7);
  let I = n.bindPos(`orbR`);
  (e.add(v(0.102, 0.102, 0.102, { rings: 14, seg: 20 }), {
    at: [I.x, I.y, I.z],
    bone: `orbR`,
    color: `#e6ffff`,
    emit: Z.cyan,
    ei: 2.4,
    emitFn: (e) => 0.75 + 0.5 * Math.max(0, (e.y / 0.102) * 0.5 + 0.5) ** 2,
    ao: !1,
    detail: 0,
    r: 0.1,
    seam: 0,
  }),
    e.add(l(0.07, 0.01), {
      at: [I.x, I.y, I.z + 0.1],
      bone: `orbR`,
      color: `#ffffff`,
      emit: `#ffffff`,
      ei: 3.2,
      ao: !1,
      detail: 0,
      seam: 0,
    }),
    e.glowCard(`orbR`, [I.x, I.y, I.z], 0.75, Z.cyan, 0.9),
    e.glowCard(`orbR`, [I.x, I.y, I.z], 0.32, `#ffffff`, 0.9),
    [
      [`ring1`, 0.195, 0.015, Z.goldHi],
      [`ring2`, 0.25, 0.012, Z.gold],
      [`ring3`, 0.3, 0.008, Z.lavHi],
    ].forEach(([t, n, r, i], o) => {
      e.add(d(n, r, { seg: 36, tube: 5 }), {
        at: [I.x, I.y, I.z],
        rot: [90, 0, 0],
        bone: t,
        color: i,
        ...a,
        emit: o === 2 ? Z.lav : null,
        ei: o === 2 ? 0.8 : 0,
      });
      for (let r = 0; r < 8; r++) {
        let o = (r / 8) * Math.PI * 2;
        e.add(w(0.016, 0.016, 0.036, { e: 3, seg: 6 }), {
          at: [I.x + Math.cos(o) * n, I.y, I.z + Math.sin(o) * n],
          rot: [0, -o * 57.3, 0],
          bone: t,
          color: r % 2 == 0 ? Z.cyan : i,
          ...a,
          emit: r % 2 == 0 ? Z.cyan : null,
          ei: 1.2,
        });
      }
    }));
  let z = n.bindPos(`tome`),
    B = 1.45,
    V = (e, t, n) => [z.x + e * B, z.y + t * B, z.z + n * B];
  for (let [t, n] of [
    [`tomeCL`, 1],
    [`tomeCR`, -1],
  ]) {
    e.add(w(0.15 * B, 0.022 * B, 0.21 * B, { e: 5 }), {
      at: V(n * 0.078, -0.012, 0),
      bone: t,
      grad: [Z.leather, Z.lavDeep],
      r: 0.6,
      detail: 0.8,
      tex: `leather`,
    });
    let r = w(0.14 * B, 0.03 * B, 0.2 * B, { e: 8 });
    (_(r, (e) => {
      e.y += Math.sin(e.x * 18) * 0.004;
    }),
      e.add(r, {
        at: V(n * 0.074, 0.012, 0),
        bone: t,
        grad: [Z.paper, `#fff8e6`],
        r: 0.9,
        detail: 0.6,
        tex: `paint`,
      }));
    for (let [r, i] of [
      [0.14, 0.095],
      [0.14, -0.095],
    ])
      e.add(w(0.03 * B, 0.03 * B, 0.03 * B, { e: 3, seg: 6 }), {
        at: V(n * r, -0.012, i),
        bone: t,
        color: Z.goldHi,
        ...a,
      });
    for (let r = 0; r < 4; r++)
      ne(
        e,
        [
          V(n * 0.03, 0.03, 0.07 - r * 0.045),
          V(n * (0.12 - (r % 2) * 0.03), 0.03, 0.07 - r * 0.045),
        ],
        0.009 * B,
        Z.cyan,
        {
          bone: t,
          emit: Z.cyan,
          ei: 1.8,
          hint: [0, 1, 0],
          thick: 0.004,
          curve: !1,
        },
      );
    e.add(l(0.045), {
      at: V(n * 0.078, -0.03, 0),
      rot: [90, 0, 0],
      bone: t,
      color: Z.goldHi,
      ...a,
    });
  }
  (e.add(
    j([V(0, -0.02, -0.105), V(0, -0.02, 0.105)], 0.02 * B, {
      seg: 8,
      curve: !1,
    }),
    { bone: `tome`, color: Z.goldHi, ...a },
  ),
    e.glowCard(`tome`, V(0, 0.08, 0), 0.5, Z.cyan, 0.5));
}
function Ze(e, t, n) {
  return D(e, t, n, 0.1);
}
var Qe = {
    stance: {
      hipT: [0, -0.01, 0],
      hips: [0, 12, 3],
      spine: [-2, -4, 0],
      chest: [0, -8, 0],
      neck: [2, 6, 0],
      head: [2, 8, -3],
      armR: [-22, -30, -16],
      foreR: [-116, 0, 0],
      handR: [-24, 0, 0],
      armL: [-24, 30, 26],
      foreL: [-52, 0, 0],
      handL: [10, 0, 10],
      footL: [0.04, 0, 0.08, 0],
      footR: [-0.04, 0, -0.06, 0],
      tome: [-18, 30, 12],
      tomeCL: [0, 0, -14],
      tomeCR: [0, 0, 14],
      halo: [0, 0, 0],
      pony1: [14, 0, 0],
      coatFL1: [-4, 0, 6],
      coatFR1: [-4, 0, -6],
      coatBL1: [6, 0, 5],
      coatBR1: [6, 0, -5],
      sash1: [0, 0, 8],
    },
    idle: {},
    splash: {
      hipT: [-0.03, -0.03, -0.02],
      hips: [0, 20, 5],
      spine: [-4, -6, -2],
      chest: [-6, -14, -2],
      neck: [2, 6, 0],
      head: [-2, 12, -5],
      armR: [-70, -40, -30],
      foreR: [-80, 0, 0],
      handR: [-30, 0, 0],
      footL: [0.08, 0, 0.16, 0],
      footR: [-0.06, 0, -0.1, 12],
    },
    run: {
      hipT: [0, -0.075, 0.01],
      hips: [4, 0, 0],
      spine: [15, 0, 0],
      chest: [4, 0, 0],
      neck: [-8, 0, 0],
      head: [-8, 0, 0],
      armL: [16, 0, 18],
      foreL: [-30, 0, 0],
      armR: [-12, -20, -18],
      foreR: [-110, 0, 0],
      footL: [0, 0, 0, 0],
      footR: [0, 0, 0, 0],
    },
    aWind: {
      hips: [0, -10, 0],
      chest: [-4, -26, 0],
      head: [0, 20, 0],
      armR: [-36, -10, -46],
      foreR: [-140, 0, 0],
      handR: [-30, 0, 0],
      armL: [-30, 20, 40],
      footL: [0.06, 0, 0.14, 0],
      footR: [-0.05, 0, -0.1, 0],
    },
    aStrike: {
      extends: `aWind`,
      hips: [4, 14, 0],
      chest: [6, 14, 0],
      head: [-4, -12, 0],
      armR: [-86, 0, -6],
      foreR: [-8, 0, 0],
      handR: [60, 0, 0],
      armL: [-10, 20, 20],
      trail: 1,
      emit: 0.5,
    },
    aFollow: {
      extends: `aStrike`,
      armR: [-78, 0, -8],
      foreR: [-16, 0, 0],
      trail: 0,
      emit: 0,
    },
    bWind: {
      extends: `aWind`,
      chest: [-2, -34, 0],
      armR: [-60, -40, -60],
      foreR: [-110, 0, 0],
    },
    bStrike: {
      extends: `aStrike`,
      chest: [8, 22, 0],
      armR: [-90, 20, 10],
      foreR: [-4, 0, 0],
      handR: [70, 0, 0],
    },
    bFollow: { extends: `bStrike`, trail: 0, emit: 0 },
    qRaise: {
      hipT: [0, 0.02, 0],
      spine: [-8, 0, 0],
      chest: [-10, 0, 0],
      head: [-24, 0, 0],
      armR: [-172, -10, -12],
      foreR: [-16, 0, 0],
      handR: [0, 0, 0],
      armL: [-40, 20, 60],
      foreL: [-60, 0, 0],
      emit: 1.2,
      spin: 1,
      tome: [-10, 60, 30],
    },
    qPoint: {
      extends: `qRaise`,
      spine: [8, 0, 0],
      chest: [8, 0, 0],
      head: [-6, 0, 0],
      armR: [-110, 0, -10],
      foreR: [-6, 0, 0],
      handR: [40, 0, 0],
      emit: 1.6,
    },
    wPush: {
      hipT: [0, -0.1, 0],
      spine: [14, 0, 0],
      chest: [8, 0, 0],
      head: [-10, 0, 0],
      armL: [-84, 0, 26],
      foreL: [-14, 0, 0],
      handL: [60, 0, 0],
      armR: [-84, 0, -26],
      foreR: [-14, 0, 0],
      handR: [60, 0, 0],
      footL: [0.08, 0, 0.16, 0],
      footR: [-0.08, 0, -0.12, 0],
      emit: 1.2,
      spin: 0.6,
    },
    eWind: {
      hips: [0, -20, 0],
      chest: [-6, -34, 0],
      head: [0, 26, 0],
      armR: [-40, 30, -70],
      foreR: [-80, 0, 0],
      handR: [0, 0, 0],
      armL: [-80, 20, 30],
      foreL: [-20, 0, 0],
      footL: [0.06, 0, 0.18, 0],
      footR: [-0.06, 0, -0.16, 0],
    },
    eThrow: {
      extends: `eWind`,
      hips: [6, 20, 0],
      chest: [12, 28, 0],
      head: [-10, -24, 0],
      armR: [-100, -30, 10],
      foreR: [-4, 0, 0],
      handR: [50, 0, 0],
      armL: [0, 20, 30],
      trail: 1,
      emit: 1,
    },
    rRise: {
      rootT: [0, 0.3, 0],
      hipT: [0, 0, 0],
      spine: [-10, 0, 0],
      chest: [-12, 0, 0],
      neck: [-10, 0, 0],
      head: [-26, 0, 0],
      armL: [-40, 0, 128],
      foreL: [-38, 0, 0],
      handL: [0, 0, 20],
      armR: [-40, 0, -128],
      foreR: [-42, 0, 0],
      handR: [0, 0, -20],
      footL: [0.02, 0.12, 0.02, 40],
      footR: [-0.02, 0.2, -0.04, 50],
      emit: 2,
      spin: 1,
      tome: [-30, 90, 0],
      tomeCL: [0, 0, -60],
      tomeCR: [0, 0, 60],
      coatFL1: [-14, 0, 20],
      coatFR1: [-14, 0, -20],
      coatBL1: [20, 0, 16],
      coatBR1: [20, 0, -16],
    },
    rCrash: {
      extends: `rRise`,
      rootT: [0, 0.05, 0],
      hipT: [0, -0.18, 0],
      spine: [20, 0, 0],
      chest: [14, 0, 0],
      head: [-10, 0, 0],
      armL: [-96, 0, 50],
      foreL: [0, 0, 0],
      armR: [-96, 0, -50],
      foreR: [0, 0, 0],
      handR: [40, 0, 0],
      footL: [0.1, 0, 0.14, 0],
      footR: [-0.1, 0, -0.12, 0],
      emit: 2.4,
    },
    recall: {
      rootT: [0, 0.22, 0],
      hipT: [0, -0.5, -0.02],
      spine: [0, 0, 0],
      chest: [0, 0, 0],
      head: [10, 0, 0],
      footL: [-0.14, 0.26, 0.2, 0],
      footR: [0.14, 0.26, 0.16, 0],
      armL: [-40, 0, -10],
      foreL: [-80, -40, 0],
      armR: [-30, 0, 10],
      foreR: [-90, 40, 0],
      handR: [0, 0, 0],
      emit: 1,
      spin: 0.5,
      tome: [-50, 0, 0],
      tomeCL: [0, 0, -40],
      tomeCR: [0, 0, 40],
    },
    stun: {
      hipT: [0, -0.08, -0.04],
      spine: [20, 0, 0],
      chest: [10, 0, 0],
      neck: [16, 0, 0],
      head: [20, 0, 0],
      armL: [0, 0, 10],
      foreL: [-20, 0, 0],
      armR: [-10, 0, -10],
      foreR: [-40, 0, 0],
    },
    air: {
      spine: [-6, 0, 0],
      chest: [-5, 0, 0],
      head: [10, 0, 0],
      armL: [-110, 0, 60],
      foreL: [-30, 0, 0],
      armR: [-100, 0, -60],
      foreR: [-40, 0, 0],
      footL: [0.05, 0.25, 0.1, 30],
      footR: [-0.05, 0.08, -0.2, -20],
    },
    flinch: {
      extends: null,
      hipT: [0, -0.02, -0.05],
      spine: [-8, 0, 0],
      chest: [-8, 0, 0],
      head: [14, 0, 0],
    },
    deathA: {
      spine: [-16, 0, 0],
      chest: [-20, 0, 0],
      head: [30, 0, 0],
      armL: [-60, 0, 50],
      armR: [-70, 0, -50],
      foreR: [-30, 0, 0],
    },
    deathB: {
      extends: `deathA`,
      hipT: [0, -0.5, 0],
      spine: [24, 0, 0],
      chest: [20, 0, 0],
      head: [20, 0, 0],
      footL: [0.1, 0, 0.2, 0],
      footR: [-0.1, 0, 0.16, 0],
      armL: [10, 0, 20],
      armR: [10, 0, -20],
    },
    deathC: {
      extends: `deathB`,
      root: [84, 0, -10],
      rootT: [0, 0.2, -0.58],
      hipT: [0, -0.3, 0],
      spine: [-4, 0, 0],
      chest: [-6, 0, 0],
      neck: [-10, 40, 0],
      head: [-10, 30, 0],
      armL: [-120, 0, 60],
      foreL: [-20, 0, 0],
      armR: [-60, 0, -40],
      foreR: [-30, 0, 0],
      footL: [0.1, 0.1, 0.1, 30],
      footR: [-0.1, 0, 0.02, 10],
    },
  },
  $e = (e, t) => ({
    bones: [1, 2, 3].map((t) => `coat${e}${t}`),
    tip: [0, -0.3, 0],
    stiffRoot: e[0] === `F` ? 0.4 : 0.35,
    stiffTip: 0.045,
    drag: 2.6,
    gravity: 0.9,
    hang: 0.45,
    maxAngle: e[0] === `F` ? 24 : 30,
    flutter: 0.35,
    freq: 5 + t * 0.7,
    phase: t * 1.9,
    collide: [`thighL`, `thighR`, `shinL`, `shinR`],
    ...(e[0] === `B`
      ? { plane: { bone: `hips`, n: [0, 0, -1], d: 0.12 } }
      : {}),
  }),
  et = {
    id: `morrow`,
    height: 2.05,
    element: `#7ff6ff`,
    rim: `#d9ccff`,
    proportions: We,
    bones: Ye,
    build: Xe,
    poses: Qe,
    kneeOut: 0.12,
    elbowPole: [0.6, -0.3, -0.7],
    anchors: {
      weapon: { bone: `orbR`, p: [0, 0, 0] },
      muzzle: { bone: `orbR`, p: [0, 0, 0] },
      head: { bone: `head`, p: [0, 0.12, 0.02] },
      chest: { bone: `chest`, p: [0, 0.14, 0.1] },
    },
    trails: [
      { bone: `orbR`, a: [0, -0.1, 0], b: [0, 0.1, 0], color: `#7ff6ff` },
    ],
    portrait: {
      yaw: 0.32,
      props: [`orbR`, `ring1`, `ring2`, `ring3`, `tome`, `tomeCL`, `tomeCR`],
      rim: `#7ff6ff`,
      fill: 1,
    },
    colliders: {
      hips: { bone: `hips`, a: [-0.1, 0, 0], b: [0.1, 0, 0], r: 0.17 },
      thighL: { bone: `thighL`, a: [0, 0, 0], b: [0, -0.43, 0], r: 0.12 },
      thighR: { bone: `thighR`, a: [0, 0, 0], b: [0, -0.43, 0], r: 0.12 },
      shinL: { bone: `shinL`, a: [0, 0, 0], b: [0, -0.42, 0], r: 0.1 },
      shinR: { bone: `shinR`, a: [0, 0, 0], b: [0, -0.42, 0], r: 0.1 },
      chest: {
        bone: `chest`,
        a: [0, 0.02, -0.02],
        b: [0, 0.3, -0.02],
        r: 0.17,
      },
      head: { bone: `head`, a: [0, 0.1, 0], b: [0, 0.1, 0], r: 0.15 },
    },
    anim: {
      run: {
        stride: 1.62,
        lift: 0.22,
        bob: 0.095,
        twist: 15,
        roll: 7,
        headLead: 0.3,
        carry: 0.45,
        armL: 30,
        armR: 0,
      },
      center: 0.9,
      airHeight: 1,
      airTumble: 50,
      attackFollow: 0.12,
      attackHold: 0.08,
      breath: 3.6,
      attacks: [
        { wind: `aWind`, strike: `aStrike`, follow: `aFollow` },
        { wind: `bWind`, strike: `bStrike`, follow: `bFollow` },
      ],
      casts: {
        Q: {
          keys: [
            [0, `stance`],
            [0.14, `qRaise`, `o`],
            [0.4, `qRaise`],
            [0.55, `qPoint`, `i`],
            [0.75, `qPoint`],
          ],
          len: 0.75,
          out: 0.3,
        },
        W: {
          keys: [
            [0, `stance`],
            [0.12, `wPush`, `o`],
            [0.45, `wPush`],
          ],
          len: 0.45,
          out: 0.3,
        },
        E: {
          keys: [
            [0, `eWind`],
            [0.09, `eWind`, `o`],
            [0.18, `eThrow`, `i`],
            [0.36, `eThrow`],
          ],
          len: 0.36,
          out: 0.28,
        },
        R: {
          keys: [
            [0, `stance`],
            [0.3, `rRise`, `o`],
            [0.9, `rRise`],
            [1.02, `rCrash`, `i`],
            [1.35, `rCrash`],
          ],
          len: 1.35,
          out: 0.4,
        },
        spell: { keys: [[0, `stance`]], len: 0.05, out: 0.1, upper: !0 },
      },
      dash: { default: { keys: [[0, `run`]] } },
      recall: {
        keys: [
          [0, `stance`],
          [0.6, `recall`, `o`],
        ],
      },
      death: {
        keys: [
          [0, `deathA`],
          [0.1, `deathA`, `o`],
          [0.36, `deathB`, `i`],
          [0.68, `deathC`, `i`],
        ],
      },
      followers: [
        {
          bone: `skirtF`,
          src: [`thighL`, `thighR`],
          front: 1,
          back: 0,
          maxF: 0.75,
          dir: [0, 0, 1],
        },
        {
          bone: `skirtB`,
          src: [`thighL`, `thighR`],
          front: 0,
          back: 0.7,
          maxB: 0.5,
          dir: [0, 0, -1],
        },
        {
          bone: `skirtL`,
          src: [`thighL`],
          front: 0.55,
          back: 0.45,
          maxF: 0.6,
          maxB: 0.5,
          dir: [1, 0, 0],
        },
        {
          bone: `skirtR`,
          src: [`thighR`],
          front: 0.55,
          back: 0.45,
          maxF: 0.6,
          maxB: 0.5,
          dir: [-1, 0, 0],
        },
      ],
      cloth: [
        ...Je.map(([e], t) => $e(e, t)),
        {
          bones: [`pony1`, `pony2`, `pony3`, `pony4`],
          tip: [0, -0.1, 0],
          stiffRoot: 0.35,
          stiffTip: 0.05,
          drag: 2.2,
          gravity: 1,
          hang: 0.55,
          maxAngle: 32,
          flutter: 0.3,
          collide: [`chest`, `head`],
          plane: { bone: `chest`, n: [0, 0, -1], d: 0.1 },
        },
        {
          bones: [`sash1`, `sash2`, `sash3`],
          tip: [0, -0.12, 0],
          stiffRoot: 0.35,
          stiffTip: 0.06,
          drag: 2.4,
          hang: 0.6,
          maxAngle: 28,
          flutter: 0.4,
          collide: [`thighL`],
        },
      ],
      chains: [],
      procedural(e, t, n) {
        let r = e._t,
          i = e._dt,
          a = e.L,
          o = e.type.rig,
          s = e.custom,
          c = t[a.scalar.spin];
        ((s.r1 = (s.r1 || 0) + i * (1.1 + c * 7)),
          (s.r2 = (s.r2 || 0) + i * (-0.8 - c * 5)),
          (s.r3 = (s.r3 || 0) + i * (0.6 + c * 9)),
          (s.h = (s.h || 0) + i * (0.35 + c * 1.5)),
          s.r1 > 1e4 &&
            ((s.r1 %= Math.PI * 2),
            (s.r2 %= Math.PI * 2),
            (s.r3 %= Math.PI * 2),
            (s.h %= Math.PI * 2)));
        let l = (s.o ||= {
          r1: o.index(`ring1`) * 3,
          r2: o.index(`ring2`) * 3,
          r3: o.index(`ring3`) * 3,
          h: o.index(`halo`) * 3,
          tr: o.index(`tomeRoot`) * 3,
          cl: o.index(`tomeCL`) * 3,
          cr: o.index(`tomeCR`) * 3,
        });
        ((t[l.r1] += 0.5),
          (t[l.r1 + 1] += s.r1),
          (t[l.r2 + 2] += s.r2),
          (t[l.r2] += 1.2),
          (t[l.r3] += s.r3),
          (t[l.r3 + 2] += 0.7),
          (t[l.h + 2] += s.h),
          (t[l.tr] += Math.sin(r * 1.7) * 0.05),
          (t[l.tr + 1] += Math.sin(r * 0.9) * 0.08),
          (t[l.tr + 2] += Math.sin(r * 2.3 + 1) * 0.03));
        let u = Math.sin(r * 6.1) * 0.05;
        if (((t[l.cl + 2] += u), (t[l.cr + 2] -= u), e.runW > 0.002)) {
          let n = e.runW,
            r = e.runPhase * Math.PI * 2 + 1.6,
            i = (s.oa ||= {
              ar: o.index(`armR`) * 3,
              fr: o.index(`foreR`) * 3,
              cr2: o.index(`clavR`) * 3,
            });
          ((t[i.ar] += Math.sin(r) * 0.3 * n),
            (t[i.ar + 2] -= (0.5 + 0.5 * Math.cos(r)) * 0.22 * n),
            (t[i.fr] += Math.sin(r + 0.8) * 0.2 * n),
            (t[i.cr2 + 2] += Math.sin(r) * 0.1 * n));
        }
      },
    },
  },
  tt = (e, t) => Math.exp(-(e * e) / (t * t)),
  Q = {
    coat: `#b8834a`,
    coatHi: `#d29a5e`,
    coatLo: `#7a5530`,
    coatDark: `#3a2c26`,
    trim: `#33201a`,
    trimHi: `#54362a`,
    vest: `#241a18`,
    vestHi: `#453022`,
    yoke: `#4a4048`,
    yokeHi: `#6a5f68`,
    shirt: `#f2e6cc`,
    shirtDark: `#bba886`,
    pants: `#1c1714`,
    pantsHi: `#342a24`,
    boot: `#5a381f`,
    bootHi: `#8a5834`,
    bootDark: `#2a1808`,
    brass: `#d9a044`,
    brassHi: `#ffe08c`,
    brassDark: `#7a5018`,
    wood: `#5b2f1c`,
    woodHi: `#8c4f2c`,
    skin: `#ffdcc0`,
    skinDark: `#d1926e`,
    hair: `#c9541f`,
    hairHi: `#ff9448`,
    hairDark: `#6a2810`,
    sun: `#ffd36b`,
    sunCore: `#fff2b0`,
    cream: `#fff3c4`,
    amber: `#ffb347`,
    glove: `#2e1f16`,
    gun: `#a8762c`,
    gunDark: `#4a2f0e`,
    gloveHi: `#7a5a42`,
    gloveTop: `#a3805f`,
  },
  nt = {
    hipY: 1,
    hipX: 0.1,
    hipDrop: 0.02,
    thigh: 0.44,
    shin: 0.45,
    spineOff: 0.06,
    spine: 0.23,
    chest: 0.35,
    neck: 0.08,
    neckZ: 0.01,
    clavX: 0.07,
    clavY: 0.28,
    shoulderX: 0.16,
    upperArm: 0.3,
    foreArm: 0.28,
  },
  rt = [0, 1.842, 0.02],
  it = [0.1142, 0.1389, 0.1254],
  at = 1.45,
  ot = [0.08, -0.155, 0.01];
function st(e) {
  let t = F(e),
    n = (e, n, r, i, a) => t.push({ name: e, parent: n, pos: [r, i, a] });
  (n(`weaponR`, `handR`, ot[0], ot[1], ot[2]),
    n(`drum`, `weaponR`, 0, 0.13 * at, 0.14 * at));
  for (let [e, t] of [
    [`L`, 1],
    [`R`, -1],
  ])
    (n(`coat${e}1`, `hips`, t * 0.1, -0.02, -0.12),
      n(`coat${e}2`, `coat${e}1`, t * 0.02, -0.22, -0.04),
      n(`coat${e}3`, `coat${e}2`, t * 0.015, -0.22, -0.03));
  return (
    n(`hair1`, `head`, 0, 0.253, -0.128),
    n(`hair2`, `hair1`, 0, -0.04, -0.1),
    n(`hair3`, `hair2`, 0, -0.13, -0.05),
    n(`hair4`, `hair3`, 0, -0.13, -0.02),
    n(`capeV1`, `chest`, -0.16, 0.24, -0.15),
    n(`capeV2`, `capeV1`, 0.02, -0.2, -0.05),
    n(`capeV3`, `capeV2`, 0.02, -0.16, -0.03),
    t
  );
}
function ct(e, t, n) {
  let r = { r: 0.6, m: 0, detail: 0.9, tex: `leather` },
    a = { r: 0.85, m: 0, detail: 0.7, tex: `cloth` },
    o = { r: 0.42, m: 0.9, detail: 0.7, tex: `metal` },
    s = { r: 0.55, m: 0, detail: 0.5, tex: `skin` },
    c = { r: 0.55, m: 0, detail: 1, tex: `wood` },
    l = { r: 0.5, detail: 1, tex: `hair` },
    u = (e) => n.index(e);
  e.add(
    y(
      [
        { p: [0, 0.9, 0], rx: 0.13, rz: 0.1 },
        { p: [0, 0.99, 0], rx: 0.158, rz: 0.12 },
        { p: [0, 1.13, 0], rx: 0.143, rz: 0.108 },
        { p: [0, 1.28, 0.012], rx: 0.178, rz: 0.128 },
        { p: [0, 1.42, 0.02], rx: 0.208, rz: 0.138 },
        { p: [0, 1.53, 0], rx: 0.206, rz: 0.131 },
        { p: [0, 1.572, -0.004], rx: 0.155, rz: 0.113 },
        { p: [0, 1.605, -0.004], rx: 0.098, rz: 0.083 },
        { p: [0, 1.655, 0.002], rx: 0.069, rz: 0.066 },
        { p: [0, 1.735, 0.012], rx: 0.053, rz: 0.055 },
      ],
      { seg: 22, start: 0.5, end: 0.3, radial: W(6, 0.015, 0.5, 0, 1) },
    ),
    {
      chain: [`hips`, `spine`, `chest`, `neck`],
      bw: 0.08,
      paint: (e) =>
        e.y > 1.6
          ? Q.skin
          : e.y < 1.07
            ? Q.pants
            : e.y < 1.12
              ? Q.trim
              : Q.vest,
      ...r,
      detail: 0.6,
    },
  );
  for (let t of [1.2, 1.3, 1.4])
    e.add(v(0.016, 0.016, 0.01, { rings: 5, seg: 8 }), {
      at: [0.035, t, 0.132 + (t - 1.1) * 0.08],
      bone: `chest`,
      color: Q.brassHi,
      ...o,
      mirror: !0,
    });
  for (let t of [1, -1]) {
    let n = N(
      [
        [t * 0.012, 1.585, 0.1],
        [t * 0.03, 1.53, 0.13],
        [t * 0.045, 1.47, 0.142],
      ],
      (e) => 0.05 + e * 0.03,
      0.012,
      { hint: [0, 0, 1], radial: W(3, 0.2, t * 2, 1, 0.3) },
    );
    (_(n, (e) => {
      e.y < 1.49 &&
        (e.y += Math.abs(Math.sin(e.x * 140)) * 0.012 * M(1.49, 1.47, e.y));
    }),
      e.add(n, { bone: `chest`, grad: [Q.shirtDark, Q.shirt], ...a }));
  }
  (e.add(
    b(
      [
        [0, 0.022, 0.022],
        [0.012, 0.024, 0.024],
        [0.018, 0.012, 0.012],
      ],
      { seg: 12, start: `flat`, end: `flat` },
    ),
    {
      at: [0, 1.575, 0.118],
      rot: [90, 0, 0],
      bone: `chest`,
      color: Q.brassHi,
      ...o,
    },
  ),
    e.add(v(0.01, 0.01, 0.006), {
      at: [0, 1.575, 0.14],
      bone: `chest`,
      color: Q.sunCore,
      emit: Q.sun,
      ei: 1.6,
      detail: 0,
      ao: !1,
    }));
  for (let [t, n] of [
    [1, !1],
    [0.9, !0],
  ]) {
    let i = y(
      [
        { p: [0, 1.57, -0.01], rx: 0.12 * t, rz: 0.1 * t },
        { p: [0, 1.66, -0.02], rx: 0.125 * t, rz: 0.108 * t },
        { p: [0, 1.745, -0.035], rx: 0.15 * t, rz: 0.128 * t },
      ],
      { seg: 20, arc: [138, 402], flipNormals: n },
    );
    e.add(i, {
      chain: [`chest`, `neck`],
      bw: 0.03,
      paint: (e) => (n || e.y > 1.72 ? Q.trimHi : Q.trim),
      ...r,
    });
  }
  {
    let t = [];
    for (let e = 0; e <= 18; e++) {
      let n = (p(138, 402, e / 18) * Math.PI) / 180;
      t.push([Math.cos(n) * 0.15, 1.748, Math.sin(n) * 0.128 - 0.035]);
    }
    e.add(j(t, 0.009, { seg: 5, samples: 24 }), {
      chain: [`chest`, `neck`],
      bw: 0.03,
      color: Q.brassHi,
      ...o,
    });
  }
  {
    let t = [];
    for (let e = 0; e <= 24; e++) {
      let n = (p(-160, 160, e / 24) * Math.PI) / 180,
        r = 1 + 0.05 * Math.sin(e * 1.7);
      t.push([
        Math.cos(n) * 0.128 * r,
        1.607 + 0.008 * Math.sin(e * 1.7),
        Math.sin(n) * 0.108 * r - 0.006,
      ]);
    }
    e.add(
      j(t, (e) => 0.03 * (0.72 + 0.28 * Math.sin(Math.PI * e)), {
        seg: 7,
        samples: 28,
        rz: () => 0.017,
        hint: [0, 1, 0],
      }),
      {
        chain: [`chest`, `neck`],
        bw: 0.04,
        grad: [Q.brassDark, Q.brassHi],
        gradEase: !0,
        ...o,
        edge: 1.5,
      },
    );
    for (let t = 0; t < 7; t++) {
      let n = (p(-140, 140, t / 6) * Math.PI) / 180;
      e.add(v(0.0125, 0.009, 0.0125, { rings: 5, seg: 10 }), {
        chain: [`chest`, `neck`],
        bw: 0.04,
        at: [Math.cos(n) * 0.132, 1.622, Math.sin(n) * 0.112 - 0.006],
        color: Q.brassHi,
        ...o,
      });
    }
  }
  let f = y(
      [
        { p: [0, 1.06, -0.005], rx: 0.172, rz: 0.132, e: 2.2 },
        { p: [0, 1.2, 0], rx: 0.172, rz: 0.132 },
        { p: [0, 1.34, 0.012], rx: 0.201, rz: 0.148 },
        { p: [0, 1.46, 0.018], rx: 0.228, rz: 0.156 },
        { p: [0, 1.56, 0], rx: 0.221, rz: 0.146 },
        { p: [0, 1.62, -0.005], rx: 0.146, rz: 0.106 },
      ],
      { seg: 30, start: 0, end: 0, radial: W(5, 0.03, 2.2, 0, 1) },
    ),
    m = (e, t) => M(0.062, 0.026, Math.abs(e)) * M(0.04, 0.1, t);
  (_(f, (e) => {
    let t = m(e.x, e.z);
    t > 0 && ((e.z -= t * 0.05), (e.x += Math.sign(e.x) * t * 0.035));
  }),
    e.add(f, {
      chain: [`spine`, `chest`],
      bw: 0.1,
      paint: (e) =>
        e.z > 0.09 && Math.abs(e.x) < 0.052
          ? Q.vest
          : e.y < 1.09
            ? Q.trim
            : e.y > 1.585
              ? Q.yoke
              : e.y > 1.52
                ? Q.yokeHi
                : Q.coat,
      teamFn: (e) =>
        M(1.455, 1.515, e.y) *
        (1 - M(1.585, 1.618, e.y)) *
        M(0.03, 0.1, Math.abs(e.x)) *
        (1 - M(0.07, 0.14, e.z) * 0.4),
      ...r,
    }));
  for (let t of [1, -1]) {
    (e.add(
      N(
        [
          [t * 0.062, 1.652, 0.07],
          [t * 0.072, 1.585, 0.112],
          [t * 0.09, 1.45, 0.155],
          [t * 0.078, 1.28, 0.145],
          [t * 0.078, 1.1, 0.135],
        ],
        (e) => 0.005 + 0.03 * M(0, 0.2, e) - 0.012 * e,
        0.014,
        { hint: [0, 0, 1], samples: 14 },
      ),
      {
        chain: [`spine`, `chest`],
        bw: 0.1,
        paint: (e) => (e.y > 1.58 ? Q.coat : Q.trim),
        ...r,
      },
    ),
      e.add(
        j(
          [
            [t * 0.056, 1.6, 0.12],
            [t * 0.07, 1.45, 0.17],
            [t * 0.06, 1.28, 0.157],
            [t * 0.06, 1.1, 0.145],
          ],
          0.006,
          { seg: 5, samples: 16 },
        ),
        { chain: [`spine`, `chest`], bw: 0.1, color: Q.brassHi, ...o },
      ));
    for (let n of [1.5, 1.36, 1.22])
      e.add(v(0.009, 0.009, 0.006, { rings: 4, seg: 7 }), {
        at: [t * 0.086, n, 0.152 - (1.5 - n) * 0.05],
        chain: [`spine`, `chest`],
        bw: 0.1,
        color: Q.brassHi,
        ...o,
      });
  }
  for (let t of [1, -1]) {
    let n = t > 0 ? `L` : `R`,
      i = (e) => t * (0.09 + ((1.06 - e) / 0.68) * 0.06),
      a = (e) => (0.24 - ((1.06 - e) / 0.68) * 0.035) * 0.5,
      s = N(
        [
          [t * 0.09, 1.06, -0.1],
          [t * 0.12, 0.84, -0.16],
          [t * 0.135, 0.62, -0.2],
          [t * 0.15, 0.38, -0.21],
        ],
        (e) => 0.24 - e * 0.035,
        (e) => 0.032 - e * 0.02,
        { seg: 12, samples: 12, radial: W(2, 0.12, t * 3, 1, 0.25) },
      );
    (_(s, (e) => {
      let n = g((e.x - i(e.y)) / a(e.y), -1, 1);
      e.z += 0.055 * n * n;
      let r = M(0.52, 0.38, e.y);
      ((e.y += n * t * 0.055 * r), (e.z -= 0.035 * r * (0.4 + 0.6 * n * n)));
    }),
      e.add(s, {
        chain: [1, 2, 3].map((e) => `coat${n}${e}`),
        bw: 0.1,
        paint: (e, t, n) =>
          t.y < 0.46
            ? Q.trim
            : t.y < 0.49
              ? Q.brass
              : n.z > 0.3
                ? Q.coatLo
                : Q.coat,
        ...r,
      }));
    let c = (e) => 0.04 - ((1.06 - e) / 0.38) * 0.04,
      l = (e) => (0.12 - ((1.06 - e) / 0.38) * 0.055) * 0.5,
      d = N(
        [
          [t * 0.162, 1.06, 0.04],
          [t * 0.178, 0.86, 0.02],
          [t * 0.19, 0.68, 0],
        ],
        (e) => 0.12 - e * 0.055,
        (e) => 0.03 - e * 0.016,
        { hint: [1, 0, 0], samples: 12 },
      );
    (_(d, (e) => {
      let n = g((e.z - c(e.y)) / Math.max(0.02, l(e.y)), -1, 1);
      e.x -= t * 0.05 * n * n;
      let r = M(0.78, 0.68, e.y);
      e.y += n * 0.04 * r;
    }),
      e.add(d, {
        skin: () => [
          [u(`hips`), 0.6],
          [u(`thigh` + n), 0.4],
        ],
        paint: (e, t) => (t.y < 0.74 ? Q.trim : Q.coat),
        ...r,
      }),
      ce(
        e,
        [
          [t * 0.06, 0.4, -0.2],
          [t * 0.15, 0.375, -0.213],
          [t * 0.245, 0.415, -0.196],
        ],
        {
          chain: [1, 2, 3].map((e) => `coat${n}${e}`),
          bw: 0.1,
          r: 0.0115,
          stitch: 7,
          up: [0, 0.2, 0.98],
          mat: { color: Q.brassDark, ...r },
          stitchMat: { color: Q.brassHi, ...o },
        },
      ));
  }
  e.add(
    b(
      [
        [-0.24, 0.05, 0.044],
        [0.2, 0.055, 0.048],
        [0.24, 0.062, 0.055],
      ],
      { seg: 14, start: `flat`, end: 0 },
    ),
    {
      at: [0.03, 1.33, -0.215],
      rot: [-12, 0, -38],
      bone: `chest`,
      grad: [Q.trim, Q.trimHi],
      teamFn: (e) => M(-0.02, 0.06, e.y) * (1 - M(0.13, 0.19, e.y)),
      ...r,
    },
  );
  for (let t of [-0.2, 0.2])
    e.add(d(1, 0.012, { seg: 14, tube: 5 }), {
      at: [
        0.03 - Math.sin((-38 * Math.PI) / 180) * t,
        1.33 + Math.cos((38 * Math.PI) / 180) * t,
        -0.215,
      ],
      rot: [78, 0, -38],
      scale: [0.058, 0.052, 1],
      bone: `chest`,
      color: Q.brassHi,
      ...o,
    });
  for (let t = 0; t < 5; t++) {
    let n = t / 4,
      r = ((-28 + n * 56) * Math.PI) / 180,
      i = (n - 0.5) * 0.32,
      a = [0.178 + (n - 0.5) * 0.045, 1.518, -0.215 + i * 0.12],
      s = 0.3 + 0.12 * Math.sin(Math.PI * n),
      l = [
        a[0] + Math.sin(r) * s * 0.62,
        a[1] + Math.cos(r) * s,
        a[2] - 0.05 + i * 0.2,
      ];
    e.add(
      j([a, l], (e) => 0.0085 * (1 - e * 0.15), { seg: 6, curve: !1 }),
      { bone: `chest`, grad: [Q.wood, Q.woodHi], gradAxis: `y`, ...c },
    );
    for (let t of [0, 1])
      e.add(
        T(
          [
            [0, 0],
            [0.085, 0.032],
            [0.082, -0.03],
          ],
          0.004,
          { bevel: 0 },
        ),
        {
          at: [l[0] - Math.sin(r) * 0.055, l[1] - Math.cos(r) * 0.09, l[2]],
          rot: [0, t ? 74 : 0, 64 - (r * 180) / Math.PI],
          bone: `chest`,
          color: t ? Q.brassHi : Q.cream,
          emit: Q.sun,
          ei: t ? 0.5 : 0.2,
          detail: 0.2,
        },
      );
    e.add(v(0.011, 0.02, 0.011, { rings: 5, seg: 8 }), {
      at: [l[0], l[1] + 0.012, l[2]],
      rot: [0, 0, (-r * 180) / Math.PI],
      bone: `chest`,
      color: Q.brassHi,
      ...o,
    });
  }
  let h = N(
    [
      [-0.1, 1.73, 0.03],
      [-0.235, 1.665, -0.06],
      [-0.215, 1.49, -0.165],
      [-0.17, 1.3, -0.205],
    ],
    (e) => 0.43 - e * 0.09,
    0.02,
    {
      hint: [0.3, 0.3, -0.9],
      seg: 12,
      samples: 12,
      radial: W(2, 0.1, 1.1, 1, 0.3),
    },
  );
  (_(h, (e) => {
    e.y < 1.38 && (e.y += de(e.x, 2.2, 0.025, 4) * M(1.38, 1.3, e.y));
  }),
    e.add(h, {
      chain: [`chest`, `capeV1`, `capeV2`, `capeV3`],
      bw: 0.1,
      paint: (e, t) =>
        t.y < 1.35 ? R : t.y < 1.39 ? Q.brassHi : t.y > 1.66 ? Q.trim : L,
      teamFn: (e, t) =>
        (1 - M(1.62, 1.7, t.y)) * (1 - M(1.585, 1.485, t.y) * 0.95),
      r: 0.75,
      detail: 0.9,
      tex: `leather`,
    }),
    e.add(
      b(
        [
          [1.03, 0.166, 0.13],
          [1.075, 0.171, 0.134],
        ],
        { seg: 26, start: 0, end: 0 },
      ),
      { bone: `hips`, color: Q.trimHi, ...r },
    ));
  for (let t of [1.03, 1.075])
    e.add(d(1, 0.008, { seg: 24, tube: 5 }), {
      at: [0, t, 0],
      rot: [90, 0, 0],
      scale: [0.169, 0.133, 1],
      bone: `hips`,
      color: Q.brass,
      ...o,
    });
  (e.add(
    b(
      [
        [0, 0.034, 0.034],
        [0.014, 0.036, 0.036],
        [0.02, 0.02, 0.02],
      ],
      { seg: 14, start: `flat`, end: `flat` },
    ),
    {
      at: [0, 1.052, 0.13],
      rot: [90, 0, 0],
      bone: `hips`,
      color: Q.brassHi,
      ...o,
    },
  ),
    se(e, [0, 1.043, 0], 0.172, 0.136, {
      bone: `hips`,
      bead: 0.0085,
      studs: 16,
      studR: 0.0115,
      studH: 0.008,
      studY: 0.012,
      seg: 26,
      mat: { color: Q.brassDark, ...o },
      studMat: { color: Q.brassHi, ...o },
    }),
    e.add(w(0.08, 0.1, 0.06, { e: 3 }), {
      at: [0.14, 0.99, 0.08],
      rot: [0, 30, 0],
      bone: `hips`,
      grad: [Q.trim, Q.trimHi],
      ...r,
    }),
    e.add(w(0.07, 0.09, 0.06, { e: 3 }), {
      at: [-0.155, 0.99, 0.02],
      rot: [0, -60, 0],
      bone: `hips`,
      grad: [Q.trim, Q.trimHi],
      ...r,
    }));
  let x = ee([
    [0.16, 90, 0.12, 55, 0.08],
    [0.22, 0, 0.14, 40, 0.05],
    [0.25, 270, 0.14, 50, 0.05],
    [0.63, 270, 0.09, 45, 0.14],
    [0.6, 180, 0.08, 40, 0.05],
    [0.47, 90, 0.04, 40, -0.05],
  ]);
  te(
    e,
    n,
    [`thighL`, `shinL`, `footL`],
    [
      [0, 0.112, 0.118],
      [0.1, 0.12, 0.126],
      [0.3, 0.1, 0.106],
      [0.46, 0.068, 0.074],
      [0.52, 0.066, 0.072],
      [0.62, 0.075, 0.082],
      [0.84, 0.052, 0.056],
      [0.97, 0.046, 0.048],
    ],
    {
      from: [0, 0.05, 0],
      seg: 14,
      rings: 16,
      start: 0,
      end: 0,
      grad: [Q.pants, Q.pantsHi],
      radial: x,
      mirror: !0,
      ...a,
    },
  );
  let C = ee([
    [0.6, 180, 0.13, 52, 0.12],
    [0.3, 180, 0.09, 45, 0.06],
    [0.16, 0, 0.07, 55, 0.05],
  ]);
  (e.add(
    b(
      [
        [0.068, 0.058, 0.07, 2.2],
        [0.105, 0.05, 0.058],
        [0.135, 0.042, 0.048],
        [0.175, 0.046, 0.053],
        [0.25, 0.064, 0.076],
        [0.33, 0.077, 0.09],
        [0.4, 0.075, 0.086],
        [0.46, 0.068, 0.078],
        [0.5, 0.072, 0.082],
        [0.525, 0.096, 0.106],
        [0.555, 0.104, 0.113],
        [0.578, 0.094, 0.102],
      ],
      {
        seg: 16,
        start: `flat`,
        end: 0,
        radial: (e, t) => C(e, t) * W(3, 0.02, 1.2, 0, 1)(e, t),
      },
    ),
    {
      at: [0.1, 0, 0.005],
      chain: [`shinL`, `footL`],
      bw: 0.03,
      paint: (e) =>
        e.y > 0.515
          ? L
          : e.y > 0.46
            ? Q.bootHi
            : e.y < 0.1 || e.y < 0.155
              ? Q.bootDark
              : Q.boot,
      teamFn: (e) => M(0.508, 0.522, e.y),
      mirror: !0,
      ...r,
    },
  ),
    se(e, [0.1, 0.527, 0.005], 0.101, 0.111, {
      bone: `shinL`,
      mirror: !0,
      bead: 0.0095,
      seg: 18,
      studs: 10,
      studR: 0.0082,
      studH: 0.0058,
      studY: 0.005,
      mat: { color: Q.brassDark, ...r },
      studMat: { color: Q.brassHi, ...o },
    }),
    e.add(
      y(
        [
          { p: [0, 0, -0.075], rx: 0.05, rz: 0.028, e: 4 },
          { p: [0, 0.035, -0.082], rx: 0.055, rz: 0.03, e: 4 },
          { p: [0, 0.07, -0.08], rx: 0.05, rz: 0.026, e: 3 },
        ],
        { seg: 12, start: `flat`, end: 0.4, hint: [0, 0, 1] },
      ),
      { at: [0.1, 0, 0], bone: `footL`, color: Q.bootDark, ...r, mirror: !0 },
    ));
  for (let t of [0.22, 0.38])
    (e.add(d(1, 0.01, { seg: 16, tube: 5 }), {
      at: [0.1, t, 0.005],
      rot: [90, 0, 0],
      scale: t > 0.3 ? [0.08, 0.09, 1] : [0.07, 0.082, 1],
      bone: `shinL`,
      color: Q.bootDark,
      ...r,
      mirror: !0,
    }),
      e.add(w(0.032, 0.024, 0.012, { e: 4, seg: 8 }), {
        at: [0.1, t, t > 0.3 ? 0.095 : 0.087],
        bone: `shinL`,
        color: Q.brassHi,
        ...o,
        mirror: !0,
      }));
  let E = ue(0.08, 0.06, 0.085, {
    thick: 0.014,
    lat0: -10,
    seg: 14,
    rings: 5,
    rimR: 0.01,
    innerSeg: 8,
    innerRings: 2,
  });
  for (let [t, n] of [
    [
      E.outer,
      {
        grad: [Q.brassDark, Q.brassHi],
        teamFn: (e) => M(0.026, 0.05, e.y) * 0.9,
        ...o,
      },
    ],
    [E.inner, { color: Q.trim, ...r }],
    [E.rim, { color: Q.brassHi, ...o }],
  ])
    e.add(t, {
      at: [0.1, 0.57, 0.052],
      rot: [80, 0, 0],
      bone: `shinL`,
      mirror: !0,
      ...n,
    });
  (e.add(
    y(
      [
        { p: [0, 0.05, -0.085], rx: 0.058, rz: 0.052, e: 2.6 },
        { p: [0, 0.058, 0], rx: 0.068, rz: 0.06, e: 2.6 },
        { p: [0, 0.048, 0.12], rx: 0.064, rz: 0.046, e: 2.6 },
        { p: [0, 0.042, 0.19], rx: 0.048, rz: 0.034 },
      ],
      { seg: 14, start: 0.4, end: 0.6, hint: [0, 1, 0] },
    ),
    {
      at: [0.1, 0, 0],
      bone: `footL`,
      grad: [Q.bootDark, Q.boot],
      mirror: !0,
      ...r,
    },
  ),
    ie(e, [0.1, 0, 0.03], 1, 1, {
      bone: `footL`,
      mirror: !0,
      w: 0.069,
      toe: 0.168,
      heel: 0.108,
      soleH: 0.026,
      proud: 0.011,
      stitch: 16,
      capH: 0.026,
      mat: { grad: [Q.bootDark, Q.boot], ...r },
      soleMat: { color: Q.bootDark, ...r, r: 0.8 },
      toeMat: { color: Q.bootHi, ...r },
      heelMat: { color: `#2a180b`, ...r },
    }),
    te(
      e,
      n,
      [`armL`, `foreL`, `handL`],
      [
        [0, 0.078, 0.078],
        [0.12, 0.086, 0.088],
        [0.36, 0.072, 0.074],
        [0.5, 0.058, 0.06],
        [0.64, 0.066, 0.068],
        [0.9, 0.05, 0.052],
        [1, 0.044, 0.046],
      ],
      {
        from: [0, 0.04, 0],
        seg: 13,
        rings: 15,
        start: 0.3,
        end: 0,
        radial: ee(
          [
            [0.08, 0, 0.1, 80, 0.1],
            [0.3, 90, 0.1, 45, 0.08],
            [0.28, 270, 0.1, 50, 0.05],
            [0.6, 40, 0.1, 55, 0.08],
            [0.5, 90, 0.04, 40, -0.05],
          ],
          W(3, 0.02, 0.7, 0, 1),
        ),
        paint: (e, t) => (t.y < 1.03 ? Q.glove : t.y > 1.5 ? Q.yokeHi : Q.coat),
        mirror: !0,
        ...r,
      },
    ),
    e.add(
      b(
        [
          [1.02, 0.058, 0.06, 2.6],
          [1.08, 0.068, 0.07, 2.6],
          [1.2, 0.074, 0.076, 2.6],
          [1.24, 0.07, 0.072, 2.6],
        ],
        { seg: 16, start: `flat`, end: `flat`, radial: W(6, 0.02, 1, 0, 1) },
      ),
      {
        at: [0.23, 0, 0],
        bone: `foreL`,
        grad: [Q.brassDark, Q.brassHi],
        ...o,
        mirror: !0,
        edge: 1.4,
      },
    ));
  for (let t of [1.03, 1.23])
    e.add(d(1, 0.011, { seg: 16, tube: 5 }), {
      at: [0.23, t, 0],
      rot: [90, 0, 0],
      scale: [0.072, 0.074, 1],
      bone: `foreL`,
      color: Q.brassHi,
      ...o,
      mirror: !0,
    });
  ne(
    e,
    [
      [0.23, 1.08, 0.076],
      [0.232, 1.13, 0.078],
      [0.23, 1.18, 0.076],
    ],
    0.013,
    Q.sunCore,
    { bone: `foreL`, emit: Q.sun, ei: 1.5, hint: [0, 0, 1], mirror: !0 },
  );
  let D = {
    studs: 6,
    mat: { grad: [Q.brassDark, Q.brassHi], ...o },
    studMat: { color: Q.brassHi, ...o },
  };
  (re(e, [-0.23, 0.99, 0.01], -1, 1.42, {
    bone: `handR`,
    curl: 0.95,
    thumb: 0.85,
    fat: 1.1,
    jitter: 1.5,
    mat: { grad: [Q.glove, Q.gloveHi], ...r },
    nail: Q.gloveTop,
    creaseMat: { color: `#1a110b`, ...r },
    webMat: { color: Q.glove, ...r },
    cuff: D,
  }),
    re(e, [0.23, 0.99, 0.01], 1, 1.42, {
      bone: `handL`,
      curl: 0.74,
      thumb: 0.85,
      spread: 1.15,
      fat: 1.05,
      jitter: 1.8,
      mat: { grad: [Q.gloveHi, Q.gloveTop], ...r },
      nail: `#c9a884`,
      creaseMat: { color: `#33220f`, ...r },
      webMat: { color: Q.gloveHi, ...r },
      cuff: D,
    }),
    e.add(
      b(
        [
          [1.3, 0.0905, 0.0925],
          [1.34, 0.0935, 0.0955],
          [1.44, 0.0935, 0.0955],
          [1.475, 0.0905, 0.0925],
        ],
        { seg: 16, start: 0, end: 0, radial: W(5, 0.02, 1.1, 0, 1) },
      ),
      {
        at: [0.23, 0, 0],
        bone: `armL`,
        grad: [R, L],
        gradEase: !0,
        team: 1,
        r: 0.6,
        tex: `cloth`,
        detail: 0.5,
        mirror: !0,
      },
    ));
  for (let [t, n] of [
    [0, 1],
    [1, 0.82],
    [2, 0.64],
  ]) {
    let i = ue(0.165 * n + 0.02, 0.085, 0.155 * n + 0.02, {
        thick: 0.016,
        lat0: -6,
        seg: 22,
        rings: 7,
        rimR: 0.012,
        innerSeg: 10,
        innerRings: 3,
        radial: (e, t) => 1 + 0.06 * Math.cos(t * 2),
      }),
      a = {
        at: [0.25 + t * 0.036, 1.62 - t * 0.075, 0],
        rot: [0, 0, -18 - t * 14],
        skin: () => [
          [u(`clavL`), 0.5],
          [u(`armL`), 0.5],
        ],
      };
    (e.add(i.outer, {
      ...a,
      grad: [Q.brass, Q.brassHi],
      gradEase: !0,
      teamFn: (e) => M(0.03, 0.062, e.y) * (t === 0 ? 1 : t === 1 ? 0.9 : 0.75),
      ...o,
      edge: 1.4,
    }),
      e.add(i.inner, { ...a, color: Q.trim, ...r }),
      e.add(i.rim, { ...a, color: Q.brassHi, ...o }));
  }
  (se(e, [0.25, 1.545, 0], 0.187, 0.177, {
    skin: () => [
      [u(`clavL`), 0.5],
      [u(`armL`), 0.5],
    ],
    bead: 0.0105,
    seg: 24,
    flare: 0.1,
    flareH: 0.03,
    studs: 11,
    studR: 0.0105,
    studH: 0.0072,
    studY: 0.008,
    arc: [-100, 110],
    tilt: -18,
    mat: { color: Q.brassHi, ...o },
    lipMat: { grad: [Q.brassDark, Q.brassHi], ...o },
    studMat: { color: Q.brassHi, ...o },
  }),
    ne(
      e,
      [
        [0.2, 1.72, 0.1],
        [0.26, 1.745, 0.06],
        [0.33, 1.72, 0],
      ],
      0.02,
      Q.sunCore,
      {
        skin: () => [
          [u(`clavL`), 0.5],
          [u(`armL`), 0.5],
        ],
        emit: Q.sun,
        ei: 1.3,
        hint: [0, 1, 0],
      },
    ),
    e.add(v(0.07, 0.05, 0.07), {
      at: [-0.25, 1.62, 0],
      rot: [0, 0, 20],
      skin: () => [
        [u(`clavR`), 0.5],
        [u(`armR`), 0.5],
      ],
      grad: [Q.brassDark, Q.brass],
      ...o,
    }));
  let O = pe(it, { ...fe.fine, nose: 0.24, noseW: 0.14 }),
    k = _e(O, {
      skin: Q.skin,
      skinDark: Q.skinDark,
      blush: `#e8907a`,
      lip: `#b4584a`,
      shade: `#a8705a`,
      mouth: `#5a2418`,
      lips: !1,
    }),
    A = (e) => {
      let t = k(e),
        n = S(Math.floor(e.x * 500) * 7 + Math.floor(e.y * 500) * 13);
      return e.z > 0.067 &&
        Math.abs(e.y + 0.034) < 0.034 &&
        Math.abs(e.x) < 0.078 &&
        n > 0.9
        ? t.clone().multiplyScalar(0.88)
        : t;
    };
  e.add(O.geo, {
    at: rt,
    bone: `head`,
    paint: A,
    ...s,
    detail: 0.25,
    shade: 0,
  });
  let P = e.lastPhase;
  ve(
    e,
    O,
    rt,
    {
      iris: `#3f9a4a`,
      irisHi: `#b8f07a`,
      white: `#f4ece2`,
      lash: `#2a140c`,
      brow: Q.hairDark,
      browHi: `#a04c26`,
      browHairs: 8,
      lower: `#8a5040`,
      lid: `#a06a50`,
      eyeW: 0.275,
      eyeH: 0.145,
      irisK: 0.9,
      browW: 0.36,
      browT: 0.26,
      browTilt: 0.04,
      tilt: 7,
      catch: 1.7,
      mat: { ...s, detail: 0.25 },
      uvPhase: P,
    },
    A,
  );
  {
    let t = O.S.mouthY,
      n = new i(`#b25c50`),
      r = new i(`#c26a5a`),
      a = new i(`#e3a08c`),
      o = new i(`#5a241c`),
      c = new i(`#8a4a3c`),
      l = new i(`#b27a62`);
    ge(
      e,
      O,
      rt,
      {
        e0: t - 0.26,
        e1: t + 0.2,
        q0: -0.72,
        q1: 0.72,
        nu: 56,
        nv: 32,
        mat: { ...s, detail: 0.25, shade: 0 },
        uvPhase: P,
        fn: (e, i, s) => {
          let u = Math.abs(i) / 0.34,
            d = e - (t + 0.004 + 0.03 * u * u * u),
            f =
              tt(d - 0.042, 0.03) *
              M(1, 0.72, u) *
              (1 - 0.3 * tt(i, 0.045) * tt(d - 0.06, 0.02)),
            p = tt(d + 0.062, 0.04) * M(0.9, 0.55, u);
          return (
            s.lerp(l, 0.32 * tt(d + 0.14, 0.03) * M(0.75, 0.35, u)),
            s.lerp(n, 0.8 * f),
            s.lerp(r, 0.7 * p),
            s.lerp(a, 0.38 * tt(d + 0.058, 0.018) * M(0.45, 0.08, u)),
            s.lerp(o, 0.9 * tt(d, 0.012) * M(0.95, 0.72, u)),
            s.lerp(c, 0.35 * tt(u - 0.97, 0.09) * tt(d + 0.005, 0.03)),
            s
          );
        },
      },
      k,
    );
  }
  for (let t of [1, -1])
    e.add(v(0.019, 0.0358, 0.0146), {
      at: [t * 0.112, 1.8364, 0.0088],
      rot: [0, 0, t * -10],
      bone: `head`,
      grad: [Q.skinDark, Q.skin],
      ...s,
    });
  let F = v(it[0] + 0.0134, it[1] + 0.009, it[2] + 0.0134, {
    rings: 12,
    seg: 24,
    e: 2.2,
    fn: (e) => {
      (e.z > 0.034 &&
        e.y < 0.056 &&
        (e.z = 0.034 + (e.z - 0.034) * 0.2 - (0.056 - e.y) * 0.3),
        e.y < -0.056 && e.z > -0.045 && (e.y = -0.056));
    },
  });
  e.add(F, {
    at: [rt[0], rt[1] + 0.0336, rt[2] - 0.0112],
    bone: `head`,
    grad: [Q.hairDark, Q.hairHi],
    gradEase: !0,
    ...l,
    detail: 1,
  });
  let I = [rt[0], rt[1] + 0.0336, rt[2] - 0.0112],
    z = [it[0] + 0.0224, it[1] + 0.018, it[2] + 0.0224],
    B = { bone: `head`, grad: [Q.hairDark, Q.hairHi], ...l };
  for (let t of [1, -1])
    for (let [n, r, i, a, o, s] of [
      [18, 70, 58, 150, 0.06, 25],
      [-5, 105, 45, 168, 0.055, 35],
      [40, 40, 72, 130, 0.055, 15],
      [-18, 130, 30, 175, 0.045, 30],
    ])
      ae(e, oe(I, z, n, t * r, i, t * a, 0.004, null, 6), o, {
        twist: t * s,
        thick: 0.22,
        taper: 0.4,
        samples: 12,
        strands: 6,
        mat: B,
      });
  for (let [t, n, r] of [
    [35, -35, 0.06],
    [15, -62, 0.046],
  ])
    ae(e, oe(I, z, 72, t, 24, n, 0.008, [-0.03, -0.035, 0.018]), r, {
      twist: -55,
      thick: 0.24,
      taper: 0.8,
      strands: 6,
      mat: B,
    });
  for (let t of [1, -1])
    ae(
      e,
      [
        [t * 0.0986, 1.9428, 0.0536],
        [t * 0.1187, 1.8588, 0.0626],
        [t * 0.1098, 1.786, 0.0446],
      ],
      0.04,
      { twist: t * 30, thick: 0.5, taper: 0.9, strands: 5, mat: B },
    );
  for (let t of [150, -150, 180])
    ae(e, oe(I, z, 70, t * 0.9, -35, t, 0.004, null, 5), 0.06, {
      twist: 20,
      thick: 0.22,
      taper: 0.35,
      strands: 6,
      mat: B,
    });
  {
    let t = [];
    for (let e = 0; e <= 9; e++) {
      let n = (e / 9 - 0.5) * 2;
      t.push([
        n * 0.1165,
        1.9226 - n * n * 0.05 + Math.sin(e * 2.1) * 0.007,
        0.094 - n * n * 0.062,
      ]);
    }
    ce(e, t, {
      bone: `head`,
      r: 0.0085,
      stitch: 0,
      curve: !0,
      up: [0, 0.4, 0.9],
      mat: { grad: [Q.hairDark, Q.hair], gradAxis: `y`, ...l },
    });
  }
  let V = [`hair1`, `hair2`, `hair3`, `hair4`];
  e.add(v(0.06, 0.053, 0.06, { rings: 8, seg: 14 }), {
    at: [0, 1.9718, -0.1064],
    bone: `head`,
    grad: [Q.hairDark, Q.hairHi],
    ...l,
  });
  for (let t = 0; t < 3; t++) {
    let n = (t - 1) * 0.032,
      r = [
        [n * 0.6, 1.978, -0.128],
        [n * 1.1, 1.946, -0.228],
        [n * 1.4, 1.815, -0.278],
        [n * 1.1, 1.682, -0.296],
        [n * 0.6, 1.562, -0.296],
      ];
    e.add(
      j(
        r,
        (e) => 0.046 * (1 - e ** 1.5 * 0.8) * (1 + 0.16 * Math.sin(e * 11 + t)),
        {
          seg: 10,
          samples: 16,
          twist: (e) => e * 220 * (t - 1),
          rz: (e) => 0.031 * (1 - e * 0.65),
          start: 0.5,
          end: 0.7,
          radial: (e, n) =>
            1 - 0.09 * Math.abs(Math.sin(n * 3 + e * 2.4 + t)) ** 0.6,
        },
      ),
      { chain: V, bw: 0.07, grad: [Q.hairDark, Q.hair], gradAxis: `y`, ...l },
    );
  }
  (e.add(d(1, 0.0143, { seg: 14, tube: 5 }), {
    at: [0, 1.962, -0.208],
    rot: [20, 0, 0],
    scale: [0.055, 0.055, 1],
    chain: V,
    bw: 0.02,
    color: Q.brassHi,
    ...o,
  }),
    e.add(d(1, 0.0132, { seg: 14, tube: 5 }), {
      at: [0, 1.744, -0.286],
      rot: [85, 0, 0],
      scale: [0.055, 0.055, 1],
      chain: V,
      bw: 0.02,
      color: Q.brassHi,
      ...o,
    }),
    e.add(d(1, 0.0265, { seg: 30, tube: 6 }), {
      at: [0, 1.9462, -0.0024],
      rot: [106, 0, 0],
      scale: [0.146, 0.153, 1],
      bone: `head`,
      grad: [Q.trim, Q.coatDark],
      ...r,
      edge: 1.4,
    }),
    e.add(d(1, 0.0088, { seg: 28, tube: 5 }), {
      at: [0, 1.9662, -0.0064],
      rot: [106, 0, 0],
      scale: [0.15, 0.157, 1],
      bone: `head`,
      color: Q.brassDark,
      ...o,
    }));
  for (let t of [1, -1])
    (e.add(d(0.04, 0.0146, { seg: 16, tube: 6 }), {
      at: [t * 0.056, 1.9908, 0.1096],
      rot: [-30, 0, 0],
      bone: `head`,
      color: Q.brassHi,
      ...o,
    }),
      e.add(v(0.037, 0.037, 0.012, { rings: 5, seg: 12 }), {
        at: [t * 0.056, 1.9908, 0.1096],
        rot: [-30, 0, 0],
        bone: `head`,
        color: Q.sunCore,
        emit: Q.amber,
        ei: 1.6,
        r: 0.1,
        m: 0.3,
        detail: 0,
        spec: 1,
      }));
  let le = n.bindPos(`weaponR`),
    H = at,
    U = (e, t, n) => [le.x + e * H, le.y + t * H, le.z + n * H],
    G = { bone: `weaponR` };
  (e.add(w(0.045 * H, 0.14 * H, 0.05 * H, { e: 4 }), {
    ...G,
    at: U(0, 0, -0.01),
    rot: [-12, 0, 0],
    color: Q.wood,
    ...c,
  }),
    e.add(
      y(
        [
          { p: [0, 0.08, -0.34], rx: 0.03, rz: 0.075, e: 3 },
          { p: [0, 0.075, -0.2], rx: 0.036, rz: 0.055, e: 3 },
          { p: [0, 0.075, 0], rx: 0.04, rz: 0.042, e: 3 },
        ].map((e) => ({
          ...e,
          p: e.p.map((e) => e * H),
          rx: e.rx * H,
          rz: e.rz * H,
        })),
        { seg: 10, start: `flat`, end: 0, hint: [0, 1, 0] },
      ),
      {
        ...G,
        at: [le.x, le.y, le.z],
        grad: [Q.wood, Q.woodHi],
        gradAxis: `z`,
        ...c,
      },
    ),
    e.add(w(0.075 * H, 0.08 * H, 0.42 * H, { e: 4 }), {
      ...G,
      at: U(0, 0.09, 0.2),
      grad: [Q.gunDark, Q.gun],
      gradAxis: `y`,
      ...o,
      edge: 1.5,
    }));
  for (let t of [0.06, 0.2, 0.34])
    ne(
      e,
      [U(0.04, 0.09, t - 0.04), U(0.04, 0.11, t), U(0.04, 0.09, t + 0.04)],
      0.012 * H,
      Q.sun,
      {
        ...G,
        emit: Q.sun,
        ei: 1.6,
        hint: [1, 0, 0],
        thick: 0.006 * H,
        mirror: !1,
      },
    );
  e.add(w(0.03 * H, 0.02 * H, 0.4 * H, { e: 4 }), {
    ...G,
    at: U(0, 0.135, 0.34),
    color: Q.wood,
    ...c,
  });
  let K = n.bindPos(`drum`);
  e.add(
    b(
      [
        [-0.045, 0.062, 0.062, 2],
        [-0.036, 0.072, 0.072],
        [0.036, 0.072, 0.072],
        [0.045, 0.062, 0.062],
      ].map((e) => [e[0] * H, e[1] * H, e[2] * H, e[3]]),
      {
        seg: 20,
        start: `flat`,
        end: `flat`,
        radial: (e, t) => 1 + 0.05 * Math.abs(Math.cos(t * 3)) ** 8,
      },
    ),
    {
      bone: `drum`,
      at: [K.x, K.y, K.z],
      rot: [0, 0, 90],
      grad: [Q.gunDark, Q.gun],
      ...o,
    },
  );
  let q = (e, t = 26) => {
      let n = [];
      for (let r = 0; r < t; r++) {
        let i = (r / t) * Math.PI * 2;
        n.push([Math.cos(i) * e, Math.sin(i) * e]);
      }
      return n;
    },
    me = 0.0148 * H,
    he = 0.032 * H;
  for (let t of [1, -1]) {
    (e.add(v(0.04 * H, 0.04 * H, 0.008 * H, { rings: 8, seg: 18 }), {
      bone: `drum`,
      at: [K.x + t * 0.03 * H, K.y, K.z],
      rot: [0, 90, 0],
      grad: [Q.brassDark, Q.sunCore],
      gradAxis: `x`,
      emit: Q.sun,
      ei: 1.35,
      emitFn: (e) => 1 - 0.78 * Math.min(1, Math.hypot(e.x, e.z) / (0.042 * H)),
      r: 0.2,
      detail: 0,
      ao: !1,
    }),
      e.add(
        T(q(0.062 * H, 30), 0.011 * H, {
          bevel: 0.0035 * H,
          bevelSeg: 2,
          curveSeg: 2,
          holes: [
            q(0.017 * H, 16),
            ...Array.from({ length: 6 }, (e, n) => {
              let r = (n / 6) * Math.PI * 2 + t * 0.25;
              return q(me, 14).map(([e, t]) => [
                e + Math.cos(r) * he,
                t + Math.sin(r) * he,
              ]);
            }),
          ],
        }),
        {
          bone: `drum`,
          at: [K.x + t * 0.0465 * H, K.y, K.z],
          rot: [0, 90 * t, 0],
          grad: [Q.brassDark, Q.brassHi],
          gradAxis: `y`,
          ...o,
          edge: 1.6,
        },
      ),
      e.add(
        b(
          [
            [0, 0.016, 0.016],
            [0.012, 0.019, 0.019],
            [0.02, 0.011, 0.011],
          ].map((e) => [e[0] * H, e[1] * H, e[2] * H]),
          { seg: 12, start: `flat`, end: `flat` },
        ),
        {
          bone: `drum`,
          at: [K.x + t * 0.052 * H, K.y, K.z],
          rot: [0, 0, t * 90],
          color: Q.brassHi,
          ...o,
        },
      ));
    for (let n = 0; n < 6; n++) {
      let r = (n / 6) * Math.PI * 2 + t * 0.25,
        i = K.y + Math.cos(r) * he,
        a = K.z + Math.sin(r) * he;
      (e.add(
        b(
          [
            [0, me * 0.96, me * 0.96],
            [0.032 * H, me * 0.96, me * 0.96],
          ],
          { seg: 14, start: 0, end: 0, flipNormals: !0 },
        ),
        {
          bone: `drum`,
          at: [K.x + t * 0.049 * H, i, a],
          rot: [0, 0, t * 90],
          color: `#2a1c0c`,
          ...o,
          r: 0.7,
          m: 0.4,
        },
      ),
        se(e, [K.x + t * 0.0515 * H, i, a], me * 1.02, me * 1.02, {
          bone: `drum`,
          bead: 0.0027 * H,
          seg: 14,
          studs: 0,
          tilt: 0,
          mat: { color: Q.brassHi, ...o },
        }),
        e.add(v(0.0058 * H, 0.0058 * H, 0.0058 * H, { rings: 5, seg: 10 }), {
          bone: `drum`,
          at: [K.x + t * 0.04 * H, i, a],
          color: Q.woodHi,
          ...c,
        }));
    }
    if (
      (e.add(d(0.044 * H, 0.0075 * H, { seg: 22, tube: 6 }), {
        bone: `drum`,
        at: [K.x + t * 0.0505 * H, K.y, K.z],
        rot: [0, 90, 0],
        color: Q.brassHi,
        ...o,
      }),
      t > 0)
    )
      for (let t = 0; t < 10; t++) {
        let n = (t / 10) * Math.PI * 2;
        e.add(w(0.052 * H, 0.017 * H, 0.015 * H, { e: 4 }), {
          bone: `drum`,
          at: [
            K.x,
            K.y + Math.cos(n) * 0.0775 * H,
            K.z + Math.sin(n) * 0.0775 * H,
          ],
          rot: [(n / Math.PI) * 180, 0, 0],
          color: Q.brassHi,
          ...o,
          edge: 1.6,
        });
      }
  }
  for (let t = 0; t < 16; t++) {
    let n = (t / 16) * Math.PI * 2;
    e.add(w(0.011 * H, 0.026 * H, 0.014 * H, { e: 3, seg: 6 }), {
      bone: `drum`,
      at: [K.x, K.y + Math.cos(n) * 0.0755 * H, K.z + Math.sin(n) * 0.0755 * H],
      rot: [(-n / Math.PI) * 180, 0, 0],
      color: Q.brassHi,
      ...o,
      edge: 1.5,
    });
  }
  e.glowCard(`drum`, [K.x, K.y, K.z], 0.34, Q.sun, 0.75);
  for (let t = 0; t < 6; t++) {
    let n = (t / 6) * Math.PI * 2;
    e.add(v(0.012 * H, 0.012 * H, 0.012 * H, { rings: 4, seg: 6 }), {
      bone: `drum`,
      at: [K.x, K.y + Math.cos(n) * 0.074 * H, K.z + Math.sin(n) * 0.074 * H],
      color: Q.sun,
      emit: Q.sun,
      ei: 1.4,
      detail: 0,
    });
  }
  let ye = (e) => [
    U(0, 0.1, 0.5),
    U(e * 0.14, 0.1, 0.52),
    U(e * 0.28, 0.1, 0.47),
    U(e * 0.37, 0.1, 0.38),
    U(e * 0.4, 0.1, 0.42),
  ];
  for (let t of [1, -1])
    (e.add(
      j(ye(t), (e) => 0.03 * H * (1 - e * 0.55), {
        seg: 8,
        samples: 14,
        rz: (e) => (0.018 * (1 - e * 0.4) + 0.006) * H,
        hint: [0, 1, 0],
      }),
      { ...G, grad: [Q.gunDark, Q.gun], gradAxis: `x`, ...o },
    ),
      ne(
        e,
        ye(t)
          .slice(0, 4)
          .map((e) => [e[0], e[1] + 0.022 * H, e[2]]),
        0.01 * H,
        Q.sun,
        { ...G, emit: Q.sun, ei: 1.8, hint: [0, 1, 0], thick: 0.004 * H },
      ),
      e.add(
        j([U(t * 0.4, 0.1, 0.42), U(0, 0.115, 0.25)], 0.0042 * H, {
          seg: 5,
          curve: !1,
        }),
        { ...G, color: `#c9b48a`, r: 0.75, detail: 0.3, tex: `cloth`, seam: 0 },
      ));
  (e.add(
    b(
      [
        [0, 0.03, 0.03],
        [0.07, 0.034, 0.034],
        [0.09, 0.02, 0.02],
      ].map((e) => [e[0] * H, e[1] * H, e[2] * H]),
      { seg: 12, start: `flat`, end: `flat` },
    ),
    { ...G, at: U(0, 0.1, 0.48), rot: [90, 0, 0], color: Q.brassHi, ...o },
  ),
    e.add(
      j([U(0, 0.125, 0.24), U(0, 0.125, 0.6)], 0.008 * H, {
        seg: 5,
        curve: !1,
      }),
      { ...G, color: Q.woodHi, ...c },
    ),
    e.add(
      b(
        [
          [0, 0.016 * H, 0.016 * H],
          [0.06 * H, 0.001, 0.001],
        ],
        { seg: 6, start: `flat` },
      ),
      {
        ...G,
        at: U(0, 0.125, 0.6),
        rot: [90, 0, 0],
        color: `#fff6d8`,
        emit: Q.sun,
        ei: 2.6,
        ao: !1,
        detail: 0,
      },
    ),
    e.glowCard(`weaponR`, U(0, 0.125, 0.64), 0.26, Q.sun, 0.9),
    e.add(w(0.035 * H, 0.1 * H, 0.04 * H, { e: 4 }), {
      ...G,
      at: [le.x, le.y + 0.01 * H, le.z + 0.2],
      rot: [8, 0, 0],
      color: Q.wood,
      ...c,
    }));
}
var lt = (e, t, n, r = 0, i = 0, a = 0) => ({
    wIK: 1,
    wX: e,
    wY: t,
    wZ: n,
    wRX: r,
    wRY: i,
    wRZ: a,
  }),
  ut = {
    id: `vyre`,
    height: 2,
    element: `#ffd36b`,
    rim: `#fff0c8`,
    proportions: nt,
    bones: st,
    build: ct,
    poses: {
      stance: {
        hipT: [0, -0.04, 0],
        hips: [0, 18, -3],
        spine: [4, -8, 0],
        chest: [2, -12, 0],
        neck: [0, 4, 0],
        head: [-4, 10, 0],
        armR: [-12, -10, -10],
        foreR: [-48, 0, 0],
        handR: [0, 0, 0],
        weaponR: [90, 0, 0],
        armL: [-40, 10, 10],
        foreL: [-60, 0, 0],
        ikL: 1,
        ...lt(-0.17, 1, 0.27, 16, -16, -8),
        footL: [0.06, 0, 0.14, 0],
        footR: [-0.06, 0, -0.12, 8],
        coatL1: [8, 0, 4],
        coatR1: [8, 0, -4],
        hair1: [20, 0, 0],
      },
      idle: {},
      splash: {
        hipT: [-0.05, -0.07, -0.02],
        hips: [0, 24, 5],
        spine: [2, -6, -3],
        chest: [-4, -14, -2],
        neck: [2, 6, 2],
        head: [0, 12, -6],
        ...lt(-0.33, 1.02, 0.2, -66, -8, -80),
        footL: [0.1, 0, 0.2, 0],
        footR: [-0.09, 0, -0.1, 12],
        hair1: [16, 0, 4],
        coatL1: [8, 0, 8],
        coatR1: [6, 0, -4],
      },
      run: {
        hipT: [0, -0.125, 0.02],
        hips: [12, 0, 0],
        spine: [17, 0, 0],
        chest: [7, 10, 0],
        neck: [-9, -6, 0],
        head: [-13, -6, 0],
        ...lt(-0.33, 1.02, 0.24, 20, -24, -34),
        ikL: 0,
        armL: [-6, 0, 12],
        foreL: [-62, 0, 0],
        handL: [0, 0, 0],
        footL: [0.02, 0, 0, 0],
        footR: [-0.02, 0, 0, 0],
        coatL1: [26, 0, 6],
        coatR1: [26, 0, -6],
      },
      aim: {
        hipT: [0.02, -0.13, -0.02],
        hips: [6, 34, -4],
        spine: [8, 6, 3],
        chest: [2, -40, 4],
        neck: [4, -6, 0],
        head: [10, -6, -14],
        ...lt(-0.13, 1.5, 0.3, 0, -3, 0),
        footL: [0.14, 0, 0.28, 0],
        footR: [-0.13, 0, -0.24, 14],
        hair1: [10, 0, 0],
        coatL1: [12, 0, 6],
        coatR1: [4, 0, -8],
      },
      fire: {
        extends: `aim`,
        hipT: [0.01, -0.12, -0.06],
        spine: [2, 6, 3],
        chest: [-6, -36, 4],
        head: [4, -6, -12],
        ...lt(-0.14, 1.54, 0.21, -9, -3, 2),
        emit: 0.8,
        trail: 1,
      },
      aimB: {
        extends: `aim`,
        hipT: [0.03, -0.2, 0],
        hips: [10, 26, -6],
        spine: [14, 8, 4],
        chest: [6, -32, 5],
        ...lt(-0.12, 1.42, 0.32, 0, 5, 0),
        footL: [0.16, 0, 0.3, 0],
        footR: [-0.14, 0.02, -0.28, 18],
      },
      fireB: {
        extends: `aimB`,
        hipT: [0.02, -0.19, -0.05],
        spine: [8, 8, 4],
        chest: [0, -30, 5],
        ...lt(-0.13, 1.46, 0.23, -10, 5, 2),
        emit: 0.8,
        trail: 1,
      },
      qAim: {
        extends: `aim`,
        hipT: [0, -0.16, -0.02],
        spine: [12, 6, 3],
        chest: [2, -38, 4],
        head: [12, -8, -16],
        ...lt(-0.12, 1.5, 0.34),
        emit: 1.4,
      },
      qFire: {
        extends: `qAim`,
        hipT: [0, -0.12, -0.1],
        spine: [-6, 10, 3],
        chest: [-12, -34, 4],
        head: [0, -8, -10],
        ...lt(-0.13, 1.58, 0.2, -20),
        emit: 2,
        trail: 1,
      },
      wLeft: {
        extends: `aim`,
        hips: [4, 46, 0],
        chest: [2, -6, 3],
        ...lt(0.04, 1.55, 0.4, 0, 40, 0),
        emit: 1,
      },
      wRight: {
        extends: `aim`,
        hips: [4, 4, 0],
        chest: [2, -52, 3],
        ...lt(-0.28, 1.55, 0.32, 0, -40, 0),
        emit: 1,
        trail: 1,
      },
      roll: {
        hipT: [0, -0.3, 0],
        hips: [24, 0, 0],
        spine: [34, 0, 0],
        chest: [16, 0, 0],
        neck: [18, 0, 0],
        head: [24, 0, 0],
        ...lt(-0.16, 1.18, 0.3, 50, -20, 0),
        armL: [-70, 0, 60],
        foreL: [-40, 0, 0],
        ikL: 0,
        footL: [0.12, 0.3, 0.26, 50],
        footR: [-0.12, 0.2, 0.04, 30],
        coatL1: [50, 0, 10],
        coatR1: [50, 0, -10],
        hair1: [40, 0, 0],
      },
      rKneel: {
        hipT: [0, -0.4, -0.04],
        hips: [0, 24, 0],
        spine: [10, 8, 0],
        chest: [2, -32, 3],
        head: [10, -8, -14],
        ...lt(-0.11, 1.2, 0.44),
        footL: [0.08, 0, 0.26, 0],
        footR: [-0.1, 0.2, -0.34, 72],
        emit: 2.2,
      },
      rBlast: {
        extends: `rKneel`,
        hipT: [0, -0.36, -0.12],
        spine: [-8, 8, 0],
        chest: [-14, -30, 3],
        ...lt(-0.11, 1.28, 0.3, -28),
        emit: 3,
        trail: 1,
      },
      recall: {
        hipT: [0, -0.4, -0.05],
        hips: [0, 0, 0],
        spine: [8, 0, 0],
        chest: [4, 0, 0],
        head: [12, 10, 0],
        ...lt(-0.24, 0.66, 0.3, -76, -10, 0),
        armL: [-50, 0, 10],
        foreL: [-60, 0, 0],
        ikL: 0,
        footL: [0.1, 0, 0.26, 0],
        footR: [-0.1, 0.2, -0.32, 70],
        emit: 0.8,
      },
      stun: {
        hipT: [0, -0.08, -0.04],
        spine: [22, 0, 0],
        chest: [10, 0, 0],
        neck: [18, 0, 0],
        head: [20, 0, 0],
        armR: [0, 0, -10],
        foreR: [-30, 0, 0],
        handR: [20, 0, 0],
        armL: [0, 0, 10],
        foreL: [-20, 0, 0],
        ikL: 0,
        wIK: 0,
      },
      air: {
        spine: [-6, 0, 0],
        chest: [-5, 0, 0],
        head: [10, 0, 0],
        armL: [-120, 0, 60],
        foreL: [-30, 0, 0],
        armR: [-100, 0, -50],
        foreR: [-40, 0, 0],
        ikL: 0,
        wIK: 0,
        footL: [0.05, 0.25, 0.1, 30],
        footR: [-0.05, 0.08, -0.2, -20],
      },
      flinch: {
        extends: null,
        hipT: [0, -0.02, -0.05],
        spine: [-8, 0, 0],
        chest: [-8, 0, 0],
        head: [14, 0, 0],
      },
      deathA: {
        spine: [-16, 0, 0],
        chest: [-18, 0, 0],
        head: [30, 0, 0],
        armL: [-60, 0, 50],
        armR: [-60, 0, -50],
        foreR: [-30, 0, 0],
        ikL: 0,
        wIK: 0,
      },
      deathB: {
        extends: `deathA`,
        hipT: [0, -0.52, 0],
        spine: [24, 0, 0],
        chest: [20, 0, 0],
        head: [20, 0, 0],
        footL: [0.1, 0, 0.26, 0],
        footR: [-0.1, 0, 0.2, 0],
        armL: [10, 0, 20],
        armR: [10, 0, -20],
      },
      deathC: {
        extends: `deathB`,
        root: [86, 0, 8],
        rootT: [0, 0.18, -0.6],
        hipT: [0, -0.32, 0],
        spine: [-6, 0, 0],
        chest: [-6, 0, 0],
        neck: [-10, -40, 0],
        head: [-10, -30, 0],
        armL: [-130, 0, 50],
        foreL: [-20, 0, 0],
        armR: [-40, 0, -60],
        foreR: [-30, 0, 0],
        footL: [0.12, 0.1, 0.12, 20],
        footR: [-0.1, 0, 0, 10],
      },
    },
    kneeOut: 0.2,
    elbowPole: [0.45, -0.7, -0.55],
    aimBone: `weaponR`,
    grips: { L: { bone: `weaponR`, p: [0.121, 0.025, 0.29], q: [0, 0, -90] } },
    anchors: {
      weapon: { bone: `weaponR`, p: [0, 0.125 * at, 0.64 * at] },
      muzzle: { bone: `weaponR`, p: [0, 0.125 * at, 0.62 * at] },
      head: { bone: `head`, p: [0, 0.1, 0.02] },
      chest: { bone: `chest`, p: [0, 0.14, 0.1] },
    },
    trails: [
      {
        bone: `weaponR`,
        a: [0, 0.1 * at, 0.45 * at],
        b: [0, 0.125 * at, 0.66 * at],
        color: `#ffd36b`,
      },
    ],
    portrait: {
      yaw: 0.28,
      props: [`weaponR`, `drum`],
      rim: `#ffd36b`,
      fill: 1,
    },
    colliders: {
      hips: {
        bone: `hips`,
        a: [-0.08, 0, -0.02],
        b: [0.08, 0, -0.02],
        r: 0.15,
      },
      thighL: { bone: `thighL`, a: [0, 0, 0], b: [0, -0.44, 0], r: 0.11 },
      thighR: { bone: `thighR`, a: [0, 0, 0], b: [0, -0.44, 0], r: 0.11 },
      shinL: { bone: `shinL`, a: [0, 0, 0], b: [0, -0.44, 0], r: 0.09 },
      shinR: { bone: `shinR`, a: [0, 0, 0], b: [0, -0.44, 0], r: 0.09 },
      chest: { bone: `chest`, a: [0, 0, -0.02], b: [0, 0.28, -0.02], r: 0.16 },
      head: { bone: `head`, a: [0, 0.1, 0], b: [0, 0.1, 0], r: 0.14 },
      armR: { bone: `armR`, a: [0, 0, 0], b: [0, -0.3, 0], r: 0.08 },
    },
    anim: {
      run: {
        stride: 1.88,
        lift: 0.27,
        bob: 0.13,
        pitch: 3.5,
        twist: 17,
        roll: 7,
        headLead: 0.3,
        carry: 0.3,
        armL: 38,
        armR: 0,
      },
      center: 0.8,
      airHeight: 1.2,
      airTumble: 52,
      attackFollow: 0.1,
      attackHold: 0.14,
      breath: 3.1,
      attacks: [
        {
          ready: `aim`,
          wind: `aim`,
          strike: `fire`,
          follow: `aim`,
          windAt: 0.35,
        },
        {
          ready: `aimB`,
          wind: `aimB`,
          strike: `fireB`,
          follow: `aimB`,
          windAt: 0.35,
        },
      ],
      casts: {
        Q: {
          keys: [
            [0, `qAim`],
            [0.08, `qAim`, `o`],
            [0.12, `qFire`, `i`],
            [0.3, `qAim`],
          ],
          len: 0.34,
          out: 0.3,
        },
        W: {
          keys: [
            [0, `wLeft`],
            [0.05, `wLeft`, `o`],
            [0.3, `wRight`, `s`],
            [0.4, `wRight`],
          ],
          len: 0.4,
          out: 0.3,
        },
        E: { keys: [[0, `roll`]], len: 0.2, out: 0.2 },
        R: {
          keys: [
            [0, `aim`],
            [0.2, `rKneel`, `o`],
            [0.7, `rKneel`],
            [0.76, `rBlast`, `i`],
            [1.1, `rKneel`, `o`],
          ],
          len: 1.1,
          out: 0.35,
        },
        spell: { keys: [[0, `stance`]], len: 0.05, out: 0.1, upper: !0 },
      },
      dash: {
        default: { keys: [[0, `roll`]], roll: 1 },
        E: { keys: [[0, `roll`]], roll: 1 },
      },
      recall: {
        keys: [
          [0, `stance`],
          [0.45, `recall`, `o`],
        ],
      },
      death: {
        keys: [
          [0, `deathA`],
          [0.1, `deathA`, `o`],
          [0.36, `deathB`, `i`],
          [0.68, `deathC`, `i`],
        ],
      },
      cloth: [
        {
          bones: [`coatL1`, `coatL2`, `coatL3`],
          tip: [0.01, -0.2, -0.01],
          stiffRoot: 0.4,
          stiffTip: 0.05,
          drag: 2.6,
          hang: 0.5,
          maxAngle: 30,
          flutter: 0.5,
          freq: 6,
          phase: 0,
          collide: [`hips`, `thighL`, `thighR`, `shinL`, `shinR`],
          plane: { bone: `hips`, n: [0, 0, -1], d: 0.08 },
        },
        {
          bones: [`coatR1`, `coatR2`, `coatR3`],
          tip: [-0.01, -0.2, -0.01],
          stiffRoot: 0.4,
          stiffTip: 0.05,
          drag: 2.6,
          hang: 0.5,
          maxAngle: 30,
          flutter: 0.5,
          freq: 6.7,
          phase: 1.3,
          collide: [`hips`, `thighL`, `thighR`, `shinL`, `shinR`],
          plane: { bone: `hips`, n: [0, 0, -1], d: 0.08 },
        },
        {
          bones: [`capeV1`, `capeV2`, `capeV3`],
          tip: [0.02, -0.2, -0.02],
          stiffRoot: 0.45,
          stiffTip: 0.06,
          drag: 2.6,
          hang: 0.5,
          maxAngle: 28,
          flutter: 0.45,
          freq: 5.5,
          phase: 0.6,
          collide: [`chest`, `hips`, `armR`],
          plane: { bone: `chest`, n: [0, 0, -1], d: 0.1 },
        },
        {
          bones: [`hair1`, `hair2`, `hair3`, `hair4`],
          tip: [0, -0.1, 0],
          stiffRoot: 0.5,
          stiffTip: 0.06,
          drag: 2.4,
          gravity: 1,
          hang: 0.75,
          maxAngle: 30,
          flutter: 0.35,
          freq: 7,
          collide: [`head`, `chest`],
          plane: { bone: `chest`, n: [0, 0, -1], d: 0.06 },
        },
      ],
      chains: [],
      procedural(e, t, n) {
        let r = e._dt,
          i = e.custom,
          a = (n.attackSeq + n.castSeq) * (Math.PI / 3);
        ((i.drum =
          i.drum == null ? a : i.drum + (a - i.drum) * (1 - Math.exp(-r * 18))),
          (i.drumI ??= e.type.rig.index(`drum`) * 3),
          (t[i.drumI] += i.drum));
        let o = e.runW;
        if (o > 0.002) {
          let n = e.L.scalar,
            r = e.runPhase * Math.PI * 2 + 1.7;
          ((t[n.wY] += Math.sin(r) * 0.052 * o),
            (t[n.wZ] += Math.cos(r) * 0.04 * o),
            (t[n.wX] += Math.sin(r * 0.5) * 0.022 * o),
            (t[n.wRX] += Math.sin(r + 0.6) * 8 * o),
            (t[n.wRZ] += Math.cos(r) * 6 * o));
        }
      },
    },
  },
  $ = {
    skin: `#42906b`,
    skinHi: `#8ecba0`,
    skinDark: `#1e5040`,
    belly: `#cadfae`,
    coral: `#c9575f`,
    coralHi: `#eea3a0`,
    coralDark: `#7e2c40`,
    crownHi: `#d8f0dc`,
    shell: `#cbbca6`,
    shellDark: `#977463`,
    kelp: `#1f6e5a`,
    kelpHi: `#4fb08f`,
    iron: `#455c68`,
    ironHi: `#93b0b6`,
    verdigris: `#6cc4b2`,
    bellyBand: `#96b878`,
    aqua: `#39d0e0`,
    foam: `#e8fbff`,
    rope: `#8f7650`,
    ropeDark: `#5a4630`,
    barnacle: `#d8d0bd`,
    pearl: `#f4f0e6`,
  },
  dt = {
    hipY: 0.92,
    hipX: 0.19,
    hipDrop: 0.03,
    thigh: 0.4,
    shin: 0.4,
    spineOff: 0.08,
    spine: 0.3,
    chest: 0.46,
    neck: 0.22,
    neckZ: 0.1,
    headZ: 0.09,
    clavX: 0.12,
    clavY: 0.36,
    shoulderX: 0.36,
    upperArm: 0.42,
    foreArm: 0.4,
  },
  ft = [0, 2.1599999999999997, 0.24],
  pt = [0.152, 0.157, 0.157],
  mt = [];
{
  let e = (e, t, n, r) => {
    (mt.push([e, t, n, r]), mt.push([-e * 0.96, t - 0.02, n, r * 0.9]));
  };
  (e(0.2, 1.72, -0.22, 0.045),
    e(0.28, 1.66, -0.2, 0.032),
    e(0.15, 1.62, -0.28, 0.028),
    e(0.34, 1.73, -0.12, 0.03),
    e(0.26, 1.78, -0.1, 0.022),
    e(0.06, 1.52, -0.33, 0.038),
    e(0.09, 1.4, -0.34, 0.026),
    e(0.04, 1.28, -0.32, 0.03),
    e(0.07, 1.16, -0.28, 0.022),
    e(0.62, 1.52, -0.05, 0.036),
    e(0.64, 1.42, 0.02, 0.026),
    e(0.6, 1.34, -0.08, 0.022),
    e(0.63, 1.03, -0.04, 0.024));
}
var ht = (e) => {
    let t = 0;
    for (let [n, r, i, a] of mt) {
      let o = Math.hypot(e.x - n, e.y - r, e.z - i),
        s = M(a * 1.9, a * 0.35, o);
      s > t && (t = s);
    }
    return t;
  },
  gt = [
    [`FL`, 0.1, 0.25, 1],
    [`FR`, -0.1, 0.25, 1],
    [`BL`, 0.12, -0.23, -1],
    [`BR`, -0.12, -0.23, -1],
  ];
function _t(e) {
  let t = F(e),
    n = (e, n, r, i, a) => t.push({ name: e, parent: n, pos: [r, i, a] });
  n(`anchorR`, `handR`, 0, -0.12, 0);
  for (let [e, t, r, i] of gt)
    (n(`kelp${e}1`, `hips`, t, -0.04, r),
      n(`kelp${e}2`, `kelp${e}1`, t * 0.05, -0.2, i * 0.03),
      n(`kelp${e}3`, `kelp${e}2`, t * 0.05, -0.2, i * 0.02));
  return (
    n(`beard1`, `head`, 0, -0.1, 0.15),
    n(`beard2`, `beard1`, 0, -0.13, 0.04),
    n(`beard3`, `beard2`, 0, -0.13, 0.01),
    t
  );
}
var vt = new i($.crownHi);
function yt(e, t, n) {
  let r = { r: 0.55, m: 0, detail: 0.85, tex: `hide`, spec: 0.3 },
    a = { r: 0.8, m: 0, detail: 1, tex: `coral` },
    o = { r: 0.35, m: 0.1, detail: 0.7, tex: `stone`, spec: 0.6 },
    s = { r: 0.45, m: 0.8, detail: 1, tex: `metal` },
    c = { r: 0.6, m: 0, detail: 0.9, tex: `cloth` },
    l = (e) => n.index(e),
    u = (e, t) => {
      let n = ht(t),
        r = t.z > 0.22 && t.y < 1.42 && t.y > 0.9 && Math.abs(t.x) < 0.3;
      return new i(
        r
          ? Math.sin(t.y * 31) > 0.25
            ? $.bellyBand
            : $.belly
          : t.z < -0.05 && Math.sin(t.y * 26 + Math.abs(t.x) * 9) > 0.55
            ? $.skinDark
            : t.y > 1.55
              ? $.skinHi
              : $.skin,
      ).lerp(new i($.foam), n * 0.55);
    },
    f = { emit: $.aqua, ei: 1.3, emitFn: (e, t) => ht(t) },
    h = [
      { p: [0, 0.9, 0], rx: 0.2, rz: 0.165 },
      { p: [0, 0.99, 0], rx: 0.295, rz: 0.245 },
      { p: [0, 1.12, 0.03], rx: 0.33, rz: 0.29 },
      { p: [0, 1.3, 0.05], rx: 0.4, rz: 0.32 },
      { p: [0, 1.48, 0.06], rx: 0.47, rz: 0.33 },
      { p: [0, 1.64, 0.06], rx: 0.48, rz: 0.31 },
      { p: [0, 1.76, 0.07], rx: 0.38, rz: 0.26 },
      { p: [0, 1.87, 0.13], rx: 0.2, rz: 0.17 },
      { p: [0, 1.96, 0.18], rx: 0.15, rz: 0.138 },
      { p: [0, 2.05, 0.2], rx: 0.126, rz: 0.116 },
    ],
    g = [];
  for (let e = 0; e < h.length - 1; e++)
    for (let t = 0; t < 3; t++) {
      let n = h[e],
        r = h[e + 1],
        i = t / 3;
      g.push({
        p: [0, p(n.p[1], r.p[1], i), p(n.p[2], r.p[2], i)],
        rx: p(n.rx, r.rx, i),
        rz: p(n.rz, r.rz, i),
      });
    }
  (g.push(h[h.length - 1]),
    e.add(
      y(g, {
        seg: 32,
        start: 0.3,
        end: 0.3,
        radial: ee([
          [0.62, 65, 0.08, 28, 0.08],
          [0.62, 115, 0.08, 28, 0.08],
          [0.35, 90, 0.12, 40, 0.06],
          [0.7, 270, 0.12, 50, 0.07],
          [0.72, 230, 0.08, 25, 0.05],
          [0.72, 310, 0.08, 25, 0.05],
        ]),
      }),
      {
        chain: [`hips`, `spine`, `chest`, `neck`],
        bw: 0.12,
        paint: u,
        ...r,
        ...f,
      },
    ));
  let C = [];
  for (let e = 0; e <= 18; e++) {
    let t = Math.PI * (0.05 + (0.9 * e) / 18);
    C.push([Math.cos(t) * 0.3, Math.sin(t) * 0.3 - 0.06]);
  }
  C.push([0.06, -0.12], [-0.06, -0.12]);
  let w = T(C.slice().reverse(), 0.05, { bevel: 0.02 });
  _(w, (e) => {
    let t = Math.atan2(e.y + 0.06, e.x);
    e.z +=
      Math.abs(Math.sin(t * 9)) *
      0.03 *
      Math.min(1, Math.hypot(e.x, e.y + 0.06) / 0.2);
  });
  let E = (e) => {
    let t = Math.atan2(e.y + 0.06, e.x);
    return Math.abs(Math.sin(t * 9)) > 0.75 ? $.shell : $.shellDark;
  };
  (e.add(w, {
    at: [0, 1.42, 0.33],
    rot: [-16, 0, 0],
    bone: `chest`,
    paint: E,
    teamFn: (e) => 0.6 * M(0.252, 0.3, Math.hypot(e.x, e.y + 0.06)),
    ...o,
    edge: 1.4,
  }),
    e.add(v(0.04, 0.04, 0.04, { rings: 8, seg: 12 }), {
      at: [0, 1.4, 0.385],
      bone: `chest`,
      color: $.pearl,
      r: 0.15,
      tex: `gem`,
      spec: 1.2,
    }),
    e.add(w.clone(), {
      at: [0, 1.5, -0.3],
      rot: [14, 180, 0],
      scale: 0.9,
      bone: `chest`,
      paint: E,
      teamFn: (e) => 0.6 * M(0.19, 0.25, Math.hypot(e.x, e.y + 0.06)),
      ...o,
    }),
    e.add(
      b(
        [
          [0.944, 0.317, 0.267],
          [0.966, 0.33, 0.28],
          [0.99, 0.323, 0.273],
        ],
        { seg: 30, start: 0, end: 0 },
      ),
      {
        bone: `hips`,
        grad: [R, L],
        gradEase: !0,
        teamFn: (e) => 0.6 * M(0.942, 0.956, e.y) * (1 - M(0.978, 0.99, e.y)),
        r: 0.7,
        tex: `leather`,
        detail: 0.6,
      },
    ));
  for (let t of [0.92, 1.01])
    e.add(d(1, 0.028, { seg: 30, tube: 6 }), {
      at: [0, t, 0],
      rot: [90, 0, 0],
      scale: [0.32, 0.27, 1],
      bone: `hips`,
      paint: (e) =>
        Math.sin(Math.atan2(e.y, e.x) * 30 + e.z * 40) > 0
          ? $.rope
          : $.ropeDark,
      r: 0.9,
      detail: 0.9,
      tex: `wood`,
    });
  se(e, [0, 0.966, 0], 0.334, 0.284, {
    bone: `hips`,
    bead: 0,
    studs: 14,
    studR: 0.022,
    studH: 0.015,
    studOut: 0.008,
    seg: 30,
    studMat: { grad: [$.shellDark, $.shell], ...o },
  });
  let D = {
      F: gt
        .filter((e) => e[3] > 0)
        .map(([e, t]) => ({
          chain: [1, 2, 3].map((t) => `kelp${e}${t}`),
          x: t,
        }))
        .sort((e, t) => e.x - t.x),
      B: gt
        .filter((e) => e[3] < 0)
        .map(([e, t]) => ({
          chain: [1, 2, 3].map((t) => `kelp${e}${t}`),
          x: t,
        }))
        .sort((e, t) => e.x - t.x),
    },
    O = (t, r, i, a) => {
      let o = a === `F` ? 1 : -1,
        s = N(
          [
            [t, 0.98, r],
            [t * 1.05, 0.78, r + o * 0.03],
            [t * 1.1, 0.98 - i, r + o * 0.05],
          ],
          (e) => 0.1 - e * 0.055,
          0.018,
          { hint: [0, 0, 1], seg: 8, samples: 10 },
        );
      (_(s, (e) => {
        e.x += Math.sin(e.y * 18) * 0.012;
      }),
        e.add(s, {
          skin: (e) => x(n, D[a], e, 0.1),
          grad: [$.kelp, $.kelpHi],
          ...c,
        }));
    };
  for (let e of [-0.16, -0.06, 0.05, 0.15])
    O(
      e,
      0.26 - Math.abs(e) * 0.25,
      0.36 + Math.abs(Math.sin(e * 40)) * 0.1,
      `F`,
    );
  for (let e of [-0.2, -0.08, 0.06, 0.19])
    O(
      e,
      -0.24 + Math.abs(e) * 0.2,
      0.55 + Math.abs(Math.cos(e * 40)) * 0.1,
      `B`,
    );
  te(
    e,
    n,
    [`thighL`, `shinL`, `footL`],
    [
      [0, 0.175, 0.195],
      [0.14, 0.208, 0.218],
      [0.36, 0.175, 0.182],
      [0.47, 0.133, 0.142],
      [0.53, 0.128, 0.137],
      [0.64, 0.152, 0.162],
      [0.86, 0.108, 0.113],
      [1, 0.098, 0.103],
    ],
    {
      from: [0, 0.07, 0],
      seg: 16,
      rings: 18,
      start: 0,
      end: 0,
      paint: (e, t) =>
        t.y > 0.72 ? $.skin : t.y > 0.42 ? $.skinDark : $.skinHi,
      radial: ee([
        [0.2, 90, 0.14, 50, 0.09],
        [0.64, 270, 0.11, 50, 0.13],
        [0.47, 90, 0.05, 40, -0.05],
        [0.36, 200, 0.1, 45, 0.05],
        [0.36, 340, 0.1, 45, 0.05],
      ]),
      mirror: !0,
      ...r,
    },
  );
  for (let t of [`L`]) {
    let t = ue(0.115, 0.085, 0.105, {
        thick: 0.018,
        lat0: -14,
        seg: 16,
        rings: 6,
        rimR: 0.012,
        innerSeg: 8,
        innerRings: 2,
      }),
      n = {
        at: [0.19, 0.52, 0.095],
        rot: [74, 0, 0],
        bone: `shinL`,
        mirror: !0,
      };
    (e.add(t.outer, { ...n, grad: [$.coralDark, $.coral], ...a, edge: 1.3 }),
      e.add(t.inner, { ...n, color: $.skinDark, ...r }),
      e.add(t.rim, { ...n, color: $.barnacle, ...a }));
  }
  (e.add(
    y(
      [
        { p: [0, 0.07, -0.12], rx: 0.11, rz: 0.075, e: 2.4 },
        { p: [0, 0.08, 0], rx: 0.14, rz: 0.085, e: 2.4 },
        { p: [0, 0.06, 0.16], rx: 0.15, rz: 0.06, e: 2.6 },
        { p: [0, 0.045, 0.24], rx: 0.13, rz: 0.04 },
      ],
      { seg: 14, start: 0.4, end: 0.5, hint: [0, 1, 0] },
    ),
    {
      at: [0.19, 0, 0],
      bone: `footL`,
      grad: [$.skinDark, $.skin],
      mirror: !0,
      ...r,
    },
  ),
    ie(e, [0.19, 0, 0.03], 1, 1.55, {
      bone: `footL`,
      mirror: !0,
      w: 0.098,
      toe: 0.16,
      heel: 0.095,
      soleH: 0.026,
      proud: 0.012,
      stitch: 15,
      toes: `lobes`,
      mat: { grad: [$.skinDark, $.skin], ...r },
      soleMat: { color: `#123026`, ...r, r: 0.9 },
      toeMat: { grad: [$.skinDark, $.skin], ...r },
      nailMat: { color: $.barnacle, ...a },
    }),
    e.add(d(1, 0.03, { seg: 18, tube: 6 }), {
      at: [0.19, 0.2, 0],
      rot: [90, 0, 0],
      scale: [0.12, 0.125, 1],
      bone: `shinL`,
      color: $.rope,
      mirror: !0,
      r: 0.9,
      tex: `wood`,
    }));
  for (let [t, n, r] of [
    [0.06, 0.5, 0.13],
    [-0.02, 0.56, 0.14],
    [0.1, 0.44, 0.1],
  ])
    e.add(k(0.028, 0.03, { seg: 7 }), {
      at: [0.19 + t, n, r],
      rot: [80, 0, 0],
      bone: `shinL`,
      color: $.barnacle,
      mirror: !0,
      ...a,
    });
  te(
    e,
    n,
    [`armL`, `foreL`, `handL`],
    [
      [0, 0.17, 0.17],
      [0.12, 0.19, 0.2],
      [0.35, 0.16, 0.17],
      [0.5, 0.125, 0.13],
      [0.66, 0.16, 0.17],
      [0.9, 0.12, 0.125],
      [1, 0.11, 0.115],
    ],
    {
      from: [0, 0.06, 0],
      seg: 18,
      rings: 18,
      start: 0.3,
      end: 0,
      paint: u,
      radial: ee([
        [0.04, 0, 0.1, 90, 0.12],
        [0.26, 90, 0.11, 50, 0.14],
        [0.24, 270, 0.12, 55, 0.1],
        [0.62, 30, 0.1, 60, 0.12],
        [0.5, 90, 0.035, 40, -0.06],
      ]),
      mirror: !0,
      ...r,
      ...f,
      aoK: 0.7,
    },
  );
  for (let [t, n] of [[1.585, 0.208]])
    se(e, [0.48, t, 0], n, n * 1.03, {
      chain: [`armL`, `foreL`],
      bw: 0.05,
      mirror: !0,
      bead: 0.016,
      seg: 22,
      flare: 0.075,
      flareH: 0.05,
      flareDrop: 0.004,
      studs: 9,
      studR: 0.019,
      studH: 0.013,
      studY: -0.006,
      mat: { grad: [$.shellDark, $.shell], ...o },
      lipMat: { grad: [$.shellDark, $.shell], ...o },
      studMat: { color: $.barnacle, ...a },
    });
  {
    let t = b(
      [
        [1.175, 0.143, 0.15, 2.4],
        [1.205, 0.168, 0.176],
        [1.245, 0.176, 0.184],
        [1.285, 0.168, 0.176],
        [1.315, 0.141, 0.148],
      ],
      {
        seg: 20,
        start: 0,
        end: 0,
        radial: (e, t) => 1 + 0.05 * Math.sin(t * 6 + 1.2),
      },
    );
    (e.add(t, {
      at: [0.48, 0, 0],
      chain: [`armL`, `foreL`],
      bw: 0.045,
      grad: [$.shellDark, $.shell],
      mirror: !0,
      ...o,
      edge: 1.5,
    }),
      se(e, [0.48, 1.245, 0], 0.181, 0.189, {
        chain: [`armL`, `foreL`],
        bw: 0.045,
        mirror: !0,
        bead: 0.011,
        seg: 20,
        studs: 7,
        studR: 0.013,
        studH: 0.009,
        mat: { color: $.barnacle, ...a },
        studMat: { color: $.barnacle, ...a },
      }));
  }
  let A = b(
    [
      [0.9, 0.15, 0.16, 2.4],
      [0.98, 0.18, 0.19, 2.4],
      [1.08, 0.19, 0.2, 2.4],
      [1.16, 0.17, 0.18],
      [1.2, 0.15, 0.16],
    ],
    {
      seg: 20,
      start: `flat`,
      end: `flat`,
      radial: (e, t) =>
        1 +
        0.08 * Math.sin(t * 7 + e * 5) * Math.sin(t * 3 - e * 9) +
        0.05 * Math.sin(t * 13),
    },
  );
  e.add(A, {
    at: [0.48, 0, 0],
    bone: `foreL`,
    grad: [$.coralDark, $.coral],
    ...a,
  });
  for (let t = 0; t < 5; t++) {
    let n = (t / 5) * Math.PI * 1.4 - 0.3 + (S(t * 6.1) - 0.5) * 0.24,
      r = [0.48 + Math.cos(n) * 0.19, 1.02 + S(t) * 0.14, Math.sin(n) * 0.2],
      i = 0.085 * (0.72 + 0.56 * S(t * 2.9 + 0.8)),
      o = 0.018 * (0.8 + 0.42 * S(t * 8.3 + 3.1)),
      s = [
        Math.cos(n) * 0.7 + (S(t * 3.3) - 0.5) * 0.3,
        0.55 + (S(t * 5.7) - 0.5) * 0.3,
        Math.sin(n) * 0.7,
      ];
    e.add(
      j(
        [
          r,
          [
            r[0] + s[0] * i * 0.55,
            r[1] + s[1] * i * 0.55,
            r[2] + s[2] * i * 0.55,
          ],
          [r[0] + s[0] * i + 0.01, r[1] + s[1] * i * 1.15, r[2] + s[2] * i],
        ],
        (e) => o * (1 - e * 0.6),
        { seg: 6, samples: 6 },
      ),
      {
        bone: `foreL`,
        grad: [$.coralDark, $.coralHi],
        ...a,
        emit: $.aqua,
        ei: 1.5,
        emitFn: (e, t) => M(0.6, 1, (t.y - r[1]) / 0.1),
      },
    );
  }
  for (let t = 0; t < 5; t++)
    e.add(d(1, 0.022, { seg: 10, tube: 6 }), {
      at: [-0.48, 0.92 + t * 0.07, 0],
      rot: [90, t * 40, 0],
      scale: [0.165, 0.175, 1],
      bone: `foreR`,
      grad: [$.iron, $.ironHi],
      ...s,
    });
  (e.add(
    b(
      [
        [1.445, 0.208, 0.213],
        [1.47, 0.216, 0.221],
        [1.575, 0.221, 0.226],
        [1.598, 0.212, 0.217],
      ],
      { seg: 20, start: 0, end: 0, radial: W(5, 0.018, 1, 0, 1) },
    ),
    {
      at: [0.48, 0, 0],
      bone: `armL`,
      grad: [R, L],
      gradEase: !0,
      teamFn: (e) => 0.6 * M(1.444, 1.46, e.y) * (1 - M(1.586, 1.6, e.y)),
      r: 0.7,
      tex: `cloth`,
      detail: 0.5,
    },
  ),
    re(e, [0.48, 0.84, 0.02], 1, 1.75, {
      bone: `handL`,
      curl: 0.55,
      thumb: 0.45,
      fat: 1.2,
      mat: { grad: [$.skinDark, $.skin], ...r },
      nail: $.barnacle,
      webbed: { opts: { color: $.skinHi, ...r } },
      cuff: {
        studs: 5,
        flare: 0.16,
        mat: {
          paint: (e) => (Math.sin(e.y * 90) > 0 ? $.rope : $.ropeDark),
          r: 0.9,
          detail: 0.9,
          tex: `wood`,
        },
        studMat: { color: $.barnacle, r: 0.8, detail: 1, tex: `coral` },
      },
    }),
    re(e, [-0.48, 0.84, 0.02], -1, 1.75, {
      bone: `handR`,
      curl: 0.95,
      thumb: 0.9,
      fat: 1.2,
      mat: { grad: [$.skinDark, $.skin], ...r },
      nail: $.barnacle,
      cuff: {
        studs: 5,
        flare: 0.16,
        mat: {
          paint: (e) => (Math.sin(e.y * 90) > 0 ? $.rope : $.ropeDark),
          r: 0.9,
          detail: 0.9,
          tex: `wood`,
        },
        studMat: { color: $.barnacle, r: 0.8, detail: 1, tex: `coral` },
      },
    }));
  let P = () => [
      [l(`clavL`), 0.5],
      [l(`armL`), 0.5],
    ],
    F = ue(0.233, 0.1, 0.216, {
      thick: 0.033,
      lat0: -18,
      seg: 28,
      rings: 8,
      rimR: 0.03,
      e: 2.3,
      radial: (e, t) =>
        1 +
        0.1 * Math.sin(t * 5 + 0.7) * Math.cos(t * 3 + 1) +
        0.18 * Math.exp(-((m(t, 0) / 0.6) ** 2)) +
        0.06 * Math.sin(t * 11 + e * 6),
    }),
    I = { at: [0.505, 1.685, 0.02], rot: [0, 0, -18], skin: P };
  (e.add(F.outer, {
    ...I,
    grad: [$.coralDark, $.coral],
    teamFn: (e) => M(0.111, 0.138, e.y) * 0.35,
    ...a,
    edge: 1.3,
  }),
    e.add(F.inner, { ...I, color: $.coralDark, ...a }),
    e.add(F.rim, {
      ...I,
      grad: [R, L],
      gradEase: !0,
      teamFn: (e) => 0.6 * M(-0.02, 0.06, e.z + e.x * 0.3),
      r: 0.7,
      tex: `cloth`,
      detail: 0.5,
    }));
  let z = (t, n, r, i, o, s) => {
    let c = [t[0] + n[0] * r, t[1] + n[1] * r, t[2] + n[2] * r],
      l = [
        t[0] + n[0] * r * 0.5 + Math.sin(s * 7) * 0.025,
        t[1] + n[1] * r * 0.5,
        t[2] + n[2] * r * 0.5 + Math.cos(s * 5) * 0.025,
      ];
    if (
      (e.add(
        j(
          [t, l, c],
          (e) => i * (1 - e * 0.6) * (1 + 0.15 * Math.sin(e * 17 + s)),
          { seg: 7, samples: 7, end: 0.9 },
        ),
        {
          skin: P,
          grad: [$.coralDark, $.coralHi],
          ...a,
          emit: $.aqua,
          ei: 1.6,
          emitFn: (e) =>
            M(c[1] - 0.06, c[1] + 0.005, e.y) * (o === 0 ? 1 : 0.2),
        },
      ),
      o > 0)
    )
      for (let e of [-1, 1]) {
        let t = [
            n[0] + e * 0.5 * Math.cos(s),
            n[1] * 0.85 + 0.15,
            n[2] + e * 0.5 * Math.sin(s),
          ],
          a = Math.hypot(...t);
        z(
          l,
          t.map((e) => e / a),
          r * 0.62,
          i * 0.62,
          o - 1,
          s * 1.7 + e,
        );
      }
    else e.glowCard(`clavL`, c, 0.1, $.aqua, 0.45);
  };
  (z([0.565, 1.8, 0.02], [0.52, 0.83, -0.12], 0.25, 0.046, 2, 1.1),
    z([0.455, 1.82, -0.08], [-0.05, 0.9, -0.42], 0.22, 0.042, 1, 2.3),
    z([0.51, 1.78, 0.13], [0.34, 0.82, 0.44], 0.19, 0.037, 1, 3.7),
    z([0.655, 1.73, -0.06], [0.86, 0.45, -0.2], 0.21, 0.042, 1, 4.9));
  for (let [t, n] of [
    [0.68, 0.1],
    [0.61, -0.14],
    [0.41, 0.15],
    [0.545, 0.2],
  ])
    e.add(k(0.033, 0.033, { seg: 7 }), {
      at: [t, 1.735, n],
      rot: [0, 0, -50],
      skin: P,
      color: $.barnacle,
      ...a,
    });
  let B = T(C, 0.05, { bevel: 0.02 });
  _(B, (e) => {
    let t = Math.atan2(e.y + 0.06, e.x);
    e.z += Math.abs(Math.sin(t * 9)) * 0.03;
  });
  let V = () => [
      [l(`clavR`), 0.5],
      [l(`armR`), 0.5],
    ],
    ae = {
      at: [-0.55, 1.795, -0.01],
      rot: [-104, 0, 104],
      scale: 1.22,
      skin: V,
    };
  e.add(B, {
    ...ae,
    paint: E,
    teamFn: (e) => 0.45 * M(0.175, 0.235, Math.hypot(e.x, e.y + 0.06)),
    ...o,
    edge: 1.4,
  });
  let oe = [];
  for (let e = 0; e <= 18; e++) {
    let t = Math.PI * (0.05 + (0.9 * e) / 18);
    oe.push([Math.cos(t) * 0.3, Math.sin(t) * 0.3 - 0.06, 0]);
  }
  (e.add(j(oe, 0.022, { seg: 6, samples: 30 }), {
    ...ae,
    grad: [R, L],
    gradEase: !0,
    teamFn: (e) => 0.6 * M(-0.02, 0.05, e.y + 0.06),
    r: 0.6,
    tex: `cloth`,
    detail: 0.4,
  }),
    e.add(
      v(0.225, 0.115, 0.215, {
        e: 2.2,
        fn: (e) => {
          e.y < 0 && (e.y *= 0.3);
        },
      }),
      {
        at: [-0.49, 1.665, 0],
        rot: [0, 0, 18],
        skin: V,
        grad: [$.skinDark, $.skin],
        ...r,
      },
    ));
  let ce = pe(pt, {
      ...fe.heroic,
      brow: 0.08,
      browY: 0.3,
      browS: 0.16,
      socket: 0.08,
      eyeX: 0.45,
      eyeY: 0.06,
      nose: 0.07,
      noseW: 0.34,
      alae: 0.035,
      bridge: 0.015,
      noseY: -0.3,
      cheek: 0.09,
      hollow: 0,
      mouthY: -0.58,
      muzzle: 0.09,
      lipU: 0,
      lipL: 0,
      crease: 0,
      chin: 0.02,
      jawCorner: 0.1,
    }),
    le = _e(ce, {
      skin: $.skinHi,
      skinDark: $.skinDark,
      blush: `#6fb3b0`,
      lip: `#2b6a66`,
      shade: `#16463f`,
      mouth: `#0a2226`,
      lips: !1,
    }),
    H = (e) => {
      let t = le(e),
        n = M(0.02, 0.1, e.y) * M(0.06, -0.1, e.z);
      return n > 0.01 ? t.clone().lerp(vt, Math.min(0.68, n * 0.78)) : t;
    },
    U = { ...r, detail: 0.3, shade: 0, edge: 0, aoK: 1 };
  e.add(ce.geo, { at: ft, bone: `head`, paint: H, ...U });
  let de = e.lastPhase;
  ve(
    e,
    ce,
    ft,
    {
      iris: `#28bccc`,
      irisHi: `#c8fbff`,
      pupil: `#06161a`,
      glow: $.aqua,
      ei: 1.4,
      white: `#d4ece2`,
      lash: `#0c2328`,
      brow: null,
      lower: `#1e5040`,
      lid: `#2a6a58`,
      eyeW: 0.3,
      eyeH: 0.17,
      irisK: 0.9,
      pupilAspect: 1.9,
      tilt: 2,
      look: 0.02,
      catch: 1.6,
      lashT: 0.12,
      mat: U,
      uvPhase: de,
    },
    H,
  );
  {
    let t = ce.S.mouthY,
      n = new i(`#0b2a2a`),
      r = new i(`#1c4a42`),
      a = new i($.skinHi).multiplyScalar(1.12);
    ge(
      e,
      ce,
      ft,
      {
        e0: t - 0.24,
        e1: t + 0.2,
        q0: -0.8,
        q1: 0.8,
        nu: 64,
        nv: 36,
        mat: U,
        uvPhase: de,
        fn: (e, i, o) => {
          let s = Math.abs(i) / 0.56,
            c = M(1, 0.8, s),
            l = e - (t + 0.05 * s * s * s);
          return (
            o.lerp(a, 0.28 * Math.exp(-((l - 0.07) ** 2) / 0.0012) * c),
            o.lerp(r, 0.35 * Math.exp(-((l + 0.07) ** 2) / 0.0025) * c),
            o.lerp(n, 0.92 * Math.exp(-(l * l) / 6e-4) * c),
            o
          );
        },
      },
      H,
    );
  }
  for (let t of [1, -1])
    e.glowCard(`head`, [t * 0.066, 2.178, 0.372], 0.068, $.aqua, 0.55);
  (e.add(
    b(
      [
        [2.055, 0.168, 0.152, 2.3],
        [2.105, 0.176, 0.16],
        [2.145, 0.166, 0.15],
      ],
      { seg: 20, start: 0, end: 0, arc: [155, 385] },
    ),
    {
      at: [0, 0, 0.09],
      chain: [`neck`, `head`],
      bw: 0.05,
      color: $.skinDark,
      ...r,
      edge: 1.2,
    },
  ),
    e.add(
      y(
        [
          { p: [0, 1.74, -0.05], rx: 0.33, rz: 0.2, e: 2.6 },
          { p: [0, 1.84, -0.02], rx: 0.26, rz: 0.17, e: 2.6 },
          { p: [0, 1.92, 0.03], rx: 0.17, rz: 0.13, e: 2.4 },
        ],
        { seg: 20, arc: [160, 380], start: 0, end: 0 },
      ),
      { chain: [`chest`, `neck`], bw: 0.06, color: `#174033`, ...r, edge: 1.2 },
    ));
  {
    let t = [];
    for (let e = 0; e <= 26; e++) {
      let n = (p(140, 400, e / 26) * Math.PI) / 180,
        r = 1 + 0.07 * Math.sin(e * 1.55);
      t.push([
        Math.cos(n) * 0.205 * r,
        1.955 + 0.014 * Math.sin(e * 1.55),
        Math.sin(n) * 0.19 * r + 0.09,
      ]);
    }
    (e.add(
      j(t, (e) => 0.062 * (0.8 + 0.2 * Math.sin(Math.PI * e)), {
        seg: 7,
        samples: 32,
        rz: () => 0.032,
        hint: [0, 1, 0],
      }),
      {
        chain: [`neck`, `head`],
        bw: 0.05,
        grad: [`#5a5e63`, `#6c7075`],
        gradEase: !0,
        team: 1,
        r: 0.7,
        tex: `cloth`,
        detail: 0.5,
      },
    ),
      e.add(
        j(
          t.map((e) => [e[0] * 1.02, e[1] + 0.05, e[2]]),
          0.013,
          { seg: 5, samples: 32 },
        ),
        { chain: [`neck`, `head`], bw: 0.05, color: $.barnacle, ...a },
      ),
      e.add(
        y(
          [
            { p: [0, 1.72, 0.05], rx: 0.435, rz: 0.295, e: 2.6 },
            { p: [0, 1.84, 0.1], rx: 0.35, rz: 0.25, e: 2.6 },
            { p: [0, 1.925, 0.14], rx: 0.225, rz: 0.185, e: 2.5 },
          ],
          {
            seg: 26,
            arc: [-126, 126],
            start: 0,
            end: 0,
            radial: W(6, 0.03, 1.1, 0, 1),
          },
        ),
        {
          chain: [`chest`, `neck`],
          bw: 0.07,
          grad: [`#5a5e63`, `#6c7075`],
          gradEase: !0,
          teamFn: (e) => 0.55 * M(1.755, 1.8, e.y),
          r: 0.7,
          tex: `cloth`,
          detail: 0.5,
          edge: 1.3,
        },
      ));
    for (let t = 0; t < 7; t++) {
      let n = (p(155, 385, t / 6) * Math.PI) / 180;
      e.add(v(0.024, 0.017, 0.024, { rings: 5, seg: 11 }), {
        chain: [`neck`, `head`],
        bw: 0.05,
        at: [Math.cos(n) * 0.216, 1.966, Math.sin(n) * 0.201 + 0.09],
        grad: [$.shellDark, $.shell],
        ...o,
      });
    }
  }
  for (let t of [1, -1]) {
    let n = [t * 0.165, 2.11, 0.1],
      i = T(
        [
          [0, 0.02],
          [0.07, 0.07],
          [0.13, 0.1],
          [0.17, 0.03],
          [0.15, -0.04],
          [0.08, -0.07],
          [0.01, -0.05],
        ],
        0.012,
        { bevel: 0.005, curveSeg: 4 },
      );
    (_(i, (e) => {
      e.z +=
        Math.sin(Math.atan2(e.y, e.x) * 5) *
        0.012 *
        Math.min(1, Math.hypot(e.x, e.y) / 0.1);
    }),
      e.add(i, {
        at: n,
        rot: [0, t > 0 ? -40 : 220, t * 12],
        bone: `head`,
        grad: [$.skinDark, $.skinHi],
        ...r,
        emit: $.aqua,
        ei: 0.25,
        emitFn: (e) => M(0.08, 0.17, Math.hypot(e.x, e.y)),
      }));
    for (let i of [0.9, 0.4, -0.2])
      e.add(
        j(
          [
            [0, 0, 0],
            [Math.cos(i) * 0.1, Math.sin(i) * 0.1, 0.004],
            [Math.cos(i) * 0.165, Math.sin(i) * 0.14 + 0.01, 0.006],
          ],
          (e) => 0.009 * (1 - e * 0.7),
          { seg: 5, samples: 5 },
        ),
        {
          at: n,
          rot: [0, t > 0 ? -40 : 220, t * 12],
          bone: `head`,
          color: $.skinDark,
          ...r,
        },
      );
  }
  for (let [t, n, r] of [
    [0, 0.05, [0, 1, -0.15]],
    [0.075, -0.01, [0.4, 0.9, -0.3]],
    [-0.075, -0.01, [-0.4, 0.9, -0.3]],
  ]) {
    let i = [t, 2.21, n + 0.08],
      o = (Math.atan2(r[0], r[2]) * 180) / Math.PI,
      s = (-Math.asin(r[1] / Math.hypot(r[0], r[1], r[2])) * 180) / Math.PI;
    (e.add(d(1, 0.0125, { seg: 14, tube: 6 }), {
      at: [i[0] + r[0] * 0.012, i[1] + r[1] * 0.012, i[2] + r[2] * 0.012],
      rot: [s + 90, o, 0],
      order: `YXZ`,
      scale: [0.036, 0.036, 1],
      bone: `head`,
      grad: [$.coralDark, $.coral],
      ...a,
      edge: 1.4,
    }),
      e.add(
        j(
          [
            i,
            [i[0] + r[0] * 0.08, i[1] + r[1] * 0.08, i[2] + r[2] * 0.08],
            [i[0] + r[0] * 0.16, i[1] + r[1] * 0.16, i[2] + r[2] * 0.16],
          ],
          (e) => 0.025 * (1 - e * 0.6),
          { seg: 7 },
        ),
        {
          bone: `head`,
          grad: [$.coralDark, $.coralHi],
          ...a,
          emit: $.aqua,
          ei: 1.2,
          emitFn: (e) => M(2.33, 2.3699999999999997, e.y),
        },
      ));
  }
  let G = [`beard1`, `beard2`, `beard3`];
  [
    [-0.08, 0.3, 1.35, 0.9],
    [-0.03, 0.4, 0.62, -1.5],
    [0.02, 0.46, 1.1, 0.35],
    [0.07, 0.34, 0.8, 1.7],
    [0.11, 0.24, 1.4, -0.6],
    [-0.115, 0.23, 0.72, -0.25],
  ].forEach(([t, n, r, i], a) => {
    let o = n * (0.78 + 0.44 * S(a * 3.7 + 0.3)),
      s = 0.032 * r * (0.9 + 0.2 * S(a * 5.1 + 1.7)),
      l = (S(a * 9.3 + 2.4) - 0.5) * 0.09,
      u = (S(a * 4.7 + 5.2) - 0.5) * 0.05,
      d = i * 0.085,
      f = 60 + 70 * S(a * 7.9),
      p = t * 1.25,
      m = 2.04;
    e.add(
      j(
        [
          [p, m, 0.27],
          [
            p * 1.1 + l * 0.4 + d * 0.25,
            1.96,
            0.3 + u * 0.4 + Math.abs(d) * 0.3,
          ],
          [p * 1.2 + l + d, m - o * 0.6, 0.31 + u + d * 0.35],
          [p * 1.1 + l * 1.3 + d * 1.5, m - o, 0.29 + u * 1.2 + d * 0.7],
        ],
        (e) => s * (1 - e * (0.55 + 0.3 * S(a * 2.3 + 8.1))),
        {
          seg: 7,
          samples: 11,
          twist: (e) => e * f * (a % 2 ? 1 : -1),
          radial: (e, t) =>
            1 - 0.08 * Math.abs(Math.sin(t * 3 + e * 3.1 + a)) ** 0.6,
        },
      ),
      { chain: G, bw: 0.08, grad: [$.kelp, $.kelpHi], ...c, tex: `hair` },
    );
  });
  let K = n.bindPos(`anchorR`),
    q = (e, t, n) => [K.x + e, K.y + t, K.z + n],
    me = { bone: `anchorR` };
  (e.add(d(0.09, 0.03, { seg: 16, tube: 7 }), {
    ...me,
    at: q(0, 0.12, 0),
    rot: [0, 90, 0],
    grad: [$.iron, $.ironHi],
    ...s,
  }),
    e.add(
      j([q(0, 0.03, 0), q(0, -1.05, 0)], (e) => 0.055 - e * 0.012, {
        seg: 10,
        curve: !1,
      }),
      { ...me, grad: [$.iron, $.ironHi], gradAxis: `y`, ...s },
    ),
    e.add(
      j([q(-0.3, -0.12, 0), q(0.3, -0.12, 0)], 0.035, {
        seg: 8,
        curve: !1,
        start: 0.8,
        end: 0.8,
      }),
      { ...me, grad: [$.iron, $.verdigris], gradAxis: `x`, ...s },
    ));
  let he = [];
  for (let e = 0; e <= 14; e++) {
    let t = Math.PI * (1.1 + (0.8 * e) / 14);
    he.push(q(0, -0.72 + Math.sin(t) * 0.42 + 0, Math.cos(t) * 0.46));
  }
  e.add(
    j(he, (e) => 0.065 * (0.75 + 0.25 * Math.sin(Math.PI * e)), {
      seg: 10,
      curve: !1,
      rz: (e) => 0.05,
    }),
    { ...me, grad: [$.iron, $.verdigris], gradAxis: `y`, ...s },
  );
  for (let t of [1, -1]) {
    let n = q(
        0,
        -0.72 + Math.sin(Math.PI * (t > 0 ? 1.9 : 1.1)) * 0.42,
        Math.cos(Math.PI * (t > 0 ? 1.9 : 1.1)) * 0.46,
      ),
      r = T(
        [
          [0, -0.1],
          [0.2, 0.02],
          [0.02, 0.2],
          [-0.08, 0.06],
        ],
        0.05,
        { bevel: 0.02 },
      );
    e.add(r, {
      ...me,
      at: n,
      rot: [t > 0 ? -30 : 210, 90, 0],
      grad: [$.iron, $.verdigris],
      ...s,
      edge: 1.5,
    });
  }
  e.add(v(0.08, 0.06, 0.08), {
    ...me,
    at: q(0, -1.1, 0),
    grad: [$.iron, $.ironHi],
    ...s,
  });
  for (let [t, n] of [
    [0.02, 0.062],
    [-0.115, 0.058],
    [-0.7, 0.072],
  ])
    se(e, q(0, t, 0), n, n, {
      ...me,
      bead: 0.011,
      seg: 14,
      studs: 5,
      studR: 0.013,
      studH: 0.009,
      tilt: 90,
      mat: { color: $.ironHi, ...s },
      studMat: { color: $.verdigris, ...s },
    });
  for (let [t, n] of [
    [-0.3, 1],
    [-0.5, -1],
    [-0.7, 1],
  ])
    ne(
      e,
      [
        q(n * 0.056, t + 0.07, -0.02),
        q(n * 0.058, t, 0),
        q(n * 0.056, t - 0.07, 0.02),
      ],
      0.016,
      $.aqua,
      {
        ...me,
        emit: $.aqua,
        ei: 2.2,
        hint: [1, 0, 0],
        thick: 0.006,
        curve: !1,
      },
    );
  for (let [t, n] of [
    [-0.4, 0.05],
    [-0.85, -0.03],
    [-0.9, 0.06],
  ])
    e.add(k(0.03, 0.03, { seg: 7 }), {
      ...me,
      at: q(0.05, t, n),
      rot: [0, 0, -90],
      color: $.barnacle,
      ...a,
    });
  e.glowCard(`anchorR`, q(0, -0.5, 0), 0.4, $.aqua, 0.28, { stretch: 2.2 });
  for (let t = 0; t < 4; t++)
    e.add(d(0.035, 0.012, { seg: 10, tube: 5 }), {
      ...me,
      at: q(0, 0.22 + t * 0.06, 0.03 * Math.sin(t)),
      rot: [0, t % 2 ? 90 : 0, 0],
      grad: [$.iron, $.ironHi],
      ...s,
    });
}
var bt = (e, t, n, r = 0, i = 0, a = 0) => ({
    wIK: 1,
    wX: e,
    wY: t,
    wZ: n,
    wRX: r,
    wRY: i,
    wRZ: a,
  }),
  xt = {
    stance: {
      hipT: [0, -0.06, 0],
      hips: [6, 6, 0],
      spine: [14, -2, 0],
      chest: [8, -4, 0],
      neck: [-20, 4, 0],
      head: [-10, 4, 0],
      armL: [-14, 0, 12],
      foreL: [-24, 0, 0],
      handL: [0, 0, 0],
      armR: [-10, 0, -14],
      foreR: [-30, 0, 0],
      ...bt(-0.62, 1.2, 0.3, 14, -10, 8),
      footL: [0.1, 0, 0.12, 0],
      footR: [-0.1, 0, -0.08, 0],
      kelpFL1: [4, 0, 0],
      kelpFR1: [4, 0, 0],
      kelpBL1: [-4, 0, 0],
      kelpBR1: [-4, 0, 0],
      beard1: [-6, 0, 0],
    },
    idle: {},
    splash: {
      hipT: [-0.03, -0.07, 0],
      hips: [4, 18, 4],
      spine: [10, -4, -2],
      chest: [4, -10, -2],
      neck: [-18, 6, 0],
      head: [-14, 8, -4],
      armL: [-30, 30, 58],
      foreL: [-60, 0, 0],
      handL: [0, 0, 30],
      ...bt(-0.6, 1.25, 0.3, 4, -10, 4),
      footL: [0.13, 0, 0.16, 0],
      footR: [-0.1, 0, -0.1, 14],
    },
    run: {
      hipT: [0, -0.07, 0],
      hips: [2, 0, 0],
      spine: [13, 0, 0],
      chest: [5, 0, 0],
      neck: [-14, 0, 0],
      head: [-8, 0, 0],
      armL: [-10, 0, 16],
      foreL: [-40, 0, 0],
      ...bt(-0.55, 1.05, -0.12, 60, -8, 10),
      footL: [0, 0, 0, 0],
      footR: [0, 0, 0, 0],
    },
    aWind: {
      hipT: [0, -0.12, -0.02],
      hips: [4, -24, 0],
      spine: [10, -16, 0],
      chest: [4, -26, 0],
      neck: [-18, 22, 0],
      head: [-8, 20, 0],
      ...bt(-0.8, 1.45, -0.45, 20, -130, -70),
      armL: [-40, 0, 40],
      foreL: [-60, 0, 0],
      footL: [0.12, 0, 0.2, 0],
      footR: [-0.12, 0, -0.14, 0],
    },
    aStrike: {
      extends: `aWind`,
      hipT: [0, -0.18, 0.08],
      hips: [10, 26, 0],
      spine: [16, 16, 0],
      chest: [10, 28, 0],
      neck: [-22, -24, 0],
      head: [-10, -22, 0],
      ...bt(0.1, 1.2, 0.95, 10, 70, -90),
      armL: [-10, 0, 20],
      trail: 1,
    },
    aFollow: {
      extends: `aStrike`,
      chest: [10, 34, 0],
      ...bt(0.55, 1.15, 0.6, 10, 120, -90),
      trail: 0,
    },
    bWind: {
      hipT: [0, -0.06, -0.04],
      hips: [-4, 0, 0],
      spine: [-6, 0, 0],
      chest: [-14, 0, 0],
      neck: [-6, 0, 0],
      head: [6, 0, 0],
      ...bt(-0.1, 2.35, -0.25, -150, 0, 0),
      ikL: 1,
      footL: [0.14, 0, 0.18, 0],
      footR: [-0.14, 0, -0.12, 0],
    },
    bStrike: {
      extends: `bWind`,
      hipT: [0, -0.3, 0.1],
      hips: [18, 0, 0],
      spine: [24, 0, 0],
      chest: [16, 0, 0],
      neck: [-34, 0, 0],
      head: [-16, 0, 0],
      ...bt(-0.05, 0.9, 1, -30, 0, 0),
      trail: 1,
    },
    bFollow: {
      extends: `bStrike`,
      ...bt(-0.05, 0.75, 1.05, -20, 0, 0),
      trail: 0,
    },
    qWind: {
      extends: `aWind`,
      ...bt(-0.7, 1.7, -0.6, -60, -160, -40),
      chest: [-4, -34, 0],
    },
    qThrow: {
      extends: `aStrike`,
      ...bt(-0.15, 1.45, 1.05, -80, 0, 0),
      chest: [14, 18, 0],
      armL: [30, 0, 30],
      trail: 1,
      emit: 1,
    },
    wRoar: {
      hipT: [0, -0.16, 0],
      spine: [-6, 0, 0],
      chest: [-16, 0, 0],
      neck: [0, 0, 0],
      head: [-26, 0, 0],
      armL: [-50, 0, 60],
      foreL: [-90, -20, 0],
      ...bt(-0.55, 0.95, 0.55, 10, 0, 0),
      footL: [0.18, 0, 0.06, 0],
      footR: [-0.18, 0, -0.06, 0],
      emit: 1.6,
    },
    eStomp: {
      hipT: [0, -0.36, 0.06],
      hips: [20, 0, 0],
      spine: [26, 0, 0],
      chest: [16, 0, 0],
      neck: [-30, 0, 0],
      head: [-10, 0, 0],
      armL: [-60, 0, 24],
      foreL: [-10, 0, 0],
      ...bt(-0.62, 1.05, 0.5, 30, -10, 10),
      footL: [0.16, 0, 0.2, 0],
      footR: [-0.16, 0, -0.14, 0],
      emit: 1.4,
    },
    eLift: {
      extends: `eStomp`,
      hipT: [0, -0.12, 0],
      armL: [-100, 0, 30],
      foreL: [-60, 0, 0],
      footL: [0.16, 0.2, 0.2, 10],
      emit: 0.8,
    },
    rRaise: {
      extends: `bWind`,
      hipT: [0, -0.16, -0.08],
      spine: [-14, 0, 0],
      chest: [-20, 0, 0],
      head: [16, 0, 0],
      ...bt(0, 2.55, -0.35, -170, 0, 0),
      emit: 1.2,
    },
    rSmash: {
      extends: `bStrike`,
      hipT: [0, -0.42, 0.18],
      spine: [32, 0, 0],
      chest: [22, 0, 0],
      ...bt(0, 0.7, 1.2, -10, 0, 0),
      emit: 2.2,
      trail: 1,
      footL: [0.16, 0, 0.34, 0],
      footR: [-0.16, 0, -0.26, 0],
    },
    recall: {
      hipT: [0, -0.4, -0.06],
      spine: [16, 0, 0],
      chest: [8, 0, 0],
      neck: [0, 0, 0],
      head: [18, 0, 0],
      ...bt(-0.1, 1.3, 0.45, 0, 90, 0),
      ikL: 1,
      footL: [0.14, 0, 0.24, 0],
      footR: [-0.14, 0.2, -0.3, 70],
      emit: 0.8,
    },
    stun: {
      hipT: [0, -0.1, -0.06],
      spine: [26, 0, 0],
      chest: [12, 0, 0],
      neck: [10, 0, 0],
      head: [24, 0, 0],
      armL: [4, 0, 10],
      foreL: [-14, 0, 0],
      ...bt(-0.56, 0.9, 0.2, 40, 0, 20),
    },
    air: {
      spine: [-6, 0, 0],
      chest: [-5, 0, 0],
      head: [10, 0, 0],
      armL: [-120, 0, 60],
      foreL: [-30, 0, 0],
      armR: [-100, 0, -60],
      foreR: [-30, 0, 0],
      wIK: 0,
      footL: [0.05, 0.28, 0.1, 30],
      footR: [-0.05, 0.08, -0.2, -20],
    },
    flinch: {
      extends: null,
      hipT: [0, -0.02, -0.05],
      spine: [-6, 0, 0],
      chest: [-8, 0, 0],
      head: [12, 0, 0],
    },
    deathA: {
      spine: [-16, 0, 0],
      chest: [-18, 0, 0],
      head: [30, 0, 0],
      armL: [-40, 0, 50],
      armR: [-40, 0, -50],
      wIK: 0,
    },
    deathB: {
      extends: `deathA`,
      hipT: [0, -0.46, 0],
      spine: [30, 0, 0],
      chest: [20, 0, 0],
      head: [20, 0, 0],
      footL: [0.12, 0, 0.26, 0],
      footR: [-0.12, 0, 0.2, 0],
      armL: [10, 0, 20],
      armR: [10, 0, -20],
    },
    deathC: {
      extends: `deathB`,
      root: [-82, 0, 12],
      rootT: [0, 0.3, 0.66],
      hipT: [0, -0.3, 0],
      hips: [10, 0, 0],
      spine: [4, 0, 0],
      chest: [0, 0, 0],
      neck: [-30, -40, 0],
      head: [-20, -30, 0],
      armL: [-160, 0, 40],
      foreL: [-20, 0, 0],
      armR: [-30, 0, -40],
      foreR: [-40, 0, 0],
      footL: [0.16, 0.1, 0.1, -40],
      footR: [-0.12, 0.2, 0, -50],
    },
  },
  St = (e, t) => ({
    bones: [1, 2, 3].map((t) => `kelp${e}${t}`),
    tip: [0, -0.16, 0],
    stiffRoot: 0.4,
    stiffTip: 0.05,
    drag: 2.4,
    gravity: 1,
    hang: 0.55,
    maxAngle: e[0] === `F` ? 26 : 32,
    flutter: 0.6,
    freq: 5 + t * 0.8,
    phase: t * 1.9,
    collide: [`thighL`, `thighR`, `shinL`, `shinR`],
    plane: { bone: `hips`, n: [0, 0, e[0] === `F` ? 1 : -1], d: 0.2 },
  }),
  Ct = {
    brannoc: ke,
    sable: Ue,
    morrow: et,
    vyre: ut,
    oru: {
      id: `oru`,
      height: 2.3,
      element: `#39d0e0`,
      rim: `#c8fbff`,
      proportions: dt,
      bones: _t,
      build: yt,
      poses: xt,
      kneeOut: 0.35,
      elbowPole: [0.7, -0.4, -0.55],
      aimBone: `anchorR`,
      grips: { L: { bone: `anchorR`, p: [0, -0.28, 0] } },
      anchors: {
        weapon: { bone: `anchorR`, p: [0, -0.9, 0] },
        muzzle: { bone: `anchorR`, p: [0, -0.6, 0] },
        head: { bone: `head`, p: [0, 0.14, 0.12] },
        chest: { bone: `chest`, p: [0, 0.14, 0.3] },
      },
      trails: [
        { bone: `anchorR`, a: [0, -0.5, 0], b: [0, -1.1, 0], color: `#39d0e0` },
      ],
      portrait: {
        yaw: 0.3,
        props: [`anchorR`],
        rim: `#39d0e0`,
        fill: 1.1,
        extra: 0.12,
      },
      colliders: {
        hips: { bone: `hips`, a: [-0.18, 0, 0], b: [0.18, 0, 0], r: 0.25 },
        thighL: { bone: `thighL`, a: [0, 0, 0], b: [0, -0.4, 0], r: 0.2 },
        thighR: { bone: `thighR`, a: [0, 0, 0], b: [0, -0.4, 0], r: 0.2 },
        shinL: { bone: `shinL`, a: [0, 0, 0], b: [0, -0.4, 0], r: 0.15 },
        shinR: { bone: `shinR`, a: [0, 0, 0], b: [0, -0.4, 0], r: 0.15 },
        chest: { bone: `chest`, a: [0, 0.1, 0.1], b: [0, 0.35, 0.1], r: 0.3 },
      },
      anim: {
        run: {
          stride: 2,
          lift: 0.22,
          bob: 0.135,
          twist: 11,
          roll: 7,
          headLead: 0.3,
          armL: 34,
          armR: 0,
        },
        center: 1,
        airHeight: 1,
        airTumble: 24,
        attackFollow: 0.16,
        attackHold: 0.12,
        breath: 4.2,
        attacks: [
          { wind: `aWind`, strike: `aStrike`, follow: `aFollow` },
          { wind: `bWind`, strike: `bStrike`, follow: `bFollow` },
        ],
        casts: {
          Q: {
            keys: [
              [0, `qWind`],
              [0.14, `qWind`, `o`],
              [0.26, `qThrow`, `i`],
              [0.5, `qThrow`],
            ],
            len: 0.5,
            out: 0.35,
          },
          W: {
            keys: [
              [0, `stance`],
              [0.18, `wRoar`, `o`],
              [0.6, `wRoar`],
            ],
            len: 0.6,
            out: 0.35,
          },
          E: {
            keys: [
              [0, `stance`],
              [0.1, `eLift`, `o`],
              [0.2, `eStomp`, `i`],
              [0.5, `eStomp`],
            ],
            len: 0.5,
            out: 0.3,
          },
          R: {
            keys: [
              [0, `stance`],
              [0.25, `rRaise`, `o`],
              [0.42, `rRaise`],
              [0.52, `rSmash`, `i`],
              [0.95, `rSmash`],
            ],
            len: 0.95,
            out: 0.4,
          },
          spell: { keys: [[0, `stance`]], len: 0.05, out: 0.1, upper: !0 },
        },
        dash: { default: { keys: [[0, `run`]] } },
        recall: {
          keys: [
            [0, `stance`],
            [0.5, `recall`, `o`],
          ],
        },
        death: {
          keys: [
            [0, `deathA`],
            [0.1, `deathA`, `o`],
            [0.36, `deathB`, `i`],
            [0.68, `deathC`, `i`],
          ],
        },
        cloth: [
          ...gt.map(([e], t) => St(e, t)),
          {
            bones: [`beard1`, `beard2`, `beard3`],
            tip: [0, -0.1, 0],
            stiffRoot: 0.45,
            stiffTip: 0.08,
            drag: 2.6,
            hang: 0.5,
            maxAngle: 26,
            flutter: 0.5,
            freq: 4,
            collide: [`chest`],
          },
        ],
        chains: [],
      },
    },
  },
  wt = 0.5,
  Tt = new Map();
function Et(e) {
  if (Tt.has(e)) return Tt.get(e);
  let t = Ct[e] || Ct.vyre,
    n = t.proportions,
    r = new I(t.bones(n)),
    a = new P(r, t.extraScalars || []),
    o = a.library(t.poses),
    s = new E(r, { height: t.height });
  t.build(s, n, r);
  let l = s.build(),
    u = Ot(s.glow, r),
    d = {};
  for (let e in t.anchors)
    d[e] = { i: r.index(t.anchors[e].bone), p: new c(...t.anchors[e].p) };
  let f = (t.trails || []).map((e) => ({
      i: r.index(e.bone),
      a: new c(...e.a),
      b: new c(...e.b),
      color: new i(e.color || t.element),
    })),
    p = {
      id: t.id,
      M: t,
      P: n,
      rig: r,
      layout: a,
      lib: o,
      geometry: l,
      geometryLod: null,
      trisLod: 0,
      seamData: l.userData.seamData,
      glowGeometry: u,
      anchors: d,
      trails: f,
      anim: t.anim,
      height: t.height,
      element: t.element,
      rim: t.rim || `#fff2dc`,
      grips: t.grips || {},
      tris: l.index.count / 3,
    };
  return ((l.userData.seamData = null), Tt.set(e, p), p);
}
function Dt(e) {
  if (e.geometryLod) return e.geometryLod;
  let t = e.M;
  try {
    C.k = wt;
    let n = new E(e.rig, { height: t.height });
    ((n.seamSource = e.seamData),
      t.build(n, e.P, e.rig),
      (e.geometryLod = n.build()),
      (e.geometryLod.userData.seamData = null));
  } catch (t) {
    (console.error(`[champions] LOD build failed: ` + e.id, t),
      (e.geometryLod = e.geometry));
  } finally {
    C.k = 1;
  }
  return (
    (e.trisLod = e.geometryLod.index.count / 3),
    (e.seamData = null),
    e.geometryLod
  );
}
function Ot(t, n) {
  if (!t.length) return null;
  let i = [],
    a = [],
    s = [],
    c = [],
    l = [],
    u = [],
    d = [];
  for (let e of t) {
    let t = n.index(e.bone),
      [r, o, f] = e.p,
      p = e.size / 2,
      m = e.stretch || 1;
    for (let [n, h] of [
      [
        [1, 0, 0],
        [0, 1, 0],
      ],
      [
        [0, 0, 1],
        [0, 1, 0],
      ],
      [
        [1, 0, 0],
        [0, 0, 1],
      ],
    ]) {
      let g = i.length / 3;
      for (let [u, g] of [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
      ])
        (i.push(
          r + (n[0] * u + h[0] * g * m) * p,
          o + (n[1] * u + h[1] * g * m) * p,
          f + (n[2] * u + h[2] * g * m) * p,
        ),
          a.push(u * 0.5 + 0.5, g * 0.5 + 0.5),
          s.push(
            e.color.r * e.intensity,
            e.color.g * e.intensity,
            e.color.b * e.intensity,
          ),
          c.push(t, 0, 0, 0),
          l.push(1, 0, 0, 0),
          d.push(
            n[1] * h[2] - n[2] * h[1],
            n[2] * h[0] - n[0] * h[2],
            n[0] * h[1] - n[1] * h[0],
          ));
      u.push(g, g + 1, g + 2, g, g + 2, g + 3);
    }
  }
  let f = new e();
  return (
    f.setAttribute(`position`, new r(i, 3)),
    f.setAttribute(`uv`, new r(a, 2)),
    f.setAttribute(`normal`, new r(d, 3)),
    f.setAttribute(`color`, new r(s, 3)),
    f.setAttribute(`skinIndex`, new o(c, 4)),
    f.setAttribute(`skinWeight`, new r(l, 4)),
    f.setIndex(u),
    f.computeBoundingSphere(),
    f
  );
}
export { wt as LOD_K, Ct as MODELS, Dt as ensureLod, Et as getType };
