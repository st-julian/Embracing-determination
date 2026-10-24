// mt/data/types.js — elemental type chart (DESIGN.md §4). Pure data + pure functions; no DOM, no world.
// Owner: combat/balance specialist. Shared read-only by sim, AI, render and UI.

import { t } from '../i18n/index.js';

/** @typedef {'fire'|'water'|'grass'|'electric'|'earth'|'wind'} MonsterType */

/** @type {MonsterType[]} */
export const TYPES = ['fire', 'water', 'grass', 'electric', 'earth', 'wind'];

/** Display colours (UI/sprites). Hex strings, sRGB. */
export const TYPE_COLORS = {
  fire: '#f0803c',
  water: '#4f8fe8',
  grass: '#5cb848',
  electric: '#f5cf2c',
  earth: '#b08850',
  wind: '#8fd6d0',
};

/** Localized type names (getters -> mt/i18n `type.<id>`). */
export const TYPE_NAMES = {};
for (const ty of TYPES) Object.defineProperty(TYPE_NAMES, ty, { get: () => t('type.' + ty), enumerable: true });

/**
 * Legacy renderer element palette key per type (vfx `Bt`, audio `cast_<el>`/`burst_<el>`, palette.element).
 * The legacy palette has: light arcane earth shadow water fire frost nature storm.
 */
export const LEGACY_ELEMENT = {
  fire: 'fire', water: 'water', grass: 'nature', electric: 'storm', earth: 'earth', wind: 'frost',
};

/** Attacker type -> { strong: defender types hit ×STRONG, resisted: defender types hit ×RESISTED }. DESIGN §4 table. */
export const CHART = {
  fire: { strong: ['grass', 'wind'], resisted: ['water', 'earth', 'fire'] },
  water: { strong: ['fire', 'earth'], resisted: ['grass', 'water'] },
  grass: { strong: ['water', 'earth'], resisted: ['fire', 'wind', 'grass'] },
  electric: { strong: ['water', 'wind'], resisted: ['earth', 'electric', 'grass'] },
  earth: { strong: ['electric', 'fire'], resisted: ['grass', 'wind'] },
  wind: { strong: ['grass', 'earth'], resisted: ['electric'] },
};

export const STRONG = 1.5;
export const STRONG_MAGIC_SPEC = 1.65;
export const RESISTED = 0.67;
export const CLAMP_MIN = 0.45;
export const CLAMP_MAX = 2.25;

/**
 * Attack multiplier = product over defender types, clamped [0.45, 2.25].
 * Typeless attacker or defender (minions, towers, trainers) => 1.
 * @param {MonsterType|null|undefined} attackType
 * @param {MonsterType[]|null|undefined} defenderTypes
 * @param {number} [strong=STRONG] strong multiplier (1.65 with Magic spec)
 * @returns {number}
 */
export function typeMultiplier(attackType, defenderTypes, strong = STRONG) {
  if (!attackType || !defenderTypes || !defenderTypes.length) return 1;
  const row = CHART[attackType];
  if (!row) return 1;
  let m = 1;
  for (const d of defenderTypes) {
    if (row.strong.includes(d)) m *= strong;
    else if (row.resisted.includes(d)) m *= RESISTED;
  }
  return m < CLAMP_MIN ? CLAMP_MIN : m > CLAMP_MAX ? CLAMP_MAX : m;
}

/** 'super' | 'weak' | null — the damage-number tag for a multiplier. */
export function effectivenessTag(mult) {
  return mult > 1.001 ? 'super' : mult < 0.999 ? 'weak' : null;
}
