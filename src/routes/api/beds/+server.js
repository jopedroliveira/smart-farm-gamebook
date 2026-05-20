import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db.js';
import * as schema from '$lib/server/schema.js';
import { eq, desc, sql } from 'drizzle-orm';

export function GET() {
  const db = getDb();

  const allBeds = db.select().from(schema.beds).all();

  const bedsWithData = allBeds.map((bed) => {
    const bedPlantings = db
      .select()
      .from(schema.plantings)
      .where(eq(schema.plantings.bedId, bed.id))
      .all();

    // Latest sensor reading per metric
    const latestSensors = db
      .select({
        metric: schema.sensorReadings.metric,
        value: schema.sensorReadings.value,
        timestamp: schema.sensorReadings.timestamp,
      })
      .from(schema.sensorReadings)
      .where(eq(schema.sensorReadings.bedId, bed.id))
      .orderBy(desc(schema.sensorReadings.timestamp))
      .all();

    // Deduplicate to latest per metric
    const sensors = {};
    for (const r of latestSensors) {
      if (!sensors[r.metric]) sensors[r.metric] = r;
    }

    return {
      ...bed,
      plantings: bedPlantings.map((p) => ({
        species: p.speciesId,
        count: p.count,
        fn: p.fn,
      })),
      sensors,
    };
  });

  return json({ beds: bedsWithData });
}
