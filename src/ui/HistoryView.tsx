import React, { useState } from 'react';
import { GameState, Player, Tournament } from '../sim/types';
import { PlayerCell, RarityPill, Flag } from './common';

export function HistoryView({
  state,
  onPlayerClick,
  onTournamentClick,
}: {
  state: GameState;
  onPlayerClick: (p: Player) => void;
  onTournamentClick: (t: Tournament) => void;
}) {
  const [sub, setSub] = useState<'players' | 'tournaments'>('players');
  return (
    <div>
      <div className="section-kicker">All-time records</div>
      <h2 className="section-title">History</h2>
      <div className="subnav" style={{ marginTop: 14, marginBottom: 18 }}>
        <button className={sub === 'players' ? 'active' : ''} onClick={() => setSub('players')}>
          Players
        </button>
        <button className={sub === 'tournaments' ? 'active' : ''} onClick={() => setSub('tournaments')}>
          Tournaments
        </button>
      </div>
      {sub === 'players' ? (
        <PlayersHistory state={state} onPlayerClick={onPlayerClick} />
      ) : (
        <TournamentsHistory state={state} onPlayerClick={onPlayerClick} onTournamentClick={onTournamentClick} />
      )}
    </div>
  );
}

type SortKey =
  | 'points'
  | 'played'
  | 'won'
  | 'winpct'
  | 'titles'
  | 'gs'
  | 'm1000';

function PlayersHistory({ state, onPlayerClick }: { state: GameState; onPlayerClick: (p: Player) => void }) {
  const [filter, setFilter] = useState<'active' | 'retired' | 'all'>('all');
  const [sort, setSort] = useState<SortKey>('points');

  const pool = state.players.filter(p =>
    filter === 'all' ? true : filter === 'active' ? !p.retired : p.retired,
  );
  const sorted = [...pool].sort((a, b) => sortVal(b, sort) - sortVal(a, sort));

  return (
    <div>
      <div style={{ display: 'flex', gap: 14, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--ink-soft)',
          }}
        >
          Filter
        </span>
        <div className="filter-pill-group">
          {(['all', 'active', 'retired'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={filter === f ? 'active' : ''}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Player</th>
            <th>Rarity</th>
            <SortHeader k="points" label="Career pts" sort={sort} setSort={setSort} />
            <SortHeader k="played" label="MP" sort={sort} setSort={setSort} />
            <SortHeader k="won" label="MW" sort={sort} setSort={setSort} />
            <SortHeader k="winpct" label="Win %" sort={sort} setSort={setSort} />
            <SortHeader k="titles" label="Titles" sort={sort} setSort={setSort} />
            <SortHeader k="gs" label="GS" sort={sort} setSort={setSort} />
            <SortHeader k="m1000" label="M1000" sort={sort} setSort={setSort} />
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {sorted.slice(0, 200).map((p, i) => (
            <tr key={p.id}>
              <td className="rank-num">{i + 1}</td>
              <td>
                <PlayerCell player={p} onClick={onPlayerClick} />
              </td>
              <td>
                <RarityPill rarity={p.rarity} />
              </td>
              <td className="num">{p.careerPoints.toLocaleString()}</td>
              <td className="num">{p.careerMatchesPlayed}</td>
              <td className="num">{p.careerMatchesWon}</td>
              <td className="num">{winPctStr(p)}</td>
              <td className="num">{p.careerTitles}</td>
              <td className="num">{p.careerGS}</td>
              <td className="num">{p.careerM1000}</td>
              <td>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  color: p.retired ? 'var(--ink-soft)' : 'var(--grass)',
                }}>
                  {p.retired ? 'RETIRED' : 'ACTIVE'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SortHeader({
  k,
  label,
  sort,
  setSort,
}: {
  k: SortKey;
  label: string;
  sort: SortKey;
  setSort: (k: SortKey) => void;
}) {
  return (
    <th
      onClick={() => setSort(k)}
      className="num"
      style={{
        cursor: 'pointer',
        color: sort === k ? 'var(--cyan)' : undefined,
      }}
    >
      {label}
      {sort === k ? ' ↓' : ''}
    </th>
  );
}

function sortVal(p: Player, sort: SortKey): number {
  switch (sort) {
    case 'points': return p.careerPoints;
    case 'played': return p.careerMatchesPlayed;
    case 'won':    return p.careerMatchesWon;
    case 'winpct': return p.careerMatchesPlayed === 0 ? 0 : p.careerMatchesWon / p.careerMatchesPlayed;
    case 'titles': return p.careerTitles;
    case 'gs':     return p.careerGS;
    case 'm1000':  return p.careerM1000;
  }
}

function winPctStr(p: Player): string {
  if (p.careerMatchesPlayed === 0) return '—';
  return `${((p.careerMatchesWon / p.careerMatchesPlayed) * 100).toFixed(1)}%`;
}

function TournamentsHistory({
  state, onPlayerClick, onTournamentClick,
}: {
  state: GameState;
  onPlayerClick: (p: Player) => void;
  onTournamentClick: (t: Tournament) => void;
}) {
  // Unique tournament names across history
  const allTournamentNames = Array.from(new Set([
    ...state.calendar.map(t => t.name),
    ...state.history.map(h => h.tournamentName),
  ])).sort();
  const [selected, setSelected] = useState<string>(allTournamentNames[0] || '');
  const records = state.history
    .filter(h => h.tournamentName === selected)
    .sort((a, b) => a.year - b.year);

  return (
    <div>
      <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <label
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--ink-soft)',
          }}
        >
          Tournament
        </label>
        <select value={selected} onChange={e => setSelected(e.target.value)}>
          {allTournamentNames.map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        {selected && (() => {
          const t = state.calendar.find(tt => tt.name === selected);
          return t ? (
            <button className="btn btn-outline" onClick={() => onTournamentClick(t)} style={{ padding: '6px 14px', fontSize: 12 }}>
              View {selected}
            </button>
          ) : null;
        })()}
      </div>
      {records.length === 0 ? (
        <p style={{ color: 'var(--ink-soft)', fontSize: 13 }}>
          No editions played yet.
        </p>
      ) : (
        <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {records.map(r => {
            const winner = state.players.find(p => p.id === r.winnerId);
            const ru = state.players.find(p => p.id === r.runnerUpId);
            return (
              <li
                key={r.year}
                style={{
                  padding: '14px 0', borderBottom: '1px solid var(--rule)',
                  display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap',
                }}
              >
                <strong
                  style={{
                    fontSize: 12, fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.1em', color: 'var(--ink-soft)', minWidth: 70,
                  }}
                >
                  Year {r.year}
                </strong>
                <span style={{ flex: 1, display: 'inline-flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: 14 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                    {winner && <Flag iso2={winner.iso2} />}
                    <button className="link-name" onClick={() => winner && onPlayerClick(winner)}>
                      <strong>{r.winnerName}</strong>
                    </button>
                  </span>
                  <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>
                    {r.scoreLine}
                  </span>
                  <span style={{ color: 'var(--ink-mid)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    {ru && <Flag iso2={ru.iso2} size="sm" />}
                    <button className="link-name link-name-soft" onClick={() => ru && onPlayerClick(ru)}>
                      {r.runnerUpName}
                    </button>
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
