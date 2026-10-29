// mt/ui/input/skillcards.js — trainer skill CARDS: the in-match card bar + the base planning panel. Owner: input (UI side).
//
// Sim contract (gameplay owner; game/mt/data/cards.js + game/mt/sim/cards.js, read-only here):
//   app.mtCards(trainerId) -> { on, hand:[ids], shown:[<=5 ids], mana, manaMax, mulligans, atBase, deckLeft }
//   CARDS[id] = { cost, kind, target:'none'|'self'|'unit'|'point', range, icon, element?, spec?, nameKey, descKey }
//   world.command(id, {type:'card', slot:0..4, targetId?, x?, y?}) · {type:'mulligan', idx:[hand idx]} · {type:'cardMove', from, to}
//   (mulligan / cardMove at base only). Commands go through world.command(local.unitId, …) like every other input here,
//   so an online match queues them in the lockstep (mt/net/lockstep.js intercept) exactly like the move / skill buttons.
//   options.cards === false -> view.on false: no bar, no panel, the old SKILL button / R1 / R come back.
//
// CARD BAR (in a match, cards on): 5 card tiles (pixel card frame in the element colours; art = the HUD's pixel ability
// icons or an fx-atlas glyph in its element palette over an element-glyph backdrop; cost gem; short name; aim badge on
// drag-to-aim cards), a 10-pip mana gauge, "deck left" + "redraws left" chips. A tile you cannot afford is dimmed and
// inert; when the mana or the hand runs out a "back to base to refill" nudge covers the bar (tap = the RECALL button
// pulses). Played card flies up and fades, a refilled slot slides in, a new redraw charge bumps its chip.
//   touch   bottom, between the HUD card and the right cluster (touch.js moves TARGET into SKILL's ring slot); tap = cast
//           ('none' / 'self'; 'unit' / 'point' auto-target the lock / nearest), DRAG = aim on the ground with the shared
//           reticle + the card's range ring (release casts, drag back onto the card cancels) — like the move buttons
//   pad     above the HUD dock. R1 tap = play the selected card; HOLD R1 = card ring: the bar lifts, right stick points
//           at a card (left … right) or D-pad ◀ ▶ steps, release R1 plays it, ○ cancels. Targets: lock > right-stick aim
//           point > nearest. At base: R1 opens / focuses the card panel. Every pad plays ITS trainer's cards (the bar
//           shows the local whose ring is open, else the screen's first local).
//   keys    1–5 play (point / unit at the mouse cursor, else lock / nearest) — classic and WASD mode alike (potion stays
//           D / X); K = card panel at base
// BASE PANEL (at base; non-modal — the game keeps running): the 10-card hand in 2 rows of 5 (top row = the 5 shown in
// battle), tap to mark for discard, 「いれかえ（のこり N）」 sends the mulligan, drag to reorder (cardMove), OK closes; the
// line under the title explains the last touched / focused card. Opens by itself the first time you are at base in a
// match (after the first-match controls card), afterwards from the 「カード」 button on the bar / R1 / K. Pad: D-pad
// moves the cursor, ✕ mark, □ pick up / drop (reorder), △ redraw, ○ close. Keys: arrows, Space mark, Enter pick up /
// drop, R redraw, K close. Closes when you leave base.
//
// app.mtCardsUI = { on, view(), rect(), panelOpen, ui } — for touch.js (layout), hints.js (tips) and tests.

import { t, tOr, getLang } from '../../i18n/index.js';
import * as art from '../art.js';
import { ELEMENT_COLORS, ICON_IDS } from '../../../art/sprites/index.js';
import { CARDS } from '../../data/cards.js';
import { buildFxAtlas, PALETTES } from '../../render/fx-atlas.js';
import { BTN } from './devices.js';
import { pick } from './gamepad.js';

const DRAG_MIN = 16, AIM_PX = 90, RING_HOLD = 0.22, REORDER_PX = 12, PEND = 0.45;
const SPEC_COL = { attack: ['#e8574f', '#6e1d1a'], healing: ['#3fb64a', '#1d5426'], magic: ['#9a6ee8', '#3a2470'] };
const HOME_SVG = '<svg viewBox="0 0 24 24"><path d="M3 11.5L12 4l9 7.5" fill="none" stroke="#1b2350" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 10.5V20h12v-9.5" fill="#ffd23a" stroke="#1b2350" stroke-width="2.4" stroke-linejoin="round"/><rect x="10" y="14" width="4" height="6" fill="#1b2350"/></svg>';
const DECK_SVG = '<svg viewBox="0 0 16 16"><rect x="4" y="1.5" width="9" height="12" rx="1.5" fill="#8a8fb8" stroke="#1b2350" stroke-width="1.4"/><rect x="2" y="3" width="9" height="12" rx="1.5" fill="#fffaf0" stroke="#1b2350" stroke-width="1.4"/></svg>';
const REDRAW_SVG = '<svg viewBox="0 0 16 16"><path d="M13 6.5A5.2 5.2 0 0 0 3.6 5M3 9.5a5.2 5.2 0 0 0 9.4 1.5" fill="none" stroke="#1b2350" stroke-width="2.2" stroke-linecap="round"/><path d="M2.6 2.2v3.6h3.6M13.4 13.8v-3.6H9.8" fill="none" stroke="#1b2350" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const AIM_SVG = '<svg viewBox="0 0 12 12"><circle cx="6" cy="6" r="3.6" fill="none" stroke="#fffaf0" stroke-width="1.6"/><path d="M6 .8v2.4M6 8.8v2.4M.8 6h2.4M8.8 6h2.4" stroke="#fffaf0" stroke-width="1.6" stroke-linecap="round"/></svg>';

// ------------------------------------------------------------------ card art (48×48 pixel canvas per card id)
/** card id -> main art: 'i:<HUD ability icon id>' or 'g:<fx-atlas glyph>:<fx palette>[:frame]' */
const ART = {
  heal: 'g:plus:heal', shield: 'g:hex:water', haste: 'i:wind/basic', power: 'g:chevron:rally', lure: 'i:trainer/capture',
  bulwark: 'i:grass/a2', ward: 'g:twinkle:orb:2', dash: 'i:electric/a2', summon: 'g:starBig:teamBlue', bolt: 'i:electric/basic',
  blast: 'g:burst:fire:1', trap: 'i:grass/a1', meteor: 'i:fire/a1', rally: 'i:trainer/rally', mend: 'i:trainer/mend', surge: 'i:trainer/surge',
};
/** element -> backdrop fx glyph + palette (the same particles the element's moves throw) */
const BACK = { fire: ['ember', 'fire'], water: ['drop', 'water'], grass: ['leaf', 'grass'], electric: ['zap', 'electric'], earth: ['pebble', 'earth'], wind: ['streak', 'wind'], neutral: ['twinkle', 'white'] };
let FX = null;
const glyphCache = new Map(), artCache = new Map();
const hexRGB = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
/** one fx-atlas glyph frame coloured with an fx palette (index 1..5 -> [outline, dark, mid, light, hot]) */
function fxGlyph(name, pal, frame = 0) {
  const key = name + '|' + pal + '|' + frame;
  if (glyphCache.has(key)) return glyphCache.get(key);
  let c = null;
  try {
    if (!FX) FX = buildFxAtlas();
    const g = FX.glyphs[name];
    if (g) {
      const [u0, v0, , , w, h] = g.frames[Math.min(frame, g.frames.length - 1)], P = (PALETTES[pal] || PALETTES.white).map(hexRGB);
      c = document.createElement('canvas'); c.width = w; c.height = h;
      const x2 = c.getContext('2d'), im = x2.createImageData(w, h), X0 = Math.round(u0 * FX.w), Y0 = Math.round(v0 * FX.h);
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        const o = ((Y0 + j) * FX.w + X0 + i) * 4, idx = Math.round(FX.data[o] / 40); if (!FX.data[o + 3] || idx < 1) continue;
        const rgb = P[Math.min(4, idx - 1)], q = (j * w + i) * 4; im.data[q] = rgb[0]; im.data[q + 1] = rgb[1]; im.data[q + 2] = rgb[2]; im.data[q + 3] = 255;
      }
      x2.putImageData(im, 0, 0);
    }
  } catch { c = null; }
  glyphCache.set(key, c);
  return c;
}
export function cardArt(id) {
  if (artCache.has(id)) return artCache.get(id);
  const d = CARDS[id], c = document.createElement('canvas'); c.width = 48; c.height = 48;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  const el = (d && d.element) || 'neutral', [bg, bp] = BACK[el] || BACK.neutral, b = fxGlyph(bg, bp, 0);
  if (b) { g.globalAlpha = 0.42; for (const [x, y] of [[0, 0], [33, 2], [2, 33], [32, 32]]) g.drawImage(b, x, y, Math.min(16, b.width), Math.min(16, b.height)); g.globalAlpha = 1; }
  const spec = ART[id] || (d && ICON_IDS.includes(d.icon) ? 'i:' + d.icon : 'i:trainer/surge');
  if (spec.startsWith('i:')) { const im = art.icon(spec.slice(2), 40); if (im) g.drawImage(im, 4, 4, 40, 40); }
  else {
    const [, name, pal, fr] = spec.split(':'), gl = fxGlyph(name, pal, +fr || 0), E = ELEMENT_COLORS[el] || ELEMENT_COLORS.neutral;
    g.fillStyle = '#1b2350'; g.fillRect(6, 4, 36, 40); g.fillRect(4, 6, 40, 36); g.fillRect(5, 5, 38, 38);       // the icons' navy frame
    g.fillStyle = E.dark; g.fillRect(7, 7, 34, 34); g.fillStyle = E.bg; g.fillRect(7, 7, 34, 30);
    g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(7, 7, 34, 3);
    if (gl) { const s = gl.width <= 16 ? 2 : 1, w = gl.width * s, h = gl.height * s; g.drawImage(gl, Math.round(24 - w / 2), Math.round(24 - h / 2), w, h); }
  }
  artCache.set(id, c);
  return c;
}

