import {
  D as e,
  E as t,
  T as n,
  a as r,
  g as i,
  i as a,
  l as o,
  o as s,
} from "./map-oE9sOnNc.js";
import { t as c } from "./events-WjIX4JqM.js";
import { Qt as l, t as u } from "./index-DHK-Ptzs.js";
function d(e) {
  let t = 2047;
  function n(e) {
    let t = e >>> 0 || 1;
    return () => {
      t = (t + 1831565813) >>> 0;
      let e = t;
      return (
        (e = Math.imul(e ^ (e >>> 15), e | 1)),
        (e ^= e + Math.imul(e ^ (e >>> 7), e | 61)),
        ((e ^ (e >>> 14)) >>> 0) / 4294967296
      );
    };
  }
  function r(e) {
    let t = 2166136261;
    for (let n = 0; n < e.length; n++)
      ((t ^= e.charCodeAt(n)), (t = Math.imul(t, 16777619)));
    return t >>> 0;
  }
  let i = (e, t, n = null) => ({
    channels: e,
    length: e[0].length,
    sampleRate: t,
    meta: n,
  });
  function* a(e, a) {
    let o = Math.floor(a * 1.6),
      s = n(r(`noise-` + e)),
      c = [];
    for (let n = 0; n < 2; n++) {
      let n = new Float32Array(o),
        r = 0,
        i = 0,
        a = 0,
        l = 0;
      for (let c = 0; c < o; c++) {
        let o = s() * 2 - 1,
          u;
        (e === `pink`
          ? ((r = 0.99765 * r + o * 0.099046),
            (i = 0.963 * i + o * 0.2965164),
            (a = 0.57 * a + o * 1.0526913),
            (u = r + i + a + o * 0.1848))
          : e === `brown`
            ? ((l = (l + 0.02 * o) / 1.02), (u = l))
            : (u = o),
          (n[c] = u),
          (c & t) == t && (yield));
      }
      let u = n[o - 1] - n[0],
        d = 0,
        f = 0;
      for (let e = 0; e < o; e++) {
        n[e] -= u * (e / (o - 1));
        let r = Math.abs(n[e]);
        (r > d && (d = r), (f += n[e]), (e & t) == t && (yield));
      }
      f /= o;
      let p = 0.95 / Math.max(1e-6, d + Math.abs(f));
      for (let e = 0; e < o; e++)
        ((n[e] = (n[e] - f) * p), (e & t) == t && (yield));
      c.push(n);
    }
    return i(c, a);
  }
  function* o(e) {
    let a = Math.floor(e * 2),
      o = n(r(`crackle`)),
      s = [];
    for (let n = 0; n < 2; n++) {
      let n = new Float32Array(a),
        r = 0,
        i = 0;
      for (; r < a; ) {
        r += Math.floor((-Math.log(1 - o() * 0.999) * e) / 85);
        let t = o() ** 2.2 * (o() < 0.5 ? -1 : 1),
          s = Math.floor(e * (8e-4 + 0.0052 * o())),
          c = s / 3;
        for (let e = 0; e < s && r + e < a; e++)
          n[r + e] += t * (o() * 2 - 1) * Math.exp(-e / c);
        ++i & 31 || (yield);
      }
      let c = 0;
      for (let e = 0; e < a; e++) {
        let r = Math.abs(n[e]);
        (r > c && (c = r), (e & t) == t && (yield));
      }
      let l = 0.95 / Math.max(1e-6, c);
      for (let e = 0; e < a; e++) ((n[e] *= l), (e & t) == t && (yield));
      s.push(n);
    }
    return i(s, e);
  }
  function* s(e, a, o) {
    let s = Math.floor(e.slotLen * o),
      c = s * e.slots,
      l = new Float32Array(c),
      u = new Float32Array(c),
      d = n(r(`bank-` + a)),
      f = 2 * Math.PI;
    for (let n = 0; n < e.slots; n++) {
      let r = 0.94 + 0.12 * d(),
        i = 0.5 + 0.5 * d(),
        a = (d() * 2 - 1) * 0.85,
        c = Math.cos(((a + 1) * Math.PI) / 4),
        p = Math.sin(((a + 1) * Math.PI) / 4),
        m = e.dMin + (e.dMax - e.dMin) * d() ** 1.3,
        h = e.partials.map(() => d() * f),
        g = n * s,
        _ = Math.floor(o * 0.012);
      for (let n = 0; n < s; n++) {
        let a = n / o,
          v = 0;
        for (let t = 0; t < e.partials.length; t++) {
          let n = e.partials[t][0],
            i = e.partials[t][1],
            o = m / (1 + t * 0.55) / 6.9;
          v += i * Math.sin(f * e.f * r * n * a + h[t]) * Math.exp(-a / o);
        }
        e.tick &&
          n < o * 0.012 &&
          (v += e.tick * (d() * 2 - 1) * Math.exp(-n / (o * 0.0025)));
        let y = Math.min(1, n / (o * 0.0015)),
          b = n > s - _ ? (s - n) / _ : 1;
        ((v *= i * y * b),
          (l[g + n] = v * c),
          (u[g + n] = v * p),
          (n & t) == t && (yield));
      }
      yield;
    }
    let p = 0;
    for (let e = 0; e < c; e++)
      ((p = Math.max(p, Math.abs(l[e]), Math.abs(u[e]))),
        (e & t) == t && (yield));
    let m = 0.9 / Math.max(1e-6, p);
    for (let e = 0; e < c; e++)
      ((l[e] *= m), (u[e] *= m), (e & t) == t && (yield));
    return i([l, u], o, { f: e.f, slots: e.slots, slotLen: e.slotLen });
  }
  function* c(e, a, o, s, c) {
    let l = Math.min(c, 32e3),
      u = Math.min(3.2, Math.max(0.15, a * 1.05 + 0.05)),
      d = Math.floor(l * u),
      f = new Float32Array(d),
      p = n(r(s)),
      m = l / Math.min(4e3, Math.max(30, e)),
      h = Math.floor(m - 0.5),
      g = m - 0.5 - h;
    g < 0.15 && h > 2 && (--h, (g += 1));
    let _ = (1 - g) / (1 + g),
      v = 0.001 ** (1 / (Math.max(0.05, a) * e)),
      y = new Float32Array(h),
      b = 0,
      x = 0.08 + 0.9 * Math.min(1, Math.max(0, o));
    for (let e = 0; e < h; e++) ((b += x * (p() * 2 - 1 - b)), (y[e] = b));
    let S = Math.max(1, Math.floor(h * 0.13)),
      C = y.slice();
    for (let e = 0; e < h; e++) y[e] = C[e] - 0.6 * C[(e + S) % h];
    let w = 0;
    for (let e = 0; e < h; e++) w += y[e];
    w /= h;
    for (let e = 0; e < h; e++) y[e] -= w;
    let T = 0,
      E = 0,
      D = 0,
      O = 0,
      k = 0;
    for (let e = 0; e < d; e++) {
      let n = y[T];
      f[e] = n;
      let r = 0.5 * (n + E);
      E = n;
      let i = _ * r + D - _ * O;
      ((D = r), (O = i), (y[T] = i * v), T++, T >= h && (T = 0));
      let a = Math.abs(n);
      (a > k && (k = a), (e & t) == t && (yield));
    }
    let A = Math.min(d, Math.floor(l * 0.04));
    for (let e = 0; e < A; e++) f[d - 1 - e] *= e / A;
    let j = 0.9 / Math.max(1e-6, k);
    for (let e = 0; e < d; e++) ((f[e] *= j), (e & t) == t && (yield));
    return i([f], l);
  }
  function* l(e, r) {
    let a = Math.max(128, Math.floor(e.seconds * r)),
      o = n(e.seed),
      s = [];
    for (let n = 0; n < 2; n++) {
      let n = new Float32Array(a),
        i = 0,
        c = Math.floor(e.predelay * r);
      for (let s = c; s < a; s++) {
        let l = (s - c) / (a - c),
          u = (1 - l) ** e.decay * (1 - Math.exp(-(s - c) / (r * 0.004))),
          d = 0.92 - e.damping * 0.8 * l;
        ((i += d * (o() * 2 - 1 - i)), (n[s] = i * u), (s & t) == t && (yield));
      }
      for (let t = 0; t < e.early; t++) {
        let i = c + Math.floor(r * (0.006 + 0.069 * o()));
        i < a &&
          (n[i] +=
            (o() < 0.5 ? -1 : 1) * (0.25 + 0.45 * o()) * (1 - t / e.early));
      }
      (s.push(n), yield);
    }
    return i(s, r);
  }
  let u = {
    YIELD_EVERY: 2048,
    makeRng: n,
    hashStr: r,
    genNoise: a,
    genCrackle: o,
    genBank: s,
    genPluck: c,
    genIR: l,
  };
  return (
    e &&
      (e.onmessage = (t) => {
        let n = t.data;
        try {
          let t = u[n.gen](...n.args),
            r = t.next();
          for (; !r.done; ) r = t.next();
          let i = r.value;
          e.postMessage(
            { key: n.key, value: i },
            i.channels.map((e) => e.buffer),
          );
        } catch (t) {
          e.postMessage({ key: n.key, error: String((t && t.message) || t) });
        }
      }),
    u
  );
}
var f = d(null),
  p = 8e3,
  m = null,
  h = !1,
  g = null,
  _ = new Map();
function v() {
  if (m || h) return m;
  try {
    if (
      typeof Worker != `function` ||
      typeof Blob != `function` ||
      typeof URL > `u` ||
      !URL.createObjectURL
    )
      return ((h = !0), null);
    let e = `(${d.toString()})(self);`,
      t = URL.createObjectURL(new Blob([e], { type: `text/javascript` }));
    ((m = new Worker(t)),
      URL.revokeObjectURL(t),
      (m.onmessage = (e) => y(e.data.key, e.data.error ? null : e.data.value)),
      (m.onerror = (e) => {
        (e && e.preventDefault && e.preventDefault(), (h = !0));
        let t = [..._.keys()];
        try {
          m.terminate();
        } catch {}
        m = null;
        for (let e of t) y(e, null);
      }));
  } catch {
    ((h = !0), (m = null));
  }
  return m;
}
function y(e, t) {
  let n = _.get(e);
  if ((_.delete(e), n)) for (let r of n) r(e, t);
  !_.size &&
    m &&
    (clearTimeout(g),
    (g = setTimeout(() => {
      !_.size && m && (m.terminate(), (m = null));
    }, p)));
}
function b(e, t, n, r) {
  let i = _.get(e);
  if (i) return (i.push(r), !0);
  let a = v();
  if (!a) return !1;
  (clearTimeout(g), _.set(e, [r]));
  try {
    a.postMessage({ key: e, gen: t, args: n });
  } catch {
    return (_.delete(e), !1);
  }
  return !0;
}
var x = () => !h && typeof Worker == `function`,
  S = 1e-4,
  C = (e, t = 0) => (Number.isFinite(e) ? e : t),
  w = (e, t, n) => (e < t ? t : e > n ? n : e),
  T = (e) => w(C(e, 440), 1, 22e3),
  E = (e) => 440 * 2 ** ((e - 69) / 12);
function D(e, t, n) {
  let r = w((n - e) / (t - e), 0, 1);
  return r * r * (3 - 2 * r);
}
var O = () => (typeof performance < `u` ? performance.now() : Date.now());
function k(e) {
  return e
    ? e.__offline === !0 ||
        (typeof OfflineAudioContext == `function` &&
          e instanceof OfflineAudioContext)
    : !1;
}
var A = 625341585;
function j(e) {
  A = e >>> 0 || 1;
}
function ee() {
  return A;
}
function M() {
  A = (A + 1831565813) >>> 0;
  let e = A;
  return (
    (e = Math.imul(e ^ (e >>> 15), e | 1)),
    (e ^= e + Math.imul(e ^ (e >>> 7), e | 61)),
    ((e ^ (e >>> 14)) >>> 0) / 4294967296
  );
}
var N = (e, t) => e + (t - e) * M(),
  te = (e) => e[Math.floor(M() * e.length) % e.length],
  ne = f.hashStr,
  re = f.makeRng;
function P(e, t, n, r) {
  ((t = C(t, 0)), (n = C(n, 0)));
  try {
    if (e.cancelAndHoldAtTime) e.cancelAndHoldAtTime(n);
    else {
      let t = e.value;
      (e.cancelScheduledValues(n), e.setValueAtTime(t, n));
    }
    e.setTargetAtTime(t, n, Math.max(0.001, C(r, 0.05)));
  } catch {
    try {
      e.value = t;
    } catch {}
  }
}
var ie = new Map(),
  ae = new WeakMap(),
  oe = 160,
  se = 48e3;
function ce(e) {
  let t = ie.get(e);
  return (
    t ||
      ((t = {
        key: e,
        rate: 0,
        done: new Map(),
        raw: new Map(),
        jobs: new Map(),
        want: new Set(),
        specs: new Map(),
        plucksLru: [],
      }),
      ie.set(e, t)),
    t
  );
}
function le(e) {
  let t = ae.get(e);
  return (
    t ||
    ((t = { ac: e, waves: {}, s: ce(e.__audioStore || `real`) }),
    ae.set(e, t),
    t)
  );
}
function ue(e, t, n, r) {
  if (e.s.key === `real` && typeof AudioBuffer == `function`)
    try {
      return new AudioBuffer({ numberOfChannels: t, length: n, sampleRate: r });
    } catch {}
  return e.ac.createBuffer(t, n, r);
}
function de(e, t, n) {
  if (e.copyToChannel)
    try {
      e.copyToChannel(n, t);
      return;
    } catch {}
  e.getChannelData(t).set(n);
}
function fe(e) {
  return (
    e.s.rate ||
      (e.s.rate =
        e.s.key === `null`
          ? 3e3
          : e.s.key === `real`
            ? se
            : w(e.ac.sampleRate, 22050, 48e3)),
    e.s.rate
  );
}
var pe = {
    sparkle: {
      f: 4e3,
      slots: 24,
      slotLen: 0.26,
      partials: [[1, 1]],
      dMin: 0.06,
      dMax: 0.24,
    },
    glass: {
      f: 2200,
      slots: 24,
      slotLen: 0.36,
      partials: [
        [1, 1],
        [2.41, 0.42],
        [3.93, 0.16],
      ],
      dMin: 0.08,
      dMax: 0.35,
    },
    clink: {
      f: 3e3,
      slots: 16,
      slotLen: 0.14,
      partials: [
        [1, 1],
        [1.73, 0.55],
        [2.9, 0.3],
      ],
      dMin: 0.03,
      dMax: 0.09,
      tick: 0.6,
    },
  },
  me = {
    seconds: 2.2,
    decay: 2.6,
    damping: 0.6,
    early: 8,
    seed: 7,
    predelay: 0.012,
  },
  he = (e, t) =>
    [`ir`, e, t.seconds, t.decay, t.damping, t.early, t.seed].join(`:`),
  ge = (e, t, n) =>
    `pluck:` +
    Math.round(e * 8) +
    `:` +
    Math.round(t * 20) +
    `:` +
    Math.round(n * 10);
function _e(e, t) {
  let n = e.s.specs.get(t);
  if (n) return n;
  let r = fe(e),
    i = null;
  return (
    t.startsWith(`noise:`)
      ? (i = { gen: `genNoise`, args: [t.slice(6), r] })
      : t === `crackle`
        ? (i = { gen: `genCrackle`, args: [r] })
        : t.startsWith(`bank:`) &&
          pe[t.slice(5)] &&
          (i = { gen: `genBank`, args: [pe[t.slice(5)], t.slice(5), r] }),
    i && e.s.specs.set(t, i),
    i
  );
}
function ve(e, t, n) {
  let r = e.s;
  r.raw.delete(t);
  let i = ue(e, n.channels.length, n.length, n.sampleRate);
  for (let e = 0; e < n.channels.length; e++) de(i, e, n.channels[e]);
  return ye(r, t, n.meta ? { buf: i, ...n.meta } : i);
}
function ye(e, t, n) {
  return (
    e.jobs.delete(t),
    e.want.delete(t),
    e.done.set(t, n),
    t.startsWith(`pluck:`) &&
      (e.plucksLru.push(t),
      e.plucksLru.length > oe && e.done.delete(e.plucksLru.shift())),
    n
  );
}
function* be(e) {
  return yield* f[e.gen](...e.args);
}
var xe = (e) => e.s.key === `real` && x() && !k(e.ac);
function Se(e, t, n) {
  return e.done.has(t) || e.raw.has(t)
    ? !0
    : b(t, n.gen, n.args, (t, n) => {
        n && !e.done.has(t)
          ? e.raw.set(t, n)
          : n || e.specs.set(t + `#failed`, !0);
      });
}
function Ce(e, t, n) {
  let r = e.s,
    i = r.done.get(t);
  if (i) return i;
  let a = O();
  try {
    let i = r.raw.get(t);
    if (i) return ve(e, t, i);
    let a = r.jobs.get(t);
    a || ((a = be(n)), r.jobs.set(t, a));
    let o = a.next();
    for (; !o.done; ) o = a.next();
    return Te(e, t, o.value);
  } finally {
    ((we.syncMs += O() - a), we.syncDrains++);
  }
}
var we = { syncMs: 0, syncDrains: 0 };
function Te(e, t, n) {
  return (e.s.raw.set(t, n), ve(e, t, n));
}
function Ee(e, t, n, r) {
  let i = e.s;
  if (i.done.has(t)) return !0;
  if (i.raw.has(t)) return (ve(e, t, i.raw.get(t)), !0);
  if (!i.jobs.has(t) && xe(e) && !i.specs.has(t + `#failed`) && Se(i, t, n))
    return !1;
  let a = i.jobs.get(t);
  for (a || ((a = be(n)), i.jobs.set(t, a)); ; ) {
    let n = a.next();
    if (n.done) return (Te(e, t, n.value), !0);
    if (O() >= r) return !1;
  }
}
function De(e = [], t = se) {
  if (!x()) return !1;
  let n = ce(`real`);
  n.rate = n.rate || se;
  let r = { s: n, ac: { sampleRate: t } };
  for (let e of Fe) Se(n, e, _e(r, e));
  for (let r of e) {
    let e = { ...me, ...r };
    Se(n, he(t, e), { gen: `genIR`, args: [e, t] });
  }
  return !0;
}
function Oe(e, t = {}) {
  let n = { ...me, ...t };
  return Ce(le(e), he(e.sampleRate, n), {
    gen: `genIR`,
    args: [n, e.sampleRate],
  });
}
function ke(e, t, n) {
  let r = { ...me, ...t },
    i = le(e),
    a = he(e.sampleRate, r);
  return Ee(i, a, { gen: `genIR`, args: [r, e.sampleRate] }, n)
    ? i.s.done.get(a)
    : null;
}
function Ae(e, t) {
  let n = { ...me, ...t },
    r = le(e).s,
    i = he(e.sampleRate, n);
  return r.done.has(i) || r.raw.has(i);
}
function je(e = 0.8, t = 0.985) {
  let n = 8192,
    r = new Float32Array(n),
    i = t - e;
  for (let t = 0; t < n; t++) {
    let n = (t / 8191) * 2 - 1,
      a = Math.abs(n),
      o = a <= e ? a : e + i * Math.tanh((a - e) / i);
    r[t] = Math.sign(n) * o;
  }
  return r;
}
function Me(e, t) {
  if (e.waves[t]) return e.waves[t];
  let n = new Float32Array(49),
    r = new Float32Array(49);
  for (let e = 1; e <= 48; e++) {
    let n;
    switch (t) {
      case `warm`:
        n = e ** -1.35 * (e <= 6 ? 1 : 0.8);
        break;
      case `brass`:
        n = e ** -0.85 * (1 + 0.4 * Math.exp(-((e - 4) ** 2) / 6));
        break;
      case `reed`:
        n = (e % 2 ? 1 : 0.28) / e;
        break;
      case `organ`:
        n = [0, 1, 0.55, 0.3, 0.2, 0.08, 0.12, 0, 0.06][e] || 0;
        break;
      case `choir`:
        n = e ** -1.1 * (e === 1 ? 0.6 : 1);
        break;
      default:
        n = 1 / e;
    }
    r[e] = n;
  }
  let i = e.ac.createPeriodicWave(n, r);
  return ((e.waves[t] = i), i);
}
var Ne = new Map();
function Pe(e, t) {
  let n = e + t,
    r = Ne.get(n);
  if (r) return r;
  let i = 2048;
  r = new Float32Array(i);
  for (let e = 0; e < i; e++) {
    let n = (e / 2047) * 2 - 1;
    r[e] = Math.tanh(t * n) / Math.tanh(t);
  }
  return (Ne.set(n, r), r);
}
var Fe = [
    `noise:pink`,
    `noise:white`,
    `noise:brown`,
    `crackle`,
    `bank:sparkle`,
    `bank:glass`,
    `bank:clink`,
  ],
  F = class {
    constructor(e) {
      ((this.ac = e), (this.b = le(e)), (this.sources = 0), (this.log = null));
    }
    noiseBuf(e) {
      let t = `noise:` + e;
      return Ce(this.b, t, _e(this.b, t));
    }
    crackleBuf() {
      return Ce(this.b, `crackle`, _e(this.b, `crackle`));
    }
    pluckBuf(e, t, n) {
      let r = ge(e, t, n);
      return Ce(this.b, r, this._pluckSpec(r, e, t, n));
    }
    bankIfReady(e) {
      let t = this.b.s,
        n = `bank:` + e;
      return (
        t.done.get(n) ||
        (t.raw.has(n) ? ve(this.b, n, t.raw.get(n)) : (t.want.add(n), null))
      );
    }
    isWarm(e) {
      return this.b.s.done.has(e) || this.b.s.raw.has(e);
    }
    pendingWarm() {
      return this.b.s.want.size > 0;
    }
    warm(e, t) {
      let n = this.b.s,
        r = e ? [...e, ...n.want] : [...n.want],
        i = !0;
      for (let e of r) {
        if (n.done.has(e)) continue;
        let a = _e(this.b, e);
        if (!a) {
          n.want.delete(e);
          continue;
        }
        if ((Ee(this.b, e, a, t) || (i = !1), O() >= t))
          return i && r.every((e) => n.done.has(e));
      }
      return i;
    }
    warmPluck(e, t, n) {
      let r = ge(e, t, n),
        i = this.b.s;
      if (!i.done.has(r)) {
        let a = this._pluckSpec(r, e, t, n);
        (i.want.add(r), xe(this.b) && Se(i, r, a));
      }
      return r;
    }
    _pluckSpec(e, t, n, r) {
      let i = this.b.s.specs.get(e);
      return (
        i ||
          ((i = { gen: `genPluck`, args: [t, n, r, e, fe(this.b)] }),
          this.b.s.specs.set(e, i)),
        i
      );
    }
    gain(e, t = 1) {
      let n = this.ac.createGain();
      return ((n.gain.value = C(t, 0)), e && n.connect(e), n);
    }
    filter(e, t = `lowpass`, n = 1e3, r = 0.707, i = 0) {
      let a = this.ac.createBiquadFilter();
      return (
        (a.type = t),
        (a.frequency.value = T(n)),
        (a.Q.value = C(r, 0.707)),
        (a.gain.value = C(i, 0)),
        e && a.connect(e),
        a
      );
    }
    pan(e, t = 0) {
      if (typeof this.ac.createStereoPanner != `function`)
        return this.gain(e, 1);
      let n = this.ac.createStereoPanner();
      return ((n.pan.value = w(C(t, 0), -1, 1)), e && n.connect(e), n);
    }
    shaper(e, t = 2.5, n = `2x`) {
      let r = this.ac.createWaveShaper();
      return (
        (r.curve = Pe(`tanh`, Math.round(t * 10) / 10)),
        (r.oversample = n),
        e && r.connect(e),
        r
      );
    }
    wave(e) {
      return Me(this.b, e);
    }
    osc(e, t, n, r = `sine`, i = 440, a = 0) {
      let o = this.ac.createOscillator();
      (this.sources++,
        typeof r == `string` ? (o.type = r) : o.setPeriodicWave(r),
        o.frequency.setValueAtTime(T(i), t),
        a && o.detune.setValueAtTime(C(a, 0), t));
      let s = t + Math.max(0.02, C(n, 0.1));
      return (
        e && o.connect(e),
        o.start(t),
        o.stop(s),
        this.log && this.log.push(t, s),
        o
      );
    }
    _loopSource(e, t, n, r, i) {
      let a = this.ac.createBufferSource();
      (this.sources++,
        (a.buffer = r),
        (a.loop = !0),
        (a.playbackRate.value = w(C(i, 1), 0.05, 8)));
      let o = t + Math.max(0.02, C(n, 0.1));
      return (
        e && a.connect(e),
        a.start(t, M() * (a.buffer.duration - 0.05)),
        a.stop(o),
        this.log && this.log.push(t, o),
        a
      );
    }
    noise(e, t, n, r = `white`, i = 1) {
      return this._loopSource(e, t, n, this.noiseBuf(r), i);
    }
    crackleSrc(e, t, n, r = 1) {
      return this._loopSource(e, t, n, this.crackleBuf(), r);
    }
    loopNoise(e, t = `white`, n = 1) {
      let r = this.ac.createBufferSource();
      return (
        this.sources++,
        (r.buffer = this.noiseBuf(t)),
        (r.loop = !0),
        (r.playbackRate.value = n),
        e && r.connect(e),
        r
      );
    }
    loopCrackle(e, t = 1) {
      let n = this.ac.createBufferSource();
      return (
        this.sources++,
        (n.buffer = this.crackleBuf()),
        (n.loop = !0),
        (n.playbackRate.value = t),
        e && n.connect(e),
        n
      );
    }
    buffer(e, t, n, r = {}) {
      let i = e;
      (r.pan && (i = this.pan(e, r.pan)),
        r.gain != null && r.gain !== 1 && (i = this.gain(i, r.gain)));
      let a = this.ac.createBufferSource();
      (this.sources++, (a.buffer = n));
      let o = w(C(r.rate ?? 1, 1), 0.1, 4);
      ((a.playbackRate.value = o), a.connect(i));
      let s = Math.max(0, C(r.offset, 0)),
        c = r.dur ? Math.min(r.dur, n.duration - s) : n.duration - s;
      a.start(t, s, c);
      let l = t + c / o;
      return (a.stop(l + 0.005), this.log && this.log.push(t, l + 0.005), l);
    }
    lfo(e, t, n, r, i, a = `sine`) {
      let o = this.gain(e, i);
      return this.osc(o, t, n, a, r);
    }
    mod(e, t, n, r, i = `sine`) {
      let a = this.gain(null, r);
      return (this.osc(a, e, t, i, n), a);
    }
    perc(e, t, n, r = 0.002, i = 0.3) {
      return (
        (n = C(n, 0)),
        (r = Math.max(5e-4, C(r, 0.002))),
        (i = Math.max(0.01, C(i, 0.3))),
        e.setValueAtTime(0, t),
        e.linearRampToValueAtTime(n, t + r),
        e.setTargetAtTime(0, t + r, i / 6.9),
        t + r + i
      );
    }
    swell(e, t, n, r = 0.3, i = 0, a = 0.3) {
      return (
        (n = Math.max(S * 2, C(n, 0))),
        (r = Math.max(0.005, C(r, 0.3))),
        (i = Math.max(0, C(i, 0))),
        (a = Math.max(0.01, C(a, 0.3))),
        e.setValueAtTime(S, t),
        e.exponentialRampToValueAtTime(n, t + r),
        e.setValueAtTime(n, t + r + i),
        e.exponentialRampToValueAtTime(S, t + r + i + a),
        e.setValueAtTime(0, t + r + i + a + 0.005),
        t + r + i + a + 0.01
      );
    }
    asr(e, t, n, r = 0.05, i = 0.2, a = 0.3) {
      return (
        (n = C(n, 0)),
        (r = Math.max(0.002, C(r, 0.05))),
        (i = Math.max(0, C(i, 0.2))),
        (a = Math.max(0.01, C(a, 0.3))),
        e.setValueAtTime(0, t),
        e.linearRampToValueAtTime(n, t + r),
        e.setValueAtTime(n, t + r + i),
        e.setTargetAtTime(0, t + r + i, a / 6.9),
        t + r + i + a
      );
    }
    sweep(e, t, n, r, i, a = !1) {
      ((n = C(n, 1)),
        (r = C(r, 1)),
        (i = Math.max(0.002, C(i, 0.1))),
        e.setValueAtTime(n, t),
        a || n <= 0 || r <= 0
          ? e.linearRampToValueAtTime(r, t + i)
          : e.exponentialRampToValueAtTime(r, t + i));
    }
    env(e, t, n) {
      return n.swell
        ? this.swell(
            e.gain,
            t,
            n.peak ?? 0.5,
            n.a ?? 0.2,
            n.h ?? 0,
            n.d ?? n.r ?? 0.3,
          )
        : n.h == null
          ? this.perc(e.gain, t, n.peak ?? 0.5, n.a ?? 0.002, n.d ?? 0.3)
          : this.asr(
              e.gain,
              t,
              n.peak ?? 0.5,
              n.a ?? 0.01,
              n.h,
              n.r ?? n.d ?? 0.3,
            );
    }
    out(e, t) {
      return t.pan == null ? e : this.pan(e, t.pan);
    }
    tone(e, t, n = {}) {
      let r = this.out(e, n),
        i = this.gain(r, 0),
        a = i;
      (n.lp && (a = this.filter(i, `lowpass`, n.lp, n.q ?? 0.7)),
        n.bp && (a = this.filter(i, `bandpass`, n.bp, n.q ?? 2)));
      let o = this.env(i, t, n),
        s =
          typeof n.type == `string` &&
          [`sine`, `square`, `sawtooth`, `triangle`].indexOf(n.type) < 0
            ? this.wave(n.type)
            : n.type || `sine`,
        c = this.osc(a, t, o - t + 0.03, s, n.f, n.detune || 0);
      return (
        n.f1 &&
          this.sweep(
            c.frequency,
            t,
            T(n.f),
            T(n.f1),
            n.glide ?? (o - t) * 0.5,
            n.linear,
          ),
        n.vib &&
          this.lfo(c.detune, t + (n.vibDelay || 0), o - t, n.vib[0], n.vib[1]),
        o
      );
    }
    noiseHit(e, t, n = {}) {
      let r = this.out(e, n),
        i = this.gain(r, 0),
        a = this.filter(i, n.type || `bandpass`, n.f || 1e3, n.q ?? 0.8);
      n.f1 &&
        this.sweep(
          a.frequency,
          t,
          T(n.f || 1e3),
          T(n.f1),
          n.glide ?? n.d ?? 0.2,
        );
      let o = this.env(i, t, n);
      return (
        this.noise(a, t, o - t + 0.02, n.color || `white`, n.rate || 1),
        o
      );
    }
    whoosh(e, t, n = {}) {
      let r = Math.max(0.03, n.dur ?? 0.3),
        i = n.peakAt ?? 0.55,
        a = n.peak ?? 0.4,
        o = e;
      if (n.pan0 != null || n.pan1 != null) {
        let i = this.pan(e, n.pan0 ?? 0);
        (i.pan &&
          this.sweep(
            i.pan,
            t,
            w(n.pan0 ?? 0, -1, 1),
            w(n.pan1 ?? 0, -1, 1),
            r,
            !0,
          ),
          (o = i));
      }
      let s = this.gain(o, 0),
        c = this.filter(s, n.type || `bandpass`, n.f0 ?? 400, n.q ?? 1.1);
      return (
        c.frequency.setValueAtTime(T(n.f0 ?? 400), t),
        c.frequency.exponentialRampToValueAtTime(T(n.f1 ?? 2e3), t + r * i),
        c.frequency.exponentialRampToValueAtTime(T(n.f2 ?? n.f0 ?? 400), t + r),
        s.gain.setValueAtTime(S, t),
        s.gain.exponentialRampToValueAtTime(Math.max(S * 2, a), t + r * i),
        s.gain.exponentialRampToValueAtTime(S, t + r),
        s.gain.setValueAtTime(0, t + r + 0.004),
        this.noise(c, t, r + 0.03, n.color || `pink`, n.rate || 1),
        t + r + 0.01
      );
    }
    thump(e, t, n = {}) {
      let r = this.out(e, n),
        i = this.gain(r, 0),
        a = n.peak ?? 0.7,
        o = n.d ?? 0.35,
        s = T(n.f0 ?? 120),
        c = Math.max(38, T(n.f1 ?? 45)),
        l = Math.min(o, 0.18 + 0.32 * o),
        u = this.perc(i.gain, t, a, n.a ?? 0.0015, l),
        d = this.osc(i, t, u - t + 0.02, n.type || `sine`, s);
      this.sweep(d.frequency, t, s, c, n.drop ?? 0.12);
      let f = (n.knock ?? 1) * a;
      if (f > 0.01) {
        let e = {
          type: `triangle`,
          f: Math.min(900, s * 2.4),
          f1: Math.max(110, c * 3),
          glide: (n.drop ?? 0.12) * 0.8,
        };
        u = Math.max(
          u,
          this.tone(r, t, { ...e, d: Math.min(0.2, o * 0.45), peak: f * 0.34 }),
        );
        let i = Math.min(700, Math.max(180, s * 2.6));
        this.noiseHit(r, t, {
          color: `pink`,
          type: `bandpass`,
          f: i,
          q: 1.1,
          d: Math.min(0.12, o * 0.3),
          peak: f * 0.4,
        });
      }
      let p = (n.crack ?? 1) * a;
      if (p > 0.01) {
        let e = n.crackF ?? w(900 + s * 6, 1200, 2400);
        u = Math.max(
          u,
          this.body(r, t, {
            peak: p * 1.5,
            crackF: e,
            d: Math.min(0.18, 0.07 + o * 0.18),
          }),
        );
      }
      let m = n.click ?? 0.25;
      return (
        m > 0 &&
          this.noiseHit(r, t, {
            type: `highpass`,
            f: 2500,
            q: 0.7,
            a: 0.0012,
            d: 0.014,
            peak: a * m * 0.6,
          }),
        Math.max(u, t + l)
      );
    }
    body(e, t, n = {}) {
      let r = this.out(e, n),
        i = n.crackF ?? 1600,
        a = (n.peak ?? 0.3) * 2,
        o = this.gain(r, 0),
        s = this.filter(o, `bandpass`, i, 0.5),
        c = this.shaper(s, n.drive ?? 4, `none`),
        l = this.filter(c, `lowpass`, i * 2.4, 0.6),
        u = this.perc(o.gain, t, a, 0.005, n.d ?? 0.14);
      return (this.noise(l, t, u - t + 0.02, `pink`, n.rate ?? 0.7), u);
    }
    bell(e, t, n = {}) {
      let r = this.out(e, n),
        i = n.ratios || [1, 2.76, 5.4, 8.93],
        a = n.amps || null,
        o = t;
      for (let e = 0; e < i.length; e++) {
        let s = this.gain(r, 0),
          c = a ? (a[e] ?? 0.1) : 1 / (1 + e * 1.3),
          l = this.perc(
            s.gain,
            t,
            (n.peak ?? 0.2) * c,
            n.a ?? 0.001,
            (n.d ?? 0.8) / (1 + e * (n.damp ?? 0.55)),
          );
        (this.osc(
          s,
          t,
          l - t + 0.02,
          `sine`,
          (n.f ?? 880) * i[e],
          (n.spread ?? 0) * (M() - 0.5),
        ),
          (o = Math.max(o, l)));
      }
      return o;
    }
    fm(e, t, n = {}) {
      let r = this.out(e, n),
        i = this.gain(r, 0),
        a = this.env(i, t, n),
        o = T(n.f ?? 440),
        s = n.ratio ?? 2,
        c = a - t + 0.03,
        l = this.osc(i, t, c, n.type || `sine`, o),
        u = this.gain(l.frequency, 0),
        d = this.osc(u, t, c, `sine`, o * s),
        f = (n.index ?? 2) * o * s,
        p = (n.indexEnd ?? (n.index ?? 2) * 0.15) * o * s;
      if (
        (u.gain.setValueAtTime(f, t),
        u.gain.exponentialRampToValueAtTime(
          Math.max(0.01, p),
          t + Math.max(0.01, n.indexGlide ?? (a - t) * 0.7),
        ),
        n.f1)
      ) {
        let e = T(n.f1),
          r = n.glide ?? (a - t) * 0.5;
        (this.sweep(l.frequency, t, o, e, r),
          this.sweep(d.frequency, t, o * s, e * s, r));
      }
      return (
        n.vib &&
          (this.lfo(l.detune, t, a - t, n.vib[0], n.vib[1]),
          this.lfo(d.detune, t, a - t, n.vib[0], n.vib[1])),
        a
      );
    }
    pluck(e, t, n = {}) {
      let r = T(n.f ?? 220),
        i = n.t60 ?? 1.2,
        a = this.out(e, n),
        o = a;
      n.lp && (o = this.filter(a, `lowpass`, n.lp, 0.6));
      let s = this.gain(o, C(n.peak ?? 0.5, 0)),
        c = this.ac.createBufferSource();
      (this.sources++,
        (c.buffer = this.pluckBuf(r, i, n.bright ?? 0.5)),
        (c.playbackRate.value = w(C(n.rate ?? 1, 1), 0.1, 4)),
        c.connect(s),
        c.start(t));
      let l = t + c.buffer.duration / c.playbackRate.value;
      return (
        c.stop(l + 0.01),
        this.log && this.log.push(t, l + 0.01),
        n.cut
          ? (s.gain.setValueAtTime(n.peak ?? 0.5, t + n.cut),
            s.gain.setTargetAtTime(0, t + n.cut, 0.03),
            Math.min(l, t + n.cut + 0.25))
          : l
      );
    }
    crackle(e, t, n = {}) {
      let r = n.dur ?? 0.5,
        i = this.out(e, n),
        a = this.gain(i, 0),
        o = this.filter(a, n.type || `bandpass`, n.f ?? 2500, n.q ?? 0.7),
        s = n.swell
          ? this.swell(a.gain, t, n.peak ?? 0.3, r * 0.85, 0, r * 0.15)
          : this.perc(a.gain, t, n.peak ?? 0.3, n.a ?? 0.003, r);
      return (this.crackleSrc(o, t, s - t + 0.02, n.rate ?? 1), s);
    }
    sparkle(e, t, n = {}) {
      let r = n.count ?? 6,
        i = n.dur ?? 0.4,
        a = t,
        o = this.bankIfReady(`sparkle`);
      if (o) {
        let s = this.gain(e, (n.peak ?? 0.06) * 0.78);
        for (let e = 0; e < r; e++) {
          let c = t + (n.rise ? (e / r) ** 0.6 : M()) * i,
            l = w(N(n.fMin ?? 2500, n.fMax ?? 6e3) / o.f, 0.4, 2.6),
            u = Math.floor(M() * o.slots) % o.slots,
            d = Math.min(o.slotLen, (n.d ?? 0.25) * 1.15);
          a = Math.max(
            a,
            this.buffer(s, c, o.buf, {
              rate: l,
              offset: u * o.slotLen,
              dur: d,
            }),
          );
        }
        return a;
      }
      for (let o = 0; o < r; o++) {
        let s = t + (n.rise ? (o / r) ** 0.6 : M()) * i,
          c = {
            f: N(n.fMin ?? 2500, n.fMax ?? 6e3),
            d: N(0.06, n.d ?? 0.25),
            peak: (n.peak ?? 0.06) * N(0.5, 1),
            pan: N(-1, 1) * (n.spread ?? 0.6),
          };
        a = Math.max(a, this.tone(e, s, c));
      }
      return a;
    }
    rumble(e, t, n = {}) {
      let r = this.out(e, n),
        i = this.gain(r, 0),
        a = this.filter(i, `lowpass`, n.f ?? 160, 0.9),
        o = this.filter(a, `highpass`, 40, 0.7),
        s = this.filter(
          this.gain(i, (n.grit ?? 1) * 0.55),
          `bandpass`,
          380,
          1.2,
        ),
        c = n.dur ?? 1.5,
        l = n.swell
          ? this.swell(i.gain, t, n.peak ?? 0.5, n.a ?? c * 0.8, 0, c * 0.2)
          : this.perc(i.gain, t, n.peak ?? 0.5, n.a ?? 0.03, c);
      return (
        this.noise(o, t, l - t + 0.02, `brown`, n.rate ?? 1),
        this.noise(s, t, l - t + 0.02, `pink`, n.rate ?? 1),
        l
      );
    }
    brass(e, t, n = {}) {
      let r = T(n.f ?? 220),
        i = Math.max(0.05, n.dur ?? 0.5),
        a = this.out(e, n),
        o = this.gain(a, 0),
        s = this.filter(o, `lowpass`, 400, 1.2),
        c = n.bright ?? 1,
        l = n.a ?? 0.03,
        u = n.r ?? 0.25,
        d = this.asr(o.gain, t, n.peak ?? 0.15, l, i, u);
      (s.frequency.setValueAtTime(T(r * 1.2), t),
        s.frequency.exponentialRampToValueAtTime(
          T(r * (3 + 7 * c)),
          t + l + 0.04,
        ),
        s.frequency.exponentialRampToValueAtTime(
          T(r * (2.2 + 3 * c)),
          t + l + Math.min(i, 0.6),
        ),
        s.frequency.setTargetAtTime(T(r * 1.2), t + l + i, u / 4));
      let f = this.wave(`brass`),
        p =
          i > 0.35
            ? this.mod(t + 0.25, Math.max(0.05, d - t - 0.2), 5.2, 9)
            : null;
      for (let e of n.detunes || [-7, 6]) {
        let i = this.osc(s, t, d - t + 0.02, f, r, e);
        (i.detune.setValueAtTime(e - (n.scoop ?? 45), t),
          i.detune.linearRampToValueAtTime(e, t + 0.06),
          p && p.connect(i.detune));
      }
      return d;
    }
    strings(e, t, n = {}) {
      let r = T(n.f ?? 220),
        i = Math.max(0.03, n.dur ?? 0.5),
        a = this.out(e, n),
        o = this.gain(a, 0),
        s = this.filter(o, `lowpass`, n.cutoff ?? Math.min(9e3, r * 6), 0.6),
        c = this.asr(o.gain, t, n.peak ?? 0.1, n.a ?? 0.08, i, n.r ?? 0.35),
        l = this.wave(`warm`),
        u = n.detunes || [-8, 0, 7],
        d =
          i > 0.5 && n.vib !== !1
            ? this.mod(t + 0.15, c - t, N(4.6, 5.6), 7)
            : null;
      for (let e of u) {
        let n = this.osc(s, t, c - t + 0.02, l, r, e + (M() - 0.5) * 3);
        d && d.connect(n.detune);
      }
      return c;
    }
    choir(e, t, n = {}) {
      let r = n.notes || [62, 69],
        i = Ie[n.vowel] || Ie.ah,
        a = n.vowel1 ? Ie[n.vowel1] : null,
        o = this.out(e, n),
        s = this.gain(o, 0),
        c = this.asr(
          s.gain,
          t,
          n.peak ?? 0.08,
          n.a ?? 0.4,
          n.dur ?? 1,
          n.r ?? 0.8,
        ),
        l = this.gain(null, 1),
        u = this.filter(null, `highpass`, 120, 0.7);
      (l.connect(u),
        i.forEach(([e, r, i], o) => {
          let c = this.filter(null, `bandpass`, e, i);
          (u.connect(c),
            c.connect(this.gain(s, r * 2.2)),
            a &&
              this.sweep(
                c.frequency,
                t + (n.glideAt ?? 0.05),
                e,
                a[o][0],
                n.glideDur ?? 0.18,
              ));
        }));
      let d = this.wave(`choir`),
        f = this.mod(t, c - t, N(4.2, 4.8), 11),
        p = this.mod(t, c - t, N(5, 5.5), 9);
      for (let e = 0; e < r.length; e++) {
        let n = E(r[e]);
        for (let e of [-9, 8]) {
          let r = this.osc(l, t, c - t + 0.02, d, n, e + (M() - 0.5) * 4);
          (e < 0 ? f : p).connect(r.detune);
        }
      }
      return c;
    }
    taiko(e, t, n = {}) {
      let r = n.f ?? 80,
        i = n.peak ?? 0.7,
        a = this.out(e, n),
        o = this.thump(a, t, {
          f0: r * 1.9,
          f1: r,
          drop: 0.09,
          d: n.d ?? 0.9,
          peak: i,
          click: 0,
          crack: n.crack ?? 0,
        });
      return (
        (o = Math.max(
          o,
          this.tone(a, t, {
            type: `triangle`,
            f: r * 2.9,
            f1: r * 1.6,
            glide: 0.06,
            d: 0.18,
            peak: i * 0.25,
          }),
        )),
        this.noiseHit(a, t, {
          type: `lowpass`,
          f: 1400,
          f1: 300,
          glide: 0.08,
          q: 0.8,
          d: 0.14,
          peak: i * 0.55,
          color: `pink`,
        }),
        this.noiseHit(a, t, {
          type: `bandpass`,
          f: 180,
          q: 2,
          d: 0.3,
          peak: i * 0.4,
          color: `pink`,
        }),
        o
      );
    }
    kick(e, t, n = {}) {
      let r = n.f0 ?? 150,
        i = n.f1 ?? 46;
      return this.thump(e, t, {
        f0: r,
        f1: i,
        drop: 0.07,
        d: n.d ?? 0.35,
        peak: n.peak ?? 0.6,
        click: 0.35,
        crack: 0,
        pan: n.pan,
      });
    }
    snare(e, t, n = {}) {
      let r = this.out(e, n),
        i = n.peak ?? 0.4;
      return (
        this.tone(r, t, {
          f: 210,
          f1: 150,
          glide: 0.05,
          d: 0.12,
          peak: i * 0.5,
          type: `triangle`,
        }),
        this.noiseHit(r, t, {
          type: `bandpass`,
          f: n.f ?? 2400,
          q: 0.6,
          d: n.d ?? 0.22,
          peak: i,
        })
      );
    }
    shaker(e, t, n = {}) {
      return this.noiseHit(e, t, {
        type: `highpass`,
        f: n.f ?? 6500,
        q: 0.8,
        a: n.a ?? 0.012,
        d: n.d ?? 0.07,
        peak: n.peak ?? 0.08,
        pan: n.pan,
      });
    }
    cymbal(e, t, n = {}) {
      let r = this.out(e, n),
        i = this.gain(r, 0),
        a = this.filter(i, `highpass`, n.f ?? 3500, 0.7),
        o = n.d ?? 2.2,
        s = n.peak ?? 0.2,
        c = n.swell
          ? this.swell(i.gain, t, s, n.swell, 0, 0.12)
          : this.perc(i.gain, t, s, 0.002, o),
        l = this.filter(a, `bandpass`, 8e3, 0.6);
      for (let e of [205.3, 304.4, 369.6, 522.7, 540, 800])
        this.osc(l, t, c - t + 0.02, `square`, e * 1.7);
      return (this.noise(a, t, c - t + 0.02, `white`, 1), c);
    }
    splash(e, t, n = {}) {
      let r = n.size ?? 1,
        i = n.peak ?? 0.5,
        a = this.out(e, n),
        o = {
          type: `bandpass`,
          f: 2800 / Math.sqrt(r),
          f1: 650 / r,
          glide: 0.25 * r,
          q: 1.1,
          a: 0.004,
          d: 0.45 * r,
          peak: i,
        },
        s = this.noiseHit(a, t, o);
      return (
        (s = Math.max(
          s,
          this.noiseHit(a, t, {
            type: `lowpass`,
            f: 900,
            q: 0.8,
            d: 0.25 * r,
            peak: i * 0.6,
            color: `brown`,
          }),
        )),
        (s = Math.max(
          s,
          this.noiseHit(a, t + 0.02, {
            type: `highpass`,
            f: 5e3,
            q: 0.7,
            a: 0.01,
            d: 0.5 * r,
            peak: i * 0.25,
          }),
        )),
        (s = Math.max(
          s,
          this.bubbles(a, t + 0.05, {
            count: Math.round(6 * r),
            dur: 0.5 * r,
            peak: i * 0.18,
          }),
        )),
        s
      );
    }
    bubbles(e, t, n = {}) {
      let r = t,
        i = n.count ?? 6;
      for (let a = 0; a < i; a++) {
        let i = t + M() * (n.dur ?? 0.5),
          a = N(n.fMin ?? 350, n.fMax ?? 1300),
          o = {
            f: a,
            f1: a * N(1.6, 2.6),
            glide: N(0.015, 0.04),
            d: N(0.03, 0.08),
            peak: (n.peak ?? 0.08) * N(0.4, 1),
          };
        r = Math.max(r, this.tone(e, i, { ...o, pan: N(-0.7, 0.7) }));
      }
      return r;
    }
    zap(e, t, n = {}) {
      let r = this.out(e, n),
        i = n.dur ?? 0.25,
        a = n.f0 ?? 1800,
        o = n.f1 ?? 300,
        s = n.peak ?? 0.2,
        c = {
          f: a,
          f1: o,
          glide: i,
          ratio: n.ratio ?? 1.414,
          index: n.index ?? 5,
          indexEnd: 0.5,
          d: i,
          peak: s,
          type: n.type || `sine`,
        },
        l = this.fm(r, t, c);
      return (
        this.noiseHit(r, t, {
          type: `bandpass`,
          f: a,
          f1: o,
          glide: i,
          q: 2,
          d: i * 0.8,
          peak: s * 0.8,
        }),
        l
      );
    }
    shatter(e, t, n = {}) {
      let r = n.count ?? 12,
        i = n.dur ?? 0.7,
        a = this.out(e, n),
        o = t,
        s = this.bankIfReady(`glass`);
      if (s) {
        let e = this.gain(a, (n.peak ?? 0.08) * 0.95);
        for (let a = 0; a < r; a++) {
          let r = t + M() ** 1.8 * i,
            a = w(N(n.fMin ?? 2200, n.fMax ?? 6500) / s.f, 0.5, 3.2),
            c = (Math.floor(M() * s.slots) % s.slots) * s.slotLen;
          o = Math.max(
            o,
            this.buffer(e, r, s.buf, { rate: a, offset: c, dur: s.slotLen }),
          );
        }
      } else
        for (let e = 0; e < r; e++) {
          let e = t + M() ** 1.8 * i,
            r = {
              f: N(n.fMin ?? 2200, n.fMax ?? 6500),
              ratios: [1, 2.41, 3.93],
              d: N(0.08, 0.35),
              peak: (n.peak ?? 0.08) * N(0.4, 1),
              pan: N(-0.8, 0.8),
            };
          o = Math.max(o, this.bell(a, e, r));
        }
      return (
        (o = Math.max(
          o,
          this.noiseHit(a, t, {
            type: `highpass`,
            f: 4500,
            q: 0.7,
            d: i * 0.6,
            peak: (n.peak ?? 0.08) * 2.2,
          }),
        )),
        o
      );
    }
    chain(e, t, n = {}) {
      let r = n.count ?? 10,
        i = n.dur ?? 0.3,
        a = this.out(e, n),
        o = t,
        s = this.bankIfReady(`clink`);
      if (s) {
        let e = this.gain(a, (n.peak ?? 0.12) * 1.25);
        for (let n = 0; n < r; n++) {
          let a = t + (n / r) * i + N(0, i / r),
            c = w(N(2200, 4200) / s.f, 0.6, 1.6),
            l = (Math.floor(M() * s.slots) % s.slots) * s.slotLen;
          o = Math.max(
            o,
            this.buffer(e, a, s.buf, { rate: c, offset: l, dur: s.slotLen }),
          );
        }
        return o;
      }
      for (let e = 0; e < r; e++) {
        let s = t + (e / r) * i + N(0, i / r);
        ((o = Math.max(
          o,
          this.bell(a, s, {
            f: N(2200, 4200),
            ratios: [1, 1.73, 2.9],
            d: N(0.03, 0.09),
            peak: (n.peak ?? 0.12) * N(0.5, 1),
          }),
        )),
          this.noiseHit(a, s, {
            type: `highpass`,
            f: 3e3,
            d: 0.01,
            peak: (n.peak ?? 0.12) * 0.6,
          }));
      }
      return o;
    }
    pad(e, t, n = {}) {
      let r = n.notes || [50, 57, 62],
        i = this.gain(e, 0),
        a = this.filter(i, `lowpass`, n.cutoff ?? 1200, 0.5),
        o = this.asr(
          i.gain,
          t,
          n.peak ?? 0.08,
          n.a ?? 0.8,
          n.dur ?? 2,
          n.r ?? 1.6,
        );
      n.cutoff2 &&
        (a.frequency.setValueAtTime(n.cutoff ?? 1200, t),
        a.frequency.linearRampToValueAtTime(
          n.cutoff2,
          t + (n.a ?? 0.8) + (n.dur ?? 2) * 0.6,
        ));
      let s = this.wave(n.wave || `warm`),
        c = this.mod(t, o - t, N(0.15, 0.3), 4),
        l = this.pan(a, -(n.spread ?? 0.45)),
        u = this.pan(a, n.spread ?? 0.45);
      for (let e = 0; e < r.length; e++) {
        let n = e % 2 ? u : l;
        for (let i of [-6, 5]) {
          let a = this.osc(n, t, o - t + 0.02, s, E(r[e]), i + (M() - 0.5) * 3);
          i < 0 && c.connect(a.detune);
        }
      }
      return o;
    }
  },
  Ie = {
    ah: [
      [760, 1, 5],
      [1180, 0.55, 7],
      [2800, 0.2, 9],
    ],
    oo: [
      [350, 1, 6],
      [800, 0.35, 8],
      [2700, 0.08, 10],
    ],
    oh: [
      [500, 1, 6],
      [900, 0.45, 8],
      [2600, 0.12, 10],
    ],
    eh: [
      [560, 1, 6],
      [1750, 0.5, 8],
      [2600, 0.18, 10],
    ],
  },
  Le = class {
    constructor(e) {
      this.value = e;
    }
    setValueAtTime() {
      return this;
    }
    linearRampToValueAtTime() {
      return this;
    }
    exponentialRampToValueAtTime() {
      return this;
    }
    setTargetAtTime() {
      return this;
    }
    cancelScheduledValues() {
      return this;
    }
    cancelAndHoldAtTime() {
      return this;
    }
  },
  I = class {
    constructor(e) {
      ((this.context = e), e.nodes++);
    }
    connect(e) {
      return e;
    }
    disconnect() {}
  },
  Re = class extends I {
    constructor(e) {
      (super(e), (this.startT = 0), (this.stopT = null), e.sources.push(this));
    }
    start(e) {
      this.startT = Number(e) || 0;
    }
    stop(e) {
      this.stopT = e;
    }
  },
  ze = class {
    constructor() {
      ((this.__audioStore = `null`),
        (this.sampleRate = 3e3),
        (this.currentTime = 0),
        (this.state = `running`),
        (this.nodes = 0),
        (this.sources = []),
        (this.destination = new I(this)));
    }
    createGain() {
      return L(new I(this), { gain: 1 });
    }
    createBiquadFilter() {
      return L(new I(this), { frequency: 350, Q: 1, gain: 0, detune: 0 });
    }
    createStereoPanner() {
      return L(new I(this), { pan: 0 });
    }
    createWaveShaper() {
      return new I(this);
    }
    createConvolver() {
      return new I(this);
    }
    createDynamicsCompressor() {
      return L(new I(this), {
        threshold: 0,
        knee: 0,
        ratio: 0,
        attack: 0,
        release: 0,
      });
    }
    createDelay() {
      return L(new I(this), { delayTime: 0 });
    }
    createOscillator() {
      let e = L(new Re(this), { frequency: 440, detune: 0 });
      return ((e.type = `sine`), (e.setPeriodicWave = () => {}), e);
    }
    createBufferSource() {
      return L(new Re(this), { playbackRate: 1 });
    }
    createBuffer(e, t, n) {
      let r = Array.from(
        { length: e },
        () => new Float32Array(Math.min(t, 64)),
      );
      return {
        numberOfChannels: e,
        length: t,
        sampleRate: n,
        duration: t / n,
        getChannelData: (e) => r[e],
        copyToChannel() {},
      };
    }
    createPeriodicWave() {
      return {};
    }
    createChannelSplitter() {
      return new I(this);
    }
    createChannelMerger() {
      return new I(this);
    }
    peakSources(e = 0) {
      let t = [];
      for (let n of this.sources) {
        let r = n.stopT ?? n.startT + 30;
        r - n.startT < e || (t.push([n.startT, 1]), t.push([r, -1]));
      }
      t.sort((e, t) => e[0] - t[0] || e[1] - t[1]);
      let n = 0,
        r = 0;
      for (let [, e] of t) ((n += e), n > r && (r = n));
      return r;
    }
  };
function L(e, t) {
  for (let n in t) e[n] = new Le(t[n]);
  return e;
}
var Be = Object.freeze({
    master: 0.9,
    music: 0.62,
    sfx: 0.9,
    ambience: 0.7,
    ui: 0.75,
  }),
  Ve = { seconds: 1.3, decay: 2.8, damping: 0.65, seed: 5 },
  He = { seconds: 2.4, decay: 2.3, damping: 0.55, seed: 11 },
  Ue = [`music`, `sfx`, `amb`],
  We = {
    thresholdDb: -32,
    fullDb: -18,
    maxDuckDb: -9,
    climaxDuckDb: -5,
    fastMix: 0.3,
    slowMix: 0.7,
  },
  Ge = class {
    constructor(
      e,
      {
        volumes: t = Be,
        destination: n = null,
        reverbs: r = null,
        sidechain: i = !0,
      } = {},
    ) {
      this.ac = e;
      let a = (this.kit = new F(e)),
        o = (e, t = 1) => a.gain(e, t);
      this.volumes = { ...Be, ...t };
      let s = n || e.destination;
      ((this.clipper = e.createWaveShaper()),
        (this.clipper.curve = je(0.8, 0.985)),
        (this.clipper.oversample = `none`),
        (this.limiter = e.createDynamicsCompressor()),
        $e(this.limiter, {
          threshold: -4,
          knee: 0,
          ratio: 20,
          attack: 0.001,
          release: 0.09,
        }),
        (this.glue = e.createDynamicsCompressor()),
        $e(this.glue, {
          threshold: -20,
          knee: 12,
          ratio: 2.6,
          attack: 0.008,
          release: 0.22,
        }),
        (this.trim = o(this.limiter, 0.62)),
        this.glue.connect(this.trim),
        this.limiter.connect(this.clipper),
        this.clipper.connect(s),
        (this.dcBlock = a.filter(this.glue, `highpass`, 30, 0.6)),
        (this.mute = o(this.dcBlock, 1)),
        (this.pre = o(this.mute, this.volumes.master)),
        Ze(this.pre),
        Ze(this.mute),
        (this.room = e.createConvolver()),
        (this.room.normalize = !0),
        (this.hall = e.createConvolver()),
        (this.hall.normalize = !0),
        (this.roomIn = Qe(o(this.room))),
        (this.hallIn = Qe(o(this.hall))),
        (this.worldLP = a.filter(this.pre, `lowpass`, 2e4, 0.6)),
        this.room.connect(o(this.worldLP, 0.62)),
        (this.sfxVol = o(this.worldLP, this.volumes.sfx)),
        (this.sfxDuck = o(this.sfxVol)),
        (this.sfxIn = o(this.sfxDuck)),
        (this.sfxSendVol = o(this.roomIn, this.volumes.sfx)),
        (this.sfxSendDuck = o(this.sfxSendVol)),
        (this.sfxSend = o(this.sfxSendDuck)),
        (this.ambVol = o(this.worldLP, this.volumes.ambience)),
        (this.ambDuck = o(this.ambVol)),
        (this.ambIn = o(this.ambDuck)),
        (this.ambSendVol = o(this.roomIn, this.volumes.ambience * 1.13)),
        (this.ambSendDuck = o(this.ambSendVol)),
        (this.ambSend = o(this.ambSendDuck)),
        (this.musicVol = o(this.pre, this.volumes.music)),
        (this.musicDuck = o(this.musicVol)),
        (this.musicSide = o(this.musicDuck)),
        (this.musicLP = a.filter(this.musicSide, `lowpass`, 2e4, 0.5)),
        (this.musicIn = o(this.musicLP)),
        this.hall.connect(o(this.pre, 0.55)),
        (this.musicSendVol = o(this.hallIn, this.volumes.music)),
        (this.musicSendDuck = o(this.musicSendVol)),
        (this.musicSendSide = o(this.musicSendDuck)),
        (this.musicSendLP = a.filter(this.musicSendSide, `lowpass`, 2e4, 0.5)),
        (this.musicSend = o(this.musicSendLP)),
        (this.musicDelayIn = o(null)));
      let c = e.createDelay(2);
      c.delayTime.value = 0.469;
      let l = o(null, 0.34),
        u = a.filter(null, `lowpass`, 2600, 0.5),
        d = a.filter(null, `highpass`, 220, 0.5);
      (this.musicDelayIn.connect(c),
        c.connect(u),
        u.connect(d),
        d.connect(l),
        l.connect(c),
        d.connect(o(this.musicIn, 0.32)),
        d.connect(o(this.musicSend, 0.25)),
        (this.musicDelay = c),
        (this.musicDelaySend = this.musicDelayIn),
        (this.annVol = o(this.pre, this.volumes.sfx)),
        (this.annIn = o(this.annVol)),
        (this.annSendVol = o(this.hallIn, this.volumes.sfx * 0.91)),
        (this.annSend = o(this.annSendVol)),
        (this.uiVol = o(this.pre, this.volumes.ui)),
        (this.uiIn = o(this.uiVol)),
        (this.uiSendVol = o(this.roomIn, this.volumes.ui * 1.16)),
        (this.uiSend = o(this.uiSendVol)));
      let f = [this.musicSide.gain, this.musicSendSide.gain];
      ((this.sidechain = i ? qe(e, a, this.sfxVol, f) : null),
        (this.sidechainDepth = 1),
        (this.ducks = { music: [], sfx: [], amb: [] }),
        (this.duckLevel = { music: 1, sfx: 1, amb: 1 }),
        (this.muffled = !1),
        (this.muted = !1),
        (this.reverbsReady = !1),
        (r === `sync` || (r == null && k(e))) && this.loadReverbs());
    }
    busFor(e) {
      return e === `ui`
        ? this.uiIn
        : e === `announcer`
          ? this.annIn
          : e === `ambience`
            ? this.ambIn
            : e === `music`
              ? this.musicIn
              : this.sfxIn;
    }
    sendFor(e) {
      return e === `ui`
        ? this.uiSend
        : e === `announcer`
          ? this.annSend
          : e === `ambience`
            ? this.ambSend
            : e === `music`
              ? this.musicSend
              : this.sfxSend;
    }
    loadReverbs() {
      this.reverbsReady ||=
        ((this.room.buffer = Oe(this.ac, Ve)),
        (this.hall.buffer = Oe(this.ac, He)),
        !0);
    }
    attachReverbsIfReady() {
      return this.reverbsReady
        ? !0
        : !Ae(this.ac, Ve) || !Ae(this.ac, He)
          ? !1
          : (this.loadReverbs(), !0);
    }
    stepReverbs(e) {
      if (this.reverbsReady) return !0;
      if (!this.room.buffer) {
        let t = ke(this.ac, Ve, e);
        return (t && (this.room.buffer = t), !1);
      }
      if (!this.hall.buffer) {
        let t = ke(this.ac, He, e);
        return (
          t && ((this.hall.buffer = t), (this.reverbsReady = !0)),
          this.reverbsReady
        );
      }
      return ((this.reverbsReady = !0), !0);
    }
    setVolume(e, t) {
      ((t = w(Number(t) || 0, 0, 1.5)), (this.volumes[e] = t));
      let n = this.ac.currentTime,
        r = {
          master: [[this.pre, 1]],
          music: [
            [this.musicVol, 1],
            [this.musicSendVol, 1],
          ],
          sfx: [
            [this.sfxVol, 1],
            [this.sfxSendVol, 1],
            [this.annVol, 1],
            [this.annSendVol, 0.91],
          ],
          ambience: [
            [this.ambVol, 1],
            [this.ambSendVol, 1.13],
          ],
          ui: [
            [this.uiVol, 1],
            [this.uiSendVol, 1.16],
          ],
        };
      for (let [i, a] of r[e] || []) P(i.gain, t * a, n, 0.04);
    }
    setMuted(e) {
      ((this.muted = !!e),
        P(this.mute.gain, +!this.muted, this.ac.currentTime, 0.03));
    }
    setMuffle(e) {
      if (this.muffled === !!e) return;
      this.muffled = !!e;
      let t = this.ac.currentTime;
      P(this.worldLP.frequency, e ? 700 : 2e4, t, e ? 0.18 : 0.5);
      for (let n of [this.musicLP, this.musicSendLP])
        P(n.frequency, e ? 1500 : 2e4, t, e ? 0.3 : 0.8);
    }
    setSidechainDepth(e, t = this.ac.currentTime) {
      this.sidechain &&
        ((e = w(Number(e), 0, 1)),
        !(Math.abs(e - this.sidechainDepth) < 0.01) &&
          ((this.sidechainDepth = e),
          P(this.sidechain.depth.gain, e, t, 0.25)));
    }
    duck(e, t, n = 1, r = 0.05, i = 0.8) {
      let a = this.ducks[e];
      if (!a) return;
      let o = this.ac.currentTime;
      (a.push({
        level: w(t, 0.02, 1),
        until: o + r + n,
        attack: r,
        release: i,
      }),
        this.updateDucks(o, !0));
    }
    updateDucks(e, t = !1) {
      let n = Ue;
      for (let r = 0; r < n.length; r++) {
        let i = n[r],
          a = this.ducks[i],
          o = 1,
          s = 0.05,
          c = 0.8;
        for (let t = a.length - 1; t >= 0; t--) {
          let n = a[t];
          if (e > n.until) {
            ((c = Math.max(c, n.release)), a.splice(t, 1));
            continue;
          }
          n.level < o && ((o = n.level), (s = n.attack));
        }
        let l = Math.abs(o - this.duckLevel[i]) > 0.001;
        if (!t && !l) continue;
        let u =
            i === `music`
              ? [this.musicDuck, this.musicSendDuck]
              : i === `sfx`
                ? [this.sfxDuck, this.sfxSendDuck]
                : [this.ambDuck, this.ambSendDuck],
          d = o < this.duckLevel[i];
        if (l) for (let t of u) P(t.gain, o, e, d ? s / 3 : c / 3);
        this.duckLevel[i] = o;
      }
    }
  };
function Ke(e) {
  let t = 1 - 10 ** (We.maxDuckDb / 20),
    n = 1 - 10 ** (We.climaxDuckDb / 20);
  return 1 - w(e, 0, 1) * (1 - n / t);
}
function qe(e, t, n, r) {
  let i = We,
    a = Qe(t.gain(null, 1));
  n.connect(a);
  let o = e.createWaveShaper();
  ((o.curve = Ye()), (o.oversample = `none`), a.connect(o));
  let s = Je(e, 5),
    c = Je(e, 0.45);
  (o.connect(s), s.connect(c));
  let l = 0.5 / 10 ** (i.fullDb / 10),
    u = t.gain(null, i.fastMix * l),
    d = t.gain(null, i.slowMix * l);
  (s.connect(u), c.connect(d));
  let f = e.createWaveShaper();
  ((f.curve = Xe(l)), (f.oversample = `none`), u.connect(f), d.connect(f));
  let p = Je(e, 14);
  f.connect(p);
  let m = t.gain(null, 1);
  p.connect(m);
  for (let e of r) m.connect(e);
  return { tap: a, duck: f, smooth: p, depth: m, G: l };
}
function Je(e, t, n = 0.5) {
  let r = e.createBiquadFilter();
  return ((r.type = `lowpass`), (r.frequency.value = t), (r.Q.value = n), r);
}
function Ye() {
  let e = 2049,
    t = new Float32Array(e);
  for (let n = 0; n < e; n++) {
    let e = (n / 2048) * 2 - 1;
    t[n] = e * e;
  }
  return t;
}
function Xe(e) {
  let t = We,
    n = 16385,
    r = new Float32Array(n),
    i = t.fullDb - t.thresholdDb;
  for (let a = 0; a < n; a++) {
    let n = (a / 16384) * 2 - 1;
    if (n <= 0) {
      r[a] = 0;
      continue;
    }
    let o = w((10 * Math.log10(n / e) - t.thresholdDb) / i, 0, 1),
      s = o * o * (3 - 2 * o);
    r[a] = 10 ** ((t.maxDuckDb * s) / 20) - 1;
  }
  return r;
}
function Ze(e) {
  return (
    (e.channelCount = 2),
    (e.channelCountMode = `explicit`),
    (e.channelInterpretation = `speakers`),
    e
  );
}
function Qe(e) {
  return (
    (e.channelCount = 1),
    (e.channelCountMode = `explicit`),
    (e.channelInterpretation = `speakers`),
    e
  );
}
function $e(e, t) {
  for (let n in t)
    try {
      e[n].value = t[n];
    } catch {}
}
var R = (e, t = {}) => ({
    fn: e,
    cat: `sfx`,
    prio: 40,
    gain: 1,
    verb: 0.12,
    ...t,
  }),
  z = Math.max,
  B = (e) => (e.team ?? 0) === 0;
function et(e, t, n, r) {
  let i = N(0.88, 1.12),
    a = w((r.amount || 120) / 160, 0.6, 1.4),
    o = e.thump(t, n, {
      f0: 150 * i,
      f1: 52,
      drop: 0.07,
      d: 0.22 * a,
      peak: 0.5 * a,
      click: 0.3,
    });
  return (
    (o = z(
      o,
      e.body(t, n, { peak: 0.3 * a, f: 280 * i, d: 0.1, crackF: 1900 * i }),
    )),
    (o = z(
      o,
      e.noiseHit(t, n, {
        color: `pink`,
        type: `lowpass`,
        f: 2600 * i,
        f1: 450,
        glide: 0.07,
        q: 0.9,
        d: 0.13,
        peak: 0.45 * a,
      }),
    )),
    (o = z(
      o,
      e.noiseHit(t, n, {
        type: `bandpass`,
        f: 1150 * i,
        q: 1.6,
        d: 0.05,
        peak: 0.3 * a,
      }),
    )),
    o
  );
}
function tt(e, t, n, r) {
  let i = w((r.amount || 120) / 160, 0.6, 1.4),
    a = e.fm(t, n, {
      f: N(680, 920),
      ratio: 2.41,
      index: 3,
      indexEnd: 0.2,
      d: 0.26,
      peak: 0.2 * i,
    });
  return (
    (a = z(
      a,
      e.noiseHit(t, n, {
        type: `bandpass`,
        f: 3300,
        f1: 1300,
        glide: 0.12,
        q: 3,
        d: 0.18,
        peak: 0.34 * i,
      }),
    )),
    (a = z(
      a,
      e.thump(t, n, {
        f0: 230,
        f1: 95,
        drop: 0.07,
        d: 0.14,
        peak: 0.3 * i,
        click: 0,
      }),
    )),
    (a = z(
      a,
      e.sparkle(t, n, {
        dur: 0.2,
        count: 4,
        fMin: 2600,
        fMax: 6200,
        peak: 0.05 * i,
        d: 0.15,
      }),
    )),
    a
  );
}
function nt(e, t, n, r) {
  let i = w((r.amount || 100) / 140, 0.6, 1.3),
    a = e.bell(t, n, {
      f: N(1700, 1950),
      ratios: [1, 2.32, 4.25],
      d: 0.35,
      peak: 0.12 * i,
    });
  return (
    (a = z(
      a,
      e.noiseHit(t, n, { type: `highpass`, f: 3800, d: 0.05, peak: 0.3 * i }),
    )),
    (a = z(
      a,
      e.thump(t, n, {
        f0: 260,
        f1: 120,
        drop: 0.05,
        d: 0.1,
        peak: 0.22 * i,
        click: 0,
      }),
    )),
    a
  );
}
function rt(e, t, n, r) {
  let i = e.thump(t, n, {
    f0: 170,
    f1: 48,
    drop: 0.08,
    d: 0.34,
    peak: 0.7,
    click: 0.45,
  });
  return (
    (i = z(i, e.body(t, n, { peak: 0.34, f: 340, d: 0.1, crackF: 2600 }))),
    (i = z(
      i,
      e.noiseHit(t, n, {
        color: `pink`,
        type: `lowpass`,
        f: 4200,
        f1: 400,
        glide: 0.1,
        d: 0.2,
        peak: 0.55,
      }),
    )),
    (i = z(
      i,
      e.noiseHit(t, n, { type: `highpass`, f: 3e3, d: 0.06, peak: 0.5 }),
    )),
    (i = z(
      i,
      e.fm(t, n + 0.01, {
        f: 1320,
        f1: 1760,
        glide: 0.05,
        ratio: 3.5,
        index: 2.5,
        d: 0.45,
        peak: 0.13,
      }),
    )),
    (i = z(
      i,
      e.bell(t, n + 0.01, {
        f: 2640,
        ratios: [1, 2.02, 3.1],
        d: 0.5,
        peak: 0.08,
        pan: N(-0.2, 0.2),
      }),
    )),
    i
  );
}
function it(e, t, n) {
  let r = e.noiseHit(t, n, {
    type: `bandpass`,
    f: N(1400, 2200),
    q: 1.6,
    d: 0.06,
    peak: 0.36,
  });
  return (
    (r = z(
      r,
      e.tone(t, n, {
        type: `triangle`,
        f: 320,
        f1: 160,
        glide: 0.04,
        d: 0.07,
        peak: 0.05,
      }),
    )),
    r
  );
}
function at(e, t, n) {
  let r = N(0.94, 1.06),
    i = e.noiseHit(t, n, { type: `highpass`, f: 3600, d: 0.02, peak: 0.42 });
  return (
    (i = z(
      i,
      e.pluck(t, n + 0.003, {
        f: 98 * r,
        t60: 0.32,
        bright: 0.95,
        peak: 0.5,
        lp: 3600,
      }),
    )),
    (i = z(
      i,
      e.tone(t, n + 0.003, {
        type: `triangle`,
        f: 215 * r,
        f1: 118,
        glide: 0.07,
        d: 0.13,
        peak: 0.24,
      }),
    )),
    (i = z(
      i,
      e.thump(t, n, {
        f0: 165,
        f1: 72,
        drop: 0.05,
        d: 0.12,
        peak: 0.36,
        click: 0,
      }),
    )),
    (i = z(
      i,
      e.whoosh(t, n + 0.012, {
        dur: 0.16,
        f0: 2800,
        f1: 1500,
        f2: 700,
        q: 2.6,
        peak: 0.2,
        peakAt: 0.22,
        color: `white`,
      }),
    )),
    (i = z(
      i,
      e.bell(t, n + 0.006, {
        f: 2350 * r,
        ratios: [1, 2.1, 3.3],
        d: 0.24,
        peak: 0.045,
      }),
    )),
    i
  );
}
function ot(e, t, n, r) {
  let i = e.thump(t, n, {
    f0: 190,
    f1: 70,
    drop: 0.05,
    d: 0.13,
    peak: 0.42,
    click: 0.3,
  });
  return (
    (i = z(i, e.body(t, n, { peak: 0.2, f: 380, d: 0.07, crack: 0.6 }))),
    (i = z(
      i,
      e.noiseHit(t, n, {
        type: `bandpass`,
        f: 1600,
        q: 2,
        d: 0.06,
        peak: 0.38,
      }),
    )),
    (i = z(
      i,
      e.bell(t, n, { f: N(1900, 2200), ratios: [1, 2.4], d: 0.2, peak: 0.05 }),
    )),
    r.crit && (i = z(i, rt(e, t, n, r))),
    i
  );
}
function st(e, t, n) {
  let r = N(0.95, 1.05),
    i = e.fm(t, n, {
      f: 420 * r,
      f1: 880 * r,
      glide: 0.12,
      ratio: 1.5,
      index: 2.4,
      indexEnd: 0.3,
      a: 0.006,
      d: 0.3,
      peak: 0.22,
    });
  return (
    (i = z(
      i,
      e.tone(t, n, {
        f: 660 * r,
        f1: 1320 * r,
        glide: 0.1,
        d: 0.22,
        peak: 0.1,
        vib: [18, 30],
      }),
    )),
    (i = z(
      i,
      e.whoosh(t, n, {
        dur: 0.22,
        f0: 900,
        f1: 2600,
        f2: 1200,
        q: 3,
        peak: 0.14,
        peakAt: 0.3,
      }),
    )),
    (i = z(
      i,
      e.sparkle(t, n + 0.02, {
        dur: 0.3,
        count: 5,
        fMin: 2400,
        fMax: 5200,
        peak: 0.055,
      }),
    )),
    i
  );
}
function ct(e, t, n, r) {
  let i = e.noiseHit(t, n, {
    type: `bandpass`,
    f: 2500,
    f1: 900,
    glide: 0.15,
    q: 4,
    d: 0.2,
    peak: 0.34,
  });
  return (
    (i = z(
      i,
      e.fm(t, n, {
        f: 520,
        ratio: 3.01,
        index: 4,
        indexEnd: 0.3,
        d: 0.3,
        peak: 0.17,
      }),
    )),
    (i = z(
      i,
      e.thump(t, n, {
        f0: 270,
        f1: 110,
        drop: 0.06,
        d: 0.12,
        peak: 0.3,
        click: 0,
      }),
    )),
    (i = z(
      i,
      e.sparkle(t, n, {
        dur: 0.25,
        count: 5,
        fMin: 3e3,
        fMax: 7e3,
        peak: 0.045,
      }),
    )),
    i
  );
}
function lt(e, t, n) {
  return e.whoosh(t, n, {
    dur: 0.32,
    f0: 170,
    f1: 720,
    f2: 240,
    q: 1.1,
    peak: 0.42,
    peakAt: 0.72,
    pan0: -0.25,
    pan1: 0.25,
  });
}
function ut(e, t, n, r) {
  let i = e.thump(t, n, {
    f0: 115,
    f1: 40,
    drop: 0.1,
    d: 0.42,
    peak: 0.504,
    click: 0.3,
  });
  return (
    (i = z(i, e.body(t, n, { peak: 0.44, d: 0.14, crackF: 1700 }))),
    (i = z(
      i,
      e.noiseHit(t, n, {
        color: `pink`,
        type: `lowpass`,
        f: 1900,
        f1: 300,
        glide: 0.12,
        d: 0.26,
        peak: 0.55,
      }),
    )),
    (i = z(
      i,
      e.noiseHit(t, n, {
        type: `bandpass`,
        f: 720,
        q: 1,
        d: 0.08,
        peak: 0.652,
      }),
    )),
    (i = z(
      i,
      e.crackle(t, n + 0.01, {
        dur: 0.35,
        f: 2200,
        q: 0.8,
        peak: 0.45,
        rate: 0.8,
      }),
    )),
    (i = z(
      i,
      e.crackle(t, n + 0.03, {
        dur: 0.5,
        f: 5200,
        q: 0.9,
        peak: 0.15,
        rate: 1.3,
      }),
    )),
    (i = z(
      i,
      e.bell(t, n, { f: 520, ratios: [1, 2.76, 5.4], d: 0.3, peak: 0.06 }),
    )),
    r.crit && (i = z(i, rt(e, t, n, r))),
    i
  );
}
function dt(e, t, n) {
  return z(
    e.whoosh(t, n, {
      dur: 0.09,
      f0: 3e3,
      f1: 6500,
      f2: 2500,
      q: 1.5,
      peak: 0.26,
      pan0: -0.3,
      pan1: 0.3,
      color: `white`,
    }),
    e.whoosh(t, n + 0.07, {
      dur: 0.09,
      f0: 2800,
      f1: 6e3,
      f2: 2400,
      q: 1.5,
      peak: 0.22,
      pan0: 0.3,
      pan1: -0.3,
      color: `white`,
    }),
  );
}
function ft(e, t, n, r) {
  let i = e.bell(t, n, {
    f: N(3e3, 3300),
    ratios: [1, 1.51, 2.37, 3.1],
    d: 0.22,
    peak: 0.1,
  });
  return (
    (i = z(
      i,
      e.noiseHit(t, n, { type: `highpass`, f: 4500, d: 0.07, peak: 0.32 }),
    )),
    (i = z(
      i,
      e.thump(t, n, {
        f0: 210,
        f1: 90,
        drop: 0.05,
        d: 0.08,
        peak: 0.26,
        click: 0,
      }),
    )),
    (i = z(
      i,
      e.noiseHit(t, n, {
        color: `pink`,
        type: `bandpass`,
        f: 700,
        f1: 380,
        glide: 0.2,
        q: 3,
        d: 0.26,
        peak: 0.12,
      }),
    )),
    r.crit && (i = z(i, rt(e, t, n, r))),
    i
  );
}
function pt(e, t, n) {
  return z(
    e.chain(t, n, { count: 7, dur: 0.24, peak: 0.1 }),
    e.whoosh(t, n, {
      dur: 0.38,
      f0: 150,
      f1: 620,
      f2: 200,
      q: 1,
      peak: 0.42,
      peakAt: 0.76,
    }),
  );
}
function mt(e, t, n, r) {
  let i = e.thump(t, n, {
    f0: 95,
    f1: 38,
    drop: 0.12,
    d: 0.5,
    peak: 0.56,
    click: 0.25,
  });
  return (
    (i = z(i, e.body(t, n, { peak: 0.62, d: 0.14, crackF: 1500 }))),
    (i = z(
      i,
      e.noiseHit(t, n, {
        color: `brown`,
        type: `lowpass`,
        f: 900,
        f1: 200,
        glide: 0.15,
        d: 0.3,
        peak: 0.45,
      }),
    )),
    (i = z(
      i,
      e.bell(t, n, { f: 380, ratios: [1, 2.4, 3.9, 5.2], d: 0.45, peak: 0.1 }),
    )),
    (i = z(
      i,
      e.noiseHit(t, n + 0.01, {
        type: `bandpass`,
        f: 2800,
        f1: 900,
        glide: 0.25,
        q: 1.2,
        d: 0.3,
        peak: 0.319,
      }),
    )),
    (i = z(i, e.bubbles(t, n + 0.04, { count: 5, dur: 0.3, peak: 0.05 }))),
    r.crit && (i = z(i, rt(e, t, n, r))),
    i
  );
}
function ht(e, t, n, r) {
  let i = w((r.windup || 0.2) + 0.06, 0.14, 0.55);
  if (B(r)) {
    let r = e.fm(t, n, {
      f: 300,
      f1: 1250,
      glide: i,
      ratio: 2,
      index: 1.4,
      indexEnd: 4,
      indexGlide: i,
      swell: !0,
      a: i * 0.92,
      d: 0.06,
      peak: 0.16,
    });
    return (
      (r = z(
        r,
        e.tone(t, n, {
          f: 1800,
          f1: 3700,
          glide: i,
          swell: !0,
          a: i * 0.9,
          d: 0.05,
          peak: 0.06,
        }),
      )),
      z(
        r,
        e.crackle(t, n, { dur: i, f: 6e3, peak: 0.08, swell: !0, rate: 1.6 }),
      )
    );
  }
  let a = e.tone(t, n, {
    type: `sawtooth`,
    f: 90,
    f1: 260,
    glide: i,
    swell: !0,
    a: i * 0.9,
    d: 0.06,
    peak: 0.12,
    lp: 900,
  });
  return (
    (a = z(
      a,
      e.noiseHit(t, n, {
        color: `pink`,
        type: `bandpass`,
        f: 500,
        f1: 2200,
        glide: i,
        q: 1.4,
        swell: !0,
        a: i * 0.9,
        d: 0.06,
        peak: 0.18,
      }),
    )),
    z(a, e.crackle(t, n, { dur: i, f: 1800, peak: 0.16, swell: !0, rate: 0.9 }))
  );
}
function gt(e, t, n, r) {
  let i = e.thump(t, n, {
    f0: 145,
    f1: 44,
    drop: 0.12,
    d: 0.42,
    peak: 0.434,
    click: 0.35,
  });
  return (
    B(r)
      ? ((i = z(
          i,
          e.zap(t, n, { f0: 2500, f1: 320, dur: 0.34, index: 5, peak: 0.24 }),
        )),
        (i = z(
          i,
          e.noiseHit(t, n, {
            type: `bandpass`,
            f: 3100,
            f1: 800,
            glide: 0.25,
            q: 1.5,
            d: 0.3,
            peak: 0.493,
          }),
        )),
        (i = z(
          i,
          e.bell(t, n, {
            f: 1320,
            ratios: [1, 2.01, 3.02],
            d: 0.6,
            peak: 0.06,
          }),
        )))
      : ((i = z(
          i,
          e.noiseHit(t, n, {
            color: `pink`,
            type: `lowpass`,
            f: 3200,
            f1: 280,
            glide: 0.35,
            d: 0.45,
            peak: 0.5,
          }),
        )),
        (i = z(
          i,
          e.tone(e.shaper(t, 3), n, {
            type: `sawtooth`,
            f: 190,
            f1: 60,
            glide: 0.25,
            d: 0.3,
            peak: 0.12,
            lp: 1200,
          }),
        )),
        (i = z(i, e.crackle(t, n, { dur: 0.5, f: 2600, peak: 0.36 })))),
    i
  );
}
function _t(e, t, n, r) {
  let i = e.thump(t, n, {
    f0: 125,
    f1: 38,
    drop: 0.1,
    d: 0.45,
    peak: 0.462,
    click: 0.35,
  });
  return (
    (i = z(i, e.body(t, n, { peak: 0.25, crackF: 1800, d: 0.18 }))),
    (i = z(
      i,
      e.noiseHit(t, n, {
        color: `pink`,
        type: `lowpass`,
        f: 5200,
        f1: 380,
        glide: 0.25,
        d: 0.34,
        peak: 0.5,
      }),
    )),
    B(r)
      ? ((i = z(
          i,
          e.zap(t, n, { f0: 1900, f1: 220, dur: 0.25, index: 4, peak: 0.17 }),
        )),
        (i = z(
          i,
          e.sparkle(t, n, {
            dur: 0.3,
            count: 6,
            fMin: 3e3,
            fMax: 7e3,
            peak: 0.05,
          }),
        )))
      : (i = z(i, e.crackle(t, n, { dur: 0.6, f: 3e3, peak: 0.45 }))),
    i
  );
}
function vt(e, t, n, r) {
  let i = e.noiseHit(t, n, {
      type: `bandpass`,
      f: 1800,
      f1: 4200,
      glide: 0.2,
      q: 3,
      swell: !0,
      a: 0.18,
      d: 0.05,
      peak: 0.12,
    }),
    a = B(r) ? 1568 : 988,
    o = B(r) ? 1661 : 1047;
  for (let r = 0; r < 2; r++)
    ((i = z(
      i,
      e.fm(t, n + 0.18 + r * 0.11, {
        f: a,
        ratio: 2.01,
        index: 2.5,
        d: 0.22,
        peak: 0.13,
      }),
    )),
      (i = z(
        i,
        e.fm(t, n + 0.18 + r * 0.11, {
          f: o,
          ratio: 2.01,
          index: 2,
          d: 0.2,
          peak: 0.1,
        }),
      )));
  return z(
    i,
    e.thump(t, n + 0.18, {
      f0: 240,
      f1: 120,
      drop: 0.05,
      d: 0.12,
      peak: 0.25,
      click: 0.4,
      knock: 0.5,
    }),
  );
}
function yt(e, t, n) {
  let r = e.zap(t, n, { f0: 3600, f1: 900, dur: 0.5, index: 7, peak: 0.25 });
  return (
    (r = z(
      r,
      e.tone(t, n, {
        type: `sawtooth`,
        f: 880,
        d: 0.45,
        peak: 0.06,
        bp: 2400,
        q: 3,
      }),
    )),
    (r = z(
      r,
      e.noiseHit(t, n, { type: `highpass`, f: 2500, d: 0.4, peak: 0.25 }),
    )),
    z(r, e.thump(t, n, { f0: 200, f1: 70, d: 0.25, peak: 0.35 }))
  );
}
function bt(e, t, n) {
  return z(
    e.bell(t, n, { f: N(1800, 2600), ratios: [1, 2.7], d: 0.12, peak: 0.08 }),
    e.noiseHit(t, n, {
      type: `bandpass`,
      f: N(1e3, 1400),
      q: 1.2,
      d: 0.05,
      peak: 0.26,
    }),
  );
}
function xt(e, t, n, r) {
  return B(r)
    ? z(
        e.fm(t, n, {
          f: 1700,
          f1: 650,
          glide: 0.14,
          ratio: 1.5,
          index: 2,
          indexEnd: 0.4,
          d: 0.14,
          peak: 0.14,
        }),
        e.noiseHit(t, n, {
          type: `bandpass`,
          f: 2600,
          f1: 900,
          glide: 0.1,
          q: 1.5,
          d: 0.1,
          peak: 0.13,
        }),
      )
    : z(
        e.noiseHit(t, n, {
          type: `bandpass`,
          f: 1900,
          f1: 650,
          glide: 0.12,
          q: 1.3,
          d: 0.15,
          peak: 0.24,
        }),
        e.crackle(t, n, { dur: 0.15, f: 3e3, peak: 0.1 }),
      );
}
function St(e, t, n) {
  let r = e.thump(t, n, {
    f0: 115,
    f1: 40,
    drop: 0.09,
    d: 0.36,
    peak: 0.34,
    click: 0,
    knock: 0,
    crack: 1.8,
    crackF: 1700,
  });
  return (
    (r = z(
      r,
      e.noiseHit(t, n, {
        color: `pink`,
        type: `lowpass`,
        f: 2600,
        f1: 380,
        glide: 0.2,
        d: 0.3,
        peak: 0.42,
      }),
    )),
    z(r, e.crackle(t, n + 0.02, { dur: 0.22, f: 2e3, peak: 0.18 }))
  );
}
function Ct(e, t, n, r) {
  let i = r.subtype === `siege` || r.subtype === `super`,
    a = i ? 1.4 : 1,
    o = e.noiseHit(t, n, {
      type: `bandpass`,
      f: N(1e3, 1500),
      f1: 420,
      glide: 0.15,
      q: 0.9,
      d: 0.2 * a,
      peak: 0.3 * a,
    });
  return (
    (o = z(
      o,
      e.tone(t, n, {
        type: `triangle`,
        f: 200 / a,
        f1: 80 / a,
        glide: 0.06,
        d: 0.13 * a,
        peak: 0.12 * a,
      }),
    )),
    (o = z(
      o,
      e.crackle(t, n + 0.02, {
        dur: 0.22 * a,
        f: 2200,
        peak: 0.08 * a,
        rate: 0.8,
      }),
    )),
    (o = z(
      o,
      e.tone(t, n, {
        f: B(r) ? 960 : 700,
        f1: B(r) ? 420 : 260,
        glide: 0.16,
        d: 0.18,
        peak: 0.045,
      }),
    )),
    i &&
      (o = z(
        o,
        e.bell(t, n, { f: 440, ratios: [1, 2.6], d: 0.5, peak: 0.08 }),
      )),
    o
  );
}
function wt(e, t, n, r) {
  let i = e.thump(t, n, {
    f0: 95,
    f1: 45,
    drop: 0.1,
    d: 0.3,
    peak: 0.308,
    click: 0.2,
  });
  return (
    (i = z(i, e.body(t, n, { peak: 0.46, d: 0.14, crackF: 1500 }))),
    (i = z(
      i,
      e.noiseHit(t, n, {
        color: `pink`,
        type: `lowpass`,
        f: 1200,
        d: 0.15,
        peak: 0.3,
      }),
    )),
    z(
      i,
      e.fm(t, n, {
        f: N(58, 72),
        ratio: 0.5,
        index: 6,
        indexEnd: 3,
        d: 0.35,
        a: 0.02,
        peak: 0.08,
      }),
    )
  );
}
function Tt(e, t, n, r) {
  if (r.subtype === `abyssal_tyrant`) {
    let r = e.thump(t, n, {
      f0: 62,
      f1: 24,
      drop: 0.2,
      d: 0.8,
      peak: 0.85,
      click: 0.2,
    });
    return (
      (r = z(
        r,
        e.tone(e.shaper(t, 3), n, {
          type: `sawtooth`,
          f: 46,
          d: 0.6,
          peak: 0.12,
          lp: 320,
        }),
      )),
      (r = z(r, e.body(t, n, { peak: 0.5, crackF: 1200, d: 0.3, rate: 0.5 }))),
      z(
        r,
        e.whoosh(t, n, {
          dur: 0.5,
          f0: 120,
          f1: 600,
          f2: 100,
          q: 1.5,
          peak: 0.3,
          peakAt: 0.2,
          color: `brown`,
        }),
      )
    );
  }
  let i = e.noiseHit(t, n, { type: `highpass`, f: 2200, d: 0.16, peak: 0.45 });
  return (
    (i = z(i, e.body(t, n, { peak: 0.36, crackF: 1800, d: 0.25, rate: 0.8 }))),
    (i = z(i, e.rumble(t, n, { dur: 1.2, f: 300, peak: 0.4 }))),
    z(i, e.zap(t, n, { f0: 3200, f1: 400, dur: 0.3, index: 8, peak: 0.2 }))
  );
}
function Et(e, t, n) {
  let r = e.fm(t, n, {
    f: 140,
    f1: 60,
    glide: 0.5,
    ratio: 0.5,
    index: 5,
    d: 0.6,
    a: 0.02,
    peak: 0.17,
  });
  return (
    (r = z(
      r,
      e.body(t, n + 0.05, { peak: 0.22, f: 260, d: 0.16, crackF: 1400 }),
    )),
    (r = z(
      r,
      e.thump(t, n + 0.05, { f0: 90, f1: 40, drop: 0.15, d: 0.5, peak: 0.35 }),
    )),
    z(
      r,
      e.noiseHit(t, n + 0.05, {
        color: `pink`,
        type: `lowpass`,
        f: 900,
        d: 0.4,
        peak: 0.28,
      }),
    )
  );
}
function Dt(e, t, n, r) {
  let i = e.gain(t, 1),
    a = e.filter(i, `bandpass`, 700, 3),
    o = e.filter(i, `bandpass`, 1150, 4),
    s = e.gain(null, 1);
  (s.connect(a), s.connect(o));
  let c = e.tone(s, n, {
    type: `sawtooth`,
    f: 115,
    f1: 52,
    glide: 1.8,
    a: 0.08,
    h: 0.9,
    r: 1.2,
    peak: 0.28,
    vib: [6, 40],
  });
  return (
    (c = z(
      c,
      e.tone(s, n, {
        type: `sawtooth`,
        f: 172,
        f1: 70,
        glide: 1.8,
        a: 0.1,
        h: 0.8,
        r: 1.2,
        peak: 0.2,
        vib: [5.3, 45],
      }),
    )),
    (c = z(c, e.rumble(t, n, { dur: 2.6, f: 140, peak: 0.468 }))),
    (c = z(
      c,
      e.thump(t, n + 0.9, { f0: 70, f1: 26, drop: 0.25, d: 1.3, peak: 0.595 }),
    )),
    (c = z(
      c,
      e.crackle(t, n + 0.9, { dur: 1.4, f: 1800, peak: 0.42, rate: 0.7 }),
    )),
    r.subtype === `abyssal_tyrant`
      ? ((c = z(
          c,
          e.fm(t, n + 0.6, {
            f: 44,
            f1: 30,
            glide: 1.4,
            ratio: 0.5,
            index: 6,
            a: 0.2,
            d: 1.8,
            peak: 0.12,
          }),
        )),
        (c = z(
          c,
          e.choir(t, n + 0.95, {
            notes: [38, 41, 44],
            a: 0.15,
            dur: 0.7,
            r: 1.6,
            peak: 0.05,
            vowel: `oo`,
          }),
        )))
      : ((c = z(
          c,
          e.zap(t, n + 0.9, {
            f0: 4200,
            f1: 500,
            dur: 0.45,
            index: 8,
            peak: 0.13,
          }),
        )),
        (c = z(
          c,
          e.zap(t, n + 1.25, {
            f0: 3e3,
            f1: 350,
            dur: 0.35,
            index: 6,
            peak: 0.09,
          }),
        )),
        (c = z(
          c,
          e.noiseHit(t, n + 0.9, {
            type: `highpass`,
            f: 2200,
            a: 0.001,
            d: 0.2,
            peak: 0.3,
          }),
        ))),
    c
  );
}
function Ot(e, t, n) {
  let r = e.thump(t, n, {
    f0: 92,
    f1: 40,
    drop: 0.12,
    d: 0.4,
    peak: 0.42,
    click: 0.2,
    crackF: 1300,
  });
  return (
    (r = z(
      r,
      e.noiseHit(t, n, {
        color: `pink`,
        type: `bandpass`,
        f: 520,
        q: 3.5,
        d: 0.22,
        peak: 0.5,
      }),
    )),
    (r = z(
      r,
      e.tone(t, n, {
        type: `triangle`,
        f: 210,
        f1: 140,
        glide: 0.08,
        d: 0.2,
        peak: 0.12,
      }),
    )),
    (r = z(
      r,
      e.noiseHit(t, n + 0.02, {
        type: `highpass`,
        f: 3200,
        swell: !0,
        a: 0.04,
        d: 0.25,
        peak: 0.12,
      }),
    )),
    z(r, e.crackle(t, n, { dur: 0.3, f: 1600, q: 1, peak: 0.25, rate: 0.6 }))
  );
}
function kt(e, t, n) {
  let r = e.shaper(e.filter(t, `bandpass`, 520, 2.5), 2.5),
    i = e.fm(r, n, {
      f: 78,
      ratio: 0.5,
      index: 7,
      indexEnd: 3,
      a: 0.03,
      d: 0.4,
      peak: 0.1,
    }),
    a = n + 0.05;
  return (
    (i = z(
      i,
      e.thump(t, a, {
        f0: 110,
        f1: 42,
        drop: 0.1,
        d: 0.35,
        peak: 0.45,
        click: 0.3,
        crackF: 1700,
      }),
    )),
    (i = z(i, e.body(t, a, { peak: 0.35, crackF: 1500, d: 0.16 }))),
    (i = z(i, e.crackle(t, a, { dur: 0.45, f: 3200, peak: 0.28, rate: 1.1 }))),
    z(
      i,
      e.noiseHit(t, a, {
        type: `bandpass`,
        f: 2600,
        f1: 1200,
        glide: 0.2,
        q: 1.2,
        d: 0.3,
        peak: 0.14,
      }),
    )
  );
}
function At(e, t, n) {
  let r = e.shaper(e.filter(t, `bandpass`, 900, 3), 3),
    i = e.noiseHit(r, n, {
      color: `pink`,
      type: `bandpass`,
      f: 700,
      f1: 1100,
      glide: 0.12,
      q: 2,
      a: 0.02,
      d: 0.18,
      peak: 0.35,
    });
  i = z(
    i,
    e.fm(r, n, {
      f: 140,
      f1: 190,
      glide: 0.1,
      ratio: 1.02,
      index: 5,
      a: 0.02,
      d: 0.16,
      peak: 0.08,
      vib: [28, 60],
    }),
  );
  let a = n + 0.11;
  return (
    (i = z(
      i,
      e.noiseHit(t, a, {
        type: `highpass`,
        f: 2500,
        a: 0.001,
        d: 0.03,
        peak: 0.45,
      }),
    )),
    z(
      i,
      e.thump(t, a, {
        f0: 200,
        f1: 90,
        drop: 0.04,
        d: 0.1,
        peak: 0.28,
        click: 0.3,
        knock: 0.6,
        crackF: 2200,
      }),
    )
  );
}
function jt(e, t, n) {
  let r = e.filter(t, `bandpass`, 420, 4),
    i = e.tone(r, n, {
      type: `sawtooth`,
      f: 95,
      f1: 70,
      glide: 0.18,
      a: 0.01,
      d: 0.22,
      peak: 0.4,
      vib: [22, 80],
    });
  return (
    (i = z(
      i,
      e.tone(t, n + 0.12, { f: 900, f1: 260, glide: 0.1, d: 0.12, peak: 0.12 }),
    )),
    (i = z(
      i,
      e.noiseHit(t, n + 0.12, {
        color: `pink`,
        type: `bandpass`,
        f: 1800,
        f1: 700,
        glide: 0.14,
        q: 1.5,
        d: 0.2,
        peak: 0.3,
      }),
    )),
    z(
      i,
      e.bubbles(t, n + 0.14, {
        count: 3,
        dur: 0.12,
        peak: 0.06,
        fMin: 500,
        fMax: 1400,
      }),
    )
  );
}
function Mt(e, t, n) {
  let r = e.fm(t, n, {
    f: 1500,
    f1: 1100,
    glide: 0.14,
    ratio: 1.5,
    index: 2.5,
    indexEnd: 1,
    a: 0.01,
    d: 0.18,
    peak: 0.1,
    vib: [32, 90],
  });
  return (
    (r = z(
      r,
      e.noiseHit(t, n, {
        type: `bandpass`,
        f: 2600,
        f1: 1400,
        glide: 0.15,
        q: 3,
        a: 0.01,
        d: 0.16,
        peak: 0.2,
      }),
    )),
    (r = z(
      r,
      e.whoosh(t, n + 0.05, {
        dur: 0.22,
        f0: 800,
        f1: 3e3,
        f2: 1200,
        q: 1,
        peak: 0.28,
        peakAt: 0.3,
      }),
    )),
    z(r, e.crackle(t, n + 0.06, { dur: 0.3, f: 4200, peak: 0.16, rate: 1.4 }))
  );
}
function Nt(e, t, n) {
  let r = e.thump(t, n, {
    f0: 105,
    f1: 40,
    drop: 0.1,
    d: 0.35,
    peak: 0.42,
    click: 0.3,
    crackF: 1900,
  });
  return (
    (r = z(
      r,
      e.crackle(t, n, { dur: 0.35, f: 1200, q: 0.8, peak: 0.45, rate: 0.6 }),
    )),
    (r = z(
      r,
      e.bell(t, n + 0.005, {
        f: N(1250, 1400),
        ratios: [1, 2.32, 3.87, 5.1],
        d: 0.6,
        peak: 0.07,
      }),
    )),
    z(
      r,
      e.shatter(t, n + 0.01, {
        count: 5,
        dur: 0.25,
        fMin: 2600,
        fMax: 5200,
        peak: 0.05,
      }),
    )
  );
}
function Pt(e, t, n) {
  let r = n;
  for (let i = 0; i < 5; i++)
    r = z(
      r,
      e.noiseHit(t, n + i * 0.035, {
        type: `bandpass`,
        f: N(2600, 3600),
        q: 4,
        a: 0.001,
        d: 0.025,
        peak: 0.25,
      }),
    );
  return z(r, e.splash(t, n + 0.05, { size: 0.5, peak: 0.25 }));
}
function Ft(e, t, n) {
  let r = e.fm(t, n, {
    f: 120,
    f1: 48,
    glide: 0.8,
    ratio: 1.01,
    index: 3,
    a: 0.05,
    d: 0.9,
    peak: 0.1,
    vib: [9, 40],
  });
  return (
    (r = z(
      r,
      e.crackle(t, n + 0.1, {
        dur: 0.7,
        f: 1400,
        q: 0.9,
        peak: 0.35,
        rate: 0.6,
      }),
    )),
    (r = z(
      r,
      e.thump(t, n + 0.5, {
        f0: 80,
        f1: 32,
        drop: 0.2,
        d: 0.7,
        peak: 0.45,
        click: 0.2,
        crackF: 1200,
      }),
    )),
    (r = z(
      r,
      e.noiseHit(t, n + 0.5, {
        color: `pink`,
        type: `lowpass`,
        f: 1600,
        f1: 250,
        glide: 0.4,
        d: 0.5,
        peak: 0.35,
      }),
    )),
    z(
      r,
      e.noiseHit(t, n + 0.52, {
        type: `highpass`,
        f: 3500,
        swell: !0,
        a: 0.05,
        d: 0.6,
        peak: 0.1,
      }),
    )
  );
}
function It(e, t, n) {
  let r = e.shaper(e.filter(t, `bandpass`, 600, 2.2), 2.5),
    i = e.tone(r, n, {
      type: `sawtooth`,
      f: 150,
      f1: 70,
      glide: 0.7,
      a: 0.03,
      d: 0.8,
      peak: 0.12,
      vib: [14, 50],
    });
  return (
    (i = z(
      i,
      e.thump(t, n + 0.45, {
        f0: 90,
        f1: 34,
        drop: 0.2,
        d: 0.6,
        peak: 0.45,
        click: 0.25,
      }),
    )),
    (i = z(
      i,
      e.noiseHit(t, n + 0.45, {
        color: `pink`,
        type: `lowpass`,
        f: 1400,
        f1: 200,
        glide: 0.4,
        d: 0.5,
        peak: 0.3,
      }),
    )),
    z(i, e.crackle(t, n + 0.3, { dur: 1, f: 3e3, peak: 0.25, rate: 0.9 }))
  );
}
function Lt(e, t, n) {
  let r = e.fm(t, n, {
    f: 900,
    f1: 380,
    glide: 0.35,
    ratio: 1.01,
    index: 1.5,
    a: 0.01,
    d: 0.4,
    peak: 0.08,
    vib: [10, 60],
  });
  return (
    (r = z(
      r,
      e.noiseHit(t, n, {
        color: `pink`,
        type: `bandpass`,
        f: 1400,
        f1: 700,
        glide: 0.3,
        q: 3,
        d: 0.3,
        peak: 0.12,
      }),
    )),
    (r = z(
      r,
      e.thump(t, n + 0.25, {
        f0: 140,
        f1: 55,
        drop: 0.08,
        d: 0.3,
        peak: 0.32,
        click: 0.2,
      }),
    )),
    z(r, e.chain(t, n + 0.27, { count: 4, dur: 0.15, peak: 0.05 }))
  );
}
function Rt(e, t, n) {
  let r = e.filter(t, `bandpass`, 380, 4),
    i = e.tone(r, n, {
      type: `sawtooth`,
      f: 110,
      f1: 50,
      glide: 0.5,
      a: 0.02,
      d: 0.6,
      peak: 0.35,
      vib: [18, 70],
    });
  return (
    (i = z(i, e.splash(t, n + 0.35, { size: 0.9, peak: 0.3 }))),
    z(i, e.bubbles(t, n + 0.4, { count: 6, dur: 0.6, peak: 0.06 }))
  );
}
function zt(e, t, n) {
  let r = e.fm(t, n, {
    f: 1800,
    f1: 700,
    glide: 0.4,
    ratio: 1.5,
    index: 2.5,
    indexEnd: 0.5,
    a: 0.01,
    d: 0.45,
    peak: 0.08,
    vib: [30, 80],
  });
  return (
    (r = z(
      r,
      e.crackle(t, n + 0.15, { dur: 0.8, f: 2200, peak: 0.3, rate: 0.8 }),
    )),
    (r = z(
      r,
      e.whoosh(t, n + 0.15, {
        dur: 0.7,
        f0: 2400,
        f1: 900,
        f2: 300,
        q: 0.9,
        peak: 0.16,
        peakAt: 0.15,
      }),
    )),
    z(
      r,
      e.thump(t, n + 0.2, {
        f0: 160,
        f1: 70,
        drop: 0.06,
        d: 0.2,
        peak: 0.22,
        click: 0.2,
      }),
    )
  );
}
function Bt(e, t, n) {
  let r = e.thump(t, n, {
    f0: 95,
    f1: 34,
    drop: 0.15,
    d: 0.5,
    peak: 0.42,
    click: 0.3,
    crackF: 1800,
  });
  return (
    (r = z(
      r,
      e.crackle(t, n + 0.02, {
        dur: 1,
        f: 1100,
        q: 0.8,
        peak: 0.45,
        rate: 0.55,
      }),
    )),
    (r = z(r, e.rumble(t, n, { dur: 0.9, f: 180, peak: 0.2 }))),
    z(
      r,
      e.shatter(t, n + 0.05, {
        count: 12,
        dur: 0.6,
        fMin: 2e3,
        fMax: 5600,
        peak: 0.07,
      }),
    )
  );
}
function Vt(e, t, n) {
  let r = e.noiseHit(t, n, {
    type: `bandpass`,
    f: 2600,
    q: 2.5,
    a: 0.001,
    d: 0.05,
    peak: 0.4,
  });
  return (
    (r = z(r, e.body(t, n, { peak: 0.2, crackF: 2200, d: 0.08 }))),
    (r = z(r, e.splash(t, n + 0.12, { size: 1.1, peak: 0.35 }))),
    z(r, e.bubbles(t, n + 0.2, { count: 8, dur: 0.7, peak: 0.06 }))
  );
}
function Ht(e, t, n) {
  let r = e.thump(t, n, {
    f0: 240,
    f1: 120,
    drop: 0.05,
    d: 0.14,
    peak: 0.22,
    click: 0.2,
    knock: 0.6,
    crack: 0.3,
  });
  return (
    (r = z(
      r,
      e.noiseHit(t, n, {
        color: `pink`,
        type: `lowpass`,
        f: 900,
        d: 0.1,
        peak: 0.2,
      }),
    )),
    (r = z(
      r,
      e.bell(t, n + 0.06, {
        f: E(81),
        ratios: [1, 2, 3.01],
        amps: [1, 0.3, 0.1],
        d: 0.7,
        peak: 0.05,
      }),
    )),
    (r = z(
      r,
      e.bell(t, n + 0.14, {
        f: E(88),
        ratios: [1, 2, 3.01],
        amps: [1, 0.25, 0.08],
        d: 0.9,
        peak: 0.045,
      }),
    )),
    (r = z(
      r,
      e.tone(t, n + 0.05, {
        f: 1320,
        f1: 1980,
        glide: 0.35,
        swell: !0,
        a: 0.25,
        d: 0.35,
        peak: 0.02,
        vib: [6, 12],
      }),
    )),
    z(
      r,
      e.sparkle(t, n + 0.12, {
        dur: 0.4,
        count: 5,
        fMin: 3500,
        fMax: 7e3,
        peak: 0.025,
        rise: !0,
      }),
    )
  );
}
function Ut(e, t, n) {
  let r = e.noiseHit(t, n, {
    type: `highpass`,
    f: 3e3,
    a: 0.001,
    d: 0.05,
    peak: 0.4,
  });
  return (
    (r = z(r, e.body(t, n, { peak: 0.2, crackF: 2400, d: 0.08 }))),
    (r = z(
      r,
      e.shatter(t, n + 0.01, {
        count: 10,
        dur: 0.4,
        fMin: 2400,
        fMax: 6500,
        peak: 0.07,
      }),
    )),
    (r = z(
      r,
      e.tone(t, n + 0.02, {
        f: 1760,
        f1: 440,
        glide: 0.35,
        d: 0.4,
        peak: 0.05,
      }),
    )),
    z(
      r,
      e.whoosh(t, n + 0.05, {
        dur: 0.35,
        f0: 3e3,
        f1: 1200,
        f2: 400,
        q: 1.2,
        peak: 0.1,
        peakAt: 0.2,
      }),
    )
  );
}
function Wt(e, t, n) {
  let r = e.bell(t, n, { f: E(88), ratios: [1, 2], d: 0.6, peak: 0.035 });
  return (
    (r = z(
      r,
      e.bell(t, n + 0.12, { f: E(81), ratios: [1, 2], d: 0.8, peak: 0.03 }),
    )),
    z(
      r,
      e.tone(t, n, {
        f: 990,
        f1: 660,
        glide: 0.5,
        swell: !0,
        a: 0.05,
        d: 0.5,
        peak: 0.015,
      }),
    )
  );
}
function Gt(e, t, n) {
  let r = e.whoosh(t, n, {
    dur: 0.6,
    f0: 500,
    f1: 3800,
    f2: 5200,
    q: 1.8,
    peak: 0.12,
    peakAt: 0.8,
  });
  return (
    [74, 79, 83, 86].forEach((i, a) => {
      r = z(
        r,
        e.fm(t, n + 0.1 + a * 0.06, {
          f: E(i),
          ratio: 3,
          index: 1.2,
          indexEnd: 0.1,
          d: 0.7,
          peak: 0.07,
          pan: -0.3 + a * 0.2,
        }),
      );
    }),
    (r = z(
      r,
      e.bell(t, n + 0.3, {
        f: E(91),
        ratios: [1, 2, 3.01],
        amps: [1, 0.3, 0.1],
        d: 1,
        peak: 0.04,
      }),
    )),
    z(
      r,
      e.sparkle(t, n + 0.2, {
        dur: 0.6,
        count: 8,
        fMin: 3e3,
        fMax: 7500,
        peak: 0.03,
        rise: !0,
      }),
    )
  );
}
function Kt(e, t, n) {
  let r = e.noiseHit(t, n, {
    color: `pink`,
    type: `bandpass`,
    f: 400,
    f1: 1800,
    glide: 0.5,
    q: 0.9,
    swell: !0,
    a: 0.45,
    d: 0.35,
    peak: 0.3,
  });
  r = z(
    r,
    e.crackle(t, n + 0.1, {
      dur: 0.8,
      f: 2800,
      peak: 0.25,
      rate: 1.1,
      swell: !0,
    }),
  );
  let i = e.shaper(e.filter(t, `lowpass`, 900, 0.8), 3);
  return (
    (r = z(
      r,
      e.tone(i, n + 0.35, {
        type: `sawtooth`,
        f: E(38),
        a: 0.02,
        d: 0.6,
        peak: 0.08,
      }),
    )),
    (r = z(
      r,
      e.tone(i, n + 0.35, {
        type: `sawtooth`,
        f: E(45),
        a: 0.02,
        d: 0.6,
        peak: 0.06,
      }),
    )),
    z(
      r,
      e.thump(t, n + 0.35, {
        f0: 120,
        f1: 50,
        drop: 0.1,
        d: 0.35,
        peak: 0.3,
        click: 0.2,
      }),
    )
  );
}
function qt(e, t, n) {
  let r = e.zap(t, n, { f0: 3800, f1: 600, dur: 0.3, index: 7, peak: 0.12 });
  return (
    (r = z(
      r,
      e.noiseHit(t, n, {
        type: `highpass`,
        f: 2200,
        a: 0.001,
        d: 0.12,
        peak: 0.35,
      }),
    )),
    (r = z(r, e.rumble(t, n + 0.05, { dur: 1.1, f: 240, peak: 0.28 }))),
    (r = z(
      r,
      e.crackle(t, n + 0.02, { dur: 0.5, f: 5e3, peak: 0.2, rate: 1.6 }),
    )),
    z(
      r,
      e.bell(t, n + 0.1, {
        f: E(86),
        ratios: [1, 1.5, 2.01],
        d: 1.1,
        peak: 0.04,
      }),
    )
  );
}
function Jt(e, t, n) {
  let r = e.whoosh(t, n, {
    dur: 0.7,
    f0: 200,
    f1: 1600,
    f2: 300,
    q: 1.5,
    peak: 0.16,
    peakAt: 0.85,
    color: `brown`,
  });
  return (
    (r = z(
      r,
      e.choir(t, n + 0.45, {
        notes: [38, 45, 50],
        a: 0.12,
        dur: 0.6,
        r: 1,
        peak: 0.06,
        vowel: `oo`,
      }),
    )),
    (r = z(
      r,
      e.fm(t, n + 0.5, {
        f: 55,
        ratio: 0.5,
        index: 4,
        a: 0.05,
        d: 1.2,
        peak: 0.1,
      }),
    )),
    z(
      r,
      e.thump(t, n + 0.5, {
        f0: 80,
        f1: 32,
        drop: 0.2,
        d: 0.7,
        peak: 0.35,
        click: 0.15,
      }),
    )
  );
}
function Yt(e, t, n) {
  let r = e.whoosh(t, n, {
    dur: 0.35,
    f0: 600,
    f1: 4200,
    f2: 2600,
    q: 1.4,
    peak: 0.16,
    peakAt: 0.6,
    pan0: -0.3,
    pan1: 0.3,
  });
  return (
    (r = z(
      r,
      e.bubbles(t, n, {
        count: 4,
        dur: 0.25,
        peak: 0.05,
        fMin: 600,
        fMax: 1600,
      }),
    )),
    z(
      r,
      e.fm(t, n + 0.12, {
        f: E(86),
        f1: E(93),
        glide: 0.12,
        ratio: 2,
        index: 1,
        d: 0.5,
        peak: 0.05,
      }),
    )
  );
}
function Xt(e, t, n, r) {
  let i = e.splash(t, n, { size: 0.8, peak: 0.25 });
  return (
    (i = z(
      i,
      e.noiseHit(t, n + 0.1, {
        color: `pink`,
        type: `bandpass`,
        f: 800,
        f1: 2600,
        glide: 0.6,
        q: 1.2,
        swell: !0,
        a: 0.5,
        d: 0.4,
        peak: 0.12,
      }),
    )),
    (r.rel === `enemy` ? [69, 72, 76] : [74, 78, 81]).forEach((r, a) => {
      i = z(
        i,
        e.bell(t, n + 0.45 + a * 0.08, {
          f: E(r + 12),
          ratios: [1, 2, 3.01],
          amps: [1, 0.25, 0.08],
          d: 1.4,
          peak: 0.04,
          pan: -0.25 + a * 0.25,
        }),
      );
    }),
    z(
      i,
      e.tone(t, n + 0.4, {
        f: E(50),
        a: 0.3,
        h: 0.3,
        r: 0.8,
        peak: 0.05,
        lp: 400,
      }),
    )
  );
}
function Zt(e, t, n) {
  let r = e.bell(t, n, {
    f: 2400,
    ratios: [1, 2.41, 3.93],
    d: 0.25,
    peak: 0.05,
  });
  for (let i = 0; i < 3; i++)
    r = z(
      r,
      e.tone(t, n + 0.12 + i * 0.13, {
        type: `triangle`,
        f: 230,
        f1: 160,
        glide: 0.06,
        d: 0.09,
        peak: 0.12,
        lp: 900,
      }),
    );
  return (
    (r = z(r, e.bubbles(t, n + 0.1, { count: 5, dur: 0.4, peak: 0.05 }))),
    z(
      r,
      e.bell(t, n + 0.55, {
        f: E(84),
        ratios: [1, 2, 3.01],
        amps: [1, 0.3, 0.1],
        d: 0.8,
        peak: 0.035,
      }),
    )
  );
}
function Qt(e, t, n) {
  let r = e.thump(t, n, { f0: 105, f1: 38, drop: 0.12, d: 0.55, peak: 0.385 });
  return (
    (r = z(r, e.body(t, n, { peak: 0.22, f: 300, d: 0.12, crackF: 2e3 }))),
    (r = z(
      r,
      e.whoosh(t, n + 0.05, {
        dur: 0.85,
        f0: 300,
        f1: 2600,
        f2: 1800,
        q: 4,
        peak: 0.16,
        peakAt: 0.7,
      }),
    )),
    (r = z(
      r,
      e.bell(t, n + 0.04, {
        f: 220,
        ratios: [1, 2.02, 3.6],
        d: 1.1,
        peak: 0.08,
      }),
    )),
    z(
      r,
      e.noiseHit(t, n, {
        color: `pink`,
        type: `lowpass`,
        f: 1400,
        f1: 200,
        glide: 0.4,
        d: 0.5,
        peak: 0.28,
      }),
    )
  );
}
function $t(e, t, n) {
  let r = e.thump(t, n, {
    f0: 72,
    f1: 40,
    drop: 0.08,
    d: 0.3,
    peak: 0.8,
    click: 0.15,
  });
  ((r = z(
    r,
    e.thump(t, n + 0.3, {
      f0: 64,
      f1: 36,
      drop: 0.08,
      d: 0.28,
      peak: 0.55,
      click: 0.1,
    }),
  )),
    (r = z(
      r,
      e.thump(t, n + 0.02, {
        f0: 55,
        f1: 26,
        drop: 0.5,
        d: 1.6,
        peak: 0.55,
        click: 0,
      }),
    )));
  let i = [38, 44, 50, 53].map(E);
  for (let a = 0; a < i.length; a++)
    r = z(
      r,
      e.strings(t, n + 0.04, {
        f: i[a],
        dur: 0.9,
        a: 0.05,
        r: 2.4,
        peak: 0.07,
        cutoff: 1100,
        pan: (a - 1.5) * 0.3,
      }),
    );
  return (
    (r = z(
      r,
      e.choir(t, n + 0.1, {
        notes: [62, 65, 68],
        dur: 0.8,
        a: 0.3,
        r: 2.2,
        peak: 0.07,
      }),
    )),
    z(
      r,
      e.whoosh(t, n, {
        dur: 1.9,
        f0: 2200,
        f1: 300,
        f2: 120,
        q: 1.5,
        peak: 0.16,
        peakAt: 0.06,
      }),
    )
  );
}
function en(e, t, n) {
  let r = e.whoosh(t, n, {
      dur: 1,
      f0: 300,
      f1: 4200,
      f2: 5e3,
      q: 2.5,
      peak: 0.2,
      peakAt: 0.85,
    }),
    i = [74, 78, 81, 86];
  for (let a = 0; a < i.length; a++)
    r = z(
      r,
      e.bell(t, n + 0.75 + a * 0.07, {
        f: E(i[a]),
        ratios: [1, 2, 3.01],
        amps: [1, 0.3, 0.1],
        d: 1.2,
        peak: 0.1,
        pan: -0.3 + a * 0.2,
      }),
    );
  for (let i of [62, 66, 69])
    r = z(
      r,
      e.strings(t, n + 0.3, { f: E(i), dur: 0.8, a: 0.5, r: 1.2, peak: 0.05 }),
    );
  return r;
}
function tn(e, t, n, r, i) {
  let a = e.noiseHit(t, n, { type: `highpass`, f: 1800, d: 0.12, peak: 0.797 });
  return (
    (a = z(
      a,
      e.thump(t, n, { f0: 72, f1: 28, drop: 0.25, d: 1.3 * i, peak: 0.63 }),
    )),
    (a = z(a, e.rumble(t, n, { dur: 3.2 * i, f: 160, peak: 0.468, a: 0.05 }))),
    (a = z(
      a,
      e.crackle(t, n + 0.03, {
        dur: 2.2 * i,
        f: 1600,
        q: 0.7,
        peak: 0.51,
        rate: 0.7,
      }),
    )),
    (a = z(
      a,
      e.crackle(t, n + 0.4, {
        dur: 1.6 * i,
        f: 900,
        q: 0.7,
        peak: 0.3,
        rate: 0.5,
      }),
    )),
    (a = z(
      a,
      e.noiseHit(t, n + 1.1 * i, {
        type: `bandpass`,
        f: 480,
        q: 1,
        d: 0.25,
        peak: 0.29,
      }),
    )),
    B(r)
      ? ((a = z(
          a,
          e.shatter(t, n + 0.02, {
            count: 18,
            fMin: 2400,
            fMax: 7e3,
            dur: 0.9 * i,
            peak: 0.112,
          }),
        )),
        (a = z(
          a,
          e.bell(t, n + 0.02, {
            f: 1318,
            ratios: [1, 1.5, 2.01, 3.03],
            d: 1.6,
            peak: 0.07,
          }),
        )))
      : ((a = z(
          a,
          e.noiseHit(t, n, {
            color: `pink`,
            type: `lowpass`,
            f: 3200,
            f1: 200,
            glide: 1.1,
            d: 1.3 * i,
            peak: 0.42,
          }),
        )),
        (a = z(
          a,
          e.crackle(t, n, { dur: 1.6 * i, f: 3600, peak: 0.36, rate: 1.2 }),
        ))),
    a
  );
}
var nn = (e, t, n, r) => tn(e, t, n, r, 1);
function rn(e, t, n, r) {
  let i = tn(e, t, n, r, 0.85);
  return (
    (i = z(
      i,
      e.tone(t, n, {
        type: `sawtooth`,
        f: 420,
        f1: 55,
        glide: 1.3,
        a: 0.01,
        h: 0.4,
        r: 1.2,
        peak: 0.08,
        lp: 1400,
      }),
    )),
    z(
      i,
      e.shatter(t, n + 0.05, {
        count: 16,
        fMin: 1800,
        fMax: 5200,
        dur: 1.2,
        peak: 0.07,
      }),
    )
  );
}
function an(e, t, n) {
  let r = e.tone(t, n, {
    f: 110,
    f1: 220,
    glide: 1.6,
    swell: !0,
    a: 1.6,
    d: 0.6,
    peak: 0.18,
  });
  return (
    (r = z(
      r,
      e.sparkle(t, n, {
        dur: 1.8,
        count: 12,
        fMin: 1500,
        fMax: 4500,
        peak: 0.04,
        rise: !0,
      }),
    )),
    z(
      r,
      e.bell(t, n + 1.6, {
        f: 880,
        ratios: [1, 2.01, 3.01],
        d: 1.5,
        peak: 0.08,
      }),
    )
  );
}
function on(e, t, n, r) {
  let i = e.whoosh(t, n, {
    dur: 0.62,
    f0: 200,
    f1: 5200,
    f2: 6e3,
    q: 1.4,
    peak: 0.42,
    peakAt: 0.97,
    color: `white`,
  });
  i = z(
    i,
    e.tone(t, n, {
      type: `sawtooth`,
      f: 55,
      f1: 440,
      glide: 0.6,
      swell: !0,
      a: 0.6,
      d: 0.05,
      peak: 0.12,
      lp: 2400,
    }),
  );
  let a = n + 0.62;
  ((i = z(
    i,
    e.thump(t, a, { f0: 72, f1: 22, drop: 0.8, d: 3.6, peak: 0.7, click: 0.4 }),
  )),
    (i = z(
      i,
      e.noiseHit(t, a, {
        color: `pink`,
        type: `lowpass`,
        f: 9e3,
        f1: 140,
        glide: 2.6,
        q: 0.8,
        d: 3.2,
        peak: 0.75,
      }),
    )),
    (i = z(
      i,
      e.noiseHit(t, a, { type: `highpass`, f: 2e3, d: 0.25, peak: 0.797 }),
    )),
    (i = z(
      i,
      e.shatter(t, a + 0.02, {
        count: 30,
        fMin: 1800,
        fMax: 7500,
        dur: 2.2,
        peak: 0.098,
      }),
    )),
    (i = z(i, e.rumble(t, a, { dur: 5, f: 120, peak: 0.468, a: 0.08 }))),
    (i = z(
      i,
      e.crackle(t, a + 0.1, { dur: 4, f: 1500, peak: 0.42, rate: 0.6 }),
    )));
  let o = B(r) ? [74, 81, 86, 90] : [62, 65, 69, 74];
  for (let n = 0; n < o.length; n++)
    i = z(
      i,
      e.bell(t, a + 0.05 + n * 0.03, {
        f: E(o[n]),
        ratios: [1, 2.01, 3.02],
        d: 4,
        peak: 0.05,
        pan: (n - 1.5) * 0.35,
      }),
    );
  return i;
}
function sn(e, t, n) {
  let r = [74, 78, 81, 86],
    i = n;
  for (let a = 0; a < r.length; a++)
    i = z(
      i,
      e.bell(t, n + a * 0.055, {
        f: E(r[a]),
        ratios: [1, 2, 3.01, 4.2],
        amps: [1, 0.35, 0.15, 0.06],
        d: 0.95,
        peak: 0.15,
        pan: -0.3 + a * 0.2,
      }),
    );
  return (
    (i = z(
      i,
      e.fm(t, n, {
        f: E(62),
        ratio: 2,
        index: 1.2,
        d: 1.2,
        a: 0.01,
        peak: 0.08,
      }),
    )),
    (i = z(
      i,
      e.whoosh(t, n, {
        dur: 0.5,
        f0: 800,
        f1: 6e3,
        q: 2,
        peak: 0.1,
        peakAt: 0.9,
      }),
    )),
    z(
      i,
      e.sparkle(t, n + 0.2, {
        dur: 0.6,
        count: 8,
        fMin: 3e3,
        fMax: 8e3,
        peak: 0.045,
      }),
    )
  );
}
function cn(e, t, n) {
  return e.bell(t, n, { f: E(81), ratios: [1, 2, 3.01], d: 0.7, peak: 0.1 });
}
function ln(e, t, n) {
  let r = N(0.97, 1.03),
    i = e.fm(t, n, {
      f: 1976 * r,
      ratio: 3.5,
      index: 2.2,
      indexEnd: 0.2,
      d: 0.16,
      peak: 0.13,
    });
  return (
    (i = z(
      i,
      e.fm(t, n + 0.055, {
        f: 2637 * r,
        ratio: 3.5,
        index: 2,
        indexEnd: 0.2,
        d: 0.38,
        peak: 0.15,
      }),
    )),
    z(i, e.noiseHit(t, n, { type: `highpass`, f: 6500, d: 0.012, peak: 0.12 }))
  );
}
function un(e, t, n) {
  let r = n;
  for (let i = 0; i < 7; i++)
    r = z(
      r,
      e.fm(t, n + fn(i) * 0.38, {
        f: N(1800, 3200),
        ratio: 3.5,
        index: 2,
        d: N(0.1, 0.22),
        peak: 0.07,
        pan: N(-0.5, 0.5),
      }),
    );
  for (let i of [86, 93])
    r = z(
      r,
      e.bell(t, n + 0.05, {
        f: E(i),
        ratios: [1, 2.01, 3],
        d: 0.9,
        peak: 0.07,
      }),
    );
  return r;
}
function dn(e, t, n) {
  let r = n;
  for (let i = 0; i < 12; i++) {
    let a = n + i * 0.045 + N(0, 0.02);
    r = z(
      r,
      e.fm(t, a, {
        f: N(1900, 3400),
        ratio: 3.5,
        index: 2,
        indexEnd: 0.2,
        d: N(0.12, 0.25),
        peak: 0.06,
        pan: N(-0.6, 0.6),
      }),
    );
  }
  for (let i of [81, 86, 90])
    r = z(
      r,
      e.bell(t, n + 0.08, {
        f: E(i),
        ratios: [1, 2.01, 3],
        amps: [1, 0.3, 0.1],
        d: 1.2,
        peak: 0.05,
      }),
    );
  return z(
    r,
    e.noiseHit(t, n + 0.5, { type: `highpass`, f: 5e3, d: 0.3, peak: 0.08 }),
  );
}
function fn(e) {
  return ((e * 0.618034) % 1) * 0.8 + N(0, 0.2);
}
function pn(e, t, n) {
  let r = e.gain(t, 1),
    i = [],
    a = 8.3,
    o = e.gain(r, 0);
  (o.gain.setValueAtTime(0, n),
    o.gain.linearRampToValueAtTime(1, n + 1.4),
    e.mod(n, a, 3.2, 0.25).connect(o.gain));
  for (let [t, r] of [
    [74, 0.05],
    [81, 0.035],
    [86, 0.025],
  ]) {
    let s = e.osc(e.gain(o, r), n, a, `sine`, E(t));
    (s.detune.setValueAtTime(0, n),
      s.detune.linearRampToValueAtTime(300, n + 8),
      i.push(s));
  }
  i.push(e.osc(e.gain(o, 0.04), n, a, `sine`, E(50)));
  let s = e.filter(e.gain(r, 0.12), `bandpass`, 600, 4);
  (s.frequency.setValueAtTime(600, n),
    s.frequency.exponentialRampToValueAtTime(4200, n + 8));
  let c = e.gain(s, 0);
  (c.gain.setValueAtTime(0, n),
    c.gain.linearRampToValueAtTime(1, n + 2),
    i.push(e.noise(c, n, a, `pink`)));
  for (let t = 0; t < 22; t++) {
    let i = n + 8 * fn(t) ** 0.7;
    e.tone(r, i, {
      f: N(2200, 5200),
      d: N(0.1, 0.3),
      peak: 0.03,
      pan: N(-0.6, 0.6),
    });
  }
  return {
    end: n + a,
    stop(e) {
      try {
        (r.gain.cancelScheduledValues(e), r.gain.setTargetAtTime(0, e, 0.06));
      } catch {}
      for (let t of i)
        try {
          t.stop(e + 0.4);
        } catch {}
    },
  };
}
function mn(e, t, n) {
  let r = e.whoosh(t, n, {
      dur: 0.45,
      f0: 400,
      f1: 6e3,
      f2: 7e3,
      q: 2,
      peak: 0.3,
      peakAt: 0.92,
    }),
    i = n + 0.42;
  r = z(r, e.thump(t, i, { f0: 95, f1: 40, drop: 0.12, d: 0.5, peak: 0.315 }));
  for (let n of [86, 93])
    r = z(
      r,
      e.bell(t, i, { f: E(n), ratios: [1, 2.01, 3], d: 1.2, peak: 0.08 }),
    );
  return (
    (r = z(
      r,
      e.sparkle(t, i, {
        dur: 0.8,
        count: 12,
        fMin: 2500,
        fMax: 7e3,
        peak: 0.05,
      }),
    )),
    z(r, e.noiseHit(t, i, { type: `highpass`, f: 3e3, d: 0.4, peak: 0.261 }))
  );
}
function hn(e, t, n) {
  return z(
    e.tone(t, n, { f: 1250, f1: 300, glide: 0.22, d: 0.26, peak: 0.07 }),
    e.noiseHit(t, n, { type: `highpass`, f: 3e3, d: 0.15, peak: 0.08 }),
  );
}
function gn(e, t, n) {
  let r = n;
  for (let i = 0; i < 3; i++)
    r = z(
      r,
      e.fm(t, n + i * 0.045, {
        f: N(2300, 3e3),
        ratio: 3.5,
        index: 2,
        d: 0.14,
        peak: 0.08,
        pan: (i - 1) * 0.3,
      }),
    );
  return (
    (r = z(
      r,
      e.noiseHit(t, n + 0.1, {
        color: `pink`,
        type: `lowpass`,
        f: 700,
        d: 0.09,
        peak: 0.25,
      }),
    )),
    (r = z(
      r,
      e.thump(t, n + 0.1, {
        f0: 210,
        f1: 120,
        drop: 0.04,
        d: 0.07,
        peak: 0.2,
        click: 0,
      }),
    )),
    z(
      r,
      e.bell(t, n + 0.14, {
        f: 1568,
        ratios: [1, 2, 3, 4.1],
        amps: [1, 0.3, 0.12, 0.05],
        d: 0.7,
        peak: 0.1,
      }),
    )
  );
}
function _n(e, t, n) {
  let r = n;
  for (let i = 0; i < 3; i++)
    r = z(
      r,
      e.fm(t, n + i * 0.06, {
        f: 3e3 - i * 450,
        ratio: 3.5,
        index: 2,
        d: 0.14,
        peak: 0.075,
      }),
    );
  return z(
    r,
    e.bell(t, n + 0.18, {
      f: 1175,
      ratios: [1, 2, 3],
      amps: [1, 0.3, 0.1],
      d: 0.6,
      peak: 0.08,
    }),
  );
}
function vn(e, t, n) {
  let r = e.bell(t, n, { f: 1318, ratios: [1, 2, 3], d: 0.3, peak: 0.08 });
  return (
    (r = z(
      r,
      e.bell(t, n + 0.06, { f: 1760, ratios: [1, 2, 3], d: 0.55, peak: 0.1 }),
    )),
    z(
      r,
      e.whoosh(t, n, {
        dur: 0.22,
        f0: 1500,
        f1: 6e3,
        q: 2,
        peak: 0.05,
        peakAt: 0.9,
      }),
    )
  );
}
function yn(e, t, n) {
  return z(
    e.fm(t, n, { f: 1046, ratio: 2, index: 1.5, d: 0.3, peak: 0.12 }),
    e.fm(t, n + 0.09, { f: 1568, ratio: 2, index: 1.5, d: 0.5, peak: 0.12 }),
  );
}
function bn(e, t, n) {
  let r = n;
  for (let i = 0; i < 2; i++) {
    let a = n + i * 0.1;
    ((r = z(
      r,
      e.fm(t, a, {
        f: 1318,
        ratio: 3.01,
        index: 3.5,
        indexEnd: 0.3,
        d: 0.22,
        peak: 0.13,
      }),
    )),
      (r = z(
        r,
        e.noiseHit(t, a, {
          type: `bandpass`,
          f: 3200,
          q: 1.5,
          a: 0.001,
          d: 0.04,
          peak: 0.25,
        }),
      )));
  }
  return z(
    r,
    e.thump(t, n, {
      f0: 260,
      f1: 140,
      drop: 0.04,
      d: 0.12,
      peak: 0.2,
      click: 0.4,
      knock: 0.4,
      crack: 0.2,
    }),
  );
}
function xn(e, t, n) {
  let r = n;
  for (let [i, a] of [
    [76, 0],
    [72, 0.14],
    [69, 0.28],
  ])
    ((r = z(
      r,
      e.fm(t, n + a, {
        f: E(i),
        ratio: 1.5,
        index: 2.2,
        indexEnd: 1.2,
        d: 0.28,
        peak: 0.1,
        type: `triangle`,
      }),
    )),
      (r = z(
        r,
        e.tone(t, n + a, {
          type: `square`,
          f: E(i - 24),
          d: 0.16,
          peak: 0.03,
          lp: 1500,
        }),
      )));
  return r;
}
function Sn(e, t, n) {
  let r = e.whoosh(t, n, {
    dur: 0.3,
    f0: 800,
    f1: 4e3,
    f2: 2600,
    q: 1.4,
    peak: 0.08,
    peakAt: 0.8,
  });
  return (
    [74, 78, 81, 86].forEach((i, a) => {
      r = z(
        r,
        e.fm(t, n + a * 0.055, {
          f: E(i),
          ratio: 2,
          index: 1.2,
          d: a === 3 ? 0.5 : 0.18,
          peak: 0.1,
        }),
      );
    }),
    r
  );
}
function Cn(e, t, n) {
  return z(
    e.fm(t, n, {
      f: E(79),
      f1: E(83),
      glide: 0.12,
      ratio: 2,
      index: 1.4,
      d: 0.28,
      peak: 0.11,
    }),
    e.fm(t, n + 0.2, {
      f: E(83),
      f1: E(78),
      glide: 0.25,
      ratio: 2,
      index: 1.4,
      d: 0.5,
      peak: 0.11,
      vib: [7, 25],
    }),
  );
}
function wn(e, t, n) {
  let r = n;
  for (let i = 0; i < 3; i++)
    r = z(
      r,
      e.fm(t, n + i * 0.09, {
        f: 1568,
        ratio: 2,
        index: 1.8,
        d: 0.12,
        peak: 0.1,
      }),
    );
  return z(
    r,
    e.bell(t, n + 0.27, { f: 2093, ratios: [1, 2], d: 0.5, peak: 0.05 }),
  );
}
function Tn(e, t, n) {
  return z(
    e.bell(t, n, {
      f: E(86),
      ratios: [1, 2, 3.01],
      amps: [1, 0.3, 0.1],
      d: 0.8,
      peak: 0.08,
    }),
    e.bell(t, n + 0.08, {
      f: E(93),
      ratios: [1, 2, 3.01],
      amps: [1, 0.3, 0.1],
      d: 1,
      peak: 0.06,
    }),
  );
}
function En(e, t, n) {
  let r = e.noiseHit(t, n, { type: `highpass`, f: 2600, d: 0.012, peak: 0.3 });
  return (
    (r = z(
      r,
      e.tone(t, n, {
        type: `triangle`,
        f: 1450,
        f1: 880,
        glide: 0.03,
        d: 0.05,
        peak: 0.16,
      }),
    )),
    z(r, e.tone(t, n, { f: 420, f1: 360, glide: 0.03, d: 0.05, peak: 0.12 }))
  );
}
function Dn(e, t, n) {
  return z(
    e.tone(t, n, { f: 2600, d: 0.035, peak: 0.045 }),
    e.noiseHit(t, n, { type: `highpass`, f: 7e3, d: 0.008, peak: 0.04 }),
  );
}
function On(e, t, n) {
  let r = e.thump(t, n, {
    f0: 180,
    f1: 90,
    drop: 0.06,
    d: 0.25,
    peak: 0.3,
    click: 0.3,
    knock: 0.6,
  });
  return (
    (r = z(
      r,
      e.bell(t, n + 0.01, {
        f: E(81),
        ratios: [1, 2, 3.01],
        amps: [1, 0.3, 0.1],
        d: 0.9,
        peak: 0.09,
      }),
    )),
    (r = z(
      r,
      e.bell(t, n + 0.07, {
        f: E(86),
        ratios: [1, 2, 3.01],
        amps: [1, 0.3, 0.1],
        d: 1.1,
        peak: 0.1,
      }),
    )),
    (r = z(
      r,
      e.whoosh(t, n, {
        dur: 0.3,
        f0: 1200,
        f1: 6e3,
        q: 1.5,
        peak: 0.08,
        peakAt: 0.4,
      }),
    )),
    z(
      r,
      e.sparkle(t, n + 0.06, {
        dur: 0.4,
        count: 6,
        fMin: 3e3,
        fMax: 7e3,
        peak: 0.03,
      }),
    )
  );
}
function kn(e, t, n) {
  let r = e.whoosh(t, n, {
    dur: 0.22,
    f0: 500,
    f1: 2600,
    f2: 1800,
    q: 1.2,
    peak: 0.12,
    peakAt: 0.7,
  });
  return (
    (r = z(
      r,
      e.noiseHit(t, n + 0.15, {
        color: `pink`,
        type: `lowpass`,
        f: 900,
        d: 0.08,
        peak: 0.16,
      }),
    )),
    z(
      r,
      e.bell(t, n + 0.16, { f: 1318, ratios: [1, 2, 3], d: 0.4, peak: 0.04 }),
    )
  );
}
function An(e, t, n) {
  return z(
    e.whoosh(t, n, {
      dur: 0.18,
      f0: 2200,
      f1: 900,
      f2: 400,
      q: 1.2,
      peak: 0.1,
      peakAt: 0.3,
    }),
    e.noiseHit(t, n + 0.12, {
      color: `pink`,
      type: `lowpass`,
      f: 700,
      d: 0.06,
      peak: 0.12,
    }),
  );
}
function jn(e, t, n) {
  let r = n,
    i = [2093, 2349, 2637];
  for (let a = 0; a < 2; a++)
    for (let o = 0; o < 3; o++)
      r = z(
        r,
        e.tone(t, n + (a * 3 + o) * 0.075, {
          f: i[o],
          d: 0.2,
          peak: 0.035,
          pan: Math.sin((a * 3 + o) * 2.1) * 0.6,
        }),
      );
  return r;
}
function Mn(e, t, n) {
  return e.whoosh(t, n, {
    dur: 0.32,
    f0: 400,
    f1: 2200,
    f2: 1200,
    q: 1.5,
    peak: 0.15,
    peakAt: 0.4,
  });
}
function Nn(e, t, n) {
  let r = e.noiseHit(t, n, { type: `highpass`, f: 3200, d: 0.06, peak: 0.18 });
  return (
    (r = z(r, e.crackle(t, n, { dur: 0.16, f: 4e3, peak: 0.1 }))),
    z(r, e.tone(t, n, { f: 190, f1: 90, glide: 0.1, d: 0.15, peak: 0.13 }))
  );
}
function Pn(e, t, n) {
  return e.tone(t, n, {
    f: 620,
    f1: 300,
    glide: 0.25,
    d: 0.3,
    peak: 0.045,
    vib: [9, 30],
  });
}
function Fn(e, t, n) {
  let r = e.thump(t, n, {
    f0: 124,
    f1: 56,
    drop: 0.09,
    d: 0.26,
    peak: 0.42,
    click: 0.12,
  });
  return (
    (r = z(
      r,
      e.whoosh(t, n + 0.012, {
        dur: 0.3,
        f0: 320,
        f1: 1500,
        f2: 2500,
        q: 1.3,
        peak: 0.2,
        peakAt: 0.55,
      }),
    )),
    z(
      r,
      e.noiseHit(t, n, {
        color: `pink`,
        type: `lowpass`,
        f: 1800,
        f1: 420,
        glide: 0.09,
        d: 0.16,
        peak: 0.22,
      }),
    )
  );
}
function In(e, t, n) {
  let r = e.whoosh(t, n, {
    dur: 0.34,
    f0: 2100,
    f1: 900,
    f2: 340,
    q: 2.2,
    peak: 0.24,
    peakAt: 0.3,
  });
  return (
    (r = z(
      r,
      e.tone(t, n, {
        type: `triangle`,
        f: 520,
        f1: 150,
        glide: 0.3,
        d: 0.34,
        peak: 0.075,
      }),
    )),
    z(
      r,
      e.noiseHit(t, n + 0.25, {
        type: `bandpass`,
        f: 880,
        q: 1.4,
        d: 0.08,
        peak: 0.18,
      }),
    )
  );
}
function Ln(e, t, n) {
  let r = e.bell(t, n, {
    f: 1180,
    ratios: [1, 2.02, 2.77],
    d: 0.1,
    peak: 0.15,
  });
  return (
    (r = z(
      r,
      e.noiseHit(t, n + 0.05, {
        type: `lowpass`,
        f: 900,
        f1: 220,
        glide: 0.1,
        d: 0.12,
        peak: 0.15,
      }),
    )),
    z(
      r,
      e.tone(t, n + 0.02, {
        f: 300,
        f1: 120,
        glide: 0.12,
        d: 0.16,
        peak: 0.055,
      }),
    )
  );
}
function Rn(e, t, n) {
  return e.whoosh(t, n, {
    dur: 0.24,
    f0: 400,
    f1: 1800,
    f2: 500,
    q: 1.2,
    peak: 0.34,
    peakAt: 0.65,
  });
}
function zn(e, t, n) {
  return z(
    e.fm(t, n, {
      f: 700,
      f1: 1200,
      glide: 0.08,
      ratio: 1.5,
      index: 2,
      d: 0.2,
      peak: 0.16,
    }),
    e.noiseHit(t, n, {
      type: `bandpass`,
      f: 2200,
      f1: 900,
      glide: 0.12,
      q: 2,
      d: 0.15,
      peak: 0.25,
    }),
  );
}
function Bn(e, t, n) {
  return e.whoosh(t, n, {
    dur: 0.25,
    f0: 500,
    f1: 2300,
    f2: 600,
    q: 1.2,
    peak: 0.24,
  });
}
function Vn(e, t, n) {
  return z(
    e.tone(t, n, {
      f: 660,
      f1: 990,
      glide: 0.2,
      d: 0.5,
      peak: 0.05,
      vib: [6, 20],
    }),
    e.noiseHit(t, n, {
      type: `bandpass`,
      f: 1800,
      f1: 3500,
      glide: 0.25,
      q: 4,
      d: 0.35,
      peak: 0.08,
    }),
  );
}
function Hn(e, t, n, r) {
  let i = w((r.amount || 60) / 120, 0.6, 1.2),
    a = n;
  return (
    [86, 90].forEach((r, o) => {
      a = z(
        a,
        e.bell(t, n + o * 0.05, {
          f: E(r),
          ratios: [1, 2, 3],
          amps: [1, 0.25, 0.08],
          d: 0.6,
          peak: 0.035 * i,
          pan: o ? 0.25 : -0.25,
        }),
      );
    }),
    (a = z(
      a,
      e.sparkle(t, n + 0.03, {
        dur: 0.3,
        count: 4,
        fMin: 3e3,
        fMax: 6500,
        peak: 0.025 * i,
      }),
    )),
    z(
      a,
      e.tone(t, n, {
        f: 740,
        f1: 1110,
        glide: 0.2,
        swell: !0,
        a: 0.08,
        d: 0.3,
        peak: 0.02 * i,
      }),
    )
  );
}
var Un = {
  impact_physical: R(et, { prio: 42, group: `hit` }),
  impact_magic: R(tt, { prio: 42, group: `hit` }),
  impact_true: R(nt, { prio: 40, group: `hit` }),
  impact_crit: R(rt, { prio: 55, group: `hit` }),
  hit_minor: R(it, { prio: 12, group: `hit_minor` }),
  vyre_attack: R(at, { prio: 48, group: `attack` }),
  vyre_impact: R(ot, { prio: 44, group: `hit` }),
  morrow_attack: R(st, { prio: 48, group: `attack` }),
  morrow_impact: R(ct, { prio: 44, group: `hit` }),
  brannoc_swing: R(lt, { prio: 44, group: `attack` }),
  brannoc_impact: R(ut, { prio: 48, group: `hit` }),
  sable_swing: R(dt, { prio: 44, group: `attack` }),
  sable_impact: R(ft, { prio: 46, group: `hit` }),
  oru_swing: R(pt, { prio: 44, group: `attack` }),
  oru_impact: R(mt, { prio: 48, group: `hit` }),
  turret_charge: R(ht, { prio: 50, group: `turret`, range: 32 }),
  turret_shot: R(gt, { prio: 58, group: `turret`, range: 32, verb: 0.2 }),
  turret_hit: R(_t, { prio: 58, group: `turret`, range: 32, verb: 0.2 }),
  fountain_laser: R(yt, { prio: 60, group: `turret` }),
  turret_aggro: R(vt, { prio: 82, group: `turret`, range: 32, verb: 0.1 }),
  minion_melee_attack: R(bt, { prio: 14, group: `minion_attack`, inner: 5 }),
  minion_caster_shot: R(xt, { prio: 14, group: `minion_attack`, inner: 5 }),
  minion_siege_shot: R(St, { prio: 22, group: `minion_attack`, inner: 5 }),
  minion_death: R(Ct, { prio: 20, group: `minion_death`, inner: 5 }),
  monster_attack: R(wt, { prio: 30, group: `monster` }),
  epic_monster_attack: R(Tt, {
    prio: 45,
    group: `monster`,
    range: 32,
    verb: 0.25,
  }),
  monster_death: R(Et, { prio: 34, group: `monster` }),
  epic_death: R(Dt, { prio: 80, range: 34, inner: 10, verb: 0.3, test: 3.6 }),
  champion_death: R(Qt, { prio: 62, verb: 0.25 }),
  player_death: R($t, { cat: `announcer`, prio: 96, verb: 0.3, test: 3.2 }),
  player_respawn: R(en, { cat: `announcer`, prio: 85, verb: 0.3, test: 2.6 }),
  turret_destroyed: R(nn, {
    prio: 86,
    range: 34,
    inner: 10,
    verb: 0.3,
    test: 4,
  }),
  inhibitor_destroyed: R(rn, {
    prio: 86,
    range: 34,
    inner: 10,
    verb: 0.3,
    test: 4,
  }),
  inhibitor_respawn: R(an, { prio: 40, verb: 0.3, test: 4 }),
  nexus_explosion: R(on, {
    cat: `announcer`,
    prio: 100,
    verb: 0.35,
    test: 6.5,
  }),
  level_up: R(sn, { cat: `ui`, prio: 80, verb: 0.3, group: `progress` }),
  level_up_other: R(cn, { prio: 18, group: `minor` }),
  gold_coin: R(ln, { cat: `ui`, prio: 64, group: `coin`, verb: 0.08 }),
  gold_kill: R(un, { cat: `ui`, prio: 70, group: `coin`, verb: 0.15 }),
  recall_channel: R(pn, { prio: 55, group: `recall`, verb: 0.3, test: 8.8 }),
  recall_teleport: R(mn, { prio: 60, verb: 0.3 }),
  recall_cancel: R(hn, { prio: 30 }),
  buy: R(gn, { cat: `ui`, prio: 75, verb: 0.08 }),
  sell: R(_n, { cat: `ui`, prio: 75, verb: 0.08 }),
  skill_up: R(vn, { cat: `ui`, prio: 70, verb: 0.1, group: `skill` }),
  gold_objective: R(dn, { cat: `ui`, prio: 72, group: `coin`, verb: 0.2 }),
  ping: R(yn, { cat: `ui`, prio: 60, group: `ping`, verb: 0.2 }),
  ping_attack: R(bn, { cat: `ui`, prio: 62, group: `ping`, verb: 0.2 }),
  ping_danger: R(xn, { cat: `ui`, prio: 64, group: `ping`, verb: 0.2 }),
  ping_omw: R(Sn, { cat: `ui`, prio: 60, group: `ping`, verb: 0.2 }),
  ping_missing: R(Cn, { cat: `ui`, prio: 62, group: `ping`, verb: 0.2 }),
  ping_assist: R(wn, { cat: `ui`, prio: 62, group: `ping`, verb: 0.2 }),
  ping_vision: R(Tn, { cat: `ui`, prio: 58, group: `ping`, verb: 0.25 }),
  monster_attack_verdant_warden: R(Ot, { prio: 30, group: `monster` }),
  monster_attack_crimson_brute: R(kt, { prio: 30, group: `monster` }),
  monster_attack_thornback: R(At, { prio: 28, group: `monster` }),
  monster_attack_mire_toad: R(jt, { prio: 28, group: `monster` }),
  monster_attack_ash_stalker: R(Mt, { prio: 28, group: `monster` }),
  monster_attack_shard_golem: R(Nt, { prio: 28, group: `monster` }),
  monster_attack_rift_skitter: R(Pt, { prio: 24, group: `monster` }),
  monster_death_verdant_warden: R(Ft, {
    prio: 36,
    group: `monster`,
    verb: 0.2,
  }),
  monster_death_crimson_brute: R(It, { prio: 36, group: `monster`, verb: 0.2 }),
  monster_death_thornback: R(Lt, { prio: 34, group: `monster` }),
  monster_death_mire_toad: R(Rt, { prio: 34, group: `monster` }),
  monster_death_ash_stalker: R(zt, { prio: 34, group: `monster` }),
  monster_death_shard_golem: R(Bt, { prio: 34, group: `monster` }),
  monster_death_rift_skitter: R(Vt, { prio: 40, group: `monster`, verb: 0.2 }),
  ward_place: R(Ht, { prio: 55, group: `ward`, verb: 0.15 }),
  ward_kill: R(Ut, { prio: 60, group: `ward`, verb: 0.2 }),
  ward_expire: R(Wt, { prio: 20, group: `ward`, verb: 0.15 }),
  buff_verdant: R(Gt, { prio: 66, group: `buff`, verb: 0.25 }),
  buff_crimson: R(Kt, { prio: 66, group: `buff`, verb: 0.25 }),
  buff_drake: R(qt, { prio: 68, group: `buff`, verb: 0.3 }),
  buff_tyrant: R(Jt, { prio: 68, group: `buff`, verb: 0.3 }),
  buff_shrine: R(Yt, { prio: 50, group: `buff`, verb: 0.15 }),
  shrine_spawn: R(Xt, { prio: 50, range: 32, verb: 0.3, test: 2.8 }),
  item_potion_buff: R(Zt, { prio: 45, verb: 0.1 }),
  ui_click: R(En, { cat: `ui`, prio: 90, group: `ui`, verb: 0.02 }),
  ui_hover: R(Dn, { cat: `ui`, prio: 88, group: `ui`, verb: 0 }),
  ui_confirm: R(On, { cat: `ui`, prio: 92, group: `ui`, verb: 0.15 }),
  ui_panel_open: R(kn, { cat: `ui`, prio: 86, group: `ui`, verb: 0.05 }),
  ui_panel_close: R(An, { cat: `ui`, prio: 86, group: `ui`, verb: 0.05 }),
  cc_stun: R(jn, { prio: 46, group: `cc` }),
  cc_knockup: R(Mn, { prio: 46, group: `cc` }),
  cc_knockback: R(Fn, { prio: 45, group: `cc` }),
  cc_pull: R(In, { prio: 45, group: `cc` }),
  cc_root: R(Nn, { prio: 40, group: `cc` }),
  cc_silence: R(Ln, { prio: 36, group: `cc` }),
  cc_slow: R(Pn, { prio: 16, group: `cc_minor` }),
  dash_generic: R(Bn, { prio: 34, group: `attack` }),
  swing_generic: R(Rn, { prio: 40, group: `attack` }),
  shot_generic: R(zn, { prio: 40, group: `attack` }),
  shield_up: R(Vn, { prio: 24, group: `minor` }),
  heal_tick: R(Hn, { prio: 30, group: `heal`, verb: 0.2 }),
  low_health: R(Wn, { prio: 90, group: `alarm`, verb: 0.05, test: 1.2 }),
};
function Wn(e, t, n, r) {
  let i = w(r.power ?? 1, 0, 1),
    a = 58 + 10 * i,
    o = e.thump(t, n, {
      f0: a,
      f1: 30,
      drop: 0.09,
      d: 0.3,
      peak: 0.44 + 0.08 * i,
      click: 0,
      knock: 0.15,
      crack: 0,
    });
  return (
    (o = z(
      o,
      e.thump(t, n + 0.135, {
        f0: a * 0.86,
        f1: 27,
        drop: 0.11,
        d: 0.4,
        peak: 0.3 + 0.06 * i,
        click: 0,
        knock: 0.1,
        crack: 0,
      }),
    )),
    (o = z(
      o,
      e.noiseHit(t, n, {
        color: `brown`,
        type: `bandpass`,
        f: 150 + 40 * i,
        q: 7,
        a: 0.008,
        d: 0.16,
        peak: 0.16,
      }),
    )),
    (o = z(
      o,
      e.noiseHit(t, n + 0.135, {
        color: `brown`,
        type: `bandpass`,
        f: 128 + 34 * i,
        q: 7,
        a: 0.01,
        d: 0.2,
        peak: 0.11,
      }),
    )),
    (o = z(
      o,
      e.body(t, n + 0.004, {
        peak: 0.34,
        crackF: 620 + 120 * i,
        d: 0.1,
        drive: 3,
      }),
    )),
    (o = z(
      o,
      e.body(t, n + 0.139, {
        peak: 0.24,
        crackF: 540 + 100 * i,
        d: 0.12,
        drive: 3,
      }),
    )),
    (o = z(
      o,
      e.tone(t, n + 0.008, {
        type: `triangle`,
        f: 396 + 70 * i,
        f1: 250,
        glide: 0.11,
        a: 0.004,
        d: 0.16,
        peak: 0.2 + 0.05 * i,
        lp: 1500,
      }),
    )),
    (o = z(
      o,
      e.tone(t, n + 0.142, {
        type: `triangle`,
        f: 330 + 56 * i,
        f1: 214,
        glide: 0.13,
        a: 0.005,
        d: 0.2,
        peak: 0.14 + 0.04 * i,
        lp: 1400,
      }),
    )),
    o
  );
}
var Gn = [
  `champion_death`,
  `epic_death`,
  `turret_destroyed`,
  `inhibitor_destroyed`,
  `inhibitor_respawn`,
  `ward_kill`,
  `buff_drake`,
  `buff_tyrant`,
  `buff_verdant`,
  `buff_crimson`,
  `shrine_spawn`,
  `cc_stun`,
  `cc_knockup`,
  `cc_knockback`,
  `cc_pull`,
  `cc_root`,
  `cc_silence`,
  `recall_teleport`,
  `low_health`,
];
for (let e in Un)
  (Gn.includes(e) || e.startsWith(`monster_death`)) && (Un[e].milestone = !0);
var V = Math.max;
function Kn(e, t, n) {
  let r = e.whoosh(t, n, {
      dur: 0.34,
      f0: 150,
      f1: 950,
      f2: 200,
      q: 1,
      peak: 0.5,
      peakAt: 0.55,
      pan0: -0.4,
      pan1: 0.4,
    }),
    i = n + 0.17;
  return (
    (r = V(
      r,
      e.thump(t, i, {
        f0: 100,
        f1: 34,
        drop: 0.14,
        d: 0.62,
        peak: 0.56,
        click: 0.3,
      }),
    )),
    (r = V(
      r,
      e.noiseHit(t, i, {
        color: `pink`,
        type: `lowpass`,
        f: 2600,
        f1: 200,
        glide: 0.35,
        d: 0.5,
        peak: 0.55,
      }),
    )),
    (r = V(r, e.body(t, i, { peak: 0.3, crackF: 1300, d: 0.3, rate: 0.6 }))),
    (r = V(
      r,
      e.noiseHit(t, i, { type: `bandpass`, f: 340, q: 2, d: 0.32, peak: 0.42 }),
    )),
    (r = V(r, e.crackle(t, i, { dur: 0.75, f: 1400, peak: 0.51, rate: 0.7 }))),
    V(r, e.crackle(t, i + 0.05, { dur: 0.6, f: 5600, peak: 0.15, rate: 1.3 }))
  );
}
function qn(e, t, n) {
  let r = e.crackle(t, n, {
    dur: 0.7,
    f: 300,
    q: 1.5,
    peak: 0.63,
    rate: 0.35,
    swell: !0,
  });
  ((r = V(
    r,
    e.body(t, n + 0.05, {
      peak: 0.45,
      crackF: 1100,
      d: 0.45,
      rate: 0.4,
      drive: 3,
    }),
  )),
    (r = V(
      r,
      e.noiseHit(t, n, {
        color: `brown`,
        type: `bandpass`,
        f: 220,
        q: 2.5,
        swell: !0,
        a: 0.3,
        d: 0.5,
        peak: 0.58,
      }),
    )),
    (r = V(
      r,
      e.thump(t, n + 0.12, {
        f0: 82,
        f1: 50,
        drop: 0.3,
        d: 0.95,
        peak: 0.42,
        click: 0.1,
      }),
    )));
  for (let [i, a] of [
    [38, 0.12],
    [45, 0.09],
  ])
    r = V(
      r,
      e.tone(t, n + 0.1, {
        type: `triangle`,
        f: E(i),
        a: 0.08,
        d: 1.2,
        peak: a,
        lp: 700,
      }),
    );
  return (
    (r = V(
      r,
      e.bell(t, n + 0.16, {
        f: 880,
        ratios: [1, 2.01, 2.99],
        d: 1.2,
        peak: 0.055,
      }),
    )),
    V(
      r,
      e.sparkle(t, n + 0.18, {
        dur: 0.6,
        count: 6,
        fMin: 1500,
        fMax: 4e3,
        peak: 0.035,
      }),
    )
  );
}
function Jn(e, t, n) {
  let r = n;
  return (
    [0, 0.12, 0.21, 0.28].forEach((i, a) => {
      ((r = V(
        r,
        e.thump(t, n + i, {
          f0: 110,
          f1: 48,
          drop: 0.08,
          d: 0.24,
          peak: 0.294 + a * 0.08,
          click: 0.2,
        }),
      )),
        e.noiseHit(t, n + i, {
          color: `pink`,
          type: `lowpass`,
          f: 900,
          d: 0.12,
          peak: 0.26,
        }));
    }),
    (r = V(
      r,
      e.rumble(t, n, { dur: 0.5, f: 220, peak: 0.289, swell: !0, a: 0.3 }),
    )),
    (r = V(
      r,
      e.whoosh(t, n, {
        dur: 0.36,
        f0: 200,
        f1: 1300,
        f2: 400,
        q: 1,
        peak: 0.36,
        peakAt: 0.8,
      }),
    )),
    V(
      r,
      e.crackle(t, n + 0.1, {
        dur: 0.4,
        f: 1900,
        peak: 0.28,
        rate: 0.9,
        swell: !0,
      }),
    )
  );
}
function Yn(e, t, n) {
  let r = e.thump(t, n, {
    f0: 85,
    f1: 28,
    drop: 0.2,
    d: 0.75,
    peak: 0.63,
    click: 0.4,
  });
  return (
    (r = V(r, e.body(t, n, { peak: 0.95, d: 0.2, crackF: 1900 }))),
    (r = V(
      r,
      e.noiseHit(t, n, {
        color: `pink`,
        type: `lowpass`,
        f: 3200,
        f1: 240,
        glide: 0.4,
        d: 0.55,
        peak: 0.55,
      }),
    )),
    V(r, e.crackle(t, n, { dur: 0.65, f: 1700, peak: 0.45, rate: 0.8 }))
  );
}
function Xn(e, t, n) {
  let r = e.noiseHit(t, n, {
    color: `pink`,
    type: `bandpass`,
    f: 950,
    f1: 420,
    glide: 0.25,
    q: 1.1,
    d: 0.28,
    peak: 0.3,
  });
  return (
    (r = V(
      r,
      e.thump(t, n, {
        f0: 125,
        f1: 60,
        drop: 0.06,
        d: 0.14,
        peak: 0.26,
        click: 0.2,
      }),
    )),
    V(r, e.crackle(t, n, { dur: 0.36, f: 2400, peak: 0.22, rate: 1.1 }))
  );
}
function Zn(e, t, n) {
  let r = e.crackle(t, n, {
    dur: 0.5,
    f: 700,
    q: 1.2,
    peak: 0.34,
    rate: 0.5,
    swell: !0,
  });
  return (
    (r = V(
      r,
      e.noiseHit(t, n, {
        color: `brown`,
        type: `bandpass`,
        f: 260,
        q: 3,
        swell: !0,
        a: 0.3,
        d: 0.3,
        peak: 0.3,
      }),
    )),
    (r = V(
      r,
      e.body(t, n + 0.42, {
        peak: 0.22,
        f: 240,
        d: 0.12,
        crack: 0.6,
        crackF: 1600,
      }),
    )),
    (r = V(
      r,
      e.tone(t, n + 0.4, {
        type: `triangle`,
        f: E(38),
        a: 0.02,
        d: 0.8,
        peak: 0.07,
        lp: 600,
      }),
    )),
    V(
      r,
      e.bell(t, n + 0.44, { f: 1320, ratios: [1, 2.01], d: 0.6, peak: 0.03 }),
    )
  );
}
function Qn(e, t, n) {
  let r = e.thump(t, n, {
    f0: 160,
    f1: 60,
    drop: 0.05,
    d: 0.25,
    peak: 0.38,
    click: 0.3,
  });
  return (
    (r = V(r, e.body(t, n, { peak: 0.36, f: 320, d: 0.12, crackF: 2400 }))),
    (r = V(r, e.crackle(t, n, { dur: 0.5, f: 2e3, peak: 0.5, rate: 1.1 }))),
    V(r, e.noiseHit(t, n, { type: `highpass`, f: 2500, d: 0.09, peak: 0.3 }))
  );
}
function $n(e, t, n) {
  let r = e.shaper(e.filter(t, `bandpass`, 650, 1.6), 3.5),
    i = e.tone(r, n, {
      type: `sawtooth`,
      f: 88,
      f1: 150,
      glide: 0.5,
      swell: !0,
      a: 0.42,
      d: 0.14,
      peak: 0.22,
    });
  return (
    (i = V(
      i,
      e.fm(t, n, {
        f: 55,
        ratio: 0.5,
        index: 7,
        indexEnd: 9,
        swell: !0,
        a: 0.42,
        d: 0.14,
        peak: 0.12,
      }),
    )),
    (i = V(
      i,
      e.whoosh(t, n, {
        dur: 0.56,
        f0: 300,
        f1: 3600,
        f2: 3e3,
        q: 0.9,
        peak: 0.42,
        peakAt: 0.93,
      }),
    )),
    V(i, e.crackle(t, n, { dur: 0.56, f: 3e3, peak: 0.2, swell: !0 }))
  );
}
function er(e, t, n) {
  let r = e.thump(t, n, {
    f0: 78,
    f1: 24,
    drop: 0.32,
    d: 1.7,
    peak: 0.7,
    click: 0.5,
  });
  return (
    (r = V(
      r,
      e.noiseHit(t, n, {
        color: `pink`,
        type: `lowpass`,
        f: 7e3,
        f1: 180,
        glide: 1.2,
        d: 1.4,
        peak: 0.72,
      }),
    )),
    (r = V(
      r,
      e.noiseHit(t, n, { type: `highpass`, f: 2500, d: 0.15, peak: 0.696 }),
    )),
    (r = V(
      r,
      e.tone(e.shaper(e.filter(t, `lowpass`, 260, 0.8), 4), n, {
        type: `sawtooth`,
        f: 55,
        f1: 40,
        glide: 0.8,
        d: 1,
        peak: 0.3,
      }),
    )),
    (r = V(
      r,
      e.noiseHit(t, n, {
        color: `brown`,
        type: `bandpass`,
        f: 900,
        f1: 300,
        glide: 1.2,
        q: 0.7,
        d: 1.8,
        peak: 0.493,
      }),
    )),
    (r = V(r, e.body(t, n, { peak: 1.55, crackF: 1500, d: 0.7, rate: 0.55 }))),
    (r = V(r, e.rumble(t, n, { dur: 2.4, f: 140, peak: 0.24 }))),
    (r = V(r, e.crackle(t, n + 0.05, { dur: 1.6, f: 1800, peak: 0.51 }))),
    V(r, e.crackle(t, n + 0.1, { dur: 2, f: 6e3, peak: 0.15, rate: 1.4 }))
  );
}
function tr(e, t, n) {
  let r = e.whoosh(t, n, {
    dur: 0.18,
    f0: 800,
    f1: 5200,
    f2: 6e3,
    q: 2,
    peak: 0.34,
    peakAt: 0.95,
    color: `white`,
  });
  r = V(
    r,
    e.fm(t, n, {
      f: 110,
      ratio: 1.414,
      index: 4,
      d: 0.42,
      a: 0.02,
      peak: 0.14,
    }),
  );
  let i = n + 0.16;
  return (
    (r = V(
      r,
      e.bell(t, i, {
        f: 3400,
        ratios: [1, 1.47, 2.31, 3.02],
        d: 0.35,
        peak: 0.1,
      }),
    )),
    (r = V(
      r,
      e.noiseHit(t, i, { type: `highpass`, f: 4e3, d: 0.08, peak: 0.44 }),
    )),
    (r = V(
      r,
      e.thump(t, i, {
        f0: 190,
        f1: 80,
        drop: 0.05,
        d: 0.11,
        peak: 0.4,
        click: 0,
      }),
    )),
    V(
      r,
      e.noiseHit(t, i, {
        color: `pink`,
        type: `bandpass`,
        f: 1500,
        f1: 600,
        glide: 0.4,
        q: 1,
        d: 0.5,
        peak: 0.12,
      }),
    )
  );
}
function nr(e, t, n) {
  let r = e.noiseHit(t, n, {
    color: `pink`,
    type: `bandpass`,
    f: 2600,
    f1: 1300,
    glide: 0.9,
    q: 6,
    swell: !0,
    a: 0.25,
    d: 0.9,
    peak: 0.26,
  });
  ((r = V(
    r,
    e.noiseHit(t, n, {
      type: `highpass`,
      f: 3200,
      swell: !0,
      a: 0.28,
      d: 0.3,
      peak: 0.07,
    }),
  )),
    (r = V(
      r,
      e.fm(t, n, {
        f: 146.8,
        ratio: 1.5,
        index: 2,
        a: 0.15,
        d: 1.2,
        peak: 0.05,
      }),
    )),
    (r = V(
      r,
      e.noiseHit(t, n, {
        color: `pink`,
        type: `bandpass`,
        f: 1500,
        f1: 1100,
        glide: 0.8,
        q: 2,
        swell: !0,
        a: 0.2,
        d: 0.7,
        peak: 0.46,
      }),
    )));
  for (let i of [440, 443.5])
    r = V(
      r,
      e.tone(t, n, { f: i, f1: i / 2, glide: 1, a: 0.05, d: 1, peak: 0.025 }),
    );
  return V(
    r,
    e.sparkle(t, n + 0.1, {
      dur: 0.8,
      count: 6,
      fMin: 1800,
      fMax: 3600,
      peak: 0.028,
    }),
  );
}
function rr(e, t, n) {
  let r = n;
  for (let i = 0; i < 3; i++) {
    let a = i % 2 ? 0.6 : -0.6;
    r = V(
      r,
      e.whoosh(t, n + i * 0.06, {
        dur: 0.12,
        f0: 2500,
        f1: 7e3,
        f2: 2e3,
        q: 1.4,
        peak: 0.28,
        pan0: a,
        pan1: -a,
        color: `white`,
      }),
    );
  }
  return V(
    r,
    e.bell(t, n + 0.1, {
      f: 2900,
      ratios: [1, 1.51, 2.37],
      d: 0.3,
      peak: 0.08,
    }),
  );
}
function ir(e, t, n) {
  let r = e.noiseHit(t, n, { type: `highpass`, f: 3500, d: 0.1, peak: 0.38 });
  return (
    (r = V(
      r,
      e.thump(t, n, {
        f0: 160,
        f1: 70,
        drop: 0.06,
        d: 0.16,
        peak: 0.36,
        click: 0,
      }),
    )),
    V(
      r,
      e.noiseHit(t, n, {
        color: `pink`,
        type: `bandpass`,
        f: 900,
        f1: 420,
        glide: 0.3,
        q: 2,
        d: 0.4,
        peak: 0.16,
      }),
    )
  );
}
function ar(e, t, n) {
  let r = e.whoosh(t, n, {
    dur: 0.36,
    f0: 90,
    f1: 900,
    f2: 1100,
    q: 1,
    peak: 0.46,
    peakAt: 0.96,
    color: `brown`,
  });
  r = V(r, e.tone(t, n, { f: 55, swell: !0, a: 0.32, d: 0.06, peak: 0.26 }));
  for (let [i, a] of [
    [0, 0.36],
    [1, 0.43],
    [2, 0.5],
  ]) {
    let o = i % 2 ? 0.5 : -0.5;
    ((r = V(
      r,
      e.whoosh(t, n + a, {
        dur: 0.08,
        f0: 3e3,
        f1: 7500,
        f2: 2500,
        q: 1.3,
        peak: 0.34,
        pan0: o,
        pan1: -o,
        color: `white`,
      }),
    )),
      (r = V(
        r,
        e.bell(t, n + a + 0.03, {
          f: 3e3 + i * 260,
          ratios: [1, 1.49, 2.3],
          d: 0.2,
          peak: 0.06,
        }),
      )));
  }
  let i = n + 0.6;
  return (
    (r = V(
      r,
      e.thump(t, i, {
        f0: 95,
        f1: 28,
        drop: 0.2,
        d: 0.85,
        peak: 0.665,
        click: 0.5,
      }),
    )),
    (r = V(r, e.body(t, i, { peak: 0.34, crackF: 2e3, d: 0.2 }))),
    (r = V(
      r,
      e.noiseHit(t, i, { type: `highpass`, f: 3e3, d: 0.15, peak: 0.797 }),
    )),
    (r = V(
      r,
      e.shatter(t, i, {
        count: 10,
        fMin: 1500,
        fMax: 5e3,
        dur: 0.6,
        peak: 0.084,
      }),
    )),
    V(
      r,
      e.noiseHit(t, i, {
        color: `pink`,
        type: `lowpass`,
        f: 2500,
        f1: 150,
        glide: 0.7,
        d: 0.9,
        peak: 0.46,
      }),
    )
  );
}
function or(e, t, n) {
  return V(
    e.fm(t, n, { f: 1760, ratio: 1.5, index: 1.2, d: 0.16, peak: 0.07 }),
    e.noiseHit(t, n, { type: `highpass`, f: 6e3, d: 0.02, peak: 0.05 }),
  );
}
function sr(e, t, n) {
  let r = e.whoosh(t, n, {
    dur: 0.12,
    f0: 3e3,
    f1: 8e3,
    f2: 3500,
    q: 1.3,
    peak: 0.3,
    color: `white`,
    pan0: -0.4,
    pan1: 0.4,
  });
  return (
    (r = V(
      r,
      e.bell(t, n + 0.02, {
        f: 2600,
        ratios: [1, 1.5, 2.3],
        d: 0.35,
        peak: 0.08,
      }),
    )),
    (r = V(
      r,
      e.thump(t, n, {
        f0: 200,
        f1: 90,
        drop: 0.05,
        d: 0.12,
        peak: 0.34,
        click: 0.2,
      }),
    )),
    (r = V(
      r,
      e.noiseHit(t, n, {
        color: `pink`,
        type: `bandpass`,
        f: 1300,
        f1: 520,
        glide: 0.25,
        q: 2,
        d: 0.3,
        peak: 0.16,
      }),
    )),
    V(r, e.fm(t, n, { f: 420, ratio: 2.7, index: 4, d: 0.24, peak: 0.07 }))
  );
}
function cr(e, t, n) {
  let r = e.noiseHit(t, n, {
    color: `pink`,
    type: `bandpass`,
    f: 500,
    f1: 3200,
    glide: 0.35,
    q: 2,
    swell: !0,
    a: 0.3,
    d: 0.08,
    peak: 0.24,
  });
  return (
    [81, 88].forEach((i, a) => {
      r = V(
        r,
        e.bell(t, n + 0.28 + a * 0.06, {
          f: E(i),
          ratios: [1, 2, 3.01],
          amps: [1, 0.3, 0.1],
          d: 0.9,
          peak: 0.06,
          pan: a ? 0.3 : -0.3,
        }),
      );
    }),
    V(
      r,
      e.fm(t, n, {
        f: 55,
        ratio: 0.5,
        index: 3,
        swell: !0,
        a: 0.25,
        d: 0.35,
        peak: 0.08,
      }),
    )
  );
}
function lr(e, t, n) {
  return V(
    e.whoosh(t, n, {
      dur: 0.25,
      f0: 1400,
      f1: 500,
      f2: 300,
      q: 1.4,
      peak: 0.2,
      peakAt: 0.2,
    }),
    e.noiseHit(t, n, { type: `highpass`, f: 3500, d: 0.08, peak: 0.1 }),
  );
}
function ur(e, t, n) {
  let r = e.tone(t, n, {
    f: 3300,
    f1: 850,
    glide: 0.56,
    a: 0.04,
    h: 0.42,
    r: 0.18,
    peak: 0.1,
    vib: [7, 25],
  });
  return (
    (r = V(
      r,
      e.tone(t, n + 0.02, {
        f: 4950,
        f1: 1270,
        glide: 0.54,
        a: 0.05,
        h: 0.38,
        r: 0.15,
        peak: 0.035,
      }),
    )),
    (r = V(
      r,
      e.sparkle(t, n, {
        dur: 0.5,
        count: 7,
        fMin: 2500,
        fMax: 6e3,
        peak: 0.035,
      }),
    )),
    V(
      r,
      e.noiseHit(t, n, {
        type: `bandpass`,
        f: 6e3,
        f1: 1500,
        glide: 0.55,
        q: 3,
        swell: !0,
        a: 0.5,
        d: 0.06,
        peak: 0.12,
      }),
    )
  );
}
function dr(e, t, n) {
  let r = e.noiseHit(t, n, {
    type: `bandpass`,
    f: 3e3,
    f1: 800,
    glide: 0.3,
    q: 1.5,
    d: 0.36,
    peak: 0.42,
  });
  return (
    (r = V(
      r,
      e.thump(t, n, {
        f0: 190,
        f1: 58,
        drop: 0.1,
        d: 0.42,
        peak: 0.6,
        click: 0.4,
      }),
    )),
    [1318, 1975, 2637].forEach((i, a) => {
      r = V(
        r,
        e.bell(t, n, {
          f: i,
          ratios: [1, 2.01, 3.02],
          d: 0.9,
          peak: 0.05,
          pan: (a - 1) * 0.4,
        }),
      );
    }),
    (r = V(
      r,
      e.sparkle(t, n, {
        dur: 0.5,
        count: 10,
        fMin: 3e3,
        fMax: 8e3,
        peak: 0.045,
      }),
    )),
    V(r, e.fm(t, n, { f: 700, ratio: 2.76, index: 5, d: 0.26, peak: 0.16 }))
  );
}
function fr(e, t, n) {
  return V(
    e.fm(t, n, {
      f: 180,
      f1: 90,
      glide: 0.5,
      ratio: 1.01,
      index: 8,
      a: 0.03,
      d: 0.55,
      peak: 0.14,
      vib: [9, 60],
    }),
    e.whoosh(t, n, {
      dur: 0.5,
      f0: 400,
      f1: 1700,
      f2: 300,
      q: 5,
      peak: 0.26,
      peakAt: 0.5,
      pan0: -0.6,
      pan1: 0.6,
    }),
  );
}
function pr(e, t, n) {
  let r = e.tone(t, n, { f: 230, f1: 45, glide: 0.4, d: 0.6, peak: 0.22 });
  return (
    (r = V(r, e.body(t, n, { peak: 0.98, crackF: 1300, d: 0.45, rate: 0.55 }))),
    (r = V(
      r,
      e.noiseHit(t, n, {
        color: `pink`,
        type: `lowpass`,
        f: 3e3,
        f1: 200,
        glide: 0.5,
        d: 0.6,
        peak: 0.32,
      }),
    )),
    V(
      r,
      e.fm(t, n + 0.05, {
        f: 92,
        ratio: 0.5,
        index: 3,
        a: 0.05,
        h: 1,
        r: 0.7,
        peak: 0.1,
        vib: [6, 80],
      }),
    )
  );
}
function mr(e, t, n) {
  let r = e.whoosh(t, n, {
    dur: 0.42,
    f0: 5200,
    f1: 2200,
    f2: 800,
    q: 2,
    peak: 0.34,
    peakAt: 0.14,
    color: `white`,
  });
  return (
    (r = V(
      r,
      e.bell(t, n, { f: 1760, ratios: [1, 2.76, 5.4], d: 0.75, peak: 0.08 }),
    )),
    (r = V(r, e.crackle(t, n, { dur: 0.42, f: 7e3, peak: 0.13, rate: 1.5 }))),
    (r = V(
      r,
      e.tone(t, n, { f: 1600, f1: 700, glide: 0.5, d: 0.52, peak: 0.055 }),
    )),
    V(
      r,
      e.thump(t, n, {
        f0: 210,
        f1: 90,
        drop: 0.05,
        d: 0.1,
        peak: 0.28,
        click: 0.2,
      }),
    )
  );
}
function hr(e, t, n) {
  let r = e.choir(t, n, {
    notes: [62, 69, 74, 77],
    a: 0.9,
    dur: 0.1,
    r: 0.45,
    peak: 0.11,
  });
  return (
    (r = V(
      r,
      e.sparkle(t, n, {
        dur: 1,
        count: 18,
        fMin: 2e3,
        fMax: 7e3,
        peak: 0.035,
        rise: !0,
      }),
    )),
    (r = V(
      r,
      e.noiseHit(t, n, {
        type: `bandpass`,
        f: 800,
        f1: 6e3,
        glide: 1,
        q: 2,
        swell: !0,
        a: 0.96,
        d: 0.05,
        peak: 0.3,
      }),
    )),
    (r = V(
      r,
      e.tone(t, n, {
        f: 55,
        f1: 110,
        glide: 1,
        swell: !0,
        a: 0.96,
        d: 0.06,
        peak: 0.24,
      }),
    )),
    [74, 77, 81, 86].forEach((i, a) => {
      r = V(
        r,
        e.bell(t, n + 0.12 + a * 0.2, {
          f: E(i),
          ratios: [1, 2, 3.01],
          d: 0.8,
          peak: 0.045,
        }),
      );
    }),
    r
  );
}
function gr(e, t, n) {
  let r = e.thump(t, n, {
    f0: 72,
    f1: 24,
    drop: 0.4,
    d: 2,
    peak: 0.7,
    click: 0.5,
  });
  return (
    (r = V(
      r,
      e.noiseHit(t, n, {
        type: `lowpass`,
        f: 12e3,
        f1: 300,
        glide: 1.5,
        q: 0.7,
        d: 2,
        peak: 0.55,
      }),
    )),
    (r = V(
      r,
      e.noiseHit(t, n, { type: `highpass`, f: 2600, d: 0.2, peak: 0.652 }),
    )),
    [86, 90, 93, 98].forEach((i, a) => {
      r = V(
        r,
        e.bell(t, n + a * 0.02, {
          f: E(i),
          ratios: [1, 2, 3.01],
          d: 3,
          peak: 0.045,
          pan: (a - 1.5) * 0.4,
        }),
      );
    }),
    (r = V(
      r,
      e.sparkle(t, n, { dur: 2, count: 28, fMin: 2500, fMax: 9e3, peak: 0.04 }),
    )),
    V(
      r,
      e.choir(t, n, {
        notes: [62, 66, 69, 74],
        a: 0.02,
        dur: 0.2,
        r: 1.6,
        peak: 0.07,
      }),
    )
  );
}
function _r(e, t, n, r) {
  let i = Math.max(0.3, Number(r.duration) || 2.5),
    a = i + 0.4,
    o = e.gain(t, 0);
  (o.gain.setValueAtTime(0, n),
    o.gain.linearRampToValueAtTime(1, n + 0.25),
    o.gain.setValueAtTime(1, n + i),
    o.gain.setTargetAtTime(0, n + i, 0.08));
  let s = e.gain(o, 0.09),
    c = e.osc(s, n, a, `sine`, 92);
  e.lfo(c.detune, n, a, 5.5, 60);
  let l = e.gain(c.frequency, 70);
  e.osc(l, n, a, `sine`, 92.9);
  let u = e.filter(e.gain(o, 0.16), `bandpass`, 900, 5);
  e.lfo(u.frequency, n, a, 1.8, 500);
  let d = e.pan(u, 0);
  return (
    d.pan && e.lfo(d.pan, n, a, 0.9, 0.6),
    e.noise(null, n, a, `pink`).connect(d),
    {
      end: n + a,
      stop(e) {
        try {
          (o.gain.cancelScheduledValues(e), o.gain.setTargetAtTime(0, e, 0.06));
        } catch {}
      },
    }
  );
}
function vr(e, t, n) {
  let r = e.thump(t, n, {
    f0: 150,
    f1: 70,
    drop: 0.08,
    d: 0.18,
    peak: 0.28,
    click: 0,
  });
  return (
    (r = V(
      r,
      e.whoosh(t, n, {
        dur: 0.2,
        f0: 1400,
        f1: 500,
        f2: 250,
        q: 4,
        peak: 0.12,
        peakAt: 0.3,
      }),
    )),
    V(
      r,
      e.fm(t, n, {
        f: 220,
        f1: 110,
        glide: 0.15,
        ratio: 1.5,
        index: 3,
        d: 0.22,
        peak: 0.06,
      }),
    )
  );
}
function yr(e, t, n) {
  let r = e.noiseHit(t, n, { type: `highpass`, f: 4e3, d: 0.06, peak: 0.38 });
  return (
    (r = V(
      r,
      e.bell(t, n, { f: 2093, ratios: [1, 2.76, 5.4], d: 0.6, peak: 0.08 }),
    )),
    (r = V(r, e.crackle(t, n, { dur: 0.35, f: 6500, peak: 0.26, rate: 1.4 }))),
    (r = V(
      r,
      e.thump(t, n, {
        f0: 240,
        f1: 110,
        drop: 0.05,
        d: 0.12,
        peak: 0.34,
        click: 0.2,
      }),
    )),
    V(r, e.body(t, n, { peak: 0.2, f: 420, d: 0.08, crackF: 2600 }))
  );
}
function br(e, t, n) {
  return V(
    e.bell(t, n, {
      f: E(86),
      ratios: [1, 2, 3.01],
      amps: [1, 0.3, 0.1],
      d: 0.5,
      peak: 0.05,
    }),
    e.sparkle(t, n, { dur: 0.2, count: 3, fMin: 4e3, fMax: 8e3, peak: 0.03 }),
  );
}
function xr(e, t, n) {
  let r = n;
  return (
    [81, 86, 90].forEach((i, a) => {
      r = V(
        r,
        e.bell(t, n + a * 0.05, {
          f: E(i),
          ratios: [1, 2, 3.01],
          amps: [1, 0.25, 0.08],
          d: 1,
          peak: 0.05,
          pan: (a - 1) * 0.35,
        }),
      );
    }),
    V(
      r,
      e.noiseHit(t, n, {
        type: `bandpass`,
        f: 6e3,
        q: 2,
        swell: !0,
        a: 0.18,
        d: 0.3,
        peak: 0.06,
      }),
    )
  );
}
function Sr(e, t, n) {
  let r = e.thump(t, n, {
    f0: 260,
    f1: 100,
    drop: 0.06,
    d: 0.15,
    peak: 0.34,
    click: 0.2,
  });
  return (
    [88, 93].forEach((i, a) => {
      r = V(
        r,
        e.bell(t, n + a * 0.02, {
          f: E(i),
          ratios: [1, 2, 3.01],
          d: 0.7,
          peak: 0.05,
          pan: a ? 0.3 : -0.3,
        }),
      );
    }),
    (r = V(
      r,
      e.sparkle(t, n, {
        dur: 0.35,
        count: 10,
        fMin: 3e3,
        fMax: 8e3,
        peak: 0.04,
      }),
    )),
    (r = V(
      r,
      e.noiseHit(t, n, {
        type: `bandpass`,
        f: 5e3,
        f1: 1500,
        glide: 0.2,
        q: 1.5,
        d: 0.25,
        peak: 0.24,
      }),
    )),
    V(r, e.fm(t, n, { f: 900, ratio: 2.76, index: 4, d: 0.3, peak: 0.09 }))
  );
}
function Cr(e, t, n) {
  let r = e.noiseHit(t, n, { type: `highpass`, f: 5e3, d: 0.02, peak: 0.46 });
  return (
    (r = V(
      r,
      e.pluck(t, n + 0.004, {
        f: 82,
        t60: 0.5,
        bright: 1,
        peak: 0.56,
        lp: 4200,
      }),
    )),
    (r = V(
      r,
      e.thump(t, n, {
        f0: 165,
        f1: 58,
        drop: 0.08,
        d: 0.16,
        peak: 0.46,
        click: 0,
      }),
    )),
    (r = V(
      r,
      e.whoosh(t, n + 0.01, {
        dur: 0.32,
        f0: 6200,
        f1: 3e3,
        f2: 1600,
        q: 7,
        peak: 0.26,
        peakAt: 0.1,
        color: `white`,
      }),
    )),
    (r = V(
      r,
      e.bell(t, n + 0.01, {
        f: 1568,
        ratios: [1, 2, 3.01],
        d: 0.8,
        peak: 0.075,
      }),
    )),
    V(
      r,
      e.sparkle(t, n + 0.02, {
        dur: 0.4,
        count: 6,
        fMin: 3e3,
        fMax: 7e3,
        peak: 0.035,
      }),
    )
  );
}
function wr(e, t, n) {
  let r = n;
  for (let i = 0; i < 5; i++) {
    let a = n + i * 0.035,
      o = -0.6 + i * 0.3;
    ((r = V(
      r,
      e.pluck(t, a, {
        f: 100 + i * 7,
        t60: 0.28,
        bright: 0.9,
        peak: 0.28,
        pan: o,
        lp: 3600,
      }),
    )),
      (r = V(
        r,
        e.whoosh(t, a + 0.01, {
          dur: 0.16,
          f0: 5200,
          f1: 2600,
          f2: 1400,
          q: 6,
          peak: 0.09,
          peakAt: 0.15,
          pan0: o * 0.5,
          pan1: o,
          color: `white`,
        }),
      )),
      e.noiseHit(t, a, {
        type: `highpass`,
        f: 4500,
        d: 0.012,
        peak: 0.2,
        pan: o,
      }));
  }
  return V(
    r,
    e.thump(t, n, {
      f0: 150,
      f1: 70,
      drop: 0.08,
      d: 0.15,
      peak: 0.34,
      click: 0,
    }),
  );
}
function Tr(e, t, n) {
  let r = e.whoosh(t, n, {
    dur: 0.3,
    f0: 700,
    f1: 1900,
    f2: 500,
    q: 0.8,
    peak: 0.3,
  });
  for (let i of [0.05, 0.25])
    r = V(
      r,
      e.noiseHit(t, n + i, {
        color: `pink`,
        type: `bandpass`,
        f: 2400,
        q: 1,
        d: 0.06,
        peak: 0.2,
      }),
    );
  for (let i of [0.33, 0.41])
    ((r = V(
      r,
      e.noiseHit(t, n + i, { type: `highpass`, f: 4e3, d: 0.016, peak: 0.34 }),
    )),
      (r = V(
        r,
        e.bell(t, n + i, {
          f: 2600 - (i > 0.4 ? 400 : 0),
          ratios: [1, 2.3],
          d: 0.1,
          peak: 0.05,
        }),
      )));
  return r;
}
function Er(e, t, n) {
  let r = e.tone(e.filter(t, `lowpass`, 2e3, 1), n, {
    type: `sawtooth`,
    f: 110,
    f1: 880,
    glide: 0.7,
    swell: !0,
    a: 0.68,
    d: 0.06,
    peak: 0.12,
  });
  return (
    (r = V(
      r,
      e.fm(t, n, {
        f: 440,
        f1: 1760,
        glide: 0.7,
        ratio: 2,
        index: 1.5,
        swell: !0,
        a: 0.68,
        d: 0.06,
        peak: 0.07,
      }),
    )),
    (r = V(
      r,
      e.choir(t, n, {
        notes: [69, 74, 78],
        a: 0.6,
        dur: 0.1,
        r: 0.25,
        peak: 0.06,
      }),
    )),
    V(
      r,
      e.crackle(t, n, { dur: 0.7, f: 6e3, peak: 0.12, swell: !0, rate: 1.5 }),
    )
  );
}
function Dr(e, t, n) {
  let r = e.thump(t, n, {
    f0: 95,
    f1: 30,
    drop: 0.25,
    d: 1,
    peak: 0.63,
    click: 0.45,
  });
  return (
    (r = V(
      r,
      e.noiseHit(t, n, {
        type: `bandpass`,
        f: 4200,
        f1: 1200,
        glide: 1,
        q: 0.7,
        d: 1.2,
        peak: 0.797,
      }),
    )),
    (r = V(
      r,
      e.fm(t, n, {
        f: 1250,
        f1: 300,
        glide: 1,
        ratio: 1.41,
        index: 6,
        d: 1.1,
        peak: 0.18,
      }),
    )),
    [69, 73, 76, 81].forEach((i, a) => {
      r = V(
        r,
        e.bell(t, n, {
          f: E(i + 12),
          ratios: [1, 2, 3],
          d: 2,
          peak: 0.04,
          pan: (a - 1.5) * 0.4,
        }),
      );
    }),
    (r = V(r, e.crackle(t, n, { dur: 1.2, f: 7e3, peak: 0.21, rate: 1.6 }))),
    V(
      r,
      e.noiseHit(t, n, {
        color: `pink`,
        type: `lowpass`,
        f: 2200,
        f1: 150,
        glide: 0.8,
        d: 1,
        peak: 0.42,
      }),
    )
  );
}
function Or(e, t, n) {
  return V(
    e.noiseHit(t, n, { type: `highpass`, f: 5e3, d: 0.012, peak: 0.12 }),
    e.tone(t, n, { f: 2600, d: 0.05, peak: 0.03 }),
  );
}
function kr(e, t, n) {
  let r = e.noiseHit(t, n, { type: `highpass`, f: 4500, d: 0.02, peak: 0.44 });
  return (
    (r = V(
      r,
      e.pluck(t, n + 0.004, { f: 74, t60: 0.5, bright: 1, peak: 0.5, lp: 4e3 }),
    )),
    (r = V(
      r,
      e.thump(t, n, {
        f0: 150,
        f1: 55,
        drop: 0.08,
        d: 0.18,
        peak: 0.44,
        click: 0,
      }),
    )),
    (r = V(
      r,
      e.whoosh(t, n + 0.01, {
        dur: 0.45,
        f0: 7e3,
        f1: 2500,
        f2: 1200,
        q: 5,
        peak: 0.28,
        peakAt: 0.12,
        color: `white`,
      }),
    )),
    (r = V(
      r,
      e.whoosh(t, n + 0.02, {
        dur: 0.5,
        f0: 600,
        f1: 1800,
        f2: 900,
        q: 1,
        peak: 0.15,
        peakAt: 0.35,
        pan0: -0.3,
        pan1: 0.3,
      }),
    )),
    (r = V(
      r,
      e.bell(t, n + 0.01, {
        f: 1760,
        ratios: [1, 2, 3.01],
        d: 0.7,
        peak: 0.06,
      }),
    )),
    V(
      r,
      e.sparkle(t, n + 0.02, {
        dur: 0.35,
        count: 6,
        fMin: 3e3,
        fMax: 7500,
        peak: 0.035,
      }),
    )
  );
}
function Ar(e, t, n) {
  let r = e.thump(t, n, {
    f0: 210,
    f1: 80,
    drop: 0.05,
    d: 0.12,
    peak: 0.36,
    click: 0.3,
  });
  return (
    (r = V(
      r,
      e.noiseHit(t, n, {
        type: `bandpass`,
        f: 2200,
        q: 1.5,
        d: 0.06,
        peak: 0.34,
      }),
    )),
    (r = V(
      r,
      e.bell(t, n, { f: 2400, ratios: [1, 2.3], d: 0.25, peak: 0.05 }),
    )),
    V(
      r,
      e.whoosh(t, n, {
        dur: 0.1,
        f0: 3e3,
        f1: 1200,
        f2: 800,
        q: 2,
        peak: 0.1,
        peakAt: 0.2,
        color: `white`,
      }),
    )
  );
}
function jr(e, t, n) {
  let r = e.thump(t, n, {
    f0: 190,
    f1: 70,
    drop: 0.05,
    d: 0.16,
    peak: 0.44,
    click: 0.35,
  });
  return (
    (r = V(r, e.body(t, n, { peak: 0.2, f: 360, d: 0.08, crackF: 2400 }))),
    (r = V(
      r,
      e.noiseHit(t, n, {
        type: `bandpass`,
        f: 1800,
        q: 1.4,
        d: 0.08,
        peak: 0.38,
      }),
    )),
    (r = V(
      r,
      e.bell(t, n, { f: 1568, ratios: [1, 2, 3.01], d: 0.5, peak: 0.06 }),
    )),
    V(
      r,
      e.sparkle(t, n, {
        dur: 0.2,
        count: 4,
        fMin: 3e3,
        fMax: 7e3,
        peak: 0.035,
      }),
    )
  );
}
function Mr(e, t, n) {
  let r = e.thump(t, n, {
    f0: 230,
    f1: 100,
    drop: 0.04,
    d: 0.08,
    peak: 0.3,
    click: 0.25,
  });
  return (
    (r = V(
      r,
      e.noiseHit(t, n, {
        type: `bandpass`,
        f: 2600,
        q: 1.8,
        d: 0.04,
        peak: 0.28,
      }),
    )),
    V(r, e.bell(t, n, { f: 2800, ratios: [1, 2.2], d: 0.15, peak: 0.03 }))
  );
}
function Nr(e, t, n) {
  let r = e.noiseHit(t, n + 0.02, {
    type: `highpass`,
    f: 4e3,
    d: 0.015,
    peak: 0.24,
  });
  return (
    (r = V(
      r,
      e.fm(t, n, {
        f: 880,
        f1: 1320,
        glide: 0.2,
        ratio: 2,
        index: 1.5,
        a: 0.03,
        d: 0.5,
        peak: 0.06,
      }),
    )),
    V(
      r,
      e.tone(t, n, {
        f: 1760,
        swell: !0,
        a: 0.15,
        d: 0.3,
        peak: 0.03,
        vib: [7, 20],
      }),
    )
  );
}
function Pr(e, t, n) {
  let r = e.thump(t, n, {
    f0: 180,
    f1: 60,
    drop: 0.06,
    d: 0.2,
    peak: 0.44,
    click: 0.35,
  });
  return (
    (r = V(
      r,
      e.noiseHit(t, n, { type: `highpass`, f: 3e3, d: 0.05, peak: 0.38 }),
    )),
    (r = V(
      r,
      e.bell(t, n, { f: 2093, ratios: [1, 2.02, 3.1], d: 0.5, peak: 0.07 }),
    )),
    V(
      r,
      e.sparkle(t, n, {
        dur: 0.25,
        count: 5,
        fMin: 3e3,
        fMax: 8e3,
        peak: 0.035,
      }),
    )
  );
}
function Fr(e, t, n) {
  let r = e.chain(t, n, { count: 12, dur: 0.45, peak: 0.16 });
  return (
    (r = V(
      r,
      e.whoosh(t, n, {
        dur: 0.42,
        f0: 200,
        f1: 1050,
        f2: 380,
        q: 1,
        peak: 0.42,
        pan0: -0.3,
        pan1: 0.3,
      }),
    )),
    (r = V(
      r,
      e.noiseHit(t, n + 0.1, {
        type: `bandpass`,
        f: 3600,
        f1: 1500,
        glide: 0.3,
        q: 1,
        d: 0.3,
        peak: 0.14,
      }),
    )),
    V(
      r,
      e.tone(t, n, {
        type: `sawtooth`,
        f: 92,
        d: 0.22,
        peak: 0.08,
        bp: 700,
        q: 8,
      }),
    )
  );
}
function Ir(e, t, n) {
  let r = e.noiseHit(t, n, {
    color: `pink`,
    type: `lowpass`,
    f: 1400,
    f1: 300,
    glide: 0.12,
    d: 0.22,
    peak: 0.3,
  });
  return (
    (r = V(
      r,
      e.thump(t, n, {
        f0: 150,
        f1: 62,
        drop: 0.07,
        d: 0.2,
        peak: 0.26,
        click: 0.18,
      }),
    )),
    (r = V(r, e.chain(t, n + 0.06, { count: 7, dur: 0.34, peak: 0.09 }))),
    V(r, e.bubbles(t, n + 0.02, { count: 5, dur: 0.4, peak: 0.04 }))
  );
}
function Lr(e, t, n) {
  let r = e.noiseHit(t, n, {
    type: `bandpass`,
    f: 4200,
    f1: 900,
    glide: 0.18,
    q: 2.2,
    d: 0.2,
    peak: 0.16,
  });
  return (
    (r = V(
      r,
      e.tone(t, n, { f: 1180, f1: 420, glide: 0.16, d: 0.2, peak: 0.05 }),
    )),
    V(
      r,
      e.sparkle(t, n, {
        dur: 0.26,
        count: 4,
        fMin: 2200,
        fMax: 5200,
        peak: 0.03,
      }),
    )
  );
}
function Rr(e, t, n) {
  let r = e.noiseHit(t, n, {
    color: `pink`,
    type: `bandpass`,
    f: 400,
    f1: 2100,
    glide: 0.45,
    q: 1.2,
    swell: !0,
    a: 0.42,
    d: 0.6,
    peak: 0.36,
  });
  r = V(r, e.bubbles(t, n, { count: 14, dur: 1, peak: 0.065 }));
  for (let i of [523, 784])
    r = V(
      r,
      e.tone(t, n + 0.1, {
        f: i,
        a: 0.3,
        h: 0.6,
        r: 0.8,
        peak: 0.045,
        vib: [5, 40],
      }),
    );
  return V(r, e.tone(t, n, { f: 110, a: 0.2, h: 0.5, r: 0.8, peak: 0.08 }));
}
function zr(e, t, n) {
  return e.whoosh(t, n, {
    dur: 0.22,
    f0: 400,
    f1: 1600,
    f2: 1200,
    q: 2,
    peak: 0.3,
    peakAt: 0.9,
  });
}
function Br(e, t, n) {
  let r = e.thump(t, n, {
    f0: 88,
    f1: 34,
    drop: 0.12,
    d: 0.5,
    peak: 0.56,
    click: 0.3,
  });
  return (
    (r = V(r, e.splash(t, n, { size: 1.2, peak: 0.55 }))),
    (r = V(r, e.bubbles(t, n + 0.1, { count: 10, dur: 0.8, peak: 0.07 }))),
    V(
      r,
      e.noiseHit(t, n, {
        type: `highpass`,
        f: 4e3,
        a: 0.01,
        d: 0.6,
        peak: 0.189,
      }),
    )
  );
}
function Vr(e, t, n) {
  let r = e.rumble(t, n, { dur: 0.62, f: 190, peak: 0.24, swell: !0, a: 0.5 });
  r = V(
    r,
    e.body(t, n + 0.3, {
      peak: 0.45,
      crackF: 1300,
      d: 0.35,
      rate: 0.5,
      drive: 3,
    }),
  );
  let i = e.filter(e.filter(t, `lowpass`, 900, 0.7), `peaking`, 420, 2, 8);
  return (
    (r = V(
      r,
      e.tone(i, n, {
        type: `sawtooth`,
        f: 72,
        f1: 112,
        glide: 0.5,
        a: 0.18,
        h: 0.25,
        r: 0.35,
        peak: 0.16,
        vib: [4, 30],
      }),
    )),
    V(
      r,
      e.noiseHit(t, n, {
        color: `pink`,
        type: `bandpass`,
        f: 300,
        f1: 1600,
        glide: 0.5,
        q: 1,
        swell: !0,
        a: 0.5,
        d: 0.1,
        peak: 0.34,
      }),
    )
  );
}
function Hr(e, t, n) {
  let r = e.thump(t, n, {
    f0: 75,
    f1: 25,
    drop: 0.3,
    d: 1.3,
    peak: 0.665,
    click: 0.3,
  });
  return (
    (r = V(r, e.splash(t, n, { size: 2, peak: 0.7 }))),
    (r = V(
      r,
      e.body(t, n, { peak: 0.72, crackF: 1400, d: 0.6, rate: 0.6, drive: 3 }),
    )),
    (r = V(
      r,
      e.noiseHit(t, n, {
        color: `pink`,
        type: `lowpass`,
        f: 6e3,
        f1: 300,
        glide: 1.6,
        a: 0.05,
        d: 2,
        peak: 0.56,
      }),
    )),
    (r = V(r, e.bubbles(t, n + 0.2, { count: 20, dur: 1.5, peak: 0.06 }))),
    (r = V(
      r,
      e.noiseHit(t, n + 0.05, {
        type: `highpass`,
        f: 5e3,
        a: 0.02,
        d: 1,
        peak: 0.261,
      }),
    )),
    V(r, e.rumble(t, n, { dur: 2, f: 150, peak: 0.28 }))
  );
}
function Ur(e, t, n) {
  let r = e.thump(t, n, {
    f0: 110,
    f1: 42,
    drop: 0.1,
    d: 0.35,
    peak: 0.52,
    click: 0.35,
  });
  return (
    (r = V(r, e.body(t, n, { peak: 0.26, f: 300, d: 0.1, crackF: 2e3 }))),
    (r = V(
      r,
      e.bell(t, n, { f: 330, ratios: [1, 2.4, 3.9, 5.2], d: 0.6, peak: 0.1 }),
    )),
    (r = V(r, e.chain(t, n + 0.02, { count: 5, dur: 0.15, peak: 0.08 }))),
    V(r, e.splash(t, n, { size: 0.5, peak: 0.2 }))
  );
}
function Wr(e, t, n) {
  let r = e.chain(t, n, { count: 10, dur: 0.3, peak: 0.11 });
  return (
    (r = V(
      r,
      e.whoosh(t, n, {
        dur: 0.32,
        f0: 1200,
        f1: 400,
        f2: 300,
        q: 1.2,
        peak: 0.2,
        peakAt: 0.3,
      }),
    )),
    V(
      r,
      e.tone(t, n, {
        type: `sawtooth`,
        f: 140,
        f1: 90,
        glide: 0.3,
        bp: 800,
        q: 6,
        d: 0.3,
        peak: 0.05,
      }),
    )
  );
}
function Gr(e, t, n, r) {
  let i = Math.max(0.2, Number(r.duration) || 0.8),
    a = e.noiseHit(t, n, {
      color: `pink`,
      type: `lowpass`,
      f: 1800,
      q: 0.7,
      a: 0.12,
      h: i * 0.7,
      r: 0.35,
      peak: 0.42,
    });
  return (
    (a = V(
      a,
      e.noiseHit(t, n, {
        color: `brown`,
        type: `lowpass`,
        f: 260,
        q: 0.8,
        a: 0.1,
        h: i * 0.75,
        r: 0.4,
        peak: 0.36,
      }),
    )),
    (a = V(
      a,
      e.noiseHit(t, n + 0.05, {
        type: `bandpass`,
        f: 900,
        f1: 1500,
        glide: i,
        q: 0.9,
        a: 0.15,
        h: i * 0.5,
        r: 0.3,
        peak: 0.36,
      }),
    )),
    (a = V(
      a,
      e.noiseHit(t, n + 0.1, {
        type: `highpass`,
        f: 3200,
        a: 0.2,
        h: i * 0.4,
        r: 0.3,
        peak: 0.1,
      }),
    )),
    V(a, e.bubbles(t, n, { count: 10, dur: i, peak: 0.05 }))
  );
}
function Kr(e, t, n) {
  let r = e.splash(t, n, { size: 0.7, peak: 0.32 });
  return (
    (r = V(
      r,
      e.thump(t, n, {
        f0: 130,
        f1: 60,
        drop: 0.08,
        d: 0.2,
        peak: 0.34,
        click: 0.2,
      }),
    )),
    V(
      r,
      e.whoosh(t, n + 0.05, {
        dur: 0.3,
        f0: 400,
        f1: 1600,
        f2: 900,
        q: 1.2,
        peak: 0.14,
        peakAt: 0.5,
      }),
    )
  );
}
function qr(e, t, n) {
  return V(
    e.noiseHit(t, n, {
      color: `pink`,
      type: `bandpass`,
      f: 500,
      f1: 1400,
      glide: 0.35,
      q: 3,
      swell: !0,
      a: 0.15,
      d: 0.35,
      peak: 0.18,
    }),
    e.bubbles(t, n + 0.05, { count: 6, dur: 0.35, peak: 0.05 }),
  );
}
function Jr(e, t, n) {
  let r = e.bell(t, n, {
    f: 1318,
    ratios: [1, 2, 3],
    amps: [1, 0.25, 0.08],
    d: 0.5,
    peak: 0.04,
  });
  return (
    (r = V(r, e.bubbles(t, n, { count: 3, dur: 0.2, peak: 0.03 }))),
    V(r, e.tone(t, n, { f: 660, f1: 990, glide: 0.15, d: 0.25, peak: 0.025 }))
  );
}
function Yr(e, t, n) {
  let r = e.whoosh(t, n, {
      dur: 0.18,
      f0: 1200,
      f1: 7e3,
      f2: 8e3,
      q: 2,
      peak: 0.34,
      peakAt: 0.9,
      color: `white`,
    }),
    i = n + 0.15;
  return (
    (r = V(
      r,
      e.zap(t, i, {
        f0: 2200,
        f1: 5500,
        dur: 0.12,
        ratio: 1.41,
        index: 3,
        peak: 0.13,
      }),
    )),
    (r = V(
      r,
      e.sparkle(t, i, {
        dur: 0.35,
        count: 8,
        fMin: 3e3,
        fMax: 8e3,
        peak: 0.05,
      }),
    )),
    (r = V(
      r,
      e.noiseHit(t, i, { type: `highpass`, f: 6e3, d: 0.12, peak: 0.2 }),
    )),
    V(
      r,
      e.thump(t, i, {
        f0: 300,
        f1: 120,
        drop: 0.05,
        d: 0.08,
        peak: 0.2,
        click: 0,
      }),
    )
  );
}
function Xr(e, t, n) {
  let r = n;
  [74, 78, 81, 86].forEach((i, a) => {
    r = V(
      r,
      e.bell(t, n + a * 0.07, {
        f: E(i),
        ratios: [1, 2, 3],
        amps: [1, 0.25, 0.08],
        d: 1,
        peak: 0.07,
        pan: -0.3 + a * 0.2,
      }),
    );
  });
  for (let i of [62, 66, 69])
    r = V(
      r,
      e.strings(t, n, { f: E(i), dur: 0.3, a: 0.15, r: 0.8, peak: 0.05 }),
    );
  return (
    (r = V(
      r,
      e.whoosh(t, n, {
        dur: 0.7,
        f0: 500,
        f1: 3e3,
        q: 1.5,
        peak: 0.14,
        peakAt: 0.7,
      }),
    )),
    V(
      r,
      e.sparkle(t, n + 0.1, {
        dur: 1,
        count: 10,
        fMin: 2500,
        fMax: 6e3,
        peak: 0.035,
      }),
    )
  );
}
function Zr(e, t, n) {
  let r = e.noiseHit(t, n, { type: `highpass`, f: 1500, d: 0.25, peak: 0.797 });
  ((r = V(
    r,
    e.thump(t, n, {
      f0: 95,
      f1: 30,
      drop: 0.2,
      d: 0.9,
      peak: 0.595,
      click: 0.5,
    }),
  )),
    (r = V(
      r,
      e.noiseHit(t, n, {
        color: `pink`,
        type: `lowpass`,
        f: 4e3,
        f1: 200,
        glide: 0.8,
        d: 1,
        peak: 0.46,
      }),
    )));
  for (let i of [1175, 1760])
    r = V(r, e.bell(t, n, { f: i, ratios: [1, 2, 3.01], d: 1.5, peak: 0.07 }));
  return V(
    r,
    e.zap(t, n, { f0: 3e3, f1: 400, dur: 0.3, index: 6, peak: 0.18 }),
  );
}
function Qr(e, t, n) {
  let r = e.whoosh(t, n, {
    dur: 0.42,
    f0: 400,
    f1: 3200,
    f2: 1200,
    q: 0.9,
    peak: 0.4,
    peakAt: 0.3,
  });
  return (
    (r = V(r, e.crackle(t, n + 0.05, { dur: 1.2, f: 3e3, peak: 0.3 }))),
    (r = V(
      r,
      e.noiseHit(t, n + 0.05, {
        color: `brown`,
        type: `lowpass`,
        f: 800,
        a: 0.05,
        d: 1.2,
        peak: 0.2,
      }),
    )),
    (r = V(
      r,
      e.body(t, n, { peak: 0.22, crackF: 2e3, d: 0.3, rate: 0.9, drive: 3 }),
    )),
    V(
      r,
      e.tone(t, n, {
        type: `sawtooth`,
        f: 180,
        f1: 90,
        glide: 0.1,
        d: 0.12,
        peak: 0.08,
        lp: 900,
      }),
    )
  );
}
function $r(e, t, n) {
  return V(
    e.crackle(t, n, { dur: 0.22, f: 3500, peak: 0.13 }),
    e.noiseHit(t, n, { type: `bandpass`, f: 1e3, q: 1, d: 0.1, peak: 0.1 }),
  );
}
function ei(e, t, n) {
  return V(
    e.noiseHit(t, n, {
      type: `bandpass`,
      f: 2400,
      f1: 500,
      glide: 0.22,
      q: 2,
      d: 0.25,
      peak: 0.12,
    }),
    e.tone(t, n, { f: 880, f1: 330, glide: 0.2, d: 0.22, peak: 0.04 }),
  );
}
function ti(e, t, n) {
  return V(
    e.thump(t, n, {
      f0: 170,
      f1: 80,
      drop: 0.06,
      d: 0.15,
      peak: 0.24,
      click: 0,
    }),
    e.noiseHit(t, n, { type: `bandpass`, f: 1400, q: 1, d: 0.12, peak: 0.16 }),
  );
}
function ni(e, t, n, r) {
  let i = Math.max(0.2, Number(r.duration) || 0.8);
  return e.whoosh(t, n, {
    dur: i + 0.2,
    f0: 300,
    f1: 1400,
    f2: 500,
    q: 0.9,
    peak: 0.34,
    peakAt: 0.5,
  });
}
function ri(e, t, n, r, i) {
  let a = i ? 1.25 : 1,
    o = n;
  switch (r) {
    case `earth`:
      o = V(
        e.thump(t, n, { f0: 100, f1: 36, d: 0.5 * a, peak: 0.49 * a }),
        e.body(t, n, { peak: 0.3 * a, crackF: 1300, d: 0.3 * a, rate: 0.5 }),
        e.crackle(t, n, { dur: 0.5 * a, f: 1500, peak: 0.45 }),
      );
      break;
    case `fire`:
      o = V(
        e.whoosh(t, n, {
          dur: 0.4 * a,
          f0: 400,
          f1: 3e3,
          f2: 800,
          q: 0.9,
          peak: 0.4,
        }),
        e.crackle(t, n, { dur: 0.8 * a, f: 3200, peak: 0.39 }),
      );
      break;
    case `frost`:
      o = V(
        e.bell(t, n, { f: 1760, ratios: [1, 2.76, 5.4], d: 0.7, peak: 0.08 }),
        e.crackle(t, n, { dur: 0.4, f: 7e3, peak: 0.21, rate: 1.5 }),
        e.whoosh(t, n, {
          dur: 0.3,
          f0: 5e3,
          f1: 2e3,
          q: 2,
          peak: 0.24,
          peakAt: 0.2,
          color: `white`,
        }),
      );
      break;
    case `shadow`:
      o = V(
        e.fm(t, n, { f: 196, ratio: 1.414, index: 4, d: 0.5 * a, peak: 0.14 }),
        e.noiseHit(t, n, {
          color: `pink`,
          type: `bandpass`,
          f: 1800,
          f1: 600,
          q: 4,
          d: 0.5,
          peak: 0.29,
        }),
      );
      break;
    case `light`:
      o = V(
        e.bell(t, n, { f: 1568, ratios: [1, 2, 3.01], d: 0.8, peak: 0.08 }),
        e.whoosh(t, n, { dur: 0.3 * a, f0: 900, f1: 5e3, q: 2, peak: 0.26 }),
        e.sparkle(t, n, { dur: 0.4, count: 6, peak: 0.04 }),
      );
      break;
    case `water`:
      o = V(e.splash(t, n, { size: i ? 1.4 : 0.9, peak: 0.45 }));
      break;
    case `nature`:
      o = V(
        e.whoosh(t, n, { dur: 0.4, f0: 600, f1: 2400, q: 1, peak: 0.28 }),
        e.bell(t, n, { f: 1046, ratios: [1, 2, 3], d: 0.7, peak: 0.06 }),
      );
      break;
    case `storm`:
      o = V(
        e.zap(t, n, { f0: 3e3, f1: 400, dur: 0.3 * a, index: 7, peak: 0.2 }),
        e.noiseHit(t, n, { type: `highpass`, f: 2e3, d: 0.2, peak: 0.522 }),
      );
      break;
    default:
      o = V(
        e.fm(t, n, { f: 520, ratio: 2.5, index: 3, d: 0.35 * a, peak: 0.16 }),
        e.sparkle(t, n, { dur: 0.35, count: 6, peak: 0.04 }),
        e.noiseHit(t, n, {
          type: `bandpass`,
          f: 2400,
          f1: 900,
          q: 3,
          d: 0.25,
          peak: 0.377,
        }),
      );
  }
  return (
    i &&
      ((o = V(
        o,
        e.thump(t, n, { f0: 80, f1: 28, drop: 0.2, d: 1, peak: 0.56 }),
      )),
      (o = V(
        o,
        e.body(t, n, { peak: 0.58, crackF: 1500, d: 0.32, rate: 0.6 }),
      ))),
    o
  );
}
var ii = [
    `earth`,
    `fire`,
    `frost`,
    `shadow`,
    `light`,
    `water`,
    `nature`,
    `storm`,
    `arcane`,
  ],
  H = (e, t = {}) => R(e, { prio: 66, group: `ability`, verb: 0.2, ...t }),
  U = (e, t = {}) => R(e, { prio: 50, group: `passive`, verb: 0.15, ...t }),
  W = {
    brannoc_q: H(Kn),
    brannoc_w: H(qn),
    brannoc_e: H(Jn),
    brannoc_r: H($n, { prio: 78 }),
    brannoc_r_burst: H(er, { prio: 82, range: 32, verb: 0.28, test: 3 }),
    brannoc_e_impact: H(Yn, { prio: 70 }),
    brannoc_e_land: U(Xn, {}),
    brannoc_p_buff: U(Zn, {}),
    brannoc_p_break: U(Qn, { prio: 58 }),
    sable_q: H(tr),
    sable_w: H(nr),
    sable_e: H(rr),
    sable_e_burst: H(ir),
    sable_r: H(ar, { prio: 80, verb: 0.25 }),
    sable_p_mark: U(or, { prio: 36 }),
    sable_p_detonate: U(sr, { prio: 62 }),
    sable_r_reset: H(cr, { prio: 76, verb: 0.3 }),
    sable_w_end: U(lr, { prio: 40 }),
    morrow_q: H(ur),
    morrow_q_burst: H(dr),
    morrow_w: H(fr),
    morrow_w_burst: H(pr, { test: 2.4 }),
    morrow_e: H(mr),
    morrow_w_zone: H(_r, { prio: 60, group: `zone`, live: !0, test: 3.2 }),
    morrow_w_tick: U(vr, { prio: 46 }),
    morrow_e_impact: H(yr, { prio: 64 }),
    morrow_p_mark: U(br, { prio: 34 }),
    morrow_p_empower: U(xr, {}),
    morrow_p_detonate: U(Sr, { prio: 60 }),
    morrow_r: H(hr, { prio: 78 }),
    morrow_r_burst: H(gr, { prio: 84, range: 32, verb: 0.3, test: 3.6 }),
    vyre_q: H(Cr),
    vyre_w: H(wr),
    vyre_e: H(Tr),
    vyre_r: H(Er, { prio: 78 }),
    vyre_r_burst: H(Dr, { prio: 82, range: 32, verb: 0.3, test: 3 }),
    vyre_p_mark: U(Or, { prio: 30, group: `minor` }),
    vyre_p_empower: H(kr, { prio: 62 }),
    vyre_p_impact: U(Ar, { group: `hit`, prio: 46 }),
    vyre_q_impact: H(jr, { prio: 58, group: `hit` }),
    vyre_w_impact: U(Mr, { group: `hit`, prio: 44 }),
    vyre_e_empower: U(Nr, {}),
    vyre_e_impact: H(Pr, { prio: 58, group: `hit` }),
    oru_q: H(Fr),
    oru_w: H(Rr),
    oru_e: H(zr),
    oru_e_burst: H(Br),
    oru_r: H(Vr, { prio: 78 }),
    oru_r_burst: H(Hr, { prio: 82, range: 32, verb: 0.28, test: 3.2 }),
    oru_q_impact: H(Ur, { prio: 66 }),
    oru_q_pull: H(Wr, { prio: 60 }),
    oru_r_wave: H(Gr, { prio: 80, range: 34, verb: 0.25, test: 2 }),
    oru_r_impact: U(Kr, { group: `hit`, prio: 52 }),
    oru_p_mark: U(qr, {}),
    oru_p_tether: U(Jr, { prio: 32, group: `heal` }),
    oru_q_end: H(Ir, { prio: 46 }),
    morrow_q_end: H(Lr, { prio: 42 }),
    spell_flash: H(Yr, { prio: 70 }),
    spell_heal: H(Xr, { prio: 64 }),
    spell_smite: H(Zr, { prio: 74 }),
    spell_ignite: H(Qr, { prio: 64 }),
    ignite_tick: R($r, { prio: 20, group: `minor` }),
    cast_cancel: U(ei, { prio: 40 }),
    zone_tick: U(ti, {}),
    wave_generic: H(ni, { test: 2 }),
  };
for (let e of ii)
  ((W[`cast_` + e] = H((t, n, r) => ri(t, n, r, e, !1), { prio: 60 })),
    (W[`burst_` + e] = H((t, n, r) => ri(t, n, r, e, !0), { prio: 70 })));
[`brannoc`, `sable`, `morrow`, `vyre`, `oru`].flatMap((e) =>
  [`q`, `w`, `e`, `r`].map((t) => `${e}_${t}`),
);
function ai(e, t, n, r) {
  let i = e && t ? `${e}_${String(t).toLowerCase()}` : n;
  return i && W[i]
    ? i
    : n && W[n]
      ? n
      : `cast_` + (ii.includes(r) ? r : `arcane`);
}
function oi(e, t) {
  return e && W[e + `_burst`]
    ? e + `_burst`
    : `burst_` + (ii.includes(t) ? t : `arcane`);
}
var G = Math.max,
  si = (e) =>
    e.rel === `self` || e.rel === `ally` || e.rel === `neutral` || !e.rel,
  K = (e, t, n, r, i = {}) => {
    let a = n;
    return (
      r.forEach((o, s) => {
        a = G(
          a,
          e.brass(t, n + (i.stagger || 0) * s, {
            f: E(o),
            dur: i.dur ?? 0.3,
            peak: (i.peak ?? 0.1) / Math.sqrt(r.length / 2),
            a: i.a ?? 0.025,
            r: i.r ?? 0.35,
            bright: i.bright ?? 1,
            pan: (s - (r.length - 1) / 2) * 0.22,
          }),
        );
      }),
      a
    );
  },
  q = (e, t, n, r, i = {}) => {
    let a = n;
    return (
      r.forEach((o, s) => {
        a = G(
          a,
          e.bell(t, n + (i.stagger ?? 0.05) * s, {
            f: E(o),
            ratios: [1, 2, 3.01, 4.16],
            amps: [1, 0.3, 0.12, 0.05],
            d: i.d ?? 1.4,
            peak: i.peak ?? 0.06,
            pan: (s - (r.length - 1) / 2) * 0.3,
          }),
        );
      }),
      a
    );
  },
  J = (e, t, n, r = 0.8, i = 1.4) =>
    G(
      e.thump(t, n, { f0: 70, f1: 26, drop: 0.25, d: i, peak: r, click: 0.2 }),
      e.noiseHit(t, n, {
        color: `pink`,
        type: `lowpass`,
        f: 1800,
        f1: 120,
        glide: i * 0.6,
        d: i * 0.8,
        peak: r * 0.45,
      }),
    ),
  Y = (e, t, n, r, i = 0.09) =>
    e.choir(t, n, {
      notes: r,
      a: 0.015,
      dur: 0.16,
      r: 0.55,
      peak: i,
      vowel: `ah`,
      vowel1: `oh`,
      glideAt: 0.06,
      glideDur: 0.16,
    }),
  ci = (e, t, n) => {
    let r = K(e, t, n, [38, 44], {
      dur: 0.22,
      peak: 0.1,
      bright: 0.45,
      a: 0.04,
    });
    return (
      (r = G(
        r,
        K(e, t, n + 0.28, [37, 43], {
          dur: 0.7,
          peak: 0.1,
          bright: 0.4,
          r: 0.8,
        }),
      )),
      G(r, e.taiko(t, n, { f: 55, peak: 0.4, d: 1 }))
    );
  };
function li(e, t, n, r) {
  if (r.rel === `slain`)
    return G(ci(e, t, n), e.cymbal(t, n + 0.28, { peak: 0.06, d: 1.6 }));
  let i = e.taiko(t, n, { f: 82, peak: 0.6 });
  if (
    ((i = G(i, e.taiko(t, n + 0.14, { f: 78, peak: 0.75 }))),
    (i = G(
      i,
      e.whoosh(t, n + 0.02, {
        dur: 0.4,
        f0: 2e3,
        f1: 7e3,
        f2: 3e3,
        q: 1.5,
        peak: 0.16,
        peakAt: 0.9,
        color: `white`,
      }),
    )),
    r.rel === `enemy`)
  )
    ((i = G(i, K(e, t, n + 0.14, [50, 56, 62], { dur: 0.18, peak: 0.13 }))),
      (i = G(
        i,
        K(e, t, n + 0.42, [49, 55, 61], {
          dur: 1,
          peak: 0.14,
          r: 0.9,
          bright: 0.7,
        }),
      )),
      (i = G(i, J(e, t, n + 0.42, 0.7, 1.6))));
  else {
    let a = r.rel === `self` ? 7 : 0;
    ((i = G(
      i,
      K(e, t, n + 0.14, [62 + a, 65 + a, 69 + a], { dur: 0.18, peak: 0.13 }),
    )),
      (i = G(
        i,
        K(e, t, n + 0.42, [62 + a, 66 + a, 69 + a, 74 + a], {
          dur: 1,
          peak: 0.16,
          r: 0.9,
        }),
      )),
      (i = G(i, e.cymbal(t, n + 0.42, { peak: 0.14, d: 2.2 }))),
      (i = G(
        i,
        q(
          e,
          t,
          n + 0.45,
          [86, 90, 93].map((e) => e + a),
          { peak: 0.04 },
        ),
      )),
      r.rel === `self` && (i = G(i, Y(e, t, n + 0.42, [69, 73, 76]))));
  }
  return G(
    i,
    e.noiseHit(t, n + 0.42, { type: `highpass`, f: 5e3, d: 0.3, peak: 0.1 }),
  );
}
function ui(e, t, n, r) {
  if (r.rel === `slain`) return ci(e, t, n);
  if (r.rel === `enemy`) {
    let r = e.taiko(t, n, { f: 70, peak: 0.5, d: 0.7 });
    return (
      (r = G(r, K(e, t, n, [50, 53], { dur: 0.12, peak: 0.1, bright: 0.6 }))),
      G(
        r,
        K(e, t, n + 0.17, [49, 52], {
          dur: 0.5,
          peak: 0.1,
          r: 0.6,
          bright: 0.5,
        }),
      )
    );
  }
  if (r.rel === `self`) {
    let r = e.taiko(t, n, { f: 92, peak: 0.55, d: 0.7 });
    return (
      (r = G(r, K(e, t, n, [74, 78, 81], { dur: 0.09, peak: 0.12 }))),
      (r = G(r, K(e, t, n + 0.13, [76, 81, 85], { dur: 0.09, peak: 0.12 }))),
      (r = G(
        r,
        K(e, t, n + 0.26, [78, 81, 86], { dur: 0.6, peak: 0.14, r: 0.7 }),
      )),
      (r = G(r, Y(e, t, n + 0.26, [74, 78, 81], 0.08))),
      G(
        r,
        q(e, t, n + 0.26, [90, 93, 98], { peak: 0.045, d: 1.2, stagger: 0.04 }),
      )
    );
  }
  let i = e.taiko(t, n, { f: 88, peak: 0.5, d: 0.7 });
  return (
    (i = G(i, K(e, t, n, [69, 74, 78], { dur: 0.1, peak: 0.12 }))),
    (i = G(
      i,
      K(e, t, n + 0.16, [74, 78, 81], { dur: 0.55, peak: 0.13, r: 0.6 }),
    )),
    G(i, q(e, t, n + 0.16, [86, 93], { peak: 0.045, d: 1.1 }))
  );
}
function di(e, t, n, r) {
  let i = Math.max(2, Math.min(5, r.count || 2)),
    a = [0, 2, 4, 7, 12],
    o = r.rel === `enemy` || r.rel === `slain`,
    s = r.rel === `self` ? 5 : 0,
    c = n;
  for (let r = 0; r < i; r++) {
    let l = n + r * 0.13,
      u = r === i - 1,
      d = (o ? 50 : 62 + s) + a[r] - (o ? r : 0);
    ((c = G(
      c,
      e.taiko(t, l, { f: 80 + r * 6, peak: 0.45 + r * 0.06, d: u ? 1 : 0.4 }),
    )),
      (c = G(
        c,
        K(e, t, l, o ? [d, d + 3, d + 6] : [d, d + 4, d + 7], {
          dur: u ? 0.9 : 0.09,
          peak: 0.12 + r * 0.01,
          r: u ? 0.9 : 0.12,
        }),
      )));
  }
  let l = n + (i - 1) * 0.13;
  return (
    (c = G(c, e.cymbal(t, l, { peak: 0.12 + i * 0.02, d: 2.4 }))),
    (i >= 4 || (r.rel === `self` && i >= 2)) &&
      (c = G(
        c,
        o
          ? e.choir(t, l, {
              notes: [50, 53, 56, 62],
              a: 0.08,
              dur: 0.6,
              r: 1.4,
              peak: 0.08,
            })
          : Y(e, t, l, [62 + s, 66 + s, 69 + s, 74 + s], 0.09),
      )),
    i >= 5 && (c = G(c, J(e, t, l, 0.9, 2))),
    c
  );
}
function fi(e, t, n, r) {
  let i = n;
  for (let r = 0; r < 3; r++)
    i = G(i, e.taiko(t, n + r * 0.1, { f: 74 + r * 4, peak: 0.55 + r * 0.1 }));
  let a = n + 0.3;
  return (
    r.rel === `enemy` || r.rel === `slain`
      ? ((i = G(
          i,
          K(e, t, a, [46, 53, 58, 61, 65], {
            dur: 1.3,
            peak: 0.17,
            r: 1.2,
            bright: 0.6,
          }),
        )),
        (i = G(
          i,
          e.choir(t, a, {
            notes: [46, 53, 58, 61],
            a: 0.2,
            dur: 0.9,
            r: 1.6,
            peak: 0.08,
            vowel: `oo`,
          }),
        )),
        (i = G(i, J(e, t, a, 0.9, 2.2))))
      : ((i = G(
          i,
          K(e, t, a, [50, 57, 62, 66, 69], { dur: 1.3, peak: 0.18, r: 1.2 }),
        )),
        (i = G(
          i,
          e.choir(t, a, {
            notes: [62, 66, 69, 74],
            a: 0.06,
            dur: 1,
            r: 1.6,
            peak: 0.09,
          }),
        )),
        r.rel === `self` && (i = G(i, Y(e, t, a, [69, 74, 78], 0.08))),
        (i = G(i, e.cymbal(t, a, { peak: 0.2, d: 3 }))),
        (i = G(i, q(e, t, a + 0.05, [81, 86, 90, 93], { peak: 0.045, d: 2 }))),
        (i = G(i, J(e, t, a, 0.8, 1.8)))),
    i
  );
}
function pi(e, t, n, r) {
  if (r.rel === `slain`) return ci(e, t, n);
  let i = e.taiko(t, n, { f: 64, peak: 0.45, d: 0.8 });
  return r.rel === `ally`
    ? ((i = G(
        i,
        e.tone(t, n, {
          type: `triangle`,
          f: E(57),
          f1: E(62),
          glide: 0.25,
          a: 0.02,
          d: 0.7,
          peak: 0.1,
          lp: 1400,
        }),
      )),
      G(i, q(e, t, n + 0.1, [81, 86], { peak: 0.035, d: 0.9 })))
    : ((i = G(
        i,
        e.tone(t, n, {
          type: `triangle`,
          f: E(50),
          f1: E(45),
          glide: 0.5,
          a: 0.02,
          d: 0.9,
          peak: 0.12,
          lp: 900,
        }),
      )),
      G(
        i,
        e.whoosh(t, n, {
          dur: 0.6,
          f0: 1200,
          f1: 300,
          f2: 150,
          q: 1.2,
          peak: 0.12,
          peakAt: 0.1,
        }),
      ));
}
function mi(e, t, n, r, i) {
  let a = e.taiko(t, n, { f: 78, peak: 0.55 });
  if (r.rel === `enemy`)
    return (
      (a = G(a, e.taiko(t, n + 0.22, { f: 70, peak: 0.5 }))),
      (a = G(
        a,
        K(e, t, n + 0.05, [38, 44, 50], {
          dur: i ? 1.3 : 0.9,
          peak: 0.16,
          a: 0.2,
          r: 0.9,
          bright: 0.55,
        }),
      )),
      i &&
        (a = G(
          a,
          e.choir(t, n + 0.1, {
            notes: [50, 56],
            a: 0.4,
            dur: 0.8,
            r: 1.2,
            peak: 0.07,
            vowel: `oo`,
          }),
        )),
      a
    );
  let o = i ? [62, 69, 74, 78] : [62, 69, 74];
  o.forEach((r, i) => {
    a = G(
      a,
      e.brass(t, n + i * 0.15, {
        f: E(r),
        dur: i === o.length - 1 ? 0.9 : 0.12,
        peak: 0.14,
        r: i === o.length - 1 ? 0.8 : 0.1,
      }),
    );
  });
  let s = n + (o.length - 1) * 0.15;
  return (
    (a = G(
      a,
      K(e, t, s, [50, 57, 62], { dur: 0.9, peak: 0.12, r: 0.8, bright: 0.7 }),
    )),
    (a = G(a, e.cymbal(t, s, { peak: i ? 0.18 : 0.12, d: 2.2 }))),
    r.rel === `self` &&
      ((a = G(a, Y(e, t, s, [66, 69, 74], 0.07))),
      (a = G(
        a,
        q(e, t, s + 0.04, [86, 90, 93], { peak: 0.04, stagger: 0.04 }),
      ))),
    i &&
      ((a = G(
        a,
        e.choir(t, s, {
          notes: [62, 66, 69, 74],
          a: 0.1,
          dur: 0.8,
          r: 1.4,
          peak: 0.08,
        }),
      )),
      (a = G(a, e.cymbal(t, n, { swell: 0.45, peak: 0.12 })))),
    a
  );
}
function hi(e, t, n, r) {
  if (r.rel === `enemy`)
    return G(
      e.tone(t, n, {
        f: 110,
        f1: 165,
        glide: 0.8,
        swell: !0,
        a: 0.6,
        d: 0.6,
        peak: 0.12,
      }),
      q(e, t, n + 0.55, [62, 69], { peak: 0.05, d: 1.4, stagger: 0.12 }),
    );
  let i = e.sparkle(t, n, {
    dur: 0.7,
    count: 10,
    fMin: 1800,
    fMax: 5e3,
    peak: 0.035,
    rise: !0,
  });
  return (
    (i = G(
      i,
      e.tone(t, n, {
        f: 147,
        f1: 294,
        glide: 0.7,
        swell: !0,
        a: 0.65,
        d: 0.5,
        peak: 0.1,
      }),
    )),
    G(
      i,
      q(e, t, n + 0.65, [74, 78, 81, 86], {
        peak: 0.05,
        d: 1.6,
        stagger: 0.06,
      }),
    )
  );
}
function gi(e, t, n) {
  let r = e.brass(t, n, {
    f: E(50),
    dur: 0.35,
    peak: 0.12,
    a: 0.08,
    r: 0.25,
    bright: 0.65,
  });
  ((r = G(
    r,
    e.brass(t, n + 0.42, {
      f: E(57),
      dur: 0.9,
      peak: 0.13,
      a: 0.06,
      r: 0.7,
      bright: 0.7,
    }),
  )),
    (r = G(
      r,
      K(e, t, n + 0.42, [38, 45, 50], {
        dur: 0.9,
        peak: 0.08,
        r: 0.7,
        bright: 0.55,
      }),
    )));
  for (let i = 0; i < 8; i++)
    r = G(
      r,
      e.snare(t, n + 0.1 + i * 0.04, {
        f: 1800,
        d: 0.08,
        peak: 0.03 + i * 0.008,
      }),
    );
  return (
    (r = G(r, e.taiko(t, n + 0.42, { f: 72, peak: 0.45, d: 1 }))),
    G(r, e.cymbal(t, n + 0.42, { peak: 0.08, d: 1.8 }))
  );
}
function _i(e, t, n, r, i) {
  if (i === `tyrant`) {
    let r = J(e, t, n, 0.7, 2.4);
    return (
      (r = G(
        r,
        K(e, t, n + 0.1, [26, 38, 44], {
          dur: 1.4,
          peak: 0.18,
          a: 0.35,
          r: 1.2,
          bright: 0.45,
        }),
      )),
      (r = G(
        r,
        e.choir(t, n + 0.2, {
          notes: [38, 44, 49],
          a: 0.6,
          dur: 1,
          r: 1.5,
          peak: 0.08,
          vowel: `oo`,
        }),
      )),
      G(
        r,
        e.tone(t, n, {
          type: `sawtooth`,
          f: 55,
          a: 0.4,
          h: 1.2,
          r: 1.2,
          peak: 0.12,
          lp: 420,
          vib: [0.8, 20],
        }),
      )
    );
  }
  let a = e.noiseHit(t, n, { type: `highpass`, f: 2e3, d: 0.2, peak: 0.36 });
  return (
    (a = G(a, e.rumble(t, n, { dur: 2.5, f: 280, peak: 0.45 }))),
    (a = G(
      a,
      K(e, t, n + 0.15, [38, 45, 50], {
        dur: 1.2,
        peak: 0.16,
        a: 0.25,
        r: 1,
        bright: 0.6,
      }),
    )),
    (a = G(
      a,
      e.zap(t, n + 0.05, { f0: 3500, f1: 400, dur: 0.4, index: 8, peak: 0.16 }),
    )),
    G(
      a,
      e.zap(t, n + 0.9, { f0: 2800, f1: 300, dur: 0.35, index: 7, peak: 0.1 }),
    )
  );
}
function vi(e, t, n, r) {
  let i = e.taiko(t, n, { f: 76, peak: 0.6 });
  return (
    (i = G(i, e.taiko(t, n + 0.12, { f: 84, peak: 0.7 }))),
    r.rel === `enemy` || r.rel === `slain`
      ? ((i = G(
          i,
          K(e, t, n + 0.12, [50, 53, 57], {
            dur: 0.25,
            peak: 0.13,
            bright: 0.6,
          }),
        )),
        (i = G(
          i,
          K(e, t, n + 0.45, [46, 49, 53], {
            dur: 1,
            peak: 0.14,
            r: 1,
            bright: 0.5,
          }),
        )),
        G(i, J(e, t, n + 0.45, 0.7, 1.8)))
      : ((i = G(i, K(e, t, n + 0.12, [62, 66, 69], { dur: 0.25, peak: 0.13 }))),
        (i = G(
          i,
          K(e, t, n + 0.45, [62, 66, 69, 74], { dur: 1.1, peak: 0.16, r: 1 }),
        )),
        r.rel === `self` && (i = G(i, Y(e, t, n + 0.45, [69, 74, 78], 0.08))),
        (i = G(i, e.cymbal(t, n + 0.45, { peak: 0.16, d: 2.5 }))),
        G(i, q(e, t, n + 0.5, [86, 90, 93, 98], { peak: 0.04, d: 1.8 })))
  );
}
function yi(e, t, n, r) {
  if (!si(r)) {
    let r = e.cymbal(t, n, { swell: 0.9, peak: 0.08 });
    return (
      [62, 58, 57, 53].forEach((i, a) => {
        r = G(
          r,
          e.brass(t, n + a * 0.2, {
            f: E(i - 12),
            dur: a === 3 ? 0.9 : 0.16,
            peak: 0.1,
            bright: 0.45,
            r: a === 3 ? 0.8 : 0.12,
          }),
        );
      }),
      G(r, J(e, t, n + 0.6, 0.6, 1.6))
    );
  }
  let i = e.cymbal(t, n, { swell: 0.9, peak: 0.14 });
  for (let r = 0; r < 6; r++)
    i = G(
      i,
      e.taiko(t, n + r * 0.14, {
        f: 70 + r * 3,
        peak: 0.25 + r * 0.05,
        d: 0.3,
      }),
    );
  return G(
    i,
    K(e, t, n + 0.84, [50, 57, 62, 66], { dur: 0.6, peak: 0.16, r: 0.8 }),
  );
}
function bi(e, t, n) {
  let r = n;
  [
    [62, 0],
    [66, 0.1],
    [69, 0.2],
  ].forEach(([i, a]) => {
    ((r = G(
      r,
      e.brass(t, n + a, {
        f: E(i),
        dur: 0.07,
        peak: 0.13,
        a: 0.012,
        r: 0.08,
        pan: 0.1,
      }),
    )),
      (r = G(
        r,
        e.taiko(t, n + a, { f: 96 + a * 40, peak: 0.26 + a, d: 0.25 }),
      )));
  });
  let i = n + 0.3;
  ((r = G(r, e.taiko(t, i, { f: 72, peak: 0.85, d: 1.6 }))),
    (r = G(r, e.cymbal(t, i, { peak: 0.24, d: 3.5 }))),
    (r = G(r, K(e, t, i, [50, 57, 62, 66], { dur: 0.35, peak: 0.2 }))),
    (r = G(r, Y(e, t, i, [62, 66, 69, 74], 0.1))));
  for (let [n, a] of [
    [69, 0],
    [74, 0.25],
    [78, 0.5],
    [81, 0.75],
  ])
    r = G(
      r,
      e.brass(t, i + a, {
        f: E(n),
        dur: a === 0.75 ? 2.2 : 0.2,
        peak: 0.16,
        r: a === 0.75 ? 1.4 : 0.15,
        pan: 0.1,
      }),
    );
  ((r = G(
    r,
    K(e, t, i + 0.75, [50, 57, 62, 66, 69], {
      dur: 2.2,
      peak: 0.2,
      r: 1.6,
      a: 0.05,
    }),
  )),
    (r = G(
      r,
      e.choir(t, i + 0.75, {
        notes: [62, 66, 69, 74, 78],
        a: 0.3,
        dur: 2,
        r: 2.2,
        peak: 0.1,
      }),
    )));
  for (let n of [38, 45])
    r = G(
      r,
      e.strings(t, i + 0.75, { f: E(n), dur: 2.2, a: 0.1, r: 2, peak: 0.1 }),
    );
  return (
    (r = G(
      r,
      q(e, t, i + 0.8, [86, 90, 93, 98, 102], {
        stagger: 0.09,
        peak: 0.05,
        d: 2.4,
      }),
    )),
    (r = G(
      r,
      e.sparkle(t, i + 0.8, {
        dur: 2.4,
        count: 24,
        fMin: 3e3,
        fMax: 9e3,
        peak: 0.03,
      }),
    )),
    G(r, J(e, t, i + 0.75, 0.75, 2.4))
  );
}
function xi(e, t, n) {
  let r = e.taiko(t, n, { f: 58, peak: 0.85, d: 1.8 });
  ((r = G(r, J(e, t, n, 0.7, 2.6))),
    (r = G(
      r,
      K(e, t, n + 0.05, [38, 45, 50, 53], {
        dur: 1.2,
        peak: 0.18,
        a: 0.08,
        r: 1.2,
        bright: 0.55,
      }),
    )));
  for (let [i, a, o] of [
    [69, 0.3, 0.55],
    [65, 0.9, 0.55],
    [62, 1.5, 0.55],
    [61, 2.1, 0.7],
    [62, 2.9, 2.2],
  ])
    r = G(
      r,
      e.brass(t, n + a, {
        f: E(i - 12),
        dur: o,
        peak: 0.13,
        a: 0.08,
        r: 0.6,
        bright: 0.5,
      }),
    );
  ((r = G(
    r,
    e.choir(t, n + 0.6, {
      notes: [58, 65, 70],
      a: 0.8,
      dur: 1.3,
      r: 1.2,
      peak: 0.07,
      vowel: `oo`,
    }),
  )),
    (r = G(
      r,
      e.choir(t, n + 2.8, {
        notes: [50, 57, 62, 65],
        a: 0.6,
        dur: 1.4,
        r: 2.4,
        peak: 0.08,
        vowel: `oo`,
      }),
    )));
  for (let i of [26, 38])
    r = G(
      r,
      e.strings(t, n + 2.8, {
        f: E(i),
        dur: 1.6,
        a: 0.4,
        r: 2.4,
        peak: 0.1,
        cutoff: 700,
      }),
    );
  return G(r, e.taiko(t, n + 2.8, { f: 52, peak: 0.6, d: 2 }));
}
function Si(e, t, n) {
  let r = e.taiko(t, n, { f: 76, peak: 0.6, d: 1.2 });
  return (
    (r = G(r, e.taiko(t, n + 0.35, { f: 70, peak: 0.5 }))),
    (r = G(
      r,
      e.brass(t, n + 0.05, {
        f: E(50),
        dur: 0.5,
        peak: 0.14,
        a: 0.12,
        r: 0.3,
        bright: 0.7,
      }),
    )),
    (r = G(
      r,
      e.brass(t, n + 0.62, { f: E(57), dur: 0.25, peak: 0.13, r: 0.2 }),
    )),
    (r = G(
      r,
      e.brass(t, n + 0.9, { f: E(62), dur: 1.3, peak: 0.15, a: 0.05, r: 1 }),
    )),
    (r = G(
      r,
      K(e, t, n + 0.9, [38, 45, 50], {
        dur: 1.3,
        peak: 0.11,
        r: 1,
        bright: 0.6,
      }),
    )),
    (r = G(r, e.cymbal(t, n + 0.9, { peak: 0.12, d: 2.6 }))),
    G(r, q(e, t, n + 0.95, [74, 81, 86], { peak: 0.04, d: 1.8 }))
  );
}
function Ci(e, t, n, r) {
  let i =
    r.rel === `enemy` || r.rel === `slain`
      ? [62, 65, 68]
      : r.rel === `self` || r.rel === `ally`
        ? [62, 66, 69]
        : [62, 67, 69];
  return G(
    e.taiko(t, n, { f: 80, peak: 0.45, d: 0.7 }),
    q(
      e,
      t,
      n,
      i.map((e) => e + 12),
      { peak: 0.06, d: 1.2 },
    ),
  );
}
function wi(e, t, n, r) {
  let i = r.rel === `enemy` || r.rel === `slain`,
    a = i ? 49 : 50,
    o = e.taiko(t, n, { f: i ? 66 : 84, peak: 0.55, d: 0.8 });
  return (
    (o = G(
      o,
      e.bell(t, n, {
        f: E(a - 12),
        ratios: [1, 2.02, 3.04],
        amps: [1, 0.26, 0.1],
        d: 1.5,
        peak: 0.08,
      }),
    )),
    (o = G(
      o,
      q(e, t, n + 0.06, i ? [86, 81, 77] : [93, 88, 84], {
        peak: 0.062,
        d: 1.15,
        stagger: 0.085,
      }),
    )),
    (o = G(
      o,
      K(e, t, n + 0.06, i ? [50, 56] : [62, 66], {
        dur: 0.16,
        peak: 0.1,
        bright: i ? 0.55 : 0.9,
      }),
    )),
    (o = G(
      o,
      K(e, t, n + 0.32, i ? [45, 52] : [57, 62], {
        dur: 0.55,
        peak: 0.11,
        r: 0.7,
        bright: i ? 0.45 : 0.75,
      }),
    )),
    i ||
      (o = G(
        o,
        e.sparkle(t, n + 0.3, {
          dur: 0.5,
          count: 6,
          fMin: 3200,
          fMax: 7400,
          peak: 0.032,
          d: 0.4,
        }),
      )),
    o
  );
}
function Ti(e, t, n, r, i) {
  let a = r.rel === `enemy`,
    o = a ? 45 : 50,
    s = i === 0 ? [0, 5, 9] : i === 1 ? [0, 5, 9, 12] : [0, 5, 9, 12, 16],
    c = 0.115,
    l = e.taiko(t, n, { f: a ? 68 : 86, peak: 0.45 + 0.06 * i, d: 0.7 });
  for (let r = 0; r < s.length - 1; r++)
    l = G(
      l,
      K(e, t, n + c * r, [o + s[r], o + s[r] + 7], {
        dur: 0.09,
        peak: 0.1,
        bright: (a ? 0.55 : 0.85) + 0.08 * i,
      }),
    );
  let u = o + s[s.length - 1];
  return (
    (l = G(
      l,
      K(e, t, n + c * (s.length - 1), [u, u + 7, u + 12], {
        dur: 0.42 + 0.12 * i,
        peak: 0.12 + 0.01 * i,
        r: 0.65,
        bright: (a ? 0.5 : 0.9) + 0.08 * i,
      }),
    )),
    i >= 1 &&
      !a &&
      (l = G(l, Y(e, t, n + c * (s.length - 1), [u, u + 7], 0.06 + 0.02 * i))),
    i >= 1 &&
      (l = G(
        l,
        q(e, t, n + c * (s.length - 1), [u + 12, u + 19], {
          peak: 0.04 + 0.01 * i,
          d: 1.1,
          stagger: 0.05,
        }),
      )),
    i >= 2 &&
      (l = G(l, e.cymbal(t, n + c * (s.length - 1), { peak: 0.05, d: 1.8 }))),
    l
  );
}
var X = (e, t = {}) =>
    R(e, { cat: `announcer`, prio: 94, verb: 0.3, test: 3.2, duck: !0, ...t }),
  Ei = {
    stinger_first_blood: X(li),
    stinger_kill: X(ui, { prio: 90 }),
    stinger_shutdown: X(wi, { prio: 91, test: 2.6 }),
    stinger_spree: X((e, t, n, r) => Ti(e, t, n, r, 0), {
      prio: 90,
      test: 2.4,
    }),
    stinger_rampage: X((e, t, n, r) => Ti(e, t, n, r, 1), {
      prio: 90,
      test: 2.6,
    }),
    stinger_legendary: X((e, t, n, r) => Ti(e, t, n, r, 2), {
      prio: 91,
      test: 3,
    }),
    stinger_multikill: X(di),
    stinger_ace: X(fi, { test: 3.8 }),
    stinger_executed: X(pi, { prio: 85 }),
    stinger_first_turret: X((e, t, n, r) => mi(e, t, n, r, !1)),
    stinger_turret: X((e, t, n, r) => mi(e, t, n, r, !1), {}),
    stinger_inhibitor: X((e, t, n, r) => mi(e, t, n, r, !0)),
    stinger_inhibitor_respawn: X(hi, { prio: 80, test: 2.8 }),
    stinger_victory: X(yi, { test: 2.4 }),
    stinger_drake_spawn: X((e, t, n, r) => _i(e, t, n, r, `drake`), {
      test: 3.4,
    }),
    stinger_tyrant_spawn: X((e, t, n, r) => _i(e, t, n, r, `tyrant`), {
      test: 3.6,
    }),
    stinger_drake_slain: X(vi, { test: 3.4 }),
    stinger_tyrant_slain: X(vi, { test: 3.4 }),
    stinger_minions_spawn: X(gi, { prio: 82, test: 2.8 }),
    stinger_generic: X(Ci, { prio: 80 }),
    stinger_match_start: X(Si, { test: 3.6 }),
    music_victory_fanfare: X(bi, { prio: 100, test: 6.5 }),
    music_defeat_fanfare: X(xi, { prio: 100, test: 7 }),
  };
function Di(e) {
  let t = `stinger_` + e;
  return Ei[t] ? t : `stinger_generic`;
}
function Oi(e) {
  let t = String(e || ``).toLowerCase();
  return t.includes(`penta`)
    ? 5
    : t.includes(`quadra`)
      ? 4
      : t.includes(`triple`)
        ? 3
        : (t.includes(`double`), 2);
}
var ki = {
    brannoc_e: 0.6683,
    brannoc_e_impact: 0.3935,
    brannoc_e_land: 0.8222,
    brannoc_impact: 0.4266,
    brannoc_p_break: 0.7079,
    brannoc_p_buff: 1,
    brannoc_q: 0.4378,
    brannoc_r: 2.427,
    brannoc_r_burst: 0.2345,
    brannoc_swing: 3.311,
    brannoc_w: 0.4169,
    buff_crimson: 0.5248,
    buff_drake: 1.445,
    buff_shrine: 2.483,
    buff_tyrant: 0.861,
    buff_verdant: 1.334,
    burst_arcane: 0.466,
    burst_earth: 0.391,
    burst_fire: 0.6099,
    burst_frost: 0.5718,
    burst_light: 0.5807,
    burst_nature: 0.5803,
    burst_shadow: 0.7118,
    burst_storm: 0.6298,
    burst_water: 0.5759,
    buy: 0.8414,
    cast_arcane: 1.758,
    cast_cancel: 2.018,
    cast_earth: 0.6424,
    cast_fire: 7.852,
    cast_frost: 1.972,
    cast_light: 2.042,
    cast_nature: 3.467,
    cast_shadow: 2.138,
    cast_storm: 1.189,
    cast_water: 2.265,
    cc_knockback: 0.257,
    cc_knockup: 3.936,
    cc_pull: 1.799,
    cc_root: 0.9333,
    cc_silence: 0.8913,
    cc_slow: 2.455,
    cc_stun: 1.641,
    champion_death: 0.631,
    dash_generic: 3.09,
    epic_death: 0.7496,
    epic_monster_attack: 0.6918,
    fountain_laser: 0.7328,
    gold_coin: 1.189,
    gold_kill: 1.259,
    gold_objective: 1.862,
    heal_tick: 1.799,
    hit_minor: 1.303,
    ignite_tick: 16.98,
    impact_crit: 0.5766,
    impact_magic: 0.8318,
    impact_physical: 0.5495,
    impact_true: 0.8511,
    inhibitor_destroyed: 0.634,
    inhibitor_respawn: 0.6761,
    item_potion_buff: 1.585,
    level_up: 1,
    level_up_other: 0.6383,
    low_health: 0.3548,
    minion_caster_shot: 0.7852,
    minion_death: 1.096,
    minion_melee_attack: 1.259,
    minion_siege_shot: 0.2265,
    monster_attack: 0.5129,
    monster_attack_ash_stalker: 1.905,
    monster_attack_crimson_brute: 0.2541,
    monster_attack_mire_toad: 2.018,
    monster_attack_rift_skitter: 1.245,
    monster_attack_shard_golem: 0.4467,
    monster_attack_thornback: 0.8128,
    monster_attack_verdant_warden: 0.537,
    monster_death: 0.335,
    monster_death_ash_stalker: 1.259,
    monster_death_crimson_brute: 0.8953,
    monster_death_mire_toad: 2.786,
    monster_death_rift_skitter: 1.549,
    monster_death_shard_golem: 0.5248,
    monster_death_thornback: 1.148,
    monster_death_verdant_warden: 0.8838,
    morrow_attack: 0.9441,
    morrow_e: 1.334,
    morrow_e_impact: 0.9441,
    morrow_impact: 0.8511,
    morrow_p_detonate: 0.9333,
    morrow_p_empower: 1.122,
    morrow_p_mark: 0.8913,
    morrow_q: 0.7413,
    morrow_q_burst: 0.6095,
    morrow_q_end: 4.315,
    morrow_r: 0.5559,
    morrow_r_burst: 0.5033,
    morrow_w: 1.549,
    morrow_w_burst: 0.3758,
    morrow_w_tick: 0.6839,
    morrow_w_zone: 0.6383,
    music_defeat_fanfare: 0.4175,
    music_victory_fanfare: 0.5626,
    nexus_explosion: 0.5627,
    oru_e: 19.05,
    oru_e_burst: 0.5687,
    oru_impact: 0.3589,
    oru_p_mark: 4.677,
    oru_p_tether: 1.23,
    oru_q: 1.928,
    oru_q_end: 0.7943,
    oru_q_impact: 0.6998,
    oru_q_pull: 1.413,
    oru_r: 0.871,
    oru_r_burst: 0.4724,
    oru_r_impact: 0.7244,
    oru_r_wave: 0.861,
    oru_swing: 1.047,
    oru_w: 1.047,
    ping: 1.514,
    ping_assist: 2.399,
    ping_attack: 1.216,
    ping_danger: 3.631,
    ping_missing: 2.113,
    ping_omw: 1.202,
    ping_vision: 1.905,
    player_death: 0.5252,
    player_respawn: 0.7413,
    recall_cancel: 1.445,
    recall_channel: 0.4217,
    recall_teleport: 0.6839,
    sable_e: 1.82,
    sable_e_burst: 0.9489,
    sable_impact: 1.216,
    sable_p_detonate: 0.9226,
    sable_p_mark: 1.318,
    sable_q: 1.093,
    sable_r: 0.5516,
    sable_r_reset: 2.371,
    sable_swing: 2.399,
    sable_w: 2.57,
    sable_w_end: 5.309,
    sell: 1.679,
    shield_up: 1.531,
    shot_generic: 1.445,
    shrine_spawn: 1.035,
    skill_up: 0.9661,
    spell_flash: 1.274,
    spell_heal: 0.6998,
    spell_ignite: 1.567,
    spell_smite: 0.4354,
    stinger_ace: 0.4512,
    stinger_drake_slain: 0.7674,
    stinger_drake_spawn: 1.259,
    stinger_executed: 1.245,
    stinger_first_blood: 0.8222,
    stinger_first_turret: 0.861,
    stinger_generic: 1.288,
    stinger_inhibitor: 0.8128,
    stinger_inhibitor_respawn: 1.841,
    stinger_kill: 1.047,
    stinger_legendary: 1.084,
    stinger_match_start: 0.9441,
    stinger_minions_spawn: 0.8318,
    stinger_multikill: 0.8511,
    stinger_rampage: 1.047,
    stinger_shutdown: 1.059,
    stinger_spree: 1.135,
    stinger_turret: 0.7413,
    stinger_tyrant_slain: 0.7499,
    stinger_tyrant_spawn: 0.4474,
    stinger_victory: 1.122,
    swing_generic: 2.512,
    turret_aggro: 1.202,
    turret_charge: 0.8913,
    turret_destroyed: 0.5607,
    turret_hit: 0.7418,
    turret_shot: 0.6383,
    ui_click: 1.23,
    ui_confirm: 0.7079,
    ui_hover: 1.758,
    ui_panel_close: 5.754,
    ui_panel_open: 1.413,
    vyre_attack: 0.6761,
    vyre_e: 3.99,
    vyre_e_empower: 1.413,
    vyre_e_impact: 0.7852,
    vyre_impact: 0.8173,
    vyre_p_empower: 0.6026,
    vyre_p_impact: 0.8222,
    vyre_p_mark: 1.122,
    vyre_q: 0.7852,
    vyre_q_impact: 0.712,
    vyre_r: 1,
    vyre_r_burst: 0.4769,
    vyre_w: 1.123,
    vyre_w_impact: 1,
    ward_expire: 1.274,
    ward_kill: 1,
    ward_place: 1.109,
    wave_generic: 9.226,
    zone_tick: 0.8318,
  },
  Ai = {
    stinger_ace: 4.6,
    stinger_first_blood: 4.4,
    stinger_multikill: 4.2,
    stinger_first_turret: 4,
    stinger_turret: 4,
    stinger_inhibitor: 4.4,
    stinger_victory: 3.8,
    stinger_drake_spawn: 4.4,
    stinger_tyrant_spawn: 4.6,
    stinger_drake_slain: 4.4,
    stinger_tyrant_slain: 4.4,
    stinger_match_start: 4.6,
    stinger_minions_spawn: 3.4,
    player_death: 3.8,
    player_respawn: 4.4,
    turret_destroyed: 4.2,
    recall_channel: 9.2,
    music_victory_fanfare: 8.5,
    music_defeat_fanfare: 9,
  },
  ji = { ...Un, ...W, ...Ei };
for (let e in ji)
  ji[e] = {
    ...ji[e],
    gain: ki[e] ?? 1,
    calibrated: e in ki,
    ...(Ai[e] ? { test: Ai[e] } : null),
  };
var Z = Object.freeze(ji),
  Q = () => Object.keys(Z),
  Mi = 0.45,
  Ni = 0.6,
  Pi = new Map();
function Fi(e, t, n) {
  let r = `drum:${e}:${t}:${n}`,
    i = Pi.get(r);
  return (
    i ||
      ((i = {
        key: r,
        spec: {
          fn:
            e === `taiko`
              ? (e, r, i) => e.taiko(r, i, { f: t, d: n, peak: 1 })
              : e === `snare`
                ? (e, r, i) => e.snare(r, i, { f: t, d: n, peak: 1 })
                : e === `crash`
                  ? (e, t, r) => e.cymbal(t, r, { peak: 1, d: n })
                  : (e, t, r) => e.cymbal(t, r, { swell: n, peak: 1 }),
          cat: `music`,
          seeds: 2,
          vary: 0,
          bakeChannels: 1,
        },
      }),
      Pi.set(r, i)),
    i
  );
}
var Ii = class {
    constructor(e, t) {
      ((this.dir = e),
        (this.k = e.kit),
        (this.ac = e.ac),
        (this.stepDur = 60 / t / 4),
        (this.barDur = this.stepDur * 16));
      let n = this.k,
        r = e.mix;
      ((this.out = n.gain(r.musicIn, 0)),
        this.out.connect(n.gain(r.musicSend, 0.42)),
        (this.delaySend = n.gain(r.musicDelaySend, 0.3)),
        (this.buses = {}),
        (this.levels = {}),
        (this.warmKeys = []),
        (this.nextT = 0),
        (this.step = 0),
        (this.stopAt = null),
        (this.startT = 0),
        (this.started = !1));
    }
    bus(e, t = 1, n = !1) {
      let r = this.k.gain(this.out, t);
      return (
        (this.buses[e] = r),
        (this.levels[e] = t),
        n && r.connect(this.delaySend),
        r
      );
    }
    warmPlucks(e, t, n) {
      for (let r of e) this.warmKeys.push(this.k.warmPluck(E(r), t, n));
    }
    isWarm() {
      return this.warmKeys.every((e) => this.k.isWarm(e));
    }
    setLevel(e, t, n, r = 0.6) {
      Math.abs((this.levels[e] ?? 0) - t) < 0.008 ||
        ((this.levels[e] = t), P(this.buses[e].gain, t, n, r));
    }
    start(e, t, n = 1) {
      ((this.startT = e),
        (this.nextT = e),
        (this.step = 0),
        (this.started = !0),
        this.out.gain.setValueAtTime(0, Math.max(0, e - 0.01)),
        t <= 0.03
          ? this.out.gain.setValueAtTime(n, e)
          : this.out.gain.linearRampToValueAtTime(n, e + t));
    }
    stop(e, t) {
      (P(this.out.gain, 0, e, Math.max(0.01, t / 4)), (this.stopAt = e + t));
    }
    schedule(e, t) {
      if (this.started) {
        if (this.nextT < e - 0.08) {
          let t = Math.ceil((e - this.nextT) / this.stepDur);
          ((this.step += t), (this.nextT += t * this.stepDur));
        }
        for (
          ;
          this.nextT < t && (this.stopAt == null || this.nextT < this.stopAt);
        ) {
          try {
            this.onStep(this.step, this.nextT);
          } catch {
            this.dir.errors++;
          }
          (this.step++, (this.nextT += this.stepDur));
        }
      }
    }
    drum(e, t, n, r, i, a, o = 0) {
      let s = this.dir.baker;
      if (s) {
        let c = Fi(n, r, i),
          l = s.get(c.key, c.spec, {});
        if (l) {
          this.k.buffer(e, t, l.buffer, { gain: a * l.gain, pan: o });
          return;
        }
      }
      n === `taiko`
        ? this.k.taiko(e, t, { f: r, d: i, peak: a, pan: o || void 0 })
        : n === `snare`
          ? this.k.snare(e, t, { f: r, d: i, peak: a, pan: o || void 0 })
          : n === `crash`
            ? this.k.cymbal(e, t, { peak: a, d: i })
            : this.k.cymbal(e, t, { swell: i, peak: a });
    }
    updateLevels() {}
    climaxWeight() {
      return 0;
    }
    dispose() {
      try {
        this.out.disconnect();
      } catch {}
    }
  },
  Li = [
    [38, [50, 57, 62, 65], [62, 65, 69, 74]],
    [46, [53, 58, 62, 65], [62, 65, 70, 74]],
    [41, [53, 57, 60, 65], [60, 65, 69, 72]],
    [36, [52, 55, 60, 64], [60, 64, 67, 72]],
    [38, [50, 57, 62, 64, 65], [62, 64, 69, 74]],
    [46, [53, 58, 62, 65, 69], [62, 65, 69, 74]],
    [43, [55, 58, 62, 65], [62, 65, 67, 70]],
    [45, [52, 57, 61, 64], [61, 64, 69, 73]],
    [46, [53, 58, 62, 65], [65, 70, 74, 77]],
    [36, [52, 55, 60, 64], [64, 67, 72, 76]],
    [38, [50, 57, 62, 65], [62, 65, 69, 74]],
    [36, [53, 57, 62, 65], [60, 65, 69, 72]],
    [46, [53, 58, 62, 65, 69], [65, 69, 74, 77]],
    [45, [53, 57, 60, 65], [60, 65, 69, 72]],
    [43, [55, 58, 62, 65], [62, 67, 70, 74]],
    [45, [52, 57, 61, 64], [64, 69, 73, 76]],
  ],
  Ri = [
    Li,
    [
      [38, [50, 57, 62, 65], [62, 65, 69, 74]],
      [41, [53, 57, 60, 65], [60, 65, 69, 72]],
      [43, [55, 58, 62, 67], [62, 67, 70, 74]],
      [45, [52, 57, 61, 64], [61, 64, 69, 73]],
      [46, [53, 58, 62, 65], [62, 65, 70, 74]],
      [48, [55, 60, 64, 67], [64, 67, 72, 76]],
      [41, [53, 57, 60, 64], [60, 64, 69, 72]],
      [45, [52, 57, 61, 67], [61, 64, 67, 73]],
      [38, [50, 57, 62, 65], [65, 69, 74, 77]],
      [36, [52, 55, 60, 64], [64, 67, 72, 76]],
      [34, [50, 53, 58, 62], [62, 65, 70, 74]],
      [36, [52, 55, 60, 64], [60, 64, 67, 72]],
      [38, [50, 57, 62, 65], [62, 65, 69, 74]],
      [43, [55, 58, 62, 65], [62, 67, 70, 74]],
      [46, [53, 58, 62, 65], [65, 70, 74, 77]],
      [45, [52, 57, 61, 64], [64, 69, 73, 76]],
    ],
    [
      [38, [50, 57, 62, 65], [62, 65, 69, 74]],
      [39, [51, 58, 62, 67], [63, 67, 70, 75]],
      [38, [50, 57, 62, 65], [62, 65, 69, 74]],
      [36, [48, 55, 60, 63], [60, 63, 67, 72]],
      [34, [50, 53, 58, 62], [62, 65, 70, 74]],
      [39, [51, 55, 58, 63], [63, 67, 70, 75]],
      [43, [55, 58, 62, 67], [62, 67, 70, 74]],
      [45, [52, 57, 61, 64], [61, 64, 67, 73]],
      [38, [50, 57, 62, 65], [65, 69, 74, 77]],
      [39, [51, 58, 62, 67], [63, 67, 70, 75]],
      [41, [53, 57, 60, 65], [60, 65, 69, 72]],
      [43, [55, 58, 62, 67], [62, 67, 70, 74]],
      [46, [53, 58, 62, 65], [65, 70, 74, 77]],
      [44, [53, 56, 60, 65], [60, 65, 68, 72]],
      [45, [52, 57, 61, 64], [61, 64, 69, 73]],
      [45, [52, 55, 61, 64], [64, 67, 70, 73]],
    ],
  ],
  zi = [0, 1, 2, 3, 2, 1, 0, 1],
  Bi = [0, 2, 3, 1, 2, 3, 1, 2],
  Vi = [
    [
      [0, 0, 69, 4],
      [0, 4, 74, 2],
      [0, 6, 72, 2],
      [0, 8, 69, 8],
      [1, 4, 65, 4],
      [1, 8, 67, 8],
    ],
    [
      [0, 0, 74, 6],
      [0, 6, 72, 2],
      [0, 8, 70, 4],
      [0, 12, 69, 4],
      [1, 0, 65, 12],
    ],
    [
      [0, 4, 62, 2],
      [0, 6, 65, 2],
      [0, 8, 69, 4],
      [0, 12, 70, 4],
      [1, 0, 69, 6],
      [1, 8, 64, 8],
    ],
    [
      [0, 0, 77, 4],
      [0, 8, 76, 4],
      [0, 12, 74, 4],
      [1, 0, 72, 4],
      [1, 4, 69, 12],
    ],
  ],
  Hi = 1.5,
  Ui = 2.2,
  Wi = 0.72,
  Gi = class extends Ii {
    constructor(e) {
      (super(e, 96),
        this.bus(`pad`, 0.9),
        this.bus(`harp`, 0.8, !0),
        this.bus(`motif`, 0.7, !0),
        this.bus(`pulse`, 0),
        this.bus(`drive`, 0),
        this.bus(`climax`, 0),
        (this.climax = 0),
        (this.seed = ne(`field`) ^ Math.floor(M() * 1e9)),
        (this.sections = new Map()),
        (this.phaseAtLoop = e.phase));
      let t = new Set();
      for (let e of Ri)
        for (let n of e) for (let e of n[2]) (t.add(e), t.add(e + 12));
      for (let e of [0.45, 0.62]) this.warmPlucks(t, Hi, e);
      let n = new Set();
      for (let e of Vi) for (let t of e) n.add(t[2]);
      this.warmPlucks(n, Ui, Wi);
    }
    updateLevels(e, t) {
      let n = 0.7 + 0.3 * D(0, 0.5, t);
      this.climax = D(0.68, 0.92, t);
      let r = 1 + 0.45 * this.climax;
      (this.setLevel(`harp`, r * n * (1 - 0.35 * t), e),
        this.setLevel(`pad`, r * n * (1 - 0.2 * D(0.6, 1, t)), e),
        this.setLevel(`motif`, 0.7 * (1 - D(0.1, 0.3, t)), e, 1.2),
        this.setLevel(`pulse`, r * 0.7 * D(0.1, 0.38, t), e, 0.5),
        this.setLevel(`drive`, r * 0.65 * D(0.38, 0.68, t), e, 0.5),
        this.setLevel(`climax`, r * 0.62 * this.climax, e, 0.45));
    }
    climaxWeight() {
      return this.stopAt == null ? this.climax : 0;
    }
    section(e, t) {
      let n = this.sections.get(e);
      if (!n) {
        let t = re(this.seed + e * 7919),
          r = t();
        ((n = {
          type: r < 0.45 ? `full` : r < 0.8 ? `sparse` : `rest`,
          motif: t() < 0.6 ? Math.floor(t() * Vi.length) : -1,
          motifBar: t() < 0.5 ? 3 : 5,
          full: null,
        }),
          (n.full =
            n.type === `full`
              ? n
              : {
                  type: `full`,
                  motif: n.motif,
                  motifBar: n.motifBar,
                  full: null,
                }),
          n.full !== n && (n.full.full = n.full),
          this.sections.set(e, n),
          this.sections.size > 64 &&
            this.sections.delete(this.sections.keys().next().value));
      }
      return t > 0.15 ? n.full : n;
    }
    onStep(e, t) {
      let n = this.k,
        r = this.buses,
        i = this.dir.intensity,
        a = this.stepDur,
        o = Math.floor(e / 16),
        s = o % 16,
        c = e % 16;
      s === 0 && c === 0 && (this.phaseAtLoop = this.dir.phase);
      let l = this.phaseAtLoop,
        u = (Ri[l] || Li)[s],
        d = u[0],
        f = this.section(Math.floor(o / 8), i),
        p = f.type === `rest`,
        m = f.type === `sparse`;
      if (
        (c === 0 &&
          (n.pad(r.pad, t, {
            notes: p ? u[1].slice(0, 3) : u[1],
            dur: this.barDur * 0.82,
            a: 0.9,
            r: 1.9,
            peak: p ? 0.022 : 0.04,
            cutoff: 600 + 900 * i,
            cutoff2: 850 + 1600 * i,
            spread: 0.5,
          }),
          p ||
            n.tone(r.pad, t, {
              type: `triangle`,
              f: E(d),
              a: 0.5,
              h: this.barDur * 0.75,
              r: 1.2,
              peak: 0.055,
              lp: 320,
            }),
          l >= 1 &&
            s % 4 == 0 &&
            !p &&
            n.strings(r.pad, t, {
              f: E(d + 12),
              dur: this.barDur * 1.6,
              a: 1.4,
              r: 1.8,
              peak: 0.02,
              cutoff: 900,
            }),
          l >= 2 &&
            s % 4 == 2 &&
            !p &&
            n.choir(r.pad, t, {
              notes: u[1].slice(-2),
              a: 1.2,
              dur: this.barDur * 0.8,
              r: 1.6,
              peak: 0.016,
              vowel: `oo`,
            })),
        l >= 2 &&
          i < 0.35 &&
          !p &&
          (c === 0 || c === 3) &&
          s % 2 == 0 &&
          this.drum(r.pad, t, `taiko`, 52, 0.6, c === 0 ? 0.09 : 0.06),
        !p && c % 2 == 0)
      ) {
        let e = c % 4 == 0,
          a = s < 8 ? zi : Bi;
        if (m ? e && s % 2 == 0 : e || i > 0.12 || M() < 0.35) {
          let o = u[2][a[c / 2]] + (s % 4 == 3 && c >= 12 ? 12 : 0);
          n.pluck(r.harp, t, {
            f: E(o),
            t60: Hi,
            bright: i > 0.3 ? 0.62 : 0.45,
            peak: e ? 0.1 : 0.068,
            pan: (c / 2) % 2 ? 0.28 : -0.28,
            lp: 4600,
          });
        }
      }
      if (f.motif >= 0 && !p && i < 0.3) {
        let e = (o % 8) - f.motifBar;
        if (e === 0 || e === 1)
          for (let [i, o, s, l] of Vi[f.motif])
            i === e &&
              o === c &&
              (n.pluck(r.motif, t, {
                f: E(s),
                t60: Ui,
                bright: Wi,
                peak: 0.085,
                pan: 0.12,
              }),
              n.fm(r.motif, t, {
                f: E(s + 12),
                ratio: 3.5,
                index: 0.9,
                a: 0.004,
                d: Math.min(1.4, l * a * 2),
                peak: 0.012,
              }));
      }
      if (this.levels.pulse > 0.015) {
        if (c === 0 || c === 3 || c === 6 || c === 8 || c === 11 || c === 14) {
          let e = d + (c === 6 || c === 14 ? 12 : 0);
          n.tone(r.pulse, t, {
            type: `triangle`,
            f: E(e),
            d: 0.3,
            peak: 0.13,
            lp: 700,
          });
        }
        (c % 2 == 0 &&
          n.shaker(r.pulse, t, {
            peak: c % 4 == 2 ? 0.045 : 0.03,
            pan: c % 4 ? 0.25 : -0.15,
          }),
          (c === 0 || c === 6 || c === 10) &&
            this.drum(r.pulse, t, `taiko`, 118, 0.35, c === 0 ? 0.18 : 0.12));
      }
      if (
        this.levels.drive > 0.015 &&
        (c === 0
          ? this.drum(r.drive, t, `taiko`, 68, 1.2, 0.3)
          : c === 3 || c === 6
            ? this.drum(r.drive, t, `taiko`, 92, 0.5, 0.22, -0.2)
            : c === 11 && this.drum(r.drive, t, `taiko`, 82, 0.6, 0.26, 0.2),
        s % 4 == 3 &&
          c >= 12 &&
          this.drum(
            r.drive,
            t,
            `taiko`,
            96 + (c - 12) * 4,
            0.35,
            0.18 + (c - 12) * 0.03,
          ),
        (c === 4 || c === 12) &&
          this.drum(r.drive, t, `snare`, 1900, 0.16, 0.09),
        c % 2 == 0)
      ) {
        let e = d + [12, 19, 24, 19][(c / 2) % 4];
        n.strings(r.drive, t, {
          f: E(e),
          dur: a * 1.2,
          a: 0.01,
          r: 0.12,
          peak: c % 4 == 0 ? 0.045 : 0.032,
          cutoff: 2600,
          vib: !1,
          detunes: [-6, 6],
          pan: c % 4 ? 0.3 : -0.3,
        });
      }
      if (this.levels.climax > 0.015) {
        let e = u[1].slice(-3);
        if (c === 0 && s % 2 == 0)
          for (let i of e)
            n.brass(r.climax, t, { f: E(i), dur: 0.22, peak: 0.05, r: 0.2 });
        if (s % 4 == 3 && (c === 6 || c === 10))
          for (let i of e)
            n.brass(r.climax, t, { f: E(i), dur: 0.12, peak: 0.045, r: 0.12 });
        (c === 8 && this.drum(r.climax, t, `taiko`, 58, 1.4, 0.34),
          s % 4 == 0 &&
            c === 0 &&
            this.drum(r.climax, t, `crash`, 0, 2.4, 0.09),
          s % 4 == 3 &&
            c === 8 &&
            this.drum(r.climax, t, `swell`, 0, 8 * a, 0.07));
      }
    }
  },
  Ki = [
    [38, [50, 57, 62, 64, 65], [62, 64, 65, 69]],
    [46, [53, 57, 58, 62, 65], [65, 69, 70, 74]],
    [41, [53, 57, 60, 65], [65, 69, 72, 77]],
    [40, [52, 55, 60, 64], [64, 67, 72, 76]],
    [38, [50, 57, 62, 65], [62, 65, 69, 74]],
    [46, [53, 58, 62, 65], [62, 65, 70, 74]],
    [43, [55, 58, 62, 65], [62, 65, 67, 70]],
    [45, [52, 57, 61, 64], [61, 64, 69, 73]],
    [46, [53, 58, 62, 65], [65, 70, 74, 77]],
    [41, [53, 57, 60, 65], [65, 69, 72, 77]],
    [36, [52, 55, 60, 64], [64, 67, 72, 76]],
    [38, [50, 57, 62, 65], [65, 69, 74, 77]],
    [46, [53, 58, 62, 65], [65, 70, 74, 77]],
    [45, [53, 57, 60, 65], [65, 69, 72, 77]],
    [43, [55, 58, 62, 65], [67, 70, 74, 79]],
    [45, [52, 57, 61, 64], [64, 69, 73, 76]],
  ],
  qi = {
    0: [
      [0, 62, 8],
      [8, 69, 8],
    ],
    1: [
      [0, 67, 4],
      [4, 65, 4],
      [8, 62, 8],
    ],
    2: [
      [0, 65, 6],
      [6, 69, 2],
      [8, 72, 8],
    ],
    3: [
      [0, 76, 10],
      [10, 74, 2],
      [12, 72, 4],
    ],
    4: [
      [0, 74, 6],
      [6, 72, 2],
      [8, 69, 8],
    ],
    5: [
      [0, 70, 12],
      [12, 69, 2],
      [14, 70, 2],
    ],
    6: [
      [0, 67, 4],
      [4, 69, 4],
      [8, 70, 4],
      [12, 74, 4],
    ],
    7: [
      [0, 74, 8],
      [8, 73, 8],
    ],
  },
  Ji = {
    8: [
      [0, 74, 4],
      [4, 77, 4],
      [8, 81, 8],
    ],
    9: [
      [0, 79, 4],
      [4, 77, 4],
      [8, 72, 8],
    ],
    10: [
      [0, 76, 6],
      [6, 79, 2],
      [8, 84, 8],
    ],
    11: [
      [0, 81, 12],
      [12, 77, 4],
    ],
    12: [
      [0, 74, 4],
      [4, 77, 4],
      [8, 82, 8],
    ],
    13: [
      [0, 81, 6],
      [6, 79, 2],
      [8, 77, 8],
    ],
    14: [
      [0, 79, 4],
      [4, 77, 4],
      [8, 74, 4],
      [12, 70, 4],
    ],
    15: [
      [0, 73, 8],
      [8, 76, 8],
    ],
  },
  Yi = class extends Ii {
    constructor(e) {
      (super(e, 78),
        this.bus(`pad`, 1),
        this.bus(`harp`, 0.9, !0),
        this.bus(`lead`, 1, !0),
        this.bus(`perc`, 1));
      let t = new Set();
      for (let e of Ki) for (let n of e[2]) (t.add(n), t.add(n + 12));
      this.warmPlucks(t, 2, 0.38);
      let n = new Set();
      for (let e in Ji) for (let t of Ji[e]) n.add(t[1]);
      this.warmPlucks(n, 2.4, 0.75);
    }
    onStep(e, t) {
      let n = this.k,
        r = this.buses,
        i = this.stepDur,
        a = Math.floor(e / 16) % 16,
        o = e % 16,
        s = Ki[a];
      if (
        (o === 0 &&
          (n.pad(r.pad, t, {
            notes: s[1],
            dur: this.barDur * 0.85,
            a: 1.2,
            r: 2.4,
            peak: 0.055,
            cutoff: 800,
            cutoff2: 1500,
            spread: 0.55,
          }),
          n.tone(r.pad, t, {
            type: `triangle`,
            f: E(s[0]),
            a: 0.8,
            h: this.barDur * 0.7,
            r: 1.8,
            peak: 0.08,
            lp: 280,
          }),
          a >= 8 &&
            n.choir(r.pad, t, {
              notes: s[1].slice(-3),
              a: 1.1,
              dur: this.barDur * 0.6,
              r: 1.6,
              peak: 0.03,
              vowel: `oo`,
            }),
          a % 4 == 0 && this.drum(r.perc, t, `taiko`, 58, 2.2, 0.3)),
        o % 2 == 0 || (a % 2 == 1 && o >= 13))
      ) {
        let e = [0, 1, 2, 3, 2, 3, 1, 2][Math.floor(o / 2)],
          i = s[2][e] + (o >= 13 && o % 2 ? 12 : 0);
        n.pluck(r.harp, t, {
          f: E(i),
          t60: 2,
          bright: 0.38,
          peak: o % 4 == 0 ? 0.085 : 0.06,
          pan: o % 4 == 0 ? -0.3 : 0.3,
          lp: 4e3,
        });
      }
      for (let [e, s, c] of qi[a] || Xi)
        e === o &&
          (n.brass(r.lead, t, {
            f: E(s),
            dur: c * i * 0.92,
            peak: 0.07,
            a: 0.14,
            r: 0.55,
            bright: 0.42,
            scoop: 25,
          }),
          n.strings(r.lead, t, {
            f: E(s - 12),
            dur: c * i * 0.95,
            a: 0.2,
            r: 0.6,
            peak: 0.028,
            cutoff: 1800,
          }));
      for (let [e, i] of Ji[a] || Xi)
        e === o &&
          (n.pluck(r.lead, t, {
            f: E(i),
            t60: 2.4,
            bright: 0.75,
            peak: 0.1,
            pan: 0.15,
          }),
          n.bell(r.lead, t, {
            f: E(i),
            ratios: [1, 2, 3.01, 4.16],
            amps: [1, 0.25, 0.1, 0.04],
            d: 2,
            peak: 0.03,
            pan: -0.15,
          }));
      ((a === 7 || a === 15) &&
        o >= 8 &&
        this.drum(r.perc, t, `taiko`, 64, 0.4, 0.06 + 0.02 * (o - 8)),
        (a === 7 || a === 15) &&
          o === 8 &&
          this.drum(r.perc, t, `swell`, 0, 8 * i, 0.05));
    }
  },
  Xi = Object.freeze([]),
  Zi = [
    [38, [50, 57, 62, 66], [62, 66, 69, 74]],
    [43, [50, 55, 59, 62], [62, 67, 71, 74]],
    [47, [54, 59, 62, 66], [59, 62, 66, 71]],
    [45, [52, 57, 61, 64], [61, 64, 69, 73]],
  ],
  Qi = [
    [38, [50, 57, 62, 65], [62, 65, 69]],
    [46, [53, 58, 62, 65], [62, 65, 70]],
    [43, [55, 58, 62, 67], [62, 67, 70]],
    [45, [52, 57, 61, 64], [61, 64, 69]],
  ],
  $i = class extends Ii {
    constructor(e, t) {
      (super(e, t ? 76 : 64),
        (this.victory = t),
        this.bus(`stinger`, t ? 0.9 : 0.72),
        this.bus(`pad`, t ? 0.9 : 0.8),
        this.bus(`harp`, 0.8, !0),
        (this.intro = Math.ceil((t ? 5.6 : 7) / this.stepDur)));
      let n = new Set();
      for (let e of t ? Zi : Qi) for (let r of e[2]) n.add(r + (t ? 12 : 0));
      this.warmPlucks(n, 2.2, 0.4);
    }
    onStep(e, t) {
      let n = this.k,
        r = this.buses;
      if (
        (e === 0 && (this.victory ? bi : xi)(n, r.stinger, t), e < this.intro)
      )
        return;
      let i = e - this.intro,
        a = Math.floor(i / 16) % 4,
        o = i % 16,
        s = (this.victory ? Zi : Qi)[a];
      o === 0 &&
        (n.pad(r.pad, t, {
          notes: s[1],
          dur: this.barDur * 0.85,
          a: 1.4,
          r: 2.6,
          peak: 0.045,
          cutoff: this.victory ? 1300 : 700,
          spread: 0.6,
        }),
        n.tone(r.pad, t, {
          type: `triangle`,
          f: E(s[0]),
          a: 1,
          h: this.barDur * 0.7,
          r: 2,
          peak: 0.06,
          lp: 260,
        }));
      let c = this.victory ? 2 : 4;
      if (o % c === 0) {
        let e = s[2][(o / c) % s[2].length] + (this.victory ? 12 : 0);
        n.pluck(r.harp, t, {
          f: E(e),
          t60: 2.2,
          bright: 0.4,
          peak: 0.06,
          pan: N(-0.3, 0.3),
          lp: 3800,
        });
      }
    }
  },
  ea = class {
    constructor(e, t, n, { baker: r = null } = {}) {
      ((this.ac = e),
        (this.mix = t),
        (this.kit = n),
        (this.baker = r),
        (this.cues = []),
        (this.current = null),
        (this.pending = null),
        (this.name = null),
        (this.intensity = 0),
        (this.phase = 0),
        (this.errors = 0),
        (this.climax = 0));
    }
    static cueNames() {
      return [`menu`, `field`, `victory`, `defeat`];
    }
    setCue(e, { fade: t = 1.8, delay: n = 0, immediate: r = !1 } = {}) {
      if (e === this.name) return;
      this.name = e;
      let i = this.ac.currentTime;
      if (
        (this.current && this.current.stop(i + n, t),
        (this.pending &&= (this.pending.cue.dispose(), null)),
        (this.current = null),
        !e || e === `silent`)
      )
        return;
      let a =
        e === `menu`
          ? new Yi(this)
          : e === `field`
            ? new Gi(this)
            : e === `victory`
              ? new $i(this, !0)
              : e === `defeat`
                ? new $i(this, !1)
                : null;
      if (!a) return;
      let o = e === `victory` || e === `defeat`;
      ((this.pending = {
        cue: a,
        at: i + n + (o ? 0.02 : 0.12),
        fade: o ? 0.02 : t * 0.75,
        requested: i,
        level: e === `field` ? Ni : 1,
      }),
        (this.current = a),
        r && this._start(i, !0));
    }
    setGameTime(e) {
      this.phase = e >= 960 ? 2 : +(e >= 420);
    }
    setIntensity(e) {
      this.intensity = w(Number(e) || 0, 0, 1);
    }
    _start(e, t = !1) {
      let n = this.pending;
      if (!n) return;
      let r = n.cue.isWarm() || e - n.requested > 0.9;
      (!t && (!r || e < n.at - 0.45)) ||
        ((this.pending = null),
        n.cue.start(Math.max(n.at, e + 0.05), n.fade, n.level),
        this.cues.push(n.cue));
    }
    pump(e = this.ac.currentTime, t = e + Mi) {
      this.pending && this._start(e, k(this.ac));
      let n = 0;
      for (let r = this.cues.length - 1; r >= 0; r--) {
        let i = this.cues[r];
        if (i.stopAt != null && e > i.stopAt + 5) {
          (i.dispose(), this.cues.splice(r, 1));
          continue;
        }
        (i.updateLevels(e, this.intensity), i.schedule(e, t));
        let a = i.climaxWeight();
        a > n && (n = a);
      }
      this._setClimax(n, e);
    }
    _setClimax(e, t) {
      this.climax = e;
      let n = this.mix;
      n &&
        typeof n.setSidechainDepth == `function` &&
        n.setSidechainDepth(Ke(e), t);
    }
    stopAll(e = 0.5) {
      let t = this.ac.currentTime;
      for (let n of this.cues) n.stopAt ?? n.stop(t, e);
      ((this.pending &&= (this.pending.cue.dispose(), null)),
        this._setClimax(0, t),
        (this.current = null),
        (this.name = null));
    }
    dispose() {
      for (let e of this.cues) e.dispose();
      ((this.cues.length = 0),
        this.pending && this.pending.cue.dispose(),
        (this.pending = null));
    }
  },
  ta = {
    wind: 0.5,
    water: 0.36,
    jungle: 1,
    blue: 0.62,
    red: 0.62,
    drake: 0.34,
    tyrant: 0.4,
  },
  na = Object.keys(ta),
  ra = [`birds`, `water`, `jungle`, `blue`, `red`, `drake`, `tyrant`],
  ia = {
    birds: 0.5,
    water: 3.2,
    jungle: 1.8,
    blue: 0.35,
    red: 1.4,
    drake: 0.09,
    tyrant: 0.12,
  },
  aa = [1760, 2093, 2349, 2637, 3136],
  oa = class {
    constructor(e, t, n) {
      ((this.ac = e),
        (this.k = n),
        (this.mix = t),
        (this.out = n.gain(t.ambIn, 1)),
        (this.send = n.gain(t.ambSend, 1)),
        (this.started = !1),
        (this.srcs = []),
        (this.g = {}),
        (this.w = {}),
        (this.sw = {}),
        (this.next = {}));
      for (let e of na) this.w[e] = 0;
      for (let e of ra) this.sw[e] = 0;
    }
    start(e = this.ac.currentTime) {
      if (this.started) return;
      this.started = !0;
      let t = this.k,
        n = this.ac,
        r = this.srcs,
        i = (e, t = `sine`) => {
          let i = n.createOscillator();
          return ((i.type = t), (i.frequency.value = e), r.push(i), i);
        },
        a = {
          a: i(0.037),
          b: i(0.071),
          c: i(0.113),
          d: i(0.31),
          e: i(0.83),
          f: i(2.3),
          am: i(46),
        },
        o = (e, n, r) => {
          let i = t.gain(e, r);
          n.connect(i);
        },
        s = t.loopNoise(null, `pink`, 1),
        c = t.loopNoise(null, `white`, 1),
        l = t.loopNoise(null, `brown`, 1);
      r.push(s, c, l);
      let u = (e, t) => (e.connect(t), t),
        d = (e, n) => {
          let r = t.gain(this.out, 0);
          return (n && r.connect(t.gain(this.send, n)), (this.g[e] = r), r);
        },
        f = (e, i, a, o) => {
          let s = n.createOscillator();
          return (
            typeof i == `string` ? (s.type = i) : s.setPeriodicWave(i),
            (s.frequency.value = a),
            s.connect(t.gain(e, o)),
            r.push(s),
            s
          );
        },
        p = (e) => {
          let t = new Float32Array(e.length + 1),
            r = new Float32Array(e.length + 1);
          return (
            e.forEach((e, t) => {
              r[t + 1] = e;
            }),
            n.createPeriodicWave(t, r)
          );
        },
        m = d(`wind`, 0.15),
        h = t.gain(m, 0.6);
      (o(u(s, t.filter(h, `bandpass`, 520, 0.55)).frequency, a.b, 230),
        o(h.gain, a.c, 0.26),
        o(h.gain, a.a, 0.18));
      let g = t.gain(m, 0.08),
        _ = u(c, t.filter(g, `bandpass`, 1900, 7));
      (o(g.gain, a.d, 0.06), o(_.frequency, a.b, 420));
      let v = d(`water`, 0.25);
      u(l, t.filter(t.gain(v, 0.55), `lowpass`, 450, 0.6));
      let y = t.gain(v, 0.42),
        b = u(s, t.filter(y, `bandpass`, 1300, 1.1));
      (o(b.frequency, a.e, 320),
        o(b.frequency, a.f, 140),
        o(y.gain, a.d, 0.14),
        u(c, t.filter(t.gain(v, 0.07), `bandpass`, 3400, 2)));
      let x = d(`jungle`, 0.2),
        S = t.gain(x, 0.3);
      o(S.gain, a.a, 0.22);
      let C = t.gain(S, 0.5);
      (o(C.gain, a.am, 0.5), u(c, t.filter(C, `bandpass`, 5200, 10)));
      let w = t.gain(x, 0.1);
      (o(w.gain, a.c, 0.08), u(s, t.filter(w, `bandpass`, 1800, 0.6)));
      let T = d(`blue`, 0.35),
        E = p([0, 0.05, 0.035, 0.028]);
      (f(T, E, 55, 0.075), f(T, E, 55.18, 0.035));
      let D = t.gain(T, 0.012);
      (o(D.gain, a.d, 0.01), f(D, p([0, 1, 0.8]), 880.2, 1));
      let O = d(`red`, 0.3);
      (f(t.filter(O, `lowpass`, 280, 0.8), `sawtooth`, 65.4, 0.09),
        f(O, `sine`, 98.3, 0.035));
      let k = t.gain(O, 0.14),
        A = t.loopCrackle(t.filter(k, `bandpass`, 900, 0.8), 0.55);
      r.push(A);
      let j = d(`drake`, 0.3),
        ee = t.gain(j, 0.45);
      (o(ee.gain, a.b, 0.35), u(l, t.filter(ee, `lowpass`, 190, 0.7)));
      let M = d(`tyrant`, 0.3);
      (f(M, `sine`, 55, 0.1),
        f(t.filter(M, `lowpass`, 400, 0.7), `sawtooth`, 82.6, 0.035));
      let te = t.gain(M, 0.12);
      (o(te.gain, a.c, 0.09), u(s, t.filter(te, `bandpass`, 220, 5)));
      for (let t of r)
        try {
          t.start(e);
        } catch {}
      for (let t of ra) this.next[t] = e + N(0.3, 2.5);
    }
    setMix(e, t = this.ac.currentTime, n = 0.9, r = null) {
      if (!this.started) return;
      let i = r && r.shotScale != null ? r.shotScale : 1,
        a = r && r.bedScale != null ? r.bedScale : 1;
      for (let t = 0; t < ra.length; t++) {
        let n = ra[t];
        this.sw[n] = w((e[n] || 0) * i, 0, 1);
      }
      for (let r = 0; r < na.length; r++) {
        let i = na[r],
          o = w((e[i] || 0) * a, 0, 1);
        Math.abs(o - this.w[i]) < 0.01 ||
          ((this.w[i] = o), P(this.g[i].gain, o * ta[i], t, n));
      }
    }
    pump(e, t) {
      if (this.started)
        for (let n = 0; n < ra.length; n++) {
          let r = ra[n];
          this.next[r] < e - 1 && (this.next[r] = e + N(0, 0.5));
          let i = 0;
          for (; this.next[r] < t && i++ < 8; ) {
            let e = this.sw[r],
              t = this.next[r];
            if (e > 0.06)
              try {
                this.oneShot(r, t, e);
              } catch {}
            this.next[r] =
              t + -Math.log(1 - M() * 0.98) / (ia[r] * Math.max(0.15, e));
          }
        }
    }
    oneShot(e, t, n) {
      let r = this.k,
        i = r.pan(r.gain(this.out, 1), N(-0.85, 0.85));
      switch ((i.connect(r.gain(this.send, 0.35)), e)) {
        case `birds`:
          sa(r, i, t, n);
          break;
        case `water`:
          M() < 0.85
            ? r.bubbles(i, t, {
                count: 2 + Math.floor(M() * 3),
                dur: 0.25,
                peak: 0.035 * n,
                fMin: 300,
                fMax: 950,
              })
            : r.noiseHit(i, t, {
                color: `pink`,
                type: `lowpass`,
                f: 700,
                swell: !0,
                a: 0.5,
                d: 0.7,
                peak: 0.08 * n,
              });
          break;
        case `jungle`: {
          let e = M();
          e < 0.7 ? ca(r, i, t, n) : e < 0.9 ? la(r, i, t, n) : ua(r, i, t, n);
          break;
        }
        case `blue`:
          r.bell(i, t, {
            f: te(aa),
            ratios: [1, 2, 3.01],
            d: 2.2,
            peak: 0.018 * n,
          });
          break;
        case `red`:
          r.noiseHit(i, t, {
            type: `highpass`,
            f: N(2500, 4500),
            d: N(0.01, 0.04),
            peak: 0.05 * n * N(0.3, 1),
          });
          break;
        case `drake`:
          (r.rumble(i, t, {
            dur: 2.6,
            f: 220,
            peak: 0.22 * n,
            swell: !0,
            a: 0.4,
          }),
            r.noiseHit(i, t + 0.35, {
              type: `highpass`,
              f: 1500,
              d: 0.3,
              peak: 0.04 * n,
            }));
          break;
        case `tyrant`:
          r.fm(i, t, {
            f: 45,
            ratio: 0.5,
            index: 5,
            a: 0.8,
            h: 0.6,
            r: 1,
            peak: 0.08 * n,
          });
      }
    }
    stop(e = 0.6) {
      this.started && P(this.out.gain, 0, this.ac.currentTime, e / 4);
    }
    resumeOut(e = 0.8) {
      P(this.out.gain, 1, this.ac.currentTime, e / 4);
    }
    dispose() {
      for (let e of this.srcs) {
        try {
          e.stop();
        } catch {}
        try {
          e.disconnect();
        } catch {}
      }
      this.srcs.length = 0;
      try {
        this.out.disconnect();
      } catch {}
      this.started = !1;
    }
  };
function sa(e, t, n, r) {
  let i = 0.045 * r * N(0.45, 1),
    a = M();
  if (a < 0.45) {
    let r = 2 + Math.floor(M() * 4),
      a = N(2800, 4300),
      o = N(0.07, 0.12);
    for (let s = 0; s < r; s++)
      e.tone(t, n + s * o, {
        f: a * N(0.96, 1.04),
        f1: a * N(1.25, 1.45),
        glide: 0.035,
        a: 0.004,
        d: 0.06,
        peak: i,
      });
  } else if (a < 0.75) {
    let r = N(2e3, 3e3);
    e.tone(t, n, {
      f: r,
      f1: r * 1.2,
      glide: 0.28,
      a: 0.015,
      h: N(0.18, 0.3),
      r: 0.08,
      peak: i * 0.8,
      vib: [N(18, 28), 170],
    });
  } else {
    let r = N(2700, 3300);
    (e.tone(t, n, { f: r, a: 0.02, h: 0.12, r: 0.1, peak: i * 0.9 }),
      e.tone(t, n + 0.3, {
        f: r * 0.8,
        a: 0.02,
        h: 0.15,
        r: 0.12,
        peak: i * 0.8,
      }));
  }
}
function ca(e, t, n, r) {
  let i = N(4300, 5200),
    a = 3 + Math.floor(M() * 2),
    o = 1 + Math.floor(M() * 3);
  for (let s = 0; s < o; s++)
    for (let o = 0; o < a; o++)
      e.tone(t, n + s * 0.32 + o * 0.028, {
        f: i,
        a: 0.002,
        d: 0.022,
        peak: 0.02 * r,
      });
}
function la(e, t, n, r) {
  let i = N(170, 260),
    a = 5 + Math.floor(M() * 4);
  for (let o = 0; o < a; o++)
    e.tone(t, n + o * 0.045, {
      type: `sawtooth`,
      f: i,
      bp: 460,
      q: 3,
      a: 0.003,
      d: 0.035,
      peak: 0.05 * r,
    });
}
function ua(e, t, n, r) {
  for (let i = 0; i < 2; i++)
    e.tone(t, n + i * 0.42, {
      f: 385,
      f1: 360,
      glide: 0.3,
      a: 0.03,
      h: 0.14,
      r: 0.2,
      peak: 0.02 * r,
      vib: [5, 10],
    });
}
var da = 5,
  fa = 0.12,
  pa = {
    team: (e) => (e === 1 ? 1 : e === 2 ? 2 : 0),
    crit: (e) => +!!e,
    self: (e) => +!!e,
    amount: (e) => {
      let t = Number(e) || 120;
      return t < 110 ? 90 : t < 190 ? 150 : 240;
    },
    windup: (e) => Math.round(w(Number(e) || 0.25, 0.05, 1) * 20) / 20,
    count: (e) => w(Math.round(Number(e) || 2), 1, 5),
    duration: (e) => Math.round(w(Number(e) || 0.5, 0.1, 3) * 10) / 10,
    power: (e) => Math.round(w(Number(e) || 1, 0, 1) * 2) / 2,
  };
function ma(e, t) {
  return pa[e]
    ? pa[e](t)
    : t == null
      ? null
      : typeof t == `number`
        ? Math.round(t * 100) / 100
        : t;
}
var ha = [
    {
      team: 0,
      rel: `ally`,
      crit: !1,
      amount: 160,
      windup: 0.25,
      count: 3,
      self: !0,
      subtype: `melee`,
      element: `arcane`,
      duration: 0.8,
      power: 1,
    },
    {
      team: 1,
      rel: `enemy`,
      crit: !0,
      amount: 90,
      windup: 0.3,
      count: 5,
      self: !1,
      subtype: `siege`,
      element: `fire`,
      duration: 0.8,
      power: 0.5,
    },
  ],
  ga = 1.5,
  _a = 12,
  va = new Set([
    `hit`,
    `hit_minor`,
    `minion_attack`,
    `minion_death`,
    `monster`,
    `cc`,
    `attack`,
  ]),
  ya = () => (typeof performance < `u` ? performance.now() : Date.now()),
  ba = class {
    constructor(
      e,
      {
        OAC: t = null,
        rate: n = null,
        budgetMB: r = null,
        enabled: i = !0,
      } = {},
    ) {
      this.ac = e;
      let a =
        typeof OfflineAudioContext == `function` ? OfflineAudioContext : null;
      ((this.OAC = t || a), (this.enabled = i && !!this.OAC));
      let o = e && e.sampleRate ? e.sampleRate : 48e3;
      this.rate = w(Math.round(n ?? o), 22050, 48e3);
      let s =
        typeof navigator < `u` &&
        navigator.deviceMemory &&
        navigator.deviceMemory <= 4;
      ((this.budget = (r ?? (s ? 32 : 64)) * 1048576),
        (this.info = new Map()),
        (this.entries = new Map()),
        (this.urgent = []),
        (this.queue = []),
        (this._prewarming = !1),
        (this.running = 0),
        (this.maxRunning = 2),
        (this.bytes = 0),
        (this.build = { ms: 0, units: 0, n: 0, base: 0.4, minMs: 1 / 0 }),
        (this.stats = {
          hits: 0,
          misses: 0,
          rendered: 0,
          failed: 0,
          evicted: 0,
          renderMs: 0,
          startMs: 0,
          tooBig: 0,
        }));
    }
    unitsOf(e) {
      return (
        (e.nodes || 8) +
        Math.ceil(((e.len || 0.5) + 0.04) * this.rate * e.channels) / 8e3
      );
    }
    estimateMs(e) {
      let t = this.build;
      if (t.n < 4) return 0.45 + this.unitsOf(e) * 0.006;
      let n = Math.max(
        1e-4,
        (t.ms / t.n - t.base) / Math.max(1, t.units / t.n),
      );
      return t.base + n * this.unitsOf(e);
    }
    cheapestQueuedMs() {
      let e = 1 / 0,
        t = this.urgent.length ? this.urgent : this.queue;
      for (let n = 0; n < t.length; n++) {
        let r = this.estimateMs(t[n]);
        r < e && (e = r);
      }
      return e;
    }
    analyze(e, t) {
      let n = this.info.get(e);
      if (n) return n;
      let r = new Set(),
        i = 0,
        a = !!t.live,
        o = 0,
        s = 0,
        c = 0,
        l = ee();
      for (let e of ha) {
        let n = new ze(),
          l = new F(n),
          u = n.createGain(),
          d = new Proxy(e, {
            get: (e, t) => (typeof t == `string` && r.add(t), e[t]),
          });
        try {
          let e = t.fn(l, u, 0, d),
            r = typeof e == `number` ? e : e && e.end;
          (e && typeof e.stop == `function` && (a = !0),
            (i = Math.max(i, Number.isFinite(r) ? r : 0)),
            (o = Math.max(o, n.peakSources(fa))),
            (s = Math.max(s, n.peakSources())),
            (c = Math.max(c, n.nodes)));
        } catch {
          a = !0;
        }
      }
      return (
        j(l),
        (n = {
          used: [...r].filter((e) => e in ha[0]).sort(),
          end: i,
          live: a || i > da || i <= 0,
          sources: Math.max(1, o),
          peakSources: Math.max(1, s),
          nodes: c,
        }),
        this.info.set(e, n),
        n
      );
    }
    analyzed(e) {
      return this.info.has(e);
    }
    variantOf(e, t, n) {
      let r = this.analyze(e, t);
      if (r.live) return null;
      let i = e,
        a = {};
      for (let e of r.used) {
        let t = ma(e, n[e]);
        ((a[e] = t), (i += `|` + t));
      }
      return { key: i, params: a, a: r };
    }
    get(e, t, n) {
      if (!this.enabled || !t) return null;
      let r = this.variantOf(e, t, n || {});
      if (!r) return null;
      let i = this.entries.get(r.key);
      if (!i) {
        let n = xa(t),
          a = t.seeds ?? (va.has(t.group) ? 2 : 1);
        ((i = {
          key: r.key,
          name: e,
          spec: t,
          params: r.params,
          bufs: [],
          bytes: 0,
          want: a,
          pending: 0,
          queued: 0,
          last: 0,
          failed: 0,
          skips: 0,
          len: r.a.end,
          nodes: r.a.nodes,
          channels: n ? 1 : 2,
        }),
          this.entries.set(r.key, i));
      }
      if (
        ((i.last = ya()), this._enqueue(i, !this._prewarming), !i.bufs.length)
      )
        return (this.stats.misses++, null);
      this.stats.hits++;
      let a = i.bufs[(Math.random() * i.bufs.length) | 0],
        o = t.vary ?? (va.has(t.group) ? 0.035 : 0.012);
      return { buffer: a, gain: i.channels === 1 ? Math.SQRT2 : 1, vary: o };
    }
    renderNow(e, t, n) {
      let r = this.variantOf(e, t, n || {});
      if (!r || !this.OAC) return Promise.resolve(null);
      let i = xa(t),
        a = Math.max(64, Math.ceil((r.a.end + 0.04) * this.rate)),
        o = new this.OAC(i ? 1 : 2, a, this.rate),
        s = ee();
      j(ne(r.key + `#0`));
      try {
        let e = new F(o),
          n = o.createGain();
        (n.connect(o.destination), t.fn(e, n, 0, { ...r.params }));
      } finally {
        j(s);
      }
      return o.startRendering().then((e) => {
        let t = Sa(e);
        return t ? { buffer: t, gain: i ? Math.SQRT2 : 1 } : null;
      });
    }
    prewarm(e, t, n) {
      if (!this.enabled || !t) return;
      let { hits: r, misses: i } = this.stats;
      this._prewarming = !0;
      try {
        this.variantOf(e, t, n || {}) && this.get(e, t, n);
      } finally {
        this._prewarming = !1;
      }
      ((this.stats.hits = r), (this.stats.misses = i));
    }
    sourcesOf(e, t) {
      return t ? this.analyze(e, t).sources : 8;
    }
    nodesOf(e, t) {
      return (t && this.analyze(e, t).nodes) || 8;
    }
    _enqueue(e, t = !1) {
      if (!(e.failed >= 3 || e.bufs.length + e.pending >= e.want)) {
        if (t && e.queued !== 2) {
          if (e.queued === 1) {
            let t = this.queue.indexOf(e);
            t >= 0 && this.queue.splice(t, 1);
          }
          ((e.queued = 2), this.urgent.push(e));
          return;
        }
        e.queued || ((e.queued = 1), this.queue.push(e));
      }
    }
    pump(e, t = 2, n = 1 / 0) {
      if (!this.enabled) return;
      let r = 0,
        i = 0,
        a = Math.min(this.urgent.length + this.queue.length, _a);
      for (
        ;
        (this.urgent.length || this.queue.length) &&
        i < a &&
        this.running < this.maxRunning &&
        r < t;
      ) {
        let t = Math.min(n, e - ya());
        if (t <= 0.2) break;
        let a =
          this.urgent.length > 0 ? this.urgent.shift() : this.queue.shift();
        i++;
        let o = a.queued === 2;
        if (
          ((a.queued = 0),
          !(a.bufs.length + a.pending >= a.want || !this.entries.has(a.key)))
        ) {
          if (this.estimateMs(a) * ga > t) {
            ((a.skips = (a.skips || 0) + 1),
              this.stats.tooBig++,
              this._enqueue(a, o));
            continue;
          }
          (this._render(a), r++);
        }
      }
    }
    idle() {
      return !this.queue.length && !this.urgent.length && !this.running;
    }
    _render(e) {
      let t = e.bufs.length + e.pending,
        n = Math.max(64, Math.ceil((e.len + 0.04) * this.rate)),
        r,
        i = ee(),
        a = ya();
      try {
        ((r = new this.OAC(e.channels, n, this.rate)), j(ne(e.key + `#` + t)));
        let i = new F(r),
          a = r.createGain();
        (a.connect(r.destination), e.spec.fn(i, a, 0, { ...e.params }));
      } catch {
        (j(i), e.failed++, this.stats.failed++);
        return;
      }
      (j(i), e.pending++, this.running++);
      let o = (t) => {
        (this.running--, e.pending--, (this.stats.renderMs += ya() - a));
        let n = t ? Sa(t) : null;
        if (!n) {
          (e.failed++, this.stats.failed++);
          return;
        }
        if (!this.entries.has(e.key)) return;
        e.bufs.push(n);
        let r = n.length * n.numberOfChannels * 4;
        ((e.bytes += r),
          (this.bytes += r),
          this.stats.rendered++,
          this._evict(),
          this._enqueue(e, !0));
      };
      try {
        let e = r.startRendering();
        e && e.then
          ? e.then(o, () => o(null))
          : (r.oncomplete = (e) => o(e.renderedBuffer));
      } catch {
        o(null);
      }
      let s = ya() - a;
      this.stats.startMs += s;
      let c = this.build;
      ((c.ms += s),
        (c.units += this.unitsOf(e)),
        c.n++,
        s < c.minMs && (c.minMs = s),
        (c.base = w(c.minMs, 0.05, Math.max(0.05, (c.ms / c.n) * 0.6))),
        c.n > 48 &&
          ((c.ms *= 0.5),
          (c.units *= 0.5),
          (c.n = 24),
          (c.minMs = Math.min(c.minMs * 1.25, c.ms / c.n))));
    }
    _evict() {
      if (this.bytes <= this.budget) return;
      let e = ya(),
        t = [...this.entries.values()]
          .filter((t) => t.bufs.length && e - t.last > 2500)
          .sort((e, t) => e.last - t.last);
      for (let e of t) {
        if (this.bytes <= this.budget * 0.85) break;
        ((this.bytes -= e.bytes),
          (this.stats.evicted += e.bufs.length),
          this.entries.delete(e.key));
      }
    }
    report() {
      let e = 0;
      for (let t of this.entries.values()) e += t.bufs.length;
      return {
        enabled: this.enabled,
        rate: this.rate,
        entries: this.entries.size,
        buffers: e,
        mb: +(this.bytes / 1048576).toFixed(2),
        budgetMB: +(this.budget / 1048576).toFixed(0),
        queue: this.queue.length,
        urgent: this.urgent.length,
        running: this.running,
        analyzed: this.info.size,
        baseMs: +this.build.base.toFixed(2),
        ...this.stats,
        renderMs: Math.round(this.stats.renderMs),
        startMs: +this.stats.startMs.toFixed(1),
      };
    }
  };
function xa(e) {
  return e.bakeChannels === 1 || (e.bakeChannels == null && va.has(e.group));
}
function Sa(e) {
  let t = e.numberOfChannels,
    n = e.length,
    r = e.sampleRate,
    i = 0,
    a = [];
  for (let r = 0; r < t; r++) {
    let t = e.getChannelData(r);
    a.push(t);
    for (let e = 0; e < n; e++) {
      let n = t[e] < 0 ? -t[e] : t[e];
      n > i && (i = n);
    }
  }
  if (!(i > 1e-4)) return null;
  let o = Math.max(i * 0.0032, 2e-5),
    s = 0;
  for (let e of a)
    for (let t = n - 1; t > s; t--)
      if (e[t] > o || e[t] < -o) {
        s = t;
        break;
      }
  let c = Math.min(n, s + Math.floor(r * 0.012)),
    l = Math.min(c, Math.floor(r * 0.01));
  for (let e of a) for (let t = 0; t < l; t++) e[c - 1 - t] *= t / l;
  if (c >= n * 0.92 || typeof AudioBuffer != `function`) return e;
  try {
    let e = new AudioBuffer({ numberOfChannels: t, length: c, sampleRate: r });
    for (let n = 0; n < t; n++) e.copyToChannel(a[n].subarray(0, c), n);
    return e;
  } catch {
    return e;
  }
}
function Ca(
  e,
  t,
  n,
  r,
  i,
  {
    gain: a = 1,
    pan: o = 0,
    lp: s = 0,
    sendExtra: c = 0,
    baked: l = null,
    path: u = null,
  } = {},
) {
  let d = e.gain(null, a),
    f = d,
    p = null;
  ((s > 0 && s < 17e3) || (u && u.some((e) => e.lp > 0 && e.lp < 17e3))) &&
    ((p = e.filter(null, `lowpass`, s > 0 && s < 17e3 ? s : 18e3, 0.6)),
    d.connect(p),
    (f = p));
  let m = e.pan(t.busFor(n.cat), o);
  f.connect(m);
  let h = (n.verb ?? 0.12) + c,
    g = null;
  h > 0.01 && ((g = e.gain(t.sendFor(n.cat), h)), f.connect(g));
  let _ = [d, p, m, g];
  u && u.length && wa(d, m, p, r, u);
  let v = e.sources;
  if (l && l.buffer) {
    let t = e.ac.createBufferSource();
    (e.sources++, (t.buffer = l.buffer));
    let n = l.rate || 1;
    t.playbackRate.value = n;
    let i = d;
    (l.gain && l.gain !== 1 && ((i = e.gain(d, l.gain)), _.push(i)),
      t.connect(i),
      t.start(r));
    let a = r + l.buffer.duration / n;
    return (
      t.stop(a + 0.01),
      _.push(t),
      {
        vin: d,
        nodes: _,
        end: a,
        sources: 1,
        stops: [r, a + 0.01],
        baked: !0,
        stop: (e) => {
          try {
            t.stop(Math.max(e, r) + 0.14);
          } catch {}
        },
      }
    );
  }
  let y,
    b = (e.log = []);
  try {
    y = n.fn(e, d, r, i);
  } catch (t) {
    throw ((e.log = null), Ta(_), t);
  }
  return (
    (e.log = null),
    {
      vin: d,
      nodes: _,
      end:
        typeof y == `number` && Number.isFinite(y)
          ? y
          : y && Number.isFinite(y.end)
            ? y.end
            : r + 1,
      sources: e.sources - v,
      stops: b,
      baked: !1,
      stop: y && typeof y.stop == `function` ? y.stop : null,
    }
  );
}
function wa(e, t, n, r, i) {
  try {
    let a = i[0];
    (e.gain.setValueAtTime(a.gain, r),
      t.pan && t.pan.setValueAtTime(a.pan, r),
      n && n.frequency.setValueAtTime(a.lp > 0 ? a.lp : 18e3, r));
    for (let a = 1; a < i.length; a++) {
      let o = i[a],
        s = r + o.dt;
      (e.gain.linearRampToValueAtTime(o.gain, s),
        t.pan && t.pan.linearRampToValueAtTime(o.pan, s),
        n && n.frequency.linearRampToValueAtTime(o.lp > 0 ? o.lp : 18e3, s));
    }
  } catch {}
}
function Ta(e) {
  for (let t of e)
    if (t)
      try {
        t.disconnect();
      } catch {}
}
var Ea = 44,
  Da = 96,
  Oa = {
    hit: { max: 9, srcGap: 0.02, gap: 0 },
    hit_minor: { max: 3, srcGap: 0.06, gap: 0.03 },
    attack: { max: 9, srcGap: 0.015, gap: 0 },
    ability: { max: 14, srcGap: 0, gap: 0 },
    minion_attack: { max: 4, srcGap: 0.07, gap: 0.025 },
    minion_death: { max: 3, srcGap: 0.09, gap: 0.09 },
    turret: { max: 5, srcGap: 0.03, gap: 0.03 },
    monster: { max: 5, srcGap: 0.05, gap: 0.05 },
    coin: { max: 3, srcGap: 0.05, gap: 0.05 },
    cc: { max: 3, srcGap: 0.1, gap: 0.04 },
    cc_minor: { max: 2, srcGap: 0.25, gap: 0.12 },
    progress: { max: 1, srcGap: 0.35, gap: 0.35 },
    alarm: { max: 1, srcGap: 0, gap: 0 },
    skill: { max: 2, srcGap: 0.12, gap: 0.12 },
    minor: { max: 4, srcGap: 0.06, gap: 0.06 },
    ui: { max: 4, srcGap: 0.03, gap: 0.03 },
    recall: { max: 4, srcGap: 0, gap: 0 },
    ping: { max: 3, srcGap: 0.2, gap: 0.2 },
    passive: { max: 6, srcGap: 0.05, gap: 0.02 },
    heal: { max: 3, srcGap: 0.4, gap: 0.4 },
    zone: { max: 4, srcGap: 0, gap: 0 },
    ward: { max: 3, srcGap: 0.08, gap: 0.08 },
    buff: { max: 3, srcGap: 0.25, gap: 0.25 },
  },
  ka = { max: 99, srcGap: 0, gap: 0 },
  Aa = 48,
  ja = () => (typeof performance < `u` ? performance.now() : Date.now());
function Ma(e, t = typeof navigator < `u` ? navigator : null) {
  let n = (t && t.hardwareConcurrency) || 8,
    r = (t && t.deviceMemory) || 8,
    i = e === `high` ? 208 : e === `low` ? 64 : 96,
    a = e === `high` ? 56 : e === `low` ? 32 : 44;
  return (
    (n <= 4 || r <= 4) && ((i = Math.min(i, 72)), (a = Math.min(a, 36))),
    { sources: i, voices: a }
  );
}
var Na = class {
  constructor(e) {
    ((this.listener = e),
      (this.kit = null),
      (this.mix = null),
      (this.baker = null),
      (this.ac = null),
      (this.voices = []),
      (this.gapRing = new Map()),
      (this.frameBuildMs = 0),
      (this.frameCostMs = 0),
      (this.frameLiveBuilds = 0),
      (this.frameLiveNodes = 0),
      (this.frameExemptBuilds = 0),
      (this.frameExemptNodes = 0),
      (this.frameSelfBuilds = 0),
      (this.frameSelfNodes = 0),
      (this.coldStart = !1),
      (this.debugDrops = !1),
      (this.maxVoices = 44),
      (this.maxSources = 96),
      (this.quality = null),
      (this.dropReason = ``),
      (this.deferred = []),
      (this._deferNext = []),
      (this._deferPool = []),
      (this._victims = []),
      (this._spatial = { gain: 1, pan: 0, lp: 0, dist: 0, spatial: !1 }),
      (this._params = {
        team: 0,
        rel: `neutral`,
        crit: !1,
        amount: void 0,
        windup: void 0,
        subtype: void 0,
        count: void 0,
        element: void 0,
        self: !1,
        duration: void 0,
        power: void 0,
      }),
      (this._gcCountdown = 0),
      (this.stats = {
        started: !1,
        played: 0,
        baked: 0,
        culled: 0,
        dropped: 0,
        drops: { gap: 0, group: 0, budget: 0, cpu: 0 },
        stolen: 0,
        missing: 0,
        errors: 0,
        peakVoices: 0,
        peakSources: 0,
        overdraw: 0,
        deferred: 0,
        reissued: 0,
        lastError: ``,
        recent: [],
        recentDrops: [],
        byName: null,
      }));
  }
  attach({ ac: e, kit: t, mix: n, baker: r }) {
    ((this.ac = e), (this.kit = t), (this.mix = n), (this.baker = r));
  }
  setDeviceCaps(e) {
    if (e === this.quality) return;
    this.quality = e;
    let t = Ma(e);
    ((this.maxSources = t.sources), (this.maxVoices = t.voices));
  }
  beginFrame() {
    ((this.frameBuildMs = 0),
      (this.frameCostMs = 0),
      (this.frameLiveBuilds = 0),
      (this.frameLiveNodes = 0),
      (this.frameExemptBuilds = 0),
      (this.frameExemptNodes = 0),
      (this.frameSelfBuilds = 0),
      (this.frameSelfNodes = 0));
    let e = this.deferred;
    if (!e.length) return;
    ((this.deferred = this._deferNext), (this._deferNext = e));
    let t = this.ac ? this.ac.currentTime : 0;
    for (let n = 0; n < e.length; n++) {
      let r = e[n],
        i = r.o;
      (t - r.t > 0.08
        ? this._drop(`cpu`, r.name, r.prio)
        : (this.stats.reissued++,
          (i.t = Math.max(r.t, t + 0.005)),
          (i._deferred = (i._deferred || 0) + 1),
          this.play(r.name, i)),
        (r.o = null),
        this._deferPool.length < 32 && this._deferPool.push(r));
    }
    e.length = 0;
  }
  play(e, t = {}) {
    let n = Z[e];
    if (!n) return (this.stats.missing++, null);
    let r = this.ac.currentTime,
      i = Math.max(r + 0.004, Number.isFinite(t.t) ? t.t : r + 0.01),
      a = this.spatial(n, t.x, t.y, t.self);
    if (!a) return this._cull(e);
    let o = n.gain * (t.gain ?? 1) * a.gain;
    if (o < 0.003 && !t.path) return this._cull(e);
    let s = a.pan,
      c = a.lp,
      l = a.spatial ? w(a.dist / 30, 0, 1) * 0.22 : 0,
      u = (n.prio ?? 40) + (t.prioBoost || 0) - a.dist * 0.5,
      d = n.group ? Oa[n.group] || ka : null,
      f = !!(t.force || t.self || n.cat === `announcer` || n.cat === `ui`);
    if (d && !t.force && this._gapBlocked(n.group, d, t, i))
      return this._drop(`gap`, e, u);
    let p = this._params;
    ((p.team = t.team ?? 0),
      (p.rel = t.rel || `neutral`),
      (p.crit = !!t.crit),
      (p.amount = t.amount),
      (p.windup = t.windup),
      (p.subtype = t.subtype),
      (p.count = t.count),
      (p.element = t.element),
      (p.self = !!t.self),
      (p.duration = t.duration),
      (p.power = t.power));
    let m = this.baker.get(e, n, p);
    if (!m) {
      let r = this.baker.nodesOf(e, n),
        a = !!t.handle || n.cat === `announcer` || n.cat === `ui`,
        o = !a && !t.self && !t.force && !n.milestone && (n.prio ?? 40) < 80;
      if (
        !a &&
        (t.self
          ? this._selfBusy(r)
          : o
            ? this._frameBusy(r)
            : this._exemptBusy(r))
      )
        return this._defer(e, t, i);
      (t.self
        ? (this.frameSelfBuilds++, (this.frameSelfNodes += r))
        : !o && !a && (this.frameExemptBuilds++, (this.frameExemptNodes += r)),
        this.frameLiveBuilds++,
        (this.frameLiveNodes += r));
    }
    let h = m ? 1 : this.baker.sourcesOf(e, n),
      g = this._makeRoom(n.group, d, u, h, !!t.force, f, r);
    if (!g) return this._drop(this.dropReason, e, u);
    for (let e = 0; e < g.length; e++) this.steal(g[e], r);
    let _ = null;
    if (
      t.path &&
      ((_ = this.path(n, t.path, t.self, n.gain * (t.gain ?? 1))), !_)
    )
      return this._cull(e);
    let v,
      y = m ? 0 : ja(),
      b = we.syncMs;
    try {
      (m && (m.rate = 1 + (Math.random() * 2 - 1) * m.vary),
        (v = Ca(this.kit, this.mix, n, i, p, {
          gain: o,
          pan: s,
          lp: c,
          sendExtra: l,
          baked: m,
          path: _,
        })));
    } catch (e) {
      return (this.error(e), null);
    }
    if (!m) {
      let e = ja() - y;
      ((this.frameBuildMs += e - (we.syncMs - b)), (this.frameCostMs += e));
    }
    let x = {
      name: e,
      prio: u,
      group: n.group || null,
      cat: n.cat,
      src: t.src ?? null,
      start: i,
      end: Math.min(v.end, i + 12),
      vin: v.vin,
      gain: o,
      nodes: v.nodes,
      stop: v.stop,
      dead: !1,
      sources: Math.max(1, v.sources),
      stops: Ia(v.stops),
      act: 0,
      baked: v.baked,
    };
    (this.voices.push(x), n.group && this._gapPush(n.group, t, i));
    let S = this.stats;
    return (
      S.played++,
      v.baked && S.baked++,
      this.voices.length > S.peakVoices && (S.peakVoices = this.voices.length),
      S.recent.push(e),
      S.recent.length > Aa && S.recent.splice(0, S.recent.length - Aa),
      x
    );
  }
  _frameBusy(e) {
    return this.coldStart
      ? this.frameLiveBuilds >= 1
      : this.frameLiveBuilds >= 3 ||
          this.frameLiveNodes + e > 150 ||
          this.frameBuildMs > 4 ||
          this.frameCostMs > 10;
  }
  _selfBusy(e) {
    return this.frameSelfBuilds === 0
      ? !1
      : this.frameSelfBuilds >= 4 || this.frameSelfNodes + e > 260;
  }
  _exemptBusy(e) {
    return this.frameExemptBuilds === 0
      ? !1
      : this.coldStart
        ? !0
        : this.frameExemptBuilds >= 2 ||
          this.frameExemptNodes + e > 200 ||
          this.frameLiveNodes + e > 150 ||
          this._frameBusy(e);
  }
  _defer(e, t, n) {
    let r = this.deferred;
    if (r.length >= 32) {
      let n = 0;
      for (let e = 1; e < r.length; e++)
        (r[e].prio || 0) < (r[n].prio || 0) && (n = e);
      let i = (Z[e].prio ?? 40) + (t.prioBoost || 0);
      if ((r[n].prio || 0) >= i) return this._drop(`cpu`, e, i);
      let a = r[n];
      (r.splice(n, 1),
        (a.o = null),
        this._deferPool.push(a),
        this._drop(`cpu`, a.name, a.prio));
    }
    let i = this._deferPool.pop() || { name: ``, o: null, t: 0, prio: 0 };
    return (
      (i.name = e),
      (i.t = n),
      (i.prio = (Z[e].prio ?? 40) + (t.prioBoost || 0)),
      (i.o = Pa(t)),
      r.push(i),
      this.stats.deferred++,
      null
    );
  }
  cancelDeferred(e, t = null) {
    if (e == null) return;
    let n = this.deferred;
    for (let r = n.length - 1; r >= 0; r--) {
      let i = n[r];
      i.o.src !== e ||
        (t && i.name !== t) ||
        (n.splice(r, 1),
        (i.o = null),
        this._deferPool.length < 32 && this._deferPool.push(i));
    }
  }
  _cull(e) {
    return (
      this.stats.culled++,
      this.stats.byName && e && this._countByName(e, `range`),
      null
    );
  }
  _drop(e, t, n) {
    let r = this.stats;
    if ((r.dropped++, (r.drops[e] = (r.drops[e] || 0) + 1), t)) {
      let i = r.recentDrops;
      (i.push({
        name: t,
        reason: e,
        prio: Math.round(n ?? (Z[t] ? (Z[t].prio ?? 40) : 0)),
      }),
        i.length > 48 && i.splice(0, i.length - 48),
        r.byName && this._countByName(t, e));
    }
    return null;
  }
  setDropDebug(e) {
    ((this.debugDrops = !!e),
      (this.stats.byName = e ? this.stats.byName || {} : null));
  }
  _countByName(e, t) {
    let n = this.stats.byName,
      r = n[e] || (n[e] = { gap: 0, group: 0, budget: 0, cpu: 0, range: 0 });
    r[t] = (r[t] || 0) + 1;
  }
  error(e) {
    (this.stats.errors++,
      (this.stats.lastError = String((e && e.message) || e).slice(0, 200)));
  }
  spatial(e, t, n, r) {
    let i = this._spatial;
    if (
      ((i.gain = 1),
      (i.pan = 0),
      (i.lp = 0),
      (i.dist = 0),
      (i.spatial = !1),
      !(Number.isFinite(t) && Number.isFinite(n)) || e.cat !== `sfx`)
    )
      return i;
    let a = t - this.listener.x,
      o = (n - this.listener.y) * 1.15,
      s = Math.hypot(a, o),
      c = e.range || 30,
      l = e.inner ?? 7,
      u = s <= l ? 1 : s >= c ? 0 : (1 - (s - l) / (c - l)) ** 1.8;
    return (
      e.floor && s < c * 1.6 && (u = Math.max(u, e.floor)),
      u <= 0
        ? null
        : ((i.spatial = !0),
          (i.dist = s),
          (i.gain = u),
          (i.pan = w(a / 16, -1, 1) * 0.8 * (r ? 0.5 : 1)),
          s > l && (i.lp = 18e3 * 0.11 ** w((s - l) / (c - l), 0, 1)),
          i)
    );
  }
  path(e, t, n, r) {
    let i = [],
      a = 0;
    for (let o of t) {
      let t = this.spatial(e, o.x, o.y, n),
        s;
      ((s = t
        ? { dt: o.dt, gain: r * t.gain, pan: t.pan, lp: t.lp }
        : {
            dt: o.dt,
            gain: 0,
            pan: w((o.x - this.listener.x) / 16, -1, 1) * 0.8,
            lp: 2e3,
          }),
        (a = Math.max(a, s.gain)),
        i.push(s));
    }
    return a >= 0.003 ? i : null;
  }
  _gapBlocked(e, t, n, r) {
    return n.self || (n.prioBoost || 0) >= 12
      ? !1
      : t.srcGap > 0 &&
          n.src != null &&
          this._ringBlocked(e + `:` + n.src, t.srcGap, r)
        ? !0
        : t.gap > 0 && this._ringBlocked(e, t.gap, r);
  }
  _ringBlocked(e, t, n) {
    let r = this.gapRing.get(e);
    if (!r) return !1;
    for (let e = 0; e < r.n; e++) if (Math.abs(n - r.t[e]) < t) return !0;
    return !1;
  }
  _gapPush(e, t, n) {
    (this._ringPush(e, n), t.src != null && this._ringPush(e + `:` + t.src, n));
  }
  _ringPush(e, t) {
    let n = this.gapRing.get(e);
    (n ||
      ((n = { t: new Float64Array(4), n: 0, i: 0, last: 0 }),
      this.gapRing.set(e, n)),
      (n.t[n.i] = t),
      (n.i = (n.i + 1) & 3),
      n.n < 4 && n.n++,
      (n.last = Math.max(n.last, t)));
  }
  _makeRoom(e, t, n, r, i, a, o) {
    let s = this._victims;
    s.length = 0;
    let c = this.voices;
    if (t) {
      let r = 0,
        a = null;
      for (let t = 0; t < c.length; t++) {
        let n = c[t];
        n.dead ||
          n.group !== e ||
          n.end <= o ||
          (r++, (!a || La(n, a)) && (a = n));
      }
      if (r >= t.max) {
        if (a && (a.prio <= n || i)) s.push(a);
        else return ((this.dropReason = `group`), null);
      }
    }
    let l = 0,
      u = 0;
    for (let e = 0; e < c.length; e++) {
      let t = c[e];
      t.dead ||
        t.end <= o ||
        s.indexOf(t) >= 0 ||
        (l++, (t.act = Ra(t.stops, o)), (u += t.act));
    }
    let d = this.maxSources + (a ? 48 : 0);
    for (; l >= this.maxVoices || u + r > d; ) {
      let e = this._lowestLive(o, s);
      if (!e || (e.prio > n && !i)) {
        if (a) {
          this.stats.overdraw++;
          break;
        }
        return (
          (this.dropReason = l >= this.maxVoices ? `group` : `budget`),
          null
        );
      }
      (s.push(e), l--, (u -= e.act));
    }
    return (
      u + r > this.stats.peakSources && (this.stats.peakSources = u + r),
      s
    );
  }
  _lowestLive(e, t) {
    let n = null;
    for (let r of this.voices)
      r.dead ||
        r.end <= e ||
        t.indexOf(r) >= 0 ||
        (r.cat !== `announcer` &&
          r.cat !== `ui` &&
          (!n || La(r, n)) &&
          (n = r));
    return n;
  }
  steal(e, t, n = 0.012) {
    e.dead || (this.stats.stolen++, this._silence(e, t, n));
  }
  fadeOut(e, t, n = 0.08) {
    e && !e.dead && this._silence(e, t, Math.max(0.004, n / 4));
  }
  _silence(e, t, n) {
    e.dead = !0;
    let r = e.start > t + 0.003;
    try {
      let i = e.vin.gain;
      (i.cancelScheduledValues(t),
        r
          ? i.setValueAtTime(0, t)
          : (i.setValueAtTime(i.value, t), i.setTargetAtTime(0, t, n)));
    } catch {}
    let i = r ? t : t + n * 5;
    if (e.stop)
      try {
        e.stop(i);
      } catch {}
    e.end = Math.min(e.end, r ? t + 0.05 : t + n * 10);
  }
  duckTail(e, t, n = 0.5) {
    if (!(!e || e.dead || e.end <= t))
      try {
        P(e.vin.gain, e.gain * n, t, 0.06);
      } catch {}
  }
  sweep(e) {
    let t = this.voices;
    for (let n = t.length - 1; n >= 0; n--) {
      let r = t[n];
      e <= r.end + 0.2 || (Ta(r.nodes), (t[n] = t[t.length - 1]), t.pop());
    }
    if ((--this._gcCountdown, this._gcCountdown > 0)) return !1;
    this._gcCountdown = 60;
    for (let [t, n] of this.gapRing) n.last < e - 1 && this.gapRing.delete(t);
    return !0;
  }
  counts(e) {
    let t = 0,
      n = 0,
      r = 0;
    for (let i of this.voices)
      i.dead || i.end <= e || (t++, (n += Ra(i.stops, e)), i.baked && r++);
    return { live: t, sources: n, baked: r };
  }
  disposeAll() {
    for (let e of this.voices) Ta(e.nodes);
    ((this.voices.length = 0),
      (this.deferred.length = 0),
      (this._deferNext.length = 0));
  }
};
function Pa(e) {
  let t = {};
  for (let n in e) t[n] = e[n];
  return t;
}
var Fa = 0.12;
function Ia(e) {
  if (!e || e.length <= 2) return e;
  let t = [];
  for (let n = 0; n + 1 < e.length; n += 2)
    e[n + 1] - e[n] >= Fa && t.push(e[n], e[n + 1]);
  return t.length ? t : e.slice(0, 2);
}
function La(e, t) {
  return e.prio < t.prio || (e.prio === t.prio && e.start < t.start);
}
function Ra(e, t) {
  let n = 0;
  if (e) for (let r = 1; r < e.length; r += 2) e[r] > t && n++;
  return n;
}
var za = Object.freeze([]),
  Ba = 0.06,
  Va = 0.12,
  Ha = {
    stun: `cc_stun`,
    root: `cc_root`,
    slow: `cc_slow`,
    silence: `cc_silence`,
    knockup: `cc_knockup`,
    airborne: `cc_knockup`,
    knockback: `cc_knockback`,
    pull: `cc_pull`,
    knockaside: `cc_knockback`,
  },
  Ua = {
    pull: `_pull`,
    detonate: `_detonate`,
    empower: `_empower`,
    tether: `_tether`,
    reset: `_reset`,
    buff: `_buff`,
  },
  Wa = {
    verdant: `buff_verdant`,
    crimson: `buff_crimson`,
    storm_drake: `buff_drake`,
    tyrant: `buff_tyrant`,
    river_shrine: `buff_shrine`,
  },
  Ga = {
    last_hit: [`gold_coin`, 1, 0],
    kill: [`gold_kill`, 1, 0.08],
    assist: [`gold_coin`, 0.8, 0.06],
    turret: [`gold_coin`, 0.9, 0.06],
    ward: [`gold_coin`, 0.75, 0.04],
    objective: [`gold_objective`, 1, 0.1],
    inhibitor: [`gold_objective`, 0.9, 0.1],
  },
  Ka = {
    generic: `ping`,
    target: `ping_attack`,
    attack: `ping_attack`,
    enemy: `ping_attack`,
    danger: `ping_danger`,
    retreat: `ping_danger`,
    caution: `ping_danger`,
    omw: `ping_omw`,
    on_my_way: `ping_omw`,
    coming: `ping_omw`,
    missing: `ping_missing`,
    enemy_missing: `ping_missing`,
    mia: `ping_missing`,
    assist: `ping_assist`,
    help: `ping_assist`,
    vision: `ping_vision`,
    ward: `ping_vision`,
  };
function qa(e) {
  return (
    Ka[
      String(e || `generic`)
        .toLowerCase()
        .replace(/[\s-]+/g, `_`)
    ] || `ping`
  );
}
function Ja(e) {
  return Z[`monster_attack_` + e] ? `monster_attack_` + e : `monster_attack`;
}
function Ya(e) {
  return Z[`monster_death_` + e] ? `monster_death_` + e : `monster_death`;
}
var Xa = (e) => e === `storm_drake` || e === `abyssal_tyrant`,
  Za = {
    [c.ATTACK]: `onAttack`,
    [c.ATTACK_CANCEL]: `onAttackCancel`,
    [c.PROJECTILE]: `onProjectile`,
    [c.PROJECTILE_END]: `onProjectileEnd`,
    [c.HIT]: `onHit`,
    [c.CAST]: `onCast`,
    [c.FX]: `onFx`,
    [c.DASH]: `onDash`,
    [c.DEATH]: `onDeath`,
    [c.STRUCTURE_DESTROYED]: `onStructure`,
    [c.LEVEL_UP]: `onLevelUp`,
    [c.LEVEL_ABILITY]: `onLevelAbility`,
    [c.GOLD]: `onGold`,
    [c.RECALL_START]: `onRecallStart`,
    [c.RECALL_CANCEL]: `onRecallCancel`,
    [c.RECALL_END]: `onRecallEnd`,
    [c.RESPAWN]: `onRespawn`,
    [c.BUY]: `onBuy`,
    [c.SELL]: `onSell`,
    [c.CC]: `onCc`,
    [c.SHIELD]: `onShield`,
    [c.HEAL]: `onHeal`,
    [c.BUFF]: `onBuff`,
    [c.WARD]: `onWard`,
    [c.WARD_END]: `onWardEnd`,
    [c.SHRINE]: `onShrine`,
    [c.ANNOUNCE]: `onAnnounce`,
    [c.PING]: `onPing`,
    [c.SPAWN]: `onSpawn`,
  },
  Qa = class n {
    constructor(e) {
      ((this.sys = e),
        (this.listener = e.listener),
        (this._liveArr = null),
        (this._liveLen = 0),
        (this._early = []),
        (this._handledEarly = new WeakSet()),
        (this.recalls = new Map()),
        (this.lastCast = new Map()),
        (this.projFx = new Map()),
        (this.aggro = new Map()),
        (this.windupPool = []),
        (this._swingO = {
          t: 0,
          x: 0,
          y: 0,
          src: 0,
          team: 0,
          subtype: void 0,
          self: !1,
          prioBoost: 0,
        }),
        (this._fxO = {
          x: 0,
          y: 0,
          t: 0,
          team: 0,
          self: !1,
          src: 0,
          prioBoost: 0,
          element: void 0,
          duration: void 0,
          power: void 0,
          gain: 1,
          handle: !1,
        }),
        (this.loops = new Map()),
        (this.castHits = new Map()),
        (this.windups = new Map()),
        (this.pending = []),
        (this.abilityHits = 0),
        (this.minionsAnnounced = !1),
        (this.lastLevelUp = -9),
        (this.frame = null));
    }
    reset() {
      ((this._liveArr = null),
        (this._liveLen = 0),
        this.projFx.clear(),
        this.lastCast.clear(),
        this.aggro.clear(),
        this.castHits.clear(),
        this.windups.clear(),
        (this.pending.length = 0),
        (this.minionsAnnounced = !1));
    }
    collect(e, n, r) {
      let i = e.world;
      if (!i) return;
      let a = e.events || za,
        o = i.events,
        s = this._early;
      if (((s.length = 0), Array.isArray(o))) {
        let e;
        o === this._liveArr
          ? (e = this._liveLen)
          : (this._uncarriedTail(a, s), (e = $a(o, a)));
        for (let t = e; t < o.length; t++) s.push(o[t]);
        ((this._liveArr = o), (this._liveLen = o.length));
      } else ((this._liveArr = null), (this._liveLen = 0));
      if (!r) {
        s.length = 0;
        for (let e of this.pending) e.cancelled = !0;
        this.flushWindups(n);
        return;
      }
      ((this.frame = e), (this.abilityHits = 0));
      let c = this._handledEarly,
        l = a.length ? a[0].tick : 0;
      for (let e = 0; e < a.length; e++) {
        let r = a[e];
        if (c.has(r)) continue;
        let i = w(((r.tick ?? l) - l) * t, 0, 0.12);
        this.handle(r, n + 0.015 + i, n);
      }
      for (let e = 0; e < s.length; e++) {
        let t = s[e];
        t &&
          typeof t == `object` &&
          !c.has(t) &&
          (c.add(t), this.handle(t, n + 0.015, n));
      }
      ((s.length = 0), this.flushWindups(n));
    }
    _uncarriedTail(e, t) {
      let n = this._liveArr;
      if (!n || this._liveLen >= n.length) return;
      let r = n[this._liveLen];
      if (!(e[0] === r || e.indexOf(r) >= 0))
        for (let e = this._liveLen; e < n.length; e++) t.push(n[e]);
    }
    handle(e, t, n) {
      if (globalThis.__mtFxMute && globalThis.__mtFxMute(e)) return; // [MT-HOOK] mtFxMute — mt/render/fx.js synthesizes these (ability/monster-hit/monster level-up) sounds itself
      let r = Za[e.type];
      if (r)
        try {
          this[r](e, t, n, this.frame);
        } catch (e) {
          this.sys.error(e);
        }
    }
    near(e, t, n) {
      let r = e - this.listener.x,
        i = t - this.listener.y;
      return r * r + i * i < n * n;
    }
    audible(t, n, r, i) {
      if (!i) return !0;
      let a = i.viewerTeam ?? 0,
        o =
          typeof t == `object`
            ? t
            : t != null && i.world
              ? i.world.units.get(t)
              : null;
      if (o) {
        if (o.team === a) return !0;
        let t = o.kind;
        if (
          t === e.TOWER ||
          t === e.INHIBITOR ||
          t === e.NEXUS ||
          (t === e.MONSTER && Xa(o.subtype))
        )
          return !0;
        let n = o.visible;
        return !(n && n[a] === !1);
      }
      return t != null || this.audibleAt(n, r, a);
    }
    audibleAt(e, t, n) {
      let r = this.sys.vision;
      return (
        !r ||
        typeof r.visibilityAt != `function` ||
        !Number.isFinite(e) ||
        r.team !== n ||
        r.visibilityAt(e, t) >= 0.35
      );
    }
    heard(e, t, n, r, i) {
      return (
        Number.isFinite(t) && this.near(t, n, r) && this.audible(e, t, n, i)
      );
    }
    play(e, t) {
      return this.sys.play(e, t);
    }
    get rig() {
      return this.sys.rig;
    }
    onAttack(t, n, r, i) {
      let a = i.world.units.get(t.src);
      if (!a || !this.heard(a, a.x, a.y, 32, i)) return;
      let o = Number.isFinite(t.windup) ? t.windup : 0.25,
        s = a.id === i.playerId;
      if (a.kind === e.CHAMPION) {
        if (a.ranged) return;
        let e = Z[a.champion + `_swing`]
            ? a.champion + `_swing`
            : `swing_generic`,
          t = s ? 26 : 0;
        this._windup(
          a.id,
          e,
          n + o * 0.45,
          r,
          a.x,
          a.y,
          a.id,
          a.team,
          void 0,
          s,
          t,
        );
      } else if (a.kind === e.TOWER) {
        let e = t.tgt === i.playerId;
        (e &&
          (this.aggro.get(t.src) ?? -9) < r - 4 &&
          this.play(`turret_aggro`, {
            x: a.x,
            y: a.y,
            t: n,
            team: a.team,
            force: !0,
          }),
          e && this.aggro.set(t.src, r));
        let s = this.play(`turret_charge`, {
          x: a.x,
          y: a.y,
          t: n,
          team: a.team,
          windup: o,
          src: a.id,
          prioBoost: e ? 18 : 0,
          handle: !0,
        });
        s && this.windups.set(a.id, { voice: s, name: `turret_charge` });
      } else if (a.kind === e.MINION) {
        if (a.ranged) return;
        this._windup(
          a.id,
          `minion_melee_attack`,
          n + o * 0.6,
          r,
          a.x,
          a.y,
          a.id,
          a.team,
          void 0,
          !1,
          0,
        );
      } else if (a.kind === e.MONSTER) {
        if (a.ranged) return;
        let e = Ja(a.subtype);
        this._windup(
          a.id,
          e,
          n + o * 0.5,
          r,
          a.x,
          a.y,
          a.id,
          a.team ?? 2,
          a.subtype,
          !1,
          0,
        );
      }
    }
    _windup(e, t, n, r, i, a, o, s, c, l, u) {
      let d = this.windups.get(e);
      if ((d && d.pending && (d.cancelled = !0), n - r <= Ba)) {
        let r = this.play(t, this._swingOpts(n, i, a, o, s, c, l, u));
        if ((this._release(this.windups.get(e)), r)) {
          let n = this._entry();
          ((n.id = e),
            (n.name = t),
            (n.voice = r),
            (n.pending = !1),
            (n.cancelled = !1),
            this.windups.set(e, n));
        } else this.windups.delete(e);
        return;
      }
      let f = this._entry();
      (this._release(d),
        (f.id = e),
        (f.name = t),
        (f.at = n),
        (f.x = i),
        (f.y = a),
        (f.src = o),
        (f.team = s),
        (f.subtype = c),
        (f.self = l),
        (f.boost = u),
        (f.pending = !0),
        (f.cancelled = !1),
        (f.voice = null),
        this.windups.set(e, f),
        this.pending.push(f));
    }
    _entry() {
      return (
        this.windupPool.pop() || {
          id: 0,
          name: ``,
          at: 0,
          x: 0,
          y: 0,
          src: 0,
          team: 0,
          subtype: void 0,
          self: !1,
          boost: 0,
          pending: !0,
          cancelled: !1,
          voice: null,
        }
      );
    }
    _release(e) {
      e &&
        !e.pending &&
        ((e.voice = null),
        (e.subtype = void 0),
        this.windupPool.length < 48 && this.windupPool.push(e));
    }
    _swingOpts(e, t, n, r, i, a, o, s) {
      let c = this._swingO;
      return (
        (c.t = e),
        (c.x = t),
        (c.y = n),
        (c.src = r),
        (c.team = i),
        (c.subtype = a),
        (c.self = o),
        (c.prioBoost = s),
        c
      );
    }
    flushWindups(e) {
      let t = this.pending;
      for (let n = t.length - 1; n >= 0; n--) {
        let r = t[n];
        if (!r.cancelled && r.at - e > Ba) continue;
        if (
          ((t[n] = t[t.length - 1]),
          t.pop(),
          (r.pending = !1),
          r.cancelled || e - r.at > Va)
        ) {
          (this.windups.get(r.id) === r && this.windups.delete(r.id),
            this._release(r));
          continue;
        }
        let i = this.play(
          r.name,
          this._swingOpts(
            Math.max(r.at, e + 0.005),
            r.x,
            r.y,
            r.src,
            r.team,
            r.subtype,
            r.self,
            r.boost,
          ),
        );
        ((r.voice = i),
          !i &&
            this.windups.get(r.id) === r &&
            (this.windups.delete(r.id), this._release(r)));
      }
    }
    onAttackCancel(e, t, n) {
      this.sys.pool.cancelDeferred(e.src);
      let r = this.windups.get(e.src);
      if (!r) return;
      if ((this.windups.delete(e.src), r.pending)) {
        r.cancelled = !0;
        return;
      }
      let i = r.voice;
      (this._release(r),
        !(!i || i.dead || i.end <= n) &&
          (i.start > n + 0.003 ||
            n - i.start < 0.15 ||
            r.name === `turret_charge`) &&
          this.sys.pool.fadeOut(i, n, 0.05));
    }
    onProjectile(t, n, r, i) {
      let a = String(t.fx || ``);
      Z[a + `_end`] && this.projFx.set(t.id, a + `|` + t.src);
      let o = i.world.units.get(t.src);
      if (!this.near(t.x, t.y, 32) || !this.audible(o || t.src, t.x, t.y, i))
        return;
      let s = o ? o.team : 0,
        c = i.playerId;
      if (a === `tower_attack`)
        this.play(`turret_shot`, {
          x: t.x,
          y: t.y,
          t: n,
          team: s,
          src: t.src,
          prioBoost: t.targetId === c ? 18 : 0,
        });
      else if (a.startsWith(`minion_siege`))
        this.play(`minion_siege_shot`, {
          x: t.x,
          y: t.y,
          t: n,
          team: s,
          src: t.src,
        });
      else if (a.startsWith(`minion_`))
        this.play(`minion_caster_shot`, {
          x: t.x,
          y: t.y,
          t: n,
          team: s,
          src: t.src,
        });
      else if (o && o.kind === e.MONSTER && a.endsWith(`_attack`)) {
        let e = Xa(o.subtype) ? `epic_monster_attack` : Ja(o.subtype);
        this.play(e, {
          x: t.x,
          y: t.y,
          t: n,
          subtype: o.subtype,
          src: t.src,
          prioBoost: t.targetId === c ? 10 : 0,
        });
      } else if (a.endsWith(`_attack`) && o && o.kind === e.CHAMPION) {
        let e = t.src === c,
          r = Z[a] ? a : `shot_generic`;
        this.play(r, {
          x: t.x,
          y: t.y,
          t: n,
          team: s,
          self: e,
          src: t.src,
          prioBoost: e ? 26 : 0,
        });
      }
    }
    onProjectileEnd(e, t, n, r) {
      let i = this.projFx.get(e.id);
      if (i === void 0 || (this.projFx.delete(e.id), e.hit || !r)) return;
      let a = i.indexOf(`|`),
        o = i.slice(0, a),
        s = Number(i.slice(a + 1)),
        c = r.world.units.get(s),
        l = s === r.playerId;
      (l || this.heard(c || s, e.x, e.y, 30, r)) &&
        this.play(o + `_end`, {
          x: e.x,
          y: e.y,
          t,
          team: c ? c.team : 2,
          self: l,
          src: s,
          prioBoost: l ? 14 : 0,
        });
    }
    onHit(t, n, r, i) {
      let a = i.world.units,
        o = a.get(t.tgt),
        s = a.get(t.src);
      if (
        (this.sys.combat.onHit(
          s,
          o,
          t.amount,
          t.x,
          t.y,
          this.listener,
          this.rig,
        ),
        !Number.isFinite(t.x) ||
          !this.near(t.x, t.y, 31) ||
          (!this.audible(s || t.src, t.x, t.y, i) &&
            !this.audible(o || t.tgt, t.x, t.y, i)))
      )
        return;
      let c = i.playerId,
        l = t.src === c || t.tgt === c,
        u = !!s && s.kind === e.CHAMPION,
        d = !!o && o.kind === e.CHAMPION,
        f = {
          x: t.x,
          y: t.y,
          t: n,
          amount: t.amount,
          crit: !!t.crit,
          self: l,
          team: s ? s.team : 2,
          src: t.src,
          prioBoost: l ? 12 : 0,
        };
      if (t.source === `tower`)
        ((f.prioBoost = t.tgt === c ? 25 : 0),
          this.play(
            t.fx === `fountain_laser` ? `fountain_laser` : `turret_hit`,
            f,
          ));
      else if (t.source === `dot`) (d || l) && this.play(`ignite_tick`, f);
      else if (t.source === `attack`) {
        if (u) {
          t.src === c && (f.prioBoost = 26);
          let e = s.champion + `_impact`;
          Z[e]
            ? this.play(e, f)
            : (this.play(
                `impact_` + (t.dmgType === `magic` ? `magic` : `physical`),
                f,
              ),
              t.crit && this.play(`impact_crit`, f));
        } else
          s && s.kind === e.MONSTER
            ? ((f.gain = 0.8), this.play(`impact_physical`, f))
            : (d || (s && s.ranged && this.near(t.x, t.y, 12))) &&
              this.play(`hit_minor`, f);
      } else if (!(t.fx && Z[t.fx + `_impact`])) {
        let n = t.crit
          ? `impact_crit`
          : t.dmgType === `magic`
            ? `impact_magic`
            : t.dmgType === `true`
              ? `impact_true`
              : `impact_physical`;
        (d || (o && o.kind === e.MONSTER) || this.abilityHits++ < 3) &&
          ((f.gain = d ? 1 : 0.7), this.play(n, f));
      }
    }
    onCast(e, t, n, r) {
      let i = e.src === r.playerId,
        a = r.world.units.get(e.src),
        o = a ? a.team : 0;
      if (
        (this.lastCast.set(e.src, n),
        !Number.isFinite(e.x) ||
          (!i && !this.heard(a || e.src, e.x, e.y, 34, r)))
      )
        return;
      if (e.spell) {
        let n = Z[`spell_` + e.spell] ? `spell_` + e.spell : `cast_light`;
        this.play(n, {
          x: e.x,
          y: e.y,
          t,
          team: o,
          self: i,
          src: e.src,
          prioBoost: i ? 16 : 0,
        });
        return;
      }
      let s = ai(e.champion, e.slot, e.fx, e.element);
      this.play(s, {
        x: e.x,
        y: e.y,
        t,
        team: o,
        self: i,
        src: e.src,
        prioBoost: i ? 18 : 0,
        element: e.element,
      });
      let c = Number.isFinite(e.tx) ? e.tx : e.x,
        l = Number.isFinite(e.ty) ? e.ty : e.y;
      this.sys.combat.onCast(a, e.slot, c, l, r.world, this.listener, this.rig);
    }
    onFx(e, t, n, r) {
      if (e.fx)
        switch (e.kind) {
          case `aoe_burst`:
          case `line_burst`:
            this._fxBurst(e, t, r);
            return;
          case `zone`:
            this._fxZone(e, t, n, r);
            return;
          case `zone_tick`:
            this._fxPlay(e, t, r, e.fx + `_tick`, { fallback: `zone_tick` });
            return;
          case `zone_end`:
            (this._fxZoneEnd(e, n), this._fxPlay(e, t, r, e.fx + `_burst`));
            return;
          case `wave`:
            this._fxWave(e, t, r);
            return;
          case `impact`:
          case `target`:
            this._fxImpact(e, t, r);
            return;
          case `mark`:
            (e.src === r.playerId || e.tgt === r.playerId) &&
              this._fxPlay(e, t, r, e.fx + `_mark`);
            return;
          case `buff_end`:
            this._fxPlay(
              e,
              t,
              r,
              e.fx + (e.reason === `broken` ? `_break` : `_end`),
            );
            return;
          case `dash_end`:
            e.tgt >= 0 || this._fxPlay(e, t, r, e.fx + `_land`);
            return;
          case `cancel`:
            (e.src === r.playerId || this.near(e.x, e.y, 12)) &&
              this._fxPlay(e, t, r, `cast_cancel`);
            return;
          default: {
            let n = Ua[e.kind];
            n && this._fxPlay(e, t, r, e.fx + n);
          }
        }
    }
    static slotBoost(e) {
      return e.slot === `R` ? 20 : e.slot ? 8 : 0;
    }
    _fxOpts(e, t, n, r, i, a) {
      let o = this._fxO;
      return (
        (o.x = e),
        (o.y = t),
        (o.t = n),
        (o.team = r.team ?? 0),
        (o.self = i),
        (o.src = r.src),
        (o.prioBoost = a),
        (o.element = r.element),
        (o.duration = r.duration),
        (o.power = r.power),
        (o.gain = 1),
        (o.handle = !1),
        o
      );
    }
    _fxPlay(
      e,
      t,
      r,
      i,
      { fallback: a = null, x: o = e.x, y: s = e.y, handle: c = !1 } = {},
    ) {
      if (!Z[i]) {
        if (!a || !Z[a]) return null;
        i = a;
      }
      let l = e.src === r.playerId || e.tgt === r.playerId;
      if (
        !Number.isFinite(o) ||
        (!l && !this.near(o, s, 34)) ||
        (!l && !this._fxVisible(e, o, s, r))
      )
        return null;
      let u = this._fxOpts(o, s, t, e, l, (l ? 14 : 0) + n.slotBoost(e));
      return ((u.handle = c), this.play(i, u));
    }
    _fxVisible(e, t, n, r) {
      return e.tgt != null && e.tgt >= 0 && this.audible(e.tgt, t, n, r)
        ? !0
        : e.src != null && e.src >= 0
          ? this.audible(e.src, t, n, r)
          : this.audibleAt(t, n, r.viewerTeam ?? 0);
    }
    _fxBurst(e, t, r) {
      let i = e.x,
        a = e.y;
      if (e.kind === `line_burst` && Number.isFinite(e.tx)) {
        let t = no(this.listener.x, this.listener.y, e.x, e.y, e.tx, e.ty);
        ((i = t.x), (a = t.y));
      }
      if (!Number.isFinite(i)) return;
      let o = e.src === r.playerId;
      (o || this._fxVisible(e, i, a, r)) &&
        this.play(
          oi(e.fx, e.element),
          this._fxOpts(i, a, t, e, o, (o ? 15 : 0) + n.slotBoost(e)),
        );
    }
    _fxImpact(t, n, r) {
      let i = t.fx + (t.kind === `target` ? `_target` : `_impact`);
      if (!Z[i]) return;
      let a = r.world.units.get(t.tgt),
        o = !!a && a.kind === e.CHAMPION,
        s = (t.cast || 0) === 0 ? t.fx + `:` + t.src : t.cast,
        c = this.castHits.get(s);
      ((!c || c.t < n - 0.6) && ((c = { n: 0, t: n }), this.castHits.set(s, c)),
        !(!o && c.n >= 3) && (c.n++, (c.t = n), this._fxPlay(t, n, r, i)));
    }
    _fxZone(e, t, n, r) {
      let i = e.fx + `_zone`;
      if (!Z[i]) return;
      let a = e.src + `:` + (e.cast || 0),
        o = this.loops.get(a);
      o && this.sys.pool.fadeOut(o.voice, n, 0.3);
      let s = this._fxPlay(e, t, r, i, { handle: !0 });
      s && this.loops.set(a, { voice: s, until: n + (e.duration || 3) + 2 });
    }
    _fxZoneEnd(e, t) {
      let n = e.src + `:` + (e.cast || 0),
        r = this.loops.get(n);
      r && (this.loops.delete(n), this.sys.pool.fadeOut(r.voice, t, 0.4));
    }
    _fxWave(e, t, r) {
      if (![e.x, e.y, e.tx, e.ty].every(Number.isFinite)) return;
      let i = Z[e.fx + `_wave`] ? e.fx + `_wave` : `wave_generic`;
      if (!Z[i]) return;
      let a = w(Number(e.duration) || 0.8, 0.1, 3),
        o = e.src === r.playerId;
      if (!o && !this._fxVisible(e, e.x, e.y, r)) return;
      let s = [];
      for (let t = 0; t <= 8; t++) {
        let n = t / 8;
        s.push({
          dt: a * n,
          x: e.x + (e.tx - e.x) * n,
          y: e.y + (e.ty - e.y) * n,
        });
      }
      let c = no(this.listener.x, this.listener.y, e.x, e.y, e.tx, e.ty),
        l = e.team ?? 0,
        u = (o ? 15 : 0) + n.slotBoost(e);
      (this.play(i, {
        x: c.x,
        y: c.y,
        t,
        team: l,
        self: o,
        src: e.src,
        prioBoost: u,
        duration: a,
        element: e.element,
        path: s,
      }),
        Z[e.fx + `_burst`] &&
          this.play(e.fx + `_burst`, {
            x: e.tx,
            y: e.ty,
            t: t + a * 0.9,
            team: l,
            self: o,
            src: e.src,
            prioBoost: u,
          }));
    }
    onDash(e, t, n, r) {
      n - (this.lastCast.get(e.src) ?? -9) <= 0.25 ||
        !Number.isFinite(e.x) ||
        e.forced ||
        (this.audible(e.src, e.x, e.y, r) &&
          this.play(`dash_generic`, { x: e.x, y: e.y, t, src: e.src }));
    }
    onDeath(t, n, r, i) {
      if (!Number.isFinite(t.x)) return;
      let a = i.playerId;
      if (
        t.id === a ||
        t.team === (i.viewerTeam ?? 0) ||
        this.audible(t.id, t.x, t.y, i)
      ) {
        if (t.kind === e.MINION)
          this.play(`minion_death`, {
            x: t.x,
            y: t.y,
            t: n,
            team: t.team,
            subtype: t.subtype,
          });
        else if (t.kind === e.MONSTER) {
          let e = Xa(t.subtype),
            r = e ? `epic_death` : Ya(t.subtype);
          (this.play(r, {
            x: t.x,
            y: t.y,
            t: n,
            subtype: t.subtype,
            prioBoost: t.killer === a ? 12 : 0,
          }),
            e && this.sys.combat.onBigEvent(t.x, t.y, this.listener));
        } else
          t.kind === e.CHAMPION &&
            (t.id === a
              ? (this.play(`player_death`, { t: n, force: !0 }),
                this.sys.mix.duck(`music`, 0.3, 2.4, 0.05, 1.6),
                this.sys.mix.duck(`sfx`, 0.75, 0.9, 0.03, 0.8))
              : this.play(`champion_death`, {
                  x: t.x,
                  y: t.y,
                  t: n,
                  src: t.id,
                  prioBoost: t.killer === a ? 22 : 0,
                }),
            this.sys.combat.onChampionDeath(t.x, t.y, this.listener, this.rig));
      }
    }
    onStructure(t, n, r, i) {
      let a = i.world.units.get(t.id),
        o = a ? a.x : this.listener.x,
        s = a ? a.y : this.listener.y;
      (t.kind === e.NEXUS
        ? (this.play(`nexus_explosion`, { t: n, team: t.team, force: !0 }),
          this.sys.mix.duck(`music`, 0.12, 1.3, 0.1, 0.45),
          this.sys.mix.duck(`amb`, 0.3, 3, 0.1, 2))
        : this.play(
            t.kind === e.INHIBITOR ? `inhibitor_destroyed` : `turret_destroyed`,
            { x: o, y: s, t: n, team: t.team },
          ),
        this.sys.combat.onBigEvent(o, s, this.listener));
    }
    onLevelUp(t, n, r, i) {
      if (t.id === i.playerId) {
        (this.play(`level_up`, { t: n, self: !0 }), (this.lastLevelUp = n));
        return;
      }
      let a = i.world.units.get(t.id);
      a &&
        a.kind === e.CHAMPION &&
        this.heard(a, a.x, a.y, 12, i) &&
        this.play(`level_up_other`, { x: a.x, y: a.y, t: n, src: a.id });
    }
    onLevelAbility(e, t, n, r) {
      e.id === r.playerId &&
        this.play(`skill_up`, {
          t: Math.max(t, this.lastLevelUp + 0.32),
          self: !0,
        });
    }
    onGold(e, t, n, r) {
      if (e.id !== r.playerId) return;
      let i = Ga[e.reason];
      i && this.play(i[0], { t: t + i[2], gain: i[1], self: !0 });
    }
    onRecallStart(e, t, n, r) {
      let i = r.world.units.get(e.id);
      if (!i) return;
      let a = e.id === r.playerId;
      if (!a && !this.heard(i, i.x, i.y, 28, r)) return;
      this._stopRecall(e.id, n);
      let o = this.play(`recall_channel`, {
        x: i.x,
        y: i.y,
        t,
        self: a,
        src: i.id,
        prioBoost: a ? 30 : 0,
        force: a,
        handle: !0,
      });
      o && this.recalls.set(e.id, { voice: o, x: i.x, y: i.y });
    }
    onRecallCancel(e, t, n) {
      let r = this._stopRecall(e.id, n);
      r && this.play(`recall_cancel`, { x: r.x, y: r.y, t });
    }
    onRecallEnd(e, t, n, r) {
      let i = this._stopRecall(e.id, n),
        a = e.id === r.playerId;
      i
        ? this.play(`recall_teleport`, { x: i.x, y: i.y, t, self: a, force: a })
        : a && this.play(`recall_teleport`, { t, self: !0 });
    }
    _stopRecall(e, t) {
      let n = this.recalls.get(e);
      if (!n) return null;
      this.recalls.delete(e);
      let r = n.voice;
      if (!r.dead) {
        if (((r.dead = !0), r.stop))
          try {
            r.stop(t);
          } catch {}
        r.end = Math.min(r.end, t + 0.6);
      }
      return n;
    }
    stopAllRecalls(e) {
      for (let t of [...this.recalls.keys()]) this._stopRecall(t, e);
      this.recalls.clear();
    }
    onRespawn(t, n, r, i) {
      let a = i.world.units.get(t.id);
      a &&
        (a.kind === e.CHAMPION
          ? t.id === i.playerId &&
            this.play(`player_respawn`, { t: n, force: !0 })
          : a.kind === e.INHIBITOR &&
            this.play(`inhibitor_respawn`, { x: a.x, y: a.y, t: n }));
    }
    onBuy(e, t, n, r) {
      e.id === r.playerId && this.play(`buy`, { t, self: !0 });
    }
    onSell(e, t, n, r) {
      e.id === r.playerId && this.play(`sell`, { t, self: !0 });
    }
    onCc(t, n, r, i) {
      let a = i.world.units.get(t.tgt),
        o = Ha[t.cc];
      if (!a || !o || a.kind === e.MINION) return;
      let s = t.tgt === i.playerId;
      (s || this.heard(a, a.x, a.y, 30, i)) &&
        this.play(o, {
          x: a.x,
          y: a.y,
          t: n + 0.04,
          src: t.src >= 0 ? t.src : a.id,
          prioBoost: s ? 20 : 0,
          power: t.power,
          duration: t.duration,
        });
    }
    onShield(e, t, n, r) {
      let i = r.playerId;
      e.tgt !== i ||
        (e.amount || 0) <= 60 ||
        n - (this.lastCast.get(i) ?? -9) <= 0.3 ||
        this.play(`shield_up`, { t, self: !0 });
    }
    onHeal(t, n, r, i) {
      let a = i.world.units.get(t.tgt);
      if (!a || a.kind !== e.CHAMPION || !Number.isFinite(t.x)) return;
      let o = t.tgt === i.playerId;
      (o || (a.team === i.viewerTeam && this.near(t.x, t.y, 14))) &&
        ((t.amount || 0) < 12 ||
          r - (this.lastCast.get(t.src) ?? -9) < 0.35 ||
          this.play(`heal_tick`, {
            x: t.x,
            y: t.y,
            t: n,
            self: o,
            src: t.tgt,
            amount: t.amount,
            prioBoost: o ? 12 : 0,
          }));
    }
    onBuff(e, t, n, r) {
      let i = Wa[e.buff];
      if (!i) return;
      let a = r.world.units.get(e.tgt);
      if (!a) return;
      let o = e.tgt === r.playerId;
      (o ||
        (e.buff !== `river_shrine` &&
          a.team === r.viewerTeam &&
          this.near(a.x, a.y, 14))) &&
        this.play(i, {
          x: a.x,
          y: a.y,
          t,
          self: o,
          team: a.team,
          src: a.id,
          gain: o ? 1 : 0.7,
          prioBoost: o ? 20 : 0,
        });
    }
    onWard(e, t, n, r) {
      let i = e.src === r.playerId;
      (i || (e.team === r.viewerTeam && this.near(e.x, e.y, 26))) &&
        this.play(`ward_place`, {
          x: e.x,
          y: e.y,
          t,
          team: e.team,
          self: i,
          src: e.src,
          prioBoost: i ? 20 : 0,
        });
    }
    onWardEnd(e, t, n, r) {
      if (Number.isFinite(e.x)) {
        if (e.reason === `destroyed`) {
          let n = e.killer === r.playerId;
          if (!n && !this.near(e.x, e.y, 26)) return;
          this.play(`ward_kill`, {
            x: e.x,
            y: e.y,
            t,
            team: e.team,
            self: n,
            prioBoost: n ? 20 : 0,
          });
        } else
          e.reason === `expired` &&
            e.team === r.viewerTeam &&
            this.near(e.x, e.y, 16) &&
            this.play(`ward_expire`, { x: e.x, y: e.y, t, team: e.team });
      }
    }
    onShrine(e, t, n, r) {
      Number.isFinite(e.x) &&
        this.near(e.x, e.y, 32) &&
        this.play(`shrine_spawn`, {
          x: e.x,
          y: e.y,
          t,
          team: e.team,
          rel: e.team === r.viewerTeam ? `ally` : `enemy`,
        });
    }
    onAnnounce(e, t, n, r) {
      if (e.key === `victory` && r.world && r.world.winner != null) return;
      if (e.key === `minions_spawn`) {
        if (this.minionsAnnounced) return;
        this.minionsAnnounced = !0;
      }
      let i = to(e, r.playerId, r.viewerTeam, r.world),
        a = e.key === `multikill` ? Oi(e.text) : 0,
        o = e.key === `kill` ? eo(e) : e.key;
      this.sys.announce(
        Di(o),
        { t, rel: i, count: a },
        { key: o, actor: e.actor, count: a, rel: i },
        n,
      );
    }
    onSpawn(t, n, r, i) {
      if (t.kind !== e.MINION || this.minionsAnnounced) return;
      this.minionsAnnounced = !0;
      let a = i.world;
      a &&
        (a.waveNo ?? 1) <= 1 &&
        a.time > 0.5 &&
        this.sys.announce(
          `stinger_minions_spawn`,
          { t: n, rel: `neutral` },
          { key: `minions_spawn` },
          r,
        );
    }
    onPing(e, t, n, r) {
      if (e.team !== r.viewerTeam) return;
      let i = e.src === r.playerId;
      this.play(qa(e.kind), { t, self: i, src: e.src });
    }
    gc(e) {
      for (let [t, n] of this.loops) n.until < e && this.loops.delete(t);
      for (let [t, n] of this.castHits) n.t < e - 2 && this.castHits.delete(t);
      for (let [t, n] of this.lastCast) n < e - 30 && this.lastCast.delete(t);
      for (let [t, n] of this.aggro) n < e - 30 && this.aggro.delete(t);
      for (let [t, n] of this.windups)
        (n.pending
          ? n.cancelled
          : !n.voice || n.voice.dead || n.voice.end < e) &&
          (this.windups.delete(t), this._release(n));
      this.projFx.size > 64 && this.projFx.clear();
    }
    sizes() {
      return {
        loops: this.loops.size,
        castHits: this.castHits.size,
        projFx: this.projFx.size,
        recalls: this.recalls.size,
        windups: this.windups.size,
        pending: this.pending.length,
        lastCast: this.lastCast.size,
        aggro: this.aggro.size,
        deferred: this.sys.pool.deferred.length,
      };
    }
  };
function $a(e, t) {
  if (!e.length || !t.length) return 0;
  let n = t.lastIndexOf(e[0]);
  return n < 0 ? 0 : Math.min(e.length, t.length - n);
}
function eo(e) {
  if (e.shutdown) return `shutdown`;
  let t = String(e.text || ``).toLowerCase();
  return t.includes(`legendary`)
    ? `legendary`
    : t.includes(`rampage`)
      ? `rampage`
      : t.includes(`spree`)
        ? `spree`
        : `kill`;
}
function to(e, t, n, r) {
  if (e.victim != null && e.victim === t) return `slain`;
  if (e.actor != null && e.actor === t) return `self`;
  if (e.key === `executed`) {
    let t = r && r.units ? r.units.get(e.victim) : null;
    return t ? (t.team === n ? `enemy` : `ally`) : `neutral`;
  }
  return e.team === 2 || e.team == null
    ? `neutral`
    : e.team === n
      ? `ally`
      : `enemy`;
}
function no(e, t, n, r, i, a) {
  let o = i - n,
    s = a - r,
    c = o * o + s * s,
    l = c > 0 ? w(((e - n) * o + (t - r) * s) / c, 0, 1) : 0;
  return { x: n + o * l, y: r + s * l };
}
var ro = 0.8,
  io = 0.06,
  ao = 0.07,
  oo = 0.25,
  so = 1.2,
  co = 2,
  lo = {
    ace: 100,
    victory: 97,
    first_blood: 95,
    drake_slain: 92,
    tyrant_slain: 92,
    inhibitor: 90,
    first_turret: 78,
    match_start: 76,
    drake_spawn: 74,
    tyrant_spawn: 74,
    legendary: 74,
    shutdown: 72,
    rampage: 71,
    turret: 70,
    spree: 68,
    kill: 64,
    inhibitor_respawn: 60,
    executed: 55,
    minions_spawn: 50,
    generic: 45,
  },
  uo = [0, 0, 80, 84, 88, 98],
  fo = new Set([
    `ace`,
    `victory`,
    `first_blood`,
    `drake_slain`,
    `tyrant_slain`,
    `inhibitor`,
  ]),
  po = {
    ace: 0.9,
    victory: 1,
    first_blood: 0.8,
    drake_slain: 0.8,
    tyrant_slain: 0.8,
    inhibitor: 0.9,
    first_turret: 0.8,
    match_start: 1.1,
    drake_spawn: 0.9,
    tyrant_spawn: 0.9,
    turret: 0.75,
    kill: 0.6,
    inhibitor_respawn: 0.8,
    executed: 0.55,
    shutdown: 0.65,
    spree: 0.65,
    rampage: 0.65,
    legendary: 0.65,
    minions_spawn: 0.8,
    generic: 0.5,
  },
  mo = new Set([
    `kill`,
    `multikill`,
    `shutdown`,
    `spree`,
    `rampage`,
    `legendary`,
  ]),
  ho = (e) => (e.key === `multikill` ? e.count : 1);
function go(e, t = 2, n = `neutral`) {
  let r = e === `multikill` ? uo[w(t || 2, 2, 5)] : (lo[e] ?? lo.generic);
  return ((n === `self` || n === `slain`) && (r += 6), r);
}
function _o(e, t = 2) {
  return fo.has(e) || (e === `multikill` && t >= 5);
}
function vo(e) {
  return e.key === `multikill`
    ? 0.13 * (w(e.count || 2, 2, 5) - 1) + 0.15
    : (po[e.key] ?? po.generic);
}
function yo(e, t) {
  return e.prio + 40 * w((t - e.t) / ro, 0, 1);
}
var bo = class {
    constructor(e) {
      ((this.sys = e),
        (this.queue = []),
        (this.current = null),
        (this.history = []),
        (this.stats = {
          queued: 0,
          played: 0,
          dropped: 0,
          collapsed: 0,
          lostProtected: 0,
          superseded: 0,
          cut: 0,
          layered: 0,
          maxLateMs: 0,
        }),
        (this._seq = 0));
    }
    enqueue(e, t, n, r) {
      let i = n.key || `generic`,
        a = n.count || 0,
        o = n.rel || t.rel || `neutral`,
        s = {
          name: e,
          key: i,
          count: a,
          rel: o,
          actor: n.actor ?? null,
          o: { ...t, rel: o },
          t: Math.max(r, t.t ?? r),
          prio: go(i, a, o),
          protect: _o(i, a),
          seq: this._seq++,
          cutCurrent: !1,
          eff: 0,
          layered: !1,
        };
      return (
        this.stats.queued++,
        mo.has(i) && s.actor != null && this._supersede(s, r),
        this.queue.push(s),
        this.pump(r),
        s
      );
    }
    _supersede(e, t) {
      let n = ho(e);
      for (let t = this.queue.length - 1; t >= 0; t--) {
        let r = this.queue[t];
        r.actor === e.actor &&
          mo.has(r.key) &&
          (ho(r) >= n || (this.queue.splice(t, 1), this.stats.superseded++));
      }
      let r = this.current;
      if (!r || r.voice == null || r.voice.dead) return;
      let i = r.entry,
        a = ho(i);
      mo.has(i.key) &&
        i.actor === e.actor &&
        a < n &&
        t - r.start < so &&
        r.free > e.t + 0.05 &&
        (e.cutCurrent = !0);
    }
    pump(e) {
      let t = this.queue;
      if (!t.length) return;
      for (let n = 0; n < t.length; n++) t[n].eff = yo(t[n], e);
      t.sort((e, t) => t.eff - e.eff || e.t - t.t || e.seq - t.seq);
      let n = 0;
      for (; t.length && n++ < 16; ) {
        let n = t[0],
          r = this.current,
          i = r && r.voice && !r.voice.dead ? r.free : 0,
          a = Math.max(e + 0.01, n.t, i),
          o = a - n.t,
          s =
            r &&
            r.voice &&
            !r.voice.dead &&
            r.start <= e &&
            r.entry.prio < n.prio &&
            !r.entry.protect,
          c = !1;
        if (n.cutCurrent && r && r.voice && !r.voice.dead)
          ((c = !0), (a = Math.max(e + 0.01, n.t)));
        else if (o > oo && n.protect && s)
          ((c = !0), (a = Math.max(e + 0.01, n.t)));
        else if (o > 0.8) {
          if (s && e - r.start > 0.2) ((c = !0), (a = Math.max(e + 0.01, n.t)));
          else if (n.protect && e + 0.01 <= n.t + 0.8)
            ((a = n.t + ro), (n.layered = !0));
          else {
            this._collapse(t, 0);
            continue;
          }
        }
        if (a - n.t > 0.8000010000000001) {
          this._collapse(t, 0);
          continue;
        }
        if (a > e + io) break;
        (t.shift(), c && this._cut(e), this._start(n, a, e));
      }
      this._dropHopeless(e);
    }
    _collapse(e, t) {
      let n = e[t];
      return (
        e.splice(t, 1),
        this.stats.dropped++,
        this.stats.collapsed++,
        n.protect && this.stats.lostProtected++,
        n
      );
    }
    _dropHopeless(e) {
      let t = this.queue;
      if (t.length < 2) return;
      let n = this.current,
        r = Math.max(e + 0.01, n && n.voice && !n.voice.dead ? n.free : 0);
      for (let e = 0; e < t.length; e++) {
        let n = t[e],
          i = Math.max(r, n.t);
        if (!n.protect && i - n.t > 0.8 && e > 0) {
          (t.splice(e, 1), this.stats.dropped++, e--);
          continue;
        }
        r = Math.min(i, n.t + ro) + vo(n);
      }
      this._capProtected(e);
    }
    _capProtected(e) {
      let t = this.queue,
        n = 0;
      for (let e = 0; e < t.length; e++) t[e].protect && n++;
      for (; n > co; ) {
        let r = -1;
        for (let n = 1; n < t.length; n++) {
          let i = t[n];
          if (!i.protect) continue;
          let a = yo(i, e),
            o = r < 0 ? 0 : yo(t[r], e);
          (r < 0 || a < o || (a === o && i.seq > t[r].seq)) && (r = n);
        }
        if (r < 0) return;
        (this._collapse(t, r), n--);
      }
    }
    _cut(e) {
      let t = this.current;
      t &&
        t.voice &&
        !t.voice.dead &&
        (this.sys.pool.fadeOut(t.voice, e, ao), (t.free = e), this.stats.cut++);
    }
    _start(e, t, n) {
      let r = this.current,
        i = this.sys.play(e.name, { ...e.o, t, force: !0 }),
        a = Math.round((t - e.t) * 1e3);
      if (
        ((this.stats.maxLateMs = Math.max(this.stats.maxLateMs, a)),
        this.history.push({
          name: e.name,
          key: e.key,
          count: e.count,
          prio: e.prio,
          lateMs: a,
          ok: !!i,
        }),
        this.history.length > 24 && this.history.shift(),
        !i)
      ) {
        (this.stats.dropped++, e.protect && this.stats.lostProtected++);
        return;
      }
      (this.stats.played++,
        r &&
          r.voice &&
          !r.voice.dead &&
          r.voice.end > t &&
          (this.sys.pool.duckTail(r.voice, t, 0.45), this.stats.layered++),
        (this.current = { entry: e, voice: i, start: t, free: t + vo(e) }));
      let o = Math.min(2.2, (i.end - t) * 0.55),
        s = t - n,
        c = this.sys.mix;
      (c.duck(`music`, 0.42, o + s, 0.08, 1.2),
        c.duck(`amb`, 0.55, o + s, 0.08, 1.2),
        c.duck(`sfx`, 0.8, o * 0.6 + s, 0.05, 0.8));
    }
    reset(e) {
      (this.current &&
        this.current.voice &&
        e != null &&
        this.sys.pool.fadeOut(this.current.voice, e, 0.2),
        (this.queue.length = 0),
        (this.current = null));
    }
    info() {
      return {
        queue: this.queue.map((e) => e.name + (e.count ? `×` + e.count : ``)),
        recent: this.history.slice(-8),
        ...this.stats,
      };
    }
  },
  xo = 0.2,
  So = 5,
  Co = 3,
  wo = 2.2,
  To = 3,
  Eo = 0.35,
  Do = 2.6,
  Oo = 1.1,
  ko = 13,
  Ao = 9,
  jo = class {
    constructor() {
      (this.reset(), (this._screen = { x: 0, y: 0, visible: !1 }));
    }
    reset() {
      ((this.pvpHeat = 0),
        (this.eventHeat = 0),
        (this.lastPvp = -1e9),
        (this.blue = 0),
        (this.red = 0),
        (this.crowd = 0),
        (this.value = 0),
        (this.target = 0),
        (this.time = 0),
        (this._crowdT = 0));
    }
    inView(e, t, n, r) {
      if (r && typeof r.worldToScreen == `function`)
        try {
          let n = r.worldToScreen(e, 1, t, this._screen);
          if (n && typeof n.visible == `boolean`) return n.visible;
        } catch {}
      return Math.abs(e - n.x) < ko && Math.abs(t - n.y) < Ao;
    }
    onHit(t, n, r, i, a, o, s) {
      t &&
        n &&
        t.kind === e.CHAMPION &&
        n.kind === e.CHAMPION &&
        t.team !== n.team &&
        Number.isFinite(i) &&
        this.inView(i, a, o, s) &&
        ((this.pvpHeat += 0.08 * w((r || 100) / 150, 0.3, 2.2)),
        (this.lastPvp = this.time));
    }
    onCast(t, n, r, i, a, o, s) {
      if (
        !t ||
        t.kind !== e.CHAMPION ||
        !Number.isFinite(r) ||
        !this.inView(r, i, o, s)
      )
        return;
      let c = !1,
        l = a.champions;
      for (let e = 0; e < l.length; e++) {
        let n = l[e];
        if (!n.alive || n.team === t.team) continue;
        let a = n.x - r,
          o = n.y - i;
        if (a * a + o * o < 49) {
          c = !0;
          break;
        }
      }
      c &&
        ((this.pvpHeat += n === `R` ? 0.3 : 0.08), (this.lastPvp = this.time));
    }
    onChampionDeath(e, t, n, r) {
      Number.isFinite(e) &&
        this.inView(e, t, n, r) &&
        ((this.pvpHeat += 0.3), (this.lastPvp = this.time));
    }
    onBigEvent(e, t, n) {
      Math.hypot(e - n.x, t - n.y) < 20 && (this.eventHeat += 0.3);
    }
    update(e, t, n, r, i) {
      if (
        ((this.time += e),
        (this.pvpHeat = Math.min(3, this.pvpHeat) * Math.exp(-e / wo)),
        (this.eventHeat = Math.min(1, this.eventHeat) * Math.exp(-e / To)),
        (this._crowdT -= e),
        this._crowdT <= 0 && ((this._crowdT = xo), this._countCrowd(t, n, r)),
        !r)
      )
        this.target = 0;
      else {
        let e = this.time - this.lastPvp,
          t = 0.95 * (1 - Math.exp(-this.pvpHeat * 1.5)),
          n = e < Co ? t : Math.min(t, 0.3);
        n = Math.max(n, Math.min(0.32, this.eventHeat));
        let r = Math.min(this.blue, this.red),
          a = this.blue + this.red;
        (r >= 2
          ? ((n = Math.max(n, 0.26)),
            e < So && (n = Math.max(n, 0.56 + 0.1 * (r - 2) + 0.04 * (a - 4))))
          : r >= 1 && e < Co && (n = Math.max(n, 0.3)),
          i && (n *= 0.7),
          (this.target = w(n, 0, 1)));
      }
      let a = this.target > this.value,
        o = this.time - this.lastPvp >= Co,
        s = a ? Eo : o ? Oo : Do;
      return (
        (this.value += (this.target - this.value) * (1 - Math.exp(-e / s))),
        Number.isFinite(this.value) || this.reset(),
        this.value
      );
    }
    _countCrowd(e, t, n) {
      let r = 0,
        i = 0;
      if (n && e && e.champions) {
        let n = e.champions;
        for (let e = 0; e < n.length; e++) {
          let a = n[e];
          if (!a.alive) continue;
          let o = a.x - t.x,
            s = a.y - t.y;
          o * o + s * s >= 196 || (a.team === 0 ? r++ : a.team === 1 && i++);
        }
      }
      ((this.blue = r),
        (this.red = i),
        (this.crowd = Math.min(r, i) >= 2 ? Math.min(r, i) : r && i ? 1 : 0));
    }
  },
  Mo = l({
    GROUPS: () => Oa,
    MAX_SOURCES: () => 96,
    MAX_VOICES: () => 44,
    announceRel: () => to,
    default: () => ls,
  }),
  No = [
    `pointerdown`,
    `pointerup`,
    `keydown`,
    `touchend`,
    `mousedown`,
    `click`,
  ],
  Po = new Set([`pointerdown`, `keydown`, `touchend`]),
  Fo = `button, [role="button"], [data-open-shop], [data-item], [data-tab], [data-play], [data-champion], [data-click-sound], a[href]`,
  Io = `[data-slot], [data-joystick], [data-levelup], [data-quickbuy], [data-no-sound]`,
  Lo = `[data-play], [data-lockin], [data-play-again]`,
  Ro = `sundered-vale.audio`,
  zo = { game: 1.6, gameCatchUp: 2.6, other: 6, stalled: 3 },
  Bo = 1600,
  Vo = 1,
  Ho = 0.6,
  Uo = 4,
  Wo = 0.3,
  Go = 0.35,
  Ko = 1,
  qo = 2,
  Jo = 0.9,
  Yo = 0.75,
  Xo = 3,
  Zo = 18,
  Qo = new Set([`game`, `loading`, `select`, `menu`, `end`]),
  $o = Fe.filter((e) => !e.startsWith(`bank:`)),
  es = Fe.filter((e) => e.startsWith(`bank:`)),
  ts = 5,
  $ = () => (typeof performance < `u` ? performance.now() : Date.now()),
  ns = (e) => e === `storm_drake` || e === `abyssal_tyrant`,
  rs = {
    team: [0, 1, 2],
    crit: [!1, !0],
    amount: [90, 150, 240],
    rel: [`ally`, `enemy`],
    count: [2, 3],
    power: [0, 0.5, 1],
  },
  is = (() => {
    let e = new Map(),
      t = new Set();
    for (let t of n) e.set(t, []);
    for (let r of Q())
      for (let i of n)
        if (r.startsWith(i + `_`)) {
          (e.get(i).push(r), t.add(r));
          break;
        }
    let r = (t) => e.get(t) || as;
    return ((r.owned = t), r);
  })(),
  as = [],
  os = (() => {
    let e = [];
    for (let t in r) {
      let n = r[t];
      for (let t = 0; t < n.length - 1; t++)
        e.push(n[t].x, n[t].y, n[t + 1].x, n[t + 1].y);
    }
    return Float64Array.from(e);
  })();
function ss(e, t, n, r) {
  let i = e - n,
    a = t - r;
  return Math.sqrt(i * i + a * a);
}
function cs(e, t) {
  let n = 1e9;
  for (let r = 0; r < os.length; r += 4) {
    let i = os[r],
      a = os[r + 1],
      o = os[r + 2] - i,
      s = os[r + 3] - a,
      c = o * o + s * s,
      l = c > 0 ? ((e - i) * o + (t - a) * s) / c : 0;
    l = l < 0 ? 0 : l > 1 ? 1 : l;
    let u = e - (i + o * l),
      d = t - (a + s * l),
      f = Math.sqrt(u * u + d * d);
    f < n && (n = f);
  }
  return n;
}
var ls = class {
  constructor(e) {
    ((this.ctx = e),
      (this.app = e.app),
      (this.supported =
        typeof window < `u` &&
        !!(window.AudioContext || window.webkitAudioContext)),
      (this.ac = null),
      (this.kit = null),
      (this.mix = null),
      (this.music = null),
      (this.amb = null),
      (this.baker = null),
      (this.ready = !1),
      (this.disposed = !1));
    let t = ds();
    ((this.muted = !!t.muted),
      (this.volumes = { ...Be, ...(t.volumes || {}) }),
      (this.state = null),
      (this.prevState = null),
      (this.matchStarted = !1),
      (this.listener = { x: 60, y: 60 }),
      (this.pool = new Na(this.listener)),
      (this.router = new Qa(this)),
      (this.announcer = new bo(this)),
      (this.combat = new jo()),
      (this.intensity = 0),
      (this.playerDead = !1),
      (this.duckClearAt = 0),
      (this.warmed = !1),
      (this.warmStart = 0),
      (this._lastCatchUp = -1e9),
      (this._frames = 0),
      (this._lowHealth = null),
      (this._ambT = 0),
      (this._lastUpdate = 0),
      (this._prewarmed = null),
      (this._prewarmQueue = null),
      (this._analyzeQueue = null),
      (this._varParams = {}),
      (this._lastClick = 0),
      (this._lastHover = 0),
      (this._hoverEl = null),
      (this._timers = []),
      (this._ambWeights = {
        wind: 0,
        birds: 0,
        water: 0,
        jungle: 0,
        blue: 0,
        red: 0,
        drake: 0,
        tyrant: 0,
      }),
      (this._ambOpts = { shotScale: 1, bedScale: 1 }),
      (this._onGesture = () => {
        this.disposed || this.resume();
      }),
      (this._onVisibility = () => this._visibility()),
      (this._onOver = (e) => this._uiOver(e)),
      (this._onClick = (e) => this._uiClick(e)),
      typeof window < `u` &&
        (this._armGestures(),
        typeof document < `u` &&
          (document.addEventListener(`visibilitychange`, this._onVisibility),
          document.addEventListener(`pointerover`, this._onOver, {
            passive: !0,
          }),
          document.addEventListener(`click`, this._onClick, { passive: !0 }))),
      this.app &&
        this.app.on &&
        (this.app.on(`state`, (e) => {
          this.disposed || this._setState(e);
        }),
        this.app.on(`match`, () => {
          this.disposed || this._onMatch();
        }),
        this.app.on(`ui`, (e) => {
          this.disposed || this._panel(e && e.panel);
        })),
      this.supported && De([Ve, He]),
      (this._interval = setInterval(() => this._pump(!0), 50)));
  }
  get stats() {
    return this.pool.stats;
  }
  get voices() {
    return this.pool.voices;
  }
  get gapRing() {
    return this.pool.gapRing;
  }
  get groupLast() {
    return this.pool.gapRing;
  }
  get recalls() {
    return this.router.recalls;
  }
  get loops() {
    return this.router.loops;
  }
  get castHits() {
    return this.router.castHits;
  }
  get projFx() {
    return this.router.projFx;
  }
  get lastCast() {
    return this.router.lastCast;
  }
  get _aggro() {
    return this.router.aggro;
  }
  get heat() {
    return this.combat.pvpHeat;
  }
  get crowd() {
    return this.combat.crowd;
  }
  get rig() {
    return this.ctx.pipeline ? this.ctx.pipeline.cameraRig : null;
  }
  get vision() {
    return this.ctx.pipeline ? this.ctx.pipeline.vision : null;
  }
  resume() {
    if (this.disposed || !this.supported) return !1;
    try {
      if (!this.ac) {
        let e = typeof navigator < `u` ? navigator.userActivation : null;
        if (e && !e.hasBeenActive && !e.isActive) return !1;
        let t = window.AudioContext || window.webkitAudioContext;
        ((this.ac = new t({ latencyHint: `interactive` })),
          (this.ac.onstatechange = () => this._contextState()),
          this._build());
      }
      let e = this.ac.state,
        t = typeof document < `u` && document.hidden;
      if (e !== `running` && e !== `closed` && !t) {
        let e = this.ac.resume();
        e && e.catch && e.catch(() => {});
      }
      return (
        this.ready &&
          this.ac.state === `running` &&
          this._dropGestureListeners(),
        !0
      );
    } catch (e) {
      return (this.error(e), this.ac || (this.supported = !1), !1);
    }
  }
  _build() {
    let e = this.ac;
    ((this.kit = new F(e)),
      (this.mix = new Ge(e, { volumes: this.volumes })),
      (this.mix.mute.gain.value = +!this.muted),
      (this.mix.muted = this.muted));
    let t = typeof location < `u` ? location.search : ``,
      n = !/[?&]audio\.bake=0/.test(t);
    ((this.baker = new ba(e, { enabled: n })),
      this.pool.setDropDebug(/[?&]audio\.debug=1/.test(t)),
      this.pool.attach({
        ac: e,
        kit: this.kit,
        mix: this.mix,
        baker: this.baker,
      }),
      (this.music = new ea(e, this.mix, this.kit, { baker: this.baker })),
      (this.amb = new oa(e, this.mix, this.kit)));
    try {
      (this.mix.attachReverbsIfReady(), this.kit.warm(Fe, $() + 4));
    } catch (e) {
      this.error(e);
    }
    ((this.ready = !0),
      (this.stats.started = !0),
      (this.warmStart = e.currentTime));
    let r = this.state || (this.app && this.app.state);
    ((this.state = null), r && this._setState(r));
  }
  _armGestures() {
    if (typeof window < `u`) {
      this._gestureDropped = !1;
      for (let e of No)
        window.addEventListener(e, this._onGesture, {
          capture: !0,
          passive: !0,
        });
    }
  }
  _dropGestureListeners() {
    if (!(this._gestureDropped || typeof window > `u`)) {
      this._gestureDropped = !0;
      for (let e of No)
        Po.has(e) ||
          window.removeEventListener(e, this._onGesture, { capture: !0 });
    }
  }
  _contextState() {
    if (!this.ac || this.disposed) return;
    let e = this.ac.state;
    e === `running`
      ? this._dropGestureListeners()
      : e !== `closed` && !this._hiddenSuspend && this._armGestures();
  }
  _visibility() {
    if (this.ac)
      try {
        document.hidden
          ? this.ac.state === `running` &&
            ((this._hiddenSuspend = !0), this.ac.suspend().catch(() => {}))
          : (this._hiddenSuspend || this.ac.state !== `running`) &&
            ((this._hiddenSuspend = !1),
            this.ac.state !== `closed` && this.ac.resume().catch(() => {}));
      } catch (e) {
        this.error(e);
      }
  }
  dispose() {
    if (!this.disposed) {
      if (
        ((this.disposed = !0),
        clearInterval(this._interval),
        this.debugStop(),
        typeof window < `u`)
      ) {
        for (let e of No)
          window.removeEventListener(e, this._onGesture, { capture: !0 });
        typeof document < `u` &&
          (document.removeEventListener(`visibilitychange`, this._onVisibility),
          document.removeEventListener(`pointerover`, this._onOver),
          document.removeEventListener(`click`, this._onClick));
      }
      try {
        (this.music && this.music.dispose(),
          this.amb && this.amb.dispose(),
          this.pool.disposeAll());
      } catch {}
      if (this.ac)
        try {
          ((this.ac.onstatechange = null), this.ac.close().catch(() => {}));
        } catch {}
      this.ready = !1;
    }
  }
  setMuted(e) {
    return (
      (this.muted = !!e),
      fs({ muted: this.muted, volumes: this.volumes }),
      this.mix && this.mix.setMuted(this.muted),
      this.muted
    );
  }
  toggleMuted() {
    return this.setMuted(!this.muted);
  }
  setVolume(e, t) {
    e in Be &&
      ((this.volumes[e] = w(Number(t) || 0, 0, 1)),
      fs({ muted: this.muted, volumes: this.volumes }),
      this.mix && this.mix.setVolume(e, this.volumes[e]));
  }
  click() {
    this.ready || this.resume();
    let e = $();
    e - this._lastClick < 40 || ((this._lastClick = e), this.play(`ui_click`));
  }
  confirm() {
    this.ready || this.resume();
    let e = $();
    e - this._lastClick < 40 ||
      ((this._lastClick = e), this.play(`ui_confirm`));
  }
  hover() {
    if (!this.ready) return;
    let e = $();
    e - this._lastHover < 60 || ((this._lastHover = e), this.play(`ui_hover`));
  }
  soundNames() {
    return Q();
  }
  offlineTest(e) {
    return u(
      () =>
        import(`./offline-test-BGBwxxpN.js`).then((t) => t.runOfflineTest(e)),
      [],
      import.meta.url,
    );
  }
  runOfflineTest(e) {
    return this.offlineTest(e);
  }
  offlineTestNames() {
    return u(
      () =>
        import(`./offline-test-BGBwxxpN.js`).then((e) => e.offlineTestNames()),
      [],
      import.meta.url,
    );
  }
  getDebugInfo() {
    let e = this.ac ? this.ac.currentTime : 0,
      t = this.pool.counts(e);
    return {
      supported: this.supported,
      ready: this.ready,
      contextState: this.ac ? this.ac.state : `none`,
      sampleRate: this.ac ? this.ac.sampleRate : 0,
      muted: this.muted,
      volumes: { ...this.volumes },
      state: this.state,
      cue: this.music ? this.music.name : null,
      phase: this.music ? this.music.phase : 0,
      intensity: +this.intensity.toFixed(3),
      heat: +this.combat.pvpHeat.toFixed(3),
      crowd: this.combat.crowd,
      combat: {
        target: +this.combat.target.toFixed(3),
        blue: this.combat.blue,
        red: this.combat.red,
        sinceFight: +(this.combat.time - this.combat.lastPvp).toFixed(1),
        event: +this.combat.eventHeat.toFixed(3),
      },
      muffled: this.mix ? this.mix.muffled : !1,
      sidechainDepth: this.mix ? +this.mix.sidechainDepth.toFixed(2) : 1,
      voices: t.live,
      sources: t.sources,
      bakedVoices: t.baked,
      warmed: this.warmed,
      caps: {
        voices: this.pool.maxVoices,
        sources: this.pool.maxSources,
        quality: this.pool.quality,
      },
      deferred: this.pool.deferred.length,
      reverbs: this.mix ? this.mix.reverbsReady : !1,
      listener: {
        x: +this.listener.x.toFixed(1),
        y: +this.listener.y.toFixed(1),
      },
      ambience: this.amb
        ? { beds: { ...this.amb.w }, oneShots: { ...this.amb.sw } }
        : null,
      ducks: this.mix ? { ...this.mix.duckLevel } : null,
      announcer: this.announcer.info(),
      maps: { gapRing: this.pool.gapRing.size, ...this.router.sizes() },
      bake: this.baker ? this.baker.report() : null,
      lowHealth: this._lowHealth
        ? +(this._lowHealth.next - e).toFixed(2)
        : null,
      stats: {
        ...this.stats,
        recent: this.stats.recent.slice(-24),
        recentDrops: this.stats.recentDrops.slice(-24),
        byName: this.stats.byName ? us(this.stats.byName) : null,
      },
    };
  }
  debugPlayAll({
    gap: e = 0.35,
    filter: t = null,
    names: n = null,
    maxLen: r = 2.4,
  } = {}) {
    if ((this.resume(), !this.ready))
      return {
        error: `audio not started: needs a user gesture first (or AudioContext unavailable)`,
      };
    this.debugStop();
    let i = (n || Q()).filter((e) => Z[e] && (!t || e.includes(t))),
      a = [],
      o = 0;
    return (
      i.forEach((t, n) => {
        a.push({ name: t, at: +o.toFixed(2) });
        let i = {
          force: !0,
          team: n % 2,
          rel: n % 2 ? `enemy` : `ally`,
          count: 3 + (n % 3),
          amount: 180,
          windup: 0.25,
          duration: 0.8,
        };
        (this._timers.push(setTimeout(() => this.play(t, i), o * 1e3)),
          (o += Math.min(r, (Z[t].test || 1.6) * 0.62) + e));
      }),
      a
    );
  }
  debugStop() {
    for (let e of this._timers) clearTimeout(e);
    this._timers.length = 0;
  }
  play(e, t = {}) {
    return !this.ready || this.disposed ? null : this.pool.play(e, t);
  }
  announce(e, t, n, r) {
    return !this.ready || this.disposed
      ? null
      : this.announcer.enqueue(e, t, n, r ?? this.ac.currentTime);
  }
  _stinger(e, t, n) {
    let r = e.startsWith(`stinger_`) ? e.slice(8) : `generic`;
    return this.announce(
      e,
      t,
      { key: r, rel: t.rel, count: t.count, actor: t.actor },
      n,
    );
  }
  error(e) {
    this.pool.error(e);
  }
  update(t) {
    if (this.disposed) return;
    if (
      (t.state !== this.state && this._setState(t.state),
      !this.ready || this.ac.state !== `running`)
    ) {
      this.router._liveArr = null;
      return;
    }
    this._lastUpdate = $();
    let n = this.ac.currentTime,
      r = w(Number(t.dt) || 0.016, 0, 0.1);
    (this.ctx.pipeline && this.pool.setDeviceCaps(this.ctx.pipeline.quality),
      (this.pool.coldStart = n - this.warmStart < Yo),
      this.pool.beginFrame());
    let i = this.rig;
    i &&
      Number.isFinite(i.focusX) &&
      Number.isFinite(i.focusY) &&
      ((this.listener.x = i.focusX), (this.listener.y = i.focusY));
    let a = t.world,
      o = t.state === `game`;
    a &&
      (this.router.collect(t, n, o || t.state === `end`),
      o && this.music && this.music.setGameTime(a.time));
    let s = a && a.units ? a.units.get(t.playerId) : null,
      c = !!(s && s.kind === e.CHAMPION && !s.alive && o);
    ((this.intensity = this.combat.update(r, a, this.listener, o, c)),
      this.music.setIntensity(this.intensity),
      this.announcer.pump(n),
      (this._ambT -= r),
      this._ambT <= 0 && ((this._ambT = 0.12), this._ambience(t)),
      this._lowHealthStep(s, c, o, n),
      c !== this.playerDead && ((this.playerDead = c), this.mix.setMuffle(c)),
      this.duckClearAt &&
        n >= this.duckClearAt &&
        ((this.duckClearAt = 0), (this.mix.ducks.music.length = 0)),
      this.mix.updateDucks(n),
      this.pool.sweep(n) && this.router.gc(n),
      this._pump(!1),
      this._frames++ >= Xo && this._warmStep(t));
  }
  _lowHealthStep(t, n, r, i) {
    let a = this._lowHealth,
      o = !!(t && t.alive && !n && r && t.kind === e.CHAMPION && t.maxHp > 0),
      s = o ? t.hp / t.maxHp : 1;
    if (!o || s >= (a ? Go : Wo)) {
      a && this._stopLowHealth(i);
      return;
    }
    if (a && i < a.next) return;
    let c = w((Wo - s) / Wo, 0, 1),
      l = Ko + -0.55 * c,
      u = this.play(`low_health`, {
        t: i + 0.02,
        force: !0,
        handle: !0,
        power: Math.round(c * 2) / 2,
      });
    a
      ? ((a.voice = u || a.voice), (a.next = i + l))
      : (this._lowHealth = { voice: u, next: i + l });
  }
  _stopLowHealth(e) {
    let t = this._lowHealth;
    ((this._lowHealth = null),
      t && t.voice && e != null && this.pool.fadeOut(t.voice, e, 0.12));
  }
  _pump(e) {
    if (!this.ready || this.disposed || !this.ac || this.ac.state !== `running`)
      return;
    let t = this.ac.currentTime;
    try {
      (this.music.pump(t, t + Mi),
        this.amb.started && this.amb.pump(t, t + Mi),
        e && this.announcer.pump(t));
    } catch (e) {
      this.error(e);
    }
    e && $() - this._lastUpdate > 150 && this._warmStep(null);
  }
  _warmStep(e) {
    let t = !e,
      n = this.state === `game`,
      r = this.kit,
      i = e && e.world,
      a =
        this.state &&
        this.state !== `end` &&
        this.state !== `select` &&
        this.state !== `loading`,
      o = !!e && Qo.has(e.state),
      s = !!i && o && this._prewarmed !== i,
      c = !!this._analyzeQueue && !this._analyzeQueue.length;
    if (
      this.warmed &&
      c &&
      this.baker.idle() &&
      !r.pendingWarm() &&
      !s &&
      (this.amb.started || !a)
    )
      return;
    let l = $(),
      u =
        n &&
        !t &&
        l - this._lastCatchUp > Bo &&
        !this.baker.idle() &&
        this.pool.frameCostMs < Vo;
    u && (this._lastCatchUp = l);
    let d = t ? zo.stalled : n ? (u ? zo.gameCatchUp : zo.game) : zo.other;
    if ((n && !u && (d -= this.pool.frameCostMs), d <= 0)) return;
    let f = l + d;
    try {
      if (
        !r.warm($o, f) ||
        (!this.amb.started && a && this.amb.start(this.ac.currentTime + 0.05),
        !r.warm(null, f)) ||
        !r.warm(es, f)
      )
        return;
      if (!this.mix.reverbsReady) {
        let e = !n || this.intensity < 0.2,
          t = this.ac.currentTime - this.warmStart > ts;
        if (!(e || t) || !this.mix.stepReverbs(f)) return;
      }
      if (((this.warmed = !0), !n)) {
        (s && this._prewarmStep(i, n),
          this._analyzeStep(f, 1 / 0),
          this.baker.pump(f, 3, 1 / 0));
        return;
      }
      let e = f - Math.min(Jo, d * 0.6),
        t = this.pool.coldStart;
      (s && !t && this._prewarmStep(i, n), this._analyzeStep(e, t ? 1 : qo));
      let o = f - $();
      if (o < Ho) return;
      let c = this.intensity > 0.25,
        l = o;
      (u && (l = Math.max(l, this.baker.cheapestQueuedMs())),
        this.baker.pump(f, c ? 2 : Uo, l));
    } catch (e) {
      this.error(e);
    }
  }
  _analyzeStep(e, t = 1 / 0) {
    this._analyzeQueue ||= Q().filter((e) => !this.baker.analyzed(e));
    let n = this._analyzeQueue,
      r = 0;
    for (; n.length; ) {
      if (r >= t || $() >= e) return !1;
      r++;
      let i = n.pop();
      this.baker.analyze(i, Z[i]);
    }
    return !0;
  }
  _prewarmStep(e, t) {
    this._prewarmed !== e &&
      ((this._prewarmed = e), (this._prewarmQueue = this._prewarmList(e)));
    let n = this._prewarmQueue;
    if (!n) return !0;
    let r = t ? Math.min(n.length, Zo) : n.length,
      i = 0;
    for (let e = 0; e < r; e++) {
      let [e, r] = n[n.length - 1];
      if (t && !this.baker.analyzed(e)) {
        if (i >= qo) break;
        i++;
      }
      (n.pop(), Z[e] && this._prewarmOne(e, Z[e], r));
    }
    return !n.length && ((this._prewarmQueue = null), !0);
  }
  _prewarmOne(e, t, n) {
    this.baker.prewarm(e, t, n);
    let r = this.baker.analyze(e, t).used;
    for (let i = 0; i < r.length; i++) {
      let a = rs[r[i]];
      if (a)
        for (let o = 0; o < a.length; o++) {
          if (a[o] === n[r[i]]) continue;
          let s = this._varParams;
          for (let e in n) s[e] = n[e];
          ((s[r[i]] = a[o]), this.baker.prewarm(e, t, s));
        }
    }
  }
  _prewarmList(t) {
    let n = {
        team: 0,
        rel: `ally`,
        crit: !1,
        amount: 150,
        windup: 0.25,
        self: !1,
        duration: 0.8,
        count: 2,
      },
      r = [],
      i = new Set(),
      a = (e, t = null) => {
        let a = t ? e + JSON.stringify(t) : e;
        i.has(a) || (i.add(a), r.push([e, t ? { ...n, ...t } : { ...n }]));
      },
      o = new Set((t.champions || []).map((e) => e.champion));
    for (let e of o) for (let t of is(e)) a(t);
    for (let e of Q()) e.startsWith(`stinger_`) && a(e);
    for (let e of [`stinger_kill`, `stinger_first_blood`, `stinger_multikill`])
      a(e, { rel: `self` });
    for (let e of [`stinger_kill`, `stinger_first_blood`, `stinger_executed`])
      a(e, { rel: `slain` });
    for (let e of [0, 1]) {
      for (let t of [
        `minion_melee_attack`,
        `minion_caster_shot`,
        `minion_siege_shot`,
        `turret_shot`,
        `turret_hit`,
        `turret_charge`,
      ])
        a(t, { team: e });
      for (let t of [`melee`, `caster`, `siege`])
        a(`minion_death`, { team: e, subtype: t });
    }
    for (let e of [
      `impact_physical`,
      `impact_magic`,
      `impact_crit`,
      `impact_true`,
      `hit_minor`,
      `gold_coin`,
      `cc_stun`,
      `cc_slow`,
      `cc_root`,
      `cc_knockup`,
      `cc_knockback`,
      `cc_pull`,
      `cc_silence`,
      `champion_death`,
      `ward_place`,
      `ward_kill`,
      `low_health`,
      `player_death`,
      `player_respawn`,
    ])
      a(e, { team: 2 });
    for (let n of t.unitList || [])
      n.kind === e.MONSTER &&
        (a(
          ns(n.subtype) ? `epic_monster_attack` : `monster_attack_` + n.subtype,
          { subtype: n.subtype },
        ),
        a(ns(n.subtype) ? `epic_death` : `monster_death_` + n.subtype, {
          subtype: n.subtype,
        }));
    for (let e of Q()) is.owned.has(e) || a(e);
    return (r.reverse(), r);
  }
  _setState(e) {
    if (
      !e ||
      e === this.state ||
      ((this.prevState = this.state), (this.state = e), !this.ready)
    )
      return;
    let t = this.ac.currentTime;
    if (!this.mix.reverbsReady)
      try {
        this.mix.loadReverbs();
      } catch (e) {
        this.error(e);
      }
    if (
      (e !== `game` && this._stopLowHealth(t),
      e === `menu` || e === `select` || e === `loading`)
    )
      (this.music.setCue(`menu`, { fade: 1.6 }),
        (this.matchStarted = !1),
        this.mix.setMuffle(!1),
        (this.playerDead = !1),
        this.amb.started && this.amb.resumeOut(1.5));
    else if (e === `game`)
      (this.matchStarted ||
        ((this.matchStarted = !0),
        (this.prevState === `menu` ||
          this.prevState === `select` ||
          this.prevState === `loading`) &&
          this.announce(
            `stinger_match_start`,
            { t: t + 0.05, rel: `ally` },
            { key: `match_start` },
            t,
          )),
        this.music.setCue(`field`, { fade: 2.2 }),
        this.amb.started && this.amb.resumeOut(1.5));
    else if (e === `end`) {
      let e = this.app && this.app.world,
        n = !e || e.winner == null || e.winner === (this.app.viewerTeam ?? 0);
      (this.music.setCue(n ? `victory` : `defeat`, {
        delay: n ? 1.55 : 1.6,
        fade: 1.4,
      }),
        (this.duckClearAt = t + 1.5),
        this.mix.setMuffle(!1),
        (this.playerDead = !1),
        this.amb.started && this.amb.stop(6));
    }
  }
  _onMatch() {
    if (
      (this.router.reset(),
      this.combat.reset(),
      (this.intensity = 0),
      this.ready)
    ) {
      let e = this.ac.currentTime;
      this.router.stopAllRecalls(e);
      for (let t of this.router.loops.values())
        this.pool.fadeOut(t.voice, e, 0.3);
      (this.announcer.reset(e), this._stopLowHealth(e), this.mix.setMuffle(!1));
    } else (this.announcer.reset(null), (this._lowHealth = null));
    (this.router.recalls.clear(),
      this.router.loops.clear(),
      (this.playerDead = !1));
  }
  _ambience(e) {
    if (!this.amb.started) return;
    let t = e.state,
      n = this.listener,
      r = t === `game` ? 1 : t === `menu` ? 0.45 : t === `end` ? 0.5 : 0,
      c = D(s + 5, s - 0.5, cs(n.x, n.y)),
      l = D(6, 1.5, i(n.x, n.y)),
      u = D(27, 11, ss(n.x, n.y, a[0].x, a[0].y)),
      d = D(27, 11, ss(n.x, n.y, a[1].x, a[1].y)),
      f = 0,
      p = 0;
    for (let e = 0; e < o.length; e++) {
      let t = o[e],
        r = D(15, 6, ss(n.x, n.y, t.x, t.y));
      t.id === `drake` ? (f = r) : (p = r);
    }
    let m = Math.max(u, d),
      h = w(1 - Math.max(c, l * 0.85, m), 0, 1),
      g = this.intensity,
      _ = this._ambWeights;
    ((_.wind = r * w(0.28 + 0.55 * c + 0.12 * l, 0, 1) * (1 - 0.45 * m)),
      (_.birds = r * c * (1 - m)),
      (_.water = r * l),
      (_.jungle = r * h),
      (_.blue = r * u),
      (_.red = r * d),
      (_.drake = r * f),
      (_.tyrant = r * p));
    let v = this._ambOpts;
    ((v.shotScale = 1 - 0.8 * g),
      (v.bedScale = 1 - 0.4 * g),
      this.amb.setMix(_, this.ac.currentTime, t === `game` ? 0.9 : 1.5, v));
  }
  _uiTarget(e) {
    let t = e && e.target && e.target.closest ? e.target.closest(Fo) : null;
    return !t ||
      t.closest(Io) ||
      t.disabled ||
      t.getAttribute(`aria-disabled`) === `true`
      ? null
      : t;
  }
  _uiOver(e) {
    if (e.pointerType === `touch`) return;
    let t = this._uiTarget(e);
    t !== this._hoverEl && ((this._hoverEl = t), t && this.hover());
  }
  _uiClick(e) {
    let t = this._uiTarget(e);
    t && (t.closest(Lo) ? this.confirm() : this.click());
  }
  _panel(e) {
    e ||= `none`;
    let t = this._panelPrev || `none`;
    ((this._panelPrev = e),
      this.ready &&
        e !== t &&
        this.play(e === `none` ? `ui_panel_close` : `ui_panel_open`));
  }
};
function us(e) {
  let t = [];
  for (let n in e) {
    let r = e[n],
      i = r.gap + r.group + r.budget + r.cpu;
    i && t.push([n, i, r]);
  }
  t.sort((e, t) => t[1] - e[1]);
  let n = {};
  for (let [e, r, i] of t.slice(0, 12)) n[e] = { n: r, ...i };
  return n;
}
function ds() {
  try {
    let e = window.localStorage.getItem(Ro);
    return (e && JSON.parse(e)) || {};
  } catch {
    return {};
  }
}
function fs(e) {
  try {
    window.localStorage.setItem(Ro, JSON.stringify(e));
  } catch {}
}
export {
  Oa as GROUPS,
  Da as MAX_SOURCES,
  Ea as MAX_VOICES,
  ea as a,
  to as announceRel,
  Ge as c,
  j as d,
  ls as default,
  oa as i,
  F as l,
  Ca as n,
  Z as o,
  ba as r,
  Q as s,
  Mo as t,
  ne as u,
};
