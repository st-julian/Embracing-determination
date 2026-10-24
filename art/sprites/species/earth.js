// EARTH line: Pebbit -> Bouldash -> Terracore
import { leg } from '../rig.js';
import { mouth, eyes } from '../face.js';
import { onEll, orb, sparks, smoothPoly, TAU, hash } from '../parts.js';

export const ROCKFX = { ramp: ['#7a5a3a', '#9c7650', '#c09868', '#e0c090', '#fff0cc'], emissive: true, outline: '#3e2a1e', noLine: true, noCastLine: true, th: [0.1, 0.3, 0.55, 0.8] };
export const CRYSTAL = { ramp: ['#d0581a', '#ff8a2a', '#ffb84a', '#ffe08a', '#fffbe0'], emissive: true, outline: '#6a2a14', noLine: true, th: [0.15, 0.35, 0.6, 0.82] };

function rockFx(s, P, p, size, mat = 'stone') {
  if (P.noFx) return;
  if (P.anim === 'attack' && P.fxi >= 3 && P.fxi <= 5) {
    const k = P.fxi - 3;
    // ground shockwave ring + flying rock chunks
    const [x, y, z] = s.proj([p[0], 0, p[2]]);
    const r = size * (0.5 + k * 0.35) * s.S;
    const pts = [];
    for (let j = 0; j <= 16; j++) { const a = j / 16 * Math.PI * 2; pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r * 0.35, (1.2 - k * 0.35) * s.S]); }
    s.stroke2(pts, z - 40, 'rockFx', { grp: s.group('fxring') });
    for (let j = 0; j < 5; j++) {
      const a = (j / 5) * Math.PI * 2 + 0.4;
      const d = size * (0.3 + k * 0.45);
      const h = size * (0.25 + 0.5 * Math.sin(Math.min(1, (k + 1) / 3) * Math.PI)) * (0.6 + 0.4 * hash(j));
      s.group('chunk' + j);
      s.ell([p[0] + Math.cos(a) * d, h, p[2] + Math.sin(a) * d * 0.7], size * (0.09 + 0.05 * hash(j + 3)), mat, { rot: [j, j * 2, 0] });
    }
  }
  if (P.cast) sparks(s, [0, p[1] + size * 0.5, 0], { n: 6, r: size * 1.4, t: P.t, mat: 'rockFx', size: size * 0.12, flat: 0.4, shape: 'diamond', rise: 2 });
}
// banded armadillo shell material
const bands = (n) => (a, b, c) => {
  const f = (c * n + 50) % 1;
  return f < 0.18 ? ['shellD', 0] : ['shell', f > 0.75 ? 0.15 : 0];
};

