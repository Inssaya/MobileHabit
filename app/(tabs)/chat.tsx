import React, { useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import Screen from '../../components/Screen';
import ChatBubble from '../../components/ChatBubble';
import ToolChip from '../../components/ToolChip';
import BreathingOrb from '../../components/BreathingOrb';
import { useAppStore } from '../../lib/store';
import { useLang, useT, useTheme } from '../../lib/hooks';
import { Fonts } from '../../lib/fonts';
import { respondToFreeText, respondToTool, type ToolKey } from '../../lib/mockAI';
import { computeCurrentStreakDays, computeTotalScore } from '../../lib/derived';
import type { ChatMessage } from '../../lib/types';

const TOOLS: { key: ToolKey; icon: string }[] = [
  { key: 'stats', icon: '📊' },
  { key: 'exercise', icon: '🧘' },
  { key: 'logUrge', icon: '📝' },
  { key: 'verse', icon: '📿' },
  { key: 'weekly', icon: '🗓️' },
  { key: 'breathing', icon: '🌬️' },
];

const TOOL_LABEL_KEY: Record<ToolKey, string> = {
  stats: 'toolStats',
  exercise: 'toolExercise',
  logUrge: 'toolLogUrge',
  verse: 'toolVerse',
  weekly: 'toolWeekly',
  breathing: 'toolBreathing',
};

export default function ChatScreen() {
  const theme = useTheme();
  const lang = useLang();
  const t = useT('chat');

  const habit = useAppStore((s) => s.habit);
  const chatMessages = useAppStore((s) => s.chatMessages);
  const addChatMessage = useAppStore((s) => s.addChatMessage);
  const streakStartedAt = useAppStore((s) => s.streakStartedAt);
  const lifetimeCleanDaysBanked = useAppStore((s) => s.lifetimeCleanDaysBanked);
  const bestStreakDays = useAppStore((s) => s.bestStreakDays);
  const resistedCount = useAppStore((s) => s.resistedCount);
  const relapseCount = useAppStore((s) => s.relapseCount);
  const urges = useAppStore((s) => s.urges);
  const activeUrgeId = useAppStore((s) => s.activeUrgeId);

  // Computed here (plain JS, not inside a selector) so the zustand snapshot
  // stays stable across renders — see lib/derived.ts.
  const currentStreakDays = computeCurrentStreakDays(streakStartedAt);
  const totalScore = computeTotalScore(lifetimeCleanDaysBanked, streakStartedAt, resistedCount);

  const [input, setInput] = useState('');
  const listRef = useRef<FlatList>(null);

  const ctx = { lang, habit, currentStreakDays, bestStreakDays, totalScore, resistedCount, relapseCount, urges };

  const scrollToEnd = () => setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);

  const send = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    addChatMessage({ role: 'user', text: trimmed, urgeId: activeUrgeId ?? undefined });
    const reply = respondToFreeText(trimmed, ctx);
    addChatMessage({ role: 'ai', text: reply.text, urgeId: activeUrgeId ?? undefined });
    setInput('');
    scrollToEnd();
  };

  const runTool = (tool: ToolKey) => {
    const label = t(TOOL_LABEL_KEY[tool]);
    addChatMessage({ role: 'user', text: label, urgeId: activeUrgeId ?? undefined });
    const reply = respondToTool(tool, ctx);
    addChatMessage({ role: 'ai', text: reply.text, tool: reply.kind, urgeId: activeUrgeId ?? undefined });
    scrollToEnd();
  };

  const renderItem = ({ item }: { item: ChatMessage }) => (
    <View>
      <ChatBubble message={item} />
      {item.role === 'ai' && item.tool === 'breathing' ? <BreathingOrb /> : null}
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <Screen edges={['top']}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>{t('title')}</Text>
          <Text style={[styles.subtitle, { color: theme.textDim }]}>{t('subtitle')}</Text>
        </View>

        <FlatList
          ref={listRef}
          style={styles.messagesList}
          data={chatMessages}
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={[styles.empty, { color: theme.textFaint }]}>{t('emptyState')}</Text>}
          onContentSizeChange={scrollToEnd}
        />

        <FlatList
          style={styles.toolsList}
          data={TOOLS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(tool) => tool.key}
          contentContainerStyle={styles.tools}
          renderItem={({ item }) => <ToolChip icon={item.icon} label={t(TOOL_LABEL_KEY[item.key])} onPress={() => runTool(item.key)} />}
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
          />
          <TouchableOpacity onPress={send} style={[styles.sendBtn, { backgroundColor: theme.primary }]}>
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
  messagesList: { flex: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 12, flexGrow: 1 },
  empty: { textAlign: 'center', fontFamily: Fonts.body, fontSize: 13, marginTop: 40, paddingHorizontal: 30, lineHeight: 20 },
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
