#!/bin/bash
# Run the balance harness on 4 cores: scripts/sim-par.sh <per-process> [extra args]
N=${1:-3}; shift
D=$(mktemp -d)
for i in 0 1 2 3; do npx tsx scripts/sim.ts $N --offset=$((i*N)) "$@" > $D/$i.txt 2>&1 & done
wait
cat $D/*.txt | grep '^#'
node -e '
const fs=require("fs");const d=process.argv[1];const rows=[];
for(const f of fs.readdirSync(d))for(const l of fs.readFileSync(d+"/"+f,"utf8").split("\n"))if(l.startsWith("#")){const m=l.match(/peak #(\d+) ovr (\d+) titles (\d+) slams (\d+) masters (\d+)/);if(m)rows.push(m.slice(1).map(Number));}
const med=a=>{a=[...a].sort((x,y)=>x-y);return a[Math.floor(a.length/2)]};const pct=f=>Math.round(rows.filter(f).length/rows.length*100)+"%";const avg=a=>(a.reduce((x,y)=>x+y,0)/a.length).toFixed(1);
console.log(`\n${rows.length} careers: median peak #${med(rows.map(r=>r[0]))} · top100 ${pct(r=>r[0]<=100)} · top10 ${pct(r=>r[0]<=10)} · Slam ${pct(r=>r[3]>0)} (avg ${avg(rows.map(r=>r[3]))}) · Masters ${pct(r=>r[4]>0)} (avg ${avg(rows.map(r=>r[4]))}) · median ovr ${med(rows.map(r=>r[1]))} · median titles ${med(rows.map(r=>r[2]))}`);
' $D
