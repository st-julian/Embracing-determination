// mt/render/fx-art.js — bridge from the procedural art library (game/art/sprites, art agent) to the FX sprite atlas:
// capture-orb animation frames and white silhouettes / flash frames of monster forms (capture absorb, evolution,
// summon materialise). Loaded lazily; until it resolves the kits fall back to pixel glyphs. Owner: VFX specialist.

import { FORMS } from '../data/species.js';

let lib = null, loading = null;
const warmQ = [];

export function loadArt() {
  if (!loading) loading = import('../../art/sprites/index.js').then((m) => { lib = m; return m; })
    .catch((e) => { console.warn('[mt-fx] art library unavailable, using pixel fallbacks', e && e.message); lib = false; return null; });
  return loading;
}
export const artReady = () => !!lib;

function trim(b) {
  const { w, h, data } = b; let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (data[(y * w + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return null;
  const tw = x1 - x0 + 1, th = y1 - y0 + 1, out = new Uint8Array(tw * th * 4);
  for (let y = 0; y < th; y++) out.set(data.subarray(((y + y0) * w + x0) * 4, ((y + y0) * w + x0 + tw) * 4), y * tw * 4);
  return { w: tw, h: th, data: out, ax: (b.ax ?? w / 2) - x0, ay: (b.ay ?? h) - y0 };
}

function render(atlas, key, id, view, anim, i, mode) {
  const have = atlas.get(key); if (have) return have;
  if (!lib || !lib.SPECIES_ART || !lib.SPECIES_ART[id]) return null;
  try {
    const S = lib.SPECIES_ART[id];
    const v = S.views && S.views.includes(view) ? view : S.views[0];
    const b = trim(lib.renderSprite(id, v, anim, i, mode ? { mode } : {}));
    const f = b && atlas.add(key, b);
    if (f) f.pxH = S.pixelHeight || b.h;
    return f;
  } catch (e) { atlas.map.set(key, null); return null; }
}

/** Orb frame: anim 'idle'|'open'|'wobble'|'sparkle'|'burst'. */
export function orbFrame(atlas, anim, i) {
  if (!lib || !lib.SPECIES_ART || !lib.SPECIES_ART.orb) return null;
  const A = lib.SPECIES_ART.orb.anims[anim]; if (!A) return null;
  const n = ((i % A.n) + A.n) % A.n;
  return render(atlas, `orb/${anim}/${n}`, 'orb', 'front', anim, n, null);
}
export function orbAnimLen(anim) { const A = lib && lib.SPECIES_ART && lib.SPECIES_ART.orb && lib.SPECIES_ART.orb.anims[anim]; return A ? A.n : 1; }

/** White silhouette (mode 'silhouette') or colour idle frame (mode null) of a monster form, front view. */
export function formFrame(atlas, form, mode = 'silhouette') {
  return render(atlas, `form/${form}/${mode || 'color'}`, form, 'front', 'idle', 0, mode);
}

/** World height of the drawn bitmap for a form shown at the unit's height (bitmap includes padding). */
export function formDrawHeight(f, form, unitHeight) {
  const H = unitHeight || (FORMS[form] && FORMS[form].height) || 1.2;
  return f && f.pxH ? H * (f.h / f.pxH) : H;
}

/** Spread the cost: warm a few frames per call (call every frame). */
export function warm(atlas, budget = 1) {
  if (!lib) return;
  if (!warmQ.length && !warm.done) {
    warm.done = true;
    for (const a of ['idle', 'open', 'wobble', 'sparkle', 'burst']) for (let i = 0; i < orbAnimLen(a); i++) warmQ.push(() => orbFrame(atlas, a, i));
    for (const id of Object.keys(FORMS)) warmQ.push(() => formFrame(atlas, id, 'silhouette'));
  }
  for (let k = 0; k < budget && warmQ.length; k++) warmQ.shift()();
}
