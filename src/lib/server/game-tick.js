// Server-side game tick: decays moisture, grows weeds, creeps pests.
// Called every 60s by node-cron. Writes new sensor_readings rows.

import { getDb } from './db.js';
import * as schema from './schema.js';
import { eq, desc } from 'drizzle-orm';

export function gameTick(weatherKind = 'sunny') {
  const db = getDb();
  const beds = db.select().from(schema.beds).all();

  for (const bed of beds) {
    // Get latest reading per metric
    const latest = {};
    for (const metric of ['moisture', 'soil_health', 'pests', 'weeds']) {
      const row = db.select({ value: schema.sensorReadings.value })
        .from(schema.sensorReadings)
        .where(eq(schema.sensorReadings.bedId, bed.id))
        .orderBy(desc(schema.sensorReadings.timestamp))
        .limit(1)
        .get();
      latest[metric] = row?.value ?? 0.5;
    }

    // Apply decay/growth
    let moisture = latest.moisture - 0.04;
    if (weatherKind === 'rain' || weatherKind === 'drizzle') moisture = Math.min(1, moisture + 0.15);
    if (weatherKind === 'storm') moisture = Math.min(1, moisture + 0.25);
    if (weatherKind === 'sunny') moisture = Math.max(0, moisture - 0.02);
    moisture = Math.max(0, Math.min(1, moisture));

    const weeds = Math.min(1, latest.weeds + 0.015);
    const pests = Math.min(1, latest.pests + (weatherKind === 'storm' ? 0.02 : 0.008));
    const soilHealth = latest.soil_health; // soil doesn't decay passively

    // Write new readings
    const now = new Date().toISOString();
    for (const [metric, value] of Object.entries({ moisture, soil_health: soilHealth, pests, weeds })) {
      db.insert(schema.sensorReadings).values({
        bedId: bed.id,
        metric,
        value,
        timestamp: now,
        source: 'tick',
      }).run();
    }
  }

  // Prune old readings — keep last 24h only (avoid DB bloat)
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  db.delete(schema.sensorReadings)
    .where(
      // SQLite: timestamp < cutoff
      // Using raw SQL since drizzle's lt on text needs care
    )
    .run();
  // Actually let's use the raw sqlite for the prune
  const sqlite = db._.session.client;
  sqlite.prepare('DELETE FROM sensor_readings WHERE timestamp < ?').run(cutoff);
}
