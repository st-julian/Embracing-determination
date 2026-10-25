// mt/ui/index.js — the 'mt-ui' subsystem (registered in the legacy subsystem table `Rk`, [MT-HOOK] subsystems).
// Owner: architecture. Composes local-player management, keyboard + gamepad input, HUD and lobby. Each part is
// updated in its own guarded block (a failing part is skipped after 120 consecutive errors, others keep running).

import { LocalPlayers } from './input/localPlayers.js';
import { KeyboardInput } from './input/keyboard.js';
import { GamepadInput } from './input/gamepad.js';
import { MtHud } from './hud.js';
import { Lobby } from './lobby.js';
import { TitleScreen } from './title.js'; // front-end screens: staged title (additive)
import { NetController } from '../net/online.js'; // online play (claude.ai room capability): app.mtNet (additive)

export default class MtUi {
  constructor(ctx) {
    this.ctx = ctx; this.parts = []; this.errors = {};
    this.locals = new LocalPlayers(ctx);
    try { this.net = new NetController(ctx); } catch (e) { console.error('[mt-ui] ctor net', e); this.net = null; } // before the lobby (it reads app.mtNet)
    const add = (name, make) => { try { const inst = make(); this.parts.push({ name, inst, fails: 0 }); return inst; } catch (e) { console.error('[mt-ui] ctor ' + name, e); return null; } };
    this.keyboard = add('keyboard', () => new KeyboardInput(ctx, this.locals));
    this.gamepad = add('gamepad', () => new GamepadInput(ctx, this.locals));
    this.hud = add('hud', () => new MtHud(ctx));
    this.lobby = add('lobby', () => new Lobby(ctx));
    this.title = add('title', () => new TitleScreen(ctx)); // front-end screens (additive)
    if (this.net) this.parts.push({ name: 'net', inst: this.net, fails: 0 }); // online: room polling, presence, overlays (additive)
    // ?mtscenario=<name>: boot straight into an mt.debug.setup fixture (screenshots / manual testing)
    const sc = ctx.app.params && ctx.app.params.get('mtscenario');
    if (sc && ctx.app.mt && ctx.app.mt.debug) {
      try { ctx.app.mt.debug.setup(sc); ctx.app.state = 'game'; ctx.app.fire('state', 'game'); } catch (e) { console.error('[mt-ui] mtscenario', e); }
    }
  }
  update(f) {
    for (const p of this.parts) {
      if (p.fails > 120 || !p.inst.update) continue;
      try { p.inst.update(f); p.fails = 0; } catch (e) {
        p.fails++;
        const r = this.errors[p.name] || (this.errors[p.name] = { count: 0, last: '' }); r.count++; r.last = String(e && e.stack || e).slice(0, 400);
        if (r.count <= 3) console.error('[mt-ui:' + p.name + ']', e);
        const app = f.app; if (app && app.errors) { const g = app.errors['mt-ui:' + p.name] || (app.errors['mt-ui:' + p.name] = { count: 0, last: '' }); g.count++; g.last = r.last; }
      }
    }
  }
  dispose() { for (const p of this.parts) if (p.inst.dispose) p.inst.dispose(); }
}
