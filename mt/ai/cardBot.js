// mt/ai/cardBot.js — how bot trainers use their CARDS (mt/sim/cards.js, DESIGN §16). Owner: gameplay & pacing.
// Called from trainerBot.js actions() every bot decision (instead of the old trainer-skill rule) when cards are on.
//   at base: redraw (mulligan) expensive / useless shown cards once per visit while charges > 1
//   in the field: heal when low; shield in a losing trade; damage / control cards on enemy trainers & monsters in a
//   fight; power / spec cards on a big target; summon / power when pushing a tower; tower guard when defending;
//   tailwind / dash to escape; lucky orb before a throw. Mana is spent freely (it refills at base).
// Skill (difficulty BOT_SKILL): `abilityUse` gates how often a ready card is used and adds a reaction delay; `focus`
// picks the best target (low = nearest). Deterministic: rand01 only.

import { CARDS, CARD_RULES } from '../data/cards.js';
import { TRAINER } from '../data/balance.js';
import { rand01, dist } from '../sim/util.js';

const HERO = (e) => e && e.alive && (e.kind === 'champion' || (e.mtMon && e.mtMon.ownerId >= 0));
const BIG = (e) => HERO(e) || (e && e.alive && (e.epic || e.kind === 'tower' || e.kind === 'inhibitor' || e.kind === 'nexus'));

/** @returns {boolean} true when a card command was issued */
export function cardActions(mt, u, b, c, cmd, act) {
  const C = u.mtCards; if (!C) return false;
  const w = mt.world, t = w.time, S = b.skill || { abilityUse: 1, focus: 1 };
  const atBase = mt.cards && mt.cards.view(u.id).atBase;
  if (atBase) return baseActions(mt, u, b, c, cmd, act);
  if (t < (b.cardNext || 0) || !C.hand.length) return false;
  // reaction / sloppiness: Easy bots (abilityUse 0.45) use a ready card about half as often and later
  if (rand01(w, u.id, 0xCA7D, Math.floor(t * 2)) > 0.35 + 0.65 * S.abilityUse) { b.cardNext = t + 0.8; return false; }
  const shown = C.hand.slice(0, CARD_RULES.show);
  const plays = [];
  const { pet, petOk, hpT, hpP, inCombat, fight } = c;
  // Easy (rules.focusHuman < 0.5): a bot's cards leave a HUMAN trainer alone, like its monster's auto-targeting
  const shy = (e) => !!(mt.rules && e.mtTrainer && mt.rules.focusHuman(u.team, e) < 0.5);
  const foes = fight.enemies.filter((e) => HERO(e) && !shy(e));
  const goal = b.goal;
  for (let s = 0; s < shown.length; s++) {
    const id = shown[s], K = CARDS[id];
    if (!K || K.cost > C.mana) continue;
    let v = 0, aim = null;
    switch (id) {
      case 'heal': if (hpT < 0.45 || (petOk && hpP < 0.4)) v = 1.2 - Math.min(hpT, petOk ? hpP : 1); break;
      case 'mend': if (petOk && (hpP < 0.45 || hpT < 0.4) && (inCombat || hpP < 0.3)) v = 1.1 - Math.min(hpT, hpP); break;
      case 'shield': if (inCombat && (hpT < 0.6 || (petOk && hpP < 0.5)) && foes.length) v = 0.8; break;
      case 'bolt': { const f = pick(foes, u, K.range, S.focus); if (f && inCombat) { v = 0.7 + (1 - f.hp / f.maxHp) * 0.3; aim = { targetId: f.id }; } break; }
      case 'blast': case 'meteor': case 'trap': {
        const f = pick(foes, u, K.range, S.focus);
        if (f && (inCombat || id === 'trap')) { v = id === 'meteor' ? 0.75 : 0.65; aim = { x: f.x, y: f.y }; }
        else if (id === 'blast' && goal === 'FARM_LANE') { const m = minionClump(w, u, K.range, K.radius); if (m) { v = 0.35; aim = m; } }
        break;
      }
      case 'power': case 'rally': case 'surge': {
        const tg = petOk && pet.targetId >= 0 ? w.units.get(pet.targetId) : null;
        if (petOk && inCombat && BIG(tg) && hpP > 0.25) v = id === 'power' ? 0.6 : 0.75;
        break;
      }
      case 'summon': if (goal === 'PUSH' || goal === 'END') { v = 0.55; aim = { x: u.x, y: u.y }; } break;
      case 'haste': if ((goal === 'RETREAT' && foes.length) || (goal === 'FIGHT' && fight.ratio > 1.3 && foes.length)) v = 0.5; break;
      case 'dash': if (goal === 'RETREAT' && foes.length && hpT < 0.35) { const fo = c.fo, d = dist(u.x, u.y, fo.x, fo.y) || 1; v = 0.9; aim = { x: u.x + (fo.x - u.x) / d * K.range, y: u.y + (fo.y - u.y) / d * K.range }; } break;
      case 'bulwark': if (goal === 'DEFEND' && w.structures.some((st) => st.alive && st.team === u.team && dist(u.x, u.y, st.x, st.y) < K.range - 0.5)) v = 0.6; break;
      case 'lure': if (goal === 'CAPTURE' && b.capture && u.mtTrainer.cdEnd.capture <= t + 1) v = 0.5; break;
      default: break;   // ward: not used by bots (redrawn at base)
    }
    if (v > 0) plays.push({ s, id, v, aim });
  }
  if (!plays.length) return false;
  plays.sort((a, z) => z.v - a.v || a.s - z.s);
  const P = plays[0];
  if (cmd(mt, u, { type: 'card', slot: P.s, ...(P.aim || {}) })) {
    b.cardNext = t + CARD_RULES.playCd + (1 - S.abilityUse) * 1.5;
    const ST = mt.trainerBot.stats; ST.cards = (ST.cards || 0) + 1;
    act(mt, b, `CARD ${P.id} (${C.mana} mana left)`, 'card_' + P.id);
    return true;
  }
  b.cardNext = t + 1;
  return false;
}

