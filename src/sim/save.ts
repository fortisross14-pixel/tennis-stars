import { GameState, Player } from './types';
import { rollTrait } from './traits';
import { COUNTRIES } from '../data/countries';

const STORAGE_PREFIX = 'tennis-stars:';

export interface SaveSlot {
  slotId: 1 | 2 | 3;
  name: string;       // user-given save name (e.g., "My career", or auto: "Year 3, Wk 12")
  savedAt: number;    // unix ms
  state: GameState;
}

export interface SlotSummary {
  slotId: 1 | 2 | 3;
  empty: boolean;
  name?: string;
  year?: number;
  week?: number;
  savedAt?: number;
  topPlayer?: string; // surname of current #1 for flavor
  migrated?: boolean; // true if loading required schema migration
}

function slotKey(id: 1 | 2 | 3): string {
  return `${STORAGE_PREFIX}slot-${id}`;
}

// Backfill any missing fields on loaded state — keeps old saves working when we add new mechanics.
// Returns { state, didMigrate } so callers can show a toast if anything was upgraded.
export function migrateState(state: GameState): { state: GameState; didMigrate: boolean } {
  let didMigrate = false;
  for (const p of state.players) {
    // Trait was added later — assign randomly if missing
    if (!(p as Partial<Player>).trait) {
      (p as Player).trait = rollTrait();
      didMigrate = true;
    }
    // yearHistory, bestRanking, weeksAtNo1 etc. — defensive backfills
    if (!p.yearHistory) { p.yearHistory = []; didMigrate = true; }
    if (p.bestRanking === undefined) { p.bestRanking = 999; didMigrate = true; }
    if (p.weeksAtNo1 === undefined) { p.weeksAtNo1 = 0; didMigrate = true; }
    if (p.yearTitles === undefined) { p.yearTitles = 0; didMigrate = true; }
    if (p.yearGS === undefined) { p.yearGS = 0; didMigrate = true; }
    if (!p.iso2) {
      // Older saves before iso2 was added — look up by ATP 3-letter code in COUNTRIES table.
      const country = COUNTRIES.find(c => c.code === p.countryCode);
      p.iso2 = country?.iso2 || p.countryCode.slice(0, 2).toLowerCase();
      didMigrate = true;
    }
  }
  if (didMigrate) {
    console.info('[tennis-stars] Save upgraded: backfilled missing fields (traits, etc.)');
  }
  return { state, didMigrate };
}

export function loadSlot(id: 1 | 2 | 3): SaveSlot | null {
  try {
    const raw = localStorage.getItem(slotKey(id));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SaveSlot;
    // Migrate on load so any missing fields are backfilled before the game touches them
    const { state, didMigrate } = migrateState(parsed.state);
    parsed.state = state;
    if (didMigrate) {
      // Persist the migrated save so it's clean next time
      try {
        localStorage.setItem(slotKey(id), JSON.stringify(parsed));
      } catch {}
    }
    return parsed;
  } catch (e) {
    console.error('loadSlot failed', e);
    return null;
  }
}

export function saveSlot(id: 1 | 2 | 3, state: GameState, name?: string): void {
  try {
    const payload: SaveSlot = {
      slotId: id,
      name: name || autoSaveName(state),
      savedAt: Date.now(),
      state,
    };
    localStorage.setItem(slotKey(id), JSON.stringify(payload));
  } catch (e) {
    console.error('saveSlot failed', e);
  }
}

export function deleteSlot(id: 1 | 2 | 3): void {
  try {
    localStorage.removeItem(slotKey(id));
  } catch (e) {
    console.error('deleteSlot failed', e);
  }
}

export function listSlots(): SlotSummary[] {
  const out: SlotSummary[] = [];
  for (const id of [1, 2, 3] as const) {
    const s = loadSlot(id);
    if (!s) {
      out.push({ slotId: id, empty: true });
    } else {
      // Find current top player
      const ranked = [...s.state.players]
        .filter(p => !p.retired)
        .sort((a, b) => b.yearPoints - a.yearPoints);
      const top = ranked[0];
      out.push({
        slotId: id,
        empty: false,
        name: s.name,
        year: s.state.year,
        week: s.state.currentWeek,
        savedAt: s.savedAt,
        topPlayer: top ? `${top.firstName.charAt(0)}. ${top.surname}` : undefined,
      });
    }
  }
  return out;
}

function autoSaveName(state: GameState): string {
  return `Year ${state.year}, Wk ${state.currentWeek}`;
}
