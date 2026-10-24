// GRASS line: Sproutle -> Fernhorn -> Verdantusk (Grass/Earth)
import { leg } from '../rig.js';
import { mouth, eyes } from '../face.js';
import { onEll, orb, sparks, leafPoly, smoothPoly, TAU, hash } from '../parts.js';

export const LEAFFX = { ramp: ['#2f8a3a', '#47b04a', '#72d65a', '#b4f07a', '#efffc8'], emissive: true, outline: '#1d5a2a', noLine: true, noCastLine: true, th: [0.1, 0.3, 0.55, 0.8] };
const fawnSpot = (a, b, c) => b > 0.1 && Math.sin(a * 11 + 0.5) * Math.sin(c * 9 + 1.3) > 0.6;

// leaf card attached at local p, pointing along dir (unit-ish), flat across 'across'
export function leaf(s, p, dir, across, L, W, mat, o = {}) {
  s.card(p, dir, across, leafPoly(L, W, { n: o.n || 6, bend: o.bend || 0 }), (u, v) => [o.matFn ? o.matFn(u, v) : mat, Math.abs(v) < 0.45 && u > L * 0.15 && u < L * 0.85 ? -0.3 : 0], { bulge: 0.45, backMat: o.backMat });
}
function leafStorm(s, P, y, r, size) {
  if (!P.cast || P.noFx) return;
  sparks(s, [0, y, 0], { n: 7, r, t: P.t, mat: 'leafFx', size, flat: 0.4, shape: 'diamond', rise: 2 });
}
function vineFx(s, P, mp, size) {
  if (P.anim !== 'attack' || P.noFx) return;
  if (P.fxi >= 2 && P.fxi <= 4) {
    const k = P.fxi === 3 ? 1.8 : P.fxi === 2 ? 1 : 1.4;
    const a = s.proj(mp), b = s.proj([mp[0], mp[1] - size * 0.2, mp[2] + size * k]);
    const pts = [];
    for (let j = 0; j <= 8; j++) { const f = j / 8; pts.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f + Math.sin(f * TAU * 1.5) * size * 0.12 * s.S, size * 0.12 * s.S * (1.2 - f * 0.5)]); }
    s.stroke2(pts, a[2] + 30, 'vine', { shade: 0.45 });
    s.disc2(b[0], b[1], size * 0.2 * s.S, a[2] + 31, 'leafFx');
  }
}

