// mt/render/camera.js — camera director for the monster-trainer game (DESIGN §2). Owner: camera specialist.
//
// Framing constants (BW-style 3/4 tilt, narrow lens for the pixel sprites) live in the legacy CameraRig constants
// `V` (pipeline-*.js, [MT-HOOK] camera): fov 26°, pitch 52°, distance 24.5 (same ground width as the legacy 38°/16.2
// framing, much less perspective stretch on billboards), lead 0.32 s / max 1.6 m look-ahead.
//
// Modes driven here (the legacy rig keeps doing springs, shake, ground height, shadows, victory cinematic):
//   lobby            free camera drifting slowly over a jungle habitat behind the lobby UI
//   1 local alive    SOLO follow ('free', driven here): frames the trainer AND its active monster with velocity
//                    look-ahead, centred in the screen band left free by the HUD (app.mtHudInsets), zooms out a
//                    little if the monster strays, leans ≤ 2.5 m toward nearby visible enemies, clamped so trainer + monster
//                    stay in a safe rect (touch: x 34–68 % × top bar–56 %, the trainer itself resting slightly up-right of centre, clear of the thumbs); SNAPS (no long lerp) after teleports / scenario setup / respawn
//                    (> 12 m from the current focus). Minimap / legacy look-around drags take priority while held.
//   1 local dead     hold on the death spot for 2.5 s, then SPECTATE: follow the nearest living ally trainer until respawn
//   2+ locals        SHARED camera ('free'): frames every living local trainer (+ look-ahead from their velocity and
//                    pad aim), zooms out with their spread up to ZOOM_MAX (critically damped, no pumping), focus kept
//                    on the map, and LEASH: trainers cannot leave the shared view (pad sticks lose the outward
//                    component; mouse move orders are clamped to the leash box). All locals dead -> spectate an ally.
// Pixel grid (every state): when app.mtPixel = {k, ppm, internalW, internalH} is published (env pixel pipeline), the
//   camera POSITION is snapped each frame to the world-pixel grid of its own view plane (orientation is fixed, so
//   static geometry moves in whole internal pixels and does not swim). The removed sub-pixel residual is published as
//   app.mtPixel.camOffset = [x, y] in INTERNAL pixels (x right, y up): the rendered image sits that far right/up of the
//   ideal image, so an upscale pass can shift its output by (-x, -y) × k screen pixels for smooth sub-pixel scrolling.
// Public: app.mtCamera = this  {mode, spectating, zoom, filterDir(unit, dx, dy), leashBox(unit)}

import { activeUnit } from '../sim/monsters.js';

const DEG = Math.PI / 180;
const ZOOM_MAX = 1.65;          // shared-camera zoom cap (sprites stay readable; world LOD switches at 1.7)
const MARGIN_X = 4.2;           // m kept between a framed trainer and the left/right screen edge
const MARGIN_N = 3.0, MARGIN_S = 1.6; // north (top: sprite + name/HP bars above the feet) / south (bottom) margins
const HUD_INSETS = { top: 0.09, bottom: 0.2 }; // screen fractions hidden by HUD; app.mtHudInsets overrides (HUD publishes)
const LEASH_IN = 1.2;           // leash box is this much tighter than the framing at ZOOM_MAX
const SPECTATE_AFTER = 2.5;     // s of death cam before spectating
const SOLO_ZOOM_MAX = 1.2;      // solo: zoom out at most this much to keep a far monster in frame
const SNAP_DIST = 12;           // m: farther jumps (teleport / respawn / scenario setup) cut instead of lerping
const LEAD_T = 0.32, LEAD_MAX = 1.6; // solo look-ahead (s of velocity, max m)
const FIGHT_R = 18, FIGHT_MAX = 2.5;
const SOLO_MARGIN_X = 3.5;      // solo: m kept between trainer/monster and the left/right edge // solo: lean toward enemies within FIGHT_R m, at most FIGHT_MAX m
const MAP_MIN = 6, MAP_MAX = 114;

const clamp01 = (v) => Math.min(0.45, Math.max(0, +v || 0));

export class SharedCamera {
  constructor(ctx) {
    this.ctx = ctx; this.app = ctx.app;
    this.mode = 'idle'; this.owned = false; this.zoom = 1; this.zoomV = 0; this.spectating = -1;
    this.deadT = 0; this.t = 0; this.cx = 60; this.cy = 60; this.box = null; this.reissue = new Map();
    this.app.mtCamera = this;
  }

