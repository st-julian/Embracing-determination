// mt/net/detmath.js — deterministic transcendental Math for ONLINE lockstep matches. Owner: netplay.
//
// Why: Safari (JavaScriptCore) and Chrome (V8) may return different last bits for Math.sin/cos/exp/log/pow/... (the
// spec leaves them implementation-approximated). In a lockstep game one differing bit eventually diverges the whole
// match. IEEE + − × ÷ and sqrt ARE exactly specified (no FMA contraction in JS), as are floor/round/abs/min/max/imul,
// so every function below is built from those only, with fixed operation order => bit-identical results on every
// engine. Accuracy: ≲ 2 ulp for sin/cos/tan/atan/atan2/exp/log (relative ≲ 4e-16), pow/cbrt/hyperbolics ≲ 1e-14
// relative over the game's range; the unit test (tests/detmath.test.mjs) checks against native within 1e-12.
//
// The legacy sim already uses its own deterministic sin/cos/atan2/hypot (index-*.js `Bg/Vg/Ug/Gg`); mt/sim and mt/ai
// call Math.* directly, so the online session swaps these in around every world tick (install / uninstall) and restores
// the native ones right after: rendering, UI and offline play never see them.
//
// API: DET (object of functions), install() -> true if it swapped, uninstall(), installed().

const PI = 3.141592653589793, PI_LO = 1.2246467991473532e-16;
const PI_2 = 1.5707963267948966, PI_2_LO = 6.123233995736766e-17;
const PI_4 = 0.7853981633974483, PI_4_LO = 3.061616997868383e-17;
const INV_PIO2 = 0.6366197723675814;
// π/2 = P1 + P2 + P3 + P3T (P1..P3 have 33-bit mantissas: k*Pi is exact for |k| < 2^20) — fdlibm's split, verified
// against 80-digit π (error 7e-49)
const P1 = 1.5707963267341256, P2 = 6.077100506303966e-11, P3 = 2.0222662487111665e-21, P3T = 8.478427660368899e-32;
const LN2_HI = 0.6931471803691238, LN2_LO = 1.9082149292705877e-10, LN2 = 0.6931471805599453;
const INV_LN2 = 1.4426950408889634;
const LOG10_2 = 0.3010299956639812, LOG10_2_LO = -2.8037281277851704e-18, INV_LN10 = 0.4342944819032518;
const TAN_PI8 = 0.41421356237309503;
const TINY = 9.313225746154785e-10;   // 2^-30: below it sin x = tan x = x, cos x = 1 to double precision

// ---------------------------------------------------------------------------------------------- bit helpers
// DataView with an explicit (big-endian) byte order: identical on every platform.
const DV = new DataView(new ArrayBuffer(8));
const hiWord = (x) => { DV.setFloat64(0, x); return DV.getUint32(0); };
const loWord = () => DV.getUint32(4);   // low word of the value last passed to hiWord
const fromWords = (hi, lo) => { DV.setUint32(0, hi >>> 0); DV.setUint32(4, lo >>> 0); return DV.getFloat64(0); };
/** exact 2^k for integer k in [-1022, 1023] */
const pow2 = (k) => fromWords((k + 1023) << 20, 0);
/** x · 2^k with at most one rounding (subnormal results); k any integer */
function scale(x, k) {
  if (k > 1023) { x *= pow2(1023); k -= 1023; if (k > 1023) { x *= pow2(1023); k -= 1023; if (k > 1023) k = 1023; } }
  else if (k < -1022) { x *= pow2(-1022); k += 1022; if (k < -1022) { x *= pow2(-1022); k += 1022; if (k < -1022) k = -1022; } }
  return x * pow2(k);
}

// Taylor coefficients 1/n! (exact literals are correctly rounded by every engine's parser)
const F = [1];
for (let i = 1; i <= 20; i++) F[i] = F[i - 1] * i;
const IF = F.map((f) => 1 / f);

