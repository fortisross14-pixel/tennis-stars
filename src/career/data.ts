import type { CardDef } from './cards';
import type { Intensity, PackTier, Rarity, SkillKey, StaffKey, Surface } from './types';

export const SKILLS: { key: SkillKey; label: string; short: string; physical?: boolean }[] = [
  { key: 'serve', label: 'Serve', short: 'SRV' },
  { key: 'forehand', label: 'Forehand', short: 'FH' },
  { key: 'backhand', label: 'Backhand', short: 'BH' },
  { key: 'volley', label: 'Volley', short: 'VOL' },
  { key: 'return', label: 'Return', short: 'RET' },
  { key: 'footwork', label: 'Footwork', short: 'MOV', physical: true },
  { key: 'endurance', label: 'Endurance', short: 'END', physical: true },
  { key: 'mentality', label: 'Mentality', short: 'MEN' },
  { key: 'tactics', label: 'Tactics', short: 'TAC' },
];
export const SKILL_KEYS: SkillKey[] = SKILLS.map((s) => s.key);
export const SKILL_LABEL: Record<SkillKey, string> = Object.fromEntries(SKILLS.map((s) => [s.key, s.label])) as Record<SkillKey, string>;

/** Training focuses: weights per skill (1 = full focus). */
export interface FocusDef { id: string; label: string; desc: string; weights: Partial<Record<SkillKey, number>>; surface?: Surface }
export const FOCUSES: FocusDef[] = [
  { id: 'balanced', label: 'All-round', desc: 'A bit of everything.', weights: { serve: .5, forehand: .5, backhand: .5, volley: .5, return: .5, footwork: .5, endurance: .5, mentality: .5, tactics: .5 } },
  { id: 'serve', label: 'Serve', desc: 'Serve and first-strike patterns.', weights: { serve: 1, forehand: .35, mentality: .2 } },
  { id: 'baseline', label: 'Baseline', desc: 'Forehand and backhand depth and power.', weights: { forehand: 1, backhand: 1, footwork: .25 } },
  { id: 'net', label: 'Net game', desc: 'Volleys, approaches and touch.', weights: { volley: 1, serve: .3, tactics: .3 } },
  { id: 'return', label: 'Return', desc: 'Reading serves and neutralising them.', weights: { return: 1, backhand: .3, tactics: .3 } },
  { id: 'movement', label: 'Movement', desc: 'Footwork, court coverage and balance.', weights: { footwork: 1, endurance: .45 } },
  { id: 'fitness', label: 'Fitness block', desc: 'Engine for long matches. Hard on the body.', weights: { endurance: 1, footwork: .45 } },
  { id: 'mental', label: 'Mental & tactics', desc: 'Pressure points, game plans, video.', weights: { mentality: 1, tactics: 1 } },
  { id: 'clay', label: 'Clay block', desc: 'Sliding, patience and spin. Improves clay feel.', weights: { footwork: .6, endurance: .6, forehand: .5 }, surface: 'Clay' },
  { id: 'grass', label: 'Grass block', desc: 'Low balls, first strike, net. Improves grass feel.', weights: { serve: .6, volley: .6, return: .4 }, surface: 'Grass' },
  { id: 'hard', label: 'Hard-court block', desc: 'Pace and transition. Improves hard and indoor feel.', weights: { forehand: .5, backhand: .5, return: .5 }, surface: 'Hard' },
];
export const FOCUS_MAP: Record<string, FocusDef> = Object.fromEntries(FOCUSES.map((f) => [f.id, f]));

export const INTENSITY: Record<Intensity, { label: string; growth: number; fatigue: number; injury: number; desc: string }> = {
  light: { label: 'Light', growth: 0.55, fatigue: 3, injury: 0.0004, desc: 'Ticking over. Little growth, legs stay fresh.' },
  normal: { label: 'Normal', growth: 1.0, fatigue: 9, injury: 0.0012, desc: 'A solid week of work.' },
  hard: { label: 'Hard', growth: 1.4, fatigue: 17, injury: 0.0035, desc: 'Double sessions. Real gains, real fatigue.' },
  brutal: { label: 'Brutal', growth: 1.75, fatigue: 27, injury: 0.009, desc: 'Boot camp. Big gains, injury risk climbs.' },
};

