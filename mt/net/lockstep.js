// mt/net/lockstep.js — deterministic-lockstep session for ONLINE matches. Owner: netplay. No DOM: runs in node tests.
//
// Every peer runs the identical world. A tick T may run only when every peer's inputs for T are known:
//   * local human commands issued between ticks (UI, pads, touch, legacy controls) are NOT applied: world.command
//     returns true and they are queued for tick  max(tickNo + D, upTo + 1)  (D = adaptive input delay, 2..12 ticks:
//     2-3 on a good connection; online.js hides the rest with render-only prediction of the local trainer)
//   * each peer publishes in its room presence  u  (= upTo: "all my commands up to this tick are final"), the window
//     c  of its commands not yet acknowledged by everyone, and  a  (its acks: the  u  it has received from each slot)
//   * right before tick T, EVERY peer applies all peers' commands for T in canonical order (slot, issue order) from
//     their decoded wire form (the sender included), then runs world.tick() with deterministic Math (detmath.js)
//   * commands issued INSIDE a tick (bot AI, pets) pass through untouched: they happen identically everywhere
// Drop-tolerant by construction: presence is absolute state, merged monotonically (u / acks only grow), commands stay
// in the window until every peer acknowledged them. The window carries the upTo it was built for in its own header
// (c[0] = ['h', U, F]: complete for (F, U]) and the receiver takes U from there, never from the separate u key:
// presence travels as key PATCHES, and a patch lost or applied out of order must never pair a newer u with an older
// window (that silently dropped a command and desynced the WebRTC net-test once).
//
// Also here: per-tick state hash + 2 s checkpoints (desync detection, first diverging tick), adaptive D from measured
// round trips (ack based) + "you kept me waiting" feedback (wo), catch-up pacing (a peer that fell behind runs up to
// 2 ticks per frame; nobody slows down for it), stall accounting, and bot takeover:
// a peer that left / went silent 8 s is announced by the acting host (lowest live slot) as "slot S is a bot from tick
// T, its last commands end at U" after every live peer stopped reading S (gn) — peers missing commands ≤ U get them
// from the others' relays (rl).
//
// Presence fields written by patch() (named game room; the controller merges lobby fields):
//   m mid · s slot · u upTo · k tick · c [['h', U, F], [tick, ...enc]...] · a [ack per slot] · h [tick, hash] · hb heartbeat ·
//   dl D · w 1 while waiting · wo bitmask of the slots I am waiting for · aw 1 while my page is hidden (another app) ·
//   gn [gone slots] · bt [[slot, T, U]] (acting host) · rl [[slot, F, U, [[tick, ...enc]]]] ·
//   dh [tick0, [hash...]] (after a desync) · x 1 when replaced by a bot

import { encode, decode, COALESCE, REFUSED_FOR_TRAINERS, utf8Len } from './codec.js';
import { install as detOn, uninstall as detOff } from './detmath.js';
import { activeUnit } from '../sim/monsters.js';

export const TICK_MS = 1000 / 30;
export const D_MIN = 2, D_MAX = 12, D_INIT = 5;
/** presence publish interval per transport: the claude.ai room coalesces to ~30/s itself; our WebRTC star does not */
export const LINK_GAP = { room: 33, mock: 33, peer: 16 };
export const CHECK_EVERY = 60;          // desync checkpoint period (ticks, 2 s)
const HIST = 900;                       // received commands kept this many ticks (relays)
const RING = 128;                       // per-tick hashes kept (first diverging tick)
export const SILENT_MS = 8000;          // presence unchanged (heartbeat included) for this long = gone
export const AWAY_MS = 20000;           // ... for a peer that said its page went to the background (iPad app switch)
const SILENT_NEVER_MS = 30000;          // ... for a peer that never showed up in this match (loading)
const GONE_WAIT_MS = 3000;              // acting host waits this long for every live peer's gn before deciding
const LEFT_GRACE_MS = 2500;             // missing from the room's peer list this long = left (reconnects are brief)
const MAX_PER_TICK = 6, WINDOW_BYTES = 2600, MAX_BACKLOG = 0.1;   // backlog: <= 3 ticks after a stall (no bursts)
const LATE_WINDOW_MS = 2000;            // "you kept me waiting" reports counted over this window -> +1 tick of D

/** cheap per-tick state hash (units, positions 1/256 m, hp 1/16, projectiles); 32-bit base-36 */
export function fastHash(w) {
  let h = 0x811c9dc5 | 0;
  const mix = (v) => { h = Math.imul(h ^ (v | 0), 16777619); };
  mix(w.tickNo); mix(w.winner == null ? -1 : w.winner); mix(w.unitList.length); mix(w.projectiles ? w.projectiles.length : 0);
  for (const u of w.unitList) {
    mix(u.id); mix(Math.round(u.x * 256)); mix(Math.round(u.y * 256)); mix(Math.round((u.hp || 0) * 16)); mix(u.alive ? 1 : 0);
  }
  if (w.projectiles) for (const p of w.projectiles) { mix(p.id); mix(Math.round(p.x * 256)); mix(Math.round(p.y * 256)); }
  return (h >>> 0).toString(36);
}

