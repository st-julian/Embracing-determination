import { A as e, D as t, E as n, _ as r, i, n as a } from "./map-oE9sOnNc.js";
import { t as o } from "./events-WjIX4JqM.js";
import {
  At as s,
  D as c,
  Dt as l,
  Et as u,
  F as d,
  G as f,
  I as p,
  J as m,
  Jt as h,
  K as g,
  Kt as _,
  Mt as v,
  N as y,
  O as b,
  Ot as x,
  R as S,
  Rt as C,
  Tt as w,
  W as T,
  Xt as E,
  Y as D,
  Yt as O,
  Zt as k,
  _t as A,
  at as j,
  d as M,
  dt as N,
  g as P,
  h as ee,
  ht as F,
  jt as I,
  qt as te,
  u as ne,
  ut as re,
  v as ie,
  yt as ae,
  zt as oe,
} from "./index-DHK-Ptzs.js";
import { i as se, o as L, t as ce } from "./height-CVtQdZ3e.js";
import {
  a as le,
  c as ue,
  d as de,
  i as R,
  l as fe,
  n as pe,
  o as me,
  r as he,
  t as ge,
  u as _e,
} from "./lut-Ci_c3wOk.js";
var z = Math.PI / 180,
  ve = 16 / 9,
  B = Object.freeze({
    pitch: (40 * Math.PI) / 180,
    dolly: 0.86,
    settle: 1.5,
    lift: 0.9,
    orbitStart: 0.45,
    reach: 14,
    safe: 0.78,
    heroR: 1.1,
    heroH: 2.7,
    nexusR: 2.4,
    nexusH: 6.2,
    nexusTopSafe: 0.96,
    distMin: 0.7,
    distMax: 2,
    fitTau: 0.06,
    sweepMin: 0.25,
    sweepMax: 0.7,
    sweepDur: 6.5,
    drift: 0.02,
    pickDur: 1.5,
  }),
  V = Object.freeze({
    fov: 26, // [MT-HOOK] camera — BW-style narrow lens (legacy 38); see mt/render/camera.js
    pitch: 52 * z, // [MT-HOOK] camera — 3/4 tilt (legacy 56)
    distance: 20.5, // [MT-HOOK] camera — ~16 % closer than 24.5 (env r3: units read bigger; shared-camera zoom is relative)
    lookHeight: 0.9,
    stiffness: 13,
    lead: 0.32, // [MT-HOOK] camera — look-ahead (legacy 0.26)
    leadMax: 1.6, // [MT-HOOK] camera — (legacy 1.25)
  }),
  ye = null;
function be() {
  if (ye !== null) return ye;
  let e = 0;
  for (let t = -8; t <= 128; t += 1)
    for (let n = -8; n <= 128; n += 1) {
      let r = L(n, t);
      r > e && (e = r);
    }
  return ((e = Math.max(e, se + ce + 0.6)), (ye = e + 0.25), ye);
}
var xe = [-1, 1, 1, -1],
  Se = [-1, -1, 1, 1],
  Ce = [0, 0, 0, 0],
  we = [0, 0, 0, 0];
