import { redirect } from '@sveltejs/kit';
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
