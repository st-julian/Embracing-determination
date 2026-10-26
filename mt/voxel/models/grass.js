// mt/voxel/models/grass.js — grass line: Sproutle (leaf-eared fawn) -> Fernhorn (fern-antlered stag) -> Verdantusk
// (garden-backed mammoth, grass/earth). Owner: voxel character design. Identity from the sprite art: tan -> russet
// fur with cream spots, leaf ears and a head sprout, fern antlers with yellow blossoms, a mossy mammoth with a tree.
import { Canvas, mix, hash3 } from './rig.js';
import { eyes, legs4, leaf, ear, patch, shadeBody, INK } from './parts.js';

const SH = (on, a, b) => (on ? b : a);
const LEAF = 0x5ccf4a, LEAF2 = 0x3fae46, STEM = 0x6a9a3a, VEIN = 0x9ae878;

// ------------------------------------------------------------------------------------------------ Sproutle (≈ 1.2 m)
export function sproutle(o = {}) {
  const FUR = SH(o.shiny, 0xdc9a56, 0xe8c070), CREAM = 0xfff2d0, HOOF = 0x5a3a32;
  const c = new Canvas(22, 20, 22), ox = c.ox, oz = c.oz;
  c.part('body').rbox(ox, 6.2, oz - 1, 2.7, 2.3, 4.0, FUR, 3);
  for (const [x, z] of [[-1, -2], [1, -4], [0, 0], [-2, -3.5], [1.5, -1]]) c.set(ox + x, 8, oz + z, CREAM);   // fawn spots
  patch(c, ox, 4.6, oz + 1, 1.8, 1.2, 3, CREAM);
  shadeBody(c, 4, 9);
  c.joint('body', [ox, 5, oz]);
  legs4(c, { xOff: 0.7, zF: oz + 1, zB: oz - 4, len: 4, top: 6, w: 2, d: 2, col: FUR, paw: HOOF });
  c.part('head').rbox(ox, 10.6, oz + 3.2, 3.7, 3.3, 3.3, FUR, 3.2);
  c.rbox(ox, 9.0, oz + 6.3, 1.7, 1.2, 1.0, CREAM, 3);
  patch(c, ox, 8.8, oz + 5.2, 3.2, 1.6, 2, CREAM);
  shadeBody(c, 7, 14, 0.1);
  c.set(ox - 1, 9, oz + 7, INK).set(ox, 9, oz + 7, INK);
  eyes(c, 2, 10, 2, 3, { iris: 0x3a5a1a });
  c.front(ox - 4, 9, 0xffa08a); c.front(ox + 3, 9, 0xffa08a);
  // leaf ears, sticking out sideways
  for (const s of [-1, 1]) { leaf(c, ox + s * 3.4, 12.2, oz + 2, s, 0.55, 4.5, 2.6, LEAF, LEAF2); }
  c.joint('head', [ox, 8, oz + 2], 'body');
  // the sprout (sways)
  c.part('fx');
  c.tube([ox, 13.6, oz + 3], [ox, 16.2, oz + 3], 0.55, 0.5, STEM);
  leaf(c, ox, 16.4, oz + 3, -1, 0.7, 3.2, 2.2, LEAF, VEIN);
  leaf(c, ox, 16.4, oz + 3, 1, 0.7, 3.2, 2.2, LEAF2, VEIN);
  c.joint('fx', [ox, 14, oz + 3], 'head');
  c.part('tail').ellipsoid(ox, 7.4, oz - 5.2, 1.2, 1.3, 1.0, CREAM);
  c.joint('tail', [ox, 7, oz - 4.5], 'body');
  return c.build('quadruped');
}

