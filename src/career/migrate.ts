// Old saves must never break. Every field added to Career gets a default here;
// loading runs the Chronicle world migration first, then this.
import * as M from '../sim/migrations.js';
import { CAREER_VERSION, buildFx, applySkills } from './engine';
import type { Career } from './types';

const { ensureUniverseData } = M as any;

const DEFAULTS: Partial<Career> = {
  staff: { coach: 0, physio: 0, fitness: 0, mental: 0 }, federation: false, turnedPro: false, cardPlays: 0, hand: [], packs: [],
  boost: null, specials: [], wildcardTokens: 0, defaultTrain: { focus: 'balanced', intensity: 'normal' }, plan: {}, watchMatches: true,
  decision: null, live: null, pendingWeek: null, lastReport: null, reports: [], seasons: [], seasonPrize: 0, totalPrize: 0,
  milestones: {}, counters: {}, coinEvents: [], coinsTotal: 0, trinkets: [], noInjuryUntilYear: 0, seasonReview: null,
  retired: false, legacy: null, uid: 1,
};

export function migrateCareer(u: any) {
  ensureUniverseData(u);
  const c = u.career as Career;
  if (!c) throw new Error('Not a Tennis Stars career save');
  for (const [k, v] of Object.entries(DEFAULTS)) if ((c as any)[k] === undefined) (c as any)[k] = structuredClone(v);
  c.fx = { ...buildFx(c.trinkets ?? [], {}), ...(c.fx ?? {}) };
  if (!c.current) c.current = { kind: 'train', ...c.defaultTrain };
  c.version = CAREER_VERSION;
  u.settings.seasonSetupComplete = true;
  if (!c.retired) applySkills(u);
  return u;
}
