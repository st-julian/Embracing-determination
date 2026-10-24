// Colour utilities: hex <-> rgb, OKLab/OKLCh, hue-shifted pixel-art ramps.
import { clamp } from './math.js';

export function hexToRgb(h) {
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function rgbToHex([r, g, b]) {
  const f = v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0');
  return '#' + f(r) + f(g) + f(b);
}
const s2l = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const l2s = c => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);

export function rgbToOklab([r, g, b]) {
  r = s2l(r); g = s2l(g); b = s2l(b);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
}
export function oklabToRgbRaw([L, a, b]) {
  const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
  const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
  const s = Math.pow(L - 0.0894841775 * a - 1.2914855480 * b, 3);
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s];
}
export function lchToRgb(L, C, H) {
  // gamut-clip by reducing chroma
  for (let i = 0; i < 24; i++) {
    const a = C * Math.cos(H), b = C * Math.sin(H);
    const lin = oklabToRgbRaw([L, a, b]);
    if (lin.every(v => v >= -0.001 && v <= 1.001)) return lin.map(v => l2s(clamp(v, 0, 1)));
    C *= 0.88;
  }
  const lin = oklabToRgbRaw([L, 0, 0]);
  return lin.map(v => l2s(clamp(v, 0, 1)));
}
export function rgbToLch(rgb) {
  const [L, a, b] = rgbToOklab(rgb);
  return [L, Math.hypot(a, b), Math.atan2(b, a)];
}
function hueToward(h, target, amt) {
  let d = target - h;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  const step = Math.sign(d) * Math.min(Math.abs(d), amt);
  return h + step;
}
const COOL = 4.6; // ~ 264deg oklch (blue/violet)
const WARM = 1.75; // ~ 100deg (yellow)

// 5 tones: deep shadow, shadow, base, light, highlight. plus outline & line colours.
export function makeRamp(hex, o = {}) {
  const rgb = hexToRgb(hex);
  const [L, C, H] = rgbToLch(rgb);
  const sh = o.shift ?? 1; // hue shift strength
  const ds = o.dark ?? 1; // shadow depth multiplier
  const lg = o.light ?? 1;
  const cool = o.coolHue ?? COOL, warm = o.warmHue ?? WARM;
  const tone = (dL, dC, dH, toward) => {
    const h = toward === 'c' ? hueToward(H, cool, dH * sh) : hueToward(H, warm, dH * sh);
    return rgbToHex(lchToRgb(clamp(L + dL, 0.05, 0.99), Math.max(0, C * dC), h));
  };
  const ramp = [
    tone(-0.26 * ds, 1.12, 0.4, 'c'),
    tone(-0.125 * ds, 1.1, 0.22, 'c'),
    hex,
    tone(0.09 * lg, 0.94, 0.12, 'w'),
    tone(0.185 * lg, 0.6, 0.22, 'w'),
  ];
  const outline = o.outline || rgbToHex(lchToRgb(clamp(L * 0.28 - 0.03, 0.11, 0.245), Math.min(0.085, C * 0.7 + 0.02), hueToward(H, cool, 0.5 * sh)));
  const line = o.lineCol || rgbToHex(lchToRgb(clamp(L * 0.5 - 0.02, 0.14, 0.42), Math.min(0.12, C * 0.9 + 0.02), hueToward(H, cool, 0.45 * sh)));
  return { ramp: o.ramp || ramp, outline, line };
}

export function mix(h1, h2, t) {
  const a = hexToRgb(h1), b = hexToRgb(h2);
  return rgbToHex([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]);
}
export function lighten(hex, dL, dC = 1) {
  const [L, C, H] = rgbToLch(hexToRgb(hex));
  return rgbToHex(lchToRgb(clamp(L + dL, 0, 1), C * dC, H));
}
