// mt/voxel/models/trainers.js — the three trainer specs as chunky voxel kids (big head, short body), team colour slots
// (jacket / robe / hat / headband) and skin + hair variants. Owner: voxel character design.
//   trainer_attack  "Striker": spiky hair, team headband + track jacket, white sneakers, yellow backpack
//   trainer_healing "Mender": wide sun hat with a leaf band, striped team shirt, field satchel
//   trainer_magic   "Mystic": tall pointed team hat with a gold band + star, long pale hair, robe, crystal staff
// Rig: 'biped' — body (torso, root at the hips), head, armL/armR (shoulder joints), legL/legR (hip joints).
import { Canvas, mix, hash3 } from './rig.js';
import { eye, shadeBody, INK, WHITE } from './parts.js';

export const TEAM = {
  blue: { main: 0x2f6ae0, dark: 0x2048a8, light: 0x6aa4ff },
  red: { main: 0xd8343a, dark: 0xa0202c, light: 0xff7a68 },
  null: { main: 0x5a9a5a, dark: 0x3a6a3a, light: 0x8ac88a },
};
const SKINS = [0xf6d2b0, 0xe6b48c, 0xc68a5e, 0x9a6440, 0x6e4430];
const HAIRS = [0x2a2026, 0x6a3e24, 0xe8c25a, 0xc4602c, 0xe8e6f4, 0x3a3a6a];
const GOLD = 0xffc83a, GOLD2 = 0xd8962a;

function look(o, def) {
  const v = o.variant | 0, T = TEAM[o.team] || TEAM.blue;
  return { T, skin: v ? SKINS[(v + def.skinI) % SKINS.length] : def.skin, hair: v ? HAIRS[(v * 2 + def.hairI) % HAIRS.length] : def.hair };
}

/** shared kid body: legs (pants + shoes), torso (top colour), arms (sleeves + hands), head (skin) — returns canvas */
function kid(L, top, pants, shoes, o = {}) {
  const c = new Canvas(20, o.h || 26, 14), ox = c.ox, oz = c.oz;
  // legs
  for (const [nm, x0] of [['legR', ox - 3], ['legL', ox + 1]]) {
    c.part(nm).box(x0, 0, oz - 1, x0 + 1, 4, oz, pants);
    c.box(x0, 0, oz - 1, x0 + 1, 1, oz + 1, shoes);
    c.box(x0, 0, oz - 1, x0 + 1, 0, oz + 1, mix(shoes, 0x2a2a3a, 0.45));
    c.joint(nm, [x0 + 1, 5, oz], 'body');
  }
  // torso
  c.part('body').box(ox - 3, 5, oz - 2, ox + 2, 9, oz + 1, top);
  c.box(ox - 3, 5, oz - 2, ox + 2, 5, oz + 1, o.belt ?? mix(pants, 0x000000, 0.25));
  c.joint('body', [ox, 5, oz]);
  // arms (sleeves + skin hands)
  for (const [nm, x0, s] of [['armR', ox - 5, -1], ['armL', ox + 3, 1]]) {
    c.part(nm).box(x0, 5, oz - 1, x0 + 1, 9, oz, o.sleeve ?? top);
    c.box(x0, 4, oz - 1, x0 + 1, 5, oz, L.skin);
    c.joint(nm, [s < 0 ? x0 + 2 : x0, 9, oz - 0.5], 'body');
  }
  // head: big soft cube
  c.part('head').rbox(ox, 13.6, oz - 0.4, 4.3, 3.7, 3.9, L.skin, 4);
  c.joint('head', [ox, 10, oz - 0.5], 'body');
  return c;
}
/** face: 2×2 eyes with sparkle, blush, tiny mouth */
function face(c, L, y0 = 12, o = {}) {
  const ox = c.ox;
  eye(c, ox - 2, y0, 2, 2, -1, { iris: o.iris ?? 0x2a2238 });
  eye(c, ox + 1, y0, 2, 2, +1, { iris: o.iris ?? 0x2a2238 });
  c.front(ox - 4, y0 - 1, mix(L.skin, 0xff6a6a, 0.45)); c.front(ox + 3, y0 - 1, mix(L.skin, 0xff6a6a, 0.45));
  if (o.mouth !== false) c.front(ox - 1, y0 - 2, mix(L.skin, 0x8a3a3a, 0.6)), c.front(ox, y0 - 2, mix(L.skin, 0x8a3a3a, 0.6));
}
/** hair cap: recolour the head's top + back shell, keep the face window */
function hairCap(c, color, o = {}) {
  const ox = c.ox, oz = c.oz, top = o.top ?? 15.5, fringe = o.fringe ?? 15;
  c.part('head').shade((x, y, z) => {
    const back = z < oz - 1.5 && y >= (o.backDown ?? 11);
    const sideBurn = (x <= ox - 4 || x >= ox + 3) && y >= (o.sideDown ?? 13) && z < oz + 2;
    const fr = z >= oz + 1.5 && y >= fringe && (o.fringeMask ? o.fringeMask(x) : true);
    return y >= top || back || sideBurn || fr ? (hash3(x, y, z, 6) < 0.15 ? mix(color, 0xffffff, 0.12) : color) : null;
  });
}

