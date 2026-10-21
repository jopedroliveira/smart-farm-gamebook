// The Sage conversation loop against the Anthropic Messages API.
//
// One streamed call per turn. If the model stops to use tools, run them,
// feed the results back and stream the next turn. Text is forwarded as it
// arrives; the text of the last turn is the answer.
//
// Kept apart from the route so it can be tested with a fake client.

export async function runSageTurns({ client, model, system, tools, messages, executeTool, send, maxIterations = 8 }) {
  while (maxIterations-- > 0) {
    const stream = client.messages.stream({
      model,
      system,
      tools,
      messages,
      // Opus 5.5 always thinks; low effort keeps a chat about a vegetable
      // garden fast and cheap. Thinking tokens count against max_tokens,
      // hence the headroom over the short answers we ask for.
      output_config: { effort: 'low' },
      max_tokens: 4000,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        send({ text: event.delta.text });
      }
    }

    const response = await stream.finalMessage();
    if (response.stop_reason === 'refusal') {
      throw new Error('O modelo recusou responder a este pedido');
    }
    const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');
    if (response.stop_reason !== 'tool_use' || toolUseBlocks.length === 0) return;

    // The model's own output (thinking and tool calls) goes back unchanged,
    // followed by one result per call, matched by tool_use_id.
    messages.push({ role: 'assistant', content: response.content });

    const toolResults = [];
    const toolResultContent = [];
    for (const block of toolUseBlocks) {
      // uma ferramenta que falha nao pode matar o loop inteiro: o erro
      // volta ao modelo como tool_result para ele se corrigir e continuar
      let result;
      let isError = false;
      try {
        result = executeTool(block.name, block.input);
      } catch (err) {
        console.error(`[sage] Tool ${block.name} failed:`, err.message);
        result = {
          ok: false,
          message: `A ferramenta ${block.name} falhou: ${err.message}. Verifica os dados (ids de canteiros, especies, rotacoes) e tenta corrigir.`,
        };
        isError = true;
      }
      toolResults.push({ tool: block.name, input: block.input, result });
      toolResultContent.push({
        type: 'tool_result',
        tool_use_id: block.id,
        content: JSON.stringify(result),
        ...(isError ? { is_error: true } : {}),
      });
    }

    send({ tools: toolResults });
    messages.push({ role: 'user', content: toolResultContent });
  }
}
