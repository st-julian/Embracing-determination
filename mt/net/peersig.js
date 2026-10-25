// mt/net/peersig.js — TEST-ONLY stand-in for the PeerJS signaling server (?net=peer&peersig=bc). Owner: netplay.
//
// The container that builds the game cannot reach 0.peerjs.com, so the PeerJS client talks to this instead: a fake
// WebSocket for the host "peersig.invalid" that speaks the PeerJS server protocol (OPEN, ID-TAKEN, EXPIRE, forwarding of
// OFFER / ANSWER / CANDIDATE / LEAVE with `src` added) between the pages of one browser over a BroadcastChannel.
// Everything after signaling is real WebRTC (host candidates on localhost). Inert unless installed.

export const SIG_HOST = 'peersig.invalid';

let installed = null;
/** patch window.WebSocket for SIG_HOST only; returns the PeerJS server options pointing at the stand-in */
export function installPeerSignalShim(channel = 'sv-peersig') {
  const opts = { host: SIG_HOST, port: 443, secure: true, path: '/', key: 'peerjs', pingInterval: 5000 };
  if (installed) return opts;
  const Native = window.WebSocket;
  const ch = new BroadcastChannel(channel);
  const sockets = new Map();   // id -> open FakeSocket in THIS page
  const claims = new Map();    // nonce -> {taken}
  const acks = new Map();      // message id -> timer (an OFFER nobody picked up -> EXPIRE)
  const rid = () => Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  ch.onmessage = (e) => {
    const m = e.data; if (!m || typeof m !== 'object') return;
    if (m.k === 'claim') { if (sockets.has(m.id)) ch.postMessage({ k: 'taken', nonce: m.nonce }); }
    else if (m.k === 'taken') { const c = claims.get(m.nonce); if (c) c.taken = true; }
    else if (m.k === 'msg') { const s = sockets.get(m.dst); if (s) { ch.postMessage({ k: 'ack', mid: m.mid }); s._deliver(m.m); } }
    else if (m.k === 'ack') { const t = acks.get(m.mid); if (t != null) { clearTimeout(t); acks.delete(m.mid); } }
  };
  class FakeSocket {
    constructor(url) {
      this.url = String(url); this.readyState = 0; this.onopen = this.onmessage = this.onclose = this.onerror = null;
      this.id = new URL(this.url).searchParams.get('id') || '';
      const nonce = rid(), c = { taken: false };
      claims.set(nonce, c);
      ch.postMessage({ k: 'claim', id: this.id, nonce });
      setTimeout(() => {
        claims.delete(nonce);
        if (this.readyState !== 0) return;
        this.readyState = 1;
        if (this.onopen) this.onopen({});
        if (c.taken || sockets.has(this.id)) { this._deliver({ type: 'ID-TAKEN', payload: { msg: 'ID is taken' } }); this.close(); return; }
        sockets.set(this.id, this);
        this._deliver({ type: 'OPEN' });
      }, 150);
    }
    send(txt) {
      if (this.readyState !== 1) return;
      let d; try { d = JSON.parse(txt); } catch { return; }
      if (!d || d.type === 'HEARTBEAT' || !d.dst) return;
      const m = { ...d, src: this.id };
      const local = sockets.get(d.dst);
      if (local) { setTimeout(() => local._deliver(m), 0); return; }
      const mid = rid();
      ch.postMessage({ k: 'msg', dst: d.dst, mid, m });
      if (d.type === 'OFFER') acks.set(mid, setTimeout(() => { acks.delete(mid); this._deliver({ type: 'EXPIRE', src: d.dst, dst: this.id }); }, 1500));
    }
    _deliver(m) { if (this.readyState === 1 && this.onmessage) this.onmessage({ data: JSON.stringify(m) }); }
    close() {
      if (this.readyState === 3) return;
      this.readyState = 3;
      if (sockets.get(this.id) === this) sockets.delete(this.id);
      if (this.onclose) this.onclose({ code: 1000, reason: '' });
    }
  }
  function WS(url, protocols) { return String(url).includes('//' + SIG_HOST) ? new FakeSocket(url) : new Native(url, protocols); }
  Object.assign(WS, { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 });
  WS.prototype = Native.prototype;
  window.WebSocket = WS;
  installed = { ch };
  return opts;
}
