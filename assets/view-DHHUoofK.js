import {
  B as e,
  C as t,
  Ft as n,
  H as r,
  It as i,
  Lt as a,
  S as o,
  St as s,
  Yt as c,
  bt as l,
  dt as u,
  ft as d,
  q as f,
  ut as p,
  z as m,
} from "./index-DHK-Ptzs.js";
import { o as h } from "./height-CVtQdZ3e.js";
import { t as g } from "./geo-VdiuQ1XD.js";
import { a as _, i as v, s as y, t as b } from "./rig-rgJEAbls.js";
import {
  createChampionMaterial as x,
  prepassMaterial as S,
  sharedAssets as C,
  translucentTwin as w,
} from "./material-BPS_1X92.js";
var T = (e, t, n) => (e < t ? t : e > n ? n : e),
  E = (e) => e * e * (3 - 2 * e),
  D = (e) => e * e,
  O = (e) => 1 - (1 - e) * (1 - e),
  k = (e, t) => {
    let n = e - 1;
    return 1 + (t + 1) * n * n * n + t * n * n;
  },
  A = { s: 0, i: 1, o: 2, l: 3 },
  j = (e, t) =>
    e === 0
      ? t * t * (3 - 2 * t)
      : e === 1
        ? t * t
        : e === 2
          ? 1 - (1 - t) * (1 - t)
          : t,
  M = Math.PI * 2,
  N = {
    NONE: 0,
    ATTACK: 1,
    CAST: 2,
    DASH: 3,
    RECALL: 4,
    STUN: 5,
    AIR: 6,
    DEAD: 7,
  },
  P = Object.freeze({
    stunUntil: 0,
    rootUntil: 0,
    slowUntil: 0,
    airborneUntil: 0,
    airborneStart: 0,
  }),
  F = class {
    constructor(e) {
      this.type = e;
      let t = e.layout;
      this.L = t;
      let n = t.size;
      ((this.out = new Float32Array(n)),
        (this.pre = new Float32Array(n)),
        (this.loco = new Float32Array(n)),
        (this.act = new Float32Array(n)),
        (this.tmpA = new Float32Array(n)),
        (this.snap = new Float32Array(n)),
        (this.mask = new Float32Array(n)),
        (this.lib = e.lib),
        (this.cfg = e.anim),
        (this.facing = 1e-4),
        (this.angVel = 1e-4),
        (this.speedS = 0),
        (this.runPhase = 0),
        (this.runW = 0),
        (this.vFwd = 1e-4),
        (this.vLat = 1e-4),
        (this.lastX = 1e-4),
        (this.lastY = 1e-4),
        (this.seenAttack = -1),
        (this.seenCast = -1),
        (this.seenHit = -1),
        (this.attackStart = -99),
        (this.attackWind = 0.3),
        (this.attackVariant = -1),
        (this.castStart = -99),
        (this.castSlot = null),
        (this.hitT = -99),
        (this.hitK = 0),
        (this.flash = 0),
        (this.actKey = 0),
        (this.xfadeT = 1),
        (this.xfadeDur = 0.1),
        (this.aliveSeen = null),
        (this.deathStart = -99),
        (this.respawnAt = -99),
        (this.dissolve = 0),
        (this.fade = 1),
        (this.recallGlow = 0),
        (this.air = 0),
        (this.lift = 0),
        (this.trail = new Float32Array(2)),
        (this.emit = 0),
        (this.springs = (e.anim.chains || []).map((t) => ({
          c: t,
          idx: t.bones.map((t) => e.rig.index(t)),
          x: new Float32Array(t.bones.length),
          z: new Float32Array(t.bones.length),
          vx: new Float32Array(t.bones.length),
          vz: new Float32Array(t.bones.length),
        }))),
        (this.showcase = !1),
        (this.custom = {}),
        (this.first = !0),
        (this.hitDamage = 0),
        (this._t = 0),
        (this._dt = 0),
        (this._tt = 0),
        (this._ta = 0),
        (this._W = 0),
        (this._fol = 0),
        (this.O = {}));
      for (let t of [
        `root`,
        `hips`,
        `spine`,
        `chest`,
        `neck`,
        `head`,
        `clavL`,
        `clavR`,
        `armL`,
        `armR`,
        `foreL`,
        `foreR`,
      ])
        this.O[t] = e.rig.index(t) * 3;
    }
    update(e, t, n, r) {
      let i = this.cfg,
        a = this.lib,
        o = this.L;
      n = n > 0.1 ? 0.1 : n > 0 ? n : 0;
      let s = e.prevX + (e.x - e.prevX) * r,
        c = e.prevY + (e.y - e.prevY) * r;
      this.first &&
        ((this.facing = e.facing),
        (this.lastX = s),
        (this.lastY = c),
        (this.aliveSeen = e.alive),
        (this.seenAttack = e.attackSeq),
        (this.seenCast = e.castSeq),
        (this.seenHit = e.hitSeq),
        e.alive ||
          (this.deathStart =
            Number.isFinite(e.deathT) && e.deathT > -1 ? e.deathT : t - 60));
      let l = e.dash ? 30 : 16,
        u = this.facing,
        d = ((((e.facing - this.facing + Math.PI) % M) + M) % M) - Math.PI;
      this.facing += d * (1 - Math.exp(-n * l));
      let f =
        n > 1e-4
          ? (((((this.facing - u + Math.PI) % M) + M) % M) - Math.PI) / n
          : 0;
      this.angVel += (f - this.angVel) * (1 - Math.exp(-n * 10));
      let p = 0,
        m = 0;
      (n > 1e-4 && ((p = (s - this.lastX) / n), (m = (c - this.lastY) / n)),
        Math.sqrt(p * p + m * m) > 25 && ((p = 0), (m = 0)),
        (this.lastX = s),
        (this.lastY = c));
      let h = Math.cos(this.facing),
        v = Math.sin(this.facing),
        x = p * h + m * v,
        S = -p * v + m * h,
        C = 1 - Math.exp(-n * 8);
      ((this.vFwd += (x - this.vFwd) * C), (this.vLat += (S - this.vLat) * C));
      let w =
        e.alive && !e.dash && e.moving && e.speedNow > 0.2
          ? Math.min(e.speedNow, 8)
          : 0;
      if (
        ((this.speedS +=
          (w - this.speedS) * (1 - Math.exp(-n * (w > this.speedS ? 12 : 9)))),
        (this.runW = E(T((this.speedS - 0.35) / 1.6, 0, 1))),
        e.attackSeq !== this.seenAttack)
      ) {
        ((this.seenAttack = e.attackSeq), (this.attackStart = e.attackT));
        let t = Math.min(2.5, e.stats ? e.stats.attackSpeed : 1);
        ((this.attackWind = (1 / Math.max(0.2, t)) * (e.windupFrac || 0.3)),
          (this.attackVariant = (this.attackVariant + 1) % i.attacks.length),
          this.snapNow(0.06));
      }
      if (
        (e.castSeq !== this.seenCast &&
          ((this.seenCast = e.castSeq),
          (this.castStart = e.castT),
          (this.castSlot = e.castSlot),
          (this.attackStart = -99),
          this.snapNow(0.06)),
        e.hitSeq !== this.seenHit)
      ) {
        this.seenHit = e.hitSeq;
        let n = T(
          0.25 + ((this.hitDamage || 0) / Math.max(1, e.maxHp || 1e3)) * 9,
          0.25,
          1,
        );
        (t - this.hitT > 0.12 || n > this.hitK + 0.2) &&
          ((this.hitT = t), (this.hitK = n));
      }
      ((this.hitDamage = 0),
        this.aliveSeen !== e.alive &&
          (e.alive
            ? ((this.respawnAt = t),
              (this.deathStart = -99),
              this.snapNow(0.01),
              (this.speedS = 0))
            : ((this.deathStart =
                Number.isFinite(e.deathT) && e.deathT > -1 ? e.deathT : t),
              this.snapNow(0.08)),
          (this.aliveSeen = e.alive)),
        (this._t = t),
        (this._dt = n),
        this.locomotion(e));
      let D = N.NONE,
        O = 0,
        k = this.act,
        A = o.fullMask,
        j = e.cc || P;
      if (
        ((this.lift = 0),
        (this.air = 0),
        (this.trail[0] = 0),
        (this.trail[1] = 0),
        !e.alive)
      )
        ((D = N.DEAD),
          (O = 1),
          (this._tt = t - this.deathStart),
          this.evalKeys(i.death, k));
      else if (j.airborneUntil > t && j.airborneStart <= t + 0.05) {
        ((D = N.AIR), (O = 1));
        let e = Math.max(0.25, j.airborneUntil - j.airborneStart),
          n = T((t - j.airborneStart) / e, 0, 1);
        (k.set(a.air), (this.air = n));
        let r = (i.airHeight || 1.25) * 4 * n * (1 - n) * Math.min(1, e / 0.6);
        this.lift = r;
        let s = this.O,
          c = Math.sin(Math.PI * n ** 0.8),
          l = -Math.min(70, i.airTumble ?? 55) * g * c * Math.min(1, e / 0.5),
          u = l * 0.6,
          d = i.center || 0.9;
        ((k[o.rootT + 1] += r + d - d * Math.cos(u)),
          (k[o.rootT + 2] += -d * Math.sin(u)),
          (k[s.root] += u),
          (k[s.spine] += l * 0.24),
          (k[s.chest] += l * 0.16),
          (k[s.neck] -= l * 0.34),
          (k[s.head] -= l * 0.46 - Math.sin(t * 13) * 5 * g));
        let f = Math.sin(t * 11),
          p = Math.sin(t * 9.3 + 1.7);
        ((k[s.armL] += f * 22 * g * c),
          (k[s.armR] -= p * 22 * g * c),
          (k[s.armL + 2] += (0.5 + 0.5 * p) * 18 * g * c),
          (k[s.armR + 2] -= (0.5 + 0.5 * f) * 18 * g * c),
          (k[s.foreL] -= (0.5 + 0.5 * f) * 30 * g * c),
          (k[s.foreR] -= (0.5 + 0.5 * p) * 30 * g * c),
          (k[o.footL + 2] += p * 0.12 * c),
          (k[o.footR + 2] -= f * 0.12 * c),
          (k[o.footL + 1] += (0.5 + 0.5 * f) * 0.08 * c),
          (k[o.footR + 1] += (0.5 + 0.5 * p) * 0.08 * c));
      } else if (j.stunUntil > t) {
        ((D = N.STUN), (O = 1), k.set(a.stun));
        let e = this.O.head,
          n = this.O.chest;
        ((k[e + 2] += Math.sin(t * 5.2) * 14 * g),
          (k[e + 1] += Math.cos(t * 3.7) * 10 * g),
          (k[n + 2] += Math.sin(t * 5.2 + 1) * 5 * g),
          (k[o.hipT] += Math.sin(t * 5.2) * 0.03));
      } else if (e.dash && (e.dash.displaced || e.dash.forced)) {
        ((D = N.STUN), (O = 1), k.set(a.stun));
        let n = e.dash,
          r = T((t - n.t0) / Math.max(0.05, n.t1 - n.t0), 0, 1),
          i = Math.sin(Math.PI * r),
          s = this.O;
        ((k[s.spine] -= 26 * g * i),
          (k[s.chest] -= 14 * g * i),
          (k[s.head] += 18 * g * i),
          (k[s.armL + 2] += 40 * g * i),
          (k[s.armR + 2] -= 40 * g * i),
          (k[o.hipT + 2] -= 0.08 * i));
      } else if (e.dash) {
        ((D = N.DASH), (O = 1));
        let n = e.dash,
          r = T((t - n.t0) / Math.max(0.05, n.t1 - n.t0), 0, 1),
          a = this.castStart >= n.t0 - 0.1 ? this.castSlot : null,
          s = (a && i.dash[a]) || i.dash.default;
        if (((this._tt = r * (s.len || 1)), this.evalKeys(s, k), s.roll)) {
          let e = M * E(r) * s.roll,
            t = i.center || 0.9;
          ((k[this.O.root] += e),
            (k[o.rootT + 1] += t - t * Math.cos(e)),
            (k[o.rootT + 2] += -t * Math.sin(e)));
        }
        if (
          (s.hop && (k[o.rootT + 1] += Math.sin(Math.PI * r) * s.hop), n.arc)
        ) {
          let e = n.arc * 4 * r * (1 - r);
          ((k[o.rootT + 1] += e), (this.lift = e));
        }
      } else if (e.recallStart != null)
        ((D = N.RECALL),
          (O = 1),
          (this._tt = t - e.recallStart),
          this.evalKeys(i.recall, k));
      else {
        let e = t - this.attackStart,
          n = t - this.castStart,
          r =
            this.attackWind +
            (i.attackFollow || 0.12) * 2.2 +
            (i.attackHold || 0.08) +
            0.24,
          a = this.castSlot && (i.casts[this.castSlot] || i.casts.spell),
          o = a ? a.len + (a.out ?? 0.25) : 0;
        if (
          a &&
          n >= -0.02 &&
          n < o &&
          (e < 0 || e > n || this.attackStart < this.castStart)
        )
          ((D = N.CAST),
            (this._tt = n),
            this.evalKeys(a, k),
            (O =
              T(n / 0.05, 0, 1) * (1 - T((n - a.len) / (a.out ?? 0.25), 0, 1))),
            (O = E(O)),
            a.upper && (A = this.blendMask()));
        else if (e >= -0.02 && e < r && i.attacks.length) {
          D = N.ATTACK;
          let t = i.attacks[this.attackVariant % i.attacks.length],
            n = Math.max(0.06, this.attackWind),
            r = i.attackFollow || 0.12,
            a = i.attackHold || 0.08;
          ((this._ta = e),
            (this._W = n),
            (this._fol = r),
            this.attackTimeline(t, k),
            (O =
              E(T(e / Math.min(0.08, n * 0.45 + 0.01), 0, 1)) *
              (1 - E(T((e - n - r * 2.2 - a) / 0.24, 0, 1)))),
            (A = this.blendMask()));
        }
      }
      let F = this.pre;
      O > 1e-4 ? ((b[0] = O), y(F, this.loco, k, A)) : F.set(this.loco);
      let I = t - this.hitT;
      if (I >= 0 && I < 0.45 && e.alive && a.flinch) {
        let e = (I < 0.05 ? I / 0.05 : Math.exp(-(I - 0.05) * 9)) * this.hitK;
        ((b[0] = e), _(F, a.flinch, null));
      }
      this.flash = I >= 0 && I < 0.3 ? 0.8 * this.hitK * Math.exp(-I * 16) : 0;
      let L = T(this.angVel * 0.075, -0.3, 0.3) * this.runW;
      ((F[this.O.root + 2] += L),
        (F[this.O.spine + 2] += L * 0.4),
        D !== this.actKey &&
          ((this.actKey !== N.ATTACK || D !== N.NONE) &&
            (this.actKey !== N.CAST || D !== N.NONE) &&
            this.snapNow(D === N.DEAD ? 0.08 : 0.12),
          (this.actKey = D)));
      let R = this.out;
      if (
        ((this.first &&= ((this.xfadeT = 1), !1)),
        this.xfadeT < 1
          ? ((this.xfadeT = Math.min(1, this.xfadeT + n / this.xfadeDur)),
            (b[0] = E(this.xfadeT)),
            y(R, this.snap, F))
          : R.set(F),
        (this.last = R),
        (this.trail[0] = R[o.scalar.trail]),
        (this.trail[1] = R[o.scalar.trail2]),
        (this.emit = R[o.scalar.emit]),
        e.alive)
      ) {
        let e = t - this.respawnAt;
        this.dissolve = e >= 0 && e < 0.8 ? 1 - E(e / 0.8) : 0;
      } else {
        let e = t - this.deathStart,
          n = i.dissolveAt ?? 3.4;
        this.dissolve = T((e - n) / 1.5, 0, 1) * 1.02;
      }
      return (
        (this.recallGlow =
          e.alive && e.recallStart != null
            ? T((t - e.recallStart) / 0.6, 0, 1) *
              (0.55 + 0.45 * T((t - e.recallStart) / 8, 0, 1))
            : Math.max(0, this.recallGlow - n * 3)),
        this.secondary(e),
        this.type.anim.procedural && this.type.anim.procedural(this, R, e),
        R
      );
    }
    blendMask() {
      let e = this.mask,
        t = this.L.upperMask,
        n = 1 - this.runW;
      for (let r = 0; r < e.length; r++) e[r] = t[r] + (1 - t[r]) * n;
      return e;
    }
    snapNow(e) {
      this.last &&
        (this.snap.set(this.last), (this.xfadeT = 0), (this.xfadeDur = e));
    }
    locomotion(e) {
      let t = this._t,
        n = this._dt,
        r = this.cfg,
        i = this.lib,
        a = this.L;
      this.type.rig;
      let o = this.loco,
        s = r.run;
      o.set((this.showcase && i.splash) || i.idle || i.stance);
      let c = Math.sin((t * M) / (r.breath || 3.4)),
        l = Math.sin((t * M) / 6.3),
        u = this.O;
      if (
        ((o[u.chest] += c * 1.6 * g),
        (o[u.neck] -= c * 1 * g),
        (o[u.clavL + 2] += c * 1.2 * g),
        (o[u.clavR + 2] -= c * 1.2 * g),
        (o[u.armL + 2] += c * 1.5 * g),
        (o[u.armR + 2] -= c * 1.5 * g),
        (o[a.hipT + 1] += (c * 0.5 - 0.5) * 0.012),
        (o[a.hipT] += l * 0.018),
        (o[u.hips + 2] += l * 1.6 * g),
        (o[u.spine + 2] -= l * 1.2 * g),
        (o[u.head + 1] += Math.sin(t * 0.47) * 6 * g),
        this.runW <= 0.001)
      ) {
        this.runPhase = 0.12;
        return;
      }
      let d = this.tmpA;
      (d.set(i.run),
        (this.runPhase = (this.runPhase + (this.speedS * n) / s.stride) % 1));
      let f = this.runPhase,
        p = s.stride / 4;
      for (let e = 0; e < 2; e++) {
        let t = (f + e * 0.5) % 1,
          n = e === 0 ? a.footL : a.footR,
          r,
          i,
          o;
        if (t < 0.5) {
          let e = t / 0.5;
          ((r = p - 2 * p * e),
            (i = 0),
            (o =
              (e < 0.15
                ? (1 - e / 0.15) * -8
                : e > 0.8
                  ? ((e - 0.8) / 0.2) * 25
                  : 0) * g));
        } else {
          let e = (t - 0.5) / 0.5;
          ((r = -p + 2 * p * E(e)),
            (i = Math.sin(Math.PI * e) * s.lift * (e < 0.5 ? 1 : 0.85)),
            (o =
              (e < 0.4
                ? 35 * (1 - e / 0.4)
                : -10 * Math.sin((Math.PI * (e - 0.4)) / 0.6)) * g));
        }
        ((d[n + 2] += r), (d[n + 1] += i), (d[n + 3] += o));
      }
      let m = Math.cos(f * M),
        h = Math.sin(f * M),
        _ = Math.cos(f * M * 2);
      d[a.hipT + 1] += -s.bob * 0.5 + s.bob * 0.5 * _;
      let v = m * (s.twist || 8) * g,
        x = -m * (s.twist || 8) * 1.4 * g;
      ((d[u.hips + 1] += v),
        (d[u.chest + 1] += x),
        (d[u.hips + 2] += _ * 1.5 * g));
      let S = h * (s.roll ?? 4) * g;
      ((d[u.clavL + 2] += S),
        (d[u.clavR + 2] += S),
        (d[u.spine + 2] -= S * 0.4),
        (d[u.head + 1] -= x * (s.headLead ?? 0.22)),
        (d[u.armL] += m * (s.armL || 0) * g),
        (d[u.armR] -= m * (s.armR || 0) * g),
        (d[u.foreL] -= Math.max(0, -m) * (s.armL || 0) * 0.5 * g),
        (d[u.foreR] -= Math.max(0, m) * (s.armR || 0) * 0.5 * g),
        s.carry &&
          ((d[u.armL + 1] += x * s.carry),
          (d[u.armR + 1] += x * s.carry),
          (d[u.armL + 2] += S * 0.8),
          (d[u.armR + 2] += S * 0.8)),
        (d[u.head] += _ * 2 * g),
        s.pitch &&
          ((d[u.spine] -= _ * s.pitch * g),
          (d[u.neck] += _ * s.pitch * 0.5 * g)),
        (b[0] = this.runW),
        y(o, o, d));
    }
    evalKeys(e, t) {
      let n = this._tt,
        r = e.keys,
        i = this.lib;
      if (n <= r[0][0]) {
        t.set(i[r[0][1]]);
        return;
      }
      for (let e = 0; e < r.length - 1; e++) {
        let a = r[e],
          o = r[e + 1];
        if (n < o[0]) {
          let e = (n - a[0]) / Math.max(1e-4, o[0] - a[0]);
          ((b[0] = j(A[o[2] || `s`], e)), y(t, i[a[1]], i[o[1]]));
          return;
        }
      }
      t.set(i[r[r.length - 1][1]]);
    }
    attackTimeline(e, t) {
      let n = this._ta,
        r = this._W,
        i = this._fol,
        a = this.lib,
        o = r * (e.windAt ?? 0.62);
      n < o
        ? ((b[0] = O(T(n / o, 0, 1))), y(t, a[e.ready || e.wind], a[e.wind]))
        : n < r
          ? ((b[0] = D(T((n - o) / Math.max(0.001, r - o), 0, 1))),
            y(t, a[e.wind], a[e.strike]))
          : n < r + i * 2.2
            ? ((b[0] = k(T((n - r) / (i * 2.2), 0, 1), e.overshoot ?? 1.25)),
              y(t, a[e.strike], a[e.follow]))
            : t.set(a[e.follow]);
    }
    secondary(e) {
      let t = this._t,
        n = this._dt,
        r = this.out,
        i = n > 1 / 45 ? 2 : 1,
        a = n / i,
        o = Math.sqrt(this.vFwd * this.vFwd + this.vLat * this.vLat);
      for (let n = 0; n < this.springs.length; n++) {
        let s = this.springs[n],
          c = s.c,
          l = s.idx.length,
          u =
            T(this.vFwd * (c.drag ?? 7), -(c.maxBack ?? 10), c.max ?? 60) +
            (e.dash ? (c.dashKick ?? 25) : 0),
          d = T(
            -this.vLat * (c.side ?? 5) + this.angVel * (c.turn ?? 6),
            -40,
            40,
          );
        for (let e = 0; e < l; e++) {
          let n = (e + 1) / l,
            f =
              Math.sin(t * (c.freq ?? 7) - e * 0.9 + (c.phase || 0)) *
              (c.flutter ?? 3) *
              (0.35 + Math.min(1, o / 3)),
            p = (u * (c.spread ?? 0.6) * (0.4 + n) + f) * g * (c.sign ?? 1),
            m = (d * (0.4 + n) * 0.5 + f * 0.4) * g,
            h = c.k ?? 90,
            _ = c.d ?? 11;
          for (let t = 0; t < i; t++)
            ((s.vx[e] += (h * (p - s.x[e]) - _ * s.vx[e]) * a),
              (s.x[e] += s.vx[e] * a),
              (s.vz[e] += (h * (m - s.z[e]) - _ * s.vz[e]) * a),
              (s.z[e] += s.vz[e] * a));
          let v = s.idx[e] * 3;
          ((r[v + (c.axis === `z` ? 2 : 0)] += s.x[e]),
            (r[v + (c.axis === `z` ? 0 : 2)] += s.z[e]));
        }
      }
    }
  },
  I = new c(),
  L = new c(),
  R = new c(),
  z = new c(),
  B = new s(),
  V = new s(),
  H = new s();
