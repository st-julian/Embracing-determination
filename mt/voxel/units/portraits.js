// mt/voxel/units/portraits.js — voxel portraits for the HUD in voxel mode (owner: voxel units runtime). The designer bakes
// head-and-shoulders PNGs (transparent, 128 + 256 px) into game/assets/voxel-portraits/ with index.json:
//   { portraits: { "<key>": { "128": "<file>", "256": "<file>", id, team, variant } } }
//   keys: form id | minion_<art>_<team> | boss_galeclaw | trainer_<spec>_<team>_v<look>
// This loads the index once (voxel style on), preloads the 256 px images, and gives the HUD art helpers (mt/ui/art.js
// portrait / portraitAnim / bust) a canvas tagged with the image; mt/ui/dom.js blit() then draws it at the destination's
// real device resolution (voxelBlit) instead of the pixel-art upscale, so it is crisp at any HUD zoom. Ids without a
// portrait (and every id in ?world=3d) return null: the HUD keeps its sprite portrait.
const ENABLED = true;
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
    const P = j && (j.portraits || j); if (!P || typeof P !== 'object') return;
    const map = new Map();
    for (const [key, e] of Object.entries(P)) {
      const file = e && (e['256'] || e['128'] || e.file || (typeof e === 'string' ? e : null)); if (!file) continue;
      const im = new Image(); im.decoding = 'async'; im.src = new URL(file, BASE).href;
      imgs.set(key, im); map.set(key, e);
    }
    index = map;
  }).catch(() => { /* not baked */ });
}
if (typeof window !== 'undefined' && voxelOn()) load();

/** index key for a HUD art id: trainer_<spec>_<team>[_v<look>], minion art ids (grubling_blue), galeclaw, form ids */
function keyOf(id) {
  const s = String(id);
  if (index.has(s)) return s;
  if (/^trainer_/.test(s)) { const k = s + '_v0'; return index.has(k) ? k : null; }
  if (index.has('minion_' + s)) return 'minion_' + s;
  if (index.has('boss_' + s)) return 'boss_' + s;
  const base = s.replace(/_(blue|red)$/, '');
  return index.has(base) ? base : null;
}

/** canvas size x size of the voxel portrait of HUD art id `id` (tagged mtVoxelImg for voxelBlit), or null */
export function voxelPortrait(id, size) {
  if (!ENABLED || !voxelOn()) return null;
  if (!index) { load(); return null; }
  const key = keyOf(id); if (!key) return null;
  const im = imgs.get(key);
  if (!im || !im.complete || !im.naturalWidth) return null;
  const ck = key + '|' + size;
  let c = cache.get(ck);
  if (!c) {
    c = document.createElement('canvas'); c.width = c.height = size;
    drawFit(c.getContext('2d'), im, size, size);
    c.mtVoxelImg = im;
    cache.set(ck, c);
  }
  return c;
}

function drawFit(g, im, W, H) {
  g.clearRect(0, 0, W, H); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  // head-and-shoulders: fill the box, bottom-aligned (the shoulders sit on the frame's lower edge)
  const s = Math.max(W / im.naturalWidth, H / im.naturalHeight), w = im.naturalWidth * s, h = im.naturalHeight * s;
  g.drawImage(im, (W - w) / 2, H - h, w, h);
}

/** mt/ui/dom.js blit() for a voxel portrait: the destination canvas gets its on-screen device-pixel size (its CSS box is
 *  fixed by hud.css, so this changes resolution, not layout) and the image is drawn smoothly at that size */
export function voxelBlit(dst, im) {
  const d = dst.dataset; if (!d.mtBw) { d.mtBw = dst.width; d.mtBh = dst.height; }
  const bw = +d.mtBw, bh = +d.mtBh, r = dst.getBoundingClientRect(), dpr = (typeof devicePixelRatio === 'number' && devicePixelRatio) || 1;
  const k = r.width > 0 ? Math.max(1, Math.min(8, Math.round(r.width * dpr / bw))) : Math.max(2, Math.round(dpr * 2));
  const W = bw * k, H = bh * k;
  if (dst.width !== W || dst.height !== H) { dst.width = W; dst.height = H; }
  drawFit(dst.getContext('2d'), im, W, H);
}
/** a sprite portrait blitted into a canvas a voxel portrait had enlarged: back to its pixel-art size */
export function voxelRestore(dst) {
  const d = dst.dataset; if (!d.mtBw) return;
  if (dst.width !== +d.mtBw || dst.height !== +d.mtBh) { dst.width = +d.mtBw; dst.height = +d.mtBh; }
}
