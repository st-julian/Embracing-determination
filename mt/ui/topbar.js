// mt/ui/topbar.js — top-centre score bar: team KO scores, match clock, towers, and both teams' trainer
// mini-cards (trainer bust, HP, party mini-portraits with levels, respawn timer). Owner: HUD.

import { h, setText, setCls, setVar, setScaleX, pxCanvas, blit, fmtTime, tint } from './dom.js';
import * as art from './art.js';
import { FORMS } from '../data/species.js';
import { TYPE_COLORS } from '../data/types.js';
import { tr } from './tr.js'; // i18n

// Mini card: big trainer bust (22 px) on the team colour, HP strip, and the ACTIVE monster as a round badge with
// its level (bench + details live in the scoreboard) — fewer, larger shapes than before.
function miniCard() {
  const tb = pxCanvas(22, 22), th = h('i'), rs = h('span.rs');
  const mc = pxCanvas(14, 14), ml = h('b');
  const mon = h('span.mb', null, mc, ml);
  const el = h('div.tm', null, h('span.tb', null, tb), rs, h('span.th', null, th), mon);
  return { el, tb, th, rs, mon, mc, ml, key: '', mkey: '' };
}

export class TopBar {
  constructor(hud) {
    this.hud = hud;
    this.blue = h('div.team.blue'); this.red = h('div.team.red');
    this.scB = h('span.sc.blue.b', { text: '0' }); this.scR = h('span.sc.red.b', { text: '0' });
    this.twB = h('span.tw.blue'); this.twR = h('span.tw.red'); this.clk = h('span.clk', { text: '00:00' });
    this.vs = h('span.vs', { text: tr('hud.kos', 'KOs') });
    this.score = h('div.pn.score', null, this.scB, this.vs, this.scR, this.twB, this.twR, this.clk);
    this.el = h('div.top', null, this.blue, this.score, this.red);
    this.cards = [[], []]; this.last = [-1, -1];
  }
  relang() { this.vs.textContent = tr('hud.kos', 'KOs'); } // i18n
  update(w, f, stats) {
    const team = f.viewerTeam === 1 ? 1 : 0, now = w.time;
    // left = viewer's team (blue = ally colour), right = opponents
    const sides = [team, 1 - team];
    for (let s = 0; s < 2; s++) {
      const t = sides[s], v = stats.score(w, t), el = s === 0 ? this.scB : this.scR;
      if (v !== this.last[s]) { if (this.last[s] >= 0) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); } this.last[s] = v; setText(el, v); }
      const towers = (w.structures || []).filter((x) => x.team === 1 - t && x.kind === 'tower' && !x.alive).length;
      const tw = s === 0 ? this.twB : this.twR; const key = 'T' + towers;
      if (tw._k !== key) { tw._k = key; tw.innerHTML = '<i></i>' + towers; }
    }
    setText(this.clk, fmtTime(now));
    const locals = this.hud.localMap();
    for (let s = 0; s < 2; s++) {
      const t = sides[s], list = (w.champions || []).filter((c) => c.team === t && c.mtTrainer).sort((a, b) => a.id - b.id);
      const box = s === 0 ? this.blue : this.red, cards = this.cards[s];
      while (cards.length < list.length) { const c = miniCard(); cards.push(c); box.appendChild(c.el); }
      while (cards.length > list.length) cards.pop().el.remove();
      for (let i = 0; i < list.length; i++) {
        const u = list[i], c = cards[i], T = u.mtTrainer;
        const k = u.id + '|' + T.spec + '|' + u.team;
        if (c.key !== k) {
          c.key = k; blit(c.tb, art.bust(art.trainerSpriteId(T.spec, u.team), 22));
          c.el.style.setProperty('--team', s === 0 ? '#3b86f2' : '#ef5243'); c.el.style.setProperty('--team-l', s === 0 ? '#cfe2ff' : '#ffd5cf');
          c.el.title = u.name;
        }
        const L = locals.get(u.id); setCls(c.el, 'me', !!L); if (L) setVar(c.el, '--lc', L.color);
        setCls(c.el, 'dead', !u.alive);
        if (!u.alive) setText(c.rs, Math.max(0, Math.ceil((u.respawnAt || now) - now)));
        setScaleX(c.th, u.alive ? u.hp / Math.max(1, u.maxHp) : 0);
        const rec = T.party[T.activeIdx] || T.party[0] || null, mk = rec ? rec.form : '';
        if (c.mkey !== mk) {
          c.mkey = mk; blit(c.mc, rec ? art.portrait(rec.form, 14) : null); setCls(c.mon, 'none', !rec);
          if (rec) { const tc = TYPE_COLORS[FORMS[rec.form].types[0]]; c.mon.style.setProperty('--tc', tc); c.mon.style.setProperty('--tc-l', tint(tc, 0.6)); }
        }
        setText(c.ml, rec ? rec.level : '');
        setCls(c.mon, 'f', !!(rec && rec.fainted));
      }
    }
  }
}
