// mt/sim/debug.js — deterministic test/debug helpers: `world.mt.debug` (also `window.__moba.mt.debug`,
// which always points at the CURRENT world's helpers). Owner: architecture / QA. Additive edits welcome.
//
//   debug.setup(name, {fresh=true, seed})   scenario fixtures: 'laning'|'jungle'|'teamfight'|'siege'|'base'|'evolution'|'capture'
//   debug.advance(seconds)                  run the sim synchronously (no rendering)
//   debug.give(trainer, form, level, opts)  give a monster (deploys if nothing is deployed)
//   debug.setLevel(trainer, level)          set the active monster's level
//   debug.player() / trainers(team?)        units
//   debug.camera(x, y)                      move the camera (free mode); debug.follow() returns to follow mode
//   debug.summary()                         compact match state for harnesses (JSON-safe)

import { LINES, LINE_IDS, FORMS } from '../data/species.js';
import { XP } from '../data/balance.js';
import { KIND } from './util.js';
import * as monsters from './monsters.js';
import * as progression from './progression.js';
import * as capture from './capture.js';
import { makeQA } from './qa.js'; // QA harness helpers (owner: QA): debug.qa.{run, invariants, stateHash, human}

export function install(mt) { mt.debug = makeDebug(mt); mt.debug.qa = makeQA(mt, mt.debug); }

const appRef = () => (typeof globalThis !== 'undefined' ? globalThis.__moba : null);

function formAt(line, stage) { return LINES[line].forms[Math.min(2, Math.max(0, stage))].id; }
function stageFor(level) { return level >= 10 ? 2 : level >= 5 ? 1 : 0; }