export const STAFF: Record<StaffKey, { label: string; icon: string; desc: string; levels: { name: string; weekly: number }[] }> = {
  coach: { label: 'Coach', icon: '🎾', desc: 'Training growth ×1.00 / ×1.15 / ×1.30 / ×1.45.', levels: [{ name: 'Club coach (family)', weekly: 0 }, { name: 'Regional coach', weekly: 500 }, { name: 'Tour coach', weekly: 1800 }, { name: 'Former Slam champion', weekly: 6000 }] },
  physio: { label: 'Physio', icon: '🩺', desc: 'Faster recovery, fewer injuries.', levels: [{ name: 'None', weekly: 0 }, { name: 'Part-time physio', weekly: 350 }, { name: 'Travelling physio', weekly: 1300 }, { name: 'Medical team', weekly: 4200 }] },
  fitness: { label: 'Fitness trainer', icon: '🏋', desc: 'Endurance and movement grow faster; slower decline after 28.', levels: [{ name: 'None', weekly: 0 }, { name: 'Gym membership', weekly: 250 }, { name: 'Fitness coach', weekly: 1000 }, { name: 'Performance team', weekly: 3200 }] },
  mental: { label: 'Mental coach', icon: '🧠', desc: 'Confidence holds after losses; mentality grows faster.', levels: [{ name: 'None', weekly: 0 }, { name: 'Sports psychologist', weekly: 300 }, { name: 'Mental-performance coach', weekly: 1100 }, { name: 'Elite mindset team', weekly: 3000 }] },
};
export const COACH_GROWTH = [1, 1.15, 1.3, 1.45];

// Prize money (USD) by level and round reached. Q = lost in qualifying.
export const PRIZE: Record<string, Record<string, number>> = {
  ITF: { Q: 0, R32: 240, R16: 420, QF: 720, SF: 1250, F: 2100, W: 3600 },
  Challenger: { Q: 350, R32: 1100, R16: 2000, QF: 3500, SF: 6000, F: 10500, W: 18000 },
  'WTA 125': { Q: 350, R32: 1100, R16: 2000, QF: 3500, SF: 6000, F: 10500, W: 18000 },
  '250': { Q: 2500, R32: 7500, R16: 12500, QF: 21000, SF: 36000, F: 62000, W: 105000 },
  '500': { Q: 6000, R32: 18000, R16: 33000, QF: 62000, SF: 118000, F: 220000, W: 420000 },
  '1000': { Q: 12000, R64: 28000, R32: 48000, R16: 88000, QF: 160000, SF: 290000, F: 530000, W: 1000000 },
  'Grand Slam': { Q: 22000, R128: 78000, R64: 115000, R32: 175000, R16: 285000, QF: 480000, SF: 800000, F: 1500000, W: 3000000 },
  Finals: { QF: 320000, SF: 700000, F: 1300000, W: 2600000 },
  Olympics: {}, Team: {},
};
export const DOUBLES_PRIZE_SHARE = 0.16;

export const ROUND_ORDER = ['Q', 'R128', 'R64', 'R32', 'R16', 'QF', 'SF', 'F', 'W'];
export const ROUND_NAME: Record<string, string> = { Q: 'Qualifying', R128: 'First round', R64: 'Round of 64', R32: 'Round of 32', R16: 'Round of 16', QF: 'Quarterfinal', SF: 'Semifinal', F: 'Final', W: 'Champion' };

