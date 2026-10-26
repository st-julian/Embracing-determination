// mt/voxel/models/fromsprite.js — HIGH-DETAIL voxel characters sculpted straight from the BW-style sprite rigs in
// game/art/sprites (the art that won the Black/White blind tests): every form's own draw(s, P) runs against a
// VoxelScene that has the sprite Scene's API but fills a 3D voxel grid instead of a z-buffer. Ellipsoids and swept
// tubes become solid voxel volumes, cards become 1–2 voxel shells, screen-space shapes (flames, bolts, splashes)
// become puffy extrusions, and face decals (eyes, mouths) are stamped on the front surface. Each surface voxel is
// then painted with the material's own 5-tone hue-shifted ramp from its surface normal (light from the upper left,
// the sprite thresholds), so the voxel model carries the same palette, markings and silhouette as the sprite.
// Owner: voxel character design.
//
//   voxelizeForm(def, { scale, variant, team }) -> rig { anim, parts, height, radius, size: CHAR_M }
//   1 sprite px (at `scale`) = 1 voxel = CHAR_M (1/25 m). Parts follow the rig contract (see rig.js / index.js);
//   glowing (emissive) voxels go to parts named `fx…` (`fx` = the largest, others `fx_<host>`).
import { Scene } from '../../../art/sprites/raster.js';
import { mApply, mApplyV } from '../../../art/sprites/math.js';
import { poseFor, getMats, rootMotion } from '../../../art/sprites/rig.js';
import { VoxelModel, CHAR_M } from '../kit.js';
import { bakeBands } from './bake.js';

const LIGHT = (() => { const v = [-0.45, 0.7, 0.55], l = Math.hypot(...v); return v.map((x) => x / l); })();
const TH_EM = [0.1, 0.3, 0.55, 0.8], TH_LIT = [-0.38, 0.08, 0.6, 0.88];

