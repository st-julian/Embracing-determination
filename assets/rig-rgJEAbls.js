import { B as e, St as t, Yt as n, ut as r, y as i } from "./index-DHK-Ptzs.js";
import { t as a } from "./geo-VdiuQ1XD.js";
var o = class {
  constructor(e) {
    ((this.list = e),
      (this.names = e.map((e) => e.name)),
      (this.map = new Map(this.names.map((e, t) => [e, t]))),
      (this.parents = e.map((e) =>
        e.parent == null ? -1 : this.map.get(e.parent),
      )),
      this.parents.forEach((e, t) => {
        if (e >= t)
          throw Error(`rig: bone ${this.names[t]} listed before its parent`);
        if (e === -1 && t !== 0)
          throw Error(`rig: unknown parent for ${this.names[t]}`);
      }),
      (this.local = e.map((e) => new n(...e.pos))),
      (this.bindWorld = []));
    for (let t = 0; t < e.length; t++)
      this.bindWorld.push(
        this.parents[t] < 0
          ? this.local[t].clone()
          : this.local[t].clone().add(this.bindWorld[this.parents[t]]),
      );
    this.inverses = this.bindWorld.map((e) =>
      new r().makeTranslation(-e.x, -e.y, -e.z),
    );
  }
  index(e) {
    let t = this.map.get(e);
    if (t === void 0) throw Error(`rig: unknown bone ` + e);
    return t;
  }
  has(e) {
    return this.map.has(e);
  }
  bindPos(e) {
    return this.bindWorld[this.index(e)];
  }
  createBones() {
    let e = this.list.map((e, t) => {
      let n = new i();
      return ((n.name = e.name), n.position.copy(this.local[t]), n);
    });
    return (
      e.forEach((t, n) => {
        this.parents[n] >= 0 && e[this.parents[n]].add(t);
      }),
      e
    );
  }
};
function s(e) {
  let t = [],
    n = (e, n, r, i, a) => t.push({ name: e, parent: n, pos: [r, i, a] });
  (n(`root`, null, 0, 0, 0),
    n(`hips`, `root`, 0, e.hipY, e.hipZ || 0),
    n(`spine`, `hips`, 0, e.spineOff, 0),
    n(`chest`, `spine`, 0, e.spine, e.chestZ || 0),
    n(`neck`, `chest`, 0, e.chest, e.neckZ || 0),
    n(`head`, `neck`, 0, e.neck, e.headZ || 0));
  for (let [t, r] of [
    [`L`, 1],
    [`R`, -1],
  ])
    (n(`clav` + t, `chest`, r * e.clavX, e.clavY, e.clavZ || 0),
      n(`arm` + t, `clav` + t, r * e.shoulderX, 0, 0),
      n(`fore` + t, `arm` + t, 0, -e.upperArm, 0),
      n(`hand` + t, `fore` + t, 0, -e.foreArm, 0));
  for (let [t, r] of [
    [`L`, 1],
    [`R`, -1],
  ])
    (n(`thigh` + t, `hips`, r * e.hipX, -(e.hipDrop || 0), 0),
      n(`shin` + t, `thigh` + t, 0, -e.thigh, 0),
      n(`foot` + t, `shin` + t, 0, -e.shin, 0));
  return t;
}
var c =
    /^(spine|chest|neck|head|clav|arm|fore|hand|weapon|prop|orb|ring|tome|scarf|hair|tail|chain|anchor|hood|pony|book|bolt|drum)/,
  l = [
    `ikL`,
    `ikR`,
    `trail`,
    `trail2`,
    `emit`,
    `spin`,
    `glow`,
    `wIK`,
    `wX`,
    `wY`,
    `wZ`,
    `wRX`,
    `wRY`,
    `wRZ`,
  ],
  u = class {
    constructor(e, t = []) {
      ((this.rig = e), (this.nb = e.names.length));
      let n = this.nb * 3;
      ((this.hipT = n),
        (n += 3),
        (this.rootT = n),
        (n += 3),
        (this.footL = n),
        (n += 4),
        (this.footR = n),
        (n += 4),
        (this.scalar = {}));
      for (let e of [...l, ...t]) this.scalar[e] = n++;
      ((this.size = n),
        (this.upperMask = new Float32Array(n)),
        (this.fullMask = new Float32Array(n).fill(1)),
        (this.lowerMask = new Float32Array(n)));
      for (let t = 0; t < this.nb; t++) {
        let n = +!!c.test(e.names[t]);
        for (let e = 0; e < 3; e++)
          ((this.upperMask[t * 3 + e] = n),
            (this.lowerMask[t * 3 + e] = 1 - n));
      }
      for (let e in this.scalar) this.upperMask[this.scalar[e]] = 1;
      for (let e = this.hipT; e < this.scalar[l[0]]; e++) this.lowerMask[e] = 1;
    }
    compile(e, t = null) {
      let n = t ? new Float32Array(t) : new Float32Array(this.size);
      for (let t in e) {
        let r = e[t];
        if (t === `hipT` || t === `rootT`) {
          let e = this[t];
          for (let t = 0; t < 3; t++) n[e + t] = r[t] || 0;
        } else if (t === `footL` || t === `footR`) {
          let e = this[t];
          ((n[e] = r[0] || 0),
            (n[e + 1] = r[1] || 0),
            (n[e + 2] = r[2] || 0),
            (n[e + 3] = (r[3] || 0) * a));
        } else if (t in this.scalar) n[this.scalar[t]] = r;
        else if (this.rig.has(t)) {
          let e = this.rig.index(t) * 3;
          ((n[e] = (r[0] || 0) * a),
            (n[e + 1] = (r[1] || 0) * a),
            (n[e + 2] = (r[2] || 0) * a));
        } else throw Error(`pose: unknown channel ` + t);
      }
      return n;
    }
    library(e) {
      let t = {},
        n = (r, i = []) => {
          if (t[r]) return t[r];
          let a = e[r];
          if (!a) throw Error(`pose: unknown pose ` + r);
          if (i.includes(r)) throw Error(`pose: cycle ` + i.join(`>`));
          let o =
              a.extends === null || r === `stance`
                ? null
                : n(a.extends || `stance`, [...i, r]),
            { extends: s, ...c } = a;
          return ((t[r] = this.compile(c, o)), t[r]);
        };
      for (let t in e) n(t);
      return t;
    }
  },
  d = new Float64Array(1);