// ------------------------------------------------------------------ styles
const CSS = `
#mt-cards{position:fixed;left:0;top:0;z-index:5;display:none;pointer-events:none;--cw:64px;--ch:82px;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;touch-action:none;
  font:800 12px/1.15 system-ui,-apple-system,"Segoe UI",sans-serif;color:#1b2350}
#mt-cards.on{display:block}
#mt-cards .meta{position:absolute;left:0;bottom:calc(100% + 4px);display:flex;align-items:center;gap:6px;white-space:nowrap;pointer-events:none;--pp:max(10px,calc(var(--cw) * .16))}
#mt-cards .mana{display:flex;align-items:center;gap:2px;padding:3px 7px;background:#1b2350;border-radius:10px;box-shadow:0 2px 0 rgba(14,18,44,.4)}
#mt-cards .mana i{width:var(--pp);height:var(--pp);transform:rotate(45deg) scale(.8);background:#2c3566;box-shadow:inset 0 0 0 1px #0c1230}
#mt-cards .mana i.f{background:#5fe0e8;box-shadow:inset 0 0 0 1px #0c1230,inset 2px 2px 0 rgba(255,255,255,.55)}
#mt-cards .mana i.spend{background:#ffd23a;animation:mtCdBlink .5s steps(2) infinite}
#mt-cards .mv{color:#fffaf0;font-size:calc(var(--pp) + 1px);margin-left:4px;text-shadow:0 1px 0 #0c1230}
#mt-cards .chip{display:inline-flex;align-items:center;gap:3px;height:calc(var(--pp) + 10px);padding:0 7px;border-radius:12px;background:#fffaf0;box-shadow:0 0 0 2px #1b2350,0 2px 0 2px rgba(14,18,44,.35);font-size:calc(var(--pp) + 1px)}
#mt-cards .chip svg{width:calc(var(--pp) + 4px);height:calc(var(--pp) + 4px)}
#mt-cards .chip.r1{background:#1b2350;color:#fff;box-shadow:0 0 0 2px #fffaf0}
#mt-cards .chip.bump{animation:mtCdBump .5s ease-out 2}
#mt-cards .row{display:flex;gap:var(--gap,8px);pointer-events:none}
.mt-cd{position:relative;flex:none;width:var(--cw);height:var(--ch);border-radius:7px;background:var(--cdk,#2a2e52);pointer-events:auto;cursor:pointer;
  box-shadow:0 0 0 2px #1b2350,0 3px 0 2px rgba(14,18,44,.5);transition:transform .12s,opacity .2s,filter .2s;touch-action:none;box-sizing:border-box}
.mt-cd *{pointer-events:none}   /* the tile is the target (an icon canvas would read as the game canvas to the touch layer) */
.mt-cd:before{content:"";position:absolute;inset:2px;border-radius:5px;box-shadow:inset 0 0 0 2px var(--cbg,#8a8fb8),inset 0 0 0 3px rgba(255,255,255,.35);pointer-events:none}
.mt-cd .art{position:absolute;left:5px;right:5px;top:5px;bottom:calc(var(--ch) * .25 + 3px);border-radius:3px;background:radial-gradient(circle at 50% 40%,rgba(255,255,255,.4),rgba(255,255,255,0) 64%),var(--cbg,#8a8fb8);
  box-shadow:inset 0 0 0 2px #fffaf0,inset 0 0 0 3px rgba(12,18,48,.55);display:grid;place-items:center;overflow:hidden}
.mt-cd canvas.ic{position:relative;height:100%;max-width:100%;aspect-ratio:1;image-rendering:pixelated}
.mt-cd .nm{position:absolute;left:3px;right:3px;bottom:3px;height:calc(var(--ch) * .25);display:grid;place-items:center;background:#fffaf0;border-radius:3px;box-shadow:inset 0 0 0 1px rgba(27,35,80,.35);
  font-size:max(10px,calc(var(--cw) * .17));line-height:1.05;text-align:center;overflow:hidden;white-space:nowrap;padding:0 2px;letter-spacing:-.2px}
.mt-cd .nm.long{font-size:max(9px,calc(var(--cw) * .145));letter-spacing:-.5px}.mt-cd .nm.xl{font-size:max(8px,calc(var(--cw) * .12));letter-spacing:-.6px}
.mt-cd .cost{position:absolute;left:-7px;top:-7px;width:calc(var(--cw) * .3 + 4px);height:calc(var(--cw) * .3 + 4px);min-width:24px;min-height:24px;display:grid;place-items:center;color:#fff;font-size:max(13px,calc(var(--cw) * .19));font-weight:900;z-index:1;text-shadow:0 1px 0 #0c1230}
.mt-cd .cost:before{content:"";position:absolute;inset:16%;transform:rotate(45deg);background:linear-gradient(135deg,#8fe8ff,#2a78e0 60%,#1a3a8a);box-shadow:0 0 0 2px #1b2350,0 2px 0 2px rgba(14,18,44,.4);z-index:-1}
.mt-cd .aim{position:absolute;right:7px;bottom:calc(var(--ch) * .25 + 6px);width:max(14px,calc(var(--cw) * .2));height:max(14px,calc(var(--cw) * .2));border-radius:50%;background:#1b2350;display:none;place-items:center;box-shadow:0 0 0 1.5px #fffaf0}
.mt-cd .aim svg{width:80%;height:80%}
.mt-cd.aimc .aim{display:grid}
.mt-cd .key{position:absolute;right:-5px;top:-6px;min-width:18px;height:18px;padding:0 3px;border-radius:5px;display:none;place-items:center;background:#fff;color:#1b2350;box-shadow:0 0 0 2px #1b2350;font-size:11px;font-weight:900}
#mt-cards.kbm .mt-cd .key{display:grid}
.mt-cd.poor{filter:grayscale(.85) brightness(.85);opacity:.5;cursor:default}
.mt-cd.poor .cost:before{background:linear-gradient(135deg,#ffb1a8,#c2392f 60%,#6e1d1a)}
.mt-cd.empty{background:rgba(27,35,80,.35);box-shadow:inset 0 0 0 2px rgba(255,250,240,.45);pointer-events:none}
.mt-cd.empty>*,.mt-cd.empty:before{display:none}
.mt-cd.gone{opacity:0;pointer-events:none}
.mt-cd.down{transform:translateY(-6px) scale(1.05)}
.mt-cd.aiming{transform:translateY(-8px) scale(1.06);box-shadow:0 0 0 2px #1b2350,0 0 0 5px #ffd23a,0 3px 0 5px rgba(14,18,44,.45)}
.mt-cd.cancel{filter:grayscale(.6);transform:none}
.mt-cd.sel{box-shadow:0 0 0 2px #1b2350,0 0 0 5px #fffaf0,0 0 0 7px #1b2350}
.mt-cd.shake{animation:mtCdShake .3s}
.mt-cd.refill{animation:mtCdIn .32s ease-out}
.mt-cd.fly{position:fixed;z-index:6;pointer-events:none;animation:mtCdFly .5s ease-in forwards}
#mt-cards.ring .row{transform:translateY(-10px)}
#mt-cards.ring .mt-cd{transform:scale(1.08)}
#mt-cards.ring .mt-cd.sel{transform:translateY(-10px) scale(1.16)}
#mt-cards .nudge{position:absolute;inset:-4px;display:none;align-items:center;justify-content:center;gap:10px;border-radius:12px;background:rgba(255,250,240,.95);box-shadow:0 0 0 3px #1b2350,0 4px 0 3px rgba(14,18,44,.4);z-index:2;
  font-size:max(15px,calc(var(--cw) * .24));font-weight:900;text-align:center;padding:0 10px;pointer-events:auto;word-break:keep-all;line-break:strict;animation:mtCdPulse 1.4s ease-in-out infinite}
#mt-cards .nudge svg{width:calc(var(--cw) * .5);height:calc(var(--cw) * .5);min-width:30px;min-height:30px;flex:none}
#mt-cards .nudge small{display:block;font-size:max(12px,calc(var(--cw) * .17));color:#4a5280;font-weight:800;margin-top:2px}
#mt-cards .nudge .k{display:inline-grid;place-items:center;min-width:1.4em;height:1.4em;padding:0 3px;margin-right:4px;border-radius:5px;background:#1b2350;color:#fff;font-size:.9em}
#mt-cards.out .nudge{display:flex}
#mt-cards.out .row{opacity:.3}
#mt-cards .open{position:absolute;inset:0;display:none;align-items:center;justify-content:center;gap:10px;border-radius:12px;background:linear-gradient(#fff4d6,#ffd56a 55%,#f0a636);
  box-shadow:0 0 0 3px #1b2350,0 4px 0 3px rgba(14,18,44,.45);font-size:max(18px,calc(var(--cw) * .26));font-weight:900;pointer-events:auto;cursor:pointer;min-height:56px}
#mt-cards .open .stack{display:flex}#mt-cards .open .stack i{width:20px;height:28px;margin-left:-8px;border-radius:3px;background:#8a8fb8;box-shadow:0 0 0 2px #1b2350}
#mt-cards .open .stack i:nth-child(2){background:#e8562e}#mt-cards .open .stack i:nth-child(3){background:#3a8ef0}
#mt-cards .open .k{display:inline-grid;place-items:center;min-width:1.5em;height:1.5em;padding:0 4px;border-radius:6px;background:#1b2350;color:#fff;font-size:.75em}
#mt-cards.base .open{display:flex}#mt-cards.base .row,#mt-cards.base .meta .mana,#mt-cards.base .meta .mv{visibility:hidden}#mt-cards.base .nudge{display:none}
.mt-cue{animation:mtCdCue .45s ease-in-out 4!important}
@keyframes mtCdBlink{50%{background:#fffaf0}}
@keyframes mtCdShake{0%,100%{translate:0}25%{translate:-4px}75%{translate:4px}}
@keyframes mtCdIn{from{transform:translateY(24px);opacity:0}to{transform:none;opacity:1}}
@keyframes mtCdFly{0%{transform:none;opacity:1}100%{transform:translateY(-90px) scale(1.25);opacity:0}}
@keyframes mtCdPulse{50%{box-shadow:0 0 0 3px #1b2350,0 0 0 7px rgba(255,210,58,.8)}}
@keyframes mtCdBump{40%{transform:scale(1.35)}}
@keyframes mtCdCue{50%{transform:scale(1.18);filter:drop-shadow(0 0 8px #ffd23a) brightness(1.15)}}
html.lang-ja #mt-cards,html.lang-ja #mt-cardpanel{font-family:'Vale JP',system-ui,sans-serif}
html.lang-ja #mt-cards *,html.lang-ja #mt-cardpanel *{font-weight:400!important}
/* base panel */
#mt-cardpanel{position:fixed;z-index:6;display:none;box-sizing:border-box;padding:8px 12px 10px;border-radius:16px;background:linear-gradient(#fffaf0,#f3ead2);
  box-shadow:0 0 0 3px #1b2350,0 6px 0 3px rgba(14,18,44,.45),0 16px 40px rgba(0,0,0,.35);color:#1b2350;font:800 13px/1.25 system-ui,-apple-system,"Segoe UI",sans-serif;
  -webkit-user-select:none;user-select:none;-webkit-touch-callout:none;touch-action:none;word-break:keep-all;line-break:strict;--cw:80px;--ch:104px}
#mt-cardpanel.on{display:block}
#mt-cardpanel h3{margin:0 0 2px;font-size:16px;display:flex;align-items:center;gap:8px}
#mt-cardpanel .sub{font-size:12.5px;color:#4a5280;margin-bottom:4px;min-height:2.5em;display:flex;align-items:center;gap:8px}
#mt-cardpanel .sub b{color:#1b2350;font-size:14px;white-space:nowrap}
#mt-cardpanel .sub .gem{flex:none;display:inline-grid;place-items:center;width:20px;height:20px;color:#fff;font-size:12px;position:relative;text-shadow:0 1px 0 #0c1230}
#mt-cardpanel .sub .gem:before{content:"";position:absolute;inset:3px;transform:rotate(45deg);background:linear-gradient(135deg,#8fe8ff,#2a78e0 60%,#1a3a8a);box-shadow:0 0 0 1.5px #1b2350;z-index:-1}
#mt-cardpanel .grid{display:grid;grid-template-columns:repeat(5,var(--cw));gap:10px 8px;justify-content:center;position:relative;padding:8px 6px 6px}
#mt-cardpanel .lane{grid-column:1/-1;font-size:11px;color:#56608a;margin:-4px 0 -6px;display:flex;align-items:center;gap:6px}
#mt-cardpanel .lane:after{content:"";flex:1;height:2px;background:rgba(27,35,80,.18)}
#mt-cardpanel .lane.top{color:#c2392f}
#mt-cardpanel .mt-cd.mark{transform:translateY(-4px) rotate(-3deg)}
#mt-cardpanel .mt-cd.mark:after{content:"";position:absolute;inset:0;border-radius:7px;background:rgba(194,57,47,.42) url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5 5l14 14M19 5L5 19" stroke="%23fffaf0" stroke-width="4.5" stroke-linecap="round"/><path d="M5 5l14 14M19 5L5 19" stroke="%231b2350" stroke-width="1.6" stroke-linecap="round"/></svg>') center/56% no-repeat}
#mt-cardpanel .mt-cd.cur{box-shadow:0 0 0 2px #1b2350,0 0 0 5px #ffd23a,0 0 0 7px #1b2350}
#mt-cardpanel .mt-cd.held{transform:translateY(-12px) scale(1.06);box-shadow:0 0 0 2px #1b2350,0 0 0 5px #5fe0e8,0 8px 0 4px rgba(14,18,44,.35)}
#mt-cardpanel .mt-cd.ghost{opacity:.35}
#mt-cardpanel .mt-cd.over{box-shadow:0 0 0 2px #1b2350,0 0 0 5px #5fe0e8}
#mt-cardpanel .mt-cd.drag{position:fixed;z-index:8;pointer-events:none;transform:scale(1.1) rotate(4deg);opacity:.92}
#mt-cardpanel .ft{display:flex;gap:10px;justify-content:center;align-items:center;margin-top:8px}
#mt-cardpanel .btn{min-height:52px;min-width:120px;padding:0 18px;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;gap:8px;font-size:17px;font-weight:900;cursor:pointer;
  background:#fffaf0;box-shadow:0 0 0 3px #1b2350,0 4px 0 3px rgba(14,18,44,.45);box-sizing:border-box}
#mt-cardpanel .btn.go{background:linear-gradient(#fff4d6,#ffd56a 55%,#f0a636);min-width:200px}
#mt-cardpanel .btn.off{filter:grayscale(1);opacity:.5;cursor:default}
#mt-cardpanel .btn.shake{animation:mtCdShake .3s}
#mt-cardpanel .btn svg{width:22px;height:22px}
#mt-cardpanel .hint{text-align:center;font-size:11.5px;color:#56608a;margin-top:6px}
#mt-cardpanel .g{display:inline-grid;place-items:center;min-width:18px;height:18px;padding:0 4px;border-radius:9px;background:#1b2350;color:#fff;font-size:11px;vertical-align:-3px}
@media (max-height:430px){#mt-cardpanel{padding:5px 10px 7px}#mt-cardpanel h3{font-size:14px;margin:0}#mt-cardpanel .sub{min-height:0;margin-bottom:0;font-size:11px}#mt-cardpanel .sub b{font-size:12px}
  #mt-cardpanel .grid{gap:7px 6px;padding-top:6px}#mt-cardpanel .lane{font-size:10px}#mt-cardpanel .ft{margin-top:4px}#mt-cardpanel .btn{min-height:48px;font-size:15px}#mt-cardpanel .hint{display:none}}
`;

