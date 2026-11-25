// Procedural faces built from parts.
//
// Every player gets deterministic "genes" from their id. A face is drawn as
// stacked layers in a 200×200 box (back to front):
//   bg · hairBack · shirt · neck · ears · head · eyes · brows · nose · mouth · facialHair · hairFront · accessory
// v1 draws every layer as vector art. When real art exists, a PNG part in
// public/art/faces/<layer>/<variant>.png (listed in public/art/faces/manifest.json)
// replaces the vector layer. Skin and hair parts are drawn in neutral grey and
// tinted here, so one part sheet covers every skin tone and hair colour.

import { REGION } from './data';

export const SKIN = ['#f7dcc8', '#f0c8a8', '#e4b48f', '#d6a077', '#c58a62', '#ad744e', '#94603f', '#7a4b30', '#603a25', '#4a2c1b'];
export const HAIR = ['#17120f', '#2e211a', '#4a3223', '#6e4a30', '#8e3b22', '#b85a2c', '#9c7745', '#cfa766', '#e5d3a6', '#a3a3a3'];
const EYES = ['#5a3a22', '#2e1f14', '#7a5a2a', '#4f7a4a', '#4a78a8', '#7d8a96'];
// kit colours: [shirt, trim]
const KIT: Record<string, [string, string]> = {
  ESP: ['#c8102e', '#ffc400'], USA: ['#1d3c8f', '#e1243b'], FRA: ['#1d3c8f', '#ffffff'], ITA: ['#1f7fd1', '#ffffff'], GER: ['#1b1b1b', '#e2b300'], GBR: ['#12245c', '#d11f3a'],
  AUS: ['#f2b705', '#0b6b3a'], ARG: ['#7ec3ec', '#ffffff'], BRA: ['#f4d300', '#0b8f3a'], JPN: ['#ffffff', '#c8102e'], CHN: ['#d6201f', '#ffd400'], SRB: ['#c6363c', '#0c4076'],
  CZE: ['#11457e', '#d7141a'], RUS: ['#ffffff', '#0039a6'], CAN: ['#d52b1e', '#ffffff'], SUI: ['#d52b1e', '#ffffff'], NED: ['#ff6a00', '#ffffff'], POL: ['#ffffff', '#dc143c'],
  CRO: ['#e30a17', '#ffffff'], GRE: ['#0d5eaf', '#ffffff'], KAZ: ['#00afca', '#fec50c'], UKR: ['#0057b7', '#ffd700'], BEL: ['#1b1b1b', '#fdda24'], ROU: ['#002b7f', '#fcd116'],
};
const DEFAULT_KIT: [string, string][] = [['#2f6fd0', '#ffffff'], ['#0b6b5a', '#ffd84a'], ['#7b2d8e', '#ffffff'], ['#c0392b', '#1b1b1b'], ['#1b1b1b', '#3ee0cf']];

function hash(str: string) { let h = 2166136261; for (let i = 0; i < str.length; i += 1) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rng(seed: number) { let s = seed || 1; return () => { s = (Math.imul(1664525, s) + 1013904223) >>> 0; return s / 4294967296; }; }
const pick = <T,>(r: () => number, xs: T[]) => xs[Math.floor(r() * xs.length)];
function weighted(r: () => number, ws: number[]) { const t = ws.reduce((a, b) => a + b, 0); let x = r() * t; for (let i = 0; i < ws.length; i += 1) { x -= ws[i]; if (x <= 0) return i; } return ws.length - 1; }
function shade(hex: string, k: number) { const n = parseInt(hex.slice(1), 16); const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * k))); return `#${[f(n >> 16), f((n >> 8) & 255), f(n & 255)].map((v) => v.toString(16).padStart(2, '0')).join('')}`; }

export interface Genes {
  skin: number; head: number; eyes: number; eyeColor: number; brows: number; nose: number; mouth: number;
  hair: number; hairColor: number; facial: number; accessory: number; kit: [string, string]; feminine: boolean; age: number;
}
const SKIN_BY_REGION: Record<string, number[]> = {
  europe: [3, 5, 5, 4, 3, 2, 1, .6, .3, .2], northamerica: [2, 3, 3, 3, 2.5, 2, 2, 2, 1.5, 1], southamerica: [1, 2, 3, 3.5, 3.5, 3, 2, 1.5, .8, .4],
  africa: [.2, .4, .6, 1, 1.5, 2.5, 3.5, 4, 3.5, 3], asia: [1.5, 3, 4, 3.5, 2.5, 1.5, 1, .5, .3, .2], oceania: [3, 4, 3, 2, 1.5, 1.2, 1, .8, .5, .3], other: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
};
export const HAIR_STYLES_M = ['buzz', 'crop', 'sidepart', 'quiff', 'curly', 'afro', 'messy', 'receding', 'bald', 'long', 'manbun'];
export const HAIR_STYLES_F = ['ponytail', 'bun', 'long', 'bob', 'braids', 'curly', 'afro', 'pixie', 'highpony'];
export const ACCESSORIES = ['none', 'headband', 'cap', 'visor', 'bandana', 'none'];

