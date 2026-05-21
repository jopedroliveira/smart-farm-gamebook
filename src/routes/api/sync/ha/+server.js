import { json, error } from '@sveltejs/kit';
import { syncFromHomeAssistant } from '$lib/server/ha-sync.js';

export async function POST() {
  try {
    const result = await syncFromHomeAssistant();
    if (result.errors.length && result.checked === 0) {
      throw error(503, result.errors.join('; '));
    }
    return json({ success: true, ...result });
  } catch (e) {
    throw error(500, e.message);
  }
}
