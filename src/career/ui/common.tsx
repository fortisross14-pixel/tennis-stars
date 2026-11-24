import React from 'react';
import { SKILLS } from '../data';
import type { Career, Skills } from '../types';

export const money = (n: number) => {
  const a = Math.abs(n), s = n < 0 ? '−' : '';
  if (a >= 1e6) return `${s}$${(a / 1e6).toFixed(a >= 1e7 ? 1 : 2)}M`;
  if (a >= 1e4) return `${s}$${Math.round(a / 1000)}K`;
  if (a >= 1000) return `${s}$${(a / 1000).toFixed(1)}K`;
  return `${s}$${Math.round(a)}`;
};
export const ordinalRank = (r: number | null | undefined) => (r == null || r >= 999 ? 'Unranked' : `No. ${r}`);

export function Stars({ n, max = 5 }: { n: number; max?: number }) {
  return <span className="cs-stars" aria-label={`${n} of ${max} stars`}>{'★'.repeat(n)}<i>{'★'.repeat(Math.max(0, max - n))}</i></span>;
}

export function SkillBars({ c, skills, boost }: { c: Career; skills?: Skills; boost?: Partial<Skills> }) {
  const base = skills ?? c.base;
  return <div className="cs-skills">
    {SKILLS.map((s) => {
      const v = base[s.key], cap = c.ceiling[s.key], b = boost?.[s.key] ?? 0;
      return <div key={s.key} className="cs-skill">
        <span>{s.label}</span>
        <div className="cs-skill-track" title={`Potential ${cap}`}>
          <i className="cs-skill-cap" style={{ width: `${cap}%` }} />
          <i className="cs-skill-val" style={{ width: `${Math.min(100, v)}%` }} />
          {b > 0 && <i className="cs-skill-boost" style={{ left: `${Math.min(100, v)}%`, width: `${Math.min(100 - v, b)}%` }} />}
        </div>
        <b>{v.toFixed(1)}{b > 0 && <em> +{b}</em>}</b>
        <small>/{cap}</small>
      </div>;
    })}
  </div>;
}

export function Bar({ label, value, max = 100, tone }: { label: string; value: number; max?: number; tone?: 'bad' | 'good' | 'warn' }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return <div className={`cs-bar ${tone ?? ''}`}><div><span>{label}</span><strong>{Math.round(value)}</strong></div><i><b style={{ width: `${pct}%` }} /></i></div>;
}

export function Modal({ title, onClose, children, wide, footer }: { title: React.ReactNode; onClose?: () => void; children: React.ReactNode; wide?: boolean; footer?: React.ReactNode }) {
  return <div className="cs-modal" role="dialog" aria-modal="true" onMouseDown={(e) => { if (e.target === e.currentTarget && onClose) onClose(); }}>
    <div className={`cs-modal-card ${wide ? 'wide' : ''}`}>
      <header><h3>{title}</h3>{onClose && <button className="cs-x" onClick={onClose} aria-label="Close">✕</button>}</header>
      <div className="cs-modal-body">{children}</div>
      {footer && <footer>{footer}</footer>}
    </div>
  </div>;
}

export const LEVEL_SHORT: Record<string, string> = { 'Grand Slam': 'Slam', '1000': 'M1000', '500': 'ATP 500', '250': 'ATP 250', Challenger: 'Challenger', 'WTA 125': 'WTA 125', ITF: 'ITF', Finals: 'Finals', Olympics: 'Olympics', 'Junior Slam': 'Junior Slam', 'Junior 500': 'Junior 500', 'Junior Finals': 'Junior Finals', Continental: 'Junior continental' };
export function levelLabel(level: string, tour: string) {
  if (tour === 'WTA' && (level === '500' || level === '250' || level === '1000')) return level === '1000' ? 'WTA 1000' : `WTA ${level}`;
  return LEVEL_SHORT[level] ?? level;
}

export const STATUS_LABEL: Record<string, string> = { direct: 'Main draw', qualifying: 'Qualifying', wildcard: 'Wildcard', alternate: 'Alternate', out: 'Not accepted', ineligible: 'Not eligible' };
