// mt/data/options.js — match OPTIONS (difficulty, mode) and the STARTER monsters. Pure data + validation.
// Owner: gameplay & pacing. Rules contract: docs/DESIGN.md §2a (options), §3 (starters), §15 (modes); tuning log and
// measurements: docs/BALANCE.md "Difficulty & pacing".
//
// CONTRACT for UI / lobby / netplay (also in game/mt/README.md "Match options"):
//   app.newMatch({ seed, players, options })      options = { difficulty: 'easy'|'normal'|'hard', mode: 'quick'|'classic',
//                                                             cards: boolean (trainer cards, DESIGN §16; false = the old
//                                                             single trainer skill) }
//   players[i].starter = 'cindle'|'puddlet'|'sproutle'   (the trainer's starter monster; omitted = picked from the seed,
//                        'none' = start with no monster — tests / fixtures only)
//   Missing / invalid fields fall back to DEFAULT_OPTIONS (normalizeOptions never throws). The sim reads the result as
//   `world.mt.rules.options`. Online: the match config (`go`, mt/net/match.js) carries the same options + starters so
//   every peer builds the identical world.
//
// Why (docs/DESIGN.md): playtest feedback "I keep losing / there's no way to fight the first Pokémon to even play /
// with two players it's so much walking on a very spacious map" → starters (no sling-only opening), Easy default
// difficulty (measured win rates), QUICK default mode (mid lane only, faster everything).

import { FORMS, LINES } from './species.js';
import { TYPE_COLORS } from './types.js';
import { abilityFor } from './abilities.js';

export const DIFFICULTY_IDS = ['easy', 'normal', 'hard'];
export const MODE_IDS = ['quick', 'classic'];
export const DEFAULT_OPTIONS = Object.freeze({ difficulty: 'easy', mode: 'classic', cards: true });   // full map with every tower by default (user's call); QUICK = mid-lane-only option

/** Valid options object (a NEW object); unknown / invalid values fall back to DEFAULT_OPTIONS. Never throws. */
export function normalizeOptions(o) {
  const own = (k) => (o && typeof o === 'object' && Object.prototype.hasOwnProperty.call(o, k) ? o[k] : undefined);   // own fields only
  const d = own('difficulty'), m = own('mode'), c = own('cards');
  return {
    difficulty: DIFFICULTY_IDS.includes(d) ? d : DEFAULT_OPTIONS.difficulty,
    mode: MODE_IDS.includes(m) ? m : DEFAULT_OPTIONS.mode,
    cards: typeof c === 'boolean' ? c : DEFAULT_OPTIONS.cards,
  };
}

/** {ok, options (normalized), errors[]} — for UIs / net validation that want to report what was wrong. */
export function validateOptions(o) {
  const errors = [];
  if (o != null && typeof o !== 'object') errors.push('options must be an object');
  else if (o) {
    if (o.difficulty !== undefined && !DIFFICULTY_IDS.includes(o.difficulty)) errors.push('difficulty must be one of ' + DIFFICULTY_IDS.join('|'));
    if (o.mode !== undefined && !MODE_IDS.includes(o.mode)) errors.push('mode must be one of ' + MODE_IDS.join('|'));
    if (o.cards !== undefined && typeof o.cards !== 'boolean') errors.push('cards must be a boolean');
  }
  return { ok: !errors.length, options: normalizeOptions(o), errors };
}

// ------------------------------------------------------------------------------------------------ starters (DESIGN §3)
/** Level every starter monster begins the match at (pacing: Lv 3 beats a fresh wild Lv 1–2 and evolves at Lv 5). */
export const STARTER_LEVEL = 3;
export const STARTER_IDS = ['cindle', 'puddlet', 'sproutle'];
/** roster value for "start with no monster" (tests / fixtures) */
export const NO_STARTER = 'none';
export const isStarter = (id) => STARTER_IDS.includes(id);

