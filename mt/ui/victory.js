// mt/ui/victory.js — VICTORY / DEFEAT screen (DESIGN §10/§14). Owner: HUD.
//
// One centred hero composition on the HUD pixel grid (1 art px = 1 HUD px = k device px):
//   * backdrop = the LIVE scene behind (CSS backdrop blur + warm / cool grade), slow light rays from behind the heroes,
//     a vignette; no painted sky, nothing busy;
//   * the WINNING team on three stone pedestals: each trainer with its active monster (native re-raster of the art
//     agent's rig via renderShowcase, animated idle, moving rim light, contact shadows), the local player (or the
//     winners' MVP) in the middle and larger, the side pairs mirrored to face the centre; a caption under each pair;
//   * pixel confetti (victory) / drifting motes (defeat) only inside the hero area and behind the sprites — never over
//     text; title ribbon + subtitle (with time and KOs) on top, a medal row sized to the medals actually won;
//   * buttons: Stats (△ / Tab — the full table in an overlay), Main menu (○ / Esc), Play again (✕ / Enter); ←/→ focus,
//     act on release, ignores input for the first 1.2 s; every button >= 48 CSS px on touch.

import { h, setCls, pxCanvas, fmtTime } from './dom.js';
import * as art from './art.js';
import { glyphHTML } from './glyphs.js';
import { tr } from './tr.js';
import { FORMS } from '../data/species.js';
import { SPECIES_ART, renderShowcase } from '../../art/sprites/index.js';

const SPEC_SHORT = { attack: () => tr('spec.attack', 'Attack'), healing: () => tr('spec.healing', 'Healing'), magic: () => tr('spec.magic', 'Magic') };
const trainersOf = (w, team) => (w.champions || []).filter((c) => c.team === team && c.mtTrainer).sort((a, b) => a.id - b.id);
const hex = (c) => { const n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };

const PAL = {
  win: { stone: ['#b8aea0', '#ddd4c2', '#8a8070', '#5e564c'], rim: [255, 236, 170], confetti: ['#ffd23a', '#ef5243', '#3b86f2', '#4cd04a', '#ffffff', '#ff8ad8'] },
  loss: { stone: ['#7a7a90', '#9c9cb4', '#5a5a70', '#3e3e52'], rim: [190, 205, 255], confetti: ['#9aa8e0'] },
};

function paintPedestal(w, win) {
  const P = win ? PAL.win : PAL.loss, [m, l, dk, ddk] = P.stone.map(hex), H = 18, c = pxCanvas(w, H), g = c.getContext('2d'), img = g.createImageData(w, H), d = img.data;
  const cx = w / 2, rx = w / 2 - 1, ry = 6;
  for (let y = 0; y < H; y++) for (let x = 0; x < w; x++) {
    const nx = (x + 0.5 - cx) / rx; if (Math.abs(nx) > 1) continue;
    const topY = ry - Math.sqrt(1 - nx * nx) * ry, botY = H - 1 - ry + Math.sqrt(1 - nx * nx) * ry;
    if (y < topY || y > botY) continue;
    const i = (y * w + x) * 4; let col;
    const onTop = y < ry * 2 - topY;
    if (onTop) col = y - topY < 1 ? l : (Math.abs(nx) > 0.92 ? dk : m);
    else col = botY - y < 1 ? ddk : (nx < -0.2 ? m : nx < 0.5 ? dk : ddk);
    if (!onTop && (x % 9 === 0)) col = ddk;
    d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}


/**
 * Faux normal map for a pixel sprite: for opaque pixels within 3 px of the silhouette edge, the normal points from
 * the body toward the nearby transparent pixels (a soft 2D bevel). relight() then adds a moving rim/key light
 * (direction L) to those edge pixels every few frames — dynamic lighting without art-side normal maps.
 */
function prepLit(src) {
  const W = src.width, H = src.height, g = src.getContext('2d'), base = g.getImageData(0, 0, W, H).data;
  const idx = [], nx = [], ny = [], wt = [];
  const A = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : base[(y * W + x) * 4 + 3]);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x; if (!base[i * 4 + 3]) continue;
    const lum = base[i * 4] * 0.3 + base[i * 4 + 1] * 0.59 + base[i * 4 + 2] * 0.11; if (lum < 36) continue;   // outline stays dark
    let sx = 0, sy = 0, dmin = 9;
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
      if (!dx && !dy) continue; const d2 = dx * dx + dy * dy; if (d2 > 10) continue;
      if (!A(x + dx, y + dy)) { sx += dx / d2; sy += dy / d2; dmin = Math.min(dmin, Math.sqrt(d2)); }
    }
    if (dmin > 3.2) continue;
    const l = Math.hypot(sx, sy) || 1; idx.push(i); nx.push(sx / l); ny.push(sy / l); wt.push(Math.max(0, 1 - (dmin - 1) / 2.6));
  }
  const out = document.createElement('canvas'); out.width = W; out.height = H;
  return { canvas: out, W, H, base, idx: Int32Array.from(idx), nx: Float32Array.from(nx), ny: Float32Array.from(ny), wt: Float32Array.from(wt), img: new ImageData(W, H), width: W, height: H };
}
function relight(L, ang, rim, strength) {
  const d = L.img.data; d.set(L.base);
  const lx = Math.cos(ang), ly = Math.sin(ang);
  for (let k = 0; k < L.idx.length; k++) {
    const f = (L.nx[k] * lx + L.ny[k] * ly) * L.wt[k]; if (f <= 0.15) continue;
    const i = L.idx[k] * 4, t = Math.min(1, (f - 0.15) * 1.6) * strength;
    d[i] += (rim[0] - d[i]) * t; d[i + 1] += (rim[1] - d[i + 1]) * t; d[i + 2] += (rim[2] - d[i + 2]) * t;
  }
  L.canvas.getContext('2d').putImageData(L.img, 0, 0);
  return L.canvas;
}

