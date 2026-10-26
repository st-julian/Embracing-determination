// mt/voxel/models/water.js — water line: Puddlet (axolotl pup) -> Tidalon (shell-backed tide otter) -> Abyssaur
// (coral-spined deep-sea dragon). Owner: voxel character design. Identity from the sprite art: sky-blue -> deep blue
// skin, cream belly, pink gills (Puddlet), navy shell plates with pale rims, white coral spikes, teal fins, cyan eyes.
import { Canvas, mix } from './rig.js';
import { eyes, legs4, patch, shadeBody, INK } from './parts.js';

const SH = (on, a, b) => (on ? b : a);

/** thin fin plate in the y/z plane at x, outline from (y0,z0) along z for len, height profile fn(t) */
function finYZ(c, x, y0, z0, len, hmax, col, dir = -1, w = 1) {
  for (let i = 0; i < len; i++) { const t = i / Math.max(1, len - 1), h = Math.max(1, Math.round(hmax * Math.sin(Math.PI * (0.15 + 0.85 * t)) * (1 - 0.35 * t))); for (let k = 0; k < h; k++) for (let q = 0; q < w; q++) c.set(x + q, y0 + k, z0 + dir * i, col); }
}

// ------------------------------------------------------------------------------------------------ Puddlet (≈ 1 m)
export function puddlet(o = {}) {
  const SKIN = SH(o.shiny, 0x62b8f4, 0xf6a6c8), BACK = SH(o.shiny, 0x3f8ad8, 0xe07aa8), BELLY = 0xfff0c4, GILL = 0xff86a8, GILL2 = 0xffc2d4, FIN = 0xaaf0ff, TOE = 0x9edcff;
  const c = new Canvas(22, 15, 24), ox = c.ox, oz = c.oz;
  c.part('body').rbox(ox, 3.8, oz - 1, 3.1, 2.3, 4.5, SKIN, 3);
  c.shade((x, y, z, col) => (y >= 5 ? BACK : null));
  patch(c, ox, 2.2, oz, 2.4, 1.2, 3.6, BELLY);
  shadeBody(c, 1, 6);
  c.joint('body', [ox, 2, oz]);
  legs4(c, { xOff: 1.8, zF: oz + 1, zB: oz - 4, len: 2, top: 3, w: 2, d: 2, col: SKIN, paw: TOE, splay: 1 });
  // big wide head with the axolotl smile
  c.part('head').rbox(ox, 7.4, oz + 3.4, 4.6, 3.3, 3.5, SKIN, 3);
  c.shade((x, y, z, col) => (y >= 9 && col === SKIN ? mix(SKIN, BACK, 0.45) : null));
  patch(c, ox, 5.4, oz + 4.6, 3.6, 1.2, 2.6, BELLY);
  shadeBody(c, 4, 11, 0.1);
  eyes(c, 4, 8, 2, 2, { iris: 0x1d2a5c });
  c.front(ox - 1, 6, 0x22406e); c.front(ox, 6, 0x22406e); c.front(ox - 2, 7, 0x22406e); c.front(ox + 1, 7, 0x22406e);
  c.front(ox - 4, 7, 0xff9ab4); c.front(ox + 3, 7, 0xff9ab4);
  // gill fronds (3 per side) and a little head fin
  for (const s of [-1, 1]) for (const [dy, len] of [[2.6, 3.2], [0.6, 3.6], [-1.3, 3.0]]) {
    const a = [ox + s * 4.2, 7.6 + dy * 0.4, oz + 2.4], b = [ox + s * (4.2 + len), 7.6 + dy, oz + 1.6];
    c.tube(a, b, 0.7, 0.55, GILL); c.set(b[0] + s * 0.4, b[1], b[2], GILL2);
  }
  finYZ(c, ox - 1, 10, oz + 4, 5, 2, FIN, -1, 2);
  c.joint('head', [ox, 5, oz + 2], 'body');
  c.part('tail');
  c.tube([ox, 4, oz - 5], [ox, 4.6, oz - 10.5], 1.8, 0.8, SKIN);
  finYZ(c, ox - 1, 5.2, oz - 5.5, 6, 2, FIN, -1, 2);
  finYZ(c, ox - 1, 2.6, oz - 7, 4, 1, FIN, -1, 2);
  c.joint('tail', [ox, 4, oz - 4.5], 'body');
  return c.build('quadruped');
}

