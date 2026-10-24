// mt/data/balance.js — every gameplay number from DESIGN.md that is not species/ability/type data. Pure data.
// Owner: balance specialist. If you change a number here, change DESIGN.md in the same commit.
// Display names (specs, skills, minions, boss) live in mt/i18n/strings/*.js and are exposed here as getters.

import { localizeRecord, t } from '../i18n/index.js';

export const TEAM_SIZE = 3;

/** DESIGN §3 Trainers */
export const TRAINER = {
  hp: 620, hpPerAvgLevel: 40, armor: 20, mr: 20, moveSpeed: 3.6,
  attack: { damage: 22, range: 5.5, interval: 1.1 },
  maxParty: 2,
  benchRegenPct: 0.03,          // benched monster regen, fraction of max HP per second
  swapTime: 0.6, swapCooldown: 8,
  swapBurst: { duration: 2.5, attackSpeedPct: 0.25, msPct: 0.2 }, // "incoming monster enters with a short burst"
  potion: { healPct: 0.30, duration: 2, cooldown: 22 },
  respawn: { base: 6, perAvgLevel: 1.6, max: 30 },
  leash: 7,                     // pets try to stay within this distance of their trainer
  teleportLeash: 22,            // beyond this the pet is snapped next to its trainer (recall, long dashes...)
  catchupSpeedMult: 1.35,       // pet move-speed multiplier while lagging beyond the leash
};

/** DESIGN §3 Specialisations. Skill cooldown is shared. */
export const SPEC_SKILL_CD = 28;
export const SPECS = {
  attack: {
    id: 'attack',
    passive: { physicalDmg: 0.18, attackSpeed: 0.12, lifesteal: 0.06 },
    rally: { attackSpeedPct: 0.35, msPct: 0.15, duration: 5 },
  },
  healing: {
    id: 'healing',
    passive: { maxHp: 0.15, def: 0.15, oocRegenMult: 2, trainerHp: 0.20 },
    mend: { monsterHealPct: 0.24, trainerHealPct: 0.20 },
  },
  magic: {
    id: 'magic',
    passive: { mag: 0.20, cooldown: 0.20, strong: 1.65, atkAbilityDmg: 0.10 }, // atkAbilityDmg: ATK-scaled abilities +10 %
    surge: { bonus: 0.60, fieldDuration: 3, window: 8 },
  },
};
export const SPEC_IDS = ['attack', 'healing', 'magic'];
// display names (spec `name`, skill name `skill`) are getters into mt/i18n: `spec.<id>`, `skill.<id>`
for (const id of SPEC_IDS) { localizeRecord(SPECS[id], 'spec.' + id); Object.defineProperty(SPECS[id], 'skill', { get: () => t('skill.' + id), enumerable: true }); }

/** DESIGN §5 stat scaling. INTERPRETATION: "+8 %/level multiplicative on base" = base × (1 + 0.08 × (L−1)). */
export const MONSTER_SCALING = {
  perLevel: 0.08,
  stageMult: 1.35,              // per evolution step, cumulative (Final = 1.35²)
  scaled: ['hp', 'atk', 'def', 'mag'], // AS, SPD, range are not level-scaled
  oocRegenPct: 0.01,            // out-of-combat regen, fraction of max HP / s (×2 with Healing spec)
  oocDelay: 5,
  mass: 3,                      // separation mass (legacy monster default is 8)
  windupFrac: 0.3,
  projectileSpeed: 18,
};

/** DESIGN §6 Capture */
export const CAPTURE = {
  range: 9, travel: 0.45, cooldown: 5,
  pMin: 0.03, pMax: 0.97, hpExponent: 1.3, floor: 0.08,
  statusBonus: 0.1, levelPenalty: 0.25, levelPenaltyAbove: 3,
  wobbleInterval: 0.6,           // seconds per wobble (1–3 wobbles, each one hidden roll)
  absorbTime: 0.5,               // orb hit -> first wobble
  failAngry: { duration: 3, attackSpeedPct: 0.2 },
  confirmWindow: 3,              // party full: press again within 3 s to replace the bench
  targetPickRadius: 2.5,         // capture at a ground point picks the nearest wild monster within this radius
};

/** DESIGN §7 Leveling & XP */
export const XP = {
  maxLevel: 13,
  toNext: (L) => 80 + 45 * (L - 1),
  benchShare: 0.3,
  participationRadius: 9, participationWindow: 6,
  killerSoloShare: 0.6,          // INTERPRETATION: 2 participants -> killer 60 %, other 40 %; 1 -> 100 %
  killerBonus: 0.2,              // ≥3 participants -> equal split, killer +20 %
  minion: { melee: 14, caster: 12, siege: 28, super: 28 },
  wild: (lvl) => 40 + 10 * lvl,
  boss: 220,
  enemyMonster: (victimLv, killerLv) => 120 * Math.min(2.2, Math.max(0.25, 1 + 0.3 * (victimLv - killerLv))),
  enemyTrainer: 70,
  tower: 90,
  comeback: { bonus: 0.15, gap: 1.5 },
};

/** DESIGN §8 Evolution */
export const EVOLUTION = { channel: 2.4, damageTaken: 0.5 };

/** DESIGN §9 Minions. Legacy subtypes are kept (melee/caster/siege/super) so the legacy creeps renderer still draws them. */
export const MINIONS = {
  first: 30, interval: 30, siegeEvery: 3,
  types: {
    melee: { hp: 480, ad: 14, range: 1.1 },
    caster: { hp: 290, ad: 22, range: 5 },
    siege: { hp: 900, ad: 40, range: 6.5, structureMult: 2.5 },
    super: { hp: 1500, ad: 60, range: 1.4, structureMult: 1.5 },
  },
  perWave: 0.03, perWaveCap: 0.6,
};
for (const [k, v] of Object.entries(MINIONS.types)) localizeRecord(v, 'minion.' + k); // name -> mt/i18n `minion.<kind>`

/** DESIGN §10 Structures */
export const STRUCTURES = { rampPerShot: 0.25, rampCap: 2.0 };

/** DESIGN §11 Death */
export const FAINT = { base: 8, perLevel: 1.2 };

/** DESIGN §12 Jungle */
export const JUNGLE = {
  startLevel: 1, levelEvery: 90, maxLevel: 9, respawn: 50, firstSpawn: 0,
  twoMonstersFromLevel: 4,       // habitats spawn 1 monster, 2 from this wild level on ("1–2")
  meadowLevel: 1,
  meadowDamageMult: 0.5,         // INTERPRETATION of "safe first captures"
  boss: { buffDmg: 0.15, buffDuration: 90 },        // name: getter -> mt/i18n `boss.name`
};
localizeRecord(JUNGLE.boss, 'boss.name');
