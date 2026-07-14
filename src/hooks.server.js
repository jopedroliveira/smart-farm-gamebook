import cron from 'node-cron';
import { redirect } from '@sveltejs/kit';
import { gameTick } from '$lib/server/game-tick.js';
import { getDb } from '$lib/server/db.js';
import { seedDatabase } from '$lib/server/seed.js';
import * as schema from '$lib/server/schema.js';
import { getSession } from '$lib/server/auth.js';

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
    gameTick('sunny');
  } catch (e) {
    console.error('[game-tick] Error:', e.message);
  }
});
console.log('[hooks] Game tick scheduled (every 60s)');

// Daily Notion sync at 06:00
cron.schedule('0 6 * * *', async () => {
  if (!process.env.NOTION_TOKEN) return;
  try {
    const { syncFromNotion } = await import('$lib/server/notion-sync.js');
    await syncFromNotion();
  } catch (e) {
    console.error('[sync] Error:', e.message);
  }
});
console.log('[hooks] Daily Notion sync scheduled (06:00)');

export async function handle({ event, resolve }) {
  const { pathname } = event.url;

  if (pathname.startsWith('/auth')) {
    return resolve(event);
  }

  const sessionId = event.cookies.get('session');
  const session = await getSession(sessionId);

  if (!session) {
    if (pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    redirect(302, '/auth');
  }

  event.locals.session = session;
  return resolve(event);
}
