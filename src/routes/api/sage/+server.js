import Anthropic from '@anthropic-ai/sdk';
import { env } from '$env/dynamic/private';
import { getDb } from '$lib/server/db.js';
import * as schema from '$lib/server/schema.js';
import { eq } from 'drizzle-orm';
import { getIrrigationState } from '$lib/server/homeassistant.js';

function getClient() {
  return new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
}

const SYSTEM_PROMPT = `Tu es o Sage, conselheiro de uma horta em Coimbra, Portugal (zona USDA 9b, clima mediterranico Csb). Combinas sabedoria tradicional portuguesa de horta com metodos organicos modernos. Falas em portugues de Portugal (PT-PT), com o tom de um agricultor experiente: direto, pratico, conciso.

Personalidade:
- Linguagem simples e direta, como quem fala no campo
- Usas terminologia horticola portuguesa naturalmente (desbaste, consociacao, sementeira, transplantacao, bordadura)
- Pratico: conselhos acionaveis, nao discursos
- Quando algo esta mal, dizes sem rodeios mas com carinho
- Respostas curtas (2-4 frases), a menos que o agricultor peca mais detalhe
- Bullet points so quando ha varias perguntas ou itens a listar

Principios que segues sempre:
- Biologico primeiro, pragmatico sempre. Metodos organicos e biologicos por defeito (consociacao, barreiras fisicas, agentes biologicos, remocao manual). Se insuficientes, intervencao quimica localizada e de baixo impacto e aceitavel (ex: fosfato ferrico para lesmas). Apresenta a opcao biologica primeiro, explica trade-offs, deixa o Pedro decidir.
- Especializar canteiros, nao sobrelotar. Cada canteiro com plano focado, distribuir variedade pelo sistema.
- Rotacao por familia botanica (Solanaceae, Brassicaceae, Fabaceae, Cucurbitaceae, etc.).
- Consociacao e estrutural: aromaticas, aliaceas e flores funcionais (calendula, tagetes) sao gestao integrada de pragas, nao decoracao.
- Fechar o ciclo de nutrientes: compostor Geolia 480L, borras de cafe (compostar primeiro, nunca camadas grossas), vermicompostagem com Eisenia fetida. Favorecer emendas caseiras.
- Rega: uma sessao longa de manha, nunca regas curtas frequentes (prevencao de doencas + evaporacao). Rega profunda > ciclos rasos.

A horta do Pedro:
- 6 canteiros elevados em pinho tratado com cobre, grelha 2x3 com caminhos de gravilha de 60cm
- Norte: RB-11, RB-12, RB-13. Sul: RB-21, RB-22, RB-23
- Canteiros de canto (~5m2): RB-11, RB-13, RB-21, RB-23. Centrais (~2.5m2): RB-12, RB-22
- Substrato: base organica profunda (serradura/casca decomposta, estrume de cavalo, composto). Excesso de azoto documentado, especialmente RB-21
- Rega gota-a-gota automatizada via Home Assistant com integracao met.no
- Compostor Geolia 480L em base de madeira elevada

Problemas conhecidos e historico:
- RB-21: excesso persistente de azoto (estrume/composto). Consequencias: enrolamento foliar fisiologico, podridao apical, atracao de afideos. Mitigacao: sem inputs de N adicionais, mulch rico em carbono, fertilizante potassico (Compo Bio Tomates a meia dose)
- RB-21: Ceratitis capitata (mosca-da-fruta) confirmada nos tomates. Armadilhas cromaticas amarelas + armadilhas garrafa (vinagre de sidra + detergente)
- RB-13 e RB-22: Brassicas banidas ate 2027 (historico Delia radicum)
- RB-11 e RB-12: Solanaceae bloqueadas para 2027 (rotacao)
- Infestacao de forficulas (Forficula auricularia) ligada ao substrato de serradura/casca
- Oidio: leite diluido (1:10) como tratamento preferido no verao (enxofre impossivel acima de 28C)
- Borras de cafe: libertam azoto na mineralizacao, contraproducentes para RB-21

Consciencia sazonal (Coimbra):
- Jan-Fev: planear canteiros, sementeiras de estacao fria, manter composto
- Mar-Abr: plantio direto estacao fria, preparar canteiros quentes, sementeiras de tomate/pimento em abrigo
- Mai-Jun: transplantar solanaceas e cucurbitaceas, semear feijao, sucessoes de verao
- Jul-Ago: pico de colheita, gestao de agua, vigilancia pragas, planear outono
- Set-Out: plantio outonal (brassicas, folhosas, aliaceas, raizes), incorporar composto
- Nov-Dez: culturas de inverno, manutencao, compostagem, planear rotacao seguinte

Tens ferramentas para registar e atualizar informacao na base de dados da horta. Regras sobre quando usar:
- SO usas as ferramentas quando o Pedro pedir EXPLICITAMENTE ("regista", "anota", "guarda", "sim", "ya", "pode ser") ou confirmar uma sugestao tua.
- Nunca registes automaticamente. Conversas exploratórias sao so conversa.
- MAS: quando o Pedro mencionar algo que valha a pena guardar (um problema novo, uma decisao, uma observacao relevante, um plano concreto), PERGUNTA se quer que anotes. Exemplos naturais: "Queres que anote isso?", "Registo?", "Anoto no diario?". Curto e natural, nao formal.
- Nao perguntes em todas as mensagens, so quando ha informacao concreta que faca sentido persistir. Perguntas genericas ou exploratórias nao justificam.
- Quando registas, confirma brevemente ("Anotado.", "Registei.").

Formato:
- Nunca uses markdown formatado (sem ** ou ## ou listas com -)
- Fala como numa conversa entre agricultores
- Quando o Pedro faz varias perguntas, responde com bullet points simples
- Usa "tu" (informal)`;