// ------------------------------------------------------------------------------------
export const sproutle = {
  id: 'sproutle', quirk: 'hop', name: 'Sproutle', line: 'grass', stage: 0, types: ['grass'],
  cell: [64, 64], height: 34, width: 16, shadow: 8, scale: 1.1,
  mats: {
    fur: { c: '#dc9a56', hi: true }, cream: { c: '#fff2d0', dark: 0.85 }, hoof: { c: '#5a3a32' },
    leafA: { c: '#5ccf4a' }, leafB: { c: '#3fae46' }, stem: { c: '#6a9a3a' }, earIn: { c: '#7ad85a' },
    nose: { c: '#3a2a2a' }, iris: { c: '#2a3a1a' }, leafFx: LEAFFX, vine: { c: '#4aa040' },
  },
  draw(s, P) {
    const br = P.breathe, t = P.t, walk = P.gait >= 0;
    s.group('body');
    s.ell([0, 12 + br * 0.2, -1], [4.8, 5 + br * 0.15, 7.6], (a, b, c) => b < -0.4 ? 'cream' : fawnSpot(a, b, c) ? 'cream' : 'fur');
    s.ell([0, 12.5, 4.5], [3.8, 4.4, 3.2], (a, b, c) => c > 0.3 ? 'cream' : 'fur', { grp: s.group('chest') });
    const legO = { l1: 4.4, l2: 5.2, r1: 1.5, r2: 1.1, mat: 'fur', paw: 'hoof', pawR: 1.3, stride: 2.8, lift: 2.4, pawFlat: 1 };
    s.group('legF'); leg(s, P, [-2.5, 9.5, 4], { ...legO, phase: 0, front: true, atkReach: 1.5 }); leg(s, P, [2.5, 9.5, 4], { ...legO, phase: 0.5, front: true, atkReach: 1.5 });
    s.group('legB');
    for (const sd of [-1, 1]) { s.ell([sd * 2.8, 12, -5.5], [2.2, 3.6, 3.4], 'fur'); leg(s, P, [sd * 2.8, 10, -6], { ...legO, r1: 1.8, phase: sd < 0 ? 0.5 : 0, bend: 1 }); }
    // leaf tail
    s.group('tail');
    const sw = Math.sin(t * TAU * 2) * 0.3;
    leaf(s, [0, 14, -8], [0, 0.6 + sw * 0.3, -0.8], [1, 0, 0], 6, 3.4, 'leafA');
    // neck + head
    s.group('neck');
    s.tube([[0, 14, 4, 2.6], [0, 18, 5.5, 2.3]], 'fur');
    s.group('head');
    s.push();
    s.t(0, 22 + br * 0.35 + (P.hurt ? 0.8 : 0), 6);
    s.ry(P.look);
    s.rx(-P.mouth * 0.2 + P.hurt * 0.2);
    s.rz(P.anim === 'idle' ? Math.sin(t * TAU) * 0.05 : 0);
    const HC = [0, 0, 0], HR = [6.4, 5.8, 5.8];
    s.ell(HC, HR, 'fur');
    s.group('muzzle');
    s.ell([0, -2.2, 4.4], [3, 2.3, 2.8], 'cream');
    s.ell([0, -1.3, 7], [1, 0.8, 0.8], 'nose');
    // big deer ears
    s.group('ear');
    for (const sd of [-1, 1]) {
      s.push(); s.t(sd * 4.8, 2.4, -1); s.rz(-sd * (1.1 + (P.anim === 'idle' && sd > 0 ? Math.sin(t * TAU * 2) * 0.12 : 0))); s.ry(sd * 0.5);
      s.card([0, 0, 0], [0, 1, 0], [1, 0, 0], leafPoly(7, 4.6, { n: 6 }), (u, v) => Math.abs(v) < 1.3 && u > 1 && u < 6 ? 'earIn' : 'fur', { backMat: 'fur', bulge: 0.5 });
      s.pop();
    }
    // sprout on head
    s.group('sprout');
    const sp = Math.sin(t * TAU) * 0.15;
    s.tube([[0, 5, 0, 0.8], [sp, 8.5, -0.5, 0.65]], 'stem');
    leaf(s, [sp, 8.2, -0.5], [-0.9, 0.5 + sp, 0], [0, 0, 1], 6.5, 3.8, 'leafA');
    leaf(s, [sp, 8.2, -0.5], [0.9, 0.55 - sp, 0], [0, 0, 1], 5.5, 3.4, 'leafB');
    s.group('head');
    eyes(s, P, HC, HR, { dx: 2.9, dy: 0.6, w: 4, h: 5, style: 'cute' });
    if (P.front) {
      const mp = [0, -3.8, 6.3];
      if (P.mouth > 0.4) mouth(s, mp, { style: 'open', w: 3, h: 2, host: 'muzzle' });
      else mouth(s, mp, { style: 'smile', w: 3, host: 'muzzle' });
    }
    s.pop();
    leafStorm(s, P, 14, 14, 1.6);
    s.push(); s.t(0, 21, 6); vineFx(s, P, [0, -2, 7], 8); s.pop();
  },
};

// ------------------------------------------------------------------------------------
function frond(s, root, dir, side, len, o) {
  // fern antler: one pinnate card (serrated leaflets both sides), curving outward, with a
  // curled fiddlehead tip
  const L = len, W = o.leafL || 5, nt = 6;
  const wAt = (u) => W * Math.pow(Math.sin(Math.PI * Math.min(1, u / L * 0.92 + 0.06)), 0.7) * (1 - 0.35 * u / L);
  const bend = (u, v) => [u, v - 0.02 * u * u];
  const R = [], Lf = [];
  R.push(bend(0, 0.6)); Lf.push(bend(0, -0.6));
  for (let j = 0; j < nt; j++) {
    const u = L * (0.12 + 0.82 * j / nt), w = wAt(u);
    R.push(bend(u + 0.3, 0.7), bend(u + 1.9, w), bend(u + 1.4, w * 0.45));
    Lf.push(bend(u + 0.3, -0.7), bend(u + 1.9, -w), bend(u + 1.4, -w * 0.45));
  }
  R.push(bend(L, 0.4)); Lf.push(bend(L, -0.4));
  const poly = R.concat(Lf.reverse());
  const up = [0, 1, 0];
  const across = [up[0] - dir[0] * dir[1], up[1] - dir[1] * dir[1], up[2] - dir[2] * dir[1]];
  const al = Math.hypot(...across);
  const ac = across.map(x => x / al * -side);
  s.card(root, dir, ac, poly, (u, v) => [o.leaf, Math.abs(v + 0.02 * u * u) < 0.6 ? -0.35 : 0], { bulge: 0.35 });
  // fiddlehead curl at the tip
  const [tu, tv] = bend(L, 0);
  const tip = [root[0] + dir[0] * tu + ac[0] * tv, root[1] + dir[1] * tu + ac[1] * tv, root[2] + dir[2] * tu + ac[2] * tv];
  const pts = [];
  for (let k = 0; k <= 7; k++) { const a = k / 7 * 1.6 * Math.PI; const r = 1.8 * (1 - k / 9); pts.push([tip[0] + side * (Math.sin(a) * r * 0.6), tip[1] + (1 - Math.cos(a)) * r, tip[2] + Math.sin(a) * r * 0.5, 0.75 - k * 0.04]); }
  s.tube(pts, o.leaf);
}

