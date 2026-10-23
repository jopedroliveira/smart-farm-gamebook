import { json, error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db.js';
import * as schema from '$lib/server/schema.js';
import { eq } from 'drizzle-orm';
import { bedPayload } from '$lib/server/cycles.js';
import { latestSensors } from '../+server.js';

export function GET({ params }) {
  const db = getDb();
  const bed = db.select().from(schema.beds).where(eq(schema.beds.id, params.id)).get();
  if (!bed) throw error(404, 'Bed not found');
  return json({ bed: bedPayload(db, bed), sensors: latestSensors(db, bed.id) });
}
