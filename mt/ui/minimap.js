// mt/ui/minimap.js — Gen-5 styled minimap (DESIGN §14): pixel-art terrain painted from the map SDF (lanes, river,
// jungle, brush, bases), then a device-resolution layer with fog, structures (+HP), element camps, wild monsters,
// pets, trainer portraits, camera frustum and pings. LMB drag = look, RMB = move (Shift = attack-move),
// Alt/Ctrl+LMB = ping. Owner: HUD.

import { h, pxCanvas } from './dom.js';
import * as art from './art.js';
import { a as LANES, u as RIVER, v as WALK, n as BRUSH, t as BASES, l as PITS } from '../../assets/map-oE9sOnNc.js';
import { TYPE_COLORS } from '../data/types.js';
import { tr } from './tr.js'; // i18n

const N = 88;            // minimap size in HUD px (terrain is painted at 1 sample per HUD px)
const WORLD = 120;
const C = {
  wall: [86, 160, 70], wallD: [52, 118, 52], wallEdge: [36, 84, 46], grass: [150, 214, 104], grassD: [128, 198, 92],
  lane: [238, 222, 164], laneD: [214, 192, 128], water: [96, 186, 244], waterL: [160, 222, 255], waterD: [58, 140, 214],
  brush: [74, 150, 64], blue: [196, 220, 255], red: [255, 212, 200],
};
const ALLY = '#3b86f2', ENEMY = '#ef5243', NAVY = '#1b2350';

function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
  let t = L > 0 ? ((px - ax) * dx + (py - ay) * dy) / L : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
  return Math.hypot(px - ax - dx * t, py - ay - dy * t);
}
function laneDist(x, y) {
  let d = 1e9;
  for (const k in LANES) { const P = LANES[k]; for (let i = 0; i < P.length - 1; i++) d = Math.min(d, segDist(x, y, P[i].x, P[i].y, P[i + 1].x, P[i + 1].y)); }
  return d;
}

let TERRAIN = null;
function paintTerrain() {
  if (TERRAIN) return TERRAIN;
  const c = pxCanvas(N, N), g = c.getContext('2d'), img = g.createImageData(N, N), d = img.data;
  const k = WORLD / N, walk = new Float32Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) walk[y * N + x] = WALK((x + 0.5) * k, (y + 0.5) * k);
  const put = (i, col) => { d[i * 4] = col[0]; d[i * 4 + 1] = col[1]; d[i * 4 + 2] = col[2]; d[i * 4 + 3] = 255; };
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = y * N + x, wx = (x + 0.5) * k, wy = (y + 0.5) * k, w = walk[i];
    if (w <= 0) {
      let edge = false;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < N && yy < N && walk[yy * N + xx] > 0) edge = true; }
      put(i, edge ? C.wallEdge : ((x * 7 + y * 13) % 11 === 0 ? C.wallD : C.wall));
      continue;
    }
    let col = (x + y) % 2 ? C.grass : C.grassD;
    const ld = laneDist(wx, wy);
    if (ld < 4.2) col = ld > 3.3 ? C.laneD : C.lane;
    for (const b of BASES) { const bd = Math.hypot(wx - b.x, wy - b.y); if (bd < b.radius) { const base = b.team === 0 ? C.blue : C.red; col = ld < 4.2 ? col.map((v, j) => (v + base[j]) >> 1) : base; } }
    const rd = segDist(wx, wy, RIVER.a.x, RIVER.a.y, RIVER.b.x, RIVER.b.y);
    if (rd < RIVER.halfWidth) col = rd > RIVER.halfWidth - 1.1 ? C.waterD : rd < 1.2 ? C.waterL : C.water;
    for (const p of PITS) { const pd = Math.hypot(wx - p.x, wy - p.y); if (pd < p.radius && pd > p.radius - 1.3) col = C.waterD; }
    for (const b of BRUSH) if (Math.hypot(wx - b.x, wy - b.y) < b.r + 0.4) col = C.brush;
    put(i, col);
  }
  g.putImageData(img, 0, 0);
  TERRAIN = c;
  return c;
}

