// mt/ui/pixelclean.js — "clean shading" post-pass for menu-screen sprite bakes (title / lobby). Owner: front-end screens.
//
// The art library's renders carry fine lighting bands, 1-px stripes and dither speckle that read as noise when a
// sprite is shown big on a menu. This pass makes the clusters bolder, Gen-5 style, without touching the outline:
//   1. merge near-identical tones (ΔRGB below `merge`) into the more frequent one -> cleaner 3–4 tone ramps;
//   2. remove 1-px horizontal / vertical stripes (a pixel whose two opposite neighbours agree on another colour);
//   3. despeckle: a lone pixel whose 3×3 neighbourhood is dominated by one other colour takes that colour.
// The darkest tones (outline / inner lines, luma < `keepLuma`) and transparency are never changed or used to fill.

export function cleanSprite(d, w, h, o = {}) {
  const merge = o.merge ?? 22, keepLuma = o.keepLuma ?? 52, passes = o.passes ?? 2;
  const N = w * h, col = new Int32Array(N);
  const key = (i) => (d[i * 4 + 3] < 128 ? -1 : (d[i * 4] << 16) | (d[i * 4 + 1] << 8) | d[i * 4 + 2]);
  for (let i = 0; i < N; i++) col[i] = key(i);
  const luma = (c) => 0.299 * (c >> 16 & 255) + 0.587 * (c >> 8 & 255) + 0.114 * (c & 255);
  const keep = (c) => c < 0 || luma(c) < keepLuma;
  // 1. tone merge (frequency-ordered greedy clustering)
  const freq = new Map(); for (let i = 0; i < N; i++) if (col[i] >= 0) freq.set(col[i], (freq.get(col[i]) || 0) + 1);
  const cols = [...freq.keys()].sort((a, b) => freq.get(b) - freq.get(a));
  const map = new Map(), reps = [];
  const dist = (a, b) => Math.abs((a >> 16 & 255) - (b >> 16 & 255)) + Math.abs((a >> 8 & 255) - (b >> 8 & 255)) + Math.abs((a & 255) - (b & 255));
  for (const c of cols) {
    if (keep(c)) { map.set(c, c); continue; }
    let best = -1, bd = 1e9; for (const r of reps) { const dd = dist(c, r); if (dd < bd) { bd = dd; best = r; } }
    if (best >= 0 && bd < merge) map.set(c, best); else { reps.push(c); map.set(c, c); }
  }
  for (let i = 0; i < N; i++) if (col[i] >= 0) col[i] = map.get(col[i]);
  const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? -1 : col[y * w + x]);
  for (let p = 0; p < passes; p++) {
    const src = col.slice();
    const s = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? -1 : src[y * w + x]);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const c = src[y * w + x]; if (keep(c)) continue;
      // 2. stripes
      const u = s(x, y - 1), dn = s(x, y + 1), l = s(x - 1, y), r = s(x + 1, y);
      if (u === dn && u !== c && !keep(u)) { col[y * w + x] = u; continue; }
      if (l === r && l !== c && !keep(l)) { col[y * w + x] = l; continue; }
      // 3. speckle
      let own = 0; const cnt = new Map();
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { if (!i && !j) continue; const n = s(x + i, y + j); if (n === c) own++; else if (!keep(n)) cnt.set(n, (cnt.get(n) || 0) + 1); }
      if (own <= 1) { let bc = -1, bn = 0; for (const [k, v] of cnt) if (v > bn) { bn = v; bc = k; } if (bn >= 5) col[y * w + x] = bc; }
    }
  }
  void at;
  const out = new Uint8ClampedArray(d);
  for (let i = 0; i < N; i++) { const c = col[i]; if (c < 0) continue; out[i * 4] = c >> 16 & 255; out[i * 4 + 1] = c >> 8 & 255; out[i * 4 + 2] = c & 255; }
  return out;
}

