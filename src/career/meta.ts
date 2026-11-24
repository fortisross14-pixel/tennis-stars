import { kvGet, kvSet } from './storage';
import { CRATES, DUPLICATE_REFUND, TRINKETS, TRINKET_RARITIES, UPGRADE_MAP, trinketSlots, type TrinketRarity } from './legacy';
import type { CoinEvent } from './types';

// Profile-wide progression that survives between careers.
const META_KEY = 'meta';

export interface CareerRecord { name: string; tour: string; country: string; potential: string; peak: number; titles: number; majors: number; grade: string; coins: number; endYear: number; age: number }
export interface Meta {
  coins: number; lifetime: number;
  upgrades: Record<string, number>;
  trinkets: string[]; equipped: string[];
  milestones: Record<string, number>;
  careers: number; completed: number;
  history: CareerRecord[];
}
const EMPTY: Meta = { coins: 0, lifetime: 0, upgrades: {}, trinkets: [], equipped: [], milestones: {}, careers: 0, completed: 0, history: [] };

export function loadMeta(): Meta {
  try {
    const raw = kvGet(META_KEY);
    if (!raw) return { ...EMPTY, upgrades: {}, trinkets: [], equipped: [], milestones: {}, history: [] };
    const parsed = JSON.parse(raw) as Partial<Meta>;
    const owned = new Set((parsed.trinkets ?? []).filter((id) => TRINKETS.some((t) => t.id === id)));
    const m: Meta = { ...EMPTY, ...parsed, upgrades: { ...(parsed.upgrades ?? {}) }, milestones: { ...(parsed.milestones ?? {}) }, history: [...(parsed.history ?? [])], trinkets: [...owned], equipped: (parsed.equipped ?? []).filter((id) => owned.has(id)) };
    m.equipped = m.equipped.slice(0, trinketSlots(m.upgrades));
    return m;
  } catch { return { ...EMPTY, upgrades: {}, trinkets: [], equipped: [], milestones: {}, history: [] }; }
}
export function saveMeta(m: Meta) { kvSet(META_KEY, JSON.stringify(m)); }

export function creditCoins(m: Meta, events: CoinEvent[]): Meta {
  const next = { ...m, milestones: { ...m.milestones } };
  for (const e of events) {
    next.coins += e.amount; next.lifetime += e.amount;
    if (e.milestone) next.milestones[e.milestone] = (next.milestones[e.milestone] ?? 0) + 1;
  }
  return next;
}
export function upgradeCost(m: Meta, id: string): number | null {
  const def = UPGRADE_MAP[id]; if (!def) return null;
  const lvl = m.upgrades[id] ?? 0;
  return lvl >= def.costs.length ? null : def.costs[lvl];
}
export function buyUpgrade(m: Meta, id: string): Meta | null {
  const cost = upgradeCost(m, id);
  if (cost == null || m.coins < cost) return null;
  return { ...m, coins: m.coins - cost, upgrades: { ...m.upgrades, [id]: (m.upgrades[id] ?? 0) + 1 } };
}
export function openCrate(m: Meta, crateId: string, rand: () => number = Math.random): { meta: Meta; trinket: string; duplicate: boolean; refund: number } | null {
  const crate = CRATES.find((c) => c.id === crateId);
  if (!crate || m.coins < crate.cost) return null;
  let roll = rand(), rarity: TrinketRarity = 'common';
  for (const r of TRINKET_RARITIES) { roll -= crate.odds[r]; if (roll <= 0) { rarity = r; break; } }
  const pool = TRINKETS.filter((t) => t.rarity === rarity);
  const pick = pool[Math.floor(rand() * pool.length)];
  const duplicate = m.trinkets.includes(pick.id);
  const refund = duplicate ? Math.round(crate.cost * DUPLICATE_REFUND) : 0;
  const meta = { ...m, coins: m.coins - crate.cost + refund, trinkets: duplicate ? m.trinkets : [...m.trinkets, pick.id] };
  return { meta, trinket: pick.id, duplicate, refund };
}
export function toggleEquip(m: Meta, id: string): Meta {
  if (m.equipped.includes(id)) return { ...m, equipped: m.equipped.filter((x) => x !== id) };
  if (!m.trinkets.includes(id) || m.equipped.length >= trinketSlots(m.upgrades)) return m;
  return { ...m, equipped: [...m.equipped, id] };
}
