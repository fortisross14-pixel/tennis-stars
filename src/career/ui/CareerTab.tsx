import React, { useMemo, useState } from 'react';
import { Flag, SurfaceBadge } from '../../components/Common.jsx';
import { careerOf, me, legacyScore } from '../engine';
import { MILESTONES } from '../legacy';
import { SPECIALS, ROUND_NAME, ROUND_ORDER, SKILLS } from '../data';
import { money, levelLabel, roundLabel } from './common';
import { ReportCard } from './Week';
import { ArTabs } from './arena/kit';

const SUBTABS: [string, string][] = [['overview', 'Overview'], ['seasons', 'Seasons'], ['matches', 'Matches'], ['tournaments', 'Tournaments'], ['progress', 'Milestones & skills']];
const LEVEL_GROUPS: [string, string[]][] = [['Grand Slams', ['Grand Slam']], ['Finals & Olympics', ['Finals', 'Olympics']], ['Masters 1000', ['1000']], ['500', ['500']], ['250', ['250']], ['Challenger / 125', ['Challenger', 'WTA 125']], ['ITF', ['ITF']], ['Juniors', ['Junior Slam', 'Junior 500', 'Junior 200', 'Junior Finals', 'Continental']]];
const roundIdx = (r: string) => ROUND_ORDER.indexOf(r);

export function CareerTab({ u, sub, go, onWatch, onPlayer, onTournament }: { u: any; sub: string; go: (page: string, ...parts: string[]) => void; onWatch: (id: string) => void; onPlayer: (id: string) => void; onTournament: (key: string) => void }) {
  const tab = SUBTABS.some(([k]) => k === sub) ? sub : 'overview';
  return <div className="cs-page">
    <div className="ar-subbar flat"><ArTabs small tabs={SUBTABS} value={tab} onChange={(k) => go('career', k)} /></div>
    {tab === 'overview' && <CareerOverview u={u} onPlayer={onPlayer} />}
    {tab === 'seasons' && <Seasons u={u} />}
    {tab === 'matches' && <Matches u={u} onWatch={onWatch} onPlayer={onPlayer} />}
    {tab === 'tournaments' && <Tournaments u={u} onTournament={onTournament} />}
    {tab === 'progress' && <Progress u={u} />}
  </div>;
}

