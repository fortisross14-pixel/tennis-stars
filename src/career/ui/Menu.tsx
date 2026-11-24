import React, { useState } from 'react';
import { COUNTRIES } from '../../data/countries.js';
import { Flag } from '../../components/Common.jsx';
import { STYLES, STYLE_SURFACE } from '../data';
import { UPGRADES, TRINKETS, TRINKET_MAP, TRINKET_COLOR, CRATES, trinketSlots } from '../legacy';
import { upgradeCost, type Meta } from '../meta';
import type { SlotMeta } from '../storage';
import type { CareerSetup } from '../engine';
import { Modal } from './common';

const STYLE_DESC: Record<string, string> = {
  'Aggressive baseline': 'Big forehand, takes the ball early. At home on hard courts.',
  'Defensive baseline': 'Retrieves everything. Footwork and backhand; loves clay.',
  Counterpuncher: 'Turns defence into attack with the return and legs.',
  'All-court': 'Tactics and touch; comfortable everywhere.',
  'Serve-and-volley': 'Serve and net. Deadly on grass and indoors, lost on clay.',
  'Big server': 'Free points on serve. Indoors and grass are your stage.',
  'Clay grinder': 'Endurance and topspin. The clay swing is your season.',
  'Precision attacker': 'Clean ball-striking and patterns. Hard and indoor courts.',
};

export function Menu({ slots, meta, busy, storageOk, onNew, onLoad, onDelete, onBuy, onCrate, onEquip }: {
  slots: SlotMeta[]; meta: Meta; busy: boolean; storageOk: boolean;
  onNew: (slot: number, setup: Omit<CareerSetup, 'upgrades' | 'trinkets'>) => void; onLoad: (slot: number) => void; onDelete: (slot: number) => void;
  onBuy: (id: string) => void; onCrate: (id: string) => Promise<string | null>; onEquip: (id: string) => void;
}) {
  const [wizard, setWizard] = useState<number | null>(null);
  const [tab, setTab] = useState<'upgrades' | 'trinkets' | 'hall'>('upgrades');
  const [pulled, setPulled] = useState<string | null>(null);
  return <div className="cs-menu">
    <section className="cs-menu-hero">
      <div className="court-mark">TS</div>
      <h1>Tennis Stars</h1>
      <p>Start as a 15-year-old junior with nothing but a racquet. Choose every week: train, rest or compete. Climb from ITF qualifying to Grand Slam finals in a living world of a thousand players.</p>
      {!storageOk && <p className="cs-alert">This browser blocks storage: careers will not be saved when you close the tab.</p>}
      <div className="cs-coins"><span>🪙 {meta.coins.toLocaleString()}</span><small>legacy coins · {meta.careers} careers started</small></div>
    </section>
    <section className="cs-menu-body">
      <div className="cs-slots">{[1, 2, 3].map((n) => { const s = slots.find((x) => x.slot === n); return <article key={n} className={`cs-slot ${s ? '' : 'empty'}`}>
        <small>Career slot {n}</small>
        {s ? <>
          <h2>{s.name}</h2>
          <p>{s.tour} · {s.potential} · age {s.age}</p>
          <dl><div><dt>Season</dt><dd>{s.year} · week {s.week}</dd></div><div><dt>Ranking</dt><dd>{s.retired ? `Retired · grade ${s.grade}` : s.rank < 999 ? `No. ${s.rank}` : 'Unranked'}</dd></div></dl>
          <button disabled={busy} onClick={() => onLoad(n)}>{s.retired ? 'View career' : 'Continue'}</button>
          <button className="cs-secondary" disabled={busy} onClick={() => onDelete(n)}>Delete</button>
        </> : <>
          <h2>Empty</h2><p>A new player, a new world.</p>
          <button disabled={busy} onClick={() => setWizard(n)}>New career</button>
        </>}
      </article>; })}</div>

      <div className="cs-panel cs-legacy">
        <div className="cs-tabs">
          <button className={tab === 'upgrades' ? 'active' : ''} onClick={() => setTab('upgrades')}>Upgrades</button>
          <button className={tab === 'trinkets' ? 'active' : ''} onClick={() => setTab('trinkets')}>Trinkets ({meta.equipped.length}/{trinketSlots(meta.upgrades)} equipped)</button>
          <button className={tab === 'hall' ? 'active' : ''} onClick={() => setTab('hall')}>Past careers</button>
        </div>
        {tab === 'upgrades' && <div className="cs-upgrades">{UPGRADES.map((up) => { const lvl = meta.upgrades[up.id] ?? 0; const cost = upgradeCost(meta, up.id); return <article key={up.id}>
          <header><span>{up.icon}</span><strong>{up.name}</strong><em>{lvl}/{up.costs.length}</em></header>
          <ul>{up.levels.map((l, i) => <li key={i} className={i < lvl ? 'done' : ''}>{l}</li>)}</ul>
          {cost != null ? <button disabled={busy || meta.coins < cost} onClick={() => onBuy(up.id)}>Buy · 🪙 {cost}</button> : <span className="muted">Maxed</span>}
        </article>; })}</div>}
        {tab === 'trinkets' && <>
          <div className="cs-crates">{CRATES.map((cr) => <button key={cr.id} disabled={busy || meta.coins < cr.cost} onClick={async () => setPulled(await onCrate(cr.id))}><strong>{cr.name}</strong><span>🪙 {cr.cost}</span><small>{Object.entries(cr.odds).filter(([, v]) => v > 0).map(([r, v]) => `${r} ${Math.round(v * 100)}%`).join(' · ')}</small></button>)}</div>
          <p className="muted">Owned trinkets stay forever. Equip up to {trinketSlots(meta.upgrades)} for your next career.</p>
          <div className="cs-trinkets">{TRINKETS.map((t) => { const own = meta.trinkets.includes(t.id), eq = meta.equipped.includes(t.id); return <button key={t.id} disabled={!own} className={`${own ? 'own' : ''} ${eq ? 'eq' : ''}`} style={{ borderColor: TRINKET_COLOR[t.rarity] }} onClick={() => onEquip(t.id)}>
            <span>{own ? t.icon : '?'}</span><strong>{own ? t.name : 'Locked'}</strong><small>{own ? t.desc : t.rarity}</small>{eq && <em>Equipped</em>}
          </button>; })}</div>
        </>}
        {tab === 'hall' && <table className="data-table cs-table"><thead><tr><th>Player</th><th>Potential</th><th>Peak</th><th>Titles</th><th>Slams</th><th>Grade</th><th>Coins</th></tr></thead><tbody>
          {meta.history.slice().reverse().map((h, i) => <tr key={i}><td><Flag code={h.country} /> {h.name} <small className="muted">({h.tour}, retired {h.endYear} at {h.age})</small></td><td>{h.potential}</td><td>{h.peak < 999 ? `No. ${h.peak}` : '—'}</td><td>{h.titles}</td><td>{h.majors}</td><td><b>{h.grade}</b></td><td>{h.coins}</td></tr>)}
          {!meta.history.length && <tr><td colSpan={7} className="muted">Finished careers appear here.</td></tr>}</tbody></table>}
      </div>
    </section>
    {wizard != null && <NewCareer meta={meta} busy={busy} onCancel={() => setWizard(null)} onCreate={(setup) => { onNew(wizard, setup); setWizard(null); }} />}
    {pulled && <Modal title="Crate opened" onClose={() => setPulled(null)}><div className="cs-pull" style={{ borderColor: TRINKET_COLOR[TRINKET_MAP[pulled.split(':')[0]].rarity] }}><span>{TRINKET_MAP[pulled.split(':')[0]].icon}</span><strong>{TRINKET_MAP[pulled.split(':')[0]].name}</strong><p>{TRINKET_MAP[pulled.split(':')[0]].desc}</p>{pulled.includes(':dup') && <em>Duplicate: part of the cost was refunded.</em>}</div></Modal>}
  </div>;
}