export class Minimap {
  relang() { this.hint.textContent = tr('hud.mmHint', 'drag: look  RMB: move'); } // i18n
  constructor(hud) {
    this.hud = hud; this.app = hud.app;
    this.terr = pxCanvas(N, N, 'terr');
    this.dyn = document.createElement('canvas'); this.dyn.className = 'dyn';
    this.hint = h('span.mmhint', { text: tr('hud.mmHint', 'drag: look  RMB: move') });
    this.el = h('div.pn.mmap', null, this.terr, this.dyn, this.hint);
    this.g = this.dyn.getContext('2d');
    this.pings = []; this.t = 0; this.size = 0; this.painted = false;
    this.fogCv = null; this.fogT = 0; this.look = null; this.prevMode = null; this._pt = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }];
    this.bindInput();
  }
  rig() { const p = this.app.pipeline; return p && p.cameraRig; }
  toWorld(e) {
    const r = this.dyn.getBoundingClientRect();
    return { x: Math.max(0, Math.min(WORLD, ((e.clientX - r.left) / r.width) * WORLD)), y: Math.max(0, Math.min(WORLD, ((e.clientY - r.top) / r.height) * WORLD)) };
  }
  bindInput() {
    const el = this.el;
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    el.addEventListener('pointerdown', (e) => {
      const app = this.app; if (app.state !== 'game' || !app.world) return;
      e.preventDefault(); e.stopPropagation();
      const p = this.toWorld(e);
      const me = this.hud.primaryUnitId();
      if (e.button === 2 && e.pointerType === 'mouse') { app.world.command(me, e.shiftKey ? { type: 'attackMove', x: p.x, y: p.y } : { type: 'move', x: p.x, y: p.y }); this.ping(p.x, p.y, '#ffffff', 0.6); return; }
      if (e.altKey || e.ctrlKey) { app.world.command(me, { type: 'ping', x: p.x, y: p.y, kind: 'danger' }); return; }
      const rig = this.rig(); if (!rig) return;
      if (!this.look) this.prevMode = rig.mode;
      this.look = { id: e.pointerId }; rig.mode = 'free'; rig.setFocus(p.x, p.y, true);
      try { el.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    });
    el.addEventListener('pointermove', (e) => { if (!this.look || e.pointerId !== this.look.id) return; const p = this.toWorld(e); const rig = this.rig(); if (rig) rig.setFocus(p.x, p.y, true); });
    const up = (e) => { if (!this.look || e.pointerId !== this.look.id) return; this.look = null; const rig = this.rig(); if (rig) rig.mode = this.prevMode && this.prevMode !== 'free' ? this.prevMode : 'follow'; };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  }
  ping(x, y, col, life = 2.5) { this.pings.push({ x, y, col, t: 0, life }); if (this.pings.length > 10) this.pings.shift(); }

  resize(u) {
    const dpr = window.devicePixelRatio || 1, px = Math.round(N * u * dpr);
    if (px !== this.size) { this.size = px; this.dyn.width = this.dyn.height = px; }
    if (!this.painted) { this.painted = true; const t = paintTerrain(); this.terr.getContext('2d').drawImage(t, 0, 0); }
  }

  update(f, dt) {
    const w = f.world, app = this.app; if (!w) return;
    for (const ev of f.events || []) if (ev.type === 'ping' && ev.team === f.viewerTeam) this.ping(ev.x, ev.y, ev.kind === 'danger' ? '#ff5a4a' : '#ffd23a');
    for (let i = this.pings.length - 1; i >= 0; i--) { this.pings[i].t += dt; if (this.pings[i].t > this.pings[i].life) this.pings.splice(i, 1); }
    this.t += dt; if (this.t < 1 / 20) return; this.t = 0;
    const g = this.g, S = this.size / WORLD, team = f.viewerTeam, k = this.size / N; // k = device px per HUD px
    g.clearRect(0, 0, this.size, this.size);
    // fog of war
    const vis = app.pipeline && app.pipeline.vision;
    if (vis && vis.data && vis.size) {
      this.fogT -= 1;
      if (!this.fogCv || this.fogCv.width !== vis.size) { this.fogCv = document.createElement('canvas'); this.fogCv.width = this.fogCv.height = vis.size; this.fogImg = this.fogCv.getContext('2d').createImageData(vis.size, vis.size); this.fogT = 0; }
      if (this.fogT <= 0) {
        this.fogT = 5; const s = vis.data, d = this.fogImg.data;
        for (let i = 0, j = 0; i < s.length; i++, j += 4) { d[j] = 20; d[j + 1] = 28; d[j + 2] = 70; d[j + 3] = (255 - s[i]) * 0.42; }
        this.fogCv.getContext('2d').putImageData(this.fogImg, 0, 0);
      }
      g.imageSmoothingEnabled = true; g.drawImage(this.fogCv, 0, 0, this.size, this.size);
    }
    g.imageSmoothingEnabled = false;
    const disc = (x, y, r, fill, stroke, lw) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.lineWidth = lw || k; g.strokeStyle = stroke; g.stroke(); } };
    // camps (habitats by element, meadows, boss pit)
    if (w.campState) for (const st of w.campState.values()) {
      const c = st.camp, x = c.x * S, y = c.y * S, alive = st.unitIds && st.unitIds.length > 0;
      if (c.mtLine || c.mtMeadow) {
        const ty = c.mtLine || null, col = ty ? TYPE_COLORS[ty] : '#ffffff';
        if (!alive) { disc(x, y, 2.2 * k, 'rgba(255,255,255,.35)', 'rgba(27,35,80,.55)', k * 0.75); continue; }
        if (ty) { const ic = art.typeIcon(ty, 12); if (ic) { g.drawImage(ic, Math.round(x - 4.5 * k), Math.round(y - 4.5 * k), Math.round(9 * k), Math.round(9 * k)); continue; } }
        disc(x, y, 3 * k, col, NAVY, k);
      } else if (c.epic) {
        disc(x, y, 4.2 * k, alive ? '#b07cff' : 'rgba(176,124,255,.35)', NAVY, k);
        g.fillStyle = '#fff'; g.font = `${Math.round(10 * k)}px 'Vale Pixel Bold'`; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
        g.fillText('★', Math.round(x), Math.round(y + 3.5 * k));
      }
    }
    // structures with HP
    for (const s of w.structures || []) {
      if (s.kind === 'fountain') continue;
      const x = Math.round(s.x * S), y = Math.round(s.y * S), col = s.team === team ? ALLY : ENEMY;
      const r = (s.kind === 'nexus' ? 3.4 : s.kind === 'inhibitor' ? 2 : 1.8) * k;
      if (!s.alive) { g.fillStyle = 'rgba(27,35,80,.45)'; g.fillRect(x - r * 0.7, y - r * 0.7, r * 1.4, r * 1.4); continue; }
      g.save(); g.translate(x, y); if (s.kind !== 'tower') g.rotate(Math.PI / 4);
      g.fillStyle = NAVY; g.fillRect(-r - k, -r - k, 2 * r + 2 * k, 2 * r + 2 * k);
      g.fillStyle = col; g.fillRect(-r, -r, 2 * r, 2 * r);
      g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(-r, -r, 2 * r, k);
      g.restore();
      const fr = s.hp / Math.max(1, s.maxHp);
      if (fr < 0.999) { const bw = 7 * k, bx = x - bw / 2, by = y + r + 1.5 * k; g.fillStyle = NAVY; g.fillRect(bx - k * 0.5, by - k * 0.5, bw + k, 2 * k + k); g.fillStyle = fr > 0.5 ? '#47cf4a' : fr > 0.2 ? '#f7c623' : '#ef4a3a'; g.fillRect(bx, by, bw * fr, 2 * k); }
    }
    // units
    const locals = this.hud.localIds();
    const trainers = [];
    for (const u of w.unitList) {
      if (!u.alive || (app.mtSees ? !app.mtSees(u) : (u.visible && u.visible[team] === false))) continue;
      const x = u.x * S, y = u.y * S;
      if (u.kind === 'minion') { g.fillStyle = u.team === team ? '#2f6fe0' : '#d8392b'; g.fillRect(Math.round(x - k), Math.round(y - k), Math.ceil(2 * k), Math.ceil(2 * k)); }
      else if (u.mtTrainer) trainers.push(u);
      else if (u.mtMon) {
        const owned = u.mtMon.ownerId >= 0, el = TYPE_COLORS[u.mtMon.types ? u.mtMon.types[0] : u.mtMon.line] || '#ccc';
        if (owned) disc(x, y, 2.1 * k, el, u.team === team ? ALLY : ENEMY, 1.2 * k);
        else disc(x, y, 1.8 * k, el, '#ffffff', 0.9 * k);
      } else if (u.kind === 'monster') disc(x, y, (u.epic ? 3.4 : 2) * k, u.epic ? '#b07cff' : '#e8b43c', NAVY, k);
    }
    // camera frustum
    const rig = this.rig();
    if (rig && rig.screenToGround) {
      const cv = app.pipeline.renderer && app.pipeline.renderer.domElement; const r = cv ? cv.getBoundingClientRect() : { left: 0, top: 0, right: innerWidth, bottom: innerHeight };
      const P = this._pt; let ok = true;
      for (let i = 0; i < 4; i++) { try { rig.screenToGround(i === 1 || i === 2 ? r.right : r.left, i >= 2 ? r.bottom : r.top, P[i]); } catch { ok = false; } }
      if (ok) {
        g.beginPath(); for (let i = 0; i < 4; i++) { const px = Math.max(0, Math.min(WORLD, P[i].x)) * S, py = Math.max(0, Math.min(WORLD, P[i].y)) * S; i ? g.lineTo(px, py) : g.moveTo(px, py); }
        g.closePath(); g.fillStyle = 'rgba(255,255,255,.10)'; g.fill(); g.lineWidth = k; g.strokeStyle = 'rgba(255,255,255,.9)'; g.stroke();
      }
    }
    // trainers last (portrait discs)
    trainers.sort((a, b) => (locals.has(a.id) ? 1 : 0) - (locals.has(b.id) ? 1 : 0));
    for (const u of trainers) {
      const x = Math.round(u.x * S), y = Math.round(u.y * S), r = 5 * k, L = locals.get(u.id);
      const ring = L ? L.color : u.team === team ? ALLY : ENEMY;
      disc(x, y, r + 1.5 * k, NAVY); disc(x, y, r + 0.5 * k, ring);
      g.save(); g.beginPath(); g.arc(x, y, r - 0.5 * k, 0, Math.PI * 2); g.clip();
      g.fillStyle = u.team === team ? '#cfe2ff' : '#ffd5cf'; g.fillRect(x - r, y - r, 2 * r, 2 * r);
      const b = art.bust(art.trainerSpriteId(u.mtTrainer.spec, u.team), 16); if (b) g.drawImage(b, Math.round(x - r), Math.round(y - r), Math.round(2 * r), Math.round(2 * r));
      g.restore();
    }
    // pings
    for (const p of this.pings) {
      const a = 1 - p.t / p.life, rr = (2 + (p.t % 0.8) * 10) * k;
      g.globalAlpha = Math.max(0, a); disc(p.x * S, p.y * S, rr, null, p.col, 1.5 * k); disc(p.x * S, p.y * S, 2 * k, p.col); g.globalAlpha = 1;
    }
  }
}
