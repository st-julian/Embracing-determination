// mt/voxel/kit.js — shared voxel-art kit (owner: architecture). Pure JS, no three import: mesh builders take THREE.
// A VoxelModel is a dense sx*sy*sz grid of sRGB colours (y up, x right, z towards the camera / screen-down). Build
// models in code with the primitives below, then meshVoxels() turns one into a BufferGeometry: hidden faces culled,
// per-vertex ambient occlusion baked into the vertex colour (the classic voxel AO, diagonal flipped against
// anisotropy), a gentle per-face tint so blocks read even under flat light, colours converted to linear for three.
// Contract (used by the voxel world and the voxel units): keep one voxel size per family so the art reads as one
// world — VOXEL_M metres per voxel for characters and props; terrain blocks are TERRAIN_M.

export const VOXEL_M = 1 / 10;     // characters, props, structures: 10 voxels per metre
export const TERRAIN_M = 1 / 2;    // ground blocks: 0.5 m (5 prop voxels)
// High-detail pass ("a voxel version of Black/White"): characters are modelled at CHAR_M (a trainer ~44 voxels tall,
// the runtime scales each model to its gameplay size), props and structures at DETAIL_M, ground detail <= 1/8 m.
export const CHAR_M = 1 / 25;
export const DETAIL_M = 1 / 20;

const FILLED = 1 << 24;

export class VoxelModel {
  constructor(sx, sy, sz) {
    this.sx = sx | 0; this.sy = sy | 0; this.sz = sz | 0;
    this.v = new Uint32Array(this.sx * this.sy * this.sz);
  }
  idx(x, y, z) { return (y * this.sz + z) * this.sx + x; }
  inside(x, y, z) { return x >= 0 && y >= 0 && z >= 0 && x < this.sx && y < this.sy && z < this.sz; }
  /** colour as 0xRRGGBB (sRGB) or null; outside the grid reads as empty */
  get(x, y, z) { if (!this.inside(x, y, z)) return null; const c = this.v[this.idx(x, y, z)]; return c ? c & 0xffffff : null; }
  filled(x, y, z) { return this.inside(x, y, z) && this.v[this.idx(x, y, z)] !== 0; }
  /** c: 0xRRGGBB, a function (x,y,z) => 0xRRGGBB|null (paint with noise / gradients), or null to carve */
  set(x, y, z, c) {
    x = Math.floor(x); y = Math.floor(y); z = Math.floor(z);
    if (!this.inside(x, y, z)) return this;
    const col = typeof c === 'function' ? c(x, y, z) : c;
    this.v[this.idx(x, y, z)] = col == null ? 0 : (FILLED | (col & 0xffffff));
    return this;
  }
  /** inclusive integer box */
  box(x0, y0, z0, x1, y1, z1, c) {
    for (let y = Math.max(0, y0); y <= Math.min(this.sy - 1, y1); y++)
      for (let z = Math.max(0, z0); z <= Math.min(this.sz - 1, z1); z++)
        for (let x = Math.max(0, x0); x <= Math.min(this.sx - 1, x1); x++) this.set(x, y, z, c);
    return this;
  }
  /** ellipsoid centred at (cx,cy,cz) in voxel units (half-integers centre on a voxel), radii rx,ry,rz */
  ellipsoid(cx, cy, cz, rx, ry, rz, c) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let z = Math.floor(cz - rz); z <= Math.ceil(cz + rz); z++)
        for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
          const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, dz = (z + 0.5 - cz) / rz;
          if (dx * dx + dy * dy + dz * dz <= 1) this.set(x, y, z, c);
        }
    return this;
  }
  sphere(cx, cy, cz, r, c) { return this.ellipsoid(cx, cy, cz, r, r, r, c); }
  /** vertical cylinder (y from y0 to y1 inclusive), elliptical section rx,rz */
  cylinder(cx, cz, y0, y1, rx, rz, c) {
    for (let y = y0; y <= y1; y++)
      for (let z = Math.floor(cz - rz); z <= Math.ceil(cz + rz); z++)
        for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
          const dx = (x + 0.5 - cx) / rx, dz = (z + 0.5 - cz) / rz;
          if (dx * dx + dz * dz <= 1) this.set(x, y, z, c);
        }
    return this;
  }
  /** copy the x < sx/2 half onto the other half (symmetric characters: model one side, mirror) */
  mirrorX() {
    const h = this.sx >> 1;
    for (let y = 0; y < this.sy; y++) for (let z = 0; z < this.sz; z++) for (let x = 0; x < h; x++)
      this.v[this.idx(this.sx - 1 - x, y, z)] = this.v[this.idx(x, y, z)];
    return this;
  }
  /** recolour every filled voxel: fn(x,y,z,c) => 0xRRGGBB|null */
  paint(fn) {
    for (let y = 0; y < this.sy; y++) for (let z = 0; z < this.sz; z++) for (let x = 0; x < this.sx; x++) {
      const i = this.idx(x, y, z), c = this.v[i]; if (!c) continue;
      const n = fn(x, y, z, c & 0xffffff); this.v[i] = n == null ? 0 : (FILLED | (n & 0xffffff));
    }
    return this;
  }
  count() { let n = 0; for (let i = 0; i < this.v.length; i++) if (this.v[i]) n++; return n; }
}

