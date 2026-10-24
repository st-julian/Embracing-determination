import { o as e } from "./height-CVtQdZ3e.js";
function t(t, n, r, i = { x: 0, y: 0, z: 0 }) {
  let a = t.prevX + (t.x - t.prevX) * n,
    o = t.prevY + (t.y - t.prevY) * n,
    s = e(a, o),
    c = t.height || 2,
    l =
      r === `ground`
        ? 0
        : r === `overhead`
          ? c + 0.35
          : r === `head`
            ? c * 0.9
            : r === `muzzle`
              ? c * 0.85
              : c * 0.6,
    u = r === `weapon` || r === `muzzle` ? t.radius * 0.9 : 0;
  return (
    (i.x = a + Math.cos(t.facing) * u),
    (i.y = s + l),
    (i.z = o + Math.sin(t.facing) * u),
    i
  );
}
function n(e, n, r, i, a) {
  for (let t of [`champions`, `creeps`, `structures`]) {
    let o = e.get(t);
    if (o && o.getAnchor && o.getAnchor(n, r, i, a)) return a;
  }
  return t(n, r, i, a);
}
export { t as n, n as t };