new e();
var U = class {
    constructor(e, t) {
      ((this.solver = t), (this.rig = e.rig));
      let n = e.M,
        r = e.rig,
        i = n.colliders || {};
      ((this.colNames = Object.keys(i)),
        (this.cols = this.colNames.map((e) => {
          let t = i[e];
          return {
            i: r.index(t.bone),
            a: new c(...t.a),
            b: new c(...(t.b || t.a)),
            r: t.r,
          };
        })),
        (this.CA = new Float32Array(this.cols.length * 3)),
        (this.CB = new Float32Array(this.cols.length * 3)),
        (this.followers = (n.anim.followers || []).map((e) => ({
          f: e,
          i: r.index(e.bone),
          hips: r.index(e.hips || `hips`),
          desc: null,
          src: e.src.map((e) => {
            let t = r.index(e);
            return [t, r.parents.findIndex((e) => e === t)];
          }),
        }))),
        (this.chains = (n.anim.cloth || []).map((e, t) => {
          let n = e.bones.map((e) => r.index(e)),
            i = n.length + 1,
            a = n[n.length - 1],
            o = new c(...(e.tip || r.local[a].toArray())),
            s = [];
          for (let e = 0; e < n.length; e++)
            s.push(e + 1 < n.length ? r.local[n[e + 1]].clone() : o.clone());
          let l = new Float32Array(i);
          for (let e = 1; e < i; e++) l[e] = s[e - 1].length();
          let u = new Float32Array(i),
            d = e.stiffRoot ?? 0.3,
            f = e.stiffTip ?? 0.03;
          for (let t = 1; t < i; t++) {
            let n = (t - 1) / Math.max(1, i - 2);
            u[t] = e.stiff
              ? e.stiff[Math.min(e.stiff.length - 1, t - 1)]
              : d * (f / d) ** +n;
          }
          let p = (e.collide || [])
              .map((e) => this.colNames.indexOf(e))
              .filter((e) => e >= 0),
            m = new Set(n),
            h = [];
          for (let e = 0; e < r.names.length; e++) {
            if (m.has(e)) continue;
            let t = r.parents[e];
            for (; t >= 0; ) {
              if (m.has(t)) {
                h.push(e);
                break;
              }
              t = r.parents[t];
            }
          }
          return {
            def: e,
            idx: n,
            n: i,
            off: s,
            L: l,
            stiff: u,
            colIdx: p,
            desc: h,
            plane: e.plane
              ? {
                  i: r.index(e.plane.bone),
                  n: new c(...e.plane.n).normalize(),
                  d: e.plane.d || 0,
                }
              : null,
            phase: e.phase ?? t * 1.37,
            P: new Float32Array(i * 3),
            Q: new Float32Array(i * 3),
            K: new Float32Array(i * 3),
            R0: new Float32Array(3),
            maxCos: Math.cos((e.maxAngle ?? 32) * g),
            maxSin: Math.sin((e.maxAngle ?? 32) * g),
            hang: e.hang ?? 0,
            drag: e.drag ?? 2.2,
            grav: (e.gravity ?? 1) * 9.8,
            flutter: e.flutter ?? 0.5,
            freq: e.freq ?? 6,
            ground: e.ground ?? 0.03,
          };
        })),
        (this.lastT = -99),
        (this.first = !0),
        (this.c = 1),
        (this.s = 0),
        (this.X = 0),
        (this.Y = 0),
        (this.Z = 0),
        (this.speed = 0),
        (this.px = 0),
        (this.pz = 0));
    }
    reset() {
      this.first = !0;
    }
    _w(e, t, n) {
      let r = this.c,
        i = this.s;
      ((e[t] = n.x * r + n.z * i + this.X),
        (e[t + 1] = n.y + this.Y),
        (e[t + 2] = -n.x * i + n.z * r + this.Z));
    }
    follow(e = 0, t = 0) {
      let n = this.solver;
      if (!this.followers.length) return;
      let r = t > 1e-4 ? (e - (this.pLift ?? e)) / t : 0;
      ((this.pLift = e),
        (this.vy =
          (this.vy ?? 0) + (r - (this.vy ?? 0)) * Math.min(1, t * 20)));
      let i =
          e <= 0.02
            ? 0
            : e >= 0.15
              ? 1
              : ((e - 0.02) / 0.13) ** 2 * (3 - (2 * (e - 0.02)) / 0.13),
        a = i * Math.max(-1, Math.min(1, this.vy / 2.5));
      ((this.airK = i), (this.rise = a));
      for (let e = 0; e < this.followers.length; e++) {
        let r = this.followers[e],
          o = r.f,
          s = 0,
          c = 0,
          l = 0;
        H.copy(n.wq[r.hips]).invert();
        for (let e = 0; e < r.src.length; e++) {
          let t = r.src[e][0],
            i = r.src[e][1];
          R.subVectors(n.wp[i], n.wp[t]).applyQuaternion(H);
          let a = Math.sqrt(R.x * R.x + R.y * R.y + R.z * R.z) || 1,
            o = Math.atan2(R.z / a, -R.y / a),
            u = Math.atan2(R.x / a, -R.y / a);
          (o > s && (s = o), -o > c && (c = -o), (l += u * 0.5));
        }
        let u =
            -Math.min(o.maxF ?? 0.9, s * (o.front ?? 0)) +
            Math.min(o.maxB ?? 0.9, c * (o.back ?? 0)),
          d = Math.max(
            -(o.maxS ?? 0.4),
            Math.min(o.maxS ?? 0.4, l * (o.side ?? 0)),
          );
        if (o.dir) {
          R.set(0, -1, 0).applyQuaternion(H);
          let e = Math.acos(Math.max(-1, Math.min(1, -R.y))),
            t =
              e <= 0.61
                ? 0
                : e >= 1.31
                  ? 1
                  : ((e - 0.61) / 0.7) ** 2 * (3 - (2 * (e - 0.61)) / 0.7);
          if (t > 0) {
            let n = Math.sqrt(R.x * R.x + R.z * R.z) || 1,
              r = R.x / n,
              i = R.z / n,
              a = o.dir[0] * r + o.dir[2] * i,
              s = t * Math.max(0, Math.min(1, 0.5 - a)) * (o.gravity ?? 0.6),
              c = 1 - t * Math.max(0, a);
            ((u *= c), (d *= c), (u -= e * i * s), (d += e * r * s));
          }
        }
        if (i > 0 && o.dir) {
          let e = 1 - i * (a > 0 ? 0.8 : 0.55);
          ((u *= e), (d *= e));
          let t = a > 0 ? -0.32 * a : 0.2 * -a;
          ((u -= o.dir[2] * t), (d += o.dir[0] * t));
        }
        if (i > 0 && r.rx != null && t > 0) {
          let e = Math.min(1, t * 10);
          ((u = r.rx + (u - r.rx) * e), (d = r.rz + (d - r.rz) * e));
        }
        ((r.rx = u), (r.rz = d));
        let f = (u + (o.baseX ?? 0) * g) * 0.5,
          p = d * 0.5,
          m = Math.sin(f),
          h = Math.cos(f),
          _ = Math.sin(p),
          v = Math.cos(p),
          y = n.q[r.i];
        if (
          ((y._x = v * m),
          (y._y = _ * m),
          (y._z = h * _),
          (y._w = v * h),
          n.fkBone(r.i),
          !r.desc)
        ) {
          r.desc = [];
          for (let e = 0; e < this.rig.names.length; e++) {
            let t = this.rig.parents[e];
            for (; t >= 0; ) {
              if (t === r.i) {
                r.desc.push(e);
                break;
              }
              t = this.rig.parents[t];
            }
          }
        }
        for (let e = 0; e < r.desc.length; e++) n.fkBone(r.desc[e]);
      }
    }
    step(e, t, n, r, i, a) {
      let o = this.solver,
        s = Math.PI / 2 - r;
      ((this.c = Math.cos(s)),
        (this.s = Math.sin(s)),
        (this.X = e),
        (this.Y = t),
        (this.Z = n));
      let c = this.first || i - this.lastT > 0.35 || i < this.lastT - 0.01,
        l = a > 1e-4 ? (e - this.px) / a : 0,
        u = a > 1e-4 ? (n - this.pz) / a : 0,
        d = Math.min(12, Math.sqrt(l * l + u * u));
      ((this.speed += (d - this.speed) * Math.min(1, a * 8)),
        (this.px = e),
        (this.pz = n),
        (this.first = !1),
        (this.lastT = i));
      for (let e = 0; e < this.cols.length; e++) {
        let t = this.cols[e];
        (o.point(t.i, t.a, I),
          this._w(this.CA, e * 3, I),
          o.point(t.i, t.b, L),
          this._w(this.CB, e * 3, L));
      }
      let f = a <= 0 ? 0 : Math.min(4, Math.max(1, Math.round(a * 60))),
        p = f ? a / f : 0,
        m = this.c,
        h = -this.s;
      for (let r = 0; r < this.chains.length; r++) {
        let s = this.chains[r],
          { n: l, idx: u, K: d, P: g, Q: _, L: v, stiff: y, R0: b } = s;
        for (let e = 0; e < l - 1; e++) this._w(d, e * 3, o.wp[u[e]]);
        if (
          (I.copy(s.off[l - 2])
            .applyQuaternion(o.wq[u[l - 2]])
            .add(o.wp[u[l - 2]]),
          this._w(d, (l - 1) * 3, I),
          s.hang > 0)
        ) {
          let e = d[0],
            t = d[1],
            n = d[2];
          for (let r = 1; r < l; r++) {
            let i = r * 3,
              a = d[i] - e,
              o = d[i + 1] - t,
              c = d[i + 2] - n,
              l = Math.sqrt(a * a + o * o + c * c) || 1e-6;
            ((a = (a / l) * (1 - s.hang)),
              (o = (o / l) * (1 - s.hang) - s.hang),
              (c = (c / l) * (1 - s.hang)));
            let u = v[r] / (Math.sqrt(a * a + o * o + c * c) || 1e-6);
            ((e = d[i] = d[i - 3] + a * u),
              (t = d[i + 1] = d[i - 2] + o * u),
              (n = d[i + 2] = d[i - 1] + c * u));
          }
        }
        let x =
          Math.sqrt(
            (d[0] - b[0]) * (d[0] - b[0]) +
              (d[1] - b[1]) * (d[1] - b[1]) +
              (d[2] - b[2]) * (d[2] - b[2]),
          ) > 2.5;
        if (c || x || !f) {
          (g.set(d), _.set(d), (b[0] = d[0]), (b[1] = d[1]), (b[2] = d[2]));
          continue;
        }
        let S = Math.max(0, 1 - s.drag * p),
          C = s.grav * p * p,
          w = 0,
          T = 0,
          E = 0,
          D = 0,
          O = 0,
          k = 0;
        if (s.plane) {
          let r = s.plane;
          (I.copy(r.n).applyQuaternion(o.wq[r.i]),
            (w = I.x * this.c + I.z * this.s),
            (T = I.y),
            (E = -I.x * this.s + I.z * this.c),
            o.point(r.i, L.set(0, 0, 0), L),
            (D = L.x * this.c + L.z * this.s + e + w * r.d),
            (O = L.y + t + T * r.d),
            (k = -L.x * this.s + L.z * this.c + n + E * r.d));
        }
        for (let e = 0; e < f; e++) {
          let n = (e + 1) / f,
            r = b[0] + (d[0] - b[0]) * n,
            o = b[1] + (d[1] - b[1]) * n,
            c = b[2] + (d[2] - b[2]) * n,
            u = r - d[0],
            x = o - d[1],
            A = c - d[2];
          ((g[0] = r),
            (g[1] = o),
            (g[2] = c),
            (_[0] = r),
            (_[1] = o),
            (_[2] = c));
          let j = i - a + p * (e + 1);
          for (let e = 1; e < l; e++) {
            let t = e * 3,
              n = e / (l - 1),
              r = g[t],
              i = g[t + 1],
              a = g[t + 2],
              o = r + (r - _[t]) * S,
              c = i + (i - _[t + 1]) * S - C,
              f = a + (a - _[t + 2]) * S,
              v =
                Math.sin(j * s.freq + e * 0.9 + s.phase) *
                s.flutter *
                (0.25 + this.speed * 0.35) *
                n *
                p *
                p *
                9;
            ((o += m * v),
              (f += h * v),
              (c += Math.abs(v) * 0.2),
              (_[t] = r),
              (_[t + 1] = i),
              (_[t + 2] = a));
            let b = 1 - (1 - y[e]) ** (p * 60);
            ((o += (d[t] + u - o) * b),
              (c += (d[t + 1] + x - c) * b),
              (f += (d[t + 2] + A - f) * b),
              (g[t] = o),
              (g[t + 1] = c),
              (g[t + 2] = f));
          }
          for (let e = 0; e < 2; e++)
            for (let e = 1; e < l; e++) {
              let n = e * 3,
                r = n - 3,
                i = g[n] - g[r],
                a = g[n + 1] - g[r + 1],
                o = g[n + 2] - g[r + 2],
                c = Math.sqrt(i * i + a * a + o * o) || 1e-6;
              ((i /= c), (a /= c), (o /= c));
              let l = d[n] - d[r],
                u = d[n + 1] - d[r + 1],
                f = d[n + 2] - d[r + 2],
                p = Math.sqrt(l * l + u * u + f * f) || 1e-6;
              ((l /= p), (u /= p), (f /= p));
              let m = i * l + a * u + o * f;
              if (m < s.maxCos) {
                let e = i - l * m,
                  t = a - u * m,
                  n = o - f * m,
                  r = Math.sqrt(e * e + t * t + n * n);
                (r < 1e-5
                  ? ((e = -f), (t = 0), (n = l))
                  : ((e /= r), (t /= r), (n /= r)),
                  (i = l * s.maxCos + e * s.maxSin),
                  (a = u * s.maxCos + t * s.maxSin),
                  (o = f * s.maxCos + n * s.maxSin));
              }
              let h = g[r] + i * v[e],
                _ = g[r + 1] + a * v[e],
                y = g[r + 2] + o * v[e];
              for (let e = 0; e < s.colIdx.length; e++) {
                let t = s.colIdx[e] * 3,
                  n = this.CA[t],
                  r = this.CA[t + 1],
                  i = this.CA[t + 2],
                  a = this.CB[t] - n,
                  o = this.CB[t + 1] - r,
                  c = this.CB[t + 2] - i,
                  l = a * a + o * o + c * c,
                  u =
                    l > 1e-8
                      ? ((h - n) * a + (_ - r) * o + (y - i) * c) / l
                      : 0;
                u = u < 0 ? 0 : u > 1 ? 1 : u;
                let d = n + a * u,
                  f = r + o * u,
                  p = i + c * u,
                  m = h - d,
                  g = _ - f,
                  v = y - p,
                  b = Math.sqrt(m * m + g * g + v * v),
                  x = this.cols[s.colIdx[e]].r;
                if (b < x) {
                  if (b > 1e-5) {
                    let e = x / b;
                    ((h = d + m * e), (_ = f + g * e), (y = p + v * e));
                  } else ((h = d + w * x), (_ = f + T * x), (y = p + E * x));
                }
              }
              if (s.plane) {
                let e = (h - D) * w + (_ - O) * T + (y - k) * E;
                e < 0 && ((h -= w * e), (_ -= T * e), (y -= E * e));
              }
              (_ < t + s.ground && (_ = t + s.ground),
                (g[n] = h),
                (g[n + 1] = _),
                (g[n + 2] = y));
            }
          for (let e = 1; e < l; e++) {
            let t = e * 3,
              n = t - 3,
              r = g[t] - g[n],
              i = g[t + 1] - g[n + 1],
              a = g[t + 2] - g[n + 2],
              o = Math.sqrt(r * r + i * i + a * a) || 1e-6,
              s = v[e] / o;
            ((g[t] = g[n] + r * s),
              (g[t + 1] = g[n + 1] + i * s),
              (g[t + 2] = g[n + 2] + a * s));
          }
        }
        ((b[0] = d[0]), (b[1] = d[1]), (b[2] = d[2]));
        for (let e = 0; e < l - 1; e++) {
          let t = u[e];
          o.fkBone(t);
          let n = e * 3,
            r = g[n + 3] - g[n],
            i = g[n + 4] - g[n + 1],
            a = g[n + 5] - g[n + 2];
          R.set(r * this.c - a * this.s, i, r * this.s + a * this.c);
          let c = R.length();
          if (c < 1e-6) continue;
          (R.multiplyScalar(1 / c),
            z.copy(s.off[e]).applyQuaternion(o.wq[t]).normalize(),
            B.setFromUnitVectors(z, R),
            V.multiplyQuaternions(B, o.wq[t]));
          let l = this.rig.parents[t];
          (l >= 0
            ? o.q[t].copy(H.copy(o.wq[l]).invert().multiply(V))
            : o.q[t].copy(V),
            o.fkBone(t));
        }
        for (let e = 0; e < s.desc.length; e++) o.fkBone(s.desc[e]);
      }
    }
  },
  W = new p(),
  G = 9,
  K = 4,
  q = 33,
  J = new c(),
  Y = new c(),
  X = (e = {}) => (e.showcase == null ? e.unitId == null : !!e.showcase),
  Z = class {
    constructor(e, s = {}) {
      this.type = e;
      let p = C();
      if (
        ((this.unitId = s.unitId ?? null),
        (this.stamp = 0),
        (this.group = new f()),
        (this.group.name = `champion:` + e.id),
        (this.bones = e.rig.createBones()),
        this.group.add(this.bones[0]),
        (this.skeleton = new n(this.bones, e.rig.inverses)),
        (this.material = x({
          height: e.height,
          element: e.element,
          team: s.teamColor || `#3aa6ff`,
          pipeline: s.pipeline,
          rimDir: s.rimDir,
          rimColor: s.rimColor,
          rimStrength: s.rimStrength,
          wetY: s.wetY ?? -1e6,
        })),
        (this.body = new i(e.geometry, this.material)),
        this.body.bind(this.skeleton, W),
        (this.body.castShadow = !0),
        (this.body.receiveShadow = !0),
        (this.body.boundingSphere = new a(
          new c(0, e.height * 0.5, 0),
          e.height * 1.6,
        )),
        this.group.add(this.body),
        e.glowGeometry &&
          ((this.glowMat = $(p.glow)),
          (this.glow = new i(e.glowGeometry, this.glowMat)),
          this.glow.bind(this.skeleton, W),
          (this.glow.frustumCulled = !1),
          (this.glow.renderOrder = 3),
          this.group.add(this.glow)),
        (this.blobMat = new d({
          color: 395274,
          map: p.blob,
          transparent: !0,
          opacity: 0.5,
          depthWrite: !1,
          polygonOffset: !0,
          polygonOffsetFactor: -2,
          polygonOffsetUnits: -4,
        })),
        (this.blob = new u(new l(1, 1).rotateX(-Math.PI / 2), this.blobMat)),
        (this.blob.renderOrder = 1),
        (this.blobBase = (s.radius || 0.6) * 2.9),
        (this.trails = e.trails.map(() => ({
          tip: new Float32Array(27),
          base: new Float32Array(27),
          piv: new Float32Array(27),
          n: 0,
          on: 0,
        }))),
        this.trails.length)
      ) {
        let n = this.trails.length,
          i = new t();
        ((this.trailPos = new o(new Float32Array(n * q * 2 * 3), 3)),
          this.trailPos.setUsage(m),
          (this.trailUV = new o(new Float32Array(n * q * 2 * 2), 2)),
          this.trailUV.setUsage(m));
        let a = [],
          s = [];
        for (let t = 0; t < n; t++) {
          let n = e.trails[t].color;
          for (let e = 0; e < q; e++)
            if (
              (a.push(
                n.r * 0.55,
                n.g * 0.55,
                n.b * 0.55,
                Math.min(4, n.r * 2.6 + 0.35),
                Math.min(4, n.g * 2.6 + 0.35),
                Math.min(4, n.b * 2.6 + 0.35),
              ),
              e < 32)
            ) {
              let n = (t * q + e) * 2;
              s.push(n, n + 2, n + 1, n + 1, n + 2, n + 3);
            }
        }
        (i.setAttribute(`position`, this.trailPos),
          i.setAttribute(`uv`, this.trailUV),
          i.setAttribute(`color`, new r(a, 3)),
          i.setIndex(s),
          (this.trailMat = new d({
            map: p.trail,
            vertexColors: !0,
            transparent: !0,
            blending: 2,
            depthWrite: !1,
            side: 2,
            opacity: 0,
            toneMapped: !1,
          })),
          (this.trailMesh = new u(i, this.trailMat)),
          (this.trailMesh.frustumCulled = !1),
          (this.trailMesh.renderOrder = 4),
          (this.trailMesh.visible = !1));
      }
      ((this.solver = new v(e.rig, e.layout, {
        grips: e.grips,
        kneeOut: e.M.kneeOut,
        elbowPole: e.M.elbowPole,
        aimBone: e.M.aimBone,
      })),
        (this.cloth = new U(e, this.solver)),
        (this.anim = new F(e)),
        (this.anim.showcase = X(s)),
        (this.pivotI = e.rig.index(`chest`)),
        (this.renderX = 0),
        (this.renderZ = 0),
        (this.groundY = 0),
        (this.visible = !1),
        (this.translucent = !1),
        (this.lod = !1),
        (this.materialT = null),
        (this.prepass = null),
        (this.teamKey = ``),
        (this.ready = !1),
        (this.hidden = null));
    }
    attach(e) {
      (e.add(this.group),
        e.add(this.blob),
        this.trailMesh && e.add(this.trailMesh));
    }
    detach() {
      (this.group.removeFromParent(),
        this.blob.removeFromParent(),
        this.trailMesh && this.trailMesh.removeFromParent());
    }
    setTeamColor(e) {
      this.teamKey !== e &&
        ((this.teamKey = e),
        this.material.userData.uniforms.uTeamColor.value.set(e));
    }
    setShowcase(e) {
      this.anim.showcase = !!e;
    }
    hideBones(e) {
      this.hidden = e
        .filter((e) => this.type.rig.has(e))
        .map((e) => this.type.rig.index(e));
    }
    update(e, t, n, r, i, a) {
      n = n > 0.1 ? 0.1 : n > 0 ? n : 0;
      let o = e.prevX + (e.x - e.prevX) * r,
        s = e.prevY + (e.y - e.prevY) * r,
        c = this.groundFn ? this.groundFn(o, s) : h(o, s);
      ((this.groundY =
        Math.abs(c - this.groundY) > 0.6 || !this.ready
          ? c
          : this.groundY + (c - this.groundY) * (1 - Math.exp(-n * 14))),
        (this.renderX = o),
        (this.renderZ = s));
      let l = this.anim,
        u = l.update(e, t, n, r),
        d = i && l.dissolve < 1;
      if (
        ((this.visible = d),
        (this.group.visible = d),
        (this.blob.visible = d),
        !d)
      ) {
        this.trailMesh && (this.trailMesh.visible = !1);
        for (let e = 0; e < this.trails.length; e++) this.trails[e].n = 0;
        this.cloth.reset();
        return;
      }
      (this.group.position.set(o, this.groundY, s),
        this.group.rotation.set(0, Math.PI / 2 - l.facing, 0));
      let f = this.solver;
      (f.solve(u),
        this.cloth.follow(l.lift, n),
        this.cloth.step(o, this.groundY, s, l.facing, t, n));
      for (let e = 0; e < this.bones.length; e++)
        (this.bones[e].position.copy(f.p[e]),
          this.bones[e].quaternion.copy(f.q[e]));
      if (this.hidden)
        for (let e = 0; e < this.hidden.length; e++)
          this.bones[this.hidden[e]].scale.setScalar(1e-4);
      let p = this.material.userData.uniforms;
      ((p.uTime.value = t),
        (p.uFlash.value = l.flash),
        (p.uDissolve.value = l.dissolve),
        (p.uRecall.value = l.recallGlow),
        (p.uEmitBoost.value = 1 + l.emit + l.recallGlow * 0.5),
        (p.uDesat.value = e.alive
          ? 0
          : Math.min(0.35, (t - l.deathStart) * 0.5)),
        (p.uOpacity.value = a ? 0.5 : 1),
        this.setTranslucent(a),
        (this.body.castShadow = l.dissolve < 0.2 && !a),
        this.glowMat &&
          (this.glowMat.opacity =
            (e.alive ? 1 : Math.max(0, 1 - (t - l.deathStart) * 1.5)) *
            (a ? 0.5 : 1) *
            (1 - l.dissolve)));
      let m =
        1 /
        (1 +
          Math.max(
            0,
            f.wp[f.idx.hips].y - this.type.rig.bindWorld[f.idx.hips].y * 0.9,
          ) *
            1.1);
      (this.blob.position.set(o, this.groundY + 0.035, s),
        this.blob.scale.setScalar(
          this.blobBase * (e.alive ? 1 : 1.25) * (0.75 + 0.25 * m),
        ),
        (this.blobMat.opacity = 0.5 * m * (1 - l.dissolve) * (a ? 0.5 : 1)),
        this.updateTrails(n),
        (this.ready = !0));
    }
    setTranslucent(e) {
      e !== this.translucent &&
        ((this.translucent = e),
        e &&
          !this.materialT &&
          ((this.materialT = w(this.material)),
          (this.prepass = new i(this.body.geometry, S())),
          this.prepass.bind(this.skeleton, W),
          (this.prepass.frustumCulled = !1),
          (this.prepass.renderOrder = -1),
          this.group.add(this.prepass)),
        (this.body.material = e ? this.materialT : this.material),
        this.prepass &&
          ((this.prepass.visible = e),
          (this.prepass.geometry = this.body.geometry)));
    }
    setLod(e) {
      (e && !this.type.geometryLod && (e = !1),
        e !== this.lod &&
          ((this.lod = e),
          (this.body.geometry = e ? this.type.geometryLod : this.type.geometry),
          this.prepass && (this.prepass.geometry = this.body.geometry)));
    }
    toWorld(e, t, n) {
      this.solver.point(e, t, J);
      let r = Math.PI / 2 - this.anim.facing,
        i = Math.cos(r),
        a = Math.sin(r);
      return (
        (n.x = this.renderX + J.x * i + J.z * a),
        (n.y = this.groundY + J.y),
        (n.z = this.renderZ - J.x * a + J.z * i),
        n
      );
    }
    updateTrails(e) {
      if (!this.trailMesh) return;
      let t = !1,
        n = 0,
        r = this.trailPos.array,
        i = this.trailUV.array;
      for (let a = 0; a < this.trails.length; a++) {
        let o = this.trails[a],
          s = this.type.trails[a],
          c = this.anim.trail[a] > 0.5;
        if (((o.on = c ? 1 : Math.max(0, o.on - e * 6)), o.on <= 0)) {
          o.n = 0;
          continue;
        }
        if (((t = !0), o.on > n && (n = o.on), c)) {
          if (
            (o.tip.copyWithin(3, 0, 24),
            o.base.copyWithin(3, 0, 24),
            o.piv.copyWithin(3, 0, 24),
            this.toWorld(s.i, s.b, Y),
            (o.tip[0] = Y.x),
            (o.tip[1] = Y.y),
            (o.tip[2] = Y.z),
            this.toWorld(s.i, s.a, Y),
            (o.base[0] = Y.x),
            (o.base[1] = Y.y),
            (o.base[2] = Y.z),
            this.toWorld(this.pivotI, J.set(0, 0, 0), Y),
            (o.piv[0] = Y.x),
            (o.piv[1] = Y.y),
            (o.piv[2] = Y.z),
            o.n === 0)
          )
            for (let e = 1; e < G; e++)
              (o.tip.copyWithin(e * 3, 0, 3),
                o.base.copyWithin(e * 3, 0, 3),
                o.piv.copyWithin(e * 3, 0, 3));
          o.n = Math.min(G, o.n + 1);
        }
        let l = a * q * 2,
          u = (Math.max(2, o.n) - 1) * K;
        for (let e = 0; e < q; e++) {
          let t = (l + e * 2) * 3;
          (Q(o.base, o.piv, e, u, r, t), Q(o.tip, o.piv, e, u, r, t + 3));
          let n = Math.min(1, e / Math.max(1, u)) * 0.999,
            a = (l + e * 2) * 2;
          ((i[a] = n), (i[a + 1] = 0), (i[a + 2] = n), (i[a + 3] = 1));
        }
      }
      ((this.trailMesh.visible = t),
        t &&
          ((this.trailPos.needsUpdate = !0),
          (this.trailUV.needsUpdate = !0),
          (this.trailMat.opacity = n)));
    }
    dispose() {
      (this.detach(),
        this.material.dispose(),
        this.glowMat && this.glowMat.dispose(),
        this.blobMat.dispose(),
        this.blob.geometry.dispose(),
        this.trailMesh &&
          (this.trailMesh.geometry.dispose(), this.trailMat.dispose()),
        this.materialT && this.materialT.dispose(),
        this.prepass && this.prepass.material.dispose(),
        this.skeleton.dispose());
    }
  };
