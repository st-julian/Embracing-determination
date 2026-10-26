// mt/voxel/units/index.js — voxel unit runtime (owner: voxel units runtime). Every unit the sprite system would draw as
// a 2D billboard is drawn as an animated voxel model instead when the voxel world style is on (app.mtWorldStyle ===
// 'voxel', i.e. ?world=voxel; 3D is the default). SpriteSystem keeps doing everything around the unit (visibility / fog, team marks and the
// own-unit pulse, wading depth, x-ray occlusion test, hit blink and evolution flash values, fx overrides) and hands the
// result to unit() here instead of pushing a sprite quad; capture orbs in flight and the capture flourishes come here too.
//
// Models: MODELS[id](opts) from mt/voxel/models/ (designer) → { anim, parts, height, radius }; opts = {team, variant,
// shiny} (team 'blue'|'red'|null for wild); parts = { name: { model: VoxelModel, pivot: [x,y,z] (joint in the part's own
// grid), at: [x,y,z] (the same joint in the parent's grid, or in the unit frame: feet centre, +y up, facing +z, the
// character's left = +x; voxels), parent? } }. Until a model exists a placeholder from ./placeholder.js stands in (and is
// replaced as soon as the designer's registry has it).
//
// Draw cost: ONE skinned mesh per unit (all parts merged into one geometry per (id, team, variant, shiny), each part a
// bone) → 1 draw + 1 shadow draw per unit; one shared program (Lambert + vertex colours with flash / tint / dissolve /
// emissive injected), one material per unit for its uniforms. Parts whose name starts with `fx` (flames, glow spots,
// sparks, wing glow: fx, fx_wingL, fx_tail, ...) glow and flicker. Size: every model gets a uniform scale so its height ON SCREEN at the gameplay camera (pitch 52°: vertical
// extent·cos + mean footprint·sin) equals the sprite-era height of that unit (SPRITE_H: the idle frame's height above
// the feet, art px × 1.25 × raster size / 32 px per m) — juveniles small, finals big, trainers like the sprite trainers.
//
// Rig types and what the animator does with them (all procedural, driven by the same per-unit state the sprites read):
//   biped      legs swing / arms counter-swing with speed, body bounce, breathing; attack wind-up + lunge + arm swing +
//              squash; cast = arms up; hit = flinch back; faint = tip over, then dissolve (the sprite system's sink)
//   quadruped  diagonal leg pairs, head nod, tail sway; attack = head-first lunge; same hit / faint
//   flyer      hovers 0.5 m with a bob, wings flap (faster when moving), legs dangle
//   serpent    body sway with tail / tail2 following in phase
//   floater    bobs, fx part spins
// Turning: the yaw eases toward the unit's facing (12 /s). Evolution: the flash the sprites use + a scale pop when the
// form changes. Recall: a glow pulse. Wild monster low on HP (the catch window): a slow pulse and a wobble. Capture: the
// monster shrinks into a voxel orb with a red-white flash, the orb wobbles, then bursts (success: gold, fail: shards).
import { meshArrays, VOXEL_M, VoxelModel } from '../kit.js';
import { placeholderModel } from './placeholder.js';
import { VDIAG, watchShaders } from './diag.js';

let MODELS = null, modelsTried = false;
function loadModels() {
  if (modelsTried) return; modelsTried = true;
  // the registry is used only once its baked data is in (models/index.js ready(): no live voxelising mid-match);
  // placeholders stand in until then
  import('../models/index.js').then((m) => Promise.resolve(typeof m.ready === 'function' ? m.ready() : null).then(() => { MODELS = m.MODELS || m.default || null; }), () => { MODELS = null; });
}
if (typeof window !== 'undefined') { try { const q = new URLSearchParams(location.search).get('world'); if (q === 'voxel') loadModels(); } catch (e) { /* no location */ } }   // at boot: models ready for the first match

/** sprite-era visible height above the feet (m) per art id (team suffix stripped) — from mt/render/sprites.js's raster
 *  rule (idle frame anchor height × ART_SCALE 1.25 × raster size multiplier / PPM 32). Regenerate if the sprite art changes. */
export const SPRITE_H = {
  cindle: 1.88, pyrovix: 2.23, infernyx: 3.32, puddlet: 1.38, tidalon: 1.64, abyssaur: 2.48, sproutle: 1.53, fernhorn: 2.17,
  verdantusk: 2.66, sparkit: 1.75, voltail: 1.98, thundrix: 3.29, pebbit: 0.94, bouldash: 1.7, terracore: 2.7, zephlet: 1.41,
  galeon: 2.29, tempestral: 3.85, grubling: 0.62, spitwing: 1.03, shellram: 0.74, trainer_attack: 1.95, trainer_healing: 1.98,
  trainer_magic: 2.39, orb: 0.45, galeclaw: 4.77,
};
const PITCH = 52 * Math.PI / 180;   // the gameplay camera (mt/render/camera.js, legacy rig constants)
const FIT_MAX = 1.0;                // on-screen height = the sprite's (the brief allows up to ×1.1)

const TAU = Math.PI * 2;
const wrap = (a) => { a = (a + Math.PI) % TAU; return a < 0 ? a + TAU - Math.PI : a - Math.PI; };
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const ease = (t) => t * t * (3 - 2 * t);
const baseId = (artId) => String(artId).replace(/_(blue|red)$/, '');

const TIME = { value: 0 };          // shared by every unit material (emissive flicker)
const OUTLINE_PX = { value: 1 };    // outline width in SCENE px (app.mtVoxel.outlinePx device px, 1.5)
let VIEWPORT = { value: null };     // the scene render target size (the sprite system's uViewport)

/** the shared program: Lambert + vertex colours, with per-unit flash (toward warm white), tint, dissolve, emissive fx,
 *  and the outline hull: vertices flagged aHull are a reversed-winding copy of the surface (smoothed normals) pushed out
 *  uOutlinePx scene px in screen space and painted a dark shade of the local colour — the BW-style sprite outline. */
