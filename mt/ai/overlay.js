// mt/ai/overlay.js — QA overlay for the trainer bot brain (`?botdebug`). Owner: AI specialist.
// A fixed DOM panel (top-left, below the HUD scores) listing every trainer's current goal, reason, top utility
// scores and last action, plus each team's call. Pure read-only view of `world.mt.trainerBot.state()`; it never
// touches sim state. Toggle with F8.

const COLORS = ['#3d7be0', '#e0533d'];
const GOAL_COLORS = {
  CAPTURE: '#f2c230', FARM_LANE: '#9ad06a', JUNGLE: '#4fb07a', FIGHT: '#ff6b4a', RETREAT: '#b48cff', DEFEND: '#5bc0ff',
  PUSH: '#ff9a3c', OBJECTIVE: '#ff4fa3', EVOLVE: '#ffffff', RECALL: '#8fa3b8', END: '#ff2d2d', DEAD: '#666', IDLE: '#999',
};

const esc = (s) => String(s == null ? '' : s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

export function start() {
  if (typeof document === 'undefined') return;
  const el = document.createElement('div');
  el.id = 'mt-bot-debug';
  el.style.cssText = 'position:fixed;left:8px;top:64px;z-index:99999;max-width:min(560px,calc(100vw - 16px));font:11px/1.35 ui-monospace,Menlo,Consolas,monospace;' +
    'color:#f4f1e8;background:rgba(14,20,36,.78);border:1px solid rgba(255,255,255,.18);border-radius:8px;padding:6px 8px;pointer-events:none;white-space:normal';
  document.body.appendChild(el);
  let shown = true;
  addEventListener('keydown', (e) => { if (e.key === 'F8') { shown = !shown; el.style.display = shown ? '' : 'none'; } });
  const draw = () => {
    const app = globalThis.__moba, mt = app && app.world && app.world.mt;
    if (!mt || !mt.trainerBot || !shown) return;
    let st; try { st = mt.trainerBot.state(); } catch (e) { el.textContent = 'botState error: ' + e; return; }
    const m = Math.floor(st.time / 60), s = Math.floor(st.time % 60);
    let h = `<div style="opacity:.8">BOT BRAIN · ${m}:${String(s).padStart(2, '0')} · F8 hides</div>`;
    for (const T of st.teams) {
      const c = T.call;
      h += `<div style="margin-top:3px;color:${COLORS[T.team]};font-weight:700">${T.team ? 'RED' : 'BLUE'} ${c ? '· CALL ' + esc(c.kind.toUpperCase()) + (c.lane ? ' ' + esc(c.lane) : '') + ': ' + esc(c.why) : ''}</div>`;
      for (const b of st.bots.filter((x) => x.team === T.team)) {
        const gc = GOAL_COLORS[b.goal] || '#ddd';
        const top = (b.top || []).map(([g, v]) => `${g.toLowerCase()} ${v}`).join(' · ');
        const last = b.actions && b.actions.length ? b.actions[b.actions.length - 1] : null;
        h += `<div style="margin:2px 0 0 6px"><b>${esc(b.name)}</b> <span style="opacity:.7">[${esc(b.lane || '-')}, ${esc(b.spec)}, ${b.hp}%]</span> ` +
          `<span style="color:${gc};font-weight:700">${esc(b.goal)}</span> <span style="opacity:.9">${esc(b.why)}</span>` +
          `<div style="margin-left:10px;opacity:.65">${esc(b.party)}${top ? ' — ' + esc(top) : ''}${last ? ' — ' + last.t + 's ' + esc(last.text) : ''}</div></div>`;
      }
    }
    el.innerHTML = h;
  };
  setInterval(draw, 400);
}
