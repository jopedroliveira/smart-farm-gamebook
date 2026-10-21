import { describe, it, expect } from 'vitest';
import Anthropic from '@anthropic-ai/sdk';
import { runSageTurns } from '../sage-loop.js';

// Runs the loop through the real Anthropic SDK with a fake fetch, so the
// request shape and the stream parsing are the SDK's, not a hand-made mock.
function sse(events) {
  const body = events.map(e => `event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`).join('');
  return new Response(body, { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
}

const usage = { input_tokens: 10, output_tokens: 5 };
const start = { type: 'message_start', message: { id: 'msg_1', type: 'message', role: 'assistant', model: 'm', content: [], stop_reason: null, stop_sequence: null, usage } };
const stop = (reason) => [
  { type: 'message_delta', delta: { stop_reason: reason, stop_sequence: null }, usage },
  { type: 'message_stop' },
];

// A turn that calls registar_nota and stops for the result.
const toolTurn = () => sse([
  start,
  { type: 'content_block_start', index: 0, content_block: { type: 'tool_use', id: 'toolu_1', name: 'registar_nota', input: {} } },
  { type: 'content_block_delta', index: 0, delta: { type: 'input_json_delta', partial_json: '{"nota":"teste"}' } },
  { type: 'content_block_stop', index: 0 },
  ...stop('tool_use'),
]);

// A turn that answers in text.
const textTurn = () => sse([
  start,
  { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
  { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'Anot' } },
  { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: 'ado.' } },
  { type: 'content_block_stop', index: 0 },
  ...stop('end_turn'),
]);

function fakeClient(replies) {
  const requests = [];
  const client = new Anthropic({
    apiKey: 'test',
    maxRetries: 0,
    fetch: async (url, init) => {
      requests.push({ url: String(url), body: JSON.parse(init.body) });
      return replies.shift()();
    },
  });
  return { client, requests };
}

describe('runSageTurns', () => {
  it('runs a tool call, feeds the result back and streams the answer', async () => {
    const { client, requests } = fakeClient([toolTurn, textTurn]);

    const sent = [];
    const executed = [];
    const messages = [{ role: 'user', content: 'anota: teste' }];

    await runSageTurns({
      client,
      model: 'test-model',
      system: 'sys',
      tools: [{ name: 'registar_nota', description: 'd', input_schema: { type: 'object', properties: {} } }],
      messages,
      executeTool: (name, args) => { executed.push([name, args]); return { ok: true, message: 'Anotado' }; },
      send: (p) => sent.push(p),
    });

    expect(executed).toEqual([['registar_nota', { nota: 'teste' }]]);
    expect(requests).toHaveLength(2);
    expect(requests[0].url).toContain('/v1/messages');
    expect(requests[0].body).toMatchObject({
      model: 'test-model', system: 'sys', stream: true, output_config: { effort: 'low' },
    });

    // second request replays the tool call and carries its result, matched by id
    const second = requests[1].body.messages;
    expect(second[1].role).toBe('assistant');
    expect(second[1].content[0]).toMatchObject({ type: 'tool_use', id: 'toolu_1', input: { nota: 'teste' } });
    expect(second[2]).toEqual({
      role: 'user',
      content: [{ type: 'tool_result', tool_use_id: 'toolu_1', content: JSON.stringify({ ok: true, message: 'Anotado' }) }],
    });

    expect(sent).toEqual([
      { tools: [{ tool: 'registar_nota', input: { nota: 'teste' }, result: { ok: true, message: 'Anotado' } }] },
      { text: 'Anot' },
      { text: 'ado.' },
    ]);
  });

  it('returns a failing tool to the model instead of aborting', async () => {
    const { client, requests } = fakeClient([toolTurn, textTurn]);

    await runSageTurns({
      client, model: 'm', system: 's', tools: [], messages: [{ role: 'user', content: 'x' }],
      executeTool: () => { throw new Error('FOREIGN KEY constraint failed'); },
      send: () => {},
    });

    const result = requests[1].body.messages[2].content[0];
    expect(result.is_error).toBe(true);
    const out = JSON.parse(result.content);
    expect(out.ok).toBe(false);
    expect(out.message).toContain('FOREIGN KEY');
  });

  it('surfaces an API error with its message', async () => {
    const { client } = fakeClient([
      () => new Response(JSON.stringify({ type: 'error', error: { type: 'invalid_request_error', message: 'Your credit balance is too low to access the Anthropic API.' } }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      }),
    ]);

    await expect(runSageTurns({
      client, model: 'm', system: 's', tools: [], messages: [{ role: 'user', content: 'x' }], executeTool: () => ({}), send: () => {},
    })).rejects.toThrow(/credit balance/);
  });
});
