# CLAUDE.md -- SmartFarm Dashboard

## What this is

A **real farming dashboard with gamification**, not a game. Pedro manages 6 physical raised beds in Coimbra. The pixel-art RPG style (coins, XP, quests) is motivational wrapping around actual garden work.

- Irrigation data comes from Home Assistant (Sonoff SWV valves)
- Weed status tracks days since last physical visit (sachar action)
- "REGAR" / "SACHAR" / "COLHER" log real actions done in the garden
- Sage (Claude) is the AI assistant for farm advice and note-taking
- SQLite is the source of truth for all farm data (Notion sync is disabled)

## Stack

- **SvelteKit 5** (legacy/Svelte 4 syntax: `export let`, `$:`, `on:click`, not runes)
- **SQLite** via `better-sqlite3` + `drizzle-orm` (schema in `src/lib/server/schema.js`)
- **Anthropic SDK** (`@anthropic-ai/sdk`) for Sage, model `claude-sonnet-4-6`
- **adapter-node** for Docker deployment
- **No TypeScript**, plain JS throughout
- **No cron jobs**, no simulated data

## Auth

Home Assistant OAuth2. The app uses `url.origin` as `client_id` (not an env var) so it works on any domain. Sessions stored in SQLite. Cookie `secure` flag set dynamically based on protocol.

## Conventions

- Components in `src/lib/components/` -- each is a `.svelte` file
- Data modules in `src/lib/data/` -- pure JS, no framework code
- Server code in `src/lib/server/` -- DB, schema, auth, HA integration
- Stores in `src/lib/stores/` -- Svelte writable stores
- API routes under `src/routes/api/` -- SvelteKit `+server.js` files
- SSR data via `+page.server.js` load functions
- All UI text is in **Portuguese** (PT-PT)
- Use `$env/dynamic/private` for env vars in server code (not `process.env` at top-level)

## Key files

- `src/lib/server/schema.js` -- Drizzle schema (9 tables)
- `src/lib/server/db.js` -- DB connection singleton, auto-creates tables
- `src/lib/server/auth.js` -- HA OAuth2, session CRUD, token refresh
- `src/lib/server/homeassistant.js` -- valve entities, irrigation history from HA REST API
- `src/routes/api/sage/+server.js` -- Claude integration with tool use (6 tools) and SSE streaming
- `src/lib/stores/farm.js` -- bed status logic (thirst from HA, weeds from action_log)
- `src/hooks.server.js` -- auth guard, DB seed on first boot

## Data model

- **beds** -- 6 raised beds (RB-11 to RB-23), physical dimensions and notes
- **rotations** -- 1 row = 1 rotation per bed, with estado (Planeado/Plantado/A colher/Terminado/Em repouso)
- **plantings** -- species planted in each rotation, with count and function
- **action_log** -- free-text diary entries and typed actions (sachar, nota), linked to beds
- **sessions** -- HA OAuth sessions with access/refresh tokens

## Sensor data

No simulated sensors. Real data only:
- **Irrigation**: HA REST API queries Sonoff SWV valve history (7-day window). Valves: RB-11, RB-12, RB-13, RB-21, RB-23.
- **Weeds**: days since last `sachar` action in `action_log`. Color scale: green (0-2d), yellow (3-4d), orange (5-6d), red (7-10d), brown (10d+).

## Running

```bash
npm install
npm run dev          # Dev server on :5173
npm run build        # Production build to ./build
node build           # Run production (set DATABASE_PATH, PORT)
docker compose up    # Full containerized deployment
```

## Testing changes

- After any component change, check the browser visually (pixel art is CSS, not images)
- After DB schema changes, delete `data/farm.db` and restart (auto-seeds)
- API routes: `curl http://localhost:5173/api/beds | jq`
