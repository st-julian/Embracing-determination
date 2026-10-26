// mt/ui/plates.js — overhead unit plates in the Gen-5 HUD language, painted INTO the legacy overlay canvas
// (overlays-*.js `De.draw`, [MT-HOOK] mtPlates) so the legacy projection, declutter, occlusion fading and
// dirty-tile clearing keep working. Owner: HUD.
//
// Contract with the hooks: plates.draw(bars, ctx, st, frame, bucket) RECORDS one unit's plate (returning true skips
// the legacy painter); plates.flush(bars, ctx, frame) ([MT-HOOK] mtPlatesFlush, end of the overlay loop) lays them
// out by priority (local trainer > trainers > structures > local pet > boss > pets > wild > minions), stacks
// overlapping plates upward (bounded), collapses/hides low-priority plates in clusters, draws, and marks dirty tiles.
// Party plate: a trainer and its active monster within ~2.2 m share ONE plate (trainer name + HP, monster HP row with
// a type pip). Monster plates are minimal (type-coloured level pip + HP bar; the name only on hover / target / lock);
// a monster plate that can't be placed free of others is not drawn (never truncated / overlapped).
// Plate scale: ~0.55× the HUD on big desktop screens (1080p: 2 device px per plate px), 1× on phones / small screens.
// Buckets: 0 minions + small monsters, 1 structures, 2 epic monsters, 3 champions (= trainers).

import { FORMS } from '../data/species.js';
import { TYPE_COLORS } from '../data/types.js';
import { FONT, FONT_BOLD } from './pixelfont.js';
import { SPECIES_ART } from '../../art/sprites/index.js';
import { o as heightAt } from '../../assets/height-CVtQdZ3e.js';
import { bossName } from '../i18n/index.js'; // i18n: river boss plate name in the current language
import { jaScale } from '../i18n/dom.js';      // Japanese glyph scale m (crisp kana need m·q/k whole)
import { chevron } from './art.js';

const NAVY = '#1b2350', TRACK = '#2e3566';
const REL = { ally: ['#3b86f2', '#9cc8ff'], enemy: ['#ef5243', '#ffb0a6'], wild: ['#f2b632', '#ffe08a'], boss: ['#9a5cff', '#d8bfff'] };

