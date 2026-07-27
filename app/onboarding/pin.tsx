import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import Screen from '../../components/Screen';
import StepDots from '../../components/StepDots';
import PinPad from '../../components/PinPad';
import { GhostButton } from '../../components/Buttons';
import { useAppStore } from '../../lib/store';
import { useTheme, useT } from '../../lib/hooks';
import { Fonts } from '../../lib/fonts';
import { hashPin } from '../../lib/pin';

const PIN_LENGTH = 4;

export default function PinScreen() {
  const theme = useTheme();
  const t = useT('onboarding');
  const tc = useT('common');
  const setPinHash = useAppStore((s) => s.setPinHash);

  const [stage, setStage] = useState<'create' | 'confirm'>('create');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (stage === 'create' && pin.length === PIN_LENGTH) {
      setTimeout(() => setStage('confirm'), 150);
    }
  }, [pin, stage]);

  useEffect(() => {
    if (stage === 'confirm' && confirmPin.length === PIN_LENGTH) {
      if (confirmPin === pin) {
        hashPin(pin).then((hash) => {
          setPinHash(hash);
          router.push('/onboarding/welcome');
        });
      } else {
        setError(true);
        setTimeout(() => {
          setError(false);
          setConfirmPin('');
        }, 700);
      }
    }
  }, [confirmPin, pin, stage, setPinHash]);

  return (
    <Screen style={styles.screen}>
      <View style={styles.top}>
        <StepDots total={5} current={4} />
        <Text style={[styles.title, { color: theme.text }]}>{stage === 'create' ? t('pinTitle') : t('pinConfirmTitle')}</Text>
        <Text style={[styles.sub, { color: theme.textDim }]}>{stage === 'create' ? t('pinSub') : error ? t('pinMismatch') : ' '}</Text>
      </View>

      <PinPad value={stage === 'create' ? pin : confirmPin} onChange={stage === 'create' ? setPin : setConfirmPin} error={error} />

      <GhostButton
        label={tc('back')}
        onPress={() => {
          if (stage === 'confirm') {
            setStage('create');
            setPin('');
            setConfirmPin('');
          } else {
            router.back();
          }
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24, justifyContent: 'space-between', alignItems: 'center' },
  top: { gap: 14, alignItems: 'center', marginTop: 12 },
  title: { fontFamily: Fonts.black, fontSize: 22, textAlign: 'center', marginTop: 10 },
  sub: { fontFamily: Fonts.body, fontSize: 13, textAlign: 'center', minHeight: 18 },
});
