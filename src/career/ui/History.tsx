import React from 'react';
import { careerOf, me, legacyScore } from '../engine';
import { MILESTONES } from '../legacy';
import { SPECIALS } from '../data';
import { ReportCard } from './Hub';
import { money } from './common';

export function History({ u }: { u: any }) {
  const c = careerOf(u), p = me(u), k = p.career;
  const L = legacyScore(u);
  const jr = p.juniorRecord;
  return <div className="cs-page">
    <section className="cs-panel">
      <div className="cs-title-row"><h2>Career</h2><span className="muted">Legacy grade so far: <b>{L.grade}</b> ({L.score} pts) · legacy coins earned {c.coinsTotal}</span></div>
      <div className="cs-kpis wide">
        <div><span>Career high</span><strong>{k.peakRanking < 999 ? `No. ${k.peakRanking}` : '—'}</strong></div>
        <div><span>Titles</span><strong>{k.titles}</strong><small>{k.majors} Slams · {k.masters || 0} Masters</small></div>
        <div><span>Win–loss</span><strong>{k.wins}–{k.losses}</strong></div>
        <div><span>Prize money</span><strong>{money(c.totalPrize)}</strong></div>
        <div><span>Weeks at No. 1</span><strong>{k.weeksNo1}</strong></div>
        {jr && <div><span>Juniors</span><strong>{jr.wins}–{jr.losses}</strong><small>{jr.titles} titles · best No. {c.counters['junior-best'] ?? '—'}</small></div>}
      </div>
      <table className="data-table cs-table"><thead><tr><th>Season</th><th>Age</th><th>Year-end</th><th>Best</th><th>W–L</th><th>Titles</th><th>Best Slam</th><th>Prize</th><th>OVR</th></tr></thead>
        <tbody>{[...c.seasons].reverse().map((s) => <tr key={s.year}><td>{s.year}</td><td>{s.age}</td><td>{s.rankEnd < 999 ? s.rankEnd : '—'}</td><td>{s.bestRank < 999 ? s.bestRank : '—'}</td><td>{s.wins}–{s.losses}</td><td title={s.titleNames.join(', ')}>{s.titles}</td><td>{s.bestSlam ?? '—'}</td><td>{money(s.prize)}</td><td>{s.rating}</td></tr>)}
          {!c.seasons.length && <tr><td colSpan={9} className="muted">Your first season is under way.</td></tr>}</tbody></table>
    </section>
    <section className="cs-panel">
      <h3>Milestones</h3>
      <div className="cs-milestones">{MILESTONES.map((m) => <span key={m.id} className={c.milestones[m.id] ? 'done' : ''} title={c.milestones[m.id] ?? `${m.coins} coins`}>{c.milestones[m.id] ? '🏆' : '·'} {m.label}</span>)}</div>
      <h3>Special skills</h3>
      <div className="cs-milestones">{SPECIALS.map((s) => <span key={s.id} className={c.specials.includes(s.id) ? 'done' : ''} title={s.desc}>{s.icon} {s.name}<small>{c.specials.includes(s.id) ? s.desc : s.unlock}</small></span>)}</div>
    </section>
    <section className="cs-panel"><h3>Recent weeks</h3><div className="cs-report-list">{c.reports.slice(0, 20).map((r, i) => <ReportCard key={i} r={r} compact />)}</div></section>
  </div>;
}
