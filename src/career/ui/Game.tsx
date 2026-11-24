import React, { useEffect, useRef, useState } from 'react';
import PlayerPage from '../../pages/PlayerPage.jsx';
import TournamentDetailPage from '../../pages/TournamentDetailPage.jsx';
import MatchPage from '../../pages/MatchPage.jsx';
import RivalryPage from '../../pages/RivalryPage.jsx';
import { portraitUrl } from '../../data/portraitLibrary.js';
import { RankingsPage, TournamentsPage, CalendarPage, PlayersPage, JuniorsPage, DoublesPage, MagazinePage, RecordsPage, AlmanacPage, NationalTeamsPage } from '../../App.jsx';
import { careerOf, me, juniorRank, overall } from '../engine';
import type { StaffKey, WeekPlan, PackTier } from '../types';
import { ReportCard } from './Week';
import { Overview } from './Overview';
import { CareerTab } from './CareerTab';
import { Improve } from './Improve';
import { Schedule } from './Schedule';
import { MatchViewer } from './MatchViewer';
import { ArenaWeek, monthOf } from './arena/ArenaWeek';
import { ArenaMatch } from './arena/ArenaMatch';
import { ArTabs, ArModal, Confetti, CountUp, Toast, haptic, installRipple } from './arena/kit';
import * as SS from '../../sim/season.js';
import { money, ordinalRank } from './common';
import './arena/arena.css';
import './arena/skin.css';

const { liveState } = SS as any;

export interface GameActions {
  plan: (p: WeekPlan) => void; play: () => Promise<void> | void; auto: (weeks: number) => void; decision: (id: string) => void;
  live: (mode: string, slot?: number | null) => Promise<void>; finishEvent: () => Promise<void> | void; toggleWatch: () => void;
  openPack: (i: number) => Promise<string[]>; mergePacks: (t: PackTier) => void; playCard: (uid: string) => void; sellCard: (uid: string) => void;
  staff: (k: StaffKey, lvl: number) => void; partner: (id: string | null) => void; setPlan: (week: number, plan: WeekPlan | null) => void;
  buyPack: (t: PackTier) => void; buyEquipment: (id: string) => void;
  nextSeason: () => void; retireNow: () => void; exit: () => void; save: () => void;
}

