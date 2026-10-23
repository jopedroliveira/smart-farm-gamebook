import { getHaUrl } from './auth.js';

export const VALVE_ENTITIES = {
  'RB-11': 'switch.sonoff_swv_rb_11',
  'RB-12': 'switch.sonoff_swv_rb_12',
  'RB-13': 'switch.sonoff_swv_rb_13',
  'RB-21': 'switch.sonoff_swv_rb_21',
  'RB-22': 'switch.sonoff_swv_rb_22',
  'RB-23': 'switch.sonoff_swv_rb_23',
};

// The Sonoff SWV exposes its sensors next to the switch with fixed suffixes.
export const swvSensor = (valveId, suffix) => valveId.replace('switch.', 'sensor.') + suffix;
export const swvBinary = (valveId, suffix) => valveId.replace('switch.', 'binary_sensor.') + suffix;

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

// Most recent complete on/off window of a valve, from its HA history
// (oldest first). Windows over three hours are a stuck valve, not a watering.
export function lastWatering(entityHistory, now = new Date()) {
  const none = { ultimaRega: null, duracaoMin: null, horasDesdeRega: null };
  if (!Array.isArray(entityHistory)) return none;
  let found = none;
  let onTime = null;
  for (const entry of entityHistory) {
    if (entry.state === 'on') {
      onTime = new Date(entry.last_changed);
    } else if (entry.state === 'off' && onTime) {
      const duration = (new Date(entry.last_changed) - onTime) / 60000;
      if (duration > 0 && duration < 180) {
        found = {
          ultimaRega: onTime.toISOString(),
          duracaoMin: Math.round(duration),
          horasDesdeRega: Math.round((now - onTime) / 3600000),
        };
      }
      onTime = null;
    }
  }
  return found;
}

// Litres for one watering: mean of the flow samples inside the window times
// its duration. Units seen on these valves: m³/h (ZHA default), L/min, L/h.
export function litresFor(flowHistory, startIso, durationMin) {
  if (!Array.isArray(flowHistory) || !startIso || !durationMin) return null;
  const start = new Date(startIso).getTime();
  const end = start + durationMin * 60000;
  const samples = flowHistory.filter(s => {
    const t = new Date(s.last_changed).getTime();
    const v = parseFloat(s.state);
    return t >= start && t <= end && !Number.isNaN(v) && v > 0;
  });
  if (!samples.length) return null;
  const unit = (samples[0].attributes?.unit_of_measurement || 'm³/h').toLowerCase();
  const mean = samples.reduce((s, x) => s + parseFloat(x.state), 0) / samples.length;
  const litresPerMin = unit.includes('m³') || unit.includes('m3') ? mean * 1000 / 60
    : unit === 'l/h' ? mean / 60
    : mean;
  return Math.round(litresPerMin * durationMin);
}

export async function getIrrigationState(accessToken) {
  if (!accessToken) return null;

  const now = new Date();
  const since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const valveIds = Object.values(VALVE_ENTITIES);
  const flowIds = valveIds.map(v => swvSensor(v, '_volume_flow_rate'));
  const history = await haFetch(
    `/api/history/period/${since}?filter_entity_id=${[...valveIds, ...flowIds].join(',')}&minimal_response`,
    accessToken
  );
  const states = await haFetch('/api/states', accessToken);
  const byId = new Map(Array.isArray(states) ? states.map(s => [s.entity_id, s]) : []);
  const stateOf = (id) => byId.get(id)?.state ?? null;
  const historyOf = (id) => Array.isArray(history)
    ? history.find(h => Array.isArray(h) && h.length > 0 && h[0].entity_id === id)
    : null;

  const result = {};
  for (const [bedId, valveId] of Object.entries(VALVE_ENTITIES)) {
    const watering = lastWatering(historyOf(valveId), now);
    const bateria = parseFloat(stateOf(swvSensor(valveId, '_battery')));
    result[bedId] = {
      valvula: stateOf(valveId) || 'unknown',
      ...watering,
      litros: litresFor(historyOf(swvSensor(valveId, '_volume_flow_rate')), watering.ultimaRega, watering.duracaoMin),
      bateria: Number.isNaN(bateria) ? null : bateria,
      fuga: stateOf(swvBinary(valveId, '_water_leak')) === 'on',
      semAgua: stateOf(swvBinary(valveId, '_water_supply')) === 'off',
    };
  }

  return result;
}
