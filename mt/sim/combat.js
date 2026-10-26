// mt/sim/combat.js — type effectiveness, mt damage scalars, status effects, fields, monster abilities + ability AI
// (DESIGN.md §3 specialisations, §4 elements, §5 abilities, §12 Galeclaw buff). Owner: combat specialist.
//
// Hooks used: impl.elementMult (owned here), mt.damageScalers (shared list: push, don't replace),
// mt.on('damage') (reflect, combat timers, mt_hit events, balance stats), mt.on('kill') (Galeclaw, stats),
// mt.on('preTick') (taunt expiry), mt.on('postTick') (velocity tracking, fields, stats).
// Wild monsters cast through jungle.js (wild AI owner) via castMonsterAbility.
//
// Per-world state lives on `mt.combat` (see makeState) and exposes a small API for other modules / HUD / debug:
//   mt.combat.applyStatus(src, tgt, status, duration, power, abilityId)   CC / slow / burn / taunt (+ mt_status event)
//   mt.combat.statusOf(unit)        [{status, until, power, id}] active statuses (HUD icons)
//   mt.combat.balanceTable()        per line/stage/spec damage, kills, faints, casts (docs/BALANCE.md harness)
//   mt.combat.teamBuffUntil[team]   Ancient Galeclaw buff end time per team
//
// Status effects are built on the legacy unit model so every legacy system (movement, attack gating, tenacity,
// HUD CC bars, VFX) reacts: stun/root/silence/knock-up/slow = unit.cc via applyCC, burns = unit.dots (addDot),
// shields = unit.shields (addShield), stat buffs = unit.buffs (addBuff: armor/mr/attackSpeedPct/msPct/damagePct...),
// pulls = displaced dash (unit.dash, like the legacy knockback), taunt = minion target lock / pet focus.
//
// Ability implementations are keyed by AbilityDef.kind (mt/data/abilities.js); the auto-cast brain by AbilityDef.ai.

import { SURGE_FIELD, abilityFor, abilityDamageRaw, mitigation } from '../data/abilities.js';
import { LINES, FORMS } from '../data/species.js';
import { SPECS, TRAINER, EVOLUTION, JUNGLE } from '../data/balance.js';
import { typeMultiplier, effectivenessTag, STRONG, LEGACY_ELEMENT } from '../data/types.js';
import { MT_EVENT } from './events.js';
import { KIND, TEAM, DT, dist, dist2 } from './util.js';
import { t } from '../i18n/index.js'; // player-facing refusal texts (mt_deny)

function makeState() {
  return {
    castSeq: 0, fieldSeq: 0,
    /** @type {Array<object>} active ground fields */
    fields: [],
    /** damage opts stack: pushed by elementMult (pre), popped by onDamage (post) — same legacy _v call */
    optsStack: [],
    /** Ancient Galeclaw buff end time per team (0 blue, 1 red) */
    teamBuffUntil: [0, 0],
    /** minion ids under a taunt */
    taunted: [],
    /** balance stats: key 'line|stage|spec' -> row */
    stats: new Map(),
  };
}

export function install(mt) {
  const C = (mt.combat = makeState());
  C.applyStatus = (src, tgt, status, dur, power, ability) => applyStatus(mt, src, tgt, status, dur, power, ability);
  C.statusOf = (u) => statusOf(mt, u);
  C.balanceTable = () => balanceTable(mt);
  C.typeMult = (src, tgt) => typeMult(mt, src, tgt);
  mt.impl.elementMult = elementMult;
  mt.damageScalers.push(scaleDamage);
  mt.on('damage', onDamage);
  mt.on('kill', onKill);
  mt.on('preTick', preTick);
  mt.on('postTick', postTick);
  // The river boss grants the DESIGN §12 team buff (below); neutralise the legacy Storm Drake stacking stats so the
  // only boss reward is "+15 % dmg 90 s" (+ XP). The legacy buff icon may still show (no stats).
  const W = mt.L.JUNGLE_CFG;
  if (W && W.drake && W.drake.perStack && Object.keys(W.drake.perStack).length) W.drake.perStack = {};
}

// ------------------------------------------------------------------------------------------ helpers
const EV = MT_EVENT;
const isStructureKind = (o) => o.kind === KIND.TOWER || o.kind === KIND.INHIBITOR || o.kind === KIND.NEXUS;
/** enemy "hero" = trainer or owned monster */
const isHero = (o) => o.kind === KIND.CHAMPION || !!(o.mtMon && o.mtMon.ownerId >= 0);

function ownerOf(mt, u) {
  if (!u || !u.mtMon || u.mtMon.ownerId < 0) return null;
  const o = mt.world.units.get(u.mtMon.ownerId);
  return o && o.mtTrainer ? o : null;
}
function ownerSpec(mt, u) { const o = ownerOf(mt, u); return o ? o.mtTrainer.spec : null; }

function segProj(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy;
  let t = L2 > 1e-9 ? ((px - ax) * dx + (py - ay) * dy) / L2 : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const cx = ax + dx * t, cy = ay + dy * t;
  return { t, along: t * Math.sqrt(L2), d: Math.hypot(px - cx, py - cy) };
}

/** Units an ability can hit (vision ignored — like legacy skillshots). */
function canBeHit(o, team) {
  return o.alive && !o.removed && !o.untargetable && !o.invulnerable && o.team !== team &&
    (o.kind === KIND.CHAMPION || o.kind === KIND.MINION || o.kind === KIND.MONSTER) &&
    !(o.mtMon && o.mtMon.capturing) && !(o.kind === KIND.MONSTER && o.resetting);
}
/** Enemies of `team` within r of (x,y), nearest first (deterministic order). */
function enemiesIn(mt, team, x, y, r) {
  const out = mt.world.queryUnits(x, y, r + 1.2, (o) => canBeHit(o, team) && dist(x, y, o.x, o.y) <= r + o.radius * 0.6, []);
  out.sort((a, b) => dist2(x, y, a.x, a.y) - dist2(x, y, b.x, b.y) || a.id - b.id);
  return out;
}
/** Enemies of `team` within halfWidth of the segment (ax,ay)->(bx,by), ordered along the segment. */
function enemiesOnSegment(mt, team, ax, ay, bx, by, halfWidth) {
  const mx = (ax + bx) / 2, my = (ay + by) / 2, R = dist(ax, ay, bx, by) / 2 + halfWidth + 1.2;
  const out = [];
  for (const o of mt.world.queryUnits(mx, my, R, (o) => canBeHit(o, team), [])) {
    const p = segProj(o.x, o.y, ax, ay, bx, by);
    if (p.d <= halfWidth + o.radius) out.push({ o, along: p.along });
  }
  out.sort((a, b) => a.along - b.along || a.o.id - b.o.id);
  return out.map((e) => e.o);
}

/** Valid explicit target for a cast (enemy, alive, targetable; structures allowed only when `structures`). */
function validEnemy(mt, u, o, structures) {
  if (!o || !o.alive || o.removed || o.team === u.team) return false;
  if (isStructureKind(o)) return !!structures && mt.L.isTargetable(mt.world, u, o);
  if (!canBeHit(o, u.team)) return false;
  return mt.L.isTargetable(mt.world, u.team === TEAM.NEUTRAL ? null : u, o);
}

// ------------------------------------------------------------------------------------------ type chart
/** Type multiplier src -> tgt. Only mt monsters have types; everything else is typeless (×1). */
export function typeMult(mt, src, tgt) {
  if (!src || !src.mtMon || !tgt || !tgt.mtMon) return 1;
  const strong = ownerSpec(mt, src) === 'magic' ? SPECS.magic.passive.strong : STRONG;
  return typeMultiplier(src.mtMon.types[0], tgt.mtMon.types, strong);
}

/** [impl.elementMult] Element multiplier for one damage instance (+ remembers the damage opts for onDamage). */
export function elementMult(mt, src, tgt, type, source, opts) {
  if (mt.combat) mt.combat.optsStack.push(opts || null);
  return typeMult(mt, src, tgt);
}

/** [damageScalers] spec / meadow / structures / Galeclaw / evolving. */
export function scaleDamage(mt, src, tgt, type, source) {
  let m = 1;
  const w = mt.world;
  if (src && src.mtMon) {
    if (type === 'physical' && ownerSpec(mt, src) === 'attack') m *= 1 + SPECS.attack.passive.physicalDmg;
    if (src.mtMon.meadow) m *= JUNGLE.meadowDamageMult;
    if (tgt && mt.L.isStructure(tgt)) {
      m *= 1 + (LINES[src.mtMon.line].structureBonus || 0);
      if (src.mtMon.structureBonusUntil > w.time) {
        const def = abilityFor('earth', 'a2', 1);
        m *= 1 + ((def && def.extra.structureBonus) || 0);
      }
    }
  }
  if (src && (src.mtMon || src.mtTrainer) && (src.team === 0 || src.team === 1) && mt.combat && mt.combat.teamBuffUntil[src.team] > w.time) {
    m *= 1 + JUNGLE.boss.buffDmg;
  }
  if (tgt && tgt.mtMon && tgt.mtMon.evolving) m *= EVOLUTION.damageTaken;
  void source;
  return m;
}