// Regions for travel costs.
const REGION_LIST: Record<string, string[]> = {
  europe: ['ESP', 'FRA', 'ITA', 'GER', 'GBR', 'NED', 'BEL', 'SUI', 'AUT', 'CZE', 'SVK', 'POL', 'CRO', 'SRB', 'SLO', 'BIH', 'HUN', 'ROU', 'BUL', 'GRE', 'POR', 'DEN', 'NOR', 'SWE', 'FIN', 'EST', 'UKR', 'RUS', 'MON', 'TUR', 'GEO', 'ISR'],
  northamerica: ['USA', 'CAN', 'MEX', 'DOM'],
  southamerica: ['ARG', 'BRA', 'CHI', 'COL', 'PER', 'URU', 'ECU'],
  asia: ['CHN', 'JPN', 'KOR', 'IND', 'THA', 'PHI', 'KAZ', 'UZB', 'QAT', 'UAE', 'KUW', 'IRI', 'TPE', 'INA'],
  africa: ['TUN', 'EGY', 'MAR', 'RSA', 'NGR', 'KEN', 'ETH', 'ERI', 'UGA'],
  oceania: ['AUS', 'NZL'],
};
export const REGION: Record<string, string> = Object.fromEntries(Object.entries(REGION_LIST).flatMap(([r, cs]) => cs.map((c) => [c, r])));
export function travelCost(home: string, host: string): number {
  if (!host || host === 'INT') return 1800;
  if (home === host) return 250;
  const a = REGION[home] ?? 'other', b = REGION[host] ?? 'other';
  if (a === b) return 900;
  // Europe <-> North Africa is a short hop.
  if ((a === 'europe' && b === 'africa') || (a === 'africa' && b === 'europe')) return 1100;
  return 2600;
}
export const LIVING_COST = 450;

export const POTENTIAL_TIERS: { name: string; min: number; max: number; stars: number }[] = [
  { name: 'Common', min: 60, max: 68, stars: 1 },
  { name: 'Uncommon', min: 67, max: 75, stars: 2 },
  { name: 'Rare', min: 76, max: 83, stars: 3 },
  { name: 'Epic', min: 83, max: 89, stars: 4 },
  { name: 'Legend', min: 87, max: 92, stars: 5 },
  { name: 'Generational', min: 91, max: 96, stars: 5 },
];
// Relative odds per tier. Epic and Legend are unlocked in the legacy shop (upgrade "Talent Pool");
// Generational can only appear once Legend is unlocked.
export const POTENTIAL_WEIGHTS = [30, 42, 28, 11, 4, 0.6];
/** Highest tier index a career can roll: 2 = Rare (start), 3 = Epic, 5 = Legend and Generational. */
export function maxPotentialTier(talent: number) { return talent >= 2 ? 5 : talent >= 1 ? 3 : 2; }

export const STYLES = ['Aggressive baseline', 'Defensive baseline', 'Counterpuncher', 'All-court', 'Serve-and-volley', 'Big server', 'Clay grinder', 'Precision attacker'];
export const STYLE_CEILING: Record<string, Partial<Record<SkillKey, number>>> = {
  'Aggressive baseline': { forehand: 6, serve: 3, return: 1, endurance: -2, volley: -2 },
  'Defensive baseline': { footwork: 6, backhand: 4, endurance: 5, serve: -3, volley: -2 },
  Counterpuncher: { return: 6, footwork: 5, mentality: 3, serve: -2 },
  'All-court': { tactics: 5, volley: 4, footwork: 2 },
  'Serve-and-volley': { serve: 7, volley: 8, mentality: 2, endurance: -3, return: -2 },
  'Big server': { serve: 10, forehand: 4, mentality: 2, return: -5, footwork: -3 },
  'Clay grinder': { endurance: 8, footwork: 7, forehand: 4, serve: -3, volley: -5 },
  'Precision attacker': { forehand: 4, backhand: 5, tactics: 6, endurance: -1 },
};
export const STYLE_SURFACE: Record<string, Surface> = {
  'Aggressive baseline': 'Hard', 'Defensive baseline': 'Clay', Counterpuncher: 'Hard', 'All-court': 'Hard',
  'Serve-and-volley': 'Grass', 'Big server': 'Indoor', 'Clay grinder': 'Clay', 'Precision attacker': 'Hard',
};

