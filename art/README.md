# game/art — procedural pixel-art sprites (Gen-5 / Black-White style)

Everything here is **original art generated in code** (no image files). `game/art/sprites/` is a
dependency-free ES-module library that rasterises a small 3D "rig" (ellipsoids, sphere-swept tubes, polygon
cards, screen-space flame/bolt/water shapes) straight to pixels, then applies pixel-art rules: hand-tuned
hue-shifted 5-tone ramps per material, quantised lighting from the upper-left, screen-space cast shadows,
1px depth-discontinuity inner lines, a 1px coloured selective outline, a 1px rim light on the shadow side,
lone-pixel cleanup and pixel-precise face decals (eyes, mouths). Output is deterministic.

* Preview: `http://localhost:8001/art/preview.html` (`?s=lineup|anim|contact|sheet|minions|trainers|ui|showcase`)
* Node tools (no browser): `node tools/art-render.cjs out.png [zoom] [ids|lines|kinds] [anims]`,
  `node tools/art-atlas.cjs <dir>` (full atlas PNG + timings), `node tools/art-check.cjs` (render every frame, clip check),
  `tools/slot node tools/art-shot.cjs "s=contact" out.png` (preview screenshot), `tools/slot node tools/art-game.cjs` (=capture.cjs + `--eval`).

## Contents

| Group | Ids | Views | Animations (frames) |
|---|---|---|---|
| Monsters (18) | fire `cindle pyrovix infernyx`, water `puddlet tidalon abyssaur`, grass `sproutle fernhorn verdantusk`, electric `sparkit voltail thundrix`, earth `pebbit bouldash terracore`, wind `zephlet galeon tempestral` | `front`, `back` | idle 6, walk 6, attack 6 (hit = frame 3), cast 4, hurt 2 (+ `hurtFlash` 2 in atlases), faint 5; `silhouette` 1 (white, evolution) |
| Minions | `grubling_blue/red` (melee beetle), `spitwing_blue/red` (ranged bat-moth), `shellram_blue/red` (siege ram) | `front`, `back` | idle 6, walk 6, attack 6, hurt 2, faint 5 |
| Trainers | `trainer_attack_*` (Striker), `trainer_healing_*` (Mender), `trainer_magic_*` (Mystic) × `blue/red` | `down`, `up`, `left` | idle 4, walk 6, throw 5 (release = frame 2), hurt 2, defeated 4 |
| Capture orb | `orb` | `front` | idle 4 (spin), open 3, wobble 4, sparkle 4, burst 3 |
| UI | ability icons `fire/basic fire/a1 fire/a2 … wind/a2` (18) + `trainer/rally mend surge capture potion swap evolve recall` (8), 40px default (32–48 ok); type badges (6, h=16); round type icons (16/24px); 96×96 portraits for every sprite id; showcase renders |

Mirrored directions are **not** stored: `front` faces screen-left (flip U for screen-right), `back` faces
screen-right (flip for up-left); trainers `left` flipped = `right`. When flipping, mirror around the anchor:
`anchorX' = w - anchorX`.

## API (`import … from './art/sprites/index.js'`)

```js
buildAtlas(opts?) -> { canvas, pages:[canvas], bitmaps:[{w,h,data}], frames, anims, meta }
  opts.ids        sprite ids (default: all SPRITE_IDS)        opts.views / opts.anims  filters
  opts.flash      add '<id>/<view>/hurtFlash/<i>' (default true)
  opts.silhouette add '<id>/front/silhouette/0' for monsters (default true)
  opts.maxSize 4096, opts.padding 2, opts.canvas false -> bitmaps only (Node/worker)
buildFormAtlas(id, opts?)          lazy per-sprite atlas (30–150 ms)
buildUIAtlas(opts?)                icons + badges + type icons + 96px portraits ('icon/<id>', 'badge/<type>', 'type16/<type>', 'type24/<type>', 'portrait/<id>')
SPECIES_ART[id] -> { id, baseId, variant, name, kind:'monster'|'minion'|'trainer'|'item', line, stage, types, spec,
                     cell, pixelHeight, worldHeight (m), shadowRadius (px), hover (px), views, flipViews, anims:{name:{n,fps,loop,hit}} }
renderSprite(id, view, anim, i, {mode:'flash'|'silhouette', scale}) -> {w,h,data,ax,ay}   (untrimmed padded cell)
renderSpriteTrimmed(id, view, anim, i, {cache:false})                -> tight bitmap, anchor relative to it
renderPortrait(id, {size:96, bg:true, anim, frame}) -> canvas (fits the sprite, element-tinted round backdrop)
renderShowcase(id, {scale, pixel:1, outline2:true}) -> canvas: native high-detail re-raster (finals ~300px tall at 3.5×, trainers 5×)
renderIconCanvas(iconId, size=40)  renderBadgeCanvas(type, h=16)  renderElementIconCanvas(type, size=16)
abilityIconsFor(line) -> ['<line>/basic','<line>/a1','<line>/a2']   ABILITY_NAMES[iconId]   ELEMENT_COLORS
toCanvas(bitmap)  makeCanvas(w,h)  clearCache()
```