function CareerOverview({ u, onPlayer }: { u: any; onPlayer: (id: string) => void }) {
  const c = careerOf(u), p = me(u), k = p.career;
  const L = legacyScore(u);
  const jr = p.juniorRecord;
  const best = useMemo(() => {
    const out: Record<string, { result: string; year: number }> = {};
    for (const t of c.tournamentLog) if (t.level === 'Grand Slam' || t.level === 'Junior Slam') { const key = `${t.event}`; if (!out[key] || roundIdx(t.result) > roundIdx(out[key].result)) out[key] = { result: t.result, year: t.year }; }
    return out;
  }, [c.tournamentLog.length]);
  const titles = c.tournamentLog.filter((t) => t.result === 'W');
  const bigWins = c.matchLog.filter((m) => m.won && !m.junior && m.oppRank < 999).sort((a, b) => a.oppRank - b.oppRank).slice(0, 6);
  const rivals = useMemo(() => {
    const map = new Map<string, { id: string; name: string; country: string; w: number; l: number }>();
    for (const m of c.matchLog) { if (!m.oppId) continue; const r = map.get(m.oppId) ?? { id: m.oppId, name: m.oppName, country: m.oppCountry, w: 0, l: 0 }; if (m.won) r.w += 1; else r.l += 1; map.set(m.oppId, r); }
    return [...map.values()].sort((a, b) => b.w + b.l - (a.w + a.l)).slice(0, 8);
  }, [c.matchLog.length]);
  return <>
    <section className="cs-panel">
      <div className="cs-title-row"><h2>Career overview</h2><span className="muted">Legacy grade so far <b className="cs-grade-inline">{L.grade}</b> ({L.score} pts) · legacy coins earned {c.coinsTotal}</span></div>
      <div className="cs-kpis wide">
        <div><span>Career high</span><strong>{k.peakRanking < 999 && p.rankingPoints > 0 ? `No. ${k.peakRanking}` : '—'}</strong></div>
        <div><span>Titles</span><strong>{k.titles}</strong><small>{k.majors} Slams · {k.masters || 0} Masters</small></div>
        <div><span>Win–loss</span><strong>{k.wins}–{k.losses}</strong><small>{k.wins + k.losses ? Math.round(k.wins / (k.wins + k.losses) * 100) : 0}%</small></div>
        <div><span>Prize money</span><strong>{money(c.totalPrize)}</strong></div>
        <div><span>Weeks at No. 1</span><strong>{k.weeksNo1}</strong></div>
        {jr && <div><span>Juniors</span><strong>{jr.wins}–{jr.losses}</strong><small>{jr.titles || 0} titles · best No. {c.counters['junior-best'] ?? '—'}</small></div>}
      </div>
    </section>
    <div className="cs-ov-grid">
      <section className="cs-panel"><h3>Grand Slam record</h3>
        {Object.keys(best).length ? <ul className="cs-mini">{Object.entries(best).map(([name, b]) => <li key={name}><span>{name}</span><b>{ROUND_NAME[b.result] ?? b.result} ({b.year})</b></li>)}</ul> : <p className="muted">No Slam appearances yet.</p>}
        <h3>Titles</h3>
        {titles.length ? <ul className="cs-mini">{titles.slice().reverse().map((t, i) => <li key={i}><span>{t.year} · {t.event}</span><b>{levelLabel(t.level, c.tour)}</b></li>)}</ul> : <p className="muted">No titles yet.</p>}
      </section>
      <section className="cs-panel"><h3>Best wins</h3>
        {bigWins.length ? <ul className="cs-mini">{bigWins.map((m) => <li key={m.id}><span><button className="player-link" onClick={() => onPlayer(m.oppId)}>{m.oppName}</button> (No. {m.oppRank})</span><b>{m.event} {m.round} · {m.score}</b></li>)}</ul> : <p className="muted">No ranked wins yet.</p>}
        <h3>Most played</h3>
        {rivals.length ? <ul className="cs-mini">{rivals.map((r) => <li key={r.id}><span><Flag code={r.country} /> <button className="player-link" onClick={() => onPlayer(r.id)}>{r.name}</button></span><b>{r.w}–{r.l}</b></li>)}</ul> : <p className="muted">—</p>}
      </section>
    </div>
  </>;
}

function Seasons({ u }: { u: any }) {
  const c = careerOf(u);
  const skillAt = (year: number) => c.skillLog.find((s) => s.year === year);
  return <section className="cs-panel">
    <h2>Season by season</h2>
    <div className="table-wrap"><table className="data-table cs-table"><thead><tr><th>Season</th><th>Age</th><th>Year-end</th><th>Best</th><th>Junior best</th><th>W–L</th><th>Titles</th><th>Best Slam</th><th>Prize</th><th>OVR</th><th>Skills (avg / potential)</th></tr></thead>
      <tbody>{[...c.seasons].reverse().map((s) => { const sk = skillAt(s.year); const avg = sk ? Math.round(Object.values(sk.skills).reduce((a, b) => a + b, 0) / 9) : null; const cap = sk ? Math.round(Object.values(sk.ceiling).reduce((a, b) => a + b, 0) / 9) : null; return <tr key={s.year}>
        <td>{s.year}</td><td>{s.age}</td><td>{s.rankEnd < 999 ? s.rankEnd : '—'}</td><td>{s.bestRank < 999 ? s.bestRank : '—'}</td><td>{s.juniorBest ?? '—'}</td><td>{s.wins}–{s.losses}</td><td title={s.titleNames.join(', ')}>{s.titles}{s.titleNames.length ? <small className="muted"> {s.titleNames.slice(0, 3).join(', ')}{s.titleNames.length > 3 ? '…' : ''}</small> : null}</td><td>{s.bestSlam ?? '—'}</td><td>{money(s.prize)}</td><td>{s.rating}</td><td>{avg != null ? `${avg} / ${cap}` : '—'}</td></tr>; })}
        {!c.seasons.length && <tr><td colSpan={11} className="muted">Your first season is under way.</td></tr>}</tbody></table></div>
  </section>;
}

