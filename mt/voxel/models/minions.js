// mt/voxel/models/minions.js — lane minions with team colour slots: Grubling (horned beetle, melee), Spitwing
// (fuzzy bat-moth, ranged), Shellram (armoured siege ram). Owner: voxel character design. Identity from the sprite art:
// team-coloured shell / wings / saddle armour, dark plum bodies, ivory horns, yellow eyes.
import { Canvas, mix, hash3 } from './rig.js';
import { legs4, patch, shadeBody, INK } from './parts.js';

const TEAMC = {
  blue: { main: 0x3b7cf0, dark: 0x2a4fb8, accent: 0x9fd4ff },
  red: { main: 0xe8483a, dark: 0xb02c34, accent: 0xffc08a },
  null: { main: 0x9a8a6a, dark: 0x6a5a44, accent: 0xe8d8b0 },
};
const tc = (o) => TEAMC[o.team] || TEAMC.blue;
const EYE = 0xffe070;

// ------------------------------------------------------------------------------------------------ Grubling (≈ 0.8 m)
export function minion_grubling(o = {}) {
  const T = tc(o), BODY = 0x3a3450, LEG = 0x5a4a6a, HORN = 0xe8d8b8;
  const c = new Canvas(22, 10, 22), ox = c.ox, oz = c.oz;
  c.part('body').rbox(ox, 3.6, oz - 0.5, 3.4, 1.8, 4.2, BODY, 2.4);
  // domed team shell (wing cases) with a centre seam and an accent rim
  c.rbox(ox, 5.0, oz - 1.0, 3.9, 2.4, 4.4, T.main, 2.2);
  c.shade((x, y, z, col) => (col !== T.main ? null : y <= 3 ? T.dark : (x === ox - 1 || x === ox) && y >= 6 ? T.dark : y === 6 && hash3(x, y, z, 1) < 0.0 ? null : null));
  c.shade((x, y, z, col) => (col === T.main && y >= 6 && hash3(x, y, z, 2) < 0.1 ? T.accent : null));
  // middle legs (static)
  for (const s of [-1, 1]) c.tube([ox + s * 3, 3, oz - 0.5], [ox + s * 6, 0.5, oz - 0.5], 0.6, 0.5, LEG);
  shadeBody(c, 1, 8);
  c.joint('body', [ox, 2, oz]);
  // four jointed legs splayed out
  for (const [nm, s, z, dz] of [['legFR', -1, oz + 2, 1.5], ['legFL', 1, oz + 2, 1.5], ['legBR', -1, oz - 3, -1.5], ['legBL', 1, oz - 3, -1.5]]) {
    c.part(nm);
    c.tube([ox + s * 2.6, 3, z], [ox + s * 5, 3.4, z + dz], 0.6, 0.55, LEG);
    c.tube([ox + s * 5, 3.4, z + dz], [ox + s * 5.6, 0.4, z + dz * 1.4], 0.55, 0.45, LEG);
    c.joint(nm, [ox + s * 2.6, 3, z], 'body');
  }
  c.part('head').rbox(ox, 3.6, oz + 4.4, 2.2, 1.7, 1.6, BODY, 2.4);
  c.tube([ox, 4.6, oz + 5.2], [ox, 7.6, oz + 6.6], 0.8, 0.45, HORN);          // horn
  c.set(ox - 2, 4, oz + 5, EYE).set(ox + 1, 4, oz + 5, EYE);
  c.set(ox - 1, 3, oz + 6, mix(HORN, BODY, 0.5)).set(ox, 3, oz + 6, mix(HORN, BODY, 0.5));   // mandibles
  c.joint('head', [ox, 3.5, oz + 3], 'body');
  return c.build('quadruped');
}

