import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db.js';
import * as schema from '$lib/server/schema.js';
import { eq } from 'drizzle-orm';
import { endCrop } from '$lib/server/cycles.js';

// A crop leaves the bed: colhida, falhada or retirada.
export async function PATCH({ params, request }) {
  const { outOn, outcome, outcomeNote } = await request.json();
  const db = getDb();
  try {
    const crop = endCrop(db, { cropId: params.id, outOn: outOn || undefined, outcome, outcomeNote: outcomeNote || null });
    const stillIn = db.select().from(schema.crops).where(eq(schema.crops.cycleId, crop.cycleId)).all().filter(c => !c.outOn);
    return json({ crop, cycleEmpty: stillIn.length === 0 });
  } catch (e) {
    return json({ error: e.message }, { status: 409 });
  }
}