class VoxelScene extends Scene {
  constructor(o) {
    super({ ...o, yaw: 0, pitch: 0 });
    this.D = o.d;
    const N = this.w * this.h * this.D;
    this.vm = new Uint8Array(N);        // material id
    this.vg = new Uint8Array(N);        // group id
    this.vb = new Float32Array(N);      // shading bias / emissive heat
    this.vt = new Int8Array(N).fill(-1); // fixed tone (decals, clean flames)
    this.vs = new Uint8Array(N);        // 1 = written by a screen-space shape (flame tongues, sparks)
    this.src = 0;
  }
  vi(x, y, z) { return (y * this.D + z) * this.w + x; }
  /** camera-space point -> voxel index or -1 */
  put(X, Y, Z, m, g, b) {
    const x = Math.floor(X + this.ax), y = Math.floor(Y), z = Math.floor(Z + this.D / 2);
    if (x < 0 || y < 0 || z < 0 || x >= this.w || y >= this.h || z >= this.D) return;
    const i = this.vi(x, y, z); this.vm[i] = m; this.vg[i] = g; this.vb[i] = b; this.vs[i] = this.src;
  }
  _ellipsoid(cc, L, mat, o) {
    const inv = inv33(L);
    const ex = Math.hypot(L[0], L[1], L[2]), ey = Math.hypot(L[3], L[4], L[5]), ez = Math.hypot(L[6], L[7], L[8]);
    const fn = typeof mat === 'function' ? mat : null, mid0 = fn ? -1 : this.mid(mat);
    const grp = o.grp ?? this.g, bias = o.bias || 0;
    const X0 = Math.floor(cc[0] + this.ax - ex - 1), X1 = Math.ceil(cc[0] + this.ax + ex + 1);
    const Y0 = Math.floor(cc[1] - ey - 1), Y1 = Math.ceil(cc[1] + ey + 1);
    const Z0 = Math.floor(cc[2] + this.D / 2 - ez - 1), Z1 = Math.ceil(cc[2] + this.D / 2 + ez + 1);
    for (let y = Math.max(0, Y0); y <= Math.min(this.h - 1, Y1); y++) for (let z = Math.max(0, Z0); z <= Math.min(this.D - 1, Z1); z++) for (let x = Math.max(0, X0); x <= Math.min(this.w - 1, X1); x++) {
      const dx = x + 0.5 - this.ax - cc[0], dy = y + 0.5 - cc[1], dz = z + 0.5 - this.D / 2 - cc[2];
      const a = inv[0] * dx + inv[1] * dy + inv[2] * dz, b = inv[3] * dx + inv[4] * dy + inv[5] * dz, c = inv[6] * dx + inv[7] * dy + inv[8] * dz;
      const q = a * a + b * b + c * c; if (q > 1) continue;
      let m = mid0, lb = 0;
      if (fn) { const l = Math.sqrt(q) || 1, r = fn(a / l, b / l, c / l); if (r == null) continue; if (Array.isArray(r)) { m = this.mid(r[0]); lb = r[1]; } else m = this.mid(r); }
      const M = this.mats.list[m];
      // emissive: heat from the facing (as the sprite) — brighter toward the core
      const heat = M.emissive ? (o.heat ? o.heat(a, b, c, c) : 0.35 + 0.65 * (1 - Math.sqrt(q))) : bias + lb;
      const i = this.vi(x, y, z); this.vm[i] = m; this.vg[i] = grp; this.vb[i] = heat; this.vs[i] = 0;
    }
  }
  _poly(pts, zAt, n, mat, o) {
    this.src = o.toUV ? 0 : 1;
    try { this._poly0(pts, zAt, n, mat, o); } finally { this.src = 0; }
  }
  _poly0(pts, zAt, n, mat, o) {
    // 2D mask + distance transform in screen space (same as the sprite), then an extrusion along z:
    // cards (o.toUV) stay 1–2 voxels thick, screen shapes (flames, bolts) get a puffy dome thickness
    let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    for (const p of pts) { minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]); minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); }
    const x0 = Math.floor(minX), x1 = Math.ceil(maxX), y0 = Math.floor(minY), y1 = Math.ceil(maxY);
    const W = x1 - x0 + 3, H = y1 - y0 + 3, d = new Float32Array(W * H);
    let any = false;
    for (let py = y0; py <= y1; py++) {
      const Y = py + 0.5, xs = [];
      for (let a = 0, b = pts.length - 1; a < pts.length; b = a++) { const ya = pts[a][1], yb = pts[b][1]; if ((ya > Y) !== (yb > Y)) xs.push((pts[b][0] - pts[a][0]) * (Y - ya) / (yb - ya) + pts[a][0]); }
      xs.sort((p, q) => p - q);
      for (let k = 0; k + 1 < xs.length; k += 2) for (let px = Math.ceil(xs[k] - 0.5); px <= Math.floor(xs[k + 1] - 0.5); px++) { d[(py - y0 + 1) * W + px - x0 + 1] = 1e6; any = true; }
    }
    if (!any) return;
    const DD = 1.4142;
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const i = y * W + x; if (!d[i]) continue; d[i] = Math.min(d[i], d[i - 1] + 1, d[i - W] + 1, d[i - W - 1] + DD, d[i - W + 1] + DD); }
    let dmax = 0.001;
    for (let y = H - 2; y >= 1; y--) for (let x = W - 2; x >= 1; x--) { const i = y * W + x; if (!d[i]) continue; d[i] = Math.min(d[i], d[i + 1] + 1, d[i + W] + 1, d[i + W + 1] + DD, d[i + W - 1] + DD); dmax = Math.max(dmax, d[i]); }
    dmax -= 0.5;
    const fn = typeof mat === 'function' ? mat : null, mid0 = fn ? -1 : this.mid(mat), grp = o.grp ?? this.g;
    const dref = o.dref || Math.max(0.5, dmax), card = !!o.toUV;
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const k = y * W + x; if (!d[k]) continue;
      const px = x - 1 + x0, py = y - 1 + y0, dist = d[k] - 0.5;
      const X = px + 0.5 - this.ax, Y = this.ay - (py + 0.5);
      const z = zAt(X, Y) + (o.zBias || 0);
      let m = mid0, lb = 0;
      if (fn) { const uv = o.toUV ? o.toUV(X, Y) : [X, Y]; const r = fn(uv[0], uv[1], dist / dref); if (r == null) continue; if (Array.isArray(r)) { m = this.mid(r[0]); lb = r[1]; } else m = this.mid(r); }
      const M = this.mats.list[m], f = Math.min(1, dist / dref);
      const half = card ? 0.75 : 0.6 + Math.min(4, dref * 0.55) * Math.sqrt(f) * (o.thick ?? 1);
      const heat = M.emissive ? (o.heatFn ? o.heatFn(f, X, Y) : f) + lb : (o.bias || 0) + lb;
      for (let t = -half; t <= half; t += 0.5) this.put(X, Y, z + t, m, grp, heat);
    }
  }
  /** polygon card sampled directly in 3D (orientation-proof): (a, b) over the poly in (u, v) units, 2 layers */
  card(origin, u, v, poly, mat, o = {}) {
    const P0 = mApply(this.m, origin), U = mApplyV(this.m, u), V = mApplyV(this.m, v);
    let n = [U[1] * V[2] - U[2] * V[1], U[2] * V[0] - U[0] * V[2], U[0] * V[1] - U[1] * V[0]];
    const nl = Math.hypot(...n) || 1; n = n.map((x) => x / nl);
    const lu = Math.hypot(...U) || 1, lv = Math.hypot(...V) || 1, st = 0.38 / Math.max(lu, lv);
    let a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9; for (const [a, b] of poly) { a0 = Math.min(a0, a); a1 = Math.max(a1, a); b0 = Math.min(b0, b); b1 = Math.max(b1, b); }
    const inside = (a, b) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > b) !== (yj > b) && a < (xj - xi) * (b - yi) / (yj - yi) + xi) c = !c; } return c; };
    const edgeD = (a, b) => { let m = 1e9; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j], dx = xj - xi, dy = yj - yi, L2 = dx * dx + dy * dy || 1e-9; let t = ((a - xi) * dx + (b - yi) * dy) / L2; t = t < 0 ? 0 : t > 1 ? 1 : t; m = Math.min(m, Math.hypot(a - xi - dx * t, b - yi - dy * t)); } return m; };
    let dmax = 1e-3; const samples = [];
    for (let a = a0; a <= a1; a += st) for (let b = b0; b <= b1; b += st) if (inside(a, b)) { const dd = edgeD(a, b); dmax = Math.max(dmax, dd); samples.push([a, b, dd]); }
    const fn = typeof mat === 'function' ? mat : null, grp = o.grp ?? this.g;
    const bk = o.backMat ? (typeof o.backMat === 'function' ? o.backMat : () => o.backMat) : null;
    const gname = Object.keys(this.groups).find((k) => this.groups[k] === grp) || '';
    const wm = /^(?:w(-?1)|fw)(\d+|arm)$/.exec(gname);
    const sides = wm ? [1] : [1, -1];                                      // feather cards: one clean layer
    // wings: spread outward about the shoulder (camera z) so the feather planes face up / out, like a BW final's
    // display pose; feathers stack like shingles (one voxel apart along the wing normal) so every row reads
    let wrot = null, shingle = 0;
    if (wm && this.wingSpread) {
      const piv = mApply(this.m, [0, 0, 0]), sd = piv[0] < 0 ? -1 : 1, a = -sd * this.wingSpread, ca = Math.cos(a), sa = Math.sin(a);
      wrot = (q) => { const dx = q[0] - piv[0], dy = q[1] - piv[1]; return [piv[0] + dx * ca - dy * sa, piv[1] + dx * sa + dy * ca, q[2]]; };
      shingle = wm[2] === 'arm' ? 9 : +wm[2];
    }
    for (const [a, b, dd] of samples) {
      const f = Math.min(1, dd / dmax);
      for (const side of sides) {
        const r = side > 0 || !bk ? (fn ? fn(a, b, f) : mat) : bk(a, b, f);
        if (r == null) continue;
        let m, lb = 0; if (Array.isArray(r)) { m = this.mid(r[0]); lb = r[1]; } else m = this.mid(r);
        const M = this.mats.list[m], off = sides.length === 1 ? -shingle * 0.9 * (n[2] >= 0 ? 1 : -1) : side * 0.45 * (n[2] >= 0 ? 1 : -1);
        const heat = M.emissive ? (o.heatFn ? o.heatFn(f, a, b) : f) + lb : (o.bias || 0) + lb;
        let q = [P0[0] + U[0] * a + V[0] * b + n[0] * off, P0[1] + U[1] * a + V[1] * b + n[1] * off, P0[2] + U[2] * a + V[2] * b + n[2] * off];
        if (wrot) q = wrot(q);
        this.put(q[0], q[1], q[2], m, grp, heat);
      }
    }
  }
  stroke2(pts, z, mat, o = {}) {
    this.src = 1;
    try { this._stroke2(pts, z, mat, o); } finally { this.src = 0; }
  }
  _stroke2(pts, z, mat, o = {}) {
    const mid = this.mid(mat), grp = o.grp ?? this.g;
    const x0 = Math.floor(Math.min(...pts.map((p) => p[0] - p[2]))), x1 = Math.ceil(Math.max(...pts.map((p) => p[0] + p[2])));
    const y0 = Math.floor(Math.min(...pts.map((p) => p[1] - p[2]))), y1 = Math.ceil(Math.max(...pts.map((p) => p[1] + p[2])));
    for (let py = y0; py <= y1; py++) for (let px = x0; px <= x1; px++) {
      const X = px + 0.5, Y = py + 0.5; let best = -1, rr = 0;
      for (let k = 0; k < pts.length - 1; k++) {
        const a = pts[k], b = pts[k + 1], dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1e-6;
        let t = ((X - a[0]) * dx + (Y - a[1]) * dy) / L2; t = t < 0 ? 0 : t > 1 ? 1 : t;
        const r = a[2] + (b[2] - a[2]) * t, dd = Math.hypot(X - a[0] - dx * t, Y - a[1] - dy * t);
        if (dd <= r) { const h = 1 - dd / Math.max(r, 0.5); if (h > best) { best = h; rr = r; } }
      }
      if (best < 0) continue;
      const half = Math.max(0.5, rr * Math.sqrt(best) * 0.9);
      for (let t = -half; t <= half; t += 0.5) this.put(px + 0.5 - this.ax, this.ay - (py + 0.5), z + t, mid, grp, this.mats.list[mid].emissive ? best : (o.shade ?? 0.3) - 0.3);
    }
  }
  decal(pix, o = {}) { this.decals.push({ pix, ...o }); }

  /** clean flames: every connected screen-space emissive cluster (sprite flame tongues + sparks) is replaced by a
   *  few big voxel tongues with smooth bands: white-yellow core -> yellow -> orange -> red tips */
  /** a clean flame cone from base point b along unit dir d, length len, base radius r (flame material m) */
  flameCone(b, d, len, r, m, grp) {
    const up = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    let u = [d[1] * up[2] - d[2] * up[1], d[2] * up[0] - d[0] * up[2], d[0] * up[1] - d[1] * up[0]]; const ul = Math.hypot(...u); u = u.map((x) => x / ul);
    const v = [d[1] * u[2] - d[2] * u[1], d[2] * u[0] - d[0] * u[2], d[0] * u[1] - d[1] * u[0]];
    for (let k = 0; k <= len * 2; k++) {
      const t = k / (len * 2), rr = r * (t < 0.25 ? 0.75 + t : Math.pow(1 - (t - 0.25) / 0.75, 0.9)) + 0.3;
      for (let a = -rr; a <= rr; a += 0.5) for (let c = -rr; c <= rr; c += 0.5) {
        const q = Math.hypot(a, c) / rr; if (q > 1) continue;
        const P = [0, 1, 2].map((i) => b[i] + d[i] * t * len + u[i] * a + v[i] * c);
        const x = Math.floor(P[0]), y = Math.floor(P[1]), z = Math.floor(P[2]);
        if (x < 0 || y < 0 || z < 0 || x >= this.w || y >= this.h || z >= this.D) continue;
        const i = this.vi(x, y, z), tn = t > 0.8 ? 1 : q < 0.45 && t < 0.5 ? 4 : q < 0.75 && t < 0.7 ? 3 : 2;
        if (this.vm[i] && this.vt[i] > tn) continue;
        this.vm[i] = m; this.vg[i] = grp; this.vt[i] = tn; this.vs[i] = 2;
      }
    }
  }
  /** lion mane: the sprite's ring of screen-space tongues (group maneGroup) becomes 7 clean 3D cones radiating
   *  up / out / back around the head */
  cleanMane(maneGroup, headGroup) {
    const gm = this.groups[maneGroup], gh = this.groups[headGroup], vm = this.vm, L = this.mats.list;
    if (gm === undefined || gh === undefined) return;
    let mid = 0;
    for (let i = 0; i < vm.length; i++) if (vm[i] && this.vg[i] === gm && L[vm[i]].emissive) { mid = vm[i]; vm[i] = 0; }
    if (!mid) return;
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (let i = 0; i < vm.length; i++) if (vm[i] && this.vg[i] === gh) { const x = i % this.w, z = Math.floor(i / this.w) % this.D, y = Math.floor(i / (this.w * this.D)); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
    if (x1 < 0) return;
    const C = [(x0 + x1 + 1) / 2, (y0 + y1 + 1) / 2, (z0 + z1 + 1) / 2], R = (x1 - x0 + 1) / 2;
    for (let k = 0; k < 7; k++) {
      const a = (-1 + k / 3) * 1.65, sa = Math.sin(a), ca = Math.cos(a);
      const d0 = [sa * 0.85, ca * 0.9 + 0.15, -0.55], dl = Math.hypot(...d0), d = d0.map((x) => x / dl);
      const b = [C[0] + sa * R * 0.7, C[1] + ca * R * 0.55, C[2] - R * 0.55];
      this.flameCone(b, d, R * (1.15 - Math.abs(a) * 0.25), R * 0.28, mid, gm);
    }
  }
  cleanFlames() {
    const { w, h, D } = this, vm = this.vm, L = this.mats.list, seen = new Uint8Array(vm.length);
    const em = (i) => vm[i] && L[vm[i]].emissive && this.vs[i];
    const clusters = [];
    for (let i0 = 0; i0 < vm.length; i0++) {
      if (seen[i0] || !em(i0)) continue;
      const stack = [i0], cl = []; seen[i0] = 1;
      while (stack.length) {
        const i = stack.pop(); cl.push(i);
        const x = i % w, z = Math.floor(i / w) % D, y = Math.floor(i / (w * D));
        for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
          const X = x + dx, Y = y + dy, Z = z + dz; if (X < 0 || Y < 0 || Z < 0 || X >= w || Y >= h || Z >= D) continue;
          const j = this.vi(X, Y, Z); if (!seen[j] && em(j)) { seen[j] = 1; stack.push(j); }
        }
      }
      clusters.push(cl);
    }
    for (const cl of clusters) {
      if (cl.length < 6) { for (const i of cl) vm[i] = 0; continue; }       // loose sparks go
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, z0 = 1e9, z1 = -1e9; const gc = new Map(); const mc = new Map();
      let tx = 0, tz = 0, tn = 0, bx = 0, bz = 0, bn = 0;
      for (const i of cl) { const x = i % w, z = Math.floor(i / w) % D, y = Math.floor(i / (w * D)); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); z0 = Math.min(z0, z); z1 = Math.max(z1, z); gc.set(this.vg[i], (gc.get(this.vg[i]) || 0) + 1); mc.set(vm[i], (mc.get(vm[i]) || 0) + 1); }
      const H = y1 - y0 + 1;
      for (const i of cl) { const x = i % w, z = Math.floor(i / w) % D, y = Math.floor(i / (w * D)); if (y > y1 - H * 0.3) { tx += x; tz += z; tn++; } if (y < y0 + H * 0.3) { bx += x; bz += z; bn++; } vm[i] = 0; }
      const grp = [...gc.entries()].sort((a, b) => b[1] - a[1])[0][0], mid = [...mc.entries()].sort((a, b) => b[1] - a[1])[0][0];
      const cx = bn ? bx / bn + 0.5 : (x0 + x1 + 1) / 2, cz = bn ? bz / bn + 0.5 : (z0 + z1 + 1) / 2;
      const lx = tn && bn ? (tx / tn - bx / bn) / H : 0, lz = tn && bn ? (tz / tn - bz / bn) / H : 0;
      const W0 = x1 - x0 + 1;
      const R = Math.max(1.4, Math.min(W0, (z1 - z0 + 1) * 1.3, H * 0.62) * 0.42);
      const tongue = (ox, oz, hh, rr, top) => {
        for (let k = 0; k < hh; k++) {
          const t = k / hh, r = rr * (t < 0.28 ? 0.72 + t / 0.28 * 0.28 : Math.pow(1 - (t - 0.28) / 0.72, 0.9)) + 0.25;
          const px = cx + ox + lx * k, pz = cz + oz + lz * k;
          for (let z = Math.floor(pz - r); z <= Math.ceil(pz + r); z++) for (let x = Math.floor(px - r); x <= Math.ceil(px + r); x++) {
            const q = Math.hypot(x + 0.5 - px, z + 0.5 - pz) / r; if (q > 1) continue;
            const y = y0 + k; if (x < 0 || z < 0 || x >= w || z >= D || y >= h) continue;
            const i = this.vi(x, y, z);
            const tt = t * top;
            const tn2 = tt > 0.8 ? 1 : (q < 0.42 && tt < 0.5 ? 4 : q < 0.72 && tt < 0.7 ? 3 : 2);
            if (vm[i] && this.vt[i] > tn2) continue;
            vm[i] = mid; this.vg[i] = grp; this.vt[i] = tn2; this.vs[i] = 2;
          }
        }
      };
      const Hm = Math.round(H * 1.02);
      // wide clusters (manes, crests) become a fan of 3 clean tongues across their width, centre tallest
      const n = W0 > R * 3.2 ? 3 : 1, mid0 = (x0 + x1 + 1) / 2 - cx;
      if (n === 1) {
        tongue(0, 0, Hm, R, 1);
        if (R >= 2.4) { const sx = R * 0.62; tongue(-sx, 0.2, Math.round(Hm * 0.62), R * 0.55, 1.15); tongue(sx, -0.2, Math.round(Hm * 0.55), R * 0.5, 1.2); }
      } else {
        const r2 = Math.min(R, W0 / 6.4 + 0.6), sp = (W0 / 2) - r2;
        tongue(mid0, 0, Hm, r2 * 1.15, 1);
        tongue(mid0 - sp, 0.4, Math.round(Hm * 0.7), r2, 1.1); tongue(mid0 + sp, 0.4, Math.round(Hm * 0.7), r2, 1.1);
      }
    }
  }
  /** clean tiger stripes (voxel-scale replacement for a sprite's thin sine stripes that alias into blotches):
   *  on the upper half of the given groups, materials {fur, stripe} become slanted bands `width` voxels wide every
   *  `period` voxels along the body (z), slanting down the flanks */
  restripe(groups, fur, stripe, period = 6, width = 2, slant = 0.45) {
    const fm = this.mid(fur), sm = this.mid(stripe), gs = new Set(groups.map((g) => this.groups[g]).filter((g) => g !== undefined));
    const vm = this.vm, w = this.w, D = this.D;
    let y0 = 1e9, y1 = -1e9, z0 = 1e9, z1 = -1e9;
    for (let i = 0; i < vm.length; i++) if (gs.has(this.vg[i]) && (vm[i] === fm || vm[i] === sm)) { const z = Math.floor(i / w) % D, y = Math.floor(i / (w * D)); y0 = Math.min(y0, y); y1 = Math.max(y1, y); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
    if (y1 < 0) return;
    const ym = y0 + (y1 - y0) * 0.45;
    for (let i = 0; i < vm.length; i++) {
      if (!gs.has(this.vg[i]) || (vm[i] !== fm && vm[i] !== sm)) continue;
      const x = i % w, z = Math.floor(i / w) % D, y = Math.floor(i / (w * D));
      if (y < ym) { if (vm[i] === sm) vm[i] = fm; continue; }
      const d = (z - z0) + (y1 - y) * slant + Math.abs(x + 0.5 - this.ax) * 0.15, k = ((d % period) + period) % period;
      vm[i] = k < width && z > z0 + 1 && z < z1 - 1 ? sm : fm;
    }
  }
  /** remove detached clusters smaller than n voxels (sprite sparks, drops, stray card fragments) */
  dropCrumbs(n) {
    const { w, h, D } = this, vm = this.vm, seen = new Uint8Array(vm.length);
    let total = 0; for (let i = 0; i < vm.length; i++) if (vm[i]) total++;
    n = Math.max(n, Math.round(total * 0.015));
    for (let i0 = 0; i0 < vm.length; i0++) {
      if (seen[i0] || !vm[i0]) continue;
      const stack = [i0], cl = []; seen[i0] = 1;
      while (stack.length) {
        const i = stack.pop(); cl.push(i);
        const x = i % w, z = Math.floor(i / w) % D, y = Math.floor(i / (w * D));
        for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
          const X = x + dx, Y = y + dy, Z = z + dz; if (X < 0 || Y < 0 || Z < 0 || X >= w || Y >= h || Z >= D) continue;
          const j = this.vi(X, Y, Z); if (!seen[j] && vm[j]) { seen[j] = 1; stack.push(j); }
        }
      }
      if (cl.length < n) for (const i of cl) vm[i] = 0;
    }
  }
  /** clean BW eyes: each sprite eye decal becomes a tall dark oval + one white highlight (fierce forms: slanted lid) */
  cleanEyes(fierce) {
    const EYE = new Set(['eyeW', 'pupil', 'iris', 'shine', 'glow']), keep = [], eyePix = [];
    for (const dc of this.decals) {
      const mine = dc.pix.filter((p) => EYE.has(this.mats.list[this.mid(p[2])].name));
      const rest = dc.pix.filter((p) => !EYE.has(this.mats.list[this.mid(p[2])].name));
      if (mine.length) eyePix.push({ pix: mine, host: dc.host, z: dc.z });
      if (rest.length) keep.push({ ...dc, pix: rest });
    }
    const out = [];
    for (const side of [-1, 1]) {
      const px = eyePix.flatMap((e) => e.pix).filter((p) => (p[0] + 0.5 - this.ax) * side > 0); if (!px.length) continue;
      const host = eyePix[0].host;
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const p of px) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
      const cx = (x0 + x1 + 1) / 2, cy = (y0 + y1 + 1) / 2, rx = Math.max(1, (x1 - x0 + 1) / 2 * 0.72), ry = Math.max(1.5, (y1 - y0 + 1) / 2 * 0.92);
      const pix = [];
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const u = (x + 0.5 - cx) / rx, v = (y + 0.5 - cy) / ry; if (u * u + v * v > 1.05) continue;
        const inner = -side * u;                                   // +1 toward the nose
        if (fierce && v < -0.35 + inner * 0.55) continue;           // slanted upper lid
        pix.push([x, y, 'pupil', 1]);
      }
      const hx = Math.round(cx - side * rx * 0.25 - 0.5), hy = Math.round(cy - ry * 0.45 - 0.5);
      pix.push([hx, hy, 'shine', 4]); if (ry >= 3.5) pix.push([hx, hy + 1, 'shine', 4]);
      out.push({ pix, host });
    }
    this.decals = [...keep, ...out];
  }
  /** paint + split into parts */
  voxels() {
    const { w, h, D } = this, L = this.mats.list, vm = this.vm, vt = this.vt;
    // decals: frontmost voxel along -z in the pixel's column
    for (const dc of this.decals) for (const p of dc.pix) {
      const x = Math.round(p[0]), y = Math.floor(this.ay - Math.round(p[1]) - 0.5);
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      for (let z = D - 1; z >= 0; z--) { const i = this.vi(x, y, z); if (!vm[i]) continue; if (dc.host !== undefined && this.vg[i] !== dc.host && !dc.free) break; vm[i] = this.mid(p[2]); vt[i] = p[3]; break; }
    }
    const pal = this.mats.palette.map((hx) => (hx ? parseInt(String(hx).slice(1), 16) : 0));
    const ramps = L.map((M, m) => (m ? [0, 1, 2, 3, 4].map((t) => pal[m * 8 + t]) : null));
    const N = w * h * D, occ = new Uint8Array(N), col = new Uint32Array(N), fixed = new Int8Array(N).fill(-1), mode = [];
    for (let i = 0; i < N; i++) if (vm[i]) occ[i] = 1;
    for (let m = 1; m < L.length; m++) if (L[m].flat !== undefined) mode[m] = 'flat';
    // emissive voxels not replaced by clean flames (glowing cards / ellipsoids): 3 heat bands
    for (let i = 0; i < N; i++) {
      const m = vm[i]; if (!m) continue;
      if (vt[i] >= 0) { fixed[i] = vt[i]; continue; }
      if (L[m].emissive) fixed[i] = this.vs[i] === 0 && this.vb[i] > 0.3 ? 3 : this.vb[i] > 0.62 ? 4 : this.vb[i] > 0.3 ? 3 : 2;
    }
    // markings (stripes, spots) are pattern materials: never swallowed by the speckle cleanup
    const keepMat = L.map((M) => !!(M && /stripe|spot|band|mark/i.test(M.name)));
    bakeBands({ w, h, d: D, occ, mat: vm, ramps, col, fixed, mode, keepMat, gloss: L.map((M) => !!(M && M.gloss)), bias: L.map(() => 0) });
    return col;
  }
}

