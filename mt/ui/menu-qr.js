// mt/ui/menu-qr.js — a tiny QR Code encoder (byte mode, versions 1-10, error correction M, else L) for the online
// room's invite link, drawn as pixel art. Owner: UX flow. No DOM at import; no third-party code (written from the
// ISO/IEC 18004 structure: finder / timing / alignment patterns, format + version info with their BCH codes,
// Reed-Solomon over GF(256) with the 0x11D polynomial, block interleaving, the 8 masks and the 4 penalty rules).
//
//   qrMatrix('https://…?join=ABCD') -> { size, dark: Uint8Array(size*size) } | null (too long for version 10)
//   qrCanvas(text, { module = 2, quiet = 3, dark = '#0d1230', light = '#fffdf4' }) -> <canvas> (one module = `module` art px)

// ------------------------------------------------------------------------------------------------ tables (v1..10)
const ECC_PER_BLOCK = { L: [7, 10, 15, 20, 26, 18, 20, 24, 30, 18], M: [10, 16, 26, 18, 24, 16, 18, 22, 22, 26] };
const NUM_BLOCKS = { L: [1, 1, 1, 1, 1, 2, 2, 2, 2, 4], M: [1, 1, 1, 2, 2, 4, 4, 4, 5, 5] };
const ECL_BITS = { L: 1, M: 0 };

function rawModules(ver) {
  let r = (16 * ver + 128) * ver + 64;
  if (ver >= 2) { const n = Math.floor(ver / 7) + 2; r -= (25 * n - 10) * n - 55; if (ver >= 7) r -= 36; }
  return r;
}
const dataCodewords = (ver, ecl) => Math.floor(rawModules(ver) / 8) - ECC_PER_BLOCK[ecl][ver - 1] * NUM_BLOCKS[ecl][ver - 1];

// ------------------------------------------------------------------------------------------------ Reed-Solomon
function gfMul(x, y) { let z = 0; for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11d); z ^= ((y >>> i) & 1) * x; } return z & 255; }
function rsDivisor(degree) {
  const r = new Array(degree).fill(0); r[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < r.length; j++) { r[j] = gfMul(r[j], root); if (j + 1 < r.length) r[j] ^= r[j + 1]; }
    root = gfMul(root, 2);
  }
  return r;
}
function rsRemainder(data, div) {
  const r = div.map(() => 0);
  for (const b of data) { const f = b ^ r.shift(); r.push(0); div.forEach((c, i) => { r[i] ^= gfMul(c, f); }); }
  return r;
}

