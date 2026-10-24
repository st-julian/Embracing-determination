// ELECTRIC line: Sparkit -> Voltail -> Thundrix (Electric/Wind)
import { leg } from '../rig.js';
import { mouth, eyes, eyePixels } from '../face.js';
import { onEll, orb, sparks, bolt, smoothPoly, wingPoly, featherBias, featherWing, TAU, hash } from '../parts.js';
const norm3 = (v) => { const l = Math.hypot(...v); return v.map(x => x / l); };

export const BOLTFX = { ramp: ['#e0a010', '#ffd030', '#fff060', '#fffbb0', '#ffffff'], emissive: true, outline: '#3a3cae', litOutline: '#5a5cd0', noLine: true, noCastLine: true, th: [0.1, 0.28, 0.5, 0.75] };
export const ARCFX = { ramp: ['#3aa8ff', '#5cd0ff', '#9aeaff', '#d8fbff', '#ffffff'], emissive: true, outline: '#2a3a9a', noLine: true, noCastLine: true, th: [0.1, 0.3, 0.55, 0.8] };

// zig-zag bolt card polygon (u along length, v across)
export function boltPoly(L, W) {
  return [[0, -W * 0.25], [L * 0.45, -W * 0.5], [L * 0.38, -W * 0.05], [L, -W * 0.35], [L * 0.55, W * 0.5], [L * 0.62, W * 0.1], [0, W * 0.3]];
}
function zapFx(s, P, mp, size) {
  if (P.anim !== 'attack') return;
  if (P.fxi === 2) orb(s, [mp[0], mp[1], mp[2] + size * 0.5], size * 0.35, 'arc', { z: 40 });
  if (P.fxi === 3) { bolt(s, mp, [mp[0], mp[1] - size * 0.3, mp[2] + size * 2.4], { mat: 'bolt', r: size * 0.16, n: 5, seed: 3 }); orb(s, [mp[0], mp[1] - size * 0.3, mp[2] + size * 2.4], size * 0.45, 'arc', { z: 41 }); }
  if (P.fxi === 4) sparks(s, [mp[0], mp[1], mp[2] + size * 2.2], { n: 5, r: size * 0.7, mat: 'bolt', size: size * 0.18, t: 0.4, shape: 'diamond' });
}
function castArcs(s, P, y, r, size) {
  if (!P.cast) return;
  sparks(s, [0, y, 0], { n: 6, r, t: P.t, mat: 'bolt', size, flat: 0.45, shape: 'diamond' });
  const a = (P.t) * TAU;
  bolt(s, [Math.cos(a) * r * 0.6, y + r * 0.5, Math.sin(a) * r * 0.6], [Math.cos(a + 1) * r * 0.8, y - r * 0.2, Math.sin(a + 1) * r * 0.8], { mat: 'bolt', r: size * 0.6, n: 4, seed: P.fxi });
}
const zig = (a, c, f = 8) => Math.abs(((a * f + Math.abs(((c * 3) % 2 + 2) % 2 - 1) * 2) % 2 + 2) % 2 - 1);

