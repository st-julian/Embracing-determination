var e = `
#define LOOK_RIM 1
uniform vec3 uRimColor; uniform float uRimStrength; uniform vec3 uRimDir;
// N: world normal (unit) · V: world direction surface → camera (unit) · albedo: base colour (linear)
vec3 lookRim(vec3 N, vec3 V, vec3 albedo) {
  float f = 1.0 - clamp(dot(N, V), 0.0, 1.0);
  f = f * f;                                                      // fresnel² — wide enough to read at gameplay zoom
  float side = smoothstep(-0.35, 0.6, dot(N, uRimDir));             // from the sun's side (upper-left of the screen)
  float up = 0.55 + 0.45 * clamp(N.y * 0.5 + 0.5, 0.0, 1.0);        // shoulders / heads catch more than feet
  return uRimColor * uRimStrength * f * side * up * (0.35 + 0.65 * albedo);
}
// Camera-relative character key in VIEW space (used by the pipeline's lights_fragment_end patch; needs three's viewMatrix).
vec3 lookCharKeyView(vec3 nView, vec3 diffuse) {
  vec3 up = normalize(viewMatrix[1].xyz);                               // world up, in view space
  vec3 h = vec3(0.0, 0.0, 1.0) - up * up.z; h = dot(h, h) > 1e-4 ? normalize(h) : vec3(0.0, 0.0, 1.0); // toward camera, horizontal
  vec3 r = vec3(1.0, 0.0, 0.0) - up * up.x; r = dot(r, r) > 1e-4 ? normalize(r) : vec3(1.0, 0.0, 0.0); // screen right, horizontal
  vec3 L = normalize(-0.35 * r + 0.75 * up + 0.55 * h);
  float w = dot(nView, L) * 0.5 + 0.5;                                   // half-Lambert wrap: soft, never a hard terminator
  return uRimColor * (w * w) * diffuse * 0.3183099;
}`;
function t(e, t) {
  let n = t && t.uniforms;
  return n
    ? ((e.uRimColor = n.uRimColor),
      (e.uRimStrength = n.uRimStrength),
      (e.uRimDir = n.uRimDir),
      n.uCharKeyDir &&
        ((e.uCharKeyDir = n.uCharKeyDir), (e.uCharKeyColor = n.uCharKeyColor)),
      e)
    : e;
}
export { t as n, e as t };
