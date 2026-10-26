// mt/render/encode.worker.js — off-main-thread image encoding for legacy HUD art (mt/render/loadtime.js artEncode).
// Owner: load-time & hitch engineer. Message in: {id, bmp: ImageBitmap, type, q}; out: {id, blob} | {id, error, unsupported}.
// Same encoder as canvas.toBlob (OffscreenCanvas.convertToBlob, same type / quality), only on this thread.
self.onmessage = async (e) => {
  const { id, bmp, type, q } = e.data || {};
  try {
    if (typeof OffscreenCanvas === 'undefined') throw Object.assign(new Error('no OffscreenCanvas'), { unsupported: true });
    // CPU-backed (willReadFrequently): the encode needs pixels only — no GPU-process raster / readback work that would
    // compete with the page's compositor frames
    const c = new OffscreenCanvas(bmp.width, bmp.height), g = c.getContext('2d', { willReadFrequently: true });
    if (!g || typeof c.convertToBlob !== 'function') throw Object.assign(new Error('no 2d / convertToBlob'), { unsupported: true });
    g.drawImage(bmp, 0, 0);
    if (bmp.close) bmp.close();
    const blob = await c.convertToBlob({ type: type || 'image/png', quality: q });
    self.postMessage({ id, blob });
  } catch (err) {
    self.postMessage({ id, error: String(err && err.message || err), unsupported: !!(err && err.unsupported) });
  }
};
