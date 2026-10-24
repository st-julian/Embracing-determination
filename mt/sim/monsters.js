// mt/sim/monsters.js — monster party, pet/wild monster units, pet AI, swap/summon/faint (DESIGN.md §3, §5, §11).
// Owner: monster specialist.
//
// Model:
//  - A trainer's party is a list of PartyRecords on `trainer.mtTrainer.party` (max 2). Records are the source
//    of truth (form, level, xp, hp fraction, cooldowns, faint timer, evolution channel).
//  - The ACTIVE record is deployed as a legacy unit of kind 'monster' with `team = trainer.team`,
//    `ownerId = trainer.id`, `mtCtl = true` (AI dispatched to mt), `mtSprite = true` (drawn by mt/render),
//    `subtype = formId` (unknown to the legacy creeps renderer, so it is skipped there), `mtMon` = MonsterState.
//  - Benched monsters have no unit. Recalling/swapping removes the unit and stores hp in the record.
//  - Wild monsters are the same kind of unit with team NEUTRAL, `ownerId = -1`, `camp` set, `mtCtl = false`
//    (the legacy jungle AI `_C` drives them: leash, reset, retaliate).
//
// Lifecycle rules implemented here (DESIGN §3, §11):
//  - swap: 0.6 s (outgoing recalled at once, incoming summoned with a short burst), CD 8 s; free & fast (0.15 s,
//    no CD) when the active monster has fainted.
//  - bench regen 3 %/s max HP (also while the trainer is dead: the monsters rest in their orbs).
//  - faint at 0 HP (never lost), timer 8 + 1.2 × level; the bench monster is auto-sent after FAINT_AUTO_SEND s
//    unless the trainer swapped first; when the timer ends the monster is usable again (mt_revive).
//  - trainer death: trainers.js recalls the active monster; deployActive() refuses while the trainer is dead, and
//    every party command checks `trainer.alive`, so nothing can be summoned/commanded until the respawn.
//  - pets follow behind-left of the trainer, leash 7 m (catch-up speed beyond it), snap back beyond 22 m;
//    regroup = drop target, sprint back for 2.5 s.

import { TRAINER, MONSTER_SCALING, SPECS, FAINT, XP } from '../data/balance.js';
import { FORMS, LINES, nextFormId } from '../data/species.js';
import { LEGACY_ELEMENT } from '../data/types.js';
import { KIND, TEAM, DT, dist, dist2, isPet, teleportUnit } from './util.js';
import { i as FOUNTAINS } from '../../assets/map-oE9sOnNc.js';
import * as combat from './combat.js';
import { t } from '../i18n/index.js'; // player-facing refusal texts (mt_deny)

/** Seconds after a faint before the healthy bench monster is sent out automatically (if the player did not swap). */
export const FAINT_AUTO_SEND = 2;
/** Regroup duration (s): the pet ignores targets and sprints back to its trainer. */
export const REGROUP_TIME = 2.5;

/**
 * @typedef {Object} PartyRecord
 * @property {number} rid   record id (stable across swaps/evolutions)
 * @property {string} form  form id (FORMS key)
 * @property {number} level
 * @property {number} xp    xp into the current level
 * @property {number} hpFrac  0..1 hp fraction while not deployed (and last known while deployed)
 * @property {boolean} fainted
 * @property {number} faintUntil   @property {number} faintedAt
 * @property {number} unitId  deployed unit id or -1
 * @property {{a1:number,a2:number}} cds  absolute cooldown end times
 * @property {{t0:number, until:number, from:string, to:string, bench:boolean}|null} evolving  evolution channel
 * @property {boolean} evolveNotified  mt_evolve_ready already sent for the current form
 * @property {number} [surgeUntil] Magic-spec Surge window
 * @property {number} kills
 * @property {number} caughtAt  world time of capture / gift
 *
 * @typedef {Object} MonsterState  (unit.mtMon)
 * @property {string} form  @property {string} line  @property {number} stage  @property {string[]} types
 * @property {number} ownerId  -1 = wild  @property {PartyRecord|null} rec
 * @property {boolean} meadow  starter-meadow wild monster
 * @property {number} focusId  forced target id (-1 none)  @property {number} focusUntil
 * @property {number} regroupUntil
 * @property {{t0:number, until:number, from:string, to:string}|null} evolving  (same object as rec.evolving)
 * @property {number} evolvedAt  world time of the last evolution (-99 never) — renderers: "pop" after evolving
 * @property {string|null} evolvedFrom
 * @property {Object|null} capturing  set by capture.js while inside an orb (see capture.js CaptureState)
 * @property {number} nextScan  tick of next auto-target scan
 * @property {number} [spareId]  @property {number} [spareUntil]  don't attack this unit (own capture orb flying at it)
 */

