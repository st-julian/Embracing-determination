// mt/voxel/units/portraits.js — voxel portraits for the HUD in voxel mode (owner: voxel units runtime). The designer bakes
// PNGs into game/assets/voxel-portraits/ with an index JSON; this loads the index once (only with the voxel style on),
// preloads the images, and hands the HUD a canvas of the requested size. Until the files exist (or for an id without a
// portrait) it returns null and the HUD keeps its sprite portrait.
//   index.json: { "<id>": "file.png" } or { "<id>": { "file": "file.png", "bust": "file_bust.png" } } or [{ id, file, bust? }]
//   ids: species form ids, trainer_attack|trainer_healing|trainer_magic (team suffixes are stripped), minion_*, boss_*
// OFF until the bake lands: a missing index.json would log a 404 console error on every voxel boot (the test tools count
// those) — set true in the commit that adds game/assets/voxel-portraits/index.json
const ENABLED = false;
const BASE = new URL('../../../assets/voxel-portraits/', import.meta.url);
let index = null, loading = false;
const imgs = new Map(), cache = new Map();

function voxelOn() {
  try {
    const a = globalThis.__moba;
    if (a && a.mtWorldStyle) return a.mtWorldStyle === 'voxel';
    return new URLSearchParams(location.search).get('world') !== '3d';
  } catch (e) { return false; }
}
function load() {
  if (loading || !ENABLED) return; loading = true;
  fetch(new URL('index.json', BASE)).then((r) => (r.ok ? r.json() : null)).then((j) => {
    if (!j) return;
    const map = new Map();
    for (const [id, v] of Array.isArray(j) ? j.map((e) => [e.id, e]) : Object.entries(j)) {
      const e = typeof v === 'string' ? { file: v } : v || {};
      if (!e.file) continue;
      map.set(id, e);
      for (const kind of ['file', 'bust']) if (e[kind]) { const im = new Image(); im.decoding = 'async'; im.src = new URL(e[kind], BASE).href; imgs.set(id + '|' + kind, im); }
    }
    index = map;
  }).catch(() => { /* not baked yet */ });
}
if (typeof window !== 'undefined' && voxelOn()) load();

/** canvas size x size (pixel-crisp scale) of the voxel portrait of art id `id` ('bust' = head-and-shoulders when baked), or null */
export function voxelPortrait(id, size, kind = 'file') {
  if (!ENABLED || !voxelOn()) return null;
  if (!index) { load(); return null; }
  const base = String(id).replace(/_(blue|red)$/, '');
  const key = index.has(id) ? id : index.has(base) ? base : null; if (!key) return null;
  const im = imgs.get(key + '|' + kind) || imgs.get(key + '|file');
  if (!im || !im.complete || !im.naturalWidth) return null;
  const ck = key + '|' + kind + '|' + size;
  let c = cache.get(ck);
  if (!c) {
    c = document.createElement('canvas'); c.width = c.height = size;
    const g = c.getContext('2d'); g.imageSmoothingEnabled = im.naturalWidth < size;   // downscale smooth, upscale crisp
    const s = Math.min(size / im.naturalWidth, size / im.naturalHeight), w = Math.round(im.naturalWidth * s), h = Math.round(im.naturalHeight * s);
    g.drawImage(im, Math.round((size - w) / 2), size - h, w, h);
    cache.set(ck, c);
  }
  return c;
}
