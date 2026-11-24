/*
 * Storage for career saves and the legacy profile.
 *
 * All GitHub Pages games of this account share one origin and one ~5 MB
 * localStorage quota, which is usually full. Saves (15-40 MB worlds) live in
 * IndexedDB only. The small profile is kept in IndexedDB too, with an
 * in-memory copy so reads stay synchronous. If IndexedDB is unavailable the
 * game still runs, but nothing persists (the UI warns about it).
 */
const DB_NAME = 'tennis-stars';
const SLOTS = 'slots';
const KV = 'kv';

let db: IDBDatabase | null = null;
let failed = false;
const kvMem = new Map<string, string>();
const slotMem = new Map<number, any>();
let onError: (msg: string) => void = () => {};
export function onStorageError(fn: (msg: string) => void) { onError = fn; }
export function storageAvailable() { return !!db; }

function req<T>(r: IDBRequest<T>): Promise<T> { return new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
function done(tx: IDBTransaction): Promise<void> { return new Promise((res, rej) => { tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error); }); }
export function describe(e: unknown): string {
  const name = (e as { name?: string } | null)?.name ?? '';
  if (name === 'QuotaExceededError') return 'Browser storage is full';
  if (name === 'SecurityError') return 'Browser storage is blocked for this site';
  return 'Save failed';
}

export async function initStorage(): Promise<void> {
  if (db || failed) return;
  try {
    if (typeof indexedDB === 'undefined') { failed = true; return; }
    db = await new Promise<IDBDatabase>((res, rej) => {
      const r = indexedDB.open(DB_NAME, 1);
      r.onupgradeneeded = () => { r.result.createObjectStore(SLOTS); r.result.createObjectStore(KV); };
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); r.onblocked = () => rej(new Error('blocked'));
    });
    const tx = db.transaction(KV, 'readonly').objectStore(KV);
    const [keys, vals] = await Promise.all([req(tx.getAllKeys()), req(tx.getAll())]);
    keys.forEach((k, i) => kvMem.set(String(k), String(vals[i])));
    try { void navigator.storage?.persist?.(); } catch { /* optional */ }
  } catch (e) { console.warn('IndexedDB unavailable', e); db = null; failed = true; }
}

export function kvGet(key: string): string | null { return kvMem.get(key) ?? null; }
export function kvSet(key: string, value: string) {
  kvMem.set(key, value);
  if (!db) return;
  try { const tx = db.transaction(KV, 'readwrite'); tx.objectStore(KV).put(value, key); tx.onerror = () => onError(describe(tx.error)); tx.onabort = () => onError(describe(tx.error)); } catch (e) { onError(describe(e)); }
}

export interface SlotMeta { slot: number; name: string; tour: string; age: number; year: number; week: number; rank: number; potential: string; retired: boolean; grade?: string | null; updatedAt: string }

export async function listSlots(): Promise<SlotMeta[]> {
  const raw = kvGet('slot-meta');
  try { return raw ? JSON.parse(raw) : []; } catch { return []; }
}
function setMeta(rows: SlotMeta[]) { kvSet('slot-meta', JSON.stringify(rows.sort((a, b) => a.slot - b.slot))); }

export async function saveSlot(slot: number, universe: any, meta: Omit<SlotMeta, 'slot' | 'updatedAt'>): Promise<void> {
  slotMem.set(slot, universe);
  const rows = (await listSlots()).filter((r) => r.slot !== slot);
  rows.push({ ...meta, slot, updatedAt: new Date().toISOString() });
  setMeta(rows);
  if (!db) return;
  try { const tx = db.transaction(SLOTS, 'readwrite'); tx.objectStore(SLOTS).put(universe, slot); await done(tx); }
  catch (e) { onError(describe(e)); throw e; }
}
export async function loadSlot(slot: number): Promise<any | null> {
  if (!db) return slotMem.get(slot) ?? null;
  try { const tx = db.transaction(SLOTS, 'readonly'); return (await req(tx.objectStore(SLOTS).get(slot))) ?? null; }
  catch (e) { onError(describe(e)); return null; }
}
export async function deleteSlot(slot: number): Promise<void> {
  slotMem.delete(slot);
  setMeta((await listSlots()).filter((r) => r.slot !== slot));
  if (!db) return;
  try { const tx = db.transaction(SLOTS, 'readwrite'); tx.objectStore(SLOTS).delete(slot); await done(tx); } catch (e) { onError(describe(e)); }
}
