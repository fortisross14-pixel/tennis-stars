// Old saves must never break. Every field added to Career gets a default here;
// loading runs the Chronicle world migration first, then this.
import * as M from '../sim/migrations.js';
import { CAREER_VERSION, buildFx, applySkills, monthSnapshot } from './engine';
import type { Career } from './types';
import { MILESTONE_MAP } from './legacy';
import { SPECIAL_MAP } from './data';

const { ensureUniverseData } = M as any;

const DEFAULTS: Partial<Career> = {
  staff: { coach: 0, physio: 0, fitness: 0, mental: 0 }, federation: false, turnedPro: false, cardPlays: 0, hand: [], packs: [],
  boost: null, specials: [], wildcardTokens: 0, defaultTrain: { focus: 'balanced', intensity: 'normal' }, plan: {}, watchMatches: true,
  decision: null, live: null, pendingWeek: null, lastReport: null, reports: [], seasons: [], seasonPrize: 0, totalPrize: 0,
  milestones: {}, counters: {}, coinEvents: [], coinsTotal: 0, trinkets: [], noInjuryUntilYear: 0, seasonReview: null,
  retired: false, legacy: null, uid: 1,
  matchLog: [], tournamentLog: [], unlocks: [], skillLog: [], equipment: [], watched: {},
  monthStart: null, monthReview: null,
};

export function migrateCareer(u: any) {
  ensureUniverseData(u);
  const c = u.career as Career;
  if (!c) throw new Error('Not a Tennis Stars career save');
  for (const [k, v] of Object.entries(DEFAULTS)) if ((c as any)[k] === undefined) (c as any)[k] = structuredClone(v);
  // backfill the unlock history from older saves
  if (!c.unlocks.length) {
    for (const [id, when] of Object.entries(c.milestones || {})) { const m = /^(\d+) · week (\d+)/.exec(String(when)); c.unlocks.push({ kind: 'milestone', id, label: MILESTONE_MAP[id]?.label ?? id, year: m ? +m[1] : u.year, week: m ? +m[2] : 1, age: 0 }); }
    for (const id of c.specials || []) c.unlocks.push({ kind: 'special', id, label: SPECIAL_MAP[id]?.name ?? id, year: u.year, week: u.week, age: 0 });
  }
  c.fx = { ...buildFx(c.trinkets ?? [], {}), ...(c.fx ?? {}) };
  if (!c.current) c.current = { kind: 'train', ...c.defaultTrain };
  if (!c.monthStart && !c.retired) c.monthStart = monthSnapshot(u);
  c.version = CAREER_VERSION;
  u.settings.seasonSetupComplete = true;
  if (!c.retired) applySkills(u);
  return u;
}
