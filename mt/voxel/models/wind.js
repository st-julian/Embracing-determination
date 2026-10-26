// mt/voxel/models/wind.js — wind line: Zephlet (cloud-puff chick) -> Galeon (masked sky hawk) -> Tempestral (storm
// roc, wind/water). Owner: voxel character design. Identity from the sprite art: white fluff with sky-blue tips and a
// sunny beak; Galeon's sky-blue back, white belly and dark mask; Tempestral's royal blue, aqua plumes and gold crest.
// Rig: 'flyer' — body, head, wingL/wingR (shoulder joints), legL/legR (hips), tail; Tempestral's water orbs are `fx`.
import { Canvas, mix, hash3 } from './rig.js';
import { eyes, patch, shadeBody, INK, wingWeb } from './parts.js';

const SH = (on, a, b) => (on ? b : a);

/** a fan of feather "paddles" from a root point: each [dx, dy, dz, width] relative, colours by t (root -> tip) */
function featherFan(c, root, list, pick, thick = 0.8) {
  wingWeb(c, root, list.map(([dx, dy, dz]) => [root[0] + dx, root[1] + dy, root[2] + dz]), pick, 0.84);
  for (const [dx, dy, dz, w] of list) {
    const tip = [root[0] + dx, root[1] + dy, root[2] + dz], L = Math.hypot(dx, dy, dz);
    for (let t = 0; t <= 1; t += 0.45 / L) {
      const P = [0, 1, 2].map((k) => root[k] + (tip[k] - root[k]) * t), r = w * (1 - t * 0.55);
      c.ellipsoid(P[0], P[1], P[2], r, r, thick, pick(t));
    }
  }
}
/** taloned bird legs: legR / legL, short shank + 3 toes */
function birdLegs(c, xOff, hip, col, claw, zc, pants = null, pantsTo = 0) {
  for (const [nm, s] of [['legR', -1], ['legL', 1]]) {
    c.part(nm);
    const x = c.ox + s * xOff;
    c.tube([x, hip, zc], [x, 1.2, zc + 0.4], 0.9, 0.8, col);
    if (pants) c.tube([x, hip + 1, zc - 0.4], [x, pantsTo, zc], 2.0, 1.4, pants);
    for (const d of [-1, 0, 1]) { c.tube([x, 0.8, zc + 0.4], [x + d * 1.3, 0.6, zc + 2.4], 0.7, 0.6, col); c.set(x + d * 1.3, 0, zc + 2.8, claw); c.set(x + d * 1.3, 1, zc + 2.8, claw); }
    c.joint(nm, [x, hip, zc], 'body');
  }
}

// ------------------------------------------------------------------------------------------------ Zephlet (≈ 1 m)
export function zephlet(o = {}) {
  const FLUFF = SH(o.shiny, 0xf4f8ff, 0xfff0c8), SKY = SH(o.shiny, 0x9fd2ff, 0xffc0d8), BEAK = 0xffc23a, FEET = 0xff9a3a, CHEEK = 0xffb0c8;
  const c = new Canvas(22, 17, 20), ox = c.ox, oz = c.oz;
  c.part('body').rbox(ox, 5.6, oz, 3.7, 3.5, 3.5, FLUFF, 2.2);
  c.shade((x, y, z, col) => (hash3(x, y, z, 3) < 0.12 ? 0xe2ecfa : null));
  shadeBody(c, 2, 9, 0.12);
  c.joint('body', [ox, 3, oz]);
  c.part('head').rbox(ox, 10.2, oz + 0.8, 3.4, 3.0, 3.1, FLUFF, 2.4);
  // sky-blue curl crest
  for (const [x, z, h, lean] of [[0, 0, 3, 0.4], [-1.4, -0.6, 2, -0.5], [1.4, -0.6, 2, 0.5]])
    for (let k = 0; k < h; k++) c.ellipsoid(ox + x + lean * k, 13 + k, oz + 0.8 + z - k * 0.4, 0.9, 0.6, 0.9, k === h - 1 ? mix(SKY, 0x5aa8f0, 0.5) : SKY);
  c.rbox(ox, 9.2, oz + 4.2, 1.1, 0.7, 0.9, BEAK, 2);
  shadeBody(c, 7, 14, 0.08);
  eyes(c, 3, 10, 2, 2, { iris: 0x1c2a5a, zFrom: oz + 3 });
  c.front(ox - 4, 9, CHEEK); c.front(ox + 3, 9, CHEEK);
  c.joint('head', [ox, 8, oz + 0.5], 'body');
  for (const [nm, s] of [['wingR', -1], ['wingL', 1]]) {
    c.part(nm).ellipsoid(ox + s * 4.0, 6.4, oz - 0.4, 0.9, 2.2, 2.4, FLUFF);
    c.shade((x, y, z, col) => (y <= 5 || z <= oz - 2 ? SKY : null));
    c.joint(nm, [ox + s * 3.2, 7.6, oz], 'body');
  }
  for (const [nm, s] of [['legR', -1], ['legL', 1]]) { c.part(nm).box(ox + (s < 0 ? -2 : 1), 0, oz, ox + (s < 0 ? -2 : 1), 2, oz, FEET); c.box(ox + (s < 0 ? -3 : 0), 0, oz + 1, ox + (s < 0 ? -1 : 2), 0, oz + 1, FEET); c.joint(nm, [ox + (s < 0 ? -1.5 : 1.5), 2.5, oz], 'body'); }
  c.part('tail');
  for (const d of [-1, 0, 1]) c.tube([ox, 5.5, oz - 3], [ox + d * 1.2, 7.2, oz - 5.2], 0.8, 0.6, SKY);
  c.joint('tail', [ox, 5.5, oz - 3], 'body');
  return c.build('flyer');
}

