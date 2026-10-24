// Pixel-precise facial decals: eyes, mouths, cheek marks. These are stamped after tone mapping
// so faces stay crisp and readable at small sizes regardless of the 3D rig pose.

function inEll(x, y, rx, ry) { return (x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1.0; }

// Build eye pixel list centred at screen (cx, cy).
// o: {w,h, style:'cute'|'normal'|'fierce'|'noble', state, iris, inward:+1|-1 (screen dir to nose),
//     look:[lx,ly], lid (0..1 how much top lid covers, angled toward nose), lash:'pupil'}
export function eyePixels(cx, cy, o) {
  const W = Math.max(2, Math.round(o.w)), H = Math.max(2, Math.round(o.h));
  const x0 = Math.round(cx - W / 2), y0 = Math.round(cy - H / 2);
  const rx = W / 2, ry = H / 2;
  const iris = o.iris || 'iris', lashM = o.lash || 'pupil', white = o.white || 'eyeW';
  const inward = o.inward || 1;
  const st = o.state || 'open';
  const px = [];
  const put = (x, y, m, t) => px.push([x0 + x, y0 + y, m, t]);
  if (st === 'closed' || st === 'blink' || st === 'happy') {
    // curved lid line
    const yy = Math.round(H * (st === 'happy' ? 0.45 : 0.6));
    for (let x = 0; x < W; x++) {
      const e = Math.abs((x + 0.5 - rx) / rx);
      const dy = st === 'happy' ? Math.round(e * e * 1.6) : Math.round(e * e * -0.6 + 0.4);
      put(x, yy + dy, lashM, 0);
      if (W >= 6 && st !== 'happy' && (x === 0 || x === W - 1)) put(x, yy + dy + 1, lashM, 0);
    }
    return px;
  }
  if (st === 'hurt') {
    // chevron  > <  pointing to nose
    const n = Math.max(2, Math.min(W, H) - 1);
    for (let k = 0; k <= n; k++) {
      const yy = Math.round(H / 2 - n / 2 + k);
      const xx = Math.round(Math.abs(k - n / 2) * 0.9);
      const x = inward > 0 ? Math.round(W / 2 - n / 2) + xx : Math.round(W / 2 + n / 2) - xx;
      put(x, yy, lashM, 0); put(x + (inward > 0 ? 1 : -1), yy, lashM, 0);
    }
    return px;
  }
  if (st === 'faint') {
    const n = Math.max(2, Math.min(W, H) - 1);
    const ox = Math.round(W / 2 - n / 2), oy = Math.round(H / 2 - n / 2);
    for (let k = 0; k <= n; k++) { put(ox + k, oy + k, lashM, 0); put(ox + n - k, oy + k, lashM, 0); }
    return px;
  }
  // open eye
  const lid = o.lid || 0;
  const mask = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const fx = x + 0.5 - rx, fy = y + 0.5 - ry;
    if (!inEll(fx, fy, rx + 0.3, ry + 0.3)) continue;
    // angled top lid: lower toward the nose (fierce brow)
    const tN = (inward * fx / rx + 1) / 2; // 0 = outer corner, 1 = toward nose
    const lidY = -ry + H * lid * (0.1 + 0.9 * tN);
    if (fy < lidY) continue;
    mask.push([x, y]);
  }
  const has = new Set(mask.map(([x, y]) => x + ',' + y));
  const isIn = (x, y) => has.has(x + ',' + y);
  const cute = o.style === 'cute';
  const glow = st === 'glow';
  const lx = o.look ? o.look[0] : 0;
  if (cute) {
    const irx = rx * 0.95, iry = ry * 0.98, icx = rx + lx * 0.25, icy = ry + 0.3;
    for (const [x, y] of mask) {
      const edge = !isIn(x, y - 1) || !isIn(x, y + 1) || !isIn(x - 1, y) || !isIn(x + 1, y);
      const fx = x + 0.5 - icx, fy = y + 0.5 - icy;
      if (!isIn(x, y - 1)) { put(x, y, lashM, 0); continue; }
      if (glow) { put(x, y, o.glowMat || 'glow', y < icy ? 3 : 4); continue; }
      const t = (y + 0.5) / H;
      if (edge && !inEll(fx, fy, irx, iry)) { put(x, y, lashM, 0); continue; }
      put(x, y, iris, o.solid ? 0 : t < 0.45 ? 0 : t < 0.75 ? 1 : 2);
    }
    const sx = Math.floor(icx - irx * 0.45), sy = Math.floor(icy - iry * 0.5);
    const big = Math.min(W, H) >= (o.solid ? 8 : 5);   // solid (trainer) eyes keep a 1-px highlight until they are large
    for (const [x, y] of big ? [[sx, sy], [sx + 1, sy], [sx, sy + 1], [sx + 1, sy + 1]] : [[sx, sy]]) if (isIn(x, y) && isIn(x, y - 1)) put(x, y, 'shine', 4);
    if (Math.min(W, H) >= 6) { const bx = Math.floor(icx + irx * 0.35), by = Math.floor(icy + iry * 0.45); if (isIn(bx, by) && isIn(bx, by + 1)) put(bx, by, 'shine', 2); }
    return px;
  }
  // "normal" eye: thick upper lash line, white sclera, large iris shifted toward the nose,
  // dark pupil, crisp shine
  const irx = Math.max(1, rx * (o.irisW ?? 0.68)), iry = ry * (o.irisH ?? 0.95);
  const icx = rx + inward * rx * 0.28 + lx * 0.5, icy = ry + 0.35;
  const thick = H >= 5 && W >= 4;
  for (const [x, y] of mask) {
    const top = !isIn(x, y - 1);
    const fx = x + 0.5 - rx;
    const outerHalf = inward * fx < rx * 0.35;
    if (top || (thick && !isIn(x, y - 2) && outerHalf)) { put(x, y, lashM, 0); continue; }
    const side = !isIn(x - 1, y) || !isIn(x + 1, y);
    const bottom = !isIn(x, y + 1);
    if ((side || bottom) && (o.ring ?? false)) { put(x, y, lashM, 1); continue; }
    const ix = x + 0.5 - icx, iy = y + 0.5 - icy;
    if (inEll(ix, iy, irx, iry)) {
      if (glow) { put(x, y, o.glowMat || 'glow', iy < 0 ? 3 : 4); continue; }
      const pw = Math.max(0.5, irx * (o.pupil ?? 0.4)), ph = iry * (o.pupilH ?? 0.7);
      if (inEll(ix, iy + 0.2, pw, ph)) { put(x, y, lashM, 1); continue; }
      const t = (y + 0.5) / H;
      put(x, y, iris, t < 0.4 ? 1 : t < 0.7 ? 2 : 3);
    } else {
      put(x, y, white, bottom ? 2 : 3);
    }
  }
  if (!glow) {
    const sx = Math.round(icx - irx * 0.55), sy = Math.round(icy - iry * 0.45);
    let done = false;
    for (const [x, y] of [[sx, sy], [sx + 1, sy], [sx, sy + 1]]) if (!done && isIn(x, y) && isIn(x, y - 1)) { put(x, y, 'shine', 4); done = W < 6; }
  }
  return px;
}

