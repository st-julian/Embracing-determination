// mt/voxel/models/trainers_hd.js — high-detail "voxel Black/White" trainers at CHAR_M (1/25 m): ~44 voxels tall, BW
// overworld-trainer proportions (head ≈ 38 % of the height, slim body, long-ish legs). Original designs in the BW
// design language: layered eyes (lid line, white, 2-tone iris, pupil, highlight), brows, small mouth, cheek shade,
// sculpted 3-tone hair locks, a jacket with collar / zipper / cuffs / pockets, a messenger bag with strap, sneakers
// with soles + laces, a team cap with an original emblem. Every material is a 5-tone hue-shifted ramp (the sprite
// library's makeRamp); tones are baked from the surface normal (sky from above, rotation-invariant) and the
// runtime adds the sun + the BW outline. Owner: voxel character design.
import { Canvas } from './rig.js';
import { makeRamp } from '../../../art/sprites/color.js';
import { CHAR_M } from '../kit.js';
import { bakeBands } from './bake.js';

const H2I = (h) => parseInt(h.replace('#', ''), 16);
const TH = [-0.38, 0.08, 0.6, 0.88];

/** a canvas whose voxels carry a MATERIAL (string -> shaded ramp) or a fixed colour (number) */
class MatCanvas extends Canvas {
  constructor(w, h, d, mats) {
    super(w, h, d);
    this.mi = new Uint8Array(this.v.length);
    this.mlist = [null]; this.mramp = [null]; this.mhi = [false];
    for (const [k, v] of Object.entries(mats)) this.addMat(k, v);
  }
  addMat(name, v) {
    const d = typeof v === 'string' ? { c: v } : v;
    const r = d.ramp || makeRamp(d.c, d).ramp;
    this.mlist.push(name); this.mramp.push(r.map(H2I)); this.mhi.push(!!d.hi);
    return this.mlist.length - 1;
  }
  set(x, y, z, c) {
    x = Math.floor(x); y = Math.floor(y); z = Math.floor(z);
    if (!this.inside(x, y, z)) return this;
    let col = typeof c === 'function' ? c(x, y, z) : c;
    if (col === undefined) return this;                 // undefined = leave as is, null = carve
    let m = 0;
    if (typeof col === 'string') { m = this.mlist.indexOf(col); if (m < 0) throw new Error('mat ' + col); col = this.mramp[m][2]; }
    super.set(x, y, z, col);
    this.mi[this.idx(x, y, z)] = col == null ? 0 : m;
    return this;
  }
  /** shade(): a string result re-materials the voxel, a number paints a fixed colour (kept by the bake) */
  shade(fn, any = false) {
    return super.shade((x, y, z, col) => {
      const r = fn(x, y, z, col); if (r == null) return r;
      const i = this.idx(x, y, z);
      if (typeof r === 'string') { const m = this.mlist.indexOf(r); this.mi[i] = m; return this.mramp[m][2]; }
      this.mi[i] = 0; return r;
    }, any);
  }
  recolor(x, y, z, c) { super.recolor(x, y, z, c); if (typeof c === 'number') this.mi[this.idx(x, y, z)] = 0; return this; }
  surfZ(x, y, zFrom = this.sz - 1) { for (let z = zFrom; z >= 0; z--) if (this.filled(x, y, z)) return z; return -1; }
  front(x, y, c, depth = 1, zFrom = this.sz - 1) {
    for (let z = zFrom; z >= 0; z--) if (this.filled(x, y, z)) {
      for (let k = 0; k < depth; k++) if (this.filled(x, y, z - k)) { this.recolor(x, y, z - k, c); this.mi[this.idx(x, y, z - k)] = typeof c === 'string' ? this.mlist.indexOf(c) : 0; if (typeof c === 'string') this.v[this.idx(x, y, z - k)] = (1 << 24) | this.mramp[this.mlist.indexOf(c)][2]; }
      return z;
    }
    return -1;
  }
  /** clean BW bands (shared baker): 3 tones per material, skin flat + bright with one shade underneath */
  bake() {
    const N = this.v.length, occ = new Uint8Array(N), mat = new Uint8Array(N), col = new Uint32Array(this.v);
    for (let i = 0; i < N; i++) if (this.v[i]) { occ[i] = 1; mat[i] = this.mi[i]; }
    const mode = this.mlist.map((n) => (n === 'skin' ? 'skin' : undefined));
    bakeBands({ w: this.sx, h: this.sy, d: this.sz, occ, mat, ramps: this.mramp, col, mode, gloss: this.mhi, bias: this.mlist.map((n) => this.mbias?.[this.mlist.indexOf(n)] || 0), cleanMat: false });
    this.v.set(col);
    return this;
  }
  /** shade a material inside an ellipsoid with a darker / lighter tone offset (creases, folds) */
  tone(name, off, fn) {
    const m = this.mlist.indexOf(name);
    this.mbias = this.mbias || {};
    this.mbias[m] = (this.mbias[m] || 0) + off;
    void fn;
  }
}

