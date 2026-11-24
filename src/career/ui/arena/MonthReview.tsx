import React, { useEffect, useMemo, useState } from 'react';
import { portraitUrl } from '../../../data/portraitLibrary.js';
import type { MonthReview as MR } from '../../types';
import { SKILLS, ROUND_NAME } from '../../data';
import { money, levelLabel } from '../common';
import { CountUp, Confetti, haptic } from './kit';

type Slide = 'title' | 'results' | 'ranking' | 'skills' | 'money' | 'rewards';
const AUTO_MS = 3200;

/** Month in review: a short animated sequence. Tap to advance; it also advances on its own. */
export function MonthReview({ r, me, tour, onDone }: { r: MR; me: any; tour: string; onDone: () => void }) {
  const slides = useMemo(() => {
    const s: Slide[] = ['title'];
    if (r.tournaments.length || r.wins + r.losses) s.push('results');
    s.push('ranking');
    if (Object.keys(r.skillDelta).length) s.push('skills');
    s.push('money');
    if (r.unlocks.length || r.packs) s.push('rewards');
    return s;
  }, [r]);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const slide = slides[i];
  const next = () => { haptic(); if (i + 1 >= slides.length) onDone(); else setI(i + 1); };
  useEffect(() => { if (paused) return; const t = setTimeout(next, slide === 'title' ? 2000 : AUTO_MS); return () => clearTimeout(t); }, [i, paused]);
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onDone(); else if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); next(); } else if (e.key === 'ArrowLeft') setI(Math.max(0, i - 1)); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); });
  const rankFrom = r.from.ranked ? r.from.rank : null, rankTo = r.to.ranked ? r.to.rank : null;
  const moved = rankFrom && rankTo ? rankFrom - rankTo : rankTo ? 1 : 0;
  const jrMoved = r.from.juniorRank && r.to.juniorRank ? r.from.juniorRank - r.to.juniorRank : 0;
  const net = r.to.money - r.from.money, prize = r.to.totalPrize - r.from.totalPrize;
  const good = r.titles.length > 0 || moved > 10 || r.unlocks.some((u) => u.kind === 'milestone');

  return <div className="mr" role="dialog" aria-modal="true" aria-label={`${r.label} in review`} onPointerUp={(e) => { if ((e.target as HTMLElement).closest('button')) return; next(); }}>
    <div className="mr-progress">{slides.map((s, j) => <i key={s} className={j < i ? 'done' : j === i ? (paused ? 'now paused' : 'now') : ''} style={j === i ? { animationDuration: `${slide === 'title' ? 2000 : AUTO_MS}ms` } : undefined} />)}</div>
    <div className="mr-top"><small>Month in review</small><button className="mr-skip" onClick={(e) => { e.stopPropagation(); setPaused((p) => !p); }}>{paused ? '▶' : '❚❚'}</button><button className="mr-skip" onClick={(e) => { e.stopPropagation(); onDone(); }}>Skip</button></div>

    <div className="mr-stage" key={slide}>
      {slide === 'title' && <div className="mr-title">
        <img src={portraitUrl(me)} alt="" className="mr-face" />
        <h1>{r.label.split(' ')[0]}</h1><h2>{r.year}</h2>
        <p>{r.wins + r.losses ? `${r.wins}–${r.losses} in matches` : 'A month of work'}{r.titles.length ? ` · ${r.titles.length} title${r.titles.length > 1 ? 's' : ''}` : ''}</p>
        {good && <Confetti count={50} />}
      </div>}

      {slide === 'results' && <div className="mr-block">
        <h3>Results</h3>
        <div className="mr-big"><b className="w"><CountUp value={r.wins} /></b><span>–</span><b className="l"><CountUp value={r.losses} /></b></div>
        <ul className="mr-list">{r.tournaments.map((t, j) => <li key={j} style={{ animationDelay: `${200 + j * 140}ms` }} className={t.result === 'W' ? 'champ' : ''}>
          <span className="mr-lvl">{levelLabel(t.level, tour)}</span><strong>{t.event}</strong><em>{t.result === 'W' ? '🏆 Champion' : ROUND_NAME[t.result] ?? t.result}</em><code>{money(t.prize)}</code>
        </li>)}</ul>
        {r.bestWin && <p className="mr-note">Best win: <b>{r.bestWin.name}</b> (No. {r.bestWin.rank}) at {r.bestWin.event}</p>}
      </div>}

      {slide === 'ranking' && <div className="mr-block center">
        <h3>World ranking</h3>
        <div className="mr-rank"><span className="from">{rankFrom ? `No. ${rankFrom}` : 'Unranked'}</span><i>→</i><b className={moved > 0 ? 'up' : moved < 0 ? 'down' : ''}>{rankTo ? <>No. <CountUp value={rankTo} /></> : 'Unranked'}</b></div>
        {moved !== 0 && rankTo && <div className={`mr-delta ${moved > 0 ? 'up' : 'down'}`}>{moved > 0 ? '▲' : '▼'} {Math.abs(moved)} places</div>}
        {r.to.juniorRank != null && <p className="mr-note">Junior ranking: No. {r.from.juniorRank ?? '—'} → <b>No. {r.to.juniorRank}</b>{jrMoved ? ` (${jrMoved > 0 ? '▲' : '▼'}${Math.abs(jrMoved)})` : ''}</p>}
      </div>}

      {slide === 'skills' && <div className="mr-block">
        <h3>Improvement</h3>
        <div className="mr-ovr"><span>Overall</span><b>{r.from.ovr}</b><i>→</i><b className="to"><CountUp value={r.to.ovr} /></b></div>
        <div className="mr-skills">{SKILLS.filter((s) => r.skillDelta[s.key]).map((s, j) => { const a = r.from.base[s.key], b = r.to.base[s.key]; const d = r.skillDelta[s.key]!; return <div key={s.key} className="mr-skill" style={{ animationDelay: `${j * 90}ms` }}>
          <span>{s.label}</span>
          <div className="mr-bar"><i className="old" style={{ width: `${Math.min(a, b)}%` }} /><i className={`gain ${d < 0 ? 'neg' : ''}`} style={{ left: `${Math.min(a, b)}%`, width: `${Math.abs(b - a)}%`, animationDelay: `${300 + j * 90}ms` }} /></div>
          <b className={d > 0 ? 'up' : 'down'}>{d > 0 ? '+' : ''}{d.toFixed(1)}</b><small>{b.toFixed(1)}</small>
        </div>; })}</div>
      </div>}

      {slide === 'money' && <div className="mr-block center">
        <h3>Bank</h3>
        <div className="mr-money"><b className={net >= 0 ? 'up' : 'down'}>{net >= 0 ? '+' : '−'}<CountUp value={Math.abs(net)} format={money} /></b><span>this month</span></div>
        <div className="mr-pills"><span>🏆 Prize <b>{money(prize)}</b></span><span>💰 Balance <b>{money(r.to.money)}</b></span><span>⭐ Fame <b>{r.to.fame - r.from.fame >= 0 ? '+' : ''}{r.to.fame - r.from.fame}</b></span></div>
        {r.injuries.length > 0 && <p className="mr-note warn">🩹 {r.injuries[0]}</p>}
      </div>}

      {slide === 'rewards' && <div className="mr-block center">
        <h3>Unlocked</h3>
        <div className="mr-rewards">
          {r.packs > 0 && <div className="mr-reward pack" style={{ animationDelay: '100ms' }}><i>🎁</i><b>{r.packs} pack{r.packs > 1 ? 's' : ''}</b><small>waiting in Improvement</small></div>}
          {r.unlocks.map((u, j) => <div key={j} className={`mr-reward ${u.kind}`} style={{ animationDelay: `${250 + j * 160}ms` }}><i>{u.kind === 'special' ? '✨' : u.kind === 'equipment' ? '🎒' : '🏆'}</i><b>{u.label}</b><small>{u.kind === 'special' ? 'Special skill' : u.kind === 'equipment' ? 'Equipment' : 'Milestone'}</small></div>)}
        </div>
      </div>}
    </div>

    <div className="mr-foot"><span>{i + 1} / {slides.length}</span><button className="ar-play" onClick={(e) => { e.stopPropagation(); next(); }}>{i + 1 >= slides.length ? 'Continue' : 'Next'}</button></div>
  </div>;
}
