import type { PackTier } from './types';

// Profile-wide progression between careers: legacy coins buy permanent
// upgrades and trinkets. Trinkets are owned forever; you slot a few into
// each new career.

export interface UpgradeDef { id: string; name: string; icon: string; costs: number[]; levels: string[] }
export const UPGRADES: UpgradeDef[] = [
  { id: 'talent', name: 'Talent Pool', icon: '💎', costs: [1500, 4500], levels: ['Epic potential can be rolled', 'Legend potential can be rolled (and, very rarely, Generational)'] },
  { id: 'slots', name: 'Trinket Slots', icon: '🎒', costs: [500, 1800], levels: ['2 trinket slots per career', '3 trinket slots per career'] },
  { id: 'academy', name: 'Better Academy', icon: '🏫', costs: [300, 900, 2200], levels: ['+2 to every skill at the start', '+4 to every skill at the start', '+6 to every skill at the start'] },
  { id: 'gifted', name: 'Gifted', icon: '✦', costs: [600, 1700, 3800], levels: ['+1 potential in every skill', '+2 potential in every skill', '+4 potential in every skill'] },
  { id: 'scouting', name: 'Scouting Report', icon: '🔭', costs: [700, 2400], levels: ['Never start below Uncommon potential', 'Never start below Rare potential'] },
  { id: 'kit', name: 'Starter Kit', icon: '📦', costs: [250, 750, 1900], levels: ['+1 Tour pack at the start', '+1 Tour and +1 Pro pack', '+1 Tour, Pro and Champion pack'] },
  { id: 'family', name: 'Family Savings', icon: '🏦', costs: [200, 800], levels: ['Start with $25K', 'Start with $60K and a regional coach'] },
  { id: 'body', name: 'Iron Body', icon: '🦴', costs: [450, 1200], levels: ['Injury risk −15%', 'Injury risk −30%'] },
  { id: 'binder', name: 'Card Binder', icon: '🗂', costs: [500, 1500], levels: ['+1 max card plays', '+2 max card plays and bigger hand'] },
  { id: 'luck', name: 'Lucky Packs', icon: '🍀', costs: [800, 2300], levels: ['Better pack odds', 'Much better pack odds'] },
  { id: 'federation', name: 'Federation Backing', icon: '🏛', costs: [600, 1600], levels: ['More wildcards at home and junior events', 'Even more wildcards and a federation grant'] },
  { id: 'junior', name: 'Junior Head Start', icon: '🚀', costs: [400], levels: ['Start with junior ranking points (top-40 junior)'] },
  { id: 'longevity', name: 'Longevity', icon: '⏳', costs: [1400], levels: ['Decline starts one year later'] },
];
export const UPGRADE_MAP: Record<string, UpgradeDef> = Object.fromEntries(UPGRADES.map((u) => [u.id, u]));

export type TrinketRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export const TRINKET_RARITIES: TrinketRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
export const TRINKET_COLOR: Record<TrinketRarity, string> = { common: '#9aa5ad', uncommon: '#2fae68', rare: '#2f7bf0', epic: '#9a4cf0', legendary: '#e8a400' };

export interface TrinketFx {
  ceiling?: number; start?: number; growth?: number; injury?: number; plays?: number; money?: number;
  packs?: PackTier[]; wildcard?: number; coinMult?: number; prime?: number; special?: string; noInjurySeasons?: number; luck?: number; tier?: number;
}
export interface TrinketDef { id: string; name: string; icon: string; rarity: TrinketRarity; desc: string; fx: TrinketFx }
export const TRINKETS: TrinketDef[] = [
  { id: 'wristband', name: 'Lucky Wristband', icon: '🎗', rarity: 'common', desc: '+2 to every skill at the start, +1 potential.', fx: { start: 2, ceiling: 1 } },
  { id: 'piggy', name: 'Piggy Bank', icon: '🐷', rarity: 'common', desc: 'Start with $20K extra, +1 potential.', fx: { money: 20000, ceiling: 1 } },
  { id: 'grip', name: 'Fresh Grip', icon: '🩹', rarity: 'common', desc: 'Injury risk −15%, +1 potential.', fx: { injury: 0.15, ceiling: 1 } },
  { id: 'bottle', name: 'Water Bottle', icon: '🥤', rarity: 'common', desc: 'Start with a Tour pack, +1 potential.', fx: { packs: ['silver'], ceiling: 1 } },
  { id: 'notebook', name: "Coach's Notebook", icon: '📓', rarity: 'uncommon', desc: '+25% growth until 20, +2 potential.', fx: { growth: 0.25, ceiling: 2 } },
  { id: 'flag', name: 'Home Flag', icon: '🚩', rarity: 'uncommon', desc: 'Many more wildcards, +2 potential.', fx: { wildcard: 70, ceiling: 2 } },
  { id: 'ticket', name: 'Golden Ticket', icon: '🎫', rarity: 'uncommon', desc: 'Start with a Pro pack, +2 potential.', fx: { packs: ['gold'], ceiling: 2 } },
  { id: 'strings', name: 'Hybrid Strings', icon: '🧵', rarity: 'rare', desc: '+3 potential in every skill.', fx: { ceiling: 3 } },
  { id: 'hourglass', name: 'Hourglass', icon: '⌛', rarity: 'rare', desc: '+1 max card play, +2 potential.', fx: { plays: 1, ceiling: 2 } },
  { id: 'cap', name: 'Lucky Cap', icon: '🧢', rarity: 'rare', desc: 'Much better pack odds, +2 potential.', fx: { luck: 1, ceiling: 2 } },
  { id: 'clover', name: 'Four-leaf Clover', icon: '🍀', rarity: 'epic', desc: 'Potential one tier higher (up to the best tier you have unlocked), +2 potential.', fx: { tier: 1, ceiling: 2 } },
  { id: 'racquet', name: "Champion's Racquet", icon: '🏸', rarity: 'epic', desc: '+5 potential, +3 to every skill at the start.', fx: { ceiling: 5, start: 3 } },
  { id: 'midas', name: 'Midas Touch', icon: '🪙', rarity: 'epic', desc: '+60% legacy coins, +3 potential.', fx: { coinMult: 0.6, ceiling: 3 } },
  { id: 'steel', name: 'Indestructible', icon: '🦾', rarity: 'epic', desc: 'No injuries for 3 seasons, then −30%. +3 potential.', fx: { noInjurySeasons: 3, injury: 0.3, ceiling: 3 } },
  { id: 'crown', name: 'The Crown', icon: '👑', rarity: 'legendary', desc: 'Potential two tiers higher (up to the best tier you have unlocked) and a Champion pack.', fx: { tier: 2, packs: ['elite'] } },
  { id: 'eternal', name: 'Eternal Prime', icon: '♾', rarity: 'legendary', desc: 'Decline 3 years later, +6 potential, injury risk −25%.', fx: { prime: 3, ceiling: 6, injury: 0.25 } },
  { id: 'aura', name: 'Aura', icon: '✨', rarity: 'legendary', desc: '+8 potential and the Big Stage special skill.', fx: { ceiling: 8, special: 'big-stage' } },
];
export const TRINKET_MAP: Record<string, TrinketDef> = Object.fromEntries(TRINKETS.map((t) => [t.id, t]));

