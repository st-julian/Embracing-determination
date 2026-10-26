// mt/net/audit.js — desync forensics: detects simulation state changed OUTSIDE the lockstep tick. Owner: netplay.
//
// In an online match only NetSession.step may change the world (commands for tick T, then world.tick()). Anything the
// page does between ticks — UI, render, input, the render-only prediction — must leave the sim untouched, otherwise
// the peers drift apart (each page runs its own UI). With ?netaudit the controller (online.js) flattens the whole world
// (every unit, projectiles, the scheduler, world.mt, world scalars) after the frame's ticks and again before the next
// frame's ticks and reports every path whose value changed in between, e.g. "u29.facing", "mt.trainerBot.x.y".
// Debug only (a full walk is ~ms per frame).

const MAX_DEPTH = 5, MAX_ARR = 400, LOG_TAIL = 40;
/** world fields that are not simulation state (or are walked separately / too big to matter) */
const SKIP_W = new Set(['grid', 'debug', 'unitList', 'units', 'events', 'frameEvents', 'nav', '_tickEventEnd']);
const SKIP_ANY = new Set(['world']);
/** world.mt fields that are not simulation state: the lockstep session itself (network state), debug helpers, and the
 *  hook lists (functions; the net-test's scripted player registers its own page's hooks between ticks by design) */
const SKIP_MT = new Set(['net', 'debug', 'world', 'hooks']);

/** fold an array of primitives into a short signature (long arrays: nav fields, buffers) */
function sig(a) {
  let h = 0x811c9dc5 | 0;
  for (let i = 0; i < a.length; i++) { const v = a[i]; const s = typeof v === 'number' ? v : typeof v === 'string' ? v.length * 31 + (v.charCodeAt(0) | 0) : v ? 1 : 0; h = Math.imul(h ^ (s * 1000 | 0), 16777619); }
  return a.length + ':' + (h >>> 0).toString(36);
}

/** @returns {Map<string, *>} path -> primitive value */
export function flatten(w) {
  const m = new Map(), seen = new WeakSet();
  seen.add(w);
  const walk = (o, p, d) => {
    if (o === null || typeof o !== 'object') { if (typeof o !== 'function') m.set(p, Object.is(o, -0) ? '-0' : o); return; }
    if (seen.has(o)) return;
    seen.add(o);
    if (d > MAX_DEPTH) { m.set(p, '{…}'); return; }
    if (ArrayBuffer.isView(o)) { m.set(p, sig(o)); return; }
    if (o instanceof Map) { m.set(p + '#n', o.size); for (const [k, v] of o) walk(v, p + '<' + (typeof k === 'object' ? (k && k.id) : k) + '>', d + 1); return; }
    if (o instanceof Set) { m.set(p + '#n', o.size); let i = 0; for (const v of o) { if (typeof v !== 'object') m.set(p + '{' + (i++) + '}', v); } return; }
    if (Array.isArray(o)) {
      m.set(p + '#n', o.length);
      if (o.length > MAX_ARR && o.every((v) => v === null || typeof v !== 'object')) { m.set(p + '#sig', sig(o)); return; }
      // long lists of records (the mt event log): their length + the newest entries (appends are what matters)
      const i0 = o.length > MAX_ARR ? o.length - LOG_TAIL : 0;
      for (let i = i0; i < o.length; i++) walk(o[i], p + '[' + i + ']', d + 1);
      return;
    }
    // a unit referenced from elsewhere: record its id only (the unit itself is walked from unitList)
    if (o.kind && typeof o.id === 'number' && p.indexOf('u') !== 0) { m.set(p + '@', o.id); return; }
    for (const k of Object.keys(o)) { if (SKIP_ANY.has(k)) continue; walk(o[k], p + '.' + k, d + 1); }
  };
  // units first (in list order), then the rest of the world
  for (const u of w.unitList) { seen.add(u); }
  for (const u of w.unitList) { const p = 'u' + u.id; m.set(p + '#idx', 1); for (const k of Object.keys(u)) { if (SKIP_ANY.has(k)) continue; const v = u[k]; if (v && typeof v === 'object' && v.kind && typeof v.id === 'number') { m.set(p + '.' + k + '@', v.id); continue; } walk(v, p + '.' + k, 1); } }
  m.set('w.unitList', w.unitList.map((u) => u.id).join(','));
  if (w.mt) { seen.add(w.mt); for (const k of Object.keys(w.mt)) { if (SKIP_MT.has(k)) continue; walk(w.mt[k], 'mt.' + k, 1); } }
  for (const k of Object.keys(w)) { if (SKIP_W.has(k) || k === 'mt') continue; walk(w[k], 'w.' + k, 1); }
  // events: emitted between ticks they are carried into the next tick's list on THIS page only (world.tick keeps the
  // events after _tickEventEnd), where sim code reads them -> count + types, never the tick's own list contents
  if (Array.isArray(w.events)) { m.set('w.events#n', w.events.length); m.set('w._tickEventEnd', w._tickEventEnd); m.set('w.events#types', w.events.slice(w._tickEventEnd || 0).map((e) => e && e.type).join(',')); }
  if (w.nav) for (const k of Object.keys(w.nav)) { const v = w.nav[k]; if (v === null || typeof v !== 'object') { if (typeof v !== 'function') m.set('w.nav.' + k, v); } else if (v instanceof Map) m.set('w.nav.' + k + '#n', v.size); else if (Array.isArray(v) || ArrayBuffer.isView(v)) m.set('w.nav.' + k + '#n', v.length); }
  return m;
}

/** paths that differ between two flattenings (first `max`) and the total count */
export function diff(a, b, max = 24) {
  const out = []; let n = 0;
  for (const [k, v] of a) {
    const v2 = b.has(k) ? b.get(k) : '<gone>';
    if (v2 !== v && !(Number.isNaN(v) && Number.isNaN(v2))) { n++; if (out.length < max) out.push([k, v, v2]); }
  }
  for (const [k, v] of b) if (!a.has(k)) { n++; if (out.length < max) out.push([k, '<new>', v]); }
  return { n, out };
}
