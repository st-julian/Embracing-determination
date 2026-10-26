// mt/sim/capture.js — Capture Orb (DESIGN.md §6). Owner: capture specialist.
//
// Flow (all deterministic, sim time):
//   commandCapture  validates (alive, cooldown, wild target, range 9 m, line of sight via legacy targetability,
//                   party-full confirmation) -> CD 5 s -> orb = legacy homing projectile (fx 'mt_capture_orb',
//                   speed = distance / 0.45 s so it lands in ~`travel` s)            event mt_capture_throw
//   orb hits        the monster is absorbed: invulnerable + untargetable, frozen, legacy jungle AI paused
//                   (mtCtl), its reset/leash state cleared                           event mt_capture_start
//   wobble n=1..3   every wobble is ONE hidden roll with chance p^(1/3) (so 3 passes = p overall):
//                   pass -> next wobble (or the "click" after the 3rd), fail -> the orb bursts
//                                                                                    event mt_capture_wobble {n}
//   success         wild unit removed (camp respawn bookkeeping as on death), PartyRecord added: ACTIVE if the
//                   party had nothing usable out (deployed at the orb), else BENCH; a full party replaces the bench
//                                                                                    event mt_capture_success
//   failure         monster pops out angry (+20 % AS for 3 s) and retaliates on the thrower
//                                                                                    event mt_capture_fail
//   miss            the orb never reached the target (died / someone else's orb / reset) -> cooldown refunded
//                                                                                    event mt_capture_miss
// Party full (2): the first throw command only asks (mt_confirm_replace); a second capture command on the same target
// within 3 s — or cmd.confirm === true (bots) — throws, and a success releases the BENCHED monster.
// Only wild jungle/meadow monsters are capturable (not minions, not owned monsters, not the river boss).
// Capture without any monster: the trainer's sling (22 dmg) wears a Lv 1 starter-meadow juvenile down (meadow
// monsters deal 50 % damage) — see debug fixture 'capture_sling'.
//
// p = clamp(catch × (0.08 + 0.92 × (1 − hp/maxHp)^1.3) + statusBonus − 0.25 × max(0, level − 3), 0.03, 0.97)
// statusBonus = +0.1 while slowed, rooted, stunned or knocked up.

import { CAPTURE, TRAINER } from '../data/balance.js';
import { FORMS, LINES } from '../data/species.js';
import { KIND, TEAM, dist, rand01, isWild, isPet } from './util.js';
import * as monsters from './monsters.js';
import { t } from '../i18n/index.js'; // player-facing refusal texts (mt_deny)

/** Orb flight apex height (m) for renderers (the sim orb is 2D). */
export const ORB_ARC_HEIGHT = 2.2;
/** Delay between the failing wobble and the burst / between the 3rd wobble and the "click" (fractions of wobbleInterval). */
const BREAK_DELAY = 0.55, CLICK_DELAY = 0.6;
/** HP fraction under which mt_capture_ready hints the HUD ("throw now!"). */
export const READY_HP_FRAC = 0.4;
/** Minimum HP fraction a freshly caught monster keeps (it rests a moment in the orb). */
const CAUGHT_MIN_HP = 0.25;

/**
 * @typedef {Object} CaptureState  (wildUnit.mtMon.capturing — truthy while the monster is inside an orb)
 * @property {number} trainer  thrower id  @property {number} team  thrower team
 * @property {number} p        success chance at absorb time (hidden)
 * @property {'absorb'|'wobble'|'break'|'click'} phase
 * @property {number} n        wobbles shown so far (0..3)
 * @property {number} t0       absorb time  @property {number} nextT  next step time
 * @property {number} x  @property {number} y   orb position (the unit is pinned there)
 */

export function install(mt) {
  mt.on('postTick', step);
  mt.on('damage', hint);
}

/** Wild, capturable target? (not epic, not owned, not already in an orb, not resetting/invulnerable) */
export function isCapturable(u) {
  return isWild(u) && u.alive && !u.removed && u.team === TEAM.NEUTRAL && !u.epic && !u.mtMon.capturing && !u.untargetable && !u.invulnerable;
}

/**
 * Pure DESIGN §6 probability.
 * @param {{catchRate:number, hpFrac:number, status?:boolean, level?:number, bonus?:number}} o   bonus = the human's
 *        catch assist (rules.captureBonus), added before the clamp
 */
