// mt/voxel/models/baked.js — compact binary bundle for pre-built voxel character rigs (tools/voxel-bake.mjs writes it,
// models/index.js reads it). Owner: voxel character design.
//
// File (little endian): 'VXB1' | u32 jsonBytes | JSON (utf8) | pad to 4 | data
//   JSON = { v: 1, entries: { key: { anim, height, radius, size, parts: [[name, sx, sy, sz, pivot, at, parent, pal, off, len]] }
//                               | { alias: key } } }
//   Each part's grid is a run-length list over the kit's index order ((y * sz + z) * sx + x): LEB128 varint pairs
//   (run, palIndex), palIndex 0 = empty, else pal[palIndex - 1] = 0xRRGGBB. Interior voxels (all 6 neighbours filled)
//   share one colour before encoding (never visible; long runs).
// Keys: `<id>|<team>|<variant>`, team = blue | red | null, '*' = any (monsters: `<id>|*|*`).
import { VoxelModel } from '../kit.js';

const FILLED = 1 << 24;

// ------------------------------------------------------------------------------------------------ encode (Node tool)
function varint(out, n) { while (n >= 128) { out.push((n & 127) | 128); n >>>= 7; } out.push(n); }

/** unify interior colours (deterministic: the most frequent interior colour, ties -> smaller value) */
function unifyInterior(m) {
  const { sx, sy, sz, v } = m, inner = [], cnt = new Map();
  for (let y = 1; y < sy - 1; y++) for (let z = 1; z < sz - 1; z++) for (let x = 1; x < sx - 1; x++) {
    const i = (y * sz + z) * sx + x; if (!v[i]) continue;
    if (v[i - 1] && v[i + 1] && v[i - sx] && v[i + sx] && v[i - sx * sz] && v[i + sx * sz]) { inner.push(i); cnt.set(v[i], (cnt.get(v[i]) || 0) + 1); }
  }
  let best = 0, bn = -1; for (const [c, n] of cnt) if (n > bn || (n === bn && c < best)) { bn = n; best = c; }
  const out = Uint32Array.from(v); for (const i of inner) out[i] = best;
  return out;
}

/** encode one built rig -> { meta, bytes[] } */
export function encodeRig(rig, bytes) {
  const r4 = (a) => (a || [0, 0, 0]).map((x) => Math.round(x * 1e4) / 1e4);
  const parts = [];
  for (const name of Object.keys(rig.parts)) {
    const p = rig.parts[name], m = p.model, v = unifyInterior(m);
    const pal = [], pidx = new Map();
    for (let i = 0; i < v.length; i++) if (v[i] && !pidx.has(v[i])) { pidx.set(v[i], pal.length + 1); pal.push(v[i] & 0xffffff); }
    const off = bytes.length;
    let i = 0; const n = v.length;
    while (i < n) { const c = v[i]; let j = i + 1; while (j < n && v[j] === c) j++; varint(bytes, j - i); varint(bytes, c ? pidx.get(c) : 0); i = j; }
    parts.push([name, m.sx, m.sy, m.sz, r4(p.pivot), r4(p.at), p.parent || null, pal, off, bytes.length - off]);
  }
  return { anim: rig.anim, height: rig.height, radius: rig.radius, size: rig.size, parts };
}
export function packBundle(entries, bytes) {
  const json = new TextEncoder().encode(JSON.stringify({ v: 1, entries }));
  const pad = (4 - ((8 + json.length) % 4)) % 4, out = new Uint8Array(8 + json.length + pad + bytes.length);
  out.set([0x56, 0x58, 0x42, 0x31]); new DataView(out.buffer).setUint32(4, json.length, true);
  out.set(json, 8); out.set(bytes, 8 + json.length + pad);
  return out;
}

// ------------------------------------------------------------------------------------------------ decode (runtime)
export function openBundle(buf) {
  const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  if (u8[0] !== 0x56 || u8[1] !== 0x58 || u8[2] !== 0x42 || u8[3] !== 0x31) throw new Error('voxel bundle: bad magic');
  const jl = new DataView(u8.buffer, u8.byteOffset, 8).getUint32(4, true);
  const idx = JSON.parse(new TextDecoder().decode(u8.subarray(8, 8 + jl)));
  const pad = (4 - ((8 + jl) % 4)) % 4;
  return { entries: idx.entries, data: u8.subarray(8 + jl + pad) };
}
/** decode an entry into a fresh rig (new VoxelModels each call: callers may keep or mutate them) */
export function decodeRig(B, e) {
  const d = B.data, parts = {};
  for (const [name, sx, sy, sz, pivot, at, parent, pal, off, len] of e.parts) {
    const m = new VoxelModel(sx, sy, sz), v = m.v, cols = pal.map((c) => FILLED | c);
    let p = off, i = 0;
    const end = off + len;
    while (p < end) {
      let run = 0, sh = 0, b; do { b = d[p++]; run |= (b & 127) << sh; sh += 7; } while (b & 128);
      let k = 0; sh = 0; do { b = d[p++]; k |= (b & 127) << sh; sh += 7; } while (b & 128);
      if (k) v.fill(cols[k - 1], i, i + run);
      i += run;
    }
    parts[name] = { model: m, pivot: pivot.slice(), at: at.slice(), ...(parent ? { parent } : {}) };
  }
  return { anim: e.anim, parts, height: e.height, radius: e.radius, size: e.size };
}
