// mt/i18n/dom.js — browser side of the localization layer (installed by mt/i18n/index.js; never runs in node).
// Owner: localization. Docs: docs/I18N.md.
//
//  1. Japanese pixel font. fonts/vale-jp.woff2 (Unifont-JP subset, 16 px grid, tools/i18n-subset.sh) is registered
//     a) as extra faces of the HUD families 'Vale Pixel' / 'Vale Pixel Bold' restricted to the Japanese
//        unicode-range, so every pixel-font string (DOM and canvas) mixes Latin Vale glyphs and Japanese glyphs per
//        character with no change to the HUD's CSS; their size-adjust is chosen from the HUD's integer device-px
//        scale k (app.mtHud.k) so a 10 HUD-px string draws Japanese at exactly 16·m device px, m = ⌈7k/16⌉ = the
//        smallest whole multiple of the 16 px grid whose glyph is at least as tall as the Latin cap height (7 HUD px):
//        1 px at 540p/720p (k=2), 2 at 1080p (k=3) and 1440p (k=4), 3 at 4K — one Unifont pixel = m whole device pixels;
//     b) as its own family 'Vale JP' at native size for non-HUD screens (title, loading, lobby), sized through the
//        CSS variables below so text lands on 16·m device px there too.
//  2. CSS variables on :root (recomputed on resize): --vjp-s/m/l = 16/32/48-ish device px expressed in legacy-stage
//     design px (the legacy screens are scaled by transform:scale(n)), --vjp-cs/cm/cl = the same in plain CSS px.
//  3. Legacy screens (title/menu and loading, hud-*.js `Lr`): a MutationObserver localizes their text after each
//     build and on every language change (no legacy edits needed); the title gets a language picker
//     (click, L / ← → keys; pads: D-pad ← → handled by mt/ui/lobby.js).

import { GLYPHS } from './fonts/vale-jp-glyphs.js';

const FONT_URL = new URL('./fonts/vale-jp.woff2', import.meta.url).href;
const FONT_BOLD_URL = new URL('./fonts/vale-jp-bold.woff2', import.meta.url).href;
/** Characters the HUD's Latin pixel font lacks and Vale JP provides (Vale keeps …—–·×←→♥★✓▲▼◀▶). */
export const JA_RANGE = 'U+2015-201F, U+2025, U+203B, U+25A1, U+25B3, U+25CB, U+2715, U+266A, U+3000-30FF, U+3400-4DBF, U+4E00-9FFF, U+F900-FAFF, U+FF00-FFEF';
export const JA_FAMILY = 'Vale JP';
export const JA_FAMILY_BOLD = 'Vale JP Bold';

let I = null;            // the i18n API (index.js I18N)
let buf = null;          // font bytes (regular)
let bufB = null;         // pixel-bold variant (same glyph set, 1-px gap-preserving bold)
let hudFaces = [];
let hudAdj = 0;
let nativeFace = null;
let app = null;
export const state = { k: 0, m: 1, adj: 0, fontOk: false, error: null };

/** HUD scale k (whole device px per HUD px) — same rule as mt/ui/hud.js layout() when the HUD is not up yet. */
function hudK() {
  const h = app && app.mtHud;
  if (h && h.k > 0) return h.k;
  const dpr = window.devicePixelRatio || 1, W = innerWidth, H = innerHeight;
  const uCss = Math.max(1, Math.min(Math.floor(Math.min(W / 480, H / 270)), Math.round(Math.min(W / 600, H / 337.5))));
  return Math.max(1, Math.floor(uCss * dpr + 1e-6));
}
/** m = device px per Unifont pixel for 10 HUD-px text; adj = size-adjust making the 16 px em exactly 16·m device px. */
let mOverride = 0;
try { mOverride = Math.max(0, Math.min(6, parseInt(new URLSearchParams(location.search).get('jascale'), 10) || 0)); } catch { /* no URL */ }
/** m = ⌈7k/16⌉: Japanese em (16·m device px) ≥ Latin cap height (7 HUD px = 7k device px). ?jascale=n overrides. */
export function jaScale(k) { const m = mOverride || Math.max(1, Math.ceil((7 * k) / 16 - 1e-9)); return { m, adj: (16 * m) / (10 * k) }; }

