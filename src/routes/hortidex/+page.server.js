import { getDb } from '$lib/server/db.js';
import * as schema from '$lib/server/schema.js';
import { bedPayload } from '$lib/server/cycles.js';

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
      germDays: sp.germDays,
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

  const bedsMap = {};
  for (const bed of db.select().from(schema.beds).all()) {
    bedsMap[bed.id] = bedPayload(db, bed);
  }

  return { species: speciesMap, lore: loreMap, beds: bedsMap };
}