  rig() { return this.ctx.pipeline && this.ctx.pipeline.cameraRig; }

  update(f) {
    this.direct(f);
    this.pixelSnap(f);
  }

  direct(f) {
    const rig = this.rig(), w = f.world, app = f.app || this.app;
    if (!rig || !w || !app) return;
    const dt = Math.min(0.1, f.dt || 0); this.t += dt;
    if (f.state === 'lobby') return this.lobby(rig, dt);
    if (f.state !== 'game' && f.state !== 'end') { this.release(rig); return; }
    if (rig.cine) { this.mode = 'cine'; return; } // victory cinematic owns the rig

    const L = app.locals || [];
    const alive = [];
    for (const l of L) { const u = w.units.get(l.unitId); if (u && u.alive) alive.push({ l, u }); }

    if (L.length < 2) {
      this.box = null;
      const l = L[0], u = l && w.units.get(l.unitId);
      if (!u) { if (this.owned) this.release(rig); return; }
      if (!u.alive && f.state === 'game') {
        this.deadT += dt;
        if (this.deadT > SPECTATE_AFTER) return this.spectate(rig, w, u, f, dt);
        this.mode = 'dead'; this.zoomTo(rig, 1.1, dt, false); // hold on the death spot (rig.dead desaturates)
        if (!this.owned) { rig.mode = 'free'; this.owned = true; }
        return;
      }
      this.deadT = 0; this.spectating = -1;
      return this.solo(rig, w, u, f, dt, app);
    }
    // ---- shared camera (2+ locals)
    if (!alive.length) {
      const ref = w.units.get(L[0].unitId);
      this.deadT += dt;
      return this.spectate(rig, w, ref, f, dt, this.deadT < SPECTATE_AFTER);
    }
    this.deadT = 0; this.spectating = -1;
    let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9, lx = 0, ly = 0;
    for (const { l, u } of alive) {
      const x = u.prevX + (u.x - u.prevX) * f.alpha, y = u.prevY + (u.y - u.prevY) * f.alpha;
      minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      lx += (u.x - u.prevX) * 30 * 0.22; ly += (u.y - u.prevY) * 30 * 0.22;
      const a = app.mtAim && app.mtAim[l.slot];
      if (a && a.active) { lx += (a.x - u.x) * 0.18; ly += (a.y - u.y) * 0.18; }
    }
    lx /= alive.length; ly /= alive.length;
    const ll = Math.hypot(lx, ly); if (ll > 1.8) { lx *= 1.8 / ll; ly *= 1.8 / ll; }
    // usable screen band between the top bar and the bottom HUD cards
    const ins = app.mtHudInsets || HUD_INSETS, it = clamp01(ins.top ?? HUD_INSETS.top), ib = clamp01(ins.bottom ?? HUD_INSETS.bottom);
    const free = Math.max(0.35, 1 - it - ib), mid = (it + 1 - ib) / 2; // free band height and centre (0 = top of screen)
    const ext = this.extents(rig, 1);
    const spanY = (maxY - minY) + MARGIN_N + MARGIN_S;
    const needX = ((maxX - minX) / 2 + MARGIN_X) / ext.hw, needY = spanY / (2 * ext.hh * free);
    const want = Math.min(ZOOM_MAX, Math.max(1, needX, needY));
    this.zoomTo(rig, want, dt, !this.owned);
    // centre the group (with its asymmetric margins) in the free band: focus moves south when the band sits high
    const ez = this.extents(rig, rig.zoom);
    let tx = (minX + maxX) / 2 + lx;
    let ty = (minY - MARGIN_N + maxY + MARGIN_S) / 2 + ly + (0.5 - mid) * 2 * ez.hh;
    tx = Math.min(MAP_MAX, Math.max(MAP_MIN, tx)); ty = Math.min(MAP_MAX, Math.max(MAP_MIN, ty));
    rig.mode = 'free'; rig.setFocus(tx, ty, !this.owned);
    this.owned = true; this.mode = 'shared';
    // leash box: max spread that still fits at ZOOM_MAX
    const em = this.extents(rig, ZOOM_MAX);
    this.box = { sx: Math.max(6, 2 * (em.hw - MARGIN_X) - LEASH_IN), sy: Math.max(4, 2 * em.hh * free - MARGIN_N - MARGIN_S - LEASH_IN) };
    if (f.state === 'game') this.enforceLeash(w, alive);
  }

