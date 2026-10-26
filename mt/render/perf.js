// mt/render/perf.js — device-aware default quality + adaptive render governor (app.mtPerf). Owner: perf / device quality.
//
// Three layers, so the decision logic can be unit-tested without a browser (tests/perfgov.test.mjs):
//
// 1. detectDevice() / bootProfile(params, app) — runs BEFORE the pipeline exists ([MT-HOOK] perfBoot in index-*.js):
//    picks the starting tier and the canvas pixel ratio per device class. iPadOS Safari reports a Mac user agent, so a
//    "Macintosh" UA with maxTouchPoints > 1 is a tablet. Only applies to a plain boot: `?quality=` keeps the legacy
//    tier pixel ratio (prMax), `?dpr=` forces the canvas pixel ratio, as before.
//      phone / tablet  medium, native canvas up to 2x, scene 1.6 px per CSS px (iPad: scale 0.8), floor 1.2 px/pt
//      desktop         high,   canvas <= 2x (legacy prMax), scene scale 1, floor 0.6
//    deviceMemory ≤ 2 GB or ≤ 2 reported cores (not iOS: Safari caps the value) start one tier lower.
//
// 2. Governor — pure decision logic over rAF frame deltas (ms) + the frame's JS logic time (ms):
//    * statistics over the last 2 s (p50 / p75 / p90), evaluated every 0.5 s, outliers > 250 ms ignored (hitches,
//      tab switches), nothing recorded for 0.6 s after any change (RT reallocation, shader warm-up);
//    * DOWN when p75 > 22 ms (badly over budget) or judder (mean > 17.2 ms with >= 3 % GPU-dropped frames), two evaluations
//      in a row, along one ladder — pass levers first, resolution last: the scale back to the start (if it had climbed),
//      bloom + cloud decal (EASED: ramp over 2.5 s, applied at once), sun shadow map size, AO, MSAA, then the scale down to
//      the floor (one step sized from p75 for a fill-bound frame), then the tier. Nothing when the frame is JS-bound
//      (logic ≥ 80 % of the frame: lower resolution would not help).
//    * VISIBLE changes are rare: every DISCRETE change (scale, shadow map, AO, MSAA, tier) waits for a camera cut (match
//      start, local death / respawn, focus jump > 6 m). During the match's 20 s calibration window a waiting down step is
//      forced after 2 s of slow frames; afterwards only after 5 s BADLY over budget (mild judder waits for a cut), and
//      the steps the frame time asks for are batched into one change. The scene scale changes in one step (no gradual
//      chase: it pulsed the image and re-snapped every sprite several times).
//    * a down step at a cadence locked to 25/33/50 ms (30 Hz Low Power Mode, a compositor cap — or a slow GPU) during
//      calibration probes down the same ladder in big jumps to the floor; if even the floor leaves the mean frame time
//      unchanged it is a cap: restore and accept that cadence;
//    * UP slowly: after 8 s of headroom (30 s after calibration; p75 < 13 ms, or no missed refresh with < 13 ms of JS), one
//      step back up the same ladder — eased levers at once, anything discrete at the next camera cut (a tier only after
//      30 s) — verified for 2.5 s and reverted at once if it made frames slow; a failed probe backs off exponentially
//      (30 s … 8 min) while calibrating and 8 min afterwards; every recent down doubles the stability required before
//      the next up (decays by half per minute) — converges instead of oscillating.
//
// 3. PerfSystem — the 'perf' part of the mt-render subsystem (mt/render/index.js): feeds the governor from
//    the game loop, applies its decisions (pipeline.post.scaleOverride + applySizes, pass levers re-asserted every
//    frame because legacy configure() resets them, pipeline.setQuality at cuts), disables the legacy tier-only
//    auto-quality, publishes app.mtPerf and draws the `?perf=1` overlay.
//    app.mtPerf = { fps, ms (p75), cpu, scale, px (scene px per CSS px), canvas (canvas px per CSS px), tier, auto,
//                   cls, level, lever, levers, log, boot, set({scale, level, tier, auto}), stats() }
//    URL: ?perf=1 overlay · ?autoquality=0 off · ?autoquality=1 on even with ?quality / software GL · ?perfscale=0.8 start.
//    The HUD is DOM and never scaled; only the 3D scene render target is.

export const TIERS = ['high', 'medium', 'low'];
export const STEP = 0.05;
const q05 = (s) => Math.round(s * 20) / 20;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

/** Starting point per device class. pr = canvas px per CSS px cap (the canvas is native up to 2: the final pass, the
 *  sharpen and the HUD-in-world stay at device resolution and a fast device can climb to pixel-exact sprites);
 *  px / pxMin = starting / floor SCENE px per CSS px (scene scale = px / canvas pr, at most 1); desktop: minScale as a
 *  fraction of the canvas. Resolution is the last thing the governor gives up: every pass lever goes before the scene
 *  drops below its starting scale (playtest #12: soft pixel sprites on a Retina iPad at 1.3 / 0.9 px/pt). */
export const PROFILES = Object.freeze({
  phone: Object.freeze({ tier: 'medium', pr: 2, px: 1.6, pxMin: 1.15 }),
  tablet: Object.freeze({ tier: 'medium', pr: 2, px: 1.6, pxMin: 1.15 }),
  desktop: Object.freeze({ tier: 'high', pr: 2, px: 99, minScale: 0.6 }),
});

/** Device class from the browser environment (navigator / screen / matchMedia); `env` is injectable for tests. */
export function detectDevice(env = globalThis) {
  const nav = env.navigator || {}, scr = env.screen || {};
  const ua = String(nav.userAgent || ''), mtp = nav.maxTouchPoints | 0;
  const ipadOS = /Macintosh/.test(ua) && mtp > 1;            // iPadOS 13+ Safari "desktop" UA
  const ipad = /iPad/.test(ua) || ipadOS, iphone = /iPhone|iPod/.test(ua);
  const ios = ipad || iphone, android = /Android/.test(ua), mobileUA = /Mobi/.test(ua);
  let coarse = false;
  try { coarse = !!(env.matchMedia && env.matchMedia('(pointer: coarse)').matches); } catch (e) { /* no matchMedia */ }
  const sw = scr.width || env.innerWidth || 0, sh = scr.height || env.innerHeight || 0;
  const short = Math.min(sw, sh) || 0, long = Math.max(sw, sh) || 0;
  const touch = mtp > 1 || coarse;
  let cls = 'desktop';
  if (iphone || (android && mobileUA) || (touch && coarse && short > 0 && short < 600)) cls = 'phone';
  else if (ipad || android || (touch && coarse && short >= 600)) cls = 'tablet';
  const cores = nav.hardwareConcurrency | 0, mem = nav.deviceMemory;
  return { cls, ios, ipad, ipadOS, android, touch, coarse, cores, mem: mem === undefined ? null : mem, dpr: env.devicePixelRatio || 1, screen: [short, long] };
}