// ------------------------------------------------------------------------------------------------ Spitwing (≈ 0.9 m, hovers)
export function minion_spitwing(o = {}) {
  const T = tc(o), FUZZ = 0xd8c4a4, FUZZD = 0x8a6e5a, BONE = 0x4a3a4a;
  const c = new Canvas(30, 14, 16), ox = c.ox, oz = c.oz;
  c.part('body').rbox(ox, 6.4, oz, 2.4, 2.6, 3.0, FUZZ, 2.2);
  c.shade((x, y, z, col) => (y <= 5 || hash3(x, y, z, 4) < 0.2 ? FUZZD : null));
  c.joint('body', [ox, 4, oz]);
  c.part('head').rbox(ox, 9.4, oz + 1.6, 2.4, 2.0, 2.0, FUZZ, 2.6);
  c.set(ox - 2, 9, oz + 3, EYE).set(ox + 1, 9, oz + 3, EYE).set(ox - 2, 10, oz + 3, INK).set(ox + 1, 10, oz + 3, INK);
  c.set(ox - 1, 8, oz + 3, FUZZD).set(ox, 8, oz + 3, FUZZD);                  // spit snout
  for (const s of [-1, 1]) { c.tube([ox + s * 1, 11, oz + 1.6], [ox + s * 2.6, 13.2, oz + 2.2], 0.6, 0.55, BONE); c.set(ox + s * 2.6, 13.4, oz + 2.2, EYE); }   // antennae
  c.joint('head', [ox, 8, oz + 1], 'body');
  // team wings with accent eye-spots and dark bones
  c.part('wingR');
  for (let i = 0; i < 3; i++) c.tube([ox - 2, 7.6, oz], [ox - 11 + i * 1.4, 10.6 - i * 3.4, oz - 1 - i * 0.6], 0.5, 0.35, BONE);
  for (let u = 0; u <= 1; u += 0.05) for (let v = 0; v <= 1 - u; v += 0.05) {
    const A = [ox - 2, 7.6, oz], B = [ox - 11, 10.6, oz - 1], C = [ox - 8.2, 3.8, oz - 2.2], w = 1 - u - v;
    const P = [0, 1, 2].map((k) => A[k] * w + B[k] * u + C[k] * v);
    c.set(P[0], P[1], P[2], Math.hypot(u - 0.42, v - 0.3) < 0.13 ? EYE : u + v > 0.8 ? T.dark : T.main);
  }
  c.joint('wingR', [ox - 2, 7.6, oz], 'body');
  c.mirrorPart('wingR', 'wingL');
  c.part('tail').tube([ox, 5, oz - 2.6], [ox, 3.6, oz - 4.6], 0.9, 0.5, FUZZD);
  c.joint('tail', [ox, 5, oz - 2.5], 'body');
  return c.build('flyer');
}

// ------------------------------------------------------------------------------------------------ Shellram (≈ 1.2 m)
export function minion_shellram(o = {}) {
  const T = tc(o), WOOL = 0xf2ead8, WOOLD = 0xd8ccb4, FACE = 0x4a3a40, HORN = 0xd8c49a, HORND = 0x9a8462, HOOF = 0x2e2630, METAL = 0xc8ccd8;
  const c = new Canvas(24, 14, 26), ox = c.ox, oz = c.oz;
  c.part('body').rbox(ox, 6.4, oz - 1, 4.0, 3.4, 5.0, (X, Y, Z) => (hash3(X, Y, Z, 6) < 0.3 ? WOOLD : WOOL), 2.2);
  // team saddle armour with metal rim
  c.rbox(ox, 9.0, oz - 1.2, 3.6, 1.4, 3.6, T.main, 3);
  c.shade((x, y, z, col) => (col === T.main && (y <= 8 || Math.abs(z - (oz - 1.2)) > 3) ? METAL : col === T.main && y >= 10 && x === ox ? T.dark : null));
  shadeBody(c, 3, 11, 0.1);
  c.joint('body', [ox, 4, oz]);
  legs4(c, { xOff: 1.2, zF: oz + 2, zB: oz - 4.5, len: 3, top: 5, w: 2, d: 2, col: FACE, paw: HOOF });
  c.part('head').rbox(ox, 7.4, oz + 6.2, 2.6, 2.4, 2.4, FACE, 2.6);
  c.rbox(ox, 9.6, oz + 5.6, 2.6, 1.0, 2.0, WOOL, 2.6);                      // fleece cap
  c.box(ox - 1, 8, oz + 8, ox, 9, oz + 8, METAL);                            // ram plate
  c.front(ox - 2, 7, EYE); c.front(ox + 1, 7, EYE);
  for (const s of [-1, 1]) {                                                  // curled horns
    let px = ox + s * 2.4, py = 8.8, pz = oz + 5.0;
    for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 1.6; const nx = ox + s * (3.0 + Math.sin(a) * 2.0), ny = 7.6 + Math.cos(a) * 2.0, nz = oz + 4.4 - Math.sin(a * 0.5) * 1.8; c.tube([px, py, pz], [nx, ny, nz], 0.95 - k * 0.04, 0.9 - k * 0.04, k % 3 === 0 ? HORND : HORN); px = nx; py = ny; pz = nz; }
  }
  c.joint('head', [ox, 7, oz + 3], 'body');
  c.part('tail').sphere(ox, 7, oz - 6, 1.1, WOOL);
  c.joint('tail', [ox, 7, oz - 5.5], 'body');
  return c.build('quadruped');
}
void patch;
