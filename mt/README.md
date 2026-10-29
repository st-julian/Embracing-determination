# game/mt — Monster Trainer extension layer

Sundered Vale's legacy bundle (`game/assets/*.js`, minified + prettified, three.js r186 inlined, no build step)
is turned into a **3v3 monster trainer MOBA** by this folder of plain ES modules. Rules contract: `docs/DESIGN.md`.
Reverse-engineering notes: `docs/arch/*.md`.

```
game/mt/
  data/            pure data, no world/DOM — shared read-only by everyone
    types.js         type chart, multipliers, colours, legacy element mapping
    species.js       6 lines × 3 forms, base stats, heights, evolve levels
    abilities.js     A1/A2/Final-upgrade numbers per line (+ abilityFor(line, slot, stage))
    balance.js       every other DESIGN number (trainer, specs, capture, XP, evolution, minions, towers, jungle)
    options.js       match options contract: DEFAULT_OPTIONS, normalizeOptions, STARTERS, BOT_SKILL, DIFFICULTY, MODES
  sim/             deterministic simulation (30 Hz, no Math.random / Date.now — use util.rand01)
    index.js         MTWorld hub (= world.mt): hook dispatch, impl table, damage scalers, stats, log, error guard
    util.js          shared helpers (rand01, distances, isPet/isWild/isTrainer, teleport)
    events.js        mt event type names + payload contracts
    roster.js        default 3v3 roster (legacy Tw() delegates here)
    trainers.js      trainer def/conversion, COMMAND ROUTER, potion, spec skills, respawn, HUD cd mirroring
    monsters.js      party records, pet/wild units, stats, pet AI, summon/recall/swap/regroup/faint
    capture.js       capture orb, probability, wobbles, success/fail
    progression.js   XP split, level ups, evolution channel
    combat.js        type multiplier, spec/structure/evolve damage scalars, monster abilities, auto-cast
    minions.js       wave composition, minion stats/names, siege ×2.5 vs structures, minion aggro on pets
    structures.js    tower target priority, +25 %/shot ramp
    jungle.js        habitats, starter meadows, wild level scaling, river boss
    debug.js         world.mt.debug: scenario fixtures, give/setLevel/teleport/advance/summary
    qa.js            world.mt.debug.qa: invariants, DESIGN audit, fuzz, state hash, scripted human (QA), pacing tracker
    rules.js         world.mt.rules: match options (difficulty, QUICK/CLASSIC mode), starters, handicaps (installed first)
    guide.js         objective guide for the UI arrow: app.mtGuide(unitId) -> {id, x, y, ...}
  ai/              trainer bot brain (replaces the legacy bot controller): trainerBot.js (utility brain), team.js
                   (lanes/coordination), assess.js (combat maths), geo.js (map knowledge), overlay.js (?botdebug). docs/AI.md
  i18n/            localization core + DOM side (ja default, en), strings/*.js, fonts/. docs/I18N.md
  render/          'mt-render' subsystem
    index.js         composes parts (guarded)
    sprites.js       pixel sprites for trainers, monsters, minions (atlas pages, shadows, rings, x-ray) — art from game/art/sprites
    painter/index.js placeholder painter (fallback only)
    fx.js            VFX + SFX director; fx-gfx.js (3 GPU batches), fx-atlas.js / fx-art.js (glyphs), fx-kits.js
                     (attacks + abilities), fx-moments.js (capture / evolution / faint / victory), fx-numbers.js (combat text),
                     fx-audio.js (synth SFX)
    camera.js        camera director (follow / shared multi-local camera, leash, pixel snap)
    ambient.js       world animation & ambient life; ambient-gfx.js, ambient-life.js, ambient-atlas.js, ambient-clouds.js
    prewarm.js       shader precompile (app.mtPrewarm): no program compiles inside a visible game frame
  ui/              'mt-ui' subsystem
    index.js         composes parts (guarded)
    hud.js           HUD root (Gen-5 layout); cards.js, topbar.js, minimap.js, plates.js (overhead plates), screens.js
                     (scoreboard, pause menu), victory.js, stats.js, art.js, dom.js, pixelfont.js, tr.js, hud.css
    title.js         title screen (+ title.css, title.worker.js, stage.js hero stage, logo.js)
    lobby.js         local multiplayer lobby (join, team, spec, look, ready, countdown)
    input/           localPlayers.js (app.locals), devices.js (pad normalisation), gamepad.js, keyboard.js, touch.js
                     (+ touch.css, phones/tablets), padnav.js (pad menu navigation), hints.js (controls overlay), reticle.js
```