export function genesFor(p: any): Genes {
  const r = rng(hash(String(p?.id ?? 'x')));
  const feminine = p?.tour === 'WTA';
  const region = REGION[p?.country] ?? 'other';
  const skin = weighted(r, SKIN_BY_REGION[region] ?? SKIN_BY_REGION.other);
  const dark = skin >= 6;
  const hairColor = (p?.age ?? 25) >= 33 && r() < .35 ? 9 : dark ? weighted(r, [6, 3, 1, .3, 0, 0, 0, 0, 0, 0]) : weighted(r, [2, 3, 3, 2, .6, .5, 1, 1.2, .4, 0]);
  const styles = feminine ? HAIR_STYLES_F : HAIR_STYLES_M;
  let hair = feminine ? weighted(r, [4, 3, 3, 2, dark ? 2 : .4, 1.5, dark ? 1.5 : .2, 1, 2]) : weighted(r, [3, 4, 3, 2, dark ? 2 : 1, dark ? 2 : .2, 2, (p?.age ?? 25) >= 30 ? 2 : .2, (p?.age ?? 25) >= 28 ? 1 : .2, .8, .6]);
  if (hair >= styles.length) hair = 0;
  return {
    skin, head: Math.floor(r() * 5), eyes: Math.floor(r() * 5), eyeColor: dark ? weighted(r, [5, 4, 1, 0, 0, 0]) : weighted(r, [4, 2, 2, 1.5, 2, 1]),
    brows: Math.floor(r() * 5), nose: Math.floor(r() * 5), mouth: Math.floor(r() * 5), hair, hairColor,
    facial: feminine ? 0 : weighted(r, [5, 2, 1.5, 1, 1]), accessory: weighted(r, [6, 2, 1.1, 1, .6, 0]),
    kit: KIT[p?.country] ?? pick(r, DEFAULT_KIT), feminine, age: p?.age ?? 25,
  };
}

// ---------------------------------------------------------------------------
// Vector parts (v4): semi-realistic illustrated portrait. Adult proportions,
// fine ink outlines, soft two-tone shading (light from the upper left), hair
// built from clumped locks. Each part returns SVG markup for the 200×200 box;
// eye line y 104, nose base ≈ 131, mouth y 145, chin ≈ 168.
// ---------------------------------------------------------------------------
const INK = '#21140d';
type Pt = [number, number];
const f1 = (n: number) => n.toFixed(1);
const pt = (p: Pt) => `${f1(p[0])} ${f1(p[1])}`;
const ell = (cx: number, cy: number, rx: number, ry: number, deg: number): Pt => [cx + Math.cos(deg * Math.PI / 180) * rx, cy + Math.sin(deg * Math.PI / 180) * ry];
const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

// head shapes (adult proportions): temples, cheekbones, jaw angle, chin
const HEAD_DIMS = [
  { w: 42, cb: 43, jx: 33, jy: 148, cw: 10, chin: 170 }, // oval
  { w: 43, cb: 45, jx: 36, jy: 146, cw: 13, chin: 167 }, // round
  { w: 40, cb: 41, jx: 31, jy: 152, cw: 9, chin: 174 }, // long
  { w: 43, cb: 44, jx: 38, jy: 150, cw: 15, chin: 170 }, // square
  { w: 43, cb: 42, jx: 28, jy: 148, cw: 7, chin: 170 }, // heart
];
function dims(v: number, fem: boolean) { const d = HEAD_DIMS[v]; return fem ? { ...d, w: d.w - 1, cb: d.cb - 1.5, jx: d.jx * .88, cw: d.cw * .8, chin: d.chin - 3, jy: d.jy - 2 } : d; }
function headPath(v: number, fem = false) {
  const { w, cb, jx, jy, cw, chin } = dims(v, fem);
  const R = (x: number) => f1(100 + x), Lx = (x: number) => f1(100 - x);
  return `M100 34 C${R(w * .62)} 34 ${R(w)} 52 ${R(w)} 82 C${R(w)} 96 ${R(cb)} 102 ${R(cb)} 114 C${R(cb)} 128 ${R(jx + 2)} ${f1(jy - 8)} ${R(jx)} ${f1(jy)} C${R(jx - 4)} ${f1(jy + 10)} ${R(cw + 6)} ${f1(chin - 2)} ${R(cw)} ${f1(chin)} Q100 ${f1(chin + 2)} ${Lx(cw)} ${f1(chin)}`
    + ` C${Lx(cw + 6)} ${f1(chin - 2)} ${Lx(jx - 4)} ${f1(jy + 10)} ${Lx(jx)} ${f1(jy)} C${Lx(jx + 2)} ${f1(jy - 8)} ${Lx(cb)} 128 ${Lx(cb)} 114 C${Lx(cb)} 102 ${Lx(w)} 96 ${Lx(w)} 82 C${Lx(w)} 52 ${Lx(w * .62)} 34 100 34Z`;
}
function mix(a: string, b: string, t: number) { const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16); const c = (s: number) => Math.round(((A >> s) & 255) * (1 - t) + ((B >> s) & 255) * t); return `#${[c(16), c(8), c(0)].map((v) => v.toString(16).padStart(2, '0')).join('')}`; }

