# Bed timeline: cycles, crops and diary

Date: 2026-10-22. Status: draft for review.

## Intent

The app is a pocket guide Pedro opens next to a raised bed. The moment
that matters: something has just finished (the lettuces are gone) and he
asks Sage "what do I plant here now?". The answer can be lettuces again or
something else, but it has to be a direct recommendation grounded in two
things: what this bed has already carried, and what is in it right now.

Three layers of that question, in Pedro's words:

1. Now: what to sow or plant here today, so it gets on with what is
   already there (a companion planting scheme for this bed, this season,
   after what came before).
2. Next: which sequence of crops makes sense over the coming seasons. The
   beds are raised beds with a finite substrate that is not renewed, so
   crop families must rotate and the soil must be looked after.
3. Health: what pests and diseases this bed has had, and what was tried.
   Some pests stay in the soil (cabbage root fly after the kale failure
   in RB-22), which rules out their host crops for a while. Advice follows
   an organic and permaculture philosophy.

The current schema cannot carry this. The `rotations` table mixes future
plans, what is in the ground and history; its `estado` is chosen by hand,
so a bed can have three "active" rotations at once (RB-22 today) and Sage
guesses wrong. Plantings are duplicated (RB-11 has parsley three times,
count 1 each), their `fn` field holds a paragraph copied from the species
page, and `beds.next_rotation` is an empty template. The species catalog
has duplicate columns for the same facts.

## Goals

- Per bed, an honest timeline: what went in, when, what came out, how it
  ended, and why when it failed.
- Per bed, a diary: observations, interventions, soil amendments.
- Sage answers "what is in RB-x" and "what do I plant here now" from that
  data, and can project the next two or three cycles per bed.
- Sage gives pest and disease guidance from the bed's own history.
- The state of a bed is derived from dates, never picked from a list.
- Existing data migrates automatically on boot and is reversible.

## Non-goals

- Yield tracking, weights, money.
- A planning calendar or stored multi-season plans. The projection is
  Sage's answer at the time; at most one short "next" line per bed is
  stored.
- Notion sync. It is already disabled; the new tables do not carry Notion
  ids.
- Changing the game layer (coins, XP, tasks) beyond what the data change
  forces.

## Anti-goals (what would make this a failure even if it works)

- Sage says something wrong about what is currently in a bed.
- "What do I plant here now" ignores the current crops, the season or the
  bed's history.

Both come down to the same thing: the current state of each bed must be
exactly right after migration and easy to correct afterwards.

## Constraints

- Stack as is: SvelteKit (Svelte 4 syntax), plain JS, SQLite through
  better-sqlite3 and drizzle, `$env/dynamic/private`, adapter-node in
  Docker on Dokploy. The database file lives in a volume at
  `/app/data/farm.db`; migrations run on boot in `db.js`, like the
  `client_id` one.
- All UI text and all Sage text in European Portuguese, without the
  accented characters the current prompt avoids (the codebase writes
  "rotacao", "sachar", "Terminado").