// ------------------------------------------------------------------------------------------------ Galeon (≈ 1.8 m)
export function galeon(o = {}) {
  const SKY = SH(o.shiny, 0x4a9ee8, 0x6ac8a0), SKYD = SH(o.shiny, 0x2f6cc0, 0x3a9a78), WHITE = 0xf2f6ff, MASK = 0x26306a, BEAK = 0xffc23a, TALON = 0xffb43a, TIP = 0x1e2a5a;
  const c = new Canvas(40, 24, 32), ox = c.ox, oz = c.oz;
  c.part('body').rbox(ox, 9.6, oz, 3.4, 3.8, 4.6, SKY, 2.4);
  patch(c, ox, 8.4, oz + 2.4, 2.8, 3.2, 2.4, WHITE);
  c.shade((x, y, z, col) => (col === SKY && y >= 12 ? SKYD : null));
  shadeBody(c, 5, 14);
  c.joint('body', [ox, 6, oz]);
  birdLegs(c, 1.6, 6.5, TALON, MASK, oz + 0.5, 0x2f6cc0, 4.2);
  c.part('head').rbox(ox, 15.6, oz + 2.6, 3.2, 3.0, 3.2, SKY, 2.6);
  patch(c, ox, 14.4, oz + 4.6, 2.6, 1.6, 1.6, WHITE);
  c.shade((x, y, z, col) => (y >= 15 && y <= 16 && z >= oz + 1 && col !== WHITE ? MASK : null));
  c.tube([ox, 15.2, oz + 5.4], [ox, 13.6, oz + 7.4], 0.95, 0.5, BEAK);         // hooked beak
  shadeBody(c, 12, 19, 0.08);
  eyes(c, 2, 15, 2, 2, { iris: 0xffd040, zFrom: oz + 5 });
  for (const s of [-1, 1]) c.tube([ox + s * 1.2, 17.6, oz + 1], [ox + s * 2.4, 19.8, oz - 3.6], 0.7, 0.4, SKYD);   // crest plumes
  c.joint('head', [ox, 13, oz + 1.5], 'body');
  // half-spread wings (right, mirrored)
  c.part('wingR');
  const root = [ox - 3.4, 12, oz - 0.5];
  c.tube(root, [ox - 8, 14.5, oz - 1.5], 1.4, 1.2, SKY);
  featherFan(c, [ox - 8, 14.5, oz - 1.5], [[-9.5, 3.5, -3, 1.8], [-10, 0, -4, 1.7], [-8.5, -3.2, -4.2, 1.6], [-6, -5, -3.5, 1.4]], (t) => (t < 0.3 ? SKY : t < 0.78 ? SKYD : TIP));
  c.joint('wingR', [ox - 3, 12, oz - 0.5], 'body');
  c.mirrorPart('wingR', 'wingL');
  c.part('tail');
  for (const s of [-1, 1]) c.tube([ox, 8.4, oz - 4], [ox + s * 2.4, 6.4, oz - 11], 1.1, 0.5, SKYD), c.set(ox + s * 2.4, 6, oz - 11, TIP);
  c.tube([ox, 8.6, oz - 4], [ox, 7.6, oz - 8], 1.4, 0.9, SKY);
  c.joint('tail', [ox, 8.5, oz - 3.5], 'body');
  return c.build('flyer');
}