// ------------------------------------------------------------------------------------------------ Tidalon (≈ 1.7 m)
export function tidalon(o = {}) {
  const SKIN = SH(o.shiny, 0x3a8ee0, 0x8a7ae8), BACK = SH(o.shiny, 0x2c6cc0, 0x6a58c8), BELLY = 0xfff0c8, FIN = 0x6ae6d6, SHELL = 0x365e9a, RIM = 0xcfe6ff, TOE = 0x9edcff;
  const c = new Canvas(28, 21, 34), ox = c.ox, oz = c.oz;
  c.part('body').rbox(ox, 7.6, oz - 1.5, 3.9, 3.2, 6.0, SKIN, 3);
  patch(c, ox, 5.6, oz + 1, 3.0, 1.8, 5, BELLY);
  // shell: domed plates with pale rims
  c.rbox(ox, 10.2, oz - 2.2, 4.4, 2.0, 5.6, SHELL, 2.4);
  c.shade((x, y, z, col) => { if (col !== SHELL) return null; const rel = z - (oz - 2.2); return Math.abs(rel % 3.5) < 0.6 || y <= 8.6 ? RIM : null; });
  shadeBody(c, 4, 13);
  c.joint('body', [ox, 6, oz]);
  legs4(c, { xOff: 1.8, zF: oz + 2.5, zB: oz - 6, len: 5, top: 7, w: 2, d: 3, col: SKIN, paw: TOE, splay: 0 });
  c.part('head').rbox(ox, 13.0, oz + 6.2, 4.0, 3.3, 3.6, SKIN, 3.2);
  c.tube([ox, 9.5, oz + 3], [ox, 12, oz + 5], 2.6, 2.6, SKIN);
  c.rbox(ox, 11.6, oz + 9.8, 2.3, 1.5, 1.8, SKIN, 3);
  patch(c, ox, 10.8, oz + 9, 3.6, 1.3, 3.6, BELLY);
  c.shade((x, y, z, col) => (y >= 15 && col === SKIN ? BACK : null));
  shadeBody(c, 9, 17, 0.1);
  c.set(ox - 1, 12, oz + 11, INK).set(ox, 12, oz + 11, INK);
  eyes(c, 2, 13, 2, 2, { iris: 0x28c8ff, brow: BACK });
  finYZ(c, ox - 1, 15.6, oz + 7.5, 7, 4, FIN, -1, 2);                     // crest fin
  for (const s of [-1, 1]) c.tube([ox + s * 3.8, 13.6, oz + 5.5], [ox + s * 6.2, 15.2, oz + 3.2], 1.0, 0.5, FIN);   // ear fins
  c.joint('head', [ox, 11, oz + 4], 'body');
  c.part('tail');
  c.tube([ox, 8, oz - 7.5], [ox, 9, oz - 12.5], 2.0, 1.2, SKIN);
  c.joint('tail', [ox, 8, oz - 7], 'body');
  c.part('tail2');
  for (const s of [-1, 1]) c.ellipsoid(ox + s * 2.4, 9.4, oz - 14, 2.8, 0.9, 1.7, FIN);
  c.joint('tail2', [ox, 9, oz - 12.5], 'tail');
  return c.build('quadruped');
}

