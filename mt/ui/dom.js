// mt/ui/dom.js — tiny DOM helpers for the mt HUD (hyperscript + diff-gated setters). Owner: HUD.
import { voxelBlit, voxelRestore } from '../voxel/units/portraits.js';   // [voxel]

/** h('div.a.b', {attrs}, ...children) — children: Node | string | null */
export function h(sel, attrs, ...kids) {
  const [tag, ...cls] = sel.split('.');
  const e = document.createElement(tag || 'div');
  if (cls.length) e.className = cls.join(' ');
  if (attrs) for (const k in attrs) {
    const v = attrs[k];
    if (v == null || v === false) continue;
    if (k === 'text') e.textContent = v; else if (k === 'html') e.innerHTML = v;
    else if (k === 'style') e.style.cssText = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids) if (c != null) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  return e;
}
export const setText = (e, t) => { t = String(t); if (e.textContent !== t) e.textContent = t; };
export const setHTML = (e, t) => { if (e._html !== t) { e._html = t; e.innerHTML = t; } };
export const setCls = (e, c, on) => { on = !!on; if (e.classList.contains(c) !== on) e.classList.toggle(c, on); };
export const setVar = (e, k, v) => { v = String(v); if (e.style.getPropertyValue(k) !== v) e.style.setProperty(k, v); };
export const setStyle = (e, k, v) => { if (e.style[k] !== v) e.style[k] = v; };
export const show = (e, on) => { on = !!on; if (e.hidden === on) e.hidden = !on; };
/** scaleX transform setter quantised to 1/1000 */
export const setScaleX = (e, f) => {
  const q = Math.round(Math.max(0, Math.min(1, f)) * 1000);
  if (e._sx !== q) { e._sx = q; e.style.transform = 'scaleX(' + (q / 1000) + ')'; }
};
/** Pixel canvas element (native size w×h, displayed by CSS). */
export function pxCanvas(w, h2, cls = '') {
  const c = document.createElement('canvas'); c.width = w; c.height = h2; c.className = ('px ' + cls).trim();
  return c;
}
/** Draw a source canvas into a pixel canvas, centred, no smoothing. */
export function blit(dst, src, dx = 0, dy = 0) {
  if (src && src.mtVoxelImg) return voxelBlit(dst, src.mtVoxelImg); else if (dst.dataset && dst.dataset.mtBw) voxelRestore(dst);   // [voxel] voxel portraits at device resolution
  const g = dst.getContext('2d'); g.imageSmoothingEnabled = false; g.clearRect(0, 0, dst.width, dst.height);
  if (src) g.drawImage(src, Math.round((dst.width - src.width) / 2) + dx, Math.round((dst.height - src.height) / 2) + dy);
}
export const fmtTime = (t) => { t = Math.max(0, Math.floor(t)); const m = Math.floor(t / 60), s = t % 60; return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s; };
/** '#rrggbb' mixed toward white (t>0) or black (t<0) */
export function tint(hex, t) {
  const n = parseInt(hex.slice(1), 16); const c = [n >> 16 & 255, n >> 8 & 255, n & 255];
  const o = c.map((v) => Math.round(t >= 0 ? v + (255 - v) * t : v * (1 + t)));
  return '#' + o.map((v) => v.toString(16).padStart(2, '0')).join('');
}
