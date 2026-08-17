import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db.js';
import * as schema from '$lib/server/schema.js';
import { getIrrigationOverview, setValve, CONTROLLABLE } from '$lib/server/irrigation.js';
import { VALVE_ENTITIES } from '$lib/server/homeassistant.js';

export async function GET({ locals }) {
  const overview = await getIrrigationOverview(locals.session?.accessToken);
  if (!overview) return json({ error: 'Home Assistant não respondeu' }, { status: 502 });
  return json(overview);
}

export async function POST({ request, locals }) {
  const { entityId, action } = await request.json();
  if (!entityId || !CONTROLLABLE.has(entityId)) {
    return json({ error: 'Válvula desconhecida' }, { status: 400 });
  }
  if (action !== 'abrir' && action !== 'fechar') {
    return json({ error: 'Ação inválida' }, { status: 400 });
  }

  const result = await setValve(locals.session?.accessToken, entityId, action === 'abrir');
  if (!result.ok) return json({ error: result.erro }, { status: 502 });

  // registo no diário da quinta (bed_id só para válvulas de canteiro)
  const bedId = Object.entries(VALVE_ENTITIES).find(([, v]) => v === entityId)?.[0] ?? null;
  const db = getDb();
  db.insert(schema.actionLog).values({
    bedId,
    action: action === 'abrir' ? 'regar' : 'fechar_rega',
    details: `${entityId} (manual, via página de rega)`,
  }).run();

  return json({ ok: true });
}
