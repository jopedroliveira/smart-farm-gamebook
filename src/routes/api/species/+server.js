import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db.js';
import * as schema from '$lib/server/schema.js';

export function GET() {
  const db = getDb();
  const allSpecies = db.select().from(schema.species).all();
  return json({ species: allSpecies });
}
