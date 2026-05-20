import { json, error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db.js';
import * as schema from '$lib/server/schema.js';
import { eq, desc } from 'drizzle-orm';

export function GET({ params }) {
  const db = getDb();

  // Verify bed exists
  const bed = db.select().from(schema.beds).where(eq(schema.beds.id, params.bedId)).get();
  if (!bed) throw error(404, 'Bed not found');

  const rows = db.select({
    metric: schema.sensorReadings.metric,
    value: schema.sensorReadings.value,
    timestamp: schema.sensorReadings.timestamp,
    source: schema.sensorReadings.source,
  }).from(schema.sensorReadings)
    .where(eq(schema.sensorReadings.bedId, params.bedId))
    .orderBy(desc(schema.sensorReadings.timestamp))
    .all();

  // Latest per metric
  const readings = {};
  for (const r of rows) {
    if (!readings[r.metric]) readings[r.metric] = r;
  }

  return json({ bedId: params.bedId, readings });
}
