import React, { useEffect, useRef, useState } from 'react';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { initStorage, listSlots, loadSlot, saveSlot, deleteSlot, storageAvailable, onStorageError, type SlotMeta } from './career/storage';
import { loadMeta, saveMeta, creditCoins, buyUpgrade, openCrate, toggleEquip, META_KEY, type Meta } from './career/meta';
import { CAREER_VERSION, setLoadout, queueMatchCard, buyPack, buyEquipment, createCareer, careerOf, me, playWeek, careerLive, finishLiveEvent, resolveDecision, openPack, mergePacks, playCard, sellCard, setStaff, setPartner, startNextSeason, weekKeyOf, legacyScore, applySkills } from './career/engine';
import { migrateCareer } from './career/migrate';
import { botDecision } from './career/bot';
import { autoPlan } from './career/engine';
import { Menu } from './career/ui/Menu';
import { Game, type GameActions } from './career/ui/Game';
import type { WeekPlan } from './career/types';
import './career/career.css';

const nextFrame = () => new Promise((r) => setTimeout(r, 16));

function slotMeta(u: any): Omit<SlotMeta, 'slot' | 'updatedAt'> {
  const c = careerOf(u), p = me(u);
  return { name: `${p.firstName} ${p.lastName}`, tour: c.tour, age: p.age, year: u.year, week: u.week, rank: p.rankingPoints > 0 ? p.ranking : 999, potential: c.potential, retired: c.retired, grade: c.legacy?.grade ?? null };
}

