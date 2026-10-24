var e = 1 / 30,
  t = Object.freeze({ BLUE: 0, RED: 1, NEUTRAL: 2 }),
  n = Object.freeze({
    CHAMPION: `champion`,
    MINION: `minion`,
    TOWER: `tower`,
    INHIBITOR: `inhibitor`,
    NEXUS: `nexus`,
    MONSTER: `monster`,
    PROJECTILE: `projectile`,
    FOUNTAIN: `fountain`,
    WARD: `ward`,
  }),
  r = [`Q`, `W`, `E`, `R`],
  i = {
    champion: 12,
    minion: 8,
    tower: 12,
    monster: 4,
    ward: 9,
    nexus: 11,
    inhibitor: 8,
  },
  a = [`brannoc`, `sable`, `morrow`, `vyre`, `oru`],
  o = (e, t, n) => (e < t ? t : e > n ? n : e),
  s = (e, t, n, r) => {
    let i = n - e,
      a = r - t;
    return i * i + a * a;
  },
  c = (e, t, n, r) => Math.sqrt(s(e, t, n, r));
function l(e, t, n, r, i, a) {
  let s = i - n,
    l = a - r,
    u = s * s + l * l,
    d = u > 0 ? ((e - n) * s + (t - r) * l) / u : 0;
  return ((d = o(d, 0, 1)), c(e, t, n + s * d, r + l * d));
}
function u(e = 1) {
  let t = e >>> 0,
    n = () => {
      t = (t + 1831565813) >>> 0;
      let e = t;
      return (
        (e = Math.imul(e ^ (e >>> 15), e | 1)),
        (e ^= e + Math.imul(e ^ (e >>> 7), e | 61)),
        ((e ^ (e >>> 14)) >>> 0) / 4294967296
      );
    };
  return {
    next: n,
    range: (e, t) => e + (t - e) * n(),
    int: (e, t) => e + Math.floor(n() * (t - e + 1)),
    pick: (e) => e[Math.floor(n() * e.length)],
  };
}
function d(e, t) {
  return e.prevX + (e.x - e.prevX) * t;
}
function f(e, t) {
  return e.prevY + (e.y - e.prevY) * t;
}
var p = (e) => ({ ...e, x: e.y, y: e.x }),
  m = (e, t) => ({ x: e, y: t }),
  h = {
    top: [m(18, 102), m(12, 90), m(12, 18), m(18, 12), m(90, 12), m(102, 18)],
    mid: [m(18, 102), m(29, 91), m(91, 29), m(102, 18)],
    bot: [
      m(18, 102),
      m(30, 108),
      m(102, 108),
      m(108, 102),
      m(108, 30),
      m(102, 18),
    ],
  },
  g = 4.6,
  _ = { a: m(13, 13), b: m(107, 107), halfWidth: 4.2 },
  v = [
    { kind: `nexus`, x: 18, y: 102, radius: 2.6 },
    { kind: `tower`, lane: `base`, tier: 4, x: 23.5, y: 96.5, radius: 1.1 },
    { kind: `inhibitor`, lane: `top`, x: 12.5, y: 85, radius: 1.5 },
    { kind: `inhibitor`, lane: `mid`, x: 28.5, y: 91.5, radius: 1.5 },
    { kind: `inhibitor`, lane: `bot`, x: 35, y: 107.5, radius: 1.5 },
    { kind: `tower`, lane: `top`, tier: 3, x: 12.5, y: 78, radius: 1.1 },
    { kind: `tower`, lane: `mid`, tier: 3, x: 33, y: 87, radius: 1.1 },
    { kind: `tower`, lane: `bot`, tier: 3, x: 42, y: 107.5, radius: 1.1 },
    { kind: `tower`, lane: `top`, tier: 2, x: 12.5, y: 57, radius: 1.1 },
    { kind: `tower`, lane: `mid`, tier: 2, x: 41, y: 79, radius: 1.1 },
    { kind: `tower`, lane: `bot`, tier: 2, x: 63, y: 107.5, radius: 1.1 },
    { kind: `tower`, lane: `top`, tier: 1, x: 12.5, y: 36, radius: 1.1 },
    { kind: `tower`, lane: `mid`, tier: 1, x: 50.5, y: 69.5, radius: 1.1 },
    { kind: `tower`, lane: `bot`, tier: 1, x: 84, y: 107.5, radius: 1.1 },
  ],
  y = [
    ...v.map((e) => ({ ...e, team: 0 })),
    ...v.map((e) => ({ ...p(e), team: 1 })),
  ],
  b = [
    { team: 0, x: 6, y: 114, radius: 5.5 },
    { team: 1, x: 114, y: 6, radius: 5.5 },
  ],
  x = [
    [m(8, 111), m(9, 113), m(7, 112), m(10, 111.5), m(8.5, 110)],
    [m(111, 8), m(113, 9), m(112, 7), m(111.5, 10), m(110, 8.5)],
  ],
  S = [
    {
      id: `warden`,
      monster: `verdant_warden`,
      x: 26,
      y: 64,
      buff: `verdant`,
      respawn: 120,
    },
    {
      id: `brute`,
      monster: `crimson_brute`,
      x: 56,
      y: 88,
      buff: `crimson`,
      respawn: 120,
    },
    { id: `wolves`, monster: `thornback`, x: 40, y: 56, respawn: 90 },
    { id: `toads`, monster: `mire_toad`, x: 24, y: 44, respawn: 90 },
    { id: `stalkers`, monster: `ash_stalker`, x: 64, y: 80, respawn: 90 },
    { id: `golems`, monster: `shard_golem`, x: 76, y: 96, respawn: 90 },
  ],
  C = [
    ...S.map((e) => ({ ...e, side: 0, id: `blue_` + e.id })),
    ...S.map((e) => ({ ...p(e), side: 1, id: `red_` + e.id })),
    {
      id: `skitter_top`,
      monster: `rift_skitter`,
      x: 47,
      y: 47,
      side: 2,
      respawn: 150,
    },
    {
      id: `skitter_bot`,
      monster: `rift_skitter`,
      x: 73,
      y: 73,
      side: 2,
      respawn: 150,
    },
    {
      id: `tyrant`,
      monster: `abyssal_tyrant`,
      x: 35,
      y: 35,
      side: 2,
      respawn: 300,
      epic: !0,
      firstSpawn: 600,
    },
    {
      id: `drake`,
      monster: `storm_drake`,
      x: 85,
      y: 85,
      side: 2,
      respawn: 240,
      epic: !0,
      firstSpawn: 180,
    },
  ],
  w = [
    { id: `tyrant`, x: 35, y: 35, radius: 6.5 },
    { id: `drake`, x: 85, y: 85, radius: 6.5 },
  ],
  T = [
    [24, 44, 12, 44],
    [24, 44, 40, 56],
    [40, 56, 48, 48],
    [40, 56, 26, 64],
    [26, 64, 12, 70],
    [26, 64, 34, 86],
    [40, 56, 46, 74],
    [24, 44, 30, 30],
    [56, 88, 40, 80],
    [56, 88, 64, 80],
    [64, 80, 72, 72],
    [64, 80, 52, 68],
    [56, 88, 76, 96],
    [76, 96, 76, 108],
    [76, 96, 86, 86],
    [56, 88, 48, 108],
    [26, 64, 18, 80],
  ],
  E = 2.7,
  D = [...T, ...T.map(([e, t, n, r]) => [t, e, r, n])],
  O = 4.4,
  k = [
    { team: 0, x: 13, y: 107, radius: 19 },
    { team: 1, x: 107, y: 13, radius: 19 },
  ],
  A = [
    { x: 15.8, y: 27, r: 1.8 },
    { x: 15.8, y: 31, r: 1.7 },
    { x: 52.5, y: 64.5, r: 1.7 },
    { x: 44, y: 52, r: 1.7 },
    { x: 80, y: 92, r: 1.8 },
    { x: 18, y: 44, r: 1.8 },
    { x: 18.5, y: 76, r: 1.6 },
    { x: 33, y: 104.5, r: 1.6 },
    { x: 96, y: 104.5, r: 1.8 },
    { x: 60, y: 84, r: 1.6 },
  ],
  j = [...A, ...A.map(p)].map((e, t) => ({ ...e, id: t }));
