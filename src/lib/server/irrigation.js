// Camada de rega — primeiro caso de escrita no Home Assistant nesta app.
// Leitura: um único GET /api/states filtrado aqui (mais leve do que um
// pedido por entidade). Escrita: abrir é um turn_on simples; FECHAR passa
// SEMPRE pelo script.fechar_valvula_verificado do HA (um turn_off Zigbee
// pode falhar em silêncio e deixar uma válvula aberta horas — o script
// tenta 3x, confirma e notifica em falha).

import { getHaUrl } from './auth.js';
import { VALVE_ENTITIES } from './homeassistant.js';

// Zonas do jardim (válvulas wifi; domínio misto light/switch por herança do hardware)
export const GARDEN_ZONES = [
  { id: 'light.rega_relva_esquerda', nome: 'Relva Esquerda' },
  { id: 'light.rega_relva_direita', nome: 'Relva Direita' },
  { id: 'light.rega_mediterranicas', nome: 'Mediterrânicas' },
  { id: 'switch.eletrovalvula_relva_quintal', nome: 'Relva Quintal' },
];

// Sensores do smart watering (algoritmo de rega no HA)
const SMART_SENSORS = {
  anterior: 'sensor.previous_watering',
  proxima: 'sensor.next_watering',
  estado: 'sensor.watering_status',
  duracao: 'sensor.next_watering_duration',
};

// Entidades permitidas para comando (nunca aceitar ids arbitrários do cliente)
export const CONTROLLABLE = new Set([
  ...GARDEN_ZONES.map((z) => z.id),
  ...Object.values(VALVE_ENTITIES),
]);

const swvSensor = (valveId, suffix) => valveId.replace('switch.', 'sensor.') + suffix;
const swvBinary = (valveId, suffix) => valveId.replace('switch.', 'binary_sensor.') + suffix;

async function haCall(path, accessToken, options = {}) {
  const res = await fetch(`${getHaUrl()}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    ...options,
  });
  if (!res.ok) return null;
  return res.json().catch(() => null);
}

/**
 * Estado completo da rega num só pedido ao HA.
 * Devolve { smart, zonas, canteiros } ou null se o HA não responder.
 */
export async function getIrrigationOverview(accessToken) {
  if (!accessToken) return null;
  const states = await haCall('/api/states', accessToken);
  if (!Array.isArray(states)) return null;

  const byId = new Map(states.map((s) => [s.entity_id, s]));
  const stateOf = (id) => byId.get(id)?.state ?? null;

  const zonas = GARDEN_ZONES.map((z) => ({
    ...z,
    aberta: stateOf(z.id) === 'on',
    disponivel: byId.has(z.id) && stateOf(z.id) !== 'unavailable',
  }));

  const canteiros = Object.entries(VALVE_ENTITIES).map(([bedId, valveId]) => {
    const caudal = byId.get(swvSensor(valveId, '_volume_flow_rate'));
    const bateria = parseFloat(stateOf(swvSensor(valveId, '_battery')));
    return {
      bedId,
      id: valveId,
      nome: bedId,
      aberta: stateOf(valveId) === 'on',
      disponivel: byId.has(valveId) && stateOf(valveId) !== 'unavailable',
      caudal: caudal ? `${caudal.state} ${caudal.attributes?.unit_of_measurement || ''}`.trim() : null,
      bateria: Number.isNaN(bateria) ? null : bateria,
      fuga: stateOf(swvBinary(valveId, '_water_leak')) === 'on',
      semAgua: stateOf(swvBinary(valveId, '_water_supply')) === 'off',
    };
  });

  const smart = {
    anterior: stateOf(SMART_SENSORS.anterior),
    proxima: stateOf(SMART_SENSORS.proxima),
    estado: stateOf(SMART_SENSORS.estado),
    duracao: stateOf(SMART_SENSORS.duracao),
  };

  return { smart, zonas, canteiros };
}

/**
 * Abre ou fecha uma válvula. Fechar usa sempre o script verificado do HA.
 * O script pode demorar (retries de 10 s); não esperamos por ele — um
 * timeout curto aborta a espera da resposta, o HA continua a execução.
 */
export async function setValve(accessToken, entityId, abrir, motivo) {
  if (!CONTROLLABLE.has(entityId)) return { ok: false, erro: 'Válvula desconhecida' };

  const domain = entityId.split('.')[0];
  const path = abrir
    ? `/api/services/${domain}/turn_on`
    : '/api/services/script/fechar_valvula_verificado';
  const body = abrir
    ? { entity_id: entityId }
    : { valvula: entityId, motivo: motivo || 'Fecho manual no Sage' };

  try {
    await fetch(`${getHaUrl()}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(3000),
    });
  } catch (err) {
    // timeout do fecho verificado é esperado (o script continua no HA)
    if (err.name !== 'TimeoutError') return { ok: false, erro: 'HA não respondeu' };
  }
  return { ok: true };
}
