// Notion sync — pulls bed/planting/species/companion/history data into local SQLite.

import { getDb } from './db.js';
import * as schema from './schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { SPECIES_DISPLAY, getDisplay } from '../data/species-display.js';

const BEDS_DB_ID = '2e548e5e-412c-807d-9247-dae81dc8b986';
const PLAN_DB_ID = '2e548e5e-412c-800f-a5db-cc39e5d0b5f6';
const VARIEDADES_DB_ID = '2ed48e5e-412c-80f5-a252-000b647e44c3';
const NOTION_API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

const CODE_TO_ID = {
  'RB-23': 'A1', 'RB-22': 'B1', 'RB-21': 'C1',
  'RB-13': 'A2', 'RB-12': 'B2', 'RB-11': 'C2',
};

// ---- Notion API helpers ----

function rt(richText) {
  if (!richText || !Array.isArray(richText)) return '';
  return richText.map(t => t.plain_text).join('');
}

function parseDims(str) {
  if (!str) return { w: 0, h: 0 };
  const m = str.match(/([\d.]+)\s*[x×]\s*([\d.]+)/i);
  return m ? { w: parseFloat(m[1]), h: parseFloat(m[2]) } : { w: 0, h: 0 };
}

async function notionFetch(path, method = 'GET', body = null) {
  const token = process.env.NOTION_TOKEN;
  const opts = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(`${NOTION_API}${path}`, opts);
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error(`Notion ${r.status}: ${err.message || r.statusText}`);
  }
  return r.json();
}

async function queryAll(dbId, filter = null) {
  const results = [];
  let cursor;
  do {
    const body = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;
    if (filter) body.filter = filter;
    const r = await notionFetch(`/databases/${dbId}/query`, 'POST', body);
    results.push(...r.results);
    cursor = r.has_more ? r.next_cursor : undefined;
  } while (cursor);
  return results;
}

// Extract plain text from Notion block children (page body → markdown-ish)
async function getPageBody(pageId) {
  try {
    const blocks = [];
    let cursor;
    do {
      const path = `/blocks/${pageId}/children?page_size=100${cursor ? `&start_cursor=${cursor}` : ''}`;
      const r = await notionFetch(path);
      blocks.push(...r.results);
      cursor = r.has_more ? r.next_cursor : undefined;
    } while (cursor);

    const lines = [];
    for (const block of blocks) {
      const type = block.type;
      const data = block[type];
      if (!data) continue;

      if (type === 'heading_1') lines.push(`# ${rt(data.rich_text)}`);
      else if (type === 'heading_2') lines.push(`## ${rt(data.rich_text)}`);
      else if (type === 'heading_3') lines.push(`### ${rt(data.rich_text)}`);
      else if (type === 'paragraph') lines.push(rt(data.rich_text));
      else if (type === 'bulleted_list_item') lines.push(`- ${rt(data.rich_text)}`);
      else if (type === 'numbered_list_item') lines.push(`1. ${rt(data.rich_text)}`);
      else if (type === 'divider') lines.push('---');
    }
    return lines.filter(l => l.length > 0).join('\n\n');
  } catch (e) {
    console.log(`[sync] Could not fetch body for ${pageId}: ${e.message}`);
    return '';
  }
}

// ---- Species sync (Variedades DB) ----