// ---------------------------------------------------------------------------------------------- sin / cos / tan
/** sin r, |r| ≤ π/4 + ε (Taylor to r^17: truncation < 1e-19 relative) */
function sinPoly(r) {
  const z = r * r;
  const p = -IF[3] + z * (IF[5] + z * (-IF[7] + z * (IF[9] + z * (-IF[11] + z * (IF[13] + z * (-IF[15] + z * IF[17]))))));
  return r + (r * z) * p;
}
/** cos r, |r| ≤ π/4 + ε (Taylor to r^18) */
function cosPoly(r) {
  const z = r * r;
  const p = IF[4] + z * (-IF[6] + z * (IF[8] + z * (-IF[10] + z * (IF[12] + z * (-IF[14] + z * (IF[16] - z * IF[18]))))));
  return (1 - 0.5 * z) + (z * z) * p;
}
// exact product a·b = p + e (Dekker / Veltkamp, no FMA needed)
const SPLIT = 134217729;   // 2^27 + 1
let TP_E = 0;
function twoProd(a, b) {
  const p = a * b;
  let c = SPLIT * a; const ah = c - (c - a), al = a - ah;
  c = SPLIT * b; const bh = c - (c - b), bl = b - bh;
  TP_E = ((ah * bh - p) + ah * bl + al * bh) + al * bl;
  return p;
}
let RED = 0;   // reduced argument of the last reduce() call
/** x = k·π/2 + RED, |RED| ≲ π/4; returns k mod 4 (0..3) */
function reduce(x) {
  const k = Math.round(x * INV_PIO2);
  if (!(Math.abs(k) < 524288)) return bigReduce(x);   // 2^19
  // Cody–Waite: every k·Pi product is exact (33-bit Pi × 19-bit k), x − k·P1 is exact (Sterbenz)
  RED = (((x - k * P1) - k * P2) - k * P3) - k * P3T;
  return ((k % 4) + 4) % 4;
}
// floor(2/π · 2^1200) (generated with exact 460-digit arithmetic; starts 0xA2F9836E4E441529FC27…)
const TWO_OVER_PI = BigInt('0xa2f9836e4e441529fc2757d1f534ddc0db6295993c439041fe5163abdebbc561b7246e3a424dd2e006492eea09d1921cfe1deb1cb129a73ee88235f52ebb4484e99c7026b45f7e413991d639835339f49c845f8bbdf9283b1ff897ffde05980fef2f118b5a0a6d1f6d367ecf27cb09b74f463f669e5fea2d7527bac7ebe5f17b3d0739f78a5292ea6bfb5fb11f8d5d0856033046fc7b');
const M64 = 0xFFFFFFFFFFFFFFFFn, HALF64 = 0x8000000000000000n, ONE64 = 0x10000000000000000n;
const TWO_M53 = 1.1102230246251565e-16, TWO_M64 = 5.421010862427522e-20;
/** Payne–Hanek style exact reduction for huge |x| (BigInt: exact on every engine). Sets RED, returns k mod 4. */
function bigReduce(x) {
  const neg = x < 0, a = neg ? -x : x;
  const hx = hiWord(a), lx = loWord();
  const M = (BigInt((hx & 0x000fffff) | 0x00100000) << 32n) | BigInt(lx);   // a = M · 2^E, M a 53-bit integer
  const E = ((hx >>> 20) & 0x7ff) - 1075;
  const P = M * TWO_OVER_PI;                     // a · 2/π = P · 2^(E − 1200)
  const shift = 1200 - E;                        // ≥ 229 for every finite double
  let k = P >> BigInt(shift);
  let frac = (P >> BigInt(shift - 64)) & M64;    // the first 64 bits of the fraction
  let fneg = false;
  if (frac >= HALF64) { k += 1n; frac = ONE64 - frac; fneg = true; }
  const fhi = Number(frac >> 11n) * TWO_M53, flo = Number(frac & 0x7FFn) * TWO_M64;
  let r = fhi * PI_2 + (fhi * PI_2_LO + flo * PI_2);
  if (fneg) r = -r;
  let q = Number(k & 3n);
  if (neg) { r = -r; q = (4 - q) % 4; }
  RED = r;
  return q;
}
function sin(x) {
  x = +x;
  const a = Math.abs(x);
  if (a < TINY) return x;                 // keeps ±0
  if (!(a < Infinity)) return NaN;
  if (a <= PI_4) return sinPoly(x);
  const n = reduce(x), r = RED;
  return n === 0 ? sinPoly(r) : n === 1 ? cosPoly(r) : n === 2 ? -sinPoly(r) : -cosPoly(r);
}
function cos(x) {
  x = +x;
  const a = Math.abs(x);
  if (a < TINY) return 1;
  if (!(a < Infinity)) return NaN;
  if (a <= PI_4) return cosPoly(x);
  const n = reduce(x), r = RED;
  return n === 0 ? cosPoly(r) : n === 1 ? -sinPoly(r) : n === 2 ? -cosPoly(r) : sinPoly(r);
}
function tan(x) {
  x = +x;
  const a = Math.abs(x);
  if (a < TINY) return x;
  if (!(a < Infinity)) return NaN;
  if (a <= PI_4) return sinPoly(x) / cosPoly(x);
  const n = reduce(x), r = RED;
  return (n & 1) === 0 ? sinPoly(r) / cosPoly(r) : -cosPoly(r) / sinPoly(r);
}

