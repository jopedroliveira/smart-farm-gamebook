import { getDb } from '$lib/server/db.js';
import * as schema from '$lib/server/schema.js';
import { eq } from 'drizzle-orm';

export function load() {
  const db = getDb();

  // All species with lore
  const allSpecies = db.select().from(schema.species).all();

  // Build species map (keyed by ID) matching the shape the UI expects
  const speciesMap = {};
  const loreMap = {};
  for (const sp of allSpecies) {
    speciesMap[sp.id] = {
      name: sp.name,
      family: sp.family,
      sprite: sp.sprite,
      color: sp.color,
      emoji: sp.emoji,
      growthDays: sp.growthDays,
    };
    loreMap[sp.id] = {
      desc: sp.description,
      sun: sp.sun,
      water: sp.water,
      spacing: sp.spacing,
      germDays: sp.germDays,
      sowFrom: sp.sowFrom,
      sowTo: sp.sowTo,
      plantFrom: sp.plantFrom,
      plantTo: sp.plantTo,
      notes: sp.loreNotes,
      companions: [],
      avoid: [],
    };
  }

  // Load companion relationships
  const companionRows = db.select().from(schema.companions).all();
  for (const c of companionRows) {
    if (loreMap[c.speciesId]) {
      if (c.type === 'good') loreMap[c.speciesId].companions.push(c.companionId);
      else loreMap[c.speciesId].avoid.push(c.companionId);
    }
  }

  // All beds with plantings
  const allBeds = db.select().from(schema.beds).all();
  const bedsMap = {};
  for (const bed of allBeds) {
    const bedPlantings = db.select().from(schema.plantings)
      .where(eq(schema.plantings.bedId, bed.id)).all();
    const history = db.select().from(schema.bedHistory)
      .where(eq(schema.bedHistory.bedId, bed.id)).all()
      .map((h) => ({ ...h, plants: JSON.parse(h.plants || '[]') }));

    bedsMap[bed.id] = {
      notionCode: bed.notionCode,
      widthM: bed.widthM,
      heightM: bed.heightM,
      plantedDate: bed.plantedDate,
      harvestStart: bed.harvestStart,
      harvestEnd: bed.harvestEnd,
      season: bed.season,
      rotation: bed.rotation,
      estado: bed.estado,
      nextRotation: bed.nextRotation,
      pestNotes: bed.pestNotes,
      notes: bed.notes,
      plantings: bedPlantings.map((p) => ({
        species: p.speciesId,
        count: p.count,
        fn: p.fn,
      })),
      history,
    };
  }

  return { species: speciesMap, lore: loreMap, beds: bedsMap };
}
