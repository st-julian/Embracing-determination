// game/art/tiles/buildings.js — front-facing pixel-art structures (Pokémon-building style): tower (lighthouse turret
// with a team crystal lantern), inhibitor (rune plinth + floating crystal), Nexus (stepped dais + crystal cluster),
// fountain statue + the fountain pool ground function. Owner: pixel-world look-dev.
// Anchors are the ground centre of the footprint (y-sort point). Sizes at 32 art px / m.

import { Bitmap, mix, hash2 } from './core.js';
import { PAL, teamRamp, paveRamp } from './palette.js';

const cache = new Map();
const memo = (k, fn) => { let v = cache.get(k); if (!v) { v = fn(); cache.set(k, v); } return v; };

function selout(b, ink, lit) {
  const a = new Uint8Array(b.w * b.h); for (let i = 0; i < a.length; i++) a[i] = b.data[i * 4 + 3] > 0 ? 1 : 0;
  const at = (x, y) => (x < 0 || y < 0 || x >= b.w || y >= b.h ? 0 : a[y * b.w + x]);
  for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) {
    if (at(x, y)) continue; const r = at(x + 1, y), l = at(x - 1, y), d = at(x, y + 1), u = at(x, y - 1);
    if (r || l || d || u) b.set(x, y, (r || d) && !(l || u) ? lit : ink);
  }
  return b;
}

/** faceted crystal: base centre (cx, by), half width hw, height h (tip up), team ramp T */
function crystal(b, cx, by, hw, h, T, glint = true) {
  const tip = by - h, sh = Math.round(h * 0.28);
  for (let y = Math.floor(tip); y <= by; y++) {
    const fromTip = y - tip, wv = fromTip < sh ? hw * (fromTip / sh) : y > by - hw * 0.5 ? hw * Math.max(0, (by - y) / (hw * 0.5)) : hw;
    for (let x = Math.floor(cx - wv); x < Math.ceil(cx + wv); x++) {
      const u = (x + 0.5 - cx) / Math.max(1, wv);
      let c = u < -0.45 ? T[4] : u < 0.15 ? T[3] : T[2];
      if (u > 0.62) c = T[1];
      if (fromTip < sh && u < -0.1) c = T[5];
      if (Math.abs(u - 0.15) < 0.12 && fromTip > sh) c = mix(T[3], T[5], 0.5);   // facet edge glow
      b.set(x, y, c);
    }
  }
  if (glint) { const gx = Math.round(cx - hw * 0.45), gy = Math.round(tip + sh + 4); b.set(gx, gy, T[5]); b.set(gx, gy + 1, T[5]); b.set(gx, gy + 2, T[4]); b.set(gx - 1, gy + 1, T[4]); b.set(gx + 1, gy + 1, T[4]); }
}

/** cylinder shading tone index from horizontal position u ∈ [-1, 1] */
const cyl = (u, R) => (u < -0.55 ? R[4] : u < -0.1 ? R[3] : u < 0.5 ? R[2] : R[1]);

