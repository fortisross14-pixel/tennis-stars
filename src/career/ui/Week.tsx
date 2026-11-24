import React, { useMemo, useState } from 'react';
import { Flag, SurfaceBadge } from '../../components/Common.jsx';
import { careerOf, me, projectWeek, maxPlays, asSlots, restWeek, type EventOption } from '../engine';
import { FOCUSES, INTENSITY, ROUND_NAME, SKILL_LABEL, SLOT_ACTIVITIES } from '../data';
import type { Intensity, SlotPlan, WeekPlan, WeekReport } from '../types';
import { money, ordinalRank, levelLabel, STATUS_LABEL, roundLabel } from './common';

export function ReportCard({ r, compact, onWatch, canWatch }: { r: WeekReport; compact?: boolean; onWatch?: (id: string) => void; canWatch?: (id: string) => boolean }) {
  const deltas = Object.entries(r.skillDelta).filter(([, v]) => Math.abs(v as number) >= 0.1);
  const move = r.rankBefore - r.rankAfter;
  return <section className={`cs-panel cs-report ${compact ? 'compact' : ''}`}>
    <header><div><small>Week {r.week} · {r.year} · age {r.age}</small><h3>{r.title}</h3></div>
      <div className="cs-report-rank"><span>{ordinalRank(r.rankAfter < 999 ? r.rankAfter : null)}</span>{move !== 0 && r.rankBefore < 999 && <b className={move > 0 ? 'up' : 'down'}>{move > 0 ? '▲' : '▼'}{Math.abs(move)}</b>}</div></header>
    {(r.entry || r.result) && <p className="cs-report-result">{r.entry && <span>{r.entry}</span>}{r.result && <strong>{ROUND_NAME[r.result] ?? r.result}</strong>}</p>}
    {r.matches.length > 0 && <ul className="cs-matches">{r.matches.map((m, i) => <li key={i} className={m.won ? 'won' : 'lost'}><b>{m.won ? 'W' : 'L'}</b><span>{m.doubles ? 'Doubles · ' : ''}{roundLabel(m.round, m.qualifying)}</span><em>{m.opponent}{m.opponentRank && m.opponentRank < 999 ? ` (${m.junior ? 'jr ' : ''}${m.opponentRank})` : ''}</em><code>{m.score}</code>
      {onWatch && m.matchId && (!canWatch || canWatch(m.matchId)) ? <button className="cs-watch" onClick={() => onWatch(m.matchId!)}>▶ Watch</button> : <i />}</li>)}</ul>}
    <div className="cs-report-money"><span>Prize {money(r.prize)}</span><span>Income {money(r.income)}</span><span>Costs −{money(r.costs)}</span></div>
    {!compact && deltas.length > 0 && <p className="cs-deltas">{deltas.map(([k, v]) => <span key={k} className={(v as number) > 0 ? 'up' : 'down'}>{SKILL_LABEL[k as keyof typeof SKILL_LABEL]} {(v as number) > 0 ? '+' : ''}{(v as number).toFixed(1)}</span>)}</p>}
    {r.lines.map((l, i) => <p key={i} className="cs-line">{l}</p>)}
    {r.rewards.length > 0 && <p className="cs-rewards">{r.rewards.map((x, i) => <span key={i}>{x}</span>)}</p>}
  </section>;
}

const FILTERS: [string, string, (o: EventOption) => boolean][] = [
  ['all', 'All', () => true],
  ['junior', 'Junior', (o) => o.event.level.startsWith('Junior') || o.event.level === 'Continental'],
  ['dev', 'ITF & Challenger', (o) => ['ITF', 'Challenger', 'WTA 125'].includes(o.event.level)],
  ['tour', 'Tour & Slams', (o) => ['250', '500', '1000', 'Grand Slam', 'Finals', 'Olympics'].includes(o.event.level)],
  ['open', 'I can enter', (o) => ['direct', 'qualifying', 'wildcard'].includes(o.status)],
];

function EventRow({ o, selected, onPick, tour, doubles, onDoubles }: { o: EventOption; selected: boolean; onPick: () => void; tour: string; doubles: boolean; onDoubles: (v: boolean) => void }) {
  const e = o.event;
  return <div className={`cs-event ${selected ? 'selected' : ''} st-${o.status}`}>
    <button className="cs-event-main" disabled={o.status === 'ineligible'} onClick={onPick}>
      <span className="cs-level">{levelLabel(e.level, tour)}</span>
      <strong>{e.name}</strong>
      <small><Flag code={e.country} /> {e.location} · draw {e.drawSize} · travel {money(o.travel)}</small>
      <SurfaceBadge surface={e.surface} />
      <span className={`cs-entry st-${o.status}`}>{selected ? '✓ ' : ''}{STATUS_LABEL[o.status] ?? o.status}</span>
      <em>{o.note}{o.cutoffRank ? ` · direct cut ≈ No. ${o.cutoffRank}` : ''}{o.status === 'qualifying' && o.qualifyingCutoffRank ? ` · qualifying cut ≈ No. ${o.qualifyingCutoffRank}` : ''}</em>
    </button>
    {selected && o.doublesOk && <label className="cs-check"><input type="checkbox" checked={doubles} onChange={(ev) => onDoubles(ev.target.checked)} /> Also play doubles with your partner</label>}
  </div>;
}