  /** Visible ground half extents (m) around the focus at a zoom (center-of-screen approximation, near side for y). */
  extents(rig, zoom) {
    const cam = this.ctx.camera || rig.camera, aspect = (cam && cam.aspect) || 16 / 9;
    const h = rig.distance * zoom * (rig.aspectScale || 1), t = Math.tan((rig.baseFov || 26) * DEG * 0.5);
    return { hw: h * t * aspect, hh: (h * t) / Math.sin(rig.pitch || 52 * DEG) * 0.86 };
  }

  zoomTo(rig, want, dt, snap) {
    if (snap) { this.zoom = want; this.zoomV = 0; }
    else {
      // critically damped spring (no overshoot), slower when zooming in so it does not pump
      const k = want > this.zoom ? 3.2 : 1.6, x = this.zoom - want, e = Math.exp(-k * dt), v = this.zoomV;
      const tmp = (v + k * x) * dt;
      this.zoom = want + (x + tmp) * e; this.zoomV = (v - k * tmp) * e;
    }
    if (Math.abs(rig.zoom - this.zoom) > 1e-4) rig.zoom = this.zoom;
  }

  /** Usable screen band between the HUD top bar and bottom cards: {free (height fraction), mid (centre, 0 = top)}. */
  band(app) {
    const ins = app.mtHudInsets || HUD_INSETS, it = clamp01(ins.top ?? HUD_INSETS.top), ib = clamp01(ins.bottom ?? HUD_INSETS.bottom);
    return { free: Math.max(0.35, 1 - it - ib), mid: (it + 1 - ib) / 2 };
  }

  /** A player is dragging the minimap / legacy look: let them move the camera. */
  externalLook(app) {
    const reg = app.registry; if (!reg) return false;
    const c = reg.get('controls'); if (c && c.look && c.look.active) return true;
    const ui = reg.get('mt-ui'), mm = ui && ui.hud && ui.hud.mm; if (mm && mm.look) return true;
    const lh = reg.get('hud'), lm = lh && lh.minimap; return !!(lm && lm.drove && this.rig() && this.rig().mode === 'free' && !this.owned);
  }

  /**
   * Where the solo trainer may sit on screen (fractions, y down) and where it rests (cx, cy).
   * Touch: the thumbs own the bottom corners (joystick bottom-left, button cluster bottom-right, card bottom-left), so the
   * trainer stays in the middle band (x 34–68 %), above 56 % of the height, resting slightly up-right of the centre (52 %, 40 %),
   * away from the joystick; its monster only has to stay in `group` (10–90 % × top bar–card). Pad / keys: the band between the
   * top bar and the bottom cards.
   */
  safeRect(app) {
    const ins = app.mtHudInsets || HUD_INSETS, it = clamp01(ins.top ?? HUD_INSETS.top), ib = clamp01(ins.bottom ?? HUD_INSETS.bottom);
    if (app.mtInputMode === 'touch' && app.mtTouch && app.mtTouch.active) {
      const y0 = it + 0.04, y1 = Math.max(y0 + 0.25, Math.min(0.56, 1 - ib - 0.04));
      // the monster may roam wider: the whole free area between the top bar and the bottom card, off the screen edges
      const group = { x0: 0.1, x1: 0.9, y0: it + 0.03, y1: Math.max(y1 + 0.1, Math.min(0.8, 1 - ib - 0.02)) };
      return { x0: 0.34, x1: 0.68, y0, y1, cx: 0.52, cy: Math.min(y1 - 0.08, Math.max(y0 + 0.12, 0.4)), touch: true, group };
    }
    const y0 = it + 0.03, y1 = Math.max(y0 + 0.3, 1 - ib - 0.03);
    return { x0: 0.18, x1: 0.82, y0, y1, cx: 0.5, cy: (y0 + y1) / 2 };
  }

