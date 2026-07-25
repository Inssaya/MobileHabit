import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';

import Card from '../Card';
import { useAppStore } from '../../lib/store';
import { useT, useTheme } from '../../lib/hooks';
import { Fonts } from '../../lib/fonts';

function formatTime(sec: number) {
  if (!isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function VoiceRow({ uri, durationSec, onDelete }: { uri: string; durationSec: number; onDelete: () => void }) {
  const theme = useTheme();
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);

  return (
    <Card style={styles.row}>
      <TouchableOpacity onPress={() => (status.playing ? player.pause() : player.play())} style={[styles.playBtn, { backgroundColor: theme.primary }]}>
        <Text style={{ fontSize: 14 }}>{status.playing ? '⏸' : '▶'}</Text>
      </TouchableOpacity>
      <Text style={[styles.duration, { color: theme.text }]}>{formatTime(durationSec)}</Text>
      <View style={{ flex: 1 }} />
      <TouchableOpacity onPress={onDelete}>
        <Text style={{ color: theme.danger, fontSize: 16 }}>🗑</Text>
      </TouchableOpacity>
    </Card>
  );
}

export default function VaultVoiceTab() {
  const theme = useTheme();
  const t = useT('vault');
  const voice = useAppStore((s) => s.vault.voice);
  const addVaultVoice = useAppStore((s) => s.addVaultVoice);
  const removeVaultVoice = useAppStore((s) => s.removeVaultVoice);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const [preparing, setPreparing] = useState(false);

  const startRecording = async () => {
    setPreparing(true);
    try {
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!perm.granted) return;
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
    } finally {
      setPreparing(false);
    }
  };

  const stopRecording = async () => {
    await recorder.stop();
    if (recorder.uri) {
      addVaultVoice({ uri: recorder.uri, durationSec: Math.round(recorderState.durationMillis / 1000) });
    }
    await setAudioModeAsync({ allowsRecording: false });
  };

  return (
    <View style={styles.wrap}>
      <FlatList
        data={voice}
        keyExtractor={(v) => v.id}
        contentContainerStyle={{ gap: 10, paddingBottom: 8 }}
        ListEmptyComponent={<Text style={[styles.empty, { color: theme.textFaint }]}>{t('empty')}</Text>}
        renderItem={({ item }) => (
          <VoiceRow uri={item.uri} durationSec={item.durationSec} onDelete={() => removeVaultVoice(item.id)} />
        )}
      />

      <TouchableOpacity
        onPress={recorderState.isRecording ? stopRecording : startRecording}
        disabled={preparing}
        style={[
          styles.recordBtn,
          { backgroundColor: recorderState.isRecording ? theme.danger : theme.primary, opacity: preparing ? 0.6 : 1 },
        ]}
      >
        <Text style={styles.recordIcon}>{recorderState.isRecording ? '⏹' : '🎙'}</Text>
        <Text style={[styles.recordLabel, { color: theme.dark ? '#052A26' : '#fff' }]}>
          {recorderState.isRecording ? `${t('stopRecording')} · ${formatTime(recorderState.durationMillis / 1000)}` : t('recordNew')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, gap: 12 },
  empty: { textAlign: 'center', fontFamily: Fonts.body, fontSize: 13, marginTop: 30 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  playBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  duration: { fontFamily: Fonts.medium, fontSize: 13 },
  recordBtn: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 18 },
  recordIcon: { fontSize: 18 },
  recordLabel: { fontFamily: Fonts.bold, fontSize: 15 },
});