function App() {
  const [ready, setReady] = useState(false);
  const [slots, setSlots] = useState<SlotMeta[]>([]);
  const [meta, setMeta] = useState<Meta>(() => loadMeta());
  const [slot, setSlot] = useState<number | null>(null);
  const [u, setU] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const saving = useRef<Promise<void> | null>(null);
  const metaRef = useRef(meta); metaRef.current = meta;
  // profile changes from a game action are saved together with the slot (see saveSlot)
  const pendingMeta = useRef<Meta | null>(null);

  useEffect(() => { onStorageError((m) => setNotice(`⚠ ${m}`)); initStorage().then(async () => { setMeta(loadMeta()); setSlots(await listSlots()); setReady(true); }); }, []);

  const persistMeta = (m: Meta) => { setMeta(m); saveMeta(m); };
  const settle = (next: any) => {
    // credit legacy coins as they are earned
    const c = careerOf(next);
    let m = metaRef.current;
    if (c.coinEvents.length) { m = creditCoins(m, c.coinEvents); c.coinEvents = []; }
    if (c.retired && !c.counters['recorded']) {
      c.counters['recorded'] = 1;
      const p = me(next), k = p.career;
      m = { ...m, completed: m.completed + 1, history: [...m.history, { name: `${p.firstName} ${p.lastName}`, tour: c.tour, country: p.country, potential: c.potential, peak: k.peakRanking, titles: k.titles, majors: k.majors, grade: c.legacy?.grade ?? legacyScore(next).grade, coins: c.coinsTotal, endYear: next.year - 1, age: p.age }].slice(-60) };
    }
    if (m !== metaRef.current) { metaRef.current = m; setMeta(m); pendingMeta.current = m; }
    const copy = { ...next };
    setU(copy);
    return copy;
  };
  const persist = async (next: any): Promise<boolean> => {
    if (slot == null) return true;
    let ok = true;
    const run = async () => {
      const m = pendingMeta.current;
      try { await saveSlot(slot, next, slotMeta(next), m ? { [META_KEY]: JSON.stringify(m) } : {}); if (pendingMeta.current === m) pendingMeta.current = null; }
      catch { ok = false; /* reported via onStorageError */ }
    };
    saving.current = (saving.current ?? Promise.resolve()).then(run);
    await saving.current;
    return ok;
  };
  const act = async (label: string, fn: (u: any) => void, { save = true }: { save?: boolean } = {}) => {
    if (!u || busy) return;
    setBusy(true); setNotice(label);
    await nextFrame();
    try {
      fn(u); applySkills(u);
      const next = settle(u);
      if (save && !(await persist(next))) { setNotice('⚠ Not saved: browser storage is full or blocked. Free some space; progress since the last save will be lost if you close the game.'); return; }
      setNotice('');
    } catch (e: any) {
      // the world may be half-updated: never save it, roll back to the last good save instead
      console.error(e);
      pendingMeta.current = null;
      const back = slot != null ? await loadSlot(slot) : null;
      if (back) { try { migrateCareer(back); setU(back); setMeta(loadMeta()); } catch { /* keep the in-memory state */ } }
      setNotice(`Something went wrong (${e?.message ?? e}). ${back ? 'The week was rolled back to the last save.' : ''}`);
    }
    finally { setBusy(false); }
  };

  const actions: GameActions = {
    plan: (p: WeekPlan) => { careerOf(u).current = p; settle(u); },
    play: () => act('Playing the week…', (x) => { playWeek(x, { live: true }); }),
    auto: (weeks) => act('Autopilot…', (x) => {
      const c = careerOf(x);
      for (let i = 0; i < weeks; i += 1) {
        if (c.decision || x.seasonEnded || x.liveEvent || c.retired) break;
        const key = weekKeyOf(x.year, x.week);
        const planned = c.plan[key];
        c.current = planned ?? autoPlan(x);
        if (planned) delete c.plan[key];
        playWeek(x, { live: false });
      }
    }),
    decision: (id) => act('…', (x) => { resolveDecision(x, id); }),
    live: async (mode, slotN = null) => { await act('Playing…', (x) => { careerLive(x, mode as any, slotN); }); },
    finishEvent: () => act('Finishing the tournament…', (x) => finishLiveEvent(x)),
    toggleWatch: () => { const c = careerOf(u); c.watchMatches = !c.watchMatches; settle(u); },
    openPack: async (i) => { let got: string[] = []; await act('Opening…', (x) => { got = openPack(x, i); }); return got; },
    mergePacks: (t) => act('Merging…', (x) => { mergePacks(x, t); }),
    playCard: (uid) => act('Playing card…', (x) => { const notes = playCard(x, uid); setTimeout(() => setNotice(notes.join(' · ')), 30); }),
    sellCard: (uid) => act('Selling…', (x) => sellCard(x, uid)),
    staff: (k, lvl) => act('Updating staff…', (x) => { const err = setStaff(x, k, lvl); if (err) setTimeout(() => setNotice(err), 30); }),
    partner: (id) => act('Updating doubles…', (x) => setPartner(x, id)),
    setPlan: (week, plan) => { const c = careerOf(u); const key = weekKeyOf(u.year, week); if (week === u.week) { if (plan) c.current = plan; } else if (plan) c.plan[key] = plan; else delete c.plan[key]; settle(u); },
    buyPack: (t) => act('Buying…', (x) => { const err = buyPack(x, t); setTimeout(() => setNotice(err ?? 'Pack added to Cards.'), 30); }),
    loadout: (uids) => act('Packing your bag…', (x) => { const err = setLoadout(x, uids); if (err) setTimeout(() => setNotice(err), 30); }),
    queueCard: (uid, set = -1) => act('…', (x) => { const err = queueMatchCard(x, uid, set); if (err) setTimeout(() => setNotice(err), 30); }),
    buyEquipment: (id) => act('Buying…', (x) => { const err = buyEquipment(x, id); if (err) setTimeout(() => setNotice(err), 30); }),
    nextSeason: () => act('Opening the new season…', (x) => startNextSeason(x)),
    retireNow: () => act('Announcing your retirement…', (x) => { careerOf(x).counters.retire = 1; startNextSeason(x); }),
    exit: async () => { if (u) await persist(u); setU(null); setSlot(null); setSlots(await listSlots()); window.location.hash = ''; },
    save: () => { if (u) void persist(u); },
  };

  if (!ready) return <div className="cs-loading">Loading…</div>;
  if (!u) return <Menu slots={slots} meta={meta} busy={busy} storageOk={storageAvailable()}
    onNew={async (n, setup) => {
      setBusy(true); setNotice('Building the world…'); await nextFrame();
      try {
        const next = createCareer({ ...setup, upgrades: meta.upgrades, trinkets: meta.equipped });
        persistMeta({ ...metaRef.current, careers: metaRef.current.careers + 1 });
        setSlot(n); setU(next); window.location.hash = '#/week';
        let ok = true;
        try { await saveSlot(n, next, slotMeta(next)); } catch { ok = false; }
        setSlots(await listSlots());
        setBusy(false); setNotice(ok ? '' : '⚠ Not saved: browser storage is full or blocked.');
      } catch (e: any) { console.error(e); setBusy(false); setNotice(`Could not start the career (${e?.message ?? e}).`); }
    }}
    onLoad={async (n) => {
      setBusy(true);
      try {
        const loaded = await loadSlot(n);
        if (!loaded) { setNotice('That save could not be loaded.'); return; }
        // never stamp a save from a newer build down to this version
        if ((loaded.career?.version ?? 1) > CAREER_VERSION || (loaded.schemaVersion ?? 1) > 9) { setNotice('This save was made by a newer version of the game. Reload the page to update, then try again.'); return; }
        migrateCareer(loaded); setSlot(n); setU(loaded); window.location.hash = loaded.liveEvent ? '#/event' : '#/week';
      } catch (e: any) { console.error(e); setNotice(`That save could not be opened (${e?.message ?? e}). It has not been changed.`); }
      finally { setBusy(false); }
    }}
    onDelete={async (n) => { if (!window.confirm(`Delete career slot ${n}? This cannot be undone.`)) return; await deleteSlot(n); setSlots(await listSlots()); }}
    onBuy={(id) => { const m = buyUpgrade(meta, id); if (m) persistMeta(m); }}
    onCrate={async (id) => { const r = openCrate(meta, id); if (!r) return null; persistMeta(r.meta); return r.duplicate ? `${r.trinket}:dup` : r.trinket; }}
    onEquip={(id) => persistMeta(toggleEquip(meta, id))} />;
  return <Game u={u} busy={busy} notice={notice} a={actions} />;
}

export default function Root() { return <ErrorBoundary><App /></ErrorBoundary>; }
export { botDecision };
