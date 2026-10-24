// mt/render/painter/index.js — thin adapter from the mt layer to the procedural pixel-art library in
// game/art/sprites (owner: art agent). The old placeholder painter is gone; sprites.js draws straight from the
// art library. HUD / UI code should import from here (or from game/art/sprites/index.js directly).
//
//   portraitCanvas(formIdOrArtId, {size=96, bg=true})  -> <canvas> HUD portrait (element-tinted round backdrop)
//   abilityIconCanvas(line, slot, size=40)              -> <canvas>  slot: 'basic' | 'a1' | 'a2'
//   trainerIconCanvas(name, size=40)                    -> <canvas>  name: rally|mend|surge|capture|potion|swap|evolve|recall
//   specSkillIcon(spec, size)                           -> <canvas>  attack->Rally, healing->Mend, magic->Surge
//   typeBadgeCanvas(type, h=16)  typeIconCanvas(type, size=16)
//   showcaseCanvas(artId, {scale})                      -> <canvas> large native re-raster (victory / collection screens)
//   trainerArtId(spec, team) / minionArtId(subtype, team)
// All results are cached per argument set (they are pure functions of their inputs).

import {
  SPECIES_ART, renderPortrait, renderShowcase, renderIconCanvas, renderBadgeCanvas, renderElementIconCanvas, ABILITY_NAMES,
} from '../../../art/sprites/index.js';

const cache = new Map();
const memo = (k, f) => { let v = cache.get(k); if (!v) { v = f(); cache.set(k, v); } return v; };

export const trainerArtId = (spec, team) => `trainer_${spec}_${team === 1 ? 'red' : 'blue'}`;
export const minionArtId = (subtype, team) => `${{ melee: 'grubling', caster: 'spitwing', siege: 'shellram', super: 'shellram' }[subtype] || 'grubling'}_${team === 1 ? 'red' : 'blue'}`;

export function portraitCanvas(id, o = {}) {
  if (!SPECIES_ART[id]) return null;
  return memo(`p|${id}|${o.size || 96}|${o.bg !== false}`, () => renderPortrait(id, { size: o.size || 96, bg: o.bg }));
}
export function abilityIconCanvas(line, slot, size = 40) { return memo(`a|${line}|${slot}|${size}`, () => renderIconCanvas(`${line}/${slot}`, size)); }
export function trainerIconCanvas(name, size = 40) { return memo(`t|${name}|${size}`, () => renderIconCanvas(`trainer/${name}`, size)); }
export function specSkillIcon(spec, size = 40) { return trainerIconCanvas({ attack: 'rally', healing: 'mend', magic: 'surge' }[spec] || 'rally', size); }
export function typeBadgeCanvas(type, h = 16) { return memo(`b|${type}|${h}`, () => renderBadgeCanvas(type, h)); }
export function typeIconCanvas(type, size = 16) { return memo(`i|${type}|${size}`, () => renderElementIconCanvas(type, size)); }
export function showcaseCanvas(id, o = {}) { return memo(`s|${id}|${o.scale || 0}`, () => renderShowcase(id, o)); }
export function abilityName(line, slot) { return ABILITY_NAMES[`${line}/${slot}`] || ''; }
export { SPECIES_ART };
