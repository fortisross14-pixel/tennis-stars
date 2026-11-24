// Career engine: one week is one turn. The Chronicle world simulates everyone
// else; this layer decides what *you* do and what it does to you.
import * as G from '../sim/generation.js';
import * as S from '../sim/season.js';
import * as D from '../sim/doubles.js';
import * as R from '../sim/random.js';
import * as M from '../sim/migrations.js';
import * as T from '../sim/tournament.js';
import * as MM from '../sim/match.js';
// The Chronicle engine is plain JS; treat it as untyped here.
const { createUniverse, createJunior, recalculatePlayer, refreshRankings, fullName, addFame } = G as any;
const { simulateWeek, livePlay, liveFinishAll, liveState, livePendingSlots, openNextSeason } = S as any;
const { rebuildDoublesTeams, ensureCareerTeam } = D as any;
const { RNG, clamp } = R as any;
const { ensureUniverseData } = M as any;
const { projectCareerEntries } = T as any;
const { simulateMatch } = MM as any;
import {
  SKILL_KEYS, FOCUS_MAP, INTENSITY, STAFF, COACH_GROWTH, PRIZE, DOUBLES_PRIZE_SHARE, ROUND_ORDER, ROUND_NAME,
  travelCost, LIVING_COST, POTENTIAL_TIERS, POTENTIAL_ODDS, STYLE_CEILING, STYLE_SURFACE, SPECIAL_MAP, PACKS, SKILL_LABEL,
} from './data';
import { CARD_LIST, CARD_MAP, CARD_SELL } from './cards';
import { MILESTONE_MAP, TITLE_COINS, TRINKET_MAP } from './legacy';
import { rollDecision, turnProDecision, retirementDecision } from './decisions';
import type { Career, CareerFx, Decision, Effects, Intensity, MatchLine, PackTier, Rarity, SkillKey, Skills, StaffKey, Surface, Tour, WeekPlan, WeekReport } from './types';

export const CAREER_VERSION = 1;
export const START_YEAR = 2026;

