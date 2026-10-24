// mt/ui/input/reticle.js — per-local ground markers drawn in the 3D scene. Owner: input specialist.
//
//   aim reticle   right-stick aim point (pad locals): ring + ticks in the local's colour, dashed line from the trainer,
//                 hold-to-confirm progress arc (capture replace / unlock)
//   lock marker   rotating brackets under the locked target (pad R2 / flick, keyboard Tab / middle click)
//   player ring   colour ring under every local trainer when 2+ locals share the screen, plus a DOM "P1".."P4" tag
// Reads app.locals + app.mtAim (gamepad.js / keyboard.js). Pure presentation: never touches the sim.

import { o as heightAt } from '../../../assets/height-CVtQdZ3e.js';

const VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const FS = `
precision highp float;
varying vec2 vUv;
uniform vec3 uColor; uniform float uTime; uniform float uKind; uniform float uProg; uniform float uAlpha;
const float PI = 3.14159265;
float band(float r, float a, float b, float aa){ return smoothstep(a - aa, a, r) * (1.0 - smoothstep(b, b + aa, r)); }
// Every mark = a DARK OUTLINE (navy) around a BRIGHT CORE (player colour lifted toward white, HDR-bright), so it reads
// on grass, water, dirt and stone alike.
void main(){
  vec2 p = vUv - 0.5; float r = length(p) * 2.0; float ang = atan(p.y, p.x);
  float aa = fwidth(r) * 1.2; float ol = 0.0; float core = 0.0; float hot = 0.0; float gold = 0.0;
  if (uKind < 0.5) {                       // aim reticle
    float rot = ang + uTime * 1.6;
    float gap = abs(fract(rot / (PI * 0.5)) - 0.5);           // 0 at the gap centres
    float seg = smoothstep(0.12, 0.16, gap), segO = smoothstep(0.09, 0.13, gap);
    ol = band(r, 0.68, 1.0, aa) * segO;
    core = band(r, 0.75, 0.93, aa) * seg;
    hot = band(r, 0.82, 0.86, aa) * seg;
    float ta = abs(fract((ang + PI * 0.25) / (PI * 0.5)) - 0.5); // inward ticks at 45°
    ol = max(ol, band(r, 0.32, 0.68, aa) * step(ta, 0.075));
    core = max(core, band(r, 0.36, 0.64, aa) * step(ta, 0.04));
    ol = max(ol, band(r, 0.0, 0.2, aa)); core = max(core, band(r, 0.0, 0.12, aa));   // centre dot
    if (uProg > 0.0) {
      float t = fract((-ang + PI * 0.5) / (2.0 * PI));
      float arc = band(r, 0.72, 0.97, aa) * step(t, uProg);
      gold = arc; ol = max(ol, band(r, 0.68, 1.0, aa) * step(t, uProg));
    }
  } else if (uKind < 1.5) {                // lock brackets (3 rotating arcs)
    float rot = ang - uTime * 2.2;
    float f = fract(rot / (2.0 * PI / 3.0));
    ol = band(r, 0.74, 1.0, aa) * smoothstep(0.36, 0.40, f);
    core = band(r, 0.80, 0.94, aa) * smoothstep(0.40, 0.44, f) * (1.0 - smoothstep(0.96, 0.99, f));
    hot = band(r, 0.85, 0.89, aa) * smoothstep(0.42, 0.46, f) * (1.0 - smoothstep(0.94, 0.97, f));
  } else if (uKind < 2.5) {                // player ring
    ol = band(r, 0.72, 1.0, aa);
    core = band(r, 0.78, 0.94, aa);
    ol = max(ol, band(r, 0.0, 0.72, aa) * 0.16 * (0.6 + 0.4 * r));
  } else {                                 // dashed aim line (uv.x along)
    float ph = fract(vUv.x * 7.0 - uTime * 2.5);
    float y = abs(vUv.y - 0.5);
    float fade = smoothstep(0.0, 0.12, vUv.x);
    ol = smoothstep(0.42, 0.46, ph) * (1.0 - smoothstep(0.96, 1.0, ph)) * (1.0 - smoothstep(0.42, 0.5, y)) * fade;
    core = smoothstep(0.48, 0.52, ph) * (1.0 - smoothstep(0.92, 0.95, ph)) * (1.0 - smoothstep(0.2, 0.28, y)) * fade;
  }
  vec3 ink = vec3(0.05, 0.06, 0.16);
  vec3 bright = mix(uColor, vec3(1.0), 0.12) * 2.4;
  vec3 c = mix(ink, bright, clamp(core, 0.0, 1.0));
  c = mix(c, vec3(1.9), clamp(hot, 0.0, 1.0) * 0.8);
  c = mix(c, vec3(2.0, 1.6, 0.5), clamp(gold, 0.0, 1.0));
  float alpha = clamp(max(max(ol * 0.92, core), gold), 0.0, 1.0) * uAlpha;
  if (alpha < 0.01) discard;
  gl_FragColor = vec4(c, alpha);
}`;