export async function syncSpecies() {
  const db = getDb();
  console.log('[sync] Fetching Variedades...');
  const pages = await queryAll(VARIEDADES_DB_ID);

  // Build notionPageId → idInterno map (needed for companion resolution)
  const pageIdToInterno = {};
  const validPages = [];

  for (const page of pages) {
    const p = page.properties;
    const idInterno = rt(p['ID interno']?.rich_text);
    if (!idInterno) {
      const name = rt(p['Nome comum']?.title);
      console.warn(`[sync] Skipping "${name || page.id}" — no ID interno`);
      continue;
    }
    pageIdToInterno[page.id] = idInterno;
    validPages.push(page);
  }

  console.log(`[sync] ${validPages.length} species with ID interno (${pages.length - validPages.length} skipped)`);

  // Upsert species
  let speciesCount = 0;
  for (const page of validPages) {
    const p = page.properties;
    const id = pageIdToInterno[page.id];

    const sun = p['Exposição solar']?.multi_select?.map(s => s.name) || [];
    const seasons = p['Estação']?.multi_select?.map(s => s.name) || [];
    const display = getDisplay(id, p['Família botânica']?.select?.name);

    // Fetch page body for description
    const body = await getPageBody(page.id);

    const data = {
      name: rt(p['Nome comum']?.title),
      speciesName: rt(p['Espécie']?.rich_text) || null,
      scientificName: rt(p['Nome científico']?.rich_text) || null,
      family: p['Família botânica']?.select?.name || null,
      cropType: p['Tipo de Cultura']?.select?.name || null,
      sprite: display.sprite,
      color: display.color,
      emoji: display.emoji,
      cycleDays: p['Ciclo (dias)']?.number || null,
      germinationDays: p['Germinação (dias)']?.number || null,
      sun: sun.length ? JSON.stringify(sun) : null,
      water: p['Água']?.select?.name || null,
      spacing: rt(p['Espaçamento']?.rich_text) || null,
      sowingWindow: rt(p['Sementeira']?.rich_text) || null,
      harvestWindow: rt(p['Colheita']?.rich_text) || null,
      seasons: seasons.length ? JSON.stringify(seasons) : null,
      soilEffect: p['Efeito no solo']?.select?.name || null,
      gardenRole: rt(p['Função no canteiro']?.rich_text) || null,
      notes: rt(p['Notas']?.rich_text) || null,
      description: body || null,
      // Legacy compat — map new fields to old column names too
      growthDays: p['Ciclo (dias)']?.number || null,
      germDays: p['Germinação (dias)']?.number || null,
    };

    const existing = db.select().from(schema.species).where(eq(schema.species.id, id)).get();
    if (existing) {
      db.update(schema.species).set(data).where(eq(schema.species.id, id)).run();
    } else {
      db.insert(schema.species).values({ id, ...data }).run();
    }
    speciesCount++;
  }

  console.log(`[sync] ${speciesCount} species upserted`);

  // Sync companions + avoid
  let companionCount = 0;

  for (const page of validPages) {
    const p = page.properties;
    const speciesId = pageIdToInterno[page.id];

    // Companheiros (type = 'good')
    const companions = p['Companheiros']?.relation || [];
    for (const rel of companions) {
      const companionId = pageIdToInterno[rel.id];
      if (!companionId) continue;
      db.run(sql`INSERT OR REPLACE INTO companions (species_id, companion_id, type) VALUES (${speciesId}, ${companionId}, 'good')`);
      companionCount++;
    }

    // Evitar (type = 'avoid') — one-way in Notion, insert mirror pair too
    const avoids = p['Evitar']?.relation || [];
    for (const rel of avoids) {
      const avoidId = pageIdToInterno[rel.id];
      if (!avoidId) continue;
      db.run(sql`INSERT OR REPLACE INTO companions (species_id, companion_id, type) VALUES (${speciesId}, ${avoidId}, 'avoid')`);
      // Mirror pair
      db.run(sql`INSERT OR REPLACE INTO companions (species_id, companion_id, type) VALUES (${avoidId}, ${speciesId}, 'avoid')`);
      companionCount++;
    }
  }

  console.log(`[sync] ${companionCount} companion relationships synced`);
  return { pageIdToInterno, speciesCount, companionCount };
}

// ---- Bed history sync (Planeamento DB filtered by Estado=Terminado) ----

