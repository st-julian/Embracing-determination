// mt/ui/lobby.js — local multiplayer lobby (DESIGN §2). Owner: lobby/input specialist.
//
// Replaces champion select: the legacy flow `menu -> select -> loading -> game` becomes `menu -> lobby -> loading -> game`
// (any 'select' state — menu Play, end-screen Play Again — is redirected to 'lobby'; the backdrop world keeps ticking,
// [MT-HOOK] lobby in index-*.js).
//
// Up to 4 local players, one card each (P1 green, P2 yellow, P3 pink, P4 cyan):
//   join      pad: ✕ / Options (Xbox: A / Menu)     keyboard+mouse: Enter / Space or click an empty card
//   navigate  pad: D-pad / left stick  ↑↓ row, ←→ value     keyboard: arrows or WASD; mouse: click the ◀ ▶ arrows
//   rows      Team (blue / red, max 3 humans per team) · Specialisation (Attack / Healing / Magic) · Look (Striker /
//             Mender / Mystic outfit) · Movement (keyboard only: mouse or WASD) · Language (日本語 / English, global) · Ready
//   i18n      all text via mt/i18n t(); the header chip / ←→ on the Language row / L key switch the language live.
//             Japanese uses the 'Vale JP' pixel face at 16·m device px (--vjp-c* vars from mt/i18n/dom.js).
//   confirm   ✕ / Enter: next row, on the last row toggles Ready.  Options: Ready.  △ / Tab: flip team
//   back      ○ / Esc: un-ready, else up a row.  HOLD ○ (0.8 s) / Esc on the first row: leave the slot.
//             ○ / Esc with nobody joined: back to the title.
// When every joined player is Ready a 3 s countdown starts (any change cancels it), then bots fill the 3v3
// (lobbyRoster), app.newMatch({seed, players}) and state 'loading'. Slots persist for Play Again (un-readied).
// Audio: a pad press tries AudioContext.resume() (counts as activation in some browsers); otherwise a banner asks for
// one key press / click, which the audio subsystem's own gesture listeners use to start.
// Front-end flow (mt/ui/menu.js, built here; it gets the 'menu' state's keys and pads from this module):
//   main menu "Play solo"   -> starter -> startSolo(): one human + bots, straight to 'loading' (Play again = same again)
//   "With a friend" / ?join -> starter -> openFriend(): the lobby in its online room view (one tap created / joined)
//   "Same screen"           -> openLocal(): this pad-join lobby (each card has a starter row)
// Every match gets `starter` on each human entry and app.newMatch(..., options: {difficulty, mode}) (menu-prefs.js).

import { SPECS, SPEC_IDS, TEAM_SIZE } from '../data/balance.js';
import { lobbyRoster } from '../sim/roster.js';
import { BTN, PadState, glyphFamily, kindLabel, rumblePattern } from './input/devices.js';
import { unlockAudio } from './input/gamepad.js';
import { SLOT_COLORS, SLOT_DARK } from './input/localPlayers.js';
import { loadWasdPref, saveWasdPref } from './input/keyboard.js';
import { t, getLang, nextLang, onLangChange, LANG_LABEL, specName, formName } from '../i18n/index.js'; // i18n: every lobby string + language row
import { HeroStage, heroFrames } from './stage.js';
import { TRAINER_CRISP, LOBBY_SCALES, TITLE_CRISP, TITLE_FRAMES, TITLE_SCALES } from './artspec.js';
import { vsPixels } from './logo.js';
import { glyphCanvas, fontReady } from './pixeltext.js';
import { CODE_ALPHABET, normCode } from '../net/transport.js'; // online play (mt/net): room codes
import { FrontMenu, triEl } from './menu.js'; // front-end flow: title -> main menu -> starter (state 'menu')
import { Guide } from './guide.js'; // in-game objective line + arrow (first minutes)
import { STARTERS, STARTER_TYPE, DIFFICULTIES, MODES, prefs, savePrefs, matchOptions, cycle, viewMode } from './menu-prefs.js';
import { qrCanvas } from './menu-qr.js'; // the invite link as a pixel QR code

const LOOKS = { attack: () => t('look.attack'), healing: () => t('look.healing'), magic: () => t('look.magic') }; // i18n
const SPEC_ICON = { attack: 'trainer/rally', healing: 'trainer/mend', magic: 'trainer/surge' };
const TEAM_NAME = [() => t('lobby.team.0'), () => t('lobby.team.1')]; // i18n (JA: short あお / あか to fit the row)
const COUNTDOWN = 3;
const HOLD_LEAVE = 0.8;

function specShort(id) { // i18n: ONE compact line per specialisation (lobby card)
  const p = SPECS[id].passive, pc = (v) => Math.round(v * 100) + '%';
  if (id === 'attack') return t('lobby.specS.attack', { dmg: pc(p.physicalDmg), as: pc(p.attackSpeed) });
  if (id === 'healing') return t('lobby.specS.healing', { hp: pc(p.maxHp) });
  return t('lobby.specS.magic', { mag: pc(p.mag), cd: pc(p.cooldown) });
}
function specLine(id) { // i18n
  const s = SPECS[id], p = s.passive, pc = (v) => Math.round(v * 100) + '%';
  if (id === 'attack') return t('lobby.spec.attack', { dmg: pc(p.physicalDmg), as: pc(p.attackSpeed), ls: pc(p.lifesteal) });
  if (id === 'healing') return t('lobby.spec.healing', { hp: pc(p.maxHp), thp: pc(p.trainerHp) });
  return t('lobby.spec.magic', { mag: pc(p.mag), cd: pc(p.cooldown), strong: p.strong });
}
// i18n: skill numbers come from balance.js (the old literal said Mend 28 %; DESIGN/balance say 24 %)
const r100 = (v) => Math.round((v || 0) * 100);
const SKILL_LINE = {
  attack: () => t('lobby.skill.attack', { as: r100(SPECS.attack.rally && SPECS.attack.rally.attackSpeedPct), ms: r100(SPECS.attack.rally && SPECS.attack.rally.msPct) }),
  healing: () => t('lobby.skill.healing', { heal: r100(SPECS.healing.mend && SPECS.healing.mend.monsterHealPct) }),
  magic: () => t('lobby.skill.magic', { bonus: r100(SPECS.magic.surge && SPECS.magic.surge.bonus) }),
};

