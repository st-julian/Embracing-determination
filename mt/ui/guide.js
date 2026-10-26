// mt/ui/guide.js — in-game GUIDANCE: the current objective as a friendly banner (icon + big pixel text) top-centre
// under the HUD's top bar, plus a pixel arrow: over the target when it is on screen, else a compass around the trainer.
// Owner: UX flow. Built and updated by mt/ui/lobby.js (a guarded sub-part); render/UI only: it reads the world and
// never writes sim state.
//
//   catch    「やせいの ○○と たたかおう！」 Fight the wild ○○!   -> arrow over that wild monster
//            weakened: 「いまだ！ オーブを なげよう！ E」 Now! Throw an orb!
//   lane     「レーンへ いこう！」 Head to the lane!                -> where the waves meet
//   evolve   「○○が しんか できるよ！ T」 ○○ can evolve! (button)  -> your monster
//   push     「てきの タワーを こわそう！」 Knock down the tower!    -> the enemy structure your minions tank
//   help     「なかまを たすけよう！」 Help your teammate!          -> the ally in a fight
//   heal     「ベースに もどって かいふく！」 Go home and heal!       -> your fountain
// Source of truth: `app.mtGuide(unitId)` (gameplay: mt/sim/guide.js — {id, x, y, targetId, name, key, urgency, form,
// seconds}): it always has a current objective and decides what is done; any id with a 'guide.<id>' string shows.
// Without it the core steps (catch / lane / evolve / push) are derived here from the world (per match).
// Size: the banner is drawn in HUD pixels at a whole-device-pixel zoom, ~3 % of the screen height for the text and on
// touch layouts one step above the HUD's (~25 px text on an iPad, ~17 px on a phone); while the trainer or its monster
// is fighting it drops to the HUD's own size and fades a little, except for the "do it now" prompts (throw the orb,
// evolve). The × hides the current objective for 45 s.
// Nothing shows in all-bot matches, while dead (the HUD has the timer), paused, in a modal, under a HUD banner or the
// first-match controls card.

import { t, has, getLang, formName } from '../i18n/index.js';

const ICON = { catch: 'swords', catchNow: 'orb', lane: 'flag', evolve: 'star', push: 'tower', help: 'swords', heal: 'heart' };
const HOT = { catchNow: 1, evolve: 1 };   // "do it now" prompts: never shrink in a fight, gold banner
const LANE_OF = { baron: 'top', mid: 'mid', duo: 'bot' };
/** compass spots around the trainer's chest (HUD px) for the 8 directions, clockwise from 'right' (screen y down) */
const COMPASS = [[58, -6], [46, 40], [0, 52], [-46, 40], [-58, -6], [-70, -60], [0, -84], [70, -60]];

const CSS = `
#mt-guide{position:fixed;left:0;top:0;width:0;height:0;z-index:4;pointer-events:none;color:#1b2350}
#mt-guide *{box-sizing:border-box}
/* authored in HUD pixels (mt/ui/hud.css: 'Vale Pixel' 10 px, 1-px strokes; Japanese glyphs come from the HUD's JA face),
   zoomed with transform: scale() to a whole number of device px per HUD px (crisp) */
#mt-guide .gl{position:fixed;left:0;top:0;display:flex;align-items:center;gap:5px;height:24px;padding:2px 3px 2px 2px;font:10px/10px 'Vale Pixel Bold','Vale Pixel',ui-monospace,monospace;-webkit-font-smoothing:none;
  background:linear-gradient(180deg,#fffdf6 0%,#fffdf6 50%,#f2e9d2 100%);border:1px solid #1b2350;border-radius:6px;box-shadow:inset 0 0 0 1px #fff,0 2px 0 rgba(14,18,44,.45),0 3px 8px rgba(14,18,44,.3);
  white-space:nowrap;opacity:0;transition:opacity .3s;transform-origin:0 0}
#mt-guide .gl.on{opacity:1}
#mt-guide .gl.on.fight{opacity:.8}
#mt-guide .gl.hot{background:linear-gradient(180deg,#fff6c4 0%,#ffe680 55%,#ffd23a 100%)}
#mt-guide .gl .ic{width:20px;height:18px;flex:none;background:#ffcf3a;border:1px solid #1b2350;border-radius:4px;display:grid;place-items:center;box-shadow:inset 0 -2px 0 #e0a024}
#mt-guide .gl.hot .ic{background:#fffdf6;box-shadow:inset 0 -2px 0 #e6dbbf}
#mt-guide .gl .ic canvas{width:16px;height:16px;image-rendering:pixelated;display:block;margin-top:-1px}
#mt-guide .gl .tx{padding:0 1px;display:flex;align-items:center;gap:3px}
#mt-guide .gl .kb{display:inline-block;height:12px;line-height:10px;padding:0 3px;background:#1b2350;color:#fffdf6;border-radius:2px;font-family:'Vale Pixel',ui-monospace,monospace}
#mt-guide .gl .x{position:relative;pointer-events:auto;cursor:pointer;width:13px;height:18px;display:grid;place-items:center;color:#8188ad;border-left:1px solid #e6dbbf;touch-action:manipulation;font-family:'Vale Pixel',ui-monospace,monospace}
#mt-guide .gl .x::before{content:"";position:absolute;left:-10px;top:-10px;right:-10px;bottom:-10px}
#mt-guide .gl.new .ic{animation:gd-pop .6s steps(2,end) 2}
@keyframes gd-pop{50%{background:#fff1a8}}
#mt-guide canvas.ar{position:fixed;left:0;top:0;image-rendering:pixelated;opacity:0;transition:opacity .25s}
#mt-guide canvas.ar.on{opacity:1}
html.mt-swgl #mt-guide *{animation:none!important;transition:none!important}
`;