// mouth decals, centred at (cx,cy). style: 'smile'|'line'|'open'|'roar'|'fang'|'beak'
export function mouthPixels(cx, cy, o) {
  const W = Math.max(2, Math.round(o.w || 3));
  const inward = o.inward || 1;
  const m = o.mat || 'mouth';
  const px = [];
  const x0 = Math.round(cx), y0 = Math.round(cy);
  const st = o.style || 'smile';
  if (st === 'smile' || st === 'line' || st === 'fang') {
    for (let k = 0; k < W; k++) {
      const x = x0 + (k - Math.floor(W / 2)) * 1;
      const curve = st === 'smile' ? (k === 0 || k === W - 1 ? -1 : 0) : 0;
      px.push([x, y0 + curve, m, 0]);
    }
    if (st === 'fang') px.push([x0 - inward, y0 + 1, 'shine', 3]);
  } else {
    // open mouth: dark interior, tongue at bottom, outline top
    const H = Math.max(2, Math.round(o.h || W * 0.7));
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const fx = (x + 0.5) / W * 2 - 1, fy = (y + 0.5) / H;
      if (Math.abs(fx) > 1 - fy * 0.35 * (st === 'roar' ? 0 : 1)) continue;
      const X = x0 - Math.floor(W / 2) + x, Y = y0 + y;
      let mm = m, t = 0;
      if (y === 0) { mm = m; t = 0; }
      else if (fy > 0.6 && Math.abs(fx) < 0.6) { mm = 'tongue'; t = 2; }
      else { mm = m; t = 1; }
      px.push([X, Y, mm, t]);
    }
    if (o.fangs) { px.push([x0 - Math.floor(W / 2) + 1, y0, 'shine', 3]); px.push([x0 - Math.floor(W / 2) + W - 2, y0, 'shine', 3]); }
  }
  return px;
}