function inv33(m) {
  const [a, b, c, d, e, f, g, h, i] = m, A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g, det = a * A + b * B + c * C || 1e-9;
  return [A / det, -(b * i - c * h) / det, (b * f - c * e) / det, B / det, (a * i - c * g) / det, -(a * f - c * d) / det, C / det, -(a * h - b * g) / det, (a * e - b * d) / det];
}

const HEADISH = /^(head|muzzle|ear|eye|crest|beak|hat|horn|face|hair|mane|antler|jaw|snout|brow|cheek)/;
function partOf(gname, x, ax) {
  const side = x + 0.5 >= ax ? 'L' : 'R';            // +x = character's left
  if (/^legF/.test(gname)) return 'legF' + side;
  if (/^legB/.test(gname)) return 'legB' + side;
  if (/^legs?$|^foot|^feet/.test(gname)) return 'leg' + side;
  if (/wing|^fw|^w-?\d/.test(gname)) return 'wing' + side;
  if (/arm|hand/.test(gname)) return 'arm' + side;
  if (/tail/.test(gname)) return 'tail';
  if (HEADISH.test(gname)) return 'head';
  return 'body';
}

/**
 * Voxelise a sprite form definition (SPECIES_ART[id]._def) in its rest pose.
 * o.scale: sprite units -> voxels; o.variant: palette variant; o.anim: rig anim override; o.pose: P overrides
 */
