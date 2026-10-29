// mt/sim/cards.js — trainer CARDS (docs/DESIGN.md §16; data mt/data/cards.js). Owner: gameplay & pacing.
// Only when the match option `cards` is on (options.js, default true); off = the old single trainer skill (Rally /
// Mend / Surge on R) exactly as before.
//
// State on every trainer unit:  unit.mtCards = { deck, hand, used, mana, manaMax, mulligans }
//   deck   draw pile (card ids, top = last element), shuffled per trainer from the world seed (rand01)
//   hand   ordered list (≤ CARD_RULES.hand); hand[0 .. show-1] are the castable slots; a played card's slot takes
//          hand[show] (the next card slides in), so the other shown cards keep their places
//   used   played + redrawn cards, out of circulation until the deck runs dry (then they are reshuffled into it)
//   mana   spent by cards; no regen in the field; +takedownMana per takedown credit; full on every base visit
//   mulligans  redraw charges (start 3, +1 per takedown credit, +1 per enemy tower the team destroys, cap 6)
// Base visit (match start, respawn, recall arrival, walking into the fountain area = legacy `inFountain`, 13 m):
// mana full, hand drawn back up to 10 (mt_card_refill). Mulligan / reorder only at base (deny 'not_base').
//
// Commands (world.command(trainerId, cmd), routed through the mt 'command' hook before trainers.js):
//   {type:'card', slot:0..4, targetId?, x?, y?}     play hand[slot]
//   {type:'mulligan', idx:[hand indices]}            base only, 1 charge: those cards go to `used`, the same number
//                                                    is drawn into the same places
//   {type:'cardMove', from, to}                      base only: move hand[from] to index `to`
//   refusals: mt_deny codes 'no_mana' | 'not_base' | 'no_mulligan' | 'bad_target' | 'cooldown' | 'dead' | 'cards_off'
// With cards on, the old trainer skill (R / trainerSkill) is refused ('cards_on'): the spec skill is a card now.
// View: app.mtCards(trainerId) -> {on, hand, shown, mana, manaMax, mulligans, atBase, deckLeft} (cached per tick).
// Deterministic: rand01(world, ...) only, sim time only, no wall clock; card effects use the legacy damage / heal /
// shield / CC / buff paths, so the mt damage scalars (difficulty handicap, spec, structures) apply as for any hit.

import { CARDS, DECKS, CARD_RULES } from '../data/cards.js';
import { SPEC_IDS } from '../data/balance.js';
import { KIND, TEAM, dist, dist2, rand01, isPet, isTrainer, isWild, teleportUnit } from './util.js';
import * as monsters from './monsters.js';
import { specSkillEffect, deny } from './trainers.js';
import { nearestLane } from '../ai/geo.js';
import { t } from '../i18n/index.js';

export { CARDS, DECKS, CARD_RULES };

export function install(mt) {
  const on = !(mt.rules && mt.rules.options && mt.rules.options.cards === false);
  mt.cards = { on, catchBonus: (tr) => catchBonus(mt, tr), consumeCatch: (tr) => consumeCatch(mt, tr), view: (id) => view(mt, id) };
  publishView();
  if (!on) return;
  mt.on('ready', (mt) => { for (const u of mt.world.champions) if (u.mtTrainer) deal(mt, u); });
  mt.on('command', onCommand);
  mt.on('postTick', postTick);
  mt.on('kill', onKill);
}

// ------------------------------------------------------------------------------------------------ deck mechanics
function sys(u) { return u.mtCardsSys || (u.mtCardsSys = { cdUntil: 0, shuffles: 0, wasAtBase: true, catchUntil: 0, catchBonus: 0 }); }

/** Fisher–Yates from the world seed: (trainer id, shuffle number, position) -> the same order on every peer. */
function shuffle(mt, u, arr) {
  const S = sys(u), n = ++S.shuffles, w = mt.world;
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand01({ seed: w.seed, tickNo: n }, u.id, 0xCA4D, i) * (i + 1));
    const x = arr[i]; arr[i] = arr[j]; arr[j] = x;
  }
  return arr;
}

/** draw one card (reshuffles `used` into the deck when it is empty); null when nothing is left anywhere */
function draw(mt, u) {
  const C = u.mtCards;
  if (!C.deck.length && C.used.length) { C.deck = shuffle(mt, u, C.used.splice(0)); C._reshuffled = true; }
  return C.deck.length ? C.deck.pop() : null;
}

export function deckFor(spec) { return (DECKS[spec] || DECKS[SPEC_IDS[0]]).slice(); }