## File ownership (one owner per file; edit only your files)

| Specialist | Owns |
|---|---|
| Architecture / integration | `mt/sim/index.js`, `mt/sim/util.js`, `mt/sim/events.js`, `mt/render/index.js`, `mt/render/prewarm.js`, `mt/ui/index.js`, `mt/README.md`, `game/index.html`, every `[MT-HOOK]` in legacy files, `tools/mt-smoke.cjs` |
| Balance | `mt/data/balance.js`, numbers in `mt/data/species.js` / `abilities.js` (+ `docs/DESIGN.md` in the same commit) |
| Combat / abilities | `mt/sim/combat.js`, `mt/data/abilities.js` (kinds), `mt/data/types.js` |
| Monsters / party | `mt/sim/monsters.js` |
| Capture | `mt/sim/capture.js` |
| Progression | `mt/sim/progression.js` |
| Trainers / specs | `mt/sim/trainers.js` (the command router lives here: coordinate when adding command types) |
| Lane / minions / structures / jungle | `mt/sim/minions.js`, `mt/sim/structures.js`, `mt/sim/jungle.js` |
| AI | `mt/ai/*` (keep `install(mt)` in trainerBot.js) |
| Gameplay & pacing | `mt/data/options.js`, `mt/sim/rules.js`, `mt/sim/guide.js`, difficulty / mode hooks across `mt/sim/*` + `mt/ai/*`, `docs/BALANCE.md` "Difficulty & pacing", `qa.pacing`, `tools/mt-smoke.cjs --batch/--difficulty/--mode` |
| Sprites / art integration | `mt/render/sprites.js`, `mt/render/painter/*` (art itself: `game/art/` — art agent) |
| VFX / audio | `mt/render/fx*.js` |
| Ambient life (world animation) | `mt/render/ambient*.js` |
| Camera | `mt/render/camera.js` (+ marked `[MT-HOOK]` edits in `pipeline-*.js` CameraRig if needed) |
| HUD | `mt/ui/hud.js`, `cards.js`, `topbar.js`, `minimap.js`, `plates.js`, `screens.js`, `victory.js`, `stats.js`, `art.js`, `dom.js`, `pixelfont.js`, `tr.js`, `hud.css` |
| Front-end screens | `mt/ui/title*.js`, `title.css`, `stage.js`, `logo.js` |
| Localization | `mt/i18n/*` |
| Input / lobby | `mt/ui/input/*`, `mt/ui/lobby.js`, `mt/ui/glyphs.js`, `mt/sim/roster.js` |
| QA | `mt/sim/qa.js`, `mt/sim/debug.js` (additive), `tools/mt-smoke.cjs` (additive), `tools/mt-perf.cjs`, `tools/mt-compat.cjs`, `tools/run-tests.sh`, `tests/` |

Shared helpers (`util.js`, `events.js`) accept additive edits from anyone; announce them.

## Conventions

1. **Never edit legacy files without an `// [MT-HOOK] <name>` marker** on every touched line/block, and keep the
   edit a one-liner that calls into `mt/` (`grep -rn "\[MT-HOOK\]" game/assets` lists them all). Never rename or move
   legacy asset files.
2. Sim code is deterministic: no `Math.random`, `Date.now`, `performance.now`; randomness = `rand01(world, ...keys)`.
   Read other units through `prevX/prevY` when order matters (legacy convention). Don't add/remove units while the
   legacy per-unit loop runs: do structural changes in commands, `preTick`/`postTick`, or `world.schedule(0, fn)`.
3. Register behaviour from your module's `install(mt)` with `mt.on(hook, fn)` / `mt.impl.X = fn` /
   `mt.damageScalers.push(fn)`. Don't monkey-patch other modules' exports.
4. All gameplay numbers live in `mt/data/*`; render/UI never mutate sim state except through `world.command`.
5. Errors: sim hooks run inside `mt.guard` (counted in `world.mt.errors` and `__moba.errors['mt:<hook>']`);
   render/UI parts are guarded per part. Check `__moba.errors` after changes.
6. Every commit must leave the game booting; run `node tools/mt-smoke.cjs --scenarios` (≈1 min) at least.

