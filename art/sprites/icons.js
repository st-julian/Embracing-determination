// Ability icons, trainer-skill icons, element badges. Painted with the same rasteriser so
// they share the palette/outline language of the sprites. Every ability has a unique glyph.
import { Scene, compileMats } from './raster.js';
import { flamePoly, smoothPoly, leafPoly, TAU } from './parts.js';
import { FLAME } from './species/fire.js';
import { WATERFX } from './species/water.js';
import { LEAFFX } from './species/grass.js';
import { BOLTFX, ARCFX } from './species/electric.js';
import { ROCKFX } from './species/earth.js';
import { WINDFX } from './species/wind.js';
import { textPixels, textWidth } from './font.js';

export const ELEMENT_COLORS = {
  fire: { bg: '#e8562e', dark: '#7a1e1a', name: 'FIRE' },
  water: { bg: '#3a8ef0', dark: '#1a3a8a', name: 'WATER' },
  grass: { bg: '#4cb848', dark: '#1e5a2a', name: 'GRASS' },
  electric: { bg: '#f2c22a', dark: '#7a5a10', name: 'ELECTRIC' },
  earth: { bg: '#b8864e', dark: '#4e3420', name: 'EARTH' },
  wind: { bg: '#78c8e8', dark: '#2a5a8a', name: 'WIND' },
  neutral: { bg: '#8a8fb8', dark: '#2a2e52', name: '' },
};

function iconMats(el) {
  const E = ELEMENT_COLORS[el];
  const bgRamp = [E.dark, mixHex(E.dark, E.bg, 0.45), mixHex(E.dark, E.bg, 0.75), E.bg, mixHex(E.bg, '#ffffff', 0.25)];
  return compileMats({
    bg: { ramp: bgRamp, emissive: true, outline: '#14162c', lineCol: '#14162c', litOutline: '#14162c', th: [0.04, 0.09, 0.16, 0.95] },
    frame: { ramp: ['#1c2040', '#2c3260', '#4a5290', '#e8ecff', '#ffffff'], emissive: true, noLine: true, outline: '#0c0e20', th: [0.15, 0.4, 0.75, 0.97] },
    flame: FLAME, water: WATERFX, leafFx: LEAFFX, bolt: BOLTFX, arc: ARCFX, rockFx: ROCKFX, windFx: WINDFX,
    white: { c: '#f2f4ff', dark: 0.7 }, rock: { c: '#9a8a7a' }, rockD: { c: '#6a5a50' }, wood: { c: '#9a6a42' }, leaf: { c: '#4ccf4c' }, vine: { c: '#3a9a3a' },
    heart: { c: '#ff5a7a' }, gold: { c: '#ffc83a', hi: true, gloss: true }, steel: { c: '#b8c0d8', gloss: true }, navy: { c: '#2c3a78' },
    glass: { c: '#5ee6ee', gloss: true }, potion: { c: '#ff5aa0', gloss: true }, skin: { c: '#f0b890' }, team: { c: '#3b7cf0' },
    magic: { ramp: ['#8a5aff', '#b48aff', '#dcc4ff', '#f4ecff', '#ffffff'], emissive: true, noLine: true, outline: '#2a1a6a' },
    text: { ramp: ['#14162c', '#30345a', '#ffffff', '#ffffff', '#ffffff'], noLine: true },
  });
}
function mixHex(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const c = [16, 8, 0].map(sh => Math.round(((pa >> sh) & 255) * (1 - t) + ((pb >> sh) & 255) * t));
  return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
}

