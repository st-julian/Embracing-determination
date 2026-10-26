// mt/ui/menu.js — the FRONT-END FLOW in app state 'menu': title -> main menu -> choose your starter -> match.
// Owner: UX flow (front-end screens). Built and updated by mt/ui/lobby.js (it owns the pad / key routing of the
// menu states); the visuals behind the DOM (backdrop, logo, the spotlit starter stage) are drawn by title.js.
//
//   title     the staged title (title.js). Tap anywhere / ✕ / Enter / any face button -> main. ◀ JA ▶ tab: language.
//   main      three big choices (Gen-5 menu panels) + ⚙ settings + a language chip:
//               ひとりで あそぶ / Play solo        -> starter -> the match (no lobby, no ready screen)
//               ともだちと あそぶ / With a friend   -> starter -> the online room (lobby.js, one tap creates it)
//               おなじ がめんで / Same screen       -> the pad-join lobby (lobby.js; a starter row per card)
//             the last choice is remembered (sv.options.flow) and focused when the menu opens.
//   settings  ⚙: language, bot strength (difficulty), match length (mode) — persisted in sv.options.
//   starter   "Choose your partner": the title's three starters, now interactive. ← → / swipe / tap a starter
//             spotlights it (name, type, one line); ✕ / tap the lit one / the big button chooses it.
//             Opened with ?join=<code> straight from the invite link (the room comes after the choice).
//
// Every control is a DOM element with role=button (touch, mouse, test harness), pads and keys drive the same items.
// Targets are >= 48 CSS px. Text = the 'Vale JP' pixel font at 16 art px (1 font px = 1 art px of the menu grid,
// --u = one art px, same grid as the canvas behind: title.js menu grid ~384 rows).

import { t, getLang, setLang, nextLang, onLangChange, formName } from '../i18n/index.js';
import { BTN, rumblePattern, glyphFamily } from './input/devices.js';
import { unlockAudio } from './input/gamepad.js';
import { glyphCanvas, fontReady } from './pixeltext.js';
import { STARTERS, STARTER_TYPE, DIFFICULTIES, MODES, prefs, savePrefs, cycle, viewMode } from './menu-prefs.js';

const ITEMS = ['solo', 'friend', 'local'];
const TILE = { solo: '#f08a3c', friend: '#4f8fe8', local: '#5cb848' };
const TYPE_TILE = { fire: ['#f0803c', '#a8441c'], water: ['#4f8fe8', '#24509a'], grass: ['#5cb848', '#2c7228'] };
const CHOOSE_HOLD = 0.8;          // s of the "I choose you!" beat before the next screen

