import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import Screen from '../../components/Screen';
import Card from '../../components/Card';
import { useElapsed } from '../../components/Chronometer';
import { useAppStore } from '../../lib/store';
import { useLang, useT, useTheme } from '../../lib/hooks';
import { Fonts } from '../../lib/fonts';
import { RANKS, rankForDays } from '../../lib/ranks';
import type { UrgeRecord } from '../../lib/types';

type Segment = 'ranks' | 'timeline' | 'stats';

function formatDate(ts: number, lang: 'ar' | 'en') {
  const d = new Date(ts);
  return d.toLocaleString(lang === 'ar' ? 'ar' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
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
  const relapseCount = useAppStore((s) => s.relapseCount);
  const urges = useAppStore((s) => s.urges);

  const { totalMs } = useElapsed(streakStartedAt);
  const currentStreakDays = totalMs / 86400000;
  const totalCleanDays = lifetimeCleanDaysBanked + currentStreakDays;

  const currentRankKey = rankForDays(currentStreakDays).key;
  const totalUrges = urges.length;
  const resistRate = totalUrges > 0 ? Math.round((resistedCount / totalUrges) * 100) : 0;

  const segments: { key: Segment; label: string }[] = [
    { key: 'ranks', label: t('ranksTab') },
    { key: 'timeline', label: t('timelineTab') },
    { key: 'stats', label: t('statsTab') },
  ];

  const outcomeLabel = (o: UrgeRecord['outcome']) => {
    if (o === 'resisted') return { text: lang === 'ar' ? 'قاومت' : 'Resisted', color: theme.success };
    if (o === 'relapsed') return { text: lang === 'ar' ? 'انتكاسة' : 'Relapsed', color: theme.danger };
    return { text: lang === 'ar' ? 'جارية' : 'Ongoing', color: theme.warning };
  };

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
            const name = lang === 'ar' ? item.nameAr : item.nameEn;
            const tagline = lang === 'ar' ? item.taglineAr : item.taglineEn;
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
                  <Text style={[styles.rankName, { color: theme.text }]}>{name}</Text>
                  <Text style={[styles.rankMeta, { color: theme.textDim }]}>
                    {item.minDays} {lang === 'ar' ? 'يوم+' : 'days+'}
                  </Text>
                  {isCurrent ? <Text style={[styles.rankTagline, { color: theme.textFaint }]}>{tagline}</Text> : null}
                </View>
                {isCurrent ? <Text style={{ color: item.colorTo, fontFamily: Fonts.bold, fontSize: 11 }}>●</Text> : null}
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
                {item.feeling ? <Text style={[styles.timelineText, { color: theme.text }]}>💭 {item.feeling}</Text> : null}
                {item.why ? <Text style={[styles.timelineText, { color: theme.textDim }]}>❝ {item.why}</Text> : null}
                {item.durationSec != null ? (
                  <Text style={[styles.timelineDuration, { color: theme.textFaint }]}>⏱ {formatDuration(item.durationSec, lang)}</Text>
                ) : null}
              </Card>
            );
          }}
        />
      ) : null}

      {segment === 'stats' ? (
        <View style={styles.list}>
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
              <Text style={[styles.statValue, { color: theme.accent }]}>{totalUrges}</Text>
              <Text style={[styles.statLabel, { color: theme.textDim }]}>{t('totalUrges')}</Text>
            </Card>
            <Card style={styles.statBox}>
              <Text style={[styles.statValue, { color: theme.success }]}>{resistRate}%</Text>
              <Text style={[styles.statLabel, { color: theme.textDim }]}>{t('resistRate')}</Text>
            </Card>
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingTop: 4, gap: 14 },
  title: { fontFamily: Fonts.black, fontSize: 22 },
  segmentRow: { flexDirection: 'row', borderRadius: 14, padding: 4 },
  segmentBtn: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
  segmentLabel: { fontFamily: Fonts.medium, fontSize: 13 },
  list: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 40, gap: 12 },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  rankIcon: { fontSize: 30 },
  rankName: { fontFamily: Fonts.bold, fontSize: 16 },
  rankMeta: { fontFamily: Fonts.body, fontSize: 11, marginTop: 2 },
  rankTagline: { fontFamily: Fonts.body, fontSize: 11, marginTop: 4, lineHeight: 16 },
  empty: { textAlign: 'center', fontFamily: Fonts.body, fontSize: 13, marginTop: 40 },
  timelineCard: { gap: 6 },
  timelineHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  timelineDate: { fontFamily: Fonts.medium, fontSize: 11 },
  badge: { fontFamily: Fonts.bold, fontSize: 11 },
  timelineText: { fontFamily: Fonts.body, fontSize: 13, lineHeight: 19 },
  timelineDuration: { fontFamily: Fonts.body, fontSize: 11, marginTop: 2 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statBox: { width: '47%', alignItems: 'center', paddingVertical: 22, gap: 6 },
  statValue: { fontFamily: Fonts.black, fontSize: 26 },
  statLabel: { fontFamily: Fonts.body, fontSize: 11, textAlign: 'center' },
});
