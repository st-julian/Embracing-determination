// Small deterministic math helpers for the sprite rig (no dependencies).
// Affine matrices are row-major Float64Array(12): [m00 m01 m02 tx | m10 m11 m12 ty | m20 m21 m22 tz]

export const DEG = Math.PI / 180;
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
export const TAU = Math.PI * 2;

export function mIdent() { return new Float64Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0]); }
export function mMul(a, b) {
  const r = new Float64Array(12);
  for (let i = 0; i < 3; i++) {
    const a0 = a[i * 4], a1 = a[i * 4 + 1], a2 = a[i * 4 + 2], a3 = a[i * 4 + 3];
    r[i * 4] = a0 * b[0] + a1 * b[4] + a2 * b[8];
    r[i * 4 + 1] = a0 * b[1] + a1 * b[5] + a2 * b[9];
    r[i * 4 + 2] = a0 * b[2] + a1 * b[6] + a2 * b[10];
    r[i * 4 + 3] = a0 * b[3] + a1 * b[7] + a2 * b[11] + a3;
  }
  return r;
}
export function mTrans(x, y, z) { return new Float64Array([1, 0, 0, x, 0, 1, 0, y, 0, 0, 1, z]); }
export function mScale(x, y = x, z = x) { return new Float64Array([x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0]); }
export function mRotX(a) { const c = Math.cos(a), s = Math.sin(a); return new Float64Array([1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0]); }
export function mRotY(a) { const c = Math.cos(a), s = Math.sin(a); return new Float64Array([c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0]); }
export function mRotZ(a) { const c = Math.cos(a), s = Math.sin(a); return new Float64Array([c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0]); }
export function mApply(m, p) {
  const x = p[0], y = p[1], z = p[2];
  return [m[0] * x + m[1] * y + m[2] * z + m[3], m[4] * x + m[5] * y + m[6] * z + m[7], m[8] * x + m[9] * y + m[10] * z + m[11]];
}
export function mApplyV(m, p) {
  const x = p[0], y = p[1], z = p[2];
  return [m[0] * x + m[1] * y + m[2] * z, m[4] * x + m[5] * y + m[6] * z, m[8] * x + m[9] * y + m[10] * z];
}
// 3x3 linear part as flat [9]
export function lin3(m) { return [m[0], m[1], m[2], m[4], m[5], m[6], m[8], m[9], m[10]]; }
export function mul33(a, b) {
  const r = new Array(9);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) r[i * 3 + j] = a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j];
  return r;
}
export function inv33(m) {
  const [a, b, c, d, e, f, g, h, i] = m;
  const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g;
  const det = a * A + b * B + c * C;
  const id = 1 / (det || 1e-9);
  return [A * id, -(b * i - c * h) * id, (b * f - c * e) * id,
    B * id, (a * i - c * g) * id, -(a * f - c * d) * id,
    C * id, -(a * h - b * g) * id, (a * e - b * d) * id];
}
export function euler33(rx = 0, ry = 0, rz = 0) {
  // R = Ry * Rx * Rz  (yaw, then pitch, then roll in local)
  const cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry), cz = Math.cos(rz), sz = Math.sin(rz);
  const Rx = [1, 0, 0, 0, cx, -sx, 0, sx, cx];
  const Ry = [cy, 0, sy, 0, 1, 0, -sy, 0, cy];
  const Rz = [cz, -sz, 0, sz, cz, 0, 0, 0, 1];
  return mul33(Ry, mul33(Rx, Rz));
}
export const v3 = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
  lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  len: (a) => Math.hypot(a[0], a[1], a[2]),
  norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
};

// Catmull-Rom through points (arrays of equal length, e.g. [x,y,z,r]); returns samples
export function catmull(pts, samplesPerSeg) {
  const out = [];
  const n = pts.length;
  if (n < 2) return pts.slice();
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
    const S = Array.isArray(samplesPerSeg) ? samplesPerSeg[i] : samplesPerSeg;
    for (let s = 0; s < S; s++) {
      const t = s / S, t2 = t * t, t3 = t2 * t;
      const o = new Array(p1.length);
      for (let k = 0; k < p1.length; k++) {
        o[k] = 0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
      }
      out.push(o);
    }
  }
  out.push(pts[n - 1].slice());
  return out;
}

// quadratic / cubic bezier in 2D helper -> polygon points
export function bez2(p0, p1, p2, n) { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c = t * t; o.push([a * p0[0] + b * p1[0] + c * p2[0], a * p0[1] + b * p1[1] + c * p2[1]]); } return o; }
export function bez3(p0, p1, p2, p3, n) { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t; o.push([a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]]); } return o; }

// deterministic hash noise
export function hash(n) { let x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
export function hash2(a, b) { return hash(a * 57.31 + b * 113.97); }
export function noise1(x) { const i = Math.floor(x), f = x - i; const u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u); }

export const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);
