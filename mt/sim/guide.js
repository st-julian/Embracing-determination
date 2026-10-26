// mt/sim/guide.js — objective guidance for the on-screen guide (arrow + text drawn by the UI). Owner: gameplay & pacing.
//
//   app.mtGuide(unitId = app.playerId) -> Guide | null      (published by rules.js; also __moba.mt.guide(world, unitId))
//
// @typedef {Object} Guide
// @property {'catch'|'lane'|'evolve'|'help'|'push'|'defend'|'heal'|'respawn'} id   current suggested objective (ALWAYS one
//           while the trainer lives: the guide is useful all match, not only for a tutorial)
// @property {number} x  @property {number} y   world position to point at (sim metres; render z = y)
// @property {number} targetId   unit to point at (wild monster / ally trainer / structure / own monster) or -1
// @property {string} name       display name of that target ('' if none) — for text like "Catch Sparkit!"
// @property {string} key        suggested i18n key: 'guide.<id>' ('guide.catchNow' when `now`) (the UI owns the strings)
// @property {boolean} [now]     'catch': the target is weak enough — THROW THE ORB NOW (my monster holds its attacks on it)
// @property {number} [chance]   'catch' + now: current catch chance 0..1 (with the player's catch assist)
// @property {boolean} [wobbling] 'catch': my orb is wobbling on the target right now (stay; a break-free re-opens the window)
// @property {number} urgency    0..1 (UI may pulse / colour by it)
// @property {number} dist       metres from the trainer to (x, y)
// @property {number} [seconds]  'respawn': seconds left
// @property {string} [form]     'evolve' / 'catch': form id of the monster concerned
// @property {boolean} [bench]   'evolve': it is the BENCHED monster (the evolve command evolves it in its orb when the
//           active one is not ready; the EVOLVE button should light for it too)
// @property {{catch:number|null, lane:number|null, evolve:number|null, push:number|null}} steps
//           THIS match's tutorial steps for this trainer: world time each was really achieved (null = not yet) —
//           catch = a capture succeeded; lane = my monster fought an enemy minion; evolve = my monster evolved; push =
//           an enemy structure fell next to me (≤ 25 m) or after my monster hit it. Reset every match (sim state).
// @property {'catch'|'lane'|'evolve'|'push'|null} step   the first core step not achieved yet (tutorial order)
// @property {number} t          world time of the computation
//
// Priority: respawn (dead) > heal (trainer < 30 %, or no monster able to fight) > evolve (ready; anytime on Easy /
// Normal where evolving is safe, else when nobody hostile is near) > catch NOW (a wild monster I weakened is under 40 %
// and I have a free slot; or my orb is wobbling) > defend (an own structure within 35 m is attacked) > first catch (the
// opening: only the starter, t < 120 s, a wild monster within 45 m, fogged camps included) > help (an ally within 40 m is hit by an
// enemy trainer / monster and I am not fighting) > push (an attackable enemy structure on my lane tanked by ≥ 2 allied
// minions, ≤ 45 m) > catch (a free party slot and a catchable wild monster within 25 m; early: the starter meadow) >
// lane (where my lane's waves meet).
// Read-only over the world and cheap: one pass over the unit list, cached per (world, unit, tick) — call it every frame.

import { FORMS, nextFormId } from '../data/species.js';
import { TRAINER } from '../data/balance.js';
import { CAPTURE_WINDOW } from '../data/options.js';
import { KIND, TEAM, dist, isPet, isTrainer } from './util.js';
import { isCapturable, captureChance } from './capture.js';
import { i as FOUNTAINS } from '../../assets/map-oE9sOnNc.js';
import { progressOf, pointAtTeam, laneLen } from '../ai/geo.js';

const ROLE_LANE = { baron: 'top', mid: 'mid', duo: 'bot' };
const CORE = ['catch', 'lane', 'evolve', 'push'];
const cache = new WeakMap();   // world -> Map(unitId -> {tick, g})

export function guideFor(w, unitId) {
  if (!w || !w.mt || unitId == null) return null;
  let m = cache.get(w); if (!m) cache.set(w, (m = new Map()));
  const c = m.get(unitId);
  if (c && c.tick === w.tickNo) return c.g;
  const me = w.units.get(unitId);
  const g = me && me.mtTrainer ? compute(w, me) : null;
  m.set(unitId, { tick: w.tickNo, g });
  return g;
}

// ------------------------------------------------------------------------------------------------ step tracking
/** Install per-match step tracking (called from rules.js install). Writes only `mt.guideSteps` + `structure.mtHitByTr`
 *  (never read by the sim's decisions). */
