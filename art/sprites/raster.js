// Tiny z-buffered "3D -> pixel art" rasteriser.
// Primitives (ellipsoids, sphere-swept tubes, polygon cards, screen-space 2D shapes) are
// submitted through a matrix stack; each pixel stores depth, material, a lighting value and a
// group id. finish() then quantises lighting into hand-picked palette ramps, adds screen-space
// cast shadows, depth-discontinuity inner lines, a clean 1px coloured outline (selout) and
// pixel-precise decals (eyes, mouths), returning an indexed image + palette.
import { mIdent, mMul, mTrans, mRotX, mRotY, mRotZ, mScale, mApply, mApplyV, lin3, mul33, inv33, euler33, catmull, BAYER4, DEG, v3 } from './math.js';
import { makeRamp, mix } from './color.js';

const LIGHT = v3.norm([-0.45, 0.7, 0.55]);
const TH_EM = [0.1, 0.3, 0.55, 0.8], TH_LIT = [-0.38, 0.08, 0.6, 0.88];

export function compileMats(defs) {
  const list = [null];
  const byName = {};
  const palette = new Array(8).fill(null);
  for (const name of Object.keys(defs)) {
    const d = typeof defs[name] === 'string' ? { c: defs[name] } : defs[name];
    const id = list.length;
    const r = makeRamp(d.c || d.ramp[2], d);
    const ramp = d.ramp || r.ramp;
    const outline = d.outline || r.outline;
    const line = d.lineCol || r.line;
    const m = { name, id, ...d, ramp, outline, line };
    list.push(m);
    byName[name] = id;
    palette.push(ramp[0], ramp[1], ramp[2], ramp[3], ramp[4], outline, line, d.litOutline || mix(outline, line, 0.3));
  }
  if (list.length > 31) throw new Error('too many materials');
  return { list, byName, palette, defs };
}

// scratch for _poly (distance transform mask + scanline crossings), grown on demand, reused across calls
let POLY_D = new Float32Array(1 << 14);
const POLY_XS = [];
// buffer pool (rendering is synchronous, one live scene per size at a time)
const POOL = new Map();
function getBufs(N) {
  let b = POOL.get(N);
  if (!b || b.busy) {
    b = { z: new Float32Array(N), mat: new Uint8Array(N), shade: new Float32Array(N), grp: new Uint8Array(N), nx: new Float32Array(N), ny: new Float32Array(N), bi: new Float32Array(N), dec: new Uint8Array(N), sh: new Float32Array(N), tone: new Int8Array(N), isLine: new Uint8Array(N), idx: new Uint8Array(N), busy: false };
    if (!POOL.get(N)) POOL.set(N, b);
  }
  b.busy = true;
  return b;
}

export class Scene {
  constructor(o) {
    this.w = o.w; this.h = o.h;
    this.ax = o.ax ?? o.w / 2; this.ay = o.ay ?? o.h - 4;
    this.S = o.scale ?? 1;
    this.mats = o.mats;
    const N = this.w * this.h;
    const B = getBufs(N);
    this.B = B;
    this.z = B.z.fill(-1e9);
    this.mat = B.mat.fill(0);
    this.shade = B.shade;
    this.grp = B.grp;
    this.nx = B.nx.fill(0);
    this.ny = B.ny.fill(0);
    this.bi = B.bi.fill(0);   // per-pixel shading bias (material patterns, o.bias): kept for in-game dynamic lighting
    this.decals = [];
    this.groups = { _: 0 };
    this.g = 0;
    this.yaw = (o.yaw ?? 0) * DEG; this.pitch = (o.pitch ?? 18) * DEG;
    this.base = mMul(mScale(this.S), mMul(mRotX(this.pitch), mRotY(this.yaw)));
    this.m = this.base;
    this.stack = [];
    this.dither = o.dither ?? 0;
    this.lineThr = o.lineThr ?? 1.6 * Math.max(1, this.S * 0.8);
    this.view = o.view || 'front';
  }
  // ---------- transform stack ----------
  push() { this.stack.push([this.m, this.g]); return this; }
  pop() { const [m, g] = this.stack.pop(); this.m = m; this.g = g; return this; }
  t(x, y, z) { this.m = mMul(this.m, mTrans(x, y, z)); return this; }
  rx(a) { if (a) this.m = mMul(this.m, mRotX(a)); return this; }
  ry(a) { if (a) this.m = mMul(this.m, mRotY(a)); return this; }
  rz(a) { if (a) this.m = mMul(this.m, mRotZ(a)); return this; }
  sc(x, y = x, z = x) { this.m = mMul(this.m, mScale(x, y, z)); return this; }
  group(name) {
    if (!(name in this.groups)) this.groups[name] = Object.keys(this.groups).length;
    this.g = this.groups[name];
    return this.g;
  }
  mid(name) {
    if (typeof name === 'number') return name;
    const id = this.mats.byName[name];
    if (id === undefined) throw new Error('unknown material ' + name);
    return id;
  }
  M(name) { return this.mats.list[this.mid(name)]; }
  proj(p) { const c = mApply(this.m, p); return [this.ax + c[0], this.ay - c[1], c[2]]; }
  // camera-space vector of local direction
  dir(v) { return v3.norm(mApplyV(this.m, v)); }
  facing() { return mApplyV(this.m, [0, 0, 1])[2]; }