export interface CareerSetup {
  firstName: string; lastName: string; tour: Tour; country: string;
  handedness: 'Right' | 'Left'; backhand: 'Two-handed' | 'One-handed'; style: string; startAge: 15 | 16;
  trinkets: string[]; upgrades: Record<string, number>; seed?: number; soloTour?: boolean;
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const wk = (year: number, week: number) => `${year}-${week}`;
export const careerOf = (u: any): Career => u.career;
export function me(u: any): any {
  const c = careerOf(u);
  return u.players[c.tour].find((p: any) => p.id === c.playerId) || u.retiredPlayers?.[c.tour]?.find((p: any) => p.id === c.playerId) || null;
}
function rngOf(c: Career) { return new RNG(c.seed); }
function saveRng(c: Career, rng: any) { c.seed = rng.seed; }
const r1 = (v: number) => Math.round(v * 10) / 10;

export function juniorEligible(c: Career, p: any) { return !!p && p.age <= 18 && !c.turnedPro && !c.retired; }
export function juniorRank(u: any): number | null {
  const c = careerOf(u), p = me(u);
  if (!juniorEligible(c, p)) return null;
  const pts = p.juniorPoints || 0;
  return 1 + u.juniors[c.tour].filter((j: any) => (j.juniorPoints || 0) > pts).length;
}

export function maxPlays(c: Career) { return 3 + c.fx.plays; }
/** Potential cards can lift a career only so far. */
export const POTENTIAL_CARD_CAP = 3;
export function handLimit(c: Career) { return 14 + c.fx.handBonus; }
export function weeklyStaffCost(c: Career) { return (Object.keys(c.staff) as StaffKey[]).reduce((s, k) => s + STAFF[k].levels[c.staff[k]].weekly, 0); }
export function sponsorIncome(p: any) {
  const rank = p.ranking || 999;
  const rankPart = rank <= 250 ? 4 * Math.pow(250 - rank, 1.3) : 0;
  return Math.round(rankPart + (p.fame || 0) * 3.5);
}
export function declineAge(c: Career) { return 29 + c.fx.prime; }

/** The skills the match engine sees: base + this week's boost. */
export function applySkills(u: any) {
  const c = careerOf(u), p = me(u);
  if (!p) return;
  const b = c.boost;
  for (const k of SKILL_KEYS) {
    const add = b ? (b.skills[k] ?? 0) : 0;
    p.skills[k] = clamp(Math.round(c.base[k] + add), 25, 100);
  }
  p.specials = [...c.specials];
  p.boostEdge = b ? b.edge : 0;
  recalculatePlayer(p);
  p.maxRating = Math.round(SKILL_KEYS.reduce((s, k) => s + c.ceiling[k], 0) / SKILL_KEYS.length * 10) / 10;
  p.doublesTacticalRating = r1(p.skills.serve * .2 + p.skills.return * .18 + p.skills.volley * .22 + p.skills.tactics * .18 + p.skills.mentality * .12 + p.skills.footwork * .1);
  p.doublesRating = 0;
  p.wildcardBonus = wildcardBonus(u);
}

function wildcardBonus(u: any) {
  const c = careerOf(u), p = me(u);
  const jr = juniorRank(u);
  let b = 0;
  if (jr != null) b += jr <= 5 ? 220 : jr <= 15 ? 150 : jr <= 40 ? 80 : jr <= 80 ? 30 : 0;
  if (p.age <= 17) b += 30;
  if (c.federation) b += 50;
  b += Math.min(90, (p.fame || 0) / 3);
  return b + c.fx.wildcard;
}

export function overall(p: any) { return Math.round(p?.currentRating ?? 0); }

// ---------------------------------------------------------------------------
// Creating a career
// ---------------------------------------------------------------------------
export function buildFx(trinkets: string[], up: Record<string, number>): CareerFx {
  const fx: CareerFx = { growth: 1, injury: 0, plays: 0, handBonus: 0, luck: 0, prime: 0, wildcard: 0, coinMult: 1, boostSlots: 1 };
  for (const id of trinkets) {
    const t = TRINKET_MAP[id]?.fx; if (!t) continue;
    fx.growth += t.growth ?? 0; fx.injury += t.injury ?? 0; fx.plays += t.plays ?? 0; fx.luck += t.luck ?? 0;
    fx.prime += t.prime ?? 0; fx.wildcard += t.wildcard ?? 0; fx.coinMult += t.coinMult ?? 0;
  }
  fx.injury += (up.body ?? 0) * 0.15;
  fx.plays += (up.binder ?? 0) >= 1 ? 1 : 0; if ((up.binder ?? 0) >= 2) { fx.plays += 1; fx.handBonus += 6; }
  fx.luck += up.luck ?? 0;
  fx.wildcard += (up.federation ?? 0) * 45;
  fx.prime += up.longevity ?? 0;
  fx.injury = Math.min(0.7, fx.injury);
  return fx;
}

export function createCareer(setup: CareerSetup) {
  const seed = setup.seed ?? (Date.now() % 2147483647);
  const u: any = ensureUniverseData(createUniverse({ seed, startYear: START_YEAR - 1, name: `${setup.firstName} ${setup.lastName}` }));
  const wr = new RNG(u.rngSeed);
  rebuildDoublesTeams(u, 'ATP', wr); rebuildDoublesTeams(u, 'WTA', wr);
  u.rngSeed = wr.seed;
  u.settings.seasonSetupComplete = true;
  u.settings.showcaseCoverage = { atpGrandSlam: 'none', wtaGrandSlam: 'none', olympics: 'none', teamCup: 'none', tourFinals: 'none' };
  if (setup.soloTour) u.activeTours = [setup.tour];
  // One season of history before you arrive: real rankings, champions and rivalries.
  for (let i = 0; i < 52 && !u.seasonEnded; i += 1) simulateWeek(u);
  openNextSeason(u);
  u.settings.seasonSetupComplete = true;
  u.transition = null;

  const rng = new RNG(seed ^ 0x5bd1e995);
  const up = setup.upgrades || {};
  const fx = buildFx(setup.trinkets, up);
  const trinketFx = setup.trinkets.map((id) => TRINKET_MAP[id]?.fx).filter(Boolean) as any[];

  // potential tier
  let roll = rng.next(), tier = 0;
  for (let i = 0, acc = 0; i < POTENTIAL_ODDS.length; i += 1) { acc += POTENTIAL_ODDS[i]; if (roll <= acc) { tier = i; break; } }
  tier = Math.max(tier, up.scouting ?? 0);
  tier = Math.min(POTENTIAL_TIERS.length - 1, tier + trinketFx.reduce((s, t) => s + (t.tier ?? 0), 0));
  const T = POTENTIAL_TIERS[tier];
  const avg = rng.float(T.min, T.max);
  const ceilBonus = trinketFx.reduce((s, t) => s + (t.ceiling ?? 0), 0) + ([0, 1, 2, 4][up.gifted ?? 0] ?? 0);
  const styleBoost = STYLE_CEILING[setup.style] || {};
  const ceiling = {} as Skills, base = {} as Skills;
  const startFrac = setup.startAge === 15 ? 0.6 : 0.64;
  const startBonus = trinketFx.reduce((s, t) => s + (t.start ?? 0), 0) + (up.academy ?? 0) * 2;
  for (const k of SKILL_KEYS) {
    ceiling[k] = clamp(Math.round(avg + (styleBoost[k] ?? 0) + rng.normal(0, 3) + ceilBonus), 45, 99);
    base[k] = clamp(r1(ceiling[k] * startFrac + rng.normal(0, 2.2) + startBonus), 28, ceiling[k]);
  }

  // the player: a Chronicle junior record, reshaped
  const p: any = createJunior(rng, setup.tour, 0, START_YEAR, T.name, setup.startAge, { usedNames: new Set(), eliteCountryCounts: new Map() });
  Object.assign(p, {
    id: `ME-${setup.tour}-${seed}`, firstName: setup.firstName, lastName: setup.lastName, country: setup.country,
    handedness: setup.handedness, backhand: setup.backhand, style: setup.style, preferredSurface: STYLE_SURFACE[setup.style] || 'Hard',
    rarity: T.name, controlled: true, junior: false, curveType: 'Balanced star', peakAge: 26,
    academy: 'Your own team', personalityTags: [], socialPersonality: 'Fighter', narrativeTags: ['Career'],
    injuryResilience: 80, retirementInclination: 50, fame: 0, ranking: 999, previousRanking: 999,
    rankingPoints: 0, pointsLog: [], juniorPoints: 0, juniorRanking: 999, juniorPeakRanking: 999,
    shape: 55, fatigue: 0, health: 100, injury: null, doublesPartnerId: null, birthYear: START_YEAR - setup.startAge,
  });
  const aff: Record<Surface, number> = { Hard: 76, Clay: 72, Grass: 68, Indoor: 72 };
  aff[p.preferredSurface as Surface] = 86;
  p.surfaceAffinity = aff;
  // A new junior starts around No. 75 of the junior ranking (No. 30 with the head-start upgrade).
  const juniorsByPts = [...u.juniors[setup.tour]].sort((a: any, b: any) => (b.juniorPoints || 0) - (a.juniorPoints || 0));
  p.juniorPoints = (juniorsByPts[(up.junior ?? 0) > 0 ? 30 : 75]?.juniorPoints ?? 0) + 1;
  u.players[setup.tour].push(p);

  const startMoney = 12000 + trinketFx.reduce((s, t) => s + (t.money ?? 0), 0) + [0, 25000, 60000][up.family ?? 0];
  const packs: PackTier[] = ['bronze'];
  if ((up.kit ?? 0) >= 1) packs.push('silver');
  if ((up.kit ?? 0) >= 2) packs.push('gold');
  if ((up.kit ?? 0) >= 3) packs.push('elite');
  for (const t of trinketFx) packs.push(...(t.packs ?? []));
  const specials = trinketFx.map((t) => t.special).filter(Boolean) as string[];
  const noInj = trinketFx.reduce((s, t) => Math.max(s, t.noInjurySeasons ?? 0), 0);

  const c: Career = {
    version: CAREER_VERSION, playerId: p.id, tour: setup.tour, startYear: START_YEAR, startAge: setup.startAge,
    base, ceiling, potential: T.name, scoutStars: T.stars, money: startMoney,
    staff: { coach: (up.family ?? 0) >= 2 ? 1 : 0, physio: 0, fitness: 0, mental: 0 },
    federation: (up.federation ?? 0) >= 2, turnedPro: false, cardPlays: 2, hand: [], packs, boost: null, specials,
    wildcardTokens: 0, current: { kind: 'train', focus: 'balanced', intensity: 'normal' }, defaultTrain: { focus: 'balanced', intensity: 'normal' },
    plan: {}, watchMatches: true, decision: null, live: null, pendingWeek: null, lastReport: null, reports: [], seasons: [],
    seasonPrize: 0, totalPrize: 0, milestones: {}, counters: {}, coinEvents: [], coinsTotal: 0, fx,
    trinkets: [...setup.trinkets], noInjuryUntilYear: noInj ? START_YEAR + noInj - 1 : 0, seasonReview: null,
    retired: false, legacy: null, seed: rng.seed, uid: 1,
  };
  u.career = c;
  u.followedPlayerIds = [p.id];
  applySkills(u);
  refreshRankings(u.players[setup.tour]);
  u.magazine.unshift({ id: `story-career-${seed}`, year: START_YEAR, week: 1, category: 'Juniors', headline: `${setup.firstName} ${setup.lastName} starts out`, body: `A ${setup.startAge}-year-old ${setup.style.toLowerCase()} from ${setup.country} begins the long road from the junior circuit.`, importance: 2, playerIds: [p.id], tour: setup.tour });
  beginWeek(u);
  return u;
}

// ---------------------------------------------------------------------------
// Week options and entry projections
// ---------------------------------------------------------------------------
export interface EventOption { event: any; status: string; note: string; travel: number; doublesOk: boolean; position?: number; cutoffRank?: number | null; qualifyingCutoffRank?: number | null }

const JUNIOR_ENTRY: Record<string, { direct: number; quali: number }> = {
  'Junior Slam': { direct: 24, quali: 60 }, 'Junior Finals': { direct: 12, quali: 12 }, 'Junior 500': { direct: 28, quali: 72 }, Continental: { direct: 40, quali: 120 },
};

export function weekEvents(u: any, year = u.year, week = u.week) {
  const c = careerOf(u);
  const pro = (u.calendar || []).filter((e: any) => e.tour === c.tour && e.year === year && e.week === week && e.level !== 'Team' && e.status !== 'completed');
  const junior = (u.juniorCalendar || []).filter((e: any) => e.tour === c.tour && e.year === year && e.week === week && e.status !== 'completed');
  return { pro, junior };
}

export function projectWeek(u: any, week = u.week): EventOption[] {
  const c = careerOf(u), p = me(u);
  if (!p || c.retired) return [];
  const { pro, junior } = weekEvents(u, u.year, week);
  const out: EventOption[] = [];
  const proj = pro.length ? projectCareerEntries(u.players[c.tour], pro, p) : {};
  for (const e of pro) {
    const pr = proj[e.id] || { status: 'out' };
    let status = pr.status;
    if (e.level === 'Finals') status = p.ranking <= 8 ? 'direct' : 'out';
    if (e.level === 'Olympics' && p.ranking > 64) status = 'out';
    if (c.wildcardTokens > 0 && !['Grand Slam', '1000', 'Finals', 'Olympics'].includes(e.level) && ['out', 'alternate', 'qualifying'].includes(status)) status = 'wildcard';
    const note = status === 'direct' ? 'Main draw' : status === 'qualifying' ? 'Qualifying' : status === 'wildcard' ? 'Wild card (token)' : status === 'alternate' ? 'Alternate: needs withdrawals or a wildcard' : status === 'ineligible' ? 'Not eligible' : 'Ranking too low: only a wildcard gets you in';
    out.push({ event: e, status, note, travel: travelCost(p.country, e.country), doublesOk: !!p.doublesPartnerId && ['Grand Slam', '1000', '500', '250', 'Challenger', 'WTA 125', 'Olympics'].includes(e.level), position: pr.position, cutoffRank: pr.cutoffRank, qualifyingCutoffRank: pr.qualifyingCutoffRank });
  }
  if (juniorEligible(c, p)) {
    const jr = juniorRank(u) ?? 999;
    for (const e of junior) {
      const rule = JUNIOR_ENTRY[e.level] || { direct: 28, quali: 70 };
      const sameRegion = e.level === 'Continental' && regionOf(p.country) === regionOf(e.country);
      const status = jr <= rule.direct || sameRegion ? 'direct' : jr <= rule.quali ? 'qualifying' : (wildcardBonus(u) >= 150 && e.level !== 'Junior Finals') ? 'wildcard' : 'out';
      out.push({ event: e, status, note: status === 'direct' ? `Main draw (junior No. ${jr})` : status === 'qualifying' ? 'Junior qualifying' : status === 'wildcard' ? 'Junior exemption likely' : `Junior ranking too low (No. ${jr})`, travel: travelCost(p.country, e.country), doublesOk: false });
    }
  }
  const order: Record<string, number> = { direct: 0, wildcard: 1, qualifying: 2, alternate: 3, out: 4, ineligible: 5 };
  return out.sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9) || levelRank(b.event.level) - levelRank(a.event.level));
}
import { REGION } from './data';
function regionOf(code: string) { return REGION[code] ?? 'other'; }
export function levelRank(level: string) { return ({ 'Grand Slam': 100, Olympics: 98, Finals: 94, '1000': 86, '500': 65, '250': 45, Challenger: 28, 'WTA 125': 28, ITF: 15, 'Junior Slam': 40, 'Junior Finals': 38, 'Junior 500': 26, Continental: 20 } as Record<string, number>)[level] ?? 10; }