// ------------------------------------------------------------------------------------------------ ornaments
let FRAME_URL = null;
function frameURL() {
  if (FRAME_URL) return FRAME_URL;
  const N = 16, c = pxCanvas(N, N), g = c.getContext('2d'), px = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const e = Math.min(x, y, N - 1 - x, N - 1 - y);
    const col = e === 0 ? '#1b2350' : e === 1 ? (x < N / 2 && y < N / 2 ? '#fff1a8' : '#f0c14a') : e === 2 ? '#c88a1c' : e === 3 ? '#1b2350' : e === 4 ? '#ffffff' : '#fbf6e9';
    // rounded outer corners
    if ((x === 0 || x === N - 1) && (y === 0 || y === N - 1)) continue;
    px(x, y, col);
  }
  // corner rivets (diamonds)
  for (const [cx, cy] of [[2, 2], [N - 3, 2], [2, N - 3], [N - 3, N - 3]]) { px(cx, cy, '#fff8d0'); }
  FRAME_URL = c.toDataURL();
  return FRAME_URL;
}

function headIcon(kind) {
  const pat = MEDAL_ICON[kind], hgt = pat.length, wid = pat[0].length, c = pxCanvas(wid, hgt), g = c.getContext('2d');
  for (let y = 0; y < hgt; y++) for (let x = 0; x < wid; x++) { const ch = pat[y][x]; if (ch === '.') continue; g.fillStyle = ch === 'r' ? '#ef5243' : ch === 'w' ? '#fffdf6' : ch === 'y' ? '#ffd23a' : '#5a6490'; g.fillRect(x, y, 1, 1); }
  c.style.width = wid + 'px'; c.style.height = hgt + 'px';
  return c;
}
const MEDAL_ICON = {
  star: ['....#....', '...###...', '#########', '.#######.', '..#####..', '.###.###.', '.##...##.'],
  orb: ['..#####..', '.#rrrrr#.', '#rrrrrrr#', '####w####', '#wwwwwww#', '.#wwwww#.', '..#####..'],
  sword: ['......##', '.....###', '....###.', '#..###..', '.####...', '..##....', '.#.#....', '#.......'],
  flame: ['...#.....', '...##....', '..###.#..', '..#####..', '.#######.', '.###y###.', '..#yyy#..', '...###...'],
  up: ['...#...', '..###..', '.#####.', '#######', '..###..', '..###..', '..###..'],
  heart: ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'],
  faint: ['.#####.', '#######', '#.##.##', '#######', '.#####.', '.#.#.#.'],
};
function paintMedal(kind, tier) {
  const W = 18, H = 22, c = pxCanvas(W, H), g = c.getContext('2d');
  const T = { gold: ['#7a4c00', '#c88a1c', '#f0c14a', '#fff1a8'], silver: ['#3e4466', '#8a92b8', '#cdd3ee', '#ffffff'], bronze: ['#5a2e10', '#a8622c', '#e09a5a', '#ffd8b0'] }[tier];
  const rib = { gold: ['#e04b3a', '#ffd23a'], silver: ['#3b86f2', '#fffdf6'], bronze: ['#4cb848', '#fffdf6'] }[tier];
  // ribbon (V tails)
  for (let y = 0; y < 8; y++) for (let x = 4; x < 14; x++) {
    const left = x < 9, sx = left ? x - 4 : 13 - x, ok = sx >= 0 && sx < 4 - (y > 5 ? (y - 5) : 0);
    if (!ok) continue; g.fillStyle = (x % 2) ? rib[0] : rib[1]; g.fillRect(x, y, 1, 1);
  }
  g.fillStyle = '#1b2350'; g.fillRect(4, 0, 10, 1);
  // disc with banded metal + outline
  const cx = 9, cy = 13.5, R = 8;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const r = Math.hypot(x + 0.5 - cx, y + 0.5 - cy); if (r > R) continue;
    const lit = ((cx - x) + (cy - y)) / R;   // up-left light
    g.fillStyle = r > R - 1 ? '#1b2350' : r > R - 2 ? (lit > 0.2 ? T[3] : T[1]) : lit > 0.9 ? T[3] : lit > -0.3 ? T[2] : T[1];
    g.fillRect(x, y, 1, 1);
  }
  const ic = MEDAL_ICON[kind], ih = ic.length, iw = ic[0].length, ox = Math.round(cx - iw / 2), oy = Math.round(cy - ih / 2);
  for (let y = 0; y < ih; y++) for (let x = 0; x < iw; x++) {
    const ch = ic[y][x]; if (ch === '.') continue;
    g.fillStyle = ch === 'r' ? '#ef5243' : ch === 'w' ? '#fffdf6' : ch === 'y' ? '#ffd23a' : T[0];
    g.fillRect(ox + x, oy + y, 1, 1);
  }
  return c;
}