// ---------------------------------------------------------------------------------------------- stats
/**
 * Stats for a form at a level (+ trainer spec passives).
 * @returns {{hp:number, ad:number, ap:number, armor:number, mr:number, attackSpeed:number, moveSpeed:number, attackRange:number, lifesteal:number}}
 */
export function computeMonsterStats(formId, level, spec = null) {
  const f = FORMS[formId], line = LINES[f.line], b = line.base;
  const lv = 1 + MONSTER_SCALING.perLevel * (level - 1);
  const st = Math.pow(MONSTER_SCALING.stageMult, f.stage);
  let hp = b.hp * lv * st, atk = b.atk * lv * st, def = b.def * lv * st, mag = b.mag * lv * st, as = b.as, ls = 0;
  if (spec === 'attack') { as *= 1 + SPECS.attack.passive.attackSpeed; ls = SPECS.attack.passive.lifesteal; }
  if (spec === 'healing') { hp *= 1 + SPECS.healing.passive.maxHp; def *= 1 + SPECS.healing.passive.def; }
  if (spec === 'magic') mag *= 1 + SPECS.magic.passive.mag;
  return { hp, ad: atk, ap: mag, armor: def, mr: def, attackSpeed: as, moveSpeed: b.spd, attackRange: b.range, lifesteal: ls };
}

/** Apply form/level stats to a monster unit, preserving its HP fraction. */
export function refreshMonsterStats(mt, u) {
  const M = u.mtMon, owner = M.ownerId >= 0 ? mt.world.units.get(M.ownerId) : null;
  const spec = owner && owner.mtTrainer ? owner.mtTrainer.spec : null;
  const s = computeMonsterStats(M.form, u.level, spec);
  const f = FORMS[M.form];
  const frac = u.maxHp > 0 ? u.hp / u.maxHp : 1;
  Object.assign(u.stats, { ad: s.ad, ap: s.ap, armor: s.armor, mr: s.mr, attackSpeed: s.attackSpeed, moveSpeed: s.moveSpeed, attackRange: s.attackRange, lifesteal: s.lifesteal });
  mt.L.snapshotBaseStats(u);
  u.maxHp = s.hp; u.hp = Math.max(1, Math.min(s.hp, s.hp * frac));
  u.radius = f.radius; u.height = f.height; u.name = f.name; u.subtype = f.id;
  u.ranged = LINES[f.line].ranged;
  u.attackFx = 'mt_' + f.line + '_attack'; u.attackElement = LEGACY_ELEMENT[f.line];
  u.statsDirty = true;
}

// ---------------------------------------------------------------------------------------------- event payload helpers
/** MonInfo fragment for events (see events.js). */
export function describe(rec) {
  if (!rec) return null;
  const f = FORMS[rec.form];
  return { rid: rec.rid, form: rec.form, name: f.name, line: f.line, stage: f.stage, level: rec.level, types: f.types.slice() };
}

/** Full party snapshot (HUD portraits). */
export function partySnapshot(mt, trainer) {
  const T = trainer.mtTrainer, w = mt.world;
  return T.party.map((r, i) => {
    const u = unitOf(mt, r);
    return {
      ...describe(r), active: i === T.activeIdx, fainted: r.fainted, faintUntil: r.faintUntil,
      hpFrac: u && u.alive ? u.hp / u.maxHp : r.hpFrac, xp: r.xp, toNext: r.level >= XP.maxLevel ? 0 : XP.toNext(r.level),
      evolving: !!r.evolving, unit: u ? u.id : -1, deployed: !!u && w.time >= 0,
    };
  });
}

