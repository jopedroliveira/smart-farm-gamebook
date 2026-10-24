import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

vi.mock('$env/dynamic/private', () => ({ env: { DATABASE_PATH: ':memory:' } }));
process.env.DATABASE_PATH = ':memory:';

const { getDb } = await import('../db.js');
const schema = await import('../schema.js');
const ops = await import('../cycles.js');
const { buildFarmContext } = await import('../sage-context.js');

const db = getDb();
db.insert(schema.beds).values({ id: 'RB-13', notionCode: 'RB-13', widthM: 3.2, heightM: 1.5, notes: 'Canto norte', nextRotation: 'Favas em novembro' }).run();
db.insert(schema.beds).values({ id: 'RB-21', notionCode: 'RB-21', widthM: 3.2, heightM: 1.5 }).run();
db.insert(schema.species).values({ id: 'alface', name: 'Alface', family: 'Asteraceae', growthDays: 40 }).run();
db.insert(schema.species).values({ id: 'couve_kale', name: 'Couve Kale', family: 'Brassicaceae', growthDays: 65 }).run();

beforeAll(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-23T12:00:00')); });
afterAll(() => vi.useRealTimers());

const old = ops.openCycle(db, { bedId: 'RB-13', title: 'Primavera 2026', scheme: 'kale' });
const kale = ops.addCrop(db, { cycleId: old.id, speciesId: 'couve_kale', count: 6, role: 'principal', inOn: '2026-03-01' });
ops.endCrop(db, { cropId: kale.id, outOn: '2026-04-15', outcome: 'falhada', outcomeNote: 'Delia radicum' });
ops.closeCycle(db, { cycleId: old.id, closedOn: '2026-04-15' });
const open = ops.openCycle(db, { bedId: 'RB-13', title: 'Outono 2026', scheme: 'alface + salsa' });
const alface = ops.addCrop(db, { cycleId: open.id, speciesId: 'alface', count: 6, role: 'principal', method: 'semeado', inOn: '2026-10-13' });
ops.logDiary(db, { bedId: 'RB-13', action: 'observacao', text: 'folhas comidas', cropId: alface.id });

describe('buildFarmContext', () => {
  it('describes the open cycle with crop ids, stages and the closed cycles as one line each', () => {
    const ctx = buildFarmContext(db, { beds: [{ id: 'RB-13', horasSemRega: 5, diasSemSachar: 2, rega: 'ok', ervas: 'green' }], compost: 40, weather: 'sunny' }, null);
    expect(ctx.data).toBe('2026-10-23');
    const rb13 = ctx.canteiros.find(b => b.id === 'RB-13');
    expect(rb13.ciclo_aberto).toMatchObject({ id: open.id, titulo: 'Outono 2026', esquema: 'alface + salsa', inicio: '2026-10-13' });
    expect(rb13.ciclo_aberto.culturas).toEqual([
      { id: alface.id, especie: 'alface', familia: 'Asteraceae', papel: 'principal', quantidade: 6, entrada: '2026-10-13', dias: 10, fase: 'crescimento' },
    ]);
    expect(rb13.ciclos_anteriores).toEqual([
      'Primavera 2026 (2026-03-01 a 2026-04-15): couve kale x6 falhada (Delia radicum) | familias: Brassicaceae',
    ]);
    expect(rb13.diario[0]).toMatchObject({ acao: 'observacao', texto: 'folhas comidas', cultura_id: alface.id });
    expect(rb13.proximo_plano).toBe('Favas em novembro');
    expect(rb13.estado).toEqual({ horasSemRega: 5, diasSemSachar: 2, nivelRega: 'ok', nivelErvas: 'green' });
  });

  it('leaves out empty fields so a bare bed is small', () => {
    const ctx = buildFarmContext(db, null, null);
    const rb21 = ctx.canteiros.find(b => b.id === 'RB-21');
    expect(rb21).toEqual({ id: 'RB-21', area_m2: 4.8 });
  });

  it('marks a crop that is not sown yet', () => {
    const planned = ops.addCrop(db, { cycleId: open.id, speciesId: 'couve_kale', count: 2 });
    const ctx = buildFarmContext(db, null, null);
    const c = ctx.canteiros.find(b => b.id === 'RB-13').ciclo_aberto.culturas.find(x => x.id === planned.id);
    expect(c).toMatchObject({ fase: 'planeada', quando: 'sem data' });
    expect(c.dias).toBeUndefined();
  });
});