## How it plugs into the legacy game

* **World** (`index-*.js` class `ww`): the constructor creates `world.mt = installMT(world, legacyApi)` before
  anything else. `legacyApi` (`[MT-HOOK] legacyApi`) hands over internal bundle functions — see the `LegacyAPI`
  typedef in `mt/sim/index.js` (createBaseUnit, dealDamage, heal, addShield, applyCC, addDot, addBuff, getBuff,
  spawnProjectile, startAttack, cancelAttack, isTargetable, edgeDistPrev, isStructure, isDisabled, CHAMPIONS, configs…).
* **Trainers** are legacy `champion` units converted by `trainers.convertToTrainer` (per-unit def clone with DESIGN
  stats, `champion = 'trainer'`, `role` = lane for the bot brain, `mtSprite` hides the 3D model, `mtTrainer` state).
  Legacy movement, pathing, recall, respawn, fog, vision, kill feed and bot command API are reused.
* **Monsters** are legacy `monster` units: pets have `team = trainer.team`, `ownerId`, `mtCtl = true` (AI in
  `monsters.js`); wild ones are NEUTRAL with `camp`, driven by the legacy jungle AI. Both have `mtSprite`, `subtype = formId`
  (unknown to the legacy creeps renderer, so it skips them) and `unit.mtMon` (see `MonsterState` typedef).
  Party data is on the trainer (`mtTrainer.party`, `PartyRecord` typedef); benched monsters are records only.
* **Subsystems**: `Rk` gained `mt-render` (after champions/vfx, before overlays) and `mt-ui` (after hud).
  Subsystem ctor gets `{THREE, app, scene, camera, renderer, pipeline, registry, world}`; `update(frame)` per rAF.
* **App**: `window.__moba.mt` = `{data, events, roster, debug}`; `__moba.locals` = local human slots.

### `[MT-HOOK]` list (`grep -rn "\[MT-HOOK\]" game/assets`)

| Hook | File / legacy symbol | Calls |
|---|---|---|
| import, legacyApi, world, ready | `index-*.js` top, `ww` ctor | `installMT`, `mt.onWorldReady()` |
| roster | `Tw()` | `MT_NS.roster` → `mt/sim/roster.js` (3v3) |
| slots | `ww` ctor spawn slot `% 5` | `% slots.length` |
| playerUnit | `ww` ctor per player | `mt.onPlayerUnit(unit, player)` → trainer conversion |
| campDefs | `ww` ctor `pC(...)` | `mt.campDefs(list)` → habitats/meadows |
| preTick / postTick | `ww.tick()` | `mt.preTick()` after prev positions; `mt.postTick()` before dead-unit removal |
| unitAI | `ww.tick()` per-unit loop | monsters with `mtCtl` → `mt.unitAI(unit)` else legacy `_C` |
| command | `lw.command` | `mt.command(unit, cmd)` → `true/false` handled, `undefined` = legacy |
| damage (element / scale / post / tag) | `_v` (dealDamage) | `mt.elementMult`, `mt.damageScale`, `mt.onDamage`; HIT event gets `mtEff` |
| kill credit / kill | `yw.kill` | `mt.creditOf(killer)` (pet → trainer), `mt.onKill(victim, originalKiller, credited)` |
| grantXp | `gw.grantXp` | `mt.blockXp(unit)` (trainers never get legacy XP) |
| towerTarget | `LS` | `mt.towerTarget(tower)` |
| campSpawn | `mC` | `mt.spawnCamp(camp, state)` (unit returned un-added) |
| waveComposition / minionSpawn | `QS` / `tC` | `mt.waveComposition(team, lane, waveNo)` / `mt.onMinion(unit)` |
| bodyMass / speedMul | `mw.bodyMass` / `mw.moveSpeedOf` | `unit.mass`, `unit.mtSpeedMul` |
| botPerception | bot `oE.update` | only NEUTRAL monsters count as jungle camps |
| app | `window.__moba` | `$.mt = MT_NS` |
| options ×2 | `Vk` (`app.newMatch`) | `options` → `new ww({options})` → `world.options` → `world.mt.rules` (mt/sim/rules.js) |
| subsystems | `Rk` | `mt-render`, `mt-ui` |
| hideChampionModel ×2 | `champions-*.js` update | skip units with `mtSprite` |
| hideCreepModel | `creeps-*.js` update | minions/monsters with `mtSprite` are drawn by `mt/render/sprites.js` only |
| minionAggro | `nC` (minion aggro class) | `mt.impl.minionAggro(mt, minion, other)` for trainers / mt monsters (`undefined` = legacy) |
| lobby | `qk` main loop | the sim also ticks in state `lobby` (backdrop world) |
| prewarm | `zk` boot (replaces the legacy `compileAsync`) | `app.mtPrewarm.run({reason:'boot'})` — compile with the scene-pass render-target state |
| prewarmHold | `hud-*.js` legacy loading screen | waits while `app.mtPrewarm.busy` (capped 15 s) |
| floatRT / floatRT fallback | three `WebGLExtensions.init` / `RenderTarget` ctor | no `EXT_color_buffer_float` and no `EXT_color_buffer_half_float` → Half/Float colour targets become UnsignedByte (tone curve still in the final pass) |
| compat | `game/index.html` classic `<script>` | Safari/iOS < 16.4 (no class static blocks) or no WebGL 2 → bilingual "please update" panel instead of a black page |
| mtHudRects | `hud-*.js` `rects()` | mt HUD panels occlude legacy overlay bars |
| mtPlates / mtPlatesFlush / mtOwnNumbers | `overlays-*.js` | Gen-5 plates (`mt/ui/plates.js`) and combat text (`mt/render/fx-numbers.js`) replace the legacy ones |
| mtFxMute / mtFxOwnsCC / mtFxTowerLinks | `audio-*.js`, `vfx-*.js` | mt fx draws/synthesizes these instead of the legacy layers |
| camera (5 constants) | `pipeline-*.js` CameraRig `V` | fov 26, pitch 52°, distance, lead (camera owner) |

