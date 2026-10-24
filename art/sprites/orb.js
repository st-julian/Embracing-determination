// Capture orb ("Vale Lantern Orb"): original design — a glass-topped sphere caged by gold ribs,
// navy metal base, gem latch. Animations: idle spin, open (lid hinges back, beam), wobble, sparkle, burst.
import { sparks, TAU } from './parts.js';

export const ORB_ANIMS = {
  idle: { n: 4, fps: 8, loop: true },
  open: { n: 3, fps: 12, loop: false },
  wobble: { n: 4, fps: 8, loop: true },
  sparkle: { n: 4, fps: 10, loop: false },
  burst: { n: 3, fps: 12, loop: false },
};
function orbPose(anim, i) {
  return { anim, i, t: i / ORB_ANIMS[anim].n, eyes: 'open' };
}
export const captureOrb = {
  id: 'orb', name: 'Capture Orb', kind: 'item', views: ['front'], anims: Object.keys(ORB_ANIMS), animDefs: ORB_ANIMS, poseFor: orbPose,
  noRoot: true, yaw: { front: -20 }, pitch: 24, cell: [32, 32], height: 12, width: 12, shadow: 5, ayOff: 6,
  mats: {
    glass: { c: '#5ee6ee', gloss: true, hi: true }, glassIn: { c: '#2ca8c8' }, metal: { c: '#2c3a78' }, gold: { c: '#ffc83a', gloss: true, hi: true },
    gem: { c: '#ff5a8a', gloss: true, hi: true }, light: { ramp: ['#7ae8ff', '#b0f4ff', '#e0fcff', '#ffffff', '#ffffff'], emissive: true, noLine: true, noCastLine: true, noOutline: true, outline: '#3a9ab8' },
    star: { ramp: ['#ffd84a', '#ffe88a', '#fff6c8', '#ffffff', '#ffffff'], emissive: true, noLine: true, outline: '#c8822a' },
  },
  draw(s, P) {
    const R = 5.6;
    const a = P.anim;
    let tilt = 0, lid = 0, spin = 0, squash = 1;
    if (a === 'idle') spin = P.t * TAU / 4;
    if (a === 'wobble') tilt = [0.32, 0, -0.32, 0][P.i];
    if (a === 'open') lid = [0.4, 1.0, 1.3][P.i];
    if (a === 'burst') lid = [1.4, 1.8, 2.2][P.i];
    if (a === 'sparkle') squash = [1.08, 1, 1, 1][P.i];
    s.t(0, 0, 0); s.rz(tilt); s.t(0, R, 0); s.ry(spin);
    s.sc(1 / squash, squash, 1 / squash);
    // base hemisphere
    s.group('base');
    s.ell([0, 0, 0], [R, R, R], (u, v, w) => v > 0.02 ? null : (Math.abs(v) < 0.18 ? 'gold' : 'metal'));
    s.ell([0, -0.2, 0], [R * 0.97, R * 0.2, R * 0.97], 'glassIn', { grp: s.group('rim') });
    // lid (upper glass hemisphere) hinged at the back
    s.group('lid');
    s.push(); s.t(0, 0, -R); s.rx(-lid); s.t(0, 0, R);
    s.ell([0, 0, 0], [R, R, R], (u, v, w) => {
      if (v < 0) return null;
      const ang = Math.atan2(w, u);
      const rib = Math.abs(((ang / (Math.PI / 3)) % 1 + 1) % 1 - 0.5) > 0.42;
      if (v < 0.16) return 'gold';
      if (rib) return 'gold';
      return v > 0.8 ? 'gold' : 'glass';
    });
    s.ell([0, R * 0.98, 0], [1.2, 0.9, 1.2], 'gold', { grp: s.group('cap') });
    s.pop();
    // gem latch
    if (lid < 0.3) { s.group('gem'); s.ell([0, 0.2, R * 0.95], [1.3, 1.5, 0.9], 'gem'); }
    if (lid > 0.5) {
      // beam of light from the opened orb
      const p = s.proj([0, 0, 0]);
      const h = (a === 'burst' ? 9 : 16) * s.S * Math.min(1, lid);
      const w = (a === 'burst' ? 8 : 3.2) * s.S * (0.6 + lid * 0.4);
      s.poly2([[p[0] - w * 0.45, p[1]], [p[0] + w * 0.45, p[1]], [p[0] + w, p[1] - h], [p[0] - w, p[1] - h]], p[2] + 2, 'light', { heatFn: (d, X, Y) => 0.15 + d * 1.6 + (Y - (s.ay - p[1])) / h * 0.4 });
    }
    if (a === 'sparkle') sparks(s, [0, 0, 0], { n: 5, r: 8 + P.i * 2, t: P.i * 0.05, mat: 'star', size: P.i === 3 ? 0.8 : 1.3, shape: 'diamond', flat: 0.7, spin: 0 });
    if (a === 'burst') sparks(s, [0, 0, 0], { n: 6, r: 4 + P.i * 4, t: 0.08, mat: 'light', size: 1, shape: 'diamond', flat: 0.8, spin: 0 });
  },
};