function f(e, t, n, r) {
  let i = d[0];
  if (r)
    for (let a = 0; a < e.length; a++) e[a] = t[a] + (n[a] - t[a]) * i * r[a];
  else for (let r = 0; r < e.length; r++) e[r] = t[r] + (n[r] - t[r]) * i;
  return e;
}
function p(e, t, n) {
  let r = d[0];
  if (n) for (let i = 0; i < e.length; i++) e[i] += t[i] * r * n[i];
  else for (let n = 0; n < e.length; n++) e[n] += t[n] * r;
  return e;
}
var m = new e(0, 0, 0, `ZXY`),
  h = new r(),
  g = new t(),
  _ = new t(),
  v = new n(),
  y = new t(),
  b = new t(),
  x = new n(),
  S = new n(),
  C = new n(),
  w = new n(),
  T = new n(),
  E = new n(),
  D = new n(),
  O = new n(),
  k = class {
    constructor(r, i, o = {}) {
      ((this.rig = r), (this.L = i));
      let s = r.names.length;
      ((this.q = Array.from({ length: s }, () => new t())),
        (this.p = r.local.map((e) => e.clone())),
        (this.wq = Array.from({ length: s }, () => new t())),
        (this.wp = Array.from({ length: s }, () => new n())));
      let c = (e) => (r.has(e) ? r.index(e) : -1);
      ((this.idx = {
        root: c(`root`),
        hips: c(`hips`),
        chest: c(`chest`),
        thighL: c(`thighL`),
        shinL: c(`shinL`),
        footL: c(`footL`),
        thighR: c(`thighR`),
        shinR: c(`shinR`),
        footR: c(`footR`),
        armL: c(`armL`),
        foreL: c(`foreL`),
        handL: c(`handL`),
        armR: c(`armR`),
        foreR: c(`foreR`),
        handR: c(`handR`),
      }),
        (this.grips = o.grips || {}),
        (this.gripBone = {}));
      for (let i of [`L`, `R`])
        if (this.grips[i]) {
          let o = this.grips[i];
          this.gripBone[i] = {
            i: r.index(o.bone),
            p: new n(...o.p),
            q: o.q
              ? new t().setFromEuler(
                  new e(o.q[0] * a, o.q[1] * a, o.q[2] * a, `XYZ`),
                )
              : null,
          };
        }
      ((this._w = 1),
        (this.aimBone = o.aimBone ? r.index(o.aimBone) : -1),
        (this.aimSide =
          o.aimBone && r.names[r.parents[this.aimBone]].endsWith(`L`)
            ? `L`
            : `R`),
        (this.kneeOut = o.kneeOut ?? 0.18),
        (this.elbowPole = o.elbowPole || [0.55, -0.35, -0.75]),
        (this.legLen = {
          a: r.local[this.idx.shinL].length(),
          b: r.local[this.idx.footL].length(),
        }),
        (this.side = {
          L: {
            thigh: this.idx.thighL,
            shin: this.idx.shinL,
            foot: this.idx.footL,
            arm: this.idx.armL,
            fore: this.idx.foreL,
            hand: this.idx.handL,
            sgn: 1,
          },
          R: {
            thigh: this.idx.thighR,
            shin: this.idx.shinR,
            foot: this.idx.footR,
            arm: this.idx.armR,
            fore: this.idx.foreR,
            hand: this.idx.handR,
            sgn: -1,
          },
        }),
        (this.armLen = {
          a: r.local[this.idx.foreL].length(),
          b: r.local[this.idx.handL].length(),
        }));
    }
    fk(e = 0) {
      let t = this.rig.parents;
      for (let n = e; n < this.q.length; n++) {
        let e = t[n];
        e < 0
          ? (this.wq[n].copy(this.q[n]), this.wp[n].copy(this.p[n]))
          : (this.wq[n].multiplyQuaternions(this.wq[e], this.q[n]),
            this.wp[n]
              .copy(this.p[n])
              .applyQuaternion(this.wq[e])
              .add(this.wp[e]));
      }
    }
    fkBone(e) {
      let t = this.rig.parents[e];
      t < 0
        ? (this.wq[e].copy(this.q[e]), this.wp[e].copy(this.p[e]))
        : (this.wq[e].multiplyQuaternions(this.wq[t], this.q[e]),
          this.wp[e]
            .copy(this.p[e])
            .applyQuaternion(this.wq[t])
            .add(this.wp[t]));
    }
    solve(e) {
      let t = this.L,
        n = this.rig,
        r = this.q.length;
      for (let t = 0; t < r; t++)
        (m.set(e[t * 3], e[t * 3 + 1], e[t * 3 + 2], `ZXY`),
          this.q[t].setFromEuler(m),
          this.p[t].copy(n.local[t]));
      let { root: i, hips: a } = this.idx;
      ((this.p[i].x += e[t.rootT]),
        (this.p[i].y += e[t.rootT + 1]),
        (this.p[i].z += e[t.rootT + 2]),
        (this.p[a].x += e[t.hipT]),
        (this.p[a].y += e[t.hipT + 1]),
        (this.p[a].z += e[t.hipT + 2]),
        this.fk(),
        this.leg(`L`, e, t.footL),
        this.leg(`R`, e, t.footR),
        this.fk(Math.min(this.idx.thighL, this.idx.thighR)));
      let o = e[t.scalar.wIK];
      o > 0.001 &&
        this.aimBone >= 0 &&
        ((this._w = o < 1 ? o : 1), this.aim(e));
      let s = e[t.scalar.ikL],
        c = e[t.scalar.ikR];
      (s > 0.001 &&
        this.gripBone.L &&
        ((this._w = s),
        this.arm(`L`),
        this.fk(this.idx.armL),
        this.gripBone.L.q && this.gripHand(`L`, s)),
        c > 0.001 &&
          this.gripBone.R &&
          ((this._w = c),
          this.arm(`R`),
          this.fk(this.idx.armR),
          this.gripBone.R.q && this.gripHand(`R`, c)));
    }
    leg(e, t, n) {
      let r = this.side[e],
        i = r.thigh,
        a = r.shin,
        o = r.foot,
        s = this.idx.root,
        c = this.idx.hips,
        l = this.wp[i];
      (x.copy(this.rig.bindWorld[o]),
        (x.x += t[n]),
        (x.y += t[n + 1]),
        (x.z += t[n + 2]),
        x.applyQuaternion(this.wq[s]).add(this.wp[s]));
      let u = this.legLen.a,
        d = this.legLen.b;
      S.subVectors(x, l);
      let f = Math.sqrt(S.x * S.x + S.y * S.y + S.z * S.z),
        p = 1 / (f > 1e-5 ? f : 1e-5);
      ((S.x *= p), (S.y *= p), (S.z *= p));
      let m = S,
        v = Math.abs(u - d) + 0.001,
        y = u + d - 0.001;
      ((f = f < v ? v : f > y ? y : f),
        C.set(r.sgn * this.kneeOut, 0, 1).applyQuaternion(this.wq[c]));
      let b = C.x * m.x + C.y * m.y + C.z * m.z;
      ((C.x -= m.x * b), (C.y -= m.y * b), (C.z -= m.z * b), C.normalize());
      let w = (u * u + f * f - d * d) / (2 * u * f);
      w = w > 1 ? 1 : w < -1 ? -1 : w;
      let k = Math.sqrt(1 - w * w),
        A = u * w,
        j = u * k;
      ((T.x = l.x + m.x * A + C.x * j),
        (T.y = l.y + m.y * A + C.y * j),
        (T.z = l.z + m.z * A + C.z * j),
        D.subVectors(l, T).normalize(),
        (b = C.x * D.x + C.y * D.y + C.z * D.z),
        (O.x = C.x - D.x * b),
        (O.y = C.y - D.y * b),
        (O.z = C.z - D.z * b),
        O.normalize(),
        E.crossVectors(D, O),
        h.makeBasis(E, D, O),
        g.setFromRotationMatrix(h),
        this.q[i].copy(_.copy(this.wq[c]).invert().multiply(g)),
        this.wq[i].copy(g),
        D.subVectors(T, x).normalize(),
        O.crossVectors(E, D),
        h.makeBasis(E, D, O),
        _.setFromRotationMatrix(h),
        this.q[a].copy(g.invert().multiply(_)),
        this.wq[a].copy(_));
      let M = t[n + 3] * 0.5;
      ((g._x = Math.sin(M)),
        (g._y = 0),
        (g._z = 0),
        (g._w = Math.cos(M)),
        g.premultiply(this.wq[s]),
        this.q[o].copy(_.invert().multiply(g)));
    }
    gripHand(e, t) {
      let n = this.gripBone[e],
        r = this.side[e];
      (y.multiplyQuaternions(this.wq[n.i], n.q),
        _.copy(this.wq[r.fore]).invert().multiply(y),
        t >= 0.999 ? this.q[r.hand].copy(_) : this.q[r.hand].slerp(_, t),
        this.fk(r.hand));
    }
    arm(e) {
      let t = this.gripBone[e];
      this.armTo(
        e,
        v.copy(t.p).applyQuaternion(this.wq[t.i]).add(this.wp[t.i]),
      );
    }
    armTo(e, t) {
      let n = this._w,
        r = this.side[e],
        i = r.arm,
        a = r.fore,
        o = this.wp[i],
        s = this.rig.parents[i];
      x.copy(t);
      let c = this.armLen.a,
        l = this.armLen.b;
      S.subVectors(x, o);
      let u = Math.sqrt(S.x * S.x + S.y * S.y + S.z * S.z),
        d = 1 / (u > 1e-5 ? u : 1e-5);
      ((S.x *= d), (S.y *= d), (S.z *= d));
      let f = S,
        p = Math.abs(c - l) + 0.001,
        m = c + l - 0.001;
      u = u < p ? p : u > m ? m : u;
      let v = this.elbowPole;
      ((C.x = r.sgn * v[0]),
        (C.y = v[1]),
        (C.z = v[2]),
        C.applyQuaternion(this.wq[this.idx.chest]));
      let y = C.x * f.x + C.y * f.y + C.z * f.z;
      ((C.x -= f.x * y), (C.y -= f.y * y), (C.z -= f.z * y), C.normalize());
      let b = (c * c + u * u - l * l) / (2 * c * u);
      b = b > 1 ? 1 : b < -1 ? -1 : b;
      let w = Math.sqrt(1 - b * b),
        k = c * b,
        A = c * w;
      ((T.x = o.x + f.x * k + C.x * A),
        (T.y = o.y + f.y * k + C.y * A),
        (T.z = o.z + f.z * k + C.z * A),
        D.subVectors(o, T).normalize());
      let j = C.x * D.x + C.y * D.y + C.z * D.z;
      ((O.x = C.x - D.x * j),
        (O.y = C.y - D.y * j),
        (O.z = C.z - D.z * j),
        O.normalize(),
        E.crossVectors(D, O),
        h.makeBasis(E, D, O),
        g.setFromRotationMatrix(h),
        _.copy(this.wq[s]).invert().multiply(g),
        n >= 0.999 ? this.q[i].copy(_) : this.q[i].slerp(_, n),
        this.wq[i].multiplyQuaternions(this.wq[s], this.q[i]),
        D.subVectors(T, x).normalize(),
        O.crossVectors(E, D),
        h.makeBasis(E, D, O),
        _.setFromRotationMatrix(h));
      let M = g.copy(this.wq[i]).invert().multiply(_);
      n >= 0.999 ? this.q[a].copy(M) : this.q[a].slerp(M, n);
    }
    aim(e) {
      let t = this._w,
        n = this.L.scalar,
        r = this.aimBone,
        i = this.aimSide,
        o = this.idx.root,
        s = this.side[i],
        c = s.hand,
        l = s.fore,
        u = s.arm;
      (m.set(e[n.wRX] * a, e[n.wRY] * a, e[n.wRZ] * a, `YXZ`),
        y.setFromEuler(m).premultiply(this.wq[o]),
        b.copy(this.q[r]).invert().premultiply(y),
        v
          .set(e[n.wX], e[n.wY], e[n.wZ])
          .applyQuaternion(this.wq[o])
          .add(this.wp[o]),
        v.sub(w.copy(this.p[r]).applyQuaternion(b)),
        this.armTo(i, v),
        this.fk(u),
        _.copy(this.wq[l]).invert().multiply(b),
        t >= 0.999 ? this.q[c].copy(_) : this.q[c].slerp(_, t),
        this.fk(u));
    }
    point(e, t, n) {
      return n.copy(t).applyQuaternion(this.wq[e]).add(this.wp[e]);
    }
  };
export { p as a, k as i, u as n, s as o, o as r, f as s, d as t };
