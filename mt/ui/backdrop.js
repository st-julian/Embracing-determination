// mt/ui/backdrop.js — pixel-art menu backdrops on the art-pixel grid (title + lobby). Owner: front-end screens.
//
// A Gen-5 style "stage" backdrop: concentric elliptical bands around a floor point (no dithering: clean tone steps,
// a lighter ring line on each band edge), corner falloff, plus a moving spotlight cone / floor pool and bold pixel
// motes drawn per frame. Everything lands on whole art pixels; the canvas is shown at an integer device-px zoom.

const hex = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const mix = (a, b, t) => [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)];

/** band ramps outer -> inner (7 tones), ring line tint, cone / pool light, motes, silhouette ink */
export const PALETTES = {
  fire: { bands: ['#c4602a', '#d27030', '#de8236', '#e9963e', '#f2aa48', '#f8c056', '#fdd468'], ring: '#fbc870', cone: '#fff6a8', pool: ['#ffe27a', '#fff0a4', '#fff9d6'], motes: ['#fffbe0', '#ffe27a'], ink: ['#160a06', '#2a140c'] },
  water: { bands: ['#3462b8', '#3e72c6', '#4a84d2', '#5898dc', '#68ace6', '#7cc0ee', '#96d4f6'], ring: '#a2d8f6', cone: '#e0faff', pool: ['#b4ecfc', '#d4f6ff', '#eefdff'], motes: ['#f4feff', '#b4ecfc'], ink: ['#060e24', '#101a38'] },
  grass: { bands: ['#3a7a36', '#468a3e', '#549c48', '#64ae54', '#78c062', '#8ed274', '#a8e28a'], ring: '#b4e698', cone: '#f6ffd4', pool: ['#d0f2a4', '#e4fac4', '#f6ffe4'], motes: ['#f8ffe8', '#d0f2a4'], ink: ['#081608', '#122412'] },
  lobby: { bands: ['#3a4aa6', '#4456b4', '#4f64c0', '#5c74cc', '#6c86d6', '#7e9ae0', '#94b0ea'], ring: '#a2bcee', cone: '#eef2ff', pool: ['#b6c6f2', '#cdd9f8', '#e8eeff'], motes: ['#f4f7ff', '#b6c6f2'], ink: ['#101436', '#1a2048'] },
  teamBlue: { bands: [], ring: '', cone: '#bfe6ff', pool: ['#9ccff6', '#bfe6ff', '#e2f6ff'], motes: [], ink: [] },
  teamRed: { bands: [], ring: '', cone: '#ffe2c4', pool: ['#ffc09a', '#ffd9bc', '#fff0e2'], motes: [], ink: [] },
};

/**
 * Static backdrop canvas (w×h art px): bands around (cx, cy), ellipse aspect `asp` (floor perspective), band width
 * `bw` in units of the half-width.
 */
export function drawBackdrop(w, h, palName, cx, cy, o = {}) {
  const P = PALETTES[palName] || PALETTES.fire;
  const bands = P.bands.map(hex), ring = hex(P.ring);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); const img = g.createImageData(w, h); const d = img.data;
  const R = o.r || Math.max(w, h * 1.6) * 0.5, asp = o.asp || 0.42, bw = o.bw || 0.34;
  const band = (x, y) => {
    const dx = (x + 0.5 - cx) / R, dy = (y + 0.5 - cy) / (R * asp);
    let e = Math.sqrt(dx * dx + dy * dy);
    // corners fall off a little faster (vignette), the top a little brighter (wall glow)
    const ux = (x + 0.5) / w - 0.5, uy = (y + 0.5) / h - 0.5;
    e += (ux * ux + uy * uy) * 0.9;
    return Math.max(0, Math.min(bands.length - 1, bands.length - 1 - Math.floor(e / bw)));
  };
  const B = new Int8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) B[y * w + x] = band(x, y);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, k = B[i];
    let col = bands[k];
    // ring line: the inner edge of each band boundary gets a lighter 1-px line (floor rings)
    const up = y > 0 ? B[i - w] : k, dn = y < h - 1 ? B[i + w] : k, lf = x > 0 ? B[i - 1] : k, rt = x < w - 1 ? B[i + 1] : k;
    if (up < k || dn < k || lf < k || rt < k) col = mix(col, ring, 0.45);
    d[i * 4] = col[0]; d[i * 4 + 1] = col[1]; d[i * 4 + 2] = col[2]; d[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}

/** spotlight cone (top -> pool) + floor pool, crisp stepped edges; alpha scales the whole light */
export function drawSpot(g, palName, x, poolY, topHalf, poolHalf, alpha = 1) {
  const P = PALETTES[palName] || PALETTES.fire;
  const cone = P.cone, pool = P.pool;
  g.save();
  const layers = [[1, 0.26], [0.74, 0.26], [0.48, 0.3]];
  for (const [k, a] of layers) {
    g.globalAlpha = a * alpha; g.fillStyle = cone;
    for (let y = 0; y < poolY; y++) {
      const t = y / Math.max(1, poolY), hw = Math.round((topHalf + (poolHalf - topHalf) * t) * k);
      g.fillRect(Math.round(x) - hw, y, hw * 2 + 1, 1);
    }
  }
  // pool: three nested pixel ellipses
  const prx = Math.round(poolHalf * 1.15), pry = Math.max(3, Math.round(prx * 0.26));
  [[1, 0.5], [0.72, 0.6], [0.42, 0.7]].forEach(([k, a], i) => {
    g.globalAlpha = a * alpha; g.fillStyle = pool[i];
    const rx = Math.round(prx * k), ry = Math.max(2, Math.round(pry * k));
    for (let j = -ry; j <= ry; j++) { const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (j * j) / (ry * ry)))); g.fillRect(Math.round(x) - w, Math.round(poolY) + j, w * 2 + 1, 1); }
  });
  g.restore();
}

/** bold pixel motes / twinkles drifting upward (render-only state) */
export class Motes {
  constructor(n = 14, seed = 3) { this.n = n; this.p = []; let s = seed; this.r = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; }
  update(dt, w, h) {
    const r = this.r;
    while (this.p.length < this.n) this.p.push({ x: r() * w, y: h * (0.2 + r() * 0.8), vy: -(2 + r() * 4), ph: r() * 6.28, life: 4 + r() * 5, t: r() * 3, big: r() < 0.35 });
    for (const m of this.p) { m.t += dt; m.y += m.vy * dt; m.x += Math.sin(m.t * 0.8 + m.ph) * 1.5 * dt; }
    this.p = this.p.filter((m) => m.t < m.life && m.y > -4);
  }
  draw(g, palName, alpha = 1) {
    const P = PALETTES[palName] || PALETTES.fire;
    for (const m of this.p) {
      const u = m.t / m.life, tw = 0.5 + 0.5 * Math.sin(m.t * 3 + m.ph);
      const a = Math.min(1, u * 4, (1 - u) * 3) * alpha; if (a <= 0.05) continue;
      const x = Math.round(m.x), y = Math.round(m.y);
      g.globalAlpha = a; g.fillStyle = P.motes[tw > 0.6 ? 0 : 1];
      if (m.big && tw > 0.45) { g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3); } else g.fillRect(x, y, 1, 1);
    }
    g.globalAlpha = 1;
  }
}
