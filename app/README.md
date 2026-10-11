# Shabbat Clocks Game – app

React 19 + TypeScript + Vite. Hebrew RTL UI.

- `src/engine/` – deterministic simulation engine (`simulate`, `evaluateSolution`) + tests
- `src/puzzles/` – puzzle bank (id, title, difficulty, description, hint, target timeline, clocks) + tests that verify every puzzle is solvable with a reference solution
- `src/App.tsx` – UI (clock editing, target vs. actual timelines, playback inspector)

```bash
npm install
npm run dev
npm test
npm run lint
npm run build    # outputs dist/, base path /shabbat-clocks-game/ for GitHub Pages
```

## Adding a puzzle
1. Add an entry to `src/puzzles/index.ts` (keep the easy → hard order).
2. Add its reference solution to `solutions` in `src/puzzles/index.test.ts`.
3. `npm test` must pass (the test checks the solution reproduces the target exactly).