/**
 * Boot-time profile (before the pipeline exists). Returns what the [MT-HOOK] perfBoot passes to the Pipeline ctor:
 * `tier` (used when the URL has no `quality`) and `pr` (canvas pixel ratio, used when the URL has neither `quality`
 * nor `dpr` — so every test tool, which pins both, keeps the legacy behaviour), plus the governor's starting point.
 */
export function bootProfile(params, app, env = globalThis) {
  const P = params || { get: () => null, has: () => false };
  const dev = detectDevice(env);
  const prof = PROFILES[dev.cls];
  let ti = TIERS.indexOf(prof.tier);
  const lowMem = dev.mem != null && dev.mem <= 2, fewCores = !dev.ios && dev.cores > 0 && dev.cores <= 2;
  if (lowMem || fewCores) ti = Math.min(TIERS.length - 1, ti + 1);
  const tier = TIERS[ti];
  const pr = +Math.min(dev.dpr, prof.pr).toFixed(3);
  const ps = Number(P.get('perfscale'));
  const minScale = prof.pxMin ? clamp(q05(prof.pxMin / pr), 0.3, 1) : prof.minScale;
  const scale = clamp(Number.isFinite(ps) && ps > 0 ? q05(ps) : q05(prof.px / pr), minScale, 1);
  const out = {
    cls: dev.cls, tier, pr, scale, minScale, softMin: scale,     // the soft floor = the start: levers before resolution
    device: dev, reason: dev.cls + (lowMem ? ' lowmem' : '') + (fewCores ? ' fewcores' : ''),
    usedTier: !P.has('quality'), usedPr: !P.has('quality') && !P.has('dpr'),
  };
  if (app) { app.mtPerfBoot = out; installBootProgress(app); }
  return out;
}

// ---------------------------------------------------------------------------------------------------------- boot progress
// Until the title screen exists the page is an empty dark canvas for the whole boot (5–25 s: world-art build, subsystem
// constructors, shader prewarm). app.mtBootStep(i, n, name) is awaited between the subsystem constructors ([MT-HOOK]
// bootStep in index-*.js): it moves a small progress bar and yields one frame so the browser can paint it (only when
// the last yield is > 50 ms ago). The bar follows the prewarm afterwards and fades out once the game is ready.
function installBootProgress(app) {
  if (typeof document === 'undefined' || !document.body || app.mtBootStep) return;
  const P = app.params;
  if (P && (P.has('noboot') || P.has('mtshot'))) { app.mtBootStep = () => null; return; }
  const root = document.createElement('div');
  root.id = 'mt-boot';
  root.style.cssText = 'position:fixed;left:50%;bottom:max(14%,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:50;pointer-events:none;'
    + 'width:min(56vw,360px);font:600 12px/1.4 -apple-system,"Hiragino Sans",system-ui,sans-serif;color:#b9d6ee;letter-spacing:.06em;text-align:center;transition:opacity .45s';
  root.innerHTML = '<div style="margin-bottom:8px;opacity:.85">SUNDERED VALE</div><div style="height:6px;border-radius:3px;background:#1a2433;overflow:hidden">'
    + '<i style="display:block;height:100%;width:2%;border-radius:3px;background:linear-gradient(90deg,#5fb2e8,#c8ecff);transition:width .25s"></i></div>'
    + '<div style="margin-top:6px;font-size:11px;opacity:.6">0%</div>';
  document.body.appendChild(root);
  // the yields below let the browser paint half-built screens (e.g. the legacy HUD before mt-ui replaces it): keep every
  // other element invisible until the first state is set (visibility keeps layout + measurements intact)
  const veil = document.createElement('style');
  veil.textContent = 'body > *:not(#mt-boot):not(#boot-error):not(#sv-unsupported) { visibility: hidden !important; }';
  document.head.appendChild(veil);
  const bar = root.querySelector('i'), pct = root.lastChild;
  let p = 0.02, lastYield = performance.now(), gone = false;
  const show = (v) => { p = Math.max(p, Math.min(1, v)); bar.style.width = (p * 100).toFixed(1) + '%'; pct.textContent = Math.round(p * 100) + '%'; };
  const finish = () => { if (gone) return; gone = true; show(1); clearInterval(poll); veil.remove(); root.style.opacity = '0'; setTimeout(() => root.remove(), 600); };
  if (app.on) app.on('state', finish);   // fired by the boot right before the first frame (title / lobby / game)
  const yieldFrame = () => new Promise((res) => {
    let done = false; const go = () => { if (!done) { done = true; lastYield = performance.now(); res(); } };
    if (!document.hidden && typeof requestAnimationFrame === 'function') requestAnimationFrame(() => setTimeout(go, 0));
    setTimeout(go, 50);
  });
  app.mtBootStep = (i, n) => {
    show(0.12 + 0.68 * (i / Math.max(1, n)));
    return performance.now() - lastYield > 50 ? yieldFrame() : null;
  };
  // after the constructors: shader prewarm, then the first frame (title / lobby / game draws its own screen)
  const poll = setInterval(() => {
    if (app.ready) return finish();
    if (app.mtPrewarm) show(app.mtPrewarm.busy ? Math.min(0.97, p + 0.01) : 0.82);
  }, 120);
  show(0.04);
}

// ---------------------------------------------------------------------------------------------------------- Governor
export const GOV_DEFAULTS = Object.freeze({
  windowS: 2, evalS: 0.5, minSamples: 20, minSpanS: 1.5, outlierMs: 250, settleS: 0.6,
  downMs: 22, judderMs: 17.2, upMs: 13, targetMs: 16.7, slowEvals: 2,
  maxDrop: 0.1, bigDrop: 0.2, bigDropMs: 40,
  upStableS: 8, upStableMaxS: 300, ceilDecayS: 300, verifyS: 2.5, backoffS: 30, backoffMaxS: 480, downDecayS: 60,
  cpuBound: 0.8, tierDeferS: 6, tierUpStableS: 30, tierUpBlockS: 600,
  // visible-change policy (the user plays on an iPad: a pulsing image reads as "glitchy")
  easedLevels: 2,   // the first levers (bloom, cloud decal) ramp over seconds: they may change at any time
  forceCalS: 2,     // calibration (the first 20 s of a match): a pending discrete step is forced after 2 s of slow frames
  forceS: 5,        // afterwards only after 5 s BADLY over budget (p75 > 22 ms); mild judder waits for a camera cut
  frozenUpS: 30,    // after calibration an up step needs 30 s of headroom (and a discrete one a camera cut)
});

