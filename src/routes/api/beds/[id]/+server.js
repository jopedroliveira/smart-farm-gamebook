import { json, error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db.js';
import * as schema from '$lib/server/schema.js';
import { eq, desc } from 'drizzle-orm';

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
  });
}
