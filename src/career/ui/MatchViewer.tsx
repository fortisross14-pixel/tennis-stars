import React, { useEffect, useMemo, useState } from 'react';
import Portrait from '../../components/Portrait.jsx';
import { Flag, SurfaceBadge } from '../../components/Common.jsx';
import { ROUND_NAME } from '../data';

export interface ViewerSet { gameWinners: string[]; servers: string[] }
export interface ViewerMatch { sets: ViewerSet[]; won: boolean; score: string; event: string; round: string; surface: string; minutes?: number; tags?: string[]; qualifying?: boolean }

const SPEEDS: [string, number][] = [['Slow', 1100], ['Normal', 550], ['Fast', 180]];

/**
 * Game-by-game replay of a match. 'A' is you. Plays one set at a time and
 * stops at the end of each set. With `pending` the match has not been played
 * yet: the start button asks the caller to compute it first.
 */
export function MatchViewer({ match, me, opp, pending, busy, onCompute, onClose }: {
  match: ViewerMatch | null; me: any; opp: any; pending?: boolean; busy?: boolean;
  onCompute?: () => Promise<void>; onClose: () => void;
}) {
  const [setIdx, setSetIdx] = useState(0);
  const [gameIdx, setGameIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(550);
  const [startWhenReady, setStartWhenReady] = useState(false);
  const sets = match?.sets ?? [];
  const cur = sets[setIdx];
  const total = cur?.gameWinners.length ?? 0;
  const setDone = !!cur && gameIdx >= total;
  const matchDone = !!match && setIdx >= sets.length - 1 && setDone;

  useEffect(() => { if (match && startWhenReady) { setStartWhenReady(false); setSetIdx(0); setGameIdx(0); setPlaying(true); } }, [match, startWhenReady]);
  useEffect(() => {
    if (!playing || !cur) return;
    if (gameIdx >= total) { setPlaying(false); return; }
    const t = setTimeout(() => setGameIdx((g) => g + 1), speed);
    return () => clearTimeout(t);
  }, [playing, gameIdx, total, speed, setIdx]);
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [onClose]);

  const count = (s: ViewerSet | undefined, n: number) => { let a = 0, b = 0; for (const w of (s?.gameWinners ?? []).slice(0, n)) { if (w === 'A') a += 1; else b += 1; } return [a, b]; };
  const [ga, gb] = count(cur, gameIdx);
  const log = useMemo(() => {
    if (!cur) return [];
    let a = 0, b = 0;
    return cur.gameWinners.slice(0, gameIdx).map((w, i) => {
      const server = cur.servers[i]; if (w === 'A') a += 1; else b += 1;
      const tb = i === 12;
      return { n: i + 1, server, winner: w, brk: !tb && server && server !== w, tb, score: `${a}-${b}` };
    }).reverse();
  }, [cur, gameIdx]);
  const start = async () => {
    if (pending && !match) { setStartWhenReady(true); await onCompute?.(); return; }
    if (setDone && !matchDone) { setSetIdx((i) => i + 1); setGameIdx(0); setPlaying(true); }
    else setPlaying(true);
  };
  const skip = async () => {
    if (pending && !match) { await onCompute?.(); setSetIdx(999); return; }
    setPlaying(false); setSetIdx(sets.length - 1); setGameIdx(sets.at(-1)?.gameWinners.length ?? 0);
  };
  useEffect(() => { if (match && setIdx >= 999) { setSetIdx(sets.length - 1); setGameIdx(sets.at(-1)?.gameWinners.length ?? 0); } }, [match, setIdx]);
  const name = (p: any) => p ? `${p.firstName} ${p.lastName}` : '—';
  const status = !match ? 'Ready' : matchDone ? (match.won ? 'You won' : 'You lost') : playing ? `Set ${setIdx + 1} in play` : setDone ? `End of set ${setIdx + 1}` : `Set ${setIdx + 1}`;

  return <div className="cs-modal" role="dialog" aria-modal="true">
    <div className="cs-modal-card wide cs-viewer">
      <header><div><small>{match?.event ?? ''} · {ROUND_NAME[match?.round ?? ''] ?? match?.round}{match?.qualifying ? ' (qualifying)' : ''}</small><h3>{status}</h3></div>{match && <SurfaceBadge surface={match.surface} />}<button className="cs-x" onClick={onClose} aria-label="Close">✕</button></header>
      <div className="cs-modal-body">
        <div className="cs-vw-board">
          <div className={`cs-vw-player ${matchDone ? (match!.won ? 'won' : 'lost') : ''}`}>{me?.id && <Portrait player={me} size="card" />}<strong>{name(me)}</strong><small>{me && <Flag code={me.country} />} No. {me?.ranking}</small></div>
          <div className="cs-vw-score">
            <table><thead><tr><th />{(sets.length ? sets : [0, 1, 2]).map((_, i) => <th key={i}>S{i + 1}</th>)}</tr></thead>
              <tbody>{[0, 1].map((side) => <tr key={side}><td>{side ? 'Opp' : 'You'}</td>{(sets.length ? sets : [0, 1, 2]).map((s: any, i) => {
                const shown = i < setIdx || (i === setIdx && match) ? count(s, i < setIdx ? s.gameWinners.length : gameIdx) : null;
                const fin = i < setIdx || (i === setIdx && setDone);
                const winA = fin && shown && shown[0] > shown[1];
                return <td key={i} className={`${i === setIdx && !matchDone && match ? 'now' : ''} ${fin ? ((side === 0) === winA ? 'w' : 'l') : ''}`}>{shown ? shown[side] : '·'}</td>;
              })}</tr>)}</tbody></table>
            {match && !matchDone && <div className="cs-vw-games"><b>{ga}</b><span>games</span><b>{gb}</b></div>}
            {matchDone && <div className="cs-vw-final"><strong>{match!.won ? 'Win' : 'Loss'} · {match!.score}</strong>{match!.minutes ? <small>{Math.floor(match!.minutes / 60)}h {match!.minutes % 60}m{match!.tags?.length ? ` · ${match!.tags.join(' · ')}` : ''}</small> : null}</div>}
          </div>
          <div className={`cs-vw-player ${matchDone ? (match!.won ? 'lost' : 'won') : ''}`}>{opp?.id && <Portrait player={opp} size="card" />}<strong>{name(opp)}</strong><small>{opp && <Flag code={opp.country} />} No. {opp?.ranking}</small></div>
        </div>
        {match && <ol className="cs-vw-log">{log.map((g) => <li key={g.n} className={`${g.winner === 'A' ? 'me' : 'opp'} ${g.brk ? 'brk' : ''}`}>
          <span>Game {g.n}</span><em>{g.tb ? 'Tie-break' : g.server === 'A' ? 'You serve' : 'They serve'}</em>
          <b>{g.tb ? (g.winner === 'A' ? 'You win the tie-break' : 'They win the tie-break') : g.brk ? (g.winner === 'A' ? 'Break! You broke' : 'Broken') : 'Hold'}</b><code>{g.score}</code>
        </li>)}{!log.length && <li className="muted">The first game is about to start.</li>}</ol>}
      </div>
      <footer>
        <label className="cs-speed">Speed <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>{SPEEDS.map(([l, v]) => <option key={v} value={v}>{l}</option>)}</select></label>
        {!matchDone && (playing ? <button className="cs-secondary" onClick={() => setPlaying(false)}>Pause</button>
          : <button className="cs-primary" disabled={busy} onClick={start}>{!match ? '▶ Start the match' : setDone ? `▶ Play set ${setIdx + 2}` : gameIdx ? '▶ Resume' : `▶ Play set ${setIdx + 1}`}</button>)}
        {!matchDone && <button className="cs-secondary" disabled={busy} onClick={skip}>Skip to result</button>}
        <button className="cs-secondary" onClick={onClose}>{matchDone ? 'Done' : 'Close'}</button>
      </footer>
    </div>
  </div>;
}