export const TEAMS = {
  blue: { main: '#2f66d8', light: '#5a94f4', trim: '#f4f6fc' },
  red: { main: '#d6343a', light: '#f06a5a', trim: '#f4f6fc' },
  null: { main: '#5a9a5a', light: '#86c27a', trim: '#f4f6fc' },
};
const SKINS = ['#f3cfae', '#e9b48c', '#c98a5e', '#9a6440', '#6e4430'];
const HAIRS = ['#3a2a34', '#6a3e24', '#e2b84e', '#c2582a', '#e6e2f2', '#2a3a6a'];
const EYES = ['#3a2a5a', '#2a5a8a', '#3a6a3a', '#7a4a2a'];

// ------------------------------------------------------------------------------------------------ shared kid
/**
 * Body plan (voxels): shoes 0–3, legs to 14, torso 14–26, neck 25–27, head 26–43 (≈ 17 = 39 %), hair / cap to ~47.
 * Returns the canvas + key coordinates; spec builders add hair, headwear, outfit details and accessories.
 */
function kid(o, look, H = 54) {
  const T = TEAMS[o.team] || TEAMS.blue;
  const mats = {
    skin: { c: look.skin }, hair: { c: look.hair, hi: true }, team: { c: T.main, hi: true }, teamL: { c: T.light }, trim: { c: T.trim, dark: 0.7 },
    pants: { c: look.pants }, shoe: { c: look.shoe, dark: 0.75 }, sole: { c: '#4a4658' }, bag: { c: look.bag || '#e4a93c' }, strap: { c: '#7a4a2a' },
    gold: { c: '#ffc83a', hi: true }, belt: { c: '#2e2a38' }, cream: { c: '#f4ead2', dark: 0.75 }, leaf: { c: '#5ccf4a' }, wood: { c: '#8a5a3a' }, top: { c: look.top || T.main, hi: true },
  };
  const c = new MatCanvas(34, H, 26, mats), ox = c.ox, oz = c.oz;
  // ---- legs: slim pants, rolled cuffs, sneakers (sole, midsole, toe cap, team stripe, laces)
  for (const [nm, s] of [['legR', -1], ['legL', 1]]) {
    const lx = ox + s * 2.4;
    c.part(nm);
    c.rbox(lx, 9.4, oz - 0.2, 1.9, 5.4, 2.0, 'pants', 4);
    c.rbox(lx, 4.6, oz - 0.2, 2.15, 0.9, 2.25, 'pants', 3);                         // rolled cuff
    c.rbox(lx, 1.8, oz + 0.7, 2.25, 1.8, 3.3, 'shoe', 3);                           // shoe body
    c.shade((x, y, z) => (y === 0 ? H2I('#4a4658') : undefined));                    // outsole
    c.shade((x, y, z) => { const i = c.idx(x, y, z); if (y === 0) c.mi[i] = c.mlist.indexOf('sole'); return null; });
    c.shade((x, y, z, col) => (y === 1 && c.mi[c.idx(x, y, z)] === c.mlist.indexOf('shoe') ? 0xf8f8fc : null));   // midsole stripe
    for (let z = oz - 1; z <= oz + 2; z++) c.side(z, 2, H2I(T.main), s);              // outer team stripe
    for (const [dz, dx] of [[0, -1], [1, 0], [2, -1]]) c.set(Math.floor(lx) + dx, 3.4, oz + dz + 0.5, 0x2a2a3a);   // laces
    c.joint(nm, [lx, 14, oz - 0.2], 'body');
  }
  // ---- torso: jacket, belt, hem, collar, zipper, pockets
  c.part('body');
  c.rbox(ox, 15.0, oz - 0.3, 4.4, 1.4, 2.6, 'pants', 3);                           // hips
  c.box(ox - 4, 14, oz - 2, ox + 3, 14, oz + 2, 'belt');
  c.rbox(ox, 20.4, oz - 0.3, 5.2, 6.2, 3.2, 'top', 4.2);                           // jacket
  c.shade((x, y) => (y === 15 || y === 16 ? H2I(T.trim) : null));                     // hem band
  return { c, T, ox, oz };
}
function finishKid(c, o, T, look, ox, oz, extra = {}) {
  c.part('body');
  // collar: stand-up, open at the front
  for (let a = 0; a < 40; a++) { const t = a / 40 * Math.PI * 2; if (Math.sin(t) > 0.72) continue; for (const y of [25, 26]) c.set(ox + Math.cos(t) * 3.6, y, oz - 0.4 + Math.sin(t) * 2.9, extra.collar || 'trim'); }
  // zipper: light line down the centre + gold pull
  if (extra.zip !== false) { for (let y = 16; y <= 25; y++) c.front(ox - 1, y, 0xdcdfe8), c.front(ox, y, extra.zipDark ?? H2I(makeRamp(T.main).ramp[1])); c.front(ox - 1, 22, 0xffc83a); }
  // pockets: flap lines + darker pocket mouths on both sides
  if (extra.pockets !== false) for (const s of [-1, 1]) { const x0 = s < 0 ? ox - 4 : ox + 2; for (let x = x0; x < x0 + 2; x++) { c.front(x, 19, H2I(makeRamp(T.main).ramp[0])); c.front(x, 18, H2I(makeRamp(T.main).ramp[1])); } }
  // ---- arms: sleeves with a trim stripe, white cuffs, mitten hands with a thumb
  for (const [nm, s] of [['armR', -1], ['armL', 1]]) {
    c.part(nm);
    const sx = ox + s * 6.1;
    c.tube([sx, 24.4, oz - 0.3], [sx + s * 0.9, 16.6, oz + 0.4], 1.7, extra.bell ? 2.3 : 1.45, extra.sleeve || 'top');
    c.tube([sx + s * 0.9, 16.4, oz + 0.4], [sx + s * 1.0, 15.4, oz + 0.5], extra.bell ? 2.4 : 1.65, extra.bell ? 2.3 : 1.6, extra.cuff || 'trim');      // cuff
    c.rbox(sx + s * 1.0, 13.3, oz + 0.5, 1.45, 1.7, 1.45, 'skin', 3);                                 // hand
    c.set(sx + s * 0.2, 13.6, oz + 2.2, 'skin');                                                       // thumb
    if (extra.armStripe !== false) for (let y = 17; y <= 24; y++) c.side(oz - 0, y, H2I(T.trim), s);   // outer stripe
    c.joint(nm, [sx, 24.6, oz - 0.3], 'body');
  }
  // ---- neck + head
  c.part('body'); c.cylinder(ox, oz - 0.5, 25, 27, 1.7, 1.6, 'skin');
  c.part('head');
  c.rbox(ox, 35.0, oz + 0.2, 8.1, 8.2, 7.3, 'skin', 2.7);                          // cranium
  c.ellipsoid(ox, 31.0, oz + 1.0, 7.0, 4.6, 6.4, 'skin');                          // soft cheeks / chin
  for (const s of [-1, 1]) c.rbox(ox + s * 8.2, 33, oz + 0.4, 0.9, 1.6, 1.3, 'skin', 2);   // ears
  c.joint('head', [ox, 27, oz - 0.4], 'body');
  return { ox, oz };
}
/** BW-style face: tall dark oval eyes with one white highlight (upper-left), thin brows, a tiny mouth line */
function face(c, look, o = {}) {
  const ox = c.ox, zf = c.oz + 9;
  const EYE = 0x2a2236, BR = H2I(makeRamp(look.hair).ramp[1]), MO = H2I(makeRamp(look.skin).ramp[0]);
  for (const x0 of [ox - 4, ox + 2]) {
    for (let y = 30; y <= 33; y++) for (let x = x0; x <= x0 + 1; x++) c.front(x, y, EYE, 1, zf);
    c.front(x0, 33, 0xffffff, 1, zf);                                                      // single highlight
    c.front(x0, 35, BR, 1, zf); c.front(x0 + 1, 35, BR, 1, zf);                             // brow
  }
  if (o.fierce) { c.front(ox - 2, 34, BR, 1, zf); c.front(ox + 1, 34, BR, 1, zf); }     // inner brow ends dip
  c.front(ox - 1, 28, MO, 1, zf); c.front(ox, 28, MO, 1, zf);                             // tiny mouth line
}

