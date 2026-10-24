// mt/ui/pixelfont.js — "Vale Pixel": a hand-authored proportional bitmap font, compiled at runtime into a real
// TrueType font (ArrayBuffer -> FontFace) so DOM text and canvas text share one crisp pixel face. Owner: HUD.
//
// Metrics: 1 font pixel = 100 units, unitsPerEm = 1000 -> font-size 10px = 1 font pixel per CSS px.
// Use font-size 10*n px (n integer) and integer positions for perfectly crisp glyphs.
// Cap height 7 px, x-height 5 px, descender 2 px, ascent 8 px (line box = 10 px at 1x).
// Families: 'Vale Pixel' (1 px strokes) and 'Vale Pixel Bold' (strokes dilated 1 px to the right).
// No network: the font is built from the glyph table below.

// glyph: [topRow, 'rows|separated|by|pipes'] ; rows count from the ascender line (row 0 = 8 px above baseline,
// row 7 = the last row sitting on the baseline, rows 8-9 = descender).
const G = {
  A: [1, '.###.|#...#|#...#|#####|#...#|#...#|#...#'],
  B: [1, '####.|#...#|#...#|####.|#...#|#...#|####.'],
  C: [1, '.###.|#...#|#....|#....|#....|#...#|.###.'],
  D: [1, '####.|#...#|#...#|#...#|#...#|#...#|####.'],
  E: [1, '#####|#....|#....|####.|#....|#....|#####'],
  F: [1, '#####|#....|#....|####.|#....|#....|#....'],
  G: [1, '.###.|#...#|#....|#.###|#...#|#...#|.####'],
  H: [1, '#...#|#...#|#...#|#####|#...#|#...#|#...#'],
  I: [1, '###|.#.|.#.|.#.|.#.|.#.|###'],
  J: [1, '..###|...#.|...#.|...#.|#..#.|#..#.|.##..'],
  K: [1, '#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#'],
  L: [1, '#...|#...|#...|#...|#...|#...|####'],
  M: [1, '#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#'],
  N: [1, '#...#|##..#|#.#.#|#..##|#...#|#...#|#...#'],
  O: [1, '.###.|#...#|#...#|#...#|#...#|#...#|.###.'],
  P: [1, '####.|#...#|#...#|####.|#....|#....|#....'],
  Q: [1, '.###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#'],
  R: [1, '####.|#...#|#...#|####.|#.#..|#..#.|#...#'],
  S: [1, '.###.|#...#|#....|.###.|....#|#...#|.###.'],
  T: [1, '#####|..#..|..#..|..#..|..#..|..#..|..#..'],
  U: [1, '#...#|#...#|#...#|#...#|#...#|#...#|.###.'],
  V: [1, '#...#|#...#|#...#|#...#|.#.#.|.#.#.|..#..'],
  W: [1, '#...#|#...#|#...#|#.#.#|#.#.#|##.##|#...#'],
  X: [1, '#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#'],
  Y: [1, '#...#|#...#|.#.#.|..#..|..#..|..#..|..#..'],
  Z: [1, '#####|....#|...#.|..#..|.#...|#....|#####'],
  a: [3, '.###.|....#|.####|#...#|.####'],
  b: [1, '#....|#....|####.|#...#|#...#|#...#|####.'],
  c: [3, '.###|#...|#...|#...|.###'],
  d: [1, '....#|....#|.####|#...#|#...#|#...#|.####'],
  e: [3, '.###.|#...#|#####|#....|.###.'],
  f: [1, '..##|.#..|####|.#..|.#..|.#..|.#..'],
  g: [3, '.####|#...#|#...#|#...#|.####|....#|.###.'],
  h: [1, '#....|#....|####.|#...#|#...#|#...#|#...#'],
  i: [1, '#|.|#|#|#|#|#'],
  j: [1, '..#|...|..#|..#|..#|..#|..#|#.#|.#.'],
  k: [1, '#...|#...|#..#|#.#.|##..|#.#.|#..#'],
  l: [1, '#.|#.|#.|#.|#.|#.|.#'],
  m: [3, '####.|#.#.#|#.#.#|#.#.#|#.#.#'],
  n: [3, '####.|#...#|#...#|#...#|#...#'],
  o: [3, '.###.|#...#|#...#|#...#|.###.'],
  p: [3, '####.|#...#|#...#|#...#|####.|#....|#....'],
  q: [3, '.####|#...#|#...#|#...#|.####|....#|....#'],
  r: [3, '#.##|##..|#...|#...|#...'],
  s: [3, '.####|#....|.###.|....#|####.'],
  t: [1, '.#..|.#..|####|.#..|.#..|.#..|..##'],
  u: [3, '#...#|#...#|#...#|#...#|.####'],
  v: [3, '#...#|#...#|#...#|.#.#.|..#..'],
  w: [3, '#...#|#.#.#|#.#.#|#.#.#|.#.#.'],
  x: [3, '#...#|.#.#.|..#..|.#.#.|#...#'],
  y: [3, '#...#|#...#|#...#|#...#|.####|....#|.###.'],
  z: [3, '#####|...#.|..#..|.#...|#####'],
  0: [1, '.###.|#...#|#...#|#...#|#...#|#...#|.###.'],
  1: [1, '..#..|.##..|..#..|..#..|..#..|..#..|.###.'],
  2: [1, '.###.|#...#|....#|...#.|..#..|.#...|#####'],
  3: [1, '.###.|#...#|....#|..##.|....#|#...#|.###.'],
  4: [1, '...#.|..##.|.#.#.|#..#.|#####|...#.|...#.'],
  5: [1, '#####|#....|####.|....#|....#|#...#|.###.'],
  6: [1, '..##.|.#...|#....|####.|#...#|#...#|.###.'],
  7: [1, '#####|....#|...#.|..#..|.#...|.#...|.#...'],
  8: [1, '.###.|#...#|#...#|.###.|#...#|#...#|.###.'],
  9: [1, '.###.|#...#|#...#|.####|....#|...#.|.##..'],
  ' ': [1, '...'],
  '!': [1, '#|#|#|#|#|.|#'],
  '?': [1, '.###.|#...#|....#|...#.|..#..|.....|..#..'],
  '.': [7, '#'],
  ',': [7, '.#|#.'],
  ':': [3, '#|.|.|#'],
  ';': [3, '.#|..|..|.#|#.'],
  "'": [1, '#|#'],
  '"': [1, '#.#|#.#'],
  '-': [4, '####'],
  '+': [2, '..#..|..#..|#####|..#..|..#..'],
  '=': [3, '#####|.....|#####'],
  '/': [1, '....#|...#.|...#.|..#..|.#...|.#...|#....'],
  '\\': [1, '#....|.#...|.#...|..#..|...#.|...#.|....#'],
  '(': [1, '..#|.#.|#..|#..|#..|.#.|..#'],
  ')': [1, '#..|.#.|..#|..#|..#|.#.|#..'],
  '[': [1, '##|#.|#.|#.|#.|#.|##'],
  ']': [1, '##|.#|.#|.#|.#|.#|##'],
  '%': [1, '##..#|##.#.|...#.|..#..|.#...|.#.##|#..##'],
  '#': [2, '.#.#.|#####|.#.#.|#####|.#.#.'],
  '*': [2, '..#..|#.#.#|.###.|#.#.#|..#..'],
  '_': [8, '#####'],
  '<': [2, '...#|..#.|.#..|#...|.#..|..#.|...#'],
  '>': [2, '#...|.#..|..#.|...#|..#.|.#..|#...'],
  '&': [1, '.##..|#..#.|#.#..|.#...|#.#.#|#..#.|.##.#'],
  '~': [3, '.#..#|#.##.'],
  '×': [3, '#...#|.#.#.|..#..|.#.#.|#...#'],             // ×
  '·': [4, '#'],                                         // ·
  '…': [7, '#.#.#'],                                     // …
  '–': [4, '#####'],                                     // –
  '—': [4, '#######'],                                   // —
  'é': [1, '...#.|..#..|.###.|#...#|#####|#....|.###.'],  // é
  'É': [0, '..#..|#####|#....|#....|####.|#....|#....|#####'], // É
  '▲': [3, '..#..|.###.|#####'],                         // ▲
  '▼': [3, '#####|.###.|..#..'],                         // ▼
  '◀': [2, '..#|.##|###|.##|..#'],                       // ◀
  '▶': [2, '#..|##.|###|##.|#..'],                       // ▶
  '★': [1, '..#..|..#..|#####|.###.|.###.|##.##|#...#'],  // ★
  '✓': [3, '....#|...#.|#.#..|.#...'],                   // ✓
  '♥': [2, '.#.#.|#####|#####|.###.|..#..'],             // ♥
  '↑': [1, '..#..|.###.|#.#.#|..#..|..#..|..#..|..#..'],  // ↑
  '↓': [1, '..#..|..#..|..#..|..#..|#.#.#|.###.|..#..'],  // ↓
  '←': [2, '..#....|.#.....|#######|.#.....|..#....'],    // ←
  '→': [2, '....#..|.....#.|#######|.....#.|....#..'],    // →
};

