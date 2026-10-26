// mt/net/peer.js — PeerTransport: the room contract over WebRTC DataChannels. Owner: netplay.
//
// For pages served OUTSIDE claude.ai (a plain static host: Vercel, GitHub Pages, localhost), where the `room` capability
// does not exist. Same surface as the claude.ai room (room.d.ts 0.2.90, the parts the game uses), so RoomTransport,
// NetController and the lockstep session run unchanged on top of it:
//   PeerNet  (the "lobby room"):  connected(), onConnection(), peers(), onPeers(), presence(patch), join(name, {create})
//   PeerRoom (a game room):       peers(), onPeers(), presence(patch), connected(), leave()
//
// Topology: a STAR around the game's host. The host registers the PeerJS id  "sundered-vale-<code>"  on the signaling
// server (the public PeerJS cloud, 0.peerjs.com, by default); a guest registers a random id and opens ONE reliable,
// ordered DataChannel to the host. Every presence change goes guest -> host -> every other guest (the host merges and
// relays), so each page sees the same per-peer absolute state the claude.ai room delivers. Messages (JSON):
//   guest -> host   {t:'hi', p:label, v:1, d:presence}   {t:'pr', d:patch}   {t:'ka'}   {t:'bye'}
//   host  -> guest  {t:'snap', ps:[[label, presence]...]}   {t:'up', m:{label: patch}, lv:[label...]}   {t:'ka'}   {t:'bye'}
// A patch is the room contract's: top-level keys replace, null removes. Coalesced to <= 60 sends/s each way (the
// lockstep publishes ~30/s; a short coalescing window keeps the added latency small);
// keepalive 1 s; a connection silent for 20 s of THIS page's running time is gone (a closed tab closes its channel at
// once; WebRTC's own consent checks end a dead one in ~30 s; a page busy loading a match must not be dropped — the
// lockstep replaces a stuck player after 8 s on its own). Timeouts count running time, so a starved page (slow phone,
// heavy loading) does not give up on a peer whose messages are simply still queued. Everything received is untrusted: labels, sizes, JSON shapes and
// the 4 KiB presence limit are checked; a guest can only change its OWN presence (the host keys it by connection).
//
// No global discovery: PeerJS cannot list rooms, so the lobby room only holds this page (open games are shared by code /
// link). No host migration: when the host leaves, the guests lose each other (a match continues on each page with bots).
// Reconnect: a channel that closes WITHOUT 'bye' (iPad: the app went to the background, Wi-Fi hiccup) is not a
// departure yet. The guest re-dials the host every 1.5 s (re-opening the signaling socket first if it dropped; at
// once when the page becomes visible again: wake()) and says {t:'hi', re:1} with its label; the host keeps that
// member's presence meanwhile and swaps the new channel in. Gone for good after 20 s — by then the lockstep has
// handed the trainer to a bot anyway (8 s, or 20 s after the peer said it went to another app).
// ICE: public STUN only (Google). There is no TURN relay, so two strict NATs (some mobile carriers) may fail to connect.
//
// The PeerJS client (MIT) is vendored in ./vendor/peerjs.min.js and loaded on first use (never from a CDN).
// Tests: ?peersig=bc swaps the signaling server for a BroadcastChannel stand-in (peersig.js), real WebRTC otherwise.

import { validate, deepFreeze, utf8Len, PRESENCE_LIMIT, KEY_RE, realClock } from './mockroom.js';

export const PEER_PREFIX = 'sundered-vale-';
export const ICE_SERVERS = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }];
const LABEL_RE = /^[a-z0-9]{8,32}$/;
const LABEL_ABC = 'abcdefghjkmnpqrstuvwxyz23456789';
const MAX_MSG = 24000, FLUSH_MS = 16, RELAY_MS = 16, KA_MS = 1000, DEAD_MS = 20000, HELLO_MS = 20000, JOIN_MS = 25000, MAX_GUESTS = 11;
const RECONNECT_MS = 20000, REDIAL_MS = 1500, STALE_MS = 3000;   // a dropped channel (iPad app switch) may come back

