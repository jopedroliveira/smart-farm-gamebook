// Notion sync — pulls bed/planting data into local SQLite via Notion REST API.

import { getDb } from './db.js';
import * as schema from './schema.js';
import { eq } from 'drizzle-orm';

const BEDS_DB_ID = '2e548e5e-412c-807d-9247-dae81dc8b986';
const PLAN_DB_ID = '2e548e5e-412c-800f-a5db-cc39e5d0b5f6';
const NOTION_API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

const CODE_TO_ID = {
  'RB-23': 'A1', 'RB-22': 'B1', 'RB-21': 'C1',
  'RB-13': 'A2', 'RB-12': 'B2', 'RB-11': 'C2',
};

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

function findSpeciesId(name) {
  if (!name) return null;
  const lower = name.toLowerCase().trim();
  if (NAME_TO_SPECIES[lower]) return NAME_TO_SPECIES[lower];
  for (const [key, id] of Object.entries(NAME_TO_SPECIES)) {
    if (lower.includes(key) || key.includes(lower)) return id;
  }
  return null;
}

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

async function queryAll(dbId) {
  const results = [];
  let cursor;
  do {
    const body = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;
    const r = await notionFetch(`/databases/${dbId}/query`, 'POST', body);
    results.push(...r.results);
    cursor = r.has_more ? r.next_cursor : undefined;
  } while (cursor);
  return results;
}

export async function syncFromNotion() {
  if (!process.env.NOTION_TOKEN) throw new Error('NOTION_TOKEN not set');
  const db = getDb();

  const logResult = db.insert(schema.syncLog).values({ status: 'running' }).run();
  const syncId = logResult.lastInsertRowid;

  try {
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
          const speciesId = findSpeciesId(name);
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

    db.update(schema.syncLog).set({
      finishedAt: new Date().toISOString(),
      status: 'success',
      bedsSynced,
    }).where(eq(schema.syncLog.id, syncId)).run();

    console.log(`[sync] Done — ${bedsSynced} beds.`);
    return { syncId, bedsSynced };

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