// ------------------------------------------------------------------------------------------------ screen
export class EndScreen {
  constructor(hud) {
    this.hud = hud; this.app = hud.app; this.el = h('div.end2', { hidden: true }); this.world = null; this.prevPad = 0;
    this._key = (e) => this.key(e); addEventListener('keydown', this._key, true); addEventListener('keyup', this._key, true);
    this.t = 0; this.counters = []; this.slots = []; this.particles = [];
  }
  hide() { this.el.hidden = true; this.world = null; this.slots = []; this.particles = []; }
  dispose() { removeEventListener('keydown', this._key, true); removeEventListener('keyup', this._key, true); }

  /** Pick the medals: [kind, tier, title, trainer, value text]. */
  medals(w, stats) {
    const all = (w.champions || []).filter((c) => c.mtTrainer);
    const best = (f, allowZero) => { let b = null, bv = -Infinity; for (const u of all) { const v = f(u); if (v > bv) { bv = v; b = u; } } return bv > 0 || (allowZero && b) ? [b, bv] : [null, 0]; };
    const S = (u) => stats.of(u.id), ko = (u) => (u.kills || 0) + S(u).monKOs;
    const score = (u) => ko(u) * 3 + S(u).captures * 2 + S(u).evolutions * 2 + S(u).dmg / 1500 - (u.deaths || 0);
    const out = [];
    const [mvp] = best(score, true); if (mvp) out.push(['star', 'gold', tr('end.medal.mvp', 'MVP'), mvp, tr('end.val.ko', '{n} KO', { n: ko(mvp) })]);
    const [ck, cv] = best((u) => S(u).captures); if (ck) out.push(['orb', 'silver', tr('end.medal.catcher', 'Catcher'), ck, tr('end.val.caught', '{n} caught', { n: cv })]);
    const [kk, kv] = best(ko); if (kk) out.push(['sword', 'bronze', tr('end.medal.topko', 'Top KO'), kk, tr('end.val.ko', '{n} KO', { n: kv })]);
    const [dk, dv] = best((u) => S(u).dmg); if (dk) out.push(['flame', 'silver', tr('end.medal.damage', 'Damage'), dk, (Math.round(dv / 100) / 10) + 'k']);
    const [ek, ev] = best((u) => S(u).evolutions); if (ek) out.push(['up', 'bronze', tr('end.medal.evolver', 'Evolver'), ek, tr('end.val.evo', '{n} evo', { n: ev })]);
    return out.slice(0, 5);
  }

  /** The winning team's trainers, ordered [left, centre, right]: the local player (or the winners' MVP) in the centre. */
  heroes(w, stats, team) {
    const T = trainersOf(w, team); if (!T.length) return [];
    const L = this.hud.localMap(), S = (u) => stats.of(u.id);
    const score = (u) => ((u.kills || 0) + S(u).monKOs) * 3 + S(u).captures * 2 + S(u).evolutions * 2 + S(u).dmg / 1500 - (u.deaths || 0);
    const star = T.find((u) => L.has(u.id)) || T.slice().sort((a, b) => score(b) - score(a))[0];
    const rest = T.filter((u) => u !== star);
    return rest.length >= 2 ? [rest[0], star, rest[1]] : rest.length === 1 ? [rest[0], star] : [star];
  }