function Te(e, t, n, r, i) {
  let a = Math.tan(r * z * 0.5),
    o = Math.sin(t),
    s = Math.cos(t),
    c = n + o * e,
    l = s * e,
    u = 0,
    d = 0;
  for (let e = 0; e < 4; e++) {
    let t = xe[e] * a * i,
      n = Se[e] * a,
      r = t,
      f = n * s - o,
      p = -n * o - s,
      m = Math.hypot(r, f, p);
    ((r /= m), (f /= m), (p /= m));
    let h = f < -0.02 ? c / -f : 60;
    (h > 60 && (h = 60),
      (Ce[e] = r * h),
      (we[e] = l + p * h),
      (u += Ce[e]),
      (d += we[e]));
  }
  ((u /= 4), (d /= 4));
  let f = 0;
  for (let e = 0; e < 4; e++) {
    let t = Math.hypot(Ce[e] - u, we[e] - d);
    t > f && (f = t);
  }
  return f;
}
var H = -12,
  U = 0.5,
  W = 16,
  G = 18,
  K = 289,
  Ee = 1.2,
  De = class {
    constructor() {
      ((this.h = new Float32Array(K * K)),
        (this.ready = new Uint8Array(324)),
        (this.filled = 0));
    }
    fill(e, t) {
      let n = this.h,
        r = e * W,
        i = t * W;
      for (let e = i; e <= i + W; e++)
        for (let t = r; t <= r + W; t++) n[e * K + t] = L(H + t * U, H + e * U);
      ((this.ready[t * G + e] = 1), this.filled++);
    }
    bound(e, t) {
      let n = (e - H) / U,
        r = (t - H) / U;
      (n < 0 ? (n = 0) : n > 287.999 && (n = 287.999),
        r < 0 ? (r = 0) : r > 287.999 && (r = 287.999));
      let i = n | 0,
        a = r | 0,
        o = (i / W) | 0,
        s = (a / W) | 0;
      this.ready[s * G + o] === 0 && this.fill(o, s);
      let c = this.h,
        l = a * K + i,
        u = c[l],
        d = c[l + 1],
        f = c[l + K],
        p = c[l + K + 1],
        m = u > d ? u : d,
        h = f > p ? f : p;
      return (m > h ? m : h) + Ee;
    }
    at(e, t) {
      let n = (e - H) / U,
        r = (t - H) / U;
      (n < 0 ? (n = 0) : n > 287.999 && (n = 287.999),
        r < 0 ? (r = 0) : r > 287.999 && (r = 287.999));
      let i = n | 0,
        a = r | 0,
        o = (i / W) | 0,
        s = (a / W) | 0;
      this.ready[s * G + o] === 0 && this.fill(o, s);
      let c = this.h,
        l = n - i,
        u = r - a,
        d = a * K + i;
      return (
        (c[d] * (1 - l) + c[d + 1] * l) * (1 - u) +
        (c[d + K] * (1 - l) + c[d + K + 1] * l) * u
      );
    }
  },
  Oe = (e) => (e <= 0 ? 0 : e >= 1 ? 1 : e * e * e * (e * (e * 6 - 15) + 10)),
  ke = (e) => (e <= 0 ? 0 : e >= 1 ? 1 : 1 - (1 - e) ** 3),
  Ae = class {
    constructor(e, t) {
      ((this.camera = e), (this.canvas = t));
      let n = V;
      ((this.focusX = 60),
        (this.focusY = 60),
        (this.targetX = 60),
        (this.targetY = 60),
        (this._spr = new Float64Array(4)),
        (this._spr[0] = 60),
        (this._spr[2] = 60),
        (this.baseFov = n.fov),
        (this.pitch = n.pitch),
        (this.distance = n.distance),
        (this.yaw = 0),
        (this.roll = 0),
        (this.lookHeight = n.lookHeight),
        (this.stiffness = n.stiffness),
        (this.mode = `follow`),
        (this.shakeAmt = 0),
        (this.t = 0),
        (this.zoom = 1),
        (this.viewDist = n.distance),
        (this.leadX = 0),
        (this.leadY = 0),
        (this._groundH = 0),
        (this.dead = 0),
        (this.deathX = 0),
        (this.deathY = 0),
        (this.killerId = -1),
        (this._wasAlive = !0),
        (this._deathSeen = !1),
        (this._snapNext = !0),
        (this.cine = null),
        (this.nexusLean = 0.5),
        (this.nexusLean = 0),
        (this._nx = new Float64Array(2)),
        (this._ray = new l()),
        (this._v = new O()),
        (this._ndc = new h()),
        (this._rect = null),
        (this._lastPlayerId = -2),
        (this.aspectScale = 1),
        (this._dt = 1 / 60),
        (this._look = new O()),
        (this.shadowRadius = 0),
        (this._envKey = [NaN, NaN, NaN, NaN, NaN, NaN, NaN, NaN]),
        (this.maxTerrain = be()),
        (this.heights = new De()),
        (this._r = new Float64Array(8)),
        (this._cs = new Float64Array(3)),
        (this._world = null));
    }
    invalidateRect() {
      this._rect = null;
    }
    updateShadowEnvelope() {
      let e = this.camera,
        t = +!!this.cine,
        n = this.mode === `overview` ? 2 : +(this.mode === `free`),
        r = this._envKey,
        i = this.cine && this.cine.t >= B.settle ? 1 : 0,
        a = this.cine ? this.cine.envD : 0;
      if (
        r[0] === n &&
        r[1] === this.zoom &&
        r[2] === e.aspect &&
        r[3] === t &&
        r[4] === this.distance &&
        r[5] === this.baseFov &&
        r[6] === i &&
        r[7] === a
      )
        return;
      ((r[0] = n),
        (r[1] = this.zoom),
        (r[2] = e.aspect),
        (r[3] = t),
        (r[4] = this.distance),
        (r[5] = this.baseFov),
        (r[6] = i),
        (r[7] = a));
      let o = this.distance * this.zoom * this.aspectScale * 1.1,
        s = V.pitch,
        c = 3.5;
      if ((n === 2 && ((o *= 2.4), (s = 62 * z)), t)) {
        ((s = Math.min(s, B.pitch)), i && ((o *= B.dolly), (c = 2)));
        let e = a * this.zoom * this.aspectScale * 1.05;
        e > o && (o = e);
      }
      let l = Te(o, s, this.lookHeight, this.baseFov, e.aspect || ve);
      this.shadowRadius = Math.ceil(l + c);
    }
    setFocus(e, t, n = !1) {
      ((this.targetX = e), (this.targetY = t), n && this._snapToTarget());
    }
    _snapToTarget() {
      let e = this._spr;
      ((e[0] = this.targetX),
        (e[2] = this.targetY),
        (e[1] = 0),
        (e[3] = 0),
        (this.focusX = e[0]),
        (this.focusY = e[2]),
        (this.leadX = this.leadY = 0),
        (this._groundH = L(this.targetX, this.targetY)));
    }
    shake(e) {
      this.shakeAmt = Math.min(1.6, this.shakeAmt + Math.max(0, e));
    }
    reset() {
      ((this._lastPlayerId = -2),
        (this.cine = null),
        (this.nexusLean = 0),
        (this.dead = 0),
        (this.shakeAmt = 0),
        (this._wasAlive = !0),
        (this._deathSeen = !1),
        (this.killerId = -1),
        (this.yaw = 0),
        (this.pitch = V.pitch),
        (this.distance = V.distance));
    }
    track(e) {
      let r = e.world;
      if (!r) return;
      e.playerId !== this._lastPlayerId &&
        ((this._lastPlayerId = e.playerId),
        (this._snapNext = !0),
        (this.cine = null),
        (this.dead = 0),
        (this._wasAlive = !0),
        (this._deathSeen = !1));
      let i = r.units.get(e.playerId);
      this._world = r;
      let a = e.events;
      if (a)
        for (let t = 0; t < a.length; t++) {
          let n = a[t];
          n.type === o.DEATH &&
            n.id === e.playerId &&
            ((this.deathX = n.x),
            (this.deathY = n.y),
            (this.killerId = n.killer),
            (this._deathSeen = !0));
        }
      if (r.winner !== null && r.winner !== void 0 && !this.cine) {
        let e = null,
          n = r.structures;
        for (let i = 0; i < n.length; i++) {
          let a = n[i];
          if (a.kind === t.NEXUS && a.team !== r.winner) {
            e = a;
            break;
          }
        }
        if (!e)
          for (let r = 0; r < n.length; r++) {
            let i = n[r];
            if (i.kind === t.NEXUS && !i.alive) {
              e = i;
              break;
            }
          }
        if (e) {
          let t = 0,
            n = 0,
            i = 0,
            a = r.champions,
            o = B.reach * B.reach;
          if (a)
            for (let s = 0; s < a.length; s++) {
              let c = a[s];
              if (!c.alive || c.team !== r.winner) continue;
              let l = c.x - e.x,
                u = c.y - e.y;
              l * l + u * u > o || ((t += l), (n += u), i++);
            }
          let s = 1,
            c = B.sweepMin;
          if (i && t * t + n * n > 1e-4) {
            let e = Math.atan2(t, n) - this.yaw;
            ((e -= Math.round(e / (2 * Math.PI)) * 2 * Math.PI),
              (s = e >= 0 ? 1 : -1));
            let r = e < 0 ? -e : e;
            c = r < B.sweepMin ? B.sweepMin : r > B.sweepMax ? B.sweepMax : r;
          }
          ((this.cine = {
            t: 0.5,
            fx: this.focusX,
            fy: this.focusY,
            x: e.x,
            y: e.y,
            nx: e.x,
            ny: e.y,
            d0: this.distance,
            p0: this.pitch,
            y0: this.yaw,
            yaw: this.yaw,
            lift: 0.5,
            dir: s,
            sweep: c,
            win: r.winner,
            sx: e.x,
            sy: e.y,
            sd: this.distance,
            fit: 0,
            envD: 0,
            pick: null,
            pickAt: 0,
            pickDur: 1,
            drift: B.drift,
            vis: null,
            visDone: !1,
            visWait: 0,
          }),
            (this.cine.t = 0),
            (this.cine.lift = 0),
            this.shake(0.85));
        }
      }
      if (this.cine || !i) return;
      let s = this.mode === `follow`;
      if (i.alive) {
        if (
          (this._wasAlive || ((this._snapNext = !0), (this._deathSeen = !1)),
          (this._wasAlive = !0),
          !s)
        )
          return;
        let t = i.prevX + (i.x - i.prevX) * e.alpha,
          a = i.prevY + (i.y - i.prevY) * e.alpha,
          o = (i.x - i.prevX) / n,
          c = (i.y - i.prevY) / n;
        i.dash && ((o *= 0.35), (c *= 0.35));
        let l = V,
          u = o * l.lead,
          d = c * l.lead,
          f = Math.sqrt(u * u + d * d);
        (f > l.leadMax && ((u *= l.leadMax / f), (d *= l.leadMax / f)),
          this._snapNext && ((this.leadX = u), (this.leadY = d)));
        let p = 1 - Math.exp(-this._dt * 2.6);
        ((this.leadX += (u - this.leadX) * p),
          (this.leadY += (d - this.leadY) * p));
        let m = +!!this.findDyingNexus(r, i, e.viewerTeam);
        this._snapNext
          ? (this.nexusLean = m)
          : (this.nexusLean +=
              (m - this.nexusLean) * (1 - Math.exp(-this._dt * 3.2)));
        let h = 0,
          g = 0;
        if (this.nexusLean > 0.001) {
          let e = this._nx;
          ((h = (e[0] - t) * 0.38), (g = (e[1] - a) * 0.38));
          let n = Math.sqrt(h * h + g * g);
          (n > 8 && ((h *= 8 / n), (g *= 8 / n)),
            (h *= this.nexusLean),
            (g *= this.nexusLean));
        }
        let _ = t + this.leadX + h - this.focusX,
          v = a + this.leadY + g - this.focusY,
          y = _ * _ + v * v > 196;
        ((this.targetX = t + this.leadX + h),
          (this.targetY = a + this.leadY + g),
          (this._snapNext || y) && this._snapToTarget(),
          (this._snapNext = !1));
      } else if (e.state === `game` || e.state === `end`) {
        if (
          (this._wasAlive &&
            ((this._wasAlive = !1),
            this._deathSeen ||
              ((this.deathX = i.x),
              (this.deathY = i.y),
              (this.killerId = i.lastDamagedBy ?? -1))),
          !s)
        )
          return;
        let t = this.deathX,
          n = this.deathY,
          a = r.units.get(this.killerId);
        if (a && a.alive && a.visible && a.visible[e.viewerTeam]) {
          let e = a.x - t,
            r = a.y - n,
            i = Math.sqrt(e * e + r * r);
          (i > 7 && ((e *= 7 / i), (r *= 7 / i)),
            (t += e * 0.32),
            (n += r * 0.32));
        }
        ((this.leadX *= 0.9),
          (this.leadY *= 0.9),
          (this.targetX = t),
          (this.targetY = n),
          this._snapNext && this._snapToTarget(),
          (this._snapNext = !1));
      }
    }
    get deathMix() {
      return this.dead;
    }
    findDyingNexus(e, n, r) {
      let i = e.structures;
      if (!i) return !1;
      for (let e = 0; e < i.length; e++) {
        let a = i[e];
        if (
          a.kind !== t.NEXUS ||
          a.team === n.team ||
          !a.alive ||
          !(a.hp <= a.maxHp * 0.2) ||
          (a.visible && a.visible[r] === !1)
        )
          continue;
        let o = a.x - n.x,
          s = a.y - n.y;
        if (!(o * o + s * s > 400))
          return ((this._nx[0] = a.x), (this._nx[1] = a.y), !0);
      }
      return !1;
    }
    _springStep() {
      let e = this._r[6],
        t = this._dt,
        n = Math.exp(-e * t),
        r = this._spr,
        i = r[0] - this.targetX,
        a = r[1],
        o = (a + e * i) * t;
      ((r[0] = this.targetX + (i + o) * n),
        (r[1] = (a - e * o) * n),
        (i = r[2] - this.targetY),
        (a = r[3]),
        (o = (a + e * i) * t),
        (r[2] = this.targetY + (i + o) * n),
        (r[3] = (a - e * o) * n));
    }
    update(e, t) {
      ((this._dt = e > 0 ? (e < 0.1 ? e : 0.1) : 0), this._step(t));
    }
    updateFrame(e) {
      let t = e ? e.dt : 0;
      ((this._dt = t > 0 ? (t < 0.1 ? t : 0.1) : 0), this._step(e));
    }
    _step(e) {
      let t = this._dt;
      ((this.t += t), e && this.track(e));
      let n = e && e.world ? e.world.units.get(e.playerId) : null,
        r = !(
          !n ||
          n.alive ||
          !e ||
          (e.state !== `game` && e.state !== `end`) ||
          this.cine
        ),
        i = +!!r;
      ((this.dead += (i - this.dead) * (1 - Math.exp(-t / (r ? 0.35 : 0.15)))),
        Math.abs(i - this.dead) < 1e-4 && (this.dead = i));
      let a = this.distance,
        o = this.pitch,
        s = this.yaw,
        c = this.stiffness,
        l = 0;
      if (this.cine) {
        let e = this.cine;
        e.t += t;
        let n = ke(e.t / 0.35),
          r = Oe(e.t / B.settle);
        if (
          ((o = e.p0 + (B.pitch - e.p0) * r),
          (l = B.lift * r),
          e.pick === null &&
            e.t >= B.orbitStart &&
            (!e.vis || e.visDone || e.t >= B.orbitStart + 0.8) &&
            ((e.pick = e.dir * e.sweep),
            (e.pickAt = e.t),
            (e.pickDur = B.sweepDur),
            (e.visDone = !0)),
          e.pick !== null)
        ) {
          let t = e.t - e.pickAt;
          e.yaw =
            e.y0 +
            e.pick * Oe(t / e.pickDur) +
            e.dir * e.drift * (t > e.pickDur ? t - e.pickDur : 0);
        } else e.yaw = e.y0;
        ((s = e.yaw),
          this._cineSolve(s, o, this._groundH + this.lookHeight + l));
        let i = this._cs,
          u = e.fit ? 1 - Math.exp(-t / B.fitTau) : 1;
        ((e.fit = 1),
          (e.sx += (i[0] - e.sx) * u),
          (e.sy += (i[1] - e.sy) * u),
          (e.sd += (i[2] - e.sd) * u),
          (e.x = e.sx),
          (e.y = e.sy),
          (this.targetX = e.fx + (e.x - e.fx) * n),
          (this.targetY = e.fy + (e.y - e.fy) * n),
          (c = 30));
        let d = e.d0 * (1 + (B.dolly - 1) * r);
        ((a = d + (e.sd - d) * r), a < e.sd && (a = e.sd));
        let f = Math.ceil(a * 2) * 0.5;
        f > e.envD && (e.envD = f);
      } else this.mode === `overview` && ((a *= 2.4), (o = 62 * z));
      (this.dead > 0.001 &&
        ((a *= 1 + 0.1 * this.dead),
        (c = this.stiffness * (1 - 0.72 * this.dead))),
        (a *= this.zoom),
        (this._r[6] = c),
        this._springStep(),
        (this.focusX = this._spr[0]),
        (this.focusY = this._spr[2]));
      let u = this.camera;
      (this.updateProjection(), this.updateShadowEnvelope());
      let d = Math.min(130, Math.max(-10, this.focusX)),
        f = Math.min(130, Math.max(-10, this.focusY)),
        p;
      {
        let e = this.heights,
          t = (d - H) / U,
          n = (f - H) / U;
        (t < 0 ? (t = 0) : t > 287.999 && (t = 287.999),
          n < 0 ? (n = 0) : n > 287.999 && (n = 287.999));
        let r = t | 0,
          i = n | 0,
          a = (r / W) | 0,
          o = (i / W) | 0;
        e.ready[o * G + a] === 0 && e.fill(a, o);
        let s = e.h,
          c = t - r,
          l = n - i,
          u = i * K + r;
        p =
          (s[u] * (1 - c) + s[u + 1] * c) * (1 - l) +
          (s[u + K] * (1 - c) + s[u + K + 1] * c) * l;
      }
      ((p = p < -0.6 ? -0.6 : p > 1.2 ? 1.2 : p),
        (this._groundH += (p - this._groundH) * (1 - Math.exp(-t * 5))));
      let m = this._groundH + this.lookHeight + l,
        h = a * this.aspectScale,
        g = Math.cos(o);
      ((this.viewDist = h),
        u.position.set(
          d + Math.sin(s) * g * h,
          m + Math.sin(o) * h,
          f + Math.cos(s) * g * h,
        ));
      let _ = 0,
        v = 0,
        y = 0,
        b = 0;
      if (this.shakeAmt > 5e-4) {
        let e = this.shakeAmt * this.shakeAmt,
          n = this.t;
        ((_ =
          (Math.sin(n * 37.1) * 0.6 + Math.sin(n * 61.7 + 1.3) * 0.4) *
          0.34 *
          e),
          (v =
            (Math.sin(n * 43.3 + 2.1) * 0.6 + Math.sin(n * 71.9 + 0.4) * 0.4) *
            0.22 *
            e),
          (y =
            (Math.sin(n * 29.9 + 4.2) * 0.6 + Math.sin(n * 53.3 + 2.7) * 0.4) *
            0.34 *
            e),
          (b =
            (Math.sin(n * 23.7 + 0.7) * 0.7 + Math.sin(n * 47.3) * 0.3) *
            0.012 *
            e),
          (this.shakeAmt *= Math.exp(-t * 4.2)),
          this.shakeAmt < 5e-4 && (this.shakeAmt = 0));
      }
      ((u.position.x += _),
        (u.position.y += v),
        (u.position.z += y),
        u.up.set(0, 1, 0));
      {
        let e = this._r;
        ((e[4] = d + _ * 0.5),
          (e[5] = m + v * 0.5),
          (e[6] = f + y * 0.5),
          (e[7] = b));
      }
      (this._aimR(),
        u.updateMatrixWorld(),
        u.matrixWorldInverse.copy(u.matrixWorld).invert());
    }
    setCinePick(e) {
      let t = this.cine;
      return !t || t.pick !== null
        ? !1
        : ((t.pick = e),
          (t.pickAt = t.t),
          (t.pickDur = B.pickDur),
          (t.drift = 0),
          e > 1e-4 ? (t.dir = 1) : e < -1e-4 && (t.dir = -1),
          !0);
    }
    cinePose(e, t) {
      let n = this._groundH + this.lookHeight + B.lift;
      this._cineSolve(e, B.pitch, n);
      let r = this._cs,
        i = r[2] * this.zoom * this.aspectScale,
        a = Math.cos(B.pitch);
      return (
        t.position.set(
          r[0] + Math.sin(e) * a * i,
          n + Math.sin(B.pitch) * i,
          r[1] + Math.cos(e) * a * i,
        ),
        t.up.set(0, 1, 0),
        t.lookAt(r[0], n, r[1]),
        t.updateMatrixWorld(),
        t.matrixWorldInverse.copy(t.matrixWorld).invert(),
        t
      );
    }
    _cineSolve(e, t, n) {
      let r = this.cine,
        i = this._world,
        a = this._cs,
        o = this.camera,
        s = Math.sin(e),
        c = Math.cos(e),
        l = Math.sin(t),
        u = Math.cos(t),
        d = Math.tan(this.baseFov * z * 0.5),
        f = o.aspect || ve,
        p = B.safe,
        m = r.sx,
        h = r.sy,
        g = 0,
        _ = i && i.champions,
        v = B.reach * B.reach,
        y = this.heights,
        b = y.h;
      for (let e = 0; e < 4; e++) {
        g = 0;
        let t = 1e9,
          i = -1e9,
          a = 1e9,
          o = -1e9,
          x = 0,
          S = 0;
        for (let e = 0; e < 2; e++) {
          let C = _ ? _.length + 1 : 1;
          for (let w = 0; w < C; w++) {
            let C, T, E, D;
            if (w === 0)
              ((C = r.nx), (T = r.ny), (E = B.nexusR), (D = B.nexusH));
            else {
              let e = _[w - 1];
              if (!e.alive || e.team !== r.win) continue;
              let t = e.x - r.nx,
                n = e.y - r.ny;
              if (t * t + n * n > v) continue;
              ((C = e.x), (T = e.y), (E = B.heroR), (D = B.heroH));
            }
            let O;
            {
              let e = (C - H) / U,
                t = (T - H) / U;
              (e < 0 ? (e = 0) : e > 287.999 && (e = 287.999),
                t < 0 ? (t = 0) : t > 287.999 && (t = 287.999));
              let n = e | 0,
                r = t | 0,
                i = (n / W) | 0,
                a = (r / W) | 0;
              y.ready[a * G + i] === 0 && y.fill(i, a);
              let o = e - n,
                s = t - r,
                c = r * K + n;
              O =
                (b[c] * (1 - o) + b[c + 1] * o) * (1 - s) +
                (b[c + K] * (1 - o) + b[c + K + 1] * o) * s;
            }
            for (let r = 0; r < 8; r++) {
              let _ = r & 1 ? E : -E,
                v = r & 2 ? E : -E,
                y = C + _ - m,
                b = (r & 4 ? O + D : O) - n,
                k = T + v - h,
                A = y * c - k * s,
                j = -y * s * l + b * u - k * c * l,
                M = y * s * u + b * l + k * c * u;
              if (e === 0) {
                let e = w === 0 && r & 4 ? B.nexusTopSafe : p,
                  t = M + (A < 0 ? -A : A) / (p * d * f),
                  n = M + (j < 0 ? -j : j) / (e * d);
                (t > g && (g = t), n > g && (g = n), (x += M), S++);
              } else {
                let e = g - M;
                if (e < 0.1) continue;
                let n = A / (e * d * f),
                  s =
                    (j / (e * d)) * (w === 0 && r & 4 ? p / B.nexusTopSafe : 1);
                (n < t && (t = n),
                  n > i && (i = n),
                  s < a && (a = s),
                  s > o && (o = s));
              }
            }
          }
        }
        if (e === 3 || !(i > t)) break;
        let C = S ? x / S : 0,
          w = g - C > 1 ? g - C : 1,
          T = (t + i) * 0.5 * w * d * f,
          E = ((a + o) * 0.5 * w * d) / (l > 0.2 ? l : 0.2);
        ((m += T * c - E * s), (h += -T * s - E * c));
      }
      let x = this.aspectScale * this.zoom || 1,
        S = V.distance,
        C = g / x;
      (C < S * B.distMin
        ? (C = S * B.distMin)
        : C > S * B.distMax && (C = S * B.distMax),
        (a[0] = m),
        (a[1] = h),
        (a[2] = C));
    }
    aim(e, t, n, r) {
      let i = this._r;
      ((i[4] = e), (i[5] = t), (i[6] = n), (i[7] = r), this._aimR());
    }
    _aimR() {
      let e = this._r,
        t = e[4],
        n = e[5],
        r = e[6],
        i = e[7],
        a = this.camera.position,
        o = a.x - t,
        s = a.y - n,
        c = a.z - r,
        l = Math.sqrt(o * o + s * s + c * c) || 1;
      ((o /= l), (s /= l), (c /= l));
      let u = c,
        d = -o;
      ((l = Math.sqrt(u * u + d * d)),
        l < 1e-6 && ((u = 1), (d = 0), (l = 1)),
        (u /= l),
        (d /= l));
      let f = s * d,
        p = c * u - o * d,
        m = -s * u,
        h = u,
        g = f,
        _ = o,
        v = p,
        y = s,
        b = d,
        x = m,
        S = c,
        C = h + v + S,
        w,
        T,
        E,
        D;
      if (C > 0) {
        let e = 0.5 / Math.sqrt(C + 1);
        ((D = 0.25 / e),
          (w = (x - y) * e),
          (T = (_ - b) * e),
          (E = (0 - g) * e));
      } else if (h > v && h > S) {
        let e = 2 * Math.sqrt(1 + h - v - S);
        ((D = (x - y) / e),
          (w = 0.25 * e),
          (T = (g + 0) / e),
          (E = (_ + b) / e));
      } else if (v > S) {
        let e = 2 * Math.sqrt(1 - h + v - S);
        ((D = (_ - b) / e),
          (w = (g + 0) / e),
          (T = 0.25 * e),
          (E = (y + x) / e));
      } else {
        let e = 2 * Math.sqrt(1 - h - v + S);
        ((D = (0 - g) / e),
          (w = (_ + b) / e),
          (T = (y + x) / e),
          (E = 0.25 * e));
      }
      if (i) {
        let e = Math.sin(i * 0.5),
          t = Math.cos(i * 0.5),
          n = w * t + T * e,
          r = T * t - w * e,
          a = E * t + D * e,
          o = D * t - E * e;
        ((w = n), (T = r), (E = a), (D = o));
      }
      ((e[0] = w),
        (e[1] = T),
        (e[2] = E),
        (e[3] = D),
        this.camera.quaternion.set(e[0], e[1], e[2], e[3]));
    }
    updateProjection() {
      let e = this.camera,
        t = e.aspect || ve,
        n = Math.min(1.6, Math.max(0.82, Math.sqrt(ve / t)));
      ((this.aspectScale = n),
        e.fov !== this.baseFov &&
          ((e.fov = this.baseFov), e.updateProjectionMatrix()));
    }
    rect() {
      return (
        (!this._rect || !(this._rect.width > 0)) &&
          (this._rect = this.canvas.getBoundingClientRect()),
        this._rect
      );
    }
    screenToGround(e, t, n) {
      let r = this.rect(),
        i = n || { x: 0, y: 0 };
      (this._ndc.set(
        ((e - r.left) / r.width) * 2 - 1,
        -((t - r.top) / r.height) * 2 + 1,
      ),
        this._ray.setFromCamera(this._ndc, this.camera));
      let a = this._ray.ray.origin,
        o = this._ray.ray.direction;
      if (o.y > -1e-4) return ((i.x = this.focusX), (i.y = this.focusY), i);
      let s = a.x,
        c = a.y,
        l = a.z,
        u = o.x,
        d = o.y,
        f = o.z,
        p = this.maxTerrain,
        m = Math.max(0, (p - c) / d),
        h = (-1 - c) / d,
        g = Math.max(28, Math.ceil((h - m) / 0.35)),
        _ = (h - m) / g,
        v = this.heights,
        y = v.h,
        b = v.ready,
        x = this._r;
      ((x[0] = m), (x[1] = 1));
      let S = !1,
        C = -1,
        w = (s + u * m - H) / U,
        T = (l + f * m - H) / U;
      (w < 0 ? (w = 0) : w > 287.999 && (w = 287.999),
        T < 0 ? (T = 0) : T > 287.999 && (T = 287.999));
      for (let e = 1; e <= g; e++) {
        let t = m + _ * e,
          n = c + d * t,
          r = (s + u * t - H) / U,
          i = (l + f * t - H) / U;
        (r < 0 ? (r = 0) : r > 287.999 && (r = 287.999),
          i < 0 ? (i = 0) : i > 287.999 && (i = 287.999));
        let a = w < r ? w | 0 : r | 0,
          o = (w > r ? w | 0 : r | 0) + 1,
          p = T < i ? T | 0 : i | 0,
          h = (T > i ? T | 0 : i | 0) + 1;
        (o > 288 && (o = 288), h > 288 && (h = 288));
        for (let e = (p / W) | 0, t = (h / W) | 0; e <= t; e++)
          for (let t = (a / W) | 0, n = (o / W) | 0; t <= n; t++)
            b[e * G + t] === 0 && v.fill(t, e);
        let g = -1e9;
        for (let e = p; e <= h; e++) {
          let t = e * K;
          for (let e = t + a; e <= t + o; e++) {
            let t = y[e];
            t > g && (g = t);
          }
        }
        if (((w = r), (T = i), n > g + Ee)) {
          ((S = !1), (x[0] = t));
          continue;
        }
        if (!S) {
          let e = x[0];
          if (
            ((x[1] = c + d * e - L(s + u * e, l + f * e)), (S = !0), x[1] <= 0)
          ) {
            C = e;
            break;
          }
        }
        let E = n - L(s + u * t, l + f * t);
        if (x[1] > 0 && E <= 0) {
          C = this.solveCrossing(x[0], t, x[1], E);
          break;
        }
        ((x[0] = t), (x[1] = E));
      }
      return (
        C < 0 && (C = (0 - c) / d),
        (i.x = s + u * C),
        (i.y = l + f * C),
        i
      );
    }
    gap(e) {
      let t = this._ray.ray.origin,
        n = this._ray.ray.direction;
      return t.y + n.y * e - L(t.x + n.x * e, t.z + n.z * e);
    }
    solveCrossing(e, t, n, r) {
      let i = this._r;
      ((i[2] = e), (i[3] = t), (i[4] = n), (i[5] = r));
      let a = 0,
        o = this._ray.ray.origin,
        s = this._ray.ray.direction,
        c = o.x,
        l = o.y,
        u = o.z,
        d = s.x,
        f = s.y,
        p = s.z;
      for (let e = 0; e < 10; e++) {
        let e = (i[3] * i[4] - i[2] * i[5]) / (i[4] - i[5]),
          t = l + f * e - L(c + d * e, u + p * e);
        if (
          (t > 0
            ? ((i[2] = e), (i[4] = t), a === -1 && (i[5] *= 0.5), (a = -1))
            : ((i[3] = e), (i[5] = t), a === 1 && (i[4] *= 0.5), (a = 1)),
          i[3] - i[2] < 1e-5 || (t < 1e-6 && t > -1e-6))
        )
          break;
      }
      return i[5] === 0 ? i[3] : (i[3] * i[4] - i[2] * i[5]) / (i[4] - i[5]);
    }
    worldToScreen(e, t, n, r) {
      let i = r || { x: 0, y: 0, visible: !1 };
      this._v.set(e, t, n).project(this.camera);
      let a = this.rect();
      return (
        (i.x = (this._v.x * 0.5 + 0.5) * a.width + a.left),
        (i.y = (-this._v.y * 0.5 + 0.5) * a.height + a.top),
        (i.visible =
          this._v.z < 1 &&
          this._v.z > -1 &&
          Math.abs(this._v.x) < 1.2 &&
          Math.abs(this._v.y) < 1.2),
        i
      );
    }
  },
  je = Object.freeze({
    tan: 0.075,
    minW: 0.02,
    maxW: 0.4,
    minTexels: 1.25,
    maxTexels: 14,
    slope: 0.85,
    search: 9,
    taps: 28,
    gamma: 1.9,
    jitter: 0.18,
  });
