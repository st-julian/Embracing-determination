// Trainers: three specialisation looks (Attack / Healing / Magic) x team colour, chibi
// overworld proportions, 4 directions (down/up/left; right = flipped left).
import { eyes, mouth } from './face.js';
import { orb, sparks, smoothPoly, leafPoly, TAU } from './parts.js';
// 5-point star (u right, v down) for the Mystic's cape emblem
const STAR = Array.from({ length: 10 }, (_, k) => { const a = k / 10 * TAU, r = k % 2 ? 1.3 : 3.2; return [Math.sin(a) * r, -Math.cos(a) * r]; });
function inPoly(P, x, y) {
  let c = false;
  for (let a = 0, b = P.length - 1; a < P.length; b = a++) { const [xa, ya] = P[a], [xb, yb] = P[b]; if ((ya > y) !== (yb > y) && x < (xb - xa) * (y - ya) / (yb - ya) + xa) c = !c; }
  return c;
}
const CAPE = smoothPoly([[-4, 0], [4, 0], [5.2, 7], [6.4, 14.5], [3.8, 16.2], [0, 16.6], [-3.8, 16.2], [-6.4, 14.5], [-5.2, 7]], 3);
import { TEAM } from './minions.js';

export const TRAINER_ANIMS = {
  idle: { n: 4, fps: 5, loop: true },
  blink: { n: 1, fps: 8, loop: false },   // idle frame 0 with closed eyes (~120 ms every 3-5 s, staggered per unit)
  walk: { n: 6, fps: 10, loop: true },
  throw: { n: 6, fps: 12, loop: false, hit: 3 },
  hurt: { n: 2, fps: 8, loop: false },
  defeated: { n: 4, fps: 6, loop: false },
};
export function trainerPose(anim, i) {
  const A = TRAINER_ANIMS[anim];
  const t = i / A.n;
  const P = { anim, i, t, breathe: 0, gait: -1, throwP: -1, hurt: 0, down: 0, eyes: 'open', mouth: 0, bob: 0, atk: 0, cast: 0, faint: 0 };
  if (anim === 'idle') P.breathe = Math.sin(t * TAU);
  if (anim === 'walk') { P.gait = t; P.bob = Math.abs(Math.cos(t * TAU)); }
  if (anim === 'throw') { P.throwP = i; P.eyes = i <= 1 ? 'fierce' : 'open'; P.mouth = i === 3 ? 1 : 0; }
  if (anim === 'blink') P.eyes = 'blink';
  if (anim === 'hurt') { P.hurt = i === 0 ? 1 : 0.5; P.eyes = 'hurt'; P.mouth = 0.6; }
  if (anim === 'defeated') { P.down = [0.25, 0.55, 0.8, 1][i]; P.eyes = i < 2 ? 'hurt' : 'faint'; }
  return P;
}

const SPEC = {
  attack: {
    skin: '#e9b48c', hair: '#3a2a34', pants: '#3a3f5c', shoes: '#f4f4f8', extra: '#2a2a36',
  },
  healing: {
    skin: '#ffd9bc', hair: '#c47a3c', pants: '#6a5242', shoes: '#7a4a32', extra: '#f4ead2',
  },
  magic: {
    skin: '#a8704e', hair: '#c2b4f2', pants: '#2c2840', shoes: '#3a2c46', extra: '#ffd24a',
  },
};