function Q(e, t, n, r, i, a) {
  let o = (n < r ? n : r) / K,
    s = Math.min(7, Math.floor(o)),
    c = o - s,
    l = s * 3,
    u = l + 3,
    d = t[l] + (t[u] - t[l]) * c,
    f = t[l + 1] + (t[u + 1] - t[l + 1]) * c,
    p = t[l + 2] + (t[u + 2] - t[l + 2]) * c,
    m = e[l] - t[l],
    h = e[l + 1] - t[l + 1],
    g = e[l + 2] - t[l + 2],
    _ = e[u] - t[u],
    v = e[u + 1] - t[u + 1],
    y = e[u + 2] - t[u + 2],
    b = Math.sqrt(m * m + h * h + g * g),
    x = Math.sqrt(_ * _ + v * v + y * y);
  if (b < 1e-5 || x < 1e-5) {
    ((i[a] = e[l] + (e[u] - e[l]) * c),
      (i[a + 1] = e[l + 1] + (e[u + 1] - e[l + 1]) * c),
      (i[a + 2] = e[l + 2] + (e[u + 2] - e[l + 2]) * c));
    return;
  }
  let S = Math.max(-1, Math.min(1, (m * _ + h * v + g * y) / (b * x))),
    C = Math.acos(S),
    w = b + (x - b) * c,
    T,
    E;
  if (C < 0.001) ((T = 1 - c), (E = c));
  else {
    let e = Math.sin(C);
    ((T = Math.sin((1 - c) * C) / e), (E = Math.sin(c * C) / e));
  }
  ((i[a] = d + ((m / b) * T + (_ / x) * E) * w),
    (i[a + 1] = f + ((h / b) * T + (v / x) * E) * w),
    (i[a + 2] = p + ((g / b) * T + (y / x) * E) * w));
}
function $(e) {
  let t = new d({
    map: e,
    vertexColors: !0,
    transparent: !0,
    blending: 2,
    depthWrite: !1,
    opacity: 1,
  });
  return (
    (t.onBeforeCompile = (e) => {
      ((e.vertexShader = e.vertexShader
        .replace(
          `#include <common>`,
          `#include <common>
varying float vGlowK;`,
        )
        .replace(
          `#include <project_vertex>`,
          `#include <project_vertex>
  #if defined( USE_SKINNING ) || defined( USE_ENVMAP )
    { float c = dot(normalize(transformedNormal), normalize(-mvPosition.xyz)); vGlowK = c * c; }
  #else
    vGlowK = 1.0 / 3.0;
  #endif`,
        )),
        (e.fragmentShader = e.fragmentShader
          .replace(
            `#include <common>`,
            `#include <common>
varying float vGlowK;`,
          )
          .replace(
            `#include <color_fragment>`,
            `#include <color_fragment>
  diffuseColor.rgb *= vGlowK * 1.15;`,
          )));
    }),
    (t.customProgramCacheKey = () => `champion-glow-v1`),
    t
  );
}
export { Z as ChampionView, $ as glowMaterial, X as heroShowcase };
