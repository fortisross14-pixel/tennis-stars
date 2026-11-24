import React, { useEffect, useState } from 'react';
import PlayerPage from '../../pages/PlayerPage.jsx';
import TournamentDetailPage from '../../pages/TournamentDetailPage.jsx';
import MatchPage from '../../pages/MatchPage.jsx';
import RivalryPage from '../../pages/RivalryPage.jsx';
import { Flag } from '../../components/Common.jsx';
import { RankingsPage, TournamentsPage, CalendarPage, PlayersPage, JuniorsPage, DoublesPage, MagazinePage, RecordsPage, AlmanacPage, NationalTeamsPage } from '../../App.jsx';
import { careerOf, me, juniorRank } from '../engine';
import type { StaffKey, WeekPlan, PackTier } from '../types';
import { Hub, ReportCard } from './Hub';
import { MyEvent } from './MyEvent';
import { Cards } from './Cards';
import { Team } from './Team';
import { Schedule } from './Schedule';
import { History } from './History';
import { money, ordinalRank } from './common';

export interface GameActions {
  plan: (p: WeekPlan) => void; play: () => void; auto: (weeks: number) => void; decision: (id: string) => void;
  live: (mode: string, slot?: number | null) => Promise<void>; finishEvent: () => void; toggleWatch: () => void;
  openPack: (i: number) => Promise<string[]>; mergePacks: (t: PackTier) => void; playCard: (uid: string) => void; sellCard: (uid: string) => void;
  staff: (k: StaffKey, lvl: number) => void; partner: (id: string | null) => void; setPlan: (week: number, plan: WeekPlan | null) => void;
  nextSeason: () => void; exit: () => void; save: () => void;
}

function parseRoute() { const raw = (window.location.hash || '#/career').replace(/^#\/?/, ''); const parts = raw.split('/').filter(Boolean).map(decodeURIComponent); return { page: parts[0] || 'career', parts: parts.slice(1) }; }
function useRoute() {
  const [route, setRoute] = useState(parseRoute);
  useEffect(() => { const h = () => setRoute(parseRoute()); window.addEventListener('hashchange', h); return () => window.removeEventListener('hashchange', h); }, []);
  const go = (page: string, ...parts: string[]) => { window.location.hash = `/${[page, ...parts].map((x) => encodeURIComponent(String(x))).join('/')}`; window.scrollTo({ top: 0 }); };
  const back = (fallback = 'career') => { if (window.history.length > 1) window.history.back(); else go(fallback); };
  return { route, go, back };
}

const NAV: [string, string][] = [['career', 'This week'], ['schedule', 'Schedule'], ['cards', 'Cards'], ['team', 'Team'], ['history', 'Career'], ['me', 'Profile'], ['rankings', 'Rankings'], ['calendar', 'Calendar'], ['tournaments', 'Tournaments'], ['players', 'Players'], ['juniors', 'Juniors'], ['doubles', 'Doubles'], ['magazine', 'News'], ['records', 'Records'], ['almanac', 'Almanac']];

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
        {!c.counters.retire && p.age >= 27 && <button className="cs-secondary" disabled={busy} onClick={() => { if (window.confirm('Retire at the end of this season?')) { c.counters.retire = 1; a.nextSeason(); } }}>Retire now</button>}</div>}
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
    <p className="muted">You can keep browsing this world: rankings, records and your profile stay as they are.</p>
  </section>;
}