/**
 * "Crisp" pass for the big title sprite (Gen-5 starter-screen look): on top of cleanSprite,
 *   1. k-means the opaque colours down to `k` tones (outline darks kept apart) -> flat 3-tone ramps per material;
 *   2. majority filter: a pixel with at most one same-coloured neighbour takes the dominant neighbour colour (no
 *      noisy clusters, no 1-px stripes);
 *   3. a clean 1-art-px outline: every opaque pixel touching transparency becomes a dark, hue-tinted outline tone.
 * Returns new RGBA data (same size).
 */
export function crispSprite(d0, w, h, o = {}) {
  const K = o.k ?? 11, keepLuma = o.keepLuma ?? 46, N = w * h;
  const d = cleanSprite(d0, w, h, { merge: o.merge ?? 30, passes: 2, keepLuma });
  const op = new Uint8Array(N); for (let i = 0; i < N; i++) op[i] = d[i * 4 + 3] >= 128 ? 1 : 0;
  const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
  // 1. k-means (RGB, weighted by frequency) over the non-dark opaque pixels
  const freq = new Map();
  for (let i = 0; i < N; i++) { if (!op[i]) continue; const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2]; if (lum(r, g, b) < keepLuma) continue; const c = (r << 16) | (g << 8) | b; freq.set(c, (freq.get(c) || 0) + 1); }
  const cols = [...freq.entries()].sort((a, b) => b[1] - a[1]).map(([c, n]) => [c >> 16 & 255, c >> 8 & 255, c & 255, n]);
  const cent = [];
  // farthest-point seeding from the most frequent colour
  if (cols.length) cent.push(cols[0].slice(0, 3));
  const dist = (a, b) => { const dr = a[0] - b[0], dg = a[1] - b[1], db = a[2] - b[2]; return 2 * dr * dr + 4 * dg * dg + 3 * db * db; };
  while (cent.length < Math.min(K, cols.length)) {
    let best = null, bd = -1;
    for (const c of cols) { let m = 1e12; for (const k of cent) m = Math.min(m, dist(c, k)); const s = m * Math.sqrt(c[3]); if (s > bd) { bd = s; best = c; } }
    cent.push(best.slice(0, 3));
  }
  const assign = new Map();
  for (let it = 0; it < 8; it++) {
    const acc = cent.map(() => [0, 0, 0, 0]);
    for (const c of cols) { let bi = 0, bd = 1e12; cent.forEach((k, j) => { const dd = dist(c, k); if (dd < bd) { bd = dd; bi = j; } }); assign.set((c[0] << 16) | (c[1] << 8) | c[2], bi); const a = acc[bi]; a[0] += c[0] * c[3]; a[1] += c[1] * c[3]; a[2] += c[2] * c[3]; a[3] += c[3]; }
    acc.forEach((a, j) => { if (a[3]) cent[j] = [a[0] / a[3], a[1] / a[3], a[2] / a[3]]; });
  }
  // label image: -1 transparent, 0..K-1 tone, K.. dark colours (kept as-is, indexed)
  const lab = new Int32Array(N).fill(-1), darks = [], darkIdx = new Map();
  for (let i = 0; i < N; i++) {
    if (!op[i]) continue;
    const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2], c = (r << 16) | (g << 8) | b;
    if (lum(r, g, b) < keepLuma) { if (!darkIdx.has(c)) { darkIdx.set(c, darks.length); darks.push([r, g, b]); } lab[i] = 1000 + darkIdx.get(c); }
    else lab[i] = assign.get(c);
  }
  // 2. majority filter (interior tones only; darks and transparency are never changed or spread)
  for (let pass = 0; pass < (o.passes ?? 2); pass++) {
    const src = lab.slice();
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, c = src[i]; if (c < 0 || c >= 1000) continue;
      let own = 0; const cnt = new Map();
      for (let j = -1; j <= 1; j++) for (let k = -1; k <= 1; k++) {
        if (!j && !k) continue; const X = x + k, Y = y + j; if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
        const n = src[Y * w + X]; if (n === c) own++; else if (n >= 0 && n < 1000) cnt.set(n, (cnt.get(n) || 0) + 1);
      }
      if (own <= 1) { let bc = -1, bn = 0; for (const [k2, v] of cnt) if (v > bn) { bn = v; bc = k2; } if (bn >= 3) lab[i] = bc; }
    }
  }
  // 2b. small low-contrast clusters (<= minCluster px, 4-connected) join their dominant neighbour tone: no streaks
  const minC = o.minCluster ?? 3;
  if (minC > 0) {
    const seen = new Int32Array(N).fill(-1), stack = [];
    for (let s0 = 0; s0 < N; s0++) {
      const c = lab[s0]; if (c < 0 || c >= 1000 || seen[s0] >= 0) continue;
      const comp = []; stack.push(s0); seen[s0] = s0;
      while (stack.length) {
        const i = stack.pop(); comp.push(i); const x = i % w;
        for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]) if (j >= 0 && j < N && seen[j] < 0 && lab[j] === c) { seen[j] = s0; stack.push(j); }
      }
      if (comp.length > minC) continue;
      const cnt = new Map();
      for (const i of comp) { const x = i % w; for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]) if (j >= 0 && j < N && lab[j] >= 0 && lab[j] < 1000 && lab[j] !== c) cnt.set(lab[j], (cnt.get(lab[j]) || 0) + 1); }
      let bc = -1, bn = 0; for (const [k2, v] of cnt) if (v > bn) { bn = v; bc = k2; }
      // only low-contrast flecks merge; high-contrast specks are drawn details (eye glints, spots)
      const lc = (k2) => lum(cent[k2][0], cent[k2][1], cent[k2][2]);
      if (bc >= 0 && Math.abs(lc(bc) - lc(c)) < (o.fleck ?? 42)) for (const i of comp) lab[i] = bc;
    }
  }
  // 3. output + 1-px outline on the silhouette edge
  const out = new Uint8ClampedArray(N * 4);
  const ol = o.outline ? [o.outline >> 16 & 255, o.outline >> 8 & 255, o.outline & 255] : null;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, c = lab[i]; if (c < 0) continue;
    let col = c >= 1000 ? darks[c - 1000] : cent[c];
    const edge = x === 0 || y === 0 || x === w - 1 || y === h - 1 || !op[i - 1] || !op[i + 1] || !op[i - w] || !op[i + w];
    if (edge) col = ol || [col[0] * 0.22 + 14, col[1] * 0.18 + 8, col[2] * 0.2 + 16];
    out[i * 4] = col[0]; out[i * 4 + 1] = col[1]; out[i * 4 + 2] = col[2]; out[i * 4 + 3] = 255;
  }
  return out;
}