// ---------------------------------------------------------------------------
// Turn flow
// ---------------------------------------------------------------------------
export function beginWeek(u: any) {
  const c = careerOf(u), p = me(u);
  if (!p || c.retired || u.seasonEnded) return;
  const rng = rngOf(c);
  if (u.week % 2 === 0) c.cardPlays = Math.min(maxPlays(c), c.cardPlays + 1);
  const key = wk(u.year, u.week);
  const planned = c.plan[key];
  if (p.injury?.weeksRemaining > 0) c.current = { kind: 'rest' };
  else if (planned) c.current = planned;
  else c.current = { kind: 'train', ...c.defaultTrain };
  if (planned) delete c.plan[key];
  // validate a planned event is still available
  if (c.current.kind === 'compete' || c.current.kind === 'junior') {
    const ev = projectWeek(u).find((o) => o.event.id === (c.current as any).eventId);
    if (!ev) c.current = { kind: 'train', ...c.defaultTrain };
  }
  if (!c.decision) {
    if (p.age === 17 && !c.turnedPro && !c.counters['asked-pro'] && u.week >= 2) { c.counters['asked-pro'] = 1; c.decision = turnProDecision(); }
    else c.decision = rollDecision({ c, p, universe: u, rng, juniorRank: juniorRank(u) });
  }
  saveRng(c, rng);
  applySkills(u);
}

export function setPlan(u: any, plan: WeekPlan) { careerOf(u).current = plan; }

export function resolveDecision(u: any, optionId: string): string[] {
  const c = careerOf(u), d = c.decision;
  if (!d) return [];
  const opt = d.options.find((o) => o.id === optionId) ?? d.options[0];
  c.decision = null;
  const notes = applyEffects(u, opt.effects);
  applySkills(u);
  return notes;
}

function applyEffects(u: any, e: Effects): string[] {
  const c = careerOf(u), p = me(u), notes: string[] = [];
  const rng = rngOf(c);
  if (e.money) { c.money += e.money; }
  if (e.fatigue) p.fatigue = clamp((p.fatigue || 0) + e.fatigue, 0, 100);
  if (e.health) p.health = clamp((p.health || 0) + e.health, 30, 100);
  if (e.confidence) p.confidence = clamp((p.confidence || 0) + e.confidence, -10, 10);
  if (e.fame) addFame(p, e.fame);
  for (const [k, v] of Object.entries(e.skills ?? {})) c.base[k as SkillKey] = clamp(r1(c.base[k as SkillKey] + (v as number)), 25, 100);
  for (const [k, v] of Object.entries(e.ceiling ?? {})) c.ceiling[k as SkillKey] = clamp(c.ceiling[k as SkillKey] + (v as number), 40, 99);
  for (const [k, v] of Object.entries(e.affinity ?? {})) p.surfaceAffinity[k] = clamp((p.surfaceAffinity[k] || 70) + (v as number), 40, 99);
  for (const id of e.cards ?? []) addCard(c, id);
  for (const t of e.packs ?? []) c.packs.push(t);
  for (const [k, v] of Object.entries(e.staff ?? {})) c.staff[k as StaffKey] = clamp(v as number, 0, 3);
  if (e.partnerId !== undefined) setPartner(u, e.partnerId);
  if (e.wildcardBonus) c.fx.wildcard += e.wildcardBonus;
  if (e.federation) c.federation = true;
  if (e.turnPro) c.turnedPro = true;
  if (e.special) unlockSpecial(c, e.special, notes);
  if (e.injuryWeeks === -1 && rng.next() < 0.35) { injure(u, p, 3, 'shoulder strain'); notes.push('The shoulder gave way: out for 3 weeks.'); }
  if (e.retire) c.counters['retire'] = 1;
  saveRng(c, rng);
  return notes;
}

function injure(u: any, p: any, weeks: number, type: string) {
  p.injury = { type, weeksRemaining: weeks, totalWeeks: weeks, startYear: u.year, startWeek: u.week, careerThreatening: weeks >= 20 };
  p.health = clamp(p.health - 10, 30, 100);
}

/**
 * Play the current week. Returns 'live' when your tournament is waiting to be
 * played on the event screen, otherwise 'done' (the week report is ready).
 */
export function playWeek(u: any, { live }: { live: boolean }): 'live' | 'done' | 'blocked' {
  const c = careerOf(u), p = me(u);
  if (!p || c.retired || u.seasonEnded || u.liveEvent) return 'blocked';
  if (c.decision) return 'blocked';
  const plan: WeekPlan = p.injury?.weeksRemaining > 0 ? { kind: 'rest' } : c.current;
  const rng = rngOf(c);
  p.entryEventId = null; p.juniorEntryEventId = null; p.doublesEntryEventId = null; p.wildcardEventId = null;
  let entryNote: string | undefined;
  u.careerLiveEventId = null;
  if (plan.kind === 'compete') {
    const ev = u.calendar.find((e: any) => e.id === plan.eventId);
    p.entryEventId = plan.eventId;
    if (plan.doubles && p.doublesPartnerId) p.doublesEntryEventId = plan.eventId;
    if (c.wildcardTokens > 0 && ev && !['Grand Slam', '1000', 'Finals', 'Olympics'].includes(ev.level)) {
      const pr = projectCareerEntries(u.players[c.tour], [ev], p)[ev.id];
      if (pr?.status !== 'direct') { p.wildcardEventId = ev.id; c.wildcardTokens -= 1; entryNote = 'Used a wildcard token.'; }
    }
    if (live && c.watchMatches) u.careerLiveEventId = plan.eventId;
  } else if (plan.kind === 'junior') {
    const opt = projectWeek(u).find((o) => o.event.id === plan.eventId);
    const ev = u.juniorCalendar.find((e: any) => e.id === plan.eventId);
    if (opt && ev) {
      if (opt.status === 'direct' || opt.status === 'wildcard') p.juniorEntryEventId = ev.id;
      else if (opt.status === 'qualifying') {
        // one qualifying match against a junior near the cut
        const rule = JUNIOR_ENTRY[ev.level] || { direct: 28 };
        const pool = [...u.juniors[c.tour]].sort((a: any, b: any) => (b.juniorPoints || 0) - (a.juniorPoints || 0)).slice(rule.direct, rule.direct + 30);
        const opp = rng.pick(pool);
        if (opp) {
          const m = simulateMatch(p, opp, { ...ev, level: 'ITF', id: `${ev.id}-q` }, rng, 'Q');
          const won = m.winnerId === p.id;
          c.counters['jq-' + ev.id] = won ? 1 : 0;
          (u.careerJuniorQuali ??= {})[ev.id] = { opponentId: opp.id, opponent: fullName(opp), won, score: m.score };
          if (won) p.juniorEntryEventId = ev.id;
          entryNote = won ? `Qualified (beat ${fullName(opp)} ${m.score}).` : `Lost in junior qualifying to ${fullName(opp)} ${m.score}.`;
        }
      } else entryNote = 'Not accepted into the junior event.';
    }
  }
  c.pendingWeek = { plan, rankBefore: p.ranking, juniorRankBefore: juniorRank(u), base: { ...c.base }, money: c.money, year: u.year, week: u.week, age: p.age, entryNote };
  saveRng(c, rng);
  applySkills(u);
  simulateWeek(u, { live: !!u.careerLiveEventId });
  if (u.liveEvent) {
    const st = liveState(u, u.careerLiveEventId);
    if (!st || !(st.entryIds || []).includes(p.id)) liveFinishAll(u);
    else { c.live = { eventId: st.eventId }; return 'live'; }
  }
  finishWeek(u);
  return 'done';
}