const isInt = Number.isInteger;
const okTick = (t) => isInt(t) && t >= 0 && t < 1e8;

export class NetSession {
  /**
   * @param {object} o
   * @param {object} o.world      the match world (identical on every peer)
   * @param {string} o.mid        match id
   * @param {Array<{peer:string, unitId:number, name?:string}>} o.seats   humans in slot order
   * @param {number} o.mySlot
   * @param {() => number} [o.now]   ms clock
   * @param {(w:object)=>string} [o.hash]
   * @param {(w:object, T:number)=>void} [o.onTick]   after every tick (tests: checkpoints)
   * @param {boolean} [o.scriptLocal]  in-tick commands for the LOCAL human unit are local input too (scripted player)
   * @param {boolean} [o.trace]  keep a field-level snapshot of every unit + the applied commands for the last 128 ticks
   *                             (desync forensics: traceAt(T); ?nettrace=1 in the game)
   */
  constructor(o) {
    this.world = o.world; this.mid = o.mid; this.seats = o.seats; this.me = o.mySlot;
    this.now = o.now || (() => (typeof performance !== 'undefined' ? performance.now() : Date.now()));
    this.hash = o.hash || fastHash; this.onTick = o.onTick || null; this.scriptLocal = !!o.scriptLocal;
    this.log = o.log || (() => {});
    const n = this.n = this.seats.length;
    this.slotUnit = this.seats.map((s) => s.unitId);
    this.slotOfUnit = new Map(this.seats.map((s, i) => [s.unitId, i]));
    this.known = new Array(n).fill(0);            // u received per slot (own: upTo)
    this.inbox = this.seats.map(() => new Map()); // slot -> Map(tick -> enc[])
    this.out = new Map();                         // own commands: tick -> enc[] (insertion = tick order)
    this.upTo = 0; this.D = o.delay || D_INIT; this.dChangedAt = 0;
    this.ackOf = new Array(n).fill(0);            // what slot s acknowledged of MY commands
    this.remoteAcks = this.seats.map(() => null); // slot -> their whole ack array
    this.lastTick = new Array(n).fill(0); this.tickAt = new Array(n).fill(0);
    this.heardAt = new Array(n).fill(this.now()); this.seen = new Array(n).fill(false);
    this.lastPres = new Array(n).fill(null); this.peerSt = new Array(n).fill(''); this.absentSince = new Array(n).fill(-1);
    this.peerAway = new Array(n).fill(false); this.away = false;   // aw: page hidden (iPad: another app)
    this.lateAt = []; this.dBonus = 0; this.dBonusAt = 0; this.woSeen = new Array(n).fill(0);
    this.myLead = new Array(n).fill(0); this.theirLead = new Array(n).fill(null);   // per-slot lead estimates (ld)
    this.rtt = new Array(n).fill(0); this.rttDev = new Array(n).fill(0); this.rttN = new Array(n).fill(0);
    this.pubTimes = new Map();
    this.gone = new Map();                        // slot -> {at, why}
    this.remoteGone = this.seats.map(() => new Set());
    this.bt = new Map();                          // slot -> {T, U} accepted takeovers
    this.botSlots = new Set();                    // takeovers already applied
    this.tickHashes = new Array(RING).fill(null); // [T, hash]
    this.checks = new Map();                      // T -> hash (checkpoints)
    this.remoteCheck = this.seats.map(() => null);
    this.desync = null; this.dead = null; this.ended = false; this.live = false;
    this.applying = false; this.inTick = false;
    this.hb = 0; this.hbAt = 0; this.blockedSince = -1; this.waitingFor = [];
    this.leadEw = 0; this.paceV = 1;
    this.stats = { queued: 0, refused: 0, coalesced: 0, applied: 0, ticks: 0, stallMs: 0, liveMs: 0, liveSince: -1, dSum: 0, dN: 0, dMin: 99, dMax: 0,
      maxStallMs: 0, stalls: 0, presBytes: [], presMax: 0, takeovers: [], firstTickAt: -1, torn: 0, gaps: 0 };
    this._win = []; this._winBytes = 0;
    this.trace = o.trace ? new Array(RING).fill(null) : null; this.traceCmds = [];
  }
  /** desync forensics (o.trace): {T, units: [[id, kind, x, y, hp, alive, order, form, level, bot, facing, state, target, moving]], cmds} */
  traceAt(T) { const e = this.trace && this.trace[T % RING]; return e && e.T === T ? e : null; }