const TOOLS = [
  {
    name: 'registar_nota',
    description: 'Regista uma nota ou observacao no diario da horta. So usar quando o Pedro pedir explicitamente para registar/anotar/guardar algo.',
    input_schema: {
      type: 'object',
      properties: {
        bed_id: { type: 'string', description: 'ID do canteiro se relevante (ex: RB-11). Opcional.' },
        nota: { type: 'string', description: 'O que registar, nas palavras do Sage. Breve e factual.' },
      },
      required: ['nota'],
    },
  },
  {
    name: 'atualizar_notas_rotacao',
    description: 'Atualiza as notas ou notas de pragas de uma rotacao ativa. Usa para registar problemas, tratamentos, ou observacoes sobre uma rotacao especifica.',
    input_schema: {
      type: 'object',
      properties: {
        bed_id: { type: 'string', description: 'ID do canteiro (ex: RB-11)' },
        pest_notes: { type: 'string', description: 'Notas sobre pragas/doencas (substitui as existentes)' },
        notes: { type: 'string', description: 'Notas gerais da rotacao (substitui as existentes)' },
      },
      required: ['bed_id'],
    },
  },
  {
    name: 'atualizar_estado_rotacao',
    description: 'Muda o estado de uma rotacao ativa (Planeado, Plantado, A colher, Terminado, Em repouso, Falhado).',
    input_schema: {
      type: 'object',
      properties: {
        bed_id: { type: 'string', description: 'ID do canteiro (ex: RB-13)' },
        estado: { type: 'string', enum: ['Planeado', 'Plantado', 'A colher', 'Terminado', 'Em repouso'], description: 'Novo estado' },
        failed: { type: 'boolean', description: 'Marcar rotacao como falhada' },
      },
      required: ['bed_id', 'estado'],
    },
  },
  {
    name: 'atualizar_notas_canteiro',
    description: 'Atualiza as notas gerais ou a proxima rotacao planeada de um canteiro.',
    input_schema: {
      type: 'object',
      properties: {
        bed_id: { type: 'string', description: 'ID do canteiro (ex: RB-22)' },
        notes: { type: 'string', description: 'Notas gerais do canteiro' },
        next_rotation: { type: 'string', description: 'Descricao da proxima rotacao planeada' },
      },
      required: ['bed_id'],
    },
  },
  {
    name: 'consultar_historico_acoes',
    description: 'Consulta o diario/historico de notas registadas na horta. Usa quando o Pedro perguntar o que foi registado ou anotado.',
    input_schema: {
      type: 'object',
      properties: {
        bed_id: { type: 'string', description: 'Filtrar por canteiro (opcional)' },
        limit: { type: 'integer', description: 'Numero maximo de resultados (default 10)' },
      },
    },
  },
  {
    name: 'consultar_especie',
    description: 'Consulta informacao detalhada sobre uma especie/cultura do catalogo. Usa quando o Pedro perguntar sobre uma planta especifica.',
    input_schema: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Nome ou parte do nome da especie a procurar' },
      },
      required: ['search'],
    },
  },
];

