import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db.js';
import * as schema from '$lib/server/schema.js';
import { desc } from 'drizzle-orm';

// POST: trigger sync (placeholder — Notion sync will be added in a later step)
export async function POST() {
  const db = getDb();

  // Create a sync log entry
  const result = db.insert(schema.syncLog).values({
    status: 'success',
    bedsSynced: 0,
    error: 'Notion sync not yet configured. Set NOTION_TOKEN and NOTION_BEDS_DB_ID.',
  }).run();

  // Update finished time
  db.update(schema.syncLog)
    .set({ finishedAt: new Date().toISOString() })
    .run();

  return json({ syncId: result.lastInsertRowid, message: 'Notion sync not yet configured.' });
}

// GET: latest sync status
export function GET() {
  const db = getDb();
  const latest = db.select().from(schema.syncLog)
    .orderBy(desc(schema.syncLog.id))
    .limit(1)
    .get();

  return json({ sync: latest || null });
}
