# Bed timeline implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `rotations` and `plantings` with `cycles`, `crops` and a diary so the app and Sage answer "what is in this bed", "what do I plant here now" and "what did this bed have" from one honest timeline per bed.

**Architecture:** New tables plus a boot migration that renames the old ones to `_old`. One server module (`cycles.js`) owns every write and the per-bed timeline read, and is shared by the Sage tools, the HTTP routes and the loaders. One pure module (`$lib/data/cycles.js`) derives bed state from dates for the UI. The Sage route shrinks to wiring: prompt files, a context builder and a tool module, each tested on an in-memory DB.

**Tech Stack:** SvelteKit (Svelte 4 syntax), plain JS, better-sqlite3 + drizzle-orm, vitest, Anthropic SDK, Playwright for the screen checks.

**Spec:** `docs/superpowers/specs/2026-10-22-bed-timeline-design.md`

## Global constraints

- Svelte 4 syntax (`export let`, `$:`, `on:click`), no runes, no TypeScript.
- Server env through `$env/dynamic/private`; tests mock it with `DATABASE_PATH=':memory:'` like `sage-rotations.test.js`.
- UI text and Sage text in PT-PT without accented characters ("rotacao", "Terminado"). Code, comments, commits in English.
- Tools take ids from the context and never pick between candidates.
- Dates are `YYYY-MM-DD` strings. "Today" is `new Date().toISOString().slice(0, 10)`.
- Role vocabulary: `principal`, `companheira`, `cobertura`, `atrativa`, `outra`. Method: `semeado`, `plantado`. Outcome: `colhida`, `falhada`, `retirada`. Diary actions: `observacao`, `intervencao`, `solo`, `sachar`, `nota`.
- Old tables and old species columns stay this release. Nothing the previous image reads is dropped.
- Conventional Commits, subject 50 chars or fewer, each commit ends with `Claude-Session: https://claude.ai/code/session_016onLBEvuhxzNsroxvAWxSy`.
- Scoped tests directly after each change; the full suite once, through `~/.claude/hooks/gate.sh -- npm test`, right before the push.

## Review focus

1. A bed whose open cycle has crops with `in_on` null (accepted plan, nothing sown) must show VAZIA on the map and "planeado" in the sheet, never a progress bar at 0 days. Test in Task 3 (`bedPhase` with `inOn: null`).
2. Ending the last crop of a cycle through the sheet must not close the cycle by itself; the UI offers it and the user confirms. Test in Task 6 (`endCrop` leaves `closed_on` null).
3. `fechar_ciclo` on a cycle with crops still in must refuse with a message that lists the crops, so Sage can ask which to end. Test in Task 4.
4. The migration must be idempotent on a second boot: once `cycles` exists it does nothing, and `rotations_old` is not renamed again. Test in Task 2.
5. `registar_cultura` with a species id that is not in the catalog must refuse with the catalog hint, not throw a foreign key error at the model. Test in Task 4.

---

### Task 1: Schema for cycles, crops and the diary column

**Files:**
- Modify: `src/lib/server/schema.js` (replace `rotations` and `plantings` exports; add `cycles`, `crops`; add `cropId` to `actionLog`)
- Modify: `src/lib/server/db.js` (`createTables`: add the two tables and the partial index; `migrate`: add `crop_id`)
- Test: `src/lib/server/__tests__/schema.test.js`

**Interfaces:**
- Produces: drizzle tables `schema.cycles` (`id, bedId, title, scheme, startedOn, closedOn, notes, createdAt`), `schema.crops` (`id, cycleId, speciesId, count, role, method, inOn, outOn, outcome, outcomeNote`), `schema.actionLog.cropId`. SQL names are snake_case of these.

- [ ] **Step 1: Write the failing test**

```js
import { describe, it, expect, vi } from 'vitest';
vi.mock('$env/dynamic/private', () => ({ env: { DATABASE_PATH: ':memory:' } }));
process.env.DATABASE_PATH = ':memory:';
const { getDb } = await import('../db.js');
const schema = await import('../schema.js');

describe('cycles schema', () => {
  const db = getDb();
  db.insert(schema.beds).values({ id: 'RB-11', notionCode: 'RB-11', widthM: 1, heightM: 1 }).run();

  it('allows one open cycle per bed', () => {
    db.insert(schema.cycles).values({ bedId: 'RB-11', title: 'A' }).run();
    expect(() => db.insert(schema.cycles).values({ bedId: 'RB-11', title: 'B' }).run()).toThrow(/UNIQUE/);
    db.insert(schema.cycles).values({ bedId: 'RB-11', title: 'C', closedOn: '2026-01-01' }).run();
    expect(db.select().from(schema.cycles).all()).toHaveLength(2);
  });

  it('has crop_id on action_log', () => {
    const cols = Object.keys(schema.actionLog);
    expect(cols).toContain('cropId');
  });
});
```

