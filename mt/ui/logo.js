// mt/ui/logo.js — the "SUNDERED VALE" game logo as self-contained SVG (no web font: identical on every device).
// Owner: front-end screens.
//
// Letters are hand-built chunky geometric polygons (cap height 10 units, auto-chamfered outer corners) set on a gentle
// arch like a Gen-5 monster-game logo: gold gradient fill with an inner bevel line, navy outline, a deep navy
// extrusion, a cream sticker edge, a sweeping sheen and a twinkle. logoSVG() returns markup; animation is CSS
// (title.css: .mt-logo .sheen / .twk).

const S = 2.5;          // stroke weight of the letterforms (units; cap height = 10)

/** Letter outlines: arrays of polygons [x,y,...]; the first is the outer contour, the rest are counters (holes). */
function glyph(ch) {
  const s = S;
  switch (ch) {
    case 'S': { const W = 6.6, m1 = 5 - s / 2 + 0.05, m2 = 5 + s / 2 - 0.05;
      return { w: W, p: [[0, 0, W, 0, W, s, s, s, s, m1, W, m1, W, 10, 0, 10, 0, 10 - s, W - s, 10 - s, W - s, m2, 0, m2]] }; }
    case 'U': { const W = 6.5; return { w: W, p: [[0, 0, s, 0, s, 10 - s, W - s, 10 - s, W - s, 0, W, 0, W, 10, 0, 10]] }; }
    case 'N': { const W = 7.6; return { w: W, p: [[0, 10, 0, 0, s + 0.95, 0, W - s, 6.5, W - s, 0, W, 0, W, 10, W - s - 0.95, 10, s, 3.5, s, 10]] }; }
    case 'D': { const W = 6.7, k = 2.3, ki = 1.0;
      return { w: W, p: [[0, 0, W - k, 0, W, k, W, 10 - k, W - k, 10, 0, 10], [s, s, W - s - ki, s, W - s, s + ki, W - s, 10 - s - ki, W - s - ki, 10 - s, s, 10 - s]] }; }
    case 'E': { const W = 6.0, m1 = 5 - s * 0.46, m2 = 5 + s * 0.46;
      return { w: W, p: [[0, 0, W, 0, W, s, s, s, s, m1, W - 0.7, m1, W - 0.7, m2, s, m2, s, 10 - s, W, 10 - s, W, 10, 0, 10]] }; }
    case 'R': { const W = 6.8, b = 6.4;
      return { w: W, p: [[0, 0, W - 1.7, 0, W, 1.7, W, b - 1.9, W - 0.9, b - 1.0, W, b - 0.1, W, 10, W - s, 10, W - s, b, s, b, s, 10, 0, 10], [s, s, W - s - 0.7, s, W - s, s + 0.7, W - s, b - s + 0.2, s, b - s + 0.2]] }; }
    case 'V': { const W = 7.6, mid = W / 2;
      return { w: W, p: [[0, 0, s, 0, s, 5.5, mid, 7.45, W - s, 5.5, W - s, 0, W, 0, W, 6.6, mid + 1.05, 10, mid - 1.05, 10, 0, 6.6]] }; }
    case 'A': { const W = 7.6, k = 2.5;
      return { w: W, p: [[0, 10, 0, k, k, 0, W - k, 0, W, k, W, 10, W - s, 10, W - s, 7.3, s, 7.3, s, 10], [s + 0.9, s, W - s - 0.9, s, W - s, s + 0.9, W - s, 4.95, s, 4.95, s, s + 0.9]] }; }
    case 'L': { const W = 5.7; return { w: W, p: [[0, 0, s, 0, s, 10 - s, W, 10 - s, W, 10, 0, 10]] }; }
    default: return { w: 4, p: [] };
  }
}

