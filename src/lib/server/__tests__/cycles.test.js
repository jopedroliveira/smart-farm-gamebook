import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

vi.mock('$env/dynamic/private', () => ({ env: { DATABASE_PATH: ':memory:' } }));
process.env.DATABASE_PATH = ':memory:';

const { getDb } = await import('../db.js');
const schema = await import('../schema.js');
const ops = await import('../cycles.js');

const db = getDb();
db.insert(schema.beds).values({ id: 'RB-13', notionCode: 'RB-13', widthM: 3.2, heightM: 1.5 }).run();
db.insert(schema.beds).values({ id: 'RB-21', notionCode: 'RB-21', widthM: 3.2, heightM: 1.5 }).run();
db.insert(schema.species).values({ id: 'alface', name: 'Alface', family: 'Asteraceae', sprite: 'lettuce', color: '#4fa83a', growthDays: 40 }).run();
db.insert(schema.species).values({ id: 'salsa', name: 'Salsa', family: 'Apiaceae', sprite: 'herb', color: '#3d8b3d', growthDays: 75 }).run();

beforeAll(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-23T12:00:00')); });
afterAll(() => vi.useRealTimers());

describe('cycle operations', () => {
  let cycle, alface, salsa;

  it('opens a cycle and refuses a second open one on the same bed', () => {
    cycle = ops.openCycle(db, { bedId: 'RB-13', title: 'Outono 2026', scheme: 'alface + salsa' });
    expect(cycle).toMatchObject({ bedId: 'RB-13', title: 'Outono 2026', closedOn: null, startedOn: null });
    expect(() => ops.openCycle(db, { bedId: 'RB-13', title: 'Outro' }))
      .toThrow(`RB-13 ja tem um ciclo aberto (id ${cycle.id}, "Outono 2026"). Fecha-o primeiro ou regista a cultura nele.`);
    expect(() => ops.openCycle(db, { bedId: 'rb-99', title: 'x' })).toThrow(/nao existe/);
  });

  it('adds crops, validating species, role and method, and starts the cycle on the first sowing', () => {
    expect(() => ops.addCrop(db, { cycleId: cycle.id, speciesId: 'tomilho' }))
      .toThrow('Especie "tomilho" nao esta no catalogo. Consulta ou regista a especie primeiro.');
    expect(() => ops.addCrop(db, { cycleId: cycle.id, speciesId: 'alface', role: 'chefe' })).toThrow(/papel/);
    expect(() => ops.addCrop(db, { cycleId: cycle.id, speciesId: 'alface', method: 'atirado' })).toThrow(/metodo/);
    alface = ops.addCrop(db, { cycleId: cycle.id, speciesId: 'alface', count: 6, role: 'principal', method: 'semeado', inOn: '2026-10-10' });
    expect(alface).toMatchObject({ speciesId: 'alface', count: 6, role: 'principal', method: 'semeado', inOn: '2026-10-10', outOn: null });
    expect(db.select().from(schema.cycles).all()[0].startedOn).toBe('2026-10-10');
    salsa = ops.addCrop(db, { cycleId: cycle.id, speciesId: 'salsa' });
    expect(salsa).toMatchObject({ count: 1, role: 'outra', method: 'plantado', inOn: null });
  });

  it('refuses to close a cycle while crops are in, listing them', () => {
    expect(() => ops.closeCycle(db, { cycleId: cycle.id }))
      .toThrow(`O ciclo ainda tem culturas na terra: alface (id ${alface.id}), salsa (id ${salsa.id}). Termina-as primeiro.`);
  });

  it('ends a crop without closing the cycle', () => {
    expect(() => ops.endCrop(db, { cropId: alface.id, outcome: 'perdida' })).toThrow(/desfecho/);
    const out = ops.endCrop(db, { cropId: alface.id, outcome: 'colhida' });
    expect(out).toMatchObject({ outOn: '2026-10-23', outcome: 'colhida', outcomeNote: null });
    expect(() => ops.endCrop(db, { cropId: alface.id, outcome: 'colhida' })).toThrow(/ja saiu/);
    expect(db.select().from(schema.cycles).all()[0].closedOn).toBeNull();
    ops.endCrop(db, { cropId: salsa.id, outOn: '2026-10-22', outcome: 'falhada', outcomeNote: 'lesmas' });
  });

  it('closes the cycle once empty', () => {
    const closed = ops.closeCycle(db, { cycleId: cycle.id });
    expect(closed.closedOn).toBe('2026-10-23');
    expect(() => ops.addCrop(db, { cycleId: cycle.id, speciesId: 'alface' })).toThrow(/fechado/);
    expect(ops.openCycle(db, { bedId: 'RB-13', title: 'Inverno 2026' }).title).toBe('Inverno 2026');
  });

  it('fixes a crop row', () => {
    const fixed = ops.fixCrop(db, { cropId: alface.id, speciesId: 'salsa', count: 3, inOn: null, outOn: null, outcome: null });
    expect(fixed).toMatchObject({ speciesId: 'salsa', count: 3, inOn: null, outOn: null, outcome: null });
    expect(() => ops.fixCrop(db, { cropId: 999, count: 1 })).toThrow(/nao encontrada/);
    expect(() => ops.fixCrop(db, { cropId: alface.id, speciesId: 'nada' })).toThrow(/catalogo/);
  });

  it('writes the diary with a vocabulary and an optional crop', () => {
    expect(() => ops.logDiary(db, { bedId: 'RB-13', action: 'rega', text: 'x' })).toThrow(/acao/);
    const row = ops.logDiary(db, { bedId: 'RB-13', action: 'observacao', text: 'folhas comidas', cropId: alface.id });
    expect(row).toMatchObject({ bedId: 'RB-13', action: 'observacao', details: 'folhas comidas', cropId: alface.id });
    expect(() => ops.logDiary(db, { bedId: 'RB-21', action: 'nota', text: 'x', cropId: alface.id })).toThrow(/nao pertence/);
  });

  it('sets the next plan', () => {
    expect(ops.setNextPlan(db, { bedId: 'RB-13', text: 'Favas em novembro' }).nextRotation).toBe('Favas em novembro');
  });

  it('reads the bed timeline with species on every crop and the diary newest first', () => {
    const open = db.select().from(schema.cycles).all().find(c => !c.closedOn);
    ops.addCrop(db, { cycleId: open.id, speciesId: 'alface', count: 2, inOn: '2026-10-20' });
    ops.logDiary(db, { bedId: 'RB-13', action: 'nota', text: 'segunda' });
    const t = ops.bedTimeline(db, 'RB-13');
    expect(t.open.id).toBe(open.id);
    expect(t.open.crops[0].species).toEqual({ id: 'alface', name: 'Alface', family: 'Asteraceae', sprite: 'lettuce', color: '#4fa83a', growthDays: 40 });
    expect(t.closed).toHaveLength(1);
    expect(t.closed[0].crops.map(c => c.outcome)).toEqual([null, 'falhada']);
    expect(t.diary.map(d => d.details)).toEqual(['segunda', 'folhas comidas']);
    expect(ops.bedTimeline(db, 'RB-21')).toEqual({ open: null, closed: [], diary: [] });
  });

  it('builds the bed payload with the open cycle first', () => {
    const bed = db.select().from(schema.beds).all().find(b => b.id === 'RB-13');
    const p = ops.bedPayload(db, bed);
    expect(p).toMatchObject({ id: 'RB-13', notionCode: 'RB-13', nextRotation: 'Favas em novembro' });
    expect(p.cycles.map(c => c.closedOn === null)).toEqual([true, false]);
    expect(p.diary).toHaveLength(2);
  });
});
