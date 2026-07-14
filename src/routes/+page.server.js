import { getDb } from '$lib/server/db.js';
import * as schema from '$lib/server/schema.js';
import { eq, desc, and } from 'drizzle-orm';
import { seedDatabase } from '$lib/server/seed.js';
import { getIrrigationState } from '$lib/server/homeassistant.js';

export async function load({ locals }) {
  const db = getDb();

  const bedCount = db.select().from(schema.beds).all().length;
  if (bedCount === 0) {
    seedDatabase();
  }

  const allBeds = db.select().from(schema.beds).all();

  // HA irrigation data (needs session token)
  let irrigation = null;
  if (locals.session?.accessToken) {
    try {
      irrigation = await getIrrigationState(locals.session.accessToken);
    } catch (e) {
      console.error('[page] HA irrigation fetch failed:', e.message);
    }
  }

  const beds = allBeds.map((bed) => {
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

    // Watered: hours since last irrigation from HA
    const haData = irrigation?.[bed.id];
    const horasSemRega = haData?.horasDesdeRega ?? null;

    // Weeds: days since last "sachar" action for this bed
    const lastSachar = db.select({ createdAt: schema.actionLog.createdAt })
      .from(schema.actionLog)
      .where(and(
        eq(schema.actionLog.bedId, bed.id),
        eq(schema.actionLog.action, 'sachar'),
      ))
      .orderBy(desc(schema.actionLog.createdAt))
      .limit(1)
      .get();

    let diasSemSachar = null;
    if (lastSachar) {
      const last = new Date(lastSachar.createdAt);
      diasSemSachar = Math.floor((Date.now() - last.getTime()) / 86400000);
    }

    return {
      id: bed.id,
      notionCode: bed.notionCode,
      widthM: bed.widthM,
      heightM: bed.heightM,
      notes: bed.notes,
      nextRotation: bed.nextRotation,
      rotations,
      horasSemRega,
      diasSemSachar,
      valvula: haData?.valvula ?? 'unknown',
    };
  });

  const lastSync = db.select().from(schema.syncLog)
    .orderBy(desc(schema.syncLog.id)).limit(1).get() || null;

  return { beds, lastSync };
}
