// mt/voxel/models/boss.js — river boss: Ancient Galeclaw, a colossal horned storm roc (≈ 5.5 m tall, ≈ 10 m span).
// Owner: voxel character design. Identity from the sprite art: slate-blue plumage, pale chest, mossy-teal ruff,
// ivory curled horns, bone beak, gold bands, dark talons, glowing aqua runes + eyes (the runes are `fx`).
// Rig: 'flyer' — body, head, wingL/wingR, legL/legR (talons), tail, fx.
import { Canvas, mix, hash3 } from './rig.js';
import { eyes, patch, shadeBody, INK, wingWeb } from './parts.js';

export function boss_galeclaw(o = {}) {
  const BLUE = o.shiny ? 0x5a4a6e : 0x3d5a6e, BLUED = o.shiny ? 0x3a2a50 : 0x2a3c50, WHITE = 0xdfe8e4, AQUA = 0x5ff0d8, GOLD = 0xe8b84a, TALON = 0x22232e, BEAK = 0xd8c49a, HORN = 0xefe3c4, RUFF = 0x5b7d8c;
  const c = new Canvas(116, 62, 76), ox = c.ox, oz = c.oz;
  const plume = (base, dark) => (X, Y, Z) => (hash3(X, Y, Z, 9) < 0.14 ? dark : base);
  // body: deep chest leaning forward
  c.part('body').rbox(ox, 26, oz - 1, 9.4, 9.6, 13, plume(BLUE, BLUED), 2.4);
  c.ellipsoid(ox, 27, oz + 9, 8, 9.4, 6, plume(WHITE, 0xc6d2ce));
  c.shade((x, y, z, col) => (col === BLUE && y >= 32 ? BLUED : null));
  // feathered thighs
  for (const s of [-1, 1]) c.ellipsoid(ox + s * 6.5, 18, oz - 1, 3.6, 5, 5, plume(BLUE, BLUED));
  shadeBody(c, 14, 36);
  c.joint('body', [ox, 20, oz]);
  // talons: thick legs, gold bands, three hooked claws forward + one back
  for (const [nm, s] of [['legR', -1], ['legL', 1]]) {
    c.part(nm);
    const x = ox + s * 6.5, z = oz + 1;
    c.tube([x, 16, z - 1], [x, 3, z + 1], 1.8, 1.5, BEAK);
    c.tube([x, 18, z - 1.5], [x, 10.5, z], 3.4, 2.6, plume(BLUE, BLUED));
    c.cylinder(x, z + 0.4, 8, 9, 2.1, 2.1, GOLD);
    for (const d of [-1.6, 0, 1.6]) { c.tube([x, 2, z + 1], [x + d, 1.2, z + 4.6], 1.0, 0.8, BEAK); c.tube([x + d, 1.2, z + 4.6], [x + d * 1.1, 0.2, z + 6.2], 0.75, 0.4, TALON); }
    c.tube([x, 2, z], [x, 0.3, z - 3], 0.8, 0.4, TALON);
    c.joint(nm, [x, 16, z - 1], 'body');
  }
  // head: eagle skull, white face, heavy hooked beak, curled ivory horns, aqua eyes
  c.part('head');
  c.tube([ox, 32, oz + 6], [ox, 37, oz + 9], 6.2, 5.6, plume(BLUE, BLUED));
  c.rbox(ox, 41, oz + 11, 7.2, 6.4, 6.8, plume(BLUE, BLUED), 2.6);
  patch(c, ox, 39.6, oz + 15.5, 6.2, 4.0, 2.8, WHITE);
  c.tube([ox, 41.4, oz + 17], [ox, 40.2, oz + 21], 3.0, 2.4, BEAK);
  c.tube([ox, 40.2, oz + 21], [ox, 37.0, oz + 22.4], 2.3, 0.9, BEAK);
  c.tube([ox, 38.0, oz + 17.4], [ox, 37.6, oz + 19.6], 1.8, 1.2, mix(BEAK, 0x8a7a5a, 0.4));
  shadeBody(c, 34, 47, 0.1);
  eyes(c, 5, 42, 3, 3, { iris: 0x7affea, brow: BLUED, zFrom: oz + 18 });
  for (const s of [-1, 1]) {
    const pts = [[ox + s * 4, 45, oz + 9], [ox + s * 8.5, 50.5, oz + 4], [ox + s * 12, 48.5, oz - 1.5], [ox + s * 11.5, 44.5, oz - 3]];
    for (let i = 0; i < 3; i++) c.tube(pts[i], pts[i + 1], 1.7 - i * 0.45, 1.25 - i * 0.4, i === 2 ? 0xfff8e8 : HORN);
  }
  // mossy ruff collar
  for (let a = 0; a < 14; a++) { const t = a / 14 * Math.PI * 2; c.sphere(ox + Math.cos(t) * 6.6, 33 + Math.sin(t) * 0.8, oz + 5 + Math.sin(t) * 5.6, 2.2, plume(RUFF, 0x46646f)); }
  c.joint('head', [ox, 33, oz + 6], 'body');
  // colossal wings: arm + 7 feathers, slate -> deep -> pale -> aqua tips
  c.part('wingR');
  const sh0 = [ox - 8, 33, oz + 1], wr = [ox - 24, 44, oz - 3];
  c.tube(sh0, wr, 3.0, 2.4, plume(BLUE, BLUED));
  c.sphere(wr[0], wr[1], wr[2], 2.6, GOLD);
  const FEATH = [[-27, 12, -5, 3.6], [-30, 5, -7, 3.6], [-29, -3, -8, 3.5], [-26, -10, -8, 3.4], [-21, -16, -7, 3.2], [-15, -19, -6, 3.0], [-8, -20, -4, 2.6]];
  wingWeb(c, wr, FEATH.map(([dx, dy, dz]) => [wr[0] + dx, wr[1] + dy, wr[2] + dz]), (t) => (t < 0.3 ? BLUE : t < 0.62 ? BLUED : WHITE), 0.84);
  for (const [dx, dy, dz, w] of FEATH) {
    const tip = [wr[0] + dx, wr[1] + dy, wr[2] + dz], L = Math.hypot(dx, dy, dz);
    for (let t = 0; t <= 1; t += 0.4 / L) {
      const P = [0, 1, 2].map((k) => wr[k] + (tip[k] - wr[k]) * t), r = w * (1 - t * 0.5);
      c.ellipsoid(P[0], P[1], P[2], r, r, 1.1, t < 0.3 ? BLUE : t < 0.62 ? BLUED : t < 0.86 ? WHITE : AQUA);
    }
  }
  c.joint('wingR', [ox - 7.5, 33, oz + 1], 'body');
  c.mirrorPart('wingR', 'wingL');
  // tail fan
  c.part('tail');
  for (const d of [-2, -1, 0, 1, 2]) c.tube([ox, 24, oz - 12], [ox + d * 4.2, 20 - Math.abs(d) * 1.2, oz - 30], 2.6, 1.6, (X, Y, Z) => (Z < oz - 26 ? AQUA : Z < oz - 21 ? WHITE : BLUED));
  c.joint('tail', [ox, 24, oz - 12], 'body');
  // fx: glowing aqua storm runes on the chest and shoulders
  c.part('fx');
  const rune = (x, y, z) => { c.set(x, y, z, AQUA); c.set(x, y + 1, z, AQUA); c.set(x + 1, y + 2, z, AQUA); c.set(x - 1, y + 2, z, AQUA); };
  for (const [x, y] of [[0, 24], [-3, 29], [3, 29], [0, 32]]) { let zf = oz + 20; while (zf > 0 && !c.filled(ox + x, y, zf)) zf--; rune(ox + x, y, zf + 1); }
  for (const s of [-1, 1]) for (const [y, z] of [[29, oz + 2], [24, oz - 3]]) {
    let x = s < 0 ? 0 : c.sx - 1; while (x !== ox && !c.filled(x, y + 1, z)) x -= s;
    for (const [dy, dz] of [[0, 0], [1, 0], [2, 1], [2, -1]]) c.set(x, y + dy, z + dz, AQUA);
  }
  c.joint('fx', [ox, 28, oz + 10], 'body');
  return c.build('flyer');
}
void INK;
