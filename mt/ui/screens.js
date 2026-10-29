// mt/ui/screens.js — modal screens of the mt HUD: scoreboard (hold Tab / Create) and pause menu (Esc / Options;
// controller navigable). The VICTORY / DEFEAT screen is mt/ui/victory.js. Owner: HUD.

import { h, setText, setCls, setHTML, pxCanvas, blit, fmtTime, tint } from './dom.js';
import * as art from './art.js';
import { glyphHTML } from './glyphs.js';
import { FORMS } from '../data/species.js';
import { TYPE_COLORS } from '../data/types.js';
import { SPECS } from '../data/balance.js';
import { tr } from './tr.js'; // i18n: scoreboard / pause strings (sb.*, pause.*, ctl.* keys)

const SPEC_SHORT = { get attack() { return tr('spec.attack', 'Attack'); }, get healing() { return tr('spec.healing', 'Healing'); }, get magic() { return tr('spec.magic', 'Magic'); } };
const trainersOf = (w, team) => (w.champions || []).filter((c) => c.team === team && c.mtTrainer).sort((a, b) => a.id - b.id);

function whoCell(u) {
  const tb = pxCanvas(16, 16); blit(tb, art.bust(art.trainerSpriteId(u.mtTrainer.spec, u.team), 16));
  const box = h('span.tb', null, tb); box.style.setProperty('--team', u.team === 0 ? '#3b86f2' : '#ef5243'); box.style.setProperty('--team-l', u.team === 0 ? '#cfe2ff' : '#ffd5cf');
  return h('div.who2', null, box, h('b', { text: u.name }), h('span.sp', { text: SPEC_SHORT[u.mtTrainer.spec] || '' }));
}
function partyCell(u) {
  const el = h('div.party');
  for (let i = 0; i < 2; i++) {
    const rec = u.mtTrainer.party[i];
    if (!rec) { el.appendChild(h('span.pm.none')); continue; }
    const c = pxCanvas(16, 16); blit(c, art.portrait(rec.form, 16));
    const pm = h('span.pm' + (rec.fainted ? '.f' : ''), { title: FORMS[rec.form].name }, c, h('b', { text: 'Lv' + rec.level }));
    const tc = TYPE_COLORS[FORMS[rec.form].types[0]]; pm.style.setProperty('--tc', tint(tc, 0.2)); pm.style.setProperty('--tc-l', tint(tc, 0.75));
    el.appendChild(pm);
  }
  return el;
}

export class Scoreboard {
  constructor(hud) {
    this.hud = hud; this.body = h('div'); this.time = h('span.tm2');
    this.ttl = h('span.ttl', { text: tr('sb.title', 'Scoreboard') });
    this.sbx = h('span.sbx', { role: 'button', 'aria-label': tr('common.close', 'Close') }, '\u00d7', h('i.mt-tap'));   // touch: close
    this.panel = h('div.pn.sb', null, h('div.sbh', null, this.ttl, this.time, this.sbx), this.body);
    this.el = h('div.modal.clear', { hidden: true }, this.panel); this.t = 0;
    // touch: the scoreboard opens from the Scores button and closes on any tap
    this.el.addEventListener('pointerdown', (e) => { if (!hud.touch) return; e.stopPropagation(); e.preventDefault(); hud.app.fire('ui', { panel: 'none' }); });
  }
  relang() { setText(this.ttl, tr('sb.title', 'Scoreboard')); this.t = 0; } // i18n
  update(w, f, stats, open) {
    if (this.el.hidden === open) this.el.hidden = !open;
    if (!open) return;
    this.t -= f.dt; if (this.t > 0) return; this.t = 0.25;
    setText(this.time, fmtTime(w.time));
    const locals = this.hud.localMap();
    this.body.innerHTML = '';
    const view = f.viewerTeam === 1 ? 1 : 0;
    for (const team of [view, 1 - view]) {
      const kos = stats.score(w, team), towers = (w.structures || []).filter((s) => s.team === 1 - team && s.kind === 'tower' && !s.alive).length;
      this.body.appendChild(h('div.tband.' + (team === view ? 'blue' : 'red'), null, team === view ? tr('hud.yourTeam', 'Your team') : tr('hud.opponents', 'Opponents'), h('span', { text: tr('sb.band', 'KOs {kos}  ·  Towers {towers}', { kos, towers }) })));
      const cols = [['trainer', 'Trainer'], ['party', 'Party'], ['ko', 'KO'], ['down', 'Down'], ['faint', 'Faint'], ['catch', 'Catch'], ['dmg', 'Dmg']];
      const tb = h('table'); tb.appendChild(h('tr', null, ...cols.map(([k, en]) => h('th', { text: tr('sb.col.' + k, en) }))));
      for (const u of trainersOf(w, team)) {
        const s = stats.of(u.id);
        const name = whoCell(u);
        if (!u.alive) name.appendChild(h('span.sp', { text: ' ' + tr('common.sec', '{n}s', { n: Math.max(0, Math.ceil((u.respawnAt || w.time) - w.time)) }) }));
        tb.appendChild(h('tr' + (locals.has(u.id) ? '.me' : ''), null, h('td.n', null, name), h('td', null, partyCell(u)),
          h('td', { text: (u.kills || 0) + s.monKOs }), h('td', { text: u.deaths || 0 }), h('td', { text: s.faints }), h('td', { text: s.captures }), h('td', { text: Math.round(s.dmg / 100) / 10 + 'k' })));
      }
      this.body.appendChild(tb);
    }
  }
}

