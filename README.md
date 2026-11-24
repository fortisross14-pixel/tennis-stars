# Tennis Stars 🎾

A tennis career game. Start as a 15-year-old junior and live your career **one week at a time** inside a
full simulated tennis world (the Tennis World Chronicle engine): 520 singles players per tour, doubles
specialists, a junior circuit, Grand Slams, Masters, 500s, 250s, Challengers and an ITF event every week.

**Live:** https://fortisross14-pixel.github.io/tennis-stars/

## The loop

Every week you choose:

- **Compete**: pick an event. Entry works like a real acceptance list: main draw, qualifying, wildcard or
  not accepted, projected from the entry list of that week. ITF qualifying is open entry. Add doubles if you have a partner.
  Your matches can be played live, set by set, with opponent scouting and head-to-heads.
- **Train**: a focus (serve, baseline, net, return, movement, fitness, mental, or a surface block) and an
  intensity. Harder training grows you faster but costs fatigue and raises injury risk.
- **Rest**: recover fatigue and health.

Juniors (until 18, or until you turn pro) also play the junior calendar with its own ranking.

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
