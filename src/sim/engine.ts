import { GameState, Player, Tournament } from './types';
import { generateInitialRoster } from './players';
import { buildCalendarForYear, tournamentsStartingInWeek } from './calendar';
import { restWeekRecover } from './tournament';
import { rankPlayers } from './ranking';

export function initGameState(): GameState {
  const { players, nextId } = generateInitialRoster();
  const calendar = buildCalendarForYear(1);

  // Assign initial year-start ranking arbitrarily by yearlySkill (since no points yet)
  const sorted = [...players].sort((a, b) => b.yearlySkill - a.yearlySkill);
  sorted.forEach((p, i) => { p.yearStartRanking = i + 1; });

  return {
    year: 1,
    currentWeek: 1,
    absoluteWeek: 1,
    players,
    calendar,
    history: [],
    pastYearSummaries: [],
    rankingView: 'rolling52',
    nextPlayerId: nextId,
  };
}

// Advance to next week — returns the new state and any tournaments starting that week
export function advanceWeek(state: GameState): { state: GameState; startingTournaments: Tournament[] } {
  // Recover stamina for players who didn't play this week
  // (Since we'll only call advanceWeek when no tournament is active, all players rest.)
  for (const p of state.players) {
    if (!p.retired) restWeekRecover(p);
  }
  const newWeek = state.currentWeek + 1;
  const newAbs = state.absoluteWeek + 1;
  const nextState: GameState = {
    ...state,
    currentWeek: newWeek,
    absoluteWeek: newAbs,
  };
  const starting = tournamentsStartingInWeek(state.calendar, newWeek);
  return { state: nextState, startingTournaments: starting };
}

// Move into the offseason (week 46..52 etc), bundled as one transition.
// For UX, we'll just allow user to click "Advance" through quiet weeks until week 46
// then trigger the offseason flow.
export function isOffseasonWeek(weekOfYear: number): boolean {
  return weekOfYear >= 46;
}

export function rankingSnapshot(state: GameState, view: 'rolling52' | 'calendar' = state.rankingView): Player[] {
  return rankPlayers(state.players, view, state.absoluteWeek);
}
