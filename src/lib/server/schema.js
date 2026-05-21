import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const beds = sqliteTable('beds', {
  id: text('id').primaryKey(),                // 'A1', 'B2', etc.
  notionCode: text('notion_code').notNull(),  // 'RB-11', 'RB-12'
  notionId: text('notion_id'),                // Notion page UUID
  widthM: real('width_m').notNull(),
  heightM: real('height_m').notNull(),
  plantedDate: text('planted_date'),
  harvestStart: text('harvest_start'),
  harvestEnd: text('harvest_end'),
  season: text('season'),
  rotation: text('rotation'),
  estado: text('estado'),
  nextRotation: text('next_rotation'),
  pestNotes: text('pest_notes'),
  notes: text('notes'),
  haWaterEntity: text('ha_water_entity'),     // Home Assistant entity_id for water/irrigation
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
});

export const species = sqliteTable('species', {
  id: text('id').primaryKey(),                // 'tomate_coracao'
  name: text('name').notNull(),
  family: text('family').notNull(),
  sprite: text('sprite').notNull(),
  color: text('color'),
  emoji: text('emoji'),
  growthDays: integer('growth_days').notNull(),
  // Lore fields
  description: text('description'),
  sun: text('sun'),
  water: text('water'),
  spacing: text('spacing'),
  germDays: integer('germ_days'),
  sowFrom: text('sow_from'),
  sowTo: text('sow_to'),
  plantFrom: text('plant_from'),
  plantTo: text('plant_to'),
  loreNotes: text('lore_notes'),
});

export const plantings = sqliteTable('plantings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  bedId: text('bed_id').notNull().references(() => beds.id),
  speciesId: text('species_id').notNull().references(() => species.id),
  count: integer('count').notNull(),
  fn: text('fn'),
});

export const companions = sqliteTable('companions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  speciesId: text('species_id').notNull().references(() => species.id),
  companionId: text('companion_id').notNull().references(() => species.id),
  type: text('type').notNull().default('good'), // 'good' or 'avoid'
});

export const bedHistory = sqliteTable('bed_history', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  bedId: text('bed_id').notNull().references(() => beds.id),
  season: text('season').notNull(),
  plants: text('plants'),       // JSON array
  notes: text('notes'),
});

export const sensorReadings = sqliteTable('sensor_readings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  bedId: text('bed_id').notNull().references(() => beds.id),
  metric: text('metric').notNull(),     // 'moisture', 'soil_health', 'pests', 'weeds'
  value: real('value').notNull(),
  timestamp: text('timestamp').notNull().default(sql`(datetime('now'))`),
  source: text('source').default('mock'),
}, (table) => [
  index('idx_sensor_bed_metric').on(table.bedId, table.metric, table.timestamp),
]);

export const waterEvents = sqliteTable('water_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  bedId: text('bed_id').notNull().references(() => beds.id),
  timestamp: text('timestamp').notNull().default(sql`(datetime('now'))`),
  source: text('source').default('ha'),
  value: real('value'),                       // flow rate or volume if available
}, (table) => [
  index('idx_water_bed_time').on(table.bedId, table.timestamp),
]);

export const syncLog = sqliteTable('sync_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  startedAt: text('started_at').notNull().default(sql`(datetime('now'))`),
  finishedAt: text('finished_at'),
  status: text('status').default('running'),
  bedsSynced: integer('beds_synced').default(0),
  error: text('error'),
});