### mt hooks for modules (`mt.on(name, fn)`; fn receives `mt` first)
`ready()`, `preTick()`, `postTick()`, `playerUnit(unit, player)`, `damage(src, tgt, amount, type, source, elementMult)`,
`kill(victim, killer, credited)`, `command(unit, cmd)` (return non-undefined to consume), `cast(unit, slot, def, aim)`.
Single-owner decisions: `mt.impl.{command, unitAI, elementMult, damageScale, creditOf, blockXp, towerTarget, campDefs,
spawnCamp, waveComposition, onMinion}`. Shared list: `mt.damageScalers`.

### Commands (all via `world.command(trainerUnitId, cmd)`)
`capture{targetId?|x,y, confirm?}` · `swap` · `evolve` · `regroup` · `monsterCast{slot:'a1'|'a2', x?, y?, targetId?}` ·
`monsterAttack{targetId}` · `trainerSkill` · `potion` · plus legacy `move/attackMove/dir/attack/attackNearest/stop/recall/ping`.
Legacy translations for trainers (so the legacy keyboard/mouse controls work): `cast Q/W` → monster moves,
`cast E` → capture, `cast R` → trainer skill, `spell D` → potion, `spell F` → swap; `attack` also focuses the pet;
`buy/sell/levelUp/autoLevel/ward` are refused. Refusals emit `mt_deny{trainer, code, text}`.

### Events (`mt/sim/events.js`)
`mt_capture_throw/_start/_wobble/_success/_fail`, `mt_confirm_replace`, `mt_summon`, `mt_recall`, `mt_swap`,
`mt_evolve_start`, `mt_evolve`, `mt_evolve_cancel`, `mt_level_up` (+ legacy `level_up` with the monster id), `mt_xp`,
`mt_faint`, `mt_monster_cast`, `mt_trainer_skill`, `mt_potion`, `mt_deny`. Monster abilities also emit legacy `fx`
events (`fx` = ability id, `element` = legacy palette key) so the legacy VFX/audio react generically.

Capture / party / progression (capture.js, monsters.js, progression.js; payloads + the shared `MonInfo`
fragment `{rid, form, name, line, stage, level, types}` documented in events.js). Every one carries `trainer` + `team`;
positional ones carry `x, y`; times are absolute `world.time`:
- capture: `mt_capture_throw {travel, landAt, arcHeight, orbId}` → `mt_capture_start` (absorb) → `mt_capture_wobble {n:1..3}`
  (each wobble = one hidden roll, chance p^(1/3)) → `mt_capture_success {slot:'active'|'bench', first, replaced}` |
  `mt_capture_fail {wobbles, angryUntil}`; `mt_capture_miss` (orb never arrived, CD refunded); `mt_capture_ready {chance, band}`
  (HUD "throw now" hint); `mt_confirm_replace {name, level, targetName, targetLevel, until}` (party full).
