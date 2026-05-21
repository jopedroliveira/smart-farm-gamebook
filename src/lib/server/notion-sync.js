// Notion sync — pulls bed data from a Notion database into local SQLite.
//
// Environment variables:
//   NOTION_TOKEN       — Notion integration token
//   NOTION_BEDS_DB_ID  — ID of the "Raised Beds" database in Notion
//
// Optional:
//   NOTION_PROPERTY_MAP — JSON override for property names
//     e.g. '{"notionCode":"Código","widthM":"Largura"}'

import { getDb } from './db.js';
import * as schema from './schema.js';
import { eq } from 'drizzle-orm';

const token = process.env.NOTION_TOKEN;
const dbId = process.env.NOTION_BEDS_DB_ID;

// Default property-name guesses (Portuguese + English)
const DEFAULT_PROPERTY_MAP = {
  notionCode: ['Name', 'name', 'Código', 'Codigo', 'Código RB', 'Título', 'Titulo', 'Title'],
  widthM: ['Largura', 'Width', 'largura', 'width', 'Largura (m)'],
  heightM: ['Comprimento', 'Length', 'Altura', 'Height', 'comprimento', 'altura', 'Comprimento (m)'],
  plantedDate: ['Data de Plantação', 'Planted', 'Data plantação', 'plantedDate', 'Data', 'Plantada'],
  harvestStart: ['Início Colheita', 'Harvest Start', 'Colheita Início', 'harvestStart', 'Colheita'],
  harvestEnd: ['Fim Colheita', 'Harvest End', 'Colheita Fim', 'harvestEnd'],
  season: ['Época', 'Season', 'Estação', 'Temporada', 'season', 'Época/Estação'],
  rotation: ['Rotação', 'Rotation', 'rotação', 'rotation'],
  estado: ['Estado', 'Status', 'estado', 'status'],
  nextRotation: ['Próxima Rotação', 'Next Rotation', 'Próxima', 'nextRotation'],
  pestNotes: ['Notas Pragas', 'Pest Notes', 'Pragas', 'pestNotes', 'Notas de Pragas'],
  notes: ['Notas', 'Notes', 'notas', 'notes', 'Descrição', 'Descricao'],
};

function getPropertyMap() {
  if (process.env.NOTION_PROPERTY_MAP) {
    try {
      return { ...DEFAULT_PROPERTY_MAP, ...JSON.parse(process.env.NOTION_PROPERTY_MAP) };
    } catch {
      console.warn('[notion-sync] NOTION_PROPERTY_MAP is invalid JSON, using defaults');
    }
  }
  return DEFAULT_PROPERTY_MAP;
}

// ---- Notion property extractors ----

function getPlainText(prop) {
  if (!prop) return null;
  switch (prop.type) {
    case 'title':
      return prop.title?.map((t) => t.plain_text).join('') || null;
    case 'rich_text':
      return prop.rich_text?.map((t) => t.plain_text).join('') || null;
    case 'select':
      return prop.select?.name || null;
    case 'status':
      return prop.status?.name || null;
    case 'formula': {
      const f = prop.formula;
      if (f?.type === 'string') return f.string;
      if (f?.type === 'number') return String(f.number);
      if (f?.type === 'boolean') return String(f.boolean);
      return null;
    }
    case 'url':
      return prop.url;
    case 'email':
      return prop.email;
    case 'phone_number':
      return prop.phone_number;
    default:
      return null;
  }
}

function getNumber(prop) {
  if (!prop) return null;
  if (prop.type === 'number') return prop.number;
  if (prop.type === 'formula' && prop.formula?.type === 'number') return prop.formula.number;
  const text = getPlainText(prop);
  if (text == null) return null;
  const n = parseFloat(text.replace(',', '.'));
  return Number.isNaN(n) ? null : n;
}

function getDate(prop) {
  if (!prop) return null;
  if (prop.type === 'date') return prop.date?.start || null;
  const text = getPlainText(prop);
  return text || null;
}

function findProperty(page, nameCandidates) {
  const props = page.properties || {};
  for (const name of nameCandidates) {
    if (props[name] !== undefined) return props[name];
  }
  return null;
}