  // ------------------------------------------------------------------------------------------------ helpers
  get tickNo() { return this.world.tickNo; }
  alive(s) { return !this.gone.has(s) && !this.botSlots.has(s) && !this.bt.has(s); }
  aliveOthers() { const o = []; for (let s = 0; s < this.n; s++) if (s !== this.me && this.alive(s)) o.push(s); return o; }
  /** lowest live slot (me included) decides takeovers */
  actingHost() { for (let s = 0; s < this.n; s++) if (s === this.me ? !this.dead : this.alive(s)) return s; return this.me; }
  slotOf(unitId) { const s = this.slotOfUnit.get(unitId); return s === undefined ? -1 : s; }
  isRemoteHuman(unitId) { const s = this.slotOf(unitId); return s >= 0 && s !== this.me && !this.botSlots.has(s); }
  minAck() {
    let m = Infinity;
    for (let s = 0; s < this.n; s++) if (s !== this.me && this.alive(s)) m = Math.min(m, this.ackOf[s]);
    return m === Infinity ? this.upTo : m;
  }
  refreshUpTo() { if (this.live && !this.dead) this.upTo = Math.max(this.upTo, this.world.tickNo + this.D - 1); this.known[this.me] = this.upTo; }

  // ------------------------------------------------------------------------------------------------ commands
  /** [MT-HOOK] command interception (mt/sim/index.js). undefined = let the sim handle it now. */
  intercept(unit, cmd) {
    if (this.applying || this.ended || this.world.winner !== null) return undefined;
    const s = this.slotOf(unit.id);
    if (s < 0 || this.botSlots.has(s)) {
      if (this.inTick) return undefined;                 // bot AI / sim-internal: identical on every peer
      this.stats.refused++; return false;                // a local UI must not drive units it does not own
    }
    if (s !== this.me) { if (this.inTick) return undefined; this.stats.refused++; return false; }
    if (this.inTick && !this.scriptLocal) return undefined;
    return this.queue(unit, cmd);
  }
  queue(unit, cmd) {
    if (this.dead) return false;
    if (REFUSED_FOR_TRAINERS.has(cmd.type) && unit.mtTrainer) return false;   // the router refuses these without side effects
    if (cmd.type === 'monsterAttack' && unit.mtTrainer && this.predictMonsterAttackFails(unit, cmd)) return false; // callers fall back to 'attack'
    const enc0 = encode(cmd); if (!enc0) { this.stats.refused++; return false; }
    const enc = JSON.parse(JSON.stringify(enc0));   // bit-identical to what the others receive (e.g. -0 arrives as 0)
    const target = Math.max(this.world.tickNo + this.D, this.upTo + 1);
    let list = this.out.get(target); if (!list) this.out.set(target, list = []);
    const last = list[list.length - 1];
    if (last && last[0] === enc[0] && COALESCE.has(enc[0])) { list[list.length - 1] = enc; this.stats.coalesced++; }
    else {
      if (list.length >= MAX_PER_TICK || this._winBytes > WINDOW_BYTES) { this.stats.refused++; if (!list.length) this.out.delete(target); return false; }
      list.push(enc);
    }
    this.stats.queued++;
    if (this.onLocal) try { this.onLocal(cmd, target); } catch { /* cosmetic only */ }
    return true;
  }
  /** mirrors monsters.focus(): no deployed live monster or no valid enemy target -> the command would return false */
  predictMonsterAttackFails(unit, cmd) {
    const w = this.world, pet = w.mt ? activeUnit(w.mt, unit) : null;
    if (!pet || !pet.alive) return true;
    const t = w.units.get(cmd.targetId | 0);
    return !t || !t.alive || t.team === pet.team;
  }

