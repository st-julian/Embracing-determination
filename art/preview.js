import {
  buildAtlas, buildUIAtlas, SPECIES_ART, FORMS, LINES, MINIONS, TRAINERS, ICON_IDS, ABILITY_NAMES,
  renderPortrait, renderShowcase, renderBadgeCanvas, renderIconCanvas, renderElementIconCanvas,
} from './sprites/index.js';

const qs = new URLSearchParams(location.search);
const only = qs.get('s');
const want = (k) => !only || only === k;
const main = document.getElementById('main');
const stat = document.getElementById('stat');

// pixel grass background tile ---------------------------------------------------------
(function grass() {
  const c = document.createElement('canvas'); c.width = c.height = 32;
  const g = c.getContext('2d');
  const cols = ['#5f9f49', '#64a64d', '#5a9844', '#6aad52'];
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let y = 0; y < 32; y += 4) for (let x = 0; x < 32; x += 4) { g.fillStyle = cols[Math.floor(rnd() * cols.length)]; g.fillRect(x, y, 4, 4); }
  for (let k = 0; k < 18; k++) { const x = Math.floor(rnd() * 31), y = Math.floor(rnd() * 30); g.fillStyle = '#4c8a3c'; g.fillRect(x, y + 1, 1, 2); g.fillStyle = '#7cc062'; g.fillRect(x + 1, y, 1, 2); }
  document.body.style.setProperty('--grass', `url(${c.toDataURL()})`);
})();

const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
const section = (id, title) => { const s = el('section'); s.id = id; s.appendChild(el('h2', null, title)); main.appendChild(s); return s; };

const t0 = performance.now();
const atlas = buildAtlas();
const tA = performance.now() - t0;
const t1 = performance.now();
const ui = buildUIAtlas();
const tU = performance.now() - t1;
stat.textContent = `atlas ${atlas.meta.size.map(s => s.join('x')).join(', ')} · ${atlas.meta.frameCount} frames · ${tA.toFixed(0)} ms | UI atlas ${ui.meta.size[0].join('x')} · ${tU.toFixed(0)} ms`;
window.__ART = { atlas, ui, tA, tU };

// animated sprite widget: draws frames from the atlas, aligned on the feet anchor ---------
const players = [];
function sprite(id, view, anim, scale = 1, o = {}) {
  const A = atlas.anims[id];
  const keys = (A[view] && A[view][anim]) || A[anim];
  const fr = keys.map(k => atlas.frames[k]);
  // box that fits every frame of this sprite (all anims) so feet stay put
  const S = SPECIES_ART[id];
  const box = o.box || spriteBox(id);
  const c = document.createElement('canvas');
  c.width = box.w * scale; c.height = box.h * scale;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  const fps = A.fps[anim] || 8;
  const flip = !!o.flip;
  const p = { c, draw(t) {
    const n = keys.length;
    const f = o.frame != null ? o.frame : Math.floor(t * fps / 1000) % (A.loop[anim] || o.loop ? n : n + Math.ceil(fps * 0.6));
    const F = fr[Math.min(n - 1, f)];
    g.clearRect(0, 0, c.width, c.height);
    if (o.shadow !== false && S.shadowRadius) {
      g.fillStyle = 'rgba(20,40,20,0.28)';
      const r = S.shadowRadius * scale;
      g.beginPath(); g.ellipse(box.ax * scale, box.ay * scale - scale, r, r * 0.4, 0, 0, Math.PI * 2); g.fill();
    }
    g.save();
    if (flip) { g.translate(c.width, 0); g.scale(-1, 1); }
    g.drawImage(atlas.pages[F.page], F.x, F.y, F.w, F.h, (box.ax - F.anchorX) * scale, (box.ay - F.anchorY) * scale, F.w * scale, F.h * scale);
    g.restore();
  } };
  players.push(p);
  return c;
}
const boxCache = {};
function spriteBox(id) {
  if (boxCache[id]) return boxCache[id];
  let l = 0, r = 0, u = 0, d = 0;
  for (const [k, F] of Object.entries(atlas.frames)) {
    if (!k.startsWith(id + '/')) continue;
    l = Math.max(l, F.anchorX); r = Math.max(r, F.w - F.anchorX); u = Math.max(u, F.anchorY); d = Math.max(d, F.h - F.anchorY);
  }
  const m = Math.max(l, r);
  return (boxCache[id] = { w: Math.ceil(m * 2) + 2, h: Math.ceil(u + d) + 2, ax: Math.ceil(m) + 1, ay: Math.ceil(u) + 1 });
}
function loop(t) { for (const p of players) p.draw(t); requestAnimationFrame(loop); }