function executeToolCall(name, input) {
  const db = getDb();

  switch (name) {
    case 'registar_nota': {
      db.insert(schema.actionLog).values({
        bedId: input.bed_id || null,
        action: 'nota',
        details: input.nota,
      }).run();
      return { ok: true, message: `Anotado${input.bed_id ? ` (${input.bed_id})` : ''}` };
    }

    case 'atualizar_notas_rotacao': {
      const rot = db.select().from(schema.rotations)
        .where(eq(schema.rotations.bedId, input.bed_id))
        .all()
        .filter(r => r.estado !== 'Terminado' && r.estado !== 'Em repouso')
        .pop();

      if (!rot) return { ok: false, message: `Nenhuma rotacao ativa encontrada para ${input.bed_id}` };

      const updates = {};
      if (input.pest_notes !== undefined) updates.pestNotes = input.pest_notes;
      if (input.notes !== undefined) updates.notes = input.notes;
      updates.updatedAt = new Date().toISOString();

      db.update(schema.rotations).set(updates).where(eq(schema.rotations.id, rot.id)).run();
      return { ok: true, message: `Rotacao "${rot.title}" atualizada` };
    }

    case 'atualizar_estado_rotacao': {
      const rot = db.select().from(schema.rotations)
        .where(eq(schema.rotations.bedId, input.bed_id))
        .all()
        .filter(r => r.estado !== 'Terminado' && r.estado !== 'Em repouso')
        .pop();

      if (!rot) return { ok: false, message: `Nenhuma rotacao ativa encontrada para ${input.bed_id}` };

      const updates = { estado: input.estado, updatedAt: new Date().toISOString() };
      if (input.failed) updates.failed = 1;
      if (input.estado === 'Terminado' && !rot.harvestEnd) updates.harvestEnd = new Date().toISOString().split('T')[0];

      db.update(schema.rotations).set(updates).where(eq(schema.rotations.id, rot.id)).run();
      return { ok: true, message: `${input.bed_id}: estado mudado para "${input.estado}"` };
    }

    case 'atualizar_notas_canteiro': {
      const updates = { updatedAt: new Date().toISOString() };
      if (input.notes !== undefined) updates.notes = input.notes;
      if (input.next_rotation !== undefined) updates.nextRotation = input.next_rotation;

      db.update(schema.beds).set(updates).where(eq(schema.beds.id, input.bed_id)).run();
      return { ok: true, message: `Canteiro ${input.bed_id} atualizado` };
    }

    case 'consultar_historico_acoes': {
      let rows = db.select().from(schema.actionLog).all();
      if (input.bed_id) rows = rows.filter(r => r.bedId === input.bed_id);

      rows = rows
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, input.limit || 10);

      if (!rows.length) return { ok: true, notas: [], message: 'Sem notas registadas' };
      return {
        ok: true,
        notas: rows.map(r => ({
          data: r.createdAt,
          canteiro: r.bedId,
          nota: r.details,
        })),
      };
    }

    case 'consultar_especie': {
      const search = input.search.toLowerCase();
      const all = db.select().from(schema.species).all();
      const matches = all.filter(s =>
        s.name?.toLowerCase().includes(search) ||
        s.speciesName?.toLowerCase().includes(search) ||
        s.id?.toLowerCase().includes(search)
      ).slice(0, 5);

      if (!matches.length) return { ok: true, especies: [], message: `Nenhuma especie encontrada para "${input.search}"` };
      return {
        ok: true,
        especies: matches.map(s => ({
          id: s.id,
          nome: s.name,
          especie: s.speciesName,
          familia: s.family,
          ciclo_dias: s.cycleDays,
          sementeira: s.sowingWindow,
          colheita: s.harvestWindow,
          rega: s.water,
          espacamento: s.spacing,
          sol: s.sun,
          efeito_solo: s.soilEffect,
          funcao: s.gardenRole,
          notas: s.notes,
        })),
      };
    }

    default:
      return { ok: false, message: `Tool desconhecida: ${name}` };
  }
}