export function captureProbability(o) {
  const hpTerm = Math.pow(Math.max(0, Math.min(1, 1 - o.hpFrac)), CAPTURE.hpExponent);
  const status = o.status ? CAPTURE.statusBonus : 0;
  const above = Math.max(0, (o.level || 1) - CAPTURE.levelPenaltyAbove);
  const p = o.catchRate * (CAPTURE.floor + (1 - CAPTURE.floor) * hpTerm) + status - CAPTURE.levelPenalty * above + (o.bonus || 0);
  return Math.min(CAPTURE.pMax, Math.max(CAPTURE.pMin, p));
}

/** Per-wobble hidden roll chance so that three passes give p overall. */
export function wobbleChance(p) { return Math.pow(Math.max(0, Math.min(1, p)), 1 / 3); }

/** Is the unit slowed / rooted / stunned / knocked up right now? */
export function hasCaptureStatus(u, now) {
  const t = u.cc; if (!t) return false;
  return t.slowUntil > now || t.rootUntil > now || t.stunUntil > now || t.airborneUntil > now;
}

/** DESIGN §6 probability for a live wild unit; `bonus` = the thrower's catch assist (`mt.rules.captureBonus(trainer)`,
 *  0 for bots / Hard — pass it to show the human the chance the throw will really roll). */
export function captureChance(u, now, bonus = 0) {
  const line = LINES[FORMS[u.mtMon.form].line];
  return captureProbability({ catchRate: line.catch, hpFrac: u.hp / u.maxHp, status: hasCaptureStatus(u, now), level: u.level || 1, bonus });
}

/** HUD-friendly band for a chance. */
export function chanceBand(p) { return p >= 0.6 ? 'great' : p >= 0.35 ? 'good' : 'ok'; }

function bonusOf(mt, trainer) { return mt.rules && mt.rules.captureBonus ? mt.rules.captureBonus(trainer) : 0; }

function deny(mt, trainer, code, text) { mt.emit(mt.E.DENY, { trainer: trainer.id, code, text }); return false; }

function info(u) { const f = FORMS[u.mtMon.form]; return { form: f.id, name: f.name, level: u.level || 1 }; }

/**
 * {type:'capture', targetId?, x?, y?, confirm?}
 * Party full: the first press only asks for confirmation (mt_confirm_replace); a second press within 3 s
 * (or cmd.confirm === true, used by bots) throws and the capture replaces the benched monster.
 */
export function commandCapture(mt, trainer, cmd) {
  const w = mt.world, T = trainer.mtTrainer;
  if (!trainer.alive) return deny(mt, trainer, 'dead', t('deny.dead'));
  if (w.time < T.cdEnd.capture) return deny(mt, trainer, 'cooldown', t('deny.captureCd', { n: Math.ceil(T.cdEnd.capture - w.time) }));
  let tgt = cmd.targetId >= 0 ? w.units.get(cmd.targetId) : null;
  let why = tgt ? whyNot(tgt) : null;
  if (why) tgt = null;
  if (!tgt && Number.isFinite(cmd.x) && Number.isFinite(cmd.y)) {
    let bd = CAPTURE.targetPickRadius;
    for (const u of w.queryUnits(cmd.x, cmd.y, CAPTURE.targetPickRadius + 1, isCapturable, [])) {
      const d = dist(u.x, u.y, cmd.x, cmd.y) - u.radius; if (d < bd || (d === bd && tgt && u.id < tgt.id)) { bd = d; tgt = u; }
    }
    if (!tgt && !why) {
      for (const u of w.queryUnits(cmd.x, cmd.y, CAPTURE.targetPickRadius, (o) => o.alive && (o.kind === KIND.MONSTER || o.kind === KIND.MINION), [])) { why = whyNot(u); if (why) break; }
    }
  }
  if (!tgt) return deny(mt, trainer, why ? why[0] : 'no_target', why ? why[1] : t('deny.noWild'));
  if (mt.L.isTargetable && !mt.L.isTargetable(w, trainer, tgt)) return deny(mt, trainer, 'no_target', t('deny.cantSee'));
  if (dist(trainer.x, trainer.y, tgt.x, tgt.y) > CAPTURE.range + tgt.radius) return deny(mt, trainer, 'range', t('deny.tooFar'));
  if (T.party.length >= TRAINER.maxParty && !cmd.confirm) {
    if (!T.confirm || w.time > T.confirm.until || T.confirm.targetId !== tgt.id) {
      T.confirm = { until: w.time + CAPTURE.confirmWindow, targetId: tgt.id };
      const bench = monsters.benchRecord(trainer), ti = info(tgt);
      mt.emit(mt.E.CONFIRM_REPLACE, {
        trainer: trainer.id, team: trainer.team, targetId: tgt.id, until: T.confirm.until,
        form: bench ? bench.form : null, name: bench ? FORMS[bench.form].name : null, level: bench ? bench.level : 0, rid: bench ? bench.rid : -1,
        targetForm: ti.form, targetName: ti.name, targetLevel: ti.level,
      });
      return false;
    }
  }
  T.confirm = null;
  return throwOrb(mt, trainer, tgt);
}

