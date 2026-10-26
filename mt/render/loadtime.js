// mt/render/loadtime.js — boot / match-start load paths of the legacy layers and main-thread hitch removal.
// Owner: load-time & hitch engineer. Imported by legacy chunks through `[MT-HOOK]` one-liners (no world / DOM state
// here except the art encoder worker): champions-*.js, creeps-*.js, structures-*.js, hud-*.js.
//
// What mt never shows is not built (trainers, monsters and minions are pixel sprites, the legacy HUD is hidden except
// its loading screen):
//   * legacy champion types (sculpted 3D meshes + LODs + portrait prebake + main-renderer warm-up mesh) — the 'trainer'
//     type the loading screen portrait uses is still built on first use by the legacy HUD;
//   * legacy creep meshes (minion + jungle models, build workers, instanced batches). Footprints (contact shadows) and
//     anchors (overhead bars, ground) keep their exact legacy values through LITE creep types: the legacy config built
//     from the def plus the model height measured from the legacy build (CREEP_HEIGHT below);
//   * legacy HUD art for the 5 legacy champions / hidden in-game panels (splash, portraits, ability / item icons).
// `?legacymeshes=1` restores the old paths (every build at boot, legacy art prebake, legacy creep renderer).
//
// Load time:
//   * structure models (towers / inhibitors / nexus) are built at boot (behind the boot progress bar) instead of inside
//     the first title frame;
//   * the loading screen leaves as soon as it is ready (art, prewarm) after LOAD_MIN s (legacy 4.55 s minimum; its
//     0.38 s fade in / out is unchanged) and its fake progress bars fill at the same visual pace relative to that;
//     `?loadmin=4.55` restores the legacy hold;
//   * the trainer's loading-screen splash is prepared during the title / menu warm-up (it was rendered at loading).
//
// Hitches: legacy HUD art encodes (canvas.toBlob, ~0.5-5 s main-thread long tasks) run in a worker
// (encode.worker.js: OffscreenCanvas.convertToBlob); fallback = the legacy toBlob path. On by default on real GPUs, off on
// software GL (see softwareGL()); `?artworker=1` / `?artworker=0` force it.

const Q = (() => { try { return new URLSearchParams(globalThis.location ? location.search : ''); } catch { return new URLSearchParams(''); } })();

/** true = legacy behaviour (?legacymeshes=1): build every legacy champion / creep mesh and all legacy HUD art. */
export const LEGACY = Q.get('legacymeshes') === '1';
export function legacyMeshes() { return LEGACY; }

// ------------------------------------------------------------------------------------------------ champions
/**
 * [MT-HOOK] legacyMeshes (champions ctor): champion ids to prebuild at boot. Legacy: every legacy champion (type, LOD,
 * 256-px portrait). mt: only the ids the world's players use (the 'trainer' type, whose portrait / splash the legacy
 * loading screen shows) — type + portrait, no LOD (LODs are for in-world views, which mt never creates). Building it
 * here keeps its one-off costs (sculpt, portrait GL context, shared material assets) behind the boot progress bar
 * instead of in the first title frames.
 * @param {string[]} ids legacy champion ids  @param {'types'|'portraits'|'lod'} what
 */
export function champPrebuild(ids, what) {
  if (LEGACY) return ids;
  if (what === 'lod') return [];
  const w = globalThis.__moba && globalThis.__moba.world, out = [];
  if (w && w.players) for (const p of w.players) if (p && p.champion && !out.includes(p.champion)) out.push(p.champion);
  return out;
}

// ------------------------------------------------------------------------------------------------ creeps
/** Legacy creep model heights (m, before def.scale), measured from the legacy builds (creeps-*.js `build().height`,
 *  deterministic: the bundle never changes). Used by lite creep types so anchors match the legacy ones exactly. */
export const CREEP_HEIGHT = {
  melee: 1.3689433336257935, caster: 1.343000054359436, siege: 1.2975000143051147, super: 2.282496929168701,
  verdant_warden: 4.070876598358154, crimson_brute: 3.653590202331543, thornback: 1.8929321765899658,
  mire_toad: 2.068347930908203, ash_stalker: 1.7475250959396362, shard_golem: 2.5595555305480957,
  rift_skitter: 1.3291867971420288, storm_drake: 4.437080383300781, abyssal_tyrant: 6.614573001861572,
};

/** [MT-HOOK] legacyMeshes (creeps): no legacy creep mesh is built or drawn (mt sprites draw every minion / monster). */
export function creepsLite() { return !LEGACY; }