- [ ] **Step 2: Run it**: `npx vitest run src/lib/server/__tests__/schema.test.js`. Expected: FAIL, `schema.cycles` undefined.

- [ ] **Step 3: Implement.** In `schema.js` delete `rotations` and `plantings`; add:

```js
export const cycles = sqliteTable('cycles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  bedId: text('bed_id').notNull().references(() => beds.id),
  title: text('title').notNull(),
  scheme: text('scheme'),
  startedOn: text('started_on'),
  closedOn: text('closed_on'),
  notes: text('notes'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});
export const crops = sqliteTable('crops', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  cycleId: integer('cycle_id').notNull().references(() => cycles.id),
  speciesId: text('species_id').notNull().references(() => species.id),
  count: integer('count').notNull().default(1),
  role: text('role').notNull().default('outra'),
  method: text('method').notNull().default('plantado'),
  inOn: text('in_on'),
  outOn: text('out_on'),
  outcome: text('outcome'),
  outcomeNote: text('outcome_note'),
});
```

In `db.js` `createTables`: remove the `rotations` and `plantings` CREATE statements, add the two tables with the same columns, add `crop_id INTEGER REFERENCES crops(id)` to `action_log`, and `CREATE UNIQUE INDEX IF NOT EXISTS idx_one_open_cycle ON cycles(bed_id) WHERE closed_on IS NULL;`. In `migrate`: `ALTER TABLE action_log ADD COLUMN crop_id INTEGER` when missing (same pattern as `client_id`). Note: `crops` references `species`, so create order is species, cycles, crops.

- [ ] **Step 4: Run**: same command. Expected: PASS. `npx vitest run src/lib/server/__tests__/db.test.js` must also still pass.

- [ ] **Step 5: Commit**: `git add src/lib/server/schema.js src/lib/server/db.js src/lib/server/__tests__/schema.test.js && git commit -m "feat(db): cycles and crops tables, diary crop_id"`

(The app does not build at this point because routes still import `schema.rotations`; that is expected until Task 7.)

---

### Task 2: Migration from rotations to cycles

**Files:**
- Create: `src/lib/server/migrate-cycles.js`
- Create: `scripts/migrate-dry-run.js`
- Modify: `src/lib/server/db.js` (call it from `migrate`)
- Test: `src/lib/server/__tests__/migrate-cycles.test.js`

**Interfaces:**
- Produces: `migrateRotationsToCycles(sqlite, { overrides = [] } = {}) -> summary | null` where `sqlite` is a raw better-sqlite3 handle. Returns `null` when there is nothing to do (no `rotations` table, or `cycles` already has rows, or `rotations_old` exists). Otherwise runs inside one transaction and returns `{ beds: [{ bedId, open: { title, crops: [{ speciesId, count, role, inOn }] } | null, closedCount, emptyOpen: [title] }], speciesMissing: [{ id, family, growthDays }] }`.
- Produces: `backfillSpecies(sqlite)`: sets `growth_days` from `cycle_days` then from `PLANT_SPECIES[id].growthDays`; `germ_days` from `germination_days`; when `sow_from` and `sow_to` are both null and `sowing_window` matches `/^([A-Za-z]{3})-([A-Za-z]{3})/` sets them. Idempotent.
- Produces: `roleFromFn(fn) -> role` and `summaryText(summary) -> string` (plain lines, one per bed, used by the boot log and the dry-run script).
- `overrides`: `[{ bedId, title, speciesId, count, inOn }]` applied to open rotations without plantings whose title includes `title`; none are needed for the 2026-10-23 production copy, the list ships empty.

- [ ] **Step 1: Write the failing tests.** Build a legacy DB in memory with the old DDL (copy the `rotations` and `plantings` CREATE from the previous `db.js`, species and beds via `createTables`) and seed:
  - RB-13: rotation 15 "RB-13 Primavera 2026 · Brassicáceas (Falhado)" `Terminado`, failed=1, planted 2026-02-15, no plantings; rotation 24 "RB-13 Primavera-Verão 2026 · Feijão verde" `Terminado`, planted 2026-04-20, harvest_end 2026-08-30, plantings feijao_verde ×6 fn "Cultura principal — fixa azoto", feijao_verde ×2 fn "Anão"; rotation 30 "RB-13 Outono-Inverno 2026 · Alho + Cebola + Cenoura" `Planeado`, planted_date null, plantings alho ×10 fn "Cultura principal", cenoura ×6 fn "companheira".
  - RB-22: rotation 20 `Terminado` with plantings; rotation 26 `Plantado` planted 2026-09-20 with plantings alho_frances ×7 fn "Cultura principal"; rotation 99 `Plantado` planted 2026-09-25, no plantings, title "RB-22 Teste · Rabanetes".

