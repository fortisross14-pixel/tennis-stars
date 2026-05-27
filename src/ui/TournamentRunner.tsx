import React, { useEffect, useRef, useState } from 'react';
import { GameState, Tournament, Player, Round, Match } from '../sim/types';
import { decideEntries } from '../sim/entries';
import {
  simulateTournamentAutoRounds,
  appendRoundAndSimulateRest,
  applyTournamentEffects,
  bestOfFor,
  watchedPlan,
} from '../sim/tournament';
import {
  createLiveMatch,
  stepLiveGame,
  startNextSet,
  liveScoreLine,
  setScoreSummary,
  LiveMatchState,
  simulateMatch,
} from '../sim/match';
import { PlayerCell, RarityPill, SurfaceTag, Flag, Avatar } from './common';

type Stage =
  | { kind: 'preview' }
  | { kind: 'bracket' }
  | { kind: 'live'; roundIdx: number; matchIdx: number; live: LiveMatchState }
  | { kind: 'done' };

export function TournamentRunner({
  state,
  setState,
  tournament,
  onClose,
}: {
  state: GameState;
  setState: (s: GameState) => void;
  tournament: Tournament;
  onClose: () => void;
}) {
  const [entries, setEntries] = useState<Player[] | null>(null);
  const [bracket, setBracket] = useState<Round[] | null>(null);
  const [stage, setStage] = useState<Stage>({ kind: 'preview' });
  const [finalResolved, setFinalResolved] = useState<Match[] | null>(null);

  const plan = watchedPlan(tournament.tier);

  // Build entries + initial auto-simulated bracket once on mount
  useEffect(() => {
    const upcoming = state.calendar.filter(
      t => t.weekOfYear > tournament.weekOfYear && t.weekOfYear <= tournament.weekOfYear + 3,
    );
    const ents = decideEntries(state.players, tournament, state.absoluteWeek, upcoming);
    const { bracket: br } = simulateTournamentAutoRounds(tournament, ents);
    setEntries(ents);
    setBracket(br);
  }, []);

  if (!entries || !bracket) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-soft)' }}>Building draw…</div>;
  }

  // === RENDER PER STAGE ===
  if (stage.kind === 'preview') {
    return (
      <TournamentPreview
        tournament={tournament}
        entries={entries}
        bracket={bracket}
        onSimulate={() => {
          // Determine first manual round (always exists — at minimum, the final)
          // For T250/T500: only SF + F visible. For M1000: only F live. For GS: SF + F live.
          // We'll auto-fast-forward to the first manual round (which is the LAST round of `bracket`).
          // But: if liveSemis, last round in `bracket` should be SF, not F. Let's verify and either way, start with the first match.
          const lastRoundIdx = bracket.length - 1;
          // If this isn't yet the "manual" round (shouldn't happen because simulateTournamentAutoRounds stops at manual)
          const lastRound = bracket[lastRoundIdx];
          if (lastRound.matches.length === 0 || lastRound.matches[0].winner) {
            // already done
            setStage({ kind: 'done' });
            return;
          }
          // For Masters 1000 / GS we want user to see the FULL pre-filled bracket first.
          // For T250/T500 we want a special SF+F view.
          if (plan.showFullBracket) {
            setStage({ kind: 'bracket' });
          } else {
            // jump straight to the SF view (we'll show SF + F in the live view layer)
            startLiveAtFirstUnplayed(bracket, setStage);
          }
        }}
      />
    );
  }

  if (stage.kind === 'bracket') {
    return (
      <FullBracketView
        tournament={tournament}
        bracket={bracket}
        players={state.players}
        onContinue={() => startLiveAtFirstUnplayed(bracket, setStage)}
      />
    );
  }

  if (stage.kind === 'live') {
    return (
      <LiveMatchView
        tournament={tournament}
        live={stage.live}
        bracket={bracket}
        players={state.players}
        onFinish={resolved => {
          // mark match resolved in bracket
          const updated = [...bracket];
          updated[stage.roundIdx] = {
            ...updated[stage.roundIdx],
            matches: updated[stage.roundIdx].matches.map((m, i) =>
              i === stage.matchIdx ? resolved : m,
            ),
          };
          // Are there more unfinished matches in this round?
          const next = nextUnfinishedInRound(updated[stage.roundIdx]);
          if (next !== -1) {
            const r = updated[stage.roundIdx];
            const m = r.matches[next];
            const p1 = state.players.find(p => p.id === m.p1)!;
            const p2 = state.players.find(p => p.id === m.p2)!;
            setBracket(updated);
            setStage({
              kind: 'live',
              roundIdx: stage.roundIdx,
              matchIdx: next,
              live: createLiveMatch(p1, p2, tournament.surface, bestOfFor(tournament.tier)),
            });
          } else {
            // Round done — propagate, auto-sim intervening, then start next manual round if any
            const propagated = appendRoundAndSimulateRest(
              tournament,
              updated,
              updated[stage.roundIdx].matches,
              state.players,
            );
            setBracket(propagated);
            // Find next unfinished round
            const nextRoundIdx = propagated.findIndex(r =>
              r.matches.some(m => !m.winner),
            );
            if (nextRoundIdx === -1) {
              // tournament done
              setFinalResolved(propagated[propagated.length - 1].matches);
              setStage({ kind: 'done' });
            } else {
              const r = propagated[nextRoundIdx];
              const firstUnfinished = r.matches.findIndex(m => !m.winner);
              const m = r.matches[firstUnfinished];
              const p1 = state.players.find(p => p.id === m.p1)!;
              const p2 = state.players.find(p => p.id === m.p2)!;
              setStage({
                kind: 'live',
                roundIdx: nextRoundIdx,
                matchIdx: firstUnfinished,
                live: createLiveMatch(p1, p2, tournament.surface, bestOfFor(tournament.tier)),
              });
            }
          }
        }}
      />
    );
  }

  // done
  return (
    <TournamentSummary
      tournament={tournament}
      bracket={bracket}
      players={state.players}
      onCommit={() => {
        // Commit effects, history, and close
        const { winnerId, runnerUpId, finalScore } = applyTournamentEffects(
          tournament,
          bracket,
          state.players,
        );
        // mutate tournament in calendar
        const updatedCal = state.calendar.map(t =>
          t.id === tournament.id ? { ...t, winnerId, runnerUpId, finalScore, bracket } : t,
        );
        const winner = state.players.find(p => p.id === winnerId)!;
        const ru = state.players.find(p => p.id === runnerUpId)!;
        const newHistory = [
          ...state.history,
          {
            year: state.year,
            tournamentName: tournament.name,
            winnerId,
            winnerName: `${winner.firstName} ${winner.surname}`,
            winnerFlag: winner.flag,
            runnerUpId,
            runnerUpName: `${ru.firstName} ${ru.surname}`,
            runnerUpFlag: ru.flag,
            scoreLine: finalScore,
          },
        ];
        setState({ ...state, calendar: updatedCal, history: newHistory });
        onClose();
      }}
    />
  );
}