function SlotEditor({ i, sl, onChange }: { i: number; sl: SlotPlan; onChange: (s: SlotPlan) => void }) {
  const act = SLOT_ACTIVITIES.find((a) => a.kind === sl.kind)!;
  return <div className={`cs-slot-card k-${sl.kind}`}>
    <header><small>Slot {i + 1}</small><strong>{act.icon} {act.label}</strong></header>
    <div className="cs-slot-kinds">{SLOT_ACTIVITIES.map((a) => <button key={a.kind} title={a.desc} className={a.kind === sl.kind ? 'active' : ''} onClick={() => onChange(a.kind === 'train' ? { kind: 'train', focus: sl.kind === 'train' ? sl.focus : 'balanced', intensity: sl.kind === 'train' ? sl.intensity : 'normal' } : { kind: a.kind } as SlotPlan)}>{a.icon}<span>{a.label}</span></button>)}</div>
    {sl.kind === 'train' ? <div className="cs-slot-train">
      <select value={sl.focus} onChange={(e) => onChange({ ...sl, focus: e.target.value })}>{FOCUSES.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}</select>
      <div className="cs-seg">{(Object.keys(INTENSITY) as Intensity[]).map((k) => <button key={k} className={sl.intensity === k ? 'active' : ''} title={`${INTENSITY[k].desc} +${Math.round(INTENSITY[k].fatigue / 3)} fatigue`} onClick={() => onChange({ ...sl, intensity: k })}>{INTENSITY[k].label}</button>)}</div>
      <small>{FOCUSES.find((f) => f.id === sl.focus)?.desc} · about +{Math.round(INTENSITY[sl.intensity].fatigue / 3)} fatigue</small>
    </div> : <small className="cs-slot-desc">{act.desc}</small>}
  </div>;
}

