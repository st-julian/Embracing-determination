// mt/voxel/units/diag.js — device ground truth for the voxel units (owner: voxel units runtime).
//   VDIAG            shared record: shader errors, the units self-test, the sprite fallback (if any)
//   watchShaders(r)  wraps renderer.debug.onShaderError: every compile / link error is logged (console.error, with the
//                    program + shader info logs) and kept in VDIAG.shaderErrors; `unit` marks the voxel unit program
//   ?diag=1          a plain-DOM text overlay on top of the game (refreshed every second): GL renderer / version / limits,
//                    shader errors, every three.js program with its diagnostics, the voxel unit stats + the first unit's
//                    transform / bounding sphere / draw range, app errors and the first JS errors. Screenshot it.
export const VDIAG = { shaderErrors: [], selfTest: null, fallback: null, jsErrors: [], programCheck: null };

const clip = (s, n) => { s = String(s == null ? '' : s).trim(); return s.length > n ? s.slice(0, n) + '…' : s; };

export function watchShaders(r) {
  if (!r || !r.debug || r.debug.mtWatched) return;
  const prev = typeof r.debug.onShaderError === 'function' ? r.debug.onShaderError : null;
  r.debug.mtWatched = true;
  r.debug.onShaderError = (gl, program, vs, fs) => {
    let e;
    try {
      const src = gl.getShaderSource(vs) || '';
      e = {
        unit: src.indexOf('aHull') >= 0, link: gl.getProgramParameter(program, gl.LINK_STATUS),
        vsOk: gl.getShaderParameter(vs, gl.COMPILE_STATUS), fsOk: gl.getShaderParameter(fs, gl.COMPILE_STATUS),
        program: clip(gl.getProgramInfoLog(program), 600), vs: clip(gl.getShaderInfoLog(vs), 600), fs: clip(gl.getShaderInfoLog(fs), 600),
      };
    } catch (x) { e = { unit: false, error: String(x) }; }
    if (VDIAG.shaderErrors.length < 12) VDIAG.shaderErrors.push(e);
    console.error('[mt] WebGL shader error' + (e.unit ? ' (voxel unit program)' : '') + ': program log: ' + (e.program || '-') + ' | vertex log: ' + (e.vs || '-') + ' | fragment log: ' + (e.fs || '-'));
    if (prev) try { prev(gl, program, vs, fs); } catch (x) { /* their handler */ }
  };
}

// ---------------------------------------------------------------------------------------------------- ?diag=1 overlay
let diagOn = false;
try { diagOn = typeof window !== 'undefined' && new URLSearchParams(location.search).get('diag') === '1'; } catch (e) { diagOn = false; }
if (diagOn) startOverlay();

function startOverlay() {
  const push = (s) => { if (VDIAG.jsErrors.length < 8) VDIAG.jsErrors.push(clip(s, 300)); };
  addEventListener('error', (e) => push('error: ' + (e.message || e.type) + (e.filename ? ' @' + String(e.filename).split('/').pop() + ':' + e.lineno : '')));
  addEventListener('unhandledrejection', (e) => push('rejection: ' + (e.reason && (e.reason.stack || e.reason.message) || e.reason)));
  const ce = console.error.bind(console);
  console.error = (...a) => { push('console.error: ' + a.map((x) => (x && x.message) || String(x)).join(' ')); ce(...a); };
  let el = null, models = null;
  const tick = () => {
    const app = window.__moba, r = app && app.pipeline && app.pipeline.renderer;
    if (r) watchShaders(r);
    if (!models && app && app.mtVoxelUnits) { models = 1; import('../models/index.js').then((m) => { models = m; }, () => { models = null; }); }   // voxel look only
    if (!document.body) return;
    if (!el) {
      el = document.createElement('pre'); el.id = 'mt-diag';
      el.style.cssText = 'position:fixed;left:0;top:0;z-index:2147483647;margin:0;padding:6px 8px;max-width:72vw;max-height:100vh;overflow:hidden;'
        + 'background:rgba(0,0,0,0.82);color:#e8f4ff;font:11px/1.3 ui-monospace,Menlo,monospace;white-space:pre-wrap;word-break:break-all;pointer-events:none';
      document.body.appendChild(el);
    }
    let t;
    try { t = report(app, r, models); } catch (e) { t = 'diag report failed: ' + (e && e.stack || e); }
    el.textContent = t;
  };
  setInterval(tick, 1000); setTimeout(tick, 100);
}

