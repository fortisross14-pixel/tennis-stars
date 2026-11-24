import { createUniverse } from '../src/sim/generation.js';
import { simulateWeek, openNextSeason } from '../src/sim/season.js';
import { ensureUniverseData } from '../src/sim/migrations.js';
import { rebuildDoublesTeams } from '../src/sim/doubles.js';
import { RNG } from '../src/sim/random.js';
let t=Date.now();const u:any=ensureUniverseData(createUniverse({seed:1}));const r=new RNG(u.rngSeed);rebuildDoublesTeams(u,'ATP',r);rebuildDoublesTeams(u,'WTA',r);u.rngSeed=r.seed;console.log('create',Date.now()-t);
for(let y=0;y<3;y++){t=Date.now();for(let i=0;i<52;i++)simulateWeek(u);console.log('year',Date.now()-t,'MB',(JSON.stringify(u).length/1e6).toFixed(1));
const p=u.players.ATP;const tours=p.map((x:any)=>x.season.tournaments);console.log('events played: idx0',tours[0],'idx100',tours[100],'idx300',tours[300],'idx450',tours[450],'idx590',tours[590], 'rating@300',p[300].currentRating,'@500',p[500].currentRating,'@100',p[100].currentRating);openNextSeason(u);}
