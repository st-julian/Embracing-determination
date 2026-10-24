// Lane minions: Grubling (melee beetle), Spitwing (ranged bat-moth), Shellram (siege ram).
// Team colour comes from the material variant ('blue' | 'red'); geometry is shared so team
// variants are produced by palette swap only.
import { leg } from './rig.js';
import { eyes, mouth } from './face.js';
import { orb, sparks, smoothPoly, leafPoly, TAU } from './parts.js';

export const TEAM = {
  blue: { main: '#3b7cf0', dark: '#2a4fb8', accent: '#9fd4ff', glow: ['#2a6ae0', '#4a9aff', '#8ad0ff', '#d0f0ff', '#ffffff'] },
  red: { main: '#e8483a', dark: '#b02c34', accent: '#ffc08a', glow: ['#c8301c', '#f06a2a', '#ffa04a', '#ffe08a', '#fffbe0'] },
};
const teamMats = (v) => {
  const T = TEAM[v || 'blue'];
  return {
    team: { c: T.main, gloss: true }, teamD: { c: T.dark }, accent: { c: T.accent, dark: 0.8 },
    glob: { ramp: T.glow, emissive: true, noLine: true, noCastLine: true, outline: v === 'red' ? '#7a1a14' : '#1a2a7a' },
  };
};
const MINI_ANIMS = ['idle', 'walk', 'attack', 'hurt', 'faint'];

// ------------------------------------------------------------------------------------
export const grubling = {
  id: 'grubling', name: 'Grubling', kind: 'minion', variants: ['blue', 'red'], anims: MINI_ANIMS,
  cell: [48, 48], height: 18, width: 16, shadow: 9, ayOff: 5, scale: 1.1,
  mats: (v) => ({
    ...teamMats(v), shell: { c: '#3a3450' }, leg: { c: '#5a4a6a' }, horn: { c: '#e8d8b8', dark: 0.8 }, iris: { c: '#ffe070' },
  }),
  draw(s, P) {
    const br = P.breathe, t = P.t, walk = P.gait >= 0;
    s.group('body');
    s.ell([0, 6.8, -1], [5, 3.2, 6.4], 'shell');
    // shiny team carapace (elytra with seam)
    s.group('elytra');
    s.ell([0, 8.6 + br * 0.2, -1.8], [5.8, 4.6, 6.6], (a, b, c) => Math.abs(a) < 0.06 && b > 0 ? 'teamD' : (b > 0.2 && Math.abs(a) > 0.4 && Math.abs(a) < 0.55 ? 'accent' : 'team'), { rot: [0.12, 0, 0] });
    // six thin legs, tripod gait
    s.group('legs');
    for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) {
      const ph = ((k + (sd > 0 ? 1 : 0)) % 2) * 0.5;
      const g = walk ? (P.gait * 2 + ph) % 1 : 0;
      const z0 = 3 - k * 3.6;
      const fz = walk ? Math.cos(g * TAU) * 1.4 : 0, fy = walk ? Math.max(0, Math.sin(g * TAU)) * 1.2 : 0;
      const knee = [sd * 8, 8.2 + fy, z0 + fz * 0.5 - (k - 1) * 3];
      s.tube([[sd * 4, 6, z0, 0.8], [...knee, 0.65]], 'leg');
      s.tube([[...knee, 0.65], [sd * 9.5, 0.5 + fy, z0 + fz - (k - 1) * 5.5, 0.45]], 'leg');
    }
    // head with horn
    s.group('head');
    s.push(); s.t(0, 6.5, 5.6); s.rx(P.atk ? -P.atk * 0.35 : 0);
    const HC = [0, 0, 0], HR = [4, 3.4, 3.2];
    s.ell(HC, HR, 'shell');
    s.group('horn');
    s.tube([[0, 1.4, 2.4, 1.6], [0, 3.6, 5, 1.25], [0, 7, 5.8, 0.8], [0, 9, 4.4, 0.4]], 'horn');
    for (const sd of [-1, 1]) s.tube([[sd * 1.6, -1.6, 2, 0.6], [sd * 1.1, -2.8, 3.6, 0.35]], 'horn');
    s.group('head');
    eyes(s, P, HC, HR, { dx: 2, dy: 0.3, w: 3, h: 3, style: 'cute', iris: 'iris' });
    s.pop();
  },
};