function unitMaterial(THREE, skinned = true) {
  const m = new THREE.MeshLambertMaterial({ vertexColors: true }); m.name = skinned ? 'mt-voxel-unit' : 'mt-voxel-orb';
  const U = m.userData.mt = { uFlash: { value: 0 }, uTint: { value: new THREE.Vector4(0, 0, 0, 0) }, uDis: { value: 0 }, uGlow: { value: 1 }, uTime: TIME, uOutlinePx: OUTLINE_PX, uViewport: VIEWPORT };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aGlow;\nattribute float aHull;\nuniform float uOutlinePx;\nuniform vec2 uViewport;\nvarying vec3 vMtW;\nvarying float vMtGlow;\nvarying float vMtHull;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvMtW = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvMtGlow = aGlow;\nvMtHull = aHull;\n'
        + 'if (aHull > 0.5) { vec4 nc = projectionMatrix * vec4(transformedNormal, 0.0); float l = length(nc.xy);\n'
        + '  if (l > 1e-6) gl_Position.xy += nc.xy / l * uOutlinePx * 2.0 / uViewport * gl_Position.w;\n  gl_Position.z += 0.0004 * gl_Position.w; }');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uFlash; uniform vec4 uTint; uniform float uDis; uniform float uGlow; uniform float uTime; varying vec3 vMtW; varying float vMtGlow; varying float vMtHull;')
      .replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n  if (uDis > 0.0) { vec3 q = floor(vMtW * 10.0 + 0.001); if (fract(sin(dot(q, vec3(12.9898, 78.233, 37.719))) * 43758.5453) < uDis) discard; }')
      .replace('#include <dithering_fragment>', '#include <dithering_fragment>\n'
        + '  if (vMtGlow > 0.0) { vec3 q = floor(vMtW * 10.0 + 0.001); float fl = 0.78 + 0.22 * sin(uTime * 15.0 + dot(q, vec3(1.7, 2.3, 3.1)));\n'
        + '    gl_FragColor.rgb = mix(gl_FragColor.rgb, vColor.rgb * 1.9 * fl, clamp(vMtGlow * uGlow, 0.0, 1.0) * 0.9); }\n'
        + '  gl_FragColor.rgb = mix(gl_FragColor.rgb, uTint.rgb, uTint.a);\n  gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(1.0, 0.97, 0.9), uFlash);\n'
        + '  if (vMtHull > 0.5) gl_FragColor.rgb = vColor.rgb * 0.12 + vec3(0.005, 0.003, 0.01) + uFlash * 0.25;');
  };
  // the key names the skinning state too (the units are SkinnedMesh, the orbs plain Mesh): never one program for both
  const key = 'mt-voxel-unit-v4-' + (skinned ? 'skin' : 'mesh');
  m.customProgramCacheKey = () => key;
  return m;
}

/** 2x coarser copy of a model (any filled child -> filled): the shadow-pass LOD */
function downsample2(m) {
  const o = new VoxelModel(Math.ceil(m.sx / 2), Math.ceil(m.sy / 2), Math.ceil(m.sz / 2));
  for (let y = 0; y < m.sy; y++) for (let z = 0; z < m.sz; z++) for (let x = 0; x < m.sx; x++) { const c = m.v[m.idx(x, y, z)]; if (c) o.v[o.idx(x >> 1, y >> 1, z >> 1)] = c; }
  return o;
}

/** the capture orb: red top, white bottom, dark band, white button facing +z (7×7×7 voxels) */
function orbModel() {
  const m = new VoxelModel(7, 7, 7);
  m.sphere(3.5, 3.5, 3.5, 3.5, (x, y) => (y > 3 ? 0xd8343a : y < 3 ? 0xf4f1ea : 0x22202a));
  m.box(2, 2, 6, 4, 4, 6, 0x22202a).box(3, 3, 6, 3, 3, 6, 0xffffff);
  return m;
}

export class VoxelUnits {
  constructor(ctx) {
    this.ctx = ctx; const T = this.T = ctx.THREE;
    this.root = new T.Group(); this.root.name = 'mt-voxel-units';
    ctx.scene.add(this.root);
    this.geo = new Map();        // model key -> merged skinned geometry + bone template
    this.inst = new Map();       // unit id -> instance
    this.ghosts = [];            // monsters shrinking into a capture orb
    this.display = [];           // lineup() instances
    this.frame = 0; this.active = false;
    this.stats = { units: 0, draws: 0, placeholders: 0, models: 0, built: 0, orbs: 0, particles: 0 };
    this.IDENT = new T.Matrix4();
    if (!VIEWPORT.value) VIEWPORT.value = new T.Vector2(1, 1);
    // capture orbs (in flight, and on a monster being caught): plain meshes from a pool
    this.orbGeo = this.mergedGeometry({ parts: { body: { model: orbModel(), pivot: [3.5, 0, 3.5], at: [0, 0, 0] } } }).geometry;
    this.orbMat = unitMaterial(T, false); this.orbPool = []; this.orbUsed = 0;
    // capture flourish particles: one instanced box mesh
    const N = 256, pg = new T.BoxGeometry(VOXEL_M * 0.9, VOXEL_M * 0.9, VOXEL_M * 0.9);
    this.parts = new T.InstancedMesh(pg, new T.MeshBasicMaterial({ toneMapped: false }), N);
    this.parts.instanceMatrix.setUsage(T.DynamicDrawUsage); this.parts.count = 0; this.parts.frustumCulled = false;
    this.parts.setColorAt(0, new T.Color(1, 1, 1));
    this.root.add(this.parts);
    this.particles = []; this.dummy = new T.Object3D(); this.col = new T.Color();
    loadModels();
    const app = ctx.app || (typeof window !== 'undefined' ? window.__moba : null);
    if (app) { app.mtVoxelUnits = this; app.mtVoxelDiag = VDIAG; app.mtVoxel = Object.assign({ outline: true, outlinePx: 1.5 }, app.mtVoxel || {}); }
  }

