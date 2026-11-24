import React, { useEffect, useMemo, useState } from 'react';
import { portraitUrl } from '../../../data/portraitLibrary.js';
import * as S from '../../../sim/season.js';
import { careerOf, me, myPendingSlot, overall, orientSets } from '../../engine';
import { SKILLS } from '../../data';
import type { MatchRecord } from '../../types';
import { roundLabel, levelLabel } from '../common';
import { MatchViewer } from '../MatchViewer';
import { TopBar, monthOf } from './ArenaWeek';
import './arena.css';

const { liveState } = S as any;
const flip = (sc: string) => sc.split(' ').map((x) => x.split('-').reverse().join('-')).join(' ');
const eff = (p: any, k: string) => Math.round((p?.skills?.[k] ?? 0) * (p?.controlled ? 1 : Math.min(1, p?.currentMultiplier ?? 1)));
const SHORT: Record<string, string> = { serve: 'SRV', forehand: 'FH', backhand: 'BH', volley: 'VLY', return: 'RET', footwork: 'SPD', endurance: 'STM', mentality: 'MEN', tactics: 'TAC' };

function Fighter({ p, side, rank, race, state, isMe }: { p: any; side: 'me' | 'opp'; rank: string; race: string; state?: 'won' | 'lost'; isMe: boolean }) {
  return <div className={`ar-fighter ${side} ${state ?? ''}`}>
    <span className="glow" />
    {p?.id ? <img src={portraitUrl(p)} alt="" /> : <div style={{ width: 240, height: 240 }} />}
    <div className="ar-plate">
      <div className="name">{p ? `${p.firstName} ${p.lastName}` : '—'}</div>
      <div className="meta"><span>{p?.country}</span><span>OVR {p ? Math.round(p.currentRating) : '—'}</span><span>{p?.age ? `${p.age}y` : ''}</span></div>
      <span className="tag">{isMe ? 'YOU' : 'OPP'}</span>
    </div>
    <div className="ar-ranks"><span>World <b>{rank}</b></span><span>Race <b>{race}</b></span></div>
  </div>;
}

function Compare({ a, b, show }: { a: any; b: any; show: boolean }) {
  return <section className="ar-panel ar-compare ar-in-up">
    <h4>Head to head</h4>
    {SKILLS.map((s, i) => { const x = eff(a, s.key), y = eff(b, s.key); return <div key={s.key} className="ar-row">
      <span className={`v me ${x > y ? 'best' : ''}`}>{x}</span>
      <span className="ar-bar me"><i style={{ width: show ? `${x}%` : 0, transitionDelay: `${i * 60}ms` }} /></span>
      <span className="k">{SHORT[s.key]}</span>
      <span className="ar-bar opp"><i style={{ width: show ? `${y}%` : 0, transitionDelay: `${i * 60}ms` }} /></span>
      <span className={`v opp ${y > x ? 'best' : ''}`}>{y}</span>
    </div>; })}
  </section>;
}

/**
 * Pre-match (your next live match) or result (your most recent match).
 * `recordId` picks a specific match from your log.
 */