/** Emit mt_party for a trainer. */
export function emitParty(mt, trainer, reason) {
  const T = trainer.mtTrainer; if (!T) return;
  const a = activeRecord(trainer);
  mt.emit(mt.E.PARTY, { trainer: trainer.id, team: trainer.team, reason, activeRid: a ? a.rid : -1, party: partySnapshot(mt, trainer) });
}

/** Owner trainer unit of a record (search; party records don't store their owner). */
export function ownerOfRecord(mt, rec) {
  for (const c of mt.world.champions) if (c.mtTrainer && c.mtTrainer.party.includes(rec)) return c;
  return null;
}

// ---------------------------------------------------------------------------------------------- units
/**
 * Create (and add to the world) a monster unit.
 * @param {object} mt
 * @param {{form:string, level:number, team:number, x:number, y:number, owner?:object, rec?:PartyRecord, camp?:object, meadow?:boolean, hpFrac?:number, noAdd?:boolean}} o
 */
export function createMonsterUnit(mt, o) {
  const w = mt.world, L = mt.L, f = FORMS[o.form], line = LINES[f.line];
  const u = L.createBaseUnit(w, KIND.MONSTER, o.team, o.x, o.y);
  const owned = !!o.owner;
  Object.assign(u, {
    subtype: f.id, name: f.name, level: o.level, xp: 0,
    ownerId: owned ? o.owner.id : -1,
    mtSprite: true, mtCtl: owned,
    mtMon: {
      form: f.id, line: f.line, stage: f.stage, types: f.types.slice(), ownerId: owned ? o.owner.id : -1,
      rec: o.rec || null, meadow: !!o.meadow, focusId: -1, focusUntil: 0, regroupUntil: 0,
      evolving: null, evolvedAt: -99, evolvedFrom: null, capturing: null, nextScan: 0, lastCombatT: -99,
    },
    camp: o.camp ? o.camp.id : null, homeX: o.x, homeY: o.y,
    bounty: 0, xpValue: 0, epic: false, passiveMonster: false, buff: null, resetting: false,
    attackFx: 'mt_' + f.line + '_attack', attackElement: LEGACY_ELEMENT[f.line],
    windupFrac: MONSTER_SCALING.windupFrac, projectileSpeed: MONSTER_SCALING.projectileSpeed,
    mass: MONSTER_SCALING.mass, mtSpeedMul: 1,
  });
  void line;
  if (owned) u.facing = o.owner.facing;
  u.maxHp = 1; u.hp = 1;
  refreshMonsterStats(mt, u);
  u.hp = u.maxHp * (o.hpFrac ?? 1);
  if (o.rec) { o.rec.unitId = u.id; if (o.rec.evolving) u.mtMon.evolving = o.rec.evolving; }
  if (!o.noAdd) w.addUnit(u);
  w.visionDirty = true;
  return u;
}

/** Wild monster for a jungle camp/meadow. NOT added to the world (the legacy camp spawner adds it). */
export function createWildForCamp(mt, form, level, camp, meadow) {
  return createMonsterUnit(mt, { form, level, team: TEAM.NEUTRAL, x: camp.x, y: camp.y, camp, meadow, noAdd: true });
}

/** @returns {PartyRecord} */
export function makeRecord(mt, form, level = 1, xp = 0) {
  return {
    rid: mt.nextRid++, form, level, xp, hpFrac: 1, fainted: false, faintUntil: 0, faintedAt: -99, unitId: -1,
    cds: { a1: 0, a2: 0 }, kills: 0, evolving: null, evolveNotified: false, caughtAt: mt.world.time,
  };
}

