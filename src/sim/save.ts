import { GameState } from './types';

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
}

function slotKey(id: 1 | 2 | 3): string {
  return `${STORAGE_PREFIX}slot-${id}`;
}

export function loadSlot(id: 1 | 2 | 3): SaveSlot | null {
  try {
    const raw = localStorage.getItem(slotKey(id));
    if (!raw) return null;
    return JSON.parse(raw) as SaveSlot;
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