function starterStats(form, level) {
  const b = LINES[FORMS[form].line].base, lv = 1 + 0.08 * (level - 1);   // DESIGN §5 level scaling (MONSTER_SCALING)
  return { hp: Math.round(b.hp * lv), atk: Math.round(b.atk * lv), def: Math.round(b.def * lv), mag: Math.round(b.mag * lv), spd: b.spd, as: b.as, range: b.range };
}

/**
 * Display data for a starter-pick screen. `name` / `a1Name` are localized getters (current language); `role` is the
 * English role key from species.js (UI localizes or maps it to an icon); stats are at STARTER_LEVEL.
 * @type {{id:string, form:string, line:string, types:string[], level:number, color:string, role:string, ranged:boolean,
 *   stats:{hp:number,atk:number,def:number,mag:number,spd:number,as:number,range:number}, a1:string, evolvesTo:string[],
 *   strongVs:string, weakTo:string, name:string, a1Name:string}[]}
 */
export const STARTERS = STARTER_IDS.map((id) => {
  const f = FORMS[id], line = LINES[f.line];
  const rec = {
    id, form: id, line: f.line, types: f.types.slice(), level: STARTER_LEVEL, color: TYPE_COLORS[f.line], role: line.role, ranged: line.ranged,
    stats: starterStats(id, STARTER_LEVEL), a1: 'a1', evolvesTo: line.forms.slice(1).map((x) => x.id),
    strongVs: { fire: 'grass', water: 'fire', grass: 'water' }[f.line], weakTo: { fire: 'water', water: 'grass', grass: 'fire' }[f.line],
  };
  Object.defineProperty(rec, 'name', { get: () => FORMS[id].name, enumerable: true });
  Object.defineProperty(rec, 'a1Name', { get: () => { const d = abilityFor(f.line, 'a1', 0); return d ? d.name : ''; }, enumerable: true });
  return rec;
});

/** Deterministic starter for slot `i` of `team` (0..2) given the starters already claimed on that team. */
export function botStarter(seed, team, i, claimed = []) {
  // seed-driven permutation of the three starters per team (so a team of bots shows all three, in varying order)
  let h = Math.imul((seed | 0) ^ 0x5bd1e995, 0x27d4eb2f) ^ Math.imul(team + 1, 0x165667b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b) >>> 0;
  const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
  const order = perms[h % 6].map((k) => STARTER_IDS[k]);
  const free = order.filter((s) => !claimed.includes(s));
  return free.length ? free[0] : order[i % 3];
}

// ------------------------------------------------------------------------------------------------ difficulty (DESIGN §2a)
/**
 * Bot skill profile (trainer bots, mt/ai/trainerBot.js + team.js; pet ability timing in sim/combat.js):
 *   think      decision interval × 0.5 s (reaction delay)
 *   aggression added to the bot's personality aggression (0.30–0.85 → clamped 0.1–0.95): engage / retreat thresholds
 *   focus      0..1 target-selection quality: 1 = fastest kill, trainers prioritised; lower blends toward "nearest"
 *   abilityUse 0..1 monster ability timing: after each cast the pet holds its next auto-cast (1 − abilityUse) × 5 s
 *   kite       0..1 chance that a kite / telegraph-dodge opportunity is taken (micro)
 *   objective  greed for team objectives (Ancient feasibility, push / end calls): < 1 later and more cautious
 *   misplay    chance per decision of a mistake: no potion / swap / skill this decision, the 2nd-best goal, or ignoring a
 *              retreat (stays in a losing trade)
 */
export const BOT_SKILL = {
  easy: { think: 1.8, aggression: -0.1, focus: 0.35, abilityUse: 0.45, kite: 0.25, objective: 0.5, misplay: 0.22 },
  normal: { think: 1.4, aggression: 0, focus: 0.6, abilityUse: 0.7, kite: 0.5, objective: 0.8, misplay: 0.1 },
  hard: { think: 1, aggression: 0.05, focus: 1, abilityUse: 1, kite: 1, objective: 1, misplay: 0 },
  /** bots on a team with humans (your team-mates): solid, a little short of Hard */
  ally: { think: 1.2, aggression: 0, focus: 0.8, abilityUse: 0.85, kite: 0.7, objective: 0.9, misplay: 0.04 },
};

