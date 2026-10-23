import Anthropic from '@anthropic-ai/sdk';
import { env } from '$env/dynamic/private';
import { runSageTurns } from '$lib/server/sage-loop.js';
import { SYSTEM_PROMPT } from '$lib/server/sage-prompt.js';
import { buildFarmContext } from '$lib/server/sage-context.js';
import { TOOLS, executeToolCall } from '$lib/server/sage-tools.js';
import { getDb } from '$lib/server/db.js';
import { getIrrigationState } from '$lib/server/homeassistant.js';

function getClient() {
  // An organization-level key (not scoped to a workspace) is rejected unless
  // the request names the workspace to bill. ANTHROPIC_WORKSPACE_ID is
  // optional: a workspace-scoped key does not need it.
  const defaultHeaders = env.ANTHROPIC_WORKSPACE_ID
    ? { 'anthropic-workspace-id': env.ANTHROPIC_WORKSPACE_ID }
    : undefined;
  return new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, defaultHeaders });
}

function getModel() {
  return env.ANTHROPIC_MODEL || 'claude-opus-5-5';
}

export async function POST({ request, locals }) {
  const { message, history, context } = await request.json();

  if (!message || typeof message !== 'string') {
    return new Response(JSON.stringify({ error: 'Mensagem em falta' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const db = getDb();
  let irrigation = null;
  try {
    irrigation = await getIrrigationState(locals.session?.accessToken);
  } catch (e) {
    console.error('[sage] HA irrigation fetch failed:', e.message);
  }
  const farmCtx = buildFarmContext(db, context, irrigation);
  const contextBlock = `[Estado atual da horta - ${farmCtx.data}]\n${JSON.stringify(farmCtx)}`;

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

  // The length rule sits in the system prompt too, but a reminder next to the
  // question is what actually keeps the answers short.
  const reminder = '[Responde em 4 frases no maximo, sem listas nem markdown, direto ao assunto.]';
  messages.push({ role: 'user', content: `${contextBlock}\n\n${message}\n\n${reminder}` });

  let client;
  try {
    client = getClient();
  } catch (err) {
    console.error('[sage] Client init failed:', err.message);
    return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY nao configurada' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();
  const send = (controller, payload) =>
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));

  const readable = new ReadableStream({
    async start(controller) {
      try {
        await runSageTurns({
          client,
          model: getModel(),
          system: SYSTEM_PROMPT,
          tools: TOOLS,
          messages,
          executeTool: (name, input) => executeToolCall(db, name, input),
          send: (payload) => send(controller, payload),
        });

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (err) {
        console.error('[sage] Stream error:', err.message);
        send(controller, { error: err.message });
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