// ------------------------------------------------------------------------------------------------ Striker
export function trainer_attack(o = {}) {
  const L = look(o, { skin: 0xe9b48c, hair: 0x3a2a34, skinI: 1, hairI: 0 });
  const T = L.T, PANTS = 0x3a3f5c, SHOE = 0xf4f4f8, PACK = 0xe4a93c, PACKD = 0x9a6a2a;
  const c = kid(L, T.main, PANTS, SHOE, { sleeve: T.main });
  const ox = c.ox, oz = c.oz;
  c.part('body');
  c.box(ox - 1, 6, oz + 1, ox, 9, oz + 1, WHITE);                         // zip stripe
  c.box(ox - 3, 9, oz - 2, ox + 2, 9, oz + 1, T.light);                   // collar
  c.box(ox - 3, 5, oz - 4, ox + 2, 9, oz - 3, PACK); c.box(ox - 2, 6, oz - 5, ox + 1, 8, oz - 5, PACK);   // backpack
  c.box(ox - 3, 8, oz - 4, ox + 2, 8, oz - 4, PACKD);
  shadeBody(c, 5, 10, 0.12);
  for (const nm of ['armR', 'armL']) { c.part(nm); c.shade((x, y, z, col) => (y === 5 && col !== L.skin ? T.light : null)); }
  c.part('head');
  hairCap(c, L.hair, { top: 15.4, fringe: 15, backDown: 11 });
  // spikes
  for (const [x, z, h, lx] of [[-3, 0, 3, -0.6], [-0.5, 1, 4, 0], [2, 0, 3, 0.6], [-2, -3, 3, -0.4], [1.5, -3, 3, 0.4], [-4, -2, 2, -0.8], [3.5, -2, 2, 0.8]])
    for (let k = 0; k < h; k++) { const r = 1.25 * (1 - k / (h + 0.5)) + 0.3; c.ellipsoid(ox + x + lx * k + 0.5, 16.5 + k, oz + z - k * 0.55, r, 0.55, r, L.hair); }
  // team headband round the head at the fringe line
  c.shade((x, y, z, col) => (y === 15 && (z >= oz + 1 || x <= ox - 4 || x >= ox + 3 || z <= oz - 3) ? T.main : null));
  c.set(ox - 5, 15, oz - 3, T.main).set(ox - 6, 14, oz - 4, T.main).set(ox - 6, 13, oz - 4, T.light);   // tails of the band
  face(c, L, 12);
  return c.build('biped', { height: 21 });
}

