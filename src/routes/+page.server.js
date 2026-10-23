import { getDb } from '$lib/server/db.js';
import * as schema from '$lib/server/schema.js';
import { eq, desc, and } from 'drizzle-orm';
import { seedDatabase } from '$lib/server/seed.js';
import { getIrrigationState } from '$lib/server/homeassistant.js';
import { bedPayload } from '$lib/server/cycles.js';

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
      ...bedPayload(db, bed),
      horasSemRega,
      ultimaRega: haData?.ultimaRega ?? null,
      duracaoRegaMin: haData?.duracaoMin ?? null,
      litrosRega: haData?.litros ?? null,
      bateriaValvula: haData?.bateria ?? null,
      fugaAgua: haData?.fuga ?? false,
      semAgua: haData?.semAgua ?? false,
      diasSemSachar,
      valvula: haData?.valvula ?? 'unknown',
    };
  });

  return { beds };
}
