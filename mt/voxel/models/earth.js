// mt/voxel/models/earth.js — earth line: Pebbit (shell-banded armadillo pup) -> Bouldash (stone-plated rhino
// charger) -> Terracore (moss-grown rock golem with a molten core). Owner: voxel character design. Identity from the
// sprite art: warm tan skin, slate-blue shell bands, cream belly; Bouldash's ivory nose horn + orange eyes; Terracore's
// layered stone, moss and glowing amber core (the `fx` part).
import { Canvas, mix, hash3 } from './rig.js';
import { eyes, legs4, ear, patch, shadeBody, INK } from './parts.js';

const SH = (on, a, b) => (on ? b : a);

// ------------------------------------------------------------------------------------------------ Pebbit (≈ 1 m)
export function pebbit(o = {}) {
  const SKIN = SH(o.shiny, 0xe8b07c, 0xf0d08a), SHELL = SH(o.shiny, 0x8f9ab8, 0xb8a0d8), SHELLD = SH(o.shiny, 0x5a6184, 0x7a62a0), BELLY = 0xfff0d6, CLAW = 0x5a4640, EARIN = 0xff9c8a;
  const c = new Canvas(20, 16, 24), ox = c.ox, oz = c.oz;
  c.part('body').rbox(ox, 4.4, oz - 1, 3.2, 2.8, 4.0, SKIN, 2.6);
  c.rbox(ox, 5.4, oz - 1.4, 3.8, 3.0, 4.5, SHELL, 2.4);
  c.shade((x, y, z, col) => (col === SHELL && y < 4 ? null : col === SHELL && ((z - oz + 20) % 3 === 0) ? SHELLD : null));
  c.shade((x, y, z, col) => (col === SHELL && y < 3.5 ? SKIN : null));
  patch(c, ox, 2.4, oz, 2.4, 1.2, 3.4, BELLY);
  shadeBody(c, 1, 9);
  c.joint('body', [ox, 2.5, oz]);
  legs4(c, { xOff: 1.4, zF: oz + 1.2, zB: oz - 4, len: 2, top: 3, w: 2, d: 2, col: SKIN, paw: CLAW });
  c.part('head').rbox(ox, 7.4, oz + 3.6, 3.4, 2.9, 3.0, SKIN, 3);
  c.rbox(ox, 9.0, oz + 3.0, 3.0, 1.2, 2.6, SHELL, 3);                       // forehead plate
  c.rbox(ox, 6.4, oz + 6.6, 1.4, 1.0, 1.3, SKIN, 3);                        // snout
  patch(c, ox, 5.6, oz + 5.4, 2.6, 1.0, 2, BELLY);
  shadeBody(c, 4, 11, 0.1);
  c.set(ox - 1, 7, oz + 8, INK).set(ox, 7, oz + 8, INK);
  eyes(c, 2, 7, 2, 2, { iris: 0x4a2e2a });
  c.front(ox - 4, 6, 0xffa08a); c.front(ox + 3, 6, 0xffa08a);
  ear(c, ox - 2.8, 9.6, oz + 2, 2.0, 1, 3, SKIN, EARIN, null, -1, 0.5);
  ear(c, ox + 2.8, 9.6, oz + 2, 2.0, 1, 3, SKIN, EARIN, null, +1, 0.5);
  c.joint('head', [ox, 5, oz + 2.5], 'body');
  c.part('tail');
  c.tube([ox, 3.8, oz - 5.2], [ox, 3.0, oz - 8], 1.2, 0.7, SHELL);
  c.shade((x, y, z, col) => (z % 2 === 0 ? SHELLD : null));
  c.joint('tail', [ox, 3.8, oz - 5], 'body');
  return c.build('quadruped');
}

