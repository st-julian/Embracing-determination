// mt/sim/jungle.js — wild monster habitats, starter meadows, wild AI, river boss (DESIGN.md §12). Owner: jungle specialist.
//
// [MT-HOOK] campDefs rewrites the legacy camp list (MAP `C`) before camps are seeded:
//   - the 6 per-side legacy camps become element HABITATS (mirrored for fairness: red = mirror of blue), element per
//     camp read from `palette.habitat` (the same table world-art uses to paint/dress each habitat);
//   - river skitters and the Tyrant are removed; the Drake pit hosts the river boss "Ancient Galeclaw";
//   - 2 STARTER MEADOWS per base (Lv 1 juveniles, safe first captures, line rotates per respawn) inside the base zones.
// [MT-HOOK] campSpawn creates the wild mt monster for habitat/meadow camps (the legacy spawner adds it to the world).
//
// Wild AI = legacy jungle AI `_C` (retaliate vs `lastDamagedBy`, leash radius W.leashRadius / epic W.epicLeashRadius
// around home, patience W.patience s, then RESET: invulnerable walk home healing W.resetHealPerSec, full HP at home),
// steered every tick from preTick by this module so wild monsters fight back sensibly:
//   * target memory of every trainer/monster that hurt it (abilities included); the current target is kept for
//     WILD.stick s — no ping-pong between a kiting trainer and its biting monster; on re-pick it prefers the closest
//     attacker, monsters over trainers (the monsters are the ones "battling"; a trainer whose monster engaged is
//     released after the stick window), with hysteresis for the current target;
//   * a dead / fled / out-of-leash target makes it switch to the next valid attacker instead of resetting to full HP
//     mid-fight (legacy only remembered champions, so a fainted pet used to reset the boss);
//   * pack: a habitat's second monster joins in when its mate is attacked;
//   * habitat monsters (not meadow juveniles) use their A1 move with cooldown × WILD.castCdMult;
//   * idle habitat monsters grow to the current wild level (+1 per 90 s, max 9) and a habitat gains its second
//     monster from wild Lv 4, so an uncleared camp is never a free Lv 1 snack at 10:00.
// River boss (Ancient Galeclaw, legacy drake model/pit, camp id 'drake'): stats/timers from BOSS, telegraphed
// "Gale Burst" AoE on its target every BOSS.gust.every s. On kill: team buff +15 % dmg 90 s (combat.js, `mt_team_buff`),
// XP via progression (epic → XP.boss to the whole team), kill count in mt.laneState.bossKills (match stats).
// The legacy drake stacks are disabled (W.drake.maxStacks = 0).

import { JUNGLE } from '../data/balance.js';
import { t as PALETTE } from '../../assets/palette-L_rDAXd8.js';
import { juvenileOf } from '../data/species.js';
import { abilityFor } from '../data/abilities.js';
import { KIND, TEAM, dist, dist2, isPet } from './util.js';
import { t, bossName } from '../i18n/index.js';
import * as monsters from './monsters.js';
import { castMonsterAbility } from './combat.js';

/**
 * Blue-side legacy camp id -> habitat line. Red camps use the same line (mirror).
 * Single source of truth = `palette.habitat` (assets/palette-*.js, also used by world-art to paint/dress each habitat);
 * the literal below is only a fallback and must stay identical.
 */
export const HABITAT_LINES = { ...{ brute: 'fire', toads: 'water', warden: 'grass', golems: 'electric', stalkers: 'earth', wolves: 'wind' }, ...(PALETTE.habitat || {}) };

/** Starter meadows (blue side; red = mirrored x<->y). `lines` rotate per respawn. */
export const MEADOWS = [
  { id: 'meadow_a', x: 7.5, y: 96, lines: ['fire', 'grass', 'electric'] },
  { id: 'meadow_b', x: 25, y: 111, lines: ['water', 'earth', 'wind'] },
];

/**
 * River boss numbers. Defaults here; any field present in balance.js `JUNGLE.boss` wins (balance owns the numbers —
 * see docs/REQUESTS.md). hp/ad are Lv-1 base values, scaled by the legacy epic curve (+5 %/min, HP ×1.4 of that).
 */
export const BOSS = {
  hp: 4000, ad: 90, attackSpeed: 0.6, attackRange: 5, armor: 35, mr: 35,
  firstSpawn: 300, respawn: 240, leash: 12,
  gust: { first: 3, every: 7, delay: 0.9, radius: 3.2, range: 9, dmg: 130, slow: 0.35, slowDuration: 1.5 },
  ...(JUNGLE.boss || {}),
};

