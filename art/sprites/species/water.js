// WATER line: Puddlet -> Tidalon -> Abyssaur
import { leg } from '../rig.js';
import { mouth, eyes } from '../face.js';
import { onEll, orb, sparks, leafPoly, smoothPoly, TAU } from '../parts.js';

export const WATERFX = { ramp: ['#2a64c8', '#3c8ef0', '#62bcff', '#a8e6ff', '#f2fdff'], emissive: true, outline: '#1a3a86', litOutline: '#2850a8', noLine: true, noCastLine: true, th: [0.1, 0.3, 0.55, 0.8] };
const spot = (a, c, k = 1) => Math.sin(a * 9 * k + 1) * Math.sin(c * 7 * k + 2) > 0.55;

function splashFx(s, P, mp, size) {
  if (P.anim === 'attack') {
    if (P.fxi === 2) orb(s, [mp[0], mp[1], mp[2] + size * 0.5], size * 0.4, 'water', { z: 40 });
    if (P.fxi === 3) orb(s, [mp[0], mp[1] + size * 0.1, mp[2] + size * 1.5], size * 0.6, 'water', { z: 40, trail: [size * 0.9, -size * 0.2] });
    if (P.fxi === 4) sparks(s, [mp[0], mp[1], mp[2] + size * 2], { n: 6, r: size * 0.8, mat: 'water', size: size * 0.16, t: 0.2 });
  }
}
function castRing(s, P, y, r, size) {
  if (P.cast) sparks(s, [0, y, 0], { n: 7, r, t: P.t, mat: 'water', size, flat: 0.4, rise: 3 });
}

// ------------------------------------------------------------------------------------
export const puddlet = {
  id: 'puddlet', quirk: 'hop', name: 'Puddlet', line: 'water', stage: 0, types: ['water'],
  cell: [64, 64], height: 26, width: 18, shadow: 10, scale: 1.25,
  mats: {
    skin: { c: '#5fb6f2', hi: true }, back: { c: '#3f8ad8' }, belly: { c: '#fff0c4', dark: 0.9 },
    gill: { c: '#ff86a8' }, fin: { c: '#aaf0ff', dark: 0.75 }, toe: { c: '#9edcff' },
    iris: { c: '#1d2a5c' }, water: WATERFX,
  },
  draw(s, P) {
    const br = P.breathe, t = P.t, walk = P.gait >= 0;
    s.group('body');
    s.ell([0, 8 + br * 0.2, -1.5], [6.3, 5.3 + br * 0.15, 8.4], (a, b, c) => b < -0.35 ? 'belly' : (b > 0.35 && spot(a, c)) ? 'back' : 'skin');
    const legO = { l1: 2.4, l2: 3, r1: 2, r2: 1.6, mat: 'skin', paw: 'toe', pawR: 1.9, stride: 2.4, lift: 1.8 };
    s.group('legF'); leg(s, P, [-4, 5, 4.5], { ...legO, phase: 0, front: true, atkReach: 1.4 }); leg(s, P, [4, 5, 4.5], { ...legO, phase: 0.5, front: true, atkReach: 1.4 });
    s.group('legB'); leg(s, P, [-4.2, 5, -5.5], { ...legO, phase: 0.5, bend: 1 }); leg(s, P, [4.2, 5, -5.5], { ...legO, phase: 0, bend: 1 });
    // dorsal fin + paddle tail
    s.group('fin');
    s.card([0, 12, -2.5], [0, 0, -1], [0, 1, 0], smoothPoly([[-3.5, -1.5], [-1, 2.4], [3, 2.6], [6.5, -1.5]], 3), 'fin', { bulge: 0.3 });
    s.group('tail');
    const sw = Math.sin(t * TAU) * (walk ? 2.4 : 1.6);
    s.tube([[0, 7, -8.5, 3.2], [sw * 0.5, 7.4, -12, 2.5], [sw, 8.2, -15.2, 1.6], [sw * 1.3, 9.2, -17.5, 0.8]], (a, b) => b < -0.3 ? 'belly' : 'skin');
    s.push(); s.t(sw * 0.6, 8, -11); s.ry(sw * 0.06);
    s.card([0, 0, 0], [0, 0, -1], [0, 1, 0], smoothPoly([[0, 2.5], [4, 4.6], [8.5, 4.2], [10.5, 0.5], [8.5, -3], [4, -4], [0, -2]], 3), 'fin', { bulge: 0.3 });
    s.pop();
    // head
    s.group('head');
    s.push();
    s.t(0, 15 + br * 0.3 + (P.hurt ? 0.8 : 0), 5.5);
    s.ry(P.look);
    s.rx(-P.mouth * 0.15 + P.hurt * 0.2);
    s.rz(P.anim === 'idle' ? Math.sin(t * TAU) * 0.05 : 0);
    const HC = [0, 0, 0], HR = [8.4, 6.5, 6.6];
    s.ell(HC, HR, (a, b, c) => b < -0.5 && c > 0.3 ? 'belly' : 'skin');
    // feathery gills (3 per side)
    s.group('gill');
    for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) {
      const th = (-0.35 + k * 0.55) + Math.sin((t + k * 0.2) * TAU) * 0.08;
      s.push(); s.t(sd * 7.4, -1.5 + k * 2.6, -1.8 - k * 0.6);
      s.card([0, 0, 0], [sd * Math.cos(th), Math.sin(th), -0.3], [0, 0, 1], leafPoly(8.5 - k * 0.6, 4, { n: 6 }), (u, v) => ['gill', (Math.sin(u * 2.6) > 0.3 && Math.abs(v) > 0.7) ? -0.35 : 0], { bulge: 0.3 });
      s.pop();
    }
    s.group('head');
    eyes(s, P, HC, HR, { dx: 4.3, dy: 1, w: 4, h: 5, style: 'cute' });
    if (P.front) {
      const mp = onEll(HC, HR, 0, -2.6);
      if (P.mouth > 0.4) mouth(s, mp, { style: 'open', w: 5, h: 3 });
      else mouth(s, mp, { style: 'smile', w: 5 });
    }
    s.pop();
    castRing(s, P, 12, 15, 1.4);
    s.push(); s.t(0, 14, 5.5); splashFx(s, P, [0, -2, 7], 7); s.pop();
  },
};

