import { describe, it, expect, vi } from 'vitest';
import { eq } from 'drizzle-orm';

vi.mock('$env/dynamic/private', () => ({ env: { DATABASE_PATH: ':memory:' } }));
process.env.DATABASE_PATH = ':memory:';

const { getDb } = await import('../db.js');
const schema = await import('../schema.js');
const { findRotation } = await import('../sage-rotations.js');

const db = getDb();
db.insert(schema.beds).values({ id: 'rb13', notionCode: 'RB-13', widthM: 1, heightM: 2 }).run();
const [summer, autumn, old] = [
  { bedId: 'rb13', title: 'Verao', estado: 'Plantado' },
  { bedId: 'rb13', title: 'Outono', estado: 'Planeado' },
  { bedId: 'rb13', title: 'Primavera', estado: 'Terminado' },
].map(r => db.insert(schema.rotations).values(r).returning().get());

describe('findRotation', () => {
  it('refuses to guess between two active rotations and lists them', () => {
    const { rot, error } = findRotation(db, { bed_id: 'rb13' });
    expect(rot).toBeUndefined();
    expect(error.ok).toBe(false);
    expect(error.message).toContain(`${summer.id} = "Verao" (Plantado)`);
    expect(error.message).toContain(`${autumn.id} = "Outono" (Planeado)`);
  });

  it('picks the rotation by id, including a finished one', () => {
    expect(findRotation(db, { bed_id: 'rb13', rotation_id: summer.id }).rot.title).toBe('Verao');
    expect(findRotation(db, { bed_id: 'rb13', rotation_id: String(old.id) }).rot.title).toBe('Primavera');
    expect(findRotation(db, { bed_id: 'rb13', rotation_id: 999 }).error.message).toContain('nao encontrada');
  });

  it('falls back to the single active rotation', () => {
    db.update(schema.rotations).set({ estado: 'Terminado' }).where(eq(schema.rotations.id, summer.id)).run();
    expect(findRotation(db, { bed_id: 'rb13' }).rot.title).toBe('Outono');
  });
});