/**
 * [MT-HOOK] creepLite (creeps ensureType): a type without geometry — `cfg` (legacy class, same def + model height)
 * and `anchors` exactly as legacy makeType() derives them; enough for getFootprint() / getAnchor() (contact shadows,
 * overhead bars). Returns null for unknown keys (the legacy build path then runs).
 * @param {string} key  @param {object} def legacy creep def  @param {boolean} jungle  @param {Function} Cfg legacy cfg class
 */
export function creepLite(key, def, jungle, Cfg) {
  const h = CREEP_HEIGHT[key];
  if (!def || !(h > 0)) return null;
  const cfg = new Cfg(def, jungle, { height: h });
  const anchors = {};
  for (const k in def.anchors) { const [, p] = def.anchors[k]; anchors[k] = { bone: 0, x: p[0], y: p[1], z: p[2] }; }
  anchors.chest ||= { bone: 0, x: 0, y: cfg.height * 0.55, z: 0 };
  return { key, def, cfg, anchors, lite: true, batches: [], free: [], scale: cfg.scale };
}

// ------------------------------------------------------------------------------------------------ structures
/** [MT-HOOK] structuresBoot (structures ctor): build the tower / inhibitor / nexus models now (boot) instead of
 *  inside the first frame that has a world. */
export function structuresBoot(layer) {
  try {
    const w = layer && layer.app && layer.app.world;
    if (!w || !w.structures) return;
    for (const s of w.structures) layer.model(s);
  } catch (e) { console.warn('[mt-loadtime] structure prebuild', e); }
}

// ------------------------------------------------------------------------------------------------ world art
/**
 * [MT-HOOK] flagCheck (world-*.js flagstone Voronoi bake): the legacy code reads 4×4 texels back right after the GPU
 * bake (a full GPU sync at boot) only to detect an empty result and fall back to its CPU bake. Here the check runs
 * asynchronously (PBO + fence); `probe` is filled so the GPU texture is used at once, and if the async readback finds
 * it empty the CPU bake is copied into the same texture (every material keeps its reference). false = legacy sync path.
 */
export function flagCheck(renderer, target, probe, cpuBake) {
  if (Q.get('flagcheck') === 'sync' || !renderer || typeof renderer.readRenderTargetPixelsAsync !== 'function') return false;
  const caps = renderer.capabilities; if (caps && caps.isWebGL2 === false) return false;
  probe.fill(1);
  const buf = new Uint8Array(64);
  let p;
  try { p = renderer.readRenderTargetPixelsAsync(target, 100, 100, 4, 4, buf); } catch { return false; }
  const fallback = (why) => {   // what the legacy sync check did on an empty / unreadable result: the CPU bake
    try { console.warn('[mt-loadtime] flagstone GPU bake ' + why + ': CPU bake copied in'); const tex = cpuBake(); renderer.copyTextureToTexture(tex, target.texture); tex.dispose(); }
    catch (e) { console.warn('[mt-loadtime] flagstone fallback', e); }
  };
  Promise.resolve(p).then(() => {
    let f = 0; for (let i = 0; i < 16; i++) f += buf[i * 4] + buf[i * 4 + 2];
    if (!f) fallback('came back empty');
  }, () => fallback('not readable'));
  return true;
}

/** [MT-HOOK] liftAtLoad (overlays ground layer): also allow the one-off structure-lift bake while the loading screen
 *  is up (the match world and its structure views exist; the sim does not tick during loading). */
export function liftAtLoad() { const a = globalThis.__moba; return !LEGACY && !!a && a.state === 'loading'; }

// ------------------------------------------------------------------------------------------------ legacy HUD
/** [MT-HOOK] hudWarmup: legacy champion ids whose select-size splash / portrait / ability art the menu warm-up bakes
 *  (none in mt: the legacy select / scoreboard / ability arc are never shown). */
export function hudLegacyChamps(ids) { return LEGACY ? ids : []; }
/** [MT-HOOK] hudWarmup: champion ids whose loading-screen splash the menu warm-up bakes — in mt the ids of the
 *  current world's players (the trainers), i.e. exactly the art the loading screen shows. */
export function hudLoadingChamps(ids, app) {
  if (LEGACY) return ids;
  const w = app && app.world, out = [];
  if (w && w.players) for (const p of w.players) if (p && p.champion && !out.includes(p.champion)) out.push(p.champion);
  return out;
}
/**
 * [MT-HOOK] hudPrebake (legacy hud queuePrebake on 'match'): in mt only the champion portraits are wanted (they feed the
 * loading-screen cards); the rest (minimap, scoreboard portraits, ability / item / spell / crest icons) is art of
 * legacy panels mt hides. Returns true when handled.
 */
