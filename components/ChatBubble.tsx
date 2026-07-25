import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../lib/hooks';
import { Fonts } from '../lib/fonts';
import type { ChatMessage } from '../lib/types';

export default function ChatBubble({ message }: { message: ChatMessage }) {
  const theme = useTheme();
  const isUser = message.role === 'user';

  return (
    <View style={[styles.row, { justifyContent: isUser ? 'flex-end' : 'flex-start' }]}>
      <View
        style={[
          styles.bubble,
          isUser
            ? { backgroundColor: theme.primary, borderBottomRightRadius: 4 }
            : { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: StyleSheet.hairlineWidth, borderBottomLeftRadius: 4 },
        ]}
      >
        <Text
          style={[
            styles.text,
            { color: isUser ? (theme.dark ? '#052A26' : '#fff') : theme.text },
            message.tool === 'verse' ? { fontFamily: Fonts.verseBold, fontSize: 17, lineHeight: 30 } : null,
          ]}
        >
          {message.text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginVertical: 6, paddingHorizontal: 4 },
  bubble: { maxWidth: '82%', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 18 },
  text: { fontFamily: Fonts.body, fontSize: 15, lineHeight: 22 },
});
