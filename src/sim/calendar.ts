import { Tournament, TournamentTier, Surface } from './types';

// Points awarded by tier. Real-tennis-inspired.
const POINTS_BY_TIER: Record<TournamentTier, Tournament['points']> = {
  GS:    { winner: 2000, runnerUp: 1300, sf: 780,  qf: 430,  r16: 240, r32: 130, r64: 70, r128: 10 },
  M1000: { winner: 1000, runnerUp: 650,  sf: 390,  qf: 215,  r16: 120, r32: 65,  r64: 10, r128: 0 },
  WTF:   { winner: 1500, runnerUp: 1000, sf: 600,  qf: 200,  r16: 0,   r32: 0,   r64: 0,  r128: 0 }, // 8-player round-robin abstraction
  T500:  { winner: 500,  runnerUp: 330,  sf: 200,  qf: 100,  r16: 50,  r32: 0,   r64: 0,  r128: 0 },
  T250:  { winner: 250,  runnerUp: 165,  sf: 100,  qf: 50,   r16: 25,  r32: 0,   r64: 0,  r128: 0 },
};

const DRAW_SIZE: Record<TournamentTier, number> = {
  GS: 96, // we'll do a "best 32 enter directly + 64 prelim" mental model but bracket runs from R64 onwards after the prelim
  M1000: 64,
  T500: 32,
  T250: 32,
  WTF: 8,
};

// Define a fixed annual calendar (week 1 = January, week 52 = December)
// Slots: GS, M1000, WTF, plus 500/250 fillers
interface TemplateEntry {
  name: string;
  tier: TournamentTier;
  surface: Surface;
  week: number; // start week
  duration: number; // weeks
}