  // ------------------------------------------------------------------------------------------------ gate + tick
  ready(T) {
    const wait = this.waitingFor; wait.length = 0;
    for (let s = 0; s < this.n; s++) {
      if (s === this.me || this.botSlots.has(s)) continue;
      const b = this.bt.get(s); if (b && T > b.U) continue;
      if (this.known[s] < T) wait.push(s);
    }
    return wait.length === 0;
  }
  /** [MT-HOOK] netGate: run tick T = tickNo + 1 if every input for T is known. false = blocked (frame ends). */
  step(w) {
    if (w !== this.world || this.ended || w.winner !== null) { w.tick(); this.ended = this.ended || (w === this.world && w.winner !== null); return true; }
    if (!this.live || this.dead || this.desync) return false;   // desync: freeze (keeps the per-tick hashes to compare)
    const T = w.tickNo + 1;
    if (!this.ready(T)) { if (this.blockedSince < 0) this.blockedSince = this.now(); return false; }
    if (this.blockedSince >= 0) { const ms = this.now() - this.blockedSince; this.stats.maxStallMs = Math.max(this.stats.maxStallMs, ms); if (ms > 50) this.stats.stalls++; this.blockedSince = -1; }
    detOn();
    try {
      // the spatial grid from the real positions on every peer: between ticks UI queries / the render-only prediction
      // may have rebuilt it (or marked it dirty) differently on each page; queries before the tick's own rebuild
      // (commands, preTick hooks, scheduled effects) must see the same cell lists everywhere
      if (w.grid && w.unitList && w.grid.rebuild) w.grid.rebuild(w.unitList); else if (w.ensureGrid) w.ensureGrid();
      for (const [s, b] of this.bt) if (b.T === T && !this.botSlots.has(s)) this.toBot(w, s);
      this.applying = true;
      for (let s = 0; s < this.n; s++) {
        const list = s === this.me ? this.out.get(T) : this.inbox[s].get(T);
        if (!list || this.botSlots.has(s)) continue;
        const uid = this.slotUnit[s];
        for (let i = 0; i < list.length; i++) { const c = decode(list[i]); if (c) { const r = w.command(uid, c); this.stats.applied++; if (this.trace) this.traceCmds.push([s, JSON.stringify(c), r]); } }
      }
      this.applying = false;
      this.inTick = true;
      w.tick();
    } finally { this.inTick = false; this.applying = false; detOff(); }
    this.stats.ticks++;
    if (this.stats.firstTickAt < 0) this.stats.firstTickAt = this.now();
    this.afterTick(w, T);
    return true;
  }
  toBot(w, s) {
    const u = w.units.get(this.slotUnit[s]);
    if (u) u.bot = true;
    const p = w.players && w.players.find((q) => q.unitId === this.slotUnit[s]); if (p) p.bot = true;
    this.botSlots.add(s);
    this.stats.takeovers.push({ slot: s, tick: w.tickNo + 1, U: this.bt.get(s).U });
    this.log('slot ' + s + ' is a bot from tick ' + (w.tickNo + 1));
  }
  afterTick(w, T) {
    const h = this.hash(w);
    if (this.trace) {
      this.trace[T % RING] = { T, h, cmds: this.traceCmds, units: w.unitList.map((u) => [u.id, u.kind, u.x, u.y, u.hp, u.alive ? 1 : 0, u.order ? u.order.type + (u.order.targetId != null ? ':' + u.order.targetId : '') : '',
        u.mtMon ? u.mtMon.form : '', u.level || 0, u.bot ? 1 : 0, u.facing, u.state || '', u.targetId ?? -1, u.moving ? 1 : 0]) };
      this.traceCmds = [];
    }
    this.tickHashes[T % RING] = [T, h];
    if (T % CHECK_EVERY === 0) {
      this.checks.set(T, h);
      if (this.checks.size > 60) this.checks.delete(this.checks.keys().next().value);
      for (let s = 0; s < this.n; s++) { const rc = this.remoteCheck[s]; if (rc && rc[0] === T) this.compare(s, rc[0], rc[1]); }
    }
    if (w.winner !== null) this.ended = true;
    if (this.onTick) this.onTick(w, T);
    // prune: own commands executed and acknowledged by every live peer; received commands older than HIST
    const lim = Math.min(this.minAck(), T);
    for (const t of [...this.out.keys()]) if (t <= lim) this.out.delete(t);   // any order (queued before live: D may shrink)
    const old = T - HIST;
    for (const m of this.inbox) for (const t of m.keys()) { if (t > old) break; m.delete(t); }
    this.refreshUpTo();
  }
  /** desync: compare a remote checkpoint with ours */
  compare(s, T, hh) {
    const mine = this.checks.get(T);
    if (mine === undefined || mine === hh || this.desync) return;
    this.desync = { tick: T, slot: s, first: null, at: this.now() };
    this.log('DESYNC at checkpoint tick ' + T + ' vs slot ' + s + ': ' + mine + ' != ' + hh);
  }