// ------------------------------------------------------------------------------------------------ Fernhorn (≈ 2.3 m)
export function fernhorn(o = {}) {
  const FUR = SH(o.shiny, 0xb86e42, 0xd8a24a), BACK = SH(o.shiny, 0x8e4c34, 0xb07a30), CREAM = 0xfff1d0, HOOF = 0x3a2a2a, FLOWER = 0xffd85a, VINE = 0x4aa040;
  const c = new Canvas(28, 26, 32), ox = c.ox, oz = c.oz;
  c.part('body').rbox(ox, 10.6, oz - 1.2, 3.3, 2.8, 5.6, FUR, 3);
  c.tube([ox, 11.4, oz + 3.4], [ox, 15.6, oz + 5.6], 2.3, 2.1, FUR);
  c.ellipsoid(ox, 11.8, oz + 4.2, 2.6, 2.6, 1.9, CREAM);
  c.shade((x, y, z, col) => (y >= 12.5 && col === FUR && z < oz + 3 ? BACK : null));
  for (const [x, z] of [[-1, -1], [1, -3], [0, 1], [-1.5, -5], [1.6, -6]]) c.set(ox + x, 13, oz + z, CREAM);
  shadeBody(c, 7, 17);
  c.joint('body', [ox, 8, oz]);
  legs4(c, { xOff: 1.0, zF: oz + 2.5, zB: oz - 5.5, len: 8, top: 10, w: 2, d: 2, col: FUR, paw: HOOF });
  c.part('legFL');                                                       // vine wrapped round the front-left leg
  for (let y = 1; y < 8; y++) { const a = y * 1.4; const x = Math.round(ox + 2 + Math.cos(a) * 1.4), z = Math.round(oz + 3.5 + Math.sin(a) * 1.4); c.set(x, y, z, VINE); }
  c.part('head').rbox(ox, 17.4, oz + 6.6, 3.3, 3.0, 3.2, FUR, 3.2);
  c.rbox(ox, 16.0, oz + 10.0, 1.7, 1.3, 1.9, FUR, 3);
  patch(c, ox, 15.3, oz + 9.4, 3.2, 1.2, 3.6, CREAM);
  shadeBody(c, 14, 21, 0.1);
  c.set(ox - 1, 16, oz + 12, INK).set(ox, 16, oz + 12, INK);
  eyes(c, 2, 17, 2, 2, { iris: 0xd8a03a, brow: BACK });
  ear(c, ox - 3.4, 18.6, oz + 5.2, 2.6, 2, 4, FUR, CREAM, BACK, -1, 0.7);
  ear(c, ox + 3.4, 18.6, oz + 5.2, 2.6, 2, 4, FUR, CREAM, BACK, +1, 0.7);
  // fern antlers: a curving beam with alternating leaflets and a blossom at the tip
  for (const s of [-1, 1]) {
    const pts = [[ox + s * 1.6, 20, oz + 6], [ox + s * 3.0, 23, oz + 5.4], [ox + s * 4.8, 25.2, oz + 4.4]];
    c.tube(pts[0], pts[1], 0.7, 0.6, 0x6a5a3a); c.tube(pts[1], pts[2], 0.6, 0.5, 0x6a5a3a);
    // fern leaflets on both sides of the beam (darker under, bright on top)
    for (let t = 0.15; t <= 1; t += 0.17) {
      const P = t < 0.5 ? [0, 1, 2].map((i) => pts[0][i] + (pts[1][i] - pts[0][i]) * t * 2) : [0, 1, 2].map((i) => pts[1][i] + (pts[2][i] - pts[1][i]) * (t - 0.5) * 2);
      const L = 2.4 * (1.15 - t * 0.6);
      c.tube(P, [P[0] + s * L, P[1] - 0.4, P[2] + 0.3], 0.55, 0.45, t * 7 % 2 < 1 ? LEAF : LEAF2);
      c.tube(P, [P[0] - s * L * 0.55, P[1] + L * 0.8, P[2] - 0.2], 0.5, 0.4, LEAF2);
    }
    c.set(ox + s * 5.2, 25.6, oz + 4.4, FLOWER).set(ox + s * 5.2 + s, 25.6, oz + 4.4, FLOWER).set(ox + s * 5.2, 26.6 - 1, oz + 5.4, FLOWER).set(ox + s * 5.2, 25.6, oz + 4.4, 0xffffff);
  }
  c.joint('head', [ox, 14, oz + 4], 'body');
  c.part('tail').ellipsoid(ox, 12.4, oz - 7.0, 1.3, 1.6, 1.1, CREAM);
  c.joint('tail', [ox, 12, oz - 6.4], 'body');
  return c.build('quadruped');
}

