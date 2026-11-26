import type { Rarity, SkillKey, Skills } from './types';

export type CardKind = 'drill' | 'boost' | 'recovery' | 'potential' | 'special' | 'money' | 'wildcard' | 'match';
export interface CardDef {
  id: string; name: string; kind: CardKind; rarity: Rarity; desc: string; icon: string;
  skills?: Partial<Skills>;          // drill: permanent; boost: for the week
  all?: number;                      // +n to every skill (drill/boost/potential)
  edge?: number;                     // boost: flat match edge
  pct?: number;                      // boost: +x% to every skill
  weeks?: number;                    // boost: number of tournaments it lasts
  ceiling?: Partial<Skills>;         // potential
  ceilingAll?: number;
  ceilingRandom?: number;
  fatigue?: number; health?: number; heal?: number; confidence?: number;
  money?: number; special?: string; wildcard?: number;
  matchEdge?: number;               // match card: edge for one set (setPick) or the whole match
  setPick?: boolean;                // match card: you choose the set it fires in
}

const CARDS: CardDef[] = [];
const SK: [SkillKey, string][] = [['serve', 'Serve'], ['forehand', 'Forehand'], ['backhand', 'Backhand'], ['volley', 'Volley'], ['return', 'Return'], ['footwork', 'Footwork'], ['endurance', 'Endurance'], ['mentality', 'Mentality'], ['tactics', 'Tactics']];
for (const [k, label] of SK) {
  CARDS.push({ id: `dr-${k}-1`, name: `${label} Drill`, kind: 'drill', rarity: 'common', icon: '🎾', desc: `+1 ${label}.`, skills: { [k]: 1 } });
  CARDS.push({ id: `dr-${k}-2`, name: `${label} Session`, kind: 'drill', rarity: 'uncommon', icon: '🎾', desc: `+2 ${label}.`, skills: { [k]: 2 } });
  CARDS.push({ id: `dr-${k}-4`, name: `${label} Masterclass`, kind: 'drill', rarity: 'rare', icon: '🏅', desc: `+4 ${label}.`, skills: { [k]: 4 } });
}
const COMBOS: [string, string, SkillKey[]][] = [
  ['sv', 'Serve & Volley Clinic', ['serve', 'volley']], ['base', 'Baseline Camp', ['forehand', 'backhand']], ['ret', 'Return Lab', ['return', 'tactics']],
  ['move', 'Movement Block', ['footwork', 'endurance']], ['mind', 'Mind Gym', ['mentality', 'tactics']], ['first', 'First-Strike Patterns', ['serve', 'forehand']],
];
for (const [id, name, keys] of COMBOS) {
  CARDS.push({ id: `cb-${id}-1`, name, kind: 'drill', rarity: 'uncommon', icon: '🧩', desc: `+1 ${keys.join(' & ')}.`, skills: Object.fromEntries(keys.map((k) => [k, 1])) });
  CARDS.push({ id: `cb-${id}-3`, name: `Elite ${name}`, kind: 'drill', rarity: 'epic', icon: '💎', desc: `+3 ${keys.join(' & ')}.`, skills: Object.fromEntries(keys.map((k) => [k, 3])) });
}
CARDS.push({ id: 'dr-all-2', name: 'Perfect Pre-Season', kind: 'drill', rarity: 'legendary', icon: '👑', desc: '+2 to every skill.', all: 2 });

