// mt/net/mockroom.js — an in-page stand-in for the claude.ai Artifact `room` capability. Owner: netplay.
//
// Implements the room contract (game/mt/net/README in docs/arch/netplay.md; authoritative: room.d.ts 0.2.90) closely
// enough that the real RoomTransport code path runs on top of it:
//   presence(patch): per-field merge (top-level null removes), applied locally at once, sent WHOLE and coalesced
//     ≤ ~30/s; the merged object must stay ≤ 4 KiB of UTF-8 JSON (else rejects invalid_argument, not applied);
//     identifier keys, ≤ 8 nesting, strings ≤ 1 KiB without control characters; handed to newcomers; keepalive
//     re-sends (don't bump updatedAt) heal dropped updates; cleared when you leave.
//   peers() frozen snapshot incl. you (isMe/sameTab), same object until something changes; onPeers(fn) at most once
//     per frame with {peers, joined, left, updated}, first delivery after a microtask presents everyone as joined.
//   emit/on topics (best effort, droppable), shared send budget ~40/s (burst 80): past it emits drop, presence waits.
//   join(name) named rooms (presence per room, same peer label), leave(), connected()/onConnection().
// Network simulation on the RECEIVING side: latency ± jitter, drop rate (presence / emits only; joins and leaves are
// reliable), optional reordering (else FIFO per sender, like one websocket). Peers silent for 8 s (mockexpire) count as left.
//
// Wires: BroadcastChannelWire (two tabs / Playwright pages of one browser context) and MemoryBus (node tests, with a
// virtual clock). Enable in the game with ?net=mock (&mocklat=ms&mockjit=ms&mockdrop=0..1&mockreorder=1&mockch=name).

export const KEY_RE = /^[A-Za-z_][A-Za-z0-9_-]{0,63}$/;
const NAME_RE = /^[a-z0-9][a-z0-9_.-]{0,47}$/;
const TOPIC_RE = /^[a-z][a-z0-9_.-]{0,47}$/;
// eslint-disable-next-line no-control-regex
const CTRL_RE = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u200b-\u200f\u2028-\u202e\u2060-\u2064\ufeff]/;
const LIMIT = 4096, STR_LIMIT = 1024, FLUSH_MS = 33, KEEPALIVE_MS = 1000;
export const PRESENCE_LIMIT = LIMIT;

export const realClock = {
  now: () => (typeof performance !== 'undefined' ? performance.now() : Date.now()),
  setTimeout: (fn, ms) => setTimeout(fn, ms), clearTimeout: (h) => clearTimeout(h),
  setInterval: (fn, ms) => setInterval(fn, ms), clearInterval: (h) => clearInterval(h),
};

export function utf8Len(s) { let n = 0; for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); if (c < 0x80) n++; else if (c < 0x800) n += 2; else if (c >= 0xd800 && c <= 0xdbff) { n += 4; i++; } else n += 3; } return n; }
const err = (code, message) => Object.assign(new Error(message), { code, message });
export function validate(v, depth) {
  if (depth > 8) return 'nesting deeper than 8';
  if (v === null || typeof v === 'boolean') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? null : 'non-finite number';
  if (typeof v === 'string') return v.length > STR_LIMIT ? 'string over 1 KiB' : CTRL_RE.test(v) ? 'control or invisible character' : null;
  if (Array.isArray(v)) { for (const x of v) { const e = validate(x, depth + 1); if (e) return e; } return null; }
  if (typeof v === 'object') {
    for (const k of Object.keys(v)) { if (!KEY_RE.test(k)) return 'key is not an identifier: ' + k; const e = validate(v[k], depth + 1); if (e) return e; }
    return null;
  }
  return 'not JSON';
}
export const deepFreeze = (o) => { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); for (const k of Object.keys(o)) deepFreeze(o[k]); } return o; };

// ------------------------------------------------------------------------------------------------ wires
export class BroadcastChannelWire {
  constructor(name = 'sv-mock-room') { this.ch = new BroadcastChannel(name); this.fn = null; this.ch.onmessage = (e) => this.fn && this.fn(e.data); }
  send(msg) { try { this.ch.postMessage(msg); } catch { /* closed */ } }
  onMessage(fn) { this.fn = fn; }
  close() { try { this.ch.close(); } catch { /* ignore */ } }
}
/** in-process bus for node tests: every attached wire gets every other wire's messages (structured-cloned) */
export class MemoryBus {
  constructor() { this.wires = new Set(); }
  wire() {
    const bus = this, w = {
      fn: null, open: true,
      send(msg) { if (!w.open) return; const data = JSON.parse(JSON.stringify(msg)); for (const o of bus.wires) if (o !== w && o.open && o.fn) o.fn(data); },
      onMessage(fn) { w.fn = fn; }, close() { w.open = false; bus.wires.delete(w); },
    };
    this.wires.add(w);
    return w;
  }
}