  build(w, f, stats) {
    this.world = w; this.t = 0; this.counters = []; this.slots = []; this.particles = []; this.statsOpen = false;
    const view = f.viewerTeam === 1 ? 1 : 0, win = w.winner === view, hud = this.hud;
    const u = hud.u || 2, W = Math.ceil(innerWidth / u), H = Math.ceil(innerHeight / u);
    // touch: keep the content clear of the notch / home bar (safe-area insets, whole HUD px)
    const sa = hud.touch && hud.safeArea ? hud.safeArea() : { l: 0, r: 0, t: 0, b: 0 };
    const sl = Math.ceil(sa.l / u), sr = Math.ceil(sa.r / u), st = Math.ceil(sa.t / u), sb = Math.ceil(sa.b / u);
    this.el.className = 'end2 ' + (win ? 'win' : 'loss'); this.el.innerHTML = '';
    this.W = W; this.H = H; this.win = win;
    const cx = sl + Math.round((W - sl - sr) / 2), CW = Math.min(W - sl - sr - 12, 560);
    const medals = this.medals(w, stats), kos = [stats.score(w, view), stats.score(w, 1 - view)];
    // vertical rhythm (centred as a block on tall screens): title + subtitle | heroes on pedestals | captions |
    // medal row | buttons
    const HERO_MAX = 170, need = 58 + HERO_MAX + 44 + (medals.length ? 30 : 0) + 30 + 12;
    const offY = Math.max(0, Math.floor((H - st - sb - need) / 2));
    const titleTop = 6 + st + offY, heroTop = titleTop + 60, btnY = H - sb - offY - 6 - 24;
    const medalY = medals.length ? btnY - 6 - 24 : btnY, groundY = medalY - 44;   // captions (2 lines) + a gap above the medals
    const heroH = Math.max(48, Math.min(HERO_MAX, groundY - heroTop));
    // ---- backdrop: live scene (blurred + graded), light rays behind the heroes, a pool of light, vignette
    const rays = h('div.vrays'), rs = Math.round(Math.max(W, H) * 1.25);
    rays.style.left = cx + 'px'; rays.style.top = Math.round(groundY - heroH * 0.6) + 'px'; rays.style.setProperty('--rs', rs + 'px');
    const pool = h('div.vpool'); pool.style.left = cx + 'px'; pool.style.top = groundY + 'px'; pool.style.width = Math.round(CW * 1.05) + 'px';
    this.el.append(h('div.vscene'), h('div.vtint'), rays, pool, h('div.vvig'));
    // ---- confetti / motes: only inside the hero area, behind the sprites
    const zx = cx - Math.round(CW / 2), zy = heroTop - 6, zw = CW, zh = Math.max(20, groundY + 10 - zy);
    this.fx = pxCanvas(zw, zh, 'vfx'); Object.assign(this.fx.style, { left: zx + 'px', top: zy + 'px', width: zw + 'px', height: zh + 'px' });
    this.zone = { w: zw, h: zh }; this.el.appendChild(this.fx);
    // ---- the winners on pedestals
    const L = hud.localMap(), heroes = this.heroes(w, stats, w.winner), n = heroes.length;
    const pos = n >= 3 ? [-1, 0, 1] : n === 2 ? [-0.6, 0.6] : [0], starIdx = n >= 2 ? 1 : 0;
    const spread = Math.round(Math.min(CW * 0.34, 190));
    const stage = h('div.vstage');
    heroes.forEach((tu, i) => {
      const star = i === starIdx, sc = star ? 1 : 0.76, side = pos[i] < 0 ? -1 : pos[i] > 0 ? 1 : 0;
      const pcx = cx + Math.round(pos[i] * spread), gy = groundY - (star ? 0 : 10), pw = Math.round((star ? 0.36 : 0.28) * CW);
      const T = tu.mtTrainer, act = T.party[T.activeIdx] || T.party[0] || null;
      const ped = paintPedestal(Math.round(pw * 0.9), win); ped.className = 'px vped';
      Object.assign(ped.style, { width: ped.width + 'px', height: ped.height + 'px', left: Math.round(pcx - ped.width / 2) + 'px', top: (gy - 6) + 'px', zIndex: star ? 3 : 1 });
      stage.appendChild(ped);
      // trainer on the outer side (in front), monster toward the centre; the right pair is mirrored to face inward
      const outer = side === 0 ? -1 : side, z = star ? 4 : 2;
      const monH = Math.round(Math.min(150, heroH * 0.92) * sc), trH = Math.round(Math.min(80, heroH * 0.54) * sc);
      if (act) this.addSlot(stage, act.form, monH, pcx - Math.round(outer * pw * 0.1), gy + 2, z, side > 0, star);
      this.addSlot(stage, art.trainerSpriteId(T.spec, tu.team), trH, pcx + Math.round(outer * pw * (act ? 0.27 : 0)), gy + 2, z + 1, side > 0, false);
      const sub = act ? FORMS[act.form].name + ' Lv' + act.level : (SPEC_SHORT[T.spec] ? SPEC_SHORT[T.spec]() : '');
      const cap = h('div.vcap' + (L.has(tu.id) ? '.me' : ''), null, h('b', { text: tu.name }), h('span', { text: sub }));
      Object.assign(cap.style, { left: pcx + 'px', top: (gy + 14) + 'px', zIndex: 6 });
      stage.appendChild(cap);
    });
    this.el.appendChild(stage);
    // ---- title ribbon + subtitle (time + KOs)
    const title = h('div.vtitle', null, h('span', { text: win ? tr('end.victory', 'VICTORY!') : tr('end.defeat', 'DEFEAT') }));
    Object.assign(title.style, { left: cx + 'px', top: titleTop + 'px' });
    const sub = h('div.vsub', null, h('span', { text: win ? tr('end.subWin', 'The enemy Nexus has fallen!') : tr('end.subLoss', 'Your Nexus has fallen…') }),
      h('span.vk', { text: tr('end.vphR', '{time} · KOs {a}–{b}', { time: fmtTime(w.time), a: kos[0], b: kos[1] }) }));
    Object.assign(sub.style, { left: cx + 'px', top: (titleTop + 40) + 'px' });
    this.el.append(title, sub);
    // ---- medal row: exactly the medals won
    if (medals.length) {
      const mrow = h('div.vmedals2'); Object.assign(mrow.style, { left: cx + 'px', top: medalY + 'px', maxWidth: (W - sl - sr - 8) + 'px' });
      for (const [kind, tier, label, who, val] of medals) {
        const m = paintMedal(kind, tier); m.style.width = m.width + 'px'; m.style.height = m.height + 'px';
        mrow.appendChild(h('div.vmd' + (who.team === view ? '.a' : '.e'), { title: `${label}: ${who.name} (${val})` }, m,
          h('div.vmt', null, h('b', { text: label }), h('span.who', { text: who.name }))));
      }
      this.el.appendChild(mrow);
    }
    // ---- buttons: Stats · Main menu · Play again
    const again = h('div.vbtn.primary.focus', { role: 'button', 'data-play': true, html: `<span>${tr('end.again', 'Play again')}</span><span class="g"></span><i class="hit"></i>` });
    const menu = h('div.vbtn.secondary', { role: 'button', 'data-play': true, html: `<span>${tr('end.menu', 'Main menu')}</span><span class="g"></span><i class="hit"></i>` });
    const sbtn = h('div.vbtn.secondary.vst', { role: 'button', 'data-play': true, html: `<span>${tr('end.stats', 'Stats')}</span><span class="g"></span><i class="hit"></i>` });
    again.addEventListener('click', () => this.playAgain()); menu.addEventListener('click', () => this.mainMenu()); sbtn.addEventListener('click', () => this.toggleStats());
    const btns = h('div.vbtns2', null, sbtn, menu, again); Object.assign(btns.style, { left: cx + 'px', top: btnY + 'px' });
    this.el.appendChild(btns);
    this.btns = btns; this.bAgain = again; this.bMenu = menu; this.bStats = sbtn; this.order = [sbtn, menu, again];
    this.focusBtn = again; this.pressing = null; this.glyphPad = null; this.syncGlyphs();
    // ---- stats overlay (hidden until Stats)
    this.buildStats(w, stats, view, kos, cx, Math.min(W - sl - sr - 16, 300), H - st - sb, st);
    this.prevPad = this.padSig(); this.armKeys = new Set();   // buttons / keys already held when the screen appears never act
    this.el.appendChild(h('div.vflash'));
    this.el.hidden = false;
  }

