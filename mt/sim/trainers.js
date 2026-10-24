// mt/sim/trainers.js — Trainers = legacy champion-kind units with a trainer def (DESIGN.md §3).
// Owner: trainer/spec specialist.
//
// What this module does:
//  - registers the 'trainer' champion def in the legacy CHAMPIONS table (so dS(), HUD and select screens find it);
//  - converts EVERY champion unit created by the World into a trainer (per-unit def clone, role, spec, mtTrainer state);
//  - owns the command router (impl.command): legacy commands are translated/denied for trainers, new mt command
//    types are dispatched to the owning modules;
//  - trainer upkeep: no gold/items/legacy XP, HP from avg monster level, respawn timer, HUD cooldown mirroring;
//  - trainer skills (Rally / Mend / Surge) and the potion.
//
// Trainer state: `unit.mtTrainer` (see TrainerState typedef). Monster party lives there (records, not units).

import { TRAINER, SPECS, SPEC_SKILL_CD, SPEC_IDS, CAPTURE } from '../data/balance.js';
import { TRAINER_ID, LANE_ROLES } from './roster.js';
import { KIND, isPet, isTrainer } from './util.js';
import * as monsters from './monsters.js';
import * as capture from './capture.js';
import * as progression from './progression.js';
import * as combat from './combat.js';
import { t } from '../i18n/index.js'; // player-facing refusal texts (mt_deny)

/**
 * @typedef {Object} TrainerState
 * @property {'attack'|'healing'|'magic'} spec
 * @property {import('./monsters.js').PartyRecord[]} party   max 2
 * @property {number} activeIdx  index into party of the active (deployed or to-deploy) monster, -1 none
 * @property {{until:number,to:number}|null} swap  swap in progress
 * @property {{swap:number,potion:number,skill:number,capture:number}} cdEnd  absolute world times
 * @property {{until:number,targetId:number}|null} confirm  pending "replace bench" confirmation
 * @property {boolean} wasAlive
 * @property {number} avgLevel
 * @property {boolean} recallPending
 */

const TRAINER_PASSIVE = { name: 'Trainer', tooltip: 'Trainers fight with a weak sling. Their monsters win the game.' };

// Legacy controls derive the aim UI from these stubs: 'skillshot' = aim indicator then cast at the cursor point,
// 'target' = hovered/nearest unit, 'buff' = instant self cast. The cast itself is translated by routeCommand().
function stubAbility(slot, name, tooltip, element, type, range) {
  return {
    slot, name, type, targeting: type === 'buff' ? 'self' : type === 'target' ? 'unit' : 'direction', element,
    fx: 'mt_' + slot.toLowerCase(), ai: { use: 'none' }, range, width: 0.5, targets: 'any',
    cost: [0, 0, 0, 0, 0], cooldown: [8, 8, 8, 8, 8], tooltip, description: tooltip,
    cast: () => false,
  };
}

/** The shared trainer def (per-unit clones are made in convertToTrainer). */
export function makeTrainerDef() {
  return {
    id: TRAINER_ID, name: 'Trainer', title: 'Monster Trainer', role: 'mid', resource: 'none', ranged: true,
    base: {
      hp: TRAINER.hp, hpGrowth: 0, mana: 0, manaGrowth: 0, ad: TRAINER.attack.damage, adGrowth: 0,
      attackSpeed: 1 / TRAINER.attack.interval, asGrowth: 0, armor: TRAINER.armor, armorGrowth: 0,
      mr: TRAINER.mr, mrGrowth: 0, moveSpeed: TRAINER.moveSpeed, attackRange: TRAINER.attack.range,
      hpRegen: 1, manaRegen: 0,
    },
    radius: 0.5, windupFrac: 0.25, projectileSpeed: 22, attackElement: 'earth',
    visual: { height: 1.7, build: 'monster trainer', primary: '#2b3f73', secondary: '#e8e2d0', accent: '#e04b3a', weapon: 'sling' },
    passive: TRAINER_PASSIVE,
    abilities: [
      stubAbility('Q', 'Monster Move 1', 'Your active monster uses its first move.', 'arcane', 'skillshot', 7),
      stubAbility('W', 'Monster Move 2', 'Your active monster uses its second move (Evolved forms).', 'arcane', 'skillshot', 7),
      stubAbility('E', 'Capture Orb', 'Throw a Capture Orb at a wild monster.', 'light', 'target', 9),
      stubAbility('R', 'Trainer Skill', 'Your specialisation skill.', 'light', 'buff', 0),
    ],
    kit: null,
    isTrainer: true,
  };
}