function makeDebug(mt) {
  const w = mt.world;
  const U = (t) => (typeof t === 'object' ? t : w.units.get(t));
  const trainers = (team) => w.champions.filter((c) => c.mtTrainer && (team == null || c.team === team));
  const player = () => { const a = appRef(); return (a && a.world === w && w.units.get(a.playerId)) || w.playerUnit(0); };
  const structure = (team, kind, lane, tier) => w.structures.find((s) => s.team === team && s.kind === kind && (lane == null || s.lane === lane) && (tier == null || s.tier === tier));

  const D = {
    advance(seconds) { w.debug.advance(seconds); return w.time; },
    player, trainers,
    give(t, form, level = 1, opts = {}) { const tr = U(t); if (!tr || !tr.mtTrainer) return null; return monsters.giveMonster(mt, tr, form, level, opts); },
    setLevel(t, level) {
      const tr = U(t), rec = monsters.activeRecord(tr); if (!rec) return null;
      rec.level = Math.max(1, Math.min(XP.maxLevel, level | 0)); rec.xp = 0;
      const u = monsters.unitOf(mt, rec); if (u) { u.level = rec.level; monsters.refreshMonsterStats(mt, u); u.hp = u.maxHp; }
      return rec;
    },
    teleport(t, x, y) {
      const u = U(t); if (!u) return;
      w.debug.teleport(u, x, y);
      const pet = u.mtTrainer ? monsters.activeUnit(mt, u) : null;
      if (pet) w.debug.teleport(pet, x - 1, y + 1);
    },
    /** Give every trainer of `team` (or all) a party: one monster per trainer (lines rotate), optional second. */
    equip(team, level, opts = {}) {
      const st = opts.stage ?? stageFor(level);
      trainers(team).forEach((tr, i) => {
        if (tr.mtTrainer.party.length) return;
        const line = LINE_IDS[(i * 2 + tr.team * 3 + (opts.offset || 0)) % LINE_IDS.length];
        monsters.giveMonster(mt, tr, formAt(line, st), level, { deploy: true });
        if (opts.bench) monsters.giveMonster(mt, tr, formAt(LINE_IDS[(LINE_IDS.indexOf(line) + 3) % 6], st), Math.max(1, level - 1), { deploy: false });
      });
    },
    /** Grant `amount` XP to a trainer's active monster through the real XP path (bench trickle, level-up/evolve events). */
    xp(t, amount, opts = {}) {
      const tr = U(t), rec = opts.bench ? monsters.benchRecord(tr) : monsters.activeRecord(tr); if (!rec) return null;
      progression.grantXp(mt, tr, rec, amount, !opts.bench, { source: 'debug' });
      return { form: rec.form, level: rec.level, xp: rec.xp };
    },
    /** Capture chance of a wild unit right now (DESIGN §6) or null. */
    chance(id) { const u = U(id); return u && u.mtMon && u.mtMon.ownerId < 0 ? +capture.captureChance(u, w.time).toFixed(3) : null; },
    /** Party snapshot of a trainer (same data as the mt_party event). */
    party(t) { const tr = U(t); return tr && tr.mtTrainer ? monsters.partySnapshot(mt, tr) : null; },
    /** mt log entries (optionally filtered by type prefix) since sim time t0. */
    events(prefix = 'mt_', t0 = 0) { return mt.log.filter((e) => e.t >= t0 && String(e.type).startsWith(prefix)); },
    camera(x, y) { const a = appRef(); const rig = a && a.pipeline && a.pipeline.cameraRig; if (rig) { rig.mode = 'free'; rig.setFocus(x, y, true); } },
    follow() { const a = appRef(); const rig = a && a.pipeline && a.pipeline.cameraRig; if (rig) rig.mode = 'follow'; },
    setup(name, opts = {}) {
      const a = appRef();
      if (opts.fresh !== false && a && a.world === w && a.newMatch) {
        a.newMatch({ seed: opts.seed ?? 7, players: opts.players || (a.mt && a.mt.roster('trainer', null, { humans: opts.humans ?? 1 })) });
        return a.world.mt.debug.setup(name, { ...opts, fresh: false });
      }
      const S = SCENARIOS[name]; if (!S) throw new Error('unknown mt scenario ' + name + ' (have: ' + Object.keys(SCENARIOS).join(', ') + ')');
      const info = S(mt, D, { structure, player }) || {};
      w.markMoved(); w.updateVision();
      if (info.camera) D.camera(info.camera[0], info.camera[1]); else D.follow();
      return { scenario: name, time: +w.time.toFixed(1), ...info };
    },
    /**
     * VFX lab (added by the VFX owner): fresh quiet match (bots/waves off), then trigger one effect through REAL commands.
     * name: 'attack:<line>[:stage]' | 'a1:<line>[:stage]' | 'a2:<line>[:stage]' | 'capture' | 'capture:fail' | 'evolve[:line[:stage]]'
     *       | 'levelup' | 'faint' | 'swap' | 'summon' | 'skill:rally|mend|surge' | 'potion' | 'tower' | 'nexus'
     * opts: {vs: defender line (default = a line the attacker is super effective against), fresh}
     */
    fx(name, opts = {}) {
      const a = appRef();
      if (opts.fresh !== false && a && a.world === w && a.newMatch) {
        a.newMatch({ seed: opts.seed ?? 7, players: a.mt && a.mt.roster('trainer', null, { humans: 1 }) });
        return a.world.mt.debug.fx(name, { ...opts, fresh: false });
      }
      const info = fxLab(mt, D, { structure, player }, name, opts);
      w.markMoved(); w.updateVision();
      if (info.camera) D.camera(info.camera[0], info.camera[1]);
      return info;
    },
    /** Trainer-bot brains: each bot's goal, reasoning, top utility scores, recent actions + team calls (mt/ai). */
    botState() { return mt.trainerBot && mt.trainerBot.state ? mt.trainerBot.state() : null; },
    summary() {
      const byType = {};
      for (const e of mt.log) byType[e.type] = (byType[e.type] || 0) + 1;
      return {
        time: +w.time.toFixed(1), winner: w.winner,
        stats: JSON.parse(JSON.stringify(mt.stats)),
        events: byType,
        structures: [0, 1].map((t) => w.structures.filter((s) => s.team === t && s.alive).length),
        towersAlive: [0, 1].map((t) => w.structures.filter((s) => s.team === t && s.kind === KIND.TOWER && s.alive).length),
        trainers: trainers().map((c) => ({
          id: c.id, name: c.name, team: c.team, bot: c.bot, alive: c.alive, spec: c.mtTrainer.spec, role: c.role,
          party: c.mtTrainer.party.map((r) => ({ form: r.form, name: FORMS[r.form].name, level: r.level, fainted: r.fainted, kills: r.kills })),
        })),
        errors: Object.fromEntries(Object.entries(mt.errors).map(([k, v]) => [k, { count: v.count, last: v.last.slice(0, 300) }])),
      };
    },
  };
  return D;
}