function eyes(g: Genes, uid: string, skin: string) {
  const iris = EYES[g.eyeColor];
  const SH = [{ w: 8.5, h: 4.4, tilt: 1 }, { w: 9.2, h: 3.7, tilt: 2 }, { w: 8.8, h: 3.2, tilt: .5 }, { w: 9, h: 4.9, tilt: 1 }, { w: 8.6, h: 4.1, tilt: -.5 }];
  const { w, h, tilt } = SH[g.eyes];
  const cy = 104, sockets = shade(skin, .86), lidc = shade(skin, .62);
  const one = (cx: number, s: number, id: string) => {
    const inn: Pt = [cx - s * w, cy + .8], out: Pt = [cx + s * w, cy - tilt];
    const c1: Pt = [cx - s * w * .4, cy - h * 1.5], c2: Pt = [cx + s * w * .5, cy - h * 1.45 - tilt * .3];
    const shape = `M${pt(inn)} C${pt(c1)} ${pt(c2)} ${pt(out)} C${f1(cx + s * w * .5)} ${f1(cy + h * .95)} ${f1(cx - s * w * .4)} ${f1(cy + h)} ${pt(inn)}Z`;
    const ix = cx + s * .3, iy = cy + .2, ir = 4.5;
    const top = `M${f1(inn[0] - s * .4)} ${f1(inn[1] - .2)} C${pt(c1)} ${pt(c2)} ${f1(out[0] + s * (g.feminine ? 2.6 : 1))} ${f1(out[1] - (g.feminine ? 1.8 : .4))}`;
    return `<clipPath id="${id}"><path d="${shape}"/></clipPath>
<path d="${shape}" fill="#f3eee7"/>
<g clip-path="url(#${id})">
<circle cx="${f1(ix)}" cy="${f1(iy)}" r="${ir}" fill="url(#${uid}-iris)" stroke="${shade(iris, .45)}" stroke-width=".9"/>
<circle cx="${f1(ix)}" cy="${f1(iy)}" r="1.9" fill="#100a07"/>
<path d="${shape}" fill="none" stroke="#000" stroke-opacity=".18" stroke-width="3" transform="translate(0 -1.2)"/>
<circle cx="${f1(ix - 1.5)}" cy="${f1(iy - 1.7)}" r="1.15" fill="#fff"/>
</g>
<path d="${top}" fill="none" stroke="${INK}" stroke-width="${g.feminine ? 2.3 : 1.9}" stroke-linecap="round"/>
<path d="M${f1(inn[0] + s * 2)} ${f1(cy - h * 1.5 - 3.2)} Q${f1(cx + s * 1)} ${f1(cy - h * 1.8 - 4)} ${f1(out[0] - s * .5)} ${f1(out[1] - h - 2.8)}" fill="none" stroke="${lidc}" stroke-width="1.1" stroke-linecap="round" opacity=".8"/>
<path d="M${f1(inn[0] + s * 1.5)} ${f1(cy + h * .7 + .6)} Q${f1(cx)} ${f1(cy + h + 1.6)} ${f1(out[0] - s * .8)} ${f1(out[1] + h * .6)}" fill="none" stroke="${lidc}" stroke-width=".9" stroke-linecap="round" opacity=".7"/>`;
  };
  return `<defs><radialGradient id="${uid}-iris" cx="50%" cy="60%" r="60%"><stop offset="0" stop-color="${shade(iris, 1.6)}"/><stop offset=".55" stop-color="${iris}"/><stop offset="1" stop-color="${shade(iris, .55)}"/></radialGradient></defs>`
    + one(81, -1, `${uid}-el`) + one(119, 1, `${uid}-er`);
}
function brows(g: Genes) {
  const base = HAIR[g.hairColor === 9 ? 1 : g.hairColor];
  const c = shade(base, g.hairColor >= 6 ? .6 : .85);
  const V = [{ a: 0, arch: 2 }, { a: -1.5, arch: 3.5 }, { a: 2.5, arch: 1 }, { a: .5, arch: 2.5 }, { a: -1, arch: 4 }][g.brows];
  const t = (g.feminine ? 2.2 : 3.2) + (g.brows === 3 ? 1 : 0);
  const by = 92;
  const one = (cx: number, s: number) => {
    const inner: Pt = [cx - s * 10, by + 1.5 + V.a], outer: Pt = [cx + s * 12, by + .5 - V.a * .2];
    return `<path d="M${f1(inner[0])} ${f1(inner[1] - t / 2)} Q${f1(cx + s * 1)} ${f1(by - V.arch - t)} ${pt(outer)} Q${f1(cx + s * 1)} ${f1(by - V.arch + t * .6)} ${f1(inner[0] + s * .5)} ${f1(inner[1] + t / 2)}Z" fill="${c}" opacity=".95"/>`;
  };
  return one(81, -1) + one(119, 1);
}
function nose(g: Genes, skin: string) {
  const d = shade(skin, .6), sd = shade(skin, .8);
  const k = [1, 1.1, 1.25, .9, 1.05][g.nose], ln = [0, 2, 0, -2, 3][g.nose];
  const y = 128 + ln * .5;
  return `<path d="M104.5 96 Q105.5 110 ${f1(106 + k)} ${f1(y - 6)}" stroke="${sd}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".55"/>
<path d="M${f1(100 - 6.5 * k)} ${f1(y - 3)} Q${f1(100 - 9 * k)} ${f1(y + 1.5)} ${f1(100 - 4.5 * k)} ${f1(y + 2.5)}" stroke="${d}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
<path d="M${f1(100 + 6.5 * k)} ${f1(y - 3)} Q${f1(100 + 9 * k)} ${f1(y + 1.5)} ${f1(100 + 4.5 * k)} ${f1(y + 2.5)}" stroke="${d}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
<path d="M${f1(100 - 3.5 * k)} ${f1(y + 3)} Q100 ${f1(y + 4.6)} ${f1(100 + 3.5 * k)} ${f1(y + 3)}" stroke="${d}" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".8"/>
<ellipse cx="102" cy="${f1(y + 6)}" rx="7" ry="1.8" fill="${sd}" opacity=".55"/>
<ellipse cx="99.5" cy="${f1(y - 2)}" rx="2.6" ry="1.8" fill="#fff" opacity=".28"/><path d="M99 102 L99 116" stroke="#fff" stroke-width="2" opacity=".14" stroke-linecap="round"/>`;
}
function mouth(g: Genes, skin: string) {
  const lip = g.feminine ? mix(skin, '#b8434f', .5) : mix(shade(skin, .82), '#a8524c', .28);
  const lo = shade(lip, 1.12), y = 145;
  const mw = [11.5, 11, 12.5, 10, 11.5][g.mouth];
  const cl = [-1.6, 0, -2.2, .4, .3][g.mouth], cr = [-1.6, 0, -2.2, .4, -2.2][g.mouth];
  const Lc: Pt = [100 - mw, y + cl], Rc: Pt = [100 + mw, y + cr];
  const upper = `M${pt(Lc)} Q${f1(100 - mw / 2)} ${f1(y - 4)} 98 ${f1(y - 3)} Q100 ${f1(y - 2)} 102 ${f1(y - 3)} Q${f1(100 + mw / 2)} ${f1(y - 4)} ${pt(Rc)} Q100 ${f1(y + 1.2)} ${pt(Lc)}Z`;
  const lower = `M${f1(Lc[0] + 2)} ${f1(Lc[1] + .6)} Q100 ${f1(y + (g.feminine ? 7.5 : 6))} ${f1(Rc[0] - 2)} ${f1(Rc[1] + .6)} Q100 ${f1(y + 1.4)} ${f1(Lc[0] + 2)} ${f1(Lc[1] + .6)}Z`;
  const teeth = g.mouth === 2 ? `<path d="M${f1(Lc[0] + 2)} ${f1(Lc[1] + .3)} Q100 ${f1(y + 4)} ${f1(Rc[0] - 2)} ${f1(Rc[1] + .3)} Q100 ${f1(y + .4)} ${f1(Lc[0] + 2)} ${f1(Lc[1] + .3)}Z" fill="#f4f1ea"/>` : '';
  return `<path d="${lower}" fill="${lo}"/>${teeth}<path d="${upper}" fill="${lip}"/>
<path d="M${pt(Lc)} Q100 ${f1(y + (g.mouth === 2 ? 2.4 : 1))} ${pt(Rc)}" fill="none" stroke="${shade(lip, .5)}" stroke-width="1.4" stroke-linecap="round"/>
<ellipse cx="100" cy="${f1(y + 4.2)}" rx="3.5" ry="1" fill="#fff" opacity=".2"/>
<ellipse cx="100" cy="${f1(y + 9.5)}" rx="6" ry="1.8" fill="${shade(skin, .8)}" opacity=".45"/>`;
}
function facial(g: Genes) {
  if (!g.facial) return '';
  const c = HAIR[g.hairColor], d = shade(c, .72);
  const beard = 'M56 112 C58 146 78 170 100 172 C122 170 142 146 144 112 C140 128 130 136 118 138 Q112 154 100 155 Q88 154 82 138 C70 136 60 128 56 112Z';
  const tache = `<path d="M86 141 Q93 136 100 138.5 Q107 136 114 141 Q107 141.5 100 140 Q93 141.5 86 141Z" fill="${c}" stroke="${shade(c, .6)}" stroke-width=".8"/>`;
  if (g.facial === 1) return `<path d="${beard}" fill="${c}" opacity=".2"/><path d="M88 140 Q100 136 112 140" stroke="${c}" stroke-width="3" opacity=".2" fill="none"/>`;
  if (g.facial === 2) return `<path d="${beard}" fill="${c}" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/><path d="M122 152 C134 142 142 130 144 114 C143 136 134 154 112 168 C117 162 120 158 122 152Z" fill="${d}"/><path d="M72 146 q4 6 9 9 M120 156 q6 -3 9 -9 M96 162 q4 2 8 0" stroke="${d}" stroke-width="1.2" fill="none" stroke-linecap="round"/>` + tache;
  if (g.facial === 3) return tache;
  return `<path d="M92 153 Q100 170 108 153 Q100 156 92 153Z" fill="${c}" stroke="${shade(c, .6)}" stroke-width="1"/>` + tache;
}