const err = (code, message) => Object.assign(new Error(message || code), { code });
export function randLabel(n = 16) {
  let s = '';
  for (let i = 0; i < n; i++) {
    let r;
    try { const a = new Uint32Array(1); crypto.getRandomValues(a); r = a[0] / 4294967296; } catch { r = Math.random(); }
    s += LABEL_ABC[Math.floor(r * LABEL_ABC.length)];
  }
  return s;
}
/** WebRTC data channels in this browser? (the transport is offered only then) */
export function peerSupported() { return typeof RTCPeerConnection === 'function'; }

let loading = null;
/** the vendored PeerJS client (window.peerjs.Peer), loaded once by a classic <script> */
export function loadPeerJS(src) {
  if (typeof window !== 'undefined' && window.peerjs && window.peerjs.Peer) return Promise.resolve(window.peerjs.Peer);
  if (loading) return loading;
  loading = new Promise((res, rej) => {
    if (typeof document === 'undefined') { rej(err('unsupported', 'no document')); return; }
    const s = document.createElement('script');
    s.src = src || new URL('./vendor/peerjs.min.js', import.meta.url).href;
    s.async = true;
    s.onload = () => (window.peerjs && window.peerjs.Peer ? res(window.peerjs.Peer) : rej(err('unsupported', 'peerjs did not load')));
    s.onerror = () => rej(err('unsupported', 'peerjs script failed'));
    document.head.appendChild(s);
  }).catch((e) => { loading = null; throw e; });
  return loading;
}

/** merge a presence patch into `cur` (copy); returns [next, error] */
function mergePatch(cur, patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return [cur, 'patch must be an object'];
  const next = { ...cur };
  for (const k of Object.keys(patch)) {
    if (!KEY_RE.test(k) || k === '__proto__') return [cur, 'key is not an identifier: ' + k];
    if (patch[k] === null) delete next[k]; else next[k] = patch[k];
  }
  const e = validate(next, 1); if (e) return [cur, e];
  const n = utf8Len(JSON.stringify(next));
  if (n > PRESENCE_LIMIT) return [cur, 'presence is ' + n + ' bytes of JSON; the limit is ' + PRESENCE_LIMIT];
  return [next, null];
}
const peerObj = (label, pres, me, now) => Object.freeze({ peer: label, by: null, isMe: me, sameTab: me, kind: 'viewer', guest: false, presence: deepFreeze(JSON.parse(JSON.stringify(pres))), updatedAt: now });

/** The page's namespace: a lobby room with only this page in it + join(name, {create}) */
export class PeerNet {
  /**
   * @param {object} [o]
   * @param {Function} [o.Peer]          PeerJS Peer constructor (default: the vendored client, loaded on first join)
   * @param {object}   [o.peerOptions]   extra Peer options (host/port/path/key/secure of the signaling server, debug)
   * @param {Array}    [o.iceServers]
   * @param {{lat?:number, jit?:number}} [o.net]   receive-side latency for tests (FIFO per connection)
   * @param {typeof realClock} [o.clock]
   * @param {string}   [o.label]         this page's peer label (random)
   */
  constructor(o = {}) {
    this.o = o; this.clock = o.clock || realClock; this.label = o.label || randLabel();
    this.net = { lat: 0, jit: 0, ...(o.net || {}) };
    this.rooms = new Map(); this.mine = {}; this.snap = null; this.listeners = new Set(); this.kind = 'peer';
    // closing the tab: say 'bye' so the others see the departure at once (not after the channel times out)
    if (typeof addEventListener === 'function' && typeof window !== 'undefined') addEventListener('pagehide', () => this.close());
  }
  connected() { return true; }
  onConnection(handler) { Promise.resolve().then(() => handler(true)); return () => {}; }
  peers() { if (!this.snap) this.snap = Object.freeze([peerObj(this.label, this.mine, true, this.clock.now())]); return this.snap; }
  onPeers(handler) {
    const rec = { handler }; this.listeners.add(rec);
    Promise.resolve().then(() => { if (this.listeners.has(rec)) { const ps = this.peers(); handler(Object.freeze({ peers: ps, joined: ps, left: [], updated: [] })); } });
    return () => this.listeners.delete(rec);
  }
  presence(patch) {
    const [next, e] = mergePatch(this.mine, patch);
    if (e) return Promise.reject(err('invalid_argument', e));
    this.mine = next; this.snap = null;
    return Promise.resolve();
  }
  emit() { return Promise.resolve(); }
  on() { return () => {}; }
  /** join (create: true = host it) a game room "sv-<code>"; rejects {code: id_taken|not_found|signal_failed|webrtc_failed|unsupported|timeout} */
  async join(name, opts = {}) {
    if (typeof name !== 'string' || !/^[a-z0-9][a-z0-9_.-]{0,47}$/.test(name)) throw err('invalid_argument', 'room name grammar');
    const have = this.rooms.get(name);
    if (have && !have.closed) return have;
    const Peer = this.o.Peer || await loadPeerJS(this.o.src);
    const r = new PeerRoom(this, name, Peer, !!opts.create);
    await r.ready;
    this.rooms.set(name, r);
    return r;
  }
  close() { for (const r of this.rooms.values()) r.leave(); this.rooms.clear(); }
  /** the page is visible again: re-open dropped signaling / channels now instead of at the next retry */
  wake() { for (const r of this.rooms.values()) r.wake(); }
}