// ---------------------------------------------------------------------------------------------- atan family
/** atan u for |u| ≤ tan(π/8): one half-angle step then the series to v^23 (|v| ≤ 0.199: truncation < 1e-18) */
function atanSmall(u) {
  const v = u / (1 + Math.sqrt(1 + u * u));
  const z = v * v;
  let p = -1 / 23;
  p = 1 / 21 + z * p; p = -1 / 19 + z * p; p = 1 / 17 + z * p; p = -1 / 15 + z * p; p = 1 / 13 + z * p;
  p = -1 / 11 + z * p; p = 1 / 9 + z * p; p = -1 / 7 + z * p; p = 1 / 5 + z * p; p = -1 / 3 + z * p;
  return 2 * (v + (v * z) * p);
}
/** atan t, 0 ≤ t ≤ 1 */
function atanUnit(t) {
  if (t < TINY) return t;   // atan t = t to double precision (also keeps subnormal results)
  if (t <= TAN_PI8) return atanSmall(t);
  return PI_4 + (atanSmall((t - 1) / (t + 1)) + PI_4_LO);
}
function atan(x) {
  x = +x;
  if (x !== x) return NaN;
  const a = Math.abs(x);
  if (a < TINY) return x;
  let r;
  if (a <= 1) r = atanUnit(a);
  else if (a === Infinity) r = PI_2;
  else r = (PI_2 - atanUnit(1 / a)) + PI_2_LO;
  return x < 0 ? -r : r;
}
function atan2(y, x) {
  y = +y; x = +x;
  if (y !== y || x !== x) return NaN;
  if (y === 0) {                                    // ±0
    if (x > 0 || Object.is(x, 0)) return y;
    return Object.is(y, -0) ? -PI : PI;
  }
  if (x === 0) return y > 0 ? PI_2 : -PI_2;
  if (x === Infinity) { if (y === Infinity) return PI_4; if (y === -Infinity) return -PI_4; return y > 0 ? 0 : -0; }
  if (x === -Infinity) { if (y === Infinity) return 3 * PI_4; if (y === -Infinity) return -3 * PI_4; return y > 0 ? PI : -PI; }
  if (y === Infinity) return PI_2;
  if (y === -Infinity) return -PI_2;
  const ax = Math.abs(x), ay = Math.abs(y);
  let r = ay <= ax ? atanUnit(ay / ax) : (PI_2 - atanUnit(ax / ay)) + PI_2_LO;
  if (x < 0) r = (PI - r) + PI_LO;
  return y < 0 ? -r : r;
}
function asin(x) {
  x = +x;
  const a = Math.abs(x);
  if (!(a <= 1)) return NaN;
  if (a < TINY) return x;
  return atan2(x, Math.sqrt((1 - x) * (1 + x)));
}
function acos(x) {
  x = +x;
  if (!(Math.abs(x) <= 1)) return NaN;
  return atan2(Math.sqrt((1 - x) * (1 + x)), x);
}