// ------------------------------------------------------------------------------------------------ Striker (Attack)
export function trainer_attack_hd(o = {}) {
  const v = o.variant | 0;
  const look = { skin: v ? SKINS[(v + 1) % SKINS.length] : '#f0c49c', hair: v ? HAIRS[(v * 2) % HAIRS.length] : '#4a3024', eye: EYES[v % EYES.length], pants: '#3a3f5c', shoe: '#f4f4f8', bag: '#e4a93c' };
  const { c, T, ox, oz } = kid(o, look);
  finishKid(c, o, T, look, ox, oz);
  // messenger bag on the left hip + strap across the chest (right shoulder -> left hip), gold buckle
  c.part('body');
  for (let k = 0; k <= 14; k++) { const t = k / 14, x = ox - 4.4 + t * 8.6, y = 25 - t * 9.4; for (const zz of [3.3, -3.6]) c.set(x, y, oz + zz + (zz > 0 ? (y > 21 ? 0.2 : 0) : 0), 'strap'); }
  c.rbox(ox + 5.8, 16.2, oz - 0.6, 1.5, 2.8, 3.2, 'bag', 3);
  c.rbox(ox + 6.4, 17.6, oz - 0.6, 0.9, 1.5, 3.3, 'strap', 3);                        // flap
  c.set(ox + 7.2, 16.4, oz + 0.2, 'gold');
  // hair: dark spiky locks escaping the cap (back + sides), fringe under the brim
  c.part('head');
  c.shade((x, y, z, col) => (y >= 37.5 || (z < oz - 2.4 && y >= 30) || ((x <= ox - 7 || x >= ox + 6) && y >= 35 && z < oz + 3) ? H2I(look.hair) : null));
  c.shade((x, y, z) => { const i = c.idx(x, y, z); if ((c.v[i] & 0xffffff) === H2I(look.hair)) c.mi[i] = c.mlist.indexOf('hair'); return null; });
  const lock = (a, b, r0, r1) => c.tube(a, b, r0, r1, 'hair');
  for (const [x, y, z, dx, dy, dz, r] of [
    [-5.5, 37.5, -4.5, -2.4, 1.8, -2.6, 2.6], [0, 38.5, -6.2, 0, 1.6, -3.0, 2.8], [5.5, 37.5, -4.5, 2.4, 1.8, -2.6, 2.6],
    [-7.4, 34.5, -2.5, -2.4, 0.4, -1.8, 2.2], [7.4, 34.5, -2.5, 2.4, 0.4, -1.8, 2.2], [-3.2, 34.5, -6.2, -1.2, -1.6, -2.2, 2.3], [3.2, 34.5, -6.2, 1.2, -1.6, -2.2, 2.3],
    [-7.9, 37.6, 2.4, -1.6, -0.8, 0.6, 1.8], [7.9, 37.6, 2.4, 1.6, -0.8, 0.6, 1.8], [0, 34, -7, 0, -2.2, -1.2, 2.2],
  ]) lock([ox + x, y, oz + z], [ox + x + dx, y + dy, oz + z + dz], r, 1.0);
  for (const [x, dx] of [[-5.6, -1.2], [-2.6, -0.4], [2.0, 0.6], [5.0, 1.2]]) lock([ox + x, 39.4, oz + 6.2], [ox + x + dx, 37.2, oz + 7.4], 1.5, 0.9);   // fringe
  for (const s of [-1, 1]) {                                                                // side locks framing the face
    lock([ox + s * 7.0, 38.5, oz + 3.6], [ox + s * 7.6, 30.5, oz + 4.6], 1.9, 1.1);
    lock([ox + s * 7.6, 37.5, oz + 1.2], [ox + s * 8.3, 31.5, oz + 1.6], 1.7, 1.0);
  }
  // team cap: dome with panel seams, button, curved brim (darker underside), original emblem (winged spark roundel)
  c.part('head');
  c.rbox(ox, 39.8, oz - 0.3, 8.6, 4.6, 8.0, (x, y) => (y >= 39 ? 'team' : undefined), 2.4);
  c.shade((x, y, z, col) => { const i = c.idx(x, y, z); return c.mi[i] === c.mlist.indexOf('team') && Math.abs(x + 0.5 - ox) < 0.6 && y > 41 ? H2I(T.light) : null; });
  c.sphere(ox, 44.6, oz - 0.3, 1.0, 'teamL');
  for (let z = 6; z <= 9; z++) for (let x = -7; x <= 7; x++) { const e = (x / 7.4) ** 2 + ((z - 5.5) / 4.0) ** 2; if (e > 1) continue; c.set(ox + x, 39.4, oz + z, 'team'); }   // short brim: no shadow over the eyes
  // original emblem: a white rising half-sun with a gold dot
  const EM = ['..WWW..', '.WWWWW.', 'WWWWWWW', 'WWWGWWW'];
  EM.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '.') c.front(ox - 4 + i, 44 - j, ch === 'G' ? 0xffc83a : 0xf8f8fc, 1, oz + 9); }));
  face(c, look, { fierce: true, smirk: true });
  c.tone('hair', 0.08);
  c.bake();
  // one soft shade under the cap brim on the face
  { const sk = c.mramp[c.mlist.indexOf('skin')]; c.part('head'); c.shade((x, y, z, col) => (y === 37 && z > oz + 2 && (col & 0xffffff) === (sk[3] & 0xffffff) ? sk[2] : undefined)); }
  return { ...c.build('biped'), size: CHAR_M };
}

