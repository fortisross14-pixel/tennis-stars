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
// Vector parts (v3): chibi bust style. Thick ink outlines, two-tone cel
// shading (light from the upper left), big almond eyes with heavy lids,
// hair built from clumped locks. Each part returns SVG markup for the
// 200×200 box; the eye line is y 112, mouth y 143, chin ≈ 160.
// ---------------------------------------------------------------------------
const INK = '#21140d';
type Pt = [number, number];
const f1 = (n: number) => n.toFixed(1);
const pt = (p: Pt) => `${f1(p[0])} ${f1(p[1])}`;
const ell = (cx: number, cy: number, rx: number, ry: number, deg: number): Pt => [cx + Math.cos(deg * Math.PI / 180) * rx, cy + Math.sin(deg * Math.PI / 180) * ry];
const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

// head shapes: half-width at the temples, cheeks, jaw and chin y
const HEAD_DIMS = [
  { w: 47, cheek: 43, jaw: 22, chin: 160 }, // oval
  { w: 49, cheek: 46, jaw: 28, chin: 157 }, // round
  { w: 45, cheek: 41, jaw: 20, chin: 164 }, // long
  { w: 48, cheek: 46, jaw: 33, chin: 159 }, // square
  { w: 49, cheek: 42, jaw: 15, chin: 161 }, // heart
];
function headPath(v: number) {
  const { w, cheek, jaw, chin } = HEAD_DIMS[v];
  const R = (x: number) => f1(100 + x), Lx = (x: number) => f1(100 - x);
  return `M100 40 C${R(w * .6)} 40 ${R(w)} 58 ${R(w)} 92 C${R(w)} 106 ${R(cheek + 3)} 116 ${R(cheek)} 127 C${R(cheek - 5)} 142 ${R(jaw + 6)} ${chin - 3} 100 ${chin}`
    + ` C${Lx(jaw + 6)} ${chin - 3} ${Lx(cheek - 5)} 142 ${Lx(cheek)} 127 C${Lx(cheek + 3)} 116 ${Lx(w)} 106 ${Lx(w)} 92 C${Lx(w)} 58 ${Lx(w * .6)} 40 100 40Z`;
}
const HEADS = [0, 1, 2, 3, 4].map(headPath);

