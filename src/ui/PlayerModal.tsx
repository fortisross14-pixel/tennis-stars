import React from 'react';
import { Player, GameState } from '../sim/types';
import { Modal } from './Modal';
import { Flag, Avatar, RarityPill, SurfaceTag, SkillBar } from './common';
import { rankPlayers, getRolling52Points } from '../sim/ranking';

export function PlayerModal({
  player,
  state,
  onClose,
}: {
  player: Player | null;
  state: GameState;
  onClose: () => void;
}) {
  if (!player) return null;

  // Current ranking
  const ranked = rankPlayers(state.players, 'rolling52', state.absoluteWeek);
  const currentRank = ranked.findIndex(p => p.id === player.id) + 1;
  const currentPoints = getRolling52Points(player, state.absoluteWeek);

  // Average skill
  const avgSkill = Math.round(
    (player.skills.forehand +
      player.skills.backhand +
      player.skills.serve +
      player.skills.volleys +
      player.skills.physical) / 5,
  );

  const winPct = player.careerMatchesPlayed > 0
    ? ((player.careerMatchesWon / player.careerMatchesPlayed) * 100).toFixed(1) + '%'
    : '—';

  // Sort year history newest-first
  const yearHistory = [...player.yearHistory].sort((a, b) => b.year - a.year);

  return (
    <Modal open={true} onClose={onClose} size="lg">
      <div className="pm-header">
        <Avatar player={player} size="xl" />
        <div className="pm-header-info">
          <div className="pm-name-row">
            <Flag iso2={player.iso2} size="lg" />
            <h2 className="pm-name">{player.firstName} {player.surname}</h2>
          </div>
          <div className="pm-tags">
            <RarityPill rarity={player.rarity} />
            <SurfaceTag surface={player.surfaceSpec} />
            <span className="pm-status">
              {player.retired ? 'Retired' : `Year ${player.yearInCareer} of ${player.careerLength}`}
            </span>
          </div>
          <div className="pm-rank-line">
            {player.retired ? (
              <span><strong>Career ended.</strong> Best ranking #{player.bestRanking === 999 ? '—' : player.bestRanking}</span>
            ) : (
              <>
                <span><strong>#{currentRank}</strong> in the world · {currentPoints.toLocaleString()} pts</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="pm-stat-grid">
        <StatCard label="Grand Slams" value={player.careerGS} />
        <StatCard label="Titles" value={player.careerTitles} />
        <StatCard label="Masters 1000" value={player.careerM1000} />
        <StatCard label="Matches played" value={player.careerMatchesPlayed} />
        <StatCard label="Matches won" value={player.careerMatchesWon} />
        <StatCard label="Win %" value={winPct} />
        <StatCard label="Best ranking" value={player.bestRanking === 999 ? '—' : `#${player.bestRanking}`} />
        <StatCard label="Weeks at #1" value={player.weeksAtNo1} />
      </div>

      {/* Skills */}
      <div className="pm-section">
        <h3 className="pm-section-title">
          Skills
          <span className="pm-section-meta">avg {avgSkill} · rating {player.yearlySkill}</span>
        </h3>
        <div className="pm-skills">
          <SkillBar label="Forehand" value={player.skills.forehand} />
          <SkillBar label="Backhand" value={player.skills.backhand} />
          <SkillBar label="Serve" value={player.skills.serve} />
          <SkillBar label="Volleys" value={player.skills.volleys} />
          <SkillBar label="Physical" value={player.skills.physical} />
        </div>
        <div className="pm-skills">
          <SkillBar label="Stamina" value={Math.round((player.stamina / player.baseStaminaMax) * 100)} />
          <SkillBar label="Morale" value={player.morale} />
        </div>
      </div>

      {/* Year-by-year */}
      {yearHistory.length > 0 && (
        <div className="pm-section">
          <h3 className="pm-section-title">Career by year</h3>
          <table className="table pm-year-table">
            <thead>
              <tr>
                <th>Year</th>
                <th className="num">Points</th>
                <th className="num">EOY rank</th>
                <th className="num">Titles</th>
                <th className="num">GS</th>
              </tr>
            </thead>
            <tbody>
              {yearHistory.map(y => (
                <tr key={y.year}>
                  <td><strong>Year {y.year}</strong></td>
                  <td className="num">{y.yearPoints.toLocaleString()}</td>
                  <td className="num">#{y.eoyRanking}</td>
                  <td className="num">{y.titles}</td>
                  <td className="num">{y.gs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {yearHistory.length === 0 && !player.retired && (
        <div className="pm-section">
          <p className="pm-empty">First season — no completed years yet.</p>
        </div>
      )}
    </Modal>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="pm-stat">
      <div className="pm-stat-label">{label}</div>
      <div className="pm-stat-value">{value}</div>
    </div>
  );
}