/** Why a unit can't be captured -> [code, text] or null if it can. */
function whyNot(u) {
  if (!u || !u.alive || u.removed) return ['no_target', t('deny.noWild')];
  if (isPet(u)) return ['owned', t('deny.owned')];
  if (u.epic) return ['boss', t('deny.boss')];
  if (!isWild(u)) return u.kind === KIND.MINION ? ['minion', t('deny.minion')] : ['no_target', t('deny.onlyWild')];
  if (u.mtMon.capturing) return ['busy', t('deny.inOrb')];
  if (u.invulnerable || u.untargetable) return ['resetting', t('deny.fleeing')];
  return null;
}

function throwOrb(mt, trainer, tgt) {
  const w = mt.world, T = trainer.mtTrainer;
  T.cdEnd.capture = w.time + CAPTURE.cooldown;
  const d = dist(trainer.x, trainer.y, tgt.x, tgt.y);
  mt.stats.captureAttempts++;
  trainer.facing = Math.atan2(tgt.y - trainer.y, tgt.x - trainer.x);
  const travel = CAPTURE.travel, speed = Math.max(4, d / travel);
  // throwing interrupts the sling, and the pet holds its attacks on the target until the orb resolves
  // (so a lucky last hit can't steal the capture)
  if (trainer.order && trainer.order.type === 'attack' && trainer.order.targetId === tgt.id) trainer.order = null;
  if (trainer.attackTargetId === tgt.id) mt.L.cancelAttack(w, trainer, false);
  const pet = monsters.activeUnit(mt, trainer);
  if (pet && pet.mtMon) {
    pet.mtMon.spareId = tgt.id; pet.mtMon.spareUntil = w.time + d / speed + 0.25;
    if (pet.targetId === tgt.id) { pet.targetId = -1; mt.L.cancelAttack(w, pet, false); }
    if (pet.mtMon.focusId === tgt.id) pet.mtMon.focusId = -1;
  }
  let hit = false;
  const orb = mt.L.spawnProjectile(w, {
    src: trainer, x: trainer.x, y: trainer.y, tx: tgt.x, ty: tgt.y, targetId: tgt.id,
    speed, radius: 0.25, fx: 'mt_capture_orb', element: 'light', height: 1.2,
    onHit: (world, proj, unit) => { hit = true; absorb(mt, trainer, unit); },
    onEnd: (world, proj) => { if (!hit) miss(mt, trainer, tgt.id, proj.x, proj.y); },
  });
  if (orb) { orb.mtArc = ORB_ARC_HEIGHT; orb.mtTravel = travel; }
  mt.emit(mt.E.CAPTURE_THROW, {
    trainer: trainer.id, team: trainer.team, x: trainer.x, y: trainer.y, tx: tgt.x, ty: tgt.y, targetId: tgt.id, ...info(tgt),
    travel, landAt: w.time + d / speed, arcHeight: ORB_ARC_HEIGHT, orbId: orb ? orb.id : -1,
  });
  return true;
}

function miss(mt, trainer, targetId, x, y) {
  const T = trainer.mtTrainer, w = mt.world;
  T.cdEnd.capture = Math.min(T.cdEnd.capture, w.time + 1);
  mt.emit(mt.E.CAPTURE_MISS, { trainer: trainer.id, team: trainer.team, targetId, x, y });
}

function absorb(mt, trainer, u) {
  const w = mt.world;
  if (!isCapturable(u)) { miss(mt, trainer, u ? u.id : -1, u ? u.x : trainer.x, u ? u.y : trainer.y); return; }
  const p = captureChance(u, w.time, bonusOf(mt, trainer));
  const M = u.mtMon;
  M.capturing = { trainer: trainer.id, team: trainer.team, p, phase: 'absorb', n: 0, t0: w.time, nextT: w.time + CAPTURE.absorbTime, x: u.x, y: u.y };
  u.mtCtl = true; u.invulnerable = true; u.untargetable = true; u.targetId = -1;
  u.resetting = false;
  mt.L.cancelAttack(w, u, false);
  u.order = null; u.path = null; u.dash = null;
  mt.emit(mt.E.CAPTURE_START, { trainer: trainer.id, team: trainer.team, target: u.id, ...info(u), x: u.x, y: u.y, firstWobbleAt: M.capturing.nextT, p: +p.toFixed(3) });
}