export function install(mt) {
  const C = mt.L.CHAMPIONS;
  if (C && !C[TRAINER_ID]) C[TRAINER_ID] = makeTrainerDef();
  if (mt.L.DEFAULT_SPELLS && !mt.L.DEFAULT_SPELLS[TRAINER_ID]) mt.L.DEFAULT_SPELLS[TRAINER_ID] = ['flash', 'heal'];

  mt.on('playerUnit', (mt, unit, player) => convertToTrainer(mt, unit, player));
  mt.on('postTick', upkeep);
  mt.on('kill', onKill);
  mt.impl.command = routeCommand;
  mt.impl.blockXp = (mt, u) => isTrainer(u);
  mt.impl.creditOf = (mt, u) => (isPet(u) ? mt.world.units.get(u.ownerId) || u : u);
}

/** Turn a freshly created champion unit into a trainer. Safe to call for any champion (scenario rosters too). */
export function convertToTrainer(mt, unit, player = {}) {
  if (unit.kind !== KIND.CHAMPION || unit.mtTrainer) return;
  const base = mt.L.CHAMPIONS[TRAINER_ID];
  const def = { ...base, base: { ...base.base }, abilities: base.abilities };
  const idx = mt.world.champions.length; // unit not yet pushed into world.champions when called from the ctor hook
  unit.def = def;
  unit.champion = TRAINER_ID;
  unit.role = player.role || LANE_ROLES[(player.index ?? idx) % 3];
  unit.resource = 'none';
  unit.ranged = true;
  unit.windupFrac = def.windupFrac;
  unit.projectileSpeed = def.projectileSpeed;
  unit.attackFx = 'mt_sling_attack';
  unit.attackElement = 'earth';
  unit.height = def.visual.height;
  unit.gold = 0; unit.totalGold = 0;
  unit.items = [null, null, null, null, null, null];
  unit.abilities = def.abilities.map((a) => ({ slot: a.slot, level: 1, cdEnd: 0, cdTotal: 0 }));
  unit.abilityPoints = 0;
  unit.autoLevel = false;
  unit.mtSprite = true;            // hides the legacy 3D champion model ([MT-HOOK] hideChampionModel)
  unit.mtTrainer = {
    spec: SPEC_IDS.includes(player.spec) ? player.spec : SPEC_IDS[(player.index ?? idx) % 3],
    party: [], activeIdx: -1, swap: null,
    cdEnd: { swap: 0, potion: 0, skill: 0, capture: 0 },
    confirm: null, wasAlive: true, avgLevel: 0, recallPending: false,
    device: player.device || null,
  };
  if (unit.mtTrainer.spec === 'healing') def.base.hp = TRAINER.hp * (1 + SPECS.healing.passive.trainerHp);
  mt.L.recomputeStats(unit);
  unit.hp = unit.maxHp;
  if (player.starter) mt.world.schedule(0, () => monsters.giveMonster(mt, unit, player.starter, 1, { deploy: true }));
}

/** Average level of the party (0 with no monsters). */
export function avgPartyLevel(trainer) {
  const p = trainer.mtTrainer.party;
  if (!p.length) return 0;
  let s = 0; for (const r of p) s += r.level;
  return s / p.length;
}

function upkeep(mt) {
  const w = mt.world, t = w.time;
  for (const u of w.champions) {
    const T = u.mtTrainer; if (!T) continue;
    u.gold = 0; u.totalGold = 0;
    // HP from average monster level (+ Healing spec bonus)
    const avg = avgPartyLevel(u);
    if (Math.abs(avg - T.avgLevel) > 1e-6) {
      T.avgLevel = avg;
      const mult = T.spec === 'healing' ? 1 + SPECS.healing.passive.trainerHp : 1;
      u.def.base.hp = (TRAINER.hp + TRAINER.hpPerAvgLevel * avg) * mult;
      u.level = Math.max(1, Math.round(avg));
      u.statsDirty = true;
    }
    // death / respawn transitions
    if (!u.alive && T.wasAlive) { T.wasAlive = false; T.recallPending = true; }
    if (T.recallPending) { T.recallPending = false; monsters.recallActive(mt, u, 'trainer_dead'); T.swap = null; }
    if (u.alive && !T.wasAlive) { T.wasAlive = true; monsters.deployActive(mt, u, 'respawn'); }
    if (T.confirm && t > T.confirm.until) T.confirm = null;
    mirrorCooldowns(mt, u);
  }
}

function onKill(mt, victim) {
  const T = victim.mtTrainer; if (!T) return;
  const avg = avgPartyLevel(victim);
  victim.respawnAt = mt.world.time + Math.min(TRAINER.respawn.max, TRAINER.respawn.base + TRAINER.respawn.perAvgLevel * avg);
  T.recallPending = true;
  mt.stats.trainerDeaths++;
}