// ------------------------------------------------------------------------------------------------ Bouldash (≈ 1.7 m)
export function bouldash(o = {}) {
  const SKIN = SH(o.shiny, 0xcf9a62, 0xb8c070), BELLY = 0xf0d6a8, STONE = SH(o.shiny, 0x7c8299, 0x9a7c6c), STONED = 0x4e5168, HORN = 0xece2c8, HOOF = 0x4a3a36;
  const c = new Canvas(28, 22, 34), ox = c.ox, oz = c.oz;
  c.part('body').rbox(ox, 8.6, oz - 1.5, 4.6, 3.8, 6.4, SKIN, 2.6);
  patch(c, ox, 5.6, oz, 3.4, 1.4, 5.6, BELLY);
  // armour plates: chunky stones over the back, darker seams
  for (const [x, y, z, rx, ry, rz] of [[0, 11.6, -5, 3.8, 1.8, 2.6], [0, 12.2, -1, 4.2, 1.9, 2.4], [0, 11.8, 3, 3.8, 1.7, 2.2], [-3.8, 10, -2, 1.4, 2.2, 3.4], [3.8, 10, -2, 1.4, 2.2, 3.4]])
    c.rbox(ox + x, y, oz + z, rx, ry, rz, (X, Y, Z) => (hash3(X, Y, Z, 7) < 0.18 ? STONED : Y > y + 0.6 ? mix(STONE, 0xffffff, 0.12) : STONE), 2.6);
  shadeBody(c, 5, 14);
  c.joint('body', [ox, 6, oz]);
  legs4(c, { xOff: 1.6, zF: oz + 2.2, zB: oz - 6.5, len: 5, top: 8, w: 3, d: 3, col: SKIN, paw: HOOF });
  c.part('head').rbox(ox, 10.6, oz + 6.6, 3.7, 3.2, 3.4, SKIN, 3);
  c.rbox(ox, 9.4, oz + 9.8, 2.4, 2.0, 2.0, SKIN, 3);                        // broad snout
  c.rbox(ox, 13.0, oz + 6.0, 3.4, 1.3, 2.8, STONE, 2.6);                    // brow plate
  patch(c, ox, 8.2, oz + 9.6, 2.6, 1.0, 2.6, BELLY);
  shadeBody(c, 7, 15, 0.1);
  c.set(ox - 2, 9, oz + 11, INK).set(ox + 1, 9, oz + 11, INK);
  // ivory nose horn + a small second horn
  c.tube([ox, 10.4, oz + 11.4], [ox, 13.4, oz + 13.6], 1.5, 1.0, HORN);
  c.tube([ox, 13.4, oz + 13.6], [ox, 16.6, oz + 13.2], 1.0, 0.4, HORN);
  c.tube([ox, 12.8, oz + 9.4], [ox, 14.4, oz + 9.8], 0.8, 0.4, HORN);
  eyes(c, 4, 11, 2, 2, { iris: 0xff9a2a, brow: STONED, zFrom: oz + 9 });
  ear(c, ox - 3.6, 12.4, oz + 4.4, 2.0, 1, 3, SKIN, 0xffb09a, null, -1, 0.9);
  ear(c, ox + 3.6, 12.4, oz + 4.4, 2.0, 1, 3, SKIN, 0xffb09a, null, +1, 0.9);
  c.joint('head', [ox, 9, oz + 4], 'body');
  c.part('tail');
  c.tube([ox, 9.4, oz - 7.8], [ox, 7.4, oz - 9.6], 0.8, 0.6, SKIN);
  c.sphere(ox, 7, oz - 9.8, 1.0, STONE);
  c.joint('tail', [ox, 9.4, oz - 7.5], 'body');
  return c.build('quadruped');
}

