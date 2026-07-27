import React, { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import Screen from '../../components/Screen';
import Card from '../../components/Card';
import BarChart from '../../components/BarChart';
import { useElapsed } from '../../components/Chronometer';
import { useAppStore } from '../../lib/store';
import { useLang, useT, useTheme } from '../../lib/hooks';
import { Fonts } from '../../lib/fonts';
import { RANKS, rankForDays } from '../../lib/ranks';
import { MILESTONES } from '../../lib/milestones';
import { analyzeUrges, describeInsights, averageMood } from '../../lib/analytics';
import { triggerLabel, triggerDef } from '../../lib/triggers';
import { daysAgo } from '../../lib/dates';
import type { UrgeRecord } from '../../lib/types';

type Segment = 'ranks' | 'timeline' | 'stats' | 'milestones';

function formatDate(ts: number, lang: 'ar' | 'en') {
  const d = new Date(ts);
  return d.toLocaleString(lang === 'ar' ? 'ar' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(sec: number | null, lang: 'ar' | 'en') {
  if (sec == null) return '';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return lang === 'ar' ? `${m} د ${s} ث` : `${m}m ${s}s`;
}

export default function JourneyScreen() {
  const theme = useTheme();
  const lang = useLang();
  const t = useT('journey');
  const [segment, setSegment] = useState<Segment>('ranks');

  const streakStartedAt = useAppStore((s) => s.streakStartedAt);
  const bestStreakDays = useAppStore((s) => s.bestStreakDays);
  const lifetimeCleanDaysBanked = useAppStore((s) => s.lifetimeCleanDaysBanked);
  const resistedCount = useAppStore((s) => s.resistedCount);
  const urges = useAppStore((s) => s.urges);
  const checkIns = useAppStore((s) => s.checkIns);
  const unlockedMilestones = useAppStore((s) => s.unlockedMilestones);

  const { totalMs } = useElapsed(streakStartedAt);
  const currentStreakDays = totalMs / 86400000;
  const totalCleanDays = lifetimeCleanDaysBanked + currentStreakDays;
  const currentRankKey = rankForDays(currentStreakDays).key;

  const allInsights = useMemo(() => analyzeUrges(urges), [urges]);
  const weekInsights = useMemo(() => analyzeUrges(urges, daysAgo(7), 7), [urges]);
  const weekMood = useMemo(() => averageMood(checkIns, daysAgo(7)), [checkIns]);

  const segments: { key: Segment; label: string }[] = [
    { key: 'ranks', label: t('ranksTab') },
    { key: 'milestones', label: t('milestonesTab') },
    { key: 'timeline', label: t('timelineTab') },
    { key: 'stats', label: t('statsTab') },
  ];

  const outcomeLabel = (o: UrgeRecord['outcome']) => {
    if (o === 'resisted') return { text: lang === 'ar' ? 'قاومت' : 'Resisted', color: theme.success };
    if (o === 'relapsed') return { text: lang === 'ar' ? 'انتكاسة' : 'Relapsed', color: theme.danger };
    return { text: lang === 'ar' ? 'جارية' : 'Ongoing', color: theme.warning };
  };

  const dayLabels = lang === 'ar' ? ['أح', 'إث', 'ثل', 'أر', 'خم', 'جم', 'سب'] : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>{t('title')}</Text>
        <View style={[styles.segmentRow, { backgroundColor: theme.surfaceAlt }]}>
          {segments.map((s) => (
            <TouchableOpacity
              key={s.key}
              onPress={() => setSegment(s.key)}
              style={[styles.segmentBtn, segment === s.key ? { backgroundColor: theme.primary } : null]}
            >
              <Text
                style={[
                  styles.segmentLabel,
                  { color: segment === s.key ? (theme.dark ? '#052A26' : '#fff') : theme.textDim },
                ]}
                numberOfLines={1}
              >
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {segment === 'ranks' ? (
        <FlatList
          data={RANKS}
          keyExtractor={(r) => r.key}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const achieved = currentStreakDays >= item.minDays;
            const isCurrent = item.key === currentRankKey;
            return (
              <Card
                style={{
                  ...styles.rankRow,
                  opacity: achieved ? 1 : 0.45,
                  borderColor: isCurrent ? item.colorTo : theme.border,
                  borderWidth: isCurrent ? 2 : StyleSheet.hairlineWidth,
                }}
              >
                <Text style={styles.rankIcon}>{item.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rankName, { color: theme.text }]}>{lang === 'ar' ? item.nameAr : item.nameEn}</Text>
                  <Text style={[styles.rankMeta, { color: theme.textDim }]}>
                    {item.minDays} {lang === 'ar' ? 'يوم+' : 'days+'}
                  </Text>
                  {isCurrent ? (
                    <Text style={[styles.rankTagline, { color: theme.textFaint }]}>
                      {lang === 'ar' ? item.taglineAr : item.taglineEn}
                    </Text>
                  ) : null}
                </View>
                {isCurrent ? <Text style={{ color: item.colorTo, fontFamily: Fonts.bold, fontSize: 11 }}>●</Text> : null}
              </Card>
            );
          }}
        />
      ) : null}

      {segment === 'milestones' ? (
        <FlatList
          data={MILESTONES}
          keyExtractor={(m) => m.key}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const earned = unlockedMilestones.includes(item.key);
            return (
              <Card
                style={{
                  ...styles.milestoneCard,
                  opacity: earned ? 1 : 0.4,
                  borderColor: earned ? theme.accent : theme.border,
                  borderWidth: earned ? 1 : StyleSheet.hairlineWidth,
                }}
              >
                <Text style={styles.milestoneIcon}>{earned ? item.icon : '🔒'}</Text>
                <Text style={[styles.milestoneTitle, { color: theme.text }]} numberOfLines={2}>
                  {lang === 'ar' ? item.titleAr : item.titleEn}
                </Text>
                <Text style={[styles.milestoneBody, { color: theme.textFaint }]} numberOfLines={3}>
                  {earned ? (lang === 'ar' ? item.bodyAr : item.bodyEn) : t('locked')}
                </Text>
              </Card>
            );
          }}
        />
      ) : null}

      {segment === 'timeline' ? (
        <FlatList
          data={urges}
          keyExtractor={(u) => u.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={[styles.empty, { color: theme.textFaint }]}>{t('noEvents')}</Text>}
          renderItem={({ item }) => {
            const outcome = outcomeLabel(item.outcome);
            return (
              <Card style={styles.timelineCard}>
                <View style={styles.timelineHeader}>
                  <Text style={[styles.timelineDate, { color: theme.textDim }]}>{formatDate(item.startedAt, lang)}</Text>
                  <Text style={[styles.badge, { color: outcome.color }]}>{outcome.text}</Text>
                </View>

                {item.triggers?.length ? (
                  <View style={styles.tagRow}>
                    {item.triggers.map((tr) => (
                      <View key={tr} style={[styles.tag, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
                        <Text style={[styles.tagText, { color: theme.textDim }]}>
                          {triggerDef(tr)?.icon} {triggerLabel(tr, lang)}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                {item.feeling ? <Text style={[styles.timelineText, { color: theme.text }]}>💭 {item.feeling}</Text> : null}
                {item.why ? <Text style={[styles.timelineText, { color: theme.textDim }]}>❝ {item.why}</Text> : null}

                <View style={styles.metaRow}>
                  {item.durationSec != null ? (
                    <Text style={[styles.timelineDuration, { color: theme.textFaint }]}>
                      ⏱ {formatDuration(item.durationSec, lang)}
                    </Text>
                  ) : null}
                  {item.intensity != null ? (
                    <Text style={[styles.timelineDuration, { color: theme.textFaint }]}>🌡 {item.intensity}/10</Text>
                  ) : null}
                </View>
              </Card>
            );
          }}
        />
      ) : null}

      {segment === 'stats' ? (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          <View style={styles.statsGrid}>
            <Card style={styles.statBox}>
              <Text style={[styles.statValue, { color: theme.primary }]}>{Math.floor(totalCleanDays)}</Text>
              <Text style={[styles.statLabel, { color: theme.textDim }]}>{t('totalDaysTried')}</Text>
            </Card>
            <Card style={styles.statBox}>
              <Text style={[styles.statValue, { color: theme.text }]}>{Math.floor(bestStreakDays)}</Text>
              <Text style={[styles.statLabel, { color: theme.textDim }]}>{t('longestStreak')}</Text>
            </Card>
            <Card style={styles.statBox}>
              <Text style={[styles.statValue, { color: theme.accent }]}>{allInsights.total}</Text>
              <Text style={[styles.statLabel, { color: theme.textDim }]}>{t('totalUrges')}</Text>
            </Card>
            <Card style={styles.statBox}>
              <Text style={[styles.statValue, { color: theme.success }]}>{allInsights.resistRate}%</Text>
              <Text style={[styles.statLabel, { color: theme.textDim }]}>{t('resistRate')}</Text>
            </Card>
          </View>

          <Card style={{ gap: 14 }}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>{t('last7days')}</Text>
            <BarChart
              bars={weekInsights.dailyCounts.map((d) => ({
                label: dayLabels[new Date(`${d.day}T12:00:00`).getDay()],
                value: d.count,
                negative: d.relapsed,
              }))}
            />
          </Card>

          {allInsights.total > 0 ? (
            <Card style={{ gap: 14 }}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>{t('byHour')}</Text>
              <BarChart
                height={100}
                bars={[0, 3, 6, 9, 12, 15, 18, 21].map((startHour) => {
                  const value = allInsights.hourHistogram
                    .slice(startHour, startHour + 3)
                    .reduce((a, b) => a + b, 0);
                  const isRiskiest =
                    allInsights.riskiestHour !== null &&
                    allInsights.riskiestHour >= startHour &&
                    allInsights.riskiestHour < startHour + 3;
                  return { label: `${startHour}-${startHour + 3}`, value, highlight: isRiskiest };
                })}
              />
            </Card>
          ) : null}

          {allInsights.topTriggers.length > 0 ? (
            <Card style={{ gap: 12 }}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>{t('topTriggers')}</Text>
              {allInsights.topTriggers.map((tr) => {
                const pct = Math.round((tr.count / allInsights.total) * 100);
                return (
                  <View key={tr.key} style={{ gap: 5 }}>
                    <View style={styles.triggerRow}>
                      <Text style={[styles.triggerName, { color: theme.text }]}>
                        {triggerDef(tr.key)?.icon} {triggerLabel(tr.key, lang)}
                      </Text>
                      <Text style={[styles.triggerCount, { color: theme.textFaint }]}>{tr.count}×</Text>
                    </View>
                    <View style={[styles.progressTrack, { backgroundColor: theme.surfaceAlt }]}>
                      <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: theme.accent }]} />
                    </View>
                  </View>
                );
              })}
            </Card>
          ) : null}

          {weekMood !== null ? (
            <Card style={styles.moodCard}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>{t('moodTrend')}</Text>
              <Text style={[styles.moodValue, { color: theme.primary }]}>{weekMood.toFixed(1)} / 5</Text>
            </Card>
          ) : null}

          <Card style={{ gap: 10 }}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>{t('patternsTitle')}</Text>
            {allInsights.total === 0 ? (
              <Text style={[styles.insight, { color: theme.textFaint }]}>{t('noPatterns')}</Text>
            ) : (
              describeInsights(allInsights, lang).map((line, i) => (
                <Text key={i} style={[styles.insight, { color: theme.textDim }]}>
                  • {line}
                </Text>
              ))
            )}
          </Card>
        </ScrollView>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 4, gap: 14 },
  title: { fontFamily: Fonts.black, fontSize: 22 },
  segmentRow: { flexDirection: 'row', borderRadius: 14, padding: 4 },
  segmentBtn: { flex: 1, paddingVertical: 9, paddingHorizontal: 4, borderRadius: 10, alignItems: 'center' },
  segmentLabel: { fontFamily: Fonts.medium, fontSize: 12 },
  list: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 40, gap: 12 },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  rankIcon: { fontSize: 30 },
  rankName: { fontFamily: Fonts.bold, fontSize: 16 },
  rankMeta: { fontFamily: Fonts.body, fontSize: 11, marginTop: 2 },
  rankTagline: { fontFamily: Fonts.body, fontSize: 11, marginTop: 4, lineHeight: 16 },
  milestoneCard: { flex: 1, alignItems: 'center', gap: 7, paddingVertical: 18, paddingHorizontal: 12 },
  milestoneIcon: { fontSize: 30 },
  milestoneTitle: { fontFamily: Fonts.bold, fontSize: 13, textAlign: 'center' },
  milestoneBody: { fontFamily: Fonts.body, fontSize: 10.5, textAlign: 'center', lineHeight: 15 },
  empty: { textAlign: 'center', fontFamily: Fonts.body, fontSize: 13, marginTop: 40 },
  timelineCard: { gap: 8 },
  timelineHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  timelineDate: { fontFamily: Fonts.medium, fontSize: 11 },
  badge: { fontFamily: Fonts.bold, fontSize: 11 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 9, borderWidth: StyleSheet.hairlineWidth },
  tagText: { fontFamily: Fonts.body, fontSize: 10.5 },
  timelineText: { fontFamily: Fonts.body, fontSize: 13, lineHeight: 19 },
  metaRow: { flexDirection: 'row', gap: 14 },
  timelineDuration: { fontFamily: Fonts.body, fontSize: 11 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statBox: { width: '47%', alignItems: 'center', paddingVertical: 22, gap: 6 },
  statValue: { fontFamily: Fonts.black, fontSize: 26 },
  statLabel: { fontFamily: Fonts.body, fontSize: 11, textAlign: 'center' },
  cardTitle: { fontFamily: Fonts.bold, fontSize: 14 },
  triggerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  triggerName: { fontFamily: Fonts.medium, fontSize: 13 },
  triggerCount: { fontFamily: Fonts.body, fontSize: 11 },
  progressTrack: { height: 7, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  moodCard: { alignItems: 'center', gap: 6 },
  moodValue: { fontFamily: Fonts.black, fontSize: 24 },
  insight: { fontFamily: Fonts.body, fontSize: 13, lineHeight: 21 },
});