// ------------------------------------------------------------------------------------------------ Abyssaur (≈ 2.9 m)
export function abyssaur(o = {}) {
  const SKIN = SH(o.shiny, 0x2f6fc4, 0x3a3a8a), BELLY = 0xf2e6c0, SHELL = 0x27406e, RIM = 0x9fd6ff, CORAL = 0xeefcff, FIN = 0x4fd8d0, CLAW = 0xe6eef8, GLOW = 0x6cf4ff;
  const c = new Canvas(40, 32, 52), ox = c.ox, oz = c.oz;
  c.part('body').rbox(ox, 13.2, oz - 2, 6.4, 5.4, 9.6, SKIN, 3);
  c.ellipsoid(ox, 12.5, oz + 6, 5.2, 5.6, 3.6, SKIN);                      // chest
  patch(c, ox, 9.8, oz + 2, 4.6, 3.2, 9.6, BELLY);
  c.rbox(ox, 17.4, oz - 3, 5.6, 2.6, 8.6, SHELL, 2.4);
  c.shade((x, y, z, col) => (col === SHELL && (y <= 15.4 || Math.abs((z - oz) % 4) < 0.6) ? RIM : null));
  shadeBody(c, 7, 21);
  // coral spikes along the spine + side rows
  const spike = (x, y, z, h, w) => { for (let k = 0; k < h; k++) { const r = Math.max(0.5, w * (1 - k / h)); c.ellipsoid(x, y + k, z - k * 0.35, r, 0.6, r, k > h - 2 ? 0xffffff : CORAL); } };
  [[oz + 2.5, 7], [oz - 2, 8], [oz - 6.5, 6], [oz - 10, 4]].forEach(([z, h]) => spike(ox, 19.5, z, h, 2.0));
  [[oz, 3], [oz - 5, 3]].forEach(([z, h]) => { spike(ox - 4.4, 18.2, z, h, 1.1); spike(ox + 4.4, 18.2, z, h, 1.1); });
  c.joint('body', [ox, 11, oz]);
  legs4(c, { xOff: 2.4, zF: oz + 4, zB: oz - 9, len: 10, top: 12, w: 4, d: 4, col: SKIN, paw: SKIN, pawH: 1 });
  for (const [nm, s, z] of [['legFR', -1, oz + 4], ['legFL', 1, oz + 4], ['legBR', -1, oz - 9], ['legBL', 1, oz - 9]]) {
    c.part(nm);
    const x0 = s < 0 ? Math.floor(ox - 2.4 - 4) : Math.floor(ox + 2.4);
    c.ellipsoid(x0 + 2, 10, z + 2, 3, 4, 3, SKIN);
    for (const i of [0, 3]) c.set(x0 + i, 0, z + 4, CLAW);
  }
  // neck + head
  c.part('head');
  c.tube([ox, 16, oz + 7], [ox, 20.5, oz + 11], 4.0, 3.6, SKIN);
  c.rbox(ox, 22.6, oz + 12.6, 4.8, 3.9, 4.4, SKIN, 3.2);
  c.rbox(ox, 21.2, oz + 18.6, 3.1, 2.2, 4.2, SKIN, 3);                    // long muzzle
  c.rbox(ox, 19.0, oz + 17.6, 2.9, 1.2, 4.2, BELLY, 3);                   // lower jaw
  for (const x of [ox - 3, ox - 1, ox, ox + 2]) c.set(x, 20, oz + 21, 0xffffff);   // teeth
  for (const s of [-1, 1]) c.set(ox + (s < 0 ? -3 : 2), 20, oz + 19, 0xffffff);
  c.shade((x, y, z, col) => (col === SKIN && y >= 25 ? SHELL : null));
  shadeBody(c, 17, 27, 0.12);
  c.set(ox - 2, 22, oz + 22, INK).set(ox + 1, 22, oz + 22, INK);
  eyes(c, 3, 23, 2, 2, { iris: 0x30e8ff, brow: SHELL, zFrom: oz + 17 });
  for (const s of [-1, 1]) {
    c.tube([ox + s * 2.6, 25.5, oz + 13], [ox + s * 4.4, 29.5, oz + 8.6], 1.1, 0.5, CORAL);        // coral horns
    c.tube([ox + s * 3.6, 27.2, oz + 10.8], [ox + s * 5.8, 28, oz + 11.2], 0.6, 0.4, CORAL);
    c.tube([ox + s * 4.6, 21.5, oz + 12], [ox + s * 7.6, 22.8, oz + 9], 1.4, 0.6, FIN);           // cheek fins
  }
  c.joint('head', [ox, 17, oz + 7], 'body');
  // tail with a big teal fin
  c.part('tail');
  c.tube([ox, 13, oz - 11.5], [ox, 12.5, oz - 17.5], 3.4, 2.5, SKIN);
  c.joint('tail', [ox, 13, oz - 11], 'body');
  c.part('tail2');
  c.tube([ox, 12.5, oz - 17.5], [ox, 13.5, oz - 23], 2.5, 1.4, SKIN);
  finYZ(c, ox - 1, 14.5, oz - 18.5, 7, 6, FIN, -1, 2);
  finYZ(c, ox - 1, 8.5, oz - 21, 4, 3, FIN, -1, 2);
  c.joint('tail2', [ox, 12.5, oz - 17.5], 'tail');
  // bioluminescent spots (flicker)
  c.part('fx');
  for (const s of [-1, 1]) for (const [y, z] of [[14, 2], [13, -2], [13, -6], [13.5, -10]]) { for (let x = s < 0 ? 0 : c.sx - 1; s < 0 ? x < ox : x >= ox; x -= s) { const i = c.idx(x, y, oz + z); if (c.v[i]) { c.set(x, y, oz + z, GLOW); break; } } }
  c.joint('fx', [ox, 13, oz], 'body');
  return c.build('quadruped');
}