  // ------------------------------------------------------------------------------------------------ remote presence
  /** @param {number} s slot  @param {object} p presence (untrusted)  @param {number} [at] my clock when it changed */
  ingest(s, p, at = this.now()) {
    if (!p || s === this.me || !(s >= 0 && s < this.n) || p.m !== this.mid) return;
    if (p !== this.lastPres[s]) { this.lastPres[s] = p; this.heardAt[s] = at; }
    this.seen[s] = true;
    this.peerSt[s] = typeof p.st === 'string' ? p.st : '';   // 'ld' while that peer is still on the loading screen
    this.peerAway[s] = p.aw === 1;
    this.woSeen[s] = p.w === 1 && isInt(p.wo) && ((p.wo >> this.me) & 1) ? 1 : 0;   // that peer is waiting for MY inputs
    this.theirLead[s] = Array.isArray(p.ld) && Number.isFinite(p.ld[this.me]) ? Math.max(-300, Math.min(300, p.ld[this.me])) : null;
    if (p.x === 1 && !this.gone.has(s)) this.markGone(s, 'replaced');
    if (this.gone.has(s)) return;           // after "gone" nothing more is read from that slot (takeover safety)
    if (okTick(p.k) && p.k !== this.lastTick[s]) { this.lastTick[s] = p.k; this.tickAt[s] = at; }
    const b = this.bt.get(s), cap = b ? b.U : Infinity;
    // the window says itself which upTo it is complete for (c[0] = ['h', U, F]): a u key from a newer patch next to an
    // older window (patch lost / reordered on the way) must not advance known past what the window holds
    const hd = Array.isArray(p.c) && Array.isArray(p.c[0]) && p.c[0][0] === 'h' ? p.c[0] : null;
    const U = hd && okTick(hd[1]) ? hd[1] : -1, F = hd && okTick(hd[2]) ? hd[2] : 0;
    if (okTick(p.u) && p.u > this.known[s] && U < p.u) this.stats.torn++;
    if (U > this.known[s]) {
      if (F > this.known[s]) { this.stats.gaps++; }   // starts after what I have (never expected): wait, never skip a tick
      else {
        const lim = Math.min(U, cap);
        if (lim > this.known[s]) { this.accept(s, p.c, this.known[s], lim); this.known[s] = lim; }
      }
    }
    if (Array.isArray(p.a)) {
      const a = p.a.map((v) => (okTick(v) ? v : 0)).slice(0, this.n);
      this.remoteAcks[s] = a;
      const mine = a[this.me] || 0;
      if (mine > this.ackOf[s]) {
        const t0 = this.pubTimes.get(mine);
        if (t0 !== undefined) this.rttSample(s, at - t0);
        this.ackOf[s] = mine;
      }
    }
    if (Array.isArray(p.h) && okTick(p.h[0]) && typeof p.h[1] === 'string') {
      this.remoteCheck[s] = [p.h[0], p.h[1]];
      if (this.checks.has(p.h[0])) this.compare(s, p.h[0], p.h[1]);
    }
    if (Array.isArray(p.gn)) { const g = this.remoteGone[s]; g.clear(); for (const v of p.gn.slice(0, 8)) if (isInt(v)) g.add(v); }
    if (Array.isArray(p.bt) && s === this.actingHost()) for (const e of p.bt.slice(0, 8)) this.acceptTakeover(e);
    if (Array.isArray(p.rl)) for (const r of p.rl.slice(0, 8)) this.acceptRelay(r);
    if (Array.isArray(p.dh) && this.desync && this.desync.first == null) this.firstDiverging(p.dh);
  }
  /** take the commands of slot s for ticks in (from, to] from a window / relay list */
  accept(s, list, from, to) {
    const box = this.inbox[s];
    for (let i = 0; i < list.length && i < 400; i++) {
      const e = list[i];
      if (!Array.isArray(e) || e.length < 2) continue;
      const t = e[0];
      if (!okTick(t) || t <= from || t > to) continue;
      let l = box.get(t); if (!l) box.set(t, l = []);
      if (l.length < 16) l.push(e.slice(1));
    }
  }
  acceptTakeover(e) {
    if (!Array.isArray(e) || e.length < 3) return;
    const [s, T, U] = e;
    if (!isInt(s) || s < 0 || s >= this.n || !okTick(T) || !okTick(U) || T <= U || this.bt.has(s)) return;
    if (s === this.me) { this.dead = 'replaced'; this.log('replaced by a bot (tick ' + T + ')'); return; }
    let late = this.world.tickNo >= T;
    if (!late && this.world.tickNo > U) for (const [t, l] of this.inbox[s]) if (t > U && t <= this.world.tickNo && l.length) { late = true; break; }
    if (late && !this.desync) {
      // we already ran past the takeover point with that slot's later inputs: cannot match the others any more
      this.desync = { tick: this.world.tickNo, slot: s, first: null, at: this.now(), reason: 'takeover' };
    }
    if (!this.gone.has(s)) this.markGone(s, 'host');
    this.bt.set(s, { T, U });
    for (const t of [...this.inbox[s].keys()]) if (t > U) this.inbox[s].delete(t);
    if (this.known[s] > U) this.known[s] = U;
  }
  acceptRelay(r) {
    if (!Array.isArray(r) || r.length < 4) return;
    const [s, F, U, list] = r;
    if (!isInt(s) || s < 0 || s >= this.n || s === this.me || !okTick(F) || !okTick(U) || !Array.isArray(list)) return;
    const b = this.bt.get(s), cap = b ? Math.min(U, b.U) : U;
    if (this.known[s] < F || cap <= this.known[s]) return;   // does not cover our gap (or nothing new)
    this.accept(s, list, this.known[s], cap);
    this.known[s] = cap;
  }
  markGone(s, why) {
    if (this.gone.has(s) || s === this.me) return;
    this.gone.set(s, { at: this.now(), why });
    this.log('slot ' + s + ' gone (' + why + ') at tick ' + this.world.tickNo + ', inputs known to ' + this.known[s]);
  }
  rttSample(s, ms) {
    if (!(ms >= 0 && ms < 10000)) return;
    const n = ++this.rttN[s];
    if (n === 1) { this.rtt[s] = ms; this.rttDev[s] = ms / 4; return; }
    const err = ms - this.rtt[s];
    this.rtt[s] += err * 0.1; this.rttDev[s] += (Math.abs(err) - this.rttDev[s]) * 0.1;
  }
  firstDiverging(dh) {
    if (!Array.isArray(dh) || !okTick(dh[0]) || !Array.isArray(dh[1])) return;
    const T0 = dh[0];
    for (let i = 0; i < dh[1].length && i < RING; i++) {
      const T = T0 + i, mine = this.tickHashes[T % RING];
      if (mine && mine[0] === T && mine[1] !== dh[1][i]) { this.desync.first = T; this.log('first diverging tick ' + T); return; }
    }
  }

