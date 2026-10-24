import {
  a as e,
  c as t,
  d as n,
  i as r,
  l as i,
  n as a,
  o,
  r as s,
  s as c,
  u as l,
} from "./audio-DMcdD9uy.js";
var u = new Set([
    `hit`,
    `hit_minor`,
    `attack`,
    `ability`,
    `turret`,
    `monster`,
    `minion_attack`,
    `minion_death`,
    `passive`,
  ]),
  d = -10,
  f = {
    music_menu: { cue: `menu`, seconds: 14 },
    music_field_calm: { cue: `field`, intensity: 0, seconds: 12 },
    music_field_fight: { cue: `field`, intensity: 1, seconds: 12 },
    music_victory: { cue: `victory`, seconds: 11 },
    music_defeat: { cue: `defeat`, seconds: 11 },
    ambience_lane: { amb: { wind: 0.85, birds: 1 }, seconds: 6 },
    ambience_river: { amb: { water: 1, wind: 0.3 }, seconds: 6 },
    ambience_jungle: { amb: { jungle: 1, wind: 0.25 }, seconds: 6 },
    ambience_base_blue: { amb: { blue: 1, wind: 0.2 }, seconds: 6 },
    ambience_base_red: { amb: { red: 1, wind: 0.2 }, seconds: 6 },
    ambience_pit_drake: { amb: { drake: 1, jungle: 0.3 }, seconds: 6 },
    ambience_pit_tyrant: { amb: { tyrant: 1, jungle: 0.3 }, seconds: 6 },
  },
  p = {
    team: 0,
    rel: `ally`,
    crit: !1,
    amount: 160,
    windup: 0.25,
    count: 3,
    self: !0,
  };
