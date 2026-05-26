import { json, error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db.js';
import * as schema from '$lib/server/schema.js';
import { eq, desc } from 'drizzle-orm';

export function GET({ params }) {
  const db = getDb();
  const bed = db.select().from(schema.beds).where(eq(schema.beds.id, params.id)).get();
  if (!bed) throw error(404, 'Bed not found');

  const bedRotations = db.select().from(schema.rotations)
    .where(eq(schema.rotations.bedId, params.id)).all();

  const rotations = bedRotations.map((rot) => {
    const rotPlantings = db.select().from(schema.plantings)
      .where(eq(schema.plantings.rotationId, rot.id)).all();

    return {
      ...rot,
      failed: !!rot.failed,
      plantings: rotPlantings.map((p) => ({
        species: p.speciesId,
        count: p.count,
        fn: p.fn,
      })),
    };
  });

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

  return json({ bed, rotations, sensors });
}
