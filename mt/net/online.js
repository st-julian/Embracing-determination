// mt/net/online.js — ONLINE play controller (`app.mtNet`). Owner: netplay. Registered as an mt-ui part (mt/ui/index.js).
//
//   room acquisition  claude.use("room") / PeerTransport (WebRTC) / ?net=mock / none (transport.js); `status` 'init' |
//                     'ready' | 'unavailable'
//   browsing          open games = lobby-room peers whose presence has {host: {code, name, players, max, open, v}}
//                     (claude.ai room / mock only); a code or the invite link <page>?join=<code> works everywhere
//   game room         named room "sv-<code>"; my presence {v, nm, tm, sp, lk, rd, st, [host, code, ord, go]};
//                     the host keeps `ord` (seat order), advertises the game in the lobby room, and on Start publishes
//                     `go` = {mid, seed, pl} (match.js) — every peer then builds the identical world (beginMatch)
//   match             NetSession (lockstep.js) + SessionLink; the legacy loop calls active / pace() / step()
//                     ([MT-HOOK] netPace / netGate in index-*.js qk), the sim's command hook calls session.intercept()
//   rules             app.paused reads false during an online match (the pause menu opens, the sim never stops);
//                     a hidden tab keeps ticking from a timer (rAF stops) so friends are not stalled; overlays: online
//                     badge, "waiting for P2…", peer-left toasts, desync / replaced notices with Rematch / Main menu.
// Test hooks: `testInfo()`, `session`, `?netbot` (scripted local human: in-tick commands for the local unit are input).

import { acquireRoom, RoomTransport, makeCode, roomName, CODE_RE, normCode } from './transport.js';
import { NetSession, SessionLink, TICK_MS } from './lockstep.js';
import { parseGo, netRoster, balanceTeams, cleanName, makeMid, MAX_HUMANS } from './match.js';
import { install as detOn, uninstall as detOff } from './detmath.js';
import { t } from '../i18n/index.js';
import { SPEC_IDS, TEAM_SIZE } from '../data/balance.js';

export const PROTO = 1;
const NAME_KEY = 'sv.net.name';
const JOIN_TIMEOUT_MS = 9000;   // no host in a joined room after this long (of this page's running time) = no such game

function loadName() { try { const v = localStorage.getItem(NAME_KEY); if (v) return cleanName(v); } catch { /* private mode */ } return ''; }
function saveName(v) { try { localStorage.setItem(NAME_KEY, v); } catch { /* private mode */ } }
const nowMs = () => performance.now();

const CSS = `
#mt-net{position:fixed;inset:0;pointer-events:none;z-index:40;font:400 16px/18px 'Vale JP','Vale Pixel',system-ui,sans-serif;color:#0d1230;-webkit-font-smoothing:none}
#mt-net *{font-family:inherit}
#mt-net .nb{position:absolute;left:50%;top:var(--nbt,72px);transform:translateX(-50%);opacity:.92;display:none;gap:6px;align-items:center;padding:1px 8px;background:rgba(18,16,48,.72);color:#fbf8ef;border:2px solid #0d1230;box-shadow:inset 0 0 0 1px #4c5a96;white-space:nowrap;font-size:13px;line-height:16px}
#mt-net .nb i{display:inline-block;width:7px;height:7px;background:#3fb64a;box-shadow:0 0 0 1px #0d1230}
#mt-net .nb.lag i{background:#ffd23a}#mt-net .nb.bad i{background:#e8574f}
#mt-net .nw{position:absolute;left:50%;top:32%;transform:translateX(-50%);display:none;padding:4px 14px 5px;background:#fbf8ef;border:2px solid #0d1230;box-shadow:inset 0 0 0 2px #fff,0 3px 0 rgba(13,18,48,.35);white-space:nowrap}
#mt-net .nw b{display:inline-block;width:10px;height:10px;margin-right:8px;background:#ffd23a;border:2px solid #0d1230;animation:mtnet-blink .8s steps(2,end) infinite;vertical-align:-1px}
@keyframes mtnet-blink{50%{background:#fbf8ef}}
#mt-net .nt{position:absolute;left:50%;top:24%;transform:translateX(-50%);display:flex;flex-direction:column;gap:6px;align-items:center}
#mt-net .nt div{padding:3px 12px 4px;background:#1b2350;color:#fbf8ef;border:2px solid #0d1230;box-shadow:inset 0 0 0 1px #4c5a96;white-space:nowrap}
#mt-net .nm{position:absolute;inset:0;display:none;align-items:center;justify-content:center;background:rgba(10,10,30,.45);pointer-events:auto}
#mt-net .nm .pn{min-width:min(420px,86vw);max-width:92vw;background:#fbf8ef;border:2px solid #0d1230;box-shadow:inset 0 0 0 2px #fff,0 4px 0 rgba(13,18,48,.4);padding:0 0 12px}
#mt-net .nm h3{margin:0 0 10px;padding:4px 12px;background:#1b2350;color:#fbf8ef;font-size:16px;font-weight:400;border-bottom:2px solid #0d1230}
#mt-net .nm p{margin:0 14px 12px;line-height:20px;white-space:normal}
#mt-net .nm .bt{display:flex;gap:10px;justify-content:center;margin:0 12px}
#mt-net .nm .b{min-width:120px;padding:4px 12px 6px;text-align:center;background:#fbf8ef;border:2px solid #0d1230;box-shadow:inset 0 -2px 0 #d6cfb6;cursor:pointer}
#mt-net .nm .b.f{background:#ffd23a;box-shadow:inset 0 -2px 0 #e0a024,inset 0 1px 0 #fff1a8}
#mt-net .nm small{display:block;margin:0 14px 10px;color:#5a6290;font-size:13px}
`;