export function activeRecord(trainer) {
  const T = trainer && trainer.mtTrainer; if (!T || T.activeIdx < 0) return null;
  return T.party[T.activeIdx] || null;
}
export function benchRecord(trainer) {
  const T = trainer && trainer.mtTrainer; if (!T || T.party.length < 2) return null;
  return T.party[T.activeIdx === 0 ? 1 : 0] || null;
}
/** The deployed active monster unit (alive or fainting), or null. */
export function activeUnit(mt, trainer) {
  const r = activeRecord(trainer); if (!r || r.unitId < 0) return null;
  const u = mt.world.units.get(r.unitId);
  return u && !u.removed ? u : null;
}
/** Unit for a record if deployed. */
export function unitOf(mt, rec) { if (!rec || rec.unitId < 0) return null; const u = mt.world.units.get(rec.unitId); return u && !u.removed ? u : null; }

/** Sync record from its live unit (hp fraction). */
export function syncRecord(mt, rec) {
  const u = unitOf(mt, rec); if (!u) return;
  rec.hpFrac = u.alive ? u.hp / u.maxHp : 0;
  rec.level = u.level; rec.form = u.mtMon.form;
}

/**
 * Add a monster to a party (capture / debug). Party full -> replaces the BENCH monster.
 * The new monster becomes ACTIVE if the party had no usable active monster, else it goes to the bench.
 * @returns {{rec:PartyRecord, replaced:PartyRecord|null, slot:'active'|'bench'}}
 */
export function addToParty(mt, trainer, rec, opts = {}) {
  const T = trainer.mtTrainer; let replaced = null;
  if (T.party.length >= TRAINER.maxParty) {
    const bi = T.activeIdx === 0 ? 1 : 0;
    replaced = T.party[bi];
    const ru = unitOf(mt, replaced); if (ru) mt.world.removeUnit(ru);
    replaced.unitId = -1; replaced.evolving = null;
    T.party[bi] = rec;
    if (T.swap) T.swap = null; // a swap toward the released monster is void
  } else T.party.push(rec);
  if (T.activeIdx < 0 || !T.party[T.activeIdx]) T.activeIdx = T.party.indexOf(rec);
  // nothing deployable out (no monster, or the active one fainted with nothing out) -> the newcomer leads
  const act = activeRecord(trainer);
  if (act !== rec && act && act.fainted && !activeUnit(mt, trainer) && !T.swap) T.activeIdx = T.party.indexOf(rec);
  const slot = T.party.indexOf(rec) === T.activeIdx ? 'active' : 'bench';
  if (opts.deploy !== false && trainer.alive && slot === 'active' && !activeUnit(mt, trainer)) deployActive(mt, trainer, opts.reason || 'capture', opts.x, opts.y);
  if (!opts.silent) emitParty(mt, trainer, opts.reason || 'add');
  return { rec, replaced, slot };
}

/** Debug/test helper: give a trainer a monster. */
export function giveMonster(mt, trainer, form, level = 1, opts = {}) {
  const rec = makeRecord(mt, form, level);
  return addToParty(mt, trainer, rec, { reason: 'summon', ...opts }).rec;
}

/** Deploy the active record (if any, not fainted, trainer alive). Picks the other one if active is fainted. */
export function deployActive(mt, trainer, reason = 'summon', x, y) {
  const T = trainer.mtTrainer; if (!T || !trainer.alive) return null;
  if (activeUnit(mt, trainer)) return activeUnit(mt, trainer);
  let rec = activeRecord(trainer);
  if (!rec || rec.fainted) {
    const i = T.party.findIndex((r) => !r.fainted);
    if (i < 0) return null;
    T.activeIdx = i; rec = T.party[i];
  }
  const a = trainer.facing + Math.PI * 0.75;
  const px = x ?? trainer.x + Math.cos(a) * 1.4, py = y ?? trainer.y + Math.sin(a) * 1.4;
  const u = createMonsterUnit(mt, { form: rec.form, level: rec.level, team: trainer.team, x: trainer.x, y: trainer.y, owner: trainer, rec, hpFrac: Math.max(0.05, rec.hpFrac) });
  teleportUnit(mt.world, u, px, py, trainer.x, trainer.y);
  mt.emit(mt.E.SUMMON, { trainer: trainer.id, team: trainer.team, unit: u.id, ...describe(rec), from: reason, x: u.x, y: u.y });
  return u;
}