// ------------------------------------------------------------------------------------------------ Mender (Healing)
/** field medic: wide cream sun hat with a leaf band, auburn pigtails with team ribbons, white shirt with team
 *  stripes, brown trousers + boots, a cream herb satchel with an original leaf-in-a-ring emblem */
export function trainer_healing_hd(o = {}) {
  const v = o.variant | 0;
  const look = { skin: v ? SKINS[v % SKINS.length] : '#f6d0ae', hair: v ? HAIRS[(v * 2 + 3) % HAIRS.length] : '#c05c2a', eye: EYES[(v + 2) % EYES.length], pants: '#6a5242', shoe: '#7a4a32', bag: '#efe2c4', top: '#f4f2ec' };
  const { c, T, ox, oz } = kid(o, look);
  finishKid(c, o, T, look, ox, oz, { zip: false, pockets: false, collar: 'team', armStripe: false, cuff: 'team' });
  c.part('body');
  c.shade((x, y, z) => { const i = c.idx(x, y, z); return c.mi[i] === c.mlist.indexOf('top') && (y === 18 || y === 19 || y === 22 || y === 23) ? 'team' : undefined; });
  for (const y of [20, 24]) c.front(ox - 1, y, H2I(makeRamp(T.main).ramp[0]));                    // buttons
  // satchel: strap from the left shoulder across to the right hip, bag with emblem
  for (let k = 0; k <= 14; k++) { const t = k / 14, x = ox + 4.4 - t * 8.6, y = 25 - t * 9.4; for (const zz of [3.3, -3.6]) c.set(x, y, oz + zz, 'strap'); }
  c.rbox(ox - 6.0, 16.0, oz - 0.4, 1.6, 2.9, 3.3, 'bag', 3);
  c.rbox(ox - 6.6, 17.6, oz - 0.4, 0.9, 1.4, 3.4, 'cream', 3);
  const LEAF = ['.GGG.', 'G.L.G', 'GLLLG', 'G.L.G', '.GGG.'];
  LEAF.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '.') c.side(oz - 2 + i, 18 - j, ch === 'G' ? H2I(T.main) : 0x4cbf44, -1); }));
  // hair: cap shading + side-swept fringe + two low pigtails with team ribbons
  c.part('head');
  c.shade((x, y, z) => ((y >= 38 || (z < oz - 2.4 && y >= 29) || ((x <= ox - 7 || x >= ox + 6) && y >= 33 && z < oz + 3)) ? 'hair' : undefined));
  const lock = (a, b, r0, r1) => c.tube(a, b, r0, r1, 'hair');
  for (const [x, dx] of [[-5.8, -1.0], [-3, -0.6], [0, 0.4], [3.4, 1.6]]) lock([ox + x, 40.6, oz + 6.2], [ox + x + dx * 1.6, 37.6, oz + 7.6], 1.6, 0.9);
  for (const s of [-1, 1]) {
    lock([ox + s * 7.4, 37, oz + 2.6], [ox + s * 7.9, 31, oz + 3.6], 1.8, 1.1);
    c.sphere(ox + s * 7.8, 31.5, oz - 4.4, 1.6, 'team');                                            // ribbon knot
    lock([ox + s * 8.0, 31.5, oz - 4.6], [ox + s * 8.8, 24.5, oz - 3.8], 2.3, 1.4);                 // pigtail
    c.sphere(ox + s * 8.9, 23.8, oz - 3.6, 1.3, 'hair');
  }
  // wide sun hat: crown + green leaf band + brim raised at the front (keeps the face in the light)
  c.cylinder(ox, oz - 0.4, 42, 46, 6.6, 6.4, 'cream');
  c.ellipsoid(ox, 46, oz - 0.4, 6.0, 1.6, 5.8, 'cream');
  c.cylinder(ox, oz - 0.4, 42, 43, 6.8, 6.6, 'leaf');
  for (let z = -12; z <= 12; z++) for (let x = -11; x <= 11; x++) {
    const r = Math.hypot(x / 11, z / 10.5); if (r > 1 || r < 0.5) continue;
    const yy = 41.4 + (z > 0 ? z * 0.18 : z * 0.08) * (r - 0.4);
    c.set(ox + x, yy, oz - 0.4 + z, r > 0.93 ? 'trim' : 'cream');
  }
  c.set(ox + 5.6, 43.5, oz + 3.6, 'leaf').set(ox + 6.2, 44.2, oz + 3.2, 'leaf').set(ox + 5, 44.4, oz + 4.2, 0xff8cc2).set(ox + 5.4, 45, oz + 4, 0xffe066);
  face(c, look, { smile: true });
  c.tone('hair', 0.08);
  c.bake();
  return { ...c.build('biped'), size: CHAR_M };
}

