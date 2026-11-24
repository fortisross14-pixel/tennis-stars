import React, { useMemo, useState } from 'react';
import Portrait from '../../components/Portrait.jsx';
import { Flag, SurfaceBadge } from '../../components/Common.jsx';
import { careerOf, me, projectWeek, juniorRank, weeklyStaffCost, sponsorIncome, overall, maxPlays, type EventOption } from '../engine';
import { FOCUSES, INTENSITY, SPECIAL_MAP, ROUND_NAME, SKILL_LABEL, POTENTIAL_TIERS, LIVING_COST, travelCost } from '../data';
import type { Intensity, WeekPlan, WeekReport } from '../types';
import { Bar, SkillBars, Stars, money, ordinalRank, levelLabel, STATUS_LABEL } from './common';

export function StatusPanel({ u, onMe }: { u: any; onMe: () => void }) {
  const c = careerOf(u), p = me(u);
  const jr = juniorRank(u);
  const tier = POTENTIAL_TIERS.find((t) => t.name === c.potential);
  const weekly = sponsorIncome(p) + (c.federation ? 600 : 0) - weeklyStaffCost(c) - LIVING_COST;
  return <section className="cs-panel cs-status">
    <button className="cs-me" onClick={onMe}>
      <Portrait player={p} size="card" />
      <div>
        <strong>{p.firstName} {p.lastName}</strong>
        <small><Flag code={p.country} /> {p.age} years · {p.style} · {p.handedness}-handed</small>
        <span>Potential <Stars n={tier?.stars ?? 1} /> <em>{c.potential}</em></span>
      </div>
    </button>
    <div className="cs-kpis">
      <div><span>World ranking</span><strong>{ordinalRank(p.rankingPoints > 0 ? p.ranking : null)}</strong><small>{p.rankingPoints || 0} pts</small></div>
      {jr != null && <div><span>Junior ranking</span><strong>No. {jr}</strong><small>{p.juniorPoints || 0} pts</small></div>}
      <div><span>Overall</span><strong>{overall(p)}</strong><small>potential ≈ {Math.round(p.maxRating)}</small></div>
      <div><span>Bank</span><strong className={c.money < 0 ? 'neg' : ''}>{money(c.money)}</strong><small>{weekly >= 0 ? '+' : ''}{money(weekly)}/wk before prize money</small></div>
    </div>
    <div className="cs-condition">
      <Bar label="Fatigue" value={p.fatigue} tone={p.fatigue > 60 ? 'bad' : p.fatigue > 40 ? 'warn' : 'good'} />
      <Bar label="Health" value={p.health} tone={p.health < 75 ? 'bad' : 'good'} />
      <Bar label="Confidence" value={(p.confidence || 0) + 10} max={20} tone={(p.confidence || 0) < -2 ? 'bad' : 'good'} />
      <Bar label="Match shape" value={p.shape} />
    </div>
    {p.injury && <p className="cs-alert">🩹 Injured: {p.injury.type}, {p.injury.weeksRemaining} week{p.injury.weeksRemaining === 1 ? '' : 's'} out.</p>}
    {c.boost && <p className="cs-boost">⚡ {c.boost.name} active ({c.boost.weeks} wk)</p>}
    {c.wildcardTokens > 0 && <p className="cs-boost">✉ {c.wildcardTokens} wildcard token{c.wildcardTokens > 1 ? 's' : ''}</p>}
    {c.specials.length > 0 && <div className="cs-chips">{c.specials.map((s) => <span key={s} title={SPECIAL_MAP[s]?.desc}>{SPECIAL_MAP[s]?.icon} {SPECIAL_MAP[s]?.name}</span>)}</div>}
    <SkillBars c={c} boost={c.boost?.skills} />
  </section>;
}

function DecisionCard({ u, onChoose, busy }: { u: any; onChoose: (id: string) => void; busy: boolean }) {
  const d = careerOf(u).decision; if (!d) return null;
  return <section className="cs-panel cs-decision">
    <small>Decision</small><h3>{d.title}</h3><p>{d.text}</p>
    <div className="cs-options">{d.options.map((o) => <button key={o.id} disabled={busy} onClick={() => onChoose(o.id)}><strong>{o.label}</strong><span>{o.desc}</span></button>)}</div>
  </section>;
}