- party: `mt_summon {from}`, `mt_recall {reason}`, `mt_swap {fromName, toName, until, free}`, `mt_regroup`, `mt_faint {killer,
  until, duration}`, `mt_revive`, `mt_party {reason, activeRid, party[]}` (full snapshot after any change).
- progression: `mt_xp {amount, bench, source, comeback}`, `mt_level_up {prevLevel, evolveReady}`, `mt_evolve_ready {to, toName,
  bench}`, `mt_evolve_start {to, toName, t0, until, bench}`, `mt_evolve` (= "evolve_done": `{from, to, fromName, name, unlocked}`;
  the unit keeps its id), `mt_evolve_cancel {reason:'stunned'|'recalled'|'fainted'|'trainer_dead', refund:true}`.
Commands: `{type:'evolve', bench?:true}` (active if ready, else the ready bench evolves inside its orb).
Fixtures: `mt.debug.setup('capture_sling'|'capture_full'|'evolution_bench')`; helpers `debug.xp(t, n)`, `debug.chance(id)`,
`debug.party(t)`, `debug.events(prefix, t0)`. Unit tests: `node --test tests/progression.test.mjs`.

Combat feedback (combat.js; full payloads in events.js JSDoc) — render these for rich hit/cast feedback:
* `mt_monster_cast` {unit, trainer, slot, ability, kind, aim, element, x,y → tx,ty (target-led), targetId, range, radius,
  width, count, upgraded, surged, manual, cast} — one per cast; legacy `fx` events of the cast share `cast`.
* `mt_hit` {src, tgt, ability ('basic' | ability id | 'burn' | 'surge_field' | ...), slot, element, **eff 'super'|'weak'|null**,
  mult, amount, dmgType, source ('attack'|'ability'|'dot'|'reflect'|'field'), ranged, x,y (target), sx,sy (source), kill, cast}
  — every damage instance dealt BY a monster (the legacy `hit` event additionally carries `mtEff` = mult).
* `mt_status` {tgt, src, status ('stun'|'root'|'slow'|'knockup'|'pull'|'taunt'|'burn'|'shield'|'heal'|'buff'|'cleanse'|'surge'),
  ability, duration, power, x, y}; `mt_field` {id, phase 'start'|'end', ability, element, team, x,y[,x2,y2], radius, until};
  `mt_team_buff` {team, buff:'galeclaw', until, dmgPct}. Live statuses: `world.mt.combat.statusOf(unit)`.
These high-frequency events (`mt_hit`, `mt_status`) go to `world.events` only (not the bounded `mt.log`).

## Platform notes (iPhone / Safari)

* Minimum: Safari / iOS 16.4 (three.js r186 uses class static blocks) with WebGL 2; `game/index.html` shows a bilingual
  message otherwise (`window.__svUnsupported` = `'syntax'|'webgl2'`). Classic-script check — keep it ES5.
* Shaders: `app.mtPrewarm` (mt/render/prewarm.js) compiles every scene material with a render target bound (the scene
  pass never draws to the screen) at boot and 3 frames after each `match`, waits for `KHR_parallel_shader_compile`,
  then forces first use (link + uniform tables) in short slices — on by default on real GPUs, off on software GL
  (`?prewarm=1` / `?prewarm=0` override). Owners with materials that are NOT always in the scene (variants built on
  demand) register them: `app.mtPrewarm.register('my-variant', () => [mesh or material, ...])`. Name your materials
  (`material.name`); unnamed ones are auto-named after their mesh so `renderer.info.programs` is readable.
* No float colour buffers (`globalThis.__mtFloatRT === false`): render targets requested as Half/Float are created as
  UnsignedByte by the floatRT hook (HDR highlights clip, the image still tone-maps correctly).
* Fullscreen: hidden where neither `document.fullscreenEnabled` nor `webkitFullscreenEnabled` (iPhone).

## Match options, starters, objective guide (gameplay & pacing owner: `mt/data/options.js`, `mt/sim/rules.js`, `mt/sim/guide.js`)