/** Live tournament controls (your event). */
export function careerLive(u: any, mode: 'slot' | 'next' | 'round' | 'finish' | 'to-my-match', slot: number | null = null) {
  const c = careerOf(u);
  if (!u.liveEvent || !c.live) return [];
  const p = me(u);
  const st = liveState(u, c.live.eventId);
  let played: any[] = [];
  if (mode === 'to-my-match') {
    // play every other match until yours is next (or you are out)
    let guard = 0;
    while (st && !st.done && guard++ < 400) {
      const mySlot = myPendingSlot(st, p.id);
      const pending = livePendingSlots(st);
      if (mySlot != null) { const others = pending.filter((s: number) => s !== mySlot); if (!others.length) break; played.push(...livePlay(u, st.eventId, 'slot', others[0])); continue; }
      if (!st.alive.includes(p.id)) break;
      if (!pending.length) break;
      played.push(...livePlay(u, st.eventId, 'slot', pending[0]));
    }
  } else played = livePlay(u, c.live.eventId, mode, slot) || [];
  if (!u.liveEvent) { c.live = null; finishWeek(u); }
  return played;
}
export function myPendingSlot(st: any, id: string): number | null {
  if (!st || st.done) return null;
  const i = st.alive.indexOf(id);
  if (i < 0) return null;
  const slot = Math.floor(i / 2);
  return st.slots[slot] ? null : slot;
}
export function finishLiveEvent(u: any) {
  const c = careerOf(u);
  if (!u.liveEvent) return;
  liveFinishAll(u);
  c.live = null;
  finishWeek(u);
}

// ---------------------------------------------------------------------------
// Closing a week
// ---------------------------------------------------------------------------
function ageFactor(age: number) {
  if (age <= 16) return 1.25; if (age <= 17) return 1.18; if (age <= 18) return 1.1; if (age <= 19) return 1.0;
  if (age <= 20) return 0.92; if (age <= 21) return 0.82; if (age <= 22) return 0.7; if (age <= 23) return 0.58;
  if (age <= 24) return 0.46; if (age <= 25) return 0.36; if (age <= 26) return 0.27; if (age <= 27) return 0.2; if (age <= 28) return 0.14; return 0.08;
}
export const GROWTH_RATE = 0.0115;

function train(c: Career, p: any, focusId: string, intensity: Intensity, mult: number, rng: any, notes: string[]) {
  const f = FOCUS_MAP[focusId] ?? FOCUS_MAP.balanced, I = INTENSITY[intensity];
  const coach = COACH_GROWTH[c.staff.coach] ?? 1;
  const youth = p.age <= 20 ? c.fx.growth : 1 + (c.fx.growth - 1) * 0.3;
  const af = ageFactor(p.age);
  for (const k of SKILL_KEYS) {
    let w = f.weights[k] ?? 0.12;
    if (k === 'footwork' || k === 'endurance') w *= 1 + 0.12 * c.staff.fitness;
    if (k === 'mentality') w *= 1 + 0.12 * c.staff.mental;
    const gap = c.ceiling[k] - c.base[k];
    if (gap > 0) c.base[k] = r1Precise(c.base[k] + gap * GROWTH_RATE * w * I.growth * coach * af * youth * mult);
  }
  if (f.surface) {
    const s = f.surface;
    p.surfaceAffinity[s] = clamp((p.surfaceAffinity[s] || 70) + 0.35 * I.growth * mult, 40, 98);
    if (s === 'Hard') p.surfaceAffinity.Indoor = clamp((p.surfaceAffinity.Indoor || 70) + 0.18 * I.growth * mult, 40, 98);
  }
  const endur = (c.base.endurance - 60) / 100;
  p.fatigue = clamp((p.fatigue || 0) + I.fatigue * mult * (1 - endur * 0.5), 0, 100);
  injuryRoll(c, p, I.injury * mult, rng, notes);
}
const r1Precise = (v: number) => Math.round(v * 1000) / 1000;

function injuryRoll(c: Career, p: any, base: number, rng: any, notes: string[]) {
  if (p.injury || c.noInjuryUntilYear >= (p.season?.year ?? 0)) return;
  const fat = (p.fatigue || 0) / 100;
  const chance = base * (1 + fat * 3) * (1 - c.fx.injury) * (1 - 0.12 * c.staff.physio);
  if (rng.next() >= chance) return;
  const severe = rng.next() < 0.2;
  const weeks = severe ? rng.int(6, 14) : rng.int(1, 4);
  p.injury = { type: rng.pick(severe ? ['stress fracture', 'wrist injury', 'knee injury', 'back injury'] : ['muscle strain', 'ankle sprain', 'blisters', 'elbow soreness']), weeksRemaining: weeks, totalWeeks: weeks, startYear: p.season?.year, startWeek: p.universeWeek, careerThreatening: false };
  p.health = clamp(p.health - (severe ? 14 : 6), 30, 100);
  notes.push(`Training injury: ${p.injury.type}, out ${weeks} week${weeks > 1 ? 's' : ''}.`);
}

function matchExperience(c: Career, p: any, won: boolean, upset: boolean, rounds: number) {
  const af = ageFactor(p.age);
  for (const k of SKILL_KEYS) {
    const gap = c.ceiling[k] - c.base[k];
    if (gap <= 0) continue;
    const w = k === 'mentality' || k === 'tactics' ? 2.2 : 1;
    c.base[k] = r1Precise(c.base[k] + gap * 0.0024 * w * af * (won ? 1.15 : 1) * (upset ? 1.4 : 1) * Math.max(1, rounds * 0));
  }
}

function decline(c: Career, p: any) {
  const over = p.age - declineAge(c) + 1;
  if (over <= 0) return;
  const fit = 1 - 0.15 * c.staff.fitness;
  const d = (k: SkillKey, rate: number) => { c.base[k] = r1Precise(Math.max(30, c.base[k] - rate * over * fit)); };
  d('footwork', 0.014); d('endurance', 0.014); d('serve', 0.005); d('forehand', 0.004); d('backhand', 0.004); d('return', 0.005); d('volley', 0.003);
}

function weekKey(e: any) { return `${e.year}-${e.week}`; }