// ------------------------------------------------------------------------------------
export const tidalon = {
  id: 'tidalon', quirk: 'look', name: 'Tidalon', line: 'water', stage: 1, types: ['water'],
  cell: [96, 96], height: 44, width: 24, shadow: 14,
  mats: {
    skin: { c: '#3a8ee0' }, back: { c: '#2c6cc0' }, belly: { c: '#fff0c8', dark: 0.9 },
    fin: { c: '#6ae6d6', dark: 0.8 }, shell: { c: '#365e9a' }, rim: { c: '#cfe6ff', dark: 0.8 },
    nose: { c: '#1a2440' }, iris: { c: '#28c8ff' }, water: WATERFX,
  },
  draw(s, P) {
    const br = P.breathe, t = P.t, walk = P.gait >= 0;
    s.group('body');
    s.ell([0, 15 + br * 0.25, -3], [6.6, 6.6 + br * 0.2, 13.5], (a, b, c) => b < -0.3 ? 'belly' : b > 0.45 ? 'back' : (b > 0 && Math.sin(c * 9 + a * 3) > 0.82 ? 'fin' : 'skin'));
    s.group('chest');
    s.ell([0, 18, 8], [5.8, 7, 5.2], (a, b, c) => c > 0.25 || b < -0.2 ? 'belly' : 'skin');
    // back shell plates
    s.group('shell');
    for (let k = 0; k < 3; k++) s.ell([0, 20.8 - k * 0.3, 3.5 - k * 7.6], [6.2 - k * 0.4, 2.9, 5], (a, b, c) => a * a + c * c > 0.62 ? 'rim' : 'shell', { rot: [0.1, 0, 0], grp: s.group('shell' + k) });
    const legO = { mat: 'skin', paw: 'skin', pawR: 2.5, stride: 4, lift: 3, r2: 2.1 };
    s.group('legF'); leg(s, P, [-3.8, 11, 8], { ...legO, l1: 5, l2: 6.4, r1: 2.9, phase: 0, front: true, atkReach: 3, atkLift: 2 }); leg(s, P, [3.8, 11, 8], { ...legO, l1: 5, l2: 6.4, r1: 2.9, phase: 0.5, front: true, atkReach: 3, atkLift: 2 });
    s.group('legB');
    for (const sd of [-1, 1]) { s.ell([sd * 4.4, 14, -11], [3.2, 5, 5], 'skin'); leg(s, P, [sd * 4.4, 11.5, -11.5], { ...legO, l1: 5.5, l2: 6.4, r1: 3.4, phase: sd < 0 ? 0.5 : 0, bend: 1 }); }
    // rudder tail with fluke
    s.group('tail');
    const sw = Math.sin(t * TAU) * (walk ? 3 : 2);
    const tp = [[0, 15, -15.5, 4.2], [sw * 0.3, 14, -21.5, 3.4], [sw, 13.4, -27, 2.4], [sw * 1.4, 13.6, -31.5, 1.2]];
    s.tube(tp, (a, b) => b < -0.3 ? 'belly' : 'skin');
    s.push(); s.t(sw * 1.3, 13.6, -30.5); s.ry(sw * 0.06);
    s.card([0, 0, 0], [0, 0, -1], [0.85, 0.5, 0], smoothPoly([[0, 0], [3.5, 6], [10, 9], [7.5, 2], [10, 0], [7.5, -2], [10, -9], [3.5, -6]], 2), (u, v) => ['fin', Math.abs(Math.sin(v * 0.9)) < 0.18 ? -0.3 : 0], { bulge: 0.3 });
    s.pop();
    // neck + head
    s.group('neck');
    s.tube([[0, 18, 9, 4.6], [0, 23, 11.5, 4], [0, 26, 12.5, 3.8]], (a, b, c) => c > 0.4 ? 'belly' : 'skin');
    for (const sd of [-1, 1]) {
      s.push(); s.t(sd * 3.4, 23, 10.5);
      s.card([0, 0, 0], [sd * 0.75, 0.35, -0.55], [0, 1, 0], leafPoly(11, 7, { n: 7 }), (u, v) => ['fin', Math.abs(v) < 0.5 || Math.sin(u * 1.8) > 0.85 ? -0.3 : 0], { bulge: 0.3 });
      s.pop();
    }
    s.group('head');
    s.push();
    s.t(0, 29 + br * 0.4 + (P.hurt ? 1 : 0), 13.5);
    s.ry(P.look);
    s.rx(-P.mouth * 0.3 + P.hurt * 0.25);
    const HC = [0, 0, 0], HR = [5.8, 5, 6];
    s.ell(HC, HR, 'skin');
    s.group('muzzle');
    s.ell([0, -1.8, 5], [3.6, 2.8, 3.8], (a, b) => b < -0.1 ? 'belly' : 'skin');
    s.ell([0, -0.6, 8.6], [1.3, 0.9, 0.9], 'nose');
    s.group('crest');
    s.card([0, 3.5, 1.5], [0, 0, -1], [0, 1, 0], smoothPoly([[-2.5, -1], [0, 6], [6, 10], [12, 8], [9, 3.5], [12, 1], [9, -1]], 3), (u, v) => ['fin', Math.sin(u * 1.6) > 0.6 ? -0.3 : 0], { bulge: 0.3 });
    for (const sd of [-1, 1]) s.card([sd * 4.8, -0.5, 0.5], [sd * 0.8, 0.2, -0.55], [0, 1, 0], leafPoly(6, 3.6, { n: 5 }), 'fin', { bulge: 0.3 });
    s.group('head');
    eyes(s, P, HC, HR, { dx: 2.8, dy: 1.2, w: 5, h: 5, style: 'normal', lid: 0.1 });
    if (P.front) {
      const mp = [0, -3.6, 7.6];
      if (P.mouth > 0.4) mouth(s, mp, { style: 'open', w: 4, h: 3, host: 'muzzle', fangs: true });
      else mouth(s, mp, { style: 'smile', w: 4, host: 'muzzle' });
    }
    s.pop();
    castRing(s, P, 18, 22, 1.8);
    s.push(); s.t(0, 28, 13.5); splashFx(s, P, [0, -2, 9], 9); s.pop();
  },
};