function report(app, r, models) {
  const L = [];
  L.push('MT DIAG  ' + new Date().toISOString().slice(11, 19) + '  ' + location.search);
  L.push('ua: ' + clip(navigator.userAgent, 160));
  L.push('css ' + innerWidth + 'x' + innerHeight + ' dpr ' + devicePixelRatio + '  world ' + (app && app.mtWorldStyle) + '  input ' + (app && app.mtInputMode)
    + '  tier ' + (app && app.mtPerf ? app.mtPerf.tier + ' scale ' + app.mtPerf.scale + ' fps ' + Math.round(app.mtPerf.fps || 0) : '?'));
  if (!r) { L.push('renderer: not yet'); return L.join('\n'); }
  const gl = r.getContext(), dbg = gl.getExtension('WEBGL_debug_renderer_info');
  L.push('GL ' + gl.getParameter(gl.VERSION) + ' | ' + gl.getParameter(gl.SHADING_LANGUAGE_VERSION));
  L.push('renderer ' + gl.getParameter(gl.RENDERER) + ' | ' + gl.getParameter(gl.VENDOR) + (dbg ? ' | ' + gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) + ' / ' + gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : ''));
  const P = (k) => gl.getParameter(gl[k]);
  L.push('limits vUniformVec ' + P('MAX_VERTEX_UNIFORM_VECTORS') + ' fUniformVec ' + P('MAX_FRAGMENT_UNIFORM_VECTORS') + ' varyingVec ' + P('MAX_VARYING_VECTORS')
    + ' vTexUnits ' + P('MAX_VERTEX_TEXTURE_IMAGE_UNITS') + ' texUnits ' + P('MAX_TEXTURE_IMAGE_UNITS') + ' texSize ' + P('MAX_TEXTURE_SIZE') + ' attribs ' + P('MAX_VERTEX_ATTRIBS'));
  const hp = gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.HIGH_FLOAT), mp = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.MEDIUM_FLOAT);
  L.push('precision three ' + (r.capabilities && r.capabilities.precision) + '  vs highp ' + (hp && hp.precision) + '  fs mediump ' + (mp && mp.precision)
    + '  checkShaderErrors ' + (r.debug && r.debug.checkShaderErrors) + '  ctxLost ' + gl.isContextLost() + '  glError ' + gl.getError());
  // voxel units
  const V = app.mtVoxelUnits;
  L.push('');
  L.push('VOXEL UNITS  fallback: ' + (VDIAG.fallback || 'no') + '  off flag: ' + (app.mtVoxelUnitsOff || 'no'));
  L.push('self-test: ' + JSON.stringify(VDIAG.selfTest));
  L.push('program check: ' + JSON.stringify(VDIAG.programCheck));
  L.push('models: ' + (models && models !== 1 ? 'baked ' + (models.isBaked ? models.isBaked() : '?') + ' ' + JSON.stringify(models.stats ? { baked: models.stats.baked, live: models.stats.live, bytes: models.stats.bytes, loadMs: Math.round(models.stats.loadMs || 0), error: models.stats.error } : {}) : 'module not loaded'));
  if (V) { try { L.push(JSON.stringify(V.diagInfo())); } catch (e) { L.push('diagInfo failed: ' + e); } } else L.push('runtime: not created');
  // shader errors + programs
  L.push('');
  L.push('SHADER ERRORS (' + VDIAG.shaderErrors.length + ')');
  for (const e of VDIAG.shaderErrors.slice(0, 6)) L.push(clip(JSON.stringify(e), 900));
  const progs = (r.info && r.info.programs) || [];
  L.push('PROGRAMS (' + progs.length + ')');
  for (const p of progs) {
    const unit = String(p.cacheKey || '').indexOf('mt-voxel-unit') >= 0, d = p.diagnostics;
    if (!unit && !d) continue;   // the world's healthy programs: counted only
    L.push((unit ? '* unit ' : '  ') + p.id + ' ' + p.name + ' used ' + p.usedTimes + (unit ? ' key …' + String(p.cacheKey).slice(-40) : '')
      + (d ? ' runnable ' + d.runnable + ' prog: ' + clip(d.programLog, 300) + ' vs: ' + clip(d.vertexShader && d.vertexShader.log, 300) + ' fs: ' + clip(d.fragmentShader && d.fragmentShader.log, 300) : ' ok'));
  }
  // errors
  L.push('');
  const ae = app.errors ? (Array.isArray(app.errors) ? app.errors : Object.keys(app.errors)) : [];
  L.push('app.errors (' + ae.length + '): ' + clip(ae.slice(0, 6).map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' | '), 600));
  L.push('JS errors (' + VDIAG.jsErrors.length + '):');
  for (const e of VDIAG.jsErrors) L.push('  ' + e);
  return L.join('\n');
}
