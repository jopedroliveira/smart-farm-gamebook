// Seed the database from the existing hardcoded data files.
// This is the fallback for species not yet in Notion.
// Once all species are in Notion and synced, this seed becomes a no-op for species.

import { getDb } from './db.js';
import * as schema from './schema.js';
import { PLANT_SPECIES } from '../data/plant-species.js';
import { NOTION_BEDS } from '../data/beds.js';
import { PLANT_LORE } from '../data/plant-lore.js';
import { getDisplay } from '../data/species-display.js';

export function seedDatabase() {
  const db = getDb();
  console.log('Seeding database...');

  // 1. Species + lore (seed only — Notion sync will overwrite when available)
  const speciesEntries = Object.entries(PLANT_SPECIES);
  for (const [id, sp] of speciesEntries) {
    const lore = PLANT_LORE[id] || {};
    const display = getDisplay(id, sp.family);
    db.insert(schema.species).values({
      id,
      name: sp.name,
      family: sp.family,
      sprite: display.sprite,
      color: display.color,
      emoji: display.emoji,
      // New fields — populated from lore as best-effort seed
      cycleDays: sp.growthDays || null,
      germinationDays: lore.germDays || null,
      sun: lore.sun || null,
      water: lore.water || null,
      spacing: lore.spacing || null,
      sowingWindow: lore.sowFrom && lore.sowTo ? `${lore.sowFrom}-${lore.sowTo}` : null,
      description: lore.desc || null,
      notes: lore.notes || null,
      // Legacy fields — kept for backward compat
      growthDays: sp.growthDays,
      germDays: lore.germDays || null,
      sowFrom: lore.sowFrom || null,
      sowTo: lore.sowTo || null,
      plantFrom: lore.plantFrom || null,
      plantTo: lore.plantTo || null,
      loreNotes: lore.notes || null,
    }).onConflictDoNothing().run();
  }
  console.log(`  ${speciesEntries.length} species seeded.`);

  // 2. Companion relationships
  let companionCount = 0;
  for (const [id, lore] of Object.entries(PLANT_LORE)) {
    for (const comp of lore.companions || []) {
      if (PLANT_SPECIES[comp]) {
        db.insert(schema.companions).values({
          speciesId: id,
          companionId: comp,
          type: 'good',
        }).onConflictDoNothing().run();
        companionCount++;
      }
    }
    for (const av of lore.avoid || []) {
      if (PLANT_SPECIES[av]) {
        db.insert(schema.companions).values({
          speciesId: id,
          companionId: av,
          type: 'avoid',
        }).onConflictDoNothing().run();
        companionCount++;
      }
    }
  }
  console.log(`  ${companionCount} companion relationships seeded.`);

  // 3. Beds
  const bedEntries = Object.entries(NOTION_BEDS);
  for (const [id, b] of bedEntries) {
    db.insert(schema.beds).values({
      id,
      notionCode: b.notionCode,
      widthM: b.widthM,
      heightM: b.heightM,
      plantedDate: b.plantedDate || null,
      harvestStart: b.harvestStart || null,
      harvestEnd: b.harvestEnd || null,
      season: b.season || null,
      rotation: b.rotation || null,
      estado: b.estado || null,
      nextRotation: b.nextRotation || null,
      pestNotes: b.pestNotes || null,
      notes: b.notes || null,
    }).onConflictDoNothing().run();
  }
  console.log(`  ${bedEntries.length} beds seeded.`);

  // 4. Plantings
  let plantingCount = 0;
  for (const [bedId, b] of bedEntries) {
    for (const p of b.plantings || []) {
      db.insert(schema.plantings).values({
        bedId,
        speciesId: p.species,
        count: p.count,
        fn: p.fn || null,
      }).onConflictDoNothing().run();
      plantingCount++;
    }
  }
  console.log(`  ${plantingCount} plantings seeded.`);

  // 5. Bed history
  let historyCount = 0;
  for (const [bedId, b] of bedEntries) {
    for (const h of b.history || []) {
      db.insert(schema.bedHistory).values({
        bedId,
        season: h.season,
        plants: JSON.stringify(h.plants || []),
        notes: h.notes || null,
      }).onConflictDoNothing().run();
      historyCount++;
    }
  }
  console.log(`  ${historyCount} history entries seeded.`);

  // 6. Initial sensor readings (mock)
  const seedSensors = {
    A1: { moisture: 0.65, soil_health: 0.85, pests: 0.05, weeds: 0.1 },
    B1: { moisture: 0.4, soil_health: 0.7, pests: 0.0, weeds: 0.2 },
    C1: { moisture: 0.45, soil_health: 0.5, pests: 0.35, weeds: 0.35 },
    A2: { moisture: 0.7, soil_health: 0.85, pests: 0.1, weeds: 0.05 },
    B2: { moisture: 0.55, soil_health: 0.8, pests: 0.15, weeds: 0.15 },
    C2: { moisture: 0.6, soil_health: 0.75, pests: 0.05, weeds: 0.1 },
  };
  for (const [bedId, sensors] of Object.entries(seedSensors)) {
    for (const [metric, value] of Object.entries(sensors)) {
      db.insert(schema.sensorReadings).values({
        bedId,
        metric,
        value,
        source: 'mock',
      }).run();
    }
  }
  console.log(`  24 initial sensor readings seeded.`);

  console.log('Seed complete.');
}

// If run directly
if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase();
}