function Me(e, t = 0) {
  let n = [];
  for (let r = 0; r < e; r++) {
    let i = Math.sqrt((r + 0.5) / e),
      a = r * 2.399963229728653 + t;
    n.push([Math.cos(a) * i, Math.sin(a) * i]);
  }
  return n;
}
var Ne = (e, t) =>
    Me(e, t)
      .map(([e, t]) => `vec2( ${e.toFixed(7)}, ${t.toFixed(7)} )`)
      .join(`, `),
  Pe = !1;
function Fe(e = {}) {
  if (Pe) return !0;
  Pe = !0;
  let t = { ...je, ...e },
    n = (e, t = 4) => Number(e).toFixed(t),
    r =
      `float lookSunShadowG = 1.0;
` + P.shadowmap_pars_fragment,
    i = !0,
    a = r.indexOf(`	#else
		float getShadow( sampler2D shadowMap,`),
    o =
      a >= 0
        ? r.indexOf(
            `
	#endif`,
            a,
          )
        : -1;
  a < 0 || o < 0
    ? (console.warn(
        `[look] PCSS patch point not found — using three default basic shadows`,
      ),
      (i = !1))
    : (r =
        r.slice(0, a) +
        `\t#else
		// ---------------------------------------------------------------- LOOK: contact-hardening sun shadows (PCSS)
		float lookIGN( vec2 p ) { return fract( 52.9829189 * fract( dot( p, vec2( 0.06711056, 0.00583715 ) ) ) ); }
		// Vogel discs, unrotated, baked at patch time (r4 c3): vogel(i, n, phi) = rot(phi) · vogel(i, n, 0), so the
		// per-fragment rotation is ONE sin/cos pair and a 2×2 multiply per tap instead of a sin/cos pair per tap
		// (37 per penumbra fragment before). Same sample positions to float precision.
		const vec2 LOOK_VS[ ${t.search} ] = vec2[ ${t.search} ]( ${Ne(t.search, 0)} );
		const vec2 LOOK_VT[ ${t.taps} ] = vec2[ ${t.taps} ]( ${Ne(t.taps, 1.7)} );
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			if ( inFrustum && shadowCoord.z <= 1.0 ) {
				vec2 texel = 1.0 / shadowMapSize;
				float zR = shadowCoord.z;
				float wpt = max( shadowRadius, 1.0e-5 ) * ${n(109, 1)} / shadowMapSize.x;   // world units per shadow texel
				// (env r6, iPad "glitchy while playing") the tap rotation is keyed to the SHADOW MAP (half-texel cells; the
				// shadow camera is snapped to whole texels), so the penumbra dither sticks to the ground instead of sliding
				// under it — screen-keyed noise made every soft shadow edge boil while the camera followed the trainer.
				vec2 lookSq = floor( shadowCoord.xy * shadowMapSize * 2.0 );
				float phi = lookIGN( lookSq ) * 6.2831853;
				mat2 lookRot = mat2( cos( phi ), sin( phi ), - sin( phi ), cos( phi ) );   // column-major: rot(phi)
					// a second hash on the SWAPPED coordinates: decorrelated from phi, so the angle and the radius of the tap
					// set do not vary together along a scanline (which is what made the lattice visible).
					float jit = mix( ${n(1 - t.jitter)}, 1.0, lookIGN( lookSq.yx + 17.0 ) );
				// 1) blocker search over the WIDEST penumbra we can produce, so the lit side of a wide soft edge still
				//    finds its caster (a centre-only search hardens one side of every penumbra).
				float searchT = min( ${n(t.maxW)} / wpt, ${n(t.maxTexels, 1)} );
				float sumB = 0.0, nB = 0.0;
				for ( int k = 0; k < ${t.search}; k++ ) {
					float d = texture2D( shadowMap, shadowCoord.xy + ( lookRot * LOOK_VS[ k ] ) * searchT * texel ).r;
					#ifdef USE_REVERSED_DEPTH_BUFFER
						if ( d > zR ) { sumB += d; nB += 1.0; }
					#else
						if ( d < zR ) { sumB += d; nB += 1.0; }
					#endif
				}
				if ( nB < 0.5 ) return 1.0;                       // nothing between this point and the sun anywhere in reach (leaves lookSunShadowG at 1)
				// 2) penumbra width from the mean blocker distance (linear ortho depth → world units)
				float dzW = abs( zR - sumB / nB ) * ${n(109, 1)};
				// …clamped in world units, then in TEXELS on both ends: below ~1 texel the Vogel taps all land in the
				// same nearest-sampled depth texel and the edge quantises into stair-steps.
				float R = clamp( clamp( dzW * ${n(t.tan)}, ${n(t.minW)}, ${n(t.maxW)} ) / wpt, ${n(t.minTexels)}, ${n(t.maxTexels, 1)} );
				// 3) slope-scaled depth bias: the depth a flat receiver can legitimately change over the filter footprint
				//    grows with R, so the bias has to as well (tight contacts keep the small bias, wide blobs pay for it)
				float zb = R * wpt * ${n(t.slope)} / ${n(109, 1)};
				float w = max( zb * 0.8, 1.0e-6 );                // soft compare: each tap is a ramp, not a binary step
				float s = 0.0;
				for ( int k = 0; k < ${t.taps}; k++ ) {
					float d = texture2D( shadowMap, shadowCoord.xy + ( lookRot * LOOK_VT[ k ] ) * ( R * jit ) * texel ).r;
					#ifdef USE_REVERSED_DEPTH_BUFFER
						s += clamp( ( ( zR - zb ) - d ) / w + 0.5, 0.0, 1.0 );
					#else
						s += clamp( ( d - ( zR + zb ) ) / w + 0.5, 0.0, 1.0 );
					#endif
				}
				shadow = pow( s * ${n(1 / t.taps, 6)}, ${n(t.gamma, 3)} );
			}
			float lookRes = mix( 1.0, shadow, shadowIntensity );
			lookSunShadowG = min( lookSunShadowG, lookRes );
			return lookRes;
		}` +
        r.slice(o));
  let s = /float radius = shadowRadius \* texelSize\.x;[\s\S]*?\) \* 0\.2;/;
  return (
    s.test(r) &&
      (r = r.replace(
        s,
        `
				vec2 dd = texelSize * clamp( shadowRadius, 0.6, 3.0 );
				vec3 sc = shadowCoord.xyz;
				shadow =
					texture( shadowMap, sc ) * 0.25 +
					( texture( shadowMap, vec3( sc.xy + vec2( dd.x, 0.0 ), sc.z ) ) +
					  texture( shadowMap, vec3( sc.xy - vec2( dd.x, 0.0 ), sc.z ) ) +
					  texture( shadowMap, vec3( sc.xy + vec2( 0.0, dd.y ), sc.z ) ) +
					  texture( shadowMap, vec3( sc.xy - vec2( 0.0, dd.y ), sc.z ) ) ) * 0.125 +
					( texture( shadowMap, vec3( sc.xy + dd, sc.z ) ) +
					  texture( shadowMap, vec3( sc.xy - dd, sc.z ) ) +
					  texture( shadowMap, vec3( sc.xy + vec2( dd.x, - dd.y ), sc.z ) ) +
					  texture( shadowMap, vec3( sc.xy + vec2( - dd.x, dd.y ), sc.z ) ) ) * 0.0625;`,
      )),
    (P.shadowmap_pars_fragment = r),
    i
  );
}
var Ie = !1;
function Le() {
  return Ie
    ? !0
    : ((Ie = !0),
      (P.lights_fragment_end += `
#if defined( LOOK_RIM ) && ! defined( TONE_MAPPING ) && ! defined( LOOK_NO_CHAR_KEY )
	reflectedLight.directDiffuse += lookCharKeyView( geometryNormal, material.diffuseColor );
#endif
`),
      !0);
}
var Re = !1;
function ze(e = 0.18, t = 0.78) {
  if (Re) return !0;
  Re = !0;
  let n = Math.min(1, Math.max(0, Number(e))).toFixed(3),
    r = Math.min(1, Math.max(0, Number(t))).toFixed(3);
  return (
    (P.lights_fragment_end =
      `
#if defined( RE_IndirectDiffuse ) && defined( USE_SHADOWMAP ) && ! defined( TONE_MAPPING ) && ! defined( LOOK_NO_AMBIENT_SHADOW )
	{
		float lookUp = clamp( dot( geometryNormal, normalize( ( viewMatrix * vec4( 0.0, 1.0, 0.0, 0.0 ) ).xyz ) ), 0.0, 1.0 );
		float lookAmbSh = mix( 1.0, mix( ${r}, ${n}, lookUp ), 1.0 - lookSunShadowG );
		irradiance *= lookAmbSh;
		iblIrradiance *= lookAmbSh;
	}
#endif
` + P.lights_fragment_end),
    !0
  );
}
// CEL-BANDED KEY LIGHT (env round 2, pixel-art look): the sun's diffuse term is quantised into lit / half / shade bands
// (shadow map included, so PCSS penumbrae become crisp readable cast-shadow shapes) and the shade side of every surface
// gets a cool violet hue shift in its ambient. Only the SUN term changes; fill, bounce and IBL stay smooth.
var lookCel0 = !1;
function lookCelPatch() {
  if (lookCel0) return !0;
  lookCel0 = !0;
  P.lights_fragment_end =
    `
#if defined( RE_Direct ) && defined( RE_IndirectDiffuse ) && NUM_DIR_LIGHTS > 0 && ! defined( TONE_MAPPING ) && ! defined( LOOK_NO_CEL )
	{
		float celNL = clamp( dot( geometryNormal, directionalLights[ 0 ].direction ), 0.0, 1.0 );
		float celSh = 1.0;
		#ifdef USE_SHADOWMAP
		celSh = lookSunShadowG;
		#endif
		float celLit = celNL * celSh;
		float celB = mix( mix( 0.0, 0.52, smoothstep( 0.05, 0.09, celLit ) ), 1.0, smoothstep( 0.40, 0.46, celLit ) );
		reflectedLight.directDiffuse = max( reflectedLight.directDiffuse + ( celB - celLit ) * material.diffuseColor * directionalLights[ 0 ].color * RECIPROCAL_PI, vec3( 0.0 ) );
		vec3 celTint = mix( vec3( 0.78, 0.84, 1.22 ), vec3( 1.0 ), celB );
		irradiance *= celTint;
		iblIrradiance *= celTint;
	}
#endif
` + P.lights_fragment_end;
  return !0;
}
var Be = !1;
function Ve(e = 2.3) {
  if (Be) return !0;
  Be = !0;
  let t = Math.max(0.1, Number(e) || 2.3).toFixed(3);
  return (
    (P.lights_fragment_end += `
#if ! defined( TONE_MAPPING ) && ! defined( LOOK_NO_SPEC_LIMIT )
	{
		float lookSpecPeak = max( max( reflectedLight.directSpecular.r, reflectedLight.directSpecular.g ), reflectedLight.directSpecular.b );
		if ( lookSpecPeak > ${t} ) reflectedLight.directSpecular *= ${t} / lookSpecPeak;
	}
#endif
`),
    !0
  );
}
var q = Object.freeze({
  sunDir: new O(-0.857, 0.74, -0.514).normalize(),
  // Gen-5 sunny route rig: warm golden key, clear cool-sky fill, green grass bounce from below
  sunColor: new b().setRGB(1, 0.86, 0.66),
  sunIntensity: 6.2,
  skyColor: new b().setRGB(0.6, 0.78, 1),
  groundColor: new b().setRGB(0.42, 0.52, 0.28),
  hemiIntensity: 0.4,
  bounceDir: new O(0.2, 0.25, 0.95).normalize(),
  bounceColor: new b().setRGB(0.78, 0.88, 1),
  bounceIntensity: 0.3,
  envIntensity: 0.2,
  fogColor: new b().setRGB(0.55, 0.7, 0.82),
  charKeyColor: new b().setRGB(1, 0.9, 0.76),
  charKeyIntensity: 5.15,
  rimColor: new b().setRGB(1, 0.88, 0.7),
  rimStrength: 1.6,
});
function He(e) {
  let t = new I(),
    n = new v({
      side: 1,
      depthWrite: !1,
      uniforms: { uSun: { value: e.clone() } },
      vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `
      uniform vec3 uSun; varying vec3 vDir;
      void main(){
        vec3 d = normalize(vDir); float y = d.y;
        vec3 zenith = vec3(0.36, 0.56, 0.86);            // clear Gen-5 sky blue: cool ambient against the warm key
        vec3 horizon = vec3(0.92, 0.94, 0.90);
        vec3 ground = vec3(0.24, 0.40, 0.14);           // bright meadow grass bounce
        vec3 groundFar = vec3(0.50, 0.47, 0.34);
        vec3 sky = mix(horizon, zenith, pow(clamp(y, 0.0, 1.0), 0.55));
        vec3 gnd = mix(groundFar, ground, smoothstep(0.0, 0.35, -y));
        vec3 c = y >= 0.0 ? sky : gnd;
        c = mix(c, mix(horizon, groundFar, 0.5), exp(-abs(y) * 18.0) * 0.6); // soft horizon band
        float s = max(dot(d, normalize(uSun)), 0.0);
        c += vec3(1.0, 0.86, 0.62) * (pow(s, 280.0) * 22.0 + pow(s, 24.0) * 0.9 + pow(s, 4.0) * 0.12) * step(-0.05, y);
        gl_FragColor = vec4(c, 1.0);
      }`,
    });
  return (t.add(new N(new C(40, 48, 24), n)), t);
}
var Ue = [-1, 1, 1, -1],
  We = [-1, -1, 1, 1],
  Ge = class {
    constructor({ scene: e, renderer: t, quality: n }) {
      ((this.scene = e),
        (this.renderer = t),
        (this.hemi = new D(q.skyColor, q.groundColor, q.hemiIntensity)),
        (this.hemi.name = `look.hemi`),
        (this.sun = new S(q.sunColor, q.sunIntensity)),
        (this.sun.name = `look.sun`),
        (this.sun.castShadow = !0));
      let r = this.sun.shadow;
      ((r.bias = -8e-5),
        (r.normalBias = 0.022),
        (r.intensity = 1),
        (r.radius = 0.4),
        (r.camera.near = 1),
        (r.camera.far = 110),
        (this.bounce = new S(q.bounceColor, q.bounceIntensity)),
        (this.bounce.name = `look.bounce`),
        (this.bounce.castShadow = !1),
        e.add(
          this.hemi,
          this.sun,
          this.sun.target,
          this.bounce,
          this.bounce.target,
        ),
        (this.sunDir = q.sunDir.clone()),
        (this.bounceDir = q.bounceDir.clone()),
        (this.shadowDistance = 70),
        (this.envTexture = null),
        this.buildEnvironment(),
        (this._corners = [new O(), new O(), new O(), new O()]),
        (this._v = new O()),
        (this._c = new O()),
        (this._ray = new u()),
        (this._inv = new re()),
        (this._right = new O()),
        (this._up = new O()),
        (this._fwd = new O()),
        (this.fitRadius = 0.5),
        (this.groundY = 0.5),
        (this.radiusHint = 0.5),
        (this.fitRadius = 0),
        (this.groundY = 0),
        (this.radiusHint = 0),
        (this._s = new Float64Array(4)),
        (this._k = new Float64Array(8)),
        this.setQuality(n));
    }
    buildEnvironment() {
      try {
        let e = new ee(this.renderer),
          t = He(this.sunDir),
          n = e.fromScene(t, 0.035, 0.1, 100);
        ((this.envTexture = n.texture),
          (this._envRT = n),
          (this.scene.environment = this.envTexture),
          (this.scene.environmentIntensity = q.envIntensity),
          t.traverse((e) => {
            (e.geometry && e.geometry.dispose(),
              e.material && e.material.dispose());
          }),
          e.dispose());
      } catch (e) {
        console.warn(`[look] PMREM environment failed`, e);
      }
    }
    setQuality(e) {
      let t = e === `low` ? 1024 : 2048,
        n = this.sun.shadow;
      n.mapSize.x !== t &&
        (n.mapSize.set(t, t), (n.map &&= (n.map.dispose(), null)));
    }
    fit(e) {
      let t = this.groundY,
        n = this.radiusHint,
        r = this._k,
        i = e.projectionMatrixInverse.elements,
        a = e.matrixWorld.elements,
        o = a[12],
        s = a[13],
        c = a[14],
        l = 0,
        u = 0;
      for (let e = 0; e < 4; e++) {
        let n = Ue[e],
          d = We[e],
          f = i[3] * n + i[7] * d + i[11] * 0.5 + i[15],
          p = (i[0] * n + i[4] * d + i[8] * 0.5 + i[12]) / f,
          m = (i[1] * n + i[5] * d + i[9] * 0.5 + i[13]) / f,
          h = (i[2] * n + i[6] * d + i[10] * 0.5 + i[14]) / f,
          g = a[0] * p + a[4] * m + a[8] * h + a[12] - o,
          _ = a[1] * p + a[5] * m + a[9] * h + a[13] - s,
          v = a[2] * p + a[6] * m + a[10] * h + a[14] - c,
          y = Math.sqrt(g * g + _ * _ + v * v) || 1;
        ((g /= y), (_ /= y), (v /= y));
        let b = _ < -0.02 ? (t - s) / _ : 60;
        b > 60 && (b = 60);
        let x = o + g * b,
          S = c + v * b;
        ((r[e * 2] = x), (r[e * 2 + 1] = S), (l += x), (u += S));
      }
      ((l /= 4), (u /= 4));
      let d = n;
      if (!(d > 0)) {
        d = 0;
        for (let e = 0; e < 4; e++) {
          let t = r[e * 2] - l,
            n = r[e * 2 + 1] - u,
            i = Math.sqrt(t * t + n * n);
          i > d && (d = i);
        }
        d = Math.ceil((d + 3.5) / 2) * 2;
      }
      let f = this.sun.shadow,
        p = f.camera,
        m = (2 * d) / f.mapSize.x,
        h = this.sunDir,
        g = -h.x,
        _ = -h.y,
        v = -h.z,
        y = v,
        b = -g,
        x = Math.sqrt(y * y + b * b);
      (x < 1e-6 && ((y = 1), (b = 0), (x = 1)), (y /= x), (b /= x));
      let S = _ * b,
        C = v * y - g * b,
        w = -_ * y,
        T = t,
        E = Math.round((l * y + u * b) / m) * m,
        D = Math.round((l * S + T * C + u * w) / m) * m,
        O = l * g + T * _ + u * v,
        k = y * E + S * D + g * O,
        A = C * D + _ * O,
        j = b * E + w * D + v * O,
        M = this.sun.target.position;
      ((M.x = k), (M.y = A), (M.z = j));
      let N = this.shadowDistance,
        P = this.sun.position;
      ((P.x = k + h.x * N),
        (P.y = A + h.y * N),
        (P.z = j + h.z * N),
        this.sun.target.updateMatrixWorld(),
        this.sun.updateMatrixWorld(),
        d !== this.fitRadius &&
          ((p.left = -d),
          (p.right = d),
          (p.top = d),
          (p.bottom = -d),
          (p.near = 1),
          (p.far = 110),
          p.updateProjectionMatrix(),
          (this.fitRadius = d),
          (f.radius = (2 * d) / 109)));
      let ee = this.bounceDir,
        F = this.bounce.position;
      ((F.x = k + ee.x * 50), (F.y = A + ee.y * 50), (F.z = j + ee.z * 50));
      let I = this.bounce.target.position;
      ((I.x = k),
        (I.y = A),
        (I.z = j),
        this.bounce.target.updateMatrixWorld(),
        this.bounce.updateMatrixWorld());
    }
    dispose() {
      (this.scene.remove(
        this.hemi,
        this.sun,
        this.sun.target,
        this.bounce,
        this.bounce.target,
      ),
        this.scene.environment === this.envTexture &&
          (this.scene.environment = null),
        this._envRT && this._envRT.dispose(),
        this.sun.dispose(),
        this.bounce.dispose(),
        this.hemi.dispose());
    }
  },
  Ke =
    `
precision highp float; precision highp int; precision highp sampler2D;
in vec2 vUv; out vec4 outColor;
uniform sampler2D tSrc;
` +
    _e +
    `
void main() {
  vec4 c = texture(tSrc, vUv);
  bool bad = lookBad(c.rgb);
  bool neg = !bad && min(c.r, min(c.g, c.b)) < -1e-4;
  bool huge = !bad && max(c.r, max(c.g, c.b)) > 1.0e3;
  outColor = vec4(bad ? 1.0 : 0.0, neg ? 1.0 : 0.0, huge ? 1.0 : 0.0, 1.0);
}`,
  J = 31,
  qe = class {
    constructor(e) {
      ((this.renderer = e),
        (this.mat = new w({
          glslVersion: g,
          vertexShader: fe,
          fragmentShader: Ke,
          uniforms: { tSrc: { value: null } },
          depthTest: !1,
          depthWrite: !1,
        })),
        (this.quad = new de(this.mat)),
        (this.flagRT = null),
        (this.buf = null),
        (this.warned = new Set()));
    }
    count(e, t, n) {
      let r = this.renderer;
      (!this.flagRT || this.flagRT.width !== t || this.flagRT.height !== n) &&
        (this.flagRT && this.flagRT.dispose(),
        (this.flagRT = new k(t, n, {
          depthBuffer: !1,
          minFilter: F,
          magFilter: F,
        })),
        (this.buf = new Uint8Array(t * n * 4)));
      let i = r.getRenderTarget();
      ((this.mat.uniforms.tSrc.value = e),
        r.setRenderTarget(this.flagRT),
        this.quad.render(r),
        r.readRenderTargetPixels(this.flagRT, 0, 0, t, n, this.buf),
        r.setRenderTarget(i));
      let a = this.buf,
        o = 0,
        s = 0,
        c = 0,
        l = 1e9,
        u = 1e9,
        d = -1,
        f = -1;
      for (let e = 0, r = t * n; e < r; e++) {
        let r = a[e * 4] > 127,
          i = a[e * 4 + 1] > 127,
          p = a[e * 4 + 2] > 127;
        if (!r && !i && !p) continue;
        (r && o++, i && s++, p && c++);
        let m = e % t,
          h = n - 1 - ((e / t) | 0);
        (m < l && (l = m),
          h < u && (u = h),
          m > d && (d = m),
          h > f && (f = h));
      }
      return { nan: o, neg: s, huge: c, bbox: d >= 0 ? [l, u, d, f] : null };
    }
    check(
      e,
      { blame: t = !1, maxObjects: n = 600, scale: r = 0.5, warn: i = !0 } = {},
    ) {
      let a = e.sceneRT;
      if (!a) return null;
      let o = {
        width: a.width,
        height: a.height,
        ...this.count(a.texture, a.width, a.height),
      };
      if (
        ((o.ok = o.nan === 0),
        t && (o.nan > 0 || o.neg > 0) && (o.culprits = this.blame(e, n, r)),
        i && (o.nan > 0 || o.neg > 8))
      ) {
        let e = `${o.nan}:${o.neg}:${(o.culprits || []).map((e) => e.path).join(`|`)}`;
        this.warned.has(e) ||
          (this.warned.add(e),
          console.warn(
            `[look] HDR scene target has ${o.nan} NaN/Inf and ${o.neg} negative pixels (bbox ${o.bbox}). The pipeline masks them, but the material is broken.` +
              (o.culprits
                ? ` Culprits: ` +
                  o.culprits
                    .slice(0, 6)
                    .map(
                      (e) =>
                        `${e.path} [${e.material}] nan=${e.nan} neg=${e.neg}`,
                    )
                    .join(` · `)
                : ` Run pipeline.checkHDR({ blame: true }) to find the object.`),
          ));
      }
      return o;
    }
    blame(e, t, n) {
      let r = this.renderer,
        i = e.scene,
        a = e.camera,
        o = Math.max(64, Math.round(e.sceneRT.width * n)),
        s = Math.max(36, Math.round(e.sceneRT.height * n)),
        c = new k(o, s, {
          type: m,
          depthBuffer: !0,
          minFilter: F,
          magFilter: F,
        }),
        l = new f().setFromProjectionMatrix(
          new re().multiplyMatrices(a.projectionMatrix, a.matrixWorldInverse),
        ),
        u = [],
        d = [];
      i.traverseVisible((e) => {
        if (e.isLight) {
          d.push(e);
          return;
        }
        (e.isMesh || e.isPoints || e.isLine || e.isSprite) &&
          (!e.frustumCulled ||
            e.isSkinnedMesh ||
            e.isInstancedMesh ||
            !e.geometry ||
            l.intersectsObject(e)) &&
          u.push(e);
      });
      let p = u.map((e) => e.layers.mask),
        h = d.map((e) => e.layers.mask),
        g = a.layers.mask,
        _ = r.shadowMap.autoUpdate,
        v = r.getRenderTarget(),
        y = [];
      try {
        ((r.shadowMap.autoUpdate = !1), a.layers.set(J));
        for (let e of d) e.layers.enable(J);
        for (let e of u) e.layers.disable(J);
        for (let e = 0; e < u.length && e < t; e++) {
          let t = u[e];
          (t.layers.enable(J), r.setRenderTarget(c), r.clear(!0, !0, !1));
          try {
            r.render(i, a);
          } catch (e) {
            (y.push({
              path: Je(t),
              material: Ye(t),
              nan: -1,
              neg: 0,
              error: String(e).slice(0, 160),
            }),
              t.layers.disable(J));
            continue;
          }
          t.layers.disable(J);
          let n = this.count(c.texture, o, s);
          (n.nan > 0 || n.neg > 0) &&
            y.push({
              path: Je(t),
              material: Ye(t),
              nan: n.nan,
              neg: n.neg,
              bbox: n.bbox,
            });
        }
      } finally {
        for (let e = 0; e < u.length; e++) u[e].layers.mask = p[e];
        for (let e = 0; e < d.length; e++) d[e].layers.mask = h[e];
        ((a.layers.mask = g),
          (r.shadowMap.autoUpdate = _),
          r.setRenderTarget(v),
          c.dispose(),
          r.info.reset());
      }
      return y.sort((e, t) => t.nan - e.nan);
    }
    dispose() {
      (this.mat.dispose(),
        this.quad.dispose(),
        this.flagRT && this.flagRT.dispose());
    }
  };
