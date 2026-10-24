// mt/ui/title.worker.js — off-main-thread renders for the title / lobby hero stage. Owner: front-end screens.
//
// The art library (game/art/sprites) re-rasterises a sprite natively at any scale (renderShowcase): ~50–400 ms per
// frame at 2–3×, far too slow for the main thread while the backdrop match boots. This module worker renders the
// requested idle frames one by one and posts each as soon as it is done (raw RGBA, transferred), after a
// "stage light" pass: a warm 1-px top rim + a fainter side rim (the spotlight from above), so the sprites read as lit
// by the stage instead of pasted on it.
//
// in : { id, scale, anim='idle', view?, frames:[i...], rim:[r,g,b] | false, clean?: true|{merge,passes}, key }
// out: { key, id, scale, i, w, h, ax, ay, buf }   |   { key, error }

import { renderShowcase, renderSpriteTrimmed, SPECIES_ART } from '../../art/sprites/index.js';
import { applyClean } from './pixelclean.js';

const q = [];
let busy = false;

function rimLight(d, w, h, rim) {
  const [rr, rg, rb] = rim || [255, 240, 200];
  const a = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : d[(y * w + x) * 4 + 3]);
  const out = new Uint8ClampedArray(d);
  // body extent (rows) for the side-rim falloff
  let top = h, bot = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3]) { if (y < top) top = y; if (y > bot) bot = y; }
  const span = Math.max(1, bot - top);
  for (let y = 0; y < h; y++) {
    const fy = (y - top) / span; // 0 head .. 1 feet
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (!d[i + 3]) continue;
      let k = 0;
      if (!a(x, y - 1)) k = 0.62;                       // top edge: full spotlight rim
      else if (!a(x, y - 2)) k = 0.22;                  // second row: soft falloff
      if (!a(x - 1, y) || !a(x + 1, y)) k = Math.max(k, 0.3 * (1 - fy)); // side rim, fading toward the feet
      // a whisper of floor bounce on the lowest rows (keeps the feet from going muddy on the dark dais)
      const ao = fy > 0.86 ? (fy - 0.86) * 0.9 : 0;
      if (k > 0) {
        out[i] = d[i] + (rr - d[i]) * k; out[i + 1] = d[i + 1] + (rg - d[i + 1]) * k; out[i + 2] = d[i + 2] + (rb - d[i + 2]) * k;
      } else if (ao > 0) {
        out[i] = d[i] * (1 - ao * 0.5); out[i + 1] = d[i + 1] * (1 - ao * 0.45); out[i + 2] = d[i + 2] * (1 - ao * 0.3);
      }
    }
  }
  return out;
}

function next() {
  if (busy) return;
  const job = q.shift(); if (!job) return;
  busy = true;
  // yield between frames so new (higher-priority) requests can be queued
  setTimeout(() => {
    try {
      const S = SPECIES_ART[job.id];
      if (!S) throw new Error('unknown sprite ' + job.id);
      let r;
      if (job.view) { // a specific view (lobby line-up: trainers turned toward the rival team)
        // view may carry a pose: 'left', 'down|throw@1' (view | anim @ first frame)
        const [vw, rest] = String(job.view).split('|'), [an, fo] = (rest || '').split('@');
        const b = renderSpriteTrimmed(job.id, vw, an || job.anim || 'idle', job.i + (+fo || 0), { scale: job.scale, outline2: true, cache: false });
        const m = 3, w = b.w + m * 2, h = b.h + m * 2, d = new Uint8ClampedArray(w * h * 4);
        for (let y = 0; y < b.h; y++) d.set(b.data.subarray(y * b.w * 4, (y + 1) * b.w * 4), ((y + m) * w + m) * 4);
        r = { w, h, data: d, anchorX: b.ax + m, anchorY: b.ay + m };
      } else r = renderShowcase(job.id, { scale: job.scale, anim: job.anim || 'idle', frame: job.i, margin: 3, canvas: false });
      let data = applyClean(r.data, r.w, r.h, job.clean);
      if (job.rim !== false) data = rimLight(data, r.w, r.h, job.rim);
      self.postMessage({ key: job.key, id: job.id, scale: job.scale, i: job.i, w: r.w, h: r.h, ax: r.anchorX, ay: r.anchorY, buf: data.buffer }, [data.buffer]);
    } catch (e) {
      self.postMessage({ key: job.key, i: job.i, error: String(e && e.message || e) });
    }
    busy = false; next();
  }, 0);
}

self.onmessage = (ev) => {
  const m = ev.data || {};
  if (m.cancel) { for (let i = q.length - 1; i >= 0; i--) if (q[i].key === m.cancel) q.splice(i, 1); return; }
  const frames = m.frames || [0];
  // frame 0 of every request first (the stage appears complete quickly), the rest after
  const jobs = frames.map((i) => ({ key: m.key, id: m.id, scale: m.scale, anim: m.anim, view: m.view, rim: m.rim, clean: m.clean, i }));
  const first = jobs.shift();
  let at = 0; while (at < q.length && q[at].i === 0) at++;
  q.splice(at, 0, first);
  q.push(...jobs);
  next();
};
