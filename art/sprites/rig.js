// Animation timelines, pose generation, generic root motion and limb helpers.
import { Scene, compileMats } from './raster.js';
import { clamp, lerp, TAU, v3 } from './math.js';

// frame timelines ---------------------------------------------------------------
// attack: ready -> wind-up -> anticipation hold -> SMEAR -> impact (hit) -> hit-stop hold -> overshoot -> recover
export const ANIMS = {
  idle: { n: 8, fps: 8, loop: true },
  blink: { n: 1, fps: 8, loop: false },   // idle frame 0 with closed eyes: shown ~120 ms every 3-5 s (never part of the idle loop)
  walk: { n: 8, fps: 12, loop: true },
  attack: { n: 8, fps: 14, loop: false, hit: 4 },
  cast: { n: 6, fps: 10, loop: true },
  hurt: { n: 3, fps: 12, loop: false },
  faint: { n: 7, fps: 9, loop: false },
};
export const ANIM_NAMES = Object.keys(ANIMS);
const ATK = [-0.3, -0.8, -1.0, 0.85, 1.0, 1.0, 0.72, 0.22];
const ATKMOUTH = [0, 0.3, 0.4, 1, 1, 1, 0.6, 0];
const ATKFX = [0, 1, 1, 2, 3, 3, 4, 5];          // legacy 6-frame effect index used by species fx code (P.fxi)
// squash & stretch per attack frame: [vertical, along-facing]
const ATKSQ = [[0.98, 1.0], [0.93, 1.04], [0.9, 1.06], [0.94, 1.2], [1.05, 0.95], [1.03, 0.97], [0.98, 1.03], [1, 1]];
const CAST = [0.3, 0.6, 0.85, 1, 0.9, 0.65];
const HURT = [1, 0.7, 0.3];
const FAINT = [0.1, 0.3, 0.55, 0.82, 0.74, 0.92, 1];   // topple, hit the ground, small bounce, settle
const FAINTSQ = [1, 1, 1.02, 0.86, 1.04, 0.92, 0.88];

export function poseFor(anim, i, form) {
  const A = ANIMS[anim];
  const t = i / A.n;
  const P = { anim, i, fxi: i, t, look: 0, lookAdd: 0, breathe: 0, bob: 0, gait: -1, atk: 0, mouth: 0, cast: 0, hurt: 0, faint: 0, eyes: 'open', fx: t, flick: i, sq: 1, st: 1, smear: 0 };
  const quirk = (form && form.quirk) || 'look';
  switch (anim) {
    case 'idle':
      P.breathe = Math.sin(t * TAU); P.bob = Math.sin(t * TAU);
      P.sq = 1 + 0.025 * Math.sin(t * TAU); P.st = 1 - 0.012 * Math.sin(t * TAU);       // breathing squash
      if (quirk === 'look') P.lookAdd = [0, 0, 0.18, 0.32, 0.32, 0.12, 0, 0][i];
      if (quirk === 'hop') { P.bob += [0, 0, 0, 1.8, 2.6, 1.2, 0, 0][i]; P.sq *= [1, 1, 0.94, 1.06, 1.04, 0.96, 1, 1][i]; }
      if (quirk === 'proud') P.lookAdd = -[0, 0.1, 0.2, 0.2, 0.15, 0.05, 0, 0][i];
      break;
    case 'blink': P.eyes = 'blink'; break;
    case 'walk':
      P.gait = t; P.bob = Math.abs(Math.cos(t * TAU)) * 2 - 1; P.breathe = Math.sin(t * TAU * 2) * 0.5;
      P.sq = 1 - 0.035 * Math.cos(t * TAU * 2); P.st = 1 + 0.02 * Math.cos(t * TAU * 2);  // contact squash, passing stretch
      break;
    case 'attack':
      P.atk = ATK[i]; P.mouth = ATKMOUTH[i]; P.fxi = ATKFX[i]; P.eyes = i >= 1 && i <= 2 ? 'fierce' : 'open';
      P.strike = i >= 3 && i <= 6 ? (i === 4 || i === 5 ? 1 : 0.6) : 0; P.sq = ATKSQ[i][0]; P.st = ATKSQ[i][1]; P.smear = i === 3 ? 1 : 0;
      break;
    case 'cast': P.cast = CAST[i]; P.breathe = Math.sin(t * TAU) * 0.6; P.eyes = 'glow'; P.mouth = 0.4; P.fxi = i; P.sq = 1 + 0.04 * CAST[i]; break;
    case 'hurt': P.hurt = HURT[i]; P.eyes = 'hurt'; P.mouth = 0.5; P.sq = [0.9, 1.04, 1][i]; P.st = [1.08, 0.98, 1][i]; break;
    case 'faint': P.faint = FAINT[i]; P.eyes = i < 2 ? 'hurt' : 'faint'; P.mouth = i < 2 ? 0.5 : 0; P.sq = FAINTSQ[i]; break;
  }
  return P;
}