// --- glyph helpers (authored in a 40x40 space) -------------------------------------
function ctx(s, k) {
  const H = s.h;
  return {
    k,
    P: (x, y) => [x * k, y * k],
    sph: (x, y, r, mat, z = 10) => s.ell([x * k, H - y * k, z], r * k, mat),
    ellp: (x, y, rx, ry, mat, z = 10, rot = 0) => s.ell([x * k, H - y * k, z], [rx * k, ry * k, Math.min(rx, ry) * k], mat, { rot: [0, 0, rot] }),
    poly: (pts, mat, z = 10, o) => s.poly2(pts.map(([x, y]) => [x * k, y * k]), z, mat, o),
    line: (pts, mat, z = 10, o) => s.stroke2(pts.map(([x, y, r]) => [x * k, y * k, r * k]), z, mat, o),
    disc: (x, y, r, mat, z = 10, o) => s.disc2(x * k, y * k, r * k, z, mat, o),
    flame: (x, y, w, h, mat = 'flame', z = 10, lean = 0) => s.poly2(flamePoly(x * k, y * k, w * k, h * k, { lean, wob: 0.05 }), z, mat, { heatFn: (d) => Math.min(1, d * 1.15 + 0.08) }),
  };
}
function bolt(c, x0, y0, x1, y1, w, mat = 'bolt', z = 12, n = 4, amp = 3) {
  const pts = [];
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
  for (let i = 0; i <= n; i++) { const f = i / n; const o = (i === 0 || i === n) ? 0 : (i % 2 ? amp : -amp); pts.push([x0 + dx * f + nx * o, y0 + dy * f + ny * o, w * (1 - f * 0.3)]); }
  c.line(pts, mat, z);
}
function boltShape(c, cx, cy, sz, mat = 'bolt', z = 12) {
  const p = [[0.15, -1], [-0.55, 0.12], [-0.02, 0.12], [-0.3, 1], [0.6, -0.25], [0.05, -0.25], [0.35, -1]];
  c.poly(p.map(([x, y]) => [cx + x * sz, cy + y * sz]), mat, z, { heatFn: d => 0.3 + d * 1.4 });
}
function dropShape(cx, cy, r, n = 16) {
  const pts = [];
  for (let i = 0; i <= n; i++) { const a = i / n * TAU; const tip = Math.max(0, -Math.sin(a)); pts.push([cx + Math.cos(a) * r * (1 - tip * 0.55), cy + Math.sin(a) * r - tip * tip * r * 0.9]); }
  return pts;
}
function bubble(c, x, y, r, z = 12) {
  c.disc(x, y, r, 'water', z, { heatFn: d => 1 - Math.min(1, d * 1.3) * 0.75 });
  c.disc(x - r * 0.35, y - r * 0.35, Math.max(0.6, r * 0.25), 'white', z + 1);
}
function crescent(c, cx, cy, r, a0, a1, w, mat, z = 12) {
  const pts = [];
  for (let i = 0; i <= 14; i++) { const f = i / 14, a = a0 + (a1 - a0) * f; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r, 0.5 + Math.sin(f * Math.PI) * w]); }
  c.line(pts, mat, z);
}

export function elementGlyph(c, el, cx, cy, sz, z = 12) {
  switch (el) {
    case 'fire': c.flame(cx, cy + sz * 0.85, sz * 1.25, sz * 1.9, 'flame', z); break;
    case 'water': c.poly(dropShape(cx, cy + sz * 0.15, sz * 0.8), 'water', z, { heatFn: d => 0.25 + d * 1.2 }); c.disc(cx - sz * 0.28, cy + sz * 0.15, sz * 0.18, 'white', z + 1); break;
    case 'grass': { const pts = leafPoly(sz * 2, sz * 1.1, { n: 8 }).map(([u, v]) => [cx - sz * 0.7 + u * 0.7 + v * 0.7, cy + sz * 0.7 - u * 0.7 + v * 0.7]); c.poly(pts, 'leafFx', z, { heatFn: d => 0.3 + d * 1.2 }); c.line([[cx - sz * 0.6, cy + sz * 0.6, sz * 0.08], [cx + sz * 0.5, cy - sz * 0.5, sz * 0.05]], 'vine', z + 1); break; }
    case 'electric': boltShape(c, cx, cy, sz, 'bolt', z); break;
    case 'earth': c.poly([[cx - sz, cy + sz * 0.7], [cx - sz * 0.6, cy - sz * 0.2], [cx - sz * 0.1, cy - sz * 0.8], [cx + sz * 0.5, cy - sz * 0.4], [cx + sz, cy + sz * 0.7]], 'rockFx', z, { heatFn: d => 0.3 + d * 1.3 }); break;
    case 'wind': crescent(c, cx, cy, sz * 0.75, -0.3, 4.4, sz * 0.22, 'windFx', z); crescent(c, cx + sz * 0.1, cy + sz * 0.05, sz * 0.32, 0.5, 4.8, sz * 0.12, 'windFx', z + 1); break;
  }
}