/** Height for a flat disc of radius r: the highest ground under its centre / rim, so slopes never swallow it. */
function discY(x, y, r) {
  let h = heightAt(x, y);
  for (const [dx, dy] of [[r, 0], [-r, 0], [0, r], [0, -r]]) h = Math.max(h, heightAt(x + dx, y + dy));
  return h;
}

export class Reticles {
  constructor(ctx) {
    this.ctx = ctx; this.app = ctx.app; this.T = ctx.THREE;
    this.group = new this.T.Group(); this.group.name = 'mt-reticles'; this.group.renderOrder = 5;
    ctx.scene.add(this.group);
    this.per = new Map(); // slot -> {aim, line, lock, ring, tag}
    this.time = 0;
    this.tagRoot = null;
  }

  mesh(kind, color) {
    const T = this.T;
    // aim reticle, aim line and lock brackets draw over buildings / props (never hidden behind a tower base); the player
    // ring stays depth-tested so it sits under the trainer's feet
    const mat = new T.ShaderMaterial({
      vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false, depthTest: kind === 2, toneMapped: false,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4,
      uniforms: { uColor: { value: new T.Color(color).convertSRGBToLinear() }, uTime: { value: 0 }, uKind: { value: kind }, uProg: { value: 0 }, uAlpha: { value: 1 } },
    });
    const m = new T.Mesh(new T.PlaneGeometry(1, 1), mat);
    m.rotation.x = -Math.PI / 2; m.frustumCulled = false; m.visible = false; m.renderOrder = 5;
    this.group.add(m);
    return m;
  }

  get(l) {
    let p = this.per.get(l.slot);
    if (!p || p.color !== l.color) {
      if (p) for (const k of ['aim', 'line', 'lock', 'ring']) { this.group.remove(p[k]); p[k].geometry.dispose(); p[k].material.dispose(); }
      p = { color: l.color, aim: this.mesh(0, l.color), lock: this.mesh(1, l.color), ring: this.mesh(2, l.color), line: this.mesh(3, l.color), tag: p ? p.tag : null };
      this.per.set(l.slot, p);
    }
    return p;
  }

  tag(p, l) {
    if (typeof document === 'undefined') return null;
    if (!this.tagRoot) {
      this.tagRoot = document.createElement('div'); this.tagRoot.id = 'mt-ptags';
      this.tagRoot.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2;overflow:hidden';
      document.body.appendChild(this.tagRoot);
    }
    if (!p.tag) {
      p.tag = document.createElement('div');
      p.tag.style.cssText = 'position:absolute;left:0;top:0;transform:translate(-50%,0);font:900 12px/1 system-ui,"Segoe UI",sans-serif;padding:3px 6px 4px;border-radius:7px;border:2px solid #1d2440;color:#1d2440;letter-spacing:.5px;box-shadow:0 2px 0 #1d244088;will-change:transform';
      this.tagRoot.appendChild(p.tag);
    }
    if (p.tag.textContent !== l.label) p.tag.textContent = l.label;
    if (p.tag.style.background !== l.color) p.tag.style.background = l.color;
    return p.tag;
  }