const PX = 100, ASC = 800, DESC = 200, UPEM = 1000;

function parse(ch, bold) {
  const [top, src] = G[ch];
  let rows = src.split('|').map((r) => [...r].map((c) => c === '#'));
  let w = rows[0].length;
  if (bold && ch !== ' ') {
    // Bold = 1 px dilation to the right. A 1-px gap between two strokes ('#.#', e.g. inside m, w, M, W, #) would be
    // filled and the glyph would turn into a solid block ('Summoner' -> 'Su▪▪oner'), so every such gap column is
    // first doubled (copying the gap column, which keeps horizontal bars continuous) and the dilation then leaves
    // a clean 1-px gap between 2-px stems.
    const gaps = new Set();
    for (const r of rows) for (let x = 0; x + 2 < r.length; x++) if (r[x] && !r[x + 1] && r[x + 2]) gaps.add(x + 1);
    for (const g of [...gaps].sort((a, b) => b - a)) { rows = rows.map((r) => [...r.slice(0, g + 1), r[g], ...r.slice(g + 1)]); w++; }
    rows = rows.map((r) => { const o = r.concat([false]); for (let x = r.length - 1; x >= 0; x--) if (r[x]) o[x + 1] = true; return o; }); w += 1;
  }
  return { top, rows, w };
}