  /** the full match table in a framed panel over a dim layer (Stats button / △ / Tab; tap outside or ○ closes) */
  buildStats(w, stats, view, kos, cx, pw, avH, top0) {
    const dim = h('div.vdim', { hidden: true }); dim.addEventListener('click', () => this.toggleStats(false));
    const panel = h('div.vpanel.vstatsp', { hidden: true });
    Object.assign(panel.style, { left: Math.round(cx - pw / 2) + 'px', width: pw + 'px', borderImageSource: `url(${frameURL()})` });
    const close = h('span.vx', { role: 'button', 'aria-label': tr('common.close', 'Close'), text: '×' }, h('i.hit')); close.addEventListener('click', () => this.toggleStats(false));
    panel.appendChild(h('div.vph', null, h('span.l', { text: tr('end.summary', 'Match summary') }), h('span.r', { text: tr('end.vphR', '{time} · KOs {a}–{b}', { time: fmtTime(w.time), a: kos[0], b: kos[1] }) }), close));
    const tbl = h('div.vtbl' + (pw < 230 ? '.narrow' : ''));
    const head = [tr('end.col.trainer', 'Trainer'), tr('end.col.ko', 'KO'), tr('end.col.faint', 'Fnt'), tr('end.col.catch', 'Cap'), tr('end.col.evo', 'Evo'), tr('end.col.dmg', 'Dmg')];
    const ICON_HEAD = [null, 'sword', 'faint', 'orb', 'up', 'flame'];   // numeric headers are pixel icons (any language)
    tbl.appendChild(h('div.vr.vh', null, ...head.map((t, i) => {
      const k = ICON_HEAD[i]; if (!k) return h('span.c' + i, null, h('em', { text: t }));
      const ic = headIcon(k); ic.className = 'px hi'; return h('span.c' + (i + 1), { title: t }, ic, h('em', { text: t }));
    })));
    const locals = this.hud.localList().map((l) => w.units.get(l.unitId)).filter(Boolean);
    for (const team of [view, 1 - view]) {
      tbl.appendChild(h('div.vband.' + (team === view ? 'blue' : 'red'), null, h('span', { text: team === view ? tr('hud.yourTeam', 'Your team') : tr('hud.opponents', 'Opponents') }), h('span.k', { text: tr('end.kos', 'KOs') + ' ' + kos[team === view ? 0 : 1] })));
      for (const u2 of trainersOf(w, team)) {
        const s = stats.of(u2.id);
        const who = h('span.c0', null, h('i.pip' + (u2.team === view ? '.a' : '.e')), h('b', { text: u2.name }));
        const cell = (cls, to, fmt) => { const e = h('span.' + cls, { text: '0' }); this.counters.push({ el: e, to, fmt, delay: this.counters.length * 0.012 }); return e; };
        const int = (v) => String(Math.round(v)), kfmt = (v) => (Math.round(v / 100) / 10) + 'k';
        tbl.appendChild(h('div.vr' + (locals.includes(u2) ? '.me' : ''), null, who,
          cell('c2', (u2.kills || 0) + s.monKOs, int), cell('c3', s.faints, int), cell('c4', s.captures, int),
          cell('c5', s.evolutions, int), cell('c6', s.dmg, kfmt)));
      }
    }
    panel.appendChild(tbl);
    this.el.append(dim, panel); this.dim = dim; this.statsP = panel; this.statsAvH = avH; this.statsTop0 = top0;
  }
  toggleStats(on = !this.statsOpen) {
    if (!this.statsP) return;
    this.statsOpen = on; this.dim.hidden = !on; this.statsP.hidden = !on; setCls(this.el, 'stats', on);
    if (on) {
      const ph = this.statsP.getBoundingClientRect().height / (this.hud.u || 1) || 200;   // centre vertically (HUD px)
      this.statsP.style.top = Math.max(4, this.statsTop0 + Math.round((this.statsAvH - ph) / 2)) + 'px';
      this.statsT = this.t; for (const c of this.counters) c.el._t = null;
    }
    this.setFocus(on ? this.bStats : this.bAgain);
  }
  addSlot(stage, id, targetH, cx, footY, z, flip, hero) {
    const holder = h('div.vmon' + (flip ? '.flip' : '')); holder.style.zIndex = z;
    const cv = document.createElement('canvas'); cv.className = 'px'; holder.appendChild(cv);
    const shadow = h('div.vsh'); holder.appendChild(shadow);
    stage.appendChild(holder);
    const A = SPECIES_ART[id] && SPECIES_ART[id].anims && SPECIES_ART[id].anims.idle;
    this.slots.push({ hero, id, targetH, cx, footY, holder, cv, shadow, frames: [], fi: 0, n: (A && A.n) || 1, fps: (A && A.fps) || 6 });
  }

