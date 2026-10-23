import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db.js';
import * as schema from '$lib/server/schema.js';
import { eq, desc } from 'drizzle-orm';
import { bedPayload } from '$lib/server/cycles.js';

export function latestSensors(db, bedId) {
  const rows = db.select({
    metric: schema.sensorReadings.metric,
    value: schema.sensorReadings.value,
    timestamp: schema.sensorReadings.timestamp,
  }).from(schema.sensorReadings)
    .where(eq(schema.sensorReadings.bedId, bedId))
    .orderBy(desc(schema.sensorReadings.timestamp))
    .all();

  const sensors = {};
  for (const r of rows) {
    if (!sensors[r.metric]) sensors[r.metric] = r;
  }
  return sensors;
}

export function GET() {
  const db = getDb();
  const beds = db.select().from(schema.beds).all()
    .map((bed) => ({ ...bedPayload(db, bed), sensors: latestSensors(db, bed.id) }));
  return json({ beds });
}