// ------------------------------------------------------------------------------------------ damage post-hook
function statKey(mt, u) {
  const M = u.mtMon; if (!M) return null;
  return M.line + '|' + M.stage + '|' + (M.ownerId >= 0 ? ownerSpec(mt, u) || '-' : 'wild');
}
function statRow(mt, u) {
  const k = statKey(mt, u); if (!k) return null;
  let r = mt.combat.stats.get(k);
  if (!r) mt.combat.stats.set(k, (r = { key: k, dealt: 0, dealtHero: 0, taken: 0, kills: 0, faints: 0, casts: 0, time: 0, healed: 0 }));
  return r;
}

function onDamage(mt, src, tgt, amount, type, source, mult) {
  const C = mt.combat, w = mt.world, t = w.time;
  const opts = C.optsStack.length ? C.optsStack.pop() : null;
  if (src && src.mtMon) src.lastCombatT = t;
  if (tgt && tgt.mtMon) tgt.lastCombatT = t;
  // Thorn Bulwark: reflect a share of melee basic-attack damage
  if (tgt && src && source === 'attack' && !src.ranged && tgt.buffs && tgt.buffs.length && src.alive) {
    const b = mt.L.getBuff(tgt, 'mt_bulwark');
    if (b && b.data && b.data.reflect > 0) {
      mt.L.dealDamage(w, tgt, src, amount * b.data.reflect, 'magic', { source: 'reflect', fx: 'thorn_bulwark' });
    }
  }
  if (src && src.mtMon && tgt) {
    const fx = opts && opts.fx;
    const ability = source === 'attack' ? 'basic' : source === 'dot' ? (fx === 'mt_burn' ? 'burn' : fx || 'dot') : fx || source;
    const m = Number.isFinite(mult) ? mult : 1;
    mt.world.emit(EV.HIT, {
      src: src.id, tgt: tgt.id, trainer: src.mtMon.ownerId, ability, slot: (opts && opts.mtSlot) || null,
      element: src.mtMon.types[0], eff: effectivenessTag(m), mult: +m.toFixed(3), amount: Math.round(amount), dmgType: type,
      source: opts && opts.mtField ? 'field' : source, ranged: source === 'attack' && !!src.ranged,
      x: tgt.x, y: tgt.y, sx: src.x, sy: src.y, kill: !(tgt.hp > 0), cast: (opts && opts.mtCast) || 0,
    });
    const r = statRow(mt, src);
    if (r) { r.dealt += amount; if (isHero(tgt)) r.dealtHero += amount; }
  }
  if (tgt && tgt.mtMon && tgt.mtMon.ownerId >= 0) { const r = statRow(mt, tgt); if (r) r.taken += amount; }
}

function onKill(mt, victim, killer, credited) {
  const w = mt.world, C = mt.combat;
  // Ancient Galeclaw (river boss, legacy epic monster without mtMon): team buff +15 % dmg for 90 s
  if (victim.kind === KIND.MONSTER && victim.epic && !victim.mtMon) {
    const team = credited ? credited.team : killer ? killer.team : -1;
    if (team === 0 || team === 1) {
      const B = JUNGLE.boss;
      C.teamBuffUntil[team] = w.time + B.buffDuration;
      for (const u of w.unitList) {
        if (u.team !== team || !u.alive || !(u.mtTrainer || (u.mtMon && u.mtMon.ownerId >= 0))) continue;
        mt.L.addBuff(w, u, 'mt_galeclaw', B.buffDuration, { damagePct: 0 }, { team: true, dmgPct: B.buffDmg });
      }
      mt.emit(EV.TEAM_BUFF, { team, buff: 'galeclaw', until: C.teamBuffUntil[team], duration: B.buffDuration, dmgPct: B.buffDmg, killer: killer ? killer.id : -1, x: victim.x, y: victim.y });
    }
  }
  if (victim.mtMon && victim.mtMon.ownerId >= 0) { const r = statRow(mt, victim); if (r) r.faints++; }
  if (killer && killer.mtMon && (isHero(victim))) { const r = statRow(mt, killer); if (r) r.kills++; }
}

function preTick(mt) {
  const C = mt.combat, w = mt.world, t = w.time;
  C.optsStack.length = 0;
  if (C.taunted.length) {
    for (let i = C.taunted.length - 1; i >= 0; i--) {
      const m = w.units.get(C.taunted[i]);
      if (!m || !m.alive) { C.taunted.splice(i, 1); continue; }
      const src = w.units.get(m.mtTauntSrc);
      if (t >= m.mtTauntUntil || !src || !src.alive) {
        if (m.targetId === m.mtTauntSrc) m.aggroPrio = 99;
        m.mtTauntUntil = 0; C.taunted.splice(i, 1);
      }
    }
  }
}

function postTick(mt) {
  const w = mt.world, list = w.unitList;
  // velocity estimate for target leading (smoothed, clamped against teleports)
  for (let i = 0; i < list.length; i++) {
    const u = list[i];
    if (!u.alive || isStructureKind(u)) continue;
    let vx = (u.x - u.prevX) / DT, vy = (u.y - u.prevY) / DT;
    const s = Math.hypot(vx, vy); if (s > 14) { vx = 0; vy = 0; }
    u.mtVx = u.mtVx === undefined ? vx : u.mtVx * 0.5 + vx * 0.5;
    u.mtVy = u.mtVy === undefined ? vy : u.mtVy * 0.5 + vy * 0.5;
    if (u.mtMon) {
      if (u.mtMon.ownerId >= 0) { const r = statRow(mt, u); if (r) r.time += DT; }
    }
  }
  stepFields(mt);
}

// ------------------------------------------------------------------------------------------ status effects
/**
 * Apply a status effect on top of the legacy unit model and emit `mt_status`.
 * @param {'stun'|'root'|'silence'|'knockup'|'slow'|'burn'|'taunt'} status
 * @param {number} dur seconds  @param {number} power slow fraction | burn total damage
 * @returns {boolean} applied
 */
export function applyStatus(mt, src, tgt, status, dur, power = 0, ability = null) {
  const w = mt.world, L = mt.L;
  if (!tgt || !tgt.alive || !(dur > 0)) return false;
  let ok = false;
  switch (status) {
    case 'stun': case 'root': case 'silence': case 'knockup': ok = !!L.applyCC(w, src, tgt, status, dur, 0); break;
    case 'slow': ok = !!L.applyCC(w, src, tgt, 'slow', dur, power); break;
    case 'burn':
      if (!(power > 0) || L.isStructure(tgt)) return false;
      L.addDot(w, src, tgt, { id: 'mt_burn', total: power, duration: dur, interval: 0.5, type: 'magic', fx: 'mt_burn' }); ok = true; break;
    case 'taunt': ok = taunt(mt, src, tgt, dur); break;
    default: return false;
  }
  if (ok) emitStatus(mt, src, tgt, status, dur, power, ability);
  return ok;
}

function emitStatus(mt, src, tgt, status, dur, power, ability) {
  mt.world.emit(EV.STATUS, { tgt: tgt.id, src: src ? src.id : -1, status, ability: ability || null, duration: +(+dur || 0).toFixed(2), power: typeof power === 'number' ? +power.toFixed(2) : power, x: tgt.x, y: tgt.y });
}

function taunt(mt, src, o, dur) {
  if (!src || !o || !o.alive || o.team === src.team) return false;
  const w = mt.world, until = w.time + dur;
  if (o.kind === KIND.MINION) {
    if (o.mtTauntUntil > w.time && o.mtTauntSrc !== src.id) return false;
    mt.L.cancelAttack(w, o, true);
    o.targetId = src.id; o.aggroPrio = 0; o.mtTauntUntil = until; o.mtTauntSrc = src.id;
    if (!mt.combat.taunted.includes(o.id)) mt.combat.taunted.push(o.id);
    return true;
  }
  if (o.mtMon && o.mtMon.ownerId >= 0 && !o.mtMon.evolving) {
    o.mtMon.focusId = src.id; o.mtMon.focusUntil = until; o.mtMon.regroupUntil = 0; o.targetId = src.id; return true;
  }
  if (o.mtMon && o.mtMon.ownerId < 0 && !o.resetting) { o.lastDamagedBy = src.id; o.targetId = src.id; return true; }
  return false;
}

function canDisplace(mt, o) {
  const w = mt.world;
  return !!o && o.alive && !mt.L.isStructure(o) && o.kind !== KIND.WARD && !(o.kind === KIND.MONSTER && (o.epic || o.resetting)) &&
    !o.invulnerable && !(o.ccImmuneUntil > w.time) && !(o.mtMon && (o.mtMon.capturing || o.mtMon.evolving));
}

