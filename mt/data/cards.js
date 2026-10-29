// mt/data/cards.js — trainer CARDS (the card-battle layer, docs/DESIGN.md §16): card table, default decks per spec and
// the hand / mana rules. Pure data. Owner: gameplay & pacing. Sim: mt/sim/cards.js. Strings: i18n `card.<id>.name|desc`.
//
// CONTRACT (UI / netplay build against this):
//   CARDS[id] = { cost, kind: 'spell'|'summon'|'trap'|'buff', target: 'none'|'self'|'unit'|'point', range, icon,
//                 element?, spec: 'attack'|'healing'|'magic'|null, nameKey: 'card.<id>.name', descKey: 'card.<id>.desc' }
//               (+ the effect numbers the sim reads: dmg / dmgPerLv / radius / delay / duration / ...)
//   DECKS[spec] = 20 card ids (the default deck of a trainer with that specialisation; deck editing comes later)
//   CARD_RULES  = { hand, show, mana, mulligans, mulliganMax, takedownMana, ... }
// `range` is in metres from the trainer (0 = on the trainer); `target` 'unit' = an enemy trainer / monster / minion or a
// wild monster; 'point' = a ground point (clamped to range); 'none' / 'self' = no aim.
// Damage cards scale with the trainer's level (= its average monster level): dmg + dmgPerLv × (level − 1), magic damage.

/** Hand / mana rules (user design: 10 cards dealt, 3 redraws, 10 mana, 5 cards shown, refill at base). */
export const CARD_RULES = Object.freeze({
  hand: 10,          // cards in hand after a base visit
  show: 5,           // the first `show` hand cards are castable (slots 0..4); a played card's slot takes hand[show]
  mana: 10,          // mana max (full on every base visit; no regen in the field)
  mulligans: 3,      // redraw charges at match start
  mulliganMax: 6,    // cap (charges are earned: CARD_RULES.chargeTakedown / chargeTower)
  takedownMana: 2,   // mana per takedown credit (kill or assist on an enemy trainer), capped at the max
  chargeTakedown: 1, // + redraw charges per takedown credit
  chargeTower: 1,    // + redraw charges for EVERY trainer of a team whose side destroyed an enemy tower
  playCd: 0.6,       // s between two card plays of one trainer (deny 'cooldown')
  deckSize: 20,
});

const C = (id, cost, kind, target, range, icon, extra = {}) => Object.freeze({
  id, cost, kind, target, range, icon, element: null, spec: null, nameKey: 'card.' + id + '.name', descKey: 'card.' + id + '.desc', ...extra,
});

/** 16 cards. Effects: mt/sim/cards.js EFFECTS (same ids). */
export const CARDS = Object.freeze({
  // --- support
  heal: C('heal', 2, 'spell', 'none', 0, 'heal', { element: 'grass', healPct: 0.25 }),                      // trainer + active monster
  shield: C('shield', 2, 'buff', 'self', 0, 'shield', { element: 'water', shieldPct: 0.2, duration: 4 }),     // trainer + active monster
  haste: C('haste', 2, 'buff', 'none', 12, 'haste', { element: 'wind', msPct: 0.3, duration: 4 }),             // allied trainers + monsters within range
  power: C('power', 2, 'buff', 'none', 0, 'power', { element: 'fire', damagePct: 0.25, attackSpeedPct: 0.15, duration: 6 }), // my monster
  lure: C('lure', 1, 'buff', 'self', 0, 'lure', { bonus: 0.2, duration: 30 }),                                 // next orb: +catch chance
  bulwark: C('bulwark', 4, 'buff', 'none', 14, 'tower', { element: 'earth', shieldPct: 0.15, duration: 6 }),   // nearest allied structure in range
  ward: C('ward', 1, 'summon', 'point', 6, 'ward'),                                                            // vision ward (legacy ward, 90 s)
  dash: C('dash', 1, 'spell', 'point', 6, 'dash', { element: 'wind' }),                                        // the trainer blinks up to range
  summon: C('summon', 3, 'summon', 'point', 6, 'minion', { count: 2 }),                                        // 2 allied melee minions on the nearest lane
  // --- damage / control
  bolt: C('bolt', 2, 'spell', 'unit', 8, 'bolt', { element: 'electric', dmg: 70, dmgPerLv: 8 }),
  blast: C('blast', 3, 'spell', 'point', 8, 'blast', { element: 'fire', dmg: 50, dmgPerLv: 6, radius: 3 }),
  trap: C('trap', 2, 'trap', 'point', 8, 'trap', { element: 'earth', dmg: 40, dmgPerLv: 5, radius: 2.5, delay: 1.5, root: 1.25 }),
  meteor: C('meteor', 5, 'spell', 'point', 9, 'meteor', { element: 'fire', dmg: 110, dmgPerLv: 12, radius: 3.5, delay: 1 }),
  // --- the specs' old signature skills (Rally / Mend / Surge, DESIGN §3), one per default deck
  rally: C('rally', 3, 'buff', 'none', 0, 'rally', { element: 'fire', spec: 'attack' }),
  mend: C('mend', 3, 'spell', 'none', 0, 'mend', { element: 'grass', spec: 'healing' }),
  surge: C('surge', 3, 'buff', 'none', 0, 'surge', { element: 'electric', spec: 'magic' }),
});
export const CARD_IDS = Object.keys(CARDS);

const deck = (counts) => Object.freeze(Object.entries(counts).flatMap(([id, n]) => Array(n).fill(id)));
/** Default 20-card deck per spec (the spec's signature card ×3). */
export const DECKS = Object.freeze({
  attack: deck({ rally: 3, bolt: 3, blast: 2, power: 2, dash: 2, heal: 2, shield: 1, trap: 1, summon: 1, haste: 1, lure: 1, meteor: 1 }),
  healing: deck({ mend: 3, heal: 3, shield: 3, haste: 2, bulwark: 2, summon: 2, ward: 1, trap: 1, bolt: 1, lure: 1, dash: 1 }),
  magic: deck({ surge: 3, bolt: 3, blast: 3, trap: 2, meteor: 2, power: 1, heal: 2, ward: 1, lure: 1, dash: 1, shield: 1 }),
});