export function Game({ u, busy, notice, a }: { u: any; busy: boolean; notice: string; a: GameActions }) {
  const { route, go, back } = useRoute();
  const c = careerOf(u), p = me(u);
  const tour = c.tour;
  const [search, setSearch] = useState('');
  useEffect(() => { if (u.liveEvent && c.live && route.page === 'career') go('event'); }, [!!u.liveEvent]);
  const onPlayer = (id: string) => go('player', id), onTournament = (key: string) => go('tournament', key), onMatch = (e: string, m: string) => go('match', e, m), onRivalry = (x: string, y: string) => go('rivalry', x, y);
  const jr = juniorRank(u);
  let page: React.ReactNode;
  const pg = route.page;
  if (pg === 'career') page = c.retired ? <Legacy u={u} a={a} /> : u.seasonEnded ? <><SeasonReview u={u} busy={busy} a={a} />{c.lastReport && <ReportCard r={c.lastReport} />}</> :
    <Hub u={u} busy={busy} onPlan={a.plan} onPlay={a.play} onAuto={a.auto} onDecision={a.decision} onMe={() => onPlayer(p.id)} onToggleWatch={a.toggleWatch} onOpenEvent={() => go('event')} />;
  else if (pg === 'event') page = <MyEvent u={u} busy={busy} onLive={a.live} onFinish={a.finishEvent} onPlayer={onPlayer} onPlayCard={a.playCard} onBack={() => go('career')} />;
  else if (pg === 'cards') page = <Cards u={u} busy={busy} onOpen={a.openPack} onMerge={a.mergePacks} onPlay={a.playCard} onSell={a.sellCard} />;
  else if (pg === 'team') page = <Team u={u} busy={busy} onStaff={a.staff} onPartner={a.partner} onPlayer={onPlayer} />;
  else if (pg === 'schedule') page = <Schedule u={u} onSetPlan={a.setPlan} />;
  else if (pg === 'history') page = <History u={u} />;
  else if (pg === 'me') page = <PlayerPage universe={u} playerId={p.id} onBack={() => back()} onPlayer={onPlayer} onTournament={onTournament} onRivalry={onRivalry} isFollowed onToggleFollow={() => {}} />;
  else if (pg === 'player') page = <PlayerPage universe={u} playerId={route.parts[0]} onBack={() => back('rankings')} onPlayer={onPlayer} onTournament={onTournament} onRivalry={onRivalry} isFollowed={(u.followedPlayerIds || []).includes(route.parts[0])} onToggleFollow={() => {}} />;
  else if (pg === 'tournament') { const [t, ...rest] = (route.parts[0] || '').split('|'); page = <TournamentDetailPage universe={u} tour={t || tour} name={rest.join('|')} onBack={() => back('tournaments')} onPlayer={onPlayer} onMatch={onMatch} onLive={() => go('event')} onSimulate={null} />; }
  else if (pg === 'match') page = <MatchPage universe={u} editionId={route.parts[0]} matchId={route.parts[1]} onBack={() => back('tournaments')} onPlayer={onPlayer} />;
  else if (pg === 'rivalry') page = <RivalryPage universe={u} playerAId={route.parts[0]} playerBId={route.parts[1]} onBack={() => back('records')} onPlayer={onPlayer} onMatch={onMatch} />;
  else if (pg === 'rankings') page = <RankingsPage universe={u} tour={tour} onPlayer={onPlayer} search={search} />;
  else if (pg === 'calendar') page = <CalendarPage universe={u} tour={tour} onTournament={onTournament} onPlayer={onPlayer} />;
  else if (pg === 'tournaments') page = <TournamentsPage universe={u} tour={tour} onTournament={onTournament} />;
  else if (pg === 'players') page = <PlayersPage universe={u} tour={tour} onPlayer={onPlayer} search={search} />;
  else if (pg === 'juniors') page = <JuniorsPage universe={u} tour={tour} onPlayer={onPlayer} onTournament={onTournament} search={search} />;
  else if (pg === 'doubles') page = <DoublesPage universe={u} tour={tour} onPlayer={onPlayer} onTournament={onTournament} />;
  else if (pg === 'national') page = <NationalTeamsPage universe={u} tour={tour} onPlayer={onPlayer} />;
  else if (pg === 'magazine') page = <MagazinePage universe={u} onPlayer={onPlayer} onRivalry={onRivalry} />;
  else if (pg === 'records') page = <RecordsPage universe={u} tour={tour} onPlayer={onPlayer} />;
  else if (pg === 'almanac') page = <AlmanacPage universe={u} onPlayer={onPlayer} onTournament={onTournament} />;
  else page = <div className="cs-page"><p>Page not found.</p></div>;
  const active = pg === 'player' && route.parts[0] === p.id ? 'me' : ['player', 'rivalry', 'match'].includes(pg) ? 'players' : pg === 'tournament' ? 'tournaments' : pg;
  return <div className="app-shell cs-shell">
    <header className="top-shell">
      <div className="brand-row">
        <button className="brand" onClick={() => go('career')}><span>TS</span><div><strong>Tennis Stars</strong><small>{p.firstName} {p.lastName}</small></div></button>
        <div className="cs-top-stats">
          <span><Flag code={p.country} /> {p.age}y</span>
          <span><b>{ordinalRank(p.rankingPoints > 0 ? p.ranking : null)}</b>{jr != null && <em> · Jr {jr}</em>}</span>
          <span className={c.money < 0 ? 'neg' : ''}>{money(c.money)}</span>
          <span title="Fatigue">⚡ {Math.round(p.fatigue)}</span>
          {c.packs.length > 0 && <button className="cs-pill" onClick={() => go('cards')}>🎁 {c.packs.length}</button>}
          {c.decision && !u.seasonEnded && <button className="cs-pill warn" onClick={() => go('career')}>❗ Decision</button>}
          {u.liveEvent && c.live && <button className="cs-pill live" onClick={() => go('event')}>● Live</button>}
        </div>
        <div className="season-chip"><span>{u.year}</span><strong>Week {u.week}</strong></div>
        <label className="global-search"><span>⌕</span><input placeholder="Search players" value={search} onChange={(e) => setSearch(e.target.value)} /></label>
        <button className="save-icon" onClick={a.exit}>Menu</button>
      </div>
      <nav className="main-nav">{NAV.map(([k, l]) => <button key={k} className={active === k ? 'active' : ''} onClick={() => go(k)}>{l}</button>)}</nav>
      {(busy || notice) && <div className="cs-notice">{busy ? '⏳ ' : ''}{notice}</div>}
    </header>
    <main className="content-shell">{page}</main>
  </div>;
}