/** Wild AI tuning (defaults; `JUNGLE.wild` in balance.js overrides). */
export const WILD = {
  stick: 2.5,          // s a wild monster keeps its chosen target before re-evaluating (unless it becomes invalid)
  petBias: 1.5,        // metres: monsters are preferred over trainers when picking among attackers
  curBias: 1,          // metres: hysteresis in favour of the current target on re-evaluation
  castCdMult: 1.6,     // habitat monsters use A1 with a longer cooldown than owned monsters
  castDelay: 1.2,      // s after engaging before the first move
  idleGrowAfter: 8,    // s out of combat before an idle habitat monster levels up to the current wild level
  ...(JUNGLE.wild || {}),
};

export function install(mt) {
  mt.laneState = mt.laneState || { bossKills: [0, 0] };
  mt.impl.campDefs = campDefs;
  mt.impl.spawnCamp = spawnCamp;
  configureLegacyBoss(mt.L.JUNGLE_CFG);
  mt.on('damage', onWildDamaged);
  mt.on('preTick', wildDirector);
  mt.on('kill', onKill);
}

/** Current wild level (DESIGN §12: Lv 1 at 0:00, +1 per 90 s, max 9). */
export function wildLevel(time) {
  return Math.min(JUNGLE.maxLevel, JUNGLE.startLevel + Math.floor(Math.max(0, time) / JUNGLE.levelEvery));
}

// ------------------------------------------------------------------------------------------------ camps
function configureLegacyBoss(W) {
  if (W && W.monsters && W.monsters.storm_drake) W.monsters.storm_drake.name = bossName(); // i18n: display name in the current language, every match
  if (!W || !W.monsters || !W.monsters.storm_drake || W.monsters.storm_drake._mt) return;
  Object.assign(W.monsters.storm_drake, {
    name: bossName(), hp: BOSS.hp, ad: BOSS.ad, attackSpeed: BOSS.attackSpeed,
    attackRange: BOSS.attackRange, armor: BOSS.armor, mr: BOSS.mr, _mt: true,
  });
  W.epicLeashRadius = BOSS.leash;
  if (W.drake) W.drake.maxStacks = 0; // legacy permanent drake stacks replaced by the mt timed team buff
}

function campDefs(mt, list) {
  const out = [];
  for (const c of list) {
    const key = String(c.id).replace(/^(blue|red)_/, '');
    if (HABITAT_LINES[key]) {
      out.push({ ...c, mtLine: HABITAT_LINES[key], respawn: JUNGLE.respawn, firstSpawn: JUNGLE.firstSpawn, buff: null });
    } else if (c.id === 'drake') out.push({ ...c, mtBoss: true, firstSpawn: BOSS.firstSpawn, respawn: BOSS.respawn });
    // skitters + tyrant dropped
  }
  for (const m of MEADOWS) {
    out.push({ id: 'blue_' + m.id, x: m.x, y: m.y, side: 0, respawn: JUNGLE.respawn, firstSpawn: 0, mtMeadow: m.lines, monster: 'mt_meadow' });
    out.push({ id: 'red_' + m.id, x: m.y, y: m.x, side: 1, respawn: JUNGLE.respawn, firstSpawn: 0, mtMeadow: m.lines, monster: 'mt_meadow' });
  }
  return out;
}

/** Add the habitat's second monster next to the camp centre (legacy camps hold one unit; we push the id ourselves). */
function spawnExtra(mt, camp, state, lvl) {
  const a = (camp.id.length * 1.7) % (Math.PI * 2);
  const v = monsters.createWildForCamp(mt, juvenileOf(camp.mtLine), Math.max(1, lvl - 1), { ...camp, x: camp.x + Math.cos(a) * 1.6, y: camp.y + Math.sin(a) * 1.6 }, false);
  mt.world.addUnit(v);
  state.unitIds.push(v.id);
  return v;
}

function spawnCamp(mt, camp, state) {
  if (!camp.mtLine && !camp.mtMeadow) return null;
  const w = mt.world;
  if (camp.mtMeadow) {
    const line = camp.mtMeadow[state.spawns % camp.mtMeadow.length];
    return monsters.createWildForCamp(mt, juvenileOf(line), JUNGLE.meadowLevel, camp, true);
  }
  const lvl = wildLevel(w.time);
  const u = monsters.createWildForCamp(mt, juvenileOf(camp.mtLine), lvl, camp, false);
  if (lvl >= JUNGLE.twoMonstersFromLevel) spawnExtra(mt, camp, state, lvl);
  return u;
}