  // ---- models ---------------------------------------------------------------------------------------------------
  /** model id for the designer's registry: species form id, trainer_<look>, minion_<art|subtype>, boss_galeclaw */
  modelIds(u, artId, S) {
    if ((u && u.mtTrainer) || /^trainer_/.test(artId)) return ['trainer_' + artId.split('_')[1]];
    if (S && S.kind === 'minion') return ['minion_' + S.baseId].concat(u && u.subtype ? ['minion_' + u.subtype] : []);
    if (S && S.kind === 'boss') return ['boss_' + artId, artId];
    return [artId];
  }
  /**
   * All parts of a model merged into ONE skinned geometry (each part's vertices bound to its own bone, bind pose = rest),
   * meshed at the model's own voxel size (def.size, default VOXEL_M). The index buffer holds three ranges:
   *   main  the lit surface                      — drawn in the main pass
   *   hull  the outline shell (opts.hull)         — drawn after main when the outline is on (same draw: one range)
   *   lod   a 2x coarser surface (opts.lod)       — drawn instead of everything in the shadow pass
   */
  mergedGeometry(def, opts = {}) {
    const T = this.T, V = def.size || VOXEL_M, P = def.parts, names = Object.keys(P).filter((n) => P[n] && P[n].model);
    const bones = [{ name: '$pose', parent: -1, pos: [0, 0, 0] }], idx = { $pose: 0 }, J = {};
    const place = (n) => {
      if (idx[n] != null) return idx[n];
      const p = P[n], pp = p.parent && P[p.parent] && P[p.parent].model ? p.parent : null;
      const pi = pp ? place(pp) : 0, o = pp ? P[pp].pivot || [0, 0, 0] : [0, 0, 0], at = p.at || [0, 0, 0];
      const pos = [(at[0] - o[0]) * V, (at[1] - o[1]) * V, (at[2] - o[2]) * V];
      const base = pp ? J[pp] : [0, 0, 0];
      J[n] = [base[0] + pos[0], base[1] + pos[1], base[2] + pos[2]];
      idx[n] = bones.length; bones.push({ name: n, parent: pi, pos });
      return idx[n];
    };
    for (const n of names) place(n);
    const pos = [], nor = [], col = [], si = [], sw = [], gl = [], hu = [], main = [], hull = [], lod = [];
    let nv = 0;
    const vert = (x, y, z, nx, ny, nz, r, g, b, bone, glow, h) => { pos.push(x, y, z); nor.push(nx, ny, nz); col.push(r, g, b); si.push(bone, 0, 0, 0); sw.push(1, 0, 0, 0); gl.push(glow); hu.push(h); return nv++; };
    for (const n of names) {
      const p = P[n], a = meshArrays(p.model, { pivot: p.pivot, size: V }), j = J[n], b = idx[n], glow = /^fx/.test(n) ? 1 : 0, base = nv;   // every fx* part glows (fx, fx_wingL, fx_tail, ...)
      for (let i = 0, k = 0; i < a.positions.length; i += 3, k++) vert(a.positions[i] + j[0], a.positions[i + 1] + j[1], a.positions[i + 2] + j[2], a.normals[i], a.normals[i + 1], a.normals[i + 2], a.colors[i], a.colors[i + 1], a.colors[i + 2], b, glow, 0);
      for (let i = 0; i < a.indices.length; i++) main.push(a.indices[i] + base);
      if (opts.hull) {
        // one hull vertex per distinct corner position: smoothed normal (sum of the face normals), mean colour
        const H = new Map(), remap = new Int32Array(a.positions.length / 3);
        for (let i = 0, k = 0; i < a.positions.length; i += 3, k++) {
          const key = Math.round(a.positions[i] / V * 2) + ',' + Math.round(a.positions[i + 1] / V * 2) + ',' + Math.round(a.positions[i + 2] / V * 2);
          let h = H.get(key); if (!h) { h = { k: H.size, x: a.positions[i], y: a.positions[i + 1], z: a.positions[i + 2], n: [0, 0, 0], c: [0, 0, 0], m: 0 }; H.set(key, h); }
          h.n[0] += a.normals[i]; h.n[1] += a.normals[i + 1]; h.n[2] += a.normals[i + 2]; h.c[0] += a.colors[i]; h.c[1] += a.colors[i + 1]; h.c[2] += a.colors[i + 2]; h.m++;
          remap[k] = h.k;
        }
        const hb = nv;
        for (const h of H.values()) { const l = Math.hypot(h.n[0], h.n[1], h.n[2]) || 1; vert(h.x + j[0], h.y + j[1], h.z + j[2], h.n[0] / l, h.n[1] / l, h.n[2] / l, h.c[0] / h.m, h.c[1] / h.m, h.c[2] / h.m, b, 0, 1); }
        for (let i = 0; i < a.indices.length; i += 3) hull.push(hb + remap[a.indices[i]], hb + remap[a.indices[i + 2]], hb + remap[a.indices[i + 1]]);
      }
      if (opts.lod) {
        const c = meshArrays(downsample2(p.model), { pivot: p.pivot.map((v) => v / 2), size: V * 2, ao: false, tint: false }), lb = nv;
        for (let i = 0; i < c.positions.length; i += 3) vert(c.positions[i] + j[0], c.positions[i + 1] + j[1], c.positions[i + 2] + j[2], c.normals[i], c.normals[i + 1], c.normals[i + 2], 0, 0, 0, b, 0, 0);
        for (let i = 0; i < c.indices.length; i++) lod.push(c.indices[i] + lb);
      }
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
    g.setAttribute('color', new T.Float32BufferAttribute(col, 3));
    g.setAttribute('skinIndex', new T.Uint16BufferAttribute(si, 4));
    g.setAttribute('skinWeight', new T.Float32BufferAttribute(sw, 4));
    g.setAttribute('aGlow', new T.Float32BufferAttribute(gl, 1));
    g.setAttribute('aHull', new T.Float32BufferAttribute(hu, 1));
    const ind = main.concat(hull, lod);
    g.setIndex(nv > 65535 ? new T.Uint32BufferAttribute(ind, 1) : new T.Uint16BufferAttribute(ind, 1));
    // bounding volumes from the lit surface only (the hull sits on it, the LOD inside its 2x cells)
    const P3 = g.attributes.position.array, mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
    for (const i of main) for (let k = 0; k < 3; k++) { const v = P3[i * 3 + k]; if (v < mn[k]) mn[k] = v; if (v > mx[k]) mx[k] = v; }
    g.boundingBox = new T.Box3(new T.Vector3(mn[0], mn[1], mn[2]), new T.Vector3(mx[0], mx[1], mx[2]));
    g.boundingSphere = g.boundingBox.getBoundingSphere(new T.Sphere());
    g.setDrawRange(0, main.length);
    // bone inverses of the bind pose (translations only): shared by every instance of the model
    const inverses = bones.map((bn) => { const n = bn.name === '$pose' ? null : bn.name, jj = n ? J[n] : [0, 0, 0]; return new T.Matrix4().makeTranslation(-jj[0], -jj[1], -jj[2]); });
    return { geometry: g, bones, inverses, nMain: main.length, nHull: hull.length, nLod: lod.length, tris: main.length / 3 };
  }
  build(key, u, artId, S, opts) {
    let g = this.geo.get(key);
    // a placeholder built before the designer's registry arrived (it loads async) is replaced once the model exists
    if (g && !(g.placeholder && MODELS && this.modelIds(u, artId, S).some((id) => typeof MODELS[id] === 'function'))) return g;
    const old = g; g = null;
    let def = null, placeholder = false;
    if (MODELS) for (const id of this.modelIds(u, artId, S)) { const f = MODELS[id]; if (typeof f === 'function') { try { def = f(opts); } catch (e) { console.error('[mt-voxel] model ' + id, e); } if (def) break; } }
    if (!def || !def.parts) {
      placeholder = true;
      let pal = null; try { pal = this.palette ? this.palette(artId) : null; } catch (e) { pal = null; }
      def = placeholderModel(artId, { kind: S && S.kind, worldHeight: S && S.worldHeight, hover: S && S.hover, palette: pal, team: opts.team || 'wild' });
    }
    const M = this.mergedGeometry(def, { hull: true, lod: true }), bb = M.geometry.boundingBox;
    // uniform fit: the on-screen height at the gameplay camera matches the sprite-era height of this unit
    const h = Math.max(0.1, bb.max.y), w = bb.max.x - bb.min.x, d = bb.max.z - bb.min.z;
    const proj = h * Math.cos(PITCH) + (w + d) / 2 * Math.sin(PITCH), want = SPRITE_H[baseId(artId)] || (S && S.worldHeight) || 1;
    const fit = Math.max(0.25, Math.min(1.6, want / proj * FIT_MAX));
    const sphere = M.geometry.boundingSphere.clone(); sphere.radius *= 1.4;
    g = { key, def, ...M, sphere, placeholder, height: h, radius: Math.max(w, d) / 2, fit };
    this.geo.set(key, g); this.stats.built++;
    if (old) old.geometry.dispose();
    return g;
  }

  makeInstance(g) {
    // a per-instance VIEW of the model's geometry (same GPU buffers, its own draw range: outline per unit), pooled per model
    const geo = (g.views || (g.views = [])).pop() || this.view(g);
    const T = this.T, mat = unitMaterial(T), mesh = new T.SkinnedMesh(geo, mat);
    mesh.castShadow = true; mesh.receiveShadow = true;
    // the shadow pass draws the 2x coarser LOD range of the same geometry (and skips the outline hull)
    const dr = geo.drawRange;
    mesh.onBeforeShadow = () => { mesh.userData.dr = [dr.start, dr.count]; geo.setDrawRange(g.nMain + g.nHull, g.nLod); };
    mesh.onAfterShadow = () => { const d = mesh.userData.dr; if (d) geo.setDrawRange(d[0], d[1]); };
    const bones = g.bones.map((b) => { const B = new T.Bone(); B.name = b.name; B.position.set(b.pos[0], b.pos[1], b.pos[2]); B.userData.base = B.position.clone(); return B; });
    g.bones.forEach((b, i) => { if (b.parent >= 0) bones[b.parent].add(bones[i]); else mesh.add(bones[i]); });
    const skeleton = new T.Skeleton(bones, g.inverses);
    mesh.bind(skeleton, this.IDENT);
    mesh.boundingSphere = g.sphere;
    const groups = {}; for (let i = 1; i < bones.length; i++) groups[bones[i].name] = bones[i];
    const inst = { root: mesh, pose: bones[0], mat, groups, g, geo, skeleton, yaw: null, phase: Math.random() * TAU, walk: 0, seen: 0 };
    this.root.add(mesh);
    return inst;
  }
  dropInstance(id) {
    const I = this.inst.get(id); if (!I) return;
    this.disposeInstance(I); this.inst.delete(id);
  }
  /** a geometry sharing the model's attributes + index (three uploads them once), with its own draw range */
  view(g) {
    const v = new this.T.BufferGeometry(), src = g.geometry;
    for (const k of Object.keys(src.attributes)) v.setAttribute(k, src.attributes[k]);
    v.setIndex(src.index); v.boundingBox = src.boundingBox; v.boundingSphere = src.boundingSphere; v.setDrawRange(0, g.nMain);
    return v;
  }
  disposeInstance(I) {
    I.root.removeFromParent(); I.mat.dispose(); if (I.xmat) I.xmat.dispose();
    if (I.geo && I.g && I.g.views && this.geo.get(I.g.key) === I.g) I.g.views.push(I.geo);   // back to the model's pool (never disposed: shared buffers)
    if (I.skeleton && I.skeleton.boneTexture) I.skeleton.boneTexture.dispose();
  }

  // ---- per frame --------------------------------------------------------------------------------------------------
  begin(f, now) {
    this.frame++; this.now = now; this.active = true; this.root.visible = true;
    if (this.frame === 1 || this.frame % 30 === 0) this.check();
    // the game frame's dt (fixed-step captures animate like the real loop); wall time only as a fallback
    const t = typeof performance !== 'undefined' ? performance.now() / 1000 : now;
    this.dt = f && f.dt > 0 ? Math.min(0.1, f.dt) : this.lastT ? Math.min(0.1, Math.max(0, t - this.lastT)) : 0.016; this.lastT = t;
    TIME.value = now;
    this.orbUsed = 0;
    // outline (app.mtVoxel.outline, default on): the hull range is part of the single draw, or left out entirely
    const app = this.ctx.app || (typeof window !== 'undefined' ? window.__moba : null), cfg = app && app.mtVoxel;
    const ol = !(cfg && cfg.outline === false);
    this.outlineOn = ol;
    // camera terms for the outline LOD (a unit's on-screen height in device px)
    const cam = this.ctx.camera;
    if (cam && cam.matrixWorld) {
      const e = cam.matrixWorld.elements, ch = this.ctx.renderer && this.ctx.renderer.domElement ? this.ctx.renderer.domElement.height : 1640;
      this.cam = { x: e[12], y: e[13], z: e[14], fx: -e[8], fy: -e[9], fz: -e[10], focal: ch / (2 * Math.tan((cam.fov || 26) * Math.PI / 360)) };
    }
    if (this.viewport) VIEWPORT.value = this.viewport;
    const r = this.ctx.renderer, cv = r && r.domElement, vh = VIEWPORT.value ? VIEWPORT.value.y : 0;
    OUTLINE_PX.value = (cfg && cfg.outlinePx || 1.5) * (cv && cv.height && vh ? vh / cv.height : 1);
    const st = this.stats; st.units = 0; st.draws = 0; st.placeholders = 0; st.models = 0; st.orbs = 0; st.tris = 0; st.shadowTris = 0; st.outlined = 0;
  }

  /**
   * Draw unit u this frame. s = { x, gy, z, teamName ('blue'|'red'|'wild'), flash, dis, scale, tint, dv (wading depth),
   * xa (x-ray 0..1), v (the sprite system's per-unit view state: hitT, atkT, atkWind, evoT, capT, wobT ...), S (sprite art
   * record), artId }. Returns a pseudo frame for the caller's ground marks.
   */
  unit(u, s) {
    if (s.artId === 'orb') return this.captured(u, s);
    const S = s.S, opts = { team: s.teamName === 'wild' ? null : s.teamName, variant: (u.mtMon && u.mtMon.variant) || null, shiny: !!(u.mtMon && u.mtMon.shiny) };
    const key = s.artId + '|' + opts.team + '|' + (opts.variant || '') + '|' + (opts.shiny ? 1 : 0);
    const g = this.build(key, u, s.artId, S, opts);
    let I = this.inst.get(u.id);
    if (I && I.g !== g) { const yaw = I.yaw; this.dropInstance(u.id); I = this.makeInstance(g); I.yaw = yaw; this.inst.set(u.id, I); }
    if (!I) { I = this.makeInstance(g); this.inst.set(u.id, I); I.bornT = this.now; }
    I.seen = this.frame; I.root.visible = true; I.orb = null;
    const size = (u.kind != null && u.subtype === 'super' ? 1.3 : 1) * (s.scale || 1);
    this.animate(I, u, s, size);
    // outline LOD: the shell only when the unit is >= 40 device px tall on screen
    let ol = this.outlineOn && g.nHull > 0;
    if (ol && this.cam) { const C = this.cam, dz = (s.x - C.x) * C.fx + (s.gy - C.y) * C.fy + (s.z - C.z) * C.fz; ol = dz > 0.1 && g.height * I.root.scale.y * C.focal / dz >= 40; }
    I.geo.setDrawRange(0, ol ? g.nMain + g.nHull : g.nMain);
    // per-unit uniforms (+ the catch window cue: a wild monster low on HP pulses slowly)
    const U = I.mat.userData.mt, wild = s.teamName === 'wild' && u.mtMon && u.alive && !u.epic, low = wild && u.maxHp > 0 && u.hp / u.maxHp <= 0.35;
    const cue = low ? 0.1 + 0.1 * Math.sin(this.now * 4) : 0;
    U.uFlash.value = Math.min(1, (s.flash || 0) * 0.85 + cue + (u.recallStart != null ? 0.18 + 0.12 * Math.sin(this.now * 7) : 0));
    if (s.tint) U.uTint.value.set(s.tint[0], s.tint[1], s.tint[2], s.tint[3] ?? 1); else U.uTint.value.w = 0;
    U.uDis.value = s.dis || 0;
    if (low) I.pose.rotation.z += 0.07 * Math.sin(this.now * 9);
    this.xray(I, s);
    this.stats.units++; this.stats.draws += 1 + (I.xmesh && I.xmesh.visible ? 1 : 0); this.stats.tris += I.geo.drawRange.count / 3; if (ol) this.stats.outlined = (this.stats.outlined || 0) + 1; this.stats.shadowTris += g.nLod / 3;
    if (g.placeholder) this.stats.placeholders++; else this.stats.models++;
    return { voxel: true, height: g.height * g.fit * size, radius: g.radius * g.fit };
  }

  /** a monster inside a capture orb: the orb sits on it and wobbles; the monster model shrinks into it on the way in */
  captured(u, s) {
    const I = this.inst.get(u.id), now = this.now, v = s.v || {};
    if (I) {   // the monster we were drawing goes into the orb: red-white flash, shrink toward the orb's centre
      this.inst.delete(u.id); I.seen = this.frame;
      this.ghosts.push({ I, t0: now, x: s.x, y: s.gy + 0.25, z: s.z, s0: I.root.scale.x });
    }
    const wob = now - (v.wobT ?? -99), open = now - (v.capT ?? -99);
    const o = this.orbAt(s.x, s.gy, s.z, 0);
    if (wob >= 0 && wob < 0.5) o.rotation.z = 0.45 * Math.sin(wob / 0.5 * TAU * 1.5) * (1 - wob / 0.5);
    o.userData.flash = open >= 0 && open < 0.3 ? 0.8 * (1 - open / 0.3) : 0;
    return { voxel: true, height: 0.5, radius: 0.35 };
  }
  /** a capture orb mesh for this frame at (x, y, z), spinning by `spin` rad */
  orbAt(x, y, z, spin) {
    let o = this.orbPool[this.orbUsed];
    if (!o) { o = new this.T.Mesh(this.orbGeo, this.orbMat); o.castShadow = true; this.root.add(o); this.orbPool.push(o); }
    this.orbUsed++; this.stats.orbs++; this.stats.draws++;
    o.visible = true; o.position.set(x, y, z); o.rotation.set(0, spin, 0); o.scale.setScalar(1); o.userData.flash = 0;
    return o;
  }
  /** capture flourish at (x, y, z): 'success' = gold sparks rising, 'fail' = red / white shards and an orb pop */
  burst(kind, x, y, z) {
    const ok = kind === 'success', n = ok ? 18 : 24;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, sp = (ok ? 1.2 : 2.2) * (0.5 + Math.random()), up = ok ? 2.5 + Math.random() * 1.5 : 1.5 + Math.random() * 2;
      const c = ok ? (i % 3 ? 0xffd75a : 0xffffff) : (i % 2 ? 0xd8343a : 0xf4f1ea);
      this.particles.push({ x, y: y + 0.3, z, vx: Math.cos(a) * sp, vy: up, vz: Math.sin(a) * sp, t0: this.now, life: ok ? 0.7 : 0.55, c, g: ok ? 3 : 9 });
    }
  }

