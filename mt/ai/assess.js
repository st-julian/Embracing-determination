// mt/ai/assess.js — combat arithmetic for the trainer bot brain: unit DPS / effective HP, type matchups, fight
// (trade) estimates, structure danger, wild-monster capture value. Owner: AI specialist. Read-only over the world.

import { typeMultiplier, STRONG } from '../data/types.js';
import { FORMS, LINES } from '../data/species.js';
import { abilityFor, ABILITY_LEVEL_SCALING } from '../data/abilities.js';
import { computeMonsterStats } from '../sim/monsters.js';
import { TRAINER, SPECS } from '../data/balance.js';

export const TOWER_RANGE = 6.6;

const typesOf = (u) => (u && u.mtMon ? u.mtMon.types : null);
const strongFor = (mt, u) => {
  if (!u || !u.mtMon || u.mtMon.ownerId < 0) return STRONG;
  const o = mt.world.units.get(u.mtMon.ownerId);
  return o && o.mtTrainer && o.mtTrainer.spec === 'magic' ? SPECS.magic.passive.strong : STRONG;
};

/** Damage multiplier when `a` hits `b` (1 for typeless units). */
export function mult(mt, a, b) {
  const ta = typesOf(a), tb = typesOf(b);
  if (!ta || !tb) return 1;
  return typeMultiplier(ta[0], tb, strongFor(mt, a));
}

/** Multiplier between two forms (party records / hypothetical monsters). */
export function formMult(formA, formB) {
  const a = FORMS[formA], b = FORMS[formB];
  if (!a || !b) return 1;
  return typeMultiplier(a.types[0], b.types);
}

/** Damage mitigation factor of a unit against mixed damage (legacy armor formula 100/(100+armor)). */
const mitig = (u) => { const ar = ((u.stats.armor || 0) + (u.stats.mr || 0)) / 2; return 100 / (100 + Math.max(0, ar)); };

/** Approximate sustained damage per second of a unit (basic attacks + monster abilities). */
export function dps(mt, u) {
  if (!u || !u.alive) return 0;
  if (u.kind === 'tower') return 160 * 0.83 * 1.3;
  let d = (u.stats.ad || 0) * Math.min(2.5, u.stats.attackSpeed || 0.7);
  if (u.mtMon) {
    const M = u.mtMon;
    for (const slot of ['a1', 'a2']) {
      const a = abilityFor(M.line, slot, M.stage);
      if (!a || !a.base) continue;
      const stat = a.stat === 'mag' ? u.stats.ap : u.stats.ad;
      d += ((a.base + (a.ratio || 0) * stat) * (1 + ABILITY_LEVEL_SCALING * ((u.level || 1) - 1))) / a.cd * 0.8;
    }
  } else if (u.mtTrainer) d *= 0.8;          // sling: weak and often interrupted by repositioning
  return d;
}

/** Effective HP (hp + shield, scaled by mitigation). */
export function ehp(u) {
  if (!u || !u.alive) return 0;
  return (u.hp + (u.shield || 0)) / mitig(u);
}

/** Party-record strength proxy (for planning when the monster is not deployed). */
export function recordPower(rec, spec = null) {
  if (!rec) return 0;
  const s = computeMonsterStats(rec.form, rec.level, spec);
  return Math.sqrt(s.hp * (s.ad * s.attackSpeed + s.ap * 0.6)) * (rec.fainted ? 0 : Math.max(0.15, rec.hpFrac));
}

/** Combat units of a side around a point. `vis` = only units visible to `viewTeam`. */
export function sideUnits(mt, team, x, y, r, viewTeam) {
  const w = mt.world, out = [];
  for (const u of w.queryUnits(x, y, r, null, mt._aiScan || (mt._aiScan = []))) {
    if (!u.alive || u.team !== team || u.removed) continue;
    if (viewTeam !== team && u.visible && u.visible[viewTeam] === false) continue;
    if (u.kind === 'champion' || (u.mtMon && u.mtMon.ownerId >= 0 && !u.mtMon.capturing) || u.kind === 'minion') out.push(u);
  }
  return out;
}

/**
 * Lanchester-style trade estimate at a point for `team`: ratio = (ourDps·ourEhp)/(theirDps·theirEhp) with type
 * multipliers applied pairwise (weighted by the enemy's EHP share). Minions count partially, towers add DPS to the
 * side that owns them. Allies/enemies within `r` (+ allies heading in within r+extra at reduced weight).
 * @returns {{ratio:number, ours:{dps:number,ehp:number,n:number}, theirs:{dps:number,ehp:number,n:number}, enemies:object[], allies:object[], tower:number}}
 */
