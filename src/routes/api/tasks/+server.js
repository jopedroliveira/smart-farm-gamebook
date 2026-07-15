import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db.js';
import * as schema from '$lib/server/schema.js';
import { eq } from 'drizzle-orm';

export async function GET() {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];

  const rows = db.select().from(schema.tasks).all().filter(row => {
    if (!row.done) return true;
    return row.completedAt && row.completedAt >= today;
  });

  return json(rows);
}

export async function POST({ request }) {
  const { text, bedId, reason, source } = await request.json();

  if (!text || typeof text !== 'string') {
    return json({ error: 'Texto em falta' }, { status: 400 });
  }

  const db = getDb();
  const result = db.insert(schema.tasks).values({
    text,
    bedId: bedId || null,
    reason: reason || null,
    source: source || 'manual',
  }).run();

  const task = db.select().from(schema.tasks)
    .where(eq(schema.tasks.id, Number(result.lastInsertRowid)))
    .get();

  return json(task, { status: 201 });
}