// Special skills. Effects live in src/sim/match.js (specialEdge).
export interface SpecialDef { id: string; name: string; icon: string; desc: string; unlock: string }
export const SPECIALS: SpecialDef[] = [
  { id: 'fighter', name: 'Never Say Die', icon: '🔥', desc: 'Stronger when a set down.', unlock: 'Win 5 matches after losing the first set.' },
  { id: 'tiebreak-ace', name: 'Tie-break Ace', icon: '🎯', desc: 'Much stronger in tie-breaks.', unlock: 'Win 15 tie-break sets.' },
  { id: 'giant-killer', name: 'Giant Killer', icon: '🗡', desc: 'Stronger against top-20 players.', unlock: 'Beat 3 top-20 players.' },
  { id: 'clay-instinct', name: 'Clay Instinct', icon: '🟧', desc: 'Stronger on clay.', unlock: 'Win 30 matches on clay.' },
  { id: 'grass-feel', name: 'Grass Feel', icon: '🌿', desc: 'Stronger on grass.', unlock: 'Win 12 matches on grass.' },
  { id: 'hard-hitter', name: 'Hard-court Hitter', icon: '🔷', desc: 'Stronger on hard courts.', unlock: 'Win 40 matches on hard courts.' },
  { id: 'indoor-ace', name: 'Indoor Ace', icon: '🏟', desc: 'Stronger indoors.', unlock: 'Win 15 matches indoors.' },
  { id: 'big-stage', name: 'Big Stage', icon: '⭐', desc: 'Stronger from the quarterfinals of Slams, Masters and Finals.', unlock: 'Reach a Slam or Masters quarterfinal.' },
  { id: 'home-hero', name: 'Home Hero', icon: '🏠', desc: 'Stronger at home events.', unlock: 'Win a title in your own country.' },
  { id: 'iron-legs', name: 'Iron Legs', icon: '🦵', desc: 'Stronger in deciding sets.', unlock: 'Win 8 deciding sets.' },
  { id: 'qualifier-grit', name: "Qualifier's Grit", icon: '⛏', desc: 'Stronger against higher-ranked players at smaller events.', unlock: 'Qualify for 4 main draws.' },
  { id: 'fast-starter', name: 'Fast Starter', icon: '⚡', desc: 'Stronger in the first set.', unlock: 'Cards only.' },
  { id: 'closer', name: 'Closer', icon: '🔒', desc: 'Stronger when a set up.', unlock: 'Cards only.' },
];
export const SPECIAL_MAP: Record<string, SpecialDef> = Object.fromEntries(SPECIALS.map((s) => [s.id, s]));

export const RARITY_COLOR: Record<Rarity, string> = { common: '#9aa5ad', uncommon: '#2fae68', rare: '#2f7bf0', epic: '#9a4cf0', legendary: '#e8a400' };
// Packs share the rarity colour system: each pack wears the colour of the best rarity it usually brings.
// (IDs stay bronze/silver/gold/elite for save compatibility; only names and colours are shown.)
export const PACKS: Record<PackTier, { name: string; cards: number; odds: Record<Rarity, number>; color: string; accent: string; rarity: Rarity }> = {
  bronze: { name: 'Club pack', cards: 3, odds: { common: .72, uncommon: .22, rare: .055, epic: .005, legendary: 0 }, color: '#2fae68', accent: '#bff5d6', rarity: 'uncommon' },
  silver: { name: 'Tour pack', cards: 4, odds: { common: .45, uncommon: .35, rare: .16, epic: .035, legendary: .005 }, color: '#2f7bf0', accent: '#cfe2ff', rarity: 'rare' },
  gold: { name: 'Pro pack', cards: 4, odds: { common: .15, uncommon: .38, rare: .32, epic: .12, legendary: .03 }, color: '#9a4cf0', accent: '#e6d3ff', rarity: 'epic' },
  elite: { name: 'Champion pack', cards: 5, odds: { common: 0, uncommon: .2, rare: .45, epic: .27, legendary: .08 }, color: '#e8a400', accent: '#fff0b8', rarity: 'legendary' },
};

export type { CardDef };