```js
it('closes finished rotations and merges open ones into one cycle', () => {
  const summary = migrateRotationsToCycles(sqlite);
  const cycles = sqlite.prepare('select * from cycles where bed_id=? order by id').all('RB-13');
  expect(cycles.map(c => [c.title, c.closed_on !== null])).toEqual([
    ['Primavera 2026 · Brassicáceas (Falhado)', true],
    ['Primavera-Verão 2026 · Feijão verde', true],
    ['Outono-Inverno 2026 · Alho + Cebola + Cenoura', false],
  ]);
  const open = cycles[2];
  expect(open.started_on).toBeNull();
  const crops = sqlite.prepare('select * from crops where cycle_id=? order by id').all(open.id);
  expect(crops.map(c => [c.species_id, c.count, c.role, c.in_on])).toEqual([
    ['alho', 10, 'principal', null], ['cenoura', 6, 'companheira', null],
  ]);
  const feijao = sqlite.prepare("select * from crops where species_id='feijao_verde'").all();
  expect(feijao).toHaveLength(1);
  expect(feijao[0]).toMatchObject({ count: 8, role: 'principal', out_on: '2026-08-30', outcome: 'colhida' });
  expect(summary.beds.find(b => b.bedId === 'RB-13').closedCount).toBe(2);
});
it('marks failed rotations and keeps pest notes as the outcome note', ...) // failed=1 planting -> outcome 'falhada', outcome_note = pest_notes
it('lists open rotations without plantings and never invents a species', () => {
  const summary = migrateRotationsToCycles(sqlite);
  const rb22 = summary.beds.find(b => b.bedId === 'RB-22');
  expect(rb22.emptyOpen).toEqual(['RB-22 Teste · Rabanetes']);
  expect(sqlite.prepare("select count(*) c from crops where species_id='rabanete'").get().c).toBe(0);
});
it('applies an override for an open rotation without plantings', ...) // overrides: [{ bedId:'RB-22', title:'Rabanetes', speciesId:'rabanete', count:20, inOn:'2026-09-25' }] -> crop exists in RB-22 open cycle
it('renames the old tables and is a no-op on the second run', () => {
  migrateRotationsToCycles(sqlite);
  const names = sqlite.prepare("select name from sqlite_master where type='table'").all().map(r => r.name);
  expect(names).toContain('rotations_old'); expect(names).not.toContain('rotations');
  expect(migrateRotationsToCycles(sqlite)).toBeNull();
});
it('clears the empty next_rotation template and keeps real text', ...) // template text: the exact string seen in production, read it from data/farm-prod.db beds.next_rotation where it repeats; keep RB-11's text
it('backfills growth_days from cycle_days then the JS file', ...) // species with cycle_days 45 and growth_days null -> 45; species 'rucula' with both null -> 30
```

- [ ] **Step 2: Run**: `npx vitest run src/lib/server/__tests__/migrate-cycles.test.js`. Expected: FAIL, module not found.

- [ ] **Step 3: Implement `migrate-cycles.js`.** Rules in the spec's order, per bed, inside `sqlite.transaction`. Title strip: remove a leading `^RB-\d\d\s*` from the old title. `scheme` = `[rotation, first line of notes].filter(Boolean).join(' · ')`. Closed cycle dates: `started_on = planted_date`, `closed_on = harvest_end || harvest_start || updated_at.slice(0,10)`. Open merge: `title` = stripped titles joined with ' + ', `started_on` = earliest non-null `planted_date`. Crops in the open cycle: `in_on` = their rotation's `planted_date` (null when Planeado). Duplicate merge key: `(cycle, species_id, in_on)`. `method` = `semeado` when the species row has `sow_from` set and `plant_from` null, else `plantado`. `roleFromFn`: lowercase; starts with "cultura principal" or equals "principal" -> `principal`; includes "companheira" -> `companheira`; starts with "atrai" -> `atrativa`; starts with "cobertura" -> `cobertura`; else `outra`. Empty template detection: `next_rotation` trimmed equals the template string or is empty -> null. End with `ALTER TABLE rotations RENAME TO rotations_old` and `plantings` likewise. Call `backfillSpecies` first, always (also when the cycles migration is a no-op), from `db.js`.

- [ ] **Step 4: Wire `db.js`**: in `migrate(sqlite)`, after the column checks: `backfillSpecies(sqlite); const summary = migrateRotationsToCycles(sqlite); if (summary) console.log('[migrate] rotations -> cycles\n' + summaryText(summary));`.

