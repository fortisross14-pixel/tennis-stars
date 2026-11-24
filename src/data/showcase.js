export const COVERAGE_MODES=[
  {value:'none',label:'Don’t stop',description:'The season simulates straight through; the result appears in the news and draw.'},
  {value:'final',label:'Stop · feature the final',description:'The season pauses here. Play the draw yourself; the final is the featured watch.'},
  {value:'semifinals',label:'Stop · feature semis + final',description:'The season pauses here. Play the draw yourself; semifinals and final are featured.'},
];

export const COVERAGE_FIELDS=[
  {key:'atpGrandSlam',label:'ATP Grand Slams · Men',description:'Australian Open, Roland Garros, Wimbledon and US Open.'},
  {key:'wtaGrandSlam',label:'WTA Grand Slams · Women',description:'Australian Open, Roland Garros, Wimbledon and US Open.'},
  {key:'olympics',label:'Olympic Games',description:'Both men’s and women’s Olympic singles when the Games are held.'},
  {key:'teamCup',label:'Davis / BJK Cup Finals',description:'The season-ending national-team championship ties.'},
  {key:'tourFinals',label:'Year-end Tour Finals',description:'ATP and WTA year-end championships.'},
];

export function defaultCoveragePlan(){
  return {atpGrandSlam:'final',wtaGrandSlam:'final',olympics:'final',teamCup:'final',tourFinals:'final'};
}

export function coverageKeyForEvent(event){
  if(!event)return null;
  if(event.level==='Grand Slam')return event.tour==='ATP'?'atpGrandSlam':'wtaGrandSlam';
  if(event.level==='Olympics')return 'olympics';
  if(event.level==='Team')return 'teamCup';
  if(event.level==='Finals')return 'tourFinals';
  return null;
}

export function isBigTournamentEvent(event){return !!coverageKeyForEvent(event);}
export function coverageModeForEvent(universe,event){return universe?.settings?.showcaseCoverage?.[coverageKeyForEvent(event)]||'none';}
export function bigTournamentEventsForYear(universe){return (universe?.calendar||[]).filter(isBigTournamentEvent);}
export function hasOlympics(universe){return bigTournamentEventsForYear(universe).some(event=>event.level==='Olympics');}

export function landmarkLabel(events=[]){
  const first=events[0];if(!first)return 'Landmark tournament';
  if(first.level==='Grand Slam')return first.name;
  if(first.level==='Olympics')return 'Olympic Games';
  if(first.level==='Team')return 'Davis / BJK Cup Finals';
  if(first.level==='Finals')return 'Year-end Tour Finals';
  return first.name;
}