// ------------------------------------------------------------------------------------------- scenarios
const SCENARIOS = {
  /** Trainer (no monster) next to a weakened starter-meadow juvenile: throw an orb (E / ○). */
  capture(mt, D) {
    const w = mt.world, p = D.player();
    const st = w.campState.get(p.team === 0 ? 'blue_meadow_a' : 'red_meadow_a');
    if (st && !st.unitIds.length) { st.respawnAt = w.time; w.debug.spawnCampNow(st.camp.id); }
    w.debug.advance(0.1);
    const wild = st && st.unitIds.length ? w.units.get(st.unitIds[0]) : null;
    if (wild) { wild.hp = wild.maxHp * 0.25; D.teleport(p, wild.x + 3.5, wild.y + 1); }
    return { target: wild ? wild.id : -1, form: wild ? wild.subtype : null, camera: wild ? [wild.x, wild.y] : null };
  },
  /** 2:00, everyone has a Lv 3 juvenile, player at a habitat. */
  jungle(mt, D) {
    const w = mt.world; w.debug.setTime(120); D.equip(null, 3);
    const camp = w.campState.get('blue_wolves'); const p = D.player();
    if (camp) { w.debug.spawnCampNow(camp.camp.id); D.teleport(p, camp.camp.x + 4, camp.camp.y + 2); }
    return {};
  },
  /** 1:30, everyone Lv 3, trainers walk their lanes (bots); player mid. */
  laning(mt, D) {
    const w = mt.world; w.debug.setTime(90); D.equip(null, 3, { bench: false });
    D.teleport(D.player(), 40, 80);
    return {};
  },
  /** 10:00, everyone Lv 7 evolved with a bench, both teams around mid river. */
  teamfight(mt, D) {
    const w = mt.world; w.debug.setTime(600); D.equip(null, 7, { bench: true });
    D.trainers(0).forEach((c, i) => D.teleport(c, 54 + i * 1.5, 66 - i));
    D.trainers(1).forEach((c, i) => D.teleport(c, 66 - i * 1.5, 54 + i));
    return { camera: [60, 60] };
  },
  /** 15:00, player team Lv 8 at red tier-1 mid tower with a minion wave. */
  siege(mt, D, h) {
    const w = mt.world; w.debug.setTime(900); D.equip(0, 8, { bench: true }); D.equip(1, 6);
    const t = h.structure(1, KIND.TOWER, 'mid', 1);
    D.trainers(0).forEach((c, i) => D.teleport(c, t.x - 6 + i, t.y + 6 - i));
    w.debug.spawnWaveNow();
    return { camera: [t.x - 3, t.y + 3], tower: t.id };
  },
  /** Red mid lane open down to the Nexus; player team Lv 11 Final forms at the red base. */
  base(mt, D, h) {
    const w = mt.world; w.debug.setTime(1500); D.equip(0, 11, { bench: true }); D.equip(1, 9);
    for (const tier of [1, 2, 3]) w.debug.destroyStructure(1, KIND.TOWER, 'mid', tier);
    w.debug.destroyStructure(1, KIND.INHIBITOR, 'mid');
    w.debug.destroyStructure(1, KIND.TOWER, 'base');
    const nx = h.structure(1, KIND.NEXUS);
    D.trainers(0).forEach((c, i) => D.teleport(c, nx.x - 7 + i, nx.y + 7 - i));
    return { camera: [nx.x - 4, nx.y + 4], nexus: nx.id };
  },
  /**
   * ZERO monsters, full-HP Lv 1 starter-meadow juvenile 4 m away: the trainer's sling must wear it down
   * (right-click it / attack command), then throw an orb (E / ○). Proves the very first capture needs no monster.
   */
  capture_sling(mt, D) {
    const w = mt.world, p = D.player();
    const st = w.campState.get(p.team === 0 ? 'blue_meadow_a' : 'red_meadow_a');
    if (st && !st.unitIds.length) { st.respawnAt = w.time; w.debug.spawnCampNow(st.camp.id); }
    w.debug.advance(0.1);
    const wild = st && st.unitIds.length ? w.units.get(st.unitIds[0]) : null;
    if (wild) D.teleport(p, wild.x + 3.5, wild.y + 1);
    // keep the other (bot) trainers off this meadow: they already own a monster and start in their lanes
    D.trainers().forEach((c, i) => { if (c === p) return; if (!c.mtTrainer.party.length) D.give(c, LINES[LINE_IDS[i % 6]].forms[0].id, 2, { deploy: true }); D.teleport(c, 60 + (c.team ? 8 : -8) + i, 60 - (c.team ? 8 : -8) - i); });
    return { target: wild ? wild.id : -1, form: wild ? wild.subtype : null, camera: wild ? [wild.x, wild.y] : null };
  },
  /** Party FULL (active Lv 4 + bench Lv 3) next to a weakened meadow juvenile: first E asks to replace the bench, second E throws. */
  capture_full(mt, D) {
    const w = mt.world, p = D.player();
    D.give(p, 'sparkit', 4, { deploy: true }); D.give(p, 'pebbit', 3, { deploy: false });
    const info = SCENARIOS.capture(mt, D);
    return { ...info, party: D.party(p).map((r) => r.name) };
  },
  /** Active Lv 4 (not ready) + BENCHED Lv 5 Puddlet (ready): T evolves the bench inside its orb; then swap (F) to see it. */
  evolution_bench(mt, D) {
    const w = mt.world, p = D.player(); w.debug.setTime(300);
    D.give(p, 'sproutle', 4, { deploy: true }); D.give(p, 'puddlet', 5, { deploy: false });
    D.teleport(p, p.team === 0 ? 22 : 98, p.team === 0 ? 98 : 22);
    return { party: D.party(p).map((r) => r.name + ' Lv' + r.level) };
  },
  /** Player's active monster at Lv 5 (evolve-ready: T / D-pad Up). */
  evolution(mt, D) {
    const w = mt.world, p = D.player(); w.debug.setTime(300);
    D.give(p, 'cindle', 5, { deploy: true });
    D.equip(null, 4);
    D.teleport(p, p.team === 0 ? 22 : 98, p.team === 0 ? 98 : 22);
    return {};
  },
  // ---- lane / structures / jungle fixtures (lane-systems owner, additive)
  /** 12:00, player team Lv 8 (+bench) in the river pit next to a freshly spawned Ancient Galeclaw. */
  boss(mt, D) {
    const w = mt.world; w.debug.setTime(720); D.equip(0, 8, { bench: true }); D.equip(1, 7);
    const st = w.campState.get('drake');
    if (st && !st.unitIds.length) { st.respawnAt = w.time; w.debug.spawnCampNow('drake'); }
    const boss = st && st.unitIds.length ? w.units.get(st.unitIds[0]) : null;
    const bx = boss ? boss.x : 85, by = boss ? boss.y : 85;
    D.trainers(0).forEach((c, i) => D.teleport(c, bx - 6 + i * 2, by + 5 - i));
    return { boss: boss ? boss.id : -1, camera: [bx - 2, by + 2] };
  },
  /** 8:00, player team Lv 6 diving the red Outer mid tower while a red trainer stands under it (tower aggro + ramp). */
  towerdive(mt, D, h) {
    const w = mt.world; w.debug.setTime(480); D.equip(null, 6, { bench: true });
    const t = h.structure(1, KIND.TOWER, 'mid', 1);
    D.trainers(1).forEach((c, i) => D.teleport(c, t.x + 1 + i, t.y - 2 - i));
    D.trainers(0).forEach((c, i) => D.teleport(c, t.x - 5 + i, t.y + 4 - i));
    return { camera: [t.x - 2, t.y + 2], tower: t.id };
  },
  /** 6:00, player with a Lv 4 juvenile at a two-monster habitat (wild AI: pack aggro, moves, leash/reset). */
  wild(mt, D) {
    const w = mt.world, p = D.player(); w.debug.setTime(360); D.equip(null, 4);
    const id = (p.team === 0 ? 'blue_' : 'red_') + 'stalkers', st = w.campState.get(id);
    if (st) {
      for (const uid of [...st.unitIds]) { const u = w.units.get(uid); if (u) w.removeUnit(u); }
      st.unitIds.length = 0; st.respawnAt = w.time; w.debug.spawnCampNow(id);
      D.teleport(p, st.camp.x + 5, st.camp.y + 2);
    }
    return { camp: id, wild: st ? st.unitIds.slice() : [], camera: st ? [st.camp.x + 2, st.camp.y + 1] : null };
  },
};

