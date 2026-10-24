// FIRE line: Cindle -> Pyrovix -> Infernyx
import { leg } from '../rig.js';
import { mouth, eyes } from '../face.js';
import { onEll, flame, orb, sparks, smoothPoly, wingPoly, featherWing, TAU, hash } from '../parts.js';
const norm3 = (v) => { const l = Math.hypot(...v); return v.map(x => x / l); };

export const FLAME = { ramp: ['#c8321c', '#f0641e', '#ff9e2c', '#ffd64c', '#fff6c8'], emissive: true, outline: '#8c1e12', lineCol: '#b02a16', litOutline: '#a42614', noLine: true, noCastLine: true, th: [0.12, 0.32, 0.55, 0.78] };

function fireAttackFx(s, P, mp, size) {
  if (P.anim !== 'attack') return;
  if (P.fxi === 2) orb(s, [mp[0], mp[1], mp[2] + size * 0.6], size * 0.45, 'flame', { z: 40 });
  if (P.fxi === 3) orb(s, [mp[0], mp[1] + size * 0.1, mp[2] + size * 1.6], size * 0.62, 'flame', { z: 40, trail: [size * 0.9, -size * 0.25] });
  if (P.fxi === 4) sparks(s, [mp[0], mp[1], mp[2] + size * 2.2], { n: 5, r: size * 0.7, mat: 'flame', size: size * 0.18, t: 0.3 });
}
function earCard(s, P, sd, pos, o) {
  const tw = P.anim === 'idle' && sd === 1 ? Math.max(0, Math.sin(P.t * TAU * 2)) * 0.15 : 0;
  s.push(); s.t(pos[0] * sd, pos[1], pos[2]); s.rz(-sd * (o.splay + tw)); s.ry(sd * (o.turn ?? 0.32)); s.rx(o.tilt || 0);
  const W = o.w, H = o.h;
  const poly = smoothPoly([[-W / 2, 0], [0, -0.6], [W / 2, 0], [W * 0.18, H * 0.55], [W * 0.04, H], [-W * 0.18, H * 0.55]], 3);
  const tip = H * (o.tip ?? 0.72);
  s.card([0, 0, 0], [1, 0, 0], [0, 1, 0], poly, (u, v) => v > tip ? o.tipMat : (Math.abs(u) < W * 0.32 - v * W * 0.025 && v > 0.8 ? o.inMat : o.mat), { backMat: (u, v) => v > tip ? o.tipMat : o.mat, bulge: 0.6 });
  s.pop();
}

