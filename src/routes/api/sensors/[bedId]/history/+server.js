import { json, error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db.js';
import * as schema from '$lib/server/schema.js';
import { eq, and, desc, gte } from 'drizzle-orm';

export function GET({ params, url }) {
  const db = getDb();
  const metric = url.searchParams.get('metric') || 'moisture';
  const hours = parseInt(url.searchParams.get('hours') || '24', 10);

  const bed = db.select().from(schema.beds).where(eq(schema.beds.id, params.bedId)).get();
  if (!bed) throw error(404, 'Bed not found');

  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const data = db.select({
    value: schema.sensorReadings.value,
    timestamp: schema.sensorReadings.timestamp,
    source: schema.sensorReadings.source,
  }).from(schema.sensorReadings)
    .where(
      and(
        eq(schema.sensorReadings.bedId, params.bedId),
        eq(schema.sensorReadings.metric, metric),
        gte(schema.sensorReadings.timestamp, since),
      )
    )
    .orderBy(desc(schema.sensorReadings.timestamp))
    .all();

  return json({ bedId: params.bedId, metric, hours, data });
}