  // ---------- ellipsoid ----------
  ell(c, r, mat, o = {}) {
    const rr = typeof r === 'number' ? [r, r, r] : r;
    let L = lin3(this.m);
    if (o.rot) L = mul33(L, euler33(o.rot[0], o.rot[1], o.rot[2]));
    L = mul33(L, [rr[0], 0, 0, 0, rr[1], 0, 0, 0, rr[2]]);
    const cc = mApply(this.m, c);
    this._ellipsoid(cc, L, mat, o);
  }
  sphere(c, r, mat, o) { this.ell(c, r, mat, o); }
  _ellipsoid(cc, L, mat, o) {
    const inv = inv33(L);
    const ex = Math.sqrt(L[0] * L[0] + L[1] * L[1] + L[2] * L[2]);
    const ey = Math.sqrt(L[3] * L[3] + L[4] * L[4] + L[5] * L[5]);
    const sx = this.ax + cc[0], sy = this.ay - cc[1];
    const x0 = Math.max(0, Math.floor(sx - ex - 1)), x1 = Math.min(this.w - 1, Math.ceil(sx + ex + 1));
    const y0 = Math.max(0, Math.floor(sy - ey - 1)), y1 = Math.min(this.h - 1, Math.ceil(sy + ey + 1));
    const k0 = inv[2], k1 = inv[5], k2 = inv[8];
    const A = k0 * k0 + k1 * k1 + k2 * k2;
    const mid = typeof mat === 'function' ? -1 : this.mid(mat);
    const emissive = mid >= 0 && this.mats.list[mid].emissive;
    const bias = o.bias || 0, grp = o.grp ?? this.g, zb = o.zBias || 0;
    const dz = -cc[2];
    const i00 = inv[0], i03 = inv[3], i06 = inv[6];
    for (let py = y0; py <= y1; py++) {
      const Y = this.ay - (py + 0.5);
      const dy = Y - cc[1];
      // q0(dx) = u + dx * col0 ; discriminant D(dx) is quadratic -> solve x-interval for this row
      const u0 = inv[1] * dy + inv[2] * dz, u1 = inv[4] * dy + inv[5] * dz, u2 = inv[7] * dy + inv[8] * dz;
      const uk = u0 * k0 + u1 * k1 + u2 * k2, ck = i00 * k0 + i03 * k1 + i06 * k2;
      const uu = u0 * u0 + u1 * u1 + u2 * u2, uc = u0 * i00 + u1 * i03 + u2 * i06, cc2 = i00 * i00 + i03 * i03 + i06 * i06;
      // D/4 = (q0.k)^2 - A (q0.q0 - 1)
      const qa = ck * ck - A * cc2, qb = 2 * (uk * ck - A * uc), qc = uk * uk - A * (uu - 1);
      let xa = x0, xb = x1;
      if (Math.abs(qa) > 1e-12) {
        const disc = qb * qb - 4 * qa * qc;
        if (disc < 0) { if (qa < 0) continue; } else {
          const sq = Math.sqrt(disc);
          let r1 = (-qb - sq) / (2 * qa), r2 = (-qb + sq) / (2 * qa);
          if (r1 > r2) { const tt = r1; r1 = r2; r2 = tt; }
          if (qa < 0) {
            xa = Math.max(x0, Math.floor(this.ax + cc[0] + r1 - 0.5) - 1);
            xb = Math.min(x1, Math.ceil(this.ax + cc[0] + r2 - 0.5) + 1);
            if (xb < xa) continue;
          }
        }
      }
      for (let px = xa; px <= xb; px++) {
        const X = px + 0.5 - this.ax;
        const dx = X - cc[0];
        const q0 = inv[0] * dx + inv[1] * dy + inv[2] * dz;
        const q1 = inv[3] * dx + inv[4] * dy + inv[5] * dz;
        const q2 = inv[6] * dx + inv[7] * dy + inv[8] * dz;
        const B = 2 * (q0 * k0 + q1 * k1 + q2 * k2);
        const C = q0 * q0 + q1 * q1 + q2 * q2 - 1;
        const D = B * B - 4 * A * C;
        if (D < 0) continue;
        const zt = (-B + Math.sqrt(D)) / (2 * A);
        const i = py * this.w + px;
        if (zt + zb <= this.z[i]) continue;
        const a = q0 + zt * k0, b = q1 + zt * k1, c = q2 + zt * k2;
        let m = mid;
        let lb = 0;
        if (m < 0) {
          const r = mat(a, b, c);
          if (r == null) continue;
          if (Array.isArray(r)) { m = this.mid(r[0]); lb = r[1]; } else m = this.mid(r);
        }
        // normal = inv^T * q
        let nx = inv[0] * a + inv[3] * b + inv[6] * c;
        let ny = inv[1] * a + inv[4] * b + inv[7] * c;
        let nz = inv[2] * a + inv[5] * b + inv[8] * c;
        const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
        this.z[i] = zt + zb;
        this.mat[i] = m;
        this.grp[i] = grp;
        this.nx[i] = nx; this.ny[i] = ny;
        const em = this.mats.list[m].emissive;
        this.shade[i] = (em ? (o.heat ? o.heat(a, b, c, nz) : nz) : nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]) + bias + lb;
        this.bi[i] = em ? 0 : bias + lb;
      }
    }
  }
  // ---------- tubes (sphere sweep) ----------
  // pts: [[x,y,z,r], ...] local. o.n = samples per segment (auto if omitted)
  tube(pts, mat, o = {}) {
    let samples;
    if (pts.length === 2 && !o.n) {
      const [a, b] = pts;
      const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) * this.S;
      const rmin = Math.max(0.6, Math.min(a[3], b[3]) * this.S);
      const n = Math.max(2, Math.ceil(len / (rmin * 0.6)));
      samples = [];
      for (let i = 0; i <= n; i++) samples.push(a.map((v, k) => v + (b[k] - v) * i / n));
    } else {
      const segs = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) * this.S;
        const rmin = Math.max(0.6, Math.min(a[3], b[3]) * this.S);
        segs.push(o.n || Math.max(2, Math.ceil(len / (rmin * 0.6))));
      }
      samples = catmull(pts, segs);
    }
    const tl = samples.length;
    // secondary motion: tails (group 'tail', multi-point tubes) get a travelling wave that lags behind the root,
    // giving overlap/follow-through on top of the species' own sway
    const P = this.P;
    if (P && pts.length > 2 && this.g === this.groups.tail && !o.noWave) {
      let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]);
      const amp = L * (P.gait >= 0 ? 0.16 : 0.1) * (P.faint ? 0.2 : 1), sp = P.gait >= 0 ? 2 : 1;
      samples.forEach((p, i) => { const f = i / (tl - 1); p[0] += amp * Math.pow(f, 1.6) * Math.sin((P.t * sp - f * 0.38) * Math.PI * 2); });
    }
    samples.forEach((p, i) => {
      const oo = o.heatAlong || o.matAlong ? { ...o } : o;
      let m = mat;
      if (o.matAlong) m = o.matAlong(i / (tl - 1));
      if (o.flat) this.ell([p[0], p[1], p[2]], [p[3], p[3] * o.flat, p[3]], m, oo);
      else this.ell([p[0], p[1], p[2]], p[3], m, oo);
    });
  }
  // ---------- polygon cards in 3D ----------
  // origin, u, v: local 3D; poly: [[pu,pv],...] in (u,v) units
  card(origin, u, v, poly, mat, o = {}) {
    const P0 = mApply(this.m, origin);
    const U = mApplyV(this.m, u), V = mApplyV(this.m, v);
    let n = v3.cross(U, V);
    const front = n[2] >= 0;
    n = v3.norm(n);
    if (!front) n = [-n[0], -n[1], -n[2]];
    const pts = poly.map(([a, b]) => [this.ax + P0[0] + U[0] * a + V[0] * b, this.ay - (P0[1] + U[1] * a + V[1] * b)]);
    // plane depth: z = P0z + Uz*a + Vz*b ; solve (a,b) from screen
    const det = U[0] * V[1] - U[1] * V[0];
    if (Math.abs(det) < 1e-4) return; // edge-on
    const toUV = (X, Y) => { const dx = X - P0[0], dy = Y - P0[1]; return [(dx * V[1] - dy * V[0]) / det, (U[0] * dy - U[1] * dx) / det]; };
    const zAt = (X, Y) => { const [a, b] = toUV(X, Y); return P0[2] + U[2] * a + V[2] * b; };
    const m = front ? mat : (o.backMat || mat);
    this._poly(pts, zAt, n, m, { ...o, toUV });
  }
  // screen space polygon at fixed depth (pixels). pts in screen coords
  poly2(pts, z, mat, o = {}) {
    this._poly(pts, () => z, [0, 0, 1], mat, o);
  }
  disc2(x, y, r, z, mat, o = {}) {
    const pts = []; const n = Math.max(8, Math.ceil(r * 4));
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r * (o.sy || 1)]); }
    this._poly(pts, () => z, [0, 0, 1], mat, o);
  }
  // thick polyline in screen space; pts: [[x,y,r],...]
  stroke2(pts, z, mat, o = {}) {
    const x0 = Math.max(0, Math.floor(Math.min(...pts.map(p => p[0] - p[2])) - 1));
    const x1 = Math.min(this.w - 1, Math.ceil(Math.max(...pts.map(p => p[0] + p[2])) + 1));
    const y0 = Math.max(0, Math.floor(Math.min(...pts.map(p => p[1] - p[2])) - 1));
    const y1 = Math.min(this.h - 1, Math.ceil(Math.max(...pts.map(p => p[1] + p[2])) + 1));
    const mid = this.mid(mat); const grp = o.grp ?? this.g;
    for (let py = y0; py <= y1; py++) for (let px = x0; px <= x1; px++) {
      const X = px + 0.5, Y = py + 0.5;
      let best = -1;
      for (let k = 0; k < pts.length - 1; k++) {
        const a = pts[k], b = pts[k + 1];
        const dx = b[0] - a[0], dy = b[1] - a[1];
        const L2 = dx * dx + dy * dy || 1e-6;
        let t = ((X - a[0]) * dx + (Y - a[1]) * dy) / L2; t = t < 0 ? 0 : t > 1 ? 1 : t;
        const r = a[2] + (b[2] - a[2]) * t;
        const d = Math.hypot(X - a[0] - dx * t, Y - a[1] - dy * t);
        if (d <= r) { const h = 1 - d / Math.max(r, 0.5); if (h > best) best = h; }
      }
      if (best < 0) continue;
      const i = py * this.w + px;
      if (z <= this.z[i]) continue;
      this.z[i] = z; this.mat[i] = mid; this.grp[i] = grp; this.nx[i] = 0; this.ny[i] = 0; this.bi[i] = 0;
      this.shade[i] = this.mats.list[mid].emissive ? best : (o.shade ?? 0.3);
    }
  }
  _poly(pts, zAt, n, mat, o) {
    let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    for (const p of pts) { if (p[0] < minX) minX = p[0]; if (p[0] > maxX) maxX = p[0]; if (p[1] < minY) minY = p[1]; if (p[1] > maxY) maxY = p[1]; }
    const x0 = Math.max(0, Math.floor(minX)), x1 = Math.min(this.w - 1, Math.ceil(maxX));
    const y0 = Math.max(0, Math.floor(minY)), y1 = Math.min(this.h - 1, Math.ceil(maxY));
    if (x1 < x0 || y1 < y0) return;
    // scanline fill into a padded mask, then chamfer distance transform (distance to edge)
    const W = x1 - x0 + 3, H = y1 - y0 + 3;
    if (POLY_D.length < W * H) { let n = POLY_D.length; while (n < W * H) n *= 2; POLY_D = new Float32Array(n); }
    const d = POLY_D; d.fill(0, 0, W * H);
    const np = pts.length;
    const xs = POLY_XS;
    let any = false;
    for (let py = y0; py <= y1; py++) {
      const Y = py + 0.5;
      xs.length = 0;
      for (let a = 0, b = np - 1; a < np; b = a++) {
        const ya = pts[a][1], yb = pts[b][1];
        if ((ya > Y) !== (yb > Y)) xs.push((pts[b][0] - pts[a][0]) * (Y - ya) / (yb - ya) + pts[a][0]);
      }
      if (xs.length < 2) continue;
      xs.sort((p, q) => p - q);
      const row = (py - y0 + 1) * W;
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const xa = Math.max(x0, Math.ceil(xs[k] - 0.5)), xb = Math.min(x1, Math.floor(xs[k + 1] - 0.5));
        for (let px = xa; px <= xb; px++) { d[row + px - x0 + 1] = 1e6; any = true; }
      }
    }
    if (!any) return;
    const D = 1.4142;
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      if (!d[i]) continue;
      let v = d[i];
      const a = d[i - 1] + 1, b = d[i - W] + 1, c = d[i - W - 1] + D, e = d[i - W + 1] + D;
      if (a < v) v = a; if (b < v) v = b; if (c < v) v = c; if (e < v) v = e;
      d[i] = v;
    }
    let dmax = 0.001;
    for (let y = H - 2; y >= 1; y--) for (let x = W - 2; x >= 1; x--) {
      const i = y * W + x;
      if (!d[i]) continue;
      let v = d[i];
      const a = d[i + 1] + 1, b = d[i + W] + 1, c = d[i + W + 1] + D, e = d[i + W - 1] + D;
      if (a < v) v = a; if (b < v) v = b; if (c < v) v = c; if (e < v) v = e;
      d[i] = v;
      if (v > dmax) dmax = v;
    }
    dmax -= 0.5;
    const fn = typeof mat === 'function' ? mat : null;
    const mid0 = fn ? -1 : this.mid(mat);
    const bulge = o.bulge ?? 0.9;
    const grp = o.grp ?? this.g;
    const dref = o.dref || Math.max(0.5, dmax);
    const zb = o.zBias || 0;
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const k = y * W + x;
      if (!d[k]) continue;
      const px = x - 1 + x0, py = y - 1 + y0;
      const dist = d[k] - 0.5;
      const X = px + 0.5 - this.ax, Y = this.ay - (py + 0.5);
      const i = py * this.w + px;
      const z = zAt(X, Y) + zb + (o.dome ? o.dome * Math.sqrt(Math.min(1, dist / dref)) : 0);
      if (z <= this.z[i]) continue;
      let m = mid0, lb = 0;
      if (fn) {
        const uv = o.toUV ? o.toUV(X, Y) : [X, Y];
        const r = fn(uv[0], uv[1], dist / dref);
        if (r == null) continue;
        if (Array.isArray(r)) { m = this.mid(r[0]); lb = r[1]; } else m = this.mid(r);
      }
      const M = this.mats.list[m];
      this.z[i] = z; this.mat[i] = m; this.grp[i] = grp;
      if (M.emissive) {
        this.shade[i] = (o.heatFn ? o.heatFn(Math.min(1, dist / dref), X, Y) : Math.min(1, dist / dref)) + lb;
        this.bi[i] = 0;
      } else {
        // outward direction = negative distance gradient (screen) -> camera space (y up)
        let gx = -(d[k + 1] - d[k - 1]), gy = (d[k + W] - d[k - W]);
        const gl = Math.hypot(gx, gy) || 1; gx /= gl; gy /= gl;
        const f = bulge * Math.max(0, 1 - dist / Math.max(1.2, dref * 0.9));
        let nx = n[0] + gx * f, ny = n[1] + gy * f, nz = n[2];
        const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
        this.nx[i] = nx; this.ny[i] = ny;
        this.shade[i] = nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2] + (o.bias || 0) + lb;
        this.bi[i] = (o.bias || 0) + lb;
      }
    }
  }
  // ---------- decals (applied after tone mapping) ----------
  // pix: [[x,y,mat,tone],...] in screen coords; host group / depth test optional
  decal(pix, o = {}) { this.decals.push({ pix, ...o }); }

  // ---------- finish ----------
  finish(o = {}) {
    const { w, h } = this;
    const N = w * h, mat = this.mat, z = this.z, shade = this.shade, grp = this.grp;
    const L = this.mats.list;
    let X0 = w, X1 = -1, Y0 = h, Y1 = -1;
    for (let y = 0; y < h; y++) { const r = y * w; for (let x = 0; x < w; x++) if (mat[r + x]) { if (x < X0) X0 = x; if (x > X1) X1 = x; if (y < Y0) Y0 = y; Y1 = y; } }
    if (X1 < 0) { X0 = 0; X1 = 0; Y0 = 0; Y1 = 0; }
    X0 = Math.max(0, X0 - 2); Y0 = Math.max(0, Y0 - 2); X1 = Math.min(w - 1, X1 + 2); Y1 = Math.min(h - 1, Y1 + 2);
    const B = this.B;
    // 1) cleanup: isolated pixels + pinholes
    for (let pass = 0; pass < 2; pass++) {
      for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) {
        const i = y * w + x;
        const l = x > 0 ? mat[i - 1] : 0, r = x < w - 1 ? mat[i + 1] : 0, u = y > 0 ? mat[i - w] : 0, d = y < h - 1 ? mat[i + w] : 0;
        const c4 = (l ? 1 : 0) + (r ? 1 : 0) + (u ? 1 : 0) + (d ? 1 : 0);
        if (mat[i]) {
          if (c4 === 0 && !L[mat[i]].keepSingle) { mat[i] = 0; z[i] = -1e9; }
        } else if (c4 >= 3) {
          let bj = -1, bz = -1e9;
          if (l && z[i - 1] > bz) { bz = z[i - 1]; bj = i - 1; }
          if (r && z[i + 1] > bz) { bz = z[i + 1]; bj = i + 1; }
          if (u && z[i - w] > bz) { bz = z[i - w]; bj = i - w; }
          if (d && z[i + w] > bz) { bz = z[i + w]; bj = i + w; }
          if (bj >= 0) { mat[i] = mat[bj]; z[i] = z[bj]; shade[i] = shade[bj]; grp[i] = grp[bj]; this.nx[i] = this.nx[bj]; this.ny[i] = this.ny[bj]; this.bi[i] = this.bi[bj]; }
        }
      }
    }
    // 2) screen-space cast shadows (light from upper-left-front)
    const shadowAmt = o.shadow ?? 0.55;
    const sh = B.sh.fill(0);
    const nm = L.length;
    const noRecv = new Uint8Array(32), noCastF = new Uint8Array(32);
    for (let m = 1; m < nm; m++) { noRecv[m] = L[m].emissive || L[m].noShadow ? 1 : 0; noCastF[m] = L[m].emissive || L[m].noCast ? 1 : 0; }
    if (shadowAmt > 0) {
      const R = Math.max(2, Math.round(3 * this.S));
      for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) {
        const i = y * w + x;
        if (!mat[i] || noRecv[mat[i]]) continue;
        for (let k = 1; k <= R; k++) {
          const xx = x - k, yy = y - k;
          if (xx < 0 || yy < 0) break;
          const j = yy * w + xx;
          if (!mat[j] || noCastF[mat[j]]) continue;
          if (grp[j] !== grp[i] && z[j] - z[i] > 1.5 + 0.6 * k) { sh[i] = shadowAmt; break; }
        }
      }
    }
    // 3) tone quantisation
    const tone = B.tone.fill(-1);
    const dith = this.dither;
    for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) {
      const i = y * w + x;
      if (!mat[i]) continue;
      const M = L[mat[i]];
      let s = shade[i];
      if (M.flat !== undefined) { tone[i] = M.flat; continue; }
      if (M.emissive) {
        const th = M.th || TH_EM;
        let t = 0; while (t < 4 && s >= th[t]) t++;
        tone[i] = t;
        continue;
      }
      s -= sh[i];
      if (dith && M.dither !== false) s += (BAYER4[(y & 3) * 4 + (x & 3)] - 0.5) * dith;
      const th = M.th || TH_LIT;
      let t = 0; while (t < 3 && s >= th[t]) t++;
      if (t === 3 && s >= th[3] && (M.gloss || M.hi)) t = 4;
      if (M.minTone !== undefined && t < M.minTone) t = M.minTone;
      if (M.maxTone !== undefined && t > M.maxTone) t = M.maxTone;
      tone[i] = t;
    }
    // 4) tone cleanup: lone pixels take the surrounding tone
    for (let y = Math.max(1, Y0); y <= Math.min(h - 2, Y1); y++) for (let x = Math.max(1, X0); x <= Math.min(w - 2, X1); x++) {
      const i = y * w + x;
      const mi = mat[i];
      if (!mi || mat[i - 1] !== mi || mat[i + 1] !== mi || mat[i - w] !== mi || mat[i + w] !== mi) continue;
      const ti = tone[i], a = tone[i - 1];
      if (a === ti || tone[i + 1] === ti || tone[i - w] === ti || tone[i + w] === ti) continue;
      if (tone[i + 1] === a && tone[i - w] === a && tone[i + w] === a) tone[i] = a;
    }
    // 4b) rim light: 1px bright edge on the shadowed right-hand silhouette
    const rimOn = o.rim ?? 1;
    if (rimOn) {
      const nxb = this.nx;
      for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= Math.min(w - 2, X1); x++) {
        const i = y * w + x;
        const m = mat[i];
        if (!m || L[m].emissive || L[m].noRim || L[m].flat !== undefined) continue;
        if (nxb[i] < 0.3) continue;
        const r = i + 1;
        const edge = !mat[r] || z[r] < z[i] - this.lineThr * 2;
        if (!edge) continue;
        if (x > 0 && !mat[i - 1]) continue;
        if (tone[i] <= 2) tone[i] = Math.min(3, tone[i] + 2);
      }
    }
    // 5) inner lines at depth discontinuities
    const lineT = this.lineThr, lineT2 = lineT * 3.5;
    const isLine = B.isLine.fill(0);
    const chk = (i, j) => {
      const mj = mat[j];
      if (!mj || L[mj].noCastLine) return false;
      return z[j] - z[i] > (grp[j] !== grp[i] ? lineT : lineT2);
    };
    for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) {
      const i = y * w + x;
      if (!mat[i] || L[mat[i]].noLine) continue;
      if ((x > 0 && chk(i, i - 1)) || (x < w - 1 && chk(i, i + 1)) || (y > 0 && chk(i, i - w)) || (y < h - 1 && chk(i, i + w))) isLine[i] = 1;
    }
    // 6) compose palette indices
    const idx = B.idx.fill(0);
    for (let i = 0; i < N; i++) if (mat[i]) idx[i] = mat[i] * 8 + (isLine[i] ? 6 : tone[i]);
    // 7) decals
    const dec = B.dec.fill(0);
    for (const d of this.decals) {
      for (const p of d.pix) {
        const x = Math.round(p[0]), y = Math.round(p[1]);
        if (x < 0 || y < 0 || x >= w || y >= h) continue;
        const i = y * w + x;
        if (!mat[i] && !d.free) continue;
        if (d.host !== undefined && grp[i] !== d.host) continue;
        if (d.z !== undefined && z[i] > d.z + (d.tol ?? 2.5)) continue;
        const mid = this.mid(p[2]);
        idx[i] = mid * 8 + p[3];
        dec[i] = 1;
        if (!mat[i]) { mat[i] = mid; }
      }
    }
    // 8) outline (selout: slightly lighter on the lit upper-left side)
    // data mode (in-game frames, copied out by the caller right away): pooled output buffers, no per-frame garbage
    const out = o.data ? (B.outP && B.outP.length === N ? B.outP : (B.outP = new Uint8Array(N))) : new Uint8Array(idx);
    if (o.data) out.set(idx);
    if (o.outline !== false) {
      const selout = o.selout !== false;
      for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) {
        const i = y * w + x;
        if (mat[i]) continue;
        let best = 0, bz = -1e9, lit = false, j, m;
        if (x < w - 1) { j = i + 1; m = mat[j]; if (m && !L[m].noOutline && z[j] > bz) { bz = z[j]; best = m; lit = true; } }
        if (y < h - 1) { j = i + w; m = mat[j]; if (m && !L[m].noOutline && z[j] > bz) { bz = z[j]; best = m; lit = true; } }
        if (x > 0) { j = i - 1; m = mat[j]; if (m && !L[m].noOutline && z[j] > bz) { bz = z[j]; best = m; lit = false; } }
        if (y > 0) { j = i - w; m = mat[j]; if (m && !L[m].noOutline && z[j] > bz) { bz = z[j]; best = m; lit = false; } }
        if (best) out[i] = best * 8 + (lit && selout ? 7 : 5);
      }
    }
    // 9) optional data image for dynamic lighting in game (see game/mt/render/sprites.js):
    //    R = material id (bits 0-4) | emissive (32) | glossy (64) | fixed tone (128: outline, line, decal, emissive, flat)
    //    G = baked tone (0-7) | 8 if inside a baked cast shadow | 16 * (shading bias / 0.1 + 4, 0-7) ;  B,A = view-space normal x,y (z >= 0 implied)
    let data = null;
    if (o.data) {
      data = B.dataP && B.dataP.length === N * 4 ? B.dataP.fill(0) : (B.dataP = new Uint8Array(N * 4));
      const nxb = this.nx, nyb = this.ny;
      for (let i = 0; i < N; i++) {
        const k = out[i]; if (!k) continue;
        const m = k >> 3, t = k & 7, M = L[m];
        const fixed = t >= 5 || dec[i] || M.emissive || M.flat !== undefined || isLine[i];
        data[i * 4] = m | (M.emissive ? 32 : 0) | (M.gloss || M.hi ? 64 : 0) | (fixed ? 128 : 0);
        const q = Math.max(0, Math.min(7, Math.round(this.bi[i] * 10) + 4));
        data[i * 4 + 1] = t | (sh[i] > 0 ? 8 : 0) | (q << 4);
        const fn = fixed && !M.emissive ? 0 : 1;
        data[i * 4 + 2] = Math.max(1, Math.min(255, Math.round(128 + nxb[i] * 127 * fn)));
        data[i * 4 + 3] = Math.max(1, Math.min(255, Math.round(128 + nyb[i] * 127 * fn)));
      }
    }
    B.busy = false;
    return { w, h, idx: out, palette: this.mats.palette, mats: this.mats, data };
  }
}

// convert indexed image to RGBA using palette (array of hex or [r,g,b])
export function toRGBA(img, palOverride) {
  const pal = (palOverride || img.palette).map(c => c == null ? null : (Array.isArray(c) ? c : hexRGB(c)));
  const d = new Uint8ClampedArray(img.w * img.h * 4);
  for (let i = 0; i < img.idx.length; i++) {
    const k = img.idx[i];
    if (!k) continue;
    const c = pal[k];
    if (!c) continue;
    d[i * 4] = c[0]; d[i * 4 + 1] = c[1]; d[i * 4 + 2] = c[2]; d[i * 4 + 3] = c[3] ?? 255;
  }
  return { w: img.w, h: img.h, data: d };
}
const hexCache = new Map();
function hexRGB(h) {
  let v = hexCache.get(h);
  if (!v) { const n = parseInt(h.slice(1), 16); v = [(n >> 16) & 255, (n >> 8) & 255, n & 255]; hexCache.set(h, v); }
  return v;
}