  /** own units hidden behind structures: the same skinned mesh again, flat, drawn only where it is occluded */
  xray(I, s) {
    const want = (s.xa || 0) > 0.01;
    if (want && !I.xmesh) {
      const T = this.T;
      I.xmat = new T.MeshBasicMaterial({ color: 0x9fe0ff, transparent: true, opacity: 0, depthFunc: T.GreaterDepth, depthWrite: false });
      I.xmesh = new T.SkinnedMesh(I.g.geometry, I.xmat); I.xmesh.renderOrder = 5; I.xmesh.boundingSphere = I.g.sphere;
      I.root.add(I.xmesh); I.xmesh.bind(I.skeleton, this.IDENT);
    }
    if (I.xmesh) { I.xmat.opacity = 0.55 * (s.xa || 0); I.xmesh.visible = want; }
  }

  animate(I, u, s, size = 1) {
    const g = I.g, def = g.def, G = I.groups, now = this.now, dt = this.dt, v = s.v || {};
    // yaw: ease toward the facing (sim x,y -> world x,z; models face +z)
    const fx = Math.cos(u.facing || 0), fz = Math.sin(u.facing || 0), yawT = Math.atan2(fx, fz);
    I.yaw = I.yaw == null ? yawT : I.yaw + wrap(yawT - I.yaw) * Math.min(1, dt * 12);
    I.root.position.set(s.x, s.gy, s.z); I.root.rotation.set(0, I.yaw, 0);
    // evolution: a scale pop when the form changed (the sprite flash runs alongside); a (re)spawned model grows in
    const te = now - (v.evoT ?? -99), pop = te >= 0 && te < 0.5 ? 1 + 0.3 * Math.sin(te / 0.5 * Math.PI) * (1 - te / 0.5) : 1;
    const tb = now - (I.bornT ?? -99), grow = tb >= 0 && tb < 0.25 && v.capT > -50 && now - v.capT < 6 ? ease(tb / 0.25) : 1;
    I.root.scale.setScalar(size * g.fit * pop * grow);
    // reset pose
    const P = I.pose; P.position.set(0, 0, 0); P.rotation.set(0, 0, 0); P.scale.set(1, 1, 1);
    for (const grp of Object.values(G)) { grp.rotation.set(0, 0, 0); grp.position.copy(grp.userData.base); grp.scale.set(1, 1, 1); }
    // locomotion
    const speed = u.moving ? Math.max(1.5, u.speedNow || 3.5) : 0;
    I.walk += ((u.moving && u.alive ? 1 : 0) - I.walk) * Math.min(1, dt * 8);
    const stepHz = def.anim === 'quadruped' ? 1.9 : 1.6;
    I.phase += dt * TAU * stepHz * Math.max(0.6, Math.min(1.8, speed / 3.5)) * (I.walk > 0.02 ? 1 : 0.4);
    const ph = I.phase, wk = I.walk, seed = (u.id * 0.618) % 1;
    const breathe = Math.sin(now * 2.4 + seed * TAU);
    // action envelopes (0..1)
    const tA = now - (v.atkT ?? -99), W = Math.max(0.12, Math.min(0.6, v.atkWind || 0.25));
    let wind = 0, strike = 0;
    if (tA >= 0 && tA < W) wind = ease(tA / W);
    else if (tA >= W && tA < W + 0.38) { const k = (tA - W) / 0.38; strike = k < 0.25 ? ease(k / 0.25) : 1 - ease((k - 0.25) / 0.75); }
    const tH = now - (v.hitT ?? -99), hit = tH >= 0 && tH < 0.3 ? 1 - tH / 0.3 : 0;
    const tC = u.castT != null ? now - u.castT : -1, cast = tC >= 0 && tC < 0.55 ? Math.sin(tC / 0.55 * Math.PI) : 0;
    const dead = !u.alive, tD = dead ? now - (u.deathT ?? now) : 0;
    // whole-body pose: bounce, lunge, flinch, squash, faint (pose-bone offsets are in model units: ÷ fit)
    const k = 1 / (g.fit || 1);
    P.position.y += Math.abs(Math.sin(ph)) * (def.anim === 'quadruped' ? 0.03 : 0.05) * wk * k;
    P.rotation.x += 0.08 * wk - 0.12 * wind + 0.22 * strike - 0.25 * hit;
    P.position.z += (-0.06 * wind + 0.28 * strike - 0.1 * hit) * k;
    const sq = strike * 0.12; P.scale.set(1 + sq * 0.7, 1 - sq, 1 + sq * 0.7);
    if (dead) { const kd = ease(clamp01(tD / 0.5)); P.rotation.z = 1.45 * kd * (seed > 0.5 ? 1 : -1); P.position.y -= 0.15 * kd * k; }
    // per rig
    const rot = (n, x, y, z) => { const p = G[n]; if (p) { p.rotation.x += x || 0; p.rotation.y += y || 0; p.rotation.z += z || 0; } };
    const sw = Math.sin(ph) * wk;
    if (G.body) G.body.scale.y = 1 + 0.025 * breathe * (1 - wk * 0.6);
    switch (def.anim) {
      case 'biped':
        rot('legL', 0.65 * sw); rot('legR', -0.65 * sw);
        rot('armL', -0.5 * sw - 2.3 * cast); rot('armR', 0.5 * sw - 2.3 * cast - 1.9 * wind + 1.2 * strike);
        rot('armL', 0, 0, 0.25 * cast); rot('armR', 0, 0, -0.25 * cast);
        rot('head', 0.04 * breathe - 0.15 * hit);
        break;
      case 'quadruped':
        rot('legFL', 0.6 * sw); rot('legBR', 0.6 * sw); rot('legFR', -0.6 * sw); rot('legBL', -0.6 * sw);
        rot('head', 0.06 * breathe + 0.1 * Math.sin(ph * 2) * wk - 0.25 * wind + 0.45 * strike - 0.2 * hit);
        rot('tail', 0.2 + 0.1 * breathe, 0.45 * Math.sin(now * 3 + seed * 5) + 0.3 * sw);
        if (G.head) G.head.position.z += 0.12 * strike * k;
        break;
      case 'flyer': {
        P.position.y += ((dead ? 0 : 0.5) + 0.07 * Math.sin(now * 2.2 + seed * TAU)) * k;
        const fl = Math.sin(now * (u.moving ? 13 : 8) + seed * TAU);
        rot('wingL', 0, 0, 0.25 + 0.55 * fl); rot('wingR', 0, 0, -0.25 - 0.55 * fl);
        rot('legL', 0.3); rot('legR', 0.3);
        rot('head', 0.05 * breathe - 0.2 * wind + 0.35 * strike);
        break;
      }
      case 'serpent': {
        const r = now * (u.moving ? 7 : 3) + seed * TAU;
        rot('body', 0, 0.12 * Math.sin(r)); rot('tail', 0, 0.45 * Math.sin(r - 1.1)); rot('tail2', 0, 0.55 * Math.sin(r - 2.2));
        rot('head', 0.05 * breathe - 0.2 * wind + 0.4 * strike, -0.1 * Math.sin(r));
        break;
      }
      case 'floater':
        P.position.y += (0.15 + 0.08 * Math.sin(now * 1.8 + seed * TAU)) * k;
        rot('fx', 0, now * 1.5);
        rot('head', 0.05 * breathe);
        break;
      default:
        rot('head', 0.05 * breathe);
    }
    rot('tail2', 0, 0.3 * Math.sin(now * 3 + 1 + seed * 5));
    if (def.anim !== 'floater' && G.fx) G.fx.scale.y = 1 + 0.08 * Math.sin(now * 11 + seed * 7);   // flames lick
  }

