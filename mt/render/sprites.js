// mt/render/sprites.js — pixel-perfect camera-facing sprites for trainers, monsters (pets + wild), lane minions
// and the capture orb. Owner: sprite/render specialist (art agent).
//
// Art comes from game/art/sprites (procedural pixel-art library, see game/art/README.md). Frames are rasterised
// lazily per sprite id (time-sliced prewarm, synchronous only for frames that are on screen and not built yet) into
// a paged atlas: up to 4 lazily created 2048x2048 RGBA DataTextures (NearestFilter, partial row uploads, LRU page
// eviction when every page is full; 2048 is the WebGL2 guaranteed MAX_TEXTURE_SIZE).
//
// Rendering model (2.5D, Gen-5 style): every sprite is a screen-aligned quad anchored at the unit's FEET in 3D.
//  * one texel density shared with the world pixel grid (app.mtPixel, 32 px/m): 1 art px = k whole screen px and
//    the feet anchor is snapped to the grid -> square, crisp, non-shimmering pixels;
//  * depth = the feet anchor's depth pulled toward the camera (cut-out standing at its feet: no ground clipping,
//    correct occlusion between units and by closer world geometry); x-ray silhouettes where terrain hides it;
//  * per-pixel material / normal data lit by the scene sun every frame (HD-2D), 1-px dark coloured outline with a
//    sun-side selout, alpha tag 0.75 so the world's geometry outline pass leaves sprite pixels alone;
//  * screen-space pixel "marks" around the feet, on the same grid: crisp contact shadow, bold 2-px team ring, own
//    trainer pulse, and for units standing in the river a waterline cut (submerged rows tinted + swaying, 1-px foam
//    line) with a foam ring and expanding ripples at the water surface.
// Unit fields read: x,y,prevX,prevY,facing,alive,deathT,moving,speedNow,attackSeq,attackT,windupFrac,attackSpeed,
// castT,hitSeq,team,kind,subtype,visible[],mtMon{form,capturing,evolving,ownerId},mtTrainer{spec}.

import { o as heightAt, a as WATER_Y } from '../../assets/height-CVtQdZ3e.js';
import { E as DT, D as KIND } from '../../assets/map-oE9sOnNc.js';
import { SPECIES_ART, renderSpriteData, spritePalette } from '../../art/sprites/index.js';
import { MT_EVENT as E } from '../sim/events.js';
import { VoxelUnits, voxelStyle } from '../voxel/units/index.js';   // [voxel] units as animated voxel models (the default look; ?world=3d keeps sprites)

export const PPM = 32;                 // art pixels per world metre — shared with the world pixel grid (app.mtPixel.ppm)
export const ART_SCALE = 1.25;         // rig rasterised at 1.25x the authored size (real extra detail, not upscaled)
const PAGE = 2048, PAD = 1;
// atlas pages (16 MB each, created lazily): 6 on devices reporting >= 4 GB, 4 below that; when the memory is not
// reported (Safari), 4 on iOS / iPadOS / any touch-primary device (mobile tabs get killed for GPU memory), else 6
const MAX_PAGES = (() => {
  if (typeof navigator === 'undefined') return 6;
  const m = navigator.deviceMemory;
  if (m !== undefined) return m >= 4 ? 6 : 4;
  const ua = navigator.userAgent || '', ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const touch = navigator.maxTouchPoints > 1 || (typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches);
  return ios || touch ? 4 : 6;
})();
const SIZE = { trainer: 1.12, juvenile: 1.12, evolved: 1.06, final: 1.08, super: 1.3 };   // raster-size multipliers (re-rasterised, never stretched)
const HD_PPM = 36;                     // HD (no app.mtPixel): target art px per metre; the exact density makes the scale whole
const WADE_MAX = 0.34;                 // deepest visual wading depth (m): deeper river beds lift the sprite to it
const MARK_RATIO = 0.5;                // screen-space ground ellipses: height / width
const MINION_ART = { melee: 'grubling', caster: 'spitwing', siege: 'shellram', super: 'shellram' };
const teamName = (t) => (t === 1 ? 'red' : 'blue');