// ------------------------------------------------------------------------------------------------ pixel art
const cnv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
/** 16×16 step icons (ink on the gold tile) */
function iconCanvas(kind) {
  const c = cnv(16, 16), g = c.getContext('2d'); g.fillStyle = '#0d1230';
  const P = (rows) => rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === '#') g.fillRect(x, y, 1, 1); else if (ch === 'w') { g.fillStyle = '#fff6dc'; g.fillRect(x, y, 1, 1); g.fillStyle = '#0d1230'; } }));
  const A = {
    swords: ['................', '.##..........##.', '.#w#........#w#.', '..#w#......#w#..', '...#w#....#w#...', '....#w#..#w#....', '.....#w##w#.....', '......#ww#......', '......#ww#......', '.....#w##w#.....', '..##.##..##.##..', '..#w##....##w#..', '...##......##...', '..#..#....#..#..', '..##........##..', '................'],
    orb: ['................', '.....######.....', '...##wwwwww##...', '..#wwwwwwwwww#..', '..#wwwwwwwwww#..', '.#wwwwwwwwwwww#.', '.#wwwww##wwwww#.', '.######ww######.', '.#####w##w#####.', '.#############..', '..############..', '..############..', '...##########...', '.....######.....', '................', '................'],
    flag: ['................', '...##...........', '...#w###........', '...#wwww###.....', '...#wwwwwww##...', '...#wwwwwwwww#..', '...#wwwwwww##...', '...#wwww###.....', '...#w###........', '...##...........', '...##...........', '...##...........', '...##...........', '..####..........', '.######.........', '................'],
    star: ['................', '.......##.......', '......#ww#......', '......#ww#......', '.....#wwww#.....', '###########wwww#', '#wwwwwwwwwwwww#.', '.#wwwwwwwwwww#..', '..#wwwwwwwww#...', '...#wwwwwww#....', '...#www##www#...', '..#ww##..##ww#..', '..#w#......#w#..', '.##..........##.', '................', '................'],
    heart: ['................', '..####....####..', '.#wwww#..#wwww#.', '#wwwwww##wwwwww#', '#wwwwwwwwwwwwww#', '#wwwwwwwwwwwwww#', '#wwwwwwwwwwwwww#', '.#wwwwwwwwwwww#.', '..#wwwwwwwwww#..', '...#wwwwwwww#...', '....#wwwwww#....', '.....#wwww#.....', '......#ww#......', '.......##.......', '................', '................'],
    tower: ['................', '...##.##.##.....', '...#w#w#w#w#....', '...#wwwwwww#....', '....#wwwww#.....', '....#w###w#.....', '....#w#.#w#.....', '....#wwwww#.....', '....#wwwww#.....', '....#ww#ww#.....', '...#wwwwwww#....', '...#wwwwwww#....', '..#wwwwwwwww#...', '..###########...', '................', '................'],
  };
  P(A[kind] || A.star);
  return c;
}
/** a chunky downward pixel arrow (cream with an ink outline), 15×13 */
function arrowCanvas() {
  const rows = ['..###########..', '..#wwwwwwwww#..', '..#wwwwwwwww#..', '..#wwwwwwwww#..', '###wwwwwwwww###', '#wwwwwwwwwwwww#', '.#wwwwwwwwwww#.', '..#wwwwwwwww#..', '...#wwwwwww#...', '....#wwwww#....', '.....#www#.....', '......#w#......', '.......#.......'];
  const c = cnv(15, 13), g = c.getContext('2d');
  rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === '#') { g.fillStyle = '#0d1230'; g.fillRect(x, y, 1, 1); } else if (ch === 'w') { g.fillStyle = y < 4 ? '#fff6a0' : '#ffd23a'; g.fillRect(x, y, 1, 1); } }));
  return c;
}