const CSS = `
#mt-menu{position:fixed;inset:0;z-index:5;pointer-events:none;color:#0d1230;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;
  --u:2px;--f:calc(var(--u) * 16);--lh:calc(var(--u) * 18);--ink:#0d1230;--navy:#1b2350;--cream:#fbf8ef;--gold:#ffd23a;--gut:max(calc(var(--u) * 10),env(safe-area-inset-left,0px));
  font:400 var(--f)/var(--lh) 'Vale JP',system-ui,sans-serif;font-synthesis:none;-webkit-font-smoothing:none;word-break:keep-all;line-break:strict;-webkit-tap-highlight-color:transparent}
#mt-menu[hidden]{display:none}
#mt-menu *{font-weight:400!important;font-style:normal!important;letter-spacing:0!important;font-family:'Vale JP',system-ui,sans-serif!important;box-sizing:border-box}
#mt-menu .scr{position:absolute;inset:0;opacity:0;transition:opacity .22s}
#mt-menu .scr.on{opacity:1}
#mt-menu [role=button]{pointer-events:auto;cursor:pointer;touch-action:manipulation}
#mt-menu .px{clip-path:polygon(var(--c,var(--u)) 0,calc(100% - var(--c,var(--u))) 0,100% var(--c,var(--u)),100% calc(100% - var(--c,var(--u))),calc(100% - var(--c,var(--u))) 100%,var(--c,var(--u)) 100%,0 calc(100% - var(--c,var(--u))),0 var(--c,var(--u)))}
#mt-menu canvas,#mt-menu img.pg{image-rendering:pixelated;flex:none;display:block}
#mt-menu .kfocus{position:absolute;left:-40px;top:0;width:8px;height:8px;opacity:0;border:0;padding:0;pointer-events:none}
/* title: the whole screen is the start button; the language tab sits over the canvas chip */
#mt-menu .tap{position:absolute;inset:0}
#mt-menu .tlang{position:absolute;min-width:48px;min-height:48px}
/* shared: plates, chips, the footer band */
#mt-menu .plate{display:flex;align-items:center;gap:calc(var(--u) * 4);background:var(--navy);color:var(--cream);border:var(--u) solid var(--ink);box-shadow:inset 0 0 0 var(--u) #4c5a96;padding:calc(var(--u) * 3) calc(var(--u) * 9) calc(var(--u) * 3) calc(var(--u) * 6);white-space:nowrap}
#mt-menu .chip{display:flex;align-items:center;justify-content:center;gap:calc(var(--u) * 3);background:var(--cream);border:var(--u) solid var(--ink);box-shadow:inset 0 calc(var(--u) * -2) 0 #d6cfb6,inset 0 var(--u) 0 #fff;padding:0 calc(var(--u) * 6);
  min-height:max(calc(var(--u) * 24),48px);min-width:max(calc(var(--u) * 24),48px);white-space:nowrap}
#mt-menu .chip.f,#mt-menu .chip:hover{background:var(--gold);box-shadow:inset 0 calc(var(--u) * -2) 0 #e0a024,inset 0 var(--u) 0 #fff1a8}
#mt-menu .foot{position:absolute;left:0;right:0;bottom:0;display:flex;justify-content:flex-end;align-items:center;gap:calc(var(--u) * 8);min-height:calc(var(--u) * 24);
  padding:calc(var(--u) * 3) max(calc(var(--u) * 10),env(safe-area-inset-right,0px)) max(calc(var(--u) * 3),env(safe-area-inset-bottom,0px));background:rgba(18,16,48,.55);box-shadow:inset 0 var(--u) 0 rgba(8,8,28,.45);color:var(--cream);text-shadow:var(--u) var(--u) 0 var(--ink)}
#mt-menu .foot:empty{display:none}
#mt-menu .foot span{display:inline-flex;align-items:center;gap:calc(var(--u) * 2);white-space:nowrap}
/* main menu: three big Gen-5 panels in the right column */
#mt-menu .mm-list{position:absolute;left:calc(var(--u) * var(--split,200));right:var(--gut);top:calc(var(--u) * 34);bottom:calc(var(--u) * 30);display:flex;flex-direction:column;justify-content:center;gap:calc(var(--u) * 7);padding-left:calc(var(--u) * 10)}
#mt-menu .mb{position:relative;display:flex;align-items:center;gap:calc(var(--u) * 7);min-height:max(calc(var(--u) * 50),56px);padding:calc(var(--u) * 4) calc(var(--u) * 10) calc(var(--u) * 5) calc(var(--u) * 5);
  background:var(--cream);border:var(--u) solid var(--ink);box-shadow:inset 0 0 0 var(--u) #fff,inset 0 calc(var(--u) * -3) 0 #d6cfb6;--c:calc(var(--u) * 2);transition:transform .12s}
#mt-menu .mb .ic{width:calc(var(--u) * 38);height:calc(var(--u) * 38);flex:none;display:grid;place-items:center;background:var(--tc);border:var(--u) solid var(--ink);box-shadow:inset 0 calc(var(--u) * -3) 0 rgba(0,0,0,.18),inset 0 var(--u) 0 rgba(255,255,255,.45)}
#mt-menu .mb .tx{display:flex;flex-direction:column;min-width:0;gap:calc(var(--u) * 1)}
#mt-menu .mb .tx b{white-space:nowrap;color:var(--ink)}
#mt-menu .mb .tx small{font-size:var(--f);white-space:nowrap;color:#5a6290;overflow:hidden;text-overflow:clip}
#mt-menu .mb.f{background:var(--gold);box-shadow:inset 0 0 0 var(--u) #fff1a8,inset 0 calc(var(--u) * -3) 0 #e0a024;transform:translateX(calc(var(--u) * -6))}
#mt-menu .mb.f .tx small{color:#6a4a10}
#mt-menu .mbw{position:relative}
#mt-menu .mbw.f::after{content:"";position:absolute;left:calc(var(--u) * -15);top:calc(50% - var(--u) * 4);width:calc(var(--u) * 5);height:calc(var(--u) * 9);background:var(--ink);
  clip-path:polygon(0 0,20% 0,20% 11%,40% 11%,40% 22%,60% 22%,60% 33%,80% 33%,80% 44%,100% 44%,100% 56%,80% 56%,80% 67%,60% 67%,60% 78%,40% 78%,40% 89%,20% 89%,20% 100%,0 100%);animation:mm-cur .8s steps(2,end) infinite}
@keyframes mm-cur{50%{transform:translateX(var(--u))}}
#mt-menu .mm-top{position:absolute;top:max(calc(var(--u) * 6),env(safe-area-inset-top,0px));right:max(calc(var(--u) * 8),env(safe-area-inset-right,0px));display:flex;gap:calc(var(--u) * 4)}
#mt-menu .gear{gap:calc(var(--u) * 3)}
/* settings: a centred card over the main menu */
#mt-menu .set{position:absolute;inset:0;display:grid;place-items:center;background:rgba(10,10,32,.5);pointer-events:auto}
#mt-menu .card{min-width:min(calc(var(--u) * 300),94vw);max-width:96vw;background:var(--cream);border:var(--u) solid var(--ink);box-shadow:inset 0 0 0 var(--u) #fff;--c:calc(var(--u) * 2);padding:0 0 calc(var(--u) * 6)}
#mt-menu .card .band{display:flex;align-items:center;gap:calc(var(--u) * 4);padding:calc(var(--u) * 2) calc(var(--u) * 6);background:var(--navy);color:var(--cream);border-bottom:var(--u) solid var(--ink)}
#mt-menu .card .rows{display:flex;flex-direction:column;gap:calc(var(--u) * 2);padding:calc(var(--u) * 5) calc(var(--u) * 6) calc(var(--u) * 4)}
#mt-menu .row{position:relative;display:grid;grid-template-columns:calc(var(--f) * 4.6) 1fr;align-items:center;gap:calc(var(--u) * 4);padding:0 calc(var(--u) * 2) 0 calc(var(--u) * 8);min-height:max(calc(var(--u) * 22),48px)}
#mt-menu .row.f{box-shadow:inset 0 0 0 var(--u) var(--ink);background:#fff1b0}
#mt-menu .row .lb{color:#24305e;white-space:nowrap}
#mt-menu .row .val{display:flex;align-items:center;min-width:0}
#mt-menu .row .ar{flex:none;display:grid;place-items:center;min-width:max(calc(var(--u) * 16),48px);min-height:max(calc(var(--u) * 20),48px);color:var(--ink)}
#mt-menu .row .v{flex:1 1 auto;text-align:center;white-space:nowrap;display:flex;flex-direction:column;align-items:center}
#mt-menu .row .v small{color:#5a6290;font-size:var(--f)}
#mt-menu .card .ok{margin:calc(var(--u) * 2) calc(var(--u) * 6) 0;display:grid;place-items:center;min-height:max(calc(var(--u) * 24),48px);background:var(--gold);border:var(--u) solid var(--ink);box-shadow:inset 0 calc(var(--u) * -2) 0 #e0a024,inset 0 var(--u) 0 #fff1a8}
#mt-menu .card .ok.f{outline:var(--u) solid var(--ink);outline-offset:calc(var(--u) * -4)}
/* starter: header, side arrows, the Gen-5 text box with the big choose button */
#mt-menu .st-hit{position:absolute;inset:0;pointer-events:auto;touch-action:none}
#mt-menu .st-head{position:absolute;left:max(calc(var(--u) * 6),env(safe-area-inset-left,0px));right:max(calc(var(--u) * 6),env(safe-area-inset-right,0px));top:max(calc(var(--u) * 6),env(safe-area-inset-top,0px));display:flex;align-items:center;gap:calc(var(--u) * 5);pointer-events:none}
#mt-menu .st-head .sp{flex:1 1 auto}
#mt-menu .arr{position:absolute;top:var(--ay,40%);transform:translateY(-50%);width:max(calc(var(--u) * 26),48px);height:max(calc(var(--u) * 40),64px);display:grid;place-items:center;background:rgba(251,248,239,.92);border:var(--u) solid var(--ink);box-shadow:inset 0 calc(var(--u) * -3) 0 #d6cfb6;--c:calc(var(--u) * 3)}
#mt-menu .arr.l{left:max(calc(var(--u) * 6),env(safe-area-inset-left,0px))}#mt-menu .arr.r{right:max(calc(var(--u) * 6),env(safe-area-inset-right,0px))}
#mt-menu .arr:active{background:var(--gold)}
#mt-menu .st-box{position:absolute;left:max(calc(var(--u) * 8),env(safe-area-inset-left,0px));right:max(calc(var(--u) * 8),env(safe-area-inset-right,0px));bottom:max(calc(var(--u) * 6),env(safe-area-inset-bottom,0px));display:flex;align-items:stretch;gap:calc(var(--u) * 6);pointer-events:none}
#mt-menu .info{flex:1 1 auto;min-width:0;position:relative;background:var(--cream);border:var(--u) solid var(--ink);box-shadow:inset 0 0 0 var(--u) #fff,inset 0 0 0 calc(var(--u) * 2) #d6cfb6;--c:calc(var(--u) * 3);padding:calc(var(--u) * 5) calc(var(--u) * 9) calc(var(--u) * 6);display:flex;flex-direction:column;justify-content:center;gap:calc(var(--u) * 2)}
#mt-menu .info .nm{display:flex;align-items:center;gap:calc(var(--u) * 5);white-space:nowrap}
#mt-menu .info .nm b{color:var(--ink)}
#mt-menu .info .ty{display:inline-flex;align-items:center;gap:calc(var(--u) * 2);padding:0 calc(var(--u) * 5) 0 calc(var(--u) * 2);background:var(--tc);color:#fff;border:var(--u) solid var(--ink);text-shadow:var(--u) var(--u) 0 var(--td);box-shadow:inset 0 var(--u) 0 rgba(255,255,255,.4)}
#mt-menu .info .ds{color:#2c3666;white-space:nowrap;overflow:hidden}
#mt-menu .info .dots{position:absolute;right:calc(var(--u) * 8);top:calc(var(--u) * 7);display:flex;gap:calc(var(--u) * 3)}
#mt-menu .info .dots i{width:calc(var(--u) * 5);height:calc(var(--u) * 5);background:#d6cfb6;border:var(--u) solid #8a8fae}
#mt-menu .info .dots i.on{background:var(--tc);border-color:var(--ink)}
#mt-menu .go{flex:none;display:flex;align-items:center;justify-content:center;gap:calc(var(--u) * 4);padding:0 calc(var(--u) * 12);min-width:max(calc(var(--u) * 100),120px);background:var(--gold);border:var(--u) solid var(--ink);
  box-shadow:inset 0 calc(var(--u) * -3) 0 #e0a024,inset 0 var(--u) 0 #fff1a8;--c:calc(var(--u) * 3);white-space:nowrap;animation:mm-pulse 1.2s steps(2,end) infinite}
@keyframes mm-pulse{50%{background:#ffe27a}}
#mt-menu .go.done{background:#3fb64a;color:#fff;box-shadow:inset 0 calc(var(--u) * -3) 0 #2a8a34,inset 0 var(--u) 0 #8ae890;animation:none}
#mt-menu .go .ck{flex:none;width:calc(var(--u) * 26);height:calc(var(--u) * 20);image-rendering:pixelated}
#mt-menu .opt{pointer-events:auto}
/* narrow / short screens */
@media (orientation:portrait){#mt-menu .mm-list{left:var(--gut);top:calc(var(--u) * var(--ptop,120));padding-left:calc(var(--u) * 8)}}
@media (max-height:420px){#mt-menu .info .ds{display:block}}
html.mt-swgl #mt-menu,html.mt-swgl #mt-menu *{animation:none!important;transition:none!important}
`;

