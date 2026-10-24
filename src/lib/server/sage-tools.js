// Sage's tool definitions and their execution. Writes go through cycles.js;
// a refusal there throws and the loop returns it to the model as an error.

import * as schema from './schema.js';
import { eq } from 'drizzle-orm';
import {
  openCycle, addCrop, endCrop, closeCycle, fixCrop, fixCycle, logDiary, setNextPlan, resolveBedId,
  ROLES, METHODS, OUTCOMES, DIARY_ACTIONS,
} from './cycles.js';

const BED = { type: 'string', description: 'ID do canteiro (ex: RB-11)' };

export const TOOLS = [
  { type: 'web_search_20260209', name: 'web_search', max_uses: 5 },
  {
    name: 'abrir_ciclo',
    description: 'Abre um ciclo novo num canteiro sem ciclo aberto: o titulo e o esquema de consociacao aceite pelo Pedro. Depois regista cada especie com registar_cultura.',
    input_schema: {
      type: 'object',
      properties: {
        bed_id: BED,
        title: { type: 'string', description: 'Titulo curto (ex: "Outono 2026")' },
        scheme: { type: 'string', description: 'O esquema e o seu proposito (ex: "alho + favas + calendula, leguminosa para repor azoto")' },
      },
      required: ['bed_id', 'title'],
    },
  },
  {
    name: 'registar_cultura',
    description: 'Regista uma especie num ciclo aberto. Uma chamada por especie. Sem in_on fica planeada (a seguir): diz em quando quando entra.',
    input_schema: {
      type: 'object',
      properties: {
        cycle_id: { type: 'integer', description: 'ID do ciclo aberto (ciclo_aberto.id no contexto)' },
        species_id: { type: 'string', description: 'ID da especie no catalogo (ex: alface, feijao_verde)' },
        count: { type: 'integer', description: 'Plantas ou linhas (default 1)' },
        role: { type: 'string', enum: ROLES, description: 'Papel no esquema (default outra)' },
        method: { type: 'string', enum: METHODS, description: 'semeado ou plantado (default plantado)' },
        in_on: { type: 'string', description: 'Data de entrada YYYY-MM-DD. Sem data fica planeada.' },
        quando: { type: 'string', description: 'So para culturas planeadas: quando entra, curto (ex: "nov", "quando a alface sair", "jan, depois da couve")' },
      },
      required: ['cycle_id', 'species_id'],
    },
  },
  {
    name: 'terminar_cultura',
    description: 'Uma cultura sai do canteiro: colhida, falhada ou retirada. Se falhou, poe a causa em outcome_note.',
    input_schema: {
      type: 'object',
      properties: {
        crop_id: { type: 'integer', description: 'ID da cultura (culturas[].id no contexto)' },
        outcome: { type: 'string', enum: OUTCOMES },
        out_on: { type: 'string', description: 'Data de saida YYYY-MM-DD (default hoje)' },
        outcome_note: { type: 'string', description: 'Causa quando falhou, ou nota curta' },
      },
      required: ['crop_id', 'outcome'],
    },
  },
  {
    name: 'fechar_ciclo',
    description: 'Fecha um ciclo cujas culturas ja sairam todas. Recusa enquanto houver culturas na terra.',
    input_schema: {
      type: 'object',
      properties: {
        cycle_id: { type: 'integer' },
        closed_on: { type: 'string', description: 'Data de fecho YYYY-MM-DD (default hoje)' },
      },
      required: ['cycle_id'],
    },
  },
  {
    name: 'corrigir_cultura',
    description: 'Corrige uma cultura registada (especie, quantidade, papel, metodo, datas, desfecho) quando o Pedro diz que o estado esta errado.',
    input_schema: {
      type: 'object',
      properties: {
        crop_id: { type: 'integer' },
        species_id: { type: 'string' },
        count: { type: 'integer' },
        role: { type: 'string', enum: ROLES },
        method: { type: 'string', enum: METHODS },
        in_on: { type: 'string', description: 'YYYY-MM-DD, ou vazio para voltar a planeada' },
        quando: { type: 'string', description: 'Para culturas planeadas: quando entra, curto' },
        out_on: { type: 'string', description: 'YYYY-MM-DD, ou vazio para voltar a por a cultura na terra' },
        outcome: { type: 'string', enum: OUTCOMES },
        outcome_note: { type: 'string' },
      },
      required: ['crop_id'],
    },
  },
  {
    name: 'corrigir_ciclo',
    description: 'Corrige o titulo, o esquema ou as notas de um ciclo (aberto ou fechado) sem mexer nas culturas. Usa quando o texto do ciclo nao bate com o que esta na terra.',
    input_schema: {
      type: 'object',
      properties: {
        cycle_id: { type: 'integer' },
        title: { type: 'string', description: 'Titulo novo (ex: "Outono 2026 · Cebola + Cenoura")' },
        scheme: { type: 'string', description: 'Esquema novo; vazio para apagar' },
        notes: { type: 'string', description: 'Notas do ciclo (pragas, observacoes); vazio para apagar' },
      },
      required: ['cycle_id'],
    },
  },
  {
    name: 'registar_diario',
    description: 'Regista no diario do canteiro uma observacao, uma intervencao, uma emenda ao solo, um sachar ou uma nota.',
    input_schema: {
      type: 'object',
      properties: {
        bed_id: BED,
        action: { type: 'string', enum: DIARY_ACTIONS },
        text: { type: 'string', description: 'O que foi visto ou feito, breve e factual' },
        crop_id: { type: 'integer', description: 'Cultura a que se refere, se for uma em concreto' },
      },
      required: ['bed_id', 'action', 'text'],
    },
  },
  {
    name: 'definir_proximo_plano',
    description: 'Guarda uma linha com o que entra a seguir no canteiro, quando o Pedro aceita uma projecao.',
    input_schema: {
      type: 'object',
      properties: {
        bed_id: BED,
        text: { type: 'string', description: 'Uma linha (ex: "Novembro: favas + alho; brassicas so em 2028")' },
      },
      required: ['bed_id', 'text'],
    },
  },
  {
    name: 'registar_nota',
    description: 'Regista uma nota solta no diario da horta, sem canteiro ou sem tipo. Para observacoes e intervencoes num canteiro usa registar_diario.',
    input_schema: {
      type: 'object',
      properties: {
        bed_id: { type: 'string', description: 'ID do canteiro se relevante. Opcional.' },
        nota: { type: 'string', description: 'O que registar, breve e factual.' },
      },
      required: ['nota'],
    },
  },
  {
    name: 'atualizar_notas_canteiro',
    description: 'Atualiza as notas permanentes de um canteiro (sol, drenagem, substrato). Nao e diario.',
    input_schema: {
      type: 'object',
      properties: {
        bed_id: BED,
        notes: { type: 'string', description: 'Notas gerais do canteiro (substitui as existentes)' },
      },
      required: ['bed_id', 'notes'],
    },
  },
  {
    name: 'consultar_historico_acoes',
    description: 'Consulta o diario da horta. Usa quando o Pedro perguntar o que foi registado.',
    input_schema: {
      type: 'object',
      properties: {
        bed_id: { type: 'string', description: 'Filtrar por canteiro (opcional)' },
        limit: { type: 'integer', description: 'Numero maximo de resultados (default 10)' },
      },
    },
  },
  {
    name: 'criar_tarefa',
    description: 'Cria uma tarefa na lista da horta. Uma tarefa por acao concreta.',
    input_schema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Descricao curta (ex: "Transplantar manjericao para RB-12")' },
        bed_id: { type: 'string', description: 'ID do canteiro se relevante. Opcional.' },
        reason: { type: 'string', description: 'Razao breve. Opcional.' },
      },
      required: ['text'],
    },
  },
  {
    name: 'consultar_especie',
    description: 'Consulta uma especie do catalogo: ciclo, janelas, companheiras e antagonistas. Usa antes de propor uma consociacao.',
    input_schema: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Nome ou parte do nome' },
      },
      required: ['search'],
    },
  },
  {
    name: 'registar_especie',
    description: 'Regista uma especie nova no catalogo. Usa DEPOIS de pesquisar na web com web_search e preenche com os dados encontrados para Coimbra (USDA 9b).',
    input_schema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID em snake_case sem acentos (ex: couve_flor)' },
        name: { type: 'string', description: 'Nome comum em portugues' },
        species_name: { type: 'string', description: 'Nome generico (ex: Couve)' },
        scientific_name: { type: 'string' },
        family: { type: 'string', description: 'Familia botanica (ex: Brassicaceae)' },
        crop_type: { type: 'string', description: 'Folha, Fruto, Raiz, Flor, Aromatica, Leguminosa, Adubo verde' },
        sprite: { type: 'string', enum: ['tomato', 'pepper', 'squash', 'carrot', 'lettuce', 'herb', 'flower', 'bean', 'leek'] },
        color: { type: 'string', description: 'Cor hexadecimal (ex: #c73030)' },
        emoji: { type: 'string' },
        cycle_days: { type: 'integer', description: 'Dias de sementeira a colheita' },
        germination_days: { type: 'integer' },
        sun: { type: 'string', description: 'JSON array (ex: ["Pleno sol"])' },
        water: { type: 'string', description: 'Baixa, Media, Alta' },
        spacing: { type: 'string', description: 'ex: 30x30cm' },
        sowing_window: { type: 'string', description: 'ex: Fev-Abr' },
        harvest_window: { type: 'string', description: 'ex: Jun-Set' },
        seasons: { type: 'string', description: 'JSON array (ex: ["Primavera"])' },
        soil_effect: { type: 'string', description: 'Fixador de azoto, Consumidor pesado, Neutro' },
        garden_role: { type: 'string', description: 'Principal, Companheira, Bordadura, Adubo verde' },
        notes: { type: 'string', description: 'Notas agronomicas breves' },
        companions: { type: 'array', items: { type: 'string' }, description: 'IDs de especies companheiras ja no catalogo' },
        avoid: { type: 'array', items: { type: 'string' }, description: 'IDs de especies a evitar ja no catalogo' },
      },
      required: ['id', 'name', 'scientific_name', 'family', 'crop_type', 'sprite', 'color', 'emoji', 'cycle_days', 'sowing_window', 'harvest_window'],
    },
  },
];