function startLiveAtFirstUnplayed(bracket: Round[], setStage: (s: Stage) => void): void {
  // Always: the last round in `bracket` is the first "manual" round.
  const lastIdx = bracket.length - 1;
  const r = bracket[lastIdx];
  const idx = r.matches.findIndex(m => !m.winner);
  if (idx === -1) {
    setStage({ kind: 'done' });
    return;
  }
  const m = r.matches[idx];
  // Players will be resolved by the live view via lookup
  setStage({ kind: 'live', roundIdx: lastIdx, matchIdx: idx, live: null as any });
  // ^ but we need actual Player objects; fix below by using a wrapper that passes through global state
}

function nextUnfinishedInRound(r: Round): number {
  return r.matches.findIndex(m => !m.winner);
}

// ============================================
// PREVIEW
// ============================================
function TournamentPreview({
  tournament,
  entries,
  bracket,
  onSimulate,
}: {
  tournament: Tournament;
  entries: Player[];
  bracket: Round[];
  onSimulate: () => void;
}) {
  return (
    <div>
      <div className={`tcard surface-${tournament.surface}`} style={{ marginBottom: 24 }}>
        <div className="tcard-head">
          <h2 className="tcard-title">{tournament.name}</h2>
          <span className={`tcard-tier tier-${tournament.tier}`}>{tournament.tier}</span>
        </div>
        <div className="tcard-meta">
          <SurfaceTag surface={tournament.surface} />
          <span>Week {tournament.weekOfYear}</span>
          <span>Draw of {tournament.drawSize}</span>
          <span>Best of {bestOfFor(tournament.tier)}</span>
          <span>Champion: {tournament.points.winner} pts</span>
        </div>
      </div>
      <h3
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--ink-soft)',
          margin: '0 0 8px',
        }}
      >
        Top seeds entering
      </h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 8,
          marginTop: 10,
        }}
      >
        {entries.slice(0, 16).map((p, i) => (
          <div
            key={p.id}
            style={{
              padding: '10px 14px',
              border: '1px solid var(--rule)',
              borderRadius: 8,
              background: 'white',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <span style={{ fontWeight: 700, color: 'var(--cyan)', minWidth: 24, fontSize: 12 }}>#{i + 1}</span>
            <PlayerCell player={p} />
          </div>
        ))}
      </div>
      <p
        style={{
          marginTop: 14,
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--ink-soft)',
        }}
      >
        … {entries.length - 16} more in the draw
      </p>
      <div style={{ marginTop: 24 }}>
        <button className="btn" onClick={onSimulate}>
          Simulate tournament →
        </button>
      </div>
    </div>
  );
}

