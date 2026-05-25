#!/usr/bin/env node

// One-off script: populate "ID interno" and "Espécie" for existing Variedades pages.
// Reads each page's "Nome comum", generates a slug (snake_case, ASCII, no accents),
// and writes it back as "ID interno". Also copies a simplified species name to "Espécie".
//
// Usage: NOTION_TOKEN=ntn_... node scripts/populate-id-interno.js [--dry-run]
//
// Safe to run multiple times — skips pages that already have ID interno filled.

const VARIEDADES_DB_ID = '2ed48e5e-412c-80f5-a252-000b647e44c3';
const NOTION_API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

const DRY_RUN = process.argv.includes('--dry-run');

// Known overrides — when the slug from "Nome comum" doesn't match the desired ID
const SLUG_OVERRIDES = {
  'Tomate Coração-de-Boi': 'tomate_coracao',
  'Tomate Cherry': 'tomate_cherry',
  'Tomate Cacho Preto': 'tomate_cacho',
  'Manjericão': 'manjericao',
  'Calêndula': 'calendula',
  'Couve Kale': 'couve_kale',
  'Borragem': 'borragem',
};

// Known species name overrides — "Espécie" is the generic name
const SPECIES_OVERRIDES = {
  'Tomate Coração-de-Boi': 'Tomate',
  'Tomate Cherry': 'Tomate',
  'Tomate Cacho Preto': 'Tomate',
  'Couve Kale': 'Couve',
};

function slugify(name) {
  if (SLUG_OVERRIDES[name]) return SLUG_OVERRIDES[name];

  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')      // non-alphanum → underscore
    .replace(/^_+|_+$/g, '');          // trim leading/trailing underscores
}

function speciesName(name) {
  if (SPECIES_OVERRIDES[name]) return SPECIES_OVERRIDES[name];
  // For single-word names, the species IS the name
  return name;
}

function rt(richText) {
  if (!richText || !Array.isArray(richText)) return '';
  return richText.map(t => t.plain_text).join('');
}

async function notionFetch(path, method = 'GET', body = null) {
  const token = process.env.NOTION_TOKEN;
  if (!token) throw new Error('NOTION_TOKEN env var not set');
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

async function main() {
  console.log(DRY_RUN ? '=== DRY RUN ===' : '=== Populating ID interno ===');

  // Query all pages in Variedades
  const body = { page_size: 100 };
  const result = await notionFetch(`/databases/${VARIEDADES_DB_ID}/query`, 'POST', body);
  const pages = result.results;

  console.log(`Found ${pages.length} pages in Variedades\n`);

  for (const page of pages) {
    const p = page.properties;
    const name = rt(p['Nome comum']?.title);
    const existingId = rt(p['ID interno']?.rich_text);
    const existingSpecies = rt(p['Espécie']?.rich_text);

    if (!name) {
      console.log(`  SKIP — no "Nome comum" (page ${page.id})`);
      continue;
    }

    const id = existingId || slugify(name);
    const sp = existingSpecies || speciesName(name);

    const needsUpdate = !existingId || !existingSpecies;
    if (!needsUpdate) {
      console.log(`  OK   "${name}" → id="${existingId}", espécie="${existingSpecies}" (already set)`);
      continue;
    }

    console.log(`  SET  "${name}" → id="${id}", espécie="${sp}"${existingId ? ' (espécie only)' : ''}`);

    if (!DRY_RUN) {
      const updates = {};
      if (!existingId) {
        updates['ID interno'] = { rich_text: [{ text: { content: id } }] };
      }
      if (!existingSpecies) {
        updates['Espécie'] = { rich_text: [{ text: { content: sp } }] };
      }
      await notionFetch(`/pages/${page.id}`, 'PATCH', { properties: updates });
    }
  }

  console.log('\nDone.');
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
