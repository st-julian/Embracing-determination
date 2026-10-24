import { D as e, O as t } from "./map-oE9sOnNc.js";
import { t as n } from "./events-WjIX4JqM.js";
import {
  Ct as r,
  D as i,
  Jt as a,
  Kt as o,
  Mt as s,
  N as c,
  O as l,
  Ot as u,
  Zt as d,
  _t as f,
  at as p,
  bt as m,
  dt as h,
  f as g,
  ht as _,
  jt as v,
} from "./index-DHK-Ptzs.js";
import { o as y } from "./height-CVtQdZ3e.js";
import {
  a as b,
  i as x,
  n as S,
  o as C,
  r as w,
  s as T,
  t as E,
} from "./unitRead-BVS0cQLI.js";
import { t as D } from "./palette-L_rDAXd8.js";
import { n as O } from "./sync-2oxeFGdP.js";
var k = `"Avenir Next", "Avenir", "Segoe UI", "Helvetica Neue", Roboto, system-ui, sans-serif`;
function A(e, t) {
  let n = document.createElement(`canvas`);
  return (
    (n.width = Math.max(1, Math.ceil(e))),
    (n.height = Math.max(1, Math.ceil(t))),
    n
  );
}
function j(e, t) {
  let n = t.size,
    r = t.weight || 700,
    i = t.strokeW || 0,
    a = `${t.italic ? `italic ` : ``}${r} ${n}px ${t.font || `"Avenir Next", "Avenir", "Segoe UI", "Helvetica Neue", Roboto, system-ui, sans-serif`}`,
    o = A(4, 4).getContext(`2d`);
  ((o.font = a), t.tracking && (o.letterSpacing = `${t.tracking}px`));
  let s = o.measureText(e),
    c = Math.ceil(s.actualBoundingBoxAscent || n * 0.75),
    l = Math.ceil(s.actualBoundingBoxDescent || n * 0.22),
    u = t.glow ? t.glow.blur : 0,
    d = t.shadow ? t.shadow.blur + Math.abs(t.shadow.dy || 0) : 0,
    f = Math.ceil(i + Math.max(u, d) + 2),
    p = Math.ceil(s.width + f * 2 + (t.tracking || 0)),
    m = c + l + f * 2,
    h = A(p, m),
    g = h.getContext(`2d`);
  ((g.font = a),
    t.tracking && (g.letterSpacing = `${t.tracking}px`),
    (g.textBaseline = `alphabetic`),
    (g.textAlign = `left`));
  let _ = f,
    v = f + c;
  if (
    ((g.lineJoin = `round`),
    (g.miterLimit = 2),
    t.glow &&
      (g.save(),
      (g.shadowColor = t.glow.color),
      (g.shadowBlur = t.glow.blur),
      (g.fillStyle = t.glow.color),
      g.fillText(e, _, v),
      g.restore()),
    i > 0 &&
      (g.save(),
      t.shadow &&
        ((g.shadowColor = t.shadow.color),
        (g.shadowBlur = t.shadow.blur),
        (g.shadowOffsetY = t.shadow.dy || 0)),
      (g.strokeStyle = t.stroke || `rgba(0,0,0,0.9)`),
      (g.lineWidth = i * 2),
      g.strokeText(e, _, v),
      g.restore()),
    t.fill2)
  ) {
    let e = g.createLinearGradient(0, v - c, 0, v + l * 0.3);
    (e.addColorStop(0, t.fill), e.addColorStop(1, t.fill2), (g.fillStyle = e));
  } else g.fillStyle = t.fill || `#fff`;
  return (
    g.fillText(e, _, v),
    {
      canvas: h,
      w: p,
      h: m,
      cx: _ + s.width / 2,
      cy: v - c / 2 - l * 0.1,
      asc: c,
      pad: f,
    }
  );
}
var M = class {
  constructor(e, t) {
    ((this.style = t), (this.size = t.size), (this.glyphs = new Map()));
    let n = `${t.italic ? `italic ` : ``}${t.weight || 800} ${t.size}px ${t.font || `"Avenir Next", "Avenir", "Segoe UI", "Helvetica Neue", Roboto, system-ui, sans-serif`}`,
      r = A(4, 4).getContext(`2d`);
    r.font = n;
    let i = r.measureText(`0123456789+-`),
      a = Math.ceil(i.actualBoundingBoxAscent || t.size * 0.74),
      o = Math.ceil(i.actualBoundingBoxDescent || t.size * 0.06),
      s = Math.ceil(
        (t.strokeW || 0) +
          (t.shadow ? t.shadow.blur + (t.shadow.dy || 0) : 0) +
          2,
      ),
      c = 0,
      l = [];
    for (let t of e) {
      let e = Math.round(r.measureText(t).width),
        n = Math.ceil(e + s * 2);
      (l.push({ ch: t, adv: e, x: c, cw: n }), (c += n + 2));
    }
    let u = a + o + s * 2;
    ((this.pad = s),
      (this.asc = a),
      (this.desc = o),
      (this.cellH = u),
      (this.strokeW = t.strokeW || 0),
      (this.shadowDown = t.shadow
        ? t.shadow.blur * 0.5 + (t.shadow.dy || 0)
        : 0),
      (this.extUp = Math.ceil(a / 2 + this.strokeW)),
      (this.extDown = Math.ceil(a / 2 + o + this.strokeW + this.shadowDown)),
      (this.outline = A(c, u)),
      (this.fill = A(c, u)));
    let d = this.outline.getContext(`2d`),
      f = this.fill.getContext(`2d`);
    for (let e of [d, f])
      ((e.font = n),
        (e.textBaseline = `alphabetic`),
        (e.lineJoin = `round`),
        (e.miterLimit = 2));
    let p = s + a;
    for (let e of l) {
      let n = e.x + s;
      t.strokeW &&
        (d.save(),
        t.shadow &&
          ((d.shadowColor = t.shadow.color),
          (d.shadowBlur = t.shadow.blur),
          (d.shadowOffsetY = t.shadow.dy || 0)),
        (d.strokeStyle = t.stroke),
        (d.lineWidth = t.strokeW * 2),
        d.strokeText(e.ch, n, p),
        (d.fillStyle = t.stroke),
        d.fillText(e.ch, n, p),
        d.restore());
      let r = f.createLinearGradient(0, p - a, 0, p);
      (r.addColorStop(0, t.top),
        r.addColorStop(0.55, t.mid || t.top),
        r.addColorStop(1, t.bottom),
        (f.fillStyle = r),
        f.fillText(e.ch, n, p),
        this.glyphs.set(e.ch.charCodeAt(0), { sx: e.x, sw: e.cw, adv: e.adv }));
    }
    if (t.gloss) {
      (f.save(), (f.globalCompositeOperation = `source-atop`));
      let e = f.createLinearGradient(0, p - a, 0, p - a * 0.35);
      (e.addColorStop(0, `rgba(255,255,255,0.55)`),
        e.addColorStop(1, `rgba(255,255,255,0)`),
        (f.fillStyle = e),
        f.fillRect(0, 0, c, p - a * 0.35),
        f.restore());
    }
    ((this.tracking = Math.round(t.tracking || 0)),
      (this.topOff = -Math.round(s + a / 2)),
      (this.gsx = new Int32Array(128).fill(-1)),
      (this.gsw = new Int32Array(128)),
      (this.gadv = new Int32Array(128)));
    for (let [e, t] of this.glyphs)
      e < 128 &&
        ((this.gsx[e] = t.sx), (this.gsw[e] = t.sw), (this.gadv[e] = t.adv));
  }
  measure(e, t) {
    let n = 0,
      r = 0;
    for (let i = 0; i < t; i++) {
      let t = e[i];
      t < 128 &&
        this.gsx[t] >= 0 &&
        (n += this.gadv[t] + (r++ ? this.tracking : 0));
    }
    return n;
  }
  drawBoth(e, t, n, r, i, a) {
    e.setTransform(a, 0, 0, a, r, i);
    let o = -(this.measure(t, n) >> 1) - this.pad,
      s = this.topOff,
      c = this.cellH;
    for (let r = 0; r < 2; r++) {
      let i = r === 0 ? this.outline : this.fill,
        a = o;
      for (let r = 0; r < n; r++) {
        let n = t[r];
        if (n >= 128) continue;
        let o = this.gsx[n];
        if (o < 0) continue;
        let l = this.gsw[n];
        (e.drawImage(i, o, 0, l, c, a, s, l, c),
          (a += this.gadv[n] + this.tracking));
      }
    }
    e.setTransform(1, 0, 0, 1, 0, 0);
  }
  draw(e, t, n, r, i, a, o) {
    e.setTransform(a, 0, 0, a, r, i);
    let s = o === 0 ? this.outline : this.fill,
      c = -(this.measure(t, n) >> 1) - this.pad,
      l = this.topOff,
      u = this.cellH;
    for (let r = 0; r < n; r++) {
      let n = t[r];
      if (n >= 128) continue;
      let i = this.gsx[n];
      if (i < 0) continue;
      let a = this.gsw[n];
      (e.drawImage(s, i, 0, a, u, c, l, a, u),
        (c += this.gadv[n] + this.tracking));
    }
    e.setTransform(1, 0, 0, 1, 0, 0);
  }
};
function N(e, t = 1) {
  let n = A(1, e),
    r = n.getContext(`2d`),
    i = r.createLinearGradient(0, 0, 0, e);
  return (
    i.addColorStop(0, `rgba(255,255,255,${0.42 * t})`),
    i.addColorStop(0.18, `rgba(255,255,255,${0.2 * t})`),
    i.addColorStop(0.5, `rgba(255,255,255,0)`),
    i.addColorStop(0.78, `rgba(0,0,0,0.06)`),
    i.addColorStop(1, `rgba(0,0,0,${0.28 * t})`),
    (r.fillStyle = i),
    r.fillRect(0, 0, 1, e),
    n
  );
}
function ee(e, t, n, r, i, a) {
  ((a = Math.min(a, i / 2, r / 2)),
    e.beginPath(),
    e.moveTo(t + a, n),
    e.lineTo(t + r - a, n),
    e.arcTo(t + r, n, t + r, n + a, a),
    e.lineTo(t + r, n + i - a),
    e.arcTo(t + r, n + i, t + r - a, n + i, a),
    e.lineTo(t + a, n + i),
    e.arcTo(t, n + i, t, n + i - a, a),
    e.lineTo(t, n + a),
    e.arcTo(t, n, t + a, n, a),
    e.closePath());
}
function te(e) {
  let t = parseInt(e.slice(1), 16);
  return { r: (t >> 16) & 255, g: (t >> 8) & 255, b: t & 255 };
}
function P(e, t, n = 1) {
  let r = te(e),
    i = (e) => Math.round(t >= 0 ? e + (255 - e) * t : e * (1 + t));
  return n >= 1
    ? `rgb(${i(r.r)},${i(r.g)},${i(r.b)})`
    : `rgba(${i(r.r)},${i(r.g)},${i(r.b)},${n})`;
}
function F(e, t) {
  let n = Array(e).fill(null);
  for (let r = 0; r < e; r++) n[r] = t(r);
  return n;
}
var I = F(256, (e) => e / 255),
  ne = F(257, (e) => e / 256),
  L = F(161, (e) => e / 4),
  re = F(257, (e) => -Math.PI / 2 + (Math.PI * 2 * e) / 256),
  ie = -Math.PI / 2,
  ae = Math.PI * 2,
  R = (e) => (e <= 0 ? 0 : e >= 1 ? 255 : (e * 255 + 0.5) | 0),
  oe = (e) => (e <= 0 ? 0 : e >= 1 ? 256 : (e * 256 + 0.5) | 0),
  se = (e) => (e <= 0 ? 0 : e >= 40 ? 160 : (e * 4 + 0.5) | 0),
  ce = 8,
  le = (e) => (typeof g == `function` ? g(e) : 160 + 90 * e),
  z = [
    {
      key: `knockup`,
      label: `Airborne`,
      color: `#ffb347`,
      track: `#3a2206`,
      field: `airborneUntil`,
    },
    {
      key: `stun`,
      label: `Stunned`,
      color: `#ffdc3c`,
      track: `#382e04`,
      field: `stunUntil`,
    },
    {
      key: `silence`,
      label: `Silenced`,
      color: `#d69cff`,
      track: `#2a1540`,
      field: `silenceUntil`,
    },
    {
      key: `root`,
      label: `Rooted`,
      color: `#4ff0c8`,
      track: `#073028`,
      field: `rootUntil`,
    },
    {
      key: `slow`,
      label: `Slowed`,
      color: `#bdefff`,
      track: `#123040`,
      field: `slowUntil`,
    },
  ],
  ue = { melee: 84, caster: 84, siege: 96, super: 104 },
  de = 60,
  fe = 0.06,
  pe = 0.1,
  me = 0.46,
  he = [50, 100, 150, 200, 250, 300, 400, 500, 750, 1e3, 1500, 2e3, 2500, 4e3],
  ge = 6,
  _e = 16,
  ve = 256,
  ye = 48,
  be = (t) =>
    t.kind === e.TOWER ||
    t.kind === e.INHIBITOR ||
    t.kind === e.NEXUS ||
    (t.kind === e.MONSTER && t.epic),
  B = [
    ``,
    `rgba(255,90,70,0.95)`,
    `rgba(255,150,40,0.95)`,
    `rgba(255,64,48,1)`,
  ],
  xe = `#ffd873`,
  Se = [
    ``,
    `rgba(255,90,70,0.22)`,
    `rgba(255,150,40,0.24)`,
    `rgba(255,50,40,0.32)`,
  ],
  Ce = [
    {
      hi: `#f4f7fb`,
      mid: `#a9b6c6`,
      lo: `#3a4658`,
      hair: `#e2c27a`,
      gem: `#6fe2ff`,
      gemLo: `#1a7fae`,
      track: `#1e2833`,
    },
    {
      hi: `#8b7f78`,
      mid: `#4a403c`,
      lo: `#171213`,
      hair: `#ff8a3a`,
      gem: `#ffb05a`,
      gemLo: `#b3380f`,
      track: `#2a201c`,
    },
  ];
