// Career-mode state. It lives inside the Chronicle universe as `universe.career`,
// so one save holds the world and your life in it.

export type Tour = 'ATP' | 'WTA';
export type SkillKey = 'serve' | 'forehand' | 'backhand' | 'volley' | 'return' | 'footwork' | 'endurance' | 'mentality' | 'tactics';
export type Skills = Record<SkillKey, number>;
export type Surface = 'Hard' | 'Clay' | 'Grass' | 'Indoor';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type PackTier = 'bronze' | 'silver' | 'gold' | 'elite';
export type Intensity = 'light' | 'normal' | 'hard' | 'brutal';
export type StaffKey = 'coach' | 'physio' | 'fitness' | 'mental';

/** One third of a week without a tournament. */
export type SlotPlan =
  | { kind: 'rest' }
  | { kind: 'train'; focus: string; intensity: Intensity }
  | { kind: 'sponsor' } | { kind: 'media' } | { kind: 'recovery' } | { kind: 'video' };

export type WeekPlan =
  | { kind: 'compete'; eventId: string; doubles?: boolean }
  | { kind: 'junior'; eventId: string }
  | { kind: 'slots'; slots: SlotPlan[] }
  // older saves (before slots): a whole week of one thing
  | { kind: 'train'; focus: string; intensity: Intensity }
  | { kind: 'rest' };

/** Every match you play, oriented so that 'A' is you. */
export interface MatchRecord {
  id: string; year: number; week: number; event: string; level: string; surface: string; round: string;
  oppId: string; oppName: string; oppCountry: string; oppRank: number; myRank: number;
  won: boolean; score: string; sets: { gameWinners: string[]; servers: string[] }[];
  tags: string[]; minutes: number; qualifying?: boolean; junior?: boolean;
}
export interface TournamentRecord { year: number; week: number; age: number; event: string; level: string; surface: string; entry: string; result: string; prize: number; doubles?: string | null; eventId: string }
export interface MonthSnapshot { year: number; month: number; week: number; base: Skills; rank: number; ranked: boolean; juniorRank: number | null; money: number; totalPrize: number; fame: number; ovr: number; unlocks: number; matches: number; tournaments: number }
export interface MonthReview {
  year: number; month: number; label: string;
  from: MonthSnapshot; to: MonthSnapshot;
  wins: number; losses: number; titles: string[];
  tournaments: { event: string; level: string; result: string; prize: number }[];
  bestWin: { name: string; rank: number; event: string } | null;
  skillDelta: Partial<Skills>; unlocks: UnlockRecord[]; packs: number; injuries: string[];
}
export interface UnlockRecord { kind: 'special' | 'milestone' | 'equipment'; id: string; label: string; year: number; week: number; age: number }

export interface CardInstance { uid: string; id: string }

export interface ActiveBoost { cardId: string; name: string; skills: Partial<Skills>; edge: number; weeks: number; pct?: number }

export interface DecisionOption {
  id: string; label: string; desc: string;
  effects: Effects;
}
export interface Decision { id: string; title: string; text: string; options: DecisionOption[]; seasonEnd?: boolean }

export interface Effects {
  money?: number; fatigue?: number; health?: number; confidence?: number; fame?: number;
  skills?: Partial<Skills>; ceiling?: Partial<Skills>; affinity?: Partial<Record<Surface, number>>;
  cards?: string[]; packs?: PackTier[]; staff?: Partial<Record<StaffKey, number>>;
  partnerId?: string | null; wildcardBonus?: number; injuryWeeks?: number; turnPro?: boolean;
  special?: string; retire?: boolean; federation?: boolean; skipWeek?: boolean;
}

export interface MatchLine {
  eventName: string; level: string; round: string; opponent: string; opponentRank: number;
  won: boolean; score: string; qualifying?: boolean; doubles?: boolean; junior?: boolean; matchId?: string;
}

export interface WeekReport {
  year: number; week: number; age: number;
  plan: WeekPlan; title: string; lines: string[];
  matches: MatchLine[];
  entry?: string;              // Direct, Qualifier, Wild card, not accepted…
  result?: string;             // deepest round
  prize: number; costs: number; income: number;
  rankBefore: number; rankAfter: number; juniorRankAfter?: number | null;
  skillDelta: Partial<Skills>; fatigueAfter: number; injury?: string | null;
  rewards: string[];           // packs, cards, specials, coins
}

export interface SeasonRow {
  year: number; age: number; rankEnd: number; bestRank: number; juniorBest?: number | null;
  wins: number; losses: number; titles: number; prize: number; rating: number;
  titleNames: string[]; bestSlam?: string | null;
}

export interface CoinEvent { id: string; label: string; amount: number; milestone?: string }

export interface CareerFx {
  growth: number; injury: number; plays: number; handBonus: number; luck: number;
  prime: number; wildcard: number; coinMult: number; boostSlots: number;
}

export interface Career {
  version: number;
  playerId: string;
  tour: Tour;
  startYear: number;
  startAge: number;
  base: Skills;              // true ability, before boosts
  ceiling: Skills;           // potential per skill
  potential: string;         // hidden tier name (Common … Generational)
  scoutStars: number;        // visible estimate 1..5
  money: number;
  staff: Record<StaffKey, number>;
  federation: boolean;
  turnedPro: boolean;
  cardPlays: number;
  hand: CardInstance[];
  packs: PackTier[];
  boost: ActiveBoost | null;
  specials: string[];
  wildcardTokens: number;    // guaranteed wildcards (from cards)
  current: WeekPlan;
  defaultTrain: { focus: string; intensity: Intensity };
  plan: Record<string, WeekPlan>;   // keyed `${year}-${week}`
  watchMatches: boolean;
  decision: Decision | null;
  live: { eventId: string } | null;
  pendingWeek: { plan: WeekPlan; rankBefore: number; juniorRankBefore: number | null; base: Skills; money: number; year: number; week: number; age: number; entryNote?: string } | null;
  lastReport: WeekReport | null;
  reports: WeekReport[];
  seasons: SeasonRow[];
  seasonPrize: number;
  totalPrize: number;
  milestones: Record<string, string>;     // id -> "year · week"
  counters: Record<string, number>;
  coinEvents: CoinEvent[];                // not yet credited to the profile
  coinsTotal: number;
  fx: CareerFx;
  trinkets: string[];
  noInjuryUntilYear: number;
  seasonReview: { year: number } | null;
  retired: boolean;
  legacy: { grade: string; score: number; coins: number } | null;
  seed: number;
  uid: number;
  matchLog: MatchRecord[];
  tournamentLog: TournamentRecord[];
  unlocks: UnlockRecord[];
  skillLog: { year: number; age: number; skills: Skills; ceiling: Skills }[];
  equipment: string[];
  watched: Record<string, boolean>;
  monthStart: MonthSnapshot | null;
  monthReview: MonthReview | null;
}