export class NetController {
  constructor(ctx) {
    this.ctx = ctx; const app = this.app = ctx.app;
    app.mtNet = this;
    this.status = 'init'; this.kind = null; this.reason = ''; this.tr = null; this.readyP = null;
    this.room = null; this.code = null; this.isHost = false; this.joinedAt = 0; this.error = null; this.errorAt = 0;
    this.me = { nm: loadName(), tm: 0, sp: 'attack', lk: 'attack', rd: 0 };
    this.device = { device: 'kbm', inputType: 'kbm', padId: '', padIndex: -1, wasd: false };
    this.ord = []; this.lastGoMid = null; this.go = null; this.cfg = null;
    this.session = null; this.link = null; this.lastReport = null; this.checks = []; this.toasts = [];
    this.lobbyPub = {}; this.lobbyPubAt = -1e9; this.roomPub = {}; this.roomPubAt = -1e9;
    this.modal = null; this.ui = null; this.pumpH = null; this.lastPump = 0; this.pumpAcc = 0; this.leftSeen = new Set();
    this.roomAlive = 0; this.roomFrameAt = 0; this.lastJoinErr = null;
    // invite link <page>?join=<code>: straight into that game room once the title is up
    const j = normCode(app.params && app.params.get ? app.params.get('join') : ''); this.autoJoin = CODE_RE.test(j) ? j : null;
    // app.paused reads false while an online match runs (the pause menu opens, the shared sim never stops)
    let paused = !!app.paused;
    try {
      Object.defineProperty(app, 'paused', { configurable: true, enumerable: true, get: () => (this.active ? false : paused), set: (v) => { paused = !!v; } });
    } catch { /* keep the plain field */ }
    app.on('state', (s) => this.onState(s));
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => this.visibility());
    this.readyP = acquireRoom(app.params).then(({ room, kind, reason }) => {
      this.kind = kind; this.reason = reason || '';
      if (!room) { this.status = 'unavailable'; return false; }
      this.tr = new RoomTransport(room, kind); this.status = 'ready';
      return true;
    }).catch((e) => { this.status = 'unavailable'; this.reason = String(e && e.message || e); return false; });
  }

  // ------------------------------------------------------------------------------------------------ loop hooks
  /** [MT-HOOK] netGate / netPace: true while this page plays an online match in the current world */
  get active() { const s = this.session, a = this.app; return !!(s && a.world === s.world && (a.state === 'game' || a.state === 'end')); }
  step(w) { return this.session ? this.session.step(w) : (w.tick(), true); }
  pace(acc, dt) { return this.session ? this.session.pace(acc, dt, this.app.timeScale || 1) : acc; }

  // ------------------------------------------------------------------------------------------------ lobby-facing API
  available() { return this.status === 'ready' && !!(this.tr && this.tr.usable); }
  selfPeer() { return this.tr ? (this.room ? this.tr.selfPeer(this.room) : null) || this.tr.selfPeer() : null; }
  inRoom() { return !!this.room; }
  setDevice(d) { Object.assign(this.device, d || {}); }
  setName(v) { this.me.nm = cleanName(v); saveName(this.me.nm); }
  displayName() { return this.me.nm || t('net.defaultName'); }
  /** open games advertised in the lobby room (newest first) */
  openGames() {
    if (!this.tr || !this.tr.discovery) return [];
    const out = [];
    for (const p of this.tr.peers()) {
      if (p.isMe && p.sameTab) continue;
      const h = p.presence && p.presence.host;
      if (!h || typeof h !== 'object' || typeof h.code !== 'string' || !CODE_RE.test(h.code) || h.v !== PROTO) continue;
      out.push({ code: h.code, name: cleanName(h.name, '?'), players: h.players | 0, max: h.max | 0 || MAX_HUMANS, open: !!h.open, guest: !!p.guest, peer: p.peer });
    }
    return out.sort((a, b) => (b.open - a.open) || a.code.localeCompare(b.code));
  }
  async createGame() {
    // PeerTransport: the code is the host's id on a public signaling server — taken (rarely) = another code
    for (let i = 0; i < 4; i++) { const ok = await this.enterRoom(makeCode(), true); if (ok || this.lastJoinErr !== 'id_taken') return ok; }
    return false;
  }
  /** <page>?join=<code> for friends (not on claude.ai, where the Share menu invites and query strings do not reach the page) */
  inviteUrl() {
    if (!this.code || this.kind === 'room' || typeof location === 'undefined') return null;
    try { const u = new URL(location.href); u.searchParams.set('join', this.code); u.hash = ''; return u.href; } catch { return null; }
  }
  async joinGame(code) {
    const c = normCode(code);
    if (!CODE_RE.test(c)) { this.setError('net.badCode'); return false; }
    return this.enterRoom(c, false);
  }
  async enterRoom(code, host) {
    if (!this.available()) { this.setError('net.unavailable'); return false; }
    if (this.room) await this.leaveRoom();
    this.joining = code; this.error = null; this.lastJoinErr = null;
    try {
      const r = await this.tr.join(roomName(code), { create: host });
      if (this.joining !== code) { r.leave(); return false; }
      this.room = r; this.code = code; this.isHost = host; this.joinedAt = nowMs(); this.ord = []; this.lastGoMid = null; this.hostSeen = 0; this.go = null;
      this.roomAlive = 0; this.roomFrameAt = 0;
      this.me.rd = 0; this.roomPub = {}; this.roomPubAt = -1e9;
      if (host) this.me.tm = 0;
      return true;
    } catch (e) {
      const c = this.lastJoinErr = (e && e.code) || 'upstream_error';
      this.setError(c === 'not_permitted' || c === 'unsupported' ? 'net.unavailable' : c === 'not_found' || (c === 'timeout' && !host) ? 'net.notFound'
        : c === 'webrtc_failed' ? 'net.p2pFailed' : c === 'signal_failed' || c === 'timeout' ? 'net.peerFailed' : 'net.joinFailed');
      return false;
    } finally { this.joining = null; }
  }
  async leaveRoom() {
    const r = this.room;
    this.endSession('leave');
    this.room = null; this.code = null; this.isHost = false; this.go = null; this.ord = [];
    this.publishLobby(true);
    if (r) { try { await r.leave(); } catch { /* gone */ } }
  }
  setError(key) { this.error = key; this.errorAt = nowMs(); }
  /** members of my game room in seat order: {peer, nm, tm, sp, lk, rd, host, me, st, ok} */
  members() {
    if (!this.room || !this.tr) return [];
    const me = this.selfPeer(), list = [];
    for (const p of this.tr.peers(this.room)) {
      const pr = p.isMe && p.sameTab ? this.myLobbyFields() : p.presence || {};
      if (!(p.isMe && p.sameTab) && pr.v == null) continue;   // not (yet) a game page
      list.push({ peer: p.peer, me: p.peer === me || (p.isMe && p.sameTab), nm: cleanName(pr.nm, t('net.defaultName')), tm: pr.tm === 1 ? 1 : 0,
        sp: SPEC_IDS.includes(pr.sp) ? pr.sp : 'attack', lk: SPEC_IDS.includes(pr.lk) ? pr.lk : 'attack', rd: !!pr.rd, host: pr.host === 1, st: pr.st || 'lb', ok: pr.v === PROTO, guest: !!p.guest });
    }
    const ord = this.seatOrder(list);
    return list.sort((a, b) => ord(a) - ord(b));
  }
  seatOrder(list) {
    const host = list.find((m) => m.host && !m.me), hp = host ? this.peerPresence(host.peer) : null;
    const ord = this.isHost ? this.ord : hp && Array.isArray(hp.ord) ? hp.ord : this.ord;
    return (m) => { const i = ord.indexOf(m.peer); return m.host ? -1 : i >= 0 ? i : 1000 + (m.peer < 'm' ? 0 : 1); };
  }
  peerPresence(peer) { const p = this.tr && this.room ? this.tr.peers(this.room).find((x) => x.peer === peer) : null; return p ? p.presence || {} : null; }
  teamCount(team, members = this.members()) { return members.filter((m) => m.tm === team && !m.me).length; }
  /** change my lobby choices: {tm, sp, lk, rd} — team changes refuse a full team */
  setMine(f) {
    if (f.tm != null && f.tm !== this.me.tm && this.teamCount(f.tm) >= TEAM_SIZE) return false;
    Object.assign(this.me, f);
    return true;
  }
  canStart() {
    if (!this.isHost || this.session) return false;
    const m = this.members().filter((x) => x.ok);
    return m.length >= 1 && m.length <= MAX_HUMANS && m.every((x) => x.me || (x.rd && x.st === 'lb'));
  }
  startMatch() {
    if (!this.canStart()) return false;
    const members = balanceTeams(this.members().filter((x) => x.ok).slice(0, MAX_HUMANS));
    const seed = (Math.floor(Math.random() * 1e6) + 1) % 1000000;
    const go = { mid: makeMid(), seed, pl: members.map((m) => [m.peer, m.tm, m.sp, m.lk, m.me ? this.displayName() : m.nm]) };
    this.go = go;
    this.pushRoom(true);
    return true;
  }

  // ------------------------------------------------------------------------------------------------ presence out
  myLobbyFields() {
    const f = { v: PROTO, nm: this.displayName(), tm: this.me.tm, sp: this.me.sp, lk: this.me.lk, rd: this.me.rd ? 1 : 0, st: this.matchState() };
    if (this.isHost) { f.host = 1; f.code = this.code; f.ord = this.ord.slice(0, MAX_HUMANS + 2); if (this.go) f.go = this.go; }
    return f;
  }
  matchState() { const a = this.app.state; if (!this.session) return 'lb'; return a === 'loading' ? 'ld' : a === 'end' ? 'end' : a === 'game' ? 'gm' : 'lb'; }
  /** my presence in the lobby room: the advert while I host a game */
  publishLobby(force) {
    if (!this.tr) return;
    const now = nowMs();
    if (!force && now - this.lobbyPubAt < 500) return;
    let host = null;
    if (this.room && this.isHost) {
      const n = this.members().filter((m) => m.ok).length;
      host = { code: this.code, name: this.displayName(), players: n, max: MAX_HUMANS, open: !this.session && n < MAX_HUMANS, v: PROTO };
    }
    const j = JSON.stringify(host);
    if (j === this.lobbyPub.host) return;
    this.lobbyPub.host = j; this.lobbyPubAt = now;
    this.tr.presence(this.tr.room, { host });
  }
  /** my presence in the game room while no match runs (the SessionLink publishes during a match) */
  pushRoom(force) {
    if (!this.room || this.link) return;
    const now = nowMs();
    if (!force && now - this.roomPubAt < 100) return;
    const full = this.myLobbyFields(), patch = {};
    let changed = false;
    for (const k of Object.keys(full)) { const j = JSON.stringify(full[k]); if (j !== this.roomPub[k]) { patch[k] = full[k]; this.roomPub[k] = j; changed = true; } }
    for (const k of Object.keys(this.roomPub)) if (!(k in full)) { patch[k] = null; delete this.roomPub[k]; changed = true; }
    if (!changed) return;
    this.roomPubAt = now;
    this.tr.presence(this.room, patch);
  }

  // ------------------------------------------------------------------------------------------------ per frame
  update(f) {
    if (this.autoJoin && this.status !== 'init') this.tryAutoJoin();
    if (this.room && this.tr) {
      if (this.link) this.matchFrame(f); else this.roomFrame();
    }
    if (this.tr && this.tr.usable) this.publishLobby(false);
    this.overlay(f);
  }
  /** ?join=<code>: the title -> the lobby -> that game, exactly like tapping it in the online panel */
  tryAutoJoin() {
    const app = this.app;
    if (this.status !== 'ready') { this.autoJoin = null; return; }   // no transport: the panel explains when opened
    if (!app.ready || this.room) return;
    if (app.state === 'menu') { app.state = 'select'; app.fire('state', 'select'); }   // the lobby redirects 'select' to 'lobby'
    const L = app.mtLobby;
    if (app.state !== 'lobby' || !L || !L.slots || !L.slots[0] || typeof L.openOnline !== 'function') return;   // next frame
    const code = this.autoJoin; this.autoJoin = null;
    L.openOnline(L.slots[0]); L.onlineActivate({ id: 'g', code });
  }
  /** game-room lobby phase: seat order, host election, watching the host's `go` */
  roomFrame() {
    // time this page actually ran in the room (a page blocked for seconds must not time out before it read its inbox)
    const now = nowMs(); this.roomAlive += Math.min(250, Math.max(0, now - (this.roomFrameAt || now))); this.roomFrameAt = now;
    const members = this.members(), me = this.selfPeer();
    if (!me) return;
    const others = members.filter((m) => !m.me);
    if (this.isHost) {
      for (const m of members) if (!this.ord.includes(m.peer) && this.ord.length < MAX_HUMANS) this.ord.push(m.peer);   // seats: join order, 6 max
      this.ord = this.ord.filter((p) => members.some((m) => m.peer === p));
      // a second page claiming host (both created the same code): the smaller peer label keeps it
      const rival = others.find((m) => m.host);
      if (rival && rival.peer < me) this.isHost = false;
    } else {
      const host = others.find((m) => m.host);
      if (host) { const hp = this.peerPresence(host.peer); if (hp && Array.isArray(hp.ord)) this.ord = hp.ord.filter((x) => typeof x === 'string').slice(0, 12); this.hostSeen = nowMs(); }
      else if (this.roomAlive > JOIN_TIMEOUT_MS && !this.hostSeen) { this.setError('net.notFound'); this.leaveRoom(); return; }
      else if (this.hostSeen && !this.tr.migrates) { this.setError('net.hostLeft'); this.leaveRoom(); return; }   // WebRTC star: nobody left to talk to
      else if (this.hostSeen && nowMs() - this.hostSeen > 2500) {
        // the host left: the first remaining seat (host's last order) takes over the room
        const order = this.ord.filter((p) => members.some((m) => m.peer === p));
        const heir = order[0] || members.map((m) => m.peer).sort()[0];
        if (heir === me) { this.isHost = true; this.go = null; }
      }
      // room full: the host seats 6 (ord); a 7th page is not seated within ~2 s
      if (this.hostSeen && this.ord.length >= MAX_HUMANS && !this.ord.includes(me) && this.roomAlive > 2000) { this.setError('net.full'); this.leaveRoom(); return; }
      if (host) {
        const hp = this.peerPresence(host.peer), cfg = hp && hp.go ? parseGo(hp.go) : null;
        if (cfg && cfg.mid !== this.lastGoMid && (hp.st === 'lb' || hp.st === 'ld' || hp.st === 'gm')) {
          this.lastGoMid = cfg.mid;
          if (cfg.pl.some((p) => p.peer === me)) this.beginMatch(cfg);
          else if (hp.st !== 'lb') this.setError('net.inProgress');
        }
      }
    }
    if (this.isHost && this.go && this.go.mid !== this.lastGoMid) { const cfg = parseGo(this.go); this.lastGoMid = this.go.mid; if (cfg) this.beginMatch(cfg); }
    this.pushRoom(false);
  }
  matchFrame(f) {
    const s = this.session;
    if (f.state === 'game' && s.world === this.app.world && !s.live) s.live = true;
    this.link.frame();
    // peers that left: one toast each
    for (const [slot, g] of s.gone) {
      if (this.leftSeen.has(slot)) continue;
      this.leftSeen.add(slot);
      const nm = s.seats[slot] ? s.seats[slot].name : 'P' + (slot + 1);
      this.toast(t('net.left', { name: nm }));
      void g;
    }
    if (this.isHost) this.publishLobby(false);
  }

  // ------------------------------------------------------------------------------------------------ match lifecycle
  beginMatch(cfg) {
    const app = this.app, me = this.selfPeer();
    const mySlot = cfg.pl.findIndex((p) => p.peer === me);
    if (mySlot < 0) return false;
    this.endSession('restart');
    this.cfg = cfg;
    const players = netRoster(cfg);
    app.mtNetLocal = { slot: mySlot, ...this.device };
    detOn();
    try { app.newMatch({ seed: cfg.seed, players }); } finally { detOff(); }
    const w = app.world;
    const seats = cfg.pl.map((p, k) => ({ peer: p.peer, name: p.name, unitId: (w.players.find((q) => q.netSlot === k) || {}).unitId }));
    const s = this.session = new NetSession({
      world: w, mid: cfg.mid, seats, mySlot, scriptLocal: !!(app.params && app.params.has && app.params.has('netbot')),
      log: (m) => console.info('[net] ' + m),
      onTick: (wd, T) => { if (T % 900 === 0) { const qa = wd.mt && wd.mt.debug && wd.mt.debug.qa; if (qa) { this.checks.push([T, qa.stateHash()]); if (this.checks.length > 400) this.checks.shift(); } } },
    });
    s.onLocal = (cmd) => this.localFeedback(cmd);
    if (w.mt) w.mt.net = s;
    this.checks = [];
    this.leftSeen = new Set(); this.modal = null; this.closeModal();
    this.link = new SessionLink(s, this.room, { extra: () => this.myLobbyFields() });
    this.roomPub = {};
    // the host keeps `go` in its presence for the whole match (latest-wins: a slow peer must still see it); every
    // peer remembers the mid it started (lastGoMid), and the host clears it when the room returns to the lobby
    app.state = 'loading'; app.fire('state', 'loading');
    this.publishLobby(true);
    return true;
  }
  /** back to the room lobby / out: keep the report, unhook the world */
  endSession(why) {
    const s = this.session;
    if (!s) return;
    this.lastReport = { ...s.report(), why, checks: this.checks.slice() };
    s.ended = true;
    // the match fields of my game-room presence (m, u, c, a, ...) are removed by the next pushRoom()
    const stale = this.link ? Object.keys(this.link.lastSent) : [];
    if (s.world && s.world.mt && s.world.mt.net === s) s.world.mt.net = null;
    this.session = null; this.link = null; this.app.mtNetLocal = null;
    this.app.paused = false;   // a pause menu left open during the online match must not pause what comes next
    this.roomPub = Object.fromEntries(stale.map((k) => [k, '\u0000']));
    this.closeModal();
    this.stopPump();
  }
  onState(st) {
    const prev = this.prevState; this.prevState = st;
    if (st === 'game' && this.session && this.session.world === this.app.world) this.session.live = true;
    if ((st === 'lobby' || st === 'select') && this.session) { this.endSession('lobby'); this.me.rd = 0; if (this.isHost) this.go = null; this.pushRoom(true); }
    if (st === 'menu' && prev !== 'menu' && (this.room || this.session)) this.leaveRoom();   // the player went back to the title
  }
  /** tiny immediate feedback for the local player's own (delayed) actions */
  localFeedback(cmd) {
    const ty = cmd.type;
    if (ty === 'dir' || ty === 'move' || ty === 'attackMove' || ty === 'stop' || ty === 'ping') return;
    const now = nowMs(); if (now - (this.fbAt || 0) < 90) return; this.fbAt = now;
    const a = this.app.registry && this.app.registry.get('audio');
    try { if (a && a.ready && a.click) a.click(); } catch { /* audio not ready */ }
  }

  // ------------------------------------------------------------------------------------------------ hidden tab
  visibility() {
    if (typeof document === 'undefined') return;
    if (document.hidden && this.session) this.startPump(); else this.stopPump();
  }
  startPump() {
    if (this.pumpH) return;
    this.lastPump = nowMs(); this.pumpAcc = 0;
    this.pumpH = setInterval(() => this.pump(), 250);
  }
  stopPump() { if (this.pumpH) { clearInterval(this.pumpH); this.pumpH = null; } }
  /** rAF does not run in a hidden tab: keep the lockstep moving (and our presence fresh) from a timer */
  pump() {
    if (typeof document !== 'undefined' && !document.hidden) { this.stopPump(); return; }
    const app = this.app, s = this.session, w = app.world;
    if (!s || !this.link) { this.stopPump(); return; }
    const now = nowMs(), dt = Math.min(2, (now - this.lastPump) / 1000); this.lastPump = now;
    if (this.active) {
      this.pumpAcc += dt * (app.timeScale || 1);
      this.pumpAcc = s.pace(this.pumpAcc, dt, app.timeScale || 1) + 0;
      for (let n = 0; this.pumpAcc >= 1 / 30 && n < 90; n++) { if (!s.step(w)) break; this.pumpAcc -= 1 / 30; }
      if (w.winner !== null && app.state === 'game') { app.state = 'end'; app.fire('state', 'end'); }
    }
    this.link.frame();
  }

  // ------------------------------------------------------------------------------------------------ overlays
  ensureUi() {
    if (this.ui || typeof document === 'undefined') return this.ui;
    if (!document.getElementById('mt-net-css')) { const st = document.createElement('style'); st.id = 'mt-net-css'; st.textContent = CSS; document.head.appendChild(st); }
    const root = document.createElement('div'); root.id = 'mt-net';
    root.innerHTML = '<div class="nb"><i></i><span></span></div><div class="nw"><b></b><span></span></div><div class="nt"></div><div class="nm"><div class="pn"><h3></h3><p></p><small></small><div class="bt"></div></div></div>';
    document.body.appendChild(root);
    this.ui = { root, badge: root.querySelector('.nb'), badgeT: root.querySelector('.nb span'), wait: root.querySelector('.nw'), waitT: root.querySelector('.nw span'), toasts: root.querySelector('.nt'), modal: root.querySelector('.nm') };
    this.onKey = (e) => this.modalKey(e);
    window.addEventListener('keydown', this.onKey, true);
    return this.ui;
  }
  toast(text) { this.toasts.push({ text, until: nowMs() + 4500 }); }
  overlay(f) {
    const s = this.session, U = this.ensureUi(); if (!U) return;
    const inGame = !!s && (f.state === 'game' || f.state === 'end') && s.world === f.world;
    // badge: ONLINE code · delay
    const show = inGame && f.state === 'game';
    if (show) {
      const r = s.rtt.filter((x, i) => i !== s.me && x > 0), worst = r.length ? Math.max(...r) : 0;
      const txt = t('net.badge', { code: this.code || '', ms: Math.round(s.D * TICK_MS) });
      if (U.badgeT.textContent !== txt) U.badgeT.textContent = txt;
      U.badge.classList.toggle('lag', worst > 250); U.badge.classList.toggle('bad', worst > 450);
      // just under the HUD's top bar (hud.js publishes the band it covers as a screen fraction)
      const ins = this.app.mtHudInsets, top = Math.round(((ins && ins.top) || 0.09) * innerHeight + 4) + 'px';
      if (U.badge.style.getPropertyValue('--nbt') !== top) U.badge.style.setProperty('--nbt', top);
    }
    U.badge.style.display = show ? 'flex' : 'none';
    // waiting for someone (> 0.5 s)
    const wt = inGame && f.state === 'game' && s.live && !s.desync && !s.dead ? s.waiting() : null;
    const waitOn = !!(wt && nowMs() - wt.since > 500 && wt.slots.length);
    if (waitOn) {
      const names = wt.slots.map((k) => (s.seats[k] && s.seats[k].name) || 'P' + (k + 1)).join(', ');
      const loading = wt.slots.every((k) => !s.seen[k] || s.peerSt[k] === 'ld' || s.peerSt[k] === 'lb');
      const txt = loading ? t('net.loadingWho', { who: names }) : t('net.waiting', { who: names });
      if (U.waitT.textContent !== txt) U.waitT.textContent = txt;
    }
    U.wait.style.display = waitOn ? 'block' : 'none';
    // toasts
    const now = nowMs(); this.toasts = this.toasts.filter((x) => x.until > now);
    const tk = this.toasts.map((x) => x.text).join('\n');
    if (U.toasts.dataset.k !== tk) { U.toasts.dataset.k = tk; U.toasts.innerHTML = ''; for (const x of this.toasts) { const d = document.createElement('div'); d.textContent = x.text; U.toasts.appendChild(d); } }
    // modal: desync / replaced
    if (s && inGame && !this.modal) {
      if (s.desync && now - s.desync.at > 300) this.openModal('desync');
      else if (s.dead) this.openModal('dead');
    }
    if (this.modal) this.modalPad();
  }
  openModal(kind) {
    const U = this.ensureUi(), s = this.session; if (!U) return;
    this.modal = kind;
    const h = U.modal.querySelector('h3'), p = U.modal.querySelector('p'), sm = U.modal.querySelector('small'), bt = U.modal.querySelector('.bt');
    if (kind === 'desync') {
      h.textContent = t('net.desync.title');
      p.textContent = t('net.desync.body');
      const d = s && s.desync;
      sm.textContent = d ? t('net.desync.detail', { tick: d.first != null ? d.first : d.tick, sec: ((d.first != null ? d.first : d.tick) / 30).toFixed(1) }) : '';
      console.warn('[net] desync', JSON.stringify(d));
    } else {
      h.textContent = t('net.dead.title'); p.textContent = t('net.dead.body'); sm.textContent = '';
    }
    bt.innerHTML = '';
    const mk = (label, fn, f) => { const b = document.createElement('div'); b.className = 'b' + (f ? ' f' : ''); b.textContent = label; b.addEventListener('click', fn); bt.appendChild(b); return b; };
    this.mBtns = [mk(t('net.rematch'), () => this.rematch(), true), mk(t('net.menu'), () => this.toMenu())];
    this.mFocus = 0; this.prevPad = this.padSig();
    U.modal.style.display = 'flex';
  }
  closeModal() { this.modal = null; if (this.ui) this.ui.modal.style.display = 'none'; }
  rematch() { this.closeModal(); this.app.state = 'select'; this.app.fire('state', 'select'); }
  toMenu() { this.closeModal(); this.app.state = 'menu'; this.app.fire('state', 'menu'); }
  modalKey(e) {
    if (!this.modal) return;
    const c = e.code;
    if (c === 'ArrowLeft' || c === 'ArrowRight' || c === 'Tab') { this.mFocus = (this.mFocus + 1) % 2; this.syncFocus(); }
    else if (c === 'Enter' || c === 'Space' || c === 'NumpadEnter') this.mBtns[this.mFocus].click();
    else if (c === 'Escape') this.toMenu();
    else return;
    e.preventDefault(); e.stopImmediatePropagation();
  }
  syncFocus() { (this.mBtns || []).forEach((b, i) => b.classList.toggle('f', i === this.mFocus)); }
  padSig() {
    let sig = 0;
    try { for (const gp of navigator.getGamepads ? navigator.getGamepads() : []) { if (!gp || !gp.connected) continue; const b = (i) => gp.buttons[i] && gp.buttons[i].pressed; if (b(0)) sig |= 1; if (b(1)) sig |= 2; if (b(14) || b(15) || Math.abs(gp.axes[0]) > 0.6) sig |= 4; } } catch { /* no pads */ }
    return sig;
  }
  modalPad() {
    const sig = this.padSig(), rel = this.prevPad & ~sig, edge = sig & ~this.prevPad; this.prevPad = sig;
    if (edge & 4) { this.mFocus = (this.mFocus + 1) % 2; this.syncFocus(); }
    if (rel & 1) this.mBtns[this.mFocus].click(); else if (rel & 2) this.toMenu();
  }

  // ------------------------------------------------------------------------------------------------ tests / debug
  testInfo() {
    const s = this.session;
    return { status: this.status, kind: this.kind, code: this.code, host: this.isHost, peer: this.selfPeer(), members: this.members().map((m) => ({ peer: m.peer, nm: m.nm, tm: m.tm, rd: m.rd, host: m.host, st: m.st })),
      session: s ? s.report() : null, last: this.lastReport, checks: this.checks.slice(), errors: this.tr ? this.tr.errors.slice(-5) : [], error: this.error, link: this.link ? { pubs: this.link.pubCount, fails: this.link.pubFails, err: this.link.lastError || null } : null };
  }
  dispose() { this.stopPump(); if (this.onKey) window.removeEventListener('keydown', this.onKey, true); if (this.ui) this.ui.root.remove(); }
}