CARDS.push(
  { id: 'bo-ace', name: 'Ace Machine', kind: 'boost', rarity: 'uncommon', icon: '💥', desc: '+8 Serve for your next tournament.', skills: { serve: 8 }, weeks: 1 },
  { id: 'bo-fh', name: 'Forehand on Fire', kind: 'boost', rarity: 'uncommon', icon: '🔥', desc: '+8 Forehand for your next tournament.', skills: { forehand: 8 }, weeks: 1 },
  { id: 'bo-wall', name: 'The Wall', kind: 'boost', rarity: 'uncommon', icon: '🧱', desc: '+6 Return and Footwork for your next tournament.', skills: { return: 6, footwork: 6 }, weeks: 1 },
  { id: 'bo-clutch', name: 'Ice in the Veins', kind: 'boost', rarity: 'rare', icon: '🧊', desc: '+9 Mentality and +3 edge for your next tournament.', skills: { mentality: 9 }, edge: 3, weeks: 1 },
  { id: 'bo-legs', name: 'Second Wind', kind: 'boost', rarity: 'common', icon: '🫁', desc: '+8 Endurance for your next tournament and −15 fatigue.', skills: { endurance: 8 }, fatigue: -15, weeks: 1 },
  { id: 'bo-net', name: 'Soft Hands', kind: 'boost', rarity: 'common', icon: '🤲', desc: '+8 Volley for your next tournament.', skills: { volley: 8 }, weeks: 1 },
  { id: 'bo-insp', name: 'Inspiration', kind: 'boost', rarity: 'uncommon', icon: '💡', desc: '+5% to every skill for your next tournament.', pct: 0.05, weeks: 1 },
  { id: 'bo-belief', name: 'Total Belief', kind: 'boost', rarity: 'rare', icon: '🌅', desc: '+8% to every skill and +2 edge for your next tournament.', pct: 0.08, edge: 2, weeks: 1 },
  { id: 'bo-zone', name: 'In the Zone', kind: 'boost', rarity: 'epic', icon: '🌀', desc: '+4 to every skill and +3 edge for your next 2 tournaments.', all: 4, edge: 3, weeks: 2 },
  { id: 'bo-god', name: 'Untouchable', kind: 'boost', rarity: 'legendary', icon: '⚜', desc: '+7 to every skill and +5 edge for your next 2 tournaments.', all: 7, edge: 5, weeks: 2 },
);
CARDS.push(
  { id: 're-ice', name: 'Ice Bath', kind: 'recovery', rarity: 'common', icon: '🧊', desc: '−20 fatigue.', fatigue: -20 },
  { id: 're-massage', name: 'Deep-Tissue Massage', kind: 'recovery', rarity: 'common', icon: '💆', desc: '−12 fatigue, +4 health.', fatigue: -12, health: 4 },
  { id: 're-retreat', name: 'Recovery Retreat', kind: 'recovery', rarity: 'uncommon', icon: '🏝', desc: '−45 fatigue, +8 health.', fatigue: -45, health: 8 },
  { id: 're-physio', name: 'Physio Miracle', kind: 'recovery', rarity: 'rare', icon: '🩹', desc: 'Injury 3 weeks shorter.', heal: 3 },
  { id: 're-surgeon', name: 'Top Surgeon', kind: 'recovery', rarity: 'epic', icon: '⚕', desc: 'Cures any injury.', heal: 99, health: 10 },
  { id: 're-psych', name: 'Sports Psychologist', kind: 'recovery', rarity: 'common', icon: '🗣', desc: '+3 confidence.', confidence: 3 },
);
CARDS.push(
  { id: 'po-spurt', name: 'Growth Spurt', kind: 'potential', rarity: 'uncommon', icon: '📈', desc: '+2 potential in Serve, Footwork and Endurance.', ceiling: { serve: 2, footwork: 2, endurance: 2 } },
  { id: 'po-visit', name: 'Legend Visits Practice', kind: 'potential', rarity: 'rare', icon: '🧓', desc: '+4 potential in one random skill.', ceilingRandom: 4 },
  { id: 'po-gift', name: 'Hidden Gift', kind: 'potential', rarity: 'epic', icon: '🎁', desc: '+2 potential in every skill.', ceilingAll: 2 },
  { id: 'po-gen', name: 'Golden Generation', kind: 'potential', rarity: 'legendary', icon: '🌟', desc: '+4 potential in every skill.', ceilingAll: 4 },
);
CARDS.push(
  { id: 'sp-fast', name: 'Fast Starter', kind: 'special', rarity: 'rare', icon: '⚡', desc: 'Unlock the Fast Starter special skill.', special: 'fast-starter' },
  { id: 'sp-closer', name: 'Closer', kind: 'special', rarity: 'rare', icon: '🔒', desc: 'Unlock the Closer special skill.', special: 'closer' },
  { id: 'sp-fighter', name: 'Never Say Die', kind: 'special', rarity: 'epic', icon: '🔥', desc: 'Unlock the Never Say Die special skill.', special: 'fighter' },
  { id: 'sp-tb', name: 'Tie-break Ace', kind: 'special', rarity: 'epic', icon: '🎯', desc: 'Unlock the Tie-break Ace special skill.', special: 'tiebreak-ace' },
  { id: 'sp-giant', name: 'Giant Killer', kind: 'special', rarity: 'epic', icon: '🗡', desc: 'Unlock the Giant Killer special skill.', special: 'giant-killer' },
  { id: 'sp-big', name: 'Big Stage', kind: 'special', rarity: 'legendary', icon: '⭐', desc: 'Unlock the Big Stage special skill.', special: 'big-stage' },
);
CARDS.push(
  { id: 'mo-local', name: 'Local Sponsor', kind: 'money', rarity: 'common', icon: '💵', desc: '+$2,500.', money: 2500 },
  { id: 'mo-deal', name: 'Racquet Deal', kind: 'money', rarity: 'uncommon', icon: '💰', desc: '+$9,000.', money: 9000 },
  { id: 'mo-exho', name: 'Exhibition Invite', kind: 'money', rarity: 'rare', icon: '🎪', desc: '+$40,000 and +12 fatigue.', money: 40000, fatigue: 12 },
  { id: 'wc-letter', name: 'Wildcard Letter', kind: 'wildcard', rarity: 'rare', icon: '✉', desc: 'A guaranteed wildcard for the next event you enter (not Slams or Masters).', wildcard: 1 },
  { id: 'wc-director', name: "Director's Favour", kind: 'wildcard', rarity: 'epic', icon: '🎟', desc: 'Two guaranteed wildcards (any event below Slams).', wildcard: 2 },
);