function extractBed(page, map) {
  const codeProp = findProperty(page, map.notionCode);
  const code = getPlainText(codeProp) || page.id;

  return {
    notionId: page.id,
    notionCode: code,
    widthM: getNumber(findProperty(page, map.widthM)) || 1.5,
    heightM: getNumber(findProperty(page, map.heightM)) || 1.5,
    plantedDate: getDate(findProperty(page, map.plantedDate)),
    harvestStart: getDate(findProperty(page, map.harvestStart)),
    harvestEnd: getDate(findProperty(page, map.harvestEnd)),
    season: getPlainText(findProperty(page, map.season)),
    rotation: getPlainText(findProperty(page, map.rotation)),
    estado: getPlainText(findProperty(page, map.estado)),
    nextRotation: getPlainText(findProperty(page, map.nextRotation)),
    pestNotes: getPlainText(findProperty(page, map.pestNotes)),
    notes: getPlainText(findProperty(page, map.notes)),
  };
}

// ---- Sync ----

export async function syncFromNotion() {
  if (!token || !dbId) {
    throw new Error('NOTION_TOKEN and NOTION_BEDS_DB_ID must be set');
  }

  const db = getDb();
  const map = getPropertyMap();

  // Log start
  const logResult = db.insert(schema.syncLog).values({ status: 'running' }).run();
  const syncId = logResult.lastInsertRowid;

  try {
    const { Client } = await import('@notionhq/client');
    const notion = new Client({ auth: token });

    // Query database (paginated)
    let results = [];
    let cursor;
    do {
      const response = await notion.databases.query({
        database_id: dbId,
        start_cursor: cursor,
        page_size: 100,
      });
      results = results.concat(response.results);
      cursor = response.has_more ? response.next_cursor : undefined;
    } while (cursor);

    // Upsert each bed
    let created = 0;
    let updated = 0;
    const errors = [];

    for (const page of results) {
      try {
        const data = extractBed(page, map);

        // Try to find existing bed by notionId first, then by notionCode
        let existing = db.select()
          .from(schema.beds)
          .where(eq(schema.beds.notionId, page.id))
          .get();

        if (!existing && data.notionCode) {
          existing = db.select()
            .from(schema.beds)
            .where(eq(schema.beds.notionCode, data.notionCode))
            .get();
        }

        if (existing) {
          db.update(schema.beds)
            .set({
              notionId: data.notionId,
              notionCode: data.notionCode,
              widthM: data.widthM,
              heightM: data.heightM,
              plantedDate: data.plantedDate,
              harvestStart: data.harvestStart,
              harvestEnd: data.harvestEnd,
              season: data.season,
              rotation: data.rotation,
              estado: data.estado,
              nextRotation: data.nextRotation,
              pestNotes: data.pestNotes,
              notes: data.notes,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(schema.beds.id, existing.id))
            .run();
          updated++;
        } else {
          // Generate a local ID if new (e.g., N1, N2...)
          const count = db.select().from(schema.beds).all().length;
          const newId = `N${count + 1}`;
          db.insert(schema.beds).values({
            id: newId,
            ...data,
          }).run();
          created++;
        }
      } catch (e) {
        errors.push(`${page.id}: ${e.message}`);
      }
    }

    db.update(schema.syncLog)
      .set({
        finishedAt: new Date().toISOString(),
        status: errors.length ? 'partial' : 'success',
        bedsSynced: updated + created,
        error: errors.length ? errors.join('; ') : null,
      })
      .where(eq(schema.syncLog.id, syncId))
      .run();

    console.log(`[notion-sync] Fetched ${results.length} pages. Created ${created}, updated ${updated}.`);
    if (errors.length) console.error('[notion-sync] Errors:', errors);

    return { syncId, fetched: results.length, created, updated, errors };
  } catch (e) {
    db.update(schema.syncLog)
      .set({
        finishedAt: new Date().toISOString(),
        status: 'error',
        error: e.message,
      })
      .where(eq(schema.syncLog.id, syncId))
      .run();
    throw e;
  }
}
