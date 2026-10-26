// mt/net/importmath.js — FIRST import of mt/sim/index.js. Owner: netplay.
// While the sim / AI / data modules evaluate, Math.hypot is the exact V8 algorithm (detmath.js hypotV8) on every engine
// and every other transcendental call is counted: module-level tables (mt/ai/geo.js lane lengths) then hold the same
// bits on Chrome and Safari, which an online lockstep match needs; on Chrome nothing changes. importmath-end.js (the
// LAST import of mt/sim/index.js) restores the native functions. ES modules evaluate their imports in order, depth first.
import { importBegin } from './detmath.js';
importBegin();
// build.js lists the sim modules this page loaded from Resource Timing: keep every entry (default buffer: 250)
try { if (typeof performance !== 'undefined' && performance.setResourceTimingBufferSize) performance.setResourceTimingBufferSize(5000); } catch { /* old engine */ }