/** Forced movement (pull / knockback), modelled exactly like the legacy displacement: a `displaced` unit dash. */
function displace(mt, src, tgt, toX, toY, dur, kind, ability) {
  if (!canDisplace(mt, tgt)) return false;
  const w = mt.world, L = mt.L;
  const p = w.nav.landingPoint(tgt.x, tgt.y, toX, toY);
  L.cancelAttack(w, tgt, false);
  if (tgt.channel && w.interruptChannel) w.interruptChannel(tgt);
  if (tgt.recallStart != null && w.cancelRecall) w.cancelRecall(tgt);
  tgt.path = null;
  tgt.dash = { fromX: tgt.x, fromY: tgt.y, toX: p.x, toY: p.y, t0: w.time, t1: w.time + Math.max(DT, dur), displaced: true, kind, src: src ? src.id : -1, onEnd: null };
  w.emit(mt.EVENT.DASH, { src: tgt.id, x: tgt.x, y: tgt.y, tx: p.x, ty: p.y, duration: dur, displaced: true });
  w.emit(mt.EVENT.CC, { tgt: tgt.id, cc: kind, duration: dur, src: src ? src.id : -1, displace: true, x: p.x, y: p.y });
  w.grid.dirty = true;
  emitStatus(mt, src, tgt, kind, dur, dist(tgt.x, tgt.y, p.x, p.y), ability);
  return true;
}

/** Active statuses of a unit (HUD icons / debug). */
export function statusOf(mt, u) {
  const t = mt.world.time, out = [];
  if (!u || !u.cc) return out;
  const c = u.cc;
  if (c.airborneUntil > t) out.push({ status: 'knockup', until: c.airborneUntil });
  else if (c.stunUntil > t) out.push({ status: 'stun', until: c.stunUntil });
  if (c.rootUntil > t) out.push({ status: 'root', until: c.rootUntil });
  if (c.silenceUntil > t) out.push({ status: 'silence', until: c.silenceUntil });
  if (c.slowUntil > t && c.slowPower > 0) out.push({ status: 'slow', until: c.slowUntil, power: c.slowPower });
  if (u.dash && u.dash.displaced) out.push({ status: u.dash.kind || 'pull', until: u.dash.t1 });
  for (const d of u.dots || []) out.push({ status: d.id === 'mt_burn' ? 'burn' : 'dot', until: t + d.remaining * d.interval, power: d.perTick * d.remaining, id: d.id });
  if (u.shield > 0) out.push({ status: 'shield', until: Math.max(...u.shields.map((s) => s.until)), power: u.shield });
  for (const b of u.buffs || []) out.push({ status: 'buff', id: b.id, until: b.until, stacks: b.stacks });
  if (u.mtTauntUntil > t) out.push({ status: 'taunt', until: u.mtTauntUntil });
  return out;
}

// ------------------------------------------------------------------------------------------ fields
/**
 * Ground field: ticks every `interval` on enemies inside (circle radius, or segment (x,y)->(x2,y2) half-width radius).
 * @param {{ability:string, element:string, x:number, y:number, x2?:number, y2?:number, radius:number, duration:number,
 *          interval:number, onTick:(f:object, o:object)=>void, onAlly?:(f:object, o:object)=>void}} o
 */
function spawnField(mt, u, o) {
  const C = mt.combat, w = mt.world;
  const f = { ...o, id: ++C.fieldSeq, team: u.team, src: u, until: w.time + o.duration, next: w.time + o.interval };
  C.fields.push(f);
  const seg = Number.isFinite(f.x2);
  mt.emit(EV.FIELD, { id: f.id, phase: 'start', ability: f.ability, element: f.element, team: f.team, src: u.id, x: f.x, y: f.y, radius: f.radius, x2: seg ? f.x2 : undefined, y2: seg ? f.y2 : undefined, duration: f.duration, until: f.until });
  // legacy generic VFX: rune decal(s) for the field lifetime
  const legacyEl = LEGACY_ELEMENT[f.element] || 'arcane';
  if (seg) {
    const L = dist(f.x, f.y, f.x2, f.y2), n = Math.max(1, Math.round(L / 1.6));
    for (let i = 0; i <= n; i++) {
      const k = i / n;
      w.emit(mt.EVENT.FX, { fx: f.ability + '_field', kind: 'zone', src: u.id, team: u.team, element: legacyEl, cast: f.cast || 0, x: f.x + (f.x2 - f.x) * k, y: f.y + (f.y2 - f.y) * k, radius: f.radius, duration: f.duration });
    }
  } else w.emit(mt.EVENT.FX, { fx: f.ability + '_field', kind: 'zone', src: u.id, team: u.team, element: legacyEl, cast: f.cast || 0, x: f.x, y: f.y, radius: f.radius, duration: f.duration });
  return f;
}

function stepFields(mt) {
  const C = mt.combat, w = mt.world, t = w.time + 1e-9;
  for (let i = C.fields.length - 1; i >= 0; i--) {
    const f = C.fields[i];
    const seg = Number.isFinite(f.x2);
    if (t >= f.next) {
      f.next += f.interval;
      const victims = seg ? enemiesOnSegment(mt, f.team, f.x, f.y, f.x2, f.y2, f.radius) : enemiesIn(mt, f.team, f.x, f.y, f.radius);
      for (const o of victims) if (o.alive) mt.guard('fieldTick', () => f.onTick(f, o));
      if (f.onAlly) {
        for (const o of w.queryUnits(f.x, f.y, f.radius, (o) => o.alive && o.team === f.team && (o.kind === KIND.CHAMPION || (o.mtMon && o.mtMon.ownerId >= 0)), [])) f.onAlly(f, o);
      }
      if (!seg) w.emit(mt.EVENT.FX, { fx: f.ability + '_field', kind: 'zone_tick', src: f.src.id, team: f.team, element: LEGACY_ELEMENT[f.element] || 'arcane', x: f.x, y: f.y, radius: f.radius });
    }
    if (t >= f.until) {
      C.fields.splice(i, 1);
      mt.emit(EV.FIELD, { id: f.id, phase: 'end', ability: f.ability, element: f.element, team: f.team, src: f.src.id, x: f.x, y: f.y, radius: f.radius, duration: f.duration, until: f.until });
      if (!seg) w.emit(mt.EVENT.FX, { fx: f.ability + '_field', kind: 'zone_end', src: f.src.id, team: f.team, element: LEGACY_ELEMENT[f.element] || 'arcane', x: f.x, y: f.y, radius: f.radius });
    }
  }
}

// ------------------------------------------------------------------------------------------ abilities
export function hasAbility(rec, slot) { const f = rec && FORMS[rec.form]; return !!(f && abilityFor(f.line, slot, f.stage)); }

/** Effective cooldown of a record's ability for a trainer (Magic spec −15 %). */
export function abilityCooldown(mt, trainer, rec, slot) {
  const f = FORMS[rec.form]; const a = f && abilityFor(f.line, slot, f.stage); if (!a) return 0;
  const spec = trainer && trainer.mtTrainer ? trainer.mtTrainer.spec : null;
  return a.cd * (spec === 'magic' ? 1 - SPECS.magic.passive.cooldown : 1);
}

function cooldownOf(mt, u, def) {
  const M = u.mtMon;
  if (M.ownerId < 0) return def.cd; // wild casting cadence is owned by jungle.js (WILD.castCdMult)
  return def.cd * (ownerSpec(mt, u) === 'magic' ? 1 - SPECS.magic.passive.cooldown : 1);
}

/** Cooldown store: the party record for pets (survives swaps), unit-local for wild monsters. */
function cdStore(u) { const M = u.mtMon; return M.rec ? M.rec.cds : (M.cds || (M.cds = { a1: 0, a2: 0 })); }

/** Raw ability damage of a unit (stats include spec passives and buffs). */
export function abilityDamage(mt, u, def, surged = false) {
  const stat = def.stat === 'mag' ? u.stats.ap : u.stats.ad;
  const d = abilityDamageRaw(def, stat, u.level || 1, surged ? SPECS.magic.surge.bonus : 0);
  return def.stat === 'atk' && mt.world && ownerSpec(mt, u) === 'magic' ? d * (1 + (SPECS.magic.passive.atkAbilityDmg || 0)) : d;
}

function legacyFx(mt, u, def, cast, kind, extra) {
  return mt.world.emit(mt.EVENT.FX, {
    fx: def.id, kind, src: u.id, team: u.team, element: LEGACY_ELEMENT[u.mtMon.line], cast: cast.seq, x: u.x, y: u.y, ...extra,
  });
}

function hit(mt, u, tgt, amount, def, cast, extraOpts) {
  if (!tgt || !tgt.alive || !(amount > 0)) return 0;
  return mt.L.dealDamage(mt.world, u, tgt, amount, def.dmgType || 'magic', { source: 'ability', fx: def.id, mtSlot: cast.slot, mtCast: cast.seq, ...extraOpts });
}

