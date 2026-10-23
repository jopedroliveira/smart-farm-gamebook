// Seed an empty database: species catalog, companions and the physical beds.
// Cycles start empty; the garden's history is entered through the app.

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
      cycleDays: sp.growthDays || null,
      germinationDays: lore.germDays || null,
      sun: lore.sun || null,
      water: lore.water || null,
      spacing: lore.spacing || null,
      sowingWindow: lore.sowFrom && lore.sowTo ? `${lore.sowFrom}-${lore.sowTo}` : null,
      description: lore.desc || null,
      notes: lore.notes || null,
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

  // 3. Beds (physical properties only)
  const bedEntries = Object.entries(NOTION_BEDS);
  for (const [id, b] of bedEntries) {
    db.insert(schema.beds).values({
      id,
      notionCode: b.notionCode,
      widthM: b.widthM,
      heightM: b.heightM,
      notes: b.notes || null,
      nextRotation: b.nextRotation || null,
    }).onConflictDoNothing().run();
  }
  console.log(`  ${bedEntries.length} beds seeded.`);

  console.log('Seed complete.');
}

// If run directly
if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase();
}