export class Guide {
  constructor(ctx) {
    this.app = ctx.app; this.root = null; this.cur = null; this.w = null;
    this.done = {}; this.t = 0; this.skip = new Map();   // derived steps done this match; id -> hidden until (this.t)
    this.app.mtGuideUi = this;
  }

  build() {
    if (!document.getElementById('mt-guide-css')) { const st = document.createElement('style'); st.id = 'mt-guide-css'; st.textContent = CSS; document.head.appendChild(st); }
    const r = this.root = document.createElement('div'); r.id = 'mt-guide';
    this.line = document.createElement('div'); this.line.className = 'gl';
    this.ic = document.createElement('div'); this.ic.className = 'ic';
    this.tx = document.createElement('span'); this.tx.className = 'tx';
    this.x = document.createElement('div'); this.x.className = 'x'; this.x.setAttribute('role', 'button'); this.x.textContent = '×';
    this.x.addEventListener('click', (e) => { e.stopPropagation(); if (this.cur) { this.skip.set(this.cur.id, this.t + 45); this.cur = null; this.hide(); } });
    this.x.addEventListener('pointerdown', (e) => e.stopPropagation());
    this.line.append(this.ic, this.tx, this.x); r.appendChild(this.line);
    this.arrow = arrowCanvas(); this.arrow.className = 'ar'; r.appendChild(this.arrow);
    document.body.appendChild(r);
  }

  /** my trainer (the screen's local) */
  me(w) { const id = this.app.playerId; const u = w && w.units && w.units.get(id); return u && u.mtTrainer ? u : null; }
  /** my active monster unit (or null) */
  pet(w, me) { const T = me.mtTrainer, rec = T.party && T.party[T.activeIdx]; return rec && rec.unitId >= 0 ? w.units.get(rec.unitId) || null : null; }

  /** fallback only (no app.mtGuide): scan the mt log since last frame for "did it" events of my trainer */
  events(w, me) {
    const log = w.mt && w.mt.log; if (!log) return;
    let i = this.logAt || 0; if (i > log.length) i = 0;
    for (; i < log.length; i++) {
      const e = log[i]; if (e.trainer !== me.id) continue;
      if ((e.type === 'mt_xp' && e.source === 'wild') || e.type === 'mt_capture_success') this.done.catch = 1;
      else if (e.type === 'mt_evolve_start' || e.type === 'mt_evolve') this.done.evolve = 1;
    }
    this.logAt = log.length;
    const n = (w.structures || []).filter((s) => s.kind === 'tower' && s.team !== me.team && s.team !== 2 && s.alive).length;
    if (this.towerN != null && n < this.towerN) this.done.push = 1;
    this.towerN = n;
  }
  /** the objective from the gameplay agent's guide, normalised; null when there is none */
  external(me) {
    const G = this.app.mtGuide; let g = null;
    try { g = typeof G === 'function' ? G(me.id) : G && typeof G === 'object' ? G : null; } catch { g = null; }
    if (!g || typeof g !== 'object') return null;
    let id = String(g.id || g.step || g.goal || g.kind || '');
    if (!id || g.done === true || id === 'respawn') return null;
    if (id === 'wild') id = 'catch';
    if (id === 'tower') id = 'push';
    let target = g.targetId != null && g.targetId >= 0 ? g.targetId : g.target != null ? g.target : g.x != null ? { x: g.x, y: g.y } : null;
    if (target && typeof target === 'object' && target.id != null && target.x == null) target = target.id;
    return { id, name: g.name || '', target, form: g.form || null, x: g.x, y: g.y, key: typeof g.key === 'string' ? g.key : '', ext: true };
  }