// ------------------------------------------------------------------------------------
export const spitwing = {
  id: 'spitwing', name: 'Spitwing', kind: 'minion', variants: ['blue', 'red'], anims: MINI_ANIMS,
  cell: [56, 48], height: 16, width: 30, shadow: 6, hover: 11, hoverBob: 1.5, ayOff: 4, scale: 1.15, faintRoll: 25, yaw: { front: -22, back: 158 }, look: 0.15,
  mats: (v) => ({
    ...teamMats(v), fuzz: { c: '#d8c4a4', dark: 0.85 }, fuzzD: { c: '#8a6e5a' }, bone: { c: '#4a3a4a' },
    eyeSpot: { c: '#ffe070', hi: true }, iris: { c: '#2a1a2a' },
  }),
  draw(s, P) {
    const br = P.breathe, t = P.t;
    s.group('body');
    s.ell([0, 6 + br * 0.2, -1], [4, 4.2, 4.6], (a, b, c) => b < -0.2 ? 'fuzzD' : (b > 0.5 && c > 0 ? 'accent' : (c < -0.3 && Math.abs(a) < 0.42 ? 'teamD' : 'fuzz')));
    s.ell([0, 3.6, -5], [2.6, 2.8, 3.4], (a, b, c) => Math.sin(c * 9) > 0.5 ? 'teamD' : 'fuzzD', { grp: s.group('abd') });
    // bat-moth wings: bat forewing (finger bones, scalloped membrane) + rounded moth hindwing with an eye-spot
    s.group('wing');
    const fl = P.faint ? -0.3 : Math.sin(P.t * TAU * 2) * 0.55 + 0.35 + (P.atk < 0 ? 0.35 : 0);
    const tips = [[13.5, 3.5], [12.5, -2.5], [9, -6.5], [5, -7]];
    const fore = [[0, 1.5], [4, 4.2], [8, 5.6], ...[].concat(...tips.map(([x, y], k) => k < tips.length - 1 ? [[x, y], [(x + tips[k + 1][0]) / 2 - 1.6, (y + tips[k + 1][1]) / 2 + 1.4]] : [[x, y]])), [2.5, -3.5], [0, -1.5]];
    const bone = (u, v) => { for (const [x, y] of tips) { const L = Math.hypot(x - 8, y - 5.6), t = ((u - 8) * (x - 8) + (v - 5.6) * (y - 5.6)) / (L * L); if (t > 0 && t < 1 && Math.abs((u - 8) * (y - 5.6) - (v - 5.6) * (x - 8)) / L < 0.45) return true; } return Math.abs(v - (1.5 + u * 0.52)) < 0.5 && u < 8; };
    for (const sd of [-1, 1]) {
      s.push(); s.t(sd * 2.4, 7.5, -0.5); s.rz(-sd * fl); s.ry(sd * 0.35);
      s.group('fw' + sd);
      s.card([0, 0, 0], [sd, 0, 0], [0, 0.94, 0.3], fore, (u, v) => bone(u, v) ? 'bone' : (u > 9.5 || v < -4.5 ? 'teamD' : 'team'), { bulge: 0.35, zBias: 0.8 });
      s.group('hw' + sd);
      s.card([0, -1.5, -1], [sd, 0, 0], [0, 0.94, 0.3], smoothPoly([[0, 0], [4, 0.5], [7.5, -1.5], [8, -5], [5.5, -7.5], [2, -6], [0, -3]], 3),
        (u, v) => { const d = (u - 4.6) ** 2 + (v + 3.4) ** 2; return d < 0.8 ? 'iris' : d < 3 ? 'eyeSpot' : 'accent'; }, { bulge: 0.35 });
      s.pop();
    }
    // feathery antennae
    s.group('ant');
    for (const sd of [-1, 1]) {
      s.push(); s.t(sd * 1.2, 9, 2.4);
      s.card([0, 0, 0], [sd * 0.5, 0.85, 0.2], [sd * 0.8, -0.3, 0], leafPoly(5.5, 3, { n: 5 }), (u, v) => ['accent', Math.sin(u * 3) > 0.5 ? -0.3 : 0], { bulge: 0.3 });
      s.pop();
    }
    s.group('body');
    const HC = [0, 6, -1], HR = [3.6, 3.8, 4.4];
    eyes(s, P, HC, HR, { dx: 1.7, dy: 0.6, w: 3, h: 3, style: 'cute', host: 'body' });
    if (P.front) mouth(s, [0, 4.4, 3.4], { style: P.mouth > 0.4 ? 'open' : 'fang', w: 2, h: 2, host: 'body' });
    if (P.anim === 'attack') {
      if (P.fxi === 2) orb(s, [0, 5, 6], 1.4, 'glob', { z: 40 });
      if (P.fxi === 3) orb(s, [0, 4.5, 11], 2, 'glob', { z: 40, trail: [3, -1] });
      if (P.fxi === 4) sparks(s, [0, 4.5, 14], { n: 4, r: 2.5, mat: 'glob', size: 0.7 });
    }
  },
};