// two-bone IK in the plane containing hip->foot and the bend hint direction
export function ik(hip, foot, l1, l2, bend) {
  const d = v3.sub(foot, hip);
  let L = v3.len(d);
  const maxL = (l1 + l2) * 0.999;
  let f = foot;
  if (L > maxL) { f = v3.add(hip, v3.mul(d, maxL / L)); L = maxL; }
  const a = (l1 * l1 - l2 * l2 + L * L) / (2 * L);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const dir = v3.norm(v3.sub(f, hip));
  // perpendicular toward bend hint
  let perp = v3.sub(bend, v3.mul(dir, v3.dot(bend, dir)));
  perp = v3.norm(perp);
  const knee = v3.add(v3.add(hip, v3.mul(dir, a)), v3.mul(perp, h));
  return { knee, foot: f };
}

// gait foot offset: phase in [0,1)
export function gaitFoot(P, phase, stride, lift) {
  if (P.gait < 0) return [0, 0];
  const ph = (P.gait + phase) % 1;
  const a = ph * TAU;
  // forward during swing (lifted), back during stance
  const z = Math.cos(a) * stride;
  const y = Math.max(0, Math.sin(a)) * lift;
  return [z, y];
}

// standard quadruped leg. hip local; options
export function leg(s, P, hip, o) {
  const [gz, gy] = gaitFoot(P, o.phase || 0, o.stride ?? 3, o.lift ?? 2);
  // idle stance: stagger feet so legs don't read as parallel table legs
  const st = P.gait < 0 && !P.faint ? (o.stance ?? (o.l1 + o.l2) * 0.13) * ((o.phase || 0) < 0.25 ? 1 : -0.7) : 0;
  const spl = (o.splay ?? 0) + (P.gait < 0 ? Math.sign(hip[0]) * (o.l1 + o.l2) * 0.04 : 0);
  let foot = [hip[0] + spl, (o.footY || 0) + gy, hip[2] + gz + st + (o.reach || 0)];
  if (P.atk && o.front) foot = [foot[0], foot[1] + Math.max(0, P.atk) * (o.atkLift || 0), foot[2] + P.atk * (o.atkReach || 0)];
  const r1 = o.r1, r2 = o.r2 ?? o.r1 * 0.75;
  let knee, f;
  if (o.hock) {
    // digitigrade hind leg: hip -> knee (forward) -> hock (back, raised) -> foot
    const hockP = [foot[0], foot[1] + o.hock * 0.92, foot[2] - o.hock * 0.38 - gy * 0.2];
    const r = ik(hip, hockP, o.l1, o.l2, [0, 0, 1]);
    knee = r.knee; f = foot;
    const rh = r2 * 1.05;
    s.tube([[...hip, r1], [...knee, r1 * 0.72 + r2 * 0.28], [...r.foot, rh]], o.mat, { grp: o.grp, bias: o.bias });
    s.tube([[...r.foot, rh], [...f, r2 * 0.95]], o.matLow || o.mat, { grp: o.grp, bias: o.bias });
  } else {
    const r = ik(hip, foot, o.l1, o.l2, [0, 0, o.bend ?? -1]);
    knee = r.knee; f = r.foot;
    s.tube([[...hip, r1], [...knee, r1 * (o.kneeK ?? 0.66) + r2 * 0.34], [...f, r2]], o.mat, { grp: o.grp, bias: o.bias, n: o.n });
  }
  if (o.paw) s.ell([f[0], f[1] + (o.pawY ?? o.pawR * 0.6), f[2] + (o.pawZ ?? o.pawR * 0.35)], [o.pawR, o.pawR * (o.pawFlat ?? 0.72), o.pawR * 1.15], o.paw, { grp: o.grp, bias: o.bias });
  return { knee, foot: f };
}

// ------------------------------------------------------------------------------------
export const VIEWS = { front: -50, back: 130, side: -90 };

// Render one frame of a form. Returns indexed image {w,h,idx,palette} + anchor.
const matCache = new WeakMap();
export function getMats(form, variant) {
  let byVar = matCache.get(form);
  if (!byVar) { byVar = {}; matCache.set(form, byVar); }
  const k = variant || '_';
  if (!byVar[k]) {
    const defs = typeof form.mats === 'function' ? form.mats(variant) : form.mats;
    byVar[k] = compileMats({ ...BASE_MATS, ...defs });
  }
  return byVar[k];
}
export const BASE_MATS = {
  eyeW: { ramp: ['#8a8fa8', '#b8bed0', '#dfe3ee', '#f6f7fb', '#ffffff'], noLine: true },
  pupil: { ramp: ['#1a1426', '#2b2236', '#3d3346', '#55485e', '#6a5c74'], noLine: true },
  shine: { ramp: ['#ffffff', '#ffffff', '#e8f0ff', '#ffffff', '#ffffff'], noLine: true },
  mouth: { ramp: ['#3a1824', '#5c2230', '#7a2c3a', '#99404c', '#b85a64'], noLine: true },
  tongue: { ramp: ['#9c3a4a', '#c2526a', '#e2708a', '#f294a8', '#ffc0cc'], noLine: true },
  glow: { ramp: ['#7cf0ff', '#a8f6ff', '#d6fbff', '#f2feff', '#ffffff'], noLine: true },
};

