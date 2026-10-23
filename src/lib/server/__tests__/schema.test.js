import { describe, it, expect, vi } from 'vitest';

vi.mock('$env/dynamic/private', () => ({ env: { DATABASE_PATH: ':memory:' } }));
process.env.DATABASE_PATH = ':memory:';

const { getDb } = await import('../db.js');
const schema = await import('../schema.js');

describe('cycles schema', () => {
  const db = getDb();
  db.insert(schema.beds).values({ id: 'RB-11', notionCode: 'RB-11', widthM: 1, heightM: 1 }).run();

  it('allows one open cycle per bed', () => {
    db.insert(schema.cycles).values({ bedId: 'RB-11', title: 'A' }).run();
    expect(() => db.insert(schema.cycles).values({ bedId: 'RB-11', title: 'B' }).run()).toThrow(/UNIQUE/);
    db.insert(schema.cycles).values({ bedId: 'RB-11', title: 'C', closedOn: '2026-01-01' }).run();
    expect(db.select().from(schema.cycles).all()).toHaveLength(2);
  });

  it('stores crops against a cycle and a species', () => {
    db.insert(schema.species).values({ id: 'alface', name: 'Alface' }).run();
    const cycle = db.select().from(schema.cycles).all()[0];
    db.insert(schema.crops).values({ cycleId: cycle.id, speciesId: 'alface', count: 4, role: 'principal', method: 'semeado', inOn: '2026-10-01' }).run();
    expect(db.select().from(schema.crops).all()[0]).toMatchObject({ speciesId: 'alface', count: 4, outOn: null });
  });

  it('has crop_id on action_log', () => {
    expect(Object.keys(schema.actionLog)).toContain('cropId');
  });
});
