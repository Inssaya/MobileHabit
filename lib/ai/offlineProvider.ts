import type { AIProvider, AgentTurn, ProviderReply } from './provider';
import type { Lang } from '../i18n';

/**
 * Keyword-routed stand-in used when no API key is configured. It emits the
 * same `tool_use` blocks the real provider does, so the agent loop, the tool
 * executors and the chat UI all run the identical code path — the only thing
 * that changes is who chooses the tools and writes the prose.
 */
export class OfflineProvider implements AIProvider {
  readonly id = 'offline' as const;

  constructor(private lang: Lang) {}

  async send(_system: string, turns: AgentTurn[], toolHint?: string[]): Promise<ProviderReply> {
    const lastUser = [...turns].reverse().find((t) => t.role === 'user');
    const toolResultsSoFar = this.collectToolResults(turns);

    // Second pass: tools already ran this turn, so write the reply.
    if (toolResultsSoFar.length > 0) {
      return { text: this.compose(toolResultsSoFar), toolCalls: [], raw: [], stopReason: 'end_turn' };
    }

    const text = this.userText(lastUser);
    // An explicit hint beats keyword guessing — it's how the quick-reply chips
    // stay reliable without duplicating their wording in the router below.
    const tools = toolHint && toolHint.length > 0 ? toolHint : this.route(text);

    if (tools.length === 0) {
      return { text: this.fallbackText(), toolCalls: [], raw: [], stopReason: 'end_turn' };
    }

    return {
      text: '',
      toolCalls: tools.map((name, i) => ({ id: `offline_${Date.now()}_${i}`, name, input: {} })),
      raw: tools.map((name, i) => ({
        type: 'tool_use',
        id: `offline_${Date.now()}_${i}`,
        name,
        input: {},
      })),
      stopReason: 'tool_use',
    };
  }

  private userText(turn: AgentTurn | undefined): string {
    if (!turn) return '';
    if (typeof turn.content === 'string') return turn.content.toLowerCase();
    if (Array.isArray(turn.content)) {
      return turn.content
        .filter((b: any) => b?.type === 'text')
        .map((b: any) => b.text)
        .join(' ')
        .toLowerCase();
    }
    return '';
  }

  private collectToolResults(turns: AgentTurn[]): { name: string; text: string }[] {
    const out: { name: string; text: string }[] = [];
    // Walk back to the most recent real user message; anything after it is
    // this turn's tool traffic.
    for (let i = turns.length - 1; i >= 0; i--) {
      const turn = turns[i];
      if (!Array.isArray(turn.content)) break;
      const isToolResultTurn = turn.content.some((b: any) => b?.type === 'tool_result');
      if (turn.role === 'user' && !isToolResultTurn) break;
      if (turn.role === 'user' && isToolResultTurn) {
        turn.content.forEach((b: any) => {
          if (b?.type === 'tool_result') out.unshift({ name: b.__toolName ?? '', text: String(b.content ?? '') });
        });
      }
    }
    return out;
  }

  private route(text: string): string[] {
    const has = (words: string[]) => words.some((w) => text.includes(w));

    if (has(['رغبة', 'اريد الان', 'أريد الآن', 'urge', 'tempted', 'craving', 'want to do it'])) {
      return ['get_my_reasons', 'suggest_coping_exercise', 'open_urge_screen'];
    }
    if (has(['انتكست', 'سقطت', 'relapsed', 'gave in', 'failed', 'messed up'])) {
      return ['get_stats', 'get_patterns'];
    }
    if (has(['احصائيات', 'إحصائيات', 'كم يوم', 'stats', 'how long', 'how am i doing', 'progress'])) {
      return ['get_stats'];
    }
    if (has(['نمط', 'أنماط', 'pattern', 'trigger', 'why do i', 'when do i'])) {
      return ['get_patterns'];
    }
    if (has(['تنفس', 'تنفّس', 'breath', 'calm', 'panic', 'anxious'])) {
      return ['start_breathing_exercise'];
    }
    if (has(['اية', 'آية', 'قران', 'قرآن', 'verse', 'quran', 'spiritual'])) {
      return ['get_quran_verse'];
    }
    if (has(['لماذا بدأت', 'سبب', 'my reasons', 'why did i', 'remind me why'])) {
      return ['get_my_reasons'];
    }
    if (has(['انجاز', 'إنجاز', 'milestone', 'achievement'])) {
      return ['get_milestones'];
    }
    if (has(['مزاج', 'mood', 'feeling lately', 'how have i been'])) {
      return ['get_check_ins'];
    }
    if (has(['تمرين', 'exercise', 'what should i do', 'help me'])) {
      return ['suggest_coping_exercise'];
    }
    return [];
  }

