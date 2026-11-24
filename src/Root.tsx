import React, { useEffect, useRef, useState } from 'react';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { initStorage, listSlots, loadSlot, saveSlot, deleteSlot, storageAvailable, onStorageError, type SlotMeta } from './career/storage';
import { loadMeta, saveMeta, creditCoins, buyUpgrade, openCrate, toggleEquip, type Meta } from './career/meta';
import { buyPack, buyEquipment, createCareer, careerOf, me, playWeek, careerLive, finishLiveEvent, resolveDecision, openPack, mergePacks, playCard, sellCard, setStaff, setPartner, startNextSeason, weekKeyOf, legacyScore, applySkills } from './career/engine';
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
    if (m !== metaRef.current) persistMeta(m);
    const copy = { ...next };
    setU(copy);
    return copy;
  };
  const persist = async (next: any) => {
    if (slot == null) return;
    const run = async () => { try { await saveSlot(slot, next, slotMeta(next)); } catch { /* reported via onStorageError */ } };
    saving.current = (saving.current ?? Promise.resolve()).then(run);
    await saving.current;
  };
  const act = async (label: string, fn: (u: any) => void, { save = true }: { save?: boolean } = {}) => {
    if (!u || busy) return;
    setBusy(true); setNotice(label);
    await nextFrame();
    try { fn(u); applySkills(u); const next = settle(u); if (save) await persist(next); setNotice(''); }
    catch (e: any) { console.error(e); setNotice(`Something went wrong: ${e?.message ?? e}`); }
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
        await saveSlot(n, next, slotMeta(next)); setSlots(await listSlots());
      } finally { setBusy(false); setNotice(''); }
    }}
    onLoad={async (n) => { setBusy(true); try { const loaded = await loadSlot(n); if (loaded) { migrateCareer(loaded); setSlot(n); setU(loaded); window.location.hash = loaded.liveEvent ? '#/event' : '#/week'; } else setNotice('That save could not be loaded.'); } finally { setBusy(false); } }}
    onDelete={async (n) => { if (!window.confirm(`Delete career slot ${n}? This cannot be undone.`)) return; await deleteSlot(n); setSlots(await listSlots()); }}
    onBuy={(id) => { const m = buyUpgrade(meta, id); if (m) persistMeta(m); }}
    onCrate={async (id) => { const r = openCrate(meta, id); if (!r) return null; persistMeta(r.meta); return r.duplicate ? `${r.trinket}:dup` : r.trinket; }}
    onEquip={(id) => persistMeta(toggleEquip(meta, id))} />;
  return <Game u={u} busy={busy} notice={notice} a={actions} />;
}

export default function Root() { return <ErrorBoundary><App /></ErrorBoundary>; }
export { botDecision };
