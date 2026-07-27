import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { useLang, useT, useTheme } from '../lib/hooks';
import { Fonts } from '../lib/fonts';

export default function ReasonsEditor({
  reasons,
  onAdd,
  onRemove,
}: {
  reasons: string[];
  onAdd: (reason: string) => void;
  onRemove: (index: number) => void;
}) {
  const theme = useTheme();
  const lang = useLang();
  const t = useT('onboarding');
  const tc = useT('common');
  const [draft, setDraft] = useState('');

  const submit = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setDraft('');
  };

  return (
    <View style={styles.wrap}>
      <View style={[styles.inputRow, { borderColor: theme.border, backgroundColor: theme.surfaceAlt }]}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={submit}
          placeholder={t('reasonPlaceholder')}
          placeholderTextColor={theme.textFaint}
          returnKeyType="done"
          textAlign={lang === 'ar' ? 'right' : 'left'}
          style={[styles.input, { color: theme.text }]}
        />
        <TouchableOpacity
          onPress={submit}
          disabled={!draft.trim()}
          style={[styles.addBtn, { backgroundColor: draft.trim() ? theme.primary : theme.border }]}
        >
          <Text style={{ fontSize: 18, color: theme.dark ? '#052A26' : '#fff' }}>＋</Text>
        </TouchableOpacity>
      </View>

      {reasons.length === 0 ? (
        <Text style={[styles.hint, { color: theme.textFaint }]}>{t('reasonsHint')}</Text>
      ) : (
        <View style={{ gap: 8 }}>
          {reasons.map((reason, i) => (
            <View key={`${reason}-${i}`} style={[styles.reasonRow, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
              <Text style={[styles.bullet, { color: theme.accent }]}>❝</Text>
              <Text style={[styles.reasonText, { color: theme.text }]}>{reason}</Text>
              <TouchableOpacity onPress={() => onRemove(i)} accessibilityLabel={tc('delete')}>
                <Text style={{ color: theme.textFaint, fontSize: 15 }}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingStart: 14,
    paddingEnd: 6,
    paddingVertical: 6,
  },
  input: { flex: 1, fontFamily: Fonts.body, fontSize: 14, paddingVertical: 6 },
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  hint: { fontFamily: Fonts.body, fontSize: 12, textAlign: 'center', lineHeight: 18 },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  bullet: { fontSize: 14, fontFamily: Fonts.verseBold },
  reasonText: { flex: 1, fontFamily: Fonts.body, fontSize: 13.5, lineHeight: 20 },
});
