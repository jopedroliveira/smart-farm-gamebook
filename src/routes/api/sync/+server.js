import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db.js';
import * as schema from '$lib/server/schema.js';
import { desc } from 'drizzle-orm';
import { syncFromNotion } from '$lib/server/notion-sync.js';

// POST: trigger Notion sync
export async function POST() {
  if (!process.env.NOTION_TOKEN) {
    return json({ error: 'NOTION_TOKEN not configured' }, { status: 400 });
  }

  try {
    const result = await syncFromNotion();
    return json(result);
  } catch (e) {
    return json({ error: e.message }, { status: 500 });
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