/**
 * Per difficulty:
 *   enemyBots  profile of bots on a team WITHOUT humans (the bots you play against; all-bot matches: both teams)
 *   allyBots   profile of bots on a team WITH humans
 *   humanTeam  {quick, classic}: handicap per mode (CLASSIC puts a human alone in a lane against a bot, so the same
 *              win rate needs more help — measured) for the team with humans in a humans-vs-bots match (never when both
 *              teams have humans):
 *              hp / dmg = multipliers for human trainers and their monsters; teamHp / teamDmg = for EVERY trainer and
 *              monster of that team (bots included; multiplies with hp / dmg); respawn = trainer respawn time multiplier
 *              for the whole team; comeback = XP comeback {bonus, gap} for that team (DESIGN §7 default {0.15, 1.5});
 *              minionHp / minionDmg / structureHp = the human team's minions and structures (Easy: the masher's team
 *              lost its lane to waves even when nobody died — docs/BALANCE.md playtest pass); missing = 1
 */
/** each human beyond the first on a team (co-op: a naive human replaces a solid ally bot) adds this much again of the
 *  handicap's distance from ×1 (2 humans = ×3 the help, 3 humans = ×5) — measured: Normal co-op 19 % without, see BALANCE.md */
export const EXTRA_HUMAN_HANDICAP = 2;
/** ...plus, on a difficulty that has a handicap at all (not Hard), this much team-wide HP and damage per extra human */
export const EXTRA_HUMAN_TEAM = 0.06;

/**
 * ASSIST — what protects / rewards the HUMAN player in a humans-vs-bots match (second playtest, docs/PLAYTEST.md #4:
 * a guide-following button masher won 75 % on Easy, died ~9× a match, scored nothing):
 *   focusHuman   how much enemy bots (and their monsters' auto-targeting) go for a HUMAN trainer: 1 = like any trainer;
 *                below 1 the bots prefer monsters / minions (their monsters never auto-pick a human trainer below 0.5)
 *   trainerHp    human trainer max HP × (on top of hp / teamHp)
 *   regen        human trainer regen, fraction of max HP per s, after 3 s without damage
 *   rescue       {hp, shield, haste, dur, cd}: under `hp` of max HP while being hit -> a shield of `shield` × max HP and
 *                +haste move speed for `dur` s, at most every `cd` s ("get out of there")
 *   petPotion    the human's monster drinks the potion by itself under this HP fraction when it is ready (0 = off)
 *   guard        s after (re)spawn: the human trainer and its monster take ×guardTaken damage
 *   lastHit      s: a team-mate's (bot / minion / tower) kill on an enemy trainer or monster the human hit within this
 *                window is credited to the human (kill feed, KO count); 0 = off
 *   execute      the human's monster deals +execute damage to enemy trainers / monsters under 30 % HP
 *   safeEvolve   the evolving monster is invulnerable (and cannot be interrupted) — evolve in the middle of a fight
 *   capture      {bonus, first}: added to the human's catch chance (DESIGN §6, capped at pMax); `first` again while the
 *                party holds only the starter (the first catch of the match should not fail twice in a row) — null = off
 *   towerYield   s; > 0: an enemy tower locked onto the human trainer lets go as soon as anything else is in its range
 *                (minion, monster, bot trainer) — towers keep a valid target otherwise — unless the human or its monster
 *                damaged one of the tower's trainers within its range in the last `towerYield` s (the tower protects its
 *                trainer). 0 = off (masher deaths under towers with allied minions in range, docs/BALANCE.md)
 */