/** match start: shuffle the spec deck, draw 10, full mana, 3 charges */
export function deal(mt, u) {
  const R = CARD_RULES;
  u.mtCards = { deck: [], hand: [], used: [], mana: R.mana, manaMax: R.mana, mulligans: R.mulligans };
  u.mtCards.deck = shuffle(mt, u, deckFor(u.mtTrainer.spec));
  sys(u).wasAtBase = true;
  refill(mt, u, 'start');
}

/** base visit: full mana, hand back up to CARD_RULES.hand */
export function refill(mt, u, reason = 'base') {
  const C = u.mtCards; if (!C) return;
  C._reshuffled = false;
  let drawn = 0;
  while (C.hand.length < CARD_RULES.hand) { const c = draw(mt, u); if (c == null) break; C.hand.push(c); drawn++; }
  C.mana = C.manaMax;
  mt.emit(mt.E.CARD_REFILL, { trainer: u.id, team: u.team, reason, drawn, mana: C.mana, reshuffled: !!C._reshuffled });
}

export function atBase(mt, u) {
  const w = mt.world;
  return !!(u && u.alive && (typeof w.inFountain === 'function' ? w.inFountain(u) : false));
}

function addCharge(mt, u, n, why) {
  const C = u.mtCards; if (!C) return;
  const before = C.mulligans;
  C.mulligans = Math.min(CARD_RULES.mulliganMax, C.mulligans + n);
  if (why === 'takedown') C.mana = Math.min(C.manaMax, C.mana + CARD_RULES.takedownMana);
  if (C.mulligans !== before || why === 'takedown') mt.emit(mt.E.CARD_CHARGE, { trainer: u.id, team: u.team, left: C.mulligans, why, mana: C.mana });
}

// ------------------------------------------------------------------------------------------------ hooks
function postTick(mt) {
  const w = mt.world;
  for (const u of w.champions) {
    if (!u.mtCards) continue;
    const S = sys(u), b = atBase(mt, u);
    if (b && !S.wasAtBase) refill(mt, u, 'base');   // respawn / recall arrival / walked in
    S.wasAtBase = b;
  }
}

function onKill(mt, victim) {
  const w = mt.world;
  if (victim && victim.mtTrainer) {
    // takedown credit = the legacy KILL event of this death (killer + assists, after the kill-credit hooks)
    let ev = null;
    for (let i = w.events.length - 1; i >= 0; i--) { const e = w.events[i]; if (e.type === mt.EVENT.KILL && e.victim === victim.id) { ev = e; break; } }
    if (!ev) return;
    const ids = [ev.killer, ...(ev.assists || [])];
    const seen = new Set();
    for (const id of ids) {
      if (seen.has(id)) continue; seen.add(id);
      const k = w.units.get(id);
      if (k && k.mtCards && k.team !== victim.team) addCharge(mt, k, CARD_RULES.chargeTakedown, 'takedown');
    }
    return;
  }
  if (victim && victim.kind === KIND.TOWER && (victim.team === 0 || victim.team === 1)) {
    for (const u of w.champions) if (u.mtCards && u.team === 1 - victim.team) addCharge(mt, u, CARD_RULES.chargeTower, 'tower');
  }
}

function onCommand(mt, unit, cmd) {
  if (!isTrainer(unit) || !cmd) return undefined;
  switch (cmd.type) {
    case 'card': return playCard(mt, unit, cmd);
    case 'mulligan': return mulligan(mt, unit, cmd);
    case 'cardMove': return cardMove(mt, unit, cmd);
    case 'trainerSkill': return mt.legacyBotPhase ? false : deny(mt, unit, 'cards_on', t('deny.cardsOn'));
    case 'cast': if (cmd.slot === 'R') return mt.legacyBotPhase ? false : deny(mt, unit, 'cards_on', t('deny.cardsOn')); return undefined;
  }
  return undefined;
}

