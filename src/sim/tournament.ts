import { Player, Tournament, Round, Match, TournamentTier } from './types';
import { simulateMatch, formatScoreLine } from './match';
import { decideEntries } from './entries';

// Determines which rounds are auto-simmed vs which the user watches live.
// Per spec:
// - T250/T500: see only SF + F
// - M1000: see entire bracket pre-filled, simulate the final live
// - GS: see entire bracket pre-filled, simulate SF and F live
// - WTF: treat like an 8-player single elimination from QF (simplification of round-robin)
export interface UserWatchedPlan {
  showFullBracket: boolean;     // GS, M1000 yes; T500/T250 no (only SF & F shown)
  liveFinal: boolean;
  liveSemis: boolean;
}

export function watchedPlan(tier: TournamentTier): UserWatchedPlan {
  switch (tier) {
    case 'GS':    return { showFullBracket: true,  liveFinal: true, liveSemis: true };
    case 'M1000': return { showFullBracket: true,  liveFinal: true, liveSemis: false };
    case 'WTF':   return { showFullBracket: true,  liveFinal: true, liveSemis: true };
    case 'T500':
    case 'T250':  return { showFullBracket: false, liveFinal: true, liveSemis: false };
  }
}

// Build seeded bracket. Highest-ranked seeded to opposite ends.
// Standard "balanced" bracket seeding (1 vs lowest, 2 vs second-lowest, etc., distributed).
export function seedBracket(entries: Player[]): Player[] {
  // entries assumed already sorted by ranking (top first)
  // Determine bracket size as the next power of 2 <= entries.length (i.e., we trim odd cases like 96 -> 64)
  // because simulateTournamentAutoRounds already trims for the 96-draw GS case.
  let size = 1;
  while (size * 2 <= entries.length) size *= 2;
  const positions = buildSeedingOrder(size);
  // positions[i] gives the seed number (1-indexed) at position i in the bracket array
  return positions.map(seed => entries[seed - 1] || entries[entries.length - 1]);
}

function buildSeedingOrder(size: number): number[] {
  // Recursive bracket seeding: f(n) returns array of seed numbers for an n-size bracket.
  if (size <= 1) return [1];
  // Ensure power of 2 - if not, drop to next power below
  if ((size & (size - 1)) !== 0) {
    let p = 1;
    while (p * 2 <= size) p *= 2;
    size = p;
  }
  const prev = buildSeedingOrder(size / 2);
  const out: number[] = [];
  for (const seed of prev) {
    out.push(seed);
    out.push(size + 1 - seed);
  }
  return out;
}

// Round names by total bracket size
const ROUND_NAMES_BY_SIZE: Record<number, string[]> = {
  128: ['R128', 'R64', 'R32', 'R16', 'QF', 'SF', 'F'],
  96:  ['R128', 'R64', 'R32', 'R16', 'QF', 'SF', 'F'], // we'll treat 96 as 128 with 32 byes
  64:  ['R64', 'R32', 'R16', 'QF', 'SF', 'F'],
  32:  ['R32', 'R16', 'QF', 'SF', 'F'],
  16:  ['R16', 'QF', 'SF', 'F'],
  8:   ['QF', 'SF', 'F'],
};

// Simulate the tournament. Returns the filled-out tournament + bracket + new state updates
export interface TournamentResult {
  tournament: Tournament;
  entries: Player[]; // bracket order
  bracket: Round[];
  // updated player effects to commit later
  // (we mutate players in place actually)
}

// Determine bestOf for a given tier
export function bestOfFor(tier: TournamentTier): 3 | 5 {
  return tier === 'GS' ? 5 : 3;
}

