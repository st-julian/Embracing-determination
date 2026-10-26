// mt/voxel/models/fire.js — fire line: Cindle (ember fox kit) -> Pyrovix (triple-tail flame fox) -> Infernyx
// (winged blaze fox, fire/wind). Owner: voxel character design. Identity kept from the sprite art: orange -> red fur,
// cream chest/muzzle, dark paws + ear tips, gold eyes, flame tails / mane, pale-gold wings with wind-teal tips.
import { Canvas, scale, mix } from './rig.js';
import { eyes, legs4, ear, flame, patch, shadeBody, INK, FIRE } from './parts.js';
import { wingWeb } from './parts.js';

const SHINY = (on, c, s) => (on ? s : c);

// ------------------------------------------------------------------------------------------------ Cindle (≈ 1.2 m)
export function cindle(o = {}) {
  const sh = !!o.shiny;
  const FUR = SHINY(sh, 0xf06a2a, 0xf2b84a), DARK = 0x5a3448, CREAM = 0xfff0d2, EARIN = 0xffb85a, NOSE = 0x3a2030;
  const c = new Canvas(18, 19, 22), ox = c.ox, oz = c.oz;
  // body: a round little loaf
  c.part('body').rbox(ox, 5.2, oz - 1.2, 3.1, 2.5, 4.0, FUR, 3);
  patch(c, ox, 4.8, oz + 2.4, 2.2, 2.2, 1.8, CREAM);
  shadeBody(c, 2, 8);
  c.joint('body', [ox, 3, oz]);
  legs4(c, { xOff: 0.9, zF: oz + 1, zB: oz - 4, len: 3, top: 5, w: 2, d: 2, col: FUR, paw: DARK });
  // head: oversized, soft cube
  c.part('head').rbox(ox, 10.2, oz + 3.0, 4.0, 3.5, 3.5, FUR, 3.2);
  patch(c, ox, 8.0, oz + 5.6, 3.6, 2.0, 2.2, CREAM);                 // cheeks / lower face
  c.rbox(ox, 8.4, oz + 6.6, 1.7, 1.2, 1.1, CREAM, 3);                // muzzle
  shadeBody(c, 7, 14, 0.12);
  c.set(ox - 1, 9, oz + 7, NOSE).set(ox, 9, oz + 7, NOSE);
  eyes(c, 2, 9, 2, 3, { iris: 0xc8501c });
  // blush
  c.front(ox - 4, 8, 0xff9a7a); c.front(ox + 3, 8, 0xff9a7a);
  ear(c, ox - 2.6, 13, oz + 1, 3.2, 2, 5, FUR, EARIN, DARK, -1, 0.3);
  ear(c, ox + 2.6, 13, oz + 1, 3.2, 2, 5, FUR, EARIN, DARK, +1, 0.3);
  c.set(ox - 1, 13, oz + 4, mix(FUR, 0xffd23a, 0.5)).set(ox, 13, oz + 4, mix(FUR, 0xffd23a, 0.5));   // forehead ember
  c.joint('head', [ox, 7, oz + 2], 'body');
  // fluffy tail curling up behind, flame tip
  c.part('tail');
  c.tube([ox, 5.5, oz - 4.5], [ox, 7.5, oz - 7.2], 1.5, 2.1, FUR);
  c.tube([ox, 7.5, oz - 7.2], [ox, 10.5, oz - 7.6], 2.1, 2.2, FUR);
  patch(c, ox, 11.5, oz - 7.6, 2.4, 1.6, 2.4, 0xffd27a);
  c.joint('tail', [ox, 6, oz - 4], 'body');
  c.part('fx');
  flame(c, ox, 12, oz - 7.6, 5, 1.7, FIRE, [0, -0.15], 11);
  c.joint('fx', [ox, 12, oz - 7.5], 'tail');
  return c.build('quadruped');
}