function Matches({ u, onWatch, onPlayer }: { u: any; onWatch: (id: string) => void; onPlayer: (id: string) => void }) {
  const c = careerOf(u);
  const years = [...new Set(c.matchLog.map((m) => m.year))].sort((a, b) => b - a);
  const [year, setYear] = useState<number>(years[0] ?? u.year);
  const [kind, setKind] = useState('all');
  const rows = c.matchLog.filter((m) => m.year === year && (kind === 'all' || (kind === 'junior' ? m.junior : kind === 'quali' ? m.qualifying : !m.junior && !m.qualifying))).slice().reverse();
  const w = rows.filter((m) => m.won).length;
  return <section className="cs-panel">
    <div className="cs-title-row"><h2>Matches</h2><span className="muted">{w}–{rows.length - w} in this view · every match can be replayed game by game</span></div>
    <div className="cs-filters">
      <select value={year} onChange={(e) => setYear(Number(e.target.value))}>{(years.length ? years : [u.year]).map((y) => <option key={y} value={y}>{y}</option>)}</select>
      {[['all', 'All'], ['pro', 'Main draws'], ['quali', 'Qualifying'], ['junior', 'Juniors']].map(([k, l]) => <button key={k} className={kind === k ? 'active' : ''} onClick={() => setKind(k)}>{l}</button>)}
    </div>
    {rows.length ? <div className="table-wrap"><table className="data-table cs-table"><thead><tr><th>Week</th><th>Event</th><th>Round</th><th>Opponent</th><th>Result</th><th>Score</th><th /></tr></thead><tbody>
      {rows.map((m) => <tr key={m.id} className={m.won ? 'won' : 'lost'}><td>{m.week}</td><td>{m.event} <SurfaceBadge surface={m.surface} /></td><td>{roundLabel(m.round, m.qualifying)}</td>
        <td><Flag code={m.oppCountry} /> <button className="player-link" onClick={() => onPlayer(m.oppId)}>{m.oppName}</button> <small className="muted">{m.oppRank && m.oppRank < 999 ? `${m.junior ? 'jr ' : ''}No. ${m.oppRank}` : ''}</small></td>
        <td><b className={m.won ? 'up' : 'down'}>{m.won ? 'W' : 'L'}</b></td><td><code>{m.score}</code></td><td>{m.sets.length ? <button className="cs-watch" onClick={() => onWatch(m.id)}>▶ Watch</button> : null}</td></tr>)}
    </tbody></table></div> : <p className="muted">No matches in this view.</p>}
  </section>;
}

function Tournaments({ u, onTournament }: { u: any; onTournament: (key: string) => void }) {
  const c = careerOf(u);
  const [group, setGroup] = useState('all');
  const rows = c.tournamentLog.filter((t) => group === 'all' || LEVEL_GROUPS.find((g) => g[0] === group)?.[1].includes(t.level)).slice().reverse();
  const counts = Object.fromEntries(LEVEL_GROUPS.map(([g, lv]) => [g, c.tournamentLog.filter((t) => lv.includes(t.level)).length]));
  return <section className="cs-panel">
    <div className="cs-title-row"><h2>Every tournament</h2><span className="muted">{c.tournamentLog.length} played · {c.tournamentLog.filter((t) => t.result === 'W').length} won</span></div>
    <div className="cs-filters"><button className={group === 'all' ? 'active' : ''} onClick={() => setGroup('all')}>All</button>{LEVEL_GROUPS.map(([g]) => <button key={g} disabled={!counts[g]} className={group === g ? 'active' : ''} onClick={() => setGroup(g)}>{g} <small>{counts[g]}</small></button>)}</div>
    {rows.length ? <div className="table-wrap"><table className="data-table cs-table"><thead><tr><th>Season</th><th>Week</th><th>Age</th><th>Event</th><th>Level</th><th>Surface</th><th>Entry</th><th>Round reached</th><th>Doubles</th><th>Prize</th></tr></thead><tbody>
      {rows.map((t, i) => <tr key={i} className={t.result === 'W' ? 'won' : ''}><td>{t.year}</td><td>{t.week}</td><td>{t.age}</td><td><button className="player-link" onClick={() => onTournament(`${c.tour}|${t.event}`)}>{t.event}</button></td><td>{levelLabel(t.level, c.tour)}</td><td><SurfaceBadge surface={t.surface} /></td><td>{t.entry}</td><td><b>{t.result === 'W' ? '🏆 Champion' : ROUND_NAME[t.result] ?? t.result}</b></td><td>{t.doubles ? (t.doubles === 'W' ? '🏆' : ROUND_NAME[t.doubles] ?? t.doubles) : ''}</td><td>{money(t.prize)}</td></tr>)}
    </tbody></table></div> : <p className="muted">No tournaments yet.</p>}
  </section>;
}