  // ------------------------------------------------------------------------------------------------ per frame
  /**
   * Housekeeping once per frame: who is gone (left the room / silent), takeovers (acting host), adaptive D, drift.
   * @param {Set<string>|null} present  peer labels currently in the room (null = unknown)
   */
  maintain(present) {
    const now = this.now(), w = this.world;
    const fdt = Math.min(250, Math.max(0, now - (this._mAt ?? now))); this._mAt = now;
    if (this.live && this.stats.liveSince < 0) this.stats.liveSince = now;
    if (now - this.hbAt >= 1000) { this.hb = (this.hb + 1) % 1000; this.hbAt = now; }
    if (this.ended || this.dead) return;
    for (let s = 0; s < this.n; s++) {
      if (s === this.me || this.gone.has(s) || this.botSlots.has(s)) continue;
      // not in the room's peer list: left — once that lasts (a reconnect is brief; a peer that never showed up gets
      // the long never-seen limit, e.g. it is still joining the room)
      if (present && !present.has(this.seats[s].peer)) { if (this.absentSince[s] < 0) this.absentSince[s] = now; } else this.absentSince[s] = -1;
      if (this.absentSince[s] >= 0 && now - this.absentSince[s] > (this.seen[s] ? LEFT_GRACE_MS : SILENT_NEVER_MS)) { this.markGone(s, 'left'); continue; }
      const limit = !this.seen[s] || this.peerSt[s] === 'ld' ? SILENT_NEVER_MS : this.peerAway[s] ? AWAY_MS : SILENT_MS;   // loading screens may block a slow device
      if (this.live && now - this.heardAt[s] > limit) this.markGone(s, 'silent');
    }
    if (this.actingHost() === this.me) {
      for (const [s, g] of this.gone) {
        if (this.bt.has(s)) continue;
        const others = this.aliveOthers();
        if (!others.every((o) => this.remoteGone[o].has(s)) && now - g.at < GONE_WAIT_MS) continue;
        let U = this.known[s], T = w.tickNo;
        for (const o of others) { const a = this.remoteAcks[o]; if (a && a[s] > U) U = a[s]; if (this.lastTick[o] > T) T = this.lastTick[o]; }
        T = Math.max(T, U) + 3;
        this.bt.set(s, { T, U });
        for (const t of [...this.inbox[s].keys()]) if (t > U) this.inbox[s].delete(t);
        this.log('takeover: slot ' + s + ' becomes a bot from tick ' + T + ' (inputs end at ' + U + ')');
      }
    }
    // "you kept me waiting": time any live peer spent blocked on MY inputs -> one more tick of D (decays when quiet)
    if (this.live) {
      let waited = false;
      for (const s of this.aliveOthers()) if (this.woSeen[s]) waited = true;
      if (fdt > 80) this.hitchAt = now;   // my own frame hitch (busy device): more delay would not have helped
      if (waited && now - (this.hitchAt || -1e9) > 1000) this.lateAt.push([now, fdt]);
      while (this.lateAt.length && now - this.lateAt[0][0] > LATE_WINDOW_MS) this.lateAt.shift();
      let ms = 0; for (const e of this.lateAt) ms += e[1];
      if (ms > 250 && this.dBonus < 3 && now - this.dBonusAt > LATE_WINDOW_MS) { this.dBonus++; this.dBonusAt = now; this.lateAt.length = 0; this._dAt = 0; }   // > 12 % of the time
      else if (this.dBonus > 0 && now - this.dBonusAt > 30000 && !this.lateAt.length) { this.dBonus--; this.dBonusAt = now; }   // slow decay: no see-saw
    }
    // adaptive input delay from ack round trips: the others need my upTo (= tick + D - 1) before their tick, so
    // (D - 1) ticks must cover one way (≈ rtt/2, which already holds the publish + frame overhead) + 2 deviations
    if (now - (this._dAt || 0) > 1000) {
      this._dAt = now;
      let need = 0;
      // (rtt - one frame) / 2: the measured round trip also holds my own pull delay (~1 frame), which the gate does not
      // wait for (it re-reads the room when blocked); + 2 deviations + 6 ms (frame quantisation); stalls add dBonus
      for (const s of this.aliveOthers()) if (this.rttN[s] >= 3) need = Math.max(need, Math.max(0, this.rtt[s] - 16) / 2 + 2 * this.rttDev[s] + 6);
      if (need > 0) {
        const want = Math.max(D_MIN, Math.min(D_MAX, Math.ceil(need / TICK_MS) + 1 + this.dBonus));
        if (want > this.D) { this.D = want; this.dChangedAt = now; }
        else if (want < this.D && now - this.dChangedAt > 3000) { this.D--; this.dChangedAt = now; }
      }
      if (this.live) { this.stats.dSum += this.D; this.stats.dN++; this.stats.dMin = Math.min(this.stats.dMin, this.D); this.stats.dMax = Math.max(this.stats.dMax, this.D); }
    }
    // drift: how far ahead of the others am I (ticks)? Behind -> catch up (up to 2 ticks per frame); ahead -> barely
    // slower (the gate holds me anyway): the shared sim never drifts into slow motion to wait for a straggler
    // lead vs each peer = my tick - its last reported tick advanced by (age + rtt/2); rtt/2 over-estimates one way
    // (publish + frame overhead), which would make EVERY peer think it is behind and all speed up — so each peer
    // publishes its per-slot leads (ld) and both sides use the difference: (mine - theirs) / 2, bias-free
    const others = this.aliveOthers();
    if (this.live && others.length && this.stats.ticks > 0) {
      let sum = 0;
      for (const s of others) {
        const raw = w.tickNo - (this.lastTick[s] + (Math.min(now - this.tickAt[s], 100) + this.rtt[s] / 2) / TICK_MS);
        this.myLead[s] = raw;
        sum += this.theirLead[s] == null ? raw : (raw - this.theirLead[s]) / 2;
      }
      const lead = sum / others.length;
      this.leadEw += (lead - this.leadEw) * 0.15;
      // within ±1.2 ticks: gentle and symmetric (the one ahead eases off as much as the one behind hurries, so noise
      // never makes the pair run faster than real time); further behind (a hitch, a busy frame): catch up at up to
      // 2 ticks per frame; further ahead: never slower than 0.9 (the gate holds me anyway)
      const l = Math.abs(this.leadEw) < 0.5 ? 0 : this.leadEw;
      this.paceV = l < -1.2 ? Math.min(2, 1.06 + 0.3 * (-l - 1.2)) : Math.max(0.9, Math.min(1.06, 1 - 0.05 * l));
    } else this.paceV = 1;
    this.refreshUpTo();
  }
  /** [MT-HOOK] netPace: accumulator after `Wk += dt * timeScale` -> drift-corrected, backlog clamped */
  pace(acc, dt, timeScale = 1, maxBacklog = MAX_BACKLOG) {
    const now = this.now();
    if (this.live && !this.ended && !this.dead) {
      if (this._lastPaceAt != null) { const ms = Math.min(250, now - this._lastPaceAt); this.stats.liveMs += ms; if (this.blockedSince >= 0) this.stats.stallMs += ms; }
      this._lastPaceAt = now;
    }
    if (!this.live || this.ended) return acc;
    acc += dt * timeScale * (this.paceV - 1);
    return Math.max(0, Math.min(acc, maxBacklog * Math.max(1, timeScale)));
  }
  /** a short human-readable reason the gate is closed (UI) */
  waiting() { return this.blockedSince >= 0 ? { since: this.blockedSince, slots: [...this.waitingFor], away: this.waitingFor.filter((s) => this.peerAway[s]) } : null; }

