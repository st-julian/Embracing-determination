// mt/data/abilities.js — monster ability numbers (DESIGN.md §5 "Abilities"). Pure data + pure formulas.
// Owner: combat specialist. Executed by mt/sim/combat.js (`castMonsterAbility`), keyed by `kind`.
//
// Damage = (base + ratio × stat) × (1 + LEVEL_SCALING × (level − 1)) [× Surge] → then the normal damage pipeline:
// type multiplier (mt elementMult), mt damage scalars (spec / structures / Galeclaw / evolving), armour or MR.
// `stat` is 'mag' (→ unit.stats.ap) or 'atk' (→ unit.stats.ad). Cooldowns in seconds, distances in metres.
// A1 is available from Juvenile, A2 unlocks at Evolved, `final` lists upgrades merged into `extra` at the Final form.

import { localizeRecord } from '../i18n/index.js';

export const ABILITY_LEVEL_SCALING = 0.06; // +6 %/level

/**
 * @typedef {Object} AbilityDef
 * @property {string} id
 * @property {string} name    localized display name (getter -> mt/i18n `ability.<id>`)
 * @property {string} kind    implementation key in mt/sim/combat.js
 * @property {'skillshot'|'ground'|'unit'|'self'|'dash'} aim  how a cast is aimed (manual + AI)
 * @property {number} cd
 * @property {number} range   cast range (m); 0 = self-centred
 * @property {number} [base]  damage base
 * @property {number} [ratio] damage ratio
 * @property {'mag'|'atk'} [stat]
 * @property {'physical'|'magic'} [dmgType]
 * @property {string} ai      auto-cast strategy (mt/sim/combat.js AI table):
 *   'poke' skillshot damage · 'aoe_ground' best cluster point · 'aoe_self' enemies around self · 'chain' unit target,
 *   'cc_shot' crowd-control skillshot (peel divers first) · 'engage' gap-close on heroes / finish low targets ·
 *   'execute' dash-strike, prefers kills (reset) · 'siege' charge (also on structures) · 'heal' self/ally low HP ·
 *   'tank' defensive buff while focused
 * @property {string} desc    one-line tooltip (HUD), localized getter -> mt/i18n `ability.<id>.desc`
 * @property {Object} [extra] kind-specific numbers
 */

export const ABILITIES = {
  fire: {
    a1: { id: 'ember_volley', kind: 'volley', aim: 'skillshot', cd: 7, range: 7.5, base: 60, ratio: 0.9, stat: 'mag', dmgType: 'magic', ai: 'poke',
      extra: { count: 3, spread: 0.55, speed: 15, width: 0.45, repeatMult: 0.35 } },
    a2: { id: 'flame_pillar', kind: 'pillar', aim: 'ground', cd: 12, range: 7, base: 120, ratio: 1.4, stat: 'mag', dmgType: 'magic', ai: 'aoe_ground',
      extra: { radius: 2.5, delay: 0.6, burnPct: 0.25, burnDuration: 3 } },
    final: {
      a1: { count: 5, spread: 0.8 },
      a2: { field: { duration: 3, interval: 0.5, tickPct: 0.07, burnPct: 0.08 } },
    },
  },
  water: {
    a1: { id: 'bubble_jet', kind: 'line', aim: 'skillshot', cd: 7, range: 8, base: 70, ratio: 0.8, stat: 'mag', dmgType: 'magic', ai: 'poke',
      extra: { slow: 0.3, slowDuration: 1.5, speed: 19, width: 0.7, pierce: false } },
    a2: { id: 'tidal_mend', kind: 'mend', aim: 'self', cd: 14, range: 0, ai: 'heal',
      extra: { healPct: 0.18, shieldPct: 0.10, shieldDuration: 4 } },
    final: {
      a1: { pierce: true },
      a2: { healTrainer: true, splash: 6, splashPct: 0.5 },
    },
  },
  grass: {
    a1: { id: 'vine_lash', kind: 'lash', aim: 'skillshot', cd: 9, range: 6.5, base: 60, ratio: 0.7, stat: 'atk', dmgType: 'physical', ai: 'cc_shot',
      extra: { root: 0.9, pull: 2.0, pullTime: 0.22, speed: 22, width: 0.6 } },
    a2: { id: 'thorn_bulwark', kind: 'bulwark', aim: 'self', cd: 15, range: 0, ai: 'tank',
      extra: { defPct: 0.4, duration: 4, reflect: 0.2 } },
    final: {
      a1: { root: 1.3 },
      a2: { taunt: 1.5, tauntRadius: 4.5 },
    },
  },
  electric: {
    a1: { id: 'spark_bolt', kind: 'chain', aim: 'unit', cd: 6, range: 7, base: 55, ratio: 0.8, stat: 'mag', dmgType: 'magic', ai: 'chain',
      extra: { targets: 3, bounce: 4.5, falloff: 0.85, linkDelay: 0.06 } },
    a2: { id: 'static_dash', kind: 'dash_stun', aim: 'dash', cd: 11, range: 6, base: 40, ratio: 0.4, stat: 'mag', dmgType: 'magic', ai: 'engage',
      extra: { distance: 6, stun: 0.6, duration: 0.25, hitWidth: 0.9 } },
    final: {
      a1: { targets: 5 },
      a2: { trail: { duration: 3, interval: 0.5, width: 1.1, base: 12, ratio: 0.15, slow: 0.2, slowDuration: 0.6 } },
    },
  },
  earth: {
    a1: { id: 'rock_slam', kind: 'slam', aim: 'self', cd: 9, range: 2.2, base: 70, ratio: 1.0, stat: 'atk', dmgType: 'physical', ai: 'aoe_self',
      extra: { radius: 2, knockup: 0.6 } },
    a2: { id: 'quake_charge', kind: 'charge', aim: 'dash', cd: 13, range: 7, base: 50, ratio: 0.6, stat: 'atk', dmgType: 'physical', ai: 'siege',
      extra: { distance: 7, structureBonus: 0.8, structureBonusDuration: 4, duration: 0.35, hitWidth: 1.2 } },
    final: {
      a1: { radius: 3 },
      a2: { stun: 0.8 },
    },
  },
  wind: {
    a1: { id: 'gale_slash', kind: 'dash_strike', aim: 'unit', cd: 8, range: 5, base: 65, ratio: 1.0, stat: 'atk', dmgType: 'physical', ai: 'execute',
      extra: { distance: 5, overshoot: 1.2, resetOnKill: true, resetCd: 0.4, duration: 0.2, hitWidth: 1.0, hits: 1, secondHitMult: 0.6, secondHitDelay: 0.18 } },
    a2: { id: 'cyclone', kind: 'cyclone', aim: 'self', cd: 13, range: 2.5, base: 25, ratio: 0.3, stat: 'atk', dmgType: 'physical', ai: 'aoe_self',
      extra: { radius: 2.5, ticks: 4, duration: 2 } },
    final: {
      a1: { hits: 2 },
      a2: { pull: 0.9, pullTime: 0.15 },
    },
  },
};