  /** Solo follow: trainer + active monster, look-ahead, HUD-aware centring, snap after big jumps. */
  solo(rig, w, u, f, dt, app) {
    if (this.externalLook(app)) { this.mode = 'look'; this.owned = false; return; }
    const ux = u.prevX + (u.x - u.prevX) * f.alpha, uy = u.prevY + (u.y - u.prevY) * f.alpha;
    let minX = ux, maxX = ux, minY = uy, maxY = uy, cx = ux, cy = uy;
    const pet = w.mt && u.mtTrainer ? activeUnit(w.mt, u) : null;
    if (pet && pet.alive && Math.hypot(pet.x - u.x, pet.y - u.y) < 14) {
      const px = pet.prevX + (pet.x - pet.prevX) * f.alpha, py = pet.prevY + (pet.y - pet.prevY) * f.alpha;
      minX = Math.min(minX, px); maxX = Math.max(maxX, px); minY = Math.min(minY, py); maxY = Math.max(maxY, py);
      cx = ux * 0.6 + px * 0.4; cy = uy * 0.6 + py * 0.4;
    }
    // look-ahead from the trainer's velocity (damped during dashes), smoothed
    let vx = (u.x - u.prevX) * 30, vy = (u.y - u.prevY) * 30; if (u.dash) { vx *= 0.35; vy *= 0.35; }
    let lx = vx * LEAD_T, ly = vy * LEAD_T; const ll = Math.hypot(lx, ly); if (ll > LEAD_MAX) { lx *= LEAD_MAX / ll; ly *= LEAD_MAX / ll; }
    // fight-aware: lean (smoothed, ≤ FIGHT_MAX m) toward visible enemy trainers / monsters nearby so the fight is in frame
    let ex = 0, ey = 0, en = 0, eLo = Infinity, eHi = -Infinity; // eLo..eHi: x span of the enemies within 12 m (touch keeps them on screen)
    for (const e of w.queryUnits(u.x, u.y, FIGHT_R, (q) => q.alive && q.team !== u.team && q.team !== 2 && (q.kind === 'champion' || q.kind === 'monster') && (!q.visible || q.visible[u.team] !== false), [])) { ex += e.x; ey += e.y; en++; if (Math.hypot(e.x - u.x, e.y - u.y) < 12) { eLo = Math.min(eLo, e.x); eHi = Math.max(eHi, e.x); } }
    const fmax = app.mtInputMode === 'touch' ? FIGHT_MAX * 0.7 : FIGHT_MAX; // touch: the trainer must not slide toward the thumbs
    if (en) { let fx = (ex / en - u.x) * 0.25, fy = (ey / en - u.y) * 0.25; const fl = Math.hypot(fx, fy); if (fl > fmax) { fx *= fmax / fl; fy *= fmax / fl; } lx += fx; ly += fy; }
    // safe rect (screen fractions) the trainer + its monster must stay in: clear of the top bar, the bottom card and —
    // in touch play — the joystick (bottom-left) and the button cluster (bottom-right); the group sits at (cx, cy)
    const R = this.safeRect(app);
    const ext = this.extents(rig, 1);
    const G = R.group || R; // the rect the whole group (trainer + monster) must fit in; the trainer itself stays in R
    const needX = ((maxX - minX) / 2 + SOLO_MARGIN_X) / (ext.hw * (G.x1 - G.x0)), needY = ((maxY - minY) + MARGIN_N + MARGIN_S) / (2 * ext.hh * (G.y1 - G.y0));
    // [voxel] touch: the enemies of the fight (within 12 m) stay on screen too (x 7–93 %) while the trainer keeps its rect — zoom out
    // for them (a little past SOLO_ZOOM_MAX: the trainer may not move toward the thumbs, so a foe ~12 m to the side needs it)
    const foes = R.touch && eHi >= eLo;
    const needF = foes ? Math.max((eHi - ux + 1.2) / ((0.93 - R.x0) * 2 * ext.hw), (ux - eLo + 1.2) / ((R.x1 - 0.07) * 2 * ext.hw)) : 0;
    this.zoomTo(rig, Math.min(foes ? SOLO_ZOOM_MAX * 1.12 : SOLO_ZOOM_MAX, Math.max(1, needX, needY, needF)), dt, !this.owned);
    const ez = this.extents(rig, rig.zoom);
    // the point put at (R.cx, R.cy): between the group box (sprite-height margin north) and the trainer-weighted centre;
    // touch weights the trainer itself (the thing you steer stays at the rest point, the monster roams around it)
    const wT = R.touch ? 0.7 : 0.5, bx = (minX + maxX) / 2, by = (minY - MARGIN_N + maxY + MARGIN_S) / 2;
    const gx = bx * (1 - wT) + (R.touch ? ux : cx) * wT, gy = by * (1 - wT) + ((R.touch ? uy : cy) - (MARGIN_N - MARGIN_S) / 2) * wT;
    const tx0 = gx - (R.cx - 0.5) * 2 * ez.hw, ty0 = gy - (R.cy - 0.5) * 2 * ez.hh;
    const jump = !this.owned || rig.mode !== 'free' || Math.hypot(tx0 - rig.focusX, ty0 - rig.focusY) > SNAP_DIST;
    if (jump) { this.leadX = lx; this.leadY = ly; } else {
      const k = 1 - Math.exp(-dt * 2.6);
      this.leadX = (this.leadX || 0) + (lx - (this.leadX || 0)) * k; this.leadY = (this.leadY || 0) + (ly - (this.leadY || 0)) * k;
    }
    let tx = tx0 + this.leadX, ty = ty0 + this.leadY;
    // look-ahead / fight lean may never push the group out of its rect, nor the trainer out of the safe rect (last: wins)
    const clampTo = (Q, x0, x1, y0, y1) => {
      const xLo = x1 + 0.8 - (Q.x1 - 0.5) * 2 * ez.hw, xHi = x0 - 0.8 - (Q.x0 - 0.5) * 2 * ez.hw;
      tx = xLo <= xHi ? Math.min(xHi, Math.max(xLo, tx)) : (xLo + xHi) / 2;
      const yLo = y1 + MARGIN_S * 0.5 - (Q.y1 - 0.5) * 2 * ez.hh, yHi = y0 - MARGIN_N - (Q.y0 - 0.5) * 2 * ez.hh;
      ty = yLo <= yHi ? Math.min(yHi, Math.max(yLo, ty)) : (yLo + yHi) / 2;
    };
    if (foes) { const fLo = eHi + 0.8 - (0.93 - 0.5) * 2 * ez.hw, fHi = eLo - 0.8 - (0.07 - 0.5) * 2 * ez.hw; if (fLo <= fHi) tx = Math.min(fHi, Math.max(fLo, tx)); } // x 7–93 % (the group + trainer clamps below still win)
    clampTo(G, minX, maxX, minY, maxY);
    if (G !== R) clampTo(R, ux, ux, uy, uy);
    tx = Math.min(MAP_MAX, Math.max(MAP_MIN, tx)); ty = Math.min(MAP_MAX, Math.max(MAP_MIN, ty));
    this.rect = R;
    rig.mode = 'free'; rig.setFocus(tx, ty, jump);
    this.owned = true; this.mode = 'solo';
  }