// ------------------------------------------------------------------------------------
export const cindle = {
  id: 'cindle', quirk: 'look', name: 'Cindle', line: 'fire', stage: 0, types: ['fire'],
  cell: [64, 64], height: 34, width: 18, shadow: 9, scale: 1.1,
  mats: {
    fur: { c: '#ee6a2e', hi: true },
    cream: { c: '#ffe7c2', dark: 0.9 },
    dark: { c: '#54344a' },
    earIn: { c: '#ffb257' },
    nose: { c: '#3a2030' },
    iris: { c: '#5a2a1a' },
    flame: FLAME,
  },
  draw(s, P) {
    const br = P.breathe, t = P.t;
    const walk = P.gait >= 0;
    s.group('body');
    s.ell([0, 10.5 + br * 0.2, -1.5], [6.2 + br * 0.15, 5.8 + br * 0.2, 8], 'fur');
    s.ell([0, 10.5, 4.2], [4.6, 4.8, 3.6], 'cream', { grp: s.group('chest') });
    const legO = { l1: 3.6, l2: 4.4, r1: 2.3, r2: 1.8, mat: 'fur', paw: 'dark', pawR: 2.2, stride: 2.6, lift: 2.2 };
    s.group('legF'); leg(s, P, [-3.4, 7.8, 4], { ...legO, phase: 0, front: true, atkReach: 1.5 });
    leg(s, P, [3.4, 7.8, 4], { ...legO, phase: 0.5, front: true, atkReach: 1.5 });
    s.group('legB'); leg(s, P, [-3.6, 8, -6.5], { ...legO, phase: 0.5, bend: 1 });
    leg(s, P, [3.6, 8, -6.5], { ...legO, phase: 0, bend: 1 });
    s.group('tail');
    const sw = Math.sin((t + 0.1) * TAU) * (walk ? 2.2 : 1.4) + (P.atk ? -P.atk * 1.5 : 0);
    const tp = [[0, 11, -8.5, 2.2], [sw * 0.4, 13.5, -12.5, 3.2], [sw, 18, -14, 4], [sw * 1.4, 22.5, -12.8, 3.8], [sw * 1.6, 25.5, -10.6, 2.6]];
    s.tube(tp, 'fur', { matAlong: f => f > 0.78 ? 'cream' : 'fur' });
    const tip = tp[tp.length - 1];
    const fs = 1 + P.cast * 0.5;
    flame(s, [tip[0], tip[1] + 1, tip[2]], { w: 7 * fs, h: 11 * fs, t: t * 1.5, seed: 1, lean: -0.1 - sw * 0.04, z: 1 });
    // head
    s.group('head');
    s.push();
    s.t(0, 20 + br * 0.35 + (P.hurt ? 1 : 0), 5.2);
    s.ry(P.look);
    s.rx(-P.mouth * 0.25 + P.hurt * 0.2);
    s.rz(P.anim === 'idle' ? Math.sin(t * TAU) * 0.04 : 0);
    const HC = [0, 0, 0], HR = [8.3, 7.4, 7.2];
    s.ell(HC, HR, 'fur');
    s.ell([-6.3, -2.6, 1.6], [2.6, 2.3, 2.6], 'cream');
    s.ell([6.3, -2.6, 1.6], [2.6, 2.3, 2.6], 'cream');
    s.group('muzzle');
    s.ell([0, -2.6, 5.6], [3.6, 2.7, 3.4], 'cream');
    s.ell([0, -1.5, 8.6], [1.25, 1, 1], 'nose', { grp: s.groups.muzzle });
    s.group('ear');
    for (const sd of [-1, 1]) earCard(s, P, sd, [4.6, 4.4, -0.5], { w: 6.8, h: 11.5, splay: 0.32, mat: 'fur', inMat: 'earIn', tipMat: 'dark' });
    s.group('head');
    flame(s, [0, 6.2, 2.5], { w: 3.6 * fs, h: 5.5 * fs, t: t * 1.7, seed: 4, tongues: 1, sideH: 0.8, z: -1 });
    eyes(s, P, HC, HR, { dx: 3.6, dy: 0.4, w: 4, h: 5, style: 'cute' });
    if (P.front) {
      if (P.mouth > 0.4) mouth(s, [0, -4.4, 8.2], { style: 'open', w: 4, h: 3, host: 'muzzle', fangs: P.anim === 'attack' });
      else mouth(s, [0, -4.1, 8.4], { style: 'smile', w: 3, host: 'muzzle' });
    }
    s.pop();
    if (P.cast) sparks(s, [0, 14, 0], { n: 6, r: 15, t: P.t, mat: 'flame', size: 1.4, flat: 0.4 });
    s.push(); s.t(0, 20, 5.2); fireAttackFx(s, P, [0, -3, 9], 7); s.pop();
  },
};

