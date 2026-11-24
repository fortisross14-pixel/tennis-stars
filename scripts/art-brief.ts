// Builds docs/ART_BRIEF.md: the full list of art the game uses, with prompts.
//   npx tsx scripts/art-brief.ts
// Generated sections come from the game data, so new cards, trinkets etc. appear automatically.
import { writeFileSync, readFileSync } from 'fs';
import { CARD_LIST } from '../src/career/cards';
import { TRINKETS, UPGRADES, MILESTONES } from '../src/career/legacy';
import { EQUIPMENT, SPECIALS, FOCUSES, SLOT_ACTIVITIES, PACKS, STAFF } from '../src/career/data';
import { HAIR_STYLES_M, HAIR_STYLES_F } from '../src/career/faces';

const STYLE = 'premium sports-videogame UI illustration, bold clean shapes, soft studio rim light, deep navy (#0b1f4a) to royal blue (#1d58b8) palette with orange (#ff7a3d) and teal (#3ee0cf) accents, crisp edges, no text, no logos, no watermark';
const ICON = `single centered object, 3/4 view, ${STYLE}, transparent background, generous padding`;
const SUBJECT: Record<string, string> = {
  serve: 'a tennis player at the top of a serve toss, racquet behind the back', forehand: 'a powerful forehand swing with motion trails', backhand: 'a two-handed backhand drive, ball compressing on the strings',
  volley: 'a reflex volley at the net, ball frozen in mid-air', return: 'a crouched return stance waiting for a fast serve', footwork: 'sneakers sliding on court with dust and agility ladder lines',
  endurance: 'a heart-rate line and a stopwatch over a sweating towel', mentality: 'a calm focused face with a glowing brain outline', tactics: 'a tactics board with court diagram and arrows',
};
const TIER: Record<string, string> = { '1': 'simple, single element', '2': 'more dynamic, two elements, light glow', '4': 'epic composition, strong glow and particles' };
function cardSubject(id: string, name: string, kind: string) {
  const m = /^dr-([a-z]+)-(\d)$/.exec(id); if (m) return `${SUBJECT[m[1]] ?? m[1]}, ${TIER[m[2]] ?? ''}`;
  if (id.startsWith('cb-')) return `${name.replace('Elite ', '')} training scene combining two skills${id.endsWith('-3') ? ', epic glow' : ''}`;
  const map: Record<string, string> = {
    'dr-all-2': 'a sunrise pre-season training camp with all equipment laid out, golden light',
    'bo-ace': 'an exploding tennis ball leaving a fiery trail off a serve', 'bo-fh': 'a forehand on fire, flames along the racquet', 'bo-wall': 'a brick wall made of tennis balls', 'bo-clutch': 'an ice-blue heart beating calmly',
    'bo-legs': 'lungs made of wind swirls', 'bo-net': 'two soft open hands catching a ball', 'bo-insp': 'a glowing light bulb above a racquet', 'bo-belief': 'a player silhouette against a giant sunrise',
    'bo-zone': 'a spiral tunnel of light around a player', 'bo-god': 'a golden aura around a floating racquet',
    're-ice': 'an ice bath tub with steam', 're-massage': 'a massage table with towels', 're-retreat': 'a tropical recovery retreat cabana', 're-physio': 'a physio taping an ankle', 're-surgeon': 'a sleek surgeon tool set with a glowing cross', 're-psych': 'two chairs and a speech bubble with a calm wave',
    'po-spurt': 'a growth chart arrow shooting upward', 'po-visit': 'an old champion\'s silhouette handing over a racquet', 'po-gift': 'a gift box opening with light', 'po-gen': 'a golden star exploding with smaller stars',
    'sp-fast': 'a lightning bolt over a starting line', 'sp-closer': 'a padlock closing on a trophy', 'sp-fighter': 'a flame rising from a cracked ball', 'sp-tb': 'a target with a ball dead centre', 'sp-giant': 'a small sword in front of a giant shadow', 'sp-big': 'a stadium under spotlights with a star',
    'mo-local': 'a stack of banknotes with a small shop sign', 'mo-deal': 'a racquet bag with a signed contract', 'mo-exho': 'a glamorous exhibition court with fireworks', 'wc-letter': 'a sealed envelope with a glowing wax seal', 'wc-director': 'a golden VIP pass ticket',
  };
  return map[id] ?? `${name}, ${kind}`;
}
const table = (rows: string[][]) => [`| ${rows[0].join(' | ')} |`, `|${rows[0].map(() => '---').join('|')}|`, ...rows.slice(1).map((r) => `| ${r.join(' | ')} |`)].join('\n');