export function ReportCard({ r, compact }: { r: WeekReport; compact?: boolean }) {
  const deltas = Object.entries(r.skillDelta).filter(([, v]) => Math.abs(v as number) >= 0.1);
  const move = r.rankBefore - r.rankAfter;
  return <section className={`cs-panel cs-report ${compact ? 'compact' : ''}`}>
    <header><div><small>Week {r.week} · {r.year} · age {r.age}</small><h3>{r.title}</h3></div>
      <div className="cs-report-rank"><span>{ordinalRank(r.rankAfter < 999 ? r.rankAfter : null)}</span>{move !== 0 && r.rankBefore < 999 && <b className={move > 0 ? 'up' : 'down'}>{move > 0 ? '▲' : '▼'}{Math.abs(move)}</b>}</div></header>
    {(r.entry || r.result) && <p className="cs-report-result">{r.entry && <span>{r.entry}</span>}{r.result && <strong>{ROUND_NAME[r.result] ?? r.result}</strong>}</p>}
    {r.matches.length > 0 && <ul className="cs-matches">{r.matches.map((m, i) => <li key={i} className={m.won ? 'won' : 'lost'}><b>{m.won ? 'W' : 'L'}</b><span>{m.qualifying ? 'Q · ' : ''}{m.doubles ? 'Doubles · ' : ''}{ROUND_NAME[m.round] ?? m.round}</span><em>{m.opponent}{m.opponentRank && m.opponentRank < 999 ? ` (${m.junior ? 'jr ' : ''}${m.opponentRank})` : ''}</em><code>{m.score}</code></li>)}</ul>}
    <div className="cs-report-money"><span>Prize {money(r.prize)}</span><span>Income {money(r.income)}</span><span>Costs −{money(r.costs)}</span></div>
    {!compact && deltas.length > 0 && <p className="cs-deltas">{deltas.map(([k, v]) => <span key={k} className={(v as number) > 0 ? 'up' : 'down'}>{SKILL_LABEL[k as keyof typeof SKILL_LABEL]} {(v as number) > 0 ? '+' : ''}{(v as number).toFixed(1)}</span>)}</p>}
    {r.lines.map((l, i) => <p key={i} className="cs-line">{l}</p>)}
    {r.rewards.length > 0 && <p className="cs-rewards">{r.rewards.map((x, i) => <span key={i}>{x}</span>)}</p>}
  </section>;
}

function EventRow({ o, selected, onPick, tour, doubles, onDoubles }: { o: EventOption; selected: boolean; onPick: () => void; tour: string; doubles: boolean; onDoubles: (v: boolean) => void }) {
  const e = o.event;
  const can = ['direct', 'qualifying', 'wildcard', 'alternate'].includes(o.status);
  return <div className={`cs-event ${selected ? 'selected' : ''} st-${o.status}`}>
    <button className="cs-event-main" disabled={!can && o.status !== 'out'} onClick={onPick}>
      <span className="cs-level">{levelLabel(e.level, tour)}</span>
      <strong>{e.name}</strong>
      <small><Flag code={e.country} /> {e.location} · draw {e.drawSize} · travel {money(o.travel)}</small>
      <SurfaceBadge surface={e.surface} />
      <span className={`cs-entry st-${o.status}`}>{STATUS_LABEL[o.status] ?? o.status}</span>
      <em>{o.note}{o.cutoffRank ? ` · direct cut ≈ No. ${o.cutoffRank}` : ''}{o.status === 'qualifying' && o.qualifyingCutoffRank ? ` · qualifying cut ≈ No. ${o.qualifyingCutoffRank}` : ''}</em>
    </button>
    {selected && o.doublesOk && <label className="cs-check"><input type="checkbox" checked={doubles} onChange={(ev) => onDoubles(ev.target.checked)} /> Also play doubles with your partner</label>}
  </div>;
}

export function WeekPlanner({ u, onPlan }: { u: any; onPlan: (p: WeekPlan) => void }) {
  const c = careerOf(u), p = me(u);
  const options = useMemo(() => projectWeek(u), [u, u.week, p.ranking]);
  const plan = c.current;
  const injured = p.injury?.weeksRemaining > 0;
  const [tab, setTab] = useState<'compete' | 'train' | 'rest'>(plan.kind === 'compete' || plan.kind === 'junior' ? 'compete' : plan.kind);
  const sel = (plan.kind === 'compete' || plan.kind === 'junior') ? plan.eventId : null;
  const train = plan.kind === 'train' ? plan : { focus: c.defaultTrain.focus, intensity: c.defaultTrain.intensity };
  const pickEvent = (o: EventOption) => {
    const junior = !u.calendar.some((e: any) => e.id === o.event.id);
    onPlan(junior ? { kind: 'junior', eventId: o.event.id } : { kind: 'compete', eventId: o.event.id, doubles: o.doublesOk });
  };
  if (injured) return <section className="cs-panel cs-planner"><h3>This week</h3><p className="cs-alert">You are injured. Rest and rehab are the only option ({p.injury.weeksRemaining} week{p.injury.weeksRemaining === 1 ? '' : 's'} to go). Recovery cards can shorten it.</p></section>;
  return <section className="cs-panel cs-planner">
    <div className="cs-tabs">
      <button className={tab === 'compete' ? 'active' : ''} onClick={() => setTab('compete')}>🎾 Compete <small>{options.filter((o) => ['direct', 'qualifying', 'wildcard'].includes(o.status)).length} open</small></button>
      <button className={tab === 'train' ? 'active' : ''} onClick={() => { setTab('train'); onPlan({ kind: 'train', focus: train.focus, intensity: train.intensity }); }}>🏋 Train</button>
      <button className={tab === 'rest' ? 'active' : ''} onClick={() => { setTab('rest'); onPlan({ kind: 'rest' }); }}>🛌 Rest</button>
    </div>
    {tab === 'compete' && <div className="cs-events">
      {!options.length && <p className="muted">No events this week for you. Train or rest.</p>}
      {options.map((o) => <EventRow key={o.event.id} o={o} tour={c.tour} selected={sel === o.event.id} onPick={() => pickEvent(o)} doubles={plan.kind === 'compete' && !!plan.doubles} onDoubles={(v) => plan.kind === 'compete' && onPlan({ ...plan, doubles: v })} />)}
      <p className="cs-hint">Entry status is a projection from this week's entry list: other players withdraw, get injured or take wildcards. If you are not accepted, the week becomes training.</p>
    </div>}
    {tab === 'train' && <div className="cs-train">
      <div className="cs-focus-grid">{FOCUSES.map((f) => <button key={f.id} className={train.focus === f.id ? 'active' : ''} onClick={() => onPlan({ kind: 'train', focus: f.id, intensity: train.intensity })}><strong>{f.label}</strong><span>{f.desc}</span></button>)}</div>
      <div className="cs-intensity">{(Object.keys(INTENSITY) as Intensity[]).map((k) => <button key={k} className={train.intensity === k ? 'active' : ''} onClick={() => onPlan({ kind: 'train', focus: train.focus, intensity: k })}><strong>{INTENSITY[k].label}</strong><span>{INTENSITY[k].desc}</span><small>+{INTENSITY[k].fatigue} fatigue</small></button>)}</div>
    </div>}
    {tab === 'rest' && <p className="muted">A full week off: fatigue drops sharply and health recovers{c.staff.physio ? ', helped by your physio' : ''}. Match shape fades a little.</p>}
  </section>;
}