// Fullscreen (standard API + the webkit-prefixed one older iPad Safari has). iPhone Safari has neither -> the
// pause-menu button is hidden; request/exit return promises that may reject (not allowed now) -> swallowed.
const fullscreenAvailable = () => !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
const fullscreenElement = () => document.fullscreenElement || document.webkitFullscreenElement || null;
function toggleFullscreen() {
  try {
    const el = document.documentElement;
    const fn = fullscreenElement() ? (document.exitFullscreen || document.webkitExitFullscreen) : (el.requestFullscreen || el.webkitRequestFullscreen);
    if (!fn) return;
    const p = fn.call(fullscreenElement() ? document : el);
    if (p && typeof p.catch === 'function') p.catch(() => {});
  } catch { /* not allowed here */ }
}

export class PauseMenu {
  constructor(hud) {
    this.hud = hud; this.app = hud.app; this.open = false; this.focus = 0; this.prevPad = 0; this.armT = 0;
    const btn = (cls, label, fn, right) => { const b = h('div.mbtn' + cls, { role: 'button', 'data-play': true }, h('span', { text: label }), right ? h('span.r', null, right) : null); b.addEventListener('click', (e) => { e.stopPropagation(); fn(); }); return b; };
    this.volBars = h('span.vol'); for (let i = 0; i < 10; i++) this.volBars.appendChild(h('i'));
    const minus = h('span.gk', { text: '-' }), plus = h('span.gk', { text: '+' });
    minus.style.pointerEvents = plus.style.pointerEvents = 'auto';
    minus.addEventListener('click', (e) => { e.stopPropagation(); this.vol(-0.1); }); plus.addEventListener('click', (e) => { e.stopPropagation(); this.vol(0.1); });
    this.bResume = btn('.primary', tr('pause.resume', 'Resume'), () => this.close(), null);
    this.bVol = btn('.vrow', tr('pause.volume', 'Volume'), () => this.vol(0.1), h('span', null, minus, this.volBars, plus));
    this.bMute = btn('', tr('pause.sound', 'Sound'), () => { const a = this.audio(); if (a && a.setMuted) a.setMuted(!a.muted); this.sync(); }, h('span', { text: tr('common.on', 'On') }));
    this.bFs = btn('', tr('pause.fullscreen', 'Fullscreen'), () => { toggleFullscreen(); setTimeout(() => this.sync(), 150); }, h('span', { text: tr('common.off', 'Off') }));
    this.bFs.hidden = !fullscreenAvailable();   // iPhone Safari: no element fullscreen (QA bug 17) -> no inert button
    this.bLeave = btn('.danger', tr('pause.leave', 'Leave match'), () => this.leave(), null);
    // language (日本語 / English) — needs the i18n module (globalThis.__mtI18n.setLang); hidden without it
    this.bLang = btn('', tr('pause.language', 'Language'), () => this.lang(1), h('span', { text: '' }));
    this.items = [this.bResume, this.bVol, this.bMute, this.bFs, this.bLang, this.bLeave];
    this.keys = h('div.keys');
    this.phT = document.createTextNode(tr('pause.title', 'Paused')); this.phG = h('span', { text: tr('pause.game', 'Sundered Vale') });
    this.panel = h('div.pn.pause', null, h('div.ph', null, this.phT, this.phG),
      h('div.pcols', null, h('div.pb', null, ...this.items), this.keys));
    this.el = h('div.modal', { hidden: true }, this.panel);
    this.el.addEventListener('pointerdown', (e) => { if (e.target === this.el) this.close(); });
    this.keyVer = -1;
  }
  audio() { const r = this.app.registry; return r && r.get ? r.get('audio') : null; }
  /** i18n: cycle the language (✕ / click / D-pad ←→ on the Language row); the HUD's relang() refreshes the labels */
  lang(d) { const m = globalThis.__mtI18n; if (m && m.nextLang) m.nextLang(d); else if (m && m.setLang && m.getLang) m.setLang(m.getLang() === 'ja' ? 'en' : 'ja'); this.sync(); }
  relang() {
    const lab = [[this.bResume, 'pause.resume', 'Resume'], [this.bVol, 'pause.volume', 'Volume'], [this.bMute, 'pause.sound', 'Sound'], [this.bFs, 'pause.fullscreen', 'Fullscreen'], [this.bLang, 'pause.language', 'Language']];
    for (const [b, k, en] of lab) setText(b.firstChild, tr(k, en));
    this.phT.nodeValue = tr('pause.title', 'Paused'); setText(this.phG, tr('pause.game', 'Sundered Vale'));
    this.armLeave(!!this.armed); this.buildKeys(); this.sync();
  }
  vol(d) { const a = this.audio(); if (!a || !a.setVolume) return; const v = Math.max(0, Math.min(1, Math.round(((a.volumes && a.volumes.master != null ? a.volumes.master : 1) + d) * 10) / 10)); a.setVolume('master', v); if (v > 0 && a.muted && a.setMuted) a.setMuted(false); this.sync(); }
  sync() {
    const a = this.audio(), v = a && a.volumes && a.volumes.master != null ? a.volumes.master : 1;
    [...this.volBars.children].forEach((b, i) => setCls(b, 'on', i < Math.round(v * 10) && !(a && a.muted)));
    setText(this.bMute.querySelector('.r span'), a && a.muted ? tr('pause.muted', 'Muted') : tr('common.on', 'On'));
    this.bFs.hidden = !fullscreenAvailable();
    setText(this.bFs.querySelector('.r span'), fullscreenElement() ? tr('common.on', 'On') : tr('common.off', 'Off'));
    const m = globalThis.__mtI18n; this.bLang.hidden = !(m && m.setLang);
    if (m && m.getLang) setText(this.bLang.querySelector('.r span'), m.getLang() === 'ja' ? '\u65e5\u672c\u8a9e' : 'English');
    this.items.forEach((b, i) => setCls(b, 'focus', i === this.focus));
  }
  buildKeys(pad) {
    const rows = [[tr('ctl.attack', 'Monster attack'), 'attack'], [tr('ctl.moves', 'Move 1 / Move 2'), 'a1', 'a2'], [tr('ctl.capture', 'Throw orb'), 'capture'], [tr('ctl.swap', 'Swap monster'), 'swap'], [tr('ctl.skill', 'Trainer skill'), 'skill'],
      [tr('ctl.potion', 'Potion'), 'potion'], [tr('ctl.evolve', 'Evolve'), 'evolve'], [tr('ctl.regroup', 'Regroup'), 'regroup'], [tr('ctl.recall', 'Recall'), 'recall']];
    this.keys.innerHTML = `<span class="hd">${tr('ctl.title', 'Controls')}</span><span class="hd">${tr('ctl.keys', 'Keys')}</span><span class="hd">${tr('ctl.pad', 'Pad')}</span>` +
      rows.map(([n, a, b]) => {
        // trainer skill CARDS on (match option; mt/ui/input/skillcards.js): keys 1–5, pad R1 (hold = card ring)
        const w = this.app && this.app.world;
        if (a === 'skill' && w && w.mt && w.mt.cards && w.mt.cards.on) return `<span>${tr('ctl.cards', 'Skill cards')}</span><span><span class="gk wide">1-5</span></span><span>${glyphHTML(a, true)}</span>`;
        return `<span>${n}</span><span>${glyphHTML(a, false)}${b ? glyphHTML(b, false) : ''}</span><span>${glyphHTML(a, true)}${b ? glyphHTML(b, true) : ''}</span>`;
      }).join('');
    void pad;
  }
  setOpen(on) {
    if (on === this.open) return;
    this.open = on; this.el.hidden = !on;
    if (on) { this.focus = 0; this.armLeave(false); this.buildKeys(); this.sync(); this.setPaused(true); this.prevPad = this.padSig(); }   // buttons already down don't act
    // online match (mt/net/online.js): the menu opens but the shared match keeps running (app.paused reads false)
    if (on) { const net = this.app.mtNet && this.app.mtNet.active; this.phT.nodeValue = net ? tr('net.pause', 'Online match — the game keeps running') : tr('pause.title', 'Paused'); }
    else this.setPaused(false);
  }
  setPaused(p) { const a = this.app; if (a.setPaused) a.setPaused(p); else a.paused = p; }
  close() { this.setOpen(false); this.app.fire('ui', { panel: 'none' }); }
  armLeave(on) { this.armed = on; setCls(this.bLeave, 'armed', on); setText(this.bLeave.firstChild, on ? tr('pause.leaveConfirm', 'Leave? Press again') : tr('pause.leave', 'Leave match')); }
  leave() {
    if (!this.armed) { this.armLeave(true); this.armT = 3; return; }
    this.armLeave(false); this.setOpen(false); this.app.fire('ui', { panel: 'none' });
    const hud = this.app.registry && this.app.registry.get ? this.app.registry.get('hud') : null;
    if (hud && hud.screens && hud.screens.go) hud.screens.go('menu'); else { this.app.state = 'menu'; this.app.fire('state', 'menu'); }
  }
  update(dt) {
    if (!this.open) return;
    if (this.armT > 0) { this.armT -= dt; if (this.armT <= 0) this.armLeave(false); }
    // controller navigation: D-pad / left stick up-down (and left-right between the touch layout's two columns),
    // ✕ select, ○ back. ✕ / ○ act on RELEASE so the press can't leak into the screen that opens next (game / title).
    const sig = this.padSig();
    const edge = sig & ~this.prevPad, rel = this.prevPad & ~sig; this.prevPad = sig;
    // rows of visible items: one column normally, the touch layout's 2-column grid otherwise
    const vis = (b) => !b.hidden;
    const R = (this.hud.touch ? [[this.bResume], [this.bVol], [this.bMute, this.bFs], [this.bLang, this.bLeave]] : this.items.map((b) => [b])).map((r) => r.filter(vis)).filter((r) => r.length);
    let cur = this.items[this.focus]; if (cur.hidden) cur = this.bResume;
    let ri = R.findIndex((r) => r.includes(cur)); if (ri < 0) ri = 0; const ci = Math.max(0, R[ri].indexOf(cur));
    const go = (b) => { this.focus = this.items.indexOf(b); this.sync(); };
    if (edge & 1) { const r = R[(ri - 1 + R.length) % R.length]; go(r[Math.min(ci, r.length - 1)]); }
    else if (edge & 2) { const r = R[(ri + 1) % R.length]; go(r[Math.min(ci, r.length - 1)]); }
    else if (edge & 48) {
      const d = edge & 16 ? -1 : 1;
      if (cur === this.bVol) this.vol(0.1 * d);
      else if (cur === this.bLang) this.lang(d);   // i18n: D-pad ←/→ on Language
      else if (R[ri].length > 1) go(R[ri][(ci + d + R[ri].length) % R[ri].length]);
    }
    cur = this.items[this.focus];
    if (edge & 4) this.pressing = cur;
    if (rel & 4 && this.pressing === cur) { this.pressing = null; cur.click(); }
    if (rel & 8) this.close();
  }
  padSig() {
    let sig = 0;
    try {
      for (const gp of navigator.getGamepads ? navigator.getGamepads() : []) {
        if (!gp || !gp.connected) continue; const b = (i) => gp.buttons[i] && gp.buttons[i].pressed;
        if (b(12) || gp.axes[1] < -0.6) sig |= 1; if (b(13) || gp.axes[1] > 0.6) sig |= 2; if (b(0)) sig |= 4; if (b(1)) sig |= 8; if (b(14) || gp.axes[0] < -0.6) sig |= 16; if (b(15) || gp.axes[0] > 0.6) sig |= 32;
      }
    } catch { /* ignore */ }
    return sig;
  }
}

// (the VICTORY / DEFEAT screen lives in victory.js; the old EndScreen here was removed as dead code)
void setHTML; void SPECS;