export function trackSteps(mt) {
  const S = mt.guideSteps = new Map();   // trainer id -> {catch, lane, evolve, push}
  const w = mt.world;
  const of = (id) => { let s = S.get(id); if (!s) S.set(id, (s = { catch: null, lane: null, evolve: null, push: null })); return s; };
  const mark = (id, k) => { const s = of(id); if (s[k] == null) s[k] = +w.time.toFixed(1); };
  const ownerOf = (u) => (isTrainer(u) ? u : isPet(u) ? w.units.get(u.mtMon.ownerId) : null);
  mt.on('damage', (mt, src, tgt, amount) => {
    if (!src || !tgt || !(amount > 0)) return;
    const tr = ownerOf(src); if (!tr || !tr.mtTrainer || tgt.team === tr.team) return;
    if (tgt.kind === KIND.MINION && src !== tr) mark(tr.id, 'lane');
    if (mt.L.isStructure(tgt)) { if (!tgt.mtHitByTr) tgt.mtHitByTr = new Map(); tgt.mtHitByTr.set(tr.id, w.time); }
  });
  mt.on('kill', (mt, victim) => {
    if (!victim || !mt.L.isStructure(victim)) return;
    for (const c of w.champions) {
      if (!c.mtTrainer || c.team === victim.team) continue;
      const hit = victim.mtHitByTr && victim.mtHitByTr.get(c.id);
      if ((c.alive && dist(c.x, c.y, victim.x, victim.y) <= 25) || (hit != null && w.time - hit < 10)) mark(c.id, 'push');
    }
  });
  // captures / evolutions are emitted from capture.js / progression.js postTick hooks: scan after every module's
  // (registered at 'ready', i.e. behind them all)
  mt.on('ready', () => mt.on('postTick', () => {
    for (const e of w.events) {
      if (e.type === 'mt_capture_success' && e.trainer >= 0) mark(e.trainer, 'catch');
      else if (e.type === 'mt_evolve' && e.trainer >= 0) mark(e.trainer, 'evolve');
    }
  }));
}

function laneOf(w, me) {
  const R = w.mt.rules;
  if (R && R.lanes.length === 1) return R.lanes[0];
  const TB = w.mt.trainerBot, TM = TB && TB.teams && TB.teams[me.team];
  const l = TM && TM.lanes && TM.lanes.get(me.id);
  if (l && (!R || R.laneActive(l))) return l;
  const r = ROLE_LANE[me.role] || 'mid';
  return !R || R.laneActive(r) ? r : (R.lanes[0] || 'mid');
}