`frames[key] = { x, y, w, h, anchorX, anchorY, page }` — pixel rect in the atlas page and the **feet anchor**
(ground contact point between the feet, or the ground point under a hovering creature) relative to the rect's
top-left. Place the sprite so the anchor sits on the unit's ground position.

`anims[id] = { idle:[keys], walk:[…], … (default view), front:{idle:[…],…}, back:{…}, fps:{anim:n}, loop:{anim:bool},
events:{attack:{hit:3}, throw:{hit:2}}, views, flip, shadowRadius, worldHeight, hover }`.

Frame key naming: `<spriteId>/<view>/<anim>/<frameIndex>`, e.g. `infernyx/front/attack/3`,
`trainer_magic_red/left/walk/2`, `spitwing_blue/back/faint/4`, `orb/front/wobble/1`.

## Sizes, scale and anchors

* Nominal cells: juveniles 64², evolved 96², finals 128², minions 48–64, trainers 64 tall, orb 32 (rendered into
  an 18 %-padded canvas and trimmed; nothing ever clips — `node tools/art-check.cjs`).
* Idle heights (px): juveniles 22–40, evolved 36–62, finals 60–101 (Tempestral's spread wings), trainers 45–55.
* **One texel density for everything**: in game every sprite is re-rasterised at `ART_SCALE = 1.25` and placed at
  `PPM = 32` art px per world metre — the same grid as the pixelated world (`app.mtPixel.ppm`). Resulting heights:
  trainers ≈ 1.9–2.1 m, juveniles ≈ 1–1.7 m, evolved ≈ 1.4–2.4 m, finals ≈ 2.4–3.9 m, Ancient Galeclaw ≈ 5.3 m.
  Trainers and juveniles are re-rasterised a further ×1.12 (figure-ground readability), super minions ×1.3
  (frame keys get an `@1.3` suffix only for non-default sizes). Never scale a sprite by a non-integer factor on
  screen; change the raster scale instead.
* Shadow: `shadowRadius` (px) is a suggested blob radius; in metres `shadowRadius / PPM × ~1.15`. Hovering
  forms (`hover > 0`: Zephlet 5, Galeon 12, Tempestral 20, Spitwing 11 px) already include the hover height in the
  sprite, so put the shadow at the anchor (ground) and make it a bit lighter.
* Filtering: `NearestFilter`, no mipmaps, sRGB. Padding between frames is 2px (atlas) / 1px (dynamic in-game atlas).

## In-game integration (game/mt/render/sprites.js, owner: art agent)

* Lazy paged atlas: up to 6 (4 when `navigator.deviceMemory` < 4 GB, or unreported on iOS/iPadOS/touch-primary devices) lazily created 2048×2048 DataTextures (2048 = the WebGL2 guaranteed texture size;
  page index per instance, row-range uploads). A frame needed on screen is baked on demand (one frame, ~1–4 ms,
  ≤10 ms per rendered frame, falling back to an already-baked frame of the same sprite); on-screen ids are queued
  first. The bulk prewarm runs in idle time (`requestIdleCallback`: the lobby / loading screen, spare time between
  frames; the HD density is predicted from the camera rig before the first game frame); in a game frame at most one
  bake step runs, and only when the running per-step cost fits 2 ms. Prewarm never evicts; when every page
  is full an on-demand frame evicts the least recently drawn page (never one drawn this frame; console.info +
  `atlas.stats().evictions`). `sprites.atlas.stats()` = `{pages, frames, fillPct, cpuMB, evictions}`.
* Unit → art id: pets/wild = `mtMon.form` (`orb` while `mtMon.capturing`), trainers =
  `trainer_<spec>_<blue|red>`, minions (when `unit.mtSprite` is set) = `grubling|spitwing|shellram_<team>`
  (super = Shellram ×1.3).
* View/flip from the unit's facing projected on the camera (hysteresis); anim from unit state: faint/defeated
  (`!alive`, from `deathT`), throw (`mt_capture_throw`), hurt (`hitSeq`), cast (`castT`), attack (`attackSeq`;
  frames 0–3 stretched over the wind-up so frame 3 lands on the hit), walk (`moving`, rate ∝ `speedNow`), idle.
  Blink: the idle loops are all open-eyed; a separate 1-frame `blink` anim (monsters + trainers) is shown ~120 ms
  every 3–5 s, staggered per unit. Trainer eyes are solid dark ovals with a 1-px highlight (2×2 when ≥ 8 px).
  Death: faint / defeated plays once, holds, then the sprite sinks into the ground over 0.45 s (rows below the feet
  are cut — never a translucent / dithered fade); monsters are gone 1.5 s after death, trainers 2.3 s.
  Orb: wobble on `mt_capture_wobble`, open on `mt_capture_start`, sparkle/burst flourishes on success/fail, and
  in-flight orbs for `mt_capture_orb` projectiles.
* Pixel-perfect: screen-aligned quads, feet anchor snapped to the pixel grid (the env's internal 32 px/m grid when
  `app.mtPixel` exists), art px quantised to whole grid pixels; depth = feet depth pulled 0.9 m toward the camera.
  With `app.mtPixel` the sprite (and x-ray) fragments write alpha 0.75 = the env outline pass's "sprite" tag: the
  world's geometry outline never touches sprites, which carry their own 1-px dark coloured outline (selout: the
  outline lifts one tone only on the sun-facing side of the silhouette, decided per frame from the sun).