Rules: docs/DESIGN.md §2 "Match options", §3 "Starter monster", §15 "Modes"; numbers + measurements: docs/BALANCE.md
"Difficulty & pacing". Everything here is deterministic (roster + seed + sim state only), so online peers agree.

```js
import { DEFAULT_OPTIONS, normalizeOptions, validateOptions, DIFFICULTY_IDS, MODE_IDS, STARTERS, STARTER_IDS, STARTER_LEVEL } from '/mt/data/options.js';
// also: __moba.mt.options (same module)
DEFAULT_OPTIONS                 // { difficulty: 'easy', mode: 'classic', cards: true }
normalizeOptions(o)             // -> { difficulty, mode, cards } (invalid / missing fields -> default; never throws)
validateOptions(o)              // -> { ok, options, errors[] }
STARTERS                        // [{ id:'cindle'|'puddlet'|'sproutle', form, line, types, level, color, role, ranged, stats{hp,atk,def,mag,spd,as,range},
                                //    evolvesTo[], strongVs, weakTo, name (localized getter), a1Name (localized getter) }]
app.newMatch({ seed, players, options })   // options -> world.options -> world.mt.rules.options ([MT-HOOK] options in Vk)
players[i].starter = 'cindle'   // per roster entry; omitted = picked from the seed (team-mates' picks first, varied per team),
                                // 'none' = no monster (fixtures / tests); level = STARTER_LEVEL (3), given on the first tick
lobbyRoster(slots)              // LobbySlot.starter is copied to the entry; defaultRoster(_, _, {starters:false}) = nobody starts with one
```
* `world.mt.rules` (mt/sim/rules.js, installed FIRST): `options`, `mode`, `difficulty`, `quick`, `lanes` (QUICK: `['mid']`),
  `laneActive(lane)`, `humanTeams()` / `pve()` (frozen at match start from the roster's `bot` flags), `starterFor(player)`,
  `botSkill(trainer)` (BOT_SKILL profile), `respawnMult` / `faintMult` / `xpMult` / `hpMult` / `dmgMult` / `comeback(team)`.
* QUICK mode removes the top/bot towers and inhibitors from `world.structures` at match start (HUD / minimap / renderer simply
  never see them) and spawns waves only in mid; `trainer.mtTrainer.starter` = the starter form id the trainer began with.
  The starter arrives through the normal party path (`mt_summon`, `mt_party {reason:'starter'}`) on tick 1.
* Online: the host's match config carries the same `options` and every human's `starter` (mt/net/match.js `go.o` / 6th `pl`
  field, netplay owner); every peer then calls `app.newMatch({seed, players, options})`.
* **Objective guide**: `app.mtGuide(unitId = app.playerId)` (published on the app by rules.js; also `__moba.mt.guide(world,
  unitId)`) → `{id, x, y, targetId, name, key, urgency 0..1, dist, form?, seconds?, now?, chance?, wobbling?, bench?, steps,
  step, t}` with `id` ∈ `respawn | heal | evolve | catch | defend | help | push | lane` — always one while the trainer lives
  (priority: mt/sim/guide.js header). `key` = `'guide.<id>'`, or `'guide.catchNow'` when `now` (weak wild in the capture
  window: throw the orb; `chance` = the roll incl. the player's catch assist); `wobbling` = my orb is on it right now;
  `bench` = 'evolve' for the benched monster (the evolve command evolves it in its orb). `steps` = `{catch, lane, evolve,
  push}`: world time each was REALLY achieved this match (null = not yet; per-match sim state, nothing to store), `step` =
  the first one not done. Read-only, cached per tick — call it every frame. Positions are sim metres (render z = y).
* **Player assists** (DESIGN §2 "Player assists", `ASSIST` in options.js): `rules.assisted(trainer)`, `rules.assist` (the
  profile), `rules.focusHuman(team, target)`, `rules.trainerHpMult(trainer)`, `rules.safeEvolve()`, `rules.captureBonus(trainer)`
  (pass it as `captureChance(u, now, bonus)` to show the chance the throw really rolls), `rules.holdFor(pet, wild)`.
  Event `mt_assist {trainer, team, kind, x, y, ...}` — kind `guard {until}` (respawn guard), `rescue {until}` (low-HP
  shield + haste), `potion` (the monster drank by itself), `credit {victim}` (a team-mate's kill credited to the human),
  `hold {target, until}` (capture window opened: my monster holds its attacks, throw now).
* **Trainer cards** (DESIGN §16; data `mt/data/cards.js` CARDS / DECKS / CARD_RULES, sim `mt/sim/cards.js`, bots
  `mt/ai/cardBot.js`; only with `options.cards`, default true): state `trainer.mtCards = {deck, hand, used, mana, manaMax,
  mulligans}`; commands `{type:'card', slot:0..4, targetId?, x?, y?}`, `{type:'mulligan', idx:[hand indices]}` and
  `{type:'cardMove', from, to}` (both base only); refusals `mt_deny` codes `no_mana | not_base | no_mulligan | bad_target |
  cooldown` (+ `dead`, `cards_off`, and `cards_on` for the old trainer skill while cards are on); events `mt_card_play`,
  `mt_card_refill`, `mt_mulligan`, `mt_card_charge` (payloads: mt/sim/events.js); view `app.mtCards(trainerId = app.playerId)`
  → `{on, hand, shown, mana, manaMax, mulligans, atBase, deckLeft}` (cached per tick); strings `card.<id>.name|desc`,
  `cards.*`, `deny.*`. Online: the codec carries the three commands (`idx` as a bitmask), `options.cards` travels in `go.o`.
* **QUICK time limit** (DESIGN §15): `mt_time_limit {phase:'warn', at, score:[blue, red]}` 60 s before 15:00, then
  `{phase:'end', at, winner, score}` and the loser's Nexus falls (the normal victory flow follows).
* **Spawn ring** (DESIGN §11): `rules.spawnPoint(team, slot)`; trainers spawn / respawn there (`unit.spawnX/spawnY`).
* **Names** (display only, DESIGN §14): bots `unit.name` (localized on every peer) + `unit.mtNameKey` (`'name.<Key>'`);
  humans `unit.mtPlayerNo` (1-based: online seat / local slot) + `unit.mtDefaultName` (true = no typed name: show
  "あなた / You" for the local player, `P<n>` for the others).
* Tests / tools: `tools/mt-smoke.cjs --difficulty easy|normal|hard --mode quick|classic` (any match type) and
  `--batch --seeds 1-8 --humans 1` (win rate of the scripted-human team + `qa.pacing()` first fight / walking % / deaths per
  minute), `--batch --policy masher` (the casual button masher, `qa.masher(trainer)`: deaths, kills, assists, monster KOs,
  first catch / evolution); `__moba.mt.debug.qa.pacing()` in the console; `node --test tests/rules-world.test.mjs`.

## Testing

```
node tools/mt-smoke.cjs                    # full bot-vs-bot 3v3 to a Nexus kill (≈1.5–3 min incl. 25 s boot)
node tools/mt-smoke.cjs --scenarios        # every mt.debug.setup fixture, 8 s each, error check (≈1 min)
node tools/mt-smoke.cjs --seed 3 --shot shots/mt/end.png        # + one rendered frame at the end
node tools/mt-smoke.cjs --scenarios --shot shots/mt/sc.png --w 960 --h 540
node tools/capture.cjs --out shots/x.png --setup "__moba.mt.debug.setup('teamfight')" --hud   # DOM HUD too
```
Exit code: 0 = Nexus fell and no errors, 1 = JS/mt errors, 2 = time cap. The game server must be running
(`python3 -m http.server 8001` in `game/`). Rendering is held (the rAF loop is driven by hand) so the sim runs at
~40× real time; a few full frames (all subsystem updates, render stubbed) run every 60 sim seconds.

In the browser console (`?debug` shows subsystem errors on screen):
```
__moba.mt.debug.setup('capture'|'jungle'|'laning'|'teamfight'|'siege'|'base'|'evolution')
__moba.mt.debug.give(__moba.playerId, 'cindle', 5)      // give a monster
__moba.mt.debug.setLevel(__moba.playerId, 10)          // active monster level
__moba.mt.debug.advance(60)                             // run 60 sim seconds now
__moba.mt.debug.camera(60, 60); __moba.mt.debug.follow()
__moba.mt.debug.summary()                               // stats, parties, errors
__moba.newMatch({ players: __moba.mt.roster('trainer', null, { humans: 0 }) })   // all-bot match
__moba.timeScale = 4                                    // faster live play (legacy loop caps at 8 ticks/frame)
```
