import { getDb } from '$lib/server/db.js';
import * as schema from '$lib/server/schema.js';
import { eq, desc } from 'drizzle-orm';
import { seedDatabase } from '$lib/server/seed.js';

export function load() {
  const db = getDb();

  // Auto-seed on first load if DB is empty
  const bedCount = db.select().from(schema.beds).all().length;
  if (bedCount === 0) {
    seedDatabase();
  }

  const allBeds = db.select().from(schema.beds).all();

  const beds = allBeds.map((bed) => {
    // Get all rotations for this bed
    const bedRotations = db.select().from(schema.rotations)
      .where(eq(schema.rotations.bedId, bed.id)).all();

    const rotations = bedRotations.map((rot) => {
      const rotPlantings = db.select().from(schema.plantings)
        .where(eq(schema.plantings.rotationId, rot.id)).all();

      return {
        id: rot.id,
        notionId: rot.notionId,
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
      notes: bed.notes,
      nextRotation: bed.nextRotation,
      rotations,
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
