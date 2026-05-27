export type Surface = 'hard' | 'clay' | 'grass';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legend';
export type TournamentTier = 'GS' | 'M1000' | 'T500' | 'T250' | 'WTF';
// WTF = World Tour Finals = year-end Masters

export interface PlayerSkills {
  forehand: number;
  backhand: number;
  serve: number;
  volleys: number;
  physical: number; // affects in-match
}

export interface Player {
  id: number;
  firstName: string;
  surname: string;
  countryCode: string;
  iso2: string;     // ISO alpha-2 lowercase for flag display
  flag: string;
  rarity: Rarity;
  surfaceSpec: Surface; // primary specialization
  baseSkill: number; // anchored by rarity (e.g., 93 for a legend)
  yearlySkill: number; // current year's rating within +/-5 of base
  prevYearSkill: number; // for offseason "improvement" view
  // dynamic state
  skills: PlayerSkills; // derived from yearlySkill + spec + surface adjustments stored as ratings 0-100
  baseStaminaMax: number; // 80..100
  stamina: number; // current, 0..baseStaminaMax
  morale: number; // 0..100, year starts at 65
  // career
  careerLength: number; // 8..14
  yearsRemaining: number; // counts down each offseason
  yearInCareer: number; // 1..careerLength
  retired: boolean;
  // historical
  careerPoints: number;
  careerMatchesPlayed: number;
  careerMatchesWon: number;
  careerTitles: number;
  careerGS: number;
  careerM1000: number;
  // ranking points by tournament: array of {points, dateWeek (absolute week index)} for rolling 52 weeks
  pointsHistory: { points: number; weekIndex: number; tournamentId: string }[];
  yearPoints: number; // calendar year (resets at offseason)
  // results by year for "year summary"
  yearStartRanking: number;
}

export interface Tournament {
  id: string;
  name: string;
  tier: TournamentTier;
  surface: Surface;
  weekIndex: number; // absolute week (year*52 + week)
  weekOfYear: number; // 1..52
  durationWeeks: number; // 1 or 2 (GS=2)
  drawSize: number; // 96, 64, 32, 8 (WTF)
  points: { winner: number; runnerUp: number; sf: number; qf: number; r16: number; r32: number; r64: number; r128: number };
  // results once played
  winnerId?: number;
  runnerUpId?: number;
  finalScore?: string; // like "3-1" in sets
  bracket?: Round[]; // filled after sim
}

export interface MatchPlayer {
  playerId: number;
  isWinner?: boolean;
}

export interface Match {
  p1: number;
  p2: number;
  winner?: number;
  sets?: { p1: number; p2: number }[]; // games won per set
  scoreLine?: string; // "6-3 7-5" or "3-0" sets summary
}

export interface Round {
  name: string; // "R128", "R64", "R32", "R16", "QF", "SF", "F"
  matches: Match[];
}

export interface YearSummary {
  year: number;
  mostPoints: { playerId: number; points: number };
  mostTitles: { playerId: number; titles: number };
  mostImproved: { playerId: number; delta: number };
  grandSlamWinners: { tournamentName: string; winnerId: number }[];
  retirements: number[];
  rookies: number[];
  skillChanges: { playerId: number; before: number; after: number; delta: number }[];
}

export interface HistoricalTournamentResult {
  year: number;
  tournamentName: string;
  winnerId: number;
  winnerName: string;
  winnerFlag: string;
  runnerUpId: number;
  runnerUpName: string;
  runnerUpFlag: string;
  scoreLine: string;
}

export interface GameState {
  year: number; // in-game year, starts at 1
  currentWeek: number; // 1..52
  absoluteWeek: number; // cumulative
  players: Player[];
  calendar: Tournament[]; // for current year
  history: HistoricalTournamentResult[]; // all years
  pastYearSummaries: YearSummary[];
  // current sim state
  activeTournamentId?: string;
  rankingView: 'rolling52' | 'calendar';
  // for ID counters
  nextPlayerId: number;
}
