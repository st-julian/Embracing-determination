// mt/ui/cards.js — per-local-player HUD cards (DESIGN §14 bottom HUD): trainer card, active monster card
// (animated portrait, name, level, type badges, HP with damage trail, XP, A1/A2 with radial cooldown + glyphs,
// evolve-ready badge) and bench card (swap cooldown, regen). One SlotCard per local human. Owner: HUD.

import { h, setText, setHTML, setCls, setVar, show, setScaleX, pxCanvas, blit, tint } from './dom.js';
import * as art from './art.js';
import { glyphHTML } from './glyphs.js';
import { FORMS } from '../data/species.js';
import { TYPE_COLORS, TYPE_NAMES } from '../data/types.js';
import { XP, CAPTURE, TRAINER, SPEC_SKILL_CD, SPECS } from '../data/balance.js';
import { abilityFor } from '../data/abilities.js';
import { computeMonsterStats } from '../sim/monsters.js';
import { tr } from './tr.js'; // i18n: card strings (keys card.* / spec.*.short in mt/i18n/strings)

const SPEC_ICON = { attack: 'trainer/rally', healing: 'trainer/mend', magic: 'trainer/surge' };
const SPEC_SHORT = { attack: () => tr('spec.attack.short', 'ATK'), healing: () => tr('spec.healing.short', 'HEAL'), magic: () => tr('spec.magic.short', 'MAG') };

/** HP bar with damage trail. */
function hpBar(cls = '') {
  const el = h('div.bar' + (cls ? '.' + cls : '')), tr = h('i.tr'), fl = h('i.fl');
  el.append(tr, fl);
  return { el, tr, fl, last: -1, hitT: 0 };
}
function setHp(b, frac) {
  frac = Math.max(0, Math.min(1, frac || 0));
  if (b.last >= 0 && frac < b.last - 0.02) { setCls(b.el, 'dmg', false); void b.el.offsetWidth; setCls(b.el, 'dmg', true); }
  b.last = frac;
  setScaleX(b.fl, frac); setScaleX(b.tr, frac);
  setCls(b.el, 'mid', frac <= 0.5 && frac > 0.2); setCls(b.el, 'low', frac <= 0.2);
}

/** Ability button (big 30 px or small 20 px). */
function abButton(action, small) {
  const el = h('div.mt-ab' + (small ? '.sm' : '')), ic = pxCanvas(small ? 16 : 26, small ? 16 : 26, 'ic');
  const cd = h('i.cd'), num = h('span.num'), key = h('span.key');
  el.append(ic, cd, num, key, h('i.mt-tap'));   // .mt-tap: >= 48 CSS px tap area in the touch layout
  return { el, ic, cd, num, key, action, small, iconId: '', glyph: '', cool: false, flashT: 0 };
}
const AB_SIZE = { big: 26, sm: 16, xs: 14 };
function sizeAb(b, mode) {
  if (b.mode === mode) return; b.mode = mode;
  setCls(b.el, 'sm', mode === 'sm'); setCls(b.el, 'xs', mode === 'xs');
  b.ic.width = b.ic.height = AB_SIZE[mode]; const id = b.iconId; b.iconId = null; setIcon(b, id);
}
function setIcon(b, id) {
  if (b.iconId === id) return; b.iconId = id;
  const c = id ? art.icon(id, AB_SIZE[b.mode || (b.small ? 'sm' : 'big')]) : null;
  blit(b.ic, c);
}
function setAb(b, now, end, total, opts = {}) {
  const cool = end > now + 0.05 && !opts.locked;
  setCls(b.el, 'cool', cool); setCls(b.el, 'lock', !!opts.locked); setCls(b.el, 'off', !!opts.off); setCls(b.el, 'ready', !cool && !opts.off && !opts.locked);
  if (cool) { const r = end - now; setVar(b.cd, '--p', (Math.min(1, r / Math.max(0.1, total))).toFixed(3)); setText(b.num, Math.ceil(r)); }
  if (b.cool && !cool && !opts.locked) { setCls(b.el, 'flash', false); void b.el.offsetWidth; setCls(b.el, 'flash', true); }
  if (!b.cool && cool && b.seen) { setCls(b.el, 'used', false); void b.el.offsetWidth; setCls(b.el, 'used', true); }   // press feedback
  b.seen = true;
  b.cool = cool; b.cdLeft = cool ? end - now : 0; b.cdFrac = cool ? Math.min(1, (end - now) / Math.max(0.1, total)) : 0; b.locked = !!opts.locked; b.off = !!opts.off;
}
/** Touch fallback cluster (HUD-owned, only while the input layer has no touch cluster): data-tp slot per button. */
const FB_SLOTS = ['a1', 'a2', 'capture', 'swap', 'skill', 'potion', 'recall'];
const abState = (b, o) => { o = o || {}; o.icon = b.iconId || ''; o.ready = !b.cool && !b.off && !b.locked; o.cool = !!b.cool; o.cdLeft = b.cdLeft || 0; o.cdFrac = b.cdFrac || 0; o.locked = !!b.locked; o.off = !!b.off; o.hidden = !!b.el.hidden; return o; };
function setGlyph(b, pad) { const g = glyphHTML(b.action, pad); if (b.glyph !== g) { b.glyph = g; b.key.innerHTML = g; } }

