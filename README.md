# משחק שעוני שבת · Shabbat Clocks Game

A small Hebrew (RTL) browser logic puzzle about chaining mechanical Shabbat timer clocks.
Each clock has 24 teeth (one per hour) and only turns while it receives power, so chaining
clocks lets you build patterns longer than a day.

- App: React 19 + TypeScript + Vite, deterministic engine + Vitest tests (`app/`)
- Design docs (Hebrew): `docs/`

## Run locally

```bash
cd app
npm install
npm run dev     # local dev server
npm test        # engine + puzzle tests
npm run build   # static build into app/dist
```

## Live

https://pilpel-dobby.github.io/shabbat-clocks-game/

Deployed by pushing the contents of `app/dist` (plus `.nojekyll`) to the `gh-pages` branch.