function m() {
  return [...c(), ...Object.keys(f)];
}
var h = null;
async function g(
  c,
  {
    sampleRate: d = 44100,
    params: m = null,
    baked: g = !1,
    gain: v = null,
  } = {},
) {
  let y =
    globalThis.OfflineAudioContext || globalThis.webkitOfflineAudioContext;
  if (!y) throw Error(`OfflineAudioContext unavailable`);
  let b = o[c],
    x = f[c];
  if (!b && !x) throw Error(`unknown sound ` + c);
  let S = x ? x.seconds : b.test || 2.8,
    C = Math.ceil(S * d),
    w,
    T = !0;
  try {
    w = new y(4, C, d);
  } catch {
    ((w = new y(2, C, d)), (T = !1));
  }
  n(l(c));
  let E = w.destination,
    D = null;
  T &&
    ((D = w.createChannelMerger(4)),
    D.connect(w.destination),
    (E = w.createChannelSplitter(2)),
    E.connect(D, 0, 0),
    E.connect(D, 1, 1));
  let O = new t(w, { destination: E, reverbs: `sync` });
  if (T) {
    let e = w.createChannelSplitter(2);
    (O.pre.connect(e), e.connect(D, 0, 2), e.connect(D, 1, 3));
  }
  let k = new i(w),
    A = null;
  if (b && g) {
    h ||= new s(null, { rate: d });
    let e = { ...p, ...(m || {}) };
    A = await h.renderNow(c, b, e);
  }
  if (b)
    a(
      k,
      O,
      b,
      0.03,
      { ...p, ...(m || {}) },
      { gain: v ?? b.gain, pan: 0, baked: A ? { ...A, rate: 1 } : null },
    );
  else if (x.cue) {
    let t = new e(w, O, k);
    (t.setIntensity(x.intensity ?? 0),
      t.setCue(x.cue, { fade: 0.02, immediate: !0 }),
      t.pump(0, S - 0.3));
  } else if (x.amb) {
    let e = new r(w, O, k);
    (e.start(0), e.setMix(x.amb, 0, 0.02), e.pump(0, S - 0.5));
  }
  let j = typeof performance < `u` ? performance.now() : Date.now(),
    M = await w.startRendering(),
    N = (typeof performance < `u` ? performance.now() : Date.now()) - j,
    P = !!b && b.cat === `sfx` && u.has(b.group);
  return {
    ..._(M, T),
    name: c,
    category: b ? b.cat : x.cue ? `music` : `ambience`,
    combat: P,
    baked: !!A,
    renderMs: Math.round(N),
  };
}
function _(e, t) {
  let n = e.sampleRate,
    r = e.length,
    i = e.getChannelData(0),
    a = e.numberOfChannels > 1 ? e.getChannelData(1) : i,
    o = 0,
    s = -1,
    c = -1;
  for (let e = 0; e < r; e++) {
    let t = Math.max(Math.abs(i[e]), Math.abs(a[e]));
    (t > o && (o = t), t > 0.001 && (s < 0 && (s = e), (c = e)));
  }
  let l = o;
  if (t && e.numberOfChannels >= 4) {
    let t = e.getChannelData(2),
      n = e.getChannelData(3);
    l = 0;
    for (let e = 0; e < r; e++) {
      let r = Math.max(Math.abs(t[e]), Math.abs(n[e]));
      r > l && (l = r);
    }
  }
  let u = 0,
    d = 0;
  if (s >= 0)
    for (let e = s; e <= c; e++) ((u += i[e] * i[e] + a[e] * a[e]), (d += 2));
  let f = d ? Math.sqrt(u / d) : 0,
    p = Math.floor(n * 0.01),
    m = 0,
    h = 0,
    g = -1e9,
    _ = 0;
  for (let e = 0; e + p <= r; e += p) {
    let t = 0;
    for (let n = e; n < e + p; n++) t += i[n] * i[n] + a[n] * a[n];
    ((t = Math.sqrt(t / (2 * p))),
      t > 0.01 && t > m * 1.8 + 0.004 && e - g > n * 0.05 && (h++, (g = e)),
      (m = m * 0.6 + t * 0.4));
  }
  for (let e = 1; e < r; e++)
    i[e - 1] < 0 != i[e] < 0 && Math.abs(i[e] - i[e - 1]) > 1e-4 && _++;
  let v = (e) => (e > 0 ? +(20 * Math.log10(e)).toFixed(1) : -1 / 0),
    x = b(i, a, s, c, n),
    S = y(i, a, s, c, n, 0),
    C = y(i, a, s, c, n, 350),
    w = 0;
  if (s >= 0) {
    for (let e = s; e <= c; e++) w += i[e] + a[e];
    w /= 2 * (c - s + 1);
  }
  return {
    peak: +o.toFixed(4),
    rms: +f.toFixed(4),
    durationSec: c >= 0 ? +((c + 1) / n).toFixed(3) : 0,
    rawPeak: +l.toFixed(4),
    peakDb: v(o),
    rmsDb: v(f),
    clipped: o >= 0.999,
    truncated: c >= r - Math.floor(n * 0.02),
    onsetsPerSec: +(h / (r / n)).toFixed(2),
    zcrHz: Math.round(_ / 2 / (r / n)),
    bands: x,
    lufs: S.integrated,
    lufsMax: S.momentaryMax,
    phone350: C.integrated,
    phoneDrop:
      Number.isFinite(S.integrated) && Number.isFinite(C.integrated)
        ? +(S.integrated - C.integrated).toFixed(1)
        : null,
    dcOffset: +w.toFixed(5),
  };
}
function v(e, t, n, r = 0.707) {
  let i = (2 * Math.PI * t) / n,
    a = Math.cos(i),
    o = Math.sin(i) / (2 * r),
    s,
    c,
    l,
    u = 1 + o,
    d = -2 * a,
    f = 1 - o;
  e === `lp`
    ? ((s = (1 - a) / 2), (c = 1 - a), (l = (1 - a) / 2))
    : ((s = (1 + a) / 2), (c = -(1 + a)), (l = (1 + a) / 2));
  let p = [s / u, c / u, l / u, d / u, f / u],
    m = 0,
    h = 0,
    g = 0,
    _ = 0;
  return (e) => {
    let t = p[0] * e + p[1] * m + p[2] * h - p[3] * g - p[4] * _;
    return ((h = m), (m = e), (_ = g), (g = t), t);
  };
}
function y(e, t, n, r, i, a = 0) {
  if (n < 0) return { integrated: -1 / 0, momentaryMax: -1 / 0 };
  let o = () => {
      let e = 0.7071752,
        t = Math.tan((Math.PI * 1681.97) / i),
        n = 10 ** (3.99984 / 20),
        r = n ** 0.4996667741545416,
        a = 1 + t / e + t * t,
        o = [
          (n + (r * t) / e + t * t) / a,
          (2 * (t * t - n)) / a,
          (n - (r * t) / e + t * t) / a,
        ],
        s = [(2 * (t * t - 1)) / a, (1 - t / e + t * t) / a],
        c = 0,
        l = 0,
        u = 0,
        d = 0;
      return (e) => {
        let t = o[0] * e + o[1] * c + o[2] * l - s[0] * u - s[1] * d;
        return ((l = c), (c = e), (d = u), (u = t), t);
      };
    },
    s = () => {
      let e = [o(), v(`hp`, 38, i, 0.5)];
      return (
        a > 0 && e.push(v(`hp`, a, i), v(`hp`, a, i)),
        (t) => {
          for (let n of e) t = n(t);
          return t;
        }
      );
    },
    c = s(),
    l = s(),
    u = Math.max(1, Math.floor(i / 10)),
    d = [],
    f = 0,
    p = 0,
    m = 0,
    h = 0;
  for (let i = n; i <= r; i++) {
    let n = c(e[i]),
      r = l(t[i]),
      a = n * n + r * r;
    if (((f += a), (p += a), ++m === u)) {
      (d.push(p / u), d.length > 4 && d.shift());
      let e = d.reduce((e, t) => e + t, 0) / d.length;
      (e > h && (h = e), (p = 0), (m = 0));
    }
  }
  if (m) {
    (d.push(p / m), d.length > 4 && d.shift());
    let e = d.reduce((e, t) => e + t, 0) / d.length;
    e > h && (h = e);
  }
  let g = (e) => (e > 0 ? +(-0.691 + 10 * Math.log10(e)).toFixed(1) : -1 / 0);
  return { integrated: g(f / (r - n + 1)), momentaryMax: g(h) };
}
function b(e, t, n, r, i) {
  if (n < 0) return null;
  let a = v(`lp`, 120, i),
    o = v(`hp`, 120, i),
    s = v(`lp`, 800, i),
    c = v(`hp`, 800, i),
    l = v(`lp`, 4e3, i),
    u = v(`hp`, 4e3, i),
    d = 0,
    f = 0,
    p = 0,
    m = 0,
    h = 0;
  for (let i = n; i <= r; i++) {
    let n = 0.5 * (e[i] + t[i]);
    h += n * n;
    let r = a(n);
    d += r * r;
    let g = s(o(n));
    f += g * g;
    let _ = l(c(n));
    p += _ * _;
    let v = u(n);
    m += v * v;
  }
  let g = (e) => (e > 0 && h > 0 ? +(10 * Math.log10(e / h)).toFixed(1) : -99);
  return { sub: g(d), low: g(f), mid: g(p), high: g(m) };
}
async function x({
  names: e = null,
  sampleRate: t = 44100,
  concurrency: n = 4,
  onProgress: r = null,
  baked: i = !1,
} = {}) {
  let a = (e && e.length ? e : m()).filter((e) => o[e] || f[e]),
    s = Array(a.length),
    c = 0,
    l = 0;
  return (
    await Promise.all(
      Array.from({ length: Math.max(1, Math.min(n, a.length)) }, async () => {
        for (; c < a.length; ) {
          let e = c++,
            n = a[e];
          try {
            s[e] = await g(n, { sampleRate: t, baked: i });
          } catch (t) {
            s[e] = { name: n, error: String((t && t.message) || t) };
          }
          if ((l++, r))
            try {
              r(l, a.length, n);
            } catch {}
        }
      }),
    ),
    Object.defineProperty(s, "summary", { value: S(s), enumerable: !1 }),
    s
  );
}
function S(e) {
  let t = e.filter((e) => e && !e.error),
    n = (e) => t.filter(e).map((e) => e.name),
    r = [...t].sort((e, t) => t.peak - e.peak);
  return {
    count: e.length,
    errors: e.filter((e) => e && e.error).map((e) => e.name + `: ` + e.error),
    maxPeak: r.length ? r[0].peak : 0,
    loudest: r.slice(0, 5).map((e) => `${e.name} ${e.peak}`),
    clipped: n((e) => e.clipped),
    hot: n((e) => e.peak > 0.9),
    silent: n((e) => e.peak < 0.005),
    rawOverUnity: n((e) => e.rawPeak > 1),
    truncated: n(
      (e) => e.truncated && e.category !== `music` && e.category !== `ambience`,
    ),
    combatMidBelow10dB: t
      .filter((e) => e.combat && e.bands && e.bands.mid < d)
      .map((e) => `${e.name} ${e.bands.mid}`),
    worstPhoneDrop: [...t]
      .filter((e) => e.combat && e.phoneDrop != null)
      .sort((e, t) => t.phoneDrop - e.phoneDrop)
      .slice(0, 6)
      .map((e) => `${e.name} -${e.phoneDrop} dB`),
  };
}
export { m as offlineTestNames, x as runOfflineTest };