function makeTrainer(spec) {
  const C = SPEC[spec];
  return {
    id: 'trainer_' + spec, name: { attack: 'Striker', healing: 'Mender', magic: 'Mystic' }[spec] + ' Trainer', kind: 'trainer', spec,
    variants: ['blue', 'red'], views: ['down', 'up', 'left'], anims: Object.keys(TRAINER_ANIMS), animDefs: TRAINER_ANIMS, poseFor: trainerPose,
    yaw: { down: -12, up: 168, left: -90 }, pitch: 22, noRoot: true,
    cell: [104, 64], height: 50, width: 16, shadow: 8, ayOff: 4,
    mats: (v) => {
      const T = TEAM[v || 'blue'];
      return {
        skin: { c: C.skin }, hair: { c: C.hair, gloss: true }, top: { c: T.main }, topD: { c: T.dark }, accent: { c: T.accent, dark: 0.8 },
        pants: { c: C.pants }, shoes: { c: C.shoes, dark: 0.8 }, extra: { c: C.extra, dark: 0.85 }, white: { c: '#f6f6fa', dark: 0.75 },
        gold: { c: '#ffc83a', hi: true, gloss: true }, leaf: { c: '#5ccf4a' }, wood: { c: '#8a5a3a' }, iris: { c: '#2a2238' }, blush: { c: '#ff9a9a' },
        orbTop: { c: '#5fe0e8', gloss: true }, orbBot: { c: '#2a3466' },
        pack: { c: '#e4a93c' }, packD: { c: '#4a3430', dark: 0.8 }, roll: { c: '#86b45e' },
        magicFx: { ramp: ['#8a5aff', '#b48aff', '#dcc4ff', '#f4ecff', '#ffffff'], emissive: true, noLine: true, outline: '#3a2a8a' },
      };
    },
    draw(s, P) { drawTrainer(s, P, spec); },
  };
}