  /** the next objective derived from the world (when app.mtGuide is absent or silent) */
  derive(w, me) {
    const T = me.mtTrainer, rec = T.party && T.party[T.activeIdx], pet = this.pet(w, me);
    if (!this.done.evolve && rec && !rec.evolving && pet && pet.alive && this.canEvolve(rec)) return { id: 'evolve', target: pet.id, form: rec.form };
    if (!this.done.catch) {
      const wild = this.nearest(w, me, (u) => u.mtMon && u.mtMon.ownerId < 0 && !u.epic && !u.mtMon.capturing, 60);
      if (wild) return { id: 'catch', target: wild.id, form: wild.mtMon.form };
    }
    if (!this.done.lane) {
      const p = (w.players || []).find((q) => q.unitId === me.id), lane = this.laneOf(w, p);
      const front = this.laneFront(w, me, lane);
      if (front) {
        if (Math.hypot(front.x - me.x, front.y - me.y) < 11) { this.done.lane = 1; return null; }
        return { id: 'lane', target: front };
      }
    }
    const tw = this.nearest(w, me, (u) => u.kind === 'tower' && u.team !== me.team && u.team !== 2 && u.alive, 400);
    return tw ? { id: 'push', target: tw.id } : null;
  }
  canEvolve(rec) {
    try { const S = this.app.mt && this.app.mt.data && this.app.mt.data.species; const f = S && S.FORMS && S.FORMS[rec.form]; return !!(f && f.evolveLevel && rec.level >= f.evolveLevel && S.nextFormId && S.nextFormId(rec.form)); } catch { return false; }
  }
  laneOf(w, p) { const lanes = w.mt && w.mt.rules && w.mt.rules.lanes; const l = p ? LANE_OF[p.role] || 'mid' : 'mid'; return lanes && !lanes.includes(l) ? lanes[0] : l; }
  /** the front of my lane: my minion closest to the enemy base, else my outermost tower */
  laneFront(w, me, lane) {
    let best = null, bd = Infinity;
    const enemyBase = (w.structures || []).find((s) => s.team !== me.team && s.kind === 'nexus') || null;
    for (const u of w.units.values()) {
      if (!u.alive || u.team !== me.team || u.kind !== 'minion') continue;
      if (u.lane && lane && u.lane !== lane) continue;
      const d = enemyBase ? Math.hypot(enemyBase.x - u.x, enemyBase.y - u.y) : 0;
      if (d < bd) { bd = d; best = u; }
    }
    if (best) return { x: best.x, y: best.y, id: best.id };
    for (const s of w.structures || []) {
      if (s.team !== me.team || s.kind !== 'tower' || !s.alive || (s.lane && lane && s.lane !== lane)) continue;
      const d = enemyBase ? Math.hypot(enemyBase.x - s.x, enemyBase.y - s.y) : 0;
      if (d < bd) { bd = d; best = s; }
    }
    return best ? { x: best.x, y: best.y, id: best.id } : null;
  }
  nearest(w, me, pred, maxD) {
    let best = null, bd = maxD * maxD;
    for (const u of w.units.values()) { if (!u.alive || !pred(u)) continue; const d = (u.x - me.x) ** 2 + (u.y - me.y) ** 2; if (d < bd) { bd = d; best = u; } }
    return best;
  }
  /** the trainer or its monster dealt / took damage in the last 2.5 s */
  fighting(w, me) {
    const recent = (u) => !!u && Math.max(u.lastCombatT ?? -99, u.lastHitTime ?? -99) > w.time - 2.5;
    return recent(me) || recent(this.pet(w, me));
  }

  hide() { if (this.root) { this.line.classList.remove('on'); this.arrow.classList.remove('on'); } }