/** the menu-bake post-pass by option: true = cleanSprite (bold clusters); { crisp: true, ... } = crispSprite */
export function applyClean(d, w, h, clean) {
  if (!clean) return d;
  if (clean === true) return cleanSprite(d, w, h, { merge: 34, passes: 3 });
  return clean.crisp ? crispSprite(d, w, h, clean) : cleanSprite(d, w, h, clean);
}
/** cache-key suffix for a clean option */
export const cleanKey = (clean) => (!clean ? '' : clean === true ? '/c' : '/c' + JSON.stringify(clean).replace(/[{}"]/g, ''));

/**
 * Rival silhouette (title): ONE flat tone, no interior shading; the mask is tidied first (lone spur pixels dropped,
 * 1-px notches filled) so the outline reads cleanly. tone '#rrggbb'. Returns new RGBA data (same size).
 */
export function silhouetteData(d, w, h, tone) {
  const m = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) m[i] = d[i * 4 + 3] >= 128 ? 1 : 0;
  const src = m.slice();
  const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : src[y * w + x]);
  const n4 = (x, y) => at(x - 1, y) + at(x + 1, y) + at(x, y - 1) + at(x, y + 1);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (src[i] && n4(x, y) <= 1) m[i] = 0; else if (!src[i] && n4(x, y) >= 3) m[i] = 1; }
  const k = parseInt(tone.slice(1), 16), out = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) if (m[i]) { out[i * 4] = k >> 16 & 255; out[i * 4 + 1] = k >> 8 & 255; out[i * 4 + 2] = k & 255; out[i * 4 + 3] = 255; }
  return out;
}