// helpers that take a scene + local 3D anchor
export function eye(s, p, o) {
  const [sx, sy, z] = s.proj(p);
  const host = o.host !== undefined ? (typeof o.host === 'string' ? s.groups[o.host] : o.host) : s.g;
  const inward = o.inward ?? (s.proj([0, 0, 1])[0] - s.proj([0, 0, 0])[0] < 0 ? -1 : 1);
  let w = o.w;
  if (o.c) {
    // foreshorten eyes that face away from the camera (3/4 view far eye)
    const n = s.dir([p[0] - o.c[0], p[1] - o.c[1], p[2] - o.c[2]]);
    const f = Math.max(0.45, Math.min(1, 0.35 + n[2] * 0.75));
    w = Math.max(2, Math.round(o.w * f + (o.wAdd || 0)));
    if (n[2] < 0.05) return;
  }
  const S = s.S;
  s.decal(eyePixels(sx, sy, { ...o, w: Math.round(w * S), h: Math.round(o.h * S), inward }), { host, z, tol: (o.tol ?? 3) * S });
}
export function mouth(s, p, o) {
  const [sx, sy, z] = s.proj(p);
  const host = o.host !== undefined ? (typeof o.host === 'string' ? s.groups[o.host] : o.host) : s.g;
  const inward = o.inward ?? (s.proj([0, 0, 1])[0] - s.proj([0, 0, 0])[0] < 0 ? -1 : 1);
  const S = s.S;
  s.decal(mouthPixels(sx, sy, { ...o, w: Math.round((o.w || 3) * S), h: o.h ? Math.round(o.h * S) : undefined, inward }), { host: o.anyHost ? undefined : host, z, tol: (o.tol ?? 3) * S });
}
export function dot(s, p, mat, tone, o = {}) {
  const [sx, sy, z] = s.proj(p);
  const pix = [[sx, sy, mat, tone]];
  if (o.size >= 2) pix.push([sx + 1, sy, mat, tone], [sx, sy + 1, mat, tone], [sx + 1, sy + 1, mat, tone]);
  s.decal(pix, { host: o.host !== undefined ? s.groups[o.host] : undefined, z, tol: o.tol ?? 3 });
}

// pair of eyes on an ellipsoid head (local head space). Handles anim eye states.
export function eyes(s, P, HC, HR, o) {
  if (!P.front) return;
  let st = P.eyes;
  let lid = o.lid || 0;
  if (st === 'fierce') { st = 'open'; lid = Math.max(lid, 0.32); }
  if (st === 'glow' && o.noGlow) st = 'open';
  const host = o.host || 'head';
  for (const sd of [-1, 1]) {
    const p = onEllF(HC, HR, sd * o.dx, o.dy);
    eye(s, [p[0], p[1], p[2] + (o.dz || 0)], { ...o, c: HC, state: st, lid, host });
  }
}
function onEllF(c, r, dx, dy) {
  const u = dx / r[0], v = dy / r[1];
  return [c[0] + dx, c[1] + dy, c[2] + r[2] * Math.sqrt(Math.max(0, 1 - u * u - v * v))];
}
