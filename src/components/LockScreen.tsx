import { useEffect, useRef, useState } from 'react';
import { Animated, AppState, Pressable, StyleSheet, Text, View } from 'react-native';

import { BookCover } from './BookCover';
import { biometricAvailable, unlockWithBiometric } from '../services/biometrics';
import { playPageTurn } from '../services/sounds';
import { checkPasscode } from '../services/secure';
import { useReduceMotion } from '../theme/useReduceMotion';
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
  const reduceMotion = useReduceMotion();
  const lockOnOpen = useDiary((state) => state.settings.lockOnOpen);
  const lockEnabled = useDiary((state) => state.settings.lockEnabled);
  const bookTitle = useDiary((state) => state.settings.bookTitle);
  const [open, setOpen] = useState(false);
  const [bio, setBio] = useState(false);
  const swing = useRef(new Animated.Value(0)).current;
  const appState = useRef(AppState.currentState);
  const prompted = useRef(false);

  function shut() {
    swing.setValue(0);
    setOpen(false);
    prompted.current = false;
  }

  function finishOpen() {
    setOpen(true);
  }

  function openBook() {
    playPageTurn();
    if (reduceMotion) {
      finishOpen();
      return;
    }
    Animated.timing(swing, { toValue: 1, duration: 560, useNativeDriver: true }).start(({ finished }) => {
      if (finished) finishOpen();
    });
  }

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      const returning = Boolean(appState.current?.match(/inactive|background/)) && next === 'active';
      appState.current = next;
      if (returning && useDiary.getState().settings.lockOnOpen) shut();
    });
    return () => subscription.remove();
  }, [swing]);

  useEffect(() => {
    if (lockOnOpen || open) return;
    const timer = setTimeout(openBook, 900);
    return () => clearTimeout(timer);
    // The brief cover plays once each time the book is shut.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockOnOpen, open]);

  useEffect(() => {
    if (!lockOnOpen || open) return;
    biometricAvailable().then((available) => {
      setBio(available);
      if (available && !prompted.current) {
        prompted.current = true;
        unlockWithBiometric().then((ok) => {
          if (ok) openBook();
        });
      }
    });
    // Prompt once per closed state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockOnOpen, open]);

  if (open) return null;

  const coverStyle = {
    transform: [
      { perspective: 900 },
      {
        rotateY: swing.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '-78deg'],
        }),
      },
    ],
    opacity: swing.interpolate({ inputRange: [0, 0.72, 1], outputRange: [1, 1, 0] }),
  };

  return (
    <View style={[styles.overlay, { backgroundColor: theme.colors.bg }]}>
      <Animated.View style={coverStyle}>
        <BookCover title={bookTitle} theme={theme} />
      </Animated.View>
      {lockOnOpen && lockEnabled ? (
        <View style={{ marginTop: 18, width: '100%' }}>
          <PasscodePad
            title="Open the book"
            subtitle="Passcode, or Face ID when this phone has it."
            onComplete={async (pin) => {
              const ok = await checkPasscode(pin);
              if (ok) openBook();
              else showPasscodeError('That passcode does not open the book.');
            }}
          />
          {bio ? (
            <Pressable onPress={() => unlockWithBiometric().then((ok) => ok && openBook())} style={{ marginTop: 8 }}>
              <Text style={{ color: theme.colors.accent, fontFamily: theme.body, fontSize: 16, textAlign: 'center' }}>Use Face ID or fingerprint</Text>
            </Pressable>
          ) : null}
        </View>
      ) : lockOnOpen ? (
        <View style={{ marginTop: 18, alignItems: 'center', gap: 8, width: '100%', maxWidth: 420 }}>
          <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body, textAlign: 'center' }}>
            {bio ? 'Face ID can open it. A passcode in Settings keeps it shut on the web too.' : 'Tap the cover to open. Set a passcode in Settings if you want it to stay shut.'}
          </Text>
          <Pressable onPress={openBook} accessibilityRole="button" accessibilityLabel="Open the diary">
            <Text style={{ color: theme.colors.accent, fontFamily: theme.body, fontSize: 18 }}>Open</Text>
          </Pressable>
        </View>
      ) : (
        <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body, marginTop: 16 }}>Opening…</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 40, justifyContent: 'center', alignItems: 'center', padding: 24 },
  padWrap: { width: '100%', maxWidth: 360, alignSelf: 'center' },
  sub: { textAlign: 'center', marginTop: 8, fontSize: 15 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginVertical: 18 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  key: { width: 72, height: 64, alignItems: 'center', justifyContent: 'center' },
});