// ------------------------------------------------------------------------------------------------ Mystic (Magic)
/** stargazer: tall drooping team hat with a gold band + star, long pale hair, team robe with gold hem / placket /
 *  sash, bell sleeves, dark tights + boots, crystal staff with a gold crescent in the right hand */
export function trainer_magic_hd(o = {}) {
  const v = o.variant | 0;
  const look = { skin: v ? SKINS[(v + 2) % SKINS.length] : '#a8704e', hair: v ? HAIRS[(v * 2 + 4) % HAIRS.length] : '#d4c8f4', eye: EYES[(v + 1) % EYES.length], pants: '#2c2840', shoe: '#3a2c46', top: null };
  const { c, T, ox, oz } = kid(o, look, 66);
  c.addMat('crystal', { c: '#5fe0e8', hi: true });
  finishKid(c, o, T, look, ox, oz, { zip: false, pockets: false, collar: 'gold', armStripe: false, bell: true, cuff: 'gold' });
  // robe skirt flaring over the thighs (body: it stays put while the legs swing beneath), gold hem
  c.part('body');
  for (let y = 7; y <= 15; y++) { const f = (15 - y) / 8, rx = 4.6 + f * 2.0, rz = 2.9 + f * 1.4; c.cylinder(ox, oz - 0.3, y, y, rx, rz, y <= 8 ? 'gold' : 'top'); }
  c.shade((x, y, z) => (y === 14 && c.mi[c.idx(x, y, z)] !== c.mlist.indexOf('top') ? undefined : undefined));
  for (let y = 9; y <= 25; y++) c.front(ox - 1, y, 0xffc83a), c.front(ox, y, 0xd8962a);           // gold placket
  c.cylinder(ox, oz - 0.3, 14, 15, 5.4, 3.4, 'gold');                                              // sash
  c.front(ox - 1, 15, 0x5fe0e8); c.front(ox, 15, 0x9ff4f8);                                      // clasp gem
  // long hair down the back and over the shoulders
  c.part('head');
  c.shade((x, y, z) => ((y >= 37.5 || (z < oz - 2 && y >= 27) || ((x <= ox - 7 || x >= ox + 6) && y >= 31 && z < oz + 4)) ? 'hair' : undefined));
  const lock = (a, b, r0, r1) => c.tube(a, b, r0, r1, 'hair');
  for (const [x, dx] of [[-5, -1.4], [-2, -0.6], [1.4, 0.6], [4.6, 1.4]]) lock([ox + x, 40.4, oz + 6.2], [ox + x + dx, 37.2, oz + 7.5], 1.5, 0.9);
  for (const s of [-1, 1]) lock([ox + s * 7.2, 37, oz + 2.8], [ox + s * 7.6, 25.5, oz + 3.4], 1.9, 1.4);   // locks over the shoulders
  c.part('body');
  for (const x of [-4.5, -1.5, 1.5, 4.5]) c.tube([ox + x, 30, oz - 6.2], [ox + x * 1.15, 14, oz - 5.0], 2.0, 1.5, 'hair');  // hair down the back
  // tall pointed hat: brim, gold band, cone drooping back at the tip, gold star on the front
  c.part('head');
  for (let z = -10; z <= 10; z++) for (let x = -9; x <= 9; x++) { const r = Math.hypot(x / 9, z / 8.6); if (r <= 1) c.set(ox + x, 41.6 + (z > 0 ? z * 0.06 : 0), oz - 0.4 + z, r > 0.9 ? 'teamL' : 'top'); }
  for (let k = 0; k <= 19; k++) { const t = k / 19, r = 5.8 * (1 - t) + 0.6, dz = -Math.max(0, t - 0.55) * 9, dy = -Math.max(0, t - 0.75) * 4; c.cylinder(ox, oz - 0.4 + dz, Math.round(42 + k + dy), Math.round(42 + k + dy), r, r, k < 2 ? 'gold' : 'top'); }
  const STAR = ['..G..', '.GGG.', 'GGGGG', '.G.G.'];
  STAR.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '.') c.front(ox - 3 + i, 48 - j, 0xffd84a, 1, oz + 8); }));
  // crystal staff in the right hand (part of the arm)
  c.part('armR');
  const sx = Math.round(ox - 6.1 - 1.6), sz = oz + 3;
  for (let y = 1; y <= 29; y++) c.set(sx, y, sz, y < 3 ? 'gold' : 'wood');
  for (let a = 0; a < 14; a++) { const t = a / 13 * Math.PI * 1.25 - Math.PI * 0.1; c.set(sx + Math.cos(t) * 2.6, 31 + Math.sin(t) * 2.6, sz, 'gold'); }
  c.ellipsoid(sx + 0.5, 32.5, sz + 0.5, 1.5, 2.3, 1.5, 'crystal');
  face(c, look, {});
  c.tone('hair', 0.06);
  c.bake();
  return { ...c.build('biped'), size: CHAR_M };
}