const el = (tag, cls, parent, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (parent) parent.appendChild(e); return e; };
const setCls = (e, c, on) => { if (e.classList.contains(c) !== !!on) e.classList.toggle(c, !!on); };
const setTxt = (e, s) => { if (e.textContent !== s) e.textContent = s; };
const setHTML = (e, s) => { if (e._h !== s) { e._h = s; e.innerHTML = s; } };
const setVar = (e, k, v) => { if (e.style.getPropertyValue(k) !== v) e.style.setProperty(k, v); };
const restart = (e, c) => { setCls(e, c, false); void e.offsetWidth; setCls(e, c, true); };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** the units a 'unit' card may target — mirrors mt/sim/cards.js resolveAim: enemy trainer / monster / minion or a wild monster */
export function cardTargetOk(me, u) {
  if (!u || !u.alive || u.removed || u === me || u.untargetable || (u.visible && u.visible[me.team] === false)) return false;
  if (u.team === 2) return u.kind === 'monster' && !u.epic && !(u.mtMon && u.mtMon.capturing);
  return (u.team === 0 || u.team === 1) && u.team !== me.team && (u.kind === 'champion' || u.kind === 'monster' || u.kind === 'minion') && !(u.mtMon && u.mtMon.capturing);
}

export class SkillCards {
  constructor(ctx, locals, gamepad) {
    this.ctx = ctx; this.app = ctx.app; this.locals = locals; this.gamepad = gamepad;
    this.time = 0; this.tiles = []; this.prevShown = []; this.prevKey = ''; this.drag = null; this.pend = null;
    this.panelOpen = false; this.panelPad = -1; this.panelLocal = null; this.cur = 0; this.held = -1; this.kbCur = false; this.info = -1;
    this.marks = new Set(); this.autoDone = null; this.lastView = null; this.barMe = null; this.prevMull = -1;
    this.padSt = new Map(); this.mouse = { x: -1, y: -1 };
    const self = this;
    this.app.mtCardsUI = {
      get on() { return !!(self.lastView && self.lastView.on); }, view: () => self.lastView, rect: () => (self.bar && self.bar.classList.contains('on') ? self.bar.getBoundingClientRect() : null),
      get panelOpen() { return self.panelOpen; }, ui: this,
      // tests only: {mana, mulligans, empty} on the bar's trainer (the sim's unit.mtCards state, offline)
      debugSet: (o) => { const me = self.barMe || self.unitOf(self.screenLocal()), C = me && me.mtCards; if (!C) return; if (o.mana != null) C.mana = o.mana; if (o.mulligans != null) C.mulligans = o.mulligans; if (o.empty) C.hand.length = 0; },
    };
    if (typeof document === 'undefined') return;
    const st = document.createElement('style'); st.id = 'mt-cards-css'; st.textContent = CSS; document.head.appendChild(st);
    this.build();
    this.onKey = (e) => this.key(e); addEventListener('keydown', this.onKey, true);
    this.onMove = (e) => { this.mouse.x = e.clientX; this.mouse.y = e.clientY; }; addEventListener('pointermove', this.onMove, { passive: true, capture: true });
  }

