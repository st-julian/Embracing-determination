// mt/voxel/models/rig.js — modelling helpers for the voxel characters. Owner: voxel character design.
//
// Characters are modelled in ONE labelled canvas in unit-like coordinates (x right, y up, z = facing / toward the
// camera), part by part (`c.part('head')` then primitives), then `c.build()` splits the canvas into the rig contract:
//   { anim, parts: { name: { model: VoxelModel, pivot, at, parent? } }, height, radius }
// pivot = the joint in the part's own voxel grid, at = the same joint in the parent's grid (or the unit frame: feet
// centre on the ground, origin at canvas (W/2, 0, D/2)). Character LEFT is +x (the unit faces +z).
import { VoxelModel, hash3, scale, mix } from '../kit.js';

export { scale, mix, hash3 };
export const hex = (s) => parseInt(String(s).replace('#', ''), 16);

/** a VoxelModel that also records which part painted every voxel */
export class Canvas extends VoxelModel {
  constructor(w, h, d) {
    super(w, h, d);
    this.lab = new Uint8Array(this.v.length);
    this.names = ['body']; this.cur = 0; this.joints = {}; this.parents = {};
  }
  part(name) { let i = this.names.indexOf(name); if (i < 0) { i = this.names.length; this.names.push(name); } this.cur = i; return this; }
  set(x, y, z, c) {
    x = Math.floor(x); y = Math.floor(y); z = Math.floor(z);
    if (!this.inside(x, y, z)) return this;
    super.set(x, y, z, c);
    this.lab[this.idx(x, y, z)] = this.cur;
    return this;
  }
  /** unit coords -> canvas coords: ux 0 = W/2, uz 0 = D/2 */
  get ox() { return this.sx / 2; }
  get oz() { return this.sz / 2; }
  /** superellipsoid ("rounded box"): p = 2 ellipsoid, 3–5 = soft cube */
  rbox(cx, cy, cz, rx, ry, rz, c, p = 4) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let z = Math.floor(cz - rz); z <= Math.ceil(cz + rz); z++)
        for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
          const dx = Math.abs((x + 0.5 - cx) / rx), dy = Math.abs((y + 0.5 - cy) / ry), dz = Math.abs((z + 0.5 - cz) / rz);
          if (dx ** p + dy ** p + dz ** p <= 1) this.set(x, y, z, c);
        }
    return this;
  }
  /** tapered tube between two points (radius r0 -> r1), sphere-swept */
  tube(a, b, r0, r1, c) {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), n = Math.max(2, Math.ceil(L * 2));
    for (let i = 0; i <= n; i++) { const t = i / n; this.sphere(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, r0 + (r1 - r0) * t, c); }
    return this;
  }
  /** paint the first filled voxel hit when looking along -z (front) at column (x, y): face decals (eyes, mouths) */
  front(x, y, c, depth = 1, zFrom = this.sz - 1) {
    for (let z = zFrom; z >= 0; z--) if (this.filled(x, y, z)) { for (let k = 0; k < depth; k++) if (this.filled(x, y, z - k)) this.recolor(x, y, z - k, c); return z; }
    return -1;
  }
  /** same from the side (+x looking toward -x when dir = 1, -x looking +x when dir = -1) */
  side(z, y, c, dir = 1) {
    if (dir > 0) { for (let x = this.sx - 1; x >= 0; x--) if (this.filled(x, y, z)) { this.recolor(x, y, z, c); return x; } }
    else for (let x = 0; x < this.sx; x++) if (this.filled(x, y, z)) { this.recolor(x, y, z, c); return x; }
    return -1;
  }
  /** change a voxel colour without changing its part label */
  recolor(x, y, z, c) { const i = this.idx(x, y, z); if (!this.v[i]) return this; const col = typeof c === 'function' ? c(x, y, z) : c; this.v[i] = (1 << 24) | (col & 0xffffff); return this; }
  /** recolour filled voxels of the current part (or all parts when any = true) with fn(x,y,z,c) */
  shade(fn, any = false) {
    for (let y = 0; y < this.sy; y++) for (let z = 0; z < this.sz; z++) for (let x = 0; x < this.sx; x++) {
      const i = this.idx(x, y, z), c = this.v[i]; if (!c || (!any && this.lab[i] !== this.cur)) continue;
      const n = fn(x, y, z, c & 0xffffff); if (n != null) this.v[i] = (1 << 24) | (n & 0xffffff);
    }
    return this;
  }
  /** mirror x < W/2 onto the right half, swapping L/R part names (armL <-> armR …) */
  mirror() {
    const h = this.sx >> 1, swap = (n) => (/L$/.test(n) ? n.replace(/L$/, 'R') : /R$/.test(n) ? n.replace(/R$/, 'L') : n);
    // NB: the low-x half is the character's RIGHT (+x = left); we model the right side and mirror it to the left
    for (let y = 0; y < this.sy; y++) for (let z = 0; z < this.sz; z++) for (let x = 0; x < h; x++) {
      const s = this.idx(x, y, z), d = this.idx(this.sx - 1 - x, y, z);
      this.v[d] = this.v[s];
      const nm = swap(this.names[this.lab[s]]);
      let li = this.names.indexOf(nm); if (li < 0) { li = this.names.length; this.names.push(nm); }
      this.lab[d] = this.v[s] ? li : 0;
    }
    for (const k of Object.keys(this.joints)) { const m = swap(k); if (m !== k && !this.joints[m]) { const j = this.joints[k]; this.joints[m] = [this.sx - j[0], j[1], j[2]]; this.parents[m] = this.parents[k] && swap(this.parents[k]); } }
    return this;
  }
  /** copy every voxel of part `from` to the mirrored x position, labelled `to` (asymmetric models, wings, arms) */
  mirrorPart(from, to) {
    const fi = this.names.indexOf(from); if (fi < 0) return this;
    const keep = this.cur; this.part(to); const ti = this.cur; this.cur = keep;
    for (let y = 0; y < this.sy; y++) for (let z = 0; z < this.sz; z++) for (let x = 0; x < this.sx; x++) {
      const s = this.idx(x, y, z); if (!this.v[s] || this.lab[s] !== fi) continue;
      const d = this.idx(this.sx - 1 - x, y, z); this.v[d] = this.v[s]; this.lab[d] = ti;
    }
    const j = this.joints[from]; if (j && !this.joints[to]) { this.joints[to] = [this.sx - j[0], j[1], j[2]]; if (this.parents[from]) this.parents[to] = this.parents[from]; }
    return this;
  }
  /** joint of a part in canvas coordinates (voxel-corner units) + its parent part */
  joint(name, at, parent) { this.joints[name] = at; if (parent) this.parents[name] = parent; return this; }
  /** gentle hand-made look: brightness speckle on everything */
  speckle(amt = 0.035, seed = 1) { return this.shade((x, y, z, c) => scale(c, 1 + (hash3(x, y, z, seed) * 2 - 1) * amt), true); }

  build(anim, extra = {}) {
    const N = this.names.length, bb = this.names.map(() => [1e9, 1e9, 1e9, -1e9, -1e9, -1e9]);
    for (let y = 0; y < this.sy; y++) for (let z = 0; z < this.sz; z++) for (let x = 0; x < this.sx; x++) {
      const i = this.idx(x, y, z); if (!this.v[i]) continue; const b = bb[this.lab[i]];
      if (x < b[0]) b[0] = x; if (y < b[1]) b[1] = y; if (z < b[2]) b[2] = z; if (x > b[3]) b[3] = x; if (y > b[4]) b[4] = y; if (z > b[5]) b[5] = z;
    }
    const parts = {}; let top = 0, rad = 0;
    for (let li = 0; li < N; li++) {
      const b = bb[li]; if (b[3] < b[0]) continue;
      const name = this.names[li], m = new VoxelModel(b[3] - b[0] + 1, b[4] - b[1] + 1, b[5] - b[2] + 1);
      for (let y = b[1]; y <= b[4]; y++) for (let z = b[2]; z <= b[5]; z++) for (let x = b[0]; x <= b[3]; x++) {
        const i = this.idx(x, y, z); if (this.v[i] && this.lab[i] === li) m.v[m.idx(x - b[0], y - b[1], z - b[2])] = this.v[i];
      }
      const j = this.joints[name] || [(b[0] + b[3] + 1) / 2, b[1], (b[2] + b[5] + 1) / 2];
      parts[name] = { model: m, pivot: [j[0] - b[0], j[1] - b[1], j[2] - b[2]], _bb: b, _j: j };
      top = Math.max(top, b[4] + 1);
      rad = Math.max(rad, Math.abs(b[0] - this.ox), Math.abs(b[3] + 1 - this.ox), Math.abs(b[2] - this.oz), Math.abs(b[5] + 1 - this.oz));
    }
    for (const [name, p] of Object.entries(parts)) {
      let par = this.parents[name];
      if (par && !parts[par]) par = undefined;
      if (name !== 'body' && !par && parts.body) par = 'body';
      if (par === name) par = undefined;
      if (par) { const pb = parts[par]._bb; p.at = [p._j[0] - pb[0], p._j[1] - pb[1], p._j[2] - pb[2]]; p.parent = par; }
      else p.at = [p._j[0] - this.ox, p._j[1], p._j[2] - this.oz];
    }
    for (const p of Object.values(parts)) { delete p._bb; delete p._j; }
    return { anim, parts, height: extra.height ?? top, radius: extra.radius ?? Math.round(Math.min(rad, 0.75 * rad + 2)), ...extra };
  }
}

// ---- face kit ------------------------------------------------------------------------------------------------
/**
 * Big glossy eyes painted on the front surface: each eye w × h voxels at (x0 .. x0+w-1, y0 .. y0+h-1) from the centre
 * line (x0 measured outward from the middle), iris colour, 1 white sparkle at the upper outer corner, optional dark lid.
 */
export function eyes(c, cx, y0, gap, w, h, iris, o = {}) {
  const white = o.white ?? 0xffffff, dark = o.pupil ?? 0x1a1426;
  for (const s of [-1, 1]) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const x = s < 0 ? Math.floor(cx - gap / 2 - 1 - i) : Math.floor(cx + gap / 2 + i);
      const inner = s < 0 ? i === 0 : i === 0;
      let col = j === h - 1 && h > 2 ? iris : (j >= h - 2 && !inner ? iris : dark);
      if (o.flat) col = dark;
      if (j === h - 1 && i === w - 1 && h > 1 && !o.flat) col = white;   // sparkle (upper outer)
      if (o.lid && j === h - 1) col = o.lid;
      c.front(x, y0 + j, col, 1, o.zFrom ?? c.sz - 1);
    }
  }
}