// ------------------------------------------------------------------------------------
export const pebbit = {
  id: 'pebbit', quirk: 'hop', name: 'Pebbit', line: 'earth', stage: 0, types: ['earth'],
  cell: [64, 64], height: 24, width: 18, shadow: 10, scale: 1.25,
  mats: {
    skin: { c: '#e8b07c' }, shell: { c: '#8f9ab8', hi: true }, shellD: { c: '#5a6184' }, belly: { c: '#fff0d6', dark: 0.85 },
    gem: CRYSTAL, claw: { c: '#5a4640' }, nose: { c: '#4a2e2a' }, earIn: { c: '#ff9c8a' }, iris: { c: '#2a1e1a' }, rockFx: ROCKFX,
  },
  draw(s, P) {
    const br = P.breathe, t = P.t, walk = P.gait >= 0;
    s.group('body');
    s.ell([0, 7.5, -1], [6, 4.8, 7.6], (a, b) => b < -0.3 ? 'belly' : 'skin');
    // dome shell with bands
    s.group('shell');
    s.ell([0, 10 + br * 0.25, -1.5], [7.4, 6.4 + br * 0.15, 8.8], bands(2.2), { rot: [0.08, 0, 0] });
    const legO = { l1: 2.2, l2: 2.6, r1: 1.9, r2: 1.6, mat: 'skin', paw: 'claw', pawR: 1.6, stride: 2.2, lift: 1.8 };
    s.group('legF'); leg(s, P, [-4, 4.6, 4], { ...legO, phase: 0, front: true, atkReach: 1.2 }); leg(s, P, [4, 4.6, 4], { ...legO, phase: 0.5, front: true, atkReach: 1.2 });
    s.group('legB'); leg(s, P, [-4.4, 4.6, -5.5], { ...legO, phase: 0.5, bend: 1 }); leg(s, P, [4.4, 4.6, -5.5], { ...legO, phase: 0, bend: 1 });
    // pebble-tipped tail
    s.group('tail');
    const sw = Math.sin(t * TAU) * 1.2;
    s.tube([[0, 6, -9, 1.6], [sw, 5, -12, 1.1]], 'skin');
    s.ell([sw * 1.2, 5, -13], [2.2, 2, 2.2], bands(3));
    // head
    s.group('head');
    s.push();
    s.t(0, 11 + br * 0.3 + (P.hurt ? 0.8 : 0), 8);
    s.ry(P.look);
    s.rx(-P.mouth * 0.15 + P.hurt * 0.2 + (P.atk ? -P.atk * 0.2 : 0));
    const HC = [0, 0, 0], HR = [5.4, 5, 5];
    s.ell(HC, HR, 'skin');
    // head plate (shell cap) + gem
    s.group('cap');
    s.ell([0, 2.4, -0.6], [4.6, 2.8, 4.4], 'shell', { rot: [-0.25, 0, 0] });
    s.ell([0, 3.4, 2.6], [1.5, 1.7, 1.2], 'gem', { rot: [0.3, 0, 0] });
    s.group('muzzle');
    s.tube([[0, -1, 3.5, 2.4], [0, -1.8, 6.2, 1.8], [0, -2, 7.6, 1.4]], 'skin');
    s.ell([0, -1.7, 8.8], [1, 0.8, 0.7], 'nose');
    s.group('ear');
    for (const sd of [-1, 1]) {
      s.push(); s.t(sd * 4.2, 2, -1.5); s.rz(-sd * 0.7); s.ry(sd * 0.35);
      s.card([0, 0, 0], [1, 0, 0], [0, 1, 0], smoothPoly([[-2.2, 0], [2.2, 0], [2.4, 3], [0, 4.8], [-2.4, 3]], 3), (u, v) => u * u + (v - 2.2) ** 2 < 2.2 ? 'earIn' : 'skin', { backMat: 'skin', bulge: 0.5 });
      s.pop();
    }
    s.group('head');
    eyes(s, P, HC, HR, { dx: 2.4, dy: 0.6, w: 3, h: 4, style: 'cute' });
    if (P.front) {
      const mp = [0, -3.2, 7];
      if (P.mouth > 0.4) mouth(s, mp, { style: 'open', w: 3, h: 2, host: 'muzzle' });
      else mouth(s, mp, { style: 'smile', w: 2, host: 'muzzle' });
    }
    s.pop();
    rockFx(s, P, [0, 2, 15], 10, 'shell');
  },
};