const CSS = `
/* ONE pixel scale: --u = one art pixel of the lobby grid (title.js grid: ~384 rows, integer device-px zoom). Every
   stroke is 1 --u, every text line is the 16-px pixel font at 1 font px = 1 --u, every sprite is on the same grid. */
#mt-lobby{position:fixed;inset:0;z-index:6;pointer-events:auto;display:flex;flex-direction:column;align-items:center;color:#0d1230;opacity:0;transition:opacity .35s;user-select:none;-webkit-user-select:none;
  --u:2px;--f:calc(var(--u) * 16);--lh:calc(var(--u) * 18);
  font:400 var(--f)/var(--lh) 'Vale JP',system-ui,sans-serif;font-synthesis:none;-webkit-font-smoothing:none;font-kerning:none;word-break:keep-all;overflow-wrap:break-word;line-break:strict;
  --ink:#0d1230;--navy:#1b2350;--nv2:#24305e;--cream:#fbf8ef;--edge:#fff3d6;--gold:#ffd23a;--gut:calc(var(--u) * 12);--cut:var(--u)}
#mt-lobby *{font-weight:400!important;font-style:normal!important;letter-spacing:0!important;font-family:'Vale JP',system-ui,sans-serif!important}
html.mt-lobby-on .sv-menu{display:none!important}
#mt-lobby.on{opacity:1}
#mt-lobby:not(.on){pointer-events:none}
#mt-lobby .lb-bg{display:none}
/* pixel panels: corners cut by one art pixel */
#mt-lobby .px{clip-path:polygon(var(--cut) 0,calc(100% - var(--cut)) 0,100% var(--cut),100% calc(100% - var(--cut)),calc(100% - var(--cut)) 100%,var(--cut) 100%,0 calc(100% - var(--cut)),0 var(--cut))}
#mt-lobby .pg{display:inline-block;vertical-align:middle;image-rendering:pixelated;flex:none}
/* header: title plate left; the join chip + the mode chip right */
#mt-lobby .lb-head{position:relative;margin-top:max(calc(var(--u) * 4),env(safe-area-inset-top,0px));display:flex;align-items:center;gap:calc(var(--u) * 6);width:calc(100vw - var(--gut) * 2);justify-content:space-between}
#mt-lobby .lb-title{display:flex;align-items:center;margin-right:auto;background:var(--navy);color:var(--cream);border:var(--u) solid var(--ink);box-shadow:inset 0 0 0 var(--u) #4c5a96;padding:calc(var(--u) * 2) calc(var(--u) * 8) calc(var(--u) * 2) calc(var(--u) * 3)}
#mt-lobby .lb-title > div{display:flex;align-items:center;gap:calc(var(--u) * 4)}
#mt-lobby .lb-title small{display:none}
#mt-lobby .lb-title b{display:block;white-space:nowrap}
#mt-lobby .lb-orb{width:calc(var(--u) * 16);height:calc(var(--u) * 16);flex:none;image-rendering:pixelated}
#mt-lobby .lb-mode{display:flex;gap:calc(var(--u) * 4);align-items:center;flex-shrink:0}
#mt-lobby .chip{background:var(--cream);border:var(--u) solid var(--ink);box-shadow:inset 0 calc(var(--u) * -1) 0 #d6cfb6;padding:calc(var(--u) * 1) calc(var(--u) * 5);white-space:nowrap}
#mt-lobby .chip.vs{background:var(--gold);box-shadow:inset 0 calc(var(--u) * -1) 0 #e0a024}
#mt-lobby .chip.dim,#mt-lobby .chip.lang{display:none}
#mt-lobby .lb-join{display:flex;align-items:center;gap:calc(var(--u) * 3);padding:calc(var(--u) * 1) calc(var(--u) * 5);background:var(--navy);color:var(--cream);border:var(--u) solid var(--ink);box-shadow:inset 0 0 0 var(--u) #4c5a96;white-space:nowrap;pointer-events:auto;cursor:pointer}
#mt-lobby .lb-join[hidden]{display:none}
#mt-lobby .lb-join .pn{color:var(--pc)}
#mt-lobby .lb-join > span{display:flex;align-items:center;gap:calc(var(--u) * 1)}
/* main: line-up stage above, the player card(s) below (side by side on phones) */
#mt-lobby .lb-main{position:relative;flex:1 1 auto;min-height:0;width:calc(100vw - var(--gut) * 2);display:flex;flex-direction:column;align-items:center;gap:calc(var(--u) * 4);margin-top:calc(var(--u) * 2)}
#mt-lobby .lb-vs{position:relative;flex:1 1 auto;width:100%;min-height:calc(var(--u) * 96);pointer-events:none}
#mt-lobby .lb-vs canvas{position:absolute;left:0;top:0;image-rendering:pixelated;transform-origin:0 0}
#mt-lobby .lb-vs .vsm{position:absolute;left:50%;top:42%;width:var(--vsw,96px);transform:translate(-50%,-50%);image-rendering:pixelated}
#mt-lobby .lb-vs .vsm canvas{position:static;display:block;width:100%;height:auto}
#mt-lobby .lb-vs .tplate{position:absolute;padding:0 calc(var(--u) * 5);color:#fff;white-space:nowrap;border:var(--u) solid var(--ink);box-shadow:inset 0 var(--u) 0 rgba(255,255,255,.4)}
#mt-lobby .lb-vs .tplate.t0{background:#3f74c8}#mt-lobby .lb-vs .tplate.t1{background:#d24a3c}
#mt-lobby .lb-vs .tag{position:absolute;display:flex;flex-direction:column;align-items:center}
#mt-lobby .lb-vs .tag b{display:block;padding:0 calc(var(--u) * 3);border:var(--u) solid var(--ink);background:var(--pc);color:var(--ink);white-space:nowrap}
#mt-lobby .lb-vs .tag i{width:calc(var(--u) * 5);height:calc(var(--u) * 3);background:var(--ink);clip-path:polygon(0 0,calc(var(--u) * 5) 0,calc(var(--u) * 5) var(--u),calc(var(--u) * 4) var(--u),calc(var(--u) * 4) calc(var(--u) * 2),calc(var(--u) * 3) calc(var(--u) * 2),calc(var(--u) * 3) calc(var(--u) * 3),calc(var(--u) * 2) calc(var(--u) * 3),calc(var(--u) * 2) calc(var(--u) * 2),var(--u) calc(var(--u) * 2),var(--u) var(--u),0 var(--u))}
#mt-lobby .lb-vs .tag.rdy b{background:#3fb64a;color:#fff}
/* cards */
#mt-lobby .lb-cards{position:relative;display:flex;justify-content:center;align-items:stretch;gap:calc(var(--u) * 6);width:100%;flex:0 0 auto;min-height:0}
#mt-lobby .card{flex:0 1 var(--cw,calc(var(--u) * 256));min-width:0;position:relative;background:var(--cream);border:var(--u) solid var(--ink);box-shadow:inset 0 0 0 var(--u) #fff;display:flex;flex-direction:column;overflow:hidden;transition:transform .2s;--cut:calc(var(--u) * 2)}
#mt-lobby .card[hidden],#mt-lobby .card.empty{display:none}
#mt-lobby .card .band{flex:none;display:flex;align-items:center;gap:calc(var(--u) * 4);padding:calc(var(--u) * 1) calc(var(--u) * 5);background:var(--pc);border-bottom:var(--u) solid var(--ink);color:var(--ink);position:relative}
#mt-lobby .card .band .pn{}
#mt-lobby .card .band .tm{color:#fff;padding:0 calc(var(--u) * 3);border:var(--u) solid var(--ink);white-space:nowrap}
#mt-lobby .card .band .tm.t0{background:#3f74c8}#mt-lobby .card .band .tm.t1{background:#d24a3c}
#mt-lobby .card .band .dev{margin-left:auto;white-space:nowrap;color:var(--ink)}
#mt-lobby .card .band svg{display:none}
#mt-lobby .rows{flex:none;padding:calc(var(--u) * 3) calc(var(--u) * 4) calc(var(--u) * 1);display:flex;flex-direction:column;gap:0}
#mt-lobby .row{position:relative;display:grid;grid-template-columns:calc(var(--f) * 3.5) 1fr;align-items:center;gap:calc(var(--u) * 3);padding:var(--u) calc(var(--u) * 2) var(--u) calc(var(--u) * 7)}
html body #mt-lobby .rows .row{padding-left:calc(var(--u) * 7)}
#mt-lobby .row.f{box-shadow:inset 0 0 0 var(--u) var(--ink);background:color-mix(in srgb,var(--pc) 40%,#fff)}
#mt-lobby .row.f::before{content:"";position:absolute;left:calc(var(--u) * 2);top:calc(50% - var(--u) * 2.5);width:calc(var(--u) * 3);height:calc(var(--u) * 5);background:var(--ink);
  clip-path:polygon(0 0,var(--u) 0,var(--u) var(--u),calc(var(--u) * 2) var(--u),calc(var(--u) * 2) calc(var(--u) * 2),calc(var(--u) * 3) calc(var(--u) * 2),calc(var(--u) * 3) calc(var(--u) * 3),calc(var(--u) * 2) calc(var(--u) * 3),calc(var(--u) * 2) calc(var(--u) * 4),var(--u) calc(var(--u) * 4),var(--u) calc(var(--u) * 5),0 calc(var(--u) * 5));animation:lb-cur .8s steps(2,end) infinite}
@keyframes lb-cur{50%{transform:translateX(var(--u))}}
#mt-lobby .row .lb{color:var(--nv2);white-space:nowrap;overflow:hidden}
#mt-lobby .val{display:flex;align-items:center;gap:calc(var(--u) * 1);min-width:0}
#mt-lobby .val .ar{flex:none;display:grid;place-items:center;cursor:pointer;color:var(--ink);min-width:calc(var(--u) * 12);height:var(--lh)}
#mt-lobby .val .ar:hover{color:#c45a00}
#mt-lobby .val .v{flex:1 1 auto;min-width:0;text-align:center;white-space:nowrap;overflow:hidden;display:flex;align-items:center;justify-content:center;gap:calc(var(--u) * 2);color:var(--ink)}
#mt-lobby .val .v.blue{color:#2858b8}
#mt-lobby .val .v.red{color:#c0342a}
#mt-lobby .val .v canvas{width:calc(var(--u) * 16);height:calc(var(--u) * 16);image-rendering:pixelated;flex:none}
#mt-lobby .desc{flex:none;margin:calc(var(--u) * 2) calc(var(--u) * 5) calc(var(--u) * 3);color:#2c3666;white-space:nowrap;overflow:hidden;text-align:center}
#mt-lobby .readybtn{flex:none;margin:auto calc(var(--u) * 5) calc(var(--u) * 5);border:var(--u) solid var(--ink);padding:calc(var(--u) * 2) 0 calc(var(--u) * 3);background:var(--gold);color:var(--ink);cursor:pointer;box-shadow:inset 0 calc(var(--u) * -2) 0 #e0a024,inset 0 var(--u) 0 #fff1a8;text-align:center}
#mt-lobby .readybtn.f{outline:var(--u) solid var(--ink);outline-offset:calc(var(--u) * -4);animation:lb-pulse 1.2s steps(2,end) infinite}
@keyframes lb-pulse{50%{background:#ffe27a}}
#mt-lobby .card.ready .readybtn{background:#3fb64a;color:#fff;box-shadow:inset 0 calc(var(--u) * -2) 0 #2a8a34,inset 0 var(--u) 0 #8ae890}
#mt-lobby .card.ready{transform:translateY(calc(var(--u) * -2))}
#mt-lobby .hint{display:none}
#mt-lobby .hold{position:absolute;left:0;bottom:0;height:calc(var(--u) * 2);background:#e8574f;width:0}
/* footer: one translucent band (Gen-5 menu text band) — status left, the controls right, plain pixel text */
#mt-lobby .lb-foot{position:relative;align-self:stretch;display:flex;align-items:center;justify-content:space-between;gap:calc(var(--u) * 8);margin-top:calc(var(--u) * 4);
  padding:calc(var(--u) * 3) var(--gut) max(calc(var(--u) * 3),env(safe-area-inset-bottom,0px));background:rgba(18,16,48,.55);box-shadow:inset 0 var(--u) 0 rgba(8,8,28,.45);color:var(--cream);min-height:var(--lh)}
#mt-lobby .status{display:flex;align-items:center;gap:calc(var(--u) * 2);white-space:nowrap;text-shadow:var(--u) var(--u) 0 var(--ink)}
#mt-lobby .status.go{color:#9af29a}
#mt-lobby .back{color:var(--cream);cursor:default;display:flex;align-items:center;gap:calc(var(--u) * 2);white-space:nowrap;text-shadow:var(--u) var(--u) 0 var(--ink)}
#mt-lobby .back .sep{display:inline-block;width:calc(var(--u) * 4)}
#mt-lobby .back span{display:inline-flex;align-items:center;gap:calc(var(--u) * 1)}#mt-lobby .back .bk{cursor:pointer}
#mt-lobby .snd{position:absolute;right:var(--gut);top:calc(var(--u) * 40);background:var(--gold);border:var(--u) solid var(--ink);padding:0 calc(var(--u) * 4);display:none;z-index:2}
#mt-lobby .snd.on{display:block}
/* shorter desktop windows (1280×720 …): no description line */
@media (max-height:740px) and (min-height:521px){#mt-lobby .desc{display:none}}
/* phones in landscape / short windows: 2-column grid — the player card spans the full height on the left (rows scroll
   inside if they must; READY is pinned and always visible), header + line-up + status on the right */
@media (max-height:520px){
#mt-lobby{display:grid;grid-template-columns:auto minmax(0,1fr);grid-template-rows:auto minmax(0,1fr) auto;column-gap:calc(var(--u) * 6);align-items:stretch;justify-items:stretch;
  padding:max(calc(var(--u) * 4),env(safe-area-inset-top,0px)) max(calc(var(--u) * 6),env(safe-area-inset-right,0px)) max(calc(var(--u) * 4),env(safe-area-inset-bottom,0px)) max(calc(var(--u) * 6),env(safe-area-inset-left,0px));box-sizing:border-box}
#mt-lobby .lb-main{display:contents}
#mt-lobby .lb-head{grid-column:2;grid-row:1;width:auto;margin:0;justify-content:center;gap:calc(var(--u) * 4);flex-wrap:wrap}
#mt-lobby .lb-title{padding:calc(var(--u) * 1) calc(var(--u) * 5) calc(var(--u) * 1) calc(var(--u) * 2)}
#mt-lobby .lb-mode .chip:not(.lb-join){display:none}
#mt-lobby .lb-cards{grid-column:1;grid-row:1/4;width:auto;max-height:none;min-height:0;justify-content:flex-start;align-items:stretch;gap:calc(var(--u) * 4);margin:0}
#mt-lobby .card{flex:0 0 var(--cw,min(46vw,calc(var(--u) * 232)));min-height:0}
#mt-lobby .lb-vs{grid-column:2;grid-row:2;height:auto;width:auto;min-height:0}
#mt-lobby .back{display:none}
#mt-lobby .lb-foot{grid-column:2;grid-row:3;margin:calc(var(--u) * 2) 0 0;padding:calc(var(--u) * 2) calc(var(--u) * 4);justify-content:center}
#mt-lobby .status{white-space:normal;text-align:center}
#mt-lobby .rows{padding:calc(var(--u) * 2) calc(var(--u) * 3) calc(var(--u) * 1);flex:1 1 auto;min-height:0;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:none}
#mt-lobby .rows::-webkit-scrollbar{display:none}
#mt-lobby .readybtn{margin:calc(var(--u) * 2) calc(var(--u) * 4) calc(var(--u) * 4)}
#mt-lobby .desc{margin:calc(var(--u) * 1) calc(var(--u) * 4) 0}
#mt-lobby .snd{top:auto;bottom:calc(var(--u) * 30);right:max(calc(var(--u) * 6),env(safe-area-inset-right,0px))}
#mt-lobby .row{grid-template-columns:calc(var(--f) * 3.2) 1fr}
}
@media (max-height:385px){#mt-lobby .desc{display:none}}
/* online (mt/net/online.js): the online panel and the game room's player list are cards of the same pixel style */
#mt-lobby .card.net{--pc:#8fc8ff}
#mt-lobby .card.mem{--pc:#ffd23a;flex:0 1 var(--mw,calc(var(--u) * 200))}
#mt-lobby .card.net .band b,#mt-lobby .card.mem .band b{white-space:nowrap}
#mt-lobby .card.net .band .st{margin-left:auto;white-space:nowrap}
#mt-lobby .card.net .row.it{grid-template-columns:1fr;cursor:pointer}
#mt-lobby .card.net .row.it .v{display:flex;align-items:center;justify-content:flex-start;gap:calc(var(--u) * 3);min-width:0;white-space:nowrap;overflow:hidden}
#mt-lobby .card.net .row.it.dis{color:#8a8fae;cursor:default}
#mt-lobby .card.net .row.it .k{display:inline-block;min-width:calc(var(--u) * 34);padding:0 calc(var(--u) * 2);background:var(--navy);color:var(--cream);text-align:center}
#mt-lobby .card.net .row.it .n{color:#5a6290;margin-left:auto}
#mt-lobby .card.net .row.sep{padding-top:0;padding-bottom:0;color:var(--nv2);grid-template-columns:1fr}
#mt-lobby .card.net .msg{margin:calc(var(--u) * 2) calc(var(--u) * 6) calc(var(--u) * 3);white-space:normal;color:#2c3666;line-height:var(--lh)}
#mt-lobby .card.net .msg.err{color:#c0342a}
#mt-lobby .card.net .nmi{width:100%;min-width:0;box-sizing:border-box;font:inherit;color:var(--ink);background:#fff;border:var(--u) solid var(--ink);padding:0 calc(var(--u) * 3);height:var(--lh);border-radius:0;outline:none}
#mt-lobby .card.net .code{position:relative;display:flex;gap:calc(var(--u) * 4);justify-content:center;margin:calc(var(--u) * 5) 0 calc(var(--u) * 3)}
#mt-lobby .card.net .code span{width:calc(var(--u) * 18);height:calc(var(--u) * 22);border:var(--u) solid var(--ink);background:#fff;display:grid;place-items:center;box-shadow:inset 0 calc(var(--u) * -2) 0 #d6cfb6}
#mt-lobby .card.net .code span.cur{background:var(--gold);box-shadow:inset 0 calc(var(--u) * -2) 0 #e0a024}
#mt-lobby .card.net .code input{position:absolute;inset:0;opacity:0;width:100%;height:100%;font-size:16px;border:0;padding:0;cursor:pointer}
#mt-lobby .card.mem .ms{display:flex;flex-direction:column;padding:calc(var(--u) * 2) calc(var(--u) * 3) 0}
#mt-lobby .card.mem .m{display:grid;grid-template-columns:auto 1fr auto auto;gap:calc(var(--u) * 3);align-items:center;padding:var(--u) calc(var(--u) * 2)}
#mt-lobby .card.mem .m.me{background:color-mix(in srgb,var(--gold) 35%,#fff);box-shadow:inset 0 0 0 var(--u) var(--ink)}
#mt-lobby .card.mem .m .tm{color:#fff;padding:0 calc(var(--u) * 2);border:var(--u) solid var(--ink);white-space:nowrap}
#mt-lobby .card.mem .m .tm.t0{background:#3f74c8}#mt-lobby .card.mem .m .tm.t1{background:#d24a3c}
#mt-lobby .card.mem .m .nm{white-space:nowrap;overflow:hidden;min-width:0}
#mt-lobby .card.mem .m canvas{width:calc(var(--u) * 16);height:calc(var(--u) * 16);image-rendering:pixelated}
#mt-lobby .card.mem .m .rd{white-space:nowrap;color:#8a8fae}#mt-lobby .card.mem .m .rd.ok{color:#2a8a34}
#mt-lobby .card.mem .m .tag{white-space:nowrap;padding:0 calc(var(--u) * 2);background:var(--navy);color:var(--cream)}
#mt-lobby .card.mem .m.empty{color:#8a8fae}#mt-lobby .card.mem .m.empty .tm{visibility:hidden}
#mt-lobby .card.mem .sm2{margin:calc(var(--u) * 2) calc(var(--u) * 5) calc(var(--u) * 4);color:#5a6290;white-space:normal}
#mt-lobby .card.mem .lnk{display:flex;gap:calc(var(--u) * 3);align-items:center;margin:calc(var(--u) * 3) calc(var(--u) * 5) 0}
#mt-lobby .card.mem .lnk .lb{white-space:nowrap;color:#5a6290}
#mt-lobby .card.mem .lnk input{flex:1 1 auto;min-width:0;font:inherit;color:var(--ink);background:#fff;border:var(--u) solid var(--ink);padding:0 calc(var(--u) * 2);height:calc(var(--u) * 14)}
#mt-lobby .card.mem .lnk .cp{white-space:nowrap;cursor:pointer;padding:0 calc(var(--u) * 4);background:var(--gold);border:var(--u) solid var(--ink);box-shadow:inset 0 calc(var(--u) * -2) 0 #e0a024}
#mt-lobby .readybtn.dim{background:#e9e4d2;color:#8a8fae;box-shadow:inset 0 calc(var(--u) * -2) 0 #d6cfb6;animation:none}
@media (max-height:520px){#mt-lobby .card.mem{flex:0 1 var(--mw,min(40vw,calc(var(--u) * 180)))}#mt-lobby .card.mem .sm2{display:none}}
/* online: the cards may shrink below their content (the line-up keeps its minimum); rows scroll, READY / START pinned */
#mt-lobby.online .lb-cards{flex:0 1 auto;min-height:0}
#mt-lobby.online .card{min-height:0}
#mt-lobby.online .card .rows{flex:0 1 auto;min-height:0;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:none}
#mt-lobby.online .card .rows::-webkit-scrollbar{display:none}
#mt-lobby.online .card.mem .ms{flex:0 1 auto;min-height:0;overflow-y:auto;scrollbar-width:none}
@media (max-height:620px) and (min-height:521px){#mt-lobby.online .card .desc,#mt-lobby.online .card.mem .sm2{display:none}}
/* short desktop windows (960×540 …): the card shrinks below its content, rows scroll, READY stays pinned and visible */
@media (max-height:620px) and (min-height:521px){
#mt-lobby .lb-cards{flex:0 1 auto;min-height:0}
#mt-lobby .card{min-height:0}
#mt-lobby .card .rows{flex:0 1 auto;min-height:0;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:none}
#mt-lobby .card .rows::-webkit-scrollbar{display:none}
#mt-lobby .readybtn{margin-top:calc(var(--u) * 3)}
}
/* online room ("Ready?"): the invite card (code, QR, copy / share) left, the players + team + START right */
#mt-lobby.online .lb-vs,#mt-lobby.online .lb-cards,#mt-lobby.online .lb-join,#mt-lobby.online .lb-mode .chip{display:none!important}
#mt-lobby.online.code .lb-cards{display:flex!important}
#mt-lobby.online.code .lb-room{display:none}
#mt-lobby .lb-room{position:relative;flex:1 1 auto;min-height:0;width:100%;display:flex;gap:calc(var(--u) * 8);align-items:stretch;justify-content:center}
#mt-lobby .lb-room[hidden]{display:none}
#mt-lobby .rm-inv{flex:none;display:flex;flex-direction:column;background:var(--cream);border:var(--u) solid var(--ink);box-shadow:inset 0 0 0 var(--u) #fff;--cut:calc(var(--u) * 2);--pc:#8fc8ff}
#mt-lobby .rm-inv .band,#mt-lobby .rm-ppl .band{flex:none;display:flex;align-items:center;gap:calc(var(--u) * 4);padding:calc(var(--u) * 1) calc(var(--u) * 6);background:var(--pc);border-bottom:var(--u) solid var(--ink);white-space:nowrap}
#mt-lobby .rm-ib{flex:1 1 auto;min-height:0;display:flex;gap:calc(var(--u) * 8);padding:calc(var(--u) * 6) calc(var(--u) * 8) calc(var(--u) * 4);align-items:center}
#mt-lobby .rm-qr{flex:none;border:var(--u) solid var(--ink);background:#fffdf4;line-height:0}
#mt-lobby .rm-qr canvas{display:block;image-rendering:pixelated}
#mt-lobby .rm-side{flex:none;display:flex;flex-direction:column;gap:calc(var(--u) * 5);align-items:stretch}
#mt-lobby .rm-bs{display:flex;flex-direction:column;gap:calc(var(--u) * 5)}
#mt-lobby .rm-ib.stack{flex-direction:column;justify-content:center;gap:calc(var(--u) * 5)}
#mt-lobby .rm-ib.stack .rm-bs{flex-direction:row;gap:calc(var(--u) * 4)}
#mt-lobby .rm-ib.stack .rm-bs .rbtn{flex:1 1 auto}
#mt-lobby .rm-ib.stack.col .rm-bs{flex-direction:column;gap:calc(var(--u) * 5)}
#mt-lobby .rm-code{display:flex;gap:calc(var(--u) * 3);align-items:center;justify-content:center}
#mt-lobby .rm-code span{width:calc(var(--u) * 22);height:calc(var(--u) * 26);display:grid;place-items:center;background:#fff;border:var(--u) solid var(--ink);box-shadow:inset 0 calc(var(--u) * -3) 0 #d6cfb6;font-size:calc(var(--f) * 1)}
#mt-lobby .rm-code small{color:#5a6290;margin-right:calc(var(--u) * 3)}
#mt-lobby .rbtn{display:flex;align-items:center;justify-content:center;gap:calc(var(--u) * 3);min-height:max(calc(var(--u) * 22),48px);padding:0 calc(var(--u) * 8);background:var(--cream);border:var(--u) solid var(--ink);box-shadow:inset 0 calc(var(--u) * -2) 0 #d6cfb6,inset 0 var(--u) 0 #fff;cursor:pointer;white-space:nowrap;--cut:calc(var(--u) * 2)}
#mt-lobby .rbtn.main{background:var(--gold);box-shadow:inset 0 calc(var(--u) * -2) 0 #e0a024,inset 0 var(--u) 0 #fff1a8}
#mt-lobby .rbtn.f{outline:var(--u) solid var(--ink);outline-offset:calc(var(--u) * -4);background:#fff1b0}
#mt-lobby .rbtn.main.f{background:#ffe27a}
#mt-lobby .rbtn.dis{color:#8a8fae;cursor:default}
/* a button that cannot be pressed yet: flat grey, dashed edge, the reason as its label (never gold) */
#mt-lobby .rbtn.main.dis,#mt-lobby .rbtn.main.dis.f{background:#dcd7c6;color:#6f7496;border-style:dashed;box-shadow:none}
#mt-lobby .rbtn.ok,#mt-lobby .rbtn.main.ok,#mt-lobby .rbtn.main.ok.f{background:#3fb64a;color:#fff;box-shadow:inset 0 calc(var(--u) * -2) 0 #2a8a34,inset 0 var(--u) 0 #8ae890}
#mt-lobby .rbtn.main.ok.f{outline-color:#fff}
/* the invite link, shortened but complete (host/…?join=CODE), wrapping inside the card */
#mt-lobby .rm-url{margin:0 calc(var(--u) * 8) calc(var(--u) * 2);color:#5a6290;white-space:normal;overflow-wrap:anywhere}
#mt-lobby .rm-hint{margin:0 calc(var(--u) * 8) calc(var(--u) * 5);color:#2c3666;white-space:normal}
#mt-lobby .rm-inv.nohint .rm-hint{display:none}
#mt-lobby .rm-url .nw{white-space:nowrap}
#mt-lobby .rm-ppl{flex:1 1 0;min-width:0;max-width:calc(var(--u) * 330);display:flex;flex-direction:column;gap:calc(var(--u) * 5)}
#mt-lobby .rm-hd{flex:none;align-self:flex-start;background:var(--navy);color:var(--cream);border:var(--u) solid var(--ink);box-shadow:inset 0 0 0 var(--u) #4c5a96;padding:calc(var(--u) * 1) calc(var(--u) * 8);white-space:nowrap}
#mt-lobby .rm-pcs{flex:1 1 auto;min-height:0;display:flex;gap:calc(var(--u) * 5)}
#mt-lobby .pc{flex:1 1 0;min-width:0;display:flex;flex-direction:column;background:var(--cream);border:var(--u) solid var(--ink);box-shadow:inset 0 0 0 var(--u) #fff;--cut:calc(var(--u) * 2);--pc:#ffd23a;overflow:hidden}
#mt-lobby .pc.t1{--pc:#ffb0a0}#mt-lobby .pc.t0{--pc:#9cc8ff}
#mt-lobby .pc .band{flex:none;display:flex;align-items:center;gap:calc(var(--u) * 3);padding:calc(var(--u) * 1) calc(var(--u) * 5);background:var(--pc);border-bottom:var(--u) solid var(--ink);white-space:nowrap;overflow:hidden}
#mt-lobby .pc .band .tg2{margin-left:auto;padding:0 calc(var(--u) * 3);background:var(--navy);color:var(--cream)}
#mt-lobby .pc .band.edit{cursor:pointer;pointer-events:auto}
#mt-lobby .pc .band .ed{margin-left:auto;flex:none;display:grid;place-items:center;width:calc(var(--u) * 14);height:calc(var(--u) * 12);background:var(--cream);border:var(--u) solid var(--ink)}
#mt-lobby .pc .band .ed canvas{width:calc(var(--u) * 8);height:calc(var(--u) * 8);image-rendering:pixelated}
#mt-lobby .pc .band input{flex:1 1 auto;min-width:0;font:inherit;color:var(--ink);background:#fff;border:var(--u) solid var(--ink);padding:0 calc(var(--u) * 2);height:calc(var(--u) * 14);outline:none;border-radius:0;pointer-events:auto}
#mt-lobby .pc .mon{flex:1 1 auto;min-height:calc(var(--u) * 40);display:grid;place-items:center;padding-top:calc(var(--u) * 2);overflow:hidden}
#mt-lobby .pc .mon canvas{image-rendering:pixelated}
#mt-lobby .pc .who{display:flex;align-items:center;justify-content:center;gap:calc(var(--u) * 3);padding:calc(var(--u) * 1) calc(var(--u) * 4) calc(var(--u) * 3);white-space:nowrap}
#mt-lobby .pc .who canvas{width:calc(var(--u) * 16);height:calc(var(--u) * 16)}
#mt-lobby .pc .rd{text-align:center;padding:0 calc(var(--u) * 4) calc(var(--u) * 3);color:#8a8fae;white-space:normal;word-break:keep-all}
#mt-lobby .pc .rd.ok{color:#2a8a34}
#mt-lobby .pc.wait{background:rgba(251,248,239,.7);border-style:dashed}
#mt-lobby .pc.wait .mon b{font-size:calc(var(--f) * 2);line-height:1;color:#8a8fae;padding-bottom:calc(var(--u) * 8)}
#mt-lobby .pc.wait .rd{animation:lb-blink 1s steps(2,end) infinite}
@keyframes lb-blink{50%{opacity:.35}}
#mt-lobby .rm-row{flex:none;display:flex;gap:calc(var(--u) * 4)}
#mt-lobby .rm-row .rbtn{flex:1 1 0;min-width:0}
#mt-lobby .rm-row .rbtn.on{background:var(--navy);color:var(--cream);box-shadow:inset 0 0 0 var(--u) #4c5a96}
#mt-lobby .rm-row .rbtn.on.f{outline-color:var(--gold)}
#mt-lobby .rm-row .rbtn small{color:inherit;opacity:.8;font-size:var(--f)}
#mt-lobby .rm-row .rbtn.two{flex-direction:column;gap:0;padding-top:calc(var(--u) * 2);padding-bottom:calc(var(--u) * 3)}
#mt-lobby .rm-go{flex:none;min-height:max(calc(var(--u) * 30),56px)}
#mt-lobby .rm-msg{padding:calc(var(--u) * 10) calc(var(--u) * 10);white-space:normal;color:#2c3666;max-width:calc(var(--u) * 240)}
#mt-lobby .rm-msg.err{color:#c0342a}
/* the link / hint / other-rooms lines wrap to the card's width instead of widening it (the card is sized by roomQR) */
#mt-lobby .rm-url,#mt-lobby .rm-hint,#mt-lobby .rm-games{contain:inline-size}
#mt-lobby .rm-games .rbtn{white-space:normal;text-align:center}
#mt-lobby .rm-games{display:flex;flex-direction:column;gap:calc(var(--u) * 2);margin:0 calc(var(--u) * 8) calc(var(--u) * 5)}
#mt-lobby .lb-back canvas{image-rendering:pixelated;display:block}
#mt-lobby .lb-back{display:grid;flex:none;pointer-events:auto;cursor:pointer;min-width:max(calc(var(--u) * 24),48px);min-height:max(calc(var(--u) * 22),44px);place-items:center;background:var(--cream);border:var(--u) solid var(--ink);box-shadow:inset 0 calc(var(--u) * -2) 0 #d6cfb6}
@media (max-height:520px){
#mt-lobby.online{display:flex;flex-direction:column;padding:max(calc(var(--u) * 4),env(safe-area-inset-top,0px)) max(calc(var(--u) * 6),env(safe-area-inset-right,0px)) max(calc(var(--u) * 3),env(safe-area-inset-bottom,0px)) max(calc(var(--u) * 6),env(safe-area-inset-left,0px))}
#mt-lobby.online .lb-head{width:100%;justify-content:space-between}
#mt-lobby.online .lb-main{display:flex;width:100%;margin-top:calc(var(--u) * 4)}
#mt-lobby.online .lb-foot{margin-top:calc(var(--u) * 3)}
#mt-lobby .rm-hint{display:none}
/* short screens: player cards lie on their side (monster left, name + status right) so the starter stays big */
#mt-lobby .pc{display:grid;grid-template-columns:auto minmax(0,1fr);grid-template-rows:auto 1fr auto auto 1fr}
#mt-lobby .pc .band{grid-column:1 / -1}
#mt-lobby .pc .mon{grid-column:1;grid-row:2 / 6;width:calc(var(--u) * 80);min-height:0;padding-top:0}
#mt-lobby .pc .who{grid-column:2;grid-row:3;justify-content:flex-start;padding-left:0}
#mt-lobby .pc .rd{grid-column:2;grid-row:4;text-align:left;padding-left:0}
#mt-lobby .pc.wait .mon{width:calc(var(--u) * 28)}
#mt-lobby .pc.wait .mon b{padding-bottom:0}
}
/* touch: finger-sized arrows, but the glyph stays on the pixel font scale (input/touch.css sets 14 px + rounding) */
html body.mt-touchui #mt-lobby .val .ar{font-size:var(--f);border-radius:0;background:none}
html body.mt-touchui #mt-lobby .chip,html body.mt-touchui #mt-lobby .readybtn{border-radius:0}
@media (max-height:400px){
body.mt-touchui #mt-lobby .val .ar{min-width:36px;min-height:36px}
body.mt-touchui #mt-lobby .val .v{min-height:30px}
html body #mt-lobby .rows .row{padding:0 calc(var(--u) * 1) 0 calc(var(--u) * 6)}
#mt-lobby .rows{gap:0}
}
@media (max-height:520px) and (max-width:640px){
#mt-lobby .card{flex-basis:min(52vw,calc(var(--u) * 220))}
html body #mt-lobby .rows .row{grid-template-columns:calc(var(--f) * 3) 1fr;padding-left:calc(var(--u) * 6);gap:calc(var(--u) * 2)}#mt-lobby .val .v canvas{display:none}
#mt-lobby .lb-orb{display:none}
}
`;