- [ ] **Step 5: Write `scripts/migrate-dry-run.js`**: `node scripts/migrate-dry-run.js <path.db>` copies the file to the scratch dir (`os.tmpdir()`), opens it with better-sqlite3, runs `backfillSpecies` and `migrateRotationsToCycles`, prints `summaryText`, and also prints every open cycle with its crops in full and the species missing family or growth_days. Never writes to the given path.

- [ ] **Step 6: Run the tests**: PASS. Then the dry run on the production copy: `node scripts/migrate-dry-run.js data/farm-prod.db`. Keep the output; it goes to Pedro before deploy.

- [ ] **Step 7: Commit**: `git add src/lib/server/migrate-cycles.js scripts/migrate-dry-run.js src/lib/server/db.js src/lib/server/__tests__/migrate-cycles.test.js && git commit -m "feat(db): migrate rotations to cycles on boot"`

---

### Task 3: Derived bed state (pure module)

**Files:**
- Create: `src/lib/data/cycles.js`
- Modify: `src/lib/data/beds.js` (remove `activeRotations`, `allActivePlantings`, `bedAvgCycle`, `bedCycleProgress`, `speciesStage`, `bedPlantedDate`, `bedPhase`; keep `daysSince`, `daysUntil`; drop `rotations` from every `NOTION_BEDS` entry)
- Modify: `src/lib/data/plant-lore.js` (delete `bedsForSpecies` and the `NOTION_BEDS` import)
- Modify: `src/lib/stores/farm.js` (see below)
- Test: `src/lib/data/__tests__/cycles.test.js`

