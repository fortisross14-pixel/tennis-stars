# Tennis Stars 🎾

A tennis career game. Start as a 15-year-old junior and live your career **one week at a time** inside a
full simulated tennis world (the Tennis World Chronicle engine): 520 singles players per tour, doubles
specialists, a junior circuit, Grand Slams, Masters, 500s, 250s, Challengers and an ITF event every week.

**Live:** https://fortisross14-pixel.github.io/tennis-stars/

## The loop

Every week you either pick a **tournament** (it takes the whole week) or fill **three slots**, which are rest
unless you choose otherwise: training (focus and intensity), recovery session, video study, sponsor work or a
media day.

- Entry works like a real acceptance list: main draw, qualifying, wildcard or not accepted, projected from that
  week's entry list. ITF qualifying is open entry. Filter events by Junior, ITF & Challenger, Tour & Slams.
  Juniors (until 18, or until you turn pro) have their own calendar: Slams, 500s, continentals and a near-weekly
  Junior 200 circuit with regional fields.
- Your main-draw matches can be played live with the game-by-game match viewer, which stops after every set.
  Every match you play (qualifying, juniors, autopilot) is recorded and can be replayed from Career → Matches.
- Prize money buys card packs, equipment and staff (Improvement). Boost cards, such as Inspiration (+5% to all
  skills), last until the end of your next tournament.

The interface is the **Arena** look: broadcast-style dark blue screens, animated tabs, page transitions and
an animated match (a rally on court for every game, holds and breaks called out, stops after each set),
built for touch and tablets as well as desktop. Installable as an app (PWA); saves live in IndexedDB.

Navigation: **This week** (plan and schedule), **Overview**, **Career** (overview, seasons, matches,
tournaments, milestones & skills), **Improvement** (cards, shop, equipment, team & doubles) and **World**
(rankings, calendar, tournaments, players, juniors, doubles, national teams, news, records, almanac).

## Systems

| System | Where | Notes |
|---|---|---|
| Career engine | `src/career/engine.ts` | creation, week turns, entries, growth, money, rewards, seasons, retirement |
| Growth | `engine.ts` (`train`, `matchExperience`, `decline`) | skills approach per-skill potential; fast until ~21, slow after 25, decline from 29 |
| Money | `data.ts` | prize money by level/round, travel by region, staff wages, sponsors from ranking and fame |
| Cards & packs | `cards.ts` | drills, tournament boosts, recovery, potential (capped), special skills, money, wildcards |
| Special skills | `data.ts`, `src/sim/match.js` | situational match edges unlocked by milestones or cards |
| Decisions | `decisions.ts` | off-court events with trade-offs, turn-pro choice, retirement |
| Doubles | `src/sim/doubles.js` | choose a partner; your team enters Challengers, tour events and Slams |
| Legacy | `legacy.ts`, `meta.ts` | coins from milestones and titles buy upgrades and trinkets for future careers |
| World | `src/sim/` | the Chronicle engine, with a depth pool, weekly ITFs and career hooks |

## Run it

```bash
npm install
npm run dev
npm run build          # typecheck + production build
npm run test:engine    # engine smoke test (live event, cards, staff, doubles, full career)
npm run test:saves     # every fixture in tests/save-fixtures loads and keeps playing
npm run sim 12         # headless balance run (autopilot careers); scripts/sim-par.sh uses 4 cores
```

Push to `main` and GitHub Actions deploys to GitHub Pages.