export async function syncBedHistory(pageIdToInterno) {
  const db = getDb();
  console.log('[sync] Fetching Planeamento (Terminado) for bed history...');

  const filter = {
    property: 'Estado',
    select: { equals: 'Terminado' },
  };
  const pages = await queryAll(PLAN_DB_ID, filter);

  let historyCount = 0;
  for (const page of pages) {
    const p = page.properties;
    const code = rt(p['Raised bed']?.title);
    if (!code) continue;

    const bedId = CODE_TO_ID[code];
    if (!bedId) {
      console.log(`[sync] bedHistory: unknown bed ${code}`);
      continue;
    }

    // Build season label: "Estação Ano" e.g. "Inverno 2025"
    const seasons = p['Estação']?.multi_select?.map(s => s.name) || [];
    const ano = p['Ano']?.number;
    const season = seasons.length && ano
      ? `${seasons.join('/')} ${ano}`
      : seasons.join('/') || `${ano || ''}`;

    if (!season.trim()) {
      console.log(`[sync] bedHistory: skipping ${code} — no season/year`);
      continue;
    }

    // Resolve culturas to ID interno
    const culturaIds = p['Culturas']?.relation?.map(r => r.id) || [];
    const plants = [];
    for (const cId of culturaIds) {
      if (pageIdToInterno[cId]) {
        plants.push(pageIdToInterno[cId]);
      } else {
        // Fetch page to get the name as fallback label
        try {
          const cp = (await notionFetch(`/pages/${cId}`)).properties;
          const name = rt(cp['Nome comum']?.title);
          plants.push(name || cId);
        } catch {
          plants.push(cId);
        }
      }
    }

    const notes = rt(p['Notas rápidas']?.rich_text) || null;

    // Upsert by bedId + season (avoid duplicates)
    const existing = db.select().from(schema.bedHistory)
      .where(and(eq(schema.bedHistory.bedId, bedId), eq(schema.bedHistory.season, season)))
      .get();

    const data = {
      bedId,
      season,
      plants: JSON.stringify(plants),
      notes,
    };

    if (existing) {
      db.update(schema.bedHistory).set(data)
        .where(eq(schema.bedHistory.id, existing.id)).run();
    } else {
      db.insert(schema.bedHistory).values(data).run();
    }
    historyCount++;
  }

  console.log(`[sync] ${historyCount} bed history entries synced`);
  return { historyCount };
}

// ---- Beds + plantings sync (existing logic, refactored) ----

// Legacy name map — still needed to resolve cultura names to species IDs
// when pages don't have ID interno yet
const NAME_TO_SPECIES = {
  'tomate coração-de-boi': 'tomate_coracao',
  'tomate cherry': 'tomate_cherry',
  'tomate cacho preto': 'tomate_cacho',
  'pimento': 'pimento',
  'beringela': 'beringela',
  'courgette': 'courgette',
  'pepino': 'pepino',
  'manjericão': 'manjericao',
  'segurelha': 'segurelha',
  'salsa': 'salsa',
  'endro': 'endro',
  'cenoura': 'cenoura',
  'calêndula': 'calendula',
  'tagetes': 'tagetes',
  'camomila': 'camomila',
  'alface': 'alface',
  'rúcula': 'rucula',
  'rabanete': 'rabanete',
  'nabiça/grelos': 'nabica',
  'nabiça': 'nabica',
  'grelos': 'nabica',
  'beterraba': 'beterraba',
  'espinafre': 'espinafre',
  'acelga': 'acelga',
  'feijão verde': 'feijao_verde',
  'alho-francês': 'alho_frances',
  'alho francês': 'alho_frances',
  'cebolo': 'cebolo',
  'couve kale': 'couve_kale',
  'kale': 'couve_kale',
  'ervilha': 'ervilha',
  'brócolos': 'brocolos',
  'brócolo': 'brocolos',
  'coentros': 'coentros',
  'cebolinho': 'cebolinho',
  'couve lombarda': 'couve_lombarda',
  'agrião': 'agriao',
  'batata doce': 'batata_doce',
  'tomate': 'tomate_coracao',
};

function findSpeciesId(name, pageIdToInterno, pageId) {
  // Prefer ID interno lookup if we have it
  if (pageId && pageIdToInterno?.[pageId]) return pageIdToInterno[pageId];

  if (!name) return null;
  const lower = name.toLowerCase().trim();
  if (NAME_TO_SPECIES[lower]) return NAME_TO_SPECIES[lower];
  for (const [key, id] of Object.entries(NAME_TO_SPECIES)) {
    if (lower.includes(key) || key.includes(lower)) return id;
  }
  return null;
}