// ------------------------------------------------------------------------------------
export const bouldash = {
  id: 'bouldash', quirk: 'look', name: 'Bouldash', line: 'earth', stage: 1, types: ['earth'],
  cell: [96, 96], height: 40, width: 28, shadow: 16, scale: 1.15,
  mats: {
    skin: { c: '#cf9a62' }, belly: { c: '#f0d6a8', dark: 0.85 }, stone: { c: '#7c8299' }, stoneD: { c: '#4e5168' },
    horn: { c: '#ece2c8', dark: 0.8 }, gem: CRYSTAL, hoof: { c: '#4a3a36' }, nose: { c: '#3a2620' }, iris: { c: '#ff9a2a' }, rockFx: ROCKFX,
  },
  draw(s, P) {
    const br = P.breathe, t = P.t, walk = P.gait >= 0;
    s.group('body');
    s.ell([0, 17 + br * 0.25, -2], [9.4, 9 + br * 0.2, 14], (a, b) => b < -0.4 ? 'belly' : 'skin');
    // boulder armour plates on back
    const plates = [[0, 25, 5, 7, 4, 6], [0, 26, -3.5, 8, 4.6, 6], [0, 24.5, -11, 7, 4, 5]];
    plates.forEach(([x, y, z, a, b, c], k) => { s.group('plate' + k); s.ell([x, y, z], [a, b, c], (u, v, w) => v < -0.3 ? 'stoneD' : (hash(Math.round(u * 3) * 5 + Math.round(w * 3)) > 0.75 ? ['stone', -0.2] : 'stone'), { rot: [0.1 * k, 0.15 * (k - 1), 0.05] }); });
    s.group('gem');
    s.tube([[-5.5, 26, -1, 2], [-7.5, 31, -2, 1.2], [-8.3, 34, -2.5, 0.4]], 'gem');
    s.tube([[5, 27, 2, 1.8], [7, 31.5, 1, 1.1], [7.6, 34, 0.5, 0.4]], 'gem');
    s.tube([[1, 29, -9, 1.6], [1.5, 33, -10, 0.9], [1.8, 35, -10.5, 0.3]], 'gem');
    const legO = { mat: 'skin', paw: 'hoof', pawR: 3.2, stride: 4.5, lift: 3, r2: 3, kneeK: 0.8 };
    s.group('legF');
    for (const sd of [-1, 1]) leg(s, P, [sd * 5.6, 12, 7], { ...legO, l1: 6, l2: 6.4, r1: 4, phase: sd < 0 ? 0 : 0.5, front: true, atkReach: 2, atkLift: 1 });
    s.group('legB');
    for (const sd of [-1, 1]) leg(s, P, [sd * 6, 13, -9.5], { ...legO, l1: 6.4, l2: 6.6, r1: 4.6, phase: sd < 0 ? 0.5 : 0, bend: 1 });
    s.group('tail');
    s.tube([[0, 18, -15.5, 1.4], [Math.sin(t * TAU) * 1.2, 14, -18, 1]], 'skin');
    // head with huge stone horn
    s.group('head');
    s.push();
    s.t(0, 18 + br * 0.35 + (P.hurt ? 1 : 0), 14.5);
    s.ry(P.look);
    s.rx(-P.mouth * 0.1 + P.hurt * 0.2 + (P.atk ? -P.atk * 0.3 : 0));
    const HC = [0, 0, 0], HR = [7, 6.4, 7];
    s.ell(HC, HR, (a, b) => b > 0.55 ? 'stoneD' : 'skin');
    s.group('snout');
    s.ell([0, -2, 5.4], [4.6, 4, 4.6], (a, b) => b < -0.3 ? 'belly' : 'skin');
    s.ell([-1.6, -2.2, 9.6], [0.6, 0.7, 0.5], 'nose'); s.ell([1.6, -2.2, 9.6], [0.6, 0.7, 0.5], 'nose');
    s.group('horn');
    s.tube([[0, 0.5, 8.5, 3.6], [0, 4.5, 11.5, 2.8], [0, 9.5, 12.5, 1.8], [0, 14, 11, 0.6]], (a, b, c) => b > 0.15 ? 'horn' : 'stoneD');
    s.group('horn2');
    s.tube([[0, 5, 4.5, 1.9], [0, 9, 4.5, 1], [0, 10.5, 3.5, 0.35]], 'gem');
    s.group('ear');
    for (const sd of [-1, 1]) { s.push(); s.t(sd * 5, 3, -2.5); s.rz(-sd * 0.9); s.card([0, 0, 0], [1, 0, 0], [0, 1, 0], smoothPoly([[-1.6, 0], [1.6, 0], [0.4, 4.5]], 3), 'skin', { bulge: 0.5 }); s.pop(); }
    s.group('head');
    eyes(s, P, HC, HR, { dx: 3.4, dy: 0.9, w: 5, h: 5, style: 'normal', lid: 0.3 });
    if (P.front) {
      const mp = [0, -4.8, 8.3];
      if (P.mouth > 0.4) mouth(s, mp, { style: 'open', w: 4, h: 2, host: 'snout' });
      else mouth(s, mp, { style: 'line', w: 3, host: 'snout' });
    }
    s.pop();
    rockFx(s, P, [0, 2, 26], 14);
  },
};