/** Magic-spec Surge: the first impact of a surged cast leaves an elemental field (DESIGN §3). */
function impact(mt, u, def, cast, x, y) {
  if (!cast.surged || cast.fieldDone) return;
  cast.fieldDone = true;
  const S = SURGE_FIELD, el = u.mtMon.types[0], R = S.rider[el] || {};
  const lvl = 1 + 0.06 * ((u.level || 1) - 1);
  const tick = (S.base + S.ratio * u.stats.ap) * lvl * (R.dmgMult || 1);
  const fdef = { id: 'surge_field', dmgType: 'magic' };
  spawnField(mt, u, {
    ability: 'surge_field', element: el, x, y, radius: S.radius, duration: SPECS.magic.surge.fieldDuration || S.duration, interval: S.interval, cast: cast.seq,
    onTick: (f, o) => {
      hit(mt, u, o, tick, fdef, cast, { mtField: true });
      if (!o.alive) return;
      if (R.slow) applyStatus(mt, u, o, 'slow', R.slowDuration, R.slow, 'surge_field');
      if (R.burnPct) applyStatus(mt, u, o, 'burn', R.burnDuration, tick * R.burnPct, 'surge_field');
      if (R.pull) { const d = dist(o.x, o.y, f.x, f.y); if (d > 0.4) displace(mt, u, o, o.x + (f.x - o.x) / d * Math.min(R.pull, d), o.y + (f.y - o.y) / d * Math.min(R.pull, d), 0.12, 'pull', 'surge_field'); }
    },
    onAlly: R.allyHealPct ? (f, o) => { if (o.mtMon) mt.L.heal(mt.world, o, o.maxHp * R.allyHealPct, true, u); } : undefined,
  });
}

/** Resolve the aim of a cast. Returns {tgt, ax, ay} or null (no valid aim). */
function resolveAim(mt, u, def, x, y, targetId, manual) {
  const w = mt.world, E = def.extra || {};
  const structures = def.kind === 'charge';
  let tgt = targetId >= 0 ? w.units.get(targetId) : null;
  if (tgt && !validEnemy(mt, u, tgt, structures)) tgt = null;
  const hasPt = Number.isFinite(x) && Number.isFinite(y);
  const cur = u.targetId >= 0 ? w.units.get(u.targetId) : null;
  const curOk = cur && validEnemy(mt, u, cur, structures) ? cur : null;
  const fwd = (d) => ({ tgt: null, ax: u.x + Math.cos(u.facing) * d, ay: u.y + Math.sin(u.facing) * d });
  switch (def.aim) {
    case 'self':
      return tgt || curOk ? { tgt: tgt || curOk, ax: (tgt || curOk).x, ay: (tgt || curOk).y } : fwd(1);
    case 'unit': {
      const reach = (def.kind === 'dash_strike' ? E.distance : def.range) + u.radius;
      if (!tgt && hasPt) tgt = pickNear(mt, u, x, y, 3) || null;
      if (!tgt && !manual) tgt = curOk;
      if (!tgt) tgt = pickNear(mt, u, u.x, u.y, reach + 1, hasPt ? Math.atan2(y - u.y, x - u.x) : null);
      return tgt ? { tgt, ax: tgt.x, ay: tgt.y } : null;
    }
    case 'skillshot': {
      if (!tgt && !hasPt) tgt = curOk;
      if (tgt) { const p = lead(u, tgt, E.speed || 18, 0); return { tgt, ax: p.x, ay: p.y }; }
      return hasPt ? { tgt: null, ax: x, ay: y } : fwd(def.range);
    }
    case 'ground': {
      if (!tgt && !hasPt) tgt = curOk;
      if (tgt) { const p = lead(u, tgt, 0, E.delay || 0); return { tgt, ax: p.x, ay: p.y }; }
      return hasPt ? { tgt: null, ax: x, ay: y } : fwd(def.range * 0.6);
    }
    case 'dash': {
      if (!tgt && !hasPt) tgt = curOk;
      if (tgt) { const p = lead(u, tgt, (E.distance || 6) / (E.duration || 0.3), 0); return { tgt, ax: p.x, ay: p.y }; }
      return hasPt ? { tgt: null, ax: x, ay: y } : fwd(E.distance || def.range);
    }
  }
  return null;
}

/** Nearest visible enemy (heroes first) to (x,y) within r, optionally within ±50° of `dir` from the caster. */
function pickNear(mt, u, x, y, r, dir = null) {
  let best = null, bs = 1e9;
  for (const o of mt.world.queryUnits(x, y, r + 1, (o) => validEnemy(mt, u, o, false), [])) {
    const d = dist(x, y, o.x, o.y) - o.radius; if (d > r) continue;
    if (dir !== null) { let da = Math.abs(Math.atan2(o.y - u.y, o.x - u.x) - dir); if (da > Math.PI) da = 2 * Math.PI - da; if (da > 0.9) continue; }
    const s = d - (isHero(o) ? 2 : 0) - (o.kind === KIND.MONSTER && !o.mtMon ? 0 : 0);
    if (s < bs || (s === bs && o.id < best.id)) { bs = s; best = o; }
  }
  return best;
}

/**
 * Predicted position of `o` when a shot fired now (speed m/s, extra delay s) reaches it — "skillshots lead targets".
 * Disabled targets are not led; displaced/dashing targets are aimed at their dash end.
 */
export function lead(u, o, speed, delay) {
  if (o.dash) return { x: o.dash.toX, y: o.dash.toY };
  const vx = o.mtVx || 0, vy = o.mtVy || 0;
  if (Math.abs(vx) + Math.abs(vy) < 0.05) return { x: o.x, y: o.y };
  let t = delay;
  for (let i = 0; i < 3; i++) {
    const px = o.x + vx * t, py = o.y + vy * t;
    t = delay + (speed > 0 ? dist(u.x, u.y, px, py) / speed : 0);
  }
  t = Math.min(t, 1.2);
  return { x: o.x + vx * t, y: o.y + vy * t };
}