/**
 * Pure adaptive-quality decision logic. State: scale (scene render scale), level (number of pass levers switched off,
 * 0..ladder), tier (index into TIERS). Feed `push(t, dtMs, cpuMs)` once per frame and call `update(t, {active, cut})`
 * once per frame; it returns an action ({type:'scale'|'level'|'tier', dir, reason, scale, level, tier}) when the state
 * changed (the caller applies it), else null. Times in seconds.
 */
export class Governor {
  constructor(o = {}) {
    this.o = { ...GOV_DEFAULTS, ...(o.opts || {}) };
    this.scale = clamp(o.scale ?? 1, o.minScale ?? 0.6, o.maxScale ?? 1);
    this.minScale = o.minScale ?? 0.6; this.maxScale = o.maxScale ?? 1;
    this.ladder = o.ladder ?? 5; this.level = clamp(o.level ?? 0, 0, this.ladder);
    // ladder: scale down to the soft floor (the starting scale), then the pass levers (all of them by default), then the
    // scale down to the floor — resolution is what the pixel art needs most, effects go first
    this.softMin = Math.max(this.minScale, Math.min(this.maxScale, o.softMin ?? this.scale)); this.softLevels = Math.min(this.ladder, o.softLevels ?? this.ladder);
    this.tier = Math.max(0, TIERS.indexOf(o.tier || 'high'));
    this.bestTier = o.bestTier != null ? Math.max(0, TIERS.indexOf(o.bestTier)) : this.tier;   // never auto above this
    this.canScale = o.canScale !== false; this.canPass = o.canPass !== false; this.canTier = o.canTier !== false;
    this.N = 512; this.ts = new Float64Array(this.N); this.dt = new Float32Array(this.N); this.cpu = new Float32Array(this.N);
    this.head = 0; this.count = 0; this.sorted = new Float32Array(this.N); this.sortedCpu = new Float32Array(this.N);
    this.settleUntil = -1; this.lastEval = -1e9; this.slow = 0; this.stableFor = 0; this.lastStableAt = -1;
    this.verify = null; this.upFails = 0; this.upBlockedUntil = 0; this.tierUpBlockedUntil = 0;
    this.recentDowns = 0; this.downsAt = -1e9; this.lastDownAt = -1e9;
    this.ceil = new Map();     // state key ('s16' = scale 0.80, 'l2' = level 2) -> {hits, at}: states that were too slow
    this.lock = null;          // cadence-locked down probing {start: state, cadence, steps}
    this.capMs = 0;              // detected cadence cap (ms) that render levers cannot beat
    this.wantTier = null; this.wantTierAt = 0; this.wantTierReason = '';
    this.pending = null;       // a discrete change waiting for a camera cut {to, why, dir, ...}
    this.slowFor = 0; this.badFor = 0; this.fine = 0;
    this.last = null; this.log = []; this.changes = 0; this.cpuBoundAt = -1e9;
  }
  get state() { return { scale: +this.scale.toFixed(3), level: this.level, tier: TIERS[this.tier] }; }

  push(t, dtMs, cpuMs = 0) {
    if (!(dtMs > 0) || dtMs > this.o.outlierMs || t < this.settleUntil) return;
    const i = this.head; this.ts[i] = t; this.dt[i] = dtMs; this.cpu[i] = cpuMs > 0 ? cpuMs : 0;
    this.head = (i + 1) % this.N; if (this.count < this.N) this.count++;
  }
  clear(t, settle = this.o.settleS) { this.count = 0; this.head = 0; this.settleUntil = Math.max(this.settleUntil, t + settle); this.slow = 0; }

  /** window statistics over the last windowS seconds (null when there is not enough data yet) */
  stats(t) {
    const W = this.o.windowS, N = this.N, dropMs = this.o.targetMs * 1.3; let n = 0, t0 = t, sum = 0, gpuDrops = 0;
    for (let k = 0; k < this.count; k++) {
      const i = (this.head - 1 - k + N) % N; if (t - this.ts[i] > W) break;
      const d = this.dt[i], c = this.cpu[i];
      this.sorted[n] = d; this.sortedCpu[n] = c; n++; sum += d; t0 = this.ts[i];
      if (d > dropMs && c < 0.6 * d) gpuDrops++;   // a dropped frame that its own JS does not explain
    }
    const span = t - t0 + (n ? sum / n / 1000 : 0);
    if (n < this.o.minSamples || span < this.o.minSpanS) return null;
    const a = this.sorted.subarray(0, n).sort(), c = this.sortedCpu.subarray(0, n).sort();
    const at = (arr, p) => arr[Math.min(n - 1, Math.floor(n * p))];
    return { n, span, mean: sum / n, p50: at(a, 0.5), p75: at(a, 0.75), p90: at(a, 0.9), cpu75: at(c, 0.75), gpuDrop: gpuDrops / n };
  }

  /** the refresh period frames are quantised to (ms), or 0 when the cadence is not visibly locked */
  cadence(st) {
    for (const per of [1000 / 120, 1000 / 90, 1000 / 60, 1000 / 40, 1000 / 30, 1000 / 20]) {
      if (Math.abs(st.p50 - per) < per * 0.08 && st.p90 <= per * 1.12) return per;
    }
    return 0;
  }

  note(t, s) { this.log.push(t.toFixed(1) + 's ' + s); if (this.log.length > 40) this.log.shift(); }

  snapshot() { return { scale: this.scale, level: this.level, tier: this.tier }; }

  set(t, st, s, why, dir, extra) {
    const prev = this.snapshot();
    if (s.scale != null) this.scale = clamp(q05(s.scale), this.minScale, this.maxScale);
    if (s.level != null) this.level = clamp(s.level, 0, this.ladder);
    if (s.tier != null) this.tier = clamp(s.tier, 0, TIERS.length - 1);
    const type = prev.tier !== this.tier ? 'tier' : prev.level !== this.level ? 'level' : 'scale';
    this.clear(t, type === 'tier' ? 1.5 : this.o.settleS);
    this.stableFor = 0; this.slowFor = 0; this.badFor = 0; this.fine = 0; this.changes++;
    const a = { type, dir, reason: why, scale: +this.scale.toFixed(3), level: this.level, tier: TIERS[this.tier], t: +t.toFixed(2), p75: st ? +st.p75.toFixed(1) : null, ...(extra || {}) };
    this.note(t, `${dir} ${why} -> scale ${a.scale} level ${a.level} ${a.tier}${st ? ` (p75 ${st.p75.toFixed(1)} cpu ${st.cpu75.toFixed(1)})` : ''}`);
    this.last = a;
    return a;
  }

