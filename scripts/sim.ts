// Headless balance harness: autoplays careers and prints the distribution.
//   npm run sim [n] [--profile=fresh|run5|run10] [--both-tours] [--verbose]
import { createCareer, me, careerOf, legacyScore } from '../src/career/engine';
import { botWeek } from '../src/career/bot';
import { STYLES } from '../src/career/data';

const args = process.argv.slice(2);
const n = Number(args.find((a) => /^\d+$/.test(a)) ?? 12);
const profile = (args.find((a) => a.startsWith('--profile='))?.split('=')[1]) ?? 'fresh';
const verbose = args.includes('--verbose');
const bothTours = args.includes('--both-tours');
const offset = Number(args.find((a) => a.startsWith('--offset='))?.split('=')[1] ?? 0);
const PROFILES: Record<string, { upgrades: Record<string, number>; trinkets: string[] }> = {
  fresh: { upgrades: {}, trinkets: [] },
  run5: { upgrades: { academy: 1, gifted: 1, kit: 1, family: 1, slots: 1 }, trinkets: ['wristband', 'notebook'] },
  run10: { upgrades: { academy: 2, gifted: 2, kit: 2, family: 2, slots: 2, scouting: 1, binder: 1, luck: 1, body: 1 }, trinkets: ['strings', 'notebook', 'racquet'] },
};
const prof = PROFILES[profile] ?? PROFILES.fresh;

const rows: any[] = [];
const t0 = Date.now();
for (let i = offset; i < offset + n; i += 1) {
  const u = createCareer({ firstName: 'Sim', lastName: `Player${i}`, tour: i % 2 ? 'WTA' : 'ATP', country: ['ESP', 'USA', 'FRA', 'ITA', 'AUS', 'ARG', 'GBR', 'JPN'][i % 8], handedness: 'Right', backhand: 'Two-handed', style: STYLES[i % STYLES.length], startAge: 15, trinkets: prof.trinkets, upgrades: prof.upgrades, seed: 1000 + i * 7919, soloTour: !bothTours });
  let guard = 0;
  while (botWeek(u) && guard++ < 52 * 30) {
    if (verbose && u.week === 1 && !u.seasonEnded) { const p = me(u), c = careerOf(u); const s = c.seasons.at(-1); if (s) console.log(`  ${s.year} age ${s.age} rank ${s.rankEnd} (best ${s.bestRank}) ovr ${s.rating} W-L ${s.wins}-${s.losses} titles ${s.titles} $${Math.round(c.money / 1000)}K staff ${Object.values(c.staff).join('')}${s.juniorBest ? ` jr ${s.juniorBest}` : ''}`); }
  }
  const p = me(u), c = careerOf(u), k = p.career;
  const L = legacyScore(u);
  rows.push({ potential: c.potential, peak: k.peakRanking, titles: k.titles, majors: k.majors, masters: k.masters || 0, peakOvr: Math.max(...c.seasons.map((s) => s.rating)), prize: c.totalPrize, retiredAt: p.age, grade: L.grade, coins: c.coinsTotal, weeksNo1: k.weeksNo1 });
  const r = rows.at(-1);
  console.log(`#${i} ${c.tour} ${c.potential.padEnd(12)} peak #${r.peak} ovr ${r.peakOvr} titles ${r.titles} slams ${r.majors} masters ${r.masters} prize $${(r.prize / 1e6).toFixed(2)}M retired ${r.retiredAt} grade ${r.grade} coins ${r.coins}`);
}
const med = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const pct = (f: (r: any) => boolean) => `${Math.round(rows.filter(f).length / rows.length * 100)}%`;
console.log(`\n${n} careers · profile ${profile} · ${((Date.now() - t0) / 1000).toFixed(0)}s`);
console.log(`median peak rank ${med(rows.map((r) => r.peak))} · top100 ${pct((r) => r.peak <= 100)} · top10 ${pct((r) => r.peak <= 10)} · No.1 ${pct((r) => r.peak === 1)} · Slam winner ${pct((r) => r.majors > 0)}`);
console.log(`median titles ${med(rows.map((r) => r.titles))} · median peak ovr ${med(rows.map((r) => r.peakOvr))} · median coins ${med(rows.map((r) => r.coins))} · grades ${['S', 'A', 'B', 'C', 'D'].map((g) => `${g}:${rows.filter((r) => r.grade === g).length}`).join(' ')}`);
