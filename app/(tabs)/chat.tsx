import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import Screen from '../../components/Screen';
import ChatBubble from '../../components/ChatBubble';
import ToolChip from '../../components/ToolChip';
import ToolTrace from '../../components/ToolTrace';
import BreathingOrb from '../../components/BreathingOrb';
import { useAppStore } from '../../lib/store';
import { useLang, useT, useTheme } from '../../lib/hooks';
import { Fonts } from '../../lib/fonts';
import { detectKeyKind, getApiKey } from '../../lib/apiKey';
import { runAgent } from '../../lib/ai/agent';
import { AnthropicProvider, type AgentTurn, type AIProvider } from '../../lib/ai/provider';
import { OfflineProvider } from '../../lib/ai/offlineProvider';
import { OpenAIProvider } from '../../lib/ai/openaiProvider';
import { toolDisplayName } from '../../lib/ai/toolDefs';
import type { ChatMessage } from '../../lib/types';

/**
 * Quick replies carry the tools they imply. The offline provider follows the
 * hint directly, so a chip never depends on its own wording matching a keyword
 * list somewhere else; a real model receives only the text and chooses freely.
 */
const QUICK_PROMPTS: { key: string; icon: string; ar: string; en: string; tools: string[] }[] = [
  { key: 'stats', icon: '📊', ar: 'كيف أدائي؟', en: 'How am I doing?', tools: ['get_stats'] },
  { key: 'patterns', icon: '🔍', ar: 'ما هي أنماطي؟', en: 'What are my patterns?', tools: ['get_patterns'] },
  {
    key: 'urge',
    icon: '⚡',
    ar: 'أشعر برغبة الآن',
    en: 'I feel an urge now',
    tools: ['get_my_reasons', 'suggest_coping_exercise', 'open_urge_screen'],
  },
  { key: 'why', icon: '❝', ar: 'ذكّرني لماذا بدأت', en: 'Remind me why I started', tools: ['get_my_reasons'] },
  { key: 'breathe', icon: '🌬️', ar: 'ساعدني أهدأ', en: 'Help me calm down', tools: ['start_breathing_exercise'] },
  { key: 'verse', icon: '📿', ar: 'آية تطمئنني', en: 'A verse to steady me', tools: ['get_quran_verse'] },
];

