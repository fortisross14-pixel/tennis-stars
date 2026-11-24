import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArTabs, useSwipe, useTilt, haptic } from './kit';
import { portraitUrl } from '../../../data/portraitLibrary.js';
import { careerOf, me, projectWeek, asSlots, restWeek, overall, juniorRank, type EventOption } from '../../engine';
import { FOCUSES, INTENSITY, PRIZE, SLOT_ACTIVITIES, REGION } from '../../data';
import * as T from '../../../sim/tournament.js';
import type { Intensity, SlotPlan, WeekPlan } from '../../types';
import { money, levelLabel } from '../common';
import './arena.css';

const { PRO_POINTS_BY_LEVEL } = T as any;
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
export const monthOf = (week: number) => MONTHS[Math.min(11, Math.floor((week - 1) / 4.34))];
const REGION_NAME: Record<string, string> = { europe: 'Europe', northamerica: 'North America', southamerica: 'South America', asia: 'Asia', africa: 'Africa', oceania: 'Oceania' };
const COURT: Record<string, [string, string]> = { Hard: ['#2f6fd0', '#1f4f9c'], Clay: ['#d0693d', '#a9502c'], Grass: ['#57a34a', '#3d7f35'], Indoor: ['#5560c4', '#363d8c'] };
const STATUS: Record<string, string> = { direct: 'Main draw', qualifying: 'Qualifying', wildcard: 'Wildcard', alternate: 'Alternate', out: 'Not accepted', ineligible: 'Not eligible' };
const JUNIOR_POINTS: Record<string, number> = { 'Junior Slam': 1000, 'Junior Finals': 750, 'Junior 500': 500, Continental: 400, 'Junior 200': 200 };

export function Court({ surface }: { surface: string }) {
  const [inner, outer] = COURT[surface] ?? COURT.Hard;
  return <div className="ar-court" aria-hidden="true">
    <div className="stands" />
    <svg viewBox="0 0 400 260"><rect x="0" y="0" width="400" height="260" fill={outer} /><rect x="60" y="30" width="280" height="200" fill={inner} />
      <g stroke="#fff" strokeWidth="2.5" fill="none" opacity=".9"><rect x="60" y="30" width="280" height="200" /><line x1="60" y1="55" x2="340" y2="55" /><line x1="60" y1="205" x2="340" y2="205" />
        <line x1="110" y1="55" x2="110" y2="205" /><line x1="290" y1="55" x2="290" y2="205" /><line x1="110" y1="130" x2="290" y2="130" /><line x1="200" y1="30" x2="200" y2="40" /><line x1="200" y1="220" x2="200" y2="230" /></g>
      <line x1="200" y1="22" x2="200" y2="238" stroke="#e8eef7" strokeWidth="5" opacity=".8" /></svg>
    <div className="lights" />
  </div>;
}

export function TopBar({ u, crumb, title, onExit }: { u: any; crumb: string; title: string; onExit: () => void }) {
  const c = careerOf(u), p = me(u);
  return <header className="ar-top ar-in-up">
    <div className="ar-crumb"><small>{crumb}</small><h1>{title}</h1><span className="ar-preview-tag">PREVIEW</span></div>
    <div className="ar-top-right">
      <span className="ar-chip">💰 <b>{money(c.money)}</b></span>
      <span className="ar-chip mint">{monthOf(u.week)} <em>| YEAR {u.year - c.startYear + 1}</em> · WEEK {u.week}</span>
      <span className="ar-avatar" title={`${p.firstName} ${p.lastName}`}><img src={portraitUrl(p)} alt="" /><span>{overall(p)}</span></span>
      <button className="ar-exit" onClick={onExit}>Classic view</button>
    </div>
  </header>;
}

type Tab = 'tournaments' | 'training';