export function ArenaMatch({ u, busy, onLive, onExit, onContinue, recordId }: { u: any; busy: boolean; onLive: (mode: string, slot?: number | null) => Promise<void>; onExit: () => void; onContinue: () => void; recordId?: string }) {
  const c = careerOf(u), p = me(u);
  const [show, setShow] = useState(false);
  const [watch, setWatch] = useState(false);
  const [justPlayed, setJustPlayed] = useState<{ eventId: string; round: string } | null>(null);
  useEffect(() => { const t = setTimeout(() => setShow(true), 120); return () => clearTimeout(t); }, []);
  const st = c.live ? liveState(u, c.live.eventId) : null;
  const mySlot = st ? myPendingSlot(st, p.id) : null;
  const event = c.live ? u.calendar.find((e: any) => e.id === c.live!.eventId) : null;
  const pool = [...u.players[c.tour], ...u.juniors[c.tour], ...(u.retiredPlayers?.[c.tour] || [])];

  // the match to show as a result
  const result: { rec: MatchRecord | null; live: any } = useMemo(() => {
    if (justPlayed) {
      const st2 = liveState(u, justPlayed.eventId);
      const ed = (u.tournamentEditions || []).find((e: any) => e.id === justPlayed.eventId);
      const m = (st2?.matches ?? ed?.matches ?? []).find((x: any) => x.round === justPlayed.round && (x.playerA === p.id || x.playerB === p.id));
      if (m) { const ev = u.calendar.find((e: any) => e.id === justPlayed.eventId); const won = m.winnerId === p.id; return { rec: { id: m.id, year: ev.year, week: ev.week, event: ev.name, level: ev.level, surface: ev.surface, round: m.round, oppId: won ? m.loserId : m.winnerId, oppName: '', oppCountry: '', oppRank: 0, myRank: p.ranking, won, score: won ? m.score : flip(m.score), sets: orientSets(m, p.id), tags: m.tags || [], minutes: m.durationMinutes } as MatchRecord, live: true }; }
    }
    const rec = recordId ? c.matchLog.find((m) => m.id === recordId) : c.matchLog.filter((m) => m.sets.length).at(-1);
    return { rec: rec ?? null, live: false };
  }, [u, justPlayed, recordId]);

  const pre = !justPlayed && st && mySlot != null;
  const oppId = pre ? (st.alive[mySlot! * 2] === p.id ? st.alive[mySlot! * 2 + 1] : st.alive[mySlot! * 2]) : result.rec?.oppId;
  const opp = pool.find((x: any) => x.id === oppId) ?? null;
  const round = pre ? st.rounds[st.roundIndex] : result.rec?.round;
  const evName = pre ? event?.name : result.rec?.event;
  const level = pre ? event?.level : result.rec?.level;
  const surface = pre ? event?.surface : result.rec?.surface;
  const won = result.rec?.won;
  const rk = (x: any) => (x?.rankingPoints > 0 ? `${x.ranking}` : '—');
  const race = (list: any[], x: any) => { if (!x || x.junior) return '—'; const i = [...list].sort((a, b) => (b.season?.racePoints || 0) - (a.season?.racePoints || 0)).findIndex((y) => y.id === x.id); return i >= 0 ? `${i + 1}` : '—'; };
  const play = async () => { if (!pre) return; setJustPlayed({ eventId: c.live!.eventId, round }); await onLive('slot', mySlot); setShow(false); setTimeout(() => setShow(true), 150); };

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onExit(); else if (e.key === 'Enter' && !busy) { if (pre) void play(); else onContinue(); } else if ((e.key === 'w' || e.key === 'W') && result.rec) setWatch(true); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  });

  if (!pre && !result.rec) return <div className="ar"><TopBar u={u} crumb="Tournaments" title="Match" onExit={onExit} /><div className="ar-stage"><div className="ar-panel ar-empty" style={{ gridColumn: '1/-1' }}>No match yet. Enter a tournament with "Play my matches live" and come back here for your next match, or play any week and the result shows here.</div></div></div>;

  const sets = result.rec?.sets ?? [];
  const setScores = sets.map((s) => { let a = 0, b = 0; for (const g of s.gameWinners) { if (g === 'A') a += 1; else b += 1; } return [a, b]; });
  return <div className="ar" role="application" aria-label="Match">
    <TopBar u={u} crumb="Tournaments" title={evName ?? 'Match'} onExit={onExit} />
    {!pre && <div className={`ar-result-banner ${won ? '' : 'loss'}`} key={result.rec?.id}>
      <h2>{won ? 'Victory' : 'Defeat'}</h2>
      <p>{roundLabel(round ?? '', result.rec?.qualifying)} · {levelLabel(level ?? '', c.tour)} · {surface}{result.rec?.minutes ? ` · ${Math.floor(result.rec.minutes / 60)}h ${result.rec.minutes % 60}m` : ''}</p>
      <div className="ar-sets">{setScores.map(([a, b], i) => <div key={i} className={a > b ? 'w' : 'l'} style={{ animationDelay: `${200 + i * 120}ms` }}><small>SET {i + 1}</small><b>{a}–{b}</b></div>)}</div>
    </div>}
    <div className="ar-match">
      <Fighter p={p} side="me" isMe rank={rk(p)} race={race(u.players[c.tour], p)} state={pre ? undefined : won ? 'won' : 'lost'} />
      <div className="ar-side">
        {pre && <section className="ar-panel ar-in-up" style={{ padding: '16px 20px', display: 'grid', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><b style={{ fontFamily: 'var(--ar-head)', fontSize: 22, fontStyle: 'italic', textTransform: 'uppercase' }}>{roundLabel(round)}</b><span className="ar-badge" style={{ position: 'static' }}>{round}</span></div>
          <span style={{ color: 'var(--ar-dim)' }}>{levelLabel(level, c.tour)} · {surface} · {c.tour === 'ATP' && level === 'Grand Slam' ? 'Best of five' : 'Best of three'} · {monthOf(u.week)} {u.year}</span>
          <span>💛 {Math.round(100 - p.fatigue)}% energy · {p.injury ? `🩹 ${p.injury.type}` : '➕ No injury'}{c.boost ? ` · ⚡ ${c.boost.name}` : ''}</span>
        </section>}
        <Compare a={p} b={opp} show={show} />
        {!pre && sets.length > 0 && <section className="ar-panel ar-timeline ar-in-up">
          <h4>Game by game</h4>
          {sets.map((s, i) => <div key={i} className="ar-tl-row"><small>S{i + 1}</small>{s.gameWinners.map((g, j) => { const tb = j === 12; const brk = !tb && s.servers[j] && s.servers[j] !== g; return <i key={j} title={`Game ${j + 1}${tb ? ' · tie-break' : brk ? ' · break' : ''}`} className={`ar-dot ${g === 'A' ? 'me' : 'opp'} ${brk ? 'brk' : ''} ${tb ? 'tb' : ''}`} style={{ animationDelay: `${300 + (i * 13 + j) * 25}ms` }} />; })}</div>)}
          <div className="ar-legend"><span><i style={{ background: 'var(--ar-orange)' }} />your game</span><span><i style={{ background: 'var(--ar-teal)' }} />their game</span><span><i style={{ boxShadow: '0 0 0 3px var(--ar-yellow)', background: 'transparent' }} />break of serve</span><span>◆ tie-break</span></div>
        </section>}
      </div>
      <Fighter p={opp} side="opp" isMe={false} rank={rk(opp)} race={race(u.players[c.tour], opp)} state={pre ? undefined : won ? 'lost' : 'won'} />
    </div>
    <footer className="ar-foot">
      <span className="ar-hint"><button onClick={onExit}><span className="ar-key">Esc</span> Back</button></span>
      {!pre && result.rec && <button className="ar-secondary" onClick={() => setWatch(true)}><span className="ar-key">W</span> Watch replay</button>}
      {pre ? <button className="ar-play" disabled={busy} onClick={play}><span className="ar-key">⏎</span>{busy ? 'Playing…' : 'Play match'}</button>
        : <button className="ar-play" disabled={busy} onClick={onContinue}><span className="ar-key">⏎</span>Continue</button>}
    </footer>
    {watch && result.rec && <MatchViewer match={result.rec} me={p} opp={opp ?? { firstName: result.rec.oppName, lastName: '' }} onClose={() => setWatch(false)} />}
  </div>;
}
