// mt/net/build.js — "are we running the same game?" Owner: netplay.
//
// Lockstep only works when every peer runs the same simulation code and data. A friend with a cached older copy
// (Safari keeps modules a long time) would desync minutes into the match; instead the lobby compares a BUILD ID and
// refuses with a clear "reload the page" message.
//   build id = 'p' + NET_PROTO + '-' + FNV-1a over the source text of the simulation modules THIS PAGE LOADED (the
//   legacy entry bundle + mt/sim, mt/ai, mt/data and the lockstep's own modules: the static import graph, the same on
//   every copy of a build), listed from Resource Timing and re-read from the HTTP cache. No file list to maintain
//   and no request for a file that does not exist. importmath.js (evaluated early) raises the Resource Timing buffer
//   so no module entry is dropped. Fallbacks: the fixed list below (files every build has); the protocol number alone.
// A sim change outside these modules is still caught by the desync check (same "reload" advice).

export const NET_PROTO = 3;   // bump when the presence protocol / match config changes (3: window header c[0] = [h, U, F])

const SIM_RE = /\/mt\/(sim|ai|data)\/[A-Za-z0-9_.-]+\.js$|\/mt\/net\/(lockstep|codec|match|detmath|importmath)\.js$/;
const FALLBACK = ['../sim/index.js', '../sim/combat.js', '../sim/trainers.js', '../sim/monsters.js', '../data/balance.js', './lockstep.js'];

/** the sim module URLs this page loaded (sorted), from Resource Timing; null when unavailable */
export function loadedSimModules() {
  try {
    if (typeof performance === 'undefined' || !performance.getEntriesByType) return null;
    const set = new Set();
    for (const e of performance.getEntriesByType('resource')) { const u = String(e.name).split(/[?#]/)[0]; if (SIM_RE.test(u)) set.add(u); }
    return set.size >= 8 ? [...set].sort() : null;
  } catch { return null; }
}

/** 32-bit FNV-1a over a string, continuing from h */
export function fnv(str, h = 0x811c9dc5) {
  h |= 0;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

let cached = null;
/** resolves the build id (computed once; never rejects) */
export function buildId() {
  if (cached) return cached;
  cached = (async () => {
    const base = 'p' + NET_PROTO;
    try {
      if (typeof fetch !== 'function' || typeof document === 'undefined') return base;
      const urls = loadedSimModules() || FALLBACK.map((f) => new URL(f, import.meta.url).href);
      const legacy = document.querySelector('script[type="module"][src*="index-"]');
      if (legacy && legacy.src) urls.unshift(legacy.src);
      let h = 0x811c9dc5;
      const texts = await Promise.all(urls.map((u) => fetch(u, { cache: 'force-cache' }).then((r) => (r.ok ? r.text() : '404'), () => 'err')));
      if (texts.includes('err')) return base;   // offline / blocked: cannot tell, the desync check stays the backstop
      // line endings / a trailing BOM must not make two copies of the same build differ
      for (const t of texts) h = fnv(t.replace(/\r\n/g, '\n').replace(/^\ufeff/, '') + '\u0001', h);
      return base + '-' + h.toString(36);
    } catch { return base; }
  })();
  return cached;
}