const typeBadges = (types) => { const d = el('div', 'badges'); for (const t of types) d.appendChild(renderBadgeCanvas(t)); return d; };

// 1) evolution lineup ------------------------------------------------------------------
if (want('lineup')) {
  const s = section('lineup', 'Evolution lineup (3×, animated idle)');
  for (const line of LINES) {
    const card = el('div', 'card clear'); card.style.marginBottom = '10px'; card.style.display = 'inline-block'; card.style.marginRight = '10px';
    const row = el('div', 'lineup');
    FORMS.filter(f => f.line === line).forEach((f, k) => {
      if (k) row.appendChild(el('div', 'arrow', '▶'));
      const st = el('div', 'stage');
      st.appendChild(sprite(f.id, 'front', 'idle', 3));
      st.appendChild(el('div', 'name', f.name));
      const tb = typeBadges(f.types); tb.style.justifyContent = 'center'; st.appendChild(tb);
      row.appendChild(st);
    });
    card.appendChild(row);
    s.appendChild(card);
  }
}

// 2) every monster animated (1× + 3×) ---------------------------------------------------
if (want('anim')) {
  const s = section('anim', 'All monsters — every animation, front & back (top 3×, bottom 1×)');
  for (const f of FORMS) {
    const card = el('div', 'card'); card.style.marginBottom = '10px';
    card.appendChild(el('div', 'name', `${f.name}  `)).appendChild(el('span', 'sub', `${f.line} · stage ${f.stage} · cell ${f.cell.join('x')}`));
    for (const sc of [3, 1]) {
      const r = el('div', 'anims');
      for (const view of ['front', 'back']) for (const a of ['idle', 'walk', 'attack', 'cast', 'hurt', 'faint']) {
        const fig = el('figure');
        fig.appendChild(sprite(f.id, view, a, sc));
        if (sc === 3) fig.appendChild(el('figcaption', null, `${view} ${a}`));
        r.appendChild(fig);
      }
      card.appendChild(r);
    }
    s.appendChild(card);
  }
}

// 3) contact sheet: every frame, static, 2× ---------------------------------------------
if (want('sheet')) {
  const s = section('sheet', 'Contact sheet — every monster frame (2×)');
  const ids = qs.get('ids') ? qs.get('ids').split(',') : FORMS.map(f => f.id);
  for (const id of ids) {
    const card = el('div', 'card sheet'); card.style.marginBottom = '8px';
    card.appendChild(el('div', 'name', SPECIES_ART[id].name));
    for (const view of SPECIES_ART[id].views) {
      const r = el('div', 'anims');
      for (const a of Object.keys(SPECIES_ART[id].anims)) {
        const n = SPECIES_ART[id].anims[a].n;
        for (let i = 0; i < n; i++) r.appendChild(sprite(id, view, a, +(qs.get('z') || 2), { frame: i, shadow: false }));
        if (a === 'hurt') for (let i = 0; i < n; i++) r.appendChild(sprite(id, view, 'hurtFlash', +(qs.get('z') || 2), { frame: i, shadow: false }));
      }
      card.appendChild(r);
    }
    s.appendChild(card);
  }
}

// 3b) compact contact sheet for reviews: key poses of every monster on grass (2x)
if (want('contact')) {
  const s = section('contact', 'Contact sheet — key poses (2×): front idle · back idle · walk · attack hit · cast · hurt · faint');
  const z = +(qs.get('z') || 2);
  for (const line of LINES) {
    const r = el('div', 'row'); r.style.marginBottom = '6px';
    for (const f of FORMS.filter(f => f.line === line)) {
      const c = el('div', 'card clear'); const a = el('div', 'anims');
      for (const [v, an, i] of [['front', 'idle', 0], ['back', 'idle', 0], ['front', 'walk', 1], ['front', 'attack', 3], ['front', 'cast', 2], ['front', 'hurt', 0], ['front', 'faint', 4]]) a.appendChild(sprite(f.id, v, an, z, { frame: i }));
      c.appendChild(a); c.appendChild(el('div', 'name', f.name)); r.appendChild(c);
    }
    s.appendChild(r);
  }
}