  /** Snap the camera position to the world-pixel grid of the view plane (see header). */
  pixelSnap(f) {
    const app = f.app || this.app, P = app && app.mtPixel, rig = this.rig(), cam = this.ctx.camera;
    if (!P || P.snap === false || !rig || !cam || !cam.quaternion) { if (P) P.camOffset = [0, 0]; return; }
    if (rig.cine) { P.camOffset = [0, 0]; return; } // orbiting: no fixed grid
    const T = this.ctx.THREE, D = rig.viewDist || rig.distance;
    const fov = cam.fov || rig.baseFov || 26;
    const ih = P.gridH || P.internalH || 0; // [env] visible grid height (internalH includes the render margin)
    // [env] the env pipeline publishes the exact grid pitch (lens already corrected by zoomFix so it is 1/32 m at the focus)
    const pxm = P.pxm > 1e-5 ? P.pxm : ih > 0 ? (2 * D * Math.tan(fov * DEG * 0.5)) / ih : (rig.zoom || 1) / (P.ppm || 32);
    if (!(pxm > 1e-5) || !T) return;
    const R = this._R || (this._R = new T.Vector3()), U = this._U || (this._U = new T.Vector3());
    R.set(1, 0, 0).applyQuaternion(cam.quaternion); U.set(0, 1, 0).applyQuaternion(cam.quaternion);
    const p = cam.position, a = p.dot(R), b = p.dot(U);
    const a2 = Math.round(a / pxm) * pxm, b2 = Math.round(b / pxm) * pxm;
    p.addScaledVector(R, a2 - a).addScaledVector(U, b2 - b);
    cam.updateMatrixWorld(); cam.matrixWorldInverse.copy(cam.matrixWorld).invert();
    P.camOffset = [(a - a2) / pxm, (b - b2) / pxm];
    P.pxmSnap = pxm;
  }

