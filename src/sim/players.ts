import { Player, Rarity, Surface, PlayerSkills } from './types';
import { COUNTRIES } from '../data/countries';

// Rarity targets across the 120-player roster
export const RARITY_TARGETS: Record<Rarity, number> = {
  legend: 3,    // 2-4
  epic: 9,      // 8-10
  rare: 20,
  uncommon: 30,
  common: 58,   // remainder to ~120
};

// Base skill ranges per rarity (the anchor; yearly = base +/- 5)
const RARITY_BASE_RANGE: Record<Rarity, [number, number]> = {
  legend: [91, 95],
  epic: [83, 90],
  rare: [76, 82],
  uncommon: [69, 75],
  common: [61, 68],
};

export const SURFACES: Surface[] = ['hard', 'clay', 'grass'];

function randRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
function randInt(min: number, max: number): number {
  return Math.floor(randRange(min, max + 1));
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Apply year multiplier (rookie 80%, year 2 90%, last year 90%, otherwise 100%)
export function yearMultiplier(yearInCareer: number, careerLength: number): number {
  if (yearInCareer === 1) return 0.80;
  if (yearInCareer === 2) return 0.90;
  if (yearInCareer === careerLength) return 0.90;
  return 1.0;
}

// Yearly skill from base (anchored; not absolute random)
// Within +/-5 of base, biased toward the base
function generateYearlySkill(baseSkill: number): number {
  // gaussian-ish via average of two uniforms
  const r = (Math.random() + Math.random()) / 2; // 0..1, peaked at 0.5
  const offset = (r - 0.5) * 10; // -5..+5
  return Math.round(baseSkill + offset);
}

// Derive per-skill ratings from yearly skill + surface specialization.
// Specialization gives a small boost to certain skills, mild penalty to others.
// Hard surface specialists -> stronger serve/volleys; clay -> stronger forehand/physical; grass -> stronger serve/volleys with backhand variance
function deriveSkillsForYear(yearlySkill: number, spec: Surface, physBase: number): PlayerSkills {
  // Each skill is yearlySkill +/- small noise, with specialty modifiers
  const noise = () => (Math.random() - 0.5) * 4; // small per-skill randomness
  let fh = yearlySkill + noise();
  let bh = yearlySkill + noise();
  let sv = yearlySkill + noise();
  let vl = yearlySkill + noise();
  // Specialization
  if (spec === 'hard') {
    sv += 4; vl += 3; fh += 1;
  } else if (spec === 'clay') {
    fh += 4; bh += 2; vl -= 2;
  } else {
    sv += 5; vl += 4; bh -= 2;
  }
  // clamp
  const clamp = (v: number) => Math.max(40, Math.min(100, Math.round(v)));
  return {
    forehand: clamp(fh),
    backhand: clamp(bh),
    serve: clamp(sv),
    volleys: clamp(vl),
    physical: clamp(physBase + noise()),
  };
}

export function generatePlayer(
  id: number,
  rarity: Rarity,
  yearInCareer: number,
  careerLength: number,
): Player {
  const country = pick(COUNTRIES);
  const firstName = pick(country.firstNames);
  const surname = pick(country.surnames);
  const [bMin, bMax] = RARITY_BASE_RANGE[rarity];
  const baseSkill = randInt(bMin, bMax);
  const yearly = generateYearlySkill(baseSkill);
  // Apply career multiplier to yearly skill effective rating
  const mult = yearMultiplier(yearInCareer, careerLength);
  const effectiveYearly = Math.round(yearly * mult);
  const spec = pick(SURFACES);
  const physBase = effectiveYearly; // physical based on year too
  const skills = deriveSkillsForYear(effectiveYearly, spec, physBase);
  const baseStaminaMax = randInt(80, 100);
  return {
    id,
    firstName,
    surname,
    countryCode: country.code,
    iso2: country.iso2,
    flag: country.flag,
    rarity,
    surfaceSpec: spec,
    baseSkill,
    yearlySkill: effectiveYearly,
    prevYearSkill: effectiveYearly,
    skills,
    baseStaminaMax,
    stamina: baseStaminaMax,
    morale: 65,
    careerLength,
    yearsRemaining: careerLength - yearInCareer + 1,
    yearInCareer,
    retired: false,
    careerPoints: 0,
    careerMatchesPlayed: 0,
    careerMatchesWon: 0,
    careerTitles: 0,
    careerGS: 0,
    careerM1000: 0,
    pointsHistory: [],
    yearPoints: 0,
    yearStartRanking: 0,
  };
}

// Initial roster: 120 players with rarity targets, staggered career years
export function generateInitialRoster(): { players: Player[]; nextId: number } {
  const players: Player[] = [];
  let id = 1;

  const create = (rarity: Rarity, count: number) => {
    for (let i = 0; i < count; i++) {
      const careerLength = randInt(8, 14);
      // stagger career years - distribute across 1..careerLength so the world is "mature"
      const yearInCareer = randInt(1, careerLength);
      players.push(generatePlayer(id++, rarity, yearInCareer, careerLength));
    }
  };

  create('legend', RARITY_TARGETS.legend);
  create('epic', RARITY_TARGETS.epic);
  create('rare', RARITY_TARGETS.rare);
  create('uncommon', RARITY_TARGETS.uncommon);
  create('common', RARITY_TARGETS.common);

  return { players, nextId: id };
}

// Update a player's yearly skill at offseason (within +/-5 of base, AND constrained drift)
export function rollNewYearlySkill(baseSkill: number, prevYearly: number): number {
  // small drift from previous; allow up to ~3 step change
  const drift = Math.round((Math.random() - 0.5) * 6);
  let candidate = prevYearly + drift;
  // clamp to base+/-5
  const lo = baseSkill - 5;
  const hi = baseSkill + 5;
  if (candidate < lo) candidate = lo;
  if (candidate > hi) candidate = hi;
  return candidate;
}

// Refresh skills for a new year given new yearly skill and year-in-career
export function refreshPlayerSkillsForYear(player: Player): void {
  // determine new uncapped yearly
  const newYearly = rollNewYearlySkill(player.baseSkill, player.yearlySkill);
  player.prevYearSkill = player.yearlySkill;
  // apply career multiplier
  const mult = yearMultiplier(player.yearInCareer, player.careerLength);
  player.yearlySkill = Math.round(newYearly * mult);
  player.skills = deriveSkillsForYear(player.yearlySkill, player.surfaceSpec, player.yearlySkill);
  player.morale = 65;
  player.stamina = player.baseStaminaMax;
  player.yearPoints = 0;
}

// Rarity label/color helpers
export const RARITY_COLORS: Record<Rarity, string> = {
  legend: '#f5a623',
  epic: '#b14de0',
  rare: '#3b82f6',
  uncommon: '#22c55e',
  common: '#94a3b8',
};

export const RARITY_LABEL: Record<Rarity, string> = {
  legend: 'Legend',
  epic: 'Epic',
  rare: 'Rare',
  uncommon: 'Uncommon',
  common: 'Common',
};