**Interfaces:**
- Consumes the bed shape produced by Task 5: `bed.cycles[]` each `{ id, title, scheme, startedOn, closedOn, notes, crops: [{ id, speciesId, count, role, method, inOn, outOn, outcome, outcomeNote, species: { id, name, family, sprite, color, growthDays } }] }`.
- Produces in `$lib/data/cycles.js`:
  - `openCycle(bed) -> cycle | null` (the one with `closedOn === null`)
  - `cropsIn(bed) -> crop[]` (open cycle's crops with `outOn === null`)
  - `cropDaysIn(crop, today = new Date()) -> number | null` (null when `inOn` null)
  - `cropStage(crop) -> 0|1|2|3` using `crop.species.growthDays || 60`, same thresholds as the old `speciesStage` (0.15, 0.55, 0.95); returns 0 when `inOn` null
  - `bedProgress(bed) -> 0..1` (oldest `inOn` among crops in, over the average `growthDays`), 0 when none sown
  - `bedPhase(bed) -> 'VAZIA' | 'PLANEADO' | 'GERMINACAO' | 'CRESCIMENTO' | 'MATURACAO' | 'COLHEITA'`: VAZIA no open cycle or no crops; PLANEADO crops but none with `inOn`; COLHEITA any crop with `cropStage === 3`; else by the max stage
  - `bedReady(bed) -> boolean` (`bedPhase === 'COLHEITA'`)
  - `closedCycles(bed) -> cycle[]` newest first by `closedOn`
  - `primaryCrop(bed) -> crop | null` (role `principal` first, then highest count)
- `farm.js`: `enrichBed` sets `allPlantings: cropsIn(bed)` (kept name, now crops) and `plantedDate` = oldest `inOn`; `bedReady`, `bedStatusLabel`, `bedPrimarySpecies`, `autoTasks` use the new helpers; `bedStage` = max `cropStage`; `bedDaysUntilHarvest` removed (no `harvestStart` any more; the harvest-ready modal shows per-crop progress instead). `autoTasks` harvest reason becomes `'cultura madura'`.

- [ ] **Step 1: Write the failing tests** (fixed `today` via a parameter or `vi.setSystemTime`):

```js
const alface = { id: 'alface', name: 'Alface', family: 'Asteraceae', sprite: 'lettuce', color: '#4fa83a', growthDays: 40 };
const bed = (crops, closedOn = null) => ({ cycles: [{ id: 1, title: 'T', closedOn, crops }] });
it('derives VAZIA, PLANEADO and COLHEITA from crops', () => {
  expect(bedPhase({ cycles: [] })).toBe('VAZIA');
  expect(bedPhase(bed([]))).toBe('VAZIA');
  expect(bedPhase(bed([{ inOn: null, outOn: null, species: alface }]))).toBe('PLANEADO');
  vi.setSystemTime(new Date('2026-10-23'));
  expect(bedPhase(bed([{ inOn: '2026-09-01', outOn: null, species: alface }]))).toBe('COLHEITA');
  expect(bedPhase(bed([{ inOn: '2026-10-20', outOn: null, species: alface }]))).toBe('GERMINACAO');
});
it('ignores crops that are out and cycles that are closed', ...)
it('progress is 0 while nothing is sown', () => expect(bedProgress(bed([{ inOn: null, outOn: null, species: alface }]))).toBe(0));
it('primary crop prefers role principal', ...)
```

- [ ] **Step 2: Run**: `npx vitest run src/lib/data`. FAIL.
- [ ] **Step 3: Implement** `cycles.js` and the edits to `beds.js`, `plant-lore.js`, `farm.js`.
- [ ] **Step 4: Run**: PASS.
- [ ] **Step 5: Commit**: `git commit -m "feat(data): derive bed state from cycles and crops"`

---

### Task 4: Cycle operations on the server

**Files:**
- Create: `src/lib/server/cycles.js`
- Delete: `src/lib/server/sage-rotations.js`, `src/lib/server/__tests__/sage-rotations.test.js`
- Test: `src/lib/server/__tests__/cycles.test.js`

**Interfaces:**
- Produces (all take the drizzle `db` first; all throw `Error` with a PT-PT message on refusal; writes return the fresh row):
  - `openCycle(db, { bedId, title, scheme }) -> cycle`; refuses when the bed already has an open cycle: `"RB-13 ja tem um ciclo aberto (id 12, \"Outono 2026\"). Fecha-o primeiro ou regista a cultura nele."`
  - `addCrop(db, { cycleId, speciesId, count = 1, role = 'outra', method = 'plantado', inOn = null }) -> crop`; refuses when the cycle is closed, when the species is not in the catalog (`"Especie \"x\" nao esta no catalogo. Consulta ou regista a especie primeiro."`), when role or method is outside the vocabulary; when `inOn` is set and the cycle's `startedOn` is null, sets `startedOn = inOn`.
  - `endCrop(db, { cropId, outOn = today, outcome, outcomeNote = null }) -> crop`; refuses unknown outcome and a crop already out. Does not close the cycle.
  - `closeCycle(db, { cycleId, closedOn = today }) -> cycle`; refuses while crops are in, listing them: `"O ciclo ainda tem culturas na terra: alface (id 4), salsa (id 5). Termina-as primeiro."`
  - `fixCrop(db, { cropId, speciesId?, count?, role?, method?, inOn?, outOn?, outcome?, outcomeNote? }) -> crop`; same validations; `inOn: null` allowed to un-sow.
  - `logDiary(db, { bedId, action, text, cropId = null }) -> row`; action in the vocabulary; `cropId` must belong to the bed.
  - `setNextPlan(db, { bedId, text }) -> bed`.
  - `bedTimeline(db, bedId) -> { open: cycleWithCrops | null, closed: cycleWithCrops[], diary: row[] }` where every crop carries `species: { id, name, family, sprite, color, growthDays }` from the species table (`growthDays = growth_days`), `diary` is the last 10 `action_log` rows for the bed newest first. Used by Task 5 loaders and the Sage context.
  - `resolveBedId(db, bedId)` moved here from the Sage route, unchanged behavior.

- [ ] **Step 1: Write the failing tests** on `:memory:` (seed one bed, species `alface` and `salsa` with `growth_days`): one `it` per bullet above including each refusal text (`toThrow(/ja tem um ciclo aberto/)`, `/nao esta no catalogo/`, `/ainda tem culturas na terra: alface \(id \d+\), salsa/`), `addCrop` setting `startedOn`, `endCrop` leaving `closedOn` null, `bedTimeline` returning species info on crops and diary newest first.
- [ ] **Step 2: Run**: `npx vitest run src/lib/server/__tests__/cycles.test.js`. FAIL.
- [ ] **Step 3: Implement** `cycles.js`. Delete `sage-rotations.js` and its test.
- [ ] **Step 4: Run**: PASS.
- [ ] **Step 5: Commit**: `git commit -m "feat(server): cycle operations shared by Sage and routes"`

---

### Task 5: Loaders and HTTP routes

**Files:**
- Modify: `src/routes/+page.server.js`, `src/routes/api/beds/+server.js`, `src/routes/api/beds/[id]/+server.js`, `src/routes/hortidex/+page.server.js`, `src/routes/admin/+page.server.js`, `src/routes/api/admin/+server.js`
- Create: `src/routes/api/crops/[id]/+server.js`, `src/routes/api/cycles/[id]/+server.js`
- Delete: `src/routes/api/sync/+server.js`, `src/lib/server/notion-sync.js` (they only wrote the old tables; `syncLog` stays in the schema, `lastSync` is dropped from the page data)
- Modify: `src/lib/server/seed.js` (seed species, companions and beds only; no cycles)
- Test: `src/lib/server/__tests__/bed-payload.test.js` for the shared payload helper

**Interfaces:**
- Produces: `bedPayload(db, bed) -> { id, notionCode, widthM, heightM, notes, nextRotation, cycles: [...], diary: [...] }` exported from `src/lib/server/cycles.js` (added here), using `bedTimeline`; `cycles` is `[open, ...closed]` with open first when present.
- `+page.server.js`: `beds = allBeds.map(b => ({ ...bedPayload(db, b), horasSemRega, ultimaRega, duracaoRegaMin, diasSemSachar, valvula }))`, no `lastSync`.
- `api/beds` and `api/beds/[id]`: return `bedPayload` plus `sensors` as today.
- `hortidex/+page.server.js`: `beds[bed.id] = bedPayload(db, bed)`; the `species` map adds `growthDays: sp.growthDays` (table column only).
- `admin/+page.server.js`: returns `{ beds, cycles, crops, species, actions }` with `cycles` all rows and `crops` all rows plus `speciesName`.
- `api/admin` PUT: tables `beds`, `species`, `cycles` (fields `title, scheme, startedOn, closedOn, notes`), `crops` (fields `speciesId, count, role, method, inOn, outOn, outcome, outcomeNote`, through `fixCrop`). DELETE: `actions`, `crops` (one row), `cycles` (its crops then the cycle). Invalid table -> 400 as today. Refusals from `cycles.js` -> 409 `{ error: message }`.
- `PATCH /api/crops/[id]` body `{ outOn?, outcome, outcomeNote? }` -> `endCrop`, returns `{ crop, cycleEmpty: boolean }` (`cycleEmpty` true when no crop of that cycle is still in). 409 on refusal.
- `PATCH /api/cycles/[id]` body `{ closedOn? }` -> `closeCycle`, returns `{ cycle }`. 409 on refusal.

- [ ] **Step 1: Write the failing test** for `bedPayload` (open first, closed newest first, crops carry species, diary present).
- [ ] **Step 2: Run**: FAIL.
- [ ] **Step 3: Implement** the helper, the loaders, the routes, the seed change, the deletions.
- [ ] **Step 4: Run** the unit test (PASS) and `npm run build` (must succeed now that nothing imports the old tables). Start the dev server on a copy of `data/farm-prod.db` with the fake session (see the scratchpad notes in the session) and `curl -s -b session=testsession localhost:5199/api/beds | jq '.beds[0].cycles[0]'` shows the open cycle with crops.
- [ ] **Step 5: Commit**: `git commit -m "feat(api): serve cycles and crops, crop and cycle endpoints"`

---

### Task 6: Screens

**Files:**
- Modify: `src/lib/components/BedSheet.svelte`, `src/lib/components/InteractionMenu.svelte`, `src/routes/+page.svelte` (harvest handler), `src/lib/components/Bed.svelte`, `src/lib/components/BedInfoModal.svelte`, `src/lib/components/HarvestReadyModal.svelte`, `src/routes/hortidex/+page.svelte`, `src/routes/admin/+page.svelte`, `src/lib/components/SageDeck.svelte` (only if it reads rotations; it reads `bedReady` and `PLANT_SPECIES` for harvested names, keep)

**Interfaces:**
- Consumes Task 3 helpers and the Task 5 payload and endpoints.
- Harvest flow (both menus): main -> `pickCrop` (crops in, label `species.name ×count`, role as tag) -> `pickOutcome` (buttons `COLHIDA`, `FALHOU`, `RETIREI`) -> optional note (one `input`, placeholder `causa ou nota (opcional)`, `GUARDAR`) -> dispatch `action` `{ tool: 'harvest', payload: { cropId, outcome, note } }`. Only one crop in: skip nothing (still confirm the outcome).
- `+page.svelte` `handleUseTool` harvest: `PATCH /api/crops/:id`; on `cycleEmpty` show a confirm step in the same sheet or menu (`O ciclo acabou. Fechar?` with `FECHAR CICLO` / `DEIXAR ABERTO`) that calls `PATCH /api/cycles/:id`; then `invalidateAll()`; coins and XP as today using `crop.count` when outcome is `colhida`. Log line: `Alface saiu de RB-13 (colhida)`.
- `Bed.svelte`: tiles from `cropsIn(bed)` using `crop.species.sprite`, stage from `cropStage(crop)`; status pill uses `bedStatusLabel` (unchanged signature); progress from `bedProgress`; sparkle from `bedReady`.
- `BedInfoModal.svelte` sections in order: portrait (primary crop), `CICLO ABERTO` (title, scheme, each crop: sprite, name ×count, role, `semeado/plantado em <date>` or `por semear`, stage label, days in), `PROXIMO PLANO` (`bed.nextRotation`), `DIARIO` (last 5: date, action, text), `CICLOS ANTERIORES` (one line each: title, dates, crops joined, FALHADO tag if any crop failed), `NOTAS DO TALHAO`, `ESTADO` as today.
- `HarvestReadyModal.svelte`: list `cropsIn(bed)` with `cropStage`, percent from `cropDaysIn / species.growthDays`; intro `N culturas na terra`.
- `Hortidex`: bed mode tabs become `geral` (notes, open cycle title and scheme, crop count), `culturas` (crops in, click -> species), `historico` (closed cycles one line each, failed tag); species "em cama" tab uses `cropsIn` over `data.beds`. Species detail reads `growthDays` from the map. Remove `bedEstado`, `statusKey` keeps working on `bedPhase` values.
- `Admin`: tabs `CANTEIROS`, `CICLOS`, `CULTURAS`, `DIARIO`, `ESPECIES`. Cycles table: bed, title, scheme, started, closed, notes, delete. Crops table: cycle id + bed, species (select over `data.species`), count, role (select), method (select), in, out, outcome (select), note, delete. Double-click edit as today, through `PUT /api/admin`.

- [ ] **Step 1: Implement** component by component, running `npm run build` after each file (the Svelte compiler is the test here).
- [ ] **Step 2: Playwright check** on the dev server with the production copy, phone width 390 and desktop 1280: screenshot the map, open RB-13's sheet, run the harvest flow on a copy (outcome `colhida`), see the crop leave and the cycle-close prompt, open the info modal, the hortidex bed and species views, and the admin cycles and crops tabs. Check the console for errors. Save screenshots in the scratchpad.
- [ ] **Step 3: Commit**: `git commit -m "feat(ui): bed sheet, info, hortidex and admin on cycles"`

---

### Task 7: Sage prompt files, context and tools

**Files:**
- Create: `src/lib/server/sage-prompt/00-persona.md`, `10-coimbra.md`, `20-rotacao-solo.md`, `30-consociacao.md`, `40-pragas.md`, `50-ferramentas.md`, `60-formato.md`
- Create: `src/lib/server/sage-prompt.js`, `src/lib/server/sage-context.js`, `src/lib/server/sage-tools.js`
- Modify: `src/routes/api/sage/+server.js` (becomes wiring only)
- Test: `src/lib/server/__tests__/sage-prompt.test.js`, `src/lib/server/__tests__/sage-context.test.js`, `src/lib/server/__tests__/sage-tools.test.js`

**Interfaces:**
- `sage-prompt.js`: `export const SYSTEM_PROMPT` = the files' contents in filename order joined with `\n\n`, loaded with `import.meta.glob('./sage-prompt/*.md', { query: '?raw', eager: true, import: 'default' })`; `export const PROMPT_FILES` = sorted file names (for the test).
- `sage-context.js`: `buildFarmContext(db, dashboardCtx, irrigation) -> object` (pure over its inputs; the route fetches irrigation). Per bed: `id, area_m2, notas, proximo_plano, rega, estado, ciclo_aberto: { id, titulo, esquema, inicio, culturas: [{ id, especie, familia, papel, dias, fase }] } | null, diario: [{ data, acao, texto }] (last 5), ciclos_anteriores: [ "Outono 2025: alho, favas (2025-10-01 a 2026-03-15, 1 falhada)" ] (strings, one per closed cycle)`. `fase` from `cropStage` label (`germinacao, crescimento, maturacao, pronto, por semear`). `compact()` moves here.
- `sage-tools.js`: `export const TOOLS` (web_search + the kept six + the seven new) and `export function executeToolCall(db, name, input)`. New tool schemas: `abrir_ciclo(bed_id, title, scheme)`, `registar_cultura(cycle_id, species_id, count?, role?, method?, in_on?)`, `terminar_cultura(crop_id, outcome, out_on?, outcome_note?)`, `fechar_ciclo(cycle_id, closed_on?)`, `corrigir_cultura(crop_id, species_id?, count?, role?, method?, in_on?, out_on?, outcome?, outcome_note?)`, `registar_diario(bed_id, action, text, crop_id?)`, `definir_proximo_plano(bed_id, text)`. Each calls the Task 4 function and returns `{ ok: true, message }`; refusals propagate as thrown errors (the loop turns them into `is_error` results). `consultar_historico_acoes` returns `acao` too. `consultar_especie` adds `companheiras` and `evitar` (names from the `companions` table) and `dias_ciclo` from `growth_days`. Removed: the six rotation and planting tools.
- Route: `executeTool: (name, input) => executeToolCall(getDb(), name, input)`; context block as today.

Prompt file contents (PT-PT, no accents, existing voice; the spec's five additions):
- `00-persona.md`: the current "Tu es o Sage..." through "Principios" and "A horta do Pedro" blocks, minus the "Problemas conhecidos" list (that history now lives in the data; keep the two standing facts: RB-21 nitrogen excess, forficulas linked to the substrate, and the milk treatment for oidio as general knowledge).
- `10-coimbra.md`: the "Consciencia sazonal" block.
- `20-rotacao-solo.md`: rotation by family and by what the previous crop left (legume before a heavy feeder, roots after leaves), finite substrate in raised beds, when to say a bed needs compost or rest; the rule for "o que planto aqui agora": start from the crops still in, the month, the families of the last two or three cycles, the bed's pest history and the next plan; propose one scheme (main crop plus companions) and say why in one sentence; offer to register it with `abrir_ciclo` and `registar_cultura`; projection on request: next two or three cycles, one line each, offer `definir_proximo_plano` for the first.
- `30-consociacao.md`: how to build a scheme: one principal, companions from the `companions` table (`consultar_especie`), flowers and aromatics as pest management, avoid listed antagonists, count by the bed's area.
- `40-pragas.md`: the ladder: identify first (ask what the damage looks like), then barriers, companions and natural enemies, then organic treatments last; soil memory: a failed brassica from Delia radicum rules out brassicas in that bed for two to three years, read it from `ciclos_anteriores` and `diario`; register observation and intervention with `registar_diario` when Pedro confirms.
- `50-ferramentas.md`: the current tool rules rewritten for the new tools: only on explicit request or confirmation; ids come from the context (`ciclo_aberto.id`, `culturas[].id`); never guess; `abrir_ciclo` only when there is no open cycle, else `registar_cultura` in it; `terminar_cultura` then offer `fechar_ciclo` when the last crop leaves; `corrigir_cultura` when Pedro says the state is wrong; species research rule as today.
- `60-formato.md`: the current "Formato" block.

- [ ] **Step 1: Write the failing tests**:
  - prompt: `PROMPT_FILES` equals the seven names; `SYSTEM_PROMPT` contains `Tu es o Sage` and `terminar_cultura` and has no character outside ASCII plus the few symbols already used (regex `/[áàâãéêíóôõúç]/i` not found).
  - context: on `:memory:` with one bed, an open cycle with one sown crop and one closed cycle, `buildFarmContext` returns `ciclo_aberto.culturas[0]` with `id`, `fase`, and `ciclos_anteriores[0]` a string with the title and dates; a bed with nothing has no `ciclo_aberto` key (compact).
  - tools: `executeToolCall(db, 'abrir_ciclo', ...)` creates a cycle; a second `abrir_ciclo` on the same bed throws `/ja tem um ciclo aberto/`; `registar_cultura` with unknown species throws `/nao esta no catalogo/`; `terminar_cultura` then `fechar_ciclo` succeed; `fechar_ciclo` with a crop in throws `/ainda tem culturas/`; `registar_diario` with action `observacao` inserts a row with `crop_id`; `consultar_especie('alface')` returns `companheiras`; `TOOLS.map(t => t.name)` has none of the six old names.
- [ ] **Step 2: Run**: `npx vitest run src/lib/server/__tests__/sage-*.test.js`. FAIL.
- [ ] **Step 3: Implement** the files, then cut the route down.
- [ ] **Step 4: Run**: PASS, and `sage-loop.test.js` still passes.
- [ ] **Step 5: Live check** with the key in the project `.env` on the dev server with the production copy: ask `o que tenho na RB-13?` and `o que planto na RB-22 quando sair o alho frances?`; both answers must name the crops that the API shows for those beds. Keep the two answers for the report.
- [ ] **Step 6: Commit**: `git commit -m "feat(sage): cycle tools, prompt files, bed context"`

---

### Task 8: Docs and instruction files

**Files:**
- Modify: `CLAUDE.md`, `README.md`, `docker-compose.yml` (only if it mentions rotations)
- Replace: `AGENTS.md` with one line: `See CLAUDE.md.`

- [ ] **Step 1: Edit** per the spec's "Instruction files and docs" section: data model (cycles, crops, diary actions, next plan, `_old` tables one release), Sage line (new tools, prompt folder `src/lib/server/sage-prompt/`), testing section (migration on boot, `node scripts/migrate-dry-run.js data/farm-prod.db`), README feature list, API table (`/api/beds` returns cycles and crops; new `PATCH /api/crops/:id` and `PATCH /api/cycles/:id`; `/api/sync` removed), schema file list.
- [ ] **Step 2: Commit**: `git commit -m "docs: cycles data model and Sage prompt files"`

---

### Task 9: Full suite, push, report

- [ ] **Step 1**: `~/.claude/hooks/gate.sh -- npm test` once. Exit 75 means push and say CI covers it.
- [ ] **Step 2**: `npm run build` once more, then `git push origin main`.
- [ ] **Step 3**: Report to Pedro in PT-PT: the dry-run summary per bed from Task 2 for him to confirm before he refreshes Dokploy, the screenshots, the two Sage answers, how to roll back (redeploy previous image; the data file keeps `rotations_old` and `plantings_old`, rename them back with two `ALTER TABLE ... RENAME TO` statements and drop `cycles`, `crops`).
