import { clamp, round1 } from './random.js';
import { fullName, refreshDoublesRankings, addFame } from './generation.js';

function playerDoublesStrength(player){if(player.doublesRating)return player.doublesRating;if(player.doublesTacticalRating)return player.doublesTacticalRating;const s=player.skills;return round1((s.serve*.20+s.return*.18+s.volley*.22+s.tactics*.18+s.mentality*.12+s.footwork*.10)*player.currentMultiplier);}
function pairKey(ids){return [...ids].sort().join('|');}
function baseChemistry(a,b){let score=50;if(a.country===b.country)score+=8;if(a.handedness!==b.handedness)score+=5;if(a.style==='Serve-and-volley'||b.style==='Serve-and-volley')score+=3;if(Math.abs(playerDoublesStrength(a)-playerDoublesStrength(b))<8)score+=4;return clamp(score,35,85);}

export function rebuildDoublesTeams(universe,tour,rng){
  universe.partnershipHistory??=[];
  const previous=new Map((universe.doublesTeams[tour]||[]).map(t=>[pairKey(t.playerIds),t]));
  const careerPair=careerDoublesPair(universe,tour);const reserved=new Set(careerPair?careerPair.map(p=>p.id):[]);
  const specialists=[...universe.doublesPlayers[tour]].filter(p=>!p.injury&&!reserved.has(p.id)&&!p.controlled).sort((a,b)=>(b.doublesPoints||0)-(a.doublesPoints||0)||playerDoublesStrength(b)-playerDoublesStrength(a));
  const crossovers=universe.players[tour].filter(p=>!p.injury&&!reserved.has(p.id)&&!p.controlled&&p.doublesPotential>=80&&(p.ranking>35||p.doublesFocus==='primary'||p.targetEvents?.includes('Olympic Games'))).sort((a,b)=>b.doublesPotential-a.doublesPotential).slice(0,36);
  const pool=[...specialists,...crossovers],teams=[],used=new Set();let teamIndex=0;
  for(const player of pool){if(used.has(player.id))continue;let best=null,bestScore=-Infinity;
    for(const candidate of pool){if(candidate.id===player.id||used.has(candidate.id))continue;const old=previous.get(pairKey([player.id,candidate.id]));const complement=(player.handedness!==candidate.handedness?5:0)+(player.country===candidate.country?4:0);const continuity=old?14:0;const score=playerDoublesStrength(candidate)+complement+continuity-Math.abs(playerDoublesStrength(player)-playerDoublesStrength(candidate))*.25+rng.normal(0,2);if(score>bestScore){best=candidate;bestScore=score;}}
    if(!best)continue;used.add(player.id);used.add(best.id);const key=pairKey([player.id,best.id]),old=previous.get(key);const chemistry=clamp(old?.chemistry??baseChemistry(player,best),35,100);const rating=round1((playerDoublesStrength(player)+playerDoublesStrength(best))/2+(chemistry-50)*.08);const inherited=(player.doublesPoints||0)+(best.doublesPoints||0);
    const team={id:old?.id||`DT-${tour}-${universe.year}-${teamIndex++}-${key}`,tour,playerIds:[player.id,best.id],playerNames:[fullName(player),fullName(best)],countries:[player.country,best.country],chemistry,rating,points:Math.round(Math.max(old?.points||0,inherited*.5)*.82),ranking:999,titles:old?.titles||0,majors:old?.majors||0,wins:old?.wins||0,losses:old?.losses||0,seasonsTogether:(old?.seasonsTogether||0)+1,type:old?.type||(chemistry>=68?'Permanent':chemistry>=56?'Semi-regular':'Event-specific'),startYear:old?.startYear||universe.year};
    teams.push(team);
  }
  if(careerPair){
    const [me,partner]=careerPair;const key=pairKey([me.id,partner.id]),old=previous.get(key);
    const chemistry=clamp(old?.chemistry??baseChemistry(me,partner),35,100);
    teams.push({id:old?.id||`DT-${tour}-${universe.year}-career-${key}`,tour,playerIds:[me.id,partner.id],playerNames:[fullName(me),fullName(partner)],countries:[me.country,partner.country],chemistry,rating:round1((playerDoublesStrength(me)+playerDoublesStrength(partner))/2+(chemistry-50)*.08),points:old?.points??Math.round(((me.doublesPoints||0)+(partner.doublesPoints||0))*.5),ranking:999,titles:old?.titles||0,majors:old?.majors||0,wins:old?.wins||0,losses:old?.losses||0,seasonsTogether:(old?.seasonsTogether||0)+(old?0:1),type:'Permanent',startYear:old?.startYear||universe.year,career:true});
  }
  for(const old of previous.values())if(!teams.some(t=>t.id===old.id))universe.partnershipHistory.push({...old,endYear:universe.year-1});
  teams.sort((a,b)=>b.points-a.points||b.rating-a.rating).forEach((team,index)=>team.ranking=index+1);universe.doublesTeams[tour]=teams;return teams;
}