function applyHudFaces() {
  if (!buf) return;
  const k = hudK(); const { m, adj } = jaScale(k);
  state.k = k; state.m = m; state.adj = adj;
  if (Math.abs(adj - hudAdj) < 1e-9 && hudFaces.length) return;
  hudAdj = adj;
  for (const f of hudFaces) document.fonts.delete(f);
  hudFaces = [['Vale Pixel', buf], ['Vale Pixel Bold', bufB || buf]].map(([fam, b]) => new FontFace(fam, b, { unicodeRange: JA_RANGE, sizeAdjust: (adj * 100).toFixed(5) + '%', display: 'block' }));
  for (const f of hudFaces) { document.fonts.add(f); f.load().catch((e) => { state.error = String(e); console.error('[i18n] font face', e); }); }
  // canvas label caches (overhead plates) were baked with the old scale
  try { const p = app && app.mtHud && app.mtHud.plates; if (p && p.names) p.names.clear(); } catch { /* HUD internals changed */ }
}

async function loadFont() {
  try {
    const get = async (u) => { const r = await fetch(u); if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + u); return r.arrayBuffer(); };
    [buf, bufB] = await Promise.all([get(FONT_URL), get(FONT_BOLD_URL).catch(() => null)]);
    nativeFace = new FontFace(JA_FAMILY, buf, { display: 'block' });
    document.fonts.add(nativeFace);
    if (bufB) document.fonts.add(new FontFace(JA_FAMILY_BOLD, bufB, { display: 'block' }));
    await nativeFace.load();
    applyHudFaces();
    state.fontOk = true;
    document.documentElement.classList.add('mt-jafont');
  } catch (e) {
    state.error = String(e && e.message || e);
    console.error('[i18n] ' + (I ? I.t('err.font') : 'font') + ':', e);
  }
}

// ------------------------------------------------------------------------------------------------ CSS
const CSS = `
html.lang-ja .mt-jt{word-break:keep-all;overflow-wrap:break-word;line-break:strict;font-family:'${JA_FAMILY}',var(--font-ui,system-ui),sans-serif!important;font-weight:400!important;font-style:normal!important;letter-spacing:0!important;text-transform:none!important;font-synthesis:none;-webkit-font-smoothing:none;font-kerning:none}
html.lang-ja .mt-jt.s{font-size:var(--vjp-s)!important;line-height:calc(var(--vjp-s) * 1.25)!important}
html.lang-ja .mt-jt.m{font-size:var(--vjp-m)!important;line-height:calc(var(--vjp-m) * 1.25)!important}
html.lang-ja .mt-jt.l{font-size:var(--vjp-l)!important;line-height:calc(var(--vjp-l) * 1.2)!important;font-family:'${JA_FAMILY_BOLD}','${JA_FAMILY}',var(--font-ui,system-ui),sans-serif!important}
/* HUD overflow fixes for Japanese (wider glyphs; 32 px tall at 1080p): roomier scoreboard, bench status line */
html.lang-ja #mt-hud .sb{width:384px}
html.lang-ja #mt-hud .bench .regen{height:10px;line-height:10px;margin-top:1px}
/* HUD: Japanese wraps only at the phrase spaces (Gen-5 style), never inside a word */
html.lang-ja #mt-hud{word-break:keep-all;line-break:strict}
/* HUD: the ability lock overlay label is CSS content in hud.css ('EVO') */
html.lang-ja #mt-hud .ab.lock::after{content:'\\9032\\5316'}
html.lang-ja .mn-kicker.mt-jt{gap:calc(var(--vjp-m) * .7);padding-left:0}
html.lang-ja .mn-tag.mt-jt{margin-top:calc(var(--vjp-s) * 1.2)}
html.lang-ja .ld-meta .mt-jt,html.lang-ja .ld-player.mt-jt,html.lang-ja .ld-champ.mt-jt{white-space:nowrap}
html.lang-ja .mn-live.mt-jt,html.lang-ja .mn-mode.mt-jt{letter-spacing:0!important}
#mt-langpick{display:flex;align-items:center;gap:calc(var(--vjp-s) * .75);pointer-events:auto}
#mt-langpick .lp-lab{font:600 16px/1 var(--font-ui,system-ui);letter-spacing:.12em;text-transform:uppercase;color:#8f9dad;text-shadow:0 2px 4px #000}
#mt-langpick .lp-opt{pointer-events:auto;cursor:pointer;border:2px solid rgba(214,176,106,.55);background:rgba(6,11,19,.72);color:#dfe7ef;border-radius:999px;padding:calc(var(--vjp-s) * .3) calc(var(--vjp-s) * 1.2);font:600 calc(var(--vjp-s) * .9)/1.25 var(--font-ui,system-ui);letter-spacing:.06em;transition:background .15s,border-color .15s}
#mt-langpick .lp-opt.ja{font-family:'${JA_FAMILY}',var(--font-ui,system-ui);font-weight:400;letter-spacing:0;font-synthesis:none;font-size:var(--vjp-s);line-height:1.25;padding:calc(var(--vjp-s) * .3) calc(var(--vjp-s) * 1.2)}
#mt-langpick .lp-opt:hover{border-color:#ffd77a}
#mt-langpick .lp-opt.on{background:linear-gradient(#ffe08a,#e9b544);color:#1b2350;border-color:#fff3c4;box-shadow:0 0 18px rgba(255,215,122,.45)}
#mt-langpick .lp-key{font:500 16px/1 var(--font-ui,system-ui);color:#8f9dad;text-shadow:0 2px 4px #000}
html.lang-ja #mt-langpick .lp-lab,html.lang-ja #mt-langpick .lp-key{font-family:'${JA_FAMILY}',var(--font-ui,system-ui);font-weight:400;letter-spacing:0;text-transform:none;font-size:var(--vjp-s);line-height:1.25;font-synthesis:none}
`;

