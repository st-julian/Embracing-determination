// mt/render/sprites.worker.js — off-main-thread rasteriser for the in-game sprite atlas prewarm. Owner: perf (used by
// mt/render/sprites.js). Same art code as the main thread (game/art/sprites renderSpriteData, data mode, no pooling),
// so frames are identical; the main thread only copies the RGBA rows into an atlas page (a few hundred µs per frame)
// instead of rasterising them (5–10 ms each on a slow core, which used to land inside game frames).
//
// in : { key, id, view, anim, i, scale }            one frame per message (the main thread keeps <= 4 in flight)
// out: { key, w, h, ax, ay, buf, ms }  (buf = RGBA ArrayBuffer, transferred)   |   { key, error }

import { renderSpriteData } from '../../art/sprites/index.js';

self.onmessage = (e) => {
  const j = e.data;
  if (!j || !j.key) return;
  try {
    const t0 = performance.now();
    const b = renderSpriteData(j.id, j.view, j.anim, j.i, { scale: j.scale, noFx: true });
    const buf = b.data.byteOffset === 0 && b.data.byteLength === b.data.buffer.byteLength ? b.data.buffer : b.data.slice().buffer;
    self.postMessage({ key: j.key, w: b.w, h: b.h, ax: b.ax, ay: b.ay, buf, ms: performance.now() - t0 }, [buf]);
  } catch (err) {
    self.postMessage({ key: j.key, error: String((err && err.message) || err) });
  }
};