export interface CrateDef { id: string; name: string; cost: number; odds: Record<TrinketRarity, number> }
export const CRATES: CrateDef[] = [
  { id: 'bag', name: 'Kit Bag', cost: 300, odds: { common: 0.6, uncommon: 0.3, rare: 0.09, epic: 0.01, legendary: 0 } },
  { id: 'case', name: 'Trophy Case', cost: 1200, odds: { common: 0, uncommon: 0.35, rare: 0.45, epic: 0.17, legendary: 0.03 } },
  { id: 'chest', name: 'Legend Chest', cost: 3600, odds: { common: 0, uncommon: 0, rare: 0.35, epic: 0.5, legendary: 0.15 } },
];
export const DUPLICATE_REFUND = 0.4;
export const trinketSlots = (u: Record<string, number>) => 1 + (u.slots ?? 0);

// Career milestones that pay legacy coins (once per career).
export interface MilestoneDef { id: string; label: string; coins: number }
export const MILESTONES: MilestoneDef[] = [
  { id: 'first-win', label: 'First professional match win', coins: 15 },
  { id: 'first-point', label: 'First ranking point', coins: 10 },
  { id: 'junior-title', label: 'First junior title', coins: 30 },
  { id: 'junior-top10', label: 'Top 10 junior', coins: 50 },
  { id: 'junior-slam', label: 'Junior Grand Slam champion', coins: 120 },
  { id: 'junior-no1', label: 'Junior world No. 1', coins: 150 },
  { id: 'itf-title', label: 'First ITF title', coins: 40 },
  { id: 'challenger-title', label: 'First Challenger title', coins: 90 },
  { id: 'tour-title', label: 'First tour title', coins: 160 },
  { id: 'title-500', label: 'First 500 title', coins: 220 },
  { id: 'masters-title', label: 'First Masters 1000 title', coins: 420 },
  { id: 'slam-debut', label: 'Grand Slam main-draw debut', coins: 70 },
  { id: 'slam-qf', label: 'Grand Slam quarterfinal', coins: 160 },
  { id: 'slam-final', label: 'Grand Slam final', coins: 380 },
  { id: 'slam-title', label: 'Grand Slam champion', coins: 1000 },
  { id: 'finals', label: 'Qualified for the Tour Finals', coins: 300 },
  { id: 'top300', label: 'Top 300', coins: 40 },
  { id: 'top200', label: 'Top 200', coins: 70 },
  { id: 'top100', label: 'Top 100', coins: 140 },
  { id: 'top50', label: 'Top 50', coins: 200 },
  { id: 'top20', label: 'Top 20', coins: 320 },
  { id: 'top10', label: 'Top 10', coins: 480 },
  { id: 'no1', label: 'World No. 1', coins: 900 },
  { id: 'olympic-medal', label: 'Olympic medal', coins: 260 },
  { id: 'team-cup', label: 'Won the Davis / BJK Cup', coins: 160 },
  { id: 'doubles-title', label: 'First doubles title', coins: 60 },
  { id: 'doubles-slam', label: 'Doubles Grand Slam champion', coins: 300 },
  { id: 'millionaire', label: '$1M career prize money', coins: 120 },
];
export const MILESTONE_MAP: Record<string, MilestoneDef> = Object.fromEntries(MILESTONES.map((m) => [m.id, m]));
/** coins for every title, by level */
export const TITLE_COINS: Record<string, number> = { ITF: 8, Challenger: 20, 'WTA 125': 20, '250': 55, '500': 90, '1000': 220, 'Grand Slam': 500, Finals: 350, Olympics: 300 };
