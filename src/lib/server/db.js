import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';
import { resolve } from 'path';

const DB_PATH = process.env.DATABASE_PATH || resolve('data/farm.db');

let _db;

export function getDb() {
  if (!_db) {
    const sqlite = new Database(DB_PATH);
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('foreign_keys = ON');

    // Always ensure tables exist — safer than checking file existence
    createTables(sqlite);

    _db = drizzle(sqlite, { schema });
  }
  return _db;
}

function createTables(sqlite) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS beds (
      id          TEXT PRIMARY KEY,
      notion_code TEXT NOT NULL,
      notion_id   TEXT,
      width_m     REAL NOT NULL,
      height_m    REAL NOT NULL,
      planted_date TEXT,
      harvest_start TEXT,
      harvest_end  TEXT,
      season      TEXT,
      rotation    TEXT,
      estado      TEXT,
      next_rotation TEXT,
      pest_notes  TEXT,
      notes       TEXT,
      updated_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS species (
      id               TEXT PRIMARY KEY,
      name             TEXT NOT NULL,
      species_name     TEXT,
      scientific_name  TEXT,
      family           TEXT,
      crop_type        TEXT,
      sprite           TEXT,
      color            TEXT,
      emoji            TEXT,
      cycle_days       INTEGER,
      germination_days INTEGER,
      sun              TEXT,
      water            TEXT,
      spacing          TEXT,
      sowing_window    TEXT,
      harvest_window   TEXT,
      seasons          TEXT,
      soil_effect      TEXT,
      garden_role      TEXT,
      notes            TEXT,
      description      TEXT,
      growth_days      INTEGER,
      germ_days        INTEGER,
      sow_from         TEXT,
      sow_to           TEXT,
      plant_from       TEXT,
      plant_to         TEXT,
      lore_notes       TEXT
    );

    CREATE TABLE IF NOT EXISTS plantings (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      bed_id      TEXT NOT NULL REFERENCES beds(id),
      species_id  TEXT NOT NULL REFERENCES species(id),
      count       INTEGER NOT NULL,
      fn          TEXT
    );

    CREATE TABLE IF NOT EXISTS companions (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      species_id   TEXT NOT NULL REFERENCES species(id),
      companion_id TEXT NOT NULL REFERENCES species(id),
      type         TEXT NOT NULL DEFAULT 'good',
      UNIQUE(species_id, companion_id)
    );

    CREATE TABLE IF NOT EXISTS bed_history (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      bed_id      TEXT NOT NULL REFERENCES beds(id),
      season      TEXT NOT NULL,
      plants      TEXT,
      notes       TEXT
    );

    CREATE TABLE IF NOT EXISTS sensor_readings (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      bed_id      TEXT NOT NULL REFERENCES beds(id),
      metric      TEXT NOT NULL,
      value       REAL NOT NULL,
      timestamp   TEXT NOT NULL DEFAULT (datetime('now')),
      source      TEXT DEFAULT 'mock'
    );
    CREATE INDEX IF NOT EXISTS idx_sensor_bed_metric ON sensor_readings(bed_id, metric, timestamp);

    CREATE TABLE IF NOT EXISTS sync_log (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      started_at  TEXT NOT NULL DEFAULT (datetime('now')),
      finished_at TEXT,
      status      TEXT DEFAULT 'running',
      beds_synced INTEGER DEFAULT 0,
      error       TEXT
    );
  `);
}