* HD world (no `app.mtPixel`, the default "HD-2D" look): sprites stay pixel art in a smooth lit world. The art
  density is chosen per window size so that at camera zoom 1 one art px is a WHOLE number of screen px and the
  sprite keeps its world size (`dens = basePxPerM / round(basePxPerM / 36)` art px per metre, e.g. ≈29 at 768p,
  ≈41 at 1080p; re-baked only when a resize moves it by > 8 %; scales within 6 % of a whole number snap to it, older frames stay drawable meanwhile). While the
  camera zooms the scale is fractional and the fragment shader lights the 4 nearest texels and blends them sharp-
  bilinear (hard inside a texel, 1-screen-px edge blend): even, crisp pixels without shimmer. In HD the marks are
  smooth anti-aliased screen-resolution shapes (soft AO-like contact shadow, 2-px team ring, fading ripples), the
  sun-projected cast silhouette gets a contact-hardening penumbra (widens with height above the feet), emissive
  glow is stronger for the HD bloom. Attack / cast frames are baked with `noFx` (no projectiles, sparks or
  shockwaves: the VFX layer draws those); `renderSpriteData(id, view, anim, i, { noFx: true })`.
* Ground marks are screen-space pixel ellipses on the sprite's own snapped anchor (crisp at any zoom): a dark
  2-tone contact shadow (not under hovering/wading units' bodies), a bold 2-px team ring (bright outer, dark
  inner; not for minions) and, for the local player's own trainer, a slow outward pulse ring.
* River wading: where `heightAt < WATER_Y (-0.12)` the sprite stands at most 0.34 m deep (deeper beds lift it;
  ≤ 22 % of its height); art rows below the waterline are drawn submerged (water-tinted, swaying ±1 px, no rim /
  spec), the waterline row gets a 1-px foam highlight, and a 1-px foam ring + two expanding dithered ripples wrap
  the body at the waterline (back halves behind the sprite, front halves in front). Hovering forms skim the
  surface (ripples only). The sun-projected cast shadow lands on the water plane and skips submerged rows.