// ------------------------------------------------------------------------------------------------ commands
export function playCard(mt, u, cmd) {
  const w = mt.world, C = u.mtCards, R = CARD_RULES, now = w.time;
  if (!C) return deny(mt, u, 'cards_off', t('deny.cardsOff'));
  if (!u.alive) return deny(mt, u, 'dead', t('deny.dead'));
  const slot = cmd.slot;
  if (!Number.isInteger(slot) || slot < 0 || slot >= Math.min(R.show, C.hand.length)) return deny(mt, u, 'bad_target', t('deny.noCard'));
  const id = C.hand[slot], card = CARDS[id];
  if (!card) return deny(mt, u, 'bad_target', t('deny.noCard'));
  if (now < sys(u).cdUntil) return deny(mt, u, 'cooldown', t('deny.cardCd'));
  if (C.mana < card.cost) return deny(mt, u, 'no_mana', t('deny.noMana', { n: card.cost }));
  const aim = resolveAim(mt, u, card, cmd);
  if (!aim) return deny(mt, u, 'bad_target', t('deny.cardTarget'));
  const fx = EFFECTS[id] ? EFFECTS[id](mt, u, card, aim) : null;
  if (!fx) return deny(mt, u, 'bad_target', t('deny.cardTarget'));
  if (fx.target) aim.target = fx.target;
  C.mana -= card.cost;
  if (C.hand.length > R.show) { C.hand[slot] = C.hand[R.show]; C.hand.splice(R.show, 1); }
  else C.hand.splice(slot, 1);
  C.used.push(id);
  sys(u).cdUntil = now + R.playCd;
  mt.emit(mt.E.CARD_PLAY, { trainer: u.id, team: u.team, card: id, slot, cost: card.cost, mana: C.mana, x: aim.x, y: aim.y,
    target: aim.target ? aim.target.id : -1, ...(card.delay ? { delay: card.delay } : {}), ...(card.radius ? { radius: card.radius } : {}) });
  return true;
}

export function mulligan(mt, u, cmd) {
  const C = u.mtCards;
  if (!C) return deny(mt, u, 'cards_off', t('deny.cardsOff'));
  if (!atBase(mt, u)) return deny(mt, u, 'not_base', t('deny.notBase'));
  if (C.mulligans <= 0) return deny(mt, u, 'no_mulligan', t('deny.noMulligan'));
  const raw = Array.isArray(cmd.idx) ? cmd.idx : [];
  const idx = [...new Set(raw.filter((i) => Number.isInteger(i) && i >= 0 && i < C.hand.length))].sort((a, b) => a - b);
  if (!idx.length) return deny(mt, u, 'bad_target', t('deny.noCard'));
  // draw the replacements first (the cards going back must not come straight back), then discard
  const out = idx.map((i) => C.hand[i]);
  for (const i of idx) { const c = draw(mt, u); C.hand[i] = c; }
  C.used.push(...out);
  for (let k = idx.length - 1; k >= 0; k--) if (C.hand[idx[k]] == null) {   // deck and discards were empty: take a discard back
    const c = draw(mt, u); if (c != null) C.hand[idx[k]] = c; else C.hand.splice(idx[k], 1);
  }
  C.mulligans--;
  mt.emit(mt.E.MULLIGAN, { trainer: u.id, team: u.team, n: idx.length, left: C.mulligans, idx });
  return true;
}

export function cardMove(mt, u, cmd) {
  const C = u.mtCards;
  if (!C) return deny(mt, u, 'cards_off', t('deny.cardsOff'));
  if (!atBase(mt, u)) return deny(mt, u, 'not_base', t('deny.notBase'));
  const n = C.hand.length, a = cmd.from, b = cmd.to;
  if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0 || a >= n || b >= n) return deny(mt, u, 'bad_target', t('deny.noCard'));
  if (a !== b) { const [c] = C.hand.splice(a, 1); C.hand.splice(b, 0, c); }
  return true;
}

// ------------------------------------------------------------------------------------------------ aim
const isEnemyUnit = (u, team) => !!(u && u.alive && !u.removed && u.team !== team && (u.team === 0 || u.team === 1) &&
  (isTrainer(u) || isPet(u) || u.kind === KIND.MINION) && !u.untargetable && !(u.mtMon && u.mtMon.capturing));

function resolveAim(mt, u, card, cmd) {
  const w = mt.world;
  if (card.target === 'unit') {
    const tg = Number.isInteger(cmd.targetId) ? w.units.get(cmd.targetId) : null;
    const ok = tg && (isEnemyUnit(tg, u.team) || (isWild(tg) && tg.alive && !tg.removed && !tg.mtMon.capturing && !tg.untargetable && !tg.epic));
    if (!ok || (tg.visible && tg.visible[u.team] === false)) return null;
    if (dist(u.x, u.y, tg.x, tg.y) > card.range + (tg.radius || 0.5)) return null;
    return { x: tg.x, y: tg.y, target: tg };
  }
  if (card.target === 'point') {
    if (!Number.isFinite(cmd.x) || !Number.isFinite(cmd.y)) return null;
    let x = cmd.x, y = cmd.y; const d = dist(u.x, u.y, x, y);
    if (d > card.range) { x = u.x + (x - u.x) / d * card.range; y = u.y + (y - u.y) / d * card.range; }
    return { x: Math.max(0, Math.min(120, x)), y: Math.max(0, Math.min(120, y)), target: null };
  }
  return { x: u.x, y: u.y, target: null };
}

