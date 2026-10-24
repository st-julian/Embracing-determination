// WIND line: Zephlet -> Galeon -> Tempestral (Wind/Water)
import { mouth, eyes } from '../face.js';
import { onEll, sparks, smoothPoly, wingPoly, featherBias, featherWing, leafPoly, TAU, hash } from '../parts.js';
const norm3 = (v) => { const l = Math.hypot(...v); return v.map(x => x / l); };
import { WATERFX } from './water.js';

export const WINDFX = { ramp: ['#7ab8e0', '#a0d8f4', '#c8f0ff', '#e8fbff', '#ffffff'], emissive: true, outline: '#3a6aa0', noLine: true, noCastLine: true, th: [0.1, 0.3, 0.55, 0.8] };

// wind gust crescents in screen space
function gust(s, p, r, t, mat, o = {}) {
  const [x, y, z] = s.proj(p);
  const pts = [];
  for (let k = 0; k <= 8; k++) {
    const a = (0.1 + k / 8 * 0.75 + t) * TAU;
    pts.push([x + Math.cos(a) * r * s.S, y + Math.sin(a) * r * s.S * (o.flat ?? 0.45), (0.4 + Math.sin(k / 8 * Math.PI) * (o.w ?? 1.2)) * s.S]);
  }
  s.stroke2(pts, z + (o.z ?? 30), mat, { shade: 0.5 });
}
function slashFx(s, P, p, size) {
  if (P.noFx) return;
  if (P.anim === 'attack' && P.fxi >= 2 && P.fxi <= 4) {
    const [x, y, z] = s.proj(p);
    const pts = [];
    const ext = P.fxi === 3 ? 1 : 0.7;
    for (let k = 0; k <= 10; k++) {
      const f = k / 10;
      const a = (-0.65 + f * 1.1) * Math.PI * ext;
      pts.push([x - Math.sin(a) * size * s.S, y - Math.cos(a) * size * 0.9 * s.S, (Math.sin(f * Math.PI) * size * 0.14 + 0.4) * s.S]);
    }
    s.stroke2(pts, z + 40, 'windFx');
  }
  if (P.cast) for (let k = 0; k < 3; k++) gust(s, [0, p[1] - size * 0.2 + k * size * 0.4, 0], size * (1.2 - k * 0.2), P.t + k * 0.3, 'windFx', { z: k % 2 ? 30 : -30 });
}
function birdWing(s, P, sd, root, o) {
  s.push(); s.t(sd * root[0], root[1], root[2]);
  s.rz(sd * o.open);
  featherWing(s, [0, 0, 0], norm3([sd * 0.9, 0.3, -0.12]), norm3([0, -0.25, -0.97]), { gname: 'w' + sd, ...o });
  s.pop();
}
// hover flap: P -> wing open angle
const flapAng = (P, base, amp, speed = 1) => {
  if (P.faint) return base * (1 - P.faint) - 0.4 * P.faint;
  const ph = (P.t * speed) * TAU;
  return base + Math.sin(ph) * amp + (P.cast ? P.cast * 0.3 : 0) + (P.atk < 0 ? -P.atk * 0.4 : P.atk * -0.3);
};