  // ------------------------------------------------------------------------------------------------ presence out
  /** fields for my presence in the game room (absolute state) */
  patch() {
    const now = this.now();
    this.refreshUpTo();
    const ma = this.minAck(), U = this.live ? this.upTo : 0, F = Math.min(ma, U), win = [['h', U, F]];
    const ts = []; for (const t of this.out.keys()) if (t > F && t <= U) ts.push(t);
    ts.sort((x, y) => x - y);
    for (const t of ts) for (const e of this.out.get(t)) win.push([t, ...e]);
    const a = this.known.slice(); a[this.me] = this.upTo;
    const p = { m: this.mid, s: this.me, u: U, k: this.world.tickNo, c: win, a, hb: this.hb, dl: this.D };
    let last = null; for (const [T, h] of this.checks) last = [T, h];
    p.h = last;
    p.w = this.blockedSince >= 0 ? 1 : 0;
    if (p.w) { let wo = 0; for (const s of this.waitingFor) if (s < 30) wo |= 1 << s; p.wo = wo; }
    if (this.live && this.n > 1) p.ld = this.myLead.map((v, s) => (s === this.me ? 0 : Math.round(v * 10) / 10));
    if (this.away) p.aw = 1;
    if (this.gone.size) p.gn = [...this.gone.keys()];
    if (this.actingHost() === this.me && this.bt.size) p.bt = [...this.bt].map(([s, b]) => [s, b.T, b.U]);
    const rl = [];
    for (const s of this.gone.keys()) {
      if (this.botSlots.has(s) && this.world.tickNo > (this.bt.get(s) || { T: 0 }).T + 90) continue;
      let F = this.known[s];
      for (const o of this.aliveOthers()) { const ra = this.remoteAcks[o]; F = Math.min(F, ra ? ra[s] || 0 : 0); }
      if (F >= this.known[s]) continue;
      const list = [];
      for (const [t, l] of this.inbox[s]) { if (t <= F) continue; if (t > this.known[s]) break; for (const e of l) if (list.length < 80) list.push([t, ...e]); }
      rl.push([s, F, this.known[s], list]);
    }
    if (rl.length) p.rl = rl;
    if (this.desync) {
      const T1 = this.desync.tick, T0 = Math.max(1, T1 - CHECK_EVERY + 1), hs = [];
      for (let T = T0; T <= T1; T++) { const x = this.tickHashes[T % RING]; hs.push(x && x[0] === T ? x[1] : ''); }
      p.dh = [T0, hs];
    }
    if (this.dead) p.x = 1;
    this._win = win; this._winBytes = utf8Len(JSON.stringify(win));
    if (this.live && !this.pubTimes.has(p.u)) { this.pubTimes.set(p.u, now); if (this.pubTimes.size > 400) this.pubTimes.delete(this.pubTimes.keys().next().value); }
    return p;
  }
  notePublished(bytes) {
    const b = this.stats.presBytes; b.push(bytes); if (b.length > 4000) b.splice(0, 1000);
    if (bytes > this.stats.presMax) this.stats.presMax = bytes;
  }

