// mt/render/index.js — the 'mt-render' subsystem (registered in the legacy subsystem table `Rk`, [MT-HOOK] subsystems).
// Owner: architecture. Composes the mt render parts; each part is updated in a guarded block so one failing
// part never disables the others. Contract: `new MtRender(ctx)` with ctx = {THREE, app, scene, camera, renderer,
// pipeline, registry, world(getter)}; `update(frame)` every frame with frame = {dt,time,alpha,events,world,
// viewerTeam,playerId,state,app}.

import { SpriteSystem } from './sprites.js';
import { MtFx } from './fx.js';
import { SharedCamera } from './camera.js';
import { AmbientSystem } from './ambient.js';   // ambient-life artist: world animation layer (registration only)
import { ShaderPrewarm } from './prewarm.js';   // architecture: shader precompile (app.mtPrewarm, QA bug 9)

export default class MtRender {
  constructor(ctx) {
    this.ctx = ctx;
    this.parts = [];
    this.errors = {};
    const add = (name, make) => { try { this.parts.push({ name, inst: make(), fails: 0 }); } catch (e) { console.error('[mt-render] ctor ' + name, e); } };
    add('sprites', () => (this.sprites = new SpriteSystem(ctx)));
    add('fx', () => new MtFx(ctx));
    add('camera', () => new SharedCamera(ctx));
    add('ambient', () => new AmbientSystem(ctx));
    add('prewarm', () => new ShaderPrewarm(ctx));    // last: every other part has built its meshes by now
  }
  update(f) {
    for (const p of this.parts) {
      if (p.fails > 120) continue;
      try { p.inst.update(f); p.fails = 0; } catch (e) {
        p.fails++;
        const r = this.errors[p.name] || (this.errors[p.name] = { count: 0, last: '' }); r.count++; r.last = String(e && e.stack || e).slice(0, 400);
        if (r.count <= 3) console.error('[mt-render:' + p.name + ']', e);
        const app = f.app; if (app && app.errors) { const g = app.errors['mt-render:' + p.name] || (app.errors['mt-render:' + p.name] = { count: 0, last: '' }); g.count++; g.last = r.last; }
      }
    }
  }
  dispose() { for (const p of this.parts) if (p.inst.dispose) p.inst.dispose(); }
}