// ------------------------------------------------------------------------------------
export const pyrovix = {
  id: 'pyrovix', quirk: 'look', name: 'Pyrovix', line: 'fire', stage: 1, types: ['fire'],
  cell: [96, 96], height: 52, width: 22, shadow: 13,
  mats: {
    fur: { c: '#de4a2c' },
    back: { c: '#b8322e' },
    cream: { c: '#ffe2b8', dark: 0.9 },
    dark: { c: '#4a2c44' },
    gold: { c: '#ffbe3c', hi: true },
    nose: { c: '#2e1a2a' },
    iris: { c: '#ffb020' },
    flame: FLAME,
  },
  draw(s, P) {
    const br = P.breathe, t = P.t, walk = P.gait >= 0;
    const fs = 1 + P.cast * 0.4;
    s.group('body');
    s.ell([0, 18 + br * 0.25, -2], [6.4, 7 + br * 0.2, 12], (a, b) => b > 0.55 ? 'back' : 'fur');
    s.group('chest');
    s.ell([0, 19.5, 7.5], [5.8, 7.2, 5.4], (a, b, c) => c > 0.2 || b < -0.2 ? 'cream' : 'fur');
    const legO = { mat: 'fur', paw: 'dark', pawR: 2.3, stride: 4.5, lift: 3.2, r2: 1.8 };
    s.group('legF');
    leg(s, P, [-3.3, 15, 7], { ...legO, l1: 6.4, l2: 8, r1: 2.9, phase: 0, front: true, atkReach: 3, atkLift: 2 });
    leg(s, P, [3.3, 15, 7], { ...legO, l1: 6.4, l2: 8, r1: 2.9, phase: 0.5, front: true, atkReach: 3, atkLift: 2 });
    s.group('legB');
    for (const sd of [-1, 1]) {
      s.ell([sd * 4, 18.5, -9], [3.4, 6, 5.8], 'fur');
      leg(s, P, [sd * 4, 16, -9.5], { ...legO, l1: 6, l2: 6, hock: 5.6, r1: 3.6, r2: 1.7, phase: sd < 0 ? 0.5 : 0 });
    }
    // three tails fanning out like a blazing brush
    s.group('tail');
    for (let k = -1; k <= 1; k++) {
      const sw = Math.sin((t + k * 0.15) * TAU) * (walk ? 2 : 1.3) - (P.atk || 0) * 1.5;
      const sx = k * 9 + sw;
      const up = k === 0 ? 1 : 0.8;
      const tp = [[k * 1.5, 20, -12.5, 2.4], [sx * 0.35, 22.5 * up + 2, -18, 3.4], [sx * 0.8, 27 * up + 4, -21, 3.7], [sx, 32 * up + 5, -20, 3.2], [sx * 1.08, 35 * up + 6, -17, 2]];
      s.tube(tp, 'fur', { matAlong: f => f > 0.62 ? 'cream' : 'fur' });
      const e = tp[tp.length - 1];
      flame(s, [e[0], e[1] + 0.5, e[2]], { w: 6.5 * fs, h: 11 * fs, t: t * 1.4 + k * 0.3, seed: 3 + k, lean: k * 0.3, z: 1 });
    }
    // neck + head
    s.group('neck');
    s.tube([[0, 21, 7, 4.6], [0, 27, 9.6, 3.9], [0, 31, 11, 3.4]], 'fur');
    // flame collar (mane)
    const mane = [[-5, 25, 6.5], [5, 25, 6.5], [0, 29.5, 6.5], [-4, 28.5, 4.5], [4, 28.5, 4.5]];
    mane.forEach((m, k) => flame(s, m, { w: 5.5 * fs, h: 9 * fs, t: t * 1.6 + k * 0.21, seed: 10 + k, lean: (m[0] > 0 ? 0.2 : -0.2) * (P.front ? 1 : -1), z: -2 }));
    s.group('head');
    s.push();
    s.t(0, 34 + br * 0.4 + (P.hurt ? 1 : 0), 12);
    s.ry(P.look);
    s.rx(-P.mouth * 0.3 + P.hurt * 0.25 + (walk ? 0.05 : 0));
    const HC = [0, 0, 0], HR = [6.4, 6, 6.4];
    s.ell(HC, HR, (a, b) => 'fur');
    // cheek tufts
    for (const sd of [-1, 1]) s.card([sd * 4.5, -2, 0.5], [sd, 0, 0], [0, 1, 0], [[0, 1.6], [4.5, -0.5], [0, -2.6]], 'cream', { bulge: 0.4 });
    s.group('muzzle');
    s.ell([0, -2, 6], [3, 2.5, 4.4], (a, b) => b < -0.15 ? 'cream' : 'fur');
    s.ell([0, -1.2, 10.2], [1.2, 1, 1], 'nose');
    s.group('ear');
    for (const sd of [-1, 1]) earCard(s, P, sd, [3.7, 3.6, -1.5], { w: 6.2, h: 12, splay: 0.24, turn: 0.4, mat: 'fur', inMat: 'gold', tipMat: 'dark', tip: 0.78 });
    s.group('head');
    eyes(s, P, HC, HR, { dx: 3.0, dy: 1.0, w: 5, h: 5, style: 'normal', lid: 0.25, pupil: 0.3 });
    if (P.front) {
      if (P.mouth > 0.4) mouth(s, [0, -4, 8.8], { style: 'open', w: 4, h: 3, host: 'muzzle', fangs: true });
      else mouth(s, [0, -3.6, 9], { style: 'fang', w: 3, host: 'muzzle' });
    }
    s.pop();
    if (P.cast) sparks(s, [0, 22, 0], { n: 7, r: 21, t: P.t, mat: 'flame', size: 1.7, flat: 0.4 });
    s.push(); s.t(0, 34, 12); fireAttackFx(s, P, [0, -2, 10], 9); s.pop();
  },
};