// ------------------------------------------------------------------------------------------------ Verdantusk (≈ 3.2 m)
export function verdantusk(o = {}) {
  const HIDE = SH(o.shiny, 0x7d6a58, 0x9a8a72), HIDE2 = SH(o.shiny, 0x64503f, 0x7a6a52), MOSS = 0x4c9a3e, MOSS2 = 0x6cbc4a, STONE = 0x9c9a8c, TUSK = 0xefe2c2, BARK = 0x5e4636, PINK = 0xff8cc2, PINKC = 0xffe066;
  const c = new Canvas(40, 34, 46), ox = c.ox, oz = c.oz;
  c.part('body').rbox(ox, 14.0, oz - 1.5, 7.2, 6.4, 9.2, HIDE, 2.6);
  // moss blanket with hanging fringe
  c.shade((x, y, z, col) => { const fr = 17.5 - (hash3(x, 0, z, 9) < 0.35 ? 1.5 : 0) - (hash3(x, 1, z, 9) < 0.12 ? 1.5 : 0); return y >= fr ? (hash3(x, y, z, 4) < 0.22 ? MOSS2 : MOSS) : null; });
  patch(c, ox, 8, oz, 6, 2, 8.6, HIDE2);
  // back garden: bushes, blossoms, mossy stones, a young tree
  for (const [x, z, r] of [[-3.5, -6, 2.2], [3.8, -2, 2.4], [-2.8, 3, 2.0], [2.4, 4.2, 1.6]]) c.sphere(ox + x, 20.6, oz + z, r, (X, Y, Z) => (hash3(X, Y, Z, 2) < 0.18 ? MOSS2 : LEAF2));
  for (const [x, z] of [[-3.6, -6], [4.2, -2], [-2.4, 3.4], [2.6, 4.6], [0.6, -8]]) { c.set(ox + x, 22.6, oz + z, PINK).set(ox + x + 1, 22.6, oz + z, PINK).set(ox + x, 22.6, oz + z + 1, PINK).set(ox + x + 1, 23.6, oz + z, PINKC); }
  c.rbox(ox + 4.6, 20.0, oz - 7, 1.8, 1.3, 1.6, STONE, 3);
  c.rbox(ox - 4.8, 19.6, oz + 0.5, 1.4, 1.1, 1.4, STONE, 3);
  shadeBody(c, 7, 24, 0.12);
  c.joint('body', [ox, 11, oz]);
  c.part('fx');                                                            // the little tree sways
  c.tube([ox + 0.5, 19.5, oz - 2.5], [ox + 0.5, 26.5, oz - 3], 0.9, 0.7, BARK);
  c.sphere(ox + 0.5, 28.6, oz - 3, 3.2, (X, Y, Z) => (hash3(X, Y, Z, 5) < 0.2 ? MOSS2 : Y > 29 ? LEAF : LEAF2));
  c.set(ox + 2, 30, oz - 1, PINK).set(ox - 1, 29, oz - 1, PINK).set(ox + 1, 31, oz - 4, PINK);
  c.joint('fx', [ox + 0.5, 20, oz - 2.5], 'body');
  // pillar legs with stone toenails
  legs4(c, { xOff: 1.8, zF: oz + 3, zB: oz - 8, len: 9, top: 12, w: 5, d: 5, col: HIDE, paw: HIDE2, pawH: 2 });
  for (const [nm, s, z] of [['legFR', -1, oz + 3], ['legFL', 1, oz + 3], ['legBR', -1, oz - 8], ['legBL', 1, oz - 8]]) {
    c.part(nm); const x0 = s < 0 ? Math.floor(ox - 1.8 - 5) : Math.floor(ox + 1.8);
    for (const i of [0, 2, 4]) c.set(x0 + i, 0, z + 5, STONE).set(x0 + i, 1, z + 5, STONE);
  }
  // head: dome, big ears, trunk, sweeping tusks
  c.part('head').rbox(ox, 17.8, oz + 9.2, 5.2, 5.0, 4.2, HIDE, 2.8);
  c.shade((x, y, z, col) => (y >= 21 ? (hash3(x, y, z, 8) < 0.25 ? MOSS2 : MOSS) : null));
  for (const s of [-1, 1]) c.ellipsoid(ox + s * 6.0, 17.2, oz + 7.6, 1.2, 4.0, 3.4, HIDE2);
  c.tube([ox, 15.5, oz + 12.6], [ox, 11.5, oz + 14.6], 2.1, 1.8, HIDE);
  c.tube([ox, 11.5, oz + 14.6], [ox, 7.5, oz + 14.8], 1.8, 1.4, HIDE);
  c.tube([ox, 7.5, oz + 14.8], [ox, 6.6, oz + 16.2], 1.4, 1.2, HIDE2);
  for (const s of [-1, 1]) {
    c.tube([ox + s * 2.8, 14.0, oz + 11.8], [ox + s * 4.0, 9.6, oz + 15.4], 1.4, 1.25, TUSK);
    c.tube([ox + s * 4.0, 9.6, oz + 15.4], [ox + s * 4.4, 10.6, oz + 19.6], 1.25, 1.0, TUSK);
    c.tube([ox + s * 4.4, 10.6, oz + 19.6], [ox + s * 3.0, 15.0, oz + 22.0], 1.0, 0.6, TUSK);
  }
  shadeBody(c, 12, 24, 0.1);
  eyes(c, 4, 18, 2, 2, { iris: 0xffd04a, brow: HIDE2, zFrom: oz + 14 });
  c.joint('head', [ox, 16, oz + 6], 'body');
  c.part('tail');
  c.tube([ox, 15, oz - 10.5], [ox, 11.5, oz - 12.5], 0.9, 0.7, HIDE);
  c.ellipsoid(ox, 10.6, oz - 12.8, 1.2, 1.4, 1.2, MOSS);
  c.joint('tail', [ox, 15, oz - 10], 'body');
  return c.build('quadruped');
}
void mix;
