import type { Career, Decision } from './types';
import { SKILL_LABEL } from './data';
import type { SkillKey } from './types';

// Contextual off-court events. Each one is a trade-off; none is free.
interface Ctx { c: Career; p: any; universe: any; rng: any; juniorRank: number | null }
interface DecisionDef { id: string; weight: number; when: (x: Ctx) => boolean; make: (x: Ctx) => Decision }

const money = (n: number) => `$${n >= 1000 ? `${Math.round(n / 100) / 10}K` : n}`;

const DEFS: DecisionDef[] = [
  {
    id: 'academy', weight: 5, when: ({ p, c }) => p.age <= 17 && !c.counters['academy'],
    make: ({ p }) => ({
      id: 'academy', title: 'An academy abroad', text: `A well-known clay academy in Spain has seen clips of you and offers a place for the next two years. It is expensive and far from home, but the courts are full of future pros.`,
      options: [
        { id: 'go', label: 'Move to the academy', desc: '−$8K, +3 Footwork and Endurance potential, +4 clay feel, −2 confidence for now.', effects: { money: -8000, ceiling: { footwork: 3, endurance: 3 }, affinity: { Clay: 4 }, confidence: -2 } },
        { id: 'stay', label: 'Stay with your home coach', desc: '+2 confidence and +1 Mentality.', effects: { confidence: 2, skills: { mentality: 1 } } },
      ],
    }),
  },
  {
    id: 'extra', weight: 6, when: () => true,
    make: ({ rng }) => {
      const k = rng.pick(['serve', 'forehand', 'backhand', 'volley', 'return', 'footwork']) as SkillKey;
      return {
        id: 'extra', title: 'Extra hours on court', text: `Your coach thinks your ${SKILL_LABEL[k].toLowerCase()} could be the difference. They want extra sessions after your normal practice.`,
        options: [
          { id: 'yes', label: 'Every day', desc: `+2 ${SKILL_LABEL[k]}, +14 fatigue.`, effects: { skills: { [k]: 2 }, fatigue: 14 } },
          { id: 'some', label: 'Twice a week', desc: `+1 ${SKILL_LABEL[k]}, +5 fatigue.`, effects: { skills: { [k]: 1 }, fatigue: 5 } },
          { id: 'no', label: 'Protect your body', desc: '−6 fatigue.', effects: { fatigue: -6 } },
        ],
      };
    },
  },
  {
    id: 'sponsor', weight: 5, when: ({ p }) => (p.fame || 0) >= 15 || p.ranking <= 250,
    make: ({ p }) => {
      const amt = Math.round(Math.max(4000, (p.fame || 0) * 450 + Math.max(0, 300 - p.ranking) * 120) / 500) * 500;
      return {
        id: 'sponsor', title: 'A sponsor calls', text: `An apparel brand wants you in their next campaign. It means two days of shoots in the middle of your schedule.`,
        options: [
          { id: 'sign', label: 'Sign it', desc: `+${money(amt)}, +8 fatigue.`, effects: { money: amt, fatigue: 8, fame: 3 } },
          { id: 'charity', label: 'Do a charity clinic instead', desc: '+6 fame, +2 confidence.', effects: { fame: 6, confidence: 2 } },
          { id: 'no', label: 'Not now', desc: 'Nothing changes.', effects: {} },
        ],
      };
    },
  },
  {
    id: 'press', weight: 4, when: ({ p }) => (p.fame || 0) >= 25,
    make: () => ({
      id: 'press', title: 'Press conference', text: 'A journalist asks whether you believe you can win a Grand Slam one day.',
      options: [
        { id: 'bold', label: '"I came here to win them all."', desc: '+8 fame, +2 confidence, but pressure: −2 Mentality this week… and a target on your back.', effects: { fame: 8, confidence: 2 } },
        { id: 'humble', label: '"One match at a time."', desc: '+1 Mentality.', effects: { skills: { mentality: 1 } } },
      ],
    }),
  },
  {
    id: 'party', weight: 3, when: ({ p }) => p.age >= 17,
    make: () => ({
      id: 'party', title: 'Players party', text: 'The tournament throws a players party on the rooftop. Half the locker room is going.',
      options: [
        { id: 'go', label: 'Go all night', desc: '+4 confidence, +16 fatigue, +3 fame.', effects: { confidence: 4, fatigue: 16, fame: 3 } },
        { id: 'early', label: 'Show up, leave early', desc: '+2 confidence.', effects: { confidence: 2 } },
        { id: 'rest', label: 'Stay in and sleep', desc: '−8 fatigue.', effects: { fatigue: -8 } },
      ],
    }),
  },
  {
    id: 'niggle', weight: 4, when: ({ p }) => (p.fatigue || 0) >= 45 && !(p.injury?.weeksRemaining > 0),
    make: () => ({
      id: 'niggle', title: 'A niggle in the shoulder', text: 'Your shoulder is sore after practice. The physio says it is probably nothing, probably.',
      options: [
        { id: 'rest', label: 'Take a few days off', desc: '−25 fatigue, +6 health, lose −1 Serve sharpness.', effects: { fatigue: -25, health: 6, skills: { serve: -1 } } },
        { id: 'push', label: 'Play through it', desc: 'Nothing now… 35% chance of a 3-week injury.', effects: { injuryWeeks: -1 } },
      ],
    }),
  },
  {
    id: 'hitting', weight: 3, when: ({ p, universe }) => p.ranking > 60 && p.age >= 16 && universe.players[p.tour].length > 0,
    make: ({ universe, p, rng }) => {
      const star = universe.players[p.tour][rng.int(0, 4)];
      return {
        id: 'hitting', title: 'Hitting partner for a star', text: `${star.firstName} ${star.lastName} (world No. ${star.ranking}) needs a hitting partner for a few days and asked for you.`,
        options: [
          { id: 'yes', label: 'Say yes', desc: '+1 Return, +1 Tactics, +2 Mentality, +10 fatigue, +4 fame.', effects: { skills: { return: 1, tactics: 1, mentality: 2 }, fatigue: 10, fame: 4 } },
          { id: 'no', label: 'Focus on yourself', desc: '−4 fatigue.', effects: { fatigue: -4 } },
        ],
      };
    },
  },
  {
    id: 'federation', weight: 4, when: ({ c, p, juniorRank }) => !c.federation && ((juniorRank ?? 999) <= 30 || p.ranking <= 200) && p.age <= 22,
    make: () => ({
      id: 'federation', title: 'National federation programme', text: 'Your federation offers you a place in its performance programme: a weekly grant and wildcards at home events, but you will play for your country when called.',
      options: [
        { id: 'join', label: 'Join the programme', desc: '+$600/week grant, more home wildcards.', effects: { federation: true, wildcardBonus: 40 } },
        { id: 'no', label: 'Stay independent', desc: '+3 confidence.', effects: { confidence: 3 } },
      ],
    }),
  },
  {
    id: 'coach-offer', weight: 3, when: ({ c, p }) => c.staff.coach < 3 && (p.ranking <= 150 || (p.fame || 0) > 60),
    make: ({ c }) => ({
      id: 'coach-offer', title: 'A new coach is interested', text: 'A coach with a big reputation thinks they can take you to the next level. Their fee is high, but they offer a trial month at half price.',
      options: [
        { id: 'hire', label: 'Hire them', desc: `Coach upgraded to level ${c.staff.coach + 1}. −$3K now.`, effects: { staff: { coach: c.staff.coach + 1 }, money: -3000 } },
        { id: 'no', label: 'Stay loyal', desc: '+2 confidence, +1 Tactics.', effects: { confidence: 2, skills: { tactics: 1 } } },
      ],
    }),
  },
  {
    id: 'viral', weight: 3, when: ({ p }) => p.age <= 24,
    make: () => ({
      id: 'viral', title: 'A clip goes viral', text: 'A tweener you hit in practice has two million views overnight.',
      options: [
        { id: 'post', label: 'Lean into it', desc: '+10 fame, +$1.5K.', effects: { fame: 10, money: 1500 } },
        { id: 'ignore', label: 'Ignore the noise', desc: '+1 Mentality.', effects: { skills: { mentality: 1 } } },
      ],
    }),
  },
  {
    id: 'exhibition', weight: 3, when: ({ p }) => p.ranking <= 80,
    make: ({ p }) => {
      const amt = Math.round((150000 - p.ranking * 1200) / 1000) * 1000;
      return {
        id: 'exhibition', title: 'Exhibition money', text: 'A promoter offers a big fee for an exhibition in the Gulf. The trip is long and the timing is bad.',
        options: [
          { id: 'go', label: 'Take the money', desc: `+${money(amt)}, +22 fatigue.`, effects: { money: amt, fatigue: 22, fame: 4 } },
          { id: 'no', label: 'Decline', desc: 'Nothing changes.', effects: {} },
        ],
      };
    },
  },
];