function we(e) {
  let t = te(e),
    n = t.r * 0.3 + t.g * 0.59 + t.b * 0.11,
    r = (e) => Math.round((e + (n - e) * 0.42) * 0.5);
  return `rgb(${r(t.r)},${r(t.g)},${r(t.b)})`;
}
function Te(e) {
  let t = te(e),
    n = (e) => Math.round(158.1 + e * 0.38);
  return `rgb(${n(t.r)},${n(t.g)},${n(t.b)})`;
}
function Ee(e) {
  return {
    id: e.id,
    trailHp: e.hp,
    chunkFrom: e.hp,
    chunkT: 9,
    flashT: 9,
    level: e.level,
    pulse: 0,
    name: null,
    nameText: ``,
    ccDur: new Float32Array(z.length),
    ccStart: new Float32Array(z.length),
    sx: 0.5,
    sy: 0.5,
    cyDev: 0.5,
    vis: !1,
    stamp: 0,
    unit: e,
    rel: 0,
    hitFlash: 0.5,
    lastHp: e.hp,
    occ: 1.5,
    ttop: 0.5,
    tcx: 0.5,
    thw: 0.5,
    bx0: 0,
    by0: 0,
    bx1: 0,
    by1: 0,
    drawn: 0,
    plateH: 1.5,
    vx0: 0.5,
    vy0: 0.5,
    vx1: 0.5,
    vy1: 0.5,
    lx: 0.5,
    my: 0.5,
    nudge: 0.5,
    stack: 0.5,
    fadeK: 1.5,
    knock: 0.5,
    _hw: 0,
    _tw: 0,
    push: 0.5,
    shift: 0.5,
    clipK: 1.5,
    sep: 0.5,
    bury: 1.5,
    zi: -1,
    hp: 0.5,
    maxHp: 1.5,
    shield: 0.5,
    mana: 0.5,
    maxMana: 0.5,
    xp: 0.5,
    recall: -1.5,
    ccUntil: 0.5,
    fx: 0,
    fy: 0,
    fw: 0,
    fh: 0,
    bcx: 0,
    bcy: 0,
    nx: 0,
    ny: 0,
    nx1: 0,
    ny1: 0,
    ci: -1,
    cx: 0,
    cy: 0,
    topY: 0.5,
    bot: 0,
    hasMana: !1,
    ccY: 0,
    recallY: 0,
  };
}
var De = class {
    constructor() {
      ((this.state = new Map()),
        (this.stamp = 0),
        (this.D = 0),
        (this.K = 1),
        (this.ga = 1),
        (this._a = { x: 0.5, y: 0.5, z: 0.5 }),
        (this.lists = [[], [], [], []]),
        (this.counts = new Int32Array(4)),
        (this.zones = new Float32Array(64)),
        (this.nZones = 0),
        (this.drawnR = new Float32Array(ve * 4)),
        (this.nDrawn = 0),
        (this.smallR = new Float32Array(192)),
        (this.nSmall = 0),
        (this.cand = new Float32Array(34)),
        (this.stale = new Int32Array(64)),
        (this.col = {
          self: D.self,
          ally: D.ally,
          enemy: D.enemy,
          neutral: D.neutral,
          mana: D.mana,
          energy: D.energy,
          shield: `#bfe7ff`,
          shieldNotch: `rgba(10,46,70,0.3)`,
          shieldTop: `#ecf9ff`,
          shieldEdge: `#06141f`,
          track: `#232c38`,
          trackTop: `rgba(0,0,0,0.5)`,
          frame: `rgba(5,7,11,0.94)`,
          frameHi: `rgba(255,255,255,0.09)`,
          tick: `rgba(6,8,12,0.5)`,
          tickMajor: `rgba(255,255,255,0.32)`,
          tickMajorShade: `rgba(0,0,0,0.5)`,
          gap: `#030406`,
          smallTrack: `#232b36`,
          smallRim: `#1b222c`,
          monTrack: `#2c2519`,
          monRim: `#241d13`,
          plinth: `rgba(4,6,11,0.9)`,
          plinthHi: `rgba(255,255,255,0.07)`,
          ccCollar: `rgba(2,4,8,0.92)`,
        }),
        (this.colDim = { mana: P(D.mana, -0.25), energy: P(D.energy, -0.25) }),
        (this.dark = {}),
        (this.chunk = {}),
        (this.flash = {}));
      for (let e of [`self`, `ally`, `enemy`, `neutral`])
        ((this.dark[e] = P(this.col[e], -0.45)),
          (this.chunk[e] = we(this.col[e])),
          (this.flash[e] = Te(this.col[e])));
      ((this.relKeys = [`self`, `ally`, `enemy`, `neutral`]),
        (this.badges = []),
        (this.ccLabels = []),
        (this.epicNames = new Map()),
        (this.plates = []),
        (this.ccColor = z.map((e) => e.color)),
        (this.onDraw = null));
    }
    bake(e, t, n = 1920) {
      ((this.D = e), (this.K = t));
      let r = e * t;
      this.s = r;
      let i = (e) => Math.max(1, Math.round(e * r));
      ((this.L = {
        cW: i(150),
        cHpH: i(16),
        cManaH: i(5),
        cGap: Math.max(1, Math.round(1 * r)),
        cPad: i(2),
        badgeR: i(22),
        lift: i(4),
        mH: i(7),
        mB: Math.max(1, Math.round(1 * r)),
        mGap: Math.max(1, Math.round(e)),
        mLift: i(3),
        monW: i(96),
        monH: i(9),
        epicW: i(186),
        epicH: i(13),
        tick: Math.max(1, Math.round(1 * r)),
        tickMajor: Math.max(2, Math.round(1.6 * r)),
        minW: {},
        nudgeCap: i(16),
        ccH: Math.max(3, Math.round(3.4 * r)),
        ccGap: Math.max(2, Math.round(3 * r)),
        shieldNotch: Math.max(5, Math.round(7 * r)),
        sepGap: Math.max(2, Math.round(3 * r)),
        tether: Math.max(1, Math.round(1.4 * r)),
        recallH: Math.max(3, Math.round(4 * r)),
        pushMax: i(120),
        sW: [i(192), i(192), i(232)],
        sH: i(13),
        sLift: i(6),
      }),
        (this.L.ccR =
          this.L.badgeR +
          Math.round(this.L.ccH * 0.62) +
          Math.max(1, Math.round(0.8 * r))),
        (this.L.ccHalo = this.L.ccR + this.L.ccH));
      let a = Math.min(de, n * 0.0375);
      for (let t in ue) this.L.minW[t] = Math.max(Math.round(a * e), i(ue[t]));
      ((this.L.cManaW = Math.max(4, Math.round(this.L.cW * 0.88))),
        (this.smallPlates = new Map()),
        (this.glossC = N(this.L.cHpH, 1)),
        (this.glossM = N(this.L.cManaH, 0.8)),
        (this.glossS = this.bakeSmallGloss(this.L.mH)),
        (this.glossT = N(this.L.sH, 0.7)),
        (this.glossE = N(this.L.epicH, 1)),
        (this.glossMon = this.bakeSmallGloss(this.L.monH)),
        (this.glossM_h = this.glossM.height),
        (this.glossC_h = this.glossC.height),
        (this.glossS_h = this.glossS.height),
        (this.glossT_h = this.glossT.height),
        (this.glossE_h = this.glossE.height),
        (this.glossMon_h = this.glossMon.height),
        (this.badges.length = 0),
        (this.ccLabels.length = 0),
        this.epicNames.clear());
      for (let e of this.state.values()) e.name = null;
      for (let e of z)
        this.ccLabels.push(
          j(e.label.toUpperCase(), {
            size: Math.round(12 * r),
            weight: 700,
            fill: P(e.color, 0.12),
            strokeW: Math.max(1.4, 2.2 * r),
            stroke: `rgba(6,4,2,0.92)`,
            tracking: 1.5 * r,
            shadow: { color: `rgba(0,0,0,0.45)`, blur: 2 * r, dy: 1 * r },
          }),
        );
      ((this.recallLabel = j(`Recalling`, {
        size: Math.round(11 * r),
        weight: 700,
        fill: `#e6f4ff`,
        fill2: `#9fd6ff`,
        strokeW: Math.max(1.5, 2.4 * r),
        stroke: `rgba(4,10,18,0.92)`,
        tracking: 0.3 * r,
      })),
        (this.plates.length = 0));
      for (let e = 0; e < 3; e++)
        this.plates.push([
          this.bakePlate(this.L.sW[e], this.L.sH, 0),
          this.bakePlate(this.L.sW[e], this.L.sH, 1),
        ]);
    }
    bakeSmallGloss(e) {
      let t = A(1, e),
        n = t.getContext(`2d`),
        r = n.createLinearGradient(0, 0, 0, e);
      return (
        r.addColorStop(0, `rgba(255,255,255,0.28)`),
        r.addColorStop(0.33, `rgba(255,255,255,0.14)`),
        r.addColorStop(0.36, `rgba(255,255,255,0)`),
        r.addColorStop(0.58, `rgba(0,0,0,0.06)`),
        r.addColorStop(1, `rgba(0,0,0,0.38)`),
        (n.fillStyle = r),
        n.fillRect(0, 0, 1, e),
        t
      );
    }
    smallPlate(e, t, n, r) {
      let i = (!!r * 64 + n) * 1048576 + e * 1024 + t,
        a = this.smallPlates.get(i);
      if (a) return a;
      let o = this.s,
        s = Math.max(1.5, 2 * o),
        c = Math.ceil(6 * o) + n,
        l = e + n * 2,
        u = t + n * 2,
        d = l + c * 2,
        f = u + c * 2,
        p = r ? this.col.monRim : this.col.smallRim,
        m = r ? this.col.monTrack : this.col.smallTrack,
        h = A(d, f),
        g = h.getContext(`2d`);
      (g.save(),
        (g.shadowColor = `rgba(0,0,0,0.55)`),
        (g.shadowBlur = 2.4 * o),
        (g.shadowOffsetY = 1.2 * o),
        (g.fillStyle = p),
        ee(g, c, c, l, u, s),
        g.fill(),
        g.restore(),
        (g.fillStyle = m),
        g.fillRect(c + n, c + n, e, t),
        (g.fillStyle = `rgba(0,0,0,0.45)`),
        g.fillRect(c + n, c + n, e, Math.max(1, Math.round(o))));
      let _ = A(d, f),
        v = _.getContext(`2d`);
      return (
        (v.strokeStyle = p),
        (v.lineWidth = n),
        ee(
          v,
          c + n * 0.5,
          c + n * 0.5,
          l - n,
          u - n,
          Math.max(0.5, s - n * 0.5),
        ),
        v.stroke(),
        (v.strokeStyle = `rgba(255,255,255,0.10)`),
        (v.lineWidth = Math.max(1, Math.round(o * 0.8))),
        v.beginPath(),
        v.moveTo(c + s, c + n * 0.5),
        v.lineTo(c + l - s, c + n * 0.5),
        v.stroke(),
        (a = {
          back: h,
          rim: _,
          r: n,
          ox: c + n,
          oy: c + n,
          pad: c,
          cw: d,
          ch: f,
          w: e,
          h: t,
          rad: s,
          ol: [null, null, null, null],
        }),
        this.smallPlates.set(i, a),
        a
      );
    }
    smallOutline(e, t) {
      let n = e.ol[t];
      if (n) return n;
      let r = this.s,
        i = e.pad,
        a = e.r,
        o = e.w + a * 2,
        s = e.h + a * 2,
        c =
          t === 3
            ? Math.max(2, Math.round(2.4 * r))
            : Math.max(1.5, Math.round(1.8 * r));
      n = A(e.cw, e.ch);
      let l = n.getContext(`2d`);
      return (
        l.save(),
        (l.shadowColor = B[t]),
        (l.shadowBlur = 4 * r),
        (l.strokeStyle = B[t]),
        (l.lineWidth = c),
        (l.lineJoin = `round`),
        ee(l, i - c * 0.5, i - c * 0.5, o + c, s + c, e.rad + c * 0.5),
        l.stroke(),
        l.restore(),
        (e.ol[t] = n),
        n
      );
    }
    bakePlate(e, t, n) {
      let r = this.s,
        i = Ce[n],
        a = Math.max(1, Math.round(1.5 * r)),
        o = Math.max(2, Math.round(3 * r)),
        s = Math.max(4, Math.round(8 * r)),
        c = Math.max(2, Math.round(3 * r)),
        l = e + 2 * (a + o + s),
        u = t + 2 * (a + o),
        d = c + Math.ceil(6 * r),
        f = () => A(l + d * 2, u + d * 2),
        p = (e, t) => {
          let n = d + t,
            r = d + t,
            i = d + l - t,
            a = d + u - t,
            o = s - t * 0.4,
            c = d + u / 2;
          (e.beginPath(),
            e.moveTo(n + o, r),
            e.lineTo(i - o, r),
            e.lineTo(i, c),
            e.lineTo(i - o, a),
            e.lineTo(n + o, a),
            e.lineTo(n, c),
            e.closePath());
        },
        m = f(),
        h = m.getContext(`2d`);
      (h.save(),
        (h.shadowColor = `rgba(0,0,0,0.55)`),
        (h.shadowBlur = 5.5 * r),
        (h.shadowOffsetY = 3 * r),
        (h.fillStyle = `#04060a`),
        p(h, 0),
        h.fill(),
        (h.shadowBlur = 2.5 * r),
        (h.shadowOffsetY = 1.5 * r),
        p(h, 0),
        h.fill(),
        h.restore());
      let g = h.createLinearGradient(0, d + a, 0, d + u - a);
      (g.addColorStop(0, i.hi),
        g.addColorStop(0.42, i.mid),
        g.addColorStop(0.58, i.lo),
        g.addColorStop(1, P(i.lo.length === 7 ? i.lo : `#222222`, -0.3)),
        (h.fillStyle = g),
        p(h, a),
        h.fill(),
        (h.strokeStyle = i.hair),
        (h.globalAlpha = 0.9),
        (h.lineWidth = Math.max(1, 1 * r)),
        p(h, a + o * 0.55),
        h.stroke(),
        (h.globalAlpha = 1));
      for (let e of [0, 1]) {
        let t = e ? d + l - a - s * 0.42 : d + a + s * 0.42,
          n = d + u / 2,
          o = Math.max(2, 2.6 * r),
          c = h.createRadialGradient(t, n - o * 0.4, o * 0.1, t, n, o * 1.3);
        (c.addColorStop(0, `#ffffff`),
          c.addColorStop(0.35, i.gem),
          c.addColorStop(1, i.gemLo),
          (h.fillStyle = c),
          h.beginPath(),
          h.moveTo(t, n - o * 1.35),
          h.lineTo(t + o, n),
          h.lineTo(t, n + o * 1.35),
          h.lineTo(t - o, n),
          h.closePath(),
          h.fill());
      }
      let _ = d + a + o + s,
        v = d + a + o;
      ((h.fillStyle = `#020305`),
        h.fillRect(_ - 1, v - 1, e + 2, t + 2),
        (h.fillStyle = i.track),
        h.fillRect(_, v, e, t),
        (h.fillStyle = `rgba(0,0,0,0.55)`),
        h.fillRect(_, v, e, Math.max(1, Math.round(1.5 * r))));
      let y = [null];
      for (let e = 1; e <= 3; e++) {
        let t = f(),
          n = t.getContext(`2d`);
        (n.save(),
          (n.shadowColor = B[e]),
          (n.shadowBlur = 5 * r),
          (n.strokeStyle = B[e]),
          (n.lineWidth = e === 3 ? c : Math.max(2, Math.round(2.2 * r))),
          (n.lineJoin = `round`),
          p(n, -c * 0.5),
          n.stroke(),
          n.restore(),
          y.push(t));
      }
      return {
        canvas: m,
        outlines: y,
        tx: _ - d,
        ty: v - d,
        W: l,
        H: u,
        pad: d,
        wIn: e,
        hIn: t,
      };
    }
    badge(e) {
      let t = this.badges[e];
      if (t) return t;
      let n = this.L.badgeR,
        r = (n + Math.ceil(this.s * 3)) * 2,
        i = A(r, r),
        a = i.getContext(`2d`),
        o = r / 2,
        s = r / 2;
      (a.save(),
        (a.shadowColor = `rgba(0,0,0,0.55)`),
        (a.shadowBlur = 3 * this.s),
        (a.shadowOffsetY = 1 * this.s),
        (a.fillStyle = `#0b0e13`),
        a.beginPath(),
        a.arc(o, s, n, 0, Math.PI * 2),
        a.fill(),
        a.restore());
      let c = a.createLinearGradient(0, s - n, 0, s + n);
      (c.addColorStop(0, `#dfe5ec`),
        c.addColorStop(0.45, `#8e98a4`),
        c.addColorStop(1, `#3a414b`),
        (a.fillStyle = c),
        a.beginPath(),
        a.arc(o, s, n, 0, Math.PI * 2),
        a.fill());
      let l = n * 0.8,
        u = a.createRadialGradient(o, s - l * 0.35, l * 0.1, o, s, l);
      (u.addColorStop(0, `#343c48`),
        u.addColorStop(0.7, `#1a1f28`),
        u.addColorStop(1, `#0a0d12`),
        (a.fillStyle = u),
        a.beginPath(),
        a.arc(o, s, l, 0, Math.PI * 2),
        a.fill(),
        (a.strokeStyle = `rgba(0,0,0,0.65)`),
        (a.lineWidth = Math.max(1, this.s)),
        a.beginPath(),
        a.arc(o, s, l, 0, Math.PI * 2),
        a.stroke());
      let d = String(e);
      ((a.font = `800 ${Math.round(n * (d.length > 1 ? 0.9 : 1.02))}px ${k}`),
        (a.textAlign = `center`),
        (a.textBaseline = `alphabetic`));
      let f = a.measureText(d),
        p =
          s +
          (f.actualBoundingBoxAscent - (f.actualBoundingBoxDescent || 0)) / 2;
      ((a.lineJoin = `round`),
        (a.strokeStyle = `rgba(0,0,0,0.8)`),
        (a.lineWidth = Math.max(1.5, 2.2 * this.s)),
        a.strokeText(d, o, p));
      let m = a.createLinearGradient(0, p - f.actualBoundingBoxAscent, 0, p);
      return (
        m.addColorStop(0, `#ffffff`),
        m.addColorStop(1, `#d6dde6`),
        (a.fillStyle = m),
        a.fillText(d, o, p),
        (t = {
          canvas: i,
          d: r,
          half: r >> 1,
          ringR: Math.round((n + l) / 2),
          ringW: n - l,
        }),
        (this.badges[e] = t),
        t
      );
    }
    nameSprite(e, t) {
      if (e.name && e.nameText === t.name) return e.name;
      e.nameText = t.name || ``;
      let n = this.s;
      return (
        (e.name = j(e.nameText, {
          size: Math.round(15 * n),
          weight: 800,
          fill: `#ffffff`,
          fill2: `#dee5ed`,
          strokeW: Math.max(1.6, 2.8 * n),
          stroke: `rgba(3,5,8,0.92)`,
          tracking: 0.2 * n,
          shadow: { color: `rgba(0,0,0,0.5)`, blur: 2 * n, dy: 1 * n },
        })),
        e.name
      );
    }
    epicName(e) {
      let t = this.epicNames.get(e.subtype);
      if (t) return t;
      let n = this.s;
      return (
        (t = j(e.name || e.subtype, {
          size: Math.round(13 * n),
          weight: 800,
          fill: `#ffe3a3`,
          fill2: `#e8a93c`,
          strokeW: Math.max(1.5, 2.6 * n),
          stroke: `rgba(12,6,0,0.92)`,
          tracking: 0.6 * n,
        })),
        this.epicNames.set(e.subtype, t),
        t
      );
    }
    onEvents(e, t) {
      for (let r = 0; r < e.length; r++) {
        let i = e[r];
        if (i.type === n.CC) {
          let e = this.state.get(i.tgt);
          if (!e) continue;
          for (let n = 0; n < z.length; n++)
            z[n].key === i.cc &&
              ((e.ccDur[n] = i.duration), (e.ccStart[n] = t));
        }
      }
    }
    forget() {
      this.state.clear();
    }
    draw(t, n) {
      let r = n.world,
        i = n.proj,
        a = ++this.stamp,
        o = this._a,
        s = this.D;
      this.s;
      let c = i.e,
        l = i.l,
        u = i.t,
        d = i.w,
        f = i.h,
        p = this.counts;
      p.fill(0);
      let m = n.dt,
        h = r.unitList;
      for (let t = 0; t < h.length; t++) {
        let r = h[t];
        if (
          !r.alive ||
          r.kind === e.PROJECTILE ||
          r.kind === e.FOUNTAIN ||
          r.kind === e.WARD ||
          (r.visible && r.visible[n.viewerTeam] === !1)
        )
          continue;
        let i = this.state.get(r.id);
        ((!i || i.unit !== r) && ((i = Ee(r)), this.state.set(r.id, i)),
          (i.stamp = a),
          x(r, n.alpha));
        let g = S[2];
        if (
          ((i.hp = g),
          (i.maxHp = S[3] > 1 ? S[3] : 1),
          (i.shield = S[4]),
          (i.mana = S[5]),
          (i.maxMana = S[6]),
          (i.xp = S[7]),
          (i.recall = S[10]),
          g < i.lastHp - 0.5)
        ) {
          let e = i.chunkT >= 0.56;
          ((i.chunkFrom = Math.max(i.trailHp, i.lastHp)),
            (i.chunkT = e ? 0 : Math.min(i.chunkT, pe)),
            (e || i.flashT > 0.22) && (i.flashT = 0),
            (i.hitFlash = 1));
        }
        if (((i.chunkT += m), (i.flashT += m), g >= i.trailHp))
          ((i.trailHp = g), (i.chunkFrom = g));
        else {
          let e = Math.max(0, Math.min(1, (i.chunkT - pe) / me)),
            t = 1 - (1 - e) * (1 - e) * (1 - e);
          ((i.trailHp = g + (i.chunkFrom - g) * (1 - t)),
            e >= 1 && (i.trailHp = g));
        }
        ((i.lastHp = g),
          i.hitFlash > 0 && (i.hitFlash = Math.max(0, i.hitFlash - m * 8)),
          r.level !== i.level &&
            (r.level > i.level && r.kind === e.CHAMPION && (i.pulse = 1),
            (i.level = r.level)),
          i.pulse > 0 && (i.pulse = Math.max(0, i.pulse - m * 1.6)),
          n.anchors.get(r, n.alpha, `overhead`, o));
        let _ = !1,
          v = 0,
          y = 0;
        {
          let e = c[3] * o.x + c[7] * o.y + c[11] * o.z + c[15];
          if (e > 1e-4) {
            let t = (c[0] * o.x + c[4] * o.y + c[8] * o.z + c[12]) / e,
              n = (c[1] * o.x + c[5] * o.y + c[9] * o.z + c[13]) / e;
            ((v = l + (t * 0.5 + 0.5) * d),
              (y = u + (0.5 - n * 0.5) * f),
              (_ = t > -1.25 && t < 1.25 && n > -1.3 && n < 1.3));
          }
        }
        if (be(r)) {
          n.anchors.get(r, n.alpha, `ground`, o);
          let e = !1,
            t = 0,
            a = 0;
          {
            let n = c[3] * o.x + c[7] * o.y + c[11] * o.z + c[15];
            if (n > 1e-4) {
              let r = (c[0] * o.x + c[4] * o.y + c[8] * o.z + c[12]) / n,
                i = (c[1] * o.x + c[5] * o.y + c[9] * o.z + c[13]) / n;
              ((t = l + (r * 0.5 + 0.5) * d),
                (a = u + (0.5 - i * 0.5) * f),
                (e = r > -1.25 && r < 1.25 && i > -1.3 && i < 1.3));
            }
          }
          if (!e || a < u + 24) {
            if (!_) continue;
            i.cyDev = -1e9;
          } else i.cyDev = a * s;
          ((i.sx = (_ ? v : t) * s), (i.sy = _ ? y * s : -1e5));
        } else {
          if (!_) continue;
          ((i.sx = v * s), (i.sy = y * s), (i.cyDev = 1e9));
        }
        let b;
        r.kind === e.CHAMPION
          ? ((i.rel =
              r.id === n.playerId ? 0 : r.team === n.viewerTeam ? 1 : 2),
            (b = 3))
          : r.kind === e.MONSTER
            ? ((i.rel = 3), (b = r.epic ? 2 : 0))
            : r.kind === e.MINION
              ? ((i.rel = r.team === n.viewerTeam ? 1 : 2), (b = 0))
              : ((i.rel = r.team === n.viewerTeam ? 1 : 2), (b = 1));
        let C = this.lists[b],
          w = p[b]++;
        for (; w > 0 && C[w - 1].sy > i.sy; ) ((C[w] = C[w - 1]), w--);
        C[w] = i;
      }
      (a % 90 == 0 && this.sweep(a), (this.nZones = 0));
      let g = this.zones,
        _ = p[3];
      for (let e = _ - 1; e >= 0; e--) {
        let t = this.lists[3][e];
        if (
          (this.layoutChampion(t, n),
          (t.zi = this.nZones < _e ? this.nZones : -1),
          this.nZones < _e)
        ) {
          let e = this.nZones++ * 4;
          ((g[e] = t.vx0),
            (g[e + 1] = t.vy0),
            (g[e + 2] = t.vx1),
            (g[e + 3] = t.vy1));
        }
      }
      (this.burial(_, m), (this.nDrawn = 0), (this.nSmall = 0));
      let v = n.fade,
        y = n.occ,
        b = Math.min(1, m * 10);
      for (let r = 0; r <= 3; r++)
        for (let i = 0; i < p[r]; i++) {
          let o = this.lists[r][i];
          r === 0
            ? this.declutter(o, m)
            : r <= 2
              ? ((o.nudge = 0),
                (o.stack = 0),
                (o.fadeK = this.crossesPlate(o) ? 0.3 : 1))
              : ((o.nudge = 0),
                (o.stack = 0),
                (o.fadeK = o.clipK < o.bury ? o.clipK : o.bury));
          let s = o.fadeK;
          if (y && y.n > 0 && o.vx1 > o.vx0) {
            let e = y.q;
            ((e[0] = o.vx0),
              (e[1] = o.vy0),
              (e[2] = o.vx1),
              (e[3] = o.vy1),
              y.computeCover());
            let t = e[4];
            if (t > 0.02) {
              let e;
              if (r === 3) {
                if (t < 0.6) {
                  let n = (t - 0.05) / 0.55;
                  e = t <= 0.05 ? 1 : 1 - 0.45 * n * n * (3 - 2 * n);
                } else if (t < 0.9) {
                  let n = (t - 0.6) / 0.3;
                  e = 0.55 * (1 - n * n * (3 - 2 * n));
                } else e = 0;
              } else {
                let n = t >= 0.55 ? 1 : (t - 0.02) / 0.53;
                e = 1 - n * n * (3 - 2 * n);
              }
              e < s && (s = e);
            }
          }
          if (
            ((o.occ += (s - o.occ) * b),
            Math.abs(s - o.occ) < 0.01 && (o.occ = s),
            (this.ga = v * o.occ),
            (t.globalAlpha = I[R(this.ga)]),
            (globalThis.__mtPlate && globalThis.__mtPlate(this, t, o, n, r)) || // [MT-HOOK] mtPlates (mt/ui/plates.js paints Gen-5 plates)
            (r === 0
              ? o.unit.kind === e.MONSTER
                ? this.drawMonster(t, o, n, !1)
                : this.drawMinion(t, o, n)
              : r === 1
                ? this.drawStructure(t, o, n)
                : r === 2
                  ? this.drawMonster(t, o, n, !0)
                  : this.drawChampion(t, o, n)), // [MT-HOOK] mtPlates (closing paren)
            (o.drawn = a),
            r === 0 && this.keepSmall(o),
            this.nDrawn < ve && o.occ > 0.35)
          ) {
            let e = this.nDrawn++ * 4,
              t = this.drawnR;
            ((t[e] = o.vx0),
              (t[e + 1] = o.vy0),
              (t[e + 2] = o.vx1),
              (t[e + 3] = o.vy1));
          }
          this.onDraw &&
            this.onDraw(o.bx0 | 0, o.by0 | 0, o.bx1 | 0, o.by1 | 0);
        }
      globalThis.__mtPlatesFlush && globalThis.__mtPlatesFlush(this, t, n); // [MT-HOOK] mtPlatesFlush (mt plates: declutter + draw)
      ((t.globalAlpha = I[R(v)]), (this.ga = v));
    }
    sweep(e) {
      let t = 0,
        n = this.stale;
      this.state.forEach((r, i) => {
        r.stamp < e - 60 && t < n.length && (n[t++] = i);
      });
      for (let e = 0; e < t; e++) this.state.delete(n[e]);
    }
    declutter(t, n) {
      let r = t.unit,
        i = this.L,
        a = r.kind === e.MONSTER,
        o = a ? i.monW : i.minW[r.subtype] || i.minW.melee,
        s = a ? i.monH : i.mH,
        c = i.mB * 2,
        l = t.sx - o / 2 - c,
        u = t.sx + o / 2 + c,
        d = t.sy - i.mLift + c,
        f = d - s - 2 * c,
        p = this.zones,
        m = Math.max(2, Math.round(2 * this.s)),
        h = 0,
        g = 1;
      for (let e = 0; e < this.nZones; e++) {
        let t = e * 4,
          n = p[t],
          r = p[t + 1],
          a = p[t + 2],
          o = p[t + 3];
        if (u <= n || l >= a || d + h <= r || f + h >= o) continue;
        let c = d + h - r + m,
          _ = o - (f + h) + m,
          v = c <= _ ? -c : _;
        Math.abs(h + v) <= s + i.nudgeCap ? (h += v) : (g = 0.38);
      }
      if (
        ((t.nudge += (h - t.nudge) * Math.min(1, n * 14)),
        Math.abs(h - t.nudge) < 0.25 && (t.nudge = h),
        g === 1 && t.nudge !== h)
      ) {
        let e = f + t.nudge,
          n = d + t.nudge;
        for (let t = 0; t < this.nZones; t++) {
          let r = t * 4;
          if (u > p[r] && l < p[r + 2] && n > p[r + 1] && e < p[r + 3]) {
            g = 0.5;
            break;
          }
        }
      }
      let _ = this.smallR,
        v = this.nSmall,
        y = Math.max(1, Math.round(1.5 * this.s)),
        b = 0;
      if (v > 0) {
        let e = s * 6 + i.nudgeCap,
          n = f + t.nudge,
          r = d + t.nudge;
        for (let t = 0; t < 8; t++) {
          let t = 0;
          for (let e = 0; e < v; e++) {
            let i = e * 4;
            if (
              u <= _[i] ||
              l >= _[i + 2] ||
              r + b <= _[i + 1] ||
              n + b >= _[i + 3]
            )
              continue;
            let a = r + b - _[i + 1] + y;
            a > t && (t = a);
          }
          if (t <= 0) break;
          if (b - t < -e) {
            g = g < 0.8 ? g : 0.8;
            break;
          }
          b -= t;
        }
      }
      ((t.stack = b), (t.fadeK = g));
    }
    keepSmall(e) {
      if (this.nSmall >= ye) return;
      let t = this.nSmall++ * 4,
        n = this.smallR;
      ((n[t] = e.vx0),
        (n[t + 1] = e.vy0),
        (n[t + 2] = e.vx1),
        (n[t + 3] = e.vy1));
    }
    crossesPlate(e) {
      if (!(e.vx1 > e.vx0)) return !1;
      let t = this.zones;
      for (let n = 0; n < this.nZones; n++) {
        let r = n * 4;
        if (
          e.vx1 > t[r] &&
          e.vx0 < t[r + 2] &&
          e.vy1 > t[r + 1] &&
          e.vy0 < t[r + 3]
        )
          return !0;
      }
      return !1;
    }
    relColor(e) {
      return this.col[this.relKeys[e]];
    }
    relDark(e) {
      return this.dark[this.relKeys[e]];
    }
    outline(e, t) {
      return e.id === t.aimTargetId
        ? 3
        : e.id === t.targetId
          ? 2
          : +(e.id === t.hoverId);
    }
    fillBar(e, t, n, r, i, a, o, s, c, l, u, d, f) {
      let p = Math.min(a, Math.round((a * Math.min(t.trailHp, s)) / s)),
        m = t.hp,
        h = m > 0 ? Math.max(1, Math.round((a * m) / s)) : 0;
      h > 0 && ((e.fillStyle = c), e.fillRect(r, i, h, o));
      let g = 0;
      if (
        d &&
        t.shield > 0.5 &&
        ((g = Math.min(
          a - h,
          Math.max(1, Math.round((a * (m + t.shield)) / s) - h),
        )),
        g > 0)
      ) {
        let t = r + h;
        ((e.fillStyle = this.col.shield), e.fillRect(t, i, g, o));
        let n = this.L.shieldNotch,
          a = Math.max(1, this.L.tick);
        e.fillStyle = this.col.shieldNotch;
        for (let r = t + n; r < t + g; r += n) e.fillRect(r, i, a, o);
        ((e.fillStyle = this.col.shieldTop),
          e.fillRect(t, i, g, a),
          h > 0 &&
            ((e.fillStyle = this.col.shieldEdge), e.fillRect(t, i, a, o)));
      }
      if (
        (l && h + g > 0 && e.drawImage(l, 0, 0, 1, u, r, i, h + g, o),
        p > h + g)
      ) {
        let n = r + h + g,
          s = p - h - g;
        ((e.fillStyle = this.chunk[this.relKeys[f]]), e.fillRect(n, i, s, o));
        let c = t.flashT < fe ? 1 : Math.max(0, 1 - (t.flashT - fe) / 0.12);
        if (c > 0) {
          let t = Math.min(s, Math.max(2, Math.round(a * 0.18)));
          ((e.globalAlpha = I[R(this.ga * c * 0.45)]),
            (e.fillStyle = this.flash[this.relKeys[f]]),
            e.fillRect(n, i, t, o),
            (e.globalAlpha = I[R(this.ga)]));
        }
      }
      return (
        t.hitFlash > 0 &&
          h > 0 &&
          ((e.globalAlpha = I[R(this.ga * t.hitFlash * 0.22)]),
          (e.fillStyle = this.flash[this.relKeys[f]]),
          e.fillRect(r, i, h, o),
          (e.globalAlpha = I[R(this.ga)])),
        (t._hw = h),
        (t._tw = Math.max(p, h + g)),
        h
      );
    }
    tickStep(e) {
      let t = e / ge;
      for (let e = 0; e < he.length; e++) if (he[e] >= t) return he[e];
      return t;
    }
    layoutChampion(e, t) {
      (this.layoutAt(e, t, 0, 0), (e.plateH = e.vy1 - e.vy0));
      let n = t.safe,
        r = 0,
        i = 0;
      if (n) {
        let t = n.span(e.vx0, e.vx1) - e.vy0;
        t > 0 && ((r = t < this.L.pushMax ? t : this.L.pushMax), (i = t - r));
      }
      ((e.clipK = i > 0 ? (i < 60 * this.s ? 1 - i / (60 * this.s) : 0) : 1),
        (e.push += (r - e.push) * Math.min(1, t.dt * 16)),
        Math.abs(r - e.push) < 0.5 && (e.push = r));
      let a = 0;
      if (this.nZones > 0) {
        this.layoutAt(e, t, Math.round(e.push), 0);
        let r = this.zones,
          i = this.nZones,
          o = this.L.sepGap,
          s = e.plateH * 3,
          c = e.plateH * 1.2,
          l = e.vx0,
          u = e.vx1,
          d = e.vy0,
          f = e.vy1,
          p = u - l,
          m = n ? n.span(l, u) - d : -s,
          h = -s > m ? -s : m,
          g = this.cand,
          _ = 0;
        g[_++] = 0;
        for (let e = 0; e < i; e++) {
          let t = e * 4;
          if (u <= r[t] || l >= r[t + 2]) continue;
          let n = r[t + 1] - o - f;
          n < 0 && n >= h && (g[_++] = n);
          let i = r[t + 3] + o - d;
          i > 0 && i <= c && (g[_++] = i);
        }
        h < 0 && (g[_++] = h);
        let v = t.occ,
          y = v ? v.n : 0,
          b = 0,
          x = 0xde0b6b3a7640000;
        for (let e = 0; e < _; e++) {
          let t = g[e],
            n = d + t,
            a = f + t,
            o = t < 0 ? -t * p * 0.03 : t * p * 0.1;
          for (let e = 0; e < i; e++) {
            let t = e * 4,
              i = (u < r[t + 2] ? u : r[t + 2]) - (l > r[t] ? l : r[t]);
            if (i <= 0) continue;
            let s =
              (a < r[t + 3] ? a : r[t + 3]) - (n > r[t + 1] ? n : r[t + 1]);
            s <= 0 || (o += i * s);
          }
          for (let e = 0; e < y; e++) {
            let t = (u < v.r[e] ? u : v.r[e]) - (l > v.l[e] ? l : v.l[e]);
            if (t <= 0) continue;
            let r = (a < v.b[e] ? a : v.b[e]) - (n > v.t[e] ? n : v.t[e]);
            r <= 0 || (o += t * r * 2.5);
          }
          o < x && ((x = o), (b = t));
        }
        a = b;
      }
      ((e.sep += (a - e.sep) * Math.min(1, t.dt * 20)),
        Math.abs(a - e.sep) < 0.5 && (e.sep = a));
      let o = Math.round(e.push + e.sep);
      this.layoutAt(e, t, o, 0);
      let s = n ? n.span(e.vx0, e.vx1) : 2 * this.s;
      e.vy0 < s && ((o = Math.round(o + s - e.vy0)), this.layoutAt(e, t, o, 0));
      let c = this.D,
        l = Math.round(4 * this.s),
        u = t.proj,
        d = u.l * c,
        f = (u.l + u.w) * c,
        p = e.vx0 < d + l ? d + l - e.vx0 : 0,
        m = f - l - (e.vx1 + p);
      (m < 0 && (p += m),
        (e.shift = p),
        p !== 0 && this.layoutAt(e, t, o, Math.round(p)));
    }
    burial(e, t) {
      let n = Math.min(1, t * 10),
        r = this.lists[3],
        i = this.zones;
      for (let t = 0; t < e; t++) {
        let a = r[t],
          o = 0;
        if (a.zi >= 0) {
          let n = a.zi * 4,
            s = i[n],
            c = i[n + 1],
            l = i[n + 2],
            u = i[n + 3],
            d = (l - s) * (u - c);
          if (d > 0)
            for (let n = t + 1; n < e; n++) {
              let e = r[n];
              if (e.zi < 0) continue;
              let t = e.zi * 4,
                a = (l < i[t + 2] ? l : i[t + 2]) - (s > i[t] ? s : i[t]);
              if (a <= 0) continue;
              let f =
                (u < i[t + 3] ? u : i[t + 3]) - (c > i[t + 1] ? c : i[t + 1]);
              if (f <= 0) continue;
              let p = (a * f) / d;
              p > o && (o = p);
            }
        }
        let s = o > 0.06 ? (o < 0.5 ? 1 - (o - 0.06) * 1.14 : 0.5) : 1;
        ((a.bury += (s - a.bury) * n),
          Math.abs(s - a.bury) < 0.01 && (a.bury = s));
      }
    }
    layoutAt(e, t, n, r) {
      let i = e.unit,
        a = this.L,
        o = this.s,
        s = i.resource !== `none` && e.maxMana > 0;
      e.hasMana = s;
      let c = a.cW,
        l = a.cHpH,
        u = a.cPad,
        d = l + (s ? a.cGap + a.cManaH : 0),
        f = c + u * 2,
        p = d + u * 2,
        m = a.badgeR,
        h = Math.round(e.sx) + r,
        g = Math.round(e.sy) + n - a.lift,
        _ = h - Math.round(f / 2) + Math.round(m * 0.5),
        v = g - p;
      ((e.fx = _),
        (e.fy = v),
        (e.fw = f),
        (e.fh = p),
        (e.bcx = _ + Math.round(u * 0.5) - Math.round(m * 0.55)),
        (e.bcy = v + Math.round(p / 2)));
      let y = this.nameSprite(e, i),
        b = v - Math.round(1 * o);
      ((e.nx1 = 0),
        y.w > 2 &&
          ((e.nx = Math.round(_ + f / 2 - y.cx)),
          (e.ny = Math.round(b - y.h + y.pad * 0.6)),
          (e.nx1 = e.nx + y.w),
          (e.ny1 = e.ny + y.h),
          (b -= y.h - y.pad)));
      let x = w(i.cc, t.world.time);
      if (((e.ci = x), x >= 0 && (e.ccUntil = E[0]), x >= 0)) {
        let t = this.ccLabels[x];
        ((e.cx = Math.round(_ + f / 2 - t.cx)),
          (e.cy = Math.round(b - t.h + t.pad * 0.55)),
          (b = e.cy + Math.round(t.pad * 0.6)));
      }
      let S = v + p;
      ((e.ccY = S + a.ccGap),
        (e.recallY = S + Math.round(3 * o)),
        e.recall >= 0 &&
          (S =
            e.recallY +
            a.recallH +
            2 +
            this.recallLabel.h -
            this.recallLabel.pad),
        (e.topY = b),
        (e.bot = S));
      let C = (x >= 0 ? a.ccHalo : m) + Math.ceil(3 * o);
      ((e.vx0 = Math.min(_, e.bcx - C)),
        (e.vx1 = _ + f + Math.round(2 * o)),
        (e.vy0 = Math.min(b, e.bcy - C)),
        (e.vy1 = Math.max(S, e.bcy + C)),
        (e.lx = e.bcx - m),
        (e.my = e.bcy));
    }
    drawChampion(e, t, n) {
      let r = t.unit,
        i = this.L,
        a = this.s,
        o = i.cW,
        s = i.cHpH,
        c = i.cPad,
        l = i.badgeR,
        u = t.fx,
        d = t.fy,
        f = t.fw,
        p = t.fh,
        m = this.outline(r, n);
      if (m) {
        let t = Math.round((m === 3 ? 4 : 3) * a),
          n = Math.round((m === 3 ? 2.2 : 1.5) * a);
        ((e.fillStyle = Se[m]),
          e.fillRect(u - t, d - t, f + t * 2, p + t * 2),
          (e.fillStyle = B[m]),
          e.fillRect(u - n, d - n, f + n * 2, p + n * 2));
      }
      ((e.fillStyle = this.col.frame),
        e.fillRect(u, d, f, p),
        (e.fillStyle = this.col.frameHi),
        e.fillRect(u, d, f, Math.max(1, Math.round(a * 0.8))));
      let h = u + c,
        g = d + c;
      ((e.fillStyle = this.col.track),
        e.fillRect(h, g, o, s),
        (e.fillStyle = this.col.trackTop),
        e.fillRect(h, g, o, Math.max(1, Math.round(a))));
      let _ = Math.max(t.maxHp, t.hp + t.shield);
      this.fillBar(
        e,
        t,
        r,
        h,
        g,
        o,
        s,
        _,
        this.relColor(t.rel),
        this.glossC,
        this.glossC_h,
        !0,
        t.rel,
      );
      let v = this.tickStep(_),
        y = _ > 2500,
        b = Math.max(2, Math.round(s * 0.46)),
        x = h + t._hw;
      for (let t = v; t < _ - 1; t += v) {
        let n = h + Math.round((o * t) / _);
        if (n >= x - i.tick) break;
        if (y && t % 1e3 == 0) {
          let t = i.tick;
          ((e.fillStyle = this.col.tickMajorShade),
            e.fillRect(n, g, t, s),
            (e.fillStyle = this.col.tickMajor),
            e.fillRect(n - t, g, t, s));
        } else ((e.fillStyle = this.col.tick), e.fillRect(n, g, i.tick, b));
      }
      if (t.hasMana) {
        let n = i.cManaW,
          a = h + ((o - n) >> 1),
          c = g + s + i.cGap;
        ((e.fillStyle = `#0a0f18`), e.fillRect(a, c, n, i.cManaH));
        let l = Math.round(n * Math.max(0, Math.min(1, t.mana / t.maxMana)));
        l > 0 &&
          ((e.fillStyle =
            r.resource === `energy` ? this.colDim.energy : this.colDim.mana),
          e.fillRect(a, c, l, i.cManaH),
          e.drawImage(this.glossM, 0, 0, 1, this.glossM_h, a, c, l, i.cManaH));
      }
      let S = this.badge(r.level),
        C = t.bcx,
        w = t.bcy,
        T = t.pulse,
        E =
          T > 0 ? 1 + 0.28 * Math.sin(Math.min(1, (1 - T) * 1.6) * Math.PI) : 1;
      if (
        (T > 0 &&
          ((e.globalAlpha = I[R(this.ga * 0.5 * T)]),
          (e.fillStyle = `#ffd66e`),
          e.beginPath(),
          e.arc(C, w, ((l + 7 * a) * E + 0.5) | 0, 0, ae),
          e.fill(),
          (e.globalAlpha = I[R(this.ga)])),
        E === 1)
      )
        e.drawImage(S.canvas, C - S.half, w - S.half);
      else {
        let t = (S.half * E + 0.5) | 0;
        e.drawImage(S.canvas, C - t, w - t, t * 2, t * 2);
      }
      let D = r.level >= 15 ? 1 : Math.max(0, Math.min(1, t.xp / le(r.level)));
      D > 0.005 &&
        ((e.strokeStyle = t.rel === 0 ? `#f5f9ff` : `rgba(236,244,252,0.9)`),
        (e.lineWidth = L[se(S.ringW * 0.62 * E)]),
        (e.lineCap = `butt`),
        e.beginPath(),
        e.arc(C, w, E === 1 ? S.ringR : (S.ringR * E + 0.5) | 0, ie, re[oe(D)]),
        e.stroke());
      let O = n.world.time,
        k = t.ci;
      if (k >= 0) {
        let n = t.ccDur[k] > 0 ? t.ccDur[k] : 1,
          r = Math.max(0, Math.min(1, (t.ccUntil - O) / n)),
          o = E === 1 ? i.ccR : (i.ccR * E + 0.5) | 0;
        ((e.lineCap = `butt`),
          (e.lineWidth = L[se(i.ccH + 2 * a)]),
          (e.strokeStyle = this.col.ccCollar),
          e.beginPath(),
          e.arc(C, w, o, 0, ae),
          e.stroke(),
          r > 0.004 &&
            ((e.lineWidth = L[se(i.ccH)]),
            (e.strokeStyle = this.ccColor[k]),
            e.beginPath(),
            e.arc(C, w, o, ie, re[oe(r)]),
            e.stroke()));
      }
      let A = t.name;
      if (A && t.nx1 > 0) {
        let r = !1,
          i = t.nx + A.pad,
          o = t.nx1 - A.pad,
          s = t.ny + A.pad * 0.5,
          c = t.ny1 - A.pad * 0.5,
          l = this.drawnR;
        for (let e = 0; e < this.nDrawn; e++) {
          let t = e * 4;
          if (l[t + 2] > i && l[t] < o && l[t + 3] > s && l[t + 1] < c) {
            r = !0;
            break;
          }
        }
        if (!r) {
          let e = this.zones,
            n = t.zi;
          for (let t = 0; t < this.nZones; t++) {
            if (t === n) continue;
            let a = t * 4;
            if (e[a + 2] > i && e[a] < o && e[a + 3] > s && e[a + 1] < c) {
              r = !0;
              break;
            }
          }
        }
        if (
          ((t.knock += (+!!r - t.knock) * Math.min(1, n.dt * 12)),
          t.knock < 0.01 && (t.knock = 0),
          t.knock > 0.02)
        ) {
          let n = Math.round(i - 3 * a),
            r = Math.round(o - i + 6 * a),
            l = Math.round(s - 1 * a),
            u = Math.round(c - s + 2 * a);
          ((e.globalAlpha = I[R(this.ga * t.knock)]),
            (e.fillStyle = this.col.plinth),
            e.fillRect(n, l, r, u),
            (e.fillStyle = this.col.plinthHi),
            e.fillRect(n, l, r, Math.max(1, Math.round(a))),
            (e.globalAlpha = I[R(this.ga)]));
        }
        e.drawImage(A.canvas, t.nx, t.ny);
      }
      if (k >= 0) {
        let n = this.ccLabels[k];
        e.drawImage(n.canvas, t.cx, t.cy);
      }
      if (t.recall >= 0) {
        let n = r.recallDuration || ce,
          o = Math.max(0, Math.min(1, (O - t.recall) / n)),
          s = t.recallY,
          c = i.recallH;
        ((e.fillStyle = `rgba(4,8,14,0.9)`),
          e.fillRect(u, s, f, c + 2),
          (e.fillStyle = `#7cc8ff`),
          e.fillRect(u + 1, s + 1, Math.round((f - 2) * o), c),
          (e.fillStyle = `rgba(255,255,255,0.55)`),
          e.fillRect(
            u + 1,
            s + 1,
            Math.round((f - 2) * o),
            Math.max(1, c >> 2),
          ));
        let l = this.recallLabel;
        e.drawImage(
          l.canvas,
          Math.round(u + f / 2 - l.cx),
          s + c + Math.round(1 * a) - l.pad,
        );
      }
      let j = t.sep < -3 ? Math.round(-t.sep) : 0;
      if (j > 0) {
        let n = i.tether,
          r = u + ((f - n) >> 1),
          a = d + p;
        ((e.globalAlpha =
          I[R(this.ga * Math.min(0.55, (j / (t.plateH + 1)) * 0.5))]),
          (e.fillStyle = `rgba(2,4,8,0.9)`),
          e.fillRect(r - 1, a, n + 2, j),
          (e.fillStyle = this.relColor(t.rel)),
          e.fillRect(r, a, n, j),
          (e.globalAlpha = I[R(this.ga)]));
      }
      ((t.ttop = t.topY),
        (t.tcx = u + f / 2),
        (t.thw = f / 2),
        (t.bx0 = t.vx0 - 14 * a),
        (t.bx1 = t.vx1 + 8 * a),
        (t.by0 = t.vy0 - 12 * a),
        (t.by1 = t.vy1 + 12 * a + j));
    }
    executable(t, n, r) {
      if (
        !r.execArmed ||
        !(t.kind === e.MINION
          ? n.rel === 2
          : t.kind === e.MONSTER && n.rel === 3)
      )
        return !1;
      let i = t.x - r.execX,
        a = t.y - r.execY;
      if (Math.sqrt(i * i + a * a) - (t.radius || 0) - r.execRad > r.execR)
        return !1;
      let o = (t.stats && t.stats.armor) || 0;
      return n.hp <= ((r.execAd * 100) / (100 + (o > 0 ? o : 0))) * 0.98;
    }
    drawMinion(e, t, n) {
      let r = t.unit,
        i = this.L,
        a = i.minW[r.subtype] || i.minW.melee,
        o = i.mH,
        s = this.smallPlate(a, o, i.mB, !1),
        c = s.r,
        l = Math.round(t.sx - a / 2),
        u = Math.round(t.sy + t.nudge + t.stack) - i.mLift - o,
        d = this.executable(r, t, n),
        f = d ? 2 : this.outline(r, n);
      (f && e.drawImage(this.smallOutline(s, f), l - s.ox, u - s.oy),
        e.drawImage(s.back, l - s.ox, u - s.oy),
        this.fillBar(
          e,
          t,
          r,
          l,
          u,
          a,
          o,
          t.maxHp,
          d ? xe : this.relColor(t.rel),
          this.glossS,
          this.glossS_h,
          !1,
          t.rel,
        ),
        e.drawImage(s.rim, l - s.ox, u - s.oy),
        (t.ttop = u - c),
        (t.tcx = l + a / 2),
        (t.thw = a / 2 + c),
        (t.vx0 = l - c),
        (t.vx1 = l + a + c),
        (t.vy0 = u - c),
        (t.vy1 = u + o + c),
        (t.bx0 = l - s.ox),
        (t.bx1 = l - s.ox + s.cw),
        (t.by0 = u - s.oy),
        (t.by1 = u - s.oy + s.ch));
    }
    clampTall(e, t, n, r) {
      let i = e.safe;
      if (!i) return t;
      let a = i.span(n, r);
      return t >= a ? t : a;
    }
    drawMonster(e, t, n, r) {
      let i = t.unit,
        a = this.L,
        o = r ? a.epicW : a.monW,
        s = r ? a.epicH : a.monH,
        c = this.smallPlate(
          o,
          s,
          r ? Math.max(2, Math.round(2 * this.s)) : a.mB,
          !0,
        ),
        l = c.r,
        u = Math.round(t.sx - o / 2),
        d = Math.round(t.sy + t.nudge + t.stack) - a.mLift - s;
      if (r) {
        let e = this.epicName(i),
          t = l + e.h - e.pad * 0.7;
        d = Math.round(this.clampTall(n, d - t, u - l, u + o + l) + t);
      }
      let f = this.executable(i, t, n),
        p = f ? 2 : this.outline(i, n);
      (p && e.drawImage(this.smallOutline(c, p), u - c.ox, d - c.oy),
        e.drawImage(c.back, u - c.ox, d - c.oy),
        this.fillBar(
          e,
          t,
          i,
          u,
          d,
          o,
          s,
          t.maxHp,
          f ? xe : i.resetting ? `#9a8a6a` : this.col.neutral,
          r ? this.glossE : this.glossMon,
          r ? this.glossE_h : this.glossMon_h,
          !1,
          3,
        ),
        e.drawImage(c.rim, u - c.ox, d - c.oy));
      let m = d - l;
      if (r) {
        let n = t.maxHp;
        e.fillStyle = this.col.tick;
        let r = this.tickStep(n),
          c = u + t._hw - a.tick;
        for (let t = r; t < n - 1; t += r) {
          let r = u + Math.round((o * t) / n);
          if (r >= c) break;
          e.fillRect(r, d, a.tick, s);
        }
        let f = this.epicName(i),
          p = Math.round(d - l - f.h + f.pad * 0.7);
        (e.drawImage(f.canvas, Math.round(u + o / 2 - f.cx), p), (m = p));
      }
      ((t.ttop = m),
        (t.tcx = u + o / 2),
        (t.thw = o / 2 + l),
        (t.vx0 = u - l),
        (t.vx1 = u + o + l),
        (t.vy0 = r ? m : d - l),
        (t.vy1 = d + s + l),
        (t.bx0 = u - c.ox),
        (t.bx1 = u - c.ox + c.cw),
        (t.by0 = m < d - c.oy ? m : d - c.oy),
        (t.by1 = d - c.oy + c.ch));
    }
    drawStructure(t, n, r) {
      let i = n.unit,
        a = this.L,
        o = this.s,
        s = i.kind === e.NEXUS ? 2 : +(i.kind === e.INHIBITOR),
        c = this.plates[s][+(i.team === 1)],
        l = c.wIn,
        u = c.hIn,
        d = Math.round(n.sx - c.W / 2),
        f = Math.round(n.sy) - a.sLift - c.H;
      ((f = Math.round(this.clampTall(r, f, d, d + c.W))),
        n.cyDev > -1e8 && n.cyDev < f && (t.globalAlpha = I[R(this.ga * 0.7)]));
      let p = this.outline(i, r);
      (p && t.drawImage(c.outlines[p], d - c.pad, f - c.pad),
        t.drawImage(c.canvas, d - c.pad, f - c.pad));
      let m = d + c.tx,
        h = f + c.ty,
        g = i.invulnerable ? this.relDark(n.rel) : this.relColor(n.rel),
        _ = n.maxHp;
      this.fillBar(
        t,
        n,
        i,
        m,
        h,
        l,
        u,
        _,
        g,
        i.invulnerable ? null : this.glossT,
        this.glossT_h,
        !1,
        n.rel,
      );
      let v = Math.max(2, Math.round(u * 0.45)),
        y = m + n._hw - a.tick;
      t.fillStyle = this.col.tick;
      for (let e = 500; e < _ - 1; e += 1e3) {
        let n = m + Math.round((l * e) / _);
        if (n >= y) break;
        t.fillRect(n, h + u - v, a.tick, v);
      }
      let b = a.tick;
      for (let e = 1e3; e < _ - 1; e += 1e3) {
        let n = m + Math.round((l * e) / _);
        ((t.fillStyle = this.col.tickMajorShade),
          t.fillRect(n, h, b, u),
          (t.fillStyle = this.col.tickMajor),
          t.fillRect(n - b, h, b, u));
      }
      (i.invulnerable &&
        ((t.fillStyle = `rgba(8,10,16,0.35)`), t.fillRect(m, h, l, u)),
        n.cyDev > -1e8 && n.cyDev < f && (t.globalAlpha = I[R(this.ga)]),
        (n.ttop = f),
        (n.tcx = d + c.W / 2),
        (n.thw = c.W / 2),
        (n.vx0 = d),
        (n.vx1 = d + c.W),
        (n.vy0 = f),
        (n.vy1 = f + c.H));
      let x = c.pad + Math.round(4 * o);
      ((n.bx0 = d - x),
        (n.bx1 = d + c.W + x),
        (n.by0 = f - x),
        (n.by1 = f + c.H + x));
    }
  },
  Oe = `0123456789+-`,
  ke = {
    physical: {
      top: `#fff4d6`,
      mid: `#ffb03a`,
      bottom: `#ff5a12`,
      stroke: `#240800`,
      size: 27,
      strokeW: 3.6,
    },
    magic: {
      top: `#fbf1ff`,
      mid: `#cf97ff`,
      bottom: `#8a34ff`,
      stroke: `#15032c`,
      size: 27,
      strokeW: 3.6,
    },
    true: {
      top: `#ffffff`,
      mid: `#f4f6fa`,
      bottom: `#c3ccda`,
      stroke: `#0f1217`,
      size: 27,
      strokeW: 3.6,
    },
    crit: {
      top: `#fff8d2`,
      mid: `#ffbd2e`,
      bottom: `#ff420c`,
      stroke: `#220400`,
      size: 46,
      italic: !0,
      strokeW: 4.4,
    },
    heal: {
      top: `#effff0`,
      mid: `#8ff07a`,
      bottom: `#1fbe4c`,
      stroke: `#021d0a`,
      size: 24,
      strokeW: 3.4,
    },
    gold: {
      top: `#fffbe0`,
      mid: `#ffd54f`,
      bottom: `#e8900a`,
      stroke: `#261300`,
      size: 25,
      strokeW: 3.4,
    },
    taken: {
      top: `#ffffff`,
      mid: `#ffd9cf`,
      bottom: `#ff7a5e`,
      stroke: `#240402`,
      size: 22,
      strokeW: 3.2,
    },
  },
  Ae = {
    physical: 0.95,
    magic: 0.95,
    true: 0.95,
    crit: 1.25,
    heal: 1.05,
    gold: 1.35,
    taken: 0.9,
  },
  je = { last_hit: !0, kill: !0, turret: !0, objective: !0, inhibitor: !0 },
  V = 128,
  Me = [1, -1, 1, -1, 1],
  Ne = { champion: 44, small: 18, structure: 22 },
  Pe = (t) =>
    t.kind === e.TOWER ||
    t.kind === e.NEXUS ||
    t.kind === e.INHIBITOR ||
    (t.kind === e.MONSTER && t.epic),
  Fe = class {
    constructor(e = 256) {
      ((this.size = e),
        (this.keys = new Int32Array(e).fill(-1)),
        (this.t = new Float32Array(e)),
        (this.slot = new Uint8Array(e)));
    }
    find(e, t) {
      let n = this.size,
        r = Math.imul(e, 2654435761) >>> 0;
      r = (r ^ (r >>> 15)) & (n - 1);
      let i = -1;
      for (let a = 0; a < 48; a++) {
        let o = (r + a) & (n - 1),
          s = this.keys[o];
        if (s === e) return o;
        if (s === -1) return i >= 0 ? i : o;
        i < 0 && t - this.t[o] > 2 && (i = o);
      }
      if (i >= 0) return i;
      let a = r,
        o = 1 / 0;
      for (let e = 0; e < 48; e++) {
        let t = (r + e) & (n - 1);
        this.t[t] < o && ((o = this.t[t]), (a = t));
      }
      return a;
    }
    clear() {
      this.keys.fill(-1);
    }
  },
  Ie = class {
    constructor() {
      this.pool = [];
      for (let e = 0; e < V; e++)
        this.pool.push({
          on: !1,
          t: 0.5,
          life: 1.5,
          style: `physical`,
          codes: new Uint16Array(10),
          n: 0,
          w: 0,
          wx: 0.5,
          wy: 0.5,
          wz: 0.5,
          cx: 0.5,
          cy: 0.5,
          cz: 0.5,
          alt: !1,
          ox: 0.5,
          dx: 0.5,
          scale: 1.5,
          peak: 1.3,
          rise: 40.5,
          seq: 0,
          dim: 1.5,
          key: -1,
          lift: 0.5,
          liftTo: 0.5,
          tgt: -1,
          clear: 18.5,
          occ: 1.5,
          sx: 0.5,
          sy: 0.5,
          x0: 0.5,
          y0: 0.5,
          x1: 0.5,
          y1: 0.5,
          mode: 0,
          barTop: 0.5,
        });
      ((this.seq = 0),
        (this.atlas = {}),
        (this.D = 0),
        (this.s = 1),
        (this.table = new Fe(256)),
        (this._p = { x: 0, y: 0, visible: !1, depth: 0 }),
        (this._a = { x: 0, y: 0, z: 0 }),
        (this.time = 0),
        (this.bars = null),
        (this.anchors = null),
        (this.onDraw = null),
        (this.safe = null),
        (this._cand = new Float64Array(64)),
        (this.placed = new Float32Array(512)),
        (this.nPlaced = 0));
    }
    bake(e, t) {
      ((this.D = e), (this.s = e * t));
      let n = this.s;
      for (let e in ke) {
        let t = ke[e];
        this.atlas[e] = new M(Oe, {
          size: Math.round(t.size * n),
          weight: 900,
          italic: t.italic,
          top: t.top,
          mid: t.mid,
          bottom: t.bottom,
          stroke: t.stroke,
          strokeW: Math.max(2, t.strokeW * n),
          gloss: !0,
          tracking: -1.2 * n,
          shadow: { color: `rgba(0,0,0,0.6)`, blur: 3 * n, dy: 1.5 * n },
        });
      }
    }
    clear() {
      for (let e of this.pool) e.on = !1;
      this.table.clear();
    }
    alloc() {
      let e = null,
        t = 1 / 0;
      for (let n = 0; n < V; n++) {
        let r = this.pool[n];
        if (!r.on) return r;
        r.seq < t && ((t = r.seq), (e = r));
      }
      return e;
    }
    spawn(t, n, r, i, a, o, s, c = 1) {
      let l = this.alloc();
      ((l.on = !0),
        (l.t = 0),
        (l.style = t),
        (l.life = Ae[t] || 1),
        (l.seq = ++this.seq),
        (l.dim = 1),
        (l.occ = 1),
        (l.mode = 0));
      let u = Math.max(0, Math.round(n)),
        d = 0,
        f = l.codes;
      do ((f[d++] = 48 + (u % 10)), (u = (u / 10) | 0));
      while (u > 0 && d < 9);
      for (let e = 0, t = d - 1; e < t; e++, t--) {
        let n = f[e];
        ((f[e] = f[t]), (f[t] = n));
      }
      if (s) {
        for (let e = d; e > 0; e--) f[e] = f[e - 1];
        ((f[0] = s), d++);
      }
      ((l.n = d), (l.scale = c), (l.tgt = r ? r.id : -1));
      let p = this.atlas[t];
      if (
        ((l.w = p ? p.measure(l.codes, d) : 0),
        (l.cx = i),
        (l.cy = a),
        (l.cz = o),
        (l.alt = !1),
        r && this.anchors)
      ) {
        let e = this.anchors.get(r, 1, `chest`, this._a);
        ((l.cx = e.x),
          (l.cy = e.y),
          (l.cz = e.z),
          (l.alt = !0),
          this.anchors.get(r, 1, `overhead`, this._a),
          (i = this._a.x),
          (a = this._a.y),
          (o = this._a.z));
      } else
        r &&
          ((l.cx = i),
          (l.cy = y(i, o) + (r.height || 2) * 0.6),
          (l.cz = o),
          (l.alt = !0));
      ((l.wx = i), (l.wy = a), (l.wz = o));
      let m = this.s,
        h = t === `crit`;
      l.clear =
        (r
          ? r.kind === e.CHAMPION
            ? Ne.champion
            : Pe(r)
              ? Ne.structure
              : Ne.small
          : 0) * m;
      let g =
          1048576 | ((((i * 0.4) | 0) & 1023) << 10) | (((o * 0.4) | 0) & 1023),
        _ = ((t === `taken`) << 21) | (r ? r.id & 1048575 : g),
        v = this.table,
        b = this.time,
        x = v.find(_, b),
        S = v.keys[x] === _ && b - v.t[x] < 0.5 ? (v.slot[x] + 1) % 5 : 0;
      ((v.keys[x] = _),
        (v.t[x] = b),
        (v.slot[x] = S),
        (l.key = _),
        (l.lift = 0),
        (l.liftTo = 0));
      let C =
        t === `taken`
          ? 19 * m * c
          : Math.max(
              16 * m * c,
              (p ? p.extUp + p.extDown : 30 * m) * c * 1.06 + 3 * m,
            );
      for (let e = 0; e < V; e++) {
        let t = this.pool[e];
        t !== l &&
          t.on &&
          t.key === _ &&
          t.t < t.life * 0.75 &&
          (t.liftTo += C);
      }
      let w = Me[S];
      return (
        (l.ox = w * (h ? 0.16 : 0.34)),
        (l.dx = w * (h ? 10 : 22) * m),
        (l.peak = h ? 1.8 : t === `gold` ? 1.25 : t === `taken` ? 1.2 : 1.35),
        (l.rise = (h ? 24 : t === `gold` ? 40 : 34) * m),
        t === `taken`
          ? ((l.ox = 0), (l.dx = 9 * m), (l.rise = 13 * m))
          : t === `heal`
            ? ((l.ox = 0.5), (l.dx = 18 * m), (l.rise = 34 * m))
            : t === `gold` && ((l.ox = 0.42), (l.dx = 12 * m)),
        l
      );
    }
    onEvents(t, r) {
      let i = r.world,
        a = r.playerId,
        o = r.viewerTeam;
      for (let r = 0; r < t.length; r++) {
        let s = t[r];
        if (globalThis.__mtOwnNumbers && (s.type === n.HIT || s.type === n.GOLD || s.type === n.HEAL)) continue; // [MT-HOOK] mtOwnNumbers (mt/render/fx-numbers.js draws all combat text; no gold in this game)
        if (s.type === n.HIT) {
          if (!(s.amount >= 1)) continue;
          let t = i.units.get(s.tgt);
          if (t && t.visible && t.visible[o] === !1) continue;
          let n = t ? t.x : s.x,
            r = t ? t.y : s.y,
            c = y(n, r) + (t ? t.height || 2 : 1.6);
          if (s.src === a) {
            let i = s.crit
                ? `crit`
                : s.dmgType === `magic`
                  ? `magic`
                  : s.dmgType === `true`
                    ? `true`
                    : `physical`,
              a =
                s.source === `dot`
                  ? 0.78
                  : t && t.kind === e.CHAMPION
                    ? 1.08
                    : 1;
            this.spawn(i, s.amount, t, n, c, r, 0, a);
          } else if (s.tgt === a)
            this.spawn(
              `taken`,
              s.amount,
              t,
              n,
              c,
              r,
              45,
              s.source === `dot` ? 0.8 : 0.95,
            );
          else if (t && t.kind === e.CHAMPION && t.team !== o) {
            let a = i.units.get(s.src);
            if (a && a.kind === e.CHAMPION && a.team === o) {
              let e = s.crit
                ? `crit`
                : s.dmgType === `magic`
                  ? `magic`
                  : s.dmgType === `true`
                    ? `true`
                    : `physical`;
              this.spawn(e, s.amount, t, n, c, r, 0, s.crit ? 0.62 : 0.74).dim =
                0.82;
            }
          }
        } else if (s.type === n.HEAL) {
          if (!(s.amount >= 5)) continue;
          let t = i.units.get(s.tgt);
          if (!t || t.team !== o || t.kind !== e.CHAMPION) continue;
          this.spawn(
            `heal`,
            s.amount,
            t,
            t.x,
            y(t.x, t.y) + (t.height || 2),
            t.y,
            43,
            t.id === a ? 1 : 0.8,
          );
        } else if (s.type === n.GOLD) {
          if (
            s.id !== a ||
            !(s.amount >= 1) ||
            !(
              je[s.reason] === !0 ||
              (s.reason === `assist` && s.amount >= 50) ||
              (s.reason == null && s.amount >= 10)
            )
          )
            continue;
          let e = s.x ?? 0,
            t = s.y ?? 0;
          this.spawn(
            `gold`,
            s.amount,
            null,
            e,
            y(e, t) + 1.25,
            t,
            43,
            s.reason === `kill` ? 1.2 : 1,
          );
        }
      }
    }
    draw(t, n, r, i, a, o) {
      this.time = i;
      let s = this.D,
        c = this.s,
        l = this.bars,
        u = l ? l.stamp : -1,
        d = this.safe;
      this.nPlaced = 0;
      let f = n.e,
        p = n.l,
        m = n.t,
        h = n.w,
        g = n.h;
      for (let n = 0; n < V; n++) {
        let i = this.pool[n];
        if (!i.on) continue;
        if (((i.t += r), i.t >= i.life)) {
          i.on = !1;
          continue;
        }
        let _ = this.atlas[i.style];
        if (!_) continue;
        let v = i.t,
          y = v / i.life,
          b = 1 - Math.min(1, v / (i.life * 0.8)),
          x = 1 - b * b * b;
        i.lift += (i.liftTo - i.lift) * Math.min(1, r * 16);
        let S,
          C = 0.075,
          w = 0.2;
        if (v < C) S = 0.45 + (i.peak - 0.45) * (v / C);
        else if (v < w) {
          let e = (v - C) / 0.125;
          S = i.peak + (1 - i.peak) * (1 - (1 - e) * (1 - e));
        } else
          S = 1 + 0.08 * Math.min(1, (v - w) / Math.max(0.1, i.life * 0.8 - w));
        let T = S * i.scale,
          E = i.tgt >= 0 && l ? l.state.get(i.tgt) : null,
          D = !!E && E.drawn === u,
          O = i.w * T * 0.5 + _.strokeW * T,
          k,
          A;
        if (i.style === `taken` && D && E.rel === 0) {
          ((k = E.lx - 5 * c - O - i.dx * x),
            (A = E.my + i.rise * x + (i.lift < 24 * c ? i.lift : 24 * c)),
            (i.mode = 1));
          let e = E.vy1 + 40 * c - _.extDown * T;
          A > e && (A = e);
        } else {
          let t = 0,
            n = 0,
            r = 50 * c,
            a = !1,
            o = !1;
          if (
            (D && ((t = E.tcx), (r = E.thw), (n = E.ttop), (a = !0), (o = !0)),
            !a)
          ) {
            let e = f[3] * i.wx + f[7] * i.wy + f[11] * i.wz + f[15];
            if (e > 1e-4) {
              let r = (f[0] * i.wx + f[4] * i.wy + f[8] * i.wz + f[12]) / e,
                o = (f[1] * i.wx + f[5] * i.wy + f[9] * i.wz + f[13]) / e;
              if (r > -1.25 && r < 1.25 && o > -1.3 && o < 1.3) {
                let e = (p + (r * 0.5 + 0.5) * h) * s,
                  c = (m + (0.5 - o * 0.5) * g) * s - i.clear;
                (!d || c >= d.at(e)) && ((t = e), (n = c), (a = !0));
              }
            }
          }
          if (!a && i.alt) {
            let e = f[3] * i.cx + f[7] * i.cy + f[11] * i.cz + f[15];
            if (e > 1e-4) {
              let r = (f[0] * i.cx + f[4] * i.cy + f[8] * i.cz + f[12]) / e,
                o =
                  m +
                  (0.5 -
                    ((f[1] * i.cx + f[5] * i.cy + f[9] * i.cz + f[13]) / e) *
                      0.5) *
                    g;
              if (r > -1.25 && r < 1.25 && o > m - 8 && o < m + g + 8) {
                t = (p + (r * 0.5 + 0.5) * h) * s;
                let e =
                    (_.extUp + _.extDown) * i.peak * i.scale + i.rise + 6 * c,
                  l = (d ? d.span(t - O, t + O) : 0) + e;
                ((n = o * s > l ? o * s : l), (a = !0), (i.mode = 2));
              }
            }
          }
          if (!a) continue;
          if (
            ((k = t + i.ox * r + i.dx * x),
            (A = n - _.extDown * T - 3 * c - i.rise * x - i.lift),
            (i.barTop = n),
            d)
          ) {
            let e = d.span(k - O, k + O) + _.extUp * T;
            A < e &&
              (A = o
                ? E.vy1 + 4 * c + _.extUp * T + i.rise * x * 0.5 + i.lift
                : e);
          }
          {
            let t = l ? l.drawnR : null,
              n = l ? l.nDrawn : 0,
              r = this.placed,
              i = this.nPlaced,
              a = E ? E.vx0 : 1e9,
              o = E ? E.vy0 : 1e9,
              u = O,
              f = _.extUp * T,
              v = _.extDown * T,
              y = p * s,
              b = (p + h) * s,
              x = this._cand,
              S = D && E && E.unit.kind === e.CHAMPION,
              C = u * 2 * (f + v) > 1 ? u * 2 * (f + v) : 1;
            for (let e = 0; e < 4; e++) {
              let e = 0,
                s = 0,
                l = 1e9,
                p = -1e9,
                m = 1e9,
                h = -1e9;
              for (let d = 0; d < n + i && e < 4; d++) {
                let i = d < n ? t : r,
                  g = (d < n ? d : d - n) * 4;
                (d < n && i[g] === a && i[g + 1] === o) ||
                  (k + u < i[g + 2] ? k + u : i[g + 2]) -
                    (k - u > i[g] ? k - u : i[g]) <=
                    0 ||
                  (A + v < i[g + 3] ? A + v : i[g + 3]) -
                    (A - f > i[g + 1] ? A - f : i[g + 1]) <=
                    0 ||
                  (e++,
                  (x[s++] = k),
                  (x[s++] = i[g + 1] - 3 * c - v),
                  (x[s++] = k),
                  (x[s++] = i[g + 3] + 3 * c + f),
                  (x[s++] = i[g + 2] + 4 * c + u),
                  (x[s++] = A),
                  (x[s++] = i[g] - 4 * c - u),
                  (x[s++] = A),
                  i[g + 1] < l && (l = i[g + 1]),
                  i[g + 3] > p && (p = i[g + 3]),
                  i[g] < m && (m = i[g]),
                  i[g + 2] > h && (h = i[g + 2]));
              }
              if (e === 0) break;
              (e > 1 &&
                ((x[s++] = k),
                (x[s++] = p + 3 * c + f),
                (x[s++] = h + 4 * c + u),
                (x[s++] = A),
                (x[s++] = m - 4 * c - u),
                (x[s++] = A),
                (x[s++] = k),
                (x[s++] = l - 3 * c - v)),
                S &&
                  ((x[s++] = E.vx1 + 4 * c + u),
                  (x[s++] = E.my),
                  (x[s++] = E.vx0 - 4 * c - u),
                  (x[s++] = E.my)));
              for (let e = 1; e <= 4; e++)
                ((x[s++] = k), (x[s++] = A + e * (f + v) * 1.15));
              E && ((x[s++] = E.sx), (x[s++] = E.sy + 12 * c + f));
              let g = k,
                _ = A,
                w = 1 / 0;
              for (let e = 0; e <= s; e += 2) {
                let a = e < s,
                  o = a ? x[e] : k,
                  l = a ? x[e + 1] : A;
                if (
                  a &&
                  (o - u < y + 2 * c ||
                    o + u > b - 2 * c ||
                    (d && l - f < d.span(o - u, o + u)) ||
                    (E &&
                      D &&
                      o + u > E.vx0 &&
                      o - u < E.vx1 &&
                      l + v > E.vy0 &&
                      l - f < E.vy1))
                )
                  continue;
                let p = a ? (Math.abs(o - k) + Math.abs(l - A)) * u * 0.02 : 0,
                  m = 0;
                for (let e = 0; e < n + i; e++) {
                  let i = e < n ? t : r,
                    a = (e < n ? e : e - n) * 4,
                    s =
                      (o + u < i[a + 2] ? o + u : i[a + 2]) -
                      (o - u > i[a] ? o - u : i[a]);
                  if (s <= 0) continue;
                  let c =
                    (l + v < i[a + 3] ? l + v : i[a + 3]) -
                    (l - f > i[a + 1] ? l - f : i[a + 1]);
                  if (c <= 0) continue;
                  let d = s * c;
                  p += e < n ? d : d * 3;
                  let h =
                      e < n || C < (r[a + 2] - r[a]) * (r[a + 3] - r[a + 1])
                        ? C
                        : (r[a + 2] - r[a]) * (r[a + 3] - r[a + 1]),
                    g = d / (h > 1 ? h : 1);
                  g > m && (m = g);
                }
                ((p += m * m * C * 6), p < w && ((w = p), (g = o), (_ = l)));
              }
              if (((k = g), (A = _), w < 1)) break;
            }
            {
              let e = (f + v) * 1.1,
                a = (m + g) * s,
                o = A,
                l = 0;
              for (let s = 0; s <= 10; s++) {
                let d = 0;
                for (let e = 0; e < n + i; e++) {
                  let i = e < n ? t : r,
                    a = (e < n ? e : e - n) * 4,
                    s =
                      (k + u < i[a + 2] ? k + u : i[a + 2]) -
                      (k - u > i[a] ? k - u : i[a]);
                  if (s <= 0) continue;
                  let c =
                    (o + v < i[a + 3] ? o + v : i[a + 3]) -
                    (o - f > i[a + 1] ? o - f : i[a + 1]);
                  if (c <= 0) continue;
                  let l =
                      e < n || C < (r[a + 2] - r[a]) * (r[a + 3] - r[a + 1])
                        ? C
                        : (r[a + 2] - r[a]) * (r[a + 3] - r[a + 1]),
                    p = (s * c) / (l > 1 ? l : 1);
                  p > d && (d = p);
                }
                if (s === 0) {
                  if (((l = d), l <= 0.12)) break;
                } else if (d <= 0.02) {
                  A = o;
                  break;
                }
                if (((o += e), o + v > a - 2 * c)) break;
              }
            }
          }
        }
        ((i.sx = k),
          (i.sy = A),
          (i.x0 = k - O),
          (i.x1 = k + O),
          (i.y0 = A - _.extUp * T),
          (i.y1 = A + _.extDown * T));
        let j = y > 0.8 ? 1 - (y - 0.8) / 0.2 : 1;
        v < 0.03 && (j *= v / 0.03);
        let M = o && o.n > 0 && o.contains(k, A, 18 * c) ? 0.2 : 1;
        if (
          ((i.occ += (M - i.occ) * Math.min(1, r * 12)),
          Math.abs(M - i.occ) < 0.01 && (i.occ = M),
          (j *= a * i.dim * i.occ),
          !(j <= 0.01))
        ) {
          if (this.nPlaced < V) {
            let e = this.nPlaced++ * 4,
              t = this.placed;
            ((t[e] = i.x0),
              (t[e + 1] = i.y0),
              (t[e + 2] = i.x1),
              (t[e + 3] = i.y1));
          }
          if (
            ((t.globalAlpha = I[R(j)]),
            _.drawBoth(t, i.codes, i.n, k, A, T),
            this.onDraw)
          ) {
            let e = O + _.pad * T + 2,
              t = _.cellH * T * 0.5 + 2;
            this.onDraw(
              (k - e) | 0,
              (A - t) | 0,
              (k + e + 1) | 0,
              (A + t + 1) | 0,
            );
          }
        }
      }
      t.globalAlpha = 1;
    }
  },
  Le = -0.1,
  Re = 4.9;