// ------------------------------------------------------------------------------------------------ effects
const lvlOf = (u) => Math.max(1, u.level || 1);
const dmgOf = (card, u) => card.dmg + card.dmgPerLv * (lvlOf(u) - 1);
function petOf(mt, u) { const p = monsters.activeUnit(mt, u); return p && p.alive && !p.removed ? p : null; }
function hitArea(mt, u, card, x, y) {
  const w = mt.world, list = w.queryUnits(x, y, card.radius + 1, (o) => isEnemyUnit(o, u.team), []);
  const out = [];
  for (const o of list) if (dist2(x, y, o.x, o.y) <= (card.radius + (o.radius || 0.5)) ** 2) out.push(o);
  out.sort((a, b) => a.id - b.id);
  return out;
}
function status(mt, tgt, src, st, card, duration, power) {
  mt.world.emit(mt.E.STATUS, { tgt: tgt.id, src: src.id, status: st, ability: 'card_' + card.id, duration, power, x: tgt.x, y: tgt.y });
}

/** id -> (mt, trainer, card, aim) => truthy when the card took effect (false: refused as bad_target, nothing spent) */
const EFFECTS = {
  heal(mt, u, card) {
    const w = mt.world, pet = petOf(mt, u);
    mt.L.heal(w, u, u.maxHp * card.healPct, false, u); status(mt, u, u, 'heal', card, 0, 0);
    if (pet) { mt.L.heal(w, pet, pet.maxHp * card.healPct, false, u); status(mt, pet, u, 'heal', card, 0, 0); }
    return true;
  },
  shield(mt, u, card) {
    const w = mt.world, pet = petOf(mt, u);
    for (const o of [u, pet]) if (o) { mt.L.addShield(w, o, o.maxHp * card.shieldPct, card.duration, 'card_shield'); status(mt, o, u, 'shield', card, card.duration, Math.round(o.maxHp * card.shieldPct)); }
    return true;
  },
  haste(mt, u, card) {
    const w = mt.world;
    for (const c of w.champions) {
      if (!c.alive || c.team !== u.team || !c.mtTrainer || dist(u.x, u.y, c.x, c.y) > card.range) continue;
      for (const o of [c, petOf(mt, c)]) if (o) { mt.L.addBuff(w, o, 'mt_card_haste', card.duration, { msPct: card.msPct }); status(mt, o, u, 'buff', card, card.duration, 'mt_card_haste'); }
    }
    return true;
  },
  power(mt, u, card) {
    const pet = petOf(mt, u); if (!pet) return false;
    mt.L.addBuff(mt.world, pet, 'mt_card_power', card.duration, { damagePct: card.damagePct, attackSpeedPct: card.attackSpeedPct });
    status(mt, pet, u, 'buff', card, card.duration, 'mt_card_power');
    return true;
  },
  lure(mt, u, card) {
    const S = sys(u); S.catchBonus = card.bonus; S.catchUntil = mt.world.time + card.duration;
    status(mt, u, u, 'buff', card, card.duration, 'mt_card_lure');
    return true;
  },
  bulwark(mt, u, card) {
    const w = mt.world;
    let best = null, bd = card.range * card.range;
    for (const s of w.structures) { if (!s.alive || s.team !== u.team) continue; const d = dist2(u.x, u.y, s.x, s.y); if (d < bd) { bd = d; best = s; } }
    if (!best) return false;
    mt.L.addShield(w, best, best.maxHp * card.shieldPct, card.duration, 'card_bulwark');
    status(mt, best, u, 'shield', card, card.duration, Math.round(best.maxHp * card.shieldPct));
    return { target: best };
  },
  ward(mt, u, card, aim) {
    const w = mt.world;
    if (!u.ward || typeof w.placeWardAt !== 'function') return false;
    u.ward.charges++;
    const ok = w.placeWardAt(u, aim.x, aim.y);
    if (!ok) u.ward.charges--;
    return ok;
  },
  dash(mt, u, card, aim) {
    const w = mt.world;
    if (u.recallStart != null && typeof w.cancelRecall === 'function') w.cancelRecall(u);
    teleportUnit(w, u, aim.x, aim.y, u.x, u.y);
    w.markMoved && w.markMoved();
    return true;
  },
  summon(mt, u, card, aim) {
    const w = mt.world, R = mt.rules;
    if (!w.debug || typeof w.debug.spawnMinion !== 'function') return false;
    let lane = nearestLane(aim.x, aim.y); lane = lane ? lane.lane : 'mid';
    if (R && !R.laneActive(lane)) lane = R.lanes[0];
    for (let i = 0; i < card.count; i++) {
      const a = (i - (card.count - 1) / 2) * 1.2;
      const p = w.nav.landingPoint(u.x, u.y, aim.x + a, aim.y - a);
      const m = w.debug.spawnMinion(u.team, 'melee', lane, p.x, p.y);
      if (m) m.mtSummonedBy = u.id;
    }
    return true;
  },
  bolt(mt, u, card, aim) {
    const w = mt.world, tg = aim.target; if (!tg) return false;
    mt.L.dealDamage(w, u, tg, dmgOf(card, u), 'magic', { source: 'card' });
    return true;
  },
  blast(mt, u, card, aim) {
    const w = mt.world;
    for (const o of hitArea(mt, u, card, aim.x, aim.y)) mt.L.dealDamage(w, u, o, dmgOf(card, u), 'magic', { source: 'card' });
    return true;
  },
  trap(mt, u, card, aim) {
    const w = mt.world, x = aim.x, y = aim.y, dmg = dmgOf(card, u);
    w.schedule(card.delay, () => {
      if (!u || u.removed) return;
      for (const o of hitArea(mt, u, card, x, y)) { mt.L.dealDamage(w, u, o, dmg, 'magic', { source: 'card' }); if (o.alive) mt.L.applyCC(w, u, o, 'root', card.root); }
    });
    return true;
  },
  meteor(mt, u, card, aim) {
    const w = mt.world, x = aim.x, y = aim.y, dmg = dmgOf(card, u);
    w.schedule(card.delay, () => {
      if (!u || u.removed) return;
      for (const o of hitArea(mt, u, card, x, y)) mt.L.dealDamage(w, u, o, dmg, 'magic', { source: 'card' });
    });
    return true;
  },
  rally(mt, u) { const pet = petOf(mt, u); if (!pet) return false; specSkillEffect(mt, u, pet, 'attack'); return true; },
  mend(mt, u) { const pet = petOf(mt, u); if (!pet) return false; specSkillEffect(mt, u, pet, 'healing'); return true; },
  surge(mt, u) { const pet = petOf(mt, u); if (!pet) return false; specSkillEffect(mt, u, pet, 'magic'); return true; },
};
export const CARD_EFFECT_IDS = Object.keys(EFFECTS);