export const fernhorn = {
  id: 'fernhorn', quirk: 'look', name: 'Fernhorn', line: 'grass', stage: 1, types: ['grass'],
  cell: [96, 96], height: 56, width: 22, shadow: 12,
  mats: {
    fur: { c: '#b86e42' }, back: { c: '#8e4c34' }, cream: { c: '#fff1d0', dark: 0.85 }, bark: { c: '#6a4a3a' }, hoof: { c: '#3a2a2a' },
    leafA: { c: '#4fcf52' }, leafB: { c: '#38a84e' }, stem: { c: '#6c8a3a' }, flower: { c: '#ffd85a', hi: true },
    nose: { c: '#2e2626' }, iris: { c: '#d8a03a' }, leafFx: LEAFFX, vine: { c: '#4aa040' },
  },
  draw(s, P) {
    const br = P.breathe, t = P.t, walk = P.gait >= 0;
    s.group('body');
    s.ell([0, 21 + br * 0.25, -2], [6, 6.6 + br * 0.2, 12], (a, b, c) => b < -0.35 ? 'cream' : b > 0.55 ? 'back' : (b > 0.1 && Math.sin(a * 10) * Math.sin(c * 8 + 1) > 0.7) ? 'cream' : 'fur');
    s.group('chest');
    s.ell([0, 22.5, 7], [5.2, 6.4, 5], (a, b, c) => c > 0.3 ? 'cream' : 'fur');
    const legO = { mat: 'fur', paw: 'hoof', pawR: 1.8, stride: 4.5, lift: 3.5, r2: 1.4, pawFlat: 1, matLow: 'bark' };
    s.group('legF');
    for (const sd of [-1, 1]) leg(s, P, [sd * 3, 18, 7], { ...legO, l1: 8, l2: 10, r1: 2.6, phase: sd < 0 ? 0 : 0.5, front: true, atkReach: 3, atkLift: 3 });
    s.group('legB');
    for (const sd of [-1, 1]) { s.ell([sd * 3.6, 21.5, -9], [3.2, 5.6, 5.2], 'fur'); leg(s, P, [sd * 3.6, 19, -9.5], { ...legO, l1: 8.6, l2: 10.4, r1: 3, phase: sd < 0 ? 0.5 : 0, bend: 1 }); }
    // leafy mane collar
    s.group('mane');
    for (let k = 0; k < 7; k++) {
      const a = (k / 6 - 0.5) * 2.6;
      leaf(s, [Math.sin(a) * 4.6, 26 + Math.cos(a) * 1.5, 7 - Math.cos(a) * 3], [Math.sin(a) * 0.8, -0.35, -0.5], [0, 0.5, -1], 6.5, 3.6, k % 2 ? 'leafA' : 'leafB');
    }
    // white tail tuft
    s.group('tail');
    s.ell([0, 24, -13.5], [2.4, 3, 2.4], 'cream', { rot: [-0.6 + Math.sin(t * TAU) * 0.1, 0, 0] });
    // neck & head
    s.group('neck');
    s.tube([[0, 24, 7, 3.8], [0, 30, 10, 3.2], [0, 34, 11.5, 3]], (a, b, c) => c > 0.4 ? 'cream' : 'fur');
    s.group('head');
    s.push();
    s.t(0, 37 + br * 0.4 + (P.hurt ? 1 : 0), 12.5);
    s.ry(P.look);
    s.rx(-P.mouth * 0.25 + P.hurt * 0.25 + (P.atk ? P.atk * 0.25 : 0));
    const HC = [0, 0, 0], HR = [5, 4.8, 5.2];
    s.ell(HC, HR, 'fur');
    s.group('muzzle');
    s.ell([0, -1.8, 4.6], [2.8, 2.5, 3.8], (a, b) => b < 0 ? 'cream' : 'fur');
    s.ell([0, -0.9, 8.1], [1.2, 0.9, 0.9], 'nose');
    s.group('ear');
    for (const sd of [-1, 1]) {
      s.push(); s.t(sd * 4, 1.5, -1.5); s.rz(-sd * 1.25); s.ry(sd * 0.4);
      s.card([0, 0, 0], [0, 1, 0], [1, 0, 0], leafPoly(6, 3.6, { n: 6 }), 'fur', { bulge: 0.5 });
      s.pop();
    }
    // fern antlers
    s.group('antler');
    const sway = Math.sin(t * TAU) * 0.05;
    for (const sd of [-1, 1]) { const d = [sd * 0.5, 0.86 + sway, -0.1]; const l = Math.hypot(...d); frond(s, [sd * 2.4, 3.8, -0.5], d.map(x => x / l), sd, 15, { stem: 'stem', leaf: sd < 0 ? 'leafA' : 'leafB', leafL: 6.5 }); }
    s.group('flower');
    s.ell([2.8, 4.2, 1.5], [1.3, 1.1, 1.1], 'flower');
    s.group('head');
    eyes(s, P, HC, HR, { dx: 2.5, dy: 1.1, w: 5, h: 5, style: 'normal', lid: 0.12 });
    if (P.front) {
      const mp = [0, -3.4, 7.2];
      if (P.mouth > 0.4) mouth(s, mp, { style: 'open', w: 3, h: 2, host: 'muzzle' });
      else mouth(s, mp, { style: 'line', w: 2, host: 'muzzle' });
    }
    s.pop();
    leafStorm(s, P, 24, 22, 2);
    s.push(); s.t(0, 37, 12.5); vineFx(s, P, [0, -1, 8], 11); s.pop();
  },
};