  // ------------------------------------------------------------------ data
  def(id) { return (id && CARDS[id]) || null; }
  name(id) { const d = this.def(id); return d ? tOr('cardui.short.' + id, t(d.nameKey)) : ''; }
  /** the screen's own local: touch / keys = the keyboard local, else the first pad local */
  screenLocal() {
    const m = this.app.mtInputMode, L = this.app.locals || [];
    if (m === 'touch' || m === 'kbm') return this.locals.keyboardLocal() || L[0] || null;
    return L.find((l) => l.device && l.device.startsWith('pad:')) || L[0] || this.locals.keyboardLocal();
  }
  /** the local the bar shows: an open card ring's, else the panel's, else the screen's */
  barLocal() {
    for (const [idx, ps] of this.padSt) if (ps.ring) { const l = this.locals.byDevice('pad:' + idx); if (l) return l; }
    return (this.panelOpen && this.panelLocal) || this.screenLocal();
  }
  unitOf(l) { const w = this.app.world; return l && w ? w.units.get(l.unitId) || null : null; }
  viewFor(me) {
    const w = this.app.world; if (!w || !me || !me.mtTrainer || typeof this.app.mtCards !== 'function') return null;
    try { return this.app.mtCards(me.id) || null; } catch { return null; }
  }
  /** the same path as every other button: world.command(local unit, cmd) (online: queued in the lockstep) */
  cmd(me, c) { const w = this.app.world; return !!(w && me && w.command(me.id, c)); }