  /** pad state: 1 ✕, 2 ○, 4 left, 8 right (D-pad or left stick), 16 △ */
  padSig() {
    let sig = 0;
    try {
      for (const gp of navigator.getGamepads ? navigator.getGamepads() : []) {
        if (!gp || !gp.connected) continue; const b = (i) => gp.buttons[i] && gp.buttons[i].pressed;
        if (b(0)) sig |= 1; if (b(1)) sig |= 2; if (b(14) || gp.axes[0] < -0.6) sig |= 4; if (b(15) || gp.axes[0] > 0.6) sig |= 8; if (b(3)) sig |= 16;
      }
    } catch { /* ignore */ }
    return sig;
  }
  /** button glyphs follow the last input device (✕ ○ △ / A B Y / Enter Esc Tab; none on touch) */
  syncGlyphs() {
    const pad = this.hud.padFor(this.hud.localList()[0] || {}); if (pad === this.glyphPad || !this.bAgain) return; this.glyphPad = pad;
    const g = (b, html) => { b.querySelector('.g').innerHTML = pad === 'touch' ? '' : html; };
    g(this.bAgain, pad ? glyphHTML('attack', pad) : '<span class="gk">Enter</span>');
    g(this.bMenu, pad ? glyphHTML('capture', pad) : '<span class="gk">Esc</span>');
    g(this.bStats, pad ? glyphHTML('a2', pad) : '<span class="gk">Tab</span>');
  }
  setFocus(b) { if (!b || this.focusBtn === b) return; this.focusBtn = b; for (const x of this.order || []) setCls(x, 'focus', x === b); }
  /** keyboard: Enter / Space = focused button, Esc = close stats / Main menu, Tab = stats, ←/→ focus — on key UP */
  key(e) {
    if (this.el.hidden || !this.bAgain || this.t < 1.2) return;
    const k = e.key;
    if (e.type === 'keydown') {
      if (k === 'Tab') e.preventDefault();
      if (!e.repeat) this.armKeys.add(k);
      if (k === 'ArrowLeft' || k === 'ArrowRight') { const i = this.order.indexOf(this.focusBtn), j = Math.max(0, Math.min(this.order.length - 1, i + (k === 'ArrowLeft' ? -1 : 1))); this.setFocus(this.order[j]); }
      return;
    }
    if (!this.armKeys.has(k)) return; this.armKeys.delete(k);
    if (k === 'Enter' || k === ' ') { e.preventDefault(); this.focusBtn.click(); }
    else if (k === 'Tab') this.toggleStats();
    else if (k === 'Escape') { if (this.statsOpen) this.toggleStats(false); else this.mainMenu(); }
  }
  playAgain() {
    const b = document.querySelector('.sv-end [data-play-again]');
    if (b) { b.click(); return; }
    const a = this.app; a.newMatch({ seed: (Math.random() * 1e6) | 0 }); a.state = 'game'; a.fire('state', 'game');
  }
  mainMenu() { const hud = this.app.registry && this.app.registry.get ? this.app.registry.get('hud') : null; if (hud && hud.screens) hud.screens.go('menu'); else { this.app.state = 'menu'; this.app.fire('state', 'menu'); } }

