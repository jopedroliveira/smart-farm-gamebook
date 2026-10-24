import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db.js';
import * as schema from '$lib/server/schema.js';
import { eq } from 'drizzle-orm';
import { endCrop, plantCrop, dropPlannedCrop } from '$lib/server/cycles.js';

// With an outcome, the crop leaves the bed (colhida, falhada, retirada).
// With inOn only, a planned crop goes into the ground.
export async function PATCH({ params, request }) {
  const { inOn, outOn, outcome, outcomeNote } = await request.json();
  const db = getDb();
  try {
    if (!outcome) {
      const crop = plantCrop(db, { cropId: params.id, inOn: inOn || undefined });
      return json({ crop, cycleEmpty: false });
    }
    const crop = endCrop(db, { cropId: params.id, outOn: outOn || undefined, outcome, outcomeNote: outcomeNote || null });
    const stillIn = db.select().from(schema.crops).where(eq(schema.crops.cycleId, crop.cycleId)).all().filter(c => !c.outOn);
    return json({ crop, cycleEmpty: stillIn.length === 0 });
  } catch (e) {
    return json({ error: e.message }, { status: 409 });
  }
}

// A planned crop is discarded before it ever went in.
export async function DELETE({ params }) {
  try {
    const crop = dropPlannedCrop(getDb(), { cropId: params.id });
    return json({ crop });
  } catch (e) {
    return json({ error: e.message }, { status: 409 });
  }
}