// Match cards: taken into a tournament (up to 3) and used one per match, before you play it.
CARDS.push(
  { id: 'mc-towel', name: 'Towel & Banana', kind: 'match', rarity: 'common', icon: '🍌', desc: 'Refuel at the changeover: −10 fatigue before the match.', fatigue: -10 },
  { id: 'mc-fans', name: 'Fan Connection', kind: 'match', rarity: 'common', icon: '🙌', desc: 'The crowd is with you: +2 morale and +3 edge in the set you pick.', confidence: 2, matchEdge: 3, setPick: true },
  { id: 'mc-speech', name: 'Inspirational Speech', kind: 'match', rarity: 'uncommon', icon: '📣', desc: 'Your coach fires you up: +4 morale and +1 edge for the match.', confidence: 4, matchEdge: 1 },
  { id: 'mc-timeout', name: 'Tactical Plan', kind: 'match', rarity: 'uncommon', icon: '📋', desc: 'A plan for one set: +5 edge in the set you pick.', matchEdge: 5, setPick: true },
  { id: 'mc-legs', name: 'Fresh Legs', kind: 'match', rarity: 'rare', icon: '🦵', desc: '−20 fatigue and +2 edge for the match.', fatigue: -20, matchEdge: 2 },
  { id: 'mc-magic', name: 'Magic Set', kind: 'match', rarity: 'rare', icon: '✨', desc: 'Everything clicks: +8 edge in the set you pick.', matchEdge: 8, setPick: true },
  { id: 'mc-crowd', name: 'Crowd Roar', kind: 'match', rarity: 'epic', icon: '🏟', desc: '+4 morale, −10 fatigue and +8 edge in the set you pick.', confidence: 4, fatigue: -10, matchEdge: 8, setPick: true },
  { id: 'mc-flow', name: 'Flow State', kind: 'match', rarity: 'epic', icon: '🌊', desc: '+5 edge for the whole match.', matchEdge: 5 },
  { id: 'mc-aura', name: "Champion's Aura", kind: 'match', rarity: 'legendary', icon: '👑', desc: '+7 edge for the whole match, +5 morale and −15 fatigue.', matchEdge: 7, confidence: 5, fatigue: -15 },
);
export const MATCH_CARD_CHANCE: Record<string, number> = { bronze: .55, silver: .75, gold: .9, elite: 1 };
export const LOADOUT_SIZE = 3;

export const CARD_LIST = CARDS;
export const CARD_MAP: Record<string, CardDef> = Object.fromEntries(CARDS.map((c) => [c.id, c]));
export const CARD_SELL: Record<Rarity, number> = { common: 300, uncommon: 800, rare: 2000, epic: 5000, legendary: 12000 };
export const KIND_LABEL: Record<CardKind, string> = { drill: 'Training', boost: 'Boost', recovery: 'Recovery', potential: 'Potential', special: 'Special skill', money: 'Money', wildcard: 'Wildcard', match: 'Match card' };
