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

  // Which beds have this species (via rotations)
  const bedRows = db.select({
    rotationId: schema.plantings.rotationId,
    count: schema.plantings.count,
    fn: schema.plantings.fn,
    bedId: schema.rotations.bedId,
    rotationTitle: schema.rotations.title,
    estado: schema.rotations.estado,
    notionCode: schema.beds.notionCode,
  }).from(schema.plantings)
    .innerJoin(schema.rotations, eq(schema.plantings.rotationId, schema.rotations.id))
    .innerJoin(schema.beds, eq(schema.rotations.bedId, schema.beds.id))
    .where(eq(schema.plantings.speciesId, params.id))
    .all();

  return json({
    species: sp,
    companions: { good, avoid },
    beds: bedRows,
  });
}
