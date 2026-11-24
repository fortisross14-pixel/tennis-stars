import React, { useEffect, useState } from 'react';
import PlayerPage from '../../pages/PlayerPage.jsx';
import TournamentDetailPage from '../../pages/TournamentDetailPage.jsx';
import MatchPage from '../../pages/MatchPage.jsx';
import RivalryPage from '../../pages/RivalryPage.jsx';
import { Flag } from '../../components/Common.jsx';
import { RankingsPage, TournamentsPage, CalendarPage, PlayersPage, JuniorsPage, DoublesPage, MagazinePage, RecordsPage, AlmanacPage, NationalTeamsPage } from '../../App.jsx';
import { careerOf, me, juniorRank } from '../engine';
import type { StaffKey, WeekPlan, PackTier } from '../types';
import { WeekPage, ReportCard } from './Week';
import { Overview } from './Overview';
import { CareerTab } from './CareerTab';
import { Improve } from './Improve';
import { MyEvent } from './MyEvent';
import { Schedule } from './Schedule';
import { MatchViewer } from './MatchViewer';
import { ArenaWeek } from './arena/ArenaWeek';
import { ArenaMatch } from './arena/ArenaMatch';
import * as SS from '../../sim/season.js';
const { liveState } = SS as any;
import { money, ordinalRank } from './common';

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
  const go = (page: string, ...parts: string[]) => { window.location.hash = `/${[page, ...parts].map((x) => encodeURIComponent(String(x))).join('/')}`; window.scrollTo({ top: 0 }); };
  const back = (fallback = 'week') => { if (window.history.length > 1) window.history.back(); else go(fallback); };
  return { route, go, back };
}

const NAV: [string, string][] = [['week', 'This week'], ['overview', 'Overview'], ['career', 'Career'], ['improve', 'Improvement'], ['world', 'World']];
const WORLD_TABS: [string, string][] = [['rankings', 'Rankings'], ['calendar', 'Calendar'], ['tournaments', 'Tournaments'], ['players', 'Players'], ['juniors', 'Juniors'], ['doubles', 'Doubles'], ['national', 'National teams'], ['news', 'News'], ['records', 'Records'], ['almanac', 'Almanac']];

function SeasonReview({ u, busy, a }: { u: any; busy: boolean; a: GameActions }) {
  const c = careerOf(u), p = me(u), s = c.seasons.at(-1);
  const d = c.decision;
  return <section className="cs-panel cs-season">
    <small>Season review</small><h2>{u.year} is over</h2>
    {s && <div className="cs-kpis wide">
      <div><span>Year-end ranking</span><strong>{ordinalRank(s.rankEnd < 999 ? s.rankEnd : null)}</strong><small>best {s.bestRank < 999 ? `No. ${s.bestRank}` : '—'}</small></div>
      <div><span>Win–loss</span><strong>{s.wins}–{s.losses}</strong></div>
      <div><span>Titles</span><strong>{s.titles}</strong><small>{s.titleNames.join(', ')}</small></div>
      <div><span>Prize money</span><strong>{money(s.prize)}</strong></div>
      <div><span>Best Slam</span><strong>{s.bestSlam ?? '—'}</strong></div>
      <div><span>Overall</span><strong>{s.rating}</strong><small>age {s.age}</small></div>
    </div>}
    {d ? <div className="cs-decision inline"><h3>{d.title}</h3><p>{d.text}</p><div className="cs-options">{d.options.map((o) => <button key={o.id} disabled={busy} onClick={() => a.decision(o.id)}><strong>{o.label}</strong><span>{o.desc}</span></button>)}</div></div>
      : <div className="cs-actions"><button className="cs-primary" disabled={busy} onClick={a.nextSeason}>{c.counters.retire ? 'Retire and see your legacy' : `Start the ${u.year + 1} season (age ${p.age + 1})`}</button>
        {!c.counters.retire && p.age >= 27 && <button className="cs-secondary" disabled={busy} onClick={() => { if (window.confirm('Retire at the end of this season?')) a.retireNow(); }}>Retire now</button>}</div>}
  </section>;
}

