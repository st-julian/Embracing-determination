// mt/render/ambient-clouds.js — drifting cloud SHADOWS for the ambient-life layer. Owner: world animation artist.
//
// One tileable cloud-density field (128² R8 texture, 1.4 m per texel, wraps every ~180 m) slides with the wind.
// It is read in three places, all from the same uniforms, so everything agrees:
//   * a terrain-hugging decal grid around the camera footprint (1 draw call, multiply blend) darkens the ground and
//     water under each cloud with a cool tint, quantised into two flat cel bands (rim + core) with crisp per-pixel
//     edges, so the shadow reads as a deliberate pixel-art shape (no airbrush gradient, no dither noise); in the HD
//     look (?pixel=0, no app.mtPixel) the same field is drawn as a soft continuous shadow instead;
//   * the ambient glyph batches (critters and motes under a cloud are shaded, sunbeam motes vanish);
//   * `cloudAt(x, z)` on the CPU (published as app.mtAmbient.cloudAt) for other render parts (e.g. sprites).
// The decal grid is a fixed-size vertex grid re-centred (in whole cells) on the camera footprint; its heights are
// the UPPER envelope of the terrain + a small lift, so it never dips under the ground. Terrain heights are baked
// once into a 0.5 m grid, time-sliced (<= 2.5 ms per frame, ~114k samples, done during the lobby or first seconds),
// so a re-centre costs < 1 ms.

const N = 128;            // field resolution
const SIZE = 180;         // metres covered by one tile of the field
const GX = 80, GZ = 60;   // decal grid cells
const H0 = -24, HS = 0.5, HN = 337;   // baked height grid: x, z in [-24, 144] at 0.5 m

/** Tileable value-noise fBm in [0,1], periodic over n texels. */
function cloudField(n, seed) {
  let s = seed >>> 0;
  const rnd = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; };
  const out = new Float32Array(n * n);
  const octave = (cells, amp) => {
    const g = new Float32Array(cells * cells); for (let i = 0; i < g.length; i++) g[i] = rnd();
    const at = (x, y) => g[(((y % cells) + cells) % cells) * cells + (((x % cells) + cells) % cells)];
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const fx = (x / n) * cells, fy = (y / n) * cells, ix = Math.floor(fx), iy = Math.floor(fy);
      let tx = fx - ix, ty = fy - iy; tx = tx * tx * (3 - 2 * tx); ty = ty * ty * (3 - 2 * ty);
      const a = at(ix, iy), b = at(ix + 1, iy), c = at(ix, iy + 1), d = at(ix + 1, iy + 1);
      out[y * n + x] += amp * ((a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty);
    }
  };
  // cumulus-sized blobs (~15-30 m) with puffy edges; a very low octave varies the cover across the map
  octave(4, 0.16); octave(13, 0.5); octave(26, 0.24); octave(52, 0.1);
  // stretch the histogram so the cover fraction is predictable
  let lo = 1e9, hi = -1e9; for (const v of out) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
  for (let i = 0; i < out.length; i++) out[i] = (out[i] - lo) / (hi - lo);
  return out;
}

const VS = `
uniform vec4 uCloudXf;
varying vec2 vCuv; varying vec2 vW;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xz;
  vCuv = (wp.xz + uCloudXf.xy) * uCloudXf.z;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const FS = `
