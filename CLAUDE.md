# Notes for working on this repo

- Tennis Stars is a career game built on the Tennis World Chronicle engine. `src/sim/` and most of `src/pages`,
  `src/components` come from Chronicle (plain JS); the career layer is TypeScript in `src/career/`.
  Keep engine changes small and marked (search for `controlled` / `career` hooks).
- Old saves must never break. Before pushing, run `npm run test:saves` and `npm run test:engine`; both must pass.
  After pushing a release, add its fixtures with `npm run fixtures -- <short-commit-hash>` and commit them.
- New fields on `Career` (`src/career/types.ts`) need a default in `DEFAULTS` in `src/career/migrate.ts`.
  New fields on Chronicle players or the universe go in `src/sim/migrations.js`.
- Don't change overall balance unless asked; check with `npm run sim [n]` or `scripts/sim-par.sh 3`
  (4 processes; `--profile=fresh|run5|run10`, `--tier=Rare|Epic|Legend`, `--smart` for a careful player).
  Starts roll Common/Uncommon/Rare; Epic and Legend are unlocked with the Talent Pool upgrade.
  Targets: Rare played carelessly peaks around No. 10 with 0–2 Masters; Rare played well reaches the top 5
  with several Masters and sometimes a Slam; Epic is a top-10 Masters winner; Legend wins multiple Slams.
- Storage goes through `src/career/storage.ts` (IndexedDB). Never call `localStorage` directly:
  the github.io origin is shared with many other games and its localStorage is usually full.
