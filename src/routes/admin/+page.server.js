import { getDb } from '$lib/server/db.js';
import * as schema from '$lib/server/schema.js';

export function load() {
  const db = getDb();

  const beds = db.select().from(schema.beds).all();
  const rotations = db.select().from(schema.rotations).all();
  const plantings = db.select().from(schema.plantings).all();
  const species = db.select().from(schema.species).all();
  const actions = db.select().from(schema.actionLog).all()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return { beds, rotations, plantings, species, actions };
}