// ------------------------------------------------------------------------------------
export const abyssaur = {
  id: 'abyssaur', quirk: 'proud', name: 'Abyssaur', line: 'water', stage: 2, types: ['water'],
  cell: [128, 128], height: 72, width: 38, shadow: 22,
  mats: {
    skin: { c: '#2f6fc4' }, belly: { c: '#f2e8c4', dark: 0.9 },
    shell: { c: '#27406e' }, rim: { c: '#9fd6ff', dark: 0.8 }, coral: { c: '#e8fbff', dark: 0.7, coolHue: 3.6 },
    fin: { c: '#4fd8d0', dark: 0.8 }, claw: { c: '#e6eef8', dark: 0.7 },
    glowS: { ramp: ['#3ad8ff', '#5ce6ff', '#8ef2ff', '#c8fbff', '#ffffff'], emissive: true, noLine: true, outline: '#1a4a8a' },
    nose: { c: '#142038' }, iris: { c: '#30e8ff' }, water: WATERFX,
  },
  draw(s, P) {
    const br = P.breathe, t = P.t, walk = P.gait >= 0;
    s.group('body');
    s.ell([0, 28 + br * 0.3, -4], [12.5, 11.5 + br * 0.25, 20], (a, b) => b < -0.35 ? 'belly' : 'skin');
    // glowing side spots
    s.group('spots');
    for (const sd of [-1, 1]) for (let k = 0; k < 4; k++) {
      const z = 8 - k * 7, y = 24 + (k % 2) * 3;
      const p = onEll([0, 28, -4], [12.5, 11.5, 20], 0, 0);
      const zz = z + 4, u = (zz) / 20;
      const x = sd * 12.5 * Math.sqrt(Math.max(0, 1 - u * u - ((y - 28) / 11.5) ** 2));
      s.ell([x, y, zz], [1.1, 1.1, 1.1], 'glowS', { grp: s.groups.body });
    }
    // armoured carapace with coral spikes
    for (let k = 0; k < 4; k++) {
      const z = 9 - k * 8.5, y = 36.5 - Math.abs(k - 1.5) * 1.2;
      s.group('plate' + k);
      s.ell([0, y, z], [11 - Math.abs(k - 1.2) * 1.2, 4.6, 6.4], (a, b, c) => a * a + c * c > 0.74 ? 'rim' : 'shell', { rot: [0.08, 0, 0] });
      s.group('spike');
      s.tube([[0, y + 3, z, 2.2], [0, y + 8.5 - Math.abs(k - 1.5), z - 2.5, 0.5]], 'coral');
      for (const sd of [-1, 1]) s.tube([[sd * 7.5, y + 1.5, z, 1.5], [sd * 10.5, y + 5, z - 2, 0.4]], 'coral');
    }
    const legO = { mat: 'skin', paw: 'skin', pawR: 4.2, stride: 5.5, lift: 4, r2: 3.8, pawFlat: 0.6 };
    s.group('legF');
    for (const sd of [-1, 1]) {
      const r = leg(s, P, [sd * 9, 24, 10], { ...legO, l1: 10, l2: 11, r1: 6, phase: sd < 0 ? 0 : 0.5, front: true, atkReach: 4, atkLift: 3 });
      for (let c = -1; c <= 1; c++) s.tube([[r.foot[0] + c * 2, 1.5 + r.foot[1], r.foot[2] + 3.5, 1], [r.foot[0] + c * 2.3, 0.6 + r.foot[1], r.foot[2] + 5.5, 0.4]], 'claw');
    }
    s.group('legB');
    for (const sd of [-1, 1]) {
      s.ell([sd * 9.5, 28, -15], [5.5, 9, 9], 'skin');
      const r = leg(s, P, [sd * 9.5, 23, -16], { ...legO, l1: 10.5, l2: 11, r1: 6.5, phase: sd < 0 ? 0.5 : 0, bend: 1 });
      for (let c = -1; c <= 1; c++) s.tube([[r.foot[0] + c * 2, 1.5 + r.foot[1], r.foot[2] + 3.5, 1], [r.foot[0] + c * 2.3, 0.6 + r.foot[1], r.foot[2] + 5.5, 0.4]], 'claw');
    }
    // tail with big fan fin
    s.group('tail');
    const sw = Math.sin(t * TAU) * (walk ? 4 : 2.5);
    const tp = [[0, 28, -23, 7], [sw * 0.4, 25.5, -32, 5.5], [sw, 24, -40, 3.8], [sw * 1.5, 24.5, -47, 2.2]];
    s.tube(tp, (a, b) => b < -0.35 ? 'belly' : 'skin');
    s.push(); s.t(sw * 1.5, 25, -45); s.ry(sw * 0.05);
    s.card([0, 0, 0], [0, 0.35, -1], [0, 1, 0.2], smoothPoly([[0, 1], [5, 9], [12, 13], [14, 6], [12, 0], [14, -5], [8, -7], [1, -2.5]], 3), (u, v) => ['fin', Math.sin(Math.atan2(v, u + 2) * 9) > 0.7 ? -0.35 : 0], { bulge: 0.3 });
    s.pop();
    // neck
    s.group('neck');
    const nk = [[0, 32, 14, 8.4], [0, 41, 20, 6.8], [0, 49, 23, 6]];
    s.tube(nk, (a, b, c) => c > 0.45 && b < 0.3 ? 'belly' : 'skin');
    for (let k = 0; k < 3; k++) s.tube([[0, 37 + k * 6.5, 13.5 + k * 3, 1.8], [0, 41.5 + k * 6.5, 10 + k * 3, 0.4]], 'coral');
    // head
    s.group('head');
    s.push();
    s.t(0, 54 + br * 0.5 + (P.hurt ? 1.5 : 0), 26);
    s.ry(P.look);
    s.rx(-P.mouth * 0.28 + P.hurt * 0.25 + 0.05);
    const HC = [0, 0, 0], HR = [7, 6, 7.5];
    s.ell(HC, HR, 'skin');
    s.group('muzzle');
    s.ell([0, -1.6, 7.5], [4.8, 3.4, 6.2], (a, b) => b < -0.15 ? 'belly' : 'skin');
    s.ell([-1.6, -0.2, 13], [0.7, 0.6, 0.6], 'nose'); s.ell([1.6, -0.2, 13], [0.7, 0.6, 0.6], 'nose');
    s.group('frill');
    for (const sd of [-1, 1]) {
      s.push(); s.t(sd * 5.5, 0.5, -2);
      s.card([0, 0, 0], [sd * 0.6, 0.45, -0.65], [0, 0.8, 0.5], smoothPoly([[0, -3], [6, -4], [11, -1], [10, 2], [12, 5], [5, 4], [0, 3]], 2), (u, v) => ['fin', Math.sin(u * 1.4) > 0.7 ? -0.35 : 0], { bulge: 0.3 });
      s.pop();
    }
    s.group('horn');
    for (const sd of [-1, 1]) s.tube([[sd * 3, 4.5, 1, 1.6], [sd * 4, 8, -3, 1.1], [sd * 4.2, 10, -7.5, 0.4]], 'coral');
    s.group('head');
    eyes(s, P, HC, HR, { dx: 3.5, dy: 1.7, w: 6, h: 6, style: 'normal', lid: 0.32, pupil: 0.3 });
    if (P.front) {
      const mp = [0, -4, 11];
      if (P.mouth > 0.4) mouth(s, mp, { style: 'open', w: 6, h: 4, host: 'muzzle', fangs: true });
      else mouth(s, mp, { style: 'fang', w: 5, host: 'muzzle' });
    }
    s.pop();
    castRing(s, P, 30, 32, 2.4);
    s.push(); s.t(0, 54, 26); splashFx(s, P, [0, -3, 13], 13); s.pop();
  },
};

export default [puddlet, tidalon, abyssaur];
