import React,{useEffect,useMemo,useState} from 'react';
import Portrait from '../components/Portrait.jsx';
import { EmptyState,Flag,SectionTitle,SurfaceBadge } from '../components/Common.jsx';
import { FormChip } from '../components/Narrative.jsx';
import { coverageModeForEvent } from '../data/showcase.js';
import { findPlayer,tournamentKey } from '../sim/selectors.js';
import { fullName } from '../sim/generation.js';
import { rivalryForPair } from '../sim/rivalries.js';
import { replaceCalendarYears,universeWeekLabel } from '../utils/year.js';

// ---------------------------------------------------------------------------
// Live big-tournament screen (v0.9)
//   * The event owns its controls: watch/simulate match, round, skip, finish.
//   * Nothing is decided until it is played here.
//   * When every draw is done, the same route shows the champions screen.
// ---------------------------------------------------------------------------
const ROUND_LABEL={R128:'First round',R64:'Second round',R32:'Third round',R16:'Fourth round',QF:'Quarterfinals',SF:'Semifinals',F:'Final'};
const ROUND_SHORT={R128:'R128',R64:'R64',R32:'R32',R16:'R16',QF:'QF',SF:'SF',F:'Final'};
const GAME_MS=230;

function eventTitle(event){
  if(!event)return '';
  if(event.level==='Team')return event.tour==='ATP'?'Davis Cup':'Billie Jean King Cup';
  const who=event.tour==='ATP'?'Men’s':'Women’s';
  return `${who} singles`;
}
function featuredRounds(universe,event){const mode=coverageModeForEvent(universe,event);return mode==='semifinals'?new Set(['SF','F']):mode==='final'?new Set(['F']):new Set();}
function roundLabel(state,round){if(state.kind==='team'&&round==='R16')return 'First round';return ROUND_LABEL[round]||round;}

function pairsForRound(state,r){
  const alive=r<state.roundIndex?state.roundHistory?.[r]?.alive:r===state.roundIndex?state.alive:null;
  if(!alive)return null;
  const pairs=[];for(let i=0;i<alive.length;i+=2)pairs.push([alive[i],alive[i+1]]);return pairs;
}
function matchForPair(state,round,a,b,slot){
  if(state.kind==='team')return state.matches.find(t=>t.round===round&&t.slot===slot)||null;
  return state.matches.find(m=>m.round===round&&((m.playerA===a&&m.playerB===b)||(m.playerA===b&&m.playerB===a)))||null;
}
function liveOrArchived(universe,eventId){
  const st=universe.liveEvent?.states?.find(s=>s.eventId===eventId);
  if(st)return st;
  const ed=(universe.tournamentEditions||[]).find(e=>e.id===eventId);
  return ed?{matches:ed.matches||[],done:true,archived:true}:null;
}
function seedOf(state,id){return state.seedRanks?.[id]||null;}
function entryTag(state,id){const t=state.entryMeta?.find(m=>m.id===id)?.type;return t==='Qualifier'?'Q':t==='Wild card'?'WC':t==='Junior exemption'?'JE':null;}

function PlayerLine({universe,state,id,winnerId,score,onPlayer,align='left'}){
  const p=findPlayer(universe,id);if(!p)return <span className="lv-tbd">TBD</span>;
  const seed=seedOf(state,id),tag=entryTag(state,id);
  const cls=(winnerId?(winnerId===id?'lv-line won':'lv-line lost'):'lv-line')+(p.controlled?' me':'');
  return <button className={`${cls} ${align}`} onClick={()=>onPlayer?.(id)}><Flag code={p.country}/><span className="lv-name">{fullName(p)}</span>{seed&&<em className="lv-seed">[{seed}]</em>}{tag&&<em className="lv-tag">{tag}</em>}{score&&<b>{score}</b>}</button>;
}
function TeamLine({country,winner}){return <span className={`lv-line ${winner?(winner===country?'won':'lost'):''}`}><Flag code={country}/><span className="lv-name">{country}</span></span>;}

