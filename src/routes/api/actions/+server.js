import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db.js';
import * as schema from '$lib/server/schema.js';

export async function POST({ request }) {
  const { bedId, action, details } = await request.json();

  if (!action) {
    return json({ error: 'action obrigatoria' }, { status: 400 });
  }

  const db = getDb();
  db.insert(schema.actionLog).values({
    bedId: bedId || null,
    action,
    details: details || null,
  }).run();

  return json({ ok: true });
}
