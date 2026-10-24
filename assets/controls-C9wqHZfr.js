import { C as e, D as t, O as n, w as r } from "./map-oE9sOnNc.js";
import { l as i } from "./index-DHK-Ptzs.js";
import { o as a } from "./height-CVtQdZ3e.js";
import { a as o, i as s, n as c, o as l } from "./unitRead-BVS0cQLI.js";
var u = (e, t) =>
    Array.isArray(e) ? e[Math.max(0, Math.min(e.length - 1, (t || 1) - 1))] : e,
  d = {
    flash: { type: `blink`, range: 4 },
    heal: { type: `buff`, range: 0, radius: 6 },
    smite: { type: `target`, range: 5, targets: `monster` },
    ignite: { type: `target`, range: 6, targets: `champion` },
  };
function f(e, r, a, o) {
  if (
    ((o.type = `none`),
    (o.range = 0),
    (o.radius = 0),
    (o.width = 0),
    (o.angle = 0),
    (o.level = 0),
    (o.ready = !1),
    (o.reason = ``),
    (o.name = ``),
    (o.element = ``),
    (o.needsAim = !1),
    (o.targets = `any`),
    (o.spellId = ``),
    !e || e.kind !== t.CHAMPION || !e.def)
  )
    return o;
  let s = n.indexOf(r),
    c = null;
  if (s >= 0) {
    let t = (c = e.def.abilities && e.def.abilities[s]),
      n = e.abilities && e.abilities[s];
    if (!t || !n) return o;
    let i = Math.max(1, n.level || 0);
    ((o.level = n.level || 0),
      (o.name = t.name || r),
      (o.element = t.element || ``),
      (o.type = t.type || `skillshot`),
      (o.range = +u(t.range, i) || 0),
      (o.radius = +u(t.radius, i) || 0),
      (o.width =
        o.type === `skillshot`
          ? 2 * (+u(t.width, i) || 0.6)
          : o.type === `line`
            ? +u(t.width, i) || 1.2
            : +u(t.width, i) || 0),
      (o.angle = +(t.angle || (o.type === `cone` ? 60 : 0))),
      (o.type === `dash` || o.type === `blink`) && (o.radius = o.radius || 0));
    let l = +u(t.cost || 0, i) || 0;
    (n.level
      ? a < n.cdEnd
        ? (o.reason = `cooldown`)
        : e.resource !== `none` &&
          e.mana < l &&
          (o.reason = e.resource === `energy` ? `energy` : `mana`)
      : (o.reason = `unlearned`),
      (o.needsAim =
        o.type !== `buff` && !(o.type === `aoe` && o.range <= 0.01)));
  } else if (r === `D` || r === `F`) {
    let t = e.spells && e.spells[r === `D` ? 0 : 1];
    if (!t) return o;
    let n = (i && i[t.id]) || {},
      s = d[t.id] || { type: n.type || `target`, range: n.range || 4 };
    ((o.spellId = t.id),
      (o.name = n.name || t.id),
      (o.type = n.type || s.type),
      (o.range = +(n.range ?? s.range) || 0),
      (o.radius = s.radius || 0),
      (o.targets = s.targets || `any`),
      (o.level = 1),
      a < t.cdEnd && (o.reason = `cooldown`),
      (o.needsAim = o.type !== `buff`));
  } else return o;
  let l = e.cc || {},
    f = o.type === `dash` || o.type === `blink` || !!(c && (c.dash || c.leap)),
    p = l.stunUntil > a || l.airborneUntil > a;
  return (
    e.alive
      ? s >= 0
        ? (p ||
            l.silenceUntil > a ||
            a < (e.castLockUntil || 0) ||
            (e.dash && (e.dash.displaced || e.dash.forced)) ||
            (f && l.rootUntil > a)) &&
          (o.reason = o.reason || `disabled`)
        : (p ||
            ((o.type === `blink` || o.spellId === `flash`) &&
              e.dash &&
              e.dash.displaced)) &&
          (o.reason = o.reason || `disabled`)
      : (o.reason = `dead`),
    (o.ready = o.reason === ``),
    o
  );
}
function p() {
  return {
    type: `none`,
    range: 0,
    radius: 0,
    width: 0,
    angle: 0,
    level: 0,
    ready: !1,
    reason: ``,
    name: ``,
    element: ``,
    needsAim: !1,
    targets: `any`,
    spellId: ``,
  };
}
var m = (e) =>
  e.kind === t.TOWER || e.kind === t.INHIBITOR || e.kind === t.NEXUS;
function h(e, n) {
  return (
    !!e &&
    e.alive &&
    e.kind !== t.PROJECTILE &&
    e.kind !== t.FOUNTAIN &&
    e.kind !== t.WARD &&
    !e.untargetable &&
    !e.invulnerable &&
    (!e.visible || e.visible[n] !== !1)
  );
}
function g(e, n, r, i, o, l, u = 8, d = !0, f = -1, p = -1) {
  let g = e.unitList,
    _ = n.e,
    v = n.l,
    y = n.t,
    b = n.w,
    x = n.h,
    S = Math.abs(n.camera.projectionMatrix.elements[5]) * 0.5 * x,
    C = null,
    w = 1e9;
  for (let e = 0; e < g.length; e++) {
    let n = g[e];
    if (n.id === f || !h(n, o) || (d && n.team === o)) continue;
    s(n, l);
    let T = c[0],
      E = c[1],
      D = c[8],
      O = c[9],
      k = _[3] * T + _[11] * E + _[15];
    if (k <= 1e-4) continue;
    let ee = S / k,
      A = v + (((_[0] * T + _[8] * E + _[12]) / k) * 0.5 + 0.5) * b,
      j = y + ((-(_[1] * T + _[9] * E + _[13]) / k) * 0.5 + 0.5) * x,
      M = k + _[7] * 10;
    if (M <= 1e-4) continue;
    let N =
        v + (((_[0] * T + _[4] * 10 + _[8] * E + _[12]) / M) * 0.5 + 0.5) * b,
      P =
        y + ((-(_[1] * T + _[5] * 10 + _[9] * E + _[13]) / M) * 0.5 + 0.5) * x,
      F = (D + 1.5) * Math.max(ee, S / M) + u + 24;
    if (
      r < (A < N ? A : N) - F ||
      r > (A > N ? A : N) + F ||
      i > (j > P ? j : P) + F + ee ||
      i < (j < P ? j : P) - F
    )
      continue;
    let I = a(T, E),
      L = _[3] * T + _[7] * I + _[11] * E + _[15];
    if (L <= 1e-4) continue;
    let R = (_[0] * T + _[4] * I + _[8] * E + _[12]) / L,
      z = (_[1] * T + _[5] * I + _[9] * E + _[13]) / L;
    if (R < -1.25 || R > 1.25 || z < -1.3 || z > 1.3) continue;
    let B = v + (R * 0.5 + 0.5) * b,
      V = y + (-z * 0.5 + 0.5) * x,
      H = I + Math.max(0.8, O * (m(n) ? 0.8 : 0.95)),
      U = _[3] * T + _[7] * H + _[11] * E + _[15];
    if (U <= 1e-4) continue;
    let W =
        v + (((_[0] * T + _[4] * H + _[8] * E + _[12]) / U) * 0.5 + 0.5) * b,
      te =
        y + ((-(_[1] * T + _[5] * H + _[9] * E + _[13]) / U) * 0.5 + 0.5) * x,
      G = Math.max(10, (S / L) * D * 0.95) + u,
      K = W - B,
      q = te - V,
      J = K * K + q * q,
      Y = J > 0 ? ((r - B) * K + (i - V) * q) / J : 0;
    Y = Y < 0 ? 0 : Y > 1 ? 1 : Y;
    let X = r - (B + K * Y),
      ne = i - (V + q * Y),
      Z = Math.sqrt(X * X + ne * ne);
    if (Z > G) continue;
    let Q =
      Z / G -
      (n.kind === t.CHAMPION ? 0.6 : 0) +
      (m(n) ? 0.3 : 0) -
      L * 1e-4 -
      (n.id === p ? 0.15 : 0);
    Q < w && ((w = Q), (C = n));
  }
  return C;
}
function _(e, n, r, i, a, o, l = `any`, u = 2.5) {
  let d = e.unitList,
    f = null,
    p = 1e9;
  for (let e = 0; e < d.length; e++) {
    let g = d[e];
    if (
      g.team === n.team ||
      !h(g, o) ||
      m(g) ||
      (l === `champion` && g.kind !== t.CHAMPION) ||
      (l === `monster` && g.kind !== t.MONSTER && g.kind !== t.MINION)
    )
      continue;
    s(g, 1);
    let _ = c[0] - r,
      v = c[1] - i,
      y = Math.sqrt(_ * _ + v * v) - c[8];
    if (y > a) continue;
    let b = y - (g.kind === t.CHAMPION ? u : 0);
    b < p && ((p = b), (f = g));
  }
  return f;
}
function v(e, n, r, i, a = !1) {
  let o = e.unitList,
    l = (n.stats && n.stats.ad) || 50,
    u = null,
    d = 1e9,
    f = null,
    p = 1e9;
  s(n, 1);
  let m = c[0],
    g = c[1],
    _ = c[8],
    v = n.damageMult || 1;
  for (let e = 0; e < o.length; e++) {
    let a = o[e];
    if (
      a.team === n.team ||
      (a.kind !== t.MINION && a.kind !== t.MONSTER) ||
      !h(a, i)
    )
      continue;
    s(a, 1);
    let y = c[0] - m,
      b = c[1] - g;
    if (Math.sqrt(y * y + b * b) - c[8] - _ > r) continue;
    let x = c[2],
      S = (a.stats && a.stats.armor) || 0;
    x <= ((l * 100) / (100 + Math.max(0, S))) * v * 0.98
      ? x < d && ((d = x), (u = a))
      : x < p && ((p = x), (f = a));
  }
  return u || (a ? null : f);
}
function y(e, t) {
  let n = e.x - t.x,
    r = e.y - t.y;
  return Math.sqrt(n * n + r * r) - (e.radius || 0) - (t.radius || 0);
}
function b(e, t, n, r) {
  let i = e.structures;
  if (!i) return null;
  let a = null,
    o = 1e9;
  for (let e = 0; e < i.length; e++) {
    let s = i[e];
    if (s.team === t.team || !m(s) || !h(s, r)) continue;
    let c = y(t, s);
    c > n || c >= o || ((o = c), (a = s));
  }
  return a;
}
function x(e, t, n, r) {
  let i = e.structures;
  if (!i) return null;
  let a = null,
    o = 1e9;
  for (let e = 0; e < i.length; e++) {
    let s = i[e];
    if (
      s.team === t.team ||
      !m(s) ||
      !s.alive ||
      !s.invulnerable ||
      (s.visible && s.visible[r] === !1)
    )
      continue;
    let c = y(t, s);
    c > n || c >= o || ((o = c), (a = s));
  }
  return a;
}
function S(e, n, r, i) {
  let a = e.unitList;
  for (let e = 0; e < a.length; e++) {
    let o = a[e];
    if (
      !(
        o.team === n.team ||
        m(o) ||
        o.kind === t.PROJECTILE ||
        o.kind === t.FOUNTAIN
      ) &&
      !(!o.alive || o.untargetable || o.invulnerable) &&
      !(o.visible && o.visible[i] === !1) &&
      y(n, o) <= r
    )
      return o;
  }
  return null;
}
function C(e, t, n, r) {
  return (
    (n !== `D` && n !== `F`) ||
    t.type !== `target` ||
    (!!r && y(e, r) <= t.range)
  );
}
var w = (e) =>
    !!e && (e.kind === t.TOWER || e.kind === t.INHIBITOR || e.kind === t.NEXUS),
  T = (e) => (e && e.stats && e.stats.attackRange) || 1.5,
  E = (e) => T(e) + 4,
  D = (e) => T(e) + 0.3;
