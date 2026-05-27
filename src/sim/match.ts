import { Player, Surface, Match } from './types';

// Compute a player's effective strength for a given surface, factoring in:
// - skill ratings weighted by surface
// - stamina penalty if below threshold
// - morale bonus/malus
// Optional form (±4) introduces match-to-match variance — even the best legend has off days.
export function effectiveStrength(p: Player, surface: Surface, applyForm: boolean = false): number {
  const { forehand, backhand, serve, volleys, physical } = p.skills;
  // Surface-specific weights
  let base: number;
  if (surface === 'hard') {
    base = serve * 0.30 + forehand * 0.25 + backhand * 0.20 + volleys * 0.10 + physical * 0.15;
  } else if (surface === 'clay') {
    base = forehand * 0.30 + backhand * 0.25 + physical * 0.20 + serve * 0.15 + volleys * 0.10;
  } else { // grass
    base = serve * 0.35 + volleys * 0.25 + forehand * 0.20 + backhand * 0.10 + physical * 0.10;
  }
  // Specialization: bonus on home surface, penalty off-surface
  if (p.surfaceSpec === surface) {
    base *= 1.06;
  } else {
    base *= 0.92; // off-surface penalty
  }
  // Stamina penalty if low
  if (p.stamina < 30) base *= 0.80;
  else if (p.stamina < 50) base *= 0.94;
  // Morale modifier (small): ±~3%
  const moraleMod = 1 + (p.morale - 65) / 1000; // 65 baseline -> *1.0; 100 -> +3.5%; 0 -> -6.5%
  base *= moraleMod;
  // Per-match form randomness (only applied in match sim, not in static views)
  if (applyForm) {
    base += (Math.random() - 0.5) * 8; // ±4
  }
  return base;
}

// Probability that player A beats player B in a single game
// Logistic on difference of effective strengths. Divisor controls "skill spread":
// Smaller divisor = more deterministic, larger = more upsets.
// Tuned via simTest to give Legend top-player ~30-35% of GS over 5y (not 65%).
function gameWinProb(strA: number, strB: number, serving: 'A' | 'B'): number {
  const diff = strA - strB;
  const baseProb = 1 / (1 + Math.exp(-diff / 10)); // softer than 6
  // Server bias: server wins more games typically
  if (serving === 'A') return Math.min(0.95, baseProb + 0.08);
  return Math.max(0.05, baseProb - 0.08);
}

// === FAST INSTANT MATCH SIM (used to fill brackets before live final) ===
export function simulateMatch(p1: Player, p2: Player, surface: Surface, bestOf: 3 | 5): Match {
  // Form is rolled ONCE per match (per player) — a player has a "day"
  const strA = effectiveStrength(p1, surface, true);
  const strB = effectiveStrength(p2, surface, true);
  const setsNeeded = bestOf === 5 ? 3 : 2;
  const sets: { p1: number; p2: number }[] = [];
  let p1Sets = 0, p2Sets = 0;
  while (p1Sets < setsNeeded && p2Sets < setsNeeded) {
    const set = simulateSet(strA, strB);
    sets.push(set);
    if (set.p1 > set.p2) p1Sets++; else p2Sets++;
  }
  return {
    p1: p1.id,
    p2: p2.id,
    winner: p1Sets > p2Sets ? p1.id : p2.id,
    sets,
    scoreLine: formatScoreLine(sets),
  };
}

function simulateSet(strA: number, strB: number): { p1: number; p2: number } {
  let a = 0, b = 0;
  let server: 'A' | 'B' = Math.random() < 0.5 ? 'A' : 'B';
  while (true) {
    const probA = gameWinProb(strA, strB, server);
    if (Math.random() < probA) a++; else b++;
    server = server === 'A' ? 'B' : 'A';
    // Set won at 6 with 2-game lead, or 7-5, or 7-6 (tiebreak treated as a single game)
    if (a >= 6 && a - b >= 2) return { p1: a, p2: b };
    if (b >= 6 && b - a >= 2) return { p1: a, p2: b };
    if (a === 7 && b === 6) return { p1: 7, p2: 6 };
    if (b === 7 && a === 6) return { p1: 6, p2: 7 };
  }
}

export function formatScoreLine(sets: { p1: number; p2: number }[]): string {
  return sets.map(s => `${s.p1}-${s.p2}`).join(' ');
}

