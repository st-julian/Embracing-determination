// mt/sim/roster.js — 3v3 rosters. Owner: lobby/UI specialist (shape) + architecture.
// The legacy `Tw(champion, names)` delegates to defaultRoster ([MT-HOOK] roster), so every legacy
// `newMatch({champion})` call (boot, debug fixtures) produces a 3v3 trainer match. The lobby (mt/ui/lobby.js) builds
// its list with lobbyRoster() and calls `__moba.newMatch({ seed, players })`.

import { TEAM_SIZE, SPEC_IDS } from '../data/balance.js';
import { trainerName } from '../i18n/index.js'; // trainer names shown in the current language (English in node/tests)

/** Lane roles understood by the legacy bot brain (`_E`: baron->top, mid->mid, duo->bot). */
export const LANE_ROLES = ['baron', 'mid', 'duo'];
export const TRAINER_ID = 'trainer';

/** Original trainer names (bots and the default roster). */
export const BOT_NAMES = [
  ['Rowan', 'Mira', 'Tobin', 'Juno', 'Pell'],
  ['Kestrel', 'Sable', 'Wren', 'Corin', 'Isla'],
];
const NAMES = [
  ['You', BOT_NAMES[0][0], BOT_NAMES[0][1]],
  [BOT_NAMES[1][0], BOT_NAMES[1][1], BOT_NAMES[1][2]],
];

/**
 * @typedef {Object} PlayerEntry  (legacy `world.players[i]` + mt fields)
 * @property {number} team 0|1
 * @property {string} champion always 'trainer'
 * @property {string} name
 * @property {boolean} bot
 * @property {string} role  'baron'|'mid'|'duo' (bot lane assignment)
 * @property {'attack'|'healing'|'magic'} spec
 * @property {'attack'|'healing'|'magic'} [look] trainer outfit (default = spec); copied to unit.mtLook by LocalPlayers
 * @property {string} [device] 'kbm' | 'pad:<index>' for local humans
 * @property {number} [localSlot] 0..3 = P1..P4 (local humans; keeps the lobby colour)
 * @property {string} [inputType] 'kbm'|'dualsense'|'dualshock'|'xbox'|'gamepad'
 * @property {string} [padId] Gamepad.id
 * @property {boolean} [wasd] keyboard local uses WASD movement
 * @property {string} [starter] starter monster: 'cindle' | 'puddlet' | 'sproutle' (mt/data/options.js STARTERS); omitted
 *   (or any other value) = picked deterministically from the match seed (team-mates' picks first, so a team shows varied
 *   starters); 'none' = no monster (tests / fixtures). Level = options.js STARTER_LEVEL.
 * @property {string} [starterForm] debug / tests only: start with this exact form id instead (any form)
 */

/**
 * @param {string} [_champion] ignored (legacy signature)
 * @param {string[][]} [names] [[team0 names],[team1 names]] (legacy signature; first name of team 0 = local human)
 * @param {{humans?:number, humanTeams?:number[], specs?:string[][], starters?:string[][]|false}} [opts]
 *   starters: per team / slot form ids, or `false` = nobody starts with a monster (fixtures)
 * @returns {PlayerEntry[]}
 */
export function defaultRoster(_champion, names, opts = {}) {
  const humans = opts.humans ?? 1;
  const out = [];
  for (let team = 0; team < 2; team++) {
    for (let i = 0; i < TEAM_SIZE; i++) {
      const human = team === 0 ? i < humans : false;
      const nm = (names && names[team] && names[team][i]) || NAMES[team][i];
      out.push({
        team, champion: TRAINER_ID, name: trainerName(!human && nm === 'You' ? 'Ace' : nm), // i18n: display name in the current language
        nameKey: !human && nm === 'You' ? 'Ace' : nm,   // canonical (English) key: display only, see trainers.js displayName
        bot: !human, role: LANE_ROLES[i % LANE_ROLES.length],
        spec: (opts.specs && opts.specs[team] && opts.specs[team][i]) || SPEC_IDS[(i + team) % SPEC_IDS.length],
        device: human ? (i === 0 ? 'kbm' : 'pad:' + (i - 1)) : undefined,
        localSlot: human ? i : undefined,
        starter: opts.starters === false ? 'none' : opts.starters && opts.starters[team] ? opts.starters[team][i] : undefined,
        starterForm: opts.starterForms && opts.starterForms[team] ? opts.starterForms[team][i] : undefined,
      });
    }
  }
  return out;
}

/**
 * @typedef {Object} LobbySlot
 * @property {number} slot 0..3 (P1..P4)
 * @property {string} device 'kbm' | 'pad:<index>'
 * @property {number} team 0|1
 * @property {'attack'|'healing'|'magic'} spec
 * @property {'attack'|'healing'|'magic'} look
 * @property {string} [name]
 * @property {string} [inputType]
 * @property {string} [padId]
 * @property {boolean} [wasd]
 * @property {string} [starter] starter pick ('cindle'|'puddlet'|'sproutle'); omitted = auto (see PlayerEntry.starter)
 */

/**
 * 3v3 roster from lobby slots: per team the humans (P order) then bots. Bots take the specs their team is missing
 * first (so a team is not three Healers by accident), lanes are dealt top/mid/bot in order.
 * @param {LobbySlot[]} slots
 * @param {{starters?: Record<number,string>}} [opts]  starters keyed by lobby slot (else LobbySlot.starter, else auto)
 * @returns {PlayerEntry[]}
 */
export function lobbyRoster(slots, opts = {}) {
  const out = [];
  for (let team = 0; team < 2; team++) {
    const humans = slots.filter((s) => s.team === team).sort((a, b) => a.slot - b.slot).slice(0, TEAM_SIZE);
    const used = humans.map((h) => h.spec);
    const missing = SPEC_IDS.filter((s) => !used.includes(s));
    let b = 0;
    for (let i = 0; i < TEAM_SIZE; i++) {
      const h = humans[i];
      if (h) {
        out.push({
          team, champion: TRAINER_ID, name: trainerName(h.name || 'Player ' + (h.slot + 1)), bot: false, role: LANE_ROLES[i], // i18n
          spec: h.spec, look: h.look || h.spec, device: h.device, localSlot: h.slot, inputType: h.inputType || (h.device === 'kbm' ? 'kbm' : 'gamepad'),
          padId: h.padId || '', wasd: !!h.wasd, starter: opts.starters ? opts.starters[h.slot] : h.starter,
        });
      } else {
        const spec = missing.length ? missing.shift() : SPEC_IDS[(i + team + b) % SPEC_IDS.length];
        const key = BOT_NAMES[team][b % BOT_NAMES[team].length];
        out.push({ team, champion: TRAINER_ID, name: trainerName(key), nameKey: key, bot: true, role: LANE_ROLES[i], spec, look: spec });
        b++;
      }
    }
  }
  return out;
}