function setVars() {
  const dpr = window.devicePixelRatio || 1;
  const Hd = innerHeight * dpr;
  const stage = document.querySelector('.sv-stage');
  let n = stage ? parseFloat(stage.style.getPropertyValue('--s')) : NaN;
  if (!(n > 0)) { n = Math.min(innerWidth / 1920, innerHeight / 1080); if (n < 0.5) n = Math.min(0.5, innerHeight / 700, innerWidth / 1200); }
  const sD = 16, mD = 16 * Math.max(1, Math.round((Hd / 1080) * 1.5)), lD = 16 * Math.max(2, Math.round((Hd / 1080) * 2.5));
  const r = document.documentElement.style, px = (d, s) => (d / s).toFixed(4) + 'px';
  const set = (k, v) => { if (r.getPropertyValue(k) !== v) r.setProperty(k, v); };
  set('--vjp-s', px(sD, n * dpr)); set('--vjp-m', px(mD, n * dpr)); set('--vjp-l', px(lD, n * dpr));
  set('--vjp-cs', px(sD, dpr)); set('--vjp-cm', px(mD, dpr)); set('--vjp-cl', px(lD, dpr)); set('--vjp-c2', px(32, dpr));
}

// ------------------------------------------------------------------------------------------------ legacy screens
// [selector, key, size] ; size s/m/l = Japanese pixel size class
const MENU = [
  ['.mn-live > span:not(.mn-live-time)', 'title.live', 's'],
  ['.mn-factions .f-blue', 'title.blue', 's'], ['.mn-factions .f-vs', 'title.vs', 's'], ['.mn-factions .f-red', 'title.red', 's'],
  ['.mn-kicker', 'title.kicker', 'm'], ['.mn-tag', 'title.tag', 'm'],
  ['.mn-modelab', 'title.mode', 's'], ['.mn-modeval', 'title.modeVal', 's'],
  ['.mn-play > span', 'title.play', 'l'],
  ['[data-kbd-hint]', 'title.hint', 's'], ['[data-touch-hint]', 'title.touchHint', 's'],
];
const LOADING = [
  ['.ld-mode', 'loading.mode', 's'], ['.ld-map > span:not(.cs-orn)', 'loading.map', 'm'], ['.ld-tip > b', 'loading.tip', 's'],
];
const N_TIPS = 8;
const LEGACY_ROLE = { 'Baron Lane': 'baron', Jungle: 'jungle', 'Mid Lane': 'mid', 'Duo Lane': 'duo', Support: 'support' };

function mark(el, size) {
  if (!el.classList.contains('mt-jt')) el.classList.add('mt-jt', size);
}
function setTxt(el, s) { if (el.textContent !== s) el.textContent = s; }

function localizeMenu(root) {
  for (const [sel, key, size] of MENU) for (const el of root.querySelectorAll(sel)) { setTxt(el, I.t(key)); mark(el, size); }
  const plain = [...root.querySelectorAll('.mn-mode > span:not([class])')];
  if (plain[0]) { setTxt(plain[0], I.t('title.size')); mark(plain[0], 's'); }
  if (plain[1]) { setTxt(plain[1], I.t('title.classic')); mark(plain[1], 's'); }
  const bottom = root.querySelector('.mn-bottom');
  if (bottom) {
    let lp = bottom.querySelector('#mt-langpick');
    if (!lp) { lp = picker(); const play = bottom.querySelector('.mn-play'); if (play && play.nextSibling) bottom.insertBefore(lp, play.nextSibling); else bottom.appendChild(lp); }
    syncPicker(lp);
  }
}
function localizeLoading(root) {
  for (const [sel, key, size] of LOADING) for (const el of root.querySelectorAll(sel)) { setTxt(el, I.t(key)); mark(el, size); }
  const tip = root.querySelector('.ld-tip');
  if (tip) {
    if (tip.dataset.tipN == null) tip.dataset.tipN = String(Math.floor(Date.now() / 60000) % N_TIPS);
    const last = tip.lastChild;
    const txt = I.t('tip.' + tip.dataset.tipN);
    if (last && last.nodeType === 3) { if (last.nodeValue !== txt) last.nodeValue = txt; } else tip.appendChild(document.createTextNode(txt));
    mark(tip, 's');
  }
  for (const el of root.querySelectorAll('.ld-meta > span:first-child')) { // legacy lane label (ue[role])
    if (el.dataset.src == null) el.dataset.src = el.textContent;
    const id = LEGACY_ROLE[el.dataset.src]; setTxt(el, id ? I.t('loading.role.' + id) : el.dataset.src); mark(el, 's');
  }
  for (const el of root.querySelectorAll('.ld-champ')) { if (el.dataset.src == null) el.dataset.src = el.textContent; setTxt(el, el.dataset.src === 'Trainer' ? I.t('loading.trainer') : el.dataset.src); mark(el, 'm'); }
  for (const el of root.querySelectorAll('.ld-player')) { if (el.dataset.src == null) el.dataset.src = el.textContent; setTxt(el, I.trainerName(el.dataset.src)); mark(el, 's'); }
}
function localizeScreens() {
  const scr = document.querySelector('#hud-root .sv-screens');
  if (!scr) return;
  for (const s of scr.children) {
    if (s.classList.contains('sv-menu')) localizeMenu(s);
    else if (s.classList.contains('sv-loading')) localizeLoading(s);
  }
}