// ------------------------------------------------------------------------------------------------ the room
class MockNamedRoom {
  constructor(host, name) {
    this.host = host; this.name = name; this.joined = true;
    this.mine = {}; this.peerMap = new Map(); this.snapshot = null; this.listeners = new Set(); this.topicL = new Map();
    this.pending = { joined: new Map(), left: new Map(), updated: new Map() }; this.deliverH = null; this.flushH = null; this.lastFlush = -1e9;
    this.firstDelivered = new Set();
  }
  _self() {
    const h = this.host;
    return { peer: h.peerId, by: null, isMe: true, sameTab: true, kind: 'viewer', guest: false, presence: deepFreeze(JSON.parse(JSON.stringify(this.mine))), updatedAt: h.clock.now() };
  }
  peers() {
    if (!this.joined) return Object.freeze([]);
    if (!this.snapshot) {
      if (!this.selfPeer) this.selfPeer = Object.freeze(this._self());
      const list = [this.selfPeer, ...[...this.peerMap.values()].map((p) => p.obj)];
      this.snapshot = Object.freeze(list);
    }
    return this.snapshot;
  }
  presence(patch) {
    if (!this.joined) return Promise.reject(err('invalid_argument', 'left this room'));
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return Promise.reject(err('invalid_argument', 'patch must be an object'));
    const next = { ...this.mine };
    for (const k of Object.keys(patch)) {
      if (!KEY_RE.test(k)) return Promise.reject(err('invalid_argument', 'key is not an identifier: ' + k));
      if (patch[k] === null) delete next[k]; else next[k] = patch[k];
    }
    const e = validate(next, 1); if (e) return Promise.reject(err('invalid_argument', e));
    const txt = JSON.stringify(next), n = utf8Len(txt);
    if (n > LIMIT) return Promise.reject(err('invalid_argument', 'presence is ' + n + ' bytes of JSON; the limit is 4096'));
    this.mine = JSON.parse(txt);
    this.selfPeer = Object.freeze(this._self()); this.snapshot = null;
    this._queue('updated', this.selfPeer);
    this._scheduleFlush();
    return Promise.resolve();
  }
  _scheduleFlush() {
    if (this.flushH != null) return;
    const h = this.host, wait = Math.max(0, this.lastFlush + FLUSH_MS - h.clock.now());
    this.flushH = h.clock.setTimeout(() => { this.flushH = null; this._flush(); }, wait);
  }
  _flush() {
    const h = this.host;
    if (!this.joined) return;
    if (!h.spend()) { this.flushH = h.clock.setTimeout(() => { this.flushH = null; this._flush(); }, 25); return; }   // over budget: presence waits
    this.lastFlush = h.clock.now();
    h.send({ k: 'p', r: this.name, d: this.mine });
  }
  emit(topic, data) {
    if (!this.joined) return Promise.reject(err('invalid_argument', 'left this room'));
    if (typeof topic !== 'string' || !TOPIC_RE.test(topic)) return Promise.reject(err('invalid_argument', 'topic grammar'));
    const txt = JSON.stringify(data === undefined ? null : data);
    if (utf8Len(txt) > LIMIT) return Promise.reject(err('invalid_argument', 'data over 4 KiB'));
    const h = this.host;
    if (!h.connectedNow) return Promise.resolve();               // dropped, never queued
    if (!h.spend()) { h.reportDrop(); return Promise.resolve(); }
    const msg = { k: 'e', r: this.name, t: topic, d: data === undefined ? null : JSON.parse(txt) };
    h.send(msg);
    h.clock.setTimeout(() => this._deliverEmit(h.peerId, msg, true), 0);   // own echo (isMe && sameTab)
    return Promise.resolve();
  }
  on(topic, handler, onError) {
    if (typeof handler !== 'function') throw new TypeError('handler must be a function');
    if (typeof topic !== 'string' || !TOPIC_RE.test(topic)) { if (onError) Promise.resolve().then(() => onError({ code: 'invalid_argument', message: 'topic grammar' })); return () => {}; }
    let s = this.topicL.get(topic); if (!s) this.topicL.set(topic, s = new Set());
    const rec = { handler }; s.add(rec);
    return () => s.delete(rec);
  }
  _deliverEmit(from, msg, self) {
    const s = this.topicL.get(msg.t); if (!s) return;
    const m = Object.freeze({ peer: from, by: null, isMe: !!self, sameTab: !!self, kind: 'viewer', guest: false, topic: msg.t, data: deepFreeze(msg.d) });
    for (const r of [...s]) { try { r.handler(m); } catch (e) { console.error('[mockroom] handler', e); } }
  }
  onPeers(handler, onError) {
    if (typeof handler !== 'function') throw new TypeError('handler must be a function');
    void onError;
    const rec = { handler, first: true }; this.listeners.add(rec);
    Promise.resolve().then(() => this._scheduleDeliver());
    return () => this.listeners.delete(rec);
  }
  connected() { return this.joined && this.host.connectedNow; }
  onConnection(handler) { return this.host.onConnection(handler); }
  leave() {
    if (!this.joined) return Promise.resolve();
    this.joined = false; this.host.send({ k: 'l', r: this.name });
    this.host.rooms.delete(this.name); this.listeners.clear(); this.topicL.clear();
    if (this.flushH != null) this.host.clock.clearTimeout(this.flushH);
    return Promise.resolve();
  }
  // ---- incoming (already delayed by the network simulation)
  _recv(from, msg) {
    if (!this.joined) return;
    const now = this.host.clock.now();
    if (msg.k === 'l') { const p = this.peerMap.get(from); if (p) { this.peerMap.delete(from); this.snapshot = null; this._queue('left', p.obj); } return; }
    if (msg.k === 'e') { if (this.peerMap.has(from)) this._deliverEmit(from, msg, false); return; }
    let p = this.peerMap.get(from);
    const fresh = !p;
    if (fresh) {
      p = { txt: null, obj: null, heard: now };
      this.peerMap.set(from, p);
      if (msg.k === 'j') this.host.clock.setTimeout(() => { if (this.joined) this.host.send({ k: 'ka', r: this.name, d: this.mine }); }, 5);  // hand our presence to the newcomer
    }
    p.heard = now;
    const d = msg.d && typeof msg.d === 'object' ? msg.d : {};
    const txt = JSON.stringify(d);
    if (txt !== p.txt || fresh) {
      p.txt = txt;
      p.obj = Object.freeze({ peer: from, by: null, isMe: false, sameTab: false, kind: 'viewer', guest: false, presence: deepFreeze(JSON.parse(txt)), updatedAt: now });
      this.snapshot = null;
      this._queue(fresh ? 'joined' : 'updated', p.obj);
    }
  }
  _expire(now) {
    for (const [id, p] of this.peerMap) if (now - p.heard > this.host.expireMs) { this.peerMap.delete(id); this.snapshot = null; this._queue('left', p.obj); }
  }
  _queue(kind, peer) {
    const P = this.pending;
    if (kind === 'left') { if (P.joined.has(peer.peer)) P.joined.delete(peer.peer); else P.left.set(peer.peer, peer); P.updated.delete(peer.peer); }
    else if (kind === 'joined') { P.left.delete(peer.peer); P.joined.set(peer.peer, peer); }
    else if (P.joined.has(peer.peer)) P.joined.set(peer.peer, peer); else P.updated.set(peer.peer, peer);
    this._scheduleDeliver();
  }
  _scheduleDeliver() {
    if (this.deliverH != null || !this.listeners.size) return;
    this.deliverH = this.host.clock.setTimeout(() => { this.deliverH = null; this._deliver(); }, 16);
  }
  _deliver() {
    const peers = this.peers(), P = this.pending;
    const change = { peers, joined: Object.freeze([...P.joined.values()]), left: Object.freeze([...P.left.values()]), updated: Object.freeze([...P.updated.values()]) };
    P.joined.clear(); P.left.clear(); P.updated.clear();
    for (const rec of [...this.listeners]) {
      const ch = rec.first ? { peers, joined: peers, left: Object.freeze([]), updated: Object.freeze([]) } : change;
      rec.first = false;
      try { rec.handler(Object.freeze(ch)); } catch (e) { console.error('[mockroom] onPeers handler', e); }
    }
  }
}

