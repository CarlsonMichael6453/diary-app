import { useEffect, useRef, useState } from 'react';
import { Animated, AppState, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { isShake, isWiggle, type MotionSample } from '../logic/motion';
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
  const shakeToOpen = useDiary((state) => state.settings.shakeToOpen);
  const lockEnabled = useDiary((state) => state.settings.lockEnabled);
  const bookTitle = useDiary((state) => state.settings.bookTitle);
  const screen = useWindowDimensions();
  const coverWidth = Math.round(Math.min(screen.width - 48, (screen.height - 230) / 1.35, 300));
  const [open, setOpen] = useState(false);
  const [bio, setBio] = useState(false);
  const swing = useRef(new Animated.Value(0)).current;
  const jiggle = useRef(new Animated.Value(0)).current;
  const samples = useRef<MotionSample[]>([]);
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

  function reactToMotion(x: number, kind: 'shake' | 'wiggle') {
    if (!shakeToOpen || reduceMotion || open) return;
    const now = Date.now();
    samples.current = [...samples.current, { t: now, x }].slice(-30);
    const hit = kind === 'shake' ? isShake(samples.current, now) : isWiggle(samples.current, now);
    if (!reduceMotion) {
      Animated.sequence([
        Animated.timing(jiggle, { toValue: 1, duration: 70, useNativeDriver: true }),
        Animated.timing(jiggle, { toValue: -1, duration: 90, useNativeDriver: true }),
        Animated.timing(jiggle, { toValue: 0, duration: 70, useNativeDriver: true }),
      ]).start();
    }
    if (!hit) return;
    samples.current = [];
    if (lockOnOpen && (lockEnabled || bio)) {
      if (bio) unlockWithBiometric().then((ok) => ok && openBook());
      return;
    }
    openBook();
  }

  useEffect(() => {
    if (Platform.OS === 'web' || !shakeToOpen || reduceMotion || open) return;
    let remove = () => {};
    import('expo-sensors')
      .then(({ Accelerometer }) => {
        Accelerometer.setUpdateInterval(80);
        const subscription = Accelerometer.addListener(({ x, y, z }) => reactToMotion(x + y + z, 'shake'));
        remove = () => subscription.remove();
      })
      .catch(() => undefined);
    return () => remove();
    // Motion samples live in a ref. The listener is rebuilt when the gates change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shakeToOpen, reduceMotion, open, lockOnOpen, lockEnabled, bio]);

  useEffect(() => {
    if (lockOnOpen || open || (shakeToOpen && !reduceMotion)) return;
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
      {
        rotate: jiggle.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-7deg', '0deg', '7deg'] }),
      },
    ],
    opacity: swing.interpolate({ inputRange: [0, 0.72, 1], outputRange: [1, 1, 0] }),
  };

  return (
    <View
      style={[styles.overlay, { backgroundColor: theme.colors.bg }]}
      onPointerMove={
        Platform.OS === 'web' && shakeToOpen
          ? (event) => reactToMotion((event.nativeEvent as { pageX?: number }).pageX ?? 0, 'wiggle')
          : undefined
      }
    >
      <Animated.View style={coverStyle}>
        <BookCover title={bookTitle} theme={theme} width={coverWidth} />
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
          <Text style={{ color: theme.colors.ink, fontFamily: theme.body, textAlign: 'center' }}>{Platform.OS === 'web' ? 'Wiggle to open' : 'Shake to open'}</Text>
          <Pressable onPress={openBook} accessibilityRole="button" accessibilityLabel="Tap to open">
            <Text style={{ color: theme.colors.accent, fontFamily: theme.body, fontSize: 18 }}>Tap to open</Text>
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