// ------------------------------------------------------------------------------------------------ Pyrovix (≈ 1.9 m)
export function pyrovix(o = {}) {
  const sh = !!o.shiny;
  const FUR = SHINY(sh, 0xe0482a, 0xf0a030), BACK = SHINY(sh, 0xb02c2c, 0xc87a22), CREAM = 0xffe6bc, DARK = 0x4a2c44, GOLD = 0xffc23c;
  const c = new Canvas(24, 26, 32), ox = c.ox, oz = c.oz;
  c.part('body').rbox(ox, 9.4, oz - 1.6, 3.3, 2.8, 5.6, FUR, 3);
  c.tube([ox, 10.4, oz + 3.2], [ox, 13.6, oz + 5.2], 2.4, 2.2, FUR);      // neck
  c.ellipsoid(ox, 10.6, oz + 4.2, 2.8, 2.8, 2.1, CREAM);                 // chest ruff
  for (const s of [-1, 1]) c.box(ox + (s < 0 ? -3 : 2), 9, oz + 5, ox + (s < 0 ? -2 : 3), 10, oz + 5, CREAM);
  c.shade((x, y, z, col) => (y >= 11 && col === FUR && z < oz + 3 ? BACK : null));
  shadeBody(c, 6, 15);
  c.joint('body', [ox, 7, oz]);
  legs4(c, { xOff: 1.1, zF: oz + 2, zB: oz - 6, len: 7, top: 9, w: 2, d: 2, col: FUR, paw: DARK, pawH: 2 });
  // haunches
  for (const [nm, s] of [['legBR', -1], ['legBL', 1]]) { c.part(nm); c.ellipsoid(ox + s * 2.4, 8.2, oz - 5, 1.5, 2.4, 2.2, FUR); }
  c.part('head').rbox(ox, 16.4, oz + 6.6, 4.2, 3.6, 3.8, FUR, 3.2);
  c.rbox(ox, 14.8, oz + 10.8, 2.0, 1.4, 2.0, FUR, 3);                    // snout
  patch(c, ox, 14.0, oz + 10.0, 4.0, 1.4, 3.8, CREAM);                    // lower jaw / cheeks
  for (const s of [-1, 1]) c.tube([ox + s * 3.6, 14.6, oz + 7.5], [ox + s * 5.4, 14.2, oz + 4.6], 1.2, 0.6, CREAM);   // cheek fluff
  shadeBody(c, 12, 21, 0.12);
  c.set(ox - 1, 15, oz + 13, INK).set(ox, 15, oz + 13, INK);
  eyes(c, 2, 16, 2, 2, { iris: 0xffb020, brow: DARK });
  ear(c, ox - 2.6, 19.5, oz + 4.8, 3.2, 2, 6, FUR, GOLD, DARK, -1, 0.4);
  ear(c, ox + 2.6, 19.5, oz + 4.8, 3.2, 2, 6, FUR, GOLD, DARK, +1, 0.4);
  c.joint('head', [ox, 13, oz + 4], 'body');
  c.part('fx');
  flame(c, ox, 19.5, oz + 5.0, 6, 2.0, FIRE, [0, -0.32], 21, 1);
  flame(c, ox, 16, oz + 2.6, 4, 1.5, FIRE, [0, -0.3], 22, 0);
  c.joint('fx', [ox, 18, oz + 5], 'head');
  // three tails fanning up behind
  c.part('tail');
  for (const [dx, h] of [[-4.6, 14.5], [0, 17], [4.6, 14.5]]) c.tube([ox, 10, oz - 6.5], [ox + dx, h, oz - 10.5], 1.5, 2.1, FUR);
  patch(c, ox, 15, oz - 10.5, 7.5, 2.4, 2.6, mix(FUR, 0xffd27a, 0.55), true);
  c.joint('tail', [ox, 10, oz - 6], 'body');
  c.part('tail2');
  for (const [dx, h] of [[-4.6, 15.8], [0, 18.4], [4.6, 15.8]]) flame(c, ox + dx, h, oz - 10.6, 5, 1.7, FIRE, [dx * 0.05, -0.12], 30 + h, 0);
  c.joint('tail2', [ox, 16, oz - 10.5], 'tail');
  return c.build('quadruped');
}