// ---------------------------------------------------------------------------------------------- exp / log
/** e^r for |r| ≤ ~0.35 (Taylor to r^13: truncation 4e-18) */
function expPoly(r) {
  let p = IF[13];
  for (let i = 12; i >= 2; i--) p = IF[i] + r * p;
  return 1 + (r + (r * r) * p);
}
function exp(x) {
  x = +x;
  if (x !== x) return NaN;
  if (x > 709.782712893384) return Infinity;
  if (x < -745.1332191019412) return 0;
  if (Math.abs(x) < 1e-300) return 1;
  const k = Math.round(x * INV_LN2);
  const r = (x - k * LN2_HI) - k * LN2_LO;
  return scale(expPoly(r), k);
}
let LG_K = 0;   // binary exponent of the last logParts() argument
/** log of the mantissa m ∈ [√½, √2) of x (x finite > 0); LG_K = k with x = m · 2^k */
function logParts(x) {
  let k = 0;
  if (x < 2.2250738585072014e-308) { x *= 18014398509481984; k = -54; }   // subnormal: × 2^54
  const hx = hiWord(x), lx = loWord();
  k += ((hx >>> 20) & 0x7ff) - 1023;
  let m = fromWords((hx & 0x000fffff) | 0x3ff00000, lx);
  if (m > 1.4142135623730951) { m *= 0.5; k += 1; }
  LG_K = k;
  const f = m - 1;
  if (f === 0) return 0;
  const s = f / (2 + f), z = s * s;
  // log m = 2 atanh s = 2 (s + s^3/3 + ... + s^21/21); |s| ≤ 0.1716 → truncation < 2e-19
  let p = 1 / 21;
  p = 1 / 19 + z * p; p = 1 / 17 + z * p; p = 1 / 15 + z * p; p = 1 / 13 + z * p; p = 1 / 11 + z * p;
  p = 1 / 9 + z * p; p = 1 / 7 + z * p; p = 1 / 5 + z * p; p = 1 / 3 + z * p;
  return 2 * s + (2 * s) * (z * p);
}
function logSpecial(x) {   // undefined when x is an ordinary positive finite number
  if (x !== x || x < 0) return NaN;
  if (x === 0) return -Infinity;
  if (x === Infinity) return Infinity;
  return undefined;
}
function log(x) {
  x = +x;
  const s = logSpecial(x); if (s !== undefined) return s;
  const lm = logParts(x), k = LG_K;
  return k * LN2_HI + (lm + k * LN2_LO);
}
function log2(x) {
  x = +x;
  const s = logSpecial(x); if (s !== undefined) return s;
  const lm = logParts(x), k = LG_K;
  return k + lm * INV_LN2;   // exact for powers of two
}
function log10(x) {
  x = +x;
  const s = logSpecial(x); if (s !== undefined) return s;
  const lm = logParts(x), k = LG_K;
  return k * LOG10_2 + (lm * INV_LN10 + k * LOG10_2_LO);
}
function expm1(x) {
  x = +x;
  if (x !== x) return NaN;
  if (x === 0) return x;
  if (x === Infinity) return Infinity;
  if (x === -Infinity) return -1;
  if (Math.abs(x) < 0.5) {   // x (1 + x/2 + x²/6 + ... + x^16/17!)
    let p = IF[17];
    for (let i = 16; i >= 2; i--) p = IF[i] + x * p;
    return x + (x * x) * p;
  }
  return exp(x) - 1;
}
function log1p(x) {
  x = +x;
  if (x !== x || x < -1) return NaN;
  if (x === -1) return -Infinity;
  if (x === Infinity) return Infinity;
  if (Math.abs(x) < 1e-10) return x - (x * x) * 0.5;   // keeps ±0
  const u = 1 + x;
  if (u === 1) return x;
  return log(u) * (x / (u - 1));   // Kahan: exact rounding error compensation of 1 + x
}