// ------------------------------------------------------------------------------------
export const shellram = {
  id: 'shellram', name: 'Shellram', kind: 'minion', variants: ['blue', 'red'], anims: MINI_ANIMS,
  cell: [64, 64], height: 28, width: 20, shadow: 11, lunge: 5,
  mats: (v) => ({
    ...teamMats(v), wool: { c: '#f2ead8', dark: 0.8 }, face: { c: '#4a3a40' }, horn: { c: '#d8c49a' }, hornD: { c: '#9a8462' },
    hoof: { c: '#2e2630' }, metal: { c: '#c8ccd8', gloss: true }, iris: { c: '#ffd050' },
  }),
  draw(s, P) {
    const br = P.breathe, t = P.t, walk = P.gait >= 0;
    s.group('body');
    // woolly body from lumpy puffs
    const puffs = [[0, 11, -1, 7, 6, 9.5], [-4.5, 10, 3, 3.6, 3.6, 3.6], [4.5, 10, 3, 3.6, 3.6, 3.6], [-4.5, 10, -6, 3.6, 3.6, 3.6], [4.5, 10, -6, 3.6, 3.6, 3.6]];
    // curl clusters: a soft shading bias in a sparse cellular pattern -> crisp 2-3 px curl shadows in the fleece
    const curl = (a, b, c) => (Math.sin(a * 8.5 + b * 2) * Math.sin(c * 8.5 - b * 6.5) > 0.5 ? ['wool', -0.28] : 'wool');
    puffs.forEach(([x, y, z, a, b, c], k) => s.ell([x, y + br * 0.2, z], [a, b, c], k ? 'wool' : curl, { grp: s.group('w' + k) }));
    // team armour saddle plates
    s.group('armor');
    s.ell([0, 15.5, -1.5], [6.2, 2.8, 7.4], (a, b, c) => Math.abs(c) > 0.82 || Math.abs(a) > 0.86 ? 'metal' : (Math.abs(c) < 0.08 ? 'teamD' : 'team'), { rot: [0.05, 0, 0] });
    const legO = { mat: 'face', paw: 'hoof', pawR: 1.7, stride: 2.8, lift: 2, r1: 1.8, r2: 1.4, l1: 3.2, l2: 3.6 };
    s.group('legF'); for (const sd of [-1, 1]) leg(s, P, [sd * 3.6, 6, 5], { ...legO, phase: sd < 0 ? 0 : 0.5, front: true });
    s.group('legB'); for (const sd of [-1, 1]) leg(s, P, [sd * 3.8, 6, -6.5], { ...legO, phase: sd < 0 ? 0.5 : 0, bend: 1 });
    // head with team helmet and curled horns
    s.group('head');
    s.push(); s.t(0, 13, 9); s.rx(P.atk ? P.atk * 0.45 : 0);
    const HC = [0, 0, 0], HR = [3.6, 3.8, 3.8];
    s.ell(HC, HR, 'face');
    s.ell([0, -1.6, 3.2], [2.4, 2.2, 2.4], 'face', { grp: s.group('snout') });
    s.group('helm');
    s.ell([0, 2.2, 0.6], [4, 2.4, 3.8], (a, b, c) => c > 0.75 ? 'metal' : 'team', { rot: [-0.3, 0, 0] });
    s.group('horn');
    for (const sd of [-1, 1]) {
      const pts = [];
      for (let k = 0; k <= 10; k++) {
        const a = k / 10 * 1.6 * Math.PI;
        const r = 4.2 - k * 0.26;
        pts.push([sd * (3.2 + k * 0.28), 2 + Math.sin(a) * r * 0.85, -1 - Math.cos(a) * r + 4, 1.9 - k * 0.12]);
      }
      s.tube(pts, null, { matAlong: f => Math.floor(f * 10) % 2 ? 'hornD' : 'horn' });
    }
    s.group('head');
    eyes(s, P, HC, HR, { dx: 2, dy: 0.2, w: 2, h: 2, style: 'normal', lid: 0.4, ring: false, irisW: 0.9 });
    s.pop();
    if (P.anim === 'attack' && P.fxi === 3) sparks(s, [0, 12, 16], { n: 5, r: 4, mat: 'glob', size: 0.9, shape: 'diamond' });
  },
};

export const MINIONS = [grubling, spitwing, shellram];