/** The page's `room` namespace (lobby room + join(name)). */
export class MockRoom {
  /**
   * @param {object} [o]
   * @param {{send:Function,onMessage:Function,close?:Function}} [o.wire]
   * @param {typeof realClock} [o.clock]
   * @param {{lat?:number, jit?:number, drop?:number, reorder?:boolean}} [o.net]  receive-side network simulation (ms, 0..1)
   * @param {string} [o.peerId]
   * @param {() => number} [o.random]
   */
  constructor(o = {}) {
    this.clock = o.clock || realClock; this.net = { lat: 0, jit: 0, drop: 0, reorder: false, ...(o.net || {}) };
    this.expireMs = o.expireMs || 8000;   // a page not heard from for this long has left (crashed tab)
    this.random = o.random || Math.random;
    this.peerId = o.peerId || Array.from({ length: 16 }, () => 'abcdefghjkmnpqrstuvwxyz23456789'[Math.floor(this.random() * 31)]).join('');
    this.wire = o.wire || new BroadcastChannelWire(o.channel);
    this.rooms = new Map(); this.connL = new Set(); this.connectedNow = false; this.budget = []; this.seq = 0; this.lastAt = new Map(); this.dropReported = false;
    this.wire.onMessage((m) => this._wire(m));
    const lobby = new MockNamedRoom(this, '');
    this.rooms.set('', lobby); this.lobby = lobby;
    this.clock.setTimeout(() => {
      this.connectedNow = true;
      for (const f of [...this.connL]) { try { f(true); } catch { /* ignore */ } }
      for (const r of this.rooms.values()) this.send({ k: 'j', r: r.name, d: r.mine });   // rooms joined before the connection came up
    }, 40);
    this.kaH = this.clock.setInterval(() => this._keepalive(), KEEPALIVE_MS);
    if (typeof addEventListener === 'function') addEventListener('pagehide', () => this.close());
    // contract surface of the lobby room
    for (const k of ['emit', 'on', 'presence', 'peers', 'onPeers']) this[k] = (...a) => lobby[k](...a);
  }
  connected() { return this.connectedNow; }
  onConnection(handler, onError) {
    void onError;
    this.connL.add(handler);
    Promise.resolve().then(() => { if (this.connL.has(handler)) handler(this.connectedNow); });
    return () => this.connL.delete(handler);
  }
  join(name) {
    if (typeof name !== 'string' || !NAME_RE.test(name)) return Promise.reject(err('invalid_argument', 'room name grammar'));
    if (this.rooms.has(name)) return Promise.resolve(this.rooms.get(name));
    if (this.rooms.size > 16) return Promise.reject(err('limit_reached', 'too many rooms'));
    const r = new MockNamedRoom(this, name);
    this.rooms.set(name, r);
    this.send({ k: 'j', r: name, d: r.mine });
    return new Promise((res) => this.clock.setTimeout(() => res(r), 20));
  }
  sendToClaudeSession() { return Promise.reject(err('claude_unavailable', 'mock room')); }
  canSendToClaudeSession() { return Promise.resolve('off'); }
  /** shared send budget: ~40/s, burst 80 */
  spend() {
    const now = this.clock.now(), b = this.budget;
    while (b.length && now - b[0] > 1000) b.shift();
    if (b.length >= 80 || (b.length >= 40 && now - b[b.length - 40] < 1000)) return false;
    b.push(now); return true;
  }
  reportDrop() { if (!this.dropReported) { this.dropReported = true; console.warn('[mockroom] emits over ~40/s dropped'); } }
  send(msg) { if (!this.connectedNow && msg.k !== 'l') return; this.wire.send({ ...msg, f: this.peerId, seq: ++this.seq }); }
  _keepalive() {
    const now = this.clock.now();
    for (const r of this.rooms.values()) { if (r.joined) { this.send({ k: 'ka', r: r.name, d: r.mine }); r._expire(now); } }
  }
  _wire(m) {
    if (!m || m.f === this.peerId || typeof m.r !== 'string') return;
    const room = this.rooms.get(m.r); if (!room) return;
    const N = this.net, reliable = m.k === 'l' || m.k === 'j';
    if (!reliable && N.drop > 0 && this.random() < N.drop) return;
    let delay = Math.max(0, (N.lat || 0) + (N.jit ? (this.random() * 2 - 1) * N.jit : 0));
    const now = this.clock.now(), key = m.f + '|' + m.r;
    let at = now + delay;
    if (!N.reorder || reliable) { const last = this.lastAt.get(key) || 0; if (at < last) at = last; this.lastAt.set(key, at); }
    if (at <= now) room._recv(m.f, m); else this.clock.setTimeout(() => room._recv(m.f, m), at - now);
  }
  close() {
    if (this.closed) return; this.closed = true;
    for (const r of [...this.rooms.values()]) if (r.joined) this.send({ k: 'l', r: r.name });
    this.clock.clearInterval(this.kaH);
    if (this.wire.close) this.wire.close();
  }
}

/** ?net=mock options from URL params (latency etc.) */
export function mockOptionsFromParams(params) {
  const g = (k, d) => (params && params.has && params.has(k) ? Number(params.get(k)) : d);
  return {
    channel: 'sv-mock-' + ((params && params.get && params.get('mockch')) || 'room'),
    expireMs: g('mockexpire', 8000),
    net: { lat: g('mocklat', 0), jit: g('mockjit', 0), drop: g('mockdrop', 0), reorder: params && params.get && params.get('mockreorder') === '1' },
  };
}
