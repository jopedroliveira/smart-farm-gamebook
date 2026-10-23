import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db.js';
import * as schema from '$lib/server/schema.js';
import { bedPayload, latestSensors } from '$lib/server/cycles.js';

export function GET() {
  const db = getDb();
  const beds = db.select().from(schema.beds).all()
    .map((bed) => ({ ...bedPayload(db, bed), sensors: latestSensors(db, bed.id) }));
  return json({ beds });
}