/** Copy mt cooldowns into the legacy ability/spell slots so the legacy HUD radial cooldowns keep working. */
function mirrorCooldowns(mt, u) {
  const T = u.mtTrainer, A = u.abilities, now = mt.world.time;
  const rec = monsters.activeRecord(u);
  const set = (slot, end, total, level) => { const a = A[slot]; if (!a) return; a.cdEnd = end; a.cdTotal = total; a.level = level; };
  if (rec) {
    const cdA1 = combat.abilityCooldown(mt, u, rec, 'a1'), cdA2 = combat.abilityCooldown(mt, u, rec, 'a2');
    set(0, rec.cds.a1, cdA1, 1);
    set(1, rec.cds.a2, cdA2, combat.hasAbility(rec, 'a2') ? 1 : 0);
  } else { set(0, 0, 0, 0); set(1, 0, 0, 0); }
  set(2, T.cdEnd.capture, CAPTURE.cooldown, 1);
  set(3, T.cdEnd.skill, SPEC_SKILL_CD, 1);
  if (u.spells && u.spells[0]) { u.spells[0].cdEnd = T.cdEnd.potion; u.spells[0].cdTotal = TRAINER.potion.cooldown; }
  if (u.spells && u.spells[1]) { u.spells[1].cdEnd = T.cdEnd.swap; u.spells[1].cdTotal = TRAINER.swapCooldown; }
  void now;
}

export function deny(mt, trainer, code, text) {
  mt.emit(mt.E.DENY, { trainer: trainer.id, code, text: text || code });
  return false;
}

// ------------------------------------------------------------------------------------------------ commands
/**
 * mt command types (all addressed to the TRAINER unit id via world.command(trainerId, cmd)):
 *   {type:'capture', x?, y?, targetId?, confirm?}   throw a Capture Orb (DESIGN §6)
 *   {type:'swap'}                                    swap active <-> bench
 *   {type:'evolve'}                                  start evolving the active monster (when ready)
 *   {type:'regroup'}                                 active monster returns to the trainer, clears focus
 *   {type:'monsterCast', slot:'a1'|'a2', x?, y?, targetId?}
 *   {type:'monsterAttack', targetId}                 focus target for the active monster (trainer does not move)
 *   {type:'trainerSkill'}                            spec skill (Rally/Mend/Surge)
 *   {type:'potion'}                                  heal active monster (legacy type name reused)
 *   {type:'monsterAutoCast', on?:boolean}            toggle/set monster ability auto-cast (default on)
 * Legacy commands on trainers: move/attackMove/dir/attack/attackNearest/stop/recall/ping pass through
 * (attack also focuses the monster); cast Q/W -> monsterCast a1/a2, cast E -> capture, cast R -> trainerSkill,
 * spell D -> potion, spell F -> swap; buy/sell/levelUp/autoLevel/ward are refused.
 */
function routeCommand(mt, unit, cmd) {
  for (const fn of mt.hooks.command) { const r = mt.guard('command-hook', () => fn(mt, unit, cmd)); if (r !== undefined) return r; }
  if (!isTrainer(unit)) return undefined;
  const bot = mt.legacyBotPhase;
  switch (cmd.type) {
    case 'buy': case 'sell': case 'levelUp': case 'autoLevel': case 'ward': return false;
    case 'cast': {
      const s = cmd.slot;
      if (s === 'Q' || s === 'W') return combat.commandMonsterCast(mt, unit, s === 'Q' ? 'a1' : 'a2', cmd.x, cmd.y, cmd.targetId ?? -1);
      if (bot) return false; // legacy brain must not spend capture / spec skill
      if (s === 'E') return capture.commandCapture(mt, unit, cmd);
      if (s === 'R') return trainerSkill(mt, unit);
      return false;
    }
    case 'spell':
      if (bot) return false;
      if (cmd.slot === 'D') return usePotion(mt, unit);
      if (cmd.slot === 'F') return monsters.swap(mt, unit);
      return false;
    case 'potion': return usePotion(mt, unit);
    case 'attack': monsters.focus(mt, unit, cmd.targetId, false); return undefined;
    case 'capture': return capture.commandCapture(mt, unit, cmd);
    case 'swap': return monsters.swap(mt, unit);
    case 'evolve': return progression.startEvolution(mt, unit);
    case 'regroup': return monsters.regroup(mt, unit);
    case 'monsterCast': return combat.commandMonsterCast(mt, unit, cmd.slot === 'a2' ? 'a2' : 'a1', cmd.x, cmd.y, cmd.targetId ?? -1);
    case 'monsterAttack': return monsters.focus(mt, unit, cmd.targetId | 0, true);
    case 'trainerSkill': return trainerSkill(mt, unit);
    case 'monsterAutoCast': return combat.commandAutoCast(mt, unit, cmd.on);
  }
  return undefined;
}

