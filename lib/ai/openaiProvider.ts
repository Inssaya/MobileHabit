import { AI_TOOLS, type AITool } from './toolDefs';
import { AIProviderError, type AgentTurn, type AIProvider, type ProviderReply, type ProviderToolCall } from './provider';

/**
 * Speaks the OpenAI Chat Completions wire format, which OpenRouter also
 * implements verbatim — one class covers both, the only difference is which
 * base URL and default model get plugged in. `raw` on the reply is this
 * provider's own {text, tool_calls} shape; it is only ever fed back into
 * this same provider within one agent run, so it never has to look like
 * Anthropic's content-block array.
 */
export class OpenAIProvider implements AIProvider {
  readonly id = 'openai' as const;

  constructor(
    private apiKey: string,
    private baseURL: string,
    private model: string
  ) {}

  async send(system: string, turns: AgentTurn[]): Promise<ProviderReply> {
    const messages = [{ role: 'system', content: system }, ...turns.flatMap(toOpenAIMessages)];

    let response: Response;
    try {
      response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          tools: AI_TOOLS.map(toOpenAITool),
          tool_choice: 'auto',
        }),
      });
    } catch {
      throw new AIProviderError('Could not reach the API.', 'network');
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      if (response.status === 401) throw new AIProviderError('Invalid API key.', 'auth');
      if (response.status === 429) throw new AIProviderError('Rate limited — try again shortly.', 'rate_limit');
      throw new AIProviderError(body || `Request failed (${response.status}).`, 'unknown');
    }

    const json = await response.json();
    const choice = json.choices?.[0];
    if (!choice) throw new AIProviderError('Empty response from the API.', 'unknown');

    if (choice.finish_reason === 'content_filter') {
      throw new AIProviderError('The request was declined by safety filters.', 'refusal');
    }

    const message = choice.message ?? {};
    const text: string = typeof message.content === 'string' ? message.content.trim() : '';

    const toolCalls: ProviderToolCall[] = (message.tool_calls ?? []).map((c: any) => ({
      id: c.id,
      name: c.function.name,
      input: safeParse(c.function.arguments),
    }));

    return {
      text,
      toolCalls,
      raw: { text: message.content ?? null, tool_calls: message.tool_calls ?? undefined },
      stopReason: choice.finish_reason,
    };
  }
}

function safeParse(json: string): unknown {
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
}

function toOpenAITool(tool: AITool) {
  return {
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.input_schema,
    },
  };
}

/** One AgentTurn can expand into several OpenAI messages (tool results are one message each). */
function toOpenAIMessages(turn: AgentTurn): any[] {
  const { role, content } = turn;

  if (typeof content === 'string') {
    return [{ role, content }];
  }

  // This provider's own assistant raw: { text, tool_calls }.
  if (role === 'assistant' && content && !Array.isArray(content) && 'tool_calls' in content) {
    return [{ role: 'assistant', content: content.text ?? null, tool_calls: content.tool_calls }];
  }

  // agent.ts's tool_result blocks — each becomes its own `tool` message.
  if (Array.isArray(content)) {
    return content
      .filter((b: any) => b?.type === 'tool_result')
      .map((b: any) => ({ role: 'tool', tool_call_id: b.tool_use_id, content: String(b.content ?? '') }));
  }

  return [];
}
