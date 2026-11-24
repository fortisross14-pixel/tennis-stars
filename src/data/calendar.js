import { slugify } from '../sim/random.js';

const EVENTS = [
  [1,'Brisbane International','Brisbane','AUS','Hard','500',32],[1,'Auckland Classic','Auckland','NZL','Hard','250',32],
  [2,'Sydney Open','Sydney','AUS','Hard','500',32],[3,'Australian Open','Melbourne','AUS','Hard','Grand Slam',128],
  [5,'Montpellier Indoor','Montpellier','FRA','Indoor','250',32],[5,'Abu Dhabi Open','Abu Dhabi','UAE','Hard','500',32],
  [6,'Rotterdam Indoor','Rotterdam','NED','Indoor','500',32],[6,'Doha Open','Doha','QAT','Hard','500',32],
  [7,'Buenos Aires Open','Buenos Aires','ARG','Clay','250',32],[7,'Dubai Championships','Dubai','UAE','Hard','500',32],
  [8,'Rio Open','Rio de Janeiro','BRA','Clay','500',32],[8,'Acapulco Open','Acapulco','MEX','Hard','500',32],
  [10,'Indian Wells Masters','Indian Wells','USA','Hard','1000',64],[12,'Miami Masters','Miami','USA','Hard','1000',64],
  [14,'Charleston Open','Charleston','USA','Clay','500',32],[14,'Houston Clay Court','Houston','USA','Clay','250',32],
  [15,'Monte Carlo Masters','Monte Carlo','MON','Clay','1000',64],[16,'Barcelona Open','Barcelona','ESP','Clay','500',32],
  [16,'Stuttgart Open','Stuttgart','GER','Clay','500',32],[17,'Madrid Masters','Madrid','ESP','Clay','1000',64],
  [19,'Rome Masters','Rome','ITA','Clay','1000',64],[21,'Roland Garros','Paris','FRA','Clay','Grand Slam',128],
  [24,'Queen’s Club','London','GBR','Grass','500',32],[24,'Berlin Grass Open','Berlin','GER','Grass','500',32],
  [25,'Halle Open','Halle','GER','Grass','500',32],[25,'Eastbourne International','Eastbourne','GBR','Grass','250',32],
  [27,'Wimbledon','London','GBR','Grass','Grand Slam',128],[30,'Hamburg European Open','Hamburg','GER','Clay','500',32],
  [30,'Washington Open','Washington','USA','Hard','500',32],[31,'Kitzbühel Open','Kitzbühel','AUT','Clay','250',32],
  [31,'San Jose Open','San Jose','USA','Hard','500',32],[32,'Canadian Masters','Toronto / Montreal','CAN','Hard','1000',64],
  [33,'Cincinnati Masters','Cincinnati','USA','Hard','1000',64],[35,'US Open','New York','USA','Hard','Grand Slam',128],
  [38,'Tokyo Open','Tokyo','JPN','Hard','500',32],[38,'Seoul Open','Seoul','KOR','Hard','500',32],
  [39,'Beijing Open','Beijing','CHN','Hard','500',32],[40,'Shanghai Masters','Shanghai','CHN','Hard','1000',64],
  [42,'Vienna Indoor','Vienna','AUT','Indoor','500',32],[42,'Basel Indoor','Basel','SUI','Indoor','500',32],
  [43,'Paris Indoor Masters','Paris','FRA','Indoor','1000',64],[45,'Davis & BJK Cup Finals','Various','INT','Hard','Team',16],
  [47,'Tour Finals','Turin / Riyadh','INT','Indoor','Finals',8],
];