- Sage tools take ids from the context and never guess between
  candidates (the lesson from PR #18).
- Verification: vitest for migration and derived state, Playwright for
  the screens, the local DB copy for a dry run of the migration whose
  per-bed summary Pedro confirms before deploy.

## Data model

Three tables replace `rotations` and `plantings`; the diary reuses
`action_log`; `species` is cleaned.

### `cycles`

One cycle is a set of crops that went into a bed together with a purpose.
It is the unit Sage proposes ("Outono 2026: alho + favas + calendula,
leguminosa para repor azoto") and the unit the history is read in.

| column | type | meaning |
|---|---|---|
| id | integer pk | |
| bed_id | text fk beds | |
| title | text | short label, e.g. "Outono 2026" |
| scheme | text | the companion scheme and its purpose, as proposed and accepted |
| started_on | date | first crop in (set when the first crop gets `in_on`) |
| closed_on | date, null | null while open |
| notes | text, null | free notes about the cycle as a whole |

Invariant: at most one open cycle per bed, enforced in code and by a
partial unique index on `bed_id` where `closed_on IS NULL`. A cycle closes
when its last crop is out; closing it with crops still in is refused.

A cycle may be created with no crops yet (accepted plan, nothing sown):
`started_on` is null until the first crop goes in. That is the only
"planned" state and it is derived, not stored.

### `crops`

One row per species in a cycle. The current state of a bed is the crops
of its open cycle whose `out_on` is null.

| column | type | meaning |
|---|---|---|
| id | integer pk | |
| cycle_id | integer fk cycles | |
| species_id | text fk species | |
| count | integer | plants or rows; 1 when unknown |
| role | text | one short word: `principal`, `companheira`, `cobertura`, `atrativa`, `outra` |
| method | text | `semeado` or `plantado` |
| in_on | date | sown or transplanted |
| out_on | date, null | null while in the bed |
| outcome | text, null | `colhida`, `falhada`, `retirada`; null while in |
| outcome_note | text, null | cause when failed ("larvas de Delia radicum"), or a short remark |

Same species twice in one cycle is allowed only with different `in_on`
(a second sowing); the migration merges exact duplicates by summing
`count`.

Derived per crop: days in, stage (germination, growth, maturing, ready)
from `in_on` and the species' `growth_days`, as `speciesStage` does today.
Derived per bed: empty (no open cycle or no crops in), growing, ready
(any crop past its growth days), closed history.

### Diary: `action_log`

Keep the table, widen `action`:

| action | meaning |
|---|---|
| `observacao` | something seen ("folhas dos rabanetes comidas") |
| `intervencao` | something done against a problem ("cinza a volta dos rabanetes", "rede anti-insetos") |
| `solo` | an amendment ("5 cm de composto", "adubo verde incorporado") |
| `sachar` | existing: weeding visit, drives the weeds indicator |
| `nota` | existing: free note |

Add a nullable `crop_id` so an observation can point at one crop. The
weeds indicator keeps reading `sachar` rows, unchanged.

### `beds`

Keep. `next_rotation` is renamed in meaning to "next plan": one short
line, written by Sage when Pedro accepts a projection ("Novembro: favas +
alho; depois brassicas so em 2028"). The empty templates are cleared by
the migration. `notes` stays as general bed notes (sun, drainage, soil).

### `species`

Companions and antagonists already live in the `companions` table
(`species_id`, `companion_id`, `type` good/avoid), seeded from
`plant-lore.js` and shown by the Hortidex. That table stays the single
source: `consultar_especie` returns its rows to Sage and `registar_especie`
writes rows into it. No new text columns.

Collapse the duplicate columns, keeping one of each pair: `growth_days`
(from `cycle_days` when null, then from `PLANT_SPECIES` in
`plant-species.js` when still null), `germ_days` (from
`germination_days`), `sow_from`/`sow_to` (from `sowing_window` only when
both are null, parsed by the builder's best effort, else left null). The
old columns are not dropped in this release; the code stops reading them
and a later release drops them, so the previous version still runs
against the migrated file. `family` is the column rotation reasoning
depends on and `growth_days` is what the derived state depends on; the
migration log reports every species where either is still empty, and the
derived state reads the table from now on (`PLANT_SPECIES` stays for
sprites and lore only). Species missing from the JS file (`tomate_roxo`,
`malagueta`, `fava` today) get `growth_days` from the table or stay
reported.

### Migration of existing data

Runs once on boot when `rotations` exists and `cycles` does not. Old
tables are renamed to `rotations_old` and `plantings_old` and kept for one
release so the change can be reverted by renaming back; nothing the
previous version reads is dropped in this release, so a rollback is a
redeploy of the previous image plus the two renames.

Rules, in this order, per bed:

1. Every rotation with `estado` in (Terminado, Em repouso) becomes a
   closed cycle: `title` from the old title without the bed prefix,
   `scheme` from `rotation` + `notes` (first line), `started_on` =
   `planted_date`, `closed_on` = `harvest_end`, else `harvest_start`, else
   `updated_at` date. Its plantings become crops with `in_on` =
   `planted_date`, `out_on` = `closed_on`, `outcome` = `falhada` when
   `failed` = 1 else `colhida`, `outcome_note` = `pest_notes` when failed.
   A closed rotation with no plantings stays as a cycle without crops;
   the title still tells what it was.
   An open rotation (Plantado, A colher) with no plantings is the
   dangerous case: the crop lives only in the title (RB-23 "Cenouras" in
   the August copy). The migration never invents a species from a title.
   It carries a hand-written override list, filled from Pedro's answers
   during the dry run (bed, species, count, in_on), and applies it; any
   open rotation without plantings that is not covered is listed in the
   summary under "sem culturas: confirmar" and the cycle opens empty.
2. All remaining rotations of the bed (Planeado, Plantado, A colher)
   merge into one open cycle, because the data says those crops are in
   the bed together now. `title` joins the old titles, `scheme` joins the
   old notes, `started_on` = earliest `planted_date`. Their plantings
   become crops with `in_on` = their rotation's `planted_date`,
   `out_on` null. A merged rotation with estado Planeado and no plantings
   contributes only its title to `scheme` (it was a plan, not a crop).
3. Duplicate plantings (same species in the same new cycle) merge, counts
   summed. `role` from the old `fn`: starts with "Cultura principal" ->
   `principal`; contains "companheira" -> `companheira`; starts with
   "Atrai" -> `atrativa`; starts with "Cobertura" -> `cobertura`; else
   `outra`. `method` = `plantado` unless the species' `sow_from` is set
   and `plant_from` is not, then `semeado`.
4. `beds.next_rotation` is set to null when it matches the empty
   template; otherwise kept as is (RB-11 and RB-22 have real text).

The migration writes a plain summary to the log: per bed, the open cycle
and its crops, the number of closed cycles, the open rotations without
crops, and the species with empty `family` or `growth_days`. The builder
runs it on the production copy at `data/farm-prod.db` (taken on
2026-10-23 with a SQLite backup from the Dokploy container; git-ignored)
and gives Pedro that summary to confirm before anything is deployed
(anti-goal above). The copy has 21 rotations and 56 plantings; 8
rotations have no plantings, all of them closed, so the override list
only matters for titles worth keeping as history. Corrections after
deploy go in through Sage (`corrigir_cultura`) or the admin page.

To refresh the copy before the real migration: on the Dokploy VM,
`docker exec <container> node -e "...backup('/app/data/farm-prod.db')"`
with better-sqlite3, then `docker cp` it out and `scp` it to this
machine. The container id changes on each deploy; find it with
`docker ps`.

## Sage

### Context per turn

Per bed: id, area, `notes`, next plan, the open cycle with its scheme and
each crop (id, species, family, role, days in, stage), the last diary
entries (date, action, text), and the closed cycles as one line each
(title, families, outcome, dates). Irrigation and weeds state as today.
Finished cycles stay one line; the context must not grow back into the
long reports that pushed the model into long answers.

### Tools

Replace the rotation and planting tools with tools that act on ids from
the context:

- `abrir_ciclo(bed_id, title, scheme)`: refuses if the bed has an open cycle.
- `registar_cultura(cycle_id, species_id, count, role, method, in_on)`.
- `terminar_cultura(crop_id, out_on, outcome, outcome_note)`.
- `fechar_ciclo(cycle_id, closed_on)`: refuses while crops are in.
- `corrigir_cultura(crop_id, fields)`: fixes a wrong row (species, date, count) when Pedro says the state is wrong.
- `registar_diario(bed_id, action, text, crop_id?)`.
- `definir_proximo_plano(bed_id, text)`.

Keep `criar_tarefa`, `consultar_historico_acoes` (now the diary),
`consultar_especie`, `registar_especie`, `atualizar_notas_canteiro`,
`registar_nota`, web search. Drop `atualizar_estado_rotacao`,
`atualizar_notas_rotacao`, `adicionar_plantio`, `remover_plantio`,
`criar_rotacao`, `eliminar_rotacao`.

### Prompt

Add to the system prompt, in the existing voice:

- The rules for "what do I plant here now": start from the crops still
  in, the month, the families of the last two or three cycles, the bed's
  pest history and the next plan; propose one scheme (main crop plus
  companions) and say why in one sentence; offer to register it.
- Rotation reasoning by family and by what the previous crop left (a
  legume before a heavy feeder, roots after leaves), and the finite
  substrate: say when a bed needs compost or a rest.
- Soil memory of pests: a failed brassica from cabbage root fly rules out
  brassicas in that bed for about two to three years; say it when it
  applies.
- Pest and disease guidance ladder: identify first (ask what the damage
  looks like if needed), then barriers, companions and natural enemies,
  then organic treatments as the last step. Register the observation and
  the intervention in the diary when Pedro confirms.
- Projection on request: the next two or three cycles for a bed, one line
  each, and offer to store the first as the next plan.

The format rules stay (four sentences, no lists, no lead-in text before
tool calls).

## Screens

- Bed sheet (mobile) and bed info modal: show the open cycle's crops with
  stage and days in, then the last cycles one line each, then the last
  diary entries. The harvest flow becomes "a cultura saiu": pick the crop,
  pick the outcome (colhida, falhada, retirada), optional note; when the
  last crop leaves, offer to close the cycle.
- Bed on the map: status label derived (VAZIA, GERMINACAO, CRESCIMENTO,
  COLHEITA) from crops, not from `estado`. The progress bar uses the
  oldest crop's `in_on` and the average `growth_days`, as today.
- Admin page: tabs for cycles and crops replace the rotations tab; raw
  edit of any row, for corrections.
- Hortidex: species detail reads the kept columns only; companions keep
  coming from the `companions` table as today.
- Auto-tasks in `farm.js` keep working on the derived state.

## Instruction files and docs

The refactor updates the files that describe the project to agents and
people, in the same change set as the code they describe:

- `CLAUDE.md`: the data model section lists `cycles`, `crops`, the diary
  actions and `beds.next_rotation`, and drops `rotations` and
  `plantings` (kept only as the `_old` rollback tables for one release).
  The Sage line lists the new tool set and points at the prompt files.
  The "Testing changes" section notes that the migration runs on boot
  and how to dry-run it on a DB copy.
- `AGENTS.md` is today an exact copy of `CLAUDE.md`. It becomes a one
  line pointer to `CLAUDE.md` so the two cannot drift again.
- `README.md`: the feature list, the API table (`/api/beds` returns
  cycles and crops), the schema file list and the Sage description.
- The Sage prompt moves out of `+server.js` into plain text files under
  `src/lib/server/sage-prompt/`, one per theme (persona and format,
  Coimbra calendar, rotation and substrate, companions, pests and the
  organic ladder, tool rules). The route reads and joins them per
  request. A test checks that every file is present and lands in the
  prompt. `CLAUDE.md` names the folder as the place to edit Sage's
  knowledge.

## Decisions already taken

By Pedro: the three-layer question; raised beds with finite substrate so
families must rotate; pest history as a veto on future crops; organic and
permaculture philosophy; a companion scheme is part of Sage's answer and
enters the bed as a whole; the anti-goals.

Mine, to check while reading: cycles as the stored unit of a scheme (not
individual crops only); one open cycle per bed; state derived from dates;
diary in the existing `action_log`; old tables and old species columns
kept one release for rollback; the existing `companions` table as the
single source for companions instead of new text columns; `growth_days`
backfilled from the JS file and the table becoming the source for the
derived state; no species invented from rotation titles, overrides
hand-written from Pedro's confirmation instead; the role vocabulary;
English for code and docs, Portuguese without accents for UI and Sage
text.

## Left to the builder

Exact migration code and its tests, the order of work (schema and
migration first, then Sage, then screens), the look of the bed sheet
lists within the existing pixel style, how the admin tabs edit rows, and
the wording of the new prompt sections within the existing tone.
