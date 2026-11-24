// A simple autopilot that plays a whole career: used by the balance harness
// and by the "Autopilot" button. It makes reasonable, not optimal, choices.
import { autoPlan, careerOf, me, playWeek, resolveDecision, startNextSeason, openPack, playCard, canPlay, setStaff, weeklyStaffCost, mergePacks } from './engine';
import { CARD_MAP } from './cards';
import { STAFF } from './data';
import type { StaffKey } from './types';

export function botDecision(u: any) {
  const c = careerOf(u), d = c.decision; if (!d) return;
  const p = me(u);
  if (d.id === 'retire') {
    const keep = d.options.find((o) => o.id === 'continue');
    const wantsOut = !keep || p.age >= 35 || (p.age >= 31 && p.ranking > 150) || (p.age >= 33 && p.ranking > 60);
    resolveDecision(u, wantsOut ? 'retire' : 'continue');
    return;
  }
  if (d.id === 'turn-pro') { resolveDecision(u, p.ranking <= 400 ? 'pro' : 'junior'); return; }
  const safe = d.options.find((o) => !(o.effects.injuryWeeks) && (o.effects.fatigue ?? 0) <= 10 && (o.effects.money ?? 0) >= -9000) ?? d.options[0];
  resolveDecision(u, safe.id);
}

export function botCards(u: any, compete: boolean) {
  const c = careerOf(u), p = me(u);
  for (let i = c.packs.length - 1; i >= 0; i -= 1) openPack(u, i);
  for (const t of ['bronze', 'silver', 'gold'] as const) while (mergePacks(u, t)) { /* merge */ }
  const order = [...c.hand].sort((a, b) => score(b.id) - score(a.id));
  function score(id: string) {
    const d = CARD_MAP[id]; if (!d) return 0;
    if (d.kind === 'potential') return 9; if (d.kind === 'special') return 8; if (d.kind === 'drill') return 6;
    if (d.kind === 'boost') return compete ? 7 : -1;
    if (d.kind === 'recovery') return d.heal ? (p.injury ? 10 : -1) : (p.fatigue > 40 ? 5 : -1);
    if (d.kind === 'wildcard') return 3; if (d.kind === 'money') return c.money < 5000 ? 6 : 2;
    return 0;
  }
  for (const h of order) {
    if (c.cardPlays <= 0) break;
    if (score(h.id) <= 0) continue;
    if (!canPlay(u, h.uid)) playCard(u, h.uid);
  }
}

export function botStaff(u: any) {
  const c = careerOf(u);
  for (const k of ['coach', 'physio', 'fitness', 'mental'] as StaffKey[]) {
    const next = c.staff[k] + 1; if (next > 3) continue;
    const add = STAFF[k].levels[next].weekly - STAFF[k].levels[c.staff[k]].weekly;
    if (c.money > (weeklyStaffCost(c) + add) * 40) setStaff(u, k, next);
  }
}

/** Play one week with the autopilot. Returns false when the career is over. */
export function botWeek(u: any, opts: { aggressive?: boolean } = {}): boolean {
  const c = careerOf(u);
  if (c.retired) return false;
  if (c.decision) botDecision(u);
  if (u.seasonEnded) { if (c.decision) botDecision(u); startNextSeason(u); return !c.retired; }
  const plan = autoPlan(u, opts);
  c.current = plan;
  botCards(u, plan.kind === 'compete' || plan.kind === 'junior');
  if (u.week % 13 === 0) botStaff(u);
  playWeek(u, { live: false });
  return !c.retired;
}