const KINDS = {
  /** Ember Volley: N fireballs in a fan (skillshots). Extra fireballs on the same target deal repeatMult. */
  volley(mt, u, def, aim, cast) {
    const E = def.extra, w = mt.world, base = Math.atan2(aim.ay - u.y, aim.ax - u.x), hits = new Map();
    const n = E.count | 0;
    for (let i = 0; i < n; i++) {
      const a = base + (n > 1 ? (i / (n - 1) - 0.5) * E.spread : 0);
      const sx = u.x + Math.cos(a) * u.radius * 0.8, sy = u.y + Math.sin(a) * u.radius * 0.8;
      mt.L.spawnProjectile(w, {
        src: u, x: sx, y: sy, tx: sx + Math.cos(a) * def.range, ty: sy + Math.sin(a) * def.range,
        speed: E.speed, radius: E.width, maxDist: def.range, fx: def.id, element: LEGACY_ELEMENT[u.mtMon.line], hitTeams: 'enemy',
        onHit: (w2, p, o) => {
          const k = hits.get(o.id) || 0; hits.set(o.id, k + 1);
          hit(mt, u, o, cast.dmg * (k ? E.repeatMult : 1), def, cast);
          impact(mt, u, def, cast, o.x, o.y);
        },
        onEnd: (w2, p) => { if (i === (n >> 1)) impact(mt, u, def, cast, p.x, p.y); },
      });
    }
    legacyFx(mt, u, def, cast, 'cone', { tx: aim.ax, ty: aim.ay, radius: 2.2, angle: (E.spread * 180) / Math.PI + 20 });
    cast.info = { count: n, width: E.width, spread: E.spread };
    return true;
  },
  /** Flame Pillar: delayed ground AoE, burn; Final: lingering fire field. */
  pillar(mt, u, def, aim, cast) {
    const E = def.extra, w = mt.world;
    const d = Math.min(def.range, dist(u.x, u.y, aim.ax, aim.ay)), a = Math.atan2(aim.ay - u.y, aim.ax - u.x);
    const p = w.nav.landingPoint(u.x, u.y, u.x + Math.cos(a) * d, u.y + Math.sin(a) * d);
    const x = p.x, y = p.y;
    legacyFx(mt, u, def, cast, 'aoe_telegraph', { x, y, radius: E.radius, duration: E.delay });
    cast.info = { radius: E.radius, delay: E.delay, tx: x, ty: y };
    w.schedule(E.delay, () => {
      if (u.removed) return;
      legacyFx(mt, u, def, cast, 'aoe_burst', { x, y, radius: E.radius });
      for (const o of enemiesIn(mt, u.team, x, y, E.radius)) {
        hit(mt, u, o, cast.dmg, def, cast);
        if (o.alive) applyStatus(mt, u, o, 'burn', E.burnDuration, cast.dmg * E.burnPct, def.id);
      }
      impact(mt, u, def, cast, x, y);
      if (E.field) {
        const F = E.field;
        spawnField(mt, u, {
          ability: def.id, element: u.mtMon.types[0], x, y, radius: E.radius, duration: F.duration, interval: F.interval, cast: cast.seq,
          onTick: (f, o) => { hit(mt, u, o, cast.dmg * F.tickPct, def, cast, { mtField: true }); if (o.alive) applyStatus(mt, u, o, 'burn', 1.5, cast.dmg * F.burnPct, def.id); },
        });
      }
    });
    return true;
  },
  /** Bubble Jet: line skillshot, slows; Final pierces. */
  line(mt, u, def, aim, cast) {
    const E = def.extra, a = Math.atan2(aim.ay - u.y, aim.ax - u.x);
    const sx = u.x + Math.cos(a) * u.radius * 0.8, sy = u.y + Math.sin(a) * u.radius * 0.8;
    mt.L.spawnProjectile(mt.world, {
      src: u, x: sx, y: sy, tx: sx + Math.cos(a) * def.range, ty: sy + Math.sin(a) * def.range,
      speed: E.speed, radius: E.width, maxDist: def.range, pierce: !!E.pierce, fx: def.id, element: LEGACY_ELEMENT[u.mtMon.line], hitTeams: 'enemy',
      onHit: (w, p, o) => {
        hit(mt, u, o, cast.dmg, def, cast);
        if (o.alive) applyStatus(mt, u, o, 'slow', E.slowDuration, E.slow, def.id);
        impact(mt, u, def, cast, o.x, o.y);
      },
      onEnd: (w, p) => impact(mt, u, def, cast, p.x, p.y),
    });
    legacyFx(mt, u, def, cast, 'line_telegraph', { tx: sx + Math.cos(a) * def.range, ty: sy + Math.sin(a) * def.range, width: E.width * 2, duration: 0.15 });
    cast.info = { width: E.width, pierce: !!E.pierce };
    return true;
  },
  /** Tidal Mend: self heal + shield; Final heals the trainer and splashes nearby allies. */
  mend(mt, u, def, aim, cast) {
    const E = def.extra, w = mt.world, L = mt.L;
    const surge = cast.surged ? 1 + SPECS.magic.surge.bonus : 1;
    const healed = L.heal(w, u, u.maxHp * E.healPct * surge, false, u);
    L.addShield(w, u, u.maxHp * E.shieldPct * surge, E.shieldDuration, 'all');
    emitStatus(mt, u, u, 'heal', 0, healed || 0, def.id);
    emitStatus(mt, u, u, 'shield', E.shieldDuration, u.maxHp * E.shieldPct * surge, def.id);
    const r = statRow(mt, u); if (r) r.healed += healed || 0;
    if (E.healTrainer || E.splash) {
      const owner = ownerOf(mt, u);
      for (const o of w.queryUnits(u.x, u.y, E.splash || 6, (o) => o.alive && o.team === u.team && o !== u && (o.kind === KIND.CHAMPION || (o.mtMon && o.mtMon.ownerId >= 0)), [])) {
        const h = L.heal(w, o, o.maxHp * E.healPct * (E.splashPct || 0.5) * surge, false, u);
        if (h > 0) emitStatus(mt, u, o, 'heal', 0, h, def.id);
      }
      if (E.healTrainer && owner && owner.alive && dist(owner.x, owner.y, u.x, u.y) > (E.splash || 6)) {
        const h = L.heal(w, owner, owner.maxHp * E.healPct * (E.splashPct || 0.5) * surge, false, u);
        if (h > 0) emitStatus(mt, u, owner, 'heal', 0, h, def.id);
      }
      if (E.splash) legacyFx(mt, u, def, cast, 'aoe_burst', { radius: E.splash * 0.5 });
    }
    legacyFx(mt, u, def, cast, 'buff', { tgt: u.id, duration: E.shieldDuration });
    impact(mt, u, def, cast, u.x, u.y);
    return true;
  },
  /** Vine Lash: vine skillshot; first enemy hit is pulled toward the caster and rooted. */
  lash(mt, u, def, aim, cast) {
    const E = def.extra, w = mt.world, a = Math.atan2(aim.ay - u.y, aim.ax - u.x);
    const sx = u.x + Math.cos(a) * u.radius * 0.8, sy = u.y + Math.sin(a) * u.radius * 0.8;
    mt.L.spawnProjectile(w, {
      src: u, x: sx, y: sy, tx: sx + Math.cos(a) * def.range, ty: sy + Math.sin(a) * def.range,
      speed: E.speed, radius: E.width, maxDist: def.range, fx: def.id, element: LEGACY_ELEMENT[u.mtMon.line], hitTeams: 'enemy',
      onHit: (w2, p, o) => {
        hit(mt, u, o, cast.dmg, def, cast);
        impact(mt, u, def, cast, o.x, o.y);
        if (!o.alive) return;
        legacyFx(mt, u, def, cast, 'tether', { tgt: o.id, duration: E.pullTime + 0.25 });
        const d = dist(u.x, u.y, o.x, o.y), room = d - (u.radius + o.radius + 0.25);
        const pull = Math.max(0, Math.min(E.pull, room));
        if (pull > 0.2 && u.alive) {
          if (displace(mt, u, o, o.x + (u.x - o.x) / d * pull, o.y + (u.y - o.y) / d * pull, E.pullTime, 'pull', def.id))
            legacyFx(mt, u, def, cast, 'pull', { tgt: o.id, duration: E.pullTime });
        }
        applyStatus(mt, u, o, 'root', E.root + (pull > 0.2 ? E.pullTime : 0), 0, def.id);
      },
    });
    cast.info = { width: E.width };
    return true;
  },
  /** Thorn Bulwark: +DEF, reflect melee; Final taunts nearby minions (and enemy monsters). */
  bulwark(mt, u, def, aim, cast) {
    const E = def.extra, w = mt.world;
    const s = cast.surged ? 1 + SPECS.magic.surge.bonus * 0.5 : 1;
    mt.L.addBuff(w, u, 'mt_bulwark', E.duration, { armor: u.baseStats.armor * E.defPct * s, mr: u.baseStats.mr * E.defPct * s }, { reflect: E.reflect });
    emitStatus(mt, u, u, 'buff', E.duration, 'mt_bulwark', def.id);
    legacyFx(mt, u, def, cast, 'buff', { tgt: u.id, duration: E.duration });
    if (E.taunt) {
      let n = 0;
      for (const o of enemiesIn(mt, u.team, u.x, u.y, E.tauntRadius)) {
        if (o.kind === KIND.CHAMPION) continue;
        if (applyStatus(mt, u, o, 'taunt', o.kind === KIND.MINION ? E.taunt : E.taunt * 0.6, 0, def.id)) n++;
      }
      legacyFx(mt, u, def, cast, 'aoe_burst', { radius: E.tauntRadius });
      cast.info = { radius: E.tauntRadius, taunted: n };
    }
    impact(mt, u, def, cast, u.x, u.y);
    return true;
  },
  /** Spark Bolt: chain lightning (targeted), −15 % per jump. */
  chain(mt, u, def, aim, cast) {
    const E = def.extra, w = mt.world, first = aim.tgt;
    if (!first || dist(u.x, u.y, first.x, first.y) > def.range + first.radius + u.radius) return false;
    const done = new Set();
    let px = u.x, py = u.y;
    const hop = (i, cur) => {
      if (!cur || !cur.alive) return;
      done.add(cur.id);
      legacyFx(mt, u, def, cast, 'beam', { x: px, y: py, tx: cur.x, ty: cur.y, tgt: cur.id });
      legacyFx(mt, u, def, cast, 'impact', { x: cur.x, y: cur.y, tgt: cur.id, power: Math.pow(E.falloff, i) });
      hit(mt, u, cur, cast.dmg * Math.pow(E.falloff, i), def, cast, { mtHop: i });
      if (i === 0) impact(mt, u, def, cast, cur.x, cur.y);
      px = cur.x; py = cur.y;
      if (i + 1 >= E.targets) return;
      const cand = enemiesIn(mt, u.team, cur.x, cur.y, E.bounce).filter((o) => !done.has(o.id));
      cand.sort((a, b) => (isHero(b) - isHero(a)) || dist2(cur.x, cur.y, a.x, a.y) - dist2(cur.x, cur.y, b.x, b.y) || a.id - b.id);
      const nxt = cand[0];
      if (nxt) w.schedule(E.linkDelay, () => hop(i + 1, nxt));
    };
    hop(0, first);
    cast.info = { targets: E.targets, bounce: E.bounce };
    return true;
  },
  /** Static Dash: dash; the first enemy in the way is hit and stunned; Final leaves a charged trail. */
  dash_stun(mt, u, def, aim, cast) {
    const E = def.extra, w = mt.world;
    if (u.cc.rootUntil > w.time) return false;
    const a = Math.atan2(aim.ay - u.y, aim.ax - u.x);
    let d = Math.min(E.distance, Math.max(1.5, dist(u.x, u.y, aim.ax, aim.ay)));
    const ex = u.x + Math.cos(a) * d, ey = u.y + Math.sin(a) * d;
    const first = enemiesOnSegment(mt, u.team, u.x, u.y, ex, ey, E.hitWidth * 0.5)[0] || null;
    if (first) d = Math.max(0, segProj(first.x, first.y, u.x, u.y, ex, ey).along - (u.radius + first.radius) * 0.7);
    const sx = u.x, sy = u.y;
    legacyFx(mt, u, def, cast, 'dash', {});
    w.startDash(u, sx + Math.cos(a) * d, sy + Math.sin(a) * d, Math.max(0.08, E.duration * (d / E.distance)), () => {
      if (first && first.alive && dist(u.x, u.y, first.x, first.y) <= u.radius + first.radius + 1.6) {
        hit(mt, u, first, cast.dmg, def, cast);
        if (first.alive) applyStatus(mt, u, first, 'stun', E.stun, 0, def.id);
        legacyFx(mt, u, def, cast, 'impact', { x: first.x, y: first.y, tgt: first.id });
      }
      legacyFx(mt, u, def, cast, 'dash_end', { x: u.x, y: u.y });
      impact(mt, u, def, cast, u.x, u.y);
      if (E.trail && dist(sx, sy, u.x, u.y) > 0.8) {
        const T = E.trail, lvl = 1 + 0.06 * ((u.level || 1) - 1), tick = (T.base + T.ratio * u.stats.ap) * lvl;
        spawnField(mt, u, {
          ability: def.id, element: u.mtMon.types[0], x: sx, y: sy, x2: u.x, y2: u.y, radius: T.width * 0.5 + 0.2, duration: T.duration, interval: T.interval, cast: cast.seq,
          onTick: (f, o) => { hit(mt, u, o, tick, def, cast, { mtField: true }); if (o.alive) applyStatus(mt, u, o, 'slow', T.slowDuration, T.slow, def.id); },
        });
      }
    });
    cast.info = { distance: d, width: E.hitWidth, tx: sx + Math.cos(a) * d, ty: sy + Math.sin(a) * d };
    return true;
  },
  /** Rock Slam: knock-up around self. */
  slam(mt, u, def, aim, cast) {
    const E = def.extra;
    for (const o of enemiesIn(mt, u.team, u.x, u.y, E.radius)) {
      hit(mt, u, o, cast.dmg, def, cast);
      if (o.alive) applyStatus(mt, u, o, 'knockup', E.knockup, 0, def.id);
    }
    legacyFx(mt, u, def, cast, 'aoe_burst', { radius: E.radius });
    impact(mt, u, def, cast, u.x, u.y);
    cast.info = { radius: E.radius };
    return true;
  },
  /** Quake Charge: charge through enemies (Final: stun); +80 % vs structures for 4 s. Can target a structure. */
  charge(mt, u, def, aim, cast) {
    const E = def.extra, w = mt.world;
    if (u.cc.rootUntil > w.time) return false;
    const a = Math.atan2(aim.ay - u.y, aim.ax - u.x);
    let d = Math.min(E.distance, Math.max(1, dist(u.x, u.y, aim.ax, aim.ay) + (aim.tgt && !isStructureKind(aim.tgt) ? 0.8 : 0)));
    if (aim.tgt && isStructureKind(aim.tgt)) d = Math.max(0, Math.min(E.distance, dist(u.x, u.y, aim.tgt.x, aim.tgt.y) - aim.tgt.radius - u.radius - 0.2));
    u.mtMon.structureBonusUntil = w.time + E.structureBonusDuration;
    emitStatus(mt, u, u, 'buff', E.structureBonusDuration, 'quake_siege', def.id);
    const sx = u.x, sy = u.y;
    legacyFx(mt, u, def, cast, 'dash', {});
    w.startDash(u, sx + Math.cos(a) * d, sy + Math.sin(a) * d, Math.max(0.1, E.duration * (d / E.distance)), () => {
      for (const o of enemiesOnSegment(mt, u.team, sx, sy, u.x, u.y, E.hitWidth)) {
        hit(mt, u, o, cast.dmg, def, cast);
        if (E.stun && o.alive) applyStatus(mt, u, o, 'stun', E.stun, 0, def.id);
      }
      legacyFx(mt, u, def, cast, 'aoe_burst', { x: u.x, y: u.y, radius: 1.8 });
      impact(mt, u, def, cast, u.x, u.y);
    });
    cast.info = { distance: d, width: E.hitWidth, tx: sx + Math.cos(a) * d, ty: sy + Math.sin(a) * d };
    return true;
  },
  /** Gale Slash: dash through a target cutting everything on the path; resets on kill; Final double-hit. */
  dash_strike(mt, u, def, aim, cast) {
    const E = def.extra, w = mt.world, t = aim.tgt;
    if (!t || u.cc.rootUntil > w.time) return false;
    const dt = dist(u.x, u.y, t.x, t.y);
    if (dt > E.distance + t.radius + u.radius + 0.5) return false;
    const a = Math.atan2(t.y - u.y, t.x - u.x);
    const d = Math.min(E.distance + E.overshoot, dt + E.overshoot);
    const sx = u.x, sy = u.y, cds = cdStore(u);
    legacyFx(mt, u, def, cast, 'dash', {});
    w.startDash(u, sx + Math.cos(a) * d, sy + Math.sin(a) * d, Math.max(0.08, E.duration * (d / E.distance)), () => {
      const victims = enemiesOnSegment(mt, u.team, sx, sy, u.x, u.y, E.hitWidth);
      if (t.alive && !victims.includes(t) && dist(u.x, u.y, t.x, t.y) < E.distance) victims.push(t);
      let killed = false;
      for (const o of victims) { hit(mt, u, o, cast.dmg, def, cast); if (!o.alive) killed = true; }
      legacyFx(mt, u, def, cast, 'dash_end', { x: u.x, y: u.y });
      impact(mt, u, def, cast, t.x, t.y);
      const reset = () => {
        cds.a1 = Math.min(cds.a1, w.time + E.resetCd);
        legacyFx(mt, u, def, cast, 'reset', { x: u.x, y: u.y });
        emitStatus(mt, u, u, 'buff', E.resetCd, 'gale_reset', def.id);
      };
      if (killed && E.resetOnKill) reset();
      if ((E.hits || 1) > 1 && t.alive) {
        w.schedule(E.secondHitDelay, () => {
          if (!t.alive || !u.alive || dist(u.x, u.y, t.x, t.y) > E.distance) return;
          legacyFx(mt, u, def, cast, 'impact', { x: t.x, y: t.y, tgt: t.id });
          hit(mt, u, t, cast.dmg * E.secondHitMult, def, cast, { mtHop: 1 });
          if (!t.alive && E.resetOnKill) reset();
        });
      }
    });
    cast.info = { distance: d, width: E.hitWidth, tx: sx + Math.cos(a) * d, ty: sy + Math.sin(a) * d };
    return true;
  },
  /** Cyclone: whirlwind around self, N ticks; Final pulls enemies in. */
  cyclone(mt, u, def, aim, cast) {
    const E = def.extra, w = mt.world;
    mt.L.addBuff(w, u, 'mt_cyclone', E.duration, null, { radius: E.radius });
    for (let i = 0; i < E.ticks; i++) {
      w.schedule((i * E.duration) / E.ticks, () => {
        if (!u.alive || u.removed) return;
        for (const o of enemiesIn(mt, u.team, u.x, u.y, E.radius)) {
          hit(mt, u, o, cast.dmg, def, cast, { mtHop: i });
          if (E.pull && o.alive) {
            const d = dist(o.x, o.y, u.x, u.y), room = d - (u.radius + o.radius + 0.15);
            const p = Math.min(E.pull, room);
            if (p > 0.15) displace(mt, u, o, o.x + (u.x - o.x) / d * p, o.y + (u.y - o.y) / d * p, E.pullTime, 'pull', def.id);
          }
        }
        if (i === 0) impact(mt, u, def, cast, u.x, u.y);
        legacyFx(mt, u, def, cast, i === 0 ? 'aoe_burst' : 'zone_tick', { x: u.x, y: u.y, radius: E.radius });
      });
    }
    cast.info = { radius: E.radius, duration: E.duration };
    return true;
  },
};

