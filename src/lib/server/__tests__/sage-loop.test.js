import { describe, it, expect } from 'vitest';
import OpenAI from 'openai';
import { runSageTurns } from '../sage-loop.js';

// Runs the loop through the real OpenAI SDK with a fake fetch, so the
// request shape and the stream parsing are the SDK's, not a hand-made mock.
function sse(events) {
  const body = events.map(e => `event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`).join('');
  return new Response(body, { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
}

function fakeClient(replies) {
  const requests = [];
  const client = new OpenAI({
    apiKey: 'test',
    maxRetries: 0,
    fetch: async (url, init) => {
      requests.push({ url: String(url), body: JSON.parse(init.body) });
      return replies.shift()();
    },
  });
  return { client, requests };
}

const call = { type: 'function_call', id: 'fc_1', call_id: 'call_1', name: 'registar_nota', arguments: '{"nota":"teste"}', status: 'completed' };
const message = { type: 'message', id: 'msg_1', role: 'assistant', status: 'completed', content: [{ type: 'output_text', text: 'Anotado.', annotations: [] }] };

describe('runSageTurns', () => {
  it('runs a function call, feeds the result back and streams the answer', async () => {
    const { client, requests } = fakeClient([
      () => sse([
        { type: 'response.output_item.done', output_index: 0, item: call },
        { type: 'response.completed', response: { id: 'resp_1', output: [call] } },
      ]),
      () => sse([
        { type: 'response.output_text.delta', item_id: 'msg_1', output_index: 0, content_index: 0, delta: 'Anot' },
        { type: 'response.output_text.delta', item_id: 'msg_1', output_index: 0, content_index: 0, delta: 'ado.' },
        { type: 'response.output_item.done', output_index: 0, item: message },
        { type: 'response.completed', response: { id: 'resp_2', output: [message] } },
      ]),
    ]);

    const sent = [];
    const executed = [];
    const input = [{ role: 'user', content: 'anota: teste' }];

    await runSageTurns({
      client,
      model: 'test-model',
      instructions: 'sys',
      tools: [{ type: 'function', name: 'registar_nota', parameters: { type: 'object', properties: {} } }],
      input,
      executeTool: (name, args) => { executed.push([name, args]); return { ok: true, message: 'Anotado' }; },
      send: (p) => sent.push(p),
    });

    expect(executed).toEqual([['registar_nota', { nota: 'teste' }]]);
    expect(requests).toHaveLength(2);
    expect(requests[0].url).toContain('/responses');
    expect(requests[0].body).toMatchObject({ model: 'test-model', instructions: 'sys', stream: true });

    // second request replays the call and carries its output, matched by call_id
    const second = requests[1].body.input;
    expect(second.find(i => i.type === 'function_call')?.call_id).toBe('call_1');
    expect(second.find(i => i.type === 'function_call_output')).toEqual({
      type: 'function_call_output',
      call_id: 'call_1',
      output: JSON.stringify({ ok: true, message: 'Anotado' }),
    });

    expect(sent).toEqual([
      { tools: [{ tool: 'registar_nota', input: { nota: 'teste' }, result: { ok: true, message: 'Anotado' } }] },
      { text: 'Anot' },
      { text: 'ado.' },
    ]);
  });

  it('returns a failing tool to the model instead of aborting', async () => {
    const { client, requests } = fakeClient([
      () => sse([{ type: 'response.output_item.done', output_index: 0, item: call }]),
      () => sse([{ type: 'response.output_item.done', output_index: 0, item: message }]),
    ]);

    await runSageTurns({
      client, model: 'm', instructions: 's', tools: [], input: [],
      executeTool: () => { throw new Error('FOREIGN KEY constraint failed'); },
      send: () => {},
    });

    const out = JSON.parse(requests[1].body.input.find(i => i.type === 'function_call_output').output);
    expect(out.ok).toBe(false);
    expect(out.message).toContain('FOREIGN KEY');
  });

  it('surfaces an API error with its message', async () => {
    const { client } = fakeClient([
      () => new Response(JSON.stringify({ error: { message: 'You exceeded your current quota', type: 'insufficient_quota' } }), {
        status: 429, headers: { 'Content-Type': 'application/json' },
      }),
    ]);

    await expect(runSageTurns({
      client, model: 'm', instructions: 's', tools: [], input: [], executeTool: () => ({}), send: () => {},
    })).rejects.toThrow(/quota/);
  });
});