  /**
   * Renders tool JSON into readable prose. Intentionally plain — this is a
   * fallback, and over-polished canned text would misrepresent it as a real
   * model reply.
   */
  private compose(results: { name: string; text: string }[]): string {
    const ar = this.lang === 'ar';
    const parts: string[] = [];

    for (const r of results) {
      // Action tools carry no data worth rendering — their result exists for
      // the model. Supply user-facing wording keyed on the tool itself.
      if (r.name === 'start_breathing_exercise') {
        parts.push(
          ar
            ? 'لنتنفّس سوياً. اتبع الدائرة أدناه: شهيق 4، احبس 7، زفير 8 — أربع مرات.'
            : "Let's breathe together. Follow the circle below: in for 4, hold 7, out for 8 — four times."
        );
        continue;
      }
      if (r.name === 'open_urge_screen') {
        parts.push(
          ar
            ? 'اضغط الزر أدناه لتبدأ عدّاد المقاومة. الرغبة موجة تعلو ثم تهبط.'
            : 'Tap the button below to start the fight timer. An urge is a wave — it rises, then falls.'
        );
        continue;
      }

      let data: any;
      try {
        data = JSON.parse(r.text);
      } catch {
        continue;
      }

      if (data.clean_streak_days !== undefined) {
        parts.push(
          ar
            ? `أنت صامد منذ ${Math.floor(data.clean_streak_days)} يوم، ورتبتك الحالية "${data.current_rank}". قاومت ${data.urges_resisted} رغبة حتى الآن.`
            : `You're ${Math.floor(data.clean_streak_days)} days clean, currently ranked "${data.current_rank}". You've resisted ${data.urges_resisted} urges so far.`
        );
      }
      if (Array.isArray(data.plain_language_summary) && data.plain_language_summary.length > 0) {
        parts.push(data.plain_language_summary.join('\n'));
      }
      if (Array.isArray(data.reasons) && data.reasons.length > 0) {
        parts.push(
          (ar ? 'هذه كلماتك أنت، حين كنت صافي الذهن:\n' : 'Your own words, from when your head was clear:\n') +
            data.reasons.map((x: string) => `❝ ${x}`).join('\n')
        );
      }
      if (data.exercise) {
        parts.push(data.exercise);
        if (data.trigger_specific_tip) parts.push(data.trigger_specific_tip);
      }
      if (data.arabic) {
        parts.push(`${data.arabic}\n( ${data.reference} )\n\n${data.reflection}`);
      }
      if (Array.isArray(data.earned)) {
        parts.push(
          ar
            ? `إنجازاتك حتى الآن: ${data.earned.length > 0 ? data.earned.join('، ') : 'لا شيء بعد'}.`
            : `Achievements so far: ${data.earned.length > 0 ? data.earned.join(', ') : 'none yet'}.`
        );
      }
      if (Array.isArray(data.check_ins) && data.check_ins.length > 0) {
        parts.push(
          ar
            ? `سجّلت حالتك ${data.check_ins.length} مرة مؤخراً.`
            : `You've checked in ${data.check_ins.length} times recently.`
        );
      }
      // `data.note` is deliberately skipped: those strings describe the tool's
      // effect for the model's benefit and read as leaked plumbing to a user.
    }

    if (parts.length === 0) return this.fallbackText();

    parts.push(
      ar
        ? '\n(هذا رد محلي بدون اتصال. أضف مفتاح API في الإعدادات للحصول على مساعد كامل يفهم كلامك.)'
        : '\n(This is an offline reply. Add an API key in Settings for a full assistant that understands you properly.)'
    );
    return parts.join('\n\n');
  }

  private fallbackText(): string {
    return this.lang === 'ar'
      ? 'أنا أعمل حالياً بدون اتصال، لذا أفهم كلمات محددة فقط. جرّب أن تسألني عن "إحصائياتي" أو "أنماطي" أو تطلب "تمرين تنفّس" أو "آية". لتفعيل المساعد الكامل، أضف مفتاح API في الإعدادات.'
      : "I'm running offline right now, so I only understand specific words. Try asking about \"my stats\", \"my patterns\", or ask for a \"breathing exercise\" or a \"verse\". To enable the full assistant, add an API key in Settings.";
  }
}
