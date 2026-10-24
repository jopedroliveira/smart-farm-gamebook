# CLAUDE.md -- SmartFarm Dashboard

## What this is

A **real farming dashboard with gamification**, not a game. Pedro manages 6 physical raised beds in Coimbra. The pixel-art RPG style (coins, XP, quests) is motivational wrapping around actual garden work.

- Irrigation data comes from Home Assistant (Sonoff SWV valves)
- Weed status tracks days since last physical visit (sachar action)
- "SACHAR" and "A CULTURA SAIU" log real actions done in the garden; irrigation is automatic and shown as information only
- Sage (Claude) is the AI assistant for farm advice and note-taking
- SQLite is the source of truth for all farm data (the Notion sync was removed)

## Stack

- **SvelteKit 5** (legacy/Svelte 4 syntax: `export let`, `$:`, `on:click`, not runes)
- **SQLite** via `better-sqlite3` + `drizzle-orm` (schema in `src/lib/server/schema.js`)
- **Anthropic SDK** (`@anthropic-ai/sdk`) for Sage, model `claude-opus-5-5` (override with `ANTHROPIC_MODEL`)
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

- `src/lib/server/schema.js` -- Drizzle schema (10 tables: beds, cycles, crops, species, companions, tasks, action_log, sessions, sensor_readings, sync_log)
- `src/lib/server/cycles.js` -- every write to cycles, crops and the diary (shared by Sage, the API routes and the admin page) plus `bedTimeline` / `bedPayload` reads
- `src/lib/server/migrate-cycles.js` -- one-time boot migration from the old `rotations`/`plantings` tables to cycles and crops; dry run with `node scripts/migrate-dry-run.js data/farm-prod.db`
- `src/lib/data/cycles.js` -- pure helpers that derive bed state from crops and dates (`bedPhase`, `cropsIn`, `cropStage`, `bedProgress`)
- `src/lib/server/db.js` -- DB connection singleton, auto-creates tables, runs the boot migrations
- `src/lib/server/auth.js` -- HA OAuth2, session CRUD, token refresh
- `src/lib/server/homeassistant.js` -- valve entities, irrigation history from HA REST API
- `src/routes/api/sage/+server.js` -- Claude wiring and SSE streaming. The system prompt is the join of `src/lib/server/sage-prompt/*.md` (one file per theme: persona, Coimbra calendar, rotation and soil, companions, pests, tool rules, format); edit those files to change what Sage knows. Context per turn in `sage-context.js`, tools in `sage-tools.js` (abrir_ciclo, registar_cultura, terminar_cultura, fechar_ciclo, corrigir_cultura, corrigir_ciclo, registar_diario, definir_proximo_plano, notas, tarefas, especies, web search), turn loop in `sage-loop.js`. Mutating tools trigger UI refresh via dataChanged event.
- `src/routes/api/crops/[id]/+server.js` -- PATCH: a crop leaves the bed (outcome colhida/falhada/retirada). `src/routes/api/cycles/[id]/+server.js` -- PATCH: close an empty cycle.
- `src/routes/api/tasks/+server.js` -- CRUD for tasks (manual, sage, auto)
- `src/lib/stores/farm.js` -- bed status logic (thirst, weeds, harvest readiness, auto-task generation)
- `src/lib/components/SageDeck.svelte` -- inline Sage chat panel (replaced SageModal)
- `src/lib/components/TasksPanel.svelte` -- dynamic task list (replaced QuestsPanel)
- `src/hooks.server.js` -- auth guard, DB seed on first boot

## Data model

- **beds** -- 6 raised beds (RB-11 to RB-23), physical dimensions and notes
- **cycles** -- one cycle = a set of crops that went into a bed together with a purpose (`title`, `scheme`). At most one open cycle per bed (partial unique index); `closed_on` null while open. `notes` carries pest history.
- **crops** -- one row per species in a cycle: `count`, `role` (principal/companheira/cobertura/atrativa/outra), `method` (semeado/plantado), `in_on`, `out_on`, `outcome` (colhida/falhada/retirada), `outcome_note`. A crop without `in_on` is planned for later in the same cycle ("a seguir"); `plan_when` says when, in a few words ("nov", "quando a alface sair"). `beds.next_rotation` is one line for the season after the cycle closes. The bed's state (VAZIA, PLANEADO, GERMINACAO, CRESCIMENTO, MATURACAO, COLHEITA) is derived from these dates and the species' `growth_days`; nothing is set by hand.
- **rotations_old / plantings_old** -- the previous tables, renamed by the boot migration and kept one release for rollback. Not read by the code.
- **tasks** -- dynamic tasks (source: auto/sage/manual), with bed_id, reason, done state
- **action_log** -- the diary: `observacao`, `intervencao`, `solo`, `sachar`, `nota`, linked to a bed and optionally a crop (`crop_id`)
- **sessions** -- HA OAuth sessions with access/refresh tokens

## Sensor data

No simulated sensors. Real data only:
- **Irrigation**: HA REST API queries Sonoff SWV valve history (7-day window) plus the valve sensors (flow for litres per watering, battery, leak, water supply). One valve per bed, `switch.sonoff_swv_rb_xx`.
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
- After DB schema changes, delete `data/farm.db` and restart (auto-seeds species, companions and beds; cycles start empty)
- The rotations -> cycles migration runs once on boot and logs a per-bed summary. Rehearse it on a production copy with `node scripts/migrate-dry-run.js data/farm-prod.db` (the file is never written)

## Rolling back the cycles migration

Stop the app, then on the data file (the previous image recreates empty `rotations`/`plantings` on boot, so the renames must happen first):

```sql
DROP TABLE IF EXISTS rotations; DROP TABLE IF EXISTS plantings;
ALTER TABLE rotations_old RENAME TO rotations;
ALTER TABLE plantings_old RENAME TO plantings;
DROP TABLE crops; DROP TABLE cycles;
```

Then deploy the previous image. `AGENTS.md` is a symlink to this file; never write to it.
- API routes: `curl http://localhost:5173/api/beds | jq`
