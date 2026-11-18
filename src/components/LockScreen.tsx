import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { biometricAvailable, unlockWithBiometric } from '../services/biometrics';
import { checkPasscode } from '../services/secure';
import { useTheme } from '../theme/BookTheme';
import { useDiary } from '../store/useDiary';

export function PasscodePad({
  title,
  subtitle,
  onComplete,
  errorMessage,
}: {
  title: string;
  subtitle?: string;
  onComplete: (pin: string) => void;
  errorMessage?: string;
}) {
  const theme = useTheme();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  function push(digit: string) {
    if (pin.length >= 4) return;
    const next = pin + digit;
    setPin(next);
    setError('');
    if (next.length === 4) {
      onComplete(next);
      setPin('');
    }
  }

  return (
    <View style={styles.padWrap}>
      <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 32, textAlign: 'center' }}>{title}</Text>
      {subtitle ? <Text style={[styles.sub, { color: theme.colors.inkSoft, fontFamily: theme.body }]}>{subtitle}</Text> : null}
      <View style={styles.dots}>
        {[0, 1, 2, 3].map((index) => (
          <View key={index} style={[styles.dot, { backgroundColor: index < pin.length ? theme.colors.accent : 'transparent', borderColor: theme.colors.accent }]} />
        ))}
      </View>
      {error || errorMessage ? <Text style={{ color: theme.colors.danger, textAlign: 'center', fontFamily: theme.body }}>{error || errorMessage}</Text> : null}
      <View style={styles.grid}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((key) =>
          key === '' ? (
            <View key="spacer" style={styles.key} />
          ) : (
            <Pressable
              key={key}
              accessibilityLabel={key === 'del' ? 'Delete' : key}
              onPress={() => (key === 'del' ? setPin((value) => value.slice(0, -1)) : push(key))}
              style={[styles.key, { backgroundColor: theme.colors.card, borderRadius: theme.radius }]}
            >
              <Text style={{ color: theme.colors.ink, fontFamily: theme.body, fontSize: 22 }}>{key === 'del' ? '⌫' : key}</Text>
            </Pressable>
          ),
        )}
      </View>
      <SetError onError={setError} />
    </View>
  );
}

function SetError({ onError }: { onError: (message: string) => void }) {
  return <ErrorBridge onError={onError} />;
}

function ErrorBridge({ onError }: { onError: (message: string) => void }) {
  useEffect(() => {
    errorSink = onError;
    return () => {
      errorSink = null;
    };
  }, [onError]);
  return null;
}

let errorSink: ((message: string) => void) | null = null;
export function showPasscodeError(message: string) {
  errorSink?.(message);
}

export function LockOverlay() {
  const theme = useTheme();
  const lockEnabled = useDiary((state) => state.settings.lockEnabled);
  const biometricsOn = useDiary((state) => state.settings.biometricsEnabled);
  const [unlocked, setUnlocked] = useState(false);
  const [bio, setBio] = useState(false);

  useEffect(() => {
    if (!lockEnabled) setUnlocked(false);
  }, [lockEnabled]);

  useEffect(() => {
    if (!lockEnabled || !biometricsOn) return;
    biometricAvailable().then((available) => {
      setBio(available);
      if (available) {
        unlockWithBiometric().then((ok) => {
          if (ok) setUnlocked(true);
        });
      }
    });
  }, [lockEnabled, biometricsOn]);

  if (!lockEnabled || unlocked) return null;

  return (
    <View style={[styles.overlay, { backgroundColor: theme.colors.bg }]}>
      <PasscodePad
        title="Diary locked"
        subtitle="Enter the four-digit passcode."
        onComplete={async (pin) => {
          const ok = await checkPasscode(pin);
          if (ok) setUnlocked(true);
          else showPasscodeError('That passcode does not open the book.');
        }}
      />
      {bio ? (
        <Pressable onPress={() => unlockWithBiometric().then((ok) => ok && setUnlocked(true))} style={{ marginTop: 12 }}>
          <Text style={{ color: theme.colors.accent, fontFamily: theme.body, fontSize: 16, textAlign: 'center' }}>Use Face ID or fingerprint</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 40, justifyContent: 'center', padding: 24 },
  padWrap: { width: '100%', maxWidth: 360, alignSelf: 'center' },
  sub: { textAlign: 'center', marginTop: 8, fontSize: 15 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginVertical: 18 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  key: { width: 72, height: 64, alignItems: 'center', justifyContent: 'center' },
});