// 4) minions -----------------------------------------------------------------------------
if (want('minions')) {
  const s = section('minions', 'Lane minions — blue / red team (3× and 1×)');
  for (const m of MINIONS) {
    const card = el('div', 'card'); card.style.marginBottom = '10px';
    card.appendChild(el('div', 'name', m.name));
    for (const sc of [3, 1]) {
      const r = el('div', 'anims');
      for (const team of m.variants) for (const view of ['front', 'back']) for (const a of m.anims) {
        const fig = el('figure'); fig.appendChild(sprite(`${m.id}_${team}`, view, a, sc));
        if (sc === 3) fig.appendChild(el('figcaption', null, `${team} ${view} ${a}`));
        r.appendChild(fig);
      }
      card.appendChild(r);
    }
    s.appendChild(card);
  }
  // capture orb
  const card = el('div', 'card'); card.appendChild(el('div', 'name', 'Capture orb'));
  const r = el('div', 'anims');
  for (const a of Object.keys(SPECIES_ART.orb.anims)) { const fig = el('figure'); fig.appendChild(sprite('orb', 'front', a, 4, { loop: true })); fig.appendChild(el('figcaption', null, a)); r.appendChild(fig); }
  for (const a of Object.keys(SPECIES_ART.orb.anims)) for (let i = 0; i < SPECIES_ART.orb.anims[a].n; i++) r.appendChild(sprite('orb', 'front', a, 2, { frame: i, shadow: false }));
  card.appendChild(r); s.appendChild(card);
}

// 5) trainers ----------------------------------------------------------------------------
if (want('trainers')) {
  const s = section('trainers', 'Trainers — Attack / Healing / Magic × team, 4-direction walk + throw / hurt / defeated (3×, 1×)');
  for (const t of TRAINERS) for (const team of t.variants) {
    const id = `${t.id}_${team}`;
    const card = el('div', 'card'); card.style.marginBottom = '10px';
    card.appendChild(el('div', 'name', `${t.name} · ${team}`));
    for (const sc of [3, 1]) {
      const r = el('div', 'anims');
      for (const [view, flip] of [['down', 0], ['up', 0], ['left', 0], ['left', 1]]) for (const a of ['walk', 'throw']) {
        const fig = el('figure'); fig.appendChild(sprite(id, view, a, sc, { flip: !!flip, loop: true }));
        if (sc === 3) fig.appendChild(el('figcaption', null, `${flip ? 'right' : view} ${a}`)); r.appendChild(fig);
      }
      for (const a of ['idle', 'hurt', 'defeated']) { const fig = el('figure'); fig.appendChild(sprite(id, 'down', a, sc, { loop: true })); if (sc === 3) fig.appendChild(el('figcaption', null, a)); r.appendChild(fig); }
      card.appendChild(r);
    }
    s.appendChild(card);
  }
}

// 6) UI: portraits, icons, badges ------------------------------------------------------------
if (want('ui')) {
  const s = section('ui', 'HUD portraits (96×96) · ability icons (40px, 2×) · type badges');
  const card = el('div', 'card'); const r = el('div', 'row');
  for (const id of Object.keys(SPECIES_ART)) if (id !== 'orb') { const f = el('figure'); f.style.margin = 0; f.appendChild(renderPortrait(id)); f.appendChild(el('figcaption', null, SPECIES_ART[id].name.slice(0, 14))); r.appendChild(f); }
  card.appendChild(r); s.appendChild(card);
  const c2 = el('div', 'card'); c2.style.marginTop = '10px'; const r2 = el('div', 'row');
  for (const id of ICON_IDS) {
    const f = el('figure'); f.style.margin = 0; f.style.textAlign = 'center';
    const cv = renderIconCanvas(id, 40); cv.style.width = '80px'; cv.style.height = '80px'; f.appendChild(cv);
    f.appendChild(el('figcaption', null, ABILITY_NAMES[id])); r2.appendChild(f);
  }
  c2.appendChild(r2); s.appendChild(c2);
  const c3 = el('div', 'card'); c3.style.marginTop = '10px'; const r3 = el('div', 'badges');
  for (const l of LINES) { const b = renderBadgeCanvas(l); b.style.width = b.width * 3 + 'px'; r3.appendChild(b); }
  for (const l of LINES) { const b = renderElementIconCanvas(l, 24); b.style.width = '72px'; r3.appendChild(b); }
  for (const l of LINES) r3.appendChild(renderBadgeCanvas(l));
  c3.appendChild(r3); s.appendChild(c3);
}

// 7) showcase renders ----------------------------------------------------------------------
if (want('showcase')) {
  const s = section('showcase', 'Showcase renders — final forms & trainers (native high-detail re-raster)');
  const r = el('div', 'row');
  const ids = [...FORMS.filter(f => f.stage === 2).map(f => f.id), 'trainer_attack_blue', 'trainer_healing_red', 'trainer_magic_blue'];
  for (const id of ids) { const c = el('div', 'card clear'); c.appendChild(renderShowcase(id)); c.appendChild(el('div', 'name', SPECIES_ART[id].name)); r.appendChild(c); }
  s.appendChild(r);
}

requestAnimationFrame(loop);
window.__READY = true;