// Challenger / WTA 125 weeks: [week, city, country]
const DEVELOPMENT_BLOCKS = [
  [1,'Canberra','AUS'],[2,'Nouméa','FRA'],[4,'Quimper','FRA'],[5,'Cleveland','USA'],[6,'Koblenz','GER'],[7,'Bengaluru','IND'],[8,'Pau','FRA'],[9,'Santiago','CHI'],
  [10,'Lille','FRA'],[11,'Phoenix','USA'],[12,'Zadar','CRO'],[13,'San Luis Potosí','MEX'],[14,'Oeiras','POR'],[15,'Barletta','ITA'],[16,'Prague','CZE'],[17,'Ostrava','CZE'],
  [18,'Bordeaux','FRA'],[19,'Turin','ITA'],[20,'Parma','ITA'],[21,'Heilbronn','GER'],[22,'Prostějov','CZE'],[23,'Nottingham','GBR'],[24,'Perugia','ITA'],[25,'Ilkley','GBR'],
  [26,'Modena','ITA'],[27,'Braunschweig','GER'],[28,'Braunschweig Open','GER'],[29,'Granby','CAN'],[30,'Segovia','ESP'],[31,'Lexington','USA'],[32,'Cordenons','ITA'],[33,'Porto','POR'],
  [34,'New Haven','USA'],[35,'Como','ITA'],[36,'Genoa','ITA'],[37,'Cary','USA'],[38,'Szczecin','POL'],[39,'Busan','KOR'],[40,'Lisbon','POR'],[41,'Bratislava','SVK'],
  [42,'Mouilleron','FRA'],[43,'Brest','FRA'],[44,'Helsinki','FIN'],[45,'Champaign','USA'],[46,'Andria','ITA'],[47,'Maia','POR'],
];
// ITF World Tour weeks: [week, city, country]. There is an ITF somewhere every week of the season.
const ITF_BLOCKS=[
  [1,'Manacor','ESP'],[2,'Antalya','TUR'],[3,'Monastir','TUN'],[4,'Sharm El Sheikh','EGY'],[5,'Doha','QAT'],[6,'Monastir','TUN'],[7,'Antalya','TUR'],[8,'Heraklion','GRE'],
  [9,'Sharm El Sheikh','EGY'],[10,'Palmanova','ESP'],[11,'Bakersfield','USA'],[12,'Kolkata','IND'],[13,'Heraklion','GRE'],[14,'Santa Margherita','ITA'],[15,'Antalya','TUR'],[16,'Monastir','TUN'],
  [17,'Santa Margherita','ITA'],[18,'Telde','ESP'],[19,'Kachreti','GEO'],[20,'Casablanca','MAR'],[21,'Bucharest','ROU'],[22,'Kursumlijska Banja','SRB'],[23,'Setúbal','POR'],[24,'Roehampton','GBR'],
  [25,'Wrocław','POL'],[26,'Kassel','GER'],[27,'Getxo','ESP'],[28,'Lakewood','USA'],[29,'Lakewood','USA'],[30,'Pärnu','EST'],[31,'Bogotá','COL'],[32,'Lima','PER'],
  [33,'Lima','PER'],[34,'Vigo','ESP'],[35,'Cancún','MEX'],[36,'Cancún','MEX'],[37,'Tunis','TUN'],[38,'Tunis','TUN'],[39,'Sapporo','JPN'],[40,'Lagos','NGR'],
  [41,'Loughborough','GBR'],[42,'Heraklion','GRE'],[43,'Sharm El Sheikh','EGY'],[44,'Monastir','TUN'],[45,'Kuwait City','KUW'],[46,'Antalya','TUR'],[47,'Kish Island','IRI'],[48,'Antalya','TUR'],
  [49,'Monastir','TUN'],[50,'Sharm El Sheikh','EGY'],[51,'Doha','QAT'],
];
const ITF_SECOND=[[1,'Monastir','TUN'],[2,'Bagnoles','FRA'],[3,'Antalya','TUR'],[4,'Mildura','AUS'],[5,'Sunderland','GBR'],[6,'Antalya','TUR'],[7,'Prague','CZE'],[8,'Mumbai','IND'],[9,'Monastir','TUN'],[10,'Sharm El Sheikh','EGY'],[11,'Antalya','TUR'],[12,'Monastir','TUN'],[13,'Calvi','FRA'],[14,'Antalya','TUR'],[15,'Sharm El Sheikh','EGY'],[16,'Hammamet','TUN'],[17,'Antalya','TUR'],[18,'Kiseljak','BIH'],[19,'Monastir','TUN'],[20,'Antalya','TUR'],[21,'Grado','ITA'],[22,'Monastir','TUN'],[23,'Klosters','SUI'],[24,'Antalya','TUR'],[25,'Monastir','TUN'],[26,'Gdynia','POL'],[27,'Antalya','TUR'],[28,'Monastir','TUN'],[29,'Ourense','ESP'],[30,'Antalya','TUR'],[31,'Monastir','TUN'],[32,'Sarasota','USA'],[33,'Antalya','TUR'],[34,'Monastir','TUN'],[35,'Bangkok','THA'],[36,'Antalya','TUR'],[37,'Monastir','TUN'],[38,'Nonthaburi','THA'],[39,'Antalya','TUR'],[40,'Monastir','TUN'],[41,'Sharm El Sheikh','EGY'],[42,'Antalya','TUR'],[43,'Monastir','TUN'],[44,'Antalya','TUR'],[45,'Monastir','TUN'],[46,'Sharm El Sheikh','EGY'],[47,'Antalya','TUR'],[48,'Monastir','TUN'],[49,'Antalya','TUR'],[50,'Monastir','TUN']];
// Two more ITF venues each week rotate through the busy satellite hubs.
const ITF_HUBS=[['Monastir','TUN'],['Antalya','TUR'],['Sharm El Sheikh','EGY'],['Heraklion','GRE'],['Manacor','ESP'],['Lima','PER'],['Cancún','MEX'],['Nonthaburi','THA'],['Kampala','UGA'],['Santo Domingo','DOM'],['Tbilisi','GEO'],['Shymkent','KAZ'],['Recife','BRA'],['Córdoba','ARG'],['Tallahassee','USA'],['Hamilton','NZL']];
const ITF_ROTATION=Array.from({length:50},(_,i)=>[[i+1,...ITF_HUBS[(i*2+4)%ITF_HUBS.length]],[i+1,...ITF_HUBS[(i*2+9)%ITF_HUBS.length]]]).flat();
const ITF_EXTRA=[[2,'Mumbai','IND'],[6,'Bagnoles','FRA'],[9,'Mildura','AUS'],[13,'Calvi','FRA'],[17,'Hammamet','TUN'],[20,'Kiseljak','BIH'],[24,'Klosters','SUI'],[29,'Gdynia','POL'],[33,'Ourense','ESP'],[37,'Sarasota','USA'],[41,'Bangkok','THA'],[45,'Nonthaburi','THA']];

