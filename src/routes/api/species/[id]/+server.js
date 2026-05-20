import { json, error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db.js';
import * as schema from '$lib/server/schema.js';
import { eq } from 'drizzle-orm';

export function GET({ params }) {
  const db = getDb();
  const sp = db.select().from(schema.species).where(eq(schema.species.id, params.id)).get();
  if (!sp) throw error(404, 'Species not found');

  const companionRows = db.select().from(schema.companions)
    .where(eq(schema.companions.speciesId, params.id)).all();

  const good = companionRows.filter((c) => c.type === 'good').map((c) => c.companionId);
  const avoid = companionRows.filter((c) => c.type === 'avoid').map((c) => c.companionId);

  // Which beds have this species
  const bedRows = db.select({
    bedId: schema.plantings.bedId,
    count: schema.plantings.count,
    fn: schema.plantings.fn,
    notionCode: schema.beds.notionCode,
  }).from(schema.plantings)
    .innerJoin(schema.beds, eq(schema.plantings.bedId, schema.beds.id))
    .where(eq(schema.plantings.speciesId, params.id))
    .all();

  return json({
    species: sp,
    companions: { good, avoid },
    beds: bedRows,
  });
}
