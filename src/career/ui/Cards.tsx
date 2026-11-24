import React, { useState } from 'react';
import { careerOf, canPlay, maxPlays, handLimit } from '../engine';
import { CARD_MAP, CARD_SELL, KIND_LABEL } from '../cards';
import { PACKS, RARITY_COLOR } from '../data';
import type { PackTier } from '../types';
import { Modal, money } from './common';

export function CardView({ id, children, dim }: { id: string; children?: React.ReactNode; dim?: boolean }) {
  const d = CARD_MAP[id]; if (!d) return null;
  return <div className={`cs-card r-${d.rarity} ${dim ? 'dim' : ''}`} style={{ borderColor: RARITY_COLOR[d.rarity] }}>
    <header style={{ background: RARITY_COLOR[d.rarity] }}><span>{KIND_LABEL[d.kind]}</span><span>{d.rarity}</span></header>
    <div className="cs-card-icon">{d.icon}</div>
    <strong>{d.name}</strong>
    <p>{d.desc}</p>
    {children}
  </div>;
}

export function Cards({ u, busy, onOpen, onMerge, onPlay, onSell }: { u: any; busy: boolean; onOpen: (i: number) => Promise<string[]>; onMerge: (t: PackTier) => void; onPlay: (uid: string) => void; onSell: (uid: string) => void }) {
  const c = careerOf(u);
  const [reveal, setReveal] = useState<{ tier: PackTier; cards: string[] } | null>(null);
  const counts = c.packs.reduce((m, t) => ({ ...m, [t]: (m[t] ?? 0) + 1 }), {} as Record<string, number>);
  const sorted = [...c.hand].sort((a, b) => (CARD_MAP[a.id]?.kind ?? '').localeCompare(CARD_MAP[b.id]?.kind ?? '') || a.id.localeCompare(b.id));
  return <div className="cs-page">
    <section className="cs-panel">
      <div className="cs-title-row"><h2>Packs</h2><span className="muted">{c.cardPlays}/{maxPlays(c)} card plays this week · one play refills every two weeks</span></div>
      {!c.packs.length && <p className="muted">No packs. You earn one every four weeks of work, for titles, deep runs, milestones and at the end of each season.</p>}
      <div className="cs-packs">
        {(Object.keys(PACKS) as PackTier[]).filter((t) => counts[t]).map((t) => <div key={t} className="cs-pack" style={{ background: PACKS[t].color }}>
          <strong>{PACKS[t].name}</strong><span>×{counts[t]} · {PACKS[t].cards} cards</span>
          <button disabled={busy} onClick={async () => { const i = c.packs.indexOf(t); const got = await onOpen(i); setReveal({ tier: t, cards: got }); }}>Open</button>
          {t !== 'elite' && counts[t] >= 4 && <button className="ghost" disabled={busy} onClick={() => onMerge(t)}>Merge 4 → 1 better</button>}
        </div>)}
      </div>
    </section>
    <section className="cs-panel">
      <div className="cs-title-row"><h2>Your hand</h2><span className="muted">{c.hand.length}/{handLimit(c)} · extra cards are sold automatically</span></div>
      {!c.hand.length && <p className="muted">Open packs to fill your hand.</p>}
      <div className="cs-hand">{sorted.map((h) => { const err = canPlay(u, h.uid); const d = CARD_MAP[h.id]; return <CardView key={h.uid} id={h.id} dim={!!err}>
        <div className="cs-card-actions"><button disabled={busy || !!err} title={err ?? ''} onClick={() => onPlay(h.uid)}>Play</button><button className="ghost" disabled={busy} onClick={() => onSell(h.uid)}>Sell {money(CARD_SELL[d.rarity])}</button></div>
        {err && <small className="cs-card-err">{err}</small>}
      </CardView>; })}</div>
    </section>
    {reveal && <Modal title={`${PACKS[reveal.tier].name}`} onClose={() => setReveal(null)} wide footer={<button className="cs-primary" onClick={() => setReveal(null)}>Add to hand</button>}>
      <div className="cs-hand reveal">{reveal.cards.map((id, i) => <CardView key={i} id={id} />)}</div>
    </Modal>}
  </div>;
}