async function syncBeds(pageIdToInterno) {
  const db = getDb();

  console.log('[sync] Fetching Raised Beds...');
  const bedsPages = await queryAll(BEDS_DB_ID);

  console.log('[sync] Fetching Planeamento...');
  const planPages = await queryAll(PLAN_DB_ID);

  // Build beds map from Raised Beds DB
  const bedsMap = {};
  for (const page of bedsPages) {
    const p = page.properties;
    const code = rt(p['Código']?.title);
    if (!code) continue;
    const dims = parseDims(rt(p['Dimensões']?.rich_text));
    bedsMap[code] = {
      notionId: page.id,
      notes: rt(p['Observações Gerais']?.rich_text),
      nextRotation: rt(p['Próxima rotação ']?.rich_text),
      soilPrep: rt(p['Preparação do solo']?.rich_text),
      widthM: dims.w,
      heightM: dims.h,
    };
  }

  // Process Planeamento
  let bedsSynced = 0;
  for (const page of planPages) {
    const p = page.properties;
    const code = rt(p['Raised bed']?.title);
    if (!code) continue;

    const bedId = CODE_TO_ID[code];
    if (!bedId) {
      console.log(`[sync] Unknown bed: ${code}`);
      continue;
    }

    const info = bedsMap[code] || {};
    const estado = p['Estado']?.select?.name || '';
    const rotation = p['Rotação']?.select?.name || '';
    const seasons = p['Estação']?.multi_select?.map(s => s.name) || [];
    const plantedDate = p['Data de plantação']?.date?.start || null;
    const harvestStart = p['Data de colheita prevista']?.date?.start || null;
    const pestNotes = rt(p['Controlo de Pragas']?.rich_text);
    const quickNotes = rt(p['Notas rápidas']?.rich_text);
    const culturaIds = p['Culturas']?.relation?.map(r => r.id) || [];

    const notes = [quickNotes, info.notes, info.soilPrep].filter(Boolean).join('\n\n');
    const season = seasons.length ? seasons.join('/') + ' 2026' : '';

    // Upsert bed
    const existing = db.select().from(schema.beds).where(eq(schema.beds.id, bedId)).get();
    const bedData = {
      notionCode: code,
      notionId: info.notionId || null,
      widthM: info.widthM || existing?.widthM || 3.2,
      heightM: info.heightM || existing?.heightM || 1.5,
      plantedDate,
      harvestStart,
      harvestEnd: null,
      season,
      rotation,
      estado,
      nextRotation: info.nextRotation || null,
      pestNotes: pestNotes || null,
      notes: notes || null,
      updatedAt: new Date().toISOString(),
    };

    if (existing) {
      db.update(schema.beds).set(bedData).where(eq(schema.beds.id, bedId)).run();
    } else {
      db.insert(schema.beds).values({ id: bedId, ...bedData }).run();
    }

    // Re-sync plantings
    db.delete(schema.plantings).where(eq(schema.plantings.bedId, bedId)).run();

    for (const culturaId of culturaIds) {
      try {
        const cp = (await notionFetch(`/pages/${culturaId}`)).properties;
        const name = rt(cp['Nome comum']?.title);
        const speciesId = findSpeciesId(name, pageIdToInterno, culturaId);
        const fn = rt(cp['Função no canteiro']?.rich_text);

        if (speciesId) {
          db.insert(schema.plantings).values({
            bedId,
            speciesId,
            count: 1,
            fn: fn || name,
          }).run();
        } else {
          console.log(`[sync]   ? "${name}" — not matched`);
        }
      } catch (e) {
        console.log(`[sync]   failed cultura ${culturaId}: ${e.message}`);
      }
    }

    console.log(`[sync] ${code} (${bedId}): ${estado}, ${culturaIds.length} culturas`);
    bedsSynced++;
  }

  return { bedsSynced };
}

// ---- Main sync entry point ----

export async function syncFromNotion() {
  if (!process.env.NOTION_TOKEN) throw new Error('NOTION_TOKEN not set');
  const db = getDb();

  const logResult = db.insert(schema.syncLog).values({ status: 'running' }).run();
  const syncId = logResult.lastInsertRowid;

  try {
    // 1. Species + companions (must run first — beds depend on species IDs)
    const { pageIdToInterno, speciesCount, companionCount } = await syncSpecies();

    // 2. Beds + plantings
    const { bedsSynced } = await syncBeds(pageIdToInterno);

    // 3. Bed history from finished plantings
    const { historyCount } = await syncBedHistory(pageIdToInterno);

    db.update(schema.syncLog).set({
      finishedAt: new Date().toISOString(),
      status: 'success',
      bedsSynced,
    }).where(eq(schema.syncLog.id, syncId)).run();

    console.log(`[sync] Done — ${speciesCount} species, ${companionCount} companions, ${bedsSynced} beds, ${historyCount} history entries.`);
    return { syncId, speciesCount, companionCount, bedsSynced, historyCount };

  } catch (e) {
    console.error('[sync] Error:', e.message);
    db.update(schema.syncLog).set({
      finishedAt: new Date().toISOString(),
      status: 'error',
      error: e.message,
    }).where(eq(schema.syncLog.id, syncId)).run();
    throw e;
  }
}