export function finishWeek(u: any) {
  const c = careerOf(u), p = me(u), pw = c.pendingWeek;
  if (!pw || !p) return;
  c.pendingWeek = null;
  u.careerLiveEventId = null;
  const rng = rngOf(c);
  const notes: string[] = [], rewards: string[] = [], matches: MatchLine[] = [];
  const plan = pw.plan;
  let prize = 0, costs = LIVING_COST + weeklyStaffCost(c), income = 0, entry: string | undefined = pw.entryNote, result: string = '';
  let title = plan.kind === 'train' ? `Training · ${FOCUS_MAP[plan.focus]?.label ?? ''} (${INTENSITY[plan.intensity].label})` : plan.kind === 'rest' ? (p.injury ? 'Rehab' : 'Rest week') : '';
  let residual = 0; // share of a training week left after the tournament
  const byId = (id: string) => u.players[c.tour].find((x: any) => x.id === id) || u.juniors[c.tour].find((x: any) => x.id === id) || u.doublesPlayers[c.tour].find((x: any) => x.id === id);
  const oppLine = (m: any, extra: Partial<MatchLine>, eventName: string, level: string): MatchLine => {
    const oppId = m.winnerId === p.id ? m.loserId : m.winnerId; const o = byId(oppId);
    return { eventName, level, round: m.round, opponent: o ? fullName(o) : 'Unknown', opponentRank: o?.ranking ?? 999, won: m.winnerId === p.id, score: m.winnerId === p.id ? m.score : flipScore(m.score), ...extra };
  };

  if (plan.kind === 'compete') {
    const ev = u.calendar.find((e: any) => e.id === plan.eventId);
    const ed = (u.tournamentEditions || []).find((e: any) => e.id === plan.eventId);
    title = ev ? ev.name : 'Tournament';
    const quali = (ed?.qualifyingMatches || []).filter((m: any) => m.playerA === p.id || m.playerB === p.id);
    for (const m of quali) matches.push(oppLine(m, { qualifying: true }, ev.name, ev.level));
    const inDraw = ed && (ed.entryIds || []).includes(p.id);
    const travelled = inDraw || quali.length > 0;
    if (ev && travelled) costs += travelCost(p.country, ev.country);
    if (inDraw) {
      const meta = (ed.entryMeta || []).find((m: any) => m.id === p.id);
      entry = meta?.type || 'Direct';
      if (entry === 'Qualifier') bump(c, 'qualified');
      const res = (p.season.results || []).filter((r: any) => r.eventId === ev.id).at(-1);
      result = res?.round ?? 'R32';
      const mine = (ed.matches || []).filter((m: any) => m.playerA === p.id || m.playerB === p.id);
      for (const m of mine) { matches.push(oppLine(m, {}, ev.name, ev.level)); trackMatch(u, c, p, m, ev); }
      prize += PRIZE[ev.level]?.[result] ?? 0;
      residual = result === 'W' || result === 'F' ? 0 : result === 'SF' ? 0.1 : result === 'QF' ? 0.2 : 0.4;
      if (result === 'W') titleRewards(u, c, p, ev, rewards);
      else if (result === 'F' && levelRank(ev.level) >= 45) { c.packs.push('silver'); rewards.push('Silver pack (final)'); }
      else if (result === 'F' || result === 'SF') { c.packs.push('bronze'); rewards.push(`Bronze pack (${ROUND_NAME[result].toLowerCase()})`); }
      if (ev.level === 'Grand Slam') { milestone(u, c, 'slam-debut', rewards); if (['QF', 'SF', 'F', 'W'].includes(result)) milestone(u, c, 'slam-qf', rewards); if (['F', 'W'].includes(result)) milestone(u, c, 'slam-final', rewards); }
      if (ev.level === 'Finals') milestone(u, c, 'finals', rewards);
      if (['Grand Slam', '1000'].includes(ev.level) && ['QF', 'SF', 'F', 'W'].includes(result)) unlockSpecial(c, 'big-stage', rewards);
      if (ev.level === 'Olympics' && ['F', 'W'].includes(result)) milestone(u, c, 'olympic-medal', rewards);
    } else if (quali.length) {
      entry = 'Qualifying'; result = 'Q';
      prize += PRIZE[ev.level]?.Q ?? 0;
      residual = 0.55;
      for (const m of quali) trackMatch(u, c, p, m, ev);
    } else {
      entry = entry ?? 'Not accepted'; result = '';
      notes.push(`Not accepted into ${ev?.name ?? 'the event'}. The week became training.`);
      residual = 0.9;
    }
    // doubles
    const de = (u.doublesEditions || []).find((e: any) => e.id === `${plan.eventId}-doubles`);
    const team = (u.doublesTeams[c.tour] || []).find((t: any) => t.career);
    if (de && team && (de.entryTeamIds || []).includes(team.id)) {
      const dm = (de.matches || []).filter((m: any) => m.winnerId === team.id || m.loserId === team.id);
      for (const m of dm) {
        const won = m.winnerId === team.id;
        matches.push({ eventName: `${ev.name} doubles`, level: ev.level, round: m.round, opponent: (won ? m.loserNames : m.winnerNames).join(' / '), opponentRank: 0, won, score: won ? m.score : flipScore(m.score), doubles: true });
      }
      const lastLoss = dm.find((m: any) => m.loserId === team.id);
      const dRound = lastLoss ? lastLoss.round : 'W';
      prize += Math.round((PRIZE[ev.level]?.[dRound] ?? 0) * DOUBLES_PRIZE_SHARE);
      if (dRound === 'W') { milestone(u, c, 'doubles-title', rewards); if (ev.level === 'Grand Slam') milestone(u, c, 'doubles-slam', rewards); c.packs.push(levelRank(ev.level) >= 65 ? 'gold' : 'silver'); rewards.push('Doubles title pack'); }
      residual = Math.max(0, residual - 0.15);
    }
  } else if (plan.kind === 'junior') {
    const ev = u.juniorCalendar.find((e: any) => e.id === plan.eventId);
    title = ev ? ev.name : 'Junior event';
    const q = u.careerJuniorQuali?.[plan.eventId];
    if (q) { matches.push({ eventName: ev.name, level: ev.level, round: 'Q', opponent: q.opponent, opponentRank: 0, won: q.won, score: q.won ? q.score : flipScore(q.score), junior: true, qualifying: true }); delete u.careerJuniorQuali[plan.eventId]; }
    const ed = (u.juniorEditions || []).find((e: any) => e.id === plan.eventId);
    if (ev && (ed?.entryIds?.includes(p.id) || q)) costs += Math.round(travelCost(p.country, ev.country) * 0.7);
    if (ed && ed.entryIds.includes(p.id)) {
      entry = entry ?? 'Main draw';
      const mine = (ed.matches || []).filter((m: any) => m.playerA === p.id || m.playerB === p.id);
      for (const m of mine) { const line = oppLine(m, { junior: true }, ev.name, ev.level); line.opponentRank = byId(line.won ? m.loserId : m.winnerId)?.juniorRanking ?? 0; matches.push(line); trackMatch(u, c, p, m, ev); }
      const res = (p.season.results || []).filter((r: any) => r.eventId === ev.id).at(-1);
      result = res?.round ?? '';
      residual = result === 'W' || result === 'F' ? 0 : 0.35;
      if (result === 'W') {
        milestone(u, c, 'junior-title', rewards);
        if (ev.level === 'Junior Slam') milestone(u, c, 'junior-slam', rewards);
        const tier: PackTier = ['Junior Slam', 'Junior Finals'].includes(ev.level) ? 'gold' : 'silver';
        c.packs.push(tier); rewards.push(`${PACKS[tier].name} (junior title)`);
        addFame(p, ev.level === 'Junior Slam' ? 10 : 4);
      }
    } else { residual = 0.75; if (!q) notes.push('Not accepted into the junior event.'); }
  }

  // training / rest
  if (plan.kind === 'train') train(c, p, plan.focus, plan.intensity, 1, rng, notes);
  else if (plan.kind === 'rest') {
    const rec = 14 + c.staff.physio * 5;
    p.fatigue = clamp(p.fatigue - rec, 0, 100);
    p.health = clamp(p.health + 2 + c.staff.physio, 30, 100);
    if (p.injury?.weeksRemaining > 0 && c.staff.physio >= 2 && rng.next() < 0.25 * (c.staff.physio - 1)) { p.injury.weeksRemaining = Math.max(0, p.injury.weeksRemaining - 1); notes.push('Your physio sped up the rehab by a week.'); }
  } else if (residual > 0 && !p.injury) train(c, p, c.defaultTrain.focus, 'normal', residual, rng, notes);

  // career-threatening injury hit from the world sim
  if (p.injury?.careerThreatening && !c.counters[`ct-${p.injury.startYear}-${p.injury.startWeek}`]) { c.counters[`ct-${p.injury.startYear}-${p.injury.startWeek}`] = 1; c.base.footwork = Math.max(30, c.base.footwork - 2); }
  if (p.injury && p.injury.startYear === pw.year && p.injury.startWeek === pw.week && !notes.some((n) => n.includes('injury'))) notes.push(`Injured: ${p.injury.type}, ${p.injury.weeksRemaining} weeks out.`);
  decline(c, p);

  // boost wears off
  if (c.boost) { c.boost.weeks -= 1; if (c.boost.weeks <= 0) c.boost = null; }

  // money
  if (c.federation) income += 600;
  income += sponsorIncome(p);
  c.money += prize + income - costs;
  c.seasonPrize += prize; c.totalPrize += prize;
  if (c.totalPrize >= 1_000_000) milestone(u, c, 'millionaire', rewards);
  if (c.money < 0) {
    const order: StaffKey[] = ['coach', 'fitness', 'mental', 'physio'];
    const k = order.filter((s) => c.staff[s] > 0).sort((a, b) => STAFF[b].levels[c.staff[b]].weekly - STAFF[a].levels[c.staff[a]].weekly)[0];
    if (k) { c.staff[k] -= 1; notes.push(`Out of money: your ${STAFF[k].label.toLowerCase()} had to go (now ${STAFF[k].levels[c.staff[k]].name}).`); }
    else if (c.money < -15000) { c.money += 8000; p.confidence = clamp((p.confidence || 0) - 2, -10, 10); notes.push('Your family lent you $8K to keep you on the road.'); }
  }

  // rewards over time
  bump(c, 'weeks');
  if ((c.counters.weeks ?? 0) % 4 === 0) { c.packs.push('bronze'); rewards.push('Bronze pack (monthly training)'); }
  const jr = juniorRank(u);
  if (jr != null) c.counters['junior-best'] = Math.min(c.counters['junior-best'] ?? 999, jr);
  if (jr != null && jr <= 10) milestone(u, c, 'junior-top10', rewards);
  if (jr === 1) milestone(u, c, 'junior-no1', rewards);
  if ((p.rankingPoints || 0) > 0) milestone(u, c, 'first-point', rewards);
  for (const [r, id] of [[300, 'top300'], [200, 'top200'], [100, 'top100'], [50, 'top50'], [20, 'top20'], [10, 'top10'], [1, 'no1']] as [number, string][]) if (p.ranking <= r && (p.rankingPoints || 0) > 0) milestone(u, c, id, rewards);
  if (p.ranking === 1) coin(c, 'no1-week', 'A week at No. 1', 15);
  checkSpecials(u, c, p, rewards);
  const skillDelta: Partial<Skills> = {};
  for (const k of SKILL_KEYS) { const d = c.base[k] - pw.base[k]; if (Math.abs(d) >= 0.05) skillDelta[k] = Math.round(d * 100) / 100; }

  const report: WeekReport = {
    year: pw.year, week: pw.week, age: pw.age, plan, title, lines: notes, matches, entry,
    result: result || undefined, prize, costs, income, rankBefore: pw.rankBefore, rankAfter: p.ranking, juniorRankAfter: jr,
    skillDelta, fatigueAfter: Math.round(p.fatigue), injury: p.injury ? `${p.injury.type} (${p.injury.weeksRemaining} wk)` : null, rewards,
  };
  c.lastReport = report;
  c.reports.unshift(report);
  if (c.reports.length > 60) c.reports.length = 60;
  saveRng(c, rng);

  if (u.seasonEnded) seasonEnd(u);
  else beginWeek(u);
  applySkills(u);
}

