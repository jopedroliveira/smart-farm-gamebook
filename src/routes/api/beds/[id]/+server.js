import { json, error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db.js';
import * as schema from '$lib/server/schema.js';
import { eq, desc } from 'drizzle-orm';
import { getLastWaterEvent } from '$lib/server/ha-sync.js';

export function GET({ params }) {
  const db = getDb();
  const bed = db.select().from(schema.beds).where(eq(schema.beds.id, params.id)).get();
  if (!bed) throw error(404, 'Bed not found');

  const bedPlantings = db.select().from(schema.plantings)
    .where(eq(schema.plantings.bedId, params.id)).all();

  const history = db.select().from(schema.bedHistory)
    .where(eq(schema.bedHistory.bedId, params.id)).all()
    .map((h) => ({ ...h, plants: JSON.parse(h.plants || '[]') }));

  const latestSensors = db.select({
    metric: schema.sensorReadings.metric,
    value: schema.sensorReadings.value,
    timestamp: schema.sensorReadings.timestamp,
  }).from(schema.sensorReadings)
    .where(eq(schema.sensorReadings.bedId, params.id))
    .orderBy(desc(schema.sensorReadings.timestamp))
    .all();

  const sensors = {};
  for (const r of latestSensors) {
    if (!sensors[r.metric]) sensors[r.metric] = r;
  }

  return json({
    bed,
    plantings: bedPlantings.map((p) => ({ species: p.speciesId, count: p.count, fn: p.fn })),
    history,
    sensors,
    lastWatered: getLastWaterEvent(params.id)?.timestamp || null,
  });
}

export async function PATCH({ params, request }) {
  const db = getDb();
  const bed = db.select().from(schema.beds).where(eq(schema.beds.id, params.id)).get();
  if (!bed) throw error(404, 'Bed not found');

  const body = await request.json().catch(() => ({}));
  const allowed = ['haWaterEntity', 'notes', 'pestNotes', 'estado'];
  const updates = {};
  for (const key of allowed) {
    if (body[key] !== undefined) {
      const dbKey = key.replace(/[A-Z]/g, (m) => '_' + m.toLowerCase());
      updates[dbKey] = body[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    throw error(400, 'No valid fields to update');
  }

  db.update(schema.beds)
    .set(updates)
    .where(eq(schema.beds.id, params.id))
    .run();

  return json({ success: true, updated: Object.keys(updates) });
}