  end() {
    const now = this.now, dt = this.dt;
    for (const [id, I] of this.inst) if (I.seen !== this.frame) { I.root.visible = false; if (this.frame - I.seen > 300) this.dropInstance(id); }
    // monsters shrinking into an orb
    this.ghosts = this.ghosts.filter((G) => {
      const t = now - G.t0, k = ease(clamp01(t / 0.35)), I = G.I;
      if (t > 0.4) { this.disposeInstance(I); return false; }
      I.root.visible = true;
      I.root.scale.setScalar(Math.max(0.001, G.s0 * (1 - k)));
      I.root.position.set(I.root.position.x + (G.x - I.root.position.x) * k, I.root.position.y + (G.y - I.root.position.y) * k, I.root.position.z + (G.z - I.root.position.z) * k);
      const U = I.mat.userData.mt; U.uTint.value.set(0.95, 0.2, 0.2, 0.55 * (1 - k)); U.uFlash.value = (0.5 + 0.5 * Math.sin(t * 60)) * (1 - k);
      this.stats.draws++;
      return true;
    });
    // orbs: hide the unused, flash the opening ones (shared material: the strongest flash of the frame)
    let fl = 0;
    for (let i = 0; i < this.orbPool.length; i++) { const o = this.orbPool[i]; if (i >= this.orbUsed) o.visible = false; else fl = Math.max(fl, o.userData.flash || 0); }
    this.orbMat.userData.mt.uFlash.value = fl;
    // particles
    const M = this.parts, D = this.dummy; let n = 0;
    this.particles = this.particles.filter((p) => now - p.t0 < p.life && now >= p.t0 - 0.05);
    for (const p of this.particles) {
      const t = now - p.t0; if (n >= M.instanceMatrix.count) break;
      D.position.set(p.x + p.vx * t, p.y + p.vy * t - 0.5 * p.g * t * t, p.z + p.vz * t);
      D.rotation.set(t * 7, t * 5, 0); D.scale.setScalar(Math.max(0.05, 1 - t / p.life)); D.updateMatrix();
      M.setMatrixAt(n, D.matrix); M.setColorAt(n, this.col.setHex(p.c)); n++;
    }
    M.count = n; M.instanceMatrix.needsUpdate = true; if (M.instanceColor) M.instanceColor.needsUpdate = true;
    this.stats.particles = n; if (n) this.stats.draws++;
    this.tickDisplay(dt);
  }
  // ---- self-checks: units are never invisible -----------------------------------------------------------------
  /** frame 1: watch shader errors + the offscreen self-test; then every 30 frames (first ~30 s): the unit programs'
   *  link diagnostics and finite unit transforms. Any failure -> units fall back to sprites for the session. */
  check() {
    const r = this.ctx.renderer; if (!r) return;
    if (this.frame === 1) {
      watchShaders(r);
      VDIAG.selfTest = this.selfTest();
      if (!VDIAG.selfTest.ok) return this.fallback('self-test: ' + (VDIAG.selfTest.error || 'nothing drawn (coverage ' + VDIAG.selfTest.coverage + ')'));
    }
    if (this.frame > 900) return;
    let n = 0, bad = null;
    for (const p of (r.info && r.info.programs) || []) {
      if (String(p.cacheKey || '').indexOf('mt-voxel-unit') < 0) continue;
      n++; const d = p.diagnostics; if (d && d.runnable === false) bad = 'program ' + p.name + ': ' + String(d.programLog || (d.vertexShader && d.vertexShader.log) || (d.fragmentShader && d.fragmentShader.log) || '').trim().slice(0, 160);
    }
    if (!bad && VDIAG.shaderErrors.some((e) => e.unit)) bad = 'unit shader error';
    let nonFinite = 0, k = 0;
    for (const I of this.inst.values()) { if (k++ > 8) break; const e = I.root.matrixWorld.elements; if (!(Number.isFinite(e[0]) && Number.isFinite(e[5]) && Number.isFinite(e[12]) && Number.isFinite(e[13]) && Number.isFinite(e[14]) && Number.isFinite(I.g.fit))) nonFinite++; }
    if (!bad && nonFinite) bad = nonFinite + ' unit transform(s) not finite';
    VDIAG.programCheck = { frame: this.frame, unitPrograms: n, bad };
    if (bad) this.fallback(bad);
  }
  fallback(reason) {
    const app = this.ctx.app || (typeof window !== 'undefined' ? window.__moba : null);
    VDIAG.fallback = reason;
    let keep = false; try { keep = app && app.params && app.params.get && app.params.get('units') === 'voxel'; } catch (e) { keep = false; }
    console.warn('[mt-voxel] ' + (keep ? '(?units=voxel: kept) ' : 'units fall back to sprites: ') + reason);
    if (keep || !app) return;
    app.mtVoxelUnitsOff = reason; this.hide();
  }
  /** one skinned orb (the units' exact path: pooled view, skeleton + bone texture, unit material, LOD shadow range) drawn
   *  into a 16x16 target; ok = it covers the middle of it */
  selfTest() {
    const T = this.T, r = this.ctx.renderer, res = { ok: false };
    if (!T.WebGLRenderTarget || !r.readRenderTargetPixels) return { ok: true, skipped: true };
    let rt = null, I = null, M = null;
    const prevRT = r.getRenderTarget(), prevCC = r.getClearColor(new T.Color()), prevCA = r.getClearAlpha(), prevNU = r.shadowMap.needsUpdate;
    try {
      M = this.mergedGeometry({ parts: { body: { model: orbModel(), pivot: [3.5, 0, 3.5], at: [0, 0, 0] } } }, { hull: true, lod: true });
      const g = { key: 'selftest', ...M, sphere: M.geometry.boundingSphere.clone(), height: 0.7, fit: 1 };
      I = this.makeInstance(g); I.root.removeFromParent(); I.geo.setDrawRange(0, g.nMain);
      I.pose.position.y = 0.05; I.root.updateMatrixWorld(true);
      const scene = new T.Scene(), sun = new T.DirectionalLight(0xffffff, 2);
      sun.position.set(1, 3, 2); sun.castShadow = true; sun.shadow.mapSize.set(64, 64);
      scene.add(new T.AmbientLight(0xffffff, 1), sun, I.root);
      const cam = new T.OrthographicCamera(-0.6, 0.6, 0.6, -0.6, 0.1, 20); cam.position.set(0, 0.4, 5); cam.lookAt(0, 0.4, 0);
      rt = new T.WebGLRenderTarget(16, 16);
      r.setRenderTarget(rt); r.setClearColor(0xff00ff, 0); r.clear(true, true, true);
      r.render(scene, cam);
      const px = new Uint8Array(16 * 16 * 4); r.readRenderTargetPixels(rt, 0, 0, 16, 16, px);
      let n = 0; for (let i = 3; i < px.length; i += 4) if (px[i] > 128) n++;
      const c = (8 * 16 + 8) * 4;
      res.coverage = +(n / 256).toFixed(3); res.center = [px[c], px[c + 1], px[c + 2], px[c + 3]];
      res.ok = n >= 16 && px[c + 3] > 128;
      for (const p of (r.info && r.info.programs) || []) if (String(p.cacheKey || '').indexOf('mt-voxel-unit') >= 0 && p.diagnostics && p.diagnostics.runnable === false) { res.ok = false; res.error = 'unit program not runnable'; }
    } catch (e) { res.error = String((e && e.message) || e).slice(0, 200); res.ok = false; }
    finally {
      try { r.setRenderTarget(prevRT); r.setClearColor(prevCC, prevCA); r.shadowMap.needsUpdate = prevNU; } catch (e) { /* keep going */ }
      if (rt) rt.dispose();
      if (I) { I.root.removeFromParent(); I.mat.dispose(); if (I.skeleton && I.skeleton.boneTexture) I.skeleton.boneTexture.dispose(); if (I.geo) I.geo.dispose(); }
      if (M) M.geometry.dispose();
    }
    return res;
  }
  /** ?diag=1 overlay: models, counts, the first drawn unit's transform / bounds / draw range */
  diagInfo() {
    const o = { modelsReady: !!MODELS, modelsTried, active: this.active, rootVisible: this.root.visible, inScene: !!this.root.parent, frame: this.frame, built: this.geo.size, ...this.stats };
    let vis = 0, first = null;
    for (const [id, I] of this.inst) {
      if (I.seen !== this.frame || !I.root.visible) continue; vis++;
      if (!first) {
        const m = I.root, e = m.matrixWorld.elements, s = I.g.sphere, sk = I.skeleton;
        first = { id, key: I.g.key, placeholder: I.g.placeholder, fit: +(+I.g.fit).toFixed(3), pos: [e[12], e[13], e[14]].map((v) => +(+v).toFixed(2)), scale: +(+m.scale.x).toFixed(3),
          sphere: s ? [s.center.x, s.center.y, s.center.z, s.radius].map((v) => +(+v).toFixed(2)) : null, drawRange: [I.geo.drawRange.start, I.geo.drawRange.count],
          nMain: I.g.nMain, nHull: I.g.nHull, verts: I.geo.attributes.position.count, index: I.geo.index ? I.geo.index.array.constructor.name : null,
          bones: sk ? sk.bones.length : 0, boneTex: sk && sk.boneTexture ? sk.boneTexture.image.width : null, frustumCulled: m.frustumCulled,
          program: (() => { try { const p = this.ctx.renderer.properties.get(I.mat); return p && p.currentProgram ? p.currentProgram.name + '#' + p.currentProgram.id : null; } catch (e) { return null; } })() };
      }
    }
    o.visibleMeshes = vis; o.first = first;
    return o;
  }