export function estimateFight(mt, team, x, y, r = 11, opts = {}) {
  const w = mt.world;
  const allies = sideUnits(mt, team, x, y, r + (opts.allyExtra || 0), team);
  const enemies = sideUnits(mt, 1 - team, x, y, r, team);
  const side = (list, foes, own) => {
    const fw = foes.filter((f) => f.kind !== 'minion');
    let tw = 0; for (const f of fw) tw += ehp(f);
    let D = 0, H = 0, n = 0;
    for (const u of list) {
      const far = own && Math.hypot(u.x - x, u.y - y) > r ? 0.6 : 1;
      const wgt = (u.kind === 'minion' ? 0.3 : 1) * far;
      let m = 1;
      if (u.mtMon && tw > 0) { m = 0; for (const f of fw) m += mult(mt, u, f) * ehp(f) / tw; }
      D += dps(mt, u) * m * wgt;
      // a trainer's death recalls its monster: trainers count as extra (vulnerable) EHP
      H += ehp(u) * wgt * (u.kind === 'champion' ? 0.6 : 1);
      if (u.kind !== 'minion') n++;
    }
    return { dps: D, ehp: H, n };
  };
  const ours = side(allies, enemies, true), theirs = side(enemies, allies, false);
  // towers: an alive tower whose range covers the point fights for its owner
  let tower = 0;
  for (const s of w.structures) {
    if (!s.alive || s.kind !== 'tower') continue;
    const d = Math.hypot(s.x - x, s.y - y);
    if (d > TOWER_RANGE + 2.5) continue;
    const k = d < TOWER_RANGE ? 1 : 0.5;
    if (s.team === team) { ours.dps += dps(mt, s) * 0.8 * k; tower += k; } else { theirs.dps += dps(mt, s) * k; tower -= k; }
  }
  const eps = 1;
  const ratio = ((ours.dps + eps) * (ours.ehp + eps)) / ((theirs.dps + eps) * (theirs.ehp + eps));
  return { ratio, ours, theirs, enemies: enemies.filter((u) => u.kind !== 'minion'), allies: allies.filter((u) => u.kind !== 'minion'), tower };
}

/** Enemy tower (alive) whose range covers (x,y) with a margin, or null. */
export function enemyTowerAt(mt, team, x, y, margin = 1.5) {
  for (const s of mt.world.structures) {
    if (!s.alive || s.team === team || s.kind !== 'tower') continue;
    if (Math.hypot(s.x - x, s.y - y) <= TOWER_RANGE + s.radius + margin) return s;
  }
  return null;
}

/** Allied minions of `team` inside the range of tower `s`. */
export function minionsUnder(mt, s, team) {
  let n = 0;
  for (const u of mt.world.queryUnits(s.x, s.y, TOWER_RANGE + s.radius, null, mt._aiScan2 || (mt._aiScan2 = []))) if (u.alive && u.kind === 'minion' && u.team === team) n++;
  return n;
}

/**
 * Value of a monster line as an ADDITION to a party (0..~3): type coverage vs known enemy monsters, covering the
 * active monster's weaknesses, team-composition diversity (and the team wanting a siege/tank body).
 * @param {string} line   candidate line id
 * @param {{myLines:string[], teamLines:string[], enemyTypes:string[][]}} ctx
 */
export function lineValue(line, ctx) {
  const cand = LINES[line].forms[0].types, atk = cand[0];
  let v = 1;
  // offence/defence vs known enemy monsters
  if (ctx.enemyTypes.length) {
    let off = 0, def = 0;
    for (const et of ctx.enemyTypes) { off += typeMultiplier(atk, et); def += typeMultiplier(et[0], cand); }
    off /= ctx.enemyTypes.length; def /= ctx.enemyTypes.length;
    v += (off - 1) * 1.2 - (def - 1) * 0.9;
  }
  // cover my active monster's weaknesses: candidate should be strong vs the lines that beat my monster
  for (const ml of ctx.myLines) {
    if (ml === line) { v -= 1.2; continue; }
    const mine = LINES[ml].forms[0].types;
    let cover = 0, threats = 0;
    for (const t of Object.keys(LINES)) {
      if (typeMultiplier(t, mine) > 1.01) { threats++; cover += typeMultiplier(atk, LINES[t].forms[0].types) - typeMultiplier(t, cand) * 0.5; }
    }
    if (threats) v += 0.5 * cover / threats;
    if (typeMultiplier(atk, mine) < 0.99 && typeMultiplier(mine[0], cand) < 0.99) v -= 0.15; // mutually resisted = redundant
  }
  // team diversity + composition needs
  const dup = ctx.teamLines.filter((l) => l === line).length;
  v -= 0.6 * dup;
  // variety across the match: lines nobody owns yet are worth a little more, very common ones a little less
  if (ctx.allLines) { const n = ctx.allLines.filter((l) => l === line).length; v += n === 0 ? 0.35 : -0.12 * Math.max(0, n - 1); }
  if (line === 'earth' && !ctx.teamLines.includes('earth')) v += 0.25;      // siege bruiser
  if ((line === 'grass' || line === 'water') && !ctx.teamLines.some((l) => l === 'grass' || l === 'water')) v += 0.15; // frontline
  return v + LINES[line].catch * 0.3;
}

/** Hypothetical catch chance at a given hp fraction (mirrors capture.captureChance without the unit). */
export function chanceAt(line, level, hpFrac, status, C) {
  const hpTerm = Math.pow(Math.max(0, 1 - hpFrac), C.hpExponent);
  const p = LINES[line].catch * (C.floor + (1 - C.floor) * hpTerm) + (status ? C.statusBonus : 0) - C.levelPenalty * Math.max(0, level - C.levelPenaltyAbove);
  return Math.min(C.pMax, Math.max(C.pMin, p));
}

export const TRAINER_SLING = TRAINER.attack;
