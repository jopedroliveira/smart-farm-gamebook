import { getDb } from '$lib/server/db.js';
import * as schema from '$lib/server/schema.js';

export function load() {
  const db = getDb();

  const beds = db.select().from(schema.beds).all();
  const species = db.select().from(schema.species).all();
  const nameOf = Object.fromEntries(species.map(s => [s.id, s.name]));
  const cycles = db.select().from(schema.cycles).all()
    .sort((a, b) => a.bedId.localeCompare(b.bedId) || (b.closedOn || '9999').localeCompare(a.closedOn || '9999'));
  const bedOf = Object.fromEntries(cycles.map(c => [c.id, c.bedId]));
  const crops = db.select().from(schema.crops).all()
    .map(c => ({ ...c, bedId: bedOf[c.cycleId], speciesName: nameOf[c.speciesId] || c.speciesId }))
    .sort((a, b) => (a.bedId || '').localeCompare(b.bedId || '') || b.cycleId - a.cycleId || a.id - b.id);
  const actions = db.select().from(schema.actionLog).all()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return { beds, cycles, crops, species, actions };
}
