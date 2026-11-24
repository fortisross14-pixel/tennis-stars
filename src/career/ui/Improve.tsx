import React from 'react';
import { careerOf } from '../engine';
import { EQUIPMENT, PACKS, PACK_PRICES } from '../data';
import type { PackTier, StaffKey } from '../types';
import { Cards } from './Cards';
import { Team } from './Team';
import { money } from './common';
import { ArTabs } from './arena/kit';

const SUBTABS: [string, string][] = [['cards', 'Cards'], ['shop', 'Shop'], ['equipment', 'Equipment'], ['team', 'Team & doubles']];
const SLOT_NAME: Record<string, string> = { racquet: 'Racquet', strings: 'Strings', shoes: 'Shoes', body: 'Recovery gear', tech: 'Analysis' };

export function Improve({ u, sub, go, busy, a, onPlayer }: {
  u: any; sub: string; go: (page: string, ...parts: string[]) => void; busy: boolean; onPlayer: (id: string) => void;
  a: { openPack: (i: number) => Promise<string[]>; mergePacks: (t: PackTier) => void; playCard: (uid: string) => void; sellCard: (uid: string) => void; staff: (k: StaffKey, l: number) => void; partner: (id: string | null) => void; buyPack: (t: PackTier) => void; buyEquipment: (id: string) => void };
}) {
  const c = careerOf(u);
  const tab = SUBTABS.some(([k]) => k === sub) ? sub : 'cards';
  return <div className="cs-page">
    <div className="ar-subbar flat"><ArTabs small tabs={SUBTABS} value={tab} onChange={(k) => go('improve', k)} badge={{ cards: c.packs.length || undefined } as any} /><span className="ar-chip">Bank <b>{money(c.money)}</b></span></div>
    {tab === 'cards' && <Cards u={u} busy={busy} onOpen={a.openPack} onMerge={a.mergePacks} onPlay={a.playCard} onSell={a.sellCard} />}
    {tab === 'shop' && <section className="cs-panel">
      <div className="cs-title-row"><h2>Card shop</h2><span className="muted">Packs bought here land in Cards, ready to open.</span></div>
      <div className="cs-packs">{(Object.keys(PACKS) as PackTier[]).map((t) => <div key={t} className="cs-pack" style={{ background: PACKS[t].color }}>
        <strong>{PACKS[t].name}</strong><span>{PACKS[t].cards} cards · {Object.entries(PACKS[t].odds).filter(([, v]) => v > 0).map(([r, v]) => `${r} ${Math.round(v * 100)}%`).join(' · ')}</span>
        <button disabled={busy || c.money < PACK_PRICES[t]} onClick={() => a.buyPack(t)}>Buy · {money(PACK_PRICES[t])}</button>
      </div>)}</div>
    </section>}
    {tab === 'equipment' && <section className="cs-panel">
      <div className="cs-title-row"><h2>Equipment</h2><span className="muted">Permanent. One item per slot: buying a better one replaces the old one. Equipment can lift a skill a little past your potential.</span></div>
      <div className="cs-equip">{Object.keys(SLOT_NAME).map((slot) => <article key={slot}><h4>{SLOT_NAME[slot]}</h4>
        {EQUIPMENT.filter((e) => e.slot === slot).map((e) => { const own = c.equipment.includes(e.id); return <div key={e.id} className={`cs-equip-item ${own ? 'own' : ''}`}>
          <span>{e.icon}</span><div><strong>{e.name}</strong><small>{e.desc}</small></div>
          {own ? <em>Owned</em> : <button disabled={busy || c.money < e.price} onClick={() => a.buyEquipment(e.id)}>{money(e.price)}</button>}
        </div>; })}
      </article>)}</div>
    </section>}
    {tab === 'team' && <Team u={u} busy={busy} onStaff={a.staff} onPartner={a.partner} onPlayer={onPlayer} />}
  </div>;
}