function Progress({ u }: { u: any }) {
  const c = careerOf(u);
  const n = (k: string) => c.counters[k] ?? 0;
  const progress: Record<string, [number, number]> = {
    fighter: [n('comebacks'), 5], 'tiebreak-ace': [n('tiebreaks'), 15], 'giant-killer': [n('top20wins'), 3], 'clay-instinct': [n('surface-Clay'), 30],
    'grass-feel': [n('surface-Grass'), 12], 'hard-hitter': [n('surface-Hard'), 40], 'indoor-ace': [n('surface-Indoor'), 15], 'iron-legs': [n('deciders'), 8], 'qualifier-grit': [n('qualified'), 4],
  };
  const timeline = [...c.unlocks].sort((a, b) => b.year - a.year || b.week - a.week);
  const snaps = [...c.skillLog, { year: u.year, age: me(u).age, skills: c.base, ceiling: c.ceiling, now: true } as any];
  return <>
    <section className="cs-panel"><h2>Timeline</h2>
      {timeline.length ? <ul className="cs-timeline">{timeline.map((t, i) => <li key={i} className={`k-${t.kind}`}><span>{t.year} · week {t.week}{t.age ? ` · age ${t.age}` : ''}</span><b>{t.kind === 'special' ? '✨ Special skill' : t.kind === 'equipment' ? '🎒 Equipment' : '🏆 Milestone'}</b><em>{t.label}</em></li>)}</ul> : <p className="muted">Milestones, special skills and equipment you earn appear here.</p>}
    </section>
    <section className="cs-panel"><h3>Special skills</h3>
      <div className="cs-specials">{SPECIALS.map((s) => { const got = c.specials.includes(s.id); const pr = progress[s.id]; return <article key={s.id} className={got ? 'done' : ''}><header><span>{s.icon}</span><strong>{s.name}</strong>{got && <em>Unlocked</em>}</header><p>{s.desc}</p><small>{got ? '' : s.unlock}</small>{!got && pr && <i className="cs-prog"><b style={{ width: `${Math.min(100, pr[0] / pr[1] * 100)}%` }} /><span>{Math.min(pr[0], pr[1])}/{pr[1]}</span></i>}</article>; })}</div>
    </section>
    <section className="cs-panel"><h3>Milestones</h3>
      <div className="cs-milestones">{MILESTONES.map((m) => <span key={m.id} className={c.milestones[m.id] ? 'done' : ''} title={`${m.coins} legacy coins`}>{c.milestones[m.id] ? '🏆' : '·'} {m.label}<small>{c.milestones[m.id] ?? `${m.coins} coins`}</small></span>)}</div>
    </section>
    <section className="cs-panel"><h3>Skill progression</h3>
      <div className="table-wrap"><table className="data-table cs-table"><thead><tr><th>Season</th><th>Age</th>{SKILLS.map((s) => <th key={s.key}>{s.short}</th>)}<th>Avg</th></tr></thead><tbody>
        {snaps.slice().reverse().map((s, i) => <tr key={i}><td>{s.now ? 'Now' : s.year}</td><td>{s.age}</td>{SKILLS.map((k) => <td key={k.key} title={`potential ${s.ceiling[k.key]}`}>{Math.round(s.skills[k.key])}<small className="muted">/{s.ceiling[k.key]}</small></td>)}<td><b>{Math.round(Object.values(s.skills as Record<string, number>).reduce((a, b) => a + b, 0) / 9)}</b></td></tr>)}
      </tbody></table></div>
    </section>
    <section className="cs-panel"><h3>Recent weeks</h3><div className="cs-report-list">{c.reports.slice(0, 12).map((r, i) => <ReportCard key={i} r={r} compact />)}</div></section>
  </>;
}