function Je(e) {
  let t = [];
  for (let n = e; n && !n.isScene; n = n.parent) t.push(n.name || n.type);
  return t.reverse().join(`/`);
}
function Ye(e) {
  let t = Array.isArray(e.material) ? e.material[0] : e.material;
  return t ? (t.name ? t.name + `:` : ``) + t.type : `?`;
}
var Xe = 1.7,
  Ze = 0.45,
  Qe = 31,
  Y = 63,
  X = 8,
  $e = 1.7,
  et = 0.45,
  tt = 0.09,
  nt = 0.42,
  rt = (t) =>
    e[t] || (M && M.sight && M.sight[t]) || { nexus: 11, inhibitor: 8 }[t] || 0,
  it = rt(t.CHAMPION),
  at = rt(t.MINION),
  ot = rt(t.WARD),
  st = (M && M.sight && M.sight.fountain) || 13,
  ct = (ne && ne.shrine && ne.shrine.vision) || 8;
function lt(e, t, n) {
  let r = 0,
    i = e.length,
    a = n[0],
    o = n[1];
  for (let n = 0; n < i; n++) {
    let i = e[n] - t[n];
    i > 0.002
      ? ((t[n] += i * a), (r = 1))
      : i < -0.002 && ((t[n] += i * o), (r = 1));
  }
  return r;
}
function ut(e, t) {
  let n = e.length;
  for (let r = 0; r < n; r++) t[r] = (e[r] * 255 + 0.5) | 0;
}
var dt = class {
    constructor(e = 192, t = 0) {
      ((this.size = e),
        (this.margin = t),
        (this.worldMin = -t),
        (this.worldSize = 120 + t * 2),
        (this.cell = this.worldSize / e));
      let n = e * e;
      ((this.target = new Float32Array(n)),
        (this.display = new Float32Array(n)),
        (this.data = new Uint8Array(n)),
        (this.brushId = new Int16Array(n).fill(-1)),
        (this.brushCov = new Float32Array(n)),
        (this.block = new Float32Array(n)));
      for (let t = 0; t < e; t++)
        for (let n = 0; n < e; n++) {
          let i = this.worldMin + (n + 0.5) * this.cell,
            o = this.worldMin + (t + 0.5) * this.cell,
            s = -1,
            c = 0;
          for (let e of a) {
            let t = Math.hypot(i - e.x, o - e.y),
              n = Math.min(1, Math.max(0, (e.r + et - t) / (et * 2)));
            n > c && ((c = n), (s = e.id));
          }
          ((this.brushId[t * e + n] = s), (this.brushCov[t * e + n] = c));
          let l = r(i, o),
            u = (Ze * 0.5 - l) / Ze;
          ((u = u < 0 ? 0 : u > 1 ? 1 : u),
            (this.block[t * e + n] = u * u * (3 - 2 * u)));
        }
      ((this.texture = new y(this.data, e, e, x, _)),
        (this.texture.minFilter = j),
        (this.texture.magFilter = j),
        (this.texture.wrapS = this.texture.wrapT = c),
        (this.texture.generateMipmaps = !1),
        (this.texture.colorSpace = ``),
        (this.texture.unpackAlignment = 1),
        (this.texture.flipY = !1),
        (this.texture.name = `look.vision`),
        (this.texture.needsUpdate = !0),
        (this.st = new E(
          1 / this.worldSize,
          1 / this.worldSize,
          -this.worldMin / this.worldSize,
          -this.worldMin / this.worldSize,
        )),
        (this.accum = 1),
        (this.interval = 0.1),
        (this.snapNext = !0),
        (this.team = -1),
        (this._fountainTeam = -99),
        (this._fountain = null),
        (this.wallLOS = !0),
        (this.los = new Float32Array(3969)),
        (this._losK = 0),
        (this.blk = Math.ceil(e / X)),
        (this.blockAny = new Uint8Array(this.blk * this.blk)));
      for (let t = 0; t < e; t++)
        for (let n = 0; n < e; n++)
          this.block[t * e + n] > 0.002 &&
            (this.blockAny[((t / X) | 0) * this.blk + ((n / X) | 0)] = 1);
      ((this._s = new Float64Array(3)),
        (this._k = new Float64Array(2)),
        (this.dt = 0.5),
        (this.dt = 0),
        (this.settled = !1),
        (this._static = null),
        (this._structSig = 0),
        (this._staticLOS = !0));
    }
    reset() {
      ((this.snapNext = !0), (this.accum = 1), (this._structSig = 0));
    }
    visibilityAt(e, t) {
      let n = Math.floor((e - this.worldMin) / this.cell),
        r = Math.floor((t - this.worldMin) / this.cell);
      return n < 0 || r < 0 || n >= this.size || r >= this.size
        ? 0
        : this.display[r * this.size + n];
    }
    stamp(e, t, n, r) {
      let i = this._s;
      ((i[0] = e), (i[1] = t), (i[2] = n), this._stamp(r));
    }
    _stamp(e) {
      let t = this._s,
        n = t[0],
        r = t[1],
        i = t[2],
        a = this.size,
        o = this.cell,
        s = this.target,
        c = this.brushId,
        l = this.brushCov,
        u = i + Xe * 0.5,
        d = Math.max(0, Math.floor((n - u - this.worldMin) / o)),
        f = Math.min(a - 1, Math.ceil((n + u - this.worldMin) / o)),
        p = Math.max(0, Math.floor((r - u - this.worldMin) / o)),
        m = Math.min(a - 1, Math.ceil((r + u - this.worldMin) / o)),
        h = 1 / Xe,
        g = u * u,
        _ = Math.floor((n - this.worldMin) / o),
        v = Math.floor((r - this.worldMin) / o),
        y = 0;
      if (this.wallLOS && _ >= 0 && v >= 0 && _ < a && v < a) {
        let e = this.blockAny,
          t = this.blk,
          n = (d / X) | 0,
          r = (f / X) | 0,
          i = (p / X) | 0,
          a = (m / X) | 0;
        for (let o = i; o <= a && !y; o++)
          for (let i = n; i <= r; i++)
            if (e[o * t + i]) {
              y = 1;
              break;
            }
      }
      let b = y
        ? this.buildLOS(_, v, Math.min(Qe, Math.ceil(u / o) + 1))
        : null;
      for (let t = p; t <= m; t++) {
        let i = this.worldMin + (t + 0.5) * o - r,
          p = i * i,
          m = t * a,
          y = t - v;
        for (let t = d; t <= f; t++) {
          let r = this.worldMin + (t + 0.5) * o - n,
            i = r * r + p;
          if (i > g) continue;
          let a = Math.sqrt(i),
            d = (u - a) * h;
          (d > 1 && (d = 1), (d = d * d * (3 - 2 * d)));
          let f = m + t,
            v = c[f];
          if ((v >= 0 && v !== e && a > 1.2 && (d *= 1 - l[f]), b !== null)) {
            let e = t - _;
            ((e < 0 ? -e : e) > (y < 0 ? -y : y)
              ? e < 0
                ? -e
                : e
              : y < 0
                ? -y
                : y) <= this._losK && (d *= b[(y + Qe) * Y + e + Qe]);
          }
          d > s[f] && (s[f] = d);
        }
      }
    }
    buildLOS(e, t, n) {
      let r = this.los,
        i = this.block,
        a = this.size,
        o = 1984;
      ((this._losK = n), (r[o] = 1));
      for (let e = -1; e <= 1; e++)
        for (let t = -1; t <= 1; t++) (t || e) && (r[o + e * Y + t] = 1);
      for (let s = 2; s <= n; s++) {
        let n = (s - 1) / s;
        for (let c = 0; c < 4; c++) {
          let l = c & 1 ? s : -s;
          for (let u = -s; u <= s; u++) {
            let d = c < 2 ? u : l,
              f = c < 2 ? l : u;
            if (c >= 2 && (f === s || f === -s)) continue;
            let p = (d < 0 ? -d : d) >= (f < 0 ? -f : f),
              m,
              h,
              g;
            if (p) {
              m = d > 0 ? d - 1 : d + 1;
              let e = f * n,
                t = Math.floor(e);
              ((g = e - t), (h = t));
            } else {
              h = f > 0 ? f - 1 : f + 1;
              let e = d * n,
                t = Math.floor(e);
              ((g = e - t), (m = t));
            }
            let _ = o + h * Y + m,
              v = p ? _ + Y : _ + 1,
              y = r[_],
              b = r[v],
              x;
            if (y <= 0 && b <= 0) x = 0;
            else {
              let n = e + m,
                r = t + h,
                o = p ? n : n + 1,
                s = p ? r + 1 : r,
                c = n >= 0 && r >= 0 && n < a && r < a ? i[r * a + n] : 0,
                l = o >= 0 && s >= 0 && o < a && s < a ? i[s * a + o] : 0;
              ((x = (y + (b - y) * g) * (1 - (c + (l - c) * g))),
                x < 0.002 && (x = 0));
            }
            r[o + f * Y + d] = x;
          }
        }
      }
      return r;
    }
    rebuild(e, n) {
      if (
        (this.buildStatic(e, n), this.target.set(this._static), e.champions)
      ) {
        let t = e.champions;
        for (let e = 0; e < t.length; e++) this.stampChampion(t[e], n);
      }
      let r = e.unitList;
      for (let e = 0; e < r.length; e++) {
        let i = r[e],
          a = i.kind;
        a === t.MINION
          ? this.stampMinion(i, n)
          : a === t.WARD && this.stampWard(i, n);
      }
      let i = e.shrines;
      if (i) for (let e = 0; e < i.length; e++) this.stampShrine(i[e], n);
      if (this.wallLOS) {
        let t = e.champions;
        if (t) for (let e = 0; e < t.length; e++) this.revealUnit(t[e], n);
      }
    }
    revealUnit(e, t) {
      if (!e.alive || e.team === t || !e.visible || !e.visible[t]) return;
      let n = this._s;
      ((n[0] = e.x), (n[1] = e.y), (n[2] = $e));
      let r = this.wallLOS;
      ((this.wallLOS = !1), this._stamp(-2), (this.wallLOS = r));
    }
    stampChampion(e, t) {
      if (!e.alive || e.team !== t) return;
      let n = this._s;
      ((n[0] = e.x), (n[1] = e.y), (n[2] = it), this._stamp(e.inBrush ?? -1));
    }
    stampMinion(e, t) {
      if (!e.alive || e.team !== t) return;
      let n = this._s;
      ((n[0] = e.x), (n[1] = e.y), (n[2] = at), this._stamp(e.inBrush ?? -1));
    }
    stampWard(e, t) {
      if (!e.alive || e.team !== t) return;
      let n = this._s;
      ((n[0] = e.x), (n[1] = e.y), (n[2] = ot), this._stamp(e.inBrush ?? -1));
    }
    stampShrine(e, t) {
      if (e.team !== t) return;
      let n = this._s;
      ((n[0] = e.x), (n[1] = e.y), (n[2] = ct), this._stamp(-2));
    }
    buildStatic(e, t) {
      let n = e.structures,
        r = n ? n.length : 0,
        a = (t + 1) * 7919 + r;
      for (let e = 0; e < r; e++) {
        let r = n[e];
        r.alive && r.team === t && (a = (a * 31 + r.id + 1) | 0);
      }
      if (
        this._static &&
        a === this._structSig &&
        this.wallLOS === this._staticLOS
      )
        return;
      this._static ||= new Float32Array(this.target.length);
      let o = this.target;
      try {
        if (
          ((this.target = this._static),
          this._static.fill(0),
          this._fountainTeam !== t)
        ) {
          ((this._fountainTeam = t), (this._fountain = null));
          for (let e = 0; e < i.length; e++)
            i[e].team === t && (this._fountain = i[e]);
        }
        let e = this._fountain,
          a = this._s;
        e && ((a[0] = e.x), (a[1] = e.y), (a[2] = st), this._stamp(-2));
        for (let e = 0; e < r; e++) {
          let r = n[e];
          if (!r.alive || r.team !== t) continue;
          let i = rt(r.kind);
          i && ((a[0] = r.x), (a[1] = r.y), (a[2] = i), this._stamp(-2));
        }
      } finally {
        this.target = o;
      }
      ((this._structSig = a), (this._staticLOS = this.wallLOS));
    }
    update(e, t) {
      let n = e.world;
      if (!n) return !1;
      let r = this.dt,
        i = r > 0 ? (r < 0.1 ? r : 0.1) : 0;
      (e.viewerTeam !== this.team &&
        ((this.team = e.viewerTeam), (this.snapNext = !0)),
        (this.accum += i),
        (this.accum >= this.interval || this.snapNext) &&
          ((this.accum = 0),
          t ? this.rebuild(n, e.viewerTeam) : this.target.fill(1),
          (this.settled = !1)));
      let a = !1;
      if (this.snapNext)
        (this.display.set(this.target), (this.snapNext = !1), (a = !0));
      else if (!this.settled && i > 0) {
        let e = this._k;
        ((e[0] = 1 - Math.exp(-i / tt)),
          (e[1] = 1 - Math.exp(-i / nt)),
          (a = lt(this.target, this.display, e) > 0),
          a || (this.settled = !0));
      }
      return (
        a && (ut(this.display, this.data), (this.texture.needsUpdate = !0)),
        a
      );
    }
    dispose() {
      this.texture.dispose();
    }
  },
  Z = [`high`, `medium`, `low`],
  ft = [1e3 / 144, 1e3 / 120, 1e3 / 90, 1e3 / 60, 1e3 / 30],
  Q = 600,
  pt = class {
    constructor() {
      ((this.ring = new Float32Array(Q)),
        (this.sorted = new Float32Array(Q)),
        (this.head = 0),
        (this.count = 0),
        (this.capMs = 0),
        (this.budgetMs = 1e3 / 60),
        (this.t = 0.5),
        (this.t = 0),
        (this.warm = 3),
        (this.evalAcc = 0),
        (this.cooldown = 0),
        (this.state = 0),
        (this.slowEvals = 0),
        (this.stableFor = 0),
        (this.before = 0),
        (this.verifyFor = 0),
        (this.upBlockedUntil = 0),
        (this.upFailures = 0),
        (this.downBlockedUntil = 0),
        (this.p50 = 0),
        (this.p75 = 0),
        (this.p90 = 0),
        (this.mean = 0),
        (this.windowMs = 0),
        (this.lastChange = 0),
        (this.degradedAt = null),
        (this.raisedAt = null),
        (this.log = []),
        (this.capProbeAt = 0),
        (this.probing = !1));
    }
    reset(e = 3) {
      ((this.head = 0),
        (this.count = 0),
        (this.warm = Math.max(this.warm, e)),
        (this.slowEvals = 0),
        (this.stableFor = 0),
        this.state !== 0 && (this.state = 0));
    }
    push(e) {
      ((this.ring[this.head] = e),
        (this.head = (this.head + 1) % Q),
        this.count < Q && this.count++);
    }
    measure(e) {
      let t = 0,
        n = 0,
        r = this.ring,
        i = this.sorted;
      for (let a = 0; a < this.count && n < e; a++) {
        let e = r[(this.head - 1 - a + Q) % Q];
        ((i[t++] = e), (n += e));
      }
      if (((this.windowMs = n), (this.mean = t > 0 ? n / t : 0), t < 8))
        return ((this.p50 = this.p75 = this.p90 = 0), 0);
      for (let e = t; e < Q; e++) i[e] = 1e9;
      return (
        i.sort(),
        (this.p50 = i[(t * 0.5) | 0]),
        (this.p75 = i[(t * 0.75) | 0]),
        (this.p90 = i[Math.min(t - 1, (t * 0.9) | 0)]),
        t
      );
    }
    snapPeriod(e) {
      for (let t = 0; t < ft.length; t++)
        if (Math.abs(e - ft[t]) < ft[t] * 0.12) return ft[t];
      return e;
    }
    update(e, t) {
      if (
        !(e > 0) ||
        ((this.t += e), this.cooldown > 0 && (this.cooldown -= e), e >= 0.0995)
      )
        return null;
      if (this.warm > 0) return ((this.warm -= e), null);
      if ((this.push(e * 1e3), (this.evalAcc += e), this.evalAcc < 0.5))
        return null;
      if (((this.evalAcc = 0), this.capMs === 0)) {
        if (this.measure(2e3) < 30 || this.windowMs < 1500) return null;
        ((this.capMs = this.snapPeriod(this.p50)),
          (this.budgetMs = 1e3 / 60 + 0.001),
          this.capMs === ft[4] &&
            this.p90 <= this.p50 * 1.1 &&
            ((this.budgetMs = this.capMs + 0.001),
            (this.capProbeAt = this.t + 20)));
      }
      let n = this.measure(5e3),
        r = Z.indexOf(t);
      n >= 30 &&
        this.p50 < 1e3 / 57 &&
        this.budgetMs > 1e3 / 55 &&
        ((this.budgetMs = 1e3 / 60 + 0.001), (this.capProbeAt = 0));
      let i = this.budgetMs;
      if (
        this.state === 2 &&
        n >= 30 &&
        this.windowMs >= 1200 &&
        this.p75 > i * 1.4
      )
        return this.failUp(r);
      if (n < 30 || this.windowMs < 2e3) return null;
      if (this.state === 1 || this.state === 2)
        return (
          (this.verifyFor += 0.5),
          this.verifyFor < 3 || this.windowMs < 2500
            ? null
            : this.state === 1
              ? ((this.state = 0),
                (this.cooldown = 4),
                this.mean < this.before * 0.9
                  ? ((this.budgetMs = 1e3 / 60 + 0.001),
                    (this.capProbeAt = 0),
                    (this.probing = !1),
                    this.note(`keep-down`, null))
                  : ((this.probing = !1),
                    (this.budgetMs = Math.max(
                      this.budgetMs,
                      this.snapPeriod(this.p50) + 0.001,
                    )),
                    (this.downBlockedUntil = this.t + 60),
                    r > 0 ? this.change(Z[r - 1], `revert-down`) : null))
              : ((this.state = 0),
                (this.cooldown = 4),
                this.p75 > i * 1.2 || this.mean > this.before * 1.15
                  ? this.failUp(r)
                  : ((this.upFailures = 0), this.note(`keep-up`, null)))
        );
      if (this.cooldown > 0) return null;
      let a = this.p75 > i * 1.25;
      return (
        (this.slowEvals = a ? this.slowEvals + 1 : 0),
        (this.stableFor =
          !a && this.p90 <= i * 1.08 ? this.stableFor + 0.5 : 0),
        this.capProbeAt > 0 && this.t >= this.capProbeAt && r < Z.length - 1
          ? ((this.capProbeAt = 0),
            (this.probing = !0),
            (this.before = this.mean),
            (this.state = 1),
            (this.verifyFor = 0),
            (this.degradedAt = +this.t.toFixed(1)),
            this.change(Z[r + 1], `cap-probe`))
          : a &&
              this.slowEvals >= 2 &&
              r < Z.length - 1 &&
              this.t >= this.downBlockedUntil
            ? ((this.before = this.mean),
              (this.state = 1),
              (this.verifyFor = 0),
              (this.degradedAt = +this.t.toFixed(1)),
              this.change(Z[r + 1], `down`))
            : this.stableFor >= 10 && r > 0 && this.t >= this.upBlockedUntil
              ? ((this.before = this.mean),
                (this.state = 2),
                (this.verifyFor = 0),
                (this.raisedAt = +this.t.toFixed(1)),
                this.change(Z[r - 1], `up`))
              : null
      );
    }
    failUp(e) {
      return (
        (this.state = 0),
        (this.cooldown = 4),
        this.upFailures++,
        (this.upBlockedUntil =
          this.t + Math.min(600, 45 * 2 ** (this.upFailures - 1))),
        e < Z.length - 1 ? this.change(Z[e + 1], `revert-up`) : null
      );
    }
    change(e, t) {
      this.note(t, e);
      let n = this.state;
      return (
        this.reset(1),
        (this.state = n),
        (this.lastChange = this.t),
        (this.stableFor = 0),
        (this.slowEvals = 0),
        e
      );
    }
    note(e, t) {
      return (
        this.log.length > 24 && this.log.shift(),
        this.log.push(
          `${this.t.toFixed(1)}s ${e}${t ? ` → ` + t : ``} (p50 ${this.p50.toFixed(1)} p75 ${this.p75.toFixed(1)} budget ${this.budgetMs.toFixed(1)})`,
        ),
        null
      );
    }
  },
  $ = Object.freeze({
    offsets: [0, 0.28, -0.28, 0.52, -0.52, 0.76, -0.76],
    w: 256,
    h: 144,
    heights: [0.5, 1.25, 1.25, 1.25, 2],
    side: [0, -0.4, 0, 0.4, 0],
    slack: 0.6,
    edge: 0.9,
    motion: 0.06,
    clutterX: 8,
    clutterY: 3,
    clutterNdcY: [-0.88, -0.5],
    clutterH: 0.8,
    clutterW: 0.6,
    heroPts: 32,
    maxPts: 64,
    startDelay: 2,
  });
