// mt/net/predict.js — render-only prediction of THIS page's trainer during an online match. Owner: netplay.
//
// The lockstep applies my commands D ticks late (66–150 ms on a good connection). To make movement feel as immediate
// as solo play, the renderer is shown where my trainer WILL be once the commands I already issued take effect:
// the sim position extrapolated D ticks ahead with my own queued inputs (they are exactly the ones the sim will apply)
//   * dir (stick / joystick / WASD): velocity = dir · speed (the legacy moveDir: speed · min(1, |dir|))
//   * move (click / tap): toward the point, stopping there
//   * anything else queued (attack, cast, capture, recall...): no extrapolation (we cannot know where it leads)
//   * the order already running in the sim: its ACTUAL velocity (walls, slows, collisions included)
// The shown position is smoothed (35 ms, absolute — no overshoot at stops) and the offset capped (1.6 m); facing / walk
// animation follow the newest intent at once.
// Dead, dashing, recalling, or a bot-controlled trainer: no offset.
//
// Applied by swapping the unit's render-read fields (x, y, prevX, prevY, facing, moving, speedNow) for the frame's
// update + render pass only ([MT-HOOK] netVisual in the main loop) and restoring them before anything else runs —
// before every tick (online.js step / pace) and at the end of the frame — and the world's spatial grid is marked dirty
// so a grid rebuilt from swapped positions during rendering is rebuilt from the real ones. The simulation never
// sees a predicted value: determinism is untouched.

const MAX_OFFSET = 1.6, SMOOTH_S = 0.035, TICK_S = 1 / 30;