// Initial simulation: produce bracket up through the final, but leave the LIVE rounds
// as winners undetermined if we want the user to play them.
//
// For simplicity: we'll fully simulate ALL rounds here (this gives us a final result
// quickly), and then offer a "live mode" where the user can re-run specific rounds.
// Actually a cleaner approach: simulate everything except the rounds the user will watch live.
// The component will pick winners interactively for those rounds via live match.
export function simulateTournamentAutoRounds(
  t: Tournament,
  entries: Player[],
): { bracket: Round[]; manualRounds: number[] } {
  const ordered = seedBracket(entries);
  const plan = watchedPlan(t.tier);

  // For 96-draw GS: actually we'll just use a 64-draw bracket-of-record (entries already 96 -> we trim/treat the
  // "preliminary" qualifying as already-completed). The shown bracket starts at R64.
  let bracketEntries = ordered;
  if (t.drawSize === 96) {
    // Top 32 get byes to R32; we'll keep visible bracket as 64 entries -> R64 round
    // Take top 32 entries and 32 lowest-ranked-of-the-96 (treat them as having survived a prelim)
    bracketEntries = ordered.slice(0, 64);
  }

  const bracketSize = bracketEntries.length;
  const rounds: Round[] = [];
  const roundNames = ROUND_NAMES_BY_SIZE[bracketSize] || ['R', 'QF', 'SF', 'F'];

  let currentPlayers = bracketEntries;
  const manualRounds: number[] = [];

  const totalRounds = roundNames.length;
  // identify which rounds are manual (user-watched)
  for (let r = 0; r < totalRounds; r++) {
    const isLast = r === totalRounds - 1;
    const isSecondLast = r === totalRounds - 2;
    const isThirdLast = r === totalRounds - 3;
    // SF = secondLast, F = last
    if (plan.liveFinal && isLast) manualRounds.push(r);
    if (plan.liveSemis && isSecondLast) manualRounds.push(r);
  }

  for (let r = 0; r < totalRounds; r++) {
    const roundName = roundNames[r];
    const matches: Match[] = [];
    if (manualRounds.includes(r)) {
      // Build matches but leave winners undetermined
      for (let i = 0; i < currentPlayers.length; i += 2) {
        const p1 = currentPlayers[i];
        const p2 = currentPlayers[i + 1];
        matches.push({ p1: p1.id, p2: p2.id });
      }
      rounds.push({ name: roundName, matches });
      // Stop auto-sim here; further rounds depend on user's manual picks
      break;
    } else {
      for (let i = 0; i < currentPlayers.length; i += 2) {
        const p1 = currentPlayers[i];
        const p2 = currentPlayers[i + 1];
        const m = simulateMatch(p1, p2, t.surface, bestOfFor(t.tier));
        matches.push(m);
      }
      rounds.push({ name: roundName, matches });
      const nextPlayers: Player[] = [];
      for (const m of matches) {
        const winner = m.winner === currentPlayers.find(p => p.id === m.p1)!.id
          ? currentPlayers.find(p => p.id === m.p1)!
          : currentPlayers.find(p => p.id === m.p2)!;
        nextPlayers.push(winner);
      }
      currentPlayers = nextPlayers;
    }
  }

  return { bracket: rounds, manualRounds };
}

// After user finishes a manual round (live), we resolve it and possibly simulate intervening rounds
export function appendRoundAndSimulateRest(
  t: Tournament,
  bracketSoFar: Round[],
  resolvedMatches: Match[], // user-finalized matches for the latest live round
  allPlayers: Player[],
): Round[] {
  // Replace the last round with resolved version
  const updated = [...bracketSoFar];
  updated[updated.length - 1] = { ...updated[updated.length - 1], matches: resolvedMatches };

  // Determine next round name
  const sizeOrder = ['R128', 'R64', 'R32', 'R16', 'QF', 'SF', 'F'];
  let nextIdx = sizeOrder.indexOf(updated[updated.length - 1].name) + 1;
  while (nextIdx < sizeOrder.length) {
    const nextName = sizeOrder[nextIdx];
    // Winners from last round
    const lastRound = updated[updated.length - 1];
    const winners: Player[] = lastRound.matches.map(m => allPlayers.find(p => p.id === m.winner!)!);
    const matches: Match[] = [];
    const plan = watchedPlan(t.tier);
    const isFinal = nextIdx === sizeOrder.length - 1 || winners.length === 2;
    const isSemi  = winners.length === 4;

    const userWatchesThisRound = (isFinal && plan.liveFinal) || (isSemi && plan.liveSemis);
    if (userWatchesThisRound) {
      for (let i = 0; i < winners.length; i += 2) {
        matches.push({ p1: winners[i].id, p2: winners[i + 1].id });
      }
      updated.push({ name: nextName, matches });
      break;
    } else {
      // auto
      for (let i = 0; i < winners.length; i += 2) {
        const m = simulateMatch(winners[i], winners[i + 1], t.surface, bestOfFor(t.tier));
        matches.push(m);
      }
      updated.push({ name: nextName, matches });
      if (winners.length === 2) break; // we just simulated the final
    }
    nextIdx++;
  }

  return updated;
}