// greedy rectangle cover of the pixel grid -> list of [x0, y0, x1, y1] in pixel coords (y down from row 0)
function rects(g) {
  const used = g.rows.map((r) => r.map(() => false));
  const out = [];
  for (let y = 0; y < g.rows.length; y++) {
    for (let x = 0; x < g.w; x++) {
      if (!g.rows[y][x] || used[y][x]) continue;
      let x1 = x; while (x1 + 1 < g.w && g.rows[y][x1 + 1] && !used[y][x1 + 1]) x1++;
      let y1 = y;
      outer: while (y1 + 1 < g.rows.length) {
        for (let k = x; k <= x1; k++) if (!g.rows[y1 + 1][k] || used[y1 + 1][k]) break outer;
        y1++;
      }
      for (let yy = y; yy <= y1; yy++) for (let k = x; k <= x1; k++) used[yy][k] = true;
      out.push([x, y + g.top, x1 + 1, y1 + 1 + g.top]);
    }
  }
  return out;
}

// --------------------------------------------------------------------------------------- TTF writer
class W {
  constructor(n) { this.b = new DataView(new ArrayBuffer(n)); this.o = 0; }
  u8(v) { this.b.setUint8(this.o, v); this.o += 1; return this; }
  u16(v) { this.b.setUint16(this.o, v); this.o += 2; return this; }
  i16(v) { this.b.setInt16(this.o, v); this.o += 2; return this; }
  u32(v) { this.b.setUint32(this.o, v >>> 0); this.o += 4; return this; }
  tag(s) { for (let i = 0; i < 4; i++) this.u8(s.charCodeAt(i)); return this; }
  bytes() { return new Uint8Array(this.b.buffer, 0, this.o); }
}
const pad4 = (n) => (n + 3) & ~3;
function checksum(u8) {
  let s = 0; const n = pad4(u8.length);
  for (let i = 0; i < n; i += 4) s = (s + (((u8[i] || 0) << 24) | ((u8[i + 1] || 0) << 16) | ((u8[i + 2] || 0) << 8) | (u8[i + 3] || 0))) >>> 0;
  return s;
}

