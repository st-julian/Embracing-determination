// mt/render/prewarm.js — shader precompile ("prewarm") so no program is compiled inside a visible game frame
// (QA bug 9). Owner: architecture. Published as `app.mtPrewarm`.
//
// Why the first in-game frame used to compile ~40 programs although boot ran `renderer.compileAsync(scene)`:
// three keys programs on the render-target state (tone mapping / output colour space differ between "screen" and
// "any render target"). Boot compiled with NO target bound, but the scene pass draws into `post.sceneRT`, so every
// scene material (world art, structures, legacy vfx batches, mt sprites / fx / ambient) was compiled a second time
// in the first real frame. Here we compile with a (1×1) render target bound, so the keys match the scene pass.
//
// run({reason, force}) — what it does, in order:
//   1. names unnamed materials after their mesh (so `renderer.info.programs` and QA's mt-perf show who is who);
//   2. `renderer.compile()` of the whole scene (invisible / empty batches included: compile() traverses everything)
//      plus everything registered by owners for objects that are NOT in the scene yet (lazily built variants);
//   3. waits for KHR_parallel_shader_compile completion (no main-thread cost where the extension exists);
//   4. force=true: "first use" of every program (link status + diagnostics + uniform tables) in short time slices,
//      i.e. the work the first frame would otherwise do, then one 1×1 offscreen render (shadow-map depth programs). Default ON for real GPUs, OFF for software GL (SwiftShader:
//      it costs 30+ s there and would slow every headless test boot). URL: ?prewarm=1 forces it, ?prewarm=0 disables it.
// Triggers: boot ([MT-HOOK] prewarm in index-*.js replaces the legacy compileAsync), and 3 frames after every
// 'match' event (new world: per-match views exist by then). The legacy loading screen waits while `busy`
// ([MT-HOOK] prewarmHold in hud-*.js, capped at MAX_HOLD seconds).
//
// API for other owners:
//   app.mtPrewarm.register(name, fn)  fn() -> Object3D | Material | Array<Object3D|Material>: things to compile that are
//                                      not (always) in the scene, e.g. variants created on demand. Called on every run.
//   app.mtPrewarm.run({reason, force}) -> Promise<stats>;  app.mtPrewarm.busy;  app.mtPrewarm.last (stats of the last run)

const MAX_HOLD = 15;          // s the loading screen may wait for the prewarm
const SLICE_MS = 10;          // max main-thread time per slice when forcing first use outside of gameplay

function isSoftwareGL(renderer) {
  try {
    const gl = renderer.getContext();
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const s = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
    return /swiftshader|llvmpipe|softpipe|software|basic render/i.test(s);
  } catch (e) { return false; }
}

const nextTask = () => new Promise((r) => setTimeout(r, 0));

export class ShaderPrewarm {
  constructor(ctx) {
    this.ctx = ctx; this.T = ctx.THREE; this.R = ctx.renderer; this.app = ctx.app;
    this.rt = new this.T.WebGLRenderTarget(1, 1, { depthBuffer: false });
    this.rt.texture.name = 'mt-prewarm';
    this.geo = new this.T.BufferGeometry();
    this.geo.setAttribute('position', new this.T.Float32BufferAttribute([0, 0, 0, 0, 0, 0, 0, 0, 0], 3));
    this.software = isSoftwareGL(this.R);
    const p = this.app.params && this.app.params.get('prewarm');
    this.forceDefault = p === '1' ? true : p === '0' ? false : !this.software;
    this.registry = new Map();
    this.gen = 0; this.busy = false; this.pending = 0; this.last = null; this.runs = 0;
    this.app.mtPrewarm = this;
    this.app.on('match', () => { this.pending = 3; });
  }

  register(name, fn) { this.registry.set(name, fn); }

  /** true while the loading screen should keep waiting (t = seconds the loading screen has been up). */
  holdLoading(t) { return this.busy && t < MAX_HOLD; }

  update() {
    if (this.pending > 0 && --this.pending === 0) this.run({ reason: 'match' });
  }

  label(root) {
    root.traverse((o) => {
      const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : null;
      if (!mats) return;
      for (const m of mats) {
        if (!m || m.name) continue;
        let n = o.name, x = o.parent;
        while (!n && x) { n = x.name; x = x.parent; }   // nearest named ancestor
        m.name = (n || o.type) + (o.name ? '' : '/' + o.type) + ':' + m.type.replace('Material', '');
      }
    });
  }

