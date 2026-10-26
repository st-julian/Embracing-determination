// mt/sim/events.js — event types emitted by mt sim code through `world.emit(type, payload)`.
// They travel with legacy events (`frame.events`, `world.events`); legacy consumers ignore unknown types.
// Owner: architecture. Add new names here (additive); payload contracts are documented per entry.
//
// ---------------------------------------------------------------------------------------------------------------
// Shared payload fragments (capture / party / progression events; emitted by capture.js, monsters.js,
// progression.js). Every such event also carries `team` (the trainer's team, 0/1) so a HUD can decide
// "mine / ally / enemy" without a unit lookup.
//
//   MonInfo  = { rid, form, name, line, stage, level, types[] }      a party monster (rid = stable record id)
//              (form = species form id: 'cindle' | 'pyrovix' | ...; stage 0 Juvenile, 1 Evolved, 2 Final)
//   x, y     = world ground position (metres, sim 2D; render height = heightAt(x, y))
//
// Timing fields are ABSOLUTE world times (`world.time`, seconds) unless named `duration`/`travel`.
// The capture orb sequence for one throw is:
//   mt_capture_throw -> (orb flies `travel` s) -> mt_capture_start (absorb) -> mt_capture_wobble n=1..3
//   -> mt_capture_success | mt_capture_fail          (or mt_capture_miss if the orb never reaches the target)
// ---------------------------------------------------------------------------------------------------------------

