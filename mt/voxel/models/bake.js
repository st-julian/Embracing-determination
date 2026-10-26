// mt/voxel/models/bake.js — clean BW-style tone bands for the high-detail voxel characters. Owner: voxel character
// design. Normals come from a smoothed occupancy field (separable box blur, 2 passes ≈ gaussian), the sky-from-above
// shading is quantised into 3 clean bands per material (shade / base / light; the highlight tone only on top-facing
// voxels of glossy materials), then a 3D majority filter removes salt-and-pepper so band edges are clean contours.
//
//   bakeBands({ w, h, d, idx(x,y,z), occ: Uint8Array, mat: Uint8Array (0 = keep colour), ramps[m] = [5 ints],
//               hi[m], bias[m], mode[m] ('skin' = flat bright + one shade underneath), col: Uint32Array (in/out) })

function blur3(src, w, h, d, r) {
  const a = new Float32Array(src.length), b = new Float32Array(src.length);
  const R = r, norm = 1 / (2 * R + 1);
  // x
  for (let y = 0; y < h; y++) for (let z = 0; z < d; z++) {
    const row = (y * d + z) * w; let s = 0;
    for (let x = -R; x <= R; x++) s += x >= 0 && x < w ? src[row + x] : 0;
    for (let x = 0; x < w; x++) { a[row + x] = s * norm; const o = x - R, n = x + R + 1; if (o >= 0) s -= src[row + o]; if (n < w) s += src[row + n]; }
  }
  // z
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const base = y * d * w + x; let s = 0;
    for (let z = -R; z <= R; z++) s += z >= 0 && z < d ? a[base + z * w] : 0;
    for (let z = 0; z < d; z++) { b[base + z * w] = s * norm; const o = z - R, n = z + R + 1; if (o >= 0) s -= a[base + o * w]; if (n < d) s += a[base + n * w]; }
  }
  // y
  for (let z = 0; z < d; z++) for (let x = 0; x < w; x++) {
    const base = z * w + x, sy = d * w; let s = 0;
    for (let y = -R; y <= R; y++) s += y >= 0 && y < h ? b[base + y * sy] : 0;
    for (let y = 0; y < h; y++) { a[base + y * sy] = s * norm; const o = y - R, n = y + R + 1; if (o >= 0) s -= b[base + o * sy]; if (n < h) s += b[base + n * sy]; }
  }
  return a;
}

const luma = (c) => (0.299 * ((c >> 16) & 255) + 0.587 * ((c >> 8) & 255) + 0.114 * (c & 255)) / 255;
export function bakeBands(o) {
  const { w, h, d, occ, mat, ramps, col } = o, N = w * h * d;
  // very light materials (yellow fur, cream, pale stone) keep their base tone on top: their light tone washes out
  const light = ramps.map((r) => (r ? luma(r[2]) > 0.66 : false));
  const idx = (x, y, z) => (y * d + z) * w + x;
  // smoothed occupancy (2 box passes, radius 2) -> normal = -gradient
  let S = new Float32Array(N); for (let i = 0; i < N; i++) S[i] = occ[i] ? 1 : 0;
  S = blur3(blur3(S, w, h, d, 2), w, h, d, 2);
  const at = (x, y, z) => (x < 0 || y < 0 || z < 0 || x >= w || y >= h || z >= d ? 0 : S[idx(x, y, z)]);
  const filled = (x, y, z) => x >= 0 && y >= 0 && z >= 0 && x < w && y < h && z < d && occ[idx(x, y, z)];
  // material speckle cleanup: a lone surface voxel whose material disagrees with its surface neighbourhood takes
  // the dominant neighbouring material (sprite pattern noise -> clean markings); fixed voxels never change
  if (o.cleanMat !== false) for (let pass = 0; pass < 2; pass++) {
    const src = mat.slice();
    for (let y = 1; y < h - 1; y++) for (let z = 1; z < d - 1; z++) for (let x = 1; x < w - 1; x++) {
      const i = idx(x, y, z); if (!occ[i] || !src[i] || (o.fixed && o.fixed[i] >= 0) || (o.keepMat && o.keepMat[src[i]])) continue;
      const cnt = new Map(); let own = 0;
      for (let dz = -1; dz <= 1; dz++) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy && !dz) continue; const j = idx(x + dx, y + dy, z + dz); if (!occ[j] || !src[j] || (o.fixed && o.fixed[j] >= 0)) continue;
        if (src[j] === src[i]) own++; else cnt.set(src[j], (cnt.get(src[j]) || 0) + 1);
      }
      let best = 0, bn = 0; for (const [m, n] of cnt) if (n > bn) { bn = n; best = m; }
      if (own <= 3 && bn >= 9 && (!o.keepMat || !o.keepMat[src[i]])) mat[i] = best;
    }
  }
  const tone = new Int8Array(N).fill(-1), surf = new Uint8Array(N);
  for (let y = 0; y < h; y++) for (let z = 0; z < d; z++) for (let x = 0; x < w; x++) {
    const i = idx(x, y, z); if (!occ[i] || !mat[i]) continue;
    const m = mat[i];
    if (o.fixed && o.fixed[i] >= 0) { tone[i] = o.fixed[i]; continue; }
    const isSurf = !(filled(x + 1, y, z) && filled(x - 1, y, z) && filled(x, y + 1, z) && filled(x, y - 1, z) && filled(x, y, z + 1) && filled(x, y, z - 1));
    if (!isSurf) { tone[i] = 2; continue; }
    surf[i] = 1;
    let nx = at(x - 1, y, z) - at(x + 1, y, z), ny = at(x, y - 1, z) - at(x, y + 1, z), nz = at(x, y, z - 1) - at(x, y, z + 1);
    const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    let t;
    if (o.mode && o.mode[m] === 'skin') t = ny < -0.5 ? 1 : 2;
    else if (o.mode && o.mode[m] === 'flat') t = 2;
    else {
      // tops get the light tone, flanks the base, undersides the shade; the pale highlight tone (4) only for
      // glossy materials — on a 50° game camera the tops are most of what you see, so they must keep the hue
      const s = ny * 0.8 + 0.12 + (o.bias ? o.bias[m] || 0 : 0);
      t = s < -0.22 ? 1 : s < 0.52 || light[m] ? 2 : 3;
      if (t === 3 && o.gloss && o.gloss[m] && ny > 0.9) t = 4;
    }
    tone[i] = t;
  }
  // majority filter over same-material surface neighbours (clean band contours)
  for (let pass = 0; pass < 2; pass++) {
    const src = tone.slice();
    for (let y = 0; y < h; y++) for (let z = 0; z < d; z++) for (let x = 0; x < w; x++) {
      const i = idx(x, y, z); if (!surf[i] || (o.fixed && o.fixed[i] >= 0)) continue;
      const m = mat[i], cnt = [0, 0, 0, 0, 0];
      for (let dz = -1; dz <= 1; dz++) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy && !dz) continue; const X = x + dx, Y = y + dy, Z = z + dz; if (!filled(X, Y, Z)) continue;
        const j = idx(X, Y, Z); if (!surf[j] || mat[j] !== m) continue; cnt[src[j]]++;
      }
      const own = cnt[src[i]]; let best = src[i], bn = own;
      for (let t = 0; t < 5; t++) if (cnt[t] > bn) { bn = cnt[t]; best = t; }
      if (own <= 2 && bn >= 4) tone[i] = best;
    }
  }
  for (let i = 0; i < N; i++) if (occ[i] && mat[i] && tone[i] >= 0) col[i] = (ramps[mat[i]][tone[i]] & 0xffffff) | 0x1000000;
  return col;
}