function Legacy({ u, a }: { u: any; a: GameActions }) {
  const c = careerOf(u), p = me(u), k = p.career;
  return <section className="cs-panel cs-legacy-end">
    <small>Career over</small><h2>{p.firstName} {p.lastName}</h2>
    <div className="cs-grade">{c.legacy?.grade}</div>
    <p>{k.titles} titles · {k.majors} Grand Slams · career high {k.peakRanking < 999 ? `No. ${k.peakRanking}` : '—'} · {money(c.totalPrize)} prize money · retired at {p.age}</p>
    <p className="cs-coins-earned">🪙 {c.coinsTotal} legacy coins earned in this career</p>
    <div className="cs-actions"><button className="cs-primary" onClick={a.exit}>Back to the menu</button></div>
    <p className="muted">You can keep browsing this world and your career pages.</p>
  </section>;
}

export function Game({ u, busy, notice, a }: { u: any; busy: boolean; notice: string; a: GameActions }) {
  const { route, go, back } = useRoute();
  const c = careerOf(u), p = me(u);
  const tour = c.tour;
  const [search, setSearch] = useState('');
  const [replay, setReplay] = useState<string | null>(null);
  const [arenaKey, setArenaKey] = useState(0);
  useEffect(() => { if (u.liveEvent && c.live && route.page === 'week') go('event'); if (u.liveEvent && c.live && route.page === 'preview' && route.parts[0] !== 'match') go('preview', 'match'); }, [!!u.liveEvent]);
  const onPlayer = (id: string) => go('player', id), onTournament = (key: string) => go('tournament', key), onMatch = (e: string, m: string) => go('match', e, m), onRivalry = (x: string, y: string) => go('rivalry', x, y);
  const canWatch = (id: string) => !!c.matchLog.find((m) => m.id === id)?.sets.length;
  const jr = juniorRank(u);
  const pg = route.page, sub = route.parts[0] ?? '';
  let page: React.ReactNode;
  if (pg === 'preview') {
    const exitPreview = () => go('week');
    if (route.parts[0] === 'match') {
      const cont = async () => {
        if (u.liveEvent && c.live) { const st = liveState(u, c.live.eventId); if (st?.exitRound?.[p.id] || st?.done) await a.finishEvent(); else await a.live('to-my-match'); setArenaKey((k) => k + 1); }
        else go('preview', 'week');
      };
      return <ArenaMatch key={arenaKey} u={u} busy={busy} onLive={a.live} onExit={exitPreview} onContinue={cont} recordId={route.parts[1]} />;
    }
    return <ArenaWeek u={u} busy={busy} onPlan={a.plan} onPlay={async () => { const before = c.matchLog.length; await a.play(); if (!u.liveEvent && careerOf(u).matchLog.length > before) go('preview', 'match'); }} onExit={exitPreview} />;
  }
  if (pg === 'week') {
    const weekTabs = <nav className="cs-subnav"><button className={sub !== 'schedule' ? 'active' : ''} onClick={() => go('week')}>This week</button><button className={sub === 'schedule' ? 'active' : ''} onClick={() => go('week', 'schedule')}>Schedule ahead</button></nav>;
    page = c.retired ? <Legacy u={u} a={a} /> : u.seasonEnded ? <div className="cs-page"><SeasonReview u={u} busy={busy} a={a} />{c.lastReport && <ReportCard r={c.lastReport} onWatch={setReplay} canWatch={canWatch} />}</div>
      : sub === 'schedule' ? <div className="cs-page">{weekTabs}<Schedule u={u} onSetPlan={a.setPlan} /></div>
      : <div className="cs-page">{weekTabs}<WeekPage u={u} busy={busy} onPlan={a.plan} onPlay={a.play} onAuto={a.auto} onDecision={a.decision} onToggleWatch={a.toggleWatch} onOpenEvent={() => go('event')} onWatch={setReplay} canWatch={canWatch} /></div>;
  }
  else if (pg === 'overview') page = <Overview u={u} onOpenTournament={onTournament} go={go} />;
  else if (pg === 'career') page = <CareerTab u={u} sub={sub} go={go} onWatch={setReplay} onPlayer={onPlayer} onTournament={onTournament} />;
  else if (pg === 'improve') page = <Improve u={u} sub={sub} go={go} busy={busy} a={a} onPlayer={onPlayer} />;
  else if (pg === 'event') page = <MyEvent u={u} busy={busy} onLive={a.live} onFinish={a.finishEvent} onPlayer={onPlayer} onPlayCard={a.playCard} onBack={() => go('week')} />;
  else if (pg === 'player') page = <PlayerPage universe={u} playerId={route.parts[0]} onBack={() => back('world')} onPlayer={onPlayer} onTournament={onTournament} onRivalry={onRivalry} isFollowed={(u.followedPlayerIds || []).includes(route.parts[0])} onToggleFollow={() => {}} />;
  else if (pg === 'tournament') { const [t, ...rest] = (route.parts[0] || '').split('|'); page = <TournamentDetailPage universe={u} tour={t || tour} name={rest.join('|')} onBack={() => back('world')} onPlayer={onPlayer} onMatch={onMatch} onLive={() => go('event')} onSimulate={null} />; }
  else if (pg === 'match') page = <MatchPage universe={u} editionId={route.parts[0]} matchId={route.parts[1]} onBack={() => back('world')} onPlayer={onPlayer} />;
  else if (pg === 'rivalry') page = <RivalryPage universe={u} playerAId={route.parts[0]} playerBId={route.parts[1]} onBack={() => back('world')} onPlayer={onPlayer} onMatch={onMatch} />;
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
    page = <div className="cs-page"><nav className="cs-subnav">{WORLD_TABS.map(([k, l]) => <button key={k} className={w === k ? 'active' : ''} onClick={() => go('world', k)}>{l}</button>)}
      {['rankings', 'players', 'juniors'].includes(w) && <label className="cs-subnav-search"><span>⌕</span><input placeholder="Search players" value={search} onChange={(e) => setSearch(e.target.value)} /></label>}</nav>{inner}</div>;
  }
  else page = <div className="cs-page"><p>Page not found.</p><button className="cs-secondary" onClick={() => go('week')}>Back</button></div>;
  const active = ['player', 'rivalry', 'match', 'tournament'].includes(pg) ? 'world' : pg === 'event' ? 'week' : pg;
  const rec = replay ? c.matchLog.find((m) => m.id === replay) : null;
  return <div className="app-shell cs-shell">
    <header className="top-shell">
      <div className="brand-row">
        <button className="brand" onClick={() => go('week')}><span>TS</span><div><strong>Tennis Stars</strong><small>{p.firstName} {p.lastName}</small></div></button>
        <div className="cs-top-stats">
          <span><Flag code={p.country} /> {p.age}y</span>
          <span><b>{ordinalRank(p.rankingPoints > 0 ? p.ranking : null)}</b>{jr != null && <em> · Jr {jr}</em>}</span>
          <span className={c.money < 0 ? 'neg' : ''}>{money(c.money)}</span>
          <span title="Fatigue">⚡ {Math.round(p.fatigue)}</span>
          {c.packs.length > 0 && <button className="cs-pill" onClick={() => go('improve', 'cards')}>🎁 {c.packs.length}</button>}
          {c.decision && !u.seasonEnded && <button className="cs-pill warn" onClick={() => go('week')}>❗ Decision</button>}
          {u.liveEvent && c.live && <button className="cs-pill live" onClick={() => go('event')}>● Live</button>}
        </div>
        <div className="season-chip"><span>{u.year}</span><strong>Week {u.week}</strong></div>
        <button className="save-icon cs-try-new" onClick={() => go('preview', 'week')} title="Preview of the new look">✨ New look</button>
        <button className="save-icon" onClick={a.exit}>Menu</button>
      </div>
      <nav className="main-nav cs-main-nav">{NAV.map(([k, l]) => <button key={k} className={active === k ? 'active' : ''} onClick={() => go(k)}>{l}</button>)}</nav>
      {(busy || notice) && <div className="cs-notice">{busy ? '⏳ ' : ''}{notice}</div>}
    </header>
    <main className="content-shell">{page}</main>
    {rec && <MatchViewer match={rec} me={p} opp={[...u.players[tour], ...u.juniors[tour], ...(u.retiredPlayers?.[tour] || [])].find((x: any) => x.id === rec.oppId) ?? { firstName: rec.oppName, lastName: '', country: rec.oppCountry, ranking: rec.oppRank }} onClose={() => setReplay(null)} />}
  </div>;
}
