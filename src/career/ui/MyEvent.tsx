import React, { useState } from 'react';
import Portrait from '../../components/Portrait.jsx';
import { Flag, SurfaceBadge } from '../../components/Common.jsx';
import { Bracket } from '../../pages/LiveEventPage.jsx';
import { MatchViewer, type ViewerMatch } from './MatchViewer';
import * as S from '../../sim/season.js';
import * as RV from '../../sim/rivalries.js';
import { careerOf, me, myPendingSlot, canPlay, orientSets } from '../engine';
import { CARD_MAP } from '../cards';
import { ROUND_NAME } from '../data';
import { ReportCard } from './Week';
import { levelLabel } from './common';

const { liveState } = S as any;
const { rivalryForPair } = RV as any;

export function MyEvent({ u, busy, onLive, onFinish, onPlayer, onPlayCard, onBack }: {
  u: any; busy: boolean; onLive: (mode: string, slot?: number | null) => Promise<void>; onFinish: () => void; onPlayer: (id: string) => void; onPlayCard: (uid: string) => void; onBack: () => void;
}) {
  const c = careerOf(u), p = me(u);
  const [watch, setWatch] = useState<{ round: string; eventId: string; oppId: string; slot: number } | null>(null);
  const flip = (sc: string) => sc.split(' ').map((x) => x.split('-').reverse().join('-')).join(' ');
  const findMatch = (eventId: string, round: string): ViewerMatch | null => {
    const st0 = liveState(u, eventId);
    const ed = (u.tournamentEditions || []).find((e: any) => e.id === eventId);
    const list = st0?.matches ?? ed?.matches ?? [];
    const m = list.find((x: any) => x.round === round && (x.playerA === p.id || x.playerB === p.id));
    if (!m) return null;
    const ev = u.calendar.find((e: any) => e.id === eventId);
    const won = m.winnerId === p.id;
    return { sets: orientSets(m, p.id), won, score: won ? m.score : flip(m.score), event: ev?.name ?? '', round, surface: ev?.surface ?? '', minutes: m.durationMinutes, tags: m.tags };
  };
  const player = watch && <MatchViewer match={findMatch(watch.eventId, watch.round)} me={p} opp={[...u.players[c.tour], ...u.juniors[c.tour]].find((x: any) => x.id === watch.oppId)} pending busy={busy}
    onCompute={async () => { if (!findMatch(watch.eventId, watch.round)) await onLive('slot', watch.slot); }} onClose={() => setWatch(null)} />;
  if (!u.liveEvent || !c.live) {
    return <div className="cs-page"><section className="cs-panel"><h2>Tournament complete</h2><p className="muted">The week has closed.</p><button className="cs-primary" onClick={onBack}>Back to your week</button></section>{c.lastReport && <ReportCard r={c.lastReport} />}{player}</div>;
  }
  const st = liveState(u, c.live.eventId);
  const event = u.calendar.find((e: any) => e.id === c.live!.eventId);
  // out as soon as you lose, even while the rest of the round is still being played
  const alive = st && !st.done && st.alive.includes(p.id) && !st.exitRound?.[p.id];
  const round = st?.rounds?.[st.roundIndex];
  const mySlot = st ? myPendingSlot(st, p.id) : null;
  const oppId = mySlot != null ? st.alive[mySlot * 2] === p.id ? st.alive[mySlot * 2 + 1] : st.alive[mySlot * 2] : null;
  const opp = oppId ? [...u.players[c.tour], ...u.juniors[c.tour]].find((x: any) => x.id === oppId) : null;
  const othersPending = st ? st.slots.filter((s: any, i: number) => !s && i !== mySlot).length : 0;
  const lostRound = st?.exitRound?.[p.id];
  const h2h = opp ? rivalryForPair(u, p.id, opp.id) : null;
  const myWins = h2h ? (h2h.playerAId === p.id ? h2h.winsA : h2h.winsB) : 0, oppWins = h2h ? (h2h.playerAId === p.id ? h2h.winsB : h2h.winsA) : 0;
  const entryType = st?.entryMeta?.find((m: any) => m.id === p.id)?.type;
  const seed = st?.seedRanks?.[p.id];
  const boosts = c.hand.filter((h) => CARD_MAP[h.id]?.kind === 'boost' || (CARD_MAP[h.id]?.kind === 'recovery' && !CARD_MAP[h.id]?.heal));
  const myMatches = (st?.matches || []).filter((m: any) => m.playerA === p.id || m.playerB === p.id);

  return <div className="cs-page cs-myevent">
    <header className="cs-event-head">
      <div><small>{levelLabel(event.level, c.tour)} · week {event.week} · {event.location}</small><h2>{event.name}</h2><p><Flag code={event.country} /> <SurfaceBadge surface={event.surface} /> {entryType && <span className="cs-tag">{entryType}{seed ? ` · seed ${seed}` : ''}</span>}</p></div>
      <div className="cs-event-status">{alive ? <><span>Still in</span><strong>{ROUND_NAME[round] ?? round}</strong></> : <><span>Out in</span><strong>{ROUND_NAME[lostRound] ?? lostRound ?? '—'}</strong></>}</div>
    </header>

    {alive && <section className="cs-panel cs-next">
      {mySlot != null && opp ? <>
        <h3>{ROUND_NAME[round] ?? round}: your next opponent</h3>
        <div className="cs-duel">
          <button onClick={() => onPlayer(p.id)}><Portrait player={p} size="card" /><strong>{p.firstName} {p.lastName}</strong><small>No. {p.ranking} · {p.style}</small></button>
          <div className="cs-vs"><span>vs</span><b>{myWins}–{oppWins}</b><small>head-to-head</small></div>
          <button onClick={() => onPlayer(opp.id)}><Portrait player={opp} size="card" /><strong>{opp.firstName} {opp.lastName}</strong><small><Flag code={opp.country} /> No. {opp.ranking} · {opp.style} · {opp.age}y</small><small>Prefers {opp.preferredSurface} · fatigue {Math.round(opp.fatigue)}</small></button>
        </div>
        <div className="cs-actions">
          {othersPending > 0 && <button className="cs-secondary" disabled={busy} onClick={() => onLive('to-my-match')}>Play the other matches first ({othersPending})</button>}
          <button className="cs-primary" disabled={busy} onClick={() => setWatch({ slot: mySlot, round, oppId: opp.id, eventId: c.live!.eventId })}>▶ Play your match</button>
          <button className="cs-secondary" disabled={busy} onClick={() => onLive('slot', mySlot)}>Simulate it</button>
        </div>
        {boosts.length > 0 && c.cardPlays > 0 && <div className="cs-quickcards"><small>Play a card before the match ({c.cardPlays} plays):</small>{boosts.map((h) => { const d = CARD_MAP[h.id]; const err = canPlay(u, h.uid); return <button key={h.uid} disabled={!!err || busy} title={err ?? d.desc} onClick={() => onPlayCard(h.uid)}>{d.icon} {d.name}</button>; })}</div>}
      </> : <>
        <h3>You won your {ROUND_NAME[st.rounds[st.roundIndex - 1]] ?? 'match'}!</h3>
        <p className="muted">The rest of the round still has to be played.</p>
        <div className="cs-actions"><button className="cs-primary" disabled={busy} onClick={() => onLive('to-my-match')}>Continue to your next match</button></div>
      </>}
    </section>}
    {!alive && <section className="cs-panel cs-next"><h3>{st?.done ? 'The tournament is over' : 'Your tournament is over'}</h3><p className="muted">Finish the event to close the week: rankings, prize money and training update.</p><div className="cs-actions"><button className="cs-primary" disabled={busy} onClick={onFinish}>Finish the tournament</button></div></section>}

    {myMatches.length > 0 && <section className="cs-panel"><h3>Your matches</h3><ul className="cs-matches">{myMatches.map((m: any) => { const won = m.winnerId === p.id; const o = [...u.players[c.tour], ...u.juniors[c.tour]].find((x: any) => x.id === (won ? m.loserId : m.winnerId)); return <li key={m.id} className={won ? 'won' : 'lost'}><b>{won ? 'W' : 'L'}</b><span>{ROUND_NAME[m.round] ?? m.round}</span><em>{o ? `${o.firstName} ${o.lastName} (${o.ranking})` : ''}</em><code>{won ? m.score : m.score.split(' ').map((x: string) => x.split('-').reverse().join('-')).join(' ')}</code></li>; })}</ul></section>}

    {st && <section className="cs-panel"><h3>Draw</h3><Bracket universe={u} state={st} onPlayer={onPlayer} /></section>}

    {player}
  </div>;
}