  // ------------------------------------------------------------------ DOM
  build() {
    const b = this.bar = el('div', null, document.body); b.id = 'mt-cards';
    const meta = el('div', 'meta', b);
    this.manaEl = el('div', 'mana', meta); this.pips = Array.from({ length: 10 }, () => el('i', null, this.manaEl));
    this.mv = el('span', 'mv', this.manaEl);
    this.deckEl = el('span', 'chip deck', meta, DECK_SVG); this.deckN = el('b', null, this.deckEl);
    this.rdEl = el('span', 'chip rd', meta, REDRAW_SVG); this.rdN = el('b', null, this.rdEl);
    this.r1El = el('span', 'chip r1', meta);
    const row = this.row = el('div', 'row', b);
    for (let i = 0; i < 5; i++) {
      const c = this.tile(row, i);
      c.el.addEventListener('pointerdown', (e) => this.tDown(i, e));
      c.el.addEventListener('pointermove', (e) => this.tMove(i, e));
      c.el.addEventListener('pointerup', (e) => this.tUp(i, e, false));
      c.el.addEventListener('pointercancel', (e) => this.tUp(i, e, true));
      c.el.addEventListener('lostpointercapture', (e) => { if (this.drag && this.drag.pid === e.pointerId && this.drag.slot === i) this.tUp(i, e, true); });
      this.tiles.push(c);
    }
    this.nudge = el('div', 'nudge', b, HOME_SVG); this.nudgeT = el('div', null, this.nudge);
    this.nudge.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); this.noteTouch(e); this.cueRecall(); });
    this.openBtn = el('div', 'open', b, '<span class="stack"><i></i><i></i><i></i></span>'); this.openT = el('span', null, this.openBtn);
    this.openBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); this.noteTouch(e); this.openPanel(-1, this.barLocal()); });
    // base panel
    const p = this.panel = el('div', null, document.body); p.id = 'mt-cardpanel';
    p.addEventListener('pointerdown', (e) => { e.stopPropagation(); this.noteTouch(e); });
    this.pTitle = el('h3', null, p); this.pSub = el('div', 'sub', p);
    this.grid = el('div', 'grid', p);
    this.pTiles = [];
    this.laneTop = el('div', 'lane top', this.grid);
    for (let i = 0; i < 10; i++) {
      if (i === 5) this.laneNext = el('div', 'lane', this.grid);
      const c = this.tile(this.grid, i);
      c.el.addEventListener('pointerdown', (e) => this.pDown(i, e));
      c.el.addEventListener('pointermove', (e) => this.pMove(i, e));
      c.el.addEventListener('pointerup', (e) => this.pUp(i, e, false));
      c.el.addEventListener('pointercancel', (e) => this.pUp(i, e, true));
      this.pTiles.push(c);
    }
    const ft = el('div', 'ft', p);
    this.goBtn = el('div', 'btn go', ft, REDRAW_SVG); this.goT = el('span', null, this.goBtn);
    this.okBtn = el('div', 'btn ok', ft); this.okT = el('span', null, this.okBtn);
    this.goBtn.addEventListener('click', () => this.redraw());
    this.okBtn.addEventListener('click', () => this.closePanel());
    this.pHint = el('div', 'hint', p);
  }
  tile(parent, i) {
    const e = el('div', 'mt-cd', parent); e.dataset.slot = i;
    const a = el('div', 'art', e), ic = document.createElement('canvas'); ic.className = 'ic'; ic.width = 48; ic.height = 48; a.appendChild(ic);
    return { el: e, ic, cost: el('b', 'cost', e), nm: el('span', 'nm', e), aim: el('span', 'aim', e, AIM_SVG), key: el('span', 'key', e, String(i + 1)), id: undefined };
  }
  /** draw a card face (cached on the tile by id + language) */
  face(c, id, affordable) {
    if (c.id !== id || c.lang !== getLang()) {
      c.id = id; c.lang = getLang();
      const d = this.def(id);
      setCls(c.el, 'empty', !d);
      if (d) {
        const ec = d.element && ELEMENT_COLORS[d.element], sc = d.spec && SPEC_COL[d.spec];
        setVar(c.el, '--cbg', ec ? ec.bg : sc ? sc[0] : ELEMENT_COLORS.neutral.bg); setVar(c.el, '--cdk', ec ? ec.dark : sc ? sc[1] : ELEMENT_COLORS.neutral.dark);
        const g = c.ic.getContext('2d'); g.imageSmoothingEnabled = false; g.clearRect(0, 0, 48, 48); g.drawImage(cardArt(id), 0, 0);
        const nm = this.name(id); setTxt(c.cost, String(d.cost)); setTxt(c.nm, nm);
        setCls(c.nm, 'long', nm.length >= 5 && nm.length < 7); setCls(c.nm, 'xl', nm.length >= 7);
        setCls(c.el, 'aimc', d.target === 'point' || d.target === 'unit');
        c.el.title = tOr(d.nameKey, nm);
      }
    }
    setCls(c.el, 'poor', !!id && !affordable);
  }

  // ------------------------------------------------------------------ layout
  touchButtons() {
    const out = [];
    for (const e of document.querySelectorAll('#mt-touch .tb')) {
      if (e.classList.contains('hidden') || e.offsetParent === null || e.closest('.sys,.sys2')) continue;
      const r = e.getBoundingClientRect(); if (r.width > 0) out.push(r);
    }
    return out;
  }
  layout() {
    const W = innerWidth, H = innerHeight, b = this.bar, mode = this.app.mtInputMode;
    let x0, x1, bottom, cw, gap = 8;
    if (mode === 'touch' && this.app.mtTouch && this.app.mtTouch.active) {
      const hud = this.app.mtHud, z = hud && hud.touchZones ? hud.touchZones() : null;
      const sa = (this.app.mtTouch.sz && this.app.mtTouch.sz.sa) || { l: 0, r: 0, b: 0 };
      // between the HUD card (+ bench card) and the cluster's leftmost bottom button (TARGET / SWAP)
      const cr = z && z.card && z.card.width > 0 && z.card.left < W * 0.45 ? z.card.right : Math.max(sa.l, W * 0.3 - 12);
      let cl = W - sa.r - 8;
      for (const r of this.touchButtons()) if (r.top > H * 0.5) cl = Math.min(cl, r.left);
      // phones: the margins and the gaps shrink before the cards do (never below 56 CSS px)
      const m = cl - cr - 24 < 5 * 56 + 4 * 8 ? 6 : 12;
      x0 = cr + m; x1 = cl - m; bottom = H - Math.max(sa.b, 4) - 8;
      if (x1 - x0 < 5 * 56 + 4 * 8) gap = Math.max(3, Math.floor((x1 - x0 - 5 * 56) / 4));
      cw = Math.floor((x1 - x0 - gap * 4) / 5);
      cw = Math.max(56, Math.min(84, cw));
      cw = Math.min(cw, Math.max(56, Math.floor((H * 0.26) / 1.28)));   // short screens: never taller than 26 % of the height
      const tw = cw * 5 + gap * 4; x0 = Math.round(x0 + Math.max(0, (x1 - x0 - tw) / 2));
    } else {
      const dock = document.querySelector('#mt-hud .dock'), r = dock ? dock.getBoundingClientRect() : null;
      cw = Math.max(52, Math.min(64, Math.round(Math.min(W, H * 1.7) * 0.05)));
      const tw = cw * 5 + gap * 4;
      x0 = Math.round(W / 2 - tw / 2);
      bottom = r && r.height > 0 ? r.top - 10 : H * 0.78;
    }
    const ch = Math.round(cw * 1.28);
    setVar(b, '--cw', cw + 'px'); setVar(b, '--ch', ch + 'px'); setVar(b, '--gap', gap + 'px');
    const top = Math.round(bottom - ch), lv = Math.round(x0) + 'px', tv = top + 'px', wv = (cw * 5 + gap * 4) + 'px', hv = ch + 'px';
    if (b.style.left !== lv) b.style.left = lv; if (b.style.top !== tv) b.style.top = tv;
    if (b.style.width !== wv) b.style.width = wv; if (b.style.height !== hv) b.style.height = hv;
  }
  panelLayout() {
    const W = innerWidth, H = innerHeight, p = this.panel, ins = this.app.mtHudInsets;
    const top = Math.round(Math.max(ins && ins.top > 0 ? ins.top * H + 6 : H * 0.11, 8));
    const short = H <= 430;
    const head = short ? 34 : 64, foot = short ? 56 : 84, padY = short ? 14 : 20;
    const chMax = Math.floor((H - top - 8 - head - foot - padY - 30) / 2);
    let cw = Math.floor(Math.min(96, (Math.min(W - 24, 640) - 24 - 4 * 8) / 5, chMax / 1.3));
    cw = Math.max(56, cw);
    setVar(p, '--cw', cw + 'px'); setVar(p, '--ch', Math.round(cw * 1.3) + 'px');
    const pw = cw * 5 + 4 * 8 + 36;
    // between the joystick column and the touch cluster when they are on screen
    let right = W - 8;
    if (this.app.mtInputMode === 'touch' && this.app.mtTouch && this.app.mtTouch.active) for (const r of this.touchButtons()) if (r.top < top + cw * 3) right = Math.min(right, r.left - 8);
    const left = Math.round(Math.max(8, Math.min((W - pw) / 2, right - pw)));
    p.style.left = left + 'px'; p.style.top = top + 'px'; p.style.width = pw + 'px';
  }

  // ------------------------------------------------------------------ frame
  update(f) {
    if (!this.bar) return;
    const dt = Math.min(0.1, f.dt || 0); this.time += dt;
    const app = this.app, w = f.world, L = f.state === 'game' ? this.barLocal() : null, me = this.unitOf(L);
    const blocked = !!(app.paused || (app.ui && app.ui.panel && app.ui.panel !== 'none'));
    const v = me ? this.viewFor(me) : null;
    this.lastView = v; this.barMe = me;
    const show = !!(v && v.on && f.state === 'game' && me && !blocked);
    if (!show) {
      setCls(this.bar, 'on', false); if (this.panelOpen && (!v || !v.on || f.state !== 'game')) this.closePanel();
      setCls(this.panel, 'on', this.panelOpen && !blocked); if (this.drag) this.endAim(); return;
    }
    // auto-open at base: once per match, after the first-match controls card (a pad screen gives the panel to that pad)
    if (this.autoDone !== w) {
      const hints = this.gamepad && this.gamepad.hints;
      if (v.atBase && me.alive && !(hints && hints.open) && w.time > 1.5) {
        this.autoDone = w; const sl = this.screenLocal();
        this.openPanel(app.mtInputMode === 'pad' && sl && /^pad:/.test(sl.device || '') ? +sl.device.slice(4) : -1, sl);
      } else if (!v.atBase && w.time > 3) this.autoDone = w;
    }
    if (this.panelOpen) { const pv = this.viewFor(this.unitOf(this.panelLocal)); if (!pv || !pv.atBase) this.closePanel(); }
    setCls(this.panel, 'on', this.panelOpen);
    setCls(this.bar, 'on', !this.panelOpen && me.alive);
    const mode = app.mtInputMode;
    setCls(this.bar, 'kbm', mode === 'kbm'); setCls(this.bar, 'pad', mode === 'pad');
    this.layout();
    // bar state (a new trainer on the bar = no refill animation)
    const shown = v.shown || [], key = me.id + '|' + w.seed;
    if (key !== this.prevKey) { this.prevKey = key; this.prevShown = []; this.prevMull = -1; }
    const ps = this.padStOf(L);
    let anyPlayable = false;
    for (let i = 0; i < 5; i++) {
      const id = shown[i] || null, d = this.def(id), c = this.tiles[i];
      const ok = !!d && v.mana >= d.cost;
      if (ok) anyPlayable = true;
      const prev = this.prevShown[i];
      this.face(c, id, ok);
      if (prev !== undefined && prev !== id && id) restart(c.el, 'refill');
      this.prevShown[i] = id;
      setCls(c.el, 'sel', mode === 'pad' && !!ps && i === ps.sel);
      const P = this.pend; setCls(c.el, 'gone', !!(P && P.unit === me.id && P.slot === i && P.id === id && this.time < P.until));
    }
    if (this.pend && this.time >= this.pend.until) this.pend = null;
    const out = !v.atBase && (!shown.some(Boolean) || !anyPlayable);
    setCls(this.bar, 'out', out); setCls(this.bar, 'base', v.atBase);
    if (out) {
      const k = mode === 'pad' ? '<span class="k">←</span>' : mode === 'kbm' ? '<span class="k">B</span>' : '';
      setHTML(this.nudgeT, `${esc(!shown.some(Boolean) ? t('cardui.nudge.empty') : t('cardui.nudge.mana'))}<small>${k}${esc(t('cardui.nudge'))}</small>`);
    }
    setHTML(this.openT, esc(t('cardui.open')) + (mode === 'pad' ? ' <span class="k">R1</span>' : mode === 'kbm' ? ' <span class="k">K</span>' : ''));
    // mana + counters (the pips a held card would spend blink)
    const held = this.drag && this.def(shown[this.drag.slot]), spend = held ? held.cost : 0;
    for (let i = 0; i < 10; i++) {
      const p = this.pips[i], on = i < v.mana, sp = !!(on && spend && i >= v.mana - spend);
      setCls(p, 'f', on && !sp); setCls(p, 'spend', sp); const dsp = i < (v.manaMax || 10) ? '' : 'none'; if (p.style.display !== dsp) p.style.display = dsp;
    }
    setTxt(this.mv, v.mana + '/' + (v.manaMax || 10));
    setTxt(this.deckN, String(v.deckLeft ?? 0));
    setTxt(this.rdN, String(v.mulligans ?? 0));
    if (this.prevMull >= 0 && v.mulligans > this.prevMull) restart(this.rdEl, 'bump');   // a takedown / tower earned a redraw
    this.prevMull = v.mulligans;
    this.deckEl.title = t('cardui.deck'); this.rdEl.title = t('cardui.redraws');
    const ring = !!(ps && ps.ring);
    setCls(this.bar, 'ring', ring);
    const r1 = mode === 'pad' ? '' : 'none'; if (this.r1El.style.display !== r1) this.r1El.style.display = r1;
    if (mode === 'pad') setTxt(this.r1El, ring ? 'R ◀ ▶' : 'R1');
    if (this.panelOpen) this.renderPanel();
  }
  padStOf(l) { const m = l && /^pad:(\d+)$/.exec(l.device || ''); return m ? this.padSt.get(+m[1]) || null : null; }

  // ------------------------------------------------------------------ casting
  aimState(l) {
    if (!l) return null;
    const A = this.app.mtAim || (this.app.mtAim = []);
    return A[l.slot] || (A[l.slot] = { active: false, x: 0, y: 0, dist: 0, lockId: -1, hold: null, at: 0 });
  }
  /** target for a card without an explicit aim: lock > nearest valid in range (facing first) */
  autoTarget(me, d, lockId) {
    const w = this.app.world, R = (d.range || 7) + 0.5;
    const lk = lockId >= 0 ? w.units.get(lockId) : null;
    if (lk && cardTargetOk(me, lk) && Math.hypot(lk.x - me.x, lk.y - me.y) <= R) return lk;
    return pick(w, me, me.facing || 0, R, (u) => cardTargetOk(me, u));
  }
  /** play shown slot `slot` of trainer `me`; aim = {x, y} on the ground (drag / stick / cursor) or null = auto */
  cast(me, slot, aim, lockId = -1) {
    const w = this.app.world, v = this.viewFor(me); if (!me || !v || !v.on || !w || !me.alive) return false;
    const onBar = me === this.barMe, id = (v.shown || [])[slot], d = this.def(id); if (!d) return false;
    if (v.mana < d.cost) { if (onBar) this.shake(slot); return false; }
    const c = { type: 'card', slot };
    if (d.target === 'unit') {
      let tg = null;
      if (aim) { let bd = 3.2; for (const u of w.queryUnits(aim.x, aim.y, 3.2, (u) => cardTargetOk(me, u), [])) { const dd = Math.hypot(u.x - aim.x, u.y - aim.y); if (dd < bd) { bd = dd; tg = u; } } }
      if (!tg) tg = this.autoTarget(me, d, lockId);
      if (!tg) { if (onBar) this.shake(slot); this.app.fire('denied', { type: 'card', reason: 'bad_target' }); return false; }
      c.targetId = tg.id;
    } else if (d.target === 'point') {
      let p = aim;
      if (!p) { const tg = this.autoTarget(me, d, lockId), f = me.facing || 0, r = Math.max(2, (d.range || 7) * 0.6); p = tg ? { x: tg.x, y: tg.y } : { x: me.x + Math.cos(f) * r, y: me.y + Math.sin(f) * r }; }
      const dx = p.x - me.x, dy = p.y - me.y, n = Math.hypot(dx, dy), R = d.range || 7;
      if (n > R) p = { x: me.x + dx / n * R, y: me.y + dy / n * R };
      c.x = p.x; c.y = p.y;
    }
    const ok = this.cmd(me, c);
    if (onBar) { if (ok) { this.flyFx(slot); this.pend = { unit: me.id, slot, id, until: this.time + PEND }; } else this.shake(slot); }
    return ok;
  }
  shake(slot) { const c = this.tiles[slot]; if (c) restart(c.el, 'shake'); }
  flyFx(slot) {
    const c = this.tiles[slot]; if (!c || !c.el.getBoundingClientRect) return;
    const r = c.el.getBoundingClientRect(); if (!(r.width > 0)) return;
    const f = c.el.cloneNode(true); f.classList.remove('down', 'aiming', 'cancel', 'sel', 'refill', 'shake', 'poor', 'gone'); f.classList.add('fly');
    const g = f.querySelector('canvas'); if (g) g.getContext('2d').drawImage(c.ic, 0, 0);
    f.style.left = r.left + 'px'; f.style.top = r.top + 'px'; f.style.width = r.width + 'px'; f.style.height = r.height + 'px';
    f.style.setProperty('--cw', r.width + 'px'); f.style.setProperty('--ch', r.height + 'px');
    f.addEventListener('animationend', () => f.remove());
    document.body.appendChild(f); setTimeout(() => f.remove(), 700);
  }
  /** nudge tapped: the RECALL button (touch) pulses — that is the way home */
  cueRecall() {
    const b = document.querySelector('#mt-touch .tb[data-tb="recall"]'); if (!b) return;
    restart(b, 'mt-cue'); clearTimeout(this.cueT); this.cueT = setTimeout(() => b.classList.remove('mt-cue'), 1900);
  }

  // ---- touch / mouse on the bar (the screen's keyboard / touch local)
  noteTouch(e) { if (e && e.pointerType === 'touch') { const l = this.locals.keyboardLocal(); if (l) this.locals.noteInput(l, 'touch'); } }
  tDown(i, e) {
    e.preventDefault(); e.stopPropagation(); this.noteTouch(e);
    if (this.drag) return;
    const v = this.lastView, d = v && this.def((v.shown || [])[i]); if (!d || !this.barMe) return;
    if (v.mana < d.cost) { this.shake(i); return; }
    this.drag = { pid: e.pointerId, slot: i, x0: e.clientX, y0: e.clientY, dragged: false, cancel: false, d, l: this.barLocal() };
    try { this.tiles[i].el.setPointerCapture(e.pointerId); } catch { /* */ }
    setCls(this.tiles[i].el, 'down', true);
  }
  tMove(i, e) {
    const g = this.drag; if (!g || g.pid !== e.pointerId || g.slot !== i) return;
    e.preventDefault(); e.stopPropagation();
    if (g.d.target !== 'point' && g.d.target !== 'unit') return;
    const dx = e.clientX - g.x0, dy = e.clientY - g.y0, m = Math.hypot(dx, dy);
    if (!g.dragged && m > DRAG_MIN) g.dragged = true;
    if (!g.dragged) return;
    const c = this.tiles[i].el; setCls(c, 'aiming', true);
    g.cancel = m < DRAG_MIN * 0.8; setCls(c, 'cancel', g.cancel);
    const a = this.aimState(g.l), me = this.unitOf(g.l); if (!a || !me) return;
    if (g.cancel) { a.active = false; a.range = 0; return; }
    const rig = this.ctx.pipeline && this.ctx.pipeline.cameraRig, yaw = (rig && rig.yaw) || 0, cs = Math.cos(yaw), sn = Math.sin(yaw);
    const wx = dx * cs + dy * sn, wy = -dx * sn + dy * cs, n = Math.hypot(wx, wy) || 1, R = g.d.range || 7, k = Math.min(1, m / AIM_PX), dist = 1.2 + (R - 1.2) * k;
    a.active = true; a.x = me.x + (wx / n) * dist; a.y = me.y + (wy / n) * dist; a.dist = dist; a.dir = Math.atan2(wy, wx); a.at = this.time; a.touch = 'card'; a.range = R; a.origin = me.id;
  }
  tUp(i, e, cancelled) {
    const g = this.drag; if (!g || g.pid !== e.pointerId || g.slot !== i) return;
    if (e.preventDefault) e.preventDefault();
    const a = this.aimState(g.l), aimed = a && a.active && a.touch === 'card' ? { x: a.x, y: a.y } : null;
    this.endAim();
    if (cancelled || g.cancel) return;
    const me = this.unitOf(g.l), lock = this.touchLock(g.l);
    if (g.dragged) { if (aimed) this.cast(me, i, aimed, lock); }
    else this.cast(me, i, null, lock);
  }
  endAim() {
    const g = this.drag; this.drag = null;
    if (g) { const c = this.tiles[g.slot].el; setCls(c, 'down', false); setCls(c, 'aiming', false); setCls(c, 'cancel', false); }
    const a = g && this.aimState(g.l); if (a && a.touch === 'card') { a.active = false; a.touch = null; a.range = 0; }
  }
  touchLock(l) { const T = this.gamepad && this.gamepad.touch; if (T && T.lockId >= 0) return T.lockId; const a = this.aimState(l); return a && a.lockId >= 0 ? a.lockId : -1; }

  // ---- keyboard: 1–5 play, K panel; in the panel arrows / Space / Enter / R
  key(e) {
    if (e.isTrusted === false || e.ctrlKey || e.metaKey || e.altKey) return;
    const app = this.app; if (app.state !== 'game' || app.paused || (app.ui && app.ui.panel && app.ui.panel !== 'none')) return;
    const tg = e.target; if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA')) return;
    const l = this.locals.keyboardLocal(), me = this.unitOf(l), v = me && this.viewFor(me); if (!v || !v.on) return;
    const code = e.code || '', swallow = () => { e.preventDefault(); e.stopImmediatePropagation(); };
    if (this.panelOpen && this.panelPad < 0) {
      const n = (this.panelView() || {}).hand ? this.panelView().hand.length : 10;
      const mv = (d) => { this.kbCur = true; this.cur = Math.max(0, Math.min(n - 1, this.cur + d)); this.info = this.cur; };
      const K = { ArrowLeft: () => mv(-1), ArrowRight: () => mv(1), ArrowUp: () => { if (this.cur >= 5) mv(-5); else this.kbCur = true; }, ArrowDown: () => { if (this.cur + 5 < n) mv(5); else this.kbCur = true; },
        Space: () => { this.kbCur = true; if (this.held >= 0) this.drop(); else this.toggleMark(this.cur); }, Enter: () => { this.kbCur = true; if (this.held >= 0) this.drop(); else this.held = this.cur; },
        KeyR: () => this.redraw(), KeyK: () => this.closePanel() };
      if (K[code]) { swallow(); if (!e.repeat) K[code](); return; }
    }
    const m = /^(?:Digit|Numpad)([1-5])$/.exec(code);
    if (m) {
      swallow(); if (e.repeat) return;
      const slot = +m[1] - 1, d = this.def((v.shown || [])[slot]); if (!d) return;
      let aim = null;
      const rig = this.ctx.pipeline && this.ctx.pipeline.cameraRig;
      if ((d.target === 'point' || d.target === 'unit') && rig && rig.screenToGround && this.mouse.x >= 0) { try { const g = rig.screenToGround(this.mouse.x, this.mouse.y, { x: 0, y: 0 }); if (g && Number.isFinite(g.x)) aim = { x: g.x, y: g.y }; } catch { aim = null; } }
      if (aim && Math.hypot(aim.x - me.x, aim.y - me.y) > (d.range || 7) + 6) aim = null;   // cursor far off: auto-aim instead
      const a = this.aimState(l);
      this.cast(me, slot, aim, a && a.kbLockId >= 0 ? a.kbLockId : (a ? a.lockId : -1));
      return;
    }
    if (code === 'KeyK' && !e.repeat && v.atBase) { swallow(); if (this.panelOpen) this.closePanel(); else this.openPanel(-1, l); }
  }

  // ---- pad (called by gamepad.js handle(): padMode before the stick / D-pad code, padFrame after)
  ps(pad) { let ps = this.padSt.get(pad.index); if (!ps) this.padSt.set(pad.index, ps = { ring: false, cancel: false, sel: 0 }); return ps; }
  /** 0 = normal, 1 = card ring open (right stick + D-pad ◀ ▶ + ○ belong to the cards), 2 = the base card panel has this pad */
  padMode(pad, s, me) {
    const v = me && this.viewFor(me); if (!v || !v.on || !me.alive) { const ps = this.padSt.get(pad.index); if (ps) ps.ring = false; return 0; }
    if (this.panelOpen && this.panelPad === pad.index) return 2;
    const ps = this.padSt.get(pad.index);
    if (ps && ps.ring) return 1;
    if (s.pressed(BTN.R1) && !v.atBase && s.heldFor(BTN.R1) >= RING_HOLD && !(ps && ps.cancel)) return 1;
    return 0;
  }
  /** true = cards are on for this trainer (R1 no longer sends trainerSkill) */
  cardsOn(me) { const v = me && this.viewFor(me); return !!(v && v.on); }
  padFrame(pad, s, me, o) {
    const v = me && this.viewFor(me); if (!v || !v.on || !me.alive) return;
    const ps = this.ps(pad), l = this.locals.byUnit(me.id);
    if (this.panelOpen && this.panelPad === pad.index) { this.padPanel(s); return; }
    // at base: R1 opens the panel with this pad's focus (an open panel without pad focus — the automatic one — takes it)
    if (v.atBase) {
      if (s.down(BTN.R1)) { if (this.panelOpen && this.panelLocal === l) { this.panelPad = pad.index; this.cur = 0; } else this.openPanel(pad.index, l); }
      ps.ring = false; return;
    }
    const n = Math.max(1, (v.shown || []).length);
    if (ps.sel >= n) ps.sel = n - 1;
    if (s.down(BTN.R1)) ps.cancel = false;
    if (s.pressed(BTN.R1) && !ps.cancel && s.heldFor(BTN.R1) >= RING_HOLD) {   // ○ cancels the ring until R1 is let go
      ps.ring = true;
      const rx = pad.raw[2], ry = pad.raw[3], mag = Math.hypot(rx, ry);
      if (mag > 0.55) { const deg = Math.atan2(-ry, rx) * 180 / Math.PI, a = deg < -90 ? 180 : deg < 0 ? 0 : deg; ps.sel = Math.max(0, Math.min(n - 1, Math.round((180 - a) / 180 * (n - 1)))); }
      if (s.down(BTN.LEFT)) ps.sel = (ps.sel + n - 1) % n;
      if (s.down(BTN.RIGHT)) ps.sel = (ps.sel + 1) % n;
      if (s.down(BTN.CIRCLE)) { ps.cancel = true; ps.ring = false; }
    }
    if (s.up(BTN.R1)) {
      const wasCancel = ps.cancel; ps.ring = false; ps.cancel = false;
      if (!wasCancel) {
        const d = this.def((v.shown || [])[ps.sel]);
        const aim = o && o.aiming && d && (d.target === 'point' || d.target === 'unit') ? { x: o.aim.x, y: o.aim.y } : null;
        this.cast(me, ps.sel, aim, o ? o.lockId : -1);
      }
    }
  }
  padPanel(s) {
    const v = this.panelView(), n = (v && v.hand && v.hand.length) || 10;
    const mv = (d) => { this.cur = Math.max(0, Math.min(n - 1, this.cur + d)); this.info = this.cur; };
    if (s.down(BTN.LEFT)) mv(-1); if (s.down(BTN.RIGHT)) mv(1);
    if (s.down(BTN.UP) && this.cur >= 5) mv(-5); if (s.down(BTN.DOWN) && this.cur + 5 < n) mv(5);
    if (s.down(BTN.CROSS)) { if (this.held >= 0) this.drop(); else this.toggleMark(this.cur); }
    if (s.down(BTN.SQUARE)) { if (this.held >= 0) this.drop(); else this.held = this.cur; }
    if (s.down(BTN.TRIANGLE)) this.redraw();
    if (s.down(BTN.CIRCLE) || s.down(BTN.R1)) { if (this.held >= 0) this.held = -1; else this.closePanel(); }
  }
  drop() { const from = this.held, to = this.cur; this.held = -1; if (from >= 0 && from !== to) this.move(from, to); }

  // ------------------------------------------------------------------ base panel
  panelView() { return this.viewFor(this.unitOf(this.panelLocal)); }
  openPanel(padIndex, l) {
    const v = this.viewFor(this.unitOf(l)); if (!v || !v.on || !v.atBase) return;
    this.panelOpen = true; this.panelPad = padIndex; this.panelLocal = l; this.marks.clear(); this.held = -1; this.cur = 0; this.kbCur = false; this.info = padIndex >= 0 ? 0 : -1;
    if (this.drag) this.endAim();
    setCls(this.panel, 'on', true); this.renderPanel(true);
    this.app.fire('cardpanel', { open: true });
  }
  closePanel() {
    if (!this.panelOpen) return;
    this.panelOpen = false; this.panelPad = -1; this.panelLocal = null; this.marks.clear(); this.held = -1; if (this.pdrag) this.pdragEnd();
    setCls(this.panel, 'on', false); this.app.fire('cardpanel', { open: false });
  }
  toggleMark(i) { if (this.marks.has(i)) this.marks.delete(i); else this.marks.add(i); this.info = i; }
  redraw() {
    const v = this.panelView(), me = this.unitOf(this.panelLocal); if (!v || !me || !this.marks.size || !(v.mulligans > 0)) { this.shakeGo(); return; }
    const idx = [...this.marks].sort((a, b) => a - b);
    if (this.cmd(me, { type: 'mulligan', idx })) { this.marks.clear(); for (const i of idx) { const c = this.pTiles[i]; if (c) { restart(c.el, 'refill'); c.id = undefined; } } }
    else this.shakeGo();
  }
  shakeGo() { restart(this.goBtn, 'shake'); }
  move(from, to) {
    const me = this.unitOf(this.panelLocal); if (!me) return false;
    const ok = this.cmd(me, { type: 'cardMove', from, to });
    if (ok) {
      const m = new Set(); for (const i of this.marks) { let j = i; if (i === from) j = to; else if (from < to && i > from && i <= to) j = i - 1; else if (from > to && i >= to && i < from) j = i + 1; m.add(j); }
      this.marks = m; this.info = to;
    }
    return ok;
  }
  renderPanel(force) {
    const v = this.panelView(); if (!v) return;
    this.panelLayout();
    const hand = v.hand || [], pad = this.panelPad >= 0, cursor = pad || this.kbCur, mode = this.app.mtInputMode;
    setTxt(this.pTitle, t('cardui.panel.title'));
    const id = this.info >= 0 ? hand[this.info] : null, d = this.def(id);
    setHTML(this.pSub, d ? `<span class="gem">${d.cost}</span><b>${esc(tOr(d.nameKey, id))}</b><span>${esc(tOr(d.descKey, ''))}</span>` : esc(t('cardui.panel.sub')));
    setTxt(this.laneTop, t('cardui.panel.top')); setTxt(this.laneNext, t('cardui.panel.next'));
    for (let i = 0; i < 10; i++) {
      const c = this.pTiles[i], cid = hand[i] || null;
      if (force) c.id = undefined;
      this.face(c, cid, true);
      setCls(c.el, 'mark', this.marks.has(i)); setCls(c.el, 'cur', cursor && i === this.cur && this.held < 0); setCls(c.el, 'held', cursor && i === this.held);
      setCls(c.el, 'ghost', !!(this.pdrag && this.pdrag.from === i && this.pdrag.moved));
      setCls(c.el, 'over', !!(this.pdrag && this.pdrag.moved && this.pdrag.over === i && i !== this.pdrag.from) || (cursor && this.held >= 0 && i === this.cur && i !== this.held));
    }
    const n = v.mulligans || 0, can = n > 0 && this.marks.size > 0;
    setTxt(this.goT, t('cardui.redraw', { n })); setCls(this.goBtn, 'off', !can);
    setTxt(this.okT, t('cardui.ok'));
    const g = (x) => `<span class="g">${x}</span>`;
    const ht = pad ? t('cardui.panel.pad', { x: g('✕'), s: g('□'), t: g('△'), o: g('○') }) : mode === 'kbm' ? t('cardui.panel.kbm') : mode === 'pad' ? t('cardui.panel.padFocus', { g: g('R1') }) : t('cardui.panel.touch');
    setHTML(this.pHint, ht);
  }
  // panel pointer: tap = mark, drag = reorder
  pDown(i, e) {
    e.preventDefault(); e.stopPropagation(); this.noteTouch(e);
    if (this.pdrag) return;
    this.pdrag = { pid: e.pointerId, from: i, x0: e.clientX, y0: e.clientY, moved: false, over: i, ghost: null };
    this.info = i;
    try { this.pTiles[i].el.setPointerCapture(e.pointerId); } catch { /* */ }
  }
  pMove(i, e) {
    const g = this.pdrag; if (!g || g.pid !== e.pointerId) return;
    e.preventDefault();
    if (!g.moved && Math.hypot(e.clientX - g.x0, e.clientY - g.y0) > REORDER_PX) {
      g.moved = true;
      const src = this.pTiles[g.from].el, r = src.getBoundingClientRect(), f = src.cloneNode(true);
      const cv = f.querySelector('canvas'); if (cv) cv.getContext('2d').drawImage(this.pTiles[g.from].ic, 0, 0);
      f.classList.remove('mark', 'cur', 'held', 'over'); f.classList.add('drag'); f.style.width = r.width + 'px'; f.style.height = r.height + 'px';
      f.style.setProperty('--cw', r.width + 'px'); f.style.setProperty('--ch', r.height + 'px');
      this.panel.appendChild(f); g.ghost = f; g.dx = e.clientX - r.left; g.dy = e.clientY - r.top;
    }
    if (!g.moved) return;
    g.ghost.style.left = (e.clientX - g.dx) + 'px'; g.ghost.style.top = (e.clientY - g.dy) + 'px';
    g.over = this.tileAt(e.clientX, e.clientY, g.from);
  }
  tileAt(x, y, dflt) {
    let best = dflt, bd = 1e9;
    this.pTiles.forEach((c, j) => { const r = c.el.getBoundingClientRect(); const d = Math.hypot(r.left + r.width / 2 - x, r.top + r.height / 2 - y); if (d < bd && d < r.width * 1.2) { bd = d; best = j; } });
    return best;
  }
  pUp(i, e, cancelled) {
    const g = this.pdrag; if (!g || g.pid !== e.pointerId) return;
    this.pdragEnd();
    if (cancelled) return;
    if (!g.moved) { this.toggleMark(g.from); return; }
    const n = ((this.panelView() || {}).hand || []).length;
    if (g.over !== g.from && g.over >= 0 && g.over < n) this.move(g.from, g.over);
  }
  pdragEnd() { const g = this.pdrag; this.pdrag = null; if (g && g.ghost) g.ghost.remove(); }

  dispose() {
    if (this.bar) this.bar.remove(); if (this.panel) this.panel.remove();
    removeEventListener('keydown', this.onKey, true); removeEventListener('pointermove', this.onMove, true);
  }
}