  /** summary for the HUD / tests */
  report() {
    const st = this.stats, pb = st.presBytes.slice().sort((x, y) => x - y);
    return {
      mid: this.mid, slot: this.me, tick: this.world.tickNo, D: this.D, dAvg: st.dN ? +(st.dSum / st.dN).toFixed(2) : this.D, dMin: st.dN ? st.dMin : this.D, dMax: st.dN ? st.dMax : this.D,
      delayMs: Math.round(this.D * TICK_MS), stallPct: st.liveMs > 0 ? +(100 * st.stallMs / st.liveMs).toFixed(2) : 0, stallMs: Math.round(st.stallMs), liveMs: Math.round(st.liveMs),
      maxStallMs: Math.round(st.maxStallMs), stalls: st.stalls, rtt: this.rtt.map((r) => Math.round(r)), pace: +this.paceV.toFixed(3), lead: +this.leadEw.toFixed(2),
      presMax: st.presMax, presP95: pb.length ? pb[Math.floor(pb.length * 0.95)] : 0, queued: st.queued, applied: st.applied, refused: st.refused, coalesced: st.coalesced,
      ticks: st.ticks, torn: st.torn, gaps: st.gaps, takeovers: st.takeovers.slice(), gone: [...this.gone].map(([s, g]) => ({ slot: s, why: g.why })), desync: this.desync, dead: this.dead, ended: this.ended,
    };
  }
}

// ================================================================================================ room link
/**
 * Binds a NetSession to a game room (real `room` NamedRoom or MockRoom): pull() ingests every seat's presence,
 * maintain() runs the housekeeping, push() publishes my presence (≤ 30/s, only when it changed). One frame():
 * pull + maintain + push. Used by the in-game controller (mt/net/online.js) and by the node protocol tests.
 */
export class SessionLink {
  /**
   * @param {NetSession} session
   * @param {object} room   NamedRoom (presence / peers)
   * @param {object} [o]
   * @param {() => object} [o.extra]   other presence fields of mine (lobby fields: name, team...)
   * @param {number} [o.minGapMs]      publish interval floor (default 33 ms ≈ the platform's own coalescing)
   */
  constructor(session, room, o = {}) {
    this.s = session; this.room = room; this.extra = o.extra || (() => ({})); this.minGap = o.minGapMs ?? 33;
    this.seatOf = new Map(session.seats.map((x, i) => [x.peer, i]));
    this.lastPubAt = -1e9; this.lastSent = {}; this.lastPeers = null; this.present = null; this.pubFails = 0; this.pubCount = 0;
    this.fno = 0; this.retryFno = -1;
  }
  /**
   * The gate (netGate): session.step, and when it is closed, once per frame, read the room again first — inputs that
   * arrived after this frame's pull let the tick run now instead of a frame later.
   */
  step(w) {
    if (this.s.step(w)) return true;
    if (this.retryFno === this.fno || this.s.dead || this.s.desync) return false;
    this.retryFno = this.fno;
    this.pull();
    return this.s.step(w);
  }
  pull() {
    let ps;
    try { ps = this.room.peers(); } catch { ps = null; }
    if (!ps) return;
    if (ps !== this.lastPeers) {
      this.lastPeers = ps;
      const pr = new Set();
      for (const p of ps) pr.add(p.peer);
      this.present = ps.length ? pr : null;   // an empty snapshot = "not answered yet", not "everyone left"
    }
    const s = this.s;
    for (const p of ps) {
      if (p.isMe && p.sameTab) continue;
      const slot = this.seatOf.get(p.peer);
      if (slot === undefined) continue;
      s.ingest(slot, p.presence);
    }
  }
  push(force = false) {
    const now = this.s.now();
    if (!force && now - this.lastPubAt < this.minGap) return false;
    const full = { ...this.extra(), ...this.s.patch() };
    const patch = {};
    let changed = false;
    for (const k of Object.keys(full)) {
      const j = JSON.stringify(full[k]);
      if (j !== this.lastSent[k]) { patch[k] = full[k] === undefined ? null : full[k]; this.lastSent[k] = j; changed = true; }
    }
    for (const k of Object.keys(this.lastSent)) if (!(k in full)) { patch[k] = null; delete this.lastSent[k]; changed = true; }
    if (!changed) return false;
    this.lastPubAt = now; this.pubCount++;
    const bytes = utf8Len(JSON.stringify(full));
    this.s.notePublished(bytes);
    try {
      const r = this.room.presence(patch);
      if (r && r.catch) r.catch((e) => { this.pubFails++; this.lastSent = {}; this.lastError = String((e && e.code) || e); });
    } catch (e) { this.pubFails++; this.lastSent = {}; this.lastError = String((e && e.code) || e); }
    return true;
  }
  frame() { this.fno++; this.pull(); this.s.maintain(this.present); this.push(); }
}
