import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db.js';
import * as schema from '$lib/server/schema.js';
import { eq } from 'drizzle-orm';

export async function PUT({ request }) {
  const { table, id, field, value } = await request.json();
  const db = getDb();

  const now = new Date().toISOString();

  switch (table) {
    case 'beds': {
      const updates = { [field]: value, updatedAt: now };
      db.update(schema.beds).set(updates).where(eq(schema.beds.id, id)).run();
      break;
    }
    case 'rotations': {
      const updates = { [field]: value, updatedAt: now };
      db.update(schema.rotations).set(updates).where(eq(schema.rotations.id, id)).run();
      break;
    }
    case 'species': {
      db.update(schema.species).set({ [field]: value }).where(eq(schema.species.id, id)).run();
      break;
    }
    default:
      return json({ error: 'Tabela invalida' }, { status: 400 });
  }

  return json({ ok: true });
}

export async function DELETE({ request }) {
  const { table, id } = await request.json();
  const db = getDb();

  switch (table) {
    case 'actions':
      db.delete(schema.actionLog).where(eq(schema.actionLog.id, id)).run();
      break;
    case 'rotations':
      db.delete(schema.plantings).where(eq(schema.plantings.rotationId, id)).run();
      db.delete(schema.rotations).where(eq(schema.rotations.id, id)).run();
      break;
    default:
      return json({ error: 'Tabela invalida' }, { status: 400 });
  }

  return json({ ok: true });
}
