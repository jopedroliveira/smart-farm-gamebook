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

  // Which beds have this species in the ground now
  const bedRows = db.select({
    cropId: schema.crops.id,
    count: schema.crops.count,
    role: schema.crops.role,
    inOn: schema.crops.inOn,
    outOn: schema.crops.outOn,
    bedId: schema.cycles.bedId,
    cycleTitle: schema.cycles.title,
    notionCode: schema.beds.notionCode,
  }).from(schema.crops)
    .innerJoin(schema.cycles, eq(schema.crops.cycleId, schema.cycles.id))
    .innerJoin(schema.beds, eq(schema.cycles.bedId, schema.beds.id))
    .where(eq(schema.crops.speciesId, params.id))
    .all()
    .filter((r) => !r.outOn);

  return json({
    species: sp,
    companions: { good, avoid },
    beds: bedRows,
  });
}
