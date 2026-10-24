// mt/render/ambient-atlas.js — hand-authored pixel-art glyphs for the ambient-life layer (critters, motes, water
// glints, habitat particles). Owner: world animation / ambient-life artist.
//
// Every glyph is a short list of frames drawn as character grids at the shared world pixel grid (32 art px per
// metre, the same density as the unit sprites), packed into one small RGBA atlas (Uint8Array, no DOM needed, so
// tools can preview it from node). Two glyph families:
//   * full-colour art (birds, fish, dragonflies): drawn with their own palette, lit by the scene in the shader;
//   * tintable art (butterflies, leaves, petals, glints, motes...): painted in greys, multiplied by a per-instance
//     colour, so one bitmap serves many species / habitats / team colours.
// The atlas texture is uploaded with NearestFilter + sRGB, so colours below are authored in sRGB.

export const ATLAS_W = 256, ATLAS_H = 128;

const hex = (h) => [(h >> 16) & 255, (h >> 8) & 255, h & 255];
const G = (v) => [v, v, v];   // grey level (tintable glyphs)

/** glyph name -> { pal: {char: [r,g,b]}, frames: [ [rows...] ], ax, ay (anchor, art px from the frame's left/bottom;
 *  default centre) } */
const GLYPHS = {
  // ---------------------------------------------------------------- critters (decorative only, never units)
  // butterfly, tintable wings (w) with darker wing edges (e) and a dark body (b); flap cycle 0,1,2,1
  bfly: {
    pal: { w: G(255), e: G(150), b: [42, 34, 48] },
    frames: [
      ['ee...ee', 'ewe.ewe', '.wwbww.', '.ewbwe.', '..e.e..'],
      ['.......', '.ee.ee.', '.ewbwe.', '..wbw..', '...b...'],
      ['..e.e..', '..w.w..', '..wbw..', '...b...', '.......'],
    ],
  },
  // perched sparrow facing right: idle, peck, look-up
  birdSit: {
    pal: { d: hex(0x2e2420), B: hex(0x8a5a34), b: hex(0x5c3b22), L: hex(0xead6aa), k: hex(0xf2b33a), e: hex(0x111111) },
    frames: [
      ['...dd.', '..dBek', '.dbBLd', 'dbbbLd', 'd..dd.'],
      ['......', '...dd.', '.dbBBe', 'dbbbLk', 'd..dd.'],
      ['...dd.', '..dBek', '.dbBLd', '.bbbLd', 'd..dd.'],
    ],
    ay: 0,
  },
  // flying sparrow seen from above (wing beat: up, mid, down, mid)
  birdFly: {
    pal: { d: hex(0x2e2420), B: hex(0x8a5a34), b: hex(0x5c3b22), L: hex(0xead6aa), k: hex(0xf2b33a) },
    frames: [
      ['d.......d', 'bd.....db', '.bdBBBdb.', '...dLd...', '....k....'],
      ['.........', 'ddbbBbbdd', '...BBB...', '...dLd...', '....k....'],
      ['.........', '...dBd...', '.bbBBBbb.', 'bd.dLd.db', 'd...k...d'],
    ],
  },
  // dragonfly flying right (wings flicker between two poses)
  drag: {
    pal: { e: hex(0x1c3046), B: hex(0x2ec4c0), b: hex(0x1a7a8a), w: hex(0xd8f4ff) },
    frames: [
      ['..w.w....', '..w.w....', 'eBBBBBBbb', '..w.w....', '..w.w....'],
      ['.........', '.ww.ww...', 'eBBBBBBbb', '.ww.ww...', '.........'],
    ],
  },
  // koi leaping out of the river: nose up, level, nose down (facing right)
  fish: {
    pal: { o: hex(0xc2401a), K: hex(0xf28a2a), W: hex(0xfff2dc), e: hex(0x241010), f: hex(0xffb070) },
    frames: [
      ['....e', '...KK', '..KWK', 'fKo..', 'f....'],
      ['..KKK..', 'fKWWKKe', '..oKo..'],
      ['f....', 'fKo..', '..KWK', '...KK', '....e'],
    ],
  },
  // ---------------------------------------------------------------- water
  splash: {
    pal: { w: G(255), c: G(190) },
    frames: [
      ['.......', '..c.c..', '.c.w.c.', '..www..'],
      ['.c...c.', 'c.w.w.c', '.......', '.......'],
      ['c.....c', '.......', '.......', '.......'],
    ],
    ay: 0,
  },
  // 4-step twinkle (additive): dot, plus, star, plus
  glint: {
    pal: { w: G(255), c: G(120) },
    frames: [
      ['.....', '.....', '..w..', '.....', '.....'],
      ['.....', '..c..', '.cwc.', '..c..', '.....'],
      ['..c..', '..c..', 'ccwcc', '..c..', '..c..'],
      ['.....', '.....', '..c..', '.....', '.....'],
    ],
  },
  // big 4-point star (nexus / fountain / crystal accents, additive)
  star: {
    pal: { w: G(255), c: G(150), d: G(70) },
    frames: [
      ['.......', '.......', '...c...', '..cwc..', '...c...', '.......', '.......'],
      ['.......', '...c...', '...c...', '.ccwcc.', '...c...', '...c...', '.......'],
      ['...d...', '...c...', '..cwc..', 'dcwwwcd', '..cwc..', '...c...', '...d...'],
      ['.......', '...d...', '...c...', '.dcwcd.', '...c...', '...d...', '.......'],
    ],
  },
  // drifting caustic dash on the water surface (additive), lengths 2..6
  dash: {
    pal: { w: G(255), c: G(130) },
    frames: [['cc'], ['cwc'], ['cwwc'], ['cwwwc'], ['ccwwcc']],
  },
  foam: {
    pal: { w: G(255), c: G(200) },
    frames: [['ww', 'wc'], ['wwc', '.cw'], ['.w.', 'wwc', '.c.']],
  },
  bubble: {
    pal: { w: G(255), c: G(185) },
    frames: [
      ['.c.', 'w.c', '.c.'],
      ['.cc.', 'w..c', 'c..c', '.cc.'],
      ['c...c', '.....', '.....', '.....', 'c...c'],
    ],
  },
  // ---------------------------------------------------------------- air
  // tumbling leaf (tintable): flat, turning, edge-on, turning back
  leaf: {
    pal: { G: G(255), g: G(170) },
    frames: [
      ['.GG.', 'GGgG', '.GG.'],
      ['..G.', '.Gg.', '.G..'],
      ['....', 'GGGg', '....'],
      ['.G..', '.gG.', '..G.'],
    ],
  },
  petal: {
    pal: { G: G(255), g: G(200) },
    frames: [['.G', 'Gg'], ['GG', '..'], ['G.', '.g'], ['.G', '.G']],
  },
  dot: { pal: { w: G(255) }, frames: [['w'], ['ww'], ['ww', 'ww']] },
  // firefly (additive): halo + core, core only
  fly: {
    pal: { w: G(255), c: G(80) },
    frames: [['.c.', 'cwc', '.c.'], ['...', '.w.', '...']],
  },
  ember: {
    pal: { w: G(255), c: G(150) },
    frames: [['wc', 'cc'], ['w'], ['c']],
  },
  // electric zap segments and a crackle star (additive)
  zap: {
    pal: { w: G(255), c: G(140) },
    frames: [['w..', '.w.', '..w'], ['..w', '.w.', 'w..'], ['.c.', 'cwc', '.c.'], ['w']],
  },
  // wind streak (additive): growing / shrinking 1-px line with dim ends
  streak: {
    pal: { w: G(255), c: G(110), d: G(50) },
    frames: [['dccd'], ['dcwwcd'], ['dcwwwwcd'], ['dccwwwwccd'], ['ddccwwccdd'], ['ddcccd']],
  },
  // soft round puff painted solid; the shader dithers it by instance alpha (mist, dust clouds, spray)
  puff: {
    pal: { w: G(255), c: G(225) },
    frames: [
      ['.ww.', 'wwww', 'wwcw', '.ww.'],
      ['..www..', '.wwwww.', 'wwwwwww', 'wwwwwcw', '.wwwcw.', '..www..'],
      ['...www...', '.wwwwwww.', 'wwwwwwwww', 'wwwwwwwcw', 'wwwwwwccw', '.wwwwcww.', '...www...'],
    ],
  },
  // small ground shadow under flying critters (dark, dithered by alpha)
  shadow: {
    pal: { s: hex(0x1a1e30) },
    frames: [['sss'], ['.sss.', 'sssss'], ['.sssss.', 'sssssss', '.sssss.']],
  },
  // expanding ripple rings, generated below (ellipse squashed by the camera pitch)
  ripple: null,
};

