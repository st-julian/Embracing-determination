// mt/voxel/models/electric.js — electric line: Sparkit (bolt-tailed spark bunny) -> Voltail (striped volt cat) ->
// Thundrix (storm griffin-cat, electric/wind). Owner: voxel character design. Identity from the sprite art: sunny
// yellow fur with navy stripes, cyan cheek sparks, cyan / ice eyes; Thundrix inverts to navy with yellow bolts, a
// storm-cloud mane and feathered wings. Glowing bits (cheeks, bolts) live in the `fx` part.
import { Canvas, mix, hash3 } from './rig.js';
import { eyes, legs4, ear, patch, shadeBody, INK } from './parts.js';
import { wingWeb } from './parts.js';

const SH = (on, a, b) => (on ? b : a);
const SPARK = 0x6ae8ff, SPARK2 = 0xe8fcff, BOLT = 0xfff07a, BOLT2 = 0xffd23a;

/** zig-zag lightning bolt in the y/z plane (x thickness w) from (x, y, z), `n` segments, step (dy, dz) */
function bolt(c, x, y, z, n, dy, dz, w, col, edge) {
  let Y = y, Z = z;
  for (let i = 0; i < n; i++) {
    const zig = i % 2 ? 1.6 : -1.6;
    const Y2 = Y + dy, Z2 = Z + dz + zig;
    c.tube([x, Y, Z], [x, Y2, Z2], w, w * 0.85, col);
    Y = Y2; Z = Z2;
  }
  if (edge) c.shade((X, Yy, Zz, cc) => (cc === col && hash3(X, Yy, Zz, 3) < 0.25 ? edge : null));
}

// ------------------------------------------------------------------------------------------------ Sparkit (≈ 1.1 m)
export function sparkit(o = {}) {
  const FUR = SH(o.shiny, 0xffd23e, 0xffb0d8), CREAM = 0xfff6d6, NAVY = 0x2d3a7c, EARIN = 0xff9d5a, COPPER = 0xe08a3c;
  const c = new Canvas(20, 22, 22), ox = c.ox, oz = c.oz;
  c.part('body').rbox(ox, 5.0, oz - 1, 2.9, 2.6, 3.4, FUR, 2.6);
  patch(c, ox, 4.4, oz + 1.4, 2.0, 2.0, 1.6, CREAM);
  c.shade((x, y, z, col) => (y >= 6 && (Math.abs(z - (oz - 2)) < 0.6 || Math.abs(z - (oz - 4)) < 0.6) ? NAVY : null));
  shadeBody(c, 2, 8);
  c.joint('body', [ox, 3, oz]);
  legs4(c, { xOff: 0.8, zF: oz + 1, zB: oz - 3.5, len: 3, top: 5, w: 2, d: 2, col: FUR, paw: NAVY });
  c.part('head').rbox(ox, 9.8, oz + 2.6, 3.9, 3.4, 3.3, FUR, 3.2);
  c.rbox(ox, 8.2, oz + 5.6, 1.6, 1.1, 1.0, CREAM, 3);
  shadeBody(c, 7, 13, 0.1);
  c.set(ox - 1, 9, oz + 6, INK).set(ox, 9, oz + 6, INK);
  eyes(c, 2, 9, 2, 3, { iris: 0x3a3a8a });
  // copper collar + navy forehead chevron
  c.box(ox - 3, 6, oz + 1, ox + 2, 6, oz + 3, COPPER);
  c.front(ox - 1, 13, NAVY); c.front(ox, 13, NAVY);
  ear(c, ox - 2.0, 12.6, oz + 1.6, 2.6, 2, 8, FUR, EARIN, NAVY, -1, 0.3);
  ear(c, ox + 2.0, 12.6, oz + 1.6, 2.6, 2, 8, FUR, EARIN, NAVY, +1, 0.3);
  c.joint('head', [ox, 7, oz + 2], 'body');
  // glowing cheek sparks
  c.part('fx');
  for (const s of [-1, 1]) { const x = s < 0 ? ox - 4 : ox + 3; c.set(x, 8, oz + 4, SPARK).set(x, 9, oz + 4, SPARK).set(x, 8, oz + 3, SPARK).set(x, 9, oz + 3, SPARK2); }
  c.joint('fx', [ox, 8.5, oz + 3.5], 'head');
  // lightning-bolt tail
  c.part('tail');
  bolt(c, ox, 5.5, oz - 4.2, 3, 2.2, -0.6, 0.85, FUR);
  c.set(ox, 12, oz - 5, NAVY).set(ox - 1, 12, oz - 5, NAVY).set(ox, 12, oz - 6, NAVY);
  c.joint('tail', [ox, 5.5, oz - 4], 'body');
  return c.build('quadruped');
}

