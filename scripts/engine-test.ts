// Engine smoke test: a career can be created, play live tournaments, use cards,
// change staff and partner, roll over a season and retire.
import assert from 'node:assert/strict';
import { createCareer, careerOf, me, playWeek, careerLive, finishLiveEvent, projectWeek, openPack, playCard, canPlay, setStaff, partnerCandidates, setPartner, startNextSeason, resolveDecision } from '../src/career/engine';
import { botWeek } from '../src/career/bot';

const u = createCareer({ firstName: 'Test', lastName: 'Player', tour: 'ATP', country: 'ESP', handedness: 'Right', backhand: 'Two-handed', style: 'All-court', startAge: 15, trinkets: [], upgrades: {}, seed: 42, soloTour: true });
const c = careerOf(u), p = me(u);
assert.ok(p && p.controlled, 'player exists');
assert.equal(u.year, 2026); assert.equal(u.week, 1);
assert.ok(projectWeek(u).length > 0, 'week has events');
assert.ok(projectWeek(u).some((o) => o.status === 'qualifying'), 'ITF qualifying is open');

// make the player strong enough for a main draw, then play a live event to the end
for (const k of Object.keys(c.base) as (keyof typeof c.base)[]) { c.base[k] = 80; c.ceiling[k] = 85; }
p.rankingPoints = 400; p.pointsLog.push({ eventId: 'seed', year: 2026, week: 1, points: 400, label: 'test' });
if (c.decision) resolveDecision(u, c.decision.options[0].id);
let lived = 0, weeks = 0;
while (weeks++ < 12 && !lived) {
  if (c.decision) resolveDecision(u, c.decision.options[0].id);
  const opt = projectWeek(u).find((o) => o.status === 'direct' && !o.event.level.startsWith('Junior') && o.event.level !== 'Continental');
  c.current = opt ? { kind: 'compete', eventId: opt.event.id } : { kind: 'rest' };
  const r = playWeek(u, { live: true });
  if (r === 'live') {
    lived += 1;
    let guard = 0;
    while (u.liveEvent && guard++ < 20) { careerLive(u, 'to-my-match'); const st = u.liveEvent?.states?.[0]; const i = st?.alive.indexOf(p.id); if (st && i >= 0 && !st.slots[Math.floor(i / 2)]) careerLive(u, 'slot', Math.floor(i / 2)); else if (u.liveEvent) finishLiveEvent(u); }
    assert.equal(u.liveEvent, null, 'live event finished');
    assert.ok(c.lastReport && c.lastReport.matches.length > 0, 'report has matches');
  }
}
assert.ok(lived, 'played a live tournament');
// cards
c.packs.push('gold'); const got = openPack(u, c.packs.length - 1); assert.ok(got.length === 4 || got.length === 5, 'pack: 4 cards + maybe a match card');
// match cards are only used inside a tournament
c.hand.push({ uid: 'mc-test', id: 'mc-magic' }); assert.ok(canPlay(u, 'mc-test'), 'match card cannot be played from the hand');
c.hand = c.hand.filter((h) => h.uid !== 'mc-test');
c.cardPlays = 3; const playable = c.hand.find((h) => !canPlay(u, h.uid)); if (playable) playCard(u, playable.uid);
c.money = 1e6; assert.equal(setStaff(u, 'coach', 2), null);
const partner = partnerCandidates(u).find((x: any) => x.willing); if (partner) { setPartner(u, partner.player.id); assert.ok(u.doublesTeams.ATP.some((t: any) => t.career)); }
// fast-forward the rest of the career
let guard = 0; while (botWeek(u) && guard++ < 52 * 30) { /* autopilot */ }
assert.ok(c.retired, 'career ends');
assert.ok(c.legacy && c.legacy.grade, 'legacy graded');
assert.ok(c.seasons.length >= 10, 'seasons recorded');
console.log(`engine ok: ${c.seasons.length} seasons, peak #${p.career.peakRanking}, grade ${c.legacy!.grade}`);
void startNextSeason;