// --- Match player -------------------------------------------------------------
export function MatchPlayer({universe,eventId,slot,round,a,b,kind,onAction,onClose,onNext,onPlayer,busy}){
  const event=universe.calendar.find(e=>e.id===eventId);
  const source=liveOrArchived(universe,eventId);
  const match=source?matchForPair({...source,kind},round,a,b,slot):null;
  const [setIdx,setSetIdx]=useState(0),[gameIdx,setGameIdx]=useState(0),[playing,setPlaying]=useState(false),[pendingAction,setPendingAction]=useState(null);
  const details=match?.setDetails||[];const detail=details[setIdx];const gameCount=detail?.gameWinners?.length||0;
  const setDone=!!detail&&gameIdx>=gameCount;const matchDone=!!match&&setIdx>=details.length-1&&setDone;
  // After the match is computed, run the action the user asked for.
  useEffect(()=>{if(!match||!pendingAction)return;if(pendingAction==='result'){setSetIdx(Math.max(0,details.length-1));setGameIdx(details.at(-1)?.gameWinners?.length||0);}else{setSetIdx(0);setGameIdx(0);setPlaying(true);}setPendingAction(null);},[match?.id,pendingAction]);
  useEffect(()=>{if(!playing)return;const t=setInterval(()=>setGameIdx(v=>{if(v+1>=gameCount){setPlaying(false);return gameCount;}return v+1;}),GAME_MS);return()=>clearInterval(t);},[playing,gameCount,setIdx]);
  useEffect(()=>{const onKey=e=>{if(e.key==='Escape')onClose();};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);},[onClose]);
  const compute=async action=>{setPendingAction(action);await onAction(eventId,'slot',slot);};
  const playNextSet=()=>{if(!match){compute('play');return;}if(setDone&&!matchDone){setSetIdx(v=>v+1);setGameIdx(0);setPlaying(true);}else if(!setDone)setPlaying(true);};
  const showResult=()=>{if(!match){compute('result');return;}setPlaying(false);setSetIdx(details.length-1);setGameIdx(details.at(-1)?.gameWinners?.length||0);};
  if(kind==='team')return <TieModal universe={universe} event={event} tie={match} round={round} a={a} b={b} onCompute={()=>compute('result')} onClose={onClose} onNext={onNext} onPlayer={onPlayer} busy={busy}/>;
  const A=findPlayer(universe,a),B=findPlayer(universe,b);
  const h2h=rivalryForPair(universe,a,b);const h2hA=h2h?(h2h.playerAId===a?h2h.winsA:h2h.winsB):0,h2hB=h2h?(h2h.playerAId===a?h2h.winsB:h2h.winsA):0;
  // Orient set details to A/B of this modal (match.playerA may be either).
  const flip=match&&match.playerA!==a;
  const games=(d,count)=>{let x=0,y=0;for(const w of (d?.gameWinners||[]).slice(0,count)){if(w==='A')x+=1;else y+=1;}return flip?[y,x]:[x,y];};
  const [gA,gB]=games(detail,gameIdx);
  const finalSets=details.map((d,i)=>i<setIdx||(i===setIdx&&setDone)?games(d,d.gameWinners.length):null);
  const winnerId=matchDone?match.winnerId:null;
  const recentGames=(detail?.gameWinners||[]).slice(0,gameIdx).map((w,i)=>{const server=detail.servers?.[i];const brk=server&&server!==w;const side=flip?(w==='A'?'B':'A'):w;return {side,brk};});
  return <div className="lv-modal" role="dialog" aria-modal="true" aria-label="Match player">
    <div className="lv-modal-card">
      <header><div><span>{event?.name} · {ROUND_LABEL[round]||round}</span><strong>{match?matchDone?'Match complete':playing?`Set ${setIdx+1} in progress`:`Set ${setIdx+1}${setDone?' complete':''}`:'Ready to play'}</strong></div><SurfaceBadge surface={event?.surface}/><button className="lv-close" onClick={onClose} aria-label="Close">✕</button></header>
      <div className="lv-duel">
        {[A,B].map((p,i)=>p&&<button key={p.id} className={`lv-duelist ${winnerId?(winnerId===p.id?'won':'lost'):''}`} onClick={()=>onPlayer?.(p.id)}><Portrait player={p} size="profile"/><span><Flag code={p.country}/><strong>{fullName(p)}</strong><small>World No. {p.ranking}{seedOf(liveOrArchived(universe,eventId)||{},p.id)?` · Seed ${seedOf(liveOrArchived(universe,eventId),p.id)}`:''}</small><FormChip player={p}/></span></button>)}
        <div className="lv-scoreboard">
          <div className="lv-sets">{(details.length?details:[0,1,2]).map((_,i)=><div key={i} className={i===setIdx&&match&&!matchDone?'active':''}><small>S{i+1}</small><b>{finalSets[i]?finalSets[i][0]:i===setIdx&&match?gA:'·'}</b><b>{finalSets[i]?finalSets[i][1]:i===setIdx&&match?gB:'·'}</b></div>)}</div>
          {match&&!matchDone&&<div className="lv-current"><span>{gA}</span><small>games</small><span>{gB}</span></div>}
          {match&&<div className="lv-games">{recentGames.map((g,i)=><i key={i} className={`g-${g.side}${g.brk?' brk':''}`} title={g.brk?'Break of serve':'Hold'}/>)}</div>}
          {matchDone&&<div className="lv-final"><strong>{fullName(findPlayer(universe,match.winnerId))}</strong><span>wins {match.score}</span><small>{Math.floor(match.durationMinutes/60)}h {match.durationMinutes%60}m{match.tags?.length?` · ${match.tags.join(' · ')}`:''}</small></div>}
          {!match&&<div className="lv-preview"><span>Head-to-head</span><strong>{h2hA}–{h2hB}</strong>{h2h?.ignitedAt&&<small>🔥 Rivalry</small>}</div>}
        </div>
      </div>
      <footer>
        {!matchDone&&<button className="lv-primary" disabled={busy||playing} onClick={playNextSet}>{!match?'▶ Play first set':playing?'Playing…':setDone?'▶ Play next set':'▶ Resume set'}</button>}
        {!matchDone&&<button className="secondary" disabled={busy} onClick={showResult}>Show result</button>}
        {matchDone&&onNext&&<button className="lv-primary" onClick={onNext}>Next match ▶</button>}
        <button className="secondary" onClick={onClose}>{matchDone?'Back to draw':'Close'}</button>
      </footer>
    </div>
  </div>;
}

