# Sundered Vale: Monster Trainer Arena

A 3v3 **Monster Trainer MOBA** that runs in the browser. You are a trainer, not a champion. You pick a starter
monster (it begins at Lv 3), weaken wild monsters, catch a second one with a Capture Orb and train both in lane.
You evolve them when you choose to (Lv 5 and Lv 10). Then you take your team of trainers and monsters through the
towers to the enemy Nexus.

It is built on top of the existing *Sundered Vale* three.js MOBA. The map, movement, combat core, camera, bot AI,
renderer, towers and minions were reused and extended, not rewritten. The look is a **detailed voxel take on the
Pokémon Black/White overworld**: a voxel world built from the real map (patterned stone bases, tiled-roof towers,
tree walls, tall grass, a living river) with animated, outlined voxel trainers and monsters. The previous 3D look
is still available with `?world=3d`.

- Japanese is the default language. English: add `?lang=en`, or change *Lang* in the lobby.
- It is controller-first. A PS5 DualSense works out of the box; Xbox and other standard pads work too.
  Phones and tablets get full touch controls, and keyboard and mouse still work.
- Up to 4 local players can share one screen, co-op against bots or in versus. Bots fill the empty slots of
  the six trainers.

## Install & launch

No build step: the game is plain ES modules plus static assets.

```bash
cd game
python3 -m http.server 8000      # any static file server works
# open http://localhost:8000/ in Chrome, Edge, Firefox or Safari (desktop or iOS/iPadOS)
```

Opening `index.html` straight from disk (`file://`) does **not** work, because browsers block ES modules there.
Use a local server.

Useful URL options (combine with `&`):

| Option | Effect |
|---|---|
| `?lang=en` / `?lang=ja` | UI language (default `ja`; remembered) |
| `?quality=low` / `medium` / `high` | render quality (default: auto by device) |
| `?world=3d` | the previous 3D world with pixel-sprite units instead of the voxel look |
| `?autostart` | skip the title screen (solo vs bots) |
| `?mtscenario=jungle` / `laning` / `teamfight` / `evolution` / `siege` / `base` / `boss` / `capture` | jump into a prepared match situation (testing and screenshots) |

The original game, before the transformation, is kept in `legacy/` for comparison.

## How to play

0. **Difficulty.** Easy is the default (bots go easier on human players, and your trainer gets extra HP and a low-HP
   rescue). The full map with every tower (CLASSIC) is the default; QUICK (Settings → match length) plays only the
   mid lane, about 35 % faster, with a 15-minute limit.
1. **Title → Play → Lobby.** Join with ✕ (DualSense), A (Xbox), Enter (keyboard) or by tapping. Pick a
   **team** and a **trainer specialisation**, then ready up. Every slot without a human is a bot.
2. **Catch a second monster.** You start with your starter at Lv 3. Wear a wild monster down (your monster stops
   attacking a weakened wild monster for a few seconds so it stays catchable), then throw a **Capture Orb**: the
   lower its HP, the better the odds, and a slowed, rooted or stunned monster is easier to catch. The aim ring
   shows the current catch chance. You can carry **two** monsters, one active and one resting on the bench.
3. **Train.** Monsters gain XP from minions, wild monsters, enemy monsters and trainers, and towers. The benched
   monster also earns 30 % of that XP.
4. **Evolve.** At Lv 5 and Lv 10 the EVOLVE button lights up and you choose the moment. Evolving takes 1.2 s
   (on Easy and Normal the monster is safe meanwhile and heals 30 %) and gives a new look, +35 % stats and a new
   or upgraded move.
5. **Win.** Push lanes with your minion waves, destroy the outer and inner towers, then an inhibitor and the
   Nexus towers, then the **Nexus**.

### Monsters & elements
There are six lines with three forms each (Juvenile → Evolved Lv 5 → Final Lv 10). Some final forms gain a
second type.

| Line | Forms | Type | Role |
|---|---|---|---|
| Fire | Cindle → Pyrovix → Infernyx | Fire (Final Fire/Wind) | ranged burst mage |
| Water | Puddlet → Tidalon → Abyssaur | Water | sustain bruiser |
| Grass | Sproutle → Fernhorn → Verdantusk | Grass (Final Grass/Earth) | tank / zone control |
| Electric | Sparkit → Voltail → Thundrix | Electric (Final Electric/Wind) | fast ranged DPS |
| Earth | Pebbit → Bouldash → Terracore | Earth | siege bruiser (+40 % vs structures) |
| Wind | Zephlet → Galeon → Tempestral | Wind (Final Wind/Water) | diver / assassin |

Type chart: a super-effective hit does ×1.5 and a resisted hit does ×0.67. With two types the multipliers
stack, clamped to ×0.45–×2.25. Fire beats Grass and Wind; Water beats Fire and Earth; Grass beats Water and
Earth; Electric beats Water and Wind; Earth beats Electric and Fire; Wind beats Grass and Earth. Swapping to the
right monster for the fight is a large part of the game.

### Trainer specialisations
| Spec | Passive | Skill |
|---|---|---|
| Attack | monster ATK +18 %, attack speed +12 %, lifesteal | **Rally**: big attack-speed and speed burst |
| Healing | monster HP and DEF +15 %, double regen, sturdier trainer | **Mend**: heal monster and trainer, cleanse |
| Magic | monster MAG +20 %, cooldowns −20 %, super-effective ×1.65 | **Surge**: next move +60 % and leaves an elemental field |