  renderSlot(s, frame) {
    const S = SPECIES_ART[s.id]; if (!S) return null;
    const scale = Math.max(1, s.targetH / Math.max(20, S.pixelHeight || S._def.height || 40));
    if (!s.scale) {
      s.scale = Math.round(scale * 4) / 4;
      const probe = renderShowcase(s.id, { scale: s.scale, frame: 0, margin: 2 });   // wings/flames/tails: fit the real height
      if (probe.height > s.targetH * 1.1) s.scale = Math.max(1, Math.floor(s.scale * s.targetH / probe.height * 4) / 4);
    }
    const r = renderShowcase(s.id, { scale: s.scale, frame, margin: 2 });
    return prepLit(r);
  }

  update(f, stats) {
    const w = f.world;
    if (f.state !== 'end' || !w || w.winner == null) { if (!this.el.hidden) this.hide(); return; }
    if (this.world !== w) this.build(w, f, stats);
    const dt = Math.min(0.1, f.dt || 0.016); this.t += dt;
    // party renders: first frame one per update, idle frames lazily
    let budget = 1;
    for (const s of this.slots) {
      if (s.frames.length < s.n && budget > 0 && (s.frames.length === 0 || this.t > 0.6)) {
        budget--; const c = this.renderSlot(s, s.frames.length); if (c) s.frames.push(c);
        if (s.frames.length === 1) this.place(s);
      }
      if (s.frames.length) {
        const fi = s.frames.length > 1 ? Math.floor(this.t * s.fps) % s.n : 0;
        const lq = Math.floor(this.t * 12);
        if ((fi !== s.fi || lq !== s.lq) && s.frames[fi]) {
          s.fi = fi; s.lq = lq;
          // key / rim light swings slowly from behind the heroes (the rays) — strongest on the centre pair
          const ang = Math.PI * 1.32 + Math.sin(this.t * 0.6 + s.cx * 0.01) * 0.5;
          const c = relight(s.frames[fi], ang, (this.win ? PAL.win : PAL.loss).rim, (this.win ? 0.8 : 0.6) * (s.hero ? 1 : 0.8));
          const g = s.cv.getContext('2d'); g.clearRect(0, 0, s.cv.width, s.cv.height); g.drawImage(c, 0, 0);
        }
      }
    }
    // stats table counters tick up when the overlay opens
    if (this.statsOpen) for (const c of this.counters) {
      const p = Math.min(1, Math.max(0, (this.t - this.statsT - c.delay) / 0.8)), e = 1 - Math.pow(1 - p, 3);
      const txt = c.fmt(c.to * e); if (c.el._t !== txt) { c.el._t = txt; c.el.textContent = txt; }
    }
    this.particlesStep(dt);
    // pad: ←/→ focus, ✕ = focused button, ○ = close stats / Main menu, △ = stats. A fresh press is needed (buttons held
    // from the fight — or pressed in the first 1.2 s — never act); actions fire on RELEASE so nothing leaks into the lobby.
    const sig = this.padSig(), edge = sig & ~this.prevPad, rel = this.prevPad & ~sig; this.prevPad = sig;
    setCls(this.el, 'padnav', this.hud.input.last === 'pad'); this.syncGlyphs();
    if (this.t < 1.2) this.pressing = null;
    else {
      if (edge & 12) { const i = this.order.indexOf(this.focusBtn), j = Math.max(0, Math.min(this.order.length - 1, i + (edge & 4 ? -1 : 1))); this.setFocus(this.order[j]); }
      if (edge & 1) this.pressing = this.focusBtn; if (edge & 2) this.pressing = this.statsOpen ? 'close' : this.bMenu; if (edge & 16) this.pressing = this.bStats;
      for (const b of this.order) setCls(b, 'down', this.pressing === b && !!(sig & 19));
      if ((rel & 19) && this.pressing) {
        const b = this.pressing; this.pressing = null;
        if (b === 'close') this.toggleStats(false); else if (b === this.bStats) this.toggleStats(); else if (b === this.bMenu) this.mainMenu(); else this.playAgain();
      }
    }
  }
  place(s) {
    const c = s.frames[0]; s.cv.width = c.width; s.cv.height = c.height; s.cv.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(c.base), c.W, c.H), 0, 0);
    s.cv.style.width = c.width + 'px'; s.cv.style.height = c.height + 'px';
    const S = SPECIES_ART[s.id];
    // the showcase canvas has `margin` px around the trimmed sprite; feet sit at the bottom
    const left = Math.round(s.cx - c.width / 2), top = s.footY - c.height + 3;
    s.holder.style.left = left + 'px'; s.holder.style.top = top + 'px';
    const shW = Math.round(Math.min(c.width * 0.8, (S.shadowRadius || 10) * 2 * (c.height / Math.max(20, S.pixelHeight || 40))));
    s.shadow.style.width = shW + 'px'; s.shadow.style.left = Math.round((c.width - shW) / 2) + 'px'; s.shadow.style.top = (c.height - 6) + 'px';
    setCls(s.holder, 'on', true);
  }
  /** confetti (victory) / motes (defeat) inside the hero zone only (the canvas sits behind the sprites) */
  particlesStep(dt) {
    if (!this.fx) return;
    const g = this.fx.getContext('2d'), W = this.zone.w, H = this.zone.h, P = this.particles, cols = (this.win ? PAL.win : PAL.loss).confetti;
    const spawn = this.statsOpen ? 0 : this.win ? (this.t < 3 ? 40 : 10) * W / 400 : 5 * W / 400;
    for (let n = 0; n < spawn * dt; n++) {
      if (this.win) P.push({ x: Math.random() * W, y: -3, vx: (Math.random() - 0.5) * 12, vy: 14 + Math.random() * 18, ph: Math.random() * 6, c: cols[Math.floor(Math.random() * cols.length)], s: 2, life: 9 });
      else P.push({ x: Math.random() * W, y: H * (0.3 + Math.random() * 0.7), vx: 2 + Math.random() * 3, vy: -3 - Math.random() * 3, ph: Math.random() * 6, c: cols[0], s: 1, life: 5 });
    }
    g.clearRect(0, 0, W, H);
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i]; p.life -= dt; p.ph += dt * 5; p.x += (p.vx + Math.sin(p.ph) * 5) * dt; p.y += p.vy * dt;
      if (p.life <= 0 || p.y > H || p.x < -4 || p.x > W + 4) { P.splice(i, 1); continue; }
      // fade in the last 8 px above the ground and near the zone's sides (no hard cut-off edges)
      const edge = Math.min(1, (H - p.y) / 8, (p.x + 4) / 10, (W + 4 - p.x) / 10);
      g.globalAlpha = Math.max(0, Math.min(1, p.life, edge));
      g.fillStyle = p.c; const flip = Math.sin(p.ph * 1.7) > 0;
      g.fillRect(Math.round(p.x), Math.round(p.y), p.s + (flip ? 1 : 0), flip ? p.s : p.s + 1);
    }
    g.globalAlpha = 1;
  }
}