// ------------------------------------------------------------------------------------------------ tower
/** Tower ≈ 4.8 m: stone plinth, white brick drum with a team band, lantern room with the team crystal, tiled cone roof. */
export function tower(team = 0, tier = 1, frame = 0) {
  return memo(`tower${team}/${tier}/${frame}`, () => {
    const T = teamRamp(team), S = PAL.white, G = PAL.gold, St = PAL.stone, W = 84, cx = 42, ay = 166, H = ay + 14;
    const b = new Bitmap(W, H, cx, ay);
    // plinth: round, 9 px tall, top ellipse lit
    const prx = 33, pry = 11, ph = 9;
    for (let x = cx - prx; x <= cx + prx; x++) {
      const u = (x + 0.5 - cx) / prx; if (Math.abs(u) > 1) continue; const e = pry * Math.sqrt(1 - u * u);
      for (let y = Math.round(ay - ph + e); y <= Math.round(ay + e); y++) b.set(x, y, y > ay + e - 2 ? St[1] : cyl(u, St.slice(1)));
    }
    b.ell(cx, ay - ph, prx, pry, (x, y, u, v) => (u * u + v * v > 0.78 ? St[5] : v < -0.3 ? St[4] : St[3]));
    // drum (bricks), bottom follows the cylinder's front arc
    const r = 21, y0 = ay - 116;
    for (let x = cx - r; x <= cx + r; x++) {
      const u = (x + 0.5 - cx) / r; if (Math.abs(u) > 1) continue;
      const y1 = Math.round(ay - ph + 6 * Math.sqrt(1 - u * u));
      for (let y = y0; y <= y1; y++) {
        const row = Math.floor((y - y0) / 7), off = (row & 1) * 5, bx = Math.floor((x - cx + 60 + off) / 10);
        let c = cyl(u, S);
        if ((y - y0) % 7 === 0) c = mix(c, S[1], 0.55);
        else if ((x - cx + 60 + off) % 10 === 0 && Math.abs(u) < 0.85) c = mix(c, S[1], 0.4);
        if (hash2(bx, row, 3) < 0.07 && Math.abs(u) < 0.8) c = mix(c, S[1], 0.25);
        if (y > y1 - 2) c = S[1];
        b.set(x, y, c);
      }
    }
    // team band + gold trims
    for (let y = ay - 58; y < ay - 46; y++) for (let x = cx - r - 1; x <= cx + r + 1; x++) { const u = (x + 0.5 - cx) / (r + 1); if (Math.abs(u) <= 1) b.set(x, y, y === ay - 58 || y === ay - 47 ? cyl(u, G) : cyl(u, T)); }
    // emblem on the band: diamond
    for (let j = -4; j <= 4; j++) for (let i = -4 + Math.abs(j); i <= 4 - Math.abs(j); i++) b.set(cx - 3 + i, ay - 52 + j, Math.abs(i) + Math.abs(j) === 4 - 0 ? G[1] : i + j < 0 ? G[4] : G[3]);
    // arched window
    for (let y = ay - 92; y < ay - 74; y++) for (let x = cx - 6; x < cx + 3; x++) { const top = y < ay - 88 && Math.hypot(x + 0.5 - (cx - 1.5), y - (ay - 88)) > 4.5; if (top) continue; b.set(x, y, x === cx - 6 || y === ay - 75 ? S[1] : (x < cx - 3 ? T[1] : T[0])); }
    // gallery (crenellated)
    for (let y = ay - 120; y < ay - 110; y++) for (let x = cx - 27; x <= cx + 27; x++) { const u = (x + 0.5 - cx) / 27; b.set(x, y, y === ay - 111 ? St[1] : cyl(u, St.slice(1))); }
    for (let m = -3; m <= 3; m++) { const mx = cx + m * 8 - 2; for (let y = ay - 125; y < ay - 120; y++) for (let x = mx; x < mx + 5; x++) b.set(x, y, x === mx ? St[5] : x === mx + 4 ? St[2] : St[4]); }
    // lantern room: 2 white pillars + glowing crystal
    for (const px of [cx - 17, cx + 12]) for (let y = ay - 140; y < ay - 120; y++) for (let x = px; x < px + 5; x++) b.set(x, y, x === px ? S[4] : x === px + 4 ? S[1] : S[3]);
    for (let y = ay - 140; y < ay - 120; y++) for (let x = cx - 12; x < cx + 12; x++) if (!b.alpha(x, y)) b.set(x, y, mix(T[1], T[0], 0.4));
    crystal(b, cx, ay - 121, 7, 19 + (frame & 1), T);
    // cone roof with tile rows
    const ry0 = ay - 164, ry1 = ay - 139;
    for (let y = ry0; y <= ry1; y++) {
      const f = (y - ry0) / (ry1 - ry0), hw = 4 + f * 27;
      for (let x = Math.floor(cx - hw); x < Math.ceil(cx + hw); x++) {
        const u = (x + 0.5 - cx) / hw, row = Math.floor((y - ry0) / 5), lx = Math.floor((x - cx + 64 + (row & 1) * 3) / 6);
        let c = u < -0.5 ? T[4] : u < 0.05 ? T[3] : u < 0.55 ? T[2] : T[1];
        if ((y - ry0) % 5 === 4) c = mix(c, T[0], 0.45);
        else if ((x - cx + 64 + (row & 1) * 3) % 6 === 0) c = mix(c, T[1], 0.35);
        void lx;
        b.set(x, y, c);
      }
    }
    for (let x = cx - 31; x < cx + 31; x++) { b.set(x, ry1 + 1, G[3]); b.set(x, ry1 + 2, G[1]); }
    b.set(cx, ay - 166, G[4]); b.set(cx - 1, ay - 165, G[3]); b.set(cx, ay - 165, G[3]); b.set(cx, ay - 164, G[2]);
    // tier pips on the plinth (I / II / III)
    for (let i = 0; i < Math.min(4, tier); i++) { const px = cx - (tier - 1) * 3 + i * 6; b.set(px, ay - 6, G[4]); b.set(px + 1, ay - 6, G[3]); b.set(px, ay - 5, G[2]); b.set(px + 1, ay - 5, G[1]); }
    selout(b, mix(T[0], [16, 18, 34], 0.5), St[1]);
    return b;
  });
}