  update(f) {
    const dt = Math.min(0.1, f.dt || 0); this.t += dt;
    const app = this.app, w = f.world;
    const on = f.state === 'game' && w && !(app.params && app.params.get && app.params.get('guide') === '0');
    if (!on) { if (this.root) this.hide(); if (w !== this.w) { this.w = w; this.logAt = 0; this.cur = null; } return; }
    if (w !== this.w) { this.w = w; this.logAt = 0; this.cur = null; this.t0 = this.t; this.towerN = null; this.done = {}; this.skip.clear(); }   // a new match: every step again
    const me = this.me(w);
    if (!me || !(app.locals && app.locals.length)) { this.hide(); return; }
    if (!this.root) this.build();
    const ext = typeof app.mtGuide === 'function' || (app.mtGuide && typeof app.mtGuide === 'object');
    if (!ext) this.events(w, me);
    const hud = app.mtHud;
    const blocked = app.paused || (app.ui && app.ui.panel && app.ui.panel !== 'none') || !me.alive || this.t - (this.t0 || 0) < 2.5
      || !!(hud && hud.bannerOn) || !!document.querySelector('#mt-hints.vis');
    let g = null;
    if (!blocked) {
      g = ext ? this.external(me) : this.derive(w, me);
      if (g && (this.skip.get(g.id) || 0) > this.t) g = null;
    }
    if (g && !this.render(g)) g = null;
    if (!g) { this.cur = null; this.hide(); return; }
    if (!this.cur || this.cur.id !== g.id) { this.line.classList.remove('new'); void this.line.offsetWidth; this.line.classList.add('new'); }
    this.cur = g;
    this.place(w, me, g);
  }

  /** the banner's text + icon for objective g; false when there are no words for it */
  render(g) {
    const local = (this.app.locals || [])[0], fam = local ? local.glyphs || 'ps' : 'ps';
    // a weakened wild monster: the catch line becomes "throw an orb now"
    const w = this.w, tu = typeof g.target === 'number' && w ? w.units.get(g.target) : null;
    const now = g.id === 'catch' && tu && tu.maxHp && tu.hp / tu.maxHp < 0.4 && !(tu.mtMon && tu.mtMon.capturing);
    const id = now ? 'catchNow' : g.id, button = now ? 'orb' : g.id === 'evolve' ? 'evolve' : '';
    const key = now || !g.key || !has(g.key) ? 'guide.' + id : g.key;
    if (!has(key)) return false;
    const btnLabel = { evolve: { kbm: 'T', ps: '↑', xbox: '↑', touch: '' }, orb: { kbm: 'E', ps: '○', xbox: 'B', touch: '' } }[button];
    const name = g.form ? formName(g.form) : g.name || '';
    const k = key + '|' + name + '|' + fam + '|' + getLang();
    g.view = id;
    if (this.key !== k) {
      this.key = k;
      this.tx.textContent = t(key, { name: name || t('guide.someone') });
      const kb = btnLabel && btnLabel[fam];
      if (kb) { const s = document.createElement('span'); s.className = 'kb'; s.textContent = kb; this.tx.appendChild(s); }
      this.ic.textContent = ''; this.ic.appendChild(iconCanvas(ICON[id] || 'star'));
      this.x.setAttribute('aria-label', t('guide.skip'));
      this.line.classList.toggle('hot', !!HOT[id]);
    }
    return true;
  }

