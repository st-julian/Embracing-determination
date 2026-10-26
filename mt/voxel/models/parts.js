// mt/voxel/models/parts.js — reusable anatomy for the voxel characters (eyes, legs, ears, flames, leaves, fins).
// Owner: voxel character design. All coordinates are canvas voxels (see rig.js); x < ox is the character's RIGHT.
import { hash3, scale, mix } from './rig.js';

export const INK = 0x1c1626;          // pupils, nostrils, claws-dark
export const WHITE = 0xfffdf6;

/** vertical gradient + speckle for the current part: top lighter, underside darker */
export function shadeBody(c, y0, y1, k = 0.16, sp = 0.035, seed = 3) {
  c.shade((x, y, z, col) => {
    const t = Math.max(0, Math.min(1, (y - y0) / Math.max(1, y1 - y0)));
    return scale(col, (1 - k / 2 + k * t) * (1 + (hash3(x, y, z, seed) * 2 - 1) * sp));
  });
}

/**
 * One glossy eye on the front surface. x0 = inner column, dir +1 for the left eye (+x), -1 for the right eye.
 * Rows from the bottom: [iris…], [ink…], top row: ink with a white sparkle on the outer column.
 */
export function eye(c, x0, y0, w, h, dir, o = {}) {
  const iris = o.iris ?? INK, zf = o.zFrom ?? c.sz - 1;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const x = x0 + dir * i;
    let col = INK;
    if (j === 0 && h >= 3) col = iris;
    if (j === 0 && h === 2 && i === 0) col = iris;
    if (j === h - 1 && i === w - 1) col = WHITE;
    if (o.sparkle2 && j === h - 2 && i === w - 1 && h >= 3) col = mix(iris, WHITE, 0.4);
    c.front(x, y0 + j, col, o.deep ?? 1, zf);
  }
  if (o.brow != null) {        // angry/fierce brow: a slanted dark line above the eye, low at the inner corner
    for (let i = 0; i < w + 1; i++) c.front(x0 + dir * (i - (o.browIn ? 1 : 0)), y0 + h + (i >= Math.ceil((w + 1) / 2) ? 1 : 0), o.brow, 1, zf);
  }
}
export function eyes(c, gap, y0, w, h, o = {}) {
  const cx = c.ox;
  eye(c, Math.floor(cx - gap / 2 - 1), y0, w, h, -1, o);
  eye(c, Math.floor(cx + gap / 2), y0, w, h, +1, o);
}

/** four legs (box columns with a paw block), parts legFR/FL/BR/BL; joints at the hips (y = top) */
export function legs4(c, o) {
  const { xOff, zF, zB, len, w = 2, d = 2, col, paw, pawH = 1, top = len + 2, sock, splay = 0 } = o;
  for (const [nm, s, z0] of [['legFR', -1, zF], ['legFL', 1, zF], ['legBR', -1, zB], ['legBL', 1, zB]]) {
    c.part(nm);
    const x0 = s < 0 ? Math.floor(c.ox - xOff - w) - splay : Math.floor(c.ox + xOff) + splay;
    c.box(x0, 0, z0, x0 + w - 1, top - 1, z0 + d - 1, col);
    if (sock) c.box(x0, 0, z0, x0 + w - 1, sock.h - 1, z0 + d - 1, sock.c);
    if (paw) c.box(x0, 0, z0, x0 + w - 1, pawH - 1, z0 + d, paw);   // toes stick out 1 forward
    c.joint(nm, [x0 + w / 2, len, z0 + d / 2], 'body');
  }
}

/**
 * pointed ear: base w × d at (cx ± w/2, y0, z0..z0+d-1), narrowing to a 1-voxel tip over h layers, leaning outward
 * by `lean` voxels per layer (dir: +1 left/+x, -1 right). Inner colour on the front face, tip colour on the top third.
 */
export function ear(c, cx, y0, z0, w, d, h, col, inner, tip, dir = 1, lean = 0.25) {
  for (let k = 0; k < h; k++) {
    const t = k / h, ww = Math.max(1, w * (1 - t) + 0.4), mid = cx + dir * lean * k;
    for (let x = Math.floor(mid - ww / 2); x < Math.ceil(mid + ww / 2); x++) for (let j = 0; j < d; j++) {
      let col2 = col;
      if (tip && k >= h - Math.max(1, Math.round(h * 0.34))) col2 = tip;
      else if (inner && j === d - 1 && ww > 1.8 && Math.abs(x + 0.5 - mid) < ww / 2 - 0.6) col2 = inner;
      c.set(x, y0 + k, z0 + j, col2);
    }
  }
}

