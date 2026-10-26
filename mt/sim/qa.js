// mt/sim/qa.js — QA harness helpers, exposed as `world.mt.debug.qa` (also `__moba.mt.debug.qa`). Owner: QA.
// Used by tools/mt-smoke.cjs (--playthrough / --determinism / match invariants) and handy in the console.
//
//   qa.run(seconds, acc?)        tick the world synchronously (stops at a winner), accumulating event stats into acc
//   qa.invariants(opts?)         NaN/HP/bounds/orphan-pet/party checks + unit/projectile/effect counts -> {ok, issues, counts}
//   qa.audit()                   in-match DESIGN rule audit (evolve gates, level cap, capture targets, respawn/faint timers,
//                                trainer HP, type multiplier) -> .report() {checks, violations}
//   qa.fuzz(seconds, opts?)      random/malformed world.command spam on every trainer (crash + invariant hunting)
//   qa.stateHash()               deterministic hash of the sim state (units, projectiles, stats) for determinism checks
//   qa.human(trainer, opts?)     scripted "human" for one trainer slot, driven ONLY through world.command:
//                                Capture -> Train -> Lane -> Fight -> Level up -> Evolve -> Towers -> Nexus;
//                                returns a controller whose report() lists the timestamp of every stage reached.
//
// Determinism: no Math.random / Date.now / performance.now here; the scripted human is a pure function of sim state.

import { FORMS } from '../data/species.js';
import { CAPTURE, TRAINER, SPECS, XP, FAINT } from '../data/balance.js';
import { typeMultiplier, STRONG } from '../data/types.js';
import { KIND, TEAM, dist, rand01 } from './util.js';
import { isCapturable } from './capture.js';
import { evolveReady } from './progression.js';
import * as monsters from './monsters.js';
import { hasAbility } from './combat.js';
import { i as FOUNTAINS, a as LANES } from '../../assets/map-oE9sOnNc.js';
import { guideFor } from './guide.js';

const finite = Number.isFinite;

