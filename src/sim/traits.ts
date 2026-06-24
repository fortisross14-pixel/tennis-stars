// Player personality traits. Each player gets exactly one at birth, never changes.
// Traits modify simulation behavior in different ways — applied at specific points.

export type TraitId =
  | 'enhanced_quality'
  | 'final_focus'
  | 'clutch'
  | 'adaptable'
  | 'surface_dominator'
  | 'physical_beast'
  | 'quick_recovery'
  | 'young_star'
  | 'late_bloomer'
  | 'stable_over_years'
  | 'invincible_mentality'
  | 'front_runner'
  | 'comeback_kid';

export interface TraitDef {
  id: TraitId;
  label: string;     // short name shown under player
  short: string;     // short marketing-style tag line
  description: string;  // full explanation in modal
}

export const TRAITS: Record<TraitId, TraitDef> = {
  enhanced_quality: {
    id: 'enhanced_quality',
    label: 'Enhanced Quality',
    short: '+3 to every skill',
    description: 'A natural — every skill rating is boosted by 3 points across their career.',
  },
  final_focus: {
    id: 'final_focus',
    label: 'Final Focus',
    short: '−2 skills · +3 in SF/F',
    description: 'Coasts through early rounds (−2 to all skills) but locks in for the big moments (+3 to all skills in semifinals and finals).',
  },
  clutch: {
    id: 'clutch',
    label: 'Clutch',
    short: '+2 in deciding sets',
    description: 'Plays the biggest points like it\'s nothing. Gains +2 to all skills in the deciding set of a match.',
  },
  adaptable: {
    id: 'adaptable',
    label: 'Adaptable',
    short: 'No off-surface penalty',
    description: 'Treats every court like home. Specialty bonus applies on all surfaces; no off-surface penalty.',
  },
  surface_dominator: {
    id: 'surface_dominator',
    label: 'Surface Dominator',
    short: '+5% on home surface',
    description: 'King of their court. An extra +5% effective strength on their specialty surface.',
  },
  physical_beast: {
    id: 'physical_beast',
    label: 'Physical Beast',
    short: 'Stamina drain halved',
    description: 'Endurance for days. Loses half as much stamina per tournament.',
  },
  quick_recovery: {
    id: 'quick_recovery',
    label: 'Quick Recovery',
    short: '2× stamina recovery',
    description: 'Bounces back fast — recovers stamina at double speed on rest weeks.',
  },
  young_star: {
    id: 'young_star',
    label: 'Young Star',
    short: 'Peaks in rookie year',
    description: 'Arrives ready. Year 1 is at 95% of peak, year 2 at 98% (vs the usual 80/90%).',
  },
  late_bloomer: {
    id: 'late_bloomer',
    label: 'Late Bloomer',
    short: 'Slow start, late peak',
    description: 'Year 1 is just 70% effective, but the peak years come later and last longer.',
  },
  stable_over_years: {
    id: 'stable_over_years',
    label: 'Stable Over Years',
    short: 'Never below base skill',
    description: 'Year-to-year drift can only go up — yearly skill never drops below their base level.',
  },
  invincible_mentality: {
    id: 'invincible_mentality',
    label: 'Invincible Mentality',
    short: 'Saves match points',
    description: 'When facing elimination (down a break in a losing set with one game from defeat), claims the next two games automatically — once per match.',
  },
  front_runner: {
    id: 'front_runner',
    label: 'Front Runner',
    short: 'Strong when ahead',
    description: 'When leading a set by 2+ games, game-win probability is boosted by 20%.',
  },
  comeback_kid: {
    id: 'comeback_kid',
    label: 'Comeback Kid',
    short: 'Dangerous when down',
    description: 'When down a set in a match, all skills get +3 for the remainder of the match.',
  },
};

export const ALL_TRAITS: TraitId[] = Object.keys(TRAITS) as TraitId[];

// Trait rarity weights — some are more common than others.
// Dramatic traits (Invincible, Young Star) are rarer; baseline traits (Adaptable, Clutch) are more common.
const TRAIT_WEIGHTS: Record<TraitId, number> = {
  enhanced_quality:     0.6,
  final_focus:          1.0,
  clutch:               1.5,
  adaptable:            1.2,
  surface_dominator:    1.2,
  physical_beast:       1.0,
  quick_recovery:       1.0,
  young_star:           0.5,
  late_bloomer:         0.5,
  stable_over_years:    0.8,
  invincible_mentality: 0.4,
  front_runner:         1.0,
  comeback_kid:         0.8,
};

// Pick a random trait based on weights
export function rollTrait(): TraitId {
  const entries = Object.entries(TRAIT_WEIGHTS) as [TraitId, number][];
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [id, w] of entries) {
    r -= w;
    if (r <= 0) return id;
  }
  return entries[0][0];
}
