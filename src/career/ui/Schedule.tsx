import React, { useMemo } from 'react';
import { SurfaceBadge } from '../../components/Common.jsx';
import { careerOf, me, projectWeek, weekKeyOf, levelRank } from '../engine';
import type { WeekPlan } from '../types';
import { levelLabel, STATUS_LABEL } from './common';

/** Plan the next weeks. The autopilot and the weekly default follow this plan. */
export function Schedule({ u, onSetPlan }: { u: any; onSetPlan: (week: number, plan: WeekPlan | null) => void }) {
  const c = careerOf(u), p = me(u);
  const weeks = useMemo(() => Array.from({ length: Math.min(12, 53 - u.week) }, (_, i) => u.week + i).filter((w) => w <= 52), [u.week]);
  const rows = useMemo(() => weeks.map((w) => ({ week: w, options: projectWeek(u, w) })), [u, weeks, p.ranking]);
  return <div className="cs-page">
    <section className="cs-panel">
      <div className="cs-title-row"><h2>Schedule</h2><span className="muted">Plan ahead. Projections use today's rankings; they firm up as the week approaches.</span></div>
      <div className="cs-schedule">{rows.map(({ week, options }) => {
        const key = weekKeyOf(u.year, week);
        const plan = week === u.week ? c.current : c.plan[key];
        const sel = plan && (plan.kind === 'compete' || plan.kind === 'junior') ? plan.eventId : null;
        const shown = options.filter((o) => o.status !== 'ineligible').slice(0, 6);
        return <article key={week} className={week === u.week ? 'now' : ''}>
          <header><strong>Week {week}</strong>{week === u.week && <em>this week</em>}
            <span>{plan ? plan.kind === 'train' ? '🏋 Train' : plan.kind === 'rest' ? '🛌 Rest' : '🎾 Play' : <span className="muted">default: train</span>}</span>
            {plan && week !== u.week && <button className="ghost" onClick={() => onSetPlan(week, null)}>clear</button>}
          </header>
          <ul>{shown.map((o) => <li key={o.event.id} className={sel === o.event.id ? 'selected' : ''}>
            <button disabled={!['direct', 'qualifying', 'wildcard', 'alternate'].includes(o.status)} onClick={() => onSetPlan(week, u.calendar.some((e: any) => e.id === o.event.id) ? { kind: 'compete', eventId: o.event.id, doubles: o.doublesOk } : { kind: 'junior', eventId: o.event.id })}>
              <span className="cs-level">{levelLabel(o.event.level, c.tour)}</span><b>{o.event.name}</b><SurfaceBadge surface={o.event.surface} /><span className={`cs-entry st-${o.status}`}>{STATUS_LABEL[o.status]}</span>
            </button></li>)}
            {!shown.length && <li className="muted">No events.</li>}
            {week !== u.week && <li className="cs-sched-alt"><button onClick={() => onSetPlan(week, { kind: 'rest' })}>Plan rest</button></li>}
          </ul>
        </article>;
      })}</div>
    </section>
  </div>;
}
export { levelRank };