export function makeQA(mt, D) {
  const w = mt.world;
  const U = (t) => (typeof t === 'object' ? t : w.units.get(t));

  // ------------------------------------------------------------------------------------------ run + events
  /** acc = {ticks, events:{type:n}, maxPerTick, maxPerTickType, deny:{trainerId:n}} (created if omitted). */
  function run(seconds, acc) {
    acc = acc || newAcc();
    const n = Math.round(seconds * 30);
    for (let i = 0; i < n && w.winner === null; i++) {
      w.tick();
      countEvents(w.events, acc);
    }
    return acc;
  }
  function newAcc() { return { ticks: 0, events: {}, maxPerTick: 0, maxPerTickT: 0, deny: {}, denyCodes: {} }; }
  function countEvents(evs, acc) {
    acc.ticks++;
    if (evs.length > acc.maxPerTick) { acc.maxPerTick = evs.length; acc.maxPerTickT = +w.time.toFixed(1); }
    for (const e of evs) {
      acc.events[e.type] = (acc.events[e.type] || 0) + 1;
      if (e.type === 'mt_deny') {
        acc.deny[e.trainer] = (acc.deny[e.trainer] || 0) + 1;
        acc.denyCodes[e.code] = (acc.denyCodes[e.code] || 0) + 1;
      }
    }
    return acc;
  }

  // ------------------------------------------------------------------------------------------ invariants
  function invariants(opts = {}) {
    const lim = { units: 400, projectiles: 250, effects: 300, scheduled: 600, spawnQueue: 200, wild: 40, ...opts };
    const issues = [];
    const add = (code, u, extra) => { if (issues.length < 40) issues.push({ code, id: u ? u.id : -1, kind: u ? u.kind : null, name: u ? u.name : null, t: +w.time.toFixed(1), ...extra }); };
    const counts = { units: w.unitList.length, mapUnits: w.units.size, byKind: {}, pets: 0, petsAlive: 0, wild: 0, wildAlive: 0, minions: 0,
      projectiles: w.projectiles.length, effects: w.kits && w.kits.effects ? w.kits.effects.length : 0,
      scheduled: w.scheduled ? w.scheduled.length : 0, spawnQueue: w.spawnQueue ? w.spawnQueue.length : 0, mtLog: mt.log.length };
    const petsOf = new Map();
    for (const u of w.unitList) {
      counts.byKind[u.kind] = (counts.byKind[u.kind] || 0) + 1;
      if (!finite(u.x) || !finite(u.y)) add('nan_pos', u, { x: u.x, y: u.y });
      if (!finite(u.hp) || !finite(u.maxHp)) add('nan_hp', u, { hp: u.hp, maxHp: u.maxHp });
      else if (u.alive && u.hp > u.maxHp + 1) add('hp_over_max', u, { hp: +u.hp.toFixed(1), maxHp: +u.maxHp.toFixed(1) });
      if (u.alive && finite(u.hp) && u.hp <= 0 && u.kind !== KIND.WARD) add('alive_zero_hp', u, { hp: u.hp });
      if (u.alive && !(u.maxHp > 0)) add('bad_maxhp', u, { maxHp: u.maxHp });
      if (finite(u.x) && (u.x < -3 || u.x > 123 || u.y < -3 || u.y > 123)) add('out_of_bounds', u, { x: +u.x.toFixed(1), y: +u.y.toFixed(1) });
      if (u.stats) for (const k of ['ad', 'ap', 'armor', 'mr', 'attackSpeed', 'moveSpeed', 'attackRange']) if (!finite(u.stats[k])) { add('nan_stat', u, { stat: k, v: u.stats[k] }); break; }
      if (u.kind === KIND.MINION) counts.minions++;
      if (u.mtMon) {
        if (u.mtMon.ownerId >= 0) {
          counts.pets++;
          if (u.alive) {
            counts.petsAlive++;
            const owner = w.units.get(u.mtMon.ownerId);
            const rec = u.mtMon.rec;
            if (!owner || !owner.mtTrainer) add('pet_no_owner', u, { owner: u.mtMon.ownerId });
            else if (!rec || rec.unitId !== u.id || !owner.mtTrainer.party.includes(rec)) add('orphan_pet', u, { owner: owner.id, recUnit: rec ? rec.unitId : null });
            if (u.team !== (owner ? owner.team : u.team)) add('pet_team', u, { team: u.team });
            petsOf.set(u.mtMon.ownerId, (petsOf.get(u.mtMon.ownerId) || 0) + 1);
            if (owner && !owner.alive && !u.mtMon.capturing) add('pet_while_trainer_dead', u, { owner: owner.id });
          }
        } else { counts.wild++; if (u.alive) counts.wildAlive++; }
      }
    }
    for (const [id, n] of petsOf) if (n > 1) add('multiple_pets', w.units.get(id), { n });
    for (const c of w.champions) {
      const T = c.mtTrainer; if (!T) continue;
      if (T.party.length > 2) add('party_over', c, { n: T.party.length });
      if (T.party.length && (T.activeIdx < 0 || T.activeIdx >= T.party.length)) add('bad_active_idx', c, { activeIdx: T.activeIdx, n: T.party.length });
      for (const r of T.party) {
        if (!FORMS[r.form]) add('bad_form', c, { form: r.form });
        if (!finite(r.level) || r.level < 1 || r.level > 13) add('bad_level', c, { level: r.level });
        if (!finite(r.xp) || r.xp < 0) add('bad_xp', c, { xp: r.xp });
        if (!finite(r.hpFrac)) add('nan_hpfrac', c, { form: r.form });
      }
      if (!finite(c.respawnAt) && !c.alive) add('bad_respawn', c, { respawnAt: c.respawnAt });
    }
    for (const p of w.projectiles) if (!finite(p.x) || !finite(p.y)) add('nan_projectile', null, { fx: p.fx, x: p.x, y: p.y });
    for (const [k, v] of [['units', counts.units], ['projectiles', counts.projectiles], ['effects', counts.effects], ['scheduled', counts.scheduled], ['spawnQueue', counts.spawnQueue], ['wild', counts.wild]]) {
      if (v > lim[k]) add('too_many_' + k, null, { n: v, limit: lim[k] });
    }
    if (counts.units !== counts.mapUnits) add('unit_map_mismatch', null, { list: counts.units, map: counts.mapUnits });
    return { ok: !issues.length, issues, counts };
  }

  // ------------------------------------------------------------------------------------------ state hash
  function stateHash() {
    let h = 0x811c9dc5 >>> 0;
    const mix = (v) => { // FNV-1a over the decimal string of v
      const s = String(v);
      for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
      h ^= 0x2c; h = Math.imul(h, 0x01000193) >>> 0;
    };
    mix(w.tickNo); mix(w.winner); mix(w.unitList.length); mix(w.projectiles.length);
    for (const u of w.unitList) {
      mix(u.id); mix(u.kind); mix(u.team); mix(u.alive ? 1 : 0);
      mix(Math.round(u.x * 1000)); mix(Math.round(u.y * 1000)); mix(Math.round(u.hp * 100)); mix(u.level);
      if (u.mtMon) { mix(u.mtMon.form); mix(u.mtMon.ownerId); }
      if (u.mtTrainer) for (const r of u.mtTrainer.party) { mix(r.form); mix(r.level); mix(Math.round(r.xp * 100)); mix(r.fainted ? 1 : 0); }
    }
    for (const p of w.projectiles) { mix(p.id); mix(Math.round(p.x * 1000)); mix(Math.round(p.y * 1000)); }
    const s = mt.stats;
    mix(s.captures); mix(s.captureAttempts); mix(s.evolutions); mix(s.levelUps); mix(s.faints); mix(s.monsterCasts); mix(s.trainerDeaths);
    return ('00000000' + h.toString(16)).slice(-8);
  }

  // ------------------------------------------------------------------------------------------ command fuzz
  /**
   * Hammer every trainer with random / malformed commands for `seconds` (deterministic: rand01 on the world seed).
   * Returns {commands, byType, results:{true,false,undefined,threw}, thrown:[...]} — exceptions escaping world.command
   * are caught and listed (mt.guard errors land in mt.errors as usual).
   */
  function fuzz(seconds, opts = {}) {
    const n = Math.round(seconds * 30), every = opts.every || 2;
    const R = { commands: 0, byType: {}, results: { true: 0, false: 0, undefined: 0, threw: 0 }, thrown: [] };
    const types = ['move', 'attackMove', 'dir', 'attack', 'attackNearest', 'stop', 'recall', 'ping', 'cast', 'spell', 'buy', 'sell', 'levelUp', 'autoLevel', 'ward', 'potion',
      'capture', 'swap', 'evolve', 'regroup', 'monsterCast', 'monsterAttack', 'trainerSkill', 'bogus', null];
    const weird = [NaN, Infinity, -Infinity, -1, 0, 1e9, -1e9, 60, 7.5, 115, undefined, null, '12', {}];
    let k = 0;
    const r = (salt) => rand01(w, 9001 + k, salt, 77);
    const pick = (arr, salt) => arr[Math.floor(r(salt) * arr.length) % arr.length];
    const unitIds = () => w.unitList.length ? w.unitList[Math.floor(r(5) * w.unitList.length) % w.unitList.length].id : -1;
    for (let i = 0; i < n && w.winner === null; i++) {
      if (i % every === 0) {
        const trainers = w.champions;
        for (let j = 0; j < (opts.perTick || 2); j++, k++) {
          const tr = trainers[Math.floor(r(1) * trainers.length) % trainers.length]; if (!tr) continue;
          const type = pick(types, 2);
          const sane = r(3) < 0.6;
          const num = (salt) => sane ? 5 + r(salt) * 110 : pick(weird, salt);
          const cmd = { type, x: num(6), y: num(7), dx: sane ? r(8) * 2 - 1 : pick(weird, 8), dy: sane ? r(9) * 2 - 1 : pick(weird, 9),
            targetId: sane ? unitIds() : pick(weird, 10), slot: pick(['Q', 'W', 'E', 'R', 'D', 'F', 'a1', 'a2', 'X', undefined], 11),
            confirm: r(12) < 0.5, once: r(13) < 0.5, item: 'x', slotIndex: pick(weird, 14), on: true, kind: 'danger' };
          if (r(15) < 0.05) delete cmd.type;
          R.commands++; R.byType[String(type)] = (R.byType[String(type)] || 0) + 1;
          try { const v = w.command(tr.id, cmd); R.results[v === true ? 'true' : v === false ? 'false' : 'undefined']++; }
          catch (e) { R.results.threw++; if (R.thrown.length < 10) R.thrown.push({ t: +w.time.toFixed(1), cmd: JSON.stringify(cmd).slice(0, 200), err: String(e && e.stack || e).slice(0, 300) }); }
        }
      }
      try { w.tick(); } catch (e) { R.results.threw++; if (R.thrown.length < 10) R.thrown.push({ t: +w.time.toFixed(1), where: 'tick', err: String(e && e.stack || e).slice(0, 300) }); break; }
    }
    return R;
  }

  // ------------------------------------------------------------------------------------------ rule audit
  /**
   * Install in-match DESIGN rule checks (independent re-computation from mt/data, not from the sim modules):
   * evolve level gates (§8), level cap (§7), capture only wild non-boss (§6), trainer respawn timer (§3), faint
   * timer (§11), trainer max HP from avg party level (§3), type multiplier on pet-vs-monster damage (§4).
   * Returns {report(): {checks, violations[]}}.
   */
  function audit() {
    if (mt._qaAudit) return mt._qaAudit;
    const A = { checks: {}, violations: [] };
    const ok = (k) => { A.checks[k] = (A.checks[k] || 0) + 1; };
    const bad = (k, d) => { ok(k); if (A.violations.length < 40) A.violations.push({ rule: k, t: +w.time.toFixed(1), ...d }); };
    const near = (a, b, eps = 0.05) => Math.abs(a - b) <= eps;
    mt.on('postTick', () => {
      for (const e of w.events) {
        if (e.type === 'mt_evolve') {
          const tr = w.units.get(e.trainer), f = FORMS[e.from];
          const rec = tr && tr.mtTrainer && tr.mtTrainer.party.find((r) => r.form === e.to);
          if (!f || !rec) continue;
          if (rec.level < f.evolveLevel) bad('evolve_level', { from: e.from, level: rec.level, need: f.evolveLevel }); else ok('evolve_level');
          if (FORMS[e.to].stage !== f.stage + 1 || FORMS[e.to].line !== f.line) bad('evolve_chain', { from: e.from, to: e.to }); else ok('evolve_chain');
        } else if (e.type === 'mt_level_up') {
          if (!(e.level >= 2 && e.level <= XP.maxLevel)) bad('level_cap', { level: e.level }); else ok('level_cap');
        } else if (e.type === 'mt_capture_start') {
          const u = w.units.get(e.target);
          if (u && (!u.mtMon || u.mtMon.ownerId >= 0 || u.epic)) bad('capture_target', { target: e.target, name: u.name }); else ok('capture_target');
        }
      }
      if (w.tickNo % 30 === 0) for (const c of w.champions) {
        const T = c.mtTrainer; if (!T || !c.alive || c.statsDirty) continue;
        const avg = T.party.length ? T.party.reduce((a, r) => a + r.level, 0) / T.party.length : 0;
        const want = (TRAINER.hp + TRAINER.hpPerAvgLevel * avg) * (T.spec === 'healing' ? 1 + SPECS.healing.passive.trainerHp : 1) * (mt.rules ? (mt.rules.trainerHpMult || mt.rules.hpMult)(c) : 1);
        // party levels can change in a postTick hook that runs after trainers' upkeep: only flag a mismatch that persists
        const mis = Math.abs(c.maxHp - want) > 1 && !c.buffs.some((b) => b.stats && (b.stats.maxHpBonus || b.stats.hp));
        const prev = (A.hpMis || (A.hpMis = {}))[c.id];
        A.hpMis[c.id] = mis ? want : null;
        if (mis && prev != null && Math.abs(prev - want) < 1e-6) bad('trainer_max_hp', { id: c.id, maxHp: +c.maxHp.toFixed(1), want: +want.toFixed(1), avg }); else ok('trainer_max_hp');
      }
    });
    mt.on('kill', (mt, victim) => {
      if (victim.mtTrainer) {
        const avg = victim.mtTrainer.party.length ? victim.mtTrainer.party.reduce((a, r) => a + r.level, 0) / victim.mtTrainer.party.length : 0;
        const want = Math.min(TRAINER.respawn.max, TRAINER.respawn.base + TRAINER.respawn.perAvgLevel * avg) * (mt.rules ? mt.rules.respawnMult(victim) : 1);
        if (!near(victim.respawnAt - w.time, want, 0.1)) bad('trainer_respawn', { got: +(victim.respawnAt - w.time).toFixed(2), want: +want.toFixed(2) }); else ok('trainer_respawn');
      } else if (victim.mtMon && victim.mtMon.ownerId >= 0 && victim.mtMon.rec) {
        const r = victim.mtMon.rec, want = (FAINT.base + FAINT.perLevel * r.level) * (mt.rules ? mt.rules.faintMult() : 1);
        if (!near(r.faintUntil - w.time, want, 0.1)) bad('faint_timer', { got: +(r.faintUntil - w.time).toFixed(2), want: +want.toFixed(2), level: r.level }); else ok('faint_timer');
      }
    });
    const dead = (team, kind, lane, tier) => w.structures.some((x) => x.team === team && x.kind === kind && (lane == null || x.lane === lane) && (tier == null || x.tier === tier) && !x.alive);
    const allDead = (team, kind, lane) => w.structures.filter((x) => x.team === team && x.kind === kind && (lane == null || x.lane === lane)).every((x) => !x.alive);
    mt.on('damage', (mt, src, tgt, amount) => {   // DESIGN §10 structure order
      if (!tgt || !(amount > 0) || !mt.L.isStructure(tgt)) return;
      const T = tgt.team, L = tgt.lane;
      let need = null;
      if (tgt.kind === KIND.TOWER && L !== 'base' && tgt.tier > 1 && !dead(T, KIND.TOWER, L, tgt.tier - 1)) need = L + ' tier ' + (tgt.tier - 1);
      else if (tgt.kind === KIND.INHIBITOR && !dead(T, KIND.TOWER, L, 3)) need = L + ' tier 3';
      else if (tgt.kind === KIND.TOWER && L === 'base' && !dead(T, KIND.INHIBITOR)) need = 'an inhibitor';
      else if (tgt.kind === KIND.NEXUS && (!allDead(T, KIND.TOWER, 'base') || !dead(T, KIND.INHIBITOR))) need = 'base towers + an inhibitor';
      if (need) bad('structure_order', { target: tgt.kind + ':' + L + ':' + tgt.tier, team: T, need, by: src ? src.name : null }); else ok('structure_order');
    });
    mt.on('damage', (mt, src, tgt, amount, type, source, mult) => {
      if (!src || !src.mtMon || !tgt || !tgt.mtMon || !(mult > 0)) return;
      const owner = src.mtMon.ownerId >= 0 ? w.units.get(src.mtMon.ownerId) : null;
      const strong = owner && owner.mtTrainer && owner.mtTrainer.spec === 'magic' ? SPECS.magic.passive.strong : STRONG;
      const want = typeMultiplier(src.mtMon.types[0], tgt.mtMon.types, strong);
      if (!near(mult, want, 1e-6)) bad('type_mult', { src: src.name, tgt: tgt.name, got: mult, want }); else ok('type_mult');
    });
    mt._qaAudit = { report: () => ({ checks: { ...A.checks }, violations: A.violations.slice() }) };
    return mt._qaAudit;
  }

  // ------------------------------------------------------------------------------------------ pacing (gameplay owner)
  /**
   * Pacing tracker (docs/BALANCE.md "Pacing"): per trainer, from now on —
   *   firstFight  first damage the trainer's MONSTER deals to a non-structure hostile (enemy minion / trainer / monster
   *               or a wild monster), s of match time (firstHit: same incl. the trainer's sling);
   *   firstPvp    first damage the trainer or its monster deals to an enemy trainer/monster;
   *   walkNoEnemy share of ALIVE time spent moving with no ENEMY-team trainer / monster / minion within `radius` (10 m)
   *               — "walking with nothing to do" (walkQuiet: wild monsters count as company too; quiet: moving or not);
   *   deaths, plus match length and trainer deaths per minute over every trainer.
   * Installs once per world (a second call returns the same tracker). report() is JSON-safe.
   */
  function pacing(opts = {}) {
    if (mt._qaPacing) return mt._qaPacing;
    const R = opts.radius || 10, R2 = R * R;
    const P = new Map();   // trainer id -> stats
    const rec = (c) => { let s = P.get(c.id); if (!s) P.set(c.id, (s = { id: c.id, name: c.name, team: c.team, bot: !!c.bot, alive: 0, walk: 0, walkQuiet: 0, walkNoEnemy: 0, quiet: 0, firstHit: null, firstFight: null, firstPvp: null, deaths: 0, lx: c.x, ly: c.y })); return s; };
    const hostileTo = (team) => (o) => o.alive && !o.removed && o.team !== team && (o.kind === KIND.CHAMPION || o.kind === KIND.MINION || o.kind === KIND.MONSTER) &&
      !(o.mtMon && o.mtMon.capturing) && (o.team !== TEAM.NEUTRAL || !!o.mtMon || !!o.epic);
    const t0 = w.time;
    mt.on('postTick', () => {
      for (const c of w.champions) {
        if (!c.mtTrainer) continue;
        const s = rec(c);
        s.bot = !!c.bot;
        if (!c.alive) { s.lx = c.x; s.ly = c.y; continue; }
        s.alive++;
        const moved = (c.x - s.lx) * (c.x - s.lx) + (c.y - s.ly) * (c.y - s.ly) > 0.0004;   // > 2 cm this tick
        s.lx = c.x; s.ly = c.y;
        let near = false, enemy = false;
        const f = hostileTo(c.team);
        for (const o of w.unitList) {   // no grid query: strictly read-only
          if ((o.x - c.x) * (o.x - c.x) + (o.y - c.y) * (o.y - c.y) > R2 || !f(o)) continue;
          near = true; if (o.team !== TEAM.NEUTRAL) { enemy = true; break; }
        }
        if (moved) { s.walk++; if (!near) s.walkQuiet++; if (!enemy) s.walkNoEnemy++; }
        if (!near) s.quiet++;
      }
    });
    mt.on('damage', (mt, src, tgt, amount) => {
      if (!src || !tgt || !(amount > 0) || mt.L.isStructure(tgt)) return;
      const tr = src.mtTrainer ? src : src.mtMon && src.mtMon.ownerId >= 0 ? w.units.get(src.mtMon.ownerId) : null;
      if (tr && tr.mtTrainer && tgt.team !== tr.team && hostileTo(tr.team)(tgt)) {
        const s = rec(tr);
        if (s.firstHit == null) s.firstHit = +(w.time - t0).toFixed(1);
        if (s.firstFight == null && src !== tr) s.firstFight = +(w.time - t0).toFixed(1);   // a real fight = the MONSTER battles
        if (s.firstPvp == null && tgt.team !== TEAM.NEUTRAL && (tgt.mtTrainer || (tgt.mtMon && tgt.mtMon.ownerId >= 0))) s.firstPvp = +(w.time - t0).toFixed(1);
      }
    });
    mt.on('kill', (mt, victim) => { if (victim && victim.mtTrainer) rec(victim).deaths++; });
    const pct = (a, b) => (b > 0 ? +(100 * a / b).toFixed(1) : 0);
    mt._qaPacing = {
      report() {
        const min = Math.max(1e-6, (w.time - t0) / 60);
        const list = [...P.values()].map((s) => ({ id: s.id, name: s.name, team: s.team, bot: s.bot, firstHit: s.firstHit, firstFight: s.firstFight, firstPvp: s.firstPvp,
          walkNoEnemyPct: pct(s.walkNoEnemy, s.alive), walkQuietPct: pct(s.walkQuiet, s.alive), walkPct: pct(s.walk, s.alive), quietPct: pct(s.quiet, s.alive), deaths: s.deaths }));
        const avg = (k, l = list) => { const v = l.map((x) => x[k]).filter((x) => x != null); return v.length ? +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : null; };
        const deaths = list.reduce((a, s) => a + s.deaths, 0);
        const humans = list.filter((s) => !s.bot);
        return { matchMin: +min.toFixed(2), trainerDeaths: deaths, deathsPerMin: +(deaths / min).toFixed(2),
          all: { firstHit: avg('firstHit'), firstFight: avg('firstFight'), firstPvp: avg('firstPvp'), walkNoEnemyPct: avg('walkNoEnemyPct'), walkQuietPct: avg('walkQuietPct'), quietPct: avg('quietPct') },
          humans: humans.length ? { firstHit: avg('firstHit', humans), firstFight: avg('firstFight', humans), firstPvp: avg('firstPvp', humans), walkNoEnemyPct: avg('walkNoEnemyPct', humans), walkQuietPct: avg('walkQuietPct', humans), quietPct: avg('quietPct', humans), deathsPerMin: +(humans.reduce((a, s) => a + s.deaths, 0) / humans.length / min).toFixed(2) } : null,
          trainers: list };
      },
    };
    return mt._qaPacing;
  }

  return { run, newAcc, countEvents, invariants, stateHash, fuzz, audit, pacing, human: (t, opts) => startHuman(mt, D, U(t), opts), masher: (t) => startMasher(mt, U(t)) };
}

