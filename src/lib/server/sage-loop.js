// The Sage conversation loop against the OpenAI Responses API.
//
// One streamed call per turn. If the model stops to call functions, run
// them, feed the results back and stream the next turn. Text is forwarded
// as it arrives; the text of the last turn is the answer.
//
// Kept apart from the route so it can be tested with a fake client.

export async function runSageTurns({ client, model, instructions, tools, input, executeTool, send, maxIterations = 8 }) {
  while (maxIterations-- > 0) {
    const stream = await client.responses.create({
      model,
      instructions,
      tools,
      input,
      stream: true,
      // Low effort keeps a chat about a vegetable garden fast and cheap.
      // Reasoning tokens count against the output limit, hence the headroom.
      reasoning: { effort: 'low' },
      max_output_tokens: 2000,
    });

    const outputItems = [];
    for await (const event of stream) {
      if (event.type === 'response.output_text.delta') {
        send({ text: event.delta });
      } else if (event.type === 'response.output_item.done') {
        outputItems.push(event.item);
      } else if (event.type === 'error' || event.type === 'response.failed') {
        throw new Error(event.message || event.response?.error?.message || 'A resposta do modelo falhou');
      }
    }

    const calls = outputItems.filter(item => item.type === 'function_call');
    if (calls.length === 0) return;

    // The model's own output (reasoning and calls) goes back as input,
    // followed by one result per call, matched by call_id.
    input.push(...outputItems);

    const toolResults = [];
    for (const call of calls) {
      // uma ferramenta que falha nao pode matar o loop inteiro: o erro
      // volta ao modelo como resultado para ele se corrigir e continuar
      let args = {};
      let result;
      try {
        args = JSON.parse(call.arguments || '{}');
        result = executeTool(call.name, args);
      } catch (err) {
        console.error(`[sage] Tool ${call.name} failed:`, err.message);
        result = {
          ok: false,
          message: `A ferramenta ${call.name} falhou: ${err.message}. Verifica os dados (ids de canteiros, especies, rotacoes) e tenta corrigir.`,
        };
      }
      toolResults.push({ tool: call.name, input: args, result });
      input.push({
        type: 'function_call_output',
        call_id: call.call_id,
        output: JSON.stringify(result),
      });
    }

    send({ tools: toolResults });
  }
}