// ---------------------------------------------------------------------------
// Week slots: a week without a tournament has three slots.
// ---------------------------------------------------------------------------
export const SLOT_ACTIVITIES: { kind: 'rest' | 'train' | 'sponsor' | 'media' | 'recovery' | 'video'; label: string; icon: string; desc: string }[] = [
  { kind: 'rest', label: 'Rest', icon: '🛌', desc: 'Recover fatigue and health.' },
  { kind: 'train', label: 'Training', icon: '🏋', desc: 'A third of a training week: pick a focus and an intensity.' },
  { kind: 'recovery', label: 'Recovery session', icon: '🧊', desc: 'Ice, massage, physio: extra fatigue recovery. $150 (free with a physio).' },
  { kind: 'video', label: 'Video study', icon: '📺', desc: 'Tactics and mentality grow a little. Light on the body.' },
  { kind: 'sponsor', label: 'Sponsor work', icon: '💼', desc: 'Shoots and appearances: money, a little fatigue. Pays more as you rise.' },
  { kind: 'media', label: 'Media day', icon: '🎙', desc: 'Interviews and social media: fame and a little confidence.' },
];
export const RECOVERY_SLOT_COST = 150;

// ---------------------------------------------------------------------------
// Equipment, bought with prize money. Permanent and stackable across slots
// (one item per slot); it can lift a skill slightly past your potential.
// ---------------------------------------------------------------------------
export interface EquipmentDef { id: string; slot: 'racquet' | 'strings' | 'shoes' | 'body' | 'tech'; name: string; icon: string; price: number; desc: string; skills: Partial<Record<SkillKey, number>>; recovery?: number; injury?: number }
export const EQUIPMENT: EquipmentDef[] = [
  { id: 'rq-1', slot: 'racquet', name: 'Tour racquet', icon: '🎾', price: 2500, desc: '+1 Serve, +1 Forehand.', skills: { serve: 1, forehand: 1 } },
  { id: 'rq-2', slot: 'racquet', name: 'Pro-stock frame', icon: '🎾', price: 18000, desc: '+2 Serve, +2 Forehand, +1 Backhand.', skills: { serve: 2, forehand: 2, backhand: 1 } },
  { id: 'rq-3', slot: 'racquet', name: 'Custom-weighted frame', icon: '🎾', price: 90000, desc: '+3 Serve, +3 Forehand, +2 Backhand.', skills: { serve: 3, forehand: 3, backhand: 2 } },
  { id: 'st-1', slot: 'strings', name: 'Hybrid strings', icon: '🧵', price: 1800, desc: '+1 Return, +1 Backhand.', skills: { return: 1, backhand: 1 } },
  { id: 'st-2', slot: 'strings', name: 'Natural gut, stringer on tour', icon: '🧵', price: 25000, desc: '+2 Return, +2 Backhand, +1 Volley.', skills: { return: 2, backhand: 2, volley: 1 } },
  { id: 'sh-1', slot: 'shoes', name: 'Court shoes', icon: '👟', price: 1200, desc: '+1 Footwork.', skills: { footwork: 1 } },
  { id: 'sh-2', slot: 'shoes', name: 'Custom insoles and surface-specific shoes', icon: '👟', price: 15000, desc: '+2 Footwork, +1 Endurance, injury risk −10%.', skills: { footwork: 2, endurance: 1 }, injury: 0.1 },
  { id: 'bd-1', slot: 'body', name: 'Recovery boots', icon: '🦵', price: 6000, desc: 'Recover 3 more fatigue every week.', skills: {}, recovery: 3 },
  { id: 'bd-2', slot: 'body', name: 'Home cryo and altitude tent', icon: '❄', price: 60000, desc: 'Recover 6 more fatigue every week, +1 Endurance.', skills: { endurance: 1 }, recovery: 6 },
  { id: 'tc-1', slot: 'tech', name: 'Match-analysis subscription', icon: '📊', price: 4000, desc: '+1 Tactics.', skills: { tactics: 1 } },
  { id: 'tc-2', slot: 'tech', name: 'Personal data analyst', icon: '🧮', price: 40000, desc: '+2 Tactics, +1 Mentality, +1 Return.', skills: { tactics: 2, mentality: 1, return: 1 } },
];
export const EQUIPMENT_MAP: Record<string, EquipmentDef> = Object.fromEntries(EQUIPMENT.map((e) => [e.id, e]));

/** Card packs for sale (bought with money). */
export const PACK_PRICES: Record<PackTier, number> = { bronze: 2500, silver: 9000, gold: 32000, elite: 110000 };

/** Creation: a few points to put into skills beyond your style. Each point is +1 start and +1 potential. */
export const CREATION_POINTS = 8;
export const CREATION_MAX_PER_SKILL = 3;
