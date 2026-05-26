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
      growthDays: sp.cycleDays || sp.growthDays,
      // New fields available from Notion sync
      speciesName: sp.speciesName,
      scientificName: sp.scientificName,
      cropType: sp.cropType,
    };
    loreMap[sp.id] = {
      desc: sp.description,
      sun: sp.sun,
      water: sp.water,
      spacing: sp.spacing,
      germDays: sp.germinationDays || sp.germDays,
      // New window format (text, e.g. "Fev-Abr")
      sowingWindow: sp.sowingWindow,
      harvestWindow: sp.harvestWindow,
      // Legacy fields — still used by components until they migrate
      sowFrom: sp.sowFrom,
      sowTo: sp.sowTo,
      plantFrom: sp.plantFrom,
      plantTo: sp.plantTo,
      notes: sp.notes || sp.loreNotes,
      // New fields
      seasons: sp.seasons ? JSON.parse(sp.seasons) : null,
      soilEffect: sp.soilEffect,
      gardenRole: sp.gardenRole,
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

  // All beds with rotations + plantings
  const allBeds = db.select().from(schema.beds).all();
  const bedsMap = {};
  for (const bed of allBeds) {
    const bedRotations = db.select().from(schema.rotations)
      .where(eq(schema.rotations.bedId, bed.id)).all();

    const rotations = bedRotations.map((rot) => {
      const rotPlantings = db.select().from(schema.plantings)
        .where(eq(schema.plantings.rotationId, rot.id)).all();

      return {
        id: rot.id,
        title: rot.title,
        season: rot.season,
        rotation: rot.rotation,
        estado: rot.estado,
        failed: !!rot.failed,
        plantedDate: rot.plantedDate,
        harvestStart: rot.harvestStart,
        harvestEnd: rot.harvestEnd,
        pestNotes: rot.pestNotes,
        notes: rot.notes,
        plantings: rotPlantings.map((p) => ({
          species: p.speciesId,
          count: p.count,
          fn: p.fn,
        })),
      };
    });

    bedsMap[bed.id] = {
      notionCode: bed.notionCode,
      widthM: bed.widthM,
      heightM: bed.heightM,
      notes: bed.notes,
      nextRotation: bed.nextRotation,
      rotations,
    };
  }

  return { species: speciesMap, lore: loreMap, beds: bedsMap };
}