function M(e, t, n, r, i, a, o) {
  return o - l(e, t, n, r, i, a);
}
function N(e, t, n, r, i) {
  return i - c(e, t, n, r);
}
function P(e, t) {
  let n = -1e9;
  for (let r in h) {
    let i = h[r];
    for (let r = 0; r < i.length - 1; r++)
      n = Math.max(n, M(e, t, i[r].x, i[r].y, i[r + 1].x, i[r + 1].y, g));
  }
  n = Math.max(n, M(e, t, _.a.x, _.a.y, _.b.x, _.b.y, _.halfWidth));
  for (let r of k) n = Math.max(n, N(e, t, r.x, r.y, r.radius));
  for (let r of w) n = Math.max(n, N(e, t, r.x, r.y, r.radius));
  for (let r of C) r.epic || (n = Math.max(n, N(e, t, r.x, r.y, O)));
  for (let r of D) n = Math.max(n, M(e, t, r[0], r[1], r[2], r[3], E));
  let r = Math.min(e - 3, t - 3, 117 - e, 117 - t);
  return Math.min(n, r);
}
function F(e, t) {
  return l(e, t, _.a.x, _.a.y, _.b.x, _.b.y);
}
function I(e, t) {
  for (let n of j) {
    let r = e - n.x,
      i = t - n.y;
    if (r * r + i * i <= n.r * n.r) return n.id;
  }
  return -1;
}
var L = 0.5,
  R = Math.round(120 / L),
  z = null;
function B() {
  if (z) return z;
  let e = new Float32Array(R * R);
  for (let t = 0; t < R; t++)
    for (let n = 0; n < R; n++) e[t * R + n] = P((n + 0.5) * L, (t + 0.5) * L);
  return ((z = e), e);
}
function V(e, t) {
  let n = B(),
    r = o(e / L - 0.5, 0, R - 1.001),
    i = o(t / L - 0.5, 0, R - 1.001),
    a = r | 0,
    s = i | 0,
    c = r - a,
    l = i - s,
    u = n[s * R + a],
    d = n[s * R + a + 1],
    f = n[(s + 1) * R + a],
    p = n[(s + 1) * R + a + 1];
  return (u * (1 - c) + d * c) * (1 - l) + (f * (1 - c) + p * c) * l;
}
export {
  i as A,
  d as C,
  n as D,
  e as E,
  r as O,
  u as S,
  a as T,
  V as _,
  h as a,
  s as b,
  R as c,
  x as d,
  y as f,
  F as g,
  B as h,
  b as i,
  t as k,
  w as l,
  p as m,
  j as n,
  g as o,
  I as p,
  C as r,
  L as s,
  k as t,
  _ as u,
  P as v,
  f as w,
  l as x,
  c as y,
};