// ------------------------------------------------------------------------------------------------ pixel icons
const cnv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
/**
 * hand-built 24×24 pictograms: a cream figure with a 1-px ink outline (Gen-5 menu icons). Shapes are masks, then
 * outlined by one pixel, so the icons share the art grid of the text.
 */
function icon(kind) {
  const W = 26, H = 26, m = new Uint8Array(W * H), f = new Uint8Array(W * H);
  const disc = (cx, cy, r, v = 1, arr = m) => { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) arr[y * W + x] = v; };
  const rect = (x0, y0, w, h, v = 1, arr = m) => { x0 = Math.round(x0); y0 = Math.round(y0); for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (x >= 0 && y >= 0 && x < W && y < H) arr[y * W + x] = v; };
  const body = (cx, top, hw, h) => { for (let y = top; y < top + h; y++) { const k = Math.min(1, (y - top + 1) / 3); const w = Math.round(hw * (0.62 + 0.38 * k)); rect(cx - w, y, w * 2, 1); } };
  const person = (cx, cy, s) => { disc(cx, cy, 4.4 * s); body(cx, Math.round(cy + 4.6 * s), Math.round(7 * s), Math.round(7 * s)); };
  if (kind === 'solo') { person(13, 8.5, 1.15); }
  else if (kind === 'friend') { person(8.5, 9, 0.88); person(17.5, 9, 0.88); rect(12, 4, 2, 2, 0); }
  else if (kind === 'local') { // a controller: rounded body, grips, d-pad + two buttons as holes
    for (let y = 7; y < 19; y++) for (let x = 2; x < 24; x++) { const gx = x < 13 ? x - 7 : x - 18, gy = y - 12; if (Math.abs(gy) <= 4 && x >= 6 && x <= 19) m[y * W + x] = 1; if (gx * gx + gy * gy * 0.8 <= 24) m[y * W + x] = 1; }
    rect(5, 18, 4, 3); rect(17, 18, 4, 3); disc(7, 18.5, 2.6); disc(19, 18.5, 2.6);
    rect(6, 11, 5, 1, 2); rect(8, 9, 1, 5, 2); disc(17.5, 10.5, 1.2, 2); disc(19.8, 13, 1.2, 2);
  } else if (kind === 'gear') { // 15×15 gear in a 26 canvas centre
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const dx = x + 0.5 - 13, dy = y + 0.5 - 13, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
      const tooth = Math.cos(a * 8) > 0.35;
      if ((r <= 5.6 || (tooth && r <= 7.6)) && r > 2.2) m[y * W + x] = 1;
    }
  }
  // outline: every empty pixel next to a filled one; holes (value 2) become ink
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x; if (m[i] === 1) continue;
    if (m[i] === 2) { f[i] = 2; continue; }
    for (let k = 0; k < 4; k++) { const X = x + [1, -1, 0, 0][k], Y = y + [0, 0, 1, -1][k]; if (X >= 0 && Y >= 0 && X < W && Y < H && m[Y * W + X] === 1) { f[i] = 2; break; } }
  }
  const c = cnv(W, H), g = c.getContext('2d');
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (m[i] === 1) { g.fillStyle = y > H * 0.62 && kind !== 'gear' && kind !== 'local' ? '#e6dcc0' : '#fff6dc'; g.fillRect(x, y, 1, 1); } else if (f[i] === 2) { g.fillStyle = '#0d1230'; g.fillRect(x, y, 1, 1); }
  }
  return c;
}
const ICONS = new Map();
function iconEl(kind) {
  let c = ICONS.get(kind); if (!c) { c = icon(kind); ICONS.set(kind, c); }
  const e = cnv(c.width, c.height); e.getContext('2d').drawImage(c, 0, 0);
  e.style.width = `calc(var(--u) * ${c.width})`; e.style.height = `calc(var(--u) * ${c.height})`;
  return e;
}
/** a crisp pixel triangle (◀ / ▶) for the arrow buttons: h rows tall, ink */
export function triEl(dir, h = 13, col = '#0d1230') {
  const w = Math.ceil(h / 2), c = cnv(w, h), g = c.getContext('2d'); g.fillStyle = col;
  for (let k = 0; k < w; k++) { const x = dir < 0 ? k : w - 1 - k; g.fillRect(x, Math.floor(h / 2) - k, 1, k * 2 + 1); }
  c.style.width = `calc(var(--u) * ${w})`; c.style.height = `calc(var(--u) * ${h})`;
  return c;
}
/** a small 13-px gear for the settings chip */
function gearEl() {
  const big = icon('gear'), c = cnv(17, 17); c.getContext('2d').drawImage(big, -5, -5);
  c.style.width = 'calc(var(--u) * 17)'; c.style.height = 'calc(var(--u) * 17)';
  return c;
}
/** button glyph image on the art grid */
const PG = new Map();
function pg(kind) {
  let s = PG.get(kind);
  if (!s) {
    const c = glyphCanvas(kind);
    s = `<img class="pg" alt="" draggable="false" src="${c.toDataURL()}" style="width:calc(var(--u) * ${c.width});height:calc(var(--u) * ${c.height})">`;
    if (fontReady()) PG.set(kind, s);
  }
  return s;
}
const h = (tag, cls, parent, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; if (parent) parent.appendChild(e); return e; };
/** a chunky pixel check mark (white, ink outline), 13×10 art px */
function checkCanvas() {
  const rows = ['..........###', '.........#ww#', '........#ww#.', '.###...#ww#..', '#ww#..#ww#...', '#www##www#...', '.#wwwwww#....', '..#wwww#.....', '...#ww#......', '....##.......'];
  const c = document.createElement('canvas'); c.width = 13; c.height = 10; const g = c.getContext('2d');
  rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === '.') return; g.fillStyle = ch === '#' ? '#0d1230' : '#ffffff'; g.fillRect(x, y, 1, 1); }));
  return c;
}
const btn = (cls, parent, text) => { const e = h('div', cls, parent, text); e.setAttribute('role', 'button'); return e; };