function eyes(g: Genes, uid: string) {
  const iris = EYES[g.eyeColor];
  const SH = [{ w: 11.5, h: 10.5, tilt: -2 }, { w: 12.5, h: 9, tilt: -3.5 }, { w: 12, h: 7.6, tilt: -1 }, { w: 12, h: 11.5, tilt: -1.5 }, { w: 11.5, h: 9.5, tilt: .5 }];
  const { w, h, tilt } = SH[g.eyes];
  const cy = 112, th = g.feminine ? 3.8 : 3.1;
  const one = (cx: number, s: number, id: string) => {
    const inn: Pt = [cx - s * w * .95, cy + 1], out: Pt = [cx + s * w, cy + tilt];
    const c1: Pt = [cx - s * w * .55, cy - h * 1.05], c2: Pt = [cx + s * w * .55, cy - h * 1.1 + tilt * .3];
    const shape = `M${pt(inn)} C${pt(c1)} ${pt(c2)} ${pt(out)} C${f1(cx + s * w * .6)} ${f1(cy + h * .75)} ${f1(cx - s * w * .5)} ${f1(cy + h * .8)} ${pt(inn)}Z`;
    const ix = cx + s * .6, iy = cy + 1.2, irx = w * .55, iry = h * .95;
    const flick: Pt = [out[0] + s * 3.8, out[1] - 2.8];
    const lid = `M${f1(inn[0] - s * .6)} ${f1(inn[1] + .4)} C${f1(c1[0])} ${f1(c1[1] - th)} ${f1(c2[0])} ${f1(c2[1] - th)} ${pt(flick)} L${f1(out[0])} ${f1(out[1] + 1.4)} C${f1(c2[0])} ${f1(c2[1] + .6)} ${f1(c1[0])} ${f1(c1[1] + .6)} ${f1(inn[0])} ${f1(inn[1] + .9)}Z`;
    const lashes = g.feminine ? `<path d="M${pt(flick)} l${s * 2.6} -2.4 M${f1(out[0] - s * 1.5)} ${f1(out[1] - 1.5)} l${s * 2.4} -3.2" stroke="${INK}" stroke-width="1.8" stroke-linecap="round" fill="none"/>` : '';
    return `<clipPath id="${id}"><path d="${shape}"/></clipPath>
<path d="${shape}" fill="#fbf7f2"/>
<g clip-path="url(#${id})">
<ellipse cx="${f1(ix)}" cy="${f1(iy)}" rx="${f1(irx)}" ry="${f1(iry)}" fill="url(#${uid}-iris)" stroke="${shade(iris, .45)}" stroke-width="1.1"/>
<ellipse cx="${f1(ix)}" cy="${f1(iy + .6)}" rx="${f1(irx * .42)}" ry="${f1(iry * .5)}" fill="#120b08"/>
<ellipse cx="${f1(cx)}" cy="${f1(cy - h * .95)}" rx="${f1(w * 1.1)}" ry="${f1(h * .55)}" fill="#000" opacity=".2"/>
<circle cx="${f1(ix - irx * .38)}" cy="${f1(iy - iry * .42)}" r="2.7" fill="#fff"/>
<circle cx="${f1(ix + irx * .42)}" cy="${f1(iy + iry * .38)}" r="1.2" fill="#fff" opacity=".85"/>
</g>
<path d="${lid}" fill="${INK}"/>
<path d="M${f1(out[0] - s)} ${f1(out[1] + 2.4)} Q${f1(cx + s * w * .55)} ${f1(cy + h * .66)} ${f1(cx + s * w * .05)} ${f1(cy + h * .74)}" stroke="${INK}" stroke-width="1.4" stroke-linecap="round" fill="none" opacity=".75"/>
<path d="M${f1(cx - s * w * .45)} ${f1(cy - h * 1.05 - 5)} Q${f1(cx + s * w * .2)} ${f1(cy - h * 1.22 - 5.5)} ${f1(cx + s * w * .85)} ${f1(cy - h * .9 - 4.5 + tilt * .4)}" stroke="${INK}" stroke-width="1.1" stroke-linecap="round" fill="none" opacity=".3"/>
${lashes}`;
  };
  return `<defs><linearGradient id="${uid}-iris" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(iris, .5)}"/><stop offset=".5" stop-color="${iris}"/><stop offset="1" stop-color="${shade(iris, 1.55)}"/></linearGradient></defs>`
    + one(80, -1, `${uid}-el`) + one(120, 1, `${uid}-er`);
}
function brows(g: Genes) {
  const base = HAIR[g.hairColor === 9 ? 1 : g.hairColor];
  const c = shade(base, g.hairColor >= 6 ? .62 : .8);
  const V = [{ a: 0, arch: 3 }, { a: -2.5, arch: 5 }, { a: 4, arch: 1.5 }, { a: 1, arch: 3.5 }, { a: -1.5, arch: 6 }][g.brows];
  const t = (g.feminine ? 2.6 : 3.8) + (g.brows === 3 ? 1.2 : 0);
  const by = 94;
  const one = (cx: number, s: number) => {
    const inner: Pt = [cx - s * 10, by + 2 + V.a], outer: Pt = [cx + s * 13.5, by - .5 - V.a * .3];
    return `<path d="M${f1(inner[0])} ${f1(inner[1] - t / 2)} Q${f1(cx + s * 1)} ${f1(by - V.arch - t)} ${pt(outer)} Q${f1(cx + s * 1)} ${f1(by - V.arch + t * .55)} ${f1(inner[0] + s * .5)} ${f1(inner[1] + t / 2)}Z" fill="${c}" stroke="${shade(c, .7)}" stroke-width=".8" stroke-linejoin="round"/>`;
  };
  return one(80, -1) + one(120, 1);
}
function nose(g: Genes, skin: string) {
  const d = shade(skin, .58);
  const k = [1, 1.15, 1.25, .85, 1.1][g.nose];
  const y = 128;
  return `<path d="M${f1(101 + 1.5 * k)} ${f1(y - 5 * k)} Q${f1(104 + 1.5 * k)} ${f1(y + 1)} ${f1(99.5)} ${f1(y + 2.5 * k)}" stroke="${d}" stroke-width="1.9" stroke-linecap="round" fill="none"/>`
    + (g.nose === 2 ? `<path d="M95 ${y + 1.5} q1.6 1.2 3 .6" stroke="${d}" stroke-width="1.5" stroke-linecap="round" fill="none"/>` : '')
    + `<ellipse cx="97.5" cy="${y - 2}" rx="1.5" ry="2.6" fill="#fff" opacity=".35"/>`;
}
function mouth(g: Genes, skin: string) {
  const sh = shade(skin, .8);
  const ms = [
    `<path d="M93 141 Q100 146.5 107 141" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/><path d="M96.5 148.5 Q100 149.8 103.5 148.5" stroke="${sh}" stroke-width="1.6" stroke-linecap="round" fill="none"/>`,
    `<path d="M94 143 Q100 144.4 106 143" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/><path d="M96.5 148 Q100 149.2 103.5 148" stroke="${sh}" stroke-width="1.6" stroke-linecap="round" fill="none"/>`,
    `<path d="M91 139.5 Q100 153 109 139.5 Q100 142 91 139.5Z" fill="#5a1e1e" stroke="${INK}" stroke-width="1.7" stroke-linejoin="round"/><path d="M92.8 140.6 Q100 143 107.2 140.6 L106.6 142.8 Q100 144.8 93.4 142.8Z" fill="#fff"/><path d="M96 148 Q100 150 104 148 Q100 146 96 148Z" fill="#d86a72"/>`,
    `<path d="M95 144 Q100 142.6 105 144" fill="none" stroke="${INK}" stroke-width="2.1" stroke-linecap="round"/><path d="M97 148.5 Q100 149.5 103 148.5" stroke="${sh}" stroke-width="1.5" stroke-linecap="round" fill="none"/>`,
    `<path d="M94 144 Q101.5 145.5 107.5 140" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/><path d="M97 148.5 Q100.5 149.6 104 148.2" stroke="${sh}" stroke-width="1.5" stroke-linecap="round" fill="none"/>`,
  ];
  return ms[g.mouth] + (g.feminine && g.mouth !== 2 ? `<path d="M95.5 145.6 Q100 149 104.5 145.6 Q100 146.8 95.5 145.6Z" fill="#c9636b" opacity=".75"/>` : '');
}
function facial(g: Genes) {
  if (!g.facial) return '';
  const c = HAIR[g.hairColor], d = shade(c, .72);
  const beard = 'M52 110 C54 146 76 167 100 169 C124 167 146 146 148 110 C143 128 131 136 118 139 Q112 151 100 152 Q88 151 82 139 C69 136 57 128 52 110Z';
  const tache = `<path d="M87 139.5 Q93 134.5 100 137 Q107 134.5 113 139.5 Q106 140.5 100 139 Q94 140.5 87 139.5Z" fill="${c}" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>`;
  if (g.facial === 1) return `<path d="${beard}" fill="${c}" opacity=".22"/><path d="M88 139 Q100 135 112 139" stroke="${c}" stroke-width="3" opacity=".25" fill="none"/>`;
  if (g.facial === 2) return `<path d="${beard}" fill="${c}" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/><path d="M124 150 C136 140 144 128 147 114 C146 134 136 152 112 165 C118 160 122 156 124 150Z" fill="${d}"/><path d="M70 144 q4 6 10 9 M120 153 q6 -3 10 -9" stroke="${d}" stroke-width="1.5" fill="none" stroke-linecap="round"/>` + tache;
  if (g.facial === 3) return tache;
  return `<path d="M92 150.5 Q100 167 108 150.5 Q100 154 92 150.5Z" fill="${c}" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>` + tache;
}

