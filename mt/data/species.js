// mt/data/species.js — the 6 monster lines × 3 forms (DESIGN.md §5). Pure data.
// Owner: balance specialist (numbers) / art specialist (visual hints only: `look`).
//
// Stats are the Level-1 Juvenile base. Scaling rules live in balance.js (MONSTER_SCALING) and are applied by
// mt/sim/monsters.js `computeMonsterStats`.
// Display names are NOT stored here: `form.name` / STAGE_NAMES[i] are getters into mt/i18n (keys `form.<id>`,
// `stage.<i>`; English in mt/i18n/strings/en.js, Japanese in ja.js). Ids are the stable keys.

import { localizeRecord, t } from '../i18n/index.js';

/**
 * @typedef {Object} FormDef
 * @property {string} id       stable key, also the sim unit `subtype` (never collides with legacy creep keys)
 * @property {string} name   localized display name (getter -> mt/i18n `form.<id>`)
 * @property {number} stage    0 Juvenile, 1 Evolved, 2 Final
 * @property {string[]} types  MonsterType[]; types[0] is the primary type (basic attacks + abilities)
 * @property {number} height   world metres (sprite height; also unit.height for anchors/bars)
 * @property {number} radius   collision radius
 * @property {number} evolveLevel  level needed to evolve INTO the next form (Infinity for Final)
 *
 * @typedef {Object} LineDef
 * @property {string} id       line id == primary type
 * @property {FormDef[]} forms
 * @property {{hp:number,atk:number,def:number,mag:number,spd:number,as:number,range:number}} base
 * @property {number} catch    catch rate
 * @property {string} role
 * @property {boolean} ranged
 * @property {number} structureBonus extra damage multiplier vs structures (Earth +40 %)
 * @property {Object} look     palette hints for the placeholder painter
 */

/** @type {Record<string, LineDef>} */
export const LINES = {
  fire: {
    id: 'fire', role: 'ranged burst mage', ranged: true, catch: 0.9, structureBonus: 0,
    base: { hp: 430, atk: 34, def: 18, mag: 44, spd: 3.7, as: 0.85, range: 5.0 },
    forms: [
      { id: 'cindle', stage: 0, types: ['fire'] },
      { id: 'pyrovix', stage: 1, types: ['fire'] },
      { id: 'infernyx', stage: 2, types: ['fire', 'wind'] },
    ],
    look: { body: '#f07a34', belly: '#ffd27a', accent: '#c8361e', shape: 'lizard' },
  },
  water: {
    id: 'water', role: 'sustain bruiser', ranged: false, catch: 0.9, structureBonus: 0,
    base: { hp: 560, atk: 30, def: 26, mag: 34, spd: 3.4, as: 0.80, range: 1.8 },
    forms: [
      { id: 'puddlet', stage: 0, types: ['water'] },
      { id: 'tidalon', stage: 1, types: ['water'] },
      { id: 'abyssaur', stage: 2, types: ['water'] },
    ],
    look: { body: '#4a8fe6', belly: '#bfe4ff', accent: '#24508f', shape: 'frog' },
  },
  grass: {
    id: 'grass', role: 'tank / zone', ranged: false, catch: 1.0, structureBonus: 0,
    base: { hp: 600, atk: 30, def: 30, mag: 30, spd: 3.3, as: 0.75, range: 1.8 },
    forms: [
      { id: 'sproutle', stage: 0, types: ['grass'] },
      { id: 'fernhorn', stage: 1, types: ['grass'] },
      { id: 'verdantusk', stage: 2, types: ['grass', 'earth'] },
    ],
    look: { body: '#5cb848', belly: '#d9f0a0', accent: '#2f7a2c', shape: 'quad' },
  },
  electric: {
    id: 'electric', role: 'fast ranged DPS', ranged: true, catch: 0.8, structureBonus: 0,
    base: { hp: 400, atk: 36, def: 16, mag: 40, spd: 4.1, as: 1.00, range: 4.5 },
    forms: [
      { id: 'sparkit', stage: 0, types: ['electric'] },
      { id: 'voltail', stage: 1, types: ['electric'] },
      { id: 'thundrix', stage: 2, types: ['electric', 'wind'] },
    ],
    look: { body: '#f5cf2c', belly: '#fff3b0', accent: '#3a3a52', shape: 'fox' },
  },
  earth: {
    id: 'earth', role: 'siege bruiser', ranged: false, catch: 0.9, structureBonus: 0.4,
    base: { hp: 640, atk: 40, def: 34, mag: 18, spd: 3.1, as: 0.70, range: 1.8 },
    forms: [
      { id: 'pebbit', stage: 0, types: ['earth'] },
      { id: 'bouldash', stage: 1, types: ['earth'] },
      { id: 'terracore', stage: 2, types: ['earth'] },
    ],
    look: { body: '#a88452', belly: '#d8c39a', accent: '#5e4a30', shape: 'golem' },
  },
  wind: {
    id: 'wind', role: 'diver / assassin', ranged: false, catch: 0.75, structureBonus: 0,
    base: { hp: 440, atk: 38, def: 18, mag: 32, spd: 4.3, as: 0.95, range: 2.0 },
    forms: [
      { id: 'zephlet', stage: 0, types: ['wind'] },
      { id: 'galeon', stage: 1, types: ['wind'] },
      { id: 'tempestral', stage: 2, types: ['wind', 'water'] },
    ],
    look: { body: '#9adcd4', belly: '#f2fffd', accent: '#3f8f9a', shape: 'bird' },
  },
};

/** Form heights per stage (DESIGN §8: ~0.9 / 1.3 / 1.8 m) and collision radii. */
export const STAGE_HEIGHT = [0.9, 1.3, 1.8];
export const STAGE_RADIUS = [0.45, 0.6, 0.8];
/** Level needed to evolve FROM stage i to stage i+1 (DESIGN §8). */
export const EVOLVE_LEVEL = [5, 10, Infinity];
/** Localized stage names (index = stage). */
export const STAGE_NAMES = [0, 1, 2].map(() => '');
for (let i = 0; i < 3; i++) Object.defineProperty(STAGE_NAMES, i, { get: () => t('stage.' + i), enumerable: true });

/** @type {Record<string, FormDef & {line:string}>} formId -> form (with line id) */
export const FORMS = {};
for (const line of Object.values(LINES)) {
  for (const f of line.forms) {
    f.height = STAGE_HEIGHT[f.stage];
    f.radius = STAGE_RADIUS[f.stage];
    f.evolveLevel = EVOLVE_LEVEL[f.stage];
    f.line = line.id;
    localizeRecord(f, 'form.' + f.id);
    FORMS[f.id] = f;
  }
}

export const LINE_IDS = Object.keys(LINES);

/** @returns {(FormDef & {line:string})|null} */
export function formOf(formId) { return FORMS[formId] || null; }
/** @returns {LineDef|null} */
export function lineOf(formId) { const f = FORMS[formId]; return f ? LINES[f.line] : null; }
/** Next form id or null if Final. */
export function nextFormId(formId) {
  const f = FORMS[formId]; if (!f) return null;
  const n = LINES[f.line].forms[f.stage + 1];
  return n ? n.id : null;
}
/** Juvenile form id of a line. */
export function juvenileOf(lineId) { return LINES[lineId] ? LINES[lineId].forms[0].id : null; }
