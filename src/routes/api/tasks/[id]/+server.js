import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db.js';
import * as schema from '$lib/server/schema.js';
import { eq } from 'drizzle-orm';

export async function PATCH({ params, request }) {
  const { done } = await request.json();
  const db = getDb();
  const id = Number(params.id);

  const task = db.select().from(schema.tasks).where(eq(schema.tasks.id, id)).get();
  if (!task) {
    return json({ error: 'Tarefa nao encontrada' }, { status: 404 });
  }

  const updates = {};
  if (done !== undefined) {
    updates.done = done ? 1 : 0;
    updates.completedAt = done ? new Date().toISOString() : null;
  }

  db.update(schema.tasks).set(updates).where(eq(schema.tasks.id, id)).run();

  const updated = db.select().from(schema.tasks).where(eq(schema.tasks.id, id)).get();
  return json(updated);
}
