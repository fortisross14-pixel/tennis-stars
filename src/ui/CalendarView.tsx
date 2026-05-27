import React, { useState } from 'react';
import { GameState, Tournament } from '../sim/types';
import { tournamentsInWeek } from '../sim/calendar';
import { Flag } from './common';

const MONTH_BREAKS: { name: string; startWeek: number; cols: number }[] = [
  { name: 'Jan', startWeek: 1,  cols: 4 },
  { name: 'Feb', startWeek: 5,  cols: 4 },
  { name: 'Mar', startWeek: 9,  cols: 5 },
  { name: 'Apr', startWeek: 14, cols: 4 },
  { name: 'May', startWeek: 18, cols: 4 },
  { name: 'Jun', startWeek: 22, cols: 4 },
  { name: 'Jul', startWeek: 26, cols: 5 },
  { name: 'Aug', startWeek: 31, cols: 4 },
  { name: 'Sep', startWeek: 35, cols: 4 },
  { name: 'Oct', startWeek: 39, cols: 5 },
  { name: 'Nov', startWeek: 44, cols: 4 },
  { name: 'Dec', startWeek: 48, cols: 5 },
];

export function CalendarView({ state }: { state: GameState }) {
  const [sub, setSub] = useState<'cal' | 'annual'>('cal');
  return (
    <div>
      <div className="section-kicker">Season {state.year}</div>
      <h2 className="section-title">Calendar</h2>
      <div className="subnav" style={{ marginTop: 14, marginBottom: 18 }}>
        <button className={sub === 'cal' ? 'active' : ''} onClick={() => setSub('cal')}>
          Program calendar
        </button>
        <button className={sub === 'annual' ? 'active' : ''} onClick={() => setSub('annual')}>
          Annual view
        </button>
      </div>
      {sub === 'cal' ? <ProgramCalendar state={state} /> : <AnnualList state={state} />}
    </div>
  );
}

function ProgramCalendar({ state }: { state: GameState }) {
  // 13 columns per row -> 4 rows * 13 = 52
  const rows: number[][] = [];
  for (let r = 0; r < 4; r++) {
    const row: number[] = [];
    for (let c = 0; c < 13; c++) row.push(r * 13 + c + 1);
    rows.push(row);
  }
  return (
    <div>
      {rows.map((row, ri) => (
        <div key={ri} style={{ marginBottom: 12 }}>
          <div className="cal-month-row">
            {row.map(w => (
              <span key={w}>Wk {w}</span>
            ))}
          </div>
          <div className="cal-grid">
            {row.map(w => {
              const ts = tournamentsInWeek(state.calendar, w);
              const hasGS = ts.some(t => t.tier === 'GS');
              const hasM1000 = ts.some(t => t.tier === 'M1000');
              const hasWTF = ts.some(t => t.tier === 'WTF');
              const isCurrent = w === state.currentWeek;
              const isPast = w < state.currentWeek;
              const cls = [
                'cal-week',
                hasGS ? 'has-gs' : '',
                hasM1000 ? 'has-m1000' : '',
                hasWTF ? 'has-wtf' : '',
                isCurrent ? 'current' : '',
                isPast ? 'past' : '',
              ].filter(Boolean).join(' ');
              return (
                <div key={w} className={cls}>
                  <div className="wk-num">Wk {w}</div>
                  {ts.map(t => (
                    <span key={t.id} className={`cal-tag t-${t.tier} s-${t.surface}`} title={t.name}>
                      {abbr(t.name)}
                    </span>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <Legend />
    </div>
  );
}

function abbr(name: string): string {
  // Show full for GS, otherwise compact
  if (name.length < 18) return name;
  return name.replace(/Masters$/, 'M.').replace(/Open$/, '');
}

function Legend() {
  return (
    <div className="legend">
      <span>
        <span className="cal-tag t-GS" style={{ display: 'inline-block', padding: '2px 8px' }}>
          Grand Slam
        </span>
      </span>
      <span>
        <span className="cal-tag t-M1000" style={{ display: 'inline-block', padding: '2px 8px' }}>
          Masters 1000
        </span>
      </span>
      <span>
        <span className="cal-tag t-WTF" style={{ display: 'inline-block', padding: '2px 8px' }}>
          WTF
        </span>
      </span>
      <span>
        <span className="cal-tag t-T500" style={{ display: 'inline-block', padding: '2px 8px' }}>
          500
        </span>
      </span>
      <span>
        <span className="cal-tag t-T250" style={{ display: 'inline-block', padding: '2px 8px' }}>
          250
        </span>
      </span>
    </div>
  );
}

function AnnualList({ state }: { state: GameState }) {
  const sorted = [...state.calendar].sort((a, b) => a.weekOfYear - b.weekOfYear);
  return (
    <table className="table">
      <thead>
        <tr>
          <th className="num">Wk</th>
          <th>Tournament</th>
          <th>Tier</th>
          <th>Surface</th>
          <th className="num">Pts</th>
          <th>Status</th>
          <th>Winner</th>
          <th>Runner-up</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map(t => {
          const played = !!t.winnerId;
          const winner = played ? state.players.find(p => p.id === t.winnerId) : null;
          const ru = played ? state.players.find(p => p.id === t.runnerUpId) : null;
          const status = played
            ? 'PLAYED'
            : t.weekOfYear < state.currentWeek
            ? '–'
            : t.weekOfYear === state.currentWeek
            ? 'NOW'
            : 'UPCOMING';
          return (
            <tr key={t.id}>
              <td className="num">{t.weekOfYear}</td>
              <td style={{ fontWeight: 700, color: 'var(--ink)' }}>{t.name}</td>
              <td>
                <span className={`tcard-tier tier-${t.tier}`}>{t.tier}</span>
              </td>
              <td style={{ textTransform: 'capitalize' }}>{t.surface}</td>
              <td className="num">{t.points.winner}</td>
              <td style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: status === 'NOW' ? 'var(--cyan)' : status === 'PLAYED' ? 'var(--grass)' : 'var(--ink-soft)',
              }}>
                {status}
              </td>
              <td>
                {winner ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Flag iso2={winner.iso2} size="sm" /> {winner.firstName.charAt(0)}. {winner.surname}
                  </span>
                ) : '—'}
              </td>
              <td>
                {ru ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Flag iso2={ru.iso2} size="sm" /> {ru.firstName.charAt(0)}. {ru.surname}
                  </span>
                ) : '—'}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
