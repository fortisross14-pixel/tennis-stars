import React, { useState } from 'react';
import { GameState, YearSummary, Player } from '../sim/types';
import { PlayerCell, RarityPill, Flag } from './common';

type Step = 'summary' | 'retirements' | 'rookies' | 'skills';

export function OffseasonView({
  state,
  summary,
  onDone,
}: {
  state: GameState;
  summary: YearSummary;
  onDone: () => void;
}) {
  const [step, setStep] = useState<Step>('summary');
  const playerById = (id: number) => state.players.find(p => p.id === id);

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 22, flexWrap: 'wrap' }}>
        {(['summary', 'retirements', 'rookies', 'skills'] as Step[]).map((s, i) => (
          <button
            key={s}
            onClick={() => setStep(s)}
            style={{
              background: step === s ? 'var(--cyan)' : 'white',
              color: step === s ? 'white' : 'var(--ink)',
              border: `1px solid ${step === s ? 'var(--cyan)' : 'var(--rule)'}`,
              padding: '8px 16px',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 999,
              transition: 'all 0.15s',
            }}
          >
            {i + 1}. {s === 'summary' ? 'Year Summary' : s === 'skills' ? 'Skill Updates' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {step === 'summary' && (
        <YearSummaryView state={state} summary={summary} />
      )}
      {step === 'retirements' && <RetirementsView state={state} summary={summary} />}
      {step === 'rookies' && <RookiesView state={state} summary={summary} />}
      {step === 'skills' && <SkillsUpdate state={state} summary={summary} />}

      <hr className="rule" />
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <button
          className="btn btn-outline"
          onClick={() => {
            const order: Step[] = ['summary', 'retirements', 'rookies', 'skills'];
            const idx = order.indexOf(step);
            if (idx > 0) setStep(order[idx - 1]);
          }}
          disabled={step === 'summary'}
        >
          ← Back
        </button>
        {step !== 'skills' ? (
          <button
            className="btn"
            onClick={() => {
              const order: Step[] = ['summary', 'retirements', 'rookies', 'skills'];
              const idx = order.indexOf(step);
              setStep(order[idx + 1]);
            }}
          >
            Next →
          </button>
        ) : (
          <button className="btn" onClick={onDone}>
            Start Season {state.year + 1} →
          </button>
        )}
      </div>
    </div>
  );
}

function YearSummaryView({ state, summary }: { state: GameState; summary: YearSummary }) {
  const get = (id: number) => state.players.find(p => p.id === id);
  const mp = get(summary.mostPoints.playerId);
  const mt = get(summary.mostTitles.playerId);
  const mi = get(summary.mostImproved.playerId);

  return (
    <div>
      <div className="section-kicker">Season Closed</div>
      <h2 className="section-title">Year {summary.year} in Review</h2>
      <hr className="rule" />

      <div className="summary-grid">
        <div className="summary-card">
          <div className="kicker">Most Points</div>
          <div className="big">
            {mp && <Flag iso2={mp.iso2} />}
            <span>{mp?.firstName} {mp?.surname}</span>
          </div>
          <div className="small">
            {summary.mostPoints.points.toLocaleString()} pts in the race
          </div>
        </div>
        <div className="summary-card">
          <div className="kicker">Most Titles</div>
          <div className="big">
            {mt && <Flag iso2={mt.iso2} />}
            <span>{mt?.firstName} {mt?.surname}</span>
          </div>
          <div className="small">{summary.mostTitles.titles} title{summary.mostTitles.titles === 1 ? '' : 's'}</div>
        </div>
        <div className="summary-card">
          <div className="kicker">Most Improved</div>
          <div className="big">
            {mi && <Flag iso2={mi.iso2} />}
            <span>{mi?.firstName} {mi?.surname}</span>
          </div>
          <div className="small">
            Climbed {summary.mostImproved.delta} place{summary.mostImproved.delta === 1 ? '' : 's'} in the ranking
          </div>
        </div>
      </div>

      <h3
        style={{
          fontWeight: 800,
          fontSize: 20,
          marginTop: 30,
          marginBottom: 14,
          letterSpacing: '-0.01em',
        }}
      >
        Grand Slam Champions
      </h3>
      <div className="summary-grid">
        {summary.grandSlamWinners.map(g => {
          const w = get(g.winnerId);
          return (
            <div className="summary-card" key={g.tournamentName}>
              <div className="kicker">{g.tournamentName}</div>
              <div className="big">
                {w ? (
                  <>
                    <Flag iso2={w.iso2} />
                    <span>{w.firstName} {w.surname}</span>
                  </>
                ) : (
                  <span style={{ color: 'var(--ink-soft)' }}>— Not played —</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RetirementsView({ state, summary }: { state: GameState; summary: YearSummary }) {
  const retired = summary.retirements
    .map(id => state.players.find(p => p.id === id)!)
    .filter(Boolean);
  return (
    <div>
      <div className="section-kicker">Step 2 of 4</div>
      <h2 className="section-title">Retirements</h2>
      <p
        style={{
          fontSize: 13,
          color: 'var(--ink-mid)',
          marginBottom: 18,
        }}
      >
        {retired.length} player{retired.length === 1 ? '' : 's'} retiring this offseason.
      </p>
      <table className="table">
        <thead>
          <tr>
            <th>Player</th>
            <th>Rarity</th>
            <th className="num">Career length</th>
            <th className="num">Career titles</th>
            <th className="num">Grand Slams</th>
            <th className="num">Career pts</th>
          </tr>
        </thead>
        <tbody>
          {retired.map(p => (
            <tr key={p.id}>
              <td><PlayerCell player={p} /></td>
              <td><RarityPill rarity={p.rarity} /></td>
              <td className="num">{p.careerLength} yrs</td>
              <td className="num">{p.careerTitles}</td>
              <td className="num">{p.careerGS}</td>
              <td className="num">{p.careerPoints.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RookiesView({ state, summary }: { state: GameState; summary: YearSummary }) {
  const rookies = summary.rookies
    .map(id => state.players.find(p => p.id === id)!)
    .filter(Boolean);
  return (
    <div>
      <div className="section-kicker">Step 3 of 4</div>
      <h2 className="section-title">Rookies</h2>
      <p
        style={{
          fontSize: 13,
          color: 'var(--ink-mid)',
          marginBottom: 18,
        }}
      >
        {rookies.length} new player{rookies.length === 1 ? '' : 's'} joining the tour.
      </p>
      <table className="table">
        <thead>
          <tr>
            <th>Player</th>
            <th>Rarity</th>
            <th className="num">Base skill</th>
            <th>Spec</th>
            <th className="num">Career proj.</th>
          </tr>
        </thead>
        <tbody>
          {rookies.map(p => (
            <tr key={p.id}>
              <td><PlayerCell player={p} /></td>
              <td><RarityPill rarity={p.rarity} /></td>
              <td className="num">{p.baseSkill}</td>
              <td style={{ textTransform: 'capitalize' }}>{p.surfaceSpec}</td>
              <td className="num">{p.careerLength} yrs</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SkillsUpdate({ state, summary }: { state: GameState; summary: YearSummary }) {
  return (
    <div>
      <div className="section-kicker">Step 4 of 4</div>
      <h2 className="section-title">Skill Updates</h2>
      <p
        style={{
          fontSize: 13,
          color: 'var(--ink-mid)',
          marginBottom: 18,
        }}
      >
        Year-to-year skill drift (within base ±5). Most improved at top, most worsened at bottom.
      </p>
      <table className="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Player</th>
            <th>Rarity</th>
            <th className="num">Base</th>
            <th className="num">Last yr</th>
            <th className="num">This yr</th>
            <th className="num">Δ</th>
          </tr>
        </thead>
        <tbody>
          {summary.skillChanges.map((c, i) => {
            const p = state.players.find(pp => pp.id === c.playerId)!;
            const cls = c.delta > 0 ? 'pos' : c.delta < 0 ? 'neg' : 'zero';
            const sign = c.delta > 0 ? '+' : '';
            return (
              <tr key={c.playerId}>
                <td className="rank-num">{i + 1}</td>
                <td><PlayerCell player={p} /></td>
                <td><RarityPill rarity={p.rarity} /></td>
                <td className="num">{p.baseSkill}</td>
                <td className="num">{c.before}</td>
                <td className="num">{c.after}</td>
                <td className="num">
                  <span className={`improve-chip ${cls}`}>
                    {sign}{c.delta}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