// ------------------------------------------------------------------------------------
export const zephlet = {
  id: 'zephlet', quirk: 'hop', name: 'Zephlet', line: 'wind', stage: 0, types: ['wind'],
  cell: [64, 64], height: 26, width: 18, shadow: 9, hover: 5, hoverBob: 1.5, scale: 1.2, faintRoll: 40,
  mats: {
    fluff: { c: '#f4f8ff', dark: 0.75, coolHue: 4.7 }, sky: { c: '#9fd2ff' }, beak: { c: '#ffc23a', hi: true },
    feet: { c: '#ff9a3a' }, iris: { c: '#1c2a5a' }, cheek: { c: '#ffb0c8' }, windFx: WINDFX,
  },
  draw(s, P) {
    const br = P.breathe, t = P.t;
    s.group('body');
    // round cloud-puff body made of overlapping puffs
    const puffs = [[0, 10, 0, 7.2], [-4.5, 8, -1.5, 4.4], [4.5, 8, -1.5, 4.4], [0, 7, -4.5, 4.8], [-3.5, 13.5, -2, 4], [3.5, 13.5, -2, 4], [0, 15, -3.5, 4.4]];
    puffs.forEach(([x, y, z, r], k) => s.ell([x, y + br * 0.2, z], [r + br * 0.1, r * 0.92, r], (a, b) => b < -0.55 && k === 0 ? 'sky' : 'fluff', { grp: k === 0 ? s.group('body') : s.group('puff' + k) }));
    // tiny feet
    s.group('feet');
    for (const sd of [-1, 1]) s.tube([[sd * 2.4, 3.5, 1, 0.8], [sd * 2.6, 0.6 - (P.faint ? 0 : 0), 2, 0.7]], 'feet');
    // stubby wings
    s.group('wing');
    const op = flapAng(P, 0.5, 0.45, 2);
    for (const sd of [-1, 1]) birdWing(s, P, sd, [5.5, 11.5, -1], { open: op, n: 4, arm: 3, len: 7, fw: 3.4, a0: -0.1, a1: 1.3, mat: () => 'fluff', tipMat: () => 'sky', tipAt: 0.55, armMat: 'fluff', armW: 4, dz: 1.2 });
    // tail curl
    s.group('tail');
    s.tube([[0, 9, -6.5, 2], [0, 12, -9, 1.6], [0, 15, -8.5, 1.2], [0, 15.5, -6.5, 0.9]], 'sky');
    // head tuft curl
    s.group('tuft');
    s.tube([[0, 16, 1, 1.5], [0, 20, 0.5, 1.2], [0, 21.5, -1.5, 1], [0, 20.5, -3, 0.8], [0, 19.2, -2, 0.7]], 'sky');
    s.group('body');
    const HC = [0, 10, 0], HR = [7.2, 6.6, 7.2];
    eyes(s, P, HC, HR, { dx: 3, dy: 2, w: 4, h: 5, style: 'cute', host: 'body' });
    s.group('beak');
    const bo = P.mouth > 0.4 ? 0.8 : 0;
    s.ell([0, 9.6 + bo * 0.5, 7.2], [1.5, 1.1, 1.6], 'beak', { rot: [0.3, 0, 0] });
    s.ell([0, 8.4 - bo, 6.8], [1.2, 0.8, 1.2], 'beak', { rot: [0.3, 0, 0], bias: -0.3 });
    if (P.front) {
      for (const sd of [-1, 1]) {
        const p = s.proj(onEll(HC, HR, sd * 4.6, -1.2));
        if (s.dir([sd, -0.1, 0.7])[2] > 0.3) s.decal([[p[0], p[1], 'cheek', 3], [p[0] + 1, p[1], 'cheek', 2]], { host: s.groups.body, z: p[2], tol: 3 });
      }
    }
    slashFx(s, P, [0, 10, 12], 9);
  },
};