// ------------------------------------------------------------------------------------------------ capture boost
function catchBonus(mt, tr) {
  const S = tr && tr.mtCardsSys;
  return S && S.catchUntil > mt.world.time ? S.catchBonus : 0;
}
function consumeCatch(mt, tr) { const S = tr && tr.mtCardsSys; if (S) { S.catchUntil = 0; S.catchBonus = 0; } }

// ------------------------------------------------------------------------------------------------ read-only view
const viewCache = new WeakMap();   // world -> Map(id -> {tick, v})
function view(mt, id) {
  const w = mt.world;
  let m = viewCache.get(w); if (!m) viewCache.set(w, (m = new Map()));
  const c = m.get(id); if (c && c.tick === w.tickNo) return c.v;
  const u = w.units.get(id), C = u && u.mtCards;
  const hand = C ? C.hand.slice() : [];
  const v = { on: !!mt.cards.on, hand, shown: hand.slice(0, CARD_RULES.show), mana: C ? C.mana : 0, manaMax: C ? C.manaMax : 0,
    mulligans: C ? C.mulligans : 0, atBase: C ? atBase(mt, u) : false, deckLeft: C ? C.deck.length : 0 };
  m.set(id, { tick: w.tickNo, v });
  return v;
}

/** publish `app.mtCards(trainerId = app.playerId)` once on the app object */
function publishView() {
  const app = typeof globalThis !== 'undefined' ? globalThis.__moba : null;
  if (!app || typeof app !== 'object' || app.mtCards) return;
  app.mtCards = (id) => {
    const w = app.world;
    if (!w || !w.mt || !w.mt.cards) return { on: false, hand: [], shown: [], mana: 0, manaMax: 0, mulligans: 0, atBase: false, deckLeft: 0 };
    return w.mt.cards.view(id ?? app.playerId);
  };
}

void TEAM;