function flipScore(score: string) { return String(score || '').split(' ').map((s) => s.split('-').reverse().join('-')).join(' '); }
function bump(c: Career, k: string, n = 1) { c.counters[k] = (c.counters[k] ?? 0) + n; }

function trackMatch(u: any, c: Career, p: any, m: any, ev: any) {
  const won = m.winnerId === p.id;
  const oppId = won ? m.loserId : m.winnerId;
  const opp = u.players[c.tour].find((x: any) => x.id === oppId);
  bump(c, won ? 'wins' : 'losses');
  if (won) milestone(u, c, 'first-win', []);
  if (won && (m.tags || []).includes('comeback')) bump(c, 'comebacks');
  if (won && (m.tags || []).includes('deciding set')) bump(c, 'deciders');
  if (won && opp && opp.ranking <= 20) bump(c, 'top20wins');
  const sets = String(m.score || '').split(' ');
  const tb = sets.filter((s) => s === '7-6').length, tbl = sets.filter((s) => s === '6-7').length;
  bump(c, 'tiebreaks', won ? tb : tbl);
  if (won) bump(c, `surface-${ev.surface}`);
  matchExperience(c, p, won, !!opp && won && opp.ranking < p.ranking - 40, 1);
}

function titleRewards(u: any, c: Career, p: any, ev: any, rewards: string[]) {
  const lvl = ev.level;
  const tier: PackTier = ['Grand Slam', '1000', 'Finals', 'Olympics'].includes(lvl) ? 'elite' : ['500', '250'].includes(lvl) ? 'gold' : ['Challenger', 'WTA 125'].includes(lvl) ? 'silver' : 'bronze';
  c.packs.push(tier); rewards.push(`${PACKS[tier].name} (title)`);
  coin(c, `title-${ev.id}`, `${ev.name} title`, TITLE_COINS[lvl] ?? 5);
  if (lvl === 'ITF') milestone(u, c, 'itf-title', rewards);
  if (['Challenger', 'WTA 125'].includes(lvl)) milestone(u, c, 'challenger-title', rewards);
  if (['250', '500', '1000', 'Grand Slam', 'Finals'].includes(lvl)) milestone(u, c, 'tour-title', rewards);
  if (lvl === '500') milestone(u, c, 'title-500', rewards);
  if (lvl === '1000') milestone(u, c, 'masters-title', rewards);
  if (lvl === 'Grand Slam') milestone(u, c, 'slam-title', rewards);
  if (ev.country === p.country) unlockSpecial(c, 'home-hero', rewards);
}

function coin(c: Career, id: string, label: string, amount: number) {
  const a = Math.round(amount * c.fx.coinMult);
  c.coinEvents.push({ id, label, amount: a });
  c.coinsTotal += a;
}
function milestone(u: any, c: Career, id: string, rewards: string[]) {
  if (c.milestones[id]) return;
  const def = MILESTONE_MAP[id]; if (!def) return;
  c.milestones[id] = `${u.year} · week ${u.week}`;
  coin(c, `m-${id}`, def.label, def.coins);
  c.coinEvents[c.coinEvents.length - 1].milestone = id;
  rewards.push(`🏆 ${def.label} (+${Math.round(def.coins * c.fx.coinMult)} coins)`);
  if (['top100', 'tour-title', 'slam-qf', 'junior-slam'].includes(id)) { c.packs.push('gold'); rewards.push('Gold pack (milestone)'); }
  if (['top10', 'slam-title', 'masters-title', 'no1'].includes(id)) { c.packs.push('elite'); rewards.push('Elite pack (milestone)'); }
}
function unlockSpecial(c: Career, id: string, notes: string[]) {
  if (c.specials.includes(id) || !SPECIAL_MAP[id]) return;
  c.specials.push(id);
  notes.push(`✨ New special skill: ${SPECIAL_MAP[id].name}`);
}
function checkSpecials(u: any, c: Career, p: any, rewards: string[]) {
  const n = (k: string) => c.counters[k] ?? 0;
  if (n('comebacks') >= 5) unlockSpecial(c, 'fighter', rewards);
  if (n('tiebreaks') >= 15) unlockSpecial(c, 'tiebreak-ace', rewards);
  if (n('top20wins') >= 3) unlockSpecial(c, 'giant-killer', rewards);
  if (n('surface-Clay') >= 30) unlockSpecial(c, 'clay-instinct', rewards);
  if (n('surface-Grass') >= 12) unlockSpecial(c, 'grass-feel', rewards);
  if (n('surface-Hard') >= 40) unlockSpecial(c, 'hard-hitter', rewards);
  if (n('surface-Indoor') >= 15) unlockSpecial(c, 'indoor-ace', rewards);
  if (n('deciders') >= 8) unlockSpecial(c, 'iron-legs', rewards);
  if (n('qualified') >= 4) unlockSpecial(c, 'qualifier-grit', rewards);
  // team cup & olympics (played automatically)
  const cup = (u.nationalTeams?.[c.tour] || []).at(-1);
  if (cup && cup.year === u.year && (cup.roster || []).includes(p.id)) milestone(u, c, 'team-cup', rewards);
}