export const ASSIST = {
  easy: { focusHuman: 0.2, trainerHp: 1.35, regen: 0.025, rescue: { hp: 0.35, shield: 0.45, haste: 0.45, dur: 3, cd: 20 }, petPotion: 0.3, guard: 8, guardTaken: 0.25, lastHit: 6, execute: 0.6, safeEvolve: true, capture: { bonus: 0.15, first: 0.3 }, towerYield: 2 },
  normal: { focusHuman: 0.6, trainerHp: 1.1, regen: 0.01, rescue: { hp: 0.25, shield: 0.25, haste: 0.3, dur: 2, cd: 30 }, petPotion: 0, guard: 4, guardTaken: 0.5, lastHit: 3, execute: 0.2, safeEvolve: true, capture: { bonus: 0.05, first: 0.15 }, towerYield: 0 },
  hard: { focusHuman: 1, trainerHp: 1, regen: 0, rescue: null, petPotion: 0, guard: 2, guardTaken: 0.6, lastHit: 0, execute: 0, safeEvolve: false, capture: null, towerYield: 0 },
};

export const DIFFICULTY = {
  easy: { enemyBots: 'easy', allyBots: 'ally', humanTeam: {
    quick: { hp: 1.2, dmg: 1.1, teamHp: 1.1, teamDmg: 1.05, respawn: 0.7, comeback: { bonus: 0.35, gap: 0.75 }, minionHp: 1.25, minionDmg: 1.2, structureHp: 1.3 },
    // CLASSIC (the default mode again): was hp 1.35 / dmg 1.18 / teamHp 1.18 / minionHp 1.25 — the masher won every match
    // but died 2.8× a match (up to 6; a third of it under enemy towers) in 12.4 min (up to 21); this: 1.8 deaths, 9.4 min
    // (node, 32 seeds; BALANCE.md "CLASSIC default")
    classic: { hp: 1.5, dmg: 1.3, teamHp: 1.25, teamDmg: 1.09, respawn: 0.5, comeback: { bonus: 0.6, gap: 0.75 }, minionHp: 1.5, minionDmg: 1.2, structureHp: 1.3 } } },
  normal: { enemyBots: 'normal', allyBots: 'ally', humanTeam: {
    quick: { hp: 1.05, dmg: 1, teamHp: 1, teamDmg: 1, respawn: 0.9, comeback: { bonus: 0.2, gap: 1.25 } },
    // CLASSIC: was hp 1.25 / dmg 1.12 / teamHp 1.05 / respawn 0.65 / comeback 0.5@1 — with the player assists (ASSIST.normal)
    // on top that gave 75 % (12 seeds; the same seeds: 46 % before); hp 1.1–1.15 / dmg 1.03–1.06 / teamHp 1 / respawn
    // 0.75–0.8 / comeback 0.3–0.35@1.25 gave 29 % (41 seeds) -> in between (BALANCE.md playtest pass)
    classic: { hp: 1.2, dmg: 1.09, teamHp: 1.02, teamDmg: 1, respawn: 0.7, comeback: { bonus: 0.42, gap: 1.1 } } } },
  hard: { enemyBots: 'hard', allyBots: 'ally', humanTeam: {
    quick: { hp: 1, dmg: 1, teamHp: 1, teamDmg: 1, respawn: 1, comeback: null },
    classic: { hp: 1, dmg: 1, teamHp: 1, teamDmg: 1, respawn: 1, comeback: null } } },
};