// ------------------------------------------------------------------------------------
export const sparkit = {
  id: 'sparkit', quirk: 'hop', name: 'Sparkit', line: 'electric', stage: 0, types: ['electric'],
  cell: [64, 64], height: 32, width: 16, shadow: 8, scale: 1.12,
  mats: {
    fur: { c: '#ffd23e', hi: true }, cream: { c: '#fff6d6', dark: 0.85 }, navy: { c: '#2d3a7c' }, copper: { c: '#e08a3c', hi: true },
    earIn: { c: '#ff9d5a' }, nose: { c: '#3a2a3a' }, iris: { c: '#2d2a5a' }, cheek: { c: '#46c8ff' },
    bolt: BOLTFX, arc: ARCFX,
  },
  draw(s, P) {
    const br = P.breathe, t = P.t, walk = P.gait >= 0;
    // hopping: walk lifts whole body
    const hop = walk ? Math.abs(Math.sin(P.gait * TAU)) * 3 : 0;
    s.t(0, hop, 0);
    s.group('body');
    // upright pear-shaped body sitting on haunches
    s.ell([0, 10 + br * 0.2, -1], [5.6, 7 + br * 0.2, 5.6], (a, b, c) => c > 0.35 && b < 0.5 ? 'cream' : 'fur', { rot: [0.25, 0, 0] });
    // big hind feet
    s.group('legB');
    for (const sd of [-1, 1]) {
      const lift = walk ? Math.max(0, Math.sin((P.gait + (sd > 0 ? 0 : 0.1)) * TAU)) * 1 : 0;
      s.ell([sd * 4.2, 6, -1.5], [2.6, 3.6, 4], 'fur');
      s.ell([sd * 3.8, 1.2 + lift, 1.6], [1.9, 1.3, 3.2], 'fur');
    }
    // little forepaws held at chest
    s.group('arm');
    for (const sd of [-1, 1]) {
      const reach = P.atk > 0 ? P.atk * 2.5 : 0;
      s.tube([[sd * 3.8, 12.5, 2.5, 1.3], [sd * 2.6, 10.5 + reach * 0.4, 5 + reach, 1.2]], 'fur');
      s.ell([sd * 2.4, 10.4 + reach * 0.4, 5.6 + reach], [1.3, 1.2, 1.3], 'cream');
    }
    // battery tail: huge, banded, copper terminal
    s.group('tail');
    const sw = Math.sin(t * TAU) * (walk ? 1.5 : 1);
    const tp = [[0, 5, -5, 2.6], [sw * 0.3, 8, -9.5, 4.2], [sw * 0.8, 15, -11, 5], [sw, 22, -9.5, 5], [sw * 1.1, 27, -6.5, 4.2]];
    s.tube(tp, null, { matAlong: f => f < 0.3 ? 'fur' : (Math.floor(f * 9) % 2 ? 'navy' : 'fur') });
    const e = tp[4];
    s.ell([e[0], e[1] + 3, e[2] + 1.5], [2.2, 1.6, 2.2], 'copper', { rot: [-0.5, 0, 0] });
    if (P.anim === 'idle' && P.fxi % 3 === 0 || P.cast) bolt(s, [e[0], e[1] + 4.5, e[2] + 1.5], [e[0] + 3, e[1] + 9, e[2]], { mat: 'bolt', r: 0.9, n: 3, z: 2, amp: 1.5 });
    // head
    s.group('head');
    s.push();
    s.t(0, 20 + br * 0.35 + (P.hurt ? 0.8 : 0), 1.5);
    s.ry(P.look);
    s.rx(-P.mouth * 0.2 + P.hurt * 0.2);
    s.rz(P.anim === 'idle' ? Math.sin(t * TAU) * 0.06 : 0);
    const HC = [0, 0, 0], HR = [7.2, 6.4, 6.4];
    s.ell(HC, HR, (a, b, c) => c > 0.55 && b < -0.25 ? 'cream' : 'fur');
    s.group('muzzle');
    s.ell([0, -2.3, 4.6], [2.6, 2, 2.2], 'cream');
    s.ell([0, -1.5, 6.6], [0.9, 0.7, 0.7], 'nose');
    // tall ears with navy tufts
    s.group('ear');
    for (const sd of [-1, 1]) {
      s.push(); s.t(sd * 3.8, 4.4, -1); s.rz(-sd * (0.22 + (P.anim === 'idle' && sd > 0 ? Math.max(0, Math.sin(t * TAU * 2)) * 0.15 : 0))); s.ry(sd * 0.25);
      s.card([0, 0, 0], [1, 0, 0], [0, 1, 0], smoothPoly([[-2.6, 0], [2.6, 0], [1.6, 6], [0.6, 11.5], [-0.4, 8], [-1.8, 5]], 3), (u, v) => v > 7.5 ? 'navy' : (Math.abs(u) < 1.4 && v > 1 ? 'earIn' : 'fur'), { backMat: (u, v) => v > 7.5 ? 'navy' : 'fur', bulge: 0.5 });
      s.pop();
    }
    s.group('head');
    eyes(s, P, HC, HR, { dx: 3.2, dy: 0.8, w: 4, h: 5, style: 'cute' });
    if (P.front) {
      // blue zig-zag cheek marks
      for (const sd of [-1, 1]) {
        const p = s.proj(onEll(HC, HR, sd * 5, -2.2));
        const n = s.dir([sd * 5 / 7.2, -0.3, 0.5]);
        if (n[2] > 0.15) s.decal([[p[0] - 1, p[1] - 1, 'cheek', 3], [p[0], p[1], 'cheek', 2], [p[0] + 1, p[1] - 1, 'cheek', 3], [p[0] + 2, p[1], 'cheek', 2]], { host: s.groups.head, z: p[2], tol: 3 });
      }
      const mp = [0, -3.6, 5.6];
      if (P.mouth > 0.4) mouth(s, mp, { style: 'open', w: 3, h: 2, host: 'muzzle' });
      else mouth(s, mp, { style: 'smile', w: 3, host: 'muzzle' });
    }
    s.pop();
    castArcs(s, P, 14, 14, 1.4);
    s.push(); s.t(0, 19, 1.5); zapFx(s, P, [0, -2, 7], 7); s.pop();
  },
};

