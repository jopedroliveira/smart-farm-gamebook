import { json, error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db.js';
import * as schema from '$lib/server/schema.js';
import { eq, desc, gte, and } from 'drizzle-orm';

export function GET({ params, url }) {
  const db = getDb();
  const bed = db.select().from(schema.beds).where(eq(schema.beds.id, params.id)).get();
  if (!bed) throw error(404, 'Bed not found');

  const days = parseInt(url.searchParams.get('days') || '30', 10);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const events = db.select()
    .from(schema.waterEvents)
    .where(
      and(
        eq(schema.waterEvents.bedId, params.id),
        gte(schema.waterEvents.timestamp, since)
      )
    )
    .orderBy(desc(schema.waterEvents.timestamp))
    .all();

  return json({ bedId: params.id, days, events });
}
