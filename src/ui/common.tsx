import React from 'react';
import { Player, Rarity } from '../sim/types';
import { RARITY_COLORS, RARITY_LABEL } from '../sim/players';

// Country flag from flagcdn (free SVG flags, no API key)
export function Flag({ iso2, size = 'md' }: { iso2: string; size?: 'sm' | 'md' | 'lg' }) {
  const cls = size === 'sm' ? 'flag-img fl-sm' : size === 'lg' ? 'flag-img fl-lg' : 'flag-img';
  // flagcdn serves 2x png — w40/w80
  const w = size === 'lg' ? 80 : 40;
  return (
    <img
      className={cls}
      src={`https://flagcdn.com/w${w}/${iso2}.png`}
      srcSet={`https://flagcdn.com/w${w * 2}/${iso2}.png 2x`}
      alt={iso2.toUpperCase()}
      loading="lazy"
    />
  );
}

// Player initial-disc avatar, colored by rarity
export function Avatar({ player, size = 'md' }: { player: Player; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const initials = (player.firstName.charAt(0) + player.surname.charAt(0)).toUpperCase();
  const cls = size === 'sm' ? 'avatar av-sm' : size === 'lg' ? 'avatar av-lg' : size === 'xl' ? 'avatar av-xl' : 'avatar';
  return (
    <span className={cls} style={{ background: RARITY_COLORS[player.rarity] }} title={`${player.firstName} ${player.surname}`}>
      {initials}
    </span>
  );
}

export function RarityPill({ rarity }: { rarity: Rarity }) {
  return (
    <span className="rarity-pill" style={{ background: RARITY_COLORS[rarity] }}>
      {RARITY_LABEL[rarity]}
    </span>
  );
}

// Combined player cell: avatar + flag + name (ATP-style)
export function PlayerCell({
  player,
  showAvatar = true,
  showCountryCode = false,
  nameStyle = 'short',
  onClick,
  rank,
}: {
  player: Player;
  showAvatar?: boolean;
  showCountryCode?: boolean;
  nameStyle?: 'short' | 'full' | 'last';
  onClick?: (p: Player) => void;
  rank?: number;
}) {
  let displayName: string;
  if (nameStyle === 'full') displayName = `${player.firstName} ${player.surname}`;
  else if (nameStyle === 'last') displayName = player.surname;
  else displayName = `${player.firstName.charAt(0)}. ${player.surname}`;

  const clickable = !!onClick;
  const handleClick = clickable ? () => onClick!(player) : undefined;
  return (
    <span
      className={`player-cell ${clickable ? 'is-clickable' : ''}`}
      onClick={handleClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
    >
      {showAvatar && <Avatar player={player} size="sm" />}
      <Flag iso2={player.iso2} size="md" />
      <span className={`pname ${clickable ? 'is-clickable' : ''}`}>{displayName}</span>
      {rank !== undefined && <span className="rank-tag">(#{rank})</span>}
      {showCountryCode && (
        <span style={{ fontSize: 11, color: 'var(--ink-soft)', fontWeight: 600 }}>
          ({player.countryCode})
        </span>
      )}
    </span>
  );
}

export function SurfaceTag({ surface }: { surface: 'hard' | 'clay' | 'grass' }) {
  const colors = { hard: 'var(--hard)', clay: 'var(--clay)', grass: 'var(--grass)' };
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: colors[surface],
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <span style={{ width: 6, height: 6, background: colors[surface], borderRadius: '50%', display: 'inline-block' }} />
      {surface}
    </span>
  );
}

export function SkillBar({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 32px', gap: 10, alignItems: 'center', margin: '4px 0', fontSize: 12 }}>
      <span style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, color: 'var(--ink-soft)', fontSize: 11 }}>
        {label}
      </span>
      <span className="bar-track" style={{ width: '100%' }}>
        <span className="bar-fill" style={{ width: `${value}%` }} />
      </span>
      <span style={{ fontVariantNumeric: 'tabular-nums', textAlign: 'right', fontWeight: 600 }}>{value}</span>
    </div>
  );
}