// ---------------------------------------------------------------------------
// Seasons
// ---------------------------------------------------------------------------
function seasonEnd(u: any) {
  const c = careerOf(u), p = me(u);
  if (c.seasonReview?.year === u.year) return;
  const titles = (p.career.titleLog || []).filter((t: any) => t.year === u.year);
  const slamRounds = (p.season.results || []).filter((r: any) => r.level === 'Grand Slam').map((r: any) => r.round);
  const best = slamRounds.sort((a: string, b: string) => ROUND_ORDER.indexOf(b) - ROUND_ORDER.indexOf(a))[0] ?? null;
  c.seasons.push({ year: u.year, age: p.age, rankEnd: p.ranking, bestRank: p.season.bestRanking, juniorBest: juniorRank(u), wins: p.season.wins, losses: p.season.losses, titles: p.season.titles, prize: c.seasonPrize, rating: overall(p), titleNames: titles.map((t: any) => t.event), bestSlam: best ? ROUND_NAME[best] : null });
  const tier: PackTier = p.ranking <= 10 ? 'elite' : p.ranking <= 50 ? 'gold' : p.ranking <= 200 ? 'silver' : 'bronze';
  c.packs.push(tier);
  if (p.ranking <= 10) coin(c, `ye-top10-${u.year}`, `Year-end top 10 (${u.year})`, 200);
  c.seasonReview = { year: u.year };
  const forced = p.age >= 38 || (p.age >= 33 && p.ranking > 350) || (p.age >= 35 && p.ranking > 200);
  if (forced) c.decision = retirementDecision(p.age, true);
  else if (p.age >= 30) c.decision = retirementDecision(p.age, false);
}

export function startNextSeason(u: any) {
  const c = careerOf(u), p = me(u);
  if (!u.seasonEnded || c.decision) return;
  if (c.counters.retire) p.retireNow = true;
  p.juniorPoints = Math.round((p.juniorPoints || 0) * 0.32);
  openNextSeason(u);
  u.settings.seasonSetupComplete = true;
  u.transition = null;
  c.seasonReview = null;
  c.seasonPrize = 0;
  if (p.retireNow || p.status === 'retired') { retire(u); return; }
  if (p.age >= 19) c.turnedPro = true;
  ensureCareerTeam(u, c.tour);
  beginWeek(u);
}

export function legacyScore(u: any) {
  const p = me(u), c = careerOf(u), k = p.career;
  const peak = k.peakRanking || 999;
  const peakPts = peak === 1 ? 220 : peak <= 5 ? 150 : peak <= 10 ? 110 : peak <= 20 ? 75 : peak <= 50 ? 45 : peak <= 100 ? 25 : peak <= 200 ? 10 : 0;
  const score = (k.majors || 0) * 130 + (k.masters || 0) * 30 + (k.titles || 0) * 7 + (k.weeksNo1 || 0) * 1.6 + peakPts + c.totalPrize / 250000 + (k.olympicGolds || 0) * 60 + (k.doublesMajors || 0) * 35;
  const grade = score >= 700 ? 'S' : score >= 320 ? 'A' : score >= 150 ? 'B' : score >= 60 ? 'C' : 'D';
  return { score: Math.round(score), grade };
}
function retire(u: any) {
  const c = careerOf(u);
  c.retired = true;
  const { score, grade } = legacyScore(u);
  const coins = Math.round(score * 1.2 * c.fx.coinMult);
  c.coinEvents.push({ id: 'legacy', label: `Career legacy (grade ${grade})`, amount: coins });
  c.coinsTotal += coins;
  c.legacy = { grade, score, coins };
  c.decision = null;
}