function speciesName(db, id) {
  return db.select().from(schema.species).where(eq(schema.species.id, id)).get()?.name || id;
}

export function executeToolCall(db, name, input) {
  switch (name) {
    case 'abrir_ciclo': {
      const cycle = openCycle(db, { bedId: input.bed_id, title: input.title, scheme: input.scheme || null });
      return { ok: true, cycle_id: cycle.id, message: `Ciclo "${cycle.title}" aberto em ${cycle.bedId} (id ${cycle.id}). Regista agora as culturas.` };
    }
    case 'registar_cultura': {
      const crop = addCrop(db, {
        cycleId: input.cycle_id, speciesId: input.species_id, count: input.count ?? 1,
        role: input.role || 'outra', method: input.method || 'plantado', inOn: input.in_on || null, planWhen: input.quando || null,
      });
      return { ok: true, crop_id: crop.id, message: `${speciesName(db, crop.speciesId)} x${crop.count} ${crop.role} registada (id ${crop.id})${crop.inOn ? ` com entrada em ${crop.inOn}` : `, a seguir: ${crop.planWhen || 'sem data'}`}` };
    }
    case 'terminar_cultura': {
      const crop = endCrop(db, { cropId: input.crop_id, outOn: input.out_on || undefined, outcome: input.outcome, outcomeNote: input.outcome_note || null });
      const left = db.select().from(schema.crops).where(eq(schema.crops.cycleId, crop.cycleId)).all().filter(c => !c.outOn).length;
      return { ok: true, message: `${speciesName(db, crop.speciesId)} saiu em ${crop.outOn} (${crop.outcome}). ${left ? `Ficam ${left} culturas na terra.` : `O ciclo ${crop.cycleId} ficou vazio: podes fecha-lo.`}` };
    }
    case 'fechar_ciclo': {
      const cycle = closeCycle(db, { cycleId: input.cycle_id, closedOn: input.closed_on || undefined });
      return { ok: true, message: `Ciclo "${cycle.title}" de ${cycle.bedId} fechado em ${cycle.closedOn}` };
    }
    case 'corrigir_cultura': {
      const fields = {};
      if (input.species_id !== undefined) fields.speciesId = input.species_id;
      if (input.count !== undefined) fields.count = input.count;
      if (input.role !== undefined) fields.role = input.role;
      if (input.method !== undefined) fields.method = input.method;
      if (input.in_on !== undefined) fields.inOn = input.in_on || null;
      if (input.out_on !== undefined) fields.outOn = input.out_on || null;
      if (input.outcome !== undefined) fields.outcome = input.outcome || null;
      if (input.outcome_note !== undefined) fields.outcomeNote = input.outcome_note || null;
      if (input.quando !== undefined) fields.planWhen = input.quando || null;
      const crop = fixCrop(db, { cropId: input.crop_id, ...fields });
      return { ok: true, message: `Cultura ${crop.id} corrigida: ${speciesName(db, crop.speciesId)} x${crop.count} ${crop.role}, ${crop.inOn ? `entrada ${crop.inOn}` : `a seguir: ${crop.planWhen || 'sem data'}`}${crop.outOn ? `, saida ${crop.outOn} (${crop.outcome})` : ''}` };
    }
    case 'corrigir_ciclo': {
      const fields = {};
      if (input.title !== undefined) fields.title = input.title;
      if (input.scheme !== undefined) fields.scheme = input.scheme || null;
      if (input.notes !== undefined) fields.notes = input.notes || null;
      const cycle = fixCycle(db, { cycleId: input.cycle_id, ...fields });
      return { ok: true, message: `Ciclo ${cycle.id} corrigido: "${cycle.title}"${cycle.scheme ? ` · ${cycle.scheme}` : ''}` };
    }
    case 'registar_diario': {
      const row = logDiary(db, { bedId: input.bed_id, action: input.action, text: input.text, cropId: input.crop_id ?? null });
      return { ok: true, message: `Registado no diario de ${row.bedId} (${row.action})` };
    }
    case 'definir_proximo_plano': {
      const bed = setNextPlan(db, { bedId: input.bed_id, text: input.text });
      return { ok: true, message: `Proximo plano de ${bed.id} guardado` };
    }
    case 'registar_nota': {
      const bedId = resolveBedId(db, input.bed_id);
      db.insert(schema.actionLog).values({ bedId, action: 'nota', details: input.nota }).run();
      return { ok: true, message: `Anotado${bedId ? ` (${bedId})` : ''}` };
    }
    case 'atualizar_notas_canteiro': {
      const bedId = resolveBedId(db, input.bed_id);
      db.update(schema.beds).set({ notes: input.notes, updatedAt: new Date().toISOString() }).where(eq(schema.beds.id, bedId)).run();
      return { ok: true, message: `Notas de ${bedId} atualizadas` };
    }
    case 'consultar_historico_acoes': {
      let rows = db.select().from(schema.actionLog).all();
      if (input.bed_id) rows = rows.filter(r => r.bedId === input.bed_id);
      rows = rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id).slice(0, input.limit || 10);
      if (!rows.length) return { ok: true, notas: [], message: 'Sem notas registadas' };
      return { ok: true, notas: rows.map(r => ({ data: r.createdAt, canteiro: r.bedId, acao: r.action, nota: r.details, cultura_id: r.cropId })) };
    }
    case 'criar_tarefa': {
      const bedId = resolveBedId(db, input.bed_id);
      db.insert(schema.tasks).values({ text: input.text, bedId, reason: input.reason || null, source: 'sage' }).run();
      return { ok: true, message: `Tarefa criada: "${input.text}"` };
    }
    case 'consultar_especie': {
      const search = input.search.toLowerCase();
      const all = db.select().from(schema.species).all();
      const nameOf = Object.fromEntries(all.map(s => [s.id, s.name]));
      const links = db.select().from(schema.companions).all();
      const matches = all.filter(s =>
        s.name?.toLowerCase().includes(search) || s.speciesName?.toLowerCase().includes(search) || s.id?.toLowerCase().includes(search)
      ).slice(0, 5);
      if (!matches.length) return { ok: true, especies: [], message: `Nenhuma especie encontrada para "${input.search}"` };
      return {
        ok: true,
        especies: matches.map(s => ({
          id: s.id, nome: s.name, especie: s.speciesName, familia: s.family,
          dias_ciclo: s.growthDays, germinacao_dias: s.germDays,
          sementeira: s.sowingWindow || (s.sowFrom ? `${s.sowFrom}-${s.sowTo || ''}` : null), colheita: s.harvestWindow,
          rega: s.water, espacamento: s.spacing, sol: s.sun, efeito_solo: s.soilEffect, funcao: s.gardenRole, notas: s.notes,
          companheiras: links.filter(l => l.speciesId === s.id && l.type === 'good').map(l => nameOf[l.companionId] || l.companionId),
          evitar: links.filter(l => l.speciesId === s.id && l.type === 'avoid').map(l => nameOf[l.companionId] || l.companionId),
        })),
      };
    }
    case 'registar_especie': {
      const existing = db.select().from(schema.species).where(eq(schema.species.id, input.id)).get();
      if (existing) return { ok: false, message: `Especie "${input.id}" ja existe no catalogo (${existing.name})` };
      const window = /^([A-Za-z]{3})-([A-Za-z]{3})/.exec(input.sowing_window || '');
      db.insert(schema.species).values({
        id: input.id, name: input.name, speciesName: input.species_name || null, scientificName: input.scientific_name || null,
        family: input.family || null, cropType: input.crop_type || null,
        sprite: input.sprite || 'herb', color: input.color || '#5a8d3a', emoji: input.emoji || '🌱',
        cycleDays: input.cycle_days || null, germinationDays: input.germination_days || null,
        growthDays: input.cycle_days || null, germDays: input.germination_days || null,
        sowFrom: window ? window[1] : null, sowTo: window ? window[2] : null,
        sun: input.sun || null, water: input.water || null, spacing: input.spacing || null,
        sowingWindow: input.sowing_window || null, harvestWindow: input.harvest_window || null, seasons: input.seasons || null,
        soilEffect: input.soil_effect || null, gardenRole: input.garden_role || null, notes: input.notes || null,
      }).run();
      const ids = new Set(db.select({ id: schema.species.id }).from(schema.species).all().map(s => s.id));
      for (const [list, type] of [[input.companions, 'good'], [input.avoid, 'avoid']]) {
        for (const other of list || []) {
          if (ids.has(other)) db.insert(schema.companions).values({ speciesId: input.id, companionId: other, type }).onConflictDoNothing().run();
        }
      }
      return { ok: true, message: `Especie "${input.name}" registada (${input.family}, ${input.cycle_days}d, ${input.sowing_window})` };
    }
    default:
      return { ok: false, message: `Tool desconhecida: ${name}` };
  }
}
