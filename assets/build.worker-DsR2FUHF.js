(function () {
  /**
   * @license
   * Copyright 2010-2026 Three.js Authors
   * SPDX-License-Identifier: MIT
   */
  let e = 1e3,
    t = 1001,
    n = 1002,
    r = 2300,
    i = 2301,
    a = 2302,
    o = 2303,
    s = 2400,
    c = 2401,
    l = 2402,
    u = `srgb`,
    d = `srgb-linear`,
    f = `linear`,
    p = 2e3;
  function m(e) {
    for (let t = e.length - 1; t >= 0; --t) if (e[t] >= 65535) return !0;
    return !1;
  }
  function h(e) {
    return ArrayBuffer.isView(e) && !(e instanceof DataView);
  }
  function g(e) {
    return document.createElementNS(`http://www.w3.org/1999/xhtml`, e);
  }
  let _ = {};
  function v(e) {
    let t = e[0];
    if (typeof t == `string` && t.startsWith(`TSL:`)) {
      let t = e[1];
      t && t.isStackTrace
        ? (e[0] += ` ` + t.getLocation())
        : (e[1] = `Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.`);
    }
    return e;
  }
  function y(...e) {
    e = v(e);
    let t = `THREE.` + e.shift();
    {
      let n = e[0];
      n && n.isStackTrace ? console.warn(n.getError(t)) : console.warn(t, ...e);
    }
  }
  function b(...e) {
    e = v(e);
    let t = `THREE.` + e.shift();
    {
      let n = e[0];
      n && n.isStackTrace
        ? console.error(n.getError(t))
        : console.error(t, ...e);
    }
  }
  function x(...e) {
    let t = e.join(` `);
    t in _ || ((_[t] = !0), y(...e));
  }
  var S = class {
    addEventListener(e, t) {
      this._listeners === void 0 && (this._listeners = {});
      let n = this._listeners;
      (n[e] === void 0 && (n[e] = []), n[e].indexOf(t) === -1 && n[e].push(t));
    }
    hasEventListener(e, t) {
      let n = this._listeners;
      return n !== void 0 && n[e] !== void 0 && n[e].indexOf(t) !== -1;
    }
    removeEventListener(e, t) {
      let n = this._listeners;
      if (n === void 0) return;
      let r = n[e];
      if (r !== void 0) {
        let e = r.indexOf(t);
        e !== -1 && r.splice(e, 1);
      }
    }
    dispatchEvent(e) {
      let t = this._listeners;
      if (t === void 0) return;
      let n = t[e.type];
      if (n !== void 0) {
        e.target = this;
        let t = n.slice(0);
        for (let n = 0, r = t.length; n < r; n++) t[n].call(this, e);
        e.target = null;
      }
    }
  };
  let C =
    /* @__PURE__ */ `00.01.02.03.04.05.06.07.08.09.0a.0b.0c.0d.0e.0f.10.11.12.13.14.15.16.17.18.19.1a.1b.1c.1d.1e.1f.20.21.22.23.24.25.26.27.28.29.2a.2b.2c.2d.2e.2f.30.31.32.33.34.35.36.37.38.39.3a.3b.3c.3d.3e.3f.40.41.42.43.44.45.46.47.48.49.4a.4b.4c.4d.4e.4f.50.51.52.53.54.55.56.57.58.59.5a.5b.5c.5d.5e.5f.60.61.62.63.64.65.66.67.68.69.6a.6b.6c.6d.6e.6f.70.71.72.73.74.75.76.77.78.79.7a.7b.7c.7d.7e.7f.80.81.82.83.84.85.86.87.88.89.8a.8b.8c.8d.8e.8f.90.91.92.93.94.95.96.97.98.99.9a.9b.9c.9d.9e.9f.a0.a1.a2.a3.a4.a5.a6.a7.a8.a9.aa.ab.ac.ad.ae.af.b0.b1.b2.b3.b4.b5.b6.b7.b8.b9.ba.bb.bc.bd.be.bf.c0.c1.c2.c3.c4.c5.c6.c7.c8.c9.ca.cb.cc.cd.ce.cf.d0.d1.d2.d3.d4.d5.d6.d7.d8.d9.da.db.dc.dd.de.df.e0.e1.e2.e3.e4.e5.e6.e7.e8.e9.ea.eb.ec.ed.ee.ef.f0.f1.f2.f3.f4.f5.f6.f7.f8.f9.fa.fb.fc.fd.fe.ff`.split(
      `.`,
    );
  function w() {
    let e = (Math.random() * 4294967295) | 0,
      t = (Math.random() * 4294967295) | 0,
      n = (Math.random() * 4294967295) | 0,
      r = (Math.random() * 4294967295) | 0;
    return (
      C[e & 255] +
      C[(e >> 8) & 255] +
      C[(e >> 16) & 255] +
      C[(e >> 24) & 255] +
      `-` +
      C[t & 255] +
      C[(t >> 8) & 255] +
      `-` +
      C[((t >> 16) & 15) | 64] +
      C[(t >> 24) & 255] +
      `-` +
      C[(n & 63) | 128] +
      C[(n >> 8) & 255] +
      `-` +
      C[(n >> 16) & 255] +
      C[(n >> 24) & 255] +
      C[r & 255] +
      C[(r >> 8) & 255] +
      C[(r >> 16) & 255] +
      C[(r >> 24) & 255]
    ).toLowerCase();
  }
  function T(e, t, n) {
    return Math.max(t, Math.min(n, e));
  }
  function E(e, t) {
    return ((e % t) + t) % t;
  }
  function D(e, t, n) {
    return (1 - n) * e + n * t;
  }
  function O(e, t) {
    switch (t.constructor) {
      case Float32Array:
        return e;
      case Uint32Array:
        return e / 4294967295;
      case Uint16Array:
        return e / 65535;
      case Uint8Array:
      case Uint8ClampedArray:
        return e / 255;
      case Int32Array:
        return Math.max(e / 2147483647, -1);
      case Int16Array:
        return Math.max(e / 32767, -1);
      case Int8Array:
        return Math.max(e / 127, -1);
      default:
        throw Error(`THREE.MathUtils: Invalid component type.`);
    }
  }
  function k(e, t) {
    switch (t.constructor) {
      case Float32Array:
        return e;
      case Uint32Array:
        return Math.round(e * 4294967295);
      case Uint16Array:
        return Math.round(e * 65535);
      case Uint8Array:
      case Uint8ClampedArray:
        return Math.round(e * 255);
      case Int32Array:
        return Math.round(e * 2147483647);
      case Int16Array:
        return Math.round(e * 32767);
      case Int8Array:
        return Math.round(e * 127);
      default:
        throw Error(`THREE.MathUtils: Invalid component type.`);
    }
  }
  var A = class e {
      static {
        e.prototype.isVector2 = !0;
      }
      constructor(e = 0, t = 0) {
        ((this.x = e), (this.y = t));
      }
      get width() {
        return this.x;
      }
      set width(e) {
        this.x = e;
      }
      get height() {
        return this.y;
      }
      set height(e) {
        this.y = e;
      }
      set(e, t) {
        return ((this.x = e), (this.y = t), this);
      }
      setScalar(e) {
        return ((this.x = e), (this.y = e), this);
      }
      setX(e) {
        return ((this.x = e), this);
      }
      setY(e) {
        return ((this.y = e), this);
      }
      setComponent(e, t) {
        switch (e) {
          case 0:
            this.x = t;
            break;
          case 1:
            this.y = t;
            break;
          default:
            throw Error(`THREE.Vector2: index is out of range: ` + e);
        }
        return this;
      }
      getComponent(e) {
        switch (e) {
          case 0:
            return this.x;
          case 1:
            return this.y;
          default:
            throw Error(`THREE.Vector2: index is out of range: ` + e);
        }
      }
      clone() {
        return new this.constructor(this.x, this.y);
      }
      copy(e) {
        return ((this.x = e.x), (this.y = e.y), this);
      }
      add(e) {
        return ((this.x += e.x), (this.y += e.y), this);
      }
      addScalar(e) {
        return ((this.x += e), (this.y += e), this);
      }
      addVectors(e, t) {
        return ((this.x = e.x + t.x), (this.y = e.y + t.y), this);
      }
      addScaledVector(e, t) {
        return ((this.x += e.x * t), (this.y += e.y * t), this);
      }
      sub(e) {
        return ((this.x -= e.x), (this.y -= e.y), this);
      }
      subScalar(e) {
        return ((this.x -= e), (this.y -= e), this);
      }
      subVectors(e, t) {
        return ((this.x = e.x - t.x), (this.y = e.y - t.y), this);
      }
      multiply(e) {
        return ((this.x *= e.x), (this.y *= e.y), this);
      }
      multiplyScalar(e) {
        return ((this.x *= e), (this.y *= e), this);
      }
      divide(e) {
        return ((this.x /= e.x), (this.y /= e.y), this);
      }
      divideScalar(e) {
        return this.multiplyScalar(1 / e);
      }
      applyMatrix3(e) {
        let t = this.x,
          n = this.y,
          r = e.elements;
        return (
          (this.x = r[0] * t + r[3] * n + r[6]),
          (this.y = r[1] * t + r[4] * n + r[7]),
          this
        );
      }
      min(e) {
        return (
          (this.x = Math.min(this.x, e.x)),
          (this.y = Math.min(this.y, e.y)),
          this
        );
      }
      max(e) {
        return (
          (this.x = Math.max(this.x, e.x)),
          (this.y = Math.max(this.y, e.y)),
          this
        );
      }
      clamp(e, t) {
        return (
          (this.x = T(this.x, e.x, t.x)),
          (this.y = T(this.y, e.y, t.y)),
          this
        );
      }
      clampScalar(e, t) {
        return ((this.x = T(this.x, e, t)), (this.y = T(this.y, e, t)), this);
      }
      clampLength(e, t) {
        let n = this.length();
        return this.divideScalar(n || 1).multiplyScalar(T(n, e, t));
      }
      floor() {
        return (
          (this.x = Math.floor(this.x)),
          (this.y = Math.floor(this.y)),
          this
        );
      }
      ceil() {
        return (
          (this.x = Math.ceil(this.x)),
          (this.y = Math.ceil(this.y)),
          this
        );
      }
      round() {
        return (
          (this.x = Math.round(this.x)),
          (this.y = Math.round(this.y)),
          this
        );
      }
      roundToZero() {
        return (
          (this.x = Math.trunc(this.x)),
          (this.y = Math.trunc(this.y)),
          this
        );
      }
      negate() {
        return ((this.x = -this.x), (this.y = -this.y), this);
      }
      dot(e) {
        return this.x * e.x + this.y * e.y;
      }
      cross(e) {
        return this.x * e.y - this.y * e.x;
      }
      lengthSq() {
        return this.x * this.x + this.y * this.y;
      }
      length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
      }
      manhattanLength() {
        return Math.abs(this.x) + Math.abs(this.y);
      }
      normalize() {
        return this.divideScalar(this.length() || 1);
      }
      angle() {
        return Math.atan2(-this.y, -this.x) + Math.PI;
      }
      angleTo(e) {
        let t = Math.sqrt(this.lengthSq() * e.lengthSq());
        if (t === 0) return Math.PI / 2;
        let n = this.dot(e) / t;
        return Math.acos(T(n, -1, 1));
      }
      distanceTo(e) {
        return Math.sqrt(this.distanceToSquared(e));
      }
      distanceToSquared(e) {
        let t = this.x - e.x,
          n = this.y - e.y;
        return t * t + n * n;
      }
      manhattanDistanceTo(e) {
        return Math.abs(this.x - e.x) + Math.abs(this.y - e.y);
      }
      setLength(e) {
        return this.normalize().multiplyScalar(e);
      }
      lerp(e, t) {
        return (
          (this.x += (e.x - this.x) * t),
          (this.y += (e.y - this.y) * t),
          this
        );
      }
      lerpVectors(e, t, n) {
        return (
          (this.x = e.x + (t.x - e.x) * n),
          (this.y = e.y + (t.y - e.y) * n),
          this
        );
      }
      equals(e) {
        return e.x === this.x && e.y === this.y;
      }
      fromArray(e, t = 0) {
        return ((this.x = e[t]), (this.y = e[t + 1]), this);
      }
      toArray(e = [], t = 0) {
        return ((e[t] = this.x), (e[t + 1] = this.y), e);
      }
      fromBufferAttribute(e, t) {
        return ((this.x = e.getX(t)), (this.y = e.getY(t)), this);
      }
      rotateAround(e, t) {
        let n = Math.cos(t),
          r = Math.sin(t),
          i = this.x - e.x,
          a = this.y - e.y;
        return (
          (this.x = i * n - a * r + e.x),
          (this.y = i * r + a * n + e.y),
          this
        );
      }
      random() {
        return ((this.x = Math.random()), (this.y = Math.random()), this);
      }
      *[Symbol.iterator]() {
        (yield this.x, yield this.y);
      }
    },
    j = class {
      constructor(e = 0, t = 0, n = 0, r = 1) {
        ((this.isQuaternion = !0),
          (this._x = e),
          (this._y = t),
          (this._z = n),
          (this._w = r));
      }
      static slerpFlat(e, t, n, r, i, a, o) {
        let s = n[r + 0],
          c = n[r + 1],
          l = n[r + 2],
          u = n[r + 3],
          d = i[a + 0],
          f = i[a + 1],
          p = i[a + 2],
          m = i[a + 3];
        if (u !== m || s !== d || c !== f || l !== p) {
          let e = s * d + c * f + l * p + u * m;
          e < 0 && ((d = -d), (f = -f), (p = -p), (m = -m), (e = -e));
          let t = 1 - o;
          if (e < 0.9995) {
            let n = Math.acos(e),
              r = Math.sin(n);
            ((t = Math.sin(t * n) / r),
              (o = Math.sin(o * n) / r),
              (s = s * t + d * o),
              (c = c * t + f * o),
              (l = l * t + p * o),
              (u = u * t + m * o));
          } else {
            ((s = s * t + d * o),
              (c = c * t + f * o),
              (l = l * t + p * o),
              (u = u * t + m * o));
            let e = 1 / Math.sqrt(s * s + c * c + l * l + u * u);
            ((s *= e), (c *= e), (l *= e), (u *= e));
          }
        }
        ((e[t] = s), (e[t + 1] = c), (e[t + 2] = l), (e[t + 3] = u));
      }
      static multiplyQuaternionsFlat(e, t, n, r, i, a) {
        let o = n[r],
          s = n[r + 1],
          c = n[r + 2],
          l = n[r + 3],
          u = i[a],
          d = i[a + 1],
          f = i[a + 2],
          p = i[a + 3];
        return (
          (e[t] = o * p + l * u + s * f - c * d),
          (e[t + 1] = s * p + l * d + c * u - o * f),
          (e[t + 2] = c * p + l * f + o * d - s * u),
          (e[t + 3] = l * p - o * u - s * d - c * f),
          e
        );
      }
      get x() {
        return this._x;
      }
      set x(e) {
        ((this._x = e), this._onChangeCallback());
      }
      get y() {
        return this._y;
      }
      set y(e) {
        ((this._y = e), this._onChangeCallback());
      }
      get z() {
        return this._z;
      }
      set z(e) {
        ((this._z = e), this._onChangeCallback());
      }
      get w() {
        return this._w;
      }
      set w(e) {
        ((this._w = e), this._onChangeCallback());
      }
      set(e, t, n, r) {
        return (
          (this._x = e),
          (this._y = t),
          (this._z = n),
          (this._w = r),
          this._onChangeCallback(),
          this
        );
      }
      clone() {
        return new this.constructor(this._x, this._y, this._z, this._w);
      }
      copy(e) {
        return (
          (this._x = e.x),
          (this._y = e.y),
          (this._z = e.z),
          (this._w = e.w),
          this._onChangeCallback(),
          this
        );
      }
      setFromEuler(e, t = !0) {
        let n = e._x,
          r = e._y,
          i = e._z,
          a = e._order,
          o = Math.cos,
          s = Math.sin,
          c = o(n / 2),
          l = o(r / 2),
          u = o(i / 2),
          d = s(n / 2),
          f = s(r / 2),
          p = s(i / 2);
        switch (a) {
          case `XYZ`:
            ((this._x = d * l * u + c * f * p),
              (this._y = c * f * u - d * l * p),
              (this._z = c * l * p + d * f * u),
              (this._w = c * l * u - d * f * p));
            break;
          case `YXZ`:
            ((this._x = d * l * u + c * f * p),
              (this._y = c * f * u - d * l * p),
              (this._z = c * l * p - d * f * u),
              (this._w = c * l * u + d * f * p));
            break;
          case `ZXY`:
            ((this._x = d * l * u - c * f * p),
              (this._y = c * f * u + d * l * p),
              (this._z = c * l * p + d * f * u),
              (this._w = c * l * u - d * f * p));
            break;
          case `ZYX`:
            ((this._x = d * l * u - c * f * p),
              (this._y = c * f * u + d * l * p),
              (this._z = c * l * p - d * f * u),
              (this._w = c * l * u + d * f * p));
            break;
          case `YZX`:
            ((this._x = d * l * u + c * f * p),
              (this._y = c * f * u + d * l * p),
              (this._z = c * l * p - d * f * u),
              (this._w = c * l * u - d * f * p));
            break;
          case `XZY`:
            ((this._x = d * l * u - c * f * p),
              (this._y = c * f * u - d * l * p),
              (this._z = c * l * p + d * f * u),
              (this._w = c * l * u + d * f * p));
            break;
          default:
            y(`Quaternion: .setFromEuler() encountered an unknown order: ` + a);
        }
        return (t === !0 && this._onChangeCallback(), this);
      }
      setFromAxisAngle(e, t) {
        let n = t / 2,
          r = Math.sin(n);
        return (
          (this._x = e.x * r),
          (this._y = e.y * r),
          (this._z = e.z * r),
          (this._w = Math.cos(n)),
          this._onChangeCallback(),
          this
        );
      }
      setFromRotationMatrix(e) {
        let t = e.elements,
          n = t[0],
          r = t[4],
          i = t[8],
          a = t[1],
          o = t[5],
          s = t[9],
          c = t[2],
          l = t[6],
          u = t[10],
          d = n + o + u;
        if (d > 0) {
          let e = 0.5 / Math.sqrt(d + 1);
          ((this._w = 0.25 / e),
            (this._x = (l - s) * e),
            (this._y = (i - c) * e),
            (this._z = (a - r) * e));
        } else if (n > o && n > u) {
          let e = 2 * Math.sqrt(1 + n - o - u);
          ((this._w = (l - s) / e),
            (this._x = 0.25 * e),
            (this._y = (r + a) / e),
            (this._z = (i + c) / e));
        } else if (o > u) {
          let e = 2 * Math.sqrt(1 + o - n - u);
          ((this._w = (i - c) / e),
            (this._x = (r + a) / e),
            (this._y = 0.25 * e),
            (this._z = (s + l) / e));
        } else {
          let e = 2 * Math.sqrt(1 + u - n - o);
          ((this._w = (a - r) / e),
            (this._x = (i + c) / e),
            (this._y = (s + l) / e),
            (this._z = 0.25 * e));
        }
        return (this._onChangeCallback(), this);
      }
      setFromUnitVectors(e, t) {
        let n = e.dot(t) + 1;
        return (
          n < 1e-8
            ? ((n = 0),
              Math.abs(e.x) > Math.abs(e.z)
                ? ((this._x = -e.y),
                  (this._y = e.x),
                  (this._z = 0),
                  (this._w = n))
                : ((this._x = 0),
                  (this._y = -e.z),
                  (this._z = e.y),
                  (this._w = n)))
            : ((this._x = e.y * t.z - e.z * t.y),
              (this._y = e.z * t.x - e.x * t.z),
              (this._z = e.x * t.y - e.y * t.x),
              (this._w = n)),
          this.normalize()
        );
      }
      angleTo(e) {
        return 2 * Math.acos(Math.abs(T(this.dot(e), -1, 1)));
      }
      rotateTowards(e, t) {
        let n = this.angleTo(e);
        if (n === 0) return this;
        let r = Math.min(1, t / n);
        return (this.slerp(e, r), this);
      }
      identity() {
        return this.set(0, 0, 0, 1);
      }
      invert() {
        return this.conjugate();
      }
      conjugate() {
        return (
          (this._x *= -1),
          (this._y *= -1),
          (this._z *= -1),
          this._onChangeCallback(),
          this
        );
      }
      dot(e) {
        return (
          this._x * e._x + this._y * e._y + this._z * e._z + this._w * e._w
        );
      }
      lengthSq() {
        return (
          this._x * this._x +
          this._y * this._y +
          this._z * this._z +
          this._w * this._w
        );
      }
      length() {
        return Math.sqrt(
          this._x * this._x +
            this._y * this._y +
            this._z * this._z +
            this._w * this._w,
        );
      }
      normalize() {
        let e = this.length();
        return (
          e === 0
            ? ((this._x = 0), (this._y = 0), (this._z = 0), (this._w = 1))
            : ((e = 1 / e),
              (this._x *= e),
              (this._y *= e),
              (this._z *= e),
              (this._w *= e)),
          this._onChangeCallback(),
          this
        );
      }
      multiply(e) {
        return this.multiplyQuaternions(this, e);
      }
      premultiply(e) {
        return this.multiplyQuaternions(e, this);
      }
      multiplyQuaternions(e, t) {
        let n = e._x,
          r = e._y,
          i = e._z,
          a = e._w,
          o = t._x,
          s = t._y,
          c = t._z,
          l = t._w;
        return (
          (this._x = n * l + a * o + r * c - i * s),
          (this._y = r * l + a * s + i * o - n * c),
          (this._z = i * l + a * c + n * s - r * o),
          (this._w = a * l - n * o - r * s - i * c),
          this._onChangeCallback(),
          this
        );
      }
      slerp(e, t) {
        let n = e._x,
          r = e._y,
          i = e._z,
          a = e._w,
          o = this.dot(e);
        o < 0 && ((n = -n), (r = -r), (i = -i), (a = -a), (o = -o));
        let s = 1 - t;
        if (o < 0.9995) {
          let e = Math.acos(o),
            c = Math.sin(e);
          ((s = Math.sin(s * e) / c),
            (t = Math.sin(t * e) / c),
            (this._x = this._x * s + n * t),
            (this._y = this._y * s + r * t),
            (this._z = this._z * s + i * t),
            (this._w = this._w * s + a * t),
            this._onChangeCallback());
        } else
          ((this._x = this._x * s + n * t),
            (this._y = this._y * s + r * t),
            (this._z = this._z * s + i * t),
            (this._w = this._w * s + a * t),
            this.normalize());
        return this;
      }
      slerpQuaternions(e, t, n) {
        return this.copy(e).slerp(t, n);
      }
      random() {
        let e = 2 * Math.PI * Math.random(),
          t = 2 * Math.PI * Math.random(),
          n = Math.random(),
          r = Math.sqrt(1 - n),
          i = Math.sqrt(n);
        return this.set(
          r * Math.sin(e),
          r * Math.cos(e),
          i * Math.sin(t),
          i * Math.cos(t),
        );
      }
      equals(e) {
        return (
          e._x === this._x &&
          e._y === this._y &&
          e._z === this._z &&
          e._w === this._w
        );
      }
      fromArray(e, t = 0) {
        return (
          (this._x = e[t]),
          (this._y = e[t + 1]),
          (this._z = e[t + 2]),
          (this._w = e[t + 3]),
          this._onChangeCallback(),
          this
        );
      }
      toArray(e = [], t = 0) {
        return (
          (e[t] = this._x),
          (e[t + 1] = this._y),
          (e[t + 2] = this._z),
          (e[t + 3] = this._w),
          e
        );
      }
      fromBufferAttribute(e, t) {
        return (
          (this._x = e.getX(t)),
          (this._y = e.getY(t)),
          (this._z = e.getZ(t)),
          (this._w = e.getW(t)),
          this._onChangeCallback(),
          this
        );
      }
      toJSON() {
        return this.toArray();
      }
      _onChange(e) {
        return ((this._onChangeCallback = e), this);
      }
      _onChangeCallback() {}
      *[Symbol.iterator]() {
        (yield this._x, yield this._y, yield this._z, yield this._w);
      }
    },
    M = class e {
      static {
        e.prototype.isVector3 = !0;
      }
      constructor(e = 0, t = 0, n = 0) {
        ((this.x = e), (this.y = t), (this.z = n));
      }
      set(e, t, n) {
        return (
          n === void 0 && (n = this.z),
          (this.x = e),
          (this.y = t),
          (this.z = n),
          this
        );
      }
      setScalar(e) {
        return ((this.x = e), (this.y = e), (this.z = e), this);
      }
      setX(e) {
        return ((this.x = e), this);
      }
      setY(e) {
        return ((this.y = e), this);
      }
      setZ(e) {
        return ((this.z = e), this);
      }
      setComponent(e, t) {
        switch (e) {
          case 0:
            this.x = t;
            break;
          case 1:
            this.y = t;
            break;
          case 2:
            this.z = t;
            break;
          default:
            throw Error(`THREE.Vector3: index is out of range: ` + e);
        }
        return this;
      }
      getComponent(e) {
        switch (e) {
          case 0:
            return this.x;
          case 1:
            return this.y;
          case 2:
            return this.z;
          default:
            throw Error(`THREE.Vector3: index is out of range: ` + e);
        }
      }
      clone() {
        return new this.constructor(this.x, this.y, this.z);
      }
      copy(e) {
        return ((this.x = e.x), (this.y = e.y), (this.z = e.z), this);
      }
      add(e) {
        return ((this.x += e.x), (this.y += e.y), (this.z += e.z), this);
      }
      addScalar(e) {
        return ((this.x += e), (this.y += e), (this.z += e), this);
      }
      addVectors(e, t) {
        return (
          (this.x = e.x + t.x),
          (this.y = e.y + t.y),
          (this.z = e.z + t.z),
          this
        );
      }
      addScaledVector(e, t) {
        return (
          (this.x += e.x * t),
          (this.y += e.y * t),
          (this.z += e.z * t),
          this
        );
      }
      sub(e) {
        return ((this.x -= e.x), (this.y -= e.y), (this.z -= e.z), this);
      }
      subScalar(e) {
        return ((this.x -= e), (this.y -= e), (this.z -= e), this);
      }
      subVectors(e, t) {
        return (
          (this.x = e.x - t.x),
          (this.y = e.y - t.y),
          (this.z = e.z - t.z),
          this
        );
      }
      multiply(e) {
        return ((this.x *= e.x), (this.y *= e.y), (this.z *= e.z), this);
      }
      multiplyScalar(e) {
        return ((this.x *= e), (this.y *= e), (this.z *= e), this);
      }
      multiplyVectors(e, t) {
        return (
          (this.x = e.x * t.x),
          (this.y = e.y * t.y),
          (this.z = e.z * t.z),
          this
        );
      }
      applyEuler(e) {
        return this.applyQuaternion(N.setFromEuler(e));
      }
      applyAxisAngle(e, t) {
        return this.applyQuaternion(N.setFromAxisAngle(e, t));
      }
      applyMatrix3(e) {
        let t = this.x,
          n = this.y,
          r = this.z,
          i = e.elements;
        return (
          (this.x = i[0] * t + i[3] * n + i[6] * r),
          (this.y = i[1] * t + i[4] * n + i[7] * r),
          (this.z = i[2] * t + i[5] * n + i[8] * r),
          this
        );
      }
      applyNormalMatrix(e) {
        return this.applyMatrix3(e).normalize();
      }
      applyMatrix4(e) {
        let t = this.x,
          n = this.y,
          r = this.z,
          i = e.elements,
          a = 1 / (i[3] * t + i[7] * n + i[11] * r + i[15]);
        return (
          (this.x = (i[0] * t + i[4] * n + i[8] * r + i[12]) * a),
          (this.y = (i[1] * t + i[5] * n + i[9] * r + i[13]) * a),
          (this.z = (i[2] * t + i[6] * n + i[10] * r + i[14]) * a),
          this
        );
      }
      applyQuaternion(e) {
        let t = this.x,
          n = this.y,
          r = this.z,
          i = e.x,
          a = e.y,
          o = e.z,
          s = e.w,
          c = 2 * (a * r - o * n),
          l = 2 * (o * t - i * r),
          u = 2 * (i * n - a * t);
        return (
          (this.x = t + s * c + a * u - o * l),
          (this.y = n + s * l + o * c - i * u),
          (this.z = r + s * u + i * l - a * c),
          this
        );
      }
      project(e) {
        return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(
          e.projectionMatrix,
        );
      }
      unproject(e) {
        return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(
          e.matrixWorld,
        );
      }
      transformDirection(e) {
        let t = this.x,
          n = this.y,
          r = this.z,
          i = e.elements;
        return (
          (this.x = i[0] * t + i[4] * n + i[8] * r),
          (this.y = i[1] * t + i[5] * n + i[9] * r),
          (this.z = i[2] * t + i[6] * n + i[10] * r),
          this.normalize()
        );
      }
      divide(e) {
        return ((this.x /= e.x), (this.y /= e.y), (this.z /= e.z), this);
      }
      divideScalar(e) {
        return this.multiplyScalar(1 / e);
      }
      min(e) {
        return (
          (this.x = Math.min(this.x, e.x)),
          (this.y = Math.min(this.y, e.y)),
          (this.z = Math.min(this.z, e.z)),
          this
        );
      }
      max(e) {
        return (
          (this.x = Math.max(this.x, e.x)),
          (this.y = Math.max(this.y, e.y)),
          (this.z = Math.max(this.z, e.z)),
          this
        );
      }
      clamp(e, t) {
        return (
          (this.x = T(this.x, e.x, t.x)),
          (this.y = T(this.y, e.y, t.y)),
          (this.z = T(this.z, e.z, t.z)),
          this
        );
      }
      clampScalar(e, t) {
        return (
          (this.x = T(this.x, e, t)),
          (this.y = T(this.y, e, t)),
          (this.z = T(this.z, e, t)),
          this
        );
      }
      clampLength(e, t) {
        let n = this.length();
        return this.divideScalar(n || 1).multiplyScalar(T(n, e, t));
      }
      floor() {
        return (
          (this.x = Math.floor(this.x)),
          (this.y = Math.floor(this.y)),
          (this.z = Math.floor(this.z)),
          this
        );
      }
      ceil() {
        return (
          (this.x = Math.ceil(this.x)),
          (this.y = Math.ceil(this.y)),
          (this.z = Math.ceil(this.z)),
          this
        );
      }
      round() {
        return (
          (this.x = Math.round(this.x)),
          (this.y = Math.round(this.y)),
          (this.z = Math.round(this.z)),
          this
        );
      }
      roundToZero() {
        return (
          (this.x = Math.trunc(this.x)),
          (this.y = Math.trunc(this.y)),
          (this.z = Math.trunc(this.z)),
          this
        );
      }
      negate() {
        return (
          (this.x = -this.x),
          (this.y = -this.y),
          (this.z = -this.z),
          this
        );
      }
      dot(e) {
        return this.x * e.x + this.y * e.y + this.z * e.z;
      }
      lengthSq() {
        return this.x * this.x + this.y * this.y + this.z * this.z;
      }
      length() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
      }
      manhattanLength() {
        return Math.abs(this.x) + Math.abs(this.y) + Math.abs(this.z);
      }
      normalize() {
        return this.divideScalar(this.length() || 1);
      }
      setLength(e) {
        return this.normalize().multiplyScalar(e);
      }
      lerp(e, t) {
        return (
          (this.x += (e.x - this.x) * t),
          (this.y += (e.y - this.y) * t),
          (this.z += (e.z - this.z) * t),
          this
        );
      }
      lerpVectors(e, t, n) {
        return (
          (this.x = e.x + (t.x - e.x) * n),
          (this.y = e.y + (t.y - e.y) * n),
          (this.z = e.z + (t.z - e.z) * n),
          this
        );
      }
      cross(e) {
        return this.crossVectors(this, e);
      }
      crossVectors(e, t) {
        let n = e.x,
          r = e.y,
          i = e.z,
          a = t.x,
          o = t.y,
          s = t.z;
        return (
          (this.x = r * s - i * o),
          (this.y = i * a - n * s),
          (this.z = n * o - r * a),
          this
        );
      }
      projectOnVector(e) {
        let t = e.lengthSq();
        if (t === 0) return this.set(0, 0, 0);
        let n = e.dot(this) / t;
        return this.copy(e).multiplyScalar(n);
      }
      projectOnPlane(e) {
        return (ee.copy(this).projectOnVector(e), this.sub(ee));
      }
      reflect(e) {
        return this.sub(ee.copy(e).multiplyScalar(2 * this.dot(e)));
      }
      angleTo(e) {
        let t = Math.sqrt(this.lengthSq() * e.lengthSq());
        if (t === 0) return Math.PI / 2;
        let n = this.dot(e) / t;
        return Math.acos(T(n, -1, 1));
      }
      distanceTo(e) {
        return Math.sqrt(this.distanceToSquared(e));
      }
      distanceToSquared(e) {
        let t = this.x - e.x,
          n = this.y - e.y,
          r = this.z - e.z;
        return t * t + n * n + r * r;
      }
      manhattanDistanceTo(e) {
        return (
          Math.abs(this.x - e.x) +
          Math.abs(this.y - e.y) +
          Math.abs(this.z - e.z)
        );
      }
      setFromSpherical(e) {
        return this.setFromSphericalCoords(e.radius, e.phi, e.theta);
      }
      setFromSphericalCoords(e, t, n) {
        let r = Math.sin(t) * e;
        return (
          (this.x = r * Math.sin(n)),
          (this.y = Math.cos(t) * e),
          (this.z = r * Math.cos(n)),
          this
        );
      }
      setFromCylindrical(e) {
        return this.setFromCylindricalCoords(e.radius, e.theta, e.y);
      }
      setFromCylindricalCoords(e, t, n) {
        return (
          (this.x = e * Math.sin(t)),
          (this.y = n),
          (this.z = e * Math.cos(t)),
          this
        );
      }
      setFromMatrixPosition(e) {
        let t = e.elements;
        return ((this.x = t[12]), (this.y = t[13]), (this.z = t[14]), this);
      }
      setFromMatrixScale(e) {
        let t = this.setFromMatrixColumn(e, 0).length(),
          n = this.setFromMatrixColumn(e, 1).length(),
          r = this.setFromMatrixColumn(e, 2).length();
        return ((this.x = t), (this.y = n), (this.z = r), this);
      }
      setFromMatrixColumn(e, t) {
        return this.fromArray(e.elements, t * 4);
      }
      setFromMatrix3Column(e, t) {
        return this.fromArray(e.elements, t * 3);
      }
      setFromEuler(e) {
        return ((this.x = e._x), (this.y = e._y), (this.z = e._z), this);
      }
      setFromColor(e) {
        return ((this.x = e.r), (this.y = e.g), (this.z = e.b), this);
      }
      equals(e) {
        return e.x === this.x && e.y === this.y && e.z === this.z;
      }
      fromArray(e, t = 0) {
        return (
          (this.x = e[t]),
          (this.y = e[t + 1]),
          (this.z = e[t + 2]),
          this
        );
      }
      toArray(e = [], t = 0) {
        return ((e[t] = this.x), (e[t + 1] = this.y), (e[t + 2] = this.z), e);
      }
      fromBufferAttribute(e, t) {
        return (
          (this.x = e.getX(t)),
          (this.y = e.getY(t)),
          (this.z = e.getZ(t)),
          this
        );
      }
      random() {
        return (
          (this.x = Math.random()),
          (this.y = Math.random()),
          (this.z = Math.random()),
          this
        );
      }
      randomDirection() {
        let e = Math.random() * Math.PI * 2,
          t = Math.random() * 2 - 1,
          n = Math.sqrt(1 - t * t);
        return (
          (this.x = n * Math.cos(e)),
          (this.y = t),
          (this.z = n * Math.sin(e)),
          this
        );
      }
      *[Symbol.iterator]() {
        (yield this.x, yield this.y, yield this.z);
      }
    };
  let ee = /*@__PURE__*/ new M(),
    N = /*@__PURE__*/ new j();
  var P = class e {
    static {
      e.prototype.isMatrix3 = !0;
    }
    constructor(e, t, n, r, i, a, o, s, c) {
      ((this.elements = [1, 0, 0, 0, 1, 0, 0, 0, 1]),
        e !== void 0 && this.set(e, t, n, r, i, a, o, s, c));
    }
    set(e, t, n, r, i, a, o, s, c) {
      let l = this.elements;
      return (
        (l[0] = e),
        (l[1] = r),
        (l[2] = o),
        (l[3] = t),
        (l[4] = i),
        (l[5] = s),
        (l[6] = n),
        (l[7] = a),
        (l[8] = c),
        this
      );
    }
    identity() {
      return (this.set(1, 0, 0, 0, 1, 0, 0, 0, 1), this);
    }
    copy(e) {
      let t = this.elements,
        n = e.elements;
      return (
        (t[0] = n[0]),
        (t[1] = n[1]),
        (t[2] = n[2]),
        (t[3] = n[3]),
        (t[4] = n[4]),
        (t[5] = n[5]),
        (t[6] = n[6]),
        (t[7] = n[7]),
        (t[8] = n[8]),
        this
      );
    }
    extractBasis(e, t, n) {
      return (
        e.setFromMatrix3Column(this, 0),
        t.setFromMatrix3Column(this, 1),
        n.setFromMatrix3Column(this, 2),
        this
      );
    }
    setFromMatrix4(e) {
      let t = e.elements;
      return (
        this.set(t[0], t[4], t[8], t[1], t[5], t[9], t[2], t[6], t[10]),
        this
      );
    }
    multiply(e) {
      return this.multiplyMatrices(this, e);
    }
    premultiply(e) {
      return this.multiplyMatrices(e, this);
    }
    multiplyMatrices(e, t) {
      let n = e.elements,
        r = t.elements,
        i = this.elements,
        a = n[0],
        o = n[3],
        s = n[6],
        c = n[1],
        l = n[4],
        u = n[7],
        d = n[2],
        f = n[5],
        p = n[8],
        m = r[0],
        h = r[3],
        g = r[6],
        _ = r[1],
        v = r[4],
        y = r[7],
        b = r[2],
        x = r[5],
        S = r[8];
      return (
        (i[0] = a * m + o * _ + s * b),
        (i[3] = a * h + o * v + s * x),
        (i[6] = a * g + o * y + s * S),
        (i[1] = c * m + l * _ + u * b),
        (i[4] = c * h + l * v + u * x),
        (i[7] = c * g + l * y + u * S),
        (i[2] = d * m + f * _ + p * b),
        (i[5] = d * h + f * v + p * x),
        (i[8] = d * g + f * y + p * S),
        this
      );
    }
    multiplyScalar(e) {
      let t = this.elements;
      return (
        (t[0] *= e),
        (t[3] *= e),
        (t[6] *= e),
        (t[1] *= e),
        (t[4] *= e),
        (t[7] *= e),
        (t[2] *= e),
        (t[5] *= e),
        (t[8] *= e),
        this
      );
    }
    determinant() {
      let e = this.elements,
        t = e[0],
        n = e[1],
        r = e[2],
        i = e[3],
        a = e[4],
        o = e[5],
        s = e[6],
        c = e[7],
        l = e[8];
      return (
        t * a * l - t * o * c - n * i * l + n * o * s + r * i * c - r * a * s
      );
    }
    invert() {
      let e = this.elements,
        t = e[0],
        n = e[1],
        r = e[2],
        i = e[3],
        a = e[4],
        o = e[5],
        s = e[6],
        c = e[7],
        l = e[8],
        u = l * a - o * c,
        d = o * s - l * i,
        f = c * i - a * s,
        p = t * u + n * d + r * f;
      if (p === 0) return this.set(0, 0, 0, 0, 0, 0, 0, 0, 0);
      let m = 1 / p;
      return (
        (e[0] = u * m),
        (e[1] = (r * c - l * n) * m),
        (e[2] = (o * n - r * a) * m),
        (e[3] = d * m),
        (e[4] = (l * t - r * s) * m),
        (e[5] = (r * i - o * t) * m),
        (e[6] = f * m),
        (e[7] = (n * s - c * t) * m),
        (e[8] = (a * t - n * i) * m),
        this
      );
    }
    transpose() {
      let e,
        t = this.elements;
      return (
        (e = t[1]),
        (t[1] = t[3]),
        (t[3] = e),
        (e = t[2]),
        (t[2] = t[6]),
        (t[6] = e),
        (e = t[5]),
        (t[5] = t[7]),
        (t[7] = e),
        this
      );
    }
    getNormalMatrix(e) {
      return this.setFromMatrix4(e).invert().transpose();
    }
    transposeIntoArray(e) {
      let t = this.elements;
      return (
        (e[0] = t[0]),
        (e[1] = t[3]),
        (e[2] = t[6]),
        (e[3] = t[1]),
        (e[4] = t[4]),
        (e[5] = t[7]),
        (e[6] = t[2]),
        (e[7] = t[5]),
        (e[8] = t[8]),
        this
      );
    }
    setUvTransform(e, t, n, r, i, a, o) {
      let s = Math.cos(i),
        c = Math.sin(i);
      return (
        this.set(
          n * s,
          n * c,
          -n * (s * a + c * o) + a + e,
          -r * c,
          r * s,
          -r * (-c * a + s * o) + o + t,
          0,
          0,
          1,
        ),
        this
      );
    }
    scale(e, t) {
      return (
        x(`Matrix3: .scale() is deprecated. Use .makeScale() instead.`),
        this.premultiply(F.makeScale(e, t)),
        this
      );
    }
    rotate(e) {
      return (
        x(`Matrix3: .rotate() is deprecated. Use .makeRotation() instead.`),
        this.premultiply(F.makeRotation(-e)),
        this
      );
    }
    translate(e, t) {
      return (
        x(
          `Matrix3: .translate() is deprecated. Use .makeTranslation() instead.`,
        ),
        this.premultiply(F.makeTranslation(e, t)),
        this
      );
    }
    makeTranslation(e, t) {
      return (
        e.isVector2
          ? this.set(1, 0, e.x, 0, 1, e.y, 0, 0, 1)
          : this.set(1, 0, e, 0, 1, t, 0, 0, 1),
        this
      );
    }
    makeRotation(e) {
      let t = Math.cos(e),
        n = Math.sin(e);
      return (this.set(t, -n, 0, n, t, 0, 0, 0, 1), this);
    }
    makeScale(e, t) {
      return (this.set(e, 0, 0, 0, t, 0, 0, 0, 1), this);
    }
    equals(e) {
      let t = this.elements,
        n = e.elements;
      for (let e = 0; e < 9; e++) if (t[e] !== n[e]) return !1;
      return !0;
    }
    fromArray(e, t = 0) {
      for (let n = 0; n < 9; n++) this.elements[n] = e[n + t];
      return this;
    }
    toArray(e = [], t = 0) {
      let n = this.elements;
      return (
        (e[t] = n[0]),
        (e[t + 1] = n[1]),
        (e[t + 2] = n[2]),
        (e[t + 3] = n[3]),
        (e[t + 4] = n[4]),
        (e[t + 5] = n[5]),
        (e[t + 6] = n[6]),
        (e[t + 7] = n[7]),
        (e[t + 8] = n[8]),
        e
      );
    }
    clone() {
      return new this.constructor().fromArray(this.elements);
    }
  };
  let F = /*@__PURE__*/ new P(),
    I = /*@__PURE__*/ new P().set(
      0.4123908,
      0.3575843,
      0.1804808,
      0.212639,
      0.7151687,
      0.0721923,
      0.0193308,
      0.1191948,
      0.9505322,
    ),
    L = /*@__PURE__*/ new P().set(
      3.2409699,
      -1.5373832,
      -0.4986108,
      -0.9692436,
      1.8759675,
      0.0415551,
      0.0556301,
      -0.203977,
      1.0569715,
    );
  function te() {
    let e = {
        enabled: !0,
        workingColorSpace: d,
        spaces: {},
        convert: function (e, t, n) {
          return this.enabled === !1 || t === n || !t || !n
            ? e
            : (this.spaces[t].transfer === `srgb` &&
                ((e.r = ne(e.r)), (e.g = ne(e.g)), (e.b = ne(e.b))),
              this.spaces[t].primaries !== this.spaces[n].primaries &&
                (e.applyMatrix3(this.spaces[t].toXYZ),
                e.applyMatrix3(this.spaces[n].fromXYZ)),
              this.spaces[n].transfer === `srgb` &&
                ((e.r = re(e.r)), (e.g = re(e.g)), (e.b = re(e.b))),
              e);
        },
        workingToColorSpace: function (e, t) {
          return this.convert(e, this.workingColorSpace, t);
        },
        colorSpaceToWorking: function (e, t) {
          return this.convert(e, t, this.workingColorSpace);
        },
        getPrimaries: function (e) {
          return this.spaces[e].primaries;
        },
        getTransfer: function (e) {
          return e === `` ? f : this.spaces[e].transfer;
        },
        getToneMappingMode: function (e) {
          return (
            this.spaces[e].outputColorSpaceConfig.toneMappingMode || `standard`
          );
        },
        getLuminanceCoefficients: function (e, t = this.workingColorSpace) {
          return e.fromArray(this.spaces[t].luminanceCoefficients);
        },
        define: function (e) {
          Object.assign(this.spaces, e);
        },
        _getMatrix: function (e, t, n) {
          return e.copy(this.spaces[t].toXYZ).multiply(this.spaces[n].fromXYZ);
        },
        _getDrawingBufferColorSpace: function (e) {
          return this.spaces[e].outputColorSpaceConfig.drawingBufferColorSpace;
        },
        _getUnpackColorSpace: function (e = this.workingColorSpace) {
          return this.spaces[e].workingColorSpaceConfig.unpackColorSpace;
        },
        fromWorkingColorSpace: function (t, n) {
          return (
            x(
              `ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace().`,
            ),
            e.workingToColorSpace(t, n)
          );
        },
        toWorkingColorSpace: function (t, n) {
          return (
            x(
              `ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking().`,
            ),
            e.colorSpaceToWorking(t, n)
          );
        },
      },
      t = [0.64, 0.33, 0.3, 0.6, 0.15, 0.06],
      n = [0.2126, 0.7152, 0.0722],
      r = [0.3127, 0.329];
    return (
      e.define({
        [d]: {
          primaries: t,
          whitePoint: r,
          transfer: f,
          toXYZ: I,
          fromXYZ: L,
          luminanceCoefficients: n,
          workingColorSpaceConfig: { unpackColorSpace: u },
          outputColorSpaceConfig: { drawingBufferColorSpace: u },
        },
        [u]: {
          primaries: t,
          whitePoint: r,
          transfer: `srgb`,
          toXYZ: I,
          fromXYZ: L,
          luminanceCoefficients: n,
          outputColorSpaceConfig: { drawingBufferColorSpace: u },
        },
      }),
      e
    );
  }
  let R = /*@__PURE__*/ te();
  function ne(e) {
    return e < 0.04045
      ? e * 0.0773993808
      : (e * 0.9478672986 + 0.0521327014) ** 2.4;
  }
  function re(e) {
    return e < 0.0031308 ? e * 12.92 : 1.055 * e ** 0.41666 - 0.055;
  }
  let z;
  var B = class {
    static getDataURL(e, t = `image/png`) {
      if (/^data:/i.test(e.src) || typeof HTMLCanvasElement > `u`) return e.src;
      let n;
      if (e instanceof HTMLCanvasElement) n = e;
      else {
        (z === void 0 && (z = g(`canvas`)),
          (z.width = e.width),
          (z.height = e.height));
        let t = z.getContext(`2d`);
        (e instanceof ImageData
          ? t.putImageData(e, 0, 0)
          : t.drawImage(e, 0, 0, e.width, e.height),
          (n = z));
      }
      return n.toDataURL(t);
    }
    static sRGBToLinear(e) {
      if (
        (typeof HTMLImageElement < `u` && e instanceof HTMLImageElement) ||
        (typeof HTMLCanvasElement < `u` && e instanceof HTMLCanvasElement) ||
        (typeof ImageBitmap < `u` && e instanceof ImageBitmap)
      ) {
        let t = g(`canvas`);
        ((t.width = e.width), (t.height = e.height));
        let n = t.getContext(`2d`);
        n.drawImage(e, 0, 0, e.width, e.height);
        let r = n.getImageData(0, 0, e.width, e.height),
          i = r.data;
        for (let e = 0; e < i.length; e++) i[e] = ne(i[e] / 255) * 255;
        return (n.putImageData(r, 0, 0), t);
      }
      if (e.data) {
        let t = e.data.slice(0);
        for (let e = 0; e < t.length; e++)
          t instanceof Uint8Array || t instanceof Uint8ClampedArray
            ? (t[e] = Math.floor(ne(t[e] / 255) * 255))
            : (t[e] = ne(t[e]));
        return { data: t, width: e.width, height: e.height };
      }
      return (
        y(
          `ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied.`,
        ),
        e
      );
    }
  };
  let ie = 0;
  var ae = class {
    constructor(e = null) {
      ((this.isTextureSource = !0),
        Object.defineProperty(this, "id", { value: ie++ }),
        (this.uuid = w()),
        (this.data = e),
        (this.dataReady = !0),
        (this.version = 0));
    }
    getSize(e) {
      let t = this.data;
      return (
        typeof HTMLVideoElement < `u` && t instanceof HTMLVideoElement
          ? e.set(t.videoWidth, t.videoHeight, 0)
          : typeof VideoFrame < `u` && t instanceof VideoFrame
            ? e.set(t.displayWidth, t.displayHeight, 0)
            : t === null
              ? e.set(0, 0, 0)
              : e.set(t.width, t.height, t.depth || 0),
        e
      );
    }
    set needsUpdate(e) {
      e === !0 && this.version++;
    }
    toJSON(e) {
      let t = e === void 0 || typeof e == `string`;
      if (!t && e.images[this.uuid] !== void 0) return e.images[this.uuid];
      let n = { uuid: this.uuid, url: `` },
        r = this.data;
      if (r !== null) {
        let e;
        if (Array.isArray(r)) {
          e = [];
          for (let t = 0, n = r.length; t < n; t++)
            r[t].isDataTexture ? e.push(oe(r[t].image)) : e.push(oe(r[t]));
        } else e = oe(r);
        n.url = e;
      }
      return (t || (e.images[this.uuid] = n), n);
    }
  };
  function oe(e) {
    return (typeof HTMLImageElement < `u` && e instanceof HTMLImageElement) ||
      (typeof HTMLCanvasElement < `u` && e instanceof HTMLCanvasElement) ||
      (typeof ImageBitmap < `u` && e instanceof ImageBitmap)
      ? B.getDataURL(e)
      : e.data
        ? {
            data: Array.from(e.data),
            width: e.width,
            height: e.height,
            type: e.data.constructor.name,
          }
        : (y(`Texture: Unable to serialize Texture.`), {});
  }
  let se = 0,
    ce = /*@__PURE__*/ new M();
  var le = class r extends S {
    constructor(
      e = r.DEFAULT_IMAGE,
      n = r.DEFAULT_MAPPING,
      i = t,
      a = t,
      o = 1006,
      s = 1008,
      c = 1023,
      l = 1009,
      u = r.DEFAULT_ANISOTROPY,
      d = ``,
    ) {
      (super(),
        (this.isTexture = !0),
        Object.defineProperty(this, "id", { value: se++ }),
        (this.uuid = w()),
        (this.name = ``),
        (this.source = new ae(e)),
        (this.mipmaps = []),
        (this.mapping = n),
        (this.channel = 0),
        (this.wrapS = i),
        (this.wrapT = a),
        (this.magFilter = o),
        (this.minFilter = s),
        (this.anisotropy = u),
        (this.format = c),
        (this.internalFormat = null),
        (this.type = l),
        (this.offset = new A(0, 0)),
        (this.repeat = new A(1, 1)),
        (this.center = new A(0, 0)),
        (this.rotation = 0),
        (this.matrixAutoUpdate = !0),
        (this.matrix = new P()),
        (this.generateMipmaps = !0),
        (this.premultiplyAlpha = !1),
        (this.flipY = !0),
        (this.unpackAlignment = 4),
        (this.colorSpace = d),
        (this.userData = {}),
        (this.updateRanges = []),
        (this.version = 0),
        (this.onUpdate = null),
        (this.renderTarget = null),
        (this.isRenderTargetTexture = !1),
        (this.isArrayTexture = !!(e && e.depth && e.depth > 1)),
        (this.pmremVersion = 0),
        (this.normalized = !1));
    }
    get width() {
      return this.source.getSize(ce).x;
    }
    get height() {
      return this.source.getSize(ce).y;
    }
    get depth() {
      return this.source.getSize(ce).z;
    }
    get image() {
      return this.source.data;
    }
    set image(e) {
      this.source.data = e;
    }
    updateMatrix() {
      this.matrix.setUvTransform(
        this.offset.x,
        this.offset.y,
        this.repeat.x,
        this.repeat.y,
        this.rotation,
        this.center.x,
        this.center.y,
      );
    }
    addUpdateRange(e, t) {
      this.updateRanges.push({ start: e, count: t });
    }
    clearUpdateRanges() {
      this.updateRanges.length = 0;
    }
    clone() {
      return new this.constructor().copy(this);
    }
    copy(e) {
      return (
        (this.name = e.name),
        (this.source = e.source),
        (this.mipmaps = e.mipmaps.slice(0)),
        (this.mapping = e.mapping),
        (this.channel = e.channel),
        (this.wrapS = e.wrapS),
        (this.wrapT = e.wrapT),
        (this.magFilter = e.magFilter),
        (this.minFilter = e.minFilter),
        (this.anisotropy = e.anisotropy),
        (this.format = e.format),
        (this.internalFormat = e.internalFormat),
        (this.type = e.type),
        (this.normalized = e.normalized),
        this.offset.copy(e.offset),
        this.repeat.copy(e.repeat),
        this.center.copy(e.center),
        (this.rotation = e.rotation),
        (this.matrixAutoUpdate = e.matrixAutoUpdate),
        this.matrix.copy(e.matrix),
        (this.generateMipmaps = e.generateMipmaps),
        (this.premultiplyAlpha = e.premultiplyAlpha),
        (this.flipY = e.flipY),
        (this.unpackAlignment = e.unpackAlignment),
        (this.colorSpace = e.colorSpace),
        (this.renderTarget = e.renderTarget),
        (this.isRenderTargetTexture = e.isRenderTargetTexture),
        (this.isArrayTexture = e.isArrayTexture),
        (this.userData = JSON.parse(JSON.stringify(e.userData))),
        (this.needsUpdate = !0),
        this
      );
    }
    setValues(e) {
      for (let t in e) {
        let n = e[t];
        if (n === void 0) {
          y(`Texture.setValues(): parameter '${t}' has value of undefined.`);
          continue;
        }
        let r = this[t];
        if (r === void 0) {
          y(`Texture.setValues(): property '${t}' does not exist.`);
          continue;
        }
        (r && n && r.isVector2 && n.isVector2) ||
        (r && n && r.isVector3 && n.isVector3) ||
        (r && n && r.isMatrix3 && n.isMatrix3)
          ? r.copy(n)
          : (this[t] = n);
      }
    }
    toJSON(e) {
      let t = e === void 0 || typeof e == `string`;
      if (!t && e.textures[this.uuid] !== void 0) return e.textures[this.uuid];
      let n = {
        metadata: {
          version: 4.7,
          type: `Texture`,
          generator: `Texture.toJSON`,
        },
        uuid: this.uuid,
        name: this.name,
        image: this.source.toJSON(e).uuid,
        mapping: this.mapping,
        channel: this.channel,
        repeat: [this.repeat.x, this.repeat.y],
        offset: [this.offset.x, this.offset.y],
        center: [this.center.x, this.center.y],
        rotation: this.rotation,
        wrap: [this.wrapS, this.wrapT],
        format: this.format,
        internalFormat: this.internalFormat,
        type: this.type,
        normalized: this.normalized,
        colorSpace: this.colorSpace,
        minFilter: this.minFilter,
        magFilter: this.magFilter,
        anisotropy: this.anisotropy,
        flipY: this.flipY,
        generateMipmaps: this.generateMipmaps,
        premultiplyAlpha: this.premultiplyAlpha,
        unpackAlignment: this.unpackAlignment,
      };
      return (
        Object.keys(this.userData).length > 0 && (n.userData = this.userData),
        t || (e.textures[this.uuid] = n),
        n
      );
    }
    dispose() {
      this.dispatchEvent({ type: `dispose` });
    }
    transformUv(r) {
      if (this.mapping !== 300) return r;
      if ((r.applyMatrix3(this.matrix), r.x < 0 || r.x > 1))
        switch (this.wrapS) {
          case e:
            r.x -= Math.floor(r.x);
            break;
          case t:
            r.x = r.x < 0 ? 0 : 1;
            break;
          case n:
            Math.abs(Math.floor(r.x) % 2) === 1
              ? (r.x = Math.ceil(r.x) - r.x)
              : (r.x -= Math.floor(r.x));
        }
      if (r.y < 0 || r.y > 1)
        switch (this.wrapT) {
          case e:
            r.y -= Math.floor(r.y);
            break;
          case t:
            r.y = r.y < 0 ? 0 : 1;
            break;
          case n:
            Math.abs(Math.floor(r.y) % 2) === 1
              ? (r.y = Math.ceil(r.y) - r.y)
              : (r.y -= Math.floor(r.y));
        }
      return (this.flipY && (r.y = 1 - r.y), r);
    }
    set needsUpdate(e) {
      e === !0 && (this.version++, (this.source.needsUpdate = !0));
    }
    set needsPMREMUpdate(e) {
      e === !0 && this.pmremVersion++;
    }
  };
  ((le.DEFAULT_IMAGE = null),
    (le.DEFAULT_MAPPING = 300),
    (le.DEFAULT_ANISOTROPY = 1),
    class e {
      static {
        e.prototype.isVector4 = !0;
      }
      constructor(e = 0, t = 0, n = 0, r = 1) {
        ((this.x = e), (this.y = t), (this.z = n), (this.w = r));
      }
      get width() {
        return this.z;
      }
      set width(e) {
        this.z = e;
      }
      get height() {
        return this.w;
      }
      set height(e) {
        this.w = e;
      }
      set(e, t, n, r) {
        return ((this.x = e), (this.y = t), (this.z = n), (this.w = r), this);
      }
      setScalar(e) {
        return ((this.x = e), (this.y = e), (this.z = e), (this.w = e), this);
      }
      setX(e) {
        return ((this.x = e), this);
      }
      setY(e) {
        return ((this.y = e), this);
      }
      setZ(e) {
        return ((this.z = e), this);
      }
      setW(e) {
        return ((this.w = e), this);
      }
      setComponent(e, t) {
        switch (e) {
          case 0:
            this.x = t;
            break;
          case 1:
            this.y = t;
            break;
          case 2:
            this.z = t;
            break;
          case 3:
            this.w = t;
            break;
          default:
            throw Error(`THREE.Vector4: index is out of range: ` + e);
        }
        return this;
      }
      getComponent(e) {
        switch (e) {
          case 0:
            return this.x;
          case 1:
            return this.y;
          case 2:
            return this.z;
          case 3:
            return this.w;
          default:
            throw Error(`THREE.Vector4: index is out of range: ` + e);
        }
      }
      clone() {
        return new this.constructor(this.x, this.y, this.z, this.w);
      }
      copy(e) {
        return (
          (this.x = e.x),
          (this.y = e.y),
          (this.z = e.z),
          (this.w = e.w === void 0 ? 1 : e.w),
          this
        );
      }
      add(e) {
        return (
          (this.x += e.x),
          (this.y += e.y),
          (this.z += e.z),
          (this.w += e.w),
          this
        );
      }
      addScalar(e) {
        return (
          (this.x += e),
          (this.y += e),
          (this.z += e),
          (this.w += e),
          this
        );
      }
      addVectors(e, t) {
        return (
          (this.x = e.x + t.x),
          (this.y = e.y + t.y),
          (this.z = e.z + t.z),
          (this.w = e.w + t.w),
          this
        );
      }
      addScaledVector(e, t) {
        return (
          (this.x += e.x * t),
          (this.y += e.y * t),
          (this.z += e.z * t),
          (this.w += e.w * t),
          this
        );
      }
      sub(e) {
        return (
          (this.x -= e.x),
          (this.y -= e.y),
          (this.z -= e.z),
          (this.w -= e.w),
          this
        );
      }
      subScalar(e) {
        return (
          (this.x -= e),
          (this.y -= e),
          (this.z -= e),
          (this.w -= e),
          this
        );
      }
      subVectors(e, t) {
        return (
          (this.x = e.x - t.x),
          (this.y = e.y - t.y),
          (this.z = e.z - t.z),
          (this.w = e.w - t.w),
          this
        );
      }
      multiply(e) {
        return (
          (this.x *= e.x),
          (this.y *= e.y),
          (this.z *= e.z),
          (this.w *= e.w),
          this
        );
      }
      multiplyScalar(e) {
        return (
          (this.x *= e),
          (this.y *= e),
          (this.z *= e),
          (this.w *= e),
          this
        );
      }
      applyMatrix4(e) {
        let t = this.x,
          n = this.y,
          r = this.z,
          i = this.w,
          a = e.elements;
        return (
          (this.x = a[0] * t + a[4] * n + a[8] * r + a[12] * i),
          (this.y = a[1] * t + a[5] * n + a[9] * r + a[13] * i),
          (this.z = a[2] * t + a[6] * n + a[10] * r + a[14] * i),
          (this.w = a[3] * t + a[7] * n + a[11] * r + a[15] * i),
          this
        );
      }
      divide(e) {
        return (
          (this.x /= e.x),
          (this.y /= e.y),
          (this.z /= e.z),
          (this.w /= e.w),
          this
        );
      }
      divideScalar(e) {
        return this.multiplyScalar(1 / e);
      }
      setAxisAngleFromQuaternion(e) {
        this.w = 2 * Math.acos(e.w);
        let t = Math.sqrt(1 - e.w * e.w);
        return (
          t < 1e-4
            ? ((this.x = 1), (this.y = 0), (this.z = 0))
            : ((this.x = e.x / t), (this.y = e.y / t), (this.z = e.z / t)),
          this
        );
      }
      setAxisAngleFromRotationMatrix(e) {
        let t,
          n,
          r,
          i,
          a = 0.01,
          o = 0.1,
          s = e.elements,
          c = s[0],
          l = s[4],
          u = s[8],
          d = s[1],
          f = s[5],
          p = s[9],
          m = s[2],
          h = s[6],
          g = s[10];
        if (Math.abs(l - d) < a && Math.abs(u - m) < a && Math.abs(p - h) < a) {
          if (
            Math.abs(l + d) < o &&
            Math.abs(u + m) < o &&
            Math.abs(p + h) < o &&
            Math.abs(c + f + g - 3) < o
          )
            return (this.set(1, 0, 0, 0), this);
          t = Math.PI;
          let e = (c + 1) / 2,
            s = (f + 1) / 2,
            _ = (g + 1) / 2,
            v = (l + d) / 4,
            y = (u + m) / 4,
            b = (p + h) / 4;
          return (
            e > s && e > _
              ? e < a
                ? ((n = 0), (r = 0.707106781), (i = 0.707106781))
                : ((n = Math.sqrt(e)), (r = v / n), (i = y / n))
              : s > _
                ? s < a
                  ? ((n = 0.707106781), (r = 0), (i = 0.707106781))
                  : ((r = Math.sqrt(s)), (n = v / r), (i = b / r))
                : _ < a
                  ? ((n = 0.707106781), (r = 0.707106781), (i = 0))
                  : ((i = Math.sqrt(_)), (n = y / i), (r = b / i)),
            this.set(n, r, i, t),
            this
          );
        }
        let _ = Math.sqrt(
          (h - p) * (h - p) + (u - m) * (u - m) + (d - l) * (d - l),
        );
        return (
          Math.abs(_) < 0.001 && (_ = 1),
          (this.x = (h - p) / _),
          (this.y = (u - m) / _),
          (this.z = (d - l) / _),
          (this.w = Math.acos((c + f + g - 1) / 2)),
          this
        );
      }
      setFromMatrixPosition(e) {
        let t = e.elements;
        return (
          (this.x = t[12]),
          (this.y = t[13]),
          (this.z = t[14]),
          (this.w = t[15]),
          this
        );
      }
      min(e) {
        return (
          (this.x = Math.min(this.x, e.x)),
          (this.y = Math.min(this.y, e.y)),
          (this.z = Math.min(this.z, e.z)),
          (this.w = Math.min(this.w, e.w)),
          this
        );
      }
      max(e) {
        return (
          (this.x = Math.max(this.x, e.x)),
          (this.y = Math.max(this.y, e.y)),
          (this.z = Math.max(this.z, e.z)),
          (this.w = Math.max(this.w, e.w)),
          this
        );
      }
      clamp(e, t) {
        return (
          (this.x = T(this.x, e.x, t.x)),
          (this.y = T(this.y, e.y, t.y)),
          (this.z = T(this.z, e.z, t.z)),
          (this.w = T(this.w, e.w, t.w)),
          this
        );
      }
      clampScalar(e, t) {
        return (
          (this.x = T(this.x, e, t)),
          (this.y = T(this.y, e, t)),
          (this.z = T(this.z, e, t)),
          (this.w = T(this.w, e, t)),
          this
        );
      }
      clampLength(e, t) {
        let n = this.length();
        return this.divideScalar(n || 1).multiplyScalar(T(n, e, t));
      }
      floor() {
        return (
          (this.x = Math.floor(this.x)),
          (this.y = Math.floor(this.y)),
          (this.z = Math.floor(this.z)),
          (this.w = Math.floor(this.w)),
          this
        );
      }
      ceil() {
        return (
          (this.x = Math.ceil(this.x)),
          (this.y = Math.ceil(this.y)),
          (this.z = Math.ceil(this.z)),
          (this.w = Math.ceil(this.w)),
          this
        );
      }
      round() {
        return (
          (this.x = Math.round(this.x)),
          (this.y = Math.round(this.y)),
          (this.z = Math.round(this.z)),
          (this.w = Math.round(this.w)),
          this
        );
      }
      roundToZero() {
        return (
          (this.x = Math.trunc(this.x)),
          (this.y = Math.trunc(this.y)),
          (this.z = Math.trunc(this.z)),
          (this.w = Math.trunc(this.w)),
          this
        );
      }
      negate() {
        return (
          (this.x = -this.x),
          (this.y = -this.y),
          (this.z = -this.z),
          (this.w = -this.w),
          this
        );
      }
      dot(e) {
        return this.x * e.x + this.y * e.y + this.z * e.z + this.w * e.w;
      }
      lengthSq() {
        return (
          this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w
        );
      }
      length() {
        return Math.sqrt(
          this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w,
        );
      }
      manhattanLength() {
        return (
          Math.abs(this.x) +
          Math.abs(this.y) +
          Math.abs(this.z) +
          Math.abs(this.w)
        );
      }
      normalize() {
        return this.divideScalar(this.length() || 1);
      }
      setLength(e) {
        return this.normalize().multiplyScalar(e);
      }
      lerp(e, t) {
        return (
          (this.x += (e.x - this.x) * t),
          (this.y += (e.y - this.y) * t),
          (this.z += (e.z - this.z) * t),
          (this.w += (e.w - this.w) * t),
          this
        );
      }
      lerpVectors(e, t, n) {
        return (
          (this.x = e.x + (t.x - e.x) * n),
          (this.y = e.y + (t.y - e.y) * n),
          (this.z = e.z + (t.z - e.z) * n),
          (this.w = e.w + (t.w - e.w) * n),
          this
        );
      }
      equals(e) {
        return (
          e.x === this.x && e.y === this.y && e.z === this.z && e.w === this.w
        );
      }
      fromArray(e, t = 0) {
        return (
          (this.x = e[t]),
          (this.y = e[t + 1]),
          (this.z = e[t + 2]),
          (this.w = e[t + 3]),
          this
        );
      }
      toArray(e = [], t = 0) {
        return (
          (e[t] = this.x),
          (e[t + 1] = this.y),
          (e[t + 2] = this.z),
          (e[t + 3] = this.w),
          e
        );
      }
      fromBufferAttribute(e, t) {
        return (
          (this.x = e.getX(t)),
          (this.y = e.getY(t)),
          (this.z = e.getZ(t)),
          (this.w = e.getW(t)),
          this
        );
      }
      random() {
        return (
          (this.x = Math.random()),
          (this.y = Math.random()),
          (this.z = Math.random()),
          (this.w = Math.random()),
          this
        );
      }
      *[Symbol.iterator]() {
        (yield this.x, yield this.y, yield this.z, yield this.w);
      }
    });
  var ue = class e {
    static {
      e.prototype.isMatrix4 = !0;
    }
    constructor(e, t, n, r, i, a, o, s, c, l, u, d, f, p, m, h) {
      ((this.elements = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
        e !== void 0 &&
          this.set(e, t, n, r, i, a, o, s, c, l, u, d, f, p, m, h));
    }
    set(e, t, n, r, i, a, o, s, c, l, u, d, f, p, m, h) {
      let g = this.elements;
      return (
        (g[0] = e),
        (g[4] = t),
        (g[8] = n),
        (g[12] = r),
        (g[1] = i),
        (g[5] = a),
        (g[9] = o),
        (g[13] = s),
        (g[2] = c),
        (g[6] = l),
        (g[10] = u),
        (g[14] = d),
        (g[3] = f),
        (g[7] = p),
        (g[11] = m),
        (g[15] = h),
        this
      );
    }
    identity() {
      return (this.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1), this);
    }
    clone() {
      return new e().fromArray(this.elements);
    }
    copy(e) {
      let t = this.elements,
        n = e.elements;
      return (
        (t[0] = n[0]),
        (t[1] = n[1]),
        (t[2] = n[2]),
        (t[3] = n[3]),
        (t[4] = n[4]),
        (t[5] = n[5]),
        (t[6] = n[6]),
        (t[7] = n[7]),
        (t[8] = n[8]),
        (t[9] = n[9]),
        (t[10] = n[10]),
        (t[11] = n[11]),
        (t[12] = n[12]),
        (t[13] = n[13]),
        (t[14] = n[14]),
        (t[15] = n[15]),
        this
      );
    }
    copyPosition(e) {
      let t = this.elements,
        n = e.elements;
      return ((t[12] = n[12]), (t[13] = n[13]), (t[14] = n[14]), this);
    }
    setFromMatrix3(e) {
      let t = e.elements;
      return (
        this.set(
          t[0],
          t[3],
          t[6],
          0,
          t[1],
          t[4],
          t[7],
          0,
          t[2],
          t[5],
          t[8],
          0,
          0,
          0,
          0,
          1,
        ),
        this
      );
    }
    extractBasis(e, t, n) {
      return this.determinantAffine() === 0
        ? (e.set(1, 0, 0), t.set(0, 1, 0), n.set(0, 0, 1), this)
        : (e.setFromMatrixColumn(this, 0),
          t.setFromMatrixColumn(this, 1),
          n.setFromMatrixColumn(this, 2),
          this);
    }
    makeBasis(e, t, n) {
      return (
        this.set(
          e.x,
          t.x,
          n.x,
          0,
          e.y,
          t.y,
          n.y,
          0,
          e.z,
          t.z,
          n.z,
          0,
          0,
          0,
          0,
          1,
        ),
        this
      );
    }
    extractRotation(e) {
      if (e.determinantAffine() === 0) return this.identity();
      let t = this.elements,
        n = e.elements,
        r = 1 / de.setFromMatrixColumn(e, 0).length(),
        i = 1 / de.setFromMatrixColumn(e, 1).length(),
        a = 1 / de.setFromMatrixColumn(e, 2).length();
      return (
        (t[0] = n[0] * r),
        (t[1] = n[1] * r),
        (t[2] = n[2] * r),
        (t[3] = 0),
        (t[4] = n[4] * i),
        (t[5] = n[5] * i),
        (t[6] = n[6] * i),
        (t[7] = 0),
        (t[8] = n[8] * a),
        (t[9] = n[9] * a),
        (t[10] = n[10] * a),
        (t[11] = 0),
        (t[12] = 0),
        (t[13] = 0),
        (t[14] = 0),
        (t[15] = 1),
        this
      );
    }
    makeRotationFromEuler(e) {
      let t = this.elements,
        n = e.x,
        r = e.y,
        i = e.z,
        a = Math.cos(n),
        o = Math.sin(n),
        s = Math.cos(r),
        c = Math.sin(r),
        l = Math.cos(i),
        u = Math.sin(i);
      if (e.order === `XYZ`) {
        let e = a * l,
          n = a * u,
          r = o * l,
          i = o * u;
        ((t[0] = s * l),
          (t[4] = -s * u),
          (t[8] = c),
          (t[1] = n + r * c),
          (t[5] = e - i * c),
          (t[9] = -o * s),
          (t[2] = i - e * c),
          (t[6] = r + n * c),
          (t[10] = a * s));
      } else if (e.order === `YXZ`) {
        let e = s * l,
          n = s * u,
          r = c * l,
          i = c * u;
        ((t[0] = e + i * o),
          (t[4] = r * o - n),
          (t[8] = a * c),
          (t[1] = a * u),
          (t[5] = a * l),
          (t[9] = -o),
          (t[2] = n * o - r),
          (t[6] = i + e * o),
          (t[10] = a * s));
      } else if (e.order === `ZXY`) {
        let e = s * l,
          n = s * u,
          r = c * l,
          i = c * u;
        ((t[0] = e - i * o),
          (t[4] = -a * u),
          (t[8] = r + n * o),
          (t[1] = n + r * o),
          (t[5] = a * l),
          (t[9] = i - e * o),
          (t[2] = -a * c),
          (t[6] = o),
          (t[10] = a * s));
      } else if (e.order === `ZYX`) {
        let e = a * l,
          n = a * u,
          r = o * l,
          i = o * u;
        ((t[0] = s * l),
          (t[4] = r * c - n),
          (t[8] = e * c + i),
          (t[1] = s * u),
          (t[5] = i * c + e),
          (t[9] = n * c - r),
          (t[2] = -c),
          (t[6] = o * s),
          (t[10] = a * s));
      } else if (e.order === `YZX`) {
        let e = a * s,
          n = a * c,
          r = o * s,
          i = o * c;
        ((t[0] = s * l),
          (t[4] = i - e * u),
          (t[8] = r * u + n),
          (t[1] = u),
          (t[5] = a * l),
          (t[9] = -o * l),
          (t[2] = -c * l),
          (t[6] = n * u + r),
          (t[10] = e - i * u));
      } else if (e.order === `XZY`) {
        let e = a * s,
          n = a * c,
          r = o * s,
          i = o * c;
        ((t[0] = s * l),
          (t[4] = -u),
          (t[8] = c * l),
          (t[1] = e * u + i),
          (t[5] = a * l),
          (t[9] = n * u - r),
          (t[2] = r * u - n),
          (t[6] = o * l),
          (t[10] = i * u + e));
      }
      return (
        (t[3] = 0),
        (t[7] = 0),
        (t[11] = 0),
        (t[12] = 0),
        (t[13] = 0),
        (t[14] = 0),
        (t[15] = 1),
        this
      );
    }
    makeRotationFromQuaternion(e) {
      return this.compose(pe, e, me);
    }
    lookAt(e, t, n) {
      let r = this.elements;
      return (
        _e.subVectors(e, t),
        _e.lengthSq() === 0 && (_e.z = 1),
        _e.normalize(),
        he.crossVectors(n, _e),
        he.lengthSq() === 0 &&
          (Math.abs(n.z) === 1 ? (_e.x += 1e-4) : (_e.z += 1e-4),
          _e.normalize(),
          he.crossVectors(n, _e)),
        he.normalize(),
        ge.crossVectors(_e, he),
        (r[0] = he.x),
        (r[4] = ge.x),
        (r[8] = _e.x),
        (r[1] = he.y),
        (r[5] = ge.y),
        (r[9] = _e.y),
        (r[2] = he.z),
        (r[6] = ge.z),
        (r[10] = _e.z),
        this
      );
    }
    multiply(e) {
      return this.multiplyMatrices(this, e);
    }
    premultiply(e) {
      return this.multiplyMatrices(e, this);
    }
    multiplyMatrices(e, t) {
      let n = e.elements,
        r = t.elements,
        i = this.elements,
        a = n[0],
        o = n[4],
        s = n[8],
        c = n[12],
        l = n[1],
        u = n[5],
        d = n[9],
        f = n[13],
        p = n[2],
        m = n[6],
        h = n[10],
        g = n[14],
        _ = n[3],
        v = n[7],
        y = n[11],
        b = n[15],
        x = r[0],
        S = r[4],
        C = r[8],
        w = r[12],
        T = r[1],
        E = r[5],
        D = r[9],
        O = r[13],
        k = r[2],
        A = r[6],
        j = r[10],
        M = r[14],
        ee = r[3],
        N = r[7],
        P = r[11],
        F = r[15];
      return (
        (i[0] = a * x + o * T + s * k + c * ee),
        (i[4] = a * S + o * E + s * A + c * N),
        (i[8] = a * C + o * D + s * j + c * P),
        (i[12] = a * w + o * O + s * M + c * F),
        (i[1] = l * x + u * T + d * k + f * ee),
        (i[5] = l * S + u * E + d * A + f * N),
        (i[9] = l * C + u * D + d * j + f * P),
        (i[13] = l * w + u * O + d * M + f * F),
        (i[2] = p * x + m * T + h * k + g * ee),
        (i[6] = p * S + m * E + h * A + g * N),
        (i[10] = p * C + m * D + h * j + g * P),
        (i[14] = p * w + m * O + h * M + g * F),
        (i[3] = _ * x + v * T + y * k + b * ee),
        (i[7] = _ * S + v * E + y * A + b * N),
        (i[11] = _ * C + v * D + y * j + b * P),
        (i[15] = _ * w + v * O + y * M + b * F),
        this
      );
    }
    multiplyScalar(e) {
      let t = this.elements;
      return (
        (t[0] *= e),
        (t[4] *= e),
        (t[8] *= e),
        (t[12] *= e),
        (t[1] *= e),
        (t[5] *= e),
        (t[9] *= e),
        (t[13] *= e),
        (t[2] *= e),
        (t[6] *= e),
        (t[10] *= e),
        (t[14] *= e),
        (t[3] *= e),
        (t[7] *= e),
        (t[11] *= e),
        (t[15] *= e),
        this
      );
    }
    determinant() {
      let e = this.elements,
        t = e[0],
        n = e[4],
        r = e[8],
        i = e[12],
        a = e[1],
        o = e[5],
        s = e[9],
        c = e[13],
        l = e[2],
        u = e[6],
        d = e[10],
        f = e[14],
        p = e[3],
        m = e[7],
        h = e[11],
        g = e[15],
        _ = s * f - c * d,
        v = o * f - c * u,
        y = o * d - s * u,
        b = a * f - c * l,
        x = a * d - s * l,
        S = a * u - o * l;
      return (
        t * (m * _ - h * v + g * y) -
        n * (p * _ - h * b + g * x) +
        r * (p * v - m * b + g * S) -
        i * (p * y - m * x + h * S)
      );
    }
    determinantAffine() {
      let e = this.elements,
        t = e[0],
        n = e[4],
        r = e[8],
        i = e[1],
        a = e[5],
        o = e[9],
        s = e[2],
        c = e[6],
        l = e[10];
      return t * (a * l - o * c) - n * (i * l - o * s) + r * (i * c - a * s);
    }
    transpose() {
      let e = this.elements,
        t;
      return (
        (t = e[1]),
        (e[1] = e[4]),
        (e[4] = t),
        (t = e[2]),
        (e[2] = e[8]),
        (e[8] = t),
        (t = e[6]),
        (e[6] = e[9]),
        (e[9] = t),
        (t = e[3]),
        (e[3] = e[12]),
        (e[12] = t),
        (t = e[7]),
        (e[7] = e[13]),
        (e[13] = t),
        (t = e[11]),
        (e[11] = e[14]),
        (e[14] = t),
        this
      );
    }
    setPosition(e, t, n) {
      let r = this.elements;
      return (
        e.isVector3
          ? ((r[12] = e.x), (r[13] = e.y), (r[14] = e.z))
          : ((r[12] = e), (r[13] = t), (r[14] = n)),
        this
      );
    }
    invert() {
      let e = this.elements,
        t = e[0],
        n = e[1],
        r = e[2],
        i = e[3],
        a = e[4],
        o = e[5],
        s = e[6],
        c = e[7],
        l = e[8],
        u = e[9],
        d = e[10],
        f = e[11],
        p = e[12],
        m = e[13],
        h = e[14],
        g = e[15],
        _ = t * o - n * a,
        v = t * s - r * a,
        y = t * c - i * a,
        b = n * s - r * o,
        x = n * c - i * o,
        S = r * c - i * s,
        C = l * m - u * p,
        w = l * h - d * p,
        T = l * g - f * p,
        E = u * h - d * m,
        D = u * g - f * m,
        O = d * g - f * h,
        k = _ * O - v * D + y * E + b * T - x * w + S * C;
      if (k === 0)
        return this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
      let A = 1 / k;
      return (
        (e[0] = (o * O - s * D + c * E) * A),
        (e[1] = (r * D - n * O - i * E) * A),
        (e[2] = (m * S - h * x + g * b) * A),
        (e[3] = (d * x - u * S - f * b) * A),
        (e[4] = (s * T - a * O - c * w) * A),
        (e[5] = (t * O - r * T + i * w) * A),
        (e[6] = (h * y - p * S - g * v) * A),
        (e[7] = (l * S - d * y + f * v) * A),
        (e[8] = (a * D - o * T + c * C) * A),
        (e[9] = (n * T - t * D - i * C) * A),
        (e[10] = (p * x - m * y + g * _) * A),
        (e[11] = (u * y - l * x - f * _) * A),
        (e[12] = (o * w - a * E - s * C) * A),
        (e[13] = (t * E - n * w + r * C) * A),
        (e[14] = (m * v - p * b - h * _) * A),
        (e[15] = (l * b - u * v + d * _) * A),
        this
      );
    }
    scale(e) {
      let t = this.elements,
        n = e.x,
        r = e.y,
        i = e.z;
      return (
        (t[0] *= n),
        (t[4] *= r),
        (t[8] *= i),
        (t[1] *= n),
        (t[5] *= r),
        (t[9] *= i),
        (t[2] *= n),
        (t[6] *= r),
        (t[10] *= i),
        (t[3] *= n),
        (t[7] *= r),
        (t[11] *= i),
        this
      );
    }
    getMaxScaleOnAxis() {
      let e = this.elements,
        t = e[0] * e[0] + e[1] * e[1] + e[2] * e[2],
        n = e[4] * e[4] + e[5] * e[5] + e[6] * e[6],
        r = e[8] * e[8] + e[9] * e[9] + e[10] * e[10];
      return Math.sqrt(Math.max(t, n, r));
    }
    makeTranslation(e, t, n) {
      return (
        e.isVector3
          ? this.set(1, 0, 0, e.x, 0, 1, 0, e.y, 0, 0, 1, e.z, 0, 0, 0, 1)
          : this.set(1, 0, 0, e, 0, 1, 0, t, 0, 0, 1, n, 0, 0, 0, 1),
        this
      );
    }
    makeRotationX(e) {
      let t = Math.cos(e),
        n = Math.sin(e);
      return (this.set(1, 0, 0, 0, 0, t, -n, 0, 0, n, t, 0, 0, 0, 0, 1), this);
    }
    makeRotationY(e) {
      let t = Math.cos(e),
        n = Math.sin(e);
      return (this.set(t, 0, n, 0, 0, 1, 0, 0, -n, 0, t, 0, 0, 0, 0, 1), this);
    }
    makeRotationZ(e) {
      let t = Math.cos(e),
        n = Math.sin(e);
      return (this.set(t, -n, 0, 0, n, t, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1), this);
    }
    makeRotationAxis(e, t) {
      let n = Math.cos(t),
        r = Math.sin(t),
        i = 1 - n,
        a = e.x,
        o = e.y,
        s = e.z,
        c = i * a,
        l = i * o;
      return (
        this.set(
          c * a + n,
          c * o - r * s,
          c * s + r * o,
          0,
          c * o + r * s,
          l * o + n,
          l * s - r * a,
          0,
          c * s - r * o,
          l * s + r * a,
          i * s * s + n,
          0,
          0,
          0,
          0,
          1,
        ),
        this
      );
    }
    makeScale(e, t, n) {
      return (this.set(e, 0, 0, 0, 0, t, 0, 0, 0, 0, n, 0, 0, 0, 0, 1), this);
    }
    makeShear(e, t, n, r, i, a) {
      return (this.set(1, n, i, 0, e, 1, a, 0, t, r, 1, 0, 0, 0, 0, 1), this);
    }
    compose(e, t, n) {
      let r = this.elements,
        i = t._x,
        a = t._y,
        o = t._z,
        s = t._w,
        c = i + i,
        l = a + a,
        u = o + o,
        d = i * c,
        f = i * l,
        p = i * u,
        m = a * l,
        h = a * u,
        g = o * u,
        _ = s * c,
        v = s * l,
        y = s * u,
        b = n.x,
        x = n.y,
        S = n.z;
      return (
        (r[0] = (1 - (m + g)) * b),
        (r[1] = (f + y) * b),
        (r[2] = (p - v) * b),
        (r[3] = 0),
        (r[4] = (f - y) * x),
        (r[5] = (1 - (d + g)) * x),
        (r[6] = (h + _) * x),
        (r[7] = 0),
        (r[8] = (p + v) * S),
        (r[9] = (h - _) * S),
        (r[10] = (1 - (d + m)) * S),
        (r[11] = 0),
        (r[12] = e.x),
        (r[13] = e.y),
        (r[14] = e.z),
        (r[15] = 1),
        this
      );
    }
    decompose(e, t, n) {
      let r = this.elements;
      ((e.x = r[12]), (e.y = r[13]), (e.z = r[14]));
      let i = this.determinantAffine();
      if (i === 0) return (n.set(1, 1, 1), t.identity(), this);
      let a = de.set(r[0], r[1], r[2]).length(),
        o = de.set(r[4], r[5], r[6]).length(),
        s = de.set(r[8], r[9], r[10]).length();
      (i < 0 && (a = -a), fe.copy(this));
      let c = 1 / a,
        l = 1 / o,
        u = 1 / s;
      return (
        (fe.elements[0] *= c),
        (fe.elements[1] *= c),
        (fe.elements[2] *= c),
        (fe.elements[4] *= l),
        (fe.elements[5] *= l),
        (fe.elements[6] *= l),
        (fe.elements[8] *= u),
        (fe.elements[9] *= u),
        (fe.elements[10] *= u),
        t.setFromRotationMatrix(fe),
        (n.x = a),
        (n.y = o),
        (n.z = s),
        this
      );
    }
    makePerspective(e, t, n, r, i, a, o = p, s = !1) {
      let c = this.elements,
        l = (2 * i) / (t - e),
        u = (2 * i) / (n - r),
        d = (t + e) / (t - e),
        f = (n + r) / (n - r),
        m,
        h;
      if (s) ((m = i / (a - i)), (h = (a * i) / (a - i)));
      else if (o === 2e3)
        ((m = -(a + i) / (a - i)), (h = (-2 * a * i) / (a - i)));
      else if (o === 2001) ((m = -a / (a - i)), (h = (-a * i) / (a - i)));
      else
        throw Error(
          `THREE.Matrix4.makePerspective(): Invalid coordinate system: ` + o,
        );
      return (
        (c[0] = l),
        (c[4] = 0),
        (c[8] = d),
        (c[12] = 0),
        (c[1] = 0),
        (c[5] = u),
        (c[9] = f),
        (c[13] = 0),
        (c[2] = 0),
        (c[6] = 0),
        (c[10] = m),
        (c[14] = h),
        (c[3] = 0),
        (c[7] = 0),
        (c[11] = -1),
        (c[15] = 0),
        this
      );
    }
    makeOrthographic(e, t, n, r, i, a, o = p, s = !1) {
      let c = this.elements,
        l = 2 / (t - e),
        u = 2 / (n - r),
        d = -(t + e) / (t - e),
        f = -(n + r) / (n - r),
        m,
        h;
      if (s) ((m = 1 / (a - i)), (h = a / (a - i)));
      else if (o === 2e3) ((m = -2 / (a - i)), (h = -(a + i) / (a - i)));
      else if (o === 2001) ((m = -1 / (a - i)), (h = -i / (a - i)));
      else
        throw Error(
          `THREE.Matrix4.makeOrthographic(): Invalid coordinate system: ` + o,
        );
      return (
        (c[0] = l),
        (c[4] = 0),
        (c[8] = 0),
        (c[12] = d),
        (c[1] = 0),
        (c[5] = u),
        (c[9] = 0),
        (c[13] = f),
        (c[2] = 0),
        (c[6] = 0),
        (c[10] = m),
        (c[14] = h),
        (c[3] = 0),
        (c[7] = 0),
        (c[11] = 0),
        (c[15] = 1),
        this
      );
    }
    equals(e) {
      let t = this.elements,
        n = e.elements;
      for (let e = 0; e < 16; e++) if (t[e] !== n[e]) return !1;
      return !0;
    }
    fromArray(e, t = 0) {
      for (let n = 0; n < 16; n++) this.elements[n] = e[n + t];
      return this;
    }
    toArray(e = [], t = 0) {
      let n = this.elements;
      return (
        (e[t] = n[0]),
        (e[t + 1] = n[1]),
        (e[t + 2] = n[2]),
        (e[t + 3] = n[3]),
        (e[t + 4] = n[4]),
        (e[t + 5] = n[5]),
        (e[t + 6] = n[6]),
        (e[t + 7] = n[7]),
        (e[t + 8] = n[8]),
        (e[t + 9] = n[9]),
        (e[t + 10] = n[10]),
        (e[t + 11] = n[11]),
        (e[t + 12] = n[12]),
        (e[t + 13] = n[13]),
        (e[t + 14] = n[14]),
        (e[t + 15] = n[15]),
        e
      );
    }
  };
  let de = /*@__PURE__*/ new M(),
    fe = /*@__PURE__*/ new ue(),
    pe = /*@__PURE__*/ new M(0, 0, 0),
    me = /*@__PURE__*/ new M(1, 1, 1),
    he = /*@__PURE__*/ new M(),
    ge = /*@__PURE__*/ new M(),
    _e = /*@__PURE__*/ new M(),
    ve = /*@__PURE__*/ new ue(),
    ye = /*@__PURE__*/ new j();
  var be = class e {
    constructor(t = 0, n = 0, r = 0, i = e.DEFAULT_ORDER) {
      ((this.isEuler = !0),
        (this._x = t),
        (this._y = n),
        (this._z = r),
        (this._order = i));
    }
    get x() {
      return this._x;
    }
    set x(e) {
      ((this._x = e), this._onChangeCallback());
    }
    get y() {
      return this._y;
    }
    set y(e) {
      ((this._y = e), this._onChangeCallback());
    }
    get z() {
      return this._z;
    }
    set z(e) {
      ((this._z = e), this._onChangeCallback());
    }
    get order() {
      return this._order;
    }
    set order(e) {
      ((this._order = e), this._onChangeCallback());
    }
    set(e, t, n, r = this._order) {
      return (
        (this._x = e),
        (this._y = t),
        (this._z = n),
        (this._order = r),
        this._onChangeCallback(),
        this
      );
    }
    clone() {
      return new this.constructor(this._x, this._y, this._z, this._order);
    }
    copy(e) {
      return (
        (this._x = e._x),
        (this._y = e._y),
        (this._z = e._z),
        (this._order = e._order),
        this._onChangeCallback(),
        this
      );
    }
    setFromRotationMatrix(e, t = this._order, n = !0) {
      let r = e.elements,
        i = r[0],
        a = r[4],
        o = r[8],
        s = r[1],
        c = r[5],
        l = r[9],
        u = r[2],
        d = r[6],
        f = r[10];
      switch (t) {
        case `XYZ`:
          ((this._y = Math.asin(T(o, -1, 1))),
            Math.abs(o) < 0.9999999
              ? ((this._x = Math.atan2(-l, f)), (this._z = Math.atan2(-a, i)))
              : ((this._x = Math.atan2(d, c)), (this._z = 0)));
          break;
        case `YXZ`:
          ((this._x = Math.asin(-T(l, -1, 1))),
            Math.abs(l) < 0.9999999
              ? ((this._y = Math.atan2(o, f)), (this._z = Math.atan2(s, c)))
              : ((this._y = Math.atan2(-u, i)), (this._z = 0)));
          break;
        case `ZXY`:
          ((this._x = Math.asin(T(d, -1, 1))),
            Math.abs(d) < 0.9999999
              ? ((this._y = Math.atan2(-u, f)), (this._z = Math.atan2(-a, c)))
              : ((this._y = 0), (this._z = Math.atan2(s, i))));
          break;
        case `ZYX`:
          ((this._y = Math.asin(-T(u, -1, 1))),
            Math.abs(u) < 0.9999999
              ? ((this._x = Math.atan2(d, f)), (this._z = Math.atan2(s, i)))
              : ((this._x = 0), (this._z = Math.atan2(-a, c))));
          break;
        case `YZX`:
          ((this._z = Math.asin(T(s, -1, 1))),
            Math.abs(s) < 0.9999999
              ? ((this._x = Math.atan2(-l, c)), (this._y = Math.atan2(-u, i)))
              : ((this._x = 0), (this._y = Math.atan2(o, f))));
          break;
        case `XZY`:
          ((this._z = Math.asin(-T(a, -1, 1))),
            Math.abs(a) < 0.9999999
              ? ((this._x = Math.atan2(d, c)), (this._y = Math.atan2(o, i)))
              : ((this._x = Math.atan2(-l, f)), (this._y = 0)));
          break;
        default:
          y(
            `Euler: .setFromRotationMatrix() encountered an unknown order: ` +
              t,
          );
      }
      return ((this._order = t), n === !0 && this._onChangeCallback(), this);
    }
    setFromQuaternion(e, t, n) {
      return (
        ve.makeRotationFromQuaternion(e),
        this.setFromRotationMatrix(ve, t, n)
      );
    }
    setFromVector3(e, t = this._order) {
      return this.set(e.x, e.y, e.z, t);
    }
    reorder(e) {
      return (ye.setFromEuler(this), this.setFromQuaternion(ye, e));
    }
    equals(e) {
      return (
        e._x === this._x &&
        e._y === this._y &&
        e._z === this._z &&
        e._order === this._order
      );
    }
    fromArray(e) {
      return (
        (this._x = e[0]),
        (this._y = e[1]),
        (this._z = e[2]),
        e[3] !== void 0 && (this._order = e[3]),
        this._onChangeCallback(),
        this
      );
    }
    toArray(e = [], t = 0) {
      return (
        (e[t] = this._x),
        (e[t + 1] = this._y),
        (e[t + 2] = this._z),
        (e[t + 3] = this._order),
        e
      );
    }
    _onChange(e) {
      return ((this._onChangeCallback = e), this);
    }
    _onChangeCallback() {}
    *[Symbol.iterator]() {
      (yield this._x, yield this._y, yield this._z, yield this._order);
    }
  };
  be.DEFAULT_ORDER = `XYZ`;
  var xe = class {
    constructor() {
      this.mask = 1;
    }
    set(e) {
      this.mask = ((1 << e) | 0) >>> 0;
    }
    enable(e) {
      this.mask |= (1 << e) | 0;
    }
    enableAll() {
      this.mask = -1;
    }
    toggle(e) {
      this.mask ^= (1 << e) | 0;
    }
    disable(e) {
      this.mask &= ~((1 << e) | 0);
    }
    disableAll() {
      this.mask = 0;
    }
    test(e) {
      return (this.mask & e.mask) !== 0;
    }
    isEnabled(e) {
      return !!(this.mask & ((1 << e) | 0));
    }
  };
  let Se = 0,
    Ce = /*@__PURE__*/ new M(),
    we = /*@__PURE__*/ new j(),
    Te = /*@__PURE__*/ new ue(),
    Ee = /*@__PURE__*/ new M(),
    De = /*@__PURE__*/ new M(),
    Oe = /*@__PURE__*/ new M(),
    ke = /*@__PURE__*/ new j(),
    Ae = /*@__PURE__*/ new M(1, 0, 0),
    je = /*@__PURE__*/ new M(0, 1, 0),
    Me = /*@__PURE__*/ new M(0, 0, 1),
    Ne = { type: `added` },
    Pe = { type: `removed` },
    Fe = { type: `childadded`, child: null },
    Ie = { type: `childremoved`, child: null };
  var Le = class e extends S {
    constructor() {
      (super(),
        (this.isObject3D = !0),
        Object.defineProperty(this, "id", { value: Se++ }),
        (this.uuid = w()),
        (this.name = ``),
        (this.type = `Object3D`),
        (this.parent = null),
        (this.children = []),
        (this.up = e.DEFAULT_UP.clone()));
      let t = new M(),
        n = new be(),
        r = new j(),
        i = new M(1, 1, 1);
      function a() {
        r.setFromEuler(n, !1);
      }
      function o() {
        n.setFromQuaternion(r, void 0, !1);
      }
      (n._onChange(a),
        r._onChange(o),
        Object.defineProperties(this, {
          position: { configurable: !0, enumerable: !0, value: t },
          rotation: { configurable: !0, enumerable: !0, value: n },
          quaternion: { configurable: !0, enumerable: !0, value: r },
          scale: { configurable: !0, enumerable: !0, value: i },
          modelViewMatrix: { value: new ue() },
          normalMatrix: { value: new P() },
        }),
        (this.matrix = new ue()),
        (this.matrixWorld = new ue()),
        (this.matrixAutoUpdate = e.DEFAULT_MATRIX_AUTO_UPDATE),
        (this.matrixWorldAutoUpdate = e.DEFAULT_MATRIX_WORLD_AUTO_UPDATE),
        (this.matrixWorldNeedsUpdate = !1),
        (this.layers = new xe()),
        (this.visible = !0),
        (this.castShadow = !1),
        (this.receiveShadow = !1),
        (this.frustumCulled = !0),
        (this.renderOrder = 0),
        (this.animations = []),
        (this.customDepthMaterial = void 0),
        (this.customDistanceMaterial = void 0),
        (this.static = !1),
        (this.userData = {}),
        (this.pivot = null));
    }
    onBeforeShadow() {}
    onAfterShadow() {}
    onBeforeRender() {}
    onAfterRender() {}
    applyMatrix4(e) {
      (this.matrixAutoUpdate && this.updateMatrix(),
        this.matrix.premultiply(e),
        this.matrix.decompose(this.position, this.quaternion, this.scale));
    }
    applyQuaternion(e) {
      return (this.quaternion.premultiply(e), this);
    }
    setRotationFromAxisAngle(e, t) {
      this.quaternion.setFromAxisAngle(e, t);
    }
    setRotationFromEuler(e) {
      this.quaternion.setFromEuler(e, !0);
    }
    setRotationFromMatrix(e) {
      this.quaternion.setFromRotationMatrix(e);
    }
    setRotationFromQuaternion(e) {
      this.quaternion.copy(e);
    }
    rotateOnAxis(e, t) {
      return (we.setFromAxisAngle(e, t), this.quaternion.multiply(we), this);
    }
    rotateOnWorldAxis(e, t) {
      return (we.setFromAxisAngle(e, t), this.quaternion.premultiply(we), this);
    }
    rotateX(e) {
      return this.rotateOnAxis(Ae, e);
    }
    rotateY(e) {
      return this.rotateOnAxis(je, e);
    }
    rotateZ(e) {
      return this.rotateOnAxis(Me, e);
    }
    translateOnAxis(e, t) {
      return (
        Ce.copy(e).applyQuaternion(this.quaternion),
        this.position.add(Ce.multiplyScalar(t)),
        this
      );
    }
    translateX(e) {
      return this.translateOnAxis(Ae, e);
    }
    translateY(e) {
      return this.translateOnAxis(je, e);
    }
    translateZ(e) {
      return this.translateOnAxis(Me, e);
    }
    localToWorld(e) {
      return (this.updateWorldMatrix(!0, !1), e.applyMatrix4(this.matrixWorld));
    }
    worldToLocal(e) {
      return (
        this.updateWorldMatrix(!0, !1),
        e.applyMatrix4(Te.copy(this.matrixWorld).invert())
      );
    }
    lookAt(e, t, n) {
      e.isVector3 ? Ee.copy(e) : Ee.set(e, t, n);
      let r = this.parent;
      (this.updateWorldMatrix(!0, !1),
        De.setFromMatrixPosition(this.matrixWorld),
        this.isCamera || this.isLight
          ? Te.lookAt(De, Ee, this.up)
          : Te.lookAt(Ee, De, this.up),
        this.quaternion.setFromRotationMatrix(Te),
        r &&
          (Te.extractRotation(r.matrixWorld),
          we.setFromRotationMatrix(Te),
          this.quaternion.premultiply(we.invert())));
    }
    add(e) {
      if (arguments.length > 1) {
        for (let e = 0; e < arguments.length; e++) this.add(arguments[e]);
        return this;
      }
      return e === this
        ? (b(`Object3D.add: object can't be added as a child of itself.`, e),
          this)
        : (e && e.isObject3D
            ? (e.removeFromParent(),
              (e.parent = this),
              this.children.push(e),
              e.dispatchEvent(Ne),
              (Fe.child = e),
              this.dispatchEvent(Fe),
              (Fe.child = null))
            : b(`Object3D.add: object not an instance of THREE.Object3D.`, e),
          this);
    }
    remove(e) {
      if (arguments.length > 1) {
        for (let e = 0; e < arguments.length; e++) this.remove(arguments[e]);
        return this;
      }
      let t = this.children.indexOf(e);
      return (
        t !== -1 &&
          ((e.parent = null),
          this.children.splice(t, 1),
          e.dispatchEvent(Pe),
          (Ie.child = e),
          this.dispatchEvent(Ie),
          (Ie.child = null)),
        this
      );
    }
    removeFromParent() {
      let e = this.parent;
      return (e !== null && e.remove(this), this);
    }
    clear() {
      return this.remove(...this.children);
    }
    attach(e) {
      return (
        this.updateWorldMatrix(!0, !1),
        Te.copy(this.matrixWorld).invert(),
        e.parent !== null &&
          (e.parent.updateWorldMatrix(!0, !1),
          Te.multiply(e.parent.matrixWorld)),
        e.applyMatrix4(Te),
        e.removeFromParent(),
        (e.parent = this),
        this.children.push(e),
        e.updateWorldMatrix(!1, !0),
        e.dispatchEvent(Ne),
        (Fe.child = e),
        this.dispatchEvent(Fe),
        (Fe.child = null),
        this
      );
    }
    getObjectById(e) {
      return this.getObjectByProperty(`id`, e);
    }
    getObjectByName(e) {
      return this.getObjectByProperty(`name`, e);
    }
    getObjectByProperty(e, t) {
      if (this[e] === t) return this;
      for (let n = 0, r = this.children.length; n < r; n++) {
        let r = this.children[n].getObjectByProperty(e, t);
        if (r !== void 0) return r;
      }
    }
    getObjectsByProperty(e, t, n = []) {
      this[e] === t && n.push(this);
      let r = this.children;
      for (let i = 0, a = r.length; i < a; i++)
        r[i].getObjectsByProperty(e, t, n);
      return n;
    }
    getWorldPosition(e) {
      return (
        this.updateWorldMatrix(!0, !1),
        e.setFromMatrixPosition(this.matrixWorld)
      );
    }
    getWorldQuaternion(e) {
      return (
        this.updateWorldMatrix(!0, !1),
        this.matrixWorld.decompose(De, e, Oe),
        e
      );
    }
    getWorldScale(e) {
      return (
        this.updateWorldMatrix(!0, !1),
        this.matrixWorld.decompose(De, ke, e),
        e
      );
    }
    getWorldDirection(e) {
      this.updateWorldMatrix(!0, !1);
      let t = this.matrixWorld.elements;
      return e.set(t[8], t[9], t[10]).normalize();
    }
    raycast() {}
    intersectsFrustum() {}
    traverse(e) {
      e(this);
      let t = this.children;
      for (let n = 0, r = t.length; n < r; n++) t[n].traverse(e);
    }
    traverseVisible(e) {
      if (this.visible === !1) return;
      e(this);
      let t = this.children;
      for (let n = 0, r = t.length; n < r; n++) t[n].traverseVisible(e);
    }
    traverseAncestors(e) {
      let t = this.parent;
      t !== null && (e(t), t.traverseAncestors(e));
    }
    updateMatrix() {
      this.matrix.compose(this.position, this.quaternion, this.scale);
      let e = this.pivot;
      if (e !== null) {
        let t = e.x,
          n = e.y,
          r = e.z,
          i = this.matrix.elements;
        ((i[12] += t - i[0] * t - i[4] * n - i[8] * r),
          (i[13] += n - i[1] * t - i[5] * n - i[9] * r),
          (i[14] += r - i[2] * t - i[6] * n - i[10] * r));
      }
      this.matrixWorldNeedsUpdate = !0;
    }
    updateMatrixWorld(e) {
      (this.matrixAutoUpdate && this.updateMatrix(),
        (this.matrixWorldNeedsUpdate || e) &&
          (this.matrixWorldAutoUpdate === !0 &&
            (this.parent === null
              ? this.matrixWorld.copy(this.matrix)
              : this.matrixWorld.multiplyMatrices(
                  this.parent.matrixWorld,
                  this.matrix,
                )),
          (this.matrixWorldNeedsUpdate = !1),
          (e = !0)));
      let t = this.children;
      for (let n = 0, r = t.length; n < r; n++) t[n].updateMatrixWorld(e);
    }
    updateWorldMatrix(e, t, n = !1) {
      let r = this.parent;
      if (
        (e === !0 && r !== null && r.updateWorldMatrix(!0, !1),
        this.matrixAutoUpdate && this.updateMatrix(),
        (this.matrixWorldNeedsUpdate || n) &&
          (this.matrixWorldAutoUpdate === !0 &&
            (this.parent === null
              ? this.matrixWorld.copy(this.matrix)
              : this.matrixWorld.multiplyMatrices(
                  this.parent.matrixWorld,
                  this.matrix,
                )),
          (this.matrixWorldNeedsUpdate = !1),
          (n = !0)),
        t === !0)
      ) {
        let e = this.children;
        for (let t = 0, r = e.length; t < r; t++)
          e[t].updateWorldMatrix(!1, !0, n);
      }
    }
    toJSON(e) {
      let t = e === void 0 || typeof e == `string`,
        n = {};
      t &&
        ((e = {
          geometries: {},
          materials: {},
          textures: {},
          images: {},
          shapes: {},
          skeletons: {},
          animations: {},
          nodes: {},
        }),
        (n.metadata = {
          version: 4.7,
          type: `Object`,
          generator: `Object3D.toJSON`,
        }));
      let r = {};
      ((r.uuid = this.uuid),
        (r.type = this.type),
        (r.name = this.name),
        (r.castShadow = this.castShadow),
        (r.receiveShadow = this.receiveShadow),
        (r.visible = this.visible),
        (r.frustumCulled = this.frustumCulled),
        (r.renderOrder = this.renderOrder),
        (r.static = this.static),
        (r.matrixAutoUpdate = this.matrixAutoUpdate),
        Object.keys(this.userData).length > 0 && (r.userData = this.userData),
        (r.layers = this.layers.mask),
        (r.matrix = this.matrix.toArray()),
        (r.up = this.up.toArray()),
        this.pivot !== null && (r.pivot = this.pivot.toArray()),
        this.morphTargetDictionary !== void 0 &&
          (r.morphTargetDictionary = Object.assign(
            {},
            this.morphTargetDictionary,
          )),
        this.morphTargetInfluences !== void 0 &&
          (r.morphTargetInfluences = this.morphTargetInfluences.slice()),
        this.isInstancedMesh &&
          ((r.type = `InstancedMesh`),
          (r.count = this.count),
          (r.instanceMatrix = this.instanceMatrix.toJSON()),
          this.instanceColor !== null &&
            (r.instanceColor = this.instanceColor.toJSON())),
        this.isBatchedMesh &&
          ((r.type = `BatchedMesh`),
          (r.perObjectFrustumCulled = this.perObjectFrustumCulled),
          (r.sortObjects = this.sortObjects),
          (r.drawRanges = this._drawRanges),
          (r.reservedRanges = this._reservedRanges),
          (r.geometryInfo = this._geometryInfo.map((e) => ({
            ...e,
            boundingBox: e.boundingBox ? e.boundingBox.toJSON() : void 0,
            boundingSphere: e.boundingSphere
              ? e.boundingSphere.toJSON()
              : void 0,
          }))),
          (r.instanceInfo = this._instanceInfo.map((e) => ({ ...e }))),
          (r.availableInstanceIds = this._availableInstanceIds.slice()),
          (r.availableGeometryIds = this._availableGeometryIds.slice()),
          (r.nextIndexStart = this._nextIndexStart),
          (r.nextVertexStart = this._nextVertexStart),
          (r.geometryCount = this._geometryCount),
          (r.maxInstanceCount = this._maxInstanceCount),
          (r.maxVertexCount = this._maxVertexCount),
          (r.maxIndexCount = this._maxIndexCount),
          (r.geometryInitialized = this._geometryInitialized),
          (r.matricesTexture = this._matricesTexture.toJSON(e)),
          (r.indirectTexture = this._indirectTexture.toJSON(e)),
          this._colorsTexture !== null &&
            (r.colorsTexture = this._colorsTexture.toJSON(e)),
          this.boundingSphere !== null &&
            (r.boundingSphere = this.boundingSphere.toJSON()),
          this.boundingBox !== null &&
            (r.boundingBox = this.boundingBox.toJSON())));
      function i(t, n) {
        return (t[n.uuid] === void 0 && (t[n.uuid] = n.toJSON(e)), n.uuid);
      }
      if (this.isScene)
        (this.background &&
          (this.background.isColor
            ? (r.background = this.background.toJSON())
            : this.background.isTexture &&
              (r.background = this.background.toJSON(e).uuid)),
          this.environment &&
            this.environment.isTexture &&
            this.environment.isRenderTargetTexture !== !0 &&
            (r.environment = this.environment.toJSON(e).uuid));
      else if (this.isMesh || this.isLine || this.isPoints) {
        r.geometry = i(e.geometries, this.geometry);
        let t = this.geometry.parameters;
        if (t !== void 0 && t.shapes !== void 0) {
          let n = t.shapes;
          if (Array.isArray(n))
            for (let t = 0, r = n.length; t < r; t++) {
              let r = n[t];
              i(e.shapes, r);
            }
          else i(e.shapes, n);
        }
      }
      if (
        (this.isSkinnedMesh &&
          ((r.bindMode = this.bindMode),
          (r.bindMatrix = this.bindMatrix.toArray()),
          this.skeleton !== void 0 &&
            (i(e.skeletons, this.skeleton), (r.skeleton = this.skeleton.uuid))),
        this.material !== void 0)
      ) {
        if (Array.isArray(this.material)) {
          let t = [];
          for (let n = 0, r = this.material.length; n < r; n++)
            t.push(i(e.materials, this.material[n]));
          r.material = t;
        } else r.material = i(e.materials, this.material);
      }
      if (this.children.length > 0) {
        r.children = [];
        for (let t = 0; t < this.children.length; t++)
          r.children.push(this.children[t].toJSON(e).object);
      }
      if (this.animations.length > 0) {
        r.animations = [];
        for (let t = 0; t < this.animations.length; t++) {
          let n = this.animations[t];
          r.animations.push(i(e.animations, n));
        }
      }
      if (t) {
        let t = a(e.geometries),
          r = a(e.materials),
          i = a(e.textures),
          o = a(e.images),
          s = a(e.shapes),
          c = a(e.skeletons),
          l = a(e.animations),
          u = a(e.nodes);
        (t.length > 0 && (n.geometries = t),
          r.length > 0 && (n.materials = r),
          i.length > 0 && (n.textures = i),
          o.length > 0 && (n.images = o),
          s.length > 0 && (n.shapes = s),
          c.length > 0 && (n.skeletons = c),
          l.length > 0 && (n.animations = l),
          u.length > 0 && (n.nodes = u));
      }
      return ((n.object = r), n);
      function a(e) {
        let t = [];
        for (let n in e) {
          let r = e[n];
          (delete r.metadata, t.push(r));
        }
        return t;
      }
    }
    clone(e) {
      return new this.constructor().copy(this, e);
    }
    copy(e, t = !0) {
      if (
        ((this.name = e.name),
        this.up.copy(e.up),
        this.position.copy(e.position),
        (this.rotation.order = e.rotation.order),
        this.quaternion.copy(e.quaternion),
        this.scale.copy(e.scale),
        (this.pivot = e.pivot === null ? null : e.pivot.clone()),
        this.matrix.copy(e.matrix),
        this.matrixWorld.copy(e.matrixWorld),
        (this.matrixAutoUpdate = e.matrixAutoUpdate),
        (this.matrixWorldAutoUpdate = e.matrixWorldAutoUpdate),
        (this.matrixWorldNeedsUpdate = e.matrixWorldNeedsUpdate),
        (this.layers.mask = e.layers.mask),
        (this.visible = e.visible),
        (this.castShadow = e.castShadow),
        (this.receiveShadow = e.receiveShadow),
        (this.frustumCulled = e.frustumCulled),
        (this.renderOrder = e.renderOrder),
        (this.static = e.static),
        (this.animations = e.animations.slice()),
        (this.userData = JSON.parse(JSON.stringify(e.userData))),
        t === !0)
      )
        for (let t = 0; t < e.children.length; t++) {
          let n = e.children[t];
          this.add(n.clone());
        }
      return this;
    }
    dispose() {
      this.dispatchEvent({ type: `dispose` });
    }
  };
  ((Le.DEFAULT_UP = /*@__PURE__*/ new M(0, 1, 0)),
    (Le.DEFAULT_MATRIX_AUTO_UPDATE = !0),
    (Le.DEFAULT_MATRIX_WORLD_AUTO_UPDATE = !0));
  let Re = {
      aliceblue: 15792383,
      antiquewhite: 16444375,
      aqua: 65535,
      aquamarine: 8388564,
      azure: 15794175,
      beige: 16119260,
      bisque: 16770244,
      black: 0,
      blanchedalmond: 16772045,
      blue: 255,
      blueviolet: 9055202,
      brown: 10824234,
      burlywood: 14596231,
      cadetblue: 6266528,
      chartreuse: 8388352,
      chocolate: 13789470,
      coral: 16744272,
      cornflowerblue: 6591981,
      cornsilk: 16775388,
      crimson: 14423100,
      cyan: 65535,
      darkblue: 139,
      darkcyan: 35723,
      darkgoldenrod: 12092939,
      darkgray: 11119017,
      darkgreen: 25600,
      darkgrey: 11119017,
      darkkhaki: 12433259,
      darkmagenta: 9109643,
      darkolivegreen: 5597999,
      darkorange: 16747520,
      darkorchid: 10040012,
      darkred: 9109504,
      darksalmon: 15308410,
      darkseagreen: 9419919,
      darkslateblue: 4734347,
      darkslategray: 3100495,
      darkslategrey: 3100495,
      darkturquoise: 52945,
      darkviolet: 9699539,
      deeppink: 16716947,
      deepskyblue: 49151,
      dimgray: 6908265,
      dimgrey: 6908265,
      dodgerblue: 2003199,
      firebrick: 11674146,
      floralwhite: 16775920,
      forestgreen: 2263842,
      fuchsia: 16711935,
      gainsboro: 14474460,
      ghostwhite: 16316671,
      gold: 16766720,
      goldenrod: 14329120,
      gray: 8421504,
      green: 32768,
      greenyellow: 11403055,
      grey: 8421504,
      honeydew: 15794160,
      hotpink: 16738740,
      indianred: 13458524,
      indigo: 4915330,
      ivory: 16777200,
      khaki: 15787660,
      lavender: 15132410,
      lavenderblush: 16773365,
      lawngreen: 8190976,
      lemonchiffon: 16775885,
      lightblue: 11393254,
      lightcoral: 15761536,
      lightcyan: 14745599,
      lightgoldenrodyellow: 16448210,
      lightgray: 13882323,
      lightgreen: 9498256,
      lightgrey: 13882323,
      lightpink: 16758465,
      lightsalmon: 16752762,
      lightseagreen: 2142890,
      lightskyblue: 8900346,
      lightslategray: 7833753,
      lightslategrey: 7833753,
      lightsteelblue: 11584734,
      lightyellow: 16777184,
      lime: 65280,
      limegreen: 3329330,
      linen: 16445670,
      magenta: 16711935,
      maroon: 8388608,
      mediumaquamarine: 6737322,
      mediumblue: 205,
      mediumorchid: 12211667,
      mediumpurple: 9662683,
      mediumseagreen: 3978097,
      mediumslateblue: 8087790,
      mediumspringgreen: 64154,
      mediumturquoise: 4772300,
      mediumvioletred: 13047173,
      midnightblue: 1644912,
      mintcream: 16121850,
      mistyrose: 16770273,
      moccasin: 16770229,
      navajowhite: 16768685,
      navy: 128,
      oldlace: 16643558,
      olive: 8421376,
      olivedrab: 7048739,
      orange: 16753920,
      orangered: 16729344,
      orchid: 14315734,
      palegoldenrod: 15657130,
      palegreen: 10025880,
      paleturquoise: 11529966,
      palevioletred: 14381203,
      papayawhip: 16773077,
      peachpuff: 16767673,
      peru: 13468991,
      pink: 16761035,
      plum: 14524637,
      powderblue: 11591910,
      purple: 8388736,
      rebeccapurple: 6697881,
      red: 16711680,
      rosybrown: 12357519,
      royalblue: 4286945,
      saddlebrown: 9127187,
      salmon: 16416882,
      sandybrown: 16032864,
      seagreen: 3050327,
      seashell: 16774638,
      sienna: 10506797,
      silver: 12632256,
      skyblue: 8900331,
      slateblue: 6970061,
      slategray: 7372944,
      slategrey: 7372944,
      snow: 16775930,
      springgreen: 65407,
      steelblue: 4620980,
      tan: 13808780,
      teal: 32896,
      thistle: 14204888,
      tomato: 16737095,
      turquoise: 4251856,
      violet: 15631086,
      wheat: 16113331,
      white: 16777215,
      whitesmoke: 16119285,
      yellow: 16776960,
      yellowgreen: 10145074,
    },
    ze = { h: 0, s: 0, l: 0 },
    Be = { h: 0, s: 0, l: 0 };
  function Ve(e, t, n) {
    return (
      n < 0 && (n += 1),
      n > 1 && --n,
      n < 1 / 6
        ? e + (t - e) * 6 * n
        : n < 1 / 2
          ? t
          : n < 2 / 3
            ? e + (t - e) * 6 * (2 / 3 - n)
            : e
    );
  }
  var He = class {
    constructor(e, t, n) {
      return (
        (this.isColor = !0),
        (this.r = 1),
        (this.g = 1),
        (this.b = 1),
        this.set(e, t, n)
      );
    }
    set(e, t, n) {
      if (t === void 0 && n === void 0) {
        let t = e;
        t && t.isColor
          ? this.copy(t)
          : typeof t == `number`
            ? this.setHex(t)
            : typeof t == `string` && this.setStyle(t);
      } else this.setRGB(e, t, n);
      return this;
    }
    setScalar(e) {
      return ((this.r = e), (this.g = e), (this.b = e), this);
    }
    setHex(e, t = u) {
      return (
        (e = Math.floor(e)),
        (this.r = ((e >> 16) & 255) / 255),
        (this.g = ((e >> 8) & 255) / 255),
        (this.b = (e & 255) / 255),
        R.colorSpaceToWorking(this, t),
        this
      );
    }
    setRGB(e, t, n, r = R.workingColorSpace) {
      return (
        (this.r = e),
        (this.g = t),
        (this.b = n),
        R.colorSpaceToWorking(this, r),
        this
      );
    }
    setHSL(e, t, n, r = R.workingColorSpace) {
      if (((e = E(e, 1)), (t = T(t, 0, 1)), (n = T(n, 0, 1)), t === 0))
        this.r = this.g = this.b = n;
      else {
        let r = n <= 0.5 ? n * (1 + t) : n + t - n * t,
          i = 2 * n - r;
        ((this.r = Ve(i, r, e + 1 / 3)),
          (this.g = Ve(i, r, e)),
          (this.b = Ve(i, r, e - 1 / 3)));
      }
      return (R.colorSpaceToWorking(this, r), this);
    }
    setStyle(e, t = u) {
      function n(t) {
        t !== void 0 &&
          parseFloat(t) < 1 &&
          y(`Color: Alpha component of ` + e + ` will be ignored.`);
      }
      let r;
      if ((r = /^(\w+)\(([^\)]*)\)/.exec(e))) {
        let i,
          a = r[1],
          o = r[2];
        switch (a) {
          case `rgb`:
          case `rgba`:
            if (
              (i =
                /^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(
                  o,
                ))
            )
              return (
                n(i[4]),
                this.setRGB(
                  Math.min(255, parseInt(i[1], 10)) / 255,
                  Math.min(255, parseInt(i[2], 10)) / 255,
                  Math.min(255, parseInt(i[3], 10)) / 255,
                  t,
                )
              );
            if (
              (i =
                /^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(
                  o,
                ))
            )
              return (
                n(i[4]),
                this.setRGB(
                  Math.min(100, parseInt(i[1], 10)) / 100,
                  Math.min(100, parseInt(i[2], 10)) / 100,
                  Math.min(100, parseInt(i[3], 10)) / 100,
                  t,
                )
              );
            break;
          case `hsl`:
          case `hsla`:
            if (
              (i =
                /^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(
                  o,
                ))
            )
              return (
                n(i[4]),
                this.setHSL(
                  parseFloat(i[1]) / 360,
                  parseFloat(i[2]) / 100,
                  parseFloat(i[3]) / 100,
                  t,
                )
              );
            break;
          default:
            y(`Color: Unknown color model ` + e);
        }
      } else if ((r = /^\#([A-Fa-f\d]+)$/.exec(e))) {
        let n = r[1],
          i = n.length;
        if (i === 3)
          return this.setRGB(
            parseInt(n.charAt(0), 16) / 15,
            parseInt(n.charAt(1), 16) / 15,
            parseInt(n.charAt(2), 16) / 15,
            t,
          );
        if (i === 6) return this.setHex(parseInt(n, 16), t);
        y(`Color: Invalid hex color ` + e);
      } else if (e && e.length > 0) return this.setColorName(e, t);
      return this;
    }
    setColorName(e, t = u) {
      let n = Re[e.toLowerCase()];
      return (
        n === void 0 ? y(`Color: Unknown color ` + e) : this.setHex(n, t),
        this
      );
    }
    clone() {
      return new this.constructor(this.r, this.g, this.b);
    }
    copy(e) {
      return ((this.r = e.r), (this.g = e.g), (this.b = e.b), this);
    }
    copySRGBToLinear(e) {
      return ((this.r = ne(e.r)), (this.g = ne(e.g)), (this.b = ne(e.b)), this);
    }
    copyLinearToSRGB(e) {
      return ((this.r = re(e.r)), (this.g = re(e.g)), (this.b = re(e.b)), this);
    }
    convertSRGBToLinear() {
      return (this.copySRGBToLinear(this), this);
    }
    convertLinearToSRGB() {
      return (this.copyLinearToSRGB(this), this);
    }
    getHex(e = u) {
      return (
        R.workingToColorSpace(Ue.copy(this), e),
        Math.round(T(Ue.r * 255, 0, 255)) * 65536 +
          Math.round(T(Ue.g * 255, 0, 255)) * 256 +
          Math.round(T(Ue.b * 255, 0, 255))
      );
    }
    getHexString(e = u) {
      return (`000000` + this.getHex(e).toString(16)).slice(-6);
    }
    getHSL(e, t = R.workingColorSpace) {
      R.workingToColorSpace(Ue.copy(this), t);
      let n = Ue.r,
        r = Ue.g,
        i = Ue.b,
        a = Math.max(n, r, i),
        o = Math.min(n, r, i),
        s,
        c,
        l = (o + a) / 2;
      if (o === a) ((s = 0), (c = 0));
      else {
        let e = a - o;
        switch (((c = l <= 0.5 ? e / (a + o) : e / (2 - a - o)), a)) {
          case n:
            s = (r - i) / e + (r < i ? 6 : 0);
            break;
          case r:
            s = (i - n) / e + 2;
            break;
          case i:
            s = (n - r) / e + 4;
        }
        s /= 6;
      }
      return ((e.h = s), (e.s = c), (e.l = l), e);
    }
    getRGB(e, t = R.workingColorSpace) {
      return (
        R.workingToColorSpace(Ue.copy(this), t),
        (e.r = Ue.r),
        (e.g = Ue.g),
        (e.b = Ue.b),
        e
      );
    }
    getStyle(e = u) {
      R.workingToColorSpace(Ue.copy(this), e);
      let t = Ue.r,
        n = Ue.g,
        r = Ue.b;
      return e === `srgb`
        ? `rgb(${Math.round(t * 255)},${Math.round(n * 255)},${Math.round(r * 255)})`
        : `color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${r.toFixed(3)})`;
    }
    offsetHSL(e, t, n) {
      return (this.getHSL(ze), this.setHSL(ze.h + e, ze.s + t, ze.l + n));
    }
    add(e) {
      return ((this.r += e.r), (this.g += e.g), (this.b += e.b), this);
    }
    addColors(e, t) {
      return (
        (this.r = e.r + t.r),
        (this.g = e.g + t.g),
        (this.b = e.b + t.b),
        this
      );
    }
    addScalar(e) {
      return ((this.r += e), (this.g += e), (this.b += e), this);
    }
    sub(e) {
      return (
        (this.r = Math.max(0, this.r - e.r)),
        (this.g = Math.max(0, this.g - e.g)),
        (this.b = Math.max(0, this.b - e.b)),
        this
      );
    }
    multiply(e) {
      return ((this.r *= e.r), (this.g *= e.g), (this.b *= e.b), this);
    }
    multiplyScalar(e) {
      return ((this.r *= e), (this.g *= e), (this.b *= e), this);
    }
    lerp(e, t) {
      return (
        (this.r += (e.r - this.r) * t),
        (this.g += (e.g - this.g) * t),
        (this.b += (e.b - this.b) * t),
        this
      );
    }
    lerpColors(e, t, n) {
      return (
        (this.r = e.r + (t.r - e.r) * n),
        (this.g = e.g + (t.g - e.g) * n),
        (this.b = e.b + (t.b - e.b) * n),
        this
      );
    }
    lerpHSL(e, t) {
      (this.getHSL(ze), e.getHSL(Be));
      let n = D(ze.h, Be.h, t),
        r = D(ze.s, Be.s, t),
        i = D(ze.l, Be.l, t);
      return (this.setHSL(n, r, i), this);
    }
    setFromVector3(e) {
      return ((this.r = e.x), (this.g = e.y), (this.b = e.z), this);
    }
    applyMatrix3(e) {
      let t = this.r,
        n = this.g,
        r = this.b,
        i = e.elements;
      return (
        (this.r = i[0] * t + i[3] * n + i[6] * r),
        (this.g = i[1] * t + i[4] * n + i[7] * r),
        (this.b = i[2] * t + i[5] * n + i[8] * r),
        this
      );
    }
    equals(e) {
      return e.r === this.r && e.g === this.g && e.b === this.b;
    }
    fromArray(e, t = 0) {
      return ((this.r = e[t]), (this.g = e[t + 1]), (this.b = e[t + 2]), this);
    }
    toArray(e = [], t = 0) {
      return ((e[t] = this.r), (e[t + 1] = this.g), (e[t + 2] = this.b), e);
    }
    fromBufferAttribute(e, t) {
      return (
        (this.r = e.getX(t)),
        (this.g = e.getY(t)),
        (this.b = e.getZ(t)),
        this
      );
    }
    toJSON() {
      return this.getHex();
    }
    *[Symbol.iterator]() {
      (yield this.r, yield this.g, yield this.b);
    }
  };
  let Ue = /*@__PURE__*/ new He();
  He.NAMES = Re;
  var We = class {
    constructor(
      e = new M(1 / 0, 1 / 0, 1 / 0),
      t = new M(-1 / 0, -1 / 0, -1 / 0),
    ) {
      ((this.isBox3 = !0), (this.min = e), (this.max = t));
    }
    set(e, t) {
      return (this.min.copy(e), this.max.copy(t), this);
    }
    setFromArray(e) {
      this.makeEmpty();
      for (let t = 0, n = e.length; t < n; t += 3)
        this.expandByPoint(Ke.fromArray(e, t));
      return this;
    }
    setFromBufferAttribute(e) {
      this.makeEmpty();
      for (let t = 0, n = e.count; t < n; t++)
        this.expandByPoint(Ke.fromBufferAttribute(e, t));
      return this;
    }
    setFromPoints(e) {
      this.makeEmpty();
      for (let t = 0, n = e.length; t < n; t++) this.expandByPoint(e[t]);
      return this;
    }
    setFromCenterAndSize(e, t) {
      let n = Ke.copy(t).multiplyScalar(0.5);
      return (this.min.copy(e).sub(n), this.max.copy(e).add(n), this);
    }
    setFromObject(e, t = !1) {
      return (this.makeEmpty(), this.expandByObject(e, t));
    }
    clone() {
      return new this.constructor().copy(this);
    }
    copy(e) {
      return (this.min.copy(e.min), this.max.copy(e.max), this);
    }
    makeEmpty() {
      return (
        (this.min.x = this.min.y = this.min.z = 1 / 0),
        (this.max.x = this.max.y = this.max.z = -1 / 0),
        this
      );
    }
    isEmpty() {
      return (
        this.max.x < this.min.x ||
        this.max.y < this.min.y ||
        this.max.z < this.min.z
      );
    }
    getCenter(e) {
      return this.isEmpty()
        ? e.set(0, 0, 0)
        : e.addVectors(this.min, this.max).multiplyScalar(0.5);
    }
    getSize(e) {
      return this.isEmpty() ? e.set(0, 0, 0) : e.subVectors(this.max, this.min);
    }
    expandByPoint(e) {
      return (this.min.min(e), this.max.max(e), this);
    }
    expandByVector(e) {
      return (this.min.sub(e), this.max.add(e), this);
    }
    expandByScalar(e) {
      return (this.min.addScalar(-e), this.max.addScalar(e), this);
    }
    expandByObject(e, t = !1) {
      e.updateWorldMatrix(!1, !1);
      let n = e.geometry;
      if (n !== void 0) {
        let r = n.getAttribute(`position`);
        if (t === !0 && r !== void 0 && e.isInstancedMesh !== !0)
          for (let t = 0, n = r.count; t < n; t++)
            (e.isMesh === !0
              ? e.getVertexPosition(t, Ke)
              : Ke.fromBufferAttribute(r, t),
              Ke.applyMatrix4(e.matrixWorld),
              this.expandByPoint(Ke));
        else
          (e.boundingBox === void 0
            ? (n.boundingBox === null && n.computeBoundingBox(),
              qe.copy(n.boundingBox))
            : (e.boundingBox === null && e.computeBoundingBox(),
              qe.copy(e.boundingBox)),
            qe.applyMatrix4(e.matrixWorld),
            this.union(qe));
      }
      let r = e.children;
      for (let e = 0, n = r.length; e < n; e++) this.expandByObject(r[e], t);
      return this;
    }
    containsPoint(e) {
      return (
        e.x >= this.min.x &&
        e.x <= this.max.x &&
        e.y >= this.min.y &&
        e.y <= this.max.y &&
        e.z >= this.min.z &&
        e.z <= this.max.z
      );
    }
    containsBox(e) {
      return (
        this.min.x <= e.min.x &&
        e.max.x <= this.max.x &&
        this.min.y <= e.min.y &&
        e.max.y <= this.max.y &&
        this.min.z <= e.min.z &&
        e.max.z <= this.max.z
      );
    }
    getParameter(e, t) {
      return t.set(
        (e.x - this.min.x) / (this.max.x - this.min.x),
        (e.y - this.min.y) / (this.max.y - this.min.y),
        (e.z - this.min.z) / (this.max.z - this.min.z),
      );
    }
    intersectsBox(e) {
      return (
        e.max.x >= this.min.x &&
        e.min.x <= this.max.x &&
        e.max.y >= this.min.y &&
        e.min.y <= this.max.y &&
        e.max.z >= this.min.z &&
        e.min.z <= this.max.z
      );
    }
    intersectsSphere(e) {
      return (
        this.clampPoint(e.center, Ke),
        Ke.distanceToSquared(e.center) <= e.radius * e.radius
      );
    }
    intersectsPlane(e) {
      let t, n;
      return (
        e.normal.x > 0
          ? ((t = e.normal.x * this.min.x), (n = e.normal.x * this.max.x))
          : ((t = e.normal.x * this.max.x), (n = e.normal.x * this.min.x)),
        e.normal.y > 0
          ? ((t += e.normal.y * this.min.y), (n += e.normal.y * this.max.y))
          : ((t += e.normal.y * this.max.y), (n += e.normal.y * this.min.y)),
        e.normal.z > 0
          ? ((t += e.normal.z * this.min.z), (n += e.normal.z * this.max.z))
          : ((t += e.normal.z * this.max.z), (n += e.normal.z * this.min.z)),
        t <= -e.constant && n >= -e.constant
      );
    }
    intersectsTriangle(e) {
      if (this.isEmpty()) return !1;
      (this.getCenter(et),
        tt.subVectors(this.max, et),
        Je.subVectors(e.a, et),
        Ye.subVectors(e.b, et),
        Xe.subVectors(e.c, et),
        Ze.subVectors(Ye, Je),
        Qe.subVectors(Xe, Ye),
        $e.subVectors(Je, Xe));
      let t = [
        0,
        -Ze.z,
        Ze.y,
        0,
        -Qe.z,
        Qe.y,
        0,
        -$e.z,
        $e.y,
        Ze.z,
        0,
        -Ze.x,
        Qe.z,
        0,
        -Qe.x,
        $e.z,
        0,
        -$e.x,
        -Ze.y,
        Ze.x,
        0,
        -Qe.y,
        Qe.x,
        0,
        -$e.y,
        $e.x,
        0,
      ];
      return !it(t, Je, Ye, Xe, tt) ||
        ((t = [1, 0, 0, 0, 1, 0, 0, 0, 1]), !it(t, Je, Ye, Xe, tt))
        ? !1
        : (nt.crossVectors(Ze, Qe),
          (t = [nt.x, nt.y, nt.z]),
          it(t, Je, Ye, Xe, tt));
    }
    clampPoint(e, t) {
      return t.copy(e).clamp(this.min, this.max);
    }
    distanceToPoint(e) {
      return this.clampPoint(e, Ke).distanceTo(e);
    }
    getBoundingSphere(e) {
      return (
        this.isEmpty()
          ? e.makeEmpty()
          : (this.getCenter(e.center),
            (e.radius = this.getSize(Ke).length() * 0.5)),
        e
      );
    }
    intersect(e) {
      return (
        this.min.max(e.min),
        this.max.min(e.max),
        this.isEmpty() && this.makeEmpty(),
        this
      );
    }
    union(e) {
      return (this.min.min(e.min), this.max.max(e.max), this);
    }
    applyMatrix4(e) {
      return this.isEmpty()
        ? this
        : (Ge[0].set(this.min.x, this.min.y, this.min.z).applyMatrix4(e),
          Ge[1].set(this.min.x, this.min.y, this.max.z).applyMatrix4(e),
          Ge[2].set(this.min.x, this.max.y, this.min.z).applyMatrix4(e),
          Ge[3].set(this.min.x, this.max.y, this.max.z).applyMatrix4(e),
          Ge[4].set(this.max.x, this.min.y, this.min.z).applyMatrix4(e),
          Ge[5].set(this.max.x, this.min.y, this.max.z).applyMatrix4(e),
          Ge[6].set(this.max.x, this.max.y, this.min.z).applyMatrix4(e),
          Ge[7].set(this.max.x, this.max.y, this.max.z).applyMatrix4(e),
          this.setFromPoints(Ge),
          this);
    }
    translate(e) {
      return (this.min.add(e), this.max.add(e), this);
    }
    equals(e) {
      return e.min.equals(this.min) && e.max.equals(this.max);
    }
    toJSON() {
      return { min: this.min.toArray(), max: this.max.toArray() };
    }
    fromJSON(e) {
      return (this.min.fromArray(e.min), this.max.fromArray(e.max), this);
    }
  };
  let Ge = [
      /*@__PURE__*/ new M(),
      /*@__PURE__*/ new M(),
      /*@__PURE__*/ new M(),
      /*@__PURE__*/ new M(),
      /*@__PURE__*/ new M(),
      /*@__PURE__*/ new M(),
      /*@__PURE__*/ new M(),
      /*@__PURE__*/ new M(),
    ],
    Ke = /*@__PURE__*/ new M(),
    qe = /*@__PURE__*/ new We(),
    Je = /*@__PURE__*/ new M(),
    Ye = /*@__PURE__*/ new M(),
    Xe = /*@__PURE__*/ new M(),
    Ze = /*@__PURE__*/ new M(),
    Qe = /*@__PURE__*/ new M(),
    $e = /*@__PURE__*/ new M(),
    et = /*@__PURE__*/ new M(),
    tt = /*@__PURE__*/ new M(),
    nt = /*@__PURE__*/ new M(),
    rt = /*@__PURE__*/ new M();
  function it(e, t, n, r, i) {
    for (let a = 0, o = e.length - 3; a <= o; a += 3) {
      rt.fromArray(e, a);
      let o =
          i.x * Math.abs(rt.x) + i.y * Math.abs(rt.y) + i.z * Math.abs(rt.z),
        s = t.dot(rt),
        c = n.dot(rt),
        l = r.dot(rt);
      if (Math.max(-Math.max(s, c, l), Math.min(s, c, l)) > o) return !1;
    }
    return !0;
  }
  let V = /*@__PURE__*/ new M(),
    at = /*@__PURE__*/ new A(),
    ot = 0;
  var st = class extends S {
      constructor(e, t, n = !1) {
        if ((super(), Array.isArray(e)))
          throw TypeError(
            `THREE.BufferAttribute: array should be a Typed Array.`,
          );
        ((this.isBufferAttribute = !0),
          Object.defineProperty(this, "id", { value: ot++ }),
          (this.name = ``),
          (this.array = e),
          (this.itemSize = t),
          (this.count = e === void 0 ? 0 : e.length / t),
          (this.normalized = n),
          (this.usage = 35044),
          (this.updateRanges = []),
          (this.gpuType = 1015),
          (this.version = 0));
      }
      onUploadCallback() {}
      set needsUpdate(e) {
        e === !0 && this.version++;
      }
      setUsage(e) {
        return ((this.usage = e), this);
      }
      addUpdateRange(e, t) {
        this.updateRanges.push({ start: e, count: t });
      }
      clearUpdateRanges() {
        this.updateRanges.length = 0;
      }
      copy(e) {
        return (
          (this.name = e.name),
          (this.array = new e.array.constructor(e.array)),
          (this.itemSize = e.itemSize),
          (this.count = e.count),
          (this.normalized = e.normalized),
          (this.usage = e.usage),
          (this.gpuType = e.gpuType),
          this
        );
      }
      copyAt(e, t, n) {
        ((e *= this.itemSize), (n *= t.itemSize));
        for (let r = 0, i = this.itemSize; r < i; r++)
          this.array[e + r] = t.array[n + r];
        return this;
      }
      copyArray(e) {
        return (this.array.set(e), this);
      }
      applyMatrix3(e) {
        if (this.itemSize === 2)
          for (let t = 0, n = this.count; t < n; t++)
            (at.fromBufferAttribute(this, t),
              at.applyMatrix3(e),
              this.setXY(t, at.x, at.y));
        else if (this.itemSize === 3)
          for (let t = 0, n = this.count; t < n; t++)
            (V.fromBufferAttribute(this, t),
              V.applyMatrix3(e),
              this.setXYZ(t, V.x, V.y, V.z));
        return this;
      }
      applyMatrix4(e) {
        for (let t = 0, n = this.count; t < n; t++)
          (V.fromBufferAttribute(this, t),
            V.applyMatrix4(e),
            this.setXYZ(t, V.x, V.y, V.z));
        return this;
      }
      applyNormalMatrix(e) {
        for (let t = 0, n = this.count; t < n; t++)
          (V.fromBufferAttribute(this, t),
            V.applyNormalMatrix(e),
            this.setXYZ(t, V.x, V.y, V.z));
        return this;
      }
      transformDirection(e) {
        for (let t = 0, n = this.count; t < n; t++)
          (V.fromBufferAttribute(this, t),
            V.transformDirection(e),
            this.setXYZ(t, V.x, V.y, V.z));
        return this;
      }
      set(e, t = 0) {
        return (this.array.set(e, t), this);
      }
      getComponent(e, t) {
        let n = this.array[e * this.itemSize + t];
        return (this.normalized && (n = O(n, this.array)), n);
      }
      setComponent(e, t, n) {
        return (
          this.normalized && (n = k(n, this.array)),
          (this.array[e * this.itemSize + t] = n),
          this
        );
      }
      getX(e) {
        let t = this.array[e * this.itemSize];
        return (this.normalized && (t = O(t, this.array)), t);
      }
      setX(e, t) {
        return (
          this.normalized && (t = k(t, this.array)),
          (this.array[e * this.itemSize] = t),
          this
        );
      }
      getY(e) {
        let t = this.array[e * this.itemSize + 1];
        return (this.normalized && (t = O(t, this.array)), t);
      }
      setY(e, t) {
        return (
          this.normalized && (t = k(t, this.array)),
          (this.array[e * this.itemSize + 1] = t),
          this
        );
      }
      getZ(e) {
        let t = this.array[e * this.itemSize + 2];
        return (this.normalized && (t = O(t, this.array)), t);
      }
      setZ(e, t) {
        return (
          this.normalized && (t = k(t, this.array)),
          (this.array[e * this.itemSize + 2] = t),
          this
        );
      }
      getW(e) {
        let t = this.array[e * this.itemSize + 3];
        return (this.normalized && (t = O(t, this.array)), t);
      }
      setW(e, t) {
        return (
          this.normalized && (t = k(t, this.array)),
          (this.array[e * this.itemSize + 3] = t),
          this
        );
      }
      setXY(e, t, n) {
        return (
          (e *= this.itemSize),
          this.normalized && ((t = k(t, this.array)), (n = k(n, this.array))),
          (this.array[e + 0] = t),
          (this.array[e + 1] = n),
          this
        );
      }
      setXYZ(e, t, n, r) {
        return (
          (e *= this.itemSize),
          this.normalized &&
            ((t = k(t, this.array)),
            (n = k(n, this.array)),
            (r = k(r, this.array))),
          (this.array[e + 0] = t),
          (this.array[e + 1] = n),
          (this.array[e + 2] = r),
          this
        );
      }
      setXYZW(e, t, n, r, i) {
        return (
          (e *= this.itemSize),
          this.normalized &&
            ((t = k(t, this.array)),
            (n = k(n, this.array)),
            (r = k(r, this.array)),
            (i = k(i, this.array))),
          (this.array[e + 0] = t),
          (this.array[e + 1] = n),
          (this.array[e + 2] = r),
          (this.array[e + 3] = i),
          this
        );
      }
      onUpload(e) {
        return ((this.onUploadCallback = e), this);
      }
      clone() {
        return new this.constructor(this.array, this.itemSize).copy(this);
      }
      toJSON() {
        let e = {
          itemSize: this.itemSize,
          type: this.array.constructor.name,
          array: Array.from(this.array),
          normalized: this.normalized,
        };
        return (
          (e.name = this.name),
          (e.usage = this.usage),
          (e.gpuType = this.gpuType),
          e
        );
      }
      dispose() {
        this.dispatchEvent({ type: `dispose` });
      }
    },
    ct = class extends st {
      constructor(e, t, n) {
        super(new Uint16Array(e), t, n);
      }
    },
    lt = class extends st {
      constructor(e, t, n) {
        super(new Uint32Array(e), t, n);
      }
    },
    H = class extends st {
      constructor(e, t, n) {
        super(new Float32Array(e), t, n);
      }
    };
  let ut = /*@__PURE__*/ new We(),
    dt = /*@__PURE__*/ new M(),
    ft = /*@__PURE__*/ new M();
  var pt = class {
    constructor(e = new M(), t = -1) {
      ((this.isSphere = !0), (this.center = e), (this.radius = t));
    }
    set(e, t) {
      return (this.center.copy(e), (this.radius = t), this);
    }
    setFromPoints(e, t) {
      let n = this.center;
      t === void 0 ? ut.setFromPoints(e).getCenter(n) : n.copy(t);
      let r = 0;
      for (let t = 0, i = e.length; t < i; t++)
        r = Math.max(r, n.distanceToSquared(e[t]));
      return ((this.radius = Math.sqrt(r)), this);
    }
    copy(e) {
      return (this.center.copy(e.center), (this.radius = e.radius), this);
    }
    isEmpty() {
      return this.radius < 0;
    }
    makeEmpty() {
      return (this.center.set(0, 0, 0), (this.radius = -1), this);
    }
    containsPoint(e) {
      return e.distanceToSquared(this.center) <= this.radius * this.radius;
    }
    distanceToPoint(e) {
      return e.distanceTo(this.center) - this.radius;
    }
    intersectsSphere(e) {
      let t = this.radius + e.radius;
      return e.center.distanceToSquared(this.center) <= t * t;
    }
    intersectsBox(e) {
      return e.intersectsSphere(this);
    }
    intersectsPlane(e) {
      return Math.abs(e.distanceToPoint(this.center)) <= this.radius;
    }
    clampPoint(e, t) {
      let n = this.center.distanceToSquared(e);
      return (
        t.copy(e),
        n > this.radius * this.radius &&
          (t.sub(this.center).normalize(),
          t.multiplyScalar(this.radius).add(this.center)),
        t
      );
    }
    getBoundingBox(e) {
      return this.isEmpty()
        ? (e.makeEmpty(), e)
        : (e.set(this.center, this.center), e.expandByScalar(this.radius), e);
    }
    applyMatrix4(e) {
      return (
        this.center.applyMatrix4(e),
        (this.radius *= e.getMaxScaleOnAxis()),
        this
      );
    }
    translate(e) {
      return (this.center.add(e), this);
    }
    expandByPoint(e) {
      if (this.isEmpty()) return (this.center.copy(e), (this.radius = 0), this);
      dt.subVectors(e, this.center);
      let t = dt.lengthSq();
      if (t > this.radius * this.radius) {
        let e = Math.sqrt(t),
          n = (e - this.radius) * 0.5;
        (this.center.addScaledVector(dt, n / e), (this.radius += n));
      }
      return this;
    }
    union(e) {
      return e.isEmpty()
        ? this
        : this.isEmpty()
          ? (this.copy(e), this)
          : (this.center.equals(e.center) === !0
              ? (this.radius = Math.max(this.radius, e.radius))
              : (ft.subVectors(e.center, this.center).setLength(e.radius),
                this.expandByPoint(dt.copy(e.center).add(ft)),
                this.expandByPoint(dt.copy(e.center).sub(ft))),
            this);
    }
    equals(e) {
      return e.center.equals(this.center) && e.radius === this.radius;
    }
    clone() {
      return new this.constructor().copy(this);
    }
    toJSON() {
      return { radius: this.radius, center: this.center.toArray() };
    }
    fromJSON(e) {
      return ((this.radius = e.radius), this.center.fromArray(e.center), this);
    }
  };
  let mt = 0,
    ht = /*@__PURE__*/ new ue(),
    gt = /*@__PURE__*/ new Le(),
    _t = /*@__PURE__*/ new M(),
    vt = /*@__PURE__*/ new We(),
    yt = /*@__PURE__*/ new We(),
    U = /*@__PURE__*/ new M();
  var bt = class e extends S {
      constructor() {
        (super(),
          (this.isBufferGeometry = !0),
          Object.defineProperty(this, "id", { value: mt++ }),
          (this.uuid = w()),
          (this.name = ``),
          (this.type = `BufferGeometry`),
          (this.index = null),
          (this.indirect = null),
          (this.indirectOffset = 0),
          (this.attributes = {}),
          (this.morphAttributes = {}),
          (this.morphTargetsRelative = !1),
          (this.groups = []),
          (this.boundingBox = null),
          (this.boundingSphere = null),
          (this.drawRange = { start: 0, count: 1 / 0 }),
          (this.userData = {}),
          (this._transformed = !1));
      }
      getIndex() {
        return this.index;
      }
      setIndex(e) {
        return (
          (this.index = Array.isArray(e) ? new (m(e) ? lt : ct)(e, 1) : e),
          this
        );
      }
      setIndirect(e, t = 0) {
        return ((this.indirect = e), (this.indirectOffset = t), this);
      }
      getIndirect() {
        return this.indirect;
      }
      getAttribute(e) {
        return this.attributes[e];
      }
      setAttribute(e, t) {
        return ((this.attributes[e] = t), this);
      }
      deleteAttribute(e) {
        return (delete this.attributes[e], this);
      }
      hasAttribute(e) {
        return this.attributes[e] !== void 0;
      }
      addGroup(e, t, n = 0) {
        this.groups.push({ start: e, count: t, materialIndex: n });
      }
      clearGroups() {
        this.groups = [];
      }
      setDrawRange(e, t) {
        ((this.drawRange.start = e), (this.drawRange.count = t));
      }
      applyMatrix4(e) {
        let t = this.attributes.position;
        t !== void 0 && (t.applyMatrix4(e), (t.needsUpdate = !0));
        let n = this.attributes.normal;
        if (n !== void 0) {
          let t = new P().getNormalMatrix(e);
          (n.applyNormalMatrix(t), (n.needsUpdate = !0));
        }
        let r = this.attributes.tangent;
        return (
          r !== void 0 && (r.transformDirection(e), (r.needsUpdate = !0)),
          this.boundingBox !== null && this.computeBoundingBox(),
          this.boundingSphere !== null && this.computeBoundingSphere(),
          (this._transformed = !0),
          this
        );
      }
      applyQuaternion(e) {
        return (ht.makeRotationFromQuaternion(e), this.applyMatrix4(ht), this);
      }
      rotateX(e) {
        return (ht.makeRotationX(e), this.applyMatrix4(ht), this);
      }
      rotateY(e) {
        return (ht.makeRotationY(e), this.applyMatrix4(ht), this);
      }
      rotateZ(e) {
        return (ht.makeRotationZ(e), this.applyMatrix4(ht), this);
      }
      translate(e, t, n) {
        return (ht.makeTranslation(e, t, n), this.applyMatrix4(ht), this);
      }
      scale(e, t, n) {
        return (ht.makeScale(e, t, n), this.applyMatrix4(ht), this);
      }
      lookAt(e) {
        return (
          gt.lookAt(e),
          gt.updateMatrix(),
          this.applyMatrix4(gt.matrix),
          this
        );
      }
      center() {
        return (
          this.computeBoundingBox(),
          this.boundingBox.getCenter(_t).negate(),
          this.translate(_t.x, _t.y, _t.z),
          this
        );
      }
      setFromPoints(e) {
        let t = this.getAttribute(`position`);
        if (t === void 0) {
          let t = [];
          for (let n = 0, r = e.length; n < r; n++) {
            let r = e[n];
            t.push(r.x, r.y, r.z || 0);
          }
          this.setAttribute(`position`, new H(t, 3));
        } else {
          let n = Math.min(e.length, t.count);
          for (let r = 0; r < n; r++) {
            let n = e[r];
            t.setXYZ(r, n.x, n.y, n.z || 0);
          }
          (e.length > t.count &&
            y(
              `BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry.`,
            ),
            (t.needsUpdate = !0));
        }
        return this;
      }
      computeBoundingBox() {
        this.boundingBox === null && (this.boundingBox = new We());
        let e = this.attributes.position,
          t = this.morphAttributes.position;
        if (e && e.isGLBufferAttribute) {
          (b(
            `BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.`,
            this,
          ),
            this.boundingBox.set(
              new M(-1 / 0, -1 / 0, -1 / 0),
              new M(1 / 0, 1 / 0, 1 / 0),
            ));
          return;
        }
        if (e !== void 0) {
          if ((this.boundingBox.setFromBufferAttribute(e), t))
            for (let e = 0, n = t.length; e < n; e++) {
              let n = t[e];
              (vt.setFromBufferAttribute(n),
                this.morphTargetsRelative
                  ? (U.addVectors(this.boundingBox.min, vt.min),
                    this.boundingBox.expandByPoint(U),
                    U.addVectors(this.boundingBox.max, vt.max),
                    this.boundingBox.expandByPoint(U))
                  : (this.boundingBox.expandByPoint(vt.min),
                    this.boundingBox.expandByPoint(vt.max)));
            }
        } else this.boundingBox.makeEmpty();
        (isNaN(this.boundingBox.min.x) ||
          isNaN(this.boundingBox.min.y) ||
          isNaN(this.boundingBox.min.z)) &&
          b(
            `BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.`,
            this,
          );
      }
      computeBoundingSphere() {
        this.boundingSphere === null && (this.boundingSphere = new pt());
        let e = this.attributes.position,
          t = this.morphAttributes.position;
        if (e && e.isGLBufferAttribute) {
          (b(
            `BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.`,
            this,
          ),
            this.boundingSphere.set(new M(), 1 / 0));
          return;
        }
        if (e) {
          let n = this.boundingSphere.center;
          if ((vt.setFromBufferAttribute(e), t))
            for (let e = 0, n = t.length; e < n; e++) {
              let n = t[e];
              (yt.setFromBufferAttribute(n),
                this.morphTargetsRelative
                  ? (U.addVectors(vt.min, yt.min),
                    vt.expandByPoint(U),
                    U.addVectors(vt.max, yt.max),
                    vt.expandByPoint(U))
                  : (vt.expandByPoint(yt.min), vt.expandByPoint(yt.max)));
            }
          vt.getCenter(n);
          let r = 0;
          for (let t = 0, i = e.count; t < i; t++)
            (U.fromBufferAttribute(e, t),
              (r = Math.max(r, n.distanceToSquared(U))));
          if (t)
            for (let i = 0, a = t.length; i < a; i++) {
              let a = t[i],
                o = this.morphTargetsRelative;
              for (let t = 0, i = a.count; t < i; t++)
                (U.fromBufferAttribute(a, t),
                  o && (_t.fromBufferAttribute(e, t), U.add(_t)),
                  (r = Math.max(r, n.distanceToSquared(U))));
            }
          ((this.boundingSphere.radius = Math.sqrt(r)),
            isNaN(this.boundingSphere.radius) &&
              b(
                `BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.`,
                this,
              ));
        }
      }
      computeTangents() {
        let e = this.index,
          t = this.attributes;
        if (
          e === null ||
          t.position === void 0 ||
          t.normal === void 0 ||
          t.uv === void 0
        ) {
          b(
            `BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)`,
          );
          return;
        }
        let n = t.position,
          r = t.normal,
          i = t.uv,
          a = this.getAttribute(`tangent`);
        (a === void 0 || a.count !== n.count) &&
          ((a = new st(new Float32Array(4 * n.count), 4)),
          this.setAttribute(`tangent`, a));
        let o = [],
          s = [];
        for (let e = 0; e < n.count; e++) ((o[e] = new M()), (s[e] = new M()));
        let c = new M(),
          l = new M(),
          u = new M(),
          d = new A(),
          f = new A(),
          p = new A(),
          m = new M(),
          h = new M();
        function g(e, t, r) {
          (c.fromBufferAttribute(n, e),
            l.fromBufferAttribute(n, t),
            u.fromBufferAttribute(n, r),
            d.fromBufferAttribute(i, e),
            f.fromBufferAttribute(i, t),
            p.fromBufferAttribute(i, r),
            l.sub(c),
            u.sub(c),
            f.sub(d),
            p.sub(d));
          let a = 1 / (f.x * p.y - p.x * f.y);
          isFinite(a) &&
            (m
              .copy(l)
              .multiplyScalar(p.y)
              .addScaledVector(u, -f.y)
              .multiplyScalar(a),
            h
              .copy(u)
              .multiplyScalar(f.x)
              .addScaledVector(l, -p.x)
              .multiplyScalar(a),
            o[e].add(m),
            o[t].add(m),
            o[r].add(m),
            s[e].add(h),
            s[t].add(h),
            s[r].add(h));
        }
        let _ = this.groups;
        _.length === 0 && (_ = [{ start: 0, count: e.count }]);
        for (let t = 0, n = _.length; t < n; ++t) {
          let n = _[t],
            r = n.start,
            i = n.count;
          for (let t = r, n = r + i; t < n; t += 3)
            g(e.getX(t + 0), e.getX(t + 1), e.getX(t + 2));
        }
        let v = new M(),
          y = new M(),
          x = new M(),
          S = new M();
        function C(e) {
          (x.fromBufferAttribute(r, e), S.copy(x));
          let t = o[e];
          (v.copy(t),
            v.sub(x.multiplyScalar(x.dot(t))).normalize(),
            y.crossVectors(S, t));
          let n = y.dot(s[e]) < 0 ? -1 : 1;
          a.setXYZW(e, v.x, v.y, v.z, n);
        }
        for (let t = 0, n = _.length; t < n; ++t) {
          let n = _[t],
            r = n.start,
            i = n.count;
          for (let t = r, n = r + i; t < n; t += 3)
            (C(e.getX(t + 0)), C(e.getX(t + 1)), C(e.getX(t + 2)));
        }
        this._transformed = !0;
      }
      computeVertexNormals() {
        let e = this.index,
          t = this.getAttribute(`position`);
        if (t !== void 0) {
          let n = this.getAttribute(`normal`);
          if (n === void 0 || n.count !== t.count)
            ((n = new st(new Float32Array(t.count * 3), 3)),
              this.setAttribute(`normal`, n));
          else for (let e = 0, t = n.count; e < t; e++) n.setXYZ(e, 0, 0, 0);
          let r = new M(),
            i = new M(),
            a = new M(),
            o = new M(),
            s = new M(),
            c = new M(),
            l = new M(),
            u = new M();
          if (e)
            for (let d = 0, f = e.count; d < f; d += 3) {
              let f = e.getX(d + 0),
                p = e.getX(d + 1),
                m = e.getX(d + 2);
              (r.fromBufferAttribute(t, f),
                i.fromBufferAttribute(t, p),
                a.fromBufferAttribute(t, m),
                l.subVectors(a, i),
                u.subVectors(r, i),
                l.cross(u),
                o.fromBufferAttribute(n, f),
                s.fromBufferAttribute(n, p),
                c.fromBufferAttribute(n, m),
                o.add(l),
                s.add(l),
                c.add(l),
                n.setXYZ(f, o.x, o.y, o.z),
                n.setXYZ(p, s.x, s.y, s.z),
                n.setXYZ(m, c.x, c.y, c.z));
            }
          else
            for (let e = 0, o = t.count; e < o; e += 3)
              (r.fromBufferAttribute(t, e + 0),
                i.fromBufferAttribute(t, e + 1),
                a.fromBufferAttribute(t, e + 2),
                l.subVectors(a, i),
                u.subVectors(r, i),
                l.cross(u),
                n.setXYZ(e + 0, l.x, l.y, l.z),
                n.setXYZ(e + 1, l.x, l.y, l.z),
                n.setXYZ(e + 2, l.x, l.y, l.z));
          (this.normalizeNormals(), (n.needsUpdate = !0));
        }
      }
      normalizeNormals() {
        let e = this.attributes.normal;
        for (let t = 0, n = e.count; t < n; t++)
          (U.fromBufferAttribute(e, t),
            U.normalize(),
            e.setXYZ(t, U.x, U.y, U.z));
      }
      toNonIndexed() {
        function t(e, t) {
          let n = e.array,
            r = e.itemSize,
            i = e.normalized,
            a = new n.constructor(t.length * r),
            o = 0,
            s = 0;
          for (let i = 0, c = t.length; i < c; i++) {
            o = e.isInterleavedBufferAttribute
              ? t[i] * e.data.stride + e.offset
              : t[i] * r;
            for (let e = 0; e < r; e++) a[s++] = n[o++];
          }
          return new st(a, r, i);
        }
        if (this.index === null)
          return (
            y(
              `BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed.`,
            ),
            this
          );
        let n = new e(),
          r = this.index.array,
          i = this.attributes;
        for (let e in i) {
          let a = i[e],
            o = t(a, r);
          n.setAttribute(e, o);
        }
        let a = this.morphAttributes;
        for (let e in a) {
          let i = [],
            o = a[e];
          for (let e = 0, n = o.length; e < n; e++) {
            let n = o[e],
              a = t(n, r);
            i.push(a);
          }
          n.morphAttributes[e] = i;
        }
        n.morphTargetsRelative = this.morphTargetsRelative;
        let o = this.groups;
        for (let e = 0, t = o.length; e < t; e++) {
          let t = o[e];
          n.addGroup(t.start, t.count, t.materialIndex);
        }
        return n;
      }
      toJSON() {
        let e = {
          metadata: {
            version: 4.7,
            type: `BufferGeometry`,
            generator: `BufferGeometry.toJSON`,
          },
        };
        if (
          ((e.uuid = this.uuid),
          (e.type =
            this.parameters !== void 0 && this._transformed === !0
              ? `BufferGeometry`
              : this.type),
          (e.name = this.name),
          Object.keys(this.userData).length > 0 && (e.userData = this.userData),
          this.parameters !== void 0 && this._transformed !== !0)
        ) {
          let t = this.parameters;
          for (let n in t) t[n] !== void 0 && (e[n] = t[n]);
          return e;
        }
        e.data = { attributes: {} };
        let t = this.index;
        t !== null &&
          (e.data.index = {
            type: t.array.constructor.name,
            array: Array.prototype.slice.call(t.array),
          });
        let n = this.attributes;
        for (let t in n) {
          let r = n[t];
          e.data.attributes[t] = r.toJSON(e.data);
        }
        let r = {},
          i = !1;
        for (let t in this.morphAttributes) {
          let n = this.morphAttributes[t],
            a = [];
          for (let t = 0, r = n.length; t < r; t++) {
            let r = n[t];
            a.push(r.toJSON(e.data));
          }
          a.length > 0 && ((r[t] = a), (i = !0));
        }
        i &&
          ((e.data.morphAttributes = r),
          (e.data.morphTargetsRelative = this.morphTargetsRelative));
        let a = this.groups;
        a.length > 0 && (e.data.groups = JSON.parse(JSON.stringify(a)));
        let o = this.boundingSphere;
        return (o !== null && (e.data.boundingSphere = o.toJSON()), e);
      }
      clone() {
        return new this.constructor().copy(this);
      }
      copy(e) {
        ((this.index = null),
          (this.attributes = {}),
          (this.morphAttributes = {}),
          (this.groups = []),
          (this.boundingBox = null),
          (this.boundingSphere = null));
        let t = {};
        this.name = e.name;
        let n = e.index;
        n !== null && this.setIndex(n.clone());
        let r = e.attributes;
        for (let e in r) {
          let n = r[e];
          this.setAttribute(e, n.clone(t));
        }
        let i = e.morphAttributes;
        for (let e in i) {
          let n = [],
            r = i[e];
          for (let e = 0, i = r.length; e < i; e++) n.push(r[e].clone(t));
          this.morphAttributes[e] = n;
        }
        this.morphTargetsRelative = e.morphTargetsRelative;
        let a = e.groups;
        for (let e = 0, t = a.length; e < t; e++) {
          let t = a[e];
          this.addGroup(t.start, t.count, t.materialIndex);
        }
        let o = e.boundingBox;
        o !== null && (this.boundingBox = o.clone());
        let s = e.boundingSphere;
        return (
          s !== null && (this.boundingSphere = s.clone()),
          (this.drawRange.start = e.drawRange.start),
          (this.drawRange.count = e.drawRange.count),
          (this.userData = e.userData),
          (this._transformed = e._transformed),
          this
        );
      }
      dispose() {
        this.dispatchEvent({ type: `dispose` });
      }
    },
    xt = class e extends bt {
      constructor(e = 1, t = 1, n = 1, r = 1, i = 1, a = 1) {
        (super(),
          (this.type = `BoxGeometry`),
          (this.parameters = {
            width: e,
            height: t,
            depth: n,
            widthSegments: r,
            heightSegments: i,
            depthSegments: a,
          }));
        let o = this;
        ((r = Math.floor(r)), (i = Math.floor(i)), (a = Math.floor(a)));
        let s = [],
          c = [],
          l = [],
          u = [],
          d = 0,
          f = 0;
        (p(`z`, `y`, `x`, -1, -1, n, t, e, a, i, 0),
          p(`z`, `y`, `x`, 1, -1, n, t, -e, a, i, 1),
          p(`x`, `z`, `y`, 1, 1, e, n, t, r, a, 2),
          p(`x`, `z`, `y`, 1, -1, e, n, -t, r, a, 3),
          p(`x`, `y`, `z`, 1, -1, e, t, n, r, i, 4),
          p(`x`, `y`, `z`, -1, -1, e, t, -n, r, i, 5),
          this.setIndex(s),
          this.setAttribute(`position`, new H(c, 3)),
          this.setAttribute(`normal`, new H(l, 3)),
          this.setAttribute(`uv`, new H(u, 2)));
        function p(e, t, n, r, i, a, p, m, h, g, _) {
          let v = a / h,
            y = p / g,
            b = a / 2,
            x = p / 2,
            S = m / 2,
            C = h + 1,
            w = g + 1,
            T = 0,
            E = 0,
            D = new M();
          for (let a = 0; a < w; a++) {
            let o = a * y - x;
            for (let s = 0; s < C; s++)
              ((D[e] = (s * v - b) * r),
                (D[t] = o * i),
                (D[n] = S),
                c.push(D.x, D.y, D.z),
                (D[e] = 0),
                (D[t] = 0),
                (D[n] = m > 0 ? 1 : -1),
                l.push(D.x, D.y, D.z),
                u.push(s / h),
                u.push(1 - a / g),
                (T += 1));
          }
          for (let e = 0; e < g; e++)
            for (let t = 0; t < h; t++) {
              let n = d + t + C * e,
                r = d + t + C * (e + 1),
                i = d + (t + 1) + C * (e + 1),
                a = d + (t + 1) + C * e;
              (s.push(n, r, a), s.push(r, i, a), (E += 6));
            }
          (o.addGroup(f, E, _), (f += E), (d += T));
        }
      }
      copy(e) {
        return (
          super.copy(e),
          (this.parameters = Object.assign({}, e.parameters)),
          this
        );
      }
      static fromJSON(t) {
        return new e(
          t.width,
          t.height,
          t.depth,
          t.widthSegments,
          t.heightSegments,
          t.depthSegments,
        );
      }
    },
    St = class e extends bt {
      constructor(e = 1, t = 1, n = 4, r = 8, i = 1) {
        (super(),
          (this.type = `CapsuleGeometry`),
          (this.parameters = {
            radius: e,
            height: t,
            capSegments: n,
            radialSegments: r,
            heightSegments: i,
          }),
          (t = Math.max(0, t)),
          (n = Math.max(1, Math.floor(n))),
          (r = Math.max(3, Math.floor(r))),
          (i = Math.max(1, Math.floor(i))));
        let a = [],
          o = [],
          s = [],
          c = [],
          l = t / 2,
          u = (Math.PI / 2) * e,
          d = t,
          f = 2 * u + d,
          p = n * 2 + i,
          m = r + 1,
          h = new M(),
          g = new M();
        for (let _ = 0; _ <= p; _++) {
          let v = 0,
            y = 0,
            b = 0,
            x = 0;
          if (_ <= n) {
            let t = _ / n,
              r = (t * Math.PI) / 2;
            ((y = -l - e * Math.cos(r)),
              (b = e * Math.sin(r)),
              (x = -e * Math.cos(r)),
              (v = t * u));
          } else if (_ <= n + i) {
            let r = (_ - n) / i;
            ((y = -l + r * t), (b = e), (x = 0), (v = u + r * d));
          } else {
            let t = (_ - n - i) / n,
              r = (t * Math.PI) / 2;
            ((y = l + e * Math.sin(r)),
              (b = e * Math.cos(r)),
              (x = e * Math.sin(r)),
              (v = u + d + t * u));
          }
          let S = Math.max(0, Math.min(1, v / f)),
            C = 0;
          _ === 0 ? (C = 0.5 / r) : _ === p && (C = -0.5 / r);
          for (let e = 0; e <= r; e++) {
            let t = e / r,
              n = t * Math.PI * 2,
              i = Math.sin(n),
              a = Math.cos(n);
            ((g.x = -b * a),
              (g.y = y),
              (g.z = b * i),
              o.push(g.x, g.y, g.z),
              h.set(-b * a, x, b * i),
              h.normalize(),
              s.push(h.x, h.y, h.z),
              c.push(t + C, S));
          }
          if (_ > 0) {
            let e = (_ - 1) * m;
            for (let t = 0; t < r; t++) {
              let n = e + t,
                r = e + t + 1,
                i = _ * m + t,
                o = _ * m + t + 1;
              (a.push(n, r, i), a.push(r, o, i));
            }
          }
        }
        (this.setIndex(a),
          this.setAttribute(`position`, new H(o, 3)),
          this.setAttribute(`normal`, new H(s, 3)),
          this.setAttribute(`uv`, new H(c, 2)));
      }
      copy(e) {
        return (
          super.copy(e),
          (this.parameters = Object.assign({}, e.parameters)),
          this
        );
      }
      static fromJSON(t) {
        return new e(
          t.radius,
          t.height,
          t.capSegments,
          t.radialSegments,
          t.heightSegments,
        );
      }
    },
    Ct = class e extends bt {
      constructor(
        e = 1,
        t = 1,
        n = 1,
        r = 32,
        i = 1,
        a = !1,
        o = 0,
        s = Math.PI * 2,
      ) {
        (super(),
          (this.type = `CylinderGeometry`),
          (this.parameters = {
            radiusTop: e,
            radiusBottom: t,
            height: n,
            radialSegments: r,
            heightSegments: i,
            openEnded: a,
            thetaStart: o,
            thetaLength: s,
          }));
        let c = this;
        ((r = Math.floor(r)), (i = Math.floor(i)));
        let l = [],
          u = [],
          d = [],
          f = [],
          p = 0,
          m = [],
          h = n / 2,
          g = 0;
        (_(),
          a === !1 && (e > 0 && v(!0), t > 0 && v(!1)),
          this.setIndex(l),
          this.setAttribute(`position`, new H(u, 3)),
          this.setAttribute(`normal`, new H(d, 3)),
          this.setAttribute(`uv`, new H(f, 2)));
        function _() {
          let a = new M(),
            _ = new M(),
            v = 0,
            y = (t - e) / n;
          for (let c = 0; c <= i; c++) {
            let l = [],
              g = c / i,
              v = g * (t - e) + e;
            for (let e = 0; e <= r; e++) {
              let t = e / r,
                i = t * s + o,
                c = Math.sin(i),
                m = Math.cos(i);
              ((_.x = v * c),
                (_.y = -g * n + h),
                (_.z = v * m),
                u.push(_.x, _.y, _.z),
                a.set(c, y, m).normalize(),
                d.push(a.x, a.y, a.z),
                f.push(t, 1 - g),
                l.push(p++));
            }
            m.push(l);
          }
          for (let n = 0; n < r; n++)
            for (let r = 0; r < i; r++) {
              let a = m[r][n],
                o = m[r + 1][n],
                s = m[r + 1][n + 1],
                c = m[r][n + 1];
              ((e > 0 || r !== 0) && (l.push(a, o, c), (v += 3)),
                (t > 0 || r !== i - 1) && (l.push(o, s, c), (v += 3)));
            }
          (c.addGroup(g, v, 0), (g += v));
        }
        function v(n) {
          let i = p,
            a = new A(),
            m = new M(),
            _ = 0,
            v = n === !0 ? e : t,
            y = n === !0 ? 1 : -1;
          for (let e = 1; e <= r; e++)
            (u.push(0, h * y, 0), d.push(0, y, 0), f.push(0.5, 0.5), p++);
          let b = p;
          for (let e = 0; e <= r; e++) {
            let t = (e / r) * s + o,
              n = Math.cos(t),
              i = Math.sin(t);
            ((m.x = v * i),
              (m.y = h * y),
              (m.z = v * n),
              u.push(m.x, m.y, m.z),
              d.push(0, y, 0),
              (a.x = n * 0.5 + 0.5),
              (a.y = i * 0.5 * y + 0.5),
              f.push(a.x, a.y),
              p++);
          }
          for (let e = 0; e < r; e++) {
            let t = i + e,
              r = b + e;
            (n === !0 ? l.push(r, r + 1, t) : l.push(r + 1, r, t), (_ += 3));
          }
          (c.addGroup(g, _, n === !0 ? 1 : 2), (g += _));
        }
      }
      copy(e) {
        return (
          super.copy(e),
          (this.parameters = Object.assign({}, e.parameters)),
          this
        );
      }
      static fromJSON(t) {
        return new e(
          t.radiusTop,
          t.radiusBottom,
          t.height,
          t.radialSegments,
          t.heightSegments,
          t.openEnded,
          t.thetaStart,
          t.thetaLength,
        );
      }
    },
    wt = class e extends Ct {
      constructor(e = 1, t = 1, n = 32, r = 1, i = !1, a = 0, o = Math.PI * 2) {
        (super(0, e, t, n, r, i, a, o),
          (this.type = `ConeGeometry`),
          (this.parameters = {
            radius: e,
            height: t,
            radialSegments: n,
            heightSegments: r,
            openEnded: i,
            thetaStart: a,
            thetaLength: o,
          }));
      }
      static fromJSON(t) {
        return new e(
          t.radius,
          t.height,
          t.radialSegments,
          t.heightSegments,
          t.openEnded,
          t.thetaStart,
          t.thetaLength,
        );
      }
    },
    Tt = class e extends bt {
      constructor(e = [], t = [], n = 1, r = 0) {
        (super(),
          (this.type = `PolyhedronGeometry`),
          (this.parameters = {
            vertices: e,
            indices: t,
            radius: n,
            detail: r,
          }));
        let i = [],
          a = [];
        (o(r),
          c(n),
          l(),
          this.setAttribute(`position`, new H(i, 3)),
          this.setAttribute(`normal`, new H(i.slice(), 3)),
          this.setAttribute(`uv`, new H(a, 2)),
          r === 0 ? this.computeVertexNormals() : this.normalizeNormals());
        function o(e) {
          let n = new M(),
            r = new M(),
            i = new M();
          for (let a = 0; a < t.length; a += 3)
            (f(t[a + 0], n), f(t[a + 1], r), f(t[a + 2], i), s(n, r, i, e));
        }
        function s(e, t, n, r) {
          let i = r + 1,
            a = [];
          for (let r = 0; r <= i; r++) {
            a[r] = [];
            let o = e.clone().lerp(n, r / i),
              s = t.clone().lerp(n, r / i),
              c = i - r;
            for (let e = 0; e <= c; e++)
              e === 0 && r === i
                ? (a[r][e] = o)
                : (a[r][e] = o.clone().lerp(s, e / c));
          }
          for (let e = 0; e < i; e++)
            for (let t = 0; t < 2 * (i - e) - 1; t++) {
              let n = Math.floor(t / 2);
              t % 2 == 0
                ? (d(a[e][n + 1]), d(a[e + 1][n]), d(a[e][n]))
                : (d(a[e][n + 1]), d(a[e + 1][n + 1]), d(a[e + 1][n]));
            }
        }
        function c(e) {
          let t = new M();
          for (let n = 0; n < i.length; n += 3)
            ((t.x = i[n + 0]),
              (t.y = i[n + 1]),
              (t.z = i[n + 2]),
              t.normalize().multiplyScalar(e),
              (i[n + 0] = t.x),
              (i[n + 1] = t.y),
              (i[n + 2] = t.z));
        }
        function l() {
          let e = new M();
          for (let t = 0; t < i.length; t += 3) {
            ((e.x = i[t + 0]), (e.y = i[t + 1]), (e.z = i[t + 2]));
            let n = h(e) / 2 / Math.PI + 0.5,
              r = g(e) / Math.PI + 0.5;
            a.push(n, 1 - r);
          }
          (p(), u());
        }
        function u() {
          for (let e = 0; e < a.length; e += 6) {
            let t = a[e + 0],
              n = a[e + 2],
              r = a[e + 4];
            Math.max(t, n, r) > 0.9 &&
              Math.min(t, n, r) < 0.1 &&
              (t < 0.2 && (a[e + 0] += 1),
              n < 0.2 && (a[e + 2] += 1),
              r < 0.2 && (a[e + 4] += 1));
          }
        }
        function d(e) {
          i.push(e.x, e.y, e.z);
        }
        function f(t, n) {
          let r = t * 3;
          ((n.x = e[r + 0]), (n.y = e[r + 1]), (n.z = e[r + 2]));
        }
        function p() {
          let e = new M(),
            t = new M(),
            n = new M(),
            r = new M(),
            o = new A(),
            s = new A(),
            c = new A();
          for (let l = 0, u = 0; l < i.length; l += 9, u += 6) {
            (e.set(i[l + 0], i[l + 1], i[l + 2]),
              t.set(i[l + 3], i[l + 4], i[l + 5]),
              n.set(i[l + 6], i[l + 7], i[l + 8]),
              o.set(a[u + 0], a[u + 1]),
              s.set(a[u + 2], a[u + 3]),
              c.set(a[u + 4], a[u + 5]),
              r.copy(e).add(t).add(n).divideScalar(3));
            let d = h(r);
            (m(o, u + 0, e, d), m(s, u + 2, t, d), m(c, u + 4, n, d));
          }
        }
        function m(e, t, n, r) {
          (r < 0 && e.x === 1 && (a[t] = e.x - 1),
            n.x === 0 && n.z === 0 && (a[t] = r / 2 / Math.PI + 0.5));
        }
        function h(e) {
          return Math.atan2(e.z, -e.x);
        }
        function g(e) {
          return Math.atan2(-e.y, Math.sqrt(e.x * e.x + e.z * e.z));
        }
      }
      copy(e) {
        return (
          super.copy(e),
          (this.parameters = Object.assign({}, e.parameters)),
          this
        );
      }
      static fromJSON(t) {
        return new e(t.vertices, t.indices, t.radius, t.detail);
      }
    },
    Et = class {
      constructor() {
        ((this.type = `Curve`),
          (this.arcLengthDivisions = 200),
          (this.needsUpdate = !1),
          (this.cacheArcLengths = null));
      }
      getPoint() {
        y(`Curve: .getPoint() not implemented.`);
      }
      getPointAt(e, t) {
        let n = this.getUtoTmapping(e);
        return this.getPoint(n, t);
      }
      getPoints(e = 5) {
        let t = [];
        for (let n = 0; n <= e; n++) t.push(this.getPoint(n / e));
        return t;
      }
      getSpacedPoints(e = 5) {
        let t = [];
        for (let n = 0; n <= e; n++) t.push(this.getPointAt(n / e));
        return t;
      }
      getLength() {
        let e = this.getLengths();
        return e[e.length - 1];
      }
      getLengths(e = this.arcLengthDivisions) {
        if (
          this.cacheArcLengths &&
          this.cacheArcLengths.length === e + 1 &&
          !this.needsUpdate
        )
          return this.cacheArcLengths;
        this.needsUpdate = !1;
        let t = [],
          n,
          r = this.getPoint(0),
          i = 0;
        t.push(0);
        for (let a = 1; a <= e; a++)
          ((n = this.getPoint(a / e)),
            (i += n.distanceTo(r)),
            t.push(i),
            (r = n));
        return ((this.cacheArcLengths = t), t);
      }
      updateArcLengths() {
        ((this.needsUpdate = !0), this.getLengths());
      }
      getUtoTmapping(e, t = null) {
        let n = this.getLengths(),
          r = 0,
          i = n.length,
          a;
        a = t || e * n[i - 1];
        let o = 0,
          s = i - 1,
          c;
        for (; o <= s; )
          if (((r = Math.floor(o + (s - o) / 2)), (c = n[r] - a), c < 0))
            o = r + 1;
          else if (c > 0) s = r - 1;
          else {
            s = r;
            break;
          }
        if (((r = s), n[r] === a)) return r / (i - 1);
        let l = n[r],
          u = n[r + 1] - l,
          d = (a - l) / u;
        return (r + d) / (i - 1);
      }
      getTangent(e, t) {
        let n = 1e-4,
          r = e - n,
          i = e + n;
        (r < 0 && (r = 0), i > 1 && (i = 1));
        let a = this.getPoint(r),
          o = this.getPoint(i),
          s = t || (a.isVector2 ? new A() : new M());
        return (s.copy(o).sub(a).normalize(), s);
      }
      getTangentAt(e, t) {
        let n = this.getUtoTmapping(e);
        return this.getTangent(n, t);
      }
      computeFrenetFrames(e, t = !1) {
        let n = new M(),
          r = [],
          i = [],
          a = [],
          o = new M(),
          s = new ue();
        for (let t = 0; t <= e; t++) {
          let n = t / e;
          r[t] = this.getTangentAt(n, new M());
        }
        ((i[0] = new M()), (a[0] = new M()));
        let c = Number.MAX_VALUE,
          l = Math.abs(r[0].x),
          u = Math.abs(r[0].y),
          d = Math.abs(r[0].z);
        (l <= c && ((c = l), n.set(1, 0, 0)),
          u <= c && ((c = u), n.set(0, 1, 0)),
          d <= c && n.set(0, 0, 1),
          o.crossVectors(r[0], n).normalize(),
          i[0].crossVectors(r[0], o),
          a[0].crossVectors(r[0], i[0]));
        for (let t = 1; t <= e; t++) {
          if (
            ((i[t] = i[t - 1].clone()),
            (a[t] = a[t - 1].clone()),
            o.crossVectors(r[t - 1], r[t]),
            o.length() > 2 ** -52)
          ) {
            o.normalize();
            let e = Math.acos(T(r[t - 1].dot(r[t]), -1, 1));
            i[t].applyMatrix4(s.makeRotationAxis(o, e));
          }
          a[t].crossVectors(r[t], i[t]);
        }
        if (t === !0) {
          let t = Math.acos(T(i[0].dot(i[e]), -1, 1));
          ((t /= e), r[0].dot(o.crossVectors(i[0], i[e])) > 0 && (t = -t));
          for (let n = 1; n <= e; n++)
            (i[n].applyMatrix4(s.makeRotationAxis(r[n], t * n)),
              a[n].crossVectors(r[n], i[n]));
        }
        return { tangents: r, normals: i, binormals: a };
      }
      clone() {
        return new this.constructor().copy(this);
      }
      copy(e) {
        return ((this.arcLengthDivisions = e.arcLengthDivisions), this);
      }
      toJSON() {
        let e = {
          metadata: { version: 4.7, type: `Curve`, generator: `Curve.toJSON` },
        };
        return (
          (e.arcLengthDivisions = this.arcLengthDivisions),
          (e.type = this.type),
          e
        );
      }
      fromJSON(e) {
        return ((this.arcLengthDivisions = e.arcLengthDivisions), this);
      }
    },
    Dt = class extends Et {
      constructor(
        e = 0,
        t = 0,
        n = 1,
        r = 1,
        i = 0,
        a = Math.PI * 2,
        o = !1,
        s = 0,
      ) {
        (super(),
          (this.isEllipseCurve = !0),
          (this.type = `EllipseCurve`),
          (this.aX = e),
          (this.aY = t),
          (this.xRadius = n),
          (this.yRadius = r),
          (this.aStartAngle = i),
          (this.aEndAngle = a),
          (this.aClockwise = o),
          (this.aRotation = s));
      }
      getPoint(e, t = new A()) {
        let n = t,
          r = Math.PI * 2,
          i = this.aEndAngle - this.aStartAngle,
          a = Math.abs(i) < 2 ** -52;
        for (; i < 0; ) i += r;
        for (; i > r; ) i -= r;
        (i < 2 ** -52 && (i = a ? 0 : r),
          this.aClockwise === !0 && !a && (i === r ? (i = -r) : (i -= r)));
        let o = this.aStartAngle + e * i,
          s = this.aX + this.xRadius * Math.cos(o),
          c = this.aY + this.yRadius * Math.sin(o);
        if (this.aRotation !== 0) {
          let e = Math.cos(this.aRotation),
            t = Math.sin(this.aRotation),
            n = s - this.aX,
            r = c - this.aY;
          ((s = n * e - r * t + this.aX), (c = n * t + r * e + this.aY));
        }
        return n.set(s, c);
      }
      copy(e) {
        return (
          super.copy(e),
          (this.aX = e.aX),
          (this.aY = e.aY),
          (this.xRadius = e.xRadius),
          (this.yRadius = e.yRadius),
          (this.aStartAngle = e.aStartAngle),
          (this.aEndAngle = e.aEndAngle),
          (this.aClockwise = e.aClockwise),
          (this.aRotation = e.aRotation),
          this
        );
      }
      toJSON() {
        let e = super.toJSON();
        return (
          (e.aX = this.aX),
          (e.aY = this.aY),
          (e.xRadius = this.xRadius),
          (e.yRadius = this.yRadius),
          (e.aStartAngle = this.aStartAngle),
          (e.aEndAngle = this.aEndAngle),
          (e.aClockwise = this.aClockwise),
          (e.aRotation = this.aRotation),
          e
        );
      }
      fromJSON(e) {
        return (
          super.fromJSON(e),
          (this.aX = e.aX),
          (this.aY = e.aY),
          (this.xRadius = e.xRadius),
          (this.yRadius = e.yRadius),
          (this.aStartAngle = e.aStartAngle),
          (this.aEndAngle = e.aEndAngle),
          (this.aClockwise = e.aClockwise),
          (this.aRotation = e.aRotation),
          this
        );
      }
    },
    Ot = class extends Dt {
      constructor(e, t, n, r, i, a) {
        (super(e, t, n, n, r, i, a),
          (this.isArcCurve = !0),
          (this.type = `ArcCurve`));
      }
    };
  function kt() {
    let e = 0,
      t = 0,
      n = 0,
      r = 0;
    function i(i, a, o, s) {
      ((e = i),
        (t = o),
        (n = -3 * i + 3 * a - 2 * o - s),
        (r = 2 * i - 2 * a + o + s));
    }
    return {
      initCatmullRom: function (e, t, n, r, a) {
        i(t, n, a * (n - e), a * (r - t));
      },
      initNonuniformCatmullRom: function (e, t, n, r, a, o, s) {
        let c = (t - e) / a - (n - e) / (a + o) + (n - t) / o,
          l = (n - t) / o - (r - t) / (o + s) + (r - n) / s;
        ((c *= o), (l *= o), i(t, n, c, l));
      },
      calc: function (i) {
        let a = i * i,
          o = a * i;
        return e + t * i + n * a + r * o;
      },
    };
  }
  let At = /*@__PURE__*/ new M(),
    jt = /*@__PURE__*/ new M(),
    Mt = /*@__PURE__*/ new kt(),
    Nt = /*@__PURE__*/ new kt(),
    Pt = /*@__PURE__*/ new kt();
  var Ft = class extends Et {
    constructor(e = [], t = !1, n = `centripetal`, r = 0.5) {
      (super(),
        (this.isCatmullRomCurve3 = !0),
        (this.type = `CatmullRomCurve3`),
        (this.points = e),
        (this.closed = t),
        (this.curveType = n),
        (this.tension = r));
    }
    getPoint(e, t = new M()) {
      let n = t,
        r = this.points,
        i = r.length,
        a = (i - +!this.closed) * e,
        o = Math.floor(a),
        s = a - o;
      this.closed
        ? (o += o > 0 ? 0 : (Math.floor(Math.abs(o) / i) + 1) * i)
        : s === 0 && o === i - 1 && ((o = i - 2), (s = 1));
      let c, l;
      this.closed || o > 0
        ? (c = r[(o - 1) % i])
        : (jt.subVectors(r[0], r[1]).add(r[0]), (c = jt));
      let u = r[o % i],
        d = r[(o + 1) % i];
      if (
        (this.closed || o + 2 < i
          ? (l = r[(o + 2) % i])
          : (At.subVectors(r[i - 1], r[i - 2]).add(r[i - 1]), (l = At)),
        this.curveType === `centripetal` || this.curveType === `chordal`)
      ) {
        let e = this.curveType === `chordal` ? 0.5 : 0.25,
          t = c.distanceToSquared(u) ** +e,
          n = u.distanceToSquared(d) ** +e,
          r = d.distanceToSquared(l) ** +e;
        (n < 1e-4 && (n = 1),
          t < 1e-4 && (t = n),
          r < 1e-4 && (r = n),
          Mt.initNonuniformCatmullRom(c.x, u.x, d.x, l.x, t, n, r),
          Nt.initNonuniformCatmullRom(c.y, u.y, d.y, l.y, t, n, r),
          Pt.initNonuniformCatmullRom(c.z, u.z, d.z, l.z, t, n, r));
      } else
        this.curveType === `catmullrom` &&
          (Mt.initCatmullRom(c.x, u.x, d.x, l.x, this.tension),
          Nt.initCatmullRom(c.y, u.y, d.y, l.y, this.tension),
          Pt.initCatmullRom(c.z, u.z, d.z, l.z, this.tension));
      return (n.set(Mt.calc(s), Nt.calc(s), Pt.calc(s)), n);
    }
    copy(e) {
      (super.copy(e), (this.points = []));
      for (let t = 0, n = e.points.length; t < n; t++) {
        let n = e.points[t];
        this.points.push(n.clone());
      }
      return (
        (this.closed = e.closed),
        (this.curveType = e.curveType),
        (this.tension = e.tension),
        this
      );
    }
    toJSON() {
      let e = super.toJSON();
      e.points = [];
      for (let t = 0, n = this.points.length; t < n; t++) {
        let n = this.points[t];
        e.points.push(n.toArray());
      }
      return (
        (e.closed = this.closed),
        (e.curveType = this.curveType),
        (e.tension = this.tension),
        e
      );
    }
    fromJSON(e) {
      (super.fromJSON(e), (this.points = []));
      for (let t = 0, n = e.points.length; t < n; t++) {
        let n = e.points[t];
        this.points.push(new M().fromArray(n));
      }
      return (
        (this.closed = e.closed),
        (this.curveType = e.curveType),
        (this.tension = e.tension),
        this
      );
    }
  };
  function It(e, t, n, r, i) {
    let a = (r - t) * 0.5,
      o = (i - n) * 0.5,
      s = e * e,
      c = e * s;
    return (
      (2 * n - 2 * r + a + o) * c + (-3 * n + 3 * r - 2 * a - o) * s + a * e + n
    );
  }
  function Lt(e, t) {
    let n = 1 - e;
    return n * n * t;
  }
  function Rt(e, t) {
    return 2 * (1 - e) * e * t;
  }
  function zt(e, t) {
    return e * e * t;
  }
  function Bt(e, t, n, r) {
    return Lt(e, t) + Rt(e, n) + zt(e, r);
  }
  function Vt(e, t) {
    let n = 1 - e;
    return n * n * n * t;
  }
  function Ht(e, t) {
    let n = 1 - e;
    return 3 * n * n * e * t;
  }
  function Ut(e, t) {
    return 3 * (1 - e) * e * e * t;
  }
  function Wt(e, t) {
    return e * e * e * t;
  }
  function Gt(e, t, n, r, i) {
    return Vt(e, t) + Ht(e, n) + Ut(e, r) + Wt(e, i);
  }
  var Kt = class extends Et {
      constructor(e = new A(), t = new A(), n = new A(), r = new A()) {
        (super(),
          (this.isCubicBezierCurve = !0),
          (this.type = `CubicBezierCurve`),
          (this.v0 = e),
          (this.v1 = t),
          (this.v2 = n),
          (this.v3 = r));
      }
      getPoint(e, t = new A()) {
        let n = t,
          r = this.v0,
          i = this.v1,
          a = this.v2,
          o = this.v3;
        return (n.set(Gt(e, r.x, i.x, a.x, o.x), Gt(e, r.y, i.y, a.y, o.y)), n);
      }
      copy(e) {
        return (
          super.copy(e),
          this.v0.copy(e.v0),
          this.v1.copy(e.v1),
          this.v2.copy(e.v2),
          this.v3.copy(e.v3),
          this
        );
      }
      toJSON() {
        let e = super.toJSON();
        return (
          (e.v0 = this.v0.toArray()),
          (e.v1 = this.v1.toArray()),
          (e.v2 = this.v2.toArray()),
          (e.v3 = this.v3.toArray()),
          e
        );
      }
      fromJSON(e) {
        return (
          super.fromJSON(e),
          this.v0.fromArray(e.v0),
          this.v1.fromArray(e.v1),
          this.v2.fromArray(e.v2),
          this.v3.fromArray(e.v3),
          this
        );
      }
    },
    qt = class extends Et {
      constructor(e = new M(), t = new M(), n = new M(), r = new M()) {
        (super(),
          (this.isCubicBezierCurve3 = !0),
          (this.type = `CubicBezierCurve3`),
          (this.v0 = e),
          (this.v1 = t),
          (this.v2 = n),
          (this.v3 = r));
      }
      getPoint(e, t = new M()) {
        let n = t,
          r = this.v0,
          i = this.v1,
          a = this.v2,
          o = this.v3;
        return (
          n.set(
            Gt(e, r.x, i.x, a.x, o.x),
            Gt(e, r.y, i.y, a.y, o.y),
            Gt(e, r.z, i.z, a.z, o.z),
          ),
          n
        );
      }
      copy(e) {
        return (
          super.copy(e),
          this.v0.copy(e.v0),
          this.v1.copy(e.v1),
          this.v2.copy(e.v2),
          this.v3.copy(e.v3),
          this
        );
      }
      toJSON() {
        let e = super.toJSON();
        return (
          (e.v0 = this.v0.toArray()),
          (e.v1 = this.v1.toArray()),
          (e.v2 = this.v2.toArray()),
          (e.v3 = this.v3.toArray()),
          e
        );
      }
      fromJSON(e) {
        return (
          super.fromJSON(e),
          this.v0.fromArray(e.v0),
          this.v1.fromArray(e.v1),
          this.v2.fromArray(e.v2),
          this.v3.fromArray(e.v3),
          this
        );
      }
    },
    Jt = class extends Et {
      constructor(e = new A(), t = new A()) {
        (super(),
          (this.isLineCurve = !0),
          (this.type = `LineCurve`),
          (this.v1 = e),
          (this.v2 = t));
      }
      getPoint(e, t = new A()) {
        let n = t;
        return (
          e === 1
            ? n.copy(this.v2)
            : (n.copy(this.v2).sub(this.v1), n.multiplyScalar(e).add(this.v1)),
          n
        );
      }
      getPointAt(e, t) {
        return this.getPoint(e, t);
      }
      getTangent(e, t = new A()) {
        return t.subVectors(this.v2, this.v1).normalize();
      }
      getTangentAt(e, t) {
        return this.getTangent(e, t);
      }
      copy(e) {
        return (super.copy(e), this.v1.copy(e.v1), this.v2.copy(e.v2), this);
      }
      toJSON() {
        let e = super.toJSON();
        return ((e.v1 = this.v1.toArray()), (e.v2 = this.v2.toArray()), e);
      }
      fromJSON(e) {
        return (
          super.fromJSON(e),
          this.v1.fromArray(e.v1),
          this.v2.fromArray(e.v2),
          this
        );
      }
    },
    Yt = class extends Et {
      constructor(e = new M(), t = new M()) {
        (super(),
          (this.isLineCurve3 = !0),
          (this.type = `LineCurve3`),
          (this.v1 = e),
          (this.v2 = t));
      }
      getPoint(e, t = new M()) {
        let n = t;
        return (
          e === 1
            ? n.copy(this.v2)
            : (n.copy(this.v2).sub(this.v1), n.multiplyScalar(e).add(this.v1)),
          n
        );
      }
      getPointAt(e, t) {
        return this.getPoint(e, t);
      }
      getTangent(e, t = new M()) {
        return t.subVectors(this.v2, this.v1).normalize();
      }
      getTangentAt(e, t) {
        return this.getTangent(e, t);
      }
      copy(e) {
        return (super.copy(e), this.v1.copy(e.v1), this.v2.copy(e.v2), this);
      }
      toJSON() {
        let e = super.toJSON();
        return ((e.v1 = this.v1.toArray()), (e.v2 = this.v2.toArray()), e);
      }
      fromJSON(e) {
        return (
          super.fromJSON(e),
          this.v1.fromArray(e.v1),
          this.v2.fromArray(e.v2),
          this
        );
      }
    },
    Xt = class extends Et {
      constructor(e = new A(), t = new A(), n = new A()) {
        (super(),
          (this.isQuadraticBezierCurve = !0),
          (this.type = `QuadraticBezierCurve`),
          (this.v0 = e),
          (this.v1 = t),
          (this.v2 = n));
      }
      getPoint(e, t = new A()) {
        let n = t,
          r = this.v0,
          i = this.v1,
          a = this.v2;
        return (n.set(Bt(e, r.x, i.x, a.x), Bt(e, r.y, i.y, a.y)), n);
      }
      copy(e) {
        return (
          super.copy(e),
          this.v0.copy(e.v0),
          this.v1.copy(e.v1),
          this.v2.copy(e.v2),
          this
        );
      }
      toJSON() {
        let e = super.toJSON();
        return (
          (e.v0 = this.v0.toArray()),
          (e.v1 = this.v1.toArray()),
          (e.v2 = this.v2.toArray()),
          e
        );
      }
      fromJSON(e) {
        return (
          super.fromJSON(e),
          this.v0.fromArray(e.v0),
          this.v1.fromArray(e.v1),
          this.v2.fromArray(e.v2),
          this
        );
      }
    },
    Zt = class extends Et {
      constructor(e = new M(), t = new M(), n = new M()) {
        (super(),
          (this.isQuadraticBezierCurve3 = !0),
          (this.type = `QuadraticBezierCurve3`),
          (this.v0 = e),
          (this.v1 = t),
          (this.v2 = n));
      }
      getPoint(e, t = new M()) {
        let n = t,
          r = this.v0,
          i = this.v1,
          a = this.v2;
        return (
          n.set(
            Bt(e, r.x, i.x, a.x),
            Bt(e, r.y, i.y, a.y),
            Bt(e, r.z, i.z, a.z),
          ),
          n
        );
      }
      copy(e) {
        return (
          super.copy(e),
          this.v0.copy(e.v0),
          this.v1.copy(e.v1),
          this.v2.copy(e.v2),
          this
        );
      }
      toJSON() {
        let e = super.toJSON();
        return (
          (e.v0 = this.v0.toArray()),
          (e.v1 = this.v1.toArray()),
          (e.v2 = this.v2.toArray()),
          e
        );
      }
      fromJSON(e) {
        return (
          super.fromJSON(e),
          this.v0.fromArray(e.v0),
          this.v1.fromArray(e.v1),
          this.v2.fromArray(e.v2),
          this
        );
      }
    },
    Qt = class extends Et {
      constructor(e = []) {
        (super(),
          (this.isSplineCurve = !0),
          (this.type = `SplineCurve`),
          (this.points = e));
      }
      getPoint(e, t = new A()) {
        let n = t,
          r = this.points,
          i = (r.length - 1) * e,
          a = Math.floor(i),
          o = i - a,
          s = r[a === 0 ? a : a - 1],
          c = r[a],
          l = r[a > r.length - 2 ? r.length - 1 : a + 1],
          u = r[a > r.length - 3 ? r.length - 1 : a + 2];
        return (n.set(It(o, s.x, c.x, l.x, u.x), It(o, s.y, c.y, l.y, u.y)), n);
      }
      copy(e) {
        (super.copy(e), (this.points = []));
        for (let t = 0, n = e.points.length; t < n; t++) {
          let n = e.points[t];
          this.points.push(n.clone());
        }
        return this;
      }
      toJSON() {
        let e = super.toJSON();
        e.points = [];
        for (let t = 0, n = this.points.length; t < n; t++) {
          let n = this.points[t];
          e.points.push(n.toArray());
        }
        return e;
      }
      fromJSON(e) {
        (super.fromJSON(e), (this.points = []));
        for (let t = 0, n = e.points.length; t < n; t++) {
          let n = e.points[t];
          this.points.push(new A().fromArray(n));
        }
        return this;
      }
    },
    $t = /*#__PURE__*/ Object.freeze({
      __proto__: null,
      ArcCurve: Ot,
      CatmullRomCurve3: Ft,
      CubicBezierCurve: Kt,
      CubicBezierCurve3: qt,
      EllipseCurve: Dt,
      LineCurve: Jt,
      LineCurve3: Yt,
      QuadraticBezierCurve: Xt,
      QuadraticBezierCurve3: Zt,
      SplineCurve: Qt,
    }),
    en = class extends Et {
      constructor() {
        (super(),
          (this.type = `CurvePath`),
          (this.curves = []),
          (this.autoClose = !1));
      }
      add(e) {
        this.curves.push(e);
      }
      closePath() {
        let e = this.curves[0].getPoint(0),
          t = this.curves[this.curves.length - 1].getPoint(1);
        if (!e.equals(t)) {
          let n = e.isVector2 === !0 ? `LineCurve` : `LineCurve3`;
          this.curves.push(new $t[n](t, e));
        }
        return this;
      }
      getPoint(e, t) {
        let n = e * this.getLength(),
          r = this.getCurveLengths(),
          i = 0;
        for (; i < r.length; ) {
          if (r[i] >= n) {
            let e = r[i] - n,
              a = this.curves[i],
              o = a.getLength(),
              s = o === 0 ? 0 : 1 - e / o;
            return a.getPointAt(s, t);
          }
          i++;
        }
        return null;
      }
      getLength() {
        let e = this.getCurveLengths();
        return e[e.length - 1];
      }
      updateArcLengths() {
        ((this.needsUpdate = !0),
          (this.cacheLengths = null),
          this.getCurveLengths());
      }
      getCurveLengths() {
        if (
          this.cacheLengths &&
          this.cacheLengths.length === this.curves.length
        )
          return this.cacheLengths;
        let e = [],
          t = 0;
        for (let n = 0, r = this.curves.length; n < r; n++)
          ((t += this.curves[n].getLength()), e.push(t));
        return ((this.cacheLengths = e), e);
      }
      getSpacedPoints(e = 40) {
        let t = [];
        for (let n = 0; n <= e; n++) t.push(this.getPoint(n / e));
        return (this.autoClose && t.push(t[0]), t);
      }
      getPoints(e = 12) {
        let t = [],
          n;
        for (let r = 0, i = this.curves; r < i.length; r++) {
          let a = i[r],
            o = a.isEllipseCurve
              ? e * 2
              : a.isLineCurve || a.isLineCurve3
                ? 1
                : a.isSplineCurve
                  ? e * a.points.length
                  : e,
            s = a.getPoints(o);
          for (let e = 0; e < s.length; e++) {
            let r = s[e];
            (n && n.equals(r)) || (t.push(r), (n = r));
          }
        }
        return (
          this.autoClose &&
            t.length > 1 &&
            !t[t.length - 1].equals(t[0]) &&
            t.push(t[0]),
          t
        );
      }
      copy(e) {
        (super.copy(e), (this.curves = []));
        for (let t = 0, n = e.curves.length; t < n; t++) {
          let n = e.curves[t];
          this.curves.push(n.clone());
        }
        return ((this.autoClose = e.autoClose), this);
      }
      toJSON() {
        let e = super.toJSON();
        ((e.autoClose = this.autoClose), (e.curves = []));
        for (let t = 0, n = this.curves.length; t < n; t++) {
          let n = this.curves[t];
          e.curves.push(n.toJSON());
        }
        return e;
      }
      fromJSON(e) {
        (super.fromJSON(e), (this.autoClose = e.autoClose), (this.curves = []));
        for (let t = 0, n = e.curves.length; t < n; t++) {
          let n = e.curves[t];
          this.curves.push(new $t[n.type]().fromJSON(n));
        }
        return this;
      }
    },
    tn = class extends en {
      constructor(e) {
        (super(),
          (this.type = `Path`),
          (this.currentPoint = new A()),
          e && this.setFromPoints(e));
      }
      setFromPoints(e) {
        this.moveTo(e[0].x, e[0].y);
        for (let t = 1, n = e.length; t < n; t++) this.lineTo(e[t].x, e[t].y);
        return this;
      }
      moveTo(e, t) {
        return (this.currentPoint.set(e, t), this);
      }
      lineTo(e, t) {
        let n = new Jt(this.currentPoint.clone(), new A(e, t));
        return (this.curves.push(n), this.currentPoint.set(e, t), this);
      }
      quadraticCurveTo(e, t, n, r) {
        let i = new Xt(this.currentPoint.clone(), new A(e, t), new A(n, r));
        return (this.curves.push(i), this.currentPoint.set(n, r), this);
      }
      bezierCurveTo(e, t, n, r, i, a) {
        let o = new Kt(
          this.currentPoint.clone(),
          new A(e, t),
          new A(n, r),
          new A(i, a),
        );
        return (this.curves.push(o), this.currentPoint.set(i, a), this);
      }
      splineThru(e) {
        let t = new Qt([this.currentPoint.clone()].concat(e));
        return (
          this.curves.push(t),
          this.currentPoint.copy(e[e.length - 1]),
          this
        );
      }
      arc(e, t, n, r, i, a) {
        let o = this.currentPoint.x,
          s = this.currentPoint.y;
        return (this.absarc(e + o, t + s, n, r, i, a), this);
      }
      absarc(e, t, n, r, i, a) {
        return (this.absellipse(e, t, n, n, r, i, a), this);
      }
      ellipse(e, t, n, r, i, a, o, s) {
        let c = this.currentPoint.x,
          l = this.currentPoint.y;
        return (this.absellipse(e + c, t + l, n, r, i, a, o, s), this);
      }
      absellipse(e, t, n, r, i, a, o, s) {
        let c = new Dt(e, t, n, r, i, a, o, s);
        if (this.curves.length > 0) {
          let e = c.getPoint(0);
          e.equals(this.currentPoint) || this.lineTo(e.x, e.y);
        }
        this.curves.push(c);
        let l = c.getPoint(1);
        return (this.currentPoint.copy(l), this);
      }
      copy(e) {
        return (super.copy(e), this.currentPoint.copy(e.currentPoint), this);
      }
      toJSON() {
        let e = super.toJSON();
        return ((e.currentPoint = this.currentPoint.toArray()), e);
      }
      fromJSON(e) {
        return (
          super.fromJSON(e),
          this.currentPoint.fromArray(e.currentPoint),
          this
        );
      }
    },
    nn = class extends tn {
      constructor(e) {
        (super(e), (this.uuid = w()), (this.type = `Shape`), (this.holes = []));
      }
      getPointsHoles(e) {
        let t = [];
        for (let n = 0, r = this.holes.length; n < r; n++)
          t[n] = this.holes[n].getPoints(e);
        return t;
      }
      extractPoints(e) {
        return { shape: this.getPoints(e), holes: this.getPointsHoles(e) };
      }
      copy(e) {
        (super.copy(e), (this.holes = []));
        for (let t = 0, n = e.holes.length; t < n; t++) {
          let n = e.holes[t];
          this.holes.push(n.clone());
        }
        return this;
      }
      toJSON() {
        let e = super.toJSON();
        ((e.uuid = this.uuid), (e.holes = []));
        for (let t = 0, n = this.holes.length; t < n; t++) {
          let n = this.holes[t];
          e.holes.push(n.toJSON());
        }
        return e;
      }
      fromJSON(e) {
        (super.fromJSON(e), (this.uuid = e.uuid), (this.holes = []));
        for (let t = 0, n = e.holes.length; t < n; t++) {
          let n = e.holes[t];
          this.holes.push(new tn().fromJSON(n));
        }
        return this;
      }
    };
  function rn(e, t, n = 2) {
    let r = t && t.length,
      i = r ? t[0] * n : e.length,
      a = an(e, 0, i, n, !0),
      o = [];
    if (!a || a.next === a.prev) return o;
    let s, c, l;
    if ((r && (a = fn(e, t, a, n)), e.length > 80 * n)) {
      ((s = e[0]), (c = e[1]));
      let t = s,
        r = c;
      for (let a = n; a < i; a += n) {
        let n = e[a],
          i = e[a + 1];
        (n < s && (s = n),
          i < c && (c = i),
          n > t && (t = n),
          i > r && (r = i));
      }
      ((l = Math.max(t - s, r - c)), (l = l === 0 ? 0 : 32767 / l));
    }
    return (sn(a, o, n, s, c, l, 0), o);
  }
  function an(e, t, n, r, i) {
    let a;
    if (i === Fn(e, t, n, r) > 0)
      for (let i = t; i < n; i += r) a = Mn((i / r) | 0, e[i], e[i + 1], a);
    else
      for (let i = n - r; i >= t; i -= r)
        a = Mn((i / r) | 0, e[i], e[i + 1], a);
    return (a && wn(a, a.next) && (Nn(a), (a = a.next)), a);
  }
  function on(e, t) {
    if (!e) return e;
    t ||= e;
    let n = e,
      r;
    do
      if (
        ((r = !1), !n.steiner && (wn(n, n.next) || W(n.prev, n, n.next) === 0))
      ) {
        if ((Nn(n), (n = t = n.prev), n === n.next)) break;
        r = !0;
      } else n = n.next;
    while (r || n !== t);
    return t;
  }
  function sn(e, t, n, r, i, a, o) {
    if (!e) return;
    !o && a && _n(e, r, i, a);
    let s = e;
    for (; e.prev !== e.next; ) {
      let c = e.prev,
        l = e.next;
      if (a ? ln(e, r, i, a) : cn(e)) {
        (t.push(c.i, e.i, l.i), Nn(e), (e = l.next), (s = l.next));
        continue;
      }
      if (((e = l), e === s)) {
        o
          ? o === 1
            ? ((e = un(on(e), t)), sn(e, t, n, r, i, a, 2))
            : o === 2 && dn(e, t, n, r, i, a)
          : sn(on(e), t, n, r, i, a, 1);
        break;
      }
    }
  }
  function cn(e) {
    let t = e.prev,
      n = e,
      r = e.next;
    if (W(t, n, r) >= 0) return !1;
    let i = t.x,
      a = n.x,
      o = r.x,
      s = t.y,
      c = n.y,
      l = r.y,
      u = Math.min(i, a, o),
      d = Math.min(s, c, l),
      f = Math.max(i, a, o),
      p = Math.max(s, c, l),
      m = r.next;
    for (; m !== t; ) {
      if (
        m.x >= u &&
        m.x <= f &&
        m.y >= d &&
        m.y <= p &&
        Sn(i, s, a, c, o, l, m.x, m.y) &&
        W(m.prev, m, m.next) >= 0
      )
        return !1;
      m = m.next;
    }
    return !0;
  }
  function ln(e, t, n, r) {
    let i = e.prev,
      a = e,
      o = e.next;
    if (W(i, a, o) >= 0) return !1;
    let s = i.x,
      c = a.x,
      l = o.x,
      u = i.y,
      d = a.y,
      f = o.y,
      p = Math.min(s, c, l),
      m = Math.min(u, d, f),
      h = Math.max(s, c, l),
      g = Math.max(u, d, f),
      _ = yn(p, m, t, n, r),
      v = yn(h, g, t, n, r),
      y = e.prevZ,
      b = e.nextZ;
    for (; y && y.z >= _ && b && b.z <= v; ) {
      if (
        (y.x >= p &&
          y.x <= h &&
          y.y >= m &&
          y.y <= g &&
          y !== i &&
          y !== o &&
          Sn(s, u, c, d, l, f, y.x, y.y) &&
          W(y.prev, y, y.next) >= 0) ||
        ((y = y.prevZ),
        b.x >= p &&
          b.x <= h &&
          b.y >= m &&
          b.y <= g &&
          b !== i &&
          b !== o &&
          Sn(s, u, c, d, l, f, b.x, b.y) &&
          W(b.prev, b, b.next) >= 0)
      )
        return !1;
      b = b.nextZ;
    }
    for (; y && y.z >= _; ) {
      if (
        y.x >= p &&
        y.x <= h &&
        y.y >= m &&
        y.y <= g &&
        y !== i &&
        y !== o &&
        Sn(s, u, c, d, l, f, y.x, y.y) &&
        W(y.prev, y, y.next) >= 0
      )
        return !1;
      y = y.prevZ;
    }
    for (; b && b.z <= v; ) {
      if (
        b.x >= p &&
        b.x <= h &&
        b.y >= m &&
        b.y <= g &&
        b !== i &&
        b !== o &&
        Sn(s, u, c, d, l, f, b.x, b.y) &&
        W(b.prev, b, b.next) >= 0
      )
        return !1;
      b = b.nextZ;
    }
    return !0;
  }
  function un(e, t) {
    let n = e;
    do {
      let r = n.prev,
        i = n.next.next;
      (!wn(r, i) &&
        Tn(r, n, n.next, i) &&
        kn(r, i) &&
        kn(i, r) &&
        (t.push(r.i, n.i, i.i), Nn(n), Nn(n.next), (n = e = i)),
        (n = n.next));
    } while (n !== e);
    return on(n);
  }
  function dn(e, t, n, r, i, a) {
    let o = e;
    do {
      let e = o.next.next;
      for (; e !== o.prev; ) {
        if (o.i !== e.i && Cn(o, e)) {
          let s = jn(o, e);
          ((o = on(o, o.next)),
            (s = on(s, s.next)),
            sn(o, t, n, r, i, a, 0),
            sn(s, t, n, r, i, a, 0));
          return;
        }
        e = e.next;
      }
      o = o.next;
    } while (o !== e);
  }
  function fn(e, t, n, r) {
    let i = [];
    for (let n = 0, a = t.length; n < a; n++) {
      let o = an(e, t[n] * r, n < a - 1 ? t[n + 1] * r : e.length, r, !1);
      (o === o.next && (o.steiner = !0), i.push(bn(o)));
    }
    i.sort(pn);
    for (let e = 0; e < i.length; e++) n = mn(i[e], n);
    return n;
  }
  function pn(e, t) {
    let n = e.x - t.x;
    return (
      n === 0 &&
        ((n = e.y - t.y),
        n === 0 &&
          (n =
            (e.next.y - e.y) / (e.next.x - e.x) -
            (t.next.y - t.y) / (t.next.x - t.x))),
      n
    );
  }
  function mn(e, t) {
    let n = hn(e, t);
    if (!n) return t;
    let r = jn(n, e);
    return (on(r, r.next), on(n, n.next));
  }
  function hn(e, t) {
    let n = t,
      r = e.x,
      i = e.y,
      a = -1 / 0,
      o;
    if (wn(e, n)) return n;
    do {
      if (wn(e, n.next)) return n.next;
      if (i <= n.y && i >= n.next.y && n.next.y !== n.y) {
        let e = n.x + ((i - n.y) * (n.next.x - n.x)) / (n.next.y - n.y);
        if (
          e <= r &&
          e > a &&
          ((a = e), (o = n.x < n.next.x ? n : n.next), e === r)
        )
          return o;
      }
      n = n.next;
    } while (n !== t);
    if (!o) return null;
    let s = o,
      c = o.x,
      l = o.y,
      u = 1 / 0;
    n = o;
    do {
      if (
        r >= n.x &&
        n.x >= c &&
        r !== n.x &&
        xn(i < l ? r : a, i, c, l, i < l ? a : r, i, n.x, n.y)
      ) {
        let t = Math.abs(i - n.y) / (r - n.x);
        kn(n, e) &&
          (t < u || (t === u && (n.x > o.x || (n.x === o.x && gn(o, n))))) &&
          ((o = n), (u = t));
      }
      n = n.next;
    } while (n !== s);
    return o;
  }
  function gn(e, t) {
    return W(e.prev, e, t.prev) < 0 && W(t.next, e, e.next) < 0;
  }
  function _n(e, t, n, r) {
    let i = e;
    do
      (i.z === 0 && (i.z = yn(i.x, i.y, t, n, r)),
        (i.prevZ = i.prev),
        (i.nextZ = i.next),
        (i = i.next));
    while (i !== e);
    ((i.prevZ.nextZ = null), (i.prevZ = null), vn(i));
  }
  function vn(e) {
    let t,
      n = 1;
    do {
      let r = e,
        i;
      e = null;
      let a = null;
      for (t = 0; r; ) {
        t++;
        let o = r,
          s = 0;
        for (let e = 0; e < n && (s++, (o = o.nextZ), o); e++);
        let c = n;
        for (; s > 0 || (c > 0 && o); )
          (s !== 0 && (c === 0 || !o || r.z <= o.z)
            ? ((i = r), (r = r.nextZ), s--)
            : ((i = o), (o = o.nextZ), c--),
            a ? (a.nextZ = i) : (e = i),
            (i.prevZ = a),
            (a = i));
        r = o;
      }
      ((a.nextZ = null), (n *= 2));
    } while (t > 1);
    return e;
  }
  function yn(e, t, n, r, i) {
    return (
      (e = ((e - n) * i) | 0),
      (t = ((t - r) * i) | 0),
      (e = (e | (e << 8)) & 16711935),
      (e = (e | (e << 4)) & 252645135),
      (e = (e | (e << 2)) & 858993459),
      (e = (e | (e << 1)) & 1431655765),
      (t = (t | (t << 8)) & 16711935),
      (t = (t | (t << 4)) & 252645135),
      (t = (t | (t << 2)) & 858993459),
      (t = (t | (t << 1)) & 1431655765),
      e | (t << 1)
    );
  }
  function bn(e) {
    let t = e,
      n = e;
    do ((t.x < n.x || (t.x === n.x && t.y < n.y)) && (n = t), (t = t.next));
    while (t !== e);
    return n;
  }
  function xn(e, t, n, r, i, a, o, s) {
    return (
      (i - o) * (t - s) >= (e - o) * (a - s) &&
      (e - o) * (r - s) >= (n - o) * (t - s) &&
      (n - o) * (a - s) >= (i - o) * (r - s)
    );
  }
  function Sn(e, t, n, r, i, a, o, s) {
    return (e !== o || t !== s) && xn(e, t, n, r, i, a, o, s);
  }
  function Cn(e, t) {
    return (
      e.next.i !== t.i &&
      e.prev.i !== t.i &&
      !On(e, t) &&
      ((kn(e, t) &&
        kn(t, e) &&
        An(e, t) &&
        (W(e.prev, e, t.prev) || W(e, t.prev, t))) ||
        (wn(e, t) && W(e.prev, e, e.next) > 0 && W(t.prev, t, t.next) > 0))
    );
  }
  function W(e, t, n) {
    return (t.y - e.y) * (n.x - t.x) - (t.x - e.x) * (n.y - t.y);
  }
  function wn(e, t) {
    return e.x === t.x && e.y === t.y;
  }
  function Tn(e, t, n, r) {
    let i = Dn(W(e, t, n)),
      a = Dn(W(e, t, r)),
      o = Dn(W(n, r, e)),
      s = Dn(W(n, r, t));
    return !!(
      (i !== a && o !== s) ||
      (i === 0 && En(e, n, t)) ||
      (a === 0 && En(e, r, t)) ||
      (o === 0 && En(n, e, r)) ||
      (s === 0 && En(n, t, r))
    );
  }
  function En(e, t, n) {
    return (
      t.x <= Math.max(e.x, n.x) &&
      t.x >= Math.min(e.x, n.x) &&
      t.y <= Math.max(e.y, n.y) &&
      t.y >= Math.min(e.y, n.y)
    );
  }
  function Dn(e) {
    return e > 0 ? 1 : e < 0 ? -1 : 0;
  }
  function On(e, t) {
    let n = e;
    do {
      if (
        n.i !== e.i &&
        n.next.i !== e.i &&
        n.i !== t.i &&
        n.next.i !== t.i &&
        Tn(n, n.next, e, t)
      )
        return !0;
      n = n.next;
    } while (n !== e);
    return !1;
  }
  function kn(e, t) {
    return W(e.prev, e, e.next) < 0
      ? W(e, t, e.next) >= 0 && W(e, e.prev, t) >= 0
      : W(e, t, e.prev) < 0 || W(e, e.next, t) < 0;
  }
  function An(e, t) {
    let n = e,
      r = !1,
      i = (e.x + t.x) / 2,
      a = (e.y + t.y) / 2;
    do
      (n.y > a != n.next.y > a &&
        n.next.y !== n.y &&
        i < ((n.next.x - n.x) * (a - n.y)) / (n.next.y - n.y) + n.x &&
        (r = !r),
        (n = n.next));
    while (n !== e);
    return r;
  }
  function jn(e, t) {
    let n = Pn(e.i, e.x, e.y),
      r = Pn(t.i, t.x, t.y),
      i = e.next,
      a = t.prev;
    return (
      (e.next = t),
      (t.prev = e),
      (n.next = i),
      (i.prev = n),
      (r.next = n),
      (n.prev = r),
      (a.next = r),
      (r.prev = a),
      r
    );
  }
  function Mn(e, t, n, r) {
    let i = Pn(e, t, n);
    return (
      r
        ? ((i.next = r.next), (i.prev = r), (r.next.prev = i), (r.next = i))
        : ((i.prev = i), (i.next = i)),
      i
    );
  }
  function Nn(e) {
    ((e.next.prev = e.prev),
      (e.prev.next = e.next),
      e.prevZ && (e.prevZ.nextZ = e.nextZ),
      e.nextZ && (e.nextZ.prevZ = e.prevZ));
  }
  function Pn(e, t, n) {
    return {
      i: e,
      x: t,
      y: n,
      prev: null,
      next: null,
      z: 0,
      prevZ: null,
      nextZ: null,
      steiner: !1,
    };
  }
  function Fn(e, t, n, r) {
    let i = 0;
    for (let a = t, o = n - r; a < n; a += r)
      ((i += (e[o] - e[a]) * (e[a + 1] + e[o + 1])), (o = a));
    return i;
  }
  var In = class {
      static triangulate(e, t, n = 2) {
        return rn(e, t, n);
      }
    },
    Ln = class e {
      static area(e) {
        let t = e.length,
          n = 0;
        for (let r = t - 1, i = 0; i < t; r = i++)
          n += e[r].x * e[i].y - e[i].x * e[r].y;
        return n * 0.5;
      }
      static isClockWise(t) {
        return e.area(t) < 0;
      }
      static triangulateShape(e, t) {
        let n = [],
          r = [],
          i = [];
        (Rn(e), zn(n, e));
        let a = e.length;
        t.forEach(Rn);
        for (let e = 0; e < t.length; e++)
          (r.push(a), (a += t[e].length), zn(n, t[e]));
        let o = In.triangulate(n, r);
        for (let e = 0; e < o.length; e += 3) i.push(o.slice(e, e + 3));
        return i;
      }
    };
  function Rn(e) {
    let t = e.length;
    t > 2 && e[t - 1].equals(e[0]) && e.pop();
  }
  function zn(e, t) {
    for (let n = 0; n < t.length; n++) (e.push(t[n].x), e.push(t[n].y));
  }
  var Bn = class e extends bt {
    constructor(
      e = new nn([
        new A(0.5, 0.5),
        new A(-0.5, 0.5),
        new A(-0.5, -0.5),
        new A(0.5, -0.5),
      ]),
      t = {},
    ) {
      (super(),
        (this.type = `ExtrudeGeometry`),
        (this.parameters = { shapes: e, options: t }),
        (e = Array.isArray(e) ? e : [e]));
      let n = this,
        r = [],
        i = [];
      for (let t = 0, n = e.length; t < n; t++) {
        let n = e[t];
        a(n);
      }
      (this.setAttribute(`position`, new H(r, 3)),
        this.setAttribute(`uv`, new H(i, 2)),
        this.computeVertexNormals());
      function a(e) {
        let a = [],
          o = t.curveSegments === void 0 ? 12 : t.curveSegments,
          s = t.steps === void 0 ? 1 : t.steps,
          c = t.depth === void 0 ? 1 : t.depth,
          l = t.bevelEnabled === void 0 || t.bevelEnabled,
          u = t.bevelThickness === void 0 ? 0.2 : t.bevelThickness,
          d = t.bevelSize === void 0 ? u - 0.1 : t.bevelSize,
          f = t.bevelOffset === void 0 ? 0 : t.bevelOffset,
          p = t.bevelSegments === void 0 ? 3 : t.bevelSegments,
          m = t.extrudePath,
          h = t.UVGenerator === void 0 ? Vn : t.UVGenerator,
          g,
          _ = !1,
          v,
          y,
          x,
          S;
        if (m) {
          ((g = m.getSpacedPoints(s)), (_ = !0), (l = !1));
          let e = m.isCatmullRomCurve3 ? m.closed : !1;
          ((v = m.computeFrenetFrames(s, e)),
            (y = new M()),
            (x = new M()),
            (S = new M()));
        }
        l || ((p = 0), (u = 0), (d = 0), (f = 0));
        let C = e.extractPoints(o),
          w = C.shape,
          T = C.holes;
        if (!Ln.isClockWise(w)) {
          w = w.reverse();
          for (let e = 0, t = T.length; e < t; e++) {
            let t = T[e];
            Ln.isClockWise(t) && (T[e] = t.reverse());
          }
        }
        function E(e) {
          let t = e[0];
          for (let n = 1; n <= e.length; n++) {
            let r = n % e.length,
              i = e[r],
              a = i.x - t.x,
              o = i.y - t.y,
              s = a * a + o * o,
              c = Math.max(
                Math.abs(i.x),
                Math.abs(i.y),
                Math.abs(t.x),
                Math.abs(t.y),
              );
            if (s <= 10000000000000001e-36 * c * c) {
              (e.splice(r, 1), n--);
              continue;
            }
            t = i;
          }
        }
        (E(w), T.forEach(E));
        let D = T.length,
          O = w;
        for (let e = 0; e < D; e++) {
          let t = T[e];
          w = w.concat(t);
        }
        function k(e, t, n) {
          return (
            t || b(`ExtrudeGeometry: vec does not exist`),
            e.clone().addScaledVector(t, n)
          );
        }
        let j = w.length;
        function ee(e, t, n) {
          let r,
            i,
            a,
            o = e.x - t.x,
            s = e.y - t.y,
            c = n.x - e.x,
            l = n.y - e.y,
            u = o * o + s * s,
            d = o * l - s * c;
          if (Math.abs(d) > 2 ** -52) {
            let d = Math.sqrt(u),
              f = Math.sqrt(c * c + l * l),
              p = t.x - s / d,
              m = t.y + o / d,
              h = n.x - l / f,
              g = n.y + c / f,
              _ = ((h - p) * l - (g - m) * c) / (o * l - s * c);
            ((r = p + o * _ - e.x), (i = m + s * _ - e.y));
            let v = r * r + i * i;
            if (v <= 2) return new A(r, i);
            a = Math.sqrt(v / 2);
          } else {
            let e = !1;
            (o > 2 ** -52
              ? c > 2 ** -52 && (e = !0)
              : o < -(2 ** -52)
                ? c < -(2 ** -52) && (e = !0)
                : Math.sign(s) === Math.sign(l) && (e = !0),
              e
                ? ((r = -s), (i = o), (a = Math.sqrt(u)))
                : ((r = o), (i = s), (a = Math.sqrt(u / 2))));
          }
          return new A(r / a, i / a);
        }
        let N = [];
        for (
          let e = 0, t = O.length, n = t - 1, r = e + 1;
          e < t;
          e++, n++, r++
        )
          (n === t && (n = 0),
            r === t && (r = 0),
            (N[e] = ee(O[e], O[n], O[r])));
        let P = [],
          F,
          I = N.concat();
        for (let e = 0, t = D; e < t; e++) {
          let t = T[e];
          F = [];
          for (
            let e = 0, n = t.length, r = n - 1, i = e + 1;
            e < n;
            e++, r++, i++
          )
            (r === n && (r = 0),
              i === n && (i = 0),
              (F[e] = ee(t[e], t[r], t[i])));
          (P.push(F), (I = I.concat(F)));
        }
        let L;
        if (p === 0) L = Ln.triangulateShape(O, T);
        else {
          let e = [],
            t = [];
          for (let n = 0; n < p; n++) {
            let r = n / p,
              i = u * Math.cos((r * Math.PI) / 2),
              a = d * Math.sin((r * Math.PI) / 2) + f;
            for (let t = 0, n = O.length; t < n; t++) {
              let n = k(O[t], N[t], a);
              (B(n.x, n.y, -i), r === 0 && e.push(n));
            }
            for (let e = 0, n = D; e < n; e++) {
              let n = T[e];
              F = P[e];
              let o = [];
              for (let e = 0, t = n.length; e < t; e++) {
                let t = k(n[e], F[e], a);
                (B(t.x, t.y, -i), r === 0 && o.push(t));
              }
              r === 0 && t.push(o);
            }
          }
          L = Ln.triangulateShape(e, t);
        }
        let te = L.length,
          R = d + f;
        for (let e = 0; e < j; e++) {
          let t = l ? k(w[e], I[e], R) : w[e];
          _
            ? (x.copy(v.normals[0]).multiplyScalar(t.x),
              y.copy(v.binormals[0]).multiplyScalar(t.y),
              S.copy(g[0]).add(x).add(y),
              B(S.x, S.y, S.z))
            : B(t.x, t.y, 0);
        }
        for (let e = 1; e <= s; e++)
          for (let t = 0; t < j; t++) {
            let n = l ? k(w[t], I[t], R) : w[t];
            _
              ? (x.copy(v.normals[e]).multiplyScalar(n.x),
                y.copy(v.binormals[e]).multiplyScalar(n.y),
                S.copy(g[e]).add(x).add(y),
                B(S.x, S.y, S.z))
              : B(n.x, n.y, (c / s) * e);
          }
        for (let e = p - 1; e >= 0; e--) {
          let t = e / p,
            n = u * Math.cos((t * Math.PI) / 2),
            r = d * Math.sin((t * Math.PI) / 2) + f;
          for (let e = 0, t = O.length; e < t; e++) {
            let t = k(O[e], N[e], r);
            B(t.x, t.y, c + n);
          }
          for (let e = 0, t = T.length; e < t; e++) {
            let t = T[e];
            F = P[e];
            for (let e = 0, i = t.length; e < i; e++) {
              let i = k(t[e], F[e], r);
              _ ? B(i.x, i.y + g[s - 1].y, g[s - 1].x + n) : B(i.x, i.y, c + n);
            }
          }
        }
        (ne(), re());
        function ne() {
          let e = r.length / 3;
          if (l) {
            let e = 0,
              t = j * e;
            for (let e = 0; e < te; e++) {
              let n = L[e];
              ie(n[2] + t, n[1] + t, n[0] + t);
            }
            ((e = s + p * 2), (t = j * e));
            for (let e = 0; e < te; e++) {
              let n = L[e];
              ie(n[0] + t, n[1] + t, n[2] + t);
            }
          } else {
            for (let e = 0; e < te; e++) {
              let t = L[e];
              ie(t[2], t[1], t[0]);
            }
            for (let e = 0; e < te; e++) {
              let t = L[e];
              ie(t[0] + j * s, t[1] + j * s, t[2] + j * s);
            }
          }
          n.addGroup(e, r.length / 3 - e, 0);
        }
        function re() {
          let e = r.length / 3,
            t = 0;
          (z(O, t), (t += O.length));
          for (let e = 0, n = T.length; e < n; e++) {
            let n = T[e];
            (z(n, t), (t += n.length));
          }
          n.addGroup(e, r.length / 3 - e, 1);
        }
        function z(e, t) {
          let n = e.length;
          for (; --n >= 0; ) {
            let r = n,
              i = n - 1;
            i < 0 && (i = e.length - 1);
            for (let e = 0, n = s + p * 2; e < n; e++) {
              let n = j * e,
                a = j * (e + 1);
              ae(t + r + n, t + i + n, t + i + a, t + r + a);
            }
          }
        }
        function B(e, t, n) {
          (a.push(e), a.push(t), a.push(n));
        }
        function ie(e, t, i) {
          (oe(e), oe(t), oe(i));
          let a = r.length / 3,
            o = h.generateTopUV(n, r, a - 3, a - 2, a - 1);
          (se(o[0]), se(o[1]), se(o[2]));
        }
        function ae(e, t, i, a) {
          (oe(e), oe(t), oe(a), oe(t), oe(i), oe(a));
          let o = r.length / 3,
            s = h.generateSideWallUV(n, r, o - 6, o - 3, o - 2, o - 1);
          (se(s[0]), se(s[1]), se(s[3]), se(s[1]), se(s[2]), se(s[3]));
        }
        function oe(e) {
          (r.push(a[e * 3 + 0]), r.push(a[e * 3 + 1]), r.push(a[e * 3 + 2]));
        }
        function se(e) {
          (i.push(e.x), i.push(e.y));
        }
      }
    }
    copy(e) {
      return (
        super.copy(e),
        (this.parameters = Object.assign({}, e.parameters)),
        this
      );
    }
    toJSON() {
      let e = super.toJSON(),
        t = this.parameters.shapes,
        n = this.parameters.options;
      return Hn(t, n, e);
    }
    static fromJSON(t, n) {
      let r = [];
      for (let e = 0, i = t.shapes.length; e < i; e++) {
        let i = n[t.shapes[e]];
        r.push(i);
      }
      let i = t.options.extrudePath;
      return (
        i !== void 0 && (t.options.extrudePath = new $t[i.type]().fromJSON(i)),
        new e(r, t.options)
      );
    }
  };
  let Vn = {
    generateTopUV: function (e, t, n, r, i) {
      let a = t[n * 3],
        o = t[n * 3 + 1],
        s = t[r * 3],
        c = t[r * 3 + 1],
        l = t[i * 3],
        u = t[i * 3 + 1];
      return [new A(a, o), new A(s, c), new A(l, u)];
    },
    generateSideWallUV: function (e, t, n, r, i, a) {
      let o = t[n * 3],
        s = t[n * 3 + 1],
        c = t[n * 3 + 2],
        l = t[r * 3],
        u = t[r * 3 + 1],
        d = t[r * 3 + 2],
        f = t[i * 3],
        p = t[i * 3 + 1],
        m = t[i * 3 + 2],
        h = t[a * 3],
        g = t[a * 3 + 1],
        _ = t[a * 3 + 2];
      return Math.abs(s - u) < Math.abs(o - l)
        ? [new A(o, 1 - c), new A(l, 1 - d), new A(f, 1 - m), new A(h, 1 - _)]
        : [new A(s, 1 - c), new A(u, 1 - d), new A(p, 1 - m), new A(g, 1 - _)];
    },
  };
  function Hn(e, t, n) {
    if (((n.shapes = []), Array.isArray(e)))
      for (let t = 0, r = e.length; t < r; t++) {
        let r = e[t];
        n.shapes.push(r.uuid);
      }
    else n.shapes.push(e.uuid);
    return (
      (n.options = Object.assign({}, t)),
      t.extrudePath !== void 0 &&
        (n.options.extrudePath = t.extrudePath.toJSON()),
      n
    );
  }
  var Un = class e extends Tt {
      constructor(e = 1, t = 0) {
        let n = (1 + Math.sqrt(5)) / 2,
          r = [
            -1,
            n,
            0,
            1,
            n,
            0,
            -1,
            -n,
            0,
            1,
            -n,
            0,
            0,
            -1,
            n,
            0,
            1,
            n,
            0,
            -1,
            -n,
            0,
            1,
            -n,
            n,
            0,
            -1,
            n,
            0,
            1,
            -n,
            0,
            -1,
            -n,
            0,
            1,
          ];
        (super(
          r,
          [
            0, 11, 5, 0, 5, 1, 0, 1, 7, 0, 7, 10, 0, 10, 11, 1, 5, 9, 5, 11, 4,
            11, 10, 2, 10, 7, 6, 7, 1, 8, 3, 9, 4, 3, 4, 2, 3, 2, 6, 3, 6, 8, 3,
            8, 9, 4, 9, 5, 2, 4, 11, 6, 2, 10, 8, 6, 7, 9, 8, 1,
          ],
          e,
          t,
        ),
          (this.type = `IcosahedronGeometry`),
          (this.parameters = { radius: e, detail: t }));
      }
      static fromJSON(t) {
        return new e(t.radius, t.detail);
      }
    },
    Wn = class e extends bt {
      constructor(
        e = [new A(0, -0.5), new A(0.5, 0), new A(0, 0.5)],
        t = 12,
        n = 0,
        r = Math.PI * 2,
      ) {
        (super(),
          (this.type = `LatheGeometry`),
          (this.parameters = {
            points: e,
            segments: t,
            phiStart: n,
            phiLength: r,
          }),
          (t = Math.floor(t)),
          (r = T(r, 0, Math.PI * 2)));
        let i = [],
          a = [],
          o = [],
          s = [],
          c = [],
          l = 1 / t,
          u = new M(),
          d = new A(),
          f = new M(),
          p = new M(),
          m = new M(),
          h = 0,
          g = 0;
        for (let t = 0; t <= e.length - 1; t++)
          switch (t) {
            case 0:
              ((h = e[t + 1].x - e[t].x),
                (g = e[t + 1].y - e[t].y),
                (f.x = g * 1),
                (f.y = -h),
                (f.z = g * 0),
                m.copy(f),
                f.normalize(),
                s.push(f.x, f.y, f.z));
              break;
            case e.length - 1:
              s.push(m.x, m.y, m.z);
              break;
            default:
              ((h = e[t + 1].x - e[t].x),
                (g = e[t + 1].y - e[t].y),
                (f.x = g * 1),
                (f.y = -h),
                (f.z = g * 0),
                p.copy(f),
                (f.x += m.x),
                (f.y += m.y),
                (f.z += m.z),
                f.normalize(),
                s.push(f.x, f.y, f.z),
                m.copy(p));
          }
        for (let i = 0; i <= t; i++) {
          let f = n + i * l * r,
            p = Math.sin(f),
            m = Math.cos(f);
          for (let n = 0; n <= e.length - 1; n++) {
            ((u.x = e[n].x * p),
              (u.y = e[n].y),
              (u.z = e[n].x * m),
              a.push(u.x, u.y, u.z),
              (d.x = i / t),
              (d.y = n / (e.length - 1)),
              o.push(d.x, d.y));
            let r = s[3 * n + 0] * p,
              l = s[3 * n + 1],
              f = s[3 * n + 0] * m;
            c.push(r, l, f);
          }
        }
        for (let n = 0; n < t; n++)
          for (let t = 0; t < e.length - 1; t++) {
            let r = t + n * e.length,
              a = r,
              o = r + e.length,
              s = r + e.length + 1,
              c = r + 1;
            (i.push(a, o, c), i.push(s, c, o));
          }
        (this.setIndex(i),
          this.setAttribute(`position`, new H(a, 3)),
          this.setAttribute(`uv`, new H(o, 2)),
          this.setAttribute(`normal`, new H(c, 3)));
      }
      copy(e) {
        return (
          super.copy(e),
          (this.parameters = Object.assign({}, e.parameters)),
          this
        );
      }
      static fromJSON(t) {
        return new e(t.points, t.segments, t.phiStart, t.phiLength);
      }
    },
    Gn = class e extends Tt {
      constructor(e = 1, t = 0) {
        (super(
          [1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 1, 0, 0, -1],
          [
            0, 2, 4, 0, 4, 3, 0, 3, 5, 0, 5, 2, 1, 2, 5, 1, 5, 3, 1, 3, 4, 1, 4,
            2,
          ],
          e,
          t,
        ),
          (this.type = `OctahedronGeometry`),
          (this.parameters = { radius: e, detail: t }));
      }
      static fromJSON(t) {
        return new e(t.radius, t.detail);
      }
    },
    Kn = class e extends bt {
      constructor(
        e = 1,
        t = 32,
        n = 16,
        r = 0,
        i = Math.PI * 2,
        a = 0,
        o = Math.PI,
      ) {
        (super(),
          (this.type = `SphereGeometry`),
          (this.parameters = {
            radius: e,
            widthSegments: t,
            heightSegments: n,
            phiStart: r,
            phiLength: i,
            thetaStart: a,
            thetaLength: o,
          }),
          (t = Math.max(3, Math.floor(t))),
          (n = Math.max(2, Math.floor(n))));
        let s = Math.min(a + o, Math.PI),
          c = 0,
          l = [],
          u = new M(),
          d = new M(),
          f = [],
          p = [],
          m = [],
          h = [];
        for (let f = 0; f <= n; f++) {
          let g = [],
            _ = f / n,
            v = a + _ * o,
            y = e * Math.cos(v),
            b = Math.sqrt(e * e - y * y),
            x = 0;
          f === 0 && a === 0
            ? (x = 0.5 / t)
            : f === n && s === Math.PI && (x = -0.5 / t);
          for (let e = 0; e <= t; e++) {
            let n = e / t,
              a = r + n * i;
            ((u.x = -b * Math.cos(a)),
              (u.y = y),
              (u.z = b * Math.sin(a)),
              p.push(u.x, u.y, u.z),
              d.copy(u).normalize(),
              m.push(d.x, d.y, d.z),
              h.push(n + x, 1 - _),
              g.push(c++));
          }
          l.push(g);
        }
        for (let e = 0; e < n; e++)
          for (let r = 0; r < t; r++) {
            let t = l[e][r + 1],
              i = l[e][r],
              o = l[e + 1][r],
              c = l[e + 1][r + 1];
            ((e !== 0 || a > 0) && f.push(t, i, c),
              (e !== n - 1 || s < Math.PI) && f.push(i, o, c));
          }
        (this.setIndex(f),
          this.setAttribute(`position`, new H(p, 3)),
          this.setAttribute(`normal`, new H(m, 3)),
          this.setAttribute(`uv`, new H(h, 2)));
      }
      copy(e) {
        return (
          super.copy(e),
          (this.parameters = Object.assign({}, e.parameters)),
          this
        );
      }
      static fromJSON(t) {
        return new e(
          t.radius,
          t.widthSegments,
          t.heightSegments,
          t.phiStart,
          t.phiLength,
          t.thetaStart,
          t.thetaLength,
        );
      }
    },
    qn = class e extends bt {
      constructor(
        e = 1,
        t = 0.4,
        n = 12,
        r = 48,
        i = Math.PI * 2,
        a = 0,
        o = Math.PI * 2,
      ) {
        (super(),
          (this.type = `TorusGeometry`),
          (this.parameters = {
            radius: e,
            tube: t,
            radialSegments: n,
            tubularSegments: r,
            arc: i,
            thetaStart: a,
            thetaLength: o,
          }),
          (n = Math.floor(n)),
          (r = Math.floor(r)));
        let s = [],
          c = [],
          l = [],
          u = [],
          d = new M(),
          f = new M(),
          p = new M();
        for (let s = 0; s <= n; s++) {
          let m = a + (s / n) * o;
          for (let a = 0; a <= r; a++) {
            let o = (a / r) * i;
            ((f.x = (e + t * Math.cos(m)) * Math.cos(o)),
              (f.y = (e + t * Math.cos(m)) * Math.sin(o)),
              (f.z = t * Math.sin(m)),
              c.push(f.x, f.y, f.z),
              (d.x = e * Math.cos(o)),
              (d.y = e * Math.sin(o)),
              p.subVectors(f, d).normalize(),
              l.push(p.x, p.y, p.z),
              u.push(a / r),
              u.push(s / n));
          }
        }
        for (let e = 1; e <= n; e++)
          for (let t = 1; t <= r; t++) {
            let n = (r + 1) * e + t - 1,
              i = (r + 1) * (e - 1) + t - 1,
              a = (r + 1) * (e - 1) + t,
              o = (r + 1) * e + t;
            (s.push(n, i, o), s.push(i, a, o));
          }
        (this.setIndex(s),
          this.setAttribute(`position`, new H(c, 3)),
          this.setAttribute(`normal`, new H(l, 3)),
          this.setAttribute(`uv`, new H(u, 2)));
      }
      copy(e) {
        return (
          super.copy(e),
          (this.parameters = Object.assign({}, e.parameters)),
          this
        );
      }
      static fromJSON(t) {
        return new e(
          t.radius,
          t.tube,
          t.radialSegments,
          t.tubularSegments,
          t.arc,
          t.thetaStart,
          t.thetaLength,
        );
      }
    };
  function Jn(e, t) {
    return !e || e.constructor === t
      ? e
      : typeof t.BYTES_PER_ELEMENT == `number`
        ? new t(e)
        : Array.prototype.slice.call(e);
  }
  function Yn(e) {
    return e !== void 0 && e.inTangents !== void 0 && e.outTangents !== void 0;
  }
  var Xn = class {
      constructor(e, t, n, r) {
        ((this.parameterPositions = e),
          (this._cachedIndex = 0),
          (this.resultBuffer = r === void 0 ? new t.constructor(n) : r),
          (this.sampleValues = t),
          (this.valueSize = n),
          (this.settings = null),
          (this.DefaultSettings_ = {}));
      }
      evaluate(e) {
        let t = this.parameterPositions,
          n = this._cachedIndex,
          r = t[n],
          i = t[n - 1];
        validate_interval: {
          seek: {
            let a;
            linear_scan: {
              forward_scan: if (!(e < r)) {
                for (let a = n + 2; ; ) {
                  if (r === void 0) {
                    if (e < i) break forward_scan;
                    return (
                      (n = t.length),
                      (this._cachedIndex = n),
                      this.copySampleValue_(n - 1)
                    );
                  }
                  if (n === a) break;
                  if (((i = r), (r = t[++n]), e < r)) break seek;
                }
                a = t.length;
                break linear_scan;
              }
              if (!(e >= i)) {
                let o = t[1];
                e < o && ((n = 2), (i = o));
                for (let a = n - 2; ; ) {
                  if (i === void 0)
                    return ((this._cachedIndex = 0), this.copySampleValue_(0));
                  if (n === a) break;
                  if (((r = i), (i = t[--n - 1]), e >= i)) break seek;
                }
                ((a = n), (n = 0));
                break linear_scan;
              }
              break validate_interval;
            }
            for (; n < a; ) {
              let r = (n + a) >>> 1;
              e < t[r] ? (a = r) : (n = r + 1);
            }
            if (((r = t[n]), (i = t[n - 1]), i === void 0))
              return ((this._cachedIndex = 0), this.copySampleValue_(0));
            if (r === void 0)
              return (
                (n = t.length),
                (this._cachedIndex = n),
                this.copySampleValue_(n - 1)
              );
          }
          ((this._cachedIndex = n), this.intervalChanged_(n, i, r));
        }
        return this.interpolate_(n, i, e, r);
      }
      getSettings_() {
        return this.settings || this.DefaultSettings_;
      }
      copySampleValue_(e) {
        let t = this.resultBuffer,
          n = this.sampleValues,
          r = this.valueSize,
          i = e * r;
        for (let e = 0; e !== r; ++e) t[e] = n[i + e];
        return t;
      }
      interpolate_() {
        throw Error(`THREE.Interpolant: Call to abstract method.`);
      }
      intervalChanged_() {}
    },
    Zn = class extends Xn {
      constructor(e, t, n, r) {
        (super(e, t, n, r),
          (this._weightPrev = -0),
          (this._offsetPrev = -0),
          (this._weightNext = -0),
          (this._offsetNext = -0),
          (this.DefaultSettings_ = { endingStart: s, endingEnd: s }));
      }
      intervalChanged_(e, t, n) {
        let r = this.parameterPositions,
          i = e - 2,
          a = e + 1,
          o = r[i],
          s = r[a];
        if (o === void 0)
          switch (this.getSettings_().endingStart) {
            case c:
              ((i = e), (o = 2 * t - n));
              break;
            case l:
              ((i = r.length - 2), (o = t + r[i] - r[i + 1]));
              break;
            default:
              ((i = e), (o = n));
          }
        if (s === void 0)
          switch (this.getSettings_().endingEnd) {
            case c:
              ((a = e), (s = 2 * n - t));
              break;
            case l:
              ((a = 1), (s = n + r[1] - r[0]));
              break;
            default:
              ((a = e - 1), (s = t));
          }
        let u = (n - t) * 0.5,
          d = this.valueSize;
        ((this._weightPrev = u / (t - o)),
          (this._weightNext = u / (s - n)),
          (this._offsetPrev = i * d),
          (this._offsetNext = a * d));
      }
      interpolate_(e, t, n, r) {
        let i = this.resultBuffer,
          a = this.sampleValues,
          o = this.valueSize,
          s = e * o,
          c = s - o,
          l = this._offsetPrev,
          u = this._offsetNext,
          d = this._weightPrev,
          f = this._weightNext,
          p = (n - t) / (r - t),
          m = p * p,
          h = m * p,
          g = -d * h + 2 * d * m - d * p,
          _ = (1 + d) * h + (-1.5 - 2 * d) * m + (-0.5 + d) * p + 1,
          v = (-1 - f) * h + (1.5 + f) * m + 0.5 * p,
          y = f * h - f * m;
        for (let e = 0; e !== o; ++e)
          i[e] = g * a[l + e] + _ * a[c + e] + v * a[s + e] + y * a[u + e];
        return i;
      }
    },
    Qn = class extends Xn {
      constructor(e, t, n, r) {
        super(e, t, n, r);
      }
      interpolate_(e, t, n, r) {
        let i = this.resultBuffer,
          a = this.sampleValues,
          o = this.valueSize,
          s = e * o,
          c = s - o,
          l = (n - t) / (r - t),
          u = 1 - l;
        for (let e = 0; e !== o; ++e) i[e] = a[c + e] * u + a[s + e] * l;
        return i;
      }
    },
    $n = class extends Xn {
      constructor(e, t, n, r) {
        super(e, t, n, r);
      }
      interpolate_(e) {
        return this.copySampleValue_(e - 1);
      }
    },
    er = class extends Xn {
      interpolate_(e, t, n, r) {
        let i = this.resultBuffer,
          a = this.sampleValues,
          o = this.valueSize,
          s = e * o,
          c = s - o,
          l = this.inTangents,
          u = this.outTangents;
        if (!l || !u) {
          let e = (n - t) / (r - t),
            l = 1 - e;
          for (let t = 0; t !== o; ++t) i[t] = a[c + t] * l + a[s + t] * e;
          return i;
        }
        let d = o * 2,
          f = e - 1;
        for (let p = 0; p !== o; ++p) {
          let o = a[c + p],
            m = a[s + p],
            h = f * d + p * 2,
            g = u[h],
            _ = u[h + 1],
            v = e * d + p * 2,
            y = l[v],
            b = l[v + 1],
            x = rr(n, t, g, y, r);
          i[p] = tr(x, o, _, b, m);
        }
        return i;
      }
    };
  function tr(e, t, n, r, i) {
    let a = 1 - e;
    return (
      a * a * a * t + 3 * a * a * e * n + 3 * a * e * e * r + e * e * e * i
    );
  }
  function nr(e, t, n, r, i) {
    let a = 1 - e;
    return 3 * a * a * (n - t) + 6 * a * e * (r - n) + 3 * e * e * (i - r);
  }
  function rr(e, t, n, r, i) {
    let a = (e - t) / (i - t);
    for (let o = 0; o < 8; o++) {
      let o = tr(a, t, n, r, i) - e;
      if (Math.abs(o) < 1e-10) break;
      let s = nr(a, t, n, r, i);
      if (Math.abs(s) < 1e-10) break;
      a = Math.max(0, Math.min(1, a - o / s));
    }
    return a;
  }
  var ir = class {
    constructor(e, t, n, r) {
      if (e === void 0)
        throw Error(`THREE.KeyframeTrack: track name is undefined`);
      if (t === void 0 || t.length === 0)
        throw Error(`THREE.KeyframeTrack: no keyframes in track named ` + e);
      ((this.name = e),
        (this.times = Jn(t, this.TimeBufferType)),
        (this.values = Jn(n, this.ValueBufferType)),
        this.setInterpolation(r || this.DefaultInterpolation));
    }
    static toJSON(e) {
      let t = e.constructor,
        n;
      if (t.toJSON !== this.toJSON) n = t.toJSON(e);
      else {
        n = {
          name: e.name,
          times: Jn(e.times, Array),
          values: Jn(e.values, Array),
        };
        let t = e.getInterpolation();
        (t !== e.DefaultInterpolation && (n.interpolation = t),
          Yn(e.settings) &&
            (n.settings = {
              inTangents: Jn(e.settings.inTangents, Array),
              outTangents: Jn(e.settings.outTangents, Array),
            }));
      }
      return ((n.type = e.ValueTypeName), n);
    }
    InterpolantFactoryMethodDiscrete(e) {
      return new $n(this.times, this.values, this.getValueSize(), e);
    }
    InterpolantFactoryMethodLinear(e) {
      return new Qn(this.times, this.values, this.getValueSize(), e);
    }
    InterpolantFactoryMethodSmooth(e) {
      return new Zn(this.times, this.values, this.getValueSize(), e);
    }
    InterpolantFactoryMethodBezier(e) {
      let t = new er(this.times, this.values, this.getValueSize(), e);
      return (
        this.settings &&
          ((t.inTangents = this.settings.inTangents),
          (t.outTangents = this.settings.outTangents)),
        t
      );
    }
    setInterpolation(e) {
      let t;
      switch (e) {
        case r:
          t = this.InterpolantFactoryMethodDiscrete;
          break;
        case i:
          t = this.InterpolantFactoryMethodLinear;
          break;
        case a:
          t = this.InterpolantFactoryMethodSmooth;
          break;
        case o:
          t = this.InterpolantFactoryMethodBezier;
      }
      if (t === void 0) {
        let t =
          `unsupported interpolation for ` +
          this.ValueTypeName +
          ` keyframe track named ` +
          this.name;
        if (this.createInterpolant === void 0) {
          if (e !== this.DefaultInterpolation)
            this.setInterpolation(this.DefaultInterpolation);
          else throw Error(t);
        }
        return (y(`KeyframeTrack:`, t), this);
      }
      return ((this.createInterpolant = t), this);
    }
    getInterpolation() {
      switch (this.createInterpolant) {
        case this.InterpolantFactoryMethodDiscrete:
          return r;
        case this.InterpolantFactoryMethodLinear:
          return i;
        case this.InterpolantFactoryMethodSmooth:
          return a;
        case this.InterpolantFactoryMethodBezier:
          return o;
      }
    }
    getValueSize() {
      return this.values.length / this.times.length;
    }
    shift(e) {
      if (e !== 0) {
        let t = this.times;
        for (let n = 0, r = t.length; n !== r; ++n) t[n] += e;
      }
      return this;
    }
    scale(e) {
      if (e !== 1) {
        let t = this.times;
        for (let n = 0, r = t.length; n !== r; ++n) t[n] *= e;
        Yn(this.settings) &&
          (ar(this.settings.inTangents, e), ar(this.settings.outTangents, e));
      }
      return this;
    }
    trim(e, t) {
      let n = this.times,
        r = n.length,
        i = 0,
        a = r - 1;
      for (; i !== r && n[i] < e; ) ++i;
      for (; a !== -1 && n[a] > t; ) --a;
      if ((++a, i !== 0 || a !== r)) {
        i >= a && ((a = Math.max(a, 1)), (i = a - 1));
        let e = this.getValueSize();
        ((this.times = n.slice(i, a)),
          (this.values = this.values.slice(i * e, a * e)));
      }
      return this;
    }
    validate() {
      let e = !0,
        t = this.getValueSize();
      t - Math.floor(t) !== 0 &&
        (b(`KeyframeTrack: Invalid value size in track.`, this), (e = !1));
      let n = this.times,
        r = this.values,
        i = n.length;
      i === 0 && (b(`KeyframeTrack: Track is empty.`, this), (e = !1));
      let a = null;
      for (let t = 0; t !== i; t++) {
        let r = n[t];
        if (typeof r == `number` && isNaN(r)) {
          (b(`KeyframeTrack: Time is not a valid number.`, this, t, r),
            (e = !1));
          break;
        }
        if (a !== null && a > r) {
          (b(`KeyframeTrack: Out of order keys.`, this, t, r, a), (e = !1));
          break;
        }
        a = r;
      }
      if (r !== void 0 && h(r))
        for (let t = 0, n = r.length; t !== n; ++t) {
          let n = r[t];
          if (isNaN(n)) {
            (b(`KeyframeTrack: Value is not a valid number.`, this, t, n),
              (e = !1));
            break;
          }
        }
      return e;
    }
    optimize() {
      let e = this.times.slice(),
        t = this.values.slice(),
        n = this.getValueSize(),
        r = this.getInterpolation() === a,
        i = e.length - 1,
        o = 1;
      for (let a = 1; a < i; ++a) {
        let i = !1,
          s = e[a];
        if (s !== e[a + 1] && (a !== 1 || s !== e[0])) {
          if (r) i = !0;
          else {
            let e = a * n,
              r = e - n,
              o = e + n;
            for (let a = 0; a !== n; ++a) {
              let n = t[e + a];
              if (n !== t[r + a] || n !== t[o + a]) {
                i = !0;
                break;
              }
            }
          }
        }
        if (i) {
          if (a !== o) {
            e[o] = e[a];
            let r = a * n,
              i = o * n;
            for (let e = 0; e !== n; ++e) t[i + e] = t[r + e];
          }
          ++o;
        }
      }
      if (i > 0) {
        e[o] = e[i];
        for (let e = i * n, r = o * n, a = 0; a !== n; ++a) t[r + a] = t[e + a];
        ++o;
      }
      return (
        o === e.length
          ? ((this.times = e), (this.values = t))
          : ((this.times = e.slice(0, o)), (this.values = t.slice(0, o * n))),
        this
      );
    }
    clone() {
      let e = this.times.slice(),
        t = this.values.slice(),
        n = this.constructor,
        r = new n(this.name, e, t);
      return (
        (r.createInterpolant = this.createInterpolant),
        Yn(this.settings) &&
          (r.settings = {
            inTangents: this.settings.inTangents.slice(),
            outTangents: this.settings.outTangents.slice(),
          }),
        r
      );
    }
  };
  function ar(e, t) {
    for (let n = 0, r = e.length; n !== r; n += 2) e[n] *= t;
  }
  ((ir.prototype.ValueTypeName = ``),
    (ir.prototype.TimeBufferType = Float32Array),
    (ir.prototype.ValueBufferType = Float32Array),
    (ir.prototype.DefaultInterpolation = i));
  var or = class extends ir {
    constructor(e, t, n) {
      super(e, t, n);
    }
  };
  ((or.prototype.ValueTypeName = `bool`),
    (or.prototype.ValueBufferType = Array),
    (or.prototype.DefaultInterpolation = r),
    (or.prototype.InterpolantFactoryMethodLinear = void 0),
    (or.prototype.InterpolantFactoryMethodSmooth = void 0));
  var sr = class extends ir {
    constructor(e, t, n, r) {
      super(e, t, n, r);
    }
  };
  sr.prototype.ValueTypeName = `color`;
  var cr = class extends ir {
    constructor(e, t, n, r) {
      super(e, t, n, r);
    }
  };
  cr.prototype.ValueTypeName = `number`;
  var lr = class extends Xn {
      constructor(e, t, n, r) {
        super(e, t, n, r);
      }
      interpolate_(e, t, n, r) {
        let i = this.resultBuffer,
          a = this.sampleValues,
          o = this.valueSize,
          s = (n - t) / (r - t),
          c = e * o;
        for (let e = c + o; c !== e; c += 4)
          j.slerpFlat(i, 0, a, c - o, a, c, s);
        return i;
      }
    },
    ur = class extends ir {
      constructor(e, t, n, r) {
        super(e, t, n, r);
      }
      InterpolantFactoryMethodLinear(e) {
        return new lr(this.times, this.values, this.getValueSize(), e);
      }
    };
  ((ur.prototype.ValueTypeName = `quaternion`),
    (ur.prototype.InterpolantFactoryMethodSmooth = void 0));
  var dr = class extends ir {
    constructor(e, t, n) {
      super(e, t, n);
    }
  };
  ((dr.prototype.ValueTypeName = `string`),
    (dr.prototype.ValueBufferType = Array),
    (dr.prototype.DefaultInterpolation = r),
    (dr.prototype.InterpolantFactoryMethodLinear = void 0),
    (dr.prototype.InterpolantFactoryMethodSmooth = void 0));
  var fr = class extends ir {
    constructor(e, t, n, r) {
      super(e, t, n, r);
    }
  };
  fr.prototype.ValueTypeName = `vector`;
  let pr = /* @__PURE__ */ RegExp(`[\\[\\]\\.:\\/]`, `g`),
    mr = /* @__PURE__ */ RegExp(
      `^((?:[^\\[\\]\\.:\\/]+[\\/:])*)([^\\[\\]:\\/]+)?(?:\\.([^\\[\\]\\.:\\/]+)(?:\\[(.+)\\])?)?\\.([^\\[\\]\\.:\\/]+)(?:\\[(.+)\\])?$`,
    ),
    hr = [`material`, `materials`, `bones`, `map`];
  var gr = class {
      constructor(e, t, n) {
        let r = n || G.parseTrackName(t);
        ((this._targetGroup = e), (this._bindings = e.subscribe_(t, r)));
      }
      getValue(e, t) {
        this.bind();
        let n = this._targetGroup.nCachedObjects_,
          r = this._bindings[n];
        r !== void 0 && r.getValue(e, t);
      }
      setValue(e, t) {
        let n = this._bindings;
        for (
          let r = this._targetGroup.nCachedObjects_, i = n.length;
          r !== i;
          ++r
        )
          n[r].setValue(e, t);
      }
      bind() {
        let e = this._bindings;
        for (
          let t = this._targetGroup.nCachedObjects_, n = e.length;
          t !== n;
          ++t
        )
          e[t].bind();
      }
      unbind() {
        let e = this._bindings;
        for (
          let t = this._targetGroup.nCachedObjects_, n = e.length;
          t !== n;
          ++t
        )
          e[t].unbind();
      }
    },
    G = class e {
      constructor(t, n, r) {
        ((this.path = n),
          (this.parsedPath = r || e.parseTrackName(n)),
          (this.node = e.findNode(t, this.parsedPath.nodeName)),
          (this.rootNode = t),
          (this.getValue = this._getValue_unbound),
          (this.setValue = this._setValue_unbound));
      }
      static create(t, n, r) {
        return t && t.isAnimationObjectGroup
          ? new e.Composite(t, n, r)
          : new e(t, n, r);
      }
      static sanitizeNodeName(e) {
        return e.replace(/\s/g, `_`).replace(pr, ``);
      }
      static parseTrackName(e) {
        let t = mr.exec(e);
        if (t === null)
          throw Error(`THREE.PropertyBinding: Cannot parse trackName: ` + e);
        let n = {
            nodeName: t[2],
            objectName: t[3],
            objectIndex: t[4],
            propertyName: t[5],
            propertyIndex: t[6],
          },
          r = n.nodeName && n.nodeName.lastIndexOf(`.`);
        if (r !== void 0 && r !== -1) {
          let e = n.nodeName.substring(r + 1);
          hr.indexOf(e) !== -1 &&
            ((n.nodeName = n.nodeName.substring(0, r)), (n.objectName = e));
        }
        if (n.propertyName === null || n.propertyName.length === 0)
          throw Error(
            `THREE.PropertyBinding: can not parse propertyName from trackName: ` +
              e,
          );
        return n;
      }
      static findNode(e, t) {
        if (
          t === void 0 ||
          t === `` ||
          t === `.` ||
          t === -1 ||
          t === e.name ||
          t === e.uuid
        )
          return e;
        if (e.skeleton) {
          let n = e.skeleton.getBoneByName(t);
          if (n !== void 0) return n;
        }
        if (e.children) {
          let n = function (e) {
              for (let r = 0; r < e.length; r++) {
                let i = e[r];
                if (i.name === t || i.uuid === t) return i;
                let a = n(i.children);
                if (a) return a;
              }
              return null;
            },
            r = n(e.children);
          if (r) return r;
        }
        return null;
      }
      _getValue_unavailable() {}
      _setValue_unavailable() {}
      _getValue_direct(e, t) {
        e[t] = this.targetObject[this.propertyName];
      }
      _getValue_array(e, t) {
        let n = this.resolvedProperty;
        for (let r = 0, i = n.length; r !== i; ++r) e[t++] = n[r];
      }
      _getValue_arrayElement(e, t) {
        e[t] = this.resolvedProperty[this.propertyIndex];
      }
      _getValue_toArray(e, t) {
        this.resolvedProperty.toArray(e, t);
      }
      _setValue_direct(e, t) {
        this.targetObject[this.propertyName] = e[t];
      }
      _setValue_direct_setNeedsUpdate(e, t) {
        ((this.targetObject[this.propertyName] = e[t]),
          (this.targetObject.needsUpdate = !0));
      }
      _setValue_direct_setMatrixWorldNeedsUpdate(e, t) {
        ((this.targetObject[this.propertyName] = e[t]),
          (this.targetObject.matrixWorldNeedsUpdate = !0));
      }
      _setValue_array(e, t) {
        let n = this.resolvedProperty;
        for (let r = 0, i = n.length; r !== i; ++r) n[r] = e[t++];
      }
      _setValue_array_setNeedsUpdate(e, t) {
        let n = this.resolvedProperty;
        for (let r = 0, i = n.length; r !== i; ++r) n[r] = e[t++];
        this.targetObject.needsUpdate = !0;
      }
      _setValue_array_setMatrixWorldNeedsUpdate(e, t) {
        let n = this.resolvedProperty;
        for (let r = 0, i = n.length; r !== i; ++r) n[r] = e[t++];
        this.targetObject.matrixWorldNeedsUpdate = !0;
      }
      _setValue_arrayElement(e, t) {
        this.resolvedProperty[this.propertyIndex] = e[t];
      }
      _setValue_arrayElement_setNeedsUpdate(e, t) {
        ((this.resolvedProperty[this.propertyIndex] = e[t]),
          (this.targetObject.needsUpdate = !0));
      }
      _setValue_arrayElement_setMatrixWorldNeedsUpdate(e, t) {
        ((this.resolvedProperty[this.propertyIndex] = e[t]),
          (this.targetObject.matrixWorldNeedsUpdate = !0));
      }
      _setValue_fromArray(e, t) {
        this.resolvedProperty.fromArray(e, t);
      }
      _setValue_fromArray_setNeedsUpdate(e, t) {
        (this.resolvedProperty.fromArray(e, t),
          (this.targetObject.needsUpdate = !0));
      }
      _setValue_fromArray_setMatrixWorldNeedsUpdate(e, t) {
        (this.resolvedProperty.fromArray(e, t),
          (this.targetObject.matrixWorldNeedsUpdate = !0));
      }
      _getValue_unbound(e, t) {
        (this.bind(), this.getValue(e, t));
      }
      _setValue_unbound(e, t) {
        (this.bind(), this.setValue(e, t));
      }
      bind() {
        let t = this.node,
          n = this.parsedPath,
          r = n.objectName,
          i = n.propertyName,
          a = n.propertyIndex;
        if (
          (t || ((t = e.findNode(this.rootNode, n.nodeName)), (this.node = t)),
          (this.getValue = this._getValue_unavailable),
          (this.setValue = this._setValue_unavailable),
          !t)
        ) {
          y(
            `PropertyBinding: No target node found for track: ` +
              this.path +
              `.`,
          );
          return;
        }
        if (r) {
          let e = n.objectIndex;
          switch (r) {
            case `materials`:
              if (!t.material) {
                b(
                  `PropertyBinding: Can not bind to material as node does not have a material.`,
                  this,
                );
                return;
              }
              if (!t.material.materials) {
                b(
                  `PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.`,
                  this,
                );
                return;
              }
              t = t.material.materials;
              break;
            case `bones`:
              if (!t.skeleton) {
                b(
                  `PropertyBinding: Can not bind to bones as node does not have a skeleton.`,
                  this,
                );
                return;
              }
              t = t.skeleton.bones;
              for (let n = 0; n < t.length; n++)
                if (t[n].name === e) {
                  e = n;
                  break;
                }
              break;
            case `map`:
              if (`map` in t) {
                t = t.map;
                break;
              }
              if (!t.material) {
                b(
                  `PropertyBinding: Can not bind to material as node does not have a material.`,
                  this,
                );
                return;
              }
              if (!t.material.map) {
                b(
                  `PropertyBinding: Can not bind to material.map as node.material does not have a map.`,
                  this,
                );
                return;
              }
              t = t.material.map;
              break;
            default:
              if (t[r] === void 0) {
                b(
                  `PropertyBinding: Can not bind to objectName of node undefined.`,
                  this,
                );
                return;
              }
              t = t[r];
          }
          if (e !== void 0) {
            if (t[e] === void 0) {
              b(
                `PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.`,
                this,
                t,
              );
              return;
            }
            t = t[e];
          }
        }
        let o = t[i];
        if (o === void 0) {
          let e = n.nodeName;
          b(
            `PropertyBinding: Trying to update property for track: ` +
              e +
              `.` +
              i +
              ` but it wasn't found.`,
            t,
          );
          return;
        }
        let s = this.Versioning.None;
        ((this.targetObject = t),
          t.isMaterial === !0
            ? (s = this.Versioning.NeedsUpdate)
            : t.isObject3D === !0 &&
              (s = this.Versioning.MatrixWorldNeedsUpdate));
        let c = this.BindingType.Direct;
        if (a !== void 0) {
          if (i === `morphTargetInfluences`) {
            if (!t.geometry) {
              b(
                `PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.`,
                this,
              );
              return;
            }
            if (!t.geometry.morphAttributes) {
              b(
                `PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.`,
                this,
              );
              return;
            }
            t.morphTargetDictionary[a] !== void 0 &&
              (a = t.morphTargetDictionary[a]);
          }
          ((c = this.BindingType.ArrayElement),
            (this.resolvedProperty = o),
            (this.propertyIndex = a));
        } else
          o.fromArray !== void 0 && o.toArray !== void 0
            ? ((c = this.BindingType.HasFromToArray),
              (this.resolvedProperty = o))
            : Array.isArray(o)
              ? ((c = this.BindingType.EntireArray),
                (this.resolvedProperty = o))
              : (this.propertyName = i);
        ((this.getValue = this.GetterByBindingType[c]),
          (this.setValue = this.SetterByBindingTypeAndVersioning[c][s]));
      }
      unbind() {
        ((this.node = null),
          (this.getValue = this._getValue_unbound),
          (this.setValue = this._setValue_unbound));
      }
    };
  ((G.Composite = gr),
    (G.prototype.BindingType = {
      Direct: 0,
      EntireArray: 1,
      ArrayElement: 2,
      HasFromToArray: 3,
    }),
    (G.prototype.Versioning = {
      None: 0,
      NeedsUpdate: 1,
      MatrixWorldNeedsUpdate: 2,
    }),
    (G.prototype.GetterByBindingType = [
      G.prototype._getValue_direct,
      G.prototype._getValue_array,
      G.prototype._getValue_arrayElement,
      G.prototype._getValue_toArray,
    ]),
    (G.prototype.SetterByBindingTypeAndVersioning = [
      [
        G.prototype._setValue_direct,
        G.prototype._setValue_direct_setNeedsUpdate,
        G.prototype._setValue_direct_setMatrixWorldNeedsUpdate,
      ],
      [
        G.prototype._setValue_array,
        G.prototype._setValue_array_setNeedsUpdate,
        G.prototype._setValue_array_setMatrixWorldNeedsUpdate,
      ],
      [
        G.prototype._setValue_arrayElement,
        G.prototype._setValue_arrayElement_setNeedsUpdate,
        G.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate,
      ],
      [
        G.prototype._setValue_fromArray,
        G.prototype._setValue_fromArray_setNeedsUpdate,
        G.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate,
      ],
    ]),
    class e {
      static {
        e.prototype.isMatrix2 = !0;
      }
      constructor(e, t, n, r) {
        ((this.elements = [1, 0, 0, 1]), e !== void 0 && this.set(e, t, n, r));
      }
      identity() {
        return (this.set(1, 0, 0, 1), this);
      }
      fromArray(e, t = 0) {
        for (let n = 0; n < 4; n++) this.elements[n] = e[n + t];
        return this;
      }
      set(e, t, n, r) {
        let i = this.elements;
        return ((i[0] = e), (i[2] = t), (i[1] = n), (i[3] = r), this);
      }
    },
    typeof __THREE_DEVTOOLS__ < `u` &&
      __THREE_DEVTOOLS__.dispatchEvent(
        new CustomEvent(`register`, { detail: { revision: `186` } }),
      ),
    typeof window < `u` &&
      (window.__THREE__
        ? y(`WARNING: Multiple instances of Three.js being imported.`)
        : (window.__THREE__ = `186`)));
  function _r(e, t = 1e-4) {
    t = Math.max(t, 2 ** -52);
    let n = {},
      r = e.getIndex(),
      i = e.getAttribute(`position`),
      a = r ? r.count : i.count,
      o = 0,
      s = Object.keys(e.attributes),
      c = {},
      l = {},
      u = [],
      d = [`getX`, `getY`, `getZ`, `getW`],
      f = [`setX`, `setY`, `setZ`, `setW`];
    for (let t = 0, n = s.length; t < n; t++) {
      let n = s[t],
        r = e.attributes[n];
      c[n] = new r.constructor(
        new r.array.constructor(r.count * r.itemSize),
        r.itemSize,
        r.normalized,
      );
      let i = e.morphAttributes[n];
      i &&
        (l[n] || (l[n] = []),
        i.forEach((e, t) => {
          let r = new e.array.constructor(e.count * e.itemSize);
          l[n][t] = new e.constructor(r, e.itemSize, e.normalized);
        }));
    }
    let p = t * 0.5,
      m = 10 ** Math.log10(1 / t),
      h = p * m;
    for (let t = 0; t < a; t++) {
      let i = r ? r.getX(t) : t,
        a = ``;
      for (let t = 0, n = s.length; t < n; t++) {
        let n = s[t],
          r = e.getAttribute(n),
          o = r.itemSize;
        for (let e = 0; e < o; e++) a += `${Math.trunc(r[d[e]](i) * m + h)},`;
      }
      if (a in n) u.push(n[a]);
      else {
        for (let t = 0, n = s.length; t < n; t++) {
          let n = s[t],
            r = e.getAttribute(n),
            a = e.morphAttributes[n],
            u = r.itemSize,
            p = c[n],
            m = l[n];
          for (let e = 0; e < u; e++) {
            let t = d[e],
              n = f[e];
            if ((p[n](o, r[t](i)), a))
              for (let e = 0, r = a.length; e < r; e++) m[e][n](o, a[e][t](i));
          }
        }
        ((n[a] = o), u.push(o), o++);
      }
    }
    let g = e.clone();
    for (let t in e.attributes) {
      let e = c[t];
      if (
        (g.setAttribute(
          t,
          new e.constructor(
            e.array.slice(0, o * e.itemSize),
            e.itemSize,
            e.normalized,
          ),
        ),
        t in l)
      )
        for (let e = 0; e < l[t].length; e++) {
          let n = l[t][e];
          g.morphAttributes[t][e] = new n.constructor(
            n.array.slice(0, o * n.itemSize),
            n.itemSize,
            n.normalized,
          );
        }
    }
    return (g.setIndex(u), g);
  }
  let vr = new M();
  function yr(e, t, n, r, i, a) {
    let o = (2 * Math.PI * i) / 4,
      s = Math.max(a - 2 * i, 0),
      c = Math.PI / 4;
    (vr.copy(t), (vr[r] = 0), vr.normalize());
    let l = (0.5 * o) / (o + s),
      u = 1 - vr.angleTo(e) / c;
    return Math.sign(vr[n]) === 1 ? u * l : s / (o + s) + l + l * (1 - u);
  }
  var br = class e extends xt {
    constructor(e = 1, t = 1, n = 1, r = 2, i = 0.1) {
      let a = r * 2 + 1;
      if (
        ((i = Math.min(e / 2, t / 2, n / 2, i)),
        super(1, 1, 1, a, a, a),
        (this.type = `RoundedBoxGeometry`),
        (this.parameters = {
          width: e,
          height: t,
          depth: n,
          segments: r,
          radius: i,
        }),
        a === 1)
      )
        return;
      let o = this.toNonIndexed();
      ((this.index = null),
        (this.attributes.position = o.attributes.position),
        (this.attributes.normal = o.attributes.normal),
        (this.attributes.uv = o.attributes.uv));
      let s = new M(),
        c = new M(),
        l = new M(e, t, n).divideScalar(2).subScalar(i),
        u = this.attributes.position.array,
        d = this.attributes.normal.array,
        f = this.attributes.uv.array,
        p = u.length / 6,
        m = new M(),
        h = 0.5 / a;
      for (let r = 0, a = 0; r < u.length; r += 3, a += 2)
        switch (
          (s.fromArray(u, r),
          c.copy(s),
          (c.x -= Math.sign(c.x) * h),
          (c.y -= Math.sign(c.y) * h),
          (c.z -= Math.sign(c.z) * h),
          c.normalize(),
          (u[r + 0] = l.x * Math.sign(s.x) + c.x * i),
          (u[r + 1] = l.y * Math.sign(s.y) + c.y * i),
          (u[r + 2] = l.z * Math.sign(s.z) + c.z * i),
          (d[r + 0] = c.x),
          (d[r + 1] = c.y),
          (d[r + 2] = c.z),
          Math.floor(r / p))
        ) {
          case 0:
            (m.set(1, 0, 0),
              (f[a + 0] = yr(m, c, `z`, `y`, i, n)),
              (f[a + 1] = 1 - yr(m, c, `y`, `z`, i, t)));
            break;
          case 1:
            (m.set(-1, 0, 0),
              (f[a + 0] = 1 - yr(m, c, `z`, `y`, i, n)),
              (f[a + 1] = 1 - yr(m, c, `y`, `z`, i, t)));
            break;
          case 2:
            (m.set(0, 1, 0),
              (f[a + 0] = 1 - yr(m, c, `x`, `z`, i, e)),
              (f[a + 1] = yr(m, c, `z`, `x`, i, n)));
            break;
          case 3:
            (m.set(0, -1, 0),
              (f[a + 0] = 1 - yr(m, c, `x`, `z`, i, e)),
              (f[a + 1] = 1 - yr(m, c, `z`, `x`, i, n)));
            break;
          case 4:
            (m.set(0, 0, 1),
              (f[a + 0] = 1 - yr(m, c, `x`, `y`, i, e)),
              (f[a + 1] = 1 - yr(m, c, `y`, `x`, i, t)));
            break;
          case 5:
            (m.set(0, 0, -1),
              (f[a + 0] = yr(m, c, `x`, `y`, i, e)),
              (f[a + 1] = 1 - yr(m, c, `y`, `x`, i, t)));
        }
    }
    static fromJSON(t) {
      return new e(t.width, t.height, t.depth, t.segments, t.radius);
    }
  };
  let K = {
      cloth: 0,
      metal: 1,
      stone: 2,
      skin: 3,
      crystal: 4,
      fur: 5,
      wood: 6,
      magma: 7,
      shell: 8,
      eye: 9,
      membrane: 10,
      leather: 11,
      bone: 12,
      gold: 13,
      marble: 14,
      amphibian: 15,
      feather: 16,
      scales: 17,
      iron: 18,
      moss: 19,
    },
    xr = {
      0: 0.9,
      1: 0.5,
      2: 0.86,
      3: 0.66,
      4: 0.22,
      5: 0.95,
      6: 0.85,
      7: 0.72,
      8: 0.4,
      9: 0.2,
      10: 0.72,
      11: 0.74,
      12: 0.58,
      13: 0.42,
      14: 0.55,
      15: 0.46,
      16: 0.9,
      17: 0.55,
      18: 0.62,
      19: 0.95,
    },
    Sr = {
      0: 0,
      1: 0.35,
      2: 0,
      3: 0,
      4: 0.02,
      5: 0,
      6: 0,
      7: 0,
      8: 0.04,
      9: 0,
      10: 0,
      11: 0,
      12: 0,
      13: 0.55,
      14: 0.02,
      15: 0,
      16: 0,
      17: 0.02,
      18: 0.28,
      19: 0,
    },
    Cr = {
      0: 0.7,
      1: 0.8,
      2: 0.55,
      3: 0.8,
      4: 0.9,
      5: 1.3,
      6: 1.3,
      7: 0.75,
      8: 0.9,
      9: 1,
      10: 0.45,
      11: 1.3,
      12: 1.4,
      13: 0.8,
      14: 0.5,
      15: 0.7,
      16: 1.1,
      17: 1.1,
      18: 0.8,
      19: 0.8,
    };
  function wr(e, t, n) {
    let r =
      Math.imul(e | 0, 374761393) ^
      Math.imul(t | 0, 668265263) ^
      Math.imul(n | 0, 1274126177);
    return (
      (r = Math.imul(r ^ (r >>> 13), 1103515245)),
      (r ^= r >>> 16),
      (r >>> 0) / 4294967296
    );
  }
  let Tr = (e) => e * e * (3 - 2 * e);
  function Er(e, t, n) {
    let r = Math.floor(e),
      i = Math.floor(t),
      a = Math.floor(n),
      o = Tr(e - r),
      s = Tr(t - i),
      c = Tr(n - a),
      l = wr(r, i, a),
      u = wr(r + 1, i, a),
      d = wr(r, i + 1, a),
      f = wr(r + 1, i + 1, a),
      p = wr(r, i, a + 1),
      m = wr(r + 1, i, a + 1),
      h = wr(r, i + 1, a + 1),
      g = wr(r + 1, i + 1, a + 1),
      _ = l + (u - l) * o,
      v = d + (f - d) * o,
      y = p + (m - p) * o,
      b = h + (g - h) * o,
      x = _ + (v - _) * s;
    return x + (y + (b - y) * s - x) * c;
  }
  function Dr(e, t, n, r = 3) {
    let i = 0.5,
      a = 0,
      o = 1,
      s = 0;
    for (let c = 0; c < r; c++)
      ((a += i * Er(e * o, t * o, n * o)), (s += i), (o *= 2.03), (i *= 0.5));
    return a / s;
  }
  function Or(e) {
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
  let kr = (e, t) => new A(e, t),
    Ar = (e, t, n, r) => Math.max(n, Math.min(t, Math.round(n + e * r))),
    q = {
      sphere: (e, t = e, n = e, r = 18, i = 12) => {
        let a = Math.max(e, t, n),
          o = a < 0.035,
          s = new Kn(1, Ar(a, r, o ? 7 : 10, 52), Ar(a, i, o ? 4 : 6, 34));
        return (s.scale(e, t, n), s);
      },
      dome: (e, t = e, n = e, r = 18, i = 8, a = 0.5) => {
        let o = Math.max(e, t, n),
          s = new Kn(
            1,
            Ar(o, r, 8, 30),
            Ar(o, i, 4, 16),
            0,
            Math.PI * 2,
            0,
            Math.PI * a,
          );
        return (s.scale(e, t, n), s);
      },
      box: (e, t, n, r = 0.02, i = 1) =>
        r < 0.012
          ? new xt(e, t, n)
          : new br(e, t, n, i, Math.min(r, Math.min(e, t, n) * 0.49)),
      cyl: (e, t, n, r = 14, i = !1, a = 1) =>
        new Ct(
          e,
          t,
          n,
          Math.max(e, t) < 0.03
            ? Math.min(r, 7)
            : Ar(Math.max(e, t), Math.max(r, 9), 9, 52),
          a,
          i,
        ),
      cone: (e, t, n = 10) => new wt(e, t, Ar(e, n, 5, 26)),
      torus: (e, t, n = 8, r = 28, i = Math.PI * 2) =>
        new qn(
          e,
          t,
          t < 0.02 ? 4 : Math.max(5, Math.round(n * 0.7)),
          Ar((e * i) / (Math.PI * 2), Math.max(r, 10), 10, 46),
          i,
        ),
      capsule: (e, t, n = 5, r = 12) => new St(e, t, n, r),
      lathe: (e, t = 18) =>
        new Wn(
          (e[0][1] > e[e.length - 1][1] ? [...e].reverse() : e).map(([e, t]) =>
            kr(Math.max(0, e), t),
          ),
          t,
        ),
      latheArc: (e, t = 24, n = 0, r = Math.PI * 2, i = !0) =>
        jr(e, t, n, r, i),
      ico: (e, t = 1) => new Un(e, t),
      octa: (e) => new Gn(e, 0),
      crystal: (e, t, n = 6, r = 0.3, i = 0.12) => Mr(e, t, n, r, i),
      gem: (e, t = e * 2, n = 8) => {
        let r = Mr(e, t, n, 0.34, 0.3);
        return (r.translate(0, -t / 2, 0), r);
      },
      extrude: (e, t, n = 0.015, r = 10, i = 2) => {
        let a = new Bn(
          e instanceof nn ? e : new nn(e.map(([e, t]) => kr(e, t))),
          {
            depth: t,
            bevelEnabled: n > 0,
            bevelThickness: n,
            bevelSize: n,
            bevelSegments: i,
            curveSegments: r,
            steps: 1,
          },
        );
        return (a.translate(0, 0, -t / 2), a);
      },
      plate: (e, t, n, r = 8, i = 3, a = 0.5) => {
        let o = new Kn(1, r, i, 0, Math.PI * 2, 0, Math.PI * a);
        return (o.scale(e, t, n), o);
      },
      shell: (
        e,
        t,
        n,
        {
          seg: r = 28,
          rings: i = 7,
          thick: a = 0.16,
          roll: o = 0.14,
          frac: s = 1,
        } = {},
      ) => {
        let c = (Math.PI / 2) * s,
          l = a,
          u = [];
        for (let e = 0; e <= i; e++) {
          let t = (e / i) * c;
          u.push([(1 - l) * Math.sin(t), (1 - l) * Math.cos(t) + l * 0.15]);
        }
        let d = Math.sin(c),
          f = Math.cos(c);
        u.push(
          [d * (1 - l * 0.45), f - o * 0.85],
          [d + o * 0.4, f - o * 0.5],
          [d + o * 0.42, f - o * 0.05],
        );
        for (let e = i; e >= 0; e--) {
          let t = (e / i) * c,
            n = e === i ? 1 + o * 0.18 : 1;
          u.push([Math.sin(t) * n, Math.cos(t)]);
        }
        let p = new Wn(
          u.map(([e, t]) => kr(Math.max(0, e), t)),
          r,
        );
        (p.deleteAttribute(`uv`), p.deleteAttribute(`normal`));
        let m = _r(p, 1e-5);
        return (m.computeVertexNormals(), m.scale(e, t, n), m);
      },
      latheInner: (e, t = 18) => {
        let n = new Wn(
            (e[0][1] > e[e.length - 1][1] ? [...e].reverse() : e).map(
              ([e, t]) => kr(Math.max(0, e), t),
            ),
            t,
          ),
          r = n.index.array;
        for (let e = 0; e < r.length; e += 3) {
          let t = r[e + 1];
          ((r[e + 1] = r[e + 2]), (r[e + 2] = t));
        }
        return (n.computeVertexNormals(), n);
      },
      tube: (
        e,
        t,
        {
          radial: n = 12,
          segs: r = 24,
          sx: i = 1,
          sy: a = 1,
          capStart: o = !0,
          capEnd: s = !0,
          up: c = [0, 1, 0],
        } = {},
      ) => Nr(e, t, n, r, i, a, o, s, c),
      rock: (e, t = 2, n = 0.25, r = 1.6, i = 1, a = [1, 1, 1]) => {
        let o = new Un(1, t);
        (o.deleteAttribute(`normal`), o.deleteAttribute(`uv`), (o = _r(o)));
        let s = o.attributes.position,
          c = new M();
        for (let t = 0; t < s.count; t++) {
          c.fromBufferAttribute(s, t).normalize();
          let o =
            e *
            (1 +
              n *
                (Dr(
                  c.x * r + i * 7.1,
                  c.y * r + i * 3.3,
                  c.z * r - i * 5.7,
                  3,
                ) *
                  2 -
                  1));
          s.setXYZ(t, c.x * o * a[0], c.y * o * a[1], c.z * o * a[2]);
        }
        return (o.computeVertexNormals(), o);
      },
      loft: (
        e,
        t,
        {
          segs: n = 24,
          up: r = [0, 1, 0],
          capStart: i = !0,
          capEnd: a = !0,
        } = {},
      ) => Fr(e, t, n, r, i, a),
      surface: (e, t = 16, n = 8, r = 0.03) => Lr(e, t, n, r),
      scute: (e, t, n, { cols: r = 10, rows: i = 12, thick: a = 0.035 } = {}) =>
        Ir(
          Lr(
            (r, i) => {
              let a = 2 * r - 1,
                o = Math.sin(Math.PI * Math.min(1, 0.06 + i * 1)) ** 0.75,
                s = (1 - Math.abs(a)) ** 1.6;
              return [
                (0.35 - i) * e,
                n *
                  s *
                  (0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, i * 1.05))) -
                  0.25 * n * a * a,
                a * t * 0.5 * o,
              ];
            },
            r,
            i,
            a,
          ),
        ),
      membrane: (e, t, n = 4, r = 0.02, i = null, a = 0) =>
        Rr(e, t, n, r, i, a),
      feather: (e, t, n = 0.02, r = 0.15) => {
        let i = [
            [0, -t * 0.18],
            [e * 0.2, -t * 0.46],
            [e * 0.62, -t * 0.5],
            [e * 0.9, -t * 0.3],
            [e, 0],
            [e * 0.9, t * 0.3],
            [e * 0.62, t * 0.5],
            [e * 0.2, t * 0.46],
            [0, t * 0.18],
          ],
          a = new nn();
        a.moveTo(i[0][0], i[0][1]);
        for (let e = 1; e < i.length; e++) {
          let [n, r] = i[e],
            [o, s] = i[e - 1];
          a.quadraticCurveTo(
            (o + n) / 2 + (n - o) * 0.1,
            (s + r) / 2 + (r > 0 ? 1 : -1) * t * 0.06,
            n,
            r,
          );
        }
        let o = new Bn(a, {
          depth: n,
          bevelEnabled: !0,
          bevelThickness: n * 0.5,
          bevelSize: n * 0.6,
          bevelSegments: 1,
          curveSegments: 4,
          steps: 1,
        });
        o.translate(0, 0, -n / 2);
        let s = o.attributes.position;
        for (let n = 0; n < s.count; n++) {
          let i = s.getX(n),
            a = s.getY(n);
          s.setZ(
            n,
            s.getZ(n) +
              (a / (t * 0.5)) ** 2 * r * t -
              (i / e) ** 2 * r * e * 0.25,
          );
        }
        return (o.computeVertexNormals(), o);
      },
    };
  function jr(e, t, n, r, i) {
    let a = (e[0][1] > e[e.length - 1][1] ? [...e].reverse() : e).map(
        ([e, t]) => [Math.max(0, e), t],
      ),
      o = new Wn(
        a.map(([e, t]) => kr(e, t)),
        Math.max(3, t),
        n,
        r,
      );
    if (!i || r >= Math.PI * 2 - 1e-4) return o;
    let s = [o],
      c = a[0][0] > 1e-4 && a[a.length - 1][0] > 1e-4,
      l = 0,
      u = 0;
    if (c) {
      for (let [e, t] of a) ((l += e), (u += t));
      ((l /= a.length), (u /= a.length));
    } else u = a[0][1];
    let d = c ? a.length : a.length - 1;
    for (let [e, t] of [
      [n, -1],
      [n + r, 1],
    ]) {
      let n = Math.sin(e),
        r = Math.cos(e),
        i = [l * n, u, l * r],
        o = [];
      for (let [e, t] of a) i.push(e * n, t, e * r);
      for (let e = 0; e < d; e++) o.push(0, 1 + e, 1 + ((e + 1) % a.length));
      let c = t * Math.cos(e),
        f = -t * Math.sin(e),
        p = o[0] * 3,
        m = o[1] * 3,
        h = o[2] * 3,
        g = i[m] - i[p],
        _ = i[m + 1] - i[p + 1],
        v = i[m + 2] - i[p + 2],
        y = i[h] - i[p],
        b = i[h + 1] - i[p + 1];
      if ((_ * (i[h + 2] - i[p + 2]) - v * b) * c + (g * b - _ * y) * f < 0)
        for (let e = 0; e < o.length; e += 3) {
          let t = o[e + 1];
          ((o[e + 1] = o[e + 2]), (o[e + 2] = t));
        }
      let x = new bt();
      (x.setAttribute(`position`, new H(i, 3)),
        x.setIndex(o),
        x.computeVertexNormals(),
        s.push(x));
    }
    return zr(s);
  }
  function Mr(e, t, n, r, i) {
    let a = Math.max(8, Math.min(12, n < 8 ? n + 3 : n)),
      o = t * i,
      s = t * (1 - r),
      c = Math.min(0.055, (s - o) * 0.16),
      l = Math.min(e * 0.3, Math.max(0.012, e * 0.12)),
      u = [
        [0, 0, 0],
        [e * 0.46, o * 0.34, 0],
        [e * 0.88, o * 0.8, 0],
        [e, o * 1.06, 1],
        [e, o * 1.06 + c, 0],
        [e * 0.83, s - c, 0],
        [e * 0.78, s, 1],
        [e * 0.63, s + t * r * 0.18, 0],
        [e * 0.55, s + t * r * 0.18 + c, 0],
        [l * 1.22, t - (t - s) * 0.12, 1],
        [l, t - (t - s) * 0.04, 0],
        [0, t, 0],
      ],
      d = u.length,
      f = [],
      p = [],
      m = [],
      h = [];
    for (let t = 0; t < d; t++) {
      let [n, r, i] = u[t];
      for (let t = 0; t <= a; t++) {
        let o = (t / a) * Math.PI * 2;
        (f.push(Math.cos(o) * n, r, Math.sin(o) * n), p.push(i), m.push(n / e));
      }
    }
    let g = a + 1;
    for (let e = 0; e < d - 1; e++)
      for (let t = 0; t < a; t++) {
        let n = e * g + t,
          r = n + 1,
          i = n + g,
          a = i + 1;
        (u[e][0] > 1e-6 && h.push(n, i, r),
          u[e + 1][0] > 1e-6 && h.push(r, i, a));
      }
    let _ = new bt();
    return (
      _.setAttribute(`position`, new H(f, 3)),
      _.setAttribute(`gemE`, new H(p, 1)),
      _.setAttribute(`gemT`, new H(m, 1)),
      _.setIndex(h),
      _.computeVertexNormals(),
      _
    );
  }
  function Nr(e, t, n, r, i, a, o, s, c) {
    let l = new Ft(
        e.map((e) => new M(e[0], e[1], e[2])),
        !1,
        `centripetal`,
      ),
      u = [],
      d = [];
    for (let e = 0; e <= r; e++) {
      let t = e / r;
      (u.push(l.getPointAt(t)), d.push(l.getTangentAt(t).normalize()));
    }
    let f = new M(c[0], c[1], c[2]);
    (Math.abs(d[0].dot(f)) > 0.95 && f.set(1, 0, 0),
      f.sub(d[0].clone().multiplyScalar(d[0].dot(f))).normalize());
    let p = [],
      m = new M();
    for (let e = 0; e <= r; e++) {
      if (e > 0) {
        m.crossVectors(d[e - 1], d[e]);
        let t = m.length();
        (t > 1e-6 &&
          (m.divideScalar(t),
          f.applyAxisAngle(
            m,
            Math.acos(Math.max(-1, Math.min(1, d[e - 1].dot(d[e])))),
          )),
          f.sub(d[e].clone().multiplyScalar(d[e].dot(f))).normalize());
      }
      p.push([f.clone(), new M().crossVectors(d[e], f).normalize()]);
    }
    let h = [],
      g = [],
      _ = [],
      v = typeof t == `function` ? t : () => t;
    for (let e = 0; e <= r; e++) {
      let t = e / r,
        o = v(t),
        [s, c] = p[e];
      for (let r = 0; r < n; r++) {
        let l = (r / n) * Math.PI * 2,
          d = Math.cos(l) * o * i,
          f = Math.sin(l) * o * a;
        (h.push(
          u[e].x + s.x * d + c.x * f,
          u[e].y + s.y * d + c.y * f,
          u[e].z + s.z * d + c.z * f,
        ),
          g.push(t));
      }
    }
    for (let e = 0; e < r; e++)
      for (let t = 0; t < n; t++) {
        let r = e * n + t,
          i = e * n + ((t + 1) % n),
          a = r + n,
          o = i + n;
        _.push(r, i, a, i, o, a);
      }
    let y = new bt();
    (y.setAttribute(`position`, new H(h, 3)),
      y.setAttribute(`tParam`, new H(g, 1)),
      y.setIndex(_),
      y.computeVertexNormals());
    let b = [y],
      x = (e, t) => {
        let o = e / r,
          s = v(o);
        if (s < 1e-4) return;
        let [c, l] = p[e],
          d = [],
          f = [],
          m = [];
        (d.push(u[e].x, u[e].y, u[e].z), f.push(o));
        for (let t = 0; t < n; t++) {
          let r = (t / n) * Math.PI * 2,
            p = Math.cos(r) * s * i,
            m = Math.sin(r) * s * a;
          (d.push(
            u[e].x + c.x * p + l.x * m,
            u[e].y + c.y * p + l.y * m,
            u[e].z + c.z * p + l.z * m,
          ),
            f.push(o));
        }
        for (let e = 0; e < n; e++) {
          let r = 1 + e,
            i = 1 + ((e + 1) % n);
          t ? m.push(0, i, r) : m.push(0, r, i);
        }
        let h = new bt();
        (h.setAttribute(`position`, new H(d, 3)),
          h.setAttribute(`tParam`, new H(f, 1)),
          h.setIndex(m),
          h.computeVertexNormals(),
          b.push(h));
      };
    return (o && x(0, !0), s && x(r, !1), b.length === 1 ? y : zr(b));
  }
  function Pr(e, t, n) {
    let r = new Ft(
        e.map((e) => new M(e[0], e[1], e[2])),
        !1,
        `centripetal`,
      ),
      i = [],
      a = [];
    for (let e = 0; e <= t; e++) {
      let n = e / t;
      (i.push(r.getPointAt(n)), a.push(r.getTangentAt(n).normalize()));
    }
    let o = new M(n[0], n[1], n[2]);
    (Math.abs(a[0].dot(o)) > 0.95 && o.set(1, 0, 0),
      o.sub(a[0].clone().multiplyScalar(a[0].dot(o))).normalize());
    let s = [],
      c = new M();
    for (let e = 0; e <= t; e++) {
      if (e > 0) {
        c.crossVectors(a[e - 1], a[e]);
        let t = c.length();
        (t > 1e-6 &&
          (c.divideScalar(t),
          o.applyAxisAngle(
            c,
            Math.acos(Math.max(-1, Math.min(1, a[e - 1].dot(a[e])))),
          )),
          o.sub(a[e].clone().multiplyScalar(a[e].dot(o))).normalize());
      }
      s.push([o.clone(), new M().crossVectors(a[e], o).normalize()]);
    }
    return { P: i, T: a, frames: s };
  }
  function Fr(e, t, n, r, i, a) {
    let { P: o, frames: s } = Pr(e, n, r),
      c = [],
      l = [],
      u = [],
      d = 0;
    for (let e = 0; e <= n; e++) {
      let r = e / n,
        i = t(r);
      d = i.length;
      let [a, u] = s[e];
      for (let [t, n] of i)
        (c.push(
          o[e].x + a.x * t + u.x * n,
          o[e].y + a.y * t + u.y * n,
          o[e].z + a.z * t + u.z * n,
        ),
          l.push(r));
    }
    for (let e = 0; e < n; e++)
      for (let t = 0; t < d; t++) {
        let n = e * d + t,
          r = e * d + ((t + 1) % d),
          i = n + d,
          a = r + d;
        u.push(n, i, r, r, i, a);
      }
    let f = (e, t) => {
      let r = c.length / 3,
        i = 0,
        a = 0,
        o = 0;
      for (let t = 0; t < d; t++)
        ((i += c[(e * d + t) * 3]),
          (a += c[(e * d + t) * 3 + 1]),
          (o += c[(e * d + t) * 3 + 2]));
      (c.push(i / d, a / d, o / d), l.push(e / n));
      for (let n = 0; n < d; n++) {
        let i = e * d + n,
          a = e * d + ((n + 1) % d);
        t ? u.push(r, i, a) : u.push(r, a, i);
      }
    };
    (i && f(0, !0), a && f(n, !1));
    let p = new bt();
    return (
      p.setAttribute(`position`, new H(c, 3)),
      p.setAttribute(`tParam`, new H(l, 1)),
      p.setIndex(u),
      p.computeVertexNormals(),
      p
    );
  }
  function Ir(e) {
    return (e.deleteAttribute(`tParam`), e.deleteAttribute(`rowT`), e);
  }
  function Lr(e, t, n, r) {
    let i = [],
      a = [],
      o = [];
    for (let r = 0; r <= n; r++)
      for (let s = 0; s <= t; s++) {
        let c = s / t,
          l = r / n,
          u = e(c, l);
        (i.push(u[0], u[1], u[2]), a.push(c), o.push(l));
      }
    let s = t + 1,
      c = [];
    for (let e = 0; e < n; e++)
      for (let n = 0; n < t; n++) {
        let t = e * s + n,
          r = t + 1,
          i = t + s,
          a = i + 1;
        c.push(t, r, i, r, a, i);
      }
    let l = new bt();
    (l.setAttribute(`position`, new H(i, 3)),
      l.setIndex(c),
      l.computeVertexNormals());
    let u = l.attributes.normal,
      d = i.length / 3,
      f = [...i],
      p = [...a],
      m = [...o];
    for (let e = 0; e < d; e++)
      (f.push(
        i[e * 3] - u.getX(e) * r,
        i[e * 3 + 1] - u.getY(e) * r,
        i[e * 3 + 2] - u.getZ(e) * r,
      ),
        p.push(a[e]),
        m.push(o[e]));
    let h = [...c];
    for (let e = 0; e < c.length; e += 3)
      h.push(c[e] + d, c[e + 2] + d, c[e + 1] + d);
    let g = [];
    for (let e = 0; e < t; e++) g.push([e, e + 1]);
    for (let e = 0; e < n; e++) g.push([e * s + t, (e + 1) * s + t]);
    for (let e = t; e > 0; e--) g.push([n * s + e, n * s + e - 1]);
    for (let e = n; e > 0; e--) g.push([e * s, (e - 1) * s]);
    for (let [e, t] of g) h.push(e, e + d, t, t, e + d, t + d);
    let _ = new bt();
    return (
      _.setAttribute(`position`, new H(f, 3)),
      _.setAttribute(`tParam`, new H(p, 1)),
      _.setAttribute(`rowT`, new H(m, 1)),
      _.setIndex(h),
      _.computeVertexNormals(),
      _
    );
  }
  function Rr(e, t, n, r, i, a) {
    let o = e.length,
      s = [],
      c = [],
      l = [],
      u = [];
    for (let r = 0; r <= n; r++) {
      let c = r / n;
      for (let n = 0; n < o; n++) {
        let r = e[n],
          d = t[n],
          f = r[0] + (d[0] - r[0]) * c,
          p = r[1] + (d[1] - r[1]) * c,
          m = r[2] + (d[2] - r[2]) * c;
        if (i && a) {
          let e = (n / (o - 1)) ** 3 * Math.sin(c * Math.PI) * a;
          ((f += (i[0] - f) * e), (p += (i[1] - p) * e), (m += (i[2] - m) * e));
        }
        (s.push(f, p, m), l.push(n / (o - 1)), u.push(c));
      }
    }
    for (let e = 0; e < n; e++)
      for (let t = 0; t < o - 1; t++) {
        let n = e * o + t,
          r = n + 1,
          i = n + o,
          a = i + 1;
        c.push(n, i, r, r, i, a);
      }
    let d = new bt();
    (d.setAttribute(`position`, new H(s, 3)),
      d.setAttribute(`tParam`, new H(l, 1)),
      d.setAttribute(`rowT`, new H(u, 1)),
      d.setIndex(c),
      d.computeVertexNormals());
    let f = d.clone(),
      p = d.attributes.normal,
      m = f.attributes.position,
      h = f.attributes.normal;
    for (let e = 0; e < m.count; e++)
      (m.setXYZ(
        e,
        m.getX(e) - p.getX(e) * r,
        m.getY(e) - p.getY(e) * r,
        m.getZ(e) - p.getZ(e) * r,
      ),
        h.setXYZ(e, -p.getX(e), -p.getY(e), -p.getZ(e)));
    let g = f.index.array;
    for (let e = 0; e < g.length; e += 3) {
      let t = g[e + 1];
      ((g[e + 1] = g[e + 2]), (g[e + 2] = t));
    }
    return zr([d, f]);
  }
  function zr(e) {
    let t = [],
      n = [],
      r = [],
      i = [],
      a = [],
      o = 0,
      s = e.some((e) => e.attributes.tParam),
      c = e.some((e) => e.attributes.rowT);
    for (let l of e) {
      if (!l.index) {
        l = l.clone();
        let e = [];
        for (let t = 0; t < l.attributes.position.count; t++) e.push(t);
        l.setIndex(e);
      }
      l.attributes.normal || l.computeVertexNormals();
      let e = l.attributes.position,
        u = l.attributes.normal,
        d = l.attributes.tParam,
        f = l.attributes.rowT;
      for (let a = 0; a < e.count; a++)
        (t.push(e.getX(a), e.getY(a), e.getZ(a)),
          n.push(u.getX(a), u.getY(a), u.getZ(a)),
          s && r.push(d ? d.getX(a) : 0),
          c && i.push(f ? f.getX(a) : 0));
      let p = l.index.array;
      for (let e = 0; e < p.length; e++) a.push(p[e] + o);
      o += e.count;
    }
    let l = new bt();
    return (
      l.setAttribute(`position`, new H(t, 3)),
      l.setAttribute(`normal`, new H(n, 3)),
      s && l.setAttribute(`tParam`, new H(r, 1)),
      c && l.setAttribute(`rowT`, new H(i, 1)),
      l.setIndex(a),
      l
    );
  }
  let Br = new He();
  function Vr(e) {
    return (Br.set(e), [Br.r, Br.g, Br.b]);
  }
  let Hr = new ue(),
    Ur = new j(),
    Wr = new be(),
    Gr = new M(),
    Kr = new M(),
    qr = new M(),
    Jr = new M();
  function Yr(e, t, n) {
    let r = 1 / 0,
      i = 1 / 0,
      a = 1 / 0,
      o = -1 / 0,
      s = -1 / 0,
      c = -1 / 0;
    for (let l = t; l < n; l++) {
      let t = e[l * 3],
        n = e[l * 3 + 1],
        u = e[l * 3 + 2];
      (t < r && (r = t),
        t > o && (o = t),
        n < i && (i = n),
        n > s && (s = n),
        u < a && (a = u),
        u > c && (c = u));
    }
    return Math.min(o - r, Math.min(s - i, c - a));
  }
  var Xr = class {
    constructor(e, { seed: t = 1, texScale: n = 2.5 } = {}) {
      ((this.bones = e.map(([e, t, n], r) => ({
        name: e,
        parent: t,
        pivot: n,
        index: r,
      }))),
        (this.index = {}),
        this.bones.forEach((e) => {
          this.index[e.name] = e.index;
        }));
      for (let e of this.bones)
        e.parentIndex = e.parent == null ? -1 : this.index[e.parent];
      ((this.P = []),
        (this.N = []),
        (this.C1 = []),
        (this.C2 = []),
        (this.M = []),
        (this.S = []),
        (this.I = []),
        (this.SU = []),
        (this.K2 = []),
        (this.meta = []),
        (this.count = 0),
        (this.rand = Or(t)),
        (this.parts = []),
        (this.bodies = []),
        (this.texScale = n),
        (this.frameM = new ue()),
        (this.stack = []));
    }
    frame(e = [0, 0, 0], t = [0, 0, 0], n = 1, r, i = `XYZ`) {
      let a = typeof n == `number` ? [n, n, n] : n,
        o = new ue().compose(
          new M(...e),
          new j().setFromEuler(new be(t[0], t[1], t[2], i)),
          new M(...a),
        );
      (this.stack.push(this.frameM.clone()), this.frameM.multiply(o));
      try {
        r(this);
      } finally {
        this.frameM.copy(this.stack.pop());
      }
      return this;
    }
    bone(e) {
      let t = this.index[e];
      if (t === void 0) throw Error(`unknown bone ` + e);
      return t;
    }
    pivot(e) {
      return this.bones[this.bone(e)].pivot;
    }
    chainSkin(e, { tail: t = 0.35, blend: n = 0.25 } = {}) {
      let r = e.map((e) => this.pivot(e)),
        i = e.length;
      return (a, o, s) => {
        if (i === 1) return [e[0]];
        let c = 0,
          l = 1 / 0,
          u = 0,
          d = 0;
        for (let e = 0; e < i - 1; e++) {
          let t = r[e],
            n = r[e + 1],
            i = n[0] - t[0],
            f = n[1] - t[1],
            p = n[2] - t[2],
            m = i * i + f * f + p * p || 1e-6,
            h = ((a - t[0]) * i + (o - t[1]) * f + (s - t[2]) * p) / m,
            g = Math.max(0, Math.min(1, h)),
            _ = t[0] + i * g - a,
            v = t[1] + f * g - o,
            y = t[2] + p * g - s,
            b = _ * _ + v * v + y * y;
          b < l - 1e-9 && ((l = b), (c = e), (u = g), (d = h));
        }
        let f = c;
        return f === i - 2 && d > 1
          ? [
              e[i - 2],
              e[i - 1],
              Math.min(1, 0.5 + 0.5 * Tr(Math.min(1, (d - 1) / t))),
            ]
          : u > 1 - n
            ? [e[f], e[f + 1], 0.5 * Tr((u - (1 - n)) / n)]
            : u < n && f > 0
              ? [e[f], e[f - 1], 0.5 * (1 - Tr(u / n))]
              : [e[f], e[f], 0];
      };
    }
    add(e, t = {}) {
      return (this.#e(e, t, !1), t.mirror && this.#e(e, t, !0), this);
    }
    #e(e, t, n) {
      let r = e.clone();
      for (let e of Object.keys(r.attributes))
        e !== `position` &&
          e !== `normal` &&
          e !== `tParam` &&
          e !== `rowT` &&
          e !== `gemE` &&
          e !== `gemT` &&
          r.deleteAttribute(e);
      if (
        (r.attributes.normal || r.computeVertexNormals(),
        t.localGrad || (t.tip && !r.attributes.tParam))
      ) {
        let e = r.attributes.position,
          n = t.tipAxis === `x` ? 0 : t.tipAxis === `z` ? 2 : 1,
          i = (t) => e.getComponent(t, n),
          a = 1 / 0,
          o = -1 / 0;
        for (let t = 0; t < e.count; t++) {
          let e = i(t);
          (e < a && (a = e), e > o && (o = e));
        }
        let s = new Float32Array(e.count);
        for (let t = 0; t < e.count; t++)
          s[t] = o > a ? (i(t) - a) / (o - a) : 1;
        r.setAttribute(`localT`, new st(s, 1));
      }
      let i =
          t.scale === void 0
            ? [1, 1, 1]
            : typeof t.scale == `number`
              ? [t.scale, t.scale, t.scale]
              : t.scale,
        a = t.rot || [0, 0, 0],
        o = t.at || [0, 0, 0];
      if (
        (t.quat
          ? Ur.set(t.quat[0], t.quat[1], t.quat[2], t.quat[3])
          : Ur.setFromEuler(Wr.set(a[0], a[1], a[2], t.order || `XYZ`)),
        Hr.compose(Gr.set(o[0], o[1], o[2]), Ur, Kr.set(i[0], i[1], i[2])),
        Hr.premultiply(this.frameM),
        r.applyMatrix4(Hr),
        t.flat && (r.index && (r = r.toNonIndexed()), r.computeVertexNormals()),
        t.deform)
      ) {
        let e = r.attributes.position,
          n = r.attributes.normal;
        for (let r = 0; r < e.count; r++)
          (qr.fromBufferAttribute(e, r),
            Jr.fromBufferAttribute(n, r),
            t.deform(qr, Jr),
            e.setXYZ(r, qr.x, qr.y, qr.z));
        (t.flat ||
          (r.index &&
            (r.attributes.tParam ||
              r.attributes.localT ||
              (r.deleteAttribute(`normal`), (r = _r(r, 1e-4))))),
          r.computeVertexNormals());
      }
      if (n) {
        let e = r.attributes.position,
          t = r.attributes.normal;
        for (let n = 0; n < e.count; n++)
          (e.setZ(n, -e.getZ(n)), t.setZ(n, -t.getZ(n)));
        if (r.index) {
          let e = r.index.array;
          for (let t = 0; t < e.length; t += 3) {
            let n = e[t + 1];
            ((e[t + 1] = e[t + 2]), (e[t + 2] = n));
          }
        } else {
          let n = [`tParam`, `rowT`, `localT`, `gemE`, `gemT`]
            .map((e) => r.attributes[e])
            .filter(Boolean);
          for (let n = 0; n < e.count; n += 3)
            for (let r of [e, t]) {
              let e = r.getX(n + 1),
                t = r.getY(n + 1),
                i = r.getZ(n + 1);
              (r.setXYZ(n + 1, r.getX(n + 2), r.getY(n + 2), r.getZ(n + 2)),
                r.setXYZ(n + 2, e, t, i));
            }
          for (let t of n)
            for (let n = 0; n < e.count; n += 3) {
              let e = t.getX(n + 1);
              (t.setX(n + 1, t.getX(n + 2)), t.setX(n + 2, e));
            }
        }
      }
      let s = (e) => (n ? Zr(e) : e),
        c = t.color === void 0 ? `#ff00ff` : t.color,
        l = Vr(Array.isArray(c) ? c[0] : c),
        u = Vr(Array.isArray(c) ? c[1] : c),
        d = t.tip
          ? [
              Vr(Array.isArray(t.tip) ? t.tip[0] : t.tip),
              Vr(Array.isArray(t.tip) ? t.tip[1] : t.tip),
            ]
          : null,
        f = t.tipFrom ?? 0.15,
        p = t.tipSoft ?? 0,
        m = Array.isArray(t.kind)
          ? t.kind
          : [t.kind ?? K.cloth, t.kind ?? K.cloth],
        h = m[0],
        g = t.rough ?? xr[h],
        _ = t.metal ?? Sr[h],
        v = t.emit ?? 0,
        y = m[0] + m[1] * 32,
        b = t.vein ?? 0,
        x = t.tex ?? this.texScale * (Cr[h] ?? 1),
        S = t.team || 0,
        C = r.attributes.position,
        w = r.attributes.normal,
        T = r.attributes.tParam,
        E = r.attributes.rowT,
        D = r.attributes.localT,
        O = r.attributes.gemE,
        k = r.attributes.gemT,
        A = 1 / 0,
        j = -1 / 0;
      for (let e = 0; e < C.count; e++) {
        let t = C.getY(e);
        (t < A && (A = t), t > j && (j = t));
      }
      let M = t.grad || (v > 0.5 ? [1, 1] : [0.8, 1.06]),
        ee = 1 + (this.rand() - 0.5) * (t.jitter ?? 0.06),
        N = null;
      t.chain && (N = t.chain.map((e) => this.bone(s(e))));
      let P = t.bone ? this.bone(s(t.bone)) : 0,
        F = this.count;
      for (let e = 0; e < C.count; e++) {
        let r = C.getX(e),
          i = C.getY(e),
          a = C.getZ(e);
        (this.P.push(r, i, a), this.N.push(w.getX(e), w.getY(e), w.getZ(e)));
        let o = t.localGrad && D ? D.getX(e) : j > A ? (i - A) / (j - A) : 1,
          c = (M[0] + (M[1] - M[0]) * o) * ee,
          m = l[0],
          h = l[1],
          F = l[2],
          I = u[0],
          L = u[1],
          te = u[2];
        if (d) {
          let t = T ? T.getX(e) : D ? D.getX(e) : o,
            n = Tr(Math.max(0, Math.min(1, (t - f) / (1 - f))));
          ((m += (d[0][0] - m) * n),
            (h += (d[0][1] - h) * n),
            (F += (d[0][2] - F) * n),
            (I += (d[1][0] - I) * n),
            (L += (d[1][1] - L) * n),
            (te += (d[1][2] - te) * n));
        }
        if (p > 0 && (T || D)) {
          let t = T ? T.getX(e) : D.getX(e),
            n = Tr(Math.max(0, Math.min(1, (t - 0.75) / 0.25))) * p;
          n > 0 &&
            ((m += (l[0] - m) * n),
            (h += (l[1] - h) * n),
            (F += (l[2] - F) * n),
            (I += (u[0] - I) * n),
            (L += (u[1] - L) * n),
            (te += (u[2] - te) * n));
        }
        (this.C1.push(m * c, h * c, F * c),
          this.C2.push(I * c, L * c, te * c),
          this.M.push(g, _, v, y));
        let R = P,
          ne = P,
          re = 0;
        if (N) {
          let t = T ? T.getX(e) : 0,
            n = N.length,
            r = Math.max(0, Math.min(n - 1, t * n - 0.5)),
            i = Math.min(n - 2, Math.floor(r));
          n === 1
            ? (R = ne = N[0])
            : ((R = N[Math.max(0, i)]),
              (ne = N[Math.max(0, i) + 1]),
              (re = Tr(Math.max(0, Math.min(1, r - Math.max(0, i))))));
        } else if (t.pair && E)
          ((R = this.bone(s(t.pair[0]))),
            (ne = this.bone(s(t.pair[1]))),
            (re = Tr(E.getX(e))));
        else if (t.skin) {
          let e = t.skin(r, i, n ? -a : a);
          ((R = this.bone(s(e[0]))),
            (ne = this.bone(s(e[1] ?? e[0]))),
            (re = e[2] ?? 0));
        }
        (this.S.push(R, ne, re, S),
          O
            ? this.SU.push(1, O.getX(e), k ? k.getX(e) : 0, x)
            : this.SU.push(1, 0, b, x),
          this.K2.push(t.kind2 ?? 0, t.w2 ?? 0, t.lod ?? 0),
          this.meta.push(v > 0.5 || t.ao === !1 ? 0 : 1));
      }
      let I = [];
      if (r.index) {
        let e = r.index.array;
        for (let t = 0; t < e.length; t++) I.push(e[t] + F);
      } else for (let e = 0; e < C.count; e++) I.push(F + e);
      for (let e = 0; e < I.length; e++) this.I.push(I[e]);
      (this.parts.push({
        start: F,
        end: F + C.count,
        i0: this.I.length - I.length,
        i1: this.I.length,
        occluder: t.occluder !== !1 && v < 1.5,
        recv: t.recvAO !== !1,
        conv: t.conv !== !1 && !O,
        aoStrength: t.aoStrength ?? 1,
        team: S,
        keep: t.keep,
        thin: Yr(this.P, F, F + C.count),
      }),
        (this.count += C.count));
    }
    addRaw(
      {
        pos: e,
        nrm: t,
        c1: n,
        c2: r,
        mat: i,
        skin: a,
        surf: o,
        k2: s,
        index: c,
      },
      { occluder: l = !1, heightAO: u = !0, convScale: d = 1 } = {},
    ) {
      let f = this.count,
        p = e.length / 3;
      for (let i = 0; i < e.length; i++)
        (this.P.push(e[i]),
          this.N.push(t[i]),
          this.C1.push(n[i]),
          this.C2.push(r[i]));
      for (let e = 0; e < p * 4; e++)
        (this.M.push(i[e]), this.S.push(a[e]), this.SU.push(o[e]));
      for (let e = 0; e < p * 3; e++) this.K2.push(s[e]);
      for (let e = 0; e < p; e++) this.meta.push(+!!u);
      let m = this.I.length;
      for (let e = 0; e < c.length; e++) this.I.push(c[e] + f);
      (this.parts.push({
        start: f,
        end: f + p,
        i0: m,
        i1: this.I.length,
        occluder: l,
        recv: !0,
        conv: !0,
        convScale: d,
        aoStrength: 1,
        body: !0,
        team: 0,
        keep: 2,
        thin: 1e9,
      }),
        (this.count += p));
    }
    addBodyOccluder(e) {
      this.bodies.push(e);
    }
    build({ aoFloor: e = 0.62, aoHeight: t = null, contactAO: n = 1 } = {}) {
      let r = 0;
      for (let e = 1; e < this.P.length; e += 3) r = Math.max(r, this.P[e]);
      let i = t ?? r * 0.42;
      for (let t = 0; t < this.count; t++) {
        if (!this.meta[t]) continue;
        let n = this.P[t * 3 + 1],
          r = this.N[t * 3 + 1],
          a =
            (e + (1 - e) * Tr(Math.max(0, Math.min(1, n / i)))) *
            (0.93 + 0.1 * Math.max(0, r));
        for (let e of [this.C1, this.C2])
          ((e[t * 3] *= a), (e[t * 3 + 1] *= a), (e[t * 3 + 2] *= a));
      }
      (this.#t(), n > 0 && this.#n(n));
      let a = new bt();
      (a.setAttribute(`position`, new H(this.P, 3)),
        a.setAttribute(`normal`, new H(this.N, 3)),
        a.setAttribute(`aColor1`, new H(this.C1, 3)),
        a.setAttribute(`aColor2`, new H(this.C2, 3)),
        a.setAttribute(`aMat`, new H(this.M, 4)),
        a.setAttribute(`aSkin`, new H(this.S, 4)),
        a.setAttribute(`aSurf`, new H(this.SU, 4)),
        a.setAttribute(`aK2`, new H(this.K2, 3)));
      let o = this.count > 65535;
      (a.setIndex(o ? new lt(this.I, 1) : new ct(this.I, 1)),
        (a.boundingSphere = new pt(new M(), 1e5)));
      let s = r * 0.025;
      for (let e of this.parts)
        e.keep = Math.min(e.keep ?? 2, e.thin < s ? 0 : 2);
      let c = [null],
        l = [this.I.length / 3];
      for (let e = 1; e <= 2; e++) {
        let t = 0;
        for (let n of this.parts) n.keep >= e && (t += n.i1 - n.i0);
        let n = o ? new Uint32Array(t) : new Uint16Array(t),
          r = 0;
        for (let t of this.parts)
          if (t.keep >= e) for (let e = t.i0; e < t.i1; e++) n[r++] = this.I[e];
        (c.push(n), l.push(t / 3));
      }
      return {
        geometry: a,
        lodIndex: c,
        lodTris: l,
        bones: this.bones.map((e) => ({
          name: e.name,
          parent: e.parentIndex,
          pivot: e.pivot,
        })),
        boneIndex: this.index,
        height: r,
        triangles: this.I.length / 3,
      };
    }
    #t() {
      let e = this.P,
        t = this.N,
        n = this.I,
        r = this.SU;
      for (let i of this.parts) {
        if (!i.conv) continue;
        let a = i.end - i.start;
        if (a < 3) continue;
        let o = new Int32Array(a),
          s = /* @__PURE__ */ new Map(),
          c = 0,
          l = [],
          u = [];
        for (let n = 0; n < a; n++) {
          let r = i.start + n,
            a = Math.round(e[r * 3] * 1e3) + 2e4,
            d = Math.round(e[r * 3 + 1] * 1e3) + 2e4,
            f = Math.round(e[r * 3 + 2] * 1e3) + 2e4,
            p = a * 16e8 + d * 4e4 + f,
            m = s.get(p);
          (m === void 0 &&
            ((m = c++),
            s.set(p, m),
            l.push(0, 0, 0),
            u.push(e[r * 3], e[r * 3 + 1], e[r * 3 + 2])),
            (o[n] = m),
            (l[m * 3] += t[r * 3]),
            (l[m * 3 + 1] += t[r * 3 + 1]),
            (l[m * 3 + 2] += t[r * 3 + 2]));
        }
        for (let e = 0; e < c; e++) {
          let t = Math.hypot(l[e * 3], l[e * 3 + 1], l[e * 3 + 2]) || 1;
          ((l[e * 3] /= t), (l[e * 3 + 1] /= t), (l[e * 3 + 2] /= t));
        }
        let d = new Float64Array(c),
          f = new Float64Array(c),
          p = (e, t) => {
            if (e === t) return;
            let n = u[t * 3] - u[e * 3],
              r = u[t * 3 + 1] - u[e * 3 + 1],
              i = u[t * 3 + 2] - u[e * 3 + 2],
              a = Math.hypot(n, r, i);
            if (a < 1e-6) return;
            let o =
              ((l[t * 3] - l[e * 3]) * n +
                (l[t * 3 + 1] - l[e * 3 + 1]) * r +
                (l[t * 3 + 2] - l[e * 3 + 2]) * i) /
              a;
            ((d[e] += o), f[e]++, (d[t] += o), f[t]++);
          };
        for (let e = i.i0; e < i.i1; e += 3) {
          let t = o[n[e] - i.start],
            r = o[n[e + 1] - i.start],
            a = o[n[e + 2] - i.start];
          (p(t, r), p(r, a), p(a, t));
        }
        for (let e = 0; e < a; e++) {
          let t = o[e];
          r[(i.start + e) * 4 + 1] = f[t]
            ? Math.max(
                -1,
                Math.min(1, (d[t] / f[t]) * 1.6 * (i.convScale || 1)),
              )
            : 0;
        }
      }
    }
    #n(e) {
      let t = this.P,
        n = this.N,
        r = this.SU,
        i = [],
        a = [],
        o = [];
      this.parts.forEach((e, n) => {
        if (!e.occluder || e.end - e.start < 4) return;
        let r = 1 / 0,
          s = 1 / 0,
          c = 1 / 0,
          l = -1 / 0,
          u = -1 / 0,
          d = -1 / 0;
        for (let n = e.start; n < e.end; n++) {
          let e = t[n * 3],
            i = t[n * 3 + 1],
            a = t[n * 3 + 2];
          if (i < -100) return;
          ((r = Math.min(r, e)),
            (l = Math.max(l, e)),
            (s = Math.min(s, i)),
            (u = Math.max(u, i)),
            (c = Math.min(c, a)),
            (d = Math.max(d, a)));
        }
        let f = [l - r, u - s, d - c],
          p = f.indexOf(Math.max(...f)),
          m = [...f].sort((e, t) => t - e),
          h = Math.max(
            1,
            Math.min(6, Math.round(m[0] / Math.max(m[1], 0.001))),
          ),
          g = [r, s, c][p],
          _ = new Float64Array(h),
          v = new Float64Array(h),
          y = new Float64Array(h),
          b = new Float64Array(h);
        for (let n = e.start; n < e.end; n++) {
          let e = Math.min(
            h - 1,
            Math.floor(((t[n * 3 + p] - g) / (f[p] || 1)) * h),
          );
          ((_[e] += t[n * 3]),
            (v[e] += t[n * 3 + 1]),
            (y[e] += t[n * 3 + 2]),
            b[e]++);
        }
        let x = new Float64Array(h);
        for (let e = 0; e < h; e++)
          b[e] && ((_[e] /= b[e]), (v[e] /= b[e]), (y[e] /= b[e]));
        for (let n = e.start; n < e.end; n++) {
          let e = Math.min(
            h - 1,
            Math.floor(((t[n * 3 + p] - g) / (f[p] || 1)) * h),
          );
          x[e] +=
            (t[n * 3] - _[e]) ** 2 +
            (t[n * 3 + 1] - v[e]) ** 2 +
            (t[n * 3 + 2] - y[e]) ** 2;
        }
        let S = Math.max(0.05, m[2] / Math.max(m[1], 0.001)) ** 0.35;
        for (let t = 0; t < h; t++)
          b[t] &&
            (i.push(_[t], v[t], y[t], Math.sqrt(x[t] / b[t]) * 0.95 * S),
            a.push(n),
            o.push(e.team || 0));
      });
      let s = a.length,
        c = /* @__PURE__ */ new Float64Array(3);
      this.parts.forEach((l, u) => {
        if (l.recv)
          for (let d = l.start; d < l.end; d++) {
            let f = t[d * 3],
              p = t[d * 3 + 1],
              m = t[d * 3 + 2],
              h = n[d * 3],
              g = n[d * 3 + 1],
              _ = n[d * 3 + 2];
            if (p < -100) continue;
            c[0] = c[1] = c[2] = 0;
            for (let e = 0; e < s; e++) {
              if (a[e] === u) continue;
              let t = o[e];
              if (t && l.team && t !== l.team) continue;
              let n = e * 4,
                r = i[n + 3],
                s = i[n] - f,
                d = i[n + 1] - p,
                v = i[n + 2] - m,
                y = s * s + d * d + v * v;
              if (y > r * r * 12) continue;
              let b = Math.sqrt(y) || 1e-4,
                x = (s * h + d * g + v * _) / b;
              x < -0.25 ||
                (c[t] +=
                  Math.min(1, (r * r) / (y + 1e-4)) *
                  Math.min(1, (x + 0.25) / 1.1) *
                  0.55);
            }
            if (!l.body)
              for (let e of this.bodies)
                c[0] += e.occlusionAt(f, p, m, h, g, _);
            let v = e * l.aoStrength;
            if (((r[d * 4] *= 1 - Math.min(0.8, c[0] * v)), c[1] > 0)) {
              let e = 1 - Math.min(0.7, c[1] * v);
              ((this.C1[d * 3] *= e),
                (this.C1[d * 3 + 1] *= e),
                (this.C1[d * 3 + 2] *= 0.25 + 0.75 * e));
            }
            if (c[2] > 0) {
              let e = 1 - Math.min(0.7, c[2] * v);
              ((this.C2[d * 3] *= e),
                (this.C2[d * 3 + 1] *= e),
                (this.C2[d * 3 + 2] *= 0.25 + 0.75 * e));
            }
          }
      });
    }
  };
  function Zr(e) {
    return /R$/.test(e)
      ? e.slice(0, -1) + `L`
      : /L$/.test(e)
        ? e.slice(0, -1) + `R`
        : e;
  }
  let Qr = (e) => {
    let t = Math.hypot(e[0], e[1], e[2]) || 1;
    return [e[0] / t, e[1] / t, e[2] / t];
  };
  function J(e, t, n, r, i, a = {}) {
    let o = Qr(n),
      s = a.bend || [0, 0, 0],
      c = [];
    for (let e = 0; e <= 4; e++) {
      let n = e / 4;
      c.push([
        t[0] + o[0] * r * n + s[0] * r * n * n,
        t[1] + o[1] * r * n + s[1] * r * n * n,
        t[2] + o[2] * r * n + s[2] * r * n * n,
      ]);
    }
    let l = a.taper ?? 1.15,
      u = a.tipR ?? Math.min(Math.max(0.012, i * 0.05), i * 0.55),
      d = a.radial ?? (i > 0.08 ? 10 : i > 0.035 ? 7 : 5),
      f = a.segs ?? (r > 0.6 ? 12 : 7),
      {
        collar: p,
        collarColor: m,
        bend: h,
        taper: g,
        tipR: _,
        radial: v,
        segs: y,
        flat: b,
        ...x
      } = a;
    if (
      (e.add(
        q.tube(c, (e) => u + (i - u) * (1 - e) ** l, {
          radial: d,
          segs: f,
          sx: a.sx ?? 1,
          sy: a.sy ?? 1,
        }),
        {
          kind: K.bone,
          tipFrom: 0.05,
          grad: [1, 1],
          aoStrength: 0.5,
          tipSoft: 0.45,
          keep: 1,
          ...x,
        },
      ),
      p)
    ) {
      let n = [
          t[0] - o[0] * i * 0.25,
          t[1] - o[1] * i * 0.25,
          t[2] - o[2] * i * 0.25,
        ],
        r = [
          t[0] + o[0] * i * 0.45,
          t[1] + o[1] * i * 0.45,
          t[2] + o[2] * i * 0.45,
        ];
      e.add(
        q.tube([n, r], (e) => i * (1.12 + 0.2 * Math.sin(e * Math.PI)), {
          radial: d,
          segs: 3,
        }),
        {
          keep: 0,
          ...x,
          kind: a.collarKind ?? x.kind ?? K.bone,
          color: m ?? x.color,
          tip: void 0,
          grad: [0.7, 0.85],
          occluder: !1,
        },
      );
    }
  }
  function $r(e, t, n, r, i, a, o = {}) {
    let s = Qr(n),
      c = Qr(r),
      l = o.lift ?? 0.28,
      u = o.curl ?? 0.12,
      d = (e, n, r) => [
        t[0] + s[0] * e + c[0] * n + (o.side ? o.side[0] * r : 0),
        t[1] + s[1] * e + c[1] * n + (o.side ? o.side[1] * r : 0),
        t[2] + s[2] * e + c[2] * n + (o.side ? o.side[2] * r : 0),
      ],
      f = [
        d(-a * 0.25, 0, 0),
        d(i * l * 0.8, i * 0.3, 0),
        d(i * l, i * 0.65, u * i * 0.3),
        d(i * (l - u), i, u * i * 0.6),
      ],
      { lift: p, curl: m, side: h, thick: g, ..._ } = o;
    e.add(
      q.tube(
        f,
        (e) => a * (1 - e) ** 0.75 * (e < 0.12 ? 0.75 + 2 * e : 1) + 0.013,
        {
          radial: o.radial ?? 6,
          segs: o.segs ?? 6,
          sx: g ?? 0.38,
          sy: 1,
          up: s,
        },
      ),
      {
        kind: K.fur,
        tipFrom: 0.1,
        grad: [1, 1],
        aoStrength: 0.35,
        tipSoft: 0.4,
        keep: 1,
        ..._,
      },
    );
  }
  function ei(e) {
    let [t, n, r] = e,
      i = Math.cos(t),
      a = Math.sin(t),
      o = Math.cos(n),
      s = Math.sin(n),
      c = Math.cos(r),
      l = Math.sin(r),
      u = o * c,
      d = -o * l,
      f = s,
      p = i * l + a * s * c,
      m = i * c - a * s * l,
      h = -a * o;
    return [u, p, a * l - i * s * c, d, m, a * c + i * s * l, f, h, i * o];
  }
  function ti(e, t, n) {
    let r =
      Math.imul(e, 374761393) ^
      Math.imul(t, 668265263) ^
      Math.imul(n, 1274126177);
    return (
      (r = Math.imul(r ^ (r >>> 13), 1103515245)),
      ((r ^ (r >>> 16)) >>> 0) / 4294967296
    );
  }
  function ni(e, t, n) {
    let r = Math.floor(e),
      i = Math.floor(t),
      a = Math.floor(n),
      o = e - r,
      s = t - i,
      c = n - a;
    ((o = o * o * (3 - 2 * o)),
      (s = s * s * (3 - 2 * s)),
      (c = c * c * (3 - 2 * c)));
    let l = ti(r, i, a),
      u = ti(r + 1, i, a),
      d = ti(r, i + 1, a),
      f = ti(r + 1, i + 1, a),
      p = ti(r, i, a + 1),
      m = ti(r + 1, i, a + 1),
      h = ti(r, i + 1, a + 1),
      g = ti(r + 1, i + 1, a + 1),
      _ = l + (u - l) * o,
      v = d + (f - d) * o,
      y = p + (m - p) * o,
      b = h + (g - h) * o,
      x = _ + (v - _) * s;
    return x + (y + (b - y) * s - x) * c;
  }
  var ri = class {
    constructor({
      voxel: e = 0.05,
      soft: t = 0.12,
      skinSoft: n = 0.22,
      noiseFreq: r = 3,
      seed: i = 1,
    } = {}) {
      ((this.h = e),
        (this.soft = t),
        (this.skinSoft = n),
        (this.nf = r),
        (this.seed = i),
        (this.prims = []),
        (this._t = 0),
        (this.built = !1));
    }
    #e(e, t, n, r) {
      let i = {
        type: e,
        P: t,
        aabb: n,
        size: r.size ?? 0.3,
        k: r.k ?? 0.12,
        sub: !!r.sub,
        bone: r.bone || null,
        bones: r.bones || null,
        color: Vr(Array.isArray(r.color) ? r.color[0] : r.color || `#808080`),
        color2: Vr(Array.isArray(r.color) ? r.color[1] : r.color || `#808080`),
        rough: r.rough ?? 0.6,
        metal: r.metal ?? 0,
        vein: r.vein ?? 0,
        w2: r.w2 ?? 0,
        noise: r.noise ?? 0,
        emit: r.emit ?? 0,
        attr: r.attr !== !1,
      };
      return (this.prims.push(i), i);
    }
    ellipsoid(e, t, n = {}) {
      let r = ei(n.rot || [0, 0, 0]),
        i = Math.max(t[0], t[1], t[2]);
      return (
        n.size === void 0 &&
          (n = { ...n, size: Math.cbrt(t[0] * t[1] * t[2]) }),
        this.#e(
          0,
          [e[0], e[1], e[2], t[0], t[1], t[2], ...r],
          [e[0] - i, e[1] - i, e[2] - i, e[0] + i, e[1] + i, e[2] + i],
          n,
        )
      );
    }
    sphere(e, t, n = {}) {
      return this.ellipsoid(e, [t, t, t], n);
    }
    cone(e, t, n, r, i = {}) {
      let a = Math.max(n, r);
      return (
        i.size === void 0 && (i = { ...i, size: -1 }),
        this.#e(
          1,
          [e[0], e[1], e[2], t[0], t[1], t[2], n, r],
          [
            Math.min(e[0], t[0]) - a,
            Math.min(e[1], t[1]) - a,
            Math.min(e[2], t[2]) - a,
            Math.max(e[0], t[0]) + a,
            Math.max(e[1], t[1]) + a,
            Math.max(e[2], t[2]) + a,
          ],
          i,
        )
      );
    }
    box(e, t, n, r = {}) {
      let i = ei(r.rot || [0, 0, 0]),
        a = Math.hypot(t[0], t[1], t[2]);
      return (
        r.size === void 0 &&
          (r = { ...r, size: Math.cbrt(t[0] * t[1] * t[2]) }),
        this.#e(
          2,
          [e[0], e[1], e[2], t[0], t[1], t[2], n, ...i],
          [e[0] - a, e[1] - a, e[2] - a, e[0] + a, e[1] + a, e[2] + a],
          r,
        )
      );
    }
    sym(e) {
      (e(
        1,
        (e) => e,
        (e) => e,
      ),
        e(
          -1,
          (e) => [e[0], e[1], -e[2]],
          (e) => e.replace(/R$/, `L`),
        ));
    }
    #t() {
      let e = this.prims.length;
      if (this._cn === e) return;
      this._cn = e;
      let t = new Float64Array(e * 17),
        n = new Int8Array(e),
        r = new Float64Array(e),
        i = new Float64Array(e),
        a = new Uint8Array(e),
        o = new Float64Array(e * 4);
      (this.prims.forEach((e, s) => {
        (t.set(e.P, s * 17),
          (n[s] = e.type),
          (r[s] = e.k),
          (i[s] = e.noise),
          (a[s] = +!!e.sub));
        let c = e.aabb;
        ((o[s * 4] = (c[0] + c[3]) / 2),
          (o[s * 4 + 1] = (c[1] + c[4]) / 2),
          (o[s * 4 + 2] = (c[2] + c[5]) / 2),
          (o[s * 4 + 3] =
            Math.hypot(c[3] - c[0], c[4] - c[1], c[5] - c[2]) / 2));
      }),
        (this.PP = t),
        (this.TY = n),
        (this.KK = r),
        (this.NZ = i),
        (this.SB = a),
        (this.BS = o),
        (this.allIdx = Int32Array.from({ length: e }, (e, t) => t)));
    }
    #n(e, t, n, r) {
      let i = this.PP,
        a = e * 17,
        o = this.TY[e];
      if (o === 0) {
        let e = t - i[a],
          o = n - i[a + 1],
          s = r - i[a + 2],
          c = i[a + 3],
          l = i[a + 4],
          u = i[a + 5],
          d = (i[a + 6] * e + i[a + 7] * o + i[a + 8] * s) / c,
          f = (i[a + 9] * e + i[a + 10] * o + i[a + 11] * s) / l,
          p = (i[a + 12] * e + i[a + 13] * o + i[a + 14] * s) / u,
          m = Math.sqrt(d * d + f * f + p * p),
          h = d / c,
          g = f / l,
          _ = p / u,
          v = Math.sqrt(h * h + g * g + _ * _);
        return (
          (this._t = 0),
          v < 1e-9 ? -Math.min(c, l, u) : (m * (m - 1)) / v
        );
      }
      if (o === 1) {
        let e = i[a],
          o = i[a + 1],
          s = i[a + 2],
          c = i[a + 3] - e,
          l = i[a + 4] - o,
          u = i[a + 5] - s,
          d = i[a + 6],
          f = i[a + 7],
          p = c * c + l * l + u * u,
          m = d - f,
          h = p - m * m,
          g = 1 / p,
          _ = t - e,
          v = n - o,
          y = r - s,
          b = _ * c + v * l + y * u,
          x = b - p,
          S = _ * p - c * b,
          C = v * p - l * b,
          w = y * p - u * b,
          T = S * S + C * C + w * w,
          E = b * b * p,
          D = x * x * p,
          O = (m > 0 ? 1 : m < 0 ? -1 : 0) * m * m * T,
          k = b * g;
        return (
          (this._t = k < 0 ? 0 : k > 1 ? 1 : k),
          (x > 0 ? 1 : x < 0 ? -1 : 0) * h * D > O
            ? Math.sqrt(T + D) * g - f
            : (b > 0 ? 1 : b < 0 ? -1 : 0) * h * E < O
              ? Math.sqrt(T + E) * g - d
              : (Math.sqrt(T * h * g) + b * m) * g - d
        );
      }
      let s = t - i[a],
        c = n - i[a + 1],
        l = r - i[a + 2],
        u = i[a + 6],
        d = Math.abs(i[a + 7] * s + i[a + 8] * c + i[a + 9] * l) - i[a + 3] + u,
        f =
          Math.abs(i[a + 10] * s + i[a + 11] * c + i[a + 12] * l) -
          i[a + 4] +
          u,
        p =
          Math.abs(i[a + 13] * s + i[a + 14] * c + i[a + 15] * l) -
          i[a + 5] +
          u;
      this._t = 0;
      let m = d > 0 ? d : 0,
        h = f > 0 ? f : 0,
        g = p > 0 ? p : 0,
        _ = Math.max(d, f, p);
      return Math.sqrt(m * m + h * h + g * g) + (_ < 0 ? _ : 0) - u;
    }
    dist(e, t, n, r = null) {
      this.#t();
      let i = r || this.allIdx,
        a = i.length,
        o = this.KK,
        s = this.NZ,
        c = this.SB,
        l = this.BS,
        u = 1e9,
        d = 0,
        f = !0,
        p = !1;
      for (let r = 0; r < a; r++) {
        let a = i[r];
        if (c[a]) {
          p = !0;
          continue;
        }
        if (!f) {
          let r = e - l[a * 4],
            i = t - l[a * 4 + 1],
            s = n - l[a * 4 + 2],
            c = Math.sqrt(r * r + i * i + s * s) - l[a * 4 + 3];
          if (c > u + o[a] && c > 0.3) continue;
        }
        let m = this.#n(a, e, t, n);
        if (f) ((u = m), (f = !1));
        else {
          let e = o[a],
            t = u - m,
            n = e - (t < 0 ? -t : t);
          if (n > 0) {
            let t = n / e;
            u = (u < m ? u : m) - t * t * e * 0.25;
          } else m < u && (u = m);
        }
        let h = s[a];
        if (h > 0) {
          let e = m <= 0 ? 1 : m >= 0.3 ? 0 : 1 - m / 0.3;
          h * e > d && (d = h * e);
        }
      }
      if (f) return 1e9;
      if (p)
        for (let r = 0; r < a; r++) {
          let a = i[r];
          if (!c[a]) continue;
          let s = -this.#n(a, e, t, n),
            l = o[a],
            d = u - s,
            f = l - (d < 0 ? -d : d);
          if (f > 0) {
            let e = f / l;
            u = (u > s ? u : s) + e * e * l * 0.25;
          } else s > u && (u = s);
        }
      if (d > 0) {
        let r = this.nf,
          i = this.seed * 17.3;
        u += d * (ni(e * r + i, t * r, n * r) - 0.5) * 2;
      }
      return u;
    }
    #r(e, t, n) {
      let r = this.grid;
      if (!r) return null;
      let i = Math.max(
          0,
          Math.min(r.cx - 1, Math.floor((e - r.ox) / (4 * this.h))),
        ),
        a = Math.max(
          0,
          Math.min(r.cy - 1, Math.floor((t - r.oy) / (4 * this.h))),
        ),
        o = Math.max(
          0,
          Math.min(r.cz - 1, Math.floor((n - r.oz) / (4 * this.h))),
        );
      return e < r.ox - 1 ||
        t < r.oy - 1 ||
        n < r.oz - 1 ||
        e > r.ox + r.cx * 4 * this.h + 1 ||
        t > r.oy + r.cy * 4 * this.h + 1 ||
        n > r.oz + r.cz * 4 * this.h + 1
        ? null
        : r.lists[i + r.cx * (a + r.cy * o)];
    }
    distAt(e, t, n) {
      let r = this.#r(e, t, n);
      return r ? (r.length ? this.dist(e, t, n, r) : 1e9) : this.dist(e, t, n);
    }
    gradAt(e, t, n, r, i = this.h * 0.4) {
      let a = this.distAt(e + i, t - i, n - i),
        o = this.distAt(e - i, t - i, n + i),
        s = this.distAt(e - i, t + i, n - i),
        c = this.distAt(e + i, t + i, n + i),
        l = a - o - s + c,
        u = -a - o + s + c,
        d = -a + o - s + c,
        f = Math.hypot(l, u, d) || 1;
      return ((r[0] = l / f), (r[1] = u / f), (r[2] = d / f), r);
    }
    project(e, t = 0) {
      let n = e[0],
        r = e[1],
        i = e[2],
        a = [0, 1, 0];
      for (let e = 0; e < 6; e++) {
        let e = this.distAt(n, r, i);
        if (
          (this.gradAt(n, r, i, a),
          (n -= a[0] * e),
          (r -= a[1] * e),
          (i -= a[2] * e),
          Math.abs(e) < 1e-4)
        )
          break;
      }
      return (
        this.gradAt(n, r, i, a),
        { p: [n + a[0] * t, r + a[1] * t, i + a[2] * t], n: [...a] }
      );
    }
    occlusionAt(e, t, n, r, i, a, o = this.aoScale || 0.3) {
      let s = 0,
        c = 1,
        l = this.#r(e, t, n);
      if (l && !l.length) return 0;
      for (let u = 1; u <= 4; u++) {
        let d = o * (0.1 + 0.28 * u),
          f = l
            ? this.dist(e + r * d, t + i * d, n + a * d, l)
            : this.dist(e + r * d, t + i * d, n + a * d);
        ((s += Math.max(0, d - f) * c), (c *= 0.72));
      }
      return (s / o) * 0.9;
    }
    skinAt(e, t, n) {
      let r = this.#i(e, t, n, null);
      return [r.b0, r.b1, r.w];
    }
    #i(e, t, n, r) {
      let i = this.prims,
        a = this.#r(e, t, n),
        o = a ? a.length : i.length,
        s = 1e9,
        c = (this._ds ||= new Float64Array(i.length)),
        l = (this._ts ||= new Float64Array(i.length));
      this.#t();
      for (let r = 0; r < o; r++) {
        let o = a ? a[r] : r,
          u = i[o];
        if (u.sub) {
          c[o] = 1e9;
          continue;
        }
        ((c[o] = this.#n(o, e, t, n)),
          (l[o] = this._t),
          u.attr && c[o] < s && (s = c[o]));
      }
      let u = (this._bw ||= /* @__PURE__ */ new Map());
      u.clear();
      let d = 0,
        f = 0,
        p = 0,
        m = 0,
        h = 0,
        g = 0,
        _ = 0,
        v = 0,
        y = 0,
        b = 0,
        x = 0,
        S = 0,
        C = 0;
      for (let e = 0; e < o; e++) {
        let t = a ? a[e] : e,
          n = i[t];
        if (n.sub) continue;
        let r = c[t] - s;
        if (n.attr) {
          let e = Math.exp(-Math.max(0, r) / this.soft);
          if (e > 1e-4) {
            let r = n.size >= 0 ? n.size : n.P[6] + (n.P[7] - n.P[6]) * l[t];
            ((C += r * e),
              (d += e),
              (h += n.color2[0] * e),
              (g += n.color2[1] * e),
              (_ += n.color2[2] * e),
              (f += n.color[0] * e),
              (p += n.color[1] * e),
              (m += n.color[2] * e),
              (v += n.rough * e),
              (y += n.metal * e),
              (b += n.vein * e),
              (x += n.w2 * e),
              (S += n.emit * e));
          }
        }
        let o = Math.exp(-Math.max(0, r) / this.skinSoft);
        if (!(o < 1e-4)) {
          if (n.bones) {
            let e = l[t],
              r = e * e * (3 - 2 * e);
            (u.set(n.bones[0], (u.get(n.bones[0]) || 0) + o * (1 - r)),
              u.set(n.bones[1], (u.get(n.bones[1]) || 0) + o * r));
          } else n.bone && u.set(n.bone, (u.get(n.bone) || 0) + o);
        }
      }
      let w = null,
        T = 0,
        E = null,
        D = 0;
      for (let [e, t] of u)
        t > T
          ? ((E = w), (D = T), (w = e), (T = t))
          : t > D && ((E = e), (D = t));
      let O = r || {};
      return (
        (d ||= 1),
        (O.r = f / d),
        (O.g = p / d),
        (O.b = m / d),
        (O.r2 = h / d),
        (O.g2 = g / d),
        (O.b2 = _ / d),
        (O.rough = v / d),
        (O.metal = y / d),
        (O.vein = b / d),
        (O.w2 = x / d),
        (O.emit = S / d),
        (O.size = C / d),
        (O.b0 = w || `root`),
        (O.b1 = E || O.b0),
        (O.w = E ? D / (T + D) : 0),
        O
      );
    }
    build(e, t = {}) {
      let n = this.h,
        r = this.prims,
        i = performance.now(),
        a = 1 / 0,
        o = 1 / 0,
        s = 1 / 0,
        c = -1 / 0,
        l = -1 / 0,
        u = -1 / 0,
        d = 0;
      for (let e of r) {
        if (e.sub) continue;
        let t = e.aabb;
        ((a = Math.min(a, t[0])),
          (o = Math.min(o, t[1])),
          (s = Math.min(s, t[2])),
          (c = Math.max(c, t[3])),
          (l = Math.max(l, t[4])),
          (u = Math.max(u, t[5])),
          (d = Math.max(d, e.noise)));
      }
      let f = n * 4 + d;
      ((a -= f), (o -= f), (s -= f), (c += f), (l += f), (u += f));
      let p = Math.ceil((c - a) / (4 * n)),
        m = Math.ceil((l - o) / (4 * n)),
        h = Math.ceil((u - s) / (4 * n)),
        g = p * 4 + 1,
        _ = m * 4 + 1,
        v = h * 4 + 1,
        y = Array(p * m * h);
      for (let e = 0; e < y.length; e++) y[e] = [];
      r.forEach((e, t) => {
        let r = e.k * 1.2 + e.noise * 1.5 + 4 * n * 1.8 + 0.02,
          i = e.aabb,
          c = Math.max(0, Math.floor((i[0] - r - a) / (4 * n))),
          l = Math.min(p - 1, Math.floor((i[3] + r - a) / (4 * n))),
          u = Math.max(0, Math.floor((i[1] - r - o) / (4 * n))),
          d = Math.min(m - 1, Math.floor((i[4] + r - o) / (4 * n))),
          f = Math.max(0, Math.floor((i[2] - r - s) / (4 * n))),
          g = Math.min(h - 1, Math.floor((i[5] + r - s) / (4 * n)));
        for (let e = f; e <= g; e++)
          for (let n = u; n <= d; n++)
            for (let r = c; r <= l; r++) y[r + p * (n + m * e)].push(t);
      });
      for (let e = 0; e < y.length; e++) y[e] = Int32Array.from(y[e]);
      this.grid = { ox: a, oy: o, oz: s, cx: p, cy: m, cz: h, lists: y };
      let b = new Float32Array(g * _ * v).fill(NaN),
        x = (e, t, n) => e + g * (t + _ * n),
        S = (e, t, r, i) => {
          let c = x(e, t, r),
            l = b[c];
          return (
            l !== l &&
              ((l = i.length
                ? this.dist(a + e * n, o + t * n, s + r * n, i)
                : 1e9),
              (b[c] = l)),
            l
          );
        },
        C = new Uint8Array(p * m * h),
        w = 4 * n * 1.15 + d;
      for (let e = 0; e < h; e++)
        for (let t = 0; t < m; t++)
          for (let n = 0; n < p; n++) {
            let r = y[n + p * (t + m * e)];
            if (!r.length) continue;
            let i = 1 / 0,
              a = -1 / 0;
            for (let o = 0; o <= 1; o++)
              for (let s = 0; s <= 1; s++)
                for (let c = 0; c <= 1; c++) {
                  let l = S((n + c) * 4, (t + s) * 4, (e + o) * 4, r);
                  (l < i && (i = l), l > a && (a = l));
                }
            (Math.min(Math.abs(i), Math.abs(a)) < w || (i < 0 && a > 0)) &&
              (C[n + p * (t + m * e)] = 1);
          }
      let T = /* @__PURE__ */ new Map(),
        E = [],
        D = (e, t, n) => e + (g - 1) * (t + (_ - 1) * n),
        O = [
          [0, 1],
          [2, 3],
          [4, 5],
          [6, 7],
          [0, 2],
          [1, 3],
          [4, 6],
          [5, 7],
          [0, 4],
          [1, 5],
          [2, 6],
          [3, 7],
        ],
        k = /* @__PURE__ */ new Float64Array(8);
      for (let e = 0; e < h; e++)
        for (let t = 0; t < m; t++)
          for (let r = 0; r < p; r++) {
            if (!C[r + p * (t + m * e)]) continue;
            let i = y[r + p * (t + m * e)];
            for (let c = e * 4; c < e * 4 + 4; c++)
              for (let e = t * 4; e < t * 4 + 4; e++)
                for (let t = r * 4; t < r * 4 + 4; t++) {
                  let r = 0;
                  for (let n = 0; n < 8; n++) {
                    let a = S(
                      t + (n & 1),
                      e + ((n >> 1) & 1),
                      c + ((n >> 2) & 1),
                      i,
                    );
                    ((k[n] = a), a < 0 && (r |= 1 << n));
                  }
                  if (r === 0 || r === 255) continue;
                  let l = 0,
                    u = 0,
                    d = 0,
                    f = 0;
                  for (let [e, t] of O) {
                    let n = k[e],
                      r = k[t];
                    if (n < 0 == r < 0) continue;
                    let i = n / (n - r);
                    ((l += (e & 1) + ((t & 1) - (e & 1)) * i),
                      (u +=
                        ((e >> 1) & 1) + (((t >> 1) & 1) - ((e >> 1) & 1)) * i),
                      (d +=
                        ((e >> 2) & 1) + (((t >> 2) & 1) - ((e >> 2) & 1)) * i),
                      f++);
                  }
                  (T.set(D(t, e, c), E.length / 3),
                    E.push(
                      a + (t + l / f) * n,
                      o + (e + u / f) * n,
                      s + (c + d / f) * n,
                    ));
                }
          }
      let A = [],
        j = (e, t, n, r, i) => {
          let a = T.get(e),
            o = T.get(t),
            s = T.get(n),
            c = T.get(r);
          if (a === void 0 || o === void 0 || s === void 0 || c === void 0)
            return;
          let l =
              (E[a * 3] - E[s * 3]) ** 2 +
              (E[a * 3 + 1] - E[s * 3 + 1]) ** 2 +
              (E[a * 3 + 2] - E[s * 3 + 2]) ** 2,
            u =
              (E[o * 3] - E[c * 3]) ** 2 +
              (E[o * 3 + 1] - E[c * 3 + 1]) ** 2 +
              (E[o * 3 + 2] - E[c * 3 + 2]) ** 2,
            d = (e, t, n) => (i ? A.push(e, n, t) : A.push(e, t, n));
          l < u ? (d(a, o, s), d(a, s, c)) : (d(a, o, c), d(o, s, c));
        };
      for (let [e] of T) {
        let t = e % (g - 1),
          n = (e - t) / (g - 1),
          r = n % (_ - 1),
          i = (n - r) / (_ - 1),
          a = b[x(t, r, i)];
        if (a !== a) continue;
        let o = a < 0;
        if (r > 0 && i > 0) {
          let e = b[x(t + 1, r, i)];
          e === e &&
            e < 0 !== o &&
            j(
              D(t, r, i),
              D(t, r - 1, i),
              D(t, r - 1, i - 1),
              D(t, r, i - 1),
              !o,
            );
        }
        if (t > 0 && i > 0) {
          let e = b[x(t, r + 1, i)];
          e === e &&
            e < 0 !== o &&
            j(
              D(t, r, i),
              D(t, r, i - 1),
              D(t - 1, r, i - 1),
              D(t - 1, r, i),
              !o,
            );
        }
        if (t > 0 && r > 0) {
          let e = b[x(t, r, i + 1)];
          e === e &&
            e < 0 !== o &&
            j(
              D(t, r, i),
              D(t - 1, r, i),
              D(t - 1, r - 1, i),
              D(t, r - 1, i),
              !o,
            );
        }
      }
      let M = E.length / 3,
        ee = new Float32Array(M * 3),
        N = new Float32Array(M * 3),
        P = new Float32Array(M * 3),
        F = new Float32Array(M * 4),
        I = new Float32Array(M * 4),
        L = new Float32Array(M * 4),
        te = new Float32Array(M * 3),
        R = t.lodRef ?? 0;
      if (!R)
        for (let e of r)
          !e.sub &&
            e.attr &&
            (R = Math.max(R, e.size >= 0 ? e.size : Math.max(e.P[6], e.P[7])));
      let ne = t.lodMax ?? 1.6,
        re = t.lodK ?? 0.85,
        z = [0, 0, 0],
        B = {},
        ie = Array.isArray(t.kind) ? t.kind : [t.kind ?? 3, t.kind ?? 3],
        ae = t.kind2 ?? ie[0],
        oe = t.tex ?? e.texScale,
        se = t.texBySize ?? 0,
        ce = t.ao ?? 1;
      this.aoScale = t.aoScale ?? 0.3;
      let le = t.curvScale ?? 0.1;
      for (let r = 0; r < M; r++) {
        let i = E[r * 3],
          a = E[r * 3 + 1],
          o = E[r * 3 + 2],
          s = this.distAt(i, a, o);
        (this.gradAt(i, a, o, z, n * 0.5),
          (i -= z[0] * s),
          (a -= z[1] * s),
          (o -= z[2] * s),
          (E[r * 3] = i),
          (E[r * 3 + 1] = a),
          (E[r * 3 + 2] = o),
          (ee[r * 3] = z[0]),
          (ee[r * 3 + 1] = z[1]),
          (ee[r * 3 + 2] = z[2]),
          this.#i(i, a, o, B),
          (N[r * 3] = B.r),
          (N[r * 3 + 1] = B.g),
          (N[r * 3 + 2] = B.b),
          (P[r * 3] = B.r2),
          (P[r * 3 + 1] = B.g2),
          (P[r * 3 + 2] = B.b2),
          t.paint && t.paint(i, a, o, z, N, P, r),
          (F[r * 4] = B.rough),
          (F[r * 4 + 1] = B.metal),
          (F[r * 4 + 2] = B.emit),
          (F[r * 4 + 3] = ie[0] + ie[1] * 32),
          (I[r * 4] = e.bone(B.b0)),
          (I[r * 4 + 1] = e.bone(B.b1)),
          (I[r * 4 + 2] = B.w),
          (I[r * 4 + 3] = 0));
        let c =
          1 - Math.min(0.85, this.occlusionAt(i, a, o, z[0], z[1], z[2]) * ce);
        ((L[r * 4] = c),
          (L[r * 4 + 1] = 0),
          (L[r * 4 + 2] = B.vein),
          (L[r * 4 + 3] = se ? oe * (Math.max(0.001, B.size) / R) ** +-se : oe),
          (te[r * 3] = ae),
          (te[r * 3 + 1] = B.w2),
          (te[r * 3 + 2] = Math.max(
            0,
            Math.min(ne, Math.log2(R / Math.max(0.001, B.size)) * re),
          )));
      }
      return (
        e.addRaw(
          {
            pos: E,
            nrm: ee,
            c1: N,
            c2: P,
            mat: F,
            skin: I,
            surf: L,
            k2: te,
            index: A,
          },
          { heightAO: t.heightAO !== !1, convScale: le / n },
        ),
        e.addBodyOccluder(this),
        (this.built = !0),
        (this.stats = {
          verts: M,
          tris: A.length / 3,
          ms: performance.now() - i,
        }),
        this
      );
    }
  };
  let ii = (e) => (e < 0 ? 0 : e > 1 ? 1 : e),
    ai = (e) => {
      if (((e = ii(e)), e < 0.72)) {
        let t = e / 0.72;
        return t * t;
      }
      let t = (e - 0.72) / 0.28;
      return 1 - Math.sin(t * Math.PI) * 0.07 * (1 - t);
    },
    Y = Math.PI,
    oi = {
      steel: `#5d7398`,
      steelDk: `#333f5e`,
      trim: `#c99a3c`,
      cloth: `#2646ad`,
      clothDk: `#182c6e`,
      clothLt: `#4a6dc0`,
      leather: `#4b3526`,
      hem: `#94693a`,
      bone: `#d2c39c`,
      under: `#1b2545`,
      glow: `#4fe3ff`,
      eye: `#e2f7ff`,
      marble: `#b0c0de`,
      wood: `#a3845e`,
      crest: `#2f64ec`,
      gem: `#6fefff`,
      face: `#141821`,
    },
    si = {
      steel: `#3d322c`,
      steelDk: `#241d1a`,
      trim: `#c9762e`,
      cloth: `#b02c1c`,
      clothDk: `#5c150e`,
      clothLt: `#d04a2e`,
      leather: `#2e201a`,
      hem: `#7a4524`,
      bone: `#a08a63`,
      under: `#241511`,
      glow: `#ff5f16`,
      eye: `#fff2e2`,
      marble: `#2b2320`,
      wood: `#3b2d26`,
      crest: `#ff5a18`,
      gem: `#ff9a4a`,
      face: `#1b1412`,
    },
    X = (e) => [oi[e], si[e]],
    ci = {
      color: X(`steel`),
      kind: [K.metal, K.iron],
      metal: 0.32,
      rough: 0.42,
    },
    li = {
      color: X(`steel`),
      kind: [K.metal, K.iron],
      metal: 0.32,
      rough: 0.46,
    },
    Z = { color: X(`trim`), kind: [K.gold, K.metal], metal: 0.5, rough: 0.42 },
    ui = { color: X(`cloth`), kind: K.cloth, rough: 0.9 },
    di = { color: X(`clothDk`), kind: K.cloth, rough: 0.9 },
    fi = { color: X(`leather`), kind: K.leather },
    pi = { color: X(`hem`), kind: K.leather, rough: 0.82 },
    mi = { color: X(`bone`), kind: K.bone, rough: 0.6 },
    hi = { color: X(`under`), kind: K.leather },
    gi = { color: X(`gem`), kind: K.crystal, emit: 2.2, rough: 0.15, flat: !0 },
    _i = {
      color: X(`face`),
      kind: K.skin,
      rough: 1,
      ao: !1,
      recvAO: !1,
      grad: [0.5, 1],
    },
    vi = {
      color: [`#8a6f38`, `#6b4522`],
      kind: [K.gold, K.metal],
      metal: 0.42,
      rough: 0.5,
    },
    yi = {
      color: [`#2c4a9e`, `#2a211e`],
      kind: [K.metal, K.iron],
      kind2: K.marble,
      w2: 0.45,
      metal: 0.12,
      rough: 0.6,
      vein: -0.75,
    },
    bi = {
      color: [`#1f3576`, `#1b1513`],
      kind: [K.metal, K.iron],
      metal: 0.12,
      rough: 0.62,
      vein: -0.6,
    },
    xi = {
      color: [`#8ea6d4`, `#4a3b34`],
      kind: [K.metal, K.iron],
      kind2: K.marble,
      w2: 0.5,
      metal: 0.18,
      rough: 0.5,
      vein: -0.75,
    },
    Si = {
      color: [`#0d1124`, `#100b09`],
      kind: K.leather,
      rough: 0.95,
      metal: 0,
    },
    Ci = {
      color: `#3b3432`,
      tip: `#a39488`,
      kind: K.iron,
      metal: 0.25,
      rough: 0.5,
      team: 2,
    },
    wi = {
      color: [`#16265e`, `#2a1512`],
      kind: K.cloth,
      rough: 0.93,
      vein: -0.5,
    },
    Ti = {
      color: [`#4278f0`, `#5c3020`],
      kind: K.cloth,
      rough: 0.93,
      vein: -0.5,
    },
    Ei = {
      color: [`#2a4fb8`, `#4a1a12`],
      kind: K.cloth,
      rough: 0.92,
      vein: -0.5,
    },
    Di = {
      color: [oi.cloth, si.cloth],
      kind: K.cloth,
      rough: 0.88,
      grad: [0.7, 1.14],
    },
    Oi = (e, t, n) => {
      let r = Math.cos(e),
        i = Math.sin(e);
      return (e, a = 0, o = 0) => [t + i * e + r * a, n - r * e + i * a, o];
    },
    Q = 0.88;
  function ki() {
    let e = new Xr(
      [
        [`root`, null, [0, 0, 0]],
        [`pelvis`, `root`, [0, 0.46, 0]],
        [`torso`, `pelvis`, [0, 0.54, 0]],
        [`head`, `torso`, [0.02, 0.9, 0]],
        [`armR`, `torso`, [0, 0.84, 0.28]],
        [`armL`, `torso`, [0, 0.84, -0.28]],
        [`thighR`, `pelvis`, [0, 0.44, 0.14]],
        [`shinR`, `thighR`, [0.015, 0.25, 0.15]],
        [`thighL`, `pelvis`, [0, 0.44, -0.14]],
        [`shinL`, `thighL`, [0.015, 0.25, -0.15]],
        [`tabF`, `pelvis`, [0.15, 0.5, 0]],
        [`tabB`, `pelvis`, [-0.16, 0.5, 0]],
      ],
      { seed: 11, texScale: 3.2 },
    );
    (e.add(q.box(0.245, 0.09, 0.135, 0.035), {
      ...fi,
      at: [0.055, 0.045, 0.15],
      bone: `shinR`,
      mirror: !0,
    }),
      e.add(q.box(0.085, 0.07, 0.125, 0.022), {
        ...li,
        at: [0.145, 0.055, 0.15],
        bone: `shinR`,
        mirror: !0,
      }),
      e.add(q.box(0.1, 0.028, 0.115, 0.01), {
        ...vi,
        at: [0.12, 0.093, 0.15],
        rot: [0, 0, -0.22],
        bone: `shinR`,
        mirror: !0,
        occluder: !1,
        keep: 1,
      }),
      e.add(q.cyl(0.068, 0.056, 0.17, 16), {
        ...ci,
        at: [0.015, 0.165, 0.15],
        bone: `shinR`,
        mirror: !0,
      }),
      e.add(q.shell(0.06, 0.055, 0.057, { seg: 14, rings: 3 }), {
        ...Z,
        at: [0.05, 0.245, 0.15],
        rot: [0, 0, -Y / 2],
        bone: `shinR`,
        mirror: !0,
        keep: 1,
      }),
      e.add(q.cyl(0.082, 0.065, 0.2, 10), {
        ...di,
        at: [0, 0.35, 0.145],
        bone: `thighR`,
        mirror: !0,
      }),
      e.add(
        q.lathe(
          [
            [0.15, 0.53],
            [0.175, 0.47],
            [0.188, 0.41],
            [0.165, 0.4],
          ],
          16,
        ),
        { ...di, bone: `pelvis` },
      ),
      e.add(q.torus(0.168, 0.038, 6, 22), {
        ...pi,
        at: [0, 0.51, 0],
        rot: [Y / 2, 0, 0],
        bone: `pelvis`,
      }),
      e.add(q.box(0.045, 0.07, 0.09, 0.015), {
        ...Z,
        at: [0.18, 0.51, 0],
        bone: `pelvis`,
        keep: 1,
      }));
    let t = [
      [-0.085, 0],
      [0.085, 0],
      [0.09, -0.16],
      [0.06, -0.22],
      [0, -0.245],
      [-0.06, -0.22],
      [-0.09, -0.16],
    ];
    (e.add(q.extrude(t, 0.018, 0.008, 4, 1), {
      ...ui,
      at: [0.185, 0.5, 0],
      rot: [0, Y / 2, 0.12],
      order: `ZYX`,
      bone: `tabF`,
      grad: [0.72, 1.05],
    }),
      e.add(q.box(0.017, 0.026, 0.17, 0.005), {
        ...Z,
        at: [0.194, 0.47, 0],
        rot: [0, 0, 0.12],
        bone: `tabF`,
        keep: 1,
      }),
      e.add(q.gem(0.034, 0.068), {
        ...gi,
        at: [0.182, 0.39, 0],
        scale: [0.45, 1.2, 0.9],
        rot: [0, 0, 0.12],
        bone: `tabF`,
        emit: 1.6,
        keep: 1,
      }),
      e.add(q.extrude(t, 0.018, 0.008, 4, 1), {
        ...ui,
        at: [-0.185, 0.5, 0],
        rot: [0, -Y / 2, -0.12],
        order: `ZYX`,
        bone: `tabB`,
        grad: [0.72, 1.05],
      }),
      e.add(q.box(0.15, 0.115, 0.025, 0.01), {
        ...ci,
        flat: !1,
        at: [0, 0.44, 0.176],
        rot: [0.3, 0, 0],
        bone: `pelvis`,
        mirror: !0,
      }),
      e.add(q.box(0.16, 0.018, 0.03, 0.006), {
        ...Z,
        at: [0, 0.385, 0.192],
        rot: [0.3, 0, 0],
        bone: `pelvis`,
        mirror: !0,
        keep: 1,
      }),
      e.add(q.cyl(0.18, 0.16, 0.14, 12), {
        ...hi,
        at: [0, 0.56, 0],
        bone: `torso`,
      }),
      e.add(
        q.lathe(
          [
            [0.15, 0.56],
            [0.205, 0.6],
            [0.235, 0.69],
            [0.232, 0.78],
            [0.19, 0.86],
            [0.11, 0.9],
          ],
          11,
        ),
        {
          ...ci,
          flat: !0,
          kind2: K.marble,
          w2: 0.52,
          tex: 1.5,
          grad: [0.52, 1.24],
          at: [0.01, 0, 0],
          bone: `torso`,
          deform: (e) => {
            e.x > 0.05 &&
              (e.x += Math.max(0, 0.05 - Math.abs(e.y - 0.72) * 0.25));
          },
        },
      ));
    let n = 3.7,
      r = Y / 2 - n / 2;
    (e.add(
      q.latheArc(
        [
          [0.208, 0.745],
          [0.252, 0.775],
          [0.25, 0.828],
          [0.214, 0.862],
        ],
        11,
        r,
        n,
      ),
      {
        ...yi,
        flat: !0,
        tex: 1.5,
        grad: [0.58, 1.26],
        at: [0.012, 0, 0],
        bone: `torso`,
      },
    ),
      e.add(
        q.latheArc(
          [
            [0.206, 0.726],
            [0.25, 0.752],
          ],
          11,
          r,
          n,
        ),
        { ...Si, at: [0.012, 0, 0], bone: `torso`, occluder: !1, keep: 1 },
      ),
      e.add(
        q.latheArc(
          [
            [0.21, 0.655],
            [0.25, 0.69],
            [0.246, 0.722],
          ],
          11,
          r,
          n,
        ),
        {
          ...bi,
          flat: !0,
          tex: 1.5,
          grad: [0.5, 1.1],
          at: [0.012, 0, 0],
          bone: `torso`,
        },
      ),
      e.add(
        q.lathe(
          [
            [0.196, 0.576],
            [0.206, 0.596],
          ],
          11,
        ),
        { ...Si, at: [0.01, 0, 0], bone: `torso`, occluder: !1, keep: 1 },
      ),
      e.add(q.box(0.03, 0.42, 0.085, 0.012), {
        ...pi,
        at: [0.225, 0.73, 0.02],
        rot: [0.42, 0, -0.05],
        bone: `torso`,
      }),
      e.add(q.box(0.022, 0.05, 0.1, 0.008), {
        ...Z,
        at: [0.245, 0.69, 0.055],
        rot: [0.42, 0, -0.05],
        bone: `torso`,
        occluder: !1,
        keep: 1,
      }),
      e.add(
        q.tube(
          [
            [0.2, 0.6, 0],
            [0.26, 0.7, 0],
            [0.245, 0.8, 0],
            [0.19, 0.87, 0],
          ],
          0.013,
          { radial: 8, segs: 12 },
        ),
        { ...ci, bone: `torso`, occluder: !1 },
      ),
      e.add(q.torus(0.205, 0.022, 8, 32), {
        ...Z,
        at: [0.01, 0.6, 0],
        rot: [Y / 2, 0, 0],
        bone: `torso`,
        keep: 1,
      }),
      e.add(
        q.lathe(
          [
            [0.168, 0.815],
            [0.176, 0.845],
            [0.158, 0.888],
            [0.124, 0.9],
          ],
          20,
        ),
        { ...Si, at: [0.012, 0, 0], bone: `torso` },
      ),
      e.add(q.torus(0.168, 0.016, 5, 20), {
        ...Z,
        at: [0.012, 0.826, 0],
        rot: [Y / 2, 0, 0],
        bone: `torso`,
        occluder: !1,
        keep: 1,
      }),
      e.add(q.shell(0.06, 0.025, 0.06, { seg: 16, rings: 3, frac: 0.7 }), {
        ...Z,
        at: [0.262, 0.73, 0],
        rot: [0, 0, -Y / 2],
        bone: `torso`,
        keep: 1,
      }),
      e.add(q.gem(0.045, 0.09), {
        ...gi,
        at: [0.288, 0.73, 0],
        scale: [0.45, 1.1, 0.95],
        bone: `torso`,
        emit: 2.6,
        keep: 1,
      }));
    let i = (t, n, r, i, a, o = {}) => {
        (e.add(q.extrude(t, i, 0.012, 3, 1), {
          ...a,
          flat: !0,
          at: n,
          rot: [Y / 2 + r, 0, 0],
          bone: `armR`,
          mirror: !0,
          ...o,
        }),
          e.add(
            q.extrude(
              t.map(([e, t]) => [e * 1.09, t * 1.06 + 0.006]),
              i * 0.5,
              0.006,
              3,
              1,
            ),
            {
              ...Si,
              at: [n[0], n[1] - 0.012, n[2] + 0.004],
              rot: [Y / 2 + r, 0, 0],
              bone: `armR`,
              mirror: !0,
              occluder: !1,
              keep: 1,
            },
          ));
      },
      a = [
        [-0.135, -0.01],
        [0.125, -0.01],
        [0.155, 0.075],
        [0.135, 0.18],
        [-0.11, 0.195],
        [-0.165, 0.1],
      ],
      o = [
        [-0.115, 0],
        [0.11, 0],
        [0.13, 0.06],
        [0.1, 0.145],
        [-0.09, 0.155],
        [-0.135, 0.08],
      ];
    (i(a, [0, 0.928, 0.16], 0.34, 0.058, {
      ...yi,
      tex: 1.5,
      grad: [0.72, 1.18],
    }),
      i(o, [0, 0.852, 0.3], 0.86, 0.05, {
        ...bi,
        tex: 1.5,
        grad: [0.74, 1.12],
      }),
      e.add(q.box(0.27, 0.024, 0.03, 0.008), {
        ...Z,
        at: [-0.005, 0.978, 0.28],
        rot: [0.3, 0, 0],
        bone: `armR`,
        mirror: !0,
        occluder: !1,
        keep: 1,
      }),
      e.add(q.box(0.22, 0.02, 0.028, 0.007), {
        ...Z,
        at: [-0.005, 0.838, 0.408],
        rot: [0.86, 0, 0],
        bone: `armR`,
        mirror: !0,
        occluder: !1,
        keep: 1,
      }),
      e.add(q.sphere(0.028, 0.028, 0.028, 6, 4), {
        ...Z,
        team: 1,
        at: [-0.06, 0.985, 0.235],
        bone: `armR`,
        mirror: !0,
        keep: 0,
      }),
      J(e, [-0.05, 0.99, 0.24], [-0.15, 0.85, 0.5], 0.17, 0.034, {
        ...Ci,
        team: 7,
        bone: `armR`,
        mirror: !0,
        keep: 1,
      }),
      J(e, [-0.05, 0.99, 0.24], [-0.35, 1, 0.45], 0.12, 0.03, {
        ...Ci,
        team: 8,
        bone: `armR`,
        mirror: !0,
        keep: 1,
      }),
      e.add(q.box(0.2, 0.045, 0.05, 0.012), {
        ...Z,
        team: 6,
        at: [-0.03, 1, 0.25],
        rot: [0.5, 0, 0],
        bone: `armR`,
        mirror: !0,
        keep: 1,
      }),
      e.add(
        q.extrude(
          [
            [-0.165, -0.02],
            [0.15, -0.02],
            [0.182, 0.088],
            [0.156, 0.212],
            [-0.135, 0.228],
            [-0.198, 0.118],
          ],
          0.02,
          0.01,
          3,
          1,
        ),
        {
          ...Di,
          team: 2,
          flat: !0,
          at: [-0.004, 0.957, 0.152],
          rot: [Y / 2 + 0.33, 0, 0],
          bone: `armR`,
          mirror: !0,
        },
      ),
      e.add(q.box(0.3, 0.02, 0.026, 0.007), {
        ...Z,
        team: 2,
        at: [-0.01, 0.986, 0.3],
        rot: [0.33, 0, 0],
        bone: `armR`,
        mirror: !0,
        occluder: !1,
        keep: 1,
      }),
      e.add(q.cyl(0.05, 0.046, 0.18, 9), {
        ...di,
        at: [0, 0.72, 0.32],
        bone: `armR`,
        mirror: !0,
      }),
      e.add(q.cyl(0.064, 0.056, 0.14, 16), {
        ...ci,
        at: [0.02, 0.585, 0.325],
        bone: `armR`,
        mirror: !0,
      }),
      e.add(q.torus(0.063, 0.016, 6, 20), {
        ...Z,
        at: [0.02, 0.648, 0.325],
        rot: [Y / 2, 0, 0],
        bone: `armR`,
        mirror: !0,
        occluder: !1,
        keep: 1,
      }),
      e.add(q.sphere(0.055, 0.052, 0.055, 10, 8), {
        ...fi,
        at: [0.035, 0.495, 0.325],
        bone: `armR`,
        mirror: !0,
      }),
      e.frame(
        [0.05, 0.5, 0.325],
        [0.34, 0, -1.34],
        1,
        () => {
          (e.add(q.sphere(0.03, 0.03, 0.03, 12, 8), {
            ...Z,
            at: [0, -0.1, 0],
            bone: `armR`,
            keep: 1,
          }),
            e.add(q.cyl(0.021, 0.021, 0.15, 7), {
              ...fi,
              at: [0, -0.02, 0],
              bone: `armR`,
            }),
            e.add(q.box(0.05, 0.032, 0.235, 0.012), {
              ...Z,
              at: [0, 0.07, 0],
              bone: `armR`,
              keep: 1,
            }),
            e.add(
              q.extrude(
                [
                  [-0.05, 0.09],
                  [0.05, 0.09],
                  [0.056, 0.42],
                  [0, 0.6],
                  [-0.056, 0.42],
                ],
                0.028,
                0.008,
                4,
                1,
              ),
              {
                color: X(`steel`),
                kind: [K.metal, K.iron],
                metal: 0.55,
                rough: 0.3,
                bone: `armR`,
              },
            ),
            e.add(q.box(0.012, 0.33, 0.032, 0.004), {
              color: X(`steelDk`),
              kind: K.metal,
              metal: 0.3,
              at: [0, 0.29, 0],
              bone: `armR`,
              occluder: !1,
            }));
        },
        `XYZ`,
      ),
      e.frame([0.2, 0.62, -0.35], [0, Y / 2 + 0.3, 0], 1, () => {
        let t = [
          [0, 0.25],
          [0.15, 0.19],
          [0.16, 0],
          [0, -0.27],
          [-0.16, 0],
          [-0.15, 0.19],
        ];
        (e.add(q.extrude(t, 0.03, 0.015, 3, 1), {
          ...li,
          team: 1,
          bone: `armL`,
        }),
          e.add(
            q.extrude(
              t.map(([e, t]) => [e * 0.8, t * 0.8 - 0.004]),
              0.045,
              0.01,
              3,
              1,
            ),
            { ...yi, team: 1, at: [0, 0, 0.008], bone: `armL` },
          ),
          e.add(
            q.extrude(
              [
                [0, 0.15],
                [0.04, 0.02],
                [0, -0.18],
                [-0.04, 0.02],
              ],
              0.03,
              0.008,
              3,
              1,
            ),
            { ...Z, team: 1, at: [0, 0, 0.034], bone: `armL`, keep: 1 },
          ),
          e.add(q.gem(0.042, 0.084), {
            ...gi,
            team: 1,
            at: [0, 0.03, 0.058],
            scale: [1, 1.25, 0.5],
            bone: `armL`,
            emit: 2.4,
            keep: 1,
          }),
          e.add(
            q.lathe(
              [
                [0, 0.03],
                [0.16, 0.022],
                [0.19, 0.008],
                [0.19, -0.02],
                [0, -0.02],
              ],
              32,
            ),
            { ...yi, team: 2, rot: [Y / 2, 0, 0], bone: `armL` },
          ),
          e.add(q.torus(0.19, 0.026, 8, 40), {
            color: X(`steel`),
            kind: K.iron,
            metal: 0.3,
            rough: 0.5,
            team: 2,
            bone: `armL`,
          }),
          e.add(q.shell(0.075, 0.05, 0.075, { seg: 18, rings: 4 }), {
            color: X(`steel`),
            kind: K.iron,
            metal: 0.3,
            team: 2,
            at: [0, 0, 0.022],
            rot: [Y / 2, 0, 0],
            bone: `armL`,
          }),
          e.add(q.torus(0.105, 0.012, 4, 20), {
            ...gi,
            flat: !1,
            team: 2,
            at: [0, 0, 0.026],
            bone: `armL`,
            emit: 1.9,
            keep: 1,
          }));
        for (let t = 0; t < 6; t++) {
          let n = (t / 6) * Y * 2 + 0.26;
          J(
            e,
            [Math.cos(n) * 0.2, Math.sin(n) * 0.2, 0],
            [Math.cos(n), Math.sin(n), 0.15],
            0.075,
            0.022,
            { ...Ci, bone: `armL`, radial: 5, segs: 4 },
          );
        }
      }));
    let s = 0.02,
      c = 2.356,
      l = Y / 2 + c / 2,
      u = Y * 2 - c;
    e.add(q.cyl(0.108, 0.135, 0.085, 8), {
      ...hi,
      at: [0.01, 0.868, 0],
      bone: `head`,
      keep: 1,
    });
    let d = [
        [0.168, 0.9],
        [0.181, 0.945],
        [0.184, 1],
        [0.178, 1.048],
      ],
      f = [
        [0.178, 1.048],
        [0.176, 1.082],
        [0.152, 1.128],
        [0.104, 1.172],
        [0.05, 1.19],
        [0, 1.194],
      ];
    (e.add(q.latheArc(d, 11, l, u), {
      ...xi,
      flat: !0,
      rough: 0.55,
      tex: 1.4,
      grad: [0.45, 1.16],
      at: [s, 0, 0],
      bone: `head`,
    }),
      e.add(q.lathe(f, 8), {
        ...xi,
        flat: !0,
        rough: 0.55,
        tex: 1.4,
        grad: [0.52, 1.25],
        at: [s, 0, 0],
        bone: `head`,
      }),
      e.add(
        q.lathe(
          [
            [0.183, 1.04],
            [0.186, 1.06],
          ],
          8,
        ),
        { ...Si, at: [s, 0, 0], bone: `head`, occluder: !1, keep: 1 },
      ),
      e.add(
        q.lathe(
          [
            [0.146, 0.845],
            [0.168, 0.874],
            [0.172, 0.9],
          ],
          18,
        ),
        { ...xi, rough: 0.58, grad: [0.6, 1], at: [s, 0, 0], bone: `head` },
      ),
      e.add(q.sphere(0.132, 0.15, 0.152, 12, 9), {
        ..._i,
        grad: [0.26, 0.66],
        at: [0.022, 0.998, 0],
        bone: `head`,
        recvAO: !1,
      }));
    for (let t = 0; t < 6; t++) {
      let n = (t / 6) * Y * 2 + Y / 6,
        r = Math.sin(n),
        i = Math.cos(n),
        a = f
          .slice(0, 5)
          .map(([e, t]) => [s + r * (e + 0.008), t, i * (e + 0.008)]);
      e.add(q.tube(a, 0.016, { radial: 5, segs: 6 }), {
        ...Z,
        bone: `head`,
        occluder: !1,
        keep: 1,
      });
    }
    for (let t = 0; t < 6; t++) {
      let n = l + 0.45 + (t / 5) * (u - 0.9);
      e.add(q.sphere(0.02, 0.02, 0.02, 7, 5), {
        ...Z,
        at: [s + Math.sin(n) * 0.19, 0.918, Math.cos(n) * 0.19],
        bone: `head`,
        occluder: !1,
        keep: 0,
      });
    }
    e.add(q.torus(0.172, 0.023, 6, 24), {
      ...Z,
      at: [s, 0.872, 0],
      rot: [Y / 2, 0, 0],
      bone: `head`,
      keep: 1,
    });
    let p = (e) => {
      let t = e.x - s,
        n = e.z,
        r = Math.hypot(t, n);
      if (r < 1e-4) return;
      let i = Math.max(
          0,
          Math.cos(Math.min(Y / 2, Math.abs(Math.atan2(n, t)) * 1.8)),
        ),
        a = 0.176 + (r - 0.176) * (0.04 + 0.96 * i * i * i);
      ((e.x = s + (t / r) * a), (e.z = (n / r) * a), (e.y -= (1 - i) * 0.022));
    };
    (e.add(
      q.latheArc(
        [
          [0.176, 1.036],
          [0.242, 1.049],
          [0.3, 1.064],
          [0.268, 1.081],
          [0.17, 1.078],
        ],
        22,
        Y / 2 - 1.31,
        2.62,
      ),
      {
        ...Z,
        flat: !0,
        grad: [0.72, 1.22],
        at: [s, 0, 0],
        bone: `head`,
        deform: p,
      },
    ),
      e.add(
        q.latheArc(
          [
            [0.174, 1.03],
            [0.236, 1.041],
            [0.292, 1.056],
          ],
          20,
          Y / 2 - 1.31,
          2.62,
        ),
        {
          ...Si,
          at: [s, 0, 0],
          bone: `head`,
          deform: p,
          occluder: !1,
          keep: 1,
        },
      ));
    let m = Oi(Q, 0.135, 1.038);
    (e.add(q.box(0.022, 0.058, 0.26, 0.009), {
      ...Z,
      at: m(0.022, 0.02),
      rot: [0, 0, Q],
      bone: `head`,
      keep: 1,
    }),
      e.add(q.box(0.02, 0.112, 0.238, 0.008), {
        ...Si,
        at: m(0.076, 0),
        rot: [0, 0, Q],
        bone: `head`,
        recvAO: !1,
      }),
      e.add(q.box(0.024, 0.1, 0.04, 0.008), {
        ...vi,
        at: m(0.078, 0.022),
        rot: [0, 0, Q],
        bone: `head`,
        keep: 1,
      }),
      e.add(q.box(0.026, 0.078, 0.205, 0.01), {
        color: X(`steelDk`),
        kind: [K.metal, K.iron],
        metal: 0.3,
        at: m(0.148, 0.004),
        rot: [0, 0, Q],
        bone: `head`,
      }),
      e.add(q.box(0.02, 0.026, 0.185, 0.007), {
        ...vi,
        at: m(0.116, 0.022),
        rot: [0, 0, Q],
        bone: `head`,
        occluder: !1,
        keep: 1,
      }),
      e.add(q.sphere(0.024, 0.042, 0.054, 9, 7), {
        color: X(`eye`),
        kind: K.eye,
        emit: 1.95,
        at: m(0.066, 0.03, 0.052),
        rot: [0, 0, Q],
        bone: `head`,
        mirror: !0,
        occluder: !1,
        recvAO: !1,
      }),
      e.add(q.sphere(0.016, 0.054, 0.07, 9, 7), {
        color: X(`glow`),
        kind: K.eye,
        emit: 1.7,
        at: m(0.066, 0.024, 0.052),
        rot: [0, 0, Q],
        bone: `head`,
        mirror: !0,
        occluder: !1,
        recvAO: !1,
      }),
      e.add(
        q.extrude(
          [
            [0.1, 0],
            [0.05, 0.055],
            [-0.05, 0.05],
            [-0.14, 0.075],
            [-0.22, 0.03],
            [-0.25, -0.03],
            [0.1, -0.05],
          ],
          0.03,
          0.01,
          3,
          1,
        ),
        { ...mi, team: 1, at: [-0.01, 1.185, 0], bone: `head`, keep: 1 },
      ),
      e.add(
        q.extrude(
          [
            [-0.03, -0.055],
            [0.055, -0.045],
            [0.07, 0.03],
            [0.02, 0.075],
            [-0.05, 0.055],
          ],
          0.022,
          0.008,
          3,
          1,
        ),
        {
          ...li,
          team: 3,
          flat: !0,
          at: [0.1, 0.962, 0.158],
          rot: [0, Y / 2 - 0.28, 0],
          bone: `head`,
          mirror: !0,
        },
      ),
      e.add(q.box(0.018, 0.02, 0.1, 0.006), {
        ...vi,
        team: 3,
        at: [0.13, 0.996, 0.152],
        rot: [0, 0, 0.5],
        bone: `head`,
        mirror: !0,
        occluder: !1,
        keep: 1,
      }),
      e.add(q.cyl(0.062, 0.062, 0.3, 9), {
        ...pi,
        team: 3,
        at: [-0.19, 0.8, 0],
        rot: [Y / 2, 0, 0.1],
        bone: `torso`,
      }));
    for (let t of [-0.09, 0.09])
      e.add(q.torus(0.066, 0.013, 4, 12), {
        ...fi,
        team: 3,
        at: [-0.19, 0.8, t],
        rot: [0, 0, 0.1],
        bone: `torso`,
        occluder: !1,
        keep: 1,
      });
    return (
      e.add(
        q.latheArc(
          [
            [0.186, 0.9],
            [0.196, 0.872],
            [0.188, 0.836],
            [0.16, 0.816],
          ],
          12,
          Y / 2 + 1.28,
          2.72,
        ),
        {
          ...bi,
          team: 4,
          flat: !0,
          grad: [0.52, 1.1],
          at: [s, 0, 0],
          bone: `head`,
        },
      ),
      e.add(
        q.latheArc(
          [
            [0.196, 0.874],
            [0.204, 0.858],
          ],
          12,
          Y / 2 + 1.28,
          2.72,
        ),
        { ...Z, team: 4, at: [s, 0, 0], bone: `head`, occluder: !1, keep: 1 },
      ),
      e.add(q.box(0.085, 0.1, 0.075, 0.022), {
        ...pi,
        team: 4,
        at: [-0.02, 0.455, 0.185],
        rot: [0, 0, 0.12],
        bone: `pelvis`,
      }),
      e.add(q.box(0.092, 0.02, 0.082, 0.008), {
        ...vi,
        team: 4,
        at: [-0.02, 0.508, 0.185],
        rot: [0, 0, 0.12],
        bone: `pelvis`,
        occluder: !1,
        keep: 1,
      }),
      e.add(q.crystal(0.035, 0.17, 6), {
        ...gi,
        team: 1,
        emit: 2.3,
        at: [0.08, 1.19, 0],
        rot: [0, 0, 0.22],
        bone: `head`,
        localGrad: !0,
        grad: [0.85, 1.12],
        keep: 1,
      }),
      e.add(
        q.tube(
          [
            [0.13, 1.17, 0],
            [0.03, 1.25, 0],
            [-0.1, 1.27, 0],
            [-0.22, 1.2, 0],
            [-0.28, 1.06, 0],
          ],
          (e) => 0.03 + 0.045 * Math.sin(Math.min(1, e * 1.25) * Y),
          { radial: 8, segs: 16, sx: 1.3, sy: 0.38 },
        ),
        { color: oi.crest, tip: `#5d8cff`, kind: K.fur, team: 1, bone: `head` },
      ),
      e.add(
        q.extrude(
          [
            [0.12, 0],
            [0.06, 0.08],
            [-0.02, 0.06],
            [-0.1, 0.1],
            [-0.18, 0.05],
            [-0.25, 0.07],
            [-0.3, -0.02],
            [0.12, -0.04],
          ],
          0.024,
          0.008,
          3,
          1,
        ),
        {
          color: si.steelDk,
          kind: K.iron,
          team: 7,
          at: [0, 1.19, 0],
          bone: `head`,
        },
      ),
      e.add(
        q.extrude(
          [
            [0.1, 0],
            [0.06, 0.065],
            [-0.02, 0.045],
            [-0.1, 0.085],
            [-0.18, 0.035],
            [-0.24, 0.055],
            [-0.27, 0],
          ],
          0.012,
          0.004,
          3,
          1,
        ),
        {
          color: si.crest,
          kind: K.eye,
          emit: 1.5,
          team: 7,
          at: [0, 1.215, 0],
          bone: `head`,
          occluder: !1,
        },
      ),
      J(e, [0.03, 1.08, 0.175], [-0.15, 0.55, 1], 0.28, 0.046, {
        color: `#2e2624`,
        tip: `#e2d4ba`,
        kind: K.bone,
        team: 8,
        bend: [-0.45, 0.35, -0.25],
        bone: `head`,
        mirror: !0,
        collar: !0,
        collarColor: si.steel,
      }),
      e.build({ aoFloor: 0.62 })
    );
  }
  function Ai(e, t, n) {
    let r = e.d,
      i = t.walk,
      a = t.phase,
      o = t.t,
      s = 1 - i,
      c = Math.sin(a),
      l = Math.cos(a),
      u = t.seed * 2 - 1,
      d = t.seed * 8 - Math.floor(t.seed * 8) < 0.5 ? -1 : 1;
    r[n.armR * 9 + 2] += d * 0.44;
    let f = t.seed * 16 - Math.floor(t.seed * 16) < 0.5 ? 1 : -1;
    ((r[n.armL * 9 + 1] += f > 0 ? -0.12 : 0.61),
      (r[n.armL * 9 + 2] += f > 0 ? 0.28 : -0.42),
      (r[n.armL * 9 + 0] += f > 0 ? 0 : 0.18),
      (r[n.armR * 9 + 0] += u * 0.16),
      (r[n.armR * 9 + 1] += u * 0.09),
      (r[n.head * 9 + 1] += u * 0.11),
      (r[n.torso * 9 + 1] += u * 0.07),
      (r[n.torso * 9 + 0] += u * 0.06),
      (r[n.torso * 9 + 4] += Math.sin(o * 2.1) * 0.008 * s),
      (r[n.head * 9 + 2] += Math.sin(o * 0.9) * 0.05 * s),
      (r[n.head * 9 + 1] += Math.sin(o * 0.37) * 0.3 * s),
      (r[n.armL * 9 + 2] += 0.95),
      (r[n.armL * 9 + 1] += -0.2),
      (r[n.armL * 9 + 0] += 0.05),
      (r[n.armR * 9 + 2] += 0.62),
      (r[n.armR * 9 + 0] += -0.08),
      (r[n.thighR * 9 + 2] += 0.08 * s),
      (r[n.shinR * 9 + 2] += -0.12 * s),
      (r[n.thighL * 9 + 2] += -0.12 * s),
      (r[n.shinL * 9 + 2] += -0.05 * s),
      (r[n.thighR * 9 + 2] += c * 0.95 * i),
      (r[n.thighL * 9 + 2] += -c * 0.95 * i),
      (r[n.shinR * 9 + 2] += -Math.max(0, l) * 1.2 * i - 0.1 * i),
      (r[n.shinL * 9 + 2] += -Math.max(0, -l) * 1.2 * i - 0.1 * i),
      (r[n.pelvis * 9 + 4] += (Math.abs(l) - 0.64) * 0.165 * i),
      (r[n.pelvis * 9 + 0] += c * 0.12 * i),
      (r[n.pelvis * 9 + 1] += -c * 0.14 * i),
      (r[n.pelvis * 9 + 2] += -0.1 * i),
      (r[n.torso * 9 + 1] += c * 0.2 * i),
      (r[n.torso * 9 + 0] += -c * 0.175 * i),
      (r[n.torso * 9 + 2] += -0.2 * i),
      (r[n.head * 9 + 2] += 0.2 * i),
      (r[n.head * 9 + 0] += c * 0.09 * i),
      (r[n.armR * 9 + 2] += -c * 0.55 * i),
      (r[n.armL * 9 + 2] += c * 0.14 * i),
      (r[n.tabF * 9 + 2] +=
        0.22 * i + Math.abs(c) * 0.18 * i + Math.sin(o * 1.9) * 0.03 * s),
      (r[n.tabF * 9 + 0] += c * 0.08 * i),
      (r[n.tabB * 9 + 2] +=
        0.35 * i + Math.abs(l) * 0.15 * i + Math.sin(o * 1.9 + 1) * 0.03 * s));
    let p = t.antic,
      m = t.strike;
    (t.atkVar === 0
      ? ((r[n.armR * 9 + 2] += 2.25 * p - 1.05 * m),
        (r[n.armR * 9 + 0] += 0.25 * p),
        (r[n.torso * 9 + 2] += 0.2 * p - 0.34 * m),
        (r[n.torso * 9 + 1] += 0.3 * p - 0.22 * m),
        (r[n.root * 9 + 3] += 0.13 * m),
        (r[n.thighR * 9 + 2] += -0.25 * m),
        (r[n.thighL * 9 + 2] += 0.4 * m),
        (r[n.armL * 9 + 2] += -0.2 * p))
      : ((r[n.armL * 9 + 2] += 0.2 * p + 0.35 * m),
        (r[n.torso * 9 + 1] += 0.45 * p - 0.35 * m),
        (r[n.armR * 9 + 2] += 1.1 * p + 0.9 * m),
        (r[n.armR * 9 + 1] += 0.75 * p - 0.45 * m),
        (r[n.torso * 9 + 2] += 0.1 * p - 0.28 * m),
        (r[n.root * 9 + 3] += 0.18 * m),
        (r[n.thighR * 9 + 2] += 0.45 * m),
        (r[n.thighL * 9 + 2] += -0.3 * m)),
      (r[n.tabF * 9 + 2] += 0.25 * m));
  }
  function ji() {
    let e = new Xr(
        [
          [`root`, null, [0, 0, 0]],
          [`hips`, `root`, [0, 0.38, 0]],
          [`chest`, `hips`, [0, 0.52, 0]],
          [`head`, `chest`, [0.02, 0.76, 0]],
          [`armR`, `chest`, [0, 0.7, 0.19]],
          [`armL`, `chest`, [0, 0.7, -0.19]],
          [`staff`, `armR`, [0.13, 0.45, 0.26]],
          [`orb`, `staff`, [0.46, 1.24, 0.46]],
          [`hem`, `hips`, [0, 0.34, 0]],
          [`footR`, `root`, [0.02, 0.06, 0.105]],
          [`footL`, `root`, [0.02, 0.06, -0.105]],
        ],
        { seed: 23, texScale: 3.4 },
      ),
      t = (e, t) =>
        t > 0.52
          ? [`chest`]
          : t > 0.36
            ? [`hips`, `chest`, (t - 0.36) / 0.16]
            : [`hips`, `hem`, Math.min(1, (0.36 - t) / 0.28)],
      n = (e) => {
        let t = Math.atan2(e.z, e.x),
          n = Math.max(0, Math.min(1, (0.6 - e.y) / 0.5)),
          r = 1 + 0.085 * n * Math.sin(t * 9 + 0.4) - 0.02 * n;
        ((e.x *= r), (e.z *= r));
      },
      r = (e) => {
        let t = Math.atan2(e.z, e.x),
          n = Math.max(0, Math.min(1, (0.47 - e.y) / 0.14));
        e.y += n * 0.052 * (0.5 + 0.5 * Math.cos(t * 7 + 0.5));
      },
      i = (e) => {
        (n(e), r(e));
      };
    (e.add(
      q.lathe(
        [
          [0, 0.73],
          [0.088, 0.72],
          [0.128, 0.665],
          [0.134, 0.57],
          [0.14, 0.47],
          [0.152, 0.4],
        ],
        28,
      ),
      { ...Ti, skin: t, deform: n, grad: [0.52, 1.1] },
    ),
      e.add(
        q.lathe(
          [
            [0.152, 0.4],
            [0.163, 0.36],
            [0.166, 0.335],
            [0.16, 0.322],
          ],
          28,
        ),
        { ...Ti, skin: t, deform: i, grad: [0.58, 1] },
      ),
      e.add(
        q.latheInner(
          [
            [0.16, 0.32],
            [0.148, 0.4],
            [0.13, 0.5],
            [0.095, 0.6],
            [0, 0.62],
          ],
          24,
        ),
        { ...Si, skin: t, deform: i, grad: [0.3, 0.6], ao: !1 },
      ));
    for (let n = 0; n < 10; n++) {
      let r = (n / 10) * Y * 2 + 0.31,
        i = !(n & 1),
        a = 0.166,
        o = i ? 0.074 : 0.086;
      e.add(
        q.extrude(
          [
            [-0.044, 0],
            [0.044, 0],
            [0.034, -o],
            [0, -o - 0.022],
            [-0.034, -o],
          ],
          0.012,
          0.005,
          3,
          1,
        ),
        {
          ...(i ? Z : Ti),
          flat: !0,
          grad: i ? [0.85, 1.12] : [0.62, 0.95],
          at: [Math.cos(r) * a, 0.392, Math.sin(r) * a],
          rot: [0.16, -r + Y / 2, 0],
          order: `XYZ`,
          skin: t,
          keep: 1,
        },
      );
    }
    (e.add(
      q.lathe(
        [
          [0.164, 0.338],
          [0.158, 0.318],
        ],
        24,
      ),
      { ...Si, skin: t, deform: i, occluder: !1, keep: 1 },
    ),
      e.add(q.cyl(0.046, 0.04, 0.26, 9), {
        ...fi,
        color: X(`clothDk`),
        at: [0.005, 0.2, 0.122],
        bone: `footR`,
        mirror: !0,
      }),
      e.add(q.box(0.175, 0.068, 0.104, 0.026), {
        ...fi,
        at: [0.072, 0.034, 0.122],
        bone: `footR`,
        mirror: !0,
      }),
      e.add(q.box(0.07, 0.024, 0.092, 0.008), {
        ...vi,
        at: [0.128, 0.068, 0.122],
        rot: [0, 0, -0.2],
        bone: `footR`,
        mirror: !0,
        occluder: !1,
        keep: 1,
      }),
      e.add(q.box(0.018, 0.34, 0.085, 0.007), {
        ...Si,
        at: [0.15, 0.5, 0],
        rot: [0, 0, 0.14],
        skin: t,
      }),
      e.add(q.box(0.02, 0.34, 0.02, 0.005), {
        ...Z,
        at: [0.153, 0.5, 0.048],
        rot: [0, 0, 0.14],
        skin: t,
        mirror: !0,
        keep: 1,
      }),
      e.add(q.torus(0.152, 0.026, 6, 20), {
        ...pi,
        at: [0, 0.5, 0],
        rot: [Y / 2, 0, 0],
        bone: `hips`,
      }),
      e.add(
        q.extrude(
          [
            [-0.032, 0],
            [0.032, 0],
            [0.027, -0.19],
            [0, -0.23],
            [-0.027, -0.19],
          ],
          0.013,
          0.005,
          3,
          1,
        ),
        {
          ...wi,
          color: X(`clothDk`),
          at: [0.115, 0.49, -0.11],
          rot: [0, 1, 0.1],
          order: `ZYX`,
          bone: `hips`,
          keep: 1,
        },
      ),
      e.add(q.gem(0.032, 0.064), {
        ...gi,
        at: [0.163, 0.5, 0],
        scale: [0.45, 1.15, 0.95],
        bone: `hips`,
        emit: 1.8,
        keep: 1,
      }),
      e.add(
        q.lathe(
          [
            [0.06, 0.79],
            [0.115, 0.768],
            [0.156, 0.716],
            [0.17, 0.655],
            [0.16, 0.638],
            [0.082, 0.664],
          ],
          12,
        ),
        {
          color: [`#3d4a60`, si.steelDk],
          kind: [K.marble, K.iron],
          kind2: K.metal,
          w2: 0.5,
          tex: 1.5,
          metal: 0.1,
          rough: 0.6,
          grad: [0.66, 1.08],
          bone: `chest`,
          flat: !0,
        },
      ),
      e.add(q.torus(0.166, 0.014, 4, 14), {
        ...Z,
        flat: !0,
        at: [0, 0.646, 0],
        rot: [Y / 2, 0, 0],
        bone: `chest`,
        keep: 1,
      }),
      e.add(
        q.lathe(
          [
            [0.09, 0.73],
            [0.15, 0.697],
            [0.19, 0.632],
            [0.202, 0.578],
            [0.19, 0.565],
            [0.09, 0.628],
          ],
          16,
        ),
        {
          ...Di,
          color: [`#3d6ad8`, `#d1462a`],
          grad: [0.62, 1.16],
          bone: `chest`,
          deform: (e) => {
            let t = Math.atan2(e.z, e.x),
              n = 1 + 0.045 * Math.sin(t * 7 + 0.3);
            ((e.x *= n), (e.z *= n));
          },
        },
      ),
      e.add(q.torus(0.198, 0.016, 5, 22), {
        ...Z,
        at: [0, 0.574, 0],
        rot: [Y / 2, 0, 0],
        bone: `chest`,
        occluder: !1,
        keep: 1,
      }));
    for (let t = 0; t < 5; t++) {
      let n = Y + (t - 2) * 0.46;
      e.add(q.sphere(0.02, 0.02, 0.02, 7, 5), {
        ...Z,
        team: 1,
        at: [Math.cos(n + Y) * 0.16, 0.693, Math.sin(n + Y) * 0.16],
        bone: `chest`,
        keep: 0,
      });
    }
    for (let t = 0; t < 4; t++) {
      let n = -0.95 + t * 0.63;
      J(
        e,
        [Math.cos(n + Y) * 0.15, 0.752, Math.sin(n + Y) * 0.15],
        [Math.cos(n + Y) * 0.6, 1, Math.sin(n + Y) * 0.6],
        0.1,
        0.022,
        { ...Ci, bone: `chest`, radial: 5, segs: 4, keep: 1 },
      );
    }
    let a = (e) => {
        let t = Math.atan2(e.z, e.x - 0),
          n = 1 + 0.05 * Math.sin(t * 6) * Math.max(0, (e.y - 0.9) / 0.3);
        e.z *= n;
      },
      o = 2.27,
      s = Y / 2 + o / 2,
      c = Y * 2 - o,
      l = (e) => {
        let t = Math.max(0, e.y - 1.05);
        e.x -= 1.6 * t * Math.sqrt(t);
      };
    (e.add(
      q.lathe(
        [
          [0.104, 0.905],
          [0.112, 0.868],
          [0.1, 0.822],
          [0.074, 0.806],
        ],
        18,
      ),
      { ...Si, at: [-0.028, 0, 0], bone: `head` },
    ),
      e.add(q.torus(0.106, 0.014, 5, 18), {
        ...vi,
        at: [-0.028, 0.872, 0],
        rot: [Y / 2, 0, 0],
        bone: `head`,
        occluder: !1,
        keep: 1,
      }),
      e.frame([-0.045, 0.95, 0], [0, 0, -0.3], 1, () => {
        (e.add(
          q.latheArc(
            [
              [0.078, -0.085],
              [0.1, -0.01],
              [0.105, 0.055],
            ],
            18,
            s,
            c,
          ),
          { ...Ei, bone: `head`, deform: a, grad: [0.5, 1.06], flat: !1 },
        ),
          e.add(
            q.latheInner(
              [
                [0.072, -0.088],
                [0.093, -0.01],
                [0.098, 0.06],
                [0.099, 0.12],
                [0.086, 0.16],
              ],
              18,
            ),
            {
              ...Si,
              color: [`#070a18`, `#0c0605`],
              bone: `head`,
              ao: !1,
              recvAO: !1,
            },
          ));
        let t = (e) => {
          let t = Math.hypot(e.x, e.z);
          if (t < 1e-4) return;
          let n = Math.max(
              0,
              Math.cos(Math.min(Y / 2, Math.abs(Math.atan2(e.z, e.x)) * 1.8)),
            ),
            r = 0.104 + (t - 0.104) * (0.05 + 0.95 * n * n * n);
          ((e.x = (e.x / t) * r),
            (e.z = (e.z / t) * r),
            (e.y -= (1 - n) * 0.02));
        };
        (e.add(
          q.latheArc(
            [
              [0.104, 0.048],
              [0.152, 0.062],
              [0.198, 0.08],
              [0.172, 0.096],
              [0.1, 0.094],
            ],
            20,
            Y / 2 - 1.28,
            2.56,
          ),
          { ...Z, flat: !0, grad: [0.72, 1.22], bone: `head`, deform: t },
        ),
          e.add(
            q.latheArc(
              [
                [0.102, 0.042],
                [0.148, 0.054],
                [0.192, 0.072],
              ],
              18,
              Y / 2 - 1.28,
              2.56,
            ),
            { ...Si, bone: `head`, deform: t, occluder: !1, keep: 1 },
          ),
          e.add(
            q.lathe(
              [
                [0.105, 0.055],
                [0.11, 0.115],
                [0.1, 0.175],
                [0.074, 0.225],
                [0.036, 0.254],
                [0, 0.262],
              ],
              20,
            ),
            {
              ...Ei,
              bone: `head`,
              deform: (e) => {
                (a(e), l(e));
              },
              grad: [0.62, 1.3],
              flat: !1,
            },
          ),
          e.add(q.torus(0.104, 0.013, 5, 20, c), {
            ...Z,
            at: [0, 0.052, 0],
            rot: [Y / 2, 0, -s - c / 2],
            order: `ZYX`,
            bone: `head`,
            occluder: !1,
            keep: 1,
          }),
          e.add(q.crystal(0.022, 0.085, 5), {
            ...gi,
            team: 1,
            at: [0, 0.25, 0],
            rot: [0, 0, 0.5],
            deform: l,
            emit: 2.3,
            bone: `head`,
            localGrad: !0,
            grad: [0.85, 1.12],
            keep: 1,
          }),
          e.add(
            q.tube(
              [
                [-0.108, 0.06, 0],
                [-0.113, 0.12, 0],
                [-0.104, 0.175, 0],
                [-0.077, 0.226, 0],
                [-0.036, 0.256, 0],
                [0, 0.263, 0],
              ],
              (e) => 0.011 - 0.004 * e,
              { radial: 5, segs: 8 },
            ),
            { ...Z, bone: `head`, deform: l, occluder: !1, keep: 1 },
          ),
          e.add(q.cone(0.04, 0.12, 6), {
            color: si.steelDk,
            kind: K.iron,
            team: 2,
            at: [0, 0.29, 0],
            rot: [0, 0, 0.55],
            deform: l,
            bone: `head`,
            flat: !0,
          }));
      }),
      e.add(
        q.extrude(
          [
            [-0.035, 0],
            [0.035, 0],
            [0.028, -0.22],
            [0, -0.28],
            [-0.03, -0.2],
          ],
          0.014,
          0.005,
          3,
          1,
        ),
        {
          ...Di,
          team: 3,
          at: [-0.02, 0.7, 0.155],
          rot: [0, -0.9, 0.22],
          order: `ZYX`,
          bone: `chest`,
          keep: 1,
        },
      ),
      e.add(q.box(0.036, 0.018, 0.16, 0.006), {
        ...Z,
        team: 3,
        at: [0.02, 0.712, 0.13],
        rot: [0, -0.9, 0.22],
        order: `ZYX`,
        bone: `chest`,
        occluder: !1,
        keep: 1,
      }));
    for (let t of [-0.085, 0.085])
      e.add(
        q.tube(
          [
            [-0.1, 1, t],
            [-0.14, 0.92, t * 1.2],
            [-0.15, 0.8, t * 1.3],
          ],
          (e) => 0.026 * (1 - e * 0.6) + 0.008,
          { radial: 6, segs: 6 },
        ),
        { ...Ei, tip: X(`clothDk`), team: 4, bone: `head`, keep: 1 },
      );
    for (let t = 0; t < 7; t++) {
      let n = Y + (t - 3) * 0.34;
      e.add(q.sphere(0.022, 0.022, 0.022, 7, 5), {
        ...Z,
        team: 4,
        at: [Math.cos(n + Y) * 0.172, 0.706, Math.sin(n + Y) * 0.172],
        bone: `chest`,
        keep: 1,
      });
    }
    e.add(
      q.tube(
        [
          [-0.095, 1.05, 0],
          [-0.17, 1.1, 0],
          [-0.25, 1.08, 0],
          [-0.31, 0.97, 0],
        ],
        (e) => 0.075 * (1 - e) ** 1.1 + 0.011,
        { radial: 8, segs: 8 },
      ),
      { ...Ei, tip: X(`clothDk`), bone: `head`, keep: 1 },
    );
    let u = Oi(Q, 0.07, 0.998);
    (e.add(q.sphere(0.07, 0.1, 0.105, 12, 9), {
      ..._i,
      grad: [0.28, 0.7],
      at: [0.034, 0.945, 0],
      bone: `head`,
      recvAO: !1,
    }),
      e.add(q.box(0.02, 0.05, 0.245, 0.008), {
        ...Z,
        at: u(0.02, 0.018),
        rot: [0, 0, Q],
        bone: `head`,
      }),
      e.add(q.box(0.018, 0.09, 0.2, 0.007), {
        ...Si,
        at: u(0.066, 0),
        rot: [0, 0, Q],
        bone: `head`,
        recvAO: !1,
      }),
      e.add(q.box(0.02, 0.078, 0.036, 0.007), {
        ...vi,
        at: u(0.066, 0.02),
        rot: [0, 0, Q],
        bone: `head`,
        keep: 1,
      }),
      e.add(q.box(0.022, 0.06, 0.175, 0.008), {
        color: X(`steelDk`),
        kind: [K.metal, K.iron],
        metal: 0.28,
        at: u(0.126, 0.002),
        rot: [0, 0, Q],
        bone: `head`,
        keep: 1,
      }),
      e.add(q.box(0.016, 0.03, 0.19, 0.006), {
        ...Z,
        at: u(0.1, 0.02),
        rot: [0, 0, Q],
        bone: `head`,
        occluder: !1,
        keep: 1,
      }),
      e.add(q.sphere(0.02, 0.036, 0.046, 9, 7), {
        color: X(`eye`),
        kind: K.eye,
        emit: 1.98,
        at: u(0.056, 0.026, 0.056),
        rot: [0, 0, Q],
        bone: `head`,
        mirror: !0,
        occluder: !1,
        recvAO: !1,
      }),
      e.add(q.sphere(0.014, 0.046, 0.06, 9, 7), {
        color: X(`glow`),
        kind: K.eye,
        emit: 1.7,
        at: u(0.056, 0.02, 0.056),
        rot: [0, 0, Q],
        bone: `head`,
        mirror: !0,
        occluder: !1,
        recvAO: !1,
      }),
      J(e, [0.03, 1.065, 0.09], [-0.3, 0.8, 0.5], 0.14, 0.03, {
        color: `#2e2624`,
        tip: `#dccdb2`,
        kind: K.bone,
        team: 2,
        bend: [-0.5, 0.1, 0.1],
        bone: `head`,
        mirror: !0,
        keep: 1,
      }),
      e.add(q.cyl(0.036, 0.078, 0.23, 8), {
        ...Ti,
        at: [0.036, 0.565, 0.163],
        rot: [0.12, 0, 0.16],
        bone: `armR`,
        mirror: !0,
      }),
      e.add(q.torus(0.074, 0.016, 4, 12), {
        ...Z,
        at: [0.066, 0.468, 0.176],
        rot: [Y / 2 + 0.12, 0, 0.16],
        bone: `armR`,
        mirror: !0,
        keep: 1,
      }),
      e.add(q.sphere(0.052, 0.048, 0.05, 9, 7), {
        ...fi,
        at: [0.09, 0.45, 0.19],
        bone: `armR`,
        mirror: !0,
        keep: 1,
      }));
    let d = [0.46, 1.24, 0.46];
    (e.add(
      q.tube(
        [
          [-0.02, 0.05, 0.19],
          [0.06, 0.4, 0.24],
          [0.2, 0.72, 0.31],
          [0.37, 1.06, 0.41],
          [0.45, 1.2, 0.45],
        ],
        (e) => 0.02 - 0.005 * e,
        { radial: 6, segs: 12 },
      ),
      { color: X(`wood`), kind: K.wood, bone: `staff` },
    ),
      e.add(q.cone(0.026, 0.075, 6), {
        ...Z,
        at: [-0.03, 0.03, 0.188],
        rot: [0, 0, 0.18],
        bone: `staff`,
        keep: 1,
      }),
      e.add(q.cyl(0.028, 0.028, 0.1, 6), {
        ...fi,
        at: [0.11, 0.51, 0.265],
        rot: [0, 0, -0.32],
        bone: `staff`,
        keep: 1,
      }),
      e.add(q.sphere(0.055, 0.05, 0.052, 10, 8), {
        ...fi,
        at: [0.11, 0.51, 0.265],
        rot: [0, 0, -0.32],
        bone: `staff`,
        keep: 1,
      }),
      e.add(q.box(0.03, 0.026, 0.092, 0.009), {
        ...pi,
        at: [0.138, 0.523, 0.262],
        rot: [0, 0, 0.55],
        bone: `staff`,
        occluder: !1,
        keep: 1,
      }),
      e.add(q.torus(0.058, 0.017, 5, 14), {
        ...Z,
        at: [0.085, 0.468, 0.268],
        rot: [Y / 2 - 0.5, 0, -0.32],
        bone: `staff`,
        occluder: !1,
        keep: 1,
      }),
      e.add(
        q.tube(
          [
            [0.285, 0.895, 0.365],
            [0.37, 1.06, 0.41],
            [0.445, 1.195, 0.448],
          ],
          (e) => 0.023 - 0.003 * e,
          { radial: 6, segs: 8 },
        ),
        {
          color: [`#2f9fc4`, `#c2642a`],
          tip: [`#8eeaff`, `#ffb070`],
          tipFrom: 0.2,
          kind: K.crystal,
          emit: 0.9,
          rough: 0.3,
          bone: `staff`,
          occluder: !1,
          keep: 1,
        },
      ),
      e.add(q.cyl(0.031, 0.022, 0.075, 6), {
        ...Z,
        at: [0.41, 1.14, 0.435],
        rot: [0, 0, -0.55],
        bone: `staff`,
        keep: 1,
      }),
      e.add(q.torus(0.09, 0.015, 4, 14, Y * 1.25), {
        ...Z,
        team: 1,
        at: [d[0] - 0.03, d[1] - 0.02, d[2] - 0.03],
        rot: [0, Y / 2, -Y * 0.125 - Y / 2],
        bone: `staff`,
        keep: 1,
      }));
    for (let t = 0; t < 3; t++) {
      let n = (t / 3) * Y * 2 + 0.5;
      J(
        e,
        [
          d[0] - 0.04 + Math.cos(n) * 0.032,
          d[1] - 0.075,
          d[2] - 0.03 + Math.sin(n) * 0.032,
        ],
        [Math.cos(n) * 0.5, 1, Math.sin(n) * 0.5],
        0.15,
        0.018,
        {
          ...Ci,
          bend: [-Math.cos(n) * 0.9, 0.2, -Math.sin(n) * 0.9],
          bone: `staff`,
          radial: 5,
          segs: 5,
          keep: 1,
        },
      );
    }
    (e.add(q.crystal(0.088, 0.2, 12, 0.36, 0.3), {
      color: [`#79e4ff`, `#ffae5c`],
      kind: K.crystal,
      emit: 2.15,
      rough: 0.1,
      flat: !0,
      at: [d[0], d[1] - 0.1, d[2]],
      bone: `orb`,
      occluder: !1,
      recvAO: !1,
      localGrad: !0,
      grad: [0.8, 1.2],
    }),
      e.add(q.gem(0.03, 0.05, 6), {
        color: [`#e8fbff`, `#ffe2bd`],
        kind: K.crystal,
        emit: 2.2,
        rough: 0.06,
        flat: !0,
        at: [d[0] + 0.012, d[1] + 0.078, d[2] + 0.012],
        bone: `orb`,
        occluder: !1,
        recvAO: !1,
        keep: 1,
      }));
    for (let t = 0; t < 2; t++) {
      let n = t * Y + 0.9;
      e.add(q.crystal(0.024, 0.09, 5, 0.35, 0.2), {
        color: X(`gem`),
        kind: K.crystal,
        emit: 1.05,
        rough: 0.15,
        flat: !0,
        localGrad: !0,
        grad: [1.1, 0.6],
        at: [
          d[0] + Math.cos(n) * 0.072,
          d[1] - 0.075,
          d[2] + Math.sin(n) * 0.072,
        ],
        rot: [Math.sin(n) * 0.4, 0, -Math.cos(n) * 0.4],
        bone: `orb`,
        occluder: !1,
        keep: 1,
      });
    }
    return e.build({ aoFloor: 0.62 });
  }
  function Mi(e, t, n) {
    let r = e.d,
      i = t.walk,
      a = t.phase,
      o = t.t,
      s = 1 - i,
      c = Math.sin(a),
      l = Math.cos(a),
      u = t.seed * 2 - 1,
      d = t.seed * 8 - Math.floor(t.seed * 8);
    ((r[n.staff * 9 + 2] += (d < 0.5 ? -1 : 1) * 0.44),
      (r[n.head * 9 + 2] +=
        t.seed * 4 - Math.floor(t.seed * 4) < 0.5 ? 0 : 0.3),
      (r[n.staff * 9 + 0] += u * 0.16),
      (r[n.staff * 9 + 1] += u * 0.12),
      (r[n.head * 9 + 1] += u * 0.11),
      (r[n.chest * 9 + 1] += u * 0.07),
      (r[n.hips * 9 + 4] += Math.sin(o * 2.4) * 0.01 * s),
      (r[n.chest * 9 + 2] += Math.sin(o * 2.4 + 0.6) * 0.03 * s),
      (r[n.armR * 9 + 2] += 0.3),
      (r[n.armR * 9 + 0] += -0.05),
      (r[n.armL * 9 + 2] += 0.4 + Math.sin(o * 1.7) * 0.08 * s),
      (r[n.armL * 9 + 0] += 0.2),
      (r[n.armL * 9 + 1] += 0.3),
      (r[n.head * 9 + 1] += Math.sin(o * 0.5) * 0.35 * s),
      (r[n.head * 9 + 2] += -0.05 + Math.sin(o * 0.8) * 0.04 * s));
    {
      let e = n.footR * 9;
      ((r[e + 3] += c * 0.2 * i),
        (r[e + 4] += Math.max(0, l) * 0.085 * i),
        (r[e + 2] += -c * 0.3 * i));
    }
    {
      let e = n.footL * 9;
      ((r[e + 3] += -c * 0.2 * i),
        (r[e + 4] += Math.max(0, -l) * 0.085 * i),
        (r[e + 2] += c * 0.3 * i));
    }
    ((r[n.hips * 9 + 4] += (Math.abs(l) - 0.5) * 0.15 * i),
      (r[n.hips * 9 + 0] += c * 0.13 * i),
      (r[n.hips * 9 + 1] += -c * 0.1 * i),
      (r[n.chest * 9 + 2] += -0.2 * i),
      (r[n.chest * 9 + 0] += -c * 0.175 * i),
      (r[n.head * 9 + 0] += c * 0.1 * i),
      (r[n.hem * 9 + 0] += -c * 0.09 * i),
      (r[n.hem * 9 + 2] += -0.12 * i + l * 0.04 * i),
      (r[n.hem * 9 + 1] += c * 0.06 * i),
      (r[n.armR * 9 + 2] += -c * 0.15 * i),
      (r[n.armL * 9 + 2] += c * 0.25 * i),
      (r[n.head * 9 + 2] += 0.1 * i),
      (r[n.orb * 9 + 1] += o * 1.6),
      (r[n.orb * 9 + 4] += Math.sin(o * 3.3) * 0.012));
    let f = t.antic,
      p = t.strike;
    ((r[n.armR * 9 + 2] += 1.5 * f + 0.75 * p),
      (r[n.armR * 9 + 0] += 0.25 * f),
      (r[n.staff * 9 + 2] += -1.25 * f + 0.35 * p),
      (r[n.chest * 9 + 2] += 0.14 * f - 0.26 * p),
      (r[n.chest * 9 + 1] += 0.25 * f - 0.15 * p),
      (r[n.armL * 9 + 2] += 0.55 * f + 0.85 * p),
      (r[n.armL * 9 + 1] += -0.4 * p));
    {
      let e = n.root * 9;
      ((r[e + 3] += 0.07 * p), (r[e + 4] += 0.04 * f));
    }
    {
      let e = n.orb * 9,
        t = 1 + 0.3 * f + 0.2 * p;
      ((r[e + 6] *= t), (r[e + 7] *= t), (r[e + 8] *= t));
    }
    ((r[n.orb * 9 + 1] += 4 * f), (t.glowOut += 1.4 * f + 1 * p));
  }
  function Ni() {
    let e = new Xr(
        [
          [`root`, null, [0, 0, 0]],
          [`chassis`, `root`, [0, 0.42, 0]],
          [`wheelFR`, `chassis`, [0.4, 0.28, 0.35]],
          [`wheelBR`, `chassis`, [-0.4, 0.28, 0.35]],
          [`wheelFL`, `chassis`, [0.4, 0.28, -0.35]],
          [`wheelBL`, `chassis`, [-0.4, 0.28, -0.35]],
          [`turret`, `chassis`, [0.05, 0.75, 0]],
          [`barrel`, `turret`, [0.1, 0.94, 0]],
          [`core`, `chassis`, [-0.4, 0.7, 0]],
        ],
        { seed: 37, texScale: 2.8 },
      ),
      t = {
        color: [oi.marble, si.marble],
        kind: [K.marble, K.stone],
        rough: 0.6,
        vein: -0.8,
      };
    (e.add(q.box(1.08, 0.3, 0.52, 0.07, 2), {
      ...t,
      at: [0, 0.48, 0],
      bone: `chassis`,
    }),
      e.add(q.box(0.98, 0.11, 0.44, 0.035), {
        ...hi,
        at: [0, 0.3, 0],
        bone: `chassis`,
      }),
      e.add(q.box(1.12, 0.045, 0.56, 0.016), {
        ...Z,
        at: [0, 0.64, 0],
        bone: `chassis`,
        keep: 1,
      }),
      e.add(q.box(1.12, 0.045, 0.56, 0.016), {
        ...Z,
        at: [0, 0.345, 0],
        bone: `chassis`,
        keep: 1,
      }));
    for (let t of [-0.3, 0.3])
      e.add(q.box(0.05, 0.33, 0.57, 0.012), {
        ...li,
        at: [t, 0.49, 0],
        bone: `chassis`,
      });
    (e.add(
      q.extrude(
        [
          [-0.2, 0.1],
          [0.2, 0.1],
          [0.2, -0.08],
          [0, -0.13],
          [-0.2, -0.08],
        ],
        0.016,
        0.006,
        3,
        1,
      ),
      {
        ...ui,
        at: [-0.02, 0.5, 0.272],
        bone: `chassis`,
        mirror: !0,
        grad: [0.75, 1.05],
      },
    ),
      e.add(q.gem(0.05, 0.1), {
        ...gi,
        at: [-0.02, 0.5, 0.287],
        scale: [1, 1.2, 0.35],
        bone: `chassis`,
        mirror: !0,
        emit: 2.2,
        keep: 1,
      }),
      e.add(q.cone(0.18, 0.28, 4), {
        ...Z,
        team: 1,
        at: [0.66, 0.47, 0],
        rot: [Y / 4, 0, -Y / 2],
        order: `ZYX`,
        scale: [1, 1, 0.7],
        bone: `chassis`,
        flat: !0,
        keep: 1,
      }));
    for (let t = -1; t <= 1; t++)
      J(
        e,
        [0.54, 0.46 + Math.abs(t) * 0.04, t * 0.15],
        [1, 0.05, t * 0.3],
        0.24,
        0.045,
        { ...Ci, bone: `chassis` },
      );
    (e.add(q.cyl(0.035, 0.035, 0.84, 7), {
      ...hi,
      at: [0.4, 0.28, 0],
      rot: [Y / 2, 0, 0],
      bone: `chassis`,
    }),
      e.add(q.cyl(0.035, 0.035, 0.84, 7), {
        ...hi,
        at: [-0.4, 0.28, 0],
        rot: [Y / 2, 0, 0],
        bone: `chassis`,
      }));
    for (let t of [`wheelFR`, `wheelBR`]) {
      let n = t === `wheelFR` ? 0.4 : -0.4,
        r = [n, 0.28, 0.35];
      (e.add(q.cyl(0.26, 0.26, 0.09, 14), {
        color: X(`wood`),
        kind: K.wood,
        at: r,
        rot: [Y / 2, 0, 0],
        bone: t,
        mirror: !0,
      }),
        e.add(q.torus(0.26, 0.032, 5, 14), {
          color: X(`steel`),
          kind: K.iron,
          metal: 0.3,
          flat: !0,
          at: r,
          bone: t,
          mirror: !0,
        }),
        e.add(q.cyl(0.07, 0.07, 0.16, 8), {
          ...Z,
          flat: !0,
          at: r,
          rot: [Y / 2, 0, 0],
          bone: t,
          mirror: !0,
          keep: 1,
        }));
      for (let r = 0; r < 4; r++)
        e.add(q.box(0.44, 0.035, 0.025, 0.008), {
          ...hi,
          at: [n, 0.28, 0.4],
          rot: [0, 0, (r * Y) / 4],
          bone: t,
          mirror: !0,
        });
      for (let r = 0; r < 8; r++) {
        let i = (r / 8) * Y * 2;
        e.add(q.box(0.05, 0.03, 0.1, 0.01), {
          color: X(`steelDk`),
          kind: K.iron,
          at: [n + Math.cos(i) * 0.285, 0.28 + Math.sin(i) * 0.285, 0.35],
          rot: [0, 0, i],
          bone: t,
          mirror: !0,
        });
      }
    }
    let n = {
      color: [`#2b3346`, `#221a17`],
      kind: [K.iron, K.iron],
      metal: 0.45,
      rough: 0.44,
    };
    (e.add(q.cyl(0.28, 0.32, 0.16, 10), {
      ...n,
      at: [0.05, 0.73, 0],
      bone: `turret`,
    }),
      e.add(q.torus(0.29, 0.024, 4, 10), {
        ...Z,
        flat: !0,
        at: [0.05, 0.8, 0],
        rot: [Y / 2, 0, 0],
        bone: `turret`,
        keep: 1,
      }),
      e.add(q.sphere(0.165, 0.165, 0.165, 10, 8), {
        ...n,
        color: [`#1d2431`, `#181211`],
        at: [0.08, 0.94, 0],
        bone: `barrel`,
      }),
      e.add(q.cyl(0.105, 0.14, 0.72, 10), {
        ...n,
        at: [0.46, 0.94, 0],
        rot: [0, 0, -Y / 2],
        bone: `barrel`,
      }),
      e.add(
        q.lathe(
          [
            [0.095, 0],
            [0.145, 0.035],
            [0.16, 0.12],
            [0.115, 0.15],
            [0.088, 0.09],
          ],
          10,
        ),
        {
          ...Z,
          flat: !0,
          at: [0.78, 0.94, 0],
          rot: [0, 0, -Y / 2],
          bone: `barrel`,
          keep: 1,
        },
      ));
    for (let [t, n] of [
      [0.24, 0.142],
      [0.6, 0.128],
    ])
      e.add(q.cyl(n, n, 0.07, 10), {
        ...yi,
        flat: !0,
        at: [t, 0.94, 0],
        rot: [0, 0, -Y / 2],
        bone: `barrel`,
      });
    (e.add(q.torus(0.13, 0.01, 4, 20), {
      ...gi,
      flat: !1,
      emit: 2,
      at: [0.42, 0.94, 0],
      rot: [0, Y / 2, 0],
      bone: `barrel`,
      keep: 1,
    }),
      e.add(q.cyl(0.085, 0.085, 0.02, 12), {
        color: [`#b6f6ff`, `#ffc48a`],
        kind: K.eye,
        emit: 1.95,
        at: [0.92, 0.94, 0],
        rot: [0, 0, -Y / 2],
        bone: `barrel`,
        occluder: !1,
      }));
    for (let [t, n, r, i, a] of [
      [-0.4, 0, 0.09, 0.4, [0, 0, 0]],
      [-0.44, 0.08, 0.06, 0.28, [0.5, 0, 0.2]],
      [-0.36, -0.08, 0.06, 0.26, [-0.55, 0, -0.15]],
    ])
      e.add(q.crystal(r, i, 6), {
        color: oi.gem,
        kind: K.crystal,
        emit: 1.5,
        team: 1,
        at: [t, 0.6, n],
        rot: a,
        bone: `core`,
        flat: !0,
        localGrad: !0,
        grad: [0.7, 1.15],
      });
    return (
      e.add(q.torus(0.14, 0.026, 4, 10), {
        ...Z,
        flat: !0,
        team: 1,
        at: [-0.4, 0.68, 0],
        rot: [Y / 2, 0, 0],
        bone: `core`,
        keep: 1,
      }),
      e.add(q.box(0.34, 0.3, 0.38, 0.05), {
        color: si.steel,
        kind: K.iron,
        metal: 0.3,
        team: 2,
        at: [-0.4, 0.8, 0],
        bone: `core`,
      }),
      e.add(q.box(0.02, 0.13, 0.26, 0.005), {
        color: si.gem,
        kind: K.eye,
        emit: 1.95,
        team: 2,
        at: [-0.575, 0.78, 0],
        bone: `core`,
        occluder: !1,
      }),
      e.add(q.box(0.28, 0.02, 0.32, 0.005), {
        color: si.glow,
        kind: K.eye,
        emit: 1.6,
        team: 2,
        at: [-0.4, 0.955, 0],
        bone: `core`,
        occluder: !1,
      }),
      e.add(q.cyl(0.05, 0.065, 0.34, 8), {
        color: si.steelDk,
        kind: K.iron,
        team: 2,
        flat: !0,
        at: [-0.48, 1.08, 0.1],
        bone: `core`,
      }),
      e.add(q.cyl(0.08, 0.055, 0.055, 8), {
        color: si.steel,
        kind: K.iron,
        team: 2,
        flat: !0,
        at: [-0.48, 1.27, 0.1],
        bone: `core`,
      }),
      e.build({ aoFloor: 0.66, aoHeight: 0.6 })
    );
  }
  function Pi(e, t, n) {
    let r = e.d,
      i = t.walk,
      a = t.dist,
      o = t.t,
      s = -a / 0.27;
    ((r[n.wheelFR * 9 + 2] += s),
      (r[n.wheelBR * 9 + 2] += s),
      (r[n.wheelFL * 9 + 2] += s),
      (r[n.wheelBL * 9 + 2] += s),
      (r[n.chassis * 9 + 4] +=
        Math.abs(Math.sin(a * 5.5)) * 0.022 * i + Math.sin(o * 3) * 0.003),
      (r[n.chassis * 9 + 0] += Math.sin(a * 3.1) * 0.03 * i),
      (r[n.chassis * 9 + 2] += Math.sin(a * 4.3) * 0.018 * i));
    {
      let e = n.core * 9,
        t = 1 + Math.sin(o * 4.2) * 0.035;
      ((r[e + 6] *= t), (r[e + 7] *= t), (r[e + 8] *= t));
    }
    r[n.turret * 9 + 1] += Math.sin(o * 0.4) * 0.08 * (1 - i);
    let c = t.antic,
      l = t.strike;
    ((r[n.barrel * 9 + 2] += 0.25 * c + 0.12 * l),
      (r[n.barrel * 9 + 3] += -0.08 * c - 0.2 * l),
      (r[n.chassis * 9 + 2] += 0.06 * l - 0.02 * c),
      (r[n.root * 9 + 3] += -0.07 * l));
    {
      let e = n.core * 9,
        t = 1 + 0.12 * c;
      ((r[e + 6] *= t), (r[e + 7] *= t), (r[e + 8] *= t));
    }
    t.glowOut += 1.6 * c + 2 * l;
  }
  function Fi() {
    let e = new Xr(
        [
          [`root`, null, [0, 0, 0]],
          [`pelvis`, `root`, [0, 0.8, 0]],
          [`torso`, `pelvis`, [0, 0.95, 0]],
          [`head`, `torso`, [0.2, 1.72, 0]],
          [`armR`, `torso`, [0, 1.56, 0.5]],
          [`foreR`, `armR`, [0.02, 1.12, 0.62]],
          [`armL`, `torso`, [0, 1.56, -0.5]],
          [`foreL`, `armL`, [0.02, 1.12, -0.62]],
          [`thighR`, `pelvis`, [0, 0.78, 0.25]],
          [`shinR`, `thighR`, [0.02, 0.42, 0.27]],
          [`thighL`, `pelvis`, [0, 0.78, -0.25]],
          [`shinL`, `thighL`, [0.02, 0.42, -0.27]],
        ],
        { seed: 53, texScale: 1.8 },
      ),
      t = [`#7ba0e6`, `#3a2f2e`],
      n = [`#93b2e8`, `#2c2424`],
      r = [`#88a7dd`, `#241d1e`],
      i = new ri({
        voxel: 0.04,
        soft: 0.05,
        skinSoft: 0.12,
        noiseFreq: 4.5,
        seed: 53,
      }),
      a = { k: 0.055, noise: 0.012 };
    (i.box([0, 0.86, 0], [0.26, 0.17, 0.31], 0.1, {
      ...a,
      color: n,
      bone: `pelvis`,
    }),
      i.box([0.02, 1.28, 0], [0.33, 0.3, 0.42], 0.15, {
        ...a,
        color: t,
        rot: [0, 0, -0.12],
        bone: `torso`,
        vein: -0.9,
      }),
      i.box([0.3, 1.2, 0], [0.12, 0.2, 0.3], 0.08, {
        ...a,
        color: n,
        rot: [0, 0, -0.2],
        bone: `torso`,
      }),
      i.sphere([0.44, 1.32, 0], 0.13, { sub: !0, k: 0.035, bone: `torso` }),
      i.cone([0.06, 1.5, 0], [0.27, 1.7, 0], 0.2, 0.135, {
        ...a,
        color: n,
        bones: [`torso`, `head`],
      }),
      i.box([0.35, 1.8, 0], [0.16, 0.135, 0.17], 0.075, {
        ...a,
        color: t,
        bone: `head`,
      }),
      i.box([0.48, 1.875, 0], [0.05, 0.032, 0.18], 0.02, {
        ...a,
        color: r,
        rot: [0, 0, -0.2],
        bone: `head`,
      }),
      i.box([0.46, 1.72, 0], [0.07, 0.05, 0.13], 0.035, {
        ...a,
        color: r,
        bone: `head`,
      }),
      i.sym((e, o) => {
        let s = (t) => (e > 0 ? t : t.replace(/R$/, `L`));
        (i.ellipsoid(o([0, 1.6, 0.54]), [0.27, 0.23, 0.25], {
          ...a,
          color: t,
          bone: s(`armR`),
          vein: -0.7,
        }),
          i.cone(o([0, 1.46, 0.6]), o([0.02, 1.14, 0.63]), 0.15, 0.13, {
            ...a,
            color: n,
            bones: [s(`armR`), s(`foreR`)],
          }),
          i.box(o([0.07, 0.86, 0.64]), [0.15, 0.22, 0.15], 0.07, {
            ...a,
            color: t,
            rot: [0, 0, -0.06],
            bone: s(`foreR`),
          }),
          i.box(o([0.12, 0.54, 0.64]), [0.19, 0.15, 0.17], 0.085, {
            ...a,
            color: n,
            bone: s(`foreR`),
          }),
          i.cone(o([0, 0.82, 0.25]), o([0.02, 0.48, 0.27]), 0.15, 0.13, {
            ...a,
            color: n,
            bones: [s(`thighR`), s(`shinR`)],
          }),
          i.box(o([0.03, 0.26, 0.28]), [0.14, 0.19, 0.13], 0.07, {
            ...a,
            color: t,
            bone: s(`shinR`),
          }),
          i.box(o([0.1, 0.09, 0.28]), [0.2, 0.075, 0.155], 0.05, {
            ...a,
            color: r,
            bone: s(`shinR`),
          }),
          i.box(o([0.26, 0.055, 0.28]), [0.13, 0.045, 0.13], 0.035, {
            ...a,
            color: n,
            rot: [0, 0, 0.16],
            bone: s(`shinR`),
          }));
      }),
      i.build(e, {
        kind: [K.marble, K.stone],
        aoScale: 0.14,
        ao: 1.1,
        tex: 1.8,
        texBySize: -0.5,
        lodMax: 1.4,
        paint: (e, t, n, r, i, a, o) => {
          let s = Math.max(0, Math.min(1, r[1] * 0.5 + 0.5)),
            c = Math.max(0, Math.min(1, 1.2 - t)),
            l = 0.74 + 0.36 * s - 0.1 * c;
          ((i[o * 3] *= l * 0.96),
            (i[o * 3 + 1] *= l * 0.98),
            (i[o * 3 + 2] *= l * 1.04));
          for (let e = 0; e < 3; e++) a[o * 3 + e] *= 0.8 + 0.3 * s;
        },
      }));
    let o = (e) => {
      let t = i.skinAt(e[0], e[1], e[2]);
      return () => t;
    };
    (e.add(q.torus(0.4, 0.062, 10, 48), {
      ...Z,
      at: [0.03, 1.12, 0],
      rot: [Y / 2, 0, 0],
      scale: [0.94, 0.72, 1],
      bone: `torso`,
      keep: 1,
    }),
      e.add(q.torus(0.405, 0.018, 6, 44), {
        ...Z,
        at: [0.03, 1.185, 0],
        rot: [Y / 2, 0, 0],
        scale: [0.94, 1, 1],
        bone: `torso`,
        occluder: !1,
        keep: 1,
      }),
      e.add(q.torus(0.395, 0.016, 6, 40), {
        ...Si,
        at: [0.03, 1.055, 0],
        rot: [Y / 2, 0, 0],
        scale: [0.94, 1, 1],
        bone: `torso`,
        occluder: !1,
        keep: 1,
      }),
      e.add(q.torus(0.3, 0.034, 10, 44), {
        ...Z,
        at: [0, 0.76, 0],
        rot: [Y / 2, 0, 0],
        scale: [0.95, 1.08, 1],
        bone: `pelvis`,
        keep: 1,
      }));
    for (let t of [1, -1]) {
      let n = [0.08, 0.95, 0.64 * t];
      e.add(q.torus(0.17, 0.02, 8, 36), {
        ...Z,
        at: n,
        rot: [Y / 2, 0, 0],
        skin: o(n),
        keep: 1,
      });
      let r = [0.12, 0.63, 0.64 * t];
      e.add(q.torus(0.2, 0.017, 8, 36), {
        ...Z,
        at: r,
        rot: [Y / 2, 0, 0],
        skin: o(r),
        keep: 1,
      });
    }
    (e.add(q.torus(0.13, 0.024, 8, 32), {
      ...Z,
      at: [0.43, 1.32, 0],
      rot: [0, Y / 2, 0],
      bone: `torso`,
      keep: 1,
    }),
      e.add(q.gem(0.12, 0.24), {
        ...gi,
        emit: 2.6,
        at: [0.43, 1.32, 0],
        scale: [0.55, 1.2, 0.95],
        bone: `torso`,
        occluder: !1,
        keep: 1,
      }));
    let s = (t, n, r, i, a, o = {}) => {
        (e.add(q.extrude(t, i, 0.02, 3, 1), {
          ...a,
          flat: !0,
          at: n,
          rot: [Y / 2 + r, 0, 0],
          bone: `armR`,
          mirror: !0,
          ...o,
        }),
          e.add(
            q.extrude(
              t.map(([e, t]) => [e * 1.07, t * 1.05 + 0.01]),
              i * 0.5,
              0.01,
              3,
              1,
            ),
            {
              ...Si,
              at: [n[0], n[1] - 0.022, n[2] + 0.008],
              rot: [Y / 2 + r, 0, 0],
              bone: `armR`,
              mirror: !0,
              occluder: !1,
              keep: 1,
            },
          ));
      },
      c = [
        [-0.27, -0.02],
        [0.25, -0.02],
        [0.3, 0.14],
        [0.26, 0.34],
        [-0.22, 0.37],
        [-0.33, 0.18],
      ],
      l = [
        [-0.22, 0],
        [0.21, 0],
        [0.25, 0.12],
        [0.2, 0.28],
        [-0.17, 0.3],
        [-0.26, 0.15],
      ];
    (s(c, [0, 1.76, 0.34], 0.34, 0.1, {
      ...ci,
      flat: !0,
      tex: 2.6,
      grad: [0.7, 1.24],
    }),
      s(l, [0, 1.62, 0.58], 0.85, 0.09, {
        ...ci,
        color: X(`steelDk`),
        tex: 3,
        grad: [0.7, 1.16],
      }),
      e.add(q.box(0.5, 0.042, 0.055, 0.015), {
        ...Z,
        at: [-0.01, 1.87, 0.56],
        rot: [0.34, 0, 0],
        bone: `armR`,
        mirror: !0,
        occluder: !1,
        keep: 1,
      }),
      e.add(
        q.lathe(
          [
            [0.3, 1.46],
            [0.33, 1.56],
            [0.29, 1.7],
            [0.2, 1.76],
          ],
          18,
        ),
        { ...Si, at: [0.06, 0, 0], bone: `torso` },
      ),
      e.add(
        q.lathe(
          [
            [0.2, 1.76],
            [0.245, 1.79],
            [0.225, 1.815],
            [0.17, 1.82],
          ],
          18,
        ),
        {
          ...Z,
          flat: !0,
          grad: [0.74, 1.2],
          at: [0.06, 0, 0],
          bone: `torso`,
          occluder: !1,
          keep: 1,
        },
      ),
      e.add(q.crystal(0.085, 0.42, 6), {
        color: oi.gem,
        kind: K.crystal,
        emit: 1.6,
        team: 1,
        at: [-0.14, 1.86, 0.44],
        rot: [0.45, 0, 0.35],
        bone: `armR`,
        flat: !0,
        mirror: !0,
        localGrad: !0,
        grad: [0.7, 1.15],
      }),
      e.add(q.crystal(0.055, 0.28, 6), {
        color: oi.gem,
        kind: K.crystal,
        emit: 1.6,
        team: 1,
        at: [0.06, 1.88, 0.42],
        rot: [0.9, 0, -0.3],
        bone: `armR`,
        flat: !0,
        mirror: !0,
        localGrad: !0,
        grad: [0.7, 1.15],
      }),
      J(e, [-0.1, 1.92, 0.45], [-0.3, 1, 0.6], 0.38, 0.07, {
        color: `#2e2624`,
        tip: `#e0d2b8`,
        kind: K.bone,
        team: 2,
        bend: [-0.3, 0.1, 0.2],
        bone: `armR`,
        mirror: !0,
        collar: !0,
        collarColor: si.steel,
        collarKind: K.iron,
      }),
      J(e, [0.1, 1.9, 0.44], [0.3, 1, 0.5], 0.26, 0.05, {
        color: `#2e2624`,
        tip: `#e0d2b8`,
        kind: K.bone,
        team: 2,
        bend: [-0.2, 0.1, 0.2],
        bone: `armR`,
        mirror: !0,
      }));
    let u = Oi(Q, 0.442, 1.835);
    return (
      e.add(q.box(0.03, 0.12, 0.29, 0.01), {
        ...Si,
        at: u(0.075, 0),
        rot: [0, 0, Q],
        bone: `head`,
        recvAO: !1,
      }),
      e.add(q.sphere(0.028, 0.04, 0.056, 10, 8), {
        color: X(`glow`),
        kind: K.eye,
        emit: 1.95,
        at: u(0.068, 0.026, 0.08),
        rot: [0, 0, Q],
        bone: `head`,
        mirror: !0,
        occluder: !1,
        recvAO: !1,
      }),
      e.add(q.box(0.022, 0.056, 0.3, 0.008), {
        ...Z,
        at: u(0.018, 0.022),
        rot: [0, 0, Q],
        bone: `head`,
        occluder: !1,
        keep: 1,
      }),
      e.add(q.crystal(0.07, 0.32, 6), {
        color: oi.gem,
        kind: K.crystal,
        team: 1,
        emit: 1.8,
        at: [0.26, 1.9, 0],
        rot: [0, 0, 0.35],
        bone: `head`,
        flat: !0,
        localGrad: !0,
        grad: [0.7, 1.15],
      }),
      J(e, [0.3, 1.9, 0.12], [-0.2, 0.9, 0.7], 0.34, 0.06, {
        color: `#2e2624`,
        tip: `#e0d2b8`,
        kind: K.bone,
        team: 2,
        bend: [0.4, 0.15, 0],
        bone: `head`,
        mirror: !0,
      }),
      e.build({ aoFloor: 0.58 })
    );
  }
  function Ii(e, t, n) {
    let r = e.d,
      i = t.walk,
      a = t.phase,
      o = t.t,
      s = 1 - i,
      c = Math.sin(a),
      l = Math.cos(a),
      u = t.seed * 2 - 1;
    ((r[n.head * 9 + 1] += u * 0.1),
      (r[n.torso * 9 + 1] += u * 0.07),
      (r[n.armR * 9 + 0] += u * 0.13),
      (r[n.armL * 9 + 0] += u * 0.13));
    {
      let e = n.torso * 9,
        t = 1 + Math.sin(o * 1.6) * 0.012 * s;
      ((r[e + 6] *= t), (r[e + 7] *= t), (r[e + 8] *= t));
    }
    ((r[n.head * 9 + 1] += Math.sin(o * 0.33) * 0.3 * s),
      (r[n.armR * 9 + 2] += 0.18),
      (r[n.armR * 9 + 0] += -0.1),
      (r[n.armL * 9 + 2] += 0.18),
      (r[n.armL * 9 + 0] += 0.1),
      (r[n.foreR * 9 + 2] += 0.25),
      (r[n.foreL * 9 + 2] += 0.25),
      (r[n.thighR * 9 + 2] += c * 0.5 * i),
      (r[n.thighL * 9 + 2] += -c * 0.5 * i),
      (r[n.shinR * 9 + 2] += -Math.max(0, l) * 0.7 * i),
      (r[n.shinL * 9 + 2] += -Math.max(0, -l) * 0.7 * i),
      (r[n.pelvis * 9 + 4] += (Math.abs(l) - 0.6) * 0.15 * i),
      (r[n.pelvis * 9 + 0] += c * 0.13 * i),
      (r[n.torso * 9 + 0] += -c * 0.14 * i),
      (r[n.torso * 9 + 1] += c * 0.16 * i),
      (r[n.torso * 9 + 2] += -0.1 * i),
      (r[n.armR * 9 + 2] += -c * 0.38 * i),
      (r[n.armL * 9 + 2] += c * 0.38 * i),
      (r[n.head * 9 + 2] += 0.1 * i));
    let d = t.antic,
      f = t.strike;
    ((r[n.armR * 9 + 2] += 2.5 * d - 0.95 * f),
      (r[n.armL * 9 + 2] += 2.5 * d - 0.95 * f),
      (r[n.armR * 9 + 0] += 0.25 * d),
      (r[n.armL * 9 + 0] += -0.25 * d),
      (r[n.foreR * 9 + 2] += -0.2 * d + 0.2 * f),
      (r[n.foreL * 9 + 2] += -0.2 * d + 0.2 * f),
      (r[n.torso * 9 + 2] += 0.22 * d - 0.5 * f),
      (r[n.pelvis * 9 + 4] += 0.05 * d - 0.14 * f),
      (r[n.thighR * 9 + 2] += 0.35 * f),
      (r[n.thighL * 9 + 2] += 0.35 * f),
      (r[n.shinR * 9 + 2] += -0.55 * f),
      (r[n.shinL * 9 + 2] += -0.55 * f),
      (t.glowOut += 1 * d + 1.3 * f));
  }
  let Li = {
      melee: {
        build: ki,
        animate: Ai,
        scale: 0.86,
        stride: 0.66,
        turnRate: 11,
        overhead: 1.42,
        shadow: [0.3, 0.26],
        glow: [`#46e8ff`, `#ff6a14`],
        flinch: 1,
        kb: 0.55,
        fall: 1.5,
        fallLift: 0.14,
        rig: {
          root: `root`,
          body: `torso`,
          head: `head`,
          limbs: [`armR`, `armL`],
          flail: 1,
          thighs: [`thighR`, `thighL`],
          shins: [`shinR`, `shinL`],
          spine: [`torso`],
        },
        anchors: {
          head: [`head`, [0.1, 1, 0]],
          chest: [`torso`, [0.2, 0.7, 0]],
          weapon: [`armR`, [0.35, 0.62, 0.34]],
          muzzle: [`armR`, [0.52, 0.7, 0.34]],
        },
        halos: [
          {
            bone: `head`,
            at: [0.215, 1, 0],
            size: 0.1,
            alpha: 0.24,
            boost: 0.25,
          },
        ],
      },
      caster: {
        build: ji,
        animate: Mi,
        scale: 0.78,
        stride: 0.5,
        turnRate: 11,
        overhead: 1.46,
        shadow: [0.24, 0.23],
        glow: [`#56f0ff`, `#ff7218`],
        flinch: 1.2,
        kb: 0.6,
        fall: 1.45,
        fallLift: 0.1,
        rig: {
          root: `root`,
          body: `chest`,
          head: `head`,
          limbs: [`armR`, `armL`],
          flail: 1,
          spine: [`chest`],
        },
        anchors: {
          head: [`head`, [0.08, 1, 0]],
          chest: [`chest`, [0.15, 0.6, 0]],
          weapon: [`orb`, [0.46, 1.24, 0.46]],
          muzzle: [`orb`, [0.46, 1.24, 0.46]],
        },
        halos: [
          {
            bone: `orb`,
            at: [0.46, 1.235, 0.46],
            size: 0.22,
            alpha: 0.24,
            boost: 0.4,
          },
          {
            bone: `head`,
            at: [0.13, 0.962, 0],
            size: 0.105,
            alpha: 0.26,
            boost: 0.2,
          },
        ],
      },
      siege: {
        build: Ni,
        animate: Pi,
        scale: 1,
        stride: 1,
        turnRate: 6,
        overhead: 1.5,
        shadow: [0.74, 0.48],
        glow: [`#56f0ff`, `#ff6a10`],
        flinch: 0.4,
        kb: 0.35,
        fall: 1.2,
        fallLift: 0.2,
        tipOver: !0,
        rig: {
          root: `root`,
          body: `chassis`,
          head: `turret`,
          limbs: [],
          flail: 0,
        },
        anchors: {
          head: [`turret`, [0.1, 0.96, 0]],
          chest: [`chassis`, [0, 0.6, 0]],
          weapon: [`barrel`, [0.92, 0.94, 0]],
          muzzle: [`barrel`, [0.95, 0.94, 0]],
        },
        halos: [
          {
            bone: `barrel`,
            at: [0.94, 0.94, 0],
            size: 0.2,
            alpha: 0.32,
            boost: 0.4,
          },
          {
            bone: `core`,
            at: [-0.4, 0.82, 0],
            size: 0.3,
            alpha: 0.28,
            boost: 0.1,
          },
        ],
      },
      super: {
        build: Fi,
        animate: Ii,
        scale: 0.95,
        stride: 0.9,
        turnRate: 6,
        overhead: 2.35,
        shadow: [0.8, 0.72],
        glow: [`#46e8ff`, `#ff5a0c`],
        flinch: 0.45,
        kb: 0.4,
        fall: 1.45,
        fallLift: 0.3,
        fallForward: !0,
        rig: {
          root: `root`,
          body: `torso`,
          head: `head`,
          limbs: [`armR`, `armL`],
          flail: 0.5,
          thighs: [`thighR`, `thighL`],
          shins: [`shinR`, `shinL`],
          spine: [`torso`],
        },
        anchors: {
          head: [`head`, [0.34, 1.8, 0]],
          chest: [`torso`, [0.5, 1.32, 0]],
          weapon: [`foreR`, [0.12, 0.52, 0.64]],
          muzzle: [`foreR`, [0.12, 0.52, 0.64]],
        },
        halos: [
          {
            bone: `torso`,
            at: [0.56, 1.32, 0],
            size: 0.28,
            alpha: 0.35,
            boost: 0.2,
          },
        ],
      },
    },
    $ = Math.PI,
    Ri = (e, t = 1.1) => (e.aggroT < t ? Math.sin(ii(e.aggroT / t) * $) : 0),
    zi = new j(),
    Bi = new j(),
    Vi = new M(),
    Hi = new M();
  function Ui(e, t = 0) {
    return (
      Hi.set(e[0], e[1], e[2]).normalize(),
      zi.setFromUnitVectors(Vi.set(0, 1, 0), Hi),
      t && (Bi.setFromAxisAngle(Hi, t), zi.premultiply(Bi)),
      [zi.x, zi.y, zi.z, zi.w]
    );
  }
  let Wi = (e) => {
      let t = Math.hypot(e[0], e[1], e[2]) || 1;
      return [e[0] / t, e[1] / t, e[2] / t];
    },
    Gi = (e, t, n = 1) => [e[0] + t[0] * n, e[1] + t[1] * n, e[2] + t[2] * n],
    Ki = (e, t, n) => [
      e[0] + (t[0] - e[0]) * n,
      e[1] + (t[1] - e[1]) * n,
      e[2] + (t[2] - e[2]) * n,
    ],
    qi = (e) => [e[0], e[1], -e[2]];
  var Ji = class {
    constructor(e, t) {
      ((this.b = e), (this.body = t));
    }
    at(e, t = 0) {
      let n = this.body.project(e, t),
        r = this.body.skinAt(n.p[0], n.p[1], n.p[2]);
      return { p: n.p, n: n.n, skin: r };
    }
    add(e, t, n = {}) {
      let {
          sink: r = 0.05,
          lean: i = null,
          tilt: a = 0,
          twist: o = 0,
          mirror: s = !1,
          ...c
        } = n,
        l = (t, n) => {
          let s = this.at(t),
            l = s.n;
          i && (l = Wi(Ki(l, Wi(n ? qi(i) : i), a)));
          let u = Gi(s.p, l, -r),
            d = s.skin;
          return (
            this.b.add(e, {
              keep: 1,
              ...c,
              at: u,
              quat: Ui(l, n ? -o : o),
              skin: () => d,
            }),
            s
          );
        },
        u = l(t, !1);
      return (s && l(qi(t), !0), u);
    }
  };
  function Yi(e, t, n, r = {}) {
    let {
        iris: i = `#ffb23a`,
        socket: a = `#0b0805`,
        pupil: o = `#060402`,
        tilt: s = -0.62,
        emit: c = 1.95,
        brow: l = null,
        browKind: u = K.bone,
        browLift: d = 1.9,
        keep: f,
        skin: p,
        bone: m,
        bones: h,
      } = r,
      g = [0, 0, s],
      _ = {};
    (f !== void 0 && (_.keep = f), p && (_.skin = p), m && (_.bone = m));
    let v = Math.sin(-s),
      y = Math.cos(-s),
      b = (e) => [t[0] + v * e, t[1] + y * e, t[2]];
    if (
      (e.add(q.sphere(n[0] * 1.4, n[1] * 1.55, n[2] * 1.5, 10, 8), {
        color: a,
        kind: K.skin,
        rough: 0.95,
        grad: [0.45, 0.8],
        at: b(-n[0] * 0.95),
        rot: g,
        mirror: !0,
        occluder: !1,
        ..._,
      }),
      e.add(q.sphere(n[0], n[1], n[2], 10, 8), {
        color: i,
        kind: K.eye,
        emit: c,
        at: b(n[0] * 0.25),
        rot: g,
        mirror: !0,
        occluder: !1,
        recvAO: !1,
        ..._,
      }),
      e.add(q.sphere(n[0] * 0.5, n[1] * 0.44, n[2] * 0.16, 8, 6), {
        color: o,
        kind: K.skin,
        rough: 0.25,
        at: b(n[0] * 1.05),
        rot: g,
        mirror: !0,
        occluder: !1,
        recvAO: !1,
        ..._,
        keep: 0,
      }),
      l)
    ) {
      let r = (Math.abs(t[2]) + n[2]) * 2.05,
        i = b(n[0] * 0.3),
        a = n[1] * d;
      e.add(q.box(n[0] * 1.5, n[1] * 0.8, r, n[0] * 0.35), {
        color: l,
        kind: u,
        rough: 0.6,
        at: [i[0] - y * a, i[1] + v * a, 0],
        rot: g,
        occluder: !1,
        ..._,
        keep: 1,
      });
    }
  }
  function Xi(e, t, n, r = {}) {
    let {
        dark: i = `#0a0705`,
        lip: a = null,
        lipKind: o = K.bone,
        tilt: s = -0.5,
        keep: c,
        skin: l,
        bone: u,
      } = r,
      d = [0, 0, s],
      f = {};
    (c !== void 0 && (f.keep = c),
      l && (f.skin = l),
      u && (f.bone = u),
      e.add(q.box(n[0], n[1], n[2], n[0] * 0.3), {
        color: i,
        kind: K.skin,
        rough: 0.95,
        grad: [0.4, 0.75],
        at: t,
        rot: d,
        occluder: !1,
        ...f,
      }),
      a &&
        e.add(q.box(n[0] * 0.8, n[1] * 0.55, n[2] * 0.86, n[0] * 0.24), {
          color: a,
          kind: o,
          rough: 0.6,
          at: [t[0] + n[0] * 0.2, t[1] - n[1] * 1.15, t[2]],
          rot: d,
          occluder: !1,
          ...f,
          keep: 1,
        }));
  }
  function Zi() {
    let e = new Xr(
        [
          [`root`, null, [0, 0, 0]],
          [`pelvis`, `root`, [0, 1, 0]],
          [`spine`, `pelvis`, [0.02, 1.4, 0]],
          [`chest`, `spine`, [0.15, 1.95, 0]],
          [`head`, `chest`, [0.66, 3.08, 0]],
          [`jaw`, `head`, [0.86, 2.96, 0]],
          [`armR`, `chest`, [0.22, 2.25, 0.82]],
          [`foreR`, `armR`, [0.48, 1.42, 1.02]],
          [`armL`, `chest`, [0.22, 2.25, -0.82]],
          [`foreL`, `armL`, [0.48, 1.42, -1.02]],
          [`thighR`, `pelvis`, [0, 0.95, 0.42]],
          [`shinR`, `thighR`, [0.12, 0.5, 0.48]],
          [`thighL`, `pelvis`, [0, 0.95, -0.42]],
          [`shinL`, `thighL`, [0.12, 0.5, -0.48]],
        ],
        { seed: 202, texScale: 1.3 },
      ),
      t = `#8f3a22`,
      n = `#45201a`,
      r = `#c07040`,
      i = `#f2b257`,
      a = new ri({
        voxel: 0.05,
        soft: 0.12,
        skinSoft: 0.2,
        noiseFreq: 3.4,
        seed: 3,
      });
    (a.ellipsoid([0, 1.05, 0], [0.5, 0.42, 0.55], {
      bone: `pelvis`,
      color: t,
      k: 0.2,
    }),
      a.ellipsoid([0.3, 1.36, 0], [0.56, 0.5, 0.6], {
        bone: `spine`,
        color: r,
        k: 0.25,
        vein: 0.5,
      }),
      a.cone([0, 1.45, 0], [0.15, 2.1, 0], 0.58, 0.74, {
        bones: [`spine`, `chest`],
        color: t,
        k: 0.25,
        noise: 0.03,
      }),
      a.ellipsoid([-0.18, 2.16, 0], [0.82, 0.42, 0.9], {
        rot: [0, 0, 0.42],
        bone: `chest`,
        color: n,
        k: 0.3,
        vein: 1,
        w2: 0.6,
        noise: 0.035,
      }),
      a.cone([0.2, 2.4, 0], [-0.75, 1.96, 0], 0.22, 0.14, {
        bones: [`chest`, `spine`],
        color: n,
        k: 0.25,
        vein: 0.9,
        w2: 0.8,
        noise: 0.03,
      }),
      a.ellipsoid([0.38, 1.98, 0], [0.4, 0.42, 0.66], {
        bone: `chest`,
        color: r,
        k: 0.2,
      }),
      a.cone([0.3, 2.2, 0], [0.68, 3.1, 0], 0.5, 0.34, {
        bones: [`chest`, `head`],
        color: t,
        k: 0.18,
      }),
      a.ellipsoid([0.8, 3.2, 0], [0.4, 0.37, 0.4], {
        bone: `head`,
        color: i,
        k: 0.12,
      }),
      a.ellipsoid([1, 3.33, 0], [0.16, 0.11, 0.38], {
        rot: [0, 0, -0.3],
        bone: `head`,
        color: n,
        k: 0.08,
      }),
      a.ellipsoid([1.1, 3.1, 0], [0.19, 0.15, 0.22], {
        bone: `head`,
        color: i,
        k: 0.08,
      }),
      a.box([1, 2.94, 0], [0.26, 0.12, 0.3], 0.09, {
        rot: [0, 0, 0.12],
        bone: `jaw`,
        color: `#c67a33`,
        k: 0.07,
      }),
      a.sym((e, r) => {
        let o = (t) => (e > 0 ? t : t.replace(/R$/, `L`));
        (a.sphere(r([1.06, 3.22, 0.15]), 0.06, {
          sub: !0,
          k: 0.04,
          bone: `head`,
        }),
          a.cone(r([0.1, 2.3, 0.3]), r([0.24, 2.26, 0.8]), 0.46, 0.4, {
            bones: [`chest`, o(`armR`)],
            color: n,
            k: 0.2,
            vein: 0.7,
            w2: 0.3,
          }),
          a.ellipsoid(r([0.26, 2.2, 0.9]), [0.36, 0.34, 0.32], {
            rot: [0.3 * e, 0, -0.2],
            bone: o(`armR`),
            color: t,
            k: 0.1,
            vein: 0.2,
          }),
          a.cone(r([0.26, 2, 0.93]), r([0.44, 1.5, 1.02]), 0.3, 0.22, {
            bones: [o(`armR`), o(`foreR`)],
            color: t,
            k: 0.1,
          }),
          a.ellipsoid(r([0.4, 1.78, 0.98]), [0.2, 0.3, 0.22], {
            rot: [0, 0, -0.35],
            bone: o(`armR`),
            color: i,
            k: 0.06,
          }),
          a.sphere(r([0.45, 1.46, 1.03]), 0.22, {
            bones: [o(`armR`), o(`foreR`)],
            color: n,
            k: 0.08,
            vein: 0.6,
          }),
          a.cone(r([0.46, 1.42, 1.03]), r([0.55, 1.05, 1.06]), 0.25, 0.33, {
            bone: o(`foreR`),
            color: t,
            k: 0.08,
          }),
          a.cone(r([0.55, 1.05, 1.06]), r([0.6, 0.78, 1.07]), 0.33, 0.22, {
            bone: o(`foreR`),
            color: t,
            k: 0.08,
          }),
          a.box(r([0.65, 0.6, 1.07]), [0.2, 0.18, 0.2], 0.11, {
            rot: [0, 0, -0.1],
            bone: o(`foreR`),
            color: n,
            k: 0.07,
          }));
        for (let e = 0; e < 4; e++)
          a.sphere(r([0.84, 0.55 + (e % 2) * 0.02, 0.94 + e * 0.09]), 0.075, {
            bone: o(`foreR`),
            color: n,
            k: 0.05,
          });
        (a.cone(r([0, 0.98, 0.42]), r([0.12, 0.5, 0.48]), 0.4, 0.28, {
          bones: [o(`thighR`), o(`shinR`)],
          color: t,
          k: 0.14,
          vein: 0.35,
        }),
          a.cone(r([0.12, 0.52, 0.48]), r([0.15, 0.16, 0.5]), 0.26, 0.22, {
            bone: o(`shinR`),
            color: t,
            k: 0.08,
          }),
          a.ellipsoid(r([0.3, 0.11, 0.5]), [0.34, 0.12, 0.25], {
            bone: o(`shinR`),
            color: n,
            k: 0.08,
          }));
      }));
    let o = [0.2, 0.093, 0.024],
      s = [0.46, 0.19, 0.08];
    a.build(e, {
      kind: K.skin,
      kind2: K.stone,
      aoScale: 0.45,
      ao: 1.25,
      paint: (e, t, n, r, i, a, c) => {
        if (e > 0.42 && t > 2.82) {
          for (let e of [i, a])
            for (let t = 0; t < 3; t++)
              e[c * 3 + t] *= 0.96 + 0.16 * Math.max(0, r[1]);
          return;
        }
        let l =
            Math.max(0, Math.min(1, (t - 1.86) * 1.6)) *
            Math.max(0, Math.min(1, r[1] * 1.3 - r[0] * 0.4)),
          u =
            Math.max(0, Math.min(1, r[0] * 1.4 - 0.2)) *
            Math.max(0, Math.min(1, 1 - Math.abs(t - 1.7) * 1.4)),
          d = Math.max(0, Math.min(1, (0.95 - t) * 1.5)),
          f =
            (0.7 + 0.44 * Math.max(0, Math.min(1, r[1] * 0.5 + 0.5))) *
            (1 - 0.17 * Math.min(1, Math.abs(r[2]) * 1.3));
        for (let e of [i, a])
          for (let t = 0; t < 3; t++) {
            let n = c * 3 + t,
              r = e[n] * f;
            ((r += (o[t] - r) * l * 0.78),
              (r += (s[t] - r) * u * 0.4),
              (r *= 1 - d * 0.4),
              (e[n] = r));
          }
      },
      lodMax: 1.3,
      tex: 4,
    });
    let c = new Ji(e, a);
    K.stone;
    let l = {
        color: `#2e2628`,
        tip: `#6d625d`,
        tipFrom: 0.55,
        kind: K.stone,
        rough: 0.8,
        flat: !0,
        localGrad: !0,
        grad: [0.8, 1.05],
      },
      u = [
        [0.24, 2.34, 0.1, 0.14, 0.3],
        [0, 2.4, 0.15, 0.19, 0.44],
        [-0.26, 2.38, 0.16, 0.21, 0.52],
        [-0.5, 2.28, 0.15, 0.18, 0.42],
        [-0.68, 2.12, 0.14, 0.13, 0.3],
      ],
      d = [1.28, 0.74, 1, 1.18, 0.8],
      f = [0.34, -0.22, 0.05, -0.35, 0.2],
      p = [4, 5, 4, 3, 5];
    for (let e = 0; e < u.length; e++) {
      let [t, n, , r, i] = u[e],
        a = d[e % 5];
      c.add(
        q.crystal(r * (0.85 + 0.15 * a), i * a, p[e % 5], 0.5, 0.05),
        [t + (((e * 37) % 7) - 3) * 0.018, n, (((e * 53) % 5) - 2) * 0.025],
        {
          ...l,
          scale: [1, 1, 0.5 + 0.12 * a],
          sink: 0.1,
          lean: [-1, 0.42 + 0.1 * (a - 1), f[e % 5] * 0.4],
          tilt: 0.62 - 0.12 * (a - 1),
          twist: f[e % 5],
        },
      );
    }
    let m = [
      [0.12, 2.38, 0.5, 0.15, 0.4, 1.2],
      [-0.18, 2.36, 0.62, 0.14, 0.36, 0.7],
      [0.22, 2.28, 0.86, 0.12, 0.32, 1],
      [-0.44, 2.21, 0.52, 0.12, 0.32, 1.25],
    ];
    for (let e = 0; e < m.length; e++) {
      let [t, n, r, i, a, o] = m[e];
      c.add(
        q.crystal(i * (0.85 + 0.15 * o), a * o, p[(e + 2) % 5], 0.45, 0.05),
        [t, n, r],
        {
          ...l,
          sink: 0.12,
          lean: [-1, 0.2 + 0.15 * (o - 1), 1.2],
          tilt: 0.6 - 0.1 * (o - 1),
          twist: r * 9 + f[(e + 1) % 5],
          mirror: !0,
        },
      );
    }
    for (let [e, t, n, r, i] of [
      [0.18, 2.32, 0.72, 0.28, 24],
      [-0.2, 2.26, 0.72, 0.26, 25],
    ])
      c.add(q.rock(r, 1, 0.2, 2.2, i, [1.3, 0.3, 0.8]), [e, t, n], {
        ...l,
        localGrad: !1,
        tip: void 0,
        sink: 0.05,
        twist: 0.6,
        mirror: !0,
      });
    let h = {
        color: `#241c1c`,
        tip: `#5b4b40`,
        tipFrom: 0.3,
        kind: K.stone,
        rough: 0.85,
        flat: !0,
        localGrad: !0,
        grad: [0.72, 1.06],
      },
      g = {
        color: `#e03a06`,
        kind: K.magma,
        emit: 1.85,
        rough: 0.5,
        localGrad: !0,
        grad: [1.25, 0.55],
        occluder: !1,
        recvAO: !1,
      };
    for (let [e, t, n, r, i] of [
      [-0.12, 2.42, 0.28, 0.085, 0.24],
      [-0.08, 2.4, -0.3, 0.075, 0.2],
      [-0.37, 2.32, 0.3, 0.08, 0.22],
      [-0.34, 2.3, -0.26, 0.075, 0.18],
      [-0.6, 2.14, 0.24, 0.065, 0.16],
      [0.12, 2.36, 0.3, 0.065, 0.15],
    ]) {
      let a = { sink: 0.06, lean: [-1, 0.55, n * 2], tilt: 0.35, twist: e * 7 };
      (c.add(
        q.lathe(
          [
            [r * 1.5, 0],
            [r * 1.58, i * 0.34],
            [r * 1.18, i * 0.82],
            [r * 0.9, i * 1.12],
            [r * 0.7, i * 0.98],
          ],
          9,
        ),
        [e, t, n],
        { ...h, ...a },
      ),
        c.add(
          q.lathe(
            [
              [r * 0.84, i * 0.46],
              [r * 0.66, i * 0.66],
              [r * 0.3, i * 0.76],
              [0, i * 0.78],
            ],
            9,
          ),
          [e, t, n],
          { ...g, ...a, sink: 0.02 },
        ));
    }
    (J(e, [0.72, 3.36, 0.26], [-0.2, 0.75, 0.95], 0.72, 0.135, {
      color: `#3b2c27`,
      tip: `#ecdfc5`,
      kind: K.bone,
      bend: [0.3, -0.5, 0.1],
      bone: `head`,
      mirror: !0,
      collar: !0,
      collarColor: `#4d4441`,
      collarKind: K.iron,
      radial: 12,
      segs: 14,
    }),
      J(e, [1.1, 2.98, 0.19], [0.3, 1, 0.35], 0.3, 0.065, {
        color: `#b8a98f`,
        tip: `#f4ecdc`,
        kind: K.bone,
        bend: [-0.35, 0, 0.1],
        bone: `jaw`,
        mirror: !0,
      }));
    let _ = [0, 0, -0.4];
    (e.add(
      q.lathe(
        [
          [0.3, -0.06],
          [0.44, 0.02],
          [0.47, 0.1],
          [0.4, 0.15],
        ],
        20,
      ),
      {
        color: `#120907`,
        kind: K.skin,
        rough: 0.95,
        grad: [0.5, 0.85],
        at: [0.6, 2.92, 0],
        rot: _,
        bone: `head`,
        recvAO: !1,
      },
    ),
      e.add(
        q.lathe(
          [
            [0.4, 0.15],
            [0.48, 0.19],
            [0.455, 0.235],
            [0.36, 0.25],
          ],
          20,
        ),
        {
          color: `#8e7a5a`,
          tip: `#cdb992`,
          kind: K.bone,
          rough: 0.6,
          flat: !0,
          grad: [0.72, 1.14],
          at: [0.6, 2.92, 0],
          rot: _,
          bone: `head`,
          keep: 1,
        },
      ),
      e.add(
        q.lathe(
          [
            [0, 0],
            [0.13, 0.012],
            [0.22, 0.04],
            [0.27, 0.085],
            [0.23, 0.108],
            [0, 0.1],
          ],
          16,
        ),
        {
          color: `#d5c3a0`,
          tip: `#f0e5cf`,
          kind: K.bone,
          rough: 0.55,
          flat: !0,
          at: [0.8, 3.44, 0],
          rot: [0, 0, -0.55],
          bone: `head`,
        },
      ),
      e.add(q.torus(0.3, 0.055, 6, 20, $ * 0.95), {
        color: `#2a120c`,
        kind: K.skin,
        rough: 0.6,
        at: [0.92, 3.3, 0],
        rot: [$ / 2, 0, -$ * 0.475 - 0.25],
        bone: `head`,
      }));
    for (let [e, t, n, r, i] of [
      [0.02, 2.26, 0.62, 0.34, -0.3],
      [-0.42, 2.14, 0.66, 0.3, -0.15],
      [0.3, 2.3, 0.4, 0.26, -0.45],
    ])
      c.add(
        q.rock(r, 1, 0.16, 2.4, (e * 31 + n * 17) | 0, [1.25, 0.34, 1]),
        [e, t, n],
        {
          color: `#33282a`,
          tip: `#6a5d56`,
          tipFrom: 0.5,
          kind: K.stone,
          rough: 0.84,
          flat: !0,
          grad: [0.78, 1.08],
          sink: 0.12,
          lean: [-0.3, 1, n * 0.6],
          tilt: i,
          twist: e * 5,
          mirror: !0,
        },
      );
    let v = {
      color: `#312527`,
      tip: `#6e6058`,
      tipFrom: 0.45,
      kind: K.stone,
      rough: 0.84,
      flat: !0,
      localGrad: !0,
      grad: [0.74, 1.12],
    };
    for (let [e, t, n, r, i] of [
      [0.3, 1.92, 0.97, 0.2, 71],
      [0.4, 1.62, 1, 0.17, 72],
      [0.52, 1.24, 1.05, 0.19, 73],
      [0.6, 0.94, 1.06, 0.15, 74],
    ])
      c.add(q.rock(r, 1, 0.22, 2.6, i, [1.35, 0.3, 0.85]), [e, t, n], {
        ...v,
        sink: 0.1,
        lean: [0.35, 1, 0.5],
        tilt: 0.55,
        twist: i * 0.3,
        mirror: !0,
      });
    for (let [e, t, n, r, i] of [
      [0.05, 0.86, 0.46, 0.2, 81],
      [0.14, 0.52, 0.5, 0.16, 82],
      [0.17, 0.26, 0.51, 0.13, 83],
    ])
      c.add(q.rock(r, 1, 0.22, 2.6, i, [1.3, 0.3, 0.85]), [e, t, n], {
        ...v,
        sink: 0.09,
        lean: [0.5, 1, 0.35],
        tilt: 0.5,
        twist: i * 0.2,
        mirror: !0,
      });
    for (let t = 0; t < 2; t++)
      for (let n = 0; n < 13; n++) {
        let r = (n / 12 - 0.5) * 2.9 + t * 0.11,
          i = Math.cos(r),
          a = Math.sin(r),
          o = c.at([
            0.3 - t * 0.26 + i * 0.1,
            2.52 - t * 0.1 - Math.abs(r) * 0.14,
            a * (0.46 + t * 0.08),
          ]);
        $r(
          e,
          o.p,
          o.n,
          [-0.95, 0.2, a * 0.35],
          0.3 + 0.08 * Math.cos(r * 2) - t * 0.04,
          0.042,
          {
            color: `#3e1a10`,
            tip: `#7a3c1c`,
            kind: K.fur,
            skin: () => o.skin,
            thick: 0.6,
            lift: 0.1,
            radial: 5,
            segs: 5,
            occluder: !1,
            aoStrength: 0.2,
          },
        );
      }
    (Yi(e, [1.152, 3.252, 0.15], [0.05, 0.05, 0.075], {
      iris: `#ffb347`,
      socket: `#140a08`,
      tilt: -0.62,
      emit: 1.9,
      bone: `head`,
    }),
      Xi(e, [1.148, 2.98, 0], [0.05, 0.055, 0.28], {
        dark: `#160806`,
        lip: `#c67a33`,
        lipKind: K.skin,
        tilt: -0.3,
        bone: `jaw`,
      }));
    let y = { color: `#4a4240`, kind: K.iron, metal: 0.3, rough: 0.55 };
    for (let t of [1, -1]) {
      let n = [0.55, 1.02, 1.06 * t],
        r = a.skinAt(n[0], n[1], n[2]);
      (e.add(q.cyl(0.35, 0.37, 0.16, 12), {
        ...y,
        flat: !0,
        at: n,
        rot: [0.1 * t, 0, -0.16],
        skin: () => r,
      }),
        e.add(q.torus(0.36, 0.025, 4, 12), {
          ...y,
          color: `#6b5f59`,
          at: [n[0], n[1] + 0.08, n[2]],
          rot: [$ / 2 + 0.1 * t, 0, -0.16],
          skin: () => r,
        }));
    }
    (e.add(
      q.extrude(
        [
          [-0.28, 0],
          [0.28, 0],
          [0.22, -0.55],
          [0, -0.64],
          [-0.22, -0.55],
        ],
        0.04,
        0.015,
        4,
        1,
      ),
      {
        color: `#5a1f18`,
        kind: K.cloth,
        at: [0.72, 1, 0],
        rot: [0, $ / 2, 0.18],
        order: `ZYX`,
        bone: `pelvis`,
        grad: [0.7, 1.05],
      },
    ),
      e.add(q.sphere(0.12, 0.13, 0.13, 10, 8), {
        color: `#d9ccb2`,
        kind: K.bone,
        at: [0.72, 1.04, 0],
        scale: [0.65, 1, 1],
        bone: `pelvis`,
      }));
    for (let t of [1, -1])
      for (let n = -1; n <= 1; n++)
        J(
          e,
          [0.58, 0.08, (0.5 + n * 0.12) * t],
          [1, -0.15, n * 0.25 * t],
          0.13,
          0.045,
          {
            color: `#2b2322`,
            tip: `#cbbfa8`,
            kind: K.bone,
            bone: t > 0 ? `shinR` : `shinL`,
          },
        );
    let b = {
      color: `#3a2220`,
      tip: `#d8c9ae`,
      tipFrom: 0.55,
      kind: K.bone,
      rough: 0.55,
    };
    for (let t of [1, -1]) {
      let n = t > 0 ? `foreR` : `foreL`;
      for (let r = 0; r < 3; r++) {
        let i = (0.95 + r * 0.11) * t,
          a = 0.5 - Math.abs(r - 1) * 0.03;
        (e.add(q.sphere(0.07, 0.065, 0.06, 8, 6), {
          color: `#4a2a22`,
          kind: K.skin,
          rough: 0.7,
          at: [0.8, a, i],
          bone: n,
        }),
          J(
            e,
            [0.84, a - 0.02, i],
            [0.75, -0.65, (r - 1) * 0.3 * t],
            0.15 - Math.abs(r - 1) * 0.02,
            0.04,
            { ...b, bend: [0.2, -0.5, 0], bone: n, radial: 5, segs: 4 },
          ));
      }
      (J(e, [0.72, 0.62, 0.86 * t], [0.4, -0.5, -0.8 * t], 0.13, 0.042, {
        ...b,
        bend: [0.3, -0.2, 0],
        bone: n,
        radial: 5,
        segs: 4,
      }),
        e.add(q.torus(0.2, 0.035, 5, 12), {
          color: `#6b3a24`,
          kind: K.leather,
          rough: 0.8,
          at: [0.62, 0.74, 1.07 * t],
          rot: [$ / 2, 0, -0.1],
          bone: n,
        }));
    }
    return (
      e.frame([0.64, 0.62, 1.07], [0, 0, -1.12], 1, () => {
        (e.add(q.cyl(0.07, 0.095, 1.4, 8), {
          color: `#2d201a`,
          kind: K.wood,
          at: [0, 0.5, 0],
          bone: `foreR`,
        }),
          e.add(q.torus(0.1, 0.03, 4, 10), {
            ...y,
            at: [0, 0.18, 0],
            rot: [$ / 2, 0, 0],
            bone: `foreR`,
          }),
          e.add(q.rock(0.32, 1, 0.14, 2, 33, [0.9, 1.45, 0.9]), {
            color: `#302728`,
            kind: K.stone,
            flat: !0,
            vein: 0.8,
            at: [0, 1.32, 0],
            bone: `foreR`,
          }),
          e.add(q.torus(0.3, 0.045, 4, 12), {
            ...y,
            flat: !0,
            at: [0, 1.14, 0],
            rot: [$ / 2, 0, 0],
            bone: `foreR`,
          }),
          e.add(q.torus(0.27, 0.045, 4, 12), {
            ...y,
            flat: !0,
            at: [0, 1.56, 0],
            rot: [$ / 2, 0, 0],
            bone: `foreR`,
          }));
        for (let t = 0; t < 5; t++) {
          let n = (t / 5) * $ * 2 + 0.3,
            r = 1.36 + ((t % 2) - 0.5) * 0.24;
          J(
            e,
            [Math.cos(n) * 0.26, r, Math.sin(n) * 0.26],
            [Math.cos(n), 0.15, Math.sin(n)],
            0.2,
            0.05,
            {
              color: `#3b3230`,
              tip: `#bfb2a0`,
              kind: K.iron,
              bone: `foreR`,
              radial: 6,
              segs: 4,
            },
          );
        }
      }),
      e.build({ aoFloor: 0.58 })
    );
  }
  function Qi(e, t, n) {
    let r = e.d,
      i = t.walk,
      a = t.phase,
      o = t.t,
      s = 1 - i,
      c = t.combat,
      l = Math.sin(a),
      u = Math.cos(a),
      d = Ri(t),
      f = Math.sin(o * 1.2);
    {
      let e = n.spine * 9;
      ((r[e + 6] *= 1 + f * 0.02),
        (r[e + 7] *= 1 + f * 0.008),
        (r[e + 8] *= 1 + f * 0.02));
    }
    ((r[n.chest * 9 + 4] += f * 0.02),
      (r[n.armR * 9 + 2] += 0.8 + Math.sin(o * 0.9) * 0.03),
      (r[n.foreR * 9 + 2] += 1.1),
      (r[n.armR * 9 + 0] += -0.15),
      (r[n.armL * 9 + 2] += 0.18 + f * 0.03),
      (r[n.foreL * 9 + 2] += 0.3),
      (r[n.armL * 9 + 0] += 0.08),
      (r[n.chest * 9 + 2] += -0.06),
      (r[n.head * 9 + 1] += Math.sin(o * 0.37) * 0.4 * s * (1 - c)),
      (r[n.head * 9 + 2] += Math.sin(o * 0.61) * 0.05 * s),
      (r[n.jaw * 9 + 2] += -0.05 - Math.max(0, Math.sin(o * 1.3)) * 0.07),
      (r[n.thighR * 9 + 2] += l * 0.5 * i),
      (r[n.thighL * 9 + 2] += -l * 0.5 * i),
      (r[n.shinR * 9 + 2] += -Math.max(0, u) * 0.75 * i),
      (r[n.shinL * 9 + 2] += -Math.max(0, -u) * 0.75 * i),
      (r[n.pelvis * 9 + 4] += (Math.abs(u) - 0.6) * 0.12 * i),
      (r[n.pelvis * 9 + 0] += l * 0.09 * i),
      (r[n.chest * 9 + 0] += -l * 0.06 * i),
      (r[n.spine * 9 + 1] += l * 0.12 * i),
      (r[n.armL * 9 + 2] += l * 0.4 * i),
      (r[n.spine * 9 + 2] += -0.1 * i),
      (r[n.head * 9 + 2] += -0.25 * t.reset01),
      (r[n.jaw * 9 + 2] += -0.6 * d),
      (r[n.head * 9 + 2] += 0.35 * d),
      (r[n.armL * 9 + 0] += 0.7 * d),
      (r[n.chest * 9 + 2] += 0.18 * d),
      (r[n.armL * 9 + 2] += 0.4 * d));
    let p = t.antic,
      m = t.strike;
    (t.atkVar === 0
      ? ((r[n.armR * 9 + 2] += 1.35 * p - 1.85 * m),
        (r[n.foreR * 9 + 2] += 0.2 * p - 1.2 * m),
        (r[n.chest * 9 + 2] += 0.25 * p - 0.35 * m),
        (r[n.spine * 9 + 2] += 0.1 * p - 0.2 * m),
        (r[n.spine * 9 + 1] += -0.2 * p + 0.15 * m),
        (r[n.jaw * 9 + 2] += -0.2 * p - 0.45 * m),
        (r[n.pelvis * 9 + 4] += 0.05 * p - 0.16 * m),
        (r[n.thighR * 9 + 2] += -0.3 * m),
        (r[n.thighL * 9 + 2] += 0.4 * m),
        (r[n.shinL * 9 + 2] += -0.4 * m))
      : ((r[n.armL * 9 + 2] += 1.1 * p + 0.7 * m),
        (r[n.armL * 9 + 1] += 0.8 * p - 1.3 * m),
        (r[n.armL * 9 + 0] += 0.4 * p),
        (r[n.foreL * 9 + 2] += 0.6 * p - 0.3 * m),
        (r[n.spine * 9 + 1] += 0.35 * p - 0.5 * m),
        (r[n.chest * 9 + 2] += 0.1 * p - 0.2 * m),
        (r[n.jaw * 9 + 2] += -0.3 * m),
        (r[n.root * 9 + 3] += 0.2 * m)),
      (t.glowOut +=
        0.3 + 0.2 * Math.sin(o * 1.7) + 1.2 * d + 0.8 * p + 0.6 * m));
  }
  let $i = {
    build: Zi,
    animate: Qi,
    stride: 1.1,
    overhead: 3.85,
    shadow: [1.35, 1.3],
    glow: `#ff5a10`,
    fall: 1.45,
    fallForward: !0,
    fallLift: 0.45,
    rig: {
      root: `root`,
      body: `chest`,
      head: `head`,
      limbs: [`armL`],
      flail: 0.5,
      thighs: [`thighR`, `thighL`],
      shins: [`shinR`, `shinL`],
      spine: [`spine`],
    },
    fallSide: 0.55,
    anchors: {
      head: [`head`, [0.9, 3.26, 0]],
      chest: [`chest`, [0.7, 1.95, 0]],
      weapon: [`foreR`, [1.8, 1.25, 1.07]],
      muzzle: [`foreR`, [1.8, 1.25, 1.07]],
    },
    halos: [
      {
        bone: `head`,
        at: [1.12, 3.23, 0],
        size: 0.3,
        color: `#ff8a3a`,
        alpha: 0.18,
        boost: 0.4,
      },
    ],
  };
  function ea() {
    let e = [0.25, 2.55, 0.55],
      t = [-0.45, 3.12, 1.18],
      n = [-1.42, 2.8, 1.4],
      r = [
        [-2.5, 3, 1.78],
        [-2.95, 2.3, 1.6],
        [-2.75, 1.75, 1.14],
      ],
      i = [-1.45, 2.05, 0.46],
      a = [0.15, 2.3, 0.5],
      o = new Xr(
        [
          [`root`, null, [0, 0, 0]],
          [`pelvis`, `root`, [-0.85, 1.75, 0]],
          [`chest`, `pelvis`, [0.55, 2, 0]],
          [`neck1`, `chest`, [1.15, 2.35, 0]],
          [`neck2`, `neck1`, [1.55, 2.95, 0]],
          [`neck3`, `neck2`, [1.9, 3.5, 0]],
          [`head`, `neck3`, [2.2, 3.82, 0]],
          [`jaw`, `head`, [2.45, 3.66, 0]],
          [`armR`, `chest`, [0.75, 1.75, 0.62]],
          [`foreArmR`, `armR`, [0.95, 0.98, 0.74]],
          [`handR`, `foreArmR`, [1, 0.28, 0.78]],
          [`armL`, `chest`, [0.75, 1.75, -0.62]],
          [`foreArmL`, `armL`, [0.95, 0.98, -0.74]],
          [`handL`, `foreArmL`, [1, 0.28, -0.78]],
          [`thighR`, `pelvis`, [-0.9, 1.7, 0.66]],
          [`shinR`, `thighR`, [-0.5, 0.92, 0.84]],
          [`footR`, `shinR`, [-0.82, 0.28, 0.9]],
          [`thighL`, `pelvis`, [-0.9, 1.7, -0.66]],
          [`shinL`, `thighL`, [-0.5, 0.92, -0.84]],
          [`footL`, `shinL`, [-0.82, 0.28, -0.9]],
          [`wingR`, `chest`, e],
          [`foreWingR`, `wingR`, t],
          [`handWingR`, `foreWingR`, n],
          [`wingL`, `chest`, qi(e)],
          [`foreWingL`, `wingL`, qi(t)],
          [`handWingL`, `foreWingL`, qi(n)],
          [`tail1`, `pelvis`, [-1.65, 1.72, 0]],
          [`tail2`, `tail1`, [-2.45, 1.4, 0]],
          [`tail3`, `tail2`, [-3.2, 0.95, 0.12]],
          [`tail4`, `tail3`, [-3.8, 0.5, 0.38]],
        ],
        { seed: 808, texScale: 0.4 },
      ),
      s = `#3f5586`,
      c = `#222c47`,
      l = `#a9b7c9`,
      u = `#86acf2`,
      d = new ri({
        voxel: 0.068,
        soft: 0.16,
        skinSoft: 0.26,
        noiseFreq: 2.2,
        seed: 8,
      });
    (d.ellipsoid([-0.85, 1.82, 0], [0.78, 0.6, 0.62], {
      bone: `pelvis`,
      color: s,
      k: 0.3,
    }),
      d.cone([-0.75, 1.8, 0], [0.45, 2.05, 0], 0.62, 0.72, {
        bones: [`pelvis`, `chest`],
        color: s,
        k: 0.3,
        vein: 0.35,
      }),
      d.ellipsoid([0.55, 2.05, 0], [0.82, 0.76, 0.72], {
        bone: `chest`,
        color: s,
        k: 0.28,
      }),
      d.ellipsoid([-0.05, 1.5, 0], [1.05, 0.4, 0.5], {
        bones: [`pelvis`, `chest`],
        color: l,
        w2: 1,
        k: 0.22,
      }),
      d.sym((e, t) =>
        d.ellipsoid(t([0, 1.85, 0.42]), [1.2, 0.35, 0.28], {
          bones: [`pelvis`, `chest`],
          color: `#5a73a6`,
          k: 0.25,
        }),
      ),
      d.ellipsoid([0.85, 1.72, 0], [0.5, 0.5, 0.5], {
        bone: `chest`,
        color: l,
        w2: 1,
        k: 0.2,
      }),
      d.cone([-0.9, 2.3, 0], [0.5, 2.62, 0], 0.18, 0.2, {
        bones: [`pelvis`, `chest`],
        color: c,
        k: 0.35,
        vein: 0.8,
      }),
      d.cone([0.85, 2.3, 0], [1.4, 2.9, 0], 0.52, 0.4, {
        bones: [`chest`, `neck1`],
        color: s,
        k: 0.22,
      }),
      d.cone([1.4, 2.9, 0], [1.8, 3.45, 0], 0.4, 0.33, {
        bones: [`neck1`, `neck2`],
        color: s,
        k: 0.18,
      }),
      d.cone([1.8, 3.45, 0], [2.15, 3.8, 0], 0.33, 0.3, {
        bones: [`neck2`, `neck3`],
        color: s,
        k: 0.15,
      }),
      d.cone([1.05, 2.12, 0], [1.9, 3.3, 0], 0.3, 0.2, {
        bones: [`neck1`, `neck3`],
        color: l,
        w2: 1,
        k: 0.18,
      }),
      d.ellipsoid([2.3, 3.95, 0], [0.38, 0.3, 0.31], {
        bone: `head`,
        color: u,
        k: 0.12,
      }),
      d.cone([2.5, 3.9, 0], [3.45, 3.81, 0], 0.24, 0.1, {
        bone: `head`,
        color: u,
        k: 0.1,
      }),
      d.box([2.95, 3.92, 0], [0.44, 0.07, 0.14], 0.055, {
        rot: [0, 0, -0.1],
        bone: `head`,
        color: c,
        k: 0.06,
      }),
      d.cone([3.28, 3.87, 0], [3.52, 3.93, 0], 0.07, 0.035, {
        bone: `head`,
        color: c,
        k: 0.04,
      }),
      d.cone([2.45, 3.67, 0], [3.35, 3.66, 0], 0.15, 0.065, {
        bone: `jaw`,
        color: l,
        k: 0.06,
      }),
      d.box([3, 3.76, 0], [0.55, 0.018, 0.3], 0.01, {
        sub: !0,
        k: 0.03,
        bone: `head`,
      }),
      d.sym((e, r) => {
        let i = (t) => (e > 0 ? t : t.replace(/R$/, `L`));
        (d.ellipsoid(r([2.44, 3.8, 0.21]), [0.3, 0.17, 0.13], {
          bone: `head`,
          color: u,
          k: 0.08,
        }),
          d.box(r([2.62, 4.08, 0.19]), [0.27, 0.055, 0.07], 0.035, {
            rot: [0.3 * e, -0.35 * e, -0.3],
            bone: `head`,
            color: c,
            k: 0.05,
          }),
          d.sphere(r([2.72, 3.99, 0.235]), 0.065, {
            sub: !0,
            k: 0.03,
            bone: `head`,
          }),
          d.sphere(r([3.44, 3.9, 0.07]), 0.035, {
            sub: !0,
            k: 0.02,
            bone: `head`,
          }),
          d.cone(r([0.62, 2, 0.5]), r([0.95, 1.02, 0.74]), 0.38, 0.24, {
            bones: [i(`armR`), i(`foreArmR`)],
            color: s,
            k: 0.18,
          }),
          d.cone(r([0.95, 1.02, 0.74]), r([1, 0.3, 0.78]), 0.25, 0.17, {
            bone: i(`foreArmR`),
            color: s,
            k: 0.1,
          }),
          d.ellipsoid(r([1.12, 0.14, 0.78]), [0.3, 0.13, 0.22], {
            bone: i(`handR`),
            color: c,
            k: 0.1,
          }),
          d.ellipsoid(r([-0.78, 1.45, 0.7]), [0.5, 0.64, 0.4], {
            rot: [0, 0, -0.4],
            bone: i(`thighR`),
            color: s,
            k: 0.22,
          }),
          d.cone(r([-0.5, 0.98, 0.84]), r([-0.82, 0.3, 0.9]), 0.28, 0.18, {
            bones: [i(`thighR`), i(`shinR`)],
            color: s,
            k: 0.1,
          }),
          d.ellipsoid(r([-0.62, 0.14, 0.92]), [0.34, 0.13, 0.22], {
            bone: i(`footR`),
            color: c,
            k: 0.1,
          }),
          d.cone(r([0.3, 2.45, 0.45]), r(t), 0.26, 0.13, {
            bones: [i(`wingR`), i(`foreWingR`)],
            color: c,
            k: 0.2,
          }),
          d.cone(r(t), r(n), 0.13, 0.1, {
            bones: [i(`foreWingR`), i(`handWingR`)],
            color: c,
            k: 0.06,
          }));
      }),
      d.cone([-1.55, 1.82, 0], [-2.45, 1.45, 0], 0.52, 0.36, {
        bones: [`pelvis`, `tail1`],
        color: s,
        k: 0.22,
      }),
      d.cone([-2.45, 1.45, 0], [-3.2, 0.98, 0.12], 0.36, 0.24, {
        bones: [`tail1`, `tail2`],
        color: s,
        k: 0.12,
      }),
      d.cone([-3.2, 0.98, 0.12], [-3.8, 0.54, 0.38], 0.24, 0.15, {
        bones: [`tail2`, `tail3`],
        color: s,
        k: 0.1,
      }),
      d.cone([-3.8, 0.54, 0.38], [-4.4, 0.38, 0.86], 0.15, 0.1, {
        bones: [`tail3`, `tail4`],
        color: c,
        k: 0.08,
      }),
      d.build(o, {
        kind: K.scales,
        kind2: K.shell,
        aoScale: 0.6,
        ao: 1.1,
        lodMax: 1.6,
        lodK: 1,
        paint: (e, t, n, r, i, a, o) => {
          let s = Math.max(0, Math.min(1, r[1] * 1.4 - 0.1)),
            c = Math.max(0, Math.min(1, -r[1] * 1.6 - 0.1)),
            l = [0.33, 0.42, 0.55];
          for (let e of [i, a])
            for (let t = 0; t < 3; t++) {
              let n = o * 3 + t;
              e[n] = e[n] * (1.08 - 0.34 * s) * (1 - c * 0.5) + l[t] * c * 0.5;
            }
        },
      }));
    let f = new Ji(o, d),
      p = {
        color: `#31405e`,
        tip: `#dcaa42`,
        tipFrom: 0.02,
        kind: K.shell,
        rough: 0.38,
        vein: 0.5,
        aoStrength: 0.6,
      },
      m = [
        [2.05, 4, 0.2],
        [1.78, 3.7, 0.24],
        [1.5, 3.3, 0.28],
        [1.2, 2.88, 0.32],
        [0.62, 2.72, 0.4],
        [0.05, 2.66, 0.44],
        [-0.55, 2.55, 0.44],
        [-1.15, 2.38, 0.4],
        [-1.75, 2.12, 0.36],
        [-2.35, 1.8, 0.3],
        [-2.92, 1.4, 0.24],
        [-3.45, 1.02, 0.18],
      ];
    for (let e = 0; e < m.length; e++) {
      let [t, n, r] = m[e],
        i = m[Math.min(m.length - 1, e + 1)],
        a = m[Math.max(0, e - 1)],
        o = i[0] - a[0],
        s = i[1] - a[1];
      f.add(q.scute(r * 1.7, r * 1.25, r * 0.32), [t, n + 0.7, 0], {
        ...p,
        tipAxis: `y`,
        sink: 0.03,
        lean: [-o, 0.7 - s, 0],
        tilt: 0.3,
        twist: $,
      });
    }
    let h = {
      color: `#2a3555`,
      tip: `#6c80a8`,
      tipFrom: 0.4,
      tipAxis: `x`,
      kind: K.shell,
      rough: 0.42,
      vein: 0.3,
      aoStrength: 0.7,
      flat: !0,
      localGrad: !0,
      grad: [0.9, 1.06],
    };
    for (let [e, t, n, r, i, a] of [
      [0.55, 2.05, 0.66, 0.8, 0.5, 0.55],
      [0, 1.95, 0.72, 0.88, 0.54, 0.5],
      [-0.62, 1.9, 0.68, 0.82, 0.5, 0.45],
      [-1.2, 1.85, 0.56, 0.68, 0.42, 0.42],
      [0.95, 2.1, 0.5, 0.62, 0.4, 0.6],
    ])
      f.add(q.scute(r, i, i * 0.16), [e, t, n], {
        ...h,
        sink: 0.09,
        lean: [-0.35, 0.45, 1],
        tilt: a,
        twist: $ * 0.5 + n * 0.3,
        mirror: !0,
      });
    let g = {
        color: `#27304a`,
        tip: `#d9b463`,
        kind: K.bone,
        rough: 0.5,
        collarKind: K.gold,
        collarColor: `#c79a42`,
      },
      _ = {
        color: `#78e6ff`,
        kind: K.crystal,
        emit: 1.5,
        rough: 0.1,
        flat: !0,
        localGrad: !0,
        grad: [0.75, 1.15],
      };
    for (let [e, t, n, r] of [
      [2.02, 4.05, 0.22, 0.05],
      [1.72, 3.72, 0.28, 0.06],
      [1.4, 3.25, 0.34, 0.07],
      [1.1, 2.8, 0.38, 0.08],
      [-0.95, 2.45, 0.46, 0.09],
      [-1.55, 2.28, 0.42, 0.085],
      [-2.15, 1.95, 0.36, 0.075],
      [-2.75, 1.55, 0.3, 0.065],
      [-3.3, 1.18, 0.24, 0.055],
      [-3.85, 0.72, 0.18, 0.045],
    ]) {
      let i = f.at([e, t + 0.6, 0]),
        a = i.skin;
      J(o, [i.p[0], i.p[1] - 0.04, i.p[2]], [-0.55, 1, 0], n * 1.25, r, {
        ...g,
        bend: [-0.6, 0, 0],
        skin: () => a,
        collar: !0,
      });
    }
    for (let [e, t, n, r, i] of [
      [0.55, 2.7, 0, 0.17, 1.05],
      [0.15, 2.66, 0.14, 0.14, 0.85],
      [0.2, 2.64, -0.16, 0.12, 0.75],
      [-0.25, 2.55, 0.05, 0.13, 0.8],
      [0.8, 2.6, 0.18, 0.09, 0.55],
      [0.8, 2.6, -0.18, 0.09, 0.5],
    ])
      f.add(q.crystal(r, i, 6), [e, t, n], {
        ..._,
        sink: 0.15,
        lean: [-0.8, 1, n * 3],
        tilt: 0.35,
        twist: e * 4,
      });
    (J(o, [2.28, 4.12, 0.22], [-1, 0.5, 0.32], 1.25, 0.15, {
      ...g,
      color: `#303a55`,
      bend: [0.05, -0.3, 0.2],
      bone: `head`,
      mirror: !0,
      collar: !0,
      radial: 12,
      segs: 14,
    }),
      J(o, [2.46, 4.06, 0.3], [-0.8, 0.4, 0.75], 0.6, 0.075, {
        ...g,
        bend: [-0.1, -0.2, 0.1],
        bone: `head`,
        mirror: !0,
      }));
    for (let e = 0; e < 3; e++)
      J(
        o,
        [2.25 - e * 0.14, 3.72 + e * 0.02, 0.3],
        [-0.6, -0.1, 1],
        0.32 - e * 0.05,
        0.05,
        { ...g, bend: [-0.3, 0, 0], bone: `jaw`, mirror: !0 },
      );
    (o.add(q.sphere(0.086, 0.06, 0.071, 14, 10), {
      color: `#0f1526`,
      kind: K.scales,
      rough: 0.5,
      at: [2.728, 3.99, 0.222],
      bone: `head`,
      mirror: !0,
      occluder: !1,
    }),
      o.add(q.sphere(0.07, 0.045, 0.055, 14, 10), {
        color: `#bff3ff`,
        kind: K.eye,
        emit: 1.98,
        at: [2.735, 3.99, 0.228],
        bone: `head`,
        mirror: !0,
        occluder: !1,
      }),
      o.add(q.box(0.014, 0.058, 0.026, 0.004), {
        color: `#050a12`,
        kind: K.scales,
        rough: 0.3,
        at: [2.761, 3.997, 0.277],
        rot: [0, -1.05, 0.12],
        bone: `head`,
        mirror: !0,
        occluder: !1,
        recvAO: !1,
      }));
    for (let e = 0; e < 2; e++)
      J(
        o,
        [2.34 - e * 0.16, 3.82 - e * 0.03, 0.3],
        [-0.7, 0.05, 0.75],
        0.3 - e * 0.07,
        0.05,
        { ...g, bend: [-0.35, 0.1, 0], bone: `head`, mirror: !0 },
      );
    J(o, [3.05, 3.6, 0], [0.2, -1, 0], 0.16, 0.05, {
      ...g,
      bend: [0.4, 0, 0],
      bone: `jaw`,
    });
    for (let e = 0; e < 5; e++)
      J(o, [2.72 + e * 0.13, 3.72, 0.16 - e * 0.02], [0, -1, 0], 0.13, 0.03, {
        color: `#dfe6ec`,
        tip: `#ffffff`,
        kind: K.bone,
        bone: `head`,
        mirror: !0,
        radial: 5,
        segs: 3,
      });
    for (let e = 0; e < 4; e++)
      J(o, [2.76 + e * 0.14, 3.64, 0.15 - e * 0.02], [0, 1, 0], 0.1, 0.026, {
        color: `#dfe6ec`,
        tip: `#ffffff`,
        kind: K.bone,
        bone: `jaw`,
        mirror: !0,
        radial: 5,
        segs: 3,
      });
    for (let e of [1, -1])
      for (let t = -1; t <= 1; t++)
        (J(
          o,
          [1.36, 0.1, (0.78 + t * 0.12) * e],
          [1, -0.35, t * 0.3 * e],
          0.28,
          0.055,
          {
            color: `#1a1f2c`,
            tip: `#b9c2cf`,
            kind: K.bone,
            bend: [0, -0.4, 0],
            bone: e > 0 ? `handR` : `handL`,
          },
        ),
          J(
            o,
            [-0.3, 0.1, (0.92 + t * 0.12) * e],
            [1, -0.35, t * 0.3 * e],
            0.26,
            0.055,
            {
              color: `#1a1f2c`,
              tip: `#b9c2cf`,
              kind: K.bone,
              bend: [0, -0.4, 0],
              bone: e > 0 ? `footR` : `footL`,
            },
          ));
    let v = (e, t, n = 6) =>
        Array.from({ length: n }, (r, i) => Ki(e, t, i / (n - 1))),
      y = {
        color: `#3a4fa0`,
        kind: K.membrane,
        rough: 0.6,
        vein: 0.4,
        grad: [0.44, 1.5],
        tex: 1.2,
        conv: !1,
      },
      b = {
        color: `#6784cf`,
        tip: `#d7e0ee`,
        tipFrom: 0.25,
        kind: K.bone,
        rough: 0.45,
      };
    (J(o, t, [0.1, 1, 0.25], 0.55, 0.12, {
      ...g,
      color: `#4f67a8`,
      bend: [-0.2, 0, 0],
      bone: `foreWingR`,
      mirror: !0,
    }),
      J(o, n, [-0.4, 1, 0.4], 0.35, 0.085, {
        ...g,
        color: `#4f67a8`,
        bend: [-0.2, -0.2, 0],
        bone: `handWingR`,
        mirror: !0,
      }));
    for (let e of r)
      o.add(
        q.tube(
          [n, Ki(n, e, 0.5).map((e, t) => e + [0, 0.12, 0.06][t]), e],
          (e) => 0.125 * (1 - e) + 0.03,
          { radial: 8, segs: 12 },
        ),
        { ...b, bone: `handWingR`, mirror: !0 },
      );
    let x = [...v(e, t, 4), ...v(t, n, 4).slice(1)];
    (o.add(q.membrane(x, v(a, n, 7), 4, 0.02), {
      ...y,
      pair: [`foreWingR`, `chest`],
      mirror: !0,
    }),
      o.add(q.membrane(v(n, r[0], 7), v(n, r[1], 7), 6, 0.02, n, 0.26), {
        ...y,
        bone: `handWingR`,
        mirror: !0,
      }),
      o.add(q.membrane(v(n, r[1], 7), v(n, r[2], 7), 6, 0.02, n, 0.26), {
        ...y,
        bone: `handWingR`,
        mirror: !0,
      }));
    for (let e = 0; e < 2; e++) {
      let t = Ki(r[e], r[e + 1], 0.5),
        i = Ki(n, t, 0.55).map((e, t) => e - [0, 0.13, 0][t]);
      o.add(
        q.tube([n, i, t], (e) => 0.055 * (1 - e) + 0.014, {
          radial: 6,
          segs: 10,
        }),
        {
          ...b,
          color: `#5470bb`,
          tip: `#b6c2d8`,
          bone: `handWingR`,
          mirror: !0,
        },
      );
    }
    o.add(
      q.membrane(v(n, r[2], 7), v(a, i, 7), 7, 0.02, [-1.2, 2.3, 1.2], 0.2),
      { ...y, pair: [`handWingR`, `chest`], mirror: !0 },
    );
    {
      let e = [-4.4, 0.38, 0.86],
        t = Wi([-0.74, -0.08, 0.67]),
        n = [e, Gi(e, t, 0.36), Gi(e, t, 0.74), Gi(e, t, 1.08)],
        r = (e) =>
          0.27 * Math.sin(Math.min(1, 0.14 + e * 1.1) * $) * (1 - e * 0.3) +
          0.022,
        i = (e) => 0.058 * (1 - e * 0.72) + 0.009;
      (o.add(
        q.loft(
          n,
          (e) => {
            let t = r(e),
              n = i(e);
            return [
              [0, t],
              [0.38 * n, 0.44 * t],
              [n, 0.04 * t],
              [0.5 * n, -0.5 * t],
              [0, -0.64 * t],
              [-0.5 * n, -0.5 * t],
              [-n, 0.04 * t],
              [-0.38 * n, 0.44 * t],
            ];
          },
          { segs: 22, up: [0, 1, 0] },
        ),
        {
          color: `#1b2540`,
          tip: `#6d8fc4`,
          tipFrom: 0.35,
          kind: K.bone,
          rough: 0.34,
          flat: !0,
          bone: `tail4`,
        },
      ),
        o.add(
          q.loft(
            n,
            (e) => {
              let t = r(e);
              return [
                [0.013, t - 0.032],
                [0, t + 0.014],
                [-0.013, t - 0.032],
                [0, t - 0.08],
              ];
            },
            { segs: 22, up: [0, 1, 0] },
          ),
          {
            color: `#9ff0ff`,
            kind: K.shell,
            emit: 5,
            vein: 1,
            grad: [1, 1],
            rough: 0.2,
            bone: `tail4`,
            occluder: !1,
            recvAO: !1,
          },
        ));
    }
    return o.build({ aoFloor: 0.5, aoHeight: 2 });
  }
  function ta(e, t, n) {
    let r = e.d,
      i = t.t,
      a = t.walk,
      o = t.phase,
      s = 1 - a,
      c = t.combat,
      l = Ri(t, 1.4),
      u = Math.sin(o),
      d = Math.cos(o),
      f = Math.sin(i * 1.1);
    {
      let e = n.chest * 9,
        t = 1 + f * 0.02;
      ((r[e + 6] *= t), (r[e + 7] *= t), (r[e + 8] *= t));
    }
    ((r[n.pelvis * 9 + 4] += f * 0.02),
      (r[n.neck1 * 9 + 1] += Math.sin(i * 0.5) * 0.06),
      (r[n.neck2 * 9 + 1] += Math.sin(i * 0.5 - 0.6) * 0.08),
      (r[n.neck3 * 9 + 1] += Math.sin(i * 0.5 - 1.2) * 0.1),
      (r[n.neck2 * 9 + 2] += Math.sin(i * 0.7) * 0.04),
      (r[n.head * 9 + 1] += Math.sin(i * 0.27) * 0.35 * s * (1 - c)),
      (r[n.head * 9 + 2] += Math.sin(i * 0.61) * 0.07),
      (r[n.jaw * 9 + 2] += -0.05 - Math.max(0, Math.sin(i * 0.9)) * 0.1),
      (r[n.tail1 * 9 + 1] += Math.sin(i * 0.8) * 0.08),
      (r[n.tail2 * 9 + 1] += Math.sin(i * 0.8 - 0.7) * 0.12),
      (r[n.tail3 * 9 + 1] += Math.sin(i * 0.8 - 1.4) * 0.16),
      (r[n.tail4 * 9 + 1] += Math.sin(i * 0.8 - 2.1) * 0.22),
      (r[n.tail4 * 9 + 2] += Math.sin(i * 1.3) * 0.1));
    let p = Math.sin(i * 1.1) * 0.03;
    ((r[n.wingR * 9 + 0] += p),
      (r[n.wingL * 9 + 0] += -p),
      (r[n.foreWingR * 9 + 0] += -p * 0.6),
      (r[n.foreWingL * 9 + 0] += p * 0.6));
    let m = Math.sin(i * 17.3) * Math.sin(i * 6.1 + t.seed * 9);
    ((t.glowOut += 0.3 + (m > 0.6 ? 1.2 : 0) + 0.25 * c),
      (r[n.thighR * 9 + 2] += u * 0.42 * a),
      (r[n.armL * 9 + 2] += u * 0.42 * a),
      (r[n.thighL * 9 + 2] += -u * 0.42 * a),
      (r[n.armR * 9 + 2] += -u * 0.42 * a),
      (r[n.shinR * 9 + 2] += -Math.max(0, d) * 0.55 * a),
      (r[n.foreArmL * 9 + 2] += -Math.max(0, d) * 0.5 * a),
      (r[n.shinL * 9 + 2] += -Math.max(0, -d) * 0.55 * a),
      (r[n.foreArmR * 9 + 2] += -Math.max(0, -d) * 0.5 * a),
      (r[n.pelvis * 9 + 0] += u * 0.05 * a),
      (r[n.chest * 9 + 1] += -u * 0.06 * a),
      (r[n.chest * 9 + 4] += Math.abs(u) * 0.08 * a),
      (r[n.neck1 * 9 + 2] += -0.12 * a),
      (r[n.neck1 * 9 + 2] += -0.2 * t.reset01),
      (r[n.wingR * 9 + 0] += -0.1 * t.reset01),
      (r[n.wingL * 9 + 0] += 0.1 * t.reset01),
      (r[n.pelvis * 9 + 2] += 0.12 * l),
      (r[n.neck1 * 9 + 2] += 0.25 * l),
      (r[n.head * 9 + 2] += 0.25 * l),
      (r[n.jaw * 9 + 2] += -0.6 * l),
      (r[n.wingR * 9 + 0] += 0.6 * l),
      (r[n.wingL * 9 + 0] += -0.6 * l),
      (r[n.foreWingR * 9 + 0] += 0.45 * l),
      (r[n.foreWingL * 9 + 0] += -0.45 * l),
      (r[n.handWingR * 9 + 1] += -0.4 * l),
      (r[n.handWingL * 9 + 1] += 0.4 * l));
    let h = t.antic,
      g = t.strike;
    ((r[n.pelvis * 9 + 2] += 0.16 * h - 0.06 * g),
      (r[n.neck1 * 9 + 2] += 0.3 * h - 0.42 * g),
      (r[n.neck2 * 9 + 2] += 0.26 * h - 0.3 * g),
      (r[n.neck3 * 9 + 2] += -0.1 * h - 0.12 * g),
      (r[n.head * 9 + 2] += -0.18 * h + 0.06 * g),
      (r[n.jaw * 9 + 2] += -0.3 * h - 0.62 * g),
      (r[n.wingR * 9 + 0] += 0.5 * h - 0.2 * g),
      (r[n.wingL * 9 + 0] += -0.5 * h + 0.2 * g),
      (r[n.foreWingR * 9 + 0] += 0.3 * h - 0.15 * g),
      (r[n.foreWingL * 9 + 0] += -0.3 * h + 0.15 * g),
      (r[n.handWingR * 9 + 1] += -0.35 * h + 0.15 * g),
      (r[n.handWingL * 9 + 1] += 0.35 * h - 0.15 * g),
      (r[n.armR * 9 + 2] += -0.25 * h + 0.2 * g),
      (r[n.armL * 9 + 2] += -0.25 * h + 0.2 * g),
      (t.glowOut += 2.2 * h + 2.6 * g + 1 * l));
  }
  function na(e, t, n) {
    let r = e.d,
      i = ai((t.deathT - 0.15) / 0.9);
    ((r[n.neck1 * 9 + 2] += -0.32 * i),
      (r[n.neck2 * 9 + 2] += -0.35 * i),
      (r[n.neck3 * 9 + 2] += -0.3 * i),
      (r[n.jaw * 9 + 2] += -0.3 * i),
      (r[n.pelvis * 9 + 4] += -0.6 * i),
      (r[n.wingR * 9 + 0] += -0.35 * i),
      (r[n.wingL * 9 + 0] += 0.35 * i),
      (r[n.thighR * 9 + 2] += 0.5 * i),
      (r[n.thighL * 9 + 2] += 0.5 * i),
      (r[n.shinR * 9 + 2] += -0.9 * i),
      (r[n.shinL * 9 + 2] += -0.9 * i),
      (r[n.armR * 9 + 2] += -0.5 * i),
      (r[n.armL * 9 + 2] += -0.5 * i),
      (r[n.foreArmR * 9 + 2] += 0.9 * i),
      (r[n.foreArmL * 9 + 2] += 0.9 * i));
  }
  let ra = {
    build: ea,
    animate: ta,
    onDeath: na,
    scale: 0.698,
    clear: 0.6,
    shadowScale: 0.6,
    stride: 1.6,
    turnRate: 3,
    overhead: 5.2,
    shadow: [2.1, 1.82],
    glow: `#62d8ff`,
    flinch: 0.15,
    kb: 0.15,
    fall: 0.15,
    fallLift: 0,
    dissolve: [1.6, 2.4],
    rig: { root: `root`, body: `chest`, head: `head`, limbs: [], flail: 0 },
    anchors: {
      head: [`head`, [2.66, 3.95, 0]],
      chest: [`chest`, [1, 2, 0]],
      weapon: [`head`, [3.3, 3.75, 0]],
      muzzle: [`head`, [3.3, 3.75, 0]],
    },
    halos: [
      {
        bone: `head`,
        at: [2.95, 3.76, 0],
        size: 0.7,
        color: `#8fe9ff`,
        alpha: 0.14,
        boost: 0.7,
      },
      {
        bone: `chest`,
        at: [0.3, 3.1, 0],
        size: 1.3,
        color: `#6fd8ff`,
        alpha: 0.14,
        boost: 0.25,
        flicker: 0.7,
      },
      {
        bone: `tail4`,
        at: [-4.9, 0.4, 1.35],
        size: 0.6,
        color: `#7fe8ff`,
        alpha: 0.18,
        flicker: 0.4,
      },
    ],
  };
  function ia() {
    let e = new Xr(
        [
          [`root`, null, [0, 0, 0]],
          [`hips`, `root`, [-0.5, 0.92, 0]],
          [`chest`, `root`, [0.3, 0.98, 0]],
          [`neck`, `chest`, [0.62, 1.08, 0]],
          [`head`, `neck`, [0.95, 1.25, 0]],
          [`jaw`, `head`, [1.08, 1.13, 0]],
          [`tail1`, `hips`, [-0.85, 0.98, 0]],
          [`tail2`, `tail1`, [-1.25, 0.9, 0]],
          [`legFR`, `chest`, [0.42, 0.86, 0.22]],
          [`pawFR`, `legFR`, [0.48, 0.46, 0.24]],
          [`legFL`, `chest`, [0.42, 0.86, -0.22]],
          [`pawFL`, `legFL`, [0.48, 0.46, -0.24]],
          [`legBR`, `hips`, [-0.55, 0.82, 0.21]],
          [`pawBR`, `legBR`, [-0.68, 0.42, 0.23]],
          [`legBL`, `hips`, [-0.55, 0.82, -0.21]],
          [`pawBL`, `legBL`, [-0.68, 0.42, -0.23]],
        ],
        { seed: 303, texScale: 2.2 },
      ),
      t = `#9c4a2c`,
      n = `#521f12`,
      r = `#e0b184`,
      i = new ri({
        voxel: 0.032,
        soft: 0.07,
        skinSoft: 0.12,
        noiseFreq: 7,
        seed: 31,
      });
    (i.ellipsoid([-0.56, 0.93, 0], [0.33, 0.26, 0.24], {
      bone: `hips`,
      color: t,
      k: 0.12,
    }),
      i.cone([-0.5, 0.95, 0], [0.22, 1, 0], 0.22, 0.34, {
        bones: [`hips`, `chest`],
        color: t,
        k: 0.14,
      }),
      i.ellipsoid([0.3, 1, 0], [0.42, 0.38, 0.34], {
        bone: `chest`,
        color: t,
        k: 0.12,
      }),
      i.ellipsoid([0.42, 1.16, 0], [0.4, 0.36, 0.4], {
        bones: [`chest`, `neck`],
        color: n,
        k: 0.14,
        noise: 0.02,
      }),
      i.ellipsoid([-0.05, 0.8, 0], [0.55, 0.14, 0.2], {
        bones: [`hips`, `chest`],
        color: r,
        k: 0.12,
      }),
      i.ellipsoid([0.36, 0.8, 0], [0.26, 0.2, 0.22], {
        bone: `chest`,
        color: r,
        k: 0.1,
      }),
      i.cone([0.5, 1.1, 0], [0.95, 1.25, 0], 0.29, 0.2, {
        bones: [`neck`, `head`],
        color: n,
        k: 0.1,
      }),
      i.ellipsoid([1.02, 1.3, 0], [0.22, 0.19, 0.2], {
        bone: `head`,
        color: `#eab861`,
        k: 0.08,
      }),
      i.cone([1.1, 1.25, 0], [1.48, 1.17, 0], 0.125, 0.055, {
        bone: `head`,
        color: `#f2d9b6`,
        k: 0.07,
      }),
      i.cone([1.08, 1.1, 0], [1.4, 1.1, 0], 0.095, 0.055, {
        bone: `jaw`,
        color: r,
        k: 0.05,
      }),
      i.sym((e, r) => {
        let a = (t) => (e > 0 ? t : t.replace(/R$/, `L`));
        (i.ellipsoid(r([1.14, 1.38, 0.1]), [0.1, 0.045, 0.07], {
          rot: [0.3 * e, 0, -0.2],
          bone: `head`,
          color: n,
          k: 0.04,
        }),
          i.ellipsoid(r([0.9, 1.2, 0.18]), [0.16, 0.13, 0.1], {
            bone: `head`,
            color: n,
            k: 0.06,
            noise: 0.015,
          }),
          i.cone(r([0.92, 1.4, 0.12]), r([0.82, 1.7, 0.2]), 0.09, 0.012, {
            bone: `head`,
            color: n,
            k: 0.04,
          }),
          i.cone(r([0.4, 0.95, 0.2]), r([0.48, 0.5, 0.24]), 0.16, 0.09, {
            bones: [a(`legFR`), a(`pawFR`)],
            color: t,
            k: 0.07,
          }),
          i.ellipsoid(r([0.44, 0.78, 0.22]), [0.11, 0.18, 0.09], {
            bone: a(`legFR`),
            color: t,
            k: 0.06,
          }),
          i.cone(r([0.48, 0.5, 0.24]), r([0.52, 0.1, 0.24]), 0.075, 0.058, {
            bone: a(`pawFR`),
            color: n,
            k: 0.04,
          }),
          i.ellipsoid(r([0.58, 0.06, 0.24]), [0.11, 0.055, 0.08], {
            bone: a(`pawFR`),
            color: n,
            k: 0.04,
          }),
          i.ellipsoid(r([-0.55, 0.72, 0.21]), [0.18, 0.26, 0.12], {
            rot: [0, 0, 0.3],
            bone: a(`legBR`),
            color: t,
            k: 0.07,
          }),
          i.cone(r([-0.6, 0.52, 0.22]), r([-0.7, 0.3, 0.23]), 0.085, 0.06, {
            bones: [a(`legBR`), a(`pawBR`)],
            color: t,
            k: 0.05,
          }),
          i.cone(r([-0.7, 0.3, 0.23]), r([-0.66, 0.08, 0.23]), 0.06, 0.052, {
            bone: a(`pawBR`),
            color: n,
            k: 0.04,
          }),
          i.ellipsoid(r([-0.59, 0.05, 0.23]), [0.1, 0.05, 0.075], {
            bone: a(`pawBR`),
            color: n,
            k: 0.04,
          }));
      }),
      i.cone([-0.8, 1, 0], [-1.18, 0.98, 0], 0.11, 0.13, {
        bones: [`hips`, `tail1`],
        color: n,
        k: 0.06,
      }),
      i.cone([-1.18, 0.98, 0], [-1.6, 0.76, 0], 0.13, 0.06, {
        bones: [`tail1`, `tail2`],
        color: n,
        k: 0.05,
      }),
      i.build(e, {
        kind: K.fur,
        kind2: K.fur,
        aoScale: 0.18,
        ao: 1.3,
        tex: 2.6,
      }));
    let a = new Ji(e, i),
      o = Or(77),
      s = { kind: K.fur, rough: 0.95, occluder: !1, aoStrength: 0.35 },
      c = (t, n, r, i, o, c, l = {}) => {
        let u = a.at(t),
          d = u.skin;
        $r(e, u.p, u.n, n, r, i, {
          ...s,
          color: o,
          tip: c,
          skin: () => d,
          ...l,
        });
      };
    for (let e = 0; e < 46; e++) {
      let t = (e / 46) * $ * 2 + o() * 0.1,
        r = 0.52 - (e % 2) * 0.2 + o() * 0.08,
        i = 1.2 + Math.sin(t) * 0.3,
        a = Math.cos(t) * 0.42;
      i < 0.98 ||
        c(
          [r, i, a],
          [-1, -0.35, (Math.sign(a) || 1) * 0.25],
          0.4 + o() * 0.14,
          0.065 + o() * 0.025,
          n,
          `#e09a4e`,
          { curl: 0.16, thick: 0.5 },
        );
    }
    for (let e = 0; e < 9; e++)
      c(
        [0.2 - e * 0.09, 1.3, (o() - 0.5) * 0.2],
        [-1, -0.1, (o() - 0.5) * 0.5],
        0.28 + o() * 0.08,
        0.05,
        n,
        `#d8913f`,
        { thick: 0.5 },
      );
    for (let e of [1, -1])
      for (let t = 0; t < 3; t++)
        c(
          [0.96 - t * 0.05, 1.18 + t * 0.05, 0.22 * e],
          [-1, -0.4, 0.4 * e],
          0.2,
          0.04,
          n,
          `#e0a251`,
          { thick: 0.5 },
        );
    for (let e = 0; e < 12; e++) {
      let t = e / 11,
        r = -0.9 - t * 0.6,
        i = 1.02 - t * 0.2,
        a = (e * 2.4) % ($ * 2);
      c(
        [r, i + Math.sin(a) * 0.1, Math.cos(a) * 0.12],
        [-1, -0.25, Math.cos(a) * 0.4],
        0.28 - t * 0.06,
        0.05,
        n,
        `#c47b33`,
        { thick: 0.5 },
      );
    }
    let l = {
      color: `#2d2a27`,
      tip: `#e8b45c`,
      kind: K.bone,
      rough: 0.5,
      tipFrom: 0.2,
    };
    for (let [t, r, i, o] of [
      [0.62, 1.44, 0.44, 0.05],
      [0.42, 1.48, 0.56, 0.06],
      [0.2, 1.42, 0.62, 0.065],
      [-0.04, 1.3, 0.54, 0.06],
      [-0.28, 1.2, 0.44, 0.05],
      [-0.52, 1.14, 0.34, 0.045],
      [-0.76, 1.12, 0.26, 0.038],
    ]) {
      let s = a.at([t, r + 0.3, 0]),
        c = s.skin;
      J(e, s.p, [-0.8, 1, 0], i, o, {
        ...l,
        bend: [-0.7, -0.15, 0],
        skin: () => c,
        collar: !0,
        collarColor: n,
        collarKind: K.fur,
      });
    }
    for (let t of [1, -1])
      for (let [r, i, o, s, c] of [
        [0.45, 1.34, 0.3, 0.4, 0.045],
        [0.24, 1.3, 0.34, 0.36, 0.042],
        [0.02, 1.18, 0.3, 0.28, 0.036],
        [0.55, 1.2, 0.4, 0.26, 0.035],
      ]) {
        let u = a.at([r, i, o * t]),
          d = u.skin;
        J(e, u.p, [-0.9, 0.7, 0.8 * t], s, c, {
          ...l,
          bend: [-0.5, -0.2, 0.1 * t],
          skin: () => d,
          collar: !0,
          collarColor: n,
          collarKind: K.fur,
        });
      }
    for (let [t, n, r] of [
      [-1.15, 1.08, 0.2],
      [-1.4, 0.98, 0.16],
    ]) {
      let i = a.at([t, n + 0.2, 0]),
        o = i.skin;
      J(e, i.p, [-1, 0.8, 0], r, 0.03, {
        ...l,
        bend: [-0.5, 0, 0],
        skin: () => o,
      });
    }
    (Yi(e, [1.212, 1.336, 0.108], [0.03, 0.036, 0.044], {
      iris: `#ffb23a`,
      socket: `#100803`,
      brow: `#2d2a27`,
      bone: `head`,
      tilt: -0.58,
      browLift: 1.6,
    }),
      Xi(e, [1.318, 1.176, 0], [0.028, 0.03, 0.115], {
        dark: `#140806`,
        lip: `#e8dfcc`,
        bone: `head`,
        tilt: -0.35,
      }),
      e.add(q.sphere(0.045, 0.036, 0.048, 8, 6), {
        color: `#141216`,
        kind: K.skin,
        rough: 0.3,
        at: [1.47, 1.2, 0],
        bone: `head`,
      }));
    for (let t = 0; t < 3; t++)
      J(
        e,
        [1.42 - t * 0.07, 1.14, 0.05],
        [0.1, -1, 0.15],
        0.08 - t * 0.015,
        0.018,
        {
          color: `#e8dfcc`,
          tip: `#ffffff`,
          kind: K.bone,
          bone: `head`,
          mirror: !0,
          radial: 5,
          segs: 3,
        },
      );
    J(e, [1.36, 1.12, 0.045], [0.1, 1, 0.1], 0.06, 0.015, {
      color: `#e8dfcc`,
      tip: `#ffffff`,
      kind: K.bone,
      bone: `jaw`,
      mirror: !0,
      radial: 5,
      segs: 3,
    });
    for (let [t, n, r] of [
      [`pawFR`, 0.66, 0.24],
      [`pawFL`, 0.66, -0.24],
      [`pawBR`, -0.5, 0.23],
      [`pawBL`, -0.5, -0.23],
    ])
      for (let i = -1; i <= 1; i++)
        J(e, [n, 0.05, r + i * 0.04], [1, -0.5, i * 0.2], 0.07, 0.016, {
          color: `#161418`,
          tip: `#8a8490`,
          kind: K.bone,
          bone: t,
          radial: 5,
          segs: 3,
        });
    return e.build({ aoFloor: 0.58 });
  }
  function aa(e, t, n) {
    let r = e.d,
      i = t.walk,
      a = t.phase,
      o = t.t,
      s = 1 - i,
      c = t.combat,
      l = Math.sin(a),
      u = Math.cos(a),
      d = Ri(t, 0.9);
    {
      let e = n.chest * 9,
        t = 1 + Math.sin(o * 2.6) * 0.022;
      ((r[e + 6] *= t), (r[e + 7] *= t), (r[e + 8] *= t));
    }
    ((r[n.head * 9 + 1] += Math.sin(o * 0.45) * 0.5 * s * (1 - c)),
      (r[n.head * 9 + 2] += Math.sin(o * 0.9) * 0.08 * s - 0.08 * c),
      (r[n.tail1 * 9 + 1] += Math.sin(o * 1.7) * 0.22),
      (r[n.tail2 * 9 + 1] += Math.sin(o * 1.7 - 0.8) * 0.35),
      (r[n.tail1 * 9 + 2] += -0.05 - 0.3 * c),
      (r[n.chest * 9 + 4] += -0.07 * c),
      (r[n.neck * 9 + 2] += -0.15 * c),
      (r[n.jaw * 9 + 2] += -0.12 * c * (0.6 + 0.4 * Math.sin(o * 11))));
    let f = 0.55 * i;
    ((r[n.legFR * 9 + 2] += l * f),
      (r[n.legBL * 9 + 2] += l * f),
      (r[n.legFL * 9 + 2] += -l * f),
      (r[n.legBR * 9 + 2] += -l * f),
      (r[n.pawFR * 9 + 2] += -Math.max(0, u) * 0.9 * i),
      (r[n.pawFL * 9 + 2] += -Math.max(0, -u) * 0.9 * i),
      (r[n.pawBL * 9 + 2] += Math.max(0, u) * 0.8 * i),
      (r[n.pawBR * 9 + 2] += Math.max(0, -u) * 0.8 * i),
      (r[n.chest * 9 + 4] += Math.abs(l) * 0.05 * i),
      (r[n.hips * 9 + 4] += Math.abs(u) * 0.05 * i),
      (r[n.neck * 9 + 2] += -u * 0.08 * i - 0.1 * i),
      (r[n.tail1 * 9 + 1] += l * 0.2 * i),
      (r[n.neck * 9 + 2] += -0.25 * t.reset01),
      (r[n.neck * 9 + 2] += 0.55 * d),
      (r[n.head * 9 + 2] += 0.3 * d),
      (r[n.jaw * 9 + 2] += -0.55 * d),
      (r[n.chest * 9 + 4] += 0.08 * d));
    let p = t.antic,
      m = t.strike;
    {
      let e = n.root * 9;
      ((r[e + 3] += -0.2 * p + 0.5 * m), (r[e + 4] += 0.1 * m));
    }
    ((r[n.chest * 9 + 4] += -0.12 * p + 0.1 * m),
      (r[n.hips * 9 + 4] += -0.08 * p),
      (r[n.neck * 9 + 2] += 0.25 * p - 0.4 * m),
      (r[n.jaw * 9 + 2] += -0.6 * p),
      (r[n.legFR * 9 + 2] += -0.3 * p + 0.7 * m),
      (r[n.legFL * 9 + 2] += -0.3 * p + 0.6 * m),
      (r[n.legBR * 9 + 2] += 0.25 * p - 0.45 * m),
      (r[n.legBL * 9 + 2] += 0.25 * p - 0.45 * m),
      (t.glowOut += 0.2 + d + p));
  }
  let oa = {
      build: ia,
      animate: aa,
      stride: 0.95,
      turnRate: 8,
      overhead: 1.9,
      shadow: [1, 0.55],
      glow: `#ffb23a`,
      flinch: 0.8,
      kb: 0.45,
      fall: 1.5,
      tipOver: !0,
      fallLift: 0.15,
      rig: { root: `root`, body: `chest`, head: `head`, limbs: [], flail: 0 },
      anchors: {
        head: [`head`, [1.25, 1.3, 0]],
        chest: [`chest`, [0.45, 1, 0]],
        weapon: [`jaw`, [1.42, 1.08, 0]],
        muzzle: [`jaw`, [1.42, 1.08, 0]],
      },
      halos: [
        {
          bone: `head`,
          at: [1.27, 1.33, 0],
          size: 0.18,
          color: `#ffb23a`,
          alpha: 0.22,
          boost: 0.5,
        },
      ],
    },
    sa = new ue(),
    ca = new j(),
    la = new M(),
    ua = new M(),
    da = new M();
  function fa(e, t) {
    return (
      la.set(e[0], e[1], e[2]).normalize(),
      da.set(t[0], t[1], t[2]),
      ua.crossVectors(da, la).normalize(),
      da.crossVectors(la, ua).normalize(),
      sa.makeBasis(la, ua, da),
      ca.setFromRotationMatrix(sa),
      [ca.x, ca.y, ca.z, ca.w]
    );
  }
  function pa() {
    let e = new Xr(
        [
          [`root`, null, [0, 0, 0]],
          [`body`, `root`, [0, 0.88, 0]],
          [`neck1`, `body`, [0.28, 0.98, 0]],
          [`neck2`, `neck1`, [0.4, 1.18, 0]],
          [`head`, `neck2`, [0.46, 1.36, 0]],
          [`beak`, `head`, [0.62, 1.39, 0]],
          [`wingR`, `body`, [0.15, 1.02, 0.24]],
          [`wingL`, `body`, [0.15, 1.02, -0.24]],
          [`tail`, `body`, [-0.38, 0.92, 0]],
          [`thighR`, `body`, [0, 0.82, 0.14]],
          [`shinR`, `thighR`, [0.12, 0.5, 0.16]],
          [`footR`, `shinR`, [-0.02, 0.1, 0.16]],
          [`thighL`, `body`, [0, 0.82, -0.14]],
          [`shinL`, `thighL`, [0.12, 0.5, -0.16]],
          [`footL`, `shinL`, [-0.02, 0.1, -0.16]],
        ],
        { seed: 505, texScale: 3.2 },
      ),
      t = `#2f6b78`,
      n = `#123a44`,
      r = `#3f9f95`,
      i = `#23434d`,
      a = `#0b2026`,
      o = `#f2a038`,
      s = `#c06a1c`,
      c = new ri({ voxel: 0.024, soft: 0.06, skinSoft: 0.1, seed: 5 });
    (c.ellipsoid([-0.04, 0.93, 0], [0.42, 0.28, 0.27], {
      rot: [0, 0, 0.12],
      bone: `body`,
      color: n,
      k: 0.1,
    }),
      c.ellipsoid([0.2, 0.9, 0], [0.27, 0.29, 0.25], {
        bone: `body`,
        color: r,
        k: 0.1,
      }),
      c.cone([0.26, 1, 0], [0.4, 1.2, 0], 0.15, 0.1, {
        bones: [`neck1`, `neck2`],
        color: t,
        k: 0.08,
      }),
      c.cone([0.4, 1.2, 0], [0.47, 1.38, 0], 0.1, 0.1, {
        bones: [`neck2`, `head`],
        color: t,
        k: 0.06,
      }),
      c.ellipsoid([0.5, 1.42, 0], [0.155, 0.135, 0.125], {
        bone: `head`,
        color: `#f3e7c8`,
        k: 0.05,
      }),
      c.cone([-0.32, 0.96, 0], [-0.5, 0.97, 0], 0.16, 0.08, {
        bones: [`body`, `tail`],
        color: n,
        k: 0.06,
      }),
      c.sym((e, n) => {
        let r = (t) => (e > 0 ? t : t.replace(/R$/, `L`));
        (c.ellipsoid(n([0.02, 0.72, 0.15]), [0.13, 0.21, 0.1], {
          rot: [0, 0, -0.3],
          bone: r(`thighR`),
          color: t,
          k: 0.06,
        }),
          c.cone(n([0.1, 0.55, 0.16]), n([0.06, 0.3, 0.16]), 0.055, 0.04, {
            bones: [r(`thighR`), r(`shinR`)],
            color: i,
            k: 0.03,
          }),
          c.cone(n([0.06, 0.3, 0.16]), n([-0.02, 0.1, 0.16]), 0.04, 0.034, {
            bone: r(`shinR`),
            color: i,
            k: 0.03,
          }));
      }),
      c.build(e, {
        kind: K.feather,
        kind2: K.skin,
        aoScale: 0.12,
        ao: 1.1,
        tex: 1.3,
      }));
    let l = new Ji(e, c);
    Or(55);
    let u = {
        kind: K.feather,
        rough: 0.9,
        aoStrength: 0.3,
        occluder: !1,
        grad: [0.9, 1.05],
        tipAxis: `x`,
        tipFrom: 0.3,
      },
      d = (e) => ({
        tex: 3.5200000000000005 * Math.max(0.45, Math.min(2.2, 0.3 / e)),
      }),
      f = {
        color: `#ff6a1e`,
        tip: `#ffb070`,
        kind: K.crystal,
        emit: 1.55,
        rough: 0.2,
        flat: !1,
        localGrad: !0,
        grad: [1.1, 0.45],
        occluder: !1,
        recvAO: !1,
      },
      p = (t, n, r, i) =>
        e.add(q.crystal(r * 0.26, r * 2, 6, 0.5, 0.2), {
          ...f,
          at: t,
          quat: Ui(n),
          ...(typeof i == `string` ? { bone: i } : { skin: i }),
        }),
      m = (t, n, r, i, a, o, s = !1, c = {}) => {
        let f = l.at(t),
          m = f.skin,
          h = fa(n, f.n);
        if (
          (e.add(q.feather(r, i, 0.012, 0.12), {
            ...u,
            ...d(r),
            color: a,
            tip: o,
            at: [
              f.p[0] - f.n[0] * 0.01,
              f.p[1] - f.n[1] * 0.01,
              f.p[2] - f.n[2] * 0.01,
            ],
            quat: h,
            skin: () => m,
            ...c,
          }),
          s)
        ) {
          let e = Wi(n);
          p(
            [
              f.p[0] + e[0] * r * 0.85,
              f.p[1] + e[1] * r * 0.85,
              f.p[2] + e[2] * r * 0.85,
            ],
            e,
            i * 0.5,
            () => m,
          );
        }
      };
    for (let e = 0; e < 4; e++)
      for (let t = -2; t <= 2; t++) {
        let i = 0.22 - e * 0.15,
          s = t * 0.09;
        m(
          [i, 1.25, s],
          [-1, -0.12, s * 0.8],
          0.26,
          0.11,
          e % 2 ? a : n,
          e >= 2 ? o : r,
          !1,
          { tipFrom: 0.18 },
        );
      }
    for (let e = 0; e < 10; e++) {
      let n = (e / 10) * $ * 2;
      Math.sin(n) < -0.3 ||
        m(
          [
            0.36 + Math.cos(n) * 0.03,
            1.12 + Math.sin(n) * 0.08,
            Math.cos(n) * 0.12,
          ],
          [-0.8, -0.35 + Math.sin(n) * 0.3, Math.cos(n) * 0.7],
          0.15,
          0.06,
          t,
          o,
          e % 2 == 0,
          { tipFrom: 0.16 },
        );
    }
    for (let i of [1, -1]) {
      let c = i > 0 ? `wingR` : `wingL`;
      for (let t = 0; t < 6; t++) {
        let a = 0.2 - t * 0.11,
          s = 1.05 - t * 0.015,
          l = [a, s, 0.28 * i],
          f = 0.42 + t * 0.06;
        (e.add(q.feather(f, 0.12, 0.014, 0.1), {
          ...u,
          ...d(f),
          color: n,
          tip: t > 2 ? o : r,
          tipFrom: t > 2 ? 0.55 : 0.3,
          at: l,
          quat: fa([-1, -0.18 - t * 0.02, 0.1 * i], [0, 0.5, i]),
          bone: c,
        }),
          t > 2 &&
            p(
              [
                a - f * 0.92,
                s - (0.18 + t * 0.02) * f * 0.92,
                (0.28 + 0.1 * f * 0.92) * i,
              ],
              [-1, -0.18 - t * 0.02, 0.1 * i],
              0.045,
              c,
            ));
      }
      for (let n = 0; n < 4; n++)
        e.add(q.feather(0.22, 0.1, 0.012, 0.1), {
          ...u,
          ...d(0.22),
          color: n % 2 ? a : t,
          tip: n % 2 ? s : o,
          tipFrom: 0.45,
          at: [0.24 - n * 0.1, 1.1, 0.27 * i],
          quat: fa([-1, -0.25, 0.15 * i], [0, 0.6, i]),
          bone: c,
        });
    }
    for (let n = 0; n < 6; n++) {
      let r = (n - 2.5) * 0.2,
        i = 0.44 - Math.abs(n - 2.5) * 0.04;
      e.add(q.feather(i, 0.12, 0.013, 0.08), {
        ...u,
        ...d(i),
        color: t,
        tip: o,
        tipFrom: 0.55,
        at: [-0.38, 1, n * 0.01 - 0.025],
        quat: fa([-Math.cos(r), -0.06, Math.sin(r)], [0, 1, 0]),
        bone: `tail`,
      });
    }
    for (let t = 0; t < 7; t++) {
      let r = (t - 3) * 0.2,
        i = 0.72 - Math.abs(t - 3) * 0.06;
      (e.add(q.feather(i, 0.13, 0.014, 0.08), {
        ...u,
        ...d(i),
        color: t % 2 ? a : n,
        tip: t % 2 ? s : o,
        tipFrom: 0.55,
        at: [-0.4, 0.97, t * 0.01 - 0.03],
        quat: fa([-Math.cos(r), -0.12, Math.sin(r)], [0, 1, 0]),
        bone: `tail`,
      }),
        p(
          [
            -0.4 - Math.cos(r) * i * 0.9,
            0.97 - 0.12 * i * 0.9,
            Math.sin(r) * i * 0.9,
          ],
          [-Math.cos(r), -0.12, Math.sin(r)],
          0.055,
          `tail`,
        ));
    }
    for (let t = 0; t < 5; t++) {
      let r = (t - 2) * 0.035,
        i = 0.34 - Math.abs(t - 2) * 0.05;
      (e.add(q.feather(i, 0.07, 0.01, 0.1), {
        ...u,
        color: n,
        tip: o,
        tipFrom: 0.2,
        at: [0.5, 1.52, r],
        quat: fa(
          [-1, 0.45 + (2 - Math.abs(t - 2)) * 0.1, r * 4],
          [0, 1, r * 3],
        ),
        bone: `head`,
      }),
        p(
          [
            0.5 - i * 0.85,
            1.52 + i * (0.45 + (2 - Math.abs(t - 2)) * 0.1) * 0.85,
            r * 1.8,
          ],
          [-1, 0.45 + (2 - Math.abs(t - 2)) * 0.1, r * 4],
          0.035,
          `head`,
        ));
    }
    let h = {
      color: `#c98a34`,
      tip: `#f6e6c2`,
      tipFrom: 0.2,
      kind: K.bone,
      rough: 0.35,
    };
    (e.add(
      q.tube(
        [
          [0.56, 1.44, 0],
          [0.7, 1.45, 0],
          [0.82, 1.4, 0],
          [0.87, 1.33, 0],
        ],
        (e) => 0.06 * (1 - e) + 0.012,
        { radial: 8, segs: 10, sx: 1.2, sy: 0.75 },
      ),
      { ...h, bone: `head` },
    ),
      e.add(
        q.tube(
          [
            [0.58, 1.39, 0],
            [0.7, 1.37, 0],
            [0.8, 1.36, 0],
          ],
          (e) => 0.04 * (1 - e) + 0.01,
          { radial: 7, segs: 6, sx: 1, sy: 0.7 },
        ),
        { ...h, tip: `#e0bb7e`, bone: `beak` },
      ),
      Yi(e, [0.576, 1.468, 0.068], [0.028, 0.034, 0.042], {
        iris: `#ffc04a`,
        socket: `#0d0a06`,
        tilt: -0.6,
        bone: `head`,
      }));
    for (let t of [1, -1]) {
      let n = t > 0 ? `footR` : `footL`;
      for (let r = -1; r <= 1; r++)
        J(e, [-0.01, 0.07, 0.16 * t], [1, -0.25, r * 0.55 * t], 0.27, 0.03, {
          color: i,
          tip: `#12161c`,
          kind: K.leather,
          bend: [0, -0.35, 0],
          bone: n,
          radial: 6,
          segs: 5,
        });
      J(e, [-0.02, 0.07, 0.16 * t], [-1, -0.2, 0], 0.12, 0.02, {
        color: i,
        tip: `#12161c`,
        kind: K.leather,
        bend: [0, -0.3, 0],
        bone: n,
        radial: 6,
        segs: 4,
      });
    }
    return e.build({ aoFloor: 0.6 });
  }
  function ma(e, t, n) {
    let r = e.d,
      i = t.walk,
      a = t.phase,
      o = t.t,
      s = 1 - i,
      c = t.combat,
      l = Math.sin(a),
      u = Math.cos(a),
      d = Ri(t, 0.9),
      f = Math.sin(Math.floor(o * 1.4 + t.seed * 5) * 2.7) * 0.6 * s * (1 - c);
    ((r[n.head * 9 + 1] += f),
      (r[n.head * 9 + 2] += Math.sin(Math.floor(o * 0.9) * 1.9) * 0.15 * s));
    {
      let e = n.body * 9,
        t = 1 + Math.sin(o * 3) * 0.015;
      ((r[e + 6] *= t), (r[e + 7] *= t), (r[e + 8] *= t));
    }
    ((r[n.tail * 9 + 1] += Math.sin(o * 1.1) * 0.1),
      (r[n.tail * 9 + 2] += Math.sin(o * 2.3) * 0.05 - 0.2 * c),
      (r[n.thighR * 9 + 2] += l * 0.55 * i),
      (r[n.thighL * 9 + 2] += -l * 0.55 * i),
      (r[n.shinR * 9 + 2] += -Math.max(0, u) * 0.7 * i),
      (r[n.shinL * 9 + 2] += -Math.max(0, -u) * 0.7 * i),
      (r[n.footR * 9 + 2] += Math.max(0, u) * 0.6 * i),
      (r[n.footL * 9 + 2] += Math.max(0, -u) * 0.6 * i),
      (r[n.body * 9 + 4] += (Math.abs(u) - 0.6) * 0.07 * i),
      (r[n.body * 9 + 0] += l * 0.06 * i),
      (r[n.head * 9 + 3] += -Math.sin(2 * a) * 0.05 * i),
      (r[n.neck1 * 9 + 2] += -0.25 * i),
      (r[n.neck1 * 9 + 2] += -0.2 * t.reset01),
      (r[n.wingR * 9 + 1] += 0.5 * d),
      (r[n.wingL * 9 + 1] += -0.5 * d),
      (r[n.wingR * 9 + 2] += -0.4 * d),
      (r[n.wingL * 9 + 2] += -0.4 * d),
      (r[n.neck1 * 9 + 2] += 0.3 * d),
      (r[n.beak * 9 + 2] += -0.5 * d));
    let p = t.antic,
      m = t.strike;
    ((r[n.wingR * 9 + 1] += 0.95 * p + 0.3 * m),
      (r[n.wingL * 9 + 1] += -0.95 * p - 0.3 * m),
      (r[n.wingR * 9 + 2] += -0.7 * p + 0.2 * m),
      (r[n.wingL * 9 + 2] += -0.7 * p + 0.2 * m),
      (r[n.neck1 * 9 + 2] += 0.4 * p - 0.55 * m),
      (r[n.neck2 * 9 + 2] += 0.3 * p - 0.35 * m),
      (r[n.beak * 9 + 2] += -0.15 * p - 0.5 * m),
      (r[n.body * 9 + 4] += 0.07 * p),
      (r[n.body * 9 + 2] += 0.16 * p - 0.14 * m),
      (t.glowOut += 0.25 + 0.15 * Math.sin(o * 5.1) + 1.6 * p + 1.2 * m + d));
  }
  let ha = {
    build: pa,
    animate: ma,
    scale: 1.15,
    stride: 0.95,
    turnRate: 9,
    overhead: 1.85,
    shadow: [0.7, 0.5],
    glow: `#ff6a1f`,
    flinch: 0.9,
    kb: 0.45,
    fall: 1.5,
    tipOver: !0,
    fallLift: 0.1,
    rig: {
      root: `root`,
      body: `body`,
      head: `head`,
      limbs: [`wingR`, `wingL`],
      flail: 0.4,
    },
    anchors: {
      head: [`head`, [0.52, 1.43, 0]],
      chest: [`body`, [0.25, 0.95, 0]],
      weapon: [`beak`, [0.86, 1.36, 0]],
      muzzle: [`beak`, [0.86, 1.36, 0]],
    },
    halos: [
      {
        bone: `head`,
        at: [0.84, 1.37, 0],
        size: 0.26,
        color: `#ff8a3a`,
        alpha: 0.1,
        boost: 0.8,
      },
    ],
  };
  function ga() {
    let e = new Xr(
        [
          [`root`, null, [0, 0, 0]],
          [`pelvis`, `root`, [-0.1, 1.05, 0]],
          [`torso`, `pelvis`, [0, 1.35, 0]],
          [`head`, `torso`, [0.65, 2.2, 0]],
          [`armR`, `torso`, [0.15, 2.35, 0.8]],
          [`foreR`, `armR`, [0.42, 1.45, 1.02]],
          [`armL`, `torso`, [0.15, 2.35, -0.8]],
          [`foreL`, `armL`, [0.42, 1.45, -1.02]],
          [`legR`, `pelvis`, [-0.2, 1, 0.5]],
          [`legL`, `pelvis`, [-0.2, 1, -0.5]],
          [`growth`, `torso`, [-0.25, 2.6, 0]],
        ],
        { seed: 101, texScale: 1.4 },
      ),
      t = `#6c5c36`,
      n = `#74a826`,
      r = `#537f1a`,
      i = `#3a2c1a`,
      a = new ri({
        voxel: 0.05,
        soft: 0.1,
        skinSoft: 0.16,
        noiseFreq: 3.2,
        seed: 12,
      }),
      o = { color: `#9c8a55`, k: 0.07, noise: 0.03 };
    (a.box([-0.12, 1.2, 0], [0.44, 0.32, 0.5], 0.16, {
      ...o,
      rot: [0, 0, 0.1],
      bone: `pelvis`,
      color: t,
    }),
      a.box([0.02, 2.02, 0], [0.56, 0.72, 0.74], 0.28, {
        ...o,
        rot: [0, 0, -0.3],
        bone: `torso`,
      }),
      a.box([0.6, 2.05, 0], [0.26, 0.55, 0.56], 0.13, {
        ...o,
        rot: [0, 0, -0.18],
        bone: `torso`,
      }),
      a.sphere([0.87, 2.02, 0], 0.32, { sub: !0, k: 0.06, bone: `torso` }),
      a.ellipsoid([-0.3, 2.62, 0], [0.64, 0.5, 0.8], {
        bone: `torso`,
        color: n,
        w2: 1,
        k: 0.16,
        noise: 0.05,
      }),
      a.ellipsoid([0.25, 2.78, 0], [0.48, 0.22, 0.62], {
        bone: `torso`,
        color: r,
        w2: 1,
        k: 0.14,
        noise: 0.04,
      }),
      a.cone([0.84, 2.36, 0], [1.14, 2.46, 0], 0.16, 0.19, {
        ...o,
        color: t,
        bone: `torso`,
        noise: 0.02,
      }),
      a.box([1.31, 2.49, 0], [0.3, 0.27, 0.33], 0.1, {
        ...o,
        rot: [0, 0, -0.15],
        bone: `head`,
        color: `#fbe6ab`,
      }),
      a.box([1.52, 2.64, 0], [0.13, 0.08, 0.35], 0.04, {
        ...o,
        rot: [0, 0, -0.3],
        bone: `head`,
        color: i,
        noise: 0.015,
      }),
      a.box([1.21, 2.3, 0], [0.17, 0.12, 0.34], 0.06, {
        ...o,
        rot: [0, 0, 0.1],
        bone: `head`,
        color: i,
        noise: 0.012,
      }),
      a.ellipsoid([1.26, 2.66, 0], [0.28, 0.12, 0.28], {
        bone: `head`,
        color: r,
        w2: 1,
        k: 0.08,
        noise: 0.025,
      }),
      a.sym((e, r) => {
        let i = (t) => (e > 0 ? t : t.replace(/R$/, `L`));
        (a.box(r([0.1, 2.52, 0.86]), [0.36, 0.34, 0.34], 0.13, {
          ...o,
          rot: [0.2 * e, 0, -0.2],
          bone: i(`armR`),
        }),
          a.ellipsoid(r([0.05, 2.8, 0.9]), [0.42, 0.2, 0.4], {
            bone: i(`armR`),
            color: n,
            w2: 1,
            k: 0.1,
            noise: 0.05,
          }),
          a.cone(r([0.22, 2.3, 0.98]), r([0.44, 1.5, 1.06]), 0.3, 0.26, {
            bones: [i(`armR`), i(`foreR`)],
            color: t,
            k: 0.06,
            noise: 0.025,
          }),
          a.box(r([0.54, 1.02, 1.07]), [0.29, 0.46, 0.29], 0.14, {
            ...o,
            rot: [0, 0, -0.08],
            bone: i(`foreR`),
          }),
          a.box(r([0.68, 0.42, 1.08]), [0.36, 0.25, 0.34], 0.13, {
            ...o,
            color: t,
            bone: i(`foreR`),
          }),
          a.box(r([-0.2, 0.68, 0.52]), [0.29, 0.44, 0.28], 0.13, {
            ...o,
            color: t,
            bone: i(`legR`),
          }),
          a.box(r([-0.04, 0.18, 0.55]), [0.42, 0.17, 0.3], 0.1, {
            ...o,
            bone: i(`legR`),
          }));
      }),
      a.build(e, {
        kind: K.stone,
        kind2: K.moss,
        aoScale: 0.4,
        ao: 1.2,
        tex: 1.3,
        lodMax: 1,
      }));
    let s = new Ji(e, a),
      c = Or(9),
      l = {
        color: `#3ce8c2`,
        kind: K.crystal,
        emit: 1.3,
        rough: 0.12,
        flat: !0,
        localGrad: !0,
        grad: [0.7, 1.2],
      };
    e.add(q.gem(0.25, 0.5), {
      ...l,
      color: `#5cffd8`,
      emit: 2.4,
      at: [0.87, 2.02, 0],
      scale: [0.62, 1.3, 0.9],
      bone: `torso`,
      occluder: !1,
    });
    for (let e = 0; e < 5; e++) {
      let t = (e / 5) * $ * 2 + 0.3;
      s.add(
        q.crystal(0.06, 0.26, 5),
        [0.98, 2.02 + Math.sin(t) * 0.37, Math.cos(t) * 0.37],
        {
          ...l,
          sink: 0.08,
          lean: [1, Math.sin(t) * 0.7, Math.cos(t) * 0.7],
          tilt: 0.6,
          twist: t,
        },
      );
    }
    for (let [e, t, n, r, i] of [
      [-0.25, 3.1, 0.12, 0.17, 1.1],
      [-0.05, 3.1, -0.14, 0.14, 0.9],
      [-0.45, 3, -0.1, 0.13, 0.8],
      [-0.2, 3.05, 0.35, 0.1, 0.6],
      [-0.55, 2.9, 0.3, 0.1, 0.55],
      [0.1, 3.05, 0.15, 0.08, 0.45],
    ])
      s.add(q.crystal(r, i, 6), [e, t, n], {
        ...l,
        sink: 0.12,
        lean: [-0.6, 1, n],
        tilt: 0.3,
        twist: e * 5,
      });
    for (let e of [1, -1])
      for (let [t, n, r, i, a] of [
        [0.3, 1.2, 1.3, 0.09, 0.5],
        [0.55, 1.35, 1.32, 0.07, 0.36],
      ])
        s.add(q.crystal(i, a, 6), [t, n, r * e], {
          ...l,
          sink: 0.08,
          lean: [0, 0.6, e],
          tilt: 0.3,
          twist: t * 3,
        });
    let u = {
      color: `#35d9bb`,
      tip: `#9dfbe9`,
      tipFrom: 0.4,
      kind: K.shell,
      rough: 0.35,
      flat: !0,
      localGrad: !0,
      grad: [0.85, 1.12],
    };
    for (let [e, t, n, r] of [
      [1.3, 0, 0.4, 0.34],
      [1.15, 0.17, 0.3, 0.22],
      [1.15, -0.17, 0.3, 0.22],
    ])
      s.add(q.scute(n, r, r * 0.3), [e, 2.74, t], {
        ...u,
        sink: 0.05,
        lean: [0.45, 1, t * 2],
        tilt: 0.35,
        twist: $,
      });
    e.add(q.box(0.12, 0.05, 0.3, 0.02), {
      color: `#0c6a5b`,
      kind: K.shell,
      rough: 0.5,
      at: [1.08, 2.73, 0],
      rot: [0, 0, 0.25],
      bone: `head`,
      occluder: !1,
      keep: 1,
    });
    for (let e = 0; e < 3; e++)
      s.add(q.crystal(0.055, 0.22, 5), [1.06, 2.72, (e - 1) * 0.15], {
        ...l,
        sink: 0.06,
        lean: [-0.35, 1, (e - 1) * 0.5],
        tilt: 0.3,
        twist: e,
      });
    let d = { kind: K.fur, rough: 0.95, occluder: !1, aoStrength: 0.3 };
    for (let t = 0; t < 26; t++) {
      let t = c() < 0.5 ? 1 : -1,
        n = c() < 0.55,
        i = c() * $ * 2,
        a = n
          ? [0.05 + Math.cos(i) * 0.3, 2.7, (0.9 + Math.sin(i) * 0.3) * t]
          : [-0.3 + (c() - 0.5) * 0.9, 2.5, (0.6 + c() * 0.25) * t],
        o = s.at(a);
      if (o.n[1] > 0.6) continue;
      let l = o.skin;
      $r(
        e,
        o.p,
        o.n,
        [0.05 * t, -1, o.n[2] * 0.3],
        0.3 + c() * 0.35,
        0.06 + c() * 0.03,
        {
          ...d,
          color: r,
          tip: `#8dbb4a`,
          lift: 0.08,
          curl: 0.05,
          thick: 0.45,
          skin: () => l,
        },
      );
    }
    for (let t = 0; t < 5; t++) {
      let n = s.at([1.52, 2.5, (t - 2) * 0.13]),
        i = n.skin;
      $r(e, n.p, [1, -0.3, 0], [0.2, -1, 0], 0.18 + c() * 0.1, 0.035, {
        ...d,
        color: r,
        tip: `#8dbb4a`,
        lift: 0.05,
        thick: 0.5,
        skin: () => i,
      });
    }
    (e.add(q.box(0.028, 0.06, 0.15, 0.012), {
      color: `#120f0a`,
      kind: K.stone,
      rough: 0.6,
      at: [1.565, 2.5, 0.13],
      rot: [0, 0.25, 0],
      bone: `head`,
      mirror: !0,
      occluder: !1,
    }),
      e.add(q.box(0.03, 0.035, 0.1, 0.01), {
        color: `#b4fff0`,
        kind: K.eye,
        emit: 1.95,
        at: [1.585, 2.5, 0.13],
        rot: [0, 0.25, 0],
        bone: `head`,
        mirror: !0,
        occluder: !1,
      }),
      e.add(q.box(0.05, 0.098, 0.28, 0.016), {
        color: `#080d0b`,
        kind: K.stone,
        rough: 0.95,
        grad: [0.4, 0.8],
        at: [1.575, 2.5, 0],
        rot: [0, 0, -0.62],
        bone: `head`,
        occluder: !1,
        recvAO: !1,
      }),
      e.add(q.box(0.046, 0.05, 0.25, 0.014), {
        color: `#37d8bb`,
        kind: K.stone,
        rough: 0.55,
        at: [1.545, 2.395, 0],
        rot: [0, 0, -0.62],
        bone: `head`,
        occluder: !1,
        keep: 1,
      }),
      Yi(e, [1.578, 2.524, 0.132], [0.065, 0.075, 0.105], {
        iris: `#c8fff4`,
        socket: `#08110f`,
        pupil: `#040a08`,
        tilt: -0.68,
        bone: `head`,
        brow: `#1fbfa0`,
        browKind: K.stone,
        browLift: 2.1,
      }));
    for (let [t, n, r, i] of [
      [-0.35, 3, 0.4, 1],
      [0.1, 3, 0.95, 0.8],
      [-0.5, 2.85, -0.6, 0.9],
      [-0.15, 2.95, -0.75, 0.7],
      [0.25, 2.86, 0.55, 0.75],
    ]) {
      let a = s.at([t, n, r]),
        o = a.skin,
        c = Ui(a.n, t * 3),
        l = [
          a.p[0] + a.n[0] * 0.012,
          a.p[1] + a.n[1] * 0.012,
          a.p[2] + a.n[2] * 0.012,
        ],
        u = [];
      for (let e = 0; e < 5; e++) {
        let t = (e / 5) * $ * 2;
        u.push(
          q
            .sphere(0.03 * i, 0.007 * i, 0.014 * i, 7, 4)
            .translate(Math.cos(t) * 0.026 * i, 0, Math.sin(t) * 0.026 * i)
            .rotateY(-t),
        );
      }
      (e.add(zr(u), {
        color: `#e2a3c8`,
        tip: `#fff0f6`,
        kind: K.cloth,
        rough: 0.9,
        at: l,
        quat: c,
        skin: () => o,
        occluder: !1,
        recvAO: !1,
      }),
        e.add(q.sphere(0.012 * i, 0.009 * i, 0.012 * i, 6, 4), {
          color: `#f2dc96`,
          kind: K.cloth,
          emit: 0.2,
          at: [
            l[0] + a.n[0] * 0.008,
            l[1] + a.n[1] * 0.008,
            l[2] + a.n[2] * 0.008,
          ],
          skin: () => o,
          occluder: !1,
          recvAO: !1,
        }));
    }
    return e.build({ aoFloor: 0.55 });
  }
  function _a(e, t, n) {
    let r = e.d,
      i = t.walk,
      a = t.phase,
      o = t.t,
      s = 1 - i,
      c = t.combat,
      l = Math.sin(a),
      u = Math.cos(a),
      d = Ri(t),
      f = Math.sin(o * 1.3);
    {
      let e = n.torso * 9;
      ((r[e + 6] *= 1 + f * 0.018),
        (r[e + 7] *= 1 + f * 0.012),
        (r[e + 8] *= 1 + f * 0.018));
    }
    {
      let e = n.growth * 9,
        t = 1 + Math.sin(o * 2.1) * 0.035;
      ((r[e + 6] *= t), (r[e + 7] *= t), (r[e + 8] *= t));
    }
    ((r[n.head * 9 + 1] += Math.sin(o * 0.31) * 0.45 * s * (1 - c)),
      (r[n.head * 9 + 2] += Math.sin(o * 0.53) * 0.06),
      (r[n.armR * 9 + 2] += 0.12 + f * 0.03),
      (r[n.armL * 9 + 2] += 0.12 + f * 0.03),
      (r[n.armR * 9 + 0] += -0.05),
      (r[n.armL * 9 + 0] += 0.05),
      (r[n.armR * 9 + 2] += -l * 0.38 * i),
      (r[n.armL * 9 + 2] += l * 0.38 * i),
      (r[n.foreR * 9 + 2] += Math.max(0, -u) * 0.35 * i),
      (r[n.foreL * 9 + 2] += Math.max(0, u) * 0.35 * i),
      (r[n.legR * 9 + 2] += l * 0.42 * i),
      (r[n.legL * 9 + 2] += -l * 0.42 * i),
      (r[n.pelvis * 9 + 4] += (Math.abs(u) - 0.6) * 0.12 * i),
      (r[n.torso * 9 + 0] += l * 0.07 * i),
      (r[n.torso * 9 + 1] += l * 0.1 * i),
      (r[n.torso * 9 + 2] += -0.08 * i),
      (r[n.head * 9 + 2] += -0.3 * t.reset01),
      (r[n.torso * 9 + 2] += -0.12 * t.reset01),
      (r[n.head * 9 + 2] += 0.45 * d),
      (r[n.torso * 9 + 2] += 0.2 * d),
      (r[n.armR * 9 + 0] += -0.55 * d),
      (r[n.armL * 9 + 0] += 0.55 * d),
      (r[n.armR * 9 + 2] += 0.45 * d),
      (r[n.armL * 9 + 2] += 0.45 * d));
    let p = t.antic,
      m = t.strike;
    (t.atkVar === 0
      ? ((r[n.armR * 9 + 2] += 2.3 * p - 0.6 * m),
        (r[n.armL * 9 + 2] += 2.3 * p - 0.6 * m),
        (r[n.armR * 9 + 0] += 0.2 * p),
        (r[n.armL * 9 + 0] += -0.2 * p),
        (r[n.foreR * 9 + 2] += -0.5 * p + 0.3 * m),
        (r[n.foreL * 9 + 2] += -0.5 * p + 0.3 * m),
        (r[n.torso * 9 + 2] += 0.3 * p - 0.45 * m),
        (r[n.pelvis * 9 + 4] += 0.08 * p - 0.22 * m),
        (r[n.head * 9 + 2] += 0.3 * p - 0.2 * m))
      : ((r[n.armR * 9 + 2] += 1.3 * p + 0.9 * m),
        (r[n.armR * 9 + 1] += -0.9 * p + 1.4 * m),
        (r[n.armR * 9 + 0] += -0.6 * p),
        (r[n.torso * 9 + 1] += -0.45 * p + 0.5 * m),
        (r[n.torso * 9 + 2] += 0.1 * p - 0.25 * m),
        (r[n.root * 9 + 3] += 0.22 * m)),
      (t.glowOut +=
        0.35 + 0.35 * Math.sin(o * 2.2) + 1.4 * d + 1.2 * p + 0.8 * m));
  }
  let va = {
    build: ga,
    animate: _a,
    stride: 1.15,
    overhead: 3.55,
    shadow: [1.35, 1.25],
    glow: `#3ff2c8`,
    fall: 1.45,
    fallForward: !0,
    fallLift: 0.4,
    rig: {
      root: `root`,
      body: `torso`,
      head: `head`,
      limbs: [`armR`, `armL`],
      flail: 0.4,
      thighs: [`legR`, `legL`],
      spine: [`torso`],
    },
    fallSide: 0.35,
    anchors: {
      head: [`head`, [1.55, 2.52, 0]],
      chest: [`torso`, [0.87, 2.02, 0]],
      weapon: [`foreR`, [0.66, 0.42, 1.06]],
      muzzle: [`foreR`, [0.66, 0.42, 1.06]],
    },
    halos: [
      {
        bone: `torso`,
        at: [0.98, 2.02, 0],
        size: 0.55,
        color: `#4ff5d0`,
        alpha: 0.28,
        boost: 0.3,
      },
      {
        bone: `head`,
        at: [1.6, 2.53, 0.132],
        size: 0.15,
        color: `#9dfff0`,
        alpha: 0.34,
        boost: 0.5,
      },
      {
        bone: `head`,
        at: [1.6, 2.53, -0.132],
        size: 0.15,
        color: `#9dfff0`,
        alpha: 0.34,
        boost: 0.5,
      },
    ],
  };
  function ya() {
    let e = new Xr(
        [
          [`root`, null, [0, 0, 0]],
          [`body`, `root`, [0, 0.7, 0]],
          [`head`, `body`, [0.5, 0.95, 0]],
          [`jaw`, `head`, [0.3, 0.72, 0]],
          [`throat`, `body`, [0.75, 0.5, 0]],
          [`sacs`, `body`, [-0.15, 1.15, 0]],
          [`armR`, `body`, [0.55, 0.6, 0.55]],
          [`handR`, `armR`, [0.76, 0.12, 0.8]],
          [`armL`, `body`, [0.55, 0.6, -0.55]],
          [`handL`, `armL`, [0.76, 0.12, -0.8]],
          [`thighR`, `body`, [-0.4, 0.55, 0.62]],
          [`footR`, `thighR`, [-0.05, 0.12, 0.88]],
          [`thighL`, `body`, [-0.4, 0.55, -0.62]],
          [`footL`, `thighL`, [-0.05, 0.12, -0.88]],
        ],
        { seed: 404, texScale: 1.6 },
      ),
      t = `#47692a`,
      n = `#7a6017`,
      r = `#dd9a30`,
      i = `#b6c855`,
      a = new ri({
        voxel: 0.042,
        soft: 0.1,
        skinSoft: 0.16,
        noiseFreq: 7,
        seed: 44,
      });
    (a.ellipsoid([-0.12, 0.82, 0], [0.95, 0.58, 0.9], {
      bone: `body`,
      color: t,
      k: 0.2,
      noise: 0.022,
    }),
      a.ellipsoid([-0.3, 1.05, 0], [0.6, 0.35, 0.62], {
        bone: `sacs`,
        color: n,
        k: 0.2,
        noise: 0.03,
      }),
      a.ellipsoid([0.08, 0.56, 0], [0.86, 0.38, 0.78], {
        bone: `body`,
        color: r,
        w2: 1,
        k: 0.15,
      }),
      a.ellipsoid([0.63, 1.05, 0], [0.62, 0.35, 0.74], {
        bone: `head`,
        color: i,
        k: 0.18,
        noise: 0.015,
      }),
      a.ellipsoid([0.65, 0.78, 0], [0.62, 0.2, 0.72], {
        bone: `jaw`,
        color: r,
        w2: 1,
        k: 0.1,
      }),
      a.ellipsoid([0.71, 0.9, 0], [0.64, 0.028, 0.76], {
        sub: !0,
        k: 0.03,
        bone: `head`,
      }),
      a.ellipsoid([0.92, 0.5, 0], [0.34, 0.28, 0.42], {
        bone: `throat`,
        color: `#f5c65a`,
        w2: 1,
        k: 0.12,
      }),
      a.sym((e, r) => {
        let o = (t) => (e > 0 ? t : t.replace(/R$/, `L`));
        (a.ellipsoid(r([0.8, 1.25, 0.39]), [0.2, 0.2, 0.2], {
          bone: `head`,
          color: i,
          k: 0.1,
        }),
          a.cone(r([0.55, 0.55, 0.6]), r([0.8, 0.14, 0.84]), 0.2, 0.13, {
            bones: [o(`armR`), o(`handR`)],
            color: t,
            k: 0.12,
          }),
          a.ellipsoid(r([0.88, 0.06, 0.86]), [0.22, 0.06, 0.26], {
            bone: o(`handR`),
            color: n,
            k: 0.06,
          }),
          a.ellipsoid(r([-0.4, 0.45, 0.72]), [0.47, 0.33, 0.31], {
            rot: [0, 0.4 * e, 0],
            bone: o(`thighR`),
            color: t,
            k: 0.14,
            noise: 0.02,
          }),
          a.cone(r([-0.1, 0.25, 0.92]), r([-0.05, 0.1, 0.92]), 0.14, 0.12, {
            bones: [o(`thighR`), o(`footR`)],
            color: t,
            k: 0.08,
          }),
          a.ellipsoid(r([0.14, 0.05, 1]), [0.4, 0.055, 0.3], {
            bone: o(`footR`),
            color: n,
            k: 0.06,
          }));
      }),
      a.build(e, {
        kind: K.amphibian,
        kind2: K.skin,
        aoScale: 0.3,
        ao: 1.1,
        tex: 1.6,
        lodMax: 1.4,
      }));
    let o = new Ji(e, a);
    (Or(9),
      e.add(q.sphere(0.175, 0.16, 0.175, 12, 9), {
        color: `#100c05`,
        kind: K.skin,
        rough: 0.9,
        grad: [0.4, 0.8],
        at: [0.842, 1.366, 0.42],
        bone: `head`,
        mirror: !0,
        occluder: !1,
      }),
      e.add(q.sphere(0.15, 0.15, 0.15, 20, 14), {
        color: `#ffc53a`,
        kind: K.eye,
        emit: 0.55,
        rough: 0.1,
        at: [0.86, 1.38, 0.42],
        bone: `head`,
        mirror: !0,
        occluder: !1,
      }));
    {
      let t = Wi([0.45, 0.8, 0.39]),
        r = Ui(t),
        i = [0.86, 1.38, 0.42],
        a = (e) => [i[0] + t[0] * e, i[1] + t[1] * e, i[2] + t[2] * e];
      (e.add(q.cyl(0.072, 0.082, 0.02, 16), {
        color: `#0a0906`,
        kind: K.skin,
        rough: 0.3,
        at: a(0.143),
        quat: r,
        scale: [1, 1, 0.42],
        bone: `head`,
        mirror: !0,
        occluder: !1,
        recvAO: !1,
      }),
        e.add(q.torus(0.128, 0.022, 6, 22), {
          color: n,
          kind: K.amphibian,
          at: a(0.062),
          quat: r,
          bone: `head`,
          mirror: !0,
          occluder: !1,
        }));
    }
    let s = {
      color: `#b8f03a`,
      kind: K.crystal,
      emit: 1.5,
      rough: 0.2,
      occluder: !1,
    };
    for (let [t, r, i] of [
      [-0.2, 0.25, 0.21],
      [0.12, -0.3, 0.18],
      [-0.52, -0.12, 0.23],
      [-0.32, -0.5, 0.15],
      [-0.56, 0.46, 0.17],
      [0.28, 0.14, 0.12],
      [-0.05, 0.62, 0.12],
    ]) {
      let a = o.at([t, 1.5, r]),
        c = a.skin,
        l = a.n;
      (e.add(q.sphere(i, i * 0.82, i, 12, 9), {
        ...s,
        at: [
          a.p[0] + l[0] * i * 0.3,
          a.p[1] + l[1] * i * 0.3,
          a.p[2] + l[2] * i * 0.3,
        ],
        skin: () => c,
      }),
        o.add(q.torus(i * 0.98, i * 0.28, 6, 16).rotateX($ / 2), [t, 1.5, r], {
          color: n,
          kind: K.amphibian,
          sink: -i * 0.05,
        }));
    }
    (o.add(q.cyl(0.34, 0.34, 0.025, 20), [-0.3, 1.5, -0.2], {
      color: `#4f8f3a`,
      kind: K.skin,
      sink: -0.02,
    }),
      o.add(q.sphere(0.07, 0.05, 0.07, 10, 8), [-0.36, 1.55, -0.3], {
        color: `#f07fb4`,
        kind: K.cloth,
        emit: 0.25,
        sink: -0.03,
      }));
    for (let t = 0; t < 3; t++) {
      let n = o.at([-0.5 + t * 0.08, 1.4, 0.58 - t * 0.05]),
        r = n.skin;
      J(e, n.p, [-0.2, 1, 0.25], 0.5 + t * 0.12, 0.018, {
        color: `#5f6e2c`,
        tip: `#b9b06a`,
        kind: K.skin,
        bend: [-0.2, 0, 0.1],
        skin: () => r,
        radial: 5,
        segs: 5,
      });
    }
    for (let t of [1, -1])
      for (let n = -1; n <= 1; n++)
        (e.add(q.sphere(0.05, 0.035, 0.05, 8, 6), {
          color: r,
          kind: K.amphibian,
          at: [1.08, 0.04, (0.86 + n * 0.13) * t],
          bone: t > 0 ? `handR` : `handL`,
        }),
          e.add(q.sphere(0.055, 0.035, 0.055, 8, 6), {
            color: r,
            kind: K.amphibian,
            at: [0.52, 0.04, (1 + n * 0.14) * t],
            bone: t > 0 ? `footR` : `footL`,
          }));
    return e.build({ aoFloor: 0.62 });
  }
  function ba(e, t, n) {
    let r = e.d,
      i = t.walk,
      a = t.phase,
      o = t.t,
      s = 1 - i,
      c = Ri(t, 0.9),
      l = Math.max(0, Math.sin(o * 2.1)),
      u = Math.sin(o * 2.1);
    {
      let e = n.throat * 9,
        t = 1 + 0.4 * l * l * s + 0.35 * c;
      ((r[e + 6] *= t), (r[e + 7] *= t), (r[e + 8] *= t));
    }
    {
      let e = n.body * 9;
      ((r[e + 6] *= 1 + u * 0.02),
        (r[e + 7] *= 1 - u * 0.012),
        (r[e + 8] *= 1 + u * 0.02));
    }
    {
      let e = n.sacs * 9,
        t = 1 + Math.sin(o * 3.3) * 0.05;
      ((r[e + 6] *= t), (r[e + 7] *= t), (r[e + 8] *= t));
    }
    r[n.head * 9 + 1] += Math.sin(o * 0.4) * 0.15 * s;
    let d = Math.abs(Math.sin(a)) * i;
    {
      let e = n.body * 9;
      ((r[e + 3] += 0.05 * d), (r[e + 4] += d * 0.38));
    }
    ((r[n.body * 9 + 2] += Math.sin(2 * a) * 0.14 * i),
      (r[n.thighR * 9 + 2] += -0.7 * d),
      (r[n.thighL * 9 + 2] += -0.7 * d));
    {
      let e = n.footR * 9;
      ((r[e + 3] += -0.2 * d), (r[e + 4] += -0.1 * d));
    }
    {
      let e = n.footL * 9;
      ((r[e + 3] += -0.2 * d), (r[e + 4] += -0.1 * d));
    }
    ((r[n.armR * 9 + 2] += 0.45 * d),
      (r[n.armL * 9 + 2] += 0.45 * d),
      (r[n.jaw * 9 + 2] += -0.25 * c),
      (r[n.body * 9 + 4] += 0.1 * c));
    let f = t.antic,
      p = t.strike;
    {
      let e = n.throat * 9,
        t = 1 + 0.95 * f;
      ((r[e + 6] *= t), (r[e + 7] *= t), (r[e + 8] *= t));
    }
    ((r[n.head * 9 + 2] += 0.28 * f - 0.18 * p),
      (r[n.jaw * 9 + 2] += -0.08 * f - 0.6 * p));
    {
      let e = n.body * 9;
      ((r[e + 3] += -0.12 * f + 0.16 * p), (r[e + 4] += 0.1 * f));
    }
    ((r[n.body * 9 + 2] += 0.14 * f - 0.12 * p),
      (t.glowOut += 0.25 + 0.2 * Math.sin(o * 3.3) + 1.8 * f + 1.2 * p + c));
  }
  let xa = {
    build: ya,
    animate: ba,
    stride: 1.6,
    turnRate: 6,
    overhead: 1.85,
    shadow: [1.15, 1],
    glow: `#c8ff3c`,
    flinch: 0.6,
    kb: 0.3,
    fall: 1.2,
    tipOver: !0,
    fallLift: 0.25,
    rig: { root: `root`, body: `body`, head: `head`, limbs: [], flail: 0 },
    anchors: {
      head: [`head`, [0.86, 1.15, 0]],
      chest: [`body`, [0.5, 0.75, 0]],
      weapon: [`head`, [1.15, 0.8, 0]],
      muzzle: [`head`, [1.15, 0.8, 0]],
    },
    halos: [
      {
        bone: `sacs`,
        at: [-0.2, 1.45, 0],
        size: 0.7,
        color: `#c8ff3c`,
        alpha: 0.1,
        boost: 0.25,
      },
    ],
  };
  function Sa() {
    let e = new Xr(
        [
          [`root`, null, [0, 0, 0]],
          [`core`, `root`, [0, 1, 0]],
          [`head`, `core`, [0.14, 1.86, 0]],
          [`armR`, `core`, [0.15, 1.15, 0.82]],
          [`armL`, `core`, [0.15, 1.15, -0.82]],
          [`orbit`, `core`, [0, 1.05, 0]],
          [`base`, `core`, [0, 0.55, 0]],
        ],
        { seed: 606, texScale: 1.8 },
      ),
      t = `#46316b`,
      n = `#5b4186`,
      r = `#261a3d`,
      i = [0.658, 0.325, 0.026],
      a = new ri({
        voxel: 0.034,
        soft: 0.06,
        skinSoft: 0.1,
        noiseFreq: 3.4,
        seed: 66,
      }),
      o = { k: 0.07, noise: 0.03 };
    (a.box([-0.06, 1.14, 0], [0.32, 0.36, 0.4], 0.17, {
      ...o,
      color: t,
      rot: [0, 0, -0.1],
      bone: `core`,
      vein: 0.55,
    }),
      a.sym((e, r) => {
        let i = (t) => (e > 0 ? t : t.replace(/R$/, `L`));
        (a.box(r([0.14, 1.33, 0.2]), [0.2, 0.19, 0.19], 0.09, {
          ...o,
          color: n,
          rot: [0.15 * e, 0, -0.18],
          bone: `core`,
        }),
          a.ellipsoid(r([-0.03, 1.44, 0.47]), [0.26, 0.24, 0.25], {
            ...o,
            color: t,
            bone: `core`,
            vein: 0.35,
          }),
          a.ellipsoid(r([0.02, 1.36, 0.84]), [0.2, 0.18, 0.17], {
            ...o,
            color: n,
            bone: i(`armR`),
          }),
          a.box(r([0.22, 1.02, 0.86]), [0.23, 0.21, 0.19], 0.11, {
            ...o,
            color: t,
            rot: [0, 0, -0.12],
            bone: i(`armR`),
          }));
      }),
      a.ellipsoid([0.36, 1.12, 0], [0.24, 0.3, 0.13], {
        sub: !0,
        k: 0.05,
        bone: `core`,
      }),
      a.cone([-0.02, 0.92, 0], [0, 0.62, 0], 0.3, 0.12, {
        ...o,
        color: r,
        bone: `core`,
      }),
      a.cone([0.04, 1.45, 0], [0.22, 1.86, 0], 0.17, 0.085, {
        ...o,
        color: r,
        bones: [`core`, `head`],
      }),
      a.build(e, {
        kind: K.stone,
        aoScale: 0.2,
        ao: 1.15,
        tex: 1.8,
        paint: (e, t, n, r, a, o, s) => {
          let c = 0.72 + 0.4 * Math.max(0, Math.min(1, r[1] * 0.5 + 0.5)),
            l =
              Math.max(0, Math.min(1, (r[1] - 0.22) / 0.1)) *
              Math.max(0, Math.min(1, (0.58 - r[1]) / 0.1)),
            u =
              t > 1.86 && e > -0.05
                ? 0
                : l * 0.78 +
                  Math.max(0, Math.min(1, (-0.2 - r[1]) / 0.4)) * 0.3;
          for (let e of [a, o])
            for (let t = 0; t < 3; t++) {
              let n = s * 3 + t,
                r = e[n] * c;
              e[n] = r + (i[t] - r) * u;
            }
        },
        lodMax: 1,
      }));
    let s = new Ji(e, a),
      c = {
        color: `#a870ff`,
        kind: K.crystal,
        emit: 1.3,
        rough: 0.1,
        flat: !0,
        localGrad: !0,
        grad: [0.7, 1.25],
      },
      l = (t, n, r, i, a = {}) =>
        e.add(q.crystal(r, i, 6, 0.3, 0.1), {
          ...c,
          at: t,
          quat: Ui(Wi(n), a.twist || 0),
          ...a,
        }),
      u = {
        color: `#d49a2c`,
        tip: `#f3cf7a`,
        tipFrom: 0.4,
        kind: K.gold,
        metal: 0.55,
        rough: 0.38,
        flat: !0,
        localGrad: !0,
        grad: [0.8, 1.15],
        color: `#6e4a1c`,
        tip: `#8a6030`,
        rough: 0.55,
        grad: [0.75, 1],
      },
      d = { ...c, color: `#6a45b4`, emit: 0.7, grad: [0.6, 1] },
      f = (e, t, n, r, i = {}) => {
        let { tilt: a = 0.55, ...o } = i,
          l = s.add(q.crystal(n, r, 6, 0.3, 0.1), e, {
            ...c,
            sink: 0.08,
            lean: t,
            tilt: a,
            ...o,
          });
        return (
          s.add(
            q.crystal(n * 0.62, r * 0.66, 5, 0.3, 0.1),
            [e[0] + 0.03, e[1], e[2]],
            {
              ...d,
              sink: 0.06,
              lean: [t[0] + 0.35, t[1], t[2] - 0.25],
              tilt: a * 0.8,
              twist: 0.9,
              mirror: o.mirror,
            },
          ),
          s.add(
            q.lathe(
              [
                [n * 1, -0.005],
                [n * 1.15, 0],
                [n * 1.15, 0.02],
                [n * 1, 0.025],
              ],
              14,
            ),
            e,
            { ...u, sink: 0, lean: t, tilt: a, mirror: o.mirror },
          ),
          l
        );
      };
    e.add(q.gem(0.26, 0.52), {
      ...c,
      color: `#e2c4ff`,
      emit: 2.3,
      at: [0.28, 1.12, 0],
      scale: [0.6, 1.2, 0.6],
      bone: `core`,
      occluder: !1,
    });
    for (let [e, t, n, r, i] of [
      [1.02, 0.09, [0.9, -0.5, 0.6], 0.06, 0.22],
      [1.22, -0.08, [0.9, 0.7, -0.5], 0.05, 0.2],
    ])
      l([0.24, e, t], n, r, i, { bone: `core` });
    for (let e of [1, -1])
      (f([-0.12, 1.56, 0.5 * e], [-1.25, 0.72, 1 * e], 0.145, 0.78),
        f([-0.28, 1.48, 0.36 * e], [-1.35, 0.45, 0.65 * e], 0.09, 0.46),
        f([0.42, 1.06, 0.9 * e], [0.85, -0.25, 0.5 * e], 0.085, 0.4, {
          tilt: 0.7,
        }));
    for (let [e, t, n] of [
      [1.38, 0.8, 0.15],
      [1.2, 0.58, 0.12],
      [1.04, 0.42, 0.09],
    ])
      f([-0.45, e, 0], [-1, 0.72, 0], n, t);
    let p = {
      color: `#6a50b8`,
      kind: K.stone,
      rough: 0.7,
      flat: !0,
      grad: [0.7, 1],
      bone: `head`,
      tex: 1.4,
    };
    (e.add(
      q.lathe(
        [
          [0, 0],
          [0.15, 0.02],
          [0.245, 0.12],
          [0.275, 0.27],
          [0.255, 0.4],
          [0.195, 0.5],
          [0.135, 0.565],
          [0, 0.59],
        ],
        7,
      ),
      { ...p, at: [0, 2.08, 0], rot: [0, 0, -$ / 2], scale: [0.9, 1.1, 1.18] },
    ),
      e.add(
        q.extrude(
          [
            [0.24, 2.27],
            [0.36, 2.305],
            [0.5, 2.25],
            [0.48, 2.205],
            [0.36, 2.225],
          ],
          0.42,
          0.03,
          4,
          1,
        ),
        { ...p, color: `#7c62cc`, grad: [0.8, 1] },
      ),
      e.add(
        q.extrude(
          [
            [0.22, 1.85],
            [0.27, 1.955],
            [0.52, 1.955],
            [0.585, 1.875],
            [0.5, 1.785],
            [0.3, 1.775],
          ],
          0.3,
          0.035,
          4,
          1,
        ),
        { ...p, color: `#4a3690`, grad: [0.6, 0.95] },
      ));
    let m = [Math.sin(1), Math.cos(1)],
      h = [-m[1], m[0]],
      g = [0.625, 2.15],
      _ = (e, t) => [g[0] + m[0] * e + h[0] * t, g[1] + m[1] * e + h[1] * t];
    e.add(q.box(0.03, 0.17, 0.3, 0.02), {
      color: `#221638`,
      kind: K.stone,
      rough: 0.7,
      at: [..._(-0.006, -0.07), 0],
      rot: [0, 0, $ / 2 + -1],
      bone: `head`,
      occluder: !1,
    });
    for (let t of [1, -1])
      (e.add(q.sphere(0.038, 0.03, 0.078, 10, 6), {
        color: `#120c18`,
        kind: K.stone,
        rough: 0.95,
        at: [..._(-0.008, -0.06), 0.085 * t],
        rot: [0, 0, -1],
        bone: `head`,
        occluder: !1,
      }),
        e.add(q.sphere(0.022, 0.018, 0.062, 10, 6), {
          color: `#b89cff`,
          kind: K.eye,
          emit: 1.9,
          at: [..._(0.01, -0.06), 0.085 * t],
          rot: [0, 0, -1],
          bone: `head`,
          occluder: !1,
          recvAO: !1,
        }));
    e.add(q.box(0.05, 0.028, 0.36, 0.01), {
      ...u,
      at: [0.47, 2.262, 0],
      rot: [0, 0, -0.6],
      bone: `head`,
      keep: 1,
    });
    for (let e of [1, -1])
      (l([0.14, 2.25, 0.19 * e], [-0.75, 1, 0.85 * e], 0.075, 0.46, {
        ...d,
        bone: `head`,
      }),
        l([0.02, 2.21, 0.21 * e], [-1, 0.55, 0.9 * e], 0.05, 0.28, {
          ...d,
          bone: `head`,
          twist: 0.6,
        }));
    for (let t of [1, -1])
      e.add(
        q.lathe(
          [
            [0.19, -0.05],
            [0.222, -0.02],
            [0.225, 0.05],
            [0.2, 0.075],
          ],
          16,
        ),
        {
          ...u,
          at: [0.2, 1.2, 0.86 * t],
          rot: [0, 0, -0.12],
          bone: t > 0 ? `armR` : `armL`,
          keep: 1,
        },
      );
    (e.add(
      q.lathe(
        [
          [0.13, -0.02],
          [0.2, 0.03],
          [0.215, 0.085],
          [0.18, 0.115],
        ],
        18,
      ),
      {
        color: `#0d0814`,
        kind: K.stone,
        rough: 0.9,
        grad: [0.5, 0.85],
        at: [0.17, 1.84, 0],
        rot: [0, 0, -0.42],
        bone: `head`,
        recvAO: !1,
      },
    ),
      e.add(
        q.lathe(
          [
            [0.18, 0.115],
            [0.235, 0.145],
            [0.22, 0.18],
            [0.17, 0.19],
          ],
          18,
        ),
        {
          color: `#8f6ec4`,
          kind: K.crystal,
          rough: 0.22,
          flat: !0,
          grad: [0.72, 1.16],
          at: [0.17, 1.84, 0],
          rot: [0, 0, -0.42],
          bone: `head`,
          keep: 1,
        },
      ));
    for (let e = 0; e < 5; e++) {
      let t = (e / 5) * $ * 2;
      l(
        [Math.cos(t) * 1.02, 0.92 + Math.sin(t * 2) * 0.08, Math.sin(t) * 1.02],
        [Math.cos(t) * 1.5, 0.75, Math.sin(t) * 1.5],
        0.05 + (e % 2) * 0.012,
        0.26 + (e % 2) * 0.08,
        { bone: `orbit`, emit: 1.5, occluder: !1 },
      );
    }
    l([0, 0.72, 0], [0, -1, 0], 0.15, 0.55, { bone: `base` });
    for (let e = 0; e < 3; e++) {
      let t = (e / 3) * $ * 2 + 0.4;
      l(
        [Math.cos(t) * 0.18, 0.7, Math.sin(t) * 0.18],
        [Math.cos(t) * 0.45, -1, Math.sin(t) * 0.45],
        0.07,
        0.3,
        { bone: `base` },
      );
    }
    return e.build({ aoFloor: 0.7, aoHeight: 1.2 });
  }
  function Ca(e, t, n) {
    let r = e.d,
      i = t.t,
      a = t.walk,
      o = 1 - a,
      s = Ri(t);
    ((r[n.core * 9 + 4] += Math.sin(i * 1.7) * 0.07 + 0.06),
      (r[n.orbit * 9 + 1] += i * 0.9),
      (r[n.core * 9 + 2] += -0.15 * a + Math.sin(i * 0.8) * 0.03),
      (r[n.base * 9 + 1] += -i * 0.6));
    {
      let e = n.armR * 9;
      ((r[e + 3] += 0.05 * Math.sin(i * 1.7 + 1)),
        (r[e + 4] += Math.sin(i * 1.7 + 1.2) * 0.08));
    }
    {
      let e = n.armL * 9;
      ((r[e + 3] += 0.05 * Math.sin(i * 1.7 + 2)),
        (r[e + 4] += Math.sin(i * 1.7 + 2.4) * 0.08));
    }
    ((r[n.head * 9 + 4] += Math.sin(i * 1.7 + 0.6) * 0.05),
      (r[n.head * 9 + 1] += Math.sin(i * 0.4) * 0.4 * o),
      (r[n.head * 9 + 2] += 0.1),
      (r[n.armR * 9 + 3] += -0.18 * a),
      (r[n.armL * 9 + 3] += -0.18 * a),
      (r[n.armR * 9 + 2] += 0.3 * a),
      (r[n.armL * 9 + 2] += 0.3 * a));
    {
      let e = n.armR * 9;
      ((r[e + 4] += 0.22 * s), (r[e + 5] += 0.28 * s));
    }
    {
      let e = n.armL * 9;
      ((r[e + 4] += 0.22 * s), (r[e + 5] += -0.28 * s));
    }
    r[n.head * 9 + 4] += 0.22 * s;
    {
      let e = n.orbit * 9,
        t = 1 + 0.3 * s;
      ((r[e + 6] *= t), (r[e + 7] *= t), (r[e + 8] *= t));
    }
    let c = t.antic,
      l = t.strike,
      u = t.atkVar === 0 ? n.armR : n.armL,
      d = t.atkVar === 0 ? 1 : -1;
    {
      let e = u * 9;
      ((r[e + 3] += -0.15 * c + 0.6 * l),
        (r[e + 4] += 0.6 * c - 0.5 * l),
        (r[e + 5] += -0.12 * d * l));
    }
    ((r[u * 9 + 2] += 0.7 * c - 1.1 * l),
      (r[n.core * 9 + 2] += 0.15 * c - 0.22 * l),
      (r[n.core * 9 + 1] += d * (0.25 * c - 0.3 * l)),
      (t.glowOut += 0.3 + 0.25 * Math.sin(i * 2.6) + c + l + s));
  }
  function wa(e, t, n) {
    let r = e.d,
      i = ii(t.deathT / 0.55),
      a = i * i;
    r[n.core * 9 + 4] += -0.55 * a;
    {
      let e = n.armR * 9;
      ((r[e + 3] += 0.1 * a), (r[e + 4] += -0.55 * a), (r[e + 5] += 0.45 * a));
    }
    {
      let e = n.armL * 9;
      ((r[e + 3] += 0.1 * a), (r[e + 4] += -0.55 * a), (r[e + 5] += -0.45 * a));
    }
    {
      let e = n.head * 9;
      ((r[e + 3] += 0.25 * a), (r[e + 4] += -0.5 * a));
    }
    ((r[n.head * 9 + 2] += -0.7 * a), (r[n.orbit * 9 + 4] += -0.65 * a));
    {
      let e = n.orbit * 9,
        t = 1 + 0.5 * a;
      ((r[e + 6] *= t), (r[e + 7] *= t), (r[e + 8] *= t));
    }
    ((r[n.armR * 9 + 0] += 0.8 * a), (r[n.armL * 9 + 0] += -0.8 * a));
  }
  let Ta = {
    build: Sa,
    animate: Ca,
    onDeath: wa,
    stride: 1.8,
    turnRate: 6,
    overhead: 2.55,
    shadow: [0.95, 0.95],
    glow: `#b98cff`,
    flinch: 0.5,
    kb: 0.2,
    fall: 0.25,
    fallLift: 0,
    rig: { root: `root`, body: `core`, head: `head`, limbs: [], flail: 0 },
    anchors: {
      head: [`head`, [0.33, 2, 0]],
      chest: [`core`, [0.3, 1.1, 0]],
      weapon: [`armR`, [0.55, 1.02, 0.86]],
      muzzle: [`head`, [0.56, 2, 0]],
    },
    halos: [
      {
        bone: `head`,
        at: [0.56, 2, 0],
        size: 0.3,
        color: `#e0b8ff`,
        alpha: 0.3,
        boost: 0.3,
      },
      {
        bone: `core`,
        at: [0.2, 1.1, 0],
        size: 0.55,
        color: `#a676ff`,
        alpha: 0.14,
        boost: 0.15,
      },
    ],
  };
  function Ea() {
    let e = new Xr(
        [
          [`root`, null, [0, 0, 0]],
          [`body`, `root`, [0, 0.68, 0]],
          [`shell`, `body`, [-0.08, 0.81, 0]],
          [`eyeR`, `body`, [0.42, 0.78, 0.13]],
          [`eyeL`, `body`, [0.42, 0.78, -0.13]],
          [`clawR`, `body`, [0.5, 0.63, 0.34]],
          [`clawL`, `body`, [0.5, 0.63, -0.34]],
          [`leg1R`, `body`, [0.28, 0.64, 0.34]],
          [`leg2R`, `body`, [0, 0.64, 0.4]],
          [`leg3R`, `body`, [-0.28, 0.64, 0.34]],
          [`leg1L`, `body`, [0.28, 0.64, -0.34]],
          [`leg2L`, `body`, [0, 0.64, -0.4]],
          [`leg3L`, `body`, [-0.28, 0.64, -0.34]],
        ],
        { seed: 707, texScale: 2.4 },
      ),
      t = `#d4813c`,
      n = new ri({
        voxel: 0.028,
        soft: 0.05,
        skinSoft: 0.1,
        noiseFreq: 5,
        seed: 7,
      });
    (n.ellipsoid([0.05, 0.62, 0], [0.5, 0.22, 0.44], {
      bone: `body`,
      color: `#e3cfa2`,
      k: 0.08,
    }),
      n.ellipsoid([0.36, 0.66, 0], [0.18, 0.12, 0.26], {
        bone: `body`,
        color: t,
        k: 0.08,
      }),
      n.ellipsoid([-0.08, 0.76, 0], [0.64, 0.47, 0.58], {
        bone: `shell`,
        color: `#b5762c`,
        k: 0.06,
      }),
      n.ellipsoid([-0.08, 0.74, 0], [0.7, 0.08, 0.64], {
        bone: `shell`,
        color: `#e6c87e`,
        k: 0.08,
      }),
      n.box([-0.08, 0.46, 0], [1, 0.26, 1], 0.02, {
        sub: !0,
        k: 0.06,
        bone: `shell`,
      }));
    {
      let e = null;
      for (let t = 0; t <= 26; t++) {
        let r = t * 0.42 + 0.6,
          i = 0.52 * (1 - t / 29),
          a = 0.76 + Math.sqrt(Math.max(0, 1 - (i / 0.64) ** 2)) * 0.47,
          o = [-0.08 + Math.cos(r) * i, a, Math.sin(r) * i * 0.9];
        (e &&
          n.cone(e, o, 0.035 * (1 - t / 34), 0.035 * (1 - (t + 1) / 34), {
            bone: `shell`,
            color: `#7d4c17`,
            k: 0.035,
          }),
          (e = o));
      }
    }
    (n.sym((e, t) => {
      let r = (t) => (e > 0 ? t : t.replace(/R$/, `L`));
      (n.cone(t([0.4, 0.7, 0.12]), t([0.56, 1.1, 0.16]), 0.05, 0.036, {
        bone: r(`eyeR`),
        color: `#f2b874`,
        k: 0.03,
      }),
        n.cone(t([0.42, 0.63, 0.32]), t([0.62, 0.62, 0.4]), 0.1, 0.13, {
          bone: r(`clawR`),
          color: `#eda45c`,
          k: 0.05,
        }),
        n.ellipsoid(t([0.76, 0.63, 0.41]), [0.22, 0.14, 0.17], {
          rot: [0, -0.25 * e, 0],
          bone: r(`clawR`),
          color: `#f2b874`,
          k: 0.04,
        }));
    }),
      n.build(e, {
        kind: K.shell,
        kind2: K.shell,
        aoScale: 0.12,
        ao: 1.1,
        tex: 2.6,
        paint: (e, t, n, r, i, a, o) => {
          if (t < 0.71) return;
          let s = Math.hypot(e + 0.08, (t - 1.23) * 1.2, n),
            c = 0.5 + 0.5 * Math.cos(s * 34),
            l = 0.84 + 0.2 * (1 - c ** 6) - 0.1 * (1 - c) ** 8;
          for (let e of [i, a]) for (let t = 0; t < 3; t++) e[o * 3 + t] *= l;
        },
        lodMax: 1.2,
      }));
    let r = new Ji(e, n),
      i = Or(3);
    for (let e = 0; e < 9; e++) {
      let e = i() * $ * 2,
        t = 0.4 + i() * 0.45;
      r.add(
        q.lathe(
          [
            [0.05, 0],
            [0.051, 0.009],
            [0.044, 0.028],
            [0.032, 0.046],
            [0.018, 0.057],
            [0, 0.061],
          ],
          10,
        ),
        [
          -0.08 + Math.cos(e) * Math.sin(t) * 0.7,
          0.76 + Math.cos(t) * 0.6,
          Math.sin(e) * Math.sin(t) * 0.66,
        ],
        {
          color: `#ddd0b0`,
          tip: `#6d6452`,
          kind: K.shell,
          localGrad: !0,
          sink: 0.014,
        },
      );
    }
    for (let [e, t, n] of [
      [-0.3, -0.2, 0.13],
      [-0.18, -0.28, 0.09],
      [-0.36, -0.06, 0.08],
    ])
      r.add(q.sphere(n, n * 0.45, n, 14, 8), [e, 1.36, t], {
        color: `#5d9a38`,
        kind: K.moss,
        sink: 0.02,
        occluder: !1,
      });
    for (let [e, t, n, i, a, o] of [
      [-0.35, 1.21, 0.22, 0.09, 0.24, [-0.4, 1, 0.5]],
      [-0.22, 1.26, 0.32, 0.068, 0.17, [0.1, 1, 0.7]],
    ])
      r.add(q.crystal(i, a, 6), [e, t, n], {
        color: `#6ff5ff`,
        kind: K.crystal,
        emit: 1.4,
        rough: 0.1,
        flat: !0,
        localGrad: !0,
        grad: [0.7, 1.2],
        sink: 0.05,
        lean: o,
        tilt: 0.4,
      });
    (e.add(q.sphere(0.055, 0.05, 0.055, 12, 8), {
      color: `#f7c889`,
      kind: K.shell,
      at: [0.545, 1.07, 0.16],
      bone: `eyeR`,
      mirror: !0,
    }),
      e.add(q.sphere(0.072, 0.072, 0.072, 14, 10), {
        color: `#0b1c22`,
        kind: K.shell,
        rough: 0.35,
        at: [0.556, 1.15, 0.16],
        bone: `eyeR`,
        mirror: !0,
        occluder: !1,
      }),
      e.add(q.sphere(0.062, 0.062, 0.062, 14, 10), {
        color: `#6ff5ff`,
        kind: K.eye,
        emit: 1.95,
        at: [0.562, 1.152, 0.162],
        bone: `eyeR`,
        mirror: !0,
        occluder: !1,
      }),
      e.add(q.box(0.014, 0.05, 0.02, 0.004), {
        color: `#04090c`,
        kind: K.shell,
        rough: 0.3,
        at: [0.606, 1.153, 0.176],
        rot: [0, -0.8, 0.1],
        bone: `eyeR`,
        mirror: !0,
        occluder: !1,
        recvAO: !1,
      }));
    let a = `#eda45c`,
      o =
        (e, t, n = 0.75) =>
        (r) => {
          let i = e * (1 - r * 0.8) + 0.008,
            a = [];
          for (let e = 0; e < 8; e++) {
            let r = (e / 8) * $ * 2;
            a.push([Math.cos(r) * i * n * (t || 1), Math.sin(r) * i]);
          }
          return a;
        };
    for (let t of [1, -1]) {
      let n = t > 0 ? `clawR` : `clawL`;
      (e.add(
        q.loft(
          [
            [0.84, 0.68, 0.44 * t],
            [1.04, 0.71, 0.37 * t],
            [1.22, 0.69, 0.22 * t],
          ],
          o(0.078),
          { segs: 12 },
        ),
        { color: a, tip: `#8a4e20`, tipFrom: 0.5, kind: K.shell, bone: n },
      ),
        e.add(
          q.loft(
            [
              [0.84, 0.57, 0.5 * t],
              [1.02, 0.54, 0.49 * t],
              [1.16, 0.57, 0.35 * t],
            ],
            o(0.06),
            { segs: 12 },
          ),
          { color: a, tip: `#8a4e20`, tipFrom: 0.5, kind: K.shell, bone: n },
        ));
      for (let r = 0; r < 3; r++)
        J(
          e,
          [0.9 + r * 0.1, 0.69, (0.44 - r * 0.06) * t],
          [0.1, -1, 0.15 * t],
          0.06,
          0.017,
          {
            color: `#e2b28a`,
            tip: `#fff4e2`,
            kind: K.bone,
            bone: n,
            radial: 5,
            segs: 3,
          },
        );
    }
    for (let n of [1, -1])
      for (let [r, i, a] of [
        [`leg1R`, 0.28, 0.34],
        [`leg2R`, 0, 0.4],
        [`leg3R`, -0.28, 0.34],
      ]) {
        let o = n > 0 ? r : r.replace(/R$/, `L`),
          s = i * 0.5,
          c = [i, 0.62, a * n],
          l = [i + s, 1.04, (a + 0.4) * n],
          u = [i + s * 1.8, 0, (a + 0.78) * n],
          d = [(c[0] + l[0]) / 2, (c[1] + l[1]) / 2 + 0.05, (c[2] + l[2]) / 2],
          f = [
            l[0] + (u[0] - l[0]) * 0.45,
            l[1] + (u[1] - l[1]) * 0.35 + 0.05,
            l[2] + (u[2] - l[2]) * 0.5 + 0.05 * n,
          ];
        (e.add(
          q.loft(
            [c, d, l],
            (e) => {
              let t = 0.055 * (1 - 0.3 * e) * (0.85 + 0.15 * Math.sin($ * e)),
                n = [];
              for (let e = 0; e < 8; e++) {
                let r = (e / 8) * $ * 2;
                n.push([Math.cos(r) * t * 0.8, Math.sin(r) * t]);
              }
              return n;
            },
            { segs: 10, up: [0, 1, 0] },
          ),
          { color: t, tip: `#e08a5c`, tipFrom: 0.4, kind: K.shell, bone: o },
        ),
          e.add(
            q.loft(
              [Ki(d, l, 0.82), l, Ki(l, f, 0.12)],
              (e) => {
                let t = 0.054 - 0.01 * Math.abs(e - 0.5),
                  n = [];
                for (let e = 0; e < 8; e++) {
                  let r = (e / 8) * $ * 2;
                  n.push([Math.cos(r) * t * 0.82, Math.sin(r) * t]);
                }
                return n;
              },
              { segs: 4, up: [0, 1, 0] },
            ),
            { color: `#6b3c18`, kind: K.shell, bone: o },
          ),
          e.add(
            q.loft(
              [l, f, u],
              (e) => {
                let t =
                    0.047 * (1 - e) ** 0.7 * (e < 0.08 ? 0.8 + e * 2.5 : 1) +
                    0.004,
                  n = [];
                for (let e = 0; e < 8; e++) {
                  let r = (e / 8) * $ * 2;
                  n.push([Math.cos(r) * t * 0.8, Math.sin(r) * t]);
                }
                return n;
              },
              { segs: 14, up: [0, 1, 0] },
            ),
            { color: t, tip: `#2a140c`, tipFrom: 0.62, kind: K.shell, bone: o },
          ));
      }
    return e.build({ aoFloor: 0.6 });
  }
  function Da(e, t, n) {
    let r = e.d,
      i = t.t,
      a = t.walk,
      o = t.phase,
      s = 1 - a,
      c = t.combat;
    ((r[n.eyeR * 9 + 1] += Math.sin(i * 1.3) * 0.3),
      (r[n.eyeL * 9 + 1] += Math.sin(i * 1.1 + 1) * 0.3),
      (r[n.eyeR * 9 + 2] += Math.sin(i * 0.9) * 0.15 - 0.45 * c),
      (r[n.eyeL * 9 + 2] += Math.sin(i * 0.8 + 2) * 0.15 - 0.45 * c),
      (r[n.shell * 9 + 4] += Math.sin(i * 2) * 0.01 - 0.05 * c),
      (r[n.clawR * 9 + 1] += Math.sin(i * 2.5) * 0.12 * s),
      (r[n.clawL * 9 + 1] += -Math.sin(i * 2.3 + 1) * 0.12 * s));
    let l = Math.sin(o),
      u = Math.max(0, Math.cos(o)) * a,
      d = Math.max(0, -Math.cos(o)) * a;
    ((r[n.leg1R * 9 + 1] += l * 0.35 * a),
      (r[n.leg1R * 9 + 0] += -0.3 * u),
      (r[n.leg2L * 9 + 1] += l * 0.35 * a),
      (r[n.leg2L * 9 + 0] += 0.3 * u),
      (r[n.leg3R * 9 + 1] += l * 0.35 * a),
      (r[n.leg3R * 9 + 0] += -0.3 * u),
      (r[n.leg1L * 9 + 1] += -l * 0.35 * a),
      (r[n.leg1L * 9 + 0] += 0.3 * d),
      (r[n.leg2R * 9 + 1] += -l * 0.35 * a),
      (r[n.leg2R * 9 + 0] += -0.3 * d),
      (r[n.leg3L * 9 + 1] += -l * 0.35 * a),
      (r[n.leg3L * 9 + 0] += 0.3 * d),
      (r[n.leg2R * 9 + 0] += Math.sin(i * 4 + 1) * 0.05 * s),
      (r[n.leg2L * 9 + 0] += -Math.sin(i * 3.6) * 0.05 * s),
      (r[n.body * 9 + 4] += Math.abs(Math.sin(2 * o)) * 0.03 * a),
      (r[n.body * 9 + 0] += Math.sin(o) * 0.04 * a));
  }
  function Oa(e, t, n) {
    let r = e.d,
      i = ii((t.deathT - 0.2) / 0.5);
    ((r[n.leg1R * 9 + 0] += -0.9 * i),
      (r[n.leg2R * 9 + 0] += -0.9 * i),
      (r[n.leg3R * 9 + 0] += -0.9 * i),
      (r[n.leg1L * 9 + 0] += 0.9 * i),
      (r[n.leg2L * 9 + 0] += 0.9 * i),
      (r[n.leg3L * 9 + 0] += 0.9 * i),
      (r[n.eyeR * 9 + 2] += -0.8 * i),
      (r[n.eyeL * 9 + 2] += -0.8 * i));
  }
  let ka = {
      build: Ea,
      animate: Da,
      onDeath: Oa,
      scale: 1.1,
      stride: 0.45,
      turnRate: 10,
      overhead: 1.62,
      shadow: [0.85, 0.8],
      glow: `#6ff5ff`,
      flinch: 0.7,
      kb: 0.35,
      fall: 2.9,
      tipOver: !0,
      fallLift: 0.45,
      rig: { root: `root`, body: `shell`, head: `body`, limbs: [], flail: 0 },
      anchors: {
        head: [`body`, [0.5, 0.94, 0]],
        chest: [`shell`, [0, 0.96, 0]],
        weapon: [`body`, [0.55, 0.66, 0]],
        muzzle: [`body`, [0.55, 0.66, 0]],
      },
      silHead: [`eyeR`, `eyeL`, `clawR`, `clawL`],
      halos: [
        {
          bone: `eyeR`,
          at: [0.56, 1.15, 0.16],
          size: 0.15,
          color: `#6ff5ff`,
          alpha: 0.35,
        },
        {
          bone: `eyeL`,
          at: [0.56, 1.15, -0.16],
          size: 0.15,
          color: `#6ff5ff`,
          alpha: 0.35,
        },
      ],
    },
    Aa = (e, t, n) => {
      let r = Math.max(0, Math.min(1, (n - e) / (t - e)));
      return r * r * (3 - 2 * r);
    };
  function ja(e, t) {
    let n = e.length - 1,
      r = Math.max(0, Math.min(n - 1e-6, t * n)),
      i = Math.floor(r),
      a = r - i,
      o = e[Math.max(0, i - 1)],
      s = e[i],
      c = e[i + 1],
      l = e[Math.min(n, i + 2)],
      u = (e) =>
        0.5 *
        (2 * s[e] +
          (-o[e] + c[e]) * a +
          (2 * o[e] - 5 * s[e] + 4 * c[e] - l[e]) * a * a +
          (-o[e] + 3 * s[e] - 3 * c[e] + l[e]) * a * a * a);
    return [u(0), u(1), u(2)];
  }
  function Ma() {
    let e = new Xr(
        [
          [`root`, null, [0, 0, 0]],
          [`coil`, `root`, [0, 0.5, 0]],
          [`body1`, `root`, [0.55, 0.9, 0]],
          [`body2`, `body1`, [0.35, 2.1, 0]],
          [`body3`, `body2`, [0.55, 3.3, 0]],
          [`body4`, `body3`, [0.95, 4.4, 0]],
          [`neck`, `body4`, [1.5, 5.15, 0]],
          [`head`, `neck`, [2.05, 5.5, 0]],
          [`jaw`, `head`, [2.4, 5.25, 0]],
          [`hoodR`, `neck`, [1.35, 5.1, 0.3]],
          [`hoodL`, `neck`, [1.35, 5.1, -0.3]],
          [`scytheR`, `body4`, [0.95, 4.05, 0.72]],
          [`scytheForeR`, `scytheR`, [1.75, 3.3, 1.45]],
          [`scytheL`, `body4`, [0.95, 4.05, -0.72]],
          [`scytheForeL`, `scytheL`, [1.75, 3.3, -1.45]],
          [`tailTip`, `coil`, [1.94, 0.5, 1.41]],
        ],
        { seed: 909, texScale: 0.62 },
      ),
      t = `#43277e`,
      n = `#1d0f35`,
      r = `#9c72ee`,
      i = `#2a1656`,
      a = `#b294ee`,
      o = new ri({
        voxel: 0.08,
        soft: 0.14,
        skinSoft: 0.35,
        noiseFreq: 1.6,
        seed: 90,
      }),
      s = [];
    for (let e = 0; e <= 18; e++) {
      let t = e / 18,
        n = $ * 0.2 + t * $ * 1.95,
        r = 2.45 - t * 1.35;
      s.push([Math.cos(n) * r, 0.55 + t * 0.18, Math.sin(n) * r]);
    }
    let c = (e) => 0.5 + 0.28 * Math.sin(e * $) + 0.12 * e;
    for (let e = 0; e < s.length - 1; e++) {
      let n = e / 18;
      o.cone(s[e], s[e + 1], c(n), c(n + 1 / 18), {
        bone: `coil`,
        color: e % 3 == 1 ? `#9a7538` : e % 2 ? t : `#5b32a0`,
        k: 0.2,
        vein: e > 12 ? 0.3 : 0,
      });
    }
    let l = [
        [1.05, 0.62, 0.35],
        [0.5, 1.2, 0],
        [0.35, 2.2, 0],
        [0.55, 3.3, 0],
        [0.95, 4.35, 0],
        [1.5, 5.1, 0],
        [1.95, 5.45, 0],
      ],
      u = [0.98, 0.95, 0.86, 0.74, 0.62, 0.52, 0.48],
      d = [`body1`, `body1`, `body2`, `body3`, `body4`, `neck`, `head`];
    for (let e = 0; e < l.length - 1; e++)
      o.cone(l[e], l[e + 1], u[e], u[e + 1], {
        bones: [d[e], d[e + 1]],
        color: t,
        k: 0.3,
      });
    let f = (e) => {
        let t = e * (l.length - 1),
          n = Math.min(l.length - 2, Math.floor(t));
        return [d[n], d[n + 1]];
      },
      p = (e) => {
        let t = e * (u.length - 1),
          n = Math.min(u.length - 2, Math.floor(t));
        return u[n] + (u[n + 1] - u[n]) * (t - n);
      };
    for (let e = 0; e < 13; e++) {
      let t = 0.1 + e * 0.066,
        n = ja(l, t),
        i = ja(l, t + 0.01),
        a = i[0] - n[0],
        s = i[1] - n[1],
        c = Math.hypot(a, s) || 1,
        u = Math.atan2(-a / c, s / c),
        d = Math.cos(u),
        m = Math.sin(u),
        h = p(t);
      o.box(
        [n[0] + d * h * 0.8, n[1] + m * h * 0.8, 0],
        [0.1, 0.15, h * 0.64],
        0.07,
        { rot: [0, 0, u], bones: f(t), color: r, w2: 1, k: 0.035 },
      );
    }
    (o.ellipsoid([2.15, 5.62, 0], [0.7, 0.48, 0.6], {
      bone: `head`,
      color: a,
      k: 0.2,
    }),
      o.cone([2.45, 5.52, 0], [3.42, 5.42, 0], 0.36, 0.19, {
        bone: `head`,
        color: a,
        k: 0.16,
      }),
      o.box([3.02, 5.49, 0], [0.5, 0.16, 0.27], 0.13, {
        rot: [0, 0, -0.06],
        bone: `head`,
        color: a,
        k: 0.1,
      }),
      o.box([3.02, 5.63, 0], [0.38, 0.045, 0.06], 0.035, {
        rot: [0, 0, -0.08],
        bone: `head`,
        color: i,
        k: 0.04,
      }),
      o.box([2.08, 6.02, 0], [0.5, 0.075, 0.07], 0.05, {
        rot: [0, 0, -0.14],
        bone: `head`,
        color: i,
        k: 0.06,
      }),
      o.box([2.9, 5.13, 0], [0.54, 0.12, 0.29], 0.1, {
        rot: [0, 0, 0.05],
        bone: `jaw`,
        color: r,
        w2: 1,
        k: 0.08,
      }),
      o.box([3.05, 5.31, 0], [0.62, 0.035, 0.4], 0.02, {
        sub: !0,
        k: 0.04,
        bone: `head`,
      }),
      o.sym((e, t) => {
        let r = (t) => (e > 0 ? t : t.replace(/R$/, `L`));
        (o.ellipsoid(t([2.46, 5.52, 0.43]), [0.38, 0.19, 0.18], {
          rot: [0.2 * e, -0.25 * e, 0],
          bone: `head`,
          color: n,
          k: 0.08,
        }),
          o.box(t([2.58, 5.9, 0.35]), [0.38, 0.07, 0.11], 0.05, {
            rot: [0.35 * e, -0.4 * e, -0.16],
            bone: `head`,
            color: i,
            k: 0.06,
          }),
          o.sphere(t([2.72, 5.76, 0.37]), 0.12, {
            sub: !0,
            k: 0.04,
            bone: `head`,
          }),
          o.sphere(t([3.43, 5.5, 0.1]), 0.05, {
            sub: !0,
            k: 0.03,
            bone: `head`,
          }),
          o.cone(t([0.95, 4.05, 0.62]), t([1.75, 3.3, 1.45]), 0.25, 0.16, {
            bones: [r(`scytheR`), r(`scytheForeR`)],
            color: n,
            k: 0.18,
          }),
          o.sphere(t([1.75, 3.3, 1.45]), 0.2, {
            bone: r(`scytheForeR`),
            color: n,
            k: 0.1,
          }));
      }));
    let m = [
      [1.94, 0.5, 1.41],
      [2.35, 0.75, 2.05],
      [2.15, 1.35, 2.55],
      [1.62, 1.75, 2.62],
    ];
    for (let e = 0; e < m.length - 1; e++)
      o.cone(
        m[e],
        m[e + 1],
        0.45 * (1 - e / 3) + 0.08,
        0.45 * (1 - (e + 1) / 3) + 0.08,
        { bone: `tailTip`, color: e === 2 ? n : t, k: 0.12 },
      );
    let h = [0.48, 0.4, 0.7];
    o.build(e, {
      kind: K.shell,
      kind2: K.shell,
      aoScale: 0.9,
      ao: 1.1,
      tex: 0.62,
      paint: (e, t, n, r, i, a, o) => {
        let s = t > 1.35 ? r[0] * 0.9 - r[1] * 0.25 : -r[1] * 0.8 + 0.15,
          c = Aa(-0.1, 0.8, s),
          l = Aa(0.2, 0.95, t > 1.35 ? -r[0] : r[1]);
        for (let e of [i, a])
          for (let t = 0; t < 3; t++) {
            let n = o * 3 + t;
            e[n] =
              e[n] * (0.78 + 0.14 * (1 - l)) * (1 - c) +
              (e[n] * 0.55 + h[t] * 0.45) * c;
          }
      },
      lodMax: 1.4,
    });
    let g = new Ji(e, o),
      _ = Or(11),
      v = { color: `#3a2c32`, tip: `#e2c184`, kind: K.bone, rough: 0.5 },
      y = {
        color: `#4a3617`,
        tip: `#d9ae5c`,
        tipFrom: 0.22,
        kind: K.shell,
        rough: 0.4,
        vein: 0.3,
        aoStrength: 0.6,
      };
    for (let e = 1; e < s.length - 1; e++) {
      let t = (e + 0.5) / 18,
        n = Ki(s[e], s[e + 1], 0.5),
        r = s[e + 1][0] - s[e][0],
        i = s[e + 1][2] - s[e][2],
        a = Math.hypot(r, i),
        o = c(t);
      g.add(q.scute(a * 1.35, o * 1.15, 0.13), [n[0], n[1] + o + 0.3, n[2]], {
        ...y,
        tipAxis: `y`,
        sink: 0.03,
        lean: [-r, 1.4, -i],
        tilt: 0.18,
        twist: Math.atan2(-i, r) + $,
      });
    }
    for (let e = 0; e < 10; e++) {
      let t = 0.14 + e * 0.083,
        n = ja(l, t),
        r = p(t);
      g.add(
        q.scute(0.75 * (1 - t * 0.3), r * 1.1, 0.12),
        [n[0] - r - 0.4, n[1] + 0.06, 0],
        { ...y, sink: 0.06, lean: [-1, -0.35, 0], tilt: 0.25 },
      );
    }
    let b = {
      color: `#c35cff`,
      kind: K.crystal,
      emit: 1.6,
      rough: 0.1,
      flat: !0,
      localGrad: !0,
      grad: [0.7, 1.25],
    };
    for (let t = 0; t < 6; t++) {
      let r = 0.16 + t * 0.13,
        i = ja(l, r),
        a = g.at([i[0] - 1.1, i[1] + 0.1, 0]),
        o = a.skin;
      J(e, a.p, [-1, 0.5 - r * 0.6, 0], 0.85 - r * 0.35, 0.14 - r * 0.05, {
        ...v,
        bend: [-0.2, -0.4, 0],
        skin: () => o,
        collar: !0,
        collarColor: n,
      });
    }
    for (let e = 0; e < 10; e++) {
      let t = s[(1 + e * 1.7) | 0];
      g.add(
        q.crystal(0.1 + _() * 0.08, 0.45 + _() * 0.5, 6),
        [t[0] * 1.02, t[1] + 0.8, t[2] * 1.02],
        { ...b, sink: 0.15, lean: [t[0], 1.4, t[2]], tilt: 0.3, twist: e },
      );
    }
    (J(e, [1.95, 5.98, 0.36], [-1, 0.55, 0.55], 1.35, 0.18, {
      ...v,
      bend: [0.1, -0.35, 0.25],
      bone: `head`,
      mirror: !0,
      collar: !0,
      collarColor: n,
      radial: 12,
      segs: 14,
    }),
      J(e, [2.3, 6, 0.5], [-0.8, 0.4, 1], 0.7, 0.1, {
        ...v,
        bend: [-0.2, -0.3, 0],
        bone: `head`,
        mirror: !0,
      }),
      e.add(q.sphere(0.107, 0.082, 0.097, 14, 10), {
        color: `#150c22`,
        kind: K.shell,
        rough: 0.5,
        at: [2.735, 5.76, 0.336],
        bone: `head`,
        mirror: !0,
        occluder: !1,
      }),
      e.add(q.sphere(0.09, 0.065, 0.08, 14, 10), {
        color: `#ff8af8`,
        kind: K.eye,
        emit: 1.98,
        at: [2.742, 5.76, 0.342],
        bone: `head`,
        mirror: !0,
        occluder: !1,
      }),
      e.add(q.box(0.016, 0.084, 0.03, 0.005), {
        color: `#12060f`,
        kind: K.shell,
        rough: 0.3,
        at: [2.786, 5.762, 0.404],
        rot: [0, -0.92, 0.1],
        bone: `head`,
        mirror: !0,
        occluder: !1,
        recvAO: !1,
      }),
      e.add(q.torus(0.072, 0.017, 8, 22), {
        ...v,
        color: `#1b1128`,
        tip: void 0,
        at: [2.515, 5.84, 0.437],
        quat: Ui(Wi([0.25, 0.62, 0.74])),
        bone: `head`,
        mirror: !0,
        occluder: !1,
      }),
      e.add(q.sphere(0.055, 0.04, 0.05, 12, 8), {
        color: `#ff8af8`,
        kind: K.eye,
        emit: 1.95,
        at: [2.52, 5.84, 0.44],
        bone: `head`,
        mirror: !0,
        occluder: !1,
      }));
    for (let t = 0; t < 3; t++)
      J(
        e,
        [2.72 + t * 0.25, 5.3, 0.3 - t * 0.03],
        [0, -1, 0.1],
        0.3 - t * 0.05,
        0.05,
        {
          color: `#d8cdea`,
          tip: `#ffffff`,
          kind: K.bone,
          bone: `head`,
          mirror: !0,
          radial: 6,
          segs: 4,
        },
      );
    for (let t = 0; t < 3; t++)
      J(e, [2.75 + t * 0.24, 5.2, 0.28 - t * 0.03], [0, 1, 0.1], 0.2, 0.04, {
        color: `#d8cdea`,
        tip: `#ffffff`,
        kind: K.bone,
        bone: `jaw`,
        mirror: !0,
        radial: 6,
        segs: 4,
      });
    let x = [1.18, 5.2, 0.24],
      S = (e, t) => {
        let n = -1.2 + t * 2.95,
          r = 0.5 - 0.5 * Math.cos(2 * $ * (t * 6 - 0.5)),
          i =
            0.16 +
            e * (1.62 * (0.72 + 0.28 * Math.sin(t * $)) * (1 - 0.09 * r * e)),
          a = i * Math.sin(n) * 0.95;
        return [
          x[0] -
            0.3 * e +
            1.05 * e ** 2.2 * (0.55 + 0.45 * Math.abs(Math.cos(n))) -
            0.62 * Math.max(0, a) -
            0.1 * r * e ** 0.8,
          x[1] + a,
          x[2] + i * Math.cos(n),
        ];
      },
      C = (e, t) => {
        let n = 0.01,
          r = S(e, t),
          i = S(Math.min(1, e + n), t),
          a = S(e, Math.min(1, t + n)),
          o = [i[0] - r[0], i[1] - r[1], i[2] - r[2]],
          s = [a[0] - r[0], a[1] - r[1], a[2] - r[2]];
        return Wi([
          o[1] * s[2] - o[2] * s[1],
          o[2] * s[0] - o[0] * s[2],
          o[0] * s[1] - o[1] * s[0],
        ]);
      };
    e.add(q.surface(S, 26, 30, 0.045), {
      color: `#28123f`,
      tip: `#8244c9`,
      tipFrom: 0.12,
      kind: K.membrane,
      vein: 0.9,
      tex: 0.8,
      grad: [0.8, 1.1],
      bone: `hoodR`,
      mirror: !0,
      aoStrength: 0.4,
    });
    for (let t = 0; t < 6; t++) {
      let n = (t + 0.5) / 6,
        r = [0.02, 0.3, 0.6, 0.85, 1.04]
          .map((e) => S(Math.min(1, e), n))
          .map((e, t) => (t === 4 ? Ki(S(0.85, n), S(1, n), 1.25) : e));
      e.add(
        q.tube(r, (e) => 0.065 * (1 - e) ** 1.3 + 0.0025, {
          radial: 8,
          segs: 14,
        }),
        { ...v, tip: `#cbbfe0`, tipFrom: 0.35, bone: `hoodR`, mirror: !0 },
      );
    }
    {
      let t = [];
      for (let e = 0; e <= 24; e++) t.push(S(1, e / 24));
      e.add(
        q.tube(
          t,
          (e) =>
            (0.034 + 0.012 * Math.sin(e * $)) *
              Math.min(1, Math.sin(Math.min(1, e * 9) * $ * 0.5) * 1.02) *
              Math.min(1, Math.sin(Math.min(1, (1 - e) * 9) * $ * 0.5) * 1.02) +
            0.002,
          { radial: 8, segs: 60 },
        ),
        {
          ...v,
          color: `#8f82ab`,
          tip: void 0,
          bone: `hoodR`,
          mirror: !0,
          occluder: !1,
        },
      );
    }
    for (let [t, n, r] of [
      [0.52, 0.42, 0.17],
      [0.74, 0.66, 0.12],
      [0.7, 0.2, 0.09],
    ]) {
      let i = S(t, n),
        a = C(t, n),
        o = a[0] < 0 ? [-a[0], -a[1], -a[2]] : a,
        s = [i[0] + o[0] * 0.035, i[1] + o[1] * 0.035, i[2] + o[2] * 0.035];
      (e.add(q.torus(r, r * 0.22, 8, 28).rotateX($ / 2), {
        ...v,
        color: `#1b1128`,
        tip: void 0,
        at: s,
        quat: Ui(o),
        bone: `hoodR`,
        mirror: !0,
        occluder: !1,
      }),
        e.add(q.sphere(r * 0.78, r * 0.2, r * 0.78, 18, 8), {
          color: `#ff7cf0`,
          kind: K.eye,
          emit: 1.9,
          at: s,
          quat: Ui(o),
          bone: `hoodR`,
          mirror: !0,
          occluder: !1,
        }));
    }
    let w = (e) =>
        0.36 *
          (0.55 + 0.45 * Math.sin($ * Math.min(1, e * 1.5 + 0.1))) *
          (1 - e) ** 0.55 +
        0.015,
      T = (e) => 0.1 * (1 - e * 0.85) + 0.008,
      E = (e) => {
        let t = w(e),
          n = T(e);
        return [
          [0, t],
          [0.28 * n, 0.5 * t],
          [0.55 * n, 0.12 * t],
          [n, -0.12 * t],
          [0.7 * n, -0.42 * t],
          [0.3 * n, -0.6 * t],
          [-0.3 * n, -0.6 * t],
          [-0.7 * n, -0.42 * t],
          [-n, -0.12 * t],
          [-0.55 * n, 0.12 * t],
          [-0.28 * n, 0.5 * t],
        ];
      },
      D = (e) => {
        let t = w(e);
        return [
          [0.014, t - 0.025],
          [0, t + 0.018],
          [-0.014, t - 0.025],
          [0, t - 0.06],
        ];
      },
      O = [
        [0, 0.06, 0],
        [0.8, 0.3, 0],
        [1.6, 0.24, 0],
        [2.3, -0.08, 0],
        [2.85, -0.74, 0],
      ];
    for (let t of [1, -1]) {
      let n = t > 0 ? `scytheForeR` : `scytheForeL`;
      e.frame([1.75, 3.3, 1.45 * t], [0, 0, -0.25], 1, () => {
        (e.add(q.loft(O, E, { segs: 30, up: [0, 0, 1] }), {
          color: `#3a2c55`,
          tip: `#efe8fa`,
          tipFrom: 0.1,
          kind: K.bone,
          rough: 0.35,
          flat: !0,
          bone: n,
        }),
          e.add(q.loft(O, D, { segs: 30, up: [0, 0, 1] }), {
            color: `#d86bff`,
            kind: K.eye,
            emit: 1.9,
            bone: n,
            occluder: !1,
            recvAO: !1,
          }));
      });
      for (let r = 0; r < 3; r++)
        J(
          e,
          [1.62 - r * 0.18, 3.42 + r * 0.12, 1.45 * t + 0.1 * t],
          [-0.6, 0.7, 0.4 * t],
          0.3 - r * 0.06,
          0.05,
          { ...v, bone: n },
        );
    }
    return (
      g.add(q.crystal(0.13, 0.7, 6), [1.62, 1.9, 2.62], {
        ...b,
        sink: 0.1,
        lean: [-0.5, 1, 0.3],
        tilt: 0.5,
      }),
      e.build({ aoFloor: 0.5, aoHeight: 2.5 })
    );
  }
  function Na(e, t, n) {
    let r = e.d,
      i = t.t,
      a = t.walk,
      o = t.phase,
      s = t.combat,
      c = Ri(t, 1.6),
      l = 1 + 1.5 * a,
      u = i * 0.55 + o * 0.5 * a;
    ((r[n.body2 * 9 + 1] += Math.sin(u) * 0.05 * l),
      (r[n.body3 * 9 + 1] += Math.sin(u - 0.7) * 0.07 * l),
      (r[n.body4 * 9 + 1] += Math.sin(u - 1.4) * 0.08 * l),
      (r[n.neck * 9 + 1] += Math.sin(u - 2.1) * 0.08 * l),
      (r[n.body3 * 9 + 0] += Math.sin(i * 0.45) * 0.04),
      (r[n.body4 * 9 + 2] += Math.sin(i * 0.7) * 0.03),
      (r[n.head * 9 + 1] += Math.sin(i * 0.23) * 0.3 * (1 - s)),
      (r[n.head * 9 + 2] += Math.sin(i * 0.37) * 0.06));
    let d = 0.12 + Math.sin(i * 1.2) * 0.04;
    ((r[n.hoodR * 9 + 1] += d),
      (r[n.hoodL * 9 + 1] += -d),
      (r[n.jaw * 9 + 2] += -0.06 - Math.max(0, Math.sin(i * 0.8)) * 0.1),
      (r[n.scytheR * 9 + 2] += Math.sin(i * 0.9) * 0.05),
      (r[n.scytheL * 9 + 2] += Math.sin(i * 0.9 + 1) * 0.05),
      (r[n.scytheForeR * 9 + 2] += 0.1 * Math.sin(i * 1.1 + 0.5)),
      (r[n.scytheForeL * 9 + 2] += 0.1 * Math.sin(i * 1.1 + 1.5)),
      (r[n.tailTip * 9 + 1] += Math.sin(i * 1.4) * 0.25),
      (r[n.tailTip * 9 + 0] += Math.sin(i * 0.9) * 0.2),
      (t.glowOut += 0.4 + 0.3 * Math.sin(i * 1.7) + 1.6 * c + 0.3 * s),
      (r[n.neck * 9 + 2] += -0.2 * t.reset01),
      (r[n.body4 * 9 + 2] += -0.1 * t.reset01),
      (r[n.body3 * 9 + 2] += 0.15 * c),
      (r[n.body4 * 9 + 2] += 0.2 * c),
      (r[n.neck * 9 + 2] += 0.25 * c),
      (r[n.jaw * 9 + 2] += -0.7 * c),
      (r[n.hoodR * 9 + 1] += -0.35 * c),
      (r[n.hoodL * 9 + 1] += 0.35 * c),
      (r[n.scytheR * 9 + 2] += 0.9 * c),
      (r[n.scytheL * 9 + 2] += 0.9 * c));
    let f = t.antic,
      p = t.strike;
    (t.atkVar === 0
      ? ((r[n.body3 * 9 + 2] += 0.15 * f - 0.18 * p),
        (r[n.body4 * 9 + 2] += 0.22 * f - 0.3 * p),
        (r[n.neck * 9 + 2] += 0.3 * f - 0.35 * p),
        (r[n.head * 9 + 2] += -0.1 * f + 0.08 * p),
        (r[n.jaw * 9 + 2] += -0.35 * f - 0.8 * p),
        (r[n.hoodR * 9 + 1] += -0.3 * f),
        (r[n.hoodL * 9 + 1] += 0.3 * f))
      : ((r[n.scytheR * 9 + 2] += 1.1 * f - 0.9 * p),
        (r[n.scytheL * 9 + 2] += 1.1 * f - 0.9 * p),
        (r[n.scytheForeR * 9 + 2] += 0.6 * f - 0.7 * p),
        (r[n.scytheForeL * 9 + 2] += 0.6 * f - 0.7 * p),
        (r[n.body4 * 9 + 2] += 0.12 * f - 0.25 * p),
        (r[n.neck * 9 + 2] += 0.1 * f - 0.2 * p),
        (r[n.jaw * 9 + 2] += -0.4 * f)),
      (t.glowOut += 2 * f + 2.2 * p));
  }
  function Pa(e, t, n) {
    let r = e.d,
      i = ai((t.deathT - 0.1) / 1.2);
    ((r[n.body2 * 9 + 2] += -0.22 * i),
      (r[n.body3 * 9 + 2] += -0.32 * i),
      (r[n.body4 * 9 + 2] += -0.38 * i),
      (r[n.neck * 9 + 2] += -0.3 * i),
      (r[n.jaw * 9 + 2] += -0.5 * i),
      (r[n.hoodR * 9 + 1] += 0.5 * i),
      (r[n.hoodL * 9 + 1] += -0.5 * i),
      (r[n.scytheR * 9 + 2] += -0.7 * i),
      (r[n.scytheL * 9 + 2] += -0.7 * i));
  }
  let Fa = {
      build: Ma,
      animate: Na,
      onDeath: Pa,
      stride: 3.5,
      turnRate: 2.5,
      overhead: 7.6,
      shadow: [3.3, 3.3],
      glow: `#c04dff`,
      flinch: 0.1,
      kb: 0.05,
      fall: 0,
      fallLift: 0,
      dissolve: [1.6, 2.45],
      rig: { root: `root`, body: `body3`, head: `head`, limbs: [], flail: 0 },
      anchors: {
        head: [`head`, [2.7, 5.65, 0]],
        chest: [`body3`, [1.15, 3.3, 0]],
        weapon: [`scytheForeR`, [4.1, 2.5, 1.45]],
        muzzle: [`head`, [3.4, 5.28, 0]],
      },
      halos: [
        {
          bone: `head`,
          at: [2.9, 5.3, 0],
          size: 1,
          color: `#d05cff`,
          alpha: 0.16,
          boost: 0.7,
        },
        {
          bone: `head`,
          at: [2.78, 5.75, 0],
          size: 0.6,
          color: `#ff7cf5`,
          alpha: 0.28,
        },
      ],
    },
    Ia = (e) => ({
      scale: 1,
      turnRate: 5,
      flinch: 0.35,
      kb: 0.35,
      fall: 1.4,
      fallLift: 0.2,
      ...e,
    }),
    La = {
      verdant_warden: Ia(va),
      crimson_brute: Ia($i),
      thornback: Ia(oa),
      mire_toad: Ia(xa),
      ash_stalker: Ia(ha),
      shard_golem: Ia(Ta),
      rift_skitter: Ia(ka),
      storm_drake: Ia({ ...ra, epic: !0 }),
      abyssal_tyrant: Ia({ ...Fa, epic: !0 }),
    },
    Ra = { ...Li, ...La };
  self.onmessage = (e) => {
    let t = e.data && e.data.key,
      n = Ra[t];
    if (!n) {
      self.postMessage({ key: t, ok: !1, error: `unknown creep type ` + t });
      return;
    }
    try {
      let e = performance.now(),
        r = n.build(),
        i = r.geometry,
        a = {},
        o = [];
      for (let e of Object.keys(i.attributes)) {
        let t = i.attributes[e];
        ((a[e] = { array: t.array, itemSize: t.itemSize }),
          o.push(t.array.buffer));
      }
      let s = i.index.array;
      o.push(s.buffer);
      let c = (r.lodIndex || []).map((e) => e || null);
      for (let e of c) e && o.push(e.buffer);
      self.postMessage(
        {
          key: t,
          ok: !0,
          attrs: a,
          index: s,
          lodIndex: c,
          lodTris: r.lodTris,
          bones: r.bones,
          boneIndex: r.boneIndex,
          height: r.height,
          triangles: r.triangles,
          ms: performance.now() - e,
        },
        o,
      );
    } catch (e) {
      self.postMessage({ key: t, ok: !1, error: String((e && e.stack) || e) });
    }
  };
})();