/** Return the active monster to its orb (unit removed, record keeps hp). Cancels (refunds) an evolution channel. */
export function recallActive(mt, trainer, reason = 'recall') {
  const rec = activeRecord(trainer); const u = unitOf(mt, rec);
  if (!u) return false;
  if (rec.evolving) cancelEvolution(mt, trainer, rec, reason === 'trainer_dead' ? 'trainer_dead' : 'recalled');
  if (u.alive) rec.hpFrac = u.hp / u.maxHp;
  rec.unitId = -1;
  const x = u.x, y = u.y;
  mt.world.removeUnit(u);
  mt.emit(mt.E.RECALL, { trainer: trainer.id, team: trainer.team, unit: u.id, ...describe(rec), reason, x, y });
  return true;
}

/**
 * Cancel an evolution channel (active or benched). Nothing was consumed: the player can simply press T again.
 * Owned here (not progression.js) because recall/faint/swap must be able to cancel without a module cycle.
 */
export function cancelEvolution(mt, trainer, rec, reason) {
  if (!rec || !rec.evolving) return false;
  const u = unitOf(mt, rec);
  rec.evolving = null;
  if (u && u.mtMon) u.mtMon.evolving = null;
  mt.emit(mt.E.EVOLVE_CANCEL, {
    trainer: trainer ? trainer.id : -1, team: trainer ? trainer.team : -1, unit: u ? u.id : -1, ...describe(rec),
    reason, refund: true, x: u ? u.x : trainer ? trainer.x : 0, y: u ? u.y : trainer ? trainer.y : 0,
  });
  return true;
}

/** Swap command (DESIGN §3: 0.6 s, CD 8 s; immediate & free when the active monster has fainted). */
export function swap(mt, trainer) {
  const T = trainer.mtTrainer, w = mt.world;
  const deny = (c, t) => { mt.emit(mt.E.DENY, { trainer: trainer.id, code: c, text: t }); return false; };
  if (!trainer.alive) return deny('dead', t('deny.dead'));
  const bench = benchRecord(trainer);
  if (!bench) return deny('no_bench', t('deny.noBench'));
  if (bench.fainted) return deny('fainted', t('deny.benchFaintedT', { name: FORMS[bench.form].name, n: Math.ceil(bench.faintUntil - w.time) }));
  if (bench.evolving) return deny('evolving', t('deny.benchEvolving', { name: FORMS[bench.form].name }));
  if (T.swap) return deny('busy', t('deny.swapping'));
  const cur = activeRecord(trainer), curUnit = unitOf(mt, cur);
  const freeSwap = !cur || cur.fainted || !curUnit || !curUnit.alive;
  if (!freeSwap && w.time < T.cdEnd.swap) return deny('cooldown', t('deny.swapCd'));
  if (curUnit && curUnit.mtMon.evolving) return deny('evolving', t('deny.evolving'));
  const ox = curUnit ? curUnit.x : trainer.x, oy = curUnit ? curUnit.y : trainer.y;
  if (curUnit && curUnit.alive) recallActive(mt, trainer, 'swap');
  T.swap = { until: w.time + (freeSwap ? 0.15 : TRAINER.swapTime), to: T.party.indexOf(bench), t0: w.time };
  if (!freeSwap) T.cdEnd.swap = w.time + TRAINER.swapCooldown;
  mt.stats.swaps++;
  mt.emit(mt.E.SWAP, {
    trainer: trainer.id, team: trainer.team, from: cur ? cur.form : null, to: bench.form,
    fromName: cur ? FORMS[cur.form].name : null, toName: FORMS[bench.form].name, fromRid: cur ? cur.rid : -1, toRid: bench.rid,
    until: T.swap.until, free: freeSwap, x: ox, y: oy,
  });
  return true;
}

