import React,{useMemo,useState} from 'react';
import { SectionTitle } from '../components/Common.jsx';
import { COVERAGE_FIELDS,COVERAGE_MODES,bigTournamentEventsForYear,hasOlympics } from '../data/showcase.js';
import { universeWeekLabel,universeYearLabel } from '../utils/year.js';

function eventSummary(events,key){
  if(key==='atpGrandSlam')return events.filter(e=>e.level==='Grand Slam'&&e.tour==='ATP');
  if(key==='wtaGrandSlam')return events.filter(e=>e.level==='Grand Slam'&&e.tour==='WTA');
  if(key==='olympics')return events.filter(e=>e.level==='Olympics');
  if(key==='teamCup')return events.filter(e=>e.level==='Team');
  if(key==='tourFinals')return events.filter(e=>e.level==='Finals');
  return [];
}

export default function SeasonSetupPage({universe,onConfirm,onBack}){
  const [plan,setPlan]=useState({...universe.settings.showcaseCoverage});
  const events=useMemo(()=>bigTournamentEventsForYear(universe),[universe.year,universe.calendar]);
  const olympicYear=hasOlympics(universe);
  const choose=(key,value)=>setPlan(current=>({...current,[key]:value}));
  return <div className="page season-setup-page">
    <SectionTitle eyebrow={`${universeYearLabel(universe)} · Preseason broadcast plan`} action={onBack?<button className="secondary" onClick={onBack}>Back</button>:null}>Big Tournament Coverage</SectionTitle>
    <section className="coverage-intro prestige-panel">
      <div><span>Before the first ball is struck</span><h1>Choose how closely you want to watch the season’s landmarks.</h1><p>The Chronicle still simulates every match and stores the same history. This controls where the season pauses. At a paused tournament you play it yourself — watch any match set by set, simulate a round, or skip ahead — and no result exists until it is played.</p></div>
      <div className="coverage-key"><b>Don’t stop</b><span>Straight through</span><b>Feature the final</b><span>Pause · 1 featured match</span><b>Feature semis + final</b><span>Pause · 3 featured matches</span></div>
    </section>
    <div className="coverage-grid">{COVERAGE_FIELDS.map(field=>{
      const rows=eventSummary(events,field.key);const unavailable=field.key==='olympics'&&!olympicYear;
      return <article className={`coverage-card ${unavailable?'coverage-unavailable':''}`} key={field.key}>
        <header><div><span>{field.label}</span><strong>{unavailable?'Not held this season':`${rows.length} scheduled event${rows.length===1?'':'s'}`}</strong></div><small>{field.description}</small></header>
        {!unavailable&&<div className="coverage-mode-buttons">{COVERAGE_MODES.map(mode=><button key={mode.value} className={plan[field.key]===mode.value?'active':''} onClick={()=>choose(field.key,mode.value)}><strong>{mode.label}</strong><small>{mode.description}</small></button>)}</div>}
        {!unavailable&&<div className="coverage-event-list">{rows.slice(0,8).map(event=><span key={event.id}>{event.name}<small>{universeWeekLabel(universe,event.year,event.week)}</small></span>)}</div>}
      </article>;
    })}</div>
    <section className="coverage-start-bar"><div><small>Season ready</small><strong>{universeYearLabel(universe)} · Week 1</strong><span>You can change this plan later from World settings, but every new season will ask you to confirm it again.</span></div><button className="coverage-start-button" onClick={()=>onConfirm(plan)}>Start {universeYearLabel(universe)}</button></section>
  </div>;
}