export function WeekPlanner({ u, onPlan }: { u: any; onPlan: (p: WeekPlan) => void }) {
  const c = careerOf(u), p = me(u);
  const options = useMemo(() => projectWeek(u), [u, u.week, p.ranking]);
  const [filter, setFilter] = useState<string>('all');
  const [showAll, setShowAll] = useState(false);
  const plan = c.current;
  const injured = p.injury?.weeksRemaining > 0;
  const sel = (plan.kind === 'compete' || plan.kind === 'junior') ? plan.eventId : null;
  const slots: SlotPlan[] = asSlots(plan) ?? asSlots(restWeek())!;
  const pickEvent = (o: EventOption) => {
    if (sel === o.event.id) { onPlan({ kind: 'slots', slots }); return; }
    const junior = !u.calendar.some((e: any) => e.id === o.event.id);
    onPlan(junior ? { kind: 'junior', eventId: o.event.id } : { kind: 'compete', eventId: o.event.id, doubles: o.doublesOk });
  };
  const fn = FILTERS.find((f) => f[0] === filter)![2];
  const shown = options.filter(fn).filter((o) => showAll || !['out', 'ineligible'].includes(o.status) || filter !== 'all');
  const hidden = options.filter(fn).length - shown.length;
  if (injured) return <section className="cs-panel cs-planner"><h3>This week</h3><p className="cs-alert">You are injured: rest and rehab ({p.injury.weeksRemaining} week{p.injury.weeksRemaining === 1 ? '' : 's'} to go). Recovery cards can shorten it.</p></section>;
  return <div className="cs-planner-wrap">
    <section className="cs-panel cs-planner">
      <div className="cs-title-row"><h3>🏆 Tournament <small className="muted">takes the whole week</small></h3>{sel && <button className="ghost" onClick={() => onPlan({ kind: 'slots', slots })}>✕ No tournament this week</button>}</div>
      <div className="cs-filters">{FILTERS.map(([id, label, f]) => { const n = options.filter(f).length; return <button key={id} className={filter === id ? 'active' : ''} disabled={!n && id !== 'all'} onClick={() => setFilter(id)}>{label} <small>{n}</small></button>; })}</div>
      <div className="cs-events">
        {!shown.length && <p className="muted">No events here this week.</p>}
        {shown.map((o) => <EventRow key={o.event.id} o={o} tour={c.tour} selected={sel === o.event.id} onPick={() => pickEvent(o)} doubles={plan.kind === 'compete' && !!plan.doubles} onDoubles={(v) => plan.kind === 'compete' && onPlan({ ...plan, doubles: v })} />)}
        {hidden > 0 && <button className="ghost" onClick={() => setShowAll(true)}>Show {hidden} event{hidden > 1 ? 's' : ''} you can't enter</button>}
      </div>
      <p className="cs-hint">Entry status is projected from this week's entry list. If you are not accepted, the week becomes training.</p>
    </section>
    <section className={`cs-panel cs-slots-panel ${sel ? 'disabled' : ''}`}>
      <div className="cs-title-row"><h3>🗓 Week slots</h3><span className="muted">{sel ? 'Your tournament fills the whole week.' : 'Three slots, rest unless you choose otherwise.'}</span></div>
      {!sel && <div className="cs-slot-grid">{slots.map((sl: SlotPlan, i: number) => <SlotEditor key={i} i={i} sl={sl} onChange={(n) => onPlan({ kind: 'slots', slots: slots.map((x: SlotPlan, j: number) => (j === i ? n : x)) })} />)}</div>}
      {!sel && <div className="cs-presets"><small>Quick fill:</small>
        <button onClick={() => onPlan(restWeek())}>All rest</button>
        <button onClick={() => onPlan({ kind: 'slots', slots: [{ kind: 'train', focus: 'balanced', intensity: 'normal' }, { kind: 'train', focus: 'balanced', intensity: 'normal' }, { kind: 'rest' }] })}>Train ×2 + rest</button>
        <button onClick={() => onPlan({ kind: 'slots', slots: [0, 1, 2].map(() => ({ kind: 'train', focus: 'balanced', intensity: 'hard' })) as SlotPlan[] })}>Training camp (hard)</button>
        <button onClick={() => onPlan({ kind: 'slots', slots: [{ kind: 'rest' }, { kind: 'recovery' }, { kind: 'video' }] })}>Recovery week</button>
      </div>}
    </section>
  </div>;
}

export function WeekPage({ u, busy, onPlan, onPlay, onAuto, onDecision, onToggleWatch, onOpenEvent, onWatch, canWatch }: { u: any; busy: boolean; onPlan: (p: WeekPlan) => void; onPlay: () => void; onAuto: (weeks: number) => void; onDecision: (id: string) => void; onToggleWatch: () => void; onOpenEvent: () => void; onWatch: (id: string) => void; canWatch: (id: string) => boolean }) {
  const c = careerOf(u), p = me(u);
  const plan = c.current;
  const live = !!u.liveEvent && c.live;
  const ev = (plan.kind === 'compete' || plan.kind === 'junior') ? [...u.calendar, ...u.juniorCalendar].find((x: any) => x.id === plan.eventId) : null;
  const label = p.injury ? 'Rest and rehab' : ev ? `Play ${ev.name}` : 'Play the week';
  const d = c.decision;
  return <div className="cs-page">
    {d && <section className="cs-panel cs-decision"><small>Decision</small><h3>{d.title}</h3><p>{d.text}</p>
      <div className="cs-options">{d.options.map((o) => <button key={o.id} disabled={busy} onClick={() => onDecision(o.id)}><strong>{o.label}</strong><span>{o.desc}</span></button>)}</div></section>}
    {live ? <section className="cs-panel cs-live-banner"><h3>● You are playing {u.calendar.find((e: any) => e.id === c.live!.eventId)?.name}</h3><button onClick={onOpenEvent}>Go to your tournament</button></section> : <>
      <header className="cs-week-head"><div><small>Week {u.week} of 52 · {u.year} · age {p.age}</small><h2>What do you do this week?</h2></div>
        <div className="cs-plays" title="Card plays: one refills every two weeks">{'🃏'.repeat(c.cardPlays)}<i>{'🃏'.repeat(Math.max(0, maxPlays(c) - c.cardPlays))}</i><small>card plays{c.boost ? ` · ⚡ ${c.boost.name} ready` : ''}</small></div></header>
      <WeekPlanner key={`${u.year}-${u.week}`} u={u} onPlan={onPlan} />
      <div className="cs-actions cs-sticky">
        <button className="cs-primary" disabled={busy || !!d} onClick={onPlay}>{busy ? 'Simulating…' : `▶ ${label}`}</button>
        {ev && <label className="cs-check"><input type="checkbox" checked={c.watchMatches} onChange={onToggleWatch} /> Play my main-draw matches live</label>}
        <span className="cs-gap" />
        <button className="cs-secondary" disabled={busy || !!d} onClick={() => onAuto(4)} title="The autopilot picks events, training and rest, stopping for decisions.">Autopilot 4 weeks</button>
        <button className="cs-secondary" disabled={busy || !!d} onClick={() => onAuto(52)}>…to season end</button>
      </div>
    </>}
    {c.lastReport && <ReportCard r={c.lastReport} onWatch={onWatch} canWatch={canWatch} />}
  </div>;
}