### Other rules
- **Minions**: three kinds (melee Grubling, ranged Spitwing, siege Shellram). Waves come every 30 s, with a
  siege minion every 3rd wave.
- **Jungle**: six element habitats plus starter meadows. The river boss **Ancient Galeclaw** gives the whole
  team +15 % damage for 90 s.
- **Fainting and respawning**: a fainted monster is never lost; it comes back after a short timer. A trainer
  who dies respawns at the fountain and cannot command monsters until then.
- **Comeback**: a team behind on XP gets +15 % XP. Kill XP is split between the monsters that took part.

## Controls

### PS5 DualSense (default) / Xbox pad
| Action | DualSense | Xbox |
|---|---|---|
| Move | left stick | left stick |
| Aim / cycle target | right stick | right stick |
| Monster attack | ✕ | A |
| Capture Orb | ○ | B |
| Move 1 / Move 2 | □ / △ | X / Y |
| Swap monster | L1 | LB |
| Trainer skill | R1 | RB |
| Potion | L2 | LT |
| Lock target | R2 | RT |
| Evolve | D-pad ↑ | D-pad ↑ |
| Regroup (monster returns) | D-pad ↓ | D-pad ↓ |
| Recall to base | D-pad ← | D-pad ← |
| Scoreboard | Create / D-pad → | View / D-pad → |
| Pause | Options | Menu |

### Touch (phones & tablets, landscape)
- **Floating joystick** on the left half of the screen to move.
- **Bottom right**: the big ATTACK button. Around it, MOVE 1 and MOVE 2 and the CAPTURE ORB; drag them to aim,
  and the orb shows the catch chance while you aim. Also SKILL, POTION, SWAP and TARGET, plus EVOLVE when
  evolution is ready.
- **Top left**: Menu ≡, Scores, RECALL and REGROUP. Tap the bench monster on your card to swap.
- In portrait the game asks you to rotate the device. Safe areas such as the notch and home bar are respected.

### Keyboard & mouse
Right-click to move or attack. Space attacks the nearest enemy, E throws the orb at the cursor, Q and W are
moves 1 and 2, F swaps, R is the trainer skill and D a potion. Tab locks a target, T evolves, G regroups,
B recalls, hold Shift or ` for the scoreboard, and Esc pauses.

WASD mode is set in the lobby or toggled with F1. WASD moves, Q and E are moves 1 and 2, C throws the orb,
and X or 1 drinks a potion.

### Local multiplayer
Plug in up to four controllers (or three plus keyboard). Each player presses ✕ / A in the lobby and picks a
team.
- **Co-op**: all humans on one team. They share one camera that frames everyone, with a leash, and fog of war
  stays on.
- **Versus**: humans on both teams. Fog of war is off on the shared screen.
- Every local player gets their own colour-coded HUD card.

## Project layout
```
game/                 the playable build (serve this folder)
  index.html          original entry, unchanged except module hooks
  assets/             original (prettified) game bundle + textures; hooks marked // [MT-HOOK]
  mt/                 Monster-Trainer extension layer
    data/             species, abilities, types, balance numbers
    sim/              capture, progression, monsters, combat, trainers, minions, structures, jungle, roster, QA hooks
    ai/               bot trainer brains + team coordination
    render/           lit pixel-sprite renderer, VFX, ambient life, camera
    ui/               HUD, cards, minimap, plates, lobby, victory, input (gamepad / touch / keyboard / local players)
    i18n/             Japanese (default) + English strings, pixel font subset (OFL)
  art/sprites/        procedural pixel-art generator for every trainer, monster form and minion
docs/                 DESIGN (rules contract), STATUS, QA, AI, BALANCE, I18N, architecture notes
blindtest/            blind A/B toolkit, critic prompts, per-round ledgers, REPORT.md
tools/                headless capture, smoke tests (scenarios, full bot match, determinism), pad and touch tests
shots/                screenshots from every development round
legacy/               the untouched original build
PROGRESS.md           what was done, open gaps, every blind-test round
```

## Tests
These need Node and Playwright with Chromium. `tools/slot` limits how many browsers run at once.
```bash
tools/run-tests.sh                                  # full suite
tools/slot node tools/mt-smoke.cjs --scenarios      # 13 match situations, JS errors and invariants
tools/slot node tools/mt-smoke.cjs                  # a whole bot match to a Nexus kill
tools/slot node tools/pad-test.cjs                  # DualSense / Xbox / local players
tools/slot node tools/touch-test.cjs                # phone / tablet touch layout + actions
```

## Credits & licences
- **Original game:** *Sundered Vale* (the provided build), with its bundled textures.
- **Pixel font:** a subset of GNU Unifont (SIL OFL 1.1, `game/mt/i18n/fonts/LICENSE`).
- **Art:** all voxel models (world, structures, trainers, monsters, minions) are generated procedurally in code
  (`game/mt/voxel/`, baked by `tools/voxel-bake.mjs`), and the pixel art by `game/art/sprites/`. No Nintendo or
  Riot assets ship in this project.
- **Blind-test references:** the screenshots of Pokémon Black/White and League of Legends: Wild Rift used for
  blind comparisons were private references only. They are **not** included in the distributed ZIP.