export function hudPrebake(hud, world) {
  if (LEGACY || !hud || !world) return false;
  try {
    for (const t of world.champions) hud.portraits.want(t.champion);
    // render them now (boot: hud constructor; later matches: already rendered = no-op) instead of in the first title
    // frames — the portrait render + its blank check read pixels back (GPU sync)
    hud.portraits.pumpAll(240);
  } catch (e) { console.warn('[mt-loadtime] prebake', e); }
  return true;
}

/** Loading screen: minimum seconds on screen (legacy 4.55) and the pace of its fake progress bars. */
export const LOAD_MIN = (() => { const v = Number(Q.get('loadmin')); return Number.isFinite(v) && v > 0 ? v : 1.0; })();
export const LOAD_PACE = 4.55 / LOAD_MIN;

// ------------------------------------------------------------------------------------------------ art encoder
let W = null, seq = 0, SOFT = null;
const pend = new Map();
/** Software GL (SwiftShader / llvmpipe — headless tests): the "GPU process" is a CPU rasteriser that also composites
 *  the page. Handing a canvas with pending GPU work (blur filters) to the worker moves that raster into the compositor's
 *  process, where it delays every animation frame for seconds (rAF-driven UI, e.g. the first-match hints overlay,
 *  lags behind); there the main-thread toBlob path is the lesser evil. Same rule as mt/render/prewarm.js. */
function softwareGL() {
  if (SOFT !== null) return SOFT;
  const a = globalThis.__moba;
  if (a && a.mtPrewarm && typeof a.mtPrewarm.software === 'boolean') return (SOFT = a.mtPrewarm.software);
  try {
    const gl = a && a.pipeline && a.pipeline.renderer && a.pipeline.renderer.getContext();
    if (!gl) return false;   // unknown yet: decide later
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    return (SOFT = /swiftshader|llvmpipe|softpipe|software|basic render/i.test(String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER))));
  } catch { return false; }
}
function encoder() {
  if (W !== null) return W;
  const aw = Q.get('artworker');
  if (aw !== '1' && softwareGL()) return false;   // not cached: decided per call until known
  W = false;
  try {
    if (aw === '0' || typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined' || typeof createImageBitmap !== 'function') return W;
    const w = new Worker(new URL('./encode.worker.js', import.meta.url));
    w.onmessage = (e) => {
      const d = e.data || {}, p = pend.get(d.id); if (!p) return;
      pend.delete(d.id);
      if (d.blob) p.ok(URL.createObjectURL(d.blob)); else { if (d.unsupported) W = false; p.fail(); }
    };
    w.onerror = (e) => { if (e && e.preventDefault) e.preventDefault(); W = false; for (const p of pend.values()) p.fail(); pend.clear(); };
    W = w;
  } catch { W = false; }
  return W;
}
/** the legacy hud `Et` path: toBlob -> object URL, else a data URL, else null */
function legacyEncode(canvas, type, q) {
  return new Promise((res) => {
    try { canvas.toBlob((b) => res(b ? URL.createObjectURL(b) : canvas.toDataURL(type, q)), type, q); }
    catch { try { res(canvas.toDataURL(type, q)); } catch { res(null); } }
  });
}
/**
 * [MT-HOOK] artEncode (legacy hud `Et`): encode a canvas to an image URL off the main thread. The canvas is snapshotted
 * now (createImageBitmap), the worker encodes it with the browser's own encoder (same type / quality as the legacy
 * toBlob). Resolves to a blob: URL (legacy fallback on any worker failure). null = not handled (legacy path).
 */
export function artEncode(canvas, type, q) {
  const w = encoder();
  if (!w || !canvas || !(canvas.width > 0) || !(canvas.height > 0)) return null;
  return new Promise((res) => {
    const fail = () => res(legacyEncode(canvas, type, q));
    let bmp;
    try { bmp = createImageBitmap(canvas); } catch { fail(); return; }
    bmp.then((b) => {
      const ww = encoder(); if (!ww) { try { b.close(); } catch { /* */ } fail(); return; }
      const id = ++seq; pend.set(id, { ok: res, fail });
      try { ww.postMessage({ id, bmp: b, type, q }, [b]); } catch { pend.delete(id); fail(); }
    }, fail);
  });
}