function careerDoublesPair(universe,tour){
  const me=(universe.players?.[tour]||[]).find(p=>p.controlled&&p.status==='active');if(!me||!me.doublesPartnerId)return null;
  const partner=[...(universe.players[tour]||[]),...(universe.doublesPlayers[tour]||[])].find(p=>p.id===me.doublesPartnerId&&p.status==='active');
  return partner?[me,partner]:null;
}
// The career player's doubles strength is computed from their live skills every time.
function liveDoublesStrength(player){if(player.controlled){const s=player.skills;return round1(s.serve*.20+s.return*.18+s.volley*.22+s.tactics*.18+s.mentality*.12+s.footwork*.10);}return playerDoublesStrength(player);}
/** The career team must exist whenever a partner is chosen (mid-season changes included). */
export function ensureCareerTeam(universe,tour){
  const pair=careerDoublesPair(universe,tour);const teams=universe.doublesTeams[tour]||(universe.doublesTeams[tour]=[]);
  const me=(universe.players?.[tour]||[]).find(p=>p.controlled);
  if(!pair){if(me){const i=teams.findIndex(t=>t.career);if(i>=0)teams.splice(i,1);}return null;}
  const [a,b]=pair;const key=pairKey([a.id,b.id]);
  let team=teams.find(t=>t.career&&pairKey(t.playerIds)===key);
  if(!team){
    // Leaving partners: remove both from any other team.
    for(let i=teams.length-1;i>=0;i-=1)if(teams[i].playerIds.some(id=>id===a.id||id===b.id)){universe.partnershipHistory??=[];universe.partnershipHistory.push({...teams[i],endYear:universe.year});teams.splice(i,1);}
    const chemistry=baseChemistry(a,b);
    team={id:`DT-${tour}-${universe.year}-career-${key}`,tour,playerIds:[a.id,b.id],playerNames:[fullName(a),fullName(b)],countries:[a.country,b.country],chemistry,rating:0,points:Math.round(((a.doublesPoints||0)+(b.doublesPoints||0))*.5),ranking:999,titles:0,majors:0,wins:0,losses:0,seasonsTogether:1,type:'Permanent',startYear:universe.year,career:true};
    teams.push(team);
  }
  team.rating=round1((liveDoublesStrength(a)+liveDoublesStrength(b))/2+(team.chemistry-50)*.08);
  return team;
}
function teamEntryPoints(team,lookup){
  if(!team.career)return team.points||0;
  // Entry for the career team uses combined singles and doubles standing, like a real acceptance list.
  const me=team.playerIds.map(id=>lookup.get(id)).find(p=>p?.controlled);
  return Math.max(team.points||0,Math.round((team.points||0)+(me?.rankingPoints||0)*.35));
}

function teamStrength(team,event,lookup){const players=team.playerIds.map(id=>lookup.get(id)).filter(Boolean);const surfaceBoost=players.reduce((sum,p)=>sum+((p.surfaceAffinity?.[event.surface]||70)-70)*.08,0),fatiguePenalty=players.reduce((sum,p)=>sum+(p.fatigue||0)*.028,0),shapeBoost=players.reduce((sum,p)=>sum+((p.doublesShape??p.shape??50)-50)*.035,0);return team.rating+surfaceBoost+shapeBoost+(team.chemistry-50)*.07-fatiguePenalty;}
function pointsFor(level){return {'Grand Slam':2000,Finals:1500,Olympics:900,'1000':1000,'500':500,'250':250,Challenger:125,'WTA 125':125}[level]||0;}

