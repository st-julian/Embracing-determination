// mt/ui/menu-prefs.js — the menu choices that outlive a page load + the match-options contract. Owner: UX flow
// (front-end screens). Pure module (no DOM at import time; localStorage reads are wrapped).
//
//   localStorage 'sv.options' = { difficulty, mode, flow, starter, spec, look, tmode }
//     difficulty / mode   match options handed to app.newMatch({seed, players, options}) (gameplay contract:
//                         mt/data/options.js, DEFAULT_OPTIONS = {difficulty: 'easy', mode: 'quick'})
//     flow                the last main-menu choice: 'solo' | 'friend' | 'local' (the menu opens on it)
//     starter             the last chosen first monster: 'cindle' | 'puddlet' | 'sproutle' (player entry `starter`)
//     spec / look         the trainer specialisation / outfit last used (lobby rows; solo uses them silently)
//     tmode               online team choice: 'coop' (together vs bots) | 'vs' (against each other)
//
// The ids, defaults and starter data come from the gameplay contract, mt/data/options.js.

import { DIFFICULTY_IDS, MODE_IDS, DEFAULT_OPTIONS as OPTIONS_DEFAULT, STARTER_IDS, STARTERS as STARTER_DATA, normalizeOptions } from '../data/options.js';

export const STORE = 'sv.options';
/** first monsters, in stage order left -> right (title / starter screen): index 1 (Cindle) is spotlit first; a starter
 *  the stage does not know yet goes on the right */
const STAGE = ['puddlet', 'cindle', 'sproutle'];
export const STARTERS = STAGE.filter((id) => STARTER_IDS.includes(id)).concat(STARTER_IDS.filter((id) => !STAGE.includes(id)));
/** starter -> its element (icons, type tag) */
export const STARTER_TYPE = Object.fromEntries(STARTER_DATA.map((s) => [s.id, s.types[0]]));
export const DIFFICULTIES = DIFFICULTY_IDS;
export const MODES = MODE_IDS;
export const DEFAULT_OPTIONS = OPTIONS_DEFAULT;
const FLOWS = ['solo', 'friend', 'local'];
const SPECS = ['attack', 'healing', 'magic'];

const DEF = { ...DEFAULT_OPTIONS, flow: 'solo', starter: 'cindle', spec: 'attack', look: 'attack', tmode: 'coop' };
const pick = (v, list, d) => (list.includes(v) ? v : d);

let cache = null;
/** current prefs (validated; defaults for anything missing or unreadable) */
export function prefs() {
  if (cache) return cache;
  let raw = null;
  try { raw = JSON.parse(globalThis.localStorage.getItem(STORE) || 'null'); } catch { raw = null; }
  const r = raw && typeof raw === 'object' ? raw : {};
  cache = {
    difficulty: pick(r.difficulty, DIFFICULTIES, DEF.difficulty), mode: pick(r.mode, MODES, DEF.mode),
    flow: pick(r.flow, FLOWS, DEF.flow), starter: pick(r.starter, STARTERS, DEF.starter),
    spec: pick(r.spec, SPECS, DEF.spec), look: pick(r.look, SPECS, DEF.look), tmode: pick(r.tmode, ['coop', 'vs'], DEF.tmode),
  };
  return cache;
}
/** merge + persist (silently in-memory only when storage is blocked) */
export function savePrefs(patch) {
  const p = Object.assign(prefs(), patch || {});
  try { globalThis.localStorage.setItem(STORE, JSON.stringify(p)); } catch { /* private mode / blocked storage */ }
  return p;
}
/** the options object for app.newMatch */
export function matchOptions() { const p = prefs(); return normalizeOptions({ difficulty: p.difficulty, mode: p.mode }); }
/** cycle a value through its list */
export function cycle(list, v, d) { const i = list.indexOf(v); return list[((i < 0 ? 0 : i) + d + list.length) % list.length]; }

/**
 * The input mode the front-end screens draw their prompts for: app.mtInputMode (input owner: 'pad' by default until real
 * use, 'touch' / 'kbm' on use), except that a touch-first device (coarse primary pointer) with no gamepad connected
 * shows touch prompts before its first tap — e.g. a friend opening the invite link on a phone never sees "Enter" / ✕.
 */
export function viewMode(app) {
  const m = (app && app.mtInputMode) || 'pad';
  if (m !== 'pad') return m;
  let coarse = false, pad = false;
  try { coarse = !!(globalThis.matchMedia && globalThis.matchMedia('(pointer: coarse)').matches); } catch { coarse = false; }
  try { const n = globalThis.navigator; pad = !!(n && n.getGamepads && [...n.getGamepads()].some(Boolean)); } catch { pad = false; }
  return coarse && !pad ? 'touch' : 'pad';
}
