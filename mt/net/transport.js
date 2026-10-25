// mt/net/transport.js — how the page reaches other players. Owner: netplay.
//
// Three interchangeable transports, all with the claude.ai `room` surface (room.d.ts 0.2.90, the parts we use), so
// RoomTransport, NetController and the lockstep run unchanged on each:
//   claude.ai room   `claude.use("room")` resolves non-null (the page runs as an Artifact on claude.ai): the platform's
//                    realtime relay among the signed-in people who have the page open, a lobby room with everyone
//                    (open games are advertised there) + named game rooms.
//   PeerTransport    otherwise (a plain static host, localhost, a saved copy): WebRTC DataChannels in a host star,
//                    signaling over the public PeerJS server, public STUN (peer.js). No lobby discovery: games are
//                    shared by code or by the link <page>?join=<code>.
//   MockRoom         ?net=mock: in-page room over BroadcastChannel (two tabs / Playwright pages), with simulated
//                    latency / jitter / drops — the test stand-in for the claude.ai room.
//   ?net=peer forces PeerTransport (&peersig=bc: BroadcastChannel signaling stand-in for tests), ?net=off disables.
//
// The lobby room only carries game ADVERTS in presence: {host: {code, name, players, max, open, v}}. Each game is a
// named room "sv-<code>" (presence per room, same peer label, the publishing Claude session never joins one).

import { MockRoom, mockOptionsFromParams } from './mockroom.js';
import { PeerNet, peerSupported } from './peer.js';

export const ROOM_PREFIX = 'sv-';
export const CODE_ALPHABET = 'ACDEFGHJKMNPQRTUVWXY34679';   // no 0/O, 1/I/L, 2/Z, 5/S, 8/B
export const CODE_RE = /^[ACDEFGHJKMNPQRTUVWXY34679]{4}$/;

/**
 * @param {URLSearchParams} [params]
 * @returns {Promise<{room: object|null, kind: 'room'|'peer'|'mock'|'off'|'none', reason?: string}>}
 */
export async function acquireRoom(params) {
  const mode = params && params.get ? params.get('net') : null;
  if (mode === 'off') return { room: null, kind: 'off', reason: 'disabled' };
  if (mode === 'mock') {
    try { return { room: new MockRoom(mockOptionsFromParams(params)), kind: 'mock' }; } catch (e) { return { room: null, kind: 'none', reason: 'mock: ' + (e && e.message) }; }
  }
  let why = 'no-claude';
  const C = typeof window !== 'undefined' ? window.claude : globalThis.claude;
  if (mode !== 'peer' && C && typeof C.use === 'function') {
    try {
      // claude.use resolves null itself after 10 s when no viewer answers; the race is a belt-and-braces bound
      const room = await Promise.race([C.use('room'), new Promise((r) => setTimeout(() => r(null), 12000))]);
      if (room) return { room, kind: 'room' };
      why = 'room-null';
    } catch (e) { why = 'use-failed: ' + String(e && (e.code || e.message) || e); }
  }
  return peerRoom(params, why);
}

/** PeerTransport (WebRTC + PeerJS signaling); null when this browser has no WebRTC */
async function peerRoom(params, why) {
  if (!peerSupported()) return { room: null, kind: 'none', reason: why + '; no-webrtc' };
  const g = (k) => (params && params.get ? params.get(k) : null), o = {};
  try {
    if (g('peersig') === 'bc') { const m = await import('./peersig.js'); o.peerOptions = m.installPeerSignalShim('sv-peersig-' + (g('mockch') || 'x')); }
    if (+g('peerdebug')) o.peerOptions = { ...(o.peerOptions || {}), debug: Math.min(3, +g('peerdebug')) };   // PeerJS console logging
    const lat = +g('mocklat') || 0, jit = +g('mockjit') || 0;
    if (lat || jit) o.net = { lat, jit };   // test-only receive delay (FIFO; the channel itself is reliable + ordered)
    return { room: new PeerNet(o), kind: 'peer', reason: why };
  } catch (e) { return { room: null, kind: 'none', reason: why + '; peer: ' + String(e && e.message || e) }; }
}

/** Thin wrapper over a `room` namespace (real or mock). Never throws: room failures are reported, not raised. */
export class RoomTransport {
  constructor(room, kind) {
    this.room = room; this.kind = kind; this.errors = []; this.terminal = null; this.connectedNow = false;
    try {
      room.onConnection((c) => { this.connectedNow = !!c; }, (e) => this.fail(e));
      room.onPeers(() => {}, (e) => this.fail(e));   // keeps the lobby snapshot live; errors arrive here once
    } catch (e) { this.fail(e); }
  }
  fail(e) {
    const code = (e && e.code) || 'upstream_error';
    this.errors.push(code + ': ' + String((e && e.message) || '').slice(0, 120));
    if (this.errors.length > 20) this.errors.shift();
    if (['revoked', 'not_granted', 'capability_disabled', 'capability_removed', 'transform_error'].includes(code)) this.terminal = code;
  }
  get usable() { return !this.terminal; }
  connected() { try { return !!this.room.connected(); } catch { return false; } }
  /** my peer label (same on everyone's page), once the platform answered */
  selfPeer(r = this.room) {
    try { const me = r.peers().find((p) => p.isMe && p.sameTab); return me ? me.peer : null; } catch { return null; }
  }
  peers(r = this.room) { try { return r.peers(); } catch { return []; } }
  /** merge into my presence; resolves true/false (invalid_argument = a page bug: logged) */
  presence(r, patch) {
    try {
      return r.presence(patch).then(() => true, (e) => { this.fail(e); return false; });
    } catch (e) { this.fail(e); return Promise.resolve(false); }
  }
  /** join a named room; {create} matters only to PeerTransport (the host registers the room's id) */
  async join(name, opts = {}) {
    try { return await (this.kind === 'peer' ? this.room.join(name, opts) : this.room.join(name)); } catch (e) { this.fail(e); throw e; }
  }
  /** the claude.ai room / MockRoom list games in the lobby and survive a host leaving; the WebRTC star does neither */
  get discovery() { return this.kind !== 'peer'; }
  get migrates() { return this.kind !== 'peer'; }
}

/** a fresh 4-character room code (crypto RNG when available; it only names a room) */
export function makeCode() {
  let s = '';
  const n = CODE_ALPHABET.length;
  const rnd = () => { try { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] / 4294967296; } catch { return Math.random(); } };
  for (let i = 0; i < 4; i++) s += CODE_ALPHABET[Math.floor(rnd() * n)];
  return s;
}
export const roomName = (code) => ROOM_PREFIX + String(code).toLowerCase();
export function normCode(s) { return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4); }