// ---- colour helpers (sRGB ints) -------------------------------------------------------------------------------
export function hash3(x, y, z, seed = 0) {
  let h = (x * 374761393 + y * 668265263 + z * 2147483647 + seed * 144665) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
export const rgb = (r, g, b) => ((r & 255) << 16) | ((g & 255) << 8) | (b & 255);
export function scale(c, f) {
  const cl = v => Math.max(0, Math.min(255, Math.round(v)));
  return rgb(cl(((c >> 16) & 255) * f), cl(((c >> 8) & 255) * f), cl((c & 255) * f));
}
export function mix(a, b, t) {
  const l = (s) => Math.round(((a >> s) & 255) + (((b >> s) & 255) - ((a >> s) & 255)) * t);
  return rgb(l(16), l(8), l(0));
}
/** deterministic +-amt brightness speckle — the hand-placed look of voxel art; use as a set()/paint() colour fn */
export const speckle = (c, amt = 0.06, seed = 0) => (x, y, z) => scale(c, 1 + (hash3(x, y, z, seed) * 2 - 1) * amt);

// ---- meshing ----------------------------------------------------------------------------------------------------
const AO_CURVE = [1.0, 0.8, 0.66, 0.52];                         // 0..3 occluders at a vertex
const FACE_TINT = { px: 0.9, nx: 0.9, py: 1.0, ny: 0.66, pz: 0.95, nz: 0.84 };
const toLin = (u) => { const s = u / 255; return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
const LIN = new Float32Array(256); for (let i = 0; i < 256; i++) LIN[i] = toLin(i);

// face table: normal, the 4 corners (as offsets of the voxel's min corner) in CCW order seen from outside,
// and the two in-plane axes used to look up the AO neighbours.
const FACES = [
  { k: 'px', n: [1, 0, 0], c: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]] },
  { k: 'nx', n: [-1, 0, 0], c: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]] },
  { k: 'py', n: [0, 1, 0], c: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]] },
  { k: 'ny', n: [0, -1, 0], c: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]] },
  { k: 'pz', n: [0, 0, 1], c: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]] },
  { k: 'nz', n: [0, 0, -1], c: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]] },
];

/**
 * Raw mesh arrays for a model (no THREE): {positions, normals, colors (linear), indices, faces}.
 * opts.size   metres per voxel (default VOXEL_M)
 * opts.pivot  [x,y,z] in voxel units that lands on the origin (default: centre of x/z, bottom of y)
 * opts.ao     bake ambient occlusion (default true); opts.tint per-face tint (default true)
 * opts.solid  (x,y,z) => bool extra occupancy outside the grid (e.g. neighbouring terrain chunks) — culls and occludes
 * opts.greedy merge coplanar neighbouring faces with the same colour and a uniform AO level into one quad
 *             (default true; looks identical, far fewer triangles on flat colour areas)
 */
