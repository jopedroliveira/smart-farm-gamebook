import { describe, it, expect } from 'vitest';
import Database from 'better-sqlite3';
import { copyFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// A production database created before client_id existed must get the column
// on boot. Uses the real data/farm.db when present, else a synthetic legacy table.
describe('sessions migration', () => {
  it('adds client_id to a pre-existing sessions table', async () => {
    const legacy = resolve(process.env.TMPDIR || '/tmp', `legacy-farm-${Date.now()}.db`);
    const real = resolve('data/farm.db');
    if (existsSync(real)) {
      copyFileSync(real, legacy);
    } else {
      const s = new Database(legacy);
      s.exec(`CREATE TABLE sessions (id TEXT PRIMARY KEY, access_token TEXT NOT NULL,
        refresh_token TEXT NOT NULL, expires_at INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')))`);
      s.close();
    }
    const before = new Database(legacy);
    const colsBefore = before.pragma('table_info(sessions)').map(c => c.name);
    before.close();
    expect(colsBefore).not.toContain('client_id');

    process.env.DATABASE_PATH = legacy;
    const { getDb } = await import('../db.js');
    getDb();

    const after = new Database(legacy);
    expect(after.pragma('table_info(sessions)').map(c => c.name)).toContain('client_id');
    after.close();
  });
});