// --- ability glyphs --------------------------------------------------------------------
const GLYPHS = {
  // FIRE
  'fire/basic': (c) => { c.line([[8, 32, 1], [16, 24, 3], [22, 18, 4.5]], 'flame', 9); c.sph(25, 15, 8, 'flame', 12); },
  'fire/a1': (c) => { for (const [x, y, r] of [[30, 9, 5], [32, 22, 5], [19, 8, 5]]) { c.line([[7, 33, 0.6], [(x + 7) / 2, (y + 33) / 2, r * 0.5], [x, y, r * 0.7]], 'flame', 9); c.sph(x, y, r, 'flame', 12); } },
  'fire/a2': (c) => { c.ellp(20, 32, 14, 4.5, 'rockFx', 6); c.flame(20, 33, 13, 28, 'flame', 12); c.flame(11, 34, 6, 12, 'flame', 11, -0.3); c.flame(29, 34, 6, 12, 'flame', 11, 0.3); },
  // WATER
  'water/basic': (c) => { const up = [[6, 9], [34, 9], [30, 16], [26, 11], [22, 18], [18, 11], [14, 18], [10, 11]]; const dn = [[6, 31], [34, 31], [30, 24], [26, 29], [22, 22], [18, 29], [14, 22], [10, 29]]; c.poly(up, 'white', 12); c.poly(dn, 'white', 12); c.poly(dropShape(20, 21, 4), 'water', 14, { heatFn: d => 0.3 + d * 1.2 }); },
  'water/a1': (c) => { [[8, 32, 2.5], [13, 25, 3.2], [19, 18, 4], [27, 10, 5.5]].forEach(([x, y, r]) => bubble(c, x, y, r)); c.line([[5, 36, 0.6], [12, 28, 1.5], [24, 14, 1]], 'water', 8); },
  'water/a2': (c) => { c.poly(dropShape(20, 23, 13), 'water', 10, { heatFn: d => 0.25 + d * 1.1 }); c.poly([[17, 15], [23, 15], [23, 20], [28, 20], [28, 26], [23, 26], [23, 31], [17, 31], [17, 26], [12, 26], [12, 20], [17, 20]], 'white', 12); },
  // GRASS
  'grass/basic': (c) => { const pts = leafPoly(32, 13, { n: 10, bend: 3 }).map(([u, v]) => [6 + u * 0.72 + v * 0.69, 34 - u * 0.69 + v * 0.72]); c.poly(pts, 'leaf', 12); c.line([[7, 33, 1], [30, 9, 0.5]], 'vine', 13); },
  'grass/a1': (c) => { const pts = []; for (let i = 0; i <= 24; i++) { const f = i / 24, a = f * 2.4 * Math.PI; const r = 14 * (1 - f * 0.75); pts.push([20 + Math.cos(a + 2.2) * r, 21 + Math.sin(a + 2.2) * r, 2.6 - f * 1.6]); } c.line(pts, 'vine', 12); for (const [x, y, a] of [[10, 12, -0.8], [29, 30, 2.2]]) { const lp = leafPoly(9, 5, { n: 6 }).map(([u, v]) => [x + u * Math.cos(a) - v * Math.sin(a), y + u * Math.sin(a) + v * Math.cos(a)]); c.poly(lp, 'leaf', 13); } },
  'grass/a2': (c) => { const sh = [[20, 5], [32, 10], [31, 22], [20, 35], [9, 22], [8, 10]]; for (let i = 0; i < 6; i++) { const [x0, y0] = sh[i], [x1, y1] = sh[(i + 1) % 6]; const mx = (x0 + x1) / 2, my = (y0 + y1) / 2; const nx = mx - 20, ny = my - 20, L = Math.hypot(nx, ny); c.poly([[mx - ny / L * 2.5, my + nx / L * 2.5], [mx + nx / L * 6, my + ny / L * 6], [mx + ny / L * 2.5, my - nx / L * 2.5]], 'leaf', 9); } c.poly(sh, 'wood', 11); c.poly([[20, 10], [27, 13], [26.5, 21], [20, 29], [13.5, 21], [13, 13]], 'leaf', 12); },
  // ELECTRIC
  'electric/basic': (c) => { boltShape(c, 20, 20, 15, 'bolt', 12); },
  'electric/a1': (c) => { const n = [[8, 30], [20, 10], [32, 28]]; bolt(c, 8, 30, 20, 10, 1.6, 'bolt', 10, 4, 2.5); bolt(c, 20, 10, 32, 28, 1.6, 'bolt', 10, 4, 2.5); n.forEach(([x, y]) => c.sph(x, y, 4.5, 'arc', 12)); },
  'electric/a2': (c) => { c.poly([[8, 14], [24, 14], [24, 8], [35, 20], [24, 32], [24, 26], [8, 26]], 'arc', 11, { heatFn: d => 0.3 + d }); for (const y of [10, 20, 30]) c.line([[3, y, 0.5], [8, y, 1]], 'white', 10); boltShape(c, 18, 20, 6, 'bolt', 13); },
  // EARTH
  'earth/basic': (c) => { c.poly([[10, 26], [12, 14], [20, 9], [29, 12], [32, 22], [26, 30], [15, 31]], 'rock', 12, { bulge: 1 }); c.line([[16, 14, 0.6], [19, 20, 0.6], [17, 25, 0.5]], 'rockD', 13); for (const [x, y, a] of [[5, 8, 0], [35, 6, 0], [36, 30, 0]]) c.line([[x, y, 0.4], [x + (20 - x) * 0.18, y + (20 - y) * 0.18, 1]], 'white', 11); },
  'earth/a1': (c) => { c.poly([[3, 33], [37, 33], [37, 38], [3, 38]], 'rockD', 8); c.poly([[12, 24], [14, 12], [22, 8], [29, 13], [28, 24], [20, 28]], 'rock', 12, { bulge: 1 }); c.line([[20, 33, 0.8], [15, 37, 0.5]], 'navy', 9); c.line([[20, 33, 0.8], [26, 37, 0.5]], 'navy', 9); for (const [x, y] of [[6, 28], [34, 27], [8, 22], [33, 20]]) c.poly([[x - 1.5, y], [x, y - 2], [x + 1.5, y - 0.5], [x + 0.5, y + 1.5]], 'rockFx', 11); },
  'earth/a2': (c) => { for (const y of [14, 20, 26]) c.line([[3, y, 0.5], [11, y, 1.2]], 'white', 9); c.poly([[10, 30], [10, 12], [24, 14], [36, 6], [30, 18], [30, 30]], 'rock', 12, { bulge: 0.8 }); c.disc(15, 33, 3.5, 'rockFx', 13); c.disc(22, 34, 2.8, 'rockFx', 13); },
  // WIND
  'wind/basic': (c) => { for (const dx of [-8, 0, 8]) c.line([[13 + dx, 6, 0.5], [18 + dx, 18, 2], [24 + dx, 34, 0.5]], 'windFx', 12); },
  'wind/a1': (c) => { crescent(c, 26, 22, 15, 1.9, 4.6, 3.2, 'windFx', 12); for (const y of [12, 20, 28]) c.line([[30, y, 0.4], [37, y - 2, 1]], 'white', 10); },
  'wind/a2': (c) => { for (let i = 0; i < 6; i++) { const y = 8 + i * 4.6, r = 15 - i * 2.2; c.ellp(20 + Math.sin(i) * 1.5, y, r, 2.2, 'windFx', 12 - i * 0.1); } c.line([[20, 34, 1.2], [21, 36, 0.6]], 'windFx', 12); },
  // TRAINER / SYSTEM
  'trainer/rally': (c) => { for (const y of [24, 16, 8]) c.poly([[8, y + 8], [20, y], [32, y + 8], [32, y + 12], [20, y + 4], [8, y + 12]], 'gold', 12); },
  'trainer/mend': (c) => { c.poly([[20, 34], [6, 20], [6, 12], [12, 7], [20, 12], [28, 7], [34, 12], [34, 20]], 'heart', 11, { bulge: 1 }); const lp = leafPoly(10, 5, { n: 5 }).map(([u, v]) => [24 + u * 0.7 - v * 0.7, 10 - u * 0.7 - v * 0.7]); c.poly(lp, 'leaf', 13); },
  'trainer/surge': (c) => { const pts = []; for (let i = 0; i < 16; i++) { const a = i / 16 * TAU - Math.PI / 2, r = i % 4 === 0 ? 17 : i % 2 ? 6 : 10; pts.push([20 + Math.cos(a) * r, 20 + Math.sin(a) * r]); } c.poly(pts, 'magic', 12, { heatFn: d => 0.3 + d * 1.2 }); c.disc(20, 20, 3.5, 'white', 13); },
  'trainer/capture': (c) => { c.sph(20, 21, 13, (a, b) => Math.abs(b) < 0.12 ? 'gold' : b > 0 ? 'glass' : 'navy', 10); c.ellp(20, 21, 3, 3, 'heart', 14); },
  'trainer/potion': (c) => { c.poly([[17, 5], [23, 5], [23, 13], [31, 22], [31, 32], [9, 32], [9, 22], [17, 13]], 'glass', 10, { bulge: 0.8 }); c.poly([[10, 23], [30, 23], [30, 31], [10, 31]], 'potion', 11, { bulge: 0.8 }); c.poly([[16, 3], [24, 3], [24, 7], [16, 7]], 'wood', 12); },
  'trainer/swap': (c) => { crescent(c, 20, 20, 12, 3.6, 6.0, 2.5, 'white', 12); crescent(c, 20, 20, 12, 0.5, 2.9, 2.5, 'white', 12); c.poly([[29, 4], [36, 13], [26, 14]], 'white', 12); c.poly([[11, 36], [4, 27], [14, 26]], 'white', 12); },
  'trainer/evolve': (c) => { c.poly([[20, 4], [33, 18], [25, 18], [25, 35], [15, 35], [15, 18], [7, 18]], 'gold', 12, { bulge: 0.8 }); for (const [x, y] of [[8, 8], [33, 30], [7, 28]]) c.poly([[x, y - 3], [x + 1, y], [x, y + 3], [x - 1, y]], 'white', 13); },
  'trainer/recall': (c) => { c.poly([[20, 6], [34, 18], [30, 18], [30, 33], [10, 33], [10, 18], [6, 18]], 'white', 11, { bulge: 0.6 }); c.poly([[17, 24], [23, 24], [23, 33], [17, 33]], 'navy', 12); },
};
export const ABILITY_NAMES = {
  'fire/basic': 'Ember Shot', 'fire/a1': 'Ember Volley', 'fire/a2': 'Flame Pillar',
  'water/basic': 'Tide Bite', 'water/a1': 'Bubble Jet', 'water/a2': 'Tidal Mend',
  'grass/basic': 'Leaf Blade', 'grass/a1': 'Vine Lash', 'grass/a2': 'Thorn Bulwark',
  'electric/basic': 'Zap', 'electric/a1': 'Spark Bolt', 'electric/a2': 'Static Dash',
  'earth/basic': 'Rock Smash', 'earth/a1': 'Rock Slam', 'earth/a2': 'Quake Charge',
  'wind/basic': 'Gale Peck', 'wind/a1': 'Gale Slash', 'wind/a2': 'Cyclone',
  'trainer/rally': 'Rally', 'trainer/mend': 'Mend', 'trainer/surge': 'Surge', 'trainer/capture': 'Capture',
  'trainer/potion': 'Potion', 'trainer/swap': 'Swap', 'trainer/evolve': 'Evolve', 'trainer/recall': 'Recall',
};
export const ICON_IDS = Object.keys(GLYPHS);