// ------------------------------------------------------------------------------------
export const voltail = {
  id: 'voltail', quirk: 'look', name: 'Voltail', line: 'electric', stage: 1, types: ['electric'],
  cell: [96, 96], height: 46, width: 22, shadow: 13, scale: 1.08,
  mats: {
    fur: { c: '#ffc935' }, stripe: { c: '#2b3576' }, cream: { c: '#fff4d2', dark: 0.85 }, paw: { c: '#2b3576' },
    nose: { c: '#2a2236' }, iris: { c: '#3ae0ff' }, bolt: BOLTFX, arc: ARCFX,
  },
  draw(s, P) {
    const br = P.breathe, t = P.t, walk = P.gait >= 0;
    const stripes = (a, b, c) => b > -0.1 && Math.sin(c * 10 + Math.abs(a) * 4) > 0.55 ? 'stripe' : null;
    s.group('body');
    s.ell([0, 17 + br * 0.25, -2], [6, 6.2 + br * 0.2, 12.5], (a, b, c) => b < -0.35 ? 'cream' : stripes(a, b, c) || 'fur');
    s.group('chest');
    s.ell([0, 18.5, 7.5], [5.4, 6.6, 5], (a, b, c) => c > 0.3 || b < -0.2 ? 'cream' : 'fur');
    const legO = { mat: 'fur', paw: 'paw', pawR: 2.4, stride: 5, lift: 3.5, r2: 1.9 };
    s.group('legF');
    for (const sd of [-1, 1]) leg(s, P, [sd * 3.4, 14, 7.5], { ...legO, l1: 6.5, l2: 8, r1: 2.8, phase: sd < 0 ? 0 : 0.5, front: true, atkReach: 4, atkLift: 3 });
    s.group('legB');
    for (const sd of [-1, 1]) { s.ell([sd * 4, 17.5, -9.5], [3.4, 5.8, 5.6], (a, b, c) => stripes(a, b, c) || 'fur'); leg(s, P, [sd * 4, 15, -10], { ...legO, l1: 6, l2: 6, hock: 5.4, r1: 3.6, r2: 1.7, phase: sd < 0 ? 0.5 : 0 }); }
    // tail ending in a lightning bolt
    s.group('tail');
    const sw = Math.sin(t * TAU) * (walk ? 2.5 : 1.6);
    const tp = [[0, 19, -13, 2.2], [sw * 0.3, 22, -18, 2.2], [sw, 27, -20, 2], [sw * 1.2, 31, -19, 1.6]];
    s.tube(tp, null, { matAlong: f => Math.floor(f * 6) % 2 ? 'stripe' : 'fur' });
    s.push(); s.t(sw * 1.2, 31, -19);
    s.card([0, 0, 0], [0.15, 1, 0.1], [1, 0, 0], boltPoly(9, 6), 'bolt', { heatFn: d => 0.3 + d * 1.2 });
    s.pop();
    // neck & head
    s.group('neck');
    s.tube([[0, 20, 7, 4], [0, 25, 9, 3.4], [0, 28, 10, 3.2]], (a, b, c) => c > 0.4 ? 'cream' : 'fur');
    s.group('head');
    s.push();
    s.t(0, 31 + br * 0.4 + (P.hurt ? 1 : 0), 11);
    s.ry(P.look);
    s.rx(-P.mouth * 0.28 + P.hurt * 0.25);
    const HC = [0, 0, 0], HR = [6.2, 5.6, 5.6];
    s.ell(HC, HR, (a, b, c) => (b > 0.45 && Math.abs(a) < 0.35 && Math.sin(c * 9) > 0) ? 'stripe' : 'fur');
    // spiky cheek ruff
    s.group('ruff');
    for (const sd of [-1, 1]) s.card([sd * 5, -2.4, 0], [sd, -0.1, -0.35], [0, 1, 0], [[0, 2.4], [5, 1.5], [2.5, 0.2], [5.5, -1.6], [2, -1.8], [4, -3.6], [0, -2.6]], 'cream', { bulge: 0.4 });
    s.group('muzzle');
    s.ell([0, -2, 4.4], [3, 2.3, 2.8], 'cream');
    s.ell([0, -1, 6.9], [1.1, 0.8, 0.8], 'nose');
    // ears with lightning-bolt tufts
    s.group('ear');
    for (const sd of [-1, 1]) {
      s.push(); s.t(sd * 3.6, 3.8, -1); s.rz(-sd * 0.25); s.ry(sd * 0.3);
      s.card([0, 0, 0], [1, 0, 0], [0, 1, 0], smoothPoly([[-2.8, 0], [2.8, 0], [1, 6.5], [-0.2, 8], [-1.6, 5]], 3), (u, v) => v > 5.6 ? 'stripe' : 'fur', { bulge: 0.5 });
      s.card([0, 7.2, 0], [0.2 * sd, 1, 0], [1, 0, 0], boltPoly(7, 4), 'bolt', { heatFn: d => 0.3 + d * 1.2 });
      s.pop();
    }
    s.group('head');
    eyes(s, P, HC, HR, { dx: 2.9, dy: 0.9, w: 5, h: 5, style: 'normal', irisW: 0.75, pupil: 0.25, pupilH: 0.85, lid: 0.25 });
    if (P.front) {
      const mp = [0, -3.4, 6.2];
      if (P.mouth > 0.4) mouth(s, mp, { style: 'open', w: 4, h: 3, host: 'muzzle', fangs: true });
      else mouth(s, mp, { style: 'fang', w: 3, host: 'muzzle' });
    }
    s.pop();
    castArcs(s, P, 22, 20, 1.8);
    s.push(); s.t(0, 31, 11); zapFx(s, P, [0, -2, 8], 9); s.pop();
  },
};

