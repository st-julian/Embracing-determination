// game/art/tiles/palette.js — the world's limited palette (Gen-4/5 overworld daylight). Owner: pixel-world look-dev.
// Every ramp is dark -> light. Outlines are hue-tinted darks (never black). Hand-picked, then tuned against
// Pokémon HGSS / B2W2 overworld captures: warm sunlit greens, sandy paths, clear blues, soft violet shadows.
import { hex } from './core.js';

const R = (...h) => h.map(hex);

export const PAL = {
  // ground
  grass: R('#2c5a34', '#4a8a3e', '#62a848', '#7cc052', '#9ed466', '#c4e884'),       // [ink, dark, base, light, hi, tip]
  grassB: R('#2c5a34', '#468440', '#5aa046', '#72b850', '#94cc62', '#bce07e'),      // slightly deeper patches
  lawn: R('#2e5c36', '#4c8e44', '#64ac4c', '#74b854', '#98d06a', '#c0e488'),        // base lawns (mown stripes)
  floor: R('#173a2a', '#24502e', '#2e6234', '#3a7438', '#4c8a42', '#64a04c'),       // forest floor on the plateaus
  tall: R('#173c22', '#24602c', '#2f7c34', '#43983c', '#64b44a', '#94d062'),        // tall grass blades
  dirt: R('#6a4428', '#9a6a3c', '#bc8a52', '#d2a466', '#e2bc80', '#f0d49c'),
  sand: R('#8a6c44', '#c0a06a', '#dcc286', '#ead49c', '#f4e4b8', '#fbf2d4'),
  water: R('#1c3e8a', '#2a5cb4', '#3474cc', '#4a90de', '#78b8ee', '#c8ecff'),      // [ink, deep, mid, base, light, foam]
  shallow: R('#2a6aa8', '#3a88c4', '#4ca4d4', '#66bcde', '#8ed4ea', '#d4f6ff'),
  cliff: R('#34282a', '#5a463e', '#7c624e', '#9c8060', '#bc9e74', '#d8c08e'),       // rock face (warm grey-brown)
  rim: R('#2a3a26', '#4a5a36', '#6a7a46'),
  paveBlue: R('#3e4466', '#646c90', '#8890b2', '#a8b0cc', '#c8cee2', '#e4e8f4'),
  paveRed: R('#5a3c3a', '#8a6460', '#ae8a7e', '#c8a898', '#e0c6b4', '#f2e2d2'),
  // flora
  leaf: R('#123422', '#1e5230', '#2a6c36', '#3c8a3e', '#5aa84a', '#86c85e'),
  leafB: R('#103028', '#1a4c36', '#246640', '#32824a', '#4ca058', '#78c06a'),       // cooler canopy variant
  pine: R('#0e2a26', '#173f34', '#1f5840', '#2c724c', '#3e8e58', '#62ac6c'),
  bark: R('#2e1e16', '#4e3220', '#6c4628', '#8a5e34', '#a87a48'),
  flowerR: R('#8a1c2c', '#d83c48', '#f47070', '#ffb0a8'),
  flowerY: R('#8a6010', '#e0a820', '#f8d040', '#fff0a0'),
  flowerW: R('#6a6a8a', '#c0c4dc', '#eef0f8', '#ffffff'),
  flowerP: R('#5a2a7a', '#9a5ad0', '#c48af0', '#ecd4ff'),
  flowerK: R('#8a2a5a', '#d85a94', '#f08ab8', '#ffd4e8'),
  // man-made
  wood: R('#3a2414', '#5e3c20', '#82562e', '#a87440', '#c89a5e'),
  white: R('#4a4e6a', '#9aa0bc', '#c8cce0', '#e8eaf4', '#ffffff'),
  stone: R('#3a3a4a', '#5c5e70', '#80829a', '#a4a8bc', '#c8ccdc', '#e6e8f2'),
  iron: R('#1e2030', '#343850', '#4e546e', '#707896', '#9aa2c0'),
  gold: R('#6a4410', '#a8701c', '#d8a030', '#f4c84a', '#fff0a0'),
  lamp: R('#c87a20', '#f4b840', '#ffe080', '#fff8d0'),
  rock: R('#30303e', '#545466', '#787a8c', '#9ea2b2', '#c4c8d4'),
  blue: R('#141e5a', '#2440a8', '#3a64d8', '#5a8cf4', '#8cb8ff', '#d4ecff'),
  red: R('#5a0e1c', '#a8202c', '#d8403c', '#f46a52', '#ff9c84', '#ffe0d4'),
  // shadows on the ground are drawn by shadeCol(); unit contact shadow ink:
  ink: R('#1a1e34'),
};

/** team colour ramp: 0 blue, 1 red */
export const teamRamp = (t) => (t === 1 ? PAL.red : PAL.blue);
export const paveRamp = (t) => (t === 1 ? PAL.paveRed : PAL.paveBlue);
