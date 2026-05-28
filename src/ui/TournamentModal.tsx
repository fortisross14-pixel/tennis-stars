import React from 'react';
import { Tournament, GameState, Round, Match, Player } from '../sim/types';
import { Modal } from './Modal';
import { Flag, SurfaceTag } from './common';
import { bestOfFor } from '../sim/tournament';

export function TournamentModal({
  tournament,
  state,
  onClose,
  onPlayerClick,
}: {
  tournament: Tournament | null;
  state: GameState;
  onClose: () => void;
  onPlayerClick: (p: Player) => void;
}) {
  if (!tournament) return null;
  const played = !!tournament.winnerId;
  const winner = played ? state.players.find(p => p.id === tournament.winnerId) : null;
  const ru = played ? state.players.find(p => p.id === tournament.runnerUpId) : null;

  // Past editions
  const pastEditions = state.history
    .filter(h => h.tournamentName === tournament.name)
    .sort((a, b) => b.year - a.year);

  return (
    <Modal open={true} onClose={onClose} size="lg">
      <div className={`tm-header surface-${tournament.surface}`}>
        <div className="tm-title-row">
          <h2 className="tm-title">{tournament.name}</h2>
          <span className={`tcard-tier tier-${tournament.tier}`}>{tournament.tier}</span>
        </div>
        <div className="tm-meta">
          <SurfaceTag surface={tournament.surface} />
          <span>Week {tournament.weekOfYear}{tournament.durationWeeks === 2 ? '–' + (tournament.weekOfYear + 1) : ''}</span>
          <span>Draw of {tournament.drawSize}</span>
          <span>Best of {bestOfFor(tournament.tier)}</span>
          <span>Champion: {tournament.points.winner} pts</span>
        </div>
      </div>

      {played && winner && ru && (
        <div className="tm-section">
          <div className="section-kicker">Year {state.year} Champion</div>
          <div className="tm-champ">
            <Flag iso2={winner.iso2} size="lg" />
            <button className="link-name" onClick={() => onPlayerClick(winner)}>
              <strong>{winner.firstName} {winner.surname}</strong>
            </button>
            <span className="tm-score">{tournament.finalScore}</span>
            <span className="tm-defeated">defeated</span>
            <Flag iso2={ru.iso2} />
            <button className="link-name link-name-soft" onClick={() => onPlayerClick(ru)}>
              {ru.firstName.charAt(0)}. {ru.surname}
            </button>
          </div>
        </div>
      )}

      {played && tournament.bracket && (
        <div className="tm-section">
          <h3 className="pm-section-title">Bracket</h3>
          <BracketDisplay bracket={tournament.bracket} players={state.players} onPlayerClick={onPlayerClick} />
        </div>
      )}

      {pastEditions.length > 0 && (
        <div className="tm-section">
          <h3 className="pm-section-title">Past editions</h3>
          <ol className="tm-history">
            {pastEditions.map(r => {
              const w = state.players.find(p => p.id === r.winnerId);
              const rup = state.players.find(p => p.id === r.runnerUpId);
              return (
                <li key={r.year} className="tm-history-row">
                  <span className="tm-history-year">Year {r.year}</span>
                  <span className="tm-history-winner">
                    {w && <Flag iso2={w.iso2} />}
                    <button className="link-name" onClick={() => w && onPlayerClick(w)}>
                      <strong>{r.winnerName}</strong>
                    </button>
                  </span>
                  <span className="tm-history-score">{r.scoreLine}</span>
                  <span className="tm-history-ru">
                    {rup && <Flag iso2={rup.iso2} size="sm" />}
                    <button className="link-name link-name-soft" onClick={() => rup && onPlayerClick(rup)}>
                      {r.runnerUpName}
                    </button>
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {!played && pastEditions.length === 0 && (
        <div className="tm-section">
          <p className="pm-empty">Not yet contested.</p>
        </div>
      )}
    </Modal>
  );
}

function BracketDisplay({
  bracket, players, onPlayerClick,
}: {
  bracket: Round[];
  players: Player[];
  onPlayerClick: (p: Player) => void;
}) {
  return (
    <div className="bracket-wrap">
      {bracket.map((r, ri) => (
        <div key={ri} className="br-round">
          <div className="br-round-title">{r.name}</div>
          {r.matches.map((m, mi) => (
            <BracketMatch key={mi} match={m} players={players} onPlayerClick={onPlayerClick} />
          ))}
        </div>
      ))}
    </div>
  );
}

function BracketMatch({
  match, players, onPlayerClick,
}: {
  match: Match;
  players: Player[];
  onPlayerClick: (p: Player) => void;
}) {
  const p1 = players.find(p => p.id === match.p1)!;
  const p2 = players.find(p => p.id === match.p2)!;
  const w = match.winner;
  const sides = [
    { p: p1, win: w === p1.id, lose: !!w && w !== p1.id },
    { p: p2, win: w === p2.id, lose: !!w && w !== p2.id },
  ];
  return (
    <div className="br-match">
      {sides.map((s, i) => (
        <div key={i} className={`br-side ${s.win ? 'win' : ''} ${s.lose ? 'lose' : ''}`}>
          <Flag iso2={s.p.iso2} size="sm" />
          <button className="br-pname-btn" onClick={() => onPlayerClick(s.p)}>{s.p.surname}</button>
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