// ------------------------------------------------------------------------------------------------ Tempestral (≈ 3 m)
export function tempestral(o = {}) {
  const BLUE = SH(o.shiny, 0x3456b8, 0x5a3aa8), BLUED = SH(o.shiny, 0x26388a, 0x3a2478), WHITE = 0xeef4ff, AQUA = 0x58e2f0, GOLD = 0xffc23a, TALON = 0x2a2a50, BEAK = 0xffd25a;
  const c = new Canvas(64, 36, 50), ox = c.ox, oz = c.oz;
  c.part('body').rbox(ox, 14.0, oz, 5.6, 5.8, 7.0, BLUE, 2.4);
  patch(c, ox, 12.6, oz + 3.6, 4.6, 5.0, 3.6, WHITE);
  c.shade((x, y, z, col) => (col === BLUE && y >= 18 ? BLUED : null));
  shadeBody(c, 8, 21);
  c.joint('body', [ox, 9, oz]);
  birdLegs(c, 2.4, 10, GOLD, TALON, oz + 1, WHITE, 4.0);
  // proud head: white face, gold crest plume, hooked gold beak, ice eyes
  c.part('head').rbox(ox, 23.4, oz + 4.6, 4.7, 4.2, 4.5, BLUE, 2.6);
  c.tube([ox, 18.5, oz + 3], [ox, 21.5, oz + 4], 3.6, 3.4, BLUE);
  patch(c, ox, 22.4, oz + 7.4, 3.6, 2.6, 2, WHITE);
  c.tube([ox, 23, oz + 8.4], [ox, 21, oz + 11], 1.3, 0.55, BEAK);
  shadeBody(c, 18, 28, 0.1);
  eyes(c, 2, 23, 2, 2, { iris: 0x4af0ff, brow: BLUED, zFrom: oz + 8 });
  for (const [x, h, lean] of [[0, 6, -0.7], [-1.5, 5, -0.8], [1.5, 5, -0.8]])
    for (let k = 0; k < h; k++) c.ellipsoid(ox + x * (1 + k * 0.15), 26.5 + k * 0.9, oz + 4 + lean * k, 0.9, 0.7, 0.9, k > h - 3 ? AQUA : GOLD);
  c.joint('head', [ox, 19, oz + 3], 'body');
  // grand wings: arm + 6 feathers, royal blue -> white -> aqua tips
  c.part('wingR');
  const sh0 = [ox - 4.8, 18, oz + 0.5], wr = [ox - 13, 24, oz - 1.5];
  c.tube(sh0, wr, 1.9, 1.6, BLUE);
  featherFan(c, wr, [[-14, 6, -3, 2.4], [-15.5, 1.5, -4, 2.3], [-15, -3.5, -4.5, 2.2], [-12.5, -7.5, -4.5, 2.1], [-9, -10, -4, 1.9], [-5, -10.5, -3, 1.7]], (t) => (t < 0.28 ? BLUE : t < 0.55 ? BLUED : t < 0.84 ? WHITE : AQUA), 0.9);
  c.sphere(wr[0], wr[1], wr[2], 1.8, GOLD);
  c.joint('wingR', [ox - 4.4, 18, oz + 0.5], 'body');
  c.mirrorPart('wingR', 'wingL');
  // flowing tail plumes
  c.part('tail');
  for (const [dx, dy, len] of [[-3.2, -3, 13], [0, -1.6, 15], [3.2, -3, 13]]) c.tube([ox, 13, oz - 6], [ox + dx, 13 + dy, oz - 6 - len], 1.6, 0.8, BLUE);
  c.shade((x, y, z, col) => (z < oz - 15 ? AQUA : z < oz - 11 ? WHITE : null));
  c.joint('tail', [ox, 13, oz - 6], 'body');
  // fx: floating water orbs at the plume tips
  c.part('fx');
  for (const [dx, dy, len] of [[-3.2, -3, 13], [0, -1.6, 15], [3.2, -3, 13]]) c.sphere(ox + dx * 1.08, 13 + dy - 0.5, oz - 7.5 - len, 1.3, (X, Y, Z) => (Y > 13 + dy ? 0xe8ffff : AQUA));
  c.joint('fx', [ox, 12, oz - 20], 'tail');
  return c.build('flyer');
}
void INK;
