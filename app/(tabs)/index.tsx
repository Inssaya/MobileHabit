import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import Screen from '../../components/Screen';
import Card from '../../components/Card';
import Chronometer, { useElapsed } from '../../components/Chronometer';
import RankBadge from '../../components/RankBadge';
import { PrimaryButton } from '../../components/Buttons';
import { useAppStore } from '../../lib/store';
import { useTheme, useT, useLang } from '../../lib/hooks';
import { Fonts } from '../../lib/fonts';
import { rankForDays, nextRank, rankProgress } from '../../lib/ranks';

export default function HomeScreen() {
  const theme = useTheme();
  const lang = useLang();
  const t = useT('home');
  const tc = useT('common');

  const habit = useAppStore((s) => s.habit);
  const streakStartedAt = useAppStore((s) => s.streakStartedAt);
  const bestStreakDays = useAppStore((s) => s.bestStreakDays);
  const lifetimeCleanDaysBanked = useAppStore((s) => s.lifetimeCleanDaysBanked);
  const resistedCount = useAppStore((s) => s.resistedCount);
  const relapseCount = useAppStore((s) => s.relapseCount);
  const startUrge = useAppStore((s) => s.startUrge);

  const { totalMs } = useElapsed(streakStartedAt);
  const days = totalMs / 86400000;
  const rank = rankForDays(days);
  const next = nextRank(days);
  const progress = rankProgress(days);
  const daysToNext = next ? Math.max(0, next.minDays - days) : 0;
  const totalScore = Math.round((lifetimeCleanDaysBanked + days) * 10) + resistedCount * 15;

  const hour = new Date().getHours();
  const greeting = hour < 17 ? t('greetingMorning') : t('greetingEvening');

  const onUrge = () => {
    startUrge();
    router.push('/urge');
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
              <Text style={[styles.progressLabel, { color: theme.accent }]}>⭐ {lang === 'ar' ? 'أعلى رتبة' : 'Top rank reached'}</Text>
            )}
          </View>
        </Card>

        <PrimaryButton label={t('urgeButton')} onPress={onUrge} style={styles.urgeBtn} icon="⚡" />
        <Text style={[styles.urgeSub, { color: theme.textFaint }]}>{t('urgeButtonSub')}</Text>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('quickStats')}</Text>
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={[styles.statValue, { color: theme.primary }]}>{resistedCount}</Text>
            <Text style={[styles.statLabel, { color: theme.textDim }]}>{t('urgesResisted')}</Text>
          </Card>
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
  sectionTitle: { fontFamily: Fonts.bold, fontSize: 16, marginTop: 10 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 18, gap: 4 },
  statValue: { fontFamily: Fonts.black, fontSize: 24 },
  statLabel: { fontFamily: Fonts.body, fontSize: 11, textAlign: 'center' },
});
