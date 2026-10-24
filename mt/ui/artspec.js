// mt/ui/artspec.js — what the menu screens draw from the sprite library, shared by title.js, lobby.js and the
// offline baker tools/bake-title-art.cjs (pre-baked PNG atlases in mt/ui/title-art/). Owner: front-end screens.
// Pure data + key helpers (no DOM): the baker imports this in node.

import { cleanKey } from './pixelclean.js';

/** title starters (index 1 = Cindle is spotlit first); sil = the one flat near-black tone of its rival silhouette */
export const TITLE_CAST = [
  { id: 'puddlet', pal: 'water', sil: '#0c1428' },
  { id: 'cindle', pal: 'fire', sil: '#1e0d09' },
  { id: 'sproutle', pal: 'grass', sil: '#0c190b' },
];
/** title hero bake: flat tone ramps + a clean 1-art-px outline (pixelclean.js crispSprite) */
export const TITLE_CRISP = { crisp: true, k: 9, minCluster: 4 };
export const TITLE_FRAMES = 8;
/** every raster scale the title layout can pick (L.S in [1, 2.5], 0.25 steps; silhouettes one SIL_STEP smaller) */
export const TITLE_SCALES = [1, 1.25, 1.5, 1.75, 2, 2.25, 2.5];
export const SIL_STEP = 0.5;

/** lobby line-up: trainers of every look × team, crisp bake (same 1-px outline as the title hero), no rim light */
export const TRAINER_CRISP = { crisp: true, k: 12, minCluster: 3 };
export const LOBBY_LOOKS = ['attack', 'healing', 'magic'];
export const LOBBY_TEAMS = ['blue', 'red'];
/** stances (view | anim @ first frame): idle front, idle profile, orb in hand, orb raised */
export const LOBBY_POSES = [{ view: 'down', n: 4 }, { view: 'left', n: 4 }, { view: 'down|throw@3', n: 1 }, { view: 'down|throw@1', n: 1 }];
/** the raster scales the lobby layout snaps to (largest baked scale <= the fitted one) */
export const LOBBY_SCALES = [1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 3];

/** heroFrames cache / bake key (stage.js) */
export function artKey(id, scale, view, clean, rim) {
  return id + '@' + scale + (view ? '/' + view : '') + cleanKey(clean) + (rim === false ? '/n' : '');
}