// display names + tooltips come from mt/i18n (strings/en.js, ja.js), keyed by ability id
for (const L of Object.values(ABILITIES)) for (const slot of ['a1', 'a2']) if (L[slot]) localizeRecord(L[slot], 'ability.' + L[slot].id, 'ability.' + L[slot].id + '.desc');

/** Magic-spec Surge: the next ability deals +60 % and leaves an elemental field (DESIGN §3). Element riders per line. */
export const SURGE_FIELD = {
  radius: 2.2, duration: 3, interval: 0.5,
  base: 8, ratio: 0.1,                       // per tick: (base + ratio × MAG) × level scaling
  rider: {
    fire: { burnPct: 1.0, burnDuration: 1.5 },          // ignites (burn = 1 tick worth over 1.5 s)
    water: { slow: 0.3, slowDuration: 0.6 },
    grass: { slow: 0.2, slowDuration: 0.6, allyHealPct: 0.01 },
    electric: { dmgMult: 1.5, slow: 0.15, slowDuration: 0.6 },
    earth: { slow: 0.4, slowDuration: 0.6 },
    wind: { pull: 0.35 },
  },
};


/**
 * Resolved ability for a line + stage: merges the Final upgrade into `extra`.
 * @param {string} lineId
 * @param {'a1'|'a2'} slot
 * @param {number} stage
 * @returns {AbilityDef|null} null if locked (A2 before Evolved)
 */
export function abilityFor(lineId, slot, stage) {
  const L = ABILITIES[lineId]; if (!L) return null;
  if (slot === 'a2' && stage < 1) return null;
  const a = L[slot]; if (!a) return null;
  if (stage >= 2 && L.final && L.final[slot]) return { ...a, extra: { ...a.extra, ...L.final[slot] }, upgraded: true };
  return a;
}

/**
 * Pure ability damage formula (before type multiplier, damage scalars and mitigation).
 * @param {{base?:number, ratio?:number}} def
 * @param {number} stat   ATK or MAG of the caster (unit.stats.ad / .ap)
 * @param {number} level
 * @param {number} [surgeBonus=0] e.g. 0.6 while a Magic-spec Surge is pending
 */
export function abilityDamageRaw(def, stat, level, surgeBonus = 0) {
  if (!def || !def.base) return 0;
  return (def.base + (def.ratio || 0) * stat) * (1 + ABILITY_LEVEL_SCALING * ((level || 1) - 1)) * (1 + surgeBonus);
}

/** Legacy armour / MR mitigation multiplier (identical to the bundle's `dv`): 100 / (100 + R), negative R amplifies. */
export function mitigation(resist) {
  return resist >= 0 ? 100 / (100 + resist) : 2 - 100 / (100 - resist);
}
