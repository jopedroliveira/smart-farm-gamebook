import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db.js';
import * as schema from '$lib/server/schema.js';
import { eq } from 'drizzle-orm';
import { fixCrop } from '$lib/server/cycles.js';

const CYCLE_FIELDS = ['title', 'scheme', 'startedOn', 'closedOn', 'notes'];

export async function PUT({ request }) {
  const { table, id, field, value } = await request.json();
  const db = getDb();
  const now = new Date().toISOString();
  const v = value === '' ? null : value;

  try {
    switch (table) {
      case 'beds':
        db.update(schema.beds).set({ [field]: v, updatedAt: now }).where(eq(schema.beds.id, id)).run();
        break;
      case 'species':
        db.update(schema.species).set({ [field]: v }).where(eq(schema.species.id, id)).run();
        break;
      case 'cycles':
        if (!CYCLE_FIELDS.includes(field)) return json({ error: 'Campo invalido' }, { status: 400 });
        db.update(schema.cycles).set({ [field]: field === 'title' ? value : v }).where(eq(schema.cycles.id, id)).run();
        break;
      case 'crops':
        fixCrop(db, { cropId: id, [field]: v });
        break;
      default:
        return json({ error: 'Tabela invalida' }, { status: 400 });
    }
  } catch (e) {
    return json({ error: e.message }, { status: 409 });
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
    case 'crops':
      db.update(schema.actionLog).set({ cropId: null }).where(eq(schema.actionLog.cropId, id)).run();
      db.delete(schema.crops).where(eq(schema.crops.id, id)).run();
      break;
    case 'cycles': {
      const cropIds = db.select({ id: schema.crops.id }).from(schema.crops).where(eq(schema.crops.cycleId, id)).all();
      for (const c of cropIds) db.update(schema.actionLog).set({ cropId: null }).where(eq(schema.actionLog.cropId, c.id)).run();
      db.delete(schema.crops).where(eq(schema.crops.cycleId, id)).run();
      db.delete(schema.cycles).where(eq(schema.cycles.id, id)).run();
      break;
    }
    default:
      return json({ error: 'Tabela invalida' }, { status: 400 });
  }

  return json({ ok: true });
}
