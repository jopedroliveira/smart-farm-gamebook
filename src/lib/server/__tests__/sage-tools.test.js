import { describe, it, expect, vi } from 'vitest';

vi.mock('$env/dynamic/private', () => ({ env: { DATABASE_PATH: ':memory:' } }));
process.env.DATABASE_PATH = ':memory:';

const { getDb } = await import('../db.js');
const schema = await import('../schema.js');
const { TOOLS, executeToolCall } = await import('../sage-tools.js');

const db = getDb();
db.insert(schema.beds).values({ id: 'RB-13', notionCode: 'RB-13', widthM: 3.2, heightM: 1.5 }).run();
db.insert(schema.species).values({ id: 'alface', name: 'Alface', family: 'Asteraceae', growthDays: 40 }).run();
db.insert(schema.species).values({ id: 'cenoura', name: 'Cenoura', family: 'Apiaceae', growthDays: 80, sowingWindow: 'Fev-Jul' }).run();
db.insert(schema.species).values({ id: 'cebolo', name: 'Cebolo', family: 'Amaryllidaceae' }).run();
db.insert(schema.companions).values({ speciesId: 'alface', companionId: 'cenoura', type: 'good' }).run();
db.insert(schema.companions).values({ speciesId: 'alface', companionId: 'cebolo', type: 'avoid' }).run();

const run = (name, input) => executeToolCall(db, name, input);

describe('sage tools', () => {
  it('exposes the cycle tools and none of the rotation ones', () => {
    const names = TOOLS.map(t => t.name);
    for (const n of ['abrir_ciclo', 'registar_cultura', 'terminar_cultura', 'fechar_ciclo', 'corrigir_cultura', 'corrigir_ciclo', 'registar_diario', 'definir_proximo_plano',
      'criar_tarefa', 'consultar_historico_acoes', 'consultar_especie', 'registar_especie', 'atualizar_notas_canteiro', 'registar_nota', 'web_search']) {
      expect(names).toContain(n);
    }
    for (const n of ['criar_rotacao', 'eliminar_rotacao', 'atualizar_estado_rotacao', 'atualizar_notas_rotacao', 'adicionar_plantio', 'remover_plantio']) {
      expect(names).not.toContain(n);
    }
  });

  it('opens a cycle, registers crops and refuses the wrong things', () => {
    const opened = run('abrir_ciclo', { bed_id: 'rb-13', title: 'Outono 2026', scheme: 'alface + cenoura' });
    expect(opened.ok).toBe(true);
    expect(opened.cycle_id).toBeGreaterThan(0);
    expect(() => run('abrir_ciclo', { bed_id: 'RB-13', title: 'x' })).toThrow(/ja tem um ciclo aberto/);
    expect(() => run('registar_cultura', { cycle_id: opened.cycle_id, species_id: 'tomilho' })).toThrow(/nao esta no catalogo/);
    const crop = run('registar_cultura', { cycle_id: opened.cycle_id, species_id: 'alface', count: 6, role: 'principal', method: 'semeado', in_on: '2026-10-13' });
    expect(crop).toMatchObject({ ok: true, crop_id: expect.any(Number) });
    expect(crop.message).toContain('Alface');
    expect(() => run('fechar_ciclo', { cycle_id: opened.cycle_id })).toThrow(/ainda tem culturas/);
    const diary = run('registar_diario', { bed_id: 'RB-13', action: 'observacao', text: 'folhas comidas', crop_id: crop.crop_id });
    expect(diary.ok).toBe(true);
    expect(db.select().from(schema.actionLog).all()[0]).toMatchObject({ action: 'observacao', cropId: crop.crop_id });
    expect(run('corrigir_cultura', { crop_id: crop.crop_id, count: 8 }).ok).toBe(true);
    const planned = run('registar_cultura', { cycle_id: opened.cycle_id, species_id: 'cenoura', quando: 'quando a alface sair' });
    expect(planned.message).toContain('a seguir: quando a alface sair');
    expect(run('corrigir_cultura', { crop_id: planned.crop_id, quando: 'nov' }).message).toContain('a seguir: nov');
    expect(run('terminar_cultura', { crop_id: planned.crop_id, outcome: 'retirada' }).ok).toBe(true);
    expect(run('corrigir_ciclo', { cycle_id: opened.cycle_id, scheme: 'so alface' }).message).toContain('so alface');
    expect(db.select().from(schema.cycles).all()[0].scheme).toBe('so alface');
    expect(run('terminar_cultura', { crop_id: crop.crop_id, outcome: 'colhida' }).ok).toBe(true);
    expect(run('fechar_ciclo', { cycle_id: opened.cycle_id }).ok).toBe(true);
    expect(run('definir_proximo_plano', { bed_id: 'RB-13', text: 'Favas' }).ok).toBe(true);
    expect(db.select().from(schema.beds).all()[0].nextRotation).toBe('Favas');
  });

  it('returns companions, antagonists and growth days for a species', () => {
    const r = run('consultar_especie', { search: 'alf' });
    expect(r.especies[0]).toMatchObject({ id: 'alface', dias_ciclo: 40, companheiras: ['Cenoura'], evitar: ['Cebolo'] });
  });

  it('lists the diary with the action', () => {
    const r = run('consultar_historico_acoes', { bed_id: 'RB-13' });
    expect(r.notas[0]).toMatchObject({ canteiro: 'RB-13', acao: 'observacao', nota: 'folhas comidas' });
  });
});