// At end of tournament: apply ranking points, stamina drain, morale changes, history records
export function applyTournamentEffects(
  t: Tournament,
  bracket: Round[],
  players: Player[],
): { winnerId: number; runnerUpId: number; finalScore: string } {
  const finalRound = bracket[bracket.length - 1];
  const final = finalRound.matches[0];
  const winnerId = final.winner!;
  const runnerUpId = final.winner === final.p1 ? final.p2 : final.p1;
  const finalScore = setCountScoreFromMatch(final);

  // Per-round point awards
  const pts = t.points;
  // collect who lost at which round
  // also collect everyone who entered
  const allEntered = new Set<number>();
  // walk the bracket: anyone in the first round's matches is "entered"
  for (const m of bracket[0].matches) {
    allEntered.add(m.p1);
    allEntered.add(m.p2);
  }
  // For each round, the loser gets the corresponding points
  // round names in this bracket
  const lostInRound: Map<number, string> = new Map();
  for (const r of bracket) {
    for (const m of r.matches) {
      if (m.winner) {
        const loser = m.winner === m.p1 ? m.p2 : m.p1;
        lostInRound.set(loser, r.name);
      }
    }
  }
  lostInRound.set(winnerId, 'CHAMP'); // sentinel

  for (const id of allEntered) {
    const p = players.find(pp => pp.id === id)!;
    const lostAt = lostInRound.get(id)!;
    let awarded = 0;
    if (lostAt === 'CHAMP') awarded = pts.winner;
    else if (lostAt === 'F') awarded = pts.runnerUp;
    else if (lostAt === 'SF') awarded = pts.sf;
    else if (lostAt === 'QF') awarded = pts.qf;
    else if (lostAt === 'R16') awarded = pts.r16;
    else if (lostAt === 'R32') awarded = pts.r32;
    else if (lostAt === 'R64') awarded = pts.r64;
    else if (lostAt === 'R128') awarded = pts.r128;

    p.pointsHistory.push({ points: awarded, weekIndex: t.weekIndex, tournamentId: t.id });
    p.yearPoints += awarded;
    p.careerPoints += awarded;

    // stamina drain — larger for longer-running tournaments and GS
    const drain = t.tier === 'GS' ? 35 : t.tier === 'M1000' ? 22 : t.tier === 'T500' ? 16 : t.tier === 'T250' ? 12 : 20;
    p.stamina = Math.max(0, p.stamina - drain);

    // Morale: based on result + rarity
    const moraleDelta = computeMoraleDelta(p.rarity, lostAt, t.tier);
    p.morale = Math.max(0, Math.min(100, p.morale + moraleDelta));
  }

  // Career titles & match stats
  for (const r of bracket) {
    for (const m of r.matches) {
      if (m.winner) {
        const winner = players.find(p => p.id === m.winner)!;
        const loser = players.find(p => p.id === (m.winner === m.p1 ? m.p2 : m.p1))!;
        winner.careerMatchesPlayed++;
        winner.careerMatchesWon++;
        loser.careerMatchesPlayed++;
      }
    }
  }
  const champ = players.find(p => p.id === winnerId)!;
  champ.careerTitles++;
  if (t.tier === 'GS') champ.careerGS++;
  if (t.tier === 'M1000') champ.careerM1000++;

  return { winnerId, runnerUpId, finalScore };
}

function setCountScoreFromMatch(m: Match): string {
  if (!m.sets) return '';
  let pWinSets = 0, pLossSets = 0;
  for (const s of m.sets) {
    if ((s.p1 > s.p2 && m.winner === m.p1) || (s.p2 > s.p1 && m.winner === m.p2)) pWinSets++;
    else pLossSets++;
  }
  return `${pWinSets}-${pLossSets}`;
}

import { Rarity } from './types';
function computeMoraleDelta(rarity: Rarity, lostAt: string, tier: TournamentTier): number {
  // Base: how good is the result relative to expectations
  // For a common winning anything: huge morale boost
  // For a legend losing R1 or R32 in big event: heavy hit
  const expectations: Record<Rarity, number> = { legend: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };
  const exp = expectations[rarity];
  const resultValue =
    lostAt === 'CHAMP' ? 7 :
    lostAt === 'F'     ? 5 :
    lostAt === 'SF'    ? 4 :
    lostAt === 'QF'    ? 3 :
    lostAt === 'R16'   ? 2 :
    lostAt === 'R32'   ? 1 :
    lostAt === 'R64'   ? 0 : 0;
  // Magnitude based on tier
  const tierWeight: Record<TournamentTier, number> = { GS: 3.0, M1000: 2.0, WTF: 2.5, T500: 1.2, T250: 0.8 };
  const tw = tierWeight[tier];
  const delta = (resultValue - exp) * tw;
  return Math.round(delta);
}

// Replenish stamina during a rest week (called when week passes with no tournament for that player)
export function restWeekRecover(p: Player): void {
  if (p.retired) return;
  // recover ~15 per rest week, but slower past 70
  const room = p.baseStaminaMax - p.stamina;
  const recovery = Math.min(room, p.stamina < 30 ? 8 : 15);
  p.stamina = Math.min(p.baseStaminaMax, p.stamina + recovery);
}