export const MT_EVENT = Object.freeze({
  /**
   * Capture orb thrown. {trainer, team, x, y, tx, ty, targetId, form, name, level, travel, landAt, arcHeight, orbId}
   * (x,y) trainer hand position, (tx,ty) target position at throw time; the orb is a legacy homing projectile
   * (`fx: 'mt_capture_orb'`, id = orbId) — renderers may lift it on a parabola of height `arcHeight` over `travel` s.
   */
  CAPTURE_THROW: 'mt_capture_throw',
  /**
   * Orb hit: the monster is absorbed into the orb (sprite: white flash + shrink into the orb; unit key becomes 'orb').
   * {trainer, team, target, form, name, level, x, y, firstWobbleAt, p}   p = hidden success chance (debug only, don't show)
   */
  CAPTURE_START: 'mt_capture_start',
  /** One orb wobble = one hidden roll. {trainer, team, target, form, name, n, x, y, nextAt}   n = 1..3 */
  CAPTURE_WOBBLE: 'mt_capture_wobble',
  /**
   * Gotcha! {trainer, team, target, x, y, wobbles: 3, slot: 'active'|'bench', first: bool (party was empty),
   *          replaced: MonInfo|null (benched monster released), ...MonInfo of the new party member}
   * Banner text: `Gotcha! ${name} was caught!`
   */
  CAPTURE_SUCCESS: 'mt_capture_success',
  /** Broke free: orb bursts, monster pops out angry. {trainer, team, target, form, name, level, x, y, wobbles, angryUntil} */
  CAPTURE_FAIL: 'mt_capture_fail',
  /** Orb never reached its target (it died / was caught by someone else / reset). Cooldown refunded. {trainer, team, targetId, x, y} */
  CAPTURE_MISS: 'mt_capture_miss',
  /**
   * HUD hint: a wild monster this trainer (or its pet) is fighting dropped low enough to be worth an orb.
   * Emitted once per (trainer, target). {trainer, team, target, form, name, level, x, y, chance, band:'ok'|'good'|'great'}
   */
  CAPTURE_READY: 'mt_capture_ready',
  /** {trainer, team, unit, rid, form, name, level, from:'capture'|'swap'|'respawn'|'auto'|'summon', x, y} pet deployed */
  SUMMON: 'mt_summon',
  /** {trainer, team, unit, rid, form, name, level, reason:'swap'|'trainer_dead'|'recall', x, y} pet returned to its orb */
  RECALL: 'mt_recall',
  /**
   * Swap started (the outgoing monster is recalled now; the incoming one is SUMMONed with from:'swap' at `until`).
   * {trainer, team, from: form|null, to: form, fromName, toName, fromRid, toRid, until, free: bool (active had fainted), x, y}
   */
  SWAP: 'mt_swap',
  /**
   * Evolution channel started. {trainer, team, unit (-1 when benched), rid, form, name, to, toName, level, t0, until,
   * duration, bench: bool, x, y}
   */
  EVOLVE_START: 'mt_evolve_start',
  /**
   * Evolution finished (a.k.a. "evolve_done"). The unit keeps its id (aggro, buffs, sprite view continuity); its form,
   * stats, size and moves change; HP %, level, XP and cooldowns are preserved.
   * {trainer, team, unit (-1 when benched), rid, from, to, name, fromName, level, stage, types, bench, unlocked:'a2'|null, x, y}
   * Banner text: `${fromName} evolved into ${name}!`
   */
  EVOLVE: 'mt_evolve',
  /** Same string as EVOLVE (alias for readers that think in "evolve_done"). */
  EVOLVE_DONE: 'mt_evolve',
  /** Channel interrupted; nothing is consumed (refund). {trainer, team, unit, rid, form, name, reason:'stunned'|'recalled'|'fainted'|'trainer_dead', refund:true, x, y} */
  EVOLVE_CANCEL: 'mt_evolve_cancel',
  /** A party monster just reached its evolution level. {trainer, team, unit, bench, to, toName, ...MonInfo} */
  EVOLVE_READY: 'mt_evolve_ready',
  /**
   * {trainer, team, unit (-1 benched), level, prevLevel, bench, xp, toNext, evolveReady, x, y, ...MonInfo}
   * (a legacy LEVEL_UP {id: unit, level} is emitted too when the monster is deployed)
   */
  LEVEL_UP: 'mt_level_up',
  /**
   * XP gained by one party monster. {trainer, team, unit (-1 benched), rid, form, name, amount, xp, toNext, level,
   * bench: bool (30 % trickle), source: 'minion'|'wild'|'boss'|'monster'|'trainer'|'tower', comeback: bool, x, y}
   */
  XP: 'mt_xp',
  /** {trainer, team, unit, rid, form, name, level, killer, killerName, until, duration, x, y} pet fainted (never lost) */
  FAINT: 'mt_faint',
  /** Faint timer over: the monster is usable again. {trainer, team, rid, form, name, level, bench} */
  REVIVE: 'mt_revive',
  /** Regroup: the active monster drops its target and runs back to the trainer. {trainer, team, unit, until, x, y} */
  REGROUP: 'mt_regroup',
  /**
   * Party changed (capture / release / evolve / swap / revive). Full snapshot for HUD portraits.
   * {trainer, team, reason, activeRid, party: [{...MonInfo, active, fainted, hpFrac, xp, toNext}]}
   */
  PARTY: 'mt_party',
  /**
   * A monster ability was cast (combat.js). {trainer (-1 = wild), unit, slot:'a1'|'a2', ability (AbilityDef.id), name,
   * kind (AbilityDef.kind), aim:'skillshot'|'ground'|'unit'|'self'|'dash', element (MonsterType of the caster),
   * x, y (caster), tx, ty (aim point, already target-led for skillshots), targetId, range, radius?, width?, count?,
   * delay?, upgraded (Final form), surged (Magic Surge consumed), manual (human force-cast), cast (per-world cast seq;
   * legacy `fx` events of the same cast carry the same `cast`)}
   */
  MONSTER_CAST: 'mt_monster_cast',
  /**
   * One damage instance dealt BY an mt monster (basic attacks, abilities, burns, fields, reflects) — emitted after the
   * legacy HIT. {src, tgt, trainer (owner of src, -1 wild), ability: 'basic'|AbilityDef.id|'burn'|'surge_field'|
   * 'thorn_bulwark'(reflect)|..., slot:'a1'|'a2'|null, element (MonsterType of src), eff:'super'|'weak'|null,
   * mult (type multiplier), amount (dealt incl. shield), dmgType, source:'attack'|'ability'|'dot'|'reflect'|'field',
   * ranged (basic attack was a projectile), x, y (target), sx, sy (source), kill (target died), cast (seq or 0)}
   */
  HIT: 'mt_hit',
  /**
   * A status effect landed (combat.js status helper; also trainer skills). {tgt, src, status:
   * 'stun'|'root'|'slow'|'knockup'|'pull'|'taunt'|'burn'|'shield'|'heal'|'buff'|'cleanse'|'surge', ability, duration,
   * power (slow fraction / shield / heal amount / buff id), x, y}
   */
  STATUS: 'mt_status',
  /**
   * Persistent ground field (Final Flame Pillar fire field, Final Static Dash charged trail, Magic Surge field).
   * {id, phase:'start'|'tick'|'end', ability, element, team, src, x, y, radius, x2?, y2? (segment fields: from x,y to
   * x2,y2 with half-width = radius), duration, until}
   */
  FIELD: 'mt_field',
  /** Team-wide buff. {team, buff:'galeclaw', until, duration, dmgPct, killer} (Ancient Galeclaw kill: +15 % dmg 90 s) */
  TEAM_BUFF: 'mt_team_buff',
  /** {trainer, skill:'rally'|'mend'|'surge', unit, duration, x, y} (+ mt_status on the monster/trainer) */
  TRAINER_SKILL: 'mt_trainer_skill',
  /** {trainer, unit} */
  POTION: 'mt_potion',
  /** {trainer, code, text} command refused (HUD feedback) */
  DENY: 'mt_deny',
  /**
   * Party full: press capture again within the window to replace the BENCHED monster.
   * {trainer, team, targetId, until, form, name, level (bench monster that would be released),
   *  targetForm, targetName, targetLevel}
   */
  CONFIRM_REPLACE: 'mt_confirm_replace',
  // ---- lane / structures / jungle (added by the lane-systems owner: minions.js, structures.js, jungle.js)
  /** {id, kind:'tower'|'inhibitor'|'nexus', team, lane, tier, x, y, radius, height, killer, killerTeam, killerName,
   *   shake:0..1 (camera-shake hint), debris:number (chunk count hint)} — a structure crumbled (crumble/debris/dust VFX) */
  STRUCTURE_DESTROYED: 'mt_structure_destroyed',
  /** {winner, loser, nexus, x, y, time, slowmo:{scale, duration}, teams:[{team, kills, towers, inhibitors, bosses}],
   *   trainers:[{id, name, team, kills, deaths, assists, party:[{form, level}]}], mtStats} — Nexus fell, match over
   *   (the sim stops ticking after this tick; slow-mo/explosion/VICTORY-DEFEAT are presentation only) */
  MATCH_END: 'mt_match_end',
  /** {tower, target, targetKind:'minion'|'monster'|'trainer', aggro:boolean, team, x, y} tower switched target (aggro = it is punishing a unit that hit an ally) */
  TOWER_TARGET: 'mt_tower_target',
  /** {team, waveNo, lanes:string[], siege:boolean, super:string[]} a minion wave started spawning */
  WAVE: 'mt_wave',
  /** {unit, x, y, tx, ty, radius, delay} river boss telegraphs its Gale Burst (burst follows after `delay`) */
  BOSS_GUST: 'mt_boss_gust',
  /**
   * (gameplay, rules.js) QUICK time limit. phase 'warn' once, 60 s before; phase 'end' when time is up and the match is
   * decided on points (the loser's Nexus falls right after: the normal mt_match_end follows).
   * {phase:'warn'|'end', at (absolute time of the limit), score:[blue, red], winner (end only)}
   */
  TIME_LIMIT: 'mt_time_limit',
  /**
   * (gameplay, rules.js) Easy / Normal player assists for a HUMAN trainer. kind 'rescue' (low HP: shield + haste),
   * 'guard' (respawn protection), 'potion' (the monster drank its potion by itself), 'credit' (a team-mate's kill was
   * credited to you: {victim}), 'hold' (your monster holds its attacks so you can throw an orb: {target, until}).
   * {trainer, team, kind, until?, victim?, target?, x, y}
   */
  ASSIST: 'mt_assist',
});
