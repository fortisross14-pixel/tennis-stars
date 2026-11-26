import React, { useState } from 'react';
import { careerOf, canPlay, maxPlays, handLimit } from '../engine';
import { CARD_MAP, CARD_SELL, KIND_LABEL, type CardDef } from '../cards';
import { PACKS, SKILL_LABEL } from '../data';
import type { PackTier, Rarity, SkillKey } from '../types';
import { money } from './common';
import { haptic } from './arena/kit';

const RARITY_NAME: Record<Rarity, string> = { common: 'Common', uncommon: 'Uncommon', rare: 'Rare', epic: 'Epic', legendary: 'Legendary' };
const RARITY_GEMS: Record<Rarity, number> = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 };
const SHORT: Record<string, string> = { serve: 'SRV', forehand: 'FH', backhand: 'BH', volley: 'VLY', return: 'RET', footwork: 'MOV', endurance: 'END', mentality: 'MEN', tactics: 'TAC' };
const art = (path: string) => `${import.meta.env.BASE_URL}art/${path}`;

/** An image that walks through candidate sources and hides itself if none load. */
export function ArtImg({ srcs, alt = '', className }: { srcs: string[]; alt?: string; className?: string }) {
  const [i, setI] = useState(0);
  if (i >= srcs.length) return null;
  return <img className={className} src={srcs[i]} alt={alt} loading="lazy" draggable={false} onError={() => setI(i + 1)} />;
}

function chips(d: CardDef): string[] {
  const out: string[] = [];
  if (d.all) out.push(`+${d.all} ALL`);
  if (d.pct) out.push(`+${Math.round(d.pct * 100)}% ALL`);
  for (const [k, v] of Object.entries(d.skills ?? {})) out.push(`+${v} ${SHORT[k] ?? k}`);
  if (d.ceilingAll) out.push(`+${d.ceilingAll} POT ALL`);
  for (const [k, v] of Object.entries(d.ceiling ?? {})) out.push(`+${v} POT ${SHORT[k] ?? k}`);
  if (d.ceilingRandom) out.push(`+${d.ceilingRandom} POT ?`);
  if (d.edge) out.push(`+${d.edge} EDGE`);
  if (d.matchEdge) out.push(`+${d.matchEdge} EDGE ${d.setPick ? '1 SET' : 'MATCH'}`);
  if (d.kind === 'match' && d.confidence) out.push(`+${d.confidence} MORALE`);
  if (d.fatigue) out.push(`${d.fatigue > 0 ? '+' : ''}${d.fatigue} FAT`);
  if (d.heal) out.push(d.heal >= 99 ? 'HEAL' : `−${d.heal} WK INJ`);
  if (d.money) out.push(`+${money(d.money)}`);
  if (d.wildcard) out.push(`${d.wildcard}× WC`);
  if (d.weeks && d.kind === 'boost') out.push(d.weeks > 1 ? `${d.weeks} EVENTS` : 'NEXT EVENT');
  return out.slice(0, 4);
}

export function CardView({ id, children, dim, delay }: { id: string; children?: React.ReactNode; dim?: boolean; delay?: number }) {
  const d = CARD_MAP[id]; if (!d) return null;
  return <div className={`tc-card r-${d.rarity} k-${d.kind} ${dim ? 'dim' : ''}`} style={delay != null ? { animationDelay: `${delay}ms` } : undefined}>
    <div className="tc-frame">
      <header><span className="tc-kind">{KIND_LABEL[d.kind]}</span><span className="tc-gems">{'◆'.repeat(RARITY_GEMS[d.rarity])}</span></header>
      <div className="tc-art">
        <span className="tc-art-fallback" aria-hidden="true">{d.icon}</span>
        <ArtImg className="tc-art-img" srcs={[art(`cards/${d.id}.webp`), art(`cards/kind-${d.kind}.webp`)]} />
        <i className="tc-holo" />
      </div>
      <strong className="tc-name">{d.name}</strong>
      <div className="tc-chips">{chips(d).map((c) => <span key={c}>{c}</span>)}</div>
      <p className="tc-desc">{d.desc}</p>
      <footer className="tc-rarity">{RARITY_NAME[d.rarity]}</footer>
    </div>
    {children}
  </div>;
}

