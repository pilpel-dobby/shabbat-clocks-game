# Human testing

## Run locally

```bash
npm install
npm run dev
```

Open the local Vite URL in a browser.

## What to test

1. **Puzzle switching**: solve or partially edit one puzzle, switch tabs, and confirm there is no stale success banner or stale timeline from the previous puzzle.
2. **Touch editing**: on mobile/touch emulation, drag across teeth, release outside the grid, then touch again and confirm drawing mode is not stuck.
3. **Timeline inspection**: click timeline cells and use the slider/playback controls; confirm the selected hour updates the detail panel and active dial markers.
4. **Second-day labels**: in puzzle 2, inspect day 2 cells and confirm labels show hours 00-23 for day 2 rather than repeating incorrect absolute indexing text.
5. **Reset and persistence**: refresh the page to confirm puzzle state persists, then use reset and confirm the puzzle returns to its initial state.
