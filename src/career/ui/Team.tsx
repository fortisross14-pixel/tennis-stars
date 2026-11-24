import React, { useMemo, useState } from 'react';
import { Flag } from '../../components/Common.jsx';
import { careerOf, me, partnerCandidates, weeklyStaffCost } from '../engine';
import { STAFF } from '../data';
import type { StaffKey } from '../types';
import { money } from './common';

export function Team({ u, busy, onStaff, onPartner, onPlayer }: { u: any; busy: boolean; onStaff: (k: StaffKey, lvl: number) => void; onPartner: (id: string | null) => void; onPlayer: (id: string) => void }) {
  const c = careerOf(u), p = me(u);
  const [q, setQ] = useState('');
  const cands = useMemo(() => partnerCandidates(u), [u, p.ranking]);
  const partner = p.doublesPartnerId ? [...u.players[c.tour], ...u.doublesPlayers[c.tour]].find((x: any) => x.id === p.doublesPartnerId) : null;
  const team = (u.doublesTeams[c.tour] || []).find((t: any) => t.career);
  const shown = cands.filter((x: any) => `${x.player.firstName} ${x.player.lastName} ${x.player.country}`.toLowerCase().includes(q.toLowerCase())).slice(0, 40);
  return <div className="cs-page">
    <section className="cs-panel">
      <div className="cs-title-row"><h2>Your team</h2><span className="muted">Staff wages {money(weeklyStaffCost(c))} a week. If the bank goes negative, staff leave.</span></div>
      <div className="cs-staff">{(Object.keys(STAFF) as StaffKey[]).map((k) => { const s = STAFF[k]; const lvl = c.staff[k]; return <article key={k}>
        <header><span>{s.icon}</span><div><strong>{s.label}</strong><small>{s.desc}</small></div></header>
        <ol>{s.levels.map((l, i) => <li key={i} className={i === lvl ? 'active' : ''}><button disabled={busy || i === lvl} onClick={() => onStaff(k, i)}><b>{l.name}</b><span>{l.weekly ? `${money(l.weekly)}/wk` : 'free'}</span></button></li>)}</ol>
      </article>; })}</div>
      <p className="muted">{c.federation ? '🏛 You are in your federation programme: $600 a week and extra home wildcards.' : 'A national federation programme may come knocking once you are a top junior or inside the top 200.'}</p>
    </section>
    <section className="cs-panel">
      <div className="cs-title-row"><h2>Doubles</h2><span className="muted">Doubles is played at Challengers, tour events and Slams, in the same week as your singles.</span></div>
      {partner ? <div className="cs-partner"><button className="player-link" onClick={() => onPlayer(partner.id)}><Flag code={partner.country} /> <strong>{partner.firstName} {partner.lastName}</strong></button>
        <span>Doubles No. {partner.doublesRanking} · {partner.doublesSpecialist ? 'specialist' : `singles No. ${partner.ranking}`}</span>
        {team && <span>Team ranking No. {team.ranking} · chemistry {Math.round(team.chemistry)} · {team.wins}-{team.losses} · {team.titles} titles</span>}
        <button className="cs-secondary" disabled={busy} onClick={() => onPartner(null)}>Split up</button></div>
        : <p className="muted">No partner yet. Ask someone below: higher-ranked players only say yes once your ranking or fame is worth it.</p>}
      <input className="cs-search" placeholder="Search partners" value={q} onChange={(e) => setQ(e.target.value)} />
      <table className="data-table cs-table"><thead><tr><th>Player</th><th>Doubles</th><th>Singles</th><th>Doubles rating</th><th /></tr></thead><tbody>
        {shown.map((x: any) => <tr key={x.player.id}><td><button className="player-link" onClick={() => onPlayer(x.player.id)}><Flag code={x.player.country} /> {x.player.firstName} {x.player.lastName}</button></td><td>{x.doublesRanking < 999 ? `No. ${x.doublesRanking}` : '—'}</td><td>{x.player.doublesSpecialist ? 'specialist' : `No. ${x.player.ranking}`}</td><td>{Math.round(x.rating)}</td>
          <td>{x.player.id === p.doublesPartnerId ? <em>Partner</em> : x.willing ? <button disabled={busy} onClick={() => onPartner(x.player.id)}>Team up</button> : <span className="muted">Not interested</span>}</td></tr>)}
      </tbody></table>
    </section>
  </div>;
}
