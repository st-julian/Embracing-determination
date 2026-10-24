// Reusable body-part & effect builders on top of the Scene primitives.
import { TAU, hash, clamp, noise1, bez3 } from './math.js';

// point on ellipsoid surface (front, +z side) at local offsets dx, dy from centre
export function onEll(c, r, dx, dy, side = 1) {
  const u = dx / r[0], v = dy / r[1];
  const k = Math.max(0, 1 - u * u - v * v);
  return [c[0] + dx, c[1] + dy, c[2] + side * r[2] * Math.sqrt(k)];
}

// teardrop flame polygon in screen space, base at (bx,by), height h, width w
export function flamePoly(bx, by, w, h, o = {}) {
  const n = o.n || Math.max(6, Math.min(12, Math.round(h / 2.2)));
  const lean = o.lean || 0, t = o.t || 0, wob = o.wob ?? 0.12, seed = o.seed || 0;
  const R = [], Lp = [];
  for (let k = 0; k <= n; k++) {
    const v = k / n;
    const hw = (w / 2) * (v < 0.3 ? Math.sqrt(Math.max(0, 1 - ((0.3 - v) / 0.3) ** 2)) : Math.pow(1 - (v - 0.3) / 0.7, o.pow ?? 1.15));
    const cx = bx + lean * v * v * h + Math.sin(v * 6 + t * TAU + seed) * wob * w * v;
    const y = by - v * h + (v < 0.3 ? 0 : 0);
    const y0 = by + w * 0.12 - v * (h + w * 0.12);
    R.push([cx + hw, y0]); Lp.push([cx - hw, y0]);
  }
  return R.concat(Lp.reverse()).filter((p, i, a) => i === 0 || Math.abs(p[0] - a[i - 1][0]) + Math.abs(p[1] - a[i - 1][1]) > 0.05);
}

// layered flame: main tongue + side tongues; anchor is local 3D point at flame base
export function flame(s, p, o) {
  const [bx, by, z] = s.proj(p);
  const w = o.w * s.S, h = o.h * s.S, t = o.t || 0, seed = o.seed || 0;
  const lean = o.lean || 0;
  const mat = o.mat || 'flame';
  const zb = o.z ?? 0;
  const flick = 1 + 0.12 * Math.sin(t * TAU * 2 + seed * 3);
  const heat = (top) => (d, X, Y) => clamp(d * 1.05 - 0.2 * clamp((by - (s.ay - Y)) / (h * top), 0, 1) + 0.1, 0, 1);
  const tongues = o.tongues ?? 2;
  for (let k = 0; k < tongues; k++) {
    const sd = k === 0 ? -1 : 1;
    const ph = hash(seed + k * 7.1);
    const hh = h * (0.55 + 0.15 * Math.sin(t * TAU + ph * 6)) * (o.sideH ?? 1);
    const ww = w * 0.55;
    s.poly2(flamePoly(bx + sd * w * 0.28, by - h * 0.05, ww, hh, { lean: lean + sd * 0.25, t, seed: seed + k, wob: 0.18 }), z + zb - 0.5, mat, { heatFn: heat(0.6), grp: o.grp });
  }
  s.poly2(flamePoly(bx, by, w, h * flick, { lean, t, seed, wob: o.wob ?? 0.14 }), z + zb, mat, { heatFn: heat(1), grp: o.grp });
}

// fireball / energy orb in screen space
export function orb(s, p, r, mat, o = {}) {
  if (s.P && s.P.noFx) return;
  const [x, y, z] = s.proj(p);
  r *= s.S;
  const zz = z + (o.z ?? 30);
  if (o.trail) {
    const [tx, ty] = o.trail.map(v => v * s.S);
    const pts = [];
    for (let k = 0; k <= 6; k++) { const f = k / 6; pts.push([x + tx * f, y + ty * f, r * (1 - f * 0.85)]); }
    s.stroke2(pts, zz - 0.2, mat, { grp: o.grp });
  }
  s.disc2(x, y, r, zz, mat, { grp: o.grp });
}

