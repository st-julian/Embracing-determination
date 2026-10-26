// mt/voxel/models/index.js — every voxel character builder, keyed by the sim's form / unit ids. Owner: voxel
// character design. Rig contract (see rig.js): build({ team: 'blue'|'red'|null, variant, shiny }) ->
// { anim: 'biped'|'quadruped'|'flyer'|'serpent'|'floater', parts: { name: { model, pivot, at, parent? } }, height, radius }
// Units: voxels (rig.size m each: CHAR_M for the high-detail set); unit frame = feet centre on the ground, +y up, facing
// +z; character LEFT = +x.
// Baked: the sprite-voxelised forms take 0.4–11 s to build live, so tools/voxel-bake.mjs pre-builds every model into
// assets/voxel-models/characters.vxb (baked.js codec). `await ready()` fetches it once; MODELS[id](opts) then decodes
// the baked rig (same contract, ~1 ms) and falls back to the live builder (LIVE[id]) when an id / team / variant has
// no bake (or ?voxbake=0).
import { cindle, pyrovix, infernyx } from './fire.js';
import { puddlet, tidalon, abyssaur } from './water.js';
import { sproutle, fernhorn, verdantusk } from './grass.js';
import { trainer_attack, trainer_healing, trainer_magic } from './trainers.js';
import { sparkit, voltail, thundrix } from './electric.js';
import { pebbit, bouldash, terracore } from './earth.js';
import { zephlet, galeon, tempestral } from './wind.js';
import { minion_grubling, minion_spitwing, minion_shellram } from './minions.js';
import { boss_galeclaw } from './boss.js';
import { HD } from './hd.js';

/** low-res (VOXEL_M, chunky) set — superseded by the high-detail builders below where they exist */
export const LOWRES = {
  trainer_attack, trainer_healing, trainer_magic,
  cindle, pyrovix, infernyx, puddlet, tidalon, abyssaur, sproutle, fernhorn, verdantusk,
  sparkit, voltail, thundrix, pebbit, bouldash, terracore, zephlet, galeon, tempestral,
  minion_grubling, minion_spitwing, minion_shellram, boss_galeclaw,
};

/** display / lineup order */
export const ORDER = ['trainer_attack', 'trainer_healing', 'trainer_magic', 'cindle', 'pyrovix', 'infernyx', 'puddlet', 'tidalon', 'abyssaur',
  'sproutle', 'fernhorn', 'verdantusk', 'sparkit', 'voltail', 'thundrix', 'pebbit', 'bouldash', 'terracore', 'zephlet', 'galeon', 'tempestral',
  'minion_grubling', 'minion_spitwing', 'minion_shellram', 'boss_galeclaw'];

/** the live builders: high-detail (CHAR_M, `size` on the rig) where built, low-res otherwise */
import { trainer_attack_hd, trainer_healing_hd, trainer_magic_hd } from './trainers_hd.js';
import { openBundle, decodeRig } from './baked.js';
export const LIVE = { ...LOWRES, ...HD, trainer_attack: trainer_attack_hd, trainer_healing: trainer_healing_hd, trainer_magic: trainer_magic_hd };

// ------------------------------------------------------------------------------------------------ baked bundle
export const BAKE_URL = new URL('../../../assets/voxel-models/characters.vxb', import.meta.url);
let BUNDLE = null, readyP = null;
export const stats = { baked: 0, live: 0, decodeMs: 0, loadMs: 0, bytes: 0, error: null, calls: [] };
async function loadBytes() {
  const node = typeof window === 'undefined' && typeof process !== 'undefined' && process.versions && process.versions.node;
  if (node) { const fs = await import('node:fs'); const { fileURLToPath } = await import('node:url'); return new Uint8Array(fs.readFileSync(fileURLToPath(BAKE_URL))); }
  const r = await fetch(BAKE_URL); if (!r.ok) throw new Error('HTTP ' + r.status); return new Uint8Array(await r.arrayBuffer());
}
/** fetch + open the baked bundle once (resolves even when it is missing: MODELS then builds live) */
export function ready() {
  if (readyP) return readyP;
  let off = false; try { off = typeof location !== 'undefined' && new URLSearchParams(location.search).get('voxbake') === '0'; } catch (e) { off = false; }
  if (off || (typeof globalThis !== 'undefined' && globalThis.VOXEL_LIVE)) return (readyP = Promise.resolve(false));
  const t0 = typeof performance !== 'undefined' ? performance.now() : 0;
  readyP = loadBytes().then((u8) => {
    BUNDLE = openBundle(u8); stats.bytes = u8.length; stats.loadMs = (typeof performance !== 'undefined' ? performance.now() : 0) - t0;
    // warm the decoder's JIT on two small entries so the first in-match decode is already fast
    for (const k of ['minion_spitwing|blue|*', 'cindle|*|*']) { const e = BUNDLE.entries[k]; if (e && !e.alias) decodeRig(BUNDLE, e); }
    return true;
  })
    .catch((e) => { stats.error = String(e && e.message || e); console.warn('[voxel] no baked character bundle, building live:', stats.error); return false; });
  return readyP;
}
export const isBaked = () => !!BUNDLE;
const teamKey = (t) => (t === 'red' ? 'red' : t === 'blue' ? 'blue' : 'null');
export const bakeKey = (id, team, variant) => `${id}|${team}|${variant}`;
function lookup(id, o) {
  if (!BUNDLE) return null;
  const t = teamKey(o.team), v = o.variant | 0;
  for (const k of [bakeKey(id, t, v), bakeKey(id, t, '*'), bakeKey(id, '*', '*')]) {
    let e = BUNDLE.entries[k]; if (e && e.alias) e = BUNDLE.entries[e.alias];
    if (e) return e;
  }
  return null;
}
/** the registry used by the game: baked rig when there is one, else the live builder */
export const MODELS = Object.fromEntries(Object.keys(LIVE).map((id) => [id, (o = {}) => {
  const e = lookup(id, o || {});
  if (e) {
    const t0 = typeof performance !== 'undefined' ? performance.now() : 0, r = decodeRig(BUNDLE, e);
    const dt = (typeof performance !== 'undefined' ? performance.now() : 0) - t0;
    stats.baked++; stats.decodeMs = Math.max(stats.decodeMs, dt); if (stats.calls.length < 64) stats.calls.push([id, Math.round(dt * 100) / 100]);
    return r;
  }
  stats.live++;
  return LIVE[id](o || {});
}]));