  /** call once per frame. o.active=false (menus, paused, hidden tab, loading) clears the window; o.cut = camera cut now;
   *  o.calib = still in the match's calibration window (default true) */
  update(t, o = {}) {
    if (o.active === false) { this.clear(t, 0.5); this.stableFor = 0; this.slowFor = 0; this.badFor = 0; return null; }
    const O = this.o, calib = this.calib = o.calib !== false;
    // decay of the "recent downs" damping
    if (this.recentDowns > 0 && t - this.downsAt > O.downDecayS) { this.recentDowns = Math.max(0, this.recentDowns - 1); this.downsAt = t; }
    for (const [k, c] of this.ceil) if (t - c.at > O.ceilDecayS) { if (--c.hits <= 0) this.ceil.delete(k); else c.at = t; }
    // a tier change waits for a camera cut (it recompiles shaders) — or is forced while frames stay slow (calibration) /
    // badly over budget (afterwards)
    if (this.wantTier != null && t >= this.settleUntil) {
      const down = this.wantTier > this.tier;
      if (o.cut || (down && t - this.wantTierAt > O.tierDeferS && (calib ? this.slow > 0 : this.badFor > 0))) {
        const to = this.wantTier; this.wantTier = null;
        const st = this.stats(t);
        const a = this.set(t, st, { tier: to }, this.wantTierReason + (o.cut ? ' @cut' : ' @forced'), down ? 'down' : 'up');
        if (!down) this.verify = { until: t + 1.5 + O.verifyS + 1.5, before: st ? st.p75 : O.targetMs, prev: { tier: to + 1 }, tier: true };
        return a;
      }
    }
    // a discrete change (scale, shadow map, AO, MSAA) waits for a camera cut — a down step is forced after forceCalS of
    // slow frames while calibrating, afterwards only after forceS of frames BADLY over budget (mild judder waits for a cut)
    if (this.pending && t >= this.settleUntil) {
      const P = this.pending;
      const force = P.dir === 'down' && (calib ? this.slowFor >= O.forceCalS : this.badFor >= O.forceS);
      if (o.cut || force) { this.pending = null; return this.applyPlan(t, P, o.cut ? '@cut' : '@forced'); }
    }
    if (t < this.settleUntil || t - this.lastEval < O.evalS) return null;
    this.lastEval = t;
    const st = this.stats(t);
    if (!st) return null;
    const downMs = this.capMs > 0 ? Math.max(O.downMs, this.capMs * 1.2) : O.downMs;
    const cad = this.cadence(st);

    // ---- verification of the last up step
    if (this.verify) {
      const v = this.verify;
      const bad = st.p75 > downMs || (st.p75 > v.before * 1.25 && st.p75 > O.targetMs * 1.1) || this.judder(st);
      if (bad) return this.failUp(t, st);
      if (t < v.until) return null;
      this.verify = null; this.upFails = Math.max(0, this.upFails - 1);
      this.note(t, 'keep-up');
    }
    // ---- cadence-locked down probing (calibration only: it is the one visible two-step jump). A GPU-bound frame at a
    // locked 25/33/50 ms cadence gets faster as the load drops; a cap that is not ours (iOS Low Power Mode 30 Hz, a
    // compositor cap) does not. The probe jumps down the ladder (every lever, then the scale floor): a GPU that managed
    // <= 33 ms at the start state reaches 60 Hz at ~25 % of the load, so if even the floor leaves the mean frame time
    // unchanged it is a cap — restore the start state and accept the cadence.
    if (this.lock) {
      const L = this.lock;
      if (st.p75 <= downMs || st.p50 < L.cadence * 0.9 || st.p75 < L.p75 * 0.85) { this.note(t, 'lock-probe helped'); this.lock = null; }
      else if (this.canStepDown(true)) return this.stepDown(t, st, 'lock-probe');
      else if (st.mean > L.mean * 0.95 && this.load() < L.load * 0.6) {
        this.lock = null; this.capMs = st.p50; this.wantTier = null;
        return this.set(t, st, L.start, `cadence cap ${st.p50.toFixed(1)} ms (the floor did not help)`, 'revert');
      } else { this.note(t, 'lock-probe: frames got faster at the floor, not a cap (device is slow)'); this.lock = null; }
    }
    if (this.capMs > 0 && st.p50 < this.capMs * 0.8) { this.note(t, 'cadence cap lifted'); this.capMs = 0; }

    // slow: a quarter of the frames over 22 ms (= badly over budget), or judder — the mean over 17.2 ms (~3 % of the
    // 60 Hz frames dropped)
    const bad = st.p75 > downMs, slow = bad || this.judder(st);
    this.slow = slow ? this.slow + 1 : 0;
    this.slowFor = slow ? this.slowFor + O.evalS : 0; this.badFor = bad ? this.badFor + O.evalS : 0;
    if (slow) {
      this.stableFor = 0; this.fine = 0;
      if (this.pending && this.pending.dir === 'up') { this.note(t, 'pending up dropped (slow)'); this.pending = null; }
      if (this.slow < O.slowEvals) return null;
      if (st.cpu75 >= O.cpuBound * st.p75) {   // JS-bound: render levers cannot help
        if (t - this.cpuBoundAt > 10) { this.note(t, `cpu-bound (p75 ${st.p75.toFixed(1)} cpu ${st.cpu75.toFixed(1)}) — hold`); this.cpuBoundAt = t; }
        return null;
      }
      if (this.pending || !this.canStepDown() || this.wantTier != null) return null;
      if (calib && cad >= 1000 / 40 && !this.lock && !this.capMs && this.canStepDown(true)) this.lock = { start: this.snapshot(), cadence: cad, p75: st.p75, mean: st.mean, load: this.load() };
      return this.stepDown(t, st, 'slow');
    }
    // a pending down step whose load went away (two fine evaluations) is dropped
    this.fine = (this.fine || 0) + 1;
    if (this.pending && this.pending.dir === 'down' && this.fine >= 2) { this.note(t, 'pending down dropped (frames recovered)'); this.pending = null; }
    // headroom → step up slowly (verified); after calibration only after frozenUpS of headroom
    const head = st.p75 < O.upMs || (cad > 0 && cad <= 1000 / 59 && st.p90 <= cad * 1.12 && st.cpu75 < O.upMs);
    this.stableFor = head ? this.stableFor + O.evalS : 0;
    if (!head && this.pending && this.pending.dir === 'up') { this.note(t, 'pending up dropped (no headroom)'); this.pending = null; }
    let need = Math.min(O.upStableMaxS, O.upStableS * 2 ** this.recentDowns * 4 ** this.ceilHits(this.upKey()));
    if (!calib) need = Math.max(need, O.frozenUpS);
    if (head && this.stableFor >= need && t >= this.upBlockedUntil && this.wantTier == null && !this.pending) return this.stepUp(t, st);
    return null;
  }