/**
 * Voxel flame: a flickering cone from (x, y, z) upward, height h, base radius r. Core yellow-white, body orange, red
 * tips, plus loose sparks above. pal = [core, hot, mid, edge]. lean = [dx, dz] per layer.
 */
export const FIRE = [0xfff6c0, 0xffd23a, 0xff8a26, 0xe8401c];
export function flame(c, x, y, z, h, r, pal = FIRE, lean = [0, 0], seed = 1, sparks = 1) {
  for (let k = 0; k < h; k++) {
    const t = k / h, rr = r * Math.pow(1 - t, 0.75) + 0.35, cx = x + lean[0] * k, cz = z + lean[1] * k;
    for (let dz = -Math.ceil(rr); dz <= Math.ceil(rr); dz++) for (let dx = -Math.ceil(rr); dx <= Math.ceil(rr); dx++) {
      const q = Math.hypot(dx + 0.5 - (cx - Math.floor(cx)) + 0.0, dz + 0.5 - (cz - Math.floor(cz))) / rr;
      if (q > 1 + (hash3(dx, k, dz, seed) - 0.5) * 0.5) continue;
      const col = t > 0.72 ? pal[3] : q < 0.45 && t < 0.55 ? pal[0] : q < 0.75 ? pal[1] : pal[2];
      c.set(Math.floor(cx) + dx, y + k, Math.floor(cz) + dz, t > 0.5 && q > 0.7 ? pal[3] : col);
    }
  }
  // sparks
  for (let i = 0; i < sparks; i++) { const sx = Math.round(x + lean[0] * h + (hash3(i, 7, seed) - 0.5) * r * 2), sz = Math.round(z + lean[1] * h); c.set(sx, y + h + 1 + i, sz, i ? pal[2] : pal[1]); }
}

/** flat leaf (in the x/y plane, 1 voxel thick) from (x, y, z) pointing along (dx, dy), length L, width W */
export function leaf(c, x, y, z, dx, dy, L, W, col, vein, thick = 1) {
  const n = Math.hypot(dx, dy) || 1, ux = dx / n, uy = dy / n, px = -uy, py = ux;
  for (let t = 0; t <= L; t += 0.5) {
    const wv = W * Math.sin(Math.PI * Math.min(1, (t + 0.6) / (L + 0.6))) * 0.5;
    for (let s = -wv; s <= wv; s += 0.5) for (let k = 0; k < thick; k++) {
      const X = x + ux * t + px * s, Y = y + uy * t + py * s;
      c.set(X, Y, z + k, Math.abs(s) < 0.5 && vein ? vein : col);
    }
  }
}

/** recolour the current part's voxels inside an ellipsoid (markings, bellies, socks) */
export function patch(c, cx, cy, cz, rx, ry, rz, col, onlyPart = true) {
  c.shade((x, y, z, cur) => {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, dz = (z + 0.5 - cz) / rz;
    return dx * dx + dy * dy + dz * dz <= 1 ? (typeof col === 'function' ? col(x, y, z, cur) : col) : null;
  }, !onlyPart);
}

/**
 * Solid wing web: fills the triangles between consecutive feather lines (root -> tips[i], root -> tips[i+1]) up to
 * `reach` of their length (the feather tips stay scalloped), colour by distance t from the root via pick(t).
 */
export function wingWeb(c, root, tips, pick, reach = 0.86) {
  for (let i = 0; i < tips.length - 1; i++) {
    const A = tips[i], B = tips[i + 1];
    const L = Math.max(Math.hypot(A[0] - root[0], A[1] - root[1], A[2] - root[2]), Math.hypot(B[0] - root[0], B[1] - root[1], B[2] - root[2]));
    const st = 0.4 / L;
    for (let u = 0; u <= reach; u += st) for (let v = 0; v <= reach - u; v += st) {
      const P = [0, 1, 2].map((k) => root[k] + (A[k] - root[k]) * u + (B[k] - root[k]) * v);
      c.set(P[0], P[1], P[2], pick(u + v));
    }
  }
}
