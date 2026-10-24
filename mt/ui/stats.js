// mt/ui/stats.js — per-trainer match statistics accumulated from frame events (HUD/scoreboard/end screen only;
// never feeds back into the sim). Owner: HUD.

import { MT_EVENT as E } from '../sim/events.js';

export class MatchStats {
  constructor() { this.reset(null); }
  reset(world) { this.world = world; this.by = new Map(); this.teamKO = [0, 0]; this.firstFaint = false; }
  of(id) {
    let s = this.by.get(id);
    if (!s) this.by.set(id, s = { dmg: 0, taken: 0, captures: 0, evolutions: 0, monKOs: 0, faints: 0, healed: 0, best: null });
    return s;
  }
  /** unit id -> owning trainer id (pets -> owner, trainers -> self, others -> -1) */
  ownerOf(w, id) {
    const u = w.units.get(id); if (!u) return -1;
    if (u.mtTrainer) return u.id;
    if (u.mtMon && u.mtMon.ownerId >= 0) return u.mtMon.ownerId;
    return -1;
  }
  consume(f) {
    const w = f.world; if (!w) return;
    if (w !== this.world) this.reset(w);
    const evs = f.events || [];
    for (let i = 0; i < evs.length; i++) {
      const ev = evs[i];
      switch (ev.type) {
        case 'hit': {
          if (!(ev.amount > 0)) break;
          const s = this.ownerOf(w, ev.src); if (s >= 0) this.of(s).dmg += ev.amount;
          const t = this.ownerOf(w, ev.tgt); if (t >= 0) this.of(t).taken += ev.amount;
          break;
        }
        case 'heal': { const s = this.ownerOf(w, ev.src != null ? ev.src : ev.tgt); if (s >= 0 && ev.amount > 0) this.of(s).healed += ev.amount; break; }
        case E.CAPTURE_SUCCESS: this.of(ev.trainer).captures++; break;
        case E.EVOLVE: this.of(ev.trainer).evolutions++; break;
        case E.FAINT: {
          this.of(ev.trainer).faints++;
          const victimTeam = (w.units.get(ev.trainer) || {}).team;
          const k = this.ownerOf(w, ev.killer);
          if (k >= 0 && k !== ev.trainer) { this.of(k).monKOs++; const kt = w.units.get(k); if (kt && kt.team !== victimTeam) this.teamKO[kt.team]++; } else if (victimTeam === 0 || victimTeam === 1) this.teamKO[1 - victimTeam]++;
          break;
        }
      }
    }
  }
  /**
   * Team score = sum over the team's trainers of (trainer KOs + monster KOs) — exactly the per-row "KO" column of
   * the scoreboard / result table, so header and rows always agree (KOs by towers / minions / wild monsters credit
   * no trainer and are not counted, like executions in a MOBA).
   */
  score(w, team) {
    let n = 0;
    for (const u of w.champions || []) if (u.mtTrainer && u.team === team) n += (u.kills || 0) + this.of(u.id).monKOs;
    return n;
  }
}
