// mt/ui/tr.js — HUD-side bridge to the localization module (game/mt/i18n, owned by the i18n agent). Owner: HUD.
// tr(key, fallbackEnglish, vars) returns the localized string when the i18n module is available, else the English
// fallback with {name} placeholders filled. The module is looked up at call time on `globalThis.__mtI18n`
// ({t, getLang, onLangChange}) so the HUD neither breaks nor logs 404s before game/mt/i18n exists.
// i18n agent: you may replace the lookup below with a static `import { t, getLang, onLangChange } from '../i18n/index.js'`.
// onLang(fn) re-runs fn when the language changes (cheap re-renders only).

const listeners = new Set();
let hooked = null;
const mod = () => {
  const m = globalThis.__mtI18n || null;
  if (m && hooked !== m && m.onLangChange) { hooked = m; m.onLangChange(() => { for (const f of listeners) { try { f(); } catch (e) { console.error('[mt-ui tr]', e); } } }); }
  return m;
};
const fill = (s, vars) => (vars ? String(s).replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m)) : String(s));

export function tr(key, fallback, vars) {
  const m = mod();
  if (m && m.t) { try { const v = m.t(key, vars); if (v != null && v !== key) return fill(v, vars); } catch { /* fall back */ } }
  return fill(fallback != null ? fallback : key, vars);
}
export function lang() { const m = mod(); try { return m && m.getLang ? m.getLang() : 'en'; } catch { return 'en'; } }
export function onLang(fn) { mod(); listeners.add(fn); return () => listeners.delete(fn); }