function TieModal({universe,event,tie,round,a,b,onCompute,onClose,onNext,onPlayer,busy}){
  return <div className="lv-modal" role="dialog" aria-modal="true"><div className="lv-modal-card">
    <header><div><span>{eventTitle(event)} · {round==='R16'?'First round':ROUND_LABEL[round]||round}</span><strong><Flag code={a}/> {a} vs {b} <Flag code={b}/></strong></div><button className="lv-close" onClick={onClose} aria-label="Close">✕</button></header>
    {!tie?<div className="lv-tie-preview"><p>Best of three rubbers: No. 1 vs No. 1, No. 2 vs No. 2, then the deciding rubber.</p></div>:<div className="lv-rubbers">{tie.rubbers.map(r=>{const w=findPlayer(universe,r.winnerId),l=findPlayer(universe,r.loserId);return <div key={r.id}><span>{String(r.round).split('·')[1]?.trim()||'Rubber'}</span><button onClick={()=>w&&onPlayer?.(w.id)}><Flag code={w?.country}/><strong>{w?fullName(w):''}</strong></button><b>{r.score}</b><button className="lost" onClick={()=>l&&onPlayer?.(l.id)}><Flag code={l?.country}/>{l?fullName(l):''}</button></div>})}<p className="lv-tie-result"><Flag code={tie.winner}/> <strong>{tie.winner}</strong> win {tie.score}</p></div>}
    <footer>{!tie&&<button className="lv-primary" disabled={busy} onClick={onCompute}>▶ Play tie</button>}{tie&&onNext&&<button className="lv-primary" onClick={onNext}>Next tie ▶</button>}<button className="secondary" onClick={onClose}>{tie?'Back to draw':'Close'}</button></footer>
  </div></div>;
}