function drawTrainer(s, P, spec) {
  const view = s.view;
  const side = view === 'left';
  const br = P.breathe || 0;
  // defeated: kneel then topple
  if (P.down) {
    const d = P.down;
    s.t(0, -Math.min(1, d * 1.6) * 7 * (d > 0.6 ? 1 - (d - 0.6) / 0.4 * 0.9 : 1), 0);
    if (d > 0.6) { const r = (d - 0.6) / 0.4; s.t(6, 0, 0); s.rz(-r * 1.45); s.t(-6, 0, 0); s.t(0, r * 2, 0); }
  }
  if (P.hurt) { s.rx(-P.hurt * 0.25); s.t(0, 0, -P.hurt * 2); }
  s.t(0, (P.bob || 0) * 1.2, 0);
  // full-body throw arc: coil back, step in, whip forward, follow through
  const TH = P.throwP;
  if (TH >= 0) { s.t(0, [0, -0.6, -1, -1.4, -1.2, -0.4][TH], 0); s.rx([-0.12, -0.2, 0.04, 0.22, 0.3, 0.08][TH]); }
  const g = P.gait;
  const sw = g >= 0 ? Math.sin(g * TAU) : 0;
  // legs
  s.group('legs');
  const kneel = P.down ? Math.min(1, P.down * 1.6) : 0;
  for (const sd of [-1, 1]) {
    const ph = sd * sw;
    const lift = g >= 0 ? Math.max(0, Math.sin((g + (sd > 0 ? 0 : 0.5)) * TAU)) * 2.5 : 0;
    const hip = [sd * 2.7, 13, 0];
    const stepZ = TH >= 0 && sd < 0 ? [0, -1, 2.5, 3.5, 3.5, 1.5][TH] : TH >= 0 ? [0, 0.5, -0.5, -1.5, -1.5, -0.5][TH] : 0;
    let knee = [sd * 2.8, 7 + lift * 0.6, ph * 1.6 + lift * 0.4 + stepZ * 0.5];
    let foot = [sd * 2.9, 1.6 + lift, ph * 3.4 + stepZ];
    if (kneel) { knee = [sd * 3, 7 - kneel * 4.5, 2 + kneel * 3.5]; foot = [sd * 3, 1.6 + kneel * 0.5, -2.5 * kneel]; }
    s.tube([[...hip, 2.7], [...knee, 2.3], [...foot, 2]], 'pants');
    s.ell([foot[0], foot[1] - 0.1, foot[2] + 1.2], [2.5, 1.9, 3.4], 'shoes');
  }
  // torso & outfit
  s.group('torso');
  s.push(); s.t(0, 19 + br * 0.2, 0);
  if (P.throwP >= 0) s.ry([0.5, 0.65, 0.1, -0.35, -0.5, -0.1][P.throwP]);
  if (spec === 'attack') {
    s.ell([0, 0, 0], [6, 6, 4.4], (a, b, c) => Math.abs(a) < 0.12 && c > 0 ? 'white' : (b > 0.72 ? 'accent' : 'top'));
    s.ell([0, -5, 0], [5.6, 2.4, 4.2], 'pants', { grp: s.group('belt') });
    // backpack + shoulder straps: the back view reads as a trainer, not a blank jacket
    s.group('pack');
    s.ell([0, -0.2, -4.9], [4.8, 5.4, 2.8], (a, b, c) => (b > 0.42 ? 'accent' : b > 0.3 ? 'packD' : Math.abs(a) < 0.3 && b < -0.15 && b > -0.66 && c < -0.3 ? 'packD' : 'pack'));
    for (const sd of [-1, 1]) s.tube([[sd * 3, 4.2, -3.4, 0.8], [sd * 3.3, 6.1, -0.6, 0.8], [sd * 3.2, 4.4, 3.5, 0.75], [sd * 3, 0.4, 4.3, 0.7]], 'packD', { grp: s.group('strap' + sd) });
  } else if (spec === 'healing') {
    // ranger vest: team colour, cream collar, diagonal satchel strap
    s.ell([0, 0, 0], [5.8, 6, 4.4], (a, b, c) => b > 0.72 ? 'extra' : Math.abs(a * 0.8 + b * 0.9 - 0.1) < 0.13 ? 'wood' : (c > 0.5 && Math.abs(a) < 0.08 ? 'topD' : 'top'));
    s.ell([0, -5, 0], [6.4, 2.8, 4.8], 'top', { grp: s.group('skirt') });
    // satchel + strap
    s.group('bag');
    s.ell([5.8, -3.4, 1.5], [2.4, 2.8, 2.6], 'wood');
    s.ell([6, -2, 2.4], [2, 1, 1.4], 'leaf');
    // bedroll strapped across the lower back
    s.group('roll');
    s.tube([[-4.6, -2.4, -5, 2.1], [4.6, -2.4, -5, 2.1]], 'roll');
    for (const sd of [-1, 1]) s.ell([sd * 2.4, -2.4, -5], [0.75, 2.4, 2.4], 'wood', { grp: s.group('rollStrap') });
  } else {
    // long coat flaring to the knees
    s.ell([0, 0, 0], [5.8, 6, 4.4], (a, b, c) => Math.abs(a) < 0.1 && c > 0 ? 'gold' : 'top');
    s.group('coat');
    s.ell([0, -5.5, -0.5], [7, 5.5, 5.2], (a, b, c) => b < -0.7 ? 'gold' : 'topD');
    // star cape from the shoulders (the back view's signature)
    s.group('cape');
    s.card([0, 5.4, -3.3], [1, 0, 0], [0, -1, -0.3], CAPE, (u, v, dn) => (v > 15.1 || (dn < 0.2 && v > 1.5) || inPoly(STAR, u, v - 8) ? 'gold' : 'topD'), { bulge: 0.6 });
  }
  s.pop();
  // arms
  for (const sd of [-1, 1]) {
    s.group('arm' + sd);
    const sh = [sd * 6, 23 + br * 0.2, 0];
    let el = [sd * 7.2, 19, -sd * sw * 2 * (side ? 1 : 0.6)];
    let ha = [sd * 7.4, 15, -sd * sw * 3.5 * (side ? 1 : 0.6)];
    if (P.throwP >= 0 && sd > 0) {
      const T = [[[7, 21, -4], [6, 26, -7]], [[6, 24, -6], [5, 29, -8]], [[6, 27, -2], [4, 32, 0]], [[5, 23, 5], [3, 22, 10]], [[4, 18, 5], [0, 13, 6]], [[7, 19, 1], [7.2, 15, 1]]][P.throwP];
      el = T[0]; ha = T[1];
    }
    if (P.throwP >= 0 && sd < 0 && P.throwP < 4) { el = [-7, 20, 3]; ha = [-5, 21, 7]; }
    if (P.hurt) { el = [sd * 8, 21, -1]; ha = [sd * 9, 25, 1]; }
    if (kneel && P.down > 0.3) { ha = [sd * 6, 8, 4]; el = [sd * 7, 14, 3]; }
    const sleeve = spec === 'attack' ? 'skin' : 'top';
    s.tube([[...sh, 2], [...el, 1.7]], spec === 'attack' ? 'top' : sleeve);
    s.tube([[...el, 1.7], [...ha, 1.5]], spec === 'attack' ? 'skin' : (spec === 'magic' ? 'top' : 'skin'));
    s.ell(ha, [1.9, 1.9, 1.9], spec === 'attack' ? 'extra' : 'skin', { grp: s.group('hand' + sd) });
    if (spec === 'attack') s.ell([el[0] + (ha[0] - el[0]) * 0.75, el[1] + (ha[1] - el[1]) * 0.75, el[2] + (ha[2] - el[2]) * 0.75], [1.9, 1.3, 1.9], 'accent', { grp: s.group('cuff' + sd) });
    // magic staff in left hand
    if (spec === 'magic' && sd < 0) {
      s.group('staff');
      s.tube([[ha[0], ha[1] - 9, ha[2] + 1, 0.8], [ha[0], ha[1] + 13, ha[2] + 1, 0.8]], 'wood');
      s.tube([[ha[0], ha[1] + 13, ha[2] + 1, 1.2], [ha[0] + 1.6, ha[1] + 15.5, ha[2] + 1, 0.8], [ha[0] + 0.6, ha[1] + 17.5, ha[2] + 1, 0.5]], 'gold');
      s.ell([ha[0], ha[1] + 16, ha[2] + 1], [1.9, 2.6, 1.9], 'magicFx');
    }
    // capture orb in throwing hand
    if (P.throwP >= 0 && sd > 0 && P.throwP < 3) { s.group('orb'); s.ell([ha[0], ha[1] + 1.5, ha[2] + 1], [2.2, 2.2, 2.2], (a, b) => Math.abs(b) < 0.15 ? 'gold' : b > 0 ? 'orbTop' : 'orbBot'); }
  }
  if (P.throwP === 3) orb(s, [3, 24, 14], 2.4, 'orbTop', { z: 30, trail: [-4, 3] });
  if (P.throwP === 4) orb(s, [2, 27, 22], 2.2, 'orbTop', { z: 30, trail: [-6, 4] });
  // head
  s.group('head');
  s.push();
  s.t(0, 33 + br * 0.3, 0.5);
  if (P.hurt) s.rx(-0.2);
  s.sc(1.18);
  const HC = [0, 0, 0], HR = [8, 7.6, 7.4];
  s.ell(HC, HR, 'skin');
  s.group('hair');
  if (spec === 'attack') {
    s.ell([0, 1.6, -0.9], [8.5, 7, 7.4], (a, b, c) => (b < -0.1 && c > 0.2) || (c > 0.55 && b < 0.45) ? null : (b < 0.25 && b > 0.0 && c > -0.2 ? 'top' : 'hair'));
    const spikes = [[0, 7, -1], [-4, 6, -2], [4, 6, -2], [-6, 3, -4], [6, 3, -4], [0, 5, -6], [-2, 7.5, 2], [2.5, 7, 2.5]];
    spikes.forEach(([x, y, z]) => s.tube([[x * 0.7, y * 0.6, z * 0.6, 2.6], [x * 1.2, y + 2.5, z * 1.4 - 2, 0.5]], 'hair'));
    // headband tails
    s.tube([[-1, 1.5, -7.5, 1], [-2.5, 0, -11, 0.8], [-3, -2, -13, 0.5]], 'top');
  } else if (spec === 'healing') {
    s.ell([0, 1.2, -0.7], [8.4, 7.2, 7.6], (a, b, c) => (b < 0.05 && c > 0.15) || (c > 0.6 && b < 0.5) ? null : 'hair');
    s.tube([[0, -1, -7, 2.4], [0, -5, -9.5, 2], [0, -10, -9, 1.6]], 'hair');
    // sun hat
    s.group('hat');
    s.ell([0, 5.8, -0.4], [10.8, 1.2, 10.5], (a, b, c) => 'extra', { rot: [-0.12, 0, 0] });
    s.ell([0, 7.6, -0.8], [7, 4.2, 6.8], (a, b) => b < -0.2 ? 'top' : 'extra', { rot: [-0.12, 0, 0] });
    s.card([5, 7.4, 3.5], [0.6, 0.8, 0.4], [0.8, -0.3, -0.3], leafPoly(5, 2.6, { n: 5 }), 'leaf', { bulge: 0.4 });
  } else {
    s.ell([0, 0.8, -0.6], [8.5, 7.4, 7.6], (a, b, c) => (c > -0.35 && b < 0.3) || (c > 0.5 && b < 0.55) ? null : 'hair');
    for (const sd of [-1, 1]) s.tube([[sd * 5.5, 3, 4.5, 1.6], [sd * 6.2, -1, 4.8, 1.3], [sd * 5.8, -4, 4.2, 0.8]], 'hair');
    // low ponytail with a gold tie (breaks up the back of the head)
    s.tube([[0, -0.5, -7, 2.3], [0, -4.5, -8.6, 1.9], [0, -7.4, -8.2, 1.3], [0, -8.8, -7.6, 0.8]], 'hair');
    s.ell([0, -3.6, -8.4], [2.3, 1.1, 2.3], 'gold', { grp: s.group('tie') });
    // floppy pointed mage hat with star
    s.group('hat');
    s.ell([0, 5, -0.6], [10.5, 1.6, 10.5], (a, b, c) => Math.sqrt(a * a + c * c) > 0.9 ? 'gold' : 'topD', { rot: [-0.1, 0, 0] });
    const flop = Math.sin((P.t || 0) * TAU) * 0.6;
    s.tube([[0, 6, -0.6, 6.6], [0, 11, -1.6, 4.4], [flop * 0.5, 15, -3.5, 2.6], [flop, 17, -7, 1.4], [flop * 1.2, 15.5, -10, 0.8]], (a, b, c) => 'top');
    s.ell([flop * 1.2, 15, -10.5], [1.6, 1.6, 1.6], 'gold', { grp: s.group('star') });
  }
  s.group('head');
  if (view === 'down' || view === 'left') {
    const P2 = { ...P, front: true };
    // Gen-5 overworld eyes: solid dark ovals with a crisp highlight, no lid (a lid read as sleepy / closed at this size)
    eyes(s, P2, HC, HR, { dx: 3.1, dy: -0.9, w: 3, h: 4.4, style: 'cute', solid: true, lid: 0 });
    if (view === 'down') {
      mouth(s, [0, -4.2, 7], { style: P.mouth > 0.4 ? 'open' : 'smile', w: 2, h: 2 });
      if (spec !== 'magic') for (const sd of [-1, 1]) { const p = s.proj([sd * 4.8, -3, 5.6]); s.decal([[p[0], p[1], 'blush', 2]], { host: s.groups.head, z: p[2], tol: 3 }); }
    }
  }
  s.pop();
  if (P.anim === 'idle' && spec === 'magic') sparks(s, [-7.4, 31, 1], { n: 3, r: 3, t: P.t, mat: 'magicFx', size: 0.6, shape: 'diamond' });
}

export const TRAINERS = [makeTrainer('attack'), makeTrainer('healing'), makeTrainer('magic')];