export class Plates {
  constructor(hud) {
    this.hud = hud; this.names = new Map(); this.q = 2; this.fontOk = false; this.captureHint = new Map(); this.texH = new Map(); this.queue = []; this.stamp = -1;
  }
  /** called by the HUD on layout */
  setScale(u) { this.u = u; this.qk = 0; }
  /**
   * Plate px -> overlay device px. Big desktop screens get plates at ~0.55× the HUD scale k (small, MOBA-like: 1080p
   * k 4 -> 2), phones / small screens 1×; only scales where Japanese pixel glyphs stay whole-pixel (m·q/k integral).
   */
  plateQ(D) {
    const hud = this.hud, k = hud.k || 2, u = this.u || 2;
    if (this.qk && this.qkK === k && this.qkU === u) return Math.max(1, Math.round(this.qk / k * u * (D || 1)));
    const target = hud.touch || u < 3 ? k : Math.max(2, k * 0.55);
    let m = 1; try { m = jaScale(k).m; } catch { /* i18n not loaded */ }
    let best = k;
    for (let q = 1; q <= k; q++) if ((m * q) % k === 0 && Math.abs(q - target) < Math.abs(best - target) - 1e-9) best = q;
    this.qk = best; this.qkK = k; this.qkU = u;
    return Math.max(1, Math.round(best / k * u * (D || 1)));
  }
  /**
   * Screen position (overlay device px) just above the top of a unit's billboard sprite, from the sprite system's
   * texel scale and the art frame's height above the feet (tall hats, wings, Final forms all get their own offset).
   * Returns null when the sprite system / frame is unavailable (caller keeps the legacy overhead anchor).
   */
  spriteTop(bars, u, frame) {
    const app = this.hud.app, R = app.registry && app.registry.get && app.registry.get('mt-render'), sp = R && R.sprites;
    if (!sp || !sp.k || !sp.atlas || !sp.artOf) return null;
    const id = sp.artOf(u), S = id && SPECIES_ART[id]; if (!S) return null;
    // the idle frame at the CURRENT art density (HD keys carry '#dens'): its height above the feet in screen px is
    // F.ay × (screen px per art px of that frame); cached per id+density for frames the atlas has evicted
    const fr = sp.atlas.frames, rs = sp.sizeOf ? sp.sizeOf(S) : 1, ck = id + '|' + sp.dens;
    let F = sp.keyOf && fr ? fr.get(sp.keyOf(id, S.views[0], 'idle', 0, rs)) : null;
    if (!F && sp.keyOf && fr && sp.prevDens) F = fr.get(sp.keyOf(id, S.views[0], 'idle', 0, rs, sp.prevDens));
    if (!F && fr) F = fr.get(id + '/' + S.views[0] + '/idle/0');
    let texH;
    if (F) { const kk = sp.hd && F.dens ? sp.pxPerM / F.dens : sp.k; texH = F.ay * kk / (sp.k || 1); this.texH.set(ck, texH); }
    else { texH = this.texH.get(ck); if (texH == null) return null; }
    const P = frame.proj; if (!P || !P.e) return null;
    const a = frame.alpha != null ? frame.alpha : 1, x = u.prevX + (u.x - u.prevX) * a, z = u.prevY + (u.y - u.prevY) * a, y = heightAt(x, z);
    const e = P.e, w = e[3] * x + e[7] * y + e[11] * z + e[15]; if (w <= 1e-4) return null;
    const sx = P.l + ((e[0] * x + e[4] * y + e[8] * z + e[12]) / w * 0.5 + 0.5) * P.w;
    const sy = P.t + (0.5 - (e[1] * x + e[5] * y + e[9] * z + e[13]) / w * 0.5) * P.h;
    const gl = app.pipeline && app.pipeline.renderer && app.pipeline.renderer.domElement;
    const cssPerBuf = gl && gl.height ? P.h / gl.height : 1;
    const D = bars.D || 1, top = texH * sp.k * cssPerBuf * (S.hover ? 1.05 : 1);
    return { x: Math.round(sx * D), y: Math.round((sy - top) * D) };
  }
  rel(u, frame) {
    const L = this.hud.localMap();
    if (u.mtTrainer) { const l = L.get(u.id); if (l) return [l.color, '#e8ffd8']; return u.team === frame.viewerTeam ? REL.ally : REL.enemy; }
    if (u.mtMon) {
      if (u.mtMon.ownerId < 0) return REL.wild;
      const l = L.get(u.mtMon.ownerId); if (l) return [l.color, '#e8ffd8'];
      return u.team === frame.viewerTeam ? REL.ally : REL.enemy;
    }
    if (u.team === 2) return u.epic ? REL.boss : REL.wild;
    return u.team === frame.viewerTeam ? REL.ally : REL.enemy;
  }
  /** cached outlined text sprite */
  label(text, q, bold, fill) {
    const key = text + '|' + q + '|' + (bold ? 1 : 0) + '|' + fill;
    let s = this.names.get(key); if (s) return s;
    if (this.names.size > 400) this.names.clear();
    const font = `${10 * q}px '${bold ? FONT_BOLD : FONT}'`;
    const c = document.createElement('canvas'), g = c.getContext('2d'); g.font = font;
    const w = Math.ceil(g.measureText(text).width) + 2 * q;
    c.width = Math.max(1, w); c.height = 10 * q + 2 * q;
    g.font = font; g.textBaseline = 'alphabetic'; g.fillStyle = NAVY;
    const by = 8 * q + q; // ascent 8 px + outline
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1], [0, 2]]) g.fillText(text, q + dx * q, by + dy * q);
    g.fillStyle = fill; g.fillText(text, q, by);
    s = { c, w: c.width, h: c.height, ok: document.fonts ? document.fonts.check(font) : true };
    if (!s.ok) return s; // not cached until the font is ready
    this.names.set(key, s);
    return s;
  }
  bar(g, x, y, w, hgt, q, st, col, opts = {}) {
    const max = Math.max(1, st.maxHp), f = Math.max(0, Math.min(1, st.hp / max)), tf = Math.max(f, Math.min(1, (st.trailHp || st.hp) / max));
    g.fillStyle = NAVY; g.fillRect(x - q, y - q, w + 2 * q, hgt + 2 * q);
    g.fillStyle = TRACK; g.fillRect(x, y, w, hgt);
    const fw = Math.round(w * f), tw = Math.round(w * tf);
    if (tw > fw) { g.fillStyle = '#fff4c8'; g.fillRect(x + fw, y, tw - fw, hgt); }
    g.fillStyle = col[0]; g.fillRect(x, y, fw, hgt);
    if (hgt > q) { g.fillStyle = col[1]; g.fillRect(x, y, fw, q); }
    if (opts.ticks && max > 0) { g.fillStyle = 'rgba(27,35,80,.45)'; const step = opts.ticks; for (let v = step; v < max - 1; v += step) { const tx = x + Math.round(w * v / max); if (tx >= x + fw) break; g.fillRect(tx, y + q, Math.max(1, q >> 1), hgt - q); } }
    if (st.hitFlash > 0) { g.globalAlpha *= Math.min(1, st.hitFlash); g.fillStyle = '#ffffff'; g.fillRect(x, y, fw, hgt); g.globalAlpha /= Math.min(1, st.hitFlash) || 1; }
  }
  badge(g, x, y, q, txt, bg, fg = '#fffdf6') {
    const s = this.label(txt, q, true, fg);
    const w = Math.max(9 * q, s.w + q), hh = 9 * q;
    g.fillStyle = NAVY; g.fillRect(x - q, y - q, w + 2 * q, hh + 2 * q);
    g.fillStyle = bg; g.fillRect(x, y, w, hh);
    g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x, y, w, q);
    g.drawImage(s.c, Math.round(x + (w - s.w) / 2), y - q);
    return w;
  }

  // ------------------------------------------------------------------------------------------------ record
  /**
   * [MT-HOOK] mtPlates: called per unit by the legacy overlay loop. We only RECORD the plate (anchor, priority,
   * occlusion alpha); flush() lays all plates out together (priority + stacking, cluster hiding) and draws them.
   */
  draw(bars, g, st, frame, bucket) {
    const u = st.unit; if (!u) return false;
    const q = this.q = this.plateQ(bars.D || 1);
    if (this.stamp !== bars.stamp) { this.stamp = bars.stamp; this.queue.length = 0; }
    const tiny = () => { this.bounds(st, st.sx, st.sy, st.sx + 1, st.sy + 1); return true; };
    if (u.mtMon && (u.mtMon.capturing || u.mtCapturing)) return tiny();
    let cx = Math.round(st.sx), base = Math.round(st.sy);
    if ((u.mtTrainer || u.mtMon) && (bucket === 3 || bucket === 0)) { const tp = this.spriteTop(bars, u, frame); if (tp) { cx = tp.x; base = tp.y; } }
    const L = this.hud.localMap(), localOwner = u.mtMon ? L.has(u.mtMon.ownerId) : L.has(u.id);
    let kind, prio;
    if (bucket === 3) { kind = 'trainer'; prio = localOwner ? 100 : 90; }
    else if (bucket === 1) { kind = 'struct'; prio = 95; }
    else if (bucket === 2 || (u.kind === 'monster' && !u.mtMon)) { kind = 'boss'; prio = bucket === 2 ? 85 : 40; }
    else if (u.mtMon) { const wild = u.mtMon.ownerId < 0; kind = wild ? 'wild' : 'pet'; prio = wild ? (this.captureHint.has(u.id) ? 75 : 50) : localOwner ? 80 : 65; }
    else {
      kind = 'minion'; prio = 10;
      if (st.hp >= st.maxHp - 0.5) return tiny();                    // full-HP minions show no bar (less clutter)
    }
    // plates are either fully shown or not drawn: no half-faded ghost bars (legacy occlusion/vision fades)
    // (the legacy per-plate fade — burial under other champion plates, HUD cover — is ignored: flush() does its own
    //  layout + HUD masking; only the overlay's global fade counts)
    if ((frame.fade != null ? frame.fade : 1) < 0.55) return tiny();
    this.queue.push({ st, u, kind, prio, cx, base, alpha: 1, local: localOwner, col: this.rel(u, frame), bucket });
    return tiny();
  }

  // ------------------------------------------------------------------------------------------------ layout
  /** Plate geometry relative to (cx, base) — returns parts and a bounding box (device px). */
  measure(p, frame) {
    const q = this.q, u = p.u, k = p.kind;
    if (k === 'trainer') {
      const w = 40 * q, hh = 4 * q, bx = p.cx - (w >> 1) + 5 * q, by = p.base - 6 * q;
      const nm = (u.name || '').length > 9 ? u.name.slice(0, 8) + '.' : (u.name || '');
      const named = !this.fight || p.local || (this.focus && this.focus.has(u.id));
      const name = named ? this.label(nm, q, true, p.local ? '#fffdf6' : u.team === frame.viewerTeam ? '#e3efff' : '#ffe4df') : null;
      const nx = name ? Math.round(bx + (w - name.w) / 2) : bx, ny = name ? by - name.h - q : by;
      const row = p.pet ? 5 * q : 0;   // party plate: the active monster's HP row under the trainer bar
      // level badge = the ACTIVE monster's level, labelled "Lv" (not the party average, which dropped after a catch)
      const T = u.mtTrainer, rec = T && T.party[T.activeIdx], bt = rec ? 'Lv' + rec.level : null;
      const bl = bt ? this.label(bt, q, true, '#fffdf6') : null, bw = bl ? Math.max(9 * q, bl.w + q) : 0;
      return { bx, by, w, hh, name, nx, ny, row, bt, bw, x0: Math.min(bx - bw - 3 * q, nx), y0: name ? ny : by - 4 * q, x1: Math.max(bx + w + q, name ? nx + name.w : 0), y1: by + hh + q + row };
    }
    if (k === 'pet' || k === 'wild') {
      const wild = k === 'wild', w = (wild ? 24 : 28) * q, hh = 3 * q, bx = p.cx - (w >> 1) + 5 * q, by = p.base - 4 * q;
      const showName = !!(this.focus && this.focus.has(u.id));            // minimal: level pip + bar; name on hover / target
      const f = FORMS[u.mtMon.form] || {};
      const name = showName ? this.label(f.name || u.name || '', q, false, wild ? '#fff6d0' : '#ffffff') : null;
      const nx = name ? Math.round(bx + (w - name.w) / 2) : bx, ny = name ? by - name.h : by;
      const hint = wild && this.captureHint.has(u.id);
      return { bx, by, w, hh, name, nx, ny, hint, x0: Math.min(bx - 12 * q, nx), y0: name ? ny : by - 4 * q, x1: Math.max(bx + w + (hint ? 10 * q : q), name ? nx + name.w : 0), y1: by + hh + q };
    }
    if (k === 'minion') {
      const w = (u.subtype === 'siege' || u.subtype === 'super' ? 22 : 16) * q, hh = 2 * q, bx = p.cx - (w >> 1), by = p.base - 3 * q;
      return { bx, by, w, hh, x0: bx - q, y0: by - q, x1: bx + w + q, y1: by + hh + q };
    }
    if (k === 'boss') {
      const epic = p.bucket === 2, w = (epic ? 64 : 30) * q, hh = (epic ? 5 : 3) * q, bx = p.cx - (w >> 1), by = p.base - 4 * q;
      const name = epic ? this.label(bossName() || u.name, q, true, '#efe2ff') : null;
      const nx = name ? Math.round(p.cx - name.w / 2) : bx, ny = name ? by - name.h - q : by;
      return { bx, by, w, hh, name, nx, ny, epic, x0: Math.min(bx - q, nx), y0: name ? ny : by - q, x1: Math.max(bx + w + q, name ? nx + name.w : 0), y1: by + hh + q };
    }
    // structures
    const nexus = u.kind === 'nexus', w = (nexus ? 64 : u.kind === 'inhibitor' ? 40 : 48) * q, hh = (nexus ? 5 : 4) * q, bx = p.cx - (w >> 1);
    let by = p.st.sy < -1e4 ? 14 * q : p.base - 8 * q;
    by = Math.max(by, 12 * q);
    return { bx, by, w, hh, nexus, x0: bx - 9 * q, y0: by - 4 * q, x1: bx + w + q, y1: by + hh + q };
  }
  /** Units whose plate keeps its name: local trainers' targets, local pets' targets, hovered / aimed unit. */
  focusSet(frame) {
    const F = new Set(), w = frame.world, app = this.hud.app, t = w ? w.time : 0;
    const tgt = (u) => {
      if (!u || !u.alive) return;
      const o = u.order; if (o && o.targetId >= 0 && (o.type === 'attack' || o.type === 'castOnTarget' || o.type === 'attackMove')) F.add(o.targetId);
      if (u.attackTargetId >= 0 && t - (u.attackT ?? -99) < 1.3) F.add(u.attackTargetId);
      if (u.mtMon && u.mtMon.focusId >= 0) F.add(u.mtMon.focusId);
    };
    for (const l of this.hud.localList()) {
      const me = w && w.units.get(l.unitId); if (!me) continue; tgt(me);
      const T = me.mtTrainer, rec = T && T.party[T.activeIdx]; if (rec && rec.unitId >= 0) tgt(w.units.get(rec.unitId));
      const aim = app.mtAim && app.mtAim[l.slot]; if (aim && aim.lockId >= 0) F.add(aim.lockId);
    }
    const ctl = app.registry && app.registry.get && app.registry.get('controls');
    if (ctl) { if (ctl.hoverId != null && ctl.hoverId >= 0) F.add(ctl.hoverId); const a = ctl.aim; if (a && a.active && a.targetId != null) F.add(a.targetId); }
    return F;
  }
  shift(m, dy) { m.by += dy; m.ny += dy; m.y0 += dy; m.y1 += dy; }

  /** [MT-HOOK] mtPlatesFlush: place (priority, stacking, cluster hiding) and draw every recorded plate. */
  flush(bars, g, frame) {
    if (this.stamp !== bars.stamp) { this.queue.length = 0; return; }
    const Q = this.queue; if (!Q.length) return;
    Q.sort((a, b) => b.prio - a.prio || a.base - b.base);
    this.focus = this.focusSet(frame);
    // fight = several opposing plates near each other on screen -> compact plates (bar + level only) for every unit
    // that is not focused; names come back on hover / target / out of combat
    let fight = false;
    { const pts = Q.filter((p) => p.kind === 'trainer' || p.kind === 'pet');
      for (let i = 0; i < pts.length && !fight; i++) for (let j = i + 1; j < pts.length; j++) if (pts[i].u.team !== pts[j].u.team && Math.abs(pts[i].cx - pts[j].cx) < 160 * (this.q / 2) && Math.abs(pts[i].base - pts[j].base) < 110 * (this.q / 2)) { fight = true; break; } }
    this.fight = fight;
    const placed = [], todo = [], q = this.q, a0 = g.globalAlpha;
    // party plates: a trainer and its active monster standing together (<= 2.2 m) share the trainer's plate
    const trainerOf = new Map(); for (const p of Q) if (p.kind === 'trainer') trainerOf.set(p.u.id, p);
    for (const p of Q) {
      if (p.kind !== 'pet' || !p.u.alive) continue;
      const tp = trainerOf.get(p.u.mtMon.ownerId);
      if (tp && !tp.pet && tp.u.alive && Math.hypot(p.u.x - tp.u.x, p.u.y - tp.u.y) <= 2.2) { tp.pet = p; p.merged = true; }
    }
    const hit = (m) => { for (const r of placed) if (m.x0 < r.x1 && m.x1 > r.x0 && m.y0 < r.y1 && m.y1 > r.y0) return r; return null; };
    const leaders = [];
    for (const p of Q) {
      if (p.merged) continue;
      // one plate per unit cluster: units whose sprite tops nearly coincide with an already placed (higher
      // priority) plate merge into it as a thin extra HP bar under the leader (max 2), the rest hide
      if (p.kind === 'pet' || p.kind === 'wild' || p.kind === 'minion' || p.kind === 'trainer') {
        const L = leaders.find((l) => Math.abs(l.p.cx - p.cx) < 26 * q && Math.abs(l.p.base - p.base) < 18 * q);
        if (L) {
          if (L.n >= 2 || p.kind === 'minion') continue;
          const lm = L.m, mm = { mini: true, bx: lm.bx, w: lm.w, hh: 2 * q, by: lm.y1 + q + L.n * 3 * q };
          mm.x0 = mm.bx - q; mm.x1 = mm.bx + mm.w + q; mm.y0 = mm.by - q; mm.y1 = mm.by + mm.hh + q;
          L.n++; placed.push(mm); todo.push([p, mm]); continue;
        }
      }
      const m = this.measure(p, frame);
      if (p.kind === 'struct') { placed.push(m); todo.push([p, m]); continue; }
      // search the nearest free slot above or below (bounded); trainers may go higher than pets
      // pets/wild stay anchored to their own sprite: only small nudges (a few px), never stacked far away
      const mon = p.kind === 'pet' || p.kind === 'wild';
      const maxUp = p.kind === 'trainer' ? 14 * q : mon ? 6 * q : 0;   // trainers stay over their unit (small nudge only)
      const maxDown = mon ? 4 * q : 0;
      const probe = (dir, max) => {
        let off = 0; const r = { x0: m.x0, x1: m.x1, y0: m.y0, y1: m.y1 };
        for (let it = 0; it < 8; it++) {
          const hh = hit(r); if (!hh) return off;
          const d = dir < 0 ? (hh.y0 - q) - r.y1 : (hh.y1 + q) - r.y0;
          off += d; r.y0 += d; r.y1 += d; if (Math.abs(off) > max) return null;
        }
        return null;
      };
      let off = hit(m) ? null : 0;
      if (off === null) {
        const up = maxUp ? probe(-1, maxUp) : null, dn = maxDown ? probe(1, maxDown) : null;
        off = up === null ? dn : dn === null ? up : Math.abs(dn) < Math.abs(up) ? dn : up;
      }
      if (off === null) {
        if (p.kind === 'minion' || (p.kind === 'boss' && !m.epic)) continue;               // clutter: hide
        if (mon) {                                                                          // stay on the monster, drop the name
          if (m.name) { m.name = null; m.y0 = m.by - 4 * q; }
          off = 0; if (hit(m) && !m.hint) continue;                                         // still covered: not drawn (never truncated)
        } else off = 0;                                                                     // trainers: stay anchored, overlap allowed (lower-priority plates yield)
      }
      if (off) this.shift(m, off);
      placed.push(m); m.kind = p.kind; m.uid = p.u.id;
      if (p.kind !== 'struct') leaders.push({ p, m, n: 0 });
      todo.push([p, m]);
    }
    // never under HUD panels / toasts / feed / banners: a plate touching one is not drawn at all
    const mask = this.hud.maskRects ? this.hud.maskRects(bars.D || 1) : [];
    // (a trainer plate is only hidden when the trainer itself is under a panel; otherwise it slides out of the mask —
    //  below a banner/top bar, above the bottom dock — and stays on its unit)
    const inside = (x, y, r) => x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3];
    const over = (m) => mask.find((r) => m.x0 < r[2] && m.x1 > r[0] && m.y0 < r[3] && m.y1 > r[1]);
    if (mask.length) for (let i = todo.length - 1; i >= 0; i--) {
      const [p, m] = todo[i]; let r = over(m); if (!r) continue;
      if (p.kind === 'trainer' && !m.mini) {
        const ax = p.cx, ay = p.base + 12 * q;                                   // the unit's head
        if (!mask.some((rr) => inside(ax, ay, rr))) {
          for (let it = 0; it < 3 && r; it++) {
            const down = r[3] + q - m.y0, up = r[1] - q - m.y1;                    // move out of the panel, nearest side to the unit
            this.shift(m, Math.abs(down) <= Math.abs(up) || ay > r[3] ? down : up); r = over(m);
          }
          if (!r) continue;
        }
      }
      todo.splice(i, 1);
    }
    // paint low priority first so trainer plates stay on top where anchored pet bars touch them
    for (let i = todo.length - 1; i >= 0; i--) this.paint(bars, g, todo[i][0], todo[i][1], frame);
    // "this one is yours": a chevron in the local player's colour over each local ACTIVE monster (also when its HP sits in
    // the trainer's party plate) — same marker as on the card portrait. Above the monster's own plate when it has one.
    const own = new Map(); for (const [p, m] of todo) if (p.kind === 'pet' && p.local && !m.mini) own.set(p.u.id, m);
    for (const p of Q) {
      if (p.kind !== 'pet' || !p.local || !p.u.alive) continue;
      // 1.5× the plate scale (it must read at a glance next to a same-species wild monster), bobbing 1–2 px
      const sp = Math.max(2, Math.round(q * 1.5)), cv = chevron(p.col[0]), m = own.get(p.u.id), cw = 9 * sp, ch = 7 * sp;
      const bob = Math.round((Math.sin(performance.now() / 260) * 0.5 + 0.5) * sp);
      const cx = Math.round(p.cx - cw / 2), cy = Math.round((m ? m.y0 - ch - q : p.base - ch - 2 * q) - bob);
      if (mask.some((r) => cx < r[2] && cx + cw > r[0] && cy < r[3] && cy + ch > r[1])) continue;
      g.imageSmoothingEnabled = false; g.drawImage(cv, cx, cy, cw, ch);
      if (bars.onDraw) bars.onDraw(cx - q, cy - q, cx + cw + q, cy + ch + q);
      placed.push({ x0: cx, y0: cy, x1: cx + cw, y1: cy + ch });
    }
    this.lastPlaced = placed;
    // published for in-world combat text (mt/render/fx-numbers.js) so numbers never cover a plate (overlay device px)
    this.rects = placed.map((r) => [r.x0, r.y0, r.x1, r.y1]); this.rectsT = performance.now();
    g.globalAlpha = a0; Q.length = 0;
  }

  paint(bars, g, p, m, frame) {
    const q = this.q, u = p.u, st = p.st, col = p.col;
    g.globalAlpha = p.alpha;
    if (m.mini) {                                                      // merged cluster member: thin bar only
      this.bar(g, m.bx, m.by, m.w, m.hh, q, st, col);
      if (bars.onDraw) bars.onDraw((m.x0 - 2 * q) | 0, (m.y0 - 2 * q) | 0, (m.x1 + 2 * q) | 0, (m.y1 + 2 * q) | 0);
      return;
    }
    if (p.kind === 'trainer') {
      this.bar(g, m.bx, m.by, m.w, m.hh, q, st, col);
      if (p.pet) {   // party row: [type pip] monster HP (thinner), sharing the trainer bar's bottom border
        const pu = p.pet.u, f = FORMS[pu.mtMon.form] || {}, tc = TYPE_COLORS[(f.types && f.types[0]) || pu.mtMon.line] || '#888';
        const ry = m.by + m.hh + 2 * q, px = m.bx;
        g.fillStyle = NAVY; g.fillRect(px - q, ry - q, 5 * q, 5 * q); g.fillStyle = tc; g.fillRect(px, ry, 3 * q, 3 * q);
        g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(px, ry, 3 * q, q);
        this.bar(g, px + 5 * q, ry, m.w - 5 * q, 3 * q, q, p.pet.st, p.pet.col);
      }
      if (m.bt) this.badge(g, m.bx - m.bw - 2 * q, m.by - 3 * q, q, m.bt, NAVY);
      if (m.name) g.drawImage(m.name.c, m.nx, m.ny);
    } else if (p.kind === 'pet' || p.kind === 'wild') {
      this.bar(g, m.bx, m.by, m.w, m.hh, q, st, col);
      const f = FORMS[u.mtMon.form] || {}, tc = TYPE_COLORS[(f.types && f.types[0]) || u.mtMon.line] || '#888';
      this.badge(g, m.bx - 11 * q, m.by - 3 * q, q, String((u.mtMon.rec && u.mtMon.rec.level) || u.level || 1), tc);
      if (m.name) g.drawImage(m.name.c, m.nx, m.ny);
      if (m.hint) this.orbPip(g, m.bx + m.w + 3 * q, m.by - 2 * q, q);
    } else if (p.kind === 'minion') {
      this.bar(g, m.bx, m.by, m.w, m.hh, q, st, col);
    } else if (p.kind === 'boss') {
      this.bar(g, m.bx, m.by, m.w, m.hh, q, st, col, { ticks: m.epic ? 1000 : 0 });
      if (m.name) g.drawImage(m.name.c, m.nx, m.ny);
    } else {
      this.bar(g, m.bx, m.by, m.w, m.hh, q, st, col, { ticks: m.nexus ? 0 : 500 });
      const sx = m.bx - 7 * q, sy = m.by - 2 * q;
      g.fillStyle = NAVY; g.beginPath(); g.moveTo(sx - q, sy - q); g.lineTo(sx + 7 * q, sy - q); g.lineTo(sx + 7 * q, sy + 5 * q); g.lineTo(sx + 3 * q, sy + 9 * q); g.lineTo(sx - q, sy + 5 * q); g.closePath(); g.fill();
      g.fillStyle = col[0]; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + 6 * q, sy); g.lineTo(sx + 6 * q, sy + 4.5 * q); g.lineTo(sx + 3 * q, sy + 7.5 * q); g.lineTo(sx, sy + 4.5 * q); g.closePath(); g.fill();
      g.fillStyle = col[1]; g.fillRect(sx, sy, 6 * q, q);
      if (m.nexus || st.hp < st.maxHp) { const t = this.label(Math.ceil(st.hp) + '', q, false, '#fffdf6'); g.drawImage(t.c, Math.round(m.bx + m.w - t.w + q), m.by - t.h + q); m.y0 = Math.min(m.y0, m.by - t.h); }
    }
    const pad = 2 * q;
    if (bars.onDraw) bars.onDraw((m.x0 - pad) | 0, (m.y0 - pad - (m.hint ? 8 * q : 0)) | 0, (m.x1 + pad + (m.hint ? 6 * q : 0)) | 0, (m.y1 + pad) | 0);
  }
  orbPip(g, ox, oy, q) {
    const r = 3 * q, pulse = (performance.now() / 400) % 1, a = g.globalAlpha;
    g.fillStyle = NAVY; g.beginPath(); g.arc(ox + r, oy + r, r + q, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ef5243'; g.beginPath(); g.arc(ox + r, oy + r, r, Math.PI, 0); g.fill();
    g.fillStyle = '#fffdf6'; g.beginPath(); g.arc(ox + r, oy + r, r, 0, Math.PI); g.fill();
    g.fillStyle = NAVY; g.fillRect(ox, oy + r - (q >> 1), 2 * r, q); g.fillStyle = '#fffdf6'; g.fillRect(ox + r - q, oy + r - q, 2 * q, 2 * q);
    g.globalAlpha = a * (1 - pulse); g.strokeStyle = '#ffd23a'; g.lineWidth = q; g.beginPath(); g.arc(ox + r, oy + r, r + q + pulse * 4 * q, 0, Math.PI * 2); g.stroke(); g.globalAlpha = a;
  }
  bounds(st, x0, y0, x1, y1) {
    st.vx0 = x0; st.vy0 = y0; st.vx1 = x1; st.vy1 = y1;
    st.bx0 = x0; st.by0 = y0; st.bx1 = x1; st.by1 = y1;
    st.ttop = y0; st.tcx = (x0 + x1) / 2; st.thw = (x1 - x0) / 2;
  }
}