// ============================================
// FULL BRACKET VIEW (M1000 + GS)
// ============================================
function FullBracketView({
  tournament,
  bracket,
  players,
  onContinue,
}: {
  tournament: Tournament;
  bracket: Round[];
  players: Player[];
  onContinue: () => void;
}) {
  const plan = watchedPlan(tournament.tier);
  return (
    <div>
      <div className="section-kicker">
        {tournament.name} — Pre-final draw
      </div>
      <h2 className="section-title">The Draw</h2>
      <p
        style={{
          fontSize: 13,
          color: 'var(--ink-mid)',
          marginBottom: 18,
        }}
      >
        Earlier rounds resolved. You'll watch the {plan.liveSemis ? 'semifinals & final' : 'final'} live.
      </p>
      <BracketDisplay bracket={bracket} players={players} />
      <div style={{ marginTop: 24 }}>
        <button className="btn" onClick={onContinue}>
          Continue to {plan.liveSemis ? 'Semifinals' : 'Final'} →
        </button>
      </div>
    </div>
  );
}

function BracketDisplay({ bracket, players }: { bracket: Round[]; players: Player[] }) {
  return (
    <div className="bracket-wrap">
      {bracket.map((r, ri) => (
        <div key={ri} className="br-round">
          <div className="br-round-title">{r.name}</div>
          {r.matches.map((m, mi) => (
            <BracketMatch key={mi} match={m} players={players} />
          ))}
        </div>
      ))}
    </div>
  );
}

