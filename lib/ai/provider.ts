import Anthropic from '@anthropic-ai/sdk';

import { AI_TOOLS } from './toolDefs';

/** Model is pinned here rather than scattered through the app. */
export const AI_MODEL = 'claude-opus-5';

export type AgentRole = 'user' | 'assistant';

/** Provider-agnostic conversation turn. */
export interface AgentTurn {
  role: AgentRole;
  /** Anthropic content blocks. Kept opaque so providers can round-trip them. */
  content: any;
}

export interface ProviderToolCall {
  id: string;
  name: string;
  input: unknown;
}

export interface ProviderReply {
  text: string;
  toolCalls: ProviderToolCall[];
  /** Raw assistant content, echoed back verbatim on the next request. */
  raw: any;
  stopReason?: string | null;
}

export interface AIProvider {
  readonly id: 'anthropic' | 'openai' | 'offline';
  /**
   * `toolHint` names tools the caller already knows are relevant (a quick-reply
   * chip, for instance). The offline provider uses it instead of guessing from
   * keywords; a real model ignores it and decides for itself.
   */
  send(system: string, turns: AgentTurn[], toolHint?: string[]): Promise<ProviderReply>;
}

export class AIProviderError extends Error {
  constructor(
    message: string,
    readonly kind: 'auth' | 'rate_limit' | 'network' | 'refusal' | 'unknown'
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}

export class AnthropicProvider implements AIProvider {
  readonly id = 'anthropic' as const;
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({
      apiKey,
      // The key belongs to the user and is stored in their device keychain;
      // there is no server in this app to proxy through.
      dangerouslyAllowBrowser: true,
    });
  }

  async send(system: string, turns: AgentTurn[]): Promise<ProviderReply> {
    try {
      const response = await this.client.messages.create({
        model: AI_MODEL,
        max_tokens: 4096,
        // Adaptive lets the model decide depth per message; `low` effort keeps
        // a chat reply fast, which matters most mid-craving.
        thinking: { type: 'adaptive' },
        output_config: { effort: 'low' },
        system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
        tools: AI_TOOLS as Anthropic.Tool[],
        messages: turns.map((t) => ({ role: t.role, content: t.content })) as Anthropic.MessageParam[],
      });

      // A refusal returns HTTP 200 with empty/partial content — check before reading.
      if (response.stop_reason === 'refusal') {
        throw new AIProviderError('The request was declined by safety filters.', 'refusal');
      }

      const text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('\n')
        .trim();

      const toolCalls = response.content
        .filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
        .map((b) => ({ id: b.id, name: b.name, input: b.input }));

      return { text, toolCalls, raw: response.content, stopReason: response.stop_reason };
    } catch (e) {
      if (e instanceof AIProviderError) throw e;
      if (e instanceof Anthropic.AuthenticationError) {
        throw new AIProviderError('Invalid API key.', 'auth');
      }
      if (e instanceof Anthropic.RateLimitError) {
        throw new AIProviderError('Rate limited — try again shortly.', 'rate_limit');
      }
      if (e instanceof Anthropic.APIConnectionError) {
        throw new AIProviderError('Could not reach the API.', 'network');
      }
      if (e instanceof Anthropic.APIError) {
        throw new AIProviderError(e.message, 'unknown');
      }
      throw new AIProviderError(e instanceof Error ? e.message : 'Unknown error', 'unknown');
    }
  }
}