  /** judder: mean frame time over budget with >= 3 % of the frames dropped for reasons other than their own JS */
  judder(st) { return !this.capMs && st.mean > this.o.judderMs && st.gpuDrop >= 0.03; }
  /** noTier: only steps that apply at once (scale, passes) */
  canStepDown(noTier) {
    return (this.canScale && this.scale > this.minScale + 1e-6) || (this.canPass && this.level < this.ladder) || (!noTier && this.canTier && this.tier < TIERS.length - 1);
  }
  /** rough relative GPU load of the current state (pixels × passes × tier), for the cap probe only */
  load() { return this.scale * this.scale * 0.93 ** this.level * [1.3, 1, 0.5][this.tier]; }
  /** an eased change: only a lever among the first `easedLevels` (they ramp over seconds — bloom, cloud decal) */
  eased(from, to) {
    if (Math.abs(from.scale - to.scale) > 1e-6) return false;
    return Math.max(from.level, to.level) <= this.o.easedLevels;
  }

  /** key of the state the next up step would enter */
  upKey() {
    const lv = this.canPass && (this.level > this.softLevels || (this.level > 0 && !(this.canScale && this.scale < this.softMin - 1e-6)));
    return lv ? 'l' + (this.level - 1) : 's' + Math.round((this.scale + STEP) * 20);
  }
  ceilHits(k) { const c = this.ceil.get(k); return c ? c.hits : 0; }
  /** remember that the current state was too slow (its next probe needs 4x the stability) */
  markCeil(t) {
    const scaleNext = this.canScale && this.scale > (this.canPass && this.level < this.softLevels ? this.softMin : this.minScale) + 1e-6;
    const k = scaleNext ? 's' + Math.round(this.scale * 20) : 'l' + this.level;
    const c = this.ceil.get(k) || { hits: 0, at: t }; c.hits = Math.min(3, c.hits + 1); c.at = t; this.ceil.set(k, c);
  }

  /** the next state DOWN the ladder from s ({scale, level}), or null when only the tier is left */
  nextDown(s, st, probe) {
    const O = this.o, eps = 1e-6;
    if (probe) {   // the cadence probe: the same ladder in big jumps (start scale, every lever, the scale floor)
      const soft = this.canPass && s.level < this.softLevels;
      if (soft && this.canScale && s.scale > this.softMin + eps) return { scale: this.softMin, level: s.level };
      if (soft) return { scale: s.scale, level: this.softLevels };
      if (this.canScale && s.scale > this.minScale + eps) return { scale: this.minScale, level: s.level };
      if (this.canPass && s.level < this.ladder) return { scale: s.scale, level: this.ladder };
      return null;
    }
    const passesSoft = this.canPass && s.level < this.softLevels;
    const floor = passesSoft ? this.softMin : this.minScale;
    const scaleTo = (fl) => {   // fill-bound frame: time ~ pixels ~ scale² → the scale that would land on ~90 % of the budget
      const want = s.scale * Math.sqrt((O.targetMs * 0.9) / Math.max(st.p75, st.mean));
      const maxDrop = st.p75 > O.bigDropMs ? O.bigDrop : O.maxDrop;
      return { scale: Math.max(fl, q05(clamp(want, s.scale - maxDrop, s.scale - STEP))), level: s.level };
    };
    if (this.canScale && s.scale > floor + eps) return scaleTo(floor);
    if (passesSoft) return { scale: s.scale, level: s.level + 1 };
    if (this.canScale && s.scale > this.minScale + eps) return scaleTo(this.minScale);
    if (this.canPass && s.level < this.ladder) return { scale: s.scale, level: s.level + 1 };
    return null;
  }

  stepDown(t, st, why) {
    // one slow EPISODE (downs < 20 s apart) counts once: it bumps the damping and marks only the state it started in —
    // the one that will flap when the load comes back; the states passed on the way down were judged under that load
    if (t - this.lastDownAt > 20) { if (why === 'slow') this.markCeil(t); this.recentDowns = Math.min(5, this.recentDowns + 1); }
    this.lastDownAt = t; this.downsAt = t; this.slow = 0;
    const probe = why === 'lock-probe', cur = { scale: this.scale, level: this.level };
    let to = this.nextDown(cur, st, probe);
    if (!to) {
      if (this.canTier && this.tier < TIERS.length - 1 && this.wantTier == null) {
        this.wantTier = this.tier + 1; this.wantTierAt = t; this.wantTierReason = why;
        this.note(t, 'tier down wanted -> ' + TIERS[this.wantTier] + ' (waits for a camera cut)');
      }
      return null;
    }
    // an eased lever (bloom, cloud decal: ramped over seconds) and the cadence probe apply at once
    if (probe || this.eased(cur, to)) return this.set(t, st, to, why, 'down');
    // a discrete change waits for a cut; when far over budget the wait batches the steps the frame time asks for
    // (one visible change instead of a series): 1 step, 2 above 30 ms, 3 above 40 ms
    const n = st.p75 > 40 ? 3 : st.p75 > 30 ? 2 : 1;
    for (let i = 1; i < n; i++) { const nx = this.nextDown(to, st, false); if (!nx) break; to = nx; }
    return this.plan(t, st, to, why, 'down');
  }

  /** queue a discrete change for the next camera cut (or the force timer of a down step) */
  plan(t, st, to, why, dir, extra) {
    this.pending = { to, why, dir, st, at: t, ...(extra || {}) };
    this.note(t, `${dir} ${why} pending (waits for a camera cut) -> scale ${q05(to.scale)} level ${to.level}`);
    return null;
  }
  applyPlan(t, P, how) {
    const st = this.stats(t) || P.st;
    const a = this.set(t, st, P.to, P.why + ' ' + how, P.dir);
    if (P.dir === 'up') this.verify = { until: t + this.o.settleS + this.o.verifyS, before: P.before, prev: P.prev };
    return a;
  }

  stepUp(t, st) {
    const O = this.o, before = st.p75, cur = { scale: this.scale, level: this.level };
    // exact reverse of the down ladder: hard levers, scale up to the soft floor, soft levers, scale up to the top
    let to = null;
    if (this.canPass && this.level > this.softLevels) to = { scale: this.scale, level: this.level - 1 };
    else if (this.canScale && this.canPass && this.level > 0 && this.scale < this.softMin - 1e-6) to = { scale: this.scale + STEP, level: this.level };
    else if (this.canPass && this.level > 0) to = { scale: this.scale, level: this.level - 1 };
    else if (this.canScale && this.scale < this.maxScale - 1e-6) to = { scale: this.scale + STEP, level: this.level };
    if (to) {
      const prev = { scale: this.scale, level: this.level };
      // eased levers come back at once (ramped); anything discrete waits for a camera cut
      if (!this.eased(cur, to)) return this.plan(t, st, to, 'headroom', 'up', { before, prev });
      this.verify = { until: t + O.settleS + O.verifyS, before, prev };
      return this.set(t, st, to, 'headroom', 'up');
    }
    if (this.canTier && this.tier > this.bestTier && this.stableFor >= O.tierUpStableS && t >= this.tierUpBlockedUntil) {
      this.wantTier = this.tier - 1; this.wantTierAt = t; this.wantTierReason = 'headroom';
      this.note(t, 'tier up wanted -> ' + TIERS[this.wantTier] + ' (waits for a camera cut)');
    }
    return null;
  }

