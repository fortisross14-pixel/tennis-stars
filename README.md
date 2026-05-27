# Tennis Stars

A tennis tour management sim. 120-player roster, full season calendar with Grand Slams, Masters 1000s, 500s, 250s, and the World Tour Finals. Watch the big matches game-by-game; the rest gets auto-simulated. Players retire and rookies take their place. Skills drift year to year.

**Live:** https://fortisross14-pixel.github.io/tennis-stars/

## Stack

Vite + React + TypeScript. Three-layer architecture:

- `src/sim/` — game logic (players, calendar, match simulation, ranking, tournament engine, offseason)
- `src/ui/`  — views (calendar, ranking, history, tournament runner, offseason wizard)
- `src/data/` — static data (countries, names)

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy

Push to `main` — the GitHub Actions workflow deploys to GitHub Pages automatically.

## Game design notes

- **Rarities** are fixed at career start: roster targets ~3 Legends, ~9 Epics, 20 Rares, 30 Uncommons, 58 Commons. When players retire, rookies refill to keep the roster shape stable.
- **Match sim** uses a logistic on surface-weighted effective strength, plus once-per-match form variance and an off-surface penalty so specialists stay in their lane.
- **Calendar** is the hardcoded ATP-shaped 46-tournament season; weeks 46-52 are the offseason.
- **Live matches** tick one game per second. T250/T500 show just SF+F live; M1000 shows the full filled bracket plus a live final; Grand Slams play SF and F live.