  /** the banner top-centre under the HUD's top bar (below any HUD toast there), the arrow over the target / around
   *  the trainer. HUD-pixel art: banner zoom = a whole number of device px per HUD px, one step up from the HUD's. */
  place(w, me, g) {
    const app = this.app, hud = app.mtHud, z = (hud && hud.u) || 2, dpr = (hud && hud.dpr) || devicePixelRatio || 1, k = Math.round(z * dpr);
    // banner zoom (device px per HUD px): ~3 % of the screen height for the text, at least one step above the HUD's on
    // touch layouts (phones / tablets: the HUD there is small), never below the HUD's; the HUD's own while fighting
    const fight = !HOT[g.view] && this.fighting(w, me), touch = !!(hud && hud.root && hud.root.classList.contains('touch'));
    const want = Math.round((innerHeight * dpr * 0.031) / 10), zb = (fight ? k : Math.max(touch ? k + 1 : k, want)) / dpr;
    this.line.classList.toggle('fight', fight);
    const lw = this.line.offsetWidth * zb;   // offsetWidth ignores transforms: HUD px
    const W = innerWidth, top = hud && hud.top && hud.top.el, tr = top && top.getBoundingClientRect();
    let cx = W / 2, y = ((app.mtHudInsets && app.mtHudInsets.top) || 0.09) * innerHeight + 4 * z;
    if (tr && tr.width > 0) { cx = tr.left + tr.width / 2; y = tr.bottom + 4 * z; }
    const ts = hud && hud.toasts, rr = ts && ts.childElementCount ? ts.getBoundingClientRect() : null;   // touch: toasts sit under the top bar
    if (rr && rr.height > 0 && rr.top < y + 24 * zb && rr.top < innerHeight * 0.4) y = rr.bottom + 3 * z;
    const x = Math.round(Math.max(4 * z, Math.min(W - lw - 4 * z, cx - lw / 2)) * dpr) / dpr, yy = Math.round(y * dpr) / dpr;
    const tf = `translate(${x}px, ${yy}px) scale(${zb})`;
    if (this.line.style.transform !== tf) this.line.style.transform = tf;
    this.line.classList.add('on');
    // arrow: bobbing over the target when it is on screen, else a compass around the trainer, pointing the way to it
    let tx = null, ty = null, hgt = 1.6;
    const tg = typeof g.target === 'number' ? w.units.get(g.target) : g.target && typeof g.target === 'object' ? (g.target.id != null && w.units.get(g.target.id)) || g.target : null;
    if (tg && tg.x != null) { tx = tg.x; ty = tg.y; hgt = tg.mtMon ? 1.9 : tg.kind === 'tower' ? 4.2 : tg.kind ? 1.6 : 0.3; }
    const rig = app.pipeline && app.pipeline.cameraRig;
    if (tx == null || !rig || !rig.worldToScreen) { this.arrow.classList.remove('on'); return; }
    const s = rig.worldToScreen(tx, hgt, ty, {}), R = rig.rect ? rig.rect() : { left: 0, top: 0, width: innerWidth, height: innerHeight };
    const ins = app.mtHudInsets || { top: 0.09, bottom: 0.2 };
    const minY = Math.max(R.top + R.height * ins.top + 30, yy + 26 * zb), maxY = R.top + R.height * (1 - ins.bottom) - 10, minX = R.left + 30, maxX = R.left + R.width - 30;
    const onScreen = s && s.x >= minX && s.x <= maxX && s.y >= minY && s.y <= maxY;
    const za = Math.max(k, Math.round(k * 1.25)) / dpr, aw = this.arrow.width * za, ah = this.arrow.height * za;
    let cx2, cy2, rot = 0;   // arrow centre (CSS px) and rotation (0 = pointing down)
    if (onScreen) { cx2 = s.x; cy2 = s.y - ah / 2 - 2 * z - Math.round(Math.abs(Math.sin(this.t * 4)) * 4) * z; }
    else {
      // off screen: a compass around the trainer (the camera keeps them near the centre), pointing the way to go.
      // 8 spots in HUD px from the chest, clear of the name plate + HP bars above the head (up to ~±48 px wide)
      const p = rig.worldToScreen(me.x, 1.1, me.y, {}), dx = s.x - p.x, dy = s.y - p.y;
      const o = (Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) + 8) % 8;   // 0 = right, 2 = down, 4 = left, 6 = up
      rot = (o * Math.PI) / 4 - Math.PI / 2;   // the arrow art points down
      const [ox, oy] = COMPASS[o], bob = Math.round(Math.abs(Math.sin(this.t * 4)) * 3), ux = Math.cos((o * Math.PI) / 4), uy = Math.sin((o * Math.PI) / 4);
      cx2 = p.x + (ox + ux * bob) * z; cy2 = p.y + (oy + uy * bob) * z;
    }
    const L = Math.round((cx2 - aw / 2) * dpr) / dpr, Tp = Math.round((cy2 - ah / 2) * dpr) / dpr;
    const st = this.arrow.style, tf2 = `translate(${L}px, ${Tp}px)` + (rot ? ` rotate(${Math.round((rot * 180) / Math.PI)}deg)` : '');
    if (st.width !== aw + 'px') { st.width = aw + 'px'; st.height = ah + 'px'; st.transformOrigin = '50% 50%'; }
    if (st.transform !== tf2) st.transform = tf2;
    this.arrow.classList.add('on');
  }

  dispose() { if (this.root) this.root.remove(); }
}