function buildTTF(family, bold) {
  const chars = Object.keys(G).sort((a, b) => a.codePointAt(0) - b.codePointAt(0));
  const glyphs = [{ code: -1, rects: [[0, 1, 4, 8]], adv: 5 }]; // .notdef: a box
  for (const ch of chars) { const g = parse(ch, bold); glyphs.push({ code: ch.codePointAt(0), rects: ch === ' ' ? [] : rects(g), adv: g.w + 1 }); }
  // glyf + loca
  const glyfParts = []; const loca = []; let off = 0; let maxPts = 0, maxCont = 0;
  let gxMin = 0, gyMin = 0, gxMax = 0, gyMax = 0;
  for (const g of glyphs) {
    loca.push(off);
    if (!g.rects.length) { g.xMin = 0; g.xMax = 0; continue; }
    const n = g.rects.length; const pts = n * 4;
    const w = new W(10 + n * 2 + 2 + pts + pts * 4 + 4);
    let xMin = 1e9, yMin = 1e9, xMax = -1e9, yMax = -1e9;
    const P = [];
    for (const [x0, y0, x1, y1] of g.rects) {
      const X0 = x0 * PX, X1 = x1 * PX, Y0 = ASC - y1 * PX, Y1 = ASC - y0 * PX; // font y up
      // clockwise: (X0,Y0) -> (X0,Y1) -> (X1,Y1) -> (X1,Y0)
      P.push([X0, Y0], [X0, Y1], [X1, Y1], [X1, Y0]);
      xMin = Math.min(xMin, X0); xMax = Math.max(xMax, X1); yMin = Math.min(yMin, Y0); yMax = Math.max(yMax, Y1);
    }
    g.xMin = xMin; g.xMax = xMax;
    gxMin = Math.min(gxMin, xMin); gyMin = Math.min(gyMin, yMin); gxMax = Math.max(gxMax, xMax); gyMax = Math.max(gyMax, yMax);
    maxPts = Math.max(maxPts, pts); maxCont = Math.max(maxCont, n);
    w.i16(n).i16(xMin).i16(yMin).i16(xMax).i16(yMax);
    for (let i = 0; i < n; i++) w.u16(i * 4 + 3);
    w.u16(0); // instructions
    for (let i = 0; i < pts; i++) w.u8(1); // on-curve, x/y as int16 deltas
    let px = 0; for (const p of P) { w.i16(p[0] - px); px = p[0]; }
    let py = 0; for (const p of P) { w.i16(p[1] - py); py = p[1]; }
    const len = pad4(w.o); const bytes = new Uint8Array(len); bytes.set(w.bytes());
    glyfParts.push(bytes); off += len;
  }
  loca.push(off);
  const glyf = new Uint8Array(off); { let o = 0; for (const p of glyfParts) { glyf.set(p, o); o += p.length; } }
  const locaW = new W(loca.length * 4); for (const v of loca) locaW.u32(v);
  const numG = glyphs.length;
  const advMax = Math.max(...glyphs.map((g) => g.adv)) * PX;
  // hmtx
  const hmtx = new W(numG * 4); for (const g of glyphs) hmtx.u16(g.adv * PX).i16(g.xMin || 0);
  // cmap format 4
  const codes = glyphs.slice(1).map((g, i) => [g.code, i + 1]).filter(([c]) => c <= 0xffff);
  const segs = [];
  for (const [c, gid] of codes) {
    const s = segs[segs.length - 1];
    if (s && c === s.end + 1 && gid === s.gid0 + (c - s.start)) s.end = c; else segs.push({ start: c, end: c, gid0: gid });
  }
  segs.push({ start: 0xffff, end: 0xffff, gid0: 1, last: true });
  const segX2 = segs.length * 2;
  const sub = new W(16 + segs.length * 8);
  let sr = 1, es = 0; while (sr * 2 <= segs.length) { sr *= 2; es++; }
  sub.u16(4).u16(16 + segs.length * 8).u16(0).u16(segX2).u16(sr * 2).u16(es).u16(segX2 - sr * 2);
  for (const s of segs) sub.u16(s.end); sub.u16(0);
  for (const s of segs) sub.u16(s.start);
  for (const s of segs) sub.u16(s.last ? 1 : (s.gid0 - s.start) & 0xffff);
  for (let i = 0; i < segs.length; i++) sub.u16(0);
  const subB = sub.bytes();
  const cmap = new W(12 + subB.length); cmap.u16(0).u16(1).u16(3).u16(1).u32(12);
  const cmapB = new Uint8Array(12 + subB.length); cmapB.set(cmap.bytes()); cmapB.set(subB, 12);
  // name
  const style = 'Regular';
  const names = [[1, family], [2, style], [3, family + ' ' + style + ' 1.0'], [4, family], [5, 'Version 1.0'], [6, family.replace(/\s+/g, '') + '-' + style]];
  const strs = names.map(([, s]) => { const a = new Uint8Array(s.length * 2); for (let i = 0; i < s.length; i++) { a[i * 2] = 0; a[i * 2 + 1] = s.charCodeAt(i) & 0xff; } return a; });
  const nameHead = 6 + names.length * 12; let strOff = 0;
  const nameW = new W(nameHead + strs.reduce((s, a) => s + a.length, 0));
  nameW.u16(0).u16(names.length).u16(nameHead);
  names.forEach(([id], i) => { nameW.u16(3).u16(1).u16(0x409).u16(id).u16(strs[i].length).u16(strOff); strOff += strs[i].length; });
  for (const a of strs) for (const v of a) nameW.u8(v);
  // head
  const head = new W(54);
  head.u32(0x00010000).u32(0x00010000).u32(0).u32(0x5f0f3cf5).u16(0x000b).u16(UPEM).u32(0).u32(0).u32(0).u32(0)
    .i16(gxMin).i16(gyMin).i16(gxMax).i16(gyMax).u16(bold ? 1 : 0).u16(8).i16(2).i16(1).i16(0);
  // hhea
  const hhea = new W(36);
  hhea.u32(0x00010000).i16(ASC).i16(-DESC).i16(0).u16(advMax).i16(0).i16(0).i16(gxMax).i16(1).i16(0).i16(0)
    .i16(0).i16(0).i16(0).i16(0).i16(0).u16(numG);
  // maxp
  const maxp = new W(32);
  maxp.u32(0x00010000).u16(numG).u16(maxPts).u16(maxCont).u16(0).u16(0).u16(2).u16(0).u16(0).u16(0).u16(0).u16(0).u16(0).u16(0).u16(0);
  // OS/2 v4
  const os2 = new W(96);
  const avg = Math.round(glyphs.reduce((s, g) => s + g.adv, 0) / numG * PX);
  os2.u16(4).i16(avg).u16(bold ? 700 : 400).u16(5).u16(0)
    .i16(650).i16(700).i16(0).i16(140).i16(650).i16(700).i16(0).i16(480).i16(50).i16(250).i16(0);
  for (let i = 0; i < 10; i++) os2.u8(0);
  os2.u32(1).u32(0).u32(0).u32(0).tag('MTPX').u16(bold ? 0x20 : 0x40).u16(0x20).u16(Math.min(0xffff, Math.max(...codes.map((c) => c[0]))))
    .i16(ASC).i16(-DESC).i16(0).u16(ASC).u16(DESC).u32(1).u32(0).i16(500).i16(700).u16(0).u16(32).u16(1);
  // post v3
  const post = new W(32); post.u32(0x00030000).u32(0).i16(-100).i16(100).u32(1).u32(0).u32(0).u32(0).u32(0);

  const tables = [
    ['OS/2', os2.bytes()], ['cmap', cmapB], ['glyf', glyf], ['head', head.bytes()], ['hhea', hhea.bytes()],
    ['hmtx', hmtx.bytes()], ['loca', locaW.bytes()], ['maxp', maxp.bytes()], ['name', nameW.bytes()], ['post', post.bytes()],
  ];
  const nT = tables.length; let sr2 = 1, es2 = 0; while (sr2 * 2 <= nT) { sr2 *= 2; es2++; }
  let total = 12 + nT * 16; for (const [, b] of tables) total += pad4(b.length);
  const out = new Uint8Array(total); const dv = new DataView(out.buffer);
  dv.setUint32(0, 0x00010000); dv.setUint16(4, nT); dv.setUint16(6, sr2 * 16); dv.setUint16(8, es2); dv.setUint16(10, nT * 16 - sr2 * 16);
  let o = 12 + nT * 16, headOff = 0;
  tables.forEach(([tag, b], i) => {
    const r = 12 + i * 16;
    for (let k = 0; k < 4; k++) out[r + k] = tag.charCodeAt(k);
    dv.setUint32(r + 4, checksum(b)); dv.setUint32(r + 8, o); dv.setUint32(r + 12, b.length);
    out.set(b, o); if (tag === 'head') headOff = o; o += pad4(b.length);
  });
  dv.setUint32(headOff + 8, (0xb1b0afba - checksum(out)) >>> 0);
  return out.buffer;
}

export const FONT = 'Vale Pixel';
export const FONT_BOLD = 'Vale Pixel Bold';
let ready = null;
/** Registers both faces once; resolves true when usable. Safe to call repeatedly. */
export function loadPixelFonts() {
  if (ready) return ready;
  ready = (async () => {
    if (typeof FontFace === 'undefined' || typeof document === 'undefined') return false;
    const faces = [new FontFace(FONT, buildTTF(FONT, false)), new FontFace(FONT_BOLD, buildTTF(FONT_BOLD, true))];
    for (const f of faces) { await f.load(); document.fonts.add(f); }
    return true;
  })().catch((e) => { console.error('[mt-ui] pixel font', e); return false; });
  return ready;
}
/** Advance width in font pixels (for layout without measuring). */
export function textWidthPx(str, bold = false) {
  let w = 0; for (const ch of str) w += parse(G[ch] ? ch : '?', bold).w + 1;
  return Math.max(0, w - 1);
}
export const _buildTTF = buildTTF;
