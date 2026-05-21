// Server hooks — runs once when the SvelteKit server starts.
// Sets up:
// 1. Game tick every 60s (sensor decay)
// 2. Daily Notion sync at 06:00 (when configured)

import cron from 'node-cron';
import { gameTick } from '$lib/server/game-tick.js';
import { getDb } from '$lib/server/db.js';
import { seedDatabase } from '$lib/server/seed.js';
import * as schema from '$lib/server/schema.js';
import { syncFromHomeAssistant } from '$lib/server/ha-sync.js';

// Ensure DB exists and is seeded
const db = getDb();
const bedCount = db.select().from(schema.beds).all().length;
if (bedCount === 0) {
  console.log('[hooks] Empty database — running seed...');
  seedDatabase();
}

// Game tick every 60 seconds
cron.schedule('* * * * *', () => {
  try {
    gameTick('sunny'); // TODO: pass real weather from last fetch
  } catch (e) {
    console.error('[game-tick] Error:', e.message);
  }
});
console.log('[hooks] Game tick scheduled (every 60s)');

// HA water sensor sync every 5 minutes (when configured)
cron.schedule('*/5 * * * *', async () => {
  if (!process.env.HA_URL || !process.env.HA_TOKEN) return;
  try {
    const result = await syncFromHomeAssistant();
    if (result.events > 0) {
      console.log(`[ha-sync] Recorded ${result.events} water event(s)`);
    }
    if (result.errors.length) {
      console.error('[ha-sync] Errors:', result.errors.join('; '));
    }
  } catch (e) {
    console.error('[ha-sync] Error:', e.message);
  }
});
console.log('[hooks] HA sync scheduled (every 5m, when HA_URL + HA_TOKEN set)');

// Daily Notion sync at 06:00
cron.schedule('0 6 * * *', async () => {
  if (!process.env.NOTION_TOKEN || !process.env.NOTION_BEDS_DB_ID) return;
  try {
    const { syncFromNotion } = await import('$lib/server/notion-sync.js');
    const result = await syncFromNotion();
    console.log(`[sync] Daily Notion sync complete: ${result.updated} updated, ${result.created} created`);
  } catch (e) {
    console.error('[sync] Error:', e.message);
  }
});
console.log('[hooks] Daily Notion sync scheduled (06:00)');