// ring of small sparks/embers (cast effects) around local point
export function sparks(s, p, o) {
  if (s.P && s.P.noFx) return;
  const [x, y, z] = s.proj(p);
  const n = o.n || 6;
  for (let k = 0; k < n; k++) {
    const a = (k / n + (o.t || 0) * (o.spin ?? 0.25)) * TAU;
    const rr = o.r * s.S * (0.85 + 0.25 * hash(k * 3.3 + (o.seed || 0)));
    const sx = x + Math.cos(a) * rr, sy = y + Math.sin(a) * rr * (o.flat ?? 0.45) - (o.rise || 0) * s.S * hash(k + 1);
    const front = Math.sin(a) > 0;
    const sz = (o.size || 1.2) * s.S;
    if (o.shape === 'diamond') {
      s.poly2([[sx, sy - sz * 1.6], [sx + sz, sy], [sx, sy + sz * 1.6], [sx - sz, sy]], z + (front ? 30 : -30), o.mat, { grp: o.grp });
    } else s.disc2(sx, sy, sz, z + (front ? 30 : -30), o.mat, { grp: o.grp });
  }
}

// lightning bolt polyline (screen space) from a to b
export function bolt(s, a, b, o = {}) {
  if (s.P && s.P.noFx) return;
  const [x0, y0, z0] = s.proj(a), [x1, y1] = s.proj(b);
  const n = o.n || 5;
  const pts = [];
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  for (let k = 0; k <= n; k++) {
    const f = k / n;
    const off = (k === 0 || k === n) ? 0 : (k % 2 ? 1 : -1) * (o.amp != null ? o.amp * s.S : L * 0.12) * (0.6 + 0.6 * hash(k + (o.seed || 0)));
    pts.push([x0 + dx * f + nx * off, y0 + dy * f + ny * off, (o.r ?? 1.1) * s.S * (1 - f * 0.4)]);
  }
  s.stroke2(pts, z0 + (o.z ?? 30), o.mat || 'bolt', { grp: o.grp });
}

// closed 2D outline from bezier control chain, for cards. pts: list of [x,y]; returns smoothed poly
export function smoothPoly(pts, n = 4) {
  const out = [];
  const N = pts.length;
  for (let i = 0; i < N; i++) {
    const p0 = pts[(i - 1 + N) % N], p1 = pts[i], p2 = pts[(i + 1) % N], p3 = pts[(i + 2) % N];
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map(j => 0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3)));
    }
  }
  return out;
}

// leaf polygon (u along length 0..L, v across)
export function leafPoly(L, W, o = {}) {
  const n = o.n || 8, pts = [];
  const tipBend = o.bend || 0;
  for (let k = 0; k <= n; k++) { const f = k / n; pts.push([f * L, Math.sin(Math.PI * Math.pow(f, o.pow ?? 0.8)) * W / 2 + tipBend * f * f]); }
  for (let k = n - 1; k > 0; k--) { const f = k / n; pts.push([f * L, -Math.sin(Math.PI * Math.pow(f, o.pow ?? 0.8)) * W / 2 + tipBend * f * f]); }
  return pts;
}

// feather-wing polygon: leading edge + fanned primary "fingers" + scalloped secondaries.
// (u outward along the arm 0..span, v toward trailing edge 0..depth)
export function wingPoly(span, depth, o = {}) {
  const np = o.prim ?? 4, ns = o.sec ?? 3;
  const pts = [[0, -depth * 0.08], [span * 0.3, -depth * 0.2], [span * 0.55, -depth * 0.16], [span * 0.82, -depth * 0.05], [span, depth * 0.08]];
  const fw = span * (o.fw ?? 0.11);
  for (let k = 0; k < np; k++) {
    const uc = span * (0.97 - k * (o.pstep ?? 0.13));
    const L = depth * (o.plen ?? 1) * (1 - k * 0.07);
    const lean = fw * (0.6 - k * 0.12) * (o.fan ?? 1);
    pts.push([uc + lean, L * 0.92]);
    pts.push([uc + lean - fw * 0.45, L]);
    pts.push([uc - fw * 0.55, L * 0.62]);
  }
  const u0 = span * (0.97 - np * (o.pstep ?? 0.13));
  for (let k = 0; k < ns; k++) {
    const uc = u0 - k * (u0 - span * 0.08) / ns;
    const L = depth * (o.slen ?? 0.62) * (1 - k * 0.06);
    pts.push([uc - (u0 - span * 0.08) / ns * 0.3, L]);
    pts.push([uc - (u0 - span * 0.08) / ns * 0.85, L * 0.86]);
  }
  pts.push([0, depth * 0.42]);
  return pts;
}
// shading bias that draws soft dark gaps between feathers (for card matFn)
export function featherBias(u, v, span, depth, o = {}) {
  const np = o.prim ?? 4;
  const fw = span * (o.pstep ?? 0.13);
  if (v < depth * (o.covert ?? 0.3)) return v < depth * (o.covert ?? 0.3) - 1.2 ? 0 : -0.35;
  const f = ((span * 0.97 - u) / fw) % 1;
  return (f > 0.82 || f < 0.04) ? -0.4 : 0;
}

