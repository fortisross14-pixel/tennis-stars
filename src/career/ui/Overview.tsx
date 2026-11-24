import React from 'react';
import Portrait from '../../components/Portrait.jsx';
import { Flag, SurfaceBadge } from '../../components/Common.jsx';
import { careerOf, me, juniorRank, weeklyStaffCost, sponsorIncome, overall, equipmentBonus } from '../engine';
import { SPECIAL_MAP, POTENTIAL_TIERS, LIVING_COST, ROUND_NAME, EQUIPMENT_MAP, STAFF } from '../data';
import type { StaffKey } from '../types';
import { Bar, SkillBars, Stars, money, ordinalRank, levelLabel } from './common';

export function Overview({ u, onOpenTournament, go }: { u: any; onOpenTournament: (key: string) => void; go: (page: string, ...parts: string[]) => void }) {
  const c = careerOf(u), p = me(u);
  const jr = juniorRank(u);
  const tier = POTENTIAL_TIERS.find((t) => t.name === c.potential);
  const weekly = sponsorIncome(p) + (c.federation ? 600 : 0) - weeklyStaffCost(c) - LIVING_COST;
  const s = p.season, k = p.career;
  const recent = [...c.tournamentLog].reverse().slice(0, 8);
  const upcoming = u.calendar.filter((e: any) => e.tour === c.tour && e.week >= u.week && e.week <= u.week + 8 && ['Grand Slam', '1000', 'Finals', 'Olympics'].includes(e.level));
  const eq = equipmentBonus(c).skills;
  const team = (u.doublesTeams?.[c.tour] || []).find((t: any) => t.career);
  const ranked = (p.rankingPoints || 0) > 0;
  return <div className="cs-page cs-overview">
    <section className="cs-panel cs-ov-head">
      <Portrait player={p} size="profile" />
      <div>
        <small>{c.tour} · {p.style} · {p.handedness}-handed, {p.backhand.toLowerCase()} backhand</small>
        <h2>{p.firstName} {p.lastName}</h2>
        <p><Flag code={p.country} /> Age {p.age} · Potential <Stars n={tier?.stars ?? 1} /> <b>{c.potential}</b> · Fame {p.fame || 0}{c.federation ? ' · 🏛 Federation programme' : ''}</p>
        {c.specials.length > 0 ? <div className="cs-chips">{c.specials.map((x) => <span key={x} title={SPECIAL_MAP[x]?.desc}>{SPECIAL_MAP[x]?.icon} {SPECIAL_MAP[x]?.name}</span>)}</div> : <p className="muted">No special skills yet: they unlock through milestones (see Career → Milestones & skills) or cards.</p>}
      </div>
      <div className="cs-ov-ovr"><span>Overall</span><strong>{overall(p)}</strong><small>potential ≈ {Math.round(p.maxRating)}</small></div>
    </section>

    <div className="cs-kpis wide">
      <div><span>World ranking</span><strong>{ordinalRank(ranked ? p.ranking : null)}</strong><small>{p.rankingPoints || 0} pts · race {s.racePoints || 0}</small></div>
      <div><span>Career high</span><strong>{k.peakRanking < 999 && ranked ? `No. ${k.peakRanking}` : '—'}</strong><small>{k.titles} titles · {k.majors} Slams</small></div>
      {jr != null && <div><span>Junior ranking</span><strong>No. {jr}</strong><small>{p.juniorPoints || 0} pts · best No. {c.counters['junior-best'] ?? jr}</small></div>}
      <div><span>Doubles</span><strong>{team ? `No. ${team.ranking}` : '—'}</strong><small>{team ? `with ${team.playerNames.find((n: string) => !n.endsWith(p.lastName))}` : 'no partner'}</small></div>
      <div><span>{u.year} season</span><strong>{s.wins}–{s.losses}</strong><small>pro · {s.titles} titles · {money(c.seasonPrize)}{p.juniorRecord ? ` · career juniors ${p.juniorRecord.wins}–${p.juniorRecord.losses}` : ''}</small></div>
      <div><span>Bank</span><strong className={c.money < 0 ? 'neg' : ''}>{money(c.money)}</strong><small>{weekly >= 0 ? '+' : ''}{money(weekly)}/wk before prizes</small></div>
    </div>

    <div className="cs-ov-grid">
      <section className="cs-panel">
        <div className="cs-title-row"><h3>Skills</h3><span className="muted">bar = level · hatched = potential{Object.keys(eq).length ? ' · purple = equipment/boost' : ''}</span></div>
        <SkillBars c={c} boost={Object.fromEntries(Object.keys(c.base).map((key) => [key, ((eq as any)[key] ?? 0) + ((c.boost?.skills as any)?.[key] ?? 0)]))} />
        <h4>Surfaces</h4>
        <div className="cs-surfaces">{(['Hard', 'Clay', 'Grass', 'Indoor'] as const).map((sf) => <div key={sf}><SurfaceBadge surface={sf} /><Bar label={sf === p.preferredSurface ? 'preferred' : 'feel'} value={p.surfaceAffinity[sf]} /></div>)}</div>
      </section>
      <section className="cs-panel">
        <h3>Condition</h3>
        <div className="cs-condition">
          <Bar label="Fatigue" value={p.fatigue} tone={p.fatigue > 60 ? 'bad' : p.fatigue > 40 ? 'warn' : 'good'} />
          <Bar label="Health" value={p.health} tone={p.health < 75 ? 'bad' : 'good'} />
          <Bar label="Confidence" value={(p.confidence || 0) + 10} max={20} tone={(p.confidence || 0) < -2 ? 'bad' : 'good'} />
          <Bar label="Match shape" value={p.shape} />
        </div>
        {p.injury && <p className="cs-alert">🩹 {p.injury.type}: {p.injury.weeksRemaining} week{p.injury.weeksRemaining === 1 ? '' : 's'} out.</p>}
        {c.boost && <p className="cs-boost">⚡ {c.boost.name} ready for your next {c.boost.weeks > 1 ? `${c.boost.weeks} tournaments` : 'tournament'}</p>}
        <h4>Team & kit</h4>
        <ul className="cs-mini">
          {(Object.keys(STAFF) as StaffKey[]).map((key) => <li key={key}><span>{STAFF[key].icon} {STAFF[key].label}</span><b>{STAFF[key].levels[c.staff[key]].name}</b></li>)}
          {c.equipment.map((id) => <li key={id}><span>{EQUIPMENT_MAP[id]?.icon} {EQUIPMENT_MAP[id]?.slot}</span><b>{EQUIPMENT_MAP[id]?.name}</b></li>)}
        </ul>
        <button className="ghost" onClick={() => go('improve')}>Manage cards, shop and team →</button>
      </section>
    </div>

    <section className="cs-panel">
      <div className="cs-title-row"><h3>Recent tournaments</h3><button className="ghost" onClick={() => go('career', 'tournaments')}>All tournaments →</button></div>
      {recent.length ? <table className="data-table cs-table"><thead><tr><th>Week</th><th>Event</th><th>Level</th><th>Surface</th><th>Entry</th><th>Result</th><th>Prize</th></tr></thead><tbody>
        {recent.map((t, i) => <tr key={i}><td>{t.year} · {t.week}</td><td><button className="player-link" onClick={() => onOpenTournament(`${c.tour}|${t.event}`)}>{t.event}</button></td><td>{levelLabel(t.level, c.tour)}</td><td><SurfaceBadge surface={t.surface} /></td><td>{t.entry}</td><td><b>{ROUND_NAME[t.result] ?? t.result}</b></td><td>{money(t.prize)}</td></tr>)}
      </tbody></table> : <p className="muted">No tournaments yet.</p>}
    </section>
    {upcoming.length > 0 && <section className="cs-panel"><h3>Coming up</h3><ul className="cs-upcoming">{upcoming.map((e: any) => <li key={e.id}><span>Week {e.week}</span><strong>{e.name}</strong><SurfaceBadge surface={e.surface} /><em>{levelLabel(e.level, c.tour)}</em></li>)}</ul></section>}
  </div>;
}
