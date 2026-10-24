// River boss: Ancient Galeclaw — an elder storm roc (Wind). Built on the Tempestral rig with an ancient
// slate/teal/gold palette, a crown of horns, rune-lit plumage and 1.75x scale.
import { tempestral } from './wind.js';
import { WATERFX } from './water.js';
import { WINDFX } from './wind.js';
import { leafPoly, TAU } from '../parts.js';

export const galeclaw = {
  ...tempestral,
  id: 'galeclaw', name: 'Ancient Galeclaw', line: 'wind', stage: 2, kind: 'boss', types: ['wind'],
  cell: [168, 168], scale: 1.6, shadow: 30, hover: 22,
  mats: {
    blue: { c: '#3d5a6e' }, blueD: { c: '#2a3c50' }, white: { c: '#dfe8e4', dark: 0.75 }, aqua: { c: '#5ff0d8', dark: 0.85 },
    gold: { c: '#e8b84a', hi: true, gloss: true }, talon: { c: '#22232e' }, beak: { c: '#d8c49a', hi: true },
    iris: { c: '#7affea' }, windFx: WINDFX, water: WATERFX, horn: { c: '#efe3c4', dark: 0.8 }, ruff: { c: '#5b7d8c' },
    rune: { ramp: ['#2ad8c0', '#5cf0da', '#a6fff0', '#e6fffb', '#ffffff'], emissive: true, noLine: true, outline: '#1a5a5a' },
  },
  draw(s, P) {
    tempestral.draw(s, P);
    // crown of swept horns (local space of the Tempestral rig after its body tilt)
    const br = P.breathe || 0, t = P.t || 0;
    // storm-feather ruff around the neck (elder mane)
    for (let k = 0; k < 9; k++) {
      const a = (k / 8 - 0.5) * 3.4;
      s.group('ruff' + (k % 3));
      s.card([Math.sin(a) * 4.8, 29.5 + Math.cos(a) * 1.2, 8.5 - Math.cos(a) * 2.5], [Math.sin(a) * 0.75, -0.45, -0.45], [Math.cos(a), 0.2, Math.sin(a) * 0.3],
        leafPoly(8.5 - Math.abs(a) * 0.8, 4.2, { n: 5 }), (u, v) => u > 5.5 ? 'aqua' : 'ruff', { bulge: 0.4 });
    }
    // glowing rune on the chest
    s.group('rune');
    s.ell([0, 22, 9.6], [1.6, 2.4, 0.8], 'rune', { rot: [0.3, 0, 0.78] });
    // slow storm aura ring circling the boss
    const pts = [];
    for (let j = 0; j <= 18; j++) { const a = (j / 18 * 0.8 + t) * TAU; const p = s.proj([Math.cos(a) * 24, 14 + Math.sin(a * 2) * 2, Math.sin(a) * 18]); pts.push([p[0], p[1], (0.5 + Math.sin(j / 18 * Math.PI) * 1.3) * s.S]); }
    s.stroke2(pts, s.proj([0, 14, 0])[2] + 26, 'windFx', { grp: s.group('aura') });
    s.group('crown');
    for (const sd of [-1, 1]) {
      s.tube([[sd * 3.2, 38.5 + br * 0.4, 11, 1.5], [sd * 5.5, 42 + br * 0.4, 7, 1.1], [sd * 7.5, 44 + br * 0.4, 2, 0.6], [sd * 8.5, 43.5, -2, 0.3]], 'horn');
      s.tube([[sd * 4.5, 36 + br * 0.4, 10, 1.1], [sd * 8, 37 + br * 0.4, 7, 0.7], [sd * 10, 36.5, 4, 0.3]], 'horn');
    }
  },
};
export default [galeclaw];
