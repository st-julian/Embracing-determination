// mt/voxel/fade.js — canopy / structure see-through for the voxel world (owner: environment). Render only.
//
// Tree crowns, tall bushes and structure bodies that stand between the camera and a unit the player can see are
// screen-door dithered away around that unit (a cone from the camera to the unit's chest, soft edged). The test runs
// per fragment in world space, so one material serves instanced vegetation and plain meshes alike, and nothing pops:
// every unit's weight eases in and out over ~0.2 s. Shadows are untouched (the shadow pass uses its own depth
// material), so a faded tree still shades the ground.
//
// Only units the viewer may see are used (app.mtSees / u.visible), so a fade never reveals a hidden enemy.

import { o as heightAt, a as WATER_Y } from '../../assets/height-CVtQdZ3e.js';

const SLOTS = 8;
let SHARED = null;

function shared(THREE) {
  if (!SHARED) SHARED = { uFadeP: { value: Array.from({ length: SLOTS }, () => new THREE.Vector4(0, 0, 0, 0)) }, uFadeN: { value: 0 } };
  return SHARED;
}

const VERT_HEAD = 'varying vec3 vFW;\nvarying vec2 vEdge;\n';
const VERT_BODY = `
  { vec4 vxW = vec4(transformed, 1.0);
  #ifdef USE_INSTANCING
    vxW = instanceMatrix * vxW;
  #endif
    vFW = (modelMatrix * vxW).xyz;
    vEdge = vec2(gl_Position.y / gl_Position.w, transformed.y); }`;
const FRAG_HEAD = `varying vec3 vFW;
varying vec2 vEdge;
uniform vec4 uFadeP[${SLOTS}];
uniform int uFadeN;
float vxBayer2(vec2 a) { a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
float vxBayer4(vec2 a) { return vxBayer2(0.5 * a) * 0.25 + vxBayer2(a); }
float vxFade() {
  float a = 0.0;
  vec3 F = vFW - cameraPosition;
  for (int i = 0; i < ${SLOTS}; i++) {
    if (i >= uFadeN) break;
    vec4 p = uFadeP[i];
    if (p.w <= 0.001) continue;
    vec3 D = p.xyz - cameraPosition;
    float t = dot(F, D) / dot(D, D);                  // 0 at the camera, 1 at the unit
    if (t <= 0.02 || t >= 0.97) continue;            // only what stands in front of the unit
    float lat = length(F - D * t) / t;               // lateral distance, scaled to the unit's depth (m)
    float m = (1.0 - smoothstep(1.05, 1.75, lat)) * smoothstep(0.97, 0.91, t);
    a = max(a, m * p.w);
  }
#ifdef VX_EDGE
  // canopies along the bottom screen edge thin out so they never wall off the screen corners (trunks stay)
  a = max(a, smoothstep(-0.3, -0.68, vEdge.x) * smoothstep(VX_EDGE_Y0, VX_EDGE_Y0 + 0.6, vEdge.y) * 0.97);
#endif
  return a;
}
`;

/** a vertex-coloured Lambert material with the see-through cut (one program per `key`) */
export function fadeMaterial(THREE, key = 'vx-fade-1', params = {}, opts = {}) {
  const S = shared(THREE);
  const m = new THREE.MeshLambertMaterial({ vertexColors: true, ...params });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uFadeP = S.uFadeP; sh.uniforms.uFadeN = S.uFadeN;
    sh.vertexShader = VERT_HEAD + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>' + VERT_BODY);
    sh.fragmentShader = FRAG_HEAD + sh.fragmentShader.replace('#include <clipping_planes_fragment>',
      '#include <clipping_planes_fragment>\n  { float vxA = vxFade(); if (vxA > 0.0 && vxA * 0.88 > vxBayer4(gl_FragCoord.xy)) discard; }');
    if (opts.edge) sh.fragmentShader = `#define VX_EDGE\n#define VX_EDGE_Y0 ${(opts.edgeY != null ? opts.edgeY : 1.0).toFixed(2)}\n` + sh.fragmentShader;
  };
  m.customProgramCacheKey = () => key;
  return m;
}

/** picks the units to keep visible and eases their weights; call once per frame */
export class FadeDriver {
  constructor(THREE) { this.S = shared(THREE); this.w = new Map(); this.last = 0; }
  update(world, time, camera) {
    const app = globalThis.__moba, P = this.S.uFadeP.value;
    const dt = Math.min(0.1, Math.max(0, (time || 0) - this.last)); this.last = time || 0;
    const cand = [];
    if (world && world.unitList && camera) {
      const me = app && world.units && world.units.get ? world.units.get(app.playerId) : null, team = me ? me.team : 0;
      const cx = camera.position.x, cz = camera.position.z;
      for (const u of world.unitList) {
        if (!u || !u.alive || !u.mtSprite) continue;
        let sees = true;
        try { sees = app && app.mtSees ? app.mtSees(u) : !(u.visible && u.visible[team] === false); } catch (e) { /* */ }
        if (!sees) continue;
        const d = Math.hypot(u.x - cx, u.y - cz); if (d > 34) continue;
        const own = me && (u.id === me.id || (u.mtMon && u.mtMon.ownerId === me.id));
        cand.push({ u, pr: (own ? 0 : u.team === team ? 40 : 60) + d });
      }
    }
    cand.sort((a, b) => a.pr - b.pr);
    const want = new Set();
    for (let k = 0; k < Math.min(SLOTS, cand.length); k++) want.add(cand[k].u);
    for (const u of want) if (!this.w.has(u)) this.w.set(u, 0);
    const k1 = Math.min(1, dt * 7);
    const live = [];
    for (const [u, w] of this.w) {
      const nw = w + ((want.has(u) && u.alive ? 1 : 0) - w) * k1;
      if (nw < 0.01 && !want.has(u)) { this.w.delete(u); continue; }
      this.w.set(u, nw); live.push([u, nw]);
    }
    live.sort((a, b) => b[1] - a[1]);
    this.S.uFadeN.value = Math.min(SLOTS, live.length);
    for (let k = 0; k < SLOTS; k++) {
      const e = live[k];
      if (!e) { P[k].w = 0; continue; }
      const u = e[0], x = u.x, z = u.y;
      P[k].set(x, Math.max(heightAt(x, z), WATER_Y - 0.3) + 0.75, z, e[1]);
    }
  }
}