const TEMPLATE: TemplateEntry[] = [
  // ===== HARD-COURT JANUARY =====
  { name: 'Brisbane Open',       tier: 'T250',  surface: 'hard',  week: 1,  duration: 1 },
  { name: 'Adelaide Open',       tier: 'T250',  surface: 'hard',  week: 2,  duration: 1 },
  // GS: Australian Open (wks 3-4)
  { name: 'Australian Open',     tier: 'GS',    surface: 'hard',  week: 3,  duration: 2 },
  // ===== FEB: post-AO + South America clay swing =====
  { name: 'Rotterdam 500',       tier: 'T500',  surface: 'hard',  week: 5,  duration: 1 },
  { name: 'Buenos Aires 250',    tier: 'T250',  surface: 'clay',  week: 6,  duration: 1 },
  { name: 'Rio Open 500',        tier: 'T500',  surface: 'clay',  week: 7,  duration: 1 },
  { name: 'Marseille 250',       tier: 'T250',  surface: 'hard',  week: 8,  duration: 1 },
  { name: 'Dubai 500',           tier: 'T500',  surface: 'hard',  week: 9,  duration: 1 },
  // ===== SUNSHINE DOUBLE (M1000 wk 10-11, 12-13) =====
  { name: 'Indian Wells Masters', tier: 'M1000', surface: 'hard',  week: 10, duration: 2 },
  { name: 'Miami Open Masters',  tier: 'M1000', surface: 'hard',  week: 12, duration: 2 },
  // ===== CLAY SEASON =====
  { name: 'Marrakech 250',       tier: 'T250',  surface: 'clay',  week: 14, duration: 1 },
  { name: 'Monte Carlo Masters', tier: 'M1000', surface: 'clay',  week: 15, duration: 1 },
  { name: 'Barcelona 500',       tier: 'T500',  surface: 'clay',  week: 16, duration: 1 },
  { name: 'Munich 500',          tier: 'T500',  surface: 'clay',  week: 17, duration: 1 },
  { name: 'Madrid Masters',      tier: 'M1000', surface: 'clay',  week: 18, duration: 1 },
  { name: 'Italian Open Masters', tier: 'M1000', surface: 'clay',  week: 19, duration: 1 },
  { name: 'Geneva 250',          tier: 'T250',  surface: 'clay',  week: 20, duration: 1 },
  // Roland Garros (wks 21-22)
  { name: 'Roland Garros',       tier: 'GS',    surface: 'clay',  week: 21, duration: 2 },
  // ===== GRASS SEASON =====
  { name: 'Stuttgart 250',       tier: 'T250',  surface: 'grass', week: 23, duration: 1 },
  { name: 'Halle 500',           tier: 'T500',  surface: 'grass', week: 24, duration: 1 },
  { name: 'Queens Club 500',     tier: 'T500',  surface: 'grass', week: 25, duration: 1 },
  // Wimbledon (wks 26-27)
  { name: 'Wimbledon',           tier: 'GS',    surface: 'grass', week: 26, duration: 2 },
  // ===== NORTH AMERICAN HARD SUMMER =====
  { name: 'Newport 250',         tier: 'T250',  surface: 'grass', week: 28, duration: 1 },
  { name: 'Atlanta 250',         tier: 'T250',  surface: 'hard',  week: 29, duration: 1 },
  { name: 'Washington 500',      tier: 'T500',  surface: 'hard',  week: 30, duration: 1 },
  { name: 'Canadian Open Masters', tier: 'M1000', surface: 'hard', week: 31, duration: 1 },
  { name: 'Cincinnati Masters',  tier: 'M1000', surface: 'hard',  week: 32, duration: 1 },
  { name: 'Winston-Salem 250',   tier: 'T250',  surface: 'hard',  week: 33, duration: 1 },
  // US Open (wks 34-35)
  { name: 'US Open',             tier: 'GS',    surface: 'hard',  week: 34, duration: 2 },
  // ===== ASIAN/EUROPEAN HARD FALL =====
  { name: 'Chengdu 250',         tier: 'T250',  surface: 'hard',  week: 36, duration: 1 },
  { name: 'Tokyo 500',           tier: 'T500',  surface: 'hard',  week: 37, duration: 1 },
  { name: 'Beijing 500',         tier: 'T500',  surface: 'hard',  week: 38, duration: 1 },
  { name: 'Shanghai Masters',    tier: 'M1000', surface: 'hard',  week: 39, duration: 1 },
  { name: 'Stockholm 250',       tier: 'T250',  surface: 'hard',  week: 40, duration: 1 },
  { name: 'Vienna 500',          tier: 'T500',  surface: 'hard',  week: 41, duration: 1 },
  { name: 'Basel 500',           tier: 'T500',  surface: 'hard',  week: 42, duration: 1 },
  { name: 'Paris Masters',       tier: 'M1000', surface: 'hard',  week: 43, duration: 1 },
  { name: 'Metz 250',            tier: 'T250',  surface: 'hard',  week: 44, duration: 1 },
  // WTF (wk 45) and then offseason
  { name: 'World Tour Finals',   tier: 'WTF',   surface: 'hard',  week: 45, duration: 1 },
  // (weeks 46-52 = offseason)
];

export function buildCalendarForYear(year: number): Tournament[] {
  return TEMPLATE.map(t => {
    const id = `${year}-${t.name.replace(/\s+/g, '_')}`;
    const absoluteWeek = (year - 1) * 52 + t.week;
    return {
      id,
      name: t.name,
      tier: t.tier,
      surface: t.surface,
      weekIndex: absoluteWeek,
      weekOfYear: t.week,
      durationWeeks: t.duration,
      drawSize: DRAW_SIZE[t.tier],
      points: POINTS_BY_TIER[t.tier],
    };
  });
}

// helper: find tournaments active in given week of year
export function tournamentsInWeek(calendar: Tournament[], weekOfYear: number): Tournament[] {
  return calendar.filter(t => weekOfYear >= t.weekOfYear && weekOfYear < t.weekOfYear + t.durationWeeks);
}

// helper: tournaments starting this week
export function tournamentsStartingInWeek(calendar: Tournament[], weekOfYear: number): Tournament[] {
  return calendar.filter(t => t.weekOfYear === weekOfYear);
}

// summary stats
export function calendarStats(calendar: Tournament[]) {
  const byTier: Record<TournamentTier, number> = { GS: 0, M1000: 0, T500: 0, T250: 0, WTF: 0 };
  for (const t of calendar) byTier[t.tier]++;
  return byTier;
}
