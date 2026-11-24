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
// Vector parts (v1). Each returns SVG markup for the 200×200 box.
// ---------------------------------------------------------------------------
const HEADS = [
  'M100 46 C130 46 142 72 142 100 C142 132 126 156 100 158 C74 156 58 132 58 100 C58 72 70 46 100 46Z', // oval
  'M100 48 C134 48 144 74 144 102 C144 130 130 152 100 154 C70 152 56 130 56 102 C56 74 66 48 100 48Z', // round
  'M100 44 C128 44 140 68 140 98 C140 134 124 162 100 164 C76 162 60 134 60 98 C60 68 72 44 100 44Z', // long
  'M100 46 C132 46 142 70 142 98 C142 124 138 146 118 156 L100 160 L82 156 C62 146 58 124 58 98 C58 70 68 46 100 46Z', // square
  'M100 46 C134 46 144 70 143 96 C142 126 122 156 100 160 C78 156 58 126 57 96 C56 70 66 46 100 46Z', // heart
];
// v2 look: outlined, cel-shaded cartoon with expressive eyes (ink #24160f).
const INK = '#24160f';
function eyes(g: Genes) {
  const iris = EYES[g.eyeColor];
  const shapes: [number, number][] = [[10.5, 8.5], [11.5, 7.2], [10, 6], [11, 9.2], [10.5, 7.8]];
  const [rx, ry] = shapes[g.eyes];
  const cy = 105;
  const one = (cx: number, s: number) => `<g>
    <path d="M${cx - rx} ${cy} Q${cx - rx * .6} ${cy - ry * 1.15} ${cx} ${cy - ry} Q${cx + rx * .7} ${cy - ry * 1.1} ${cx + rx} ${cy} Q${cx + rx * .5} ${cy + ry * .95} ${cx} ${cy + ry * .9} Q${cx - rx * .6} ${cy + ry} ${cx - rx} ${cy}Z" fill="#fdfaf6" stroke="${INK}" stroke-width="1.4"/>
    <circle cx="${cx + s * .6}" cy="${cy + .5}" r="${Math.min(ry, 6.6)}" fill="url(#IRIS)"/>
    <circle cx="${cx + s * .6}" cy="${cy + .5}" r="${Math.min(ry, 6.6) * .48}" fill="#0d0907"/>
    <circle cx="${cx + s * .6 + 2.4}" cy="${cy - 2}" r="2.1" fill="#fff"/><circle cx="${cx + s * .6 - 1.8}" cy="${cy + 2.6}" r="1" fill="#fff" opacity=".8"/>
    <path d="M${cx - rx - 1.5} ${cy + .5} Q${cx - rx * .6} ${cy - ry * 1.25} ${cx} ${cy - ry - .6} Q${cx + rx * .7} ${cy - ry * 1.2} ${cx + rx + 1.5} ${cy - .5}" fill="none" stroke="${INK}" stroke-width="${g.feminine ? 3.4 : 2.6}" stroke-linecap="round"/>
    ${g.feminine ? `<path d="M${cx + s * (rx + 1)} ${cy - 1} l${s * 3.5} -3.2 M${cx + s * (rx - 2)} ${cy - ry * .9} l${s * 2.5} -3.4" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>` : ''}
    <path d="M${cx - rx * .7} ${cy + ry + 1.8} Q${cx} ${cy + ry + 3} ${cx + rx * .7} ${cy + ry + 1.8}" fill="none" stroke="${INK}" stroke-width=".9" opacity=".35"/>
  </g>`;
  return `<defs><radialGradient id="IRIS" cx="45%" cy="40%" r="60%"><stop offset="0" stop-color="${shade(iris, 1.6)}"/><stop offset=".6" stop-color="${iris}"/><stop offset="1" stop-color="${shade(iris, .5)}"/></radialGradient></defs>` + one(82, -1) + one(118, 1);
}
function brows(g: Genes) {
  const c = shade(HAIR[g.hairColor === 9 ? 1 : g.hairColor], .8);
  const w = g.feminine ? 3 : [3.6, 4.6, 3.2, 5.2, 4][g.brows];
  const tilt = [0, -2, 2.5, -1, 1][g.brows];
  const one = (x: number, s: number) => `<path d="M${x - 12 * s} ${91 + tilt} Q${x - 3 * s} ${85 - (g.brows === 4 ? 2 : 0)} ${x + 11 * s} ${89 - tilt}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
  return one(82, 1) + one(118, -1);
}
function nose(g: Genes, skin: string) {
  const d = shade(skin, .7);
  const ns = [
    `<path d="M101 110 Q99 119 96 121 Q100 124 104 122" fill="none" stroke="${d}" stroke-width="2" stroke-linecap="round"/>`,
    `<path d="M102 106 L98 120 Q101 123 105 121" fill="none" stroke="${d}" stroke-width="2" stroke-linecap="round"/>`,
    `<path d="M95 121 Q100 125 105 121" fill="none" stroke="${d}" stroke-width="2.2" stroke-linecap="round"/><circle cx="96" cy="120" r="1.3" fill="${d}"/><circle cx="104" cy="120" r="1.3" fill="${d}"/>`,
    `<path d="M97 121 Q100 123.5 103 121" fill="none" stroke="${d}" stroke-width="2" stroke-linecap="round"/>`,
    `<path d="M101 104 Q100 115 97 121 Q101 124 105 121" fill="none" stroke="${d}" stroke-width="1.9" stroke-linecap="round"/>`,
  ];
  return ns[g.nose] + `<ellipse cx="100" cy="114" rx="2.4" ry="6" fill="#fff" opacity=".12"/>`;
}
function mouth(g: Genes, skin: string) {
  const lip = g.feminine ? '#c0545a' : shade(skin, .62);
  const ms = [
    `<path d="M88 133 Q100 143 112 133" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/><path d="M92 137 Q100 141 108 137" fill="none" stroke="${lip}" stroke-width="2" opacity=".7"/>`,
    `<path d="M90 135 Q100 137.5 110 135" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`,
    `<path d="M87 131 Q100 147 113 131 Q100 135 87 131Z" fill="#6e2424" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><path d="M90 132.5 Q100 136 110 132.5 L109 135 Q100 137.5 91 135Z" fill="#fff"/><path d="M95 141 Q100 143.5 105 141" fill="#e0707a"/>`,
    `<path d="M94 135 Q100 138.5 106 135" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`,
    `<path d="M89 136 Q101 139 112 131" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`,
  ];
  return ms[g.mouth] + (g.feminine ? `<path d="M93 134 Q100 132 107 134" fill="none" stroke="${lip}" stroke-width="2.6" opacity=".55"/>` : '');
}
function facial(g: Genes, skin: string) {
  if (!g.facial) return '';
  const c = HAIR[g.hairColor];
  if (g.facial === 1) return `<path d="M64 112 C66 140 84 156 100 158 C116 156 134 140 136 112 C132 130 120 146 100 148 C80 146 68 130 64 112Z" fill="${c}" opacity=".28"/>`; // stubble
  if (g.facial === 2) return `<path d="M62 108 C64 142 82 162 100 164 C118 162 136 142 138 108 C134 128 122 132 112 130 Q100 126 88 130 C78 132 66 128 62 108Z" fill="${c}"/><path d="M88 132 Q100 138 112 132" fill="none" stroke="${shade(skin, .6)}" stroke-width="2"/>`; // beard
  if (g.facial === 3) return `<path d="M86 128 Q100 122 114 128 Q100 132 86 128Z" fill="${c}"/>`; // moustache
  return `<path d="M90 140 Q100 158 110 140 Q100 146 90 140Z" fill="${c}"/><path d="M88 128 Q100 123 112 128 Q100 131 88 128Z" fill="${c}"/>`; // goatee
}
function hairParts(g: Genes): { back: string; front: string } {
  const c = HAIR[g.hairColor], d = shade(c, .75), hi = shade(c, 1.35);
  const style = (g.feminine ? HAIR_STYLES_F : HAIR_STYLES_M)[g.hair];
  const cap = (top = 40, side = 62) => `<path d="M${side - 4} 96 C${side - 6} 60 ${100 - 30} ${top} 100 ${top} C${130} ${top} ${206 - side} 60 ${204 - side} 96 C${200 - side} 78 ${170 - side} 64 100 66 C${30 + side} 64 ${side} 78 ${side - 4} 96Z" fill="${c}"/>`;
  const shine = `<path d="M80 52 Q100 44 120 50" fill="none" stroke="${hi}" stroke-width="3" opacity=".5" stroke-linecap="round"/>`;
  switch (style) {
    case 'buzz': return { back: '', front: `<path d="M58 92 C58 58 78 44 100 44 C122 44 142 58 142 92 C134 70 118 62 100 62 C82 62 66 70 58 92Z" fill="${c}" opacity=".85"/>` };
    case 'crop': return { back: '', front: cap(36, 60) + `<path d="M70 66 Q86 56 100 64 Q114 56 132 66" fill="none" stroke="${d}" stroke-width="3"/>` + shine };
    case 'sidepart': return { back: '', front: cap(36, 60) + `<path d="M60 90 C62 60 86 40 118 44 C100 50 90 58 84 72 Q72 74 60 90Z" fill="${d}" opacity=".6"/>` + shine };
    case 'quiff': return { back: '', front: cap(34, 60) + `<path d="M74 60 C80 30 120 22 132 44 C118 38 104 42 96 58Z" fill="${c}"/>` + shine };
    case 'curly': case 'afro': {
      const big = style === 'afro' ? 1.25 : 1;
      const dots = Array.from({ length: 16 }, (_, i) => { const a = Math.PI + (i / 15) * Math.PI; const x = 100 + Math.cos(a) * 46 * big, y = 84 + Math.sin(a) * 42 * big; return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(12 * big).toFixed(1)}" fill="${i % 2 ? c : d}"/>`; }).join('');
      return { back: style === 'afro' ? `<ellipse cx="100" cy="84" rx="${62 * big * .9}" ry="${54 * big * .9}" fill="${d}"/>` : '', front: dots + `<ellipse cx="100" cy="66" rx="${40 * big}" ry="18" fill="${c}"/>` };
    }
    case 'messy': return { back: '', front: cap(34, 60) + `<path d="M64 74 l8 -16 l6 12 l8 -18 l6 14 l8 -16 l6 14 l8 -14 l6 12 l10 -8 l-2 20 Z" fill="${c}"/>` };
    case 'receding': return { back: '', front: `<path d="M58 96 C56 70 64 56 74 54 C76 64 70 74 66 96Z M142 96 C144 70 136 56 126 54 C124 64 130 74 134 96Z" fill="${c}"/><path d="M80 50 Q100 44 120 50" fill="none" stroke="${c}" stroke-width="5" opacity=".5"/>` };
    case 'bald': return { back: '', front: `<path d="M82 52 Q100 46 118 52" fill="none" stroke="#fff" stroke-width="4" opacity=".25" stroke-linecap="round"/>` };
    case 'long': return { back: `<path d="M54 100 C48 60 74 36 100 36 C126 36 152 60 146 100 L150 178 L50 178Z" fill="${d}"/>`, front: cap(34, 58) + `<path d="M58 96 C58 74 70 58 88 56 C76 70 72 84 70 110 L58 120Z M142 96 C142 74 130 58 112 56 C124 70 128 84 130 110 L142 120Z" fill="${c}"/>` + shine };
    case 'manbun': return { back: '', front: cap(38, 60) + `<circle cx="100" cy="32" r="13" fill="${c}"/><path d="M90 40 Q100 46 110 40" stroke="${d}" stroke-width="3" fill="none"/>` };
    case 'ponytail': return { back: `<path d="M120 50 C160 54 162 110 148 150 C140 122 140 92 120 72Z" fill="${d}"/>`, front: cap(36, 60) + `<path d="M62 92 C64 66 82 52 100 54 C88 60 80 72 76 88Z" fill="${d}" opacity=".5"/>` + shine };
    case 'highpony': return { back: `<path d="M104 30 C150 20 160 70 140 110 C138 80 128 56 108 46Z" fill="${d}"/>`, front: cap(36, 60) + `<circle cx="104" cy="36" r="7" fill="${d}"/>` + shine };
    case 'bun': return { back: '', front: cap(36, 60) + `<circle cx="100" cy="30" r="15" fill="${c}"/><circle cx="96" cy="27" r="5" fill="${hi}" opacity=".35"/>` + shine };
    case 'bob': return { back: `<path d="M52 100 C46 60 72 36 100 36 C128 36 154 60 148 100 L146 140 L54 140Z" fill="${d}"/>`, front: cap(34, 56) + `<path d="M56 96 C60 70 78 58 100 60 C122 58 140 70 144 96 C132 80 116 74 100 74 C84 74 68 80 56 96Z" fill="${c}"/>` };
    case 'braids': return { back: `<path d="M56 100 L48 176 L64 176 L70 104Z M144 100 L152 176 L136 176 L130 104Z" fill="${d}"/>` + Array.from({ length: 6 }, (_, i) => `<circle cx="56" cy="${112 + i * 11}" r="5" fill="${c}"/><circle cx="144" cy="${112 + i * 11}" r="5" fill="${c}"/>`).join(''), front: cap(36, 60) + `<path d="M70 62 L70 92 M84 54 L84 80 M100 50 L100 74 M116 54 L116 80 M130 62 L130 92" stroke="${d}" stroke-width="2.4"/>` };
    case 'pixie': return { back: '', front: cap(36, 60) + `<path d="M60 96 C60 64 90 46 128 56 C110 60 98 70 90 86 Q74 80 60 96Z" fill="${c}"/>` + shine };
    default: return { back: '', front: cap() };
  }
}
function accessory(g: Genes) {
  const [k1, k2] = g.kit;
  switch (ACCESSORIES[g.accessory]) {
    case 'headband': return `<path d="M58 80 Q100 62 142 80 L142 90 Q100 72 58 90Z" fill="${k2 === '#ffffff' ? k1 : k2}"/><path d="M58 85 Q100 67 142 85" stroke="#fff" stroke-width="1.5" opacity=".5" fill="none"/>`;
    case 'cap': return `<path d="M56 84 C56 50 78 34 100 34 C122 34 144 50 144 84Z" fill="${k1}"/><path d="M52 84 Q100 74 160 88 Q150 98 100 92 Q70 90 52 92Z" fill="${shade(k1, .7)}"/><circle cx="100" cy="36" r="3" fill="${k2}"/><path d="M84 60 h32" stroke="${k2}" stroke-width="4" stroke-linecap="round"/>`;
    case 'visor': return `<path d="M58 80 Q100 66 142 80 L142 88 Q100 74 58 88Z" fill="${k1}"/><path d="M56 86 Q100 78 156 90 Q146 100 100 94 Q72 92 56 94Z" fill="${shade(k1, .75)}"/>`;
    case 'bandana': return `<path d="M56 82 C58 52 80 38 100 38 C120 38 142 52 144 82 Q100 70 56 82Z" fill="${k2 === '#ffffff' ? k1 : k2}"/><path d="M140 78 l14 10 l-12 4Z" fill="${k2 === '#ffffff' ? k1 : k2}"/>`;
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
  const { back, front } = g.hair < 0 ? { back: '', front: '' } : hairParts(g);
  const style = (g.feminine ? HAIR_STYLES_F : HAIR_STYLES_M)[g.hair] ?? 'none';
  const uid = `f${(hash(String(p?.id)) % 1e8).toString(36)}`;
  const L = (layer: string, variant: string | number, vector: string, tint?: 'skin' | 'hair') => has(layer, String(variant)) ? img(layer, String(variant), tint ? `${uid}-${tint}` : undefined) : vector;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
<defs>${tintFilter(`${uid}-skin`, skin)}${tintFilter(`${uid}-hair`, hair)}
<radialGradient id="${uid}-bg" cx="50%" cy="35%" r="75%"><stop offset="0" stop-color="${shade(k1, 1.15)}"/><stop offset="1" stop-color="${shade(k1, .45)}"/></radialGradient>
<linearGradient id="${uid}-skin-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(skin, 1.04)}"/><stop offset="1" stop-color="${shade(skin, .9)}"/></linearGradient>
<clipPath id="${uid}-hc"><path d="${HEADS[g.head]}"/></clipPath>
${round ? `<clipPath id="${uid}-c"><circle cx="100" cy="100" r="100"/></clipPath>` : ''}</defs>
<style>.ink path,.ink ellipse,.ink circle{stroke:${INK};stroke-width:2.3;stroke-linejoin:round}.ink .soft{stroke:none}</style>
<g${round ? ` clip-path="url(#${uid}-c)"` : ''}>
<rect width="200" height="200" fill="url(#${uid}-bg)"/>
<g transform="translate(100 118) scale(1.24) translate(-100 -118)">
<g class="ink">${L('hairBack', style, back, 'hair')}</g>
<g class="ink">${L('shirt', 'base', `<path d="M18 200 C22 172 44 160 76 154 Q100 170 124 154 C156 160 178 172 182 200Z" fill="${k1}"/><path d="M76 154 Q100 176 124 154 L118 152 Q100 166 82 152Z" fill="${k2}"/><path d="M34 200 C38 182 50 172 64 166" stroke="${k2}" stroke-width="4" fill="none" opacity=".8"/><path d="M166 200 C162 182 150 172 136 166" stroke="${k2}" stroke-width="4" fill="none" opacity=".8"/>`)}</g>
<g class="ink">${L('neck', 'base', `<path d="M86 136 L86 160 Q100 170 114 160 L114 136Z" fill="${shade(skin, .82)}"/>`, 'skin')}
${L('ears', 'base', `<ellipse cx="58" cy="106" rx="8.5" ry="12" fill="${shade(skin, .95)}"/><ellipse cx="142" cy="106" rx="8.5" ry="12" fill="${shade(skin, .95)}"/>`, 'skin')}<path d="M56 100 q5 6 0 12 M144 100 q-5 6 0 12" stroke="${shade(skin, .68)}" stroke-width="1.8" fill="none"/>
${L('head', g.head, `<path d="${HEADS[g.head]}" fill="url(#${uid}-skin-g)"/>`, 'skin')}</g>
<g clip-path="url(#${uid}-hc)">
<path d="M118 40 C150 60 150 140 112 168 L160 168 L160 40Z" fill="${shade(skin, .82)}" opacity=".55"/>
<path d="M60 128 C72 154 90 162 100 162 C112 162 128 154 140 128 C130 150 116 158 100 158 C84 158 70 150 60 128Z" fill="${shade(skin, .8)}" opacity=".6"/>
<path d="M56 74 Q100 58 144 74 L144 92 Q100 78 56 92Z" fill="${shade(skin, .85)}" opacity=".35"/>
<ellipse cx="72" cy="124" rx="9" ry="5" fill="#f07a7a" opacity="${g.feminine ? .28 : .12}"/><ellipse cx="128" cy="124" rx="9" ry="5" fill="#f07a7a" opacity="${g.feminine ? .28 : .12}"/>
<ellipse cx="84" cy="70" rx="14" ry="7" fill="#fff" opacity=".12"/>
</g>
<path d="${HEADS[g.head]}" fill="none" stroke="${INK}" stroke-width="2.4"/>
${L('eyes', g.eyes, eyes(g).replace(/IRIS/g, `${uid}-iris`))}
${L('brows', g.brows, brows(g), 'hair')}
${L('nose', g.nose, nose(g, skin), 'skin')}
${L('mouth', g.mouth, mouth(g, skin))}
${L('facialHair', g.facial, facial(g, skin), 'hair')}
<g class="ink">${ACCESSORIES[g.accessory] === 'cap' ? '' : L('hairFront', style, front, 'hair')}
${L('accessory', ACCESSORIES[g.accessory], accessory(g))}</g>
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