export class FrontMenu {
  /** @param {object} ctx subsystem ctx  @param {object} lobby mt/ui/lobby.js Lobby (flow starts + pad routing) */
  constructor(ctx, lobby) {
    this.ctx = ctx; this.app = ctx.app; this.lobby = lobby;
    this.app.mtMenu = this;
    this.screen = 'title'; this.root = null; this.key_ = ''; this.t = 0;
    const p = prefs();
    this.focus = { main: Math.max(0, ITEMS.indexOf(p.flow)), starter: Math.max(0, STARTERS.indexOf(p.starter)), settings: 0 };
    this.flow = null;            // 'solo' | 'friend' | 'join' while the starter screen is open
    this.chosen = null;          // {i, t0} — the choose beat (title.js hops the sprite)
    this.dev = { device: 'kbm', inputType: 'kbm', padId: '', padIndex: -1 };
    this.pad = null;             // the Gamepad record that last drove the menu (lobby join)
    this.prevState = null; this.keyLang = getLang();
    // invite link <page>?join=<code>: the friend chooses a starter first, then lands in the room (lobby.js joins).
    // The net controller would open the lobby itself: take the code over before its first frame.
    const net = this.app.mtNet;
    if (net && net.autoJoin) { this.joinCode = net.autoJoin; net.autoJoin = null; } else this.joinCode = null;
    this.app.on('state', (s) => this.onState(s));
    onLangChange(() => { this.key_ = ''; });   // (keyLang follows at the next frame: the ← → guard compares against it)
    globalThis.__mtMenu = this;
  }