/** Can this monster act (cast) now? */
function canCast(mt, u) {
  const M = u.mtMon, w = mt.world;
  return !!M && u.alive && !M.evolving && !M.capturing && !mt.L.isDisabled(w, u) && !(u.cc.silenceUntil > w.time) && !u.dash;
}

/**
 * Cast a monster ability now. Returns false (no cooldown spent) if it cannot be cast.
 * @param {object} mt @param {object} u monster unit @param {'a1'|'a2'} slot
 * @param {number} [x] @param {number} [y] aim point  @param {number} [targetId] @param {{manual?:boolean}} [opts]
 */
export function castMonsterAbility(mt, u, slot, x, y, targetId = -1, opts = {}) {
  const M = u && u.mtMon, w = mt.world; if (!M || !canCast(mt, u)) return false;
  const def = abilityFor(M.line, slot, M.stage); if (!def) return false;
  const cds = cdStore(u); if (w.time < cds[slot]) return false;
  const aim = resolveAim(mt, u, def, x, y, targetId, !!opts.manual); if (!aim) return false;
  const rec = M.rec, C = mt.combat;
  const surged = !!(rec && rec.surgeUntil > w.time);
  const cast = { seq: ++C.castSeq, slot, surged, fieldDone: false, manual: !!opts.manual, dmg: 0, info: null };
  cast.dmg = abilityDamage(mt, u, def, surged);
  const prevFacing = u.facing;
  if (Math.abs(aim.ax - u.x) + Math.abs(aim.ay - u.y) > 1e-3) u.facing = Math.atan2(aim.ay - u.y, aim.ax - u.x);
  const impl = KINDS[def.kind];
  if (!impl || !impl(mt, u, def, aim, cast)) { u.facing = prevFacing; return false; }
  cds[slot] = w.time + cooldownOf(mt, u, def);
  if (surged) { rec.surgeUntil = 0; mt.L.removeBuff(u, 'mt_surge'); }
  M.queued = null;
  u.castSeq = (u.castSeq || 0) + 1; u.castSlot = slot === 'a1' ? 'Q' : 'W'; u.castT = w.time; u.lastCombatT = w.time;
  mt.stats.monsterCasts++;
  const r = statRow(mt, u); if (r) r.casts++;
  const E = def.extra || {}, I = cast.info || {};
  mt.emit(mt.E.MONSTER_CAST, {
    trainer: M.ownerId, unit: u.id, slot, ability: def.id, name: def.name, kind: def.kind, aim: def.aim, element: M.types[0],
    x: u.x, y: u.y, tx: I.tx ?? aim.ax, ty: I.ty ?? aim.ay, targetId: aim.tgt ? aim.tgt.id : -1,
    range: def.range, radius: I.radius ?? E.radius, width: I.width ?? E.width, count: I.count, delay: I.delay,
    upgraded: !!def.upgraded, surged, manual: cast.manual, cast: cast.seq,
  });
  for (const fn of mt.hooks.cast) mt.guard('cast', () => fn(mt, u, slot, def, aim));
  return true;
}

