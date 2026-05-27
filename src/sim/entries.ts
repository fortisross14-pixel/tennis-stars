import { Player, Tournament } from './types';
import { rankPlayers } from './ranking';

// Decide which players enter a given tournament.
// - Top 30 prefer GS + M1000, rarely 250
// - 31-50 prefer 500 + M1000 when invited
// - Rest grab whatever they can
// - Specialists skip "wrong-surface" weeks more often, especially before their season
// - Low stamina + non-critical tournament -> skip
export function decideEntries(
  players: Player[],
  tournament: Tournament,
  currentAbsoluteWeek: number,
  upcomingTournaments: Tournament[], // future tournaments next ~3 weeks for "save stamina" logic
): Player[] {
  const ranked = rankPlayers(players, 'rolling52', currentAbsoluteWeek);
  const active = ranked; // already filters retired
  const candidates: { player: Player; weight: number }[] = [];

  for (let i = 0; i < active.length; i++) {
    const p = active[i];
    const rank = i + 1;
    let weight = 1.0;

    // Tier base willingness by rank
    if (tournament.tier === 'GS') {
      // basically everyone wants to play GS; entry capped at drawSize
      weight = 2.0;
    } else if (tournament.tier === 'M1000') {
      weight = rank <= 50 ? 1.8 : 1.0;
    } else if (tournament.tier === 'T500') {
      if (rank <= 10) weight = 0.6;
      else if (rank <= 50) weight = 1.4;
      else weight = 1.0;
    } else if (tournament.tier === 'T250') {
      if (rank <= 10) weight = 0.15;
      else if (rank <= 30) weight = 0.4;
      else if (rank <= 50) weight = 0.9;
      else weight = 1.2;
    } else if (tournament.tier === 'WTF') {
      // only top 8 invited
      weight = rank <= 8 ? 5.0 : 0;
    }

    // Surface specialization
    if (tournament.surface === p.surfaceSpec) {
      weight *= 1.4;
    } else {
      // off-surface: top players might skip lower-tier ones
      if (tournament.tier === 'T250' || tournament.tier === 'T500') weight *= 0.75;
    }

    // Look-ahead: if a GS or M1000 of player's specialty surface is within 2 weeks,
    // they might rest if this tournament isn't critical and stamina is low/moderate
    const importantUpcoming = upcomingTournaments.find(t =>
      (t.tier === 'GS' || t.tier === 'M1000') && t.surface === p.surfaceSpec
    );
    if (importantUpcoming && (tournament.tier === 'T250' || tournament.tier === 'T500')) {
      if (p.stamina < 70) weight *= 0.3;
      else weight *= 0.7;
    }

    // Stamina-driven skipping
    if (p.stamina < 30 && tournament.tier !== 'GS' && tournament.tier !== 'WTF') {
      weight *= 0.15; // very unlikely
    } else if (p.stamina < 50 && (tournament.tier === 'T250' || tournament.tier === 'T500')) {
      weight *= 0.5;
    }

    if (weight > 0) candidates.push({ player: p, weight });
  }

  // WTF: top 8 in calendar-year points
  if (tournament.tier === 'WTF') {
    const byYearPts = [...players].filter(p => !p.retired).sort((a, b) => b.yearPoints - a.yearPoints);
    return byYearPts.slice(0, 8);
  }

  // Stochastic selection up to drawSize, weighted, with top-ranked players strongly favored for GS/M1000
  // For GS: top ranked get priority access (think "main draw entry")
  const out: Player[] = [];
  const taken = new Set<number>();

  // Step 1: lock in top-ranked who very likely play
  if (tournament.tier === 'GS' || tournament.tier === 'M1000') {
    const guarantee = tournament.tier === 'GS' ? 50 : 30;
    for (let i = 0; i < Math.min(guarantee, active.length); i++) {
      const p = active[i];
      // even guaranteed players skip if stamina dangerously low and tournament isn't a GS
      if (p.stamina < 25 && tournament.tier !== 'GS') continue;
      if (out.length < tournament.drawSize) {
        out.push(p);
        taken.add(p.id);
      }
    }
  }

  // Step 2: weighted random fill the rest
  const pool = candidates.filter(c => !taken.has(c.player.id));
  while (out.length < tournament.drawSize && pool.length > 0) {
    const totalW = pool.reduce((s, c) => s + c.weight, 0);
    let r = Math.random() * totalW;
    let chosenIdx = -1;
    for (let i = 0; i < pool.length; i++) {
      r -= pool[i].weight;
      if (r <= 0) {
        chosenIdx = i;
        break;
      }
    }
    if (chosenIdx === -1) chosenIdx = pool.length - 1;
    const chosen = pool.splice(chosenIdx, 1)[0];
    out.push(chosen.player);
    taken.add(chosen.player.id);
  }

  // If still not enough (shouldn't happen with 120 players), fill with random remaining
  if (out.length < tournament.drawSize) {
    for (const p of active) {
      if (taken.has(p.id)) continue;
      out.push(p);
      taken.add(p.id);
      if (out.length >= tournament.drawSize) break;
    }
  }

  return out.slice(0, tournament.drawSize);
}