/** at base: one redraw per visit of the expensive / useless cards among the shown ones (keeps a charge for later) */
function baseActions(mt, u, b, c, cmd, act) {
  const C = u.mtCards, w = mt.world;
  const visit = Math.floor(w.time / 30);   // at most once per ~30 s of standing at base
  if (C.mulligans <= 1 || b.cardMullVisit === visit) return false;
  b.cardMullVisit = visit;
  const S = b.skill || { abilityUse: 1 };
  if (rand01(w, u.id, 0xCA7E, visit) > S.abilityUse + 0.2) return false;   // Easy bots often keep a clumsy hand
  const full = u.mtTrainer.party.length >= TRAINER.maxParty;
  const idx = [];
  C.hand.slice(0, CARD_RULES.show).forEach((id, i) => {
    const K = CARDS[id]; if (!K) return;
    if (K.cost >= 4 || id === 'ward' || (id === 'lure' && full)) idx.push(i);
  });
  if (!idx.length) return false;
  if (cmd(mt, u, { type: 'mulligan', idx })) { act(mt, b, `REDRAW ${idx.length} card(s) at base`, 'card_mulligan'); return true; }
  return false;
}

function pick(list, u, range, focus) {
  let best = null, bs = -1e9;
  for (const e of list) {
    const d = dist(u.x, u.y, e.x, e.y); if (d > range) continue;
    const s = focus * (1 - e.hp / e.maxHp) * 4 + (e.kind === 'champion' ? focus : 0) - d * 0.15;
    if (s > bs || (s === bs && e.id < best.id)) { bs = s; best = e; }
  }
  return best;
}

function minionClump(w, u, range, radius) {
  const list = w.queryUnits(u.x, u.y, range, (o) => o.alive && o.kind === 'minion' && o.team === 1 - u.team, []);
  for (const m of list) {
    let n = 0; for (const o of list) if (dist(m.x, m.y, o.x, o.y) <= radius) n++;
    if (n >= 3) return { x: m.x, y: m.y };
  }
  return null;
}