// ------------------------------------------------------------------------------------------------ encoder
export function qrMatrix(text) {
  const bytes = Array.from(new TextEncoder().encode(String(text)));
  let ver = 0, ecl = 'M';
  for (const e of ['M', 'L']) { for (let v = 1; v <= 10; v++) { const cap = dataCodewords(v, e) * 8 - 4 - (v <= 9 ? 8 : 16); if (bytes.length * 8 <= cap) { ver = v; ecl = e; break; } } if (ver) break; }
  if (!ver) return null;
  // data bits: byte mode, count, payload, terminator, byte pad, 0xEC / 0x11 fill
  const bits = [];
  const put = (v, n) => { for (let i = n - 1; i >= 0; i--) bits.push((v >>> i) & 1); };
  put(4, 4); put(bytes.length, ver <= 9 ? 8 : 16); for (const b of bytes) put(b, 8);
  const cap = dataCodewords(ver, ecl) * 8;
  put(0, Math.min(4, cap - bits.length)); while (bits.length % 8) bits.push(0);
  for (let p = 0xec; bits.length < cap; p ^= 0xec ^ 0x11) put(p, 8);
  const data = []; for (let i = 0; i < bits.length; i += 8) { let b = 0; for (let k = 0; k < 8; k++) b = (b << 1) | bits[i + k]; data.push(b); }
  // blocks + ECC, interleaved
  const nb = NUM_BLOCKS[ecl][ver - 1], el = ECC_PER_BLOCK[ecl][ver - 1], raw = Math.floor(rawModules(ver) / 8);
  const nShort = nb - (raw % nb), shortLen = Math.floor(raw / nb), div = rsDivisor(el), blocks = [];
  for (let i = 0, k = 0; i < nb; i++) {
    const d = data.slice(k, k + shortLen - el + (i < nShort ? 0 : 1)); k += d.length;
    const ecc = rsRemainder(d, div); if (i < nShort) d.push(0);
    blocks.push(d.concat(ecc));
  }
  const cw = [];
  for (let i = 0; i < blocks[0].length; i++) blocks.forEach((b, j) => { if (i !== shortLen - el || j >= nShort) cw.push(b[i]); });

  // ---------------------------------------------------------------- matrix
  const size = ver * 4 + 17, M = new Uint8Array(size * size), F = new Uint8Array(size * size);
  const set = (x, y, d) => { M[y * size + x] = d ? 1 : 0; F[y * size + x] = 1; };
  for (let i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  const finder = (cx, cy) => { for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const x = cx + dx, y = cy + dy, d = Math.max(Math.abs(dx), Math.abs(dy)); if (x >= 0 && y >= 0 && x < size && y < size) set(x, y, d !== 2 && d !== 4); } };
  finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
  if (ver > 1) {
    const n = Math.floor(ver / 7) + 2, step = Math.ceil((ver * 4 + 4) / (n * 2 - 2)) * 2, pos = [6];
    for (let p = size - 7; pos.length < n; p -= step) pos.splice(1, 0, p);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === n - 1) || (i === n - 1 && j === 0)) continue;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(pos[i] + dx, pos[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
  }
  const format = (mask) => {
    const d = (ECL_BITS[ecl] << 3) | mask; let r = d; for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
    const b = ((d << 10) | r) ^ 0x5412, bit = (i) => (b >>> i) & 1;
    for (let i = 0; i <= 5; i++) set(8, i, bit(i));
    set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
    for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(i));
    set(8, size - 8, 1);
  };
  format(0);
  if (ver >= 7) {
    let r = ver; for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1f25);
    const b = (ver << 12) | r;
    for (let i = 0; i < 18; i++) { const bit = (b >>> i) & 1, a = size - 11 + (i % 3), c = Math.floor(i / 3); set(a, c, bit); set(c, a, bit); }
  }
  // codewords in the zig-zag
  let bi = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let v = 0; v < size; v++) for (let j = 0; j < 2; j++) {
      const x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - v : v;
      if (!F[y * size + x] && bi < cw.length * 8) { M[y * size + x] = (cw[bi >>> 3] >>> (7 - (bi & 7))) & 1; bi++; }
    }
  }
  // the mask with the lowest penalty
  const MASKS = [(x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x) => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
    (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
    (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0, (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0];
  const applyMask = (k) => { const f = MASKS[k]; for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!F[y * size + x] && f(x, y)) M[y * size + x] ^= 1; };
  let best = 0, bestP = Infinity;
  for (let k = 0; k < 8; k++) { applyMask(k); format(k); const p = penalty(M, size); if (p < bestP) { bestP = p; best = k; } applyMask(k); }
  applyMask(best); format(best);
  return { size, dark: M, version: ver, ecl, mask: best };
}

/** ISO 18004 penalty rules N1..N4 */
function penalty(M, size) {
  let p = 0;
  const at = (x, y) => M[y * size + x];
  for (let pass = 0; pass < 2; pass++) for (let a = 0; a < size; a++) {
    let run = 1, prev = -1;
    const seq = [];
    for (let b = 0; b < size; b++) {
      const v = pass ? at(a, b) : at(b, a); seq.push(v);
      if (v === prev) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else { run = 1; prev = v; }
    }
    // N3: 1:1:3:1:1 finder-like runs with 4 light modules on one side
    for (let b = 0; b + 10 < size + 1; b++) {
      const s = seq.slice(b, b + 11).join('');
      if (s === '10111010000' || s === '00001011101') p += 40;
    }
  }
  for (let y = 0; y < size - 1; y++) for (let x = 0; x < size - 1; x++) { const c = at(x, y); if (c === at(x + 1, y) && c === at(x, y + 1) && c === at(x + 1, y + 1)) p += 3; }
  let dark = 0; for (let i = 0; i < M.length; i++) dark += M[i];
  const total = size * size, k = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
  return p + Math.max(0, k) * 10;
}

/** the matrix as a pixel canvas: each module `module` art px, a light quiet zone of `quiet` modules */
export function qrCanvas(text, o = {}) {
  const q = qrMatrix(text); if (!q) return null;
  const m = o.module || 2, z = o.quiet ?? 3, n = (q.size + z * 2) * m;
  const c = document.createElement('canvas'); c.width = n; c.height = n;
  const g = c.getContext('2d');
  g.fillStyle = o.light || '#fffdf4'; g.fillRect(0, 0, n, n);
  g.fillStyle = o.dark || '#0d1230';
  for (let y = 0; y < q.size; y++) for (let x = 0; x < q.size; x++) if (q.dark[y * q.size + x]) g.fillRect((x + z) * m, (y + z) * m, m, m);
  c.dataset.version = String(q.version);
  return c;
}