uniform sampler2D uCloudTex; uniform vec4 uCloudXf; uniform vec2 uCloudBand; uniform vec3 uCloudTint; uniform float uBands;
varying vec2 vCuv; varying vec2 vW;
float bayer4(vec2 p) {
  vec2 a = mod(floor(p), 4.0);
  float i = a.x + a.y * 4.0;
  if (i < 0.5) return 0.03; if (i < 1.5) return 0.53; if (i < 2.5) return 0.16; if (i < 3.5) return 0.66;
  if (i < 4.5) return 0.78; if (i < 5.5) return 0.28; if (i < 6.5) return 0.91; if (i < 7.5) return 0.41;
  if (i < 8.5) return 0.22; if (i < 9.5) return 0.72; if (i < 10.5) return 0.09; if (i < 11.5) return 0.59;
  if (i < 12.5) return 0.97; if (i < 13.5) return 0.47; if (i < 14.5) return 0.84; return 0.34;
}
void main() {
  float d = texture2D(uCloudTex, vCuv).r;
  float a = smoothstep(uCloudBand.x, uCloudBand.y, d);
  // two FLAT cel bands (penumbra rim + core), no dither noise: crisp pixel-art shadow shapes like the world's own
  // cel-banded sun (blind test R2: dither noise reads as a filter). uBands < 0.5 switches to the old ordered dither.
  // (HD mode, ?pixel=0: uBands = 0 -> a soft continuous shadow instead)
  float lv = uBands > 0.5 ? (a < 0.22 ? 0.0 : a < 0.62 ? 0.55 : 1.0) : a;
  if (lv < 0.01) discard;
  gl_FragColor = vec4(mix(vec3(1.0), uCloudTint, uCloudXf.w * lv), 1.0);
}`;

export class AmbientClouds {
  constructor(ctx, seed = 0x5eed1234) {
    const T = this.T = ctx.THREE; this.ctx = ctx;
    this.field = cloudField(N, seed);
    const bytes = new Uint8Array(N * N);
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.round(this.field[i] * 255);
    const tex = this.tex = new T.DataTexture(bytes, N, N, T.RedFormat, T.UnsignedByteType);
    tex.wrapS = tex.wrapT = T.RepeatWrapping; tex.magFilter = tex.minFilter = T.LinearFilter; tex.generateMipmaps = false;
    tex.needsUpdate = true;
    // offset (x, z), 1/size, strength ; band (lo, hi) on the density
    this.uniforms = {
      uCloudTex: { value: tex },
      uCloudXf: { value: new T.Vector4(0, 0, 1 / SIZE, 1) },
      uCloudBand: { value: new T.Vector2(0.58, 0.72) },
    };
    this.ox = 0; this.oz = 0; this.strength = 1; this.enabled = true; this.banded = true;
    const mat = this.mat = new T.ShaderMaterial({
      vertexShader: VS, fragmentShader: FS,
      uniforms: { ...this.uniforms, uCloudTint: { value: new T.Vector3(0.6, 0.65, 0.82) }, uBands: { value: 1 } },
      transparent: true, depthWrite: false, depthTest: true,
      blending: T.CustomBlending, blendEquation: T.AddEquation, blendSrc: T.DstColorFactor, blendDst: T.ZeroFactor,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    });
    // grid geometry (positions rewritten on re-centre)
    const nv = (GX + 1) * (GZ + 1);
    this.pos = new Float32Array(nv * 3);
    const idx = new Uint32Array(GX * GZ * 6); let k = 0;
    for (let z = 0; z < GZ; z++) for (let x = 0; x < GX; x++) {
      const a = z * (GX + 1) + x, b = a + 1, c = a + GX + 1, d = c + 1;
      idx[k++] = a; idx[k++] = c; idx[k++] = b; idx[k++] = b; idx[k++] = c; idx[k++] = d;
    }
    const geo = this.geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(this.pos, 3).setUsage(T.DynamicDrawUsage));
    geo.setIndex(new T.BufferAttribute(idx, 1));
    geo.boundingSphere = new T.Sphere(new T.Vector3(60, 0, 60), 1e5);
    this.mesh = new T.Mesh(geo, mat); this.mesh.name = 'mt-ambient-clouds'; this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 2.5;   // after the river surface (2), before units' fx
    this.mesh.visible = false;
    ctx.scene.add(this.mesh);
    this.cell = 0; this.cx = 1e9; this.cz = 1e9; this.rebuilds = 0;
  }

  /** CPU sample of the shadow amount: 0 clear sky, 0.55 cloud rim band, 1 cloud core — same field and bands as the decal. */
  cloudAt(x, z) {
    if (!this.enabled) return 0;
    const u = ((x + this.ox) / SIZE) * N - 0.5, v = ((z + this.oz) / SIZE) * N - 0.5;
    const iu = Math.floor(u), iv = Math.floor(v), fu = u - iu, fv = v - iv, F = this.field;
    const at = (a, b) => F[(((b % N) + N) % N) * N + (((a % N) + N) % N)];
    const d = (at(iu, iv) * (1 - fu) + at(iu + 1, iv) * fu) * (1 - fv) + (at(iu, iv + 1) * (1 - fu) + at(iu + 1, iv + 1) * fu) * fv;
    const B = this.uniforms.uCloudBand.value, t = Math.min(1, Math.max(0, (d - B.x) / (B.y - B.x))), a = t * t * (3 - 2 * t);
    if (!this.banded) return a;
    return a < 0.22 ? 0 : a < 0.62 ? 0.55 : 1;      // the same two flat bands as the decal
  }

  /** pixel-art look: flat bands; HD look (no app.mtPixel): soft shadow */
  setBanded(on) { if (on !== this.banded) { this.banded = on; this.mat.uniforms.uBands.value = on ? 1 : 0; } }

  /** Time-sliced bake of a 0.5 m terrain height grid over the whole map (+margin) for the decal envelope. */
  bake(heightAt, budgetMs) {
    const R = this.hb || (this.hb = { n: HN, row: 0, data: new Float32Array(HN * HN), done: false });
    if (R.done) return true;
    const t0 = performance.now();
    while (R.row < R.n && performance.now() - t0 < budgetMs) {
      const z = H0 + R.row * HS, o = R.row * R.n;
      for (let i = 0; i < R.n; i++) R.data[o + i] = heightAt(H0 + i * HS, z);
      R.row++;
    }
    if (R.row >= R.n) R.done = true;
    return R.done;
  }
  /** upper envelope of the baked heights around (x, z): max of the 3x3 grid samples nearest the point (covers +-0.5 m) */
  envAt(x, z) {
    const R = this.hb, n = R.n;
    const i = Math.min(n - 2, Math.max(1, Math.round((x - H0) / HS))), j = Math.min(n - 2, Math.max(1, Math.round((z - H0) / HS)));
    const D = R.data; let m = -1e9;
    for (let b = -1; b <= 1; b++) { const o = (j + b) * n + i; for (let a = -1; a <= 1; a++) if (D[o + a] > m) m = D[o + a]; }
    return m;
  }

  /**
   * @param dt seconds  @param wind {x, z, speed}  @param fp camera ground footprint {minX,maxX,minZ,maxZ,cx,cz}
   * @param heightAt terrain height function (baked once, time-sliced, into a 0.5 m grid)  @param showDecal bool
   */
  update(dt, wind, fp, heightAt, showDecal) {
    this.ox -= wind.x * wind.speed * dt; this.oz -= wind.z * wind.speed * dt;
    // keep offsets small (field repeats every SIZE m)
    if (Math.abs(this.ox) > SIZE * 64) this.ox %= SIZE; if (Math.abs(this.oz) > SIZE * 64) this.oz %= SIZE;
    const U = this.uniforms.uCloudXf.value;
    U.set(this.ox, this.oz, 1 / SIZE, this.enabled ? this.strength : 0);
    // the decal needs the baked height grid (<= 2.5 ms per frame until done, typically during the lobby / first seconds)
    const ready = !!(showDecal && this.enabled && fp && heightAt) && this.bake(heightAt, this.hb && this.hb.row ? 2.5 : 1.5);
    this.mesh.visible = ready;
    if (!ready) return;
    // cell size so the grid covers the footprint with a margin; re-centre in whole cells
    const w = fp.maxX - fp.minX + 10, h = fp.maxZ - fp.minZ + 10;
    const want = [0.75, 1, 1.5, 2, 3, 4].find((s) => s * GX >= w && s * GZ >= h) || 4;
    const step = want * 8;          // grid margin is ~15 m around the view: re-centre every 8 cells
    const cx = Math.round(fp.cx / step) * step, cz = Math.round(fp.cz / step) * step;
    if (want !== this.cell || cx !== this.cx || cz !== this.cz) this.rebuild(want, cx, cz);
  }

  rebuild(s, cx, cz) {
    const t0 = performance.now();
    this.cell = s; this.cx = cx; this.cz = cz; this.rebuilds++;
    const x0 = cx - (GX * s) / 2, z0 = cz - (GZ * s) / 2, P = this.pos, r = s * 0.5;
    let i = 0;
    for (let z = 0; z <= GZ; z++) for (let x = 0; x <= GX; x++) {
      const wx = x0 + x * s, wz = z0 + z * s;
      let y = this.envAt(wx, wz);
      if (s > 0.9) y = Math.max(y, this.envAt(wx - r, wz), this.envAt(wx + r, wz), this.envAt(wx, wz - r), this.envAt(wx, wz + r));
      P[i++] = wx; P[i++] = y + 0.08 + s * 0.04; P[i++] = wz;
    }
    const at = this.geo.attributes.position; at.needsUpdate = true;
    this.rebuildMs = performance.now() - t0;
  }

  dispose() { this.mesh.removeFromParent(); this.geo.dispose(); this.mat.dispose(); this.tex.dispose(); }
}