// ---------------------------------------------------------------------------------------------- pow / cbrt / hypot
const isOddInt = (y) => Number.isInteger(y) && Math.abs(y) < 9007199254740992 && y % 2 !== 0;
function pow(x, y) {
  x = +x; y = +y;
  if (y !== y) return NaN;
  if (y === 0) return 1;
  if (x !== x) return NaN;
  const ay = Math.abs(y), ax = Math.abs(x);
  if (ay === Infinity) { if (ax === 1) return NaN; return (ax > 1) === (y > 0) ? Infinity : 0; }
  if (x === Infinity) return y > 0 ? Infinity : 0;
  if (x === -Infinity) { const odd = isOddInt(y); return y > 0 ? (odd ? -Infinity : Infinity) : (odd ? -0 : 0); }
  if (x === 0) { const neg = Object.is(x, -0) && isOddInt(y); return y > 0 ? (neg ? -0 : 0) : (neg ? -Infinity : Infinity); }
  const yInt = Number.isInteger(y);
  if (x < 0 && !yInt) return NaN;
  const neg = x < 0 && isOddInt(y);
  let r;
  if (y === 1 || ax === 1) r = ax;
  else if (y === 2) r = ax * ax;
  else if (y === 0.5) r = Math.sqrt(ax);
  else if (y === -1) r = 1 / ax;
  else if (yInt && ay <= 64) {   // binary exponentiation (small integer exponents: few roundings)
    let b = ax, e = ay, acc = 1;
    for (;;) { if (e % 2 === 1) acc *= b; e = Math.floor(e / 2); if (e === 0) break; b *= b; }
    r = y < 0 ? 1 / acc : acc;
  } else {
    // exp(y · log x) with log x as a double-double and y · log x as an exact product
    const lm = logParts(ax), k = LG_K;
    const a = k * LN2_HI, hi = a + lm;
    const lo = ((a - hi) + lm) + k * LN2_LO;
    let p, e;
    if (Math.abs(y) < 1e290 && Math.abs(hi) < 1e290) { p = twoProd(y, hi); e = TP_E + y * lo; } else { p = y * hi; e = 0; }
    if (p > 709.782712893384 + 1) r = Infinity;
    else if (p < -745.1332191019412 - 1) r = 0;
    else r = exp(p) * (1 + e);
  }
  return neg ? -r : r;
}
function hypot(a, b) {
  const n = arguments.length;
  if (n === 2) {
    a = Math.abs(+a); b = Math.abs(+b);
    if (a === Infinity || b === Infinity) return Infinity;
    if (a !== a || b !== b) return NaN;
    const m = a > b ? a : b;
    if (m === 0) return 0;
    if (m < 1e150 && m > 1e-150) return Math.sqrt(a * a + b * b);
    const p = a / m, q = b / m;
    return m * Math.sqrt(p * p + q * q);
  }
  const v = new Array(n);
  let inf = false, nan = false, m = 0;
  for (let i = 0; i < n; i++) { const t = Math.abs(+arguments[i]); v[i] = t; if (t === Infinity) inf = true; else if (t !== t) nan = true; else if (t > m) m = t; }
  if (inf) return Infinity;
  if (nan) return NaN;
  if (m === 0) return 0;
  let s = 0;
  if (m < 1e150 && m > 1e-150) { for (let i = 0; i < n; i++) s += v[i] * v[i]; return Math.sqrt(s); }
  for (let i = 0; i < n; i++) { const q = v[i] / m; s += q * q; }
  return m * Math.sqrt(s);
}

// ---------------------------------------------------------------------------------------------- hyperbolic
function sinh(x) {
  x = +x;
  if (x !== x || x === 0 || x === Infinity || x === -Infinity) return x;
  const a = Math.abs(x), h = x < 0 ? -0.5 : 0.5;
  if (a < 22) {
    if (a < TINY) return x;
    const t = expm1(a);
    return a < 1 ? h * (2 * t - (t * t) / (t + 1)) : h * (t + t / (t + 1));
  }
  if (a < 709.782712893384) return h * exp(a);
  const w = exp(0.5 * a);
  return (h * w) * w;
}
function cosh(x) {
  x = +x;
  if (x !== x) return NaN;
  const a = Math.abs(x);
  if (a === Infinity) return Infinity;
  if (a < 0.34657359027997264) {
    if (a < TINY) return 1;
    const t = expm1(a), w = 1 + t;
    return 1 + (t * t) / (w + w);
  }
  if (a < 22) { const t = exp(a); return 0.5 * t + 0.5 / t; }
  if (a < 709.782712893384) return 0.5 * exp(a);
  const w = exp(0.5 * a);
  return (0.5 * w) * w;
}
function tanh(x) {
  x = +x;
  if (x !== x) return NaN;
  if (x === Infinity) return 1;
  if (x === -Infinity) return -1;
  const a = Math.abs(x);
  if (a < TINY) return x;
  let z;
  if (a >= 22) z = 1;
  else if (a >= 1) z = 1 - 2 / (expm1(2 * a) + 2);
  else { const t = expm1(-2 * a); z = -t / (t + 2); }
  return x < 0 ? -z : z;
}