// ------------------------------------------------------------------------------------------------ title picker
function picker() {
  const el = document.createElement('div'); el.id = 'mt-langpick';
  const lab = document.createElement('span'); lab.className = 'lp-lab'; el.appendChild(lab);
  for (const L of I.LANGS) {
    const b = document.createElement('span'); b.className = 'lp-opt ' + L; b.dataset.lang = L; b.setAttribute('role', 'button'); b.setAttribute('data-play', '');
    b.textContent = I.LANG_LABEL[L];
    b.addEventListener('pointerdown', (e) => { e.stopPropagation(); e.preventDefault(); I.setLang(L); });
    el.appendChild(b);
  }
  const key = document.createElement('span'); key.className = 'lp-key'; el.appendChild(key);
  return el;
}
function syncPicker(lp) {
  lp.querySelector('.lp-lab').textContent = I.t('lang.label');
  lp.querySelector('.lp-key').textContent = I.t('lang.hint');
  for (const b of lp.querySelectorAll('.lp-opt')) b.classList.toggle('on', b.dataset.lang === I.getLang());
}

function onKey(e) {
  if (!app || app.state !== 'menu' || e.repeat) return;
  if (app.ui && app.ui.panel && app.ui.panel !== 'none') return;
  const t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
  if (e.code === 'KeyL' || e.code === 'ArrowLeft' || e.code === 'ArrowRight') { e.preventDefault(); I.nextLang(e.code === 'ArrowLeft' ? -1 : 1); }
}

function onLang() {
  try { document.title = I.t('title.doc'); } catch { /* ignore */ }
  localizeScreens();
}

export function install(api) {
  if (I) return; I = api;
  const st = document.createElement('style'); st.id = 'mt-i18n-css'; st.textContent = CSS; document.head.appendChild(st);
  setVars();
  loadFont();
  addEventListener('resize', () => { setVars(); setTimeout(applyHudFaces, 0); });
  // the HUD may change k without a resize (devicePixelRatio / ?hudscale); cheap periodic check
  setInterval(() => { if (buf && hudK() !== state.k) applyHudFaces(); }, 1000);
  I.onLangChange(onLang);
  addEventListener('keydown', onKey, true);
  // legacy screens are (re)built as children of #hud-root .sv-screens: watch that list only (not the per-frame HUD)
  const hook = () => {
    app = globalThis.__moba || null;
    const scr = document.querySelector('#hud-root .sv-screens');
    if (!app || !scr) { setTimeout(hook, 250); return; }
    new MutationObserver(() => { setVars(); localizeScreens(); }).observe(scr, { childList: true });
    if (app.on) app.on('state', () => setTimeout(() => { setVars(); localizeScreens(); }, 0));
    // app.fire('toast', {text, kind?}) (e.g. the F1 WASD toggle in input/keyboard.js) had no listener: show it in the HUD
    if (app.on) app.on('toast', (p) => {
      const hud = app.mtHud, txt = typeof p === 'string' ? p : p && p.text;
      if (!hud || !hud.toast || !txt) return;
      const esc = String(txt).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
      try { hud.toast(esc, (p && p.kind) || ''); } catch (e) { console.error('[i18n] toast', e); }
    });
    applyHudFaces(); setVars(); onLang();
  };
  hook();
  globalThis.__mtI18nDom = { state, jaScale, glyphs: GLYPHS, localizeScreens, applyHudFaces };
}