/** Regroup command: the active monster drops targets and sprints back to the trainer for a moment. */
export function regroup(mt, trainer) {
  if (!trainer.alive) { mt.emit(mt.E.DENY, { trainer: trainer.id, code: 'dead', text: t('deny.dead') }); return false; }
  const u = activeUnit(mt, trainer); if (!u || !u.alive) return false;
  const M = u.mtMon; M.focusId = -1; M.regroupUntil = mt.world.time + REGROUP_TIME; u.targetId = -1;
  mt.L.cancelAttack(mt.world, u, false);
  mt.emit(mt.E.REGROUP, { trainer: trainer.id, team: trainer.team, unit: u.id, until: M.regroupUntil, x: u.x, y: u.y });
  return true;
}

/** Focus a target. hard=true (monsterAttack) keeps it 6 s even beyond the leash. */
export function focus(mt, trainer, targetId, hard) {
  const u = activeUnit(mt, trainer); if (!u || !u.alive) return hard ? false : undefined;
  const t = mt.world.units.get(targetId);
  if (!t || !t.alive || t.team === u.team) return hard ? false : undefined;
  u.mtMon.focusId = targetId; u.mtMon.focusUntil = mt.world.time + (hard ? 6 : 3); u.mtMon.regroupUntil = 0;
  return true;
}

// ---------------------------------------------------------------------------------------------- install
export function install(mt) {
  mt.impl.unitAI = unitAI;
  mt.on('postTick', upkeep);
  mt.on('kill', onKill);
}

function onKill(mt, victim, killer) {
  if (!isPet(victim)) return;
  const rec = victim.mtMon.rec; if (!rec) return;
  const w = mt.world, owner = w.units.get(victim.ownerId);
  if (rec.evolving) cancelEvolution(mt, owner, rec, 'fainted');
  rec.fainted = true; rec.hpFrac = 0;
  rec.faintedAt = w.time;
  rec.faintUntil = w.time + FAINT.base + FAINT.perLevel * rec.level;
  rec.unitId = -1; // the legacy sim removes the corpse 2.5 s later
  victim.mtMon.evolving = null;
  mt.stats.faints++;
  const k = killer && (killer.mtMon || killer.mtTrainer || killer.name) ? killer : null;
  mt.emit(mt.E.FAINT, {
    trainer: victim.ownerId, team: victim.team, unit: victim.id, ...describe(rec), killer: k ? k.id : -1, killerName: k ? k.name : null,
    until: rec.faintUntil, duration: rec.faintUntil - w.time, x: victim.x, y: victim.y,
  });
  if (owner && owner.mtTrainer) emitParty(mt, owner, 'faint');
}