  // ------------------------------------------------------------------ flow
  onState(s) {
    const prev = this.prevState; this.prevState = s;
    if (s !== 'menu') { this.chosen = null; this.release(); return; }
    // back from a match / the lobby: the main menu (the title is for the first boot only)
    if (prev && prev !== 'menu') this.open('main');
  }
  open(screen, o = {}) {
    if (screen === 'starter') { this.flow = o.flow || this.flow || 'solo'; this.chosen = null; this.focus.starter = Math.max(0, STARTERS.indexOf(prefs().starter)); }
    if (screen === 'main') { this.flow = null; this.focus.main = Math.max(0, ITEMS.indexOf(prefs().flow)); }
    if (screen === 'settings') this.focus.settings = 0;
    this.from = this.screen; this.screen = screen; this.key_ = '';
    this.sfx(screen === 'title' ? 'click' : 'confirm');
  }
  back() {
    if (this.chosen) return;
    if (this.screen === 'settings') this.open('main');
    else if (this.screen === 'starter') { this.joinCode = null; this.open('main'); }
    else if (this.screen === 'main') this.open('title');
  }
  pick(i) {
    const id = ITEMS[i]; if (!id) return;
    this.focus.main = i; savePrefs({ flow: id });
    if (id === 'local') { this.sfx('confirm'); this.lobby.openLocal(this.pad && this.dev.device.startsWith('pad:') ? this.pad : null); return; }
    this.open('starter', { flow: id });
  }
  setStarter(i) {
    if (this.chosen) return;
    const n = STARTERS.length, j = (i + n) % n;
    if (j !== this.focus.starter) { this.focus.starter = j; this.sfx('click'); this.key_ = ''; }
  }
  choose() {
    if (this.chosen) return;
    const i = this.focus.starter, id = STARTERS[i];
    savePrefs({ starter: id });
    this.chosen = { i, t0: this.t, id };
    this.sfx('confirm'); if (this.dev.padIndex >= 0) rumblePattern(this.dev.padIndex, 'join');
    this.key_ = '';
  }
  /** after the choose beat: the match (solo) or the online room (friend / invite link) */
  proceed() {
    const c = this.chosen; if (!c) return;
    const flow = this.flow, dev = { ...this.dev }, code = this.joinCode;
    this.chosen = null; this.joinCode = null;
    if (flow === 'solo') this.lobby.startSolo(dev, c.id);
    else this.lobby.openFriend(code ? { join: code } : { create: true }, dev, c.id, this.pad && dev.device.startsWith('pad:') ? this.pad : null);
  }
  settingChange(row, d) {
    const p = prefs();
    if (row === 'lang') { nextLang(d); this.keyLang = getLang(); }
    else if (row === 'difficulty') savePrefs({ difficulty: cycle(DIFFICULTIES, p.difficulty, d) });
    else if (row === 'mode') savePrefs({ mode: cycle(MODES, p.mode, d) });
    else if (row === 'ok') { this.open('main'); return; }
    this.sfx('click'); this.key_ = '';
  }
  sfx(kind) {
    const a = this.app.registry && this.app.registry.get('audio');
    try { if (a && a.ready) { if (kind === 'confirm' && a.confirm) a.confirm(); else if (a.click) a.click(); } } catch { /* audio not ready */ }
  }