export function PackView({ tier, count, onOpen, onMerge, busy, opening }: { tier: PackTier; count: number; onOpen: () => void; onMerge?: () => void; busy: boolean; opening?: boolean }) {
  const def = PACKS[tier];
  return <div className={`tc-pack ${opening ? 'opening' : ''}`} style={{ ['--pc' as any]: def.color, ['--pa' as any]: def.accent }}>
    <div className="tc-pack-foil">
      <ArtImg className="tc-pack-img" srcs={[art(`packs/${tier}.webp`)]} />
      <span className="tc-pack-badge">×{count}</span>
      <strong>{def.name.replace(' pack', '')}</strong><small>PACK · {def.cards} CARDS</small>
      <i className="tc-pack-shine" />
    </div>
    <div className="tc-pack-actions">
      <button className="tc-open" disabled={busy || opening} onClick={() => { haptic(20); onOpen(); }}>Open</button>
      {onMerge && <button className="tc-merge" disabled={busy} onClick={onMerge}>Merge 4 → 1</button>}
    </div>
  </div>;
}

export function Cards({ u, busy, onOpen, onMerge, onPlay, onSell }: { u: any; busy: boolean; onOpen: (i: number) => Promise<string[]>; onMerge: (t: PackTier) => void; onPlay: (uid: string) => void; onSell: (uid: string) => void }) {
  const c = careerOf(u);
  const [reveal, setReveal] = useState<{ tier: PackTier; cards: string[] } | null>(null);
  const [opening, setOpening] = useState<PackTier | null>(null);
  const counts = c.packs.reduce((m, t) => ({ ...m, [t]: (m[t] ?? 0) + 1 }), {} as Record<string, number>);
  const sorted = [...c.hand].sort((a, b) => (CARD_MAP[a.id]?.kind ?? '').localeCompare(CARD_MAP[b.id]?.kind ?? '') || a.id.localeCompare(b.id));
  const open = async (t: PackTier) => {
    setOpening(t);
    await new Promise((r) => setTimeout(r, 900)); // shake, then burst
    const got = await onOpen(c.packs.indexOf(t));
    setOpening(null);
    setReveal({ tier: t, cards: got });
  };
  const best = reveal ? reveal.cards.map((id) => CARD_MAP[id]?.rarity).sort((a, b) => RARITY_GEMS[b!] - RARITY_GEMS[a!])[0] : null;
  return <div className="cs-page">
    <section className="cs-panel">
      <div className="cs-title-row"><h2>Packs</h2><span className="muted">{c.cardPlays}/{maxPlays(c)} card plays · one play refills every two weeks</span></div>
      {!c.packs.length && <p className="muted">No packs. You earn one every four weeks of work, for titles, deep runs, milestones and at the end of each season, or buy them in the Shop.</p>}
      <div className="tc-packs">
        {(Object.keys(PACKS) as PackTier[]).filter((t) => counts[t]).map((t) => <PackView key={t} tier={t} count={counts[t]} busy={busy} opening={opening === t} onOpen={() => open(t)} onMerge={t !== 'elite' && counts[t] >= 4 ? () => onMerge(t) : undefined} />)}
      </div>
    </section>
    <section className="cs-panel">
      <div className="cs-title-row"><h2>Your hand</h2><span className="muted">{c.hand.length}/{handLimit(c)} · extra cards are sold automatically</span></div>
      {!c.hand.length && <p className="muted">Open packs to fill your hand.</p>}
      <div className="tc-hand">{sorted.map((h, i) => { const d = CARD_MAP[h.id]; const isMatch = d?.kind === 'match'; const err = isMatch ? null : canPlay(u, h.uid); return <CardView key={h.uid} id={h.id} dim={!!err} delay={i * 40}>
        <div className="tc-actions">{isMatch ? <span className="tc-matchnote">🎾 Take it into a tournament</span> : <button className="tc-play" disabled={busy || !!err} onClick={() => { haptic(14); onPlay(h.uid); }}>Play</button>}<button className="tc-sell" disabled={busy} onClick={() => onSell(h.uid)}>Sell {money(CARD_SELL[d.rarity])}</button></div>
        {err && <small className="tc-err">{err}</small>}
      </CardView>; })}</div>
    </section>
    {reveal && <div className="tc-reveal" role="dialog" aria-modal="true" onPointerDown={(e) => { if (e.target === e.currentTarget) setReveal(null); }}>
      <div className={`tc-burst r-${best}`} style={{ ['--pc' as any]: PACKS[reveal.tier].color }} />
      <h3>{PACKS[reveal.tier].name}</h3>
      <div className="tc-reveal-row">{reveal.cards.map((id, i) => <CardView key={i} id={id} delay={300 + i * 280} />)}</div>
      <button className="ar-play tc-reveal-done" autoFocus onClick={() => setReveal(null)}>Add to hand</button>
    </div>}
  </div>;
}
export { SKILL_LABEL };
export type { SkillKey };