const PAD_SVG = '<svg viewBox="0 0 24 16"><path fill="#24305e" d="M6 1h12c3 0 5 3 5.6 7.5.5 3.7-.6 6.3-2.5 6.3-1.6 0-2.6-1.5-3.6-3.2H6.5C5.5 13.3 4.5 14.8 2.9 14.8 1 14.8-.1 12.2.4 8.5 1 4 3 1 6 1z"/><circle cx="17.5" cy="6" r="1.4" fill="#fbf8ef"/><circle cx="19.6" cy="8.2" r="1.4" fill="#fbf8ef"/><path fill="#fbf8ef" d="M5.2 5h1.6v1.7h1.7v1.6H6.8V10H5.2V8.3H3.5V6.7h1.7z"/></svg>';
const TOUCH_SVG = '<svg viewBox="0 0 24 16"><path fill="#24305e" d="M9 2.2a1.6 1.6 0 0 1 3.2 0v5.3l4.4.9c1.3.3 2.1 1.5 1.9 2.8L18 14.6H9.6L5.8 9.9a1.5 1.5 0 0 1 2.2-2l1 1z"/></svg>';
const KB_SVG = '<svg viewBox="0 0 24 16"><rect x="1" y="2" width="22" height="12" rx="2.5" fill="#24305e"/><g fill="#fbf8ef"><rect x="3.5" y="4.5" width="2.4" height="2.2"/><rect x="7.2" y="4.5" width="2.4" height="2.2"/><rect x="10.9" y="4.5" width="2.4" height="2.2"/><rect x="14.6" y="4.5" width="2.4" height="2.2"/><rect x="18.2" y="4.5" width="2.4" height="2.2"/><rect x="6" y="9.3" width="12" height="2.2"/></g></svg>';

/** scroll a row into view inside its own scrolling box only (never the page) */
function keepInView(row) {
  const box = row && row.parentElement; if (!box || box.scrollHeight <= box.clientHeight + 1) return;
  const top = row.offsetTop - box.offsetTop, bot = top + row.offsetHeight;
  if (top < box.scrollTop) box.scrollTop = top; else if (bot > box.scrollTop + box.clientHeight) box.scrollTop = bot - box.clientHeight;
}
const h = (tag, cls, parent, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; if (parent) parent.appendChild(e); return e; };
const setText = (e, t) => { if (e.textContent !== t) e.textContent = t; };

/** pixel button glyph (pixeltext.js glyphCanvas) as an <img> on the lobby grid: 1 glyph px = 1 art px (--u) */
const PG = new Map();
function pg(kind) {
  let s = PG.get(kind);
  if (!s) {
    const c = glyphCanvas(kind);
    s = `<img class="pg" alt="" draggable="false" src="${c.toDataURL()}" style="width:calc(var(--u) * ${c.width});height:calc(var(--u) * ${c.height})">`;
    if (fontReady()) PG.set(kind, s);   // keycap labels use the pixel font: cache once it is loaded
  }
  return s;
}
const PS_G = { 0: 'cross', 1: 'circle', 2: 'square', 3: 'tri', OPT: 'opt' }, XB_G = { 0: 'xa', 1: 'xb', 2: 'xx', 3: 'xy', OPT: 'menu' };
/** button glyph: DualSense symbols / Xbox letters / keycaps ('←→' = the ◀▶ keycap) */
function glyphHTML(fam, i) {
  if (fam === 'kbm') return pg('key:' + (i === '←→' ? 'LR' : i));
  return pg((fam === 'ps' ? PS_G : XB_G)[i] || 'cross');
}
const TOUCH_ICON = { toString: () => pg('hand') };
/** a DualSense-style controller pictogram for the join card */
const GAMEPAD_ART = '<svg class="gp" viewBox="0 0 64 40"><path d="M18 3h28c7 0 11.5 6 13.5 15 2 9.4 1 17.4-4.4 18.6-4.4 1-7.4-3.4-10-8.6H18.9c-2.6 5.2-5.6 9.6-10 8.6C3.5 35.4 2.5 27.4 4.5 18 6.5 9 11 3 18 3z" fill="#e9edff" stroke="#0d1230" stroke-width="2.4"/><path d="M22 6h20v8H22z" fill="#c9d0ea" stroke="#0d1230" stroke-width="1.6" rx="2"/><path d="M13.6 11.6h3.2v4h4v3.2h-4v4h-3.2v-4h-4v-3.2h4z" fill="#3a467e"/><circle cx="24" cy="25" r="4.6" fill="#3a467e"/><circle cx="40" cy="25" r="4.6" fill="#3a467e"/><circle cx="50" cy="12" r="2.3" fill="none" stroke="#5fe0b8" stroke-width="1.3"/><circle cx="50" cy="22" r="2.3" fill="#1b2350"/><path d="M48.6 20.6l2.8 2.8M51.4 20.6l-2.8 2.8" stroke="#9cc0ff" stroke-width="1.2"/><circle cx="45" cy="17" r="2.3" fill="none" stroke="#f7a6dc" stroke-width="1.3"/><circle cx="55" cy="17" r="2.3" fill="none" stroke="#ff8a8a" stroke-width="1.3"/></svg>';
const TOUCH_ART = '<svg class="gp" viewBox="0 0 64 40"><rect x="10" y="4" width="44" height="32" rx="6" fill="#e9edff" stroke="#0d1230" stroke-width="2.4"/><rect x="14" y="8" width="36" height="24" rx="2" fill="#3a467e"/><path d="M30 14a2.2 2.2 0 0 1 4.4 0v7.4l6.2 1.3c1.8.4 3 2.1 2.7 3.9L42.4 34H30.8l-5.3-6.6a2.1 2.1 0 0 1 3.1-2.8l1.4 1.4z" fill="#fff3d6" stroke="#0d1230" stroke-width="1.6"/></svg>';

/** the default online names (net.defaultName in each language): such a member is shown as "You" / "Friend" */
const DEFAULT_NAMES = new Set(['トレーナー', 'Trainer']);
/** a 7×7 pixel pencil (tap your name to change it) */
function pencilCanvas() {
  const c = document.createElement('canvas'); c.width = 8; c.height = 8; const g = c.getContext('2d');
  const rows = ['.....##.', '....#ww#', '...#ww#.', '..#ww#..', '.#ww#...', '#yy#....', '#y#.....', '##......'];
  rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === '.') return; g.fillStyle = ch === '#' ? '#1b2350' : ch === 'w' ? '#ffd23a' : '#f4ecd8'; g.fillRect(x, y, 1, 1); }));
  return c;
}

export class Lobby {
  constructor(ctx, locals = ctx.app.mtLocals, gamepad = ctx.app.mtPads) {
    this.ctx = ctx; this.app = ctx.app; this.locals = locals; this.gamepad = gamepad;
    this.slots = []; this.padSt = new Map(); this.root = null; this.cards = [];
    this.countdown = -1; this.t = 0; this.icons = new Map(); this.pendingPad = null; this.art = null; this.vs = null;
    this.online = null; // online panel / game room (mt/net/online.js): {view:'menu'|'code'|'room', focus, code, cur}
    this.flow = null; this.solo = null; this.pendingOnline = null; // front-end flow: 'solo' | 'friend' | 'local'
    this.app.mtLobby = this;
    try { this.menu = new FrontMenu(ctx, this); } catch (e) { console.error('[lobby] menu', e); this.menu = null; }
    try { this.guide = new Guide(ctx); } catch (e) { console.error('[lobby] guide', e); this.guide = null; }
    this.app.on('state', (s) => this.onState(s));
    onLangChange(() => this.relocalize()); // i18n: rebuild every text live
    this.onKey = (e) => this.key(e);
    window.addEventListener('keydown', this.onKey, true);
    import('../../art/sprites/index.js').then((m) => { this.art = m; this.dirty = true; }).catch((e) => console.warn('[lobby] art', e));
  }

  // ------------------------------------------------------------------ state flow
  onState(s) {
    const app = this.app;
    if (s === 'select') {           // menu Play / end-screen Play Again -> lobby instead of champion select
      if (this.flow === 'solo' && this.solo && !(this.app.mtNet && this.app.mtNet.inRoom())) { this.startSolo(this.solo.dev, this.solo.starter); return; } // Play again (solo): the same setup, at once
      app.state = 'lobby'; app.fire('state', 'lobby'); return;
    }
    if (s === 'lobby') this.enter(); else this.leave();
  }

  go(s) { this.app.state = s; this.app.fire('state', s); }

  enter() {
    // the legacy title layer (.sv-menu) goes away at once, not on the legacy fade-out timer: never in a lobby frame
    document.documentElement.classList.add('mt-lobby-on');
    this.build();
    for (const sl of this.slots) { sl.ready = false; sl.row = 0; }
    const net = this.app.mtNet;
    if (net && net.inRoom()) {
      // back from an online match (Play again / Rematch): the same game room, the same one local player
      this.online = null;
      if (!this.slots.length) this.joinKbm();
      this.slots = this.slots.slice(0, 1); if (this.slots[0]) this.slots[0].slot = 0;
      this.online = { view: 'room', focus: 0, code: '', cur: 0 };
      this.pendingPad = null; this.syncNet();
    } else if (this.pendingOnline) {
      this.beginOnline(this.pendingOnline); this.pendingOnline = null; this.pendingPad = null;
    } else {
      this.online = null;
      // whoever opened the lobby joins: a pad (pendingPad) or the keyboard/mouse (menu click / Enter)
      if (this.pendingPad) { this.joinPad(this.pendingPad); this.pendingPad = null; }
      else if (!this.slots.length) this.joinKbm();
    }
    this.countdown = -1;
    this.root.hidden = false; requestAnimationFrame(() => this.root && this.root.classList.add('on'));
    this.dirty = true; this.render();
  }
  leave() {
    document.documentElement.classList.remove('mt-lobby-on');
    if (!this.root || this.root.hidden) return;
    this.root.classList.remove('on'); const r = this.root; setTimeout(() => { if (this.app.state !== 'lobby') r.hidden = true; }, 360);
  }

