import { Player, Surface, Match } from './types';

// Context info for a match — informs trait-based modifiers
export interface MatchContext {
  surface: Surface;
  roundName?: string;       // 'F', 'SF', 'QF', etc.  Used for final_focus, clutch in deciding sets
  decidingSet?: boolean;    // is this the final/deciding set of the match?
  downASet?: { p1: boolean; p2: boolean };  // who is behind in sets (for comeback_kid)
  ledByTwoP1?: boolean;     // p1 leads current set by 2+ games (for front_runner)
  ledByTwoP2?: boolean;
  multiplierP1?: number;    // tournament multiplier
  multiplierP2?: number;
}

// Compute a player's effective strength for a given surface + context.
// Applies static traits (adaptable, surface_dominator, final_focus SF/F bonus),
// situational traits (clutch in deciding set, comeback_kid down a set),
// and tournament multiplier.
export function effectiveStrength(
  p: Player,
  surface: Surface,
  applyForm: boolean = false,
  ctx?: { roundName?: string; decidingSet?: boolean; downASet?: boolean; multiplier?: number },
): number {
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
  // Specialization: bonus on home surface, penalty off-surface — adaptable trait nullifies penalty
  if (p.surfaceSpec === surface) {
    base *= p.trait === 'surface_dominator' ? 1.11 : 1.06;
  } else if (p.trait !== 'adaptable') {
    base *= 0.92;
  }
  // Stamina penalty if low
  if (p.stamina < 30) base *= 0.80;
  else if (p.stamina < 50) base *= 0.94;
  // Morale modifier (small): ±~3%
  const moraleMod = 1 + (p.morale - 65) / 1000;
  base *= moraleMod;
  // Trait situational modifiers (additive to base via "skill points")
  if (ctx) {
    let bonus = 0;
    if (p.trait === 'final_focus' && (ctx.roundName === 'SF' || ctx.roundName === 'F')) {
      bonus += 5; // -2 baseline already in skills, +5 here -> net +3 in SF/F
    }
    if (p.trait === 'clutch' && ctx.decidingSet) {
      bonus += 2;
    }
    if (p.trait === 'comeback_kid' && ctx.downASet) {
      bonus += 3;
    }
    base += bonus;
  }
  // Per-match form randomness (only applied in match sim, not in static views)
  if (applyForm) {
    base += (Math.random() - 0.5) * 8; // ±4
  }
  // Tournament multiplier — applied last as a multiplicative scaler
  if (ctx?.multiplier !== undefined && ctx.multiplier !== 1) {
    base *= ctx.multiplier;
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
export function simulateMatch(
  p1: Player,
  p2: Player,
  surface: Surface,
  bestOf: 3 | 5,
  roundName?: string,
  multP1: number = 1,
  multP2: number = 1,
): Match {
  const setsNeeded = bestOf === 5 ? 3 : 2;
  const sets: { p1: number; p2: number }[] = [];
  let p1Sets = 0, p2Sets = 0;
  // Form rolled once per match (per player)
  const formP1 = (Math.random() - 0.5) * 8;
  const formP2 = (Math.random() - 0.5) * 8;
  // Invincible mentality: one-shot per match
  let usedInvincibleP1 = p1.trait !== 'invincible_mentality';
  let usedInvincibleP2 = p2.trait !== 'invincible_mentality';

  while (p1Sets < setsNeeded && p2Sets < setsNeeded) {
    // Compute effective strength for THIS set with full context
    const totalSets = p1Sets + p2Sets;
    const decidingSet = (p1Sets === setsNeeded - 1) && (p2Sets === setsNeeded - 1);
    const downASetP1 = p2Sets > p1Sets;
    const downASetP2 = p1Sets > p2Sets;
    const strA = strengthWithCtx(p1, surface, roundName, decidingSet, downASetP1, multP1) + formP1;
    const strB = strengthWithCtx(p2, surface, roundName, decidingSet, downASetP2, multP2) + formP2;
    const result = simulateSet(strA, strB, p1, p2, usedInvincibleP1, usedInvincibleP2);
    sets.push({ p1: result.p1, p2: result.p2 });
    if (result.usedInvincibleP1) usedInvincibleP1 = true;
    if (result.usedInvincibleP2) usedInvincibleP2 = true;
    if (result.p1 > result.p2) p1Sets++; else p2Sets++;
  }
  return {
    p1: p1.id,
    p2: p2.id,
    winner: p1Sets > p2Sets ? p1.id : p2.id,
    sets,
    scoreLine: formatScoreLine(sets),
  };
}

// Compute effective strength with full context (no form added here — caller adds)
function strengthWithCtx(p: Player, surface: Surface, roundName?: string, decidingSet?: boolean, downASet?: boolean, multiplier?: number): number {
  return effectiveStrength(p, surface, false, { roundName, decidingSet, downASet, multiplier });
}

function simulateSet(
  strA: number,
  strB: number,
  pA: Player,
  pB: Player,
  invincibleAUsed: boolean,
  invincibleBUsed: boolean,
): { p1: number; p2: number; usedInvincibleP1?: boolean; usedInvincibleP2?: boolean } {
  let a = 0, b = 0;
  let server: 'A' | 'B' = Math.random() < 0.5 ? 'A' : 'B';
  let aUsed = invincibleAUsed;
  let bUsed = invincibleBUsed;
  let aAuto = 0;  // forced wins remaining for A (invincible mentality)
  let bAuto = 0;
  while (true) {
    // Invincible Mentality check — first time about to lose set (opponent 1 game from set point)
    if (!aUsed && pA.trait === 'invincible_mentality' && aAuto === 0 && bAuto === 0) {
      // A is losing AND opponent is 1 game from taking the set
      const aLosing = b > a;
      const bAtSetPoint = (b >= 5 && b - a >= 2) || (b === 6 && a === 5);
      if (aLosing && bAtSetPoint) {
        aAuto = 2;
        aUsed = true;
      }
    }
    if (!bUsed && pB.trait === 'invincible_mentality' && bAuto === 0 && aAuto === 0) {
      const bLosing = a > b;
      const aAtSetPoint = (a >= 5 && a - b >= 2) || (a === 6 && b === 5);
      if (bLosing && aAtSetPoint) {
        bAuto = 2;
        bUsed = true;
      }
    }

    let aWins: boolean;
    if (aAuto > 0) { aWins = true; aAuto--; }
    else if (bAuto > 0) { aWins = false; bAuto--; }
    else {
      // Front Runner trait: if leading by 2+, boost
      let strAEff = strA;
      let strBEff = strB;
      if (pA.trait === 'front_runner' && a - b >= 2) strAEff += 3;
      if (pB.trait === 'front_runner' && b - a >= 2) strBEff += 3;
      const probA = gameWinProb(strAEff, strBEff, server);
      aWins = Math.random() < probA;
    }

    if (aWins) a++; else b++;
    server = server === 'A' ? 'B' : 'A';

    if (a >= 6 && a - b >= 2) return { p1: a, p2: b, usedInvincibleP1: aUsed && !invincibleAUsed, usedInvincibleP2: bUsed && !invincibleBUsed };
    if (b >= 6 && b - a >= 2) return { p1: a, p2: b, usedInvincibleP1: aUsed && !invincibleAUsed, usedInvincibleP2: bUsed && !invincibleBUsed };
    if (a === 7 && b === 6) return { p1: 7, p2: 6, usedInvincibleP1: aUsed && !invincibleAUsed, usedInvincibleP2: bUsed && !invincibleBUsed };
    if (b === 7 && a === 6) return { p1: 6, p2: 7, usedInvincibleP1: aUsed && !invincibleAUsed, usedInvincibleP2: bUsed && !invincibleBUsed };
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
  roundName?: string;
  // Per-player form rolled once at match start
  formP1: number;
  formP2: number;
  // Tournament multiplier
  multP1: number;
  multP2: number;
  sets: LiveSetState[];
  currentSet: number;
  p1SetsWon: number;
  p2SetsWon: number;
  serving: 1 | 2;
  lastGameWinner?: 1 | 2;
  lastWasBreak?: boolean;
  matchComplete: boolean;
  matchWinner?: 1 | 2;
  // Trait state
  invincibleUsedP1: boolean;
  invincibleUsedP2: boolean;
  invincibleAutoP1: number;  // remaining forced wins for P1
  invincibleAutoP2: number;
}

export function createLiveMatch(
  p1: Player,
  p2: Player,
  surface: Surface,
  bestOf: 3 | 5,
  roundName?: string,
  multP1: number = 1,
  multP2: number = 1,
): LiveMatchState {
  return {
    p1, p2, surface, bestOf, roundName,
    formP1: (Math.random() - 0.5) * 8,
    formP2: (Math.random() - 0.5) * 8,
    multP1, multP2,
    sets: [{ p1Games: 0, p2Games: 0, events: [], complete: false }],
    currentSet: 0,
    p1SetsWon: 0,
    p2SetsWon: 0,
    serving: Math.random() < 0.5 ? 1 : 2,
    matchComplete: false,
    invincibleUsedP1: p1.trait !== 'invincible_mentality',
    invincibleUsedP2: p2.trait !== 'invincible_mentality',
    invincibleAutoP1: 0,
    invincibleAutoP2: 0,
  };
}

// Advance one game in the current set
export function stepLiveGame(state: LiveMatchState): LiveMatchState {
  if (state.matchComplete) return state;
  const set = state.sets[state.currentSet];
  if (set.complete) return state;

  // Build mutable working state
  let { invincibleUsedP1, invincibleUsedP2, invincibleAutoP1, invincibleAutoP2 } = state;
  const a = set.p1Games, b = set.p2Games;

  // Set-context for traits
  const setsNeeded = state.bestOf === 5 ? 3 : 2;
  const decidingSet = state.p1SetsWon === setsNeeded - 1 && state.p2SetsWon === setsNeeded - 1;
  const downASetP1 = state.p2SetsWon > state.p1SetsWon;
  const downASetP2 = state.p1SetsWon > state.p2SetsWon;

  // Invincible Mentality: trigger when about to lose the set
  if (!invincibleUsedP1 && state.p1.trait === 'invincible_mentality' && invincibleAutoP1 === 0 && invincibleAutoP2 === 0) {
    const p1Losing = b > a;
    const p2AtSetPoint = (b >= 5 && b - a >= 2) || (b === 6 && a === 5);
    if (p1Losing && p2AtSetPoint) {
      invincibleAutoP1 = 2;
      invincibleUsedP1 = true;
      set.events.push(`${state.p1.surname} digs deep — invincible mentality kicks in!`);
    }
  }
  if (!invincibleUsedP2 && state.p2.trait === 'invincible_mentality' && invincibleAutoP2 === 0 && invincibleAutoP1 === 0) {
    const p2Losing = a > b;
    const p1AtSetPoint = (a >= 5 && a - b >= 2) || (a === 6 && b === 5);
    if (p2Losing && p1AtSetPoint) {
      invincibleAutoP2 = 2;
      invincibleUsedP2 = true;
      set.events.push(`${state.p2.surname} digs deep — invincible mentality kicks in!`);
    }
  }

  // Compute effective strength per-game with context
  const strA = effectiveStrength(state.p1, state.surface, false, {
    roundName: state.roundName, decidingSet, downASet: downASetP1, multiplier: state.multP1,
  }) + state.formP1 + (state.p1.trait === 'front_runner' && a - b >= 2 ? 3 : 0);
  const strB = effectiveStrength(state.p2, state.surface, false, {
    roundName: state.roundName, decidingSet, downASet: downASetP2, multiplier: state.multP2,
  }) + state.formP2 + (state.p2.trait === 'front_runner' && b - a >= 2 ? 3 : 0);

  const servingSide = state.serving === 1 ? 'A' : 'B';
  let aWins: boolean;
  if (invincibleAutoP1 > 0) { aWins = true; invincibleAutoP1--; }
  else if (invincibleAutoP2 > 0) { aWins = false; invincibleAutoP2--; }
  else {
    const probA = gameWinProb(strA, strB, servingSide);
    aWins = Math.random() < probA;
  }

  // Was this a break of serve?
  const isBreak = (aWins && state.serving === 2) || (!aWins && state.serving === 1);
  const isLoveGame = Math.random() < 0.10;

  if (aWins) set.p1Games++; else set.p2Games++;

  if (isBreak) {
    set.events.push(`Break of serve! ${aWins ? state.p1.surname : state.p2.surname} breaks.`);
  } else if (isLoveGame) {
    set.events.push(`Love game for ${aWins ? state.p1.surname : state.p2.surname}.`);
  }

  state.lastGameWinner = aWins ? 1 : 2;
  state.lastWasBreak = isBreak;
  state.serving = state.serving === 1 ? 2 : 1;

  // Check set complete
  const aNow = set.p1Games, bNow = set.p2Games;
  if ((aNow >= 6 && aNow - bNow >= 2) || (aNow === 7 && bNow <= 6)) {
    set.complete = true;
    set.setWinner = 1;
    state.p1SetsWon++;
    set.events.push(`${state.p1.surname} takes the set ${aNow}-${bNow}.`);
  } else if ((bNow >= 6 && bNow - aNow >= 2) || (bNow === 7 && aNow <= 6)) {
    set.complete = true;
    set.setWinner = 2;
    state.p2SetsWon++;
    set.events.push(`${state.p2.surname} takes the set ${bNow}-${aNow}.`);
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
  return {
    ...state,
    sets: [...state.sets],
    invincibleUsedP1, invincibleUsedP2,
    invincibleAutoP1, invincibleAutoP2,
  };
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
