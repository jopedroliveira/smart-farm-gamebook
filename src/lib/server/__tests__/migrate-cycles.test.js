import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import { migrateRotationsToCycles, backfillSpecies, roleFromFn, summaryText } from '../migrate-cycles.js';

// Legacy DDL as it was before cycles existed.
const LEGACY = `
  CREATE TABLE beds (id TEXT PRIMARY KEY, notion_code TEXT NOT NULL, notion_id TEXT, width_m REAL NOT NULL,
    height_m REAL NOT NULL, notes TEXT, next_rotation TEXT, updated_at TEXT DEFAULT (datetime('now')));
  CREATE TABLE rotations (id INTEGER PRIMARY KEY AUTOINCREMENT, bed_id TEXT NOT NULL REFERENCES beds(id),
    notion_id TEXT, title TEXT, season TEXT, rotation TEXT, estado TEXT, failed INTEGER DEFAULT 0,
    planted_date TEXT, harvest_start TEXT, harvest_end TEXT, pest_notes TEXT, notes TEXT,
    updated_at TEXT DEFAULT (datetime('now')));
  CREATE TABLE species (id TEXT PRIMARY KEY, name TEXT NOT NULL, family TEXT, cycle_days INTEGER,
    germination_days INTEGER, sowing_window TEXT, growth_days INTEGER, germ_days INTEGER,
    sow_from TEXT, sow_to TEXT, plant_from TEXT, plant_to TEXT);
  CREATE TABLE plantings (id INTEGER PRIMARY KEY AUTOINCREMENT, rotation_id INTEGER NOT NULL REFERENCES rotations(id),
    species_id TEXT NOT NULL REFERENCES species(id), count INTEGER NOT NULL, fn TEXT);
  CREATE TABLE cycles (id INTEGER PRIMARY KEY AUTOINCREMENT, bed_id TEXT NOT NULL REFERENCES beds(id),
    title TEXT NOT NULL, scheme TEXT, started_on TEXT, closed_on TEXT, notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')));
  CREATE TABLE crops (id INTEGER PRIMARY KEY AUTOINCREMENT, cycle_id INTEGER NOT NULL REFERENCES cycles(id),
    species_id TEXT NOT NULL REFERENCES species(id), count INTEGER NOT NULL DEFAULT 1,
    role TEXT NOT NULL DEFAULT 'outra', method TEXT NOT NULL DEFAULT 'plantado',
    in_on TEXT, out_on TEXT, outcome TEXT, outcome_note TEXT);
`;