export function ArenaWeek({ u, busy, onPlan, onPlay, onExit, onAuto, extraTabs }: { u: any; busy: boolean; onPlan: (p: WeekPlan) => void; onPlay: () => void; onExit: () => void; onAuto?: (n: number) => void; extraTabs?: React.ReactNode }) {
  const c = careerOf(u), p = me(u);
  const options = useMemo(() => projectWeek(u).filter((o) => o.status !== 'ineligible'), [u, u.week, p.ranking]);
  const plan = c.current;
  const sel = (plan.kind === 'compete' || plan.kind === 'junior') ? plan.eventId : null;
  const stageRef = useRef<HTMLDivElement>(null), heroRef = useRef<HTMLElement>(null);
  useTilt(heroRef, 4);
  const [tab, setTab] = useState<Tab>(sel ? 'tournaments' : options.some((o) => ['direct', 'qualifying', 'wildcard'].includes(o.status)) ? 'tournaments' : 'training');
  const [filter, setFilter] = useState<'all' | 'junior' | 'pro'>('all');
  const [focus, setFocus] = useState<string | null>(sel ?? options[0]?.event.id ?? null);
  const shown = options.filter((o) => filter === 'all' || (filter === 'junior') === (o.event.level.startsWith('Junior') || o.event.level === 'Continental'));
  const focused = options.find((o) => o.event.id === focus) ?? shown[0] ?? null;
  const slots: SlotPlan[] = asSlots(plan) ?? asSlots(restWeek())!;
  const injured = p.injury?.weeksRemaining > 0;
  const pick = (o: EventOption) => {
    setFocus(o.event.id);
    if (!['direct', 'qualifying', 'wildcard', 'alternate'].includes(o.status)) return;
    const junior = !u.calendar.some((e: any) => e.id === o.event.id);
    onPlan(sel === o.event.id ? { kind: 'slots', slots } : junior ? { kind: 'junior', eventId: o.event.id } : { kind: 'compete', eventId: o.event.id, doubles: o.doublesOk });
  };
  useSwipe(stageRef, () => setTab('training'), () => setTab('tournaments'));
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'SELECT') return;
      if (e.key === 'q' || e.key === 'Q') setTab('tournaments');
      else if (e.key === 'e' || e.key === 'E') setTab('training');
      else if (e.key === 'Enter' && !busy && !c.decision) onPlay();
      else if (tab === 'tournaments' && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        e.preventDefault();
        const i = shown.findIndex((o) => o.event.id === focused?.event.id);
        const n = shown[Math.max(0, Math.min(shown.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)))];
        if (n) setFocus(n.event.id);
      } else if (e.key === ' ' && focused && tab === 'tournaments') { e.preventDefault(); pick(focused); }
    };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  });

  const ev = focused?.event;
  const isJunior = ev && (ev.level.startsWith('Junior') || ev.level === 'Continental');
  const winPrize = ev ? (PRIZE[ev.level]?.W ?? 0) : 0;
  const winPts = ev ? (isJunior ? JUNIOR_POINTS[ev.level] ?? 200 : PRO_POINTS_BY_LEVEL[ev.level]?.W ?? 0) : 0;
  const energy = Math.round(100 - p.fatigue);
  const label = injured ? 'Rehab week' : sel ? 'Play' : 'Start week';
  const jr = juniorRank(u);

  return <div ref={stageRef} className="ar-week" aria-label="Week schedule">
    <div className="ar-subbar">
      <ArTabs tabs={[['tournaments', 'Tournaments'], ['training', 'Training week']]} value={tab} onChange={setTab} keys={['Q', 'E']} />
      {extraTabs}
      <span className="ar-chip">Week <b>{u.week}</b> of 52 · age {p.age}</span>
    </div>

    {tab === 'tournaments' ? <div className="ar-stage">
      <section className="ar-list">
        <div className="ar-list-head"><span>{shown.length} events this week{jr != null ? ` · junior No. ${jr}` : ''} · world {p.rankingPoints > 0 ? `No. ${p.ranking}` : 'unranked'}</span>
          <div className="ar-filter">{(['all', 'junior', 'pro'] as const).map((f) => <button key={f} className={filter === f ? 'on' : ''} onClick={() => setFilter(f)}>{f === 'all' ? 'All' : f === 'junior' ? 'Junior' : 'Pro'}</button>)}</div></div>
        {!shown.length && <div className="ar-panel ar-empty">No events here this week. Switch to Training week (E).</div>}
        {shown.map((o, i) => { const [a, b] = COURT[o.event.surface] ?? COURT.Hard; const can = ['direct', 'qualifying', 'wildcard', 'alternate'].includes(o.status); return <button key={o.event.id} style={{ animationDelay: `${i * 45}ms` }}
          className={`ar-event ${sel === o.event.id ? 'on' : ''} ${can ? '' : 'off'} ${focused?.event.id === o.event.id && sel !== o.event.id ? 'focus' : ''}`}
          onPointerEnter={(e) => { if (e.pointerType === 'mouse') setFocus(o.event.id); }} onFocus={() => setFocus(o.event.id)} onClick={() => { haptic(); pick(o); }}>
          <span className="ar-thumb"><i style={{ background: `linear-gradient(135deg,${a},${b})` }} /><b>{levelLabel(o.event.level, c.tour).replace('Junior continental', 'JR CONT')}</b></span>
          <span><strong>{o.event.name}</strong><small>{o.event.location} · {o.event.surface} · draw {o.event.drawSize}</small></span>
          <span className={`ar-status ${o.status}`}>{sel === o.event.id ? '✓ ' : ''}{STATUS[o.status]}</span>
        </button>; })}
      </section>
      <section ref={heroRef} className="ar-hero ar-in-right ar-tilt" key={ev?.id ?? 'none'}>
        {ev ? <>
          <Court surface={ev.surface} />
          <div className="ar-hero-title"><h2>{ev.name}</h2><p>📍 {ev.location}, {ev.country} ({REGION_NAME[REGION[ev.country]] ?? 'International'}) · Week {ev.week}</p></div>
          <div className="ar-panel ar-info">
            <span className="ar-badge">{levelLabel(ev.level, c.tour).replace('Junior continental', 'JR')}</span>
            <dl>
              <div><dt>Category</dt><dd>{levelLabel(ev.level, c.tour)}</dd></div>
              <div><dt>Your entry</dt><dd>{STATUS[focused!.status]}{focused!.cutoffRank ? ` · cut ≈ No. ${focused!.cutoffRank}` : ''}</dd></div>
              <div><dt>Draw</dt><dd>{ev.drawSize} players · {c.tour === 'ATP' && ev.level === 'Grand Slam' ? 'best of five' : 'best of three'}</dd></div>
              <div><dt>Surface</dt><dd>{ev.surface}{ev.surface === p.preferredSurface ? ' · your best surface' : ''}</dd></div>
            </dl>
            <div className="ar-rewards"><h4>Rewards</h4>
              <div className="ar-reward"><span>💵</span>Champion {money(winPrize)}</div>
              <div className="ar-reward"><span>📈</span>{winPts} {isJunior ? 'junior ' : ''}ranking points</div>
              <div className="ar-reward"><span>🎁</span>{['Grand Slam', '1000', 'Finals'].includes(ev.level) ? 'Elite' : ['500', '250', 'Junior Slam'].includes(ev.level) ? 'Gold' : ['Challenger', 'WTA 125', 'Junior 500'].includes(ev.level) ? 'Silver' : 'Bronze'} pack for the title</div>
              <div className="ar-reward"><span>✈</span>Travel {money(focused!.travel)}</div>
            </div>
          </div>
          <div className="ar-panel ar-energy"><em>Energy</em> 💛 {energy}%<span className="sep" /><em>Health</em> ➕ {p.injury ? p.injury.type : 'No injury'}<span className="sep" /><em>Form</em> {p.confidence >= 2 ? '🔥 Hot' : p.confidence <= -2 ? '🥶 Cold' : '😐 Steady'}</div>
        </> : <div className="ar-panel ar-empty">Hover an event to see the details.</div>}
      </section>
    </div> : <div className="ar-stage" style={{ gridTemplateColumns: '1fr' }}>
      {sel && <div className="ar-panel ar-empty ar-in-up" style={{ padding: 18 }}>You are entered in a tournament this week. <button className="ar-secondary" onClick={() => onPlan({ kind: 'slots', slots })}>Withdraw and train instead</button></div>}
      {!sel && <div className="ar-slots">{slots.map((sl, i) => { const act = SLOT_ACTIVITIES.find((a) => a.kind === sl.kind)!; return <div key={i} className="ar-slot" style={{ animationDelay: `${i * 80}ms` }}>
        <header><small>SLOT {i + 1}</small><strong>{act.icon} {act.label}</strong></header>
        <div className="ar-kinds">{SLOT_ACTIVITIES.map((a) => <button key={a.kind} className={a.kind === sl.kind ? 'on' : ''} title={a.desc} onClick={() => onPlan({ kind: 'slots', slots: slots.map((x, j) => j !== i ? x : a.kind === 'train' ? { kind: 'train', focus: x.kind === 'train' ? x.focus : 'balanced', intensity: x.kind === 'train' ? x.intensity : 'normal' } : { kind: a.kind } as SlotPlan) })}><i>{a.icon}</i>{a.label.replace(' session', '').replace(' study', '').replace(' work', '').replace(' day', '')}</button>)}</div>
        {sl.kind === 'train' ? <>
          <select className="ar-select" value={sl.focus} onChange={(e) => onPlan({ kind: 'slots', slots: slots.map((x, j) => j === i ? { ...sl, focus: e.target.value } : x) })}>{FOCUSES.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}</select>
          <div className="ar-seg">{(Object.keys(INTENSITY) as Intensity[]).map((k) => <button key={k} className={sl.intensity === k ? 'on' : ''} onClick={() => onPlan({ kind: 'slots', slots: slots.map((x, j) => j === i ? { ...sl, intensity: k } : x) })}>{INTENSITY[k].label}</button>)}</div>
          <p>{FOCUSES.find((f) => f.id === sl.focus)?.desc} About +{Math.round(INTENSITY[sl.intensity].fatigue / 3)} fatigue.</p>
        </> : <p>{act.desc}</p>}
      </div>; })}</div>}
    </div>}

    <footer className="ar-foot">
      <span className="ar-hint hide-sm kb-only"><span className="ar-key">↑↓</span> Browse <span className="ar-key">Space</span> Select</span>
      {onAuto && <button className="ar-secondary" disabled={busy || !!c.decision} onClick={() => onAuto(4)}>Autopilot ×4</button>}
      <button className="ar-play" disabled={busy || !!c.decision} onClick={() => { haptic(14); onPlay(); }}><span className="ar-key">⏎</span>{busy ? 'Playing…' : label}</button>
    </footer>
  </div>;
}