// --- Draw views --------------------------------------------------------------------
export function RoundMatches({universe,state,r,featured,onWatch,onQuick,onPlayer,busy}){
  const round=state.rounds[r];const pairs=pairsForRound(state,r);if(!pairs)return null;
  return <div className={`lv-round-grid ${pairs.length<=4?'big':''}`}>{pairs.map(([a,b],slot)=>{
    const m=matchForPair(state,round,a,b,slot);const winner=state.kind==='team'?m?.winner:m?.winnerId;
    const scoreFor=id=>m&&state.kind!=='team'&&id===m.winnerId?m.score:null;
    return <article key={slot} className={`lv-match ${m?'played':'pending'}${m?.upset?' upset':''}`}>
      {state.kind==='team'?<><TeamLine country={a} winner={winner}/><TeamLine country={b} winner={winner}/>{m&&<b className="lv-tie-score">{m.score}</b>}</>:<><PlayerLine universe={universe} state={state} id={a} winnerId={winner} score={scoreFor(a)} onPlayer={onPlayer}/><PlayerLine universe={universe} state={state} id={b} winnerId={winner} score={scoreFor(b)} onPlayer={onPlayer}/></>}
      {!m&&r===state.roundIndex&&<div className="lv-match-actions"><button className={featured?'lv-watch':'secondary mini'} disabled={busy} onClick={()=>onWatch(slot,round,a,b)}>{featured?'▶ Watch':'Watch'}</button><button className="secondary mini" disabled={busy} onClick={()=>onQuick(slot)}>Result</button></div>}
      {m&&<button className="lv-replay" onClick={()=>onWatch(slot,round,a,b)} title="Open match">↗</button>}
    </article>;})}</div>;
}

export function Bracket({universe,state,onPlayer,full=false}){
  // career hook: `full` shows the whole draw from the first round
  const from=full?0:Math.max(0,state.rounds.findIndex(r=>r==='QF'));
  const cols=state.rounds.slice(from).map((round,k)=>({round,r:from+k}));
  const champ=state.kind==='team'?state.championCountry:state.championId;
  return <div className="lv-bracket">{cols.map(({round,r})=>{const pairs=pairsForRound(state,r)||new Array(Math.max(1,2**(state.rounds.length-r-1))).fill([null,null]);return <div className="lv-bracket-col" key={round}><h4>{ROUND_SHORT[round]||round}</h4><div className="lv-bracket-stack">{pairs.map(([a,b],slot)=>{const m=a&&b?matchForPair(state,round,a,b,slot):null;const w=state.kind==='team'?m?.winner:m?.winnerId;return <div className="lv-bracket-cell" key={slot}>{state.kind==='team'?<>{a?<TeamLine country={a} winner={w}/>:<span className="lv-tbd">TBD</span>}{b?<TeamLine country={b} winner={w}/>:<span className="lv-tbd">TBD</span>}</>:<>{a?<PlayerLine universe={universe} state={state} id={a} winnerId={w} onPlayer={onPlayer}/>:<span className="lv-tbd">TBD</span>}{b?<PlayerLine universe={universe} state={state} id={b} winnerId={w} onPlayer={onPlayer}/>:<span className="lv-tbd">TBD</span>}</>}{m&&<small>{m.score}</small>}</div>})}</div></div>})}
  <div className="lv-bracket-col champion"><h4>Champion</h4><div className="lv-bracket-stack"><div className="lv-bracket-cell">{champ?(state.kind==='team'?<TeamLine country={champ} winner={champ}/>:<PlayerLine universe={universe} state={state} id={champ} winnerId={champ} onPlayer={onPlayer}/>):<span className="lv-tbd">To be decided</span>}</div></div></div></div>;
}

