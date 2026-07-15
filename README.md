# SmartFarm Dashboard

Pixel-art raised-bed farm dashboard with real sensor data from Home Assistant, an AI farming assistant (Sage), and dynamic task tracking. Built with SvelteKit and SQLite.

## What it does

Pedro manages 6 physical raised beds in Coimbra, Portugal. This dashboard wraps real farming work in pixel-art RPG aesthetics as motivational sugar.

- **Farm Map** -- interactive pixel-art map with walking character, tool actions, and interaction menus
- **Sage** -- AI assistant (Claude) in a fixed deck panel below the map. Knows the garden layout, rotation history, pest problems, and can take notes, create tasks, or research and register new plant species. Species research uses real web search (Anthropic server-side web search tool) to ground agronomic data in actual sources before saving to the catalog
- **Tasks** -- dynamic task list in the left sidebar. Auto-generated from bed state (dry beds, weeds, harvest-ready rotations), created by Sage via tool-call, or added manually. Auto tasks resolve themselves when the state changes.
- **Hortidex** -- plant encyclopedia in a Game Boy-style frame, with companion planting data and growth stages
- **Weather** -- real-time from Open-Meteo with 7-day forecast
- **Admin** -- direct table editing at `/admin` for beds, rotations, species, and diary entries
- **HA OAuth** -- login via Home Assistant, sessions persisted in SQLite

## How sensors work

No simulated data. Everything comes from real sources:

- **Irrigation** -- hours since last watering, pulled from Sonoff SWV valve history via HA REST API. One valve per bed (RB-11, RB-12, RB-13, RB-21, RB-23; RB-22 has no valve).
- **Weeds** -- days since last "sachar" action, tracked in the `action_log` table. Color scale: green (0-2d), yellow (3-4d), orange (5-6d), red (7-10d), brown (10d+).
- **Rotations/plantings** -- SQLite is the source of truth. Notion sync exists but is disabled (it was overwriting local state).

## Tech stack

- **Frontend**: SvelteKit 5 (Svelte 4 syntax, no runes), CSS pixel-art via `box-shadow`, Press Start 2P + VT323 fonts
- **Backend**: SvelteKit server routes, SQLite (better-sqlite3 + Drizzle ORM), Anthropic SDK for Sage
- **Auth**: Home Assistant OAuth2, sessions in SQLite
- **Deployment**: Docker with `@sveltejs/adapter-node`, Dokploy on Swarm (Ingress mode)

## Running locally

```bash
npm install
npm run dev    # http://localhost:5173
```

The database auto-seeds on first load from built-in bed/species data.

### Environment variables

Create a `.env` file:

```
ANTHROPIC_API_KEY=sk-ant-...
HA_URL=https://your-ha-instance.example.com
SMARTFARM_URL=http://localhost:5173
```

`HA_URL` and `SMARTFARM_URL` are needed for OAuth and irrigation data. Without them, auth is skipped in dev and irrigation shows "--".

## Deployment (Dokploy)

1. Create app in Dokploy, source: Git, build type: Dockerfile
2. Set env vars: `DATABASE_PATH=/app/data/farm.db`, `ANTHROPIC_API_KEY`, `HA_URL`, `SMARTFARM_URL`
3. Add volume mount at `/app/data` (persistent, survives deploys)
4. Port: `3000`, publish mode: **Ingress** (not Host)
5. Deploy. First boot creates and seeds the database.

Or with docker compose:

```bash
docker compose up -d
# http://localhost:3000
```

## API

| Endpoint | Method | What it does |
|----------|--------|--------------|
| `/api/beds` | GET | All beds with rotations and plantings |
| `/api/beds/[id]` | GET | Single bed detail |
| `/api/species` | GET | Plant catalog |
| `/api/species/[id]` | GET | Species detail with companions |
| `/api/sage` | POST | Chat with Sage (SSE streaming, 9 tools + web search for species research) |
| `/api/tasks` | GET | Open tasks + completed today |
| `/api/tasks` | POST | Create a task (manual or sage) |
| `/api/tasks/[id]` | PATCH | Mark a task done/undone |
| `/api/actions` | POST | Log an action (sachar, nota, etc.) |
| `/api/admin` | PUT/DELETE | Edit or remove rows |
| `/api/sync` | POST | Trigger Notion sync (disabled by default) |
| `/auth` | GET | Start HA OAuth flow |
| `/auth/callback` | GET | OAuth callback |
| `/auth/logout` | GET | End session |

## Project structure

```
src/
  lib/
    components/     # Svelte components (sprites, panels, modals)
    data/           # Static data (sprites, species display config)
    server/         # DB, schema, seed, auth, HA integration
    stores/         # Svelte stores (farm state, weather)
  routes/
    +page.svelte          # Main dashboard
    +page.server.js       # SSR data loading (beds + HA irrigation)
    admin/                # Admin table editor
    hortidex/             # Plant encyclopedia
    auth/                 # OAuth routes
    api/                  # REST endpoints
  hooks.server.js         # Auth guard, DB init
```

## Agent-assisted development

This repo is set up for agent-assisted development. See [CLAUDE.md](CLAUDE.md) for conventions, key files, and project context that AI coding agents use when working on this codebase.

## Key files

- `src/lib/server/schema.js` -- Drizzle schema (10 tables: beds, rotations, plantings, species, companions, tasks, action_log, sessions, sensor_readings, sync_log)
- `src/lib/server/auth.js` -- HA OAuth2 flow, session management
- `src/lib/server/homeassistant.js` -- valve state and irrigation history from HA
- `src/routes/api/sage/+server.js` -- Claude integration with tool use and streaming
- `src/lib/stores/farm.js` -- bed status logic (thirst, weeds, harvest readiness)