// ------------------------------------------------------------------------------------------------ wild AI
const isWildUnit = (u) => u && u.kind === KIND.MONSTER && u.team === TEAM.NEUTRAL;
const mem = (u) => u.mtAgg || (u.mtAgg = new Map());

/** Post-damage: remember attackers of wild monsters; the habitat mate joins the fight. */
function onWildDamaged(mt, src, tgt) {
  if (!src || !isWildUnit(tgt) || (src.team !== TEAM.BLUE && src.team !== TEAM.RED)) return;
  const w = mt.world, t = w.time;
  mem(tgt).set(src.id, t);
  if (tgt.camp == null) return;
  const st = w.campState.get(tgt.camp); if (!st || st.unitIds.length < 2) return;
  const W = mt.L.JUNGLE_CFG;
  for (const id of st.unitIds) {
    const m = w.units.get(id);
    if (!m || m === tgt || !m.alive || m.resetting || (m.mtMon && m.mtMon.capturing)) continue;
    mem(m).set(src.id, t); // the pack knows who is attacking it
    if (m.lastHitTime > t - W.patience && m.mtWildTgt >= 0) continue; // already fighting
    m.lastDamagedBy = src.id; m.lastHitTime = t;
    m.mtWildTgt = src.id; m.mtWildTgtT = t;
  }
}

function wildDirector(mt) {
  const w = mt.world, t = w.time;
  for (const u of w.unitList) {
    if (!isWildUnit(u) || !u.alive || u.removed) continue;
    const M = u.mtMon;
    if (M && M.capturing) continue;
    if (u.resetting) { if (u.mtAgg) u.mtAgg.clear(); u.mtWildTgt = -1; u.mtEngagedT = 0; u.mtGustNext = 0; continue; }
    const engaged = u.lastHitTime > 0;
    if (engaged) {
      if (!u.mtEngagedT) u.mtEngagedT = t;
      steer(mt, u, t);
    } else u.mtEngagedT = 0;
    if (M && !M.meadow) {
      if (engaged) wildCast(mt, u, t);
      else if ((w.tickNo + u.phase) % 30 === 0) idleGrow(mt, u, t);
    }
    if (u.epic && u.camp === 'drake') bossGust(mt, u, t);
  }
}

/** Choose who the wild monster fights and hand it to the legacy AI through `lastDamagedBy`. */
function steer(mt, u, t) {
  const w = mt.world, L = mt.L, W = L.JUNGLE_CFG;
  const r = u.epic ? W.epicLeashRadius : W.leashRadius, zone2 = (r + 2) * (r + 2);
  const ok = (v) => !!v && v.alive && !v.removed && !v.untargetable && (v.team === TEAM.BLUE || v.team === TEAM.RED) &&
    !(v.mtMon && v.mtMon.capturing) && dist2(v.x, v.y, u.homeX, u.homeY) <= zone2 && L.isTargetable(w, u, v);
  let cur = u.mtWildTgt >= 0 ? w.units.get(u.mtWildTgt) : null;
  if (!ok(cur)) cur = null;
  if (cur && t - (u.mtWildTgtT || 0) < WILD.stick) { u.lastDamagedBy = cur.id; return; }
  let best = null, bs = 1e9;
  if (u.mtAgg) for (const [id, ht] of u.mtAgg) {
    if (t - ht > W.patience) { u.mtAgg.delete(id); continue; }
    const v = w.units.get(id);
    if (!ok(v)) continue;
    const s = L.edgeDistPrev(u, v) - (isPet(v) ? WILD.petBias : 0) - (v === cur ? WILD.curBias : 0);
    if (s < bs || (s === bs && v.id < best.id)) { bs = s; best = v; }
  }
  if (!best) return; // nobody valid: the legacy AI resets (walks home, heals)
  if (best !== cur) { u.mtWildTgt = best.id; u.mtWildTgtT = t; }
  u.lastDamagedBy = best.id;
}

/** Habitat monsters use their A1 move (longer cooldown) when it makes sense. */
function wildCast(mt, u, t) {
  const w = mt.world, M = u.mtMon;
  if ((w.tickNo + u.phase) % 6 !== 0 || t < (M.wildCd || 0) || t - u.mtEngagedT < WILD.castDelay) return;
  const tgt = u.lastDamagedBy >= 0 ? w.units.get(u.lastDamagedBy) : null;
  if (!tgt || !tgt.alive || tgt.team === TEAM.NEUTRAL) return;
  const def = abilityFor(M.line, 'a1', M.stage); if (!def) return;
  let did = false;
  if (def.ai === 'self_low') { if (u.hp / u.maxHp < 0.55) did = castMonsterAbility(mt, u, 'a1', u.x, u.y, -1); }
  else {
    const reach = def.ai === 'fight' ? 4 : (def.range || 2.5) + tgt.radius;
    if (dist(u.x, u.y, tgt.x, tgt.y) <= reach) did = castMonsterAbility(mt, u, 'a1', tgt.x, tgt.y, tgt.id);
  }
  if (did) M.wildCd = t + (def.cd || 8) * WILD.castCdMult;
}

