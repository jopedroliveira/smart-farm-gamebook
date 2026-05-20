# SmartFarm Dashboard

Pixel-art raised-bed farm dashboard with real-time weather, plant encyclopedia, and gamified task tracking. Built with SvelteKit, SQLite, and designed to integrate with Home Assistant sensors.

## Features

- **Farm Map** — Interactive pixel-art map of 6 raised beds with walking character, tool actions, and Pokémon-style interaction menus
- **Hortidex** — Plant encyclopedia in a Game Boy-style wooden device frame. Browse beds and 26+ species with companion planting data, growth stages, and rotation history
- **Weather** — Real-time weather from Open-Meteo with 7-day forecast and farm-specific advice
- **Sage Assistant** — Pixel-art farmhand NPC with quick-action queries about bed status, watering needs, and daily plans
- **Gamification** — Coins, XP, quests, and level badges that wrap real farming tasks (water, weed, harvest)
- **Seasonal Themes** — Auto-switches palette based on current month (spring/summer/autumn/winter)

## Tech Stack

- **Frontend**: SvelteKit 5 (legacy mode), CSS pixel-art sprites via `box-shadow`, Press Start 2P + VT323 fonts
- **Backend**: SvelteKit server routes, SQLite (better-sqlite3 + Drizzle ORM)
- **Deployment**: Docker with `@sveltejs/adapter-node`
- **Data**: Notion sync (daily cron + manual), sensor-ready schema for Home Assistant integration

## Quick Start (Development)

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173`. On first load, the database auto-seeds from the built-in bed/species data.

## Deployment with Dokploy

### 1. Create the application

In Dokploy, create a new application:
- **Source**: Git (point to this repo)
- **Build type**: Dockerfile
- **Dockerfile path**: `./Dockerfile`

### 2. Set environment variables

In the application's environment settings:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_PATH` | Yes | `/app/data/farm.db` |
| `PORT` | No | Defaults to `3000` |
| `NOTION_TOKEN` | No | Notion integration token (for sync) |
| `NOTION_BEDS_DB_ID` | No | Notion database ID for raised beds |

### 3. Add persistent storage

Add a volume mount so the SQLite database survives container restarts:

- **Mount path**: `/app/data`
- **Type**: Volume (persistent)

### 4. Configure the port

- **Exposed port**: `3000`
- Set up your domain/proxy in Dokploy as needed.

### 5. Deploy

Hit deploy. The first boot:
1. Builds the SvelteKit app with `adapter-node`
2. Creates the SQLite database at `/app/data/farm.db`
3. Seeds it with bed, species, and companion planting data
4. Starts the server with cron jobs (game tick every 60s, Notion sync daily at 06:00)

### Alternative: Docker Compose

```bash
docker compose up -d
# App at http://localhost:3000
```

## Notion Sync

When `NOTION_TOKEN` and `NOTION_BEDS_DB_ID` are set:

- **Automatic**: Syncs daily at 06:00
- **Manual**: `POST /api/sync` or use the sync button in the UI
- **Direction**: One-way (Notion → local DB). Edit beds in Notion, the app pulls changes.

The sync stub is ready — the property mapping in `src/lib/server/notion-sync.js` needs customization to match your specific Notion database columns.

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/beds` | GET | All beds with plantings + sensor readings |
| `/api/beds/[id]` | GET | Single bed detail with history |
| `/api/species` | GET | Plant catalog with lore |
| `/api/species/[id]` | GET | Species detail + companions + beds |
| `/api/sensors/[bedId]` | GET | Latest sensor readings |
| `/api/sensors/[bedId]/history` | GET | Time-series (`?metric=moisture&hours=24`) |
| `/api/sync` | POST | Trigger Notion sync |
| `/api/sync/status` | GET | Latest sync result |

## Project Structure

```
src/
  lib/
    components/     # 20 Svelte components (pixel sprites, panels, modals)
    data/           # Static data (sprites, seed sources)
    server/         # Backend: DB, schema, seed, sync, game tick
    stores/         # Svelte stores (farm state, weather)
  routes/
    +page.svelte          # Main dashboard
    +page.server.js       # SSR data loading
    hortidex/             # Plant encyclopedia
    api/                  # REST endpoints
  hooks.server.js         # Cron jobs (game tick, Notion sync)
```

## Future

- **Home Assistant integration** — Replace simulated sensors with real moisture/temperature probes via HA REST API or MQTT
- **Activity logging** — Turn the water/weed/harvest buttons into real task trackers (who did what, when)
- **Sage LLM** — Connect the assistant to Claude API for intelligent farm advice based on real sensor data
