const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "./types-DoNhvZyi.js",
      "./index-DHK-Ptzs.js",
      "./map-oE9sOnNc.js",
      "./events-WjIX4JqM.js",
      "./index-Du0P9iw_.css",
      "./geo-VdiuQ1XD.js",
      "./BufferGeometryUtils-ZZwUU_DG.js",
      "./rig-rgJEAbls.js",
      "./view-DHHUoofK.js",
      "./height-CVtQdZ3e.js",
      "./material-BPS_1X92.js",
      "./rim-zRZuAScU.js",
    ]),
) => i.map((i) => d[i]);
import {
  D as e,
  O as t,
  T as n,
  _ as r,
  a as i,
  i as a,
  l as o,
  n as s,
  o as c,
  r as l,
  t as u,
  u as d,
  x as f,
} from "./map-oE9sOnNc.js";
import { t as p } from "./events-WjIX4JqM.js";
import {
  At as m,
  O as h,
  R as g,
  Y as _,
  Yt as v,
  a as y,
  b,
  c as x,
  i as S,
  jt as C,
  l as w,
  m as T,
  n as E,
  o as D,
  p as O,
  r as k,
  s as A,
  t as ee,
  v as te,
  yt as j,
} from "./index-DHK-Ptzs.js";
import { t as ne } from "./palette-L_rDAXd8.js";
import * as __mtLT from "../mt/render/loadtime.js"; // [MT-HOOK] loadtime import (mt/render/loadtime.js: art encode worker, warm-up / prebake / loading pace)
const __mtLoadUI = () => !__mtLT.LEGACY && !/[?&]legacyloading=1(&|$)/.test((globalThis.location && location.search) || ""); // [MT-HOOK] mtLoading: mt/ui/loading.js shows the loading screen; the legacy one runs hidden and bakes no art (?legacyloading=1 restores it)
var M = (e, t, n) => (e < t ? t : e > n ? n : e);
function N(e, t, ...n) {
  let r = e.split(`.`),
    i = document.createElement(r[0] || `div`);
  if ((r.length > 1 && (i.className = r.slice(1).join(` `)), t))
    for (let e in t) {
      let n = t[e];
      if (n != null && n !== !1) {
        if (e === `text`) i.textContent = n;
        else if (e === `html`) i.innerHTML = n;
        else if (e === `style`) {
          if (typeof n == `string`) i.style.cssText = n;
          else for (let e in n) i.style.setProperty(e, n[e]);
        } else
          e.startsWith(`on`) && typeof n == `function`
            ? i.addEventListener(e.slice(2), n)
            : i.setAttribute(e, n === !0 ? `` : n);
      }
    }
  for (let e of n)
    e != null &&
      e !== !1 &&
      i.append(e.nodeType ? e : document.createTextNode(String(e)));
  return i;
}
var P = (e) =>
  String(e).replace(
    /[&<>"']/g,
    (e) =>
      ({ "&": `&amp;`, "<": `&lt;`, ">": `&gt;`, '"': `&quot;`, "'": `&#39;` })[
        e
      ],
  );
function F(e) {
  let t;
  return (n) => {
    n !== t && ((t = n), (e.textContent = n));
  };
}
function re(e, t) {
  let n;
  return (r) => {
    r !== n && ((n = r), e.style.setProperty(t, r));
  };
}
function I(e, t) {
  let n;
  return (r) => {
    ((r = !!r), r !== n && ((n = r), e.classList.toggle(t, r)));
  };
}
function ie(e, t) {
  let n;
  return (r) => {
    r !== n &&
      ((n = r), r == null ? e.removeAttribute(t) : e.setAttribute(t, r));
  };
}
function ae(e) {
  e = Math.max(0, Math.floor(e));
  let t = Math.floor(e / 60),
    n = e % 60;
  return `${t < 10 ? `0` : ``}${t}:${n < 10 ? `0` : ``}${n}`;
}
function L(e) {
  return Math.round(e).toLocaleString(`en-US`);
}
function oe(e, t = 2) {
  return e
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, t)
    .map((e) => e[0].toUpperCase())
    .join(``);
}
function se(e) {
  return e ? e.name || (e.def ? e.def.name : ``) : ``;
}
function ce(e, t) {
  let n = Math.min(e / 1920, t / 1080);
  return (n < 0.5 && (n = Math.min(0.5, t / 700, e / 1200)), n);
}
var le = () => {
  try {
    return matchMedia(`(prefers-reduced-motion: reduce)`).matches;
  } catch {
    return !1;
  }
};
function R(e) {
  let t = parseInt(e.replace(`#`, ``), 16);
  return [(t >> 16) & 255, (t >> 8) & 255, t & 255];
}
function z(e, t, n) {
  return [
    e[0] + (t[0] - e[0]) * n,
    e[1] + (t[1] - e[1]) * n,
    e[2] + (t[2] - e[2]) * n,
  ];
}
function B(e, t = 1) {
  return `rgba(${e[0] | 0},${e[1] | 0},${e[2] | 0},${t})`;
}
function V(e) {
  let t;
  return (n) => {
    n !== t && ((t = n), (e.textContent = n));
  };
}
var ue = {
    baron: `Baron Lane`,
    jungle: `Jungle`,
    mid: `Mid Lane`,
    duo: `Duo Lane`,
    support: `Support`,
  },
  de = {
    baron: `Fighter`,
    jungle: `Assassin`,
    mid: `Mage`,
    duo: `Marksman`,
    support: `Tank`,
  },
  fe = (e) => e.class || de[e.role] || `Champion`,
  pe = { ...ne.element, steel: `#9fb3c8`, gold: `#f2c14e` },
  me = {
    flash: {
      element: `light`,
      desc: `Instantly blink a short distance toward the target location.`,
    },
    heal: {
      element: `nature`,
      desc: `Restore health to yourself and the most wounded nearby ally, and gain a brief burst of Movement Speed.`,
    },
    smite: {
      element: `fire`,
      desc: `Deal heavy true damage to a target monster or minion.`,
    },
    ignite: {
      element: `fire`,
      desc: `Set an enemy champion ablaze, dealing true damage over 3 seconds.`,
    },
  },
  he = (e) => (w[e] ? w[e].name : e),
  ge = {
    physical: `Physical`,
    magic: `Magic`,
    defense: `Defense`,
    boots: `Boots`,
    support: `Support`,
  },
  _e = {
    physical: `fire`,
    magic: `arcane`,
    defense: `frost`,
    boots: `nature`,
    support: `water`,
  },
  ve = {
    ad: (e) => [`+${e}`, `Attack Damage`],
    ap: (e) => [`+${e}`, `Ability Power`],
    armor: (e) => [`+${e}`, `Armor`],
    mr: (e) => [`+${e}`, `Magic Resist`],
    hp: (e) => [`+${e}`, `Health`],
    mana: (e) => [`+${e}`, `Mana`],
    attackSpeed: (e) => [`+${Math.round(e * 100)}%`, `Attack Speed`],
    crit: (e) => [`+${Math.round(e * 100)}%`, `Critical Rate`],
    lifesteal: (e) => [`+${Math.round(e * 100)}%`, `Physical Vamp`],
    haste: (e) => [`+${e}`, `Ability Haste`],
    moveSpeed: (e) => [`+${Math.round(e * 100)}`, `Move Speed`],
    msPct: (e) => [`+${Math.round(e * 100)}%`, `Move Speed`],
    hpRegen: (e) => [`+${e}`, `Health Regen`],
    manaRegen: (e) => [`+${e}`, `Mana Regen`],
    lethality: (e) => [`+${e}`, `Lethality`],
    magicPen: (e) => [`+${e}`, `Magic Penetration`],
    critDamage: (e) => [`+${Math.round(e * 100)}%`, `Critical Damage`],
    omnivamp: (e) => [`+${Math.round(e * 100)}%`, `Omnivamp`],
    armorPenPct: (e) => [`${Math.round(e * 100)}%`, `Armor Penetration`],
    magicPenPct: (e) => [`${Math.round(e * 100)}%`, `Magic Penetration`],
    tenacity: (e) => [`+${Math.round(e * 100)}%`, `Tenacity`],
  },
  ye = { crit_bonus: `Critical strikes deal additional damage.` };
function be(e) {
  let t = S[e];
  if (!t) return [];
  let n = [];
  for (let e in t.stats) {
    let r = ve[e];
    r && n.push(r(t.stats[e]));
  }
  return n;
}
var xe = (e) => {
  let t = S[e];
  return t ? (t.desc ? t.desc : (t.passive && ye[t.passive]) || ``) : ``;
};
function Se(e, t) {
  let n = Object.keys(S);
  if (e === `recommended`) {
    let e = k[t] || [];
    return [...new Set(e)];
  }
  let r = (t) =>
    e === `magic`
      ? t.cat === `magic` || t.cat === `support`
      : e === `defense`
        ? t.cat === `defense` || t.cat === `support`
        : t.cat === e;
  return n
    .filter((e) => r(S[e]))
    .sort((e, t) => S[e].tier - S[t].tier || S[e].cost - S[t].cost);
}
function Ce(e) {
  let t = k[e.champion] || [],
    n = e.items.slice();
  for (let e of t) {
    let t = n.indexOf(e);
    if (t >= 0) {
      n[t] = null;
      continue;
    }
    return e;
  }
  return null;
}
function we(e) {
  let t = null;
  try {
    t = y(e);
  } catch {
    t = null;
  }
  return t || Ce(e);
}
function Te(e, t) {
  let n = S[t];
  if (!n) return 0;
  if (n.consumable || !e) return n.cost;
  try {
    let r = D(e, t);
    return Number.isFinite(r) ? r : n.cost;
  } catch {
    return n.cost;
  }
}
function Ee(e) {
  let t = new Set(),
    n = (r) => {
      for (let i of (S[r] && S[r].from) || [])
        (e.includes(i) || t.add(i), n(i));
    };
  return (e.forEach(n), [...t].sort((e, t) => S[e].cost - S[t].cost));
}
var De = (e, t) =>
    Array.isArray(e) ? e[Math.max(0, Math.min(e.length - 1, t - 1))] : e,
  Oe = (e) => Math.round(e * 100) / 100;
function ke(e, t) {
  return Array.isArray(e)
    ? t
      ? e
          .map((e, n) => (n === t - 1 ? `<b>${Oe(e)}</b>` : `<i>${Oe(e)}</i>`))
          .join(`<i>/</i>`)
      : `<b>${e.map(Oe).join(`/`)}</b>`
    : `<b>${Oe(e)}</b>`;
}
var Ae = { ad: `AD`, ap: `AP`, bonusAd: `bonus AD`, hp: `bonus Health` };
function je(e) {
  if (!e) return ``;
  let t = [];
  for (let n in e)
    t.push(`<em class="r-${n}">+${Math.round(e[n] * 100)}% ${Ae[n] || n}</em>`);
  return t.length ? ` <span class="ratio">(${t.join(`, `)})</span>` : ``;
}
var Me = { physical: `dmg-phys`, magic: `dmg-magic`, true: `dmg-true` };
function Ne(e, t) {
  if (!e.dmg) return ``;
  let n = e.dmgType || `magic`;
  return `${ke(e.dmg, t)}${je(e.ratio)} <span class="${Me[n] || ``}">${n} damage</span>`;
}
function Pe(e, t) {
  if (!e) return ``;
  let n = ke(e.duration, t);
  switch (e.type) {
    case `slow`:
      return `, slowing them by <b>${Math.round((e.power || 0) * 100)}%</b> for ${n}s`;
    case `stun`:
      return `, <span class="cc">stunning</span> them for ${n}s`;
    case `root`:
      return `, <span class="cc">rooting</span> them for ${n}s`;
    case `knockup`:
      return `, <span class="cc">knocking them airborne</span> for ${n}s`;
    case `silence`:
      return `, <span class="cc">silencing</span> them for ${n}s`;
    default:
      return `, applying ${P(e.type)} for ${n}s`;
  }
}
var Fe = {
  armor: `Armor`,
  mr: `Magic Resist`,
  msPct: `Movement Speed`,
  ad: `Attack Damage`,
  ap: `Ability Power`,
  attackSpeed: `Attack Speed`,
  haste: `Ability Haste`,
};
function Ie(e, t) {
  let n = e;
  if (typeof e == `function`)
    try {
      n = e(Math.max(1, t));
    } catch {
      n = null;
    }
  if (!n) return ``;
  let r = [];
  for (let t in n) {
    let i = n[t],
      a = t === `msPct` || t === `attackSpeed`;
    r.push(
      typeof e == `function`
        ? `bonus <b>${Fe[t] || t}</b>`
        : `<b>+${a ? Math.round(i * 100) + `%` : i}</b> ${Fe[t] || t}`,
    );
  }
  return r.join(` and `);
}
function Le(e, t, n = 0, r = null) {
  if (e.tooltip)
    try {
      return O(e, n, r, { html: !0 });
    } catch {}
  let i = e.desc || e.description || e.text;
  if (i) return P(i);
  let a = Ne(e, n),
    o = Pe(e.cc, n),
    s = De(e.range || 0, n || 1);
  switch (e.type) {
    case `skillshot`:
      return `Fires a ${e.pierce ? `piercing ` : ``}bolt in a line, dealing ${a} to ${e.pierce ? `every enemy` : `the first enemy`} hit${o}.`;
    case `cone`:
      return `Sweeps a ${e.angle || 60}° arc in front, dealing ${a} to enemies caught${o}.`;
    case `aoe`:
      return s
        ? (e.delay || 0) >= 0.5
          ? `After a <b>${e.delay}s</b> delay, strikes the target area, dealing ${a}${o}.`
          : `Strikes the target area, dealing ${a}${o}.`
        : `Unleashes a burst around ${P(t)}, dealing ${a} to nearby enemies${o}.`;
    case `dash`: {
      let t = `Dashes toward the target location${e.dmg ? `, dealing ${a} to enemies on arrival` : ``}${o}.`;
      return (
        e.afterDash &&
          /attack/i.test(String(e.afterDash)) &&
          (t += ` Empowers the next basic attack.`),
        t
      );
    }
    case `blink`:
      return `Blinks instantly to the target location.`;
    case `buff`: {
      let r = [];
      e.shield &&
        r.push(
          `gains a shield absorbing ${ke(e.shield, n)}${je(e.shieldRatio)} damage`,
        );
      let i = e.buffStats ? Ie(e.buffStats, n) : ``;
      i && r.push(`gains ${i}`);
      let a = P(t);
      return r.length
        ? `${a} ${r.join(` and `)} for <b>${e.duration || 0}s</b>.`
        : `${a} is empowered for <b>${e.duration || 0}s</b>.`;
    }
    case `target`:
      return `${e.dashTo ? `Leaps to` : `Strikes`} a target enemy, dealing ${a}${o}.`;
    case `line`:
      return `${(e.delay || 0) > 0 ? `After a <b>${e.delay}s</b> wind-up, unleashes` : `Unleashes`} a ${(e.width || 1) >= 2 ? `wide ` : ``}surge along a ${s >= 15 ? `very long ` : ``}line, dealing ${a}${o}.`;
    default:
      return e.dmg ? `Deals ${a}${o}.` : ``;
  }
}
function Re(e, t = null) {
  let n = e && e.passive;
  if (!n) return ``;
  if (n.tooltip)
    try {
      return T(e, t, { html: !0 });
    } catch {}
  return P(n.text || n.description || ``);
}
var ze = {
  skillshot: `Skillshot`,
  cone: `Cone`,
  aoe: `Area`,
  dash: `Dash`,
  blink: `Blink`,
  buff: `Self`,
  target: `Targeted`,
  line: `Line`,
};
function Be(e, t, n) {
  let r = De(e.cost || 0, Math.max(1, t));
  return r
    ? `${Array.isArray(e.cost) && !t ? e.cost.join(`/`) : r} ${n === `energy` ? `Energy` : `Mana`}`
    : `No cost`;
}
function Ve(e, t) {
  return e.cooldown
    ? Array.isArray(e.cooldown) && !t
      ? `${e.cooldown.join(`/`)}s`
      : `${Oe(De(e.cooldown, Math.max(1, t)))}s`
    : ``;
}
function He(e) {
  let t = e.base,
    n = e.abilities,
    r = n.reduce(
      (e, t) =>
        e + (Array.isArray(t.dmg) ? t.dmg[t.dmg.length - 1] : t.dmg || 0),
      0,
    ),
    i =
      n.filter((e) => e.cc && e.cc.type !== `slow`).length +
      n.filter((e) => e.cc && e.cc.type === `slow`).length * 0.45,
    a =
      n.filter((e) => e.type === `dash` || e.type === `blink` || e.dashTo)
        .length +
      (t.moveSpeed - 3.3) * 4 +
      n.filter((e) => e.buffStats).length * 0.4,
    o =
      (t.hp + t.hpGrowth * 8 + (t.armor + t.mr) * 9) / 2400 +
      n.filter((e) => e.shield).length * 0.18,
    s = (e, t, n) => Math.max(0.12, Math.min(1, (e - t) / (n - t)));
  return [
    [`Damage`, s(r + t.ad * 3, 520, 1050)],
    [`Toughness`, s(o, 0.7, 1.25)],
    [`Control`, s(i, 0, 3)],
    [`Mobility`, s(a, 0, 2.6)],
  ];
}
function Ue(e) {
  let t = x[e],
    n = (t && t.visual) || {};
  return {
    primary: n.primary || `#223`,
    secondary: n.secondary || `#6af`,
    accent: n.accent || `#fff`,
    element: (t && t.attackElement) || `arcane`,
    name: t ? t.name : e,
    mono: (t ? t.name : e)[0].toUpperCase(),
  };
}
var We = [
    `Last-hitting minions is the steadiest source of gold — watch their health bars.`,
    `Turrets hit hard early. Let your minion wave take the first shots.`,
    `The Storm Drake grants your whole team lasting bonus damage.`,
    `Brush hides you from enemies outside it. Ambush, or be ambushed.`,
    `Recall to your fountain to heal and spend gold between fights.`,
    `An Ace means every enemy champion is down — push for structures.`,
  ],
  Ge = 820,
  Ke = 1024,
  qe = new Map(),
  Je = new Map(),
  Ye = [],
  Xe = null,
  Ze = !1,
  H = null,
  U = null,
  Qe = null,
  $e = !1,
  et = 0,
  W = {},
  tt = {
    brannoc: { yaw: 0.42, cast: null },
    sable: { yaw: 0.5, cast: `Q`, at: 0.2 },
    morrow: { yaw: 0.36, cast: `W`, at: 0.3 },
    vyre: { yaw: 0.46, cast: null },
    oru: { yaw: 0.38, cast: `W`, at: 0.3 },
  },
  nt = (e) => qe.get(e) || (Ze ? `failed` : `none`),
  rt = (e) => Je.get(e) || null;
function it(e, t = !1) {
  let n = qe.get(e);
  if (n !== `ready` && n !== `failed`) {
    if (n === `pending`) {
      if (t) {
        let t = Ye.indexOf(e);
        t > 0 && (Ye.splice(t, 1), Ye.unshift(e));
      }
      return;
    }
    if (Ze) {
      qe.set(e, `failed`);
      return;
    }
    (qe.set(e, `pending`), t ? Ye.unshift(e) : Ye.push(e), ct());
  }
}
var at = new Set();
function ot(e) {
  return (at.add(e), () => at.delete(e));
}
function st(e) {
  for (let t of at)
    try {
      t(e);
    } catch (e) {
      console.warn(`[hud splash]`, e);
    }
}
function ct() {
  $e || (($e = !0), Promise.resolve().then(lt));
}
async function lt() {
  try {
    for (; Ye.length; ) {
      let e = Ye.shift();
      try {
        let t = await gt(e);
        t ? (Je.set(e, t), qe.set(e, `ready`)) : qe.set(e, `failed`);
      } catch (t) {
        (console.warn(`[hud splash]`, e, t && t.message), qe.set(e, `failed`));
      }
      (st(e), await ut());
    }
  } finally {
    (($e = !1), dt());
  }
}
var ut = () => new Promise((e) => requestAnimationFrame(() => e()));
function dt() {
  (clearTimeout(et),
    (et = setTimeout(() => {
      if (!($e || Ye.length || !H)) {
        try {
          (H.dispose(), H.forceContextLoss());
        } catch {}
        ((H = null), (U = null));
      }
    }, 6e3)));
}
async function ft() {
  if (Xe || Ze) return Xe;
  try {
    let [e, t, n] = await Promise.all([
      ee(
        () => import(`./types-DoNhvZyi.js`),
        __vite__mapDeps([0, 1, 2, 3, 4, 5, 6, 7]),
        import.meta.url,
      ),
      ee(
        () => import(`./view-DHHUoofK.js`),
        __vite__mapDeps([8, 1, 2, 3, 4, 9, 5, 6, 7, 10, 11]),
        import.meta.url,
      ),
      ee(
        () => import(`./material-BPS_1X92.js`),
        __vite__mapDeps([10, 1, 2, 3, 4, 5, 6, 11]),
        import.meta.url,
      ),
    ]);
    if (!e.getType || !t.ChampionView || !n.sharedAssets)
      throw Error(`champion API changed`);
    Xe = {
      getType: e.getType,
      ChampionView: t.ChampionView,
      sharedAssets: n.sharedAssets,
    };
  } catch (e) {
    ((Ze = !0),
      console.warn(`[hud splash] hero renders unavailable:`, e && e.message));
    let t = [];
    for (let [e, n] of qe) n === `pending` && (qe.set(e, `failed`), t.push(e));
    for (let e of t) st(e);
  }
  return Xe;
}
function pt() {
  ((H = new te({
    canvas: document.createElement(`canvas`),
    alpha: !0,
    antialias: !0,
    preserveDrawingBuffer: !0,
    powerPreference: `high-performance`,
  })),
    (H.outputColorSpace = m),
    (H.toneMapping = 4),
    (H.toneMappingExposure = 1.08),
    H.setClearColor(0, 0),
    H.setPixelRatio(1),
    H.setSize(Ge, Ke, !1),
    (U = new C()),
    (U.environment = Xe.sharedAssets().env),
    (U.environmentIntensity = 0.5),
    (Qe = new j(24, Ge / Ke, 0.05, 60)),
    (W.hemi = new _(`#c7d4ec`, `#34291c`, 0.55)),
    U.add(W.hemi),
    (W.key = new g(`#ffe2c0`, 2.7)),
    U.add(W.key, W.key.target),
    (W.fill = new g(`#8fb0ff`, 0.55)),
    U.add(W.fill, W.fill.target),
    (W.rim = new g(`#ffffff`, 3.6)),
    U.add(W.rim, W.rim.target),
    (W.rim2 = new g(`#ffffff`, 1.6)),
    U.add(W.rim2, W.rim2.target));
}
var mt = new v(),
  ht = new b();
async function gt(e) {
  if (!(await ft())) return null;
  H || pt();
  let t = Xe.getType(e),
    n = tt[e] || { yaw: 0.4 },
    r = new Xe.ChampionView(t, {
      radius: 0.6,
      teamColor: `#d8b46a`,
      rimDir: new v(0.7, 0.2, -0.7),
    });
  ((r.groundFn = () => 0), r.attach(U));
  try {
    let e = {
        x: 0,
        y: 0,
        prevX: 0,
        prevY: 0,
        facing: Math.PI / 2,
        alive: !0,
        moving: !1,
        speedNow: 0,
        attackSeq: 0,
        attackT: -99,
        castSeq: 0,
        castSlot: null,
        castT: -99,
        hitSeq: 0,
        cc: {},
        dash: null,
        recallStart: null,
        stats: { attackSpeed: 1 },
      },
      i = 1.3;
    for (let t = 0; t < 60; t++)
      ((i += 1 / 30), r.update(e, i, 1 / 30, 1, !0, !1));
    if (n.cast) {
      ((e.castSeq = 1), (e.castSlot = n.cast), (e.castT = i));
      let t = Math.round((n.at || 0.3) * 30);
      for (let n = 0; n < t; n++)
        ((i += 1 / 30), r.update(e, i, 1 / 30, 1, !0, !1));
    }
    ((r.blob.visible = !1),
      r.trailMesh && (r.trailMesh.visible = !1),
      r.group.updateMatrixWorld(!0),
      ht.makeEmpty());
    let a = t.geometry.attributes.position;
    for (let e = 0; e < a.count; e += 3)
      (mt.fromBufferAttribute(a, e),
        r.body.applyBoneTransform(e, mt),
        mt.applyMatrix4(r.body.matrixWorld),
        ht.expandByPoint(mt));
    let o = Math.min(ht.max.y, t.height * 1.35),
      s = Math.max(1, o),
      c = ht.getCenter(new v()),
      l = s * 1.2,
      u = (Qe.fov * Math.PI) / 180,
      d = (l * 0.5) / Math.tan(u / 2),
      f = o + l * 0.1 - l * 0.5,
      p = n.yaw,
      m = c.x * 0.5,
      g = c.z * 0.5;
    (Qe.position.set(m + Math.sin(p) * d, f - s * 0.04, g + Math.cos(p) * d),
      Qe.lookAt(m, f, g),
      Qe.updateProjectionMatrix());
    let _ = new v(m, s * 0.55, g),
      y = new h(t.element);
    (W.key.position.set(
      _.x - 2.2 * Math.cos(p) + 1.2 * Math.sin(p),
      _.y + 2.6,
      _.z + 2.2 * Math.sin(p) + 1.2 * Math.cos(p),
    ),
      W.key.target.position.copy(_),
      W.fill.position.set(
        _.x + 2.6 * Math.cos(p),
        _.y + 0.4,
        _.z - 2.6 * Math.sin(p) + 1,
      ),
      W.fill.target.position.copy(_),
      W.rim.color.copy(y).lerp(new h(`#ffffff`), 0.3),
      W.rim.position.set(
        _.x + 2.2 * Math.cos(p) - 2.4 * Math.sin(p),
        _.y + 1.6,
        _.z - 2.2 * Math.sin(p) - 2.4 * Math.cos(p),
      ),
      W.rim.target.position.copy(_),
      W.rim2.color.set(`#fff4e0`),
      W.rim2.position.set(
        _.x - 2.6 * Math.cos(p) - 2 * Math.sin(p),
        _.y + 1.2,
        _.z + 2.6 * Math.sin(p) - 2 * Math.cos(p),
      ),
      W.rim2.target.position.copy(_),
      typeof H.compileAsync == `function` && (await H.compileAsync(U, Qe)),
      H.render(U, Qe));
    let b = document.createElement(`canvas`);
    return (
      (b.width = Ge),
      (b.height = Ke),
      b.getContext(`2d`).drawImage(H.domElement, 0, 0),
      b
    );
  } finally {
    (r.dispose(),
      U.remove(r.group),
      r.blob && U.remove(r.blob),
      r.trailMesh && U.remove(r.trailMesh));
  }
}
var _t = Symbol(`hud-art-wait`);
function G(e, t, n) {
  let r = (e * 374761393 + t * 668265263 + n * 1274126177) | 0;
  return (
    (r = Math.imul(r ^ (r >>> 13), 1274126177)),
    (r ^= r >>> 16),
    (r >>> 0) / 4294967296
  );
}
function vt(e, t, n) {
  let r = Math.floor(e),
    i = Math.floor(t),
    a = e - r,
    o = t - i,
    s = a * a * (3 - 2 * a),
    c = o * o * (3 - 2 * o),
    l = G(r, i, n),
    u = G(r + 1, i, n),
    d = G(r, i + 1, n),
    f = G(r + 1, i + 1, n);
  return l + (u - l) * s + (d - l) * c + (l - u - d + f) * s * c;
}
function yt(e, t, n, r = 5) {
  let i = 0,
    a = 0.5,
    o = 1,
    s = 0;
  for (let c = 0; c < r; c++)
    ((i += a * vt(e * o, t * o, n + c * 31)),
      (s += a),
      (o *= 2.03),
      (a *= 0.5));
  return i / s;
}
var K = (e) => {
    let t = e == null ? `` : String(e),
      n = 2166136261;
    for (let e = 0; e < t.length; e++)
      ((n ^= t.charCodeAt(e)), (n = Math.imul(n, 16777619)));
    return (n >>> 0) % 1e5;
  },
  q = { willReadFrequently: !0 };
function J(e, t) {
  let n = document.createElement(`canvas`);
  return (
    (n.width = Math.max(1, Math.round(e))),
    (n.height = Math.max(1, Math.round(t))),
    n
  );
}
var Y = (e, t, n) => {
    let r = M((n - e) / (t - e), 0, 1);
    return r * r * (3 - 2 * r);
  },
  bt = (e) =>
    `#` +
    e
      .map((e) => M(Math.round(e), 0, 255).toString(16).padStart(2, `0`))
      .join(``),
  xt = (e) => !!e && typeof e == `object` && typeof e.next == `function`,
  St = (e) => Math.max(1, Math.round(1400 / Math.max(16, e)));
function Ct(e, t) {
  let n = R(e),
    r = t ? R(t) : z(n, [6, 10, 20], 0.86);
  return [
    r,
    z(n, r, 0.55),
    n,
    z(n, [255, 255, 255], 0.45),
    z(n, [255, 250, 235], 0.85),
  ];
}
function wt(e, t, n) {
  t = M(t, 0, 0.9999) * (e.length - 1);
  let r = t | 0,
    i = t - r,
    a = e[r],
    o = e[r + 1];
  return (
    (n[0] = a[0] + (o[0] - a[0]) * i),
    (n[1] = a[1] + (o[1] - a[1]) * i),
    (n[2] = a[2] + (o[2] - a[2]) * i),
    n
  );
}
var Tt = new Map();
function Et(e, t = !1) {
  let n = t ? `image/png` : `image/jpeg`;
  { let m = __mtLT.artEncode(e, n, 0.92); if (m) return m; } // [MT-HOOK] artEncode: encode off the main thread (worker), legacy toBlob = fallback
  return new Promise((t) => {
    try {
      e.toBlob(
        (r) => t(r ? URL.createObjectURL(r) : e.toDataURL(n, 0.92)),
        n,
        0.92,
      );
    } catch {
      try {
        t(e.toDataURL(n, 0.92));
      } catch {
        t(null);
      }
    }
  });
}
function* Dt(e, t, n = !1) {
  let r = Tt.get(e);
  if (r) return r;
  yield;
  let i = Tt.get(e);
  if (i) return i;
  let a = Et(yield* t(), n).then((t) => (t ? Tt.set(e, t) : Tt.delete(e), t));
  return (Tt.set(e, a), a);
}
var Ot = new Map();
function* kt(e, t, n = 0, r = `circle`, i = null, a = null) {
  let o = `orb|${e}|${t}|${n}|${r}|${i}|${a}`;
  if (Ot.has(o)) return Ot.get(o);
  let s = Ct(a || pe[e] || `#7fb0ff`, i),
    c = Math.max(24, Math.ceil(t * 0.5)),
    l = J(c, c),
    u = l.getContext(`2d`, q),
    d = u.createImageData(c, c),
    f = d.data,
    p = [0, 0, 0],
    m = n % 997,
    h = ((m % 360) * Math.PI) / 180,
    g = Math.cos(h),
    _ = Math.sin(h),
    v = St(c);
  for (let t = 0; t < c; t++) {
    for (let n = 0; n < c; n++) {
      let i = ((n + 0.5) / c) * 2 - 1,
        a = ((t + 0.5) / c) * 2 - 1,
        o =
          r === `circle`
            ? Math.hypot(i, a)
            : Math.max(Math.abs(i), Math.abs(a)) * 0.96,
        l = Math.atan2(a, i),
        u = i * g - a * _,
        d = i * _ + a * g,
        h = yt(u * 1.6 + 3.1, d * 1.6 - 1.3, m, 3),
        v = yt(u * 2.3 + h * 2.2, d * 2.3 - h * 1.7, m + 7, 4),
        y;
      switch (e) {
        case `light`:
          y =
            0.28 * v +
            0.62 * Math.abs(Math.sin(l * 6 + h * 2.5)) ** 9 * (1 - o * 0.8) +
            0.75 * (1 - Y(0, 0.42, o));
          break;
        case `arcane`:
          y =
            0.34 * v +
            0.5 * Math.abs(Math.sin(o * 9 - l * 2 + v * 4)) ** 7 +
            0.28 * (1 - Y(0, 0.35, o));
          break;
        case `earth`: {
          let e = 1 - Math.abs(h * 2 - 1);
          y = 0.14 + 0.2 * v + e ** 7 * 0.95;
          break;
        }
        case `shadow`:
          y =
            0.22 * v +
            0.55 *
              Math.abs(Math.sin(l * 3 + o * 7 + h * 3)) ** 11 *
              (1 - o * 0.4) +
            0.3 * (1 - Y(0, 0.45, o));
          break;
        case `water`: {
          let e = 1 - Math.abs(v * 2 - 1);
          y =
            0.28 * v +
            0.36 * Math.abs(Math.sin(a * 7 + v * 5)) ** 5 +
            0.36 * e ** 9;
          break;
        }
        case `fire`:
          y =
            0.12 +
            0.75 *
              (1 - Math.abs(h * 2 - 1)) ** 4 *
              (0.35 + 0.65 * Y(-1, 0.9, a)) +
            0.35 * (1 - Y(0.1, 0.9, Math.hypot(i, a - 0.45)));
          break;
        case `frost`: {
          let e = 1 - Math.abs(v * 2 - 1),
            t = 1 - Math.abs(h * 2 - 1);
          y = 0.24 * v + 0.7 * Math.max(e, t) ** 12 + 0.22 * (1 - Y(0, 0.5, o));
          break;
        }
        case `nature`: {
          let e = 1 - Math.abs(v * 2 - 1);
          y = 0.26 * v + 0.62 * e ** 6 + 0.12 * (1 - o);
          break;
        }
        case `storm`: {
          let e = 1 - Math.abs(v * 2 - 1);
          y = 0.18 * v + 1.05 * e ** 15;
          break;
        }
        case `steel`:
        case `gold`:
          y =
            0.3 +
            0.22 * v +
            0.28 * Math.abs(Math.sin(o * 30)) ** 40 * (1 - Y(0.8, 0.95, o)) +
            0.12 * (G(Math.floor((l + 4) * 90), 1, m) - 0.5);
          break;
        default:
          y = 0.2 + 0.6 * v;
      }
      wt(s, 0.1 + M(y, 0, 1.2) * 0.78, p);
      let b = (0.5 + 0.5 * (1 - Y(0.25, 1.02, o))) * (1 - 0.28 * Y(0.1, 1, a)),
        x = 0.22 * (1 - Y(0, 0.55, Math.hypot(i + 0.32, a + 0.45))),
        S = (t * c + n) * 4;
      ((f[S] = Math.min(255, p[0] * b + 255 * x)),
        (f[S + 1] = Math.min(255, p[1] * b + 250 * x)),
        (f[S + 2] = Math.min(255, p[2] * b + 240 * x)),
        (f[S + 3] = 255));
    }
    t % v === v - 1 && (yield);
  }
  u.putImageData(d, 0, 0);
  let y = J(t, t),
    b = y.getContext(`2d`, q);
  return (
    (b.imageSmoothingEnabled = !0),
    (b.imageSmoothingQuality = `high`),
    b.drawImage(l, 0, 0, t, t),
    Ot.set(o, y),
    y
  );
}
var At = (e, t, n = 0, r = `circle`) =>
    Dt(`e|${e}|${t}|${n}|${r}`, () => kt(e, t, n, r)),
  jt = {
    long_sword: [`#ff9a4a`, `kite`],
    dagger: [`#5cf07a`, `barv`],
    agility_cloak: [`#f2e05a`, `triR`],
    amp_tome: [`#b58cff`, `square`],
    sapphire_crystal: [`#dff0ff`, `disc`],
    cloth_armor: [`#8fb6dc`, `stack2`],
    null_mantle: [`#ff8fd0`, `shield`],
    ruby_crystal: [`#ff4d62`, `diamond`],
    boots: [`#dcb27a`, `chevron`],
    health_potion: [`#ff5d7a`, `cross`],
    swift_boots: [`#63f0d0`, `wedge`],
    steel_boots: [`#c3ccd6`, `triD`],
    sorcerer_boots: [`#e08cff`, `crescent`],
    resolute_treads: [`#5a7cff`, `chevronD`],
    sunforged_blade: [`#ffd24a`, `star8`],
    gale_bow: [`#7fdcff`, `bowtie`],
    reaver_axe: [`#ff5a3a`, `notch`],
    night_edge: [`#8f6bff`, `teardrop`],
    rend_bow: [`#ffae3a`, `split`],
    mortal_reminder: [`#ff3f7f`, `arrow`],
    astral_crown: [`#ffe7a0`, `crown`],
    void_staff: [`#7a55ff`, `ring`],
    storm_orb: [`#5aa8ff`, `bolt`],
    hexbane_tome: [`#a6d63a`, `saltire`],
    aegis_plate: [`#f5c866`, `merlon`],
    thorned_mail: [`#d08a4a`, `quad`],
    warden_veil: [`#3fdcb8`, `lens`],
    titan_heart: [`#ff7a5a`, `barh`],
    tidal_chalice: [`#48c4ff`, `cup`],
  },
  Mt = [
    `#ff9a4a`,
    `#5cf07a`,
    `#b58cff`,
    `#ff4d62`,
    `#63f0d0`,
    `#ffd24a`,
    `#7fdcff`,
    `#ff3f7f`,
    `#a6d63a`,
    `#5a7cff`,
  ],
  Nt = [
    `pentagon`,
    `octagon`,
    `hexagon`,
    `arch`,
    `trapezoid`,
    `stack3`,
    `cross`,
    `ring`,
    `diamond`,
    `disc`,
  ],
  Pt = (e) => jt[e] || [Mt[K(e) % Mt.length], Nt[(K(e) >> 3) % Nt.length]];
[...new Set([...Object.values(jt).map((e) => e[1]), ...Nt])];
var X = (e, t = 160) =>
  Dt(`item|${e}|${t}`, function* () {
    let n = S[e] || { name: e, cat: `physical`, tier: 1 },
      r = _e[n.cat] || `steel`,
      [i, a] = Pt(e),
      o = R(i),
      s = J(t, t),
      c = s.getContext(`2d`, q),
      l = yield* kt(r, t, K(e), `square`, `#05070c`, i);
    (c.drawImage(l, 0, 0),
      (c.fillStyle = `rgba(3,6,12,.5)`),
      c.fillRect(0, 0, t, t));
    let u = c.createRadialGradient(
      t * 0.5,
      t * 0.5,
      0,
      t * 0.5,
      t * 0.5,
      t * 0.55,
    );
    (u.addColorStop(0, B(o, 0.55)),
      u.addColorStop(0.5, B(o, 0.14)),
      u.addColorStop(1, B(o, 0)),
      (c.fillStyle = u),
      c.fillRect(0, 0, t, t),
      yield,
      It(
        c,
        a,
        t / 2,
        t / 2,
        t * (n.tier >= 3 ? 0.34 : 0.3),
        o,
        n.tier,
        t <= 72,
      ),
      yield);
    let d =
        n.tier >= 3
          ? [`#fff2b8`, `#d8a94c`, `#6b4a17`]
          : n.tier === 2
            ? [`#f1d7b8`, `#b0784a`, `#4d2f19`]
            : [`#e8eef5`, `#8c9aab`, `#2c3440`],
      f = Math.max(2, t * 0.045),
      p = c.createLinearGradient(0, 0, t, t);
    (p.addColorStop(0, d[0]),
      p.addColorStop(0.45, d[1]),
      p.addColorStop(1, d[2]),
      (c.lineWidth = f),
      (c.strokeStyle = p),
      c.strokeRect(f / 2, f / 2, t - f, t - f),
      (c.lineWidth = Math.max(1, t * 0.01)),
      (c.strokeStyle = `rgba(0,0,0,.55)`),
      c.strokeRect(f + 1, f + 1, t - f * 2 - 2, t - f * 2 - 2));
    let m = c.createRadialGradient(
      t * 0.5,
      t * 0.46,
      t * 0.28,
      t * 0.5,
      t * 0.5,
      t * 0.74,
    );
    return (
      m.addColorStop(0, `rgba(0,0,0,0)`),
      m.addColorStop(1, `rgba(0,0,0,.5)`),
      (c.fillStyle = m),
      c.fillRect(f, f, t - f * 2, t - f * 2),
      s
    );
  });
function Ft(e, t, n, r) {
  let i = new Path2D(),
    a = 6.2831853,
    o = (e, r, o, s = 0, c = 0) => {
      for (let l = 0; l <= e; l++) {
        let u = o + (l * a) / e,
          d = t + s + Math.cos(u) * r,
          f = n + c + Math.sin(u) * r;
        l ? i.lineTo(d, f) : i.moveTo(d, f);
      }
      i.closePath();
    },
    s = (e, r, a, o) => {
      for (let s = 0; s <= e * 2; s++) {
        let c = o + (s * Math.PI) / e,
          l = s % 2 ? a : r,
          u = t + Math.cos(c) * l,
          d = n + Math.sin(c) * l;
        s ? i.lineTo(u, d) : i.moveTo(u, d);
      }
      i.closePath();
    },
    c = (e) => {
      for (let a = 0; a < e.length; a += 2) {
        let o = t + e[a] * r,
          s = n + e[a + 1] * r;
        a ? i.lineTo(o, s) : i.moveTo(o, s);
      }
      i.closePath();
    },
    l = (e, r, a, o = 0) => {
      let s = Math.cos(e),
        c = Math.sin(e),
        l = t - s * r - c * o,
        u = n - c * r + s * o,
        d = t + s * r - c * o,
        f = n + c * r + s * o;
      (i.moveTo(l - c * a, u + s * a),
        i.arc(l, u, a, e + Math.PI / 2, e + Math.PI * 1.5),
        i.lineTo(d + c * a, f - s * a),
        i.arc(d, f, a, e - Math.PI / 2, e + Math.PI / 2),
        i.closePath());
    };
  switch (e) {
    case `disc`:
      (i.moveTo(t + r, n), i.arc(t, n, r, 0, a));
      break;
    case `ring`:
      (i.moveTo(t + r, n),
        i.arc(t, n, r, 0, a),
        i.moveTo(t + r * 0.5, n),
        i.arc(t, n, r * 0.5, 0, a, !0));
      break;
    case `crescent`:
      (i.moveTo(t + r, n),
        i.arc(t, n, r, 0, a),
        i.moveTo(t + r * 1.62, n - r * 0.1),
        i.arc(t + r * 0.66, n - r * 0.1, r * 0.96, 0, a, !0));
      break;
    case `lens`:
      (i.moveTo(t - r * 1.14, n),
        i.quadraticCurveTo(t, n - r * 1.02, t + r * 1.14, n),
        i.quadraticCurveTo(t, n + r * 1.02, t - r * 1.14, n),
        i.closePath());
      break;
    case `kite`:
      c([0, -1.16, 0.36, 0.1, 0, 1.16, -0.36, 0.1]);
      break;
    case `diamond`:
      o(4, r * 1.08, -Math.PI / 2);
      break;
    case `square`:
      i.rect(t - r * 0.76, n - r * 0.76, r * 1.52, r * 1.52);
      break;
    case `hexagon`:
      o(6, r * 1.04, 0);
      break;
    case `pentagon`:
      o(5, r * 1.08, -Math.PI / 2);
      break;
    case `octagon`:
      o(8, r * 1, Math.PI / 8);
      break;
    case `shield`:
      (i.moveTo(t - r * 0.74, n - r * 1.04),
        i.lineTo(t + r * 0.74, n - r * 1.04),
        i.lineTo(t + r * 0.66, n - r * 0.1),
        i.quadraticCurveTo(t + r * 0.58, n + r * 0.66, t, n + r * 1.16),
        i.quadraticCurveTo(
          t - r * 0.58,
          n + r * 0.66,
          t - r * 0.66,
          n - r * 0.1,
        ),
        i.closePath());
      break;
    case `arch`:
      (i.moveTo(t - r * 0.96, n + r * 0.86),
        i.lineTo(t - r * 0.96, n - r * 0.08),
        i.arc(t, n - r * 0.08, r * 0.96, Math.PI, 0),
        i.lineTo(t + r * 0.96, n + r * 0.86),
        i.closePath());
      break;
    case `trapezoid`:
      c([-0.58, -0.84, 0.58, -0.84, 1.08, 0.84, -1.08, 0.84]);
      break;
    case `cup`:
      c([-1.06, -0.76, 1.06, -0.76, 0.48, 0.9, -0.48, 0.9]);
      break;
    case `wedge`:
      o(3, r * 1.14, -Math.PI / 2, 0, r * 0.12);
      break;
    case `triR`:
      o(3, r * 1.14, 0, -r * 0.12, 0);
      break;
    case `triD`:
      o(3, r * 1.14, Math.PI / 2, 0, -r * 0.12);
      break;
    case `chevron`:
      c([0, -1.02, 1, 0.16, 1, 0.74, 0, -0.44, -1, 0.74, -1, 0.16]);
      break;
    case `chevronD`:
      c([0, 1.02, -1, -0.16, -1, -0.74, 0, 0.44, 1, -0.74, 1, -0.16]);
      break;
    case `cross`:
      c([
        -0.36, -1.02, 0.36, -1.02, 0.36, -0.36, 1.02, -0.36, 1.02, 0.36, 0.36,
        0.36, 0.36, 1.02, -0.36, 1.02, -0.36, 0.36, -1.02, 0.36, -1.02, -0.36,
        -0.36, -0.36,
      ]);
      break;
    case `saltire`:
      (l(Math.PI / 4, r * 0.86, r * 0.28), l(-Math.PI / 4, r * 0.86, r * 0.28));
      break;
    case `barv`:
      l(Math.PI / 2, r * 0.8, r * 0.34);
      break;
    case `barh`:
      l(0, r * 0.82, r * 0.36);
      break;
    case `stack2`:
      (l(0, r * 0.9, r * 0.22, -r * 0.42), l(0, r * 0.9, r * 0.22, r * 0.42));
      break;
    case `stack3`:
      (l(0, r * 0.96, r * 0.19, -r * 0.62),
        l(0, r * 0.7, r * 0.19, 0),
        l(0, r * 0.96, r * 0.19, r * 0.62));
      break;
    case `star8`:
      s(8, r * 1.14, r * 0.58, -Math.PI / 2);
      break;
    case `bowtie`:
      (c([-1.06, -0.84, -0.07, 0, -1.06, 0.84]),
        i.moveTo(t + r * 1.06, n - r * 0.84),
        i.lineTo(t + r * 0.07, n),
        i.lineTo(t + r * 1.06, n + r * 0.84),
        i.closePath());
      break;
    case `notch`:
      c([
        -0.94, -0.94, -0.32, -0.94, 0, -0.24, 0.32, -0.94, 0.94, -0.94, 0.94,
        0.94, -0.94, 0.94,
      ]);
      break;
    case `teardrop`:
      (i.moveTo(t, n - r * 1.2),
        i.quadraticCurveTo(
          t + r * 0.74,
          n - r * 0.2,
          t + r * 0.64,
          n + r * 0.42,
        ),
        i.arc(t, n + r * 0.42, r * 0.64, 0, Math.PI),
        i.quadraticCurveTo(t - r * 0.74, n - r * 0.2, t, n - r * 1.2),
        i.closePath());
      break;
    case `split`:
      (c([-0.2, -1.06, -0.2, 1.06, -1.08, 0]),
        i.moveTo(t + r * 0.2, n - r * 1.06),
        i.lineTo(t + r * 1.08, n),
        i.lineTo(t + r * 0.2, n + r * 1.06),
        i.closePath());
      break;
    case `arrow`:
      c([
        0, -1.14, 0.94, -0.1, 0.38, -0.1, 0.38, 1.06, -0.38, 1.06, -0.38, -0.1,
        -0.94, -0.1,
      ]);
      break;
    case `crown`:
      c([
        -1.06, 0.86, -1.06, -0.9, -0.55, 0.26, 0, -1.18, 0.55, 0.26, 1.06, -0.9,
        1.06, 0.86,
      ]);
      break;
    case `merlon`:
      c([
        -1, 0.9, -1, -0.9, -0.55, -0.9, -0.55, -0.16, -0.2, -0.16, -0.2, -0.9,
        0.2, -0.9, 0.2, -0.16, 0.55, -0.16, 0.55, -0.9, 1, -0.9, 1, 0.9,
      ]);
      break;
    case `quad`:
      for (let e = 0; e < 4; e++) {
        let t = -Math.PI / 2 + (e * Math.PI) / 2;
        o(
          4,
          r * 0.44,
          -Math.PI / 2,
          Math.cos(t) * r * 0.64,
          Math.sin(t) * r * 0.64,
        );
      }
      break;
    case `bolt`:
      c([
        0.38, -1.12, -0.88, 0.1, -0.14, 0.1, -0.38, 1.12, 0.88, -0.1, 0.14,
        -0.1,
      ]);
      break;
    default:
      o(6, r * 1.04, -Math.PI / 2);
  }
  return i;
}
function It(e, t, n, r, i, a, o, s) {
  let c = z(a, [255, 255, 255], 0.48),
    l = a,
    u = z(a, [6, 9, 18], 0.66),
    d = Ft(t, n, r, i),
    f = null;
  if (!s)
    try {
      ((f = new Path2D()),
        f.addPath(
          d,
          new DOMMatrix()
            .translateSelf(n, r)
            .scaleSelf(0.56)
            .translateSelf(-n, -r),
        ));
    } catch {
      f = null;
    }
  (e.save(),
    e.save(),
    (e.filter = `blur(${Math.max(1, i * 0.08).toFixed(2)}px)`),
    (e.globalAlpha = 0.45),
    e.translate(i * 0.04, i * 0.11),
    (e.fillStyle = `#01030a`),
    e.fill(d),
    e.restore(),
    (e.lineJoin = `round`),
    (e.lineCap = `round`),
    (e.shadowColor = B(a, s ? 0.45 : 0.7)),
    (e.shadowBlur = i * (s ? 0.2 : 0.38)),
    (e.lineWidth = Math.max(1.6, i * 0.15)),
    (e.strokeStyle = `rgba(3,6,12,.85)`),
    e.stroke(d),
    (e.shadowBlur = 0),
    (e.shadowColor = `transparent`));
  let p = e.createLinearGradient(0, r - i * 1.2, 0, r + i * 1.2);
  (p.addColorStop(0, B(c, 1)),
    p.addColorStop(0.34, B(l, 1)),
    p.addColorStop(1, B(u, 1)),
    (e.fillStyle = p),
    e.fill(d),
    e.save(),
    e.clip(d));
  let m = e.createRadialGradient(
    n - i * 0.42,
    r - i * 0.58,
    0,
    n - i * 0.3,
    r - i * 0.4,
    i * 1.55,
  );
  (m.addColorStop(0, `rgba(255,255,255,.4)`),
    m.addColorStop(0.5, `rgba(255,255,255,.07)`),
    m.addColorStop(1, `rgba(255,255,255,0)`),
    (e.fillStyle = m),
    e.fillRect(n - i * 1.4, r - i * 1.4, i * 2.8, i * 2.8));
  let h = e.createLinearGradient(0, r + i * 0.05, 0, r + i * 1.25);
  if (
    (h.addColorStop(0, `rgba(2,6,16,0)`),
    h.addColorStop(1, `rgba(2,6,16,.5)`),
    (e.fillStyle = h),
    e.fillRect(n - i * 1.4, r - i * 1.4, i * 2.8, i * 2.8),
    f &&
      ((e.lineWidth = Math.max(1, i * 0.05)),
      (e.strokeStyle = B(z(c, [255, 255, 255], 0.35), 0.38)),
      e.stroke(f)),
    o >= 3)
  ) {
    let t = e.createRadialGradient(n, r - i * 0.1, 0, n, r - i * 0.1, i * 0.62);
    (t.addColorStop(0, B(c, s ? 0.5 : 0.75)),
      t.addColorStop(1, B(c, 0)),
      (e.globalCompositeOperation = `lighter`),
      (e.fillStyle = t),
      e.fillRect(n - i * 1.4, r - i * 1.4, i * 2.8, i * 2.8));
  }
  (e.restore(),
    (e.lineWidth = Math.max(1, i * 0.055)),
    (e.strokeStyle = B(z(c, [255, 255, 255], 0.5), s ? 0.5 : 0.72)),
    e.stroke(d),
    e.restore());
}
function Lt(e, t, n, r, i, a = `gold`, o = 1) {
  (e.save(),
    (e.globalAlpha = o),
    (e.textAlign = `center`),
    (e.textBaseline = `middle`),
    (e.font = `600 ${i}px Optima, Candara, "Avenir Next", sans-serif`),
    (e.shadowColor = `rgba(0,0,0,.75)`),
    (e.shadowBlur = i * 0.18),
    (e.shadowOffsetY = i * 0.05));
  let s = e.createLinearGradient(0, r - i * 0.55, 0, r + i * 0.5);
  (a === `gold`
    ? (s.addColorStop(0, `#fff7d6`),
      s.addColorStop(0.45, `#f0c96a`),
      s.addColorStop(0.55, `#b98a33`),
      s.addColorStop(1, `#fbe3a0`))
    : (s.addColorStop(0, `#ffffff`),
      s.addColorStop(0.5, `#d7e3f0`),
      s.addColorStop(0.56, `#8fa3b8`),
      s.addColorStop(1, `#eef5ff`)),
    (e.fillStyle = s),
    e.fillText(t, n, r),
    (e.shadowColor = `transparent`),
    (e.lineWidth = Math.max(1, i * 0.025)),
    (e.strokeStyle = `rgba(20,12,4,.55)`),
    e.strokeText(t, n, r),
    e.restore());
}
var Rt = {
  light: {
    Q: `#ffd36b`,
    W: `#ff8f3a`,
    E: `#b49aff`,
    R: `#fff0c4`,
    plate: `#4c0f2c`,
  },
  arcane: {
    Q: `#a283ff`,
    W: `#ff6fd1`,
    E: `#56a6ff`,
    R: `#ebdfff`,
    plate: `#081f52`,
  },
  earth: {
    Q: `#e38b3c`,
    W: `#e9c66a`,
    E: `#ff5530`,
    R: `#ffc272`,
    plate: `#2c0b03`,
  },
  shadow: {
    Q: `#9a5cff`,
    W: `#36eecb`,
    E: `#ff4f8a`,
    R: `#d7bcff`,
    plate: `#050212`,
  },
  water: {
    Q: `#39d0e0`,
    W: `#7ff0b0`,
    E: `#4f86ff`,
    R: `#e6fbff`,
    plate: `#021a2c`,
  },
  fire: {
    Q: `#ff7a2f`,
    W: `#ffcf4a`,
    E: `#ff3f55`,
    R: `#ffe2a8`,
    plate: `#2a0500`,
  },
  frost: {
    Q: `#8fd9ff`,
    W: `#c3b4ff`,
    E: `#58f0ff`,
    R: `#f2fbff`,
    plate: `#061a36`,
  },
  nature: {
    Q: `#7bdc5a`,
    W: `#d9f06a`,
    E: `#3fd6a6`,
    R: `#efffd0`,
    plate: `#0a2406`,
  },
  storm: {
    Q: `#6fb4ff`,
    W: `#a88cff`,
    E: `#7ff6ff`,
    R: `#eef6ff`,
    plate: `#06123a`,
  },
};
function zt(e, t) {
  let n = e.element || t || `arcane`,
    r = Rt[n] || Rt.arcane,
    i = e.slot && r[e.slot] ? e.slot : `Q`,
    a = r[i];
  return {
    tint: a,
    plate:
      i === `R` ? r.plate : bt(z(R(a), [3, 5, 10], i === `W` ? 0.84 : 0.76)),
    element: n,
    slot: i,
  };
}
var Bt = {
    skillshot: `bolt`,
    cone: `fan`,
    dash: `sweep`,
    blink: `starburst`,
    buff: `aura`,
    target: `converge`,
    line: `beam`,
    passive: `sigil`,
  },
  Vt = {
    bolt: [`twin`, `nova`],
    fan: [`nova`, `motes`],
    rings: [`motes`, `nova`],
    reticle: [`motes`, `nova`],
    sweep: [`starburst`, `nova`],
    aura: [`motes`, `nova`],
    converge: [`nova`, `motes`],
    beam: [`nova`, `twin`],
  };
function Ht(e) {
  let t = (e) =>
    e.type === `aoe`
      ? (e.range || 0) > 0
        ? `reticle`
        : `rings`
      : Bt[e.type] || `rings`;
  if (e.type === `passive`) return `sigil`;
  let n = x[String(e.fx || ``).split(`_`)[0]],
    r = n ? n.abilities : [e],
    i = new Set(),
    a = t(e);
  for (let n of r) {
    let r = t(n);
    if (
      (n.slot === `R` && (r === `rings` || r === `reticle`) && (r = `nova`),
      i.has(r) &&
        (r = (Vt[r] || [`motes`, `nova`]).find((e) => !i.has(e)) || `motes`),
      i.add(r),
      n === e || (n.slot === e.slot && n.fx === e.fx))
    ) {
      a = r;
      break;
    }
  }
  return a;
}
var Ut = (e, t, n = 192) =>
  Dt(`ab|${e.fx || e.name}|${e.slot || ``}|${n}`, function* () {
    let { tint: r, plate: i, element: a, slot: o } = zt(e, t),
      s = R(r),
      c = z(s, [255, 255, 255], 0.7),
      l = J(n, n),
      u = l.getContext(`2d`, q);
    return (
      u.drawImage(yield* kt(a, n, K(e.fx || e.name), `circle`, i, r), 0, 0),
      yield,
      Wt(u, n, o, s, c, e.type === `passive`),
      Zt(u, Ht(e), n, s, c, e, K(e.name || `x`)),
      yield,
      o === `R` && Gt(u, n, s, c),
      l
    );
  });
function Wt(e, t, n, r, i, a) {
  let o = t / 2,
    s = t / 2;
  if ((e.save(), n === `W`)) {
    let n = e.createRadialGradient(o, s, 0, o, s, t * 0.5);
    (n.addColorStop(0, `rgba(0,0,0,.55)`),
      n.addColorStop(0.55, `rgba(0,0,0,.3)`),
      n.addColorStop(1, `rgba(0,0,0,0)`),
      (e.fillStyle = n),
      e.fillRect(0, 0, t, t),
      (e.globalCompositeOperation = `lighter`));
    let a = e.createRadialGradient(o, s, t * 0.3, o, s, t * 0.5);
    (a.addColorStop(0, B(r, 0)),
      a.addColorStop(0.72, B(r, 0.42)),
      a.addColorStop(0.9, B(i, 0.35)),
      a.addColorStop(1, B(r, 0)),
      (e.fillStyle = a),
      e.fillRect(0, 0, t, t));
  } else if (n === `E`) {
    ((e.fillStyle = `rgba(0,0,0,.34)`),
      e.fillRect(0, 0, t, t),
      (e.globalCompositeOperation = `lighter`));
    let n = e.createLinearGradient(0, t, t, 0);
    (n.addColorStop(0.18, B(r, 0)),
      n.addColorStop(0.46, B(r, 0.34)),
      n.addColorStop(0.54, B(i, 0.3)),
      n.addColorStop(0.82, B(r, 0)),
      (e.fillStyle = n),
      e.fillRect(0, 0, t, t));
  } else if (n === `R`) {
    ((e.fillStyle = `rgba(0,0,0,.4)`),
      e.fillRect(0, 0, t, t),
      (e.globalCompositeOperation = `lighter`));
    let n = e.createRadialGradient(o, s, 0, o, s, t * 0.34);
    (n.addColorStop(0, B(i, 0.45)),
      n.addColorStop(1, B(r, 0)),
      (e.fillStyle = n),
      e.fillRect(0, 0, t, t));
  } else {
    let n = e.createRadialGradient(o, s, t * 0.2, o, s, t * 0.52);
    (n.addColorStop(0, `rgba(0,0,0,0)`),
      n.addColorStop(1, `rgba(0,0,0,${a ? 0.5 : 0.42})`),
      (e.fillStyle = n),
      e.fillRect(0, 0, t, t),
      (e.globalCompositeOperation = `lighter`));
    let i = e.createRadialGradient(o, s, 0, o, s, t * 0.3);
    (i.addColorStop(0, B(r, 0.42)),
      i.addColorStop(1, B(r, 0)),
      (e.fillStyle = i),
      e.fillRect(0, 0, t, t));
  }
  e.restore();
}
function Gt(e, t, n, r) {
  let i = t / 2,
    a = t / 2;
  (e.save(), (e.globalCompositeOperation = `lighter`), (e.lineCap = `round`));
  for (let o = 0; o < 36; o++) {
    let s = (o / 36) * Math.PI * 2,
      c = t * (o % 3 ? 0.43 : 0.405),
      l = t * 0.465;
    (e.beginPath(),
      e.moveTo(i + Math.cos(s) * c, a + Math.sin(s) * c),
      e.lineTo(i + Math.cos(s) * l, a + Math.sin(s) * l),
      (e.lineWidth = t * (o % 3 ? 0.006 : 0.012)),
      (e.strokeStyle = B(o % 3 ? n : r, o % 3 ? 0.55 : 0.9)),
      e.stroke());
  }
  (e.beginPath(),
    e.arc(i, a, t * 0.472, 0, 6.283),
    (e.lineWidth = t * 0.008),
    (e.strokeStyle = B(r, 0.6)),
    e.stroke(),
    e.restore());
}
var Kt = {
    flash: {
      hex: `#a8f6ff`,
      plate: `#042233`,
      element: `frost`,
      shape: `starburst`,
    },
    heal: {
      hex: `#6fff9a`,
      plate: `#03240f`,
      element: `nature`,
      shape: `aura`,
    },
    ignite: {
      hex: `#ff7a2f`,
      plate: `#2a0700`,
      element: `fire`,
      shape: `flame`,
    },
    smite: {
      hex: `#ffc24a`,
      plate: `#2a1200`,
      element: `storm`,
      shape: `strike`,
    },
  },
  qt = (e) =>
    Kt[e] || {
      hex: `#c9d6e4`,
      plate: `#0a1018`,
      element: (me[e] || {}).element || `steel`,
      shape: `rings`,
    },
  Jt = (e, t = 256) =>
    Dt(`atk|${e.id}|${t}`, function* () {
      let n = R(pe[e.attackElement] || `#ffd36b`),
        r = z(n, [255, 255, 255], 0.65),
        i = J(t, t),
        a = i.getContext(`2d`, q);
      (a.drawImage(
        yield* kt(
          `steel`,
          t,
          K(e.id + `attack`),
          `circle`,
          `#0c1016`,
          `#8d9aab`,
        ),
        0,
        0,
      ),
        yield);
      let o = a.createRadialGradient(
        t / 2,
        t / 2,
        t * 0.1,
        t / 2,
        t / 2,
        t * 0.5,
      );
      (o.addColorStop(0, B(n, 0.16)),
        o.addColorStop(1, `rgba(0,0,0,.4)`),
        (a.fillStyle = o),
        a.fillRect(0, 0, t, t),
        Zt(a, e.ranged ? `impact` : `slash`, t, n, r, {}, K(e.id)),
        yield);
      let s = t / 2;
      (a.save(), (a.globalCompositeOperation = `source-atop`));
      let c = a.createRadialGradient(s, s, 0, s, s, t * 0.36);
      (c.addColorStop(0, `rgba(8,12,18,.66)`),
        c.addColorStop(0.5, `rgba(8,12,18,.4)`),
        c.addColorStop(0.82, `rgba(8,12,18,.14)`),
        c.addColorStop(1, `rgba(8,12,18,0)`),
        (a.fillStyle = c),
        a.fillRect(0, 0, t, t),
        (a.globalCompositeOperation = `lighter`));
      let l = a.createRadialGradient(s, s, 0, s, s, t * 0.13);
      return (
        l.addColorStop(0, `rgba(255,240,206,.78)`),
        l.addColorStop(0.42, B(z(n, [255, 226, 160], 0.6), 0.5)),
        l.addColorStop(1, B(n, 0)),
        (a.fillStyle = l),
        a.fillRect(0, 0, t, t),
        a.restore(),
        a.save(),
        (a.globalCompositeOperation = `source-atop`),
        (a.lineWidth = Math.max(1, t * 0.012)),
        (a.strokeStyle = `rgba(255,226,166,.5)`),
        a.beginPath(),
        a.arc(s, s, t * 0.235, 0, 6.283),
        a.stroke(),
        (a.lineWidth = Math.max(1, t * 0.008)),
        (a.strokeStyle = `rgba(8,12,18,.55)`),
        a.beginPath(),
        a.arc(s, s, t * 0.255, 0, 6.283),
        a.stroke(),
        a.restore(),
        i
      );
    }),
  Yt = (e = 160) =>
    Dt(`recall|${e}`, function* () {
      let t = R(`#7fd8ff`),
        n = z(t, [255, 255, 255], 0.7),
        r = J(e, e),
        i = r.getContext(`2d`, q);
      return (
        i.drawImage(
          yield* kt(`water`, e, 404, `circle`, `#021824`, `#5fc8f0`),
          0,
          0,
        ),
        yield,
        Wt(i, e, `W`, t, n),
        Zt(i, `rings`, e, t, n, { range: 0 }, 404),
        r
      );
    }),
  Xt = (e, t = 160) =>
    Dt(`sp|${e}|${t}`, function* () {
      let n = qt(e),
        r = R(n.hex),
        i = z(r, [255, 255, 255], 0.7),
        a = J(t, t),
        o = a.getContext(`2d`, q);
      return (
        o.drawImage(
          yield* kt(n.element, t, K(`spell` + e), `circle`, n.plate, n.hex),
          0,
          0,
        ),
        yield,
        Wt(o, t, `Q`, r, i),
        Zt(o, n.shape, t, r, i, { radius: 2, range: 1 }, K(e)),
        a
      );
    });
function Z(e, t, n, r) {
  ((e.lineWidth = t),
    (e.strokeStyle = n),
    (e.shadowColor = n),
    (e.shadowBlur = r),
    e.stroke());
}
function Zt(e, t, n, r, i, a, o) {
  let s = n / 2,
    c = n / 2;
  (e.save(),
    (e.globalCompositeOperation = `lighter`),
    (e.lineCap = `round`),
    (e.lineJoin = `round`));
  let l = (e) => B(r, e),
    u = (e) => B(i, e),
    d = (e) => G(e, 77, o),
    f = (t, n, r, i = 1) => {
      let a = e.createRadialGradient(t, n, 0, t, n, r);
      (a.addColorStop(0, `rgba(255,255,255,${i})`),
        a.addColorStop(0.25, u(0.8 * i)),
        a.addColorStop(1, l(0)),
        (e.fillStyle = a),
        e.beginPath(),
        e.arc(t, n, r, 0, 6.283),
        e.fill());
    },
    p = (t, n, r, i, a, o = 1) => {
      let s = Math.cos(r),
        c = Math.sin(r),
        d = e.createLinearGradient(t, n, t + s * i, n + c * i);
      (d.addColorStop(0, `rgba(255,255,255,${o})`),
        d.addColorStop(0.35, u(0.85 * o)),
        d.addColorStop(1, l(0)),
        (e.fillStyle = d),
        e.beginPath(),
        e.moveTo(t - c * a, n + s * a),
        e.lineTo(t + s * i, n + c * i),
        e.lineTo(t + c * a, n - s * a),
        e.closePath(),
        e.fill());
    },
    m = (t, r, i, a, o = 1) => {
      let s = Math.hypot(i - t, a - r),
        c = (i - t) / s,
        u = (a - r) / s,
        d = -u,
        p = c;
      for (let s = 0; s < 3; s++) {
        let f = n * (0.11 - s * 0.03) * o,
          m = e.createLinearGradient(t, r, i, a);
        (m.addColorStop(0, l(0)),
          m.addColorStop(
            1,
            s === 2 ? `rgba(255,255,255,.95)` : l(0.55 + s * 0.15),
          ),
          (e.fillStyle = m),
          e.beginPath(),
          e.moveTo(t, r),
          e.lineTo(i + d * f, a + p * f),
          e.quadraticCurveTo(
            i + c * f * 2.2,
            a + u * f * 2.2,
            i - d * f,
            a - p * f,
          ),
          e.closePath(),
          e.fill());
      }
      f(i + c * n * 0.02, a + u * n * 0.02, n * 0.2 * o);
    };
  switch (t) {
    case `bolt`:
      if ((m(n * 0.16, n * 0.84, n * 0.72, n * 0.28), a.pierce))
        for (let e = 1; e <= 2; e++)
          f(
            n * (0.16 + 0.56 * (0.3 + e * 0.2)),
            n * (0.84 - 0.56 * (0.3 + e * 0.2)),
            n * 0.07,
            0.6,
          );
      break;
    case `twin`:
      (m(n * 0.1, n * 0.7, n * 0.6, n * 0.2, 0.7),
        m(n * 0.36, n * 0.92, n * 0.84, n * 0.44, 0.7));
      break;
    case `fan`: {
      let t = (Math.min(150, a.angle || 60) * Math.PI) / 180,
        r = s,
        i = n * 0.86,
        o = n * 0.78,
        c = e.createRadialGradient(r, i, 0, r, i, o);
      (c.addColorStop(0, `rgba(255,255,255,.9)`),
        c.addColorStop(0.2, u(0.55)),
        c.addColorStop(1, l(0)),
        (e.fillStyle = c),
        e.beginPath(),
        e.moveTo(r, i),
        e.arc(r, i, o, -Math.PI / 2 - t / 2, -Math.PI / 2 + t / 2),
        e.closePath(),
        e.fill());
      for (let a = 0; a < 7; a++) {
        let s =
          -Math.PI / 2 - t / 2 + (t * (a + 0.5)) / 7 + (d(a) - 0.5) * 0.08;
        (e.beginPath(),
          e.moveTo(r, i),
          e.lineTo(
            r + Math.cos(s) * o * (0.7 + d(a + 9) * 0.25),
            i + Math.sin(s) * o * (0.7 + d(a + 9) * 0.25),
          ),
          Z(e, n * 0.012, u(0.7), n * 0.03));
      }
      ((e.shadowBlur = 0),
        e.beginPath(),
        e.arc(r, i, o * 0.72, -Math.PI / 2 - t / 2, -Math.PI / 2 + t / 2),
        Z(e, n * 0.035, u(0.85), n * 0.06),
        f(r, i, n * 0.16));
      break;
    }
    case `rings`: {
      let t = n * 0.4,
        r = e.createRadialGradient(s, c, 0, s, c, t);
      (r.addColorStop(0, u(0.35)),
        r.addColorStop(0.7, l(0.1)),
        r.addColorStop(1, l(0)),
        (e.fillStyle = r),
        e.beginPath(),
        e.arc(s, c, t, 0, 6.283),
        e.fill());
      for (let r = 0; r < 3; r++)
        (e.beginPath(),
          e.arc(s, c, t * (0.4 + r * 0.3), 0, 6.283),
          Z(e, n * (0.012 + r * 0.01), u(0.4 + r * 0.25), n * 0.05));
      ((e.shadowBlur = 0), f(s, c, n * 0.12));
      break;
    }
    case `reticle`: {
      let t = n * 0.32,
        r = c + n * 0.06,
        i = e.createRadialGradient(s, r, 0, s, r, t);
      (i.addColorStop(0, u(0.5)),
        i.addColorStop(0.7, l(0.12)),
        i.addColorStop(1, l(0)),
        (e.fillStyle = i),
        e.beginPath(),
        e.arc(s, r, t, 0, 6.283),
        e.fill());
      for (let i = 0; i < 3; i++)
        (e.beginPath(),
          e.ellipse(
            s,
            r,
            t * (0.45 + i * 0.28),
            t * (0.45 + i * 0.28) * 0.6,
            0,
            0,
            6.283,
          ),
          Z(e, n * (0.028 - i * 0.007), u(0.85 - i * 0.22), n * 0.05));
      e.shadowBlur = 0;
      for (let i = 0; i < 5; i++) {
        let a = s + (d(i) - 0.5) * t * 1.1;
        (e.beginPath(),
          e.moveTo(a - n * 0.07, n * 0.06),
          e.lineTo(a, r - t * 0.15 * d(i + 3)),
          Z(e, n * 0.016, u(0.7), n * 0.03));
      }
      ((e.shadowBlur = 0), f(s, r, n * 0.14));
      break;
    }
    case `motes`:
      (e.translate(s, c),
        e.rotate(-0.5),
        e.beginPath(),
        e.ellipse(0, 0, n * 0.38, n * 0.17, 0, 0, 6.283),
        Z(e, n * 0.014, u(0.6), n * 0.04),
        (e.shadowBlur = 0),
        e.beginPath(),
        e.ellipse(0, 0, n * 0.3, n * 0.3, 0, 0, 6.283),
        (e.lineWidth = n * 0.006),
        (e.strokeStyle = l(0.35)),
        e.stroke());
      for (let e = 0; e < 6; e++) {
        let t = (e / 6) * Math.PI * 2 + 0.3,
          r = n * (0.03 + (e % 3) * 0.018);
        f(Math.cos(t) * n * 0.38, Math.sin(t) * n * 0.17, r * 2.2, 0.95);
      }
      (e.setTransform(1, 0, 0, 1, 0, 0), f(s, c, n * 0.2));
      break;
    case `nova`:
      for (let e = 0; e < 16; e++)
        p(
          s,
          c,
          (e / 16) * Math.PI * 2 + 0.2,
          n * (e % 2 ? 0.24 : 0.44),
          n * (e % 2 ? 0.018 : 0.03),
          e % 2 ? 0.6 : 1,
        );
      (e.beginPath(),
        e.arc(s, c, n * 0.3, 0, 6.283),
        Z(e, n * 0.01, u(0.5), n * 0.03),
        (e.shadowBlur = 0),
        f(s, c, n * 0.26));
      break;
    case `sweep`: {
      let t = n * 0.56,
        r = n * 0.6,
        i = Math.PI * 0.86,
        a = Math.PI * 1.78,
        o =
          typeof e.createConicGradient == `function`
            ? e.createConicGradient(i, t, r)
            : null;
      (o
        ? (o.addColorStop(0, l(0)),
          o.addColorStop(((a - i) / (Math.PI * 2)) * 0.7, l(0.7)),
          o.addColorStop((a - i) / (Math.PI * 2), `rgba(255,255,255,.95)`),
          o.addColorStop(Math.min(1, (a - i) / (Math.PI * 2) + 0.01), l(0)),
          (e.fillStyle = o))
        : (e.fillStyle = u(0.8)),
        e.beginPath(),
        e.arc(t, r, n * 0.4, i, a),
        e.arc(t + n * 0.05, r + n * 0.05, n * 0.29, a, i, !0),
        e.closePath(),
        e.fill());
      for (let o = 0; o < 2; o++)
        (e.beginPath(),
          e.arc(
            t + n * 0.05,
            r + n * 0.05,
            n * (0.22 - o * 0.07),
            i + 0.35 + o * 0.2,
            a - 0.05,
          ),
          Z(e, n * 0.012, u(0.55 - o * 0.18), n * 0.03));
      ((e.shadowBlur = 0),
        f(t + Math.cos(a) * n * 0.36, r + Math.sin(a) * n * 0.36, n * 0.17));
      break;
    }
    case `starburst`: {
      let t = n * 0.6,
        r = n * 0.42;
      (e.beginPath(),
        e.arc(n * 0.27, n * 0.74, n * 0.09, 0, 6.283),
        Z(e, n * 0.012, u(0.45), n * 0.03),
        (e.shadowBlur = 0));
      for (let e = 0; e < 4; e++)
        f(n * (0.33 + e * 0.065), n * (0.67 - e * 0.065), n * 0.022, 0.7);
      for (let e = 0; e < 4; e++)
        p(t, r, (e * Math.PI) / 2 - Math.PI / 2, n * 0.4, n * 0.034);
      for (let e = 0; e < 4; e++)
        p(t, r, (e * Math.PI) / 2 - Math.PI / 4, n * 0.18, n * 0.02, 0.7);
      (e.beginPath(),
        e.arc(t, r, n * 0.13, 0, 6.283),
        Z(e, n * 0.01, u(0.6), n * 0.03),
        (e.shadowBlur = 0),
        f(t, r, n * 0.17));
      break;
    }
    case `aura`: {
      let t = n * 0.3;
      if (
        (e.beginPath(),
        e.arc(s, c, t, 0, 6.283),
        Z(e, n * 0.05, u(0.8), n * 0.08),
        e.beginPath(),
        e.arc(s, c, t * 1.25, 0, 6.283),
        Z(e, n * 0.012, u(0.5), n * 0.03),
        (e.shadowBlur = 0),
        a.shield)
      )
        for (let r = 0; r < 6; r++) {
          let i = (r * Math.PI) / 3 + Math.PI / 6;
          (e.beginPath(),
            e.moveTo(s + Math.cos(i) * t * 0.55, c + Math.sin(i) * t * 0.55),
            e.lineTo(
              s + Math.cos(i + Math.PI / 3) * t * 0.55,
              c + Math.sin(i + Math.PI / 3) * t * 0.55,
            ),
            Z(e, n * 0.016, u(0.55), n * 0.02));
        }
      e.shadowBlur = 0;
      for (let e = 0; e < 9; e++)
        f(
          s + (d(e) - 0.5) * n * 0.7,
          n * (0.2 + d(e + 20) * 0.7),
          n * (0.02 + d(e + 40) * 0.03),
          0.9,
        );
      let r = e.createRadialGradient(s, c, 0, s, c, t);
      (r.addColorStop(0, u(0.35)),
        r.addColorStop(1, l(0)),
        (e.fillStyle = r),
        e.beginPath(),
        e.arc(s, c, t, 0, 6.283),
        e.fill());
      break;
    }
    case `converge`:
    case `strike`: {
      let r = s,
        i = t === `strike` ? n * 0.62 : c;
      for (let t = 0; t < 8; t++) {
        let a = (t * Math.PI) / 4 + d(t) * 0.3,
          o = n * 0.46,
          s = n * 0.1;
        (e.beginPath(),
          e.moveTo(r + Math.cos(a) * o, i + Math.sin(a) * o),
          e.lineTo(r + Math.cos(a) * s, i + Math.sin(a) * s),
          Z(e, n * (t % 2 ? 0.014 : 0.026), u(t % 2 ? 0.5 : 0.85), n * 0.04));
      }
      if (
        (t === `strike` &&
          (e.beginPath(),
          e.moveTo(r - n * 0.05, 0),
          e.lineTo(r + n * 0.03, i * 0.5),
          e.lineTo(r - n * 0.02, i * 0.55),
          e.lineTo(r, i),
          Z(e, n * 0.04, `rgba(255,255,255,.95)`, n * 0.08)),
        (e.shadowBlur = 0),
        f(r, i, n * 0.2),
        a.dashTo)
      )
        for (let e = 0; e < 3; e++)
          f(n * (0.2 + e * 0.1), n * (0.8 - e * 0.1), n * 0.035, 0.7);
      break;
    }
    case `beam`: {
      let t = n * Math.min(0.2, 0.08 + (a.width || 1) * 0.045);
      (e.translate(s, c), e.rotate(-Math.PI / 4));
      for (let r = 0; r < 3; r++) {
        let i = t * (1 - r * 0.32),
          a = e.createLinearGradient(0, -i, 0, i);
        (a.addColorStop(0, l(0)),
          a.addColorStop(
            0.5,
            r === 2 ? `rgba(255,255,255,.95)` : u(0.5 + r * 0.2),
          ),
          a.addColorStop(1, l(0)),
          (e.fillStyle = a),
          e.fillRect(-n, -i, n * 2, i * 2));
      }
      for (let e = 0; e < 6; e++)
        f((d(e) - 0.5) * n * 0.9, (d(e + 5) - 0.5) * t * 3.2, n * 0.025, 0.7);
      (e.setTransform(1, 0, 0, 1, 0, 0), f(n * 0.22, n * 0.78, n * 0.2));
      break;
    }
    case `impact`:
      (e.beginPath(),
        e.arc(s, c, n * 0.25, 0, 6.283),
        Z(e, n * 0.045, u(0.9), n * 0.07),
        (e.shadowBlur = 0),
        e.beginPath(),
        e.arc(s, c, n * 0.25, 0, 6.283),
        (e.lineWidth = n * 0.012),
        (e.strokeStyle = `rgba(255,255,255,.9)`),
        e.stroke());
      for (let t = 0; t < 12; t++) {
        let r = (t / 12) * Math.PI * 2,
          i = n * 0.31,
          a = n * (t % 3 ? 0.36 : 0.41);
        (e.beginPath(),
          e.moveTo(s + Math.cos(r) * i, c + Math.sin(r) * i),
          e.lineTo(s + Math.cos(r) * a, c + Math.sin(r) * a),
          Z(e, n * (t % 3 ? 0.012 : 0.022), u(t % 3 ? 0.55 : 0.9), n * 0.03));
      }
      ((e.shadowBlur = 0), f(s, c, n * 0.12, 0.9));
      break;
    case `slash`:
      for (let t = 0; t < 3; t++) {
        let r = (t - 1) * n * 0.14;
        (e.beginPath(),
          e.moveTo(n * 0.2 + r, n * 0.18 - r * 0.3),
          e.quadraticCurveTo(
            n * 0.78 + r * 0.4,
            n * 0.3 + r * 0.2,
            n * 0.8 + r * 0.2,
            n * 0.82 + r * 0.1,
          ),
          Z(
            e,
            n * (t === 1 ? 0.05 : 0.03),
            t === 1 ? `rgba(255,255,255,.95)` : u(0.8),
            n * 0.07,
          ));
      }
      ((e.shadowBlur = 0), f(n * 0.62, n * 0.42, n * 0.16, 0.8));
      break;
    case `flame`:
      for (let t = 0; t < 5; t++) {
        let r = n * (0.3 + t * 0.1),
          i = n * (0.32 + d(t) * 0.3) * (t === 2 ? 1.25 : 1),
          a = n * 0.08,
          o = n * 0.78,
          s = e.createLinearGradient(0, o, 0, o - i);
        (s.addColorStop(0, `rgba(255,255,255,.9)`),
          s.addColorStop(0.3, u(0.8)),
          s.addColorStop(1, l(0)),
          (e.fillStyle = s),
          e.beginPath(),
          e.moveTo(r - a, o),
          e.bezierCurveTo(
            r - a * 1.2,
            o - i * 0.5,
            r + a * 0.4,
            o - i * 0.7,
            r + (d(t + 4) - 0.5) * a,
            o - i,
          ),
          e.bezierCurveTo(
            r + a * 0.9,
            o - i * 0.55,
            r + a * 1.1,
            o - i * 0.25,
            r + a,
            o,
          ),
          e.closePath(),
          e.fill());
      }
      for (let e = 0; e < 7; e++)
        f(
          n * (0.25 + d(e + 11) * 0.5),
          n * (0.15 + d(e + 17) * 0.4),
          n * 0.02,
          0.8,
        );
      f(s, n * 0.72, n * 0.18);
      break;
    case `sigil`: {
      let t = n * 0.3;
      (e.beginPath(),
        e.moveTo(s, c - t),
        e.lineTo(s + t * 0.7, c),
        e.lineTo(s, c + t),
        e.lineTo(s - t * 0.7, c),
        e.closePath(),
        Z(e, n * 0.022, u(0.85), n * 0.05),
        (e.shadowBlur = 0),
        e.beginPath(),
        e.moveTo(s, c - t * 0.5),
        e.lineTo(s + t * 0.35, c),
        e.lineTo(s, c + t * 0.5),
        e.lineTo(s - t * 0.35, c),
        e.closePath(),
        (e.fillStyle = u(0.5)),
        e.fill());
      for (let e = 0; e < 4; e++)
        p(s, c, (e * Math.PI) / 2 + Math.PI / 4, n * 0.4, n * 0.016, 0.7);
      f(s, c, n * 0.16);
      break;
    }
    default:
      f(s, c, n * 0.25);
  }
  e.restore();
}
var Qt = class {
    constructor(e) {
      ((this.registry = e),
        (this.renders = new Map()),
        (this.urls = new Map()),
        (this.canvases = new Map()),
        (this.listeners = new Set()),
        (this.queue = []),
        (this.failed = new Set()),
        (this.pumped = 0),
        (this.provisional = new Set()),
        ot((e) => {
          if (this.dropProvisional(e))
            for (let t of this.listeners)
              try {
                t(e, `splash`);
              } catch {}
        }));
    }
    dropProvisional(e) {
      let t = 0;
      for (let n of [...this.provisional]) {
        if (!n.startsWith(e + `|splash`)) continue;
        this.provisional.delete(n);
        let r = this.urls.get(n);
        (typeof r == `string` &&
          r.startsWith(`blob:`) &&
          setTimeout(() => URL.revokeObjectURL(r), 15e3),
          this.urls.delete(n),
          t++);
      }
      return t > 0;
    }
    onChange(e) {
      return (this.listeners.add(e), () => this.listeners.delete(e));
    }
    hasRenderer() {
      let e = this.registry.get(`champions`);
      return !!(e && typeof e.renderPortrait == `function`);
    }
    want(e, t = 256) {
      this.renders.has(e) ||
        this.failed.has(e) ||
        !this.hasRenderer() ||
        this.queue.some((t) => t.id === e) ||
        this.queue.push({ id: e, size: t });
    }
    queued(e) {
      return this.queue.some((t) => t.id === e);
    }
    pump() {
      let e = this.queue.shift();
      if (!e) return 0;
      let t = performance.now(),
        n = this.registry.get(`champions`);
      try {
        let t = n.renderPortrait(e.id, e.size),
          r = t && (t.width || t.naturalWidth) ? an(t, e.size) : null;
        r && !on(r)
          ? (this.renders.set(e.id, r), this.invalidate(e.id))
          : this.failed.add(e.id);
      } catch {
        this.failed.add(e.id);
      }
      return (this.pumped++, performance.now() - t);
    }
    pumpAll(e = 200) {
      let t = performance.now(),
        n = 0;
      for (; this.queue.length && performance.now() - t < e; )
        (this.pump(), n++);
      return n;
    }
    cardSync(e, t, n) {
      let r = this.render(e);
      if (!r) return null;
      let i = `${e}|${t}x${n}|q`,
        a = this.canvases.get(i);
      if (!a) {
        let o = Ue(e),
          s = R(o.primary),
          c = R(o.secondary),
          l = R(o.accent);
        a = J(t, n);
        let u = a.getContext(`2d`);
        u.imageSmoothingQuality = `high`;
        let d = u.createLinearGradient(0, 0, t * 0.3, n);
        (d.addColorStop(0, B(z([4, 7, 14], s, 0.75), 1)),
          d.addColorStop(0.55, B(z([3, 6, 12], s, 0.5), 1)),
          d.addColorStop(1, `#03060c`),
          (u.fillStyle = d),
          u.fillRect(0, 0, t, n));
        let f = u.createRadialGradient(
          t * 0.5,
          n * 0.34,
          0,
          t * 0.5,
          n * 0.34,
          Math.max(t, n) * 0.6,
        );
        (f.addColorStop(0, B(z(c, l, 0.45), 0.72)),
          f.addColorStop(0.42, B(c, 0.26)),
          f.addColorStop(1, B(c, 0)),
          (u.fillStyle = f),
          u.fillRect(0, 0, t, n),
          u.save(),
          (u.globalCompositeOperation = `screen`));
        for (let e = 0; e < 3; e++) {
          let r = t * (-0.1 + e * 0.36),
            i = u.createLinearGradient(r, 0, r + t * 0.45, n);
          (i.addColorStop(0, B(l, 0.12 - e * 0.03)),
            i.addColorStop(1, B(l, 0)),
            (u.fillStyle = i),
            u.beginPath(),
            u.moveTo(r, 0),
            u.lineTo(r + t * 0.07, 0),
            u.lineTo(r + t * 0.62, n),
            u.lineTo(r + t * 0.42, n),
            u.closePath(),
            u.fill());
        }
        u.restore();
        let p = Math.min(t * 0.78, n * 0.56),
          m = (t - p) / 2,
          h = n * 0.075,
          g = J(Math.round(p), Math.round(p)),
          _ = g.getContext(`2d`);
        ((_.imageSmoothingQuality = `high`),
          _.drawImage(r, 0, 0, p, p),
          (_.globalCompositeOperation = `destination-in`));
        let v = _.createLinearGradient(0, p * 0.6, 0, p);
        (v.addColorStop(0, `#000`),
          v.addColorStop(1, `rgba(0,0,0,0)`),
          (_.fillStyle = v),
          _.fillRect(0, 0, p, p),
          u.save(),
          (u.globalAlpha = 0.5),
          u.drawImage(g, m + t * 0.02, h + n * 0.012),
          u.restore(),
          u.drawImage(g, m, h));
        let y = u.createRadialGradient(
          t * 0.5,
          n * 0.36,
          Math.min(t, n) * 0.32,
          t * 0.5,
          n * 0.44,
          Math.max(t, n) * 0.72,
        );
        (y.addColorStop(0, `rgba(0,0,0,0)`),
          y.addColorStop(1, `rgba(2,4,9,.6)`),
          (u.fillStyle = y),
          u.fillRect(0, 0, t, n));
        let b = u.createLinearGradient(0, n * 0.5, 0, n);
        (b.addColorStop(0, `rgba(3,6,12,0)`),
          b.addColorStop(0.58, `rgba(3,6,12,.62)`),
          b.addColorStop(1, `rgba(3,6,12,.95)`),
          (u.fillStyle = b),
          u.fillRect(0, 0, t, n),
          this.canvases.set(i, a));
      }
      let o = J(t, n);
      return (o.getContext(`2d`).drawImage(a, 0, 0), o);
    }
    porSync(e, t) {
      let n = this.render(e);
      if (!n) return null;
      let r = `${e}|${t}|p`,
        i = this.canvases.get(r);
      if (!i) {
        let a = Ue(e),
          o = R(a.primary),
          s = R(a.secondary),
          c = R(a.accent);
        i = J(t, t);
        let l = i.getContext(`2d`);
        l.imageSmoothingQuality = `high`;
        let u = l.createRadialGradient(
          t * 0.5,
          t * 0.34,
          0,
          t * 0.5,
          t * 0.5,
          t * 0.72,
        );
        (u.addColorStop(0, B(z(s, c, 0.35), 1)),
          u.addColorStop(0.5, B(z(o, s, 0.45), 1)),
          u.addColorStop(1, B(z([3, 6, 12], o, 0.35), 1)),
          (l.fillStyle = u),
          l.fillRect(0, 0, t, t),
          l.drawImage(n, 0, 0, n.width, n.height, 0, 0, t, t));
        let d = l.createRadialGradient(
          t * 0.5,
          t * 0.6,
          t * 0.12,
          t * 0.5,
          t * 0.5,
          t * 0.72,
        );
        (d.addColorStop(0, `rgba(0,0,0,0)`),
          d.addColorStop(1, `rgba(2,5,12,.72)`),
          (l.fillStyle = d),
          l.fillRect(0, 0, t, t),
          this.canvases.set(r, i));
      }
      let a = J(t, t);
      return (a.getContext(`2d`).drawImage(i, 0, 0), a);
    }
    invalidate(e) {
      let t = 0;
      for (let n of [...this.urls.keys()])
        if (n.startsWith(e + `|`)) {
          let e = this.urls.get(n);
          (typeof e == `string` &&
            e.startsWith(`blob:`) &&
            setTimeout(() => URL.revokeObjectURL(e), 15e3),
            this.urls.delete(n),
            t++);
        }
      for (let n of [...this.canvases.keys()])
        n.startsWith(e + `|`) && (this.canvases.delete(n), t++);
      for (let t of this.listeners)
        try {
          t(e, `bust`);
        } catch {}
      return t;
    }
    render(e) {
      return this.renders.get(e) || null;
    }
    *awaitRender(e, t = 120) {
      if (this.render(e) || !this.hasRenderer()) return this.render(e);
      this.want(e);
      for (let n = 0; n < t && !this.render(e) && this.queued(e); n++) yield _t;
      return this.render(e);
    }
    *canvasArt(e, t, n = `round`) {
      let r = `${e}|${t}|${n}`;
      if (this.canvases.has(r)) return this.canvases.get(r);
      let i = yield* this.awaitRender(e),
        a = Ue(e),
        o = yield* kt(a.element, t, K(e), `square`, a.primary),
        s = J(t, t),
        c = s.getContext(`2d`, q);
      (n === `round` &&
        (c.save(),
        c.beginPath(),
        c.arc(t / 2, t / 2, t / 2, 0, Math.PI * 2),
        c.clip()),
        c.drawImage(o, 0, 0));
      let l = c.createRadialGradient(
        t * 0.5,
        t * 0.62,
        t * 0.1,
        t * 0.5,
        t * 0.5,
        t * 0.72,
      );
      return (
        l.addColorStop(0, `rgba(0,0,0,0)`),
        l.addColorStop(1, `rgba(2,5,12,.7)`),
        (c.fillStyle = l),
        c.fillRect(0, 0, t, t),
        i
          ? c.drawImage(i, 0, 0, i.width, i.height, 0, 0, t, t)
          : Lt(c, a.mono, t * 0.5, t * 0.55, t * 0.62, `gold`),
        n === `round` && c.restore(),
        this.canvases.set(r, s),
        s
      );
    }
    *urlArt(e, t) {
      let n = `${e}|${t}|u`,
        r = this.urls.get(n);
      if (r) return r;
      yield;
      let i = Et(yield* this.canvasArt(e, t, `square`)).then(
        (e) => (this.urls.get(n) === i && this.urls.set(n, e), e),
      );
      return (this.urls.set(n, i), i);
    }
    *splashArt(e, t, n, r = 20) {
      let i = `${e}|splash${t}x${n}|s`,
        a = this.urls.get(i);
      if (a) return a;
      (yield, it(e, r > 40));
      for (let t = 0; t < r && nt(e) === `pending`; t++) yield _t;
      let o = rt(e),
        s = null;
      o || (s = yield* this.awaitRender(e, 90));
      let c = Ue(e),
        l = R(c.primary),
        u = R(c.secondary),
        d = R(c.accent),
        f = K(e),
        p = rn(l, 0.09, 0.9),
        m = rn(l, 0.25, 0.8),
        h = Math.round((120 * n) / t),
        g = J(120, h),
        _ = g.getContext(`2d`, q),
        v = _.createImageData(120, h),
        y = v.data,
        b = St(120);
      for (let e = 0; e < h; e++) {
        for (let t = 0; t < 120; t++) {
          let n = t / 120,
            r = e / h,
            i = yt(n * 3 + 1, r * 3, f, 3),
            a = yt(n * 4 + i * 2.4, r * 4 - i * 1.8, f + 3, 4),
            o = Math.exp(-((n - 0.5) ** 2 * 7 + (r - 0.36) ** 2 * 5)),
            s = a * 0.7 + o * 0.6 - r * 0.3,
            c = z(
              z(z([4, 7, 14], p, Y(0.05, 0.45, s)), m, Y(0.45, 0.9, s) * 0.85),
              d,
              Y(0.95, 1.25, s) * 0.5,
            ),
            l = (e * 120 + t) * 4;
          ((y[l] = c[0]),
            (y[l + 1] = c[1]),
            (y[l + 2] = c[2]),
            (y[l + 3] = 255));
        }
        e % b === b - 1 && (yield);
      }
      _.putImageData(v, 0, 0);
      let x = J(t, n),
        S = x.getContext(`2d`);
      ((S.imageSmoothingQuality = `high`),
        S.drawImage(g, 0, 0, t, n),
        yield,
        S.save(),
        (S.globalCompositeOperation = `screen`));
      let C = z(d, m, 0.45);
      for (let e = 0; e < 6; e++) {
        let r = t * (-0.2 + e * 0.16 + G(e, 1, f) * 0.08),
          i = S.createLinearGradient(r, 0, r + t * 0.5, n);
        (i.addColorStop(0, B(C, 0.13 * G(e, 2, f))),
          i.addColorStop(1, B(C, 0)),
          (S.fillStyle = i),
          S.beginPath(),
          S.moveTo(r, 0),
          S.lineTo(r + t * 0.05, 0),
          S.lineTo(r + t * 0.65, n),
          S.lineTo(r + t * 0.45, n),
          S.closePath(),
          S.fill());
      }
      for (let e = 0; e < 60; e++) {
        let r = G(e, 7, f) * t,
          i = G(e, 9, f) * n * 0.8,
          a = (0.6 + G(e, 11, f) * 2) * (t / 360);
        ((S.fillStyle = B(z(d, [255, 255, 255], 0.4), 0.2 + G(e, 13, f) * 0.5)),
          S.beginPath(),
          S.arc(r, i, a, 0, 6.283),
          S.fill());
      }
      let w = S.createRadialGradient(
        t * 0.5,
        n * 0.36,
        0,
        t * 0.5,
        n * 0.36,
        Math.max(t, n) * 0.55,
      );
      (w.addColorStop(0, B(z(m, d, 0.3), 0.5)),
        w.addColorStop(0.45, B(m, 0.2)),
        w.addColorStop(1, B(m, 0)),
        (S.fillStyle = w),
        S.fillRect(0, 0, t, n),
        S.restore(),
        yield);
      let T = J(t, n),
        E = T.getContext(`2d`);
      if (((E.imageSmoothingQuality = `high`), o)) {
        let e = Math.max(t / o.width, n / o.height),
          r = o.width * e,
          i = o.height * e;
        E.drawImage(o, (t - r) / 2, 0, r, i);
      } else if (s) {
        let e = Math.min(t * 0.92, n * 0.66);
        (E.drawImage(s, (t - e) / 2, n * 0.06, e, e),
          (E.globalCompositeOperation = `destination-in`));
        let r = E.createLinearGradient(0, n * 0.06 + e * 0.62, 0, n * 0.06 + e);
        (r.addColorStop(0, `#000`),
          r.addColorStop(1, `rgba(0,0,0,0)`),
          (E.fillStyle = r),
          E.fillRect(0, 0, t, n),
          (E.globalCompositeOperation = `source-over`));
      }
      if (o || s) {
        (S.save(),
          (S.filter = `blur(${Math.round(t * 0.02)}px)`),
          (S.globalAlpha = 0.55),
          (S.globalCompositeOperation = `multiply`));
        let e = J(t, n),
          r = e.getContext(`2d`);
        (r.drawImage(T, 0, 0),
          (r.globalCompositeOperation = `source-in`),
          (r.fillStyle = `#02040a`),
          r.fillRect(0, 0, t, n),
          S.drawImage(e, t * 0.03, n * 0.015),
          S.restore());
        let i = Math.max(3, Math.round(t * 0.009)),
          a = J(t, n),
          o = a.getContext(`2d`);
        for (let [e, t] of [
          [-i, 0],
          [i, 0],
          [0, -i],
          [0, i],
          [-i, -i],
          [i, i],
        ])
          o.drawImage(T, e, t);
        ((o.globalCompositeOperation = `source-in`),
          (o.fillStyle = `#cfe4ff`),
          o.fillRect(0, 0, t, n),
          S.save(),
          (S.globalAlpha = 0.42),
          (S.filter = `blur(${Math.max(1.5, i * 0.6)}px)`),
          S.drawImage(a, 0, 0),
          S.restore(),
          S.drawImage(T, 0, 0),
          yield);
        let s = J(t, n),
          c = s.getContext(`2d`),
          f = Math.max(2, Math.round(t * 0.008));
        (c.drawImage(T, 0, 0),
          (c.globalCompositeOperation = `destination-out`),
          c.drawImage(T, -f, f),
          (c.globalCompositeOperation = `source-in`),
          (c.fillStyle = B(z(d, [255, 255, 255], 0.35), 1)),
          c.fillRect(0, 0, t, n),
          S.save(),
          (S.globalCompositeOperation = `lighter`),
          (S.globalAlpha = 0.5),
          (S.filter = `blur(${Math.max(1, f * 0.6)}px)`),
          S.drawImage(s, 0, 0),
          S.restore(),
          yield);
        let p = J(t, n),
          m = p.getContext(`2d`),
          h = m.createLinearGradient(0, n, t * 0.4, 0);
        (h.addColorStop(0, B(l, 1)),
          h.addColorStop(0.55, B(u, 1)),
          h.addColorStop(1, B(d, 1)),
          (m.fillStyle = h),
          m.fillRect(0, 0, t, n),
          (m.globalCompositeOperation = `destination-in`),
          m.drawImage(T, 0, 0),
          S.save(),
          (S.globalCompositeOperation = `soft-light`),
          (S.globalAlpha = 0.45),
          S.drawImage(p, 0, 0),
          S.restore());
      } else
        (S.save(),
          (S.globalCompositeOperation = `screen`),
          Lt(
            S,
            c.mono,
            t * 0.5,
            n * 0.4,
            Math.min(t * 0.95, n * 0.62),
            `gold`,
            0.92,
          ),
          S.restore());
      let D = J(Math.round(t / 3), Math.round(n / 3)),
        O = D.getContext(`2d`);
      ((O.filter = `blur(6px) brightness(1.08)`),
        O.drawImage(x, 0, 0, D.width, D.height),
        S.save(),
        (S.globalCompositeOperation = `screen`),
        (S.globalAlpha = 0.2),
        S.drawImage(D, 0, 0, t, n),
        S.restore(),
        yield);
      let k = J(t, n),
        A = k.getContext(`2d`);
      ((A.fillStyle = A.createPattern(en(14), `repeat`)),
        A.fillRect(0, 0, t, n),
        (o || s) &&
          ((A.globalCompositeOperation = `destination-out`),
          A.drawImage(T, 0, 0)),
        S.save(),
        (S.globalCompositeOperation = `overlay`),
        (S.globalAlpha = 0.12),
        S.drawImage(k, 0, 0),
        S.restore());
      let ee = S.createRadialGradient(
        t * 0.5,
        n * 0.38,
        Math.min(t, n) * 0.3,
        t * 0.5,
        n * 0.45,
        Math.max(t, n) * 0.75,
      );
      (ee.addColorStop(0, `rgba(0,0,0,0)`),
        ee.addColorStop(1, `rgba(2,4,9,.55)`),
        (S.fillStyle = ee),
        S.fillRect(0, 0, t, n));
      let te = S.createLinearGradient(0, n * 0.52, 0, n);
      (te.addColorStop(0, `rgba(3,6,12,0)`),
        te.addColorStop(0.6, `rgba(3,6,12,.62)`),
        te.addColorStop(1, `rgba(3,6,12,.95)`),
        (S.fillStyle = te),
        S.fillRect(0, 0, t, n),
        yield,
        !o &&
          nt(e) !== `failed` &&
          (this.provisional.add(i),
          nt(e) === `ready` &&
            setTimeout(() => {
              if (this.dropProvisional(e))
                for (let t of this.listeners)
                  try {
                    t(e, `splash`);
                  } catch {}
            }, 0)));
      let j = Et(x).then(
        (e) => (this.urls.get(i) === j && this.urls.set(i, e), e),
      );
      return (this.urls.set(i, j), j);
    }
  },
  $t = new Map();
function en(e = 180) {
  let t = $t.get(e);
  if (t) return t;
  let n = J(128, 128),
    r = n.getContext(`2d`),
    i = r.createImageData(128, 128);
  for (let t = 0; t < i.data.length; t += 4) {
    let n = 128 + (G(t, 3, 17) - 0.5) * e;
    ((i.data[t] = i.data[t + 1] = i.data[t + 2] = n), (i.data[t + 3] = 255));
  }
  return (r.putImageData(i, 0, 0), $t.set(e, n), n);
}
function tn(e) {
  let t = e[0] / 255,
    n = e[1] / 255,
    r = e[2] / 255,
    i = Math.max(t, n, r),
    a = Math.min(t, n, r),
    o = (i + a) / 2;
  if (i === a) return [0, 0, o];
  let s = i - a,
    c = o > 0.5 ? s / (2 - i - a) : s / (i + a);
  return [
    (i === t
      ? (n - r) / s + (n < r ? 6 : 0)
      : i === n
        ? (r - t) / s + 2
        : (t - n) / s + 4) * 60,
    c,
    o,
  ];
}
function nn(e, t, n) {
  let r = (((e % 360) + 360) % 360) / 360;
  if (t === 0) {
    let e = n * 255;
    return [e, e, e];
  }
  let i = n < 0.5 ? n * (1 + t) : n + t - n * t,
    a = 2 * n - i,
    o = (e) => (
      (e = e < 0 ? e + 1 : e > 1 ? e - 1 : e),
      e < 1 / 6
        ? a + (i - a) * 6 * e
        : e < 1 / 2
          ? i
          : e < 2 / 3
            ? a + (i - a) * (2 / 3 - e) * 6
            : a
    );
  return [o(r + 1 / 3) * 255, o(r) * 255, o(r - 1 / 3) * 255];
}
function rn(e, t, n = 0.85) {
  let [r, i] = tn(e);
  return nn(r + 168, M(i * n + 0.18, 0.2, 0.66), t);
}
function an(e, t) {
  try {
    let n = e.width || e.naturalWidth,
      r = e.height || e.naturalHeight;
    if (!n || !r) return null;
    let i = J(t, t);
    return (i.getContext(`2d`, q).drawImage(e, 0, 0, n, r, 0, 0, t, t), i);
  } catch {
    return null;
  }
}
function on(e) {
  try {
    let t = e.getContext(`2d`, q).getImageData(0, 0, e.width, e.height).data;
    for (let e = 3; e < t.length; e += 64) if (t[e] > 8) return !1;
    return !0;
  } catch {
    return !1;
  }
}
var sn = () =>
  Dt(`vale-bg`, function* () {
    let e = 1536,
      t = J(e, 864),
      n = t.getContext(`2d`),
      r = n.createLinearGradient(0, 0, 0, 570.24);
    (r.addColorStop(0, `#070e22`),
      r.addColorStop(0.3, `#0f2742`),
      r.addColorStop(0.56, `#1b4a62`),
      r.addColorStop(0.78, `#3a6b76`),
      r.addColorStop(0.92, `#8f7355`),
      r.addColorStop(1, `#bd9463`),
      (n.fillStyle = r),
      n.fillRect(0, 0, e, 570.24),
      (n.fillStyle = `#bd9463`),
      n.fillRect(0, 569.24, e, 864 * 0.34),
      n.save(),
      (n.globalCompositeOperation = `lighter`));
    for (let t = 0; t < 14; t++) {
      let r = G(t, 1, 71) * e,
        i = 864 * (0.1 + G(t, 2, 71) * 0.42),
        a = e * (0.1 + G(t, 3, 71) * 0.22),
        o = cn(t),
        s = n.createRadialGradient(r, i, 0, r, i, a);
      (s.addColorStop(0, `rgba(120,168,196,${0.035 + G(t, 5, 71) * 0.05})`),
        s.addColorStop(1, `rgba(120,168,196,0)`),
        n.save(),
        n.translate(r, i),
        n.scale(1, o / a),
        n.translate(-r, -i),
        (n.fillStyle = s),
        n.fillRect(r - a, i - a, a * 2, a * 2),
        n.restore());
    }
    (n.restore(), yield);
    for (let t = 0; t < 420; t++) {
      let r = G(t, 3, 5) * e,
        i = G(t, 4, 5) * 864 * 0.56,
        a = G(t, 6, 5) ** 3 * (1 - i / 535.68);
      a <= 0.004 ||
        ((n.fillStyle = `rgba(222,236,255,${(0.16 + a * 0.84).toFixed(3)})`),
        n.beginPath(),
        n.arc(r, i, 0.5 + a * 1.5, 0, 6.283),
        n.fill());
    }
    let i = n.createRadialGradient(
      e * 0.52,
      544.32,
      0,
      e * 0.52,
      544.32,
      e * 0.42,
    );
    (i.addColorStop(0, `rgba(255,200,134,.42)`),
      i.addColorStop(0.4, `rgba(226,144,80,.13)`),
      i.addColorStop(1, `rgba(226,144,80,0)`),
      n.save(),
      (n.globalCompositeOperation = `lighter`),
      (n.fillStyle = i),
      n.fillRect(0, 0, e, 864),
      n.restore(),
      yield,
      n.save(),
      (n.globalCompositeOperation = `lighter`));
    for (let t = 0; t < 5; t++) {
      let r = -2.05 + t * 0.3 + G(t, 9, 13) * 0.12,
        i = 1296,
        a = 0.022 + G(t, 11, 13) * 0.028,
        o = e * 0.52,
        s = 639.36,
        c = n.createLinearGradient(
          o,
          s,
          o + Math.cos(r) * i,
          s + Math.sin(r) * i,
        );
      (c.addColorStop(0, `rgba(255,206,150,0)`),
        c.addColorStop(
          0.12,
          `rgba(255,206,150,${(0.05 + G(t, 13, 13) * 0.035).toFixed(3)})`,
        ),
        c.addColorStop(0.62, `rgba(255,206,150,.012)`),
        c.addColorStop(1, `rgba(255,214,158,0)`),
        (n.fillStyle = c),
        n.beginPath(),
        n.moveTo(o, s),
        n.lineTo(o + Math.cos(r - a) * i, s + Math.sin(r - a) * i),
        n.lineTo(o + Math.cos(r + a) * i, s + Math.sin(r + a) * i),
        n.closePath(),
        n.fill());
    }
    (n.restore(), yield);
    for (let t of [
      {
        y: 0.618,
        amp: 0.05,
        f: 3.1,
        seed: 21,
        top: `#4e6b88`,
        bot: `#38556f`,
        haze: 0.34,
        rim: 0.2,
      },
      {
        y: 0.678,
        amp: 0.062,
        f: 2.2,
        seed: 33,
        top: `#38566f`,
        bot: `#243d52`,
        haze: 0.2,
        rim: 0.13,
      },
      {
        y: 0.757,
        amp: 0.07,
        f: 1.5,
        seed: 45,
        top: `#24394e`,
        bot: `#162736`,
        haze: 0.09,
        rim: 0.07,
      },
      {
        y: 0.872,
        amp: 0.055,
        f: 1.05,
        seed: 57,
        top: `#17242f`,
        bot: `#0c141d`,
        haze: 0,
        rim: 0.04,
      },
    ]) {
      let r = t.y * 864;
      (n.beginPath(), n.moveTo(-4, 868), n.lineTo(-4, r));
      for (let i = -4; i <= 1540; i += 6) {
        let a = vt((i / e) * 9 * t.f, 3.7, t.seed) - 0.5,
          o = vt((i / e) * 26 * t.f, 1.3, t.seed + 7) - 0.5,
          s =
            Math.max(0, vt((i / e) * 3.4 * t.f, 8.1, t.seed + 3) - 0.42) ** 2 *
            3.2;
        n.lineTo(i, r - (a * 0.72 + o * 0.28 + s) * t.amp * 864);
      }
      (n.lineTo(1540, 868), n.closePath());
      let i = n.createLinearGradient(0, r - t.amp * 864, 0, 864);
      (i.addColorStop(0, t.top),
        i.addColorStop(0.55, t.bot),
        i.addColorStop(1, t.bot),
        (n.fillStyle = i),
        n.fill(),
        t.haze > 0 &&
          (n.save(),
          n.clip(),
          (n.fillStyle = `rgba(112,150,172,${t.haze})`),
          n.fillRect(0, r - t.amp * 864 - 2, e, 864),
          n.restore()),
        n.save(),
        (n.globalCompositeOperation = `lighter`),
        (n.lineWidth = 1.4),
        (n.strokeStyle = `rgba(255,206,150,${t.rim})`),
        n.beginPath());
      let a = !0;
      for (let i = -4; i <= 1540; i += 6) {
        let o = vt((i / e) * 9 * t.f, 3.7, t.seed) - 0.5,
          s = vt((i / e) * 26 * t.f, 1.3, t.seed + 7) - 0.5,
          c =
            Math.max(0, vt((i / e) * 3.4 * t.f, 8.1, t.seed + 3) - 0.42) ** 2 *
            3.2,
          l = r - (o * 0.72 + s * 0.28 + c) * t.amp * 864;
        a ? (n.moveTo(i, l), (a = !1)) : n.lineTo(i, l);
      }
      (n.stroke(), n.restore(), yield);
    }
    (n.save(), (n.globalCompositeOperation = `lighter`));
    for (let [t, r] of [
      [0.648, 0.11],
      [0.722, 0.085],
      [0.82, 0.055],
    ]) {
      let i = n.createLinearGradient(0, 864 * (t - 0.05), 0, 864 * (t + 0.06));
      (i.addColorStop(0, `rgba(150,186,204,0)`),
        i.addColorStop(0.45, `rgba(150,186,204,${r})`),
        i.addColorStop(1, `rgba(150,186,204,0)`),
        (n.fillStyle = i),
        n.fillRect(0, 864 * (t - 0.05), e, 95.04));
    }
    n.restore();
    let a = (e, t, r, i) => {
      (n.save(), n.translate(e, 864), n.rotate(i));
      let a = new Path2D();
      (a.moveTo(-t * 0.5, 0),
        a.lineTo(-t * 0.34, -864 * r * 0.96),
        a.lineTo(0, -864 * r),
        a.lineTo(t * 0.4, -864 * r * 0.88),
        a.lineTo(t * 0.52, 0),
        a.closePath());
      let o = n.createLinearGradient(0, -864 * r, 0, 0);
      (o.addColorStop(0, `#0d1a26`),
        o.addColorStop(1, `#04080d`),
        (n.fillStyle = o),
        n.fill(a),
        n.save(),
        n.clip(a),
        (n.fillStyle = `rgba(126,186,226,.1)`),
        n.fillRect(-t * 0.5, -864 * r, t * 0.13, 864),
        n.restore(),
        n.restore());
    };
    (a(e * 0.055, e * 0.042, 0.58, 0.03),
      a(e * 0.955, e * 0.032, 0.44, -0.045),
      yield);
    let o = J(256, 256),
      s = o.getContext(`2d`, q),
      c = s.createImageData(256, 256);
    for (let e = 0; e < c.data.length; e += 4) {
      let t = G(e, 7, 91) > 0.5 ? 255 : 0;
      ((c.data[e] = c.data[e + 1] = c.data[e + 2] = 255),
        (c.data[e + 3] = +!!t));
    }
    return (
      s.putImageData(c, 0, 0),
      n.save(),
      (n.fillStyle = n.createPattern(o, `repeat`)),
      n.fillRect(0, 0, e, 864),
      n.restore(),
      t
    );
  });
function cn(e) {
  return 26 + G(e, 4, 71) * 44;
}
var ln = {
    W: 1100,
    H: 620,
    cx: 550,
    cy: 330,
    PW: 420,
    bottom: 96,
    spring: -38,
    apex: -112,
    wordHalfW: 330,
    wordHalfH: 58,
  },
  un = new Map();
function* dn(e, t = 1) {
  t = Math.round(M(t, 1, 2) * 4) / 4;
  let n = `${e}|${t}`;
  if (un.has(n)) return un.get(n);
  let {
      W: r,
      H: i,
      cx: a,
      cy: o,
      PW: s,
      bottom: c,
      spring: l,
      apex: u,
      wordHalfW: d,
      wordHalfH: f,
    } = ln,
    p = J(r * t, i * t),
    m = p.getContext(`2d`);
  m.scale(t, t);
  let h = e ? 11 : 23,
    g = (e, t, n = 0) => {
      let r = a - s + t,
        i = a + s - t,
        d = o + c - t + n,
        f = o + l + t * 0.6 + n,
        p = o + u + t * 1.1 + n;
      return (
        e.moveTo(r, d),
        e.lineTo(r, f),
        e.quadraticCurveTo(a, 2 * p - f, i, f),
        e.lineTo(i, d),
        e.closePath(),
        e
      );
    },
    _ = g(new Path2D(), 0),
    v = g(new Path2D(), 30),
    y = new Path2D();
  (y.moveTo(a - s - 26, o + c + 22),
    y.lineTo(a - s - 12, o + c - 2),
    y.lineTo(a + s + 12, o + c - 2),
    y.lineTo(a + s + 26, o + c + 22),
    y.closePath());
  let b = (e) => {
      let t = new Path2D(),
        n = a + e * s;
      return (t.rect(e < 0 ? n - 24 : n - 8, o + l - 20, 32, 36), t);
    },
    x = e ? 0 : 0.085,
    S = e ? 0 : 14,
    C = new Path2D();
  {
    let e = o + u + 18,
      t = o + u - 62;
    (C.moveTo(a - 40, e),
      C.lineTo(a - 64, t),
      C.lineTo(a + 64, t),
      C.lineTo(a + 40, e),
      C.closePath());
  }
  let w = (e) => {
      (m.save(),
        m.translate(a, o + u - 20 + S),
        m.rotate(x),
        m.translate(-a, -(o + u - 20)),
        e(),
        m.restore());
    },
    T = e ? [60, 200, 255] : [255, 80, 36],
    E = e ? [210, 250, 255] : [255, 196, 130],
    D = m.createRadialGradient(a, o - 30, 10, a, o - 30, 300);
  if (
    (D.addColorStop(0, B(E, e ? 0.7 : 0.5)),
    D.addColorStop(0.35, B(T, 0.3)),
    D.addColorStop(0.75, B(T, 0.06)),
    D.addColorStop(1, B(T, 0)),
    (m.fillStyle = D),
    m.fillRect(0, 0, r, i),
    yield,
    e)
  )
    for (let [e, t, n] of [
      [0, 155, 38],
      [-17, 148, 34],
      [17, 148, 34],
      [-34, 140, 31],
      [34, 140, 31],
      [-52, 128, 27],
      [52, 128, 27],
      [-72, 112, 24],
      [72, 112, 24],
      [-100, 96, 21],
      [100, 96, 21],
      [-146, 72, 18],
      [146, 72, 18],
    ])
      pn(m, a, o + l + 8, (e * Math.PI) / 180, t + 30, n, !0);
  else {
    (m.save(), (m.globalCompositeOperation = `lighter`));
    for (let e = 0; e < 70; e++) {
      let t = G(e, 1, 9) * Math.PI * 2,
        n = 200 + G(e, 2, 9) * 230,
        r = a + Math.cos(t) * n * 1.2,
        i = o + Math.sin(t) * n * 0.5 - G(e, 3, 9) * 60,
        s = 0.8 + G(e, 4, 9) * 2.4,
        c = m.createRadialGradient(r, i, 0, r, i, s * 3);
      (c.addColorStop(0, `rgba(255,${(200 + G(e, 5, 9) * 50) | 0},140,.9)`),
        c.addColorStop(1, `rgba(255,90,30,0)`),
        (m.fillStyle = c),
        m.fillRect(r - s * 3, i - s * 3, s * 6, s * 6));
    }
    m.restore();
  }
  yield;
  let O = Math.round((s * 2 + 80) * 0.5 * t),
    k = Math.round((c - u + 110) * 0.5 * t),
    A = J(O, k),
    ee = A.getContext(`2d`, q),
    te = ee.createImageData(O, k),
    j = te.data,
    ne = St(O);
  for (let t = 0; t < k; t++) {
    for (let n = 0; n < O; n++) {
      let r = (n / O) * 9,
        i = (t / k) * 3.2,
        a = yt(r, i, h, 4),
        o = (t * O + n) * 4;
      if (e) {
        let e = Math.sin(r * 1.3 + i * 0.9 + a * 7.5),
          t = 1 - Y(0, 0.07, Math.abs(e)),
          n = Math.sin(r * 0.6 - i * 1.7 + yt(r * 2, i * 2, h + 5, 3) * 9),
          s = 1 - Y(0, 0.04, Math.abs(n)),
          c = z([214, 220, 226], [246, 247, 248], Y(0.3, 0.75, a));
        ((c = z(c, [132, 146, 164], t * 0.55)),
          (c = z(c, [205, 170, 102], s * 0.45)),
          (j[o] = c[0]),
          (j[o + 1] = c[1]),
          (j[o + 2] = c[2]));
      } else {
        let e = Y(0.55, 1, Math.sin(i * 14 + a * 5 + Math.sin(r * 0.7) * 1.2)),
          s = yt(r * 2.4, i * 2.4, h + 9, 3),
          c = G(n, t, h) > 0.94 ? -16 : G(n + 1, t, h) > 0.97 ? 14 : 0,
          l = 40 + a * 46 + e * 16 + c;
        ((j[o] = l * (1.06 + s * 0.18)),
          (j[o + 1] = l * 0.95),
          (j[o + 2] = l * 0.9));
      }
      j[o + 3] = 255;
    }
    t % ne === ne - 1 && (yield);
  }
  (ee.putImageData(te, 0, 0), yield);
  let N = a - s - 40,
    P = o + u - 70,
    F = s * 2 + 80,
    re = c - u + 110,
    I = (t) => {
      (m.save(),
        m.clip(t),
        (m.imageSmoothingQuality = `high`),
        m.drawImage(A, N, P, F, re));
      let n = m.createLinearGradient(0, o + u - 70, 0, o + c + 30);
      (n.addColorStop(0, e ? `rgba(255,255,255,.28)` : `rgba(255,200,170,.14)`),
        n.addColorStop(0.5, `rgba(0,0,0,0)`),
        n.addColorStop(1, e ? `rgba(20,40,70,.35)` : `rgba(0,0,0,.5)`),
        (m.fillStyle = n),
        m.fillRect(N, P, F, re),
        m.restore());
    },
    ie = e
      ? [`#fff4c8`, `#e2b35a`, `#8a5f1e`, `#f3cf7c`, `#5c3d10`]
      : [`#a39a93`, `#5b534e`, `#262220`, `#6e6560`, `#141110`],
    ae = () => {
      let e = m.createLinearGradient(0, o + u - 60, 0, o + c + 20);
      return (ie.forEach((t, n) => e.addColorStop(n / (ie.length - 1), t)), e);
    };
  (m.save(),
    (m.shadowColor = `rgba(0,0,0,.75)`),
    (m.shadowBlur = 44),
    (m.shadowOffsetY = 16),
    (m.fillStyle = `#0a0d12`),
    m.fill(_),
    m.restore(),
    I(y),
    (m.lineWidth = 3),
    (m.strokeStyle = ae()),
    m.stroke(y));
  for (let e of [-1, 1]) {
    let t = b(e);
    (I(t), (m.lineWidth = 3), (m.strokeStyle = ae()), m.stroke(t));
  }
  (I(_),
    yield,
    m.save(),
    m.clip(_),
    (m.lineWidth = 30),
    (m.strokeStyle = ae()),
    m.stroke(_),
    e ||
      ((m.globalCompositeOperation = `overlay`),
      (m.globalAlpha = 0.5),
      (m.lineWidth = 30),
      (m.strokeStyle = m.createPattern(en(), `repeat`)),
      m.stroke(_),
      (m.globalAlpha = 1),
      (m.globalCompositeOperation = `source-over`)),
    (m.lineWidth = 1.6),
    (m.strokeStyle = e ? `rgba(255,248,220,.75)` : `rgba(230,210,200,.4)`),
    m.stroke(g(new Path2D(), 4)));
  let L = m.createLinearGradient(0, o + u, 0, o + c);
  (L.addColorStop(0, e ? `rgba(255,255,255,.85)` : `rgba(235,215,205,.55)`),
    L.addColorStop(1, `rgba(255,255,255,0)`),
    (m.lineWidth = 3),
    (m.strokeStyle = L),
    m.stroke(g(new Path2D(), 17)),
    (m.lineWidth = 6),
    (m.strokeStyle = e ? `rgba(40,50,70,.28)` : `rgba(0,0,0,.5)`),
    m.stroke(g(new Path2D(), 25)),
    m.restore(),
    (m.lineWidth = 2),
    (m.strokeStyle = e ? `rgba(80,50,10,.85)` : `rgba(0,0,0,.8)`),
    m.stroke(g(new Path2D(), 15)),
    m.save(),
    m.clip(y),
    (m.fillStyle = ae()),
    m.fillRect(a - s - 40, o + c - 4, s * 2 + 80, 9),
    m.restore(),
    e ||
      (m.save(),
      m.clip(_),
      (m.lineWidth = 2.5),
      (m.strokeStyle = `rgba(255,110,40,.45)`),
      (m.shadowColor = `#ff5a1e`),
      (m.shadowBlur = 10),
      m.stroke(g(new Path2D(), 1, 1)),
      m.restore()));
  let oe = m.createRadialGradient(a, o - 10, 20, a, o, s);
  if (
    (e
      ? (oe.addColorStop(0, `#1d5188`),
        oe.addColorStop(0.55, `#0f2d52`),
        oe.addColorStop(1, `#07172b`))
      : (oe.addColorStop(0, `#26120e`),
        oe.addColorStop(0.55, `#140a08`),
        oe.addColorStop(1, `#080404`)),
    (m.fillStyle = oe),
    m.fill(v),
    m.save(),
    m.clip(v),
    e)
  ) {
    for (let e = 0; e < 160; e++) {
      let t = a + (G(e, 31, 3) - 0.5) * s * 2,
        n = o + u + G(e, 32, 3) * (c - u),
        r = G(e, 33, 3) ** 3;
      ((m.fillStyle = `rgba(190,235,255,${0.15 + r * 0.7})`),
        m.fillRect(t, n, 1 + r * 1.6, 1 + r * 1.6));
    }
    let e = m.createLinearGradient(0, o + u, 0, o + 10);
    (e.addColorStop(0, `rgba(120,220,255,.28)`),
      e.addColorStop(1, `rgba(120,220,255,0)`),
      (m.fillStyle = e),
      m.fillRect(a - s, o + u, s * 2, 140));
  } else {
    ((m.globalAlpha = 0.55),
      (m.globalCompositeOperation = `luminosity`),
      m.drawImage(A, N, P, F, re),
      (m.globalCompositeOperation = `source-over`),
      (m.globalAlpha = 1));
    let e = m.createRadialGradient(a, o + 8, 20, a, o + 8, 300);
    (e.addColorStop(0, `rgba(255,96,32,.34)`),
      e.addColorStop(0.5, `rgba(200,50,16,.12)`),
      e.addColorStop(1, `rgba(255,90,30,0)`),
      (m.fillStyle = e),
      m.fillRect(a - s, o + u, s * 2, c - u));
    let t = m.createLinearGradient(0, o + c - 70, 0, o + c);
    (t.addColorStop(0, `rgba(255,80,20,0)`),
      t.addColorStop(1, `rgba(255,110,40,.3)`),
      (m.fillStyle = t),
      m.fillRect(a - s, o + c - 70, s * 2, 70));
    let n = m.createLinearGradient(0, o + u, 0, o + 20);
    (n.addColorStop(0, `rgba(0,0,0,.55)`),
      n.addColorStop(1, `rgba(0,0,0,0)`),
      (m.fillStyle = n),
      m.fillRect(a - s, o + u, s * 2, 140));
    for (let e = 0; e < 70; e++) {
      let t = a + (G(e, 41, 7) - 0.5) * s * 1.9,
        n = o + u + 20 + G(e, 42, 7) * (c - u - 30),
        r = G(e, 43, 7) ** 4;
      ((m.fillStyle = `rgba(255,${(140 + r * 90) | 0},70,${0.12 + r * 0.6})`),
        m.fillRect(t, n, 1 + r * 1.4, 1 + r * 1.4));
    }
  }
  ((m.lineWidth = 16),
    (m.strokeStyle = `rgba(0,0,0,.45)`),
    m.stroke(v),
    m.restore());
  let se = m.createLinearGradient(0, o + u, 0, o + c);
  if (
    (se.addColorStop(0, e ? `rgba(255,225,150,.95)` : `rgba(40,24,18,.9)`),
    se.addColorStop(1, e ? `rgba(255,225,150,.75)` : `rgba(210,150,120,.6)`),
    (m.lineWidth = 2.5),
    (m.strokeStyle = se),
    m.stroke(v),
    (m.lineWidth = 1),
    (m.strokeStyle = e ? `rgba(255,240,200,.35)` : `rgba(255,140,80,.22)`),
    m.stroke(g(new Path2D(), 40)),
    yield,
    !e)
  ) {
    let e = new Path2D();
    (e.addPath(_),
      e.rect(a - d, o - f, d * 2, f * 2),
      m.save(),
      m.clip(e, `evenodd`));
    let t = [
      [a - s + 6, o + 30, -0.35, 7, 4.2],
      [a + s - 6, o - 16, Math.PI + 0.3, 7, 4],
      [a - 250, o + c - 2, -1.2, 5, 3.2],
      [a + 190, o + u + 14, 1.25, 4, 3],
      [a - 60, o + u - 2, 1.9, 3, 2.6],
      [a + 360, o + c, -1.9, 4, 3],
    ];
    for (let [e, n, r, i, a] of t) hn(m, e, n, r, i, a, h + (e | 0));
    m.restore();
  }
  w(() => {
    (m.save(),
      (m.shadowColor = `rgba(0,0,0,.7)`),
      (m.shadowBlur = 20),
      (m.shadowOffsetY = 8),
      (m.fillStyle = `#0a0d12`),
      m.fill(C),
      m.restore(),
      I(C),
      (m.lineWidth = 5),
      (m.strokeStyle = ae()),
      m.stroke(C),
      e
        ? gn(m, a, o + u - 24, 22, 32, [120, 230, 255], !0)
        : (gn(m, a, o + u - 24, 20, 30, [255, 96, 40], !1),
          m.save(),
          m.clip(C),
          hn(m, a - 56, o + u - 58, 0.95, 3, 2.4, 77),
          m.restore()));
  });
  for (let t of [-1, 1])
    gn(
      m,
      a + t * (s + 8),
      o + l - 2,
      9,
      13,
      e ? [120, 230, 255] : [255, 96, 40],
      e,
    );
  return (un.set(n, p), p);
}
function* fn(e = 1) {
  e = Math.round(M(e, 1, 2) * 4) / 4;
  let t = `shards|${e}`;
  if (un.has(t)) return un.get(t);
  let { W: n, H: r, cx: i, cy: a } = ln,
    o = J(n * e, r * e),
    s = o.getContext(`2d`);
  s.scale(e, e);
  for (let [e, t, n, r] of [
    [-500, -110, 0.5, 44],
    [490, -130, -0.4, 50],
    [-540, 60, 1.1, 30],
    [548, 30, -0.9, 34],
    [-360, -205, 0.2, 24],
    [372, -212, -0.3, 22],
  ])
    (mn(s, i + e, a + t, n, r, 23 + e), yield);
  return (un.set(t, o), o);
}
function pn(e, t, n, r, i, a, o) {
  (e.save(), e.translate(t, n), e.rotate(r));
  let s = -i,
    c = -i * 0.78;
  o && ((e.shadowColor = `rgba(90,210,255,.8)`), (e.shadowBlur = 18));
  let l = new Path2D();
  (l.moveTo(0, 0), l.lineTo(-a / 2, c), l.lineTo(0, s), l.closePath());
  let u = new Path2D();
  (u.moveTo(0, 0), u.lineTo(a / 2, c), u.lineTo(0, s), u.closePath());
  let d = e.createLinearGradient(-a, s, a, 0);
  (d.addColorStop(0, `#f2fdff`),
    d.addColorStop(0.5, `#8be4ff`),
    d.addColorStop(1, `#2a9fd6`),
    (e.fillStyle = d),
    e.fill(l),
    (e.shadowBlur = 0));
  let f = e.createLinearGradient(0, s, a, 0);
  (f.addColorStop(0, `#6ccff5`),
    f.addColorStop(0.6, `#3a86ae`),
    f.addColorStop(1, `#2f6f86`),
    (e.fillStyle = f),
    e.fill(u),
    (e.lineWidth = 1.5),
    (e.strokeStyle = `rgba(230,252,255,.8)`),
    e.beginPath(),
    e.moveTo(0, 0),
    e.lineTo(0, s),
    e.stroke(),
    (e.lineWidth = 1),
    (e.strokeStyle = `rgba(200,245,255,.5)`),
    e.beginPath(),
    e.moveTo(a / 2, c),
    e.lineTo(0, s),
    e.stroke(),
    (e.lineWidth = 1),
    (e.strokeStyle = `rgba(255,255,255,.7)`),
    e.beginPath(),
    e.moveTo(-a / 2, c),
    e.lineTo(0, s),
    e.stroke(),
    e.restore());
}
function mn(e, t, n, r, i, a) {
  (e.save(), e.translate(t, n), e.rotate(r));
  let o = [];
  for (let e = 0; e < 6; e++) {
    let t = (e / 6) * Math.PI * 2 + G(e, 3, a & 1023) * 0.5,
      n = i * (0.6 + G(e, 5, a & 1023) * 0.45);
    o.push([Math.cos(t) * n * 1.25, Math.sin(t) * n * 0.85]);
  }
  let s = [-i * 0.14, -i * 0.12],
    c = [-0.6, -0.8];
  (e.save(), (e.globalCompositeOperation = `lighter`));
  let l = e.createRadialGradient(0, i * 0.35, 0, 0, i * 0.35, i * 1.3);
  (l.addColorStop(0, `rgba(255,90,30,.45)`),
    l.addColorStop(1, `rgba(255,90,30,0)`),
    (e.fillStyle = l),
    e.fillRect(-i * 1.5, -i, i * 3, i * 2.6),
    e.restore(),
    (e.shadowColor = `rgba(0,0,0,.7)`),
    (e.shadowBlur = i * 0.4),
    (e.shadowOffsetY = i * 0.18));
  let u = new Path2D();
  (o.forEach(([e, t], n) => (n ? u.lineTo(e, t) : u.moveTo(e, t))),
    u.closePath(),
    (e.fillStyle = `#16110f`),
    e.fill(u),
    (e.shadowColor = `transparent`));
  for (let t = 0; t < 6; t++) {
    let [n, r] = o[t],
      [i, a] = o[(t + 1) % 6],
      l = (n + i) / 2 - s[0],
      u = (r + a) / 2 - s[1],
      d = Math.hypot(l, u) || 1,
      f = M((l / d) * c[0] + (u / d) * c[1], -1, 1),
      p = 30 + (f + 1) * 42,
      m = e.createLinearGradient(s[0], s[1], (n + i) / 2, (r + a) / 2);
    (m.addColorStop(
      0,
      `rgb(${(p * 0.8) | 0},${(p * 0.72) | 0},${(p * 0.68) | 0})`,
    ),
      m.addColorStop(
        1,
        `rgb(${(p * 1.08) | 0},${(p * 0.98) | 0},${(p * 0.92) | 0})`,
      ),
      e.beginPath(),
      e.moveTo(s[0], s[1]),
      e.lineTo(n, r),
      e.lineTo(i, a),
      e.closePath(),
      (e.fillStyle = m),
      e.fill(),
      (e.lineWidth = 1),
      (e.strokeStyle =
        f > 0.2
          ? `rgba(235,220,210,${0.25 + f * 0.45})`
          : f < -0.4
            ? `rgba(255,110,50,.55)`
            : `rgba(0,0,0,.35)`),
      e.beginPath(),
      e.moveTo(n, r),
      e.lineTo(i, a),
      e.stroke());
  }
  e.restore();
}
function hn(e, t, n, r, i, a, o) {
  let s = [[t, n]],
    c = t,
    l = n,
    u = r,
    d = o & 4095;
  for (let e = 0; e < i; e++) {
    u += (G(e, 7, d) - 0.5) * 1;
    let t = 20 + G(e, 8, d) * 30;
    ((c += Math.cos(u) * t), (l += Math.sin(u) * t), s.push([c, l]));
  }
  let f = (e) => {
    let t = [],
      n = [];
    for (let r = 0; r < s.length; r++) {
      let i = s[Math.max(0, r - 1)],
        o = s[Math.min(s.length - 1, r + 1)],
        c = o[0] - i[0],
        l = o[1] - i[1],
        u = Math.hypot(c, l) || 1,
        d = (a + (0.5 - a) * (r / (s.length - 1))) * e * 0.5;
      (t.push([s[r][0] - (l / u) * d, s[r][1] + (c / u) * d]),
        n.push([s[r][0] + (l / u) * d, s[r][1] - (c / u) * d]));
    }
    let r = new Path2D();
    t.forEach(([e, t], n) => (n ? r.lineTo(e, t) : r.moveTo(e, t)));
    for (let e = n.length - 1; e >= 0; e--) r.lineTo(n[e][0], n[e][1]);
    return (r.closePath(), r);
  };
  if (
    (e.save(),
    (e.fillStyle = `rgba(8,4,3,.92)`),
    e.fill(f(2.4)),
    (e.shadowColor = `#ff4a10`),
    (e.shadowBlur = 16),
    (e.fillStyle = `#ff6224`),
    e.fill(f(1)),
    (e.shadowBlur = 5),
    (e.fillStyle = `#ffdfa0`),
    e.fill(f(0.38)),
    e.restore(),
    i >= 4)
  ) {
    let [t, n] = s[Math.floor(i * 0.45)];
    hn(e, t, n, r + (G(1, 9, d) > 0.5 ? 0.9 : -0.9), 2, a * 0.45, o + 101);
  }
}
function gn(e, t, n, r, i, a, o) {
  let s = z(a, [255, 255, 255], 0.75),
    c = z(a, [8, 20, 40], 0.55);
  (e.save(),
    (e.shadowColor = B(a, o ? 0.95 : 0.8)),
    (e.shadowBlur = o ? 30 : 22));
  let l = new Path2D();
  (l.moveTo(t, n - i),
    l.lineTo(t + r, n),
    l.lineTo(t, n + i),
    l.lineTo(t - r, n),
    l.closePath(),
    (e.fillStyle = B(a, 1)),
    e.fill(l),
    (e.shadowBlur = 0));
  let u = (r, i, a, o, s) => {
    (e.beginPath(),
      e.moveTo(t, n),
      e.lineTo(r, i),
      e.lineTo(a, o),
      e.closePath(),
      (e.fillStyle = s),
      e.fill());
  };
  (u(t, n - i, t - r, n, B(s, 1)),
    u(t, n - i, t + r, n, B(z(a, s, 0.35), 1)),
    u(t - r, n, t, n + i, B(a, 1)),
    u(t + r, n, t, n + i, B(c, 1)),
    (e.lineWidth = 2),
    (e.strokeStyle = o ? `#f6d88a` : `#6b625c`),
    e.stroke(l),
    (e.fillStyle = `rgba(255,255,255,.85)`),
    e.beginPath(),
    e.ellipse(t - r * 0.35, n - i * 0.45, r * 0.16, i * 0.1, -0.6, 0, 6.283),
    e.fill(),
    e.restore());
}
var _n = new Map(),
  vn = (e) =>
    `#` +
    e
      .map((e) =>
        Math.max(0, Math.min(255, Math.round(e)))
          .toString(16)
          .padStart(2, `0`),
      )
      .join(``),
  yn = (e, t, n) => vn(z(R(e), R(t), n));
function bn(e, t = 1, n = 0.58) {
  let r = Math.round(100 * t),
    i = Math.round(100 * n * Math.min(1, t * 1.1)),
    a = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${r} 100' preserveAspectRatio='xMidYMid slice'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#fff7d6'/><stop offset='.46' stop-color='#f0c96a'/><stop offset='.54' stop-color='#a57a2c'/><stop offset='1' stop-color='#fbe3a0'/></linearGradient></defs><text x='${r / 2}' y='${100 * (t < 0.8 ? 0.42 : 0.5) + i * 0.35}' text-anchor='middle' font-family='Optima,Candara,Palatino Linotype,serif' font-weight='600' font-size='${i}' fill='url(#g)' stroke='rgba(20,12,4,.6)' stroke-width='${(i * 0.02).toFixed(2)}'>${e}</text></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(a)}")`;
}
function xn(e, t = 1) {
  let n = `c|${e}|${t}`;
  if (_n.has(n)) return _n.get(n);
  let r = Ue(e),
    i = t < 0.9 ? 34 : 42,
    a = `${bn(r.mono, t, t < 0.9 ? 0.5 : 0.62)}, radial-gradient(ellipse ${t < 0.9 ? `90% 60%` : `closest-side`} at 50% ${i}%, ${yn(r.accent, r.secondary, 0.5)} 0%, ${r.secondary} 22%, ${yn(r.primary, r.secondary, 0.25)} 52%, ${yn(r.primary, `#03060c`, 0.55)} 82%, #03060c 100%)`;
  return (_n.set(n, a), a);
}
function Sn(e, t = null, n = `center`) {
  let r = `d|${e}|${t}|${n}`;
  if (_n.has(r)) return _n.get(r);
  let i = t || yn(e, `#03050a`, 0.78),
    a = yn(e, `#05080f`, 0.45),
    o = yn(e, `#ffffff`, 0.7),
    s =
      n === `rim`
        ? `radial-gradient(circle closest-side, ${i} 0%, ${i} 52%, ${a} 76%, ${e} 90%, ${yn(e, `#000`, 0.4)} 100%)`
        : `radial-gradient(circle closest-side at 46% 42%, ${o} 0%, ${e} 16%, ${a} 46%, ${i} 78%, #02040a 100%)`;
  return (_n.set(r, s), s);
}
var Cn = (e, t) => {
    let n = zt(e, t);
    return Sn(n.tint, n.plate, e.slot === `W` ? `rim` : `center`);
  },
  wn = (e) => {
    let t = qt(e);
    return Sn(t.hex, t.plate, `center`);
  },
  Tn = (e) =>
    Sn(
      yn(pe[e.attackElement] || `#ffd36b`, `#9fb3c8`, 0.55),
      `#10151c`,
      `center`,
    ),
  En = () => Sn(`#7fd8ff`, `#04202e`, `rim`);
function Dn(e) {
  let t = `i|${e}`;
  if (_n.has(t)) return _n.get(t);
  let n = S[e] || { tier: 1 },
    [r] = Pt(e),
    i = n.tier >= 3 ? `#d8a94c` : n.tier === 2 ? `#b0784a` : `#8c9aab`,
    a = `radial-gradient(circle at 50% 50%, ${yn(r, `#ffffff`, 0.55)} 0%, ${r} 14%, ${yn(r, `#05070c`, 0.55)} 42%, #05070c 70%, rgba(5,7,12,0) 71%), linear-gradient(135deg, ${yn(i, `#fff`, 0.5)}, ${i} 45%, ${yn(i, `#000`, 0.6)})`;
  return (_n.set(t, a), a);
}
var On = (e) => Sn(pe[e] || `#9fb3c8`, null, `center`),
  kn = (e, t, n) => {
    let r = M((n - e) / (t - e), 0, 1);
    return r * r * (3 - 2 * r);
  },
  An = (e, t, n, r) => (
    (r[0] = e[0] + (t[0] - e[0]) * n),
    (r[1] = e[1] + (t[1] - e[1]) * n),
    (r[2] = e[2] + (t[2] - e[2]) * n),
    r
  ),
  Q = { canvas: null, draft: null },
  jn = 192,
  Mn = 768,
  $ = {
    wall: [30, 56, 36],
    wallHi: [74, 112, 58],
    wallEdge: [12, 22, 15],
    ground: [76, 112, 62],
    groundHi: [104, 138, 76],
    groundEdge: [24, 38, 26],
    lane: [150, 128, 92],
    laneHi: [184, 168, 128],
    base: [
      [160, 178, 200],
      [112, 70, 60],
    ],
    hue: [
      [54, 112, 200],
      [208, 96, 62],
    ],
    pit: [
      [70, 130, 152],
      [126, 96, 162],
    ],
    brush: [52, 92, 44],
  },
  Nn = 1.9,
  Pn = 46,
  Fn = 0.24,
  In = null;
function Ln(e, t) {
  if (!In) {
    In = new Float32Array(14641);
    let e = [];
    for (let t in i) {
      let n = i[t];
      for (let t = 0; t < n.length - 1; t++)
        e.push([n[t].x, n[t].y, n[t + 1].x, n[t + 1].y]);
    }
    for (let t = 0; t <= 120; t++)
      for (let n = 0; n <= 120; n++) {
        let r = 1e9;
        for (let i of e) r = Math.min(r, f(n, t, i[0], i[1], i[2], i[3]));
        In[t * 121 + n] = 1 - kn(c * 0.84, c * 1.04, r);
      }
  }
  let n = M(e, 0, 119.999),
    r = M(t, 0, 119.999),
    a = n | 0,
    o = r | 0,
    s = n - a,
    l = r - o,
    u = In[o * 121 + a],
    d = In[o * 121 + a + 1],
    p = In[(o + 1) * 121 + a],
    m = In[(o + 1) * 121 + a + 1];
  return u + (d - u) * s + (p - u) * l + (u - d - p + m) * s * l;
}
function Rn(e, t) {
  let n = r(e, t);
  return n >= 0 ? 0 : kn(0, 4, -n) * 0.7 + vt(e * 0.95, t * 0.95, 23) * 0.32;
}
function* zn(e) {
  let t = J(e, e),
    n = t.getContext(`2d`, { willReadFrequently: !0 }),
    i = n.createImageData(e, e),
    a = i.data,
    c = 120 / e,
    l = [0, 0, 0],
    d = [0, 0, 0],
    f = Math.max(1, Math.round(1200 / e));
  for (let t = 0; t < e; t++) {
    for (let n = 0; n < e; n++) {
      let i = (n + 0.5) * c,
        f = (t + 0.5) * c,
        p = r(i, f);
      if (p < 0) {
        let e = M(0.5 + (Rn(i + c, f + c) - Rn(i - c, f - c)) * 2.6, 0, 1),
          t = vt(i * 0.95, f * 0.95, 23);
        (An($.wall, $.wallHi, M(e * 0.78 + t * 0.22 - 0.08, 0, 1), l),
          An(l, $.wallEdge, (1 - kn(0, c * 1.2, -p)) * 0.7, l));
      } else {
        let e = yt(i * 0.09, f * 0.09, 3, 3),
          t = vt(i * 0.8, f * 0.8, 41);
        An($.ground, $.groundHi, M(e * 0.8 + t * 0.25, 0, 1), l);
        let n = Ln(i, f);
        if (n > 0.004) {
          let e = vt(i * 1.6, f * 1.6, 57);
          (An(
            $.lane,
            $.laneHi,
            M(kn(0.55, 1, n) * 0.6 + (e - 0.5) * 0.3, 0, 1),
            d,
          ),
            An(l, d, Math.min(1, n * 1.25), l));
        }
        for (let e = 0; e < u.length; e++) {
          let t = u[e],
            n = Math.hypot(i - t.x, f - t.y);
          n < t.radius &&
            An(
              l,
              $.base[t.team],
              (1 - kn(t.radius * 0.5, t.radius, n)) * 0.78,
              l,
            );
        }
        for (let e = 0; e < o.length; e++) {
          let t = o[e],
            n = Math.hypot(i - t.x, f - t.y);
          n < t.radius &&
            An(
              l,
              $.pit[t.id === `drake` ? 0 : 1],
              (1 - kn(t.radius * 0.5, t.radius, n)) * 0.5,
              l,
            );
        }
        for (let e = 0; e < s.length; e++) {
          let t = s[e],
            n = i - t.x,
            r = f - t.y;
          if (n > t.r || n < -t.r || r > t.r || r < -t.r) continue;
          let a = Math.hypot(n, r);
          a < t.r && An(l, $.brush, 0.72 * (1 - kn(t.r * 0.7, t.r, a)), l);
        }
        let a = r(i - Nn * 0.7, f - Nn * 0.7);
        (a < 0.6 && An(l, $.groundEdge, (1 - kn(-1.2, 0.6, a)) * 0.42, l),
          An(l, $.groundEdge, (1 - kn(c * 0.7, 1, p)) * 0.5, l));
      }
      for (let e = 0; e < u.length; e++) {
        let t = u[e],
          n = i - t.x,
          r = f - t.y,
          a = n * n + r * r;
        if (a >= 2116) continue;
        let o = 1 - kn(0, Pn, Math.sqrt(a));
        o > 0.002 && An(l, $.hue[t.team], o * o * Fn, l);
      }
      let m = (t * e + n) * 4;
      ((a[m] = l[0]), (a[m + 1] = l[1]), (a[m + 2] = l[2]), (a[m + 3] = 255));
    }
    t % f === f - 1 && (yield);
  }
  return (n.putImageData(i, 0, 0), yield, Bn(n, e), t);
}
function Bn(e, t) {
  let n = t / 120;
  (e.save(), (e.lineCap = `round`), (e.lineJoin = `round`));
  let r = (t) => {
    (e.beginPath(), e.moveTo(t[0].x * n, t[0].y * n));
    for (let r = 1; r < t.length; r++) e.lineTo(t[r].x * n, t[r].y * n);
  };
  for (let n in i)
    (r(i[n]),
      (e.lineWidth = Math.max(1.5, t * 0.0075)),
      (e.strokeStyle = `rgba(214, 200, 160, .16)`),
      e.stroke(),
      (e.lineWidth = Math.max(1, t * 0.0032)),
      (e.strokeStyle = `rgba(240, 232, 204, .14)`),
      e.stroke());
  e.restore();
  for (let t of a) {
    let r = e.createRadialGradient(
        t.x * n,
        t.y * n,
        0,
        t.x * n,
        t.y * n,
        t.radius * n * 1.6,
      ),
      i = t.team === 0 ? `126,200,255` : `255,132,96`;
    (r.addColorStop(0, `rgba(${i},.5)`),
      r.addColorStop(1, `rgba(${i},0)`),
      (e.fillStyle = r),
      e.beginPath(),
      e.arc(t.x * n, t.y * n, t.radius * n * 1.6, 0, 6.283),
      e.fill());
  }
  let o = e.createRadialGradient(t / 2, t / 2, t * 0.46, t / 2, t / 2, t * 0.8);
  (o.addColorStop(0, `rgba(0,0,0,0)`),
    o.addColorStop(1, `rgba(0,0,0,.14)`),
    (e.fillStyle = o),
    e.fillRect(0, 0, t, t));
}
function Vn(e, t) {
  let n = t / 120,
    r = d.a,
    i = d.b,
    a = i.x - r.x,
    o = i.y - r.y,
    s = -o / Math.hypot(a, o),
    c = a / Math.hypot(a, o),
    l = (e, t) => [(r.x + a * e + s * t) * n, (r.y + o * e + c * t) * n],
    u = () => {
      e.beginPath();
      let t = l(0, 0);
      e.moveTo(t[0], t[1]);
      for (let t = 1; t <= 4; t++) {
        let n = (t - 0.5) / 4,
          r = t / 4,
          i = l(n, (t % 2 ? 1 : -1) * 1.7),
          a = l(r, 0);
        e.quadraticCurveTo(i[0], i[1], a[0], a[1]);
      }
    };
  (e.save(),
    (e.lineCap = `round`),
    (e.lineJoin = `round`),
    u(),
    (e.lineWidth = d.halfWidth * 2 * n),
    (e.strokeStyle = `rgba(176, 222, 226, .38)`),
    e.stroke(),
    u(),
    (e.lineWidth = Math.max(1, (d.halfWidth * 2 - 1.6) * n)),
    (e.strokeStyle = `rgba(38, 112, 152, .92)`),
    e.stroke(),
    u(),
    (e.lineWidth = Math.max(1, d.halfWidth * 0.55 * n)),
    (e.strokeStyle = `rgba(128, 204, 226, .34)`),
    e.stroke(),
    e.restore());
}
function* Hn() {
  if (Q.canvas) return Q.canvas;
  if (Q.draft) return Q.draft;
  let e = yield* zn(jn);
  return ((Q.draft ||= e), Q.draft);
}
function* Un() {
  if (Q.canvas) return Q.canvas;
  let e = yield* zn(Mn);
  return ((Q.canvas ||= e), Q.canvas);
}
function Wn(t, n, r, i, a) {
  if ((t.beginPath(), n === e.TOWER))
    (t.moveTo(r, i - a * 1.28),
      t.lineTo(r + a * 0.96, i),
      t.lineTo(r, i + a * 1.28),
      t.lineTo(r - a * 0.96, i),
      t.closePath());
  else if (n === e.NEXUS) {
    for (let e = 0; e < 6; e++) {
      let n = Math.PI / 6 + (e * Math.PI) / 3,
        o = r + Math.cos(n) * a,
        s = i + Math.sin(n) * a;
      e ? t.lineTo(o, s) : t.moveTo(o, s);
    }
    t.closePath();
  } else t.arc(r, i, a, 0, 6.283);
}
var Gn = 0,
  Kn = 1,
  qn = 2,
  Jn = 2.6,
  Yn = 90,
  Xn = 6,
  Zn = 3.2,
  Qn = [
    { kind: `danger`, label: `Danger`, ring: `#ff5a4f` },
    { kind: `assist`, label: `On my way`, ring: `#6fd4ff` },
    { kind: `objective`, label: `Objective`, ring: `#e8b43c` },
  ],
  $n = class {
    constructor(e) {
      ((this.hud = e),
        (this.app = e.app),
        (this.tools = N(`div.mm-tools`)),
        (this.pingBtn = N(
          `button.mm-tool.mm-ping`,
          {
            type: `button`,
            "data-ping-arm": ``,
            "aria-label": `Ping (then tap the map)`,
          },
          N(`b`, { text: `PING` }),
        )),
        (this.recBtn = N(
          `button.mm-tool.mm-recenter`,
          {
            type: `button`,
            "data-recenter": ``,
            "aria-label": `Recentre the camera on your champion`,
          },
          N(`b`, { text: `CAM` }),
        )),
        this.tools.append(this.pingBtn, this.recBtn),
        (this.hint = N(`div.mm-hint`, { "aria-hidden": `true` })),
        (this.el = N(
          `div.sv-minimap`,
          { "data-minimap": `` },
          (this.bg = N(`canvas.mm-terrain`)),
          (this.mid = N(`canvas.mm-static`)),
          (this.fg = N(`canvas.mm-dyn`)),
          N(`div.mm-frame`),
          this.tools,
          this.hint,
        )),
        (this.g = this.fg.getContext(`2d`)),
        (this.gm = this.mid.getContext(`2d`)),
        (this.px = 0),
        (this.cs = 0),
        (this.sprites = new Map()),
        (this.epoch = 0),
        (this._pt = [
          { x: 0, y: 0 },
          { x: 0, y: 0 },
          { x: 0, y: 0 },
          { x: 0, y: 0 },
        ]),
        (this.fogT = 0),
        (this._fogTries = 0),
        (this.fogCv = null),
        (this.fogImg = null),
        (this.fogOn = !1),
        (this.painted = 0),
        (this.paintedFinal = !1),
        (this._cr = null),
        (this._crT = 0),
        (this.midSig = -1),
        (this.midEpoch = -1),
        (this.mkT = 0),
        (this.vt = -1),
        (this.pingArm = 0),
        (this.pingIdx = 0),
        (this.drag = !1),
        (this.dragId = -1),
        (this.lookT = 0),
        (this.looking = !1),
        (this.drove = !1),
        (this.pings = []),
        (this.now = 0),
        (this.hintT = 0),
        e.portraits.onChange((e, t) => {
          t !== `splash` && this.sprites.delete(e);
        }),
        this.bindInput());
    }
    me() {
      let e = this.app.world;
      return e ? e.units.get(this.app.playerId) : null;
    }
    rig() {
      let e = this.app.pipeline;
      return e && e.cameraRig ? e.cameraRig : null;
    }
    toWorld(e, t = { x: 0, y: 0 }) {
      let n = this.el.getBoundingClientRect();
      return (
        (t.x = M(((e.clientX - n.left) / Math.max(1, n.width)) * 120, 0, 120)),
        (t.y = M(((e.clientY - n.top) / Math.max(1, n.height)) * 120, 0, 120)),
        t
      );
    }
    bindInput() {
      let e = this.el,
        t = { x: 0, y: 0 };
      (this.pingBtn.addEventListener(`click`, (e) => {
        (e.stopPropagation(), this.armPing());
      }),
        this.recBtn.addEventListener(`click`, (e) => {
          (e.stopPropagation(), this.recenter());
        }),
        e.addEventListener(`contextmenu`, (e) => e.preventDefault()),
        e.addEventListener(`pointerdown`, (n) => {
          if (n.target.closest && n.target.closest(`.mm-tool`)) {
            n.stopPropagation();
            return;
          }
          if (this.app.state === `game` && this.app.world) {
            if (
              (n.preventDefault(),
              n.stopPropagation(),
              this.toWorld(n, t),
              this.pingArm > 0)
            ) {
              this.sendPing(t.x, t.y);
              return;
            }
            if (n.pointerType === `mouse` && n.button === 2) {
              this.order(t.x, t.y, n.shiftKey);
              return;
            }
            if (n.pointerType !== `mouse` || n.button === 0) {
              ((this.drag = !0),
                (this.dragId = n.pointerId),
                (this.dragT = this.now));
              try {
                e.setPointerCapture(n.pointerId);
              } catch {}
              this.look(t.x, t.y, !0);
            }
          }
        }),
        e.addEventListener(`pointermove`, (e) => {
          this.drag &&
            e.pointerId === this.dragId &&
            (e.preventDefault(),
            (this.dragT = this.now),
            this.toWorld(e, t),
            this.look(t.x, t.y, !1));
        }));
      let n = (e) => {
        e.pointerId === this.dragId &&
          ((this.drag = !1), (this.dragId = -1), (this.lookT = Jn));
      };
      (e.addEventListener(`pointerup`, n),
        e.addEventListener(`pointercancel`, n));
    }
    armPing() {
      ((this.pingArm = this.pingArm > 0 ? 0 : 6),
        this.pingArm > 0 && (this.pingIdx = (this.pingIdx + 1) % Qn.length),
        this.pingBtn.classList.toggle(`armed`, this.pingArm > 0),
        this.setHint(
          this.pingArm > 0 ? `${Qn[this.pingIdx].label} — tap the map` : ``,
        ));
    }
    sendPing(e, t) {
      let n = this.app.world,
        r = Qn[this.pingIdx];
      (n &&
        n.command(this.app.playerId, {
          type: `ping`,
          x: e,
          y: t,
          kind: r.kind,
        }),
        (this.pingArm = 0),
        this.pingBtn.classList.remove(`armed`),
        this.setHint(``));
    }
    order(e, t, n) {
      let r = this.app.world,
        i = this.me();
      r &&
        i &&
        (r.command(
          i.id,
          n ? { type: `attackMove`, x: e, y: t } : { type: `move`, x: e, y: t },
        ),
        this.setHint(n ? `Attack-move order` : `Move order`, 1.1));
    }
    look(e, t, n) {
      let r = this.rig();
      r &&
        (r.mode !== `free` && ((r.mode = `free`), (this.drove = !0)),
        r.setFocus(e, t, !!n),
        (this.looking = !0),
        (this.lookT = Jn),
        this.el.classList.add(`looking`),
        this.recBtn.classList.add(`on`));
    }
    recenter() {
      let e = this.rig();
      ((this.looking = !1),
        (this.lookT = 0),
        this.el.classList.remove(`looking`),
        this.recBtn.classList.remove(`on`),
        e && this.drove && e.mode === `free` && (e.mode = `follow`),
        (this.drove = !1));
      let t = this.me();
      e && t && e.mode === `free` && e.setFocus(t.x, t.y, !1);
    }
    setHint(e, t = 2.4) {
      ((this.hint.textContent = e || ``),
        this.hint.classList.toggle(`on`, !!e),
        (this.hintT = e ? t : 0));
    }
    reset() {
      ((this.drag = !1),
        (this.dragId = -1),
        (this.dragT = this.now),
        (this._fogTries = 0),
        (this.pings.length = 0),
        (this.pingArm = 0),
        this.pingBtn.classList.remove(`armed`),
        this.setHint(``),
        this.recenter(),
        (this.mkT = 0));
    }
    resize(e, t) {
      let n = Math.max(64, Math.round(e * t));
      if (n !== this.px) {
        ((this.px = n), (this.cs = Math.round(n * 0.078)));
        for (let e of [this.bg, this.mid, this.fg])
          ((e.width = n), (e.height = n));
        (this.sprites.clear(),
          this.epoch++,
          (this.painted = 0),
          (this.paintedFinal = !1),
          (this._cr = null),
          (this.midSig = -1),
          (this.mkT = 0),
          Q.canvas
            ? this.blit()
            : __mtLT.LEGACY && // [MT-HOOK] hudMinimap: mt hides the legacy minimap (mt/ui/minimap.js draws its own): no terrain bake for it
              (Q.draft && this.blitFrom(Q.draft, !1),
              this.hud.job(() => this.paintDraft(), null, 0),
              this.hud.job(() => this.paintFinal(), null, 1)));
      }
    }
    blitFrom(e, t) {
      if (!e || !this.px) return;
      let n = this.bg.getContext(`2d`);
      ((n.imageSmoothingEnabled = !0),
        (n.imageSmoothingQuality = `high`),
        n.clearRect(0, 0, this.px, this.px),
        n.drawImage(e, 0, 0, this.px, this.px),
        (this.painted = this.px),
        (this.paintedFinal = !!t),
        this.el.classList.add(`painted`));
    }
    blit() {
      Q.canvas
        ? this.blitFrom(Q.canvas, !0)
        : Q.draft && this.blitFrom(Q.draft, !1);
    }
    *paintDraft() {
      if (Q.canvas) {
        this.blit();
        return;
      }
      let e = yield* Hn();
      !Q.canvas && e && !this.paintedFinal && this.blitFrom(e, !1);
    }
    *paintFinal() {
      (yield* Un(),
        (!this.paintedFinal || this.painted !== this.px) && this.blit());
    }
    *paint() {
      (yield* this.paintDraft(), yield* this.paintFinal());
    }
    prebake() {
      return this.paint();
    }
    sprite(e, t) {
      let n = this.sprites.get(e);
      n || ((n = [null, null, null]), this.sprites.set(e, n));
      let r = n[t];
      if (r) return r;
      if (r === null) {
        n[t] = !1;
        let r = this.epoch,
          i = this.cs;
        this.hud.job(
          () => this.spriteGen(e, t, i),
          (e) => {
            e && r === this.epoch && ((n[t] = e), (this.mkT = 0));
          },
          1,
        );
      }
      return null;
    }
    *spriteGen(e, t, n) {
      let r = yield* this.hud.portraits.canvasArt(
          e,
          this.hud.porPx(),
          `square`,
        ),
        i = J(1, 1);
      i.width = i.height = n + Math.ceil(n * 0.22) * 2;
      let a = i.getContext(`2d`),
        o = i.width / 2,
        s = t === Gn ? `#f4d27a` : t === Kn ? ne.ally : ne.enemy;
      if (t === Gn) {
        let e = a.createRadialGradient(o, o, n * 0.4, o, o, o);
        (e.addColorStop(0, `rgba(255,220,120,.9)`),
          e.addColorStop(1, `rgba(255,220,120,0)`),
          (a.fillStyle = e),
          a.fillRect(0, 0, i.width, i.height));
      }
      return (
        a.beginPath(),
        a.arc(o, o, n / 2 + n * 0.12, 0, 6.283),
        (a.fillStyle = `#05080e`),
        a.fill(),
        a.save(),
        a.beginPath(),
        a.arc(o, o, n / 2, 0, 6.283),
        a.clip(),
        a.drawImage(r, o - n / 2, o - n / 2, n, n),
        a.restore(),
        a.beginPath(),
        a.arc(o, o, n / 2 + n * 0.03, 0, 6.283),
        (a.lineWidth = Math.max(1.5, n * 0.11)),
        (a.strokeStyle = s),
        a.stroke(),
        i
      );
    }
    canvasRect() {
      let e = performance.now();
      if (this._cr && e - this._crT < 1e3) return this._cr;
      let t = this.hud.app.pipeline,
        n = t && t.renderer && t.renderer.domElement,
        r = null;
      if (n && n.getBoundingClientRect) {
        let e = n.getBoundingClientRect();
        e.width > 1 &&
          e.height > 1 &&
          (r = { left: e.left, top: e.top, right: e.right, bottom: e.bottom });
      }
      if (!r && t && t.stats && t.stats.width > 1) {
        let e = t.stats.pixelRatio || devicePixelRatio || 1;
        r = {
          left: 0,
          top: 0,
          right: t.stats.width / e,
          bottom: t.stats.height / e,
        };
      }
      return (
        (r ||= { left: 0, top: 0, right: innerWidth, bottom: innerHeight }),
        (this._cr = r),
        (this._crT = e),
        r
      );
    }
    updateFog(e) {
      let t = e && e.vision;
      if (((this.fogOn = !!(t && t.data && e.fogOfWar !== !1)), !this.fogOn))
        return;
      let n = t.size;
      (!this.fogCv || this.fogCv.width !== n) &&
        ((this.fogCv = J(n, n)),
        (this.fogG = this.fogCv.getContext(`2d`)),
        (this.fogImg = this.fogG.createImageData(n, n)));
      let r = t.data,
        i = this.fogImg.data,
        a = n * n;
      for (let e = 0, t = 0; e < a; e++, t += 4)
        ((i[t] = 4),
          (i[t + 1] = 9),
          (i[t + 2] = 16),
          (i[t + 3] = (255 - r[e]) * 0.46));
      this.fogG.putImageData(this.fogImg, 0, 0);
    }
    drawMid(t, n) {
      let r = this.gm,
        i = this.px,
        a = i / 120;
      (r.clearRect(0, 0, i, i),
        Vn(r, i),
        this.fogOn &&
          this.fogCv &&
          ((r.imageSmoothingEnabled = !0), r.drawImage(this.fogCv, 0, 0, i, i)),
        this.drawCamps(r, i, a));
      let o = t.structures,
        s = Math.max(1, i * 0.0042);
      for (let t = 0; t < o.length; t++) {
        let c = o[t],
          l = c.x * a,
          u = c.y * a,
          d = c.team === n,
          f =
            (c.kind === e.NEXUS
              ? 0.019
              : c.kind === e.INHIBITOR
                ? 0.0125
                : 0.0118) * i;
        (Wn(r, c.kind, l, u, f),
          c.alive
            ? ((r.fillStyle = d ? `#2f7fc4` : `#c8463c`),
              r.fill(),
              (r.lineWidth = s),
              (r.strokeStyle = `rgba(3,7,12,.92)`),
              r.stroke(),
              r.save(),
              (r.globalAlpha = 0.85),
              (r.fillStyle = `rgba(4,9,15,.75)`),
              c.kind === e.TOWER
                ? (r.beginPath(),
                  r.moveTo(l, u - f * 0.5),
                  r.lineTo(l + f * 0.38, u),
                  r.lineTo(l, u + f * 0.5),
                  r.lineTo(l - f * 0.38, u),
                  r.closePath(),
                  r.fill())
                : c.kind === e.NEXUS
                  ? (Wn(r, e.NEXUS, l, u, f * 0.44), r.fill())
                  : (r.beginPath(),
                    r.arc(l, u, f * 0.44, 0, 6.283),
                    (r.lineWidth = Math.max(1, i * 0.0032)),
                    (r.strokeStyle = `rgba(4,9,15,.85)`),
                    r.stroke()),
              r.restore())
            : ((r.fillStyle = `rgba(30,36,44,.82)`),
              r.fill(),
              (r.lineWidth = s),
              (r.strokeStyle = d
                ? `rgba(70,128,188,.6)`
                : `rgba(186,86,76,.6)`),
              r.stroke()));
      }
    }
    drawCamps(e, t, n) {
      let r = Math.max(2, t * 0.0072);
      (e.save(), (e.lineWidth = Math.max(1, t * 0.003)));
      for (let t = 0; t < l.length; t++) {
        let i = l[t];
        i.epic ||
          (e.beginPath(),
          e.moveTo(i.x * n, i.y * n - r),
          e.lineTo(i.x * n + r * 0.92, i.y * n + r * 0.78),
          e.lineTo(i.x * n - r * 0.92, i.y * n + r * 0.78),
          e.closePath(),
          (e.fillStyle = `rgba(232, 180, 60, .34)`),
          e.fill(),
          (e.strokeStyle = `rgba(12, 10, 4, .7)`),
          e.stroke());
      }
      for (let r = 0; r < o.length; r++) {
        let i = o[r],
          a = i.x * n,
          s = i.y * n,
          c = Math.max(5, t * 0.019);
        e.beginPath();
        for (let t = 0; t < 6; t++) {
          let n = Math.PI / 6 + (t * Math.PI) / 3,
            r = a + Math.cos(n) * c,
            i = s + Math.sin(n) * c;
          t ? e.lineTo(r, i) : e.moveTo(r, i);
        }
        (e.closePath(),
          (e.fillStyle =
            i.id === `drake`
              ? `rgba(52, 116, 140, .62)`
              : `rgba(104, 74, 148, .62)`),
          e.fill(),
          (e.lineWidth = Math.max(1, t * 0.0038)),
          (e.strokeStyle = `rgba(4, 8, 14, .9)`),
          e.stroke(),
          (e.fillStyle = `rgba(244, 248, 255, .92)`),
          (e.textAlign = `center`),
          (e.textBaseline = `middle`),
          (e.font = `700 ${Math.max(7, Math.round(t * 0.026))}px "Avenir Next Condensed", "Avenir Next", system-ui, sans-serif`),
          e.fillText(i.id === `drake` ? `D` : `T`, a, s + c * 0.06));
      }
      e.restore();
    }
    drawMarkers(t, n) {
      let r = t.world,
        i = this.g,
        a = this.px,
        o = a / 120,
        s = t.viewerTeam;
      i.clearRect(0, 0, a, a);
      let c = Math.max(1, a * 0.0052),
        l = r.unitList;
      for (let t = 0; t < l.length; t++) {
        let n = l[t];
        if (n.alive && n.visible[s]) {
          if (n.kind === e.MINION)
            ((i.fillStyle = n.team === s ? `#2f86d4` : `#d4503f`),
              i.fillRect(n.x * o - c, n.y * o - c, c * 2, c * 2));
          else if (n.kind === e.MONSTER) {
            let e = n.epic ? a * 0.0155 : a * 0.009;
            (i.beginPath(),
              i.arc(n.x * o, n.y * o, e, 0, 6.283),
              (i.fillStyle = n.epic ? `#a67cf0` : ne.neutral),
              i.fill(),
              (i.lineWidth = Math.max(1, a * 0.0036)),
              (i.strokeStyle = `rgba(8,6,3,.9)`),
              i.stroke());
          }
        }
      }
      if (n && n.screenToGround) {
        let e = this.canvasRect(),
          t = e.left,
          r = e.top,
          s = e.right,
          c = e.bottom,
          l = this._pt;
        for (let e = 0; e < 4; e++) {
          let i = l[e];
          (n.screenToGround(e === 1 || e === 2 ? s : t, e >= 2 ? c : r, i),
            (i.x = M(i.x, 0, 120) * o),
            (i.y = M(i.y, 0, 120) * o));
        }
        (i.beginPath(),
          i.moveTo(l[0].x, l[0].y),
          i.lineTo(l[1].x, l[1].y),
          i.lineTo(l[2].x, l[2].y),
          i.lineTo(l[3].x, l[3].y),
          i.closePath(),
          (i.fillStyle = `rgba(255,255,255,.07)`),
          i.fill(),
          (i.lineWidth = Math.max(1.5, a * 0.006)),
          (i.strokeStyle = `rgba(8,12,18,.55)`),
          i.stroke(),
          (i.lineWidth = Math.max(1, a * 0.0035)),
          (i.strokeStyle = `rgba(255,255,255,.92)`),
          i.stroke());
      }
      let u = r.champions,
        d = this.cs,
        f = u.length;
      (!this.mx || this.mx.length < f) &&
        ((this.mx = new Float32Array(f)),
        (this.my = new Float32Array(f)),
        (this.mOn = new Uint8Array(f)));
      let p = this.mx,
        m = this.my,
        h = this.mOn;
      for (let e = 0; e < f; e++) {
        let t = u[e];
        ((h[e] = t.alive && (t.team === s || t.visible[s]) ? 1 : 0),
          (p[e] = t.x * o),
          (m[e] = t.y * o));
      }
      let g = d * 1.3;
      for (let e = 0; e < 4; e++)
        for (let e = 0; e < f; e++)
          if (h[e])
            for (let t = e + 1; t < f; t++) {
              if (!h[t]) continue;
              let n = p[t] - p[e],
                r = m[t] - m[e],
                i = Math.hypot(n, r);
              if (i >= g) continue;
              i < 1e-4 &&
                ((n = e % 2 ? 0.7071 : -0.7071),
                (r = t % 2 ? 0.7071 : -0.7071),
                (i = 1));
              let a = ((g - i) * 0.5) / i;
              ((p[e] -= n * a),
                (m[e] -= r * a),
                (p[t] += n * a),
                (m[t] += r * a));
            }
      for (let e = 0; e < 3; e++)
        for (let n = 0; n < f; n++) {
          if (!h[n]) continue;
          let r = u[n],
            a = r.id === t.playerId,
            o = r.team === s;
          if ((e === 0 && o) || (e === 1 && (!o || a)) || (e === 2 && !a))
            continue;
          let c = a ? Gn : o ? Kn : qn,
            l = this.sprite(r.champion, c),
            f = p[n],
            g = m[n];
          (a &&
            (i.beginPath(),
            i.arc(f, g, d * 0.5 + Math.max(2, d * 0.15), 0, 6.283),
            (i.fillStyle = `rgba(2,5,10,.75)`),
            i.fill()),
            l
              ? i.drawImage(l, f - l.width / 2, g - l.height / 2)
              : (i.beginPath(),
                i.arc(f, g, d * 0.5, 0, 6.283),
                (i.fillStyle = `#0b1420`),
                i.fill(),
                (i.lineWidth = Math.max(1.5, d * 0.12)),
                (i.strokeStyle =
                  c === Gn ? `#f4d27a` : c === Kn ? ne.ally : ne.enemy),
                i.stroke()));
        }
      this.drawPings(i, a, o);
    }
    drawPings(e, t, n) {
      let r = this.pings;
      if (r.length) {
        (e.save(), (e.lineCap = `round`));
        for (let i = 0; i < r.length; i++) {
          let a = r[i],
            o = this.now - a.t0,
            s = 1 - o / Zn;
          if (s <= 0) continue;
          let c = a.x * n,
            l = a.y * n,
            u = Math.max(4, t * 0.016);
          for (let n = 0; n < 2; n++) {
            let r = (o * 1.6 + n * 0.5) % 1;
            ((e.globalAlpha = s * (1 - r) * 0.95),
              (e.lineWidth = Math.max(1.5, t * 0.005)),
              (e.strokeStyle = a.ring),
              e.beginPath(),
              e.arc(c, l, u * (0.5 + r * 1.9), 0, 6.283),
              e.stroke());
          }
          ((e.globalAlpha = Math.min(1, s * 1.6)),
            e.beginPath(),
            e.arc(c, l, u * 0.42, 0, 6.283),
            (e.fillStyle = a.ring),
            e.fill(),
            (e.lineWidth = Math.max(1, t * 0.003)),
            (e.strokeStyle = `rgba(3,7,12,.9)`),
            e.stroke());
        }
        ((e.globalAlpha = 1), e.restore());
      }
    }
    tick(e) {
      let t = Math.max(0, e.dt);
      this.now = e.time;
      let n = e.events,
        r = e.viewerTeam;
      for (let t = 0; t < n.length; t++) {
        let i = n[t];
        if (i.type !== p.PING) continue;
        let a = Qn.find((e) => e.kind === i.kind) || Qn[0];
        i.team === r &&
          (this.pings.push({
            x: i.x,
            y: i.y,
            t0: e.time,
            ring: i.src === e.playerId ? `#f4d27a` : a.ring,
            kind: a.kind,
          }),
          this.pings.length > 12 && this.pings.shift(),
          (this.mkT = 0));
      }
      for (let t = this.pings.length - 1; t >= 0; t--)
        e.time - this.pings[t].t0 > Zn && this.pings.splice(t, 1);
      (this.pingArm > 0 &&
        ((this.pingArm -= t),
        this.pingArm <= 0 &&
          ((this.pingArm = 0),
          this.pingBtn.classList.remove(`armed`),
          this.setHint(``))),
        this.hintT > 0 &&
          ((this.hintT -= t), this.hintT <= 0 && this.setHint(``)),
        this.drag &&
          this.now - this.dragT > Xn &&
          ((this.drag = !1), (this.dragId = -1), (this.lookT = Jn)),
        this.looking &&
          !this.drag &&
          ((this.lookT -= t), this.lookT <= 0 && this.recenter()));
    }
    update(e, t) {
      let n = e.world,
        r = this.px;
      if (!r) return;
      let i = e.viewerTeam;
      (this.painted !== r || !this.paintedFinal) && Q.canvas && this.blit();
      let a = !1;
      this.fogT -= e.dt;
      let o = !this.fogOn && this._fogTries < Yn;
      (o && this._fogTries++,
        (this.fogT <= 0 || o) &&
          ((this.fogT = 0.25),
          this.updateFog(this.hud.app.pipeline),
          (a = !0)));
      let s = 0,
        c = n.structures;
      for (let e = 0; e < c.length; e++)
        c[e].alive && (s = (s ^ Math.imul(2654435761, e + 1)) | 0);
      ((s !== this.midSig || this.midEpoch !== this.epoch || i !== this.vt) &&
        ((this.midSig = s),
        (this.midEpoch = this.epoch),
        (this.vt = i),
        (a = !0)),
        a && this.drawMid(n, i),
        (this.mkT -= e.dt),
        this.mkT <= 0 && ((this.mkT = 1 / 30), this.drawMarkers(e, t)));
    }
  },
  er = [5, 9, 13],
  tr = (e, t) =>
    Array.isArray(e) ? e[Math.max(0, Math.min(e.length - 1, t - 1))] : e,
  nr = (e, t) =>
    t === `R`
      ? e.level >= 13
        ? 3
        : e.level >= 9
          ? 2
          : +(e.level >= 5)
      : Math.min(4, Math.ceil(e.level / 2));
function rr(e, t, n, r) {
  return n === `R` && nr(e, `R`) === 0
    ? `${t} unlocks at level ${er.find((t) => t > e.level) || 13}`
    : e.abilityPoints > 0
      ? `${t} not learned — press its + to spend a skill point`
      : r
        ? `${t} not learned — auto levelling ranked other abilities`
        : `${t} not learned — no skill point until you level up`;
}
var ir = (e, t) =>
    t === `R` && nr(e, `R`) === 0 ? er.find((t) => t > e.level) || 13 : 0,
  ar = {
    rooted: (e) => `Rooted — ${e} needs to move`,
    no_target: (e) => `${e} cannot strike that target`,
    no_champion: (e) => `${e} needs an enemy champion in reach`,
    no_room: (e) => `No room to land — aim ${e} at open ground`,
    buffer_lost: (e) => `Queued ${e} was lost`,
  };
function or(e, t, n) {
  let r = e && e.kit && e.kit.deny;
  return !r ||
    r.queued ||
    r.slot !== t ||
    !(n - r.t <= 0.033334333333333334) ||
    r.t > n + 1e-6
    ? null
    : r;
}
function sr(e, n, r, i = !1) {
  if (!e.alive) return `Cannot cast while dead`;
  let a = e.cc || {};
  if (a.stunUntil > r) return `Stunned — cannot cast`;
  if (a.airborneUntil > r) return `Knocked up — cannot cast`;
  let o = t.indexOf(n);
  if (o < 0) {
    let t = e.spells[+(n === `F`)];
    if (!t) return `Cannot cast right now`;
    let i = t.cdEnd - r;
    return i > 0
      ? `${he(t.id)} on cooldown — ${Math.ceil(i)}s`
      : t.id === `smite` || t.id === `ignite`
        ? `No target in range`
        : `Cannot cast right now`;
  }
  if ((a.silenceUntil || 0) > r) return `Silenced — cannot cast`;
  let s = e.abilities[o],
    c = e.def.abilities[o];
  if (!s || !c) return `Cannot cast right now`;
  let l = c.name || n,
    u = or(e, n, r);
  if (u)
    return ar[u.code]
      ? ar[u.code](l)
      : u.text || `${l} cannot be cast right now`;
  if (s.level === 0) return rr(e, l, n, i);
  let d = s.cdEnd - r;
  if (d > 0)
    return `${l} on cooldown — ${d < 1 ? d.toFixed(1) : Math.ceil(d)}s`;
  let f =
    e.resource === `mana` || e.resource === `energy`
      ? tr(c.cost || 0, s.level)
      : 0;
  return e.mana < f
    ? `Not enough ${e.resource === `energy` ? `energy` : `mana`} for ${l}`
    : c.type === `target`
      ? `No target in range`
      : `${l} cannot be cast right now`;
}
function cr(e, n) {
  let r = t.indexOf(n),
    i = r >= 0 && e && e.def ? e.def.abilities[r] : null,
    a = (i && i.name) || n,
    o = e && e.kit && e.kit.deny;
  return o && o.queued && o.slot === n && o.code === `walking`
    ? `${a} — moving into range`
    : `${a} queued — casts when the dash ends`;
}
function lr(e, n, r) {
  for (let e of t) r[e] = !1;
  let i = e && e.kit && e.kit.queued;
  if (!i || !e.alive) return 0;
  let a = 0;
  for (let e = 0; e < i.length; e++) {
    let t = i[e];
    t && t.slot in r && n < t.until && (r[t.slot] || a++, (r[t.slot] = !0));
  }
  return a;
}
var ur = new Set([`Tab`, `Escape`, `KeyM`, `KeyP`]),
  dr = (e, t) => (!!e && e.panel !== `none`) || !!t,
  fr = (e, t, n, r) => e === `game` && t && !ur.has(n) && !r;
function pr(e, t, n, r, i) {
  let a = e.left + t,
    o = e.right + t,
    s = 0;
  for (let t = 0; t < r; t++) {
    let r = n[t];
    if (
      !r ||
      r.width <= 0 ||
      r.bottom <= e.top ||
      r.top >= e.bottom ||
      r.right <= a ||
      r.left >= o
    )
      continue;
    let c = o - r.left + i;
    c > s && (s = c);
  }
  return Math.min(s, Math.max(0, a - i));
}
var mr = 8,
  hr = 3,
  gr = 10,
  _r = `moba.hud.v1`;
function vr() {
  try {
    return JSON.parse(localStorage.getItem(_r) || `{}`) || {};
  } catch {
    return {};
  }
}
function yr(e) {
  try {
    localStorage.setItem(_r, JSON.stringify(e));
  } catch {}
}
var br = {
    A: [196, 196, 204],
    Q: [506, 163, 132],
    W: [476, 333, 132],
    E: [361, 461, 132],
    R: [196, 508, 132],
    D: [390, 237, 92],
    F: [334, 338, 92],
    B: [230, 391, 92],
  },
  xr = class {
    constructor(e) {
      ((this.hud = e),
        (this.app = e.app),
        (this.el = N(`div.sv-game`)),
        (this.allies = N(`div.sv-allies`)),
        (this.score = N(
          `div.sv-score`,
          null,
          N(
            `div.sc-plate`,
            null,
            N(`i.sc-crest.sc-crest-blue`),
            (this.kBlue = N(`span.sc-k.sc-blue`, { text: `0` })),
            N(`span.sc-vs`, { text: `VS` }),
            (this.kRed = N(`span.sc-k.sc-red`, { text: `0` })),
            N(`i.sc-crest.sc-crest-red`),
          ),
          (this.timerEl = N(`div.sc-time`, { text: `00:00` })),
          (this.pauseBadge = N(
            `div.sc-paused`,
            { hidden: !0, role: `status` },
            N(`span`, { text: `Paused` }),
            N(`em`, { "data-kbd-hint": ``, text: `press M` }),
            N(`em`, { "data-touch-hint": ``, text: `tap MENU` }),
          )),
        )),
        (this.stats = N(
          `div.sv-stats`,
          null,
          N(
            `div.st-cell`,
            null,
            N(`span.st-lab`, { text: `KDA` }),
            (this.kdaEl = N(`span.st-val`, { text: `0/0/0` })),
          ),
          N(
            `div.st-cell`,
            null,
            N(`span.st-lab`, { text: `CS` }),
            (this.csEl = N(`span.st-val`, { text: `0` })),
          ),
          (this.sbBtn = N(
            `button.st-btn`,
            {
              type: `button`,
              "data-open-scoreboard": ``,
              "aria-label": `Scoreboard`,
            },
            N(`span.st-btnlab`, { text: `Scores` }),
            N(`i.st-chev`),
          )),
          (this.menuBtn = N(
            `button.st-btn.st-menu`,
            {
              type: `button`,
              "data-open-menu": ``,
              "aria-label": `Match menu and settings`,
            },
            N(`span.st-btnlab`, { text: `Menu` }),
          )),
        )),
        (this.showFps = !!(
          this.app.params &&
          this.app.params.get &&
          (this.app.params.get(`fps`) || this.app.params.get(`hudprof`))
        )),
        (this.sys = N(
          `div.sv-sys`,
          { "aria-hidden": `true`, hidden: this.showFps ? null : `` },
          N(`i.sy-dot`),
          (this.fpsEl = N(`span.sy-fps`, { text: `FPS 60` })),
        )),
        this.sbBtn.addEventListener(`click`, () =>
          this.app.fire(`ui`, {
            panel: this.app.ui.panel === `scoreboard` ? `none` : `scoreboard`,
          }),
        ),
        this.menuBtn.addEventListener(`click`, () => this.toggleMenu()),
        (this.goldBtn = N(
          `button.sv-gold`,
          { type: `button`, "data-open-shop": ``, "aria-label": `Open shop` },
          N(`span.gd-gem`),
          (this.goldEl = N(`span.gd-val`, { text: `0` })),
          N(`span.gd-lab`, { text: `SHOP` }),
        )),
        this.goldBtn.addEventListener(`click`, () => {
          this.app.ui.panel !== `shop` &&
            this.app.fire(`ui`, { panel: `shop` });
        }),
        (this.quick = N(
          `button.sv-quick`,
          {
            type: `button`,
            "data-quickbuy": ``,
            "aria-label": `Buy recommended item`,
          },
          (this.quickArt = N(`span.qb-art`)),
          N(`span.qb-lab`, { text: `NEXT` }),
          N(
            `span.qb-cap`,
            null,
            (this.quickName = N(`span.qb-name`, { text: `` })),
            (this.quickCost = N(`span.qb-cost`, { text: `` })),
          ),
        )),
        this.quick.addEventListener(`click`, () => this.quickBuy()),
        (this.invSlots = []),
        (this.inv = N(`div.sv-inv`, { "aria-label": `Items` })));
      for (let e = 0; e < 6; e++) {
        let t = N(`button.iv-slot.slot-empty`, {
          type: `button`,
          "data-inv": e,
          "data-n": e + 1,
          "aria-label": `Item slot ${e + 1}, empty`,
        });
        (t.addEventListener(`click`, () => {
          this.app.ui.panel !== `shop` &&
            this.app.fire(`ui`, { panel: `shop` });
        }),
          this.invSlots.push(t),
          this.inv.append(t));
      }
      let t = (e, t) =>
        N(
          `span.use-lab`,
          null,
          N(`b.ul-long`, { text: e }),
          N(`b.ul-short`, { text: t }),
        );
      ((this.potBtn = N(
        `button.sv-use.use-potion.empty`,
        {
          type: `button`,
          "data-use": `potion`,
          "aria-label": `Use consumable`,
        },
        N(`i.use-art`),
        (this.potNum = N(`b.use-n`, { text: `0` })),
        t(`Potion`, `HP`),
        N(`span.use-key`, { text: `1` }),
      )),
        (this.wardBtn = N(
          `button.sv-use.use-ward`,
          {
            type: `button`,
            "data-use": `ward`,
            "aria-label": `Place a ward at your feet`,
          },
          N(`i.use-art`),
          (this.wardBtnNum = N(`b.use-n`, { text: `0` })),
          t(`Ward`, `WARD`),
          N(`span.use-key`, { text: `4` }),
          (this.wardCd = N(`i.use-cd`)),
        )),
        this.potBtn.addEventListener(`click`, () => this.usePotion()),
        this.wardBtn.addEventListener(`click`, () => this.placeWard()),
        (this.uses = N(`div.sv-uses`, null, this.potBtn, this.wardBtn)),
        (this.econ = N(
          `div.sv-econ`,
          null,
          this.goldBtn,
          this.quick,
          this.inv,
          this.uses,
        )),
        (this.selfPor = N(
          `div.sf-por`,
          null,
          (this.selfLvl = N(`b.sf-lvl`, { text: `1` })),
        )),
        (this.selfHp = N(`i`)),
        (this.selfMp = N(`i`)),
        (this.selfHpTxt = N(`span.sf-num`)),
        (this.selfMpTxt = N(`span.sf-num.sf-mp`)),
        (this.selfEl = N(
          `div.sv-self`,
          { "aria-label": `Your health and resource` },
          this.selfPor,
          N(
            `div.sf-bars`,
            null,
            N(`div.sf-track.sf-hp`, null, this.selfHp, this.selfHpTxt),
            N(`div.sf-track.sf-mana`, null, this.selfMp, this.selfMpTxt),
          ),
        )),
        (this.joy = N(
          `div.sv-joystick`,
          { "data-joystick": `` },
          N(`div.js-ring`),
          N(`div.js-ticks`),
          N(`div.js-knob`, { "data-joystick-knob": `` }, N(`i.js-knobglass`)),
        )),
        (this.arcBg = N(`div.sv-arcbg`, { "aria-hidden": `true` })),
        (this.arc = N(`div.sv-arc`, null, this.arcBg)),
        (this.recall = this.makeButton(`B`, {
          cls: `ab-recall`,
          art: () => Yt(160),
          fb: En(),
          glyph: ``,
          key: `B`,
        })),
        (this.toastsEl = N(`div.sv-toasts`)),
        (this.tip = N(`div.sv-tooltip`, { hidden: !0, role: `tooltip` })),
        (this.deny = N(`div.sv-deny`, {
          role: `status`,
          "aria-live": `polite`,
        })),
        (this.denyT = 0),
        this.app.on(`denied`, (e) => {
          !this.hud.dead && e && e.slot && this.onDenied(e.slot);
        }),
        this.app.on(`queued`, (e) => {
          !this.hud.dead && e && e.slot && this.onQueued(e.slot);
        }),
        (this.qOut = { Q: !1, W: !1, E: !1, R: !1 }),
        (this.lostT = -1),
        (this.infoSlot = null),
        (this.death = N(
          `div.sv-death`,
          { hidden: !0 },
          N(`div.dt-veil`),
          N(
            `div.dt-box`,
            null,
            N(`div.dt-lab`, { text: `RESPAWNING IN` }),
            (this.deathNum = N(`div.dt-num`, { text: `0` })),
            (this.deathBy = N(`div.dt-by`)),
          ),
        )),
        (this.apChip = N(
          `div.sv-ap`,
          { role: `status` },
          (this.apNum = N(`b`, { text: `0` })),
          N(`span.ap-lab.ap-long`, { text: `SKILL POINT` }),
          N(`span.ap-lab.ap-short`, { text: `SKILL PT` }),
        )),
        (this.apDx = 0),
        (this.apT = 0),
        (this.cancel = N(
          `div.sv-cancel`,
          { "data-cancel-zone": ``, "aria-hidden": `true` },
          N(`i.cz-ring`),
          N(`b.cz-x`, { text: `×` }),
          N(`span.cz-lab`, { text: `CANCEL` }),
        )),
        this.buildMenu(),
        this.el.append(
          this.death,
          e.minimap.el,
          this.allies,
          this.score,
          this.stats,
          this.sys,
          this.econ,
          this.selfEl,
          this.joy,
          this.arc,
          this.apChip,
          this.cancel,
          this.deny,
          this.toastsEl,
          this.tip,
          this.menu,
        ),
        (this.buttons = {}),
        (this.matchWorld = null),
        (this.me = null),
        (this.tipTimer = 0),
        (this.tipSlot = null),
        (this.czSide = ``),
        (this.czT = 0),
        (this.setDeath = I(this.death, `on`)),
        (this.setDeathHidden = ie(this.death, `hidden`)),
        (this.recall.setProg = re(this.recall.el, `--rp`)),
        (this.recall.setRecalling = I(this.recall.el, `recalling`)),
        this.bindTooltip(this.recall.el, `B`),
        (this._onKey = (e) => this.onKey(e)),
        addEventListener(`keydown`, this._onKey));
    }
    onKey(e) {
      if (this.app.state !== `game` || e.metaKey || e.ctrlKey || e.altKey)
        return;
      let t = e.target,
        n = t && t.tagName;
      if (
        !(
          n === `INPUT` ||
          n === `TEXTAREA` ||
          n === `SELECT` ||
          (t && t.isContentEditable)
        )
      ) {
        if (
          e.code === `KeyM` &&
          !e.repeat &&
          (this.menuOpen || this.app.ui.panel === `none`)
        ) {
          (e.preventDefault(), this.toggleMenu());
          return;
        }
        this.menuOpen ||
          this.app.ui.panel !== `none` ||
          (e.code === `Digit1` || e.code === `Numpad1`
            ? (e.preventDefault(), this.usePotion())
            : (e.code === `Digit4` || e.code === `Numpad4`) &&
              (e.preventDefault(), this.placeWard()));
      }
    }
    makeButton(
      e,
      {
        cls: t = ``,
        art: n,
        fb: r = null,
        glyph: i = ``,
        key: a = e,
        ult: o = !1,
      } = {},
    ) {
      let s = br[e],
        c = N(
          `div.ab${t ? `.` + t : ``}${o ? `.ab-ult` : ``}`,
          {
            "data-slot": e,
            style: s
              ? { "--x": s[0] + `px`, "--y": s[1] + `px`, "--d": s[2] + `px` }
              : null,
          },
          N(`div.ab-shadow`),
          N(`div.ab-orb`),
          N(`div.ab-glyph`, { text: i }),
          N(`div.ab-gloss`),
          N(`div.ab-mana`),
          N(`div.ab-cd`),
          N(`div.ab-rim`),
          N(`div.ab-lockarc`, { "aria-hidden": `true` }),
          N(`div.ab-cdtext`),
          N(`div.ab-cost`),
          N(`div.ab-lock`),
          N(`div.ab-key`, { text: a }),
        ),
        l = {
          el: c,
          slot: e,
          cd: c.querySelector(`.ab-cd`),
          cdText: c.querySelector(`.ab-cdtext`),
        };
      return (
        (l.setCost = V(c.querySelector(`.ab-cost`))),
        (l.setCanLvl = I(c, `canlvl`)),
        (l.setLock = F(c.querySelector(`.ab-lock`))),
        n && this.hud.bg(c.querySelector(`.ab-orb`), n, r),
        (l.setP = re(l.cd, `--p`)),
        (l.setCdText = F(l.cdText)),
        (l.setCooling = I(c, `cooling`)),
        (l.setNoMana = I(c, `nomana`)),
        (l.setLocked = I(c, `locked`)),
        (l.setDisabled = I(c, `disabled`)),
        (l.setReady = I(c, `ready`)),
        (l.setQueued = I(c, `queued`)),
        (l.qHold = 0),
        (l.lastQ = -1),
        (l.lastS = -1),
        l
      );
    }
    build(e, n) {
      let r = e.units.get(n);
      if (
        ((this.matchWorld = e),
        (this.me = r),
        (this.arc.innerHTML = ``),
        this.arc.append(this.arcBg),
        (this.buttons = {}),
        !r)
      )
        return;
      let i = r.def,
        a = this.makeButton(`A`, {
          cls: `ab-attack`,
          art: () => Jt(r.def, 256),
          fb: Tn(r.def),
          glyph: ``,
          key: `SPACE`,
        });
      (this.arc.append(a.el),
        (this.buttons.A = a),
        t.forEach((e, t) => {
          let n = i.abilities[t],
            a = this.makeButton(e, {
              art: () => Ut(n, r.attackElement, 192),
              fb: Cn(n, r.attackElement),
              glyph: ``,
              ult: e === `R`,
            }),
            o = N(`div.ab-pips`),
            s = e === `R` ? 3 : 4;
          a.pips = [];
          for (let e = 0; e < s; e++) {
            let e = N(`i`);
            (o.append(e), a.pips.push(e));
          }
          (a.el.append(o), (a.lastRank = -1));
          let [c, l, u] = br[e],
            d = (u / 2 + 4) * Math.SQRT1_2;
          ((a.lv = N(
            `button.ab-lvl`,
            {
              type: `button`,
              "data-levelup": e,
              "aria-label": `Level up ${n.name}`,
              style: { "--x": c + d + `px`, "--y": l + d + `px` },
            },
            N(`span`, { text: `+` }),
          )),
            a.lv.addEventListener(`pointerdown`, (t) => {
              (t.stopPropagation(), t.preventDefault(), this.levelUp(e));
            }),
            (a.setLv = I(a.lv, `on`)),
            (a.def = n),
            this.arc.append(a.el, a.lv),
            (this.buttons[e] = a),
            this.bindTooltip(a.el, e));
        }),
        [`D`, `F`].forEach((e, t) => {
          let n = r.spells[t],
            i = n ? n.id : `flash`,
            a = this.makeButton(e, {
              cls: `ab-spell`,
              art: () => Xt(i, 160),
              fb: wn(i),
              glyph: ``,
            });
          ((a.spellId = i),
            this.arc.append(a.el),
            (this.buttons[e] = a),
            this.bindTooltip(a.el, e));
        }),
        this.arc.append(this.recall.el),
        (this.buttons.B = this.recall),
        (this.allies.innerHTML = ``),
        (this.allyViews = []));
      for (let t of e.champions) {
        if (t.team !== r.team || t.id === r.id) continue;
        let e = N(`div.al-por`);
        this.hud.por(e, t.champion);
        let n = {
          id: t.id,
          champ: t.champion,
          por: e,
          el: N(
            `div.al`,
            { title: `${t.name} — ${t.def.name}` },
            e,
            N(`div.al-ult`),
            N(`div.al-resp`),
            N(`div.al-lvl`),
            N(
              `div.al-gauge`,
              null,
              N(`div.al-bar`, null, N(`i`)),
              N(`div.al-mana`, null, N(`i`)),
            ),
          ),
        };
        ((n.hpBar = n.el.querySelector(`.al-bar i`)),
          (n.mpBar = n.el.querySelector(`.al-mana i`)),
          (n.lastHp = -1),
          (n.lastMp = -1),
          (n.setDead = I(n.el, `dead`)),
          (n.setResp = V(n.el.querySelector(`.al-resp`))),
          (n.setLvl = V(n.el.querySelector(`.al-lvl`))),
          (n.setUlt = I(n.el, `ult`)),
          this.allies.append(n.el),
          this.allyViews.push(n));
      }
      ((this.setKBlue = V(this.kBlue)),
        (this.setKRed = V(this.kRed)),
        (this.setTimer = F(this.timerEl)),
        (this.setCs = V(this.csEl)),
        (this.setFps = F(this.fpsEl)),
        (this.kdaKey = -1),
        (this.setGold = V(this.goldEl)),
        (this.setDeathNum = V(this.deathNum)),
        (this.itemSig = [0, 0, 0, 0, 0, 0, 0]),
        (this.nextId = null),
        (this.nextPrice = 0),
        (this.qbT = 0),
        (this.setQuickCost = V(this.quickCost)),
        (this.setGoldGlow = I(this.goldBtn, `afford`)),
        this.setDeathHidden(``),
        (this.setQuickOk = I(this.quick, `afford`)),
        (this.setQuickEmpty = I(this.quick, `empty`)),
        (this.quickId = void 0),
        (this.lastSec = -1),
        (this.fpsT = 0),
        (this.setDeathBy = null),
        (this.deathBy.textContent = ``),
        (this.lostT = r.kit && r.kit.deny ? r.kit.deny.t : -1));
      for (let e of this.invSlots)
        ((e._bgTok = -1),
          (e._bgFb = null),
          (e.style.backgroundImage = ``),
          e.classList.remove(`filled`),
          e.classList.add(`slot-empty`));
      ((this.toastsEl.innerHTML = ``),
        this.hideTip(),
        this.clearDeny(),
        this.closeMenu(),
        this.setPaused(!1),
        (this.hpKey = -1),
        (this.hpTxtKey = -1),
        (this.mpKey = -1),
        (this.mpTxtKey = -1),
        (this.wardCdKey = -1),
        (this.potNKey = -1),
        (this.wardNKey = -1),
        this.hud.por(this.selfPor, r.champion),
        (this.setSelfLvl = V(this.selfLvl)),
        (this.setSelfHp = re(this.selfHp, `--v`)),
        (this.setSelfMp = re(this.selfMp, `--v`)),
        (this.setSelfHpTxt = F(this.selfHpTxt)),
        (this.setSelfMpTxt = F(this.selfMpTxt)),
        (this.setSelfLow = I(this.selfEl, `low`)),
        (this.setSelfDead = I(this.selfEl, `dead`)),
        this.selfEl.classList.toggle(`no-mana`, !(r.maxMana > 0)),
        (this.setPotN = F(this.potNum)),
        (this.setPotEmpty = I(this.potBtn, `empty`)),
        (this.potId = void 0),
        (this.setWardN = F(this.wardBtnNum)),
        (this.setWardEmpty = I(this.wardBtn, `empty`)),
        (this.setWardCd = re(this.wardCd, `--p`)),
        (this.setApN = F(this.apNum)),
        (this.setApOn = I(this.apChip, `on`)),
        (this.lastAp = -1),
        this.setAutoLevel(this.prefAuto, !1, e),
        this.reportPreAssigned(r),
        (this._portraitHook ||= this.hud.portraits.onChange((e, t) => {
          if (t !== `splash`)
            for (let t of this.allyViews || [])
              t.champ === e && this.hud.por(t.por, e);
        })));
    }
    bindTooltip(e, t) {
      let n = 0,
        r = 0,
        i = 0,
        a = 0;
      (e.addEventListener(`pointerenter`, (e) => {
        e.pointerType === `mouse` &&
          (clearTimeout(this.tipTimer),
          (this.tipTimer = setTimeout(() => this.showTip(t), 220)));
      }),
        e.addEventListener(`pointerleave`, (e) => {
          e.pointerType === `mouse` &&
            (clearTimeout(this.tipTimer), this.hideTip());
        }),
        e.addEventListener(`pointerdown`, (e) => {
          if (e.pointerType === `mouse`) {
            (clearTimeout(this.tipTimer), this.hideTip());
            return;
          }
          ((r = e.clientX),
            (i = e.clientY),
            (n = performance.now()),
            clearTimeout(a),
            (a = setTimeout(() => {
              this.hud.root.hasAttribute(`data-aiming`) || this.showTip(t);
            }, 480)));
        }),
        e.addEventListener(`pointermove`, (e) => {
          e.pointerType !== `mouse` &&
            Math.hypot(e.clientX - r, e.clientY - i) > 14 &&
            clearTimeout(a);
        }));
      let o = () => {
        (clearTimeout(a),
          this.tipSlot === t &&
            performance.now() - n > 400 &&
            setTimeout(() => this.hideTip(), 900));
      };
      (e.addEventListener(`pointerup`, o),
        e.addEventListener(`pointercancel`, o));
    }
    showTip(e) {
      let n = this.app.world,
        r = n && n.units.get(this.app.playerId);
      if (!r) return;
      let i = ``;
      if (t.includes(e)) {
        let n = t.indexOf(e),
          a = r.def.abilities[n],
          o = r.abilities[n].level;
        i = `<div class="tt-head"><span class="tt-key">${e}</span><span class="tt-name">${P(a.name)}</span><span class="tt-rank">${o ? `Rank ${o}` : `Not learned`}</span></div>
        <div class="tt-meta"><span class="tt-type">${ze[a.type] || `Ability`}</span><span><b>${Ve(a, o)}</b> cooldown</span><span><b>${P(Be(a, o, r.resource))}</b></span></div>
        <div class="tt-desc">${Le(a, r.def.name, o, r)}</div>`;
      } else if (e === `D` || e === `F`) {
        let t = r.spells[e === `D` ? 0 : 1];
        if (!t) return;
        let n = w[t.id] || {};
        i = `<div class="tt-head"><span class="tt-key">${e}</span><span class="tt-name">${P(he(t.id))}</span><span class="tt-rank">Spell</span></div>
        <div class="tt-meta"><span><b>${n.cooldown || 0}s</b> cooldown</span></div><div class="tt-desc">${P((me[t.id] || {}).desc || ``)}</div>`;
      } else if (e === `B`)
        i = `<div class="tt-head"><span class="tt-key">B</span><span class="tt-name">Recall</span></div><div class="tt-meta"><span><b>${mr}s</b> channel</span></div><div class="tt-desc">Channel to return to your fountain. Taking damage or moving interrupts it.</div>`;
      else return;
      ((this.tip.innerHTML = i),
        (this.tip.hidden = !1),
        (this.tipSlot = e),
        this.tip.classList.remove(`on`),
        this.placeTip(e),
        requestAnimationFrame(() => this.tip.classList.add(`on`)));
    }
    hideTip() {
      (this.tip.classList.remove(`on`),
        (this.tip.hidden = !0),
        (this.tipSlot = null));
    }
    placeTip(e) {
      let t = this.hud,
        n = t.s || 1,
        r = t.H || innerHeight / n,
        i = this.tip,
        a = e === `B` ? this.recall.el : this.buttons[e] && this.buttons[e].el;
      if (!a) return;
      let o = a.getBoundingClientRect();
      (o.left + o.right) / 2 / n;
      let s = (o.top + o.bottom) / 2 / n,
        c = i.offsetWidth,
        l = i.offsetHeight,
        u = r - 14 - l,
        d = Math.min(u, Math.max(110, r * 0.6)),
        f = Math.max(d, Math.min(u, s - l / 2)),
        p,
        m = o.left / n,
        h = f - 8,
        g = f + l + 8;
      for (let e of this.arc.querySelectorAll(`.ab, .ab-lvl.on`)) {
        let t = e.getBoundingClientRect();
        t.bottom / n > h && t.top / n < g && (m = Math.min(m, t.left / n));
      }
      ((p = Math.max(16, m - 30 - c)),
        i.classList.remove(`notch-b`, `notch-l`),
        i.classList.add(`notch-r`),
        (i.style.left = p + `px`),
        (i.style.top = f + `px`),
        i.style.setProperty(
          `--ny`,
          Math.max(24, Math.min(l - 24, s - f)) + `px`,
        ));
    }
    onDenied(e) {
      let t = this.app.world,
        n = t && t.units.get(this.app.playerId);
      if (!n) return;
      let r = this.buttons[e];
      r &&
        (r.el.classList.remove(`denied`),
        r.el.offsetWidth,
        r.el.classList.add(`denied`),
        clearTimeout(r.denyT),
        (r.denyT = setTimeout(() => r.el.classList.remove(`denied`), 340)));
      let i = this.denyReason(n, e, t.time);
      i && this.deniedLine(i);
    }
    onQueued(e) {
      let t = this.app.world,
        n = t && t.units.get(this.app.playerId);
      if (!n) return;
      let r = this.buttons[e];
      (r &&
        r.setQueued &&
        ((r.qHold = performance.now() + 250),
        r.el.classList.remove(`denied`),
        r.setQueued(!0)),
        this.deniedLine(cr(n, e), `info`),
        (this.infoSlot = e));
    }
    deniedLine(e, t = `deny`) {
      e &&
        ((this.infoSlot = null),
        this.deny.classList.toggle(`info`, t === `info`),
        (this.deny.textContent = e),
        this.deny.classList.remove(`on`),
        this.deny.offsetWidth,
        this.deny.classList.add(`on`),
        clearTimeout(this.denyT),
        (this.denyT = setTimeout(
          () => this.deny.classList.remove(`on`),
          2200,
        )));
    }
    clearDeny() {
      (clearTimeout(this.denyT),
        this.deny.classList.remove(`on`),
        (this.deny.textContent = ``),
        (this.infoSlot = null));
    }
    denyReason(e, t, n) {
      return sr(e, t, n, this.prefAuto);
    }
    lockReason(e, t, n) {
      return rr(e, t, n, this.prefAuto);
    }
    lockLevel(e, t) {
      return ir(e, t);
    }
    buildMenu() {
      let e = vr();
      ((this.prefAuto = e.autoLevel === !0),
        (this.menuOpen = !1),
        (this.mLevel = this.seg(
          `Ability levelling`,
          [
            [`Manual`, !1],
            [`Auto`, !0],
          ],
          (e) => this.setAutoLevel(e, !0),
          `Rank 1 is pre-assigned at spawn`,
        )),
        (this.mCast = this.seg(
          `Ability casting`,
          [
            [`Quick`, `quick`],
            [`Indicator`, `indicator`],
            [`Normal`, `normal`],
          ],
          (e) => {
            let t = this.controls();
            (t && t.setCastMode && t.setCastMode(e), this.syncMenu());
          },
        )),
        (this.volVal = N(`b.gm-val`, { text: `100%` })));
      let t = (e) => {
        let t = this.audio();
        if (!t) return;
        let n = Math.max(
          0,
          Math.min(1, Math.round(((t.volumes.master ?? 1) + e) * 20) / 20),
        );
        (t.setVolume(`master`, n),
          n > 0 && t.muted && t.setMuted(!1),
          this.syncMenu());
      };
      ((this.muteBtn = N(
        `button.gm-btn`,
        { type: `button`, "data-mute": `` },
        N(`span`, { text: `Mute` }),
      )),
        this.muteBtn.addEventListener(`click`, () => {
          let e = this.audio();
          (e && e.setMuted(!e.muted), this.syncMenu());
        }));
      let n = N(
          `button.gm-step`,
          { type: `button`, "aria-label": `Volume down` },
          N(`span`, { text: `−` }),
        ),
        r = N(
          `button.gm-step`,
          { type: `button`, "aria-label": `Volume up` },
          N(`span`, { text: `+` }),
        );
      (n.addEventListener(`click`, () => t(-0.1)),
        r.addEventListener(`click`, () => t(0.1)),
        (this.mVol = N(
          `div.gm-row`,
          null,
          N(`span.gm-lab`, { text: `Master volume` }),
          N(`div.gm-ctl`, null, n, this.volVal, r, this.muteBtn),
        )),
        (this.fsBtn = N(
          `button.gm-btn.gm-wide`,
          { type: `button` },
          N(`span`, { text: `Fullscreen` }),
        )),
        this.fsBtn.addEventListener(`click`, () => {
          let e = this.controls();
          (e && e.toggleFullscreen && e.toggleFullscreen(),
            setTimeout(() => this.syncMenu(), 120));
        }),
        (this.pauseBtn = N(
          `button.gm-btn`,
          { type: `button`, "data-pause": `` },
          N(`span`, { text: `Pause` }),
        )),
        this.pauseBtn.addEventListener(`click`, () => {
          this.setPaused(!this.app.paused);
        }),
        (this.mPause = N(
          `div.gm-row`,
          null,
          N(`span.gm-lab`, { text: `Match clock` }),
          N(
            `div.gm-ctl`,
            null,
            (this.pauseVal = N(`b.gm-val`, { text: `Running` })),
            this.pauseBtn,
          ),
        )));
      let i = (e, t, n) =>
          N(
            `div.gm-key`,
            null,
            N(`span`, { text: e }),
            N(
              `em`,
              null,
              ...t.map((e) => N(`kbd`, { text: e })),
              n ? N(`i.gm-keynote`, { text: n }) : null,
            ),
          ),
        a = this.controls(),
        o = (a && a.levelUpModifier) || `Shift`;
      ((this.mKeys = N(
        `div.gm-keys`,
        { "data-kbd-hint": `` },
        i(`Move`, [`Right-click`], `or arrow keys`),
        i(`Stop`, [`S`]),
        i(`Attack nearest`, [`Space`]),
        i(`Last hit`, [`C`], `or Shift+Space`),
        i(`Attack move`, [`A`], `+ click`),
        i(`Attack turret`, [`T`]),
        i(`Abilities`, [`Q`, `W`, `E`, `R`]),
        i(`Level up`, [o, `Q W E R`], `or +`),
        i(`Summoner spells`, [`D`, `F`]),
        i(`Recall`, [`B`]),
        i(`Potion`, [`1`]),
        i(`Ward`, [`4`]),
        i(`Ping at cursor`, [`G`]),
        i(`Shop`, [`P`]),
        i(`Scores`, [`Tab`]),
        i(`This menu`, [`M`]),
      )),
        (this.mTouch = N(
          `div.gm-keys`,
          { "data-touch-hint": `` },
          i(`Move`, [`Drag the joystick`]),
          i(`Aim an ability`, [`Drag its button`]),
          i(`Cancel a cast`, [`Drag onto CANCEL`]),
          i(`Look around`, [`Drag the minimap`]),
          i(`Move there`, [`PING off, then map`]),
          i(`Ping`, [`PING, then the map`]),
          i(`Potion / Ward`, [`The two chips by your gold`]),
        )));
      let s = N(
        `button.gm-act.gm-resume`,
        { type: `button`, "data-gmenu-close": `` },
        N(`span`, { text: `Resume` }),
      );
      (s.addEventListener(`click`, () => this.closeMenu()),
        (this.leaveBtn = N(
          `button.gm-act.gm-leave`,
          { type: `button`, "data-leave-match": `` },
          (this.leaveLab = N(`span`, { text: `Leave Match` })),
        )),
        this.leaveBtn.addEventListener(`click`, () => {
          if (!this.leaveArmed) {
            this.armLeave(!0);
            return;
          }
          (this.armLeave(!1),
            this.setPaused(!1),
            this.closeMenu(),
            this.hud.screens.go(`menu`));
        }),
        (this.leaveArmed = !1),
        (this.leaveT = 0),
        (this.menu = N(
          `div.sv-gmenu`,
          { hidden: !0, role: `dialog`, "aria-label": `Match menu` },
          N(
            `div.gm-panel`,
            null,
            N(
              `header.gm-head`,
              null,
              N(`span.gm-title`, { text: `Match Menu` }),
              N(`span.gm-hint`, { text: `Tap outside to close` }),
            ),
            N(
              `div.gm-body`,
              null,
              this.mPause,
              this.mLevel.el,
              this.mCast.el,
              this.mVol,
              this.fsBtn,
              N(`div.gm-sub`, { text: `Controls` }),
              this.mKeys,
              this.mTouch,
            ),
            N(`footer.gm-foot`, null, s, this.leaveBtn),
          ),
        )),
        this.menu.addEventListener(`pointerdown`, (e) => {
          e.target === this.menu && this.closeMenu();
        }),
        this.menu.addEventListener(
          `pointerdown`,
          (e) => {
            this.leaveArmed &&
              !(e.target.closest && e.target.closest(`[data-leave-match]`)) &&
              this.armLeave(!1);
          },
          !0,
        ));
    }
    armLeave(e) {
      ((e = !!e),
        (e !== this.leaveArmed || e) &&
          ((this.leaveArmed = e),
          (this.leaveT = e ? hr : 0),
          this.leaveBtn &&
            (this.leaveBtn.classList.toggle(`armed`, e),
            (this.leaveLab.textContent = e ? `Confirm leave?` : `Leave Match`),
            this.leaveBtn.setAttribute(
              `aria-label`,
              e ? `Confirm leaving the match` : `Leave match`,
            ))));
    }
    setPaused(e) {
      ((e = !!e),
        this.app.setPaused ? this.app.setPaused(e) : (this.app.paused = e),
        this.syncPaused(),
        this.syncMenu());
    }
    syncPaused() {
      let e = !!this.app.paused;
      e !== this.pausedNow &&
        ((this.pausedNow = e),
        (this.pauseBadge.hidden = !e),
        this.hud.stage.classList.toggle(`paused`, e),
        this.hud.invalidateRects());
    }
    seg(e, t, n, r) {
      let i = t.map(([e, t]) => {
          let r = N(
            `button.gm-opt`,
            { type: `button`, role: `radio`, "aria-checked": `false` },
            N(`span`, { text: e }),
          );
          return ((r._v = t), r.addEventListener(`click`, () => n(t)), r);
        }),
        a = N(`span.gm-lab`, { text: e });
      return (
        r && a.append(N(`i.gm-note`, { text: r })),
        {
          el: N(
            `div.gm-row`,
            null,
            a,
            N(`div.gm-seg`, { role: `radiogroup`, "aria-label": e }, ...i),
          ),
          btns: i,
          set: (e) => {
            for (let t of i) {
              let n = t._v === e;
              (t.classList.toggle(`on`, n),
                t.setAttribute(`aria-checked`, String(n)));
            }
          },
        }
      );
    }
    controls() {
      let e = this.hud.registry;
      return e && e.get ? e.get(`controls`) : null;
    }
    audio() {
      let e = this.hud.registry;
      return e && e.get ? e.get(`audio`) : null;
    }
    toggleMenu() {
      this.app.fire(`ui`, { panel: this.menuOpen ? `none` : `menu` });
    }
    openMenu() {
      this.menuOpen ||
        ((this.menuOpen = !0),
        (this.menu.hidden = !1),
        this.syncMenu(),
        requestAnimationFrame(() => {
          this.menuOpen && this.menu.classList.add(`on`);
        }),
        this.hud.invalidateRects(),
        this.app.ui.panel !== `menu` && this.app.fire(`ui`, { panel: `menu` }));
    }
    closeMenu() {
      (this.menuOpen &&
        ((this.menuOpen = !1),
        this.menu.classList.remove(`on`),
        (this.menu.hidden = !0),
        this.armLeave(!1),
        this.hud.invalidateRects()),
        this.app.ui.panel === `menu` && this.app.fire(`ui`, { panel: `none` }));
    }
    syncMenu() {
      if (!this.menuOpen) return;
      let e = !!this.app.paused;
      ((this.pauseVal.textContent = e ? `Paused` : `Running`),
        this.pauseBtn.classList.toggle(`on`, e),
        (this.pauseBtn.firstChild.textContent = e ? `Resume clock` : `Pause`),
        this.mLevel.set(this.prefAuto));
      let t = this.controls();
      this.mCast.set(t && t.settings ? t.settings.castMode : `indicator`);
      let n = this.audio(),
        r = n ? (n.volumes.master ?? 1) : 1;
      ((this.volVal.textContent = n
        ? n.muted
          ? `Muted`
          : Math.round(r * 100) + `%`
        : `n/a`),
        this.muteBtn.classList.toggle(`on`, !!(n && n.muted)),
        (this.muteBtn.firstChild.textContent =
          n && n.muted ? `Unmute` : `Mute`),
        this.mVol.classList.toggle(`gm-off`, !n),
        (this.fsBtn.firstChild.textContent = document.fullscreenElement
          ? `Exit fullscreen`
          : `Fullscreen`));
    }
    setAutoLevel(e, t, n) {
      this.prefAuto = !!e;
      let r = vr();
      ((r.autoLevel = this.prefAuto), yr(r));
      let i = n || this.app.world;
      (i &&
        i.command(this.app.playerId, { type: `autoLevel`, on: this.prefAuto }),
        t &&
          this.toast(
            this.prefAuto ? `Auto levelling on` : `Manual levelling on`,
            `info`,
            null,
            this.prefAuto
              ? `Points spend themselves`
              : `Spend points with the + buttons`,
          ),
        this.syncMenu());
    }
    reportPreAssigned(e) {
      if (!e || this.prefAuto || e.level > 1 || (e.abilityPoints | 0) > 0)
        return;
      let t = e.abilities.findIndex((e) => e && e.level > 0);
      if (t < 0) return;
      let n = e.def.abilities[t];
      n &&
        this.toast(
          `${n.name} → rank ${e.abilities[t].level}`,
          `level`,
          null,
          `Auto levelled at spawn`,
        );
    }
    levelUp(e) {
      let n = this.app.world,
        r = n && n.units.get(this.app.playerId);
      if (!r || n.command(r.id, { type: `levelUp`, slot: e })) return;
      if (this.prefAuto) {
        this.deniedLine(`Auto levelling is on — turn it off in the Menu`);
        return;
      }
      let i = t.indexOf(e),
        a = r.abilities[i],
        o = r.def.abilities[i],
        s = nr(r, e);
      r.abilityPoints <= 0
        ? this.deniedLine(`No skill point — level up first`)
        : a.level >= s
          ? this.deniedLine(
              e === `R`
                ? `${o.name} unlocks rank ${a.level + 1} at level ${er[a.level] || 13}`
                : `${o.name} needs champion level ${a.level * 2 + 1}`,
            )
          : this.deniedLine(`${o.name} cannot be ranked up`);
    }
    usePotion() {
      let e = this.app.world,
        t = e && e.units.get(this.app.playerId);
      if (!t) return;
      let n = t.consumable;
      if (!n || !n.id || n.charges <= 0) {
        this.deniedLine(`No consumable — buy a Healing Draught in the shop`);
        return;
      }
      if (!t.alive) {
        this.deniedLine(`Cannot drink while dead`);
        return;
      }
      let r = n.id,
        i = S[r] ? S[r].name : `Potion`;
      if (!e.command(t.id, { type: `potion` })) {
        this.deniedLine(`${i} is already active`);
        return;
      }
      (this.toast(i, `buy`, () => X(r, 64), `Consumed`, Dn(r)),
        this.potBtn.classList.remove(`used`),
        this.potBtn.offsetWidth,
        this.potBtn.classList.add(`used`));
    }
    placeWard() {
      let e = this.app.world,
        t = e && e.units.get(this.app.playerId);
      if (t) {
        if (!t.ward || t.ward.charges <= 0) {
          let n = t.ward ? Math.max(0, Math.ceil(t.ward.cdEnd - e.time)) : 0;
          this.deniedLine(n ? `No ward charge — ${n}s` : `No ward charge`);
          return;
        }
        if (!t.alive) {
          this.deniedLine(`Cannot ward while dead`);
          return;
        }
        if (!e.command(t.id, { type: `ward`, x: t.x, y: t.y })) {
          this.deniedLine(`Cannot place a ward here`);
          return;
        }
        (this.wardBtn.classList.remove(`used`),
          this.wardBtn.offsetWidth,
          this.wardBtn.classList.add(`used`),
          this.hud.minimap.setHint(`Ward placed`, 1.4));
      }
    }
    quickBuy() {
      let e = this.app.world,
        t = e && e.units.get(this.app.playerId);
      if (!t) return;
      let n = we(t);
      if (!n) return;
      let r = S[n];
      if (t.gold < Te(t, n)) {
        this.toast(`Not enough gold for ${r.name}`, `warn`);
        return;
      }
      if (t.alive && !e.inFountain(t)) {
        this.toast(`Return to your fountain to buy items`, `warn`);
        return;
      }
      e.command(t.id, { type: `buy`, item: n }) !== !1 && this.buyToast(n);
    }
    levelToast(e, t) {
      let n = this.prefAuto
        ? `Auto levelling is on`
        : er.includes(t)
          ? `Ultimate rank available — press +`
          : `Skill point gained — press +`;
      this.toast(`Level ${t}`, `level`, null, n);
    }
    buyToast(e) {
      let t = performance.now();
      (this._lastBuy &&
        this._lastBuy.item === e &&
        t - this._lastBuy.t < 800) ||
        ((this._lastBuy = { item: e, t }),
        this.toast(S[e].name, `buy`, () => X(e, 64), `Purchased`));
    }
    toast(e, t = `info`, n = null, r = ``, i = null) {
      let a = N(
        `div.toast.toast-${t}`,
        null,
        n
          ? this.hud.bgEl(
              N(`span.toast-art`),
              n,
              i ||
                (t === `buy` && this._lastBuy ? Dn(this._lastBuy.item) : null),
            )
          : null,
        N(
          `div.toast-txt`,
          null,
          N(`b`, { text: e }),
          r ? N(`span`, { text: r }) : null,
        ),
      );
      for (this.toastsEl.append(a); this.toastsEl.children.length > 3; )
        this.toastsEl.firstChild.remove();
      (requestAnimationFrame(() => a.classList.add(`on`)),
        setTimeout(() => {
          (a.classList.remove(`on`),
            a.classList.add(`off`),
            setTimeout(() => a.remove(), 420));
        }, 2600));
    }
    update(e) {
      let n = e.world;
      (n !== this.matchWorld && this.build(n, e.playerId),
        this.syncPaused(),
        this.leaveArmed &&
          ((this.leaveT -= e.dt), this.leaveT <= 0 && this.armLeave(!1)));
      let r = n.units.get(e.playerId);
      if (!r) return;
      let i = n.time,
        a = e.viewerTeam,
        o = n.teamStats,
        s = e.events;
      for (let e = 0; e < s.length; e++) {
        let i = s[e];
        if (i.type === p.LEVEL_UP && i.id === r.id) this.levelToast(r, i.level);
        else if (i.type === p.LEVEL_ABILITY && i.id === r.id && this.prefAuto) {
          let e = r.def.abilities[t.indexOf(i.slot)];
          e &&
            this.toast(
              `${e.name} → rank ${i.level}`,
              `level`,
              null,
              `Auto levelled`,
            );
        } else if (i.type === p.BUY && i.id === r.id && S[i.item])
          this.buyToast(i.item);
        else if (i.type === p.KILL && i.victim === r.id) {
          let e = n.units.get(i.killer);
          this.deathBy.innerHTML = e
            ? `Slain by <b class="${e.team === a ? `ally` : `enemy`}">${P(se(e))}</b>`
            : ``;
        } else
          i.type === p.DEATH &&
            i.id === r.id &&
            i.killer < 0 &&
            (this.deathBy.textContent = `Executed`);
      }
      (this.setKBlue(o[a].kills), this.setKRed(o[1 - a].kills));
      let c = Math.floor(i);
      c !== this.lastSec && ((this.lastSec = c), this.setTimer(ae(c)));
      let l = r.kills * 1e6 + r.deaths * 1e3 + r.assists;
      (l !== this.kdaKey &&
        ((this.kdaKey = l),
        (this.kdaEl.textContent = `${r.kills}/${r.deaths}/${r.assists}`)),
        this.setCs(r.cs),
        (this.fpsT -= e.dt),
        this.fpsT <= 0 &&
          ((this.fpsT = 0.5),
          this.setFps(`FPS ` + Math.round(this.app.metrics.fps || 0))),
        this.setGold(Math.floor(r.gold)));
      let u = !1;
      for (let e = 0; e < 6; e++) {
        let t = r.items[e];
        if (this.itemSig[e] === t) continue;
        ((this.itemSig[e] = t), (u = !0));
        let n = this.invSlots[e];
        (t
          ? (this.hud.bg(n, () => X(t, 64), Dn(t)),
            (n.title = S[t] ? S[t].name : t),
            n.setAttribute(
              `aria-label`,
              `Item slot ${e + 1}, ${S[t] ? S[t].name : t}`,
            ))
          : ((n._bgTok = -1),
            (n._bgFb = null),
            (n.style.backgroundImage = ``),
            (n.title = `Empty slot`),
            n.setAttribute(`aria-label`, `Item slot ${e + 1}, empty`)),
          n.classList.toggle(`filled`, !!t),
          n.classList.toggle(`slot-empty`, !t));
      }
      let d = r.ward ? r.ward.charges | 0 : 0,
        f = r.consumable && r.consumable.charges > 0 ? r.consumable : null,
        m = f ? f.id : null;
      if (m !== this.potId) {
        if (((this.potId = m), m))
          this.hud.bg(
            this.potBtn.querySelector(`.use-art`),
            () => X(m, 64),
            Dn(m),
          );
        else {
          let e = this.potBtn.querySelector(`.use-art`);
          ((e._bgTok = -1), (e._bgFb = null), (e.style.backgroundImage = ``));
        }
        this.potBtn.title =
          m && S[m] ? S[m].name : `No consumable — buy one in the shop`;
      }
      let h = f ? f.charges | 0 : 0;
      (h !== this.potNKey && ((this.potNKey = h), this.setPotN(String(h))),
        this.setPotEmpty(!f),
        d !== this.wardNKey && ((this.wardNKey = d), this.setWardN(String(d))),
        this.setWardEmpty(d <= 0));
      let g =
          r.ward && r.ward.cdTotal > 0
            ? Math.max(0, Math.min(1, (r.ward.cdEnd - i) / r.ward.cdTotal))
            : 0,
        _ = Math.round(g * 1e3);
      _ !== this.wardCdKey &&
        ((this.wardCdKey = _), this.setWardCd(g.toFixed(3)));
      let v = r.alive ? r.abilityPoints | 0 : 0;
      (v !== this.lastAp &&
        ((this.lastAp = v),
        this.setApN(String(v)),
        this.setApOn(v > 0),
        this.apChip.classList.toggle(`many`, v > 1)),
        (this.qbT -= e.dt),
        (u || this.itemSig[6] !== r.champion || this.qbT <= 0) &&
          ((this.qbT = 0.5),
          (this.itemSig[6] = r.champion),
          (this.nextId = we(r)),
          (this.nextPrice = this.nextId ? Math.round(Te(r, this.nextId)) : 0)));
      let y = this.nextId;
      (y !== this.quickId &&
        ((this.quickId = y),
        this.setQuickEmpty(!y),
        y
          ? this.hud.bg(this.quickArt, () => X(y, 128), Dn(y))
          : ((this.quickArt._bgTok = -1),
            (this.quickArt.style.backgroundImage = `none`)),
        (this.quickName.textContent = y ? S[y].name : ``),
        (this.quick.title = y
          ? `${S[y].name} — ${be(y)
              .map((e) => e.join(` `))
              .join(`, `)}`
          : ``)),
        this.setQuickCost(y ? this.nextPrice : ``));
      let b = !!y && r.gold >= this.nextPrice;
      (this.setQuickOk(b),
        this.setGoldGlow(b && (!r.alive || n.inFountain(r))));
      for (let e of this.allyViews) {
        let t = n.units.get(e.id);
        if (!t) continue;
        e.setDead(!t.alive);
        let r = t.alive ? Math.round((t.hp / t.maxHp) * 100) : 0;
        (r !== e.lastHp &&
          ((e.lastHp = r), e.hpBar.style.setProperty(`--hp`, r / 100)),
          e.setLvl(t.level));
        let a =
          t.alive && t.maxMana > 0 ? Math.round((t.mana / t.maxMana) * 100) : 0;
        (a !== e.lastMp &&
          ((e.lastMp = a), e.mpBar.style.setProperty(`--mp`, a / 100)),
          e.setResp(t.alive ? `` : Math.max(0, Math.ceil(t.respawnAt - i))));
        let o = t.abilities[3];
        e.setUlt(t.alive && o && o.level > 0 && i >= o.cdEnd);
      }
      let x =
        !r.alive ||
        r.cc.stunUntil > i ||
        (r.cc.silenceUntil || 0) > i ||
        r.cc.airborneUntil > i;
      lr(r, i, this.qOut);
      let C = performance.now(),
        w = r.kit && r.kit.deny;
      if (w && w.code === `buffer_lost` && w.t !== this.lostT) {
        this.lostT = w.t;
        let e = this.buttons[w.slot];
        (e &&
          (e.el.classList.remove(`denied`),
          e.el.offsetWidth,
          e.el.classList.add(`denied`),
          clearTimeout(e.denyT),
          (e.denyT = setTimeout(() => e.el.classList.remove(`denied`), 340))),
          this.deniedLine(this.denyReason(r, w.slot, w.t)));
      }
      for (let e = 0; e < 4; e++) {
        let n = t[e],
          a = this.buttons[n];
        if (!a) continue;
        let o = r.abilities[e],
          s = a.def,
          c = o.cdEnd - i,
          l = o.level > 0 && c > 0,
          u = l && o.cdTotal > 0 ? Math.round((c / o.cdTotal) * 360) : 0;
        u !== a.lastQ && ((a.lastQ = u), a.setP((u / 360).toFixed(4)));
        let d = nr(r, n),
          f = r.alive && r.abilityPoints > 0 && o.level < d;
        (a.setLv(f), a.setCanLvl(f));
        let p = o.level === 0 && !f ? this.lockLevel(r, n) : 0,
          m = l
            ? c < 1
              ? -Math.ceil(c * 10)
              : Math.ceil(c)
            : p
              ? -1e3 - p
              : 0;
        if (m !== a.lastS) {
          a.lastS = m;
          let e = m < -999;
          (a.setCdText(
            e ? `` : m > 0 ? String(m) : m < 0 ? (-m / 10).toFixed(1) : ``,
          ),
            a.setLock(e ? String(-1e3 - m) : ``));
        }
        (a.setCooling(l), a.setLocked(o.level === 0));
        let h =
          r.resource === `mana` || r.resource === `energy`
            ? tr(s.cost || 0, Math.max(1, o.level))
            : 0;
        (a.setNoMana(o.level > 0 && r.mana < h),
          a.setDisabled(x),
          a.setCost(h),
          a.setReady(o.level > 0 && !l && r.mana >= h && !x));
        let g = this.qOut[n] || a.qHold > C;
        (a.setQueued(g),
          !g &&
            this.infoSlot === n &&
            ((this.infoSlot = null),
            clearTimeout(this.denyT),
            this.deny.classList.remove(`on`)),
          o.level !== a.lastRank &&
            ((a.lastRank = o.level),
            a.pips.forEach((e, t) => e.classList.toggle(`on`, t < o.level))));
      }
      for (let e = 0; e < 2; e++) {
        let t = e === 0 ? `D` : `F`,
          n = this.buttons[t],
          a = r.spells[e];
        if (!n || !a) continue;
        let o = a.cdEnd - i,
          s = o > 0,
          c = s && a.cdTotal > 0 ? Math.round((o / a.cdTotal) * 360) : 0;
        c !== n.lastQ && ((n.lastQ = c), n.setP((c / 360).toFixed(4)));
        let l = s ? Math.ceil(o) : 0;
        (l !== n.lastS && ((n.lastS = l), n.setCdText(l ? String(l) : ``)),
          n.setCooling(s),
          n.setDisabled(!r.alive),
          n.setReady(!s && r.alive));
      }
      let T = this.buttons.A;
      T && (T.setDisabled(x), T.setReady(!x));
      let E = this.recall,
        D = r.recallStart != null;
      (E.setRecalling(D),
        E.setProg(D ? Math.min(1, (i - r.recallStart) / mr).toFixed(3) : `0`),
        E.setDisabled(!r.alive));
      let O = r.maxHp > 0 ? Math.max(0, r.hp) / r.maxHp : 0,
        k = Math.round(O * 1e3);
      k !== this.hpKey && ((this.hpKey = k), this.setSelfHp(O.toFixed(3)));
      let A = Math.max(0, Math.round(r.hp)) * 1e5 + Math.round(r.maxHp);
      if (
        (A !== this.hpTxtKey &&
          ((this.hpTxtKey = A),
          this.setSelfHpTxt(
            `${Math.max(0, Math.round(r.hp))} / ${Math.round(r.maxHp)}`,
          )),
        r.maxMana > 0)
      ) {
        let e = Math.max(0, r.mana) / r.maxMana,
          t = Math.round(e * 1e3);
        t !== this.mpKey && ((this.mpKey = t), this.setSelfMp(e.toFixed(3)));
        let n = Math.max(0, Math.round(r.mana)) * 1e5 + Math.round(r.maxMana);
        n !== this.mpTxtKey &&
          ((this.mpTxtKey = n),
          this.setSelfMpTxt(
            `${Math.max(0, Math.round(r.mana))} / ${Math.round(r.maxMana)}`,
          ));
      }
      (this.setSelfLvl(r.level),
        this.setSelfLow(r.alive && O <= 0.3),
        this.setSelfDead(!r.alive),
        this.setDeath(!r.alive),
        this.setDeathHidden(r.alive ? `` : null),
        r.alive || this.setDeathNum(Math.max(0, Math.ceil(r.respawnAt - i))),
        this.placeCancelZone(r, e),
        this.placeSkillChip(e));
    }
    placeSkillChip(e) {
      if (
        ((this.apT -= e.dt),
        this.apT > 0 ||
          ((this.apT = 0.25), this.app.ui && this.app.ui.panel !== `none`))
      )
        return;
      let t = this.hud.s || 1,
        n = this.apChip.getBoundingClientRect();
      if (n.width <= 0) return;
      let r = this.controls(),
        i = r && r.uiRects ? Math.min(r.uiRectCount | 0, r.uiRects.length) : 0,
        a = Math.round(pr(n, this.apDx * t, i ? r.uiRects : null, i, gr) / t);
      a !== this.apDx &&
        ((this.apDx = a),
        (this.apChip.style.marginRight = a ? a + `px` : ``),
        this.hud.invalidateRects());
    }
    placeCancelZone(e, t) {
      if (((this.czT -= t.dt), this.czT > 0)) return;
      this.czT = 0.25;
      let n = this.controls();
      if (n && n.aim && n.aim.active) return;
      let r = this.app.pipeline && this.app.pipeline.cameraRig,
        i = `r`;
      if (r && r.worldToScreen && e) {
        let t = r.worldToScreen(e.x, (e.height || 2) * 0.9, e.y);
        if (t && t.visible !== !1) {
          let e = this.cancel.getBoundingClientRect();
          ((i = t.x < innerWidth * 0.5 ? `r` : `l`),
            e.width > 0 &&
              Math.abs((e.left + e.right) / 2 - t.x) < e.width &&
              Math.abs((e.top + e.bottom) / 2 - t.y) < e.height * 2.2 &&
              (i = i === `r` ? `l` : `r`));
        }
      }
      i !== this.czSide && ((this.czSide = i), (this.cancel.dataset.side = i));
    }
    dispose() {
      (removeEventListener(`keydown`, this._onKey),
        clearTimeout(this.denyT),
        clearTimeout(this.tipTimer));
    }
  },
  Sr = [``, `I`, `II`, `III`, `N`],
  Cr = class {
    constructor(e) {
      ((this.hud = e),
        (this.app = e.app),
        (this.banner = N(`div.sv-banner`)),
        (this.list = N(`div.sv-killfeed`)),
        (this.queue = []),
        (this.current = null),
        (this.t = 0));
    }
    clear() {
      ((this.queue.length = 0),
        (this.current = null),
        (this.banner.innerHTML = ``),
        (this.list.innerHTML = ``));
    }
    disc(t, n, r = !1, i = !1) {
      let a = `${r ? `fd-disc big` : `fd-disc`}${i ? ` victim` : ``}`;
      if (!t) return N(`span.${a.replace(/ /g, `.`)}.fd-none`);
      let o = t.team === 2 ? `neutral` : t.team === n ? `ally` : `enemy`;
      if (t.kind === e.CHAMPION) {
        let e = N(`span.${a.replace(/ /g, `.`)}.${o}`);
        return (this.hud.por(e, t.champion), e);
      }
      let s = ``,
        c = `steel`;
      t.kind === e.TOWER
        ? ((s = Sr[t.tier] || `T`), (c = t.team === 0 ? `storm` : `fire`))
        : t.kind === e.INHIBITOR
          ? ((s = `IN`), (c = t.team === 0 ? `frost` : `fire`))
          : t.kind === e.NEXUS
            ? ((s = `NX`), (c = t.team === 0 ? `storm` : `fire`))
            : t.kind === e.MONSTER
              ? ((s = oe(t.name || `M`)),
                (c =
                  t.subtype === `storm_drake`
                    ? `storm`
                    : t.subtype === `abyssal_tyrant`
                      ? `arcane`
                      : `nature`))
              : t.kind === e.MINION &&
                ((s = `MN`), (c = t.team === 0 ? `storm` : `fire`));
      let l = N(
        `span.${a.replace(/ /g, `.`)}.${o}.fd-crest`,
        null,
        N(`b`, { text: s }),
      );
      return (this.hud.bg(l, () => At(c, 96, K(s + c)), On(c)), l);
    }
    push(e) {
      (this.queue.push(e),
        this.queue.length > 4 && this.queue.splice(0, this.queue.length - 4));
    }
    onEvents(t) {
      let n = t.world,
        r = t.viewerTeam,
        i = t.events;
      for (let t = 0; t < i.length; t++) {
        let a = i[t];
        if (a.type === p.ANNOUNCE) this.announce(a, n, r);
        else if (a.type === p.KILL)
          this.killRow(
            n.units.get(a.killer),
            n.units.get(a.victim),
            a.assists ? a.assists.length : 0,
            r,
          );
        else if (a.type === p.STRUCTURE_DESTROYED) {
          let e = n.units.get(a.killer);
          this.killRow(e, n.units.get(a.id), 0, r, e ? null : 1 - a.team);
        } else if (a.type === p.OBJECTIVE) {
          let t = n.units.get(a.killer);
          this.killRow(
            t,
            {
              kind: e.MONSTER,
              team: 2,
              name: a.key === `drake` ? `Storm Drake` : `Abyssal Tyrant`,
              subtype: a.key === `drake` ? `storm_drake` : `abyssal_tyrant`,
            },
            0,
            r,
          );
        }
      }
    }
    announce(t, n, r) {
      if (t.key === `victory`) return;
      let i = t.actor != null && t.actor >= 0 ? n.units.get(t.actor) : null,
        a = t.victim == null ? null : n.units.get(t.victim),
        o = t.team === 2 ? `neutral` : t.team === r ? `ally` : `enemy`,
        s = t.text || ``,
        c = t.sub || ``,
        l = se,
        u = a && a.id === this.app.playerId;
      switch (t.key) {
        case `kill`:
          s = u
            ? `You Were Slain`
            : o === `ally`
              ? `Enemy Slain`
              : `Ally Slain`;
          break;
        case `turret`:
          s = o === `ally` ? `Enemy Turret Destroyed` : `Ally Turret Destroyed`;
          break;
        case `first_turret`:
          s = `First Turret Destroyed`;
          break;
        case `inhibitor`:
          s =
            o === `ally`
              ? `Enemy Inhibitor Destroyed`
              : `Ally Inhibitor Destroyed`;
          break;
        case `ace`:
          ((s = o === `ally` ? `Ace` : `Your Team Was Aced`),
            (c =
              o === `ally`
                ? `Every enemy champion has fallen`
                : `Hold the line until they respawn`));
          break;
        case `executed`:
          s = `Executed`;
      }
      !c && i && a && a.kind === `champion`
        ? (c = u ? `${l(i)} has slain you` : `${l(i)} has slain ${l(a)}`)
        : !c &&
            (t.key === `turret` ||
              t.key === `first_turret` ||
              t.key === `inhibitor`)
          ? (c = i
              ? `Destroyed by ${l(i)}`
              : `${o === `ally` ? `Your` : `Enemy`} minions broke through`)
          : !c && i && /drake|tyrant/.test(t.key || ``)
            ? (c = `${o === `ally` ? `Your team` : `The enemy team`} claimed the buff`)
            : !c &&
              /_spawn$/.test(t.key || ``) &&
              (c = `Rally your team to contest it`);
      let d = i,
        f = a;
      (!d &&
        /_spawn$/.test(t.key || ``) &&
        (d = {
          kind: e.MONSTER,
          team: 2,
          name: s.replace(/ has spawned/i, ``),
          subtype: /drake/.test(t.key) ? `storm_drake` : `abyssal_tyrant`,
        }),
        this.push({
          title: s,
          sub: c,
          rel: u ? `self` : o,
          left: d,
          right: f,
          vt: r,
          key: t.key,
        }));
    }
    killRow(e, t, n, r, i) {
      if (!t) return;
      let a = N(
        `div.kf-row${t.id === this.app.playerId || (e && e.id === this.app.playerId) ? `.self` : ``}`,
        { title: `${e ? se(e) : `Minions`} → ${se(t)}` },
        e
          ? this.disc(e, r)
          : N(
              `span.fd-disc.fd-team.` + (i === r ? `ally` : `enemy`),
              null,
              N(`b`, { text: `MN` }),
            ),
        N(`span.kf-blade.` + ((e ? e.team : i) === r ? `ally` : `enemy`)),
        this.disc(t, r),
        n > 0 ? N(`span.kf-ast`, { text: `+${n}` }) : null,
      );
      for (this.list.prepend(a); this.list.children.length > 5; )
        this.list.lastChild.remove();
      (requestAnimationFrame(() => a.classList.add(`on`)),
        setTimeout(() => {
          (a.classList.add(`off`), setTimeout(() => a.remove(), 500));
        }, 7e3));
    }
    update(e) {
      if ((this.onEvents(e), this.current)) {
        if (((this.t -= e.dt), this.t <= 0)) {
          let e = this.current;
          (e.classList.remove(`on`),
            e.classList.add(`off`),
            setTimeout(() => e.remove(), 520),
            (this.current = null),
            (this.t = 0.18));
        }
      } else if (this.t > 0) this.t -= e.dt;
      else if (this.queue.length) {
        let e = this.queue.shift(),
          t = N(
            `div.ann.ann-${e.rel}${e.key === `ace` ? `.ann-ace` : ``}`,
            null,
            N(`div.ann-glow`),
            N(`div.ann-band`),
            N(
              `div.ann-row`,
              null,
              e.left ? this.disc(e.left, e.vt, !0) : null,
              e.left && e.right
                ? N(
                    `span.kf-blade.ann-blade.` +
                      (e.rel === `ally` ? `ally` : `enemy`),
                  )
                : null,
              N(
                `div.ann-text`,
                null,
                N(`div.ann-title`, { text: e.title }),
                e.sub ? N(`div.ann-sub`, { text: e.sub }) : null,
              ),
              e.right ? this.disc(e.right, e.vt, !0, !0) : null,
            ),
            N(`div.ann-line`),
          );
        (this.banner.append(t),
          requestAnimationFrame(() =>
            requestAnimationFrame(() => t.classList.add(`on`)),
          ),
          (this.current = t),
          (this.t = this.queue.length > 1 ? 1.7 : 2.8));
      }
    }
  },
  wr = {
    "Attack Damage": `AD`,
    "Ability Power": `AP`,
    "Attack Speed": `AS`,
    "Critical Rate": `Crit`,
    "Critical Damage": `Crit Dmg`,
    "Magic Resist": `MR`,
    "Ability Haste": `Haste`,
    "Move Speed": `MS`,
    "Physical Vamp": `Vamp`,
    "Health Regen": `HP Regen`,
    "Mana Regen": `MP Regen`,
    "Magic Penetration": `M Pen`,
    "Armor Penetration": `Armor Pen`,
  },
  Tr = (e) =>
    e
      .slice(0, 4)
      .map(([e, t]) =>
        N(`span.sh-chip`, null, N(`b`, { text: e }), ` ` + (wr[t] || t)),
      ),
  Er = [
    [`recommended`, `Recommended`],
    [`physical`, `Physical`],
    [`magic`, `Magic`],
    [`defense`, `Defense`],
    [`boots`, `Boots`],
  ],
  Dr = { 1: `Basic`, 2: `Upgraded Boots`, 3: `Legendary` },
  Or = class {
    constructor(e) {
      ((this.hud = e),
        (this.app = e.app),
        (this.cat = `recommended`),
        (this.sel = null),
        (this.cards = new Map()),
        (this.sig = [-1, -1, ``, ``, ``, ``, ``, ``]),
        (this.forceSig = !0),
        (this.el = N(`div.sv-shop`, {
          hidden: !0,
          role: `dialog`,
          "aria-label": `Shop`,
        })),
        this.el.addEventListener(`pointerdown`, (e) => {
          e.target === this.el && this.close();
        }),
        (this.rail = N(`nav.sh-rail`)));
      for (let [e, t] of Er) {
        let n = N(
          `button.sh-cat`,
          { type: `button`, "data-cat": e },
          N(`span`, { text: t }),
        );
        (n.addEventListener(`click`, () => {
          ((this.cat = e), this.renderList());
        }),
          this.rail.append(n));
      }
      ((this.list = N(`div.sh-list`)),
        (this.more = N(
          `div.sh-more`,
          { "aria-hidden": `true` },
          (this.moreLab = N(`span`, { text: `More below` })),
          N(`i.sh-morechev`),
        )),
        this.more.addEventListener(`click`, () =>
          this.list.scrollBy({
            top: this.list.clientHeight * 0.8,
            behavior: `smooth`,
          }),
        ),
        (this.listWrap = N(`div.sh-listwrap`, null, this.list, this.more)),
        this.list.addEventListener(`scroll`, () => this.syncScroll(), {
          passive: !0,
        }),
        (this.detail = N(`aside.sh-detail`)),
        (this.inv = N(`div.sh-inv`)),
        (this.goldEl = N(`span.sh-goldval`, { text: `0` })),
        (this.setGold = V(this.goldEl)),
        (this.msg = N(`div.sh-msg`)));
      let t = N(
        `button.sh-close`,
        { type: `button`, "data-close-panel": `` },
        N(`span`, { text: `Close` }),
      );
      (t.addEventListener(`click`, () => this.close()),
        this.el.addEventListener(`pointerdown`, (e) => {
          e.target === this.el && this.close();
        }),
        this.el.append(
          N(
            `div.sh-panel`,
            null,
            N(
              `header.sh-head`,
              null,
              N(`div.sh-title`, { text: `Item Shop` }),
              this.msg,
              N(`div.sh-hint`, { "data-kbd-hint": ``, text: `Esc to close` }),
              N(`div.sh-hint`, {
                "data-touch-hint": ``,
                text: `Tap outside to close`,
              }),
            ),
            N(`div.sh-body`, null, this.rail, this.listWrap, this.detail),
            N(
              `footer.sh-foot`,
              null,
              N(
                `div.sh-gold`,
                null,
                N(`span.gd-gem`),
                this.goldEl,
                N(`span.sh-goldlab`, { text: `GOLD` }),
              ),
              this.inv,
              t,
            ),
          ),
        ),
        (this.slots = []));
      for (let e = 0; e < 6; e++) {
        let t = N(`button.sh-slot.slot-empty`, {
          type: `button`,
          "data-inv": e,
          "data-n": e + 1,
          "aria-label": `Item slot ${e + 1}, empty`,
        });
        (t.addEventListener(`click`, () => {
          let t = this.me();
          t &&
            t.items[e] &&
            ((this.sel = t.items[e]), (this.selInv = e), this.renderDetail());
        }),
          this.slots.push(t),
          this.inv.append(t));
      }
    }
    me() {
      let e = this.app.world;
      return e && e.units.get(this.app.playerId);
    }
    open() {
      ((this.forceSig = !0), (this.cat = this.cat || `recommended`));
      let e = this.me();
      (e && !this.sel && (this.sel = Ce(e) || (k[e.champion] || [])[0]),
        this.renderList(),
        (this.el.hidden = !1),
        requestAnimationFrame(() => {
          (this.el.classList.add(`on`), this.syncScroll());
        }));
    }
    close() {
      this.app.ui.panel === `shop` && this.app.fire(`ui`, { panel: `none` });
    }
    hide() {
      (this.el.classList.remove(`on`), (this.el.hidden = !0));
    }
    reset() {
      ((this.sel = null),
        (this.selInv = -1),
        (this.cat = `recommended`),
        (this.forceSig = !0));
    }
    canBuy(e, t) {
      let n = S[t],
        r = this.app.world;
      if (!e || !n) return [!1, ``];
      let i = !e.alive || r.inFountain(e);
      if (n.consumable) {
        let r = e.consumable || {};
        return r.id && r.id !== t && r.charges > 0
          ? [!1, `Consumable slot in use`]
          : (r.charges || 0) >= n.consumable.maxCharges
            ? [!1, `Carrying the maximum (${n.consumable.maxCharges})`]
            : e.gold < n.cost
              ? [!1, `Not enough gold`]
              : i
                ? [!0, ``]
                : [!1, `Return to base`];
      }
      let a = null;
      try {
        a = A(e, t);
      } catch {
        a = null;
      }
      let o = a ? a.cost : n.cost,
        s = a ? a.consume : [],
        c = 0,
        l = !1;
      if (n.cat === `boots`) {
        let n = e.items.findIndex((e) => e && S[e] && S[e].cat === `boots`);
        if (n >= 0 && !s.includes(n)) {
          if (e.items[n] === t) return [!1, `Already owned`];
          ((l = !0), (c = S[e.items[n]].cost * 0.7));
        }
      }
      return e.gold + c < o - 1e-6
        ? [!1, `Not enough gold`]
        : i
          ? !s.length && !l && e.items.indexOf(null) < 0
            ? [!1, `Inventory full`]
            : [
                !0,
                l
                  ? `Replaces your boots`
                  : s.length
                    ? `Combines owned components`
                    : ``,
              ]
          : [!1, `Return to base`];
    }
    buy(e) {
      let t = this.me();
      if (!t) return;
      let [n, r] = this.canBuy(t, e);
      if (!n) {
        this.flash(r);
        return;
      }
      this.app.world.command(t.id, { type: `buy`, item: e }) === !1
        ? this.flash(`Cannot buy right now`)
        : ((this.selInv = -1), this.hud.game.buyToast(e), this.refresh(!0));
    }
    sell(e) {
      let t = this.me();
      t &&
        (this.app.world.command(t.id, { type: `sell`, slotIndex: e }),
        (this.selInv = -1));
    }
    flash(e) {
      ((this.msg.textContent = e),
        this.msg.classList.remove(`on`),
        this.msg.offsetWidth,
        this.msg.classList.add(`on`));
    }
    renderList() {
      let e = this.me();
      if (!e) return;
      ((this.list.innerHTML = ``), this.cards.clear());
      for (let e of this.rail.children)
        e.classList.toggle(`on`, e.dataset.cat === this.cat);
      let t = Se(this.cat, e.champion),
        n =
          this.cat === `recommended`
            ? [
                [`Core Build`, t],
                [`Build Path`, Ee(t)],
                [`Consumables`, Object.keys(S).filter((e) => S[e].consumable)],
              ].filter((e) => e[1].length)
            : [1, 2, 3]
                .map((e) => [Dr[e], t.filter((t) => S[t].tier === e)])
                .filter((e) => e[1].length),
        r = Ce(e);
      for (let [e, t] of n) {
        this.list.append(N(`div.sh-group`, null, N(`span`, { text: e })));
        let n = N(`div.sh-grid`);
        (t.forEach((t, i) => {
          let a = S[t],
            o = be(t),
            s = N(
              `button.sh-card`,
              { type: `button`, "data-item": t },
              this.hud.bgEl(
                N(
                  `span.sh-art`,
                  null,
                  this.cat === `recommended` && e === `Core Build`
                    ? N(`span.sh-step`, { text: String(i + 1) })
                    : null,
                ),
                () => X(t, 128),
                Dn(t),
              ),
              N(
                `span.sh-info`,
                null,
                N(`span.sh-name`, { text: a.name }),
                N(
                  `span.sh-stat`,
                  { title: o.map((e) => `${e[0]} ${e[1]}`).join(` · `) },
                  ...Tr(o),
                ),
              ),
              N(
                `span.sh-cost`,
                null,
                N(`s.sh-costold`),
                N(`span.gd-gem.sm`),
                N(`span.sh-costval`, { text: L(a.cost) }),
              ),
              N(`span.sh-tag.owned`, { text: `Owned` }),
              t === r ? N(`span.sh-tag.next`, { text: `Next` }) : null,
            );
          ((s._val = s.querySelector(`.sh-costval`)),
            (s._old = s.querySelector(`.sh-costold`)),
            (s._price = -1),
            s.addEventListener(`click`, () => {
              ((this.sel = t),
                (this.selInv = -1),
                this.renderDetail(),
                this.refresh(!0));
            }),
            s.addEventListener(`dblclick`, () => this.buy(t)),
            n.append(s),
            this.cards.set(t, s));
        }),
          this.list.append(n));
      }
      (this.renderDetail(),
        this.refresh(!0),
        (this.list.scrollTop = 0),
        this.syncScroll());
    }
    syncScroll() {
      let e = this.list,
        t = e.scrollHeight - e.clientHeight - e.scrollTop,
        n = e.scrollHeight > e.clientHeight + 4 && t > 12;
      if ((this.more.classList.toggle(`on`, n), n)) {
        let e = this.cards.size ? Math.max(1, Math.round(t / 128)) : 0;
        this.moreLab.textContent = e > 1 ? `${e} more items` : `More below`;
      }
    }
    renderDetail() {
      let e = this.me(),
        t = this.sel;
      if (((this.detail.innerHTML = ``), !e || !t || !S[t])) {
        this.detail.append(
          N(`div.sh-empty`, { text: `Select an item to see its stats` }),
        );
        return;
      }
      let n = S[t],
        r = xe(t);
      this.buyCost = N(`span`, { text: L(Te(e, t)) });
      let i = N(
        `button.sh-buy`,
        { type: `button`, "data-buy": t },
        N(`span.sh-buylab`, { text: `Buy` }),
        N(`span.sh-buycost`, null, N(`span.gd-gem.sm`), this.buyCost),
      );
      i.addEventListener(`click`, () => this.buy(t));
      let a = this.selInv >= 0 && e.items[this.selInv] === t ? this.selInv : -1,
        o =
          a >= 0
            ? N(`button.sh-sell`, {
                type: `button`,
                text: `SELL  +${L(n.cost * 0.7)}`,
              })
            : null;
      o && o.addEventListener(`click`, () => this.sell(a));
      let s = [
        N(
          `div.sh-dhead`,
          null,
          this.hud.bgEl(N(`span.sh-dart`), () => X(t, 128), Dn(t)),
          N(
            `div`,
            null,
            N(`div.sh-dname`, { text: n.name }),
            N(`div.sh-dcat`, {
              text: `${ge[n.cat] || n.cat} · ${n.consumable ? `Consumable` : n.tier >= 3 ? `Legendary` : n.tier === 2 ? `Upgrade` : `Basic`}`,
            }),
          ),
        ),
        N(`ul.sh-dstats`, {
          html: be(t)
            .map(([e, t]) => `<li><b>${P(e)}</b> ${P(t)}</li>`)
            .join(``),
        }),
        r
          ? N(`p.sh-dpass`, null, N(`b`, { text: `Unique Passive — ` }), r)
          : null,
        n.cat === `boots`
          ? N(`p.sh-dnote`, {
              text: `Only one pair of boots: buying new boots refunds 70% of your current pair.`,
            })
          : null,
        this.effectBlock(e, t),
        this.buildBlock(e, t),
      ];
      (this.detail.append(
        N(`div.sh-dscroll`, null, ...s.filter(Boolean)),
        N(
          `div.sh-dfoot`,
          null,
          (this.dReason = N(`div.sh-dreason`)),
          N(`div.sh-dactions`, null, i, o),
        ),
      ),
        (this.buyBtn = i),
        (this.forceSig = !0));
    }
    buildBlock(e, t) {
      let n = S[t];
      if (!n || n.consumable) return null;
      let r = (t) => e.items.includes(t),
        i = (e, t) => {
          let n = S[e];
          return n
            ? N(
                `div.sh-node${t}${r(e) ? `.have` : ``}`,
                { title: n.name },
                this.hud.bgEl(N(`span.sh-nart`), () => X(e, 64), Dn(e)),
                N(
                  `span.sh-ntext`,
                  null,
                  N(`span.sh-nname`, { text: n.name }),
                  N(
                    `span.sh-ncost`,
                    null,
                    N(`span.gd-gem.sm`),
                    N(`b`, { text: L(n.cost) }),
                  ),
                ),
                N(`span.sh-nhave`, { text: r(e) ? `Owned` : `` }),
              )
            : null;
        },
        a = (n.from || []).filter((e) => S[e]),
        o = a.length
          ? []
          : Object.keys(S)
              .filter((e) => (S[e].from || []).includes(t))
              .slice(0, 4),
        s = [
          N(`div.sh-treehead`, {
            text: a.length
              ? `Build Path`
              : o.length
                ? `Upgrades Into`
                : `Standalone`,
          }),
        ];
      return (
        a.length
          ? s.push(
              N(
                `div.sh-tree`,
                null,
                i(t, `.sh-node-top`),
                N(`div.sh-kids`, null, ...a.map((e) => i(e, ``))),
              ),
            )
          : o.length
            ? s.push(N(`div.sh-kids.flat`, null, ...o.map((e) => i(e, ``))))
            : s.push(
                N(`p.sh-dnote`, {
                  text: `A complete item — it needs no components and combines no further.`,
                }),
              ),
        s.push(
          N(
            `div.sh-sellline`,
            null,
            N(`span`, { text: `Sell value` }),
            N(
              `b`,
              null,
              N(`span.gd-gem.sm`),
              N(`i`, { text: L(n.cost * 0.7) }),
            ),
          ),
        ),
        N(`div.sh-build`, null, ...s)
      );
    }
    effectBlock(e, t) {
      let n = S[t];
      if (!n) return null;
      let r = e.stats,
        i = e.def.base,
        a = [],
        o = (e, t, n, r) =>
          a.push(
            `<li><span>${e}</span><b>${r(t)}</b><i></i><em>${r(n)}</em></li>`,
          ),
        s = (e) => String(Math.round(e)),
        c = (e) => Math.round(e * 100) + `%`,
        l = (e) => e.toFixed(2);
      for (let t in n.stats) {
        let a = n.stats[t];
        t === `ad`
          ? o(`Attack Damage`, r.ad, r.ad + a, s)
          : t === `ap`
            ? o(`Ability Power`, r.ap, r.ap + a, s)
            : t === `armor`
              ? o(`Armor`, r.armor, r.armor + a, s)
              : t === `mr`
                ? o(`Magic Resist`, r.mr, r.mr + a, s)
                : t === `hp`
                  ? o(`Max Health`, e.maxHp, e.maxHp + a, s)
                  : t === `mana` && e.resource === `mana`
                    ? o(`Max Mana`, e.maxMana, e.maxMana + a, s)
                    : t === `attackSpeed`
                      ? o(
                          `Attack Speed`,
                          r.attackSpeed,
                          r.attackSpeed + i.attackSpeed * a,
                          l,
                        )
                      : t === `crit`
                        ? o(`Critical Rate`, r.crit, Math.min(1, r.crit + a), c)
                        : t === `lifesteal`
                          ? o(`Physical Vamp`, r.lifesteal, r.lifesteal + a, c)
                          : t === `haste`
                            ? o(`Ability Haste`, r.haste, r.haste + a, s)
                            : t === `moveSpeed`
                              ? o(
                                  `Move Speed`,
                                  r.moveSpeed * 100,
                                  (r.moveSpeed + a) * 100,
                                  s,
                                )
                              : t === `msPct` &&
                                o(
                                  `Move Speed`,
                                  r.moveSpeed * 100,
                                  r.moveSpeed * 100 * (1 + a),
                                  s,
                                );
      }
      return a.length
        ? N(
            `div.sh-effect`,
            null,
            N(`div.sh-effhead`, { text: `On ` + e.def.name }),
            N(`ul.sh-efflist`, { html: a.join(``) }),
          )
        : null;
    }
    refresh(e = !1) {
      let t = this.me();
      if (!t) return;
      let n = this.app.world,
        r = Math.floor(t.gold),
        i = !t.alive || n.inFountain(t),
        a = this.sig,
        o = !e && !this.forceSig && a[0] === r && a[1] === +!!i;
      for (let e = 0; e < 6; e++) a[2 + e] !== (t.items[e] || ``) && (o = !1);
      if (!o) {
        ((this.forceSig = !1), (a[0] = r), (a[1] = +!!i));
        for (let e = 0; e < 6; e++) a[2 + e] = t.items[e] || ``;
        this.setGold(r);
        for (let [e, n] of this.cards) {
          let i = S[e],
            a = Math.round(Te(t, e));
          (a !== n._price &&
            ((n._price = a),
            (n._val.textContent = L(a)),
            (n._old.textContent = a < i.cost ? L(i.cost) : ``)),
            n.classList.toggle(`owned`, t.items.includes(e)),
            n.classList.toggle(`poor`, r < a),
            n.classList.toggle(`sel`, e === this.sel));
        }
        if (
          (this.buyCost &&
            this.sel &&
            S[this.sel] &&
            (this.buyCost.textContent = L(Te(t, this.sel))),
          this.slots.forEach((e, n) => {
            let r = t.items[n] || ``;
            (e.dataset.item !== r &&
              ((e.dataset.item = r),
              r
                ? this.hud.bg(e, () => X(r, 128), Dn(r))
                : ((e._bgTok = -1),
                  (e._bgFb = null),
                  (e.style.backgroundImage = ``))),
              e.classList.toggle(`filled`, !!r),
              e.classList.toggle(`slot-empty`, !r),
              e.classList.toggle(`sel`, n === this.selInv),
              (e.title = r ? S[r].name : `Empty slot`),
              e.setAttribute(
                `aria-label`,
                r
                  ? `Item slot ${n + 1}, ${S[r].name}`
                  : `Item slot ${n + 1}, empty`,
              ));
          }),
          this.buyBtn && this.sel)
        ) {
          let [e, n] = this.canBuy(t, this.sel);
          (this.buyBtn.classList.toggle(`off`, !e),
            (this.dReason.textContent = n),
            this.dReason.classList.toggle(`bad`, !e));
        }
      }
    }
    update() {
      this.el.hidden || this.refresh();
    }
  },
  kr = class {
    constructor(e) {
      ((this.hud = e),
        (this.app = e.app),
        (this.world = null),
        (this.t = 0),
        (this.el = N(`div.sv-score-panel`, {
          hidden: !0,
          role: `dialog`,
          "aria-label": `Scoreboard`,
        })),
        this.el.addEventListener(`pointerdown`, (e) => {
          e.target === this.el && this.close();
        }),
        (this.head = N(`header.sb-head`)),
        (this.cols = N(`div.sb-cols`)));
      let t = N(
        `button.sb-close`,
        { type: `button`, "data-close-panel": `` },
        N(`span`, { text: `Close` }),
      );
      (t.addEventListener(`click`, () => this.close()),
        this.el.append(
          N(
            `div.sb-panel`,
            null,
            this.head,
            this.cols,
            N(
              `footer.sb-foot`,
              null,
              N(`span.sb-hint`, {
                "data-kbd-hint": ``,
                text: `Hold Tab to peek · Esc to close`,
              }),
              N(`span.sb-hint`, {
                "data-touch-hint": ``,
                text: `Tap outside to close`,
              }),
              t,
            ),
          ),
        ));
    }
    close() {
      this.app.ui.panel === `scoreboard` &&
        this.app.fire(`ui`, { panel: `none` });
    }
    liveFrame() {
      let e = this.app;
      return e.world
        ? { world: e.world, viewerTeam: e.viewerTeam, playerId: e.playerId }
        : null;
    }
    open() {
      let e = this.liveFrame();
      (e && this.refresh(e),
        (this.el.hidden = !1),
        (this.t = 0.25),
        requestAnimationFrame(() => this.el.classList.add(`on`)));
    }
    hide() {
      (this.el.classList.remove(`on`), (this.el.hidden = !0));
    }
    build(e, t) {
      ((this.world = e), (this.vt = t.viewerTeam), (this.pid = t.playerId));
      let n = t.viewerTeam;
      ((this.head.innerHTML = ``),
        (this.cols.innerHTML = ``),
        (this.rows = []));
      let r = (e) => {
          let t = e === n,
            r = {
              kills: N(`b.sbh-kills`, { text: `0` }),
              towers: N(`b`, { text: `0` }),
              inhib: N(`b`, { text: `0` }),
              drakes: N(`b`, { text: `0` }),
              tyrants: N(`b`, { text: `0` }),
              gold: N(`b`, { text: `0` }),
            },
            i = N(
              `div.sbh-team.${t ? `ally` : `enemy`}`,
              null,
              N(
                `div.sbh-name`,
                null,
                N(`i.sbh-crest`),
                N(`span`, {
                  text: e === 0 ? `Azure Concord` : `Ember Dominion`,
                }),
              ),
              N(
                `div.sbh-row`,
                null,
                N(`span`, null, `Turrets`, r.towers),
                N(`span.sbh-inhib`, null, `Inhibs`, r.inhib),
                N(`span`, null, `Drakes`, r.drakes),
                N(`span`, null, `Tyrants`, r.tyrants),
                N(`span`, null, `Gold`, r.gold),
              ),
            );
          return (
            (r.setK = V(r.kills)),
            (r.setT = V(r.towers)),
            (r.setI = V(r.inhib)),
            (r.setD = V(r.drakes)),
            (r.setY = V(r.tyrants)),
            (r.setG = F(r.gold)),
            (r.team = e),
            (r.setIOn = I(i, `lost-inhib`)),
            [i, r]
          );
        },
        [i, a] = r(n),
        [o, s] = r(1 - n);
      ((this.timeEl = N(`div.sbh-time`, { text: `00:00` })),
        (this.setTime = F(this.timeEl)),
        this.head.append(
          i,
          N(
            `div.sbh-mid`,
            null,
            N(
              `div.sbh-score`,
              null,
              a.kills,
              N(`span.sbh-vs`, { text: `VS` }),
              s.kills,
            ),
            this.timeEl,
          ),
          o,
        ),
        (this.teamBlocks = [a, s]));
      for (let r of [n, 1 - n]) {
        let i = N(`div.sb-col.${r === n ? `ally` : `enemy`}`);
        i.append(
          N(
            `div.sb-colhead`,
            null,
            N(`span.c-player`, { text: `Player` }),
            N(`span.c-kda`, { text: `K / D / A` }),
            N(`span.c-cs`, { text: `CS` }),
            N(`span.c-gold`, { text: `Gold` }),
            N(`span.c-items`, { text: `Items` }),
          ),
        );
        for (let n of e.champions.filter((e) => e.team === r)) {
          let e = this.hud.por(
              N(
                `span.sb-por`,
                null,
                N(`span.sb-lvl`, { text: String(n.level) }),
                N(`span.sb-resp`),
              ),
              n.champion,
            ),
            r = N(
              `span.sb-spells`,
              null,
              ...n.spells.map((e) =>
                this.hud.bgEl(
                  N(`span.sb-spell`, { title: he(e.id) }),
                  () => Xt(e.id, 64),
                  wn(e.id),
                ),
              ),
            ),
            a = N(`span.sb-items`),
            o = [];
          for (let e = 0; e < 6; e++) {
            let t = N(`span.sb-item.slot-empty`, {
              "data-n": e + 1,
              "aria-label": `Item slot ${e + 1}, empty`,
            });
            (a.append(t), o.push(t));
          }
          let s = N(`span.c-kda`),
            c = N(`span.c-cs`),
            l = N(`span.c-gold`),
            u = N(
              `div.sb-row${n.id === t.playerId ? `.self` : ``}`,
              null,
              N(
                `span.c-player`,
                null,
                e,
                r,
                N(
                  `span.sb-names`,
                  null,
                  N(
                    `span.sb-pname`,
                    null,
                    N(`span.sb-pn`, { text: n.name }),
                    n.bot ? N(`em.sb-bot`, { text: `Bot` }) : null,
                  ),
                  N(`span.sb-cname`, { text: n.def.name }),
                ),
              ),
              s,
              c,
              l,
              N(`span.c-items`, null, a),
            ),
            d = {
              id: n.id,
              row: u,
              slots: o,
              items: [void 0, void 0, void 0, void 0, void 0, void 0],
              kdaKey: -1,
              kda: s,
              setCs: V(c),
              setGold: F(l),
              setLvl: V(e.querySelector(`.sb-lvl`)),
              setResp: F(e.querySelector(`.sb-resp`)),
              setDead: I(u, `dead`),
            };
          (this.rows.push(d), i.append(u));
        }
        this.cols.append(i);
      }
    }
    refresh(e) {
      let t = e.world;
      (t !== this.world ||
        e.viewerTeam !== this.vt ||
        e.playerId !== this.pid) &&
        this.build(t, e);
      for (let e of this.teamBlocks) {
        let n = t.teamStats[e.team];
        (e.setK(n.kills),
          e.setT(n.towers),
          e.setI(n.inhibitors || 0),
          e.setD(n.drakes),
          e.setY(n.tyrants || 0),
          e.setIOn((t.teamStats[1 - e.team].inhibitors || 0) > 0));
        let r = 0;
        for (let n of t.champions) n.team === e.team && (r += n.totalGold);
        e.setG(`${(r / 1e3).toFixed(1)}k`);
      }
      this.setTime(ae(t.time));
      for (let e of this.rows) {
        let n = t.units.get(e.id);
        if (!n) continue;
        let r = n.kills * 1e6 + n.deaths * 1e3 + n.assists;
        (r !== e.kdaKey &&
          ((e.kdaKey = r),
          (e.kda.innerHTML = `<b>${n.kills}</b><i>/</i><b class="d">${n.deaths}</b><i>/</i><b>${n.assists}</b>`)),
          e.setCs(n.cs),
          e.setGold(L(n.totalGold)),
          e.setLvl(n.level),
          e.setDead(!n.alive),
          e.setResp(
            n.alive ? `` : String(Math.max(0, Math.ceil(n.respawnAt - t.time))),
          ));
        for (let t = 0; t < 6; t++) {
          let r = n.items[t] || null;
          if (e.items[t] === r) continue;
          e.items[t] = r;
          let i = e.slots[t];
          (r
            ? this.hud.bg(i, () => X(r, 64), Dn(r))
            : ((i._bgTok = -1),
              (i._bgFb = null),
              (i.style.backgroundImage = ``)),
            i.classList.toggle(`filled`, !!r),
            i.classList.toggle(`slot-empty`, !r),
            (i.title = r ? S[r].name : ``),
            i.setAttribute(
              `aria-label`,
              r
                ? `Item slot ${t + 1}, ${S[r].name}`
                : `Item slot ${t + 1}, empty`,
            ));
        }
      }
    }
    update(e) {
      this.el.hidden ||
        ((this.t -= e.dt), !(this.t > 0) && ((this.t = 0.25), this.refresh(e)));
    }
  },
  Ar = 30,
  jr = 4.2,
  Mr = 2.8,
  Nr = 4.2,
  Pr = {
    baron: `Baron`,
    jungle: `Jungle`,
    mid: `Mid`,
    duo: `Duo`,
    support: `Support`,
  },
  Fr = { baron: `BAR`, jungle: `JNG`, mid: `MID`, duo: `DUO`, support: `SUP` },
  Ir = { select: !0, loading: !0 },
  Lr = class {
    constructor(e) {
      ((this.hud = e),
        (this.app = e.app),
        (this.el = N(`div.sv-screens`)),
        (this.cur = null),
        (this.kind = null),
        (this.endPhase = 0),
        (this.setEndPhase = () => {}));
    }
    setState(e, t) {
      let n =
        e === `menu` || e === `select` || e === `loading` || e === `end`
          ? e
          : null;
      if (n === this.kind) return;
      let r = this.cur,
        i = this.kind,
        a = le(),
        o = !!(r && Ir[n] && Ir[i]);
      if (
        (this.onLeave && this.onLeave(),
        (this.onLeave = null),
        r &&
          (o
            ? r.remove()
            : (r.classList.remove(`on`),
              r.classList.add(`leaving`),
              setTimeout(() => r.remove(), a ? 0 : 400))),
        (this.kind = n),
        (this.cur = null),
        (this.tick = null),
        !n)
      )
        return;
      let s =
        n === `menu`
          ? this.buildMenu(t)
          : n === `select`
            ? this.buildSelect(t)
            : n === `loading`
              ? this.buildLoading(t)
              : this.buildEnd(t);
      ((this.cur = s),
        this.el.append(s),
        o
          ? (s.classList.add(`instant`),
            s.classList.add(`on`),
            requestAnimationFrame(() => s.classList.remove(`instant`)))
          : n === `end` || a
            ? (s.offsetWidth, s.classList.add(`on`))
            : requestAnimationFrame(() => s.classList.add(`on`)));
    }
    update(e) {
      this.tick && this.tick(e);
    }
    go(e) {
      ((this.app.state = e), this.app.fire(`state`, e));
    }
    buildMenu() {
      let e = N(`span.mn-live-time`, { text: `00:00` }),
        t = F(e),
        n = N(
          `button.mn-play.sv-btn-primary`,
          { type: `button`, "data-play": `` },
          N(`span`, { text: `Play` }),
        );
      n.addEventListener(`click`, () => this.go(`select`));
      let r = () => [
          N(`span.mn-t1`, { text: `Sundered` }),
          N(`span.mn-t2`, { text: `Vale` }),
        ],
        i = N(
          `div.sv-screen.sv-menu`,
          null,
          N(`div.mn-vignette`),
          N(
            `div.mn-top`,
            null,
            N(
              `div.mn-live`,
              null,
              N(`i.mn-dot`),
              N(`span`, { text: `Live bot match` }),
              e,
            ),
            N(
              `div.mn-factions`,
              null,
              N(`span.f-blue`, { text: `Azure Concord` }),
              N(`span.f-vs`, { text: `vs` }),
              N(`span.f-red`, { text: `Ember Dominion` }),
            ),
          ),
          N(
            `div.mn-center`,
            null,
            N(`div.mn-kicker`, { text: `A 5v5 Arena` }),
            N(
              `h1.mn-title`,
              { "aria-label": `Sundered Vale` },
              N(`span.mn-face`, { "aria-hidden": `true` }, ...r()),
              N(
                `span.mn-seamglow`,
                { "aria-hidden": `true` },
                N(`span.mn-seam`, null, ...r()),
              ),
              N(`span.mn-half.a`, { "aria-hidden": `true` }, ...r()),
              N(`span.mn-half.b`, { "aria-hidden": `true` }, ...r()),
            ),
            N(`div.mn-rule`, null, N(`i`), N(`b`), N(`i`)),
            N(`p.mn-tag`, {
              text: `Two kingdoms. One broken valley. Hold the line.`,
            }),
          ),
          N(
            `div.mn-bottom`,
            null,
            N(
              `div.mn-mode`,
              null,
              N(`span.mn-modelab`, { text: `Mode` }),
              N(`span.mn-modeval`, { text: `Co-op vs. AI` }),
              N(`span.mn-sep`),
              N(`span`, { text: `5v5` }),
              N(`span.mn-sep`),
              N(`span`, { text: `Classic` }),
            ),
            n,
            N(`div.mn-hint`, {
              "data-kbd-hint": ``,
              text: `Right-click to move  ·  Q W E R abilities  ·  D F spells  ·  B recall  ·  Tab scores`,
            }),
            N(`div.mn-hint`, {
              "data-touch-hint": ``,
              text: `Drag the joystick to move  ·  Drag an ability to aim`,
            }),
          ),
        ),
        a = this.app.pipeline && this.app.pipeline.cameraRig,
        o = !1,
        s = 0;
      return (
        a &&
          a.mode === `follow` &&
          ((a.mode = `free`), (o = !0), a.setFocus(58, 63, !0)),
        (this.onLeave = () => {
          o && a.mode === `free` && (a.mode = `follow`);
        }),
        (this.tick = (e) => {
          (t(ae(e.world.time)),
            (s += e.dt),
            o &&
              a.mode === `free` &&
              a.setFocus(
                58 + Math.sin(s * 0.045) * 7,
                63 - Math.sin(s * 0.03 + 1) * 5,
                !1,
              ));
        }),
        i
      );
    }
    buildSelect(e) {
      let t = this.app,
        r = this.hud,
        i = n.includes(e.world.players?.find((e) => !e.bot)?.champion)
          ? e.world.players.find((e) => !e.bot).champion
          : `vyre`,
        a = !1,
        o = Ar,
        s = 0,
        c = -1,
        l = r.portraits,
        [u, d] = r.splashDims(`select`);
      it(i, !0);
      for (let e of n) it(e);
      l.pumpAll(240);
      let f = N(`div.cs-timer`, { text: String(Ar) }),
        p = F(f),
        m = N(`div.cs-timering`),
        h = re(m, `--p`),
        g = N(`div.cs-art`),
        _ = N(`div.cs-name`),
        v = N(`div.cs-title`),
        y = N(`div.cs-role`),
        b = N(`div.cs-attrs`),
        S = N(`div.cs-abil`),
        C = N(`div.cs-abtabs`, { role: `tablist` }),
        w = N(`div.cs-fly`, { "aria-hidden": `true` }),
        T = N(`div.cs-tiles`),
        D = N(
          `button.cs-lock.sv-btn-primary`,
          { type: `button`, "data-lockin": `` },
          N(`span`, { text: `Lock In` }),
        ),
        O = { 0: N(`div.cs-team.ally`), 1: N(`div.cs-team.enemy`) },
        k = [],
        A = {},
        ee = 0,
        te = !0,
        j = [],
        ne = -1;
      for (let e of n) {
        let t = x[e],
          n = N(
            `button.cs-tile`,
            {
              type: `button`,
              "data-champion": e,
              "aria-label": `${t.name}, ${t.title}`,
            },
            r.por(
              N(
                `span.cs-tileart`,
                null,
                N(`span.cs-tilerole`, { text: Pr[t.role] || `` }),
              ),
              e,
            ),
            N(`span.cs-tilename`, { text: t.name }),
          );
        (n.addEventListener(`click`, () => {
          a || ((i = e), se());
        }),
          (A[e] = n),
          T.append(n));
      }
      let M = () => {
          k.length = 0;
          for (let e of [0, 1])
            ((O[e].innerHTML = ``),
              O[e].append(
                N(
                  `div.cs-teamhead`,
                  null,
                  N(`span`, { text: e === 0 ? `Your Team` : `Enemy Team` }),
                  N(`em`, {
                    text: e === 0 ? `Azure Concord` : `Ember Dominion`,
                  }),
                ),
              ),
              E(i)
                .filter((t) => t.team === e)
                .forEach((t, n) => {
                  let r = !t.bot,
                    i = r ? 1 / 0 : e === 0 ? 0.7 + n * 0.55 : 1 + n * 0.6,
                    a = x[t.champion].role,
                    o = N(
                      `span.cs-rowpor`,
                      null,
                      N(`span.cs-rowcrest`, {
                        text: Fr[a] || ``,
                        title: ue[a] || ``,
                      }),
                    ),
                    s = N(`span.cs-rowstatus`),
                    c = N(`span.cs-rowchamp`),
                    l = N(
                      `div.cs-row${r ? `.self` : ``}`,
                      null,
                      o,
                      N(
                        `span.cs-rowtext`,
                        null,
                        s,
                        N(`span.cs-rowname`, { text: t.name }),
                      ),
                      c,
                    );
                  (O[e].append(l),
                    k.push({
                      p: t,
                      row: l,
                      por: o,
                      status: s,
                      champ: c,
                      delay: i,
                      human: r,
                      shown: -1,
                    }));
                }));
        },
        I = (e) => {
          let t = e.human || s >= e.delay,
            o = e.human ? i : e.p.champion,
            c = n.indexOf(o) * 4 + (t ? 2 : 0) + +!!a;
          if (c === e.shown) return;
          e.shown = c;
          let l = !t;
          (l
            ? ((e.por._bgTok = -1),
              (e.por._bgFb = null),
              (e.por.style.backgroundImage = ``),
              r.unquick(e.por))
            : r.por(e.por, o),
            e.por.classList.toggle(`empty`, l),
            (e.status.textContent = e.human
              ? a
                ? x[o].name
                : `Selecting…`
              : t
                ? x[o].name
                : `Selecting…`),
            e.status.classList.toggle(`picking`, e.human ? !a : !t),
            (e.champ.textContent = t ? ue[x[o].role] : ``),
            e.row.classList.toggle(`locked`, e.human ? a : t));
        },
        ie = (e) => {
          ee = e;
          for (let t of S.children)
            t.classList.toggle(`on`, +t.dataset.ab === e);
          for (let t of C.children) {
            let n = +t.dataset.ab === e;
            (t.classList.toggle(`on`, n),
              t.setAttribute(`aria-selected`, n ? `true` : `false`));
          }
          te = !0;
        },
        ae = (e, t) => {
          let n = j[e];
          if (!n || r.stage.classList.contains(`compact`)) return;
          ((ne = e),
            (w.innerHTML = `<div class="cs-flyhead"><span class="cs-flykey">${n.key}</span><span class="cs-flyname">${P(n.name)}</span></div><div class="cs-flymeta">${P(n.meta)}</div><div class="cs-flydesc">${n.desc}</div>`),
            w.classList.add(`on`));
          let i = w.parentNode,
            a = Math.max(0, i.clientHeight - w.offsetHeight);
          w.style.top =
            Math.max(
              0,
              Math.min(
                a,
                t.offsetTop + t.offsetHeight / 2 - w.offsetHeight / 2,
              ),
            ) + `px`;
        },
        L = () => {
          ((ne = -1), w.classList.remove(`on`));
        },
        oe = () => {
          (r.unquick(g), it(i, !0));
          let e = l.cardSync(i, u, d);
          (e && ((e.className = `sv-quickart`), g.prepend(e)),
            r.bg(g, () => l.splashArt(i, u, d, 150), {
              fb: xn(i, 0.8),
              done: () => {
                e && e.remove();
              },
            }));
        },
        se = () => {
          let e = x[i],
            t = Ue(i);
          for (let e in A) A[e].classList.toggle(`on`, e === i);
          (oe(),
            g.style.setProperty(`--glow`, t.secondary),
            (_.textContent = e.name),
            (v.textContent = e.title),
            (y.innerHTML = `<b>${P(ue[e.role])}</b><i></i>${P(fe(e))}<i></i>${e.ranged ? `Ranged` : `Melee`}`),
            (b.innerHTML = He(e)
              .map(
                ([e, t]) =>
                  `<div class="cs-attr"><span>${e}</span><span class="cs-bar"><i style="--v:${t.toFixed(3)}"></i></span></div>`,
              )
              .join(``)));
          let n = e.passive || {},
            o = {
              name: n.name || e.id,
              fx: e.id + `_passive`,
              type: `passive`,
              element: n.element || e.attackElement,
            };
          ((j = [
            {
              key: `P`,
              name: n.name || `Passive`,
              meta: `Passive`,
              desc: Re(e),
              art: () => Ut(o, e.attackElement, 128),
              fb: Cn(o, e.attackElement),
              cls: `.passive`,
            },
            ...e.abilities.map((t) => ({
              key: t.slot,
              name: t.name,
              meta: [
                ze[t.type],
                Ve(t, 0) && `${Ve(t, 0)} cooldown`,
                Be(t, 0, e.resource),
              ]
                .filter(Boolean)
                .join(`  ·  `),
              desc: Le(t, e.name, 0),
              art: () => Ut(t, e.attackElement, 128),
              fb: Cn(t, e.attackElement),
              cls: t.slot === `R` ? `.ult` : ``,
            })),
          ]),
            (S.innerHTML = ``),
            (C.innerHTML = ``),
            L(),
            j.forEach((e, t) => {
              let n = N(
                `div.cs-ab${e.cls}${t === ee ? `.on` : ``}`,
                { "data-ab": t },
                r.bgEl(
                  N(
                    `span.cs-abicon`,
                    null,
                    N(`span.cs-abkey`, { text: e.key }),
                  ),
                  e.art,
                  e.fb,
                ),
                N(
                  `div.cs-abtext`,
                  null,
                  N(`div.cs-abname`, { text: e.name }),
                  N(`div.cs-abmeta`, { text: e.meta }),
                  N(`div.cs-abdesc`, { html: e.desc }),
                ),
              );
              (n.addEventListener(`pointerenter`, (e) => {
                e.pointerType === `mouse` && ae(t, n);
              }),
                n.addEventListener(`pointerleave`, (e) => {
                  e.pointerType === `mouse` && L();
                }),
                n.addEventListener(`click`, (e) => {
                  r.stage.classList.contains(`compact`)
                    ? ie(t)
                    : e.pointerType !== `mouse` && (ne === t ? L() : ae(t, n));
                }),
                S.append(n));
              let i = N(
                `button.cs-abtab${e.cls}${t === ee ? `.on` : ``}`,
                {
                  type: `button`,
                  role: `tab`,
                  "data-ab": t,
                  "aria-label": e.name,
                  "aria-selected": t === ee ? `true` : `false`,
                },
                r.bgEl(N(`span.cs-abtabart`), e.art, e.fb),
                N(`span.cs-abtabkey`, { text: e.key }),
              );
              (i.addEventListener(`click`, () => ie(t)), C.append(i));
            }),
            (te = !0),
            a || (M(), k.forEach(I)));
        },
        ce = () => {
          if (S.isConnected && S.clientHeight) {
            ((te = !1), S.classList.remove(`clamp`));
            for (let e of [17, 16, 15, 14, 13])
              if (
                (S.style.setProperty(`--abfs`, e + `px`),
                S.scrollHeight <= S.clientHeight + 1)
              )
                return;
            S.classList.add(`clamp`);
          }
        },
        R = () => {
          if (!a) {
            ((a = !0),
              D.classList.add(`done`),
              (D.firstChild.textContent = `Locked In`),
              z.classList.add(`locked`));
            for (let e of k) ((e.shown = -1), I(e));
            c = le() ? 0 : 0.65;
          }
        };
      D.addEventListener(`click`, R);
      let z = N(
        `div.sv-screen.sv-select`,
        null,
        r.bgEl(N(`div.cs-bg`), () => sn()),
        N(`div.cs-shade`),
        N(
          `header.cs-head`,
          null,
          N(
            `div.cs-headline`,
            null,
            N(`span.cs-orn`),
            N(`h2`, { text: `Choose Your Champion` }),
            N(`span.cs-orn.r`),
          ),
          N(`div.cs-clock`, null, m, f),
        ),
        O[0],
        N(
          `main.cs-main`,
          null,
          N(`section.cs-show`, null, g, N(`div.cs-showinfo`, null, y, _, v, b)),
          N(
            `section.cs-kit`,
            null,
            N(`div.cs-kithead`, { text: `Abilities` }),
            C,
            S,
            w,
          ),
          N(`footer.cs-foot`, null, T, D),
        ),
        O[1],
      );
      (z.addEventListener(`pointerdown`, (e) => {
        ne >= 0 && !e.target.closest(`.cs-ab`) && L();
      }),
        se());
      let B = l.onChange((e, t) => {
          e === i &&
            (t === `splash` || !g.classList.contains(`art-in`)) &&
            oe();
          for (let t of k) (t.human ? i : t.p.champion) === e && (t.shown = -1);
          t !== `splash` && A[e] && r.por(A[e].firstChild, e);
        }),
        V = null,
        de = 0,
        pe = -1,
        me = -1;
      return (
        (this.onLeave = () => B()),
        (this.tick = (e) => {
          let n = Math.max(0, e.dt);
          if (((s += n), !a)) {
            o = Math.max(0, Ar - s);
            let e = Math.ceil(o),
              n = Math.round((o / Ar) * 360);
            (e !== pe && ((pe = e), p(String(e))),
              n !== me && ((me = n), h((n / 360).toFixed(4))),
              o <= 0 && !t.scenario && R());
          } else if (c >= 0 && ((c -= n), c < 0)) {
            (t.newMatch({ champion: i, seed: (Math.random() * 1e6) | 0 }),
              this.go(`loading`));
            return;
          }
          let l = r.stage.classList.contains(`compact`);
          if ((l !== V && ((V = l), (te = !0)), te && ce(), s >= de)) {
            de = s + 0.1;
            for (let e = 0; e < k.length; e++) I(k[e]);
          }
        }),
        z
      );
    }
    buildLoading(e) {
      let t = e.world,
        n = this.hud,
        r = n.portraits,
        i = [],
        [a, o] = n.splashDims(`loading`);
      __mtLoadUI() || r.pumpAll(240); // [MT-HOOK] mtLoading
      let s = (s) =>
          N(
            `div.ld-team.${s === e.viewerTeam ? `ally` : `enemy`}`,
            null,
            ...t.players
              .filter((e) => e.team === s)
              .map((s, c) => {
                let l = t.units.get(s.unitId),
                  u = x[s.champion],
                  d = l && l.id === e.playerId,
                  f = N(`span.ld-pct`, { text: `0%` }),
                  p = N(`i`),
                  m = {
                    bar: p,
                    pct: f,
                    speed: 0.75 + ((s.index * 37) % 10) / 22,
                    setP: re(p, `--p`),
                    setT: F(f),
                    last: -1,
                    art: !1,
                  },
                  h = N(`div.ld-art`);
                (__mtLoadUI() ? (m.art = !0) : it(s.champion), (m.art$ = h), (m.champ = s.champion)); // [MT-HOOK] mtLoading: no 3D hero render, art counts as ready
                let g = __mtLoadUI() ? null : r.cardSync(s.champion, a, o); // [MT-HOOK] mtLoading
                (g &&
                  ((g.className = `ld-artcv`),
                  h.append(g),
                  (m.quick = g),
                  (m.art = !0)),
                  __mtLoadUI() || n.bg(h, () => r.splashArt(s.champion, a, o), { // [MT-HOOK] mtLoading: no splash bake
                    fb: xn(s.champion, 0.63),
                    done: () => {
                      ((m.art = !0), (m.quick &&= (m.quick.remove(), null)));
                    },
                  }));
                let _ = N(
                  `div.ld-card${d ? `.self` : ``}`,
                  { style: { "--i": c, "--streak": `${-28 + c * 13}deg` } },
                  h,
                  N(`div.ld-tint`, { "aria-hidden": `true` }),
                  N(`div.ld-streak`, { "aria-hidden": `true` }),
                  N(
                    `div.ld-plate`,
                    null,
                    N(`div.ld-champ`, { text: u.name }),
                    N(`div.ld-player`, { text: s.name }),
                    N(
                      `div.ld-meta`,
                      null,
                      N(`span`, { text: ue[u.role] }),
                      N(
                        `span.ld-spells`,
                        null,
                        ...(l && !__mtLoadUI() ? l.spells : []).map((e) => // [MT-HOOK] mtLoading: no spell icons
                          n.bgEl(
                            N(`span.ld-spell`, { title: he(e.id) }),
                            () => Xt(e.id, 64),
                            wn(e.id),
                          ),
                        ),
                      ),
                    ),
                  ),
                  N(`div.ld-prog`, null, N(`span.ld-track`, null, p), f),
                  N(`div.ld-frame`),
                );
                return (i.push(m), _);
              }),
          ),
        c = We[(t.players.length * 7 + ((Date.now() / 6e4) | 0)) % We.length],
        l = N(`i`),
        u = N(`span.ld-totalpct`, { text: `0%` }),
        d = re(l, `--p`),
        f = F(u),
        p = N(
          `div.sv-screen.sv-loading`,
          null,
          __mtLoadUI() ? N(`div.ld-bg`) : n.bgEl(N(`div.ld-bg`), () => sn()), // [MT-HOOK] mtLoading: no vale background bake
          N(`div.ld-shade`),
          N(
            `header.ld-head`,
            null,
            N(`div.ld-mode`, { text: `Co-op vs. AI` }),
            N(
              `div.ld-map`,
              null,
              N(`span.cs-orn`),
              N(`span`, { text: `The Sundered Vale` }),
              N(`span.cs-orn.r`),
            ),
          ),
          s(e.viewerTeam),
          N(`div.ld-vs`, null, N(`i`), N(`b`, { text: `VS` }), N(`i`)),
          s(1 - e.viewerTeam),
          N(
            `footer.ld-foot`,
            null,
            N(`div.ld-tip`, null, N(`b`, { text: `Tip` }), c),
            N(`div.ld-total`, null, N(`span.ld-totaltrack`, null, l), u),
          ),
        ),
        m = r.onChange((e, t) => {
          for (let s of i) {
            if (s.champ !== e || !s.art$) continue;
            let i = s.art$.classList.contains(`art-in`);
            if (t === `splash` || (!i && !s.quick)) {
              if (!s.quick && !i) {
                let t = r.cardSync(e, a, o);
                t &&
                  ((t.className = `ld-artcv`),
                  s.art$.append(t),
                  (s.quick = t),
                  (s.art = !0));
              }
              n.bg(s.art$, () => r.splashArt(e, a, o), {
                fb: xn(e, 0.63),
                done: () => {
                  ((s.art = !0), (s.quick &&= (s.quick.remove(), null)));
                },
              });
            }
          }
        });
      this.onLeave = () => m();
      let h = 0,
        g = !!this.app.scenario;
      return (
        (this.tick = (e) => {
          h += Math.max(0, e.dt);
          let t = g ? jr * 0.62 : h * __mtLT.LOAD_PACE, // [MT-HOOK] loadPace (fake progress fills at the pace of the shorter minimum)
            r = 0,
            a = !0;
          for (let e of i) {
            let n = Math.max(0, Math.min(1, (t / jr) * e.speed * 1.12)),
              i = 1 - (1 - n) * (1 - n);
            e.art || ((i = Math.min(i, 0.9)), (a = !1));
            let o = Math.round(i * 100);
            ((r += o),
              o !== e.last &&
                ((e.last = o), e.setP((o / 100).toFixed(2)), e.setT(o + `%`)));
          }
          let o = Math.round(r / i.length);
          (d((o / 100).toFixed(2)),
            f(o + `%`),
            !g &&
              h >= __mtLT.LOAD_MIN && // [MT-HOOK] loadMin (legacy 4.55 s; ?loadmin=4.55)
              ((a && n.q[0].length === 0) || h >= 7.2) &&
              !(globalThis.__moba && globalThis.__moba.mtPrewarm && globalThis.__moba.mtPrewarm.holdLoading(h)) && // [MT-HOOK] prewarmHold (wait for shader prewarm, capped)
              this.go(`game`));
        }),
        p
      );
    }
    buildEnd(e) {
      let t = this.hud,
        n = e.world,
        r = e.viewerTeam,
        i = n.winner === r,
        a = n.units.get(e.playerId);
      t.portraits;
      let o = n.teamStats,
        s = (e) =>
          e.kills * 3 +
          e.assists * 1.5 +
          (e.totalGold || 0) / 500 +
          e.cs / 30 -
          e.deaths * 1.5,
        c = (e) =>
          n.champions
            .filter((t) => t.team === e)
            .reduce((e, t) => (e && s(e) >= s(t) ? e : t), null),
        l = n.winner === 0 || n.winner === 1 ? n.winner : r,
        u = c(l),
        d = c(1 - l),
        f = (e) =>
          n.champions
            .filter((t) => t.team === e)
            .reduce((e, t) => e + (t.totalGold || 0), 0),
        p = n.time >= 30 ? ae(n.time) : `< 1 min`,
        m = (e) =>
          n.champions
            .filter((t) => t.team === e)
            .slice()
            .sort((e, t) => s(t) - s(e)),
        h = (n) =>
          N(
            `div.en-col.${n === r ? `ally` : `enemy`}`,
            null,
            N(
              `div.en-colhead`,
              null,
              N(`span`, { text: n === r ? `Your Team` : `Enemy Team` }),
              N(`b`, { text: String(o[n].kills) }),
            ),
            N(
              `div.en-colsub`,
              null,
              N(`span`),
              N(`span`),
              N(`span.en-h`, { text: `K/D/A` }),
              N(`span.en-h`, { text: `CS` }),
              N(`span.en-h`, { text: `Damage` }),
              N(`span.en-h.en-hi`, { text: `Items` }),
              N(`span.en-h`, { text: `Gold` }),
              N(`span`),
            ),
            ...m(n).map((n) => {
              let r =
                u && n.id === u.id ? `MVP` : d && n.id === d.id ? `SVP` : ``;
              return N(
                `div.en-row${n.id === e.playerId ? `.self` : ``}${r ? `.medalled` : ``}`,
                null,
                t.por(
                  N(
                    `span.en-por`,
                    null,
                    N(`span.en-lvl`, { text: String(n.level) }),
                  ),
                  n.champion,
                ),
                N(
                  `span.en-names`,
                  null,
                  N(`span.en-pname`, { text: n.name }),
                  N(`span.en-cname`, { text: n.def.name }),
                ),
                N(`span.en-kda`, {
                  html: `<b>${n.kills}</b><i>/</i><b class="d">${n.deaths}</b><i>/</i><b>${n.assists}</b>`,
                }),
                N(`span.en-cs`, { text: String(n.cs) }),
                N(`span.en-dmg`, { text: L(n.damageDealt || 0) }),
                N(
                  `span.en-items`,
                  null,
                  ...n.items.map((e, n) => {
                    let r = N(`span.en-item${e ? `.filled` : ``}`, {
                      title: e ? S[e].name : ``,
                      "data-n": n + 1,
                      "aria-label": e
                        ? `Item slot ${n + 1}, ${S[e].name}`
                        : `Item slot ${n + 1}, empty`,
                    });
                    return (e && t.bg(r, () => X(e, 64), Dn(e)), r);
                  }),
                ),
                N(`span.en-gold`, { text: L(n.totalGold) }),
                N(
                  `span.en-medal${r === `MVP` ? `.mvp` : r === `SVP` ? `.svp` : ``}`,
                  null,
                  r ? N(`b`, { text: r }) : null,
                ),
              );
            }),
          ),
        g = (e, t, n, r) => {
          let i = t + n,
            a = Math.max(1, i);
          return i <= 0
            ? N(
                `div.en-flowrow.zero`,
                null,
                N(`b.a`, { text: r ? r(t) : String(t) }),
                N(`span.en-flowdash`, { "aria-hidden": `true`, text: `—` }),
                N(`span.en-flowlab`, { text: e }),
                N(`span.en-flowdash`, { "aria-hidden": `true`, text: `—` }),
                N(`b.b`, { text: r ? r(n) : String(n) }),
              )
            : N(
                `div.en-flowrow`,
                null,
                N(`b.a`, { text: r ? r(t) : String(t) }),
                N(
                  `span.en-flowtrack.l`,
                  null,
                  N(`i${t > 0 ? `` : `.z`}`, {
                    style: { "--v": (t / a).toFixed(3) },
                  }),
                ),
                N(`span.en-flowlab`, { text: e }),
                N(
                  `span.en-flowtrack.r`,
                  null,
                  N(`i${n > 0 ? `` : `.z`}`, {
                    style: { "--v": (n / a).toFixed(3) },
                  }),
                ),
                N(`b.b`, { text: r ? r(n) : String(n) }),
              );
        },
        _ = N(
          `button.en-again.sv-btn-primary`,
          { type: `button`, "data-play-again": `` },
          N(`span`, { text: `Play Again` }),
        );
      _.addEventListener(`click`, () => {
        let e = a ? a.champion : `vyre`;
        (this.app.newMatch({ champion: e, seed: (Math.random() * 1e6) | 0 }),
          this.go(`select`));
      });
      let v = N(
          `button.en-continue.sv-btn-primary`,
          { type: `button`, "data-continue": `` },
          N(`span`, { text: `Continue` }),
        ),
        y = t.artScale(),
        b = N(`div.en-crestart`),
        x = N(`div.en-shards`);
      (t.jobFirst(
        () => dn(i, y),
        (e) => {
          e &&
            ((e.className = `en-crestcv`),
            b.append(e),
            b.classList.add(`ready`));
        },
      ),
        i ||
          t.job(
            () => fn(y),
            (e) => {
              e &&
                ((e.className = `en-crestcv`),
                x.append(e),
                x.classList.add(`ready`));
            },
            0,
          ));
      let C = N(
          `div.sv-screen.sv-end.${i ? `win` : `loss`}`,
          {
            "data-phase": `0`,
            style: {
              "--crest-w": ln.W + `px`,
              "--crest-h": ln.H + `px`,
              "--crest-cx": ln.cx + `px`,
              "--crest-cy": ln.cy + `px`,
            },
          },
          N(`div.en-dim`),
          N(`div.en-dim2`),
          t.bgEl(N(`div.en-bg`, { "aria-hidden": `true` }), () => sn()),
          N(`div.en-bgtint`, { "aria-hidden": `true` }),
          N(`div.en-raysbox`, { "aria-hidden": `true` }, N(`div.en-rays`)),
          N(
            `header.en-head`,
            null,
            N(`div.en-mode`, { text: `Co-op vs. AI` }),
            N(
              `div.en-sub`,
              null,
              N(`span`, { text: `The Sundered Vale` }),
              N(`i`),
              N(`span`, { text: p }),
            ),
          ),
          N(
            `div.en-crest`,
            null,
            x,
            b,
            N(`div.en-word`, { text: i ? `Victory` : `Defeat` }),
          ),
          v,
          (this.endWrap = N(
            `div.en-scrollwrap`,
            null,
            (this.endScroll = N(
              `div.en-scroll`,
              null,
              N(
                `div.en-summary`,
                null,
                a
                  ? N(
                      `div.en-me`,
                      null,
                      t.por(N(`span.en-mepor`), a.champion),
                      N(
                        `div.en-mestats`,
                        null,
                        N(
                          `div.en-mename`,
                          null,
                          N(`b`, { text: a.def.name }),
                          N(`span`, {
                            text: `Level ${a.level} · ${ue[a.role] || ``}`,
                          }),
                        ),
                        N(
                          `div.en-kv`,
                          null,
                          Rr(`KDA`, `${a.kills}/${a.deaths}/${a.assists}`),
                          Rr(`CS`, String(a.cs)),
                          Rr(`Damage`, L(a.damageDealt || 0)),
                          Rr(`Gold`, L(a.totalGold)),
                          Rr(`Duration`, p),
                        ),
                      ),
                    )
                  : null,
              ),
              N(`div.en-table`, null, h(r), h(1 - r)),
              N(
                `div.en-flow`,
                null,
                N(
                  `div.en-flowhead`,
                  null,
                  N(`i`),
                  N(`span`, { text: `Match Comparison` }),
                  N(`i`),
                ),
                g(`Kills`, o[r].kills, o[1 - r].kills),
                g(`Gold`, f(r), f(1 - r), L),
                g(`Turrets`, o[r].towers, o[1 - r].towers),
                g(`Inhibitors`, o[r].inhibitors || 0, o[1 - r].inhibitors || 0),
                g(`Drakes`, o[r].drakes, o[1 - r].drakes),
                g(`Tyrants`, o[r].tyrants, o[1 - r].tyrants),
              ),
            )),
            (this.endMore = N(
              `button.en-more`,
              { type: `button`, "aria-label": `Scroll the summary` },
              (this.endMoreLab = N(`span`, { text: `More below` })),
              N(`i.en-morechev`),
            )),
          )),
          N(`div.en-actions`, null, _),
        ),
        w = 0,
        T = 0,
        E = 0,
        D = le() ? 1 : Mr,
        O = (e) => {
          ((E = e),
            (this.endPhase = e),
            (C.dataset.phase = String(e)),
            t.invalidateRects(),
            e === 2 && requestAnimationFrame(() => this.syncEndScroll()));
        };
      return (
        v.addEventListener(`click`, () => {
          E === 1 && O(2);
        }),
        this.endScroll.addEventListener(`scroll`, () => this.syncEndScroll(), {
          passive: !0,
        }),
        this.endMore.addEventListener(`click`, () => {
          let e = this.endScroll;
          e.scrollBy({
            top: Math.max(120, e.clientHeight * 0.7),
            behavior: `smooth`,
          });
        }),
        this._onEndResize && removeEventListener(`resize`, this._onEndResize),
        (this._onEndResize = () => this.syncEndScroll()),
        addEventListener(`resize`, this._onEndResize),
        (this.endPhase = 0),
        (this.setEndPhase = (e) => {
          this.kind === `end` &&
            e > E &&
            (e >= 1 && E === 0 && (w = D), O(Math.min(2, e)), (T = 0));
        }),
        (this.onLeave = () => {
          ((this.endPhase = 0),
            (this.setEndPhase = () => {}),
            (this._onEndResize &&=
              (removeEventListener(`resize`, this._onEndResize), null)));
        }),
        (this.tick = (e) => {
          let t = Math.max(0, e.dt);
          ((w += t),
            E === 0 && w >= D
              ? (O(1), (T = 0))
              : E === 1 && ((T += t), T >= Nr && O(2)),
            (this._scrollT = (this._scrollT || 0) - t),
            this._scrollT <= 0 &&
              ((this._scrollT = 0.4), E === 2 && this.syncEndScroll()));
        }),
        C
      );
    }
    syncEndScroll() {
      let e = this.endScroll;
      if (!e || !e.isConnected) return;
      let t = e.scrollHeight - e.clientHeight - e.scrollTop,
        n = e.scrollHeight > e.clientHeight + 4 && t > 12;
      if (
        (e.classList.toggle(`can-scroll`, n),
        this.endMore.classList.toggle(`on`, n),
        n)
      ) {
        let t = e.getBoundingClientRect(),
          n = 0;
        for (let r of e.querySelectorAll(`.en-flowrow, .en-row`))
          r.getBoundingClientRect().bottom > t.bottom + 1 && n++;
        this.endMoreLab.textContent =
          n > 1 ? `${n} more rows` : n === 1 ? `1 more row` : `More below`;
      }
    }
  };
function Rr(e, t) {
  return N(`div.en-stat`, null, N(`span`, { text: e }), N(`b`, { text: t }));
}
var zr = 3e3,
  Br = 0,
  Vr = class {
    constructor(e) {
      let t = performance.now();
      ((this.bornAt = t),
        (this.ctx = e),
        (this.app = e.app),
        (this.registry = e.registry),
        (this.prof = !!(this.app.params && this.app.params.has(`hudprof`))),
        (this.root = document.getElementById(`hud-root`)),
        (this.root.innerHTML = ``),
        (this.portraits = new Qt(e.registry)),
        (this.q = [[], [], [], []]),
        (this.frameNo = 0),
        (this.jobBudget = 4),
        (this._pumpT = 0),
        (this.stage = N(`div.sv-stage`)),
        this.root.append(this.stage),
        (this.minimap = new $n(this)),
        (this.game = new xr(this)),
        (this.feed = new Cr(this)),
        this.game.el.append(this.feed.banner, this.feed.list),
        (this.shop = new Or(this)),
        (this.scoreboard = new kr(this)),
        (this.screens = new Lr(this)),
        this.stage.append(
          this.game.el,
          this.shop.el,
          this.scoreboard.el,
          this.screens.el,
        ),
        (this.state = null),
        (this.panel = `none`),
        (this._rects = []),
        (this._rectsDirty = !0),
        (this._rectT = 0),
        (this.s = 1),
        (this._gameFadeT = 0),
        (this._onResize = () => this.layout()),
        addEventListener(`resize`, this._onResize),
        this.layout(),
        (this.dead = !1),
        this.app.on(`ui`, (e) => {
          this.dead || this.setPanel((e && e.panel) || `none`);
        }),
        this.app.on(`match`, (e) => {
          this.dead ||
            (this.feed.clear(),
            this.shop.reset(),
            this.minimap.reset(),
            this.game.closeMenu(),
            (this._rectsDirty = !0),
            this.queuePrebake(e));
        }),
        this.app.on(`state`, () => {
          this.dead || (this._rectsDirty = !0);
        }),
        (this._onKey = (e) => this.onKey(e)),
        addEventListener(`keydown`, this._onKey, !0),
        (this._onKeyUp = (e) => this.onKeyUp(e)),
        addEventListener(`keyup`, this._onKeyUp),
        (this._onPointer = (e) => this.onPointerDown(e)),
        addEventListener(`pointerdown`, this._onPointer, !0),
        this.setPanel(this.app.ui ? this.app.ui.panel : `none`),
        this.app.world && this.queuePrebake(this.app.world),
        this.queueWarmup(),
        this.prof &&
          console.log(
            `[hud] constructed in ${(performance.now() - t).toFixed(1)}ms`,
          ));
    }
    layout() {
      let e = innerWidth,
        t = innerHeight,
        n = ce(e, t);
      this.s = n;
      let r = e / n,
        i = t / n;
      ((this.W = r),
        (this.H = i),
        Object.assign(this.stage.style, {
          width: r + `px`,
          height: i + `px`,
          transform: `scale(${n})`,
        }),
        this.stage.style.setProperty(`--s`, n),
        this.stage.style.setProperty(`--stage-w`, r + `px`),
        this.stage.style.setProperty(`--stage-h`, i + `px`),
        this.stage.classList.toggle(`compact`, i < 920),
        this.stage.classList.toggle(`short`, i < 820),
        this.stage.classList.toggle(`narrow`, r / i > 2.05));
      let a =
        matchMedia(`(pointer: coarse)`).matches || `ontouchstart` in window;
      this.stage.classList.toggle(`touch`, a);
      let o = Math.max(0.6, Math.min(i < 920 ? 0.86 : 1, (i - 104) / 600));
      this.stage.style.setProperty(`--arc-k`, o.toFixed(3));
      let s =
        parseFloat(getComputedStyle(this.stage).getPropertyValue(`--mm`)) ||
        360;
      (this.minimap.resize(s * n, Math.min(2, devicePixelRatio || 1)),
        (this._rectsDirty = !0));
    }
    artScale() {
      return Math.max(
        1,
        Math.min(2, Math.round(this.s * (devicePixelRatio || 1) * 4) / 4),
      );
    }
    porPx() {
      let e = this.artScale();
      return e <= 1 ? 160 : e <= 1.5 ? 224 : 256;
    }
    splashDims(e) {
      let t = Math.min(1.5, this.artScale()),
        [n, r] = e === `select` ? [560, 700] : [300, 480];
      return [Math.round(n * t), Math.round(r * t)];
    }
    bg(e, t, n) {
      let r = typeof n == `string` ? { fb: n } : n || {},
        i = ++Br;
      e._bgTok = i;
      let a = (t) => {
          if (!t || e._bgTok !== i) return;
          let n = () => {
              e._bgTok === i &&
                ((e.style.backgroundImage = r.fb
                  ? `url(${t}), ${r.fb}`
                  : `url(${t})`),
                (e._bgImg = null),
                e.classList.add(`art-in`),
                r.done && r.done(t));
            },
            a = new Image();
          ((a.src = t),
            (e._bgImg = a),
            typeof a.decode == `function` ? a.decode().then(n, n) : n());
        },
        o = (e) => {
          e && typeof e.then == `function` ? e.then(a, () => {}) : a(e);
        },
        s;
      try {
        s = t();
      } catch (t) {
        return (console.error(`[hud art]`, t), e);
      }
      if (xt(s)) {
        let t;
        try {
          t = s.next();
        } catch (t) {
          return (console.error(`[hud art]`, t), e);
        }
        if (t.done) return (o(t.value), e);
        (r.fb &&
          e._bgFb !== r.fb &&
          ((e.style.backgroundImage = r.fb),
          (e._bgFb = r.fb),
          e.classList.remove(`art-in`)),
          this.enqueue({ it: s, el: e, tok: i, done: o }, r.prio ?? 0));
      } else o(s);
      return e;
    }
    bgEl(e, t, n) {
      return (this.bg(e, t, n), e);
    }
    por(e, t, n) {
      let r = this.porPx(),
        i = null,
        a = e.querySelector(`:scope > .sv-quickart`);
      a && a.remove();
      try {
        i = this.portraits.porSync(t, r);
      } catch (e) {
        (console.error(`[hud art]`, e), (i = null));
      }
      return (
        i
          ? ((i.className = `sv-quickart`), e.prepend(i))
          : this.porLater(e, t, n),
        this.bg(e, () => this.portraits.urlArt(t, r), {
          fb: xn(t),
          ...(n || {}),
          done: () => {
            ((i &&= (i.remove(), null)), n && n.done && n.done());
          },
        }),
        e
      );
    }
    porLater(e, t, n) {
      this._porWait ||
        ((this._porWait = new Map()),
        this.portraits.onChange((e, t) => {
          if (t === `splash`) return;
          let n = this._porWait.get(e);
          if (n) {
            this._porWait.delete(e);
            for (let [t, r] of n) t.isConnected && this.por(t, e, r);
          }
        }));
      let r = this._porWait.get(t);
      (r || ((r = new Map()), this._porWait.set(t, r)), r.set(e, n));
    }
    unquick(e) {
      let t = e && e.querySelector(`:scope > .sv-quickart`);
      t && t.remove();
    }
    job(e, t, n = 1) {
      this.enqueue({ fn: e, done: t }, n);
    }
    jobFirst(e, t) {
      this.q[0].unshift({ fn: e, done: t });
    }
    enqueue(e, t) {
      this.q[Math.max(0, Math.min(3, t | 0))].push(e);
    }
    get jobs() {
      return this.q[0].length + this.q[1].length + this.q[2].length;
    }
    budget(e) {
      let t = performance.now(),
        n = this.q[0].length > 0;
      if (e === `game`) {
        if (this._catchUp) {
          let e = this._catchUp;
          return ((this._catchUp = 0), e);
        }
        return this.panel === `shop` || this.panel === `scoreboard`
          ? 16
          : t - Math.max(this.bornAt, this._gameAt || 0) < zr
            ? 24
            : n
              ? 8
              : 4;
      }
      return e === `end` ? 8 : t - (this._stateAt || 0) < 1500 ? 30 : 12;
    }
    nextJob(e) {
      let t = this.frameNo;
      for (let n = 0; n < 4; n++) {
        if (n === 3 && !e) return null;
        let r = this.q[n];
        for (let e = 0; e < r.length; e++)
          if (r[e].waitFrame !== t) return [r, e];
      }
      return null;
    }
    runJobs(e) {
      if (this.dead) return;
      this.frameNo++;
      let t = this.budget(e);
      this.jobBudget = t;
      let n = performance.now(),
        r = 0,
        i = e !== `game` && e !== `end` && !this.app.scenario,
        a = this.panel === `shop` || this.panel === `scoreboard`,
        o =
          e === `select` ||
          e === `loading` ||
          (e === `game` &&
            (a || n - Math.max(this.bornAt, this._gameAt || 0) < zr));
      if (
        this.portraits.queue.length &&
        (o || n - this._pumpT > (e === `game` ? 500 : 150))
      ) {
        let e = this.portraits.pump();
        ((this._pumpT = n),
          this.prof &&
            e > t * 1.5 &&
            console.log(
              `[hud] portrait render ${e.toFixed(1)}ms (budget ${t})`,
            ));
      }
      for (;;) {
        let e = this.nextJob(i);
        if (!e) break;
        let [a, o] = e,
          s = a[o],
          c = a === this.q[3] ? Math.min(t, 6) : t;
        if (r > 0 && performance.now() - n >= c) break;
        r++;
        let l = performance.now();
        try {
          if (s.el && !s.el.isConnected) {
            a.splice(o, 1);
            continue;
          }
          if (s.el && s.el._bgTok !== s.tok) {
            a.splice(o, 1);
            continue;
          }
          if (!s.it) {
            let e = s.fn();
            if (xt(e)) s.it = e;
            else {
              (a.splice(o, 1), Hr(s, e));
              continue;
            }
          }
          let e = s.it.next();
          for (; !e.done && e.value !== _t && performance.now() - n < c; )
            e = s.it.next();
          if (
            (this.prof &&
              performance.now() - l > t * 1.5 &&
              console.log(
                `[hud] job step ${(performance.now() - l).toFixed(1)}ms (budget ${t}, prio ${this.q.indexOf(a)})`,
              ),
            !e.done)
          ) {
            if (e.value === _t) {
              s.waitFrame = this.frameNo;
              continue;
            }
            break;
          }
          let r = a.indexOf(s);
          (r >= 0 && a.splice(r, 1), Hr(s, e.value));
        } catch (e) {
          let t = a.indexOf(s);
          (t >= 0 && a.splice(t, 1), console.error(`[hud job]`, e));
        }
      }
    }
    queueWarmup() {
      if (__mtLoadUI()) return; // [MT-HOOK] mtLoading: no select / loading splash, vale background or spell icons (only the hidden legacy screens used them)
      let e = this.portraits,
        t = (e) => this.enqueue({ fn: e }, 3);
      t(() => sn());
      let [r, i] = this.splashDims(`select`),
        [a, o] = this.splashDims(`loading`);
      for (let a of __mtLT.hudLegacyChamps(n)) t(() => (it(a), e.splashArt(a, r, i))); // [MT-HOOK] hudWarmup (mt: no legacy select splash)
      for (let r of __mtLT.hudLegacyChamps(n)) t(() => e.urlArt(r, this.porPx())); // [MT-HOOK] hudWarmup (mt: no legacy portraits)
      for (let e of __mtLT.hudLegacyChamps(n)) { // [MT-HOOK] hudWarmup (mt: no legacy ability icons)
        let n = x[e];
        for (let e of n.abilities) t(() => Ut(e, n.attackElement, 128));
      }
      for (let r of __mtLT.hudLoadingChamps(n, this.app)) (__mtLT.LEGACY || it(r), t(() => e.splashArt(r, a, o))); // [MT-HOOK] hudWarmup (mt: the trainers' loading-screen splash; its 3D hero render starts now, during boot)
      for (let e of [`flash`, `heal`, `smite`, `ignite`]) t(() => Xt(e, 64));
    }
    queuePrebake(e) {
      if (!e) return;
      if (__mtLoadUI()) return; // [MT-HOOK] mtLoading: no loading-card portraits (and nothing else: the rest is art of hidden legacy panels)
      if (__mtLT.hudPrebake(this, e)) return; // [MT-HOOK] hudPrebake (mt: portraits only, the other prebaked art is for hidden legacy panels)
      let t = e.units && e.units.get(this.app.playerId),
        n = this.portraits,
        r = this.artScale(),
        i = (e) => this.enqueue({ fn: e }, 2);
      for (let t of e.champions) n.want(t.champion);
      i(() => this.minimap.prebake());
      for (let t of e.champions) i(() => n.urlArt(t.champion, this.porPx()));
      if (t) {
        let e = t.def;
        for (let n of e.abilities) i(() => Ut(n, t.attackElement, 192));
        (i(() => Jt(e, 256)), i(() => Yt(160)));
        for (let e of t.spells) i(() => Xt(e.id, 160));
        let n = k[t.champion] || [];
        for (let e of n) i(() => X(e, 128));
        for (let e of Ee(n)) i(() => X(e, 128));
      }
      for (let e of [`flash`, `heal`, `smite`, `ignite`]) i(() => Xt(e, 64));
      for (let e of Object.keys(S)) i(() => X(e, 64));
      for (let [e, t] of [
        [`I`, `storm`],
        [`II`, `storm`],
        [`III`, `storm`],
        [`N`, `storm`],
        [`I`, `fire`],
        [`II`, `fire`],
        [`III`, `fire`],
        [`N`, `fire`],
        [`IN`, `frost`],
        [`IN`, `fire`],
        [`NX`, `storm`],
        [`NX`, `fire`],
      ])
        i(() => At(t, 96, K(e + t)));
      (i(() => dn(!0, r)), i(() => dn(!1, r)), i(() => fn(r)));
    }
    setPanel(e) {
      (e !== `shop` && e !== `scoreboard` && e !== `menu` && (e = `none`),
        e === `menu` && this.state !== `game` && (e = `none`),
        (this.panel = e),
        (this._rectsDirty = !0),
        this.game &&
          (e === `menu` ? this.game.openMenu() : this.game.closeMenu()),
        e === `shop` ? this.shop.open() : this.shop.hide(),
        e === `scoreboard` ? this.scoreboard.open() : this.scoreboard.hide(),
        this.stage.classList.toggle(
          `panel-open`,
          e === `shop` || e === `scoreboard`,
        ));
    }
    modal() {
      return dr(this.app.ui, this.app.paused);
    }
    typing(e) {
      let t = e && e.nodeType === 1 ? e : document.activeElement;
      if (!t) return !1;
      let n = t.tagName;
      return (
        n === `INPUT` ||
        n === `TEXTAREA` ||
        n === `SELECT` ||
        !!t.isContentEditable
      );
    }
    onKey(e) {
      this.state === `game` &&
        (fr(this.state, this.modal(), e.code, this.typing(e.target)) &&
          e.stopImmediatePropagation(),
        e.key === `Tab`
          ? (e.preventDefault(),
            !e.repeat &&
              this.app.ui.panel !== `scoreboard` &&
              ((this._tabPeek = !0),
              this.app.fire(`ui`, { panel: `scoreboard` })))
          : e.key === `Escape` &&
            this.app.ui.panel !== `none` &&
            this.app.fire(`ui`, { panel: `none` }));
    }
    onKeyUp(e) {
      e.key === `Tab` &&
        this._tabPeek &&
        ((this._tabPeek = !1),
        this.app.ui.panel === `scoreboard` &&
          this.app.fire(`ui`, { panel: `none` }));
    }
    onPointerDown(e) {
      if (this.state !== `game` || !this.modal()) return;
      let t = e.target;
      t && t.tagName === `CANVAS` && e.stopImmediatePropagation();
    }
    applyState(e, t) {
      let r = performance.now();
      this._stateAt = r;
      let i = this.state;
      ((this.state = e), (this._rectsDirty = !0));
      let a = this.game.el;
      if (
        (e === `game`
          ? ((this._gameAt = r),
            (this._gameFadeT = 0),
            a.classList.remove(`ending`),
            (a.hidden = !1),
            a.classList.add(`on`),
            i !== `loading` &&
              ((this._catchUp = 170), this.portraits.pumpAll(70)))
          : e === `end` && i === `game`
            ? (a.classList.add(`ending`), (this._gameFadeT = 0.75))
            : ((this._gameFadeT = 0),
              a.classList.remove(`on`, `ending`),
              (a.hidden = !0)),
        e !== `game` && (this.game.closeMenu(), this.minimap.reset()),
        e === `menu` || e === `select` || e === `loading`)
      )
        for (let e of __mtLT.hudLegacyChamps(n)) it(e); // [MT-HOOK] hudWarmup (mt: no 3D hero renders of the 5 legacy champions on menu / loading; the loading cards request their own)
      (e !== `game` &&
        this.app.ui.panel !== `none` &&
        this.app.fire(`ui`, { panel: `none` }),
        this.screens.setState(e, t),
        (this.stage.dataset.state = e),
        (this.lastBuildMs = performance.now() - r),
        this.prof &&
          console.log(`[hud] ${e} built in ${this.lastBuildMs.toFixed(1)}ms`));
    }
    update(e) {
      if (this.dead) return;
      e.state !== this.state && this.applyState(e.state, e);
      let t = e.state;
      (t === `game`
        ? (this.game.update(e),
          this.minimap.tick(e),
          this.minimap.update(
            e,
            this.app.pipeline && this.app.pipeline.cameraRig,
          ),
          this.feed.update(e),
          this.panel === `shop` && this.shop.update(e),
          this.panel === `scoreboard` && this.scoreboard.update(e))
        : this._gameFadeT > 0 &&
          ((this._gameFadeT -= e.dt),
          this._gameFadeT <= 0 &&
            ((this.game.el.hidden = !0),
            this.game.el.classList.remove(`on`, `ending`),
            (this._rectsDirty = !0))),
        this.screens.update(e),
        this.runJobs(t),
        (this._rectT -= e.dt),
        this._rectT <= 0 && ((this._rectT = 1), (this._rectsDirty = !0)));
    }
    rects() {
      if (!this._rectsDirty) return this._rects;
      this._rectsDirty = !1;
      let e = this._rects;
      if (((e.length = 0), this.state === `game`)) {
        if (this.panel !== `none` || (this.game && this.game.menuOpen))
          return (e.push(new DOMRect(0, 0, innerWidth, innerHeight)), e);
        let t = this.stage.querySelectorAll(
          `.sv-minimap, .sv-allies, .sv-score, .sv-stats, .sv-econ, .sv-self, .sv-joystick, .sv-arc, .sv-ap.on, .sv-banner .ann.on`,
        );
        for (let n of t) {
          let t = n.getBoundingClientRect();
          t.width > 0 && t.height > 0 && e.push(t);
        }
        globalThis.__mtHudRects && globalThis.__mtHudRects(e); // [MT-HOOK] mtHudRects (mt HUD panels occlude overlay bars)
      } else
        this.state === `end`
          ? this.screens.endPhase >= 1 &&
            e.push(new DOMRect(0, 0, innerWidth, innerHeight))
          : (this.state === `menu` ||
              this.state === `select` ||
              this.state === `loading`) &&
            e.push(new DOMRect(0, 0, innerWidth, innerHeight));
      return e;
    }
    invalidateRects() {
      this._rectsDirty = !0;
    }
    dispose() {
      this.dead = !0;
      try {
        this.game.dispose();
      } catch {}
      (removeEventListener(`resize`, this._onResize),
        removeEventListener(`keydown`, this._onKey, !0),
        removeEventListener(`keyup`, this._onKeyUp),
        removeEventListener(`pointerdown`, this._onPointer, !0));
      for (let e of this.q) e.length = 0;
      if (
        ((this.portraits.queue.length = 0),
        this.screens && this.screens.onLeave)
      ) {
        try {
          this.screens.onLeave();
        } catch {}
        this.screens.onLeave = null;
      }
      this.root.innerHTML = ``;
    }
  };
function Hr(e, t) {
  e.done &&
    (t && typeof t.then == `function` ? t.then(e.done, () => {}) : e.done(t));
}
export { Vr as default };