  failUp(t, st) {
    const O = this.o, v = this.verify; this.verify = null;
    this.upFails++;
    // exponential back-off while calibrating; afterwards a failed probe (a change + its revert: two visible steps) blocks
    // probing for the longest back-off at once
    this.upBlockedUntil = t + (this.calib === false ? O.backoffMaxS : Math.min(O.backoffMaxS, O.backoffS * 2 ** (this.upFails - 1)));
    if (v.tier) this.tierUpBlockedUntil = t + O.tierUpBlockS;
    return this.set(t, st, v.prev, 'probe failed (backoff ' + Math.round(this.upBlockedUntil - t) + ' s)', 'revert');
  }

  /** a manual override (app.mtPerf.set) — resets probing state */
  force(t, s) {
    this.verify = null; this.lock = null; this.wantTier = null; this.pending = null;
    return this.set(t, null, { scale: s.scale, level: s.level, tier: s.tier != null ? TIERS.indexOf(s.tier) : undefined }, 'manual', 'set');
  }
}

// ---------------------------------------------------------------------------------------------------------- levers
// Pass levers in the order they are switched off. Each one is a runtime state on the existing pipeline: no shader define
// changes (no recompiles). The first two (Governor easedLevels) ramp over 2.5 s and may change at any time; the rest
// (sun shadow map size, AO, MSAA) are discrete and change only at a camera cut (or when frames are badly over budget).
export const LEVERS = ['bloom', 'clouds', 'shadow', 'ao', 'msaa'];
export const CALIB_S = 20;         // calibration window of a match (after the 3 s warm-up): afterwards decisions are frozen-ish
const EASE_S = { bloom: 2.5, clouds: 2.5, ao: 0.8 };   // ramp durations (AO only changes at a cut)

function isSoftwareGL(renderer) {
  try {
    const gl = renderer.getContext();
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    return /swiftshader|llvmpipe|softpipe|software|basic render/i.test(String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)));
  } catch (e) { return false; }
}

// ---------------------------------------------------------------------------------------------------------- PerfSystem
export class PerfSystem {
  constructor(ctx) {
    this.ctx = ctx; this.app = ctx.app; this.pipe = ctx.pipeline;
    this.inst = PerfSystem.count = (PerfSystem.count || 0) + 1;
    const app = this.app, P = app.params || new URLSearchParams('');
    const boot = app.mtPerfBoot || bootProfile(P, app);
    this.boot = boot;
    this.software = isSoftwareGL(ctx.renderer);
    this.pixelMode = P.get('pixel') === '1';
    const aq = P.get('autoquality');
    // what the URL pins: ?quality= the tier, ?dpr= / ?look.renderScale= / ?pixel=1 the scale. A plain boot (the public build)
    // is fully automatic; any pin keeps the legacy behaviour (every test tool pins quality + dpr), as does software GL
    // (SwiftShader frames take seconds: it would sit at the floor). ?autoquality=1 forces it on, =0 off.
    this.canTier = !P.has('quality') && !P.has('scenario');
    this.canScale = !this.pixelMode && !P.has('dpr') && !P.has('look.renderScale');
    this.auto = aq === '1' ? true : aq === '0' ? false : this.canTier && this.canScale && !this.software;
    const tier = this.pipe.quality;
    this.gov = new Governor({
      scale: this.canScale ? boot.scale : 1, minScale: boot.minScale, softMin: boot.softMin, tier, bestTier: tier, ladder: LEVERS.length,
      canScale: this.canScale, canTier: this.canTier, canPass: true,
    });
    this.want = { shadow: true, bloom: true, clouds: true, ao: true, msaa: true };
    this.base = null;            // look values saved when a lever engaged (bloomStrength, aoStrength)
    this.ramp = { bloom: 1, ao: 1, clouds: 1 };
    this.prevFocus = null; this.prevAlive = true; this.cut = false; this.t = 0; this.frames = 0;
    this.fpsAcc = 0; this.fpsN = 0; this.fps = 0; this.gameFor = 0;
    if (this.auto) this.pipe.autoQuality = false;      // the legacy tier-only governor would fight this one
    this.overlayOn = P.get('perf') === '1';
    this.api = this.publish();
    if (this.auto && this.canScale) this.applyScale(this.gov.scale);
    if (!this.auto) { this.canScale = false; this.canTier = false; }
    const onCut = () => { this.cut = true; };
    if (app.on) { app.on('match', () => { onCut(); this.gameFor = 0; }); app.on('state', onCut); }
    this.overlay = null;
  }

  publish() {
    const self = this;
    const api = {
      get fps() { return self.fps; }, get ms() { return self.ms || 0; }, get cpu() { return self.cpuMs || 0; },
      get scale() { return self.sceneScale(); },
      get px() { return +(self.sceneScale() * self.canvasPR()).toFixed(3); },
      get canvas() { return self.canvasPR(); },
      get tier() { return self.pipe.quality; },
      get auto() { return self.auto; }, set auto(v) { self.auto = !!v; if (v) self.pipe.autoQuality = false; },
      get cls() { return self.boot.cls; }, get level() { return self.gov.level; },
      get lever() { return self.gov.level > 0 ? LEVERS[self.gov.level - 1] : null; },
      get levers() { return { ...self.want }; },
      get log() { return self.gov.log.slice(); },
      boot: this.boot, software: this.software,
      set: (o = {}) => { if (o.auto != null) api.auto = o.auto; const a = this.gov.force(this.t, o); this.applyAction(a); return this.gov.state; },
      stats: () => ({ ...this.gov.state, fps: this.fps, p75: this.ms, cpu: this.cpuMs, auto: this.auto, canScale: this.canScale, canTier: this.canTier, cls: this.boot.cls,
        canvasPR: this.canvasPR(), sceneScale: this.sceneScale(), rt: this.pipe.post && this.pipe.post.sceneRT ? [this.pipe.post.sceneRT.width, this.pipe.post.sceneRT.height] : null,
        samples: this.pipe.post ? this.pipe.post.samples : null, shadow: this.pipe.sun && this.pipe.sun.shadow ? this.pipe.sun.shadow.mapSize.x : null,
        levers: { ...this.want }, changes: this.gov.changes, pending: this.gov.pending ? { ...this.gov.pending.to, dir: this.gov.pending.dir } : null, gate: this.gate, window: this.gov.count, gameFor: +this.gameFor.toFixed(2), frames: this.frames, inst: this.inst, log: this.gov.log.slice(-12) }),
      governor: this.gov,
    };
    this.app.mtPerf = api;
    return api;
  }

