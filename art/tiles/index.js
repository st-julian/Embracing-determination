// game/art/tiles/index.js — procedural pixel-art WORLD tileset + layout raster (look-dev). Owner: pixel-world look-dev.
// Usage + integration notes: tools/pixelworld-mock.mjs header and world.js header. Pure JS, no canvas: runs in Node (tools/pixelworld-mock.mjs) and in a worker/browser.
export * from './core.js';
export { PAL, teamRamp, paveRamp } from './palette.js';
export { TILE, FACE, LAYERS, maskAt, grassCol, lawnCol, floorCol, dirtCol, sandCol, waterCol, paveCol, tallBlade, cliffCol } from './ground.js';
export * as props from './props.js';
export * as bld from './buildings.js';
export { buildWorld, renderView, composite, wangTile, materialSwatches, classify, MAPDATA, PPM } from './world.js';