export class SlotCard {
  constructor(hud, local) {
    this.hud = hud; this.local = local; this.unitId = local.unitId;
    const root = this.root = h('div.slot');
    // ---- trainer
    this.tpor = pxCanvas(24, 24); this.specIc = pxCanvas(9, 9);
    this.tname = h('span.nm'); this.twho = h('span.who');
    this.thp = hpBar(); this.tdown = h('div.down');
    this.acts = h('div.acts');
    this.bCap = abButton('capture', true); this.bSkill = abButton('skill', true); this.bPot = abButton('potion', true); this.bRec = abButton('recall', true);
    this.acts.append(this.bCap.el, this.bSkill.el, this.bPot.el, this.bRec.el);
    this.specLab = h('span');
    this.trn = h('div.pn.trn', null,
      h('div.tpor', null, this.tpor), h('div.spec', null, this.specIc, this.specLab),
      h('div.tn', null, this.twho, this.tname),
      h('div.hpl', null, this.thp.el), this.tdown, this.acts);
    // ---- active monster
    this.por = pxCanvas(48, 48); this.porEl = h('div.por', null, this.por);
    this.lvb = h('div.lvb'); this.evotag = h('div.evotag');
    this.nm = h('span.nm'); this.types = h('span.types'); this.typeKey = '';
    this.mhp = hpBar(); this.hpn = h('div.hpn'); this.mxp = hpBar('xp');
    this.status = h('div.status');
    this.mine = pxCanvas(9, 7, 'mine');   // "yours" chevron in the local colour (the same marker floats over the monster)
    this.info = h('div.pn.info', null, this.porEl, this.mine, this.lvb, this.evotag,
      h('div.row1', null, this.nm, this.types),
      h('div.hpl', null, h('span.lab', { text: tr('card.hp', 'HP') }), this.mhp.el), this.hpn,
      h('div.xpl', null, h('span.lab', { text: tr('card.xp', 'XP') }), this.mxp.el), this.status);
    this.bA1 = abButton('a1'); this.bA2 = abButton('a2');
    this.abs = h('div.abs', null, this.bA1.el, this.bA2.el);
    this.mon = h('div.mon', null, this.info, this.abs);
    // ---- bench
    this.bpor = pxCanvas(24, 24); this.bpEl = h('div.mpor', null, this.bpor);
    this.bn = h('div.bn'); this.bhp = hpBar(); this.regen = h('div.regen');
    this.bSwap = abButton('swap', true); this.bSwap.el.classList.add('sw');
    this.bevo = h('div.bevo', { text: tr('card.evo', 'EVO') }); this.bevo.hidden = true;
    this.bench = h('div.pn.bench', null, this.bpEl, this.bn, this.bhp.el, this.regen, this.bSwap.el, this.bevo);
    this.head = h('div.lchead');
    root.append(this.head, this.trn, this.mon, this.bench);
    this.formKey = ''; this.benchKey = ''; this.trainerKey = ''; this.frame = -1; this.anim = null;
    this.glyphVer = -1; this.wasReady = false;
    for (const [b, id] of [[this.bCap, 'trainer/capture'], [this.bPot, 'trainer/potion'], [this.bRec, 'trainer/recall'], [this.bSwap, 'trainer/swap']]) setIcon(b, id);
    // touch: the action buttons are tappable (only matter once a touch happened)
    const tap = (b, cmd) => b.el.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'touch') return; e.stopPropagation(); e.preventDefault();
      const w = hud.app.world; if (!w || b.el.classList.contains('lock')) return;   // locked moves are not buttons const c = typeof cmd === 'function' ? cmd(w) : cmd; if (c) w.command(this.unitId, c);
      setCls(b.el, 'press', true); setTimeout(() => setCls(b.el, 'press', false), 120);
    });
    tap(this.bCap, (w) => this.captureCmd(w)); tap(this.bSkill, { type: 'trainerSkill' }); tap(this.bPot, { type: 'potion' });
    tap(this.bRec, { type: 'recall' }); tap(this.bSwap, { type: 'swap' });
    tap(this.bA1, (w) => this.castCmd(w, 'a1')); tap(this.bA2, (w) => this.castCmd(w, 'a2'));
    this.evotag.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch' && hud.app.world) { e.stopPropagation(); e.preventDefault(); hud.app.world.command(this.unitId, { type: 'evolve' }); } });
    // touch: tap the bench chip to swap
    this.bench.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'touch' || !this.tmode || !hud.app.world) return; e.stopPropagation(); e.preventDefault();
      hud.app.world.command(this.unitId, { type: 'swap' }); setCls(this.bench, 'press', true); setTimeout(() => setCls(this.bench, 'press', false), 120);
    });
    this.bench.appendChild(h('i.mt-tap'));
    this.state = { a1: {}, a2: {}, capture: {}, skill: {}, potion: {}, swap: {}, recall: {}, evolve: { ready: false, evolving: false }, bench: null, hasMon: false, alive: true };
  }

  nearest(w, pred, r) {
    const me = w.units.get(this.unitId); if (!me) return null;
    let best = null, bd = r * r;
    for (const u of w.unitList) { if (!u.alive || !pred(u, me)) continue; const d = (u.x - me.x) ** 2 + (u.y - me.y) ** 2; if (d < bd) { bd = d; best = u; } }
    return best;
  }
  captureCmd(w) { const t = this.nearest(w, (u) => u.mtMon && u.mtMon.ownerId < 0, 10); return t ? { type: 'capture', targetId: t.id } : null; }
  castCmd(w, slot) {
    const t = this.nearest(w, (u, me) => u.team !== me.team && u.team !== 2 && !u.untargetable && (u.kind === 'champion' || u.kind === 'monster' || u.kind === 'minion'), 10);
    const me = w.units.get(this.unitId);
    return { type: 'monsterCast', slot, targetId: t ? t.id : -1, x: t ? t.x : me ? me.x : 0, y: t ? t.y : me ? me.y : 0 };
  }

  /** buttons in fallback-cluster order (FB_SLOTS) */
  fbButtons() { return [this.bA1, this.bA2, this.bCap, this.bSwap, this.bSkill, this.bPot, this.bRec]; }
  /**
   * multi: compact colour-coded card (2+ locals, or touch); tight: 4 locals; tmode: '' | 'cl' (touch, the input layer's
   * cluster has the buttons: card shows none) | 'fb' (touch, the HUD's fallback cluster .tpad has them); many: 2+ locals.
   */
  setMode(multi, local, tight = false, tmode = '', many = multi) {
    this.local = local; this.many = many;
    const mode = multi ? (tight ? 'xs' : 'sm') : '';
    if (this.multiMode !== multi || this.sizeMode !== mode || this.tmode !== tmode) {
      this.multiMode = multi; this.sizeMode = mode; this.tmode = tmode;
      const fb = tmode === 'fb';
      for (const b of [this.bA1, this.bA2]) sizeAb(b, fb ? 'big' : multi ? mode : 'big');
      for (const b of [this.bCap, this.bSkill, this.bPot, this.bSwap, this.bRec]) sizeAb(b, fb ? (b === this.bCap ? 'big' : 'sm') : multi ? mode : 'sm');
      show(this.bRec.el, !multi || fb);
      if (fb) { this.fbButtons().forEach((b, i) => { b.el.dataset.tp = FB_SLOTS[i]; this.hud.tpad.appendChild(b.el); }); }
      else {
        for (const b of this.fbButtons()) delete b.el.dataset.tp;
        this.abs.append(this.bA1.el, this.bA2.el); this.acts.append(this.bCap.el, this.bSkill.el, this.bPot.el, this.bRec.el);
        if (multi) this.acts.appendChild(this.bSwap.el); else this.bench.insertBefore(this.bSwap.el, this.bevo);
      }
      const ps = multi ? 24 : 48; this.por.width = this.por.height = ps; this.porSize = ps; this.anim = null; this.frame = -1;
    }
    setCls(this.root, 'lc', multi); setCls(this.root, 'pn', multi); setCls(this.root, 'tc', !!tmode);
    this.root.style.setProperty('--lc', local.color || '#3fb64a');
    if (this.mineCol !== (local.color || '#3fb64a')) { this.mineCol = local.color || '#3fb64a'; blit(this.mine, art.chevron(this.mineCol)); }
    setText(this.head, 'P' + (local.slot + 1));
    show(this.head, multi);
  }

  update(w, now, pad, t) {
    const u = w.units.get(this.unitId); if (!u || !u.mtTrainer) return;
    const T = u.mtTrainer, local = this.local;
    // glyphs
    const gv = pad || 'kbm';
    if (gv !== this.glyphVer) { this.glyphVer = gv; for (const b of [this.bCap, this.bSkill, this.bPot, this.bRec, this.bSwap, this.bA1, this.bA2]) setGlyph(b, pad); this.evoGlyph = glyphHTML('evolve', pad); this.formKey = ''; }
    // ---- trainer card
    const tk = T.spec + '|' + u.team;
    if (this.trainerKey !== tk) {
      this.trainerKey = tk;
      blit(this.tpor, art.bust(art.trainerSpriteId(T.spec, u.team), 24));
      blit(this.specIc, art.icon(SPEC_ICON[T.spec] || 'trainer/rally', 9));
      setText(this.specLab, SPEC_SHORT[T.spec] ? SPEC_SHORT[T.spec]() : '');
      setIcon(this.bSkill, SPEC_ICON[T.spec] || 'trainer/rally');
      this.trn.style.setProperty('--team', u.team === 0 ? '#3b86f2' : '#ef5243');
      this.trn.style.setProperty('--team-l', u.team === 0 ? '#cfe2ff' : '#ffd5cf');
    }
    setText(this.twho, this.multiMode && this.many !== false ? 'P' + (local.slot + 1) : '');
    setVar(this.trn, '--lc', local.color || '#3b86f2');
    setText(this.tname, u.name || tr('card.trainer', 'Trainer'));
    setHp(this.thp, u.alive ? u.hp / Math.max(1, u.maxHp) : 0);
    setCls(this.trn, 'dead', !u.alive);
    if (!u.alive) setText(this.tdown, tr('card.backIn', 'Back in {n}s', { n: Math.max(0, Math.ceil((u.respawnAt || now) - now)) }));
    const hasMon = T.party.length > 0;
    const A = u.abilities || [], S = u.spells || [];
    setAb(this.bCap, now, T.cdEnd.capture, (A[2] && A[2].cdTotal) || CAPTURE.cooldown, { off: !u.alive });
    setAb(this.bSkill, now, T.cdEnd.skill, (A[3] && A[3].cdTotal) || SPEC_SKILL_CD, { off: !hasMon || !u.alive });
    setAb(this.bPot, now, T.cdEnd.potion, (S[0] && S[0].cdTotal) || TRAINER.potion.cooldown, { off: !hasMon || !u.alive });
    show(this.bSkill.el, hasMon); show(this.bPot.el, hasMon);   // monster-only actions appear with the first monster
    const recalling = u.recallStart != null && u.recallStart >= 0 && u.alive;
    setAb(this.bRec, now, 0, 1, { off: !u.alive });
    setCls(this.bRec.el, 'ready', recalling);

    // ---- active monster
    const rec = T.activeIdx >= 0 ? T.party[T.activeIdx] : null;
    const benchRec = T.party.find((r, i) => i !== T.activeIdx) || null;
    setCls(this.mon, 'empty', !rec);
    if (!rec) {
      // compact card (touch / 2+ locals): 2 short lines that fit 144 HUD px in both languages; full card: 3 lines
      if (this.multiMode) setHTML(this.status, `<span class="b">${tr('card.noMonS1', 'No monster yet!')}</span><span class="l2">${this.sizeMode === 'xs' ? tr('card.noMon3', 'throw an orb') : tr('card.noMonS2', 'Weaken it, then throw')} ${glyphHTML('capture', pad)}</span>`);
      else setHTML(this.status, `<span class="b">${tr('card.noMon', 'No monster yet!')}</span><span>${tr('card.noMon2', 'Weaken a wild one, then')}</span><span>${tr('card.noMon3', 'throw an orb')} ${glyphHTML('capture', pad)}</span>`);
      setCls(this.mon, 'fainted', false); show(this.evotag, false); setCls(this.mon, 'evready', false); setCls(this.mon, 'tagon', false);
      for (const b of [this.bA1, this.bA2]) { setIcon(b, ''); setAb(b, now, 0, 1, { locked: true }); }
      setCls(this.bA2.el, 'lock', false); setCls(this.bA1.el, 'lock', false); setCls(this.bA1.el, 'off', true); setCls(this.bA2.el, 'off', true);
    } else {
      const f = FORMS[rec.form];
      const unit = rec.unitId >= 0 ? w.units.get(rec.unitId) : null;
      const live = unit && unit.alive && !unit.removed;
      const maxHp = live ? unit.maxHp : computeMonsterStats(rec.form, rec.level, T.spec).hp;
      const hp = rec.fainted ? 0 : live ? unit.hp : rec.hpFrac * maxHp;
      if (this.formKey !== rec.form + '|' + rec.rid + '|' + this.porSize) {
        this.formKey = rec.form + '|' + rec.rid + '|' + this.porSize; this.anim = null; this.frame = -1;
        setText(this.nm, f.name);
        const tc = TYPE_COLORS[f.types[0]] || '#8aa';
        this.porEl.style.setProperty('--tc', tc); this.porEl.style.setProperty('--tc-l', tint(tc, 0.55));
        const tkey = f.types.join(',');
        if (this.typeKey !== tkey) { this.typeKey = tkey; this.types.innerHTML = ''; for (const ty of f.types) this.types.appendChild(typeChip(ty)); }
        setIcon(this.bA1, f.line + '/a1'); setIcon(this.bA2, f.line + '/a2');
      }
      // animated portrait
      if (!this.anim) this.anim = art.portraitAnim(rec.form, this.porSize || 48);
      if (this.anim) { const fi = Math.floor(t * this.anim.fps) % this.anim.frames.length; if (fi !== this.frame) { this.frame = fi; blit(this.por, this.anim.frames[fi]); } }
      else if (this.frame !== -2) { this.frame = -2; blit(this.por, art.portrait(rec.form, this.porSize || 48)); }
      setHTML(this.lvb, '<small>Lv</small>' + rec.level);
      setHp(this.mhp, hp / Math.max(1, maxHp));
      setHTML(this.hpn, '<b>' + Math.min(Math.round(maxHp), Math.ceil(hp)) + '</b>/' + Math.round(maxHp));
      const toNext = XP.toNext(rec.level);
      setScaleX(this.mxp.fl, rec.level >= XP.maxLevel ? 1 : rec.xp / toNext); setScaleX(this.mxp.tr, 0);
      setCls(this.porEl, 'faint', rec.fainted);
      setCls(this.porEl, 'evolving', !!rec.evolving);
      setCls(this.mon, 'fainted', rec.fainted || !u.alive);
      if (rec.fainted) setHTML(this.status, `<span class="b">${tr('card.faintedT', 'Fainted! {n}s', { n: Math.max(0, Math.ceil(rec.faintUntil - now)) })}</span>${benchRec && !benchRec.fainted ? '<span class="sw2">' + tr('card.swap', 'Swap') + ' ' + glyphHTML('swap', pad) + '</span>' : ''}`);
      else if (!u.alive) setHTML(this.status, '<span>' + tr('card.resting', 'Resting in its orb') + '</span>');
      const ready = !rec.evolving && !rec.fainted && evolveReadyRec(rec);
      show(this.evotag, ready || !!rec.evolving); setCls(this.mon, 'evready', ready); setCls(this.mon, 'tagon', ready || !!rec.evolving);
      if (rec.evolving) setHTML(this.evotag, tr('card.evolving', 'Evolving…'));
      else if (ready) setHTML(this.evotag, tr('card.evolve', 'EVOLVE') + ' ' + this.evoGlyph);
      if (ready && !this.wasReady) this.hud.toast(tr('toast.canEvolve', '{name} can evolve! Press ', { name: f.name }), 'ask', glyphHTML('evolve', pad));
      this.wasReady = ready;
      const a1 = abilityFor(f.line, 'a1', f.stage), a2 = abilityFor(f.line, 'a2', f.stage);
      const off = rec.fainted || !live;
      setAb(this.bA1, now, rec.cds.a1, (A[0] && A[0].cdTotal) || (a1 ? a1.cd : 1), { off, locked: !a1 });
      setAb(this.bA2, now, rec.cds.a2, (A[1] && A[1].cdTotal) || (a2 ? a2.cd : 1), { off, locked: !a2 });
      if (!a2 && Number.isFinite(f.evolveLevel) && this.bA2.el.dataset.lv !== 'Lv' + f.evolveLevel) this.bA2.el.dataset.lv = 'Lv' + f.evolveLevel;
      this.bA1.el.title = a1 ? a1.name : ''; this.bA2.el.title = a2 ? a2.name : tr('card.unlocks', 'Unlocks when evolved');
    }
    // ---- bench
    setCls(this.bench, 'empty', !benchRec);
    show(this.bench, !!benchRec || (this.multiMode && !this.tmode));   // no empty placeholder slot: the bench card appears once you have one
    if (!benchRec) {
      if (this.benchKey !== '') { this.benchKey = ''; blit(this.bpor, null); }
      setHTML(this.bn, '<b>' + tr('card.bench', 'Bench') + '</b>'); setHp(this.bhp, 0); setText(this.regen, tr('card.empty', 'empty'));
      setAb(this.bSwap, now, 0, 1, { off: true }); show(this.bevo, false);
    } else {
      const bf = FORMS[benchRec.form];
      if (this.benchKey !== benchRec.form) {
        this.benchKey = benchRec.form; blit(this.bpor, art.portrait(benchRec.form, 24));
        const tc = TYPE_COLORS[bf.types[0]] || '#8aa'; this.bpEl.style.setProperty('--tc', tc); this.bpEl.style.setProperty('--tc-l', tint(tc, 0.6));
      }
      setHTML(this.bn, '<b>' + bf.name + '</b> ' + benchRec.level);
      setHp(this.bhp, benchRec.fainted ? 0 : benchRec.hpFrac);
      setCls(this.bench, 'faint', benchRec.fainted);
      show(this.bevo, !benchRec.fainted && !benchRec.evolving && evolveReadyRec(benchRec));
      setText(this.regen, benchRec.fainted ? tr('card.faintedShort', 'Fainted {n}s', { n: Math.max(0, Math.ceil(benchRec.faintUntil - now)) }) : benchRec.evolving ? tr('card.evolving', 'Evolving…') : benchRec.hpFrac < 0.995 ? tr('card.regen', '♥ +3%/s') : tr('card.ready', 'Ready!'));
      setAb(this.bSwap, now, T.cdEnd.swap, (S[1] && S[1].cdTotal) || TRAINER.swapCooldown, { off: benchRec.fainted || !u.alive || !!T.swap });
    }
    if (this.multiMode) show(this.bSwap.el, !!benchRec);   // nothing to swap to: no swap button on the compact card / fallback cluster
    setCls(this.bench, 'swcd', !!this.bSwap.cool);
    // ---- state for the input layer's touch cluster (hud.abilityState)
    const st = this.state;
    abState(this.bA1, st.a1); abState(this.bA2, st.a2); abState(this.bCap, st.capture); abState(this.bSkill, st.skill);
    abState(this.bPot, st.potion); abState(this.bSwap, st.swap); abState(this.bRec, st.recall);
    st.evolve.ready = !!(rec && !rec.evolving && !rec.fainted && evolveReadyRec(rec)) || !!(benchRec && !benchRec.fainted && !benchRec.evolving && evolveReadyRec(benchRec));
    st.evolve.evolving = !!(rec && rec.evolving);
    st.bench = benchRec ? { form: benchRec.form, level: benchRec.level, hpFrac: benchRec.fainted ? 0 : benchRec.hpFrac, fainted: !!benchRec.fainted } : null;
    st.hasMon = hasMon; st.alive = !!u.alive;
  }
  /** refused command: a short shake of the button it concerns (locked move, nothing to swap to) or of the card */
  /** the card button a refusal is about (locked move, nothing to swap to), when it is on screen */
  denyButton(code) {
    const b = code === 'locked' ? (this.bA2.el.classList.contains('lock') ? this.bA2 : this.bA1)
      : code === 'no_bench' || code === 'fainted' || code === 'evolving' ? this.bSwap : null;
    return b && !b.el.hidden && b.el.offsetParent && b.el.getBoundingClientRect().width > 0 ? b.el : null;
  }
  denyShake(code) {
    const el = this.denyButton(code) || this.mon;
    setCls(el, 'shake', false); void el.offsetWidth; setCls(el, 'shake', true);
  }
  dispose() { for (const b of this.fbButtons()) if (b.el.parentNode === this.hud.tpad) b.el.remove(); this.root.remove(); }
}

/** Gen-5 type chip: element symbol + name on the type colour. */
export function typeChip(ty) {
  const c = TYPE_COLORS[ty] || '#888', ic = pxCanvas(8, 8);
  blit(ic, art.typeIcon(ty, 8));
  const el = h('span.ty', null, ic, h('span', { text: (TYPE_NAMES[ty] || ty).toUpperCase() }));
  el.style.setProperty('--c', c); el.style.setProperty('--c-l', tint(c, 0.35)); el.style.setProperty('--c-d', tint(c, -0.45));
  return el;
}

function evolveReadyRec(rec) {
  const f = FORMS[rec.form];
  return !!f && Number.isFinite(f.evolveLevel) && rec.level >= f.evolveLevel;
}
