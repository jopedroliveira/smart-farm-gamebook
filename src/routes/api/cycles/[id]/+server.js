import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db.js';
import { closeCycle } from '$lib/server/cycles.js';

export async function PATCH({ params, request }) {
  const { closedOn } = await request.json();
  try {
    const cycle = closeCycle(getDb(), { cycleId: params.id, closedOn: closedOn || undefined });
    return json({ cycle });
  } catch (e) {
    return json({ error: e.message }, { status: 409 });
  }
}