function mt(e, t) {
  let n = !1;
  for (let t = 0; t < e.length; t++)
    if (e[t] > 0) {
      n = !0;
      break;
    }
  if (!n) return -1;
  let r = -1;
  for (let n = 0; n < t.length; n++)
    e[n] > 0 && (r < 0 || t[n] > t[r] + 1e-6) && (r = n);
  return r;
}
var ht = `
precision highp float; precision highp sampler2D;
uniform sampler2D tDepth; uniform vec2 uPts[${$.maxPts}]; in vec2 vUv; out vec4 outColor;
void main() {
  float d = texture(tDepth, uPts[int(gl_FragCoord.x)]).r;
  vec4 r = fract(d * vec4(1.0, 255.0, 65025.0, 16581375.0)); r -= r.yzww * vec4(1.0 / 255.0, 1.0 / 255.0, 1.0 / 255.0, 0.0);
  outColor = r;
}`,
  gt = class {
    constructor(e) {
      ((this.renderer = e),
        (this.rt = null),
        (this.cam = null),
        (this.stats = {
          runs: 0,
          candidates: 0,
          picked: null,
          scores: null,
          applied: !1,
          ms: 0,
          each: [],
          readbackFrames: 0,
        }),
        (this._v = new O()),
        (this._r = new O()),
        (this._pts = []));
      for (let e = 0; e < $.maxPts; e++) this._pts.push(new h());
      let t = $.offsets.length;
      ((this._meta = new Float64Array($.maxPts * 2 * t)),
        (this._np = new Int32Array(t)),
        (this._planes = new Float64Array(t * 2)),
        (this._inv = new Float64Array(t * 16)),
        (this._m4 = new re()),
        (this._cl = new Int32Array(t)),
        (this._buf = new Uint8Array($.maxPts * t * 4)),
        (this._hidden = []),
        (this._pending = null));
    }
    _init(e) {
      let t = new p($.w, $.h);
      ((t.type = te),
        (t.format = d),
        (t.minFilter = t.magFilter = F),
        (this.rt = new k($.w, $.h, {
          depthBuffer: !0,
          depthTexture: t,
          stencilBuffer: !1,
          type: m,
        })),
        (this.ptRT = new k($.maxPts, $.offsets.length, {
          depthBuffer: !1,
          minFilter: F,
          magFilter: F,
        })),
        (this.ptMat = new w({
          glslVersion: g,
          vertexShader: fe,
          fragmentShader: ht,
          uniforms: { tDepth: { value: null }, uPts: { value: this._pts } },
          depthTest: !1,
          depthWrite: !1,
        })),
        (this.quad = new de(this.ptMat)),
        (this.cam = e.clone()));
    }
    warm(e) {
      this.rt || this._init(e);
      let t = new I(),
        n = new A(-1, 1, 1, -1, 0, 1),
        r = new N(this.quad._mesh.geometry, this.ptMat);
      ((r.frustumCulled = !1), t.add(r), this.renderer.compile(t, n));
      let i = this.renderer,
        a = i.getRenderTarget();
      try {
        (i.setRenderTarget(this.rt),
          i.clear(!0, !0, !1),
          (this.ptMat.uniforms.tDepth.value = this.rt.depthTexture),
          this.ptRT.scissor.set(0, 0, 1, 1),
          (this.ptRT.scissorTest = !0),
          i.setRenderTarget(this.ptRT),
          this.quad.render(i));
      } finally {
        ((this.ptRT.scissorTest = !1), i.setRenderTarget(a));
      }
    }
    step(e, t, n) {
      let r = e.cine;
      if (!r || r.pick !== null || r.visDone) return !1;
      let i = performance.now();
      if (!r.vis) {
        if (++r.visWait <= $.startDelay) return !0;
        let e = performance.now();
        ((r.vis = { k: 0 }),
          this._collectHidden(t),
          this.stats.runs++,
          (this.stats.applied = !1),
          (this.stats.collectMs = +(performance.now() - e).toFixed(1)));
      }
      let a = r.vis,
        o = $.offsets;
      if (a.k > o.length) return (this.stats.readbackFrames++, !0);
      if (a.k < o.length) {
        this.rt || this._init(e.camera);
        let i = this.cam,
          s = e.camera;
        ((i.fov = s.fov),
          (i.aspect = s.aspect),
          (i.near = s.near),
          (i.far = s.far),
          i.updateProjectionMatrix(),
          e.cinePose(r.y0 + o[a.k], i),
          this._probe(e, t, n, i, a.k),
          this.stats.candidates++,
          a.k++,
          a.k === o.length && this._readback(e, r));
      }
      let s = performance.now() - i;
      return ((this.stats.ms += s), this.stats.each.push(+s.toFixed(1)), !0);
    }
    _collectHidden(e) {
      let t = this._hidden;
      ((t.length = 0),
        e.traverse((e) => {
          if (!e.visible) return;
          if (e.isPoints || e.isLine || e.isSprite) {
            t.push(e);
            return;
          }
          if (!e.isMesh) return;
          let n = e.material,
            r = Array.isArray(n) ? n[0] : n;
          (!r ||
            r.transparent ||
            r.depthWrite === !1 ||
            r.blending === 2 ||
            r.colorWrite === !1) &&
            t.push(e);
        }));
    }
    _probe(e, t, n, r, i) {
      let a = this.renderer,
        o = e.cine,
        s = n && n.champions,
        c = this._meta,
        l = $.maxPts,
        u = this._v,
        d = this._r,
        f = 0;
      if (
        (r.updateMatrixWorld(),
        r.matrixWorldInverse.copy(r.matrixWorld).invert(),
        d.setFromMatrixColumn(r.matrixWorld, 0),
        s)
      )
        for (
          let t = 0;
          t < s.length && f + $.heights.length <= $.heroPts;
          t++
        ) {
          let n = s[t];
          if (!n.alive || n.team !== o.win) continue;
          let a = n.x - o.nx,
            p = n.y - o.ny;
          if (a * a + p * p > 196) continue;
          let m = e.heights.at(n.x, n.y);
          for (let e = 0; e < $.heights.length; e++) {
            let t = n.x + d.x * $.side[e],
              a = m + $.heights[e],
              o = n.y + d.z * $.side[e];
            u.set(t, a, o).applyMatrix4(r.matrixWorldInverse);
            let s = -u.z;
            u.set(t, a, o).project(r);
            let p =
              s > r.near &&
              u.x > -$.edge &&
              u.x < $.edge &&
              u.y > -$.edge &&
              u.y < $.edge;
            (this._pts[f].set(u.x * 0.5 + 0.5, u.y * 0.5 + 0.5),
              (c[(i * l + f) * 2] = s),
              (c[(i * l + f) * 2 + 1] = +!!p),
              f++);
          }
        }
      if (
        ((this._np[i] = f),
        (this._planes[i * 2] = r.near),
        (this._planes[i * 2 + 1] = r.far),
        f === 0)
      )
        return;
      for (let e = f; e < $.heroPts; e++) this._pts[e].set(0.5, 0.5);
      let p = $.clutterX,
        m = $.clutterY,
        h = $.clutterNdcY[0],
        g = $.clutterNdcY[1],
        _ = $.heroPts;
      for (let e = 0; e < m; e++)
        for (let t = 0; t < p; t++, _++)
          this._pts[_].set(
            ((t + 0.5) / p) * 0.9 + 0.05,
            (h + ((g - h) * (e + 0.5)) / m) * 0.5 + 0.5,
          );
      for (; _ < l; _++) this._pts[_].set(0.5, 0.5);
      this._m4
        .multiplyMatrices(r.projectionMatrix, r.matrixWorldInverse)
        .invert();
      let v = this._m4.elements;
      for (let e = 0; e < 16; e++) this._inv[i * 16 + e] = v[e];
      let y = a.getRenderTarget(),
        b = a.shadowMap.autoUpdate,
        x = this._hidden,
        S = Array(x.length);
      for (let e = 0; e < x.length; e++)
        ((S[e] = x[e].visible), (x[e].visible = !1));
      try {
        a.shadowMap.autoUpdate = !1;
        let e = a.info,
          n = e.programs ? e.programs.length : 0,
          o = e.memory.geometries,
          s = e.memory.textures,
          c = performance.now();
        (a.setRenderTarget(this.rt),
          a.clear(!0, !0, !1),
          a.render(t, r),
          i === 0 &&
            (this.stats.first = {
              renderMs: +(performance.now() - c).toFixed(1),
              newPrograms: (e.programs ? e.programs.length : 0) - n,
              newGeometries: e.memory.geometries - o,
              newTextures: e.memory.textures - s,
            }),
          (this.ptMat.uniforms.tDepth.value = this.rt.depthTexture),
          this.ptRT.scissor.set(0, i, l, 1),
          (this.ptRT.scissorTest = !0));
        let u = performance.now();
        (a.setRenderTarget(this.ptRT),
          this.quad.render(a),
          (this.ptRT.scissorTest = !1),
          i === 0 &&
            (this.stats.first.readoutMs = +(performance.now() - u).toFixed(1)));
      } finally {
        ((a.shadowMap.autoUpdate = b), a.setRenderTarget(y));
        for (let e = 0; e < x.length; e++) x[e].visible = S[e];
      }
    }
    _readback(e, t) {
      let n = this.renderer,
        r = this._buf,
        i = $.offsets.length;
      this._hidden.length = 0;
      let a = () => {
          let n = $.maxPts,
            a = this._meta,
            o = [];
          for (let t = 0; t < i; t++) {
            let i = this._np[t];
            if (i === 0) {
              o.push(0);
              continue;
            }
            let s = this._planes[t * 2],
              c = this._planes[t * 2 + 1],
              l = 0;
            for (let e = 0; e < i; e++) {
              if (a[(t * n + e) * 2 + 1] === 0) continue;
              let i = (t * n + e) * 4,
                o =
                  (r[i] / 255 +
                    r[i + 1] / 65025 +
                    r[i + 2] / 16581375 +
                    r[i + 3] / 4228250625) *
                    2 -
                  1;
              (2 * s * c) / (c + s - o * (c - s)) >=
                a[(t * n + e) * 2] - $.slack && l++;
            }
            let u = this._inv,
              d = t * 16,
              f = 0,
              p = $.clutterX * $.clutterY;
            for (let i = 0; i < p; i++) {
              let a = $.heroPts + i,
                o = (t * n + a) * 4,
                s =
                  r[o] / 255 +
                  r[o + 1] / 65025 +
                  r[o + 2] / 16581375 +
                  r[o + 3] / 4228250625;
              if (s >= 0.99999) continue;
              let c = this._pts[a],
                l = c.x * 2 - 1,
                p = c.y * 2 - 1,
                m = s * 2 - 1,
                h = u[d + 3] * l + u[d + 7] * p + u[d + 11] * m + u[d + 15],
                g = (u[d] * l + u[d + 4] * p + u[d + 8] * m + u[d + 12]) / h,
                _ =
                  (u[d + 1] * l + u[d + 5] * p + u[d + 9] * m + u[d + 13]) / h,
                v =
                  (u[d + 2] * l + u[d + 6] * p + u[d + 10] * m + u[d + 14]) / h;
              _ - e.heights.at(g, v) > $.clutterH && f++;
            }
            ((this._cl[t] = f),
              o.push(
                l / i -
                  ($.clutterW * f) / p -
                  $.motion * Math.abs($.offsets[t]),
              ));
          }
          let s = mt(this._np, o);
          ((this.stats.scores = o.map((e) => +e.toFixed(3))),
            (this.stats.clutter = Array.from(this._cl)),
            (this.stats.picked = s < 0 ? null : $.offsets[s]),
            (t.visDone = !0),
            (this.stats.applied =
              s >= 0 && e.cine === t && e.setCinePick($.offsets[s])));
        },
        o = (e) => {
          ((t.visDone = !0),
            console.warn(
              `[look] cinematic visibility readback failed — bearing sweep used`,
              e,
            ));
        };
      try {
        n.readRenderTargetPixelsAsync
          ? ((t.visDone = !1),
            (this._pending = n
              .readRenderTargetPixelsAsync(this.ptRT, 0, 0, $.maxPts, i, r)
              .then(a, o)),
            (t.vis.k = i + 1))
          : (n.readRenderTargetPixels(this.ptRT, 0, 0, $.maxPts, i, r), a());
      } catch (e) {
        o(e);
      }
    }
    dispose() {
      this.rt &&
        (this.rt.depthTexture.dispose(),
        this.rt.dispose(),
        this.ptRT.dispose(),
        this.ptMat.dispose(),
        this.quad.dispose());
    }
  },
  _t = (e) => (e <= 0 ? 0 : e >= 1 ? 1 : e * e * (3 - 2 * e)),
  vt = (e) =>
    !!(
      e &&
      e.params &&
      (e.params.has(`checkhdr`) || e.params.get(`look.checkHDR`) === `1`)
    ),
  yt = class {
    constructor({ canvas: e, app: t, quality: n = `high`, dpr: r = null }) {
      ((this.app = t),
        (this.canvas = e),
        (this.dpr = r),
        (this.quality = me[n] ? n : `high`));
      let i = t && t.params,
        a = {};
      for (let e of [
        `tan`,
        `minW`,
        `maxW`,
        `minTexels`,
        `slope`,
        `gamma`,
        `taps`,
        `search`,
      ]) {
        let t = i && i.get(`look.sh` + e[0].toUpperCase() + e.slice(1));
        t != null &&
          t !== `` &&
          Number.isFinite(Number(t)) &&
          (a[e] = Number(t));
      }
      let o = Fe(a);
      (Le(),
        Ve(i && i.has(`look.specMax`) ? Number(i.get(`look.specMax`)) : 2.3));
      let c = (e, t) =>
        i && i.has(`look.` + e) && Number.isFinite(Number(i.get(`look.` + e)))
          ? Number(i.get(`look.` + e))
          : t;
      ze(c(`ambShadow`, 0.3), c(`ambShadowSide`, 0.72));
      i && i.get(`pixel`) === `1` && lookCelPatch();   // banded sun only in the optional pixel-grid mode
      let l = (this.renderer = new ie({
        canvas: e,
        antialias: !1,
        alpha: !1,
        stencil: !1,
        depth: !0,
        powerPreference: `high-performance`,
        // (env r6) ?prec=mediump: emulate a mobile GPU's float precision in every three.js shader (test switch)
        ...(i && i.get(`prec`) === `mediump` ? { precision: `mediump` } : {}),
      }));
      ((l.outputColorSpace = s),
        (l.toneMapping = 4),
        (l.toneMappingExposure = R.exposure),
        (l.shadowMap.enabled = !0),
        (l.shadowMap.type = +!o),
        (l.info.autoReset = !1),
        (oe.DEFAULT_ANISOTROPY = Math.max(
          1,
          Math.min(8, l.capabilities.getMaxAnisotropy() || 1),
        )),
        (this.scene = new I()),
        (this.scene.name = `world`),
        (this.scene.background = q.fogColor.clone()),
        (this.scene.fog = new T(q.fogColor.clone(), 90, 220)),
        (this.camera = new ae(38, 16 / 9, 1, 320)),
        (this.cameraRig = new Ae(this.camera, e)),
        (this.look = {
          ...R,
          fowTint: [...R.fowTint],
          fowHaze: [...R.fowHaze],
          aerialTint: [...R.aerialTint],
          waterAO: [...R.waterAO],
        }),
        (this.grade = { ...ge }),
        (this.lights = new Ge({
          scene: this.scene,
          renderer: l,
          quality: this.quality,
        })),
        (this.sun = this.lights.sun),
        (this.hemi = this.lights.hemi),
        (this.bounce = this.lights.bounce),
        (this.vision = new dt(192, 0)),
        (this.lut = pe(this.grade, 33)),
        (this.post = new le({
          renderer: l,
          scene: this.scene,
          camera: this.camera,
          look: this.look,
        })),
        i &&
          i.has(`look.renderScale`) &&
          (this.post.scaleOverride = Number(i.get(`look.renderScale`)) || 0));
      let u = this.post.uniforms;
      ((u.tLut.value = this.lut),
        (u.uLutSize.value = 33),
        (u.tVision.value = this.vision.texture),
        u.uVisionST.value.copy(this.vision.st));
      let d = new O(q.sunDir.x, 0, q.sunDir.z).normalize();
      ((this.uniforms = {
        uTime: ue(0),
        uSunDir: { value: q.sunDir.clone() },
        uSunColor: {
          value: new O(q.sunColor.r, q.sunColor.g, q.sunColor.b).multiplyScalar(
            q.sunIntensity,
          ),
        },
        uSkyColor: {
          value: new O(q.skyColor.r, q.skyColor.g, q.skyColor.b).multiplyScalar(
            q.hemiIntensity,
          ),
        },
        uGroundColor: {
          value: new O(
            q.groundColor.r,
            q.groundColor.g,
            q.groundColor.b,
          ).multiplyScalar(q.hemiIntensity),
        },
        uFogColor: { value: new O(q.fogColor.r, q.fogColor.g, q.fogColor.b) },
        uVision: { value: this.vision.texture },
        uVisionST: { value: this.vision.st },
        uFow: ue(0),
        uDeath: ue(0),
        uCameraPos: { value: new O() },
        uRimColor: { value: new O() },
        uRimStrength: ue(1),
        uRimDir: { value: d },
        uCharKeyDir: { value: new O(0, 1, 0) },
        uCharKeyColor: { value: new O() },
        uPlayerScreen: { value: new O() },
        uPlayerWorld: { value: new E() },
      }),
        (this._pv = new O()),
        (this._pv2 = new O()),
        (this.charLight = {
          keyColor: q.charKeyColor.clone(),
          keyIntensity: q.charKeyIntensity,
          rimStrength: q.rimStrength,
        }),
        this.updateCharacterLight(),
        (this.fogOfWar = !0),
        (this._dt = 1 / 60),
        (this._fow = 0),
        (this._fowSnap = !0),
        (this._flash = 0),
        (this._fade = 0),
        (this._elapsed = 0),
        (this._aeSlowFor = 0),
        (this._renderFails = 0),
        (this._renderErrKeys = new Set()),
        (this._hdr = null),
        (this._checkAt = vt(t) ? 4 : -1),
        (this._k = new Float64Array(3)),
        (this.stats = {
          updateMs: 0,
          pixelRatio: 1,
          width: 0,
          height: 0,
          samples: 0,
          sceneScale: 1,
          quality: this.quality,
          degradedAt: null,
          raisedAt: null,
          refreshMs: 0,
          budgetMs: 0,
        }));
      let f = t && t.params,
        p =
          f &&
          (f.has(`quality`) ||
            f.has(`scenario`) ||
            f.get(`autoquality`) === `0`);
      if (((this.autoQuality = !p), (this.auto = new pt()), f)) {
        let e = {};
        for (let [t, n] of f)
          if (t.startsWith(`look.`)) {
            let r = Number(n);
            e[t.slice(5)] = n.includes(`,`)
              ? n.split(`,`).map(Number)
              : Number.isFinite(r) && n !== ``
                ? r
                : n;
          }
        Object.keys(e).length && this.setLook(e);
      }
      (t &&
        t.on &&
        (t.on(`match`, () => {
          (this.cameraRig.reset(),
            this.vision.reset(),
            (this._flash = 0),
            (this._fowSnap = !0),
            this.post.snapExposure(),
            this.auto.reset(3));
        }),
        t.on(`scenario`, () => {
          (this.vision.reset(),
            (this._fowSnap = !0),
            this.post.snapExposure(),
            this.auto.reset(3));
        }),
        t.on(`state`, () => this.auto.reset(2))),
        (this._size = { w: 0, h: 0 }),
        (this._onResize = () => this.resize()),
        typeof ResizeObserver < `u` &&
          ((this._ro = new ResizeObserver(this._onResize)),
          this._ro.observe(e)),
        window.addEventListener(`resize`, this._onResize),
        (this._onScroll = () => this.cameraRig.invalidateRect()),
        window.addEventListener(`scroll`, this._onScroll, {
          capture: !0,
          passive: !0,
        }),
        this.resize(),
        this.post.precompile());
      try {
        ((this.cineVis = new gt(this.renderer)),
          this.cineVis.warm(this.camera));
      } catch (e) {
        ((this.cineVis = null),
          console.warn(`[look] cinematic probe warm-up skipped`, e));
      }
    }
    get visionTexture() {
      return this.vision.texture;
    }
    get xray() {
      return this.post.xray;
    }
    get contact() {
      return this.post.contact;
    }
    checkHDR(e) {
      return (
        (this._hdr ||= new qe(this.renderer)),
        this._hdr.check(this.post, e)
      );
    }
    benchmark(e = 60) {
      return this.post.benchmark(e);
    }
    readExposure() {
      return this.post.readExposure();
    }
    get timings() {
      return this.post.timings;
    }
    get profiling() {
      return this.post ? this.post.profiling : !1;
    }
    set profiling(e) {
      this.post && ((this.post.profiling = !!e), e && (this.post.timings = {}));
    }
    pixelRatioFor(e) {
      let t = me[e],
        n = window.devicePixelRatio || 1;
      return this.dpr ? Math.min(this.dpr, 3) : Math.min(n, t.prMax);
    }
    resize() {
      let e = this.canvas.getBoundingClientRect(),
        t = Math.max(1, Math.round(e.width || window.innerWidth)),
        n = Math.max(1, Math.round(e.height || window.innerHeight)),
        r = this.pixelRatioFor(this.quality);
      (this.cameraRig.invalidateRect(),
        !(
          t === this._size.w &&
          n === this._size.h &&
          r === this.stats.pixelRatio &&
          this.post.sceneRT
        ) &&
          ((this._size.w = t),
          (this._size.h = n),
          this.renderer.setPixelRatio(r),
          this.renderer.setSize(t, n, !1),
          (this.camera.aspect = t / n),
          this.camera.updateProjectionMatrix(),
          this.cameraRig.invalidateRect(),
          this.post.setSize(t, n, r),
          this.post.configure(me[this.quality], r),
          (this.stats.pixelRatio = r),
          (this.stats.width = Math.round(t * r)),
          (this.stats.height = Math.round(n * r)),
          (this.stats.samples = this.post.samples),
          (this.stats.sceneScale = this.post.sceneScale)));
    }
    setQuality(e) {
      me[e] &&
        ((this.quality = e),
        (this.stats.quality = e),
        this.lights.setQuality(e),
        (this.stats.pixelRatio = -1),
        this.resize());
    }
    setLook(e = {}) {
      let t = !1;
      for (let n in e) {
        let r = e[n];
        n === `sunIntensity`
          ? ((this.sun.intensity = r),
            this.uniforms.uSunColor.value
              .set(this.sun.color.r, this.sun.color.g, this.sun.color.b)
              .multiplyScalar(r))
          : n === `hemiIntensity`
            ? (this.hemi.intensity = r)
            : n === `bounceIntensity`
              ? (this.bounce.intensity = r)
              : n === `bounceDir`
                ? this.lights.bounceDir.set(r[0], r[1], r[2]).normalize()
                : n === `bounceColor`
                  ? this.bounce.color.setRGB(r[0], r[1], r[2])
                  : n === `skyColor`
                    ? this.hemi.color.setRGB(r[0], r[1], r[2])
                    : n === `groundColor`
                      ? this.hemi.groundColor.setRGB(r[0], r[1], r[2])
                      : n === `sunColor`
                        ? (this.sun.color.setRGB(r[0], r[1], r[2]),
                          this.uniforms.uSunColor.value
                            .set(r[0], r[1], r[2])
                            .multiplyScalar(this.sun.intensity))
                        : n === `sunDir`
                          ? (this.lights.sunDir
                              .set(r[0], r[1], r[2])
                              .normalize(),
                            this.uniforms.uSunDir.value.copy(
                              this.lights.sunDir,
                            ),
                            this.uniforms.uRimDir.value
                              .set(
                                this.lights.sunDir.x,
                                0,
                                this.lights.sunDir.z,
                              )
                              .normalize())
                          : n === `envIntensity`
                            ? (this.scene.environmentIntensity = r)
                            : n === `rimStrength`
                              ? ((this.charLight.rimStrength = r),
                                this.updateCharacterLight())
                              : n === `charKeyIntensity`
                                ? ((this.charLight.keyIntensity = r),
                                  this.updateCharacterLight())
                                : n === `charKeyColor`
                                  ? (this.charLight.keyColor.setRGB(
                                      r[0],
                                      r[1],
                                      r[2],
                                    ),
                                    this.updateCharacterLight())
                                  : n === `fowLOS`
                                    ? ((this.look.fowLOS = r),
                                      (this.vision.wallLOS = !!r),
                                      this.vision.reset())
                                    : n in this.look
                                      ? (this.look[n] = r)
                                      : n in this.grade &&
                                        ((this.grade[n] = r), (t = !0));
      }
      (t && he(this.lut, this.grade),
        (this.renderer.toneMappingExposure = this.look.exposure),
        this.post.applyDefines());
    }
    updateCharacterLight() {
      let e = this.charLight,
        t = Math.max(0.001, e.keyIntensity),
        n = this.uniforms;
      (n.uRimColor.value
        .set(e.keyColor.r, e.keyColor.g, e.keyColor.b)
        .multiplyScalar(t),
        n.uCharKeyColor.value.copy(n.uRimColor.value),
        (n.uRimStrength.value = e.rimStrength / t));
    }
    autoDegrade(e) {
      if (!this.autoQuality || (e.state !== `game` && e.state !== `end`))
        return;
      let t = this.auto.update(this._dt, this.quality),
        n = this.auto;
      (t &&
        t !== this.quality &&
        (this.setQuality(t),
        console.info(
          `[look] auto quality →`,
          t,
          n.log[n.log.length - 1] || ``,
        )),
        (this.stats.degradedAt = n.degradedAt),
        (this.stats.raisedAt = n.raisedAt),
        (this.stats.refreshMs = n.capMs),
        (this.stats.budgetMs = n.budgetMs));
    }
    update(e) {
      let t = performance.now(),
        n = Math.min(0.1, Math.max(0, e.dt || 0));
      this._elapsed += n;
      let r = e.world,
        i = this.cameraRig;
      i.updateFrame(e);
      this.post && this.post.fixPixelFov && this.post.fixPixelFov(); // [env pixel grid] 1 internal px == 1/32 m at focus
      let a = this.lights;
      ((a.groundY = i._groundH),
        (a.radiusHint = i.shadowRadius),
        a.fit(this.camera));
      let s = e.state === `game` || e.state === `end`,
        c =
          this.fogOfWar && s && r && (r.winner === null || r.winner === void 0)
            ? 1
            : 0;
      (this._fowSnap && s && ((this._fow = c), (this._fowSnap = !1)),
        (this._fow +=
          (c - this._fow) *
          (1 - Math.exp(-n / (c ? 0.25 : i.cine ? 0.2 : 0.6)))),
        (this._fow =
          Math.abs(c - this._fow) < 1e-4
            ? c
            : this._fow < 0
              ? 0
              : this._fow > 1
                ? 1
                : this._fow),
        r &&
          ((this.vision.dt = n),
          this.vision.update(e, c > 0 || this._fow > 0.01)));
      let l = e.events;
      if (l)
        for (let e = 0; e < l.length; e++)
          l[e].type === o.STRUCTURE_DESTROYED && (this._aeSlowFor = 1.5);
      this._aeSlowFor > 0 && (this._aeSlowFor -= n);
      let u = this.post.exposurePass,
        d = i.cine,
        f = this.look;
      ((u.hold = +!!d),
        (u.slow = d || this._aeSlowFor > 0 ? 6 : 1),
        (u.ceilEV = d ? (f.cineMaxEV ?? -0.85) : 1 / 0),
        (u.ceilTau = f.cineTau ?? 0.3));
      let p = this.camera.matrixWorld.elements,
        m = this._k,
        h = p[0],
        g = p[2],
        _ = p[8],
        v = p[10],
        y = Math.sqrt(h * h + g * g) || 1;
      ((h /= y),
        (g /= y),
        (y = Math.sqrt(_ * _ + v * v) || 1),
        (_ /= y),
        (v /= y),
        (m[0] = -0.35 * h + 0.55 * _),
        (m[1] = 0.75),
        (m[2] = -0.35 * g + 0.55 * v),
        (y = Math.sqrt(m[0] * m[0] + m[1] * m[1] + m[2] * m[2])),
        this.uniforms.uCharKeyDir.value.set(m[0] / y, m[1] / y, m[2] / y),
        this._checkAt > 0 &&
          s &&
          (this._checkAt -= n) <= 0 &&
          ((this._checkAt = -1), (this._pendingCheck = !0)),
        i.cine && i.cine.t < n * 1.5 && (this._flash = 0.16),
        this._flash > 0 &&
          ((this._flash *= Math.exp(-n * 6)),
          this._flash < 1e-4 && (this._flash = 0)));
      let b = i.cine ? i.cine.t : -1,
        x = this.post.boost;
      ((x[0] = b < 0 ? 0 : Math.min(1, b / 0.12) * (1 - _t((b - 0.7) / 1.5))),
        (x[1] += ((b < 0 ? 0 : 1) - x[1]) * (1 - Math.exp(-n / 0.3))),
        x[1] < 0.001 ? (x[1] = 0) : x[1] > 0.999 && (x[1] = 1),
        (x[2] = i.viewDist / V.distance));
      let S = this.uniforms;
      (n > 0 && (S.uTime.value += n),
        S.uCameraPos.value.copy(this.camera.position));
      let C = i.dead,
        w = this._fow;
      (S.uFow.value !== w && (S.uFow.value = w),
        S.uDeath.value !== C && (S.uDeath.value = C));
      let T = this.post.uniforms,
        E = w * (1 - 0.35 * C);
      (T.uFow.value !== E && (T.uFow.value = E),
        T.uDeath.value !== C && (T.uDeath.value = C));
      let D = this._flash < 1e-4 ? 0 : this._flash;
      (T.uFlash.value !== D && (T.uFlash.value = D),
        T.uFade.value !== this._fade && (T.uFade.value = this._fade),
        (this._frame = e),
        (this._dt = n),
        this.autoDegrade(e),
        (this.stats.updateMs = performance.now() - t));
    }
    render(e) {
      this.renderer.info.reset();
      let t = e ? Math.min(0.1, Math.max(0, e.dt || 0)) : 0.016;
      if (
        (e && this.updatePlayerLink(e),
        this.cameraRig.cine &&
          !this.cameraRig.cine.visDone &&
          e &&
          e.world &&
          this.look.cineVis)
      )
        try {
          ((this.cineVis ||= new gt(this.renderer)),
            this.cineVis.step(this.cameraRig, this.scene, e.world));
        } catch (e) {
          ((this.cameraRig.cine.visDone = !0),
            console.warn(
              `[look] cinematic visibility probe failed — bearing sweep used`,
              e,
            ));
        }
      try {
        (this.post.render(t), (this._renderFails = 0));
      } catch (e) {
        if (
          (this.renderer.setRenderTarget(null),
          this._renderFails++,
          this.reportRenderFailure(e),
          this._renderFails > 8)
        )
          try {
            this.post.renderPostOnly(t);
          } catch {}
        throw e;
      }
      if (this._pendingCheck) {
        this._pendingCheck = !1;
        try {
          this.checkHDR({ blame: !0 });
        } catch (e) {
          console.warn(`[look] checkHDR failed`, e);
        }
      }
    }
    updatePlayerLink(e) {
      let t = this.post.xray;
      (t.collect(
        e,
        this.app && this.app.registry,
        this.look.xrayEnemy > 0 && this.look.xray > 0,
        this.camera,
      ),
        this.post.contact.collect(
          e,
          this.app && this.app.registry,
          this.look,
          this.camera,
        ));
      let n = this.uniforms,
        r = n.uPlayerScreen.value,
        i = n.uPlayerWorld.value,
        a = t.player;
      if (!a.found) {
        (r.z !== 0 && (r.z = 0), i.w !== 0 && (i.w = 0));
        return;
      }
      let o = a.y + a.height * 0.5,
        s = this._pv.set(a.x, o, a.z).project(this.camera),
        c = this._pv2.set(a.x, a.y + a.height * 1.05, a.z).project(this.camera);
      (r.set(
        s.x * 0.5 + 0.5,
        s.y * 0.5 + 0.5,
        Math.max(0.02, Math.abs(c.y - s.y) * 0.5 * 1.15),
      ),
        i.set(a.x, o, a.z, a.height * 0.62));
    }
    reportRenderFailure(e) {
      let t = String((e && e.message) || e).slice(0, 120);
      if (this._renderErrKeys.has(t) || this._renderErrKeys.size > 16) return;
      this._renderErrKeys.add(t);
      let n = this.renderer.properties,
        r = [];
      try {
        this.scene.traverseVisible((e) => {
          if (
            r.length >= 6 ||
            !(e.isMesh || e.isPoints || e.isLine || e.isSprite)
          )
            return;
          let t = Array.isArray(e.material) ? e.material : [e.material];
          for (let i of t)
            if (i && !n.get(i).currentProgram) {
              let t = ``;
              for (let n = e; n && !n.isScene; n = n.parent)
                t = (n.name || n.type) + (t ? `/` + t : ``);
              r.push(`${t} [${i.name || i.type}]`);
              break;
            }
        });
      } catch {}
      console.error(
        `[look] scene render failed (${t}). Materials without a compiled program: ${r.join(` · `) || `none found`}`,
      );
    }
    dispose() {
      (window.removeEventListener(`resize`, this._onResize),
        window.removeEventListener(`scroll`, this._onScroll, { capture: !0 }),
        this._ro && this._ro.disconnect(),
        this._hdr && this._hdr.dispose(),
        this.cineVis && this.cineVis.dispose(),
        this.post.dispose(),
        this.lights.dispose(),
        this.vision.dispose(),
        this.lut.dispose(),
        this.renderer.dispose());
    }
  };
export { yt as default };
