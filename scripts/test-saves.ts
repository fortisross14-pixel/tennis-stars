// Every committed save fixture must load and keep playing.
import { readdirSync, readFileSync } from 'fs';
import { gunzipSync } from 'zlib';
import assert from 'node:assert/strict';
import { migrateCareer } from '../src/career/migrate';
import { careerOf, me, careerLive, finishLiveEvent, projectWeek } from '../src/career/engine';
import { botWeek } from '../src/career/bot';

const dir = 'tests/save-fixtures';
const files = readdirSync(dir).filter((f) => f.endsWith('.json.gz')).sort();
assert.ok(files.length > 0, 'no fixtures found');
let failed = 0;
for (const f of files) {
  try {
    const u = JSON.parse(gunzipSync(readFileSync(`${dir}/${f}`)).toString());
    migrateCareer(u);
    const c = careerOf(u), p = me(u);
    assert.ok(p, 'player present');
    if (u.liveEvent) { careerLive(u, 'to-my-match'); finishLiveEvent(u); assert.equal(u.liveEvent, null); }
    projectWeek(u);
    const startYear = u.year, startWeek = u.week;
    for (let i = 0; i < 60 && !c.retired; i += 1) botWeek(u);
    assert.ok(u.year > startYear || u.week > startWeek, 'time advanced');
    JSON.stringify(u);
    console.log(`ok  ${f}  (${startYear} w${startWeek} → ${u.year} w${u.week}, rank ${p.ranking})`);
  } catch (e) { failed += 1; console.error(`FAIL ${f}:`, e); }
}
if (failed) { console.error(`${failed} fixture(s) failed`); process.exit(1); }
console.log(`${files.length} fixtures passed`);