/** 1-px ellipse outline frames for ripples (screen-aligned: vertical radius = horizontal × sin(pitch 52°)). */
function rippleFrames() {
  const out = [];
  const sizes = [4, 7, 10, 13, 16, 19];
  for (let fi = 0; fi < sizes.length; fi++) {
    const W = sizes[fi], H = Math.max(3, Math.round(W * 0.62) | 1), rx = (W - 1) / 2, ry = (H - 1) / 2;
    const rows = Array.from({ length: H }, () => Array(W).fill('.'));
    for (let a = 0; a < 720; a++) {
      const t = (a / 720) * Math.PI * 2, x = Math.round(rx + Math.cos(t) * rx), y = Math.round(ry + Math.sin(t) * ry);
      // late frames break up (fade by dropping pixels), the near (lower) half stays brighter
      const keep = fi < 4 || ((x + y) & 1) === 0 || (fi === 4 && y > ry);
      if (keep) rows[y][x] = y > ry ? 'w' : 'c';
    }
    out.push(rows.map((r) => r.join('')));
  }
  return out;
}
GLYPHS.ripple = { pal: { w: G(255), c: G(170) }, frames: rippleFrames() };

/** wind streaks along the screen projection of the map wind (right and gently down: 1 px down per 2 px across). */
function streakFrames() {
  return [4, 7, 10, 13, 10, 6].map((L) => {
    const H = Math.floor((L - 1) / 2) + 1, rows = Array.from({ length: H }, () => Array(L).fill('.'));
    for (let i = 0; i < L; i++) { const e = Math.min(i, L - 1 - i); rows[Math.floor(i / 2)][i] = e === 0 ? 'd' : e === 1 ? 'c' : 'w'; }
    return rows.map((r) => r.join(''));
  });
}
GLYPHS.streakD = { pal: { w: G(255), c: G(120), d: G(55) }, frames: streakFrames() };