// ------------------------------------------------------------------------------------------------ modes (DESIGN §15)
/**
 * QUICK (default): the existing map, play concentrated on the MID lane.
 *   lanes          lanes with minion waves and structures (top/bot towers + inhibitors are removed at match start)
 *   camps          habitat camps kept (blue-side legacy ids; red mirrors) — the ones within ~21 m of mid; + river boss
 *   trainerSpeed / monsterSpeed / minionSpeed   move-speed multipliers (owned monsters keep pace with their trainer)
 *   respawn / faint   trainer respawn and monster faint timer multipliers; respawnLate {from, to, mult}: the respawn
 *                  multiplier ramps from `respawn` at `from` s to `mult` at `to` s (late deaths matter, so a won fight can
 *                  end the match — defenders respawning every few seconds next to their Nexus made late games endless)
 *   xp             multiplier on every XP gain (evolution within a few minutes)
 *   waveFirst / waveInterval   minion waves (s)
 *   sprint         base sprint: inside your own base zone (≤ radius m from your fountain) and out of combat for `calm` s,
 *                  trainers and their monsters move ×mult (fountain-to-lane walk)
 *   recallTime     recall channel (s)
 *   bossFirstSpawn, inhibitorRespawn (s)
 *   structureHp    max-HP multipliers per structure kind (one lane must be able to end the match in 8–12 min)
 *   wave           minions per wave (melee / caster), siege every N waves, minion HP ×hp and damage ×dmg, tower shots
 *                  vs minions ×towerDmg (6 trainers share one lane: waves must survive long enough to siege)
 *   aiTime         bot time windows (second capture, push / group calls) × this (shorter match)
 *   backdoor       monster backdoor protection (T2+ / inhibitor / Nexus take ×0.34 from monsters without an allied
 *                  minion near); off in QUICK — one lane, nothing to "backdoor", a won fight must be able to take a tower
 *   overtime       from `from` s on, structures take +perMin per minute more damage (cap ×cap), from `late` s on another
 *                  +latePerMin per minute (no cap): no endless stalemates
 *   timeLimit      s (0 = none): the match is decided then (TIME_LIMIT_SCORE) — QUICK never runs past 15 min
 * CLASSIC: today's 3-lane rules (every multiplier 1).
 */
export const MODES = {
  quick: {
    lanes: ['mid'], camps: ['wolves', 'brute', 'stalkers', 'warden'], meadows: true,
    trainerSpeed: 1.35, monsterSpeed: 1.35, minionSpeed: 1.15,
    respawn: 0.5, respawnLate: { from: 240, to: 540, mult: 1.4 }, faint: 0.6, xp: 1.6,
    waveFirst: 3, waveInterval: 25,
    sprint: { mult: 1.6, radius: 36, calm: 3 },
    recallTime: 5, bossFirstSpawn: 180, inhibitorRespawn: 150,
    structureHp: { tower: 0.4, inhibitor: 0.5, nexus: 0.5 },
    wave: { melee: 4, caster: 4, siegeEvery: 2, hp: 1.25, dmg: 1, towerDmg: 0.6 },
    aiTime: 0.5,
    backdoor: false,
    overtime: { from: 240, perMin: 0.35, cap: 3.5, late: 600, latePerMin: 1 },
    timeLimit: 900,
  },
  classic: {
    lanes: ['top', 'mid', 'bot'], camps: null, meadows: true,
    trainerSpeed: 1, monsterSpeed: 1, minionSpeed: 1,
    respawn: 1, respawnLate: null, faint: 1, xp: 1,
    waveFirst: 30, waveInterval: 30,
    sprint: null,
    recallTime: null, bossFirstSpawn: null, inhibitorRespawn: null,
    structureHp: null, wave: null, aiTime: 1,
    backdoor: true, overtime: null, timeLimit: 0,
  },
};

/** Time-limit decision (QUICK): score = 10 × enemy structures destroyed + trainer kills + monster KOs; ties -> the team
 *  whose remaining structures are more damaged loses -> the lower total structure HP loses -> red loses (rules.js). */
export const TIME_LIMIT_SCORE = { structure: 10, kill: 1, monsterKO: 1 };

/** Capture window (docs/PLAYTEST.md #6) for HUMAN trainers with a free party slot: once a wild monster they fight drops
 *  under holdHp of its max HP their own monster stops attacking it for `hold` s (time to throw), and a blow that would
 *  KO it within that window leaves it at 1 HP for up to `linger` s instead (one KO-save per window). A failed throw
 *  re-opens the window. The guide's opening: until `openingUntil` s, while the party holds only the starter, it points at
 *  a catchable wild monster up to `openingRange` m away (camps are map knowledge: fogged ones count) before lane / push. */
export const CAPTURE_WINDOW = { holdHp: 0.4, hold: 8, linger: 4, radius: 16, openingUntil: 120, openingRange: 45 };

/** Spawn / respawn points: a ring `radius` m from the own fountain centre (off the statue, inside the fountain's heal
 *  zone), toward the map centre, `spread` radians apart per trainer slot (docs/PLAYTEST.md #3). */
export const SPAWN_RING = { radius: 7.2, spread: 0.42 };
