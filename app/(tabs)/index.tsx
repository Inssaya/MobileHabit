import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Chronometer, { useElapsed } from '../../components/Chronometer';
import RankBadge from '../../components/RankBadge';
import MoodPicker from '../../components/MoodPicker';
import MilestoneModal from '../../components/MilestoneModal';
import { PrimaryButton } from '../../components/Buttons';
import { useAppStore } from '../../lib/store';
import { useTheme, useT, useLang } from '../../lib/hooks';
import { Fonts } from '../../lib/fonts';
import { rankForDays, nextRank, rankProgress } from '../../lib/ranks';
import { todayKey } from '../../lib/dates';
import { MILESTONES } from '../../lib/milestones';
import { notifyMilestone } from '../../lib/notifications';
import type { Mood } from '../../lib/types';

export default function HomeScreen() {
  const theme = useTheme();
  const lang = useLang();
  const t = useT('home');
  const tc = useT('common');
  const tCheck = useT('checkin');

  const habit = useAppStore((s) => s.habit);
  const streakStartedAt = useAppStore((s) => s.streakStartedAt);
  const bestStreakDays = useAppStore((s) => s.bestStreakDays);
  const lifetimeCleanDaysBanked = useAppStore((s) => s.lifetimeCleanDaysBanked);
  const resistedCount = useAppStore((s) => s.resistedCount);
  const checkIns = useAppStore((s) => s.checkIns);
  const pendingMilestones = useAppStore((s) => s.pendingMilestones);
  const notifications = useAppStore((s) => s.notifications);
  const activeUrgeId = useAppStore((s) => s.activeUrgeId);
  const startUrge = useAppStore((s) => s.startUrge);
  const addCheckIn = useAppStore((s) => s.addCheckIn);
  const evaluateMilestones = useAppStore((s) => s.evaluateMilestones);
  const consumePendingMilestones = useAppStore((s) => s.consumePendingMilestones);

  const { totalMs } = useElapsed(streakStartedAt);
  const days = totalMs / 86400000;
  const rank = rankForDays(days);
  const next = nextRank(days);
  const progress = rankProgress(days);
  const daysToNext = next ? Math.max(0, next.minDays - days) : 0;
  const totalScore = Math.round((lifetimeCleanDaysBanked + days) * 10) + resistedCount * 15;

  const [mood, setMood] = useState<Mood | null>(null);
  const [note, setNote] = useState('');
  const [celebrating, setCelebrating] = useState<string[]>([]);

  // Must use the same local-date key the store writes, or the check-in card
  // reappears (or wrongly hides) for hours around midnight in any non-UTC zone.
  const checkedInToday = checkIns.some((c) => c.day === todayKey());

  // Streak-based milestones become true with the passage of time alone, so
  // they need a check on mount rather than only after an explicit action.
  useEffect(() => {
    evaluateMilestones();
  }, [evaluateMilestones]);

  useEffect(() => {
    if (pendingMilestones.length > 0 && celebrating.length === 0) {
      const earned = consumePendingMilestones();
      setCelebrating(earned);

      // Milestones are only detected on Home mount (evaluateMilestones above),
      // so this can't reach the user while the app is fully closed — but it's
      // what makes the "congratulate on achievements" toggle in Settings do
      // anything at all instead of being silently ignored.
      if (Platform.OS !== 'web' && notifications.enabled && notifications.milestones) {
        earned.forEach((key) => {
          const m = MILESTONES.find((x) => x.key === key);
          if (!m) return;
          notifyMilestone(lang === 'ar' ? m.titleAr : m.titleEn, lang === 'ar' ? m.bodyAr : m.bodyEn, notifications).catch(() => {});
        });
      }
    }
  }, [pendingMilestones, celebrating.length, consumePendingMilestones, notifications, lang]);

  const hour = new Date().getHours();
  const greeting = hour < 17 ? t('greetingMorning') : t('greetingEvening');

  const onUrge = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    // An urge is already in progress (the floating widget is showing it) —
    // resume it instead of starting a second one and orphaning the first,
    // stuck at outcome "ongoing" forever.
    if (!activeUrgeId) startUrge();
    router.push('/urge');
  };

  const submitCheckIn = () => {
    if (!mood) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    addCheckIn(mood, note);
    setMood(null);
    setNote('');
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: theme.textDim }]}>{greeting}</Text>
          {habit ? (
            <Text style={[styles.habit, { color: theme.text }]}>
              {habit.icon} {lang === 'ar' ? habit.nameAr : habit.nameEn}
            </Text>
          ) : null}
        </View>

        <Card style={styles.chronoCard}>
          <Text style={[styles.cleanFor, { color: theme.textDim }]}>{t('cleanFor')}</Text>
          <Chronometer startedAt={streakStartedAt} />
          <Text style={[styles.unit, { color: theme.textDim }]}>{tc('days')}</Text>
        </Card>

        <Card style={styles.rankCard}>
          <RankBadge rank={rank} size="medium" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.rankLabel, { color: theme.textDim }]}>{t('currentRank')}</Text>
            {next ? (
              <>
                <View style={[styles.progressTrack, { backgroundColor: theme.surfaceAlt }]}>
                  <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: rank.colorTo }]} />
                </View>
                <Text style={[styles.progressLabel, { color: theme.textFaint }]}>
                  {Math.ceil(daysToNext)} {tc('days')} {t('nextRankIn')} {next.icon}
                </Text>
              </>
            ) : (
              <Text style={[styles.progressLabel, { color: theme.accent }]}>⭐ {t('topRank')}</Text>
            )}
          </View>
        </Card>

        <PrimaryButton label={t('urgeButton')} onPress={onUrge} style={styles.urgeBtn} icon="⚡" />
        <Text style={[styles.urgeSub, { color: theme.textFaint }]}>{t('urgeButtonSub')}</Text>

        {/* Daily check-in, hidden once done so home doesn't nag. */}
        {checkedInToday ? (
          <Card style={styles.checkedInCard}>
            <Text style={[styles.checkedIn, { color: theme.success }]}>{t('checkInDone')}</Text>
          </Card>
        ) : (
          <Card style={{ gap: 14 }}>
            <View>
              <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 0 }]}>{tCheck('title')}</Text>
              <Text style={[styles.checkSub, { color: theme.textDim }]}>{tCheck('sub')}</Text>
            </View>
            <MoodPicker value={mood} onChange={setMood} />
            {mood ? (
              <>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder={tCheck('notePlaceholder')}
                  placeholderTextColor={theme.textFaint}
                  multiline
                  textAlign={lang === 'ar' ? 'right' : 'left'}
                  style={[styles.noteInput, { color: theme.text, borderColor: theme.border }]}
                />
                <PrimaryButton label={tc('save')} onPress={submitCheckIn} />
              </>
            ) : null}
          </Card>
        )}

        {habit && habit.reasons.length > 0 ? (
          <Card style={{ gap: 8 }}>
            <Text style={[styles.whyTitle, { color: theme.accent }]}>{t('yourWhy')}</Text>
            {habit.reasons.slice(0, 2).map((reason, i) => (
              <Text key={i} style={[styles.whyReason, { color: theme.textDim }]}>
                ❝ {reason}
              </Text>
            ))}
          </Card>
        ) : null}

        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('quickStats')}</Text>
        <View style={styles.statsRow}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.8} onPress={() => router.push('/(tabs)/journey')}>
            <Card style={styles.statCard}>
              <Text style={[styles.statValue, { color: theme.primary }]}>{resistedCount}</Text>
              <Text style={[styles.statLabel, { color: theme.textDim }]}>{t('urgesResisted')}</Text>
            </Card>
          </TouchableOpacity>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: theme.text }]}>{Math.floor(bestStreakDays)}</Text>
            <Text style={[styles.statLabel, { color: theme.textDim }]}>{t('bestStreak')}</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: theme.accent }]}>{totalScore}</Text>
            <Text style={[styles.statLabel, { color: theme.textDim }]}>{t('totalScore')}</Text>
          </Card>
        </View>
      </ScrollView>

      <MilestoneModal
        milestoneKey={celebrating[0] ?? null}
        onClose={() => setCelebrating((prev) => prev.slice(1))}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40, gap: 16 },
  header: { gap: 4 },
  greeting: { fontFamily: Fonts.medium, fontSize: 14 },
  habit: { fontFamily: Fonts.bold, fontSize: 20, marginTop: 2 },
  chronoCard: { alignItems: 'center', paddingVertical: 28, gap: 4 },
  cleanFor: { fontFamily: Fonts.medium, fontSize: 13 },
  unit: { fontFamily: Fonts.medium, fontSize: 13, marginTop: 6 },
  rankCard: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  rankLabel: { fontFamily: Fonts.medium, fontSize: 12, marginBottom: 8 },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressLabel: { fontFamily: Fonts.body, fontSize: 11, marginTop: 6 },
  urgeBtn: { marginTop: 4 },
  urgeSub: { textAlign: 'center', fontFamily: Fonts.body, fontSize: 12, marginTop: -8 },
  checkedInCard: { alignItems: 'center', paddingVertical: 14 },
  checkedIn: { fontFamily: Fonts.medium, fontSize: 13 },
  checkSub: { fontFamily: Fonts.body, fontSize: 12, marginTop: 3, lineHeight: 18 },
  noteInput: {
    minHeight: 60,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 12,
    fontFamily: Fonts.body,
    fontSize: 13.5,
  },
  whyTitle: { fontFamily: Fonts.bold, fontSize: 13 },
  whyReason: { fontFamily: Fonts.body, fontSize: 13, lineHeight: 20 },
  sectionTitle: { fontFamily: Fonts.bold, fontSize: 16, marginTop: 10 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 18, gap: 4 },
  statValue: { fontFamily: Fonts.black, fontSize: 24 },
  statLabel: { fontFamily: Fonts.body, fontSize: 11, textAlign: 'center' },
});