// --- Champions screen ---------------------------------------------------------------
function championStory(universe,playerId,week){return (universe.magazine||[]).find(s=>s.week===week&&s.category==='Champions'&&(s.playerIds||[])[0]===playerId);}
function ChampionCard({universe,edition,label,onPlayer,onTournament,big}){
  if(!edition)return null;
  const champ=findPlayer(universe,edition.championId),runner=findPlayer(universe,edition.finalistId);const final=(edition.matches||[]).find(m=>m.round==='F');
  const st=champ&&championStory(universe,champ.id,edition.event.week);
  return <article className={`lv-champion ${big?'big':''} tour-${edition.event.tour}`}>
    <span className="lv-champ-label">{label}</span>
    {champ&&<button className="lv-champ-portrait" onClick={()=>onPlayer(champ.id)}><Portrait player={champ} size={big?'profile':'card'}/></button>}
    <div><h3><Flag code={champ?.country}/>{champ?fullName(champ):edition.championName}</h3><p>def. {runner?fullName(runner):edition.finalistName} <b>{final?.score||edition.finalScore||''}</b></p>{st&&<p className="lv-champ-story">{replaceCalendarYears(universe,st.body)}</p>}<button className="secondary mini" onClick={()=>onTournament(tournamentKey(edition.event.tour,edition.event.name))}>Full draw</button></div>
  </article>;
}
function DoublesCard({universe,edition,label}){
  if(!edition)return null;const final=(edition.matches||[]).find(m=>m.round==='F');
  return <article className="lv-champion doubles"><span className="lv-champ-label">{label}</span><div><h3>{(edition.championNames||[]).map((n,i)=><span key={i}><Flag code={edition.championCountries?.[i]}/>{n}</span>)}</h3><p>def. {(edition.finalistNames||[]).join(' / ')} <b>{final?.score||''}</b></p></div></article>;
}
function ChampionsScreen({universe,landmark,onPlayer,onTournament}){
  const editions=landmark.eventIds.map(id=>(universe.tournamentEditions||[]).find(e=>e.id===id)).filter(Boolean).sort((a,b)=>a.event.tour.localeCompare(b.event.tour));
  const doubles=landmark.eventIds.map(id=>(universe.doublesEditions||[]).find(d=>d.event?.id===id)).filter(Boolean).sort((a,b)=>a.event.tour.localeCompare(b.event.tour));
  return <div className="page lv-page">
    <section className="lv-hero done"><div><span>{universeWeekLabel(universe,landmark.year,landmark.week)} · Final results</span><h1>{landmark.label} champions</h1><p>The tournament is complete and part of the Chronicle. Use the calendar controls at the top to continue the season.</p></div></section>
    <div className="lv-champion-grid">{editions.map(ed=>ed.championCountry&&!ed.championId?<article key={ed.id} className="lv-champion big team"><span className="lv-champ-label">{eventTitle(ed.event)}</span><div><h3><Flag code={ed.championCountry}/>{ed.championCountry}</h3><p>def. {ed.finalistCountry||'—'}</p><button className="secondary mini" onClick={()=>onTournament(tournamentKey(ed.event.tour,ed.event.name))}>Full results</button></div></article>:<ChampionCard key={ed.id} universe={universe} edition={ed} big label={eventTitle(ed.event)} onPlayer={onPlayer} onTournament={onTournament}/>)}</div>
    {doubles.length>0&&<div className="lv-champion-grid small">{doubles.map(d=><DoublesCard key={d.id} universe={universe} edition={d} label={`${d.event.tour==='ATP'?'Men’s':'Women’s'} doubles`}/>)}</div>}
  </div>;
}