/**
 * Build the atlas: returns { data: Uint8Array RGBA (row 0 = TOP of the image), w, h, glyphs: {name: [frame]} } with
 * frame = {x, y (top-left px, image rows from the top), w, h, ax, ay}.
 */
export function buildAmbientAtlas() {
  const data = new Uint8Array(ATLAS_W * ATLAS_H * 4);
  const glyphs = {};
  let cx = 1, cy = 1, rowH = 0;
  for (const name of Object.keys(GLYPHS)) {
    const g = GLYPHS[name]; glyphs[name] = [];
    for (const rows of g.frames) {
      const h = rows.length, w = Math.max(...rows.map((r) => r.length));
      if (cx + w + 1 > ATLAS_W) { cx = 1; cy += rowH + 1; rowH = 0; }
      if (cy + h + 1 > ATLAS_H) throw new Error('ambient atlas full');
      for (let y = 0; y < h; y++) for (let x = 0; x < rows[y].length; x++) {
        const ch = rows[y][x]; if (ch === '.' || ch === ' ') continue;
        const col = g.pal[ch]; if (!col) continue;
        const o = ((cy + y) * ATLAS_W + cx + x) * 4;
        data[o] = col[0]; data[o + 1] = col[1]; data[o + 2] = col[2]; data[o + 3] = 255;
      }
      glyphs[name].push({ x: cx, y: cy, w, h, ax: g.ax ?? Math.floor(w / 2), ay: g.ay ?? Math.floor(h / 2) });
      cx += w + 1; rowH = Math.max(rowH, h);
    }
  }
  return { data, w: ATLAS_W, h: ATLAS_H, glyphs };
}