// ------------------------------------------------------------------------------------------------ inhibitor
export function inhibitor(team = 0, frame = 0) {
  return memo(`inhib${team}/${frame}`, () => {
    const T = teamRamp(team), St = PAL.stone, G = PAL.gold, W = 100, H = 104, cx = 50, ay = 96;
    const b = new Bitmap(W, H, cx, ay);
    // square plinth in 3/4: top 80×34, face 12
    for (let y = ay - 46; y <= ay; y++) for (let x = cx - 40; x <= cx + 40; x++) {
      const top = y < ay - 12;
      let c = top ? ((x + y) % 14 === 0 ? St[3] : St[4]) : (x < cx - 37 ? St[3] : x > cx + 37 ? St[1] : St[2]);
      if (y === ay - 46 || x === cx - 40) c = St[5];
      if (y === ay - 12) c = St[5];
      b.set(x, y, c);
    }
    // rune ring (team) on the top
    b.ell(cx, ay - 29, 30, 13, (x, y, u, v) => { const q = u * u + v * v; return q > 0.72 ? T[2] : q > 0.55 ? T[4] : null; });
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, x = Math.round(cx + Math.cos(a) * 26), y = Math.round(ay - 29 + Math.sin(a) * 11); b.set(x, y, T[5]); b.set(x + 1, y, T[4]); }
    // corner posts
    for (const [px, py] of [[cx - 38, ay - 44], [cx + 33, ay - 44], [cx - 38, ay - 17], [cx + 33, ay - 17]]) for (let y = py - 10; y < py + 4; y++) for (let x = px; x < px + 6; x++) b.set(x, y, y < py - 7 ? G[3] : x === px ? St[5] : x === px + 5 ? St[2] : St[4]);
    // floating crystal (octahedron) + shadow ring
    const bob = frame % 2;
    b.ell(cx, ay - 29, 11, 4, (x, y, u, v) => mix(T[1], St[3], 0.4));
    crystal(b, cx, ay - 40 - bob, 13, 52, T);
    // lower point of the octahedron
    for (let y = ay - 40 - bob; y < ay - 30 - bob; y++) { const hw = 13 * (1 - (y - (ay - 40 - bob)) / 10); for (let x = Math.floor(cx - hw); x < Math.ceil(cx + hw); x++) b.set(x, y, (x - cx) < 0 ? T[2] : T[1]); }
    selout(b, mix(T[0], [16, 18, 34], 0.5), St[1]);
    return b;
  });
}