// Feathered wing built from individually outlined feather cards fanning from the wrist.
// root: local 3D shoulder point; U: unit dir along the arm (outward); V: unit dir toward the
// trailing edge. o: {arm, n, len, a0, a1 (fan angles, radians from U toward V), fw (feather width),
// baseSpan (0..1 of arm used by feather roots), decay, armW, armMat, mat(k, n, f) -> material}
export function featherWing(s, root, U, V, o) {
  const n = o.n || 6, arm = o.arm, len = o.len, fw = o.fw || len * 0.28;
  const a0 = o.a0 ?? -0.25, a1 = o.a1 ?? 1.45;
  const dz = (o.dz ?? 1.9) * s.S;
  const P = (a, b) => [root[0] + U[0] * a + V[0] * b, root[1] + U[1] * a + V[1] * b, root[2] + U[2] * a + V[2] * b];
  for (let k = 0; k < n; k++) {
    const f = k / Math.max(1, n - 1);
    const th = a0 + (a1 - a0) * Math.pow(f, o.fanPow ?? 1);
    const base = arm * (1 - f * (o.baseSpan ?? 0.85));
    const L = len * (o.lens ? o.lens[k] : (1 - Math.abs(f - (o.peak ?? 0.15)) * (o.decay ?? 0.55)));
    const d = [Math.cos(th), Math.sin(th)];
    const dir = [U[0] * d[0] + V[0] * d[1], U[1] * d[0] + V[1] * d[1], U[2] * d[0] + V[2] * d[1]];
    const acr = [-U[0] * d[1] + V[0] * d[0], -U[1] * d[1] + V[1] * d[0], -U[2] * d[1] + V[2] * d[0]];
    const w = fw * (o.wk ? o.wk(f) : 1);
    const poly = [[-w * 0.2, -w * 0.5], [L * 0.7, -w * 0.5], [L * 0.9, -w * 0.38], [L, -w * 0.08], [L * 0.97, w * 0.2], [L * 0.86, w * 0.42], [L * 0.6, w * 0.5], [-w * 0.2, w * 0.5]];
    const m = o.mat(k, n, f);
    s.card(P(base, w * 0.15), dir, acr, poly, typeof m === 'function' ? m : (u) => (o.tipMat && u > L * (o.tipAt ?? 0.62)) ? o.tipMat(k, n, f) : m, { bulge: 0.55, zBias: (n - k) * dz * (o.order ?? 1), heatFn: o.heatFn, grp: s.group((o.gname || 'fw') + k) });
  }
  // arm / covert band on top
  if (o.armMat) {
    const aw = o.armW || fw * 1.2;
    const poly = [[-aw * 0.3, -aw * 0.35], [arm * 0.55, -aw * 0.55], [arm + aw * 0.25, -aw * 0.1], [arm + aw * 0.1, aw * 0.45], [arm * 0.5, aw * 0.75], [-aw * 0.2, aw * 0.6]];
    s.card(root, U, V, poly, o.armMat, { bulge: 0.6, zBias: (n + 1.5) * dz, grp: s.group((o.gname || 'fw') + 'arm') });
  }
}

export { hash, noise1, bez3, clamp, TAU };
