(function () {
  function e(e) {
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
  function t(t, n, r, i = /* @__PURE__ */ new Float32Array(65536)) {
    let a = e(r),
      o = new Float32Array(t * n);
    for (let e = 0; e < o.length; e++) o[e] = a();
    let s = /* @__PURE__ */ new Int32Array(256),
      c = /* @__PURE__ */ new Float32Array(256),
      l = /* @__PURE__ */ new Int32Array(256),
      u = /* @__PURE__ */ new Float32Array(256);
    for (let e = 0; e < 256; e++) {
      let n = (e / 256) * t,
        r = Math.floor(n);
      s[e] = r;
      let i = n - r;
      c[e] = i * i * (3 - 2 * i);
    }
    for (let e = 0; e < 256; e++) {
      let t = (e / 256) * n,
        r = Math.floor(t);
      l[e] = r;
      let i = t - r;
      u[e] = i * i * (3 - 2 * i);
    }
    for (let e = 0; e < 256; e++) {
      let r = l[e] % n,
        a = (l[e] + 1) % n,
        d = u[e];
      for (let n = 0; n < 256; n++) {
        let l = s[n] % t,
          u = (s[n] + 1) % t,
          f = c[n],
          p = o[l + r * t],
          m = o[u + r * t],
          h = o[l + a * t],
          g = o[u + a * t];
        i[n + e * 256] = (p + (m - p) * f) * (1 - d) + (h + (g - h) * f) * d;
      }
    }
    return i;
  }
  function n(e, n, r, i, a = 0.5) {
    let o = /* @__PURE__ */ new Float32Array(65536),
      s = 1,
      c = 0,
      l = /* @__PURE__ */ new Float32Array(65536);
    for (let u = 0; u < r; u++) {
      t(e << u, n << u, i + u * 101, l);
      for (let e = 0; e < o.length; e++) o[e] += l[e] * s;
      ((c += s), (s *= a));
    }
    for (let e = 0; e < o.length; e++) o[e] /= c;
    return o;
  }
  function r(e) {
    let t = Math.imul(e | 0, 2654435761) >>> 0;
    return (
      (t ^= t >>> 15),
      (t = Math.imul(t, 2246822519) >>> 0),
      (t ^= t >>> 13),
      (t >>> 8) / 16777216
    );
  }
  function i(e, t, n = 0.8, i = 256) {
    let a = e * e,
      o = new Float32Array(a),
      s = new Float32Array(a),
      c = new Float32Array(a),
      l = i / e;
    for (let e = 0; e < a; e++)
      ((o[e] = (0.5 + (r(e * 2 + t * 7919) - 0.5) * n) * l),
        (s[e] = (0.5 + (r(e * 2 + 1 + t * 7919) - 0.5) * n) * l),
        (c[e] = r(e * 7919 + t)));
    let u = new Float32Array(i * i),
      d = new Float32Array(i * i),
      f = new Float32Array(i * i);
    for (let t = 0; t < i; t++) {
      let n = Math.floor(t / l);
      for (let r = 0; r < i; r++) {
        let a = Math.floor(r / l),
          p = 1e9,
          m = 1e9,
          h = 0;
        for (let i = -1; i <= 1; i++) {
          let c = n + i,
            u = (((c % e) + e) % e) * e,
            d = c * l;
          for (let n = -1; n <= 1; n++) {
            let i = a + n,
              c = (((i % e) + e) % e) + u,
              f = i * l + o[c] - r,
              g = d + s[c] - t,
              _ = f * f + g * g;
            _ < p ? ((m = p), (p = _), (h = c)) : _ < m && (m = _);
          }
        }
        let g = r + t * i;
        ((u[g] = Math.sqrt(p)), (d[g] = Math.sqrt(m)), (f[g] = c[h]));
      }
    }
    return { f1: u, f2: d, id: f, cs: l };
  }
  let a = (e) => (e < 0 ? 0 : e > 1 ? 1 : e),
    o = (e, t, n) => {
      let r = a((n - e) / (t - e));
      return r * r * (3 - 2 * r);
    },
    s = (e, t, n) =>
      e[(((t + 0.5) | 0) & 255) + ((((n + 0.5) | 0) & 255) << 8)];
  function c(e, t, r) {
    let i = n(3, 3, 3, 11),
      a = n(6, 4, 2, 14),
      s = n(96, 96, 1, 12),
      c = n(5, 5, 3, 13);
    for (let n = 0; n < 256; n++)
      for (let l = 0; l < 256; l++) {
        let u = l + n * 256,
          d = l / 256 + (i[u] - 0.5) * 0.5 + (a[u] - 0.5) * 0.12,
          f = Math.sin(
            d * Math.PI * 2 * 3 + Math.sin((n / 256) * Math.PI * 2) * 0.9,
          ),
          p = f * 0.5 + 0.5,
          m = o(0.86, 0.99, -f) * o(0.35, 0.65, a[u]);
        ((e[u] =
          0.5 + (p - 0.5) * 0.22 + (s[u] - 0.5) * 0.1 + (c[u] - 0.5) * 0.3),
          (t[u] = m * 0.55 + o(0.72, 0.85, s[u]) * 0.12),
          (r[u] = o(0.85, 0.99, f) * 0.3 + o(0.65, 0.8, c[u]) * 0.2));
      }
  }
  function l(e, t, r) {
    let i = n(6, 6, 3, 21),
      a = n(96, 3, 2, 22),
      s = n(48, 48, 1, 23),
      c = n(40, 40, 1, 24);
    for (let n = 0; n < 65536; n++)
      ((e[n] = 0.5 + (i[n] - 0.5) * 0.36 + (a[n] - 0.5) * 0.16),
        (t[n] = o(0.78, 0.9, c[n]) * 0.6),
        (r[n] = o(0.8, 0.92, s[n]) * 0.8));
  }
  function u(e, t, r) {
    let c = n(4, 4, 4, 31),
      l = n(40, 40, 1, 32),
      u = n(3, 3, 2, 33),
      d = n(5, 5, 2, 35),
      f = i(4, 34, 0.9),
      p = i(9, 36, 0.95);
    for (let n = 0; n < 256; n++)
      for (let i = 0; i < 256; i++) {
        let m = i + n * 256,
          h = i + (d[m] - 0.5) * 18,
          g = n + (d[m] - 0.5) * 18,
          _ = s(f.f2, h, g) - s(f.f1, h, g),
          v = s(p.f2, h, g) - s(p.f1, h, g),
          y = o(0.3, 0.52, s(u, h * 0.7, g * 0.7)),
          b = (1 - o(1.4, 7.5, _)) * (0.25 + 0.75 * y),
          x = (1 - o(0.8, 3.2, v)) * o(0.42, 0.66, u[m]),
          S = 1 - o(1.4, 7.5, s(f.f2, h, g - 6) - s(f.f1, h, g - 6)),
          C = a(S - b) * 0.9,
          w = 1 - o(1.2, 4, s(p.f1, h, g));
        ((e[m] =
          0.5 +
          (c[m] - 0.5) * 0.85 +
          (s(f.id, h, g) - 0.5) * 0.4 +
          (l[m] - 0.5) * 0.16 -
          b * 0.16 +
          C * 0.2),
          (t[m] = Math.min(1, b * 0.85 + x * 0.45 + w * 0.18)),
          (r[m] = C * 0.75 + o(0.8, 0.9, l[m]) * 0.35));
      }
  }
  function d(e, t, r) {
    let i = n(3, 3, 4, 41),
      a = n(4, 4, 3, 42),
      c = n(8, 8, 2, 43);
    for (let n = 0; n < 256; n++)
      for (let l = 0; l < 256; l++) {
        let u = l + n * 256,
          d = s(a, l + (c[u] - 0.5) * 60, n + (c[u] - 0.5) * 40),
          f = 1 - o(0, 0.055, Math.abs(d - 0.5)),
          p = (1 - o(0.02, 0.14, Math.abs(d - 0.5))) * 0.4;
        ((e[u] = 0.5 + (i[u] - 0.5) * 0.34 - p * 0.14),
          (t[u] = Math.min(1, f * 0.55 + p * 0.3)),
          (r[u] = o(0.5, 0.8, i[u]) * 0.4));
      }
  }
  function f(e, t, r) {
    let a = n(5, 5, 4, 51),
      s = n(80, 80, 1, 52),
      c = i(22, 53, 0.9);
    for (let n = 0; n < 65536; n++) {
      let i = c.f2[n] - c.f1[n];
      ((e[n] = 0.5 + (a[n] - 0.5) * 0.35 + (s[n] - 0.5) * 0.12),
        (t[n] = (1 - o(0.5, 1.6, i)) * 0.35),
        (r[n] = o(0.7, 0.85, a[n]) * 0.3));
    }
  }
  function p(e, t, r) {
    let i = n(28, 4, 2, 61),
      a = n(60, 7, 2, 62),
      s = n(4, 4, 3, 63);
    for (let n = 0; n < 65536; n++) {
      let c = i[n] * 0.65 + a[n] * 0.35;
      ((e[n] = 0.5 + (c - 0.5) * 0.9 + (s[n] - 0.5) * 0.2),
        (t[n] = o(0.42, 0.28, c) * 0.8),
        (r[n] = o(0.62, 0.78, c) * 0.7));
    }
  }
  function m(e, t, r) {
    let a = n(3, 6, 3, 71),
      s = n(90, 6, 1, 72),
      c = i(3, 73, 0.6);
    for (let n = 0; n < 256; n++)
      for (let i = 0; i < 256; i++) {
        let l = i + n * 256,
          u = i / 256 + (a[l] - 0.5) * 0.12 + (6 / (c.f1[l] + 12)) * 0.2,
          d = Math.sin(u * Math.PI * 2 * 9) * 0.5 + 0.5;
        ((e[l] = 0.5 + (d - 0.5) * 0.3 + (s[l] - 0.5) * 0.2),
          (t[l] = o(0.85, 0.98, 1 - d) * 0.6 + (1 - o(2, 6, c.f1[l])) * 0.5),
          (r[l] = o(0.8, 0.95, d) * 0.25));
      }
  }
  function h(t, r, i) {
    let s = n(5, 5, 3, 81),
      c = (t, n) =>
        e((((t % 12) + 12) % 12) * 131 + (((n % 12) + 12) % 12) * 977 + 5)(),
      l = (t) => 0.56 + 0.3 * e(((((t % 12) + 12) % 12) + 1) * 7919 + 17)(),
      u = n(3, 3, 3, 85),
      d = n(2, 4, 2, 86),
      f = Math.PI * 2;
    for (let e = 0; e < 256; e++)
      for (let n = 0; n < 256; n++) {
        let p = n + e * 256,
          m = (e / 256) * 12,
          h = (n / 256) * 12,
          g = Math.floor(m),
          _ = -1e9,
          v = 1,
          y = 0.5;
        for (let e = g - 1; e <= g + 1; e++) {
          let t = ((e % 2) + 2) % 2 ? 0.5 : 0,
            n = Math.floor(h - t),
            r = l(e);
          for (let i = n - 1; i <= n + 1; i++) {
            let n = h - (i + 0.5 + t),
              a = (m - (e + 0.95)) * 1.05,
              o = Math.sqrt(n * n + a * a) / r;
            o < 1 &&
              (e > _ || (e === _ && o < v)) &&
              ((_ = e), (v = o), (y = c(i, e)));
          }
        }
        let b = 1 - o(0.15, 1, v),
          x = o(0.72, 0.98, v),
          S = n / 256,
          C = e / 256,
          w = Math.sin(f * (2 * S + C) + (u[p] - 0.5) * 3.4),
          T = Math.sin(f * (S - 2 * C) + (d[p] - 0.5) * 3 + 1.7),
          E = Math.max(
            (1 - o(0, 0.17, Math.abs(w))) * 0.9,
            (1 - o(0, 0.13, Math.abs(T))) * 0.7,
          ),
          D = (1 - o(0, 0.17, Math.abs(w + 0.2))) * a(1 - E) * 0.55;
        ((t[p] =
          0.5 +
          (b - 0.5) * 0.38 +
          (y - 0.5) * 0.24 +
          (s[p] - 0.5) * 0.15 -
          E * 0.14),
          (r[p] = Math.min(1, x * 0.85 + E * 0.7)),
          (i[p] = o(0.55, 0.95, b) * 0.4 + D * 0.6));
      }
  }
  function g(e, t, r) {
    let i = n(4, 2, 3, 91),
      a = n(34, 34, 1, 92),
      s = n(4, 4, 3, 93),
      c = n(3, 11, 2, 94);
    for (let n = 0; n < 256; n++)
      for (let l = 0; l < 256; l++) {
        let u = l + n * 256,
          d = ((n / 256 + (i[u] - 0.5) * 0.09 + (c[u] - 0.5) * 0.02) * 3.5) % 1,
          f = 1 - o(0, 0.16, Math.min(d, 1 - d) * 2),
          p = o(0.06, 0.3, d) * (1 - o(0.5, 0.95, d)),
          m = (1 - o(0, 0.1, Math.abs(c[u] - 0.5))) * 0.55;
        ((e[u] =
          0.5 +
          (p - 0.4) * 0.42 +
          (s[u] - 0.5) * 0.36 -
          f * 0.2 +
          (a[u] - 0.5) * 0.12),
          (t[u] = Math.min(1, f * 0.9 + m * 0.5 + o(0.8, 0.92, a[u]) * 0.22)),
          (r[u] =
            o(0.1, 0.4, d) * (1 - o(0.35, 0.6, d)) * 0.65 +
            o(0.8, 0.95, s[u]) * 0.2));
      }
  }
  function _(e, t, r) {
    let i = n(6, 6, 2, 101),
      s = n(80, 6, 1, 102);
    for (let n = 0; n < 256; n++)
      for (let c = 0; c < 256; c++) {
        let l = c + n * 256,
          u = (n / 256) * 8,
          d = Math.floor(u),
          f = d % 2 ? 0.5 : 0,
          p = (c / 256) * 8 + f,
          m = p - Math.floor(p) - 0.5,
          h = u - d,
          g = h - (1 - Math.sqrt(Math.max(0, 0.25 - m * m)) * 1.6),
          _ = o(0, -0.08, g),
          v = a(h);
        ((e[l] =
          0.5 +
          (v - 0.5) * 0.45 * _ +
          (s[l] - 0.5) * 0.18 +
          (i[l] - 0.5) * 0.16),
          (t[l] =
            (1 - o(0, 0.07, Math.abs(g))) * 0.85 +
            (1 - o(0, 0.035, Math.abs(m))) * 0.35 * _),
          (r[l] = o(0.55, 0.95, v) * _ * 0.45));
      }
  }
  function v(e, t, r) {
    let a = n(3, 5, 3, 113),
      c = n(7, 30, 2, 114),
      l = n(3, 3, 3, 115),
      u = i(6, 111, 0.98),
      d = i(15, 112, 0.92);
    for (let n = 0; n < 256; n++)
      for (let i = 0; i < 256; i++) {
        let f = i + n * 256,
          p = i / 256 + (a[f] - 0.5) * 0.22,
          m = Math.sin(p * Math.PI * 2 * 5 + (c[f] - 0.5) * 1.2),
          h = i + (a[f] - 0.5) * 26,
          g = n + (l[f] - 0.5) * 26,
          _ = 1 - o(0.8, 3.6, s(u.f2, h, g) - s(u.f1, h, g)),
          v = (1 - o(0.4, 1.8, s(d.f2, h, g) - s(d.f1, h, g))) * 0.5;
        ((e[f] = 0.5 + m * 0.2 + (l[f] - 0.5) * 0.5 - _ * 0.12),
          (t[f] = Math.min(1, _ * 0.8 + v + o(0.9, 1, -m) * 0.4)),
          (r[f] = o(0.55, 0.95, m) * 0.5 + o(0.7, 0.9, l[f]) * 0.25));
      }
  }
  function y(e, t, r) {
    let i = n(6, 2, 2, 121),
      a = n(20, 60, 1, 122),
      s = n(3, 5, 3, 123);
    for (let n = 0; n < 256; n++)
      for (let c = 0; c < 256; c++) {
        let l = c + n * 256,
          u = n / 256 + (i[l] - 0.5) * 0.07,
          d = Math.sin(u * Math.PI * 2 * 4) * 0.5 + 0.5;
        ((e[l] = 0.5 + (d - 0.5) * 0.28 + (s[l] - 0.5) * 0.4),
          (t[l] = o(0.8, 0.97, 1 - d) * 0.5 + o(0.82, 0.93, a[l]) * 0.25),
          (r[l] = o(0.6, 0.9, d) * 0.35));
      }
  }
  function b(e, t, r) {
    let a = n(4, 4, 4, 131),
      s = i(5, 132, 1),
      c = n(90, 90, 1, 133);
    for (let n = 0; n < 65536; n++) {
      let i = s.f2[n] - s.f1[n];
      ((e[n] = 0.5 + (a[n] - 0.5) * 0.7),
        (t[n] = (1 - o(0.6, 2.2, i)) * 0.7),
        (r[n] = o(0.86, 0.95, c[n]) * 0.9));
    }
  }
  function x(e, t, r) {
    let a = n(4, 4, 4, 151),
      s = n(7, 7, 3, 152),
      c = i(18, 153, 0.9);
    for (let n = 0; n < 65536; n++) {
      let i = 1 - o(2, 5.5, c.f1[n]);
      ((e[n] = 0.5 + (a[n] - 0.5) * 0.3 + i * 0.12),
        (t[n] = o(0.6, 0.68, s[n]) * 0.8),
        (r[n] = o(0.6, 0.95, i) * 0.7));
    }
  }
  function S(e, t, r) {
    let i = n(3, 3, 4, 161),
      a = n(9, 5, 3, 162);
    for (let n = 0; n < 65536; n++)
      ((e[n] = 0.5 + (i[n] - 0.5) * 0.8),
        (t[n] = o(0.62, 0.78, a[n]) * 0.3),
        (r[n] = o(0.62, 0.8, i[n]) * 0.5));
  }
  function C(e, t, r) {
    let i = n(4, 4, 3, 185),
      c = n(4, 4, 3, 186),
      l = n(7, 7, 3, 181),
      u = n(64, 64, 2, 183),
      d = n(3, 3, 3, 184);
    for (let n = 0; n < 256; n++)
      for (let f = 0; f < 256; f++) {
        let p = f + n * 256,
          m = f + (i[p] - 0.5) * 50,
          h = n + (c[p] - 0.5) * 50,
          g = s(l, m, h),
          _ = o(0.38, 0.7, g),
          v = s(l, m, h - 6),
          y = a((g - v) * 7 + 0.5);
        ((e[p] =
          0.5 + (_ - 0.5) * 0.42 + (u[p] - 0.5) * 0.24 + (d[p] - 0.5) * 0.3),
          (t[p] =
            (1 - o(0.22, 0.46, g)) * 0.5 + o(0.68, 0.82, 1 - u[p]) * 0.12),
          (r[p] = _ * y * 0.6 + o(0.72, 0.86, u[p]) * 0.25));
      }
  }
  function w(e, t, r) {
    let c = n(4, 4, 4, 141),
      l = n(18, 5, 2, 144),
      u = n(5, 18, 2, 145),
      d = n(26, 26, 1, 142),
      f = n(10, 10, 2, 143),
      p = n(6, 6, 2, 147),
      m = i(5, 146, 0.95);
    for (let n = 0; n < 256; n++)
      for (let i = 0; i < 256; i++) {
        let h = i + n * 256,
          g = i + (p[h] - 0.5) * 22,
          _ = n + (p[h] - 0.5) * 22,
          v = s(m.f2, g, _) - s(m.f1, g, _),
          y = (1 - o(2, 9, v)) * o(0.34, 0.66, f[h]),
          b = s(m.f2, g, _ - 7) - s(m.f1, g, _ - 7),
          x = a(1 - o(2, 9, b) - y) * 0.8,
          S = o(0.72, 0.9, d[h]);
        ((e[h] =
          0.5 +
          (c[h] - 0.5) * 0.85 +
          (f[h] - 0.5) * 0.3 +
          ((l[h] + u[h]) * 0.5 - 0.5) * 0.4 -
          y * 0.14 +
          x * 0.16),
          (t[h] = Math.min(1, S * 0.38 + y * 0.7)),
          (r[h] =
            o(0.6, 0.82, c[h]) * 0.5 + x * 0.55 + o(0.7, 0.85, l[h]) * 0.2));
      }
  }
  let T = [c, l, u, d, f, p, m, h, g, _, v, y, b, w, x, S, C];
  function E(e = 512) {
    let t = new Uint8Array(e * e * 4),
      n = i(6, 171, 1, e),
      a = i(13, 176, 1, e),
      o = i(26, 172, 0.98, e),
      s = /* @__PURE__ */ new Float32Array(64),
      c = /* @__PURE__ */ new Float32Array(64),
      l = /* @__PURE__ */ new Float32Array(64),
      u = /* @__PURE__ */ new Float32Array(64);
    for (let e = 0; e < s.length; e++)
      ((s[e] = r(e * 4 + 173)),
        (c[e] = r(e * 4 + 1 + 173)),
        (l[e] = r(e * 4 + 2 + 173)),
        (u[e] = r(e * 4 + 3 + 173)));
    let d = /* @__PURE__ */ new Float32Array(9),
      f = /* @__PURE__ */ new Float32Array(9),
      p = /* @__PURE__ */ new Float32Array(9);
    for (let e = 0; e < d.length; e++)
      ((d[e] = r(e * 3 + 991)),
        (f[e] = r(e * 3 + 1 + 991)),
        (p[e] = r(e * 3 + 2 + 991)));
    let m = (e, t, n, r) => {
      let i = n * t,
        a = r * t,
        o = Math.floor(i),
        s = Math.floor(a),
        c = i - o,
        l = a - s,
        u = c * c * (3 - 2 * c),
        d = l * l * (3 - 2 * l),
        f = ((o % t) + t) % t,
        p = (f + 1) % t,
        m = ((s % t) + t) % t,
        h = (m + 1) % t;
      return (
        (e[f + m * t] * (1 - u) + e[p + m * t] * u) * (1 - d) +
        (e[f + h * t] * (1 - u) + e[p + h * t] * u) * d
      );
    };
    for (let r = 0; r < e; r++)
      for (let i = 0; i < e; i++) {
        let h = i / e,
          g = r / e,
          _ = i + (m(d, 3, h, g) - 0.5) * 92 + (m(s, 8, h, g) - 0.5) * 26,
          v = r + (m(f, 3, h, g) - 0.5) * 92 + (m(c, 8, h, g) - 0.5) * 26,
          y =
            (((Math.round(_) % e) + e) % e) +
            (((Math.round(v) % e) + e) % e) * e,
          b = m(p, 3, h, g),
          x =
            ((n.f2[y] - n.f1[y]) / n.cs) *
            (0.62 + 0.85 * n.id[y]) *
            (0.78 + 0.55 * b),
          S =
            ((a.f2[y] - a.f1[y]) / a.cs) *
            (0.62 + 0.85 * a.id[y]) *
            (1.35 - 0.55 * b),
          C = (o.f2[y] - o.f1[y]) / o.cs,
          w = Math.abs(m(u, 8, h * 2, g * 2) - 0.5) * 2,
          T = Math.min(x, S) + Math.max(0, w - 0.42) * 0.62,
          E = (i + r * e) * 4;
        ((t[E] = Math.min(255, T * 2 * 255)),
          (t[E + 1] = Math.min(
            255,
            (m(l, 8, h, g) * 0.7 + m(c, 8, h + 0.37, g + 0.61) * 0.3) * 255,
          )),
          (t[E + 2] = Math.min(255, C * 2 * 255)),
          (t[E + 3] = 255));
      }
    return t;
  }
  function D() {
    let e = T.length,
      t = new Uint8Array(262144 * e),
      n = /* @__PURE__ */ new Float32Array(65536),
      r = /* @__PURE__ */ new Float32Array(65536),
      i = /* @__PURE__ */ new Float32Array(65536);
    for (let o = 0; o < e; o++) {
      (n.fill(0.5), r.fill(0), i.fill(0), T[o](n, r, i));
      let e = o * 256 * 256 * 4;
      for (let o = 0; o < 65536; o++) {
        let s = e + o * 4;
        ((t[s] = a(n[o]) * 255),
          (t[s + 1] = a(r[o]) * 255),
          (t[s + 2] = a(i[o]) * 255),
          (t[s + 3] = 255));
      }
    }
    return { data: t, layers: e, size: 256 };
  }
  self.onmessage = () => {
    try {
      let e = performance.now(),
        t = D(),
        n = E(512);
      self.postMessage(
        {
          ok: !0,
          detail: t.data,
          layers: t.layers,
          size: t.size,
          veins: n,
          veinSize: 512,
          ms: performance.now() - e,
        },
        [t.data.buffer, n.buffer],
      );
    } catch (e) {
      self.postMessage({ ok: !1, error: String((e && e.stack) || e) });
    }
  };
})();