function BracketMatch({ match, players }: { match: Match; players: Player[] }) {
  const p1 = players.find(p => p.id === match.p1)!;
  const p2 = players.find(p => p.id === match.p2)!;
  const w = match.winner;
  const sides = [
    { p: p1, win: w === p1.id, lose: !!w && w !== p1.id },
    { p: p2, win: w === p2.id, lose: !!w && w !== p2.id },
  ];
  const scoreParts = match.sets ? match.sets.map(s => `${s.p1}-${s.p2}`) : ['—', '—'];
  return (
    <div className="br-match">
      {sides.map((s, i) => (
        <div key={i} className={`br-side ${s.win ? 'win' : ''} ${s.lose ? 'lose' : ''}`}>
          <Flag iso2={s.p.iso2} size="sm" />
          <span className="pname">{s.p.surname}</span>
          {match.sets && (
            <span className="score">
              {match.sets.map(set => (i === 0 ? set.p1 : set.p2)).join(' ')}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================
// LIVE MATCH VIEW (with auto-tick)
// ============================================
function LiveMatchView({
  tournament,
  live,
  bracket,
  players,
  onFinish,
}: {
  tournament: Tournament;
  live: LiveMatchState | null;
  bracket: Round[];
  players: Player[];
  onFinish: (m: Match) => void;
}) {
  // Initialize live state from bracket lookup if `live` is null (means we just routed here without one).
  const [state, setLive] = useState<LiveMatchState | null>(live);

  // Find the current match from bracket
  const currentRoundIdx = bracket.findIndex(r => r.matches.some(m => !m.winner));
  const currentRound = currentRoundIdx >= 0 ? bracket[currentRoundIdx] : null;
  const currentMatchIdx = currentRound ? currentRound.matches.findIndex(m => !m.winner) : -1;
  const currentMatch = currentRound && currentMatchIdx >= 0 ? currentRound.matches[currentMatchIdx] : null;

  // Initialize if needed
  useEffect(() => {
    if (!state && currentMatch) {
      const p1 = players.find(p => p.id === currentMatch.p1)!;
      const p2 = players.find(p => p.id === currentMatch.p2)!;
      setLive(createLiveMatch(p1, p2, tournament.surface, bestOfFor(tournament.tier)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-tick games each second
  const tickRef = useRef<number | null>(null);
  useEffect(() => {
    if (!state) return;
    if (state.matchComplete) return;
    const curSet = state.sets[state.currentSet];
    if (curSet.complete) return; // waiting for Next Set click
    tickRef.current = window.setTimeout(() => {
      setLive(s => (s ? stepLiveGame(s) : s));
    }, 900);
    return () => {
      if (tickRef.current) window.clearTimeout(tickRef.current);
    };
  }, [state]);

  if (!state) {
    return <div style={{ padding: 30 }}>Preparing match…</div>;
  }

  const curSet = state.sets[state.currentSet];

  const handleNextSet = () => {
    setLive(s => (s ? startNextSet(s) : s));
  };

  const handleFinish = () => {
    if (!state.matchComplete) return;
    // Build resolved Match
    const winnerId = state.matchWinner === 1 ? state.p1.id : state.p2.id;
    const resolved: Match = {
      p1: state.p1.id,
      p2: state.p2.id,
      winner: winnerId,
      sets: state.sets.map(s => ({ p1: s.p1Games, p2: s.p2Games })),
      scoreLine: liveScoreLine(state),
    };
    onFinish(resolved);
    setLive(null);
  };

  const roundLabel = currentRound?.name || '';

  return (
    <div>
      <div className="live-round-label">
        {tournament.name} — {expandRoundName(roundLabel)}
      </div>
      <div className="live">
        <div className="live-players">
          <div className="live-player">
            <Avatar player={state.p1} size="xl" />
            <Flag iso2={state.p1.iso2} size="lg" />
            <div className="lp-name">
              <span className="lp-first">{state.p1.firstName}</span>
              <br />
              {state.p1.surname.toUpperCase()}
            </div>
            <div>
              <RarityPill rarity={state.p1.rarity} />
            </div>
          </div>
          <div className="live-vs">VS</div>
          <div className="live-player">
            <Avatar player={state.p2} size="xl" />
            <Flag iso2={state.p2.iso2} size="lg" />
            <div className="lp-name">
              <span className="lp-first">{state.p2.firstName}</span>
              <br />
              {state.p2.surname.toUpperCase()}
            </div>
            <div>
              <RarityPill rarity={state.p2.rarity} />
            </div>
          </div>
        </div>
        <div className="live-sets">
          {state.sets.map((s, i) => (
            <span key={i}>
              S{i + 1} <strong>{s.p1Games}-{s.p2Games}</strong>
            </span>
          ))}
        </div>
        <div className="live-score">
          {curSet.p1Games}{' '}
          <span style={{ color: 'var(--cyan)', opacity: 0.5 }}>—</span> {curSet.p2Games}
        </div>
        <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.7, marginBottom: 14 }}>
          Sets: {setScoreSummary(state)} · Serving: {state.serving === 1 ? state.p1.surname : state.p2.surname}
        </div>
        <div className="live-events">
          {curSet.events.length === 0 && (
            <span style={{ opacity: 0.4 }}>The set begins. First game underway…</span>
          )}
          {curSet.events.slice(-6).map((e, i) => (
            <div className="ev" key={i}>
              ▸ {e}
            </div>
          ))}
        </div>
        <div className="live-actions">
          {state.matchComplete ? (
            <button className="btn" onClick={handleFinish}>
              {state.matchWinner === 1 ? state.p1.surname : state.p2.surname} wins · Continue →
            </button>
          ) : curSet.complete ? (
            <button className="btn" onClick={handleNextSet}>
              Next set →
            </button>
          ) : (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                opacity: 0.6,
                color: 'white',
              }}
            >
              Game in progress…
            </span>
          )}
        </div>
      </div>

      {/* For T250/T500, show the SF/F mini context */}
      {watchedPlan(tournament.tier).liveSemis === false && watchedPlan(tournament.tier).showFullBracket === false && (
        <SFFMiniContext bracket={bracket} players={players} />
      )}
      {/* For GS we show running bracket SF/F */}
      {watchedPlan(tournament.tier).liveSemis && (
        <SFFMiniContext bracket={bracket} players={players} compact />
      )}
    </div>
  );
}

function expandRoundName(n: string): string {
  if (n === 'F')  return 'Final';
  if (n === 'SF') return 'Semifinal';
  if (n === 'QF') return 'Quarterfinal';
  return n;
}

// Shows mini view of SF + F for T250/T500
function SFFMiniContext({
  bracket,
  players,
  compact,
}: {
  bracket: Round[];
  players: Player[];
  compact?: boolean;
}) {
  // Show last 2 rounds (SF, F) if present
  const tail = bracket.slice(-2);
  return (
    <div className="minib" style={{ marginTop: 30 }}>
      {tail.map((r, ri) => (
        <div className="minib-round" key={ri}>
          <h4>{expandRoundName(r.name)}</h4>
          {r.matches.map((m, mi) => (
            <BracketMatch key={mi} match={m} players={players} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ============================================
// SUMMARY
// ============================================
function TournamentSummary({
  tournament,
  bracket,
  players,
  onCommit,
}: {
  tournament: Tournament;
  bracket: Round[];
  players: Player[];
  onCommit: () => void;
}) {
  const final = bracket[bracket.length - 1].matches[0];
  const winner = players.find(p => p.id === final.winner)!;
  const ru = players.find(p => p.id === (final.winner === final.p1 ? final.p2 : final.p1))!;
  const scoreLine = final.sets?.map(s => `${s.p1}-${s.p2}`).join('  ') || '';
  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <div className="section-kicker">{tournament.name} — Champion</div>
      <h2 className="section-title" style={{ fontSize: 56, marginBottom: 24, marginTop: 8 }}>
        🏆
      </h2>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
        <Avatar player={winner} size="xl" />
      </div>
      <div
        style={{
          fontWeight: 800,
          fontSize: 36,
          lineHeight: 1.1,
          marginBottom: 8,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 14,
          justifyContent: 'center',
        }}
      >
        <Flag iso2={winner.iso2} size="lg" />
        {winner.firstName} {winner.surname}
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--ink-mid)',
          marginBottom: 28,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        <span>defeated</span>
        <Flag iso2={ru.iso2} size="sm" />
        <span>{ru.firstName.charAt(0)}. {ru.surname}</span>
        <span style={{ color: 'var(--cyan)' }}>·</span>
        <span style={{ color: 'var(--cyan)' }}>{scoreLine}</span>
      </div>
      <button className="btn" onClick={onCommit}>
        Confirm result →
      </button>
      <hr className="rule" />
      <BracketDisplay bracket={bracket} players={players} />
    </div>
  );
}
