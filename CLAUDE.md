# CLAUDE.md — SmartFarm Dashboard

## What this is

A **real farming dashboard with gamification** — not a game. Pedro manages 6 physical raised beds. The pixel-art RPG style (coins, XP, quests) is motivational wrapping around actual garden work.

- Sensor readings (moisture, pests, weeds) will come from Home Assistant
- "REGAR" / "SACHAR" / "COLHER" log real actions done in the garden
- The simulated game tick is a placeholder until HA sensors are connected

## Stack

- **SvelteKit 5** (legacy/Svelte 4 syntax — `export let`, `$:`, `on:click`, not runes)
- **SQLite** via `better-sqlite3` + `drizzle-orm` (schema in `src/lib/server/schema.js`)
- **adapter-node** for Docker deployment
- **No TypeScript** — plain JS throughout

## Conventions

- Components in `src/lib/components/` — each is a `.svelte` file
- Data modules in `src/lib/data/` — pure JS, no framework code (sprites, seed data)
- Server code in `src/lib/server/` — DB, schema, sync, game tick
- Stores in `src/lib/stores/` — Svelte writable stores
- API routes under `src/routes/api/` — SvelteKit `+server.js` files
- SSR data via `+page.server.js` load functions
- All UI text is in **Portuguese** (PT-PT)

## Key files

- `src/lib/server/schema.js` — Drizzle schema (7 tables)
- `src/lib/server/db.js` — DB connection singleton, auto-creates tables
- `src/lib/server/seed.js` — Seeds DB from hardcoded data files
- `src/hooks.server.js` — Cron jobs (game tick 60s, Notion sync daily)
- `src/lib/components/PixelSprite.svelte` — Core rendering: CSS box-shadow pixel art
- `src/lib/data/sprites.js` — All pixel matrices and palettes

## Running

```bash
npm install
npm run dev          # Dev server on :5173
npm run build        # Production build to ./build
node build           # Run production (set DATABASE_PATH, PORT)
docker compose up    # Full containerized deployment
```

## Testing changes

- After any component change, check the browser visually — pixel art is CSS, not images
- After DB schema changes, delete `data/farm.db` and restart (auto-seeds)
- API routes: `curl http://localhost:5173/api/beds | jq`