  canvasPR() { return this.pipe.stats ? this.pipe.stats.pixelRatio : 1; }
  sceneScale() { const p = this.pipe.post; return p ? +(p.sceneScale || 1).toFixed(3) : 1; }

  // ---- appliers ---------------------------------------------------------------------------------------------
  applyScale(s) {
    const post = this.pipe.post;
    if (!post || post.pixelMode) return;
    s = Math.round(s * 1000) / 1000; this.applied = s;
    post.scaleOverride = s >= 0.999 ? 1 : s;                      // scene RT (+ AO, bloom) only; final + sharpen keep the canvas size
    if (post.cfg) { post.applySizes(); this.pipe.stats.sceneScale = post.sceneScale; }
    this.sharpenFor(s);
  }
  /** the display-space sharpen (runs at canvas size after the bilinear upsample) gets stronger as the scene shrinks:
   *  x1 at full scale, x1.5 at 0.6 — keeps edges and sprite pixels from going soft. Preserves the look owner's base. */
  sharpenFor(s) {
    const look = this.pipe.look; if (!look || !('sharpen' in look)) return;
    if (this.sharpBase == null || look.sharpen !== this.sharpSet) this.sharpBase = look.sharpen;
    const k = s >= 0.999 ? 1 : 1 + 1.25 * (1 - Math.max(0.6, s));
    this.sharpSet = look.sharpen = +(this.sharpBase * k).toFixed(4);
    this.lowSharpen(s);
  }
  /** tiers without the sharpen pass (low): switch that one display-space pass on while the scene is upsampled (re-asserted
   *  every frame: legacy configure() puts the tier table back on resize / tier change) */
  lowSharpen(s) {
    const post = this.pipe.post; if (!post || !post.cfg || post.pixelMode) return;
    const want = s < 0.95;
    if (want && post.cfg.sharpen === false) { this.cfgTier = post.cfg; post.cfg = Object.assign({}, post.cfg, { sharpen: true, mtSharpen: true }); post.updateSharpen(); }
    else if (!want && post.cfg.mtSharpen && this.cfgTier) { post.cfg = this.cfgTier; this.cfgTier = null; post.updateSharpen(); }
  }
  applyAction(a) {
    if (!a) return;
    if (a.type === 'tier' && a.tier !== this.pipe.quality) {
      this.pipe.setQuality(a.tier);                                  // recompiles tier variants: only at cuts
      if (this.app.mtPrewarm && this.app.mtPrewarm.run) this.app.mtPrewarm.run({ reason: 'tier', force: false });
    }
    // the scale changes in ONE step, and (governor policy) only at a camera cut or when frames are badly over budget: a
    // gradual chase pulses the image sharp / soft and re-snaps every sprite on a new grid several times
    if (a.dir === 'set' || this.canScale) this.applyScale(this.gov.scale);
    for (let i = 0; i < LEVERS.length; i++) this.want[LEVERS[i]] = i >= this.gov.level;
    if (this.overlay) this.overlayLog = a;
  }
  /** Pass levers. A lever only touches the pipeline while it is engaged (off, or ramping back on): legacy code owns the
   *  state otherwise. While engaged it is re-asserted every frame (legacy configure() on resize / tier change resets
   *  passes, samples and the shadow map size). Bloom and the cloud decal ramp over 2.5 s, AO over 0.8 s (no pop). */
  assertLevers(dt) {
    const p = this.pipe, post = p.post, look = p.look, W = this.want, E = this.engaged || (this.engaged = {});
    if (!post || !look || !post.cfg) return;
    const cfg = post.cfg;
    const ramp = (name, want) => { const k = Math.min(1, dt / (EASE_S[name] || 0.8)), r = this.ramp[name] ?? 1; const nr = want > r ? Math.min(1, r + k) : want < r ? Math.max(0, r - k) : r; this.ramp[name] = nr; return nr; };
    // bloom / AO: strength ramps to 0, then the pass is skipped (the final pass keeps its defines: no recompile)
    for (const [name, pass, key] of [['bloom', post.bloomPass, 'bloomStrength'], ['ao', post.aoPass, 'aoStrength']]) {
      if (!cfg[name]) { if (E[name]) { E[name] = false; this.ramp[name] = 1; if (this.base && this.base[name] != null) look[key] = this.base[name]; } continue; }
      if (!W[name] && !E[name]) { E[name] = true; (this.base || (this.base = {}))[name] = look[key]; }
      if (!E[name]) continue;
      const nr = ramp(name, W[name] ? 1 : 0);
      look[key] = this.base[name] * nr;
      const on = nr > 0; if (pass.enabled !== on) pass.enabled = on;
      if (nr >= 1 && W[name]) { E[name] = false; look[key] = this.base[name]; }   // fully back: hand control back
    }
    // shadow map resolution: half while the lever is off
    const sh = p.sun && p.sun.shadow;
    if (sh) {
      const tierSize = p.quality === 'low' ? 1024 : 2048, size = W.shadow ? tierSize : Math.max(512, tierSize / 2);
      if ((!W.shadow || E.shadow) && sh.mapSize.x !== size) { sh.mapSize.set(size, size); if (sh.map) { sh.map.dispose(); sh.map = null; } }
      E.shadow = !W.shadow;
    }
    // MSAA on the scene target: 0 while the lever is off. While the governor scales the scene, the tier's sample count
    // follows the EFFECTIVE scene density (legacy keys it on the canvas ratio: a native-res canvas >= 1.75 gets no MSAA
    // even when the scene renders at 1.3 px/pt); otherwise the tier's value once when the lever comes back.
    const rt = post.sceneRT;
    if (rt && !post.pixelMode) {
      const pr = post.pixelRatio, eff = this.auto && this.canScale ? pr * (post.sceneScale || 1) : pr;
      const tierS = (post.sceneScaleFor(cfg, pr) > 1 ? (cfg.samplesScaled ?? cfg.samples) : eff >= 1.75 ? cfg.samplesHiDpi : cfg.samples) | 0;
      if (!W.msaa) { if (post.samples !== 0) post.ensureSceneTarget(rt.width, rt.height, 0); E.msaa = true; }
      else if (E.msaa || (this.auto && this.canScale)) {
        if (post.samples !== tierS) post.ensureSceneTarget(rt.width, rt.height, tierS);
        E.msaa = false;
      }
    }
    // ambient cloud-shadow decal (a full-screen blended layer): strength ramps to 0, then the field is disabled
    // (cloudAt() returns 0 too, so sprite shading under clouds follows the decal)
    const amb = typeof window !== 'undefined' ? window.__mtAmbient : null, C = amb && amb.clouds;
    if (C && 'strength' in C) {
      if (!W.clouds && !E.clouds) { E.clouds = true; this.cloudBase = C.strength; }
      if (E.clouds) {
        const nr = ramp('clouds', W.clouds ? 1 : 0);
        C.strength = this.cloudBase * nr; C.enabled = nr > 0;
        if (nr >= 1 && W.clouds) { E.clouds = false; C.strength = this.cloudBase; C.enabled = true; }
      }
    }
  }