// cbrt scaling factors: a·2^999 / a·2^-999, cube root scaled back by 2^∓333
const C_UP = pow2(999), C_DN = pow2(-999), C_BACK_UP = pow2(-333), C_BACK_DN = pow2(333);
function cbrt(x) {
  x = +x;
  if (x !== x || x === 0 || x === Infinity || x === -Infinity) return x;
  let a = Math.abs(x), back = 1;
  if (a < 1e-290) { a *= C_UP; back = C_BACK_UP; } else if (a > 1e290) { a *= C_DN; back = C_BACK_DN; }
  let r = exp(log(a) / 3);
  r = r - (r * r * r - a) / (3 * r * r);
  r *= back;
  return x < 0 ? -r : r;
}

export const DET = { sin, cos, tan, asin, acos, atan, atan2, exp, log, log2, log10, pow, hypot, cbrt, expm1, log1p, sinh, cosh, tanh };
export const DET_NAMES = Object.keys(DET);

// ---------------------------------------------------------------------------------------------- install / uninstall
const NATIVE = {};
for (const k of DET_NAMES) NATIVE[k] = Math[k];
let depth = 0;
/** Swap the deterministic versions into Math (nestable). */
export function install() {
  if (depth++ > 0) return false;
  for (let i = 0; i < DET_NAMES.length; i++) Math[DET_NAMES[i]] = DET[DET_NAMES[i]];
  return true;
}
/** Restore the native Math functions (when the outermost install() is undone). */
export function uninstall() {
  if (depth === 0) return;
  if (--depth > 0) return;
  for (let i = 0; i < DET_NAMES.length; i++) Math[DET_NAMES[i]] = NATIVE[DET_NAMES[i]];
}
export const installed = () => depth > 0;
/** Run fn with deterministic Math installed. */
export function withDet(fn) { install(); try { return fn(); } finally { uninstall(); } }
export { NATIVE };

// ---------------------------------------------------------------------------------------------- import time
/**
 * Exact replica of V8's Math.hypot (src/builtins/math.tq MathHypot: normalise by the largest magnitude, Kahan-
 * compensated sum of squares, sqrt · max). Bit-identical to Chrome's native results (verified on 10^6 inputs), and the
 * same bits on every other engine. Used while the sim/AI modules EVALUATE (importmath.js): module-level tables such as
 * mt/ai/geo.js's lane lengths are then identical on Chrome and Safari, and Chrome computes exactly what it always did.
 */
export function hypotV8() {
  const n = arguments.length;
  if (n === 0) return 0;
  const abs = new Array(n);
  let nan = false, max = 0;
  for (let i = 0; i < n; i++) { const v = +arguments[i]; if (v !== v) { nan = true; abs[i] = 0; } else { const a = Math.abs(v); abs[i] = a; if (a > max) max = a; } }
  if (max === Infinity) return Infinity;
  if (nan) return NaN;
  if (max === 0) return 0;
  let sum = 0, comp = 0;
  for (let i = 0; i < n; i++) { const x = abs[i] / max, s = x * x - comp, p = sum + s; comp = (p - sum) - s; sum = p; }
  return Math.sqrt(sum) * max;
}
/** transcendental calls made while modules evaluated (importmath.js): [name, count] — anything but hypot is engine-dependent */
export const IMPORT_CALLS = new Map();
let importDepth = 0;
export function importBegin() {
  if (importDepth++ > 0) return;
  for (const k of DET_NAMES) {
    if (k === 'hypot') { Math.hypot = function () { IMPORT_CALLS.set('hypot', (IMPORT_CALLS.get('hypot') || 0) + 1); return hypotV8.apply(null, arguments); }; continue; }
    const nat = NATIVE[k];
    Math[k] = function () { IMPORT_CALLS.set(k, (IMPORT_CALLS.get(k) || 0) + 1); return nat.apply(Math, arguments); };
  }
}
export function importEnd() {
  if (importDepth === 0 || --importDepth > 0) return;
  for (const k of DET_NAMES) Math[k] = NATIVE[k];
  if ([...IMPORT_CALLS.keys()].some((k) => k !== 'hypot') && typeof console !== 'undefined') console.warn('[detmath] engine-dependent Math at module load:', JSON.stringify([...IMPORT_CALLS]));
}