  // ------------------------------------------------------------------ slots
  freeSlot() { for (let s = 0; s < 4; s++) if (!this.slots.some((x) => x.slot === s)) return s; return -1; }
  teamCount(t, except) { return this.slots.filter((x) => x.team === t && x !== except).length; }
  add(dev, extra) {
    if (this.online) return null; // online: one player per machine (the one who opened it)
    const s = this.freeSlot(); if (s < 0) return null;
    const team = this.teamCount(0) < TEAM_SIZE ? 0 : 1;
    const used = this.slots.filter((x) => x.team === team).map((x) => x.spec);
    const spec = SPEC_IDS.find((id) => !used.includes(id)) || SPEC_IDS[s % 3];
    const P = prefs(), mine = this.slots.length === 0;
    const takenSt = this.slots.map((x) => x.starter), starter = mine ? P.starter : STARTERS.find((id) => !takenSt.includes(id)) || STARTERS[s % 3];
    const sl = { slot: s, device: dev, team, spec: mine ? P.spec : spec, look: mine ? P.look : spec, starter, ready: false, row: 0, holdT: 0, name: 'Player ' + (s + 1), wasd: false, ...extra }; // name: English key, roster shows trainerName()
    this.slots.push(sl); this.slots.sort((a, b) => a.slot - b.slot);
    this.countdown = -1; this.dirty = true; this.sfx('confirm');
    return sl;
  }
  /** the screen's own player (keyboard+mouse or touch — the same 'kbm' device, it drives app.playerId) */
  joinKbm() { if (this.slots.some((x) => x.device === 'kbm')) return null; return this.add('kbm', { inputType: this.app.mtInputMode === 'touch' ? 'touch' : 'kbm', wasd: loadWasdPref() }); }
  joinPad(pad) {
    const dev = 'pad:' + pad.index;
    if (this.slots.some((x) => x.device === dev)) return null;
    const sl = this.add(dev, { inputType: pad.kind, padId: pad.id, padIndex: pad.index });
    if (sl) { rumblePattern(pad.index, 'join'); unlockAudio(this.app); }
    return sl;
  }
  drop(sl) {
    this.slots.splice(this.slots.indexOf(sl), 1);
    this.countdown = -1; this.dirty = true; this.sfx('click');
  }
  rows(sl) { // the starter first (the first monster), online play lives in the main menu now
    if (this.online) return sl.device === 'kbm' && sl.inputType !== 'touch' ? ['team', 'spec', 'look', 'move', 'lang', 'ready'] : ['team', 'spec', 'look', 'lang', 'ready'];
    return sl.device === 'kbm' && sl.inputType !== 'touch' ? ['starter', 'team', 'spec', 'look', 'move', 'lang', 'ready'] : ['starter', 'team', 'spec', 'look', 'lang', 'ready'];
  }
  /** the input mode prompts are drawn for (touch-first devices show touch prompts before their first tap) */
  inputView() { return viewMode(this.app); }
  relocalize() { // i18n: language switched — rebuild the lobby DOM in place
    if (!this.root) return;
    const on = !this.root.hidden && this.app.state === 'lobby';   // (a lobby fading out after leaving stays gone)
    this.root.remove(); this.root = null; this.cards = [];
    this.build();
    if (on) { this.root.hidden = false; this.root.classList.add('on'); }
    this.dirty = true; this.render();
  }

  change(sl, row, d) {
    if (sl.ready && row !== 'ready') return;
    if (row === 'net') { this.netRow(sl); return; } // Mode: Local <-> Online
    const room = this.online && this.online.view === 'room', net = this.app.mtNet;
    if (row === 'team') {
      const tm = 1 - sl.team;
      if (room ? !(net && net.setMine({ tm })) : this.teamCount(tm, sl) >= TEAM_SIZE) { this.sfx('deny'); return; }
      sl.team = tm;
    } else if (row === 'spec') {
      const i = (SPEC_IDS.indexOf(sl.spec) + d + 3) % 3, prev = sl.spec;
      sl.spec = SPEC_IDS[i];
      if (sl.look === prev) sl.look = sl.spec; // outfit follows the spec until changed on purpose
    } else if (row === 'starter') {
      sl.starter = STARTERS[(STARTERS.indexOf(sl.starter) + d + STARTERS.length) % STARTERS.length];
      if (this.slots[0] === sl) savePrefs({ starter: sl.starter });
    } else if (row === 'look') {
      sl.look = SPEC_IDS[(SPEC_IDS.indexOf(sl.look) + d + 3) % 3];
    } else if (row === 'move') {
      sl.wasd = !sl.wasd; saveWasdPref(sl.wasd);
    } else if (row === 'lang') {
      this.sfx('click'); if (sl.padIndex >= 0) rumblePattern(sl.padIndex, 'ui');
      nextLang(d); return; // i18n: global; relocalize() rebuilds the DOM
    } else if (row === 'ready') { this.toggleReady(sl); return; }
    this.countdown = -1; this.dirty = true; this.sfx('click');
    if (sl.padIndex >= 0) rumblePattern(sl.padIndex, 'ui');
    if (room) this.syncNet();
  }
  toggleReady(sl, on = !sl.ready) {
    if (this.online && this.online.view === 'room') {   // game room: guests ready up, the host starts the match
      const net = this.app.mtNet; if (!net) return;
      if (net.isHost) { if (on && net.canStart()) { this.sfx('confirm'); net.startMatch(); } else if (on) this.sfx('deny'); return; }
    }
    if (on && !sl.ready) sl.readyAt = this.t;
    sl.ready = on; this.dirty = true; this.sfx(on ? 'confirm' : 'click');
    if (on) sl.row = this.rows(sl).length - 1;
    if (!on) this.countdown = -1;
    if (sl.padIndex >= 0) rumblePattern(sl.padIndex, on ? 'join' : 'ui');
    if (this.online && this.online.view === 'room') this.syncNet();
  }
  confirm(sl) {
    const R = this.rows(sl);
    if (R[sl.row] === 'ready' || sl.ready) this.toggleReady(sl, true);
    else { sl.row = Math.min(R.length - 1, sl.row + 1); this.dirty = true; this.sfx('click'); }
  }
  back(sl) {
    if (sl.ready) { this.toggleReady(sl, false); return; }
    if (sl.row > 0) { sl.row--; this.dirty = true; this.sfx('click'); return; }
    return 'leave';
  }
  nav(sl, dir) {
    const R = this.rows(sl);
    if (dir === 'up' || dir === 'down') {
      if (sl.ready) return;
      sl.row = (sl.row + (dir === 'down' ? 1 : -1) + R.length) % R.length; this.dirty = true; this.sfx('click');
    } else this.change(sl, R[sl.row], dir === 'right' ? 1 : -1);
  }

  sfx(kind) {
    const a = this.app.registry && this.app.registry.get('audio');
    try { if (a && a.ready) { if (kind === 'confirm' && a.confirm) a.confirm(); else if (a.click) a.click(); } } catch { /* audio not ready */ }
  }

  // ------------------------------------------------------------------ input
  key(e) {
    const app = this.app;
    if (app.state === 'menu') { if (this.menu) this.part('menu', () => this.menu.key(e)); return; }   // title / main menu / starter (menu.js)
    if (app.state !== 'lobby') return;
    if (this.online) { if (this.online.view === 'code') this.onlineKey(e); else this.roomKeyIn(e); this.render(); return; } // online: code entry / the room
    const tg = e.target; if (tg && tg.tagName === 'INPUT') return;   // typing a name
    e.stopImmediatePropagation(); e.preventDefault();
    if (e.repeat && !/Arrow|Key[WASD]/.test(e.code)) return;
    const sl = this.slots.find((x) => x.device === 'kbm') || (this.online ? this.slots[0] : null);
    const c = e.code;
    if (!sl) {
      if (c === 'Enter' || c === 'Space' || c === 'NumpadEnter') this.joinKbm();
      else if (c === 'Escape' && !this.slots.length) this.go('menu');
      this.render(); return;
    }
    if (c === 'Enter' || c === 'Space' || c === 'NumpadEnter') this.confirm(sl);
    else if (c === 'Escape' || c === 'Backspace') { if (this.back(sl) === 'leave') { if (this.online) this.netLeave(); else { this.drop(sl); if (!this.slots.length) this.go('menu'); } } }
    else if (c === 'ArrowUp' || c === 'KeyW') this.nav(sl, 'up');
    else if (c === 'ArrowDown' || c === 'KeyS') this.nav(sl, 'down');
    else if (c === 'ArrowLeft' || c === 'KeyA') this.nav(sl, 'left');
    else if (c === 'ArrowRight' || c === 'KeyD') this.nav(sl, 'right');
    else if (c === 'Tab') this.change(sl, 'team', 1);
    else if (c === 'KeyR') this.toggleReady(sl);
    else if (c === 'KeyL') nextLang(1); // i18n
    this.render();
  }

  pads(dt) {
    if (!this.gamepad) this.gamepad = this.app.mtPads;
    const pads = this.gamepad && this.gamepad.pads ? this.gamepad.pads : [];
    const app = this.app;
    for (const pad of pads) {
      let s = this.padSt.get(pad.index); if (!s) this.padSt.set(pad.index, s = new PadState());
      s.tick(pad, dt);
      const dir = s.navDir(pad, dt);
      if (app.state === 'menu') { if (this.menu) this.part('menu', () => this.menu.padInput(pad, s, dir)); continue; }   // menu.js: title / main / starter
      if (app.state !== 'lobby') continue;
      if (s.any()) unlockAudio(app);
      const sl = this.slots.find((x) => x.device === 'pad:' + pad.index);
      if (this.online) { if (sl || this.slots.length === 0 || this.slots[0].device === 'kbm') { if (this.online.view === 'code') this.onlinePad(s, dir); else this.roomPad(s, dir); } continue; } // online: code entry / the room
      if (!sl) {
        if (s.down(BTN.CROSS) || s.down(BTN.OPTIONS)) this.joinPad(pad);
        else if (s.down(BTN.CIRCLE) && !this.slots.length) this.go('menu');
        continue;
      }
      sl.padIndex = pad.index;
      if (dir) this.nav(sl, dir);
      if (s.down(BTN.CROSS)) this.confirm(sl);
      if (s.down(BTN.OPTIONS)) this.toggleReady(sl);
      if (s.down(BTN.TRIANGLE)) this.change(sl, 'team', 1);
      if (s.pressed(BTN.CIRCLE)) {
        sl.holdT = s.heldFor(BTN.CIRCLE);
        if (sl.holdT >= HOLD_LEAVE) { sl.holdT = 0; if (this.online) this.netLeave(); else this.drop(sl); rumblePattern(pad.index, 'ui'); continue; }
      } else if (sl.holdT > 0) {
        // released before the hold completed: a tap = back
        if (sl.holdT < 0.3 && this.back(sl) === 'leave' && this.online) this.netLeave();
        sl.holdT = 0;
      }
    }
    // pads unplugged in the lobby leave their slot
    for (const sl of [...this.slots]) if (sl.device.startsWith('pad:') && !pads.some((p) => 'pad:' + p.index === sl.device)) { if (this.online) { if (this.online.view === 'room') this.netLeave(); this.online = null; } this.drop(sl); }
  }

  // ------------------------------------------------------------------ frame
  update(f) {
    const dt = Math.min(0.1, f.dt || 0); this.t += dt;
    this.pads(dt);
    if (this.menu) this.part('menu', () => this.menu.update(f));
    if (this.guide) this.part('guide', () => this.guide.update(f));
    if (f.state !== 'lobby' || !this.root) return;
    // the screen's player follows the input family it really uses (touch <-> keys); pads keep their own cards
    const kb = this.slots.find((x) => x.device === 'kbm'), mode = this.app.mtInputMode;
    if (kb && (mode === 'touch' || mode === 'kbm') && kb.inputType !== mode) { kb.inputType = mode; const R = this.rows(kb); kb.row = Math.min(kb.row, R.length - 1); this.dirty = true; }
    if (mode !== this.lastMode) { this.lastMode = mode; this.dirty = true; for (const C of this.cards) C.key = ''; }
    if (this.online) { // online: no local countdown — the host's START begins the match (mt/net/online.js)
      const net = this.app.mtNet;
      if (this.online.view === 'wait') this.netGo();
      if (this.online.view === 'room' && net && !net.inRoom() && !net.joining) { this.online.view = 'fail'; this.online.focus = 0; this.online.hostGo = false; for (const s of this.slots) s.ready = false; this.dirty = true; }
      if ((this.online.view === 'wait' || this.online.view === 'fail' || this.online.view === 'menu') && net && net.inRoom() && !this.online.busy) { this.online.view = 'room'; this.dirty = true; this.syncNet(); }
      if (this.online.view === 'room' && net && net.inRoom()) this.roomRules(net);
      this.countdown = -1;
      this.render(); this.roomTick(dt);
      return;
    }
    const all = this.slots.length > 0 && this.slots.every((x) => x.ready);
    if (all && this.countdown < 0) { this.countdown = COUNTDOWN; this.sfx('confirm'); }
    if (!all) this.countdown = -1;
    if (this.countdown >= 0) {
      const before = Math.ceil(this.countdown);
      this.countdown -= dt;
      if (Math.ceil(this.countdown) !== before && this.countdown > 0) this.sfx('click');
      if (this.countdown <= 0) { this.start(); return; }
      this.dirty = true;
    }
    this.render();
    this.vsTick(dt);
  }

  start(opts = {}) {
    const app = this.app;
    this.countdown = -1;
    const slots = this.slots.map((s) => ({ ...s }));
    const starters = Object.fromEntries(slots.map((s) => [s.slot, s.starter || prefs().starter]));
    const players = lobbyRoster(slots, { starters, ...opts });
    const seed = opts.seed ?? ((Date.now() / 1000) | 0) % 100000;
    this.flow = 'local';
    app.newMatch({ seed, players, options: matchOptions() });
    for (const sl of this.slots) sl.ready = false;
    this.go('loading');
    return players;
  }

  // ------------------------------------------------------------------ front-end flow entries (mt/ui/menu.js)
  /** a guarded sub-part (menu / guide): its errors are counted like an mt-ui part's, the lobby keeps running */
  part(name, fn) {
    try { return fn(); } catch (e) {
      const app = this.app, k = 'mt-ui:' + name, g = app.errors && (app.errors[k] || (app.errors[k] = { count: 0, last: '' }));
      if (g) { g.count++; g.last = String(e && e.stack || e).slice(0, 400); if (g.count <= 3) console.error('[' + k + ']', e); }
      return undefined;
    }
  }
  /** ひとりで あそぶ: this device's trainer (with the chosen starter) + 5 bots, straight into the match */
  startSolo(dev, starter) {
    const P = prefs(), app = this.app;
    this.flow = 'solo'; this.solo = { dev: { ...dev }, starter }; this.online = null; this.countdown = -1;
    const slot = { slot: 0, device: dev.device || 'kbm', team: 0, spec: P.spec, look: P.look, starter, name: 'Player 1',
      inputType: dev.inputType || 'kbm', padId: dev.padId || '', padIndex: dev.padIndex ?? -1, wasd: dev.device === 'kbm' ? loadWasdPref() : false };
    const players = lobbyRoster([slot], { starters: { 0: starter } });
    const seed = ((Date.now() / 1000) | 0) % 100000;
    app.newMatch({ seed, players, options: matchOptions() });
    this.go('loading');
    return players;
  }
  /** おなじ がめんで: the pad-join lobby, the device that chose it already joined */
  openLocal(pad) {
    this.flow = 'local'; this.online = null; this.pendingOnline = null;
    this.slots = []; this.pendingPad = pad || null;
    this.go('select');
  }
  /** ともだちと あそぶ / invite link: the lobby's online room — created at once (or the link's room joined) */
  openFriend(o, dev, starter, pad) {
    this.flow = 'friend'; this.pendingOnline = { ...o, dev: { ...dev }, starter }; this.pendingPad = pad || null;
    this.go('select');
  }
  beginOnline(o) {
    const P = prefs(), net = this.app.mtNet, dev = o.dev || { device: 'kbm', inputType: 'kbm' };
    const sl = { slot: 0, device: dev.device || 'kbm', team: 0, spec: P.spec, look: P.look, starter: o.starter || P.starter, ready: false, row: 0, holdT: 0, name: 'Player 1',
      inputType: dev.inputType || 'kbm', padId: dev.padId || '', padIndex: dev.padIndex ?? -1, wasd: dev.device === 'kbm' ? loadWasdPref() : false };
    this.slots = [sl]; this.countdown = -1;
    this.online = { view: 'wait', focus: 0, code: '', cur: 0, want: o.join ? 'join' : 'create', joinCode: o.join || null };
    if (net) {
      net.setDevice({ device: sl.device, inputType: sl.inputType, padId: sl.padId, padIndex: sl.padIndex, wasd: sl.wasd });
      net.setMine({ tm: 0, sp: sl.spec, lk: sl.look, rd: 0, starter: sl.starter });   // starter: presence `sr` (mt/net/online.js)
      if (net.setMatchOptions) net.setMatchOptions(matchOptions());                    // the host's choice travels in `go.o`
    }
    this.netGo();
  }
  /** create / join once the transport is up (status 'init' -> later frames retry) */
  netGo() {
    const O = this.online, net = this.app.mtNet; if (!O || O.view !== 'wait' || O.busy) return;
    if (!net || net.status === 'init') return;
    if (!net.available()) { O.view = 'fail'; this.dirty = true; return; }
    // claude.ai room (games are listed to everyone on the page): exactly one open game of someone else = the friend's
    // room -> join it instead of opening a second one (falls back to creating if it is gone)
    if (O.want === 'create' && !O.noAuto && net.tr && net.tr.discovery) {
      const open = net.openGames().filter((g) => g.open && g.version !== false);
      if (open.length === 1) { O.want = 'join'; O.joinCode = open[0].code; O.auto = true; }
    }
    O.busy = true;
    const p = O.want === 'join' ? net.joinGame(O.joinCode) : net.createGame();
    p.then((ok) => {
      O.busy = false; if (this.online !== O) return;
      if (ok) { O.view = 'room'; this.syncNet(); } else if (O.auto) { O.auto = false; O.noAuto = true; O.want = 'create'; O.joinCode = null; if (net) net.error = null; }
      else O.view = 'fail';
      this.dirty = true;
    })
      .catch(() => { O.busy = false; if (this.online === O) { O.view = 'fail'; this.dirty = true; } });
  }