  // ------------------------------------------------------------------ input (routed by lobby.js in state 'menu')
  noteKbm(e) {
    this.dev = { device: 'kbm', inputType: this.app.mtInputMode === 'touch' && !e ? 'touch' : 'kbm', padId: '', padIndex: -1 };
    this.pad = null;
  }
  notePad(pad) { this.dev = { device: 'pad:' + pad.index, inputType: pad.kind || 'gamepad', padId: pad.id || '', padIndex: pad.index }; this.pad = pad; }
  key(e) {
    const app = this.app, c = e.code;
    if (app.ui && app.ui.panel && app.ui.panel !== 'none') return;
    const tg = e.target; if (tg && tg.tagName === 'INPUT' && !tg.classList.contains('kfocus')) return;
    const arrow = c === 'ArrowLeft' || c === 'ArrowRight';
    // mt/i18n/dom.js turns ← → / L into a language switch on the title (it listens before us): keep it on the
    // title, undo it on the other screens (their ← → move the cursor)
    if (this.screen !== 'title' && arrow && getLang() !== this.keyLang) setLang(this.keyLang);
    if (this.screen === 'title') {
      if (c === 'Enter' || c === 'NumpadEnter' || c === 'Space') { e.preventDefault(); if (e.repeat) return; this.noteKbm(e); this.open('main'); }
      this.keyLang = getLang();
      return;
    }
    const ok = c === 'Enter' || c === 'NumpadEnter' || c === 'Space', bk = c === 'Escape' || c === 'Backspace';
    if (!(ok || bk || arrow || c === 'ArrowUp' || c === 'ArrowDown' || c === 'KeyW' || c === 'KeyA' || c === 'KeyS' || c === 'KeyD' || c === 'Tab' || c === 'KeyL')) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (e.repeat && (ok || bk)) return;
    this.noteKbm(e);
    const dir = c === 'ArrowUp' || c === 'KeyW' ? 'up' : c === 'ArrowDown' || c === 'KeyS' ? 'down' : c === 'ArrowLeft' || c === 'KeyA' ? 'left' : c === 'ArrowRight' || c === 'KeyD' ? 'right' : null;
    if (c === 'KeyL') { if (getLang() === this.keyLang) nextLang(1); this.keyLang = getLang(); return; }   // (dom.js may have switched it already)
    if (c === 'Tab') { if (this.screen === 'main') this.open('settings'); else if (this.screen === 'settings') this.open('main'); return; }
    this.nav(dir, ok, bk);
  }
  /** one pad's input this frame (s = PadState already ticked by lobby.js) */
  padInput(pad, s, dir) {
    const app = this.app;
    if (app.ui && app.ui.panel && app.ui.panel !== 'none') return;
    const any = s.down(BTN.CROSS) || s.down(BTN.OPTIONS) || s.down(BTN.SQUARE) || s.down(BTN.TRIANGLE) || s.down(BTN.CIRCLE);
    if (any || dir) { this.notePad(pad); unlockAudio(app); }
    if (this.screen === 'title') {
      if (s.down(BTN.CROSS) || s.down(BTN.OPTIONS) || s.down(BTN.SQUARE) || s.down(BTN.TRIANGLE)) this.open('main');
      else if (dir === 'left' || dir === 'right') { nextLang(dir === 'left' ? -1 : 1); this.keyLang = getLang(); }
      return;
    }
    if (this.screen === 'main' && s.down(BTN.TRIANGLE)) { this.open('settings'); return; }
    if (this.screen === 'starter' && s.down(BTN.OPTIONS)) { this.choose(); return; }
    this.nav(dir, s.down(BTN.CROSS), s.down(BTN.CIRCLE));
  }
  nav(dir, ok, bk) {
    if (this.chosen) return;
    if (bk) { this.back(); return; }
    if (this.screen === 'main') {
      if (dir === 'up' || dir === 'down') { this.focus.main = (this.focus.main + (dir === 'down' ? 1 : -1) + ITEMS.length) % ITEMS.length; this.sfx('click'); this.key_ = ''; }
      if (ok) this.pick(this.focus.main);
    } else if (this.screen === 'starter') {
      if (dir === 'left' || dir === 'right') this.setStarter(this.focus.starter + (dir === 'right' ? 1 : -1));
      if (ok) this.choose();
    } else if (this.screen === 'settings') {
      const R = this.setRows();
      if (dir === 'up' || dir === 'down') { this.focus.settings = (this.focus.settings + (dir === 'down' ? 1 : -1) + R.length) % R.length; this.sfx('click'); this.key_ = ''; }
      else if (dir === 'left' || dir === 'right') { if (R[this.focus.settings] !== 'ok') this.settingChange(R[this.focus.settings], dir === 'right' ? 1 : -1); }
      if (ok) { const r = R[this.focus.settings]; if (r === 'ok') this.open('main'); else this.settingChange(r, 1); }
    }
  }
  setRows() { return ['lang', 'difficulty', 'mode', 'ok']; }

  // ------------------------------------------------------------------ frame
  update(f) {
    const dt = Math.min(0.1, f.dt || 0); this.t += dt;
    const on = f.state === 'menu';
    if (!on) { if (this.root && !this.root.hidden) { this.root.hidden = true; this.release(); } return; }
    if (!this.root) this.build();
    if (this.root.hidden) this.root.hidden = false;
    // the invite link: straight to "choose your starter" once the game is up
    if (this.joinCode && this.screen !== 'starter' && !this.chosen && this.app.ready) { this.open('starter', { flow: 'join' }); }
    if (this.chosen && this.t - this.chosen.t0 >= CHOOSE_HOLD) { this.proceed(); return; }
    // keep the arrow-key guard in step with the language (a click / the settings row may have switched it)
    this.keyLang = getLang();
    this.sync();
  }

  build() {
    if (!document.getElementById('mt-menu-css')) { const st = h('style'); st.id = 'mt-menu-css'; st.textContent = CSS; document.head.appendChild(st); }
    const r = this.root = h('div', null, document.body); r.id = 'mt-menu';
    // a focus sink for real keyboards: while it has the focus, mt/i18n/dom.js leaves ← → alone (it skips INPUT
    // targets). inputmode=none: never a virtual keyboard.
    this.kf = h('input', 'kfocus', r); this.kf.readOnly = true; this.kf.tabIndex = -1; this.kf.setAttribute('inputmode', 'none'); this.kf.setAttribute('aria-hidden', 'true');
    this.scr = h('div', 'scr on', r);
  }

