import React from 'react';
import { GameState, Player } from '../sim/types';
import { rankPlayers, getRolling52Points } from '../sim/ranking';
import { PlayerCell, RarityPill, SurfaceTag } from './common';

export function RankingView({
  state,
  setState,
  onPlayerClick,
}: {
  state: GameState;
  setState: (s: GameState) => void;
  onPlayerClick: (p: Player) => void;
}) {
  const ranked = rankPlayers(state.players, state.rankingView, state.absoluteWeek);
  return (
    <div>
      <div className="section-kicker">Updated · Year {state.year}, Week {state.currentWeek}</div>
      <h2 className="section-title">World Rankings</h2>
      <div className="subnav">
        <button
          className={state.rankingView === 'rolling52' ? 'active' : ''}
          onClick={() => setState({ ...state, rankingView: 'rolling52' })}
        >
          Rolling 52-week
        </button>
        <button
          className={state.rankingView === 'calendar' ? 'active' : ''}
          onClick={() => setState({ ...state, rankingView: 'calendar' })}
        >
          Race to Year-End
        </button>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Rk</th>
            <th>Player</th>
            <th>Rarity</th>
            <th>Spec</th>
            <th className="num">Rating</th>
            <th>Stamina</th>
            <th>Morale</th>
            <th className="num">Points</th>
          </tr>
        </thead>
        <tbody>
          {ranked.slice(0, 120).map((p, i) => {
            const pts =
              state.rankingView === 'rolling52'
                ? getRolling52Points(p, state.absoluteWeek)
                : p.yearPoints;
            return (
              <tr key={p.id}>
                <td className="rank-num">{i + 1}</td>
                <td>
                  <PlayerCell player={p} onClick={onPlayerClick} />
                </td>
                <td>
                  <RarityPill rarity={p.rarity} />
                </td>
                <td>
                  <SurfaceTag surface={p.surfaceSpec} />
                </td>
                <td className="num">{p.yearlySkill}</td>
                <td>
                  <Bar v={(p.stamina / p.baseStaminaMax) * 100} threshold={30 / p.baseStaminaMax * 100} />
                </td>
                <td>
                  <Bar v={p.morale} threshold={40} />
                </td>
                <td className="num">{pts.toLocaleString()}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Bar({ v, threshold }: { v: number; threshold?: number }) {
  const low = threshold !== undefined && v < threshold;
  const pct = Math.max(0, Math.min(100, v));
  return (
    <span className="bar">
      <span className="bar-track">
        <span className={`bar-fill ${low ? 'low' : ''}`} style={{ width: `${pct}%` }} />
      </span>
      <span className="bar-val">{Math.round(v)}</span>
    </span>
  );
}
