// mt/net/codec.js — compact wire format for world.command(...) objects in an online match. Owner: netplay.
//
// A queued command travels inside the sender's room presence (plain JSON, 4 KiB in all) and is applied on EVERY peer,
// the sender included, from its DECODED form — so quantisation (positions to 1 cm, directions to 1/1000) is identical
// everywhere and never a source of divergence.
//
//   encode(cmd) -> [typeIdx, ...fields] (known type, plain field values)  |  [-1, {...}] (anything else, exact)  |  null
//   decode(enc) -> a fresh command object (or null when malformed: untrusted input from another viewer)
//
// Known types and their positional fields mirror the legacy validator table (`sw` in index-*.js) and the mt router
// (mt/sim/trainers.js). A field that is undefined is sent as null and omitted again on decode; an explicit null, an
// unknown key or a non-finite number switches to the generic form, which keeps the object exactly (NaN/±Infinity
// tagged), so the receiving sim sees the same validation outcome as the sender's would.

export const TYPES = [
  ['move', ['x', 'y']], ['attackMove', ['x', 'y']], ['dir', ['dx', 'dy']], ['attack', ['targetId', 'once']],
  ['attackNearest', ['range', 'prefer', 'once']], ['stop', []], ['recall', []], ['ping', ['x', 'y', 'kind']],
  ['cast', ['slot', 'x', 'y', 'targetId']], ['spell', ['slot', 'x', 'y', 'targetId']], ['potion', []],
  ['capture', ['targetId', 'x', 'y', 'confirm']], ['swap', []], ['evolve', ['bench']], ['regroup', []],
  ['monsterCast', ['slot', 'x', 'y', 'targetId']], ['monsterAttack', ['targetId']], ['trainerSkill', []], ['monsterAutoCast', ['on']],
];
const INDEX = Object.fromEntries(TYPES.map(([n], i) => [n, i]));
const QUANT = { x: 100, y: 100, range: 100, dx: 1000, dy: 1000 };   // decimals kept (wire size; identical on all peers)
const MAX_STR = 40;
const STR_OK = /^[\x20-\x7e]*$/;   // printable ASCII: presence strings must be free of control / invisible characters

/** Round a field value for the wire (finite numbers only). */
export function quant(key, v) {
  const q = QUANT[key];
  if (!q || typeof v !== 'number' || !(Math.abs(v) < 1e12)) return v;
  return Math.round(v * q) / q;
}
const plain = (v) => v === undefined || typeof v === 'boolean' || (typeof v === 'number' && Number.isFinite(v)) ||
  (typeof v === 'string' && v.length <= MAX_STR && STR_OK.test(v));

/** @returns {Array|null} */
export function encode(cmd) {
  if (!cmd || typeof cmd !== 'object' || typeof cmd.type !== 'string') return null;
  const ti = Object.prototype.hasOwnProperty.call(INDEX, cmd.type) ? INDEX[cmd.type] : -1;
  if (ti >= 0) {
    const fields = TYPES[ti][1];
    let ok = true;
    for (const k of Object.keys(cmd)) if (k !== 'type' && (!fields.includes(k) || !plain(cmd[k]))) { ok = false; break; }
    if (ok) {
      const out = [ti];
      for (const f of fields) out.push(cmd[f] === undefined ? null : quant(f, cmd[f]));
      while (out.length > 1 && out[out.length - 1] === null) out.pop();
      return out;
    }
  }
  return generic(cmd);
}

function tagValue(v, depth) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : { _nf: String(v) };   // 'NaN' | 'Infinity' | '-Infinity' (presence keys must be identifiers)
  if (typeof v === 'string') return v.length <= MAX_STR && STR_OK.test(v) ? v : undefined;
  if (v === null || typeof v === 'boolean') return v;
  if (v === undefined) return undefined;
  if (depth > 1 || typeof v !== 'object') return undefined;
  if (Array.isArray(v)) return v.length <= 4 ? v.map((x) => { const t = tagValue(x, depth + 1); return t === undefined ? null : t; }) : undefined;
  const o = {};
  for (const k of Object.keys(v).slice(0, 6)) if (/^[A-Za-z_][A-Za-z0-9_]{0,23}$/.test(k)) { const t = tagValue(v[k], depth + 1); if (t !== undefined) o[k] = t; }
  return o;
}
function generic(cmd) {
  const o = {};
  let n = 0;
  for (const k of Object.keys(cmd)) {
    if (!/^[A-Za-z_][A-Za-z0-9_]{0,23}$/.test(k) || ++n > 8) return null;
    const t = tagValue(cmd[k], 0);
    if (t !== undefined) o[k] = t;
  }
  if (typeof o.type !== 'string') return null;
  return [-1, o];
}

function untag(v, depth) {
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    if (typeof v._nf === 'string' && Object.keys(v).length === 1) return v._nf === 'NaN' ? NaN : v._nf === 'Infinity' ? Infinity : v._nf === '-Infinity' ? -Infinity : 0;
    if (depth > 1) return null;
    const o = {};
    for (const k of Object.keys(v)) if (k !== '__proto__' && k !== 'constructor' && k !== 'prototype') o[k] = untag(v[k], depth + 1);
    return o;
  }
  if (Array.isArray(v)) return depth > 1 ? null : v.map((x) => untag(x, depth + 1));
  return v;
}

/** @param {unknown} enc  untrusted  @returns {object|null} */
export function decode(enc) {
  if (!Array.isArray(enc) || !enc.length || !Number.isInteger(enc[0])) return null;
  const ti = enc[0];
  if (ti === -1) {
    const o = enc[1];
    if (!o || typeof o !== 'object' || Array.isArray(o) || typeof o.type !== 'string') return null;
    const cmd = {};
    for (const k of Object.keys(o)) if (/^[A-Za-z_][A-Za-z0-9_]{0,23}$/.test(k)) cmd[k] = untag(o[k], 0);
    return cmd;
  }
  const T = TYPES[ti];
  if (!T || enc.length - 1 > T[1].length) return null;
  const cmd = { type: T[0] };
  for (let i = 0; i < T[1].length; i++) {
    const v = enc[i + 1];
    if (v === null || v === undefined) continue;
    if (!plain(v)) return null;
    cmd[T[1][i]] = v;
  }
  return cmd;
}

/** commands of these types that follow each other within one tick collapse to the last one (same final state) */
export const COALESCE = new Set([INDEX.dir, INDEX.move, INDEX.attackMove]);
/** command types the mt router refuses for trainers without any side effect (mt/sim/trainers.js routeCommand) */
export const REFUSED_FOR_TRAINERS = new Set(['buy', 'sell', 'levelUp', 'autoLevel', 'ward']);
export const TYPE_INDEX = INDEX;

/** UTF-8 byte length of a JSON text (presence limits are counted in UTF-8 bytes) */
export function utf8Len(s) {
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    if (c < 0x80) n += 1; else if (c < 0x800) n += 2; else if (c >= 0xd800 && c <= 0xdbff) { n += 4; i++; } else n += 3;
  }
  return n;
}