function ze(e, t, n) {
  for (let r = 0; r < t; r++)
    for (let i = 0; i < t; i++) {
      let a = -1e9;
      for (let n = -1; n <= 1; n++) {
        let o = r + n;
        if (!(o < 0 || o >= t))
          for (let n = -1; n <= 1; n++) {
            let r = i + n;
            if (r < 0 || r >= t) continue;
            let s = e[o * t + r];
            s > a && (a = s);
          }
      }
      (a < -0.06 && (a = -0.06),
        (n[r * t + i] = Math.max(
          0,
          Math.min(255, Math.ceil(((a - Le) / Re) * 255)),
        )));
    }
  return n;
}
function Be(e, t = 512) {
  let n = new c(ze(e, t, new Uint8Array(t * t)), t, t, u, o);
  return (
    (n.magFilter = p),
    (n.minFilter = p),
    (n.wrapS = n.wrapT = i),
    (n.needsUpdate = !0),
    n
  );
}
var Ve = `
varying float vH;
void main() {
  #include <begin_vertex>
  vec4 wp = vec4(transformed, 1.0);
  #ifdef USE_INSTANCING
  wp = instanceMatrix * wp;
  #endif
  wp = modelMatrix * wp; vH = wp.y;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`,
  He = `
varying float vH;
void main() { float h = floor(clamp((vH + 4.0) / 24.0, 0.0, 1.0) * 65535.0); gl_FragColor = vec4(floor(h / 256.0) / 255.0, mod(h, 256.0) / 255.0, 0.0, 1.0); }`,
  H = `
uniform sampler2D uHeight; uniform vec2 uCenter; uniform float uHalf; uniform float uLift; uniform float uBias;
varying vec2 vLocal; varying vec2 vWorld;
void main() {
  vec2 local = position.xz * uHalf; vec2 wxz = uCenter + local; vWorld = wxz;
  float h = texture2D(uHeight, wxz / ${(120).toFixed(1)}).r * ${Re.toFixed(3)} + (${Le.toFixed(3)});
  vec4 view = viewMatrix * vec4(wxz.x, h + uLift, wxz.y, 1.0);
  view.xyz += normalize(-view.xyz) * uBias;
  vLocal = local;
  gl_Position = projectionMatrix * view;
}`,
  U = `
varying vec2 vLocal; varying vec2 vWorld;
vec3 E; float U;
float px(float d) { return max(fwidth(d), 1e-4); }
float fillAA(float d) { float w = px(d); return 1.0 - smoothstep(-w, w, d); }
float lineAA(float d, float halfPx) { float w = px(d); return 1.0 - smoothstep((halfPx - 0.7) * w, (halfPx + 0.7) * w, abs(d)); }
float glowPx(float d, float pxs) { return exp(-abs(d) / (pxs * px(d))); }
float haloOut(float d, float pxs) { float w = px(d); return smoothstep(-2.0 * w, 0.0, d) * exp(-max(d, 0.0) / (pxs * w)); }
float glowOut(float d, float pxs) { float w = px(d); return smoothstep(-w, w, d) * exp(-max(d, 0.0) / (pxs * w)); }
float bandIn(float d, float width) { return fillAA(d) * exp(min(d, 0.0) / width); }
void dark(float a) { a = clamp(a, 0.0, 1.0); U = U + a * (1.0 - U); }
void over(vec3 c, float a) { a = clamp(a, 0.0, 1.0); E = E * (1.0 - a) + c * a; dark(a); } // opaque paint (rings)
const vec3 INK = vec3(0.0, 0.018, 0.035);
float sdBox(vec2 p, vec2 b) { vec2 d = abs(p) - b; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0); }
float sdTri(vec2 p, vec2 q) { // isosceles triangle, apex at origin, base at y = q.y (iq)
  p.x = abs(p.x);
  vec2 a = p - q * clamp(dot(p, q) / dot(q, q), 0.0, 1.0);
  vec2 b = p - q * vec2(clamp(p.x / q.x, 0.0, 1.0), 1.0);
  float s = -sign(q.y);
  vec2 d = min(vec2(dot(a, a), s * (p.x * q.y - p.y * q.x)), vec2(dot(b, b), s * (p.y - q.y)));
  return -sqrt(d.x) * sign(d.y);
}
float sdPie(vec2 p, vec2 c, float r) { p.x = abs(p.x); float l = length(p) - r; float m = length(p - c * clamp(dot(p, c), 0.0, r)); return max(l, m * sign(c.y * p.x - c.x * p.y)); }
float sdUnevenCapsule(vec2 p, float r1, float r2, float h) { // axis from (0,0) radius r1 to (0,h) radius r2 (iq)
  p.x = abs(p.x); float b = (r1 - r2) / h; float a = sqrt(max(1.0 - b * b, 0.0)); float k = dot(p, vec2(-b, a));
  if (k < 0.0) return length(p) - r1;
  if (k > a * h) return length(p - vec2(0.0, h)) - r2;
  return dot(p, vec2(a, b)) - r1;
}
`,
  Ue = `
uniform float uTime, uRange, uLen, uWidth, uRadius, uHalfAng, uValid, uAlpha, uTargetOn, uTargetR, uGain, uGhost, uShowRange, uCancel;
uniform int uShape; uniform vec2 uDir, uTarget, uCursor;
uniform vec3 uCore, uRim;
${U}
vec3 CORE, RIM; float INV, CAN;
// Unusable (cooldown / mana / silence) = the SAME self hue family, 70 % toward a cool grey, rim gain ≈ 1.4 instead of 3.6,
// a soft darkening inside the shape and a slow opacity breathe (no stripes). Never red: red is reserved for enemy telegraphs
// (DESIGN.md §4). Touch aim over the cancel zone (uCancel): the whole indicator drains to a dim ash grey with a faint
// ember rim and its chevrons stop, so letting go visibly means "nothing happens".
vec3 coolGrey(vec3 c, float k) { float l = dot(c, vec3(0.2126, 0.7152, 0.0722)); return vec3(l * k) * vec3(0.84, 0.92, 1.0); }
// Wild Rift style edge-lit filled shape: dark underlay + outer ink halo, soft emissive interior, bright band hugging the
// edge that fades inward over bandW world units, crisp HDR rim line with a small outer glow.
void litShape(float d, float grad, float interior, float bandW) {
  float inside = fillAA(d); float soft = max(INV, CAN);
  dark(inside * (0.4 - 0.1 * grad + 0.14 * soft) + bandIn(d, bandW * 2.2) * 0.12 * INV); dark(haloOut(d, 3.0) * 0.6);
  E += CORE * (inside * (interior + 0.14 * grad) * (1.0 - 0.45 * soft) + bandIn(d, bandW) * (1.25 - 0.55 * soft));
  E += RIM * (lineAA(d, 1.45) * 3.6 + glowOut(d, 6.0) * 0.55 + bandIn(d, 0.045) * 0.9);
}
// flowing chevrons (apex forward): x = body, y = bright leading edge
vec2 chevrons(float along, float across, float period, float speed, float slope) {
  float v = (along + abs(across) * slope - uTime * speed) / period;
  float g = fract(v); float w = max(fwidth(v), 1e-4);
  float cut = 1.0 - smoothstep(0.95 - w, 0.95 + w, g);
  return vec2(smoothstep(0.62, 0.93, g) * cut, smoothstep(0.84, 0.93, g) * cut);
}
void main() {
  E = vec3(0.0); U = 0.0;
  vec2 p = vLocal; float r = length(p);
  INV = clamp(1.0 - uValid, 0.0, 1.0); CAN = clamp(uCancel, 0.0, 1.0);
  CORE = mix(uCore, coolGrey(uCore, 1.3), 0.7 * INV);
  RIM = mix(uRim, coolGrey(uRim, 0.95), 0.7 * INV) * mix(1.0, 0.39, INV); // 3.6 rim gain -> 1.4
  CORE = mix(CORE, vec3(0.05, 0.045, 0.045), CAN); RIM = mix(RIM, vec3(0.62, 0.2, 0.16), CAN);
  // ---- range circle: 2.5 px rim, inner falloff band ~0.6 u, faint interior, dark ink halo outside
  if (uRange > 0.05 && uShowRange > 0.5) {
    float dR = r - uRange;
    dark(haloOut(dR, 2.6) * 0.55); dark(fillAA(dR) * 0.06 + bandIn(dR, 0.6) * 0.14);
    E += CORE * (bandIn(dR, 0.6) * 0.5 + fillAA(dR) * 0.02);
    E += RIM * (lineAA(dR, 1.25) * 2.6 + glowOut(dR, 4.5) * 0.3);
  }
  vec2 dir = uDir; vec2 perp = vec2(-dir.y, dir.x);
  float along = dot(p, dir), across = dot(p, perp);
  if (uShape == 1 || uShape == 2 || uShape == 5) { // skillshot arrow / line / dash arrow
    float L = max(uLen, 0.8); float hw = uShape == 5 ? 0.3 : max(uWidth * 0.5, 0.2);
    float ringR = uShape == 5 ? max(uRadius, 0.62) : 0.0; float Lb = L - ringR; // dash arrow stops at its landing ring
    float start = 0.28;
    float tipH = uShape == 2 ? 0.0 : min(max(hw * 2.2, 0.85), (Lb - start) * 0.34); float headW = hw * 1.6 + 0.2;
    float bodyEnd = Lb - tipH;
    float taper = clamp(max(bodyEnd - start, 0.1) * 0.35, hw * 0.75, max(1.3, hw * 0.75));
    float dCap = sdUnevenCapsule(vec2(across, along - start), hw * 0.5, hw, taper);
    float boxLen = max(bodyEnd - start - taper, 0.02);
    float dBox = sdBox(vec2(across, along - (start + taper + boxLen * 0.5)), vec2(hw, boxLen * 0.5 + 0.01));
    float d = min(dCap, dBox);
    float dTip = 1e3; if (tipH > 0.0) { dTip = sdTri(vec2(across, Lb - along), vec2(headW, tipH)); d = min(d, dTip); }
    float grad = clamp((along - start) / max(Lb - start, 0.1), 0.0, 1.0);
    litShape(d, grad * grad, 0.08, uShape == 2 ? 0.34 : 0.28);
    if (uShape == 2) E += CORE * fillAA(d) * exp(-abs(across) / max(hw * 0.35, 0.05)) * 0.22; // beam spine
    if (tipH > 0.0) E += CORE * fillAA(dTip) * 0.3;
    // chevrons stay off the rim (fade out over the outer ~40% of the half-width) so they read as arrows, not bands
    float mask = fillAA(d + 0.1) * smoothstep(start + 0.45, start + 1.1, along) * (1.0 - smoothstep(bodyEnd - 0.5, bodyEnd + 0.1, along))
      * (1.0 - smoothstep(hw * 0.5, hw * 0.92, abs(across)));
    float per = uShape == 5 ? 0.62 : uShape == 2 ? 1.25 : 0.95;
    vec2 ch = chevrons(along, across, per, uShape == 5 ? 2.4 : 1.6, uShape == 5 ? 0.9 : uShape == 2 ? 0.5 : 0.75);
    float chk = uShape == 2 ? 0.75 : 1.0;
    E += (CORE * ch.x * 0.9 + RIM * ch.y * 2.2) * mask * chk * (1.0 - 0.65 * INV) * (1.0 - CAN); // chevrons calm down while unusable, stop over cancel
    if (uShape == 5) { // dash landing ring
      vec2 e = p - dir * L; float dl = length(e) - ringR;
      dark(haloOut(dl, 2.4) * 0.5); dark(fillAA(dl) * 0.18);
      E += CORE * (bandIn(dl, 0.3) * 0.9 + fillAA(dl) * 0.12) + RIM * (lineAA(dl, 1.35) * 2.6 + glowOut(dl, 5.0) * 0.3);
    }
  } else if (uShape == 6) { // blink: tapered dashed chevron path + landing ring with footprint + ghost ring past range
    float L = max(uLen, 0.6); float R = 0.62; float endP = L - R - 0.08;
    float t = clamp((along - 0.35) / max(endP - 0.35, 0.1), 0.0, 1.0);
    float hwP = mix(0.07, 0.2, t);
    float inPath = step(0.35, along) * (1.0 - smoothstep(endP - 0.06, endP, along));
    float v = (along + abs(across) * 1.1 - uTime * 2.2) / 0.5; float g = fract(v); float wv = max(fwidth(v), 1e-4);
    float dashM = smoothstep(0.0, 2.0 * wv, g) * (1.0 - smoothstep(0.55 - wv, 0.55 + wv, g));
    float dp = abs(across) - hwP;
    float m = inPath * dashM;
    dark((haloOut(dp, 2.2) * 0.45 + fillAA(dp) * 0.25) * m);
    E += (CORE * fillAA(dp) * (0.55 + 0.9 * t) + RIM * (lineAA(dp, 1.0) * 1.6 + fillAA(dp) * smoothstep(0.3, 0.55, g) * 1.2)) * m;
    vec2 e = p - dir * L; float re = length(e); float dl = re - R;
    dark(haloOut(dl, 2.6) * 0.55); dark(fillAA(dl) * 0.2);
    E += CORE * (bandIn(dl, 0.28) * 1.1 + fillAA(dl) * 0.1) + RIM * (lineAA(dl, 1.5) * 3.0 + glowOut(dl, 6.0) * 0.45);
    // footprint silhouette: soft disc with a forward notch (where the champion will stand, facing the blink direction)
    vec2 fl = vec2(dot(e, perp), dot(e, dir));
    float dFoot = min(length(fl) - 0.3, sdTri(vec2(fl.x, 0.52 - fl.y), vec2(0.17, 0.2)));
    dark(fillAA(dFoot) * 0.22); E += CORE * fillAA(dFoot) * 0.55 + RIM * lineAA(dFoot, 1.1) * 1.6;
    float pulse = fract(uTime * 1.3); E += RIM * lineAA(re - R * (0.45 + 0.75 * pulse), 1.1) * (1.0 - pulse) * 0.9 * fillAA(dl - 0.4);
    if (uGhost > 0.001) { // cursor beyond range: faint dashed ghost ring where the cursor is
      vec2 gq = p - uCursor; float gr = length(gq) - 0.58; float ga = atan(gq.y, gq.x);
      float gd = smoothstep(0.4, 0.5, fract(ga / 6.2831853 * 12.0 - uTime * 0.4));
      dark((haloOut(gr, 2.2) * 0.45 + fillAA(gr) * 0.12) * uGhost);
      E += (RIM * lineAA(gr, 1.2) * (0.5 + 1.4 * gd) + CORE * bandIn(gr, 0.2) * 0.35) * uGhost;
    }
  } else if (uShape == 3 || uShape == 8) { // aoe at target / self-centred aoe
    vec2 c = uShape == 8 ? vec2(0.0) : uTarget; vec2 q = p - c; float rq = length(q); float R = max(uRadius, 0.2); float d = rq - R;
    litShape(d, pow(clamp(rq / R, 0.0, 1.0), 3.0), 0.08, max(0.3, R * 0.18));
    float inside = fillAA(d);
    float pulse = fract(uTime * 0.85); E += RIM * lineAA(rq - R * pulse, 1.15) * (1.0 - pulse) * pulse * 3.2 * inside;
    // centre reticle
    float dc = rq - 0.2; dark(haloOut(dc, 1.8) * 0.4 * inside); E += RIM * lineAA(dc, 1.1) * 1.6 + CORE * fillAA(rq - 0.07) * 1.8;
  } else if (uShape == 4) { // cone
    vec2 q = vec2(across, along); float d = sdPie(q, vec2(sin(uHalfAng), cos(uHalfAng)), uRange);
    float g = clamp(r / max(uRange, 0.1), 0.0, 1.0);
    litShape(d, g * g, 0.07, 0.34);
    float rip = fract(r * 0.75 - uTime * 1.25); float wr = max(fwidth(r * 0.75), 1e-4);
    float wave = smoothstep(0.72, 0.95, rip) * (1.0 - smoothstep(0.97 - wr, 0.97 + wr, rip));
    float inside = fillAA(d + 0.08) * smoothstep(0.5, 1.2, r);
    E += (CORE * wave * 0.7 + RIM * wave * smoothstep(0.88, 0.95, rip) * 1.6) * inside * (0.5 + 0.5 * g);
  } else if (uShape == 7 && uTargetOn > 0.5) { // unit-target: glowing tether with flowing chevrons + arrowhead at the target
    vec2 t = uTarget; float tl = length(t); vec2 td = t / max(tl, 1e-3); vec2 tp = vec2(-td.y, td.x);
    float ta = dot(p, td), tc = dot(p, tp);
    float endT = max(tl - uTargetR - 0.18, 0.9); float headL = 0.55;
    float seg = smoothstep(0.45, 0.75, ta) * (1.0 - smoothstep(endT - headL - 0.02, endT - headL + 0.04, ta));
    dark(haloOut(abs(tc) - 0.05, 3.0) * seg * 0.5);
    E += (RIM * lineAA(tc, 2.8) * 2.2 + CORE * glowPx(tc, 7.0) * 0.8) * seg;
    vec2 ch = chevrons(ta, tc, 0.8, 2.6, 1.25);
    float cm = seg * (1.0 - smoothstep(0.24, 0.3, abs(tc))) * smoothstep(0.9, 1.4, ta);
    dark(ch.x * cm * 0.25); E += (CORE * ch.x * 0.9 + RIM * ch.y * 2.0) * cm;
    float dh = sdTri(vec2(tc, endT - ta), vec2(0.32, headL));
    dark(haloOut(dh, 2.4) * 0.55 + fillAA(dh) * 0.2); E += CORE * fillAA(dh) * 1.2 + RIM * (lineAA(dh, 1.3) * 2.6 + bandIn(dh, 0.1) * 1.2);
  }
  float a = uAlpha * (1.0 - INV * (0.16 + 0.16 * sin(uTime * 2.4))); // unusable: slow opacity breathe
  E *= uGain * a; U *= a;
  if (U < 0.002 && max(E.r, max(E.g, E.b)) < 0.002) discard;
  gl_FragColor = vec4(E, U);
}`,
  We = `
uniform float uRadius, uTime, uAlpha, uGain, uPxs; uniform int uStyle; uniform vec3 uColor, uColor2; uniform vec2 uFacing;
${U}
void main() {
  E = vec3(0.0); U = 0.0;
  vec2 p = vLocal; float r = length(p); float d = r - uRadius;
  float ang = atan(p.y, p.x);
  if (uStyle == 0) { // self: a DIM, THIN ground decal — a shadow ring with a fine green line in it, a faint facing arc
    // It was a crisp mint core at 2.05 x (plus a 1.6 x facing arc and a 2.1 x chevron) inside a 3 px ink band: measured with
    // dev/overlaycheck.mjs --only ring, the ring owned 60 % of the brightest 5 % of pixels around the player on the river
    // (champion-models measured ~96 % in an isolated frame) — it out-valued the champion's own face. Wild Rift's local-player
    // ring is a dim thin decal that reads as a shadow, and the champion is what the eye lands on. What keeps it findable in
    // a crowd is contrast, not light: a soft dark band on both sides of a ~1.5 px line of the team green.
    // Widths are in DEVICE pixels (fwidth) scaled by the pixel ratio, so the line keeps its weight at dpr 2.
    float k = uPxs;
    dark(haloOut(d, 1.8 * k) * 0.24);
    over(uColor, fillAA(d) * smoothstep(uRadius * 0.55, uRadius, r) * 0.035);
    float ink = lineAA(d, 2.2 * k);
    dark(ink * 0.4);
    E += uColor * (lineAA(d, 0.85 * k) * 0.6 + glowPx(d, 3.0 * k) * 0.05);
    vec2 f = uFacing; float fa = dot(p / max(r, 1e-4), f);
    float arc = smoothstep(0.78, 0.96, fa);
    E += uColor2 * lineAA(d, 1.2 * k) * arc * 0.34;
    vec2 fp = vec2(-f.y, f.x); float na = dot(p, f), nc = dot(p, fp);
    float tri = sdTri(vec2(nc, (uRadius + 0.30) - na), vec2(0.12, 0.2));
    dark(haloOut(tri, 1.6 * k) * 0.35); E += uColor * fillAA(tri) * 0.62;
  } else if (uStyle == 1) { // attack target: bold orange ring, rotating bright arcs
    dark(haloOut(d - 0.03, 2.6) * 0.5);
    E += uColor * (lineAA(d, 1.8) * 1.5 + glowPx(d, 10.0) * 0.45);
    float seg = smoothstep(0.62, 0.9, abs(cos(2.0 * (ang + uTime * 1.3))));
    E += uColor2 * lineAA(d - 0.16, 1.3) * seg * 1.6;
    over(uColor, fillAA(d) * smoothstep(uRadius * 0.5, uRadius, r) * 0.12);
  } else if (uStyle == 2) { // hover: thin dashed red ring
    float dash = step(0.42, fract(ang / 6.2831853 * 16.0 + uTime * 0.25));
    dark(haloOut(d, 2.0) * 0.3);
    E += uColor * (lineAA(d, 1.1) * (0.45 + 0.8 * dash) + glowPx(d, 5.0) * 0.18);
  } else if (uStyle == 3) { // aim lock-on: bold solid pulsing red ring, rotating outer arcs, inner fill
    float pulse = 0.5 + 0.5 * sin(uTime * 9.0);
    float R2 = uRadius * (1.0 + 0.035 * pulse); float d2 = r - R2;
    dark(haloOut(d2 - 0.04, 3.0) * 0.6); dark(fillAA(d2) * 0.14);
    E += uColor * (lineAA(d2, 2.4) * (2.0 + 0.8 * pulse) + glowPx(d2, 9.0) * (0.5 + 0.3 * pulse) + bandIn(d2, 0.25) * 0.55);
    float dA = r - (R2 + 0.24); float arcs = smoothstep(0.55, 0.8, abs(sin(1.5 * (ang - uTime * 2.4))));
    dark(haloOut(dA, 2.0) * arcs * 0.4); E += uColor2 * lineAA(dA, 1.6) * arcs * 2.2;
    float dI = r - R2 * 0.55; float ticks = smoothstep(0.9, 0.97, abs(cos(2.0 * (ang + uTime * 0.8))));
    E += uColor2 * lineAA(dI, 1.2) * ticks * 1.4;
  } else if (uStyle == 4) { // attack-move pending: attack-range ring — a REAL dashed rim (22 dashes) inside a two-sided ink
    // edge, an inner falloff band and a brighter arc swinging toward the cursor (uFacing) so the ring reads when most of it
    // is off screen. The rim used to carry a 0.55 base term, so the "gaps" still painted at ~70 % of a dash: on screen that
    // was a continuous hairline with faint beading, and with no dark edge it vanished over bright flagstone and the river.
    float dv = ang / 6.2831853 * 22.0 - uTime * 0.25; float dw = max(fwidth(dv), 1e-4);
    float dash = smoothstep(0.0, 1.5 * dw, fract(dv)) * (1.0 - smoothstep(0.62 - dw, 0.62 + dw, fract(dv)));
    vec2 f = uFacing; float fa = dot(p / max(r, 1e-4), f); float arc = smoothstep(0.72, 0.97, fa);
    float lit = clamp(1.9 * dash + 1.6 * arc, 0.0, 1.0); // where the bright rim actually paints
    dark(haloOut(d, 3.0) * 0.55); dark(bandIn(d, 0.35) * 0.16);
    dark(lineAA(d, 3.0) * (0.3 + 0.5 * lit)); // ink edge on BOTH sides of the rim: survives white marble and teal water
    E += INK * lineAA(d, 3.0) * (0.12 + 0.2 * lit);
    E += uColor2 * bandIn(d, 0.35) * (0.3 + 0.35 * arc);
    E += uColor * (lineAA(d, 1.6) * (1.9 * dash + 1.6 * arc) + glowOut(d, 5.0) * (0.25 + 0.4 * arc) * (0.4 + 0.6 * lit));
  } else { // 5 level-up burst: uTime = age (s). Two expanding golden rings, radial rays, early flash
    float age = uTime; float t1 = clamp(age / 0.85, 0.0, 1.0), t2 = clamp((age - 0.14) / 0.85, 0.0, 1.0);
    float e1 = 1.0 - pow(1.0 - t1, 3.0), e2 = 1.0 - pow(1.0 - t2, 3.0);
    float R1 = mix(0.45, uRadius, e1), R2 = mix(0.3, uRadius * 0.78, e2);
    float f1 = (1.0 - t1) * (1.0 - t1), f2 = (1.0 - t2) * step(0.0001, t2);
    dark(haloOut(r - R1, 2.4) * 0.35 * f1);
    E += uColor * (lineAA(r - R1, 2.2) * 3.2 + glowPx(r - R1, 9.0) * 0.9) * f1;
    E += uColor2 * (lineAA(r - R2, 1.4) * 2.2 + glowPx(r - R2, 6.0) * 0.5) * f2 * f2;
    float rays = smoothstep(0.86, 0.98, abs(cos(6.0 * ang + age * 1.5))) * smoothstep(R1 * 0.4, R1 * 0.8, r) * (1.0 - smoothstep(R1 * 0.85, R1, r));
    E += uColor2 * rays * f1 * 1.2;
    E += uColor * fillAA(r - 1.1) * (1.0 - smoothstep(0.0, 0.3, age)) * (1.0 - r / 1.1) * 1.6;
  }
  E *= uGain * uAlpha; U *= uAlpha;
  if (U < 0.002 && max(E.r, max(E.g, E.b)) < 0.002) discard;
  gl_FragColor = vec4(E, U);
}`,
  Ge = `
uniform float uAge, uAlpha; uniform vec3 uColor, uColor2;
${U}
void main() {
  E = vec3(0.0); U = 0.0;
  vec2 p = vLocal; float r = length(p); float t = clamp(uAge / 0.5, 0.0, 1.0); float e = 1.0 - pow(1.0 - t, 3.0);
  float R = mix(0.72, 0.2, e); float k = 1.0 - t * 0.7;
  dark(haloOut(r - R, 2.2) * 0.4 * k);
  E += uColor * (lineAA(r - R, 1.6) * 1.6 + glowPx(r - R, 6.0) * 0.4) * k;
  // four chevrons converging on the click point
  vec2 q = abs(vec2(p.x + p.y, p.x - p.y) * 0.70710678); if (q.y > q.x) q = q.yx;
  float D = mix(0.9, 0.24, e); float v = (q.x - D) - q.y * 0.9; float dV = abs(v) - 0.045; float lim = step(q.y, 0.2) * step(D - 0.06, q.x);
  dark(haloOut(dV, 1.8) * lim * 0.4);
  E += uColor2 * (fillAA(dV) * 1.8 + glowPx(dV, 4.0) * 0.3) * lim;
  E += uColor2 * fillAA(r - 0.07 * (1.0 - t)) * (1.0 - t) * 2.0;
  float fade = 1.0 - smoothstep(0.55, 1.0, uAge / 0.62);
  float a = uAlpha * fade; E *= a; U *= a;
  if (U < 0.002 && max(E.r, max(E.g, E.b)) < 0.002) discard;
  gl_FragColor = vec4(E, U);
}`,
  W = (e) => new l(e),
  G = (e) => ({ _f: 0.5, value: e }),
  Ke = (e, t, n) => {
    let r = e && e.get ? parseFloat(e.get(t)) : NaN;
    return Number.isFinite(r) ? r : n;
  },
  qe = class {
    constructor(e, t, n) {
      ((this.scene = e),
        (this.renderer = n || null),
        (this.terrainRaw = T()),
        (this.heightTex = Be(this.terrainRaw)),
        (this.liftFrames = 0),
        (this.liftDone = !1),
        (this.liftInfo = { texels: 0, ms: 0, tries: 0 }),
        (this.grid128 = new m(2, 2, 128, 128).rotateX(-Math.PI / 2)),
        (this.grid24 = new m(2, 2, 24, 24).rotateX(-Math.PI / 2)),
        (this.grid48 = new m(2, 2, 48, 48).rotateX(-Math.PI / 2)));
      let r = Ke(t, `ov.bias`, 0.05),
        i = (e, t) => ({
          uHeight: { value: this.heightTex },
          uCenter: { value: new a() },
          uHalf: G(e),
          uLift: G(t),
          uBias: G(r),
        }),
        o = {
          transparent: !0,
          depthWrite: !1,
          depthTest: !0,
          side: 2,
          toneMapped: !1,
          fog: !1,
          blending: 5,
          blendEquation: 100,
          blendSrc: 201,
          blendDst: 205,
          blendEquationAlpha: 100,
          blendSrcAlpha: 200,
          blendDstAlpha: 201,
        };
      ((this.aimMat = new s({
        ...o,
        vertexShader: H,
        fragmentShader: Ue,
        uniforms: {
          ...i(10, 0.035),
          uTime: G(0),
          uRange: G(0),
          uLen: G(0),
          uWidth: G(1),
          uRadius: G(1),
          uHalfAng: G(0.5),
          uValid: G(1),
          uAlpha: G(0),
          uTargetOn: G(0),
          uTargetR: G(0.6),
          uGain: G(Ke(t, `ov.aimGain`, 1)),
          uGhost: G(0),
          uShowRange: G(1),
          uCancel: G(0),
          uShape: { value: 0 },
          uDir: { value: new a(1, 0) },
          uTarget: { value: new a() },
          uCursor: { value: new a() },
          uCore: { value: W(`#1a8dff`) },
          uRim: { value: W(`#a8e2ff`) },
        },
      })),
        (this.aim = this.mesh(this.grid128, this.aimMat, 12)));
      let c = Ke(t, `ov.ringGain`, 1),
        l = (e, t, n) =>
          new s({
            ...o,
            vertexShader: H,
            fragmentShader: We,
            uniforms: {
              ...i(1.5, 0.03),
              uRadius: G(1),
              uTime: G(0),
              uAlpha: G(0),
              uGain: G(c),
              uPxs: G(1),
              uStyle: { value: e },
              uColor: { value: W(t) },
              uColor2: { value: W(n) },
              uFacing: { value: new a(1, 0) },
            },
          });
      ((this.self = this.mesh(this.grid48, l(0, `#3fd26a`, `#b9ffcf`), 11)),
        (this.target = this.mesh(this.grid24, l(1, `#ff8a1f`, `#ffe0a0`), 11)),
        (this.hover = this.mesh(this.grid24, l(2, `#ff4a3d`, `#ffb0a8`), 11)),
        (this.aimTarget = this.mesh(
          this.grid24,
          l(3, `#ff3a2c`, `#ffd2c8`),
          13,
        )),
        (this.amove = this.mesh(this.grid128, l(4, `#ffb45a`, `#ff8a2e`), 11)),
        (this.levelFx = this.mesh(
          this.grid24,
          l(5, `#ffc34a`, `#fff1c4`),
          12,
        )));
      let u = () =>
        new s({
          ...o,
          vertexShader: H,
          fragmentShader: Ge,
          uniforms: {
            ...i(1.4, 0.03),
            uAge: G(9),
            uAlpha: G(1),
            uColor: { value: W(`#35e08a`) },
            uColor2: { value: W(`#c8ffe0`) },
          },
        });
      ((this.marker = this.mesh(this.grid24, u(), 12)),
        (this.pxs = n && n.getPixelRatio ? n.getPixelRatio() : 1),
        (this.pxsT = 0),
        (this.markerSeq = 0),
        (this.markerAge = 9),
        (this.aimAlpha = 0),
        (this.lastAimShape = 0),
        (this.aimTargetAlpha = 0),
        (this.amoveAlpha = 0),
        (this.levelAge = 9),
        (this.lastLevel = -1),
        (this.lastPlayer = -1),
        (this.moveCol = [W(`#35e08a`), W(`#c8ffe0`)]),
        (this.attackCol = [W(`#ff4a3d`), W(`#ffc2b8`)]),
        (this.amoveCol = [W(`#ff8a2e`), W(`#ffd8b0`)]),
        (this.all = [
          this.aim,
          this.self,
          this.target,
          this.hover,
          this.aimTarget,
          this.amove,
          this.levelFx,
          this.marker,
        ]));
    }
    bakeStructureLift() {
      let e = this.renderer,
        t = this.scene.getObjectByName(`structures`);
      if ((this.liftInfo.tries++, !e || !t || t.children.length === 0))
        return !1;
      let n = performance.now(),
        i = new d(512, 512, {
          depthBuffer: !0,
          stencilBuffer: !1,
          type: o,
          format: r,
          magFilter: _,
          minFilter: _,
        }),
        a = new f(-60, 60, 60, -60, 0.1, 80);
      (a.position.set(60, 40, 60),
        a.up.set(0, 0, -1),
        a.lookAt(60, 0, 60),
        a.updateMatrixWorld(),
        a.updateProjectionMatrix());
      let c = new s({ vertexShader: Ve, fragmentShader: He, side: 2 }),
        u = new v();
      ((u.overrideMaterial = c), (u.matrixWorldAutoUpdate = !1));
      let p = [];
      t.traverse((e) => {
        if (!e.visible) return;
        let t = e.material,
          n = Array.isArray(t) ? t[0] : t;
        ((e.isMesh && n && (n.transparent || n.depthWrite === !1)) ||
          e.isPoints ||
          e.isLine ||
          e.isSprite) &&
          ((e.visible = !1), p.push(e));
      });
      let m = e.getRenderTarget(),
        h = e.autoClear,
        g = e.getClearAlpha(),
        y = e.getClearColor(new l()),
        b = e.shadowMap.autoUpdate,
        x = new Uint8Array(1048576);
      try {
        (u.children.push(t),
          (e.shadowMap.autoUpdate = !1),
          (e.autoClear = !1),
          e.setRenderTarget(i),
          e.setClearColor(0, 0),
          e.clear(!0, !0, !1),
          e.render(u, a),
          e.readRenderTargetPixels(i, 0, 0, 512, 512, x));
      } finally {
        u.children.length = 0;
        for (let e of p) e.visible = !0;
        (e.setRenderTarget(m),
          e.setClearColor(y, g),
          (e.autoClear = h),
          (e.shadowMap.autoUpdate = b),
          i.dispose(),
          c.dispose());
      }
      let S = this.terrainRaw,
        C = new Float32Array(S),
        w = 0;
      for (let e = 0; e < 512; e++) {
        let t = 511 - e;
        for (let n = 0; n < 512; n++) {
          let r = (e * 512 + n) * 4;
          if (x[r + 3] < 128) continue;
          let i = ((x[r] * 256 + x[r + 1]) / 65535) * 24 - 4,
            a = i - Math.max(-0.06, S[t * 512 + n]);
          a > 0.015 && a <= 0.75 && ((C[t * 512 + n] = i), w++);
        }
      }
      return (
        ze(C, 512, this.heightTex.image.data),
        (this.heightTex.needsUpdate = !0),
        (this.liftInfo.texels = w),
        (this.liftInfo.ms = +(performance.now() - n).toFixed(1)),
        !0
      );
    }
    mesh(e, t, n) {
      let r = new h(e, t);
      return (
        (r.frustumCulled = !1),
        (r.renderOrder = n),
        (r.visible = !1),
        (r.matrixAutoUpdate = !1),
        this.scene.add(r),
        r
      );
    }
    place(e, t, n, r) {
      let i = e.material.uniforms,
        a = i.uCenter.value;
      ((a.x = t), (a.y = n), (i.uHalf.value = r));
    }
    update(e) {
      let t = e.world,
        n = t.units.get(e.playerId),
        r = e.time,
        i = e.show,
        a = e.alpha;
      if (
        !this.liftDone &&
        i &&
        ++this.liftFrames % 20 == 10 &&
        this.liftInfo.tries < 20
      )
        try {
          this.liftDone = this.bakeStructureLift();
        } catch (e) {
          ((this.liftDone = !0),
            (this.liftInfo.error = String(e).slice(0, 200)));
        }
      if (++this.pxsT % 60 == 0 && this.renderer) {
        let e = this.renderer.getPixelRatio();
        e !== this.pxs && (this.pxs = e);
      }
      let o = n ? n.prevX + (n.x - n.prevX) * a : 0,
        s = n ? n.prevY + (n.y - n.prevY) * a : 0;
      if (i && n && n.alive) {
        let e = (n.radius || 0.6) + 0.42,
          t = this.self.material.uniforms;
        {
          let n = t.uCenter.value;
          ((n.x = o), (n.y = s), (t.uHalf.value = e + 0.9));
        }
        ((t.uRadius.value = e),
          (t.uAlpha.value = 0.95),
          (t.uTime.value = r),
          (t.uPxs.value = this.pxs));
        let i = t.uFacing.value;
        ((i.x = Math.cos(n.facing)),
          (i.y = Math.sin(n.facing)),
          (this.self.visible = !0));
      } else this.self.visible = !1;
      if (
        (n &&
          e.playerId === this.lastPlayer &&
          n.level > this.lastLevel &&
          this.lastLevel > 0 &&
          (this.levelAge = 0),
        n && ((this.lastLevel = n.level), (this.lastPlayer = e.playerId)),
        (this.levelAge += e.dt),
        i && n && n.alive && this.levelAge < 1.05)
      ) {
        let e = (n.radius || 0.6) + 1.9;
        {
          let t = this.levelFx.material.uniforms,
            n = t.uCenter.value;
          ((n.x = o), (n.y = s), (t.uHalf.value = e + 0.9));
        }
        let t = this.levelFx.material.uniforms;
        ((t.uRadius.value = e),
          (t.uTime.value = this.levelAge),
          (t.uAlpha.value = 0.75),
          (this.levelFx.visible = !0));
      } else this.levelFx.visible = !1;
      (this.ring(this.target, i ? e.targetUnit : null, a, r, 0.3),
        this.ring(
          this.hover,
          i && e.hoverUnit !== e.targetUnit ? e.hoverUnit : null,
          a,
          r,
          0.25,
        ));
      let c = e.controls,
        l = c && c.attackMove,
        u = i && l && l.pending && n && n.alive;
      if (
        ((this.amoveAlpha +=
          (+!!u - this.amoveAlpha) * Math.min(1, e.dt * (u ? 20 : 12))),
        !u && this.amoveAlpha < 0.01 && (this.amoveAlpha = 0),
        this.amoveAlpha > 0.01 && n)
      ) {
        let e = (l && l.range ? l.range : 1.5) + (n.radius || 0.6);
        {
          let t = this.amove.material.uniforms,
            n = t.uCenter.value;
          ((n.x = o), (n.y = s), (t.uHalf.value = e + 0.9));
        }
        let t = this.amove.material.uniforms;
        if (
          ((t.uRadius.value = e),
          (t.uTime.value = r),
          (t.uAlpha.value = this.amoveAlpha),
          l && l.cursorOk)
        ) {
          let e = l.cx - o,
            n = l.cy - s,
            r = Math.sqrt(e * e + n * n);
          if (r > 0.05) {
            let i = t.uFacing.value;
            ((i.x = e / r), (i.y = n / r));
          }
        }
        this.amove.visible = !0;
      } else this.amove.visible = !1;
      let d = c && c.aim,
        f = this.aimMat.uniforms,
        p = i && d && d.active && n && n.alive,
        m = c && c.cancelZone,
        h = !!(p && m && m.visible && m.hover),
        g = p ? (d.strength == null ? 1 : d.strength) * (h ? 0.45 : 1) : 0;
      ((this.aimAlpha +=
        (g - this.aimAlpha) * Math.min(1, e.dt * (p ? 22 : 16))),
        Math.abs(g - this.aimAlpha) < 0.005 && (this.aimAlpha = g),
        (f.uCancel.value += (+!!h - f.uCancel.value) * Math.min(1, e.dt * 20)),
        f.uCancel.value < 0.005
          ? (f.uCancel.value = 0)
          : f.uCancel.value > 0.995 && (f.uCancel.value = 1));
      let _ = null;
      if (this.aimAlpha > 0.01 && n) {
        if (p) {
          let r = d.x - o,
            i = d.y - s,
            c = Math.sqrt(r * r + i * i);
          c < 0.05
            ? ((r = Math.cos(n.facing)), (i = Math.sin(n.facing)), (c = 0.001))
            : ((r /= c), (i /= c));
          let l = Math.max(0, d.range || 0),
            u = d.radius || 0,
            p = d.type,
            m = 0,
            h = l,
            g = l + 1.5,
            v = 1,
            y = 0;
          switch (((f.uTargetOn.value = 0), p)) {
            case `skillshot`:
              ((m = 1), (h = l), (g = l + 2));
              break;
            case `line`:
              ((m = 2), (h = l), (g = l + 2));
              break;
            case `aoe`:
              if (l <= 0.01) ((m = 8), (g = u + 1.5), (v = 0));
              else {
                m = 3;
                let e = Math.min(c, l),
                  t = f.uTarget.value;
                ((t.x = r * e), (t.y = i * e), (g = l + u + 1.5));
              }
              break;
            case `cone`:
              ((m = 4), (g = l + 1.5), (v = 0));
              break;
            case `dash`:
              ((m = 5), (h = Math.max(1.2, Math.min(c, l))), (g = l + 2));
              break;
            case `blink`:
              if (
                ((m = 6),
                (h = Math.max(1, Math.min(c, l))),
                (g = Math.max(l, Math.min(c, l + 6)) + 2),
                c > l + 0.6)
              ) {
                y = Math.min(1, (c - l - 0.6) / 0.8);
                let e = f.uCursor.value;
                ((e.x = r * c), (e.y = i * c));
              }
              break;
            case `target`:
              m = 7;
              {
                let e = d.targetId >= 0 ? t.units.get(d.targetId) : null;
                if (e && e.alive) {
                  ((_ = e),
                    (f.uTargetOn.value = 1),
                    (f.uTargetR.value = (e.radius || 0.5) + 0.34));
                  let t = f.uTarget.value;
                  ((t.x = e.prevX + (e.x - e.prevX) * a - o),
                    (t.y = e.prevY + (e.y - e.prevY) * a - s),
                    (g = Math.max(l, Math.sqrt(t.x * t.x + t.y * t.y)) + 1.5));
                }
              }
              break;
            default:
              ((m = l > 0 ? 7 : 8), (g = Math.max(l, u) + 1.5));
          }
          ((this.lastAimShape = m),
            (f.uShape.value = m),
            (f.uRange.value = l),
            (f.uLen.value = h),
            (f.uWidth.value = d.width || 1),
            (f.uRadius.value = u),
            (f.uShowRange.value = v),
            (f.uGhost.value += (y - f.uGhost.value) * Math.min(1, e.dt * 14)),
            f.uGhost.value < 0.002 && (f.uGhost.value = 0),
            (f.uHalfAng.value = ((d.angle || 60) * Math.PI) / 360));
          let b = f.uDir.value;
          ((b.x = r),
            (b.y = i),
            (f.uValid.value +=
              (+!!d.valid - f.uValid.value) * Math.min(1, e.dt * 18)),
            f.uValid.value > 0.995
              ? (f.uValid.value = 1)
              : f.uValid.value < 0.005 && (f.uValid.value = 0));
          {
            let e = this.aim.material.uniforms,
              t = e.uCenter.value;
            ((t.x = o), (t.y = s), (e.uHalf.value = g));
          }
        }
        ((f.uTime.value = r),
          (f.uAlpha.value = this.aimAlpha),
          (this.aim.visible = !0));
      } else this.aim.visible = !1;
      (_ && (this.lockUnit = _),
        (this.aimTargetAlpha +=
          (+!!_ - this.aimTargetAlpha) * Math.min(1, e.dt * (_ ? 24 : 12))));
      let v = this.lockUnit;
      if (
        (this.aimTargetAlpha > 0.01 && v && v.alive && i
          ? (this.ring(this.aimTarget, v, a, r, 0.34),
            (this.aimTarget.material.uniforms.uAlpha.value =
              this.aimTargetAlpha * Math.max(0.4, this.aimAlpha)))
          : ((this.aimTarget.visible = !1),
            this.aimTargetAlpha <= 0.01 &&
              ((this.lockUnit = null), (this.aimTargetAlpha = 0))),
        c && c.clickMarker && c.clickMarker.seq !== this.markerSeq)
      ) {
        let e = c.clickMarker;
        ((this.markerSeq = e.seq), (this.markerAge = 0));
        {
          let t = this.marker.material.uniforms,
            n = t.uCenter.value;
          ((n.x = e.x), (n.y = e.y), (t.uHalf.value = 1.1));
        }
        let t =
            e.kind === `attack`
              ? this.attackCol
              : e.kind === `attackMove`
                ? this.amoveCol
                : this.moveCol,
          n = this.marker.material.uniforms;
        (n.uColor.value.copy(t[0]), n.uColor2.value.copy(t[1]));
      }
      (this.markerAge < 1 && (this.markerAge += e.dt),
        (this.marker.material.uniforms.uAge.value = this.markerAge),
        (this.marker.visible = i && this.markerAge < 0.65));
    }
    ring(e, t, n, r, i) {
      if (!t || !t.alive) {
        e.visible = !1;
        return;
      }
      let a = t.prevX + (t.x - t.prevX) * n,
        o = t.prevY + (t.y - t.prevY) * n,
        s = (t.radius || 0.5) + i,
        c = e.material.uniforms;
      {
        let e = c.uCenter.value;
        ((e.x = a), (e.y = o), (c.uHalf.value = s + 0.9));
      }
      ((c.uRadius.value = s),
        (c.uTime.value = r),
        (c.uAlpha.value = 1),
        (e.visible = !0));
    }
    hideAll() {
      for (let e of this.all) e.visible = !1;
      ((this.liftDone = !1),
        (this.liftFrames = 0),
        (this.liftInfo.tries = 0),
        (this.aimAlpha = 0),
        (this.aimTargetAlpha = 0),
        (this.amoveAlpha = 0),
        (this.lockUnit = null),
        (this.levelAge = 9),
        (this.lastLevel = -1));
    }
    dispose() {
      for (let e of this.all) (this.scene.remove(e), e.material.dispose());
      (this.grid128.dispose(), this.grid24.dispose(), this.heightTex.dispose());
    }
  },
  Je = [`champions`, `creeps`, `structures`],
  Ye = class {
    constructor(e) {
      ((this.registry = e),
        (this.providers = [null, null, null]),
        (this.n = 0),
        (this.frame = 0));
    }
    refresh() {
      if (!(this.frame++ % 30)) {
        this.n = 0;
        for (let e = 0; e < Je.length; e++) {
          let t = this.registry.get(Je[e]);
          t &&
            typeof t.getAnchor == `function` &&
            (this.providers[this.n++] = t);
        }
      }
    }
    get(e, t, n, r) {
      for (let i = 0; i < this.n; i++)
        try {
          if (this.providers[i].getAnchor(e, t, n, r)) return r;
        } catch {}
      return O(e, t, n, r);
    }
  },
  K = 20,
  Xe = class {
    constructor() {
      ((this.n = 0),
        (this.l = new Float32Array(K)),
        (this.r = new Float32Array(K)),
        (this.b = new Float32Array(K)),
        (this.D = 1),
        (this.base = 6),
        (this.version = -1),
        (this.fbN = 0),
        (this.fl = new Float32Array(4)),
        (this.fr = new Float32Array(4)),
        (this.fb = new Float32Array(4)),
        (this.fbKey = -1));
    }
    update(e, t, n, r, i) {
      if (((this.D = t), !e || !e.hudOk))
        return ((this.n = 0), (this.fbN = 0), (this.version = -1), this);
      if (e.version !== this.version || t !== this._D) {
        ((this.version = e.version), (this._D = t));
        let i = 0;
        for (let a = 0; a < e.cn && i < K; a++) {
          let o = e.ct[a],
            s = e.cb[a] - o,
            c = e.cr[a] - e.cl[a];
          o > 12 ||
            s >= r * 0.3 ||
            c >= n * 0.9 ||
            ((this.l[i] = e.cl[a] * t),
            (this.r[i] = e.cr[a] * t),
            (this.b[i] = (e.cb[a] + 4) * t),
            i++);
        }
        this.n = i;
      }
      let a = i > 0 ? i : Math.min(n / 1920, r / 1080),
        o = a * 1e4 + n + r * 1e-4 + t * 1e6;
      if (o !== this.fbKey) {
        this.fbKey = o;
        let e = n * 0.5;
        ((this.fl[0] = (e - 176 * a) * t),
          (this.fr[0] = (e + 176 * a) * t),
          (this.fb[0] = (100 * a + 4) * t),
          (this.fl[1] = (n - 350 * a) * t),
          (this.fr[1] = n * t),
          (this.fb[1] = (66 * a + 4) * t),
          (this.fbN = 2));
      }
      return this;
    }
    at(e) {
      let t = this.base * this.D,
        n = 10 * this.D;
      for (let r = 0; r < this.n; r++)
        e > this.l[r] - n &&
          e < this.r[r] + n &&
          this.b[r] > t &&
          (t = this.b[r]);
      for (let r = 0; r < this.fbN; r++)
        e > this.fl[r] - n &&
          e < this.fr[r] + n &&
          this.fb[r] > t &&
          (t = this.fb[r]);
      return t;
    }
    span(e, t) {
      let n = this.base * this.D,
        r = 6 * this.D;
      for (let i = 0; i < this.n; i++)
        t > this.l[i] - r &&
          e < this.r[i] + r &&
          this.b[i] > n &&
          (n = this.b[i]);
      for (let i = 0; i < this.fbN; i++)
        t > this.fl[i] - r &&
          e < this.fr[i] + r &&
          this.fb[i] > n &&
          (n = this.fb[i]);
      return n;
    }
  },
  Ze = {
    mana: `NO MANA`,
    energy: `NO ENERGY`,
    unlearned: `NOT LEARNED`,
    disabled: `DISABLED`,
  },
  Qe = {
    lastHit: `LAST HIT`,
    noTarget: `NO TARGET IN RANGE`,
    noStructure: `NO TURRET IN RANGE`,
    noMinion: `NO MINION IN RANGE`,
    noWard: `NO WARD READY`,
    wardCd: `WARD ON COOLDOWN`,
    noPotion: `NO POTION`,
    tapTurret: `TAP AGAIN FOR TURRET`,
    turretProtected: `TURRET IS PROTECTED`,
  },
  $e = new Set([`lastHit`]),
  et = new Set([`tapTurret`, `turretProtected`]),
  tt = class {
    constructor() {
      ((this.alpha = 0),
        (this.codes = new Uint16Array(6)),
        (this.n = 0),
        (this.labels = {}),
        (this.atlas = null),
        (this.s = 1),
        (this.D = 1),
        (this._a = { x: 0.5, y: 0.5, z: 0.5 }),
        (this.reason = ``),
        (this.slot = ``),
        (this.t = 0.5));
    }
    bake(e, t) {
      let n = e * t;
      ((this.s = n),
        (this.D = e),
        (this.atlas = new M(`0123456789.s`, {
          size: Math.round(25 * n),
          weight: 800,
          top: `#ffffff`,
          mid: `#e6edf5`,
          bottom: `#a9b9ca`,
          stroke: `#070d14`,
          strokeW: Math.max(2, 3.4 * n),
          gloss: !1,
          tracking: -0.6 * n,
          shadow: { color: `rgba(0,0,0,0.65)`, blur: 4 * n, dy: 1.5 * n },
        })));
      for (let e in Ze)
        this.labels[e] = j(Ze[e], {
          size: Math.round(15 * n),
          weight: 800,
          fill: `#f1f5f9`,
          fill2: `#aebccb`,
          strokeW: Math.max(2, 3 * n),
          stroke: `rgba(5,9,14,0.95)`,
          tracking: 1.2 * n,
          shadow: { color: `rgba(0,0,0,0.6)`, blur: 3 * n, dy: 1 * n },
        });
      for (let e in Qe) {
        let t = $e.has(e),
          r = et.has(e);
        this.labels[e] = j(Qe[e], {
          size: Math.round((t || r ? 13 : 15) * n),
          weight: 800,
          fill: t ? `#dcffe9` : r ? `#fff0cf` : `#ffe6e0`,
          fill2: t ? `#68d79b` : r ? `#e8b95c` : `#ff9b8b`,
          strokeW: Math.max(2, 3 * n),
          stroke: `rgba(5,9,14,0.95)`,
          tracking: 1.4 * n,
          shadow: { color: `rgba(0,0,0,0.6)`, blur: 3 * n, dy: 1 * n },
        });
      }
    }
    format(e) {
      let t = this.codes,
        n = 0;
      if (e < 9.95) {
        let r = Math.max(0.1, Math.round(e * 10) / 10),
          i = Math.floor(r + 1e-6),
          a = Math.round((r - i) * 10);
        ((t[n++] = 48 + i), (t[n++] = 46), (t[n++] = 48 + Math.min(9, a)));
      } else {
        let r = Math.ceil(e);
        (r >= 100
          ? ((t[n++] = 48 + (((r / 100) | 0) % 10)),
            (r %= 100),
            (t[n++] = 48 + ((r / 10) | 0)))
          : (t[n++] = 48 + ((r / 10) | 0)),
          (t[n++] = 48 + (r % 10)));
      }
      ((t[n++] = 115), (this.n = n));
    }
    draw(e, n, r, i, a, o, s, c, l, u) {
      let d = !!(
          r &&
          r.active &&
          i &&
          i.alive &&
          !r.valid &&
          r.reason &&
          r.reason !== `dead` &&
          (r.strength == null || r.strength > 0.3)
        ),
        f = !d && !!i && i.alive && !!u && !!this.labels[u],
        p = d || f;
      if (
        ((this.alpha += (+!!p - this.alpha) * Math.min(1, o * (p ? 14 : 10))),
        this.alpha < 0.02 || !this.atlas || !i)
      )
        return ((this.alpha = p ? this.alpha : 0), !1);
      d
        ? ((this.reason = r.reason), (this.slot = r.slot))
        : f && ((this.reason = u), (this.slot = ``));
      let m = n.proj,
        h = m.e,
        g = this._a;
      n.anchors.get(i, n.alpha, `ground`, g);
      let _ = h[3] * g.x + h[7] * g.y + h[11] * g.z + h[15];
      if (_ <= 1e-4) return !1;
      let v = (h[0] * g.x + h[4] * g.y + h[8] * g.z + h[12]) / _,
        y = (h[1] * g.x + h[5] * g.y + h[9] * g.z + h[13]) / _;
      if (v < -1.2 || v > 1.2 || y < -1.2 || y > 1.2) return !1;
      let b = this.D,
        x = this.s,
        S = (m.l + (v * 0.5 + 0.5) * m.w) * b,
        C = (m.t + (0.5 - y * 0.5) * m.h) * b + 64 * x,
        w = 22 * x,
        T = n.safe ? n.safe.at(S) + w : w,
        E = l - w;
      (C > E && (C = E),
        C < T && (C = T),
        (e.globalAlpha = I[R(this.alpha * s)]));
      let D = !1;
      if (this.reason === `cooldown`) {
        let n = 0,
          r = t.indexOf(this.slot);
        if (r >= 0 && i.abilities && i.abilities[r])
          n = i.abilities[r].cdEnd - a.time;
        else if ((this.slot === `D` || this.slot === `F`) && i.spells) {
          let e = i.spells[this.slot === `D` ? 0 : 1];
          e && (n = e.cdEnd - a.time);
        }
        if (!(n <= 0.05 && p)) {
          this.format(n > 0.1 ? n : 0.1);
          let t = this.atlas,
            r = S | 0,
            i = C | 0;
          (t.drawBoth(e, this.codes, this.n, r, i, 1), (D = !0));
          let a = (t.measure(this.codes, this.n) >> 1) + t.pad + 2,
            o = (t.cellH >> 1) + 2;
          c && c(r - a, i - o, r + a, i + o);
        }
      } else {
        let t = this.labels[this.reason];
        if (t) {
          let n = Math.round(S - t.cx),
            r = Math.round(C - t.cy);
          (e.drawImage(t.canvas, n, r),
            (D = !0),
            c && c(n - 2, r - 2, n + t.w + 2, r + t.h + 2));
        }
      }
      return ((e.globalAlpha = 1), D);
    }
  },
  q = 8,
  nt = 2.6,
  rt = Math.PI * 2,
  J = {
    danger: { text: `DANGER`, a: `#ff6a58`, b: `#ffd0c8` },
    assist: { text: `HELP`, a: `#ffcf6a`, b: `#fff0cc` },
    omw: { text: `ON MY WAY`, a: `#6fd8ff`, b: `#d8f4ff` },
    generic: { text: `HERE`, a: `#cfe2f2`, b: `#ffffff` },
  },
  it = class {
    constructor() {
      ((this.x = new Float32Array(q)),
        (this.y = new Float32Array(q)),
        (this.t = new Float32Array(q).fill(1e9)),
        (this.kind = Array(q).fill(`generic`)),
        (this.n = 0),
        (this.labels = {}),
        (this.s = 1),
        (this.D = 1),
        (this.next = 0));
    }
    bake(e, t) {
      let n = e * t;
      ((this.s = n), (this.D = e));
      for (let e in J) {
        let t = J[e];
        this.labels[e] = j(t.text, {
          size: Math.round(13 * n),
          weight: 800,
          fill: t.b,
          fill2: t.a,
          strokeW: Math.max(2, 3 * n),
          stroke: `rgba(6,10,16,0.92)`,
          tracking: 1.4 * n,
          shadow: { color: `rgba(0,0,0,0.65)`, blur: 3 * n, dy: 1 * n },
        });
      }
    }
    clear() {
      this.t.fill(1e9);
    }
    onEvents(e, t, r) {
      if (e)
        for (let t = 0; t < e.length; t++) {
          let i = e[t];
          if (i.type !== n.PING || (i.team !== void 0 && i.team !== r))
            continue;
          let a = this.next;
          ((this.next = (this.next + 1) % q),
            (this.x[a] = i.x),
            (this.y[a] = i.y),
            (this.t[a] = 0),
            (this.kind[a] = J[i.kind] ? i.kind : `generic`));
        }
    }
    draw(e, t, n, r, i) {
      let a = 0,
        o = t.e,
        s = this.D,
        c = this.s;
      for (let l = 0; l < q; l++) {
        let u = this.t[l];
        if (u > nt) continue;
        this.t[l] = u + n;
        let d = this.x[l],
          f = this.y[l],
          p = y(d, f),
          m = o[3] * d + o[7] * p + o[11] * f + o[15];
        if (m <= 1e-4) continue;
        let h = (o[0] * d + o[4] * p + o[8] * f + o[12]) / m,
          g = (o[1] * d + o[5] * p + o[9] * f + o[13]) / m;
        if (h < -1.2 || h > 1.2 || g < -1.25 || g > 1.25) continue;
        let _ = ((t.l + (h * 0.5 + 0.5) * t.w) * s) | 0,
          v = ((t.t + (0.5 - g * 0.5) * t.h) * s) | 0,
          b = J[this.kind[l]],
          x = this.labels[this.kind[l]],
          S = u / nt,
          C = u < 0.1 ? u / 0.1 : S > 0.75 ? (1 - S) / 0.25 : 1;
        e.globalAlpha = I[R(Math.max(0, Math.min(1, C)) * r)];
        let w = 26 * c;
        ((e.lineWidth = Math.max(2, 2.6 * c)), (e.strokeStyle = b.a));
        for (let t = 0; t < 2; t++) {
          let n = ((u - t * 0.45) % 0.9) / 0.9;
          if (n < 0 || u - t * 0.45 < 0) continue;
          let i = w * (1.85 - n * 0.95);
          ((e.globalAlpha =
            I[R(Math.max(0, Math.min(1, C * (0.35 + 0.65 * n))) * r)]),
            e.beginPath(),
            e.arc(_, v, i, 0, rt),
            e.stroke());
        }
        if (
          ((e.globalAlpha = I[R(Math.max(0, Math.min(1, C)) * r)]),
          (e.fillStyle = b.a),
          e.beginPath(),
          e.arc(_, v, Math.max(2, 3 * c), 0, rt),
          e.fill(),
          x)
        ) {
          let t = Math.round(_ - x.cx),
            n = Math.round(v - w * 1.5 - x.h);
          (e.drawImage(x.canvas, t, n),
            i && i(t - 2, n - 2, t + x.w + 2, n + x.h + 2));
        }
        (i &&
          i((_ - w * 2) | 0, (v - w * 2) | 0, (_ + w * 2) | 0, (v + w * 2) | 0),
          a++);
      }
      return ((e.globalAlpha = 1), a);
    }
  },
  Y = 48,
  X = 16;