// ------------------------------------------------------------------------------------------------ nexus
export function nexus(team = 0, frame = 0) {
  return memo(`nexus${team}/${frame}`, () => {
    const T = teamRamp(team), St = PAL.stone, G = PAL.gold, W = 184, H = 168, cx = 92, ay = 160;
    const b = new Bitmap(W, H, cx, ay);
    // two-step round dais
    const step = (ry0, rx, ry, face, top) => {
      for (let y = ry0 - ry; y <= ry0 + ry + face; y++) for (let x = cx - rx; x <= cx + rx; x++) {
        const u = (x + 0.5 - cx) / rx, e = ry * Math.sqrt(Math.max(0, 1 - u * u));
        if (Math.abs(u) > 1) continue;
        if (y >= ry0 - e && y <= ry0 + e) b.set(x, y, top(u, (y - ry0) / Math.max(1, e)));
        else if (y > ry0 + e && y <= ry0 + e + face) { const fy = y - ry0 - e; b.set(x, y, fy < 1.5 ? G[3] : fy > face - 2 ? St[1] : cyl(u, St.slice(1))); }
      }
    };
    step(ay - 20, 88, 22, 14, (u, v) => ((u * u + v * v) > 0.82 ? St[5] : (v < -0.2 ? St[4] : St[3])));
    step(ay - 36, 56, 14, 12, (u, v) => { const q = u * u + v * v; return q > 0.84 ? G[3] : q > 0.6 ? St[5] : q > 0.42 ? T[3] : q > 0.3 ? T[5] : St[4]; });
    // inlaid ring of runes on the lower step
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, x = Math.round(cx + Math.cos(a) * 74), y = Math.round(ay - 20 + Math.sin(a) * 18.5); if (Math.sin(a) > -0.2) { b.set(x, y, T[4]); b.set(x + 1, y, T[3]); b.set(x, y - 1, T[5]); } }
    // crystal cluster
    const bob = frame % 2;
    b.ell(cx, ay - 38, 22, 6, (x, y, u, v) => (u * u + v * v > 0.5 ? T[4] : T[5]));
    crystal(b, cx - 25, ay - 42 - bob, 10, 40, T);
    crystal(b, cx + 26, ay - 41 - bob, 9, 34, T);
    crystal(b, cx, ay - 44 - bob, 18, 88, T);
    // halo sparkles
    for (const [x, y] of [[cx - 40, ay - 96], [cx + 38, ay - 84], [cx - 14, ay - 140], [cx + 22, ay - 124]]) { b.set(x, y, T[5]); b.set(x - 1, y, T[4]); b.set(x + 1, y, T[4]); b.set(x, y - 1, T[4]); b.set(x, y + 1, T[4]); }
    selout(b, mix(T[0], [16, 18, 34], 0.5), St[1]);
    return b;
  });
}