export function usePotion(mt, trainer) {
  const T = trainer.mtTrainer, w = mt.world;
  if (!trainer.alive) return deny(mt, trainer, 'dead', t('deny.dead'));
  if (w.time < T.cdEnd.potion) return deny(mt, trainer, 'cooldown', t('deny.potionCd'));
  const pet = monsters.activeUnit(mt, trainer);
  if (!pet || !pet.alive) return deny(mt, trainer, 'no_monster', t('deny.noMonster'));
  T.cdEnd.potion = w.time + TRAINER.potion.cooldown;
  const P = TRAINER.potion, ticks = 4, per = (pet.maxHp * P.healPct) / ticks;
  for (let i = 1; i <= ticks; i++) w.schedule((P.duration * i) / ticks, () => { if (pet.alive && !pet.removed) mt.L.heal(w, pet, per, i > 1, trainer); });
  mt.stats.potions++;
  mt.emit(mt.E.POTION, { trainer: trainer.id, unit: pet.id });
  return true;
}

export function trainerSkill(mt, trainer) {
  const T = trainer.mtTrainer, w = mt.world, L = mt.L;
  if (!trainer.alive) return deny(mt, trainer, 'dead', t('deny.dead'));
  if (w.time < T.cdEnd.skill) return deny(mt, trainer, 'cooldown', t('deny.skillCd'));
  const pet = monsters.activeUnit(mt, trainer);
  if (!pet || !pet.alive) return deny(mt, trainer, 'no_monster', t('deny.noMonster'));
  const spec = SPECS[T.spec];
  const status = (tgt, st, dur, power) => w.emit(mt.E.STATUS, { tgt: tgt.id, src: trainer.id, status: st, ability: spec.skill.toLowerCase(), duration: dur, power, x: tgt.x, y: tgt.y });
  const fx = (kind, tgt, extra) => w.emit(mt.EVENT.FX, { fx: 'mt_' + spec.skill.toLowerCase(), kind, src: trainer.id, tgt: tgt.id, team: trainer.team, element: T.spec === 'attack' ? 'fire' : T.spec === 'healing' ? 'nature' : 'arcane', x: tgt.x, y: tgt.y, ...extra });
  let duration = 0;
  if (T.spec === 'attack') {
    // Rally: active monster +35 % attack speed, +15 % move speed for 5 s
    duration = spec.rally.duration;
    L.addBuff(w, pet, 'mt_rally', duration, { attackSpeedPct: spec.rally.attackSpeedPct, msPct: spec.rally.msPct });
    status(pet, 'buff', duration, 'mt_rally'); fx('buff', pet, { duration });
  } else if (T.spec === 'healing') {
    // Mend: heal monster 28 % + trainer 20 %, cleanse slows
    const a = L.heal(w, pet, pet.maxHp * spec.mend.monsterHealPct, false, trainer);
    const b = L.heal(w, trainer, trainer.maxHp * spec.mend.trainerHealPct, false, trainer);
    const slowed = pet.cc.slowUntil > w.time;
    pet.slows.length = 0; pet.cc.slowUntil = 0; pet.cc.slowPower = 0;
    status(pet, 'heal', 0, Math.round(a || 0)); status(trainer, 'heal', 0, Math.round(b || 0));
    if (slowed) status(pet, 'cleanse', 0, 'slow');
    fx('buff', pet, { duration: 0.8 }); fx('aoe_burst', trainer, { radius: 1.2 });
  } else {
    // Surge: next monster ability +60 % and leaves an elemental field (combat.js consumes rec.surgeUntil)
    duration = spec.surge.window;
    const rec = monsters.activeRecord(trainer);
    if (rec) rec.surgeUntil = w.time + duration;
    L.addBuff(w, pet, 'mt_surge', duration, null, { surge: true, bonus: spec.surge.bonus });
    status(pet, 'surge', duration, spec.surge.bonus); fx('empower', pet, { duration });
  }
  T.cdEnd.skill = w.time + SPEC_SKILL_CD;
  mt.stats.trainerSkills++;
  mt.emit(mt.E.TRAINER_SKILL, { trainer: trainer.id, skill: spec.skill.toLowerCase(), unit: pet.id, duration, x: pet.x, y: pet.y });
  return true;
}