  update(f) {
    const w = f.world, app = this.app;
    this.time += f.dt || 0;
    const L = (f.state === 'game' && w && app.locals) || [];
    const shared = L.length > 1;
    const seen = new Set();
    const rig = this.ctx.pipeline && this.ctx.pipeline.cameraRig;
    for (const l of L) {
      seen.add(l.slot);
      const p = this.get(l), me = w.units.get(l.unitId), aim = app.mtAim && app.mtAim[l.slot];
      for (const k of ['aim', 'line', 'lock', 'ring']) p[k].material.uniforms.uTime.value = this.time;
      const alive = !!(me && me.alive);
      const mx = alive ? me.prevX + (me.x - me.prevX) * f.alpha : 0, my = alive ? me.prevY + (me.y - me.prevY) * f.alpha : 0;
      // player ring + tag
      p.ring.visible = alive && shared;
      if (p.ring.visible) { const s = 1.5; p.ring.scale.set(s, s, 1); p.ring.position.set(mx, discY(mx, my, 0.75) + 0.07, my); }
      const tag = shared ? this.tag(p, l) : p.tag;
      if (tag) {
        let show = false;
        if (shared && alive && rig && rig.worldToScreen) {
          const o = rig.worldToScreen(mx, heightAt(mx, my), my + 0.45, {});
          if (o && o.visible !== false && Number.isFinite(o.x)) { show = true; tag.style.transform = `translate(${o.x.toFixed(1)}px,${o.y.toFixed(1)}px) translate(-50%,2px)`; }
        }
        const disp = show ? '' : 'none'; if (tag.style.display !== disp) tag.style.display = disp;
      }
      // aim reticle + line
      const aimOn = !!(alive && aim && aim.active && (l.lastInputGamepad || aim.touch));
      p.aim.visible = aimOn; p.line.visible = aimOn;
      if (aimOn) {
        p.aim.position.set(aim.x, discY(aim.x, aim.y, 0.95) + 0.1, aim.y); p.aim.scale.set(1.9, 1.9, 1);
        p.aim.material.uniforms.uProg.value = aim.hold ? Math.min(1, aim.hold.t / aim.hold.need) : 0;
        const dx = aim.x - mx, dy = aim.y - my, d = Math.hypot(dx, dy);
        p.line.visible = d > 1.2;
        if (p.line.visible) {
          const cx = mx + dx * 0.5, cy = my + dy * 0.5;
          p.line.position.set(cx, Math.max(heightAt(mx, my), heightAt(cx, cy), heightAt(aim.x, aim.y)) + 0.12, cy);
          p.line.scale.set(Math.max(0.1, d - 1.1), 0.34, 1);
          p.line.rotation.set(-Math.PI / 2, 0, -Math.atan2(dy, dx));
        }
      } else if (alive && aim && aim.hold) {
        // hold-to-confirm without aiming: show the progress ring at the trainer's feet
        p.aim.visible = true; p.aim.position.set(mx, discY(mx, my, 0.95) + 0.1, my); p.aim.scale.set(1.9, 1.9, 1);
        p.aim.material.uniforms.uProg.value = Math.min(1, aim.hold.t / aim.hold.need);
      }
      // lock marker
      const lk = aim && aim.lockId >= 0 ? w.units.get(aim.lockId) : null;
      p.lock.visible = !!(alive && lk && lk.alive);
      if (p.lock.visible) {
        const lx = lk.prevX + (lk.x - lk.prevX) * f.alpha, ly = lk.prevY + (lk.y - lk.prevY) * f.alpha, s = Math.max(1.3, (lk.radius || 0.6) * 2.4 + 0.5);
        p.lock.position.set(lx, discY(lx, ly, s * 0.5) + 0.08, ly); p.lock.scale.set(s, s, 1);
      }
    }
    for (const [slot, p] of this.per) if (!seen.has(slot)) { for (const k of ['aim', 'line', 'lock', 'ring']) p[k].visible = false; if (p.tag) p.tag.style.display = 'none'; }
  }

  dispose() { this.ctx.scene.remove(this.group); if (this.tagRoot) this.tagRoot.remove(); }
}