function compute(w, me) {
  const t = w.time, T = me.mtTrainer, team = me.team, enemy = 1 - team, fo = FOUNTAINS[team], R = w.mt.rules;
  const st = (w.mt.guideSteps && w.mt.guideSteps.get(me.id)) || { catch: null, lane: null, evolve: null, push: null };
  const steps = { ...st }, step = CORE.find((k) => steps[k] == null) || null;
  const out = (id, x, y, o = {}) => ({ id, x, y, targetId: o.targetId ?? -1, name: o.name || '', key: 'guide.' + (o.now ? 'catchNow' : id), urgency: o.urgency ?? 0.5,
    dist: +dist(me.x, me.y, x, y).toFixed(1), ...(o.now ? { now: true, chance: o.chance } : {}), ...(o.seconds != null ? { seconds: o.seconds } : {}),
    ...(o.form ? { form: o.form } : {}), ...(o.bench ? { bench: true } : {}), ...(o.wobbling ? { wobbling: true } : {}), steps, step, t });
  if (!me.alive) return out('respawn', fo.x, fo.y, { seconds: Math.max(0, Math.ceil((me.respawnAt || t) - t)), urgency: 0 });
  const rec = T.activeIdx >= 0 ? T.party[T.activeIdx] : null;
  const pet = rec && rec.unitId >= 0 ? w.units.get(rec.unitId) : null;
  const petUp = !!(pet && pet.alive && !pet.removed);
  const bench = T.party.length > 1 ? T.party[T.activeIdx === 0 ? 1 : 0] : null;
  const room = T.party.length < TRAINER.maxParty;

  // one pass: hostile heroes near, allies under attack, my lane's minions, catchable wilds
  const lane = laneOf(w, me);
  let heroNear = false, wild = null, ws = 1e9, weak = null, wk = 1e9, ally = null, ad = 40, ball = null, bballD = 12;
  // the opening: no catch yet (only the starter) -> the first catch comes before lane / push / help (CAPTURE_WINDOW)
  const opening = room && T.party.length < 2 && t < CAPTURE_WINDOW.openingUntil;
  let ownFront = null, enemyFront = null, ownMin = 0;
  const have = new Set(T.party.map((r) => FORMS[r.form] && FORMS[r.form].line));
  const myLv = rec ? rec.level : 0;
  const hitBy = (x) => {
    if (!(x && x.lastHitTime > t - 2 && x.lastDamagedBy >= 0)) return false;
    const s = w.units.get(x.lastDamagedBy);
    return !!(s && s.team === enemy && (s.kind === KIND.CHAMPION || (s.mtMon && s.mtMon.ownerId >= 0)));
  };
  for (const u of w.unitList) {
    if (!u.alive || u.removed) continue;
    const d = dist(me.x, me.y, u.x, u.y);
    if (u.team === enemy && (u.kind === KIND.CHAMPION || (u.mtMon && u.mtMon.ownerId >= 0)) && d < 10 && !(u.visible && u.visible[team] === false)) heroNear = true;
    if (u.kind === KIND.MINION && u.lane === lane && !(u.team === enemy && u.visible && u.visible[team] === false)) {
      const p = progressOf(team, lane, u.x, u.y);
      if (u.team === team) { ownMin++; if (ownFront === null || p.ts > ownFront) ownFront = p.ts; }
      else if (u.team === enemy && (enemyFront === null || p.ts < enemyFront)) enemyFront = p.ts;
    }
    if (u.kind === KIND.CHAMPION && u.team === team && u !== me && u.mtTrainer && d < ad) {
      const ap = u.mtTrainer.activeIdx >= 0 ? u.mtTrainer.party[u.mtTrainer.activeIdx] : null;
      const apu = ap && ap.unitId >= 0 ? w.units.get(ap.unitId) : null;
      if (hitBy(u) || hitBy(apu)) { ad = d; ally = u; }
    }
    if (u.team === TEAM.NEUTRAL && u.mtMon && u.mtMon.capturing && u.mtMon.capturing.trainer === me.id && d < bballD) { bballD = d; ball = u; }
    if (u.team === TEAM.NEUTRAL && u.mtMon && isCapturable(u) && d < 45) {
      // a fogged wild monster only for the opening suggestion (camps are map knowledge), never as "throw now"
      const seen = u.visible ? u.visible[team] !== false : true;
      if (!seen && !opening) continue;
      const lv = u.level || 1, f = u.hp / u.maxHp;
      if (seen && room && d < 12 && (f <= CAPTURE_WINDOW.holdHp || (u.mtHold && u.mtHold.by === me.id && t < u.mtHold.until)) && d < wk) { wk = d; weak = u; }
      if (T.party.length && lv > myLv + 1) continue;
      const s = d - (have.has(u.mtMon.line) ? 0 : 8) - (1 - f) * 20 + Math.max(0, lv - myLv) * 6 + (seen ? 0 : 10);
      if (s < ws) { ws = s; wild = u; }
    }
  }

  // 1. heal: the trainer is low, or no monster can fight (respawn timers are short: go home and come back)
  const hpT = me.hp / me.maxHp, atBase = dist(me.x, me.y, fo.x, fo.y) < 12;
  const benchOk = bench && !bench.fainted && bench.hpFrac > 0.4;
  const allDown = T.party.length > 0 && T.party.every((r) => r.fainted) && Math.min(...T.party.map((r) => r.faintUntil)) - t > 8;
  if (!atBase && (hpT < 0.3 || allDown || (petUp && pet.hp / pet.maxHp < 0.2 && !benchOk))) return out('heal', fo.x, fo.y, { urgency: hpT < 0.2 ? 1 : 0.8 });
  // 2. evolve: safe anywhere on Easy / Normal; on Hard only when nothing hostile is near
  const safe = R ? R.safeEvolve() : false;
  if (rec && petUp && !rec.evolving && !pet.mtMon.evolving && nextFormId(rec.form) && rec.level >= FORMS[rec.form].evolveLevel && (safe || (!heroNear && pet.lastHitTime < t - 2))) {
    return out('evolve', pet.x, pet.y, { targetId: pet.id, name: FORMS[rec.form].name, form: rec.form, urgency: 0.9 });
  }
  if (bench && !bench.fainted && !bench.evolving && nextFormId(bench.form) && bench.level >= FORMS[bench.form].evolveLevel && (safe || !heroNear)) {
    return out('evolve', me.x, me.y, { name: FORMS[bench.form].name, form: bench.form, urgency: 0.7, bench: true });
  }
  // 3. catch NOW: a weakened wild monster next to me and a free slot (my monster holds its attacks on it); my orb is
  //    wobbling on one -> stay there (`ball`: it may break free, the window re-opens)
  const bonus = R && R.captureBonus ? R.captureBonus(me) : 0;
  if (weak) return out('catch', weak.x, weak.y, { targetId: weak.id, name: weak.name, form: weak.mtMon.form, urgency: 1, now: true, chance: +captureChance(weak, t, bonus).toFixed(2) });
  if (ball) return out('catch', ball.x, ball.y, { targetId: ball.id, name: ball.name, form: ball.mtMon.form, urgency: 0.9, wobbling: true });
  const wd = wild ? dist(me.x, me.y, wild.x, wild.y) : 1e9;
  const catchOut = () => out('catch', wild.x, wild.y, { targetId: wild.id, name: wild.name, form: wild.mtMon.form, urgency: 0.6 });
  // 4. defend: an own structure within 35 m with enemies in its range
  if (petUp) {
    let best = null, bd = 35;
    for (const s of w.structures) {
      if (!s.alive || s.team !== team) continue;
      const d = dist(me.x, me.y, s.x, s.y); if (d >= bd) continue;
      let heroes = 0, mins = 0;
      for (const u of w.unitList) {
        if (!u.alive || u.team !== enemy || dist(u.x, u.y, s.x, s.y) > 9 || (u.visible && u.visible[team] === false)) continue;
        if (u.kind === KIND.MINION) mins++; else if (u.kind === KIND.CHAMPION || (u.mtMon && u.mtMon.ownerId >= 0)) heroes++;
      }
      if (heroes || mins >= 3) { bd = d; best = s; }
    }
    if (best) return out('defend', best.x, best.y, { targetId: best.id, name: best.kind, urgency: 0.85 });
  }
  // 4b. the opening's first catch (only the starter, first two minutes): a wild monster up to openingRange m away
  if (opening && wild && !heroNear && wd < CAPTURE_WINDOW.openingRange) return catchOut();
  // 5. help a team-mate in a fight (only if I am not in one)
  const busy = heroNear || (petUp && pet.lastHitTime > t - 2) || me.lastHitTime > t - 2;
  if (ally && !busy && petUp) return out('help', ally.x, ally.y, { targetId: ally.id, name: ally.name, urgency: 0.8 });
  // 6. push: an attackable enemy structure on my lane with allied minions tanking it
  if (petUp && ownMin >= 2) {
    let best = null, bd = 45;
    for (const s of w.structures) {
      if (!s.alive || s.team !== enemy || s.invulnerable || !(s.lane === lane || s.lane === 'base' || s.kind === KIND.NEXUS)) continue;
      const d = dist(me.x, me.y, s.x, s.y); if (d >= bd) continue;
      let mins = 0;
      for (const u of w.unitList) if (u.alive && u.kind === KIND.MINION && u.team === team && dist(u.x, u.y, s.x, s.y) < 9) mins++;
      if (mins >= 2) { bd = d; best = s; }
    }
    if (best) return out('push', best.x, best.y, { targetId: best.id, name: best.name || best.kind, urgency: 0.7 });
  }
  // 7. catch: no monster at all, or a free slot and a catchable wild monster near (the starter meadow in the opening)
  if (wild && (!T.party.length || (room && !heroNear && (wd < 25 || (myLv >= 4 && wd < 35))))) return catchOut();
  // 8. lane: where the waves meet; before the enemy wave shows up, ahead of my own wave (never my own base)
  const len = laneLen(lane);
  let s;
  if (ownFront != null && enemyFront != null) s = (ownFront + enemyFront) / 2 - 3;
  else if (ownFront != null) s = Math.max(ownFront + 6, len * 0.45);
  else if (enemyFront != null) s = enemyFront - 5;
  else s = len * 0.48;
  const p = pointAtTeam(team, lane, Math.max(10, Math.min(len - 10, s)));
  return out('lane', p.x, p.y, { name: lane, urgency: 0.4 });
}

/** publish `app.mtGuide(unitId = app.playerId)` once on the app object (called from rules.js install) */
export function publishGuide() {
  const app = typeof globalThis !== 'undefined' ? globalThis.__moba : null;
  if (!app || typeof app !== 'object' || app.mtGuide) return;
  app.mtGuide = (unitId) => guideFor(app.world, unitId ?? app.playerId);
}