  // ------------------------------------------------------------------ online room ("Ready?" screen)
  // Left: the invite (code, a pixel QR of the link, Copy link, Share… = navigator.share). Right: one card per player
  // with their starter, the team choice (Together vs bots | Against each other: one tap), bot strength + match length
  // (the host's; travel in `go.o`), and the big START (host) / READY (guests join ready). The match starts when the
  // host has pressed START and every guest is ready (net.canStart).
  /** my room members (or just me while connecting) */
  roomMembers(net, mem) {
    const sl = this.slots[0] || {};
    if (mem && mem.length) return mem.filter((m) => m.ok).map((m) => (m.me && !m.starter ? { ...m, starter: sl.starter } : m));
    return [{ peer: 'me', me: true, nm: net ? net.displayName() : '', tm: sl.team || 0, starter: sl.starter, rd: !!sl.ready, host: true, ok: true, st: 'lb' }];
  }
  teamMode(ms) { return ms.length < 2 ? prefs().tmode : ms.every((m) => m.tm === ms[0].tm) ? 'coop' : 'vs'; }
  roomItems() {
    const O = this.online, net = this.app.mtNet, it = [];
    if (!O) return it;
    if (O.view === 'fail') return ['retry', 'back'];
    if (O.view !== 'room') return ['back'];
    const link = net && net.inviteUrl ? net.inviteUrl() : null;
    if (link) { it.push('copy'); if (typeof navigator !== 'undefined' && navigator.share) it.push('share'); }
    for (const g of this.roomGames()) it.push('g:' + g.code);
    it.push('code', 'coop', 'vs');
    if (net && net.isHost) it.push('diff', 'len');
    it.push('go');
    return it;
  }
  /** other open games (discovery transports only: claude.ai room / mock) */
  roomGames() { const net = this.app.mtNet; return net && net.openGames ? net.openGames().filter((g) => g.open && g.code !== net.code).slice(0, 3) : []; }
  roomFocusId() { const O = this.online, it = this.roomItems(); if (!O || !it.length) return null; if (O.rf == null || !it.includes(O.rf)) O.rf = it.includes('go') && this.roomMembers(this.app.mtNet, this.app.mtNet && this.app.mtNet.inRoom() ? this.app.mtNet.members() : null).length > 1 ? 'go' : it[0]; return O.rf; }
  roomMove(d) { const it = this.roomItems(), cur = this.roomFocusId(); if (!it.length) return; this.online.rf = it[(it.indexOf(cur) + d + it.length) % it.length]; this.sfx('click'); }
  roomBack() {
    const O = this.online;
    if (!O) { if (this.slots.some((x) => x.ready)) { for (const x of this.slots) x.ready = false; this.countdown = -1; this.dirty = true; this.sfx('click'); return; } this.slots = []; this.sfx('click'); this.go('menu'); return; }   // local lobby: back to the main menu
    if (O.view === 'code') { this.onlineActivate({ id: 'back' }); return; }
    const net = this.app.mtNet; if (net && net.joining && net.cancelJoin) net.cancelJoin();   // backing out of "joining…" (WebRTC retries)
    this.sfx('click'); this.online = null; this.go('menu');   // NetController leaves the room on the title state
  }
  roomActivate(id) {
    const O = this.online, net = this.app.mtNet, sl = this.slots[0]; if (!O || !id) return;
    if (id === 'back') { this.roomBack(); return; }
    if (id === 'retry') { O.view = 'wait'; O.busy = false; if (net) net.error = null; this.netGo(); this.sfx('click'); return; }
    if (!net || O.view !== 'room') return;
    if (id === 'copy') { this.copyLink(net.inviteUrl()); return; }
    if (id === 'share') { try { navigator.share({ title: 'Sundered Vale', text: t('room.shareText'), url: net.inviteUrl() }).catch(() => {}); } catch { /* not allowed */ } this.sfx('confirm'); return; }
    if (id === 'code') { O.prevView = 'room'; O.view = 'code'; O.code = ''; O.cur = 0; O.focus = 0; this.netCard.key = ''; this.sfx('click'); return; }
    if (id.startsWith('g:')) { const code = id.slice(2); O.view = 'wait'; O.want = 'join'; O.joinCode = code; O.busy = false; this.netGo(); this.sfx('confirm'); return; }
    if (id === 'coop' || id === 'vs') { this.setTeamMode(id); return; }
    if (id === 'diff' || id === 'len' || id === 'cardsopt') {
      if (!net.isHost) { this.sfx('deny'); return; }
      const P = prefs(); savePrefs(id === 'diff' ? { difficulty: cycle(DIFFICULTIES, P.difficulty, 1) } : id === 'len' ? { mode: cycle(MODES, P.mode, 1) } : { cards: !P.cards });   // cardsopt: skill cards ON / OFF (input owner)
      if (net.setMatchOptions) net.setMatchOptions(matchOptions());
      this.sfx('click'); return;
    }
    if (id === 'go') {
      const ms = this.roomMembers(net, net.members());
      if (net.isHost) {
        if (ms.length < 2) { this.sfx('deny'); return; }
        O.hostGo = !O.hostGo; if (sl) sl.ready = O.hostGo; this.sfx(O.hostGo ? 'confirm' : 'click');
        if (O.hostGo && net.canStart()) { O.hostGo = false; net.startMatch(); }
      } else if (sl) { sl.ready = !sl.ready; sl.readyAt = this.t; this.syncNet(); this.sfx(sl.ready ? 'confirm' : 'click'); }
    }
  }
  setTeamMode(m) {
    const net = this.app.mtNet, sl = this.slots[0]; if (!net || !sl) return;
    savePrefs({ tmode: m });
    const others = this.roomMembers(net, net.members()).filter((x) => !x.me), ref = others.find((x) => x.host) || others[0];
    if (!ref) { this.sfx('click'); return; }   // alone: remembered, applied when the friend arrives (roomRules)
    const want = m === 'coop' ? ref.tm : 1 - ref.tm;
    if (want !== sl.team) { if (net.setMine({ tm: want })) sl.team = want; else { this.sfx('deny'); return; } }
    this.syncNet(); this.sfx('click');
  }
  /** per frame in the room: the host's remembered team choice once a friend arrives, guests ready on arrival, auto-start */
  roomRules(net) {
    const O = this.online, sl = this.slots[0]; if (!O || !sl) return;
    const ms = this.roomMembers(net, net.members()), n = ms.length;
    if (!net.isHost && !O.autoReady) { O.autoReady = true; sl.ready = true; sl.readyAt = this.t; this.syncNet(); }
    if (net.isHost && n >= 2 && (O.seenN || 1) < 2 && prefs().tmode === 'vs') this.setTeamMode('vs');
    if (n !== O.seenN) { if ((O.seenN || 1) < 2 && n >= 2 && O.rf !== 'go') O.rf = 'go'; O.seenN = n; this.dirty = true; }
    if (net.isHost && O.hostGo && n >= 2 && net.canStart()) { O.hostGo = false; net.startMatch(); }
  }
  copyLink(link) {
    if (!link) return;
    const done = () => { this.online && (this.online.copied = this.t); this.sfx('confirm'); };
    const sel = () => { try { const ta = document.createElement('textarea'); ta.value = link; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;top:0'; document.body.appendChild(ta); ta.select(); if (document.execCommand('copy')) done(); ta.remove(); } catch { /* clipboard blocked */ } };
    try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link).then(done, sel); else sel(); } catch { sel(); }
  }
  roomKeyIn(e) {
    const c = e.code; if (e.target && e.target.tagName === 'INPUT') return;
    e.stopImmediatePropagation(); e.preventDefault();
    if (e.repeat && !/Arrow/.test(c)) return;
    if (c === 'ArrowDown' || c === 'ArrowRight' || c === 'Tab' || c === 'KeyS' || c === 'KeyD') this.roomMove(1);
    else if (c === 'ArrowUp' || c === 'ArrowLeft' || c === 'KeyW' || c === 'KeyA') this.roomMove(-1);
    else if (c === 'Enter' || c === 'Space' || c === 'NumpadEnter') this.roomActivate(this.roomFocusId());
    else if (c === 'Escape' || c === 'Backspace') this.roomBack();
  }
  roomPad(s, dir) {
    if (dir === 'down' || dir === 'right') this.roomMove(1); else if (dir === 'up' || dir === 'left') this.roomMove(-1);
    if (s.down(BTN.CROSS)) this.roomActivate(this.roomFocusId());
    if (s.down(BTN.OPTIONS)) this.roomActivate('go');
    if (s.down(BTN.CIRCLE)) this.roomBack();
  }
  renderRoom(net, mem) {
    const O = this.online, R = this.roomEl;
    const ms = this.roomMembers(net, mem), link = O.view === 'room' && net && net.inviteUrl ? net.inviteUrl() : null;
    const games = O.view === 'room' ? this.roomGames() : [];
    const opt = (net && net.matchOptionsNow && net.matchOptionsNow()) || matchOptions();
    const err = net && net.error ? net.error : '';
    const copied = O.copied != null && this.t - O.copied < 1.6;
    const key = JSON.stringify([O.view, net && net.code, link, ms.map((m) => [m.peer, m.nm, m.tm, m.starter, m.rd, m.host, m.me]), opt, getLang(), this.roomFocusId(), O.hostGo, err, copied,
      games.map((g) => g.code + g.name), net && net.isHost, this.art ? 1 : 0, O.want, O.joinCode, prefs().tmode, (this.slots[0] || {}).ready,
      innerWidth, innerHeight, (this.app.mtMenuGrid || {}).Z, !!O.editName, this.inputView()]);   // (size: the QR is fitted to the room)
    if (key === this.roomKey_) return;
    this.roomKey_ = key;
    R.textContent = ''; this.roomMons = [];
    const F = this.roomFocusId(), host = !!(net && net.isHost);
    const B = (cls, parent, id, html) => { const b = h('div', 'rbtn px ' + cls + (id === F ? ' f' : ''), parent); b.setAttribute('role', 'button'); b.dataset.id = id; if (html != null) b.innerHTML = html; b.addEventListener('click', (e) => { e.stopPropagation(); this.online.rf = id; this.roomActivate(id); this.render(); }); return b; };
    // ---- the invite card
    const inv = h('div', 'rm-inv px', R);
    let qbox = null, side = null, ib = null;
    h('b', null, h('div', 'band', inv), t('room.invite'));
    if (O.view !== 'room') {
      const msg = h('div', 'rm-msg px' + (O.view === 'fail' ? ' err' : ''), inv);
      msg.textContent = O.view === 'fail' ? t(err || (net && !net.available() ? 'net.unavailable' : 'net.joinFailed')) : O.want === 'join' ? t('net.joining', { code: O.joinCode || '' }) : t('room.creating');
      if (O.view === 'fail') { const row = h('div', 'rm-row', inv); row.style.margin = '0 calc(var(--u) * 8) calc(var(--u) * 6)'; B('main', row, 'retry', t('room.retry')); B('', row, 'back', t('net.back')); }
    } else {
      ib = h('div', 'rm-ib', inv);
      qbox = link ? h('div', 'rm-qr', ib) : null;   // the QR is drawn once the room is laid out (roomQR)
      side = h('div', 'rm-side', ib);
      const cd = h('div', 'rm-code', side); h('small', null, cd, t('room.code')); for (const ch of String(net.code || '')) h('span', null, cd, ch);
      const bs = h('div', 'rm-bs', side);   // copy / share / join-with-code: a column beside the QR, a row under it
      if (link) {
        B('main', bs, 'copy', copied ? t('net.copied') : t('room.copy'));
        if (typeof navigator !== 'undefined' && navigator.share) B('', bs, 'share', t('room.share'));
      }
      B('', bs, 'code', t('net.joinCode'));
      if (link) {
        // shortened but complete: host/…?join=CODE, line breaks only after the host or before ?join
        let parts = [link]; try { const u = new URL(link), path = u.pathname.replace(/index\.html$/, ''); parts = [u.host + '/', path.length > 1 ? '…' : '', '?join=' + net.code]; } catch { /* keep */ }
        const ue = h('div', 'rm-url', inv); parts.filter(Boolean).forEach((x, i) => { if (i) ue.appendChild(document.createElement('wbr')); if (x[0] === '?') h('span', 'nw', ue, x); else ue.appendChild(document.createTextNode(x)); });
        h('div', 'rm-hint', inv, t('room.scan'));
      } else h('div', 'rm-hint', inv, t('room.codeHint', { code: net.code || '' }));
      if (games.length) { const gl = h('div', 'rm-games', inv); h('div', null, gl, t('room.others')); for (const g of games) B('', gl, 'g:' + g.code, `${g.code}・${g.name.replace(/[<>&]/g, '')}`); }
    }
    // ---- players, team, options, START
    const ppl = h('div', 'rm-ppl', R);
    h('b', null, h('div', 'rm-hd px', ppl), t('room.ready'));   // the "Ready?" panel: players, team, options, START
    const pcs = h('div', 'rm-pcs', ppl), others = ms.filter((m) => !m.me);
    let editInput = null;
    for (const m of ms.slice(0, 6)) {
      const c = h('div', 'pc px t' + m.tm, pcs), band = h('div', 'band', c);
      const custom = !!m.nm && !DEFAULT_NAMES.has(m.nm) && m.nm !== t('net.defaultName');
      const label = custom ? m.nm : m.me ? t('room.you') : others.length > 1 ? t('room.friendN', { n: others.indexOf(m) + 1 }) : t('room.friend');
      if (m.me && O.view === 'room' && O.editName) {   // quick name edit: Enter / tap away keeps it, Esc cancels
        const inp = h('input', null, band); inp.type = 'text'; inp.maxLength = 12; inp.value = O.nameDraft ?? (custom ? m.nm : '');
        inp.placeholder = t('room.namePh'); inp.autocomplete = 'off'; inp.spellcheck = false; inp.setAttribute('enterkeyhint', 'done'); inp.setAttribute('aria-label', t('room.rename'));
        const commit = () => { if (!O.editName) return; O.editName = false; if (net) net.setName(O.nameDraft ?? inp.value); O.nameDraft = null; this.roomKey_ = ''; this.dirty = true; };
        inp.addEventListener('input', () => { O.nameDraft = inp.value; });
        inp.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); commit(); } else if (e.key === 'Escape') { e.preventDefault(); O.editName = false; O.nameDraft = null; this.roomKey_ = ''; this.dirty = true; } });
        inp.addEventListener('blur', commit);
        inp.addEventListener('pointerdown', (e) => e.stopPropagation());
        editInput = inp;
      } else {
        h('span', null, band, label);
        if (m.me && custom) h('span', 'tg2', band, t('room.you'));
        if (m.me && O.view === 'room') {   // tap your own name to change it
          const ed = h('span', 'ed', band); ed.appendChild(pencilCanvas());
          band.classList.add('edit'); band.setAttribute('role', 'button'); band.setAttribute('aria-label', t('room.rename'));
          band.addEventListener('click', (e) => { e.stopPropagation(); O.editName = true; O.nameDraft = custom ? m.nm : ''; this.roomKey_ = ''; this.render(); });
        }
      }
      const mon = h('div', 'mon', c), cv = h('canvas', null, mon); cv.width = cv.height = 1; cv.style.width = cv.style.height = '1px';   // sized in roomTick (fits the box)
      this.roomMons.push({ cv, id: m.starter || 'cindle', i: this.roomMons.length });
      const who = h('div', 'who', c), st = m.starter || 'cindle';
      const ei = this.elemIcon(STARTER_TYPE[st]); if (ei) who.appendChild(ei); who.appendChild(document.createTextNode(formName(st)));
      h('div', 'rd' + (m.rd || m.host ? ' ok' : ''), c, m.host ? (m.me && O.hostGo ? t('room.waitStart') : '★ ' + t('net.host')) : m.rd ? t('lobby.ready') : t('room.notReady'));
    }
    if (ms.length < 2) { const c = h('div', 'pc px wait', pcs); h('div', 'band', c, '?'); h('b', null, h('div', 'mon', c), '?'); h('div', 'rd', c, O.view === 'room' ? t('room.waitFriend') : '…'); }
    if (O.view === 'room') {
      const tm = this.teamMode(ms), tr = h('div', 'rm-row', ppl);
      B('two' + (tm === 'coop' ? ' on' : ''), tr, 'coop', `<span>${t('room.together')}</span><small>${t('room.together.sub')}</small>`);
      B('two' + (tm === 'vs' ? ' on' : ''), tr, 'vs', `<span>${t('room.versus')}</span><small>${t('room.versus.sub')}</small>`);
      const orow = h('div', 'rm-row', ppl);
      const dl = t('opt.difficulty') + ' ' + t('opt.difficulty.' + (opt.difficulty || 'easy')), ll = t('opt.mode') + ' ' + t('opt.mode.' + (opt.mode || 'classic'));
      const cl = t('opt.cards') + ' ' + t('opt.cards.' + (opt.cards === false ? 'off' : 'on'));   // skill cards (match option `cards`)
      if (host) { B('', orow, 'diff', dl + ' ▶'); B('', orow, 'len', ll + ' ▶'); B('', orow, 'cardsopt', cl + ' ▶'); } else { h('div', 'rbtn px dis', orow, dl); h('div', 'rbtn px dis', orow, ll); h('div', 'rbtn px dis', orow, cl); }
      const me = ms.find((m) => m.me) || {}, can = ms.length >= 2;
      // the host's START says why it cannot be pressed yet (no friend in the room): grey, dashed, the reason as label
      const goLab = host ? (!can ? t('room.waitFriend') : O.hostGo ? t('room.waiting') : t('net.start')) : me.rd ? t('lobby.ready') : t('lobby.readyQ');
      const go = B('main rm-go' + (host && !can ? ' dis' : '') + ((host && O.hostGo && can) || (!host && me.rd) ? ' ok' : ''), ppl, 'go', goLab);
      if (host && !can) go.setAttribute('aria-disabled', 'true');
      else if (this.inputView() !== 'touch') go.insertAdjacentHTML('afterbegin', glyphHTML(this.slots[0] && this.slots[0].device !== 'kbm' ? glyphFamily(this.slots[0].inputType) : this.app.mtInputMode === 'kbm' ? 'kbm' : 'ps', this.app.mtInputMode === 'kbm' && !(this.slots[0] && this.slots[0].device !== 'kbm') ? 'Enter' : 0));
    }
    if (qbox) this.roomQR(qbox, link, R, ib, side);
    this.roomTick(0);
    if (editInput) { editInput.focus(); try { const n = editInput.value.length; editInput.setSelectionRange(n, n); } catch { /* old Safari */ } }
  }
  /** the invite QR as big as the room leaves it: whole art px per module (crisp). Three arrangements, measured: the code
   *  + buttons column beside the QR (wide or short screens), or under it with the buttons in a row / in a column (tall
   *  4:3 screens: a bigger QR). The "Ready?" panel keeps its min-content width (labels never clip, any language).
   *  Grid-size estimate when the lobby is not laid out yet. */
  roomQR(box, link, R, ib, side) {
    const MG = this.app.mtMenuGrid, q = MG && MG.Z ? MG.Z / MG.dpr : 2, ah = (MG && MG.ah) || 384, CAP = 200;
    const q0 = qrCanvas(link, { module: 1, quiet: 3 }), n = q0 ? q0.width : 35;
    let m;
    if (R.clientWidth > 0 && ib.clientHeight > 0) {
      const ppl = R.querySelector('.rm-ppl'), ps = ppl && ppl.style;
      let PPL = 230;
      if (ps) { ps.flex = 'none'; ps.width = 'min-content'; PPL = Math.min(330, Math.max(180, ppl.offsetWidth / q)); ps.flex = ps.width = ''; }
      const Rw = R.clientWidth / q, inv = ib.parentElement;   // room width (art px)
      // stacked (narrow card): the scan hint goes (the footer already says "send the link or the QR"), the QR gets its room
      const fit = (cls) => {
        ib.className = 'rm-ib' + cls; inv.classList.toggle('nohint', !!cls);
        const hI = ib.clientHeight / q, sw = side.offsetWidth / q, sh = side.offsetHeight / q;   // the card's free height
        const sz = !cls ? Math.min(hI - 12, Rw - sw - 36 - PPL, CAP) : sw + 26 + PPL <= Rw ? Math.min(hI - 17 - sh, Rw - 28 - PPL, CAP) : 0;
        return [cls, Math.floor(sz / n)];
      };
      const best = ['', ' stack', ' stack col'].map(fit).reduce((a, b) => (b[1] > a[1] ? b : a));
      ib.className = 'rm-ib' + best[0]; inv.classList.toggle('nohint', !!best[0]); m = best[1];
    } else m = Math.floor(Math.min(ah * 0.46, ((MG && MG.aw) || 512) - 24 - 132 - 36 - 230, CAP) / n);
    const qc = qrCanvas(link, { module: Math.max(2, m), quiet: 3 });
    if (!qc) { box.remove(); return; }
    qc.style.width = `calc(var(--u) * ${qc.width})`; qc.style.height = `calc(var(--u) * ${qc.height})`;
    box.appendChild(qc); box.title = link;
    // the text around it can wrap differently once it is in: step the module size down until nothing overflows
    for (let mm = Math.max(2, m) - 1; mm >= 2 && R.clientWidth > 0 && (ib.scrollHeight > ib.clientHeight + 1 || R.scrollWidth > R.clientWidth + 1); mm--) {
      const c2 = qrCanvas(link, { module: mm, quiet: 3 }); if (!c2) break;
      c2.style.width = `calc(var(--u) * ${c2.width})`; c2.style.height = `calc(var(--u) * ${c2.height})`; box.replaceChildren(c2);
    }
  }
  /** the players' starters, animated (pre-baked title atlases at raster scale 1) */
  roomTick(dt) {
    this.roomT = (this.roomT || 0) + dt;
    for (const M of this.roomMons || []) {
      if (!M.sc) {   // the biggest pre-baked title scale whose idle frame fits the card's monster box (art px)
        const MG = this.app.mtMenuGrid, q = MG && MG.Z ? MG.Z / MG.dpr : 2, box = M.cv.parentElement, hA = box ? box.clientHeight / q : 60, wA = box ? box.clientWidth / q : 80;
        M.sc = [2.5, 2, 1.75, 1.5, 1.25, 1].find((v) => 46 * v + 8 <= hA && 44 * v + 10 <= wA) || 1;
      }
      const e = heroFrames(M.id, M.sc, TITLE_FRAMES, 8, false, undefined, TITLE_CRISP), f0 = e.frames[0]; if (!f0) continue;
      const f = e.frames[Math.floor(this.roomT * 8 + M.i * 3) % e.n] || f0, cv = M.cv;
      if (!M.w) { M.w = f0.w + 10; M.h = f0.h + 6; cv.width = M.w; cv.height = M.h; cv.style.width = `calc(var(--u) * ${M.w})`; cv.style.height = `calc(var(--u) * ${M.h})`; }
      const fi = e.frames.indexOf(f); if (fi === M.fi) continue; M.fi = fi;
      const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; g.clearRect(0, 0, M.w, M.h);
      g.fillStyle = 'rgba(12,14,34,.22)'; const sw = Math.round(f0.w * 0.28); for (let j = -2; j <= 2; j++) { const w = Math.round(sw * Math.sqrt(1 - (j * j) / 6.25)); g.fillRect(Math.round(M.w / 2) - w, M.h - 5 + j, w * 2 + 1, 1); }
      g.drawImage(f.c, Math.round(M.w / 2 - f.ax), Math.round(M.h - 5 - f.ay));
    }
  }

  // ------------------------------------------------------------------ line-up stage (both teams on two lit daises)
  /** the 6 trainers of the match: local players (their look, slot-colour ring, P tag) + bots filling the free specs */
  lineup() {
    const out = [];
    const POS = [[0.5, 0.3], [-0.5, 0.3], [0, -0.42]]; // inner-front, outer-front, back (blue mirrors x)
    // bot poses per team and position (players always stand in the front view, idle, so they see their trainer):
    // the two lines differ in order, facing and stance instead of being one palette swap — blue: an orb in hand + a
    // profile turned toward red; red: a profile turned toward blue + an orb raised high at the back. view = 'view|anim@frame'
    const POSE = [
      [null, { view: 'down|throw@3', n: 1 }, { view: 'left', n: 4 }],
      [null, { view: 'left', n: 4 }, { view: 'down|throw@1', n: 1 }],
    ];
    const ORDER = [SPEC_IDS, [...SPEC_IDS.slice(2), ...SPEC_IDS.slice(0, 2)]]; // red bots: shuffled look order
    const room = this.online && this.online.view === 'room' ? this.netHumans() : null;
    for (let tm = 0; tm < 2; tm++) {
      const humans = room ? room.filter((s) => s.team === tm) : this.slots.filter((s) => s.team === tm).sort((x, y) => x.slot - y.slot);
      const used = humans.map((s) => s.spec), miss = ORDER[tm].filter((s) => !used.includes(s));
      for (let j = 0; j < 3; j++) {
        const sl = humans[j], look = sl ? sl.look : miss[j - humans.length] || ORDER[tm][j % 3];
        const [px, py] = POS[j];
        // a little hop when the player readies up (0.45 s)
        const hop = sl && sl.readyAt != null ? Math.max(0, Math.min(1, (this.t - sl.readyAt) / 0.45)) : 1;
        const dy = hop < 1 ? -Math.sin(hop * Math.PI) * 7 * (this.vs ? this.vs.scale || 1 : 1) : 0;
        const pose = (!sl && POSE[tm][j]) || { view: 'down', n: 4 };
        out.push({ id: 'trainer_' + look + '_' + (tm ? 'red' : 'blue'), d: tm, x: tm ? -px : px, y: py, dy, flip: tm === 0, n: pose.n, fps: 5, phase: (tm * 3 + j) * 0.37,
          view: pose.view, dim: 0, clean: TRAINER_CRISP, rim: false, mark: sl ? SLOT_COLORS[sl.slot] : null, sl, shadow: 0.5 });
        // a local player's partner (the starter row) stands at their feet, toward the rival team, a size smaller
        const st = sl && sl.starter && STARTER_TYPE[sl.starter] ? sl.starter : null;
        if (st && this.vs && this.vs.scale) {
          const sc = TITLE_SCALES.reduce((a, v) => (v <= this.vs.scale * 0.62 + 1e-6 ? v : a), TITLE_SCALES[0]);
          out.push({ id: st, d: tm, x: (tm ? -px : px) + (tm ? -0.3 : 0.3), y: py + 0.42, dy, flip: tm === 0, n: TITLE_FRAMES, fps: 8, phase: j * 0.4,
            clean: TITLE_CRISP, rim: false, sc, shadow: 0.42, mon: true });
        }
      }
    }
    return out.sort((a, b) => a.y - b.y);
  }
  vsLayout() {
    const V = this.vsEl; if (!V || !this.vs) return;
    const r = V.getBoundingClientRect(); if (r.width < 20 || r.height < 20) return;
    const dpr = devicePixelRatio || 1;
    // the title layer's art-pixel grid (backdrop) — same zoom, canvas origin snapped to it
    const Z = this.gridZ();
    const aw = Math.floor((r.width * dpr) / Z), ah = Math.floor((r.height * dpr) / Z);
    const narrow = aw < ah * 1.6;      // phones: the line-up column is tall and narrow -> daises stacked
    const plateA = 22;                 // the team plate under each dais: one text line + 2 strokes = 20 art px
    // trainer idle ≈ 58 art px tall at raster scale 1 (incl. margin); dais R ≈ 40·S
    const topA = narrow ? 26 : 0;      // phones: the P tags sit above the stacked daises
    let S = narrow ? Math.min((ah - topA) / 2 / 80, aw / 104) : Math.min((ah - plateA - 4) / 74, aw / 2 / 110);
    // snap to a pre-baked raster scale (mt/ui/title-art: the line-up is there the moment the lobby opens)
    S = LOBBY_SCALES.reduce((a, v) => (v <= S + 1e-6 ? v : a), LOBBY_SCALES[0]);
    const R = 40 * S;
    const daises = narrow
      ? [{ R, cx: aw / 2, cy: topA + (ah - topA) * 0.5 - 6 * S, opt: { ring: '#9cd0ff' } }, { R, cx: aw / 2, cy: ah - 18 * S, opt: { ring: '#ffb0a0' } }]
      : [{ R, cx: aw * 0.27, cy: ah - 20 * S - plateA, opt: { ring: '#9cd0ff' }, spot: 'teamBlue' }, { R, cx: aw * 0.73, cy: ah - 20 * S - plateA, opt: { ring: '#ffb0a0' }, spot: 'teamRed' }];
    this.vs.layout({ w: aw, h: ah, scale: S, daises });
    const cw = (aw * Z) / dpr, ch = (ah * Z) / dpr;
    // snap the canvas origin to whole art pixels of the screen grid
    const snap = (v, base) => (Math.round(((base + v) * dpr) / Z) * Z) / dpr - base;
    const ox = snap((r.width - cw) / 2, r.left), oy = snap(r.height - ch, r.top);
    Object.assign(this.vsCanvas.style, { width: cw + 'px', height: ch + 'px', transform: `translate(${ox}px, ${oy}px)` });
    this.vsGeo = { Z, dpr, ox, oy, narrow, S };
    V.classList.toggle('narrow', narrow);
    V.style.setProperty('--vsw', (this.vsPx.width * Z) / dpr + 'px');
    // team plates under the daises: centred on the dais, snapped to whole art px (no -50% transform)
    const u = Z / dpr;
    this.plates.forEach((p, i) => { const D = daises[i]; p.hidden = narrow; if (narrow) return; const pw = Math.round(p.offsetWidth / u); p.style.left = (ox + Math.round(D.cx - pw / 2) * u) + 'px'; p.style.top = (oy + Math.round(D.cy + R * 0.34 + 4) * u) + 'px'; p.style.bottom = 'auto'; });
    if (narrow) { // between the blue dais' front edge and the red trainers' heads
      const y = ((daises[0].cy + R * 0.42) + (daises[1].cy - 62 * S)) / 2;
      this.vsMark.style.top = (oy + (y * Z) / dpr) + 'px'; this.vsMark.style.left = '50%';
    } else { this.vsMark.style.top = ''; this.vsMark.style.left = ''; }
  }
  vsTick(dt) {
    if (!this.vs) return;
    // re-layout when the window or the line-up box changes (status / header text can resize the phone grid cells)
    if ((this.vsChk = (this.vsChk || 0) + 1) % 12 === 1) { const r = this.vsEl.getBoundingClientRect(); this.vsBox = Math.round(r.width) + 'x' + Math.round(r.height); }
    const Z = this.gridZ(), uv = Z / (devicePixelRatio || 1) + 'px';
    if (this.root && this.uVar !== uv) { this.uVar = uv; this.root.style.setProperty('--u', uv); }
    const key = innerWidth + 'x' + innerHeight + '@' + (devicePixelRatio || 1) + ':' + this.vsBox + ':' + Z + ':' + getLang();
    if (key !== this.vsKey) { this.vsKey = key; this.vsLayout(); }
    const cast = this.lineup();
    this.vs.setCast(cast);
    this.vs.update(dt);
    // DOM tags over the heads (P1 / BOT), crisp text
    const G = this.vsGeo; if (!G) return;
    const want = cast.length;
    while (this.tags.length < want) { const e = h('div', 'tag', this.vsEl); h('b', null, e); h('i', null, e); this.tags.push(e); }
    cast.forEach((m, i) => {
      const e = this.tags[i], hd = this.vs.head(m);
      if (!hd || !m.sl) { e.style.opacity = '0'; return; }   // only local players get a tag (bots are dimmed)
      e.style.opacity = '';
      // anchored at the head (bottom centre of the tag), snapped to whole art px
      const u = G.Z / G.dpr, tw = Math.round(e.offsetWidth / u), th = Math.round(e.offsetHeight / u);
      e.style.left = (G.ox + Math.round(hd[0] - tw / 2) * u) + 'px'; e.style.top = (G.oy + Math.round(hd[1] - 2 - th) * u) + 'px';
      const lab = m.sl ? m.sl.label || 'P' + (m.sl.slot + 1) : t('lobby.bot'); // online: player names
      const cls = 'tag' + (m.sl ? (m.sl.ready ? ' rdy' : '') : ' bot');
      if (e.className !== cls) e.className = cls;
      if (m.sl) e.style.setProperty('--pc', SLOT_COLORS[m.sl.slot]); else e.style.removeProperty('--pc');
      setText(e.firstChild, lab);
    });
  }
  /** the lobby art grid (title.js grid, ~384 rows): device px per art px */
  gridZ() { const MG = this.app.mtMenuGrid; return MG && MG.Z && MG.lobby ? MG.Z : Math.max(2, Math.round(((devicePixelRatio || 1) * innerHeight) / 384)); }
  /** test hook: every line-up sprite has its first frame */
  artReady() { return !!(this.vs && this.vs.ready); }
  stageKeys() { return this.vs ? this.vs.keys() : []; }

  /** a 16-art-px element badge (sprite library) as a fresh canvas */
  elemIcon(el) {
    if (!this.art || !el) return null;
    const k = 'el:' + el; let c = this.icons.get(k);
    if (c === undefined) { try { c = this.art.renderElementIconCanvas(el, 16); } catch { c = null; } this.icons.set(k, c); }
    if (!c) return null;
    const e = document.createElement('canvas'); e.width = c.width; e.height = c.height; e.getContext('2d').drawImage(c, 0, 0);
    return e;
  }
  icon(id) {
    if (!this.art) return null;
    let c = this.icons.get(id);
    if (!c) { try { c = this.art.renderIconCanvas(id, 16); } catch { c = null; } this.icons.set(id, c); }   // 16 art px (--u)
    return c;
  }

  // ------------------------------------------------------------------ DOM
  build() {
    if (this.root) return;
    if (!document.getElementById('mt-lobby-css')) { const st = h('style'); st.id = 'mt-lobby-css'; st.textContent = CSS; document.head.appendChild(st); }
    const r = this.root = h('div', null, document.body); r.id = 'mt-lobby'; r.hidden = true;
    this.uVar = Math.max(2, Math.round(((devicePixelRatio || 1) * innerHeight) / 384)) / (devicePixelRatio || 1) + 'px'; r.style.setProperty('--u', this.uVar);
    h('div', 'lb-bg', r);
    const head = h('div', 'lb-head', r);
    const title = h('div', 'lb-title px', head), tin = h('div', 'px', title);
    this.orbEl = h('canvas', 'lb-orb', tin); this.orbEl.width = this.orbEl.height = 16; this.orbDone = false; // our capture orb (sprite library icon, 16 art px)
    const tt = h('div', null, tin); h('small', null, tt, t('lobby.kicker')); this.titleB = h('b', null, tt, t('lobby.title'));
    this.backBtn = h('div', 'lb-back px', null); this.backBtn.appendChild(triEl(-1, 11)); head.insertBefore(this.backBtn, head.firstChild);
    this.backBtn.setAttribute('role', 'button'); this.backBtn.setAttribute('aria-label', t('lobby.hint.back'));
    this.backBtn.addEventListener('click', () => this.roomBack());
    const mode = h('div', 'lb-mode', head);
    // the next free slot: a small join chip top right, beside the mode chip (language: the card's げんご row, L key,
    // or the title's ◀ JA ▶ tab — no third header chip)
    this.joinEl = h('div', 'lb-join px', mode); this.joinEl.addEventListener('click', () => { if (!this.slots.some((x) => x.device === 'kbm') && this.freeSlot() >= 0) { this.joinKbm(); this.render(); } });
    this.modeChip = h('span', 'chip px', mode); this.fogChip = h('span', 'chip dim px', mode);
    this.snd = h('div', 'snd', r, t('lobby.sound'));
    const main = h('div', 'lb-main', r);
    // staging: both teams on lit daises facing each other, VS emblem between (mt/ui/stage.js, one pixel grid)
    const V = this.vsEl = h('div', 'lb-vs', main);
    this.vsCanvas = h('canvas', null, V);
    this.vsMark = h('div', 'vsm', V); this.vsPx = vsPixels(2.4); this.vsMark.appendChild(this.vsPx);
    this.plates = [0, 1].map((tm) => h('div', 'tplate px t' + tm, V, tm ? t('team.red') : t('team.blue')));
    this.tags = [];
    this.vs = new HeroStage(this.vsCanvas, { cast: [], motes: 16, seed: 5 });
    this.vsKey = '';
    this.roomEl = h('div', 'lb-room', main); this.roomEl.hidden = true; this.roomKey_ = ''; // online room (renderRoom)
    const cards = h('div', 'lb-cards', main);
    this.cards = [];
    for (let i = 0; i < 4; i++) { const c = h('div', 'card', cards); c.style.setProperty('--pc', SLOT_COLORS[i]); this.cards.push({ el: c, key: '' }); }
    // online: the panel (browse / code entry) and the game room's player list
    this.netCard = { el: h('div', 'card net px', cards), key: '' }; this.netCard.el.hidden = true;
    this.memCard = { el: h('div', 'card mem px', cards), key: '' }; this.memCard.el.hidden = true;
    const foot = h('div', 'lb-foot', r);
    this.status = h('div', 'status px', foot);
    this.backEl = h('div', 'back', foot, '');
    this.backEl.addEventListener('click', (e) => { if (!(e.target && e.target.closest && e.target.closest('.bk'))) return; if (!this.slots.length || !this.slots.some((s) => s.ready)) { this.slots = this.slots.filter((s) => s.device !== 'kbm'); if (!this.slots.length) this.go('menu'); else this.dirty = true; } });
  }

  cardKey(sl) {
    const net = this.app.mtNet, on = this.online ? this.online.view + (net && net.isHost ? 'H' : '') + (net && net.isHost && net.canStart() ? 'S' : '') : '';
    return sl ? [sl.slot, sl.device, sl.team, sl.spec, sl.look, sl.starter, sl.ready, sl.row, sl.wasd, sl.inputType, on].join('|') : 'empty|' + this.slots.length + '|' + this.slots.some((x) => x.device === 'kbm');
  }

  render() {
    if (!this.root || this.root.hidden) return;
    const app = this.app;
    // header chips
    const teams = new Set(this.slots.map((s) => s.team));
    const versus = teams.size > 1, n = this.slots.length;
    this.root.classList.toggle('few', n <= 2);
    const net = this.app.mtNet, on = this.online, inRoom = !!(on && on.view === 'room' && net && net.inRoom());
    const mem = inRoom ? net.members() : null;
    this.root.classList.toggle('online', !!on);
    this.root.classList.toggle('code', !!(on && on.view === 'code'));
    setText(this.titleB, on ? t('menu.friend') : t('lobby.title'));
    setText(this.modeChip, inRoom ? net.code + ' · ' + mem.filter((m) => m.ok).length + '/6' : on ? t('net.title')
      : versus ? t('lobby.mode.versus', { n }) : n > 1 ? t('lobby.mode.coop', { n }) : n === 1 ? t('lobby.mode.solo') : t('lobby.mode.none'));
    this.modeChip.classList.toggle('vs', !on && versus);
    setText(this.fogChip, versus ? t('lobby.fog.versus') : n > 1 ? t('lobby.fog.coop') : t('lobby.fog.solo'));
    const a = app.registry && app.registry.get('audio');
    this.snd.classList.toggle('on', !!(a && a.supported !== false && !(a.ac && a.ac.state === 'running')) && this.slots.some((s) => s.device !== 'kbm'));
    // cards
    if (!this.orbDone && this.orbEl) { const ic = this.icon('trainer/capture'); if (ic) { const g = this.orbEl.getContext('2d'); g.imageSmoothingEnabled = false; g.clearRect(0, 0, 16, 16); g.drawImage(ic, Math.round((16 - ic.width) / 2), Math.round((16 - ic.height) / 2)); this.orbDone = true; } }
    const joinAt = on ? -1 : this.freeSlot(); // the next free slot is offered by the join chip; empty cards stay hidden
    this.joinChip(joinAt);
    if (on && on.view === 'code') this.renderOnline(net, false, null);   // the code entry card (old online panel)
    else if (this.netCard) { this.netCard.el.hidden = true; this.memCard.el.hidden = true; }
    if (this.roomEl) { const show = !!on && on.view !== 'code'; if (this.roomEl.hidden === show) this.roomEl.hidden = !show; if (show) this.renderRoom(net, mem); }
    for (let i = 0; i < 4; i++) {
      const sl = this.slots.find((x) => x.slot === i) || null, C = this.cards[i];
      const hide = !sl || !!on;   // online: the room screen (renderRoom) replaces the player card
      if (C.el.hidden !== hide) C.el.hidden = hide;
      if (hide) continue;
      const key = this.cardKey(sl) + '|' + (this.art ? 1 : 0);
      if (C.key !== key || this.dirty) { if (C.key !== key) { this.buildCard(C, sl, i); keepInView(C.el.querySelector('.row.f')); } C.key = key; }
      if (sl) this.liveCard(C, sl); else this.joinSilhouette(C);
    }
    // footer
    const ready = this.slots.filter((s) => s.ready).length;
    if (on) {   // online: who we wait for
      const can = inRoom && net.canStart();
      const others = inRoom ? mem.filter((m) => !m.me && m.ok) : [];
      setText(this.status, !inRoom ? (net && net.joining ? t('net.joining', { code: net.joining }) : '')
        : !others.length ? t('room.status.alone')
          : net.isHost ? (can ? t('room.status.go') : t('net.waitReady'))
            : this.slots[0] && this.slots[0].ready ? t('net.waitHost') : t('net.waitReady'));
      this.status.classList.toggle('go', !!can && others.length > 0);
    } else if (this.countdown >= 0) { setText(this.status, t('lobby.starting', { n: Math.max(1, Math.ceil(this.countdown)) })); this.status.classList.add('go'); }
    else {
      this.status.classList.remove('go');
      setText(this.status, n === 0 ? (this.inputView() === 'touch' ? t('lobby.foot.joinTouch') : t('lobby.foot.wait')) : t('lobby.foot.ready', { ready, n }));
    }
    // back hint: glyphs of whoever is here (pad first)
    const pad = this.slots.find((x) => x.device !== 'kbm'), kb = this.slots.find((x) => x.device === 'kbm');
    const vm = this.inputView(), fam = pad ? glyphFamily(pad.inputType) : kb ? (kb.inputType === 'touch' ? null : 'kbm') : vm === 'kbm' ? 'kbm' : vm === 'touch' ? null : 'ps';
    // footer controls (one line, pixel glyphs): the card's controls live here, not in a row of keycaps on the card
    const touchSl = pad ? false : this.slots.some((x) => x.device === 'kbm' && x.inputType === 'touch');
    const bk = (n ? 'b' : 't') + (fam || '-') + getLang() + (touchSl ? 'T' : '') + (fontReady() ? 1 : 0) + (on && !inRoom ? 'N' : '');
    if (this.backEl.dataset.k !== bk) {
      this.backEl.dataset.k = bk;
      // only the "back" item (.bk) is a click target; the others are plain hints
      const H = (k) => t('lobby.hint.' + k), I = (g, txt, bk) => `<span${bk ? ' class="bk"' : ''}>${g}${txt}</span>`, sep = '<i class="sep"></i>';
      if (!fam || touchSl) this.backEl.innerHTML = '';
      else if (on && !inRoom) this.backEl.innerHTML = fam === 'kbm' // online panel: pick / OK / back
        ? [I(glyphHTML('kbm', 'Enter'), t('net.hint.ok')), I(glyphHTML('kbm', 'Esc'), H('back'))].join(sep)
        : [I(glyphHTML(fam, 0), t('net.hint.ok')), I(glyphHTML(fam, 1), H('back'))].join(sep);
      else if (!n) this.backEl.innerHTML = I(glyphHTML(fam, fam === 'kbm' ? 'Esc' : 1), t('lobby.backTitleShort'), 1);
      else if (fam === 'kbm') this.backEl.innerHTML = [I(glyphHTML('kbm', '←→'), H('change')), I(glyphHTML('kbm', 'Enter'), H('next')), I(glyphHTML('kbm', 'Esc'), H('back'), 1)].join(sep);
      else this.backEl.innerHTML = [I(glyphHTML(fam, 0), H('next')), I(glyphHTML(fam, 1), H('back'), 1), I(glyphHTML(fam, 3), H('team'))].join(sep);
    }
    this.dirty = false;
  }

  buildCard(C, sl, i) {
    const el = C.el; el.textContent = ''; el.className = 'card';
    C.canvas = null; C.frame = -1; C.hold = null; C.sil = null;
    if (!sl) {
      const full = this.slots.length >= 4;
      el.classList.add('empty'); if (full) el.classList.add('full');
      h('div', 'pn', el, 'P' + (i + 1));
      const kb = this.slots.some((x) => x.device === 'kbm');
      const md = this.inputView();
      const art = h('div', 'art', el);
      if (!kb && md === 'touch') art.innerHTML = TOUCH_ART;
      else { const w = h('div', 'who', art); C.sil = h('canvas', 'sil', w); h('b', null, w, '?'); C.silDone = false; } // mystery challenger
      const big = h('div', 'big', el);
      big.innerHTML = !kb && md === 'touch' ? TOUCH_ICON + t('lobby.touchJoin') : t('lobby.join', { g1: glyphHTML('ps', 0), g2: glyphHTML('xbox', 0) });
      h('div', 'sm', el, kb || md === 'pad' ? t('lobby.plug') : md === 'touch' ? t('lobby.plug') : t('lobby.kbJoin'));
      el.onclick = () => { if (!kb && !full) { this.joinKbm(); this.render(); } };
      return;
    }
    el.onclick = null;
    if (sl.ready) el.classList.add('ready');
    const fam = sl.device === 'kbm' ? 'kbm' : glyphFamily(sl.inputType);
    el.classList.add('px');
    const band = h('div', 'band', el); h('span', 'pn', band, 'P' + (sl.slot + 1)); h('span', 'tm px t' + sl.team, band, TEAM_NAME[sl.team]());
    const touchSl = sl.device === 'kbm' && sl.inputType === 'touch';
    const dev = h('span', 'dev px', band); dev.innerHTML = (touchSl ? TOUCH_SVG : sl.device === 'kbm' ? KB_SVG : PAD_SVG) + '<span>' + (touchSl ? t('lobby.touch') : sl.device === 'kbm' ? t('lobby.kbm') : t('dev.' + sl.inputType) !== 'dev.' + sl.inputType ? t('dev.' + sl.inputType) : kindLabel(sl.inputType)) + '</span>';
    const rows = h('div', 'rows', el);
    const R = this.rows(sl);
    const mk = (row, label, html, cls) => {
      const r = h('div', 'row' + (R[sl.row] === row && !sl.ready ? ' f' : ''), rows); h('span', 'lb', r, label);
      const v = h('div', 'val', r);
      const l = h('span', 'ar', v, '◀'); const m = h('span', 'v' + (cls ? ' ' + cls : ''), v); m.innerHTML = html; const rr = h('span', 'ar', v, '▶');
      l.onclick = (e) => { e.stopPropagation(); sl.row = R.indexOf(row); this.change(sl, row, -1); this.render(); };
      rr.onclick = (e) => { e.stopPropagation(); sl.row = R.indexOf(row); this.change(sl, row, 1); this.render(); };
      r.onclick = () => { if (!sl.ready) { sl.row = R.indexOf(row); this.dirty = true; this.render(); } };
      return m;
    };
    if (R.includes('starter')) { // the first monster: element icon + name
      const st = mk('starter', t('lobby.row.starter'), '');
      const ei = this.elemIcon(STARTER_TYPE[sl.starter]); if (ei) st.appendChild(ei);
      st.appendChild(document.createTextNode(formName(sl.starter)));
    }
    mk('team', t('lobby.row.team'), TEAM_NAME[sl.team](), sl.team ? 'red' : 'blue');
    const sv = mk('spec', t('lobby.row.spec'), '');
    const ic = this.icon(SPEC_ICON[sl.spec]); if (ic) { const c = document.createElement('canvas'); c.width = ic.width; c.height = ic.height; c.getContext('2d').drawImage(ic, 0, 0); sv.appendChild(c); }
    sv.appendChild(document.createTextNode(specName(sl.spec)));
    mk('look', t('lobby.row.look'), LOOKS[sl.look]());
    if (this.rows(sl).includes('move')) mk('move', t('lobby.row.move'), sl.wasd ? t('lobby.move.wasd') : t('lobby.move.mouse'));
    mk('lang', t('lobby.row.lang'), LANG_LABEL[getLang()]);
    const room = this.online && this.online.view === 'room', net = this.app.mtNet;
    h('div', 'desc px', el, specShort(sl.spec));
    const host = room && net && net.isHost, can = host && net.canStart();
    const rb = h('div', 'readybtn px' + (R[sl.row] === 'ready' && !sl.ready && (!host || can) ? ' f' : '') + (host && !can ? ' dim' : ''), el,
      host ? t('net.start') : sl.ready ? t('lobby.ready') : t('lobby.readyQ'));
    rb.onclick = (e) => { e.stopPropagation(); this.toggleReady(sl); this.render(); };
    const hint = h('div', 'hint', el);
    const H = (k) => t('lobby.hint.' + k); // i18n
    if (touchSl) hint.innerHTML = `<span>${t('lobby.hint.tap')}</span>`;
    else if (fam === 'kbm') hint.innerHTML = `<span>${glyphHTML('kbm', '←→')}${H('change')}</span><span>${glyphHTML('kbm', 'Enter')}${H('next')}</span><span>${glyphHTML('kbm', 'Esc')}${H('back')}</span>`;
    else hint.innerHTML = `<span>${glyphHTML(fam, 0)}${H('next')}</span><span>${glyphHTML(fam, 1)}${H('back')}</span><span>${glyphHTML(fam, 3)}${H('team')}</span><span>${glyphHTML(fam, 'OPT')}${t('lobby.hint.ready')}</span>`;
    C.hold = h('div', 'hold', el);
  }

  /** the small join chip: P#, ✕ / A glyphs (or the touch / click wording) */
  joinChip(slot) {
    const J = this.joinEl; if (!J) return;
    const show = slot >= 0;
    if (J.hidden === show) J.hidden = !show;
    if (!show) return;
    const kb = this.slots.some((x) => x.device === 'kbm'), md = this.inputView();
    const k = slot + '|' + kb + '|' + md + '|' + getLang();
    if (J.dataset.k === k) return;
    J.dataset.k = k; J.style.setProperty('--pc', SLOT_COLORS[slot]);
    const body = !kb && md === 'touch' ? TOUCH_ICON + t('lobby.touchJoin') : t('lobby.joinChip', { g: glyphHTML('ps', 0) + '/' + glyphHTML('xbox', 0) });
    J.innerHTML = `<span class="pn">P${slot + 1}</span><span>${body}</span>`;
  }

  /** the join card's mystery trainer: a navy silhouette of a trainer sprite (pixel-crisp, whole-number zoom) */
  joinSilhouette(C) {
    if (!C.sil || C.silDone) return;
    const e = heroFrames('trainer_attack_red', 2, 1, 5, false), f = e.frames[0];
    if (!f) return;
    const c = C.sil; c.width = f.w; c.height = f.h;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    g.drawImage(f.c, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#3a4782'; g.fillRect(0, 0, f.w, f.h);
    const dpr = devicePixelRatio || 1, short = innerHeight < 520;
    const z = Math.max(1, Math.round((short ? 1 : Math.min(2, innerHeight * dpr / 540)) * 1));
    c.style.width = (f.w * z) / dpr + 'px'; c.style.height = (f.h * z) / dpr + 'px';
    C.silDone = true;
  }

  liveCard(C, sl) {
    if (C.hold) { const w = Math.min(100, (sl.holdT / HOLD_LEAVE) * 100).toFixed(0) + '%'; if (C.hold.style.width !== w) C.hold.style.width = w; }
  }

  // ------------------------------------------------------------------ online play (mt/net/online.js = app.mtNet)
  // Mode row ◀ ▶ (or a tap) opens the online panel for that player: create a game (room code, advertised to everyone
  // who has the page open), join one from the list, or type a code. In the game room the card edits this peer's own
  // team / spec / look, the second card lists everyone live from their presence; the host's READY is START.
  netRow(sl) {
    if (this.online && this.online.view === 'room') { this.netLeave(); return; }
    this.openOnline(sl);
  }
  openOnline(sl) {
    const net = this.app.mtNet;
    this.slots = [sl]; sl.slot = 0; sl.ready = false; sl.row = this.rows(sl).indexOf('net');   // online: one player per machine
    this.countdown = -1;
    this.online = { view: net && net.inRoom() ? 'room' : 'menu', focus: 0, code: '', cur: 0 };
    if (net) net.setDevice({ device: sl.device, inputType: sl.inputType || (sl.device === 'kbm' ? 'kbm' : 'gamepad'), padId: sl.padId || '', padIndex: sl.padIndex ?? -1, wasd: !!sl.wasd });
    this.sfx('confirm'); this.dirty = true;
    for (const C of this.cards) C.key = '';
  }
  closeOnline() { this.online = null; this.dirty = true; for (const C of this.cards) C.key = ''; this.netCard.key = ''; this.sfx('click'); }
  netLeave() {
    const net = this.app.mtNet;
    if (net && net.inRoom()) net.leaveRoom();
    for (const s of this.slots) s.ready = false;
    if (this.online) { this.online.view = 'menu'; this.online.focus = 0; }
    this.dirty = true; for (const C of this.cards) C.key = ''; this.sfx('click');
  }
  /** my card's choices -> my game-room presence */
  syncNet() {
    const net = this.app.mtNet, sl = this.slots[0]; if (!net || !sl) return;
    if (!net.setMine({ tm: sl.team })) { sl.team = net.me.tm; }
    net.setMine({ sp: sl.spec, lk: sl.look, rd: sl.ready ? 1 : 0 });
  }
  /** the game room's humans as line-up slots (name tags, ready hop) */
  netHumans() {
    const net = this.app.mtNet; if (!net) return [];
    const mem = net.members().filter((m) => m.ok);
    this.netHop = this.netHop || new Map();
    return mem.map((m, i) => {
      const was = this.netHop.get(m.peer); if (m.rd && !was) this.netHop.set(m.peer, this.t); else if (!m.rd && was) this.netHop.delete(m.peer);
      return { slot: i % 4, team: m.tm, spec: m.sp, look: m.lk, ready: m.rd || (m.host && m.me), readyAt: this.netHop.get(m.peer), label: m.me ? t('net.you') : m.nm.slice(0, 8) };
    });
  }
  onlineItems() {
    const net = this.app.mtNet, O = this.online, it = [];
    if (O.view === 'code') {
      it.push({ id: 'code' }, { id: 'join', label: t('net.join'), dis: O.code.length !== 4 }, { id: 'back', label: t('net.back') });
      return it;
    }
    if (!net || net.status === 'init') { it.push({ id: 'wait', label: t('net.connecting'), dis: true }, { id: 'back', label: t('net.back') }); return it; }
    if (!net.available()) { it.push({ id: 'msg' }, { id: 'back', label: t('net.back') }); return it; }
    it.push({ id: 'name' }, { id: 'create', label: t('net.create') }, { id: 'code', label: t('net.joinCode') });
    if (net.tr && !net.tr.discovery) { it.push({ id: 'hint', label: t('net.peerHint'), dis: true }, { id: 'back', label: t('net.back') }); return it; }   // WebRTC: no list of games
    it.push({ id: 'sep', label: t('net.open'), dis: true });
    const games = net.openGames();
    if (!games.length) it.push({ id: 'none', label: t('net.none'), dis: true });
    for (const g of games.slice(0, 5)) it.push({ id: 'g', code: g.code, label: g.name, n: g.players, max: g.max, dis: !g.open });
    it.push({ id: 'back', label: t('net.back') });
    return it;
  }
  focusable(it) { return it.filter((x) => !x.dis && x.id !== 'msg' && x.id !== 'sep'); }
  onlineActivate(item) {
    const net = this.app.mtNet, O = this.online, sl = this.slots[0];
    if (!item || item.dis) { this.sfx('deny'); return; }
    if (item.id === 'back') { if (O.view === 'code') { O.view = net && net.inRoom() ? 'room' : 'fail'; O.focus = 0; this.sfx('click'); } else this.closeOnline(); return; }
    if (item.id === 'name') { const inp = this.netCard.el.querySelector('.nmi'); if (inp) inp.focus(); return; }
    const enterRoom = (p) => {
      if (sl) net.setMine({ tm: sl.team, sp: sl.spec, lk: sl.look, rd: 0 });
      this.sfx('confirm');
      p.then((ok) => { if (ok && this.online) { this.online.view = 'room'; this.syncNet(); } this.dirty = true; });
    };
    if (item.id === 'create') enterRoom(net.createGame());
    else if (item.id === 'g') enterRoom(net.joinGame(item.code));
    else if (item.id === 'code') { if (O.view === 'code') return; O.view = 'code'; O.code = ''; O.cur = 0; O.focus = 0; this.sfx('click'); }
    else if (item.id === 'join') enterRoom(net.joinGame(O.code));
  }
  onlineMove(d) {
    const F = this.focusable(this.onlineItems()); if (!F.length) return;
    this.online.focus = (this.online.focus + d + F.length) % F.length; this.sfx('click');
  }
  onlineKey(e) {
    const O = this.online, c = e.code, tg = e.target, typing = tg && tg.tagName === 'INPUT', enter = c === 'Enter' || c === 'NumpadEnter';
    if (typing) {   // a name / code field has the focus: it takes the key, except these
      if (!(enter || c === 'Escape' || c === 'Tab' || c === 'ArrowUp' || c === 'ArrowDown')) return;
      e.stopImmediatePropagation(); e.preventDefault(); tg.blur(); this.netCard.key = '';
      if (O.view === 'code' && enter) { if (O.code.length === 4) this.onlineActivate({ id: 'join' }); else this.sfx('deny'); return; }
      if (c === 'Escape') { this.onlineActivate({ id: 'back' }); return; }
      this.onlineMove(c === 'ArrowUp' ? -1 : 1); return;
    }
    e.stopImmediatePropagation(); e.preventDefault();
    if (e.repeat && !/Arrow/.test(c)) return;
    const F = this.focusable(this.onlineItems()), cur = F[Math.min(O.focus, F.length - 1)];
    if (O.view === 'code' && cur && cur.id === 'code' && !typing) {
      const k = /^Key([A-Z])$/.exec(c) || /^Digit(\d)$/.exec(c) || /^Numpad(\d)$/.exec(c);
      if (k) { const ch = k[1]; if (CODE_ALPHABET.includes(ch) && O.code.length < 4) { O.code += ch; O.cur = Math.min(3, O.code.length); this.sfx('click'); if (O.code.length === 4) O.focus = 1; } else this.sfx('deny'); return; }
      if (c === 'Backspace') { O.code = O.code.slice(0, -1); O.cur = O.code.length; this.sfx('click'); return; }
    }
    if (c === 'ArrowDown' || c === 'Tab') this.onlineMove(1);
    else if (c === 'ArrowUp') this.onlineMove(-1);
    else if (c === 'Enter' || c === 'Space' || c === 'NumpadEnter') { if (O.view === 'code' && cur && cur.id === 'code') { if (O.code.length === 4) this.onlineActivate({ id: 'join' }); else this.sfx('deny'); } else this.onlineActivate(cur); }
    else if (c === 'Escape' || c === 'Backspace') this.onlineActivate({ id: 'back' });
  }
  onlinePad(s, dir) {
    const O = this.online, F = this.focusable(this.onlineItems()), cur = F[Math.min(O.focus, F.length - 1)];
    if (O.view === 'code' && cur && cur.id === 'code') {   // ↑↓ letter, ←→ move, ✕ join, ○ back
      if (dir === 'up' || dir === 'down') {
        const A = CODE_ALPHABET, ch = O.code[O.cur], i = ch ? A.indexOf(ch) : -1, j = ((i < 0 ? (dir === 'up' ? -1 : 0) : i + (dir === 'up' ? 1 : -1)) + A.length) % A.length;
        O.code = (O.code.slice(0, O.cur).padEnd(O.cur, A[0]) + A[j] + O.code.slice(O.cur + 1)).slice(0, 4); this.sfx('click');
      } else if (dir === 'left') { O.cur = Math.max(0, O.cur - 1); this.sfx('click'); }
      else if (dir === 'right') { O.cur = Math.min(3, O.cur + 1, O.code.length); this.sfx('click'); }
      if (s.down(BTN.CROSS)) { if (O.code.length === 4) this.onlineActivate({ id: 'join' }); else { O.cur = Math.min(3, O.code.length); this.sfx('deny'); } }
      if (s.down(BTN.CIRCLE)) this.onlineActivate({ id: 'back' });
      return;
    }
    if (dir === 'up') this.onlineMove(-1); else if (dir === 'down') this.onlineMove(1);
    if (s.down(BTN.CROSS)) this.onlineActivate(cur);
    if (s.down(BTN.CIRCLE)) this.onlineActivate({ id: 'back' });
  }
  renderOnline(net, inRoom, mem) {
    const N = this.netCard, M = this.memCard; if (!N) return;
    const on = this.online;
    const showN = !!on && !inRoom, showM = !!inRoom;
    if (N.el.hidden === showN) N.el.hidden = !showN;
    if (M.el.hidden === showM) M.el.hidden = !showM;
    if (showN) this.renderNetCard(net);
    if (showM) this.renderMemCard(net, mem);
  }
  renderNetCard(net) {
    const N = this.netCard, O = this.online, items = this.onlineItems(), F = this.focusable(items);
    if (O.focus >= F.length) O.focus = Math.max(0, F.length - 1);
    const cur = F[O.focus];
    const err = net && net.error && performance.now() - net.errorAt < 6000 ? net.error : '';
    const key = [O.view, O.code, O.cur, cur ? cur.id + (cur.code || '') : '', JSON.stringify(items.map((x) => [x.id, x.code, x.label, x.n, x.dis])), err, getLang(), net ? net.status : '-', net && net.joining, this.app.mtInputMode].join('|');
    if (N.key === key) return;
    const ae = document.activeElement;
    if (ae && ae.tagName === 'INPUT' && N.el.contains(ae)) { this.codeBoxes(); return; }   // never rebuild under the user's fingers
    N.key = key;
    const el = N.el; el.textContent = '';
    const band = h('div', 'band', el); h('b', null, band, t('net.title'));
    h('span', 'st', band, net && net.kind === 'mock' ? 'mock' : '');
    const rows = h('div', 'rows', el);
    if (err) h('div', 'msg err px', rows, t(err));
    else if (net && net.joining) h('div', 'msg px', rows, t('net.joining', { code: net.joining }));
    for (const it of items) {
      const f = it === cur && !(it.dis);
      if (it.id === 'msg') { h('div', 'msg px', rows, t('net.unavailable')); h('div', 'msg px', rows, t('net.unavailable2')); continue; }
      if (it.id === 'name') {
        const r = h('div', 'row' + (f ? ' f' : ''), rows); h('span', 'lb', r, t('net.name'));
        const inp = h('input', 'nmi', r); inp.type = 'text'; inp.maxLength = 12; inp.value = net.me.nm || ''; inp.placeholder = t('net.defaultName'); inp.autocomplete = 'off'; inp.spellcheck = false;
        inp.addEventListener('input', () => net.setName(inp.value));
        inp.addEventListener('focus', () => { O.focus = F.indexOf(it); });
        continue;
      }
      if (it.id === 'code' && O.view === 'code') {
        const box = h('div', 'code', rows);
        for (let i = 0; i < 4; i++) h('span', i === O.cur && f ? 'cur' : '', box, O.code[i] || '');
        const inp = h('input', null, box); inp.type = 'text'; inp.maxLength = 4; inp.value = O.code; inp.setAttribute('autocapitalize', 'characters'); inp.autocomplete = 'off'; inp.spellcheck = false;
        inp.setAttribute('aria-label', t('net.codeHint'));
        inp.addEventListener('input', () => {
          O.code = [...normCode(inp.value)].filter((ch) => CODE_ALPHABET.includes(ch)).join('').slice(0, 4); O.cur = Math.min(3, O.code.length); O.focus = 0;
          if (inp.value !== O.code) inp.value = O.code;
          this.codeBoxes();
          if (O.code.length === 4) { inp.blur(); O.focus = 1; N.key = ''; this.render(); }
        });
        h('div', 'msg px', el).textContent = this.app.mtInputMode === 'pad' ? t('net.codePad') : t('net.codeHint');
        continue;
      }
      if (it.id === 'sep') { h('div', 'row sep', rows, '— ' + it.label + ' —'); continue; }
      if (it.id === 'hint') { h('div', 'msg px', rows, it.label); continue; }
      const r = h('div', 'row it' + (f ? ' f' : '') + (it.dis ? ' dis' : ''), rows);
      const v = h('span', 'v', r);
      if (it.id === 'g') { h('span', 'k', v, it.code); v.appendChild(document.createTextNode(it.label)); h('span', 'n', v, it.dis ? t('net.inGame') : it.n + '/' + it.max); }
      else v.textContent = it.label;
      r.onclick = () => { if (it.dis) return; O.focus = Math.max(0, F.indexOf(it)); this.onlineActivate(it); this.render(); };
    }
    keepInView(el.querySelector('.row.f, .code'));
  }
  /** update the 4 code boxes in place (typing on a phone keyboard keeps the focus) */
  codeBoxes() {
    const O = this.online; if (!O || O.view !== 'code') return;
    this.netCard.el.querySelectorAll('.code span').forEach((sp, i) => { const ch = O.code[i] || ''; if (sp.textContent !== ch) sp.textContent = ch; sp.classList.toggle('cur', i === O.cur); });
  }
  renderMemCard(net, mem) {
    const M = this.memCard;
    const link = net.inviteUrl ? net.inviteUrl() : null;
    const key = JSON.stringify(mem.map((m) => [m.peer, m.nm, m.tm, m.sp, m.rd, m.host, m.me, m.st, m.ok])) + getLang() + net.code + (this.art ? 1 : 0) + (link || '');
    if (M.key === key) return;
    M.key = key;
    const el = M.el; el.textContent = '';
    const band = h('div', 'band', el); h('b', null, band, t('net.room', { code: net.code }));
    h('span', 'st', band, t('net.players', { n: mem.filter((m) => m.ok).length, max: 6 })).style.marginLeft = 'auto';
    const list = h('div', 'ms', el);
    for (const m of mem) {
      if (!m.ok) continue;
      const r = h('div', 'm' + (m.me ? ' me' : ''), list);
      h('span', 'tm px t' + m.tm, r, m.tm ? t('team.redShort') : t('team.blueShort'));
      const nm = h('span', 'nm', r, m.nm);
      const ic = this.icon(SPEC_ICON[m.sp]); if (ic) { const c = document.createElement('canvas'); c.width = ic.width; c.height = ic.height; c.getContext('2d').drawImage(ic, 0, 0); nm.prepend(c); c.style.verticalAlign = 'middle'; c.style.marginRight = 'calc(var(--u) * 2)'; }
      h('span', 'rd' + (m.rd || m.host ? ' ok' : ''), r, m.host ? '' : m.st !== 'lb' ? '…' : m.rd ? '✓' : '·');
      h('span', 'tag', r, m.me ? t('net.you') : m.host ? t('net.host') : '');
      if (!m.me && !m.host) r.lastChild.style.visibility = 'hidden';
    }
    const free = 6 - mem.filter((m) => m.ok).length;
    for (let i = 0; i < Math.min(free, 6); i++) { const r = h('div', 'm empty', list); h('span', 'tm px', r, ' '); h('span', 'nm', r, t('lobby.bot')); }
    if (link) {   // outside claude.ai: the friend opens <page>?join=<code> and lands in this room
      const r = h('div', 'lnk', el); h('span', 'lb', r, t('net.link'));
      const inp = h('input', null, r); inp.type = 'text'; inp.readOnly = true; inp.value = link; inp.addEventListener('focus', () => inp.select());
      requestAnimationFrame(() => { inp.scrollLeft = inp.scrollWidth; });   // show the end: …?join=CODE
      const b = h('span', 'cp', r, t('net.copy')); b.setAttribute('role', 'button');
      b.onclick = () => {
        const done = () => { b.textContent = t('net.copied'); setTimeout(() => { b.textContent = t('net.copy'); }, 1600); this.sfx('confirm'); };
        const sel = () => { try { inp.focus(); inp.select(); if (document.execCommand('copy')) done(); } catch { /* the field stays selected */ } };
        try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link).then(done, sel); else sel(); } catch { sel(); }
      };
    }
    h('div', 'sm2', el, t('net.bots'));
  }

  dispose() { window.removeEventListener('keydown', this.onKey, true); if (this.root) this.root.remove(); }
}