// ------------------------------------------------------------------------------------------------ fountain
/** central fountain statue: pedestal + basin + crystal spout with animated water arcs (frame 0..3) */
export function fountainStatue(team = 0, frame = 0) {
  return memo(`fstat${team}/${frame}`, () => {
    const T = teamRamp(team), S = PAL.white, Wt = PAL.water, W = 104, H = 124, cx = 52, ay = 118;
    const b = new Bitmap(W, H, cx, ay);
    // pedestal column
    for (let y = ay - 46; y <= ay; y++) for (let x = cx - 10; x <= cx + 10; x++) { const u = (x + 0.5 - cx) / 10; b.set(x, y, (y - ay) % 9 === 0 ? S[1] : cyl(u, S)); }
    for (let y = ay - 6; y <= ay; y++) for (let x = cx - 15; x <= cx + 15; x++) { const u = (x + 0.5 - cx) / 15; b.set(x, y, y === ay - 6 ? S[4] : cyl(u, S)); }
    // basin bowl
    for (let y = ay - 62; y <= ay - 46; y++) { const f = (y - (ay - 62)) / 16, hw = 34 - f * f * 22; for (let x = Math.floor(cx - hw); x < Math.ceil(cx + hw); x++) { const u = (x + 0.5 - cx) / hw; b.set(x, y, y < ay - 59 ? S[4] : cyl(u, S)); } }
    b.ell(cx, ay - 62, 32, 5, (x, y, u, v) => (u * u + v * v > 0.7 ? S[4] : Wt[v < 0 ? 3 : 4]));
    // spout: team crystal on a small column
    for (let y = ay - 78; y < ay - 62; y++) for (let x = cx - 4; x <= cx + 4; x++) b.set(x, y, cyl((x + 0.5 - cx) / 4, S));
    crystal(b, cx, ay - 78, 7, 22, T);
    // water arcs: 4 parabolic jets falling into the bowl and over its rim (animated drops)
    for (const dir of [-1, 1]) for (let j = 0; j < 2; j++) {
      const span = 20 + j * 12, hgt = 22 + j * 4;
      for (let t = 0; t <= 1; t += 0.012) {
        const x = cx + dir * (4 + span * t), y = ay - 92 - hgt * 4 * t * (1 - t) + span * 0.9 * t * t * 0.9 + 30 * t;
        const phase = ((t * 10 + frame * 0.5) % 1);
        b.set(Math.round(x), Math.round(y), phase < 0.2 ? Wt[5] : Wt[4]);
        if (phase < 0.6) b.set(Math.round(x), Math.round(y) + 1, Wt[3]);
      }
    }
    // splash at the top
    for (const [dx, dy] of [[0, -102], [-2, -100], [2, -100], [-1, -104], [1, -98]]) b.set(cx + dx, ay + dy - (frame & 1), Wt[5]);
    selout(b, [30, 40, 78], S[1]);
    return b;
  });
}

/**
 * Fountain pool ground: returns a colour for world px offset (dx, dy) from the fountain centre (null = not pool), or
 * the team heal-zone ring tile. R = pool radius px. Rim: lit top, front face on the south half.
 */
export function fountainGround(dx, dy, R, team, waterFn) {
  const St = PAL.white, T = teamRamp(team), Pv = paveRamp(team);
  const d = Math.hypot(dx + 0.5, dy + 0.5);
  if (d < R - 9) return waterFn(Math.max(0, R - 9 - d));
  if (d < R - 6 && dy > 0) return St[1];                                  // inner rim shade (front)
  if (d < R) { const lit = dx + dy < 0; return d > R - 2 ? St[1] : lit ? St[4] : St[3]; }
  if (dy > 0 && d < R + 7) { const yy = Math.sqrt(Math.max(0, (R + 7) ** 2 - dx * dx)); void yy; }
  // front face of the rim: below the rim on the south half (a 7-px wall)
  if (dy > 0) { const rimY = Math.sqrt(Math.max(0, R * R - (dx + 0.5) ** 2)); if (Math.abs(dx) < R && dy - rimY >= 0 && dy - rimY < 7) return dy - rimY > 5 ? St[0] : Math.abs(dx) / R > 0.7 ? St[1] : St[2]; }
  void T; void Pv;
  return null;
}