/** chamfer convex right-angle corners of an outer contour (counters get a smaller cut on every corner) */
function chamfer(pts, c, hole) {
  const n = pts.length / 2, out = [];
  let area = 0; for (let i = 0; i < n; i++) { const j = (i + 1) % n; area += pts[i * 2] * pts[j * 2 + 1] - pts[j * 2] * pts[i * 2 + 1]; }
  const sgn = Math.sign(area) || 1;
  for (let i = 0; i < n; i++) {
    const p = (i + n - 1) % n, q = (i + 1) % n;
    const x = pts[i * 2], y = pts[i * 2 + 1];
    const ax = pts[p * 2] - x, ay = pts[p * 2 + 1] - y, bx = pts[q * 2] - x, by = pts[q * 2 + 1] - y;
    const la = Math.hypot(ax, ay), lb = Math.hypot(bx, by);
    const cos = (ax * bx + ay * by) / (la * lb);
    const cross = (x - pts[p * 2]) * (pts[q * 2 + 1] - y) - (y - pts[p * 2 + 1]) * (pts[q * 2] - x);
    const convex = Math.sign(cross) === sgn;
    const k = hole ? c * 0.55 : c;
    if (Math.abs(cos) < 0.2 && (convex || hole) && la > k * 2.2 && lb > k * 2.2) {
      out.push(x + (ax / la) * k, y + (ay / la) * k, x + (bx / lb) * k, y + (by / lb) * k);
    } else out.push(x, y);
  }
  return out;
}

const f2 = (v) => (Math.round(v * 100) / 100).toString();
function pathOf(g, c, outerOnly) {
  return (outerOnly ? g.p.slice(0, 1) : g.p).map((poly, i) => { const q = chamfer(poly, c, i > 0); let d = 'M' + f2(q[0]) + ' ' + f2(q[1]); for (let k = 2; k < q.length; k += 2) d += 'L' + f2(q[k]) + ' ' + f2(q[k + 1]); return d + 'Z'; }).join('');
}

/** a word laid on an arch: letter paths with transforms. Returns {d:[{d,tf}], w, h} */
function word(text, size, track, arch) {
  const gl = [...text].map(glyph);
  const w = gl.reduce((a, g) => a + g.w, 0) + track * (gl.length - 1);
  let x = -w / 2; const items = [];
  const half = w / 2;
  for (const g of gl) {
    const cx = x + g.w / 2, u = cx / half;
    const y = -arch * (1 - u * u);                     // parabola: centre letters higher
    const rot = Math.atan(2 * arch * u / half) * 180 / Math.PI * 0.9;
    items.push({ d: pathOf(g, 1.05), o: pathOf(g, 1.05, true), tf: `translate(${f2(cx * size)} ${f2(y * size)}) rotate(${f2(rot)}) scale(${size}) translate(${f2(-g.w / 2)} -10)` });
    x += g.w + track;
  }
  return { items, w: w * size };
}

/**
 * SVG markup for the logo. opts.uid makes the ids unique. The viewBox is in logo units; size it by CSS width.
 * Two lines: "SUNDERED" (cap 10) over "VALE" (cap 20).
 */
export function logoSVG(opts = {}) {
  const id = opts.uid || 'lg';
  const top = word('SUNDERED', 1, 1.15, 0.9), bot = word('VALE', 2.05, 1.4, 0.55);
  const yTop = 11.5, yBot = 36.5;                     // baselines
  const W = Math.max(top.w, bot.w) + 9, H = 43;
  const cx = W / 2;
  const layer = (it, dy = 0, o) => it.items.map((l) => `<path transform="translate(${f2(cx)} ${f2((it === top ? yTop : yBot) + dy)}) ${l.tf}" d="${o ? l.o : l.d}"/>`).join('');
  const all = (dy, o) => layer(top, dy, o) + layer(bot, dy, o);
  const ext = 1.15;
  return `<svg class="mt-logo-svg" viewBox="0 -3 ${f2(W)} ${H}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<defs>
<linearGradient id="${id}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffbe6"/><stop offset=".22" stop-color="#ffe46a"/><stop offset=".52" stop-color="#ffc21f"/><stop offset=".78" stop-color="#ff9418"/><stop offset="1" stop-color="#f06a12"/></linearGradient>
<linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#fff2b8" stop-opacity=".55"/><stop offset=".62" stop-color="#ffb030" stop-opacity="0"/><stop offset="1" stop-color="#a8430c"/></linearGradient>
<linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<clipPath id="${id}c" clip-rule="evenodd">${all(0).replace(/<path /g, '<path clip-rule="evenodd" ')}</clipPath>
</defs>
<g class="edge" fill="#fff3d6" stroke="#fff3d6" stroke-width="3.7" stroke-linejoin="round">${all(ext, 1)}${all(0, 1)}</g>
<g class="ext" fill="#0d1230" stroke="#0d1230" stroke-width="2.3" stroke-linejoin="round">${all(ext, 1)}${all(ext * 0.5, 1)}</g>
<g class="ink" fill="#1b2350" stroke="#1b2350" stroke-width="2.3" stroke-linejoin="round">${all(0, 1)}</g>
<g class="fill" fill="url(#${id}f)" fill-rule="evenodd">${all(0)}</g>
<g class="bevel" fill="none" stroke="url(#${id}b)" stroke-width=".72" clip-path="url(#${id}c)">${all(0)}</g>
<g clip-path="url(#${id}c)"><rect class="sheen" x="-30" y="-6" width="22" height="56" fill="url(#${id}s)" transform="skewX(-24)"/></g>
<g class="twk" transform="translate(${f2(cx + bot.w * 0.5 - 3.4)} ${f2(yBot - 19.6)})"><path d="M0 -3.4L.62 -.62L3.4 0L.62 .62L0 3.4L-.62 .62L-3.4 0L-.62 -.62Z" fill="#fff"/></g>
<g class="twk b" transform="translate(${f2(cx - top.w * 0.5 + 0.8)} ${f2(yTop - 9.6)}) scale(.7)"><path d="M0 -3.4L.62 -.62L3.4 0L.62 .62L0 3.4L-.62 .62L-3.4 0L-.62 -.62Z" fill="#fff"/></g>
</svg>`;
}
/** logo aspect ratio (width / height) */
export function logoAspect() { const top = word('SUNDERED', 1, 1.15, 0.9), bot = word('VALE', 2.05, 1.4, 0.55); return (Math.max(top.w, bot.w) + 9) / 43; }

