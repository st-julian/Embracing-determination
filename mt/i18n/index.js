// mt/i18n/index.js — localization core (Japanese + English). Owner: localization. Docs: docs/I18N.md.
//
//   t(key, params)        localized string for the current language ({name} placeholders filled from params).
//                         Missing in the current language -> English -> the key itself (so callers can detect it).
//   getLang() / setLang(lang, {persist}) / onLangChange(fn) -> unsubscribe
//   LANGS = ['ja', 'en'], DEFAULT_LANG = 'ja'
//   name helpers: formName(id), abilityName(id), abilityDesc(id), typeName(t), stageName(n), specName(id),
//                 specShort(id), skillName(spec), minionName(kind), bossName(), trainerName(englishName), unitName(u)
//
// Language resolution (browser): URL `?lang=en|ja` (not persisted) > localStorage 'sv.lang' > 'ja'.
// In node (tests, tools) there is no window: the language is 'en' so DESIGN/data contracts compare English names.
// A change fires: every onLangChange listener, `app.fire('lang', lang)` on window.__moba, a window 'mt-lang'
// CustomEvent, and updates <html lang> + html.lang-ja / html.lang-en classes.
// Pure module: no DOM access at import time. In a browser it lazily installs ./dom.js (fonts, legacy-screen
// localizer, title-screen language picker) — that part never runs in node.

import EN from './strings/en.js';
import JA from './strings/ja.js';

export const LANGS = ['ja', 'en'];
export const DEFAULT_LANG = 'ja';
export const LANG_LABEL = { ja: '日本語', en: 'English' };
export const STORE_KEY = 'sv.lang';
const TABLES = { en: EN, ja: JA };
const listeners = new Set();
const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
let cur = null;

function urlLang() {
  try { const q = new URLSearchParams(globalThis.location.search).get('lang'); return q && TABLES[q] ? q : null; } catch { return null; }
}
function storedLang() {
  try { const s = globalThis.localStorage.getItem(STORE_KEY); return s && TABLES[s] ? s : null; } catch { return null; }
}
function detect() {
  if (!isBrowser) return 'en';
  return urlLang() || storedLang() || DEFAULT_LANG;
}

export function getLang() { if (!cur) { cur = detect(); markDocument(cur); } return cur; }
export function isJa() { return getLang() === 'ja'; }

/** Switch language. persist=false keeps the stored choice (e.g. for screenshots). Returns the active language. */
export function setLang(lang, { persist = true } = {}) {
  if (!TABLES[lang]) return getLang();
  if (persist) { try { globalThis.localStorage.setItem(STORE_KEY, lang); } catch { /* private mode / blocked storage */ } }
  if (lang === getLang()) return lang;
  cur = lang; markDocument(lang);
  for (const fn of [...listeners]) { try { fn(lang); } catch (e) { console.error('[i18n] listener', e); } }
  if (isBrowser) {
    try { const app = globalThis.__moba; if (app && app.fire) app.fire('lang', lang); } catch (e) { console.error('[i18n] app lang event', e); }
    try { window.dispatchEvent(new CustomEvent('mt-lang', { detail: { lang } })); } catch { /* old browsers */ }
  }
  return lang;
}
/** Cycle to the next language (lobby / title / pause pickers). */
export function nextLang(d = 1) { const i = LANGS.indexOf(getLang()); return setLang(LANGS[(i + d + LANGS.length) % LANGS.length]); }
export function onLangChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

function markDocument(lang) {
  if (!isBrowser) return;
  try {
    const de = document.documentElement; de.lang = lang;
    de.classList.toggle('lang-ja', lang === 'ja'); de.classList.toggle('lang-en', lang === 'en');
  } catch { /* no DOM yet */ }
}

const fill = (s, p) => (p ? String(s).replace(/\{(\w+)\}/g, (m, k) => (p[k] != null ? p[k] : m)) : String(s));

/** Localized string. Values may be functions (params) => string for grammar that placeholders can't express. */
export function t(key, params) {
  const tab = TABLES[getLang()];
  let v = tab[key];
  if (v == null) v = EN[key];
  if (v == null) return key;
  if (typeof v === 'function') { try { v = v(params || {}); } catch (e) { console.error('[i18n] ' + key, e); return key; } }
  return fill(v, params);
}
/** true when the key exists in the current language (or English). */
export function has(key) { return TABLES[getLang()][key] != null || EN[key] != null; }
/** Localized string or `fallback` when the key is unknown (for data with open-ended ids). */
export function tOr(key, fallback, params) { const v = t(key, params); return v === key ? fill(fallback, params) : v; }

// ------------------------------------------------------------------------------------------ display names
export const formName = (id) => tOr('form.' + id, id);
export const abilityName = (id) => tOr('ability.' + id, id);
export const abilityDesc = (id) => tOr('ability.' + id + '.desc', '');
export const typeName = (ty) => tOr('type.' + ty, ty);
export const stageName = (n) => tOr('stage.' + n, String(n));
export const specName = (id) => tOr('spec.' + id, id);
export const specShort = (id) => tOr('spec.' + id + '.short', id);
export const skillName = (spec) => tOr('skill.' + spec, spec);
export const minionName = (kind) => tOr('minion.' + kind, kind);
export const bossName = () => t('boss.name');
/** Trainer names are stored in English in the sim (stable for logs/QA); this maps known ones for display. */
export function trainerName(name) {
  if (!name) return name;
  const m = /^Player (\d+)$/.exec(name);
  if (m) return t('name.player', { n: m[1] });
  return tOr('name.' + name, name);
}
/** Best display name for any unit (trainer, monster, minion, boss). */
export function unitName(u) {
  if (!u) return '';
  if (u.mtMon && u.mtMon.form) return formName(u.mtMon.form);
  if (u.mtTrainer) return trainerName(u.name);
  if (u.epic) return bossName();
  if (u.kind === 'minion' && u.subtype) return tOr('minion.' + u.subtype, u.name || u.subtype);
  return u.name || '';
}

/** Defines a localized `name` (and optional `desc`) getter on a data record whose English stays in en.js. */
export function localizeRecord(rec, nameKey, descKey) {
  if (!rec || typeof rec !== 'object') return rec;
  Object.defineProperty(rec, 'name', { get: () => t(nameKey), enumerable: true, configurable: true });
  if (descKey) Object.defineProperty(rec, 'desc', { get: () => t(descKey), enumerable: true, configurable: true });
  return rec;
}

export const I18N = { t, tOr, has, getLang, setLang, nextLang, onLangChange, isJa, LANGS, LANG_LABEL, DEFAULT_LANG, formName, abilityName, abilityDesc, typeName, stageName, specName, specShort, skillName, minionName, bossName, trainerName, unitName };

if (isBrowser) {
  // bridge for modules that avoid a static import (mt/ui/tr.js looks this up at call time)
  globalThis.__mtI18n = I18N;
  getLang();
  import('./dom.js').then((m) => m.install(I18N)).catch((e) => console.error('[i18n] dom', e));
}