// Shared vertex core: screen-aligned quad, feet anchor snapped to the (world) pixel grid, k screen px per art px.
// iPos = (x, groundY, z, flip)  iSize = (w px, h px, scale, anchorX px)  iUv = atlas rect  iMisc = (flash, dissolve, team code, bottom px)
// iExtra = (palette base row, atlas page, cloud shade 0..1, -)  iWade = (waterline art px above the feet or 0, visual depth m, seed, -)
const VS_HEAD = `
attribute vec4 iPos; attribute vec4 iSize; attribute vec4 iUv; attribute vec4 iMisc; attribute vec4 iTint; attribute vec4 iExtra; attribute vec4 iWade;
uniform vec2 uViewport; uniform float uK; uniform float uBias; uniform float uPPM;
uniform sampler2D uShadowMap; uniform mat4 uShadowMatrix; uniform float uShadowOn; uniform vec2 uShadowTexel; uniform float uRev;
float sunLight(vec3 wp) {
  if (uShadowOn < 0.5) return 1.0;
  vec4 sc = uShadowMatrix * vec4(wp, 1.0); sc.xyz /= sc.w;
  if (sc.x < 0.0 || sc.x > 1.0 || sc.y < 0.0 || sc.y > 1.0 || sc.z > 1.0) return 1.0;
  float lit = 0.0;
  for (int i = -1; i <= 1; i++) for (int j = -1; j <= 1; j++) {
    float d = texture2D(uShadowMap, sc.xy + vec2(float(i), float(j)) * uShadowTexel * 1.5).r;
    lit += uRev > 0.5 ? step(d, sc.z + 0.002) : step(sc.z - 0.002, d);
  }
  return lit / 9.0;
}
`;
// paged atlas lookup (page index per instance)
const ATLAS_FS = `
uniform sampler2D uMap0; uniform sampler2D uMap1; uniform sampler2D uMap2; uniform sampler2D uMap3; uniform sampler2D uMap4; uniform sampler2D uMap5;
varying float vPage;
vec4 atlas(vec2 uv) {
  if (vPage < 0.5) return texture2D(uMap0, uv);
  if (vPage < 1.5) return texture2D(uMap1, uv);
  if (vPage < 2.5) return texture2D(uMap2, uv);
  if (vPage < 3.5) return texture2D(uMap3, uv);
  if (vPage < 4.5) return texture2D(uMap4, uv);
  return texture2D(uMap5, uv);
}
`;
const SPRITE_VS = VS_HEAD + `
uniform float uXray; uniform float uPxM;
varying vec2 vUv; varying vec2 vMisc; varying vec4 vTint; varying float vLight; varying float vFlip; varying float vTeam; varying vec2 vPal;
varying float vPage; varying vec3 vLy; varying float vK; varying float vXr;
void main() {
  vec2 q = position.xy;                                   // 0..1 quad corner
  vec4 va = viewMatrix * vec4(iPos.xyz, 1.0);             // feet anchor in view space
  vec4 ca = projectionMatrix * va;
  vec2 px = floor((ca.xy / ca.w * 0.5 + 0.5) * uViewport + 0.5);   // anchor snapped to the (screen or world) pixel grid
  float k = iSize.z;                                      // screen px per art px: whole number unless the HD camera is zooming
  float lx = q.x * iSize.x - iSize.w; if (iPos.w > 0.5) lx = -lx;    // art px relative to anchor
  // death: the fainted sprite sinks into the ground (rows below the feet are cut) - crisp, never see-through
  float ly = q.y * iSize.y - iMisc.w - floor(iMisc.y * iSize.y + 0.5);
  vec2 v = px + vec2(lx, ly) * k;
  // x-ray silhouettes are only drawn where something >= 1.6 m in front hides the sprite
  // depth reference: the feet, or the water surface above them when wading (the river surface never covers a body)
  vec4 vd = iWade.y > 0.0 ? viewMatrix * vec4(iPos.x, iPos.y + iWade.y, iPos.z, 1.0) : va;
  vec4 cd = projectionMatrix * vec4(va.xy, vd.z + uBias + uXray * 1.6, 1.0);
  gl_Position = vec4((v / uViewport * 2.0 - 1.0) * cd.w, cd.z, cd.w);
  vUv = iUv.xy + q * iUv.zw;
  vMisc = iMisc.xy; vTint = iTint; vFlip = iPos.w; vTeam = iMisc.z; vPal = iExtra.xy; vPage = iExtra.y; vK = k;
  vLy = vec3(ly, iWade.x, iWade.z); vXr = iWade.w;
  // scene light: sun visibility sampled from the sun shadow map at the sprite's chest, dimmed under drifting clouds
  vLight = sunLight(iPos.xyz + vec3(0.0, max(0.25, (iSize.y - iMisc.w) * 0.42 * k / uPxM), 0.0)) * (1.0 - 0.55 * iExtra.z);
}`;
// Dynamic pixel-art lighting ("HD-2D"): the atlas holds per-pixel material id + baked tone + view-space normal;
// tones are re-quantised from the scene sun every frame and looked up in the sprite's hue-shifted palette ramp.
// Whole-number scales sample exact texels; fractional scales (HD camera zoom) light the 4 nearest texels and blend
// them "sharp bilinear" (hard inside a texel, a 1-screen-px blend at its edges): crisp, even pixels, no shimmer.
const SPRITE_FS = ATLAS_FS + `
uniform sampler2D uPal; uniform float uPalRows; uniform vec2 uTexel;
uniform vec3 uSunView; uniform vec3 uSunCol; uniform vec3 uShadeCol; uniform vec2 uSunUv; uniform float uGlow; uniform float uTime; uniform float uDyn;
uniform float uTag; uniform float uLift; uniform vec3 uWaterCol; uniform vec3 uFoamCol;
varying vec2 vUv; varying vec2 vMisc; varying vec4 vTint; varying float vLight; varying float vFlip; varying vec2 vPal; varying vec3 vLy; varying float vK;
vec3 pal(float mat, float tone) { return texture2D(uPal, vec2((tone + 0.5) / 8.0, (vPal.x + mat + 0.5) / uPalRows)).rgb; }
// lit colour of the atlas texel at uv (rgb, coverage 0/1)
vec4 litTexel(vec2 uv, float sub) {
  vec4 d = atlas(uv);
  if (d.b < 0.002) return vec4(0.0);
  float r = floor(d.r * 255.0 + 0.5), g = floor(d.g * 255.0 + 0.5);
  float mat = mod(r, 32.0), fl = floor(r / 32.0);
  float emissive = mod(fl, 2.0), gloss = mod(floor(fl / 2.0), 2.0), fixedT = floor(fl / 4.0);
  float baked = mod(g, 8.0), bakedSh = mod(floor(g / 8.0), 2.0), bias = (floor(g / 16.0) - 4.0) * 0.1;
  float tone = baked;
  vec2 off = uSunUv; if (vFlip > 0.5) off.x = -off.x;
  if (fixedT < 0.5 && uDyn > 0.5) {
    vec3 n = vec3((d.b * 255.0 - 128.0) / 127.0, (d.a * 255.0 - 128.0) / 127.0, 0.0);
    if (vFlip > 0.5) n.x = -n.x;
    n.z = sqrt(max(0.0, 1.0 - dot(n.xy, n.xy)));
    vec3 L = normalize(vec3(uSunView.x, uSunView.y, max(uSunView.z, 0.0) * 0.6 + 0.55));   // sun as a key light (always some front fill)
    float s = dot(n, L) - bakedSh * 0.5 + bias;                                     // + the art's own shading patterns
    s = mix(s * 0.5 - 0.2, s, vLight);                                             // in the sun's shadow: ambient only (kept readable)
    tone = s < -0.38 ? 0.0 : s < 0.08 ? 1.0 : s < 0.6 ? 2.0 : 3.0;
    if (sub < 0.5) {
      float spec = pow(max(dot(n, normalize(L + vec3(0.0, 0.0, 1.0))), 0.0), 18.0);
      if (gloss > 0.5 && (s > 0.88 || spec > 0.72) && vLight > 0.5) tone = 4.0;
      // rim: a pixel whose neighbour toward the sun (screen space) is empty
      if (atlas(uv + off).b < 0.002 && vLight > 0.4 && n.z < 0.92) tone = min(tone + 2.0, gloss > 0.5 ? 4.0 : 3.0);
      // in shade: a soft sky rim on the top edge keeps the silhouette off dark ground
      else if (vLight <= 0.4 && n.y > 0.25 && atlas(uv + vec2(0.0, uTexel.y)).b < 0.002) tone = min(tone + 1.0, 3.0);
    }
  } else if (uDyn > 0.5 && emissive < 0.5 && (baked == 5.0 || baked == 7.0)) {
    // dynamic selout: the dark 1-px outline lifts one step only on the sun-facing side of the silhouette
    tone = (atlas(uv + off).b < 0.002 && atlas(uv - off).b >= 0.002 && vLight > 0.4 && sub < 0.5) ? 7.0 : 5.0;
  }
  vec3 col = pal(mat, tone);
  if (emissive > 0.5) col *= 1.0 + uGlow * (0.35 + tone / 4.0) * (0.85 + 0.15 * sin(uTime * 9.0 + uv.x * 900.0));
  else col *= mix(vec3(1.0), mix(uShadeCol, uSunCol, vLight), 0.42) * (tone < 4.5 ? uLift : 1.0);
  return vec4(col, 1.0);
}
void main() {
  // waterline cut: art rows below the water surface are drawn submerged (tinted, swaying by 1 px)
  float row = floor(vLy.x), wl = vLy.y;
  float sub = (wl > 0.5 && row < wl) ? 1.0 : 0.0;
  if (vMisc.y > 0.001 && vLy.x < 0.0) discard;
  vec2 uv = vUv;
  if (sub > 0.5 && row < wl - 1.0) {
    float sw = sin(uTime * 3.4 + row * 1.9 + vLy.z);
    uv.x += (sw > 0.55 ? 1.0 : sw < -0.55 ? -1.0 : 0.0) * uTexel.x;
  }
  vec4 c;
  if (abs(vK - floor(vK + 0.5)) < 0.01) c = litTexel(uv, sub);
  else {
    vec2 t = uv / uTexel - 0.5, b = floor(t), w = clamp((t - b - 0.5) * vK + 0.5, 0.0, 1.0);
    vec2 u0 = (b + 0.5) * uTexel, dx = vec2(uTexel.x, 0.0), dy = vec2(0.0, uTexel.y);
    c = mix(mix(litTexel(u0, sub), litTexel(u0 + dx, sub), w.x), mix(litTexel(u0 + dy, sub), litTexel(u0 + dx + dy, sub), w.x), w.y);
    if (c.a > 0.0) c.rgb /= c.a;
  }
  if (c.a < 0.5) discard;
  vec3 col = c.rgb;
  if (sub > 0.5) {
    float e = clamp((wl - row) / max(wl, 1.0), 0.0, 1.0);
    col = mix(col * vec3(0.55, 0.74, 0.9), uWaterCol, 0.36 + 0.3 * e);
    if (row >= wl - 1.0) col = mix(col, uFoamCol, 0.62);                           // 1-px waterline highlight
  }
  col = mix(col, vTint.rgb, clamp(vTint.a, 0.0, 1.0));
  // flashes lift toward a warm white but keep a trace of the sprite's own shading (a full flash is not a blank cut-out)
  gl_FragColor = vec4(mix(col, vec3(1.0, 0.97, 0.9), clamp(vMisc.x, 0.0, 1.0) * 0.85), uTag);
  #include <colorspace_fragment>
}`;
// "behind the wall" indicator for the local player's own units: a soft, dark team-tinted silhouette (~34 % fill, no
// contour line) on the HIDDEN pixels only (depthFunc GREATER), faded in after the unit has been hidden by terrain for
// 0.3 s (vXr = per-instance alpha from the CPU heightfield test, 0 for everyone else)
const XRAY_FS = ATLAS_FS + `
uniform vec3 uTeamCols[5]; uniform vec2 uTexel;
varying vec2 vUv; varying vec2 vMisc; varying float vTeam; varying float vXr;
float covX(vec2 uv) { return step(0.002, atlas(uv).b); }
void main() {
  if (vXr < 0.01 || vMisc.y > 0.05) discard;
  vec2 o = uTexel * 0.9;
  float c = (covX(vUv) * 2.0 + covX(vUv + vec2(o.x, 0.0)) + covX(vUv - vec2(o.x, 0.0)) + covX(vUv + vec2(0.0, o.y)) + covX(vUv - vec2(0.0, o.y))) / 6.0;
  if (c < 0.05) discard;
  int t = int(vTeam + 0.5);
  vec3 col = t == 1 ? uTeamCols[1] : t == 2 ? uTeamCols[2] : t == 3 ? uTeamCols[3] : t == 4 ? uTeamCols[4] : uTeamCols[0];
  gl_FragColor = vec4(col * 0.5, 0.34 * c * vXr);
  #include <colorspace_fragment>
}`;
// sprite silhouette projected onto the ground (or the water surface when wading) along the sun direction; in HD the
// silhouette is filtered with a penumbra that widens with height above the feet (contact-hardening, like the world's)
const CAST_VS = VS_HEAD + `
uniform vec3 uSunDir; uniform vec3 uCamRight; uniform float uHD; uniform float uPxM;
varying vec2 vUv; varying float vA; varying float vPage; varying vec2 vLy; varying vec4 vRect; varying float vSoft;
void main() {
  vec2 q = position.xy;
  float mg = uHD > 0.5 ? 3.0 : 0.0;                                  // quad margin (art px) for the soft edge
  float ex = q.x * (iSize.x + 2.0 * mg) - mg, ey = q.y * (iSize.y + 2.0 * mg) - mg;
  float lx = ex - iSize.w; if (iPos.w > 0.5) lx = -lx;
  float ly = ey - iMisc.w;
  float m = iSize.z / uPxM;                                          // metres per art px
  float base = iPos.y + iWade.y;
  vec3 p = iPos.xyz + uCamRight * (lx * m) + vec3(0.0, max(0.0, ly) * m, 0.0);
  vec3 g = p - uSunDir * (p.y - base) / max(0.2, uSunDir.y);      // project along the sun onto the feet / water plane
  g.y = base + 0.03;
  gl_Position = projectionMatrix * viewMatrix * vec4(g, 1.0);
  vUv = iUv.xy + vec2(ex / iSize.x, ey / iSize.y) * iUv.zw; vPage = iExtra.y; vLy = vec2(ly, iWade.x);
  vRect = vec4(iUv.xy, iUv.xy + iUv.zw);
  vSoft = uHD * (0.7 + 0.07 * max(0.0, ly));
  vA = (1.0 - iMisc.y) * sunLight(iPos.xyz + vec3(0.0, 0.4, 0.0)) * (1.0 - 0.55 * iExtra.z);
}`;
const CAST_FS = ATLAS_FS + `
uniform vec4 uCastCol; uniform vec2 uTexel; varying vec2 vUv; varying float vA; varying vec2 vLy; varying vec4 vRect; varying float vSoft;
float cov(vec2 uv) { return (uv.x < vRect.x || uv.y < vRect.y || uv.x > vRect.z || uv.y > vRect.w) ? 0.0 : step(0.002, atlas(uv).b); }
void main() {
  if (vA < 0.02 || (vLy.y > 0.5 && vLy.x < vLy.y)) discard;
  float c = cov(vUv);
  if (vSoft > 0.01) {
    vec2 o = vSoft * uTexel, h = o * 0.5;
    c = (c * 2.0 + cov(vUv + vec2(o.x, 0.0)) + cov(vUv - vec2(o.x, 0.0)) + cov(vUv + vec2(0.0, o.y)) + cov(vUv - vec2(0.0, o.y))
       + cov(vUv + o) + cov(vUv - o) + cov(vUv + vec2(o.x, -o.y)) + cov(vUv + vec2(-o.x, o.y))
       + cov(vUv + h) + cov(vUv - h) + cov(vUv + vec2(h.x, -h.y)) + cov(vUv + vec2(-h.x, h.y))) / 14.0;
  }
  if (c < 0.01) discard;
  gl_FragColor = vec4(uCastCol.rgb, uCastCol.a * vA * c);
}`;
// Screen-space marks on the sprite's own snapped anchor: kind 0 contact shadow, 1 team ring (bright outer + dark
// inner band), 2 foam ring, 3 expanding ripple / pulse (two phases). Pixel mode: crisp pixel ellipses on the art
// grid (2-tone shadow, 1-px rings, ordered-dither fades). HD: smooth anti-aliased shapes at screen resolution (soft
// AO-like contact shadow, ~2-px rings, alpha fades). half: 0 whole + 1 back half are drawn just behind the sprite,
// 2 = front half (below the centre on screen) just in front of it, so a ring can wrap around a wading body.
// iPos = (x, y, z, kind)  iShape = (centre x, centre y art px from the anchor, rx, ry)  iCol = rgba  iAnim = (rate, half, seed, growth)
const MARK_VS = `
attribute vec4 iPos; attribute vec4 iShape; attribute vec4 iCol; attribute vec4 iAnim;
uniform vec2 uViewport; uniform float uMarkK; uniform float uBias; uniform float uHD;
varying vec2 vD; varying vec4 vShape; varying vec4 vCol; varying vec4 vAnim; varying float vKind;
void main() {
  vec2 q = position.xy;
  vec4 va = viewMatrix * vec4(iPos.xyz, 1.0);
  vec4 ca = projectionMatrix * va;
  vec2 px = floor((ca.xy / ca.w * 0.5 + 0.5) * uViewport + 0.5);
  float R = floor(iShape.z * (1.0 + iAnim.w)) + 2.0 + 2.0 * uHD, RY = floor(iShape.w * (1.0 + iAnim.w)) + 2.0 + 2.0 * uHD;
  float y0 = iAnim.y > 0.5 && iAnim.y < 1.5 ? 0.0 : -RY, y1 = iAnim.y > 1.5 ? 0.0 : RY;
  vD = vec2(mix(-R, R, q.x), mix(y0, y1, q.y));
  vec2 c = uHD > 0.5 ? iShape.xy : floor(iShape.xy + 0.5);
  vec2 v = px + (c + vD) * uMarkK;
  vec4 cd = projectionMatrix * vec4(va.xy, va.z + uBias + (iAnim.y > 1.5 ? 0.6 : -0.18), 1.0);
  gl_Position = vec4((v / uViewport * 2.0 - 1.0) * cd.w, cd.z, cd.w);
  vShape = iShape; vCol = iCol; vAnim = iAnim; vKind = iPos.w;
}`;
const MARK_FS = `
uniform float uTime; uniform float uTag; uniform float uHD; uniform float uMarkK;
varying vec2 vD; varying vec4 vShape; varying vec4 vCol; varying vec4 vAnim; varying float vKind;
// 1 when pixel centre p (relative to the centre, which sits on a pixel corner) lies on a clean 1-px pixel ellipse
float onEll(vec2 p, float rx, float ry) {
  if (rx < 0.75 || ry < 0.75) return 0.0;
  vec2 a = abs(p);
  if (ry * ry * a.x <= rx * rx * a.y) { float d = a.y - ry * sqrt(max(0.0, 1.0 - a.x * a.x / (rx * rx))); return d > -0.5 && d <= 0.5 ? 1.0 : 0.0; }
  float d = a.x - rx * sqrt(max(0.0, 1.0 - a.y * a.y / (ry * ry))); return d > -0.5 && d <= 0.5 ? 1.0 : 0.0;
}
float bayer2(vec2 a) { a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
// HD: signed distance to the ellipse in SCREEN px (first-order), and an anti-aliased band [a, b] of it
float ellD(vec2 p, float rx, float ry) { vec2 q = p / vec2(rx, ry); float s = length(q); vec2 g = p / vec2(rx * rx, ry * ry) / max(s, 1e-4); return (s - 1.0) / max(length(g), 1e-4) * uMarkK; }
float band(float d, float a, float b) { return smoothstep(a - 0.6, a + 0.6, d) * (1.0 - smoothstep(b - 0.6, b + 0.6, d)); }
void main() {
  float rx = vShape.z, ry = vShape.w;
  vec3 col = vCol.rgb; float a = vCol.a;
  if (uHD > 0.5) {
    vec2 p = vD;
    if (vKind < 0.5) {                               // soft contact shadow / foot AO
      float e = length(p / vec2(rx, ry) * 0.88);
      a *= pow(clamp(1.0 - e, 0.0, 1.0), 1.3) * 1.45;
    } else if (vKind < 1.5) {                        // team ring: 2.2 px bright band outside a 1.6 px dark band
      float d = ellD(p, rx, ry), o = band(d, -2.2, 0.0), i = band(d, -3.8, -2.2);
      a *= max(o, i * 0.75); col = mix(col * 0.42, col, o / max(o + i, 1e-3));
    } else if (vKind < 2.5) {                        // foam ring
      a *= band(ellD(p, rx, ry), -1.6, 0.0);
    } else {                                         // ripples / pulse: expanding, fading rings
      float ph = fract(uTime * vAnim.x + vAnim.z), acc = 0.0;
      for (int j = 0; j < 2; j++) { float pj = fract(ph + float(j) * 0.5), gr = 1.0 + vAnim.w * pj; acc = max(acc, band(ellD(p, rx * gr, ry * gr), -1.4, 0.0) * (1.0 - pj)); }
      a *= acc;
    }
    if (a < 0.004) discard;
    gl_FragColor = vec4(col, a);
    #include <colorspace_fragment>
    return;
  }
  vec2 p = floor(vD) + 0.5;
  if (vKind < 0.5) {
    float e = (p.x * p.x) / (rx * rx) + (p.y * p.y) / (ry * ry);
    if (e > 1.0) discard;
    a *= e < 0.42 ? 1.0 : 0.6;
  } else if (vKind < 1.5) {
    float o = onEll(p, rx, ry), i = onEll(p, rx - 1.0, ry - 1.0);
    if (o < 0.5 && i < 0.5) discard;
    if (o < 0.5) col *= 0.42;
  } else if (vKind < 2.5) {
    if (onEll(p, rx, ry) < 0.5) discard;
  } else {
    float ph = fract(uTime * vAnim.x + vAnim.z), hit = 0.0, fade = 0.0;
    for (int j = 0; j < 2; j++) {
      float pj = fract(ph + float(j) * 0.5), gr = 1.0 + vAnim.w * pj;
      if (hit < 0.5 && onEll(p, rx * gr, ry * gr) > 0.5) { hit = 1.0; fade = pj; }
    }
    if (hit < 0.5 || bayer4(gl_FragCoord.xy) < fade * 1.05 - 0.05) discard;
  }
  gl_FragColor = vec4(col, a);
  #include <colorspace_fragment>
}`;