// ------------------------------------------------------------------------------------------------ Voltail (≈ 1.9 m)
export function voltail(o = {}) {
  const FUR = SH(o.shiny, 0xffc935, 0xc8f070), STRIPE = 0x2b3576, CREAM = 0xfff4d2;
  const c = new Canvas(26, 26, 36), ox = c.ox, oz = c.oz;
  c.part('body').rbox(ox, 9.2, oz - 1.5, 3.0, 2.5, 5.6, FUR, 3);
  c.tube([ox, 10, oz + 3], [ox, 13.4, oz + 5], 2.1, 2.0, FUR);
  c.ellipsoid(ox, 10, oz + 3.8, 2.4, 2.4, 1.8, CREAM);
  patch(c, ox, 7.4, oz - 1, 2.2, 1.0, 4.6, CREAM);
  c.shade((x, y, z, col) => (col === FUR && y >= 9 && [-5, -2.6, -0.2, 2].some((d) => Math.abs(z - (oz + d) - (y - 9) * 0.3) < 0.7) ? STRIPE : null));
  shadeBody(c, 6, 14);
  c.joint('body', [ox, 7, oz]);
  legs4(c, { xOff: 1.0, zF: oz + 2.2, zB: oz - 5.5, len: 7, top: 9, w: 2, d: 2, col: FUR, paw: STRIPE, pawH: 2 });
  c.part('head').rbox(ox, 15.2, oz + 5.8, 3.6, 3.0, 3.2, FUR, 3.2);
  c.rbox(ox, 13.8, oz + 9.2, 1.7, 1.2, 1.6, CREAM, 3);
  shadeBody(c, 12, 19, 0.1);
  c.set(ox - 1, 14, oz + 11, INK).set(ox, 14, oz + 11, INK);
  eyes(c, 2, 15, 2, 2, { iris: 0x3ae0ff, brow: STRIPE });
  c.front(ox - 1, 18, STRIPE); c.front(ox, 18, STRIPE); c.front(ox - 1, 17, STRIPE);
  ear(c, ox - 2.4, 17.6, oz + 4.4, 2.8, 2, 7, FUR, 0xff9d5a, STRIPE, -1, 0.45);
  ear(c, ox + 2.4, 17.6, oz + 4.4, 2.8, 2, 7, FUR, 0xff9d5a, STRIPE, +1, 0.45);
  c.joint('head', [ox, 12.5, oz + 4], 'body');
  // whip tail with navy rings, glowing bolt at the tip
  c.part('tail');
  c.tube([ox, 10, oz - 6.8], [ox, 13, oz - 10.5], 1.0, 0.9, FUR);
  c.tube([ox, 13, oz - 10.5], [ox, 17, oz - 11.5], 0.9, 0.8, FUR);
  c.shade((x, y, z, col) => ((y + z) % 3 === 0 ? STRIPE : null));
  c.joint('tail', [ox, 10, oz - 6.5], 'body');
  c.part('fx');
  bolt(c, ox, 17.5, oz - 11.5, 3, 2.0, -0.5, 1.0, BOLT, BOLT2);
  c.joint('fx', [ox, 17, oz - 11.5], 'tail');
  return c.build('quadruped');
}