// ---------------------------------------------------------------------------
// Cards and packs
// ---------------------------------------------------------------------------
function addCard(c: Career, id: string) {
  c.hand.push({ uid: `c${c.uid++}`, id });
  while (c.hand.length > handLimit(c)) { const sold = c.hand.shift()!; c.money += CARD_SELL[CARD_MAP[sold.id]?.rarity ?? 'common']; }
}
export function openPack(u: any, index: number): string[] {
  const c = careerOf(u), p = me(u);
  const tier = c.packs[index]; if (!tier) return [];
  c.packs.splice(index, 1);
  const rng = rngOf(c);
  const def = PACKS[tier];
  const odds = { ...def.odds };
  for (let i = 0; i < c.fx.luck; i += 1) { odds.common *= 0.7; odds.rare *= 1.25; odds.epic *= 1.35; odds.legendary *= 1.5; }
  const got: string[] = [];
  for (let i = 0; i < def.cards; i += 1) {
    const total = Object.values(odds).reduce((s, v) => s + v, 0);
    let roll = rng.next() * total, rarity: Rarity = 'common';
    for (const [r, w] of Object.entries(odds)) { roll -= w; if (roll <= 0) { rarity = r as Rarity; break; } }
    let pool = CARD_LIST.filter((x) => x.rarity === rarity && !(x.kind === 'special' && (c.specials.includes(x.special!))));
    // drills lean toward your weakest skills
    if (!pool.length) pool = CARD_LIST.filter((x) => x.rarity === 'common');
    const weights = pool.map((x) => (x.kind === 'drill' && x.skills ? 1 + Object.keys(x.skills).reduce((s, k) => s + Math.max(0, c.ceiling[k as SkillKey] - c.base[k as SkillKey]), 0) / 15 : 1.4) * (x.kind === 'special' ? 0.5 : 1) * (x.kind === 'money' && p.ranking < 50 ? 0.4 : 1));
    const tw = weights.reduce((s, v) => s + v, 0);
    let w = rng.next() * tw, pick = pool[0];
    for (let j = 0; j < pool.length; j += 1) { w -= weights[j]; if (w <= 0) { pick = pool[j]; break; } }
    got.push(pick.id);
    addCard(c, pick.id);
  }
  saveRng(c, rng);
  return got;
}
export function mergePacks(u: any, tier: PackTier) {
  const c = careerOf(u);
  const next: Record<PackTier, PackTier | null> = { bronze: 'silver', silver: 'gold', gold: 'elite', elite: null };
  const n = next[tier]; if (!n) return false;
  const idx = c.packs.map((t, i) => (t === tier ? i : -1)).filter((i) => i >= 0);
  if (idx.length < 4) return false;
  for (const i of idx.slice(0, 4).reverse()) c.packs.splice(i, 1);
  c.packs.push(n);
  return true;
}
export function sellCard(u: any, uid: string) {
  const c = careerOf(u); const i = c.hand.findIndex((h) => h.uid === uid); if (i < 0) return;
  const def = CARD_MAP[c.hand[i].id]; c.money += CARD_SELL[def?.rarity ?? 'common']; c.hand.splice(i, 1);
}
export function canPlay(u: any, uid: string): string | null {
  const c = careerOf(u), p = me(u);
  const h = c.hand.find((x) => x.uid === uid); if (!h) return 'Card not found';
  const def = CARD_MAP[h.id]; if (!def) return 'Unknown card';
  if (c.cardPlays <= 0) return 'No card plays left this week';
  if (def.kind === 'boost' && c.boost) return 'A boost is already active';
  if (def.kind === 'recovery' && def.heal && !p.injury) return 'You are not injured';
  if (def.kind === 'special' && c.specials.includes(def.special!)) return 'Already unlocked';
  if (def.kind === 'potential' && SKILL_KEYS.every((k) => (c.counters[`pot-${k}`] ?? 0) >= POTENTIAL_CARD_CAP)) return 'Potential cards are maxed out for this career';
  if (def.kind === 'drill' && SKILL_KEYS.every((k) => !((def.skills?.[k] ?? 0) + (def.all ?? 0)) || c.base[k] >= c.ceiling[k])) return 'Already at your potential in that skill';
  return null;
}
export function playCard(u: any, uid: string): string[] {
  const c = careerOf(u), p = me(u);
  const err = canPlay(u, uid); if (err) return [err];
  const i = c.hand.findIndex((x) => x.uid === uid);
  const def = CARD_MAP[c.hand[i].id];
  c.hand.splice(i, 1); c.cardPlays -= 1;
  const notes: string[] = [];
  const rng = rngOf(c);
  if (def.kind === 'drill') {
    for (const k of SKILL_KEYS) {
      const add = (def.skills?.[k] ?? 0) + (def.all ?? 0); if (!add) continue;
      const cap = c.ceiling[k];
      const before = c.base[k]; c.base[k] = Math.min(cap, r1(c.base[k] + add));
      notes.push(`${SKILL_LABEL[k]} ${before.toFixed(1)} → ${c.base[k].toFixed(1)}${c.base[k] >= cap ? ' (at potential)' : ''}`);
    }
  } else if (def.kind === 'boost') {
    const skills: Partial<Skills> = { ...(def.skills ?? {}) };
    if (def.all) for (const k of SKILL_KEYS) skills[k] = (skills[k] ?? 0) + def.all;
    c.boost = { cardId: def.id, name: def.name, skills, edge: def.edge ?? 0, weeks: def.weeks ?? 1 };
    if (def.fatigue) p.fatigue = clamp(p.fatigue + def.fatigue, 0, 100);
    notes.push(`${def.name} active for ${def.weeks ?? 1} week(s).`);
  } else if (def.kind === 'recovery') {
    if (def.fatigue) p.fatigue = clamp(p.fatigue + def.fatigue, 0, 100);
    if (def.health) p.health = clamp(p.health + def.health, 30, 100);
    if (def.confidence) p.confidence = clamp((p.confidence || 0) + def.confidence, -10, 10);
    if (def.heal && p.injury) { p.injury.weeksRemaining -= def.heal; if (p.injury.weeksRemaining <= 0) { p.injury = null; notes.push('Injury healed!'); } else notes.push(`Injury: ${p.injury.weeksRemaining} weeks left.`); }
    notes.push(def.desc);
  } else if (def.kind === 'potential') {
    const room = (k: SkillKey) => Math.max(0, POTENTIAL_CARD_CAP - (c.counters[`pot-${k}`] ?? 0));
    const lift = (k: SkillKey, add: number) => { const a = Math.min(add, room(k)); if (a > 0) { c.ceiling[k] = Math.min(99, c.ceiling[k] + a); c.counters[`pot-${k}`] = (c.counters[`pot-${k}`] ?? 0) + a; } return a; };
    let total = 0;
    for (const k of SKILL_KEYS) { const add = (def.ceiling?.[k] ?? 0) + (def.ceilingAll ?? 0); if (add) total += lift(k, add); }
    if (def.ceilingRandom) { const open = SKILL_KEYS.filter((k) => room(k) > 0); const k = (open.length ? rng.pick(open) : rng.pick(SKILL_KEYS)) as SkillKey; total += lift(k, def.ceilingRandom); notes.push(`+${Math.min(def.ceilingRandom, total)} ${SKILL_LABEL[k]} potential.`); }
    else notes.push(total ? def.desc : 'Your potential is already stretched as far as cards can take it.');
  } else if (def.kind === 'special') unlockSpecial(c, def.special!, notes);
  else if (def.kind === 'money') { c.money += def.money ?? 0; if (def.fatigue) p.fatigue = clamp(p.fatigue + def.fatigue, 0, 100); notes.push(def.desc); }
  else if (def.kind === 'wildcard') { c.wildcardTokens += def.wildcard ?? 1; notes.push(`You hold ${c.wildcardTokens} wildcard token(s).`); }
  saveRng(c, rng);
  applySkills(u);
  return notes;
}

// ---------------------------------------------------------------------------
// Staff and doubles
// ---------------------------------------------------------------------------
export function setStaff(u: any, k: StaffKey, level: number): string | null {
  const c = careerOf(u);
  level = clamp(level, 0, 3);
  if (level > c.staff[k]) {
    const weekly = STAFF[k].levels[level].weekly;
    if (c.money < weekly * 4) return `You need ${'$'}${(weekly * 4).toLocaleString()} (four weeks of wages) to hire them.`;
    if (k === 'coach' && level === 3 && me(u).ranking > 80) return 'A former Slam champion only coaches top-80 players.';
  }
  c.staff[k] = level;
  return null;
}

export function partnerCandidates(u: any) {
  const c = careerOf(u), p = me(u);
  const pool = [...u.doublesPlayers[c.tour], ...u.players[c.tour].filter((x: any) => !x.controlled && x.doublesPotential >= 72)].filter((x: any) => x.status === 'active' && !x.injury);
  const myStanding = Math.min(p.doublesRanking || 999, Math.round((p.ranking || 999) * 0.6) + 20);
  return pool.map((x: any) => {
    const dr = x.doublesRanking || 999;
    const willing = dr >= myStanding * 0.55 - 5 || (p.fame || 0) > (x.fame || 0) * 1.5 + 30;
    return { player: x, doublesRanking: dr, rating: x.doublesRating || x.doublesTacticalRating || 0, willing };
  }).sort((a: any, b: any) => a.doublesRanking - b.doublesRanking).slice(0, 220);
}
export function setPartner(u: any, id: string | null) {
  const c = careerOf(u), p = me(u);
  p.doublesPartnerId = id;
  ensureCareerTeam(u, c.tour);
}

// ---------------------------------------------------------------------------
// Autopilot (used by "simulate weeks" and the balance harness)
// ---------------------------------------------------------------------------
export function autoPlan(u: any, opts: { aggressive?: boolean } = {}): WeekPlan {
  const c = careerOf(u), p = me(u);
  if (p.injury?.weeksRemaining > 0) return { kind: 'rest' };
  if (p.fatigue >= 62) return { kind: 'rest' };
  const opts2 = projectWeek(u).filter((o) => ['direct', 'qualifying', 'wildcard'].includes(o.status));
  const recent = c.reports.slice(0, 3).filter((r) => r.plan.kind === 'compete' || r.plan.kind === 'junior').length;
  const wantPlay = p.fatigue < 48 && recent < 3;
  if (wantPlay && opts2.length) {
    const score = (o: EventOption) => levelRank(o.event.level) + (o.status === 'direct' ? 30 : o.status === 'wildcard' ? 25 : 0) + (o.event.surface === p.preferredSurface ? 6 : 0) - o.travel / 600 - (o.event.level === 'Junior Slam' ? -30 : 0);
    const best = [...opts2].sort((a, b) => score(b) - score(a))[0];
    if (best.event.level.startsWith('Junior') || best.event.level === 'Continental') return { kind: 'junior', eventId: best.event.id };
    return { kind: 'compete', eventId: best.event.id, doubles: best.doublesOk };
  }
  return { kind: 'train', focus: c.defaultTrain.focus, intensity: p.fatigue < 20 ? (opts.aggressive ? 'hard' : 'normal') : p.fatigue < 40 ? 'normal' : 'light' };
}

export function hasPendingStop(u: any) {
  const c = careerOf(u);
  return !!(c.decision || u.liveEvent || u.seasonEnded || c.retired);
}
export function nextPlannedCompete(u: any) {
  const c = careerOf(u);
  return Object.entries(c.plan).filter(([, pl]) => pl.kind === 'compete' || pl.kind === 'junior').map(([k]) => k).sort()[0] ?? null;
}

export { wk as weekKeyOf, ROUND_NAME, weekKey };
export type { Decision };