export default function ChatScreen() {
  const theme = useTheme();
  const lang = useLang();
  const t = useT('chat');

  const chatMessages = useAppStore((s) => s.chatMessages);
  const addChatMessage = useAppStore((s) => s.addChatMessage);
  const addReason = useAppStore((s) => s.addReason);
  const logPastUrge = useAppStore((s) => s.logPastUrge);
  const activeUrgeId = useAppStore((s) => s.activeUrgeId);

  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [pendingSteps, setPendingSteps] = useState<string[]>([]);
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    getApiKey().then((k) => setHasKey(!!k));
  }, []);

  const scrollToEnd = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  }, []);

  const buildProvider = useCallback(async (): Promise<AIProvider> => {
    const key = await getApiKey();
    setHasKey(!!key);
    if (!key) return new OfflineProvider(lang);

    // The key's own prefix says which service it belongs to — OpenRouter
    // speaks the identical OpenAI wire format, just at its own base URL.
    switch (detectKeyKind(key)) {
      case 'anthropic':
        return new AnthropicProvider(key);
      case 'openrouter':
        return new OpenAIProvider(key, 'https://openrouter.ai/api/v1', 'openai/gpt-4o-mini');
      case 'openai':
        return new OpenAIProvider(key, 'https://api.openai.com/v1', 'gpt-4o-mini');
      default:
        return new OfflineProvider(lang);
    }
  }, [lang]);

  const send = useCallback(
    async (rawText: string, toolHint?: string[]) => {
      const text = rawText.trim();
      if (!text || busy) return;

      Haptics.selectionAsync().catch(() => {});
      addChatMessage({ role: 'user', text, urgeId: activeUrgeId ?? undefined });
      setInput('');
      setBusy(true);
      setPendingSteps([]);
      scrollToEnd();

      // Snapshot state now so tool reads reflect the moment the user asked.
      const state = useAppStore.getState();
      const history: AgentTurn[] = state.chatMessages
        .slice(-12)
        .map((m) => ({ role: m.role === 'ai' ? ('assistant' as const) : ('user' as const), content: m.text }))
        .filter((m) => typeof m.content === 'string' && m.content.length > 0);

      try {
        const provider = await buildProvider();
        const result = await runAgent({
          provider,
          lang,
          history,
          userMessage: text,
          toolHint,
          ctx: {
            lang,
            state,
            actions: { addReason, logPastUrge },
          },
        });

        const uiAction = result.steps.find((s) => s.uiAction)?.uiAction?.type;
        addChatMessage({
          role: 'ai',
          text: result.text,
          urgeId: activeUrgeId ?? undefined,
          steps: result.steps.map((s) => s.displayName),
          uiAction,
        });
      } finally {
        setBusy(false);
        setPendingSteps([]);
        scrollToEnd();
      }
    },
    [busy, addChatMessage, activeUrgeId, scrollToEnd, buildProvider, lang, addReason, logPastUrge]
  );

  const renderItem = ({ item }: { item: ChatMessage }) => (
    <View>
      {item.role === 'ai' && item.steps && item.steps.length > 0 ? <ToolTrace steps={item.steps} /> : null}
      <ChatBubble message={item} />
      {item.uiAction === 'breathing' ? <BreathingOrb /> : null}
      {item.uiAction === 'open_urge_screen' ? (
        <TouchableOpacity
          onPress={() => router.push('/urge')}
          style={[styles.actionBtn, { backgroundColor: theme.danger }]}
          activeOpacity={0.85}
        >
          <Text style={styles.actionLabel}>
            {lang === 'ar' ? '⚡  افتح وضع المقاومة' : '⚡  Open fight mode'}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <Screen edges={['top']}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>{t('title')}</Text>
          <Text style={[styles.subtitle, { color: theme.textDim }]}>{t('subtitle')}</Text>
        </View>

        {hasKey === false ? (
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/settings')}
            style={[styles.banner, { backgroundColor: theme.accentSoft, borderColor: theme.accent }]}
            activeOpacity={0.8}
          >
            <Text style={[styles.bannerText, { color: theme.accent }]}>
              {lang === 'ar'
                ? '⚙️ المساعد يعمل بوضع محدود. أضف مفتاح API لتفعيله بالكامل.'
                : '⚙️ Assistant is in limited mode. Add an API key to enable it fully.'}
            </Text>
          </TouchableOpacity>
        ) : null}

        <FlatList
          ref={listRef}
          style={styles.messagesList}
          data={chatMessages}
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={[styles.empty, { color: theme.textFaint }]}>{t('emptyState')}</Text>}
          onContentSizeChange={scrollToEnd}
          ListFooterComponent={
            busy ? (
              <View style={styles.thinking}>
                <ActivityIndicator size="small" color={theme.primary} />
                <Text style={[styles.thinkingText, { color: theme.textFaint }]}>
                  {lang === 'ar' ? 'يفكر...' : 'Thinking...'}
                </Text>
                <ToolTrace steps={pendingSteps} pending />
              </View>
            ) : null
          }
        />

        <FlatList
          style={styles.toolsList}
          data={QUICK_PROMPTS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(p) => p.key}
          contentContainerStyle={styles.tools}
          renderItem={({ item }) => (
            <ToolChip
              icon={item.icon}
              label={lang === 'ar' ? item.ar : item.en}
              onPress={() => send(lang === 'ar' ? item.ar : item.en, item.tools)}
            />
          )}
        />

        <View style={[styles.inputRow, { borderColor: theme.border, backgroundColor: theme.surface }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={t('placeholder')}
            placeholderTextColor={theme.textFaint}
            style={[styles.input, { color: theme.text }]}
            textAlign={lang === 'ar' ? 'right' : 'left'}
            multiline
            editable={!busy}
            onSubmitEditing={() => send(input)}
          />
          <TouchableOpacity
            onPress={() => send(input)}
            disabled={busy || !input.trim()}
            style={[styles.sendBtn, { backgroundColor: busy || !input.trim() ? theme.border : theme.primary }]}
          >
            <Text style={{ fontSize: 16 }}>{lang === 'ar' ? '⬅' : '➤'}</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 8 },
  title: { fontFamily: Fonts.black, fontSize: 22 },
  subtitle: { fontFamily: Fonts.body, fontSize: 12, marginTop: 2 },
  banner: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  bannerText: { fontFamily: Fonts.medium, fontSize: 12, textAlign: 'center' },
  messagesList: { flex: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 12, flexGrow: 1 },
  empty: { textAlign: 'center', fontFamily: Fonts.body, fontSize: 13, marginTop: 40, paddingHorizontal: 30, lineHeight: 20 },
  thinking: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 6, flexWrap: 'wrap' },
  thinkingText: { fontFamily: Fonts.body, fontSize: 12 },
  actionBtn: { marginTop: 8, marginHorizontal: 4, paddingVertical: 13, borderRadius: 14, alignItems: 'center' },
  actionLabel: { fontFamily: Fonts.bold, fontSize: 14, color: '#fff' },
  toolsList: { flexGrow: 0, flexShrink: 0 },
  tools: { paddingHorizontal: 16, paddingBottom: 10, alignItems: 'center' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  input: { flex: 1, fontFamily: Fonts.body, fontSize: 14, maxHeight: 100, paddingVertical: 6 },
  sendBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
});
