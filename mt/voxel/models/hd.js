// mt/voxel/models/hd.js — high-detail ("voxel Black/White") character builders at CHAR_M (1/25 m per voxel).
// Monsters, minions and the boss are sculpted from their BW sprite rigs (fromsprite.js) at a per-stage voxel height;
// trainers are hand-modelled (trainers_hd.js). Owner: voxel character design.
import { SPECIES_ART } from '../../../art/sprites/index.js';
import { voxelizeForm } from './fromsprite.js';

/** target heights in voxels (1/25 m): juveniles 28–36, evolved 44–56, finals 64–80 */
const TARGET = { 0: 32, 1: 48, 2: 66, minion: 30, boss: 110 };
/** sprite px -> voxel scale per form, fitted offline to the stage heights AND the triangle budgets after greedy
 *  meshing (juveniles / trainers <= 8k, evolved <= 12k, finals <= 16k (Infernyx 20k), minions <= 5k, boss <= 30k):
 *  shapes with a lot of surface get a coarser voxel instead of blowing the budget (the runtime scales every model
 *  to its gameplay height). Regenerate with the fit script described in the voxel report if a sprite rig changes. */
const SCALE = {"cindle":0.8649,"pyrovix":0.9057,"infernyx":0.7095,"puddlet":1.2151,"tidalon":1.063,"abyssaur":0.7431,"sproutle":0.9412,"fernhorn":0.8136,"verdantusk":0.7432,"sparkit":0.8889,"voltail":0.9796,"thundrix":0.677,"pebbit":1.2697,"bouldash":0.9497,"terracore":0.7894,"zephlet":1.1852,"galeon":1.2308,"tempestral":1.0313,"grubling":1.4096,"spitwing":1.3342,"shellram":0.9547,"galeclaw":1.4328};
const scaleCache = new Map(Object.entries(SCALE));
function fit(id, def, variant) {
  if (scaleCache.has(id)) return scaleCache.get(id);
  const S = Object.values(SPECIES_ART).find((q) => q.baseId === id) || SPECIES_ART[id];
  const want = S.kind === 'minion' ? (S.baseId === 'shellram' ? 34 : S.baseId === 'spitwing' ? 42 : TARGET.minion) : S.baseId === 'galeclaw' ? TARGET.boss : TARGET[S.stage ?? 1];
  const probe = voxelizeForm(def, { scale: 1, variant });
  const sc = want / Math.max(1, probe.height);
  scaleCache.set(id, sc);
  return sc;
}
export function hdFromSprite(id, opts = {}) {
  const S = SPECIES_ART[id]; if (!S) throw new Error('no sprite form ' + id);
  const def = S._def, variant = S.variant || (def.variants ? (opts.team === 'red' ? 'red' : def.variants[0]) : undefined);
  return voxelizeForm(def, { scale: fit(S.baseId || id, def, variant), variant, shiny: opts.shiny, mane: S.baseId === 'infernyx' ? ['neck', 'head'] : null, restripe: S.baseId === 'voltail' ? [['body', 'legB'], 'fur', 'stripe', 6, 2, 0.5] : null });
}
export const HD = {};
for (const id of ['cindle', 'pyrovix', 'infernyx', 'puddlet', 'tidalon', 'abyssaur', 'sproutle', 'fernhorn', 'verdantusk', 'sparkit', 'voltail', 'thundrix', 'pebbit', 'bouldash', 'terracore', 'zephlet', 'galeon', 'tempestral'])
  HD[id] = (o) => hdFromSprite(id, o);
export function hdSpriteTrainer(spec, o = {}) {
  const S = SPECIES_ART[`trainer_${spec}_${o.team === 'red' ? 'red' : 'blue'}`];
  const probe = voxelizeForm(S._def, { scale: 1, variant: S.variant });
  return voxelizeForm(S._def, { scale: 44 / probe.height, variant: S.variant, anim: 'biped' });
}

// minions (team variants) + the river boss, through the same voxeliser
for (const [key, base] of [['minion_grubling', 'grubling'], ['minion_spitwing', 'spitwing'], ['minion_shellram', 'shellram']])
  HD[key] = (o = {}) => hdFromSprite(base + '_' + (o.team === 'red' ? 'red' : 'blue'), o);
HD.boss_galeclaw = (o) => hdFromSprite('galeclaw', o);