// === LIVE GAME-TICK SIM (for the user-watched matches) ===
// One game = one tick. We expose a step() that advances one game.

export interface LiveSetState {
  p1Games: number;
  p2Games: number;
  events: string[]; // running highlights for this set
  complete: boolean;
  setWinner?: 1 | 2;
}

export interface LiveMatchState {
  p1: Player;
  p2: Player;
  surface: Surface;
  bestOf: 3 | 5;
  // Cached form-adjusted effective strengths (rolled once at start of match)
  strP1: number;
  strP2: number;
  sets: LiveSetState[]; // completed sets + current set
  currentSet: number; // index
  p1SetsWon: number;
  p2SetsWon: number;
  serving: 1 | 2;
  lastGameWinner?: 1 | 2;
  lastWasBreak?: boolean;
  matchComplete: boolean;
  matchWinner?: 1 | 2;
}

export function createLiveMatch(p1: Player, p2: Player, surface: Surface, bestOf: 3 | 5): LiveMatchState {
  return {
    p1, p2, surface, bestOf,
    strP1: effectiveStrength(p1, surface, true),
    strP2: effectiveStrength(p2, surface, true),
    sets: [{ p1Games: 0, p2Games: 0, events: [], complete: false }],
    currentSet: 0,
    p1SetsWon: 0,
    p2SetsWon: 0,
    serving: Math.random() < 0.5 ? 1 : 2,
    matchComplete: false,
  };
}

// Advance one game in the current set
export function stepLiveGame(state: LiveMatchState): LiveMatchState {
  if (state.matchComplete) return state;
  const set = state.sets[state.currentSet];
  if (set.complete) return state;

  const strA = state.strP1;
  const strB = state.strP2;
  const servingSide = state.serving === 1 ? 'A' : 'B';
  const probA = gameWinProb(strA, strB, servingSide);
  const aWins = Math.random() < probA;

  // Was this a break of serve?
  const isBreak = (aWins && state.serving === 2) || (!aWins && state.serving === 1);

  // "Love game" -> we don't simulate points but we add a small chance to label it that
  const isLoveGame = Math.random() < 0.10;

  if (aWins) set.p1Games++; else set.p2Games++;

  // Push events
  if (isBreak) {
    set.events.push(`Break of serve! ${aWins ? state.p1.surname : state.p2.surname} breaks.`);
  } else if (isLoveGame) {
    set.events.push(`Love game for ${aWins ? state.p1.surname : state.p2.surname}.`);
  }

  state.lastGameWinner = aWins ? 1 : 2;
  state.lastWasBreak = isBreak;
  state.serving = state.serving === 1 ? 2 : 1;

  // Check set complete
  const a = set.p1Games, b = set.p2Games;
  if ((a >= 6 && a - b >= 2) || (a === 7 && b <= 6)) {
    set.complete = true;
    set.setWinner = 1;
    state.p1SetsWon++;
    set.events.push(`${state.p1.surname} takes the set ${a}-${b}.`);
  } else if ((b >= 6 && b - a >= 2) || (b === 7 && a <= 6)) {
    set.complete = true;
    set.setWinner = 2;
    state.p2SetsWon++;
    set.events.push(`${state.p2.surname} takes the set ${b}-${a}.`);
  }

  // Check match complete
  const needed = state.bestOf === 5 ? 3 : 2;
  if (state.p1SetsWon >= needed) {
    state.matchComplete = true;
    state.matchWinner = 1;
  } else if (state.p2SetsWon >= needed) {
    state.matchComplete = true;
    state.matchWinner = 2;
  }
  return { ...state, sets: [...state.sets] };
}

// Start next set (when user clicks "Next set")
export function startNextSet(state: LiveMatchState): LiveMatchState {
  if (state.matchComplete) return state;
  const cur = state.sets[state.currentSet];
  if (!cur.complete) return state;
  // Add new set
  const newSets = [...state.sets, { p1Games: 0, p2Games: 0, events: [], complete: false }];
  return {
    ...state,
    sets: newSets,
    currentSet: state.currentSet + 1,
  };
}

// Final score line for live state
export function liveScoreLine(state: LiveMatchState): string {
  return state.sets.map(s => `${s.p1Games}-${s.p2Games}`).join(' ');
}

// Set count summary like "3-1"
export function setScoreSummary(state: LiveMatchState): string {
  return `${state.p1SetsWon}-${state.p2SetsWon}`;
}