function legacyDb() {
  const s = new Database(':memory:');
  s.exec(LEGACY);
  s.prepare("insert into beds (id, notion_code, width_m, height_m, next_rotation) values (?, ?, 1, 1, ?)")
    .run('RB-13', 'RB-13', '   ');
  s.prepare("insert into beds (id, notion_code, width_m, height_m, next_rotation) values (?, ?, 1, 1, ?)")
    .run('RB-22', 'RB-22', 'Outono-Inverno 2026 — Alho-francês + Cenoura + Tagetes. Familias: Amaryllidaceae.');
  const sp = s.prepare('insert into species (id, name, family, cycle_days, germination_days, sow_from, plant_from, sowing_window) values (?, ?, ?, ?, ?, ?, ?, ?)');
  sp.run('feijao_verde', 'Feijao', 'Fabaceae', null, null, 'Abr', 'Abr', null);
  sp.run('alho', 'Alho', 'Amaryllidaceae', 210, 14, null, null, 'Out-Nov');
  sp.run('cenoura', 'Cenoura', 'Apiaceae', null, null, 'Fev', 'Mar', null);
  sp.run('alho_frances', 'Alho-frances', 'Amaryllidaceae', null, null, 'Ago', 'Out', null);
  sp.run('rabanete', 'Rabanete', 'Brassicaceae', null, null, 'Fev', null, null);
  sp.run('rucula', 'Rucula', 'Brassicaceae', null, null, null, null, null);
  sp.run('pimento', 'Pimento', 'Brassicaceae', 45, null, null, null, null);
  sp.run('misterio', 'Misterio', null, null, null, null, null, null);

  const rot = s.prepare(`insert into rotations (id, bed_id, title, rotation, estado, failed, planted_date, harvest_start, harvest_end, pest_notes, notes, updated_at)
    values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  rot.run(15, 'RB-13', 'RB-13 Primavera 2026 · Brassicáceas (Falhado)', '1 - Folha', 'Terminado', 1, '2026-02-15', '2026-04-15', null, 'Delia radicum nas raizes', 'FALHADO. Couves destruidas\nsegunda linha', '2026-07-14T06:00:18Z');
  rot.run(24, 'RB-13', 'RB-13 Primavera-Verão 2026 · Feijão verde', '1 - Folha', 'Terminado', 0, '2026-04-20', '2026-06-15', '2026-08-30', 'Pulgoes', 'Feijao em 1/3 da cama', '2026-10-21T15:16:29Z');
  rot.run(30, 'RB-13', 'RB-13 Outono-Inverno 2026 · Alho + Cebola + Cenoura', null, 'Planeado', 0, null, null, null, null, null, '2026-10-22T17:57:53Z');
  rot.run(20, 'RB-22', 'RB-22 Primavera-Verão 2026 · Feijão verde + tagetes', '1 - Folha', 'Terminado', 0, '2026-03-07', '2026-06-15', '2026-10-22', null, null, '2026-10-22T17:53:05Z');
  rot.run(26, 'RB-22', 'RB-22 Outono-Inverno 2026 · Alho-francês + companheiras', null, 'Plantado', 0, null, null, null, null, null, '2026-10-21T14:35:03Z');
  rot.run(99, 'RB-22', 'RB-22 Teste · Rabanetes', null, 'Plantado', 0, '2026-09-25', null, null, null, null, '2026-09-25T10:00:00Z');

  const pl = s.prepare('insert into plantings (rotation_id, species_id, count, fn) values (?, ?, ?, ?)');
  pl.run(24, 'feijao_verde', 6, 'Cultura principal — fixa azoto');
  pl.run(24, 'feijao_verde', 2, 'Anão');
  pl.run(24, 'pimento', 1, 'Atrai auxiliares');
  pl.run(30, 'alho', 10, 'Cultura principal');
  pl.run(30, 'cenoura', 6, 'companheira');
  pl.run(20, 'feijao_verde', 1, 'Cultura principal');
  pl.run(26, 'alho_frances', 12, 'Principal');
  pl.run(26, 'alho_frances', 1, 'Principal');
  pl.run(26, 'alho_frances', 8, 'Principal');
  pl.run(26, 'cenoura', 1, 'Companheira');
  pl.run(26, 'rabanete', 1, 'Principal');
  pl.run(26, 'rabanete', 10, 'Companheira');
  return s;
}

describe('migrateRotationsToCycles', () => {
  let sqlite;
  beforeEach(() => { sqlite = legacyDb(); });

  it('closes finished rotations and merges open ones into one cycle', () => {
    const summary = migrateRotationsToCycles(sqlite);
    const cycles = sqlite.prepare('select * from cycles where bed_id=? order by id').all('RB-13');
    expect(cycles.map(c => [c.title, c.closed_on !== null])).toEqual([
      ['Primavera 2026 · Brassicáceas (Falhado)', true],
      ['Primavera-Verão 2026 · Feijão verde', true],
      ['Outono-Inverno 2026 · Alho + Cebola + Cenoura', false],
    ]);
    expect(cycles[0]).toMatchObject({ scheme: '1 - Folha · FALHADO. Couves destruidas', started_on: '2026-02-15', closed_on: '2026-04-15', notes: 'Delia radicum nas raizes' });
    expect(cycles[1].notes).toBe('Pulgoes');
    expect(cycles[2].notes).toBeNull();
    expect(cycles[1].closed_on).toBe('2026-08-30');
    const open = cycles[2];
    expect(open.started_on).toBeNull();
    const crops = sqlite.prepare('select * from crops where cycle_id=? order by id').all(open.id);
    expect(crops.map(c => [c.species_id, c.count, c.role, c.in_on])).toEqual([
      ['alho', 10, 'principal', null], ['cenoura', 6, 'companheira', null],
    ]);
    const feijao = sqlite.prepare("select * from crops where species_id='feijao_verde' and cycle_id=?").all(cycles[1].id);
    expect(feijao).toHaveLength(1);
    expect(feijao[0]).toMatchObject({ count: 8, role: 'principal', in_on: '2026-04-20', out_on: '2026-08-30', outcome: 'colhida', method: 'plantado' });
    expect(summary.beds.find(b => b.bedId === 'RB-13').closedCount).toBe(2);
  });

  it('marks crops of a failed rotation as falhada with the pest notes', () => {
    sqlite.prepare('insert into plantings (rotation_id, species_id, count, fn) values (15, ?, 4, ?)').run('rucula', 'Cobertura rapida');
    migrateRotationsToCycles(sqlite);
    const crop = sqlite.prepare("select * from crops where species_id='rucula'").get();
    expect(crop).toMatchObject({ outcome: 'falhada', outcome_note: 'Delia radicum nas raizes', role: 'cobertura', method: 'plantado' });
  });

  it('merges open rotations, drops count-1 placeholders and assumes in_on from updated_at', () => {
    const summary = migrateRotationsToCycles(sqlite);
    const open = sqlite.prepare('select * from cycles where bed_id=? and closed_on is null').all('RB-22');
    expect(open).toHaveLength(1);
    expect(open[0].title).toBe('Outono-Inverno 2026 · Alho-francês + companheiras + Teste · Rabanetes');
    expect(open[0].started_on).toBe('2026-09-25');
    const crops = sqlite.prepare('select species_id, count, role, in_on, method from crops where cycle_id=? order by species_id').all(open[0].id);
    expect(crops).toEqual([
      { species_id: 'alho_frances', count: 20, role: 'principal', in_on: '2026-10-21', method: 'plantado' },
      { species_id: 'cenoura', count: 1, role: 'companheira', in_on: '2026-10-21', method: 'plantado' },
      { species_id: 'rabanete', count: 10, role: 'companheira', in_on: '2026-10-21', method: 'semeado' },
    ]);
    const rb22 = summary.beds.find(b => b.bedId === 'RB-22');
    expect(rb22.assumedDates).toEqual(['Outono-Inverno 2026 · Alho-francês + companheiras: 2026-10-21']);
  });

  it('lists open rotations without plantings and never invents a species', () => {
    const summary = migrateRotationsToCycles(sqlite);
    const rb22 = summary.beds.find(b => b.bedId === 'RB-22');
    expect(rb22.emptyOpen).toEqual(['RB-22 Teste · Rabanetes']);
    expect(sqlite.prepare("select count(*) c from crops where species_id='rabanete'").get().c).toBe(1);
  });

  it('applies an override for an open rotation without plantings', () => {
    migrateRotationsToCycles(sqlite, { overrides: [{ bedId: 'RB-22', title: 'Rabanetes', speciesId: 'rucula', count: 20, inOn: '2026-09-25' }] });
    const crop = sqlite.prepare("select * from crops where species_id='rucula'").get();
    expect(crop).toMatchObject({ count: 20, in_on: '2026-09-25', method: 'plantado' });
    const open = sqlite.prepare('select id from cycles where bed_id=? and closed_on is null').get('RB-22');
    expect(crop.cycle_id).toBe(open.id);
  });

  it('renames the old tables and is a no-op on the second run', () => {
    expect(migrateRotationsToCycles(sqlite)).not.toBeNull();
    const names = sqlite.prepare("select name from sqlite_master where type='table'").all().map(r => r.name);
    expect(names).toContain('rotations_old');
    expect(names).toContain('plantings_old');
    expect(names).not.toContain('rotations');
    expect(migrateRotationsToCycles(sqlite)).toBeNull();
  });

  it('clears a blank next_rotation, and moves one that describes the open cycle into its scheme', () => {
    sqlite.prepare('update beds set next_rotation=? where id=?').run('Primavera 2027: favas', 'RB-13');
    const summary = migrateRotationsToCycles(sqlite);
    const rows = sqlite.prepare('select id, next_rotation from beds order by id').all();
    expect(rows).toEqual([{ id: 'RB-13', next_rotation: 'Primavera 2027: favas' }, { id: 'RB-22', next_rotation: null }]);
    const open = sqlite.prepare('select scheme from cycles where bed_id=? and closed_on is null').get('RB-22');
    expect(open.scheme).toBe('Outono-Inverno 2026 — Alho-francês + Cenoura + Tagetes. Familias: Amaryllidaceae.');
    expect(summary.beds.find(b => b.bedId === 'RB-13').nextPlan).toBe('Primavera 2027: favas');
    expect(summary.beds.find(b => b.bedId === 'RB-22').nextPlan).toBeNull();
    expect(summaryText(summary)).toContain('proximo plano: Primavera 2027: favas');
  });

  it('keeps a blank next_rotation null', () => {
    migrateRotationsToCycles(sqlite);
    expect(sqlite.prepare('select next_rotation from beds where id=?').get('RB-13').next_rotation).toBeNull();
  });

  it('reports species missing family or growth days', () => {
    const summary = migrateRotationsToCycles(sqlite);
    expect(summary.speciesMissing.map(s => s.id)).toEqual(['misterio']);
  });
});

describe('backfillSpecies', () => {
  it('fills growth_days from cycle_days, then the JS file, and fixes a family that differs from it', () => {
    const sqlite = legacyDb();
    const fixes = backfillSpecies(sqlite);
    const get = id => sqlite.prepare('select * from species where id=?').get(id);
    expect(get('alho')).toMatchObject({ growth_days: 210, germ_days: 14, sow_from: 'Out', sow_to: 'Nov' });
    expect(get('rucula').growth_days).toBe(30);
    expect(get('pimento')).toMatchObject({ growth_days: 45, family: 'Solanaceae' });
    expect(get('misterio').growth_days).toBeNull();
    expect(fixes.families).toEqual([{ id: 'pimento', from: 'Brassicaceae', to: 'Solanaceae' }]);
    expect(backfillSpecies(sqlite).families).toEqual([]);
  });

  it('leaves family alone when asked to fill only the empty numbers', () => {
    const sqlite = legacyDb();
    const fixes = backfillSpecies(sqlite, { fixFamilies: false });
    expect(fixes.families).toEqual([]);
    expect(sqlite.prepare('select family, growth_days from species where id=?').get('pimento')).toEqual({ family: 'Brassicaceae', growth_days: 45 });
  });
});

describe('roleFromFn', () => {
  it('maps the old free text to the role vocabulary', () => {
    expect(roleFromFn('Cultura principal — fixa azoto')).toBe('principal');
    expect(roleFromFn('Principal')).toBe('principal');
    expect(roleFromFn('Planta companheira aromatica')).toBe('companheira');
    expect(roleFromFn('Atrai auxiliares')).toBe('atrativa');
    expect(roleFromFn('Cobertura de solo')).toBe('cobertura');
    expect(roleFromFn('Bordadura')).toBe('outra');
    expect(roleFromFn(null)).toBe('outra');
  });
});

describe('summaryText', () => {
  it('writes one block per bed', () => {
    const sqlite = legacyDb();
    const text = summaryText(migrateRotationsToCycles(sqlite));
    expect(text).toContain('RB-13: aberto "Outono-Inverno 2026 · Alho + Cebola + Cenoura" (alho x10 principal por semear, cenoura x6 companheira por semear), 2 fechados');
    expect(text).toContain('sem culturas: confirmar: RB-22 Teste · Rabanetes');
    expect(text).toContain('familias corrigidas: pimento Brassicaceae -> Solanaceae');
    expect(text).toContain('especies sem familia ou dias: misterio');
  });
});
