import { buildSystemPrompt } from './systemPrompt';
import { executeTool, toolDisplayName, type ToolContext, type ToolResult } from './toolDefs';
import { AIProviderError, type AIProvider, type AgentTurn } from './provider';
import type { Lang } from '../i18n';

export interface AgentStep {
  toolName: string;
  displayName: string;
  uiAction?: ToolResult['uiAction'];
}

export interface AgentResult {
  text: string;
  steps: AgentStep[];
  error?: { kind: AIProviderError['kind']; message: string };
}

/** Guards against a model that keeps calling tools without ever answering. */
const MAX_TOOL_ROUNDS = 5;

/**
 * Runs the request → tool-execute → request loop until the provider produces
 * text. Tool results never leave the device: they are computed locally from
 * the store and only their JSON is sent onward for the model to read.
 */
export async function runAgent(options: {
  provider: AIProvider;
  ctx: ToolContext;
  lang: Lang;
  /** Prior conversation, oldest first. Tool traffic from earlier turns is not replayed. */
  history: AgentTurn[];
  userMessage: string;
  /** Tools the caller knows are relevant; only the offline provider uses this. */
  toolHint?: string[];
}): Promise<AgentResult> {
  const { provider, ctx, lang, history, userMessage, toolHint } = options;

  const system = buildSystemPrompt(ctx.state, lang);
  const turns: AgentTurn[] = [...history, { role: 'user', content: userMessage }];
  const steps: AgentStep[] = [];

  try {
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      // The hint only applies to the opening request — after that the loop is
      // driven by whatever the provider does with the tool results.
      const reply = await provider.send(system, turns, round === 0 ? toolHint : undefined);

      if (reply.toolCalls.length === 0) {
        return { text: reply.text || fallbackFor(lang), steps };
      }

      // Echo the assistant's tool_use blocks back verbatim — the API rejects a
      // tool_result that doesn't pair with the exact preceding tool_use.
      turns.push({ role: 'assistant', content: reply.raw });

      const resultBlocks = reply.toolCalls.map((call) => {
        const result = executeTool(call.name, call.input, ctx);
        steps.push({
          toolName: call.name,
          displayName: toolDisplayName(call.name, lang),
          uiAction: result.uiAction,
        });
        return {
          type: 'tool_result' as const,
          tool_use_id: call.id,
          content: result.text,
          // Read by the offline provider when composing its reply; the API
          // ignores unknown keys on a tool_result block.
          __toolName: call.name,
        };
      });

      // All results for one assistant turn go back in a single user message.
      turns.push({ role: 'user', content: resultBlocks });
    }

    // Ran out of rounds — answer with what the tools produced rather than nothing.
    return { text: exhaustedFor(lang), steps };
  } catch (e) {
    if (e instanceof AIProviderError) {
      return { text: errorTextFor(lang, e.kind), steps, error: { kind: e.kind, message: e.message } };
    }
    return {
      text: errorTextFor(lang, 'unknown'),
      steps,
      error: { kind: 'unknown', message: e instanceof Error ? e.message : 'unknown' },
    };
  }
}

function fallbackFor(lang: Lang): string {
  return lang === 'ar' ? 'أنا هنا معك. حدّثني أكثر عمّا يدور في بالك.' : "I'm here with you. Tell me more about what's on your mind.";
}

function exhaustedFor(lang: Lang): string {
  return lang === 'ar'
    ? 'راجعت بياناتك لكنني لم أصل إلى إجابة واضحة. جرّب أن تسألني بصيغة أخرى.'
    : "I looked through your data but couldn't land on a clear answer. Try asking me a different way.";
}

function errorTextFor(lang: Lang, kind: AIProviderError['kind']): string {
  const ar: Record<string, string> = {
    auth: 'مفتاح API غير صالح. تحقّق منه في الإعدادات.',
    rate_limit: 'تم تجاوز حد الطلبات. انتظر قليلاً ثم حاول مجدداً.',
    network: 'تعذّر الاتصال. تحقّق من الإنترنت وحاول مرة أخرى.',
    refusal: 'لم أستطع الرد على هذا الطلب. جرّب صياغة أخرى.',
    unknown: 'حدث خطأ غير متوقع. حاول مرة أخرى.',
  };
  const en: Record<string, string> = {
    auth: 'That API key was rejected. Check it in Settings.',
    rate_limit: 'Rate limited. Wait a moment and try again.',
    network: "Couldn't reach the service. Check your connection and try again.",
    refusal: "I couldn't respond to that request. Try rephrasing.",
    unknown: 'Something went wrong. Please try again.',
  };
  return (lang === 'ar' ? ar : en)[kind] ?? (lang === 'ar' ? ar.unknown : en.unknown);
}
