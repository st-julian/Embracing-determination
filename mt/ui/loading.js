// mt/ui/loading.js — pixel-art LOADING screen (state 'loading', between the starter pick / lobby and the match). Owner: HUD.
//
// Replaces the legacy loading screen (six realistic 3D "crossbow" champion splashes): both teams as pixel cards —
// trainer bust + their starter monster, names, level and type — a VS emblem, a tip line and a progress bar, in the
// HUD's own pixel style and HUD-pixel grid (it lives inside #mt-hud, so it gets the same zoom, tokens and fonts).
// The legacy screen still runs underneath (it decides when the match starts: >= LOAD_MIN s, art / shader prewarm) but
// is invisible, and with this screen on, the legacy HUD bakes none of its art (warm-up splash / hero renders / vale
// background / spell icons / loading portraits: [MT-HOOK] mtLoading in hud-*.js). `?legacyloading=1` brings it back.

import { h, setCls, pxCanvas, blit, tint } from './dom.js';
import * as art from './art.js';
import { tr } from './tr.js';
import { FORMS } from '../data/species.js';
import { TYPE_COLORS } from '../data/types.js';
import { LOAD_MIN } from '../render/loadtime.js';
import { typeChip } from './cards.js';

/** true unless ?legacyloading=1 (or the global legacy switch ?legacymeshes=1) — same rule as the hud-*.js hooks */
export const MT_LOADING = (() => { try { const q = new URLSearchParams(location.search); return q.get('legacyloading') !== '1' && q.get('legacymeshes') !== '1'; } catch { return true; } })();
const TIPS = 7;   // tip.0 … tip.6 (tip.7 is about the lobby)
let STAR_TILE = null;
/** 48×40 pixel tile of sparse 1-px stars (repeated as the background; HUD zoom keeps them whole pixels) */
function starTile() {
  if (STAR_TILE) return STAR_TILE;
  const c = document.createElement('canvas'); c.width = 48; c.height = 40; const g = c.getContext('2d');
  for (const [x, y, a] of [[3, 4, 0.55], [29, 9, 0.35], [17, 22, 0.45], [41, 27, 0.6], [8, 33, 0.3], [35, 37, 0.25]]) { g.fillStyle = `rgba(230,236,255,${a})`; g.fillRect(x, y, 1, 1); }
  g.fillStyle = 'rgba(255,240,180,.5)'; g.fillRect(22, 13, 1, 1);
  STAR_TILE = c.toDataURL(); return STAR_TILE;
}

export class LoadingScreen {
  constructor(hud) {
    this.hud = hud; this.app = hud.app; this.enabled = MT_LOADING;
    this.el = h('div.mt-load', { hidden: true });
    this.world = null; this.t = 0; this.shown = false;
  }
  build(w, f) {
    this.world = w; this.t = 0; this.el.innerHTML = '';
    const view = f.viewerTeam === 1 ? 1 : 0, L = this.hud.localMap();
    const trainers = (team) => (w.champions || []).filter((c) => c.team === team && c.mtTrainer).sort((a, b) => a.id - b.id);
    const R = w.mt && w.mt.rules;
    const mode = R && R.difficulty ? tr('opt.difficulty.' + R.difficulty, R.difficulty) + '・' + tr('opt.mode.' + R.mode, R.mode) : '';
    const head = h('div.lh', null, h('div.lt', null, h('span', { text: tr('pause.game', 'Sundered Vale') })), mode ? h('div.lm', { text: mode }) : null);
    const row = (team, cls) => h('div.lrow.' + cls, null, ...trainers(team).map((u, i) => this.card(u, L.has(u.id), i, team === view)));
    const vs = h('div.lvs', null, h('i'), h('b', { text: 'VS' }), h('i'));
    this.bar = h('i'); this.pct = h('span.lpct', { text: '0%' });
    const tip = tr('tip.' + Math.floor(Math.random() * TIPS), '');
    const foot = h('div.lf', null, tip ? h('div.ltip', null, h('b', { text: tr('load.tip', 'Tip') }), h('span', { text: tip })) : null,
      h('div.lbar', null, h('span.ltrack', null, this.bar), this.pct));
    const st = h('i.lst'); st.style.backgroundImage = `url(${starTile()})`; const bg = h('div.lbg', null, st);
    this.el.append(bg, head, row(view, 'ally'), vs, row(1 - view, 'enemy'), foot);
  }
  card(u, me, i, ally) {
    const T = u.mtTrainer, rec = T.party[T.activeIdx] || T.party[0] || null, f = rec ? FORMS[rec.form] : null;
    const tb = pxCanvas(32, 32); blit(tb, art.bust(art.trainerSpriteId(T.spec, u.team), 32));
    const trn = h('div.ltr', null, tb);
    const mon = h('div.lmo');
    if (f) {
      const pc = pxCanvas(40, 40); blit(pc, art.portrait(rec.form, 40)); mon.appendChild(pc);
      const tc = TYPE_COLORS[f.types[0]] || '#8aa'; mon.style.setProperty('--tc', tc); mon.style.setProperty('--tc-l', tint(tc, 0.62));
    } else { const oc = pxCanvas(20, 20, 'orb'); blit(oc, art.icon('trainer/capture', 20)); mon.appendChild(oc); mon.classList.add('none'); }   // no partner yet
    const you = tr('load.you', 'You');
    const name = h('div.lnm', null, h('b', { text: u.name || '' }), me && u.name !== you ? h('span.lme', { text: you }) : null);
    const info = f ? h('div.lmi', null, h('span.lmn', { text: f.name }), h('span.llv', { text: 'Lv' + rec.level }), typeChip(f.types[0])) : h('div.lmi');
    const c = h('div.pn.lcard' + (ally ? '.a' : '.e') + (me ? '.me' : ''), null, name, h('div.lbody', null, trn, mon), info);
    c.style.setProperty('--i', String(i + (ally ? 0 : 3)));
    if (me && this.hud.localMap().get(u.id)) c.style.setProperty('--lc', this.hud.localMap().get(u.id).color || '#3fd26a');
    return c;
  }
  /** on: state 'loading' with a world. Progress eases toward 95 % over ~LOAD_MIN s, then 100 % as the match starts. */
  update(f, on) {
    if (!this.enabled) return;
    const dt = Math.min(0.1, f.dt || 0.016);
    if (on) {
      if (this.world !== f.world) this.build(f.world, f);
      if (!this.shown) { this.shown = true; this.el.hidden = false; setCls(this.el, 'out', false); }
      this.t += dt;
      const p = Math.min(0.95, 1 - Math.exp(-this.t / Math.max(0.3, LOAD_MIN * 0.55)));
      this.setP(p);
    } else if (this.shown) {
      this.shown = false; this.setP(1); setCls(this.el, 'out', true);
      const el = this.el; setTimeout(() => { if (!this.shown) el.hidden = true; }, 380);
      this.world = null;
    }
  }
  setP(p) {
    const v = Math.round(p * 100); if (v === this._p) return; this._p = v;
    this.bar.style.transform = `scaleX(${(v / 100).toFixed(2)})`; this.pct.textContent = v + '%';
  }
}