function parseRoute() { const raw = (window.location.hash || '#/week').replace(/^#\/?/, ''); const parts = raw.split('/').filter(Boolean).map(decodeURIComponent); return { page: parts[0] || 'week', parts: parts.slice(1) }; }
function useRoute() {
  const [route, setRoute] = useState(parseRoute);
  useEffect(() => { const h = () => setRoute(parseRoute()); window.addEventListener('hashchange', h); return () => window.removeEventListener('hashchange', h); }, []);
  const go = (page: string, ...parts: string[]) => { window.location.hash = `/${[page, ...parts].map((x) => encodeURIComponent(String(x))).join('/')}`; document.querySelector('.ar')?.scrollTo({ top: 0, behavior: 'smooth' }); };
  const back = (fallback = 'week') => { if (window.history.length > 1) window.history.back(); else go(fallback); };
  return { route, go, back };
}

const NAV: [string, string][] = [['week', 'This week'], ['overview', 'Overview'], ['career', 'Career'], ['improve', 'Improvement'], ['world', 'World']];
const WORLD_TABS: [string, string][] = [['rankings', 'Rankings'], ['calendar', 'Calendar'], ['tournaments', 'Tournaments'], ['players', 'Players'], ['juniors', 'Juniors'], ['doubles', 'Doubles'], ['national', 'Nations'], ['news', 'News'], ['records', 'Records'], ['almanac', 'Almanac']];

function SeasonReview({ u, busy, a }: { u: any; busy: boolean; a: GameActions }) {
  const c = careerOf(u), p = me(u), s = c.seasons.at(-1);
  const d = c.decision;
  const great = s && (s.titles > 0 || (s.rankEnd < (c.seasons.at(-2)?.rankEnd ?? 999)));
  return <div className="ar-season">
    {great && <Confetti count={60} />}
    <div className="ar-title-strip big"><small>Season review</small><h2>{u.year} is over</h2></div>
    {s && <div className="ar-statgrid ar-stagger">
      <div className="ar-stat"><span>Year-end ranking</span><strong>{s.rankEnd < 999 ? <>No. <CountUp value={s.rankEnd} /></> : '—'}</strong><small>best {s.bestRank < 999 ? `No. ${s.bestRank}` : '—'}</small></div>
      <div className="ar-stat"><span>Win–loss</span><strong><CountUp value={s.wins} />–<CountUp value={s.losses} /></strong></div>
      <div className="ar-stat"><span>Titles</span><strong><CountUp value={s.titles} /></strong><small>{s.titleNames.join(', ') || '—'}</small></div>
      <div className="ar-stat"><span>Prize money</span><strong><CountUp value={s.prize} format={money} /></strong></div>
      <div className="ar-stat"><span>Best Slam</span><strong>{s.bestSlam ?? '—'}</strong></div>
      <div className="ar-stat"><span>Overall</span><strong><CountUp value={s.rating} /></strong><small>age {s.age}</small></div>
    </div>}
    {d && <section className="ar-panel ar-pad ar-in-up"><h3 className="ar-h">{d.title}</h3><p className="ar-dim">{d.text}</p><div className="ar-choices">{d.options.map((o) => <button key={o.id} className="ar-choice" disabled={busy} onClick={() => a.decision(o.id)}><strong>{o.label}</strong><span>{o.desc}</span></button>)}</div></section>}
    {!d && <footer className="ar-foot">
      {!c.counters.retire && p.age >= 27 && <button className="ar-secondary" disabled={busy} onClick={() => { if (window.confirm('Retire at the end of this season?')) a.retireNow(); }}>Retire now</button>}
      <button className="ar-play" disabled={busy} onClick={() => { haptic(14); a.nextSeason(); }}><span className="ar-key">⏎</span>{c.counters.retire ? 'See your legacy' : `Start ${u.year + 1}`}</button>
    </footer>}
  </div>;
}

function Legacy({ u, a }: { u: any; a: GameActions }) {
  const c = careerOf(u), p = me(u), k = p.career;
  const g = c.legacy?.grade ?? 'D';
  return <div className="ar-season">
    {['S', 'A', 'B'].includes(g) && <Confetti count={g === 'S' ? 140 : 80} />}
    <div className="ar-title-strip big"><small>Career over</small><h2>{p.firstName} {p.lastName}</h2></div>
    <div className="ar-grade" data-grade={g}><span>Legacy grade</span><b>{g}</b></div>
    <div className="ar-statgrid ar-stagger">
      <div className="ar-stat"><span>Titles</span><strong><CountUp value={k.titles} /></strong></div>
      <div className="ar-stat"><span>Grand Slams</span><strong><CountUp value={k.majors} /></strong></div>
      <div className="ar-stat"><span>Career high</span><strong>{k.peakRanking < 999 ? `No. ${k.peakRanking}` : '—'}</strong></div>
      <div className="ar-stat"><span>Prize money</span><strong><CountUp value={c.totalPrize} format={money} /></strong></div>
      <div className="ar-stat"><span>Legacy coins</span><strong>🪙 <CountUp value={c.coinsTotal} /></strong></div>
      <div className="ar-stat"><span>Retired at</span><strong>{p.age}</strong></div>
    </div>
    <footer className="ar-foot"><button className="ar-play" onClick={a.exit}><span className="ar-key">⏎</span>Back to the menu</button></footer>
  </div>;
}

export function Game({ u, busy, notice, a }: { u: any; busy: boolean; notice: string; a: GameActions }) {
  const { route, go, back } = useRoute();
  const c = careerOf(u), p = me(u);
  const tour = c.tour;
  const [search, setSearch] = useState('');
  const [replay, setReplay] = useState<string | null>(null);
  const [arenaKey, setArenaKey] = useState(0);
  const lastNav = useRef(0);
  useEffect(() => { installRipple(); }, []);
  useEffect(() => { if (u.liveEvent && c.live && route.page === 'week') go('event'); }, [!!u.liveEvent]);
  const onPlayer = (id: string) => go('player', id), onTournament = (key: string) => go('tournament', key), onMatch = (e: string, m: string) => go('match', e, m), onRivalry = (x: string, y: string) => go('rivalry', x, y);
  const canWatch = (id: string) => !!c.matchLog.find((m) => m.id === id)?.sets.length;
  const jr = juniorRank(u);
  const pg = route.page, sub = route.parts[0] ?? '';
  const navIdx = NAV.findIndex(([k]) => k === pg);
  const dir = navIdx >= 0 ? (navIdx > lastNav.current ? 'fwd' : navIdx < lastNav.current ? 'back' : '') : '';
  useEffect(() => { if (navIdx >= 0) lastNav.current = navIdx; }, [navIdx]);

  let page: React.ReactNode;
  if (pg === 'week') {
    page = c.retired ? <Legacy u={u} a={a} /> : u.seasonEnded ? <SeasonReview u={u} busy={busy} a={a} />
      : sub === 'schedule' ? <div className="ar-skin ar-pad-page"><div className="ar-subbar flat"><button className="ar-secondary" onClick={() => go('week')}>‹ This week</button></div><Schedule u={u} onSetPlan={a.setPlan} /></div>
      : <>
        <ArenaWeek u={u} busy={busy} onPlan={a.plan} onAuto={a.auto} onExit={() => go('overview')} extraTabs={<button className="ar-pill-btn" onClick={() => go('week', 'schedule')}>🗓 Schedule ahead</button>}
          onPlay={async () => { const before = c.matchLog.length; await a.play(); if (!u.liveEvent && careerOf(u).matchLog.length > before) go('replay'); }} />
        {c.lastReport && <div className="ar-skin ar-pad-page ar-lastweek"><h3 className="ar-h">Last week</h3><ReportCard r={c.lastReport} onWatch={setReplay} canWatch={canWatch} /></div>}
      </>;
  }
  else if (pg === 'event' || pg === 'replay') {
    const queue = (c.lastReport?.matches || []).map((m) => m.matchId).filter((id): id is string => !!id && canWatch(id));
    const recordId = pg === 'replay' ? (sub || queue.find((id) => !c.watched[id]) || queue.at(-1)) : undefined;
    const cont = async () => {
      if (pg === 'replay') { if (recordId) c.watched[recordId] = true; const next = queue.find((id) => !c.watched[id] && id !== recordId); if (next && !sub) { setArenaKey((k) => k + 1); go('replay'); } else go('week'); return; }
      if (u.liveEvent && c.live) { const st = liveState(u, c.live.eventId); if (st?.exitRound?.[p.id] || st?.done) await a.finishEvent(); else await a.live('to-my-match'); setArenaKey((k) => k + 1); }
      else go('week');
    };
    page = <ArenaMatch key={`${arenaKey}-${sub}`} u={u} busy={busy} onLive={a.live} onExit={() => go('week')} onContinue={cont} recordId={recordId} onPlayer={onPlayer} />;
  }
  else if (pg === 'overview') page = <div className="ar-skin ar-pad-page"><Overview u={u} onOpenTournament={onTournament} go={go} /></div>;
  else if (pg === 'career') page = <div className="ar-skin ar-pad-page"><CareerTab u={u} sub={sub} go={go} onWatch={(id) => go('replay', id)} onPlayer={onPlayer} onTournament={onTournament} /></div>;
  else if (pg === 'improve') page = <div className="ar-skin ar-pad-page"><Improve u={u} sub={sub} go={go} busy={busy} a={a} onPlayer={onPlayer} /></div>;
  else if (pg === 'player') page = <div className="ar-skin ar-pad-page"><PlayerPage universe={u} playerId={route.parts[0]} onBack={() => back('world')} onPlayer={onPlayer} onTournament={onTournament} onRivalry={onRivalry} isFollowed={(u.followedPlayerIds || []).includes(route.parts[0])} onToggleFollow={() => {}} /></div>;
  else if (pg === 'tournament') { const [t, ...rest] = (route.parts[0] || '').split('|'); page = <div className="ar-skin ar-pad-page"><TournamentDetailPage universe={u} tour={t || tour} name={rest.join('|')} onBack={() => back('world')} onPlayer={onPlayer} onMatch={onMatch} onLive={() => go('event')} onSimulate={null} /></div>; }
  else if (pg === 'match') page = <div className="ar-skin ar-pad-page"><MatchPage universe={u} editionId={route.parts[0]} matchId={route.parts[1]} onBack={() => back('world')} onPlayer={onPlayer} /></div>;
  else if (pg === 'rivalry') page = <div className="ar-skin ar-pad-page"><RivalryPage universe={u} playerAId={route.parts[0]} playerBId={route.parts[1]} onBack={() => back('world')} onPlayer={onPlayer} onMatch={onMatch} /></div>;
  else if (pg === 'world') {
    const w = WORLD_TABS.some(([k]) => k === sub) ? sub : 'rankings';
    const inner = w === 'rankings' ? <RankingsPage universe={u} tour={tour} onPlayer={onPlayer} search={search} />
      : w === 'calendar' ? <CalendarPage universe={u} tour={tour} onTournament={onTournament} onPlayer={onPlayer} />
      : w === 'tournaments' ? <TournamentsPage universe={u} tour={tour} onTournament={onTournament} />
      : w === 'players' ? <PlayersPage universe={u} tour={tour} onPlayer={onPlayer} search={search} />
      : w === 'juniors' ? <JuniorsPage universe={u} tour={tour} onPlayer={onPlayer} onTournament={onTournament} search={search} />
      : w === 'doubles' ? <DoublesPage universe={u} tour={tour} onPlayer={onPlayer} onTournament={onTournament} />
      : w === 'national' ? <NationalTeamsPage universe={u} tour={tour} onPlayer={onPlayer} />
      : w === 'news' ? <MagazinePage universe={u} onPlayer={onPlayer} onRivalry={onRivalry} />
      : w === 'records' ? <RecordsPage universe={u} tour={tour} onPlayer={onPlayer} />
      : <AlmanacPage universe={u} onPlayer={onPlayer} onTournament={onTournament} />;
    page = <>
      <div className="ar-subbar"><ArTabs small tabs={WORLD_TABS as [string, string][]} value={w} onChange={(k) => go('world', k)} />
        {['rankings', 'players', 'juniors'].includes(w) && <label className="ar-search"><span>⌕</span><input placeholder="Search players" value={search} onChange={(e) => setSearch(e.target.value)} /></label>}</div>
      <div className="ar-skin ar-pad-page" key={w}>{inner}</div>
    </>;
  }
  else page = <div className="ar-pad-page"><div className="ar-panel ar-empty">Page not found. <button className="ar-secondary" onClick={() => go('week')}>Back</button></div></div>;

  const active = ['player', 'rivalry', 'match', 'tournament'].includes(pg) ? 'world' : ['event', 'replay'].includes(pg) ? 'week' : pg;
  const rec = replay ? c.matchLog.find((m) => m.id === replay) : null;
  const decisionOpen = c.decision && !u.seasonEnded && !c.retired;
  return <div className="ar" role="application">
    <header className="ar-shell-top">
      <button className="ar-brand" onClick={() => go('week')}><i>TS</i><span><b>Tennis Stars</b><small>{p.firstName} {p.lastName}</small></span></button>
      <ArTabs tabs={NAV} value={active as string} onChange={(k) => go(k)} badge={{ improve: c.packs.length || undefined } as any} />
      <div className="ar-shell-stats">
        {u.liveEvent && c.live && pg !== 'event' && <button className="ar-pill-btn live" onClick={() => go('event')}>● Live</button>}
        {busy && <span className="ar-pill-btn"><i className="ar-spin" /> {notice || 'Working…'}</span>}
        <span className="ar-chip">💰 <b><CountUp value={c.money} format={money} /></b></span>
        <span className="ar-chip mint">{monthOf(u.week)} <em>| {u.year}</em></span>
        <button className="ar-avatar ar-tap" onClick={() => go('overview')} title={`${ordinalRank(p.rankingPoints > 0 ? p.ranking : null)}${jr != null ? ` · junior No. ${jr}` : ''}`}><img src={portraitUrl(p)} alt="" /><span>{overall(p)}</span></button>
        <button className="ar-exit" onClick={a.exit}>Menu</button>
      </div>
    </header>
    <main className={`ar-content ${dir}`} key={`${pg}/${pg === 'world' ? '' : sub}`}>{page}</main>
    {decisionOpen && <ArModal kicker="Decision" title={c.decision!.title}>
      <p>{c.decision!.text}</p>
      <div className="ar-choices">{c.decision!.options.map((o) => <button key={o.id} className="ar-choice" disabled={busy} onClick={() => { haptic(); a.decision(o.id); }}><strong>{o.label}</strong><span>{o.desc}</span></button>)}</div>
    </ArModal>}
    {rec && <div className="ar-skin"><MatchViewer match={rec} me={p} opp={[...u.players[tour], ...u.juniors[tour], ...(u.retiredPlayers?.[tour] || [])].find((x: any) => x.id === rec.oppId) ?? { firstName: rec.oppName, lastName: '', country: rec.oppCountry, ranking: rec.oppRank }} onClose={() => setReplay(null)} /></div>}
    {!busy && <Toast text={notice} />}
  </div>;
}