// ------------------------------------------------------------------------------------
export const infernyx = {
  id: 'infernyx', quirk: 'proud', name: 'Infernyx', line: 'fire', stage: 2, types: ['fire', 'wind'],
  cell: [128, 128], height: 80, width: 34, shadow: 20, dither: 0,
  mats: {
    fur: { c: '#c8362c' },
    back: { c: '#9c2632' },
    cream: { c: '#ffd890', dark: 0.9 },
    dark: { c: '#3a2638' },
    gold: { c: '#ffc23a', hi: true, gloss: true },
    wing: { c: '#ffe7a8', dark: 0.8 },
    wind: { c: '#8ff0e0', dark: 0.8 },
    nose: { c: '#2e1a2a' },
    iris: { c: '#ffcc33' },
    flame: FLAME,
  },
  draw(s, P) {
    const br = P.breathe, t = P.t, walk = P.gait >= 0;
    const fs = 1 + P.cast * 0.35;
    s.group('body');
    s.ell([0, 29 + br * 0.3, -3], [10.5, 11.5 + br * 0.25, 18], (a, b) => b > 0.5 ? 'back' : 'fur');
    s.group('chest');
    s.ell([0, 31, 10.5], [9.6, 12, 8.6], (a, b, c) => c > 0.3 || b < -0.25 ? 'cream' : 'fur');
    const legO = { mat: 'fur', paw: 'dark', pawR: 3.6, stride: 6, lift: 4.5, r2: 3 };
    s.group('legF');
    for (const sd of [-1, 1]) {
      s.ell([sd * 7, 31, 9.5], [4.8, 8, 6.4], 'fur');
      const r = leg(s, P, [sd * 6, 24, 10.5], { ...legO, l1: 10, l2: 11.5, r1: 5, r2: 2.6, phase: sd < 0 ? 0 : 0.5, front: true, atkReach: 5, atkLift: 4 });
      s.ell([r.foot[0], r.foot[1] + 5.2, r.foot[2] + 0.4], [3.4, 1.5, 3.4], 'gold', { grp: s.g });
    }
    s.group('legB');
    for (const sd of [-1, 1]) {
      s.ell([sd * 6.6, 30, -14], [5.4, 9.6, 9], 'fur');
      const r = leg(s, P, [sd * 6.6, 25, -15], { ...legO, l1: 9, l2: 9, hock: 8, r1: 5.6, r2: 2.8, phase: sd < 0 ? 0.5 : 0 });
      s.ell([r.foot[0], r.foot[1] + 5.2, r.foot[2]], [3.5, 1.5, 3.5], 'gold', { grp: s.g });
    }
    // tail
    s.group('tail');
    const sw = Math.sin(t * TAU) * (walk ? 3 : 2) - (P.atk || 0) * 2;
    const tp = [[0, 33, -19, 3.6], [sw * 0.4, 35, -26, 3.2], [sw, 41, -31, 3], [sw * 1.3, 48, -31, 2.8], [sw * 1.4, 53, -28, 2.8]];
    s.tube(tp, 'fur');
    const te = tp[tp.length - 1];
    s.ell([te[0], te[1], te[2]], [3.8, 3.8, 3.8], 'gold');
    flame(s, [te[0], te[1] + 2, te[2]], { w: 10 * fs, h: 17 * fs, t: t * 1.3, seed: 7, z: 1 });
    // wings: flame-feathered, wind-tipped, raised and swept back from the shoulders
    const flap = Math.sin(t * TAU) * (walk ? 0.14 : 0.1) + P.cast * 0.3 + Math.max(0, -P.atk) * 0.25 - Math.max(0, P.atk) * 0.12;
    for (const sd of [-1, 1]) {
      s.push(); s.t(sd * 6.5, 40, 3); s.rz(-sd * (0.1 + flap));
      featherWing(s, [0, 0, 0], norm3([sd * 0.3, 0.82, -0.48]), norm3([0, -0.5, -0.86]), {
        n: 8, arm: 17, len: 26, fw: 7, a0: -0.45, a1: 1.5, gname: 'w' + sd,
        mat: (k) => k < 4 ? 'wing' : 'cream', armMat: 'back',
        tipMat: (k) => k < 4 ? 'flame' : 'wind', tipAt: 0.6, heatFn: d => 0.35 + d * 1.1,
      });
      s.pop();
    }
    // neck & head
    s.group('neck');
    s.tube([[0, 36, 11, 7.6], [0, 43, 15, 6.4], [0, 48, 17.5, 5.6]], 'fur');
    // regal lion-like mane of flame radiating behind the head
    s.push(); s.t(0, 52 + br * 0.5, 15); s.ry(P.look);
    for (let k = 0; k < 9; k++) {
      const a = (-1 + k / 8 * 2) * 1.95;
      const r = 9.5 + (k % 2) * 1.5;
      const m = [Math.sin(a) * r, Math.cos(a) * r * 0.85 - 2, -2 - (k % 2) * 2];
      const sp = s.proj([0, 0, 0]), mp = s.proj(m);
      const lean = Math.max(-1.1, Math.min(1.1, (mp[0] - sp[0]) / (8 * s.S)));
      flame(s, m, { w: (9 - (k % 2) * 2) * fs, h: (17 - Math.abs(a) * 2.5) * fs, t: t * 1.4 + k * 0.17, seed: 20 + k, lean: lean * 0.7, z: -6, tongues: 1 });
    }
    s.pop();
    s.group('head');
    s.push();
    s.t(0, 52 + br * 0.5 + (P.hurt ? 1.5 : 0), 19);
    s.ry(P.look);
    s.rx(-P.mouth * 0.3 + P.hurt * 0.25 + (walk ? 0.06 : 0));
    const HC = [0, 0, 0], HR = [9, 8.2, 8.6];
    s.ell(HC, HR, 'fur');
    for (const sd of [-1, 1]) s.card([sd * 5.8, -2.6, 0.5], [sd, 0, -0.3], [0, 1, 0], [[0, 2.2], [6.5, -0.6], [1.5, -1.5], [5, -3.8], [0, -3.6]], 'cream', { bulge: 0.4 });
    s.group('muzzle');
    s.ell([0, -2.4, 6.6], [3.8, 3.1, 5.4], (a, b) => b < -0.2 ? 'cream' : 'fur');
    s.ell([0, -1.2, 11.7], [1.5, 1.2, 1.1], 'nose');
    s.group('horn');
    for (const sd of [-1, 1]) s.tube([[sd * 3, 5.5, 3.5, 2.3], [sd * 4.6, 9.5, 0.5, 1.8], [sd * 5.6, 12.5, -4, 1.2], [sd * 5.6, 13.5, -8.5, 0.5]], 'gold');
    s.group('ear');
    for (const sd of [-1, 1]) earCard(s, P, sd, [5.4, 2.5, -2], { w: 5, h: 8, splay: 0.7, turn: 0.4, mat: 'fur', inMat: 'gold', tipMat: 'dark' });
    s.group('head');
    flame(s, [0, 6.5, 0], { w: 6 * fs, h: 10 * fs, t: t * 1.6, seed: 30, tongues: 1, z: -1 });
    eyes(s, P, HC, HR, { dx: 3.9, dy: 1.4, w: 6, h: 6, style: 'normal', lid: 0.3, pupil: 0.28 });
    if (P.front) {
      if (P.mouth > 0.4) mouth(s, [0, -4.8, 10.5], { style: 'open', w: 5, h: 4, host: 'muzzle', fangs: true });
      else mouth(s, [0, -4.2, 10.8], { style: 'fang', w: 4, host: 'muzzle' });
    }
    s.pop();
    if (P.cast) sparks(s, [0, 32, 0], { n: 8, r: 30, t: P.t, mat: 'flame', size: 2.2, flat: 0.4 });
    s.push(); s.t(0, 52, 19); fireAttackFx(s, P, [0, -3, 12], 13); s.pop();
  },
};

export default [cindle, pyrovix, infernyx];