// ------------------------------------------------------------------------------------------- VFX lab (VFX owner, additive)
const FX_STRONG_VS = { fire: 'grass', water: 'fire', grass: 'water', electric: 'water', earth: 'electric', wind: 'grass' };
const FX_SPEC = { rally: 'attack', mend: 'healing', surge: 'magic' };
function fxLab(mt, D, h, name, o) {
  const w = mt.world, parts = String(name).split(':'), kind = parts[0];
  const line = LINES[parts[1]] ? parts[1] : 'fire', stage = Math.max(0, Math.min(2, +(parts[2] ?? (kind === 'evolve' ? 0 : 1)) || 0));
  w.debug.setBots(false); w.debug.setWaves(false); w.debug.clearMinions(); w.debug.setTime(o.time ?? 420);
  const p = D.player(), foe = D.trainers(1 - p.team)[0];
  if (kind === 'capture') {
    const info = SCENARIOS.capture(mt, D) || {}, wild = w.units.get(info.target);
    if (wild) { if (parts[1] === 'fail') { wild.hp = wild.maxHp; wild.level = 9; } else wild.hp = 1; w.command(p.id, { type: 'capture', targetId: wild.id }); }
    return { ...info, name };
  }
  if (kind === 'nexus') {
    const info = SCENARIOS.base(mt, D, h) || {};
    w.debug.setBots(false);
    const nx = w.units.get(info.nexus); if (nx) w.debug.destroyStructure(nx.team, KIND.NEXUS);
    return { ...info, name };
  }
  const t1 = h.structure(p.team, KIND.TOWER, 'mid', 1), t2 = h.structure(1 - p.team, KIND.TOWER, 'mid', 1);
  const lab = p.team === 0 ? [12, 95] : [108, 25];   // flat stone plaza by the starter meadow, out of tower range
  const cx = o.at != null ? t1.x + (t2.x - t1.x) * o.at : lab[0], cy = o.at != null ? t1.y + (t2.y - t1.y) * o.at : lab[1];
  for (const c of D.trainers()) if (c !== p && c !== foe) D.teleport(c, c.team === 0 ? 10 : 110, c.team === 0 ? 110 : 10);
  if (kind === 'tower') { w.debug.destroyStructure(1 - p.team, KIND.TOWER, 'mid', 1); return { name, camera: [t2.x, t2.y] }; }
  const lvl = stage >= 2 ? 11 : stage >= 1 ? 6 : 3;
  D.teleport(p, cx - 3.2, cy + 1.6); D.teleport(foe, cx + (o.at != null ? 4.2 : 1.5), cy + (o.at != null ? -2.2 : -4.8));
  const give = (tr, form, lv, deploy = true) => monsters.giveMonster(mt, tr, form, lv, { deploy });
  const place = () => {
    const pet = monsters.activeUnit(mt, p), tgt = monsters.activeUnit(mt, foe);
    if (pet) w.debug.teleport(pet, cx - 1.25, cy + 0.2);
    if (tgt) w.debug.teleport(tgt, cx + 1.25, cy - 0.2);
    return { pet, tgt };
  };
  const info = { name, camera: [cx, cy + 0.6] };
  if (!['attack', 'a1', 'a2', 'faint'].includes(kind)) D.teleport(foe, foe.team === 0 ? 10 : 110, foe.team === 0 ? 110 : 10);   // keep solo moments clean
  switch (kind) {
    case 'attack': case 'a1': case 'a2': {
      give(p, formAt(line, stage), lvl); give(foe, formAt(o.vs || FX_STRONG_VS[line], Math.min(stage, 1)), lvl);
      const { pet, tgt } = place(); if (!pet || !tgt) break;
      if (kind === 'attack') w.command(p.id, { type: 'monsterAttack', targetId: tgt.id });
      else w.command(p.id, { type: 'monsterCast', slot: kind, targetId: tgt.id, x: tgt.x, y: tgt.y });
      info.pet = pet.id; info.target = tgt.id; break;
    }
    case 'evolve': {
      give(p, formAt(line, stage), stage >= 1 ? 10 : 5); place();
      w.command(p.id, { type: 'evolve' }); break;
    }
    case 'levelup': give(p, formAt(line, stage), 3); place(); D.xp(p, 400); break;
    case 'faint': {
      give(p, formAt(line, stage), lvl); give(foe, formAt(FX_STRONG_VS[line], 1), lvl);
      const { pet, tgt } = place(); if (pet) mt.L.dealDamage(w, tgt, pet, pet.maxHp * 3, 'true', { source: 'debug' }); break;
    }
    case 'swap': give(p, formAt(line, stage), lvl); give(p, formAt(o.vs || 'water', stage), lvl, false); place(); p.mtTrainer.cdEnd.swap = 0; w.command(p.id, { type: 'swap' }); break;
    case 'summon': give(p, formAt(line, stage), lvl); place(); break;
    case 'skill': {
      give(p, formAt(line, stage), lvl); const { pet } = place(); if (pet) pet.hp = pet.maxHp * 0.5;
      p.mtTrainer.spec = FX_SPEC[parts[1]] || 'attack'; p.mtTrainer.cdEnd.skill = 0; w.command(p.id, { type: 'trainerSkill' }); break;
    }
    case 'potion': { give(p, formAt(line, stage), lvl); const { pet } = place(); if (pet) pet.hp = pet.maxHp * 0.4; p.mtTrainer.cdEnd.potion = 0; w.command(p.id, { type: 'potion' }); break; }
    default: throw new Error('unknown fx lab case ' + name);
  }
  return info;
}