// --- hair -----------------------------------------------------------------
interface FrontSpec { vol: number; hy: number; n: number; len: number; sweep: number; edge: 'smooth' | 'spiky' | 'curly'; side: number; jit?: number; part?: number }
function frontPath(s: FrontSpec, r: () => number) {
  const { vol, hy, n, len, sweep, edge, side } = s; const jit = s.jit ?? .25;
  const hry = 98 - hy;
  const ocx = 100, ocy = 86, orx = 46 + vol, ory = 52 + vol;
  const a0 = 165, a1 = 375;
  const start = ell(ocx, ocy, orx, ory, a0), end = ell(ocx, ocy, orx, ory, a1);
  let d = `M${pt(start)}`;
  if (edge === 'smooth') d += ` A${f1(orx)} ${f1(ory)} 0 1 1 ${pt(end)}`;
  else {
    const m = edge === 'curly' ? 11 + Math.round(vol / 3) : 9;
    let prev = start;
    for (let i = 1; i <= m; i += 1) {
      const b = ell(ocx, ocy, orx, ory, a0 + (a1 - a0) * i / m);
      const mid = lerp(prev, b, .5); const nx = mid[0] - ocx, ny = mid[1] - ocy, nl = Math.hypot(nx, ny); const u: Pt = [nx / nl, ny / nl];
      if (edge === 'curly') { const k = 9 + r() * 5; d += ` Q${pt([mid[0] + u[0] * k * 2, mid[1] + u[1] * k * 2])} ${pt(b)}`; }
      else {
        const k = 7 + r() * 8; const tip: Pt = [mid[0] + u[0] * k + (r() - .3) * 6, mid[1] + u[1] * k];
        d += ` Q${pt([lerp(prev, tip, .5)[0] + u[0] * 2, lerp(prev, tip, .5)[1] + u[1] * 2])} ${pt(tip)} Q${pt(lerp(tip, b, .55))} ${pt(b)}`;
      }
      prev = b;
    }
  }
  const valleys: Pt[] = Array.from({ length: n + 1 }, (_, i) => ell(100, 98, 45, hry, 345 - 150 * i / n));
  const tipR: Pt = [100 + 45 + vol * .25, 98 + side], tipL: Pt = [100 - 45 - vol * .25, 98 + side];
  d += ` Q${pt([end[0] + 1, (end[1] + tipR[1]) / 2])} ${pt(tipR)} Q${pt([tipR[0] - 5, (tipR[1] + valleys[0][1]) / 2])} ${pt(valleys[0])}`;
  for (let i = 0; i < n; i += 1) {
    const a = valleys[i], b = valleys[i + 1];
    const mid = ell(100, 98, 45, hry, 345 - 150 * (i + .5) / n);
    const dx = 100 - mid[0], dy = 124 - mid[1], dl = Math.hypot(dx, dy);
    const L = edge === 'curly' ? len * (.7 + r() * .5) : len * (1 - jit + 2 * jit * r());
    const tip: Pt = [mid[0] + dx / dl * L + sweep * (.6 + .8 * r()), mid[1] + dy / dl * L];
    if (edge === 'curly') d += ` Q${pt([tip[0] + 4, tip[1] + 3])} ${pt(lerp(a, b, .5))} Q${pt([tip[0] - 4, tip[1] + 3])} ${pt(b)}`;
    else d += ` Q${pt([a[0] + (tip[0] - a[0]) * .2, a[1] + (tip[1] - a[1]) * .75])} ${pt(tip)} Q${pt([b[0] + (tip[0] - b[0]) * .15, b[1] + (tip[1] - b[1]) * .35])} ${pt(b)}`;
  }
  d += ` Q${pt([tipL[0] + 5, (tipL[1] + valleys[n][1]) / 2])} ${pt(tipL)} Q${pt([start[0] - 1, (start[1] + tipL[1]) / 2])} ${pt(start)}Z`;
  return { d, valleys, orx, ory };
}
// closed scalloped blob (afro / curly back)
function blob(cx: number, cy: number, rx: number, ry: number, n: number, r: () => number) {
  let d = ''; let prev = ell(cx, cy, rx, ry, 0); d = `M${pt(prev)}`;
  for (let i = 1; i <= n; i += 1) {
    const b = ell(cx, cy, rx, ry, 360 * i / n); const mid = lerp(prev, b, .5);
    const nx = mid[0] - cx, ny = mid[1] - cy, nl = Math.hypot(nx, ny); const k = 9 + r() * 6;
    d += ` Q${pt([mid[0] + nx / nl * k * 2, mid[1] + ny / nl * k * 2])} ${pt(b)}`; prev = b;
  }
  return d + 'Z';
}
function hairStyle(g: Genes) { return (g.feminine ? HAIR_STYLES_F : HAIR_STYLES_M)[g.hair] ?? 'none'; }
const FRONT: Record<string, FrontSpec | null> = {
  buzz: { vol: 1.2, hy: 64, n: 14, len: 2, sweep: 0, edge: 'smooth', side: 6, jit: .2 },
  crop: { vol: 4, hy: 62, n: 9, len: 7, sweep: 4, edge: 'smooth', side: 10, jit: .45 },
  sidepart: { vol: 6, hy: 62, n: 8, len: 9, sweep: -9, edge: 'smooth', side: 10, part: 1 },
  quiff: { vol: 11, hy: 60, n: 7, len: 4, sweep: 4, edge: 'spiky', side: 8, jit: .4 },
  curly: { vol: 9, hy: 64, n: 10, len: 7, sweep: 0, edge: 'curly', side: 10 },
  afro: { vol: 18, hy: 60, n: 10, len: 5, sweep: 0, edge: 'curly', side: 12 },
  messy: { vol: 8, hy: 64, n: 10, len: 11, sweep: 4, edge: 'spiky', side: 12, jit: .45 },
  receding: { vol: 3, hy: 52, n: 5, len: 3, sweep: 0, edge: 'smooth', side: 12 },
  bald: null,
  long: { vol: 6, hy: 64, n: 8, len: 12, sweep: -3, edge: 'smooth', side: 56 },
  manbun: { vol: 3, hy: 60, n: 8, len: 3, sweep: 0, edge: 'smooth', side: 8 },
  ponytail: { vol: 4, hy: 62, n: 7, len: 11, sweep: -9, edge: 'smooth', side: 18 },
  bun: { vol: 4, hy: 62, n: 7, len: 8, sweep: 7, edge: 'smooth', side: 18 },
  bob: { vol: 9, hy: 66, n: 11, len: 14, sweep: -2, edge: 'smooth', side: 42, jit: .15 },
  braids: { vol: 3, hy: 60, n: 8, len: 3, sweep: 0, edge: 'smooth', side: 10 },
  pixie: { vol: 6, hy: 64, n: 8, len: 12, sweep: -11, edge: 'spiky', side: 14, jit: .35 },
  highpony: { vol: 4, hy: 60, n: 7, len: 6, sweep: 7, edge: 'smooth', side: 16 },
};
// paints a hair shape: base gradient, cel shadow on the right, lock strands, highlight, ink outline
function paintHair(d: string, id: string, c: string, opts: { dark?: boolean; valleys?: Pt[]; hl?: { rx: number; ry: number }; outline?: boolean } = {}) {
  const base = opts.dark ? shade(c, .78) : c;
  const dk = shade(base, .72), hi = shade(c, c === HAIR[0] ? 2.6 : 1.4);
  const strands = (opts.valleys ?? []).slice(1, -1).map((v) => { const e = lerp(v, [100, 34], .55); const m = lerp(v, e, .5); return `<path d="M${pt(v)} Q${pt([m[0] + (v[0] < 100 ? -4 : 4), m[1]])} ${pt(e)}" stroke="${dk}" stroke-width="1.2" stroke-linecap="round" fill="none"/>`; }).join('');
  const hl = opts.hl ? `<path d="M${pt(ell(100, 86, opts.hl.rx - 10, opts.hl.ry - 10, 206))} A${f1(opts.hl.rx - 10)} ${f1(opts.hl.ry - 10)} 0 0 1 ${pt(ell(100, 86, opts.hl.rx - 10, opts.hl.ry - 10, 252))}" stroke="${hi}" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="7 4 12 5" fill="none" opacity=".55"/><path d="M${pt(ell(100, 86, opts.hl.rx - 9, opts.hl.ry - 9, 260))} A${f1(opts.hl.rx - 9)} ${f1(opts.hl.ry - 9)} 0 0 1 ${pt(ell(100, 86, opts.hl.rx - 9, opts.hl.ry - 9, 274))}" stroke="${hi}" stroke-width="3" stroke-linecap="round" fill="none" opacity=".45"/>` : '';
  return `<clipPath id="${id}"><path d="${d}"/></clipPath><path d="${d}" fill="${base}"/>
<g clip-path="url(#${id})"><path d="M128 0 C160 40 166 110 150 200 L210 200 L210 0Z" fill="${dk}" opacity=".85"/><rect x="0" y="0" width="200" height="200" fill="url(#${id}-g)"/>${strands}${hl}</g>
<defs><linearGradient id="${id}-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".12"/><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient></defs>
${opts.outline === false ? '' : `<path d="${d}" fill="none" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`}`;
}
function hairParts(g: Genes, uid: string, seed: number): { back: string; front: string; shadow: string } {
  const c = HAIR[g.hairColor];
  const r = rng(seed);
  const style = hairStyle(g);
  const spec = FRONT[style];
  let front = '', shadow = '', back = '';
  if (spec) {
    const fp = frontPath(spec, r);
    shadow = fp.d;
    front = paintHair(fp.d, `${uid}-hf`, c, { valleys: spec.edge === 'curly' ? [] : fp.valleys, hl: style === 'buzz' ? undefined : { rx: fp.orx, ry: fp.ory } });
    if (style === 'buzz') front = `<g opacity=".92">${front}</g>`;
    if (spec.part) front += `<path d="M78 46 Q82 58 78 70" stroke="${shade(c, .6)}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  } else if (style === 'bald') {
    front = `<path d="M78 52 Q92 44 110 46" stroke="#fff" stroke-width="5" opacity=".28" stroke-linecap="round" fill="none"/>`;
  }
  const B = (d: string, k = 'hb') => paintHair(d, `${uid}-${k}`, c, { dark: true });
  switch (style) {
    case 'long': back = B(`M50 92 A50 58 0 0 1 150 92 L156 190 Q148 198 142 190 Q136 199 128 191 L72 191 Q64 199 58 190 Q52 198 44 190Z`); break;
    case 'bob': back = B(`M48 94 A52 60 0 0 1 152 94 L154 140 Q152 152 140 152 Q136 158 128 152 L72 152 Q64 158 60 152 Q48 152 46 140Z`); break;
    case 'ponytail': back = B(`M126 58 C170 52 180 112 162 160 Q158 170 152 162 C154 140 150 126 140 116 C148 98 144 80 126 74Z`) + `<path d="M132 62 Q142 66 140 78" stroke="${g.kit[1] === '#ffffff' ? g.kit[0] : g.kit[1]}" stroke-width="5" stroke-linecap="round" fill="none"/>`; break;
    case 'highpony': back = B(`M94 38 C114 2 170 16 168 66 C166 104 156 128 146 146 C148 116 146 86 130 64 C120 50 108 44 94 38Z`) + `<ellipse cx="101" cy="36" rx="9" ry="5" fill="${g.kit[1] === '#ffffff' ? g.kit[0] : g.kit[1]}" stroke="${INK}" stroke-width="1.8"/>`; break;
    case 'bun': back = B(`M100 14 C112 14 120 22 120 33 C120 44 111 50 100 50 C89 50 80 44 80 33 C80 22 88 14 100 14Z`) + `<path d="M88 26 Q100 18 112 28 M86 36 Q100 28 114 38" stroke="${shade(c, .55)}" stroke-width="1.6" fill="none"/>`; break;
    case 'manbun': back = B(`M100 18 C109 18 115 24 115 32 C115 40 108 45 100 45 C92 45 85 40 85 32 C85 24 91 18 100 18Z`); break;
    case 'afro': back = B(blob(100, 80, 58, 56, 16, r)); break;
    case 'curly': back = g.feminine ? B(blob(100, 100, 54, 62, 16, r)) : ''; break;
    default: break;
  }
  if (style === 'braids') {
    const braid = (x: number) => Array.from({ length: 7 }, (_, k) => `<ellipse cx="${x + (k % 2 ? 1.2 : -1.2)}" cy="${116 + k * 10}" rx="4.6" ry="6" transform="rotate(${k % 2 ? 25 : -25} ${x} ${116 + k * 10})" fill="${k % 2 ? shade(c, .85) : c}" stroke="${INK}" stroke-width="1.2"/>`).join('');
    front += braid(53) + braid(147);
  }
  return { back, front, shadow };
}
function accessory(g: Genes) {
  const [k1, k2] = g.kit;
  const band = k2 === '#ffffff' ? k1 : k2;
  const ink = `stroke="${INK}" stroke-width="1.9" stroke-linejoin="round"`;
  switch (ACCESSORIES[g.accessory]) {
    case 'headband': return `<path d="M54 82 Q100 58 146 82 L146 92 Q100 68 54 92Z" fill="${band}" ${ink}/><path d="M56 87 Q100 63 144 87" stroke="#fff" stroke-width="1.6" opacity=".55" fill="none"/>`;
    case 'cap': return `<g transform="translate(100 84) scale(.9 .8) translate(-100 -110)"><path d="M46 99 C44 50 72 28 100 28 C128 28 156 50 154 99 Q100 86 46 99Z" fill="${k1}" ${ink}/><path d="M118 32 C140 42 152 62 154 98 Q140 94 128 92 C130 70 126 48 118 32Z" fill="${shade(k1, .78)}"/><path d="M100 30 Q104 60 100 89" stroke="${shade(k1, .6)}" stroke-width="1.6" fill="none"/><circle cx="100" cy="30" r="3.2" fill="${k2}" stroke="${INK}" stroke-width="1.5"/><path d="M78 60 h12 M110 60 h12" stroke="${k2}" stroke-width="4" stroke-linecap="round"/>
<path d="M38 99 Q100 80 162 99 Q158 113 100 111 Q42 113 38 99Z" fill="${shade(k1, .85)}" ${ink}/><path d="M44 104 Q100 92 156 104 Q150 110 100 109 Q50 110 44 104Z" fill="${shade(k1, .55)}"/></g>`;
    case 'visor': return `<g transform="translate(100 80) scale(.9 .86) translate(-100 -100)"><path d="M48 93 Q100 70 152 93 L152 101 Q100 80 48 101Z" fill="${k1}" ${ink}/><path d="M40 100 Q100 84 160 100 Q156 112 100 110 Q44 112 40 100Z" fill="${shade(k1, .85)}" ${ink}/><path d="M46 104 Q100 94 154 104 Q148 109 100 108.5 Q52 109 46 104Z" fill="${shade(k1, .55)}"/>`;
    case 'bandana': return `<g transform="translate(100 84) scale(.9 .94) translate(-100 -90)"><path d="M47 96 C46 52 74 34 100 34 C126 34 154 52 153 96 Q100 80 47 96Z" fill="${band}" ${ink}/><path d="M150 84 l18 4 l-6 10 l12 10 l-16 -2 l-6 -10Z" fill="${band}" ${ink}/><g fill="#fff" opacity=".55"><circle cx="76" cy="62" r="2.2"/><circle cx="96" cy="50" r="2.2"/><circle cx="118" cy="56" r="2.2"/><circle cx="134" cy="72" r="2.2"/><circle cx="88" cy="74" r="2.2"/><circle cx="112" cy="76" r="2.2"/></g></g>`;
    default: return '';
  }
}

// ---------------------------------------------------------------------------
// Art override: PNG parts listed in public/art/faces/manifest.json
// { "head": ["0","1"], "hairFront": ["ponytail"], ... }. Tinted layers are
// drawn in neutral grey (#808080 = base tone) and coloured with an SVG filter.
// ---------------------------------------------------------------------------
let manifest: Record<string, string[]> | null = null;
const listeners = new Set<() => void>();
export function loadFaceArt() {
  if (manifest || typeof fetch === 'undefined') return;
  manifest = {};
  fetch(`${import.meta.env.BASE_URL}art/faces/manifest.json`).then((r) => (r.ok ? r.json() : {})).then((m) => { manifest = m || {}; cache.clear(); listeners.forEach((f) => f()); }).catch(() => { /* no art yet */ });
}
export function onFaceArt(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; }
const has = (layer: string, v: string) => !!manifest?.[layer]?.includes(v);
const artHref = (layer: string, v: string) => `${typeof location !== 'undefined' ? location.origin : ''}${import.meta.env.BASE_URL}art/faces/${layer}/${v}.png`;
function tintFilter(id: string, hex: string) {
  const n = parseInt(hex.slice(1), 16); const r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  // multiply-style tint around mid grey
  return `<filter id="${id}"><feColorMatrix type="matrix" values="${r * 2} 0 0 0 0  0 ${g * 2} 0 0 0  0 0 ${b * 2} 0 0  0 0 0 1 0"/></filter>`;
}
const img = (layer: string, v: string, filter?: string) => `<image href="${artHref(layer, v)}" x="0" y="0" width="200" height="200"${filter ? ` filter="url(#${filter})"` : ''}/>`;

const cache = new Map<string, string>();
export function faceSvg(p: any, { round = false, genes }: { round?: boolean; genes?: Partial<Genes> } = {}): string {
  const key = `${p?.id}|${p?.age}|${round}`;
  const hit = genes ? null : cache.get(key); if (hit) return hit;
  const g = { ...genesFor(p), ...(genes ?? {}) };
  const skin = SKIN[g.skin], hair = HAIR[g.hairColor];
  const [k1, k2] = g.kit;
  const seed = hash(`${p?.id ?? 'x'}#hair`);
  const uid = `f${(hash(String(p?.id)) % 1e8).toString(36)}`;
  const { back, front, shadow } = g.hair < 0 ? { back: '', front: '', shadow: '' } : hairParts(g, uid, seed);
  const style = hairStyle(g);
  const acc = ACCESSORIES[g.accessory];
  const hd = dims(g.head, g.feminine);
  const HP = headPath(g.head, g.feminine);
  const L = (layer: string, variant: string | number, vector: string, tint?: 'skin' | 'hair') => has(layer, String(variant)) ? img(layer, String(variant), tint ? `${uid}-${tint}` : undefined) : vector;
  const sk2 = shade(skin, .84), sk3 = shade(skin, .72);
  const collar = k2 === '#ffffff' || k1 === '#ffffff' ? (k1 === '#ffffff' ? k2 : '#ffffff') : k2;
  const nx0 = g.feminine ? 87 : 83;
  const ex = 100 + hd.w + 1.5;
  const castFrom = acc === 'cap' ? 'M40 75 Q100 60 160 75 Q156 86 100 84 Q44 86 40 75Z' : shadow;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
<defs>${tintFilter(`${uid}-skin`, skin)}${tintFilter(`${uid}-hair`, hair)}
<radialGradient id="${uid}-bg" cx="50%" cy="30%" r="80%"><stop offset="0" stop-color="${shade(k1, 1.2)}"/><stop offset=".7" stop-color="${shade(k1, .6)}"/><stop offset="1" stop-color="${shade(k1, .35)}"/></radialGradient>
<filter id="${uid}-blur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.6"/></filter>
<clipPath id="${uid}-hc"><path d="${HP}"/></clipPath>
<clipPath id="${uid}-sc"><path d="M6 200 C8 182 28 172 60 167 L84 162 Q100 173 116 162 L140 167 C172 172 192 182 194 200Z"/></clipPath>
${round ? `<clipPath id="${uid}-c"><circle cx="100" cy="100" r="100"/></clipPath>` : ''}</defs>
<g${round ? ` clip-path="url(#${uid}-c)"` : ''}>
<rect width="200" height="200" fill="url(#${uid}-bg)"/>
<circle cx="100" cy="96" r="78" fill="#fff" opacity=".07"/>
<g transform="translate(100 112) scale(1.1) translate(-100 -112)">
${L('hairBack', style, back, 'hair')}
${L('shirt', 'base', `<path d="M6 200 C8 182 28 172 60 167 L84 162 Q100 173 116 162 L140 167 C172 172 192 182 194 200Z" fill="${k1}"/>
<g clip-path="url(#${uid}-sc)"><path d="M134 158 C152 176 162 188 162 200 L200 200 L200 158Z" fill="#000" opacity=".2"/><path d="M8 184 Q40 170 62 168 M138 168 Q160 170 192 184" stroke="${k2}" stroke-width="5" fill="none" opacity=".9"/><path d="M46 200 C47 188 52 178 58 170 M154 200 C153 188 148 178 142 170" stroke="${INK}" stroke-width="1.2" opacity=".35" fill="none"/></g>
<path d="M6 200 C8 182 28 172 60 167 L84 162 Q100 173 116 162 L140 167 C172 172 192 182 194 200" fill="none" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
<path d="M100 173 L100 196" stroke="${INK}" stroke-width="1.4" opacity=".55"/><circle cx="100" cy="181" r="1.7" fill="${collar}" stroke="${INK}" stroke-width="1"/><circle cx="100" cy="189" r="1.7" fill="${collar}" stroke="${INK}" stroke-width="1"/>`)}
${L('neck', 'base', `<path d="M${nx0} 138 C${nx0 + 1} 152 ${nx0 - 2} 160 ${nx0 - 6} 166 Q100 178 ${200 - nx0 + 6} 166 C${200 - nx0 + 2} 160 ${200 - nx0 - 1} 152 ${200 - nx0} 138Z" fill="${sk2}" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/><path d="M${nx0 + .5} 142 L${200 - nx0 - .5} 142 L${200 - nx0 - .5} ${hd.chin - 4} Q100 ${hd.chin + 6} ${nx0 + .5} ${hd.chin - 4}Z" fill="${sk3}"/>${g.feminine ? '' : `<path d="M${nx0 + 4} 150 Q${nx0 + 8} 160 ${nx0 + 14} 166 M${196 - nx0} 150 Q${192 - nx0} 160 ${186 - nx0} 166" stroke="${sk3}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`}`, 'skin')}
${L('shirt', 'collar', `<path d="M84 161 L74 174 L96 180 L100 170Z" fill="${collar}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/><path d="M116 161 L126 174 L104 180 L100 170Z" fill="${shade(collar, .86)}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`)}
${L('ears', 'base', `<path d="M${200 - ex + 3} 100 C${200 - ex - 6} 96 ${200 - ex - 8} 104 ${200 - ex - 7} 112 C${200 - ex - 6} 122 ${200 - ex - 2} 128 ${200 - ex + 4} 127Z" fill="${skin}" stroke="${INK}" stroke-width="1.7" stroke-linejoin="round"/><path d="M${ex - 3} 100 C${ex + 6} 96 ${ex + 8} 104 ${ex + 7} 112 C${ex + 6} 122 ${ex + 2} 128 ${ex - 4} 127Z" fill="${sk2}" stroke="${INK}" stroke-width="1.7" stroke-linejoin="round"/><path d="M${200 - ex - 1} 104 q-3 5 -1 11 q2 3 3 6 M${ex + 1} 104 q3 5 1 11 q-2 3 -3 6" stroke="${sk3}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`, 'skin')}
${L('head', g.head, `<path d="${HP}" fill="${skin}"/>`, 'skin')}
<g clip-path="url(#${uid}-hc)">
<path filter="url(#${uid}-blur)" d="M124 30 C146 56 150 110 138 140 C128 160 112 170 100 174 L200 174 L200 30Z" fill="${sk2}" opacity=".9"/>
<g filter="url(#${uid}-blur)"><ellipse cx="136" cy="124" rx="9" ry="16" fill="${sk3}" opacity=".5"/><ellipse cx="64" cy="126" rx="6" ry="13" fill="${sk3}" opacity=".3"/><ellipse cx="100" cy="${hd.chin - 3}" rx="16" ry="5" fill="${sk3}" opacity=".35"/><ellipse cx="80" cy="99" rx="11" ry="6" fill="${sk3}" opacity=".45"/><ellipse cx="120" cy="99" rx="11" ry="6" fill="${sk3}" opacity=".55"/><ellipse cx="100" cy="150" rx="18" ry="3" fill="#fff" opacity=".0"/></g>
${g.age >= 31 ? `<path d="M89 131 Q86 138 88 145 M111 131 Q114 138 112 145" stroke="${sk3}" stroke-width="1.1" fill="none" opacity=".35" stroke-linecap="round"/>` : ''}
<path d="M58 132 C70 156 90 160 100 160 C110 160 130 156 142 132 C134 156 116 164 100 164 C84 164 66 156 58 132Z" fill="${sk3}" opacity=".5"/>
${castFrom ? `<path filter="url(#${uid}-blur)" d="${castFrom}" transform="translate(2 7)" fill="${sk3}" opacity=".8"/>` : ''}
<ellipse cx="72" cy="122" rx="9" ry="5" fill="#e0706e" opacity="${g.feminine ? .2 : .08}"/><ellipse cx="128" cy="122" rx="9" ry="5" fill="#e0706e" opacity="${g.feminine ? .2 : .08}"/>
<ellipse cx="84" cy="62" rx="16" ry="8" fill="#fff" opacity=".13"/><ellipse cx="76" cy="116" rx="7" ry="4" fill="#fff" opacity=".1"/>
</g>
<path d="${HP}" fill="none" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
${L('eyes', g.eyes, eyes(g, uid, skin))}
${L('brows', g.brows, brows(g), 'hair')}
${L('nose', g.nose, nose(g, skin), 'skin')}
${L('mouth', g.mouth, mouth(g, skin))}
${L('facialHair', g.facial, facial(g), 'hair')}
${acc === 'cap' ? `<path d="M48 98 Q46 110 52 118 L56 102Z M152 98 Q154 110 148 118 L144 102Z" fill="${hair}" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>` : L('hairFront', style, front, 'hair')}
${L('accessory', acc, accessory(g))}
</g></g></svg>`;
  if (!genes) cache.set(key, svg);
  if (cache.size > 600) cache.delete(cache.keys().next().value as string);
  return svg;
}
const urlCache = new Map<string, string>();
export function faceUrl(p: any, round = false) {
  const key = `${p?.id}|${p?.age}|${round}|${manifest ? Object.keys(manifest).length : 0}`;
  let u = urlCache.get(key);
  if (!u) { u = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(faceSvg(p, { round }))}`; urlCache.set(key, u); if (urlCache.size > 600) urlCache.delete(urlCache.keys().next().value as string); }
  return u;
}