// ------------------------------------------------------------------------------------------------ Thundrix (≈ 3 m)
export function thundrix(o = {}) {
  const NAVY = SH(o.shiny, 0x2f3f8c, 0x4a4a5a), NAVY2 = SH(o.shiny, 0x222d6a, 0x34343e), WHITE = 0xe8ecff, YEL = 0xffd03a, CLOUD = 0xaeb6d8, CLOUDD = 0x6c7499, FEATHER = 0x3a3f7a, CLAW = 0xfff0b0;
  const c = new Canvas(52, 36, 46), ox = c.ox, oz = c.oz;
  c.part('body').rbox(ox, 13.8, oz - 1.5, 5.6, 4.6, 8.2, NAVY, 3);
  c.tube([ox, 15.5, oz + 5], [ox, 20.5, oz + 8], 3.6, 3.2, NAVY);
  c.ellipsoid(ox, 15.2, oz + 6.2, 4.6, 5.0, 3.4, WHITE);
  // yellow lightning flank stripes
  c.shade((x, y, z, col) => { if (col !== NAVY) return null; const zz = ((z - oz + 40) % 6), k = Math.abs(zz - 3 - (y - 14) * 0.8); return k < 0.8 && y > 11 && y < 18 && Math.abs(x + 0.5 - ox) > 3.6 ? YEL : null; });
  shadeBody(c, 9, 21);
  c.joint('body', [ox, 12, oz]);
  legs4(c, { xOff: 1.6, zF: oz + 3, zB: oz - 7, len: 11, top: 13, w: 4, d: 4, col: NAVY, paw: NAVY2, pawH: 2 });
  for (const [nm, s, z] of [['legBR', -1, oz - 5], ['legBL', 1, oz - 5], ['legFR', -1, oz + 5], ['legFL', 1, oz + 5]]) {
    c.part(nm); c.ellipsoid(ox + s * 4.0, 11.0, z, 2.8, 4.0, 3.2, NAVY);
    const x0 = s < 0 ? ox - 6 : ox + 2, zt = nm.includes('F') ? oz + 7 : oz - 3;
    for (const i of [0, 2]) c.set(x0 + i + (s < 0 ? 0 : 1), 0, zt, CLAW);
  }
  // head: white muzzle mask, ice eyes, antenna ears with bolt tips
  c.part('head').rbox(ox, 23.8, oz + 10, 4.9, 4.1, 4.4, NAVY, 3.2);
  c.rbox(ox, 21.8, oz + 14.6, 2.6, 1.9, 2.5, WHITE, 3);
  patch(c, ox, 22.4, oz + 12.4, 4.6, 2.0, 3, WHITE);
  shadeBody(c, 19, 29, 0.12);
  c.set(ox - 1, 22, oz + 16, INK).set(ox, 22, oz + 16, INK);
  c.set(ox - 2, 20, oz + 16, 0xffffff).set(ox + 1, 20, oz + 16, 0xffffff);
  eyes(c, 2, 24, 2, 2, { iris: 0x5ef0ff, brow: YEL });
  for (const s of [-1, 1]) { c.tube([ox + s * 2.6, 27, oz + 9], [ox + s * 5.2, 32, oz + 6.5], 0.9, 0.5, NAVY); }
  // storm-cloud mane
  for (const [x, y, z, r] of [[0, 27.5, 6.5, 2.6], [-3.6, 25, 6, 2.4], [3.6, 25, 6, 2.4], [-4.4, 21.5, 5.5, 2.2], [4.4, 21.5, 5.5, 2.2], [0, 24, 4.5, 2.8]])
    c.sphere(ox + x, y, oz + z, r, (X, Y, Z) => (Y < y - r * 0.3 ? CLOUDD : hash3(X, Y, Z, 4) < 0.2 ? 0xd0d6ee : CLOUD));
  c.joint('head', [ox, 21, oz + 7], 'body');
  // fx: glowing bolt tips on the antennae + sparks in the cloud mane
  c.part('fx');
  for (const s of [-1, 1]) { bolt(c, ox + s * 5.4, 32, oz + 6.4, 2, 1.6, -0.3, 0.7, BOLT, BOLT2); }
  for (const [x, y, z] of [[-2, 29, 6], [2.5, 27, 7.5], [-4.6, 24, 7.6], [4.8, 23, 7.4]]) c.set(ox + x, y, oz + z, BOLT);
  c.joint('fx', [ox, 27, oz + 7], 'head');
  // feathered wings: navy root -> feather blue -> yellow tips
  c.part('wingR');
  const sh0 = [ox - 5, 19.5, oz + 1], wr = [ox - 11.5, 25.5, oz - 1.5];
  c.tube(sh0, wr, 1.6, 1.3, NAVY);
  wingWeb(c, wr, [[-21, 31, -4], [-22.5, 26.5, -5], [-21, 22, -5.5], [-18, 18.5, -5], [-14, 16.5, -4]].map(([a, b, d]) => [ox + a, b, oz + d]), (t) => (t < 0.3 ? NAVY : t < 0.82 ? FEATHER : YEL));
  [[-21, 31, -4], [-22.5, 26.5, -5], [-21, 22, -5.5], [-18, 18.5, -5], [-14, 16.5, -4]].forEach(([fx, fy, fz], i) => {
    const tip = [ox + fx, fy, oz + fz], L = Math.hypot(tip[0] - wr[0], tip[1] - wr[1], tip[2] - wr[2]);
    for (let t = 0; t <= 1; t += 0.5 / L) {
      const P = [0, 1, 2].map((k) => wr[k] + (tip[k] - wr[k]) * t), r = 2.2 * (1 - t * 0.5) + (i === 0 ? 0.2 : 0);
      c.ellipsoid(P[0], P[1], P[2], r, r, 0.9, t < 0.3 ? NAVY : t < 0.82 ? FEATHER : YEL);
    }
  });
  c.sphere(wr[0], wr[1], wr[2], 1.6, YEL);
  c.joint('wingR', [ox - 4.5, 19.5, oz + 1], 'body');
  c.mirrorPart('wingR', 'wingL');
  // tail ending in a bolt
  c.part('tail');
  c.tube([ox, 15, oz - 9], [ox, 17, oz - 15], 2.0, 1.4, NAVY);
  c.joint('tail', [ox, 15, oz - 8.5], 'body');
  c.part('tail2');
  bolt(c, ox, 17.5, oz - 15.5, 3, 2.2, -0.8, 1.2, YEL, 0xfff6c0);
  c.joint('tail2', [ox, 17, oz - 15], 'tail');
  return c.build('quadruped');
}
void mix;
