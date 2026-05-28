import { Player, Rarity, YearSummary, GameState } from './types';
import { generatePlayer, RARITY_TARGETS, refreshPlayerSkillsForYear } from './players';
import { rankPlayers } from './ranking';

// Run offseason; returns YearSummary and mutates state.players (retirements + rookies + skill rolls)
export function runOffseason(state: GameState): YearSummary {
  const year = state.year;
  const players = state.players;

  // === collect year stats BEFORE we wipe anything ===
  const active = players.filter(p => !p.retired);
  // Most points (yearPoints) - capture VALUE now, since refreshPlayerSkillsForYear will reset yearPoints
  const mostPoints = [...active].sort((a, b) => b.yearPoints - a.yearPoints)[0];
  const mostPointsValue = mostPoints.yearPoints;
  // Most titles in the year — derived from pointsHistory? We didn't track titles per year.
  // Easier: count wins in calendar this year from history.
  const yearHistory = state.history.filter(h => h.year === year);
  const titleCount = new Map<number, number>();
  for (const h of yearHistory) {
    titleCount.set(h.winnerId, (titleCount.get(h.winnerId) || 0) + 1);
  }
  let mostTitlesId = mostPoints.id;
  let mostTitlesN = 0;
  for (const [id, n] of titleCount) {
    if (n > mostTitlesN) { mostTitlesN = n; mostTitlesId = id; }
  }
  // Most improved: change in rank from yearStartRanking to current ranking (lower number = better)
  const ranked = rankPlayers(players, 'calendar', state.absoluteWeek);
  const currentRankMap = new Map<number, number>();
  ranked.forEach((p, i) => currentRankMap.set(p.id, i + 1));
  let mostImprovedId = mostPoints.id;
  let bestDelta = 0; // negative = improved
  for (const p of active) {
    const cur = currentRankMap.get(p.id) || 999;
    const delta = p.yearStartRanking - cur; // positive means improved (rose in rank)
    if (delta > bestDelta) {
      bestDelta = delta;
      mostImprovedId = p.id;
    }
  }

  // Grand slam winners
  const gsNames = ['Australian Open', 'Roland Garros', 'Wimbledon', 'US Open'];
  const grandSlamWinners = gsNames.map(name => {
    const h = yearHistory.find(h => h.tournamentName === name);
    return { tournamentName: name, winnerId: h ? h.winnerId : -1 };
  });

  // === Push per-player year-history snapshot BEFORE we reset yearPoints/yearTitles ===
  // Use rolling-52 ranking for EOY (more meaningful than calendar)
  const eoyRanked = rankPlayers(players, 'rolling52', state.absoluteWeek);
  const eoyRankMap = new Map<number, number>();
  eoyRanked.forEach((p, i) => eoyRankMap.set(p.id, i + 1));
  for (const p of active) {
    p.yearHistory.push({
      year,
      yearPoints: p.yearPoints,
      eoyRanking: eoyRankMap.get(p.id) || 999,
      titles: p.yearTitles,
      gs: p.yearGS,
    });
  }

  // === Retirements ===
  // Decrement yearsRemaining and yearInCareer for all
  const retiredThisYear: number[] = [];
  for (const p of active) {
    p.yearInCareer++;
    if (p.yearInCareer > p.careerLength) {
      p.retired = true;
      retiredThisYear.push(p.id);
    }
  }

  // === Rookies to replace retired + maintain rarity targets ===
  // Count active rarities
  const rarityCount: Record<Rarity, number> = { legend: 0, epic: 0, rare: 0, uncommon: 0, common: 0 };
  for (const p of players) {
    if (!p.retired) rarityCount[p.rarity]++;
  }
  const rookiesIds: number[] = [];

  // Generate rookies to refill toward targets, total count == retiredThisYear count (so roster stays at 120)
  const rookieCount = retiredThisYear.length;
  for (let i = 0; i < rookieCount; i++) {
    // pick rarity: largest deficit first
    let chosenRarity: Rarity = 'common';
    let largestDeficit = -Infinity;
    for (const r of ['legend', 'epic', 'rare', 'uncommon', 'common'] as Rarity[]) {
      const deficit = RARITY_TARGETS[r] - rarityCount[r];
      if (deficit > largestDeficit) {
        largestDeficit = deficit;
        chosenRarity = r;
      }
    }
    // career length 8..14
    const careerLength = 8 + Math.floor(Math.random() * 7);
    const rookie = generatePlayer(state.nextPlayerId++, chosenRarity, 1, careerLength);
    players.push(rookie);
    rookiesIds.push(rookie.id);
    rarityCount[chosenRarity]++;
  }

  // === Skill rolls for non-retired (this also resets stamina, morale, yearPoints) ===
  const skillChanges: { playerId: number; before: number; after: number; delta: number }[] = [];
  for (const p of active) {
    if (p.retired) continue;
    const before = p.yearlySkill;
    refreshPlayerSkillsForYear(p);
    const after = p.yearlySkill;
    skillChanges.push({ playerId: p.id, before, after, delta: after - before });
  }
  // sort by delta (most improved first)
  skillChanges.sort((a, b) => b.delta - a.delta);

  // === Capture yearStart ranking for next year (using current ranking) ===
  const newRanked = rankPlayers(players, 'rolling52', state.absoluteWeek);
  newRanked.forEach((p, i) => {
    p.yearStartRanking = i + 1;
  });

  return {
    year,
    mostPoints: { playerId: mostPoints.id, points: mostPointsValue },
    mostTitles: { playerId: mostTitlesId, titles: mostTitlesN },
    mostImproved: { playerId: mostImprovedId, delta: bestDelta },
    grandSlamWinners,
    retirements: retiredThisYear,
    rookies: rookiesIds,
    skillChanges,
  };
}