// ------------------------------------------------------------------------------------------------ Terracore (≈ 3 m)
export function terracore(o = {}) {
  const STONE = SH(o.shiny, 0x8a7a6c, 0x7a8a9a), STONED = SH(o.shiny, 0x5c4e48, 0x4e5a68), STONEL = 0xb8a68e, MOSS = 0x6aa04a, MOSS2 = 0x86c060, CORE = 0xffd060, CORE2 = 0xff9a2a, CORE3 = 0xfff4c0, AMBER = 0xffb040;
  const c = new Canvas(40, 36, 26), ox = c.ox, oz = c.oz;
  const rock = (seed) => (X, Y, Z) => { const h = hash3(X, Y, Z, seed); return h < 0.12 ? STONED : h > 0.9 ? STONEL : STONE; };
  // legs: short boulder stumps
  for (const [nm, x0] of [['legR', ox - 7], ['legL', ox + 2]]) {
    c.part(nm).rbox(x0 + 2.5, 4.5, oz, 2.7, 4.5, 3.0, rock(11), 2.6);
    c.rbox(x0 + 2.5, 1.2, oz + 0.8, 3.2, 1.3, 3.6, STONED, 2.6);
    c.joint(nm, [x0 + 2.5, 9, oz], 'body');
  }
  // torso: a huge stacked boulder, moss on the shoulders and back
  c.part('body').rbox(ox, 17, oz, 8.4, 7.6, 5.8, rock(12), 2.4);
  c.rbox(ox, 10.8, oz, 5.6, 2.6, 4.4, rock(13), 2.6);                       // hips
  c.shade((x, y, z, col) => (y >= 22 + (hash3(x, 0, z, 2) < 0.4 ? 1 : 0) || (z < oz - 3 && y > 18) ? (hash3(x, y, z, 5) < 0.3 ? MOSS2 : MOSS) : null));
  // stone ring around the core socket
  for (let a = 0; a < 24; a++) { const t = a / 24 * Math.PI * 2; c.set(ox + Math.cos(t) * 3.6, 17 + Math.sin(t) * 3.6, oz + 5.6, STONED); }
  // amber crystals on the shoulders
  for (const s of [-1, 1]) for (const [dx, dz, h] of [[0, 0, 5], [1.6, -1.5, 4], [-1.4, -1.2, 3]]) {
    for (let k = 0; k < h; k++) { const r = Math.max(0.5, 1.1 * (1 - k / h)); c.ellipsoid(ox + s * (6 + dx) + s * k * 0.35, 23.5 + k, oz - 1 + dz, r, 0.6, r, k > h - 2 ? 0xfff0b0 : AMBER); }
  }
  shadeBody(c, 8, 26, 0.12);
  c.joint('body', [ox, 9, oz]);
  // molten core (glows)
  c.part('fx').sphere(ox, 17, oz + 5.2, 2.9, (X, Y, Z) => { const d = Math.hypot(X + 0.5 - ox, Y + 0.5 - 17); return d < 1.3 ? CORE3 : d < 2.2 ? CORE : CORE2; });
  c.joint('fx', [ox, 17, oz + 5], 'body');
  // small head sunk between the shoulders, brow ridge, glowing eyes
  c.part('head').rbox(ox, 25.6, oz + 2.6, 3.6, 3.0, 3.0, rock(14), 3);
  c.rbox(ox, 27.6, oz + 3.4, 3.8, 0.9, 2.6, STONED, 3);
  c.shade((x, y, z, col) => (y >= 28 ? MOSS : null));
  for (const x of [ox - 3, ox - 2, ox + 1, ox + 2]) c.front(x, 25, x === ox - 2 || x === ox + 1 ? CORE3 : CORE);
  c.joint('head', [ox, 23, oz + 2], 'body');
  // massive arms: boulder shoulder, forearm, huge fist
  c.part('armR');
  c.rbox(ox - 10.5, 20.5, oz, 3.4, 3.4, 3.4, rock(15), 2.6);
  c.rbox(ox - 11.6, 14, oz + 0.5, 2.6, 4.0, 2.8, rock(16), 2.6);
  c.rbox(ox - 12.0, 7.6, oz + 1, 3.6, 3.0, 3.6, rock(17), 2.4);
  c.shade((x, y, z, col) => (y >= 23 ? MOSS : null));
  c.joint('armR', [ox - 8.5, 21, oz], 'body');
  c.mirrorPart('armR', 'armL');
  return c.build('biped');
}
void ear; void legs4; void patch;