// ============================================================================================= casual "masher" (gameplay owner)
/**
 * A first-time casual touch player (docs/PLAYTEST.md #4): every 0.5 s — EVOLVE as soon as the button lights up (for the
 * active or the benched monster); throw
 * the orb when the guide says catch and the target is weak (< 40 % HP) within 9.5 m; mash ATTACK + the move buttons on the
 * nearest enemy trainer / monster / minion within 7.5 m (on a wild one / the pushed tower only when the guide points at
 * it), potion when the monster is under 35 %; otherwise walk (joystick `dir`) toward the guide's target, else the nearest
 * enemy structure. Never recalls, swaps or uses the trainer skill. Only world.command, pure function of sim state.
 * report(): {deaths, kills, assists, monKOs, captures, firstCatch, evolves, firstEvolve, throws, ...}.
 */
function startMasher(mt, me) {
  const w = mt.world;
  if (!me || !me.mtTrainer) throw new Error('qa.masher: not a trainer');
  me.bot = false;
  const C = { deaths: 0, monKOs: 0, captures: 0, firstCatch: null, evolves: 0, firstEvolve: null, throws: 0, casts: 0, potions: 0, evolveCmds: 0, guide: {} };
  const cmd = (c) => w.command(me.id, c);
  const STRUCT = new Set([KIND.TOWER, KIND.INHIBITOR, KIND.NEXUS]);
  C.deathBy = {};
  mt.on('kill', (mt, victim, killer) => {
    if (victim !== me) return;
    C.deaths++;
    const k = !killer ? 'other' : killer.kind === KIND.TOWER ? 'tower' : killer.kind === KIND.MINION ? 'minion' : killer.mtMon ? (killer.mtMon.ownerId >= 0 ? 'monster' : 'wild') : killer.mtTrainer ? 'trainer' : killer.kind || 'other';
    C.deathBy[k] = (C.deathBy[k] || 0) + 1;
  });
  mt.on('postTick', () => {
    for (const e of w.events) {
      if (e.type === 'mt_capture_success' && e.trainer === me.id) { C.captures++; if (C.firstCatch == null) C.firstCatch = +w.time.toFixed(1); }
      else if (e.type === 'mt_evolve' && e.trainer === me.id) { C.evolves++; if (C.firstEvolve == null) C.firstEvolve = +w.time.toFixed(1); }
      else if (e.type === 'mt_faint' && e.trainer !== me.id && e.killer >= 0) {
        const k = w.units.get(e.killer);
        if (k && (k === me || (k.mtMon && k.mtMon.ownerId === me.id))) C.monKOs++;
      }
    }
  });
  mt.on('preTick', () => {
    if ((w.tickNo + me.id) % 15 !== 0 || !me.alive) return;
    mt.guard('qa-masher', () => {
      const T = me.mtTrainer, rec = T.activeIdx >= 0 ? T.party[T.activeIdx] : null;
      const pet = rec && rec.unitId >= 0 ? w.units.get(rec.unitId) : null, petUp = !!(pet && pet.alive && !pet.removed);
      if (petUp && pet.mtMon.evolving) return;
      const g = guideFor(w, me.id);
      if (g) C.guide[g.id] = (C.guide[g.id] || 0) + 0.5;
      // EVOLVE lights up -> tap it (the active monster, else the benched one: the same button evolves it in its orb)
      const bench = T.party.find((r, i) => i !== T.activeIdx && !r.fainted && !r.evolving && evolveReady(r));
      if ((petUp && rec && evolveReady(rec)) || (bench && !(rec && rec.evolving))) { C.evolveCmds++; if (cmd({ type: 'evolve' })) return; }
      // catch on cue
      const gt = g && g.targetId >= 0 ? w.units.get(g.targetId) : null;
      if (g && g.id === 'catch' && gt && isCapturable(gt) && (g.now || gt.hp / gt.maxHp < 0.4) && dist(me.x, me.y, gt.x, gt.y) < 9.5 && w.time >= T.cdEnd.capture) {
        cmd({ type: 'dir', dx: 0, dy: 0 }); if (cmd({ type: 'capture', targetId: gt.id, confirm: true })) { C.throws++; return; }
      }
      // what is near
      let enemy = null, ed = 7.5, wild = null, wd = 7, tower = null, td = 9;
      for (const o of w.unitList) {
        if (!o.alive || o.removed || o === me || o === pet) continue;
        const d = dist(me.x, me.y, o.x, o.y); if (d > 12) continue;
        if (o.team === TEAM.NEUTRAL) { if (o.mtMon && !o.mtMon.capturing && d < wd) { wd = d; wild = o; } continue; }
        if (o.team === me.team) continue;
        if (STRUCT.has(o.kind)) { if (d < td) { td = d; tower = o; } continue; }
        if ((o.kind === KIND.CHAMPION || o.kind === KIND.MINION || o.kind === KIND.MONSTER) && !(o.visible && o.visible[me.team] === false) && d < ed) { ed = d; enemy = o; }
      }
      const tg = enemy || (wild && g && g.id === 'catch' ? wild : null) || (tower && g && g.id === 'push' ? tower : null);
      if (tg) {
        cmd({ type: 'dir', dx: 0, dy: 0 });
        if (!cmd({ type: 'monsterAttack', targetId: tg.id })) cmd({ type: 'attack', targetId: tg.id });   // touch ATTACK: the monster, else the sling
        if (rec && petUp) for (const s of ['a1', 'a2']) if ((rec.cds[s] || 0) <= w.time && hasAbility(rec, s) && cmd({ type: 'monsterCast', slot: s, targetId: tg.id, x: tg.x, y: tg.y })) { C.casts++; break; }
        if (petUp && pet.hp / pet.maxHp < 0.35 && w.time >= T.cdEnd.potion && cmd({ type: 'potion' })) C.potions++;
        return;
      }
      let tx = null, ty = null;
      if (g && g.id !== 'respawn') { tx = g.x; ty = g.y; }
      else {
        let bd = 1e9;
        for (const s of w.structures) { if (!s.alive || s.team === me.team || s.team === TEAM.NEUTRAL) continue; const d = dist(me.x, me.y, s.x, s.y); if (d < bd) { bd = d; tx = s.x; ty = s.y; } }
      }
      if (tx != null) { const dx = tx - me.x, dy = ty - me.y, d = Math.hypot(dx, dy); cmd(d > 2.5 ? { type: 'dir', dx: dx / d, dy: dy / d } : { type: 'dir', dx: 0, dy: 0 }); }
    });
  });
  C.report = () => ({ trainer: me.id, team: me.team, won: w.winner === null ? null : w.winner === me.team, time: +w.time.toFixed(1), deaths: C.deaths, deathBy: { ...C.deathBy }, kills: me.kills || 0, assists: me.assists || 0, monKOs: C.monKOs,
    captures: C.captures, firstCatch: C.firstCatch, evolves: C.evolves, firstEvolve: C.firstEvolve, throws: C.throws, casts: C.casts, potions: C.potions,
    guide: Object.fromEntries(Object.entries(C.guide).map(([k, v]) => [k, +v.toFixed(1)])), party: me.mtTrainer.party.map((r) => r.form + r.level).join('/') });
  return C;
}