function deny(mt, trainer, code, text) { mt.emit(mt.E.DENY, { trainer: trainer.id, code, text }); return false; }

/** Trainer command: force-cast A1/A2 of the active monster (targeted moves out of range are queued for 3 s). */
export function commandMonsterCast(mt, trainer, slot, x, y, targetId) {
  const r = trainer.mtTrainer, w = mt.world;
  const rec = r && r.activeIdx >= 0 ? r.party[r.activeIdx] : null;
  const u = rec && rec.unitId >= 0 ? w.units.get(rec.unitId) : null;
  if (!trainer.alive) return deny(mt, trainer, 'dead', t('deny.dead'));
  if (!u || !u.alive) return deny(mt, trainer, 'no_monster', t('deny.noMonster'));
  if (!hasAbility(rec, slot)) return deny(mt, trainer, 'locked', t('deny.locked'));
  if (w.time < rec.cds[slot]) return deny(mt, trainer, 'cooldown', t('deny.moveCd'));
  if (!canCast(mt, u)) return deny(mt, trainer, 'busy', u.mtMon.evolving ? t('deny.evolving') : t('deny.busy'));
  const M = u.mtMon, def = abilityFor(M.line, slot, M.stage);
  if (def.aim === 'unit') {
    const aim = resolveAim(mt, u, def, x, y, targetId ?? -1, true);
    if (!aim || !aim.tgt) return deny(mt, trainer, 'no_target', t('deny.noTarget'));
    const reach = (def.kind === 'dash_strike' ? def.extra.distance : def.range) + aim.tgt.radius + u.radius;
    if (dist(u.x, u.y, aim.tgt.x, aim.tgt.y) > reach) {
      M.queued = { slot, targetId: aim.tgt.id, until: w.time + 3 };
      M.focusId = aim.tgt.id; M.focusUntil = w.time + 3; M.regroupUntil = 0;
      return true;
    }
    return castMonsterAbility(mt, u, slot, aim.tgt.x, aim.tgt.y, aim.tgt.id, { manual: true }) || deny(mt, trainer, 'no_target', t('deny.cantCast'));
  }
  return castMonsterAbility(mt, u, slot, x, y, targetId ?? -1, { manual: true }) || deny(mt, trainer, 'no_target', t('deny.cantCast'));
}

/** Trainer command: toggle monster auto-cast ({type:'monsterAutoCast', on?:boolean}). */
export function commandAutoCast(mt, trainer, on) {
  const T = trainer.mtTrainer; if (!T) return false;
  T.autoCast = typeof on === 'boolean' ? on : T.autoCast === false;
  return true;
}

// ------------------------------------------------------------------------------------------ ability AI
const AI_EVERY = 3;   // ticks between auto-cast evaluations (staggered by unit phase)
const SCAN_R = 10;

function aiValue(o) {
  if (o.kind === KIND.CHAMPION) return 2.5;
  if (o.mtMon) return o.mtMon.ownerId >= 0 ? 3 : 2.5;
  if (o.kind === KIND.MONSTER) return o.epic ? 3 : 2;
  if (o.kind === KIND.MINION) return o.subtype === 'siege' || o.subtype === 'super' ? 1.3 : 1;
  return 0;
}

/** Perception for one auto-cast decision. */
function aiContext(mt, u, target) {
  const w = mt.world, t = w.time;
  const owner = ownerOf(mt, u);
  const all = [];
  for (const o of w.queryUnits(u.x, u.y, SCAN_R, null, [])) {
    if (!validEnemy(mt, u, o, false)) continue;
    // pets ignore uninvolved wild monsters (no stray AoE into camps while laning)
    if (u.mtMon.ownerId >= 0 && o.team === TEAM.NEUTRAL && o !== target && o.targetId !== u.id && !(owner && o.targetId === owner.id)) continue;
    // Easy (rules.js ASSIST.focusHuman): an enemy bot's monster does not aim its moves at a HUMAN trainer
    if (o.mtTrainer && o !== target && owner && owner.bot && mt.rules && mt.rules.focusHuman(u.team, o) < 0.5) continue;
    all.push(o);
  }
  all.sort((a, b) => dist2(u.x, u.y, a.x, a.y) - dist2(u.x, u.y, b.x, b.y) || a.id - b.id);
  const heroes = all.filter(isHero);
  const anchor = owner || u;
  const divers = heroes.filter((o) => dist(o.x, o.y, anchor.x, anchor.y) < 4.5 || dist(o.x, o.y, u.x, u.y) < 3);
  return { t, owner, all, heroes, divers, target: target && validEnemy(mt, u, target, true) ? target : null, hpFrac: u.hp / u.maxHp, hurt: u.lastHitTime > t - 2.5 };
}

const inReach = (u, o, r) => dist(u.x, u.y, o.x, o.y) <= r + o.radius + u.radius;
const ccd = (mt, o) => o.cc.stunUntil > mt.world.time || o.cc.rootUntil > mt.world.time || o.cc.airborneUntil > mt.world.time;
const lowest = (list) => list.slice().sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp || a.id - b.id)[0] || null;