// --- hair -----------------------------------------------------------------
interface FrontSpec { vol: number; hy: number; n: number; len: number; sweep: number; edge: 'smooth' | 'spiky' | 'curly'; side: number; jit?: number; part?: number }
function frontPath(s: FrontSpec, r: () => number) {
  const { vol, hy, n, len, sweep, edge, side } = s; const jit = s.jit ?? .25;
  const hry = 100 - hy;
  const ocx = 100, ocy = 92, orx = 52 + vol, ory = 54 + vol;
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
  const valleys: Pt[] = Array.from({ length: n + 1 }, (_, i) => ell(100, 100, 50, hry, 345 - 150 * i / n));
  const tipR: Pt = [100 + 49 + vol * .25, 100 + side], tipL: Pt = [100 - 49 - vol * .25, 100 + side];
  d += ` Q${pt([end[0] + 1, (end[1] + tipR[1]) / 2])} ${pt(tipR)} Q${pt([tipR[0] - 5, (tipR[1] + valleys[0][1]) / 2])} ${pt(valleys[0])}`;
  for (let i = 0; i < n; i += 1) {
    const a = valleys[i], b = valleys[i + 1];
    const mid = ell(100, 100, 50, hry, 345 - 150 * (i + .5) / n);
    const dx = 100 - mid[0], dy = 128 - mid[1], dl = Math.hypot(dx, dy);
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
  buzz: { vol: 1.5, hy: 70, n: 12, len: 3, sweep: 0, edge: 'smooth', side: 8, jit: .2 },
  crop: { vol: 6, hy: 67, n: 6, len: 9, sweep: 5, edge: 'smooth', side: 12, jit: .45 },
  sidepart: { vol: 7, hy: 70, n: 6, len: 13, sweep: -9, edge: 'smooth', side: 12, part: 1 },
  quiff: { vol: 12, hy: 66, n: 5, len: 5, sweep: 3, edge: 'spiky', side: 10, jit: .4 },
  curly: { vol: 10, hy: 72, n: 9, len: 9, sweep: 0, edge: 'curly', side: 12 },
  afro: { vol: 20, hy: 66, n: 9, len: 7, sweep: 0, edge: 'curly', side: 14 },
  messy: { vol: 9, hy: 72, n: 8, len: 15, sweep: 4, edge: 'spiky', side: 14, jit: .45 },
  receding: { vol: 3, hy: 56, n: 4, len: 4, sweep: 0, edge: 'smooth', side: 14 },
  bald: null,
  long: { vol: 7, hy: 72, n: 6, len: 16, sweep: -3, edge: 'smooth', side: 52 },
  manbun: { vol: 4, hy: 68, n: 6, len: 5, sweep: 0, edge: 'smooth', side: 10 },
  ponytail: { vol: 5, hy: 70, n: 5, len: 13, sweep: -8, edge: 'smooth', side: 18 },
  bun: { vol: 5, hy: 70, n: 6, len: 11, sweep: 6, edge: 'smooth', side: 20 },
  bob: { vol: 10, hy: 74, n: 9, len: 17, sweep: 0, edge: 'smooth', side: 40, jit: .12 },
  braids: { vol: 4, hy: 68, n: 6, len: 5, sweep: 0, edge: 'smooth', side: 12 },
  pixie: { vol: 7, hy: 72, n: 6, len: 15, sweep: -11, edge: 'spiky', side: 16, jit: .35 },
  highpony: { vol: 5, hy: 68, n: 5, len: 9, sweep: 7, edge: 'smooth', side: 18 },
};
// paints a hair shape: base gradient, cel shadow on the right, lock strands, highlight, ink outline
function paintHair(d: string, id: string, c: string, opts: { dark?: boolean; valleys?: Pt[]; hl?: { rx: number; ry: number }; outline?: boolean } = {}) {
  const base = opts.dark ? shade(c, .78) : c;
  const dk = shade(base, .72), hi = shade(c, c === HAIR[0] ? 2.6 : 1.4);
  const strands = (opts.valleys ?? []).slice(1, -1).map((v) => { const e = lerp(v, [100, 34], .55); const m = lerp(v, e, .5); return `<path d="M${pt(v)} Q${pt([m[0] + (v[0] < 100 ? -4 : 4), m[1]])} ${pt(e)}" stroke="${dk}" stroke-width="1.7" stroke-linecap="round" fill="none"/>`; }).join('');
  const hl = opts.hl ? `<path d="M${pt(ell(100, 92, opts.hl.rx - 10, opts.hl.ry - 10, 206))} A${f1(opts.hl.rx - 10)} ${f1(opts.hl.ry - 10)} 0 0 1 ${pt(ell(100, 92, opts.hl.rx - 10, opts.hl.ry - 10, 252))}" stroke="${hi}" stroke-width="5.5" stroke-linecap="round" stroke-dasharray="10 5" fill="none" opacity=".75"/><path d="M${pt(ell(100, 92, opts.hl.rx - 9, opts.hl.ry - 9, 260))} A${f1(opts.hl.rx - 9)} ${f1(opts.hl.ry - 9)} 0 0 1 ${pt(ell(100, 92, opts.hl.rx - 9, opts.hl.ry - 9, 274))}" stroke="${hi}" stroke-width="4" stroke-linecap="round" fill="none" opacity=".6"/>` : '';
  return `<clipPath id="${id}"><path d="${d}"/></clipPath><path d="${d}" fill="${base}"/>
<g clip-path="url(#${id})"><path d="M128 0 C160 40 166 110 150 200 L210 200 L210 0Z" fill="${dk}" opacity=".85"/><rect x="0" y="0" width="200" height="200" fill="url(#${id}-g)"/>${strands}${hl}</g>
<defs><linearGradient id="${id}-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".12"/><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient></defs>
${opts.outline === false ? '' : `<path d="${d}" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>`}`;
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
    case 'long': back = B(`M46 100 A54 58 0 0 1 154 100 L160 186 Q152 196 146 186 Q140 198 132 188 L68 188 Q60 198 54 186 Q48 196 40 186Z`); break;
    case 'bob': back = B(`M44 100 A56 60 0 0 1 156 100 L158 138 Q156 150 144 150 Q140 156 132 150 L68 150 Q60 156 56 150 Q44 150 42 138Z`); break;
    case 'ponytail': back = B(`M126 58 C170 52 180 112 162 160 Q158 170 152 162 C154 140 150 126 140 116 C148 98 144 80 126 74Z`) + `<path d="M132 62 Q142 66 140 78" stroke="${g.kit[1] === '#ffffff' ? g.kit[0] : g.kit[1]}" stroke-width="5" stroke-linecap="round" fill="none"/>`; break;
    case 'highpony': back = B(`M94 38 C114 2 170 16 168 66 C166 104 156 128 146 146 C148 116 146 86 130 64 C120 50 108 44 94 38Z`) + `<ellipse cx="101" cy="36" rx="9" ry="5" fill="${g.kit[1] === '#ffffff' ? g.kit[0] : g.kit[1]}" stroke="${INK}" stroke-width="1.8"/>`; break;
    case 'bun': back = B(`M100 14 C112 14 120 22 120 33 C120 44 111 50 100 50 C89 50 80 44 80 33 C80 22 88 14 100 14Z`) + `<path d="M88 26 Q100 18 112 28 M86 36 Q100 28 114 38" stroke="${shade(c, .55)}" stroke-width="1.6" fill="none"/>`; break;
    case 'manbun': back = B(`M100 18 C109 18 115 24 115 32 C115 40 108 45 100 45 C92 45 85 40 85 32 C85 24 91 18 100 18Z`); break;
    case 'afro': back = B(blob(100, 84, 64, 60, 14, r)); break;
    case 'curly': back = g.feminine ? B(blob(100, 104, 60, 64, 14, r)) : ''; break;
    default: break;
  }
  if (style === 'braids') {
    const braid = (x: number) => Array.from({ length: 7 }, (_, k) => `<ellipse cx="${x + (k % 2 ? 1.5 : -1.5)}" cy="${118 + k * 10.5}" rx="6" ry="6.8" transform="rotate(${k % 2 ? 25 : -25} ${x} ${118 + k * 10.5})" fill="${k % 2 ? shade(c, .85) : c}" stroke="${INK}" stroke-width="1.6"/>`).join('');
    front += braid(50) + braid(150);
  }
  return { back, front, shadow };
}
function accessory(g: Genes) {
  const [k1, k2] = g.kit;
  const band = k2 === '#ffffff' ? k1 : k2;
  const ink = `stroke="${INK}" stroke-width="2.3" stroke-linejoin="round"`;
  switch (ACCESSORIES[g.accessory]) {
    case 'headband': return `<path d="M48 92 Q100 64 152 92 L152 103 Q100 76 48 103Z" fill="${band}" ${ink}/><path d="M50 97 Q100 70 150 97" stroke="#fff" stroke-width="1.6" opacity=".55" fill="none"/>`;
    case 'cap': return `<g transform="translate(100 99) scale(1 .86) translate(-100 -110)"><path d="M46 99 C44 50 72 28 100 28 C128 28 156 50 154 99 Q100 86 46 99Z" fill="${k1}" ${ink}/><path d="M118 32 C140 42 152 62 154 98 Q140 94 128 92 C130 70 126 48 118 32Z" fill="${shade(k1, .78)}"/><path d="M100 30 Q104 60 100 89" stroke="${shade(k1, .6)}" stroke-width="1.6" fill="none"/><circle cx="100" cy="30" r="3.2" fill="${k2}" stroke="${INK}" stroke-width="1.5"/><path d="M78 60 h12 M110 60 h12" stroke="${k2}" stroke-width="4" stroke-linecap="round"/>
<path d="M38 99 Q100 80 162 99 Q158 113 100 111 Q42 113 38 99Z" fill="${shade(k1, .85)}" ${ink}/><path d="M44 104 Q100 92 156 104 Q150 110 100 109 Q50 110 44 104Z" fill="${shade(k1, .55)}"/></g>`;
    case 'visor': return `<g transform="translate(0 -10)"><path d="M48 93 Q100 70 152 93 L152 101 Q100 80 48 101Z" fill="${k1}" ${ink}/><path d="M40 100 Q100 84 160 100 Q156 112 100 110 Q44 112 40 100Z" fill="${shade(k1, .85)}" ${ink}/><path d="M46 104 Q100 94 154 104 Q148 109 100 108.5 Q52 109 46 104Z" fill="${shade(k1, .55)}"/></g>`;
    case 'bandana': return `<path d="M47 96 C46 52 74 34 100 34 C126 34 154 52 153 96 Q100 80 47 96Z" fill="${band}" ${ink}/><path d="M150 84 l18 4 l-6 10 l12 10 l-16 -2 l-6 -10Z" fill="${band}" ${ink}/><g fill="#fff" opacity=".55"><circle cx="76" cy="62" r="2.2"/><circle cx="96" cy="50" r="2.2"/><circle cx="118" cy="56" r="2.2"/><circle cx="134" cy="72" r="2.2"/><circle cx="88" cy="74" r="2.2"/><circle cx="112" cy="76" r="2.2"/></g>`;
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
  const hd = HEAD_DIMS[g.head];
  const L = (layer: string, variant: string | number, vector: string, tint?: 'skin' | 'hair') => has(layer, String(variant)) ? img(layer, String(variant), tint ? `${uid}-${tint}` : undefined) : vector;
  const sk2 = shade(skin, .84), sk3 = shade(skin, .72);
  const collar = k2 === '#ffffff' || k1 === '#ffffff' ? (k1 === '#ffffff' ? k2 : '#ffffff') : k2;
  const ex = 100 + hd.w + 1;
  const castFrom = acc === 'cap' ? 'M38 99 Q100 80 162 99 Q158 113 100 111 Q42 113 38 99Z' : shadow;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
<defs>${tintFilter(`${uid}-skin`, skin)}${tintFilter(`${uid}-hair`, hair)}
<radialGradient id="${uid}-bg" cx="50%" cy="30%" r="80%"><stop offset="0" stop-color="${shade(k1, 1.2)}"/><stop offset=".7" stop-color="${shade(k1, .6)}"/><stop offset="1" stop-color="${shade(k1, .35)}"/></radialGradient>
<clipPath id="${uid}-hc"><path d="${HEADS[g.head]}"/></clipPath>
<clipPath id="${uid}-sc"><path d="M14 200 C16 178 34 166 62 160 L86 155 Q100 166 114 155 L138 160 C166 166 184 178 186 200Z"/></clipPath>
${round ? `<clipPath id="${uid}-c"><circle cx="100" cy="100" r="100"/></clipPath>` : ''}</defs>
<g${round ? ` clip-path="url(#${uid}-c)"` : ''}>
<rect width="200" height="200" fill="url(#${uid}-bg)"/>
<circle cx="100" cy="96" r="78" fill="#fff" opacity=".07"/>
<g transform="translate(100 112) scale(1.16) translate(-100 -112)">
${L('hairBack', style, back, 'hair')}
${L('shirt', 'base', `<path d="M14 200 C16 178 34 166 62 160 L86 155 Q100 166 114 155 L138 160 C166 166 184 178 186 200Z" fill="${k1}"/>
<g clip-path="url(#${uid}-sc)"><path d="M132 150 C150 170 160 186 160 200 L200 200 L200 150Z" fill="#000" opacity=".2"/><path d="M14 176 Q60 160 100 168 Q140 160 186 176" stroke="${k2}" stroke-width="5" fill="none" opacity=".9"/><path d="M50 200 C51 186 55 176 62 168 M150 200 C149 186 145 176 138 168" stroke="${INK}" stroke-width="1.2" opacity=".35" fill="none"/></g>
<path d="M14 200 C16 178 34 166 62 160 L86 155 Q100 166 114 155 L138 160 C166 166 184 178 186 200" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
<path d="M100 166 L100 190" stroke="${INK}" stroke-width="1.4" opacity=".55"/><circle cx="100" cy="175" r="1.7" fill="${collar}" stroke="${INK}" stroke-width="1"/><circle cx="100" cy="183" r="1.7" fill="${collar}" stroke="${INK}" stroke-width="1"/>`)}
${L('neck', 'base', `<path d="M88 136 L88 160 Q100 168 112 160 L112 136Z" fill="${sk2}" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/><path d="M88.5 140 L111.5 140 L111.5 152 Q100 158 88.5 152Z" fill="${sk3}"/>`, 'skin')}
${L('shirt', 'collar', `<path d="M86 154 L76 167 L96 173 L100 163Z" fill="${collar}" stroke="${INK}" stroke-width="1.9" stroke-linejoin="round"/><path d="M114 154 L124 167 L104 173 L100 163Z" fill="${shade(collar, .86)}" stroke="${INK}" stroke-width="1.9" stroke-linejoin="round"/>`)}
${L('ears', 'base', `<ellipse cx="${200 - ex}" cy="114" rx="8.5" ry="11.5" fill="${skin}" stroke="${INK}" stroke-width="2.2"/><ellipse cx="${ex}" cy="114" rx="8.5" ry="11.5" fill="${sk2}" stroke="${INK}" stroke-width="2.2"/><path d="M${200 - ex - 2} 108 q4 6 0 12 M${ex + 2} 108 q-4 6 0 12" stroke="${sk3}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`, 'skin')}
${L('head', g.head, `<path d="${HEADS[g.head]}" fill="${skin}"/>`, 'skin')}
<g clip-path="url(#${uid}-hc)">
<path d="M124 36 C150 62 154 116 132 148 C122 160 108 166 100 168 L200 168 L200 36Z" fill="${sk2}"/>
${castFrom ? `<path d="${castFrom}" transform="${acc === 'cap' ? 'translate(2 -4)' : 'translate(2 7)'}" fill="${sk3}" opacity=".8"/>` : ''}
<ellipse cx="70" cy="130" rx="9" ry="5" fill="#f2787a" opacity="${g.feminine ? .3 : .14}"/><ellipse cx="130" cy="130" rx="9" ry="5" fill="#f2787a" opacity="${g.feminine ? .3 : .14}"/>
<ellipse cx="80" cy="64" rx="16" ry="8" fill="#fff" opacity=".16"/>
</g>
<path d="${HEADS[g.head]}" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
${L('eyes', g.eyes, eyes(g, uid))}
${L('brows', g.brows, brows(g), 'hair')}
${L('nose', g.nose, nose(g, skin), 'skin')}
${L('mouth', g.mouth, mouth(g, skin))}
${L('facialHair', g.facial, facial(g), 'hair')}
${acc === 'cap' ? `<path d="M48 90 Q46 106 53 116 L57 94Z M152 90 Q154 106 147 116 L143 94Z" fill="${hair}" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>` : L('hairFront', style, front, 'hair')}
${L('accessory', acc, accessory(g))}
</g></g></svg>`;
  if (!genes) cache.set(key, svg);
  if (cache.size > 3000) cache.delete(cache.keys().next().value as string);
  return svg;
}
const urlCache = new Map<string, string>();
export function faceUrl(p: any, round = false) {
  const key = `${p?.id}|${p?.age}|${round}|${manifest ? Object.keys(manifest).length : 0}`;
  let u = urlCache.get(key);
  if (!u) { u = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(faceSvg(p, { round }))}`; urlCache.set(key, u); if (urlCache.size > 3000) urlCache.delete(urlCache.keys().next().value as string); }
  return u;
}