export function voxelizeForm(def, o = {}) {
  const P = (def.poseFor || poseFor)('idle', 0, def);
  Object.assign(P, { view: o.view || (def.kind === 'trainer' ? 'down' : 'front'), front: true, look: 0, lookAdd: 0, breathe: 0, bob: 0, noFx: true, ...(o.pose || {}) });
  const S = o.scale ?? 1;
  const [cw, ch] = def.cell, pad = Math.round(Math.max(cw, ch) * 0.25 * S) + 4;
  const w = Math.ceil(cw * S) + pad * 2, h = Math.ceil(ch * S) + pad * 2, d = Math.ceil(Math.max(cw, ch) * S) + pad * 2;
  const s = new VoxelScene({ w, h, d, ax: w / 2, ay: h - pad, scale: S, mats: getMats(def, o.variant), view: P.view });
  s.P = P; s.nr = 3; s.wingSpread = o.wingSpread ?? 0.72;
  if (!def.noRoot) rootMotion(s, P, def);
  def.draw(s, P, { voxel: true });
  if (o.mane) s.cleanMane(o.mane[0], o.mane[1]);
  if (o.restripe) s.restripe(...o.restripe);
  s.cleanFlames();
  s.dropCrumbs(10);
  s.cleanEyes((def.stage ?? 0) >= 1);
  const col = s.voxels();
  // split into parts by sprite group (+ side), emissive voxels -> fx parts
  const gnames = []; for (const [k, v] of Object.entries(s.groups)) gnames[v] = k;
  const L = s.mats.list;
  const lab = new Array(w * h * d);
  const names = new Map();
  for (let y = 0; y < h; y++) for (let z = 0; z < d; z++) for (let x = 0; x < w; x++) {
    const i = s.vi(x, y, z); if (!s.vm[i]) continue;
    let p = partOf(gnames[s.vg[i]] || 'body', x, s.ax);
    if (L[s.vm[i]].emissive) p = 'fx_' + p;
    lab[i] = p; if (!names.has(p)) names.set(p, 0); names.set(p, names.get(p) + 1);
  }
  // rename the biggest fx part -> fx
  const fxs = [...names.entries()].filter(([k]) => k.startsWith('fx_')).sort((a, b) => b[1] - a[1]);
  const ren = new Map(); if (fxs.length) ren.set(fxs[0][0], 'fx');
  const final = (p) => ren.get(p) || p;
  // bounding boxes + models
  const bb = new Map();
  for (let y = 0; y < h; y++) for (let z = 0; z < d; z++) for (let x = 0; x < w; x++) {
    const i = s.vi(x, y, z); if (!s.vm[i]) continue; const p = final(lab[i]);
    let b = bb.get(p); if (!b) bb.set(p, (b = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9]));
    b[0] = Math.min(b[0], x); b[1] = Math.min(b[1], y); b[2] = Math.min(b[2], z); b[3] = Math.max(b[3], x); b[4] = Math.max(b[4], y); b[5] = Math.max(b[5], z);
  }
  const parentOf = (p) => (p === 'body' ? null : p.startsWith('fx') ? (p === 'fx' ? hostOf(fxs[0][0]) : hostOf(p)) : 'body');
  const hostOf = (fxName) => { const h0 = fxName.replace(/^fx_/, ''); return bb.has(h0) ? h0 : 'body'; };
  const parts = {};
  for (const [p, b] of bb) {
    const m = new VoxelModel(b[3] - b[0] + 1, b[4] - b[1] + 1, b[5] - b[2] + 1);
    for (let y = b[1]; y <= b[4]; y++) for (let z = b[2]; z <= b[5]; z++) for (let x = b[0]; x <= b[3]; x++) { const i = s.vi(x, y, z); if (s.vm[i] && final(lab[i]) === p) m.v[m.idx(x - b[0], y - b[1], z - b[2])] = col[i]; }
    parts[p] = { model: m, _b: b };
  }
  // joints: centroid of the voxels touching the parent part (hip, neck, tail root, shoulder, flame base)
  for (const [p, P0] of Object.entries(parts)) {
    const par = parentOf(p);
    let j = null;
    if (par && parts[par]) {
      let sx = 0, sy = 0, sz = 0, n = 0;
      const b = P0._b;
      for (let y = b[1]; y <= b[4]; y++) for (let z = b[2]; z <= b[5]; z++) for (let x = b[0]; x <= b[3]; x++) {
        const i = s.vi(x, y, z); if (!s.vm[i] || final(lab[i]) !== p) continue;
        let touch = false;
        for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) { const X = x + dx, Y = y + dy, Z = z + dz; if (X < 0 || Y < 0 || Z < 0 || X >= w || Y >= h || Z >= d) continue; const k = s.vi(X, Y, Z); if (s.vm[k] && final(lab[k]) === par) { touch = true; break; } }
        if (touch) { sx += x + 0.5; sy += y + 0.5; sz += z + 0.5; n++; }
      }
      if (n) j = [sx / n, sy / n, sz / n];
      if (!j) { j = [(b[0] + b[3] + 1) / 2, b[4] + 1, (b[2] + b[5] + 1) / 2]; }
      if (/^leg/.test(p)) j[1] = Math.min(b[4] + 1, Math.max(j[1], b[4] - 1));   // hips at the top of the leg
      const pb = parts[par]._b;
      P0.parent = par; P0.pivot = [j[0] - b[0], j[1] - b[1], j[2] - b[2]]; P0.at = [j[0] - pb[0], j[1] - pb[1], j[2] - pb[2]];
    } else {
      const b = P0._b; j = [s.ax, Math.max(0, b[1]), d / 2];
      P0.pivot = [j[0] - b[0], j[1] - b[1], j[2] - b[2]]; P0.at = [0, j[1], 0];
    }
  }
  let top = 0, rad = 0;
  for (const P0 of Object.values(parts)) { const b = P0._b; top = Math.max(top, b[4] + 1); rad = Math.max(rad, Math.abs(b[0] - s.ax), Math.abs(b[3] + 1 - s.ax), Math.abs(b[2] - d / 2), Math.abs(b[5] + 1 - d / 2)); delete P0._b; }
  // the ground: the lowest voxel sits at y = 0 in the unit frame (feet on the ground)
  let minY = 1e9; for (const P0 of Object.values(parts)) if (!P0.parent) minY = Math.min(minY, P0.at[1] - P0.pivot[1]);
  void minY;
  const anim = o.anim || (parts.legFL || parts.legFR ? 'quadruped' : parts.wingL ? 'flyer' : 'biped');
  return { anim, parts, height: top, radius: Math.round(Math.min(rad, 0.75 * rad + 3)), size: CHAR_M, groundY: Math.floor(s.ay) };
}