function at(e, t, n) {
  if (e <= 0 || t <= 0) return 0;
  if ((e > n && (e = n), t > n && (t = n), e * e + t * t <= n * n))
    return e * t;
  let r = Math.sqrt(n * n - t * t),
    i = n * n - e * e,
    a = i > 0 ? Math.sqrt(i) : 0,
    o = r / n,
    s = e / n;
  return (
    r * t +
    0.5 *
      (e * a +
        n * n * Math.asin(s > 1 ? 1 : s) -
        (r * t + n * n * Math.asin(o > 1 ? 1 : o)))
  );
}
function Z(e, t, n) {
  return (
    (e < 0 ? -1 : 1) * (t < 0 ? -1 : 1) * at(e < 0 ? -e : e, t < 0 ? -t : t, n)
  );
}
function ot(e, t, n, r, i, a, o) {
  let s = r - e,
    c = i - t,
    l = a - e,
    u = o - t;
  return l <= -n || s >= n || u <= -n || c >= n
    ? 0
    : Z(l, u, n) - Z(s, u, n) - Z(l, c, n) + Z(s, c, n);
}
var st = class {
    constructor() {
      ((this.n = 0),
        (this.nHud = 0),
        (this.l = new Float32Array(Y)),
        (this.t = new Float32Array(Y)),
        (this.r = new Float32Array(Y)),
        (this.b = new Float32Array(Y)),
        (this.kind = new Uint8Array(Y)),
        (this.cx = new Float32Array(Y)),
        (this.cy = new Float32Array(Y)),
        (this.rad = new Float32Array(Y)),
        (this.src = Array(Y).fill(null)),
        (this.srcN = -1),
        (this.D = 0),
        (this.hudOk = !1),
        (this.changed = !0),
        (this.version = 0),
        (this.cl = new Float32Array(Y)),
        (this.ct = new Float32Array(Y)),
        (this.cr = new Float32Array(Y)),
        (this.cb = new Float32Array(Y)),
        (this.cn = 0),
        (this.dl = new Float32Array(X)),
        (this.dt = new Float32Array(X)),
        (this.dr = new Float32Array(X)),
        (this.db = new Float32Array(X)),
        (this.nd = 0),
        (this.q = new Float64Array(8)),
        (this.discs = 0));
    }
    scanRound() {
      if (((this.nd = 0), typeof document > `u`)) return;
      let e = document.getElementById(`hud-root`);
      if (!e) return;
      let t = e.querySelector(`[data-joystick]`);
      t && this.pushRound(t.getBoundingClientRect());
      let n = e.querySelectorAll(`[data-slot]`);
      for (let e = 0; e < n.length; e++)
        this.pushRound(n[e].getBoundingClientRect());
    }
    pushRound(e) {
      if (this.nd >= X) return;
      let t = e.width,
        n = e.height;
      if (!(t > 6 && n > 6)) return;
      let r = this.nd++;
      ((this.dl[r] = e.left),
        (this.dt[r] = e.top),
        (this.dr[r] = e.right),
        (this.db[r] = e.bottom));
    }
    update(e, t, n, r, i, a) {
      let o = Array.isArray(e),
        s = r !== this.D || (o ? e.length !== this.srcN : this.srcN !== -1);
      if (!s && o) {
        for (let t = 0; t < e.length && t < Y; t++)
          if (e[t] !== this.src[t]) {
            s = !0;
            break;
          }
      }
      if (((this.changed = s), s)) {
        (this.version++, (this.D = r), (this.srcN = o ? e.length : -1));
        let t = 0;
        if (o) for (let t = 0; t < e.length && t < Y; t++) this.src[t] = e[t];
        for (let t = o ? e.length : 0; t < Y; t++) this.src[t] = null;
        ((this.hudOk =
          o &&
          !(e.length === 1 && e[0].width >= i * 0.9 && e[0].height >= a * 0.9)),
          this.hudOk ? this.scanRound() : (this.nd = 0));
        let n = 0;
        if (this.hudOk)
          for (let i = 0; i < e.length && t < Y; i++) {
            let a = e[i],
              o = a.left,
              s = a.top,
              c = a.right,
              l = a.bottom;
            ((this.cl[t] = o),
              (this.ct[t] = s),
              (this.cr[t] = c),
              (this.cb[t] = l));
            let u = 0,
              d = 0,
              f = -1;
            for (let e = 0; e < this.nd; e++) {
              if (
                this.dl[e] < o - 2 ||
                this.dt[e] < s - 2 ||
                this.dr[e] > c + 2 ||
                this.db[e] > l + 2
              )
                continue;
              u++;
              let t = (this.dr[e] - this.dl[e]) * (this.db[e] - this.dt[e]);
              (t > d && (d = t),
                this.dl[e] > o - 3 &&
                  this.dt[e] > s - 3 &&
                  this.dr[e] < c + 3 &&
                  this.db[e] < l + 3 &&
                  (f = e));
            }
            let p = (c - o) * (l - s);
            if (f >= 0 && u === 1) {
              (this.setDisc(
                t,
                this.dl[f],
                this.dt[f],
                this.dr[f],
                this.db[f],
                r,
              ),
                n++,
                t++);
              continue;
            }
            if (u > 0 && p > d * 1.6) continue;
            let m = (c - o) * 0.03,
              h = (l - s) * 0.03;
            ((this.kind[t] = 0),
              (this.l[t] = (o + m) * r),
              (this.t[t] = (s + h) * r),
              (this.r[t] = (c - m) * r),
              (this.b[t] = (l - h) * r),
              t++);
          }
        if (this.hudOk)
          for (let e = 0; e < this.nd && t < Y; e++) {
            let i = !1,
              a = (this.dl[e] + this.dr[e]) * 0.5 * r,
              o = (this.dt[e] + this.db[e]) * 0.5 * r;
            for (let e = 0; e < t; e++)
              if (
                this.kind[e] === 1 &&
                Math.abs(this.cx[e] - a) < 2 &&
                Math.abs(this.cy[e] - o) < 2
              ) {
                i = !0;
                break;
              }
            i ||
              (this.setDisc(
                t,
                this.dl[e],
                this.dt[e],
                this.dr[e],
                this.db[e],
                r,
              ),
              n++,
              t++);
          }
        ((this.nHud = t),
          (this.cn = t),
          (this.discs = n),
          (this.cn = Math.min(this.cn, Y)));
      }
      let c = this.nHud;
      if (t)
        for (let e = 0; e < n && c < Y; e++) {
          let n = t[e];
          ((this.kind[c] = 0),
            (this.l[c] = n.left * r),
            (this.t[c] = n.top * r),
            (this.r[c] = n.right * r),
            (this.b[c] = n.bottom * r),
            c++);
        }
      return ((this.n = c), this);
    }
    setDisc(e, t, n, r, i, a) {
      ((this.kind[e] = 1),
        (this.l[e] = t * a),
        (this.t[e] = n * a),
        (this.r[e] = r * a),
        (this.b[e] = i * a),
        (this.cl[e] = t),
        (this.ct[e] = n),
        (this.cr[e] = r),
        (this.cb[e] = i),
        (this.cx[e] = (t + r) * 0.5 * a),
        (this.cy[e] = (n + i) * 0.5 * a));
      let o = (r - t) * a,
        s = (i - n) * a;
      this.rad[e] = (o < s ? o : s) * 0.5;
    }
    computeCover() {
      let e = this.q,
        t = e[0],
        n = e[1],
        r = e[2],
        i = e[3],
        a = (r - t) * (i - n);
      if (!(a > 0)) {
        e[4] = 0;
        return;
      }
      let o = 0;
      for (let e = 0; e < this.n; e++) {
        let s =
          (r < this.r[e] ? r : this.r[e]) - (t > this.l[e] ? t : this.l[e]);
        if (s <= 0) continue;
        let c =
          (i < this.b[e] ? i : this.b[e]) - (n > this.t[e] ? n : this.t[e]);
        if (c <= 0) continue;
        let l;
        if (this.kind[e] === 1) {
          let o = ot(this.cx[e], this.cy[e], this.rad[e], t, n, r, i);
          l = o > 0 ? o / a : 0;
        } else l = (s * c) / a;
        l > o && (o = l);
      }
      e[4] = o > 1 ? 1 : o;
    }
    overlap(e, t, n, r) {
      let i = this.q;
      return (
        (i[0] = e),
        (i[1] = t),
        (i[2] = n),
        (i[3] = r),
        this.computeCover(),
        i[4]
      );
    }
    contains(e, t, n) {
      for (let r = 0; r < this.n; r++)
        if (
          e > this.l[r] - n &&
          e < this.r[r] + n &&
          t > this.t[r] - n &&
          t < this.b[r] + n
        ) {
          if (this.kind[r] === 1) {
            let i = e - this.cx[r],
              a = t - this.cy[r],
              o = this.rad[r] + n;
            if (i * i + a * a > o * o) continue;
          }
          return !0;
        }
      return !1;
    }
  },
  Q = 16,
  $ = 9,
  ct = Math.PI * 2,
  lt = class {
    constructor(e) {
      ((this.ctx = e),
        (this.app = e.app),
        (this.root = document.getElementById(`overlay-root`)),
        (this.canvas = document.createElement(`canvas`)),
        (this.canvas.className = `overlay-canvas`),
        (this.canvas.style.cssText = `position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;display:block`),
        this.root && this.root.appendChild(this.canvas),
        (this.g = this.canvas.getContext(`2d`, {
          alpha: !0,
          desynchronized: !1,
        })),
        (this.proj = new b(e.camera)),
        (this.anchors = new Ye(e.registry)),
        (this.bars = new De()),
        (this.text = new Ie()),
        (this.text.bars = this.bars),
        (this.text.anchors = this.anchors),
        (this.safe = new Xe()),
        (this.text.safe = this.safe),
        (this.hint = new tt()),
        (this.pings = new it()),
        (this.occ = new st()),
        (this.ground = new qe(e.scene, this.app.params, e.renderer)),
        (this.metrics = { ms: 0, last: 0, dirtyTiles: 0 }),
        (this.visible = !0),
        (this.fade = 0),
        (this.D = 0),
        (this.K = 0),
        (this.bakedW = 0),
        (this.cw = 0),
        (this.ch = 0),
        (this.ox = 0),
        (this.oy = 0),
        (this._vl = NaN),
        (this._vt = NaN),
        (this._vw = NaN),
        (this._vh = NaN),
        (this.cancelT = 0),
        (this.tilesPrev = new Uint8Array(144)),
        (this.tilesCur = new Uint8Array(144)),
        (this.tileW = 1),
        (this.tileH = 1),
        (this.fullClear = !0),
        (this.healT = 0));
      {
        let e = this.app.params,
          t = e && e.get ? parseFloat(e.get(`ov.heal`)) : NaN;
        this.healEvery = Number.isFinite(t) ? t : 1;
      }
      ((this._onVis = () => {
        document.hidden || (this.fullClear = !0);
      }),
        (this._onRestored = () => {
          ((this.fullClear = !0), (this._smooth = !1), (this.D = 0));
        }),
        document.addEventListener(`visibilitychange`, this._onVis),
        this.canvas.addEventListener(`contextrestored`, this._onRestored));
      let t = (e, t, n, r) => this.markDirty(e, t, n, r);
      ((this.bars.onDraw = t),
        (this.text.onDraw = t),
        (this._mark = t),
        (this.barCtx = {
          world: null,
          viewerTeam: 0,
          playerId: -1,
          alpha: null,
          dt: 0.5,
          fade: 0.5,
          registry: e.registry,
          proj: this.proj,
          targetId: -1,
          hoverId: -1,
          aimTargetId: -1,
          anchors: this.anchors,
          occ: this.occ,
          safe: this.safe,
          execArmed: !1,
          execAd: 0.5,
          execX: 0.5,
          execY: 0.5,
          execR: 0.5,
          execRad: 0.5,
        }),
        (this.evCtx = { world: null, playerId: -1, viewerTeam: 0 }),
        (this.groundCtx = {
          world: null,
          playerId: -1,
          viewerTeam: 0,
          alpha: 1,
          time: 0,
          dt: 0,
          controls: null,
          targetUnit: null,
          hoverUnit: null,
          show: !1,
        }),
        (this._onMatch = () => {
          (this.bars.forget(),
            this.text.clear(),
            this.pings.clear(),
            this.ground.hideAll(),
            (this.fullClear = !0));
        }),
        this.app.on(`match`, this._onMatch));
    }
    setVisible(e) {
      this.visible = !!e;
    }
    get occRects() {
      return { length: this.occ.n };
    }
    resize() {
      let e = Math.min(2, Math.max(1, window.devicePixelRatio || 1)),
        t = C(),
        n = t.width,
        r = t.height;
      (t.left !== this._vl ||
        t.top !== this._vt ||
        n !== this._vw ||
        r !== this._vh) &&
        ((this._vl = t.left),
        (this._vt = t.top),
        (this._vw = n),
        (this._vh = r),
        (this.ox = t.left * e),
        (this.oy = t.top * e),
        (this.canvas.style.left = `${t.left}px`),
        (this.canvas.style.top = `${t.top}px`),
        (this.canvas.style.width = `${n}px`),
        (this.canvas.style.height = `${r}px`),
        (this.fullClear = !0));
      let i = Math.max(0.62, Math.min(1.6, Math.min(r / 1080, n / 1920))),
        a = Math.round(n * e),
        o = Math.round(r * e);
      if (
        ((a !== this.cw || o !== this.ch) &&
          ((this.canvas.width = a),
          (this.canvas.height = o),
          (this.cw = a),
          (this.ch = o),
          (this._smooth = !1),
          (this.fullClear = !0),
          (this.tileW = a / Q),
          (this.tileH = o / $),
          this.tilesPrev.fill(0),
          this.tilesCur.fill(0),
          (this.ox = t.left * e),
          (this.oy = t.top * e)),
        e !== this.D ||
          Math.abs(i - this.K) > 0.01 ||
          Math.abs(n - this.bakedW) > 1)
      ) {
        ((this.D = e),
          (this.K = i),
          (this.bakedW = n),
          this.bars.bake(e, i, n),
          this.text.bake(e, i),
          this.hint.bake(e, i),
          this.pings.bake(e, i));
        let t = e * i;
        ((this.cancelLabel = j(`CANCEL`, {
          size: Math.round(12 * t),
          weight: 800,
          fill: `#ffe3df`,
          fill2: `#ff9a8c`,
          strokeW: 2.4 * t,
          stroke: `rgba(20,2,0,0.9)`,
          tracking: 1.2 * t,
        })),
          (this.cancelX = j(`×`, {
            size: Math.round(46 * t),
            weight: 600,
            fill: `#ffffff`,
            fill2: `#ffd2cc`,
            strokeW: 2 * t,
            stroke: `rgba(40,4,0,0.7)`,
          })),
          (this.fullClear = !0));
      }
    }
    markDirty(e, t, n, r) {
      let i = this.tileW,
        a = this.tileH,
        o = this.ox,
        s = this.oy,
        c = Math.floor((e - o) / i),
        l = Math.floor((n - o) / i),
        u = Math.floor((t - s) / a),
        d = Math.floor((r - s) / a);
      if (l < 0 || d < 0 || c >= Q || u >= $) return;
      (c < 0 && (c = 0),
        u < 0 && (u = 0),
        l >= Q && (l = 15),
        d >= $ && (d = 8));
      let f = this.tilesCur;
      for (let e = u; e <= d; e++)
        for (let t = c; t <= l; t++) f[e * Q + t] = 1;
    }
    clearDirty(e) {
      this.fullClear &&
        (e.clearRect(0, 0, this.cw, this.ch),
        (this.fullClear = !1),
        this.tilesCur.fill(0));
      let t = this.tilesCur,
        n = this.tileW,
        r = this.tileH,
        i = 0;
      for (let a = 0; a < $; a++) {
        let o = 0;
        for (; o < Q; ) {
          if (!t[a * Q + o]) {
            o++;
            continue;
          }
          let s = o;
          for (; s < Q && t[a * Q + s]; ) (s++, i++);
          let c = Math.floor(o * n),
            l = s >= Q ? this.cw : Math.ceil(s * n),
            u = Math.floor(a * r),
            d = a + 1 >= $ ? this.ch : Math.ceil((a + 1) * r);
          (e.clearRect(c, u, l - c, d - u), (o = s));
        }
      }
      this.metrics.dirtyTiles = i;
      let a = this.tilesPrev;
      ((this.tilesPrev = this.tilesCur),
        (this.tilesCur = a),
        this.tilesCur.fill(0));
    }
    update(e) {
      let t = performance.now(),
        n = e.world,
        r = this.g;
      if (!n) return;
      this.resize();
      let i =
        (e.state === `game` || e.state === `end`) && this.visible
          ? e.state === `end`
            ? 0
            : 1
          : 0;
      ((this.fade +=
        (i - this.fade) * Math.min(1, e.dt * (i > this.fade ? 12 : 5))),
        Math.abs(i - this.fade) < 0.02 && (this.fade = i),
        this.proj.begin());
      let a = this.ctx.registry.get(`controls`);
      if (a && e.state === `game` && typeof a.syncFrame == `function`)
        try {
          a.syncFrame(e);
        } catch {}
      let o = n.units.get(e.playerId),
        s = this.playerTargetId(o, n),
        c = a && a.hoverId != null ? a.hoverId : -1,
        l = a && a.aim,
        u =
          l && l.active && l.type === `target` && l.targetId != null
            ? l.targetId
            : -1;
      (this.bars.onEvents(e.events, n.time),
        this.pings.onEvents(e.events, n.time, e.viewerTeam));
      let d = this.evCtx;
      if (
        ((d.world = n),
        (d.playerId = e.playerId),
        (d.viewerTeam = e.viewerTeam),
        this.anchors.refresh(),
        e.state === `game` && this.text.onEvents(e.events, d),
        this.healEvery > 0 &&
          ((this.healT += e.dt),
          this.healT >= this.healEvery &&
            ((this.healT = 0), (this.fullClear = !0))),
        r.setTransform(1, 0, 0, 1, 0, 0),
        this.clearDirty(r),
        (this.ox !== 0 || this.oy !== 0) &&
          r.setTransform(1, 0, 0, 1, -this.ox, -this.oy),
        this.fade > 0)
      ) {
        ((r.globalAlpha = I[R(this.fade)]),
          (this._smooth ||=
            ((r.imageSmoothingEnabled = !0),
            (r.imageSmoothingQuality = `high`),
            !0)));
        let t = this.barCtx;
        ((t.world = n),
          (t.viewerTeam = e.viewerTeam),
          (t.playerId = e.playerId),
          (t.alpha = ne[oe(e.alpha)]),
          (t.dt = e.dt),
          (t.fade = this.fade),
          (t.targetId = s),
          (t.hoverId = c),
          (t.aimTargetId = u),
          (t.execArmed = !!(a && a.lastHitArmed && o && o.alive)),
          (t.execAd = t.execArmed
            ? ((o.stats && o.stats.ad) || 0) * (o.damageMult || 1)
            : 0),
          (t.execX = t.execArmed ? o.x : 0),
          (t.execY = t.execArmed ? o.y : 0),
          (t.execR = t.execArmed
            ? ((o.stats && o.stats.attackRange) || 1.5) + 3.5
            : 0),
          (t.execRad = (t.execArmed && o.radius) || 0));
        let i = this.ctx.registry.get(`hud`),
          d = null;
        if (i && typeof i.rects == `function`)
          try {
            d = i.rects();
          } catch {
            d = null;
          }
        let f = a && a.settingsUI,
          p = window.innerWidth,
          m = window.innerHeight,
          h = a && a.uiRects ? a.uiRects : f ? f.occluders : null,
          g = a && a.uiRects ? a.uiRectCount : f ? f.occluderCount : 0;
        if (
          (this.occ.update(d, h, g, this.D, p, m),
          this.safe.update(this.occ, this.D, p, m, i && i.s > 0 ? i.s : 0),
          this.bars.draw(r, t),
          (r.globalAlpha = 1),
          this.text.draw(r, this.proj, e.dt, e.time, this.fade, this.occ),
          e.state === `game`)
        ) {
          let i = a && typeof a.hintKey == `function` ? a.hintKey() : ``;
          this.hint.draw(
            r,
            t,
            l,
            o,
            n,
            e.dt,
            this.fade,
            this._mark,
            this.oy + this.ch,
            i,
          );
        } else this.hint.alpha = 0;
        (this.pings.draw(r, this.proj, e.dt, this.fade, this._mark),
          a && a.cancelZone && this.drawCancel(r, a.cancelZone, e.dt));
      } else this.cancelT = 0;
      let f = this.groundCtx;
      ((f.world = n),
        (f.playerId = e.playerId),
        (f.viewerTeam = e.viewerTeam),
        (f.alpha = e.alpha),
        (f.time = e.time),
        (f.dt = e.dt),
        (f.controls = a),
        (f.targetUnit = s >= 0 ? n.units.get(s) : null),
        (f.hoverUnit = c >= 0 ? n.units.get(c) : null),
        (f.show = this.fade > 0.05 && e.state === `game`),
        this.ground.update(f));
      let p = performance.now() - t;
      ((this.metrics.last = p),
        (this.metrics.ms += (p - this.metrics.ms) * 0.1));
    }
    playerTargetId(e, t) {
      if (!e || !e.alive) return -1;
      let n = e.order;
      if (
        n &&
        (n.type === `attack` ||
          n.type === `castOnTarget` ||
          n.type === `attackMove`) &&
        n.targetId >= 0
      ) {
        let e = t.units.get(n.targetId);
        if (e && e.alive) return e.id;
      }
      if (e.attackTargetId >= 0 && t.time - (e.attackT ?? -99) < 1.3) {
        let n = t.units.get(e.attackTargetId);
        if (n && n.alive && n.team !== e.team) return n.id;
      }
      return -1;
    }
    drawCancel(e, t, n) {
      if (
        ((this.cancelT +=
          ((t.visible && !t.dom ? 1 : 0) - this.cancelT) * Math.min(1, n * 16)),
        this.cancelT < 0.02)
      )
        return;
      let r = this.D,
        i = r * this.K,
        a = (t.x * r) | 0,
        o = (t.y * r) | 0,
        s = (t.r * r * (0.92 + 0.08 * this.cancelT) * (t.hover ? 1.12 : 1)) | 0;
      e.globalAlpha = I[R(this.cancelT)];
      let c = Math.max(2, Math.round(t.hover ? 3.4 * i : 3 * i));
      ((e.fillStyle = t.hover ? `rgba(214,34,22,0.74)` : `rgba(58,10,8,0.78)`),
        e.beginPath(),
        e.arc(a, o, s, 0, ct),
        e.fill(),
        (e.lineWidth = c),
        (e.strokeStyle = t.hover ? `#ff7f70` : `rgba(255,116,96,1)`),
        e.beginPath(),
        e.arc(a, o, s - (c >> 1), 0, ct),
        e.stroke(),
        (e.lineWidth = Math.max(1, Math.round(1.4 * i))),
        (e.strokeStyle = `rgba(255,205,196,0.7)`),
        e.beginPath(),
        e.arc(a, o, (s * 0.78) | 0, 0, ct),
        e.stroke());
      let l = this.cancelX;
      e.drawImage(
        l.canvas,
        Math.round(a - l.cx),
        Math.round(o - l.cy - l.asc * 0.08),
      );
      let u = this.cancelLabel,
        d =
          o > this.oy + this.ch * 0.55
            ? Math.round(o - s - 4 * i - u.h + u.pad)
            : Math.round(o + s + 4 * i - u.pad);
      (e.drawImage(u.canvas, Math.round(a - u.cx), d),
        (e.globalAlpha = 1),
        this.markDirty(
          (a - s - 6 * i) | 0,
          Math.min(d, o - s - 6 * i) | 0,
          (a + s + 6 * i) | 0,
          (Math.max(d + u.h, o + s) + 8 * i) | 0,
        ));
    }
    dispose() {
      (document.removeEventListener(`visibilitychange`, this._onVis),
        this.canvas.removeEventListener(`contextrestored`, this._onRestored),
        this.canvas.remove(),
        this.ground.dispose());
      let e = this.app.listeners && this.app.listeners.get(`match`);
      if (e) {
        let t = e.indexOf(this._onMatch);
        t >= 0 && e.splice(t, 1);
      }
    }
  };
export { lt as default };