  extraRoots() {
    const out = [];
    for (const [name, fn] of this.registry) {
      let r; try { r = fn(); } catch (e) { console.error('[mt-prewarm] ' + name, e); continue; }
      for (const x of Array.isArray(r) ? r : r ? [r] : []) {
        if (!x) continue;
        if (x.isMaterial) { if (!x.name) x.name = name; const m = new this.T.Mesh(this.geo, x); m.name = name; m.frustumCulled = false; out.push(m); }
        else if (x.isObject3D) { this.label(x); out.push(x); }
      }
    }
    return out;
  }

  /**
   * @param {{reason?:string, force?:boolean}} [o]
   * @returns {Promise<object>} stats {reason, materials, programs, newPrograms, forced, compileMs, readyMs, forceMs, totalMs}
   */
  async run(o = {}) {
    const gen = ++this.gen, R = this.R, pipe = this.ctx.pipeline, app = this.app;
    const force = o.force ?? this.forceDefault, reason = o.reason || 'manual';
    if (!pipe || !pipe.scene || !pipe.camera) return null;
    this.busy = true; this.runs++;
    const t0 = performance.now();
    const st = { reason, force, software: this.software, materials: 0, programs: 0, newPrograms: 0, forced: 0, extras: 0 };
    try {
      const scene = pipe.scene, cam = pipe.camera;
      const before = new Set((R.info.programs || []).map((p) => p.cacheKey));
      this.label(scene);
      const extras = this.extraRoots(); st.extras = extras.length;
      const prev = R.getRenderTarget();
      let mats;
      R.setRenderTarget(this.rt);   // scene-pass state: any non-null target gives the same program keys
      try {
        mats = R.compile(scene, cam);
        for (const x of extras) for (const m of R.compile(x, cam, scene)) mats.add(m);
      } finally { R.setRenderTarget(prev); }
      const programs = new Set();
      for (const m of mats) {
        const pr = R.properties.get(m);
        if (pr.programs) for (const p of pr.programs.values()) programs.add(p);
        else if (pr.currentProgram) programs.add(pr.currentProgram);
      }
      st.materials = mats.size; st.programs = programs.size;
      st.newPrograms = [...programs].filter((p) => !before.has(p.cacheKey)).length;
      st.compileMs = Math.round(performance.now() - t0);
      // parallel compile (KHR_parallel_shader_compile): wait without blocking; isReady() is true at once without it
      const t1 = performance.now();
      let waiting = [...programs];
      while (waiting.length && gen === this.gen && performance.now() - t1 < 20000) {
        waiting = waiting.filter((p) => p.program && !p.isReady());
        if (waiting.length) await new Promise((r) => setTimeout(r, 16));
      }
      st.readyMs = Math.round(performance.now() - t1);
      if (force && gen === this.gen) {
        const t2 = performance.now();
        let slice = performance.now();
        for (const p of programs) {
          if (gen !== this.gen) break;
          if (!p.program) continue;               // destroyed meanwhile
          p.getUniforms(); p.getAttributes(); st.forced++;
          const inGame = app.state === 'game';
          if (inGame || performance.now() - slice > SLICE_MS) { await nextTask(); slice = performance.now(); }
        }
        // one 1×1 offscreen render: the shadow pass compiles + first-uses three's internal depth materials (not covered
        // by compile()); scene programs exist already, so this costs the shadow-map raster only
        if (gen === this.gen && o.warmRender !== false) {
          const before2 = R.info.programs.length, prev2 = R.getRenderTarget();
          try { R.setRenderTarget(this.rt); R.render(pipe.scene, pipe.camera); } finally { R.setRenderTarget(prev2); }
          st.warmRenderPrograms = R.info.programs.length - before2;
        }
        st.forceMs = Math.round(performance.now() - t2);
      }
    } catch (e) {
      console.error('[mt-prewarm]', e);
      st.error = String(e && e.message || e);
    } finally {
      if (gen === this.gen) this.busy = false;
      st.totalMs = Math.round(performance.now() - t0);
      st.cancelled = gen !== this.gen;
      this.last = st;
    }
    return st;
  }

  dispose() { this.rt.dispose(); this.geo.dispose(); if (this.app.mtPrewarm === this) this.app.mtPrewarm = null; }
}