  /** Follow a living ally trainer (nearest to `ref`), keeping the legacy death cam for the first seconds. */
  spectate(rig, w, ref, f, dt, holdDeathCam = false) {
    this.zoomTo(rig, 1.1, dt, false);
    if (holdDeathCam) { if (this.owned) { rig.mode = 'free'; } this.mode = 'dead'; return; }
    const team = ref ? ref.team : this.app.viewerTeam;
    let best = null, bd = 1e9;
    const keep = this.spectating >= 0 ? w.units.get(this.spectating) : null;
    if (keep && keep.alive && keep.team === team) best = keep;
    else for (const c of w.champions) {
      if (!c.alive || c.team !== team || (ref && c.id === ref.id)) continue;
      const d = ref ? Math.hypot(c.x - ref.x, c.y - ref.y) : 0;
      if (d < bd || (d === bd && c.id < best.id)) { bd = d; best = c; }
    }
    if (!best) { this.mode = 'dead'; return; } // nobody to watch: keep the death cam
    const first = this.spectating !== best.id;
    this.spectating = best.id; this.mode = 'spectate';
    const x = best.prevX + (best.x - best.prevX) * f.alpha, y = best.prevY + (best.y - best.prevY) * f.alpha;
    rig.mode = 'free'; rig.setFocus(x, y, false); this.owned = true;
    if (first) this.app.fire('spectate', { unitId: best.id, name: best.name });
  }

  lobby(rig, dt) {
    this.mode = 'lobby'; this.box = null;
    if (!this.owned || rig.mode !== 'free') { rig.mode = 'free'; this.owned = true; rig.setFocus(32, 76, true); this.zoom = 1; }
    const s = this.t;
    rig.setFocus(33 + Math.sin(s * 0.05) * 6, 76 - Math.sin(s * 0.037 + 1) * 4, false);
    this.zoomTo(rig, 1.05, dt, false);
  }

  release(rig) {
    if (this.owned && rig.mode === 'free') rig.mode = 'follow';
    this.owned = false; this.box = null; this.spectating = -1; this.mode = 'idle';
    if (rig.zoom !== 1 && !rig.cine) { rig.zoom = 1; this.zoom = 1; this.zoomV = 0; }
  }

  /** Leash box for one local's trainer, from the OTHER living locals. null = unconstrained. */
  leashBox(unit) {
    const app = this.app, w = app.world, B = this.box;
    if (!B || !w || !unit) return null;
    let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9, n = 0;
    for (const l of app.locals || []) {
      if (l.unitId === unit.id) continue;
      const u = w.units.get(l.unitId); if (!u || !u.alive) continue;
      minX = Math.min(minX, u.x); maxX = Math.max(maxX, u.x); minY = Math.min(minY, u.y); maxY = Math.max(maxY, u.y); n++;
    }
    if (!n) return null;
    return { x0: maxX - B.sx, x1: minX + B.sx, y0: maxY - B.sy, y1: minY + B.sy };
  }

  /** Remove the outward component of a move direction at the leash edge (pads). */
  filterDir(unit, dx, dy) {
    const b = this.leashBox(unit); if (!b) return [dx, dy];
    const e = 0.35;
    if ((unit.x <= b.x0 + e && dx < 0) || (unit.x >= b.x1 - e && dx > 0)) dx = 0;
    if ((unit.y <= b.y0 + e && dy < 0) || (unit.y >= b.y1 - e && dy > 0)) dy = 0;
    return [dx, dy];
  }

  /** Clamp move orders (mouse / legacy arrow keys) to the leash box; never pushes a trainer, only limits where it goes. */
  enforceLeash(w, alive) {
    const now = w.time;
    for (const { u } of alive) {
      const b = this.leashBox(u); if (!b) continue;
      const o = u.order; if (!o) continue;
      if (o.type === 'move' || o.type === 'attackMove') {
        const nx = Math.min(Math.max(o.x, Math.min(b.x0, u.x)), Math.max(b.x1, u.x));
        const ny = Math.min(Math.max(o.y, Math.min(b.y0, u.y)), Math.max(b.y1, u.y));
        if (Math.hypot(nx - o.x, ny - o.y) > 0.6 && (this.reissue.get(u.id) || -1) < now - 0.25) {
          this.reissue.set(u.id, now);
          w.command(u.id, { type: o.type, x: nx, y: ny });
        }
      } else if (o.type === 'dir') {
        // keyboard arrows / WASD: stop at the edge (pads are filtered before sending)
        const [dx, dy] = this.filterDir(u, o.dx, o.dy);
        if ((dx !== o.dx || dy !== o.dy) && (this.reissue.get(u.id) || -1) < now - 0.1) {
          this.reissue.set(u.id, now);
          w.command(u.id, { type: 'dir', dx, dy });
        }
      }
    }
  }
}