  /** voxel world style off: hide everything (instances stay cached for a quick switch back) */
  hide() { if (this.active) { this.root.visible = false; this.active = false; } }

  // ---- debug lineup: every registered model (or `ids`) in a row at (x, z), idle / walking alternately -------------
  lineup(ids, x, z, gap = 2.6, cols = 9) {
    const heightAt = this.heightAt;
    for (const d of this.display) this.disposeInstance(d.I);
    this.display = [];
    const list = ids || (MODELS ? Object.keys(MODELS) : []);
    list.forEach((id, i) => {
      const art = /^trainer_/.test(id) ? id + '_blue' : id.replace(/^minion_/, '') + (/^minion_/.test(id) ? '_blue' : '').replace(/^boss_/, '');
      const S = { kind: /^trainer_/.test(id) ? 'trainer' : /^minion_/.test(id) ? 'minion' : /^boss_/.test(id) ? 'boss' : 'monster', baseId: id.replace(/^(minion|boss)_/, ''), worldHeight: 1 };
      const artId = S.kind === 'boss' ? S.baseId : art;
      const g = this.build('lineup|' + id, null, artId, S, { team: 'blue', variant: null, shiny: false });
      const c = i % cols, r = Math.floor(i / cols), px = x + (c - (cols - 1) / 2) * gap, pz = z + r * gap * 1.4, py = heightAt ? heightAt(px, pz) : 0;
      const I = this.makeInstance(g);
      this.display.push({ I, id, u: { id: 900 + i, facing: Math.PI / 2 + (i % 2 ? 0.6 : -0.3), moving: i % 2 === 1, speedNow: 3.5, alive: true }, s: { x: px, gy: py, z: pz, v: {} } });
    });
    return this.display.map((d) => ({ id: d.id, placeholder: d.I.g.placeholder, fit: +d.I.g.fit.toFixed(2), height: +(d.I.g.height * d.I.g.fit).toFixed(2) }));
  }
  tickDisplay() { for (const d of this.display) { d.I.root.visible = true; this.animate(d.I, d.u, d.s, 1); this.stats.draws++; } }