  /** grid + screen -> CSS vars; rebuild the screen DOM when its key changes */
  sync() {
    const T = this.app.mtTitle, MG = this.app.mtMenuGrid;
    const Z = MG && MG.Z ? MG.Z : 2, dpr = devicePixelRatio || 1;
    const u = (Z / dpr) + 'px';
    if (this.uVar !== u) { this.uVar = u; this.root.style.setProperty('--u', u); }
    const mode = viewMode(this.app);
    const fam = mode === 'pad' ? glyphFamily(this.dev.inputType && this.dev.inputType !== 'kbm' ? this.dev.inputType : 'dualsense') : mode;
    const k = [this.screen, getLang(), mode, fam, fontReady() ? 1 : 0, this.screen === 'starter' ? this.focus.starter + (this.chosen ? 'c' : '') + this.flow : '',
      this.screen === 'settings' ? this.focus.settings + JSON.stringify(prefs()) : '', this.screen === 'main' ? this.focus.main : ''].join('|');
    if (k !== this.key_) {
      const same = this.key_ && this.key_.split('|')[0] === this.screen && this.key_.split('|')[1] === getLang();
      this.key_ = k;
      this.render(same);
    }
    // layout handed over by title.js (art px of the current grid)
    if (T && T.L) {
      if (this.screen === 'main' && T.L.split != null) { const v = String(T.L.split); if (this.splitV !== v) { this.splitV = v; this.root.style.setProperty('--split', v); this.root.style.setProperty('--ptop', String(T.L.ptop || 120)); } }
      if (this.screen === 'title' && this.tlang && T.G && T.texts) {
        const C = T.chipBox(), q = T.G.Z / T.G.dpr, s = [(C[0] - 4) * q, (C[1] - 4) * q, (C[2] + 8) * q, (C[3] + 8) * q].map((v) => Math.round(v) + 'px').join(',');
        if (this.tlang.dataset.k !== s) { this.tlang.dataset.k = s; const [l, tp, w, hh] = s.split(','); Object.assign(this.tlang.style, { left: l, top: tp, width: w, height: hh }); }
      }
    }
    if (this.screen === 'starter' && this.stBox) {
      // the stage floor sits above the text box: hand its top (art px) to title.js
      const r = this.stBox.getBoundingClientRect(), q = Z / dpr;
      if (r.height > 0) this.stageBottom = Math.floor(r.top / q);
      const ay = T && T.L && T.L.floor ? Math.round((T.L.floor - 40 * (T.L.S || 2)) * q) + 'px' : '45%';
      if (this.root.style.getPropertyValue('--ay') !== ay) this.root.style.setProperty('--ay', ay);
    }
    // keyboard users: hold the focus sink on the menu screens (never on touch screens: no keyboard pops up anyway)
    if (this.screen !== 'title' && this.dev.device === 'kbm' && this.dev.inputType === 'kbm' && document.activeElement !== this.kf && !(document.activeElement && document.activeElement.tagName === 'INPUT')) { try { this.kf.focus({ preventScroll: true }); } catch { /* old browsers */ } }
  }

  render(sameScreen) {
    const old = this.scr;
    const s = h('div', 'scr' + (sameScreen ? ' on' : ''), null);
    s.dataset.screen = this.screen;
    if (this.screen === 'title') this.buildTitle(s);
    else if (this.screen === 'main' || this.screen === 'settings') { this.buildMain(s); if (this.screen === 'settings') this.buildSettings(s); }
    else if (this.screen === 'starter') this.buildStarter(s);
    this.root.replaceChild(s, old); this.scr = s;
    if (!sameScreen) requestAnimationFrame(() => s.classList.add('on'));
  }

  footer(s, items) {
    const mode = viewMode(this.app), foot = h('div', 'foot', s);
    if (mode === 'touch') return foot;
    const fam = mode === 'kbm' ? 'kbm' : glyphFamily(this.dev.inputType && this.dev.inputType !== 'kbm' ? this.dev.inputType : 'dualsense');
    const G = (b) => (fam === 'kbm' ? pg('key:' + b[0]) : pg((fam === 'ps' ? { x: 'cross', o: 'circle', t: 'tri', s: 'square' } : { x: 'xa', o: 'xb', t: 'xy', s: 'xx' })[b[1]]));
    foot.innerHTML = items.map(([kb, pad, label]) => `<span>${G([kb, pad])}${label}</span>`).join('');
    return foot;
  }

  buildTitle(s) {
    const tap = btn('tap', s); tap.setAttribute('aria-label', t('title.tapStart'));
    tap.addEventListener('click', () => { this.noteKbm(); unlockAudio(this.app); this.open('main'); });
    this.tlang = btn('tlang', s); this.tlang.setAttribute('aria-label', t('lang.label')); this.tlang.dataset.k = '';
    this.tlang.addEventListener('click', (e) => { e.stopPropagation(); nextLang(1); this.keyLang = getLang(); this.sfx('click'); });
  }

  buildMain(s) {
    const top = h('div', 'mm-top', s);
    const lang = btn('chip px lang', top, getLang() === 'ja' ? 'English' : '日本語'); lang.dataset.k = 'lang';
    lang.addEventListener('click', () => { this.noteKbm(); nextLang(1); this.keyLang = getLang(); this.sfx('click'); });
    const gear = btn('chip px gear', top); gear.appendChild(gearEl()); h('span', null, gear, t('menu.settings')); gear.dataset.k = 'settings';
    gear.addEventListener('click', () => { this.noteKbm(); this.open('settings'); });
    const list = h('div', 'mm-list', s);
    ITEMS.forEach((id, i) => {
      const f = i === this.focus.main && this.screen === 'main', wrap = h('div', 'mbw' + (f ? ' f' : ''), list);
      const b = btn('mb px' + (f ? ' f' : ''), wrap); b.dataset.item = id;
      b.style.setProperty('--tc', TILE[id]);
      const ic = h('span', 'ic', b); ic.appendChild(iconEl(id));
      const tx = h('span', 'tx', b); h('b', null, tx, t('menu.' + id)); h('small', null, tx, t('menu.' + id + '.sub'));
      b.addEventListener('click', () => { if (this.screen !== 'main') return; this.noteKbm(); unlockAudio(this.app); this.pick(i); });
      b.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' && this.screen === 'main' && this.focus.main !== i) { this.focus.main = i; this.key_ = ''; } });
    });
    if (this.screen === 'main') this.footer(s, [['Enter', 'x', t('net.hint.ok')], ['Esc', 'o', t('lobby.hint.back')], ['Tab', 't', t('menu.settings')]]);
  }