// ------------------------------------------------------------------------------------
export const thundrix = {
  id: 'thundrix', quirk: 'proud', name: 'Thundrix', line: 'electric', stage: 2, types: ['electric', 'wind'],
  cell: [128, 128], height: 76, width: 34, shadow: 20,
  mats: {
    fur: { c: '#2f3f8c' }, stripe: { c: '#ffd03a', hi: true }, cream: { c: '#e8ecff', dark: 0.8 }, cloud: { c: '#aeb6d8', dark: 0.85 },
    cloudD: { c: '#6c7499' }, feather: { c: '#3a3f7a' }, paw: { c: '#1e2350' }, claw: { c: '#fff0b0', dark: 0.7 },
    nose: { c: '#141633' }, iris: { c: '#5ef0ff' }, bolt: BOLTFX, arc: ARCFX,
  },
  draw(s, P) {
    const br = P.breathe, t = P.t, walk = P.gait >= 0;
    const stripes = (a, b, c) => b > -0.05 && Math.abs(Math.sin(c * 7 + Math.abs(a) * 3)) > 0.93 ? 'stripe' : null;
    s.group('body');
    s.ell([0, 30 + br * 0.3, -3], [10, 10.5 + br * 0.25, 18], (a, b, c) => b < -0.4 ? 'cream' : stripes(a, b, c) || 'fur');
    s.group('chest');
    s.ell([0, 32, 10], [9, 11, 8], (a, b, c) => c > 0.35 ? 'cream' : 'fur');
    const legO = { mat: 'fur', paw: 'paw', pawR: 3.6, stride: 6, lift: 4.5, r2: 3 };
    s.group('legF');
    for (const sd of [-1, 1]) {
      s.ell([sd * 6.6, 31, 9], [4.4, 7.6, 6], 'fur');
      const r = leg(s, P, [sd * 6, 25, 10], { ...legO, l1: 10, l2: 12, r1: 4.6, phase: sd < 0 ? 0 : 0.5, front: true, atkReach: 6, atkLift: 5 });
      for (let c = -1; c <= 1; c++) s.tube([[r.foot[0] + c * 1.6, 1.4 + r.foot[1], r.foot[2] + 3, 0.8], [r.foot[0] + c * 1.8, 0.5 + r.foot[1], r.foot[2] + 4.6, 0.35]], 'claw');
    }
    s.group('legB');
    for (const sd of [-1, 1]) { s.ell([sd * 6.6, 31, -14], [5, 9, 8.6], (a, b, c) => stripes(a, b, c) || 'fur'); leg(s, P, [sd * 6.6, 26, -15], { ...legO, l1: 9.5, l2: 9.5, hock: 8, r1: 5.4, r2: 2.6, phase: sd < 0 ? 0.5 : 0 }); }
    // storm wings: slate feathers with lightning-yellow tips
    const flap = Math.sin(t * TAU) * (walk ? 0.16 : 0.1) + P.cast * 0.35 + Math.max(0, -P.atk) * 0.3 - Math.max(0, P.atk) * 0.15;
    for (const sd of [-1, 1]) {
      s.push(); s.t(sd * 7, 38, 3); s.rz(-sd * (0.1 + flap));
      featherWing(s, [0, 0, 0], norm3([sd * 0.32, 0.82, -0.46]), norm3([0, -0.5, -0.86]), {
        n: 9, arm: 17, len: 27, fw: 7, a0: -0.45, a1: 1.5, gname: 'w' + sd,
        mat: (k) => k % 2 ? 'feather' : 'cloudD', armMat: 'cloud',
        tipMat: () => 'stripe', tipAt: 0.72,
      });
      s.pop();
    }
    // tail: long, ending in a jagged bolt
    s.group('tail');
    const sw = Math.sin(t * TAU) * (walk ? 3 : 2) - (P.atk || 0) * 2;
    const tp = [[0, 33, -19, 3.4], [sw * 0.4, 36, -26, 3], [sw, 42, -30, 2.6], [sw * 1.3, 48, -29, 2.2]];
    s.tube(tp, null, { matAlong: f => Math.floor(f * 7) % 2 ? 'stripe' : 'fur' });
    s.push(); s.t(sw * 1.3, 48, -29);
    s.card([0, 0, 0], [0.1, 1, 0.15], [1, 0, 0], boltPoly(15, 10), 'bolt', { heatFn: d => 0.3 + d * 1.2 });
    s.pop();
    // neck with storm-cloud mane
    s.group('neck');
    s.tube([[0, 36, 11, 7], [0, 43, 15, 6], [0, 48, 17, 5.4]], (a, b, c) => c > 0.4 ? 'cream' : 'fur');
    s.group('mane');
    const mane = [[-6, 42, 10, 5], [6, 42, 10, 5], [0, 47, 9, 5.4], [-5, 48, 13, 4], [5, 48, 13, 4], [0, 41, 5, 5], [-4, 37, 6, 4.4], [4, 37, 6, 4.4]];
    mane.forEach(([x, y, z, r], k) => { s.group('cl' + k); s.ell([x, y, z], [r, r * 0.85, r], (a, b) => b < -0.3 ? 'cloudD' : 'cloud'); });
    // head
    s.group('head');
    s.push();
    s.t(0, 53 + br * 0.5 + (P.hurt ? 1.5 : 0), 19);
    s.ry(P.look);
    s.rx(-P.mouth * 0.28 + P.hurt * 0.25);
    const HC = [0, 0, 0], HR = [8.2, 7.4, 7.6];
    s.ell(HC, HR, (a, b, c) => (b > 0.4 && Math.abs(a) < 0.3) ? 'stripe' : 'fur');
    s.group('muzzle');
    s.ell([0, -2.6, 5.8], [4, 3.2, 4.2], (a, b) => b < -0.05 ? 'cream' : 'fur');
    s.ell([0, -1.3, 9.8], [1.5, 1.1, 1], 'nose');
    s.group('ear');
    for (const sd of [-1, 1]) {
      s.push(); s.t(sd * 5, 4.5, -1.5); s.rz(-sd * 0.35); s.ry(sd * 0.3);
      s.card([0, 0, 0], [1, 0, 0], [0, 1, 0], smoothPoly([[-3, 0], [3, 0], [1, 7], [-0.3, 9], [-1.8, 6]], 3), (u, v) => v > 6 ? 'stripe' : 'fur', { bulge: 0.5 });
      s.card([0, 8, 0], [0.3 * sd, 1, 0], [1, 0, 0], boltPoly(9, 5), 'bolt', { heatFn: d => 0.3 + d * 1.2 });
      s.pop();
    }
    s.group('head');
    eyes(s, P, HC, HR, { dx: 3.7, dy: 1.3, w: 6, h: 6, style: 'normal', irisW: 0.72, pupil: 0.22, pupilH: 0.85, lid: 0.3 });
    if (P.front) {
      const mp = [0, -4.6, 8.6];
      if (P.mouth > 0.4) mouth(s, mp, { style: 'open', w: 6, h: 4, host: 'muzzle', fangs: true });
      else mouth(s, mp, { style: 'fang', w: 4, host: 'muzzle' });
    }
    s.pop();
    castArcs(s, P, 34, 32, 2.4);
    s.push(); s.t(0, 53, 19); zapFx(s, P, [0, -3, 11], 13); s.pop();
  },
};

export default [sparkit, voltail, thundrix];