/** One game room: the host's star (host side or guest side) */
export class PeerRoom {
  constructor(net, name, Peer, host) {
    this.net = net; this.clock = net.clock; this.name = name; this.isHost = host; this.label = net.label;
    this.code = name.replace(/^sv-/, '');
    this.hostId = PEER_PREFIX + this.code;
    this.mine = {}; this.members = new Map();   // label -> {pres, conn (host side), silent (ms of running time)}
    this.snap = null; this.listeners = new Set(); this.closed = false; this.joinedOk = false;
    this.out = new Map(); this.lv = []; this.flushH = null; this.lastFlush = -1e9;   // host: label -> merged patch to relay
    this.pend = null;                                                               // guest: my merged unsent patch
    this.conn = null; this.hostSilent = 0; this.sentAt = new Map(); this.rq = new Map(); this.reconnects = 0;
    this.redial = null; this.closingOld = new WeakSet(); this.reconnectCount = 0;   // guest re-dial state; host: replaced channels
    this.aliveMs = 0; this.lastTickAt = this.clock.now();   // running time (a starved page's timers fire late: capped steps)
    this.ready = new Promise((res, rej) => { this._res = res; this._rej = rej; });
    this.ready.catch(() => {});
    const id = host ? this.hostId : PEER_PREFIX + 'g-' + randLabel(12);
    const P = net.o.peerOptions || {};
    try {
      this.peer = new Peer(id, { debug: 0, ...P, config: { iceServers: net.o.iceServers || ICE_SERVERS, ...(P.config || {}) } });
    } catch (e) { this._fail(err('unsupported', String(e && e.message || e))); return; }
    this.peer.on('open', () => { if (host) this._joined(); else this._connect(); });
    this.peer.on('error', (e) => this._peerError(e));
    this.peer.on('disconnected', () => this._signalLost());
    if (host) this.peer.on('connection', (c) => this._incoming(c));
    this.tickH = this.clock.setInterval(() => this._tick(), 500);
  }
  // ---------------------------------------------------------------- contract surface
  connected() { return !this.closed && (this.isHost ? !!(this.peer && this.peer.open !== false) : !!(this.conn && this.conn.open)); }
  peers() {
    if (!this.snap) {
      const now = this.clock.now(), list = [peerObj(this.label, this.mine, true, now)];
      for (const [label, m] of this.members) list.push(m.obj || (m.obj = peerObj(label, m.pres, false, now)));
      this.snap = Object.freeze(list);
    }
    return this.snap;
  }
  onPeers(handler) {
    const rec = { handler, last: null }; this.listeners.add(rec);
    Promise.resolve().then(() => this._notify());
    return () => this.listeners.delete(rec);
  }
  presence(patch) {
    if (this.closed) return Promise.reject(err('invalid_argument', 'left this room'));
    const [next, e] = mergePatch(this.mine, patch);
    if (e) return Promise.reject(err('invalid_argument', e));
    this.mine = next; this.snap = null;
    if (this.isHost) this._queueOut(this.label, patch);
    else { this.pend = { ...(this.pend || {}), ...patch }; this._schedule(); }   // nulls stay: they remove on the far side
    return Promise.resolve();
  }
  emit() { return Promise.resolve(); }
  on() { return () => {}; }
  /** send what is pending NOW (the page is about to be frozen: iPad app switch) */
  flushNow() { if (this.flushH != null) { this.clock.clearTimeout(this.flushH); this.flushH = null; } this._flush(); }
  /** visible again (see PeerNet.wake) */
  wake() {
    if (this.closed || !this.peer) return;
    this.reconnects = 0;
    try { if (this.peer.disconnected && !this.peer.destroyed) this.peer.reconnect(); } catch { /* retried by _signalLost */ }
    if (!this.isHost && this.joinedOk && !this.hostLost) {
      if (this.redial) this._redial(true);
      else if (this.hostSilent > STALE_MS) this._lost();   // the channel may be dead without a close event (suspended app)
    }
  }
  leave() {
    if (this.closed) return Promise.resolve();
    this.closed = true;
    try {
      if (this.isHost) { for (const m of this.members.values()) this._send(m.conn, { t: 'bye' }); }
      else if (this.conn && this.conn.open) this._send(this.conn, { t: 'bye' });
    } catch { /* closing anyway */ }
    this._cleanup();
    this.net.rooms.delete(this.name);
    return Promise.resolve();
  }
  // ---------------------------------------------------------------- lifecycle
  _cleanup() {
    this.clock.clearInterval(this.tickH); if (this.flushH != null) this.clock.clearTimeout(this.flushH);
    const P = this.peer;
    this.clock.setTimeout(() => { try { if (P) P.destroy(); } catch { /* gone */ } }, 60);   // let the 'bye' leave first
  }
  _joined() {
    if (this.joinedOk || this.closed) return;
    this.joinedOk = true; this._res(this);
  }
  _fail(e) {
    if (this.joinedOk || this.closed) return;
    this.closed = true; this._cleanup(); this._rej(e);
  }
  _peerError(e) {
    const type = e && e.type;
    const code = type === 'unavailable-id' ? 'id_taken' : type === 'peer-unavailable' ? 'not_found' : type === 'browser-incompatible' ? 'unsupported'
      : type === 'webrtc' ? 'webrtc_failed' : ['network', 'server-error', 'socket-error', 'socket-closed', 'ssl-unavailable', 'invalid-key', 'invalid-id'].includes(type) ? 'signal_failed' : 'upstream_error';
    if (!this.joinedOk) { this._fail(err(code, String(e && e.message || type))); return; }
    if (code === 'not_found' || code === 'signal_failed') return;   // after joining: the data connections may still be fine
    if (typeof console !== 'undefined') console.warn('[net] peer', type, e && e.message);
  }
  _signalLost() {
    // the signaling socket dropped (server restart, idle, network blip): data channels keep working; reconnect so new
    // guests can still find the host
    if (this.closed || !this.peer || this.peer.destroyed) return;
    if (this.reconnects++ > 20) return;
    this.clock.setTimeout(() => { try { if (!this.closed && this.peer && this.peer.disconnected && !this.peer.destroyed) this.peer.reconnect(); } catch { /* next time */ } }, Math.min(30000, 1000 * this.reconnects));
  }
  _tick() {
    if (this.closed) return;
    const now = this.clock.now(), step = Math.min(750, Math.max(0, now - this.lastTickAt));
    this.lastTickAt = now; this.aliveMs += step;
    if (!this.joinedOk) {
      if (this.aliveMs > JOIN_MS) this._fail(!(this.peer && this.peer.open) ? err('signal_failed', 'signaling server did not answer') : this.isHost || this.connOpened ? err('timeout', 'host did not answer') : err('webrtc_failed', 'no direct connection to the host'));
      return;
    }
    if (this.isHost) {
      for (const [label, m] of this.members) {
        m.silent += step;
        if (m.silent > (m.lost ? RECONNECT_MS : DEAD_MS)) { this._drop(label, 'silent'); continue; }
        if (!m.lost && now - (this.sentAt.get(m.conn) || 0) > KA_MS) this._send(m.conn, { t: 'ka' });
      }
    } else if (this.redial) {
      this.redial.ms += step;
      if (this.redial.ms > RECONNECT_MS) { this._hostGone(); return; }
      if (now >= this.redial.next) this._redial(false);
    } else if (this.conn && this.conn.open) {
      this.hostSilent += step;
      if (this.hostSilent > DEAD_MS) { this._lost(); return; }
      if (now - (this.sentAt.get(this.conn) || 0) > KA_MS) this._send(this.conn, { t: 'ka' });
    }
  }
  _send(conn, msg) {
    if (!conn || !conn.open) return false;
    try { conn.send(msg); this.sentAt.set(conn, this.clock.now()); return true; } catch { return false; }
  }
  /**
   * receive-side latency for tests: strictly FIFO per connection, like the ordered channel underneath. ONE timer drains a
   * per-connection queue in order — never a timer per message: browsers truncate a timeout to whole ms (WebIDL long),
   * so two messages due within the same millisecond could fire in the wrong order, and a presence PATCH applied out of
   * order leaves stale keys behind (the cause of the WebRTC net-test desync, netplay.md "Desync forensics").
   */
  _recv(conn, fn) {
    const N = this.net.net;
    if (!N.lat && !N.jit) { fn(); return; }
    const now = this.clock.now();
    let q = this.rq.get(conn); if (!q) this.rq.set(conn, (q = { list: [], h: null, last: 0 }));
    const at = Math.max(now + Math.max(0, N.lat + (N.jit ? (Math.random() * 2 - 1) * N.jit : 0)), q.last);
    q.last = at; q.list.push([at, fn]);
    if (q.h == null) this._drain(q);
  }
  _drain(q) {
    const wait = Math.max(0, Math.ceil(q.list[0][0] - this.clock.now()));
    q.h = this.clock.setTimeout(() => {
      q.h = null;
      const now = this.clock.now();
      while (q.list.length && q.list[0][0] <= now + 0.5) { const fn = q.list.shift()[1]; try { fn(); } catch (e) { console.error('[peer] recv', e); } }
      if (q.list.length) this._drain(q);
    }, wait);
  }
  _ok(m) { return m && typeof m === 'object' && !Array.isArray(m) && typeof m.t === 'string' && utf8Len(JSON.stringify(m)) <= MAX_MSG; }
  _changed() { this.snap = null; Promise.resolve().then(() => this._notify()); }
  _notify() {
    if (!this.listeners.size) return;
    const ps = this.peers();
    for (const rec of [...this.listeners]) {
      const was = rec.last ? new Map(rec.last.map((p) => [p.peer, p])) : new Map();
      const now = new Map(ps.map((p) => [p.peer, p]));
      const joined = ps.filter((p) => !was.has(p.peer)), left = [...was.values()].filter((p) => !now.has(p.peer)), updated = ps.filter((p) => was.has(p.peer) && was.get(p.peer) !== p);
      rec.last = ps;
      if (!joined.length && !left.length && !updated.length) continue;
      try { rec.handler(Object.freeze({ peers: ps, joined, left, updated })); } catch (e) { console.error('[peer] onPeers handler', e); }
    }
  }
  _schedule() {
    if (this.flushH != null || this.closed) return;
    // <= 60 sends/s (guest -> guest is two legs: keep each hop's coalescing short)
    const wait = Math.max(0, this.lastFlush + (this.isHost ? RELAY_MS : FLUSH_MS) - this.clock.now());
    this.flushH = this.clock.setTimeout(() => { this.flushH = null; this._flush(); }, wait);
  }
  _flush() {
    if (this.closed) return;
    this.lastFlush = this.clock.now();
    if (!this.isHost) {
      if (this.pend && this.conn && this.conn.open) { if (this._send(this.conn, { t: 'pr', d: this.pend })) this.pend = null; else this._schedule(); }
      return;
    }
    let retry = false;
    for (const mem of this.members.values()) if (mem.retry) retry = true;
    if (!this.out.size && !this.lv.length && !retry) return;
    retry = false;
    for (const [label, mem] of this.members) {
      // a patch that could not be sent on an OPEN channel is merged into the next one for that member (never dropped:
      // the receiver would keep stale keys); a closed channel is resynced whole by the snap when the guest re-dials
      const R = mem.retry; mem.retry = null;
      const m = R ? R.m : {}, lv = R ? R.lv : [];
      let any = !!R && Object.keys(m).length > 0;
      for (const [who, p] of this.out) if (who !== label) { m[who] = m[who] ? { ...m[who], ...p } : p; any = true; }
      for (const x of this.lv) if (x !== label && !lv.includes(x)) lv.push(x);
      if (!any && !lv.length) continue;
      if (!this._send(mem.conn, lv.length ? { t: 'up', m, lv } : { t: 'up', m }) && mem.conn && mem.conn.open) { mem.retry = { m, lv }; retry = true; }
    }
    this.out.clear(); this.lv = [];
    if (retry) this._schedule();
  }
  _queueOut(label, patch) {
    const cur = this.out.get(label) || {};
    this.out.set(label, { ...cur, ...patch });
    this._schedule();
  }
  // ---------------------------------------------------------------- host side
  _incoming(c) {
    if (this.closed) { try { c.close(); } catch { /* */ } return; }
    if (this.members.size >= MAX_GUESTS) { this.clock.setTimeout(() => { try { c.close(); } catch { /* */ } }, 50); return; }
    let label = null;
    const helloT = this.clock.setTimeout(() => { if (!label) { try { c.close(); } catch { /* */ } } }, HELLO_MS);
    c.on('data', (raw) => this._recv(c, () => {
      if (this.closed) return;
      const m = typeof raw === 'string' ? safeParse(raw) : raw;
      if (!this._ok(m)) return;
      if (!label) {
        const back = m.re === 1 && typeof m.p === 'string' && this.members.has(m.p);   // a member re-dialing after a drop
        if (m.t !== 'hi' || typeof m.p !== 'string' || !LABEL_RE.test(m.p) || m.p === this.label || (this.members.has(m.p) && !back)) { try { c.close(); } catch { /* */ } return; }
        const [pres, e] = mergePatch({}, m.d && typeof m.d === 'object' ? m.d : {});
        if (e) { try { c.close(); } catch { /* */ } return; }
        label = m.p; this.clock.clearTimeout(helloT);
        if (back) { const old = this.members.get(label).conn; if (old && old !== c) { this.closingOld.add(old); try { old.close(); } catch { /* */ } } }
        this.members.set(label, { pres, conn: c, silent: 0, obj: null, lost: false });
        const ps = [[this.label, this.mine]]; for (const [l, x] of this.members) if (l !== label) ps.push([l, x.pres]);
        this._send(c, { t: 'snap', ps });
        this.out.set(label, { ...pres }); this._schedule();   // the newcomer, whole, to everyone else
        this.lv = this.lv.filter((x) => x !== label);
        this._changed();
        return;
      }
      const mem = this.members.get(label); if (!mem || mem.conn !== c) return;
      mem.silent = 0;
      if (m.t === 'pr') {
        const [pres, e] = mergePatch(mem.pres, m.d);
        if (e) return;   // an invalid patch is dropped, not relayed
        mem.pres = pres; mem.obj = null; this._queueOut(label, m.d); this._changed();
      } else if (m.t === 'bye') this._drop(label, 'left');
    }));
    // closed without 'bye': keep the member (and its presence) — it may re-dial; _tick drops it after DEAD_MS
    const gone = () => { const mem = label && this.members.get(label); if (mem && mem.conn === c && !this.closingOld.has(c)) mem.lost = true; };
    c.on('close', gone); c.on('error', gone);
  }
  _drop(label, why) {
    const mem = this.members.get(label); if (!mem) return;
    void why;
    this.members.delete(label); this.out.delete(label); this.lv.push(label); this._schedule();
    try { mem.conn.close(); } catch { /* */ }
    this._changed();
  }
  // ---------------------------------------------------------------- guest side
  _connect(re = false) {
    let c;
    try { c = this.peer.connect(this.hostId, { reliable: true, serialization: 'json', metadata: { sv: 1 } }); } catch (e) { if (re) return; this._fail(err('webrtc_failed', String(e && e.message || e))); return; }
    if (!c) { if (!re) this._fail(err('webrtc_failed', 'connect returned nothing')); return; }
    this.conn = c;
    c.on('open', () => {
      if (c !== this.conn) return;
      this.connOpened = true; this.hostSilent = 0;
      this._send(c, re ? { t: 'hi', p: this.label, v: 1, d: this.mine, re: 1 } : { t: 'hi', p: this.label, v: 1, d: this.mine });
      this.pend = null;
    });
    c.on('data', (raw) => this._recv(c, () => {
      if (this.closed || c !== this.conn) return;
      const m = typeof raw === 'string' ? safeParse(raw) : raw;
      if (!this._ok(m)) return;
      this.hostSilent = 0;
      if (m.t === 'snap' && Array.isArray(m.ps)) {
        this.members.clear();
        for (const e of m.ps) this._apply(e && e[0], e && e[1], true);
        if (this.redial) { this.redial = null; this.reconnectCount++; }   // back in the star
        this._changed(); this._joined();
      } else if (m.t === 'up' && m.m && typeof m.m === 'object') {
        for (const l of Object.keys(m.m)) this._apply(l, m.m[l], false);
        if (Array.isArray(m.lv)) for (const l of m.lv) if (this.members.delete(l)) { /* left */ }
        this._changed();
      } else if (m.t === 'bye') this._hostGone();
    }));
    c.on('close', () => { if (c === this.conn) this._lost(); });
    c.on('error', (e) => { if (!this.joinedOk) this._fail(err('webrtc_failed', String(e && e.message || e))); else if (c === this.conn) this._lost(); });
  }
  /** the channel to the host closed / went silent without 'bye': keep everyone's presence, re-dial for a while */
  _lost() {
    if (!this.joinedOk) { this._hostGone(); return; }
    if (this.hostLost || this.closed || this.redial) return;
    const old = this.conn; this.conn = null;
    if (old) { try { old.close(); } catch { /* */ } }
    this.redial = { ms: 0, next: this.clock.now() + 200 };
  }
  _redial(now) {
    const R = this.redial; if (!R || this.closed) return;
    R.next = this.clock.now() + REDIAL_MS;
    try {
      if (this.peer.disconnected && !this.peer.destroyed) { this.peer.reconnect(); return; }   // signaling first; dial next round
      if (!this.peer.open) return;
      if (this.conn) { const c = this.conn; this.conn = null; try { c.close(); } catch { /* */ } }
      this._connect(true);
    } catch { /* next round */ }
    void now;
  }
  _apply(label, patch, whole) {
    if (typeof label !== 'string' || !LABEL_RE.test(label) || label === this.label) return;
    const cur = this.members.get(label);
    const [pres, e] = mergePatch(whole || !cur ? {} : cur.pres, patch);
    if (e) return;
    this.members.set(label, { pres, conn: null, silent: 0, obj: null });
  }
  _hostGone() {
    // before the channel opened = WebRTC could not connect (NAT / firewall, no TURN); after = the host turned us away
    if (!this.joinedOk) { this._fail(this.connOpened ? err('not_found', 'host closed the connection') : err('webrtc_failed', 'no direct connection to the host')); return; }
    if (this.hostLost) return;
    this.hostLost = true; this.redial = null;
    if (this.conn) { try { this.conn.close(); } catch { /* */ } }
    this.conn = null;
    this.members.clear(); this._changed();   // star topology: without the host nobody else is reachable
  }
}

function safeParse(s) { try { return JSON.parse(s); } catch { return null; } }