async function buildFarmContext(dashboardCtx, accessToken) {
  const db = getDb();

  const beds = db.select().from(schema.beds).all();
  const rotations = db.select().from(schema.rotations).all();
  const plantings = db.select().from(schema.plantings).all();

  const recentActions = db.select().from(schema.actionLog).all()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  const irrigation = await getIrrigationState(accessToken);

  const bedSummaries = beds.map(bed => {
    const bedRotations = rotations
      .filter(r => r.bedId === bed.id)
      .map(rot => {
        const crops = plantings
          .filter(p => p.rotationId === rot.id)
          .map(p => p.speciesId.replace(/_/g, ' '));

        return {
          titulo: rot.title,
          estado: rot.estado,
          estacao: rot.season,
          rotacao: rot.rotation,
          falhado: !!rot.failed,
          plantado: rot.plantedDate,
          colheita: rot.harvestStart,
          culturas: crops,
          pragas: rot.pestNotes || null,
          notas: rot.notes || null,
        };
      });

    const dashboard = dashboardCtx?.beds?.find(b => b.id === bed.id || b.id === bed.notionCode);
    const rega = irrigation?.[bed.notionCode] || null;

    return {
      id: bed.notionCode,
      area_m2: +(bed.widthM * bed.heightM).toFixed(1),
      proximaRotacao: bed.nextRotation || null,
      notas: bed.notes || null,
      rega: rega,
      sensores: dashboard ? {
        agua: dashboard.water + '%',
        solo: dashboard.soil + '%',
        ervas: dashboard.weeds + '%',
        pragas: dashboard.pests + '%',
      } : null,
      rotacoes: bedRotations,
    };
  });

  return {
    data: new Date().toISOString().split('T')[0],
    compostor: dashboardCtx?.compost ? dashboardCtx.compost + '%' : null,
    clima: dashboardCtx?.weather || null,
    canteiros: bedSummaries,
    acoes_recentes: recentActions.map(a => ({
      data: a.createdAt,
      canteiro: a.bedId,
      acao: a.action,
      detalhes: a.details,
    })),
  };
}

export async function POST({ request, locals }) {
  const { message, history, context } = await request.json();

  if (!message || typeof message !== 'string') {
    return new Response(JSON.stringify({ error: 'Mensagem em falta' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const accessToken = locals.session?.accessToken;
  const farmCtx = await buildFarmContext(context, accessToken);
  const contextBlock = `[Estado atual da horta - ${farmCtx.data}]\n${JSON.stringify(farmCtx, null, 2)}`;

  const messages = [];

  if (Array.isArray(history)) {
    for (const h of history) {
      if (h.from === 'user') {
        messages.push({ role: 'user', content: h.text });
      } else if (h.from === 'sage') {
        messages.push({ role: 'assistant', content: h.text });
      }
    }
  }

  messages.push({ role: 'user', content: `${contextBlock}\n\n${message}` });

  const client = getClient();
  const toolResults = [];

  // Tool use loop: execute tools until Claude is ready to respond
  let maxIterations = 5;
  while (maxIterations-- > 0) {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages,
    });

    const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');

    if (toolUseBlocks.length === 0) break;

    messages.push({ role: 'assistant', content: response.content });

    const toolResultContent = [];
    for (const block of toolUseBlocks) {
      const result = executeToolCall(block.name, block.input);
      toolResults.push({ tool: block.name, input: block.input, result });
      toolResultContent.push({
        type: 'tool_result',
        tool_use_id: block.id,
        content: JSON.stringify(result),
      });
    }

    messages.push({ role: 'user', content: toolResultContent });
  }

  // Stream the final text response
  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 800,
    system: SYSTEM_PROMPT,
    tools: TOOLS,
    messages,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        if (toolResults.length > 0) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ tools: toolResults })}\n\n`));
        }
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`));
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (err) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err.message })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
