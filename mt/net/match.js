// mt/net/match.js — the online match config every peer builds its IDENTICAL world from. Owner: netplay. No DOM.
//
// The host publishes `go` in its game-room presence:
//   go = { mid: 'k3v6', seed: 12345, pl: [[peer, team, spec, look, name], ...] }   humans in slot order (≤ 6)
// and every peer (host included) calls app.newMatch({seed, players: netRoster(go)}) with deterministic Math installed.
// netRoster() mirrors sim/roster.js lobbyRoster() (humans per team in slot order, bots take the specs their team is
// missing, lanes top/mid/bot) but with CANONICAL names (bots: the English key, e.g. 'Rowan'; humans: their nickname),
// so the player list is byte-identical on every peer — display names are localised by i18n unitName() at draw time.

import { TEAM_SIZE, SPEC_IDS } from '../data/balance.js';
import { LANE_ROLES, BOT_NAMES, TRAINER_ID } from '../sim/roster.js';

export const MAX_HUMANS = TEAM_SIZE * 2;
const PEER_RE = /^[A-Za-z0-9_.:-]{1,64}$/;

/** a display nickname safe for presence (printable, no control / invisible characters), ≤ 12 characters */
export function cleanName(s, fallback = '') {
  // eslint-disable-next-line no-control-regex
  const t = String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f-\u009f\u00ad\u200b-\u200f\u2028-\u202e\u2060-\u2064\ufeff]/g, '').replace(/\s+/g, ' ').trim();
  return [...t].slice(0, 12).join('') || fallback;
}

/** validate an untrusted `go` object; null if unusable */
export function parseGo(go) {
  if (!go || typeof go !== 'object' || typeof go.mid !== 'string' || !/^[a-z0-9]{3,12}$/.test(go.mid)) return null;
  if (!Number.isInteger(go.seed) || go.seed < 0 || go.seed > 1e9) return null;
  if (!Array.isArray(go.pl) || !go.pl.length || go.pl.length > MAX_HUMANS) return null;
  const pl = [], peers = new Set(), perTeam = [0, 0];
  for (const e of go.pl) {
    if (!Array.isArray(e) || e.length < 4) return null;
    const [peer, team, spec, look, name] = e;
    if (typeof peer !== 'string' || !PEER_RE.test(peer) || peers.has(peer)) return null;
    if (team !== 0 && team !== 1) return null;
    if (++perTeam[team] > TEAM_SIZE) return null;
    if (!SPEC_IDS.includes(spec) || !SPEC_IDS.includes(look)) return null;
    peers.add(peer);
    pl.push({ peer, team, spec, look, name: cleanName(name, 'Player ' + (pl.length + 1)) });
  }
  return { mid: go.mid, seed: go.seed, pl };
}

/**
 * The full 3v3 roster (PlayerEntry[], see sim/roster.js) for a parsed config. Humans get `netSlot` (index in go.pl),
 * `bot: false` and NO device: the local binding is per peer (app.mtNetLocal, read by ui/input/localPlayers.js).
 */
export function netRoster(cfg) {
  const out = [];
  for (let team = 0; team < 2; team++) {
    const humans = cfg.pl.map((p, k) => ({ ...p, k })).filter((p) => p.team === team).slice(0, TEAM_SIZE);
    const used = humans.map((h) => h.spec);
    const missing = SPEC_IDS.filter((s) => !used.includes(s));
    let b = 0;
    for (let i = 0; i < TEAM_SIZE; i++) {
      const h = humans[i];
      if (h) out.push({ team, champion: TRAINER_ID, name: h.name, bot: false, role: LANE_ROLES[i], spec: h.spec, look: h.look, netSlot: h.k, device: null });
      else {
        const spec = missing.length ? missing.shift() : SPEC_IDS[(i + team + b) % SPEC_IDS.length];
        out.push({ team, champion: TRAINER_ID, name: BOT_NAMES[team][b % BOT_NAMES[team].length], bot: true, role: LANE_ROLES[i], spec, look: spec });
        b++;
      }
    }
  }
  return out;
}

/** host side: put every member on a team with room (≤ 3 per team), keeping their choice when possible */
export function balanceTeams(members) {
  const n = [0, 0], out = [];
  for (const m of members) {
    let t = m.team === 1 ? 1 : 0;
    if (n[t] >= TEAM_SIZE) t = 1 - t;
    if (n[t] >= TEAM_SIZE) continue;
    n[t]++; out.push({ ...m, team: t });
  }
  return out;
}

export function makeMid(rnd = Math.random) { let s = ''; for (let i = 0; i < 6; i++) s += 'abcdefghjkmnpqrstuvwxyz23456789'[Math.floor(rnd() * 31)]; return s; }