/** Plans by AbilityDef.ai: return {x?, y?, targetId?} to cast, or null to hold. */
const AI = {
  poke(mt, u, def, c) {
    const R = def.range * 0.92;
    const h = lowest(c.heroes.filter((o) => inReach(u, o, R)));
    if (h) return { targetId: h.id };
    if (c.heroes.length) return null; // save it for the fight
    const t = c.target && !isStructureKind(c.target) && inReach(u, c.target, R) ? c.target : null;
    if (!t) return null;
    if (t.kind === KIND.MINION && c.all.filter((o) => dist(o.x, o.y, t.x, t.y) < 3).length < 2) return null;
    return { targetId: t.id };
  },
  aoe_ground(mt, u, def, c) {
    const E = def.extra, R = def.range + E.radius * 0.5;
    let best = null, bs = 0, bh = 0;
    for (const cand of c.all) {
      if (dist(u.x, u.y, cand.x, cand.y) > R) continue;
      const p = lead(u, cand, 0, E.delay);
      if (dist(u.x, u.y, p.x, p.y) > def.range + 0.5) continue;
      let s = 0, hh = 0;
      for (const o of c.all) {
        const q = lead(u, o, 0, E.delay);
        if (dist(q.x, q.y, p.x, p.y) <= E.radius * 0.85 + o.radius * 0.5) { s += aiValue(o); if (isHero(o)) hh++; }
      }
      if (s > bs) { bs = s; bh = hh; best = p; }
    }
    if (!best) return null;
    if (c.heroes.length && !bh && bs < 4) return null;
    return bs >= 2.5 ? { x: best.x, y: best.y } : null;
  },
  aoe_self(mt, u, def, c) {
    const r = (def.extra.radius || def.range) * 0.9;
    let s = 0, hh = 0;
    for (const o of c.all) if (dist(u.x, u.y, o.x, o.y) <= r + o.radius * 0.5) { s += aiValue(o); if (isHero(o)) hh++; }
    if (c.heroes.length && !hh && s < 4) return null;
    return s >= 2.5 ? {} : null;
  },
  chain(mt, u, def, c) {
    const R = def.range;
    const h = lowest(c.heroes.filter((o) => inReach(u, o, R)));
    if (h) return { targetId: h.id };
    if (c.heroes.length) return null;
    const t = c.target && !isStructureKind(c.target) && inReach(u, c.target, R) ? c.target : null;
    if (!t) return null;
    if (t.kind === KIND.MINION && c.all.filter((o) => dist(o.x, o.y, t.x, t.y) < def.extra.bounce).length < 2) return null;
    return { targetId: t.id };
  },
  cc_shot(mt, u, def, c) {
    const R = def.range * 0.9;
    // peel: the enemy diving my trainer / me first
    const d = c.divers.filter((o) => inReach(u, o, R) && !ccd(mt, o)).sort((a, b) => dist2(a.x, a.y, (c.owner || u).x, (c.owner || u).y) - dist2(b.x, b.y, (c.owner || u).x, (c.owner || u).y) || a.id - b.id)[0];
    if (d) return { targetId: d.id };
    const h = lowest(c.heroes.filter((o) => inReach(u, o, R) && !ccd(mt, o)));
    if (h) return { targetId: h.id };
    if (c.heroes.length) return null;
    const t = c.target;
    return t && t.kind === KIND.MONSTER && inReach(u, t, R) ? { targetId: t.id } : null;
  },
  engage(mt, u, def, c) {
    const R = def.extra.distance * 0.95;
    // escape: low and threatened -> dash toward my trainer / away from the closest hero
    if (c.hpFrac < 0.25 && c.heroes.length && dist(c.heroes[0].x, c.heroes[0].y, u.x, u.y) < 4) {
      const th = c.heroes[0], a = Math.atan2(u.y - th.y, u.x - th.x);
      const goal = c.owner && dist(c.owner.x, c.owner.y, th.x, th.y) > 3 ? c.owner : { x: u.x + Math.cos(a) * 6, y: u.y + Math.sin(a) * 6 };
      return { x: goal.x, y: goal.y };
    }
    const d = c.divers.find((o) => inReach(u, o, R) && !ccd(mt, o));
    if (d) return { targetId: d.id };
    const h = lowest(c.heroes.filter((o) => inReach(u, o, R)));
    if (h && (c.hpFrac >= 0.45 || h.hp / h.maxHp < 0.3)) return { targetId: h.id };
    if (c.heroes.length) return null;
    const t = c.target;
    return t && t.kind === KIND.MONSTER && inReach(u, t, R) && dist(u.x, u.y, t.x, t.y) > 2 ? { targetId: t.id } : null;
  },
  execute(mt, u, def, c) {
    const R = def.extra.distance + 0.3, dmg = abilityDamage(mt, u, def) * (def.extra.hits > 1 ? 1 + def.extra.secondHitMult : 1);
    const kill = (o) => (o.hp + (o.shield || 0)) < dmg * mitigation(o.stats.armor || 0) * typeMult(mt, u, o) * 0.95;
    const inR = c.all.filter((o) => inReach(u, o, R));
    const k = inR.filter(kill).sort((a, b) => (isHero(b) - isHero(a)) || a.hp - b.hp || a.id - b.id)[0];
    if (k && (isHero(k) || !c.heroes.length || k.kind === KIND.MONSTER)) return { targetId: k.id };
    const h = lowest(c.heroes.filter((o) => inReach(u, o, R)));
    if (h && (c.hpFrac >= 0.35 || h.hp / h.maxHp < 0.35)) return { targetId: h.id };
    if (c.heroes.length) return null;
    const t = c.target && !isStructureKind(c.target) && inReach(u, c.target, R) ? c.target : null;
    return t && (t.kind === KIND.MONSTER || inR.length >= 3) ? { targetId: t.id } : null;
  },
  siege(mt, u, def, c) {
    const R = def.extra.distance * 0.9;
    const d = c.divers.find((o) => inReach(u, o, R));
    if (d) return { targetId: d.id };
    const h = lowest(c.heroes.filter((o) => inReach(u, o, R)));
    if (h && c.hpFrac >= 0.4) return { targetId: h.id };
    const t = c.target;
    if (t && isStructureKind(t) && !c.heroes.length && dist(u.x, u.y, t.x, t.y) <= R + t.radius) return { targetId: t.id };
    if (c.heroes.length) return null;
    return t && t.kind === KIND.MONSTER && inReach(u, t, R) && dist(u.x, u.y, t.x, t.y) > 2.5 ? { targetId: t.id } : null;
  },
  heal(mt, u, def, c) {
    const E = def.extra;
    if (c.hpFrac < 0.3 || (c.hpFrac < 0.55 && c.hurt)) return {};
    if (E.splash) {
      const allies = mt.world.queryUnits(u.x, u.y, E.splash, (o) => o.alive && o.team === u.team && o !== u && (o.kind === KIND.CHAMPION || (o.mtMon && o.mtMon.ownerId >= 0)), []);
      if (allies.some((o) => o.hp / o.maxHp < 0.4 && o.lastHitTime > c.t - 3)) return {};
      if (c.owner && c.owner.alive && c.owner.hp / c.owner.maxHp < 0.35 && c.owner.lastHitTime > c.t - 3) return {};
    }
    return null;
  },
  tank(mt, u, def, c) {
    const E = def.extra;
    const near = c.all.filter((o) => dist(o.x, o.y, u.x, u.y) < 3.5);
    const focused = c.hurt && c.hpFrac < 0.9 && (near.some(isHero) || near.length >= 3);
    if (focused) return {};
    if (E.taunt) {
      const minions = c.all.filter((o) => o.kind === KIND.MINION && dist(o.x, o.y, u.x, u.y) < E.tauntRadius);
      const ownerHit = c.owner && c.owner.lastHitTime > c.t - 1.5;
      if (minions.length >= 3 && (ownerHit || c.heroes.length)) return {};
      if (c.divers.some((o) => o.mtMon && dist(o.x, o.y, u.x, u.y) < E.tauntRadius)) return {};
    }
    return null;
  },
};

function runAI(mt, u, target, slots) {
  const M = u.mtMon, w = mt.world, cds = cdStore(u);
  let ready = false;
  for (const s of slots) if (w.time >= cds[s] && abilityFor(M.line, s, M.stage)) { ready = true; break; }
  if (!ready || !canCast(mt, u)) return false;
  const c = aiContext(mt, u, target);
  for (const slot of slots) {
    const def = abilityFor(M.line, slot, M.stage);
    if (!def || w.time < cds[slot]) continue;
    const plan = AI[def.ai] ? AI[def.ai](mt, u, def, c) : null;
    if (!plan) continue;
    if (castMonsterAbility(mt, u, slot, plan.x, plan.y, plan.targetId ?? -1)) return true;
  }
  return false;
}

/**
 * Pet AI (called every tick by mt/sim/monsters.js unitAI): queued manual casts + auto-cast when sensible.
 * Returns true if this tick's action was consumed (cast, or walking into range for a queued cast).
 */
export function tryAutoCast(mt, u, target) {
  const M = u.mtMon, w = mt.world;
  if (!M || !M.rec) return false;
  if (M.queued) {
    const q = M.queued, tgt = w.units.get(q.targetId);
    const def = abilityFor(M.line, q.slot, M.stage);
    if (!def || w.time > q.until || !tgt || !validEnemy(mt, u, tgt, false) || w.time < M.rec.cds[q.slot]) M.queued = null;
    else {
      const reach = (def.kind === 'dash_strike' ? def.extra.distance : def.range) + tgt.radius + u.radius;
      if (dist(u.x, u.y, tgt.x, tgt.y) <= reach) { if (castMonsterAbility(mt, u, q.slot, tgt.x, tgt.y, tgt.id, { manual: true })) return true; }
      else if (!mt.L.isImmobile(w, u)) { u.state = 'moving'; w.moveToward(u, tgt.prevX, tgt.prevY, reach - 0.4, tgt); return true; }
    }
  }
  if ((w.tickNo + u.phase) % AI_EVERY !== 0) return false;
  const owner = ownerOf(mt, u);
  if (owner && owner.mtTrainer.autoCast === false) return false;
  if (u.mtCastHold > w.time) return false;   // bot difficulty: ability timing (rules.js onCast, options.js BOT_SKILL.abilityUse)
  return runAI(mt, u, target, ['a2', 'a1']);
}

/** "The incoming monster enters with a short burst" (DESIGN §3). */
export function swapBurst(mt, u) {
  const B = TRAINER.swapBurst;
  mt.L.addBuff(mt.world, u, 'mt_swap_burst', B.duration, { attackSpeedPct: B.attackSpeedPct, msPct: B.msPct });
  emitStatus(mt, u, u, 'buff', B.duration, 'mt_swap_burst', null);
}

/** Aggregated balance stats (per line / stage / spec). */
export function balanceTable(mt) {
  return [...mt.combat.stats.values()].map((r) => ({
    ...r, dealt: Math.round(r.dealt), dealtHero: Math.round(r.dealtHero), taken: Math.round(r.taken), healed: Math.round(r.healed), time: Math.round(r.time),
    dpsHero: r.time > 0 ? +(r.dealtHero / r.time).toFixed(1) : 0, dps: r.time > 0 ? +(r.dealt / r.time).toFixed(1) : 0,
  })).sort((a, b) => (a.key < b.key ? -1 : 1));
}