function step(mt) {
  const w = mt.world;
  for (const u of w.unitList) {
    const C = u.mtMon && u.mtMon.capturing; if (!C || !u.alive) continue;
    u.x = u.prevX = C.x; u.y = u.prevY = C.y; u.moving = false;
    if (w.time < C.nextT) continue;
    const trainer = w.units.get(C.trainer);
    if (C.phase === 'absorb' || C.phase === 'wobble') {
      C.n++; C.phase = 'wobble';
      const pass = rand01(w, u.id, C.trainer, 100 + C.n) < wobbleChance(C.p);
      if (!pass) { C.phase = 'break'; C.nextT = w.time + CAPTURE.wobbleInterval * BREAK_DELAY; }
      else if (C.n >= 3) { C.phase = 'click'; C.nextT = w.time + CAPTURE.wobbleInterval * CLICK_DELAY; }
      else C.nextT = w.time + CAPTURE.wobbleInterval;
      mt.emit(mt.E.CAPTURE_WOBBLE, { trainer: C.trainer, team: C.team, target: u.id, ...info(u), n: C.n, x: C.x, y: C.y, nextAt: C.nextT });
      continue;
    }
    if (C.phase === 'click' && trainer && trainer.mtTrainer) succeed(mt, trainer, u);
    else fail(mt, u);
  }
}

function succeed(mt, trainer, u) {
  const w = mt.world, M = u.mtMon, C = M.capturing;
  // camp bookkeeping (same as legacy yC on death): free the slot, schedule respawn
  const st = u.camp != null ? w.campState.get(u.camp) : null;
  if (st) { const i = st.unitIds.indexOf(u.id); if (i >= 0) st.unitIds.splice(i, 1); if (!st.unitIds.length) st.respawnAt = w.time + st.camp.respawn; }
  const rec = monsters.makeRecord(mt, M.form, u.level || 1);
  rec.hpFrac = Math.max(CAUGHT_MIN_HP, u.hp / u.maxHp);
  rec.evolveNotified = false;
  const x = C.x, y = C.y, first = trainer.mtTrainer.party.length === 0;
  M.capturing = null;
  w.removeUnit(u);
  const { replaced, slot } = monsters.addToParty(mt, trainer, rec, { x, y, reason: 'capture' });
  mt.stats.captures++;
  mt.emit(mt.E.CAPTURE_SUCCESS, {
    trainer: trainer.id, team: trainer.team, target: u.id, ...monsters.describe(rec), x, y, wobbles: C.n, slot, first,
    replaced: replaced ? monsters.describe(replaced) : null,
  });
}

function fail(mt, u) {
  const w = mt.world, M = u.mtMon, C = M.capturing;
  M.capturing = null;
  u.mtCtl = false; u.invulnerable = false; u.untargetable = false;
  const thrower = w.units.get(C.trainer);
  if (thrower && thrower.alive) { u.lastDamagedBy = C.trainer; u.targetId = C.trainer; }
  u.lastHitTime = w.time;
  mt.L.addBuff(w, u, 'mt_angry', CAPTURE.failAngry.duration, { attackSpeedPct: CAPTURE.failAngry.attackSpeedPct });
  mt.stats.captureFails++;
  if (u.mtMon.hinted) u.mtMon.hinted.clear();
  mt.emit(mt.E.CAPTURE_FAIL, { trainer: C.trainer, team: C.team, target: u.id, ...info(u), x: u.x, y: u.y, wobbles: C.n, angryUntil: w.time + CAPTURE.failAngry.duration });
}

/** damage hook: a wild monster fought by a trainer (or its pet) dropped low -> one mt_capture_ready per trainer. */
function hint(mt, src, tgt) {
  if (!tgt || !isWild(tgt) || !tgt.alive || tgt.epic || tgt.mtMon.capturing || tgt.hp > tgt.maxHp * READY_HP_FRAC) return;
  const w = mt.world;
  const tr = src && src.mtTrainer ? src : src && isPet(src) ? w.units.get(src.ownerId) : null;
  if (!tr || !tr.mtTrainer) return;
  const H = tgt.mtMon.hinted || (tgt.mtMon.hinted = new Map());   // trainer id -> time (re-hint after 20 s)
  if (H.has(tr.id) && w.time - H.get(tr.id) < 20) return;
  H.set(tr.id, w.time);
  const p = captureChance(tgt, w.time, bonusOf(mt, tr));
  mt.emit(mt.E.CAPTURE_READY, { trainer: tr.id, team: tr.team, target: tgt.id, ...info(tgt), x: tgt.x, y: tgt.y, chance: +p.toFixed(2), band: chanceBand(p) });
}
