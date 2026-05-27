import { Player } from './types';

// rolling 52: sum of points from events within last 52 weeks (absoluteWeek - 52)
export function getRolling52Points(player: Player, currentAbsoluteWeek: number): number {
  const cutoff = currentAbsoluteWeek - 52;
  return player.pointsHistory
    .filter(p => p.weekIndex > cutoff)
    .reduce((s, p) => s + p.points, 0);
}

export function getCalendarYearPoints(player: Player): number {
  return player.yearPoints;
}

export function rankPlayers(
  players: Player[],
  view: 'rolling52' | 'calendar',
  currentAbsoluteWeek: number,
): Player[] {
  const scored = players
    .filter(p => !p.retired)
    .map(p => ({
      p,
      pts: view === 'rolling52' ? getRolling52Points(p, currentAbsoluteWeek) : p.yearPoints,
    }));
  scored.sort((a, b) => b.pts - a.pts || b.p.yearlySkill - a.p.yearlySkill);
  return scored.map(s => s.p);
}

export function getRankOf(playerId: number, ranked: Player[]): number {
  const idx = ranked.findIndex(p => p.id === playerId);
  return idx >= 0 ? idx + 1 : 999;
}