export function simulateDoublesEvent(universe,event,rng,unavailableTeams=new Set()){
  if(!['Grand Slam','Olympics','Finals','1000','500','250','Challenger','WTA 125'].includes(event.level))return null;
  const tour=event.tour;if(!universe.doublesTeams[tour]?.length)rebuildDoublesTeams(universe,tour,rng);
  ensureCareerTeam(universe,tour);
  const allPlayers=[...universe.players[tour],...universe.doublesPlayers[tour]],lookup=new Map(allPlayers.map(p=>[p.id,p]));
  const drawSize=event.level==='Finals'?8:event.level==='Grand Slam'?64:event.level==='Olympics'?32:event.level==='1000'?32:event.level==='500'?16:['Challenger','WTA 125'].includes(event.level)?16:8;
  const careerIn=t=>{if(!t.career)return true;const me=t.playerIds.map(id=>lookup.get(id)).find(p=>p?.controlled);return !!me&&me.doublesEntryEventId===event.id;};
  // Smaller events are for teams outside the top of the doubles ranking.
  const minRank=['Challenger','WTA 125'].includes(event.level)?24:0;
  let alive=[...universe.doublesTeams[tour]].filter(t=>!unavailableTeams.has(t.id)&&careerIn(t)&&t.playerIds.every(id=>!lookup.get(id)?.injury)&&(t.career||t.ranking>minRank)).sort((a,b)=>teamEntryPoints(b,lookup)-teamEntryPoints(a,lookup)||a.ranking-b.ranking).slice(0,drawSize);
  const effectiveDrawSize=2**Math.floor(Math.log2(alive.length));alive=alive.slice(0,effectiveDrawSize);if(alive.length<8)return null;
  for(const team of alive)unavailableTeams.add(team.id);
  const rounds=effectiveDrawSize===64?['R64','R32','R16','QF','SF','F']:effectiveDrawSize===32?['R32','R16','QF','SF','F']:effectiveDrawSize===16?['R16','QF','SF','F']:['QF','SF','F'];
  const matches=[],exitRound=new Map();
  const touchPlayer=(player,won,games)=>{if(!player)return;const dc=player.doublesSpecialist?player.doublesCareer:player.career;if(player.doublesSpecialist){dc.matches=(dc.matches||0)+1;if(won)dc.wins=(dc.wins||0)+1;else dc.losses=(dc.losses||0)+1;}else{dc.doublesMatches=(dc.doublesMatches||0)+1;if(won)dc.doublesWins=(dc.doublesWins||0)+1;else dc.doublesLosses=(dc.doublesLosses||0)+1;}player.doublesSeason??={year:event.year,matches:0,wins:0,losses:0,titles:0,majors:0,points:0,tournaments:0,results:[],bestRanking:999,startRanking:player.doublesRanking||999};player.doublesSeason.matches+=1;if(won)player.doublesSeason.wins+=1;else player.doublesSeason.losses+=1;player.doublesShape=clamp((player.doublesShape??player.shape??50)+(won?1.25:.4),0,100);player.shape=clamp((player.shape||50)+(won?.35:.1),0,100);player.fatigue=clamp((player.fatigue||0)+games*(1.02-(player.skills?.endurance||70)/220),0,100);player.lastPlayedWeek=event.week;};
  for(const round of rounds){const next=[];for(let i=0;i<alive.length;i+=2){const a=alive[i],b=alive[i+1];if(a.career||b.career){for(const t of [a,b])if(t.career)t.rating=round1((liveDoublesStrength(lookup.get(t.playerIds[0]))+liveDoublesStrength(lookup.get(t.playerIds[1])))/2+(t.chemistry-50)*.08);}const sa=teamStrength(a,event,lookup)+rng.normal(0,1.8),sb=teamStrength(b,event,lookup)+rng.normal(0,1.8),winner=rng.next()<1/(1+Math.exp(-(sa-sb)/7))?a:b,loser=winner.id===a.id?b:a;winner.wins+=1;loser.losses+=1;winner.chemistry=clamp(winner.chemistry+.35,35,100);loser.chemistry=clamp(loser.chemistry+.08,35,100);const score=rng.next()<.56?'6-4 6-3':'7-6 4-6 10-7',games=score.includes('10-7')?29:19;matches.push({id:`${event.id}-D-${round}-${a.id}-${b.id}`,round,winnerId:winner.id,loserId:loser.id,winnerNames:[...winner.playerNames],loserNames:[...loser.playerNames],winnerCountries:[...winner.countries],loserCountries:[...loser.countries],score,totalGames:games,durationMinutes:Math.round(games*3.1+rng.float(8,18)),tags:score.includes('10-7')?['match tie-break','deciding set']:[]});for(const id of winner.playerIds)touchPlayer(lookup.get(id),true,games);for(const id of loser.playerIds)touchPlayer(lookup.get(id),false,games);exitRound.set(loser.id,round);next.push(winner);}alive=next;}
  const champion=alive[0],final=matches[matches.length-1],finalist=universe.doublesTeams[tour].find(t=>t.id===final.loserId),winnerPoints=pointsFor(event.level);
  const fractions={W:1,F:.6,SF:.36,QF:.18,R16:.09,R32:.045,R64:.02};
  const entered=universe.doublesTeams[tour].filter(t=>unavailableTeams.has(t.id)&&matches.some(m=>m.winnerId===t.id||m.loserId===t.id));
  for(const team of entered){const round=team.id===champion.id?'W':exitRound.get(team.id)||rounds[0],points=Math.round(winnerPoints*(fractions[round]||0));team.points=(team.points||0)+points;team.lastPlayedYear=event.year;team.lastPlayedWeek=event.week;for(const playerId of team.playerIds){const player=lookup.get(playerId);if(!player)continue;player.doublesPoints=(player.doublesPoints||0)+points;player.doublesSeason??={year:event.year,matches:0,wins:0,losses:0,titles:0,majors:0,points:0,tournaments:0,results:[],bestRanking:999,startRanking:player.doublesRanking||999};player.doublesSeason.points+=points;player.doublesSeason.tournaments+=1;player.doublesSeason.results.push({event:event.name+' Doubles',eventId:event.id+'-doubles',week:event.week,year:event.year,level:event.level,surface:event.surface,round,points,teamId:team.id,partnerNames:team.playerNames.filter((_,i)=>team.playerIds[i]!==playerId)});player.career.partnershipLog??=[];if(!player.career.partnershipLog.some(r=>r.teamId===team.id))player.career.partnershipLog.push({teamId:team.id,partnerIds:team.playerIds.filter(id=>id!==playerId),partnerNames:team.playerNames.filter((_,i)=>team.playerIds[i]!==playerId),startYear:team.startYear,type:team.type});}}
  champion.titles+=1;if(event.level==='Grand Slam')champion.majors+=1;
  for(const playerId of champion.playerIds){const p=lookup.get(playerId);if(!p)continue;p.doublesSeason.titles+=1;if(event.level==='Grand Slam')p.doublesSeason.majors+=1;if(p.doublesSpecialist){p.doublesCareer.titles+=1;if(event.level==='Grand Slam')p.doublesCareer.majors+=1;}else{p.career.doublesTitles+=1;if(event.level==='Grand Slam')p.career.doublesMajors+=1;}addFame(p,event.level==='Grand Slam'?42:event.level==='1000'?16:event.level==='500'?9:5);}
  if(finalist)for(const playerId of finalist.playerIds){const p=lookup.get(playerId);if(p)addFame(p,event.level==='Grand Slam'?8:event.level==='1000'?4:2);}
  refreshDoublesRankings([...universe.doublesPlayers[tour],...universe.players[tour].filter(p=>(p.doublesPoints||0)>0||p.doublesFocus==='primary')],{countWeek:false});universe.doublesTeams[tour].sort((a,b)=>b.points-a.points||b.rating-a.rating).forEach((t,i)=>t.ranking=i+1);
  return {id:`${event.id}-doubles`,event:{...event,name:`${event.name} Doubles`,drawSize:effectiveDrawSize},championTeamId:champion.id,finalistTeamId:finalist?.id,championNames:champion.playerNames,finalistNames:finalist?.playerNames||[],championCountries:champion.countries,matches,drawSize:effectiveDrawSize,entryTeamIds:entered.map(t=>t.id)};
}