// ------------------------------------------------------------------------------------
export const verdantusk = {
  id: 'verdantusk', quirk: 'proud', name: 'Verdantusk', line: 'grass', stage: 2, types: ['grass', 'earth'],
  cell: [128, 128], height: 66, width: 40, shadow: 24,
  mats: {
    hide: { c: '#7d6a58' }, moss: { c: '#4c9a3e' }, moss2: { c: '#6cbc4a' }, stone: { c: '#9c9a8c' }, tusk: { c: '#efe2c2', dark: 0.8 },
    bark: { c: '#5e4636' }, leafA: { c: '#4fcf52' }, flower: { c: '#ff8cc2' }, flowerC: { c: '#ffe066', hi: true },
    nose: { c: '#2e2626' }, iris: { c: '#ffd04a' }, leafFx: LEAFFX, vine: { c: '#4aa040' },
  },
  draw(s, P) {
    const br = P.breathe, t = P.t, walk = P.gait >= 0;
    s.group('body');
    s.ell([0, 31 + br * 0.3, -3], [15, 14 + br * 0.3, 21], (a, b) => b > 0.25 ? 'moss' : 'hide');
    // mossy hump with bushes, stones and flowers
    s.group('moss');
    s.ell([0, 40, -3], [12, 7, 16], (a, b, c) => (b > 0.2 && Math.sin(a * 6) * Math.sin(c * 5) > 0.3) ? 'moss2' : 'moss');
    const bush = [[-5, 47, 2, 4.6], [4, 47.5, -3, 5], [-2, 46, -11, 4.4], [6, 44, 7, 3.4], [-8, 43, -6, 3.4]];
    bush.forEach(([x, y, z, r], k) => { s.group('bush' + k); s.ell([x, y, z], [r, r * 0.85, r], (a, b, c) => b > 0.3 && hash(Math.round(a * 4) + Math.round(c * 4) * 7) > 0.6 ? 'moss2' : 'moss'); });
    s.group('stone');
    s.ell([8, 42, -12], [4, 3, 4.4], 'stone', { rot: [0.3, 0.4, 0.2] });
    s.ell([-9, 41, 5], [3.4, 2.6, 3.6], 'stone', { rot: [0.2, -0.3, 0.1] });
    s.group('flower');
    [[-4, 51.5, 2], [5, 52, -3], [-1, 50, -11], [6.5, 47, 7]].forEach(([x, y, z], k) => {
      s.ell([x, y, z], [1.5, 0.8, 1.5], 'flower'); s.ell([x, y + 0.6, z], [0.7, 0.5, 0.7], 'flowerC');
    });
    // sapling growing from back
    s.group('tree');
    s.tube([[2, 49, -4, 1.4], [2.5, 55, -5, 1.1], [3, 60, -5.5, 0.8]], 'bark');
    s.ell([3, 62, -5.5], [4.6, 3.6, 4.6], 'moss2');
    s.ell([1, 60, -3], [3, 2.4, 3], 'moss');
    // legs: stout pillars with stone knee plates
    const legO = { mat: 'hide', paw: 'stone', pawR: 4.6, stride: 4.5, lift: 3.5, r2: 4.4, pawFlat: 0.7, kneeK: 0.8 };
    s.group('legF');
    for (const sd of [-1, 1]) { const r = leg(s, P, [sd * 9, 22, 10], { ...legO, l1: 10, l2: 10, r1: 6.4, phase: sd < 0 ? 0 : 0.5, front: true, atkReach: 3, atkLift: 2 }); s.ell([r.knee[0], r.knee[1], r.knee[2] + 3], [3.2, 3, 2], 'stone', { grp: s.g }); }
    s.group('legB');
    for (const sd of [-1, 1]) { const r = leg(s, P, [sd * 9.5, 23, -15], { ...legO, l1: 10.5, l2: 10, r1: 7, phase: sd < 0 ? 0.5 : 0, bend: 1 }); }
    // short tail with leaf tuft
    s.group('tail');
    s.tube([[0, 33, -23, 2.2], [Math.sin(t * TAU) * 1.5, 28, -27, 1.4]], 'hide');
    leaf(s, [Math.sin(t * TAU) * 1.5, 28, -27], [0, -0.7, -0.6], [1, 0, 0], 6, 4, 'leafA');
    // head: low, heavy, with huge tusks and leaf ears
    s.group('head');
    s.push();
    s.t(0, 30 + br * 0.4 + (P.hurt ? 1.2 : 0), 20);
    s.ry(P.look);
    s.rx(-P.mouth * 0.15 + P.hurt * 0.2 + (P.atk ? -P.atk * 0.25 : 0));
    const HC = [0, 0, 0], HR = [9, 8.6, 8.4];
    s.ell(HC, HR, (a, b) => b > 0.55 ? 'moss' : 'hide');
    s.group('snout');
    s.tube([[0, -2, 6, 4.4], [0, -6, 10, 3.4], [0, -11, 11.5, 2.6], [0, -14, 10.5, 2.1]], 'hide');
    s.group('ear');
    for (const sd of [-1, 1]) {
      s.push(); s.t(sd * 7.5, 2.5, -2); s.ry(sd * (0.6 + Math.sin(t * TAU) * 0.06));
      leaf(s, [0, 0, 0], [sd * 0.9, -0.2, -0.3], [0, 1, 0], 11, 8, 'moss', { matFn: (u, v) => Math.abs(v) < 2 && u > 2 && u < 9 ? 'leafA' : 'moss' });
      s.pop();
    }
    s.group('tusk');
    for (const sd of [-1, 1]) s.tube([[sd * 4, -5, 7, 2.2], [sd * 6.5, -9, 11, 1.9], [sd * 8, -9, 15.5, 1.4], [sd * 7.6, -5.5, 18.5, 0.8], [sd * 6.6, -2.5, 19, 0.4]], 'tusk');
    s.group('head');
    eyes(s, P, HC, HR, { dx: 4.2, dy: 1.6, w: 5, h: 5, style: 'normal', lid: 0.3 });
    s.pop();
    leafStorm(s, P, 34, 34, 2.6);
    s.push(); s.t(0, 30, 20); vineFx(s, P, [0, -4, 13], 15); s.pop();
  },
};

export default [sproutle, fernhorn, verdantusk];