  buildSettings(s) {
    const p = prefs(), R = this.setRows(), wrap = h('div', 'set', s), card = h('div', 'card px', wrap);
    wrap.addEventListener('click', (e) => { if (e.target === wrap) this.open('main'); });
    const band = h('div', 'band', card); band.appendChild(gearEl()); h('b', null, band, t('menu.settings'));
    const rows = h('div', 'rows', card);
    const val = { lang: [getLang() === 'ja' ? '日本語' : 'English', ''], difficulty: [t('opt.difficulty.' + p.difficulty), t('opt.difficulty.' + p.difficulty + '.sub')], mode: [t('opt.mode.' + p.mode), t('opt.mode.' + p.mode + '.sub')] };
    R.forEach((row, i) => {
      if (row === 'ok') {
        const ok = btn('ok px' + (this.focus.settings === i ? ' f' : ''), card, t('menu.close'));
        ok.addEventListener('click', () => this.open('main'));
        return;
      }
      const r = h('div', 'row' + (this.focus.settings === i ? ' f' : ''), rows); h('span', 'lb', r, t('opt.' + row));
      const v = h('div', 'val', r);
      const l = btn('ar', v), m = h('span', 'v', v), rr = btn('ar', v); l.appendChild(triEl(-1, 11)); rr.appendChild(triEl(1, 11));
      h('span', null, m, val[row][0]); if (val[row][1]) h('small', null, m, val[row][1]);
      l.addEventListener('click', (e) => { e.stopPropagation(); this.focus.settings = i; this.settingChange(row, -1); });
      rr.addEventListener('click', (e) => { e.stopPropagation(); this.focus.settings = i; this.settingChange(row, 1); });
    });
    this.footer(s, [['LR', 'x', t('lobby.hint.change')], ['Esc', 'o', t('menu.close')]]);
  }

  buildStarter(s) {
    const i = this.focus.starter, id = STARTERS[i], ty = STARTER_TYPE[id], [tc, td] = TYPE_TILE[ty];
    const hit = h('div', 'st-hit', s);
    this.swipe(hit);
    const head = h('div', 'st-head', s);
    const bk = btn('chip px back', head); bk.appendChild(triEl(-1, 11)); bk.setAttribute('aria-label', t('lobby.hint.back'));
    bk.addEventListener('click', () => this.back());
    const pl = h('div', 'plate px', head); h('b', null, pl, this.flow === 'join' ? t('starter.titleJoin') : t('starter.title'));
    h('span', 'sp', head);
    const p = prefs();
    if (this.flow === 'solo') { // the match setup at a glance: tap = settings
      const o = btn('chip px opt', head); o.appendChild(gearEl()); h('span', null, o, t('opt.difficulty.' + p.difficulty) + '・' + t('opt.mode.' + p.mode));
      o.addEventListener('click', () => { this.back(); this.open('settings'); });
    }
    const L = btn('arr px l', s), R = btn('arr px r', s); L.appendChild(triEl(-1, 19)); R.appendChild(triEl(1, 19));
    L.setAttribute('aria-label', '◀'); R.setAttribute('aria-label', '▶');
    L.addEventListener('click', () => { this.noteKbm(); this.setStarter(this.focus.starter - 1); });
    R.addEventListener('click', () => { this.noteKbm(); this.setStarter(this.focus.starter + 1); });
    const box = this.stBox = h('div', 'st-box', s);
    const info = h('div', 'info px', box); info.style.setProperty('--tc', tc); info.style.setProperty('--td', td);
    const nm = h('div', 'nm', info);
    const tyc = h('span', 'ty', nm); h('span', null, tyc, t('type.' + ty + '.long'));
    h('b', null, nm, formName(id));
    const dots = h('div', 'dots', info); STARTERS.forEach((_, k) => h('i', k === i ? 'on' : '', dots));
    h('div', 'ds', info, this.chosen ? t('starter.chosen', { name: formName(id) }) : t('starter.desc.' + id));
    const go = btn('go px' + (this.chosen ? ' done' : ''), box);
    if (!this.chosen && viewMode(this.app) !== 'touch') { const fam = this.dev.device === 'kbm' ? 'kbm' : glyphFamily(this.dev.inputType || 'dualsense'); go.insertAdjacentHTML('beforeend', fam === 'kbm' ? pg('key:Enter') : pg(fam === 'ps' ? 'cross' : 'xa')); }
    if (this.chosen) { const ck = checkCanvas(); ck.className = 'ck'; go.appendChild(ck); }   // a big pixel ✓ + "Let's go!"
    h('span', null, go, this.chosen ? t('starter.go') : t('starter.choose'));
    go.addEventListener('click', () => { this.noteKbm(); unlockAudio(this.app); this.choose(); });
    this.footer(s, [['←', 'x', t('starter.hint.pick')], ['Esc', 'o', t('lobby.hint.back')]]).classList.add('st-foot');
    s.querySelector('.st-foot').style.display = 'none';   // the box already names the controls (glyph on the button)
  }

  /** swipe ← → on the stage; a tap on a starter spotlights it, a tap on the spotlit one chooses it */
  swipe(el) {
    let st = null;
    el.addEventListener('pointerdown', (e) => { st = { x: e.clientX, y: e.clientY, id: e.pointerId, t: performance.now() }; try { el.setPointerCapture(e.pointerId); } catch { /* old */ } });
    el.addEventListener('pointerup', (e) => {
      if (!st || e.pointerId !== st.id) return;
      const dx = e.clientX - st.x, dy = e.clientY - st.y; st = null;
      this.noteKbm(); unlockAudio(this.app);
      if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy)) { this.setStarter(this.focus.starter + (dx < 0 ? 1 : -1)); return; }
      if (Math.abs(dx) < 14 && Math.abs(dy) < 14) {
        const T = this.app.mtTitle, k = T && T.starterAt ? T.starterAt(e.clientX, e.clientY) : -1;
        if (k < 0) return;
        if (k === this.focus.starter) this.choose(); else this.setStarter(k);
      }
    });
    el.addEventListener('pointercancel', () => { st = null; });
  }

  /** give the keyboard focus back (the game's / lobby's key handlers skip INPUT targets) */
  release() { try { if (this.kf && document.activeElement === this.kf) this.kf.blur(); } catch { /* ignore */ } }
  dispose() { if (this.root) this.root.remove(); }
}
