// Write save fixtures for the current release: npm run fixtures -- <short-commit-hash>
// Each release adds real saves so later versions must keep loading them.
import { writeFileSync } from 'fs';
import { gzipSync } from 'zlib';
import { createCareer, careerOf, me, playWeek, projectWeek, resolveDecision } from '../src/career/engine';
import { botWeek } from '../src/career/bot';

const tag = process.argv[2];
if (!tag) { console.error('usage: npm run fixtures -- <short-commit-hash>'); process.exit(1); }
const out = (name: string, u: any) => { const buf = gzipSync(JSON.stringify(u)); writeFileSync(`tests/save-fixtures/${tag}-${name}.json.gz`, buf); console.log(name, `${(buf.length / 1e6).toFixed(1)} MB`); };

// 1. A junior, mid first season, waiting inside a live tournament.
{
  const u = createCareer({ firstName: 'Fix', lastName: 'Early', tour: 'WTA', country: 'ITA', handedness: 'Right', backhand: 'Two-handed', style: 'Counterpuncher', startAge: 15, trinkets: [], upgrades: {}, seed: 11 });
  for (let i = 0; i < 20; i += 1) botWeek(u);
  const c = careerOf(u);
  for (let i = 0; i < 20 && !u.liveEvent; i += 1) {
    if (c.decision) resolveDecision(u, c.decision.options[0].id);
    const o = projectWeek(u).find((x) => x.status === 'direct' && u.calendar.some((e: any) => e.id === x.event.id));
    c.current = o ? { kind: 'compete', eventId: o.event.id } : { kind: 'train', focus: 'serve', intensity: 'normal' };
    playWeek(u, { live: true });
  }
  out('early', u);
}
// 2. A pro three seasons in, with a doubles partner and staff.
{
  const u = createCareer({ firstName: 'Fix', lastName: 'Mid', tour: 'ATP', country: 'USA', handedness: 'Left', backhand: 'One-handed', style: 'Big server', startAge: 16, trinkets: ['wristband'], upgrades: { academy: 1 }, seed: 23, soloTour: true });
  let g = 0; while (u.year < 2029 && g++ < 400) botWeek(u);
  const p = me(u); if (!p.doublesPartnerId) p.doublesPartnerId = u.doublesPlayers.ATP[60]?.id ?? null;
  out('mid', u);
}