class Quads {
  constructor(T, parent, mat, layout, name) {
    this.T = T; this.layout = layout; this.cap = 0; this.count = 0; this.arrays = {};
    const geo = this.geo = new T.InstancedBufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0], 3));
    geo.setIndex([0, 1, 2, 0, 2, 3]);
    geo.boundingSphere = new T.Sphere(new T.Vector3(), 1e5);
    this.mesh = new T.Mesh(geo, mat); this.mesh.frustumCulled = false; this.mesh.name = name; parent.add(this.mesh);
    this.ensure(64);
  }
  ensure(n) {
    if (n <= this.cap) return; let c = Math.max(16, this.cap); while (c < n) c *= 2;
    for (const k in this.layout) {
      const a = new Float32Array(c * this.layout[k]); if (this.arrays[k]) a.set(this.arrays[k]); this.arrays[k] = a;
      this.geo.setAttribute(k, new this.T.InstancedBufferAttribute(a, this.layout[k]).setUsage(this.T.DynamicDrawUsage));
    }
    this.cap = c;
  }
  begin() { this.count = 0; }
  push() { if (this.count >= this.cap) this.ensure(this.count + 1); return this.count++; }
  end() { this.geo.instanceCount = this.count; this.mesh.visible = this.count > 0; for (const k in this.layout) this.geo.attributes[k].needsUpdate = true; }
  dispose() { this.mesh.removeFromParent(); this.geo.dispose(); this.mesh.material.dispose(); }
}

/**
 * Paged shelf-packed atlas: up to MAX_PAGES lazily created PAGE x PAGE DataTextures with row-range partial uploads.
 * When every page is full, the least recently drawn page (never one drawn this frame) is evicted for on-demand frames;
 * background prewarm never evicts. `stats()` reports pages / fill / frames / evictions.
 */
class PagedAtlas {
  constructor(T, onPage, onEvict) {
    this.T = T; this.pages = []; this.frames = new Map(); this.evictions = 0; this.onPage = onPage; this.onEvict = onEvict;
  }
  newPage() {
    const T = this.T, data = new Uint8Array(PAGE * PAGE * 4);
    const tex = new T.DataTexture(data, PAGE, PAGE, T.RGBAFormat, T.UnsignedByteType);
    tex.magFilter = tex.minFilter = T.NearestFilter; tex.generateMipmaps = false; tex.flipY = false;
    tex.colorSpace = T.NoColorSpace; tex.needsUpdate = true;   // raw data (material, tone, normal), never colour-decoded
    const p = { i: this.pages.length, data, tex, shelves: [], top: 0, dirty: new Set(), rects: [], gpuReady: false, used: 0, keys: new Set(), ids: new Set() };
    // [perf] a never-uploaded view of the same bytes: the source of one sub-rectangle texSubImage2D per new frame
    p.view = new T.DataTexture(data, PAGE, PAGE, T.RGBAFormat, T.UnsignedByteType);
    tex.onUpdate = () => { p.gpuReady = true; };   // three uploaded the whole page: from now on partial row ranges
    this.pages.push(p);
    if (this.onPage) this.onPage(p);
    return p;
  }
  placeIn(p, w, h) {
    for (const s of p.shelves) if (h <= s.h && h >= s.h - 10 && s.x + w + PAD <= PAGE) { const r = { x: s.x, y: s.y }; s.x += w + PAD; return r; }
    if (p.top + h + PAD > PAGE || w + PAD > PAGE) return null;
    const s = { y: p.top, h, x: 0 }; p.shelves.push(s); p.top += h + PAD;
    const r = { x: s.x, y: s.y }; s.x += w + PAD; return r;
  }
  clearPage(p) {
    for (const k of p.keys) this.frames.delete(k);
    const ids = [...p.ids];
    p.keys.clear(); p.ids.clear(); p.data.fill(0); p.shelves = []; p.top = 0; p.dirty.clear(); p.rects.length = 0;
    p.gpuReady = false; p.tex.clearUpdateRanges(); p.tex.needsUpdate = true;
    this.evictions++;
    if (typeof console !== 'undefined') console.info('[mt-sprites] atlas page ' + p.i + ' evicted (#' + this.evictions + ', ' + ids.length + ' sprite ids)');
    if (this.onEvict) this.onEvict(ids);
  }
  /** add a trimmed RGBA frame; `evictBefore` = frame number: pages last used before it may be evicted (0 = never) */
  alias(key, F) { this.frames.set(key, F); this.pages[F.page].keys.add(key); }
  add(key, id, b, evictBefore = 0, dens = 32) {
    let p = null, r = null;
    for (const q of this.pages) { r = this.placeIn(q, b.w, b.h); if (r) { p = q; break; } }
    if (!r && this.pages.length < MAX_PAGES) { p = this.newPage(); r = this.placeIn(p, b.w, b.h); }
    if (!r && evictBefore > 0) {
      let lru = null; for (const q of this.pages) if (q.used < evictBefore && (!lru || q.used < lru.used)) lru = q;
      if (lru) { this.clearPage(lru); p = lru; r = this.placeIn(p, b.w, b.h); }
    }
    if (!r) return null;
    for (let k = 0; k < b.h; k++) {
      const row = r.y + (b.h - 1 - k);                     // DataTexture row 0 = bottom (v = 0)
      p.data.set(b.data.subarray(k * b.w * 4, (k + 1) * b.w * 4), (row * PAGE + r.x) * 4);
      p.dirty.add(row);
    }
    p.rects.push(r.x, r.y, b.w, b.h);
    const f = { page: p.i, x: r.x, y: r.y, u0: r.x / PAGE, v0: r.y / PAGE, du: b.w / PAGE, dv: b.h / PAGE, w: b.w, h: b.h, ax: b.ax, ay: b.ay, dens };
    this.frames.set(key, f); p.keys.add(key); p.ids.add(id);
    return f;
  }
  /** silhouette extent of art row `k` (0 = top) of a frame: [x0, x1) or null */
  rowSpan(F, k) {
    if (k < 0 || k >= F.h) return null;
    const p = this.pages[F.page], row = F.y + (F.h - 1 - k), o = (row * PAGE + F.x) * 4;
    let x0 = -1, x1 = -1;
    for (let x = 0; x < F.w; x++) if (p.data[o + x * 4 + 2]) { if (x0 < 0) x0 = x; x1 = x + 1; }
    return x0 < 0 ? null : [x0, x1];
  }
  /** upload what changed. [perf] With the renderer: ONE texSubImage2D per new frame rectangle (copyTextureToTexture from
   *  the page's CPU view) — three's updateRanges path issues one call per dirty row at the full 2048-px page width
   *  (a 64-row frame = 64 calls / 512 KB instead of 1 call / ~15 KB; Safari pays per call). */
  flush(renderer) {
    const T = this.T;
    for (const p of this.pages) {
      if (!p.dirty.size) continue;
      if (p.gpuReady && renderer && renderer.copyTextureToTexture) {
        const R = p.rects, box = this.box || (this.box = new T.Box2(new T.Vector2(), new T.Vector2())), at = this.at || (this.at = new T.Vector2());
        try {
          for (let i = 0; i < R.length; i += 4) {
            box.min.set(R[i], R[i + 1]); box.max.set(R[i] + R[i + 2], R[i + 1] + R[i + 3]); at.set(R[i], R[i + 1]);
            renderer.copyTextureToTexture(p.view, p.tex, box, at);
          }
          p.dirty.clear(); R.length = 0; continue;
        } catch (e) { this.noCopy = true; console.warn('[mt-sprites] sub-rect upload failed, row ranges', e); }
      }
      if (p.gpuReady) for (const row of p.dirty) p.tex.addUpdateRange(row * PAGE * 4, PAGE * 4);
      else p.tex.clearUpdateRanges();   // full upload still pending: it will carry every row
      p.dirty.clear(); p.rects.length = 0; p.tex.needsUpdate = true;
    }
  }
  reset() { for (const p of this.pages) if (p.keys.size) this.clearPage(p); }
  stats() {
    let used = 0; for (const p of this.pages) used += p.top;
    return { pages: this.pages.length, maxPages: MAX_PAGES, pageSize: PAGE, frames: this.frames.size, fillPct: +(100 * used / (PAGE * MAX_PAGES)).toFixed(1), cpuMB: +(this.pages.length * PAGE * PAGE * 4 / 1048576).toFixed(1), evictions: this.evictions };
  }
  // compatibility with older probes (tools/mt-perf.cjs): page 0 texture, total bytes, fill as rows of one page-height
  get tex() { return this.pages[0] ? this.pages[0].tex : { image: { width: PAGE, height: PAGE } }; }
  get data() { return { byteLength: this.pages.length * PAGE * PAGE * 4 }; }
  get top() { let used = 0; for (const p of this.pages) used += p.top; return used / MAX_PAGES; }
}

