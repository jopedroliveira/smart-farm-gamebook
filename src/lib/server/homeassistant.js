import { getHaUrl } from './auth.js';

const VALVE_ENTITIES = {
  'RB-11': 'switch.sonoff_swv_rb_11',
  'RB-12': 'switch.sonoff_swv_rb_12',
  'RB-13': 'switch.sonoff_swv_rb_13',
  'RB-21': 'switch.sonoff_swv_rb_21',
  'RB-23': 'switch.sonoff_swv_rb_23',
};

async function haFetch(path, accessToken) {
  const haUrl = getHaUrl();
  const res = await fetch(`${haUrl}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) return null;
  return res.json();
}

export async function getIrrigationState(accessToken) {
  if (!accessToken) return null;

  const now = new Date();
  const since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const sinceStr = since.toISOString();

  const entityIds = Object.values(VALVE_ENTITIES).join(',');
  const history = await haFetch(
    `/api/history/period/${sinceStr}?filter_entity_id=${entityIds}&minimal_response&no_attributes`,
    accessToken
  );

  const result = {};

  for (const [bedId, entityId] of Object.entries(VALVE_ENTITIES)) {
    const states = await haFetch(`/api/states/${entityId}`, accessToken);
    const currentState = states?.state || 'unknown';

    let lastWatering = null;
    let lastDurationMin = null;

    if (Array.isArray(history)) {
      const entityHistory = history.find(h =>
        Array.isArray(h) && h.length > 0 && h[0].entity_id === entityId
      );

      if (entityHistory) {
        let lastOnTime = null;
        for (let i = entityHistory.length - 1; i >= 0; i--) {
          const entry = entityHistory[i];
          if (entry.state === 'off' && lastOnTime) {
            const offTime = new Date(entry.last_changed);
            const duration = (offTime - lastOnTime) / 60000;
            if (duration > 0 && duration < 180) {
              lastWatering = lastOnTime.toISOString();
              lastDurationMin = Math.round(duration);
              break;
            }
            lastOnTime = null;
          } else if (entry.state === 'on') {
            lastOnTime = new Date(entry.last_changed);
          }
        }
      }
    }

    const hoursAgo = lastWatering
      ? Math.round((now - new Date(lastWatering)) / 3600000)
      : null;

    result[bedId] = {
      valvula: currentState,
      ultimaRega: lastWatering,
      duracaoMin: lastDurationMin,
      horasDesdeRega: hoursAgo,
    };
  }

  return result;
}