// ------------------------------------------------------------------------------------
export const terracore = {
  id: 'terracore', quirk: 'proud', name: 'Terracore', line: 'earth', stage: 2, types: ['earth'],
  cell: [128, 128], height: 78, width: 44, shadow: 22, faintRoll: 70, lunge: 6, yaw: { front: -24, back: 156 }, look: 0.2,
  mats: {
    stone: { c: '#8a7a6c' }, stoneD: { c: '#5c4e48' }, stoneL: { c: '#b8a68e' }, moss: { c: '#6aa04a' },
    core: CRYSTAL, crys: { ...CRYSTAL, th: [0.2, 0.45, 0.7, 0.9] }, iris: { c: '#ffd060' },
    glowE: { ramp: ['#ff9a2a', '#ffc04a', '#ffe08a', '#fff4c8', '#ffffff'], emissive: true, noLine: true, outline: '#5a2a10' }, rockFx: ROCKFX,
  },
  draw(s, P) {
    const br = P.breathe, t = P.t, walk = P.gait >= 0;
    const rock = (k) => (a, b, c) => hash(Math.round(a * 3 + k) * 7 + Math.round(b * 3) * 13 + Math.round(c * 3)) > 0.72 ? ['stone', -0.28] : (b > 0.72 && c < 0.5 && hash(k * 3 + Math.round(a * 3)) > 0.45 ? 'moss' : 'stone');
    const step = walk ? Math.sin(P.gait * TAU) : 0;
    s.ry(walk ? step * 0.06 : 0);
    // legs (biped): stubby pillars
    s.group('legs');
    for (const sd of [-1, 1]) {
      const ph = sd < 0 ? 0 : 0.5;
      const g = walk ? (P.gait + ph) % 1 : 0;
      const fz = walk ? Math.cos(g * TAU) * 5 : 0, fy = walk ? Math.max(0, Math.sin(g * TAU)) * 4 : 0;
      s.ell([sd * 8, 18, 0], [6, 8, 6], rock(sd));
      s.tube([[sd * 8.5, 14, 0, 5.4], [sd * 9, 6 + fy, fz * 0.5, 4.8]], rock(sd + 3));
      s.ell([sd * 9.2, 2.4 + fy, fz + 1.5], [5.6, 3, 7], 'stoneD');
    }
    // torso: big boulder with crystal core
    s.group('torso');
    s.push(); s.t(0, 37 + br * 0.4, 0); s.rx(0.12 + (P.atk ? P.atk * 0.12 : 0));
    s.ell([0, 0, 0], [15, 14 + br * 0.3, 11], rock(1));
    s.group('belt');
    s.ell([0, -9, 1], [12, 5, 9], 'stoneD');
    s.group('core');
    const pulse = 1 + (P.cast ? P.cast * 0.25 : 0) + Math.sin(t * TAU) * 0.04;
    s.ell([0, 1, 8.6], [6 * pulse, 7.2 * pulse, 4], 'core', { rot: [0, 0, 0.1] });
    s.group('coreRim');
    s.ell([0, 1, 7.4], [7.6, 8.8, 3.6], 'stoneD');
    s.group('crack');
    // glowing veins radiating from the core
    for (const [dx, dy] of [[-7, 5], [7, 4], [-6, -5], [6, -6]]) {
      const a = s.proj([dx * 0.4, 1 + dy * 0.4, 10]), b = s.proj([dx, 1 + dy, 7]);
      s.stroke2([[a[0], a[1], 0.7 * s.S], [(a[0] + b[0]) / 2 + s.S, (a[1] + b[1]) / 2, 0.6 * s.S], [b[0], b[1], 0.5 * s.S]], a[2] + 0.5, 'glowE');
    }
    // shoulder crystal spires
    s.group('spire');
    for (const sd of [-1, 1]) {
      s.tube([[sd * 10, 9, -3, 3], [sd * 12.5, 18, -5, 1.8], [sd * 13.5, 24, -6, 0.4]], 'crys');
      s.tube([[sd * 6, 11, -5, 2.4], [sd * 6.5, 19, -7, 0.4]], 'crys');
      s.tube([[sd * 13, 6, -5, 2], [sd * 16, 12, -7, 0.4]], 'crys');
    }
    s.pop();
    // arms: shoulder boulder, thick forearm, huge fist
    s.group('arm');
    for (const sd of [-1, 1]) {
      const swing = walk ? -step * sd * 0.35 : 0;
      const punch = P.atk ? (sd < 0 ? P.atk : -P.atk * 0.3) : 0;
      const raise = P.cast ? P.cast : 0;
      s.ell([sd * 17, 46 + br * 0.4, 0], [7.5, 7, 7.5], rock(sd + 5), { grp: s.group('sh' + sd) });
      const el = [sd * 21, 36 + raise * 8, 2 + swing * 6 + punch * 6];
      const fi = [sd * 21.5, 23 + raise * 20 + Math.max(0, punch) * 8, 5 + swing * 10 + punch * 14];
      s.group('arm' + sd);
      s.tube([[sd * 18, 43, 0, 5], [...el, 4.4]], rock(sd + 7));
      s.tube([[...el, 4.6], [...fi, 5.4]], rock(sd + 9));
      s.ell(fi, [6.8, 6.4, 6.8], rock(sd + 11), { grp: s.group('fist' + sd) });
    }
    // head: small, sunk between shoulders, glowing eye slit
    s.group('head');
    s.push();
    s.t(0, 54 + br * 0.5 + (P.hurt ? 1.2 : 0), 3);
    s.ry(P.look);
    s.rx(P.hurt * 0.25);
    const HC = [0, 0, 0], HR = [7.4, 6.4, 6.8];
    s.ell(HC, HR, rock(20));
    s.ell([0, 4, -0.2], [7.8, 2.8, 6.8], 'stoneD', { grp: s.group('brow'), rot: [-0.25, 0, 0] });
    s.ell([0, -4.2, 2.2], [5.6, 2.6, 5], rock(21), { grp: s.group('jaw') });
    s.group('headCrys');
    for (const sd of [-1, 1]) s.tube([[sd * 4, 5.5, -1, 1.6], [sd * 5.6, 10, -2.5, 0.9], [sd * 6, 12.5, -3, 0.3]], 'crys');
    s.group('head');
    if (P.front) {
      const es = P.eyes === 'hurt' || P.eyes === 'faint' ? P.eyes : 'glow';
      eyes(s, { ...P, eyes: es }, HC, HR, { dx: 3, dy: 0.8, w: 5, h: 3, style: 'normal', glowMat: 'glowE', lid: 0.25 });
    }
    s.pop();
    rockFx(s, P, [-12, 4, 20], 20);
  },
};

export default [pebbit, bouldash, terracore];