export function meshArrays(model, opts = {}) {
  const size = opts.size || VOXEL_M, ao = opts.ao !== false, tint = opts.tint !== false, greedy = opts.greedy !== false;
  const piv = opts.pivot || [model.sx / 2, 0, model.sz / 2];
  const ext = opts.solid;
  const occ = (x, y, z) => model.filled(x, y, z) || (!!ext && !model.inside(x, y, z) && ext(x, y, z));
  const dims = [model.sx, model.sy, model.sz];
  const P = [], N = [], C = [], I = [];
  let vert = 0;
  const lv = [0, 0, 0, 0], p = [0, 0, 0];
  // AO levels of the 4 corners of voxel (x,y,z)'s face f into lv
  const faceAO = (f, x, y, z) => {
    const nx = f.n[0], ny = f.n[1], nz = f.n[2], ox = x + nx, oy = y + ny, oz = z + nz;
    for (let i = 0; i < 4; i++) {
      if (!ao) { lv[i] = 0; continue; }
      const cc = f.c[i];
      // the two in-plane directions pointing from the face centre towards this corner, one layer outside the face
      const dx = nx ? 0 : (cc[0] ? 1 : -1), dy = ny ? 0 : (cc[1] ? 1 : -1), dz = nz ? 0 : (cc[2] ? 1 : -1);
      let s1, s2, cr;
      if (nx) { s1 = occ(ox, oy + dy, oz); s2 = occ(ox, oy, oz + dz); cr = occ(ox, oy + dy, oz + dz); }
      else if (ny) { s1 = occ(ox + dx, oy, oz); s2 = occ(ox, oy, oz + dz); cr = occ(ox + dx, oy, oz + dz); }
      else { s1 = occ(ox + dx, oy, oz); s2 = occ(ox, oy + dy, oz); cr = occ(ox + dx, oy + dy, oz); }
      lv[i] = s1 && s2 ? 3 : (s1 ? 1 : 0) + (s2 ? 1 : 0) + (cr ? 1 : 0);
    }
  };
  // one quad: min voxel corner (x,y,z), extent w along axis ua and h along axis va (1x1 = a single face)
  const emit = (f, ua, va, x, y, z, w, h, col) => {
    const t = tint ? FACE_TINT[f.k] : 1;
    const r = LIN[(col >> 16) & 255] * t, g = LIN[(col >> 8) & 255] * t, b = LIN[col & 255] * t;
    for (let i = 0; i < 4; i++) {
      const cc = f.c[i]; p[0] = x; p[1] = y; p[2] = z;
      for (let a = 0; a < 3; a++) p[a] += cc[a] * (a === ua ? w : a === va ? h : 1);
      P.push((p[0] - piv[0]) * size, (p[1] - piv[1]) * size, (p[2] - piv[2]) * size);
      N.push(f.n[0], f.n[1], f.n[2]);
      const a = AO_CURVE[lv[i]];
      C.push(r * a, g * a, b * a);
    }
    // flip the quad diagonal so AO interpolates without the anisotropy crease
    if (lv[0] + lv[2] > lv[1] + lv[3]) I.push(vert + 1, vert + 2, vert + 3, vert + 1, vert + 3, vert);
    else I.push(vert, vert + 1, vert + 2, vert, vert + 2, vert + 3);
    vert += 4;
  };
  const xyz = [0, 0, 0];
  for (const f of FACES) {
    const na = f.n[0] ? 0 : f.n[1] ? 1 : 2, ua = (na + 1) % 3, va = (na + 2) % 3;
    const W = dims[ua], H = dims[va];
    const mask = new Float64Array(W * H);   // 0 = nothing to merge; else 1 + colour * 4 + uniform AO level
    for (let k = 0; k < dims[na]; k++) {
      mask.fill(0);
      for (let v = 0; v < H; v++) for (let u = 0; u < W; u++) {
        xyz[na] = k; xyz[ua] = u; xyz[va] = v;
        const x = xyz[0], y = xyz[1], z = xyz[2];
        const raw = model.v[model.idx(x, y, z)]; if (!raw) continue;
        if (occ(x + f.n[0], y + f.n[1], z + f.n[2])) continue;
        faceAO(f, x, y, z);
        const col = raw & 0xffffff;
        if (greedy && lv[0] === lv[1] && lv[1] === lv[2] && lv[2] === lv[3]) mask[v * W + u] = 1 + col * 4 + lv[0];
        else emit(f, ua, va, x, y, z, 1, 1, col);
      }
      // greedy rectangles over faces with the same colour and the same uniform AO level
      for (let v = 0; v < H; v++) for (let u = 0; u < W;) {
        const key = mask[v * W + u]; if (!key) { u++; continue; }
        let w = 1; while (u + w < W && mask[v * W + u + w] === key) w++;
        let h = 1;
        grow: for (; v + h < H; h++) for (let i = 0; i < w; i++) if (mask[(v + h) * W + u + i] !== key) break grow;
        for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) mask[(v + j) * W + u + i] = 0;
        const l = (key - 1) % 4; lv[0] = lv[1] = lv[2] = lv[3] = l;
        xyz[na] = k; xyz[ua] = u; xyz[va] = v;
        emit(f, ua, va, xyz[0], xyz[1], xyz[2], w, h, (key - 1 - l) / 4);
        u += w;
      }
    }
  }
  return {
    positions: new Float32Array(P), normals: new Float32Array(N), colors: new Float32Array(C),
    indices: vert > 65535 ? new Uint32Array(I) : new Uint16Array(I), faces: vert / 4,
  };
}

/** BufferGeometry from meshArrays (vertex colours, flat normals). */
export function meshVoxels(THREE, model, opts) {
  const a = meshArrays(model, opts);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(a.positions, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(a.normals, 3));
  g.setAttribute('color', new THREE.BufferAttribute(a.colors, 3));
  g.setIndex(new THREE.BufferAttribute(a.indices, 1));
  g.computeBoundingSphere(); g.computeBoundingBox();
  return g;
}

/** The shared voxel material: lit, vertex-coloured, flat. One instance per renderer is plenty. */
let _mat = null;
export function voxelMaterial(THREE, opts = {}) {
  if (_mat && !opts.fresh) return _mat;
  const m = new THREE.MeshLambertMaterial({ vertexColors: true, ...(opts.params || {}) });
  if (!opts.fresh) _mat = m;
  return m;
}
