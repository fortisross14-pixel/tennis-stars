import React, { useEffect, useMemo, useRef, useState } from 'react';
import { portraitUrl } from '../../../data/portraitLibrary.js';
import type { ViewerMatch } from '../MatchViewer';
import { haptic } from './kit';

const COURT: Record<string, [string, string]> = { Hard: ['#2f6fd0', '#1f4f9c'], Clay: ['#d0693d', '#a9502c'], Grass: ['#57a34a', '#3d7f35'], Indoor: ['#5560c4', '#363d8c'] };
const SPEEDS: [string, number][] = [['1×', 1], ['2×', 2], ['4×', 4]];

type Call = { text: string; kind: 'hold' | 'break' | 'set' | 'tb' | 'match'; side: 'A' | 'B' } | null;

/**
 * The match as an animation: a rally on court for every game, holds and
 * breaks called out, a broadcast score bug, and a stop at the end of each set.
 * 'A' is you (bottom of the court).
 */
export function ArenaLive({ match, me, opp, onDone }: { match: ViewerMatch; me: any; opp: any; onDone: () => void }) {
  const sets = match.sets;
  const [si, setSi] = useState(0);        // set index
  const [gi, setGi] = useState(0);        // games completed in this set
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [call, setCall] = useState<Call>(null);
  const [rally, setRally] = useState(0);  // remounts the ball animation each game
  const [setBreak, setSetBreak] = useState(false);
  const timer = useRef<number | null>(null);
  const cur = sets[si];
  const total = cur?.gameWinners.length ?? 0;
  const done = si >= sets.length - 1 && gi >= total;
  const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gameMs = (reduced ? 500 : 1500) / speed;

  const games = (s: typeof cur, n: number) => { let a = 0, b = 0; for (const w of (s?.gameWinners ?? []).slice(0, n)) { if (w === 'A') a += 1; else b += 1; } return [a, b]; };
  const [ga, gb] = games(cur, gi);
  const setsWon = useMemo(() => { let a = 0, b = 0; for (let i = 0; i < si + (gi >= total ? 1 : 0); i += 1) { const [x, y] = games(sets[i], sets[i].gameWinners.length); if (x > y) a += 1; else b += 1; } return [a, b]; }, [si, gi, total]);
  const nextServer = cur?.servers[gi] ?? null;

  useEffect(() => {
    if (!playing || setBreak || done || !cur) return;
    if (gi >= total) return;
    timer.current = window.setTimeout(() => {
      const w = cur.gameWinners[gi] as 'A' | 'B';
      const server = cur.servers[gi];
      const tb = gi === 12;
      const brk = !tb && !!server && server !== w;
      const endSet = gi + 1 >= total;
      const endMatch = endSet && si >= sets.length - 1;
      setGi(gi + 1); setRally((r) => r + 1);
      setCall(endMatch ? { text: 'Game, set and match', kind: 'match', side: w } : endSet ? { text: `Set ${si + 1}`, kind: 'set', side: w } : tb ? { text: 'Tie-break', kind: 'tb', side: w } : brk ? { text: w === 'A' ? 'Break!' : 'Broken', kind: 'break', side: w } : { text: 'Hold', kind: 'hold', side: w });
      if (brk || endSet) haptic(brk ? 18 : 25);
      if (endSet && !endMatch) setTimeout(() => setSetBreak(true), 900 / speed);
    }, gameMs);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [playing, gi, si, setBreak, speed, done]);
  useEffect(() => { if (!call) return; const t = setTimeout(() => setCall(null), Math.max(500, 1100 / speed)); return () => clearTimeout(t); }, [call]);
  useEffect(() => { if (done) { const t = setTimeout(onDone, 1700); return () => clearTimeout(t); } }, [done]);

  const nextSet = () => { haptic(); setSetBreak(false); setSi(si + 1); setGi(0); setPlaying(true); };
  const skipSet = () => { setGi(total); if (si < sets.length - 1) setSetBreak(true); };
  const skipAll = () => { setSi(sets.length - 1); setGi(sets.at(-1)!.gameWinners.length); setSetBreak(false); };
  const [inner, outer] = COURT[match.surface] ?? COURT.Hard;
  const name = (p: any) => p ? `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() : '—';
  // completed sets in the columns; the big box is the set in play
  const setScores = sets.map((s, i) => i < si || (i === si && (setBreak || done)) ? games(s, s.gameWinners.length) : null);
  const finishedSet = setBreak ? games(cur, total) : null;

  return <div className="ar-live">
    {/* broadcast score bug */}
    <div className="ar-bug" role="status" aria-live="polite">
      {[0, 1].map((side) => { const p = side ? opp : me; const sideKey = side ? 'B' : 'A'; return <div key={side} className={`ar-bug-row ${side ? 'opp' : 'me'}`}>
        {p?.id ? <img src={portraitUrl(p)} alt="" /> : <span className="ar-bug-ph" />}
        <b className="ar-bug-name">{name(p)}</b>
        <i className={`ar-bug-serve ${nextServer === sideKey && !done && !setBreak ? 'on' : ''}`} title="Serving">●</i>
        {setScores.map((sc, i) => sc && <span key={i} className={`ar-bug-set ${i === si && !setBreak && !done ? 'cur' : ''} ${i < si || (i === si && (setBreak || done)) ? ((sc[side] > sc[1 - side]) ? 'w' : 'l') : ''}`}>{sc[side]}</span>)}
        <strong className="ar-bug-games" key={`${si}-${side ? gb : ga}-${side}`}>{side ? gb : ga}</strong>
      </div>; })}
    </div>

    <div className={`ar-livecourt ${call && call.kind !== 'hold' ? (call.side === 'A' ? 'pt-me' : 'pt-opp') : ''}`} style={{ ['--court' as any]: inner, ['--court-out' as any]: outer }}>
      <div className="ar-lc-inner">
        <div className="ar-lc-court"><i className="ln base-t" /><i className="ln base-b" /><i className="ln side-l" /><i className="ln side-r" /><i className="ln svc-t" /><i className="ln svc-b" /><i className="ln center" /><i className="net" /></div>
        <span className="ar-lc-player opp">{opp?.id ? <img src={portraitUrl(opp)} alt="" /> : null}</span>
        <span className="ar-lc-player me">{me?.id ? <img src={portraitUrl(me)} alt="" /> : null}</span>
        {playing && !setBreak && !done && gi < total && <span className="ar-ball" key={rally} style={{ animationDuration: `${gameMs}ms` }} />}
      </div>
      {call && <div className={`ar-call ${call.kind} ${call.side === 'A' ? 'me' : 'opp'}`} key={`${si}-${gi}`}>{call.text}</div>}
      {setBreak && finishedSet && <div className="ar-setbreak">
        <small>End of set {si + 1}</small>
        <h3>{finishedSet[0] > finishedSet[1] ? `${name(me)} takes it` : `${name(opp)} takes it`}</h3>
        <b>{finishedSet[0]}–{finishedSet[1]}</b>
        <button className="ar-play" onClick={nextSet}>▶ Play set {si + 2}</button>
      </div>}
    </div>

    <div className="ar-strip">{sets.slice(0, si + 1).map((s, i) => <div key={i} className="ar-tl-row"><small>S{i + 1}</small>{s.gameWinners.slice(0, i < si ? s.gameWinners.length : gi).map((g, j) => { const tb = j === 12; const brk = !tb && s.servers[j] && s.servers[j] !== g; return <i key={j} title={`Game ${j + 1}: ${g === 'A' ? 'your game' : 'their game'}${brk ? ' (break)' : ''}${tb ? ' (tie-break)' : ''}`} className={`ar-dot ${g === 'A' ? 'me' : 'opp'} ${brk ? 'brk' : ''} ${tb ? 'tb' : ''}`} />; })}</div>)}</div>

    <div className="ar-live-ctrl">
      {!done && !setBreak && <button className="ar-secondary" onClick={() => setPlaying((v) => !v)}>{playing ? '❚❚ Pause' : '▶ Resume'}</button>}
      <div className="ar-seg small">{SPEEDS.map(([l, v]) => <button key={v} className={speed === v ? 'on' : ''} onClick={() => setSpeed(v)}>{l}</button>)}</div>
      {!done && !setBreak && <button className="ar-secondary" onClick={skipSet}>Skip set</button>}
      {!done && <button className="ar-secondary" onClick={skipAll}>Skip to result</button>}
      {done && <button className="ar-play" onClick={onDone}>See the result</button>}
      <span className="ar-live-sets">Sets <b>{setsWon[0]}–{setsWon[1]}</b></span>
    </div>
  </div>;
}
