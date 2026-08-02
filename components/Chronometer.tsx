import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../lib/hooks';
import { Fonts } from '../lib/fonts';

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

export function useElapsed(startedAt: number | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!startedAt) return;
    const int = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(int);
  }, [startedAt]);
  if (!startedAt) return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
  const totalMs = Math.max(0, now - startedAt);
  const totalSec = Math.floor(totalMs / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return { days, hours, minutes, seconds, totalMs };
}

export default function Chronometer({
  startedAt,
  size = 'large',
}: {
  startedAt: number | null;
  size?: 'large' | 'medium';
}) {
  const theme = useTheme();
  const { days, hours, minutes, seconds } = useElapsed(startedAt);
  const big = size === 'large';

  return (
    <View style={styles.wrap}>
      <Text
        style={[
          {
            fontFamily: Fonts.black,
            color: theme.text,
            fontSize: big ? 72 : 40,
            textShadowColor: theme.glow,
            textShadowRadius: big ? 24 : 12,
            textShadowOffset: { width: 0, height: 0 },
          },
        ]}
      >
        {days}
      </Text>
      <Text
        style={{
          fontFamily: Fonts.medium,
          color: theme.textDim,
          fontSize: big ? 16 : 13,
          letterSpacing: 1,
          marginTop: -4,
        }}
      >
        {hours > 0 || minutes > 0 || seconds >= 0 ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