const hand = readFileSync('docs/art-brief.head.md', 'utf8');
const cards = table([['File', 'Card', 'Rarity', 'Prompt'], ...CARD_LIST.map((c) => [`cards/${c.id}.webp`, c.name, c.rarity, `${cardSubject(c.id, c.name, c.kind)}, ${STYLE}, square 1:1, subject centered with space around`])]);
const kinds = table([['File', 'Used for', 'Prompt'], ...['drill', 'boost', 'recovery', 'potential', 'special', 'money', 'wildcard'].map((k) => [`cards/kind-${k}.webp`, `fallback art for every ${k} card without its own art`, `abstract ${k === 'drill' ? 'training cones and racquet' : k === 'boost' ? 'energy burst' : k === 'recovery' ? 'ice crystals and a soft cross' : k === 'potential' ? 'upward arrows and stars' : k === 'special' ? 'a glowing badge' : k === 'money' ? 'coins and notes' : 'an envelope and ticket'} motif, ${STYLE}, square 1:1`])]);
const packs = table([['File', 'Pack', 'Colour', 'Prompt'], ...Object.entries(PACKS).map(([id, p]) => [`packs/${id}.webp`, p.name, p.color, `a sealed foil trading-card pack, ${p.color} metallic foil with ${p.accent} highlights, embossed tennis ball emblem, crimped top edge, front view, ${STYLE}, portrait 3:4, transparent background`])]);
const trinkets = table([['File', 'Trinket', 'Rarity', 'Prompt'], ...TRINKETS.map((t) => [`trinkets/${t.id}.webp`, t.name, t.rarity, `${t.name.toLowerCase()} as a collectible lucky item, ${ICON}`])]);
const upgrades = table([['File', 'Upgrade', 'Prompt'], ...UPGRADES.map((u) => [`upgrades/${u.id}.webp`, u.name, `${u.name.toLowerCase()} represented as a premium badge icon, ${ICON}`])]);
const equip = table([['File', 'Item', 'Prompt'], ...EQUIPMENT.map((e) => [`equipment/${e.id}.webp`, e.name, `${e.name.toLowerCase()}, product shot, ${ICON}`])]);
const specials = table([['File', 'Skill', 'Prompt'], ...SPECIALS.map((s) => [`specials/${s.id}.webp`, s.name, `hexagonal achievement badge for "${s.name}" (${s.desc.toLowerCase()}), metallic purple rim, ${ICON}`])]);
const focuses = table([['File', 'Focus / activity', 'Prompt'], ...FOCUSES.map((f) => [`training/${f.id}.webp`, f.label, `${f.desc.toLowerCase()} as a flat circular icon, ${ICON}`]), ...SLOT_ACTIVITIES.map((a) => [`training/slot-${a.kind}.webp`, a.label, `${a.desc.toLowerCase()} as a flat circular icon, ${ICON}`])]);
const staff = table([['File', 'Staff', 'Prompt'], ...Object.entries(STAFF).map(([k, s]) => [`staff/${k}.webp`, s.label, `portrait of a ${s.label.toLowerCase()} in team tracksuit, friendly, waist up, ${STYLE}, square`])]);
const milestones = table([['File', 'Milestone', 'Prompt'], ...MILESTONES.map((m) => [`milestones/${m.id}.webp`, m.label, `medal or trophy icon for "${m.label}", ${ICON}`])]);
const DECISIONS: [string, string][] = [['academy', 'a sunny clay-court academy in Spain with young players'], ['extra', 'a lone player practising at dusk under court lights'], ['sponsor', 'a photo shoot set with lights and a racquet on a stool'], ['press', 'a press conference table with microphones'], ['party', 'a rooftop party with city lights'], ['niggle', 'a shoulder with a glowing red pain spot and an ice pack'], ['hitting', 'a star player and a young hitting partner on a practice court'], ['federation', 'a national training centre entrance with flags'], ['coach-offer', 'a coach with a clipboard offering a handshake'], ['viral', 'a phone screen exploding with likes around a tweener shot'], ['exhibition', 'a glamorous desert exhibition stadium at night'], ['turn-pro', 'a junior trophy on one side and a pro tour locker on the other'], ['retire', 'an empty stadium at sunset with a racquet left on the baseline']];
const decisions = table([['File', 'Decision', 'Prompt'], ...DECISIONS.map(([id, d]) => [`decisions/${id}.webp`, id, `${d}, cinematic, ${STYLE}, wide 16:9`])]);
const HAIR_DESC: Record<string, string> = {
  buzz: 'very short buzz cut, even length all over', crop: 'short textured crop, slightly messy fringe', sidepart: 'classic short side part, neatly combed',
  quiff: 'short sides with a swept-up quiff on top', curly: 'short tight curls on top, shorter sides', afro: 'full rounded afro',
  messy: 'medium-length tousled messy hair', receding: 'short hair with a receding hairline at the temples', bald: '(no file: the bald head is used)',
  long: 'shoulder-length straight hair tucked behind the ears', manbun: 'hair pulled back into a small bun at the back of the head',
  ponytail: 'hair pulled back into a sporty mid ponytail, a few loose strands at the temples', bun: 'hair pulled up into a neat top bun',
  bob: 'chin-length bob with a light fringe', braids: 'two long box braids hanging in front of the shoulders', pixie: 'short pixie cut with a side-swept fringe',
  highpony: 'high ponytail on the crown, sleek sides',
};
const BACK = new Set(['long', 'ponytail', 'highpony', 'bob', 'braids', 'afro', 'manbun', 'bun']);
const faces = table([['Style', 'Used by', 'Files', 'Prompt for [hairstyle]'],
  ...[...new Set([...HAIR_STYLES_M, ...HAIR_STYLES_F])].map((h) => [h, [HAIR_STYLES_M.includes(h) ? 'ATP' : '', HAIR_STYLES_F.includes(h) ? 'WTA' : ''].filter(Boolean).join(' · '),
    h === 'bald' ? '—' : `hairFront/${h}.png${BACK.has(h) ? ` + hairBack/${h}.png` : ''}`, HAIR_DESC[h] ?? h]),
]);

const md = hand
  .replace('{{FACE_LAYERS}}', faces)
  .replace('{{CARDS}}', cards).replace('{{CARD_KINDS}}', kinds).replace('{{PACKS}}', packs)
  .replace('{{TRINKETS}}', trinkets).replace('{{UPGRADES}}', upgrades).replace('{{EQUIPMENT}}', equip)
  .replace('{{SPECIALS}}', specials).replace('{{TRAINING}}', focuses).replace('{{STAFF}}', staff)
  .replace('{{MILESTONES}}', milestones).replace('{{DECISIONS}}', decisions)
  .replace(/\{\{STYLE\}\}/g, STYLE);
writeFileSync('docs/ART_BRIEF.md', md);
console.log('docs/ART_BRIEF.md written,', md.length, 'chars');