// ------------------------------------------------------------------------------------------------ Mender
export function trainer_healing(o = {}) {
  const L = look(o, { skin: 0xffd9bc, hair: 0xc47a3c, skinI: 0, hairI: 3 });
  const T = L.T, PANTS = 0x6a5242, SHOE = 0x7a4a32, HAT = 0xf4ead2, HATD = 0xd8cca8, BAG = 0xe8dcc0, LEAFC = 0x5ccf4a;
  const c = kid(L, WHITE, PANTS, SHOE, { sleeve: T.main, h: 24 });
  const ox = c.ox, oz = c.oz;
  c.part('body');
  c.shade((x, y, z, col) => (col === WHITE && (y === 6 || y === 8) ? T.main : null));   // striped shirt
  c.box(ox - 3, 9, oz - 2, ox + 2, 9, oz + 1, T.main);
  // satchel strap + bag on the left hip
  for (let i = 0; i < 5; i++) c.set(ox - 3 + i + (i > 2 ? 1 : 0), 9 - i, oz + 2, 0x8a5a3a);
  c.box(ox + 1, 4, oz + 2, ox + 2, 6, oz + 2, BAG); c.set(ox + 2, 5, oz + 3, LEAFC).set(ox + 2, 6, oz + 3, LEAFC);
  shadeBody(c, 5, 10, 0.12);
  c.part('head');
  hairCap(c, L.hair, { top: 15, fringe: 14.5, backDown: 10, sideDown: 11 });
  // pigtail tufts
  for (const s of [-1, 1]) c.box(ox + (s < 0 ? -6 : 5), 10, oz - 2, ox + (s < 0 ? -5 : 4) + (s < 0 ? 0 : 1), 12, oz - 1, L.hair);
  // wide-brim sun hat with a green band and a leaf
  c.cylinder(ox, oz - 0.4, 16, 16, 5.9, 5.8, HAT);
  c.cylinder(ox, oz - 0.4, 15, 15, 5.6, 5.5, HATD);
  c.cylinder(ox, oz - 0.4, 17, 19, 4.0, 3.9, HAT);
  c.cylinder(ox, oz - 0.4, 17, 17, 4.1, 4.0, LEAFC);
  c.set(ox + 2, 18, oz + 3, LEAFC).set(ox + 3, 18, oz + 3, LEAFC).set(ox + 3, 19, oz + 3, 0x3fae46);
  face(c, L, 12);
  return c.build('biped', { height: 20 });
}

// ------------------------------------------------------------------------------------------------ Mystic
export function trainer_magic(o = {}) {
  const L = look(o, { skin: 0xa8704e, hair: 0xd2c6f6, skinI: 3, hairI: 4 });
  const T = L.T, BOOT = 0x3a2c46, WOOD = 0x8a5a3a, ORB = 0x5fe0e8, ORB2 = 0xc8fcff;
  const c = kid(L, T.main, T.dark, BOOT, { sleeve: T.main, h: 30, belt: GOLD2 });
  const ox = c.ox, oz = c.oz;
  // robe skirt over the legs (part of the legs so it swings), gold hem
  for (const [nm, x0] of [['legR', ox - 3], ['legL', ox]]) { c.part(nm).box(x0, 2, oz - 2, x0 + 2, 4, oz + 1, T.main); c.box(x0, 2, oz - 2, x0 + 2, 2, oz + 1, GOLD); }
  c.part('body');
  c.box(ox - 1, 6, oz + 1, ox, 9, oz + 1, GOLD);                          // gold placket
  c.set(ox - 1, 8, oz + 2, GOLD).set(ox, 8, oz + 2, 0xfff0a0);            // clasp
  shadeBody(c, 5, 10, 0.12);
  for (const nm of ['armR', 'armL']) { c.part(nm); c.shade((x, y, z, col) => (y === 5 && col !== L.skin ? GOLD : null)); }
  // crystal staff in the right hand
  c.part('armR');
  c.box(ox - 6, 0, oz + 1, ox - 6, 12, oz + 1, WOOD);
  c.set(ox - 6, 13, oz + 1, GOLD).set(ox - 7, 13, oz + 1, GOLD).set(ox - 5, 13, oz + 1, GOLD);
  c.sphere(ox - 5.5, 14.8, oz + 1.5, 1.4, ORB); c.set(ox - 6, 15, oz + 2, ORB2);
  c.part('head');
  hairCap(c, L.hair, { top: 15, fringe: 14.6, backDown: 7, sideDown: 8 });
  for (const s of [-1, 1]) c.box(ox + (s < 0 ? -5 : 4), 8, oz - 3, ox + (s < 0 ? -5 : 4), 12, oz, L.hair);   // long side locks
  // tall pointed hat, brim, gold band, star, slight droop at the tip
  c.cylinder(ox, oz - 0.4, 16, 16, 6.0, 5.8, T.main);
  for (let k = 0; k < 10; k++) { const r = 4.2 * (1 - k / 10.5) + 0.4, dz = -Math.max(0, k - 6) * 0.6; c.cylinder(ox, oz - 0.4 + dz, 17 + k, 17 + k, r, r, k < 2 ? GOLD : T.main); }
  c.set(ox - 1, 18, oz + 4, 0xfff0a0).set(ox, 19, oz + 3, 0xfff0a0).set(ox - 1, 19, oz + 3, GOLD);
  c.part('head'); c.shade((x, y, z, col) => (y >= 19 && col === T.main ? (x < ox ? T.light : col) : null));
  face(c, L, 12, { iris: 0x3a2a6a });
  return c.build('biped', { height: 27 });
}