// ------------------------------------------------------------------------------------------------ shop
/** item shop stall (≈ 3.2 m): wooden counter, striped team awning, crates of potions and orbs, MART sign */
export function shop(team = 0) {
  return memo(`shop${team}`, () => {
    const T = teamRamp(team), Wd = PAL.wood, S = PAL.white, G = PAL.gold, W = 112, H = 114, cx = 56, ay = 108;
    const b = new Bitmap(W, H, cx, ay);
    // back wall + posts
    for (let y = ay - 66; y < ay - 26; y++) for (let x = cx - 46; x < cx + 46; x++) b.set(x, y, (x - cx + 46) % 12 === 0 ? Wd[1] : y < ay - 62 ? Wd[2] : Wd[3]);
    for (const px of [cx - 48, cx + 43]) for (let y = ay - 74; y <= ay; y++) for (let x = px; x < px + 5; x++) b.set(x, y, x === px ? Wd[4] : x === px + 4 ? Wd[1] : Wd[3]);
    // shelves with potions / orbs
    for (const sy of [ay - 52, ay - 38]) {
      for (let x = cx - 42; x < cx + 42; x++) { b.set(x, sy, Wd[4]); b.set(x, sy + 1, Wd[1]); }
      for (let i = 0; i < 9; i++) {
        const x = cx - 38 + i * 9, kind = (i + (sy & 1)) % 3;
        if (kind === 0) { b.ell(x + 3, sy - 4, 3, 3, (xx, yy, u, v) => (v < -0.1 ? [236, 64, 64] : [250, 250, 250])); b.set(x + 2, sy - 6, [255, 255, 255]); }
        else if (kind === 1) { for (let y = sy - 8; y < sy; y++) for (let xx = x + 1; xx < x + 5; xx++) b.set(xx, y, y < sy - 6 ? S[3] : xx === x + 1 ? [255, 160, 200] : [230, 90, 150]); }
        else { for (let y = sy - 7; y < sy; y++) for (let xx = x; xx < x + 6; xx++) b.set(xx, y, y < sy - 5 ? S[3] : xx === x ? [150, 220, 255] : [70, 150, 230]); }
      }
    }
    // counter
    for (let y = ay - 26; y <= ay; y++) for (let x = cx - 50; x < cx + 50; x++) { let c = y < ay - 22 ? Wd[4] : y < ay - 20 ? Wd[2] : (x - cx + 50) % 10 === 0 ? Wd[1] : Wd[3]; if (y > ay - 3) c = Wd[1]; b.set(x, y, c); }
    for (let y = ay - 18; y < ay - 6; y++) for (let x = cx - 14; x < cx + 14; x++) b.set(x, y, y === ay - 18 || y === ay - 7 ? G[1] : T[2]);
    for (let j = -3; j <= 3; j++) for (let i = -3 + Math.abs(j); i <= 3 - Math.abs(j); i++) b.set(cx + i, ay - 12 + j, i + j < 0 ? G[4] : G[3]);
    // striped awning with a scalloped edge
    for (let y = ay - 92; y < ay - 66; y++) {
      const f = (y - (ay - 92)) / 26, hw = 44 + f * 12;
      for (let x = Math.floor(cx - hw); x < Math.ceil(cx + hw); x++) { const st = Math.floor((x - cx + 120) / 10) & 1; let c = st ? T[3] : S[4]; if (f < 0.12) c = st ? T[4] : S[4]; if (f > 0.85) c = st ? T[1] : S[2]; b.set(x, y, c); }
    }
    for (let x = cx - 56; x < cx + 56; x++) { const k = (x - cx + 120) % 10, dy = k < 2 || k > 7 ? 0 : k < 4 || k > 5 ? 1 : 2; for (let y = ay - 66; y < ay - 64 + dy; y++) b.set(x, y, Math.floor((x - cx + 120) / 10) & 1 ? T[2] : S[3]); }
    // MART sign plate
    for (let y = ay - 102; y < ay - 90; y++) for (let x = cx - 18; x < cx + 18; x++) b.set(x, y, y === ay - 102 ? S[4] : S[3]);
    const txt = [['111', '101', '101'], ['111', '101', '111', '101'], ['111', '101', '110', '101'], ['111', '010', '010', '010']];
    void txt;
    const glyph = { M: ['10001', '11011', '10101', '10001', '10001'], A: ['01110', '10001', '11111', '10001', '10001'], R: ['11110', '10001', '11110', '10010', '10001'], T: ['11111', '00100', '00100', '00100', '00100'] };
    let gx = cx - 14; for (const ch of 'MART') { glyph[ch].forEach((row, j) => [...row].forEach((v, i) => { if (v === '1') b.set(gx + i, ay - 99 + j, T[1]); })); gx += 7; }
    selout(b, mix(Wd[0], [16, 18, 34], 0.3), Wd[1]);
    return b;
  });
}