// ------------------------------------------------------------------------------------
export const galeon = {
  id: 'galeon', quirk: 'look', name: 'Galeon', line: 'wind', stage: 1, types: ['wind'],
  cell: [96, 96], height: 40, width: 30, shadow: 12, hover: 12, hoverBob: 2, scale: 1.15, faintRoll: 18,
  mats: {
    sky: { c: '#4a9ee8' }, skyD: { c: '#2f6cc0' }, white: { c: '#f2f6ff', dark: 0.75 }, mask: { c: '#26306a' },
    beak: { c: '#ffc23a', hi: true }, talon: { c: '#ffb43a' }, tip: { c: '#1e2a5a' }, iris: { c: '#ffd040' }, windFx: WINDFX,
  },
  draw(s, P) {
    const br = P.breathe, t = P.t;
    s.rx(0.25);
    s.group('body');
    // streamlined body
    s.ell([0, 14 + br * 0.2, -1], [5.6, 6.4, 10], (a, b, c) => (c > 0.2 && b < 0.4) || b < -0.5 ? ((Math.sin(b * 14) > 0.75 && c > 0.3) ? 'sky' : 'white') : 'sky', { rot: [-0.25, 0, 0] });
    // talons tucked
    s.group('legs');
    for (const sd of [-1, 1]) {
      s.tube([[sd * 2.6, 9, 1, 1.4], [sd * 2.8, 5, 2.5, 1], [sd * 2.8, 3.6, 4, 0.8]], 'talon');
      s.tube([[sd * 2.8, 3.8, 4, 0.6], [sd * 2.8, 2.6, 5.4, 0.4]], 'tip');
    }
    // tail fan
    s.group('tail');
    const tf = Math.sin(t * TAU) * 0.08;
    s.push(); s.t(0, 13, -10); s.rx(0.5 + tf);
    s.card([0, 0, 0], [0, 0, -1], [1, 0, 0], smoothPoly([[0, -2], [8, -5], [11, -2.5], [10, 0], [11, 2.5], [8, 5], [0, 2]], 2), (u, v) => [u > 8 ? 'tip' : 'skyD', Math.abs(Math.sin(v * 1.2)) < 0.15 ? -0.3 : 0], { bulge: 0.4 });
    s.pop();
    // big swept wings
    s.group('wing');
    const op = flapAng(P, 0.35, 0.55, P.gait >= 0 ? 2 : 1);
    const span = 24, dep = 13;
    for (const sd of [-1, 1]) birdWing(s, P, sd, [4, 18, 1], {
      open: op, n: 8, arm: 10, len: 17, fw: 4.6, a0: -0.2, a1: 1.45, baseSpan: 0.9,
      mat: (k) => k < 4 ? 'sky' : 'skyD', tipMat: (k) => k < 5 ? 'tip' : 'white', tipAt: 0.68, armMat: 'skyD', armW: 6,
    });
    // head with crest & falcon mask
    s.group('head');
    s.push();
    s.t(0, 22 + br * 0.3 + (P.hurt ? 1 : 0), 7.5);
    s.ry(P.look);
    s.rx(-0.25 - P.mouth * 0.15 + P.hurt * 0.25);
    const HC = [0, 0, 0], HR = [4.8, 4.6, 5.2];
    s.ell(HC, HR, (a, b, c) => (b < -0.15 && c > 0.3) ? 'white' : (c > 0.2 && b < 0.25 && Math.abs(a) > 0.35 ? 'mask' : 'sky'));
    s.group('crest');
    for (let k = 0; k < 3; k++) s.tube([[0, 3.5, 1 - k * 2, 1.3], [0, 6.5 - k * 0.6, -3 - k * 2.5, 0.8], [0, 7 - k, -6.5 - k * 2, 0.35]], 'skyD');
    s.group('beak');
    const bo = P.mouth > 0.4 ? 1 : 0;
    s.tube([[0, 0, 4.2, 1.6], [0, -0.6, 6.5, 1.1], [0, -2 - bo * 0.4, 7.4, 0.5]], (a, b) => 'beak');
    s.group('head');
    eyes(s, P, HC, HR, { dx: 2.4, dy: 0.9, w: 5, h: 5, style: 'normal', lid: 0.3 });
    s.pop();
    slashFx(s, P, [0, 16, 16], 13);
  },
};

