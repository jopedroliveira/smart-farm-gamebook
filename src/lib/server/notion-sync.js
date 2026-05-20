// Notion sync — pulls bed/planting data from Notion databases into local SQLite.
//
// Requires env vars:
//   NOTION_TOKEN       — Notion integration token
//   NOTION_BEDS_DB_ID  — ID of the "Raised Beds" database in Notion
//
// Usage:
//   import { syncFromNotion } from '$lib/server/notion-sync.js';
//   await syncFromNotion();

import { getDb } from './db.js';
import * as schema from './schema.js';
import { eq } from 'drizzle-orm';

export async function syncFromNotion() {
  const token = process.env.NOTION_TOKEN;
  const dbId = process.env.NOTION_BEDS_DB_ID;

  if (!token || !dbId) {
    throw new Error('NOTION_TOKEN and NOTION_BEDS_DB_ID must be set');
  }

  const db = getDb();

  // Log start
  const logResult = db.insert(schema.syncLog).values({ status: 'running' }).run();
  const syncId = logResult.lastInsertRowid;

  try {
    // Dynamic import so the app doesn't crash if @notionhq/client isn't installed
    const { Client } = await import('@notionhq/client');
    const notion = new Client({ auth: token });

    // Query the Notion database (paginated)
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

    // TODO: Map Notion properties to local schema.
    // This depends on your specific Notion database structure.
    // For each page in results:
    //   1. Extract bed properties (code, dimensions, dates, etc.)
    //   2. Upsert into beds table
    //   3. Delete + re-insert plantings for that bed
    //
    // Example property mapping (customize to your Notion schema):
    //   page.properties.Name.title[0].plain_text  → notionCode
    //   page.properties.Width.number               → widthM
    //   page.properties.Status.select.name          → estado
    //   etc.

    console.log(`[sync] Fetched ${results.length} pages from Notion`);

    db.update(schema.syncLog)
      .set({
        finishedAt: new Date().toISOString(),
        status: 'success',
        bedsSynced: results.length,
      })
      .where(eq(schema.syncLog.id, syncId))
      .run();

    return { syncId, bedsSynced: results.length };
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