* Clouds: sun visibility × `1 - 0.55·app.mtAmbient.cloudAt(x, z)` (ambient-life drifting cloud shadows).
* Scene light: the sun shadow map (`pipeline.lights.sun`) is sampled 3×3 at each sprite's chest → sun-lit vs
  shade tint (cool, hemisphere-like) and a 1-px sun-side rim on the silhouette; cast shadow = the sprite silhouette
  projected onto the ground along the sun direction (fades in sun shadow) plus the crisp contact shadow below.
* Occlusion ("behind the wall" indicator): only the local player's own trainer and monsters get it. Once a CPU
  heightfield ray from the camera to the unit's chest has been blocked by terrain for 0.3 s, a soft, dark,
  team-tinted silhouette (~34 % fill, no contour line) fades in over 0.15 s on the hidden pixels only (depthFunc
  GREATER against the world depth, ≥ 1.6 m in front); it fades out the same way.

### For the VFX agent — render-only overrides

`registry.get('mt-render').sprites.setOverride(unitId, { flash, scale, hidden, hideUntil, until, tint })` (merges;
`clearOverride(unitId)`; raw map: `sprites.fx`). `flash` 0..1 mixes the sprite toward white (max'd with the
built-in hit/evolve flash), `scale` multiplies the on-screen size around the feet anchor, `hidden` / `hideUntil`
(sim time) skip the sprite + shadow, `tint` = `[r, g, b, amount]` (0..1) mixes toward a colour, `until` (sim time)
auto-removes the override. Use it for summon materialise, capture shrink/pop-out and evolution silhouettes instead
of drawing extra silhouette quads. Built-in evolve pulse: `flash = 0.5 + 0.5·sin(now·(6 + 34·p²))`, p = channel progress.

### For the HUD agent

`game/mt/render/painter/index.js` re-exports cached helpers:
`portraitCanvas(artId, {size, bg})`, `abilityIconCanvas(line, 'basic'|'a1'|'a2', size)`,
`trainerIconCanvas('rally'|'mend'|'surge'|'capture'|'potion'|'swap'|'evolve'|'recall', size)`, `specSkillIcon(spec)`,
`typeBadgeCanvas(type)`, `typeIconCanvas(type, size)`, `showcaseCanvas(artId, {scale})`, `trainerArtId(spec, team)`,
`minionArtId(subtype, team)`, `abilityName(line, slot)`. Portrait ids are the same as sprite ids (form ids,
`trainer_<spec>_<team>`, …). Draw them with `image-rendering: pixelated` and integer CSS scaling.

## Rig / adding a form

A form is `{ id, name, line, stage, types, cell, height, width, shadow, hover?, scale?, yaw?, look?, mats, draw(s, P) }`
(`species/*.js`). `mats` are named base colours (5-tone ramps are generated in OKLCh with hue shifting) plus flags
(`emissive`, `gloss`, `hi`, `noLine`, `th`). `draw` builds the creature in local units (≈ pixels, +z = facing,
y up, feet at 0) through the scene: `s.ell/tube/card/poly2/disc2/stroke2`, `s.push/pop/t/rx/ry/rz/sc`,
`s.group(name)` (inner lines appear between groups), helpers in `parts.js` (`flame`, `featherWing`, `leafPoly`,
`bolt`, `sparks`, `orb`) and `face.js` (`eyes`, `mouth`). Pose `P` comes from `rig.js poseFor()` (breathe, bob,
gait phase, atk −1…1, cast, hurt, faint, eye state, look-at-camera head turn); `leg()` does 2-bone / digitigrade IK
with idle stance; `rootMotion()` applies bob, lunge, recoil, topple.

## Performance

Full atlas (31 sprite ids, ~1890 frames incl. flash/silhouette) builds in ≈1.7–2.6 s in V8 (Node/Chrome); a single
form 30–150 ms; the in-game path never builds more than what is on screen synchronously.