/** "VS" emblem for the lobby line-up, in the logo's style (hot red-orange fill). */
export function vsSVG(uid = 'vs') {
  const w = word('VS', 2, 0.9, 0);
  const W = w.w + 8, H = 30, cx = W / 2, y = 25;
  const lay = (dy, o) => w.items.map((l) => `<path transform="translate(${f2(cx)} ${f2(y + dy)}) ${l.tf}" d="${o ? l.o : l.d}"/>`).join('');
  return `<svg class="mt-vs-svg" viewBox="0 0 ${f2(W)} ${H}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<defs><linearGradient id="${uid}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff4d0"/><stop offset=".25" stop-color="#ffd84a"/><stop offset=".6" stop-color="#ff7a24"/><stop offset="1" stop-color="#e2361c"/></linearGradient>
<linearGradient id="${uid}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="#fff2b8" stop-opacity=".5"/><stop offset=".62" stop-color="#ff8030" stop-opacity="0"/><stop offset="1" stop-color="#8a1a0c"/></linearGradient>
<clipPath id="${uid}c">${lay(0)}</clipPath></defs>
<g fill="#fff3d6" stroke="#fff3d6" stroke-width="3.6" stroke-linejoin="round">${lay(1.2, 1)}${lay(0, 1)}</g>
<g fill="#0d1230" stroke="#0d1230" stroke-width="2.3" stroke-linejoin="round">${lay(1.2, 1)}${lay(0.6, 1)}</g>
<g fill="#1b2350" stroke="#1b2350" stroke-width="2.3" stroke-linejoin="round">${lay(0, 1)}</g>
<g fill="url(#${uid}f)" fill-rule="evenodd">${lay(0)}</g>
<g fill="none" stroke="url(#${uid}b)" stroke-width=".72" clip-path="url(#${uid}c)">${lay(0)}</g>
</svg>`;
}

// ------------------------------------------------------------------------------------------------ pixel logo
// The same letterforms rasterised on the menu screens' art-pixel grid (no anti-aliasing): integer-snapped vertices,
// a 4-tone gold ramp per letter, 1-px top highlight / bottom shade, 2-px navy ink, a navy extrusion, a cream sticker
// edge and a 1-px dark rim — one pixel grid with the sprites and the backdrop.

function rasterPolys(polys, W, H) {
  const m = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    const py = y + 0.5, xs = [];
    for (const p of polys) {
      const n = p.length / 2;
      for (let i = 0; i < n; i++) {
        const x1 = p[i * 2], y1 = p[i * 2 + 1], x2 = p[((i + 1) % n) * 2], y2 = p[((i + 1) % n) * 2 + 1];
        if ((y1 <= py) !== (y2 <= py)) xs.push(x1 + ((py - y1) / (y2 - y1)) * (x2 - x1));
      }
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const a = Math.max(0, Math.ceil(xs[k] - 0.5)), b = Math.min(W - 1, Math.floor(xs[k + 1] - 0.5));
      for (let x = a; x <= b; x++) m[y * W + x] = 1;
    }
  }
  return m;
}
const hex = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };

