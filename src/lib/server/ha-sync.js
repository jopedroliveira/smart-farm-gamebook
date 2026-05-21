// Home Assistant sync — polls HA REST API for irrigation/water sensors
// and records watering events in the local database.
//
// Auto-discovery: if a bed has no ha_water_entity set, the sync tries to
// find a HA entity whose entity_id contains the bed's notionCode (e.g.
// RB-11 matches sensor.rb_11_flow, switch.irrigation_rb11, etc.).
//
// Environment variables:
//   HA_URL   — Home Assistant base URL (e.g. http://homeassistant.local:8123)
//   HA_TOKEN — Long-lived access token

import { getDb } from './db.js';
import * as schema from './schema.js';
import { eq, desc } from 'drizzle-orm';

const HA_URL = process.env.HA_URL?.replace(/\/$/, '') || '';
const HA_TOKEN = process.env.HA_TOKEN || '';

// Minimum minutes between recording two water events for the same bed.
// Prevents duplicates while a zone is actively watering.
const MIN_EVENT_GAP_MIN = 10;

// Entity types we consider for water/irrigation sensors
const WATER_ENTITY_DOMAINS = ['sensor', 'binary_sensor', 'switch', 'input_boolean', 'valve'];

function haHeaders() {
  return {
    'Authorization': `Bearer ${HA_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Normalize a string for fuzzy matching (lowercase, remove dashes/underscores/spaces).
 */
function normalize(str) {
  return String(str).toLowerCase().replace(/[-_\s]/g, '');
}

/**
 * Score how likely an entity is to be a water sensor.
 * Higher = better match.
 */
function waterEntityScore(entityId) {
  const id = entityId.toLowerCase();
  let score = 0;
  if (id.includes('flow')) score += 10;
  if (id.includes('water')) score += 8;
  if (id.includes('irriga')) score += 8;
  if (id.includes('reg')) score += 6;       // rega
  if (id.includes('moisture')) score += 4;
  if (id.includes('humid')) score += 4;
  if (WATER_ENTITY_DOMAINS.some((d) => id.startsWith(d + '.'))) score += 2;
  return score;
}

/**
 * Check if a HA entity state indicates active watering.
 * Supports numeric flow sensors (> 0) and binary switches ('on').
 */
function isWateringActive(state) {
  if (state == null) return false;
  const num = parseFloat(state);
  if (!Number.isNaN(num)) return num > 0;
  return String(state).toLowerCase() === 'on';
}

/**
 * Parse numeric value from HA state (flow rate, volume, etc.)
 */
function parseValue(state) {
  const num = parseFloat(state);
  return Number.isNaN(num) ? null : num;
}

/**
 * Fetch current state for a single entity from HA.
 */
async function fetchEntityState(entityId) {
  const res = await fetch(`${HA_URL}/api/states/${entityId}`, {
    headers: haHeaders(),
  });
  if (!res.ok) {
    throw new Error(`HA returned ${res.status} for ${entityId}`);
  }
  return res.json();
}

/**
 * Fetch ALL entity states from HA.
 */
async function fetchAllStates() {
  const res = await fetch(`${HA_URL}/api/states`, {
    headers: haHeaders(),
  });
  if (!res.ok) {
    throw new Error(`HA returned ${res.status} for /api/states`);
  }
  return res.json();
}

/**
 * Record a water event if one hasn't been recorded recently.
 */
function recordEvent(bedId, value) {
  const db = getDb();
  const since = new Date(Date.now() - MIN_EVENT_GAP_MIN * 60 * 1000).toISOString();

  const recent = db.select()
    .from(schema.waterEvents)
    .where(eq(schema.waterEvents.bedId, bedId))
    .orderBy(desc(schema.waterEvents.timestamp))
    .limit(1)
    .get();

  if (recent && recent.timestamp >= since) {
    return false; // too recent
  }

  db.insert(schema.waterEvents).values({
    bedId,
    timestamp: new Date().toISOString(),
    source: 'ha',
    value,
  }).run();

  return true;
}

/**
 * Auto-discover HA water entities for beds that don't have one configured.
 * Matches entity_id against the bed's notionCode (case-insensitive, ignoring
 * dashes/underscores). Prefers entities with water-related keywords.
 *
 * Returns array of discovered mappings { bedId, notionCode, entityId }.
 */
export async function autoDiscoverEntities() {
  if (!HA_URL || !HA_TOKEN) {
    throw new Error('HA_URL or HA_TOKEN not configured');
  }

  const db = getDb();
  const beds = db.select({ id: schema.beds.id, notionCode: schema.beds.notionCode, haWaterEntity: schema.beds.haWaterEntity })
    .from(schema.beds)
    .all();

  const states = await fetchAllStates();
  const discovered = [];

  for (const bed of beds) {
    // Skip beds that already have a manual mapping
    if (bed.haWaterEntity) continue;

    const codeNorm = normalize(bed.notionCode);
    if (!codeNorm) continue;

    // Find all entities whose id contains the bed code
    const matches = states.filter((s) => {
      const idNorm = normalize(s.entity_id);
      return idNorm.includes(codeNorm);
    });

    if (matches.length === 0) continue;

    // Score and pick the best candidate
    const best = matches
      .map((s) => ({ state: s, score: waterEntityScore(s.entity_id) }))
      .sort((a, b) => b.score - a.score)[0];

    if (best.score > 0) {
      db.update(schema.beds)
        .set({ haWaterEntity: best.state.entity_id })
        .where(eq(schema.beds.id, bed.id))
        .run();

      discovered.push({
        bedId: bed.id,
        notionCode: bed.notionCode,
        entityId: best.state.entity_id,
      });
    }
  }

  return discovered;
}

/**
 * Poll all configured HA water entities and record events.
 * Auto-discovers missing mappings first.
 * Returns summary { checked, events, discovered, errors }.
 */
export async function syncFromHomeAssistant() {
  if (!HA_URL || !HA_TOKEN) {
    return { checked: 0, events: 0, discovered: [], errors: ['HA_URL or HA_TOKEN not configured'] };
  }

  const db = getDb();

  // Auto-discover missing mappings
  let discovered = [];
  try {
    discovered = await autoDiscoverEntities();
    if (discovered.length) {
      console.log(`[ha-sync] Auto-discovered ${discovered.length} sensor(s):`,
        discovered.map((d) => `${d.notionCode} → ${d.entityId}`).join(', '));
    }
  } catch (e) {
    console.error('[ha-sync] Auto-discovery failed:', e.message);
  }

  const beds = db.select({ id: schema.beds.id, haWaterEntity: schema.beds.haWaterEntity })
    .from(schema.beds)
    .all()
    .filter((b) => b.haWaterEntity);

  let events = 0;
  const errors = [];

  for (const bed of beds) {
    try {
      const entity = await fetchEntityState(bed.haWaterEntity);
      if (isWateringActive(entity.state)) {
        const value = parseValue(entity.state);
        const recorded = recordEvent(bed.id, value);
        if (recorded) events++;
      }
    } catch (e) {
      errors.push(`${bed.haWaterEntity}: ${e.message}`);
    }
  }

  return { checked: beds.length, events, discovered, errors };
}

/**
 * Get the most recent water event for a bed.
 */
export function getLastWaterEvent(bedId) {
  const db = getDb();
  return db.select()
    .from(schema.waterEvents)
    .where(eq(schema.waterEvents.bedId, bedId))
    .orderBy(desc(schema.waterEvents.timestamp))
    .limit(1)
    .get() || null;
}
