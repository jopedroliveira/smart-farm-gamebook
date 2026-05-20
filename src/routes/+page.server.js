import { getDb } from '$lib/server/db.js';
import * as schema from '$lib/server/schema.js';
import { eq, desc } from 'drizzle-orm';
import { seedDatabase } from '$lib/server/seed.js';
import { existsSync } from 'fs';
import { resolve } from 'path';

export function load() {
  const db = getDb();

  // Auto-seed on first load if DB is empty
  const bedCount = db.select().from(schema.beds).all().length;
  if (bedCount === 0) {
    seedDatabase();
  }

  const allBeds = db.select().from(schema.beds).all();

  const beds = allBeds.map((bed) => {
    const bedPlantings = db.select().from(schema.plantings)
      .where(eq(schema.plantings.bedId, bed.id)).all();

    const history = db.select().from(schema.bedHistory)
      .where(eq(schema.bedHistory.bedId, bed.id)).all()
      .map((h) => ({ ...h, plants: JSON.parse(h.plants || '[]') }));

    // Latest sensor per metric
    const sensorRows = db.select({
      metric: schema.sensorReadings.metric,
      value: schema.sensorReadings.value,
    }).from(schema.sensorReadings)
      .where(eq(schema.sensorReadings.bedId, bed.id))
      .orderBy(desc(schema.sensorReadings.timestamp))
      .all();

    const sensors = {};
    for (const r of sensorRows) {
      if (!sensors[r.metric]) sensors[r.metric] = r.value;
    }

    return {
      id: bed.id,
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
      // Sensor values as direct properties (matching what the UI expects)
      watered: sensors.moisture ?? 0.5,
      soilHealth: sensors.soil_health ?? 0.5,
      pests: sensors.pests ?? 0,
      weeds: sensors.weeds ?? 0,
    };
  });

  // Sync status
  const lastSync = db.select().from(schema.syncLog)
    .orderBy(desc(schema.syncLog.id)).limit(1).get() || null;

  return { beds, lastSync };
}