  // ---- per frame ----------------------------------------------------------------------------------------------
  update(f) {
    const app = this.app, dt = Math.max(0, f.dt || 0);
    this.t += dt; this.frames++;
    // fps for the overlay / api (every state)
    this.fpsAcc += dt; this.fpsN++;
    if (this.fpsAcc >= 0.5) { this.fps = Math.round(this.fpsN / this.fpsAcc); this.fpsAcc = 0; this.fpsN = 0; }
    const m = app.metrics || {};
    const cpu = Math.max(0, (m.frameMs || 0) - (m.renderMs || 0));     // JS logic of the previous frame (sim + updates)
    // camera cut: match/state events, a big focus jump (respawn, teleport, minimap look), local player death
    const rig = this.pipe.cameraRig;
    if (rig) {
      const fx = rig.focusX, fy = rig.focusY;
      if (this.prevFocus && Math.hypot(fx - this.prevFocus[0], fy - this.prevFocus[1]) > 6) this.cut = true;
      this.prevFocus = [fx, fy];
    }
    const me = f.world && f.world.units && f.world.units.get(f.playerId);
    const alive = !!(me && me.alive);
    if (this.prevAlive && !alive && me) this.cut = true;
    this.prevAlive = alive;
    const hidden = typeof document !== 'undefined' && document.hidden;
    const prewarm = app.mtPrewarm && app.mtPrewarm.busy;
    if (f.state === 'game') this.gameFor += dt; else this.gameFor = 0;
    const active = this.auto && f.state === 'game' && !app.paused && !hidden && !prewarm && this.gameFor > 3 && (!app.ui || app.ui.panel === 'none');
    this.gate = active ? 'active' : !this.auto ? 'fixed' : f.state !== 'game' ? 'state:' + f.state : app.paused ? 'paused' : hidden ? 'hidden' : prewarm ? 'prewarm' : this.gameFor <= 3 ? 'warmup' : 'panel:' + app.ui.panel;
    if (active) this.gov.push(this.t, dt * 1000, cpu);
    const cutNow = this.cut;
    const a = this.auto ? this.gov.update(this.t, { active, cut: cutNow, calib: this.gameFor < 3 + CALIB_S }) : null;
    this.cut = false;
    if (a) { this.applyAction(a); if (typeof console !== 'undefined') console.info('[mt-perf]', a.dir, a.reason, '→ scale', a.scale, 'level', a.level, a.tier); }
    this.assertLevers(dt);                 // no-op unless a lever is engaged
    // the scene target holds the governor's scale (re-applied if someone reset it)
    if (this.auto && this.canScale && this.pipe.post && !this.pipe.post.pixelMode) {
      const cur = this.applied ?? this.gov.scale;
      if (Math.abs((this.pipe.post.scaleOverride || 1) - (cur >= 0.999 ? 1 : cur)) > 1e-3) this.applyScale(cur);
      else if (this.frames % 15 === 0) this.lowSharpen(cur);
    }
    // published stats (cheap: every 0.5 s)
    if (this.frames % 30 === 0 && this.gov.count) { const st = this.gov.stats(this.t); if (st) { this.ms = +st.p75.toFixed(1); this.cpuMs = +st.cpu75.toFixed(1); } }
    else if (!active && this.frames % 30 === 0) { this.ms = +((m.frameMs || 0)).toFixed(1); this.cpuMs = +cpu.toFixed(1); }
    if (this.overlayOn) this.drawOverlay(dt);
  }

  // ---- ?perf=1 overlay (DOM, top-left under the safe area; pointer-events none) --------------------------------------
  drawOverlay(dt) {
    if (typeof document === 'undefined') return;
    if (!this.overlay) {
      const d = document.createElement('div');
      d.id = 'mt-perf';
      d.style.cssText = 'position:fixed;left:max(6px,env(safe-area-inset-left));top:40%;z-index:60;pointer-events:none;'
        + 'font:11px/1.3 ui-monospace,Menlo,monospace;color:#e8f6ff;background:rgba(8,14,24,.72);padding:4px 6px;border-radius:4px;white-space:pre';
      const c = document.createElement('canvas'); c.width = 160; c.height = 34; c.style.cssText = 'display:block;width:160px;height:34px;margin-top:3px';
      const tx = document.createElement('div');
      d.appendChild(tx); d.appendChild(c); document.body.appendChild(d);
      this.overlay = { d, tx, c, g: c.getContext('2d'), hist: new Float32Array(160), i: 0, acc: 0 };
    }
    const O = this.overlay;
    O.hist[O.i] = dt * 1000; O.i = (O.i + 1) % O.hist.length;
    O.acc += dt; if (O.acc < 0.25) return; O.acc = 0;
    const s = this.sceneScale(), pr = this.canvasPR(), st = this.gov.state;
    const lv = this.gov.level ? ' -' + LEVERS.slice(0, this.gov.level).join(' -') : '';
    O.tx.textContent = `${this.fps} fps  p75 ${this.ms || '-'} ms  js ${this.cpuMs || '-'}\n${this.pipe.quality}  scene ${s.toFixed(2)}×${pr} = ${(s * pr).toFixed(2)} px/pt${lv}\n${this.auto ? this.gate || 'auto' : 'fixed'} ${this.boot.cls}${this.gov.wantTier != null ? ' (tier→' + TIERS[this.gov.wantTier] + ' at cut)' : ''}${this.gov.verify ? ' verifying' : ''}${this.gov.pending ? ' (' + this.gov.pending.dir + ' at cut)' : ''}\n${(this.gov.log[this.gov.log.length - 1] || '').slice(0, 64)}`;
    const g = O.g, H = 34, n = O.hist.length; g.clearRect(0, 0, n, H);
    g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(0, H - 16.7, n, 1); g.fillRect(0, H - 33.3 * 0.9, n, 1);
    for (let k = 0; k < n; k++) { const v = O.hist[(O.i + k) % n]; g.fillStyle = v > 22 ? '#ff6a5a' : v > 17.5 ? '#ffd166' : '#7ee08a'; g.fillRect(k, H - Math.min(H, v * 0.9), 1, Math.min(H, v * 0.9)); }
  }

  dispose() { if (this.overlay) this.overlay.d.remove(); if (this.app.mtPerf === this.api) this.app.mtPerf = null; }
}