/** Idle habitat monsters keep up with the wild level; habitats gain their second monster from wild Lv 4. */
function idleGrow(mt, u, t) {
  if (u.camp == null || u.lastHitTime > t - WILD.idleGrowAfter || u.hp < u.maxHp) return;
  const lvl = wildLevel(t);
  if (u.level < lvl) { u.level = lvl; monsters.refreshMonsterStats(mt, u); u.hp = u.maxHp; }
  const st = mt.world.campState.get(u.camp);
  if (st && st.camp.mtLine && st.unitIds.length === 1 && st.unitIds[0] === u.id && lvl >= JUNGLE.twoMonstersFromLevel) spawnExtra(mt, st.camp, st, lvl);
}

// ------------------------------------------------------------------------------------------------ river boss
function bossGust(mt, u, t) {
  const w = mt.world, G = BOSS.gust;
  if (!(u.lastHitTime > 0)) { u.mtGustNext = 0; return; }
  if (!u.mtGustNext) { u.mtGustNext = t + G.first; return; }
  if (t < u.mtGustNext) return;
  const tgt = u.lastDamagedBy >= 0 ? w.units.get(u.lastDamagedBy) : null;
  if (!tgt || !tgt.alive || dist(u.x, u.y, tgt.x, tgt.y) > G.range) { u.mtGustNext = t + 0.5; return; }
  const x = tgt.x, y = tgt.y, scale = u.stats.ad / BOSS.ad;
  u.mtGustNext = t + G.every;
  u.castSeq = (u.castSeq || 0) + 1; u.castT = t;
  u.facing = Math.atan2(y - u.y, x - u.x);
  mt.emit(mt.E.BOSS_GUST, { unit: u.id, x: u.x, y: u.y, tx: x, ty: y, radius: G.radius, delay: G.delay });
  w.emit(mt.EVENT.FX, { fx: 'mt_galeclaw_gust', kind: 'aoe_telegraph', src: u.id, team: TEAM.NEUTRAL, element: 'storm', x, y, radius: G.radius, duration: G.delay });
  w.schedule(G.delay, () => {
    if (!u.alive || u.removed || u.resetting) return;
    w.emit(mt.EVENT.FX, { fx: 'mt_galeclaw_gust', kind: 'aoe_burst', src: u.id, team: TEAM.NEUTRAL, element: 'storm', x, y, radius: G.radius });
    const hit = w.queryUnits(x, y, G.radius + 0.6, (o) => o.alive && (o.team === TEAM.BLUE || o.team === TEAM.RED) &&
      (o.kind === KIND.CHAMPION || o.kind === KIND.MONSTER || o.kind === KIND.MINION) && !(o.mtMon && o.mtMon.capturing) &&
      dist(x, y, o.x, o.y) <= G.radius + o.radius && mt.L.isTargetable(w, u, o), []);
    hit.sort((a, b) => a.id - b.id);
    for (const o of hit) {
      mt.L.dealDamage(w, u, o, G.dmg * scale, 'magic', { source: 'ability', fx: 'mt_galeclaw_gust' });
      if (o.alive) mt.L.applyCC(w, u, o, 'slow', G.slowDuration, G.slow);
    }
  });
}

function onKill(mt, victim, killer, credited) {
  if (!victim || victim.kind !== KIND.MONSTER || !victim.epic || victim.camp !== 'drake') return;
  const w = mt.world, by = credited || killer, team = by ? by.team : -1;
  // the legacy objective announce is hard-coded "Storm Drake Slain"
  for (let i = w.events.length - 1; i >= 0 && i >= w.events.length - 40; i--) {
    const e = w.events[i];
    if (e && e.type === mt.EVENT.ANNOUNCE && e.key === 'drake_slain') { e.text = t('ann.bossSlain', { name: bossName() }); break; } // i18n
  }
  if (team === TEAM.BLUE || team === TEAM.RED) mt.laneState.bossKills[team]++;
  // the team buff (+15 % dmg 90 s, `mt_team_buff`) is applied by combat.js
}