function NewCareer({ meta, busy, onCancel, onCreate }: { meta: Meta; busy: boolean; onCancel: () => void; onCreate: (s: Omit<CareerSetup, 'upgrades' | 'trinkets'>) => void }) {
  const [first, setFirst] = useState(''), [last, setLast] = useState('');
  const [tour, setTour] = useState<'ATP' | 'WTA'>('ATP');
  const [country, setCountry] = useState('ESP');
  const [hand, setHand] = useState<'Right' | 'Left'>('Right');
  const [bh, setBh] = useState<'Two-handed' | 'One-handed'>('Two-handed');
  const [style, setStyle] = useState(STYLES[0]);
  const [age, setAge] = useState<15 | 16>(15);
  const ok = first.trim() && last.trim();
  const countries = [...COUNTRIES].sort((a: any, b: any) => a.name.localeCompare(b.name));
  return <Modal title="New career" onClose={onCancel} wide footer={<><button className="cs-secondary" onClick={onCancel}>Cancel</button><button className="cs-primary" disabled={!ok || busy} onClick={() => onCreate({ firstName: first.trim(), lastName: last.trim(), tour, country, handedness: hand, backhand: bh, style, startAge: age })}>{busy ? 'Building the world…' : 'Start career'}</button></>}>
    <div className="cs-form">
      <label>First name<input value={first} onChange={(e) => setFirst(e.target.value)} maxLength={20} autoFocus /></label>
      <label>Last name<input value={last} onChange={(e) => setLast(e.target.value)} maxLength={24} /></label>
      <label>Tour<select value={tour} onChange={(e) => setTour(e.target.value as 'ATP' | 'WTA')}><option value="ATP">Men (ATP)</option><option value="WTA">Women (WTA)</option></select></label>
      <label>Country<select value={country} onChange={(e) => setCountry(e.target.value)}>{countries.map((c: any) => <option key={c.code} value={c.code}>{c.name}</option>)}</select></label>
      <label>Plays<select value={hand} onChange={(e) => setHand(e.target.value as 'Right' | 'Left')}><option>Right</option><option>Left</option></select></label>
      <label>Backhand<select value={bh} onChange={(e) => setBh(e.target.value as 'Two-handed' | 'One-handed')}><option>Two-handed</option><option>One-handed</option></select></label>
      <label>Starting age<select value={age} onChange={(e) => setAge(Number(e.target.value) as 15 | 16)}><option value={15}>15 (longer junior career)</option><option value={16}>16 (a little more developed)</option></select></label>
    </div>
    <h4>Playing style</h4>
    <div className="cs-styles">{STYLES.map((s) => <button key={s} className={style === s ? 'active' : ''} onClick={() => setStyle(s)}><strong>{s}</strong><span>{STYLE_DESC[s]}</span><small>Best surface: {STYLE_SURFACE[s]}</small></button>)}</div>
    <p className="muted">Your potential is rolled when the career starts. Upgrades and equipped trinkets ({meta.equipped.map((id) => TRINKET_MAP[id]?.icon).join(' ') || 'none'}) apply automatically.</p>
  </Modal>;
}