export class LocalPredictor {
  constructor() {
    this.ox = 0; this.oy = 0; this.pend = []; this.saved = null; this.spd = 3.6; this.lastIntent = null; this.stats = { frames: 0, maxOffset: 0 };
    this.sx = null; this.sy = null;   // the shown (smoothed) absolute position
  }
  reset() { this.ox = this.oy = 0; this.pend.length = 0; this.lastIntent = null; this.sx = this.sy = null; }
  /** a local command was queued for tick T (lockstep onLocal) */
  note(cmd, T) {
    if (!cmd || !Number.isInteger(T)) return;
    const k = cmd.type;
    const e = k === 'dir' ? { T, k, dx: +cmd.dx || 0, dy: +cmd.dy || 0 }
      : k === 'move' ? { T, k, x: +cmd.x, y: +cmd.y }
        : k === 'stop' ? { T, k }
          : { T, k: 'other' };
    if (e.k === 'move' && !(Number.isFinite(e.x) && Number.isFinite(e.y))) e.k = 'other';
    this.pend.push(e);
    if (this.pend.length > 64) this.pend.splice(0, this.pend.length - 64);
  }
  /** the velocity (m/s) an order gives at position (px, py) */
  vel(o, px, py, actual) {
    if (!o) return [0, 0];
    if (o.k === 'dir') {
      let m = Math.hypot(o.dx, o.dy);
      if (m < 0.1) return [0, 0];
      const s = this.spd * Math.min(1, m); m = m || 1;
      return [o.dx / m * s, o.dy / m * s];
    }
    if (o.k === 'move') {
      const dx = o.x - px, dy = o.y - py, d = Math.hypot(dx, dy);
      if (d < 0.15) return [0, 0];
      const s = Math.min(actual > 0.3 ? actual : this.spd, d / TICK_S);
      return [dx / d * s, dy / d * s];
    }
    return [0, 0];
  }
  /**
   * @param {object} u     my trainer (sim unit)
   * @param {number} tickNo the world's current tick
   * @param {number} D     the session's input delay (ticks)
   * @param {number} dt    frame seconds
   * @param {number} [alpha] the frame's interpolation alpha (render shows prevX→x at alpha, i.e. tick tickNo-1+alpha)
   * @returns {{ox:number, oy:number, facing:number|null, moving:boolean, speed:number}}
   */
  pose(u, tickNo, D, dt, alpha = 1) {
    while (this.pend.length && this.pend[0].T <= tickNo) this.lastIntent = this.pend.shift();
    let tx = 0, ty = 0, facing = null, moving = false, speed = 0, ix = 0, iy = 0;
    const blocked = !u || !u.alive || u.dash || u.recallStart != null || u.bot;
    if (!blocked) {
      // speed of this trainer (moveSpeedOf: items, slows, bursts) learned from the sim while it walks by stick
      const ax = (u.x - u.prevX) / TICK_S, ay = (u.y - u.prevY) / TICK_S, act = Math.hypot(ax, ay);
      const so = u.order;
      if (so && so.type === 'dir' && act > 0.3) { const m = Math.min(1, Math.hypot(so.dx, so.dy)); if (m > 0.5) this.spd += (act / m - this.spd) * 0.2; }
      // the sim's running order -> its actual velocity (dir) or toward its point (move); others: 0
      const cur = so && so.type === 'dir' ? { k: 'cur', vx: ax, vy: ay } : so && so.type === 'move' ? { k: 'move', x: so.x, y: so.y } : null;
      // the frame shows the sim at tick (tickNo - 1 + alpha): show instead where it will be D ticks later, i.e.
      // extrapolate from the tick's end position over a horizon of D - 1 + alpha ticks (fractional last step), and
      // offset the INTERPOLATED position by the difference -> smooth in time, no saw-tooth at stops
      const a0 = Math.max(0, Math.min(1, alpha)), H = D - 1 + a0;
      let px = u.x, py = u.y, j = 0, o = cur, vx = 0, vy = 0;
      for (let k = 1; k <= Math.ceil(H - 1e-9); k++) {
        while (j < this.pend.length && this.pend[j].T <= tickNo + k) o = this.pend[j++];
        if (o && o.k === 'cur') { vx = o.vx; vy = o.vy; } else [vx, vy] = this.vel(o, px, py, act);
        const w = Math.min(1, H - (k - 1));
        px += vx * TICK_S * w; py += vy * TICK_S * w;
      }
      while (j < this.pend.length && this.pend[j].T <= tickNo + D) o = this.pend[j++];   // newest intent for the pose
      if (o && o.k !== 'cur') [vx, vy] = this.vel(o, px, py, act);
      ix = u.prevX + (u.x - u.prevX) * a0; iy = u.prevY + (u.y - u.prevY) * a0;
      tx = px - ix; ty = py - iy;
      const l = Math.hypot(tx, ty); if (l > MAX_OFFSET) { tx *= MAX_OFFSET / l; ty *= MAX_OFFSET / l; }
      // pose of the newest intent (what the player is asking for right now)
      speed = Math.hypot(vx, vy);
      moving = speed > 0.3;
      if (moving) facing = Math.atan2(vy, vx);
    }
    // smooth the shown ABSOLUTE position toward the predicted one (smoothing the offset would add the base's own
    // motion during the lag and overshoot at stops); snap on big jumps (respawn, recall, teleport)
    if (blocked) { this.ox = 0; this.oy = 0; this.sx = this.sy = null; }
    else {
      const gx = ix + tx, gy = iy + ty;
      if (this.sx == null || Math.hypot(gx - this.sx, gy - this.sy) > 2.5) { this.sx = gx; this.sy = gy; }
      else { const a = Math.min(1, dt / SMOOTH_S); this.sx += (gx - this.sx) * a; this.sy += (gy - this.sy) * a; }
      this.ox = this.sx - ix; this.oy = this.sy - iy;
      const l = Math.hypot(this.ox, this.oy); if (l > MAX_OFFSET) { this.ox *= MAX_OFFSET / l; this.oy *= MAX_OFFSET / l; this.sx = ix + this.ox; this.sy = iy + this.oy; }
    }
    this.stats.frames++; this.stats.maxOffset = Math.max(this.stats.maxOffset, Math.hypot(this.ox, this.oy));
    return { ox: this.ox, oy: this.oy, facing, moving, speed };
  }
  /** swap the render-read fields of u for the pose (restore with end()) */
  begin(u, tickNo, D, dt, alpha = 1) {
    this.end();
    if (!u) return false;
    const p = this.pose(u, tickNo, D, dt, alpha);
    if (Math.abs(p.ox) < 1e-4 && Math.abs(p.oy) < 1e-4 && p.facing == null) return false;
    this.saved = { u, x: u.x, y: u.y, prevX: u.prevX, prevY: u.prevY, facing: u.facing, moving: u.moving, speedNow: u.speedNow };
    u.x += p.ox; u.prevX += p.ox; u.y += p.oy; u.prevY += p.oy;
    if (p.facing != null) { u.facing = p.facing; u.moving = true; u.speedNow = p.speed; } else if (!p.moving && u.moving && this.lastIntentStops()) { u.moving = false; u.speedNow = 0; }
    return true;
  }
  /** the newest known intent stops the trainer (a 'stop' or a released stick) */
  lastIntentStops() {
    const e = this.pend.length ? this.pend[this.pend.length - 1] : this.lastIntent;
    return !!e && (e.k === 'stop' || (e.k === 'dir' && Math.hypot(e.dx, e.dy) < 0.1));
  }
  /** restore the sim values (idempotent); returns true if something was restored */
  end(world) {
    const s = this.saved;
    if (!s) return false;
    const u = s.u;
    u.x = s.x; u.y = s.y; u.prevX = s.prevX; u.prevY = s.prevY; u.facing = s.facing; u.moving = s.moving; u.speedNow = s.speedNow;
    this.saved = null;
    const w = world || this.world;
    if (w && w.grid) w.grid.dirty = true;   // a grid rebuilt from swapped positions during rendering is rebuilt from the real ones
    return true;
  }
}