  /** the model's top above the feet (m) for unit u, or null — HP bars / plates / VFX anchors */
  topOf(u) { const I = this.inst.get(u.id); if (!I || I.seen !== this.frame) return null; return I.g.height * I.root.scale.y + I.pose.position.y * I.root.scale.y; }
  /** overlay position just above the model (same projection as mt/ui/plates.js spriteTop) */
  topScreen(bars, u, frame) {
    const h = this.topOf(u); if (h == null) return null;
    const P = frame.proj; if (!P || !P.e) return null;
    const I = this.inst.get(u.id), x = I.root.position.x, z = I.root.position.z, y = I.root.position.y + h + 0.08;
    const e = P.e, w = e[3] * x + e[7] * y + e[11] * z + e[15]; if (w <= 1e-4) return null;
    const sx = P.l + ((e[0] * x + e[4] * y + e[8] * z + e[12]) / w * 0.5 + 0.5) * P.w;
    const sy = P.t + (0.5 - (e[1] * x + e[5] * y + e[9] * z + e[13]) / w * 0.5) * P.h;
    const D = bars.D || 1;
    return { x: Math.round(sx * D), y: Math.round(sy * D) };
  }

  dispose() {
    for (const id of [...this.inst.keys()]) this.dropInstance(id);
    for (const G of this.ghosts) this.disposeInstance(G.I);
    for (const d of this.display) this.disposeInstance(d.I);
    for (const g of this.geo.values()) g.geometry.dispose();
    this.geo.clear(); this.orbGeo.dispose(); this.orbMat.dispose(); this.parts.geometry.dispose(); this.parts.material.dispose();
    this.root.removeFromParent();
  }
}

/** is the voxel unit style on? app.mtWorldStyle (set by the world) wins, else ?world= */
export function voxelStyle(app) {
  if (!app) return false;
  // units-only sprite fallback (the world keeps its style): the self-test / program check failed, or ?units=sprite
  if (app.mtVoxelUnitsOff) return false;
  const P0 = app.params; if (P0 && P0.get && P0.get('units') === 'sprite') return false;
  if (app.mtWorldStyle) return app.mtWorldStyle === 'voxel';
  const P = app.params; return !!(P && P.get && P.get('world') === 'voxel');   // 3D is the default look
}