export function rollDecision(x: Ctx): Decision | null {
  if (x.rng.next() > 0.09) return null;
  const options = DEFS.filter((d) => d.when(x) && (x.c.counters[`d-${d.id}`] ?? 0) < 3);
  if (!options.length) return null;
  const total = options.reduce((s, d) => s + d.weight, 0);
  let roll = x.rng.next() * total;
  for (const d of options) { roll -= d.weight; if (roll <= 0) { x.c.counters[`d-${d.id}`] = (x.c.counters[`d-${d.id}`] ?? 0) + 1; return d.make(x); } }
  return null;
}

export function turnProDecision(): Decision {
  return {
    id: 'turn-pro', title: 'Turn pro?', text: 'You are 17. Your team asks whether you want one more season on the junior circuit (junior Slams, junior ranking, exemptions) or go full time on the pro tour.',
    options: [
      { id: 'pro', label: 'Go full-time pro', desc: 'No more junior events. A racquet sponsor pays $6K and you get +2 confidence.', effects: { turnPro: true, money: 6000, confidence: 2 } },
      { id: 'junior', label: 'One more junior season', desc: 'Keep playing junior events until the end of your 18th year.', effects: {} },
    ],
  };
}

export function retirementDecision(age: number, forced: boolean): Decision {
  return {
    id: 'retire', seasonEnd: true, title: forced ? 'The end of the road' : 'Time to think about the future',
    text: forced ? `At ${age}, your body has decided for you. This season was your last.` : `At ${age}, every season is harder than the last. Do you want to play another year?`,
    options: forced
      ? [{ id: 'retire', label: 'Announce your retirement', desc: 'Your career ends here.', effects: { retire: true } }]
      : [
        { id: 'continue', label: 'One more season', desc: 'Keep going.', effects: {} },
        { id: 'retire', label: 'Retire', desc: 'Your career ends at the end of this season.', effects: { retire: true } },
      ],
  };
}
