import { json, error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db.js';
import * as schema from '$lib/server/schema.js';
import { desc } from 'drizzle-orm';
import { syncFromNotion } from '$lib/server/notion-sync.js';

// POST: trigger Notion sync
export async function POST() {
  try {
    const result = await syncFromNotion();
    return json({ success: true, ...result });
  } catch (e) {
    throw error(500, e.message);
  }
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