const JUNIOR_EVENTS = [
  [2,'Junior Oceania Cup','Melbourne','AUS','Hard','Junior 500',32],[3,'Australian Junior Championships','Melbourne','AUS','Hard','Junior Slam',32],
  [6,'African Junior Championships','Tunis','TUN','Hard','Continental',32],[8,'South American Junior Open','Buenos Aires','ARG','Clay','Junior 500',32],
  [11,'Sunshine Junior Masters','Miami','USA','Hard','Junior 500',32],[14,'Asian Junior Championships','New Delhi','IND','Hard','Continental',32],
  [16,'Mediterranean Junior Cup','Barcelona','ESP','Clay','Junior 500',32],[18,'European Junior Championships','Rome','ITA','Clay','Continental',32],
  [21,'French Junior Championships','Paris','FRA','Clay','Junior Slam',32],[25,'European Grass Juniors','London','GBR','Grass','Junior 500',32],
  [27,'Wimbledon Junior Championships','London','GBR','Grass','Junior Slam',32],[31,'North American Junior Open','Toronto','CAN','Hard','Junior 500',32],
  [35,'US Junior Championships','New York','USA','Hard','Junior Slam',32],[39,'Pacific Junior Championships','Tokyo','JPN','Hard','Junior 500',32],
  [42,'Pan-American Junior Cup','Mexico City','MEX','Hard','Continental',32],[46,'Junior World Finals','Barcelona','ESP','Indoor','Junior Finals',16],
];