/**
 * Pixel logo canvas. u1 = art px per letter unit for "SUNDERED" (cap = 10 units), u2 for "VALE".
 * opts.pal: fill ramp (4, top->bottom), opts.arch: arch height in px for each word.
 * opts.thin: every outline line exactly 1 art px (ink, cream edge, rim) so the logo shares the 1-px scale of the
 * menu text and sprites; opts.ext: extrusion depth (px); opts.close: closing radius (px).
 */
export function logoPixels(u1 = 1.6, u2 = 3.2, opts = {}) {
  const ramp = (opts.pal || ['#fff3b0', '#ffd84a', '#ffb428', '#f2801c']).map(hex);
  const HI = hex('#fffbe8'), SH = hex('#c85a14'), INK = hex('#1b2350'), EXT = hex('#0d1230'), EDGE = hex('#fff3d6');
  const words = opts.words || [['SUNDERED', u1, 1.15, opts.arch1 ?? 2], ['VALE', u2, 1.4, opts.arch2 ?? 2]];
  // layout: letters as integer-snapped polygons
  const lines = words.map(([text, u, track, arch]) => {
    const gl = [...text].map(glyph);
    const w = Math.round((gl.reduce((a, g) => a + g.w, 0) + track * (gl.length - 1)) * u);
    let x = 0; const letters = [];
    gl.forEach((g, i) => {
      const lx = Math.round(x), cxu = (x + (g.w * u) / 2 - w / 2) / (w / 2);
      const dy = -Math.round(arch * (1 - cxu * cxu));
      letters.push({ polys: g.p.map((poly, k) => chamfer(poly, 1.05, k > 0).map((v, j) => Math.round(j % 2 ? v * u : v * u + lx))), dy, w: Math.round(g.w * u) });
      x += (g.w + track) * u;
    });
    return { w, h: Math.round(10 * u), u, letters, arch };
  });
  const thin = !!opts.thin;
  const pad = thin ? 4 : 6, ext = opts.ext ?? Math.max(2, Math.round(u2 * 0.9)), gap = opts.gap ?? ext + 3;
  const W = Math.max(...lines.map((l) => l.w)) + pad * 2, top0 = pad + lines[0].arch;
  const last = lines[lines.length - 1];
  const y1 = lines.length > 1 ? top0 + lines[0].h + gap + last.arch : top0;
  const H = y1 + last.h + ext + pad;
  const fill = new Uint8Array(W * H), tone = new Int8Array(W * H).fill(-1);
  lines.forEach((L, li) => {
    const ox = Math.round((W - L.w) / 2), oy = li ? y1 : top0;
    const mw = L.w + 4, mh = L.h + 2;
    for (const lt of L.letters) {
      const m = rasterPolys(lt.polys, mw, mh);
      for (let y = 0; y < mh; y++) for (let x = 0; x < mw; x++) {
        if (!m[y * mw + x]) continue;
        const X = ox + x, Y = oy + y + lt.dy; if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
        fill[Y * W + X] = 1; tone[Y * W + X] = Math.min(3, Math.floor((y / L.h) * 4));
      }
    }
  });
  const c = (typeof document !== 'undefined' ? document.createElement('canvas') : new OffscreenCanvas(W, H)); c.width = W; c.height = H;
  const g = c.getContext('2d'); const img = g.createImageData(W, H); const d = img.data;
  const put = (i, col) => { d[i * 4] = col[0]; d[i * 4 + 1] = col[1]; d[i * 4 + 2] = col[2]; d[i * 4 + 3] = 255; };
  const inF = (x, y) => x >= 0 && y >= 0 && x < W && y < H && fill[y * W + x];
  // ink (2 px around) + extrusion (shifted down) + cream edge (1 px) + dark rim (1 px)
  const ink = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (fill[y * W + x]) continue;
    let near = false;
    const R = thin ? 1 : 2, RD = thin ? 2 : 3;
    for (let j = -R; j <= R && !near; j++) for (let i = -R; i <= R; i++) { if (Math.abs(i) + Math.abs(j) > RD) continue; if (inF(x + i, y + j)) { near = true; break; } }
    let below = false; for (let k = 1; k <= ext + R && !near; k++) if (inF(x, y - k) || inF(x - 1, y - k) || inF(x + 1, y - k)) below = true;
    if (near) ink[y * W + x] = 1; else if (below) ink[y * W + x] = 2;
  }
  const solid = (x, y) => x >= 0 && y >= 0 && x < W && y < H && (fill[y * W + x] || ink[y * W + x]);
  // close 1–2 px slots between neighbouring letters so the cream edge only runs around the outside
  for (let pass = 0; pass < 2; pass++) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x; if (fill[i] || ink[i]) continue;
    if ((solid(x - 1, y) && (solid(x + 1, y) || solid(x + 2, y))) || (solid(x, y - 1) && (solid(x, y + 1) || solid(x, y + 2)))) ink[i] = 1;
  }
  // morphological closing (radius ~3 px): narrow notches / slots between the words and letters become ink
  {
    const r = opts.close ?? Math.max(2, Math.round(u2 * 0.8)), base = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) base[i] = fill[i] || ink[i] ? 1 : 0;
    const dil = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let hit = 0;
      for (let j = -r; j <= r && !hit; j++) for (let i = -r; i <= r; i++) { if (Math.abs(i) + Math.abs(j) > r) continue; const X = x + i, Y = y + j; if (X >= 0 && Y >= 0 && X < W && Y < H && base[Y * W + X]) { hit = 1; break; } }
      dil[y * W + x] = hit;
    }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const k = y * W + x; if (base[k] || !dil[k]) continue;
      let all = 1;
      for (let j = -r; j <= r && all; j++) for (let i = -r; i <= r; i++) { if (Math.abs(i) + Math.abs(j) > r) continue; const X = x + i, Y = y + j; if (X < 0 || Y < 0 || X >= W || Y >= H || !dil[Y * W + X]) { all = 0; break; } }
      if (all) ink[k] = 1;
    }
  }
  // background pockets enclosed by the letters (V notch, L corner…) become ink: only the outside gets the edge
  const out = new Uint8Array(W * H), st = [];
  for (let x = 0; x < W; x++) { st.push(x, (H - 1) * W + x); } for (let y = 0; y < H; y++) { st.push(y * W, y * W + W - 1); }
  while (st.length) { const i = st.pop(); if (out[i] || fill[i] || ink[i]) continue; out[i] = 1; const x = i % W, y = (i / W) | 0; if (x > 0) st.push(i - 1); if (x < W - 1) st.push(i + 1); if (y > 0) st.push(i - W); if (y < H - 1) st.push(i + W); }
  for (let i = 0; i < W * H; i++) if (!out[i] && !fill[i] && !ink[i]) ink[i] = 1;
  const edge = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (solid(x, y)) continue;
    if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) edge[y * W + x] = 1;
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (edge[y * W + x] || solid(x, y)) continue;
    const e = (i, j) => x + i >= 0 && y + j >= 0 && x + i < W && y + j < H && edge[(y + j) * W + x + i] === 1;
    if (e(-1, 0) || e(1, 0) || e(0, -1) || e(0, 1)) edge[y * W + x] = 2;
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (fill[i]) {
      let col = opts.flat ? ramp[0] : ramp[Math.max(0, tone[i])];
      if (opts.flat) { if (!inF(x, y + 1)) col = ramp[1] || SH; }        // flat fill + one 1-px shade row
      else if (!inF(x, y - 1)) col = HI; else if (!inF(x, y + 1)) col = SH;
      put(i, col);
    } else if (ink[i] === 1) put(i, INK);
    else if (ink[i] === 2) put(i, EXT);
    else if (edge[i] === 1) put(i, EDGE);
    else if (edge[i] === 2) put(i, EXT);
  }
  g.putImageData(img, 0, 0);
  return c;
}

/** pixel "VS" emblem in the logo style (hot red-orange ramp) */
/** the lobby VS emblem: a FLAT pixel badge (one fill + a 1-px shade row, 1-px ink / cream / rim lines, no gradient) */
export function vsPixels(u = 2) { return logoPixels(u, u, { words: [['VS', u, 0.9, 0]], pal: ['#ffd23a', '#e89a1c'], flat: true, thin: true, ext: 2, close: 1 }); }