function O(e, t, n) {
  let r = t && t.order;
  if (
    !r ||
    (r.type !== `attack` && r.type !== `attackMove`) ||
    !(r.targetId >= 0)
  )
    return null;
  let i = e.units.get(r.targetId);
  return i && i.team !== t.team && h(i, n) ? i : null;
}
function k(e, t, n) {
  let r = T(t),
    i = _(e, t, t.x, t.y, r + (t.radius || 0.5) + 0.3, n, `champion`, 0);
  return i && y(t, i) <= r + 0.3 ? i : null;
}
function ee(e, t, n) {
  return b(e, t, D(t), n);
}
function A(e, t, n) {
  let r = E(t);
  return S(e, t, r, n) ? r : D(t);
}
function j() {
  return {
    action: `nearest`,
    structure: null,
    advise: ``,
    protectedNear: null,
  };
}
function M(e, t, n, r, i) {
  let a = i || j();
  if (
    ((a.action = `nearest`),
    (a.structure = null),
    (a.advise = ``),
    (a.protectedNear = null),
    !e || !t || !t.alive)
  )
    return a;
  let o = E(t),
    s = b(e, t, o, n);
  s || (a.protectedNear = x(e, t, o, n));
  let c = k(e, t, n);
  if (s && !c) {
    let i = O(e, t, n),
      c = r && r.lockId != null ? r.lockId : -1;
    if (c >= 0 && i && i.id === c && w(i))
      return ((a.action = `structure`), (a.structure = i), a);
    let l = !!(r && r.repeat) && !(i && w(i)),
      u = !S(e, t, o, n);
    if (l || (u && y(t, s) <= D(t)))
      return ((a.action = `structure`), (a.structure = s), a);
  }
  return (
    (a.advise = s ? `tapTurret` : a.protectedNear ? `turretProtected` : ``),
    a
  );
}
var N = `
.svc-root { position: fixed; right: 12px; top: 72px; transform-origin: 100% 0; z-index: 3; pointer-events: none;
  font-family: "Avenir Next", "Segoe UI", "Helvetica Neue", system-ui, sans-serif; color: #eef3f8; -webkit-font-smoothing: antialiased;
  user-select: none; -webkit-user-select: none; opacity: 0; visibility: hidden; transition: opacity .18s ease-out, visibility 0s linear .18s; }
.svc-root.on { opacity: 1; visibility: visible; pointer-events: auto; transition: opacity .14s ease-out, visibility 0s; }
.svc-root[data-mounted="hud"] { position: relative; right: auto; top: auto; transform: none !important; z-index: 20; opacity: 1; visibility: visible; pointer-events: auto; }
.svc-root[data-mounted="hud"].off { opacity: 0; visibility: hidden; pointer-events: none; }
.svc-root button { font: inherit; color: inherit; background: none; border: 0; padding: 0; margin: 0; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.svc-root .svc-chip { display: flex; align-items: center; gap: 9px; height: 28px; padding: 0 7px 0 11px; border-radius: 3px; margin-left: auto;
  background: linear-gradient(180deg, rgba(30, 44, 62, .94), rgba(10, 17, 28, .94));
  box-shadow: inset 0 0 0 1px rgba(214, 176, 106, .46), inset 0 1px 0 rgba(255, 240, 210, .08), 0 2px 8px rgba(0, 0, 0, .45); }
.svc-root .svc-chip:hover { filter: brightness(1.15); }
.svc-root.open .svc-chip { box-shadow: inset 0 0 0 1px rgba(246, 223, 164, .85), 0 2px 8px rgba(0, 0, 0, .45); }
.svc-root .svc-lab { line-height: 1; font-weight: 700; font-size: 10px; letter-spacing: .2em; color: #c9d3de; }
.svc-root .svc-val { font-weight: 700; font-size: 11.5px; letter-spacing: .06em; color: #f6dfa4; white-space: nowrap; }
.svc-root[data-mounted="hud"]:not(:hover):not(.open) .svc-val, .svc-root[data-mounted="hud"]:not(:hover):not(.open) .svc-esc { display: none; }
.svc-root .svc-panel { position: absolute; right: 0; top: 34px; width: 300px; padding: 11px 11px 10px; border-radius: 5px; display: none; overflow-y: auto; overscroll-behavior: contain;
  background: linear-gradient(180deg, rgba(20, 32, 48, .97), rgba(8, 14, 23, .97)); scrollbar-width: thin; scrollbar-color: rgba(214, 176, 106, .4) transparent;
  box-shadow: inset 0 1px 0 rgba(255, 240, 210, .08), inset 0 0 0 1px rgba(214, 176, 106, .38), 0 12px 30px rgba(0, 0, 0, .55); }
.svc-root.open .svc-panel { display: block; }
.svc-root .svc-h { font-weight: 700; font-size: 10.5px; letter-spacing: .22em; color: #d6b06a; margin: 1px 2px 8px; }
.svc-root .svc-opt { display: block; width: 100%; text-align: left; position: relative; padding: 7px 9px 7px 28px; border-radius: 4px; margin-bottom: 4px;
  background: rgba(255, 255, 255, .025); box-shadow: inset 0 0 0 1px rgba(150, 180, 210, .14); }
.svc-root .svc-opt:hover { background: rgba(120, 190, 255, .07); }
.svc-root .svc-opt::before { content: ''; position: absolute; left: 10px; top: 11px; width: 9px; height: 9px; border-radius: 50%;
  box-shadow: inset 0 0 0 1.5px rgba(160, 180, 200, .55); }
.svc-root .svc-opt[aria-checked="true"] { background: linear-gradient(90deg, rgba(214, 176, 106, .16), rgba(214, 176, 106, .03)); box-shadow: inset 0 0 0 1px rgba(214, 176, 106, .7); }
.svc-root .svc-opt[aria-checked="true"]::before { background: radial-gradient(circle, #fff4d2 0 28%, #d6b06a 34% 62%, transparent 66%); box-shadow: inset 0 0 0 1.5px #f6dfa4, 0 0 8px rgba(246, 223, 164, .55); }
.svc-root .svc-ot { display: block; font-weight: 700; font-size: 12.5px; color: #eef3f8; }
.svc-root .svc-od { display: block; margin-top: 2px; font-size: 11px; line-height: 1.3; color: #93a1b2; }
.svc-root .svc-tag { margin-left: 7px; font-size: 9px; font-weight: 700; letter-spacing: .16em; color: #7fd6ff; vertical-align: 1px; }
.svc-root .svc-sep { height: 1px; margin: 9px 2px 8px; background: linear-gradient(90deg, transparent, rgba(214, 176, 106, .35), transparent); }
.svc-root .svc-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 0 2px 6px; font-size: 11.5px; color: #c6d0db; }
.svc-root .svc-keys { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; justify-content: flex-end; }
.svc-root .svc-k { display: inline-block; min-width: 19px; height: 19px; padding: 0 5px; border-radius: 3px; text-align: center; font-weight: 700; font-size: 10.5px; line-height: 19px; color: #eef3f8;
  background: linear-gradient(180deg, #2a3a50, #152131); box-shadow: inset 0 0 0 1px rgba(170, 195, 220, .28), 0 1px 0 rgba(0, 0, 0, .6); }
.svc-root .svc-chip .svc-k { height: 17px; line-height: 17px; font-size: 9.5px; min-width: 0; padding: 0 5px; color: #aeb9c6; letter-spacing: .06em; }
.svc-root .svc-plus, .svc-root .svc-or { font-size: 10.5px; color: #6c7a8b; }
.svc-root .svc-fs { display: block; width: 100%; margin-top: 3px; padding: 7px 10px; border-radius: 4px; text-align: center; font-weight: 700; font-size: 10.5px; letter-spacing: .18em; color: #f6dfa4;
  background: linear-gradient(180deg, rgba(40, 56, 76, .9), rgba(16, 26, 40, .9)); box-shadow: inset 0 0 0 1px rgba(214, 176, 106, .55); }
.svc-root .svc-fs:hover { filter: brightness(1.2); }
.svc-root .svc-note { display: block; margin-top: 5px; font-size: 10.5px; color: #7d8b9c; text-align: center; }
/* touch: the chip is replaced by input's own MENU button (touchActions.js), the panel opens from there */
.svc-root.touch .svc-chip { display: none; }
.svc-root.touch { right: 0; top: 0; transform: none !important; }
/* a phone opens this as a sheet in the middle of the screen, not a corner popover clamped under the ability arc */
.svc-root.touch .svc-panel { position: fixed; left: 50%; top: 50%; translate: -50% -50%; right: auto !important;
  width: min(300px, 86vw); max-height: 84vh !important; padding: 10px 10px 9px; }
.svc-root .svc-tog { display: flex; align-items: center; justify-content: space-between; gap: 10px; width: 100%; text-align: left; padding: 7px 9px; border-radius: 4px; margin-bottom: 4px;
  background: rgba(255, 255, 255, .025); box-shadow: inset 0 0 0 1px rgba(150, 180, 210, .14); }
.svc-root .svc-tog:hover { background: rgba(120, 190, 255, .07); }
.svc-root .svc-tog .svc-ot { font-size: 12px; }
.svc-root .svc-state { font-weight: 800; font-size: 10.5px; letter-spacing: .16em; color: #f6dfa4; }
.svc-root .svc-state[data-off] { color: #8ea0b3; }
.svc-root .svc-acts { display: flex; gap: 6px; margin-top: 6px; }
.svc-root .svc-act { flex: 1; padding: 8px 6px; border-radius: 4px; text-align: center; font-weight: 800; font-size: 10.5px; letter-spacing: .14em; color: #eaf1f8;
  background: linear-gradient(180deg, rgba(40, 56, 76, .9), rgba(16, 26, 40, .9)); box-shadow: inset 0 0 0 1px rgba(150, 180, 210, .3); }
.svc-root .svc-act:hover { filter: brightness(1.2); }
.svc-root .svc-act.svc-leave { color: #ffc9be; box-shadow: inset 0 0 0 1px rgba(255, 120, 100, .45); }
`,
  P = {
    quick: {
      short: `Quick`,
      title: `Quick cast`,
      desc: `Casts at the cursor the moment the key goes down.`,
    },
    indicator: {
      short: `Quick + Indicator`,
      title: `Quick cast with indicator`,
      desc: `Hold the key to aim, release to cast.`,
    },
    normal: {
      short: `Normal`,
      title: `Normal cast`,
      desc: `Press to aim, left-click or press again to cast.`,
    },
  },
  F = 8,
  I = 40,
  L = (e, t, n) => {
    let r = document.createElement(e);
    return (t && (r.className = t), n != null && (r.textContent = n), r);
  },
  R = () => ({ left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 }),
  z = (e, t, n, r, i) => (
    (e.left = t),
    (e.top = n),
    (e.right = r),
    (e.bottom = i),
    (e.width = r - t),
    (e.height = i - n),
    e
  ),
  B = class {
    constructor(e) {
      if (
        ((this.c = e),
        (this.app = e.app),
        (this.open = !1),
        (this.visible = !1),
        (this.mountedHud = !1),
        (this.posT = 0),
        (this.layoutT = 0),
        (this.introT = 0),
        (this.scale = 1),
        (this._lastState = ``),
        (this._near = !1),
        (this._hudMenu = null),
        (this._hudMenuT = -1e4),
        (this._touch = !1),
        (this.occluders = [R(), R()]),
        (this.occluderCount = 0),
        (this.chipRect = R()),
        (this.panelShift = 0),
        (this.panelMax = 0),
        !document.getElementById(`svc-css`))
      ) {
        let e = document.createElement(`style`);
        ((e.id = `svc-css`), (e.textContent = N), document.head.appendChild(e));
      }
      let t = (this.root = L(`div`, `svc-root`));
      t.setAttribute(`data-controls-settings-ui`, ``);
      let n = (this.chip = L(`button`, `svc-chip`));
      ((n.type = `button`),
        n.setAttribute(`aria-haspopup`, `dialog`),
        n.setAttribute(`aria-label`, `Controls settings (Esc)`),
        n.append(
          L(`span`, `svc-lab`, `CONTROLS`),
          (this.chipVal = L(`span`, `svc-val`, ``)),
          L(`span`, `svc-k svc-esc`, `ESC`),
        ));
      let r = (this.panel = L(`div`, `svc-panel`));
      (r.setAttribute(`role`, `dialog`),
        r.setAttribute(`aria-label`, `Controls`),
        r.append(L(`div`, `svc-h`, `ABILITY CASTING`)),
        (this.opts = {}));
      for (let t of e.castModes) {
        let e = L(`button`, `svc-opt`);
        ((e.type = `button`),
          e.setAttribute(`role`, `radio`),
          e.setAttribute(`data-cast-mode`, t));
        let n = L(`span`, `svc-ot`, P[t].title);
        (t === `indicator` && n.append(L(`span`, `svc-tag`, `DEFAULT`)),
          e.append(n, L(`span`, `svc-od`, P[t].desc)),
          e.addEventListener(`click`, (n) => {
            (this.c.setCastMode(t), e.blur(), n.stopPropagation());
          }),
          (this.opts[t] = e),
          r.append(e));
      }
      let i = (this.autoBtn = L(`button`, `svc-tog`));
      ((i.type = `button`),
        i.setAttribute(`role`, `switch`),
        i.setAttribute(`data-auto-level`, ``));
      let a = L(`span`, `svc-ot`, `Auto level abilities`);
      (a.append(
        L(
          `span`,
          `svc-od`,
          `Off: spend points yourself with the chord below or the + on a button.`,
        ),
      ),
        (this.autoState = L(`span`, `svc-state`, `ON`)),
        i.append(a, this.autoState),
        i.addEventListener(`click`, (e) => {
          (this.toggleAutoLevel(), i.blur(), e.stopPropagation());
        }),
        r.append(L(`div`, `svc-sep`), i));
      let o = (e, t) => {
        let n = L(`div`, `svc-row`),
          i = L(`span`, `svc-keys`);
        return (
          n.append(L(`span`, null, e), i),
          this.fillKeys(i, t),
          r.append(n),
          i
        );
      };
      ((this.levelKeys = o(`Level up ability`, [])),
        o(`Cancel aim`, [[`Right-click`], `or`, [`Esc`]]),
        o(`Attack, champions first`, [`hold`, [`Space`]]),
        o(`Last hit`, [[`Shift`, `Space`], `or`, [`C`]]),
        o(`Attack move`, [[`A`], `+`, [`Click`]]),
        o(`Attack turret`, [[`T`], `or tap`, [`Space`], `again`]),
        o(`Ping at cursor`, [[`G`]]),
        o(`Ward / potion`, [[`4`], `or`, [`1`]]),
        o(`Look elsewhere`, [`drag`, [`Minimap`]]));
      let s = (this.acts = L(`div`, `svc-acts`));
      ((this.pauseBtn = L(`button`, `svc-act`, `PAUSE`)),
        (this.pauseBtn.type = `button`),
        this.pauseBtn.setAttribute(`data-pause`, ``),
        this.pauseBtn.addEventListener(`click`, (e) => {
          (this.setPaused(!this.app.paused),
            this.pauseBtn.blur(),
            e.stopPropagation());
        }),
        (this.closeBtn = L(`button`, `svc-act`, `CLOSE`)),
        (this.closeBtn.type = `button`),
        this.closeBtn.setAttribute(`data-close`, ``),
        this.closeBtn.addEventListener(`click`, (e) => {
          (this.setOpen(!1), e.stopPropagation());
        }),
        (this.leaveBtn = L(`button`, `svc-act svc-leave`, `LEAVE MATCH`)),
        (this.leaveBtn.type = `button`),
        this.leaveBtn.setAttribute(`data-leave`, ``),
        this.leaveBtn.addEventListener(`click`, (e) => {
          (this.leave(), e.stopPropagation());
        }),
        s.append(this.closeBtn, this.pauseBtn, this.leaveBtn),
        r.append(s),
        (this.fsBtn = L(`button`, `svc-fs`, `ENTER FULLSCREEN`)),
        (this.fsBtn.type = `button`),
        this.fsBtn.addEventListener(`click`, (e) => {
          (this.c.toggleFullscreen(), this.fsBtn.blur(), e.stopPropagation());
        }),
        (this.fsNote = L(
          `span`,
          `svc-note`,
          `Fullscreen also enables Ctrl + Q W E R`,
        )),
        r.append(this.fsBtn, this.fsNote),
        t.append(n, r),
        n.addEventListener(`click`, (e) => {
          (this.setOpen(!this.open), n.blur(), e.stopPropagation());
        }),
        t.addEventListener(`pointerdown`, (e) => e.stopPropagation()),
        t.addEventListener(`contextmenu`, (e) => {
          (e.preventDefault(), e.stopPropagation());
        }),
        (this._outside = (e) => {
          if (!this.open) return;
          let n = e.target;
          t.contains(n) ||
            (n && n.closest && n.closest(`[data-input-action]`)) ||
            this.setOpen(!1);
        }),
        (this._escCapture = (e) => {
          e.code === `Escape` &&
            ((e.__svcOpen = this.open),
            (e.__svcPanel = this.app.ui ? this.app.ui.panel : `none`));
        }),
        window.addEventListener(`pointerdown`, this._outside, !0),
        window.addEventListener(`keydown`, this._escCapture, !0),
        (this.fine =
          typeof matchMedia == `function`
            ? matchMedia(`(hover: hover) and (pointer: fine)`)
            : null),
        (this.coarse =
          typeof matchMedia == `function`
            ? matchMedia(`(pointer: coarse)`)
            : null),
        this.mount(),
        this.sync());
    }
    fillKeys(e, t) {
      e.textContent = ``;
      for (let n of t) {
        if (typeof n == `string`) {
          e.append(L(`span`, n === `+` ? `svc-plus` : `svc-or`, n));
          continue;
        }
        n.forEach((t, n) => {
          (n && e.append(L(`span`, `svc-plus`, `+`)),
            e.append(L(`span`, `svc-k`, t)));
        });
      }
    }
    mount() {
      let e = document.querySelector(`#hud-root [data-controls-settings]`);
      if (e) {
        (this.root.parentNode !== e && e.appendChild(this.root),
          this.root.setAttribute(`data-mounted`, `hud`),
          (this.mountedHud = !0),
          (this.root.style.cssText = ``));
        return;
      }
      ((this.mountedHud = !1),
        this.root.removeAttribute(`data-mounted`),
        this.root.parentNode !== document.body &&
          document.body.appendChild(this.root));
    }
    available() {
      return (
        this.app.state === `game` &&
        !(this.app.ui && this.app.ui.panel !== `none`) &&
        !this.hudMenuBtn()
      );
    }
    hudMenuBtn(e = !1) {
      let t = performance.now();
      if (!e && t - this._hudMenuT < 400) return this._hudMenu;
      this._hudMenuT = t;
      let n = document.getElementById(`hud-root`),
        r = n && n.querySelector(`[data-open-menu]`),
        i = r && r.getBoundingClientRect();
      return (
        (this._hudMenu = i && i.width > 4 && i.height > 4 ? r : null),
        this._hudMenu
      );
    }
    isTouch() {
      let e = this.app.params;
      return e && e.get && e.get(`touchui`) === `1`
        ? !0
        : !!(this.coarse && this.coarse.matches) ||
            (typeof window < `u` && `ontouchstart` in window);
    }
    toggleFromKey() {
      if (
        this.app.state !== `game` ||
        (this.app.ui && this.app.ui.panel !== `none`)
      )
        return !1;
      let e = this.hudMenuBtn(!0);
      return e ? (e.click(), !0) : (this.setOpen(!this.open), !0);
    }
    toggleAutoLevel() {
      let e = this.app.world,
        t = e && e.units.get(this.app.playerId);
      if (!t) return !1;
      let n = t.autoLevel === !1,
        r = this.c.C.auto;
      r.on = !n;
      let i = !!e.command(this.app.playerId, r);
      return (this.sync(), i);
    }
    setPaused(e) {
      ((this.app.paused = !!e), this.sync());
    }
    leave() {
      ((this.app.paused = !1),
        this.setOpen(!1),
        !this.app.scenario &&
          ((this.app.state = `menu`), this.app.fire(`state`, `menu`)));
    }
    setOpen(e) {
      ((e = !!e),
        e !== this.open &&
          ((this.open = e),
          this.root.classList.toggle(`open`, e),
          this.chip.setAttribute(`aria-expanded`, String(e)),
          e
            ? ((this.layoutT = 0),
              (this.posT = 0),
              (this.introT = 0),
              this.show(!0),
              this.layoutPanel(),
              this.measure())
            : ((this.panel.style.right = ``),
              (this.panel.style.maxHeight = ``),
              (this.panelShift = 0),
              (this.panelMax = 0),
              this.measure())));
    }
    show(e) {
      e !== this.visible &&
        ((this.visible = e),
        this.mountedHud
          ? this.root.classList.toggle(`off`, !e)
          : this.root.classList.toggle(`on`, e),
        e
          ? this.measure()
          : ((this.occluderCount = 0), this.open && this.setOpen(!1)));
    }
    sync() {
      let e = this.c.settings.castMode;
      this.chipVal.textContent = P[e] ? P[e].short : e;
      for (let t in this.opts)
        this.opts[t].setAttribute(`aria-checked`, String(t === e));
      let t = this.c.levelUpModifier;
      this._mod !== t &&
        ((this._mod = t),
        this.fillKeys(this.levelKeys, [[t], `+`, [`Q`], [`W`], [`E`], [`R`]]));
      let n = this.app.world,
        r = n && n.units.get(this.app.playerId),
        i = !r || r.autoLevel !== !1;
      this._auto !== i &&
        ((this._auto = i),
        (this.autoState.textContent = i ? `ON` : `OFF`),
        i
          ? this.autoState.removeAttribute(`data-off`)
          : this.autoState.setAttribute(`data-off`, ``),
        this.autoBtn.setAttribute(`aria-checked`, String(i)));
      let a = !!this.app.paused;
      this._paused !== a &&
        ((this._paused = a),
        (this.pauseBtn.textContent = a ? `RESUME` : `PAUSE`));
      let o = !!this.app.scenario;
      this._scen !== o &&
        ((this._scen = o), (this.acts.style.display = o ? `none` : ``));
      let s = !!document.fullscreenElement;
      ((this.fsBtn.textContent = s ? `EXIT FULLSCREEN` : `ENTER FULLSCREEN`),
        (this.fsNote.textContent = s
          ? this.c.keyboardLocked
            ? `Keyboard locked: Ctrl + Q W E R levels up`
            : `Keyboard Lock unavailable in this browser`
          : `Fullscreen also enables Ctrl + Q W E R`),
        this.open && (this.layoutT = 0));
    }
    hudRects() {
      let e = this.app.registry && this.app.registry.get(`hud`);
      if (!e || typeof e.rects != `function`) return null;
      try {
        let t = e.rects();
        return Array.isArray(t) ? t : null;
      } catch {
        return null;
      }
    }
    measure() {
      let e = 0;
      if (this.visible) {
        let t = this.chip.getBoundingClientRect();
        if (
          (t.width > 0 &&
            (z(this.occluders[e++], t.left, t.top, t.right, t.bottom),
            z(this.chipRect, t.left, t.top, t.right, t.bottom)),
          this.open)
        ) {
          let t = this.panel.getBoundingClientRect();
          t.width > 0 &&
            z(this.occluders[e++], t.left, t.top, t.right, t.bottom);
        }
      }
      this.occluderCount = e;
    }
    layoutPanel() {
      if (!this.open) return;
      if (this._touch) {
        ((this.panel.style.right = ``),
          (this.panel.style.maxHeight = ``),
          (this.panelShift = 0),
          (this.panelMax = 0));
        return;
      }
      let e = this.panel;
      ((e.style.right = `0px`), (e.style.maxHeight = ``));
      let t = e.getBoundingClientRect();
      if (t.width <= 0) return;
      let n = this.hudRects(),
        r = innerWidth,
        i = innerHeight,
        a = this.mountedHud ? 1 : this.scale,
        o = 0,
        s = 0,
        c = (e, t, a, o) => {
          let s = 1 / 0,
            c = 1 / 0,
            l = !1;
          if (n)
            for (let u = 0; u < n.length; u++) {
              let d = n[u];
              (d.width >= r * 0.9 && d.height >= i * 0.9) ||
                (d.top <= 6 && d.right >= r - 3) ||
                (a > d.left &&
                  e < d.right &&
                  o > d.top &&
                  t < d.bottom &&
                  ((l = !0),
                  d.left < s && (s = d.left),
                  d.top < c && (c = d.top)));
            }
          return l
            ? ((this._hit = this._hit || { left: 0, top: 0 }),
              (this._hit.left = s),
              (this._hit.top = c),
              this._hit)
            : null;
        },
        l = c(t.left, t.top, t.right, Math.min(i - 8, t.bottom));
      if (l) {
        let e = t.right - l.left + 10,
          n = t.left - e;
        n >= 8 && !c(n, t.top, t.right - e, Math.min(i - 8, t.bottom))
          ? (o = e)
          : (s = Math.max(120, l.top - t.top - 10));
      }
      (!l && t.bottom > i - 8 && (s = Math.max(120, i - 8 - t.top)),
        (this.panelShift = o),
        (this.panelMax = s),
        (e.style.right = o ? `${(o / a).toFixed(1)}px` : `0px`),
        (e.style.maxHeight = s ? `${(s / a).toFixed(1)}px` : ``));
    }
    update(e) {
      let t = this.available(),
        n = e.dt || 0;
      if (e.state === `game` && this._lastState !== `game`) {
        let t = e.world;
        !this.app.scenario && t && t.time < 30 && (this.introT = F);
      }
      if (
        ((this._lastState = e.state), this.introT > 0 && (this.introT -= n), !t)
      ) {
        ((this.introT = 0), this.show(!1));
        return;
      }
      let r = this.isTouch();
      if (
        (this._touch !== r &&
          ((this._touch = r), this.root.classList.toggle(`touch`, r)),
        this.mountedHud ||
          ((this.posT -= n),
          this.posT <= 0 &&
            ((this.posT = 0.5), this.mount(), this.mountedHud || this.place())),
        this.mountedHud)
      )
        this.show(!0);
      else if (r) this.show(this.open);
      else {
        let e = this.c.mouse,
          t = this.chipRect,
          n = !1;
        (e &&
          e.known &&
          t.width > 0 &&
          (n =
            e.x > t.left - I &&
            e.x < t.right + I &&
            e.y > t.top - I &&
            e.y < t.bottom + I),
          (this._near = n),
          this.show(this.open || n || this.introT > 0));
      }
      this.visible &&
        ((this.layoutT -= n),
        this.layoutT <= 0 &&
          ((this.layoutT = this.open ? 0.12 : 0.3),
          this.open && this.layoutPanel(),
          this.measure()));
    }
    place() {
      let e = this.hudRects(),
        t = this.app.registry && this.app.registry.get(`hud`),
        n = innerWidth,
        r = innerHeight,
        i = 12,
        a = 72;
      if (e)
        for (let t = 0; t < e.length; t++) {
          let o = e[t];
          if (o.right >= n - 3 && o.top <= 6 && o.height < r * 0.3) {
            ((i = Math.max(8, n - o.right + 12)), (a = o.bottom + 10));
            break;
          }
        }
      let o = Math.max(0.72, Math.min(1.5, t && t.s ? t.s : r / 1080));
      ((this.scale = o), (this._anchorTop = a));
      let s = this.root.style,
        c = i + `px`,
        l = a + `px`,
        u = `scale(${o.toFixed(3)})`;
      (s.right !== c && (s.right = c),
        s.top !== l && (s.top = l),
        s.transform !== u && (s.transform = u));
      let d = this.chip.getBoundingClientRect();
      d.width > 0 && z(this.chipRect, d.left, d.top, d.right, d.bottom);
    }
    dispose() {
      (window.removeEventListener(`pointerdown`, this._outside, !0),
        window.removeEventListener(`keydown`, this._escCapture, !0),
        this.root.remove());
    }
  },
  V = `
.sva-root { position: fixed; left: 0; top: 0; width: 0; height: 0; z-index: 4; pointer-events: none;
  font-family: "Avenir Next", "Segoe UI", "Helvetica Neue", system-ui, sans-serif; color: #eef3f8; -webkit-font-smoothing: antialiased;
  user-select: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent; }
.sva-btn { position: fixed; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px;
  border: 0; margin: 0; padding: 0; border-radius: 50%; pointer-events: auto; touch-action: none; cursor: pointer;
  font: inherit; color: #eaf1f8; opacity: 0; visibility: hidden; transition: opacity .16s ease-out, visibility 0s linear .16s, transform .08s ease-out;
  background: radial-gradient(circle at 50% 34%, rgba(46, 64, 86, .96), rgba(10, 17, 27, .96));
  box-shadow: inset 0 0 0 1.5px rgba(214, 176, 106, .55), inset 0 2px 0 rgba(255, 243, 214, .10), 0 3px 10px rgba(0, 0, 0, .5); }
.sva-root.on .sva-btn { opacity: 1; visibility: visible; transition: opacity .14s ease-out, visibility 0s, transform .08s ease-out; }
.sva-btn[data-pressed] { transform: scale(.92); box-shadow: inset 0 0 0 2px rgba(246, 223, 164, .95), 0 0 14px rgba(246, 223, 164, .45); }
.sva-btn[data-armed] { box-shadow: inset 0 0 0 2px rgba(120, 226, 168, .95), 0 0 16px rgba(80, 220, 150, .45); }
.sva-btn[data-off] { opacity: .42; }
/* an ability description is open (long press): the column steps out of the way — the HUD anchors that box just left of
   the ability arc, which is exactly where this column lives, and the buttons were printed across its text */
.sva-root.on.reading .sva-btn { opacity: 0; visibility: hidden; pointer-events: none; transition: opacity .12s ease-out, visibility 0s linear .12s; }
.sva-root.on .sva-btn[data-off] { opacity: .42; }
.sva-lab { font-weight: 800; letter-spacing: .06em; line-height: 1; text-shadow: 0 1px 2px rgba(0, 0, 0, .8); }
.sva-sub { font-weight: 700; line-height: 1; color: #f6dfa4; text-shadow: 0 1px 2px rgba(0, 0, 0, .8); }
.sva-btn[data-off] .sva-sub { color: #93a1b2; }
.sva-menu { border-radius: 4px; flex-direction: row; gap: 5px;
  background: linear-gradient(180deg, rgba(30, 44, 62, .94), rgba(10, 17, 28, .94));
  box-shadow: inset 0 0 0 1px rgba(214, 176, 106, .5), 0 2px 8px rgba(0, 0, 0, .45); }
`,
  H = [`lasthit`, `tower`, `ward`, `potion`, `ping`],
  U = {
    lasthit: `LH`,
    tower: `TWR`,
    ward: `WARD`,
    potion: `HP`,
    ping: `PING`,
    menu: `MENU`,
  },
  W = {
    lasthit: `Last hit (hold): attack a minion your next hit kills`,
    tower: `Attack the nearest enemy turret`,
    ward: `Place a vision ward`,
    potion: `Drink your consumable`,
    ping: `Ping your position`,
    menu: `Controls & settings`,
  },
  te = () => ({ left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 }),
  G = 44,
  K = class {
    constructor(e) {
      if (
        ((this.c = e),
        (this.app = e.app),
        (this.visible = !1),
        (this.layoutT = 0),
        (this.scale = 1),
        (this.btns = {}),
        (this.reading = !1),
        (this.tipEl = null),
        (this.occluders = []),
        (this.occluderCount = 0),
        (this._held = null),
        (this._pointerId = -1),
        (this._nextRepeat = 0),
        (this.coarse =
          typeof matchMedia == `function`
            ? matchMedia(`(pointer: coarse)`)
            : null),
        !document.getElementById(`sva-css`))
      ) {
        let e = document.createElement(`style`);
        ((e.id = `sva-css`), (e.textContent = V), document.head.appendChild(e));
      }
      let t = (this.root = document.createElement(`div`));
      ((t.className = `sva-root`), t.setAttribute(`data-input-actions`, ``));
      for (let e of H.concat(`menu`)) {
        let n = document.createElement(`button`);
        ((n.type = `button`),
          (n.className = `sva-btn` + (e === `menu` ? ` sva-menu` : ``)),
          n.setAttribute(`data-input-action`, e),
          n.setAttribute(`aria-label`, W[e]),
          (n.title = W[e]));
        let r = document.createElement(`span`);
        ((r.className = `sva-lab`), (r.textContent = U[e]));
        let i = document.createElement(`span`);
        ((i.className = `sva-sub`),
          (i.textContent = ``),
          n.append(r, i),
          (n.__lab = r),
          (n.__sub = i),
          (n.__subText = ``),
          (n.__off = !1),
          (n.__armed = !1),
          (this.btns[e] = n),
          this.occluders.push(te()),
          t.append(n));
      }
      (document.body.appendChild(t),
        (this._down = (e) => this.onDown(e)),
        (this._up = (e) => this.onUp(e)),
        t.addEventListener(`pointerdown`, this._down),
        t.addEventListener(`contextmenu`, (e) => {
          (e.preventDefault(), e.stopPropagation());
        }),
        window.addEventListener(`pointerup`, this._up),
        window.addEventListener(`pointercancel`, this._up));
    }
    wanted() {
      if (
        this.app.state !== `game` ||
        (this.app.ui && this.app.ui.panel !== `none`)
      )
        return !1;
      let e = this.app.params;
      return e && e.get && e.get(`touchui`) === `1`
        ? !0
        : !!(this.coarse && this.coarse.matches) || `ontouchstart` in window;
    }
    onDown(e) {
      let t =
        e.target && e.target.closest
          ? e.target.closest(`[data-input-action]`)
          : null;
      if (!t || !this.visible) return;
      (e.preventDefault(), e.stopPropagation(), this._held && this.release());
      let n = t.getAttribute(`data-input-action`);
      ((this._held = n),
        (this._pointerId = e.pointerId),
        (this._nextRepeat = performance.now() / 1e3 + 0.32),
        t.setAttribute(`data-pressed`, ``));
      try {
        t.setPointerCapture(e.pointerId);
      } catch {}
      this.c.doAction(n, !0);
    }
    onUp(e) {
      this._held &&
        (e === void 0 ||
          e.pointerId === this._pointerId ||
          e.pointerId === void 0) &&
        this.release();
    }
    release() {
      let e = this._held;
      if (!e) return;
      ((this._held = null), (this._pointerId = -1));
      let t = this.btns[e];
      (t && t.removeAttribute(`data-pressed`), this.c.endAction(e));
    }
    pump(e) {
      let t = this._held;
      t &&
        (t === `lasthit` || t === `tower`) &&
        (e < this._nextRepeat ||
          ((this._nextRepeat = e + 0.2), this.c.doAction(t, !1)));
    }
    setSub(e, t) {
      e.__subText !== t && ((e.__subText = t), (e.__sub.textContent = t));
    }
    setOff(e, t) {
      e.__off !== t &&
        ((e.__off = t),
        t ? e.setAttribute(`data-off`, ``) : e.removeAttribute(`data-off`));
    }
    setArmed(e, t) {
      e.__armed !== t &&
        ((e.__armed = t),
        t ? e.setAttribute(`data-armed`, ``) : e.removeAttribute(`data-armed`));
    }
    update(e) {
      let t = this.wanted();
      if (
        (t !== this.visible &&
          ((this.visible = t),
          this.root.classList.toggle(`on`, t),
          t ? (this.layoutT = 0) : (this.release(), (this.occluderCount = 0))),
        !t)
      )
        return;
      {
        let e = this.tipEl;
        (!e || !e.isConnected) &&
          (this._tipQ = (this._tipQ | 0) + 1) % 20 == 1 &&
          (e = this.tipEl =
            document.querySelector(`#hud-root [role="tooltip"]`));
        let t = !!e && !e.hidden;
        t !== this.reading &&
          ((this.reading = t), this.root.classList.toggle(`reading`, t));
      }
      this.pump(performance.now() / 1e3);
      let n = e.world,
        r = n ? n.units.get(e.playerId) : null,
        i = r && r.ward,
        a = this.btns.ward;
      if (!a.__hidden) {
        if (i) {
          let e = Math.max(0, (i.cdEnd || 0) - n.time);
          (this.setSub(a, e > 0.4 ? `${Math.ceil(e)}s` : `x${i.charges | 0}`),
            this.setOff(a, !r.alive || (i.charges | 0) <= 0 || e > 0.4));
        } else (this.setSub(a, `x0`), this.setOff(a, !0));
      }
      let o = r && r.consumable,
        s = this.btns.potion;
      (s.__hidden ||
        (this.setSub(s, o && o.charges > 0 ? `x${o.charges}` : `--`),
        this.setOff(s, !(r && r.alive && o && o.id && o.charges > 0))),
        this.setOff(this.btns.lasthit, !(r && r.alive)),
        this.setOff(this.btns.tower, !(r && r.alive)),
        this.setArmed(this.btns.lasthit, !!this.c.lastHitArmed),
        (this.layoutT -= e.dt || 0),
        this.layoutT <= 0 && ((this.layoutT = 0.4), this.layout()));
    }
    hudHas(e) {
      return this.c.hudHandles(e);
    }
    layout() {
      let e = document.getElementById(`hud-root`);
      if (!e) return;
      let t = innerWidth,
        n = innerHeight,
        r = Math.max(0.78, Math.min(1.35, Math.min(n / 420, t / 900))),
        i = Math.max(G, Math.round(40 * r)),
        a = Math.round(9 * r);
      this.scale = r;
      let o = t - Math.round(190 * r),
        s = n - Math.round(18 * r),
        c = e.querySelectorAll(`[data-slot]`);
      for (let e = 0; e < c.length; e++) {
        let t = c[e].getBoundingClientRect();
        t.width < 6 ||
          (t.left < o && (o = t.left),
          c[e].getAttribute(`data-slot`) === `A` &&
            t.bottom > 0 &&
            (s = t.bottom));
      }
      let l = Math.round(Math.min(s, n - 6) - i),
        u = 0;
      for (let e = 0; e < H.length; e++) this.hudHas(H[e]) || u++;
      if (u > 1) {
        let e = l + i - Math.round(44 * r);
        for (; a > 2 && u * i + (u - 1) * a > e; ) a--;
      }
      let d = Math.round(o - a - i);
      d < 6 && (d = 6);
      let f = Math.max(9, Math.round(12 * r)),
        p = Math.max(8, Math.round(9.5 * r)),
        m = 0;
      for (let e = 0; e < H.length; e++) {
        let t = H[e],
          n = this.btns[t],
          r = n.style,
          o = this.hudHas(t);
        if (((n.__hidden = o), o)) {
          r.display !== `none` && (r.display = `none`);
          continue;
        }
        r.display === `none` && (r.display = ``);
        let s = l - m * (i + a);
        ((r.width = r.height = i + `px`),
          (r.left = d + `px`),
          (r.top = s + `px`),
          (n.__lab.style.fontSize = f + `px`),
          (n.__sub.style.fontSize = p + `px`),
          this.rect(m, d, s, d + i, s + i),
          m++);
      }
      let h = this.btns.menu,
        g = Math.max(64, Math.round(58 * r)),
        _ = Math.max(32, Math.round(24 * r));
      if (this.hudHas(`menu`)) {
        ((h.__hidden = !0),
          h.style.display !== `none` && (h.style.display = `none`),
          (this.occluderCount = m));
        return;
      }
      ((h.__hidden = !1), h.style.display === `none` && (h.style.display = ``));
      let v = e.querySelector(`[data-open-scoreboard]`),
        y = v ? v.getBoundingClientRect() : null,
        b =
          y && y.width > 4
            ? Math.round(y.left - a - g)
            : t - g - Math.round(10 * r),
        x =
          y && y.height > 4
            ? Math.round(y.top + (y.height - _) / 2)
            : Math.round(8 * r);
      (Object.assign(h.style, {
        width: g + `px`,
        height: _ + `px`,
        left: Math.max(6, b) + `px`,
        top: Math.max(4, x) + `px`,
      }),
        (h.__lab.style.fontSize = Math.max(8, Math.round(10 * r)) + `px`),
        this.rect(
          m,
          Math.max(6, b),
          Math.max(4, x),
          Math.max(6, b) + g,
          Math.max(4, x) + _,
        ),
        (this.occluderCount = m + 1));
    }
    rect(e, t, n, r, i) {
      let a = this.occluders[e];
      ((a.left = t),
        (a.top = n),
        (a.right = r),
        (a.bottom = i),
        (a.width = r - t),
        (a.height = i - n));
    }
    dispose() {
      (this.release(),
        window.removeEventListener(`pointerup`, this._up),
        window.removeEventListener(`pointercancel`, this._up),
        this.root.remove());
    }
  },
  q = { KeyQ: `Q`, KeyW: `W`, KeyE: `E`, KeyR: `R`, KeyD: `D`, KeyF: `F` },
  J = { ArrowUp: 1, ArrowDown: 2, ArrowLeft: 4, ArrowRight: 8 },
  Y = `moba.controls.v1`,
  X = [`quick`, `indicator`, `normal`],
  ne = {
    release: `indicator`,
    hold: `indicator`,
    "quick-indicator": `indicator`,
    quickindicator: `indicator`,
  },
  Z = (e) => ((e = ne[e] || e), X.includes(e) ? e : null),
  Q =
    typeof navigator < `u` &&
    /Mac|iPhone|iPad|iPod/i.test(
      navigator.platform || navigator.userAgent || ``,
    ),
  re = [`KeyQ`, `KeyW`, `KeyE`, `KeyR`, `Space`],
  ie = 2.6,
  ae = {
    potion: `[data-use="potion"]`,
    ward: `[data-use="ward"]`,
    ping: `[data-ping-arm]`,
    menu: `[data-open-menu]`,
  },
  $ = () => performance.now() / 1e3,
  oe = 0.45,
  se = 44,
  ce = class {
    constructor(e) {
      ((this.ctx = e),
        (this.app = e.app),
        (this.proj = new o(e.camera)),
        (this.canvas = document.getElementById(`game-canvas`)),
        (this.hudRoot = document.getElementById(`hud-root`)),
        (this.castModes = X),
        (this.settings = {
          castMode: `indicator`,
          dragPx: 118,
          tapSlopPx: 14,
          joyDead: 0.14,
          unloadGuard: !0,
        }));
      try {
        let e = JSON.parse(localStorage.getItem(Y) || `null`),
          t = e && Z(e.castMode);
        t && (this.settings.castMode = t);
      } catch {}
      let t = this.app.params,
        n = t && t.get && Z(t.get(`cast`));
      (n && (this.settings.castMode = n),
        t &&
          t.get &&
          t.get(`unloadguard`) === `0` &&
          (this.settings.unloadGuard = !1),
        (this.aim = {
          active: !1,
          slot: null,
          x: 0,
          y: 0,
          valid: !1,
          range: 0,
          radius: 0,
          width: 0,
          angle: 0,
          type: `none`,
          targetId: -1,
          source: ``,
          reason: ``,
          strength: 0,
        }),
        (this.cancelZone = {
          visible: !1,
          hover: !1,
          x: 0,
          y: 0,
          r: 0,
          dom: !1,
        }),
        (this.clickMarker = { seq: 0, x: 0, y: 0, kind: `move` }),
        (this.attackMove = {
          pending: !1,
          active: !1,
          x: 0.5,
          y: 0.5,
          next: 0,
          range: 0.5,
          cx: 0.5,
          cy: 0.5,
          cursorOk: !1,
        }),
        (this.hoverId = -1),
        (this.hoverAt = { x: -1e4, y: -1e4 }),
        (this.stats = { commands: 0, last: ``, ok: 0, denied: 0 }),
        (this.lastDenied = null),
        (this._syncT = -1),
        (this._syncWorld = null),
        (this.mouse = {
          x: innerWidth / 2,
          y: innerHeight / 2,
          known: !1,
          overWorld: !1,
        }),
        (this.cursor = { x: 60, y: 60, ok: !1 }),
        (this.alpha = 1),
        (this.shape = p()),
        (this._shape2 = p()),
        (this._dir = { x: 0, y: 0 }),
        (this._pt = { x: 0, y: 0, id: -1 }),
        (this.arrows = 0),
        (this.keyAimSlot = null),
        (this.keyAimConsumed = !1),
        (this.debugPt = { x: 0, y: 0 }),
        (this.space = { down: !1, t: 0, next: 0, lastHit: !1, yielded: !1 }),
        (this.lastHitKey = { down: !1, next: 0 }),
        (this.atk = { t: -9, onStructure: !1, structureId: -1, hintT: -99 }),
        (this.lastHitArmed = !1),
        (this._armedAttr = !1),
        (this.hint = { text: ``, t: -9, dur: 0 }),
        (this.touchHeld = { lasthit: !1, tower: !1 }),
        (this.look = {
          active: !1,
          pointerId: -1,
          el: null,
          wasMode: `follow`,
        }),
        (this.uiRects = []),
        (this.uiRectCount = 0),
        (this.right = { held: !1, next: 0, x: 0, y: 0 }),
        (this.attackHeld = { on: !1, next: 0, pointerId: -1 }),
        (this.dirState = { sent: !1, dx: 0, dy: 0, t: 0, suppressUntil: 0 }),
        (this.joy = {
          active: !1,
          pointerId: -1,
          ox: 0,
          oy: 0,
          cx: 0,
          cy: 0,
          maxR: 60,
          baseDX: 0,
          baseDY: 0,
          dirty: !1,
          el: null,
          knob: null,
          scale: 1,
        }),
        (this.abilityG = {
          active: !1,
          pointerId: -1,
          slot: null,
          sx: 0,
          sy: 0,
          cx: 0,
          cy: 0,
          dragging: !1,
          holdAim: !1,
          preview: !1,
          tip: !1,
          info: !1,
          el: null,
          t0: 0,
        }),
        (this.tapG = { active: !1, pointerId: -1, slot: null, el: null }),
        (this.cursorStyle = ``),
        (this.keyboardLocked = !1),
        (this._cancelHoverAttr = !1),
        (this.C = {
          move: { type: `move`, x: 0, y: 0 },
          dir: { type: `dir`, dx: 0, dy: 0 },
          attack: { type: `attack`, targetId: -1 },
          near: { type: `attackNearest`, prefer: `champion`, range: 8 },
          cast: { type: `cast`, slot: `Q`, x: 0, y: 0, targetId: -1 },
          amove: { type: `attackMove`, x: 0, y: 0 },
          spell: { type: `spell`, slot: `D`, x: 0, y: 0, targetId: -1 },
          stop: { type: `stop` },
          recall: { type: `recall` },
          level: { type: `levelUp`, slot: `Q` },
          ward: { type: `ward`, x: 0, y: 0 },
          potion: { type: `potion` },
          ping: { type: `ping`, x: 0, y: 0, kind: `generic` },
          auto: { type: `autoLevel`, on: !0 },
        }),
        (this.L = []));
      let r = (e, t, n, r) => {
        e && (e.addEventListener(t, n, r), this.L.push([e, t, n, r]));
      };
      (r(window, `keydown`, (e) => this.onKeyDown(e)),
        r(window, `keyup`, (e) => this.onKeyUp(e)),
        r(window, `blur`, () => this.releaseAll(!0)),
        r(document, `visibilitychange`, () => {
          document.hidden && this.releaseAll(!0);
        }),
        r(window, `contextmenu`, (e) => {
          this.isTyping(e.target) || e.preventDefault();
        }),
        r(window, `pointerdown`, (e) => this.onWorldPointerDown(e)),
        r(window, `pointermove`, (e) => this.onPointerMove(e), { passive: !0 }),
        r(window, `pointerup`, (e) => this.onPointerUp(e)),
        r(window, `pointercancel`, (e) => this.onPointerUp(e, !0)),
        r(this.hudRoot, `pointerdown`, (e) => this.onHudPointerDown(e)),
        r(this.hudRoot, `click`, (e) => this.onHudClick(e)),
        r(document, `fullscreenchange`, () => this.syncKeyboardLock()),
        r(window, `beforeunload`, (e) => {
          this.settings.unloadGuard &&
            this.app.state === `game` &&
            !this.app.scenario &&
            (e.preventDefault(), (e.returnValue = ``));
        }),
        (this._onState = (e) => {
          e !== `game` && this.releaseAll();
        }),
        this.app.on(`state`, this._onState),
        this.app.on(`match`, this._onState),
        (this._onUi = (e) => {
          e && e.panel && e.panel !== `none` && this.releaseAll(!0);
        }),
        this.app.on(`ui`, this._onUi));
      try {
        this.settingsUI = new B(this);
      } catch (e) {
        ((this.settingsUI = null),
          console.warn(`[controls] settings UI unavailable`, e));
      }
      try {
        this.touch = new K(this);
      } catch (e) {
        ((this.touch = null),
          console.warn(`[controls] touch actions unavailable`, e));
      }
    }
    get world() {
      return this.app.world;
    }
    get levelUpModifier() {
      return this.keyboardLocked ? `Ctrl` : Q ? `Option` : `Shift`;
    }
    me() {
      let e = this.app.world;
      return e ? e.units.get(this.app.playerId) : null;
    }
    inGame() {
      return this.app.state === `game` && !!this.app.world;
    }
    active() {
      return (
        this.inGame() &&
        !(this.app.ui && this.app.ui.panel !== `none`) &&
        !this.app.paused
      );
    }
    isTyping(e) {
      let t = e && e.nodeType === 1 ? e : document.activeElement;
      if (!t) return !1;
      let n = t.tagName;
      return (
        n === `INPUT` ||
        n === `TEXTAREA` ||
        n === `SELECT` ||
        t.isContentEditable
      );
    }
    send(e) {
      let t = this.app.world;
      if (!t) return !1;
      (this.stats.commands++, (this.stats.last = e.type));
      let n = !!t.command(this.app.playerId, e);
      return (n && this.stats.ok++, n);
    }
    uiScale() {
      return Math.max(0.8, Math.min(1.6, innerHeight / 1080));
    }
    setCastMode(e) {
      let t = Z(e);
      if (!t) return !1;
      ((this.settings.castMode = t),
        this.aim.active && this.aim.source === `key` && this.cancelAim());
      try {
        localStorage.setItem(Y, JSON.stringify({ castMode: t }));
      } catch {}
      return (this.settingsUI && this.settingsUI.sync(), !0);
    }
    marker(e, t, n) {
      let r = this.clickMarker;
      (r.seq++, (r.x = e), (r.y = t), (r.kind = n));
    }
    cursorGround() {
      return (
        this.proj.begin(),
        this.proj.screenToGround(this.mouse.x, this.mouse.y, this.cursor)
      );
    }
    slotEl(e) {
      return this.hudRoot
        ? this.hudRoot.querySelector(`[data-slot="${e}"]`)
        : null;
    }
    setPressed(e, t) {
      let n = this.slotEl(e);
      n &&
        (t
          ? n.setAttribute(`data-pressed`, ``)
          : n.removeAttribute(`data-pressed`));
    }
    toggleFullscreen() {
      try {
        document.fullscreenElement
          ? document.exitFullscreen().catch(() => {})
          : document.documentElement.requestFullscreen &&
            document.documentElement
              .requestFullscreen({ navigationUI: `hide` })
              .catch(() => {});
      } catch {}
    }
    syncKeyboardLock() {
      let e = typeof navigator < `u` ? navigator.keyboard : null;
      if (document.fullscreenElement && e && typeof e.lock == `function`)
        e.lock(re)
          .then(() => {
            ((this.keyboardLocked = !!document.fullscreenElement),
              this.settingsUI && this.settingsUI.sync());
          })
          .catch(() => {
            this.keyboardLocked = !1;
          });
      else {
        if (e && typeof e.unlock == `function`)
          try {
            e.unlock();
          } catch {}
        this.keyboardLocked = !1;
      }
      this.settingsUI && this.settingsUI.sync();
    }
    onKeyDown(e) {
      if (!this.inGame() || this.isTyping(e.target) || e.metaKey) return;
      let t = e.code,
        r = e.ctrlKey,
        i = e.shiftKey,
        a = e.altKey;
      if (t === `Tab`) {
        if (r || a) return;
        (e.preventDefault(),
          !e.repeat &&
            this.app.ui.panel !== `scoreboard` &&
            this.app.fire(`ui`, { panel: `scoreboard` }));
        return;
      }
      if (t === `Escape` && !e.repeat) {
        let t = e.__svcPanel == null ? this.app.ui.panel : e.__svcPanel;
        this.aim.active
          ? this.cancelAim()
          : this.attackMove.pending
            ? (this.attackMove.pending = !1)
            : t === `none`
              ? this.settingsUI && this.settingsUI.toggleFromKey()
              : this.app.ui.panel !== `none` &&
                this.app.fire(`ui`, { panel: `none` });
        return;
      }
      if (t === `KeyP`) {
        if (e.repeat || r) return;
        this.app.fire(`ui`, {
          panel: this.app.ui.panel === `shop` ? `none` : `shop`,
        });
        return;
      }
      if (!this.active()) return;
      if (J[t]) {
        (e.preventDefault(), (this.arrows |= J[t]), this.cancelAutoMoves());
        return;
      }
      if (t === `Space`) {
        if (a || (e.preventDefault(), e.repeat)) return;
        let t = i || r,
          n = this.space;
        ((n.down = !0),
          (n.t = $()),
          (n.lastHit = t),
          (n.yielded = !1),
          (n.next = n.t + 0.12),
          this.cancelAutoMoves(),
          t ? this.doLastHit(!0) : this.pressAttack());
        return;
      }
      if (e.repeat || (r && !q[t])) return;
      if (t === `KeyB`) {
        (this.cancelAutoMoves(), this.send(this.C.recall), this.flash(`B`));
        return;
      }
      if (t === `KeyS`) {
        (this.cancelAutoMoves(),
          this.send(this.C.stop),
          (this.dirState.sent = !1));
        return;
      }
      if (t === `KeyA`) {
        this.attackMove.pending = !0;
        return;
      }
      if (t === `KeyC`) {
        ((this.lastHitKey.down = !0),
          (this.lastHitKey.next = $() + 0.12),
          this.cancelAutoMoves(),
          this.doLastHit(!0));
        return;
      }
      if (t === `KeyT`) {
        this.attackStructure();
        return;
      }
      if (t === `KeyG`) {
        let e = this.cursorGround();
        this.ping(e.x, e.y);
        return;
      }
      if (t === `Digit1` || t === `Numpad1`) {
        this.hudHandles(`potion`) || this.usePotion();
        return;
      }
      if (t === `Digit4` || t === `Numpad4`) {
        if (!this.hudHandles(`ward`)) {
          let e = this.cursorGround();
          this.placeWard(e.x, e.y);
        }
        return;
      }
      let o = q[t];
      if (o) {
        if (n.includes(o) && (i || (a && Q) || (r && !a))) {
          (e.preventDefault(),
            (this.C.level.slot = o),
            this.send(this.C.level),
            this.flash(o));
          return;
        }
        r || (a && !Q) || (e.preventDefault(), this.keyCast(o));
      }
    }
    onKeyUp(e) {
      let t = e.code;
      if (t === `Tab`) {
        this.app.ui.panel === `scoreboard` &&
          this.app.fire(`ui`, { panel: `none` });
        return;
      }
      if (J[t]) {
        this.arrows &= ~J[t];
        return;
      }
      if (t === `Space`) {
        this.space.down = !1;
        return;
      }
      if (t === `KeyC`) {
        this.lastHitKey.down = !1;
        return;
      }
      let n = q[t];
      if (n) {
        if (this.keyAimSlot === n) {
          if (this.settings.castMode === `normal`) return;
          ((this.keyAimSlot = null),
            this.setPressed(n, !1),
            this.aim.active &&
              this.aim.source === `key` &&
              this.aim.slot === n &&
              !this.keyAimConsumed &&
              this.active() &&
              this.castFromAim(),
            this.aim.source === `key` && this.endAim());
        } else this.setPressed(n, !1);
      }
    }
    keyCast(e) {
      let t = this.me();
      if (
        !t ||
        (f(t, e, this.app.world.time, this.shape),
        this.setPressed(e, !0),
        setTimeout(() => {
          this.keyAimSlot !== e && this.setPressed(e, !1);
        }, 120),
        this.shape.type === `none`)
      )
        return;
      let n = this.settings.castMode;
      if (
        n === `normal` &&
        this.aim.active &&
        this.aim.source === `key` &&
        this.aim.slot === e
      ) {
        (this.castFromAim(),
          (this.keyAimConsumed = !0),
          (this.keyAimSlot = null),
          this.endAim());
        return;
      }
      let r = this.shape.type === `aoe` && this.shape.range <= 0.01;
      if (n === `quick` || (!this.shape.needsAim && !r)) {
        let t = this.cursorGround();
        this.castAt(e, t.x, t.y, this.shape, `cursor`);
        return;
      }
      (this.aim.active && this.cancelAim(),
        (this.keyAimSlot = e),
        (this.keyAimConsumed = !1),
        this.beginAim(e, `key`));
    }
    castAt(e, t, n, r, i, a = -1) {
      let o = this.me();
      if (!o) return !1;
      let s = this.app.world,
        c = this.app.viewerTeam;
      if (r.type === `buff` || (r.type === `aoe` && r.range <= 0.01))
        ((t = o.x), (n = o.y));
      else if (r.type === `target`) {
        if (a < 0) {
          let e = null;
          if (i === `cursor`) {
            let i = this.hoverId >= 0 ? s.units.get(this.hoverId) : null;
            e =
              i &&
              h(i, c) &&
              i.team !== o.team &&
              this.targetFilterOk(i, r.targets)
                ? i
                : _(
                    s,
                    o,
                    t,
                    n,
                    4.5,
                    c,
                    r.targets === `any` ? `any` : r.targets,
                    1.5,
                  );
          } else e = _(s, o, o.x, o.y, r.range + 1.5, c, r.targets, 4);
          e && ((a = e.id), (t = e.x), (n = e.y));
        }
      } else if (i === `smart`) {
        let e = this.smartPoint(o, r, this._pt);
        ((t = e.x), (n = e.y));
      }
      let l = e === `D` || e === `F` ? this.C.spell : this.C.cast;
      ((l.slot = e),
        (l.x = t),
        (l.y = n),
        (l.targetId = a),
        this.cancelAutoMoves(),
        (this.dirState.suppressUntil = $() + 0.12));
      let u = this.send(l);
      return (
        (this.lastCast = { slot: e, ok: u, x: t, y: n, targetId: a, t: $() }),
        u ||
          (this.queuedCast(o, e, s)
            ? this.app.fire(`queued`, { slot: e, type: l.type })
            : this.denied(e, l.type)),
        u
      );
    }
    queuedCast(e, t, n) {
      let r = e && e.kit && e.kit.deny;
      return !!(r && r.queued && r.slot === t && r.t >= (n ? n.time : 0) - 0.2);
    }
    smartPoint(e, t, n) {
      let r = this.app.world,
        i = this.app.viewerTeam;
      if (t.type === `dash` || t.type === `blink`) {
        let r = Math.cos(e.facing),
          i = Math.sin(e.facing);
        return (
          (this.joy.active || this.arrows) &&
            this.dirState.sent &&
            ((r = this.dirState.dx), (i = this.dirState.dy)),
          (n.x = e.x + r * t.range),
          (n.y = e.y + i * t.range),
          (n.id = -1),
          n
        );
      }
      let a = t.range + (t.radius || 0) * 0.6 + 1,
        o = _(r, e, e.x, e.y, a, i, t.type === `target` ? t.targets : `any`, 5);
      if (o) return ((n.x = o.x), (n.y = o.y), (n.id = o.id), n);
      let s = t.type === `aoe` ? t.range * 0.6 : t.range;
      return (
        (n.x = e.x + Math.cos(e.facing) * s),
        (n.y = e.y + Math.sin(e.facing) * s),
        (n.id = -1),
        n
      );
    }
    targetFilterOk(e, n) {
      return (
        n === `any` ||
        (n === `champion`
          ? e.kind === t.CHAMPION
          : n !== `monster` || e.kind === t.MONSTER || e.kind === t.MINION)
      );
    }
    smartCast(e) {
      let t = this.me();
      return !t ||
        (f(t, e, this.app.world.time, this.shape), this.shape.type === `none`)
        ? !1
        : this.castAt(e, t.x, t.y, this.shape, `smart`);
    }
    beginAim(e, t) {
      let n = this.aim;
      ((n.active = !0),
        (n.slot = e),
        (n.source = t),
        (n.targetId = -1),
        (n.strength = t === `touch` ? 0.35 : 1),
        this.hudRoot &&
          (this.hudRoot.setAttribute(`data-aiming`, e),
          this.hudRoot.setAttribute(`data-aim-source`, t)),
        t === `touch` && this.placeCancel(),
        this.refreshAim());
    }
    endAim() {
      let e = this.aim;
      (e.active && e.slot && this.setPressed(e.slot, !1),
        (e.active = !1),
        (e.slot = null),
        (e.source = ``),
        (e.targetId = -1),
        (e.strength = 0),
        (this.cancelZone.visible = !1),
        (this.cancelZone.hover = !1),
        this.hudRoot &&
          (this.hudRoot.removeAttribute(`data-aiming`),
          this.hudRoot.removeAttribute(`data-aim-source`),
          (this._cancelHoverAttr &&=
            (this.hudRoot.removeAttribute(`data-cancel-hover`), !1))));
    }
    cancelAim() {
      ((this.keyAimConsumed = !0), (this.keyAimSlot = null), this.endAim());
    }
    castFromAim() {
      let e = this.aim;
      if (!e.active) return !1;
      let t = this.me();
      return t
        ? (this.refreshAim(),
          f(t, e.slot, this.app.world.time, this.shape),
          this.castAt(
            e.slot,
            e.x,
            e.y,
            this.shape,
            `cursor`,
            this.shape.type === `target` ? e.targetId : -1,
          ))
        : !1;
    }
    debugAim(e, t, n) {
      if (!e) return (this.aim.source === `debug` && this.endAim(), !1);
      let r = this.me();
      return !r ||
        !this.app.world ||
        (f(r, e, this.app.world.time, this.shape), this.shape.type === `none`)
        ? !1
        : (this.aim.active && this.endAim(),
          (this.debugPt.x = +t),
          (this.debugPt.y = +n),
          this.beginAim(e, `debug`),
          !0);
    }
    refreshAim() {
      let t = this.aim,
        n = this.me(),
        i = this.app.world;
      if (!t.active || !n || !i) return;
      let a = f(n, t.slot, i.time, this._shape2);
      ((t.type = a.type),
        (t.range = a.range),
        (t.radius = a.radius),
        (t.width = a.width),
        (t.angle = a.angle),
        (t.valid = a.ready),
        (t.reason = a.reason));
      let o = e(n, 1),
        s = r(n, 1);
      if (t.source === `key`) {
        let e = this.cursorGround();
        ((t.x = e.x), (t.y = e.y));
      } else if (t.source === `debug`)
        ((t.x = this.debugPt.x), (t.y = this.debugPt.y));
      else {
        let e = this.abilityG,
          r = e.cx - e.sx,
          i = e.cy - e.sy,
          c = Math.sqrt(r * r + i * i);
        if (!e.dragging) {
          let e = this.smartPoint(n, a, this._pt);
          ((t.x = e.x),
            (t.y = e.y),
            a.type === `target` && (t.targetId = e.id));
          return;
        }
        let l = Math.min(1, c / (this.settings.dragPx * this.uiScale()));
        this.proj.begin();
        let u = this.proj.screenDirToGround(r, i, this._dir),
          d =
            a.type === `aoe` ||
            a.type === `dash` ||
            a.type === `blink` ||
            a.type === `target`
              ? l * a.range
              : a.range;
        ((t.x = o + u.x * Math.max(0.05, d)),
          (t.y = s + u.y * Math.max(0.05, d)));
      }
      if (a.type === `target`) {
        let e = null;
        if (t.source === `key` && this.hoverId >= 0) {
          let t = i.units.get(this.hoverId);
          t &&
            t.team !== n.team &&
            this.targetFilterOk(t, a.targets) &&
            (e = t);
        }
        ((e ||= _(
          i,
          n,
          t.x,
          t.y,
          t.source === `touch` ? a.range + 1.5 : 4.5,
          this.app.viewerTeam,
          a.targets,
          1.5,
        )),
          (t.targetId = e ? e.id : -1),
          t.valid &&
            !C(
              n,
              a,
              t.slot,
              t.targetId >= 0 ? i.units.get(t.targetId) : null,
            ) &&
            ((t.valid = !1), (t.reason = `noTarget`)));
      }
    }
    attackNearest(e) {
      let t = this.me();
      if (!t) return !1;
      let n = this.C.near;
      ((n.prefer = e), (n.range = A(this.app.world, t, this.app.viewerTeam)));
      let r = this.send(n);
      return (r && (this.dirState.suppressUntil = $() + 0.35), r);
    }
    attackReach(e) {
      return E(e);
    }
    championInReach(e) {
      return k(this.app.world, e, this.app.viewerTeam);
    }
    structureLock(e) {
      if (!this.atk.onStructure || this.atk.structureId < 0) return null;
      let t = this.orderTarget(e);
      return t && t.id === this.atk.structureId && this.isStructure(t)
        ? t
        : null;
    }
    takeStructure(e, t = !1) {
      ((this.atk.onStructure = !0), (this.atk.structureId = e.id));
      let n = this.attackUnit(e, t);
      return (n || this.dropStructure(), n);
    }
    dropStructure() {
      ((this.atk.onStructure = !1), (this.atk.structureId = -1));
    }
    pressAttack() {
      let e = this.me();
      if (!e || !e.alive) return !1;
      let t = this.app.world,
        n = $(),
        r = n - this.atk.t < ie;
      this.atk.t = n;
      let i = M(
        t,
        e,
        this.app.viewerTeam,
        { repeat: r, lockId: this.atk.onStructure ? this.atk.structureId : -1 },
        (this._atkD ||= j()),
      );
      if (i.action === `structure` && this.takeStructure(i.structure, !0))
        return !0;
      this.dropStructure();
      let a = this.attackNearest(`champion`);
      return (
        a
          ? i.advise &&
            n - this.atk.hintT > 8 &&
            ((this.atk.hintT = n), this.say(i.advise))
          : this.attackRefused(
              i.protectedNear ? `turretProtected` : `noTarget`,
            ),
        a
      );
    }
    attackStructure() {
      let e = this.me();
      if (!e || !e.alive) return !1;
      let t = this.app.world,
        n = this.app.viewerTeam,
        r = this.attackReach(e) + 2,
        i = b(t, e, r, n);
      return i
        ? ((this.atk.t = $()), this.takeStructure(i))
        : (this.attackRefused(
            x(t, e, r, n) ? `turretProtected` : `noStructure`,
          ),
          !1);
    }
    attackUnit(e, t = !1) {
      (this.cancelAutoMoves(), (this.C.attack.targetId = e.id));
      let n = this.send(this.C.attack);
      return (
        n
          ? ((this.dirState.suppressUntil = $() + 0.35),
            this.marker(e.x, e.y, `attack`))
          : t || this.attackRefused(),
        n
      );
    }
    isStructure(e) {
      return w(e);
    }
    attackRefused(e = `noTarget`) {
      (this.say(e), this.flash(`A`));
    }
    directionHeld() {
      return this.joy.active || this.arrows !== 0;
    }
    orderTarget(e) {
      return O(this.app.world, e, this.app.viewerTeam);
    }
    keepAttacking(e) {
      if (!e || !e.alive || this.directionHeld()) return !1;
      let n = e.order;
      if (
        (n &&
          (n.type === `castOnTarget` ||
            n.type === `dir` ||
            n.type === `attackMove` ||
            (n.type === `move` && this.space.yielded))) ||
        (e.dash && e.dash.t1 > this.app.world.time)
      )
        return !1;
      let r = (e.stats && e.stats.attackRange) || 1.5,
        i = this.orderTarget(e);
      if (i) {
        if (this.isStructure(i)) {
          let t = this.championInReach(e);
          return (
            !t ||
            (this.dropStructure(),
            (this.C.attack.targetId = t.id),
            this.send(this.C.attack))
          );
        }
        if (y(e, i) > r + 4) return this.attackNearest(`champion`);
        if (i.kind === t.CHAMPION) return !0;
        let n = this.championInReach(e);
        return (
          !n || ((this.C.attack.targetId = n.id), this.send(this.C.attack))
        );
      }
      if (this.attackNearest(`champion`)) return !0;
      let a = ee(this.app.world, e, this.app.viewerTeam);
      return a ? this.takeStructure(a, !0) : !1;
    }
    doLastHit(e = !1) {
      let t = this.me();
      if (!t || !t.alive) return !1;
      let n = this.app.world,
        r = this.app.viewerTeam,
        i = ((t.stats && t.stats.attackRange) || 1.5) + 3.5,
        a = v(n, t, i, r, !0),
        o = t.order;
      if (a) {
        if (o && o.type === `attack` && o.targetId === a.id) return !0;
        this.C.attack.targetId = a.id;
        let e = this.send(this.C.attack);
        return (e && (this.dirState.suppressUntil = $() + 0.35), e);
      }
      if (this.orderTarget(t) && o.type === `attack`) return !0;
      if (!e && (o || this.directionHeld())) return !1;
      let s = v(n, t, i, r, !1);
      if (s) {
        this.C.attack.targetId = s.id;
        let e = this.send(this.C.attack);
        return (e && (this.dirState.suppressUntil = $() + 0.35), e);
      }
      if (!e) return !1;
      let c = this.attackNearest(`minion`);
      return (c || this.say(`noMinion`), c);
    }
    cancelAutoMoves() {
      ((this.attackMove.active = !1),
        (this.attackMove.pending = !1),
        (this.right.held = !1));
    }
    flash(e) {
      (this.setPressed(e, !0),
        setTimeout(() => {
          (e !== `A` || (!this.attackHeld.on && !this.lastHitArmed)) &&
            this.setPressed(e, !1);
        }, 120));
    }
    tooltipOpen(e) {
      let t = this.hudRoot && this.hudRoot.querySelector(`[role="tooltip"]`);
      if (!t || t.hidden) return !1;
      if (!e) return !0;
      let n = this.app.registry && this.app.registry.get(`hud`),
        r = n && n.game ? n.game.tipSlot : void 0;
      return r === void 0 || r === e;
    }
    openTipWhileAiming(e) {
      let t = this.app.registry && this.app.registry.get(`hud`),
        n = t && t.game,
        r =
          t && typeof t.showTip == `function`
            ? (e) => t.showTip(e)
            : n && typeof n.showTip == `function`
              ? (e) => n.showTip(e)
              : null;
      if (!r) return !1;
      if (this.tooltipOpen(e)) return !0;
      try {
        r(e);
      } catch {
        return !1;
      }
      return (
        (this.stats.tipsWhileAiming = (this.stats.tipsWhileAiming | 0) + 1),
        !0
      );
    }
    levelUpNear(e, t) {
      if (!this.hudRoot || e.pointerType === `mouse` || e.pointerType === `pen`)
        return !1;
      let n = this.hudRoot.querySelectorAll(`[data-levelup]`);
      if (!n.length) return !1;
      let r = null,
        i = 1e9,
        a = 0,
        o = 0;
      for (let s = 0; s < n.length; s++) {
        let c = n[s],
          l = c.getBoundingClientRect();
        if (l.width < 4 || l.height < 4) continue;
        let u = getComputedStyle(c);
        if (
          u.pointerEvents === `none` ||
          u.visibility === `hidden` ||
          +u.opacity < 0.5
        )
          continue;
        let d = (l.left + l.right) / 2,
          f = (l.top + l.bottom) / 2,
          p = Math.max(se, Math.min(l.width, l.height)) / 2,
          m = Math.hypot(e.clientX - d, e.clientY - f);
        if (!(m > p || m >= i)) {
          if (t) {
            let n = t.getBoundingClientRect();
            if (
              Math.hypot(
                e.clientX - (n.left + n.right) / 2,
                e.clientY - (n.top + n.bottom) / 2,
              ) <= m
            )
              continue;
          }
          ((r = c), (i = m), (a = d), (o = f));
        }
      }
      if (!r) return !1;
      try {
        r.dispatchEvent(
          new PointerEvent(`pointerdown`, {
            bubbles: !0,
            cancelable: !0,
            pointerId: e.pointerId,
            pointerType: e.pointerType,
            isPrimary: e.isPrimary,
            clientX: a,
            clientY: o,
          }),
        );
      } catch {
        return !1;
      }
      return !0;
    }
    denied(e, t) {
      (this.stats.denied++,
        (this.lastDenied = { slot: e, type: t, t: $() }),
        this.app.fire(`denied`, { slot: e, type: t }));
    }
    say(e, t = 1.3) {
      ((this.hint.text = e), (this.hint.t = $()), (this.hint.dur = t));
    }
    get hintText() {
      return $() - this.hint.t < this.hint.dur ? this.hint.text : ``;
    }
    hintKey() {
      return this.hintText || (this.lastHitArmed ? `lastHit` : ``);
    }
    hudHandles(e) {
      let t = ae[e];
      if (!t || !this.hudRoot) return !1;
      let n = this.hudRoot.querySelector(t);
      if (!n) return !1;
      let r = n.getBoundingClientRect();
      return r.width > 4 && r.height > 4;
    }
    placeWard(e, t) {
      let n = this.me();
      if (!n || !n.alive) return !1;
      let r = n.ward;
      if (!r || (r.charges | 0) <= 0) return (this.say(`noWard`), !1);
      if (r.cdEnd > this.app.world.time) return (this.say(`wardCd`), !1);
      let i = this.C.ward;
      ((i.x = e), (i.y = t));
      let a = this.send(i);
      return (a ? this.marker(e, t, `move`) : this.say(`noWard`), a);
    }
    usePotion() {
      let e = this.me();
      if (!e || !e.alive) return !1;
      let t = e.consumable;
      if (!t || !t.id || t.charges <= 0) return (this.say(`noPotion`), !1);
      let n = this.send(this.C.potion);
      return (n || this.say(`noPotion`), n);
    }
    ping(e, t) {
      let n = this.me();
      if (!n) return !1;
      let r = this.app.world,
        i = this.C.ping;
      return (
        (i.x = Math.max(0, Math.min(120, e))),
        (i.y = Math.max(0, Math.min(120, t))),
        (i.kind = _(r, n, i.x, i.y, 7, this.app.viewerTeam, `champion`, 0)
          ? `danger`
          : Math.hypot(i.x - n.x, i.y - n.y) < 4
            ? `assist`
            : `omw`),
        this.send(i)
      );
    }
    doAction(e, t) {
      let n = this.me();
      if (n)
        switch (e) {
          case `lasthit`:
            ((this.touchHeld.lasthit = !0),
              t && this.cancelAutoMoves(),
              this.doLastHit(t));
            break;
          case `tower`:
            ((this.touchHeld.tower = !0),
              t
                ? this.attackStructure()
                : this.orderTarget(n) || this.attackStructure());
            break;
          case `ward`: {
            let e = 1.6;
            this.placeWard(
              n.x + Math.cos(n.facing) * e,
              n.y + Math.sin(n.facing) * e,
            );
            break;
          }
          case `potion`:
            this.usePotion();
            break;
          case `ping`:
            this.ping(n.x, n.y);
            break;
          case `menu`:
            t && this.settingsUI && this.settingsUI.toggleFromKey();
        }
    }
    endAction(e) {
      e === `lasthit`
        ? (this.touchHeld.lasthit = !1)
        : e === `tower` && (this.touchHeld.tower = !1);
    }
    rig() {
      let e = this.app.registry && this.app.registry.get(`pipeline`);
      return e && e.cameraRig ? e.cameraRig : null;
    }
    startLook(e, t) {
      let n = this.rig();
      if (!n) return !1;
      let r = this.look;
      ((r.active = !0),
        (r.pointerId = e.pointerId),
        (r.el = t),
        (r.wasMode = n.mode === `free` ? `follow` : n.mode),
        (n.mode = `free`));
      try {
        t.setPointerCapture(e.pointerId);
      } catch {}
      return (this.lookTo(e, t), !0);
    }
    lookTo(e, t) {
      let n = this.rig();
      if (!n) return;
      let r = (t || this.look.el).getBoundingClientRect();
      if (r.width < 8) return;
      let i = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * 120,
        a = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)) * 120;
      n.setFocus(i, a);
    }
    endLook() {
      let e = this.look;
      if (!e.active) return;
      ((e.active = !1), (e.pointerId = -1), (e.el = null));
      let t = this.rig();
      t && (t.mode = e.wasMode || `follow`);
    }
    onPointerMove(e) {
      (e.pointerType === `mouse` || e.pointerType === `pen`) &&
        ((this.mouse.x = e.clientX),
        (this.mouse.y = e.clientY),
        (this.mouse.known = !0),
        (this.mouse.overWorld = e.target === this.canvas));
      let t = this.joy;
      if (t.active && e.pointerId === t.pointerId) {
        ((t.cx = e.clientX), (t.cy = e.clientY), (t.dirty = !0));
        return;
      }
      let n = this.look;
      if (n.active && e.pointerId === n.pointerId) {
        this.lookTo(e, n.el);
        return;
      }
      let r = this.abilityG;
      if (
        r.active &&
        e.pointerId === r.pointerId &&
        ((r.cx = e.clientX),
        (r.cy = e.clientY),
        !r.dragging &&
          Math.hypot(r.cx - r.sx, r.cy - r.sy) >
            this.settings.tapSlopPx * this.uiScale())
      ) {
        let e = this.me();
        e &&
          (f(e, r.slot, this.app.world.time, this.shape),
          this.shape.needsAim &&
            this.shape.type !== `none` &&
            ((r.dragging = !0),
            (this.aim.active &&
              this.aim.source === `touch` &&
              this.aim.slot === r.slot) ||
              (this.aim.active && this.endAim(),
              this.beginAim(r.slot, `touch`)),
            this.setPressed(r.slot, !0)));
      }
    }
    onWorldPointerDown(e) {
      if (e.target !== this.canvas || !this.active()) return;
      if (e.pointerType === `mouse` || e.pointerType === `pen`) {
        ((this.mouse.x = e.clientX),
          (this.mouse.y = e.clientY),
          (this.mouse.known = !0),
          (this.mouse.overWorld = !0),
          e.button === 2
            ? this.onRightDown(e)
            : e.button === 0 && this.onLeftDown(e));
        return;
      }
      if (this.levelUpNear(e, null)) {
        e.preventDefault();
        return;
      }
      let t = l();
      !this.joy.active &&
        e.clientX < t.left + t.width * 0.42 &&
        e.clientY > t.top + t.height * 0.42 &&
        (e.preventDefault(), this.startJoystick(e, !0));
    }
    onRightDown(e) {
      let t = this.app.world,
        n = this.me();
      if (!n) return;
      if (
        this.aim.active &&
        (this.aim.source === `key` || this.aim.source === `debug`)
      ) {
        this.cancelAim();
        return;
      }
      ((this.attackMove.pending = !1),
        (this.attackMove.active = !1),
        this.space.down && (this.space.yielded = !0),
        this.proj.begin());
      let r =
          Math.hypot(e.clientX - this.hoverAt.x, e.clientY - this.hoverAt.y) < 6
            ? this.hoverId
            : -1,
        i = g(
          t,
          this.proj,
          e.clientX,
          e.clientY,
          this.app.viewerTeam,
          this.alpha,
          6,
          !0,
          -1,
          r,
        ),
        a = this.proj.screenToGround(e.clientX, e.clientY, this.cursor);
      if (
        i &&
        i.alive &&
        i.team !== n.team &&
        ((this.C.attack.targetId = i.id), this.send(this.C.attack))
      ) {
        (this.marker(i.x, i.y, `attack`), (this.right.held = !1));
        return;
      }
      ((this.C.move.x = a.x),
        (this.C.move.y = a.y),
        this.send(this.C.move),
        this.marker(a.x, a.y, `move`),
        (this.right.held = !0),
        (this.right.next = $() + 0.14),
        (this.right.x = a.x),
        (this.right.y = a.y));
    }
    onLeftDown(e) {
      let t = this.app.world;
      if (this.me()) {
        if (this.aim.active && this.aim.source === `key`) {
          (this.castFromAim(),
            (this.keyAimConsumed = !0),
            (this.keyAimSlot = null),
            this.endAim());
          return;
        }
        if (this.attackMove.pending) {
          ((this.attackMove.pending = !1), this.proj.begin());
          let n = g(
            t,
            this.proj,
            e.clientX,
            e.clientY,
            this.app.viewerTeam,
            this.alpha,
            6,
            !0,
          );
          if (
            n &&
            ((this.C.attack.targetId = n.id), this.send(this.C.attack))
          ) {
            this.marker(n.x, n.y, `attack`);
            return;
          }
          let r = this.proj.screenToGround(e.clientX, e.clientY, this.cursor),
            i = this.attackMove;
          ((i.x = r.x), (i.y = r.y), (i.next = 0));
          let a = this.C.amove;
          ((a.x = r.x),
            (a.y = r.y),
            this.send(a) &&
              ((i.active = !0), this.marker(r.x, r.y, `attackMove`)));
        }
      }
    }
    onPointerUp(e, t = !1) {
      (e.pointerType === `mouse` || e.pointerType === `pen`) &&
        e.button === 2 &&
        (this.right.held = !1);
      let n = this.joy;
      if (n.active && e.pointerId === n.pointerId) {
        this.endJoystick();
        return;
      }
      if (this.look.active && e.pointerId === this.look.pointerId) {
        this.endLook();
        return;
      }
      let r = this.abilityG;
      if (r.active && e.pointerId === r.pointerId) {
        ((r.active = !1),
          this.setPressed(r.slot, !1),
          !t &&
            this.active() &&
            (r.dragging || r.holdAim
              ? (this.refreshCancel(),
                this.cancelZone.hover || this.castFromAim())
              : ($() - r.t0 >= oe && (r.info || this.tooltipOpen(r.slot))) ||
                this.smartCast(r.slot)),
          this.aim.source === `touch` && this.endAim(),
          (r.el = null),
          (r.preview = !1));
        return;
      }
      let i = this.tapG;
      if (i.active && e.pointerId === i.pointerId) {
        ((i.active = !1),
          this.setPressed(i.slot, !1),
          !t &&
            this.active() &&
            i.slot === `B` &&
            (this.cancelAutoMoves(), this.send(this.C.recall)));
        return;
      }
      let a = this.attackHeld;
      a.on &&
        e.pointerId === a.pointerId &&
        ((a.on = !1), this.setPressed(`A`, !1));
    }
    onHudPointerDown(e) {
      if (
        ((this._panelAtDown = this.app.ui.panel),
        (this.attackMove.pending = !1),
        !this.active() ||
          ((e.pointerType === `mouse` || e.pointerType === `pen`) &&
            e.button !== 0))
      )
        return;
      let t = e.target && e.target.closest ? e.target : null;
      if (!t) return;
      let r = t.closest(`[data-joystick]`);
      if (r && !this.joy.active) {
        (e.preventDefault(), this.startJoystick(e, !1, r));
        return;
      }
      let i = t.closest(`[data-minimap]`);
      if (i && !this.look.active) {
        (e.preventDefault(), this.startLook(e, i));
        return;
      }
      let a = t.closest(`[data-slot]`);
      if (
        e.pointerType !== `mouse` &&
        e.pointerType !== `pen` &&
        this.levelUpNear(e, a)
      ) {
        e.preventDefault();
        return;
      }
      if (!a || !this.hudRoot.contains(a)) return;
      let o = a.getAttribute(`data-slot`);
      if (!o) return;
      e.preventDefault();
      try {
        a.setPointerCapture(e.pointerId);
      } catch {}
      if (o === `A`) {
        let t = this.attackHeld;
        ((t.on = !0),
          (t.pointerId = e.pointerId),
          (t.next = $() + 0.3),
          this.setPressed(`A`, !0),
          this.cancelAutoMoves(),
          this.pressAttack());
        return;
      }
      if (o === `B`) {
        let t = this.tapG;
        ((t.active = !0),
          (t.pointerId = e.pointerId),
          (t.slot = `B`),
          (t.el = a),
          this.setPressed(`B`, !0));
        return;
      }
      if (!n.includes(o) && o !== `D` && o !== `F`) return;
      let s = this.abilityG;
      if (s.active) return;
      ((s.active = !0),
        (s.pointerId = e.pointerId),
        (s.slot = o),
        (s.sx = s.cx = e.clientX),
        (s.sy = s.cy = e.clientY),
        (s.dragging = !1),
        (s.holdAim = !1),
        (s.preview = !1),
        (s.tip = !1),
        (s.el = a),
        (s.t0 = $()),
        this.setPressed(o, !0));
      let c = this.me();
      ((s.info = !c || !c.alive),
        c &&
          c.alive &&
          e.pointerType !== `mouse` &&
          (f(c, o, this.app.world.time, this.shape),
          this.shape.reason === `unlearned`
            ? (s.info = !0)
            : this.shape.needsAim &&
              this.shape.type !== `none` &&
              (this.aim.active && this.endAim(),
              this.beginAim(o, `touch`),
              (s.preview = !0))));
    }
    onHudClick(e) {
      if (!this.active()) return;
      let t = e.target;
      t &&
        t.closest &&
        t.closest(`[data-open-shop]`) &&
        !e.defaultPrevented &&
        this._panelAtDown === this.app.ui.panel &&
        this.app.fire(`ui`, {
          panel: this.app.ui.panel === `shop` ? `none` : `shop`,
        });
    }
    startJoystick(e, t, n) {
      let r = this.joy;
      ((n ||= this.hudRoot && this.hudRoot.querySelector(`[data-joystick]`)),
        (r.el = n),
        (r.knob = n ? n.querySelector(`[data-joystick-knob]`) : null));
      let i = e.clientX,
        a = e.clientY,
        o = 75 * this.uiScale();
      if (((r.scale = 1), n)) {
        let e = n.getBoundingClientRect();
        ((i = e.left + e.width / 2),
          (a = e.top + e.height / 2),
          (o = Math.max(40, e.width / 2)));
        let t = n.offsetWidth;
        if (t > 4 && e.width > 4) {
          let n = e.width / t;
          n > 0.05 && n < 20 && (r.scale = n);
        }
      }
      let s = e.clientX - i,
        c = e.clientY - a,
        l = t ? o * 1.6 : o * 0.9,
        u = Math.hypot(s, c);
      (u > l && ((s *= l / u), (c *= l / u)),
        !t && u < o * 0.3 && ((s = 0), (c = 0)),
        (r.active = !0),
        (r.pointerId = e.pointerId),
        (r.baseDX = s),
        (r.baseDY = c),
        (r.ox = i + s),
        (r.oy = a + c),
        (r.cx = e.clientX),
        (r.cy = e.clientY),
        (r.maxR = o * 0.62),
        (r.dirty = !0));
      try {
        (e.target && e.target.setPointerCapture
          ? e.target
          : n
        ).setPointerCapture(e.pointerId);
      } catch {}
      this.cancelAutoMoves();
    }
    endJoystick() {
      let e = this.joy;
      ((e.active = !1),
        (e.pointerId = -1),
        (e.baseDX = 0),
        (e.baseDY = 0),
        (e.cx = e.ox),
        (e.cy = e.oy),
        (e.dirty = !0));
    }
    writeJoystickDom() {
      let e = this.joy;
      if (!e.dirty) return;
      e.dirty = !1;
      let t = e.el,
        n = e.knob;
      if (t) {
        if (e.active) {
          let r = e.cx - e.ox,
            i = e.cy - e.oy,
            a = Math.sqrt(r * r + i * i);
          a > e.maxR && ((r *= e.maxR / a), (i *= e.maxR / a));
          let o = e.scale > 0.05 ? e.scale : 1;
          (t.setAttribute(`data-active`, ``),
            (t.style.translate = `${(e.baseDX / o).toFixed(1)}px ${(e.baseDY / o).toFixed(1)}px`),
            n &&
              (n.style.translate = `${(r / o).toFixed(1)}px ${(i / o).toFixed(1)}px`));
        } else
          (t.removeAttribute(`data-active`),
            (t.style.translate = ``),
            n && (n.style.translate = ``));
      }
    }
    placeCancel() {
      let t = this.cancelZone,
        n = this.uiScale();
      ((t.r = 50 * n), (t.dom = !1));
      let i = this.hudRoot && this.hudRoot.querySelector(`[data-cancel-zone]`);
      if (i) {
        let e = i.getBoundingClientRect();
        if (e.width > 4 && e.height > 4) {
          ((t.x = e.left + e.width / 2),
            (t.y = e.top + e.height / 2),
            (t.r = Math.min(e.width, e.height) / 2),
            (t.dom = !0));
          return;
        }
      }
      let a = null,
        o = this.app.registry && this.app.registry.get(`hud`);
      if (o && typeof o.rects == `function`)
        try {
          a = o.rects();
        } catch {
          a = null;
        }
      let s = innerWidth,
        c = innerHeight,
        l = t.r * 1.35,
        u = 26 * n,
        d = (this._cancelCands ||= new Float32Array(24)),
        f = (e, t, n) => {
          ((d[e * 2] = t), (d[e * 2 + 1] = n));
        };
      (f(0, s - 150 * n, c * 0.26),
        f(1, s - 150 * n, c * 0.36),
        f(2, s - 290 * n, c * 0.24),
        f(3, s - 150 * n, c * 0.46),
        f(4, s - 420 * n, c * 0.22),
        f(5, s * 0.62, c * 0.2),
        f(6, s - 290 * n, c * 0.4),
        f(7, s * 0.3, c * 0.24),
        f(8, s * 0.72, c * 0.34),
        f(9, s * 0.28, c * 0.44),
        f(10, s * 0.5, c * 0.22),
        f(11, s - 150 * n, c * 0.26));
      let p = -1e4,
        m = -1e4,
        h = this.rig(),
        g = this.me();
      if (h && g && typeof h.worldToScreen == `function`) {
        let t = h.worldToScreen(
          e(g, this.alpha),
          1.2,
          r(g, this.alpha),
          (this._selfPt ||= { x: 0, y: 0, visible: !1 }),
        );
        ((p = t.x), (m = t.y));
      }
      let _ = l + 58 * n,
        v = d[22],
        y = d[23],
        b = -1;
      for (let e = 0; e < 12; e++) {
        let n = d[e * 2],
          r = d[e * 2 + 1],
          i = !1;
        if (a)
          for (let e = 0; e < a.length; e++) {
            let t = a[e];
            if (
              !(t.width >= s * 0.9 && t.height >= c * 0.9) &&
              n + l > t.left &&
              n - l < t.right &&
              r + l + u > t.top &&
              r - l < t.bottom
            ) {
              i = !0;
              break;
            }
          }
        if (i) continue;
        let o = Math.hypot(n - p, r - m);
        if (o >= _) {
          ((t.x = n), (t.y = r));
          return;
        }
        o > b && ((b = o), (v = n), (y = r));
      }
      ((t.x = v), (t.y = y));
    }
    refreshCancel() {
      let e = this.cancelZone,
        t = this.abilityG;
      e.visible =
        this.aim.active &&
        this.aim.source === `touch` &&
        (t.dragging || t.holdAim);
      let n = t.cx - e.x,
        r = t.cy - e.y,
        i = e.visible && n * n + r * r < e.r * e.r * 1.44;
      ((e.hover = i),
        this.hudRoot &&
          i !== this._cancelHoverAttr &&
          (i
            ? this.hudRoot.setAttribute(`data-cancel-hover`, ``)
            : this.hudRoot.removeAttribute(`data-cancel-hover`),
          (this._cancelHoverAttr = i)));
    }
    releaseAll(e = !1) {
      if (
        ((this.arrows = 0),
        (this.space.down = !1),
        (this.lastHitKey.down = !1),
        (this.right.held = !1),
        (this.attackHeld.on = !1),
        (this.attackMove.pending = !1),
        (this.attackMove.active = !1),
        (this.touchHeld.lasthit = !1),
        (this.touchHeld.tower = !1),
        this.lastHitArmed && this.setArmed(!1),
        this.touch && this.touch.release(),
        this.endLook(),
        this.joy.active && this.endJoystick(),
        (this.abilityG.active = !1),
        (this.abilityG.preview = !1),
        (this.tapG.active = !1),
        (this.keyAimSlot = null),
        this.aim.active && !(e && this.aim.source === `debug`) && this.endAim(),
        this.dirState.sent &&
          this.app.world &&
          ((this.C.dir.dx = 0), (this.C.dir.dy = 0), this.send(this.C.dir)),
        (this.dirState.sent = !1),
        this.writeJoystickDom(),
        this.hudRoot)
      )
        for (let e of this.hudRoot.querySelectorAll(`[data-pressed]`))
          e.removeAttribute(`data-pressed`);
    }
    syncFrame(e) {
      if (e.state !== `game` || !e.world) return null;
      let t = e.world,
        n = t.units.get(e.playerId);
      if (this._syncT === e.time && this._syncWorld === t) return n;
      ((this._syncT = e.time), (this._syncWorld = t), (this.alpha = e.alpha));
      let r = $();
      if ((this.proj.begin(), this.mouse.known && this.mouse.overWorld)) {
        let n = g(
          t,
          this.proj,
          this.mouse.x,
          this.mouse.y,
          e.viewerTeam,
          e.alpha,
          4,
          !0,
          -1,
          this.hoverId,
        );
        ((this.hoverId = n ? n.id : -1),
          (this.hoverAt.x = this.mouse.x),
          (this.hoverAt.y = this.mouse.y));
      } else this.hoverId = -1;
      if (!n) return null;
      let i = this.abilityG;
      (i.active &&
        !i.dragging &&
        !i.holdAim &&
        !i.info &&
        r - i.t0 > 0.2 &&
        n.alive &&
        (f(n, i.slot, t.time, this.shape),
        this.shape.needsAim &&
          this.shape.type !== `none` &&
          ((i.holdAim = !0),
          (this.aim.active &&
            this.aim.source === `touch` &&
            this.aim.slot === i.slot) ||
            (this.aim.active && this.endAim(), this.beginAim(i.slot, `touch`)),
          this.setPressed(i.slot, !0))),
        i.active &&
          !i.info &&
          !i.tip &&
          !i.dragging &&
          i.holdAim &&
          r - i.t0 >= oe &&
          Math.hypot(i.cx - i.sx, i.cy - i.sy) <= 14 &&
          (i.tip = this.openTipWhileAiming(i.slot)));
      {
        let e = this.attackMove;
        if (e.pending && this.mouse.known) {
          let t = this.cursorGround();
          ((e.cx = t.x), (e.cy = t.y), (e.cursorOk = !0));
        } else e.cursorOk = !1;
      }
      return (
        this.aim.active &&
          (this.aim.source === `touch`
            ? (this.aim.strength =
                i.dragging || i.holdAim
                  ? 1
                  : Math.min(1, 0.35 + (0.65 * (r - i.t0)) / 0.12))
            : (this.aim.strength = 1),
          n.alive ? this.refreshAim() : this.endAim()),
        this.refreshCancel(),
        n
      );
    }
    setArmed(e) {
      ((this.lastHitArmed = e),
        this.hudRoot &&
          (e
            ? this.hudRoot.setAttribute(`data-lasthit`, ``)
            : this._armedAttr && this.hudRoot.removeAttribute(`data-lasthit`)));
      let t = this.slotEl(`A`);
      (t &&
        (e
          ? t.setAttribute(`data-pressed`, ``)
          : this._armedAttr &&
            !this.attackHeld.on &&
            t.removeAttribute(`data-pressed`)),
        (this._armedAttr = e));
    }
    syncUiRects() {
      let e = 0,
        t = (t) => {
          let n = this.uiRects[e];
          ((n ||= this.uiRects[e] =
            { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 }),
            (n.left = t.left),
            (n.top = t.top),
            (n.right = t.right),
            (n.bottom = t.bottom),
            (n.width = t.width),
            (n.height = t.height),
            e++);
        },
        n = this.settingsUI;
      if (n) for (let e = 0; e < n.occluderCount; e++) t(n.occluders[e]);
      let r = this.touch;
      if (r && r.visible)
        for (let e = 0; e < r.occluderCount; e++) t(r.occluders[e]);
      this.uiRectCount = e;
    }
    update(e) {
      if (this.settingsUI)
        try {
          this.settingsUI.update(e);
        } catch {}
      if (this.touch)
        try {
          this.touch.update(e);
        } catch {}
      if ((this.syncUiRects(), e.state !== `game`)) {
        ((this.aim.active || this.joy.active || this.dirState.sent) &&
          this.releaseAll(),
          this.lastHitArmed && this.setArmed(!1),
          (this.hoverId = -1),
          this.setCursor(``));
        return;
      }
      let t = this.syncFrame(e),
        n = $();
      if (t) {
        if (
          ((this.attackMove.range = (t.stats && t.stats.attackRange) || 1.5),
          t.alive ||
            ((this.attackMove.active = !1),
            (this.attackMove.pending = !1),
            (this.right.held = !1)),
          this.right.held && n >= this.right.next && t.alive)
        ) {
          this.right.next = n + 0.12;
          let e = this.proj.screenToGround(
              this.mouse.x,
              this.mouse.y,
              this.cursor,
            ),
            r = e.x - this.right.x,
            i = e.y - this.right.y;
          r * r + i * i > 0.09 &&
            (!t.order || t.order.type === `move`) &&
            ((this.C.move.x = e.x),
            (this.C.move.y = e.y),
            this.send(this.C.move),
            (this.right.x = e.x),
            (this.right.y = e.y));
        }
        {
          let e = this.attackMove;
          e.active &&
            (!t.alive || !t.order || t.order.type !== `attackMove`) &&
            (e.active = !1);
        }
        let e = this.space;
        (e.down &&
          n >= e.next &&
          ((e.next = n + 0.12),
          e.lastHit ? this.doLastHit(!1) : e.yielded || this.keepAttacking(t)),
          this.lastHitKey.down &&
            n >= this.lastHitKey.next &&
            ((this.lastHitKey.next = n + 0.12), this.doLastHit(!1)));
        let r =
          t.alive &&
          (this.lastHitKey.down ||
            (this.space.down && this.space.lastHit) ||
            this.touchHeld.lasthit);
        (r !== this.lastHitArmed && this.setArmed(r),
          this.attackHeld.on &&
            n >= this.attackHeld.next &&
            ((this.attackHeld.next = n + 0.2), this.keepAttacking(t)),
          this.updateDirection(t, n));
      }
      (this.writeJoystickDom(),
        this.setCursor(
          (this.aim.active && this.aim.source === `key`) ||
            this.attackMove.pending
            ? `crosshair`
            : this.hoverId >= 0
              ? `pointer`
              : ``,
        ));
    }
    updateDirection(e, t) {
      let n = 0,
        r = 0,
        i = this.joy;
      if (i.active) {
        let e = i.cx - i.ox,
          t = i.cy - i.oy,
          a = Math.sqrt(e * e + t * t);
        a > i.maxR * this.settings.joyDead && ((n = e / a), (r = t / a));
      } else
        this.arrows &&
          ((n = (this.arrows & 8 ? 1 : 0) - (this.arrows & 4 ? 1 : 0)),
          (r = (this.arrows & 2 ? 1 : 0) - (this.arrows & 1 ? 1 : 0)));
      let a = this.dirState;
      if (n || r) {
        if (!e.alive || t < a.suppressUntil || t - a.t < 0.05) return;
        let i = this.proj.screenDirToGround(n, r, this._dir),
          o = !a.sent || Math.abs(i.x - a.dx) + Math.abs(i.y - a.dy) > 0.03,
          s = !e.order || e.order.type !== `dir`;
        if (o || s) {
          if (
            s &&
            e.order &&
            e.order.type === `attack` &&
            e.attackWindupEnd > 0
          )
            return;
          ((this.C.dir.dx = i.x),
            (this.C.dir.dy = i.y),
            this.send(this.C.dir),
            (a.sent = !0),
            (a.dx = i.x),
            (a.dy = i.y),
            (a.t = t));
        }
      } else
        a.sent &&
          ((this.C.dir.dx = 0),
          (this.C.dir.dy = 0),
          this.send(this.C.dir),
          (a.sent = !1),
          (a.t = t));
    }
    setCursor(e) {
      e !== this.cursorStyle &&
        this.canvas &&
        ((this.cursorStyle = e), (this.canvas.style.cursor = e));
    }
    dispose() {
      this.releaseAll();
      for (let [e, t, n, r] of this.L) e.removeEventListener(t, n, r);
      if (((this.L.length = 0), this.settingsUI))
        try {
          this.settingsUI.dispose();
        } catch {}
      if (this.touch)
        try {
          this.touch.dispose();
        } catch {}
      if (
        this.keyboardLocked &&
        navigator.keyboard &&
        navigator.keyboard.unlock
      )
        try {
          navigator.keyboard.unlock();
        } catch {}
      for (let e of [`state`, `match`]) {
        let t = this.app.listeners && this.app.listeners.get(e);
        if (t) {
          let e = t.indexOf(this._onState);
          e >= 0 && t.splice(e, 1);
        }
      }
      {
        let e = this.app.listeners && this.app.listeners.get(`ui`);
        if (e) {
          let t = e.indexOf(this._onUi);
          t >= 0 && e.splice(t, 1);
        }
      }
    }
  };
export { X as CAST_MODES, ce as default };