export class SpriteSystem {
  constructor(ctx) {
    const T = this.T = ctx.THREE; this.ctx = ctx;
    this.group = new T.Group(); this.group.name = 'mt-sprites'; ctx.scene.add(this.group);
    const placeholder = new T.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1);
    placeholder.needsUpdate = true;
    this.uniforms = {
      uMap0: { value: placeholder }, uMap1: { value: placeholder }, uMap2: { value: placeholder }, uMap3: { value: placeholder }, uMap4: { value: placeholder }, uMap5: { value: placeholder },
      uViewport: { value: new T.Vector2(1, 1) }, uK: { value: 1 }, uBias: { value: 0.9 }, uPPM: { value: PPM }, uTexel: { value: new T.Vector2(1 / PAGE, 1 / PAGE) },
      uShadowMap: { value: placeholder }, uShadowMatrix: { value: new T.Matrix4() }, uShadowOn: { value: 0 }, uShadowTexel: { value: new T.Vector2(1 / 2048, 1 / 2048) }, uRev: { value: 0 },
      uSunCol: { value: new T.Vector3(1.05, 1.0, 0.94) }, uShadeCol: { value: new T.Vector3(0.6, 0.66, 0.84) }, uSunUv: { value: new T.Vector2(-1 / PAGE, 1 / PAGE) },
      uXray: { value: 0 }, uPal: { value: null }, uPalRows: { value: 1024 }, uSunView: { value: new T.Vector3(-0.4, 0.7, 0.5) }, uGlow: { value: 0.9 }, uTime: { value: 0 }, uDyn: { value: 1 },
      uTag: { value: 0.75 }, uLift: { value: 1.1 }, uPxM: { value: 64 }, uHD: { value: 0 }, uMarkK: { value: 1 }, uWaterCol: { value: new T.Vector3(0.025, 0.15, 0.33) }, uFoamCol: { value: new T.Vector3(0.78, 0.95, 1.0) },
    };
    this.atlas = new PagedAtlas(T, (p) => { this.uniforms['uMap' + p.i].value = p.tex; }, (ids) => { for (const id of ids) this.built.delete(id); });
    // palette texture: 8 tones x 1024 rows; each art id gets rows [base, base + materials]
    this.palData = new Uint8Array(8 * 1024 * 4);
    this.palTex = new T.DataTexture(this.palData, 8, 1024, T.RGBAFormat, T.UnsignedByteType);
    this.palTex.magFilter = this.palTex.minFilter = T.NearestFilter; this.palTex.generateMipmaps = false; this.palTex.colorSpace = T.SRGBColorSpace; this.palTex.needsUpdate = true;
    this.uniforms.uPal.value = this.palTex;
    this.palBase = new Map(); this.palRows = 1;
    const sm = new T.ShaderMaterial({ vertexShader: SPRITE_VS, fragmentShader: SPRITE_FS, side: T.DoubleSide, uniforms: this.uniforms });
    this.sprites = new Quads(T, this.group, sm, { iPos: 4, iSize: 4, iUv: 4, iMisc: 4, iTint: 4, iExtra: 4, iWade: 4 }, 'mt-sprite-batch');
    this.sprites.mesh.renderOrder = 3;
    // x-ray silhouettes (shares the instanced geometry)
    const xu = { ...this.uniforms, uXray: { value: 1 }, uTeamCols: { value: [new T.Vector3(0.9, 0.9, 0.9), new T.Vector3(0.35, 1, 0.5), new T.Vector3(0.3, 0.62, 1), new T.Vector3(1, 0.32, 0.26), new T.Vector3(1, 0.8, 0.3)] } };
    const keepTag = { blending: T.CustomBlending, blendEquation: T.AddEquation, blendSrc: T.SrcAlphaFactor, blendDst: T.OneMinusSrcAlphaFactor, blendSrcAlpha: T.ZeroFactor, blendDstAlpha: T.OneFactor };
    const xm = new T.ShaderMaterial({ vertexShader: SPRITE_VS, fragmentShader: XRAY_FS, side: T.DoubleSide, uniforms: xu, transparent: true, depthWrite: false, depthFunc: T.GreaterDepth, ...keepTag });
    this.xray = new T.Mesh(this.sprites.geo, xm); this.xray.frustumCulled = false; this.xray.name = 'mt-sprite-xray'; this.xray.renderOrder = 6; this.group.add(this.xray);
    // sun-projected silhouette shadows (shares the instanced geometry)
    const cu = { ...this.uniforms, uSunDir: { value: new T.Vector3(-0.6, 0.7, -0.36) }, uCamRight: { value: new T.Vector3(1, 0, 0) }, uCastCol: { value: new T.Vector4(0.06, 0.08, 0.16, 0.34) } };
    this.castUniforms = cu;
    // blended layers keep the destination alpha: it carries the env's material tags (0.75 sprite, 0.5 foliage)
    const cm = new T.ShaderMaterial({ vertexShader: CAST_VS, fragmentShader: CAST_FS, side: T.DoubleSide, uniforms: cu, transparent: true, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4, ...keepTag });
    this.cast = new T.Mesh(this.sprites.geo, cm); this.cast.frustumCulled = false; this.cast.name = 'mt-sprite-cast'; this.cast.renderOrder = 2; this.group.add(this.cast);
    // screen-space pixel marks (contact shadows, team rings, foam rings, ripples): transparent, after the water surface
    const mm = new T.ShaderMaterial({ vertexShader: MARK_VS, fragmentShader: MARK_FS, uniforms: this.uniforms, transparent: true, depthWrite: false, side: T.DoubleSide, ...keepTag });
    this.marks = new Quads(T, this.group, mm, { iPos: 4, iShape: 4, iCol: 4, iAnim: 4 }, 'mt-sprite-marks');
    this.marks.mesh.renderOrder = 7;
    this.views = new Map(); this.lastWorld = null; this.frameNo = 0;
    this.built = new Set(); this.jobs = new Map(); this.queue = []; this.prewarmFull = false;
    this.transients = [];
    this.colors = { ally: [0.3, 0.62, 1.0], enemy: [1.0, 0.32, 0.26], wild: [1.0, 0.8, 0.3], self: [0.42, 1.0, 0.55] };
    this.tmp = { a: new T.Vector3(), b: new T.Vector3(), d: new T.Vector3(), up: new T.Vector3(), vp: new T.Vector2() };
    this.spans = new Map();   // frame key + row -> silhouette span (waterline foam ring width)
    this.vpm = 19.7;          // art px per vertical world metre on screen (camera pitch), refreshed per frame
    this.dens = PPM; this.prevDens = null; this.hd = false; this.pxPerM = 64; this.upY = 0.6;   // art density (art px / m)
    // prewarm everything in the background (time-sliced): all monster forms, minions, trainers, orb
    this.stepAvg = 6; this.densReady = false; this.idleId = 0; this.disposed = false;
    this.initWorker();
    for (const id of this.prewarmOrder()) this.enqueue(id);
    this.stats = { built: 0, buildMs: 0, onDemand: 0 };
    /** Render-only per-unit overrides for VFX: unitId -> {flash 0..1, scale, hidden, hideUntil, until, tint:[r,g,b,amount]} */
    this.fx = new Map();
    this.demandBudget = 0;
  }

  /** VFX API: set / merge a render-only override for a unit (see `fx`). `until` (sim time) auto-expires it. */
  setOverride(unitId, o) { const cur = this.fx.get(unitId); this.fx.set(unitId, cur ? Object.assign(cur, o) : { ...o }); return this.fx.get(unitId); }
  clearOverride(unitId) { this.fx.delete(unitId); }

  // ---- lazy frame building ----------------------------------------------------------------
  geoOf(id) { const S = SPECIES_ART[id]; return S && S.variant ? S.baseId + '_' + (S._def.variants ? S._def.variants[0] : '') : id; }
  /** default raster-size multiplier of an art id (trainers + juveniles a little larger, real re-raster) */
  sizeOf(S) { return S.kind === 'trainer' ? SIZE.trainer : S.kind !== 'monster' ? 1 : S.stage === 0 ? SIZE.juvenile : S.stage === 1 ? SIZE.evolved : SIZE.final; }
  keyOf(id, view, anim, fi, rs, dens = this.dens) { const S = SPECIES_ART[id]; return this.geoOf(id) + (S && rs !== this.sizeOf(S) ? '@' + rs : '') + (dens !== PPM ? '#' + dens : '') + '/' + view + '/' + anim + '/' + fi; }
  /** HD: a new art density (window resize): new frames are baked at it, older frames stay usable until replaced */
  setDensity(D) {
    if (D === this.dens) return;
    this.prevDens = this.dens; this.dens = D;
    this.built.clear(); this.jobs.clear(); this.queue.length = 0; this.prewarmFull = false; this.spans.clear();
    if (this.bw) { this.bwSpecs.clear(); this.bwOut.clear(); }   // in-flight results of the old density are dropped on arrival
    for (const id of this.prewarmOrder()) this.enqueue(id);
  }
  /** palette base row for an art id (team variants = different rows over the same frames) */
  palOf(id) {
    let b = this.palBase.get(id);
    if (b !== undefined) return b;
    const pal = spritePalette(id), rows = Math.ceil(pal.length / 8);
    if (this.palRows + rows > 1024) return 0;
    b = this.palRows; this.palRows += rows;
    for (let k = 0; k < pal.length; k++) {
      const h = pal[k]; if (!h) continue;
      const n = parseInt(h.slice(1), 16), o = ((b + (k >> 3)) * 8 + (k & 7)) * 4;
      this.palData[o] = (n >> 16) & 255; this.palData[o + 1] = (n >> 8) & 255; this.palData[o + 2] = n & 255; this.palData[o + 3] = 255;
    }
    this.palTex.needsUpdate = true;
    this.palBase.set(id, b);
    return b;
  }
  *frameJob(id) {
    const S = SPECIES_ART[id], rs = this.sizeOf(S), D = this.dens;
    for (const view of S.views) for (const anim of Object.keys(S.anims)) for (let i = 0; i < S.anims[anim].n; i++) {
      if (D !== this.dens) return 'stale';
      const key = this.keyOf(id, view, anim, i, rs, D);
      if (this.atlas.frames.has(key)) continue;
      const b = renderSpriteData(id, view, anim, i, { scale: ART_SCALE * rs * D / PPM, noFx: true, pool: true });
      const F = this.atlas.add(key, id, b, 0, D);
      if (!F) { this.prewarmFull = true; return 'full'; }   // prewarm never evicts
      this.aliasIdle(id, view, anim, i, rs, D, F);
      yield;
    }
  }
  // ---- [perf] background prewarm in a module worker (sprites.worker.js): the main thread only copies finished frames
  // into the atlas (1 per frame in a match, 4 otherwise); no raster work in game frames. Falls back to the
  // time-sliced main-thread pump when Workers are unavailable or the worker fails. ?spriteworker=0 disables it.
  initWorker() {
    this.bw = null;
    let off = false; try { off = new URLSearchParams(location.search).get('spriteworker') === '0'; } catch (e) { /* no location */ }
    if (off || typeof Worker === 'undefined') return;
    try { this.bw = new Worker(new URL('./sprites.worker.js', import.meta.url), { type: 'module' }); } catch (e) { this.bw = null; return; }
    this.bwFlight = new Map();   // key -> {id, view, anim, i, rs, D}
    this.bwSpecs = new Map();    // id -> frame spec iterator
    this.bwOut = new Map();      // id -> {n: frames in flight, done: iterator exhausted}
    this.bwDone = [];            // finished frames waiting for an atlas copy
    this.bwStats = { posted: 0, added: 0, dropped: 0, ms: 0, errors: 0, urgent: 0 };
    this.bwUrgent = 0;           // urgent (visible-now) frames in flight
    this.bw.onmessage = (e) => { const j = this.bwFlight.get(e.data.key); if (j && j.urgent) this.bwDone.unshift(e.data); else this.bwDone.push(e.data); };
    this.bw.onerror = (e) => { if (e && e.preventDefault) e.preventDefault(); this.workerFailed(e && e.message); };
  }
  workerFailed(msg) {
    if (!this.bw) return;
    console.warn('[mt-sprites] bake worker unavailable (' + (msg || 'error') + '): main-thread prewarm');
    try { this.bw.terminate(); } catch (e) { /* gone */ }
    this.bw = null; this.bwDone = []; this.bwUrgent = 0; this.jobs.clear(); this.queue.length = 0;
    for (const id of this.prewarmOrder()) if (!this.built.has(id)) this.enqueue(id);
  }
  *frameSpecs(id) {
    const S = SPECIES_ART[id], rs = this.sizeOf(S), D = this.dens;
    for (const view of S.views) for (const anim of Object.keys(S.anims)) for (let i = 0; i < S.anims[anim].n; i++) {
      if (D !== this.dens) return 'stale';
      const key = this.keyOf(id, view, anim, i, rs, D);
      if (this.atlas.frames.has(key) || this.bwFlight.has(key)) continue;
      yield { key, id, view, anim, i, rs, D, scale: ART_SCALE * rs * D / PPM };
    }
  }
  urgent(key, id, view, anim, i, rs, D) {
    const j = { key, id, view, anim, i, rs, D, scale: ART_SCALE * rs * D / PPM, o: { n: 1, done: true }, urgent: true, at: this.frameNo };
    this.bwFlight.set(key, j); this.bwUrgent++; this.bwStats.urgent++;
    this.bw.postMessage({ key, id, view, anim, i, scale: j.scale });
  }
  bwFinish(id) { const o = this.bwOut.get(id); if (o && o.done && o.n <= 0) { this.bwOut.delete(id); this.finishJob(id); } }
  feedWorker() {
    while (this.bw && this.bwFlight.size - this.bwUrgent < 4 && this.queue.length && !this.prewarmFull) {
      const id = this.queue[0];
      let it = this.bwSpecs.get(id); if (!it) this.bwSpecs.set(id, it = this.frameSpecs(id));
      let o = this.bwOut.get(id); if (!o) this.bwOut.set(id, o = { n: 0, done: false });
      const r = it.next();
      if (r.done) {
        this.bwSpecs.delete(id); this.queue.shift();
        if (r.value === 'stale') { this.jobs.delete(id); this.bwOut.delete(id); continue; }
        o.done = true; this.bwFinish(id); continue;
      }
      const j = r.value; j.o = o; o.n++;     // the counter travels with the spec (a stale result never touches a newer job)
      this.bwFlight.set(j.key, j); this.bwStats.posted++;
      this.bw.postMessage({ key: j.key, id: j.id, view: j.view, anim: j.anim, i: j.i, scale: j.scale });
    }
  }
  drainWorker() {
    // in a match each copied frame also means a row-range texture upload at flush(): 1 per frame (+ 1 ms budget);
    // lobby / loading / menus take 4
    const t0 = performance.now(), app = this.ctx.app, inGame = !app || app.state === 'game', cap = inGame ? 1 : 4, budget = inGame ? 1 : 3;
    for (let n = 0; this.bwDone.length && (n < cap || (this.bwFlight.get(this.bwDone[0].key) || {}).urgent) && performance.now() - t0 < budget;) {
      const m = this.bwDone.shift(), j = this.bwFlight.get(m.key);
      this.bwFlight.delete(m.key);
      if (!j) continue;
      if (j.urgent) this.bwUrgent--;
      const o = j.o; o.n--;
      if (m.error) { this.bwStats.errors++; if (this.bwStats.errors > 20) { this.workerFailed(m.error); return; } }
      else if (j.D === this.dens && !this.atlas.frames.has(m.key)) {
        // visible-now frames may evict like the synchronous on-demand path; prewarm never evicts
        const F = this.atlas.add(m.key, j.id, { w: m.w, h: m.h, ax: m.ax, ay: m.ay, data: new Uint8Array(m.buf) }, j.urgent ? this.frameNo : 0, j.D);
        if (!F) { if (!j.urgent) { this.prewarmFull = true; this.queue.length = 0; this.bwSpecs.clear(); } }
        else { this.aliasIdle(j.id, j.view, j.anim, j.i, j.rs, j.D, F); this.bwStats.added++; this.bwStats.ms += m.ms || 0; if (!j.urgent) n++; }
      } else this.bwStats.dropped++;
      if (this.bwOut.get(j.id) === o) this.bwFinish(j.id);
    }
  }
  enqueue(id) { if (!this.prewarmFull && !this.built.has(id) && !this.jobs.has(id) && SPECIES_ART[id]) { this.jobs.set(id, this.frameJob(id)); this.queue.push(id); if (this.stepAvg && !(this.bw && this.densReady)) this.scheduleIdle(); } }
  /** Make sure `id` is queued, with priority (it is on screen). Frames themselves are baked on demand. */
  prioritize(id) {
    if (this.built.has(id) || !SPECIES_ART[id]) return;
    this.enqueue(id);
    const i = this.queue.indexOf(id); if (i > 0) { this.queue.splice(i, 1); this.queue.unshift(id); }
  }
  /** Frame for drawing now: bakes just this one frame synchronously if missing (bounded per frame), else falls
   *  back to any already-baked frame of the same sprite so a unit never pops in late or stalls the frame. */
  frameFor(id, view, anim, fi, rs) {
    const S = SPECIES_ART[id]; if (!S) return null;
    if (rs == null) rs = this.sizeOf(S);
    const D = this.dens, fr = this.atlas.frames, key = this.keyOf(id, view, anim, fi, rs, D);
    let F = fr.get(key);
    // [perf] with the bake worker, a visible frame that is not baked yet is requested from the worker at high priority and
    // a fallback frame of the same sprite (below) shows for the 1-3 frames it takes — no raster work in the game frame.
    // Synchronous baking only when the worker is gone, stuck (> 30 frames), or nothing of this sprite exists yet.
    const inFlight = this.bw && this.bwFlight.get(key);
    if (!F && this.bw && !inFlight && this.bwUrgent < 12) this.urgent(key, id, view, anim, fi, rs, D);
    else if (!F && this.demandBudget > 0 && (!this.bw || (inFlight && this.frameNo - inFlight.at > 30) || (!inFlight && this.bwUrgent >= 12))) {
      const t0 = performance.now();
      const b = renderSpriteData(id, view, anim, fi, { scale: ART_SCALE * rs * D / PPM, noFx: true, pool: true });
      F = this.atlas.add(key, id, b, this.frameNo, D);
      if (F) this.aliasIdle(id, view, anim, fi, rs, D, F);
      const dt = performance.now() - t0;
      this.demandBudget -= dt; this.stats.buildMs += dt; this.stats.onDemand++;
    }
    const P = this.prevDens;
    if (!F && P) F = fr.get(this.keyOf(id, view, anim, fi, rs, P));   // previous density (after a resize) until re-baked
    if (!F) F = fr.get(this.keyOf(id, view, 'idle', 0, rs, D)) || fr.get(this.keyOf(id, view, anim, 0, rs, D)) || (P && fr.get(this.keyOf(id, view, 'idle', 0, rs, P))) || null;
    if (!F) {
      // nothing of this sprite exists yet: bake its idle frame now, over budget, so a visible unit is never invisible
      const t0 = performance.now(), k0 = this.keyOf(id, view, 'idle', 0, rs, D);
      F = this.atlas.add(k0, id, renderSpriteData(id, view, 'idle', 0, { scale: ART_SCALE * rs * D / PPM, noFx: true, pool: true }), this.frameNo, D);
      if (F) this.aliasIdle(id, view, 'idle', 0, rs, D, F);
      const dt = performance.now() - t0; this.demandBudget -= dt; this.stats.buildMs += dt; this.stats.onDemand++;
    }
    if (F) this.atlas.pages[F.page].used = this.frameNo;
    return F;
  }
  /** plain-key alias of idle/0 at a non-default density (HUD nameplates look frames up by the plain key) */
  aliasIdle(id, view, anim, fi, rs, D, F) { if (anim === 'idle' && fi === 0 && D !== PPM && rs === this.sizeOf(SPECIES_ART[id])) this.atlas.alias(this.geoOf(id) + '/' + view + '/idle/0', F); }
  ensure(id) { this.prioritize(id); return !!SPECIES_ART[id]; }
  finishJob(id) { this.jobs.delete(id); this.built.add(id); this.stats.built++; const i = this.queue.indexOf(id); if (i >= 0) this.queue.splice(i, 1); }
  /** one background bake step (one frame); keeps a running average of its cost */
  pumpStep() {
    const id = this.queue[0], job = this.jobs.get(id);
    if (!job) { this.queue.shift(); return; }
    const t0 = performance.now(), r = job.next(), dt = performance.now() - t0;
    this.stats.buildMs += dt;
    if (!r.done) this.stepAvg = this.stepAvg * 0.85 + dt * 0.15;
    else if (r.value === 'full') { this.jobs.clear(); this.queue.length = 0; }   // atlas full: on-demand only from now on
    else if (r.value === 'stale') { this.jobs.delete(id); this.queue.shift(); }
    else this.finishJob(id);
  }
  /** in-frame prewarm: at most ONE step per frame, and only when the running per-step cost fits the budget */
  pump(budgetMs) {
    if (this.bw) { this.drainWorker(); if (this.densReady) this.feedWorker(); return; }
    if (this.queue.length && this.stepAvg <= budgetMs) this.pumpStep();
  }
  /** background prewarm in idle time: the lobby / loading screen (bulk) and spare time between game frames */
  idlePump(deadline) {
    this.idleId = 0;
    if (this.disposed) return;
    if (voxelStyle(typeof window !== 'undefined' ? window.__moba : null)) return;   // [voxel] no sprite baking for voxel units
    if (!this.densReady) this.predictDensity();
    if (this.densReady && this.bw) { this.drainWorker(); this.feedWorker(); }
    else if (this.densReady) {
      const t0 = performance.now(), inGame = t0 - (this.lastUpdateMs || -1e9) < 400;
      const left = () => (deadline ? deadline.timeRemaining() : (inGame ? 0 : 14 - (performance.now() - t0)));
      for (let n = 0; this.queue.length && n < 64 && left() > this.stepAvg * 1.15; n++) this.pumpStep();
    }
    if ((this.queue.length || !this.densReady) && !(this.bw && this.densReady)) this.scheduleIdle();
  }
  scheduleIdle() {
    if (this.idleId || this.disposed) return;
    const ric = typeof requestIdleCallback === 'function' ? requestIdleCallback : null;
    this.idleId = ric ? ric((d) => this.idlePump(d), { timeout: 300 }) : setTimeout(() => this.idlePump(null), 40);
  }
  /** prewarm order: what every match shows first (trainers, minions, orb, juveniles), the Ancient Galeclaw last */
  prewarmOrder() {
    const rank = (S) => (S.kind === 'trainer' ? 0 : S.kind === 'minion' ? 1 : S.kind === 'item' || S.id === 'orb' ? 2 : S.kind === 'boss' ? 9 : 3 + (S.stage || 0));
    return Object.keys(SPECIES_ART).sort((a, b) => rank(SPECIES_ART[a]) - rank(SPECIES_ART[b]));
  }
  /** HD art density for a zoom-1 screen px per metre (whole-number screen px per art px, exact world size) */
  densFor(base) { const kb = Math.max(1, Math.round(base / HD_PPM)); return Math.round(base / kb * 10) / 10; }
  /** zoom-1 and current screen px per metre at the focus, from the camera rig (null when unavailable) */
  rigPxPerM(H) {
    const app = typeof window !== 'undefined' ? window.__moba : null;
    const pipe = this.ctx.pipeline || (app && app.pipeline), rig = pipe && pipe.cameraRig, cam = this.ctx.camera;
    if (!rig || !(rig.distance > 0) || !cam || !(H > 0)) return null;
    const t = 2 * Math.tan((cam.fov || rig.baseFov || 26) * Math.PI / 360);
    return { base: H / (rig.distance * (rig.aspectScale || 1) * t), now: rig.viewDist > 0 ? H / (rig.viewDist * t) : 0 };
  }
  /** before the first game frame (lobby / loading): guess the HD density from the camera rig so the prewarm bakes
   *  exactly the frames the match will use */
  predictDensity() {
    const app = typeof window !== 'undefined' ? window.__moba : null;
    if (app && (app.mtPixel || (app.params && app.params.get && app.params.get('pixel') === '1'))) { this.densReady = true; return; }
    const gl = this.ctx.renderer && this.ctx.renderer.getContext && this.ctx.renderer.getContext();
    // [perf] the scene-target height (dynamic resolution renders the scene below the canvas): the density is chosen there
    const pipe = this.ctx.pipeline || (app && app.pipeline), post = pipe && pipe.post;
    let H = gl ? gl.drawingBufferHeight : 0;
    if (post && !post.pixelMode) H = post.sceneRT && post.sceneRT.height > 0 ? post.sceneRT.height : Math.round(H * (post.sceneScaleFor ? post.sceneScaleFor(post.cfg, post.pixelRatio) : 1));
    const R = this.rigPxPerM(H);
    if (!R) return;
    this.setDensity(this.densFor(R.base)); this.densReady = true;
  }

  // ---- unit -> art -------------------------------------------------------------------------
  artOf(u) {
    if (u.mtMon) return u.mtMon.capturing ? 'orb' : u.mtMon.form;
    if (u.mtTrainer) { const look = ['attack', 'healing', 'magic'].includes(u.mtLook) ? u.mtLook : u.mtTrainer.spec; return 'trainer_' + look + '_' + teamName(u.team); }
    if (u.kind === KIND.MONSTER && u.epic && u.camp === 'drake') return 'galeclaw';
    if (u.kind === KIND.MINION && u.mtSprite) { const b = MINION_ART[u.subtype] || 'grubling'; return b + '_' + teamName(u.team); }
    return null;
  }

  // screen-space facing -> view + flip (with hysteresis so sprites don't flicker)
  orient(u, v, id, S) {
    const c = this.cam;
    const fx = Math.cos(u.facing || 0), fz = Math.sin(u.facing || 0);
    const sx = fx * c.rx + fz * c.rz, sy = fx * c.fx + fz * c.fz;   // + = screen right, + = away from camera
    if (S.kind === 'trainer') {
      let d = v.dir || 'down';
      if (Math.abs(sx) > Math.abs(sy) + 0.15) d = sx > 0 ? 'right' : 'left';
      else if (Math.abs(sy) > Math.abs(sx) + 0.15) d = sy > 0 ? 'up' : 'down';
      v.dir = d;
      return d === 'right' ? ['left', 1] : [d, 0];
    }
    if (S.views.length === 1) return [S.views[0], 0];
    if (sy > 0.3) v.back = true; else if (sy < -0.1) v.back = false;
    if (sx > 0.12) v.right = true; else if (sx < -0.12) v.right = false;
    return v.back ? ['back', v.right ? 0 : 1] : ['front', v.right ? 1 : 0];
  }

  pickAnim(u, v, S, now) {
    const A = S.anims, has = (a) => !!A[a];
    const loopF = (a, t, rate = 1) => Math.floor(t * A[a].fps * rate) % A[a].n;
    const onceF = (a, t) => Math.min(A[a].n - 1, Math.max(0, Math.floor(t * A[a].fps)));
    if (S.id === 'orb' || S.baseId === 'orb') {
      if (now - v.wobT < 0.5) return ['wobble', onceF('wobble', (now - v.wobT) * 1.6)];
      if (now - v.capT < 0.25) return ['open', A.open.n - 1 - onceF('open', now - v.capT)];
      return ['idle', 0];
    }
    if (!u.alive) {
      const a = has('faint') ? 'faint' : has('defeated') ? 'defeated' : 'hurt';
      return [a, onceF(a, now - (u.deathT || now))];
    }
    if (has('throw') && now - v.throwT < A.throw.n / A.throw.fps) return ['throw', onceF('throw', now - v.throwT)];
    if (now - v.hitT < 0.3 && has('hurt')) return ['hurt', onceF('hurt', Math.max(0, now - v.hitT - 0.07))];   // 70 ms hit-stop on the impact frame
    if (has('cast') && u.castT != null && now - u.castT >= 0 && now - u.castT < 0.55) return ['cast', loopF('cast', now - u.castT)];
    if (has('attack') && v.atkT > -50) {
      const t = now - v.atkT, W = Math.max(0.12, Math.min(0.6, v.atkWind || 0.25)), n = A.attack.n, hit = A.attack.hit ?? 3;
      if (t >= 0 && t < W + (n - hit) / A.attack.fps) {
        const f = t < W ? Math.floor(t / W * hit) : hit + Math.floor((t - W) * A.attack.fps);
        return ['attack', Math.min(n - 1, f)];
      }
    }
    if (u.moving && has('walk')) return ['walk', loopF('walk', now + u.id * 0.37, Math.max(0.7, Math.min(1.6, (u.speedNow || 3.5) / 3.5)))];
    // eyes open by default; a ~120 ms blink every 3-5 s, staggered per unit (never part of the idle loop)
    if (has('blink')) { const per = 3 + 2 * ((u.id * 0.618034) % 1); if ((now + u.id * 1.37) % per < 0.12) return ['blink', 0]; }
    return ['idle', loopF('idle', now + u.id * 0.53)];
  }

  // camera basis + on-screen texel size (quantised to whole pixels when magnified)
  updateCamera(app) {
    const cam = this.ctx.camera, T = this.tmp, r = this.ctx.renderer;
    const PX = app && app.mtPixel;
    if (PX && PX.internalW > 0) T.vp.set(PX.internalW, PX.internalH);
    else {
      r.getDrawingBufferSize(T.vp);
      // [perf] the scene may render below the canvas size (app.mtPerf dynamic resolution, legacy tier scale 0.9): snap,
      // size AND pick the art density on the grid of the target the quads are actually rasterised into, so one art px
      // is a whole number of scene px (exact texels, no in-scene filtering) at any scene scale; only the final
      // upsample to the canvas filters, once
      const pipe = this.ctx.pipeline || (app && app.pipeline), rt = pipe && pipe.post && !pipe.post.pixelMode && pipe.post.sceneRT;
      if (rt && rt.width > 0 && rt.height > 0 && (rt.width !== T.vp.x || rt.height !== T.vp.y)) T.vp.set(rt.width, rt.height);
    }
    this.uniforms.uViewport.value.copy(T.vp);
    cam.updateMatrixWorld();
    const e = cam.matrixWorld.elements;
    const rx = e[0], rz = e[2], fx = -e[8], fz = -e[10];
    const rl = Math.hypot(rx, rz) || 1, fl = Math.hypot(fx, fz) || 1;
    this.cam = { rx: rx / rl, rz: rz / rl, fx: fx / fl, fz: fz / fl };
    this.castUniforms.uCamRight.value.set(e[0], e[1], e[2]).normalize();
    // focus = camera forward ray hitting y=0 (fallback 20 m ahead)
    cam.getWorldPosition(T.a); cam.getWorldDirection(T.d);
    this.camPos = { x: T.a.x, y: T.a.y, z: T.a.z };
    const t = T.d.y < -0.05 ? -T.a.y / T.d.y : 20;
    T.a.addScaledVector(T.d, t);
    T.up.set(e[4], e[5], e[6]).normalize();
    const upY = Math.max(0.2, T.up.y);
    T.b.copy(T.a).add(T.up);
    T.a.project(cam); T.b.project(cam);
    let pxPerM = Math.abs(T.b.y - T.a.y) * 0.5 * T.vp.y;
    const U = this.uniforms, hd = !(PX && PX.internalW > 0);
    let k;
    if (!hd) {
      // pixel mode: the world is drawn on the same 32 px/m grid: 1 art px = a whole number of grid px
      if (this.dens !== PPM) this.setDensity(PPM);
      this.densReady = true;
      k = Math.max(1, Math.round(pxPerM / PPM));
    } else {
      // HD: pick the art density so that, at camera zoom 1, one art px is a WHOLE number of screen px and the sprite
      // keeps its world size (re-bake only when the window or [perf] scene size changes it by > 6 %, <= 6 % size slack); while the camera
      // zooms, the scale goes fractional and the shader switches to sharp-bilinear sampling (no shimmer). The camera
      // rig gives a stable zoom-1 value (the same one the lobby prewarm predicted); else measure at the focus.
      const R = this.rigPxPerM(T.vp.y);
      if (R && R.now > 0) pxPerM = R.now;
      const zoom = app && app.mtCamera && app.mtCamera.zoom > 0 ? app.mtCamera.zoom : 1;
      // [perf] re-bake past 6 % (the quad snap tolerance): at zoom 1 every frame of the current density lands on whole
      // scene px; a render-scale change re-bakes in the worker while the old frames stay on screen
      this.pxBase = R ? R.base : pxPerM * zoom;   // [perf] zoom-1 screen px per metre (pushSprite snaps k there)
      // [perf] snapped (1) vs true zoomed (0) sprite scale, eased over 0.3 s; hysteresis 5 % in / 6 % out of the band
      const zr = pxPerM / this.pxBase, inBand = Math.abs(zr - 1) < ((this.snapB ?? 1) > 0.5 ? 0.06 : 0.05);
      this.snapB = Math.max(0, Math.min(1, (this.snapB ?? 1) + (inBand ? 1 : -1) * (this.rdt || 0) / 0.3));
      const want = this.densFor(this.pxBase);
      if (!this.densReady || (this.dens === PPM && !this.hd) || Math.abs(want - this.dens) / this.dens > 0.06) { this.setDensity(want); this.densReady = true; }
      k = pxPerM / this.dens;
    }
    this.hd = hd; this.pxPerM = pxPerM; this.upY = upY;
    U.uK.value = k; U.uMarkK.value = k; U.uPxM.value = pxPerM; U.uHD.value = hd ? 1 : 0; U.uGlow.value = hd ? 1.3 : 0.9;
    this.k = k;
    this.vpm = this.dens * upY;    // art px per vertical world metre (waterline height)
  }

  // sun / shadow-map / rim uniforms from the pipeline's light rig
  updateLights(app) {
    const pipe = this.ctx.pipeline || (app && app.pipeline) || (typeof window !== 'undefined' && window.__moba && window.__moba.pipeline);
    const L = pipe && pipe.lights, U = this.uniforms, T = this.tmp;
    const sun = L && L.sun;
    if (!sun) { U.uShadowOn.value = 0; return; }
    T.d.copy(sun.position).sub(sun.target.position).normalize();
    this.castUniforms.uSunDir.value.copy(T.d);
    // sun direction in screen space -> one art-texel offset in atlas uv (rim + selout tests)
    const e = this.ctx.camera.matrixWorld.elements;
    const sx = T.d.x * e[0] + T.d.y * e[1] + T.d.z * e[2], sy = T.d.x * e[4] + T.d.y * e[5] + T.d.z * e[6], sz = T.d.x * e[8] + T.d.y * e[9] + T.d.z * e[10];
    U.uSunView.value.set(sx, sy, sz).normalize();
    const sl = Math.hypot(sx, sy) || 1;
    U.uSunUv.value.set(Math.round(sx / sl * 1.4) / PAGE, Math.round(sy / sl * 1.4) / PAGE);
    const c = sun.color, inten = Math.min(1.12, 0.9 + sun.intensity * 0.03);
    U.uSunCol.value.set(c.r * inten, c.g * inten, c.b * inten);
    const map = sun.shadow && sun.shadow.map;
    const tex = map && (map.depthTexture || null);
    if (tex && sun.castShadow) {
      U.uShadowMap.value = tex; U.uShadowMatrix.value = sun.shadow.matrix; U.uShadowOn.value = 1;
      U.uShadowTexel.value.set(1 / map.width, 1 / map.height);
      U.uRev.value = this.ctx.renderer.capabilities && this.ctx.renderer.capabilities.reversedDepthBuffer ? 1 : 0;
    } else U.uShadowOn.value = 0;
  }

  onEvents(f, now) {
    if (!f.events) return;
    for (const ev of f.events) {
      switch (ev.type) {
        case E.CAPTURE_THROW: { const v = this.views.get(ev.trainer); if (v) v.throwT = now; break; }
        case E.CAPTURE_WOBBLE: { const v = this.views.get(ev.target); if (v) v.wobT = now; break; }
        case E.CAPTURE_START: { const v = this.views.get(ev.target); if (v) v.capT = now; break; }
        case E.CAPTURE_SUCCESS: this.transients.push({ id: 'orb', anim: 'sparkle', x: ev.x, z: ev.y, t0: now, dur: 0.5 }); break;
        case E.CAPTURE_FAIL: this.transients.push({ id: 'orb', anim: 'burst', x: ev.x, z: ev.y, t0: now, dur: 0.3 }); break;
      }
    }
  }

  /** push one sprite instance; o = {flip, flash, dis, scale, tint, team, rs, cloud, wl, dv, seed}. Returns the frame. */
  pushSprite(id, view, anim, fi, x, gy, z, o = {}) {
    const F = this.frameFor(id, view, anim, fi, o.rs);
    if (!F) return null;
    const A = this.sprites.arrays, i = this.sprites.push(), tint = o.tint;
    // screen px per art px for this frame (its own density), snapped to a whole number when within 6 %.
    // [perf] HD: snapping the ZOOMED value made every sprite on screen jump 6 % in size in one frame whenever the camera
    // zoom crossed 1.06 (tools/mt-device.cjs --mode jitter: the solo camera drifts 1.00 -> 1.065 while walking a lane).
    // Now the whole number is taken at zoom 1 and held while the zoom stays within ~6 % (crisp); outside, the true
    // zoomed size takes over — and the switch between the two is EASED over 0.3 s (snapB, updateCamera), never a pop.
    let kk;
    if (this.hd) {
      const zb = this.pxBase > 0 ? this.pxBase : this.pxPerM, k1 = zb / (F.dens || PPM) * (o.scale ?? 1), kr = Math.round(k1);
      const ks = kr >= 1 && Math.abs(k1 - kr) < 0.06 * k1 ? kr : k1, kt = k1 * (this.pxPerM / zb), b = this.snapB ?? 1;
      kk = b >= 1 ? ks : kt + (ks - kt) * b;
    } else { kk = this.k * (o.scale ?? 1); const kr = Math.round(kk); if (kr >= 1 && Math.abs(kk - kr) < 0.06 * kk) kk = kr; }
    A.iPos[i * 4] = x; A.iPos[i * 4 + 1] = gy; A.iPos[i * 4 + 2] = z; A.iPos[i * 4 + 3] = o.flip || 0;
    A.iSize[i * 4] = F.w; A.iSize[i * 4 + 1] = F.h; A.iSize[i * 4 + 2] = kk; A.iSize[i * 4 + 3] = F.ax;
    A.iUv[i * 4] = F.u0; A.iUv[i * 4 + 1] = F.v0; A.iUv[i * 4 + 2] = F.du; A.iUv[i * 4 + 3] = F.dv;
    A.iMisc[i * 4] = o.flash || 0; A.iMisc[i * 4 + 1] = o.dis || 0; A.iMisc[i * 4 + 2] = o.team || 0; A.iMisc[i * 4 + 3] = F.h - F.ay;
    A.iExtra[i * 4] = this.palOf(id); A.iExtra[i * 4 + 1] = F.page; A.iExtra[i * 4 + 2] = o.cloud || 0;
    A.iWade[i * 4] = o.wl || 0; A.iWade[i * 4 + 1] = o.dv || 0; A.iWade[i * 4 + 2] = o.seed || 0; A.iWade[i * 4 + 3] = o.xa || 0;
    if (tint) { A.iTint[i * 4] = tint[0]; A.iTint[i * 4 + 1] = tint[1]; A.iTint[i * 4 + 2] = tint[2]; A.iTint[i * 4 + 3] = tint[3] ?? 1; }
    else A.iTint[i * 4 + 3] = 0;
    return F;
  }
  /** screen-space pixel mark (see MARK_VS): kind 0 shadow, 1 ring, 2 foam, 3 ripple/pulse */
  pushMark(x, y, z, kind, cx, cy, rx, ry, c, a, rate = 0, half = 0, seed = 0, grow = 0) {
    const q = this.marks, i = q.push(), A = q.arrays;
    A.iPos[i * 4] = x; A.iPos[i * 4 + 1] = y; A.iPos[i * 4 + 2] = z; A.iPos[i * 4 + 3] = kind;
    A.iShape[i * 4] = cx; A.iShape[i * 4 + 1] = cy; A.iShape[i * 4 + 2] = rx; A.iShape[i * 4 + 3] = ry;
    A.iCol[i * 4] = c[0]; A.iCol[i * 4 + 1] = c[1]; A.iCol[i * 4 + 2] = c[2]; A.iCol[i * 4 + 3] = a;
    A.iAnim[i * 4] = rate; A.iAnim[i * 4 + 1] = half; A.iAnim[i * 4 + 2] = seed; A.iAnim[i * 4 + 3] = grow;
  }
  /** true when the terrain heightfield blocks the camera's line of sight to the point h metres above (x, y, z) */
  terrainHides(x, y, z, h) {
    const C = this.camPos; if (!C) return false;
    const ty = y + h, dx = x - C.x, dy = ty - C.y, dz = z - C.z;
    for (let k = 2; k < 48; k++) {
      const t = k / 48, qx = C.x + dx * t, qy = C.y + dy * t, qz = C.z + dz * t;
      if (heightAt(qx, qz) > qy + 0.08) return true;
    }
    return false;
  }
  /** silhouette span of the frame's art row just below the waterline (cached): [centre x rel. anchor, half width] */
  waterSpan(F, wl, flip) {
    const key = F.page + ':' + F.x + ':' + F.y + ':' + wl;
    let s = this.spans.get(key);
    if (s === undefined) {
      s = null;
      for (let d = 0; d < 4 && !s; d++) { const r = this.atlas.rowSpan(F, F.ay - wl + d); if (r) s = [(r[0] + r[1]) / 2 - F.ax, (r[1] - r[0]) / 2]; }
      if (this.spans.size > 4000) this.spans.clear();
      this.spans.set(key, s);
    }
    return s ? [flip ? -s[0] : s[0], s[1]] : null;
  }

  update(f) {
    const w = f.world; if (!w) return;
    if (w !== this.lastWorld) { this.views.clear(); this.lastWorld = w; }
    const now = w.time - DT * (1 - f.alpha), fno = ++this.frameNo, app = f.app;
    this.lastUpdateMs = performance.now();
    const rt = performance.now() / 1000; this.rdt = this.lastRt ? Math.min(0.1, Math.max(0, rt - this.lastRt)) : 0; this.lastRt = rt;
    const locals = app && app.locals ? app.locals : null;
    this.updateCamera(app);
    this.updateLights(app);
    // [voxel] voxel world style: every unit below is handed to the voxel runtime instead of a sprite quad (marks, fog,
    // wading, x-ray test, flashes and fx overrides stay here); capture orbs stay sprites
    const VX = voxelStyle(app);
    if (VX) { if (!this.voxel) { this.voxel = new VoxelUnits(this.ctx); this.voxel.palette = spritePalette; this.voxel.heightAt = heightAt; this.voxel.viewport = this.uniforms.uViewport.value; } this.voxel.begin(f, now); } else if (this.voxel) this.voxel.hide();
    this.uniforms.uTime.value = now;
    // env material tag (scene alpha 0.75 = sprite pixel: own outline, no depth-reconstructed fog / aerial haze); the env
    // post chain publishes app.mtSceneTags in both modes (pixel grid + HD)
    this.uniforms.uTag.value = app && (app.mtSceneTags === true || app.mtPixel) ? 0.75 : 1.0;
    this.onEvents(f, now);
    this.sprites.begin(); this.marks.begin();
    this.demandBudget = 10;   // ms of synchronous on-demand frame baking per rendered frame
    const amb = app && app.mtAmbient, cloudAt = amb && amb.enabled !== false && typeof amb.cloudAt === 'function' ? amb.cloudAt.bind(amb) : null;
    const SH = [0.025, 0.035, 0.07], FOAM = [0.8, 0.96, 1.0], RIP = [0.62, 0.88, 0.98];
    for (const [uid, o] of this.fx) if (o.until != null && now > o.until) this.fx.delete(uid);
    for (const u of w.unitList) {
      // render-only flag (authorised): minions and the river boss are drawn here; the legacy creeps renderer
      // skips mtSprite units ([MT-HOOK] hideCreepModel) so nothing is drawn twice.
      if (!u.mtSprite && (u.kind === KIND.MINION || (u.kind === KIND.MONSTER && u.epic && u.camp === 'drake'))) u.mtSprite = true;
      if (!u.mtSprite) continue;
      if (app && app.mtSees ? !app.mtSees(u) : (u.visible && u.visible[f.viewerTeam] === false)) continue;
      const id = this.artOf(u); if (!id) continue;
      const S = SPECIES_ART[id]; if (!S) continue;
      let v = this.views.get(u.id);
      if (!v) this.views.set(u.id, v = { hit: u.hitSeq, hitT: -99, atk: u.attackSeq, atkT: -99, atkWind: 0.25, form: u.mtMon ? u.mtMon.form : null, evoT: -99, throwT: -99, wobT: -99, capT: -99, seen: 0 });
      v.seen = fno;
      if (u.hitSeq !== v.hit) { v.hit = u.hitSeq; v.hitT = now; }
      if (u.attackSeq !== v.atk) { v.atk = u.attackSeq; v.atkT = u.attackT != null ? u.attackT : now; v.atkWind = (u.windupFrac || 0.3) / Math.max(0.2, u.attackSpeed || 1); }
      if (u.mtMon && u.mtMon.form !== v.form) { v.form = u.mtMon.form; v.evoT = now; }
      const deadFor = u.alive ? 0 : now - (u.deathT || now);
      if (!u.alive && deadFor > (S.kind === 'trainer' ? 2.3 : 1.5)) continue;   // gone once sunk (no lingering ghost)
      if (!this.ensure(id)) continue;
      const x = u.prevX + (u.x - u.prevX) * f.alpha, z = u.prevY + (u.y - u.prevY) * f.alpha;
      let gy = heightAt(x, z);
      const [view, flip] = this.orient(u, v, id, S);
      const [anim, fi] = this.pickAnim(u, v, S, now);
      let flash = 0, dis = 0, scale = 1;
      const M = u.mtMon;
      if (M && M.evolving) { const p = Math.min(1, Math.max(0, 1 - (M.evolving.until - now) / 2.4)); flash = 0.5 + 0.5 * Math.sin(now * (6 + 34 * p * p)); }
      const pop = Math.max(0, 1 - (now - v.evoT) * 2.5); flash = Math.max(flash, pop);
      // hit blink. [env r6, iPad playtest #9 "white ghosts"] every hit used to restart a 55 % white blink, so a unit under
      // sustained fire (DOT ticks, minion pokes, multi-hits) stayed pale for seconds - measured in a mid-river lane fight:
      // one monster 12 % of all frames. Now one short, lighter blink per 0.45 s at most.
      if (v.hitT !== v.blinkHit) { v.blinkHit = v.hitT; if (now - (v.blinkT ?? -99) > 0.45) v.blinkT = now; }
      if (now - (v.blinkT ?? -99) < 0.07 && u.alive) flash = Math.max(flash, 0.32);
      // faint / defeated anim plays out, holds a beat, then the sprite sinks into the ground (0.45 s)
      if (!u.alive) dis = Math.min(1, Math.max(0, (deadFor - (S.kind === 'trainer' ? 1.75 : 0.95)) / 0.45));
      const rs = this.sizeOf(S) * (u.kind === KIND.MINION && u.subtype === 'super' ? SIZE.super : 1);
      const ov = this.fx.get(u.id);
      let tint = null;
      if (ov) {
        if (ov.hidden || (ov.hideUntil != null && now < ov.hideUntil)) continue;
        if (ov.flash != null) flash = Math.max(flash, ov.flash);
        if (ov.scale != null) scale *= ov.scale;
        if (ov.tint) tint = ov.tint;
      }
      // river wading: the sprite stands at most WADE_MAX deep (deeper beds lift it); hovering forms skim the surface
      let wl = 0, dv = 0, wet = false;
      if (id !== 'orb' && gy < WATER_Y - 0.02) {
        wet = true;
        if (S.hover >= 5) gy = WATER_Y;
        else {
          const F0 = this.atlas.frames.get(this.keyOf(id, view, 'idle', 0, rs));
          dv = Math.min(WATER_Y - gy, WADE_MAX, F0 ? 0.22 * F0.h / this.vpm : 0.3);
          gy = WATER_Y - dv; wl = Math.max(1, Math.round(dv * this.vpm / scale));
        }
      }
      const isLocal = locals ? locals.some((l) => l.unitId === u.id) : u.id === f.playerId;
      const owner = M && M.ownerId >= 0 ? M.ownerId : -1;
      const mine = isLocal || (owner >= 0 && (locals ? locals.some((l) => l.unitId === owner) : owner === f.playerId));
      const team = M && M.ownerId < 0 && u.team === 2 ? 4 : mine ? 1 : u.team === f.viewerTeam ? 2 : 3;
      const seed = (u.id * 0.618) % 1;
      // behind-wall indicator: own units only, after 0.3 s hidden by terrain (CPU heightfield ray), 0.15 s fades
      let xa = 0;
      if (team === 1 && u.alive && id !== 'orb') {
        const F0 = this.atlas.frames.get(this.keyOf(id, view, 'idle', 0, rs));
        const hM = F0 ? F0.ay / ((F0.dens || PPM) * Math.max(0.3, this.upY)) : 1.2;
        v.occFor = this.terrainHides(x, gy + dv, z, hM * 0.55) ? (v.occFor || 0) + this.rdt : 0;
        v.xa = Math.max(0, Math.min(1, (v.xa || 0) + (v.occFor >= 0.3 ? 1 : -1) * this.rdt / 0.15));
        xa = this.debugXray ? 1 : v.xa;   // debugXray: tests / screenshots of the indicator style
      }
      const cloud = cloudAt ? Math.max(0, Math.min(1, cloudAt(x, z) || 0)) : 0;
      const F = VX ? this.voxel.unit(u, { x, gy, z, teamName: u.team === 2 ? 'wild' : teamName(u.team), flash, dis, scale, tint, dv, xa, v, S, artId: id })   // [voxel]
        : this.pushSprite(id, view, anim, fi, x, gy, z, { flip, flash, dis, scale, tint, team, rs, cloud, wl, dv, seed: seed * 6.28, xa });
      if (!F || id === 'orb') continue;
      // ground marks (art px on the sprite's own grid)
      const fade = (1 - dis) * (u.alive ? 1 : 0.5);
      const dk = this.dens / PPM, rx = Math.max(5, Math.round((S.shadowRadius || 8) * ART_SCALE * rs * 1.05 * dk)), ry = Math.max(3, Math.round(rx * MARK_RATIO));
      const cc = team === 4 ? this.colors.wild : team === 1 ? this.colors.self : team === 2 ? this.colors.ally : this.colors.enemy;
      if (!wet) this.pushMark(x, gy, z, 0, 0, 0, rx, ry, SH, 0.5 * fade * (S.hover >= 5 ? 0.7 : 1));
      if (wet) {
        const span = wl > 0 && !F.voxel ? this.waterSpan(F, wl, flip) : null;
        const fx = span ? span[0] : 0, frx = span ? Math.max(3, Math.round(span[1] + 1.5)) : rx, fry = Math.max(2, Math.round(frx * MARK_RATIO));
        const mov = u.moving ? 1.9 : 1.1;
        for (const half of [1, 2]) {
          if (wl > 0) this.pushMark(x, gy, z, 2, fx, wl, frx, fry, FOAM, 0.95 * fade, 0, half);
          this.pushMark(x, gy, z, 3, fx, wl, frx + 1, fry + 1, RIP, 0.85 * fade, mov, half, seed, 1.1);
        }
      }
      if (u.kind !== KIND.MINION && u.alive) {
        const rr = Math.round(rx * 1.18), rry = Math.max(3, Math.round(rr * MARK_RATIO));
        if (wet && wl > 0) for (const half of [1, 2]) this.pushMark(x, gy, z, 1, 0, wl, rr + 2, rry + 1, cc, 0.92 * fade, 0, half);
        else this.pushMark(x, gy, z, 1, 0, wl, rr, rry, cc, 0.92 * fade);
        // own trainer: slow outward pulse so the player always finds themselves first
        if (isLocal && u.alive) this.pushMark(x, gy, z, 3, 0, wl, rr + 1, rry + 1, cc, 0.7, 0.5, 0, 0, 0.36);
      }
    }
    // capture orbs in flight + capture success/fail flourishes
    if (w.projectiles && this.ensure('orb')) for (const p of w.projectiles) {
      if (p.fx !== 'mt_capture_orb') continue;
      const gy = heightAt(p.x, p.y);
      const d0 = Math.hypot((p.tx ?? p.x) - (p.sx ?? p.x), (p.ty ?? p.y) - (p.sy ?? p.y)) || 1;
      const lift = 0.6 + 0.8 * Math.sin(Math.PI * Math.min(1, Math.max(0, 1 - Math.hypot((p.tx ?? p.x) - p.x, (p.ty ?? p.y) - p.y) / d0)));
      if (VX) this.voxel.orbAt(p.x, gy + lift, p.y, now * 9);   // [voxel]
      else this.pushSprite('orb', 'front', 'idle', Math.floor(now * 10) % 4, p.x, gy + lift, p.y);
    }
    this.transients = this.transients.filter((t) => now - t.t0 < t.dur);
    for (const t of this.transients) {
      if (VX) { if (!t.vox) { t.vox = true; this.voxel.burst(t.anim === 'sparkle' ? 'success' : 'fail', t.x, Math.max(WATER_Y, heightAt(t.x, t.z)), t.z); } continue; }   // [voxel]
      const n = SPECIES_ART.orb.anims[t.anim].n;
      this.pushSprite('orb', 'front', t.anim, Math.min(n - 1, Math.floor((now - t.t0) / t.dur * n)), t.x, Math.max(WATER_Y, heightAt(t.x, t.z)), t.z);
    }
    for (const [id, v] of this.views) if (v.seen !== fno) this.views.delete(id);
    if (VX) this.voxel.end();   // [voxel]
    this.sprites.end(); this.marks.end();
    if (!VX) this.pump(2);  // background prewarm (on-screen ids first, then evolutions, other teams...); [voxel] none: units are voxel models
    this.atlas.flush(this.atlas.noCopy ? null : this.ctx.renderer);
  }

  dispose() {
    this.disposed = true;
    if (this.bw) { try { this.bw.terminate(); } catch (e) { /* gone */ } this.bw = null; }
    if (this.idleId) { if (typeof cancelIdleCallback === 'function') cancelIdleCallback(this.idleId); clearTimeout(this.idleId); this.idleId = 0; }
    this.sprites.dispose(); this.marks.dispose();
    if (this.voxel) this.voxel.dispose();   // [voxel]
    for (const p of this.atlas.pages) p.tex.dispose();
    this.palTex.dispose(); this.ctx.scene.remove(this.group);
  }
}