// ============================================================================================= scripted human
const STAGES = ['capture', 'train', 'lane', 'fight', 'levelUp', 'evolve', 'tower', 'nexus'];

/**
 * Scripted human for one trainer (any slot; a bot slot is switched to bot=false). Thinks every 0.5 s in preTick and
 * only issues world.command(...) like a player would (move/attack/attackMove/stop/recall + mt commands).
 * opts: {trainLevel=2, trainUntil=200, lane=<the slot's role lane>}
 */
function startHuman(mt, D, me, opts = {}) {
  const w = mt.world;
  if (!me || !me.mtTrainer) throw new Error('qa.human: not a trainer');
  me.bot = false;
  // play the lane the bots expect this slot to cover (legacy role -> lane), like a human following the team plan
  const ROLE_LANE = { baron: 'top', mid: 'mid', duo: 'bot' };
  const R = mt.rules, roleLane = ROLE_LANE[me.role] || 'mid';
  // QUICK mode has one lane (mid): the human plays it (rules.js)
  const O = { trainLevel: 2, trainUntil: 200, lane: R && !R.laneActive(roleLane) ? R.lanes[0] : roleLane, ...opts };
  const team = me.team, enemy = 1 - team, fountain = FOUNTAINS[team];
  const C = {
    trainer: me.id, active: true, mode: null, stages: Object.fromEntries(STAGES.map((k) => [k, null])), timeline: [],
    counters: { throws: 0, captures: 0, captureFails: 0, denies: 0, evolveCmds: 0, deaths: 0, retreats: 0, recalls: 0, fightDmg: 0, minionDmg: 0,
      wildDmg: 0, structDmg: 0, enemyTowersDown: 0, ownTowersDown: 0, petKills: 0, potions: 0, skills: 0, casts: 0, maxLevel: 0 },
    petIds: new Set(), capTarget: -1, lastThink: -1, wasAlive: true, lastAction: '',
  };
  C.cap2Done = false;
  const mark = (k, extra) => { if (C.stages[k] == null) { C.stages[k] = +w.time.toFixed(1); C.timeline.push({ t: C.stages[k], stage: k, ...(extra || {}) }); } };
  const cmd = (c) => { C.lastAction = c.type; return w.command(me.id, c); };
  const isMine = (u) => u && u.mtMon && u.mtMon.ownerId === me.id;

  mt.on('damage', (mt, src, tgt, amount) => {
    if (!C.active || !isMine(src) || !tgt || !(amount > 0)) return;
    if (tgt.team === enemy && (tgt.kind === KIND.CHAMPION || (tgt.mtMon && tgt.mtMon.ownerId >= 0))) { C.counters.fightDmg += amount; mark('fight', { vs: tgt.name }); }
    else if (tgt.team === enemy && tgt.kind === KIND.MINION) { C.counters.minionDmg += amount; mark('lane'); }
    else if (tgt.team === enemy && mt.L.isStructure(tgt)) C.counters.structDmg += amount;
    else if (tgt.team === TEAM.NEUTRAL) C.counters.wildDmg += amount;
  });
  mt.on('kill', (mt, victim, killer) => {
    if (!C.active) return;
    if (isMine(killer)) C.counters.petKills++;
    if (victim === me) C.counters.deaths++;
    if (victim.kind === KIND.TOWER) {
      if (victim.team === enemy) { C.counters.enemyTowersDown++; mark('tower', { tower: victim.lane + victim.tier, by: killer ? killer.name : null }); }
      else C.counters.ownTowersDown++;
    }
    if (victim.kind === KIND.NEXUS && victim.team === enemy) mark('nexus', { by: killer ? killer.name : null });
  });
  mt.on('postTick', () => {
    if (!C.active) return;
    for (const e of w.events) {
      if (e.trainer !== me.id) continue;
      if (e.type === 'mt_capture_success') C.counters.captures++;
      else if (e.type === 'mt_capture_fail') C.counters.captureFails++;
      else if (e.type === 'mt_deny') C.counters.denies++;
    }
  });
  mt.on('preTick', () => {
    if (!C.active) return;
    observe();
    if ((w.tickNo + me.id) % 15 === 0) mt.guard('qa-human', think);
  });

  function observe() {
    const T = me.mtTrainer;
    if (C.lv0 == null && T.party.length) C.lv0 = T.party[0].level;   // starting level (a starter begins above Lv 1)
    // 'capture' = a real capture (starter monsters exist since the playtest pass; the starter itself is not a capture)
    if (C.hadStarter == null && T.party.length) C.hadStarter = !!T.starter;
    if (C.counters.captures > 0 || (T.party.length && !C.hadStarter)) mark('capture', { form: T.party[T.party.length - 1].form });
    if (T.party.length >= 2 && C.secondCapture == null) C.secondCapture = +w.time.toFixed(1);
    for (const r of T.party) {
      if (r.level > C.counters.maxLevel) C.counters.maxLevel = r.level;
      if (r.level >= 2 && r.level > (C.lv0 || 1)) mark('levelUp', { level: r.level, form: r.form });
      if (FORMS[r.form] && FORMS[r.form].stage >= 1) mark('evolve', { form: r.form });
      if (r.unitId >= 0) C.petIds.add(r.unitId);
    }
    const rec = monsters.activeRecord(me);
    if ((C.stages.capture != null || C.hadStarter) && rec && (rec.xp > 0 || rec.level > Math.max(1, C.lv0 || 1))) mark('train', { level: rec.level });
    if (w.winner === team) mark('nexus');
  }

  function foesNear(r) {
    return w.queryUnits(me.x, me.y, r, (o) => o.alive && !o.removed && o.team === enemy && !o.untargetable &&
      o.visible && o.visible[team] !== false && (o.kind === KIND.CHAMPION || (o.mtMon && o.mtMon.ownerId >= 0)), []);
  }
  function moveTo(x, y, attack) { if (dist(me.x, me.y, x, y) > 1.5) cmd({ type: attack ? 'attackMove' : 'move', x, y }); }

  function think() {
    const T = me.mtTrainer, t = w.time;
    if (!me.alive) { C.wasAlive = false; C.mode = null; return; }
    if (!C.wasAlive) C.wasAlive = true;
    const rec = monsters.activeRecord(me), pet = monsters.activeUnit(mt, me);
    const hpF = me.hp / me.maxHp, dF = dist(me.x, me.y, fountain.x, fountain.y);
    const foes = foesNear(9.5);
    // --- heal at base after a retreat
    if (C.mode === 'heal') {
      const petOk = !pet || !pet.alive || pet.hp / pet.maxHp > 0.85;
      if (hpF > 0.95 && petOk && dF < 8) { C.mode = null; }
      else {
        if (me.recallStart != null) return;                       // channelling the recall
        if (dF > 7 && !foes.length && me.lastHitTime < t - 2) { cmd({ type: 'recall' }); C.counters.recalls++; return; }
        moveTo(fountain.x, fountain.y, false); return;
      }
    }
    // --- retreat
    const petGone = T.party.length && (!pet || !pet.alive) && !(monsters.benchRecord(me) && !monsters.benchRecord(me).fainted);
    if (hpF < 0.3 || (petGone && foes.length && dF > 20)) { C.mode = 'heal'; C.counters.retreats++; moveTo(fountain.x, fountain.y, false); return; }
    // --- 1. Capture (first monster)
    if (!T.party.length) { captureStep(); return; }
    // --- fainted active + healthy bench -> swap
    const bench = monsters.benchRecord(me);
    if (rec && rec.fainted && bench && !bench.fainted && !T.swap) cmd({ type: 'swap' });
    // --- Evolve as soon as it is ready and safe
    if (pet && pet.alive && rec && evolveReady(rec) && !pet.mtMon.evolving && !foes.length && pet.lastHitTime < t - 1.5) {
      if (cmd({ type: 'evolve' })) { C.counters.evolveCmds++; cmd({ type: 'stop' }); return; }
    }
    if (pet && pet.mtMon.evolving) return;
    // --- potion / skill
    if (pet && pet.alive && pet.hp / pet.maxHp < 0.4 && t >= T.cdEnd.potion && pet.lastHitTime > t - 3) { if (cmd({ type: 'potion' })) C.counters.potions++; }
    // --- Fight: enemy trainer/monster close and we have a healthy monster
    if (foes.length && pet && pet.alive && pet.hp / pet.maxHp > 0.3) {
      foes.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp || a.id - b.id);
      const f = foes[0];
      cmd({ type: 'monsterAttack', targetId: f.id });
      for (const slot of ['a1', 'a2']) {   // only press ready moves (a human sees the cooldown / lock on the HUD)
        if (!hasAbility(rec, slot) || t < (rec.cds[slot] || 0) || dist(pet.x, pet.y, f.x, f.y) > 8) continue;
        if (cmd({ type: 'monsterCast', slot, targetId: f.id, x: f.x, y: f.y })) { C.counters.casts++; break; }
      }
      if (t >= T.cdEnd.skill && cmd({ type: 'trainerSkill' })) C.counters.skills++;
      if (hpF > 0.5) cmd({ type: 'attack', targetId: f.id });
      else moveTo(me.x + (fountain.x - me.x) * 0.15, me.y + (fountain.y - me.y) * 0.15, false);
      return;
    }
    if (foes.length && (!pet || !pet.alive)) { moveTo(me.x + (fountain.x - me.x) * 0.25, me.y + (fountain.y - me.y) * 0.25, false); return; }
    // --- second monster (a human fills the bench once the first one can carry the fight): time-boxed 60 s
    if (T.party.length === 1 && rec && rec.level >= 4 && t < 600 && pet && pet.alive && pet.hp / pet.maxHp > 0.6 && hpF > 0.6 && !C.cap2Done) {
      // time-boxed 60 s windows, up to 3 (90 s apart): a player who starts with a monster still fills the bench
      if (C.cap2Until == null || (t > C.cap2Until + 90 && (C.cap2Tries || 0) < 3)) { C.cap2Until = t + 60; C.cap2Tries = (C.cap2Tries || 0) + 1; }
      if (t < C.cap2Until) { if (captureStep({ second: true, maxLevel: rec.level, pet })) return; }
      else if ((C.cap2Tries || 0) >= 3) C.cap2Done = true;
    }
    if (T.party.length >= 2) C.cap2Done = true;
    // --- Train: fight wild monsters until trainLevel
    if (rec && rec.level < O.trainLevel && t < O.trainUntil && pet && pet.alive) { if (trainStep(rec)) return; }
    // --- late game: group with the team like a player answering pings (bots group up and push together)
    if (t > (O.groupAfter ?? 840) && groupStep(pet)) return;
    // --- Lane: push our lane with the minions
    laneStep(pet);
  }

  /** returns true while it owns the trainer this think (first capture: always) */
  function captureStep(o2 = {}) {
    const T = me.mtTrainer, t = w.time, second = !!o2.second;
    let tgt = C.capTarget >= 0 ? w.units.get(C.capTarget) : null;
    if (tgt && tgt.mtMon && tgt.mtMon.capturing) return true;            // orb wobbling
    if (!tgt || !isCapturable(tgt)) {
      tgt = null; let bs = 1e9;
      const have = new Set(T.party.map((r) => FORMS[r.form].line));
      for (const o of w.queryUnits(me.x, me.y, second ? 40 : 70, isCapturable, [])) {
        const side = team === 0 ? o.x - o.y : o.y - o.x;
        if (side > 5 || !(o.visible && o.visible[team])) continue;
        if (second ? ((o.level || 1) > Math.min(o2.maxLevel, 4) || have.has(o.mtMon.line)) : (o.level || 1) > 2) continue;
        if (!second && !o.mtMon.meadow && t < 120) continue;  // a trainer alone only fights meadow juveniles early
        const s = dist(me.x, me.y, o.x, o.y) - (o.mtMon.meadow ? 15 : 0);
        if (s < bs) { bs = s; tgt = o; }
      }
      C.capTarget = tgt ? tgt.id : -1;
    }
    if (!tgt && second) return false;
    if (!tgt) {   // nothing visible: walk between our two starter meadows and wait for a respawn
      const ids = ['_meadow_a', '_meadow_b'].map((s) => (team === 0 ? 'blue' : 'red') + s);
      const m = w.campState.get(ids[Math.floor(t / 20) % 2]);
      if (m) moveTo(m.camp.x, m.camp.y, false);
      return;
    }
    const d = dist(me.x, me.y, tgt.x, tgt.y), frac = tgt.hp / tgt.maxHp;
    if (d <= CAPTURE.range - 0.5 && t >= T.cdEnd.capture && frac <= 0.4) {
      if (cmd({ type: 'capture', targetId: tgt.id, confirm: true })) { C.counters.throws++; cmd({ type: 'stop' }); if (o2.pet) cmd({ type: 'regroup' }); }
      return true;
    }
    if (frac <= (o2.pet ? 0.45 : 0.2)) {   // weak enough: stop hitting it (the pet would kill it) and wait for the orb
      if (me.order && me.order.type === 'attack') cmd({ type: 'stop' });
      if (o2.pet) cmd({ type: 'regroup' });
      if (d > CAPTURE.range - 1.5) moveTo(tgt.x, tgt.y, false);
      return true;
    }
    if (!me.order || me.order.type !== 'attack' || me.order.targetId !== tgt.id) cmd({ type: 'attack', targetId: tgt.id });
    if (o2.pet) cmd({ type: 'monsterAttack', targetId: tgt.id });
    return true;
  }

  function trainStep(rec) {
    let best = null, bs = 1e9;
    for (const o of w.queryUnits(me.x, me.y, 45, (o) => o.alive && o.mtMon && o.mtMon.ownerId < 0 && !o.mtMon.capturing && !o.untargetable, [])) {
      const side = team === 0 ? o.x - o.y : o.y - o.x;
      if (side > 8 || (o.level || 1) > rec.level + 1) continue;
      const s = dist(me.x, me.y, o.x, o.y);
      if (s < bs) { bs = s; best = o; }
    }
    if (!best) return false;
    if (!me.order || me.order.type !== 'attack' || me.order.targetId !== best.id) cmd({ type: 'attack', targetId: best.id });
    cmd({ type: 'monsterAttack', targetId: best.id });
    return true;
  }

  function laneTarget() {
    const S = (kind, lane, tier) => w.structures.find((s) => s.alive && s.team === enemy && s.kind === kind && (lane == null || s.lane === lane) && (tier == null || s.tier === tier));
    return S(KIND.TOWER, O.lane, 1) || S(KIND.TOWER, O.lane, 2) || S(KIND.TOWER, O.lane, 3) || S(KIND.INHIBITOR, O.lane) ||
      S(KIND.TOWER, 'base') || S(KIND.NEXUS) || w.structures.find((s) => s.alive && s.team === enemy) || null;
  }

  /** point `back` metres before (x,y) along our lane polyline, walking toward our base */
  function laneBack(x, y, back) {
    let pts = LANES[O.lane]; if (!pts) return null;
    if (team === 1) pts = pts.slice().reverse();
    const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + dist(pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y));
    let bs = 0, bd = 1e9;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i], L = cum[i] - cum[i - 1] || 1;
      const u = Math.max(0, Math.min(1, ((x - a.x) * (b.x - a.x) + (y - a.y) * (b.y - a.y)) / (L * L)));
      const d = dist(x, y, a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u);
      if (d < bd) { bd = d; bs = cum[i - 1] + u * L; }
    }
    const s = Math.max(0, bs - back);
    for (let i = 1; i < pts.length; i++) if (s <= cum[i]) { const a = pts[i - 1], b = pts[i], u = (s - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1); return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u }; }
    return pts[pts.length - 1];
  }

  function groupStep(pet) {
    const allies = w.champions.filter((c) => c !== me && c.alive && c.team === team);
    if (!allies.length) return false;
    let cx = 0, cy = 0; for (const a of allies) { cx += a.x; cy += a.y; } cx /= allies.length; cy /= allies.length;
    if (dist(cx, cy, fountain.x, fountain.y) < 25) return false;               // team is at base: keep laning
    if (dist(me.x, me.y, cx, cy) > 7) { moveTo(cx, cy, true); return true; }
    // with the team: hit the closest attackable enemy structure when minions/allies tank, else fight around them
    let best = null, bd = 1e9;
    for (const st of w.structures) { if (!st.alive || st.team !== enemy || st.invulnerable) continue; const d = dist(cx, cy, st.x, st.y); if (d < bd) { bd = d; best = st; } }
    if (best && bd < 14) {
      if (!me.order || me.order.type !== 'attack' || me.order.targetId !== best.id) cmd({ type: 'attack', targetId: best.id });
      if (pet && pet.alive) cmd({ type: 'monsterAttack', targetId: best.id });
    } else if (best) moveTo(cx + (best.x - cx) * 0.3, cy + (best.y - cy) * 0.3, true);
    return true;
  }

  function laneStep(pet) {
    const tgt = laneTarget(); if (!tgt) return;
    // farm the wave with ready moves, like a player pressing Q/W on a minion clump
    const rec = monsters.activeRecord(me);
    if (pet && pet.alive && rec) {
      const wave = w.queryUnits(pet.x, pet.y, 6.5, (o) => o.alive && o.team === enemy && o.kind === KIND.MINION, []);
      if (wave.length >= 2) {
        wave.sort((a, b) => a.hp - b.hp || a.id - b.id);
        for (const slot of ['a1', 'a2']) {
          if (!hasAbility(rec, slot) || w.time < (rec.cds[slot] || 0)) continue;
          if (cmd({ type: 'monsterCast', slot, targetId: wave[0].id, x: wave[0].x, y: wave[0].y })) { C.counters.casts++; break; }
        }
      }
    }
    const allies = w.queryUnits(tgt.x, tgt.y, 10, (o) => o.alive && o.team === team && (o.kind === KIND.MINION || (o.kind === KIND.CHAMPION && o !== me)), []).length;
    const enemyMinions = w.queryUnits(me.x, me.y, 7, (o) => o.alive && o.team === enemy && o.kind === KIND.MINION, []).length;
    const push = allies >= 2 || (tgt.kind === KIND.NEXUS && allies >= 1);
    if (push) {
      if (dist(me.x, me.y, tgt.x, tgt.y) < 7.5 && !enemyMinions) {
        if (!me.order || me.order.type !== 'attack' || me.order.targetId !== tgt.id) cmd({ type: 'attack', targetId: tgt.id });
        if (pet && pet.alive) cmd({ type: 'monsterAttack', targetId: tgt.id });
      } else moveTo(tgt.x, tgt.y, true);
      return;
    }
    // hold outside tower range on our lane (toward our base) and farm the wave there
    let hx, hy;
    const hp = tgt.lane === O.lane ? laneBack(tgt.x, tgt.y, 11) : null;
    if (hp) { hx = hp.x; hy = hp.y; }
    else { const dx = fountain.x - tgt.x, dy = fountain.y - tgt.y, L = Math.hypot(dx, dy) || 1; hx = tgt.x + (dx / L) * 11; hy = tgt.y + (dy / L) * 11; }
    if (dist(me.x, me.y, hx, hy) > 2.5 || !enemyMinions) moveTo(hx, hy, true);
  }

  C.report = () => {
    const T = me.mtTrainer;
    if (w.winner === team) mark('nexus');
    // a lost match is a legitimate outcome: then "tower"/"nexus" are not required (the enemy destroyed ours); a time cap is not
    const lost = w.winner !== null && w.winner !== team;
    const missing = STAGES.filter((k) => C.stages[k] == null && !((k === 'nexus' || k === 'tower') && lost));
    const S = C.stages, order = [];
    if (!C.hadStarter) for (const k of STAGES.slice(1)) if (S[k] != null && S.capture != null && S[k] < S.capture) order.push(k + ' before capture');
    if (S.evolve != null && S.levelUp != null && S.evolve < S.levelUp) order.push('evolve before levelUp');
    if (S.nexus != null && S.tower != null && S.nexus < S.tower) order.push('nexus before tower');
    return {
      trainer: me.id, name: me.name, team, spec: T.spec, lane: O.lane, time: +w.time.toFixed(1), winner: w.winner, outcome: w.winner === null ? 'none' : lost ? 'lost' : 'won',
      stages: { ...C.stages }, missing, orderErrors: order, timeline: C.timeline.slice(),
      counters: Object.fromEntries(Object.entries(C.counters).map(([k, v]) => [k, typeof v === 'number' ? +v.toFixed(0) : v])),
      party: T.party.map((r) => ({ form: r.form, level: r.level, fainted: r.fainted })), secondCapture: C.secondCapture ?? null, mode: C.mode, lastAction: C.lastAction,
    };
  };
  C.stop = () => { C.active = false; };
  return C;
}