// --- Page --------------------------------------------------------------------------
export default function LiveEventPage({universe,busy,onAction,onPlayer,onTournament}){
  const live=universe.liveEvent;
  const [tab,setTab]=useState(live?.states?.[0]?.eventId||null);
  const [player,setPlayer]=useState(null);
  const [showAll,setShowAll]=useState(false);
  useEffect(()=>{if(live&&!live.states.some(s=>s.eventId===tab))setTab(live.states[0]?.eventId);},[live?.week,live?.year]);
  if(!live&&player){ /* keep the modal visible over the champions screen until closed */ }
  if(!live&&!player){
    if(universe.lastLandmark)return <ChampionsScreen universe={universe} landmark={universe.lastLandmark} onPlayer={onPlayer} onTournament={onTournament}/>;
    return <div className="page"><SectionTitle eyebrow="Live coverage">No live event</SectionTitle><EmptyState>Use “Next Big Tournament” in the calendar controls. The season stops at each covered Grand Slam, Olympics, Tour Finals and team cup.</EmptyState></div>;
  }
  const states=live?.states||[];
  const state=states.find(s=>s.eventId===tab)||states[0];
  const event=state&&universe.calendar.find(e=>e.id===state.eventId);
  const featured=event?featuredRounds(universe,event):new Set();
  const round=state?state.rounds[state.roundIndex]:null;
  const pending=state&&!state.done?state.slots.map((v,i)=>v?null:i).filter(i=>i!==null):[];
  const openWatch=(slot,rnd,a,b)=>setPlayer({eventId:state.eventId,slot,round:rnd,a,b,kind:state.kind});
  const watchNext=()=>{const slot=pending[0];if(slot==null)return;openWatch(slot,round,state.alive[slot*2],state.alive[slot*2+1]);};
  const nextAfter=()=>{const st=universe.liveEvent?.states?.find(s=>s.eventId===player?.eventId);if(!st||st.done){setPlayer(null);return;}const slot=st.slots.findIndex(v=>!v);if(slot<0){setPlayer(null);return;}setPlayer({eventId:st.eventId,slot,round:st.rounds[st.roundIndex],a:st.alive[slot*2],b:st.alive[slot*2+1],kind:st.kind});};
  const sfIndex=state?state.rounds.indexOf('SF'):-1,fIndex=state?state.rounds.indexOf('F'):-1;
  const editionOf=id=>(universe.tournamentEditions||[]).find(e=>e.id===id);
  const unfinished=states.filter(s=>!s.done).length;
  return <div className="page lv-page">
    {live&&<>
    <section className="lv-hero"><div><span className="lv-onair">● Live</span><span>{universeWeekLabel(universe,live.year,live.week)}</span><h1>{live.label}</h1><p>{event?.location} · {event?.surface}</p></div><div className="lv-hero-status">{states.map(s=>{const ev=universe.calendar.find(e=>e.id===s.eventId);return <button key={s.eventId} className={s.eventId===state.eventId?'active':''} onClick={()=>setTab(s.eventId)}><small>{eventTitle(ev)}</small><strong>{s.done?'Complete':roundLabel(s,s.rounds[s.roundIndex])}</strong></button>})}</div></section>

    <nav className="lv-tabs" aria-label="Events">{states.map(s=>{const ev=universe.calendar.find(e=>e.id===s.eventId);return <button key={s.eventId} className={s.eventId===state.eventId?'active':''} onClick={()=>setTab(s.eventId)}>{eventTitle(ev)}{s.done&&' ✓'}</button>})}</nav>

    {state&&!state.done&&<section className="lv-controls" aria-label="Event controls">
      <div><small>{eventTitle(event)}</small><strong>{roundLabel(state,round)} · {pending.length} {state.kind==='team'?(pending.length===1?'tie':'ties'):(pending.length===1?'match':'matches')} left</strong></div>
      <div className="lv-control-buttons">
        <button className="lv-primary" disabled={busy} onClick={watchNext}>▶ Watch next {state.kind==='team'?'tie':'match'}</button>
        <button disabled={busy} onClick={()=>onAction(state.eventId,'next')}>Simulate next</button>
        <button disabled={busy} onClick={()=>onAction(state.eventId,'round')}>Simulate {ROUND_SHORT[round]||'round'}</button>
        {sfIndex>state.roundIndex&&<button disabled={busy} onClick={()=>onAction(state.eventId,'to-semis')}>Skip to semifinals</button>}
        {fIndex>state.roundIndex&&sfIndex<=state.roundIndex&&<button disabled={busy} onClick={()=>onAction(state.eventId,'to-final')}>Skip to final</button>}
        <button className="secondary" disabled={busy} onClick={()=>{if(window.confirm(`Simulate the rest of the ${eventTitle(event).toLowerCase()} now?`))onAction(state.eventId,'finish');}}>Finish event</button>
        {unfinished>1&&<button className="secondary" disabled={busy} onClick={()=>{if(window.confirm('Simulate every remaining match of this tournament?'))onAction(null,'finish-all');}}>Finish all</button>}
      </div>
    </section>}

    {state?.done&&<section className="lv-event-done">{state.kind==='team'?<article className="lv-champion big team"><span className="lv-champ-label">{eventTitle(event)} champion</span><div><h3><Flag code={state.championCountry}/>{state.championCountry}</h3></div></article>:<ChampionCard universe={universe} edition={editionOf(state.eventId)} big label={`${eventTitle(event)} champion`} onPlayer={onPlayer} onTournament={onTournament}/>}{(()=>{const d=(universe.doublesEditions||[]).find(x=>x.event?.id===state.eventId);return d?<DoublesCard universe={universe} edition={d} label={`${event.tour==='ATP'?'Men’s':'Women’s'} doubles champions`}/>:null})()}<p className="muted">{unfinished?`${unfinished} event${unfinished>1?'s':''} still in play — switch tabs to continue.`:''}</p></section>}


    {state&&!state.done&&<section className="panel lv-panel"><div className="panel-title"><h3>{roundLabel(state,round)}</h3><span>{featured.has(round)?'Featured round — watch it set by set':'Watch any match, or take the result'}</span></div><RoundMatches universe={universe} state={state} r={state.roundIndex} featured={featured.has(round)} onWatch={openWatch} onQuick={slot=>onAction(state.eventId,'slot',slot)} onPlayer={onPlayer} busy={busy}/></section>}
    {state&&(state.kind==='team'||state.done||state.roundIndex>=Math.max(0,state.rounds.indexOf('QF')-1))&&<section className="panel lv-panel"><div className="panel-title"><h3>Bracket</h3><span>{state.kind==='team'?'National teams':'From the quarterfinals'}</span></div><Bracket universe={universe} state={state} onPlayer={onPlayer}/></section>}

    {state&&state.roundIndex>0&&<section className="panel lv-panel"><div className="panel-title"><h3>Completed rounds</h3><button className="secondary mini" onClick={()=>setShowAll(v=>!v)}>{showAll?'Hide':'Show'} all results</button></div>{[...state.rounds.slice(0,Math.min(state.roundIndex,state.rounds.length))].map((rd,r)=>({rd,r})).reverse().filter((_,k)=>showAll||k===0).map(({rd,r})=><div key={rd}><h4 className="lv-round-head">{roundLabel(state,rd)}</h4><RoundMatches universe={universe} state={state} r={r} featured={false} onWatch={openWatch} onQuick={()=>{}} onPlayer={onPlayer} busy={busy}/></div>)}</section>}
    </>}
    {player&&<MatchPlayer universe={universe} {...player} onAction={onAction} busy={busy} onPlayer={id=>{setPlayer(null);onPlayer(id);}} onClose={()=>setPlayer(null)} onNext={universe.liveEvent?.states?.some(s=>s.eventId===player.eventId&&!s.done)?nextAfter:null}/>}
  </div>;
}