export const LEVEL_POINTS={'Grand Slam':2000,'1000':1000,'500':500,'250':250,Finals:1500,Challenger:125,'WTA 125':125,ITF:50,Olympics:0,Team:0};

function dateLabel(week){const start=(week-1)*7+1;return `Week ${week} · days ${start}-${start+6}`;}
function eventRow(year,tour,row){
  const [week,name,location,country,surface,level,drawSize]=row;
  return {id:`${year}-${tour}-${week}-${slugify(name)}`,year,week,tour,name,location,country,surface,level,drawSize,
    qualifyingDrawSize:level==='Grand Slam'?64:level==='1000'?32:['500','250','Challenger','WTA 125'].includes(level)?16:0,
    dates:dateLabel(week),status:'upcoming'};
}

export function buildCalendar(year){
  const events=[];
  for(const row of EVENTS)for(const tour of ['ATP','WTA'])events.push(eventRow(year,tour,row));
  const devSurface=(week,country)=>week>=24&&week<=27&&country==='GBR'?'Grass':(week>=14&&week<=23)||(week>=28&&week<=33&&['ESP','ITA','POR','GER','POL','CZE','SVK','AUT','ROU','SRB','CRO','PER','COL','CHI','ARG','BRA'].includes(country))?'Clay':week>=40&&week<=47&&['FRA','FIN','SVK','POL','CZE','GER','GBR'].includes(country)?'Indoor':'Hard';
  for(const [week,city,country] of DEVELOPMENT_BLOCKS){
    events.push(eventRow(year,'ATP',[week,`${city} Challenger`,city,country,devSurface(week,country),'Challenger',32]));
    events.push(eventRow(year,'WTA',[week,`${city} WTA 125`,city,country,devSurface(week,country),'WTA 125',32]));
  }
  const seen=new Map();const numeral=['','',' II',' III',' IV',' V',' VI'];
  for(const [week,city,country] of [...ITF_BLOCKS,...ITF_SECOND,...ITF_ROTATION,...ITF_EXTRA].sort((a,b)=>a[0]-b[0])){
    const n=(seen.get(city)||0)+1;seen.set(city,n);
    for(const tour of ['ATP','WTA'])events.push(eventRow(year,tour,[week,`${city} ITF${n===1?'':(numeral[n]||` ${n}`)}`,city,country,devSurface(week,country),'ITF',32]));
  }
  if((year-2028)%4===0)for(const tour of ['ATP','WTA'])events.push(eventRow(year,tour,[29,'Olympic Games',year===2028?'Los Angeles':'Olympic Host City',year===2028?'USA':'INT','Hard','Olympics',64]));
  return events.sort((a,b)=>a.week-b.week||levelPriority(b.level)-levelPriority(a.level)||a.name.localeCompare(b.name));
}

function levelPriority(level){return {'Grand Slam':100,Olympics:98,Finals:94,'1000':88,'500':70,'250':58,Challenger:42,'WTA 125':42,ITF:24,Team:90}[level]||10;}

export function buildJuniorCalendar(year){
  const events=[];for(const row of JUNIOR_EVENTS)for(const tour of ['ATP','WTA'])events.push({...eventRow(year,tour,row),id:`${year}-${tour}-J-${row[0]}-${slugify(row[1])}`});
  return events;
}
export const surfaceClass=surface=>`surface-${String(surface).toLowerCase().replace(/\s+/g,'-')}`;
