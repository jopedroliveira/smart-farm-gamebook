// Dry run of the rotations -> cycles migration on a copy of a database file.
// Usage: node scripts/migrate-dry-run.js data/farm-prod.db
// The given file is never written; the copy lives in the OS temp dir.
import Database from 'better-sqlite3';
import { copyFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { migrateRotationsToCycles, summaryText } from '../src/lib/server/migrate-cycles.js';

const src = process.argv[2];
if (!src) { console.error('usage: node scripts/migrate-dry-run.js <file.db>'); process.exit(1); }

const copy = join(tmpdir(), `dry-run-${Date.now()}.db`);
copyFileSync(src, copy);
const sqlite = new Database(copy);
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS cycles (id INTEGER PRIMARY KEY AUTOINCREMENT, bed_id TEXT NOT NULL REFERENCES beds(id),
    title TEXT NOT NULL, scheme TEXT, started_on TEXT, closed_on TEXT, notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')));
  CREATE UNIQUE INDEX IF NOT EXISTS idx_one_open_cycle ON cycles(bed_id) WHERE closed_on IS NULL;
  CREATE TABLE IF NOT EXISTS crops (id INTEGER PRIMARY KEY AUTOINCREMENT, cycle_id INTEGER NOT NULL REFERENCES cycles(id),
    species_id TEXT NOT NULL REFERENCES species(id), count INTEGER NOT NULL DEFAULT 1,
    role TEXT NOT NULL DEFAULT 'outra', method TEXT NOT NULL DEFAULT 'plantado',
    in_on TEXT, out_on TEXT, outcome TEXT, outcome_note TEXT);
`);

const summary = migrateRotationsToCycles(sqlite);
if (!summary) { console.log('nothing to migrate (no rotations table, or cycles already present)'); process.exit(0); }

console.log(summaryText(summary));
console.log('\n--- open cycles in full');
for (const c of sqlite.prepare('select * from cycles where closed_on is null order by bed_id').all()) {
  console.log(`${c.bed_id} #${c.id} "${c.title}" started ${c.started_on || '-'}`);
  if (c.scheme) console.log(`  scheme: ${c.scheme}`);
  for (const k of sqlite.prepare('select * from crops where cycle_id=? order by id').all(c.id)) {
    console.log(`  - ${k.species_id} x${k.count} ${k.role} ${k.method} in ${k.in_on || '-'}`);
  }
}
console.log('\n--- closed cycles');
for (const c of sqlite.prepare('select * from cycles where closed_on is not null order by bed_id, started_on').all()) {
  const crops = sqlite.prepare('select species_id, count, outcome from crops where cycle_id=?').all(c.id);
  console.log(`${c.bed_id} "${c.title}" ${c.started_on || '-'} -> ${c.closed_on}: ${crops.map(k => `${k.species_id} x${k.count} ${k.outcome}`).join(', ') || 'sem culturas'}`);
}
console.log(`\ncopy at ${copy}`);