function roundRect(x0, y0, x1, y1, r) {
  const pts = [];
  const cs = [[x1 - r, y0 + r, -Math.PI / 2], [x1 - r, y1 - r, 0], [x0 + r, y1 - r, Math.PI / 2], [x0 + r, y0 + r, Math.PI]];
  for (const [cx, cy, a0] of cs) for (let i = 0; i <= 4; i++) { const a = a0 + i / 4 * Math.PI / 2; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  return pts;
}

// Render an ability/skill icon. id e.g. 'fire/a1'. size 32..48.
export function renderIcon(id, size = 40) {
  const el = id.startsWith('trainer/') ? 'neutral' : id.split('/')[0];
  const mats = iconMats(el);
  const s = new Scene({ w: size, h: size, ax: 0, ay: size, scale: 1, yaw: 0, pitch: 0, mats, lineThr: 1 });
  const k = size / 40;
  s.lineThr = 1;
  s.poly2(roundRect(1, 1, size - 1, size - 1, 5 * k), -50, 'frame', { heatFn: d => Math.min(1, d / 2.2) });
  s.poly2(roundRect(3 * k, 3 * k, size - 3 * k, size - 3 * k, 3.5 * k), -40, 'bg', { heatFn: (d) => d });
  const c = ctx(s, k);
  GLYPHS[id](c);
  return s.finish({ shadow: 0.4, rim: 0 });
}

// Small element symbol icon (round), size 16..32
export function renderElementIcon(el, size = 16) {
  const mats = iconMats(el);
  const s = new Scene({ w: size, h: size, ax: 0, ay: size, scale: 1, yaw: 0, pitch: 0, mats });
  s.lineThr = 1;
  const k = size / 40;
  s.disc2(size / 2, size / 2, size / 2 - 1, -50, 'bg', { heatFn: d => Math.min(1, d * 1.2) });
  const c = ctx(s, k);
  elementGlyph(c, el, 20, 20, 11, 12);
  return s.finish({ shadow: 0, rim: 0 });
}

// Type badge pill: [icon] NAME, height 16
export function renderBadge(el, h = 16) {
  const E = ELEMENT_COLORS[el];
  const tw = textWidth(E.name);
  const w = Math.max(48, tw + h + 8);
  const mats = iconMats(el);
  const s = new Scene({ w, h, ax: 0, ay: h, scale: 1, yaw: 0, pitch: 0, mats });
  s.lineThr = 1;
  s.poly2(roundRect(1, 1, w - 1, h - 1, h / 2 - 1), -50, 'bg', { heatFn: d => Math.min(1, d / 3) });
  const k = h / 40;
  const c = ctx(s, k);
  s.disc2(h / 2, h / 2, h / 2 - 2.5, -10, 'frame', { heatFn: () => 0.5 });
  elementGlyph(c, el, 20, 20, 10.5, 12);
  const tx = h + 2 + Math.round((w - h - 4 - tw) / 2), ty = Math.round((h - 7) / 2);
  const tp = textPixels(E.name, tx, ty);
  s.decal(tp.map(([x, y]) => [x + 1, y + 1, 'text', 0]));
  s.decal(tp.map(([x, y]) => [x, y, 'text', 2]));
  return s.finish({ shadow: 0, rim: 0 });
}