// ------------------------------------------------------------------------------------------------ Infernyx (≈ 3 m)
export function infernyx(o = {}) {
  const sh = !!o.shiny;
  const FUR = SHINY(sh, 0xcc3a2e, 0xe89a2a), BACK = SHINY(sh, 0x98242e, 0xb06a1e), CREAM = 0xffdc94, DARK = 0x3a2638, GOLD = 0xffc23a;
  const WING = 0xffe9ae, WIND = 0x7eeedc;
  const c = new Canvas(48, 34, 46), ox = c.ox, oz = c.oz;
  // powerful barrel body, broad chest
  c.part('body').rbox(ox, 13.6, oz - 1.5, 5.8, 4.8, 8.2, FUR, 3);
  c.tube([ox, 15.5, oz + 5], [ox, 20.5, oz + 8], 3.8, 3.4, FUR);          // neck
  c.ellipsoid(ox, 15.2, oz + 6.2, 4.8, 5.0, 3.4, CREAM);                  // chest
  c.shade((x, y, z, col) => (y >= 16.5 && col === FUR && z < oz + 4 ? BACK : null));
  // spine plates (gold)
  for (let i = 0; i < 4; i++) c.box(ox - 1, 18 - (i > 2 ? 1 : 0), oz + 1 - i * 3, ox, 19 - (i > 2 ? 1 : 0), oz + 1 - i * 3, GOLD);
  shadeBody(c, 9, 22);
  c.joint('body', [ox, 12, oz]);
  legs4(c, { xOff: 1.6, zF: oz + 3, zB: oz - 7, len: 11, top: 13, w: 4, d: 4, col: FUR, paw: DARK, pawH: 2 });
  for (const [nm, s, z] of [['legBR', -1, oz - 5], ['legBL', 1, oz - 5], ['legFR', -1, oz + 5], ['legFL', 1, oz + 5]]) {
    c.part(nm); c.ellipsoid(ox + s * 4.0, 11.0, z, 2.8, 4.0, 3.2, FUR);   // shoulders / haunches
    const x0 = s < 0 ? ox - 6 : ox + 2, zt = nm.includes('F') ? oz + 7 : oz - 3;
    for (const i of [0, 2]) c.set(x0 + i + (s < 0 ? 0 : 1), 0, zt, GOLD);   // gold claws
  }
  // head
  c.part('head').rbox(ox, 24.0, oz + 10, 5.2, 4.3, 4.6, FUR, 3.2);
  c.rbox(ox, 22.0, oz + 15.0, 2.7, 2.0, 2.6, FUR, 3);                     // snout
  patch(c, ox, 21.0, oz + 14.0, 4.6, 1.5, 4.4, CREAM);                    // jaw
  for (const s of [-1, 1]) c.tube([ox + s * 4.6, 22.0, oz + 10.5], [ox + s * 7.0, 21.2, oz + 7.2], 1.6, 0.7, CREAM);   // cheek ruffs
  shadeBody(c, 19, 29, 0.12);
  c.set(ox - 1, 23, oz + 17, INK).set(ox, 23, oz + 17, INK);
  c.set(ox - 2, 20, oz + 17, 0xffffff).set(ox + 1, 20, oz + 17, 0xffffff);   // fangs
  eyes(c, 2, 24, 2, 2, { iris: GOLD, brow: DARK });
  ear(c, ox - 3.0, 27.5, oz + 8.4, 3.6, 2, 7, FUR, GOLD, DARK, -1, 0.5);
  ear(c, ox + 3.0, 27.5, oz + 8.4, 3.6, 2, 7, FUR, GOLD, DARK, +1, 0.5);
  for (const s of [-1, 1]) c.tube([ox + s * 2.2, 27.0, oz + 12.6], [ox + s * 3.8, 29.8, oz + 9.6], 0.8, 0.55, GOLD);   // horns
  c.joint('head', [ox, 21, oz + 7], 'body');
  // blazing mane
  c.part('fx');
  flame(c, ox, 27, oz + 6.6, 7, 2.6, FIRE, [0, -0.4], 41, 1);
  flame(c, ox - 3.2, 23, oz + 5.6, 6, 2.0, FIRE, [-0.2, -0.4], 42, 0);
  flame(c, ox + 3.2, 23, oz + 5.6, 6, 2.0, FIRE, [0.2, -0.4], 43, 0);
  flame(c, ox, 20, oz + 3.2, 6, 2.3, FIRE, [0, -0.45], 44, 0);
  c.joint('fx', [ox, 24, oz + 7], 'head');
  // wings (right modelled, mirrored): a chunky arm + five broad flame-feathers fanning from the wrist,
  // red at the root -> orange -> pale gold -> wind-teal tips
  c.part('wingR');
  const sh0 = [ox - 5, 19.5, oz + 1], wr = [ox - 11.5, 25.5, oz - 1.5];
  c.tube(sh0, wr, 1.6, 1.3, FUR);
  const feathers = [[-21, 30.5, -4], [-22, 26, -5], [-20.5, 21.5, -5.5], [-17.5, 18, -5], [-13.5, 16.5, -4]];
  wingWeb(c, wr, feathers.map(([fx, fy, fz]) => [ox + fx, fy, oz + fz]), (t) => (t < 0.3 ? FUR : t < 0.52 ? 0xff8a2a : t < 0.82 ? WING : WIND));
  feathers.forEach(([fx, fy, fz], i) => {
    const tip = [ox + fx, fy, oz + fz], L = Math.hypot(tip[0] - wr[0], tip[1] - wr[1], tip[2] - wr[2]);
    for (let t = 0; t <= 1; t += 0.5 / L) {
      const P = [wr[0] + (tip[0] - wr[0]) * t, wr[1] + (tip[1] - wr[1]) * t, wr[2] + (tip[2] - wr[2]) * t];
      const r = 2.3 * (1 - t * 0.5) + (i === 0 ? 0.2 : 0);
      const col = t < 0.3 ? FUR : t < 0.52 ? 0xff8a2a : t < 0.82 ? WING : WIND;
      c.ellipsoid(P[0], P[1], P[2], r, r, 0.9, col);
    }
  });
  c.sphere(wr[0], wr[1], wr[2], 1.6, GOLD);
  c.joint('wingR', [ox - 4.5, 19.5, oz + 1], 'body');
  c.mirrorPart('wingR', 'wingL');
  // long tail with a blazing tip
  c.part('tail');
  c.tube([ox, 15, oz - 9], [ox, 16.5, oz - 14.5], 2.4, 1.9, FUR);
  c.joint('tail', [ox, 15, oz - 8.5], 'body');
  c.part('tail2');
  c.tube([ox, 16.5, oz - 14.5], [ox, 19.5, oz - 19.5], 1.9, 1.4, FUR);
  flame(c, ox, 20.5, oz - 20.2, 6, 2.0, FIRE, [0, -0.45], 51, 0);
  c.joint('tail2', [ox, 16.5, oz - 14.5], 'tail');
  return c.build('quadruped');
}