// ------------------------------------------------------------------------------------
export const tempestral = {
  id: 'tempestral', quirk: 'proud', name: 'Tempestral', line: 'wind', stage: 2, types: ['wind', 'water'],
  cell: [128, 128], height: 62, width: 70, shadow: 22, hover: 20, hoverBob: 3, scale: 1.22, faintRoll: 15,
  mats: {
    blue: { c: '#3456b8' }, blueD: { c: '#26388a' }, white: { c: '#eef4ff', dark: 0.75 }, aqua: { c: '#58e2f0', dark: 0.85 },
    gold: { c: '#ffc23a', hi: true, gloss: true }, talon: { c: '#2a2a50' }, beak: { c: '#ffd25a', hi: true },
    iris: { c: '#4af0ff' }, windFx: WINDFX, water: WATERFX,
  },
  draw(s, P) {
    const br = P.breathe, t = P.t;
    s.rx(0.2);
    s.group('body');
    s.ell([0, 20 + br * 0.3, -2], [8.6, 10, 14], (a, b, c) => (c > 0.25 && b < 0.45) || b < -0.5 ? 'white' : 'blue', { rot: [-0.3, 0, 0] });
    // talons
    s.group('legs');
    for (const sd of [-1, 1]) {
      s.tube([[sd * 4, 13, 1, 2.6], [sd * 4.4, 7, 3, 1.4], [sd * 4.4, 5, 5.5, 1.1]], (a, b) => b > 0.3 ? 'white' : 'gold');
      for (let c = -1; c <= 1; c++) s.tube([[sd * 4.4 + c * 1.1, 5, 5.5, 0.6], [sd * 4.4 + c * 1.4, 3, 7.5, 0.4]], 'talon');
    }
    // long tail streamers with spray tips
    s.group('tail');
    for (let k = -1; k <= 1; k++) {
      const sw = Math.sin((t + k * 0.2) * TAU) * 2;
      const tp = [[k * 2, 18, -14, 2.2], [k * 4 + sw * 0.3, 14, -22, 1.8], [k * 6 + sw, 12 - Math.abs(k) * 2, -31, 1.4], [k * 7 + sw * 1.4, 13 - Math.abs(k) * 3, -38, 0.9]];
      s.tube(tp, null, { matAlong: f => f > 0.7 ? 'aqua' : 'blue' });
      const e = tp[3];
      const p = s.proj([e[0], e[1], e[2]]);
      s.disc2(p[0] + s.S, p[1] + (2 + (P.fxi % 2)) * s.S, 1.2 * s.S, p[2] + 1, 'water');
    }
    // huge spread wings with water-spray tips
    s.group('wing');
    const op = flapAng(P, 0.38, 0.5, 1);
    const span = 42, dep = 20;
    for (const sd of [-1, 1]) birdWing(s, P, sd, [6, 26, 1], {
      open: op, n: 10, arm: 15, len: 26, fw: 6, a0: -0.25, a1: 1.5, baseSpan: 0.9,
      mat: (k) => k < 5 ? 'blue' : 'white', tipMat: (k) => 'aqua', tipAt: 0.66, armMat: 'gold', armW: 7,
    });
    // spray droplets falling from wing tips
    s.group('fx');
    for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) {
      const p = s.proj([sd * (36 - k * 7), 22 - ((P.fxi * 3 + k * 5) % 9), -12 - k * 6]);
      s.disc2(p[0], p[1], s.S, p[2] + 1, 'water');
    }
    // neck ruff & head
    s.group('neck');
    s.tube([[0, 26, 7, 5.4], [0, 31, 10, 4.4]], (a, b, c) => c > 0.3 ? 'white' : 'blue');
    s.group('head');
    s.push();
    s.t(0, 35 + br * 0.4 + (P.hurt ? 1.5 : 0), 12);
    s.ry(P.look);
    s.rx(-0.2 - P.mouth * 0.15 + P.hurt * 0.25);
    const HC = [0, 0, 0], HR = [6, 5.6, 6.4];
    s.ell(HC, HR, (a, b, c) => (b < -0.2 && c > 0.3) ? 'white' : 'blue');
    s.group('crest');
    for (let k = 0; k < 4; k++) {
      const sw = Math.sin((t + k * 0.15) * TAU) * 0.6;
      s.tube([[0, 4, 1.5 - k * 1.6, 1.4], [sw, 9 - k * 0.5, -3 - k * 2.5, 1], [sw * 1.5, 12 - k * 1.2, -9 - k * 2.6, 0.6], [sw * 2, 12.5 - k * 2, -14 - k * 2.4, 0.35]], null, { matAlong: f => f > 0.7 ? 'aqua' : k % 2 ? 'gold' : 'blueD' });
    }
    s.group('beak');
    const bo = P.mouth > 0.4 ? 1 : 0;
    s.tube([[0, -0.4, 5, 2.2], [0, -1, 8.2, 1.5], [0, -2.6 - bo, 9.6, 0.6]], 'beak');
    s.group('head');
    eyes(s, P, HC, HR, { dx: 2.9, dy: 1.1, w: 6, h: 6, style: 'normal', lid: 0.32 });
    s.pop();
    slashFx(s, P, [0, 22, 20], 18);
  },
};

export default [zephlet, galeon, tempestral];