export function Hub({ u, busy, onPlan, onPlay, onAuto, onDecision, onMe, onToggleWatch, onOpenEvent }: { u: any; busy: boolean; onPlan: (p: WeekPlan) => void; onPlay: () => void; onAuto: (weeks: number) => void; onDecision: (id: string) => void; onMe: () => void; onToggleWatch: () => void; onOpenEvent: () => void }) {
  const c = careerOf(u), p = me(u);
  const plan = c.current;
  const live = !!u.liveEvent && c.live;
  const label = plan.kind === 'rest' || p.injury ? 'Rest this week' : plan.kind === 'train' ? `Train: ${FOCUSES.find((f) => f.id === plan.focus)?.label} · ${INTENSITY[plan.intensity].label}` : (() => { const e = [...u.calendar, ...u.juniorCalendar].find((x: any) => x.id === plan.eventId); return e ? `Play ${e.name}` : 'Play'; })();
  const upcoming = u.calendar.filter((e: any) => e.tour === c.tour && e.week > u.week && e.week <= u.week + 6 && ['Grand Slam', '1000', 'Finals', 'Olympics'].includes(e.level));
  return <div className="cs-hub">
    <div className="cs-hub-main">
      <DecisionCard u={u} onChoose={onDecision} busy={busy} />
      {live ? <section className="cs-panel cs-live-banner"><h3>● You are playing {u.calendar.find((e: any) => e.id === c.live!.eventId)?.name}</h3><button onClick={onOpenEvent}>Go to your tournament</button></section> : <>
        <header className="cs-week-head"><div><small>Week {u.week} of 52 · {u.year}</small><h2>What do you do this week?</h2></div>
          <div className="cs-plays">{'🃏'.repeat(c.cardPlays)}<i>{'🃏'.repeat(Math.max(0, maxPlays(c) - c.cardPlays))}</i><small>card plays</small></div></header>
        <WeekPlanner key={`${u.year}-${u.week}`} u={u} onPlan={onPlan} />
        <div className="cs-actions">
          <button className="cs-primary" disabled={busy || !!c.decision} onClick={onPlay}>{busy ? 'Simulating…' : `▶ ${label}`}</button>
          <label className="cs-check"><input type="checkbox" checked={c.watchMatches} onChange={onToggleWatch} /> Play my matches live</label>
          <button className="cs-secondary" disabled={busy || !!c.decision} onClick={() => onAuto(4)} title="The autopilot picks events, training and rest for you, stopping for decisions.">Autopilot 4 weeks</button>
          <button className="cs-secondary" disabled={busy || !!c.decision} onClick={() => onAuto(52)} title="Autopilot until the end of the season (stops for decisions).">…to season end</button>
        </div>
      </>}
      {c.lastReport && <ReportCard r={c.lastReport} />}
      {upcoming.length > 0 && <section className="cs-panel"><h3>Coming up</h3><ul className="cs-upcoming">{upcoming.map((e: any) => <li key={e.id}><span>Week {e.week}</span><strong>{e.name}</strong><SurfaceBadge surface={e.surface} /><em>{levelLabel(e.level, c.tour)}</em></li>)}</ul></section>}
    </div>
    <aside className="cs-hub-side"><StatusPanel u={u} onMe={onMe} /></aside>
  </div>;
}

export { travelCost };