export function animDefs(form) { return form.animDefs || ANIMS; }
export function animList(form) { return form.anims || ANIM_NAMES; }
export function viewList(form) { return form.views || ['front', 'back']; }

export function renderFrame(form, view, anim, i, opt = {}) {
  const P = (form.poseFor || poseFor)(anim, i, form);
  P.view = view;
  P.front = view === 'front' || view === 'down';
  // in game the VFX layer draws attack / cast effects: o.noFx leaves projectiles, sparks and shockwaves out of the frames
  P.noFx = !!opt.noFx && (anim === 'attack' || anim === 'cast');
  P.look = view === 'front' && !P.faint ? (form.look ?? 0.42) * (P.anim === 'attack' ? 0.4 : 1) + (P.lookAdd || 0) : (P.lookAdd || 0) * 0.6;
  const scale = (opt.scale || 1) * (form.scale || 1);
  const [cw0, ch0] = opt.cell || form.cell;
  // generous padding around the nominal cell so nothing ever clips (frames are trimmed later)
  const pad = Math.round(Math.max(cw0, ch0) * 0.18);
  const cw = cw0 + pad * 2, ch = ch0 + pad * 2;
  const s = new Scene({
    w: cw, h: ch, ax: opt.ax ?? cw / 2 + (form.axOff || 0) * (opt.scale || 1), ay: opt.ay ?? ch - pad - (form.ayOff ?? 5) * (opt.scale || 1),
    scale, yaw: opt.yaw ?? (form.yaw?.[view] ?? VIEWS[view]), pitch: opt.pitch ?? form.pitch ?? 20,
    mats: getMats(form, opt.variant), dither: form.dither ?? 0, view,
  });
  s.P = P;
  if (!form.noRoot) rootMotion(s, P, form);
  form.draw(s, P, opt);
  if (P.smear) smearLines(s, form);
  const img = s.finish({ selout: form.selout ?? true, data: !!opt.data });
  img.ax = s.ax; img.ay = s.ay;
  if (opt.variant) img.palette = getMats(form, opt.variant).palette;
  return img;
}

// smear frame: a few speed lines trailing behind the body (drawn in the attack's lunge frame)
function smearLines(s, form) {
  const H = form.height || 30, W = (form.width || H * 0.5);
  const hov = form.hover || 0;
  for (let k = 0; k < 3; k++) {
    const y = hov + H * (0.28 + k * 0.17), x = (k - 1) * W * 0.18;
    const a = s.proj([x, y, -W * 0.45]), b = s.proj([x, y + H * 0.02, -W * (1.1 + 0.25 * (k % 2))]);
    s.stroke2([[a[0], a[1], 0.7 * s.S], [b[0], b[1], 0.25 * s.S]], Math.min(a[2], b[2]) - 2, 'shine', { grp: s.group('smear') });
  }
}

// generic whole-body motion (applied before species draw)
export function rootMotion(s, P, form) {
  const H = form.height || 30;
  const hov = form.hover || 0;
  // faint: topple to the side + sink
  if (P.faint) {
    const f = P.faint;
    const side = form.faintSide || 1;
    const half = (form.width || H * 0.5) * 0.5;
    const roll = Math.min(1, f * 1.15) * (form.faintRoll ?? 80) * Math.PI / 180;
    s.t(side * half, -hov * Math.min(1, f * 1.6), 0);
    s.rz(-side * roll);
    s.t(-side * half, 0, 0);
    s.t(0, -H * 0.04 * f, 0);
  }
  // squash & stretch about the feet (volume-ish preserving): sq = vertical, st = along facing
  if ((P.sq && P.sq !== 1) || (P.st && P.st !== 1)) { const q = P.sq || 1, st = P.st || 1; s.sc(1 / Math.sqrt(q), q, st / Math.sqrt(q)); }
  if (hov) s.t(0, hov + P.bob * (form.hoverBob ?? H * 0.03), 0);
  else s.t(0, Math.max(0, P.bob) * (form.bobAmt ?? H * 0.02), 0);
  if (P.atk) {
    const a = P.atk;
    s.t(0, 0, a * (form.lunge ?? H * 0.12));
    s.rx(a * (form.atkPitch ?? 0.1));
  }
  if (P.hurt) { s.t(0, 0, -P.hurt * H * 0.08); s.rx(-P.hurt * 0.14); }
  if (P.cast) s.t(0, P.cast * (form.castRise ?? H * 0.03), 0);
}

// shared material helpers
export const lerpC = lerp;
export const cl = clamp;