function upkeep(mt) {
  const w = mt.world, t = w.time;
  for (const tr of w.champions) {
    const T = tr.mtTrainer; if (!T) continue;
    // swap completion (refused while the trainer is dead: trainers.js clears T.swap on death)
    if (T.swap && t >= T.swap.until) {
      const to = T.swap.to; T.swap = null;
      if (tr.alive && T.party[to] && !T.party[to].fainted) {
        T.activeIdx = to; const u = deployActive(mt, tr, 'swap');
        if (u) { combat.swapBurst(mt, u); emitParty(mt, tr, 'swap'); }
      }
    }
    for (const rec of T.party) {
      const u = unitOf(mt, rec);
      if (u) { if (u.alive) rec.hpFrac = u.hp / u.maxHp; continue; }
      if (rec.fainted) {
        if (t >= rec.faintUntil) {
          rec.fainted = false; rec.hpFrac = 1;
          mt.emit(mt.E.REVIVE, { trainer: tr.id, team: tr.team, ...describe(rec), bench: rec !== activeRecord(tr) });
          emitParty(mt, tr, 'revive');
        }
        continue;
      }
      rec.hpFrac = Math.min(1, rec.hpFrac + TRAINER.benchRegenPct * DT); // bench / in-orb regen
    }
    // nothing deployed, trainer alive -> deploy (first capture, faint recovery, auto-send the bench after a faint)
    if (tr.alive && !T.swap && T.party.length && !activeUnit(mt, tr)) {
      const a = activeRecord(tr);
      if (!a || !a.fainted || t - a.faintedAt >= FAINT_AUTO_SEND) {
        const u = deployActive(mt, tr, a && a.fainted ? 'auto' : 'summon');
        if (u) emitParty(mt, tr, 'deploy');
      }
    }
  }
  // pets: leash teleport, catch-up speed, out-of-combat regen
  for (const u of w.unitList) {
    if (!u.mtMon || u.mtMon.ownerId < 0 || !u.alive) continue;
    const owner = w.units.get(u.ownerId);
    if (!owner || !owner.alive) continue;
    const d = dist(u.x, u.y, owner.x, owner.y);
    if (d > TRAINER.teleportLeash && !u.dash && !u.mtMon.evolving) {
      const a = owner.facing + Math.PI; teleportUnit(w, u, owner.x + Math.cos(a) * 1.5, owner.y + Math.sin(a) * 1.5, owner.x, owner.y);
    }
    const regrouping = t < u.mtMon.regroupUntil;
    u.mtSpeedMul = d > TRAINER.leash || (regrouping && d > 2.5) ? TRAINER.catchupSpeedMult : 1;
    // own fountain heals pets like trainers (legacy updateFountains only handles champions)
    const fo = FOUNTAINS[u.team];
    if (fo && u.hp < u.maxHp && dist2(u.x, u.y, fo.x, fo.y) < (fo.radius + 3) * (fo.radius + 3)) u.hp = Math.min(u.maxHp, u.hp + u.maxHp * 0.084 * DT);
    if (t - u.lastCombatT > MONSTER_SCALING.oocDelay && u.hp < u.maxHp) {
      const mult = owner.mtTrainer && owner.mtTrainer.spec === 'healing' ? SPECS.healing.passive.oocRegenMult : 1;
      u.hp = Math.min(u.maxHp, u.hp + u.maxHp * MONSTER_SCALING.oocRegenPct * mult * DT);
    }
  }
}

/** Next form of a record if its level allows evolving (level gate only). */
export function evolveTarget(rec) {
  const f = rec && FORMS[rec.form];
  const to = f ? nextFormId(rec.form) : null;
  return to && rec.level >= f.evolveLevel ? to : null;
}

// ---------------------------------------------------------------------------------------------- AI
const SCAN_EVERY = 5;   // ticks between auto-target scans
const AGGRO = 6.5;      // auto-acquire radius around the pet
const OWNER_GUARD = 9;  // only fight things within this distance of the trainer (unless focused)

function enemyOf(mt, pet, u, allowWild) {
  if (!u || !u.alive || u.removed || u === pet) return false;
  if (u.id === pet.mtMon.spareId && mt.world.time < pet.mtMon.spareUntil) return false; // own capture orb in flight
  if (u.team === pet.team) return false;
  if (u.team === TEAM.NEUTRAL && !allowWild) return false;
  if (u.kind !== KIND.CHAMPION && u.kind !== KIND.MINION && u.kind !== KIND.MONSTER && !mt.L.isStructure(u)) return false;
  if (u.mtMon && u.mtMon.capturing) return false;
  return mt.L.isTargetable(mt.world, pet, u);
}

/** Choose the pet's target this tick (or null = follow). */
function pickTarget(mt, pet, owner) {
  const w = mt.world, M = pet.mtMon, t = w.time;
  if (t < M.regroupUntil) return null;
  // 1. explicit focus
  if (M.focusId >= 0) {
    const f = w.units.get(M.focusId);
    if (t < M.focusUntil && enemyOf(mt, pet, f, true)) return f;
    M.focusId = -1;
  }
  // 2. what the trainer is attacking (incl. structures and wild monsters)
  const oid = owner.order && owner.order.type === 'attack' ? owner.order.targetId : owner.lastAttackT > t - 2.5 ? owner.lastAttackTargetId : -1;
  if (oid >= 0) { const o = w.units.get(oid); if (enemyOf(mt, pet, o, true) && dist(o.x, o.y, owner.x, owner.y) < OWNER_GUARD + 4) return o; }
  // 3. keep current target if still sensible
  const cur = pet.targetId >= 0 ? w.units.get(pet.targetId) : null;
  if (cur && enemyOf(mt, pet, cur, cur.team === TEAM.NEUTRAL) && dist(cur.x, cur.y, owner.x, owner.y) < OWNER_GUARD + 2 && !mt.L.isStructure(cur)) {
    if ((w.tickNo + pet.phase) % SCAN_EVERY !== 0) return cur;
  } else if ((w.tickNo + pet.phase) % SCAN_EVERY !== 0 && !cur) {
    // between scans, no target: only re-scan on the scan tick
    if (owner.lastHitTime < t - 0.1 && pet.lastHitTime < t - 0.1) return null;
  }
  // 4. whoever hurts my trainer or me
  for (const src of [owner, pet]) {
    if (src.lastHitTime > t - 2 && src.lastDamagedBy >= 0) {
      const a = w.units.get(src.lastDamagedBy);
      if (enemyOf(mt, pet, a, true) && !mt.L.isStructure(a) && dist(a.x, a.y, owner.x, owner.y) < OWNER_GUARD + 3) return a;
    }
  }
  // 5. nearest enemy (no structures, no wild monsters) near the pet and the trainer
  let best = null, bd = 1e9;
  const list = w.queryUnits(pet.x, pet.y, AGGRO, null, mt._scan || (mt._scan = []));
  for (const u of list) {
    if (!enemyOf(mt, pet, u, false) || mt.L.isStructure(u)) continue;
    if (dist2(u.x, u.y, owner.x, owner.y) > OWNER_GUARD * OWNER_GUARD) continue;
    // prefer champions/monsters over minions slightly
    const d = dist2(pet.x, pet.y, u.x, u.y) * (u.kind === KIND.MINION ? 1.4 : 1);
    if (d < bd || (d === bd && u.id < best.id)) { bd = d; best = u; }
  }
  return best;
}

function unitAI(mt, u) {
  const M = u.mtMon; if (!M) return;
  const w = mt.world, L = mt.L;
  if (M.capturing || M.evolving) { u.state = 'idle'; u.moving = false; u.targetId = -1; return; }
  if (M.ownerId < 0) return; // wild monsters normally run the legacy jungle AI (mtCtl false)
  const owner = w.units.get(M.ownerId);
  if (!owner || !owner.alive) { u.state = 'idle'; return; }
  if (L.isDisabled(w, u)) { u.state = 'disabled'; return; }
  const target = pickTarget(mt, u, owner);
  if (target) {
    u.targetId = target.id;
    u.lastCombatT = w.time;
    if (combat.tryAutoCast(mt, u, target)) return;
    const range = u.stats.attackRange;
    if (L.edgeDistPrev(u, target) <= range) {
      u.state = 'attacking';
      u.facing = Math.atan2(target.y - u.y, target.x - u.x);
      L.startAttack(w, u, target);
    } else if (!(u.attackWindupEnd > 0)) {
      u.state = 'moving';
      w.moveToward(u, target.prevX, target.prevY, range + target.radius + u.radius - 0.15, target);
    }
    return;
  }
  u.targetId = -1;
  combat.tryAutoCast(mt, u, null);
  // follow: slot behind-left of the trainer, hysteresis to avoid jitter
  const a = owner.facing + Math.PI * 0.8;
  const fx = owner.x + Math.cos(a) * 1.6, fy = owner.y + Math.sin(a) * 1.6;
  const d = dist(u.x, u.y, fx, fy);
  if (d > (u.state === 'moving' ? 0.8 : 2.4)) { u.state = 'moving'; w.moveToward(u, fx, fy, 0.7, owner); }
  else { u.state = 'idle'; if (!owner.moving) u.facing = owner.facing; }
}
