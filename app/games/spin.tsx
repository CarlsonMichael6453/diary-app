import { router, type Href } from 'expo-router';
import { useRef, useState } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';
import Svg, { G, Path, Text as SvgText } from 'react-native-svg';

import { RewardCard } from '@/src/components/RewardCard';
import { ReviewPrompt, useReviewMoment } from '@/src/components/ReviewPrompt';
import { Screen } from '@/src/components/Screen';
import { todayKey } from '@/src/logic/dates';
import { rewardPoolFor } from '@/src/logic/packs';
import { SPIN_SEGMENTS, resolveReward, spinReward, type ResolvedReward } from '@/src/logic/rewards';
import { birthdayFrom } from '@/src/logic/seasons';
import { useDiary } from '@/src/store/useDiary';
import { useTheme } from '@/src/theme/BookTheme';

function wedge(cx: number, cy: number, r: number, start: number, end: number) {
  const p = (angle: number) => {
    const rad = (angle * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  };
  const [x1, y1] = p(start);
  const [x2, y2] = p(end);
  const large = end - start > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
}

export default function SpinScreen() {
  const theme = useTheme();
  const wallet = useDiary((state) => state.wallet);
  const grantReward = useDiary((state) => state.grantReward);
  const markSpin = useDiary((state) => state.markSpin);
  const rotation = useRef(new Animated.Value(0)).current;
  const [spinning, setSpinning] = useState(false);
  const [reward, setReward] = useState<ResolvedReward | null>(null);
  const review = useReviewMoment();
  const today = todayKey();
  const used = wallet.lastSpinDate === today;
  const slice = 360 / SPIN_SEGMENTS.length;

  function spin() {
    if (spinning || used) return;
    const index = Math.floor(Math.random() * SPIN_SEGMENTS.length);
    const turns = 5 * 360;
    const target = turns - (index + 0.5) * slice;
    setSpinning(true);
    rotation.setValue(0);
    Animated.timing(rotation, { toValue: target, duration: 3400, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start(() => {
      const settings = useDiary.getState().settings;
      const pool = rewardPoolFor(settings.debugDate, birthdayFrom(settings.birthdayMonth, settings.birthdayDay));
      const resolved = resolveReward(spinReward(index), pool, wallet.ownedStickerIds, wallet.ownedOutfitIds);
      grantReward(resolved);
      markSpin(today);
      setReward(resolved);
      setSpinning(false);
      void review.consider('game-won');
    });
  }

  const spinStyle = {
    transform: [{ rotate: rotation.interpolate({ inputRange: [0, 3600], outputRange: ['0deg', '3600deg'] }) }],
  };

  return (
    <Screen>
      <Pressable onPress={() => router.back()}><Text style={{ color: theme.colors.ink, fontFamily: theme.body }}>Back</Text></Pressable>
      <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 36, marginTop: 8 }}>Daily spin</Text>
      <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body }}>{used ? 'The wheel rests until tomorrow.' : 'One spin. The pointer is the gold triangle.'}</Text>
      <View style={{ alignItems: 'center', marginTop: 18 }}>
        <View style={{ width: 0, height: 0, borderLeftWidth: 10, borderRightWidth: 10, borderBottomWidth: 18, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#E2B23A', transform: [{ rotate: '180deg' }], marginBottom: -6, zIndex: 2 }} />
        <Animated.View style={spinStyle}>
          <Svg width={280} height={280} viewBox="0 0 280 280">
            <G>
              {SPIN_SEGMENTS.map((segment, index) => {
                const start = -90 + index * slice;
                const end = start + slice;
                const mid = (start + end) / 2;
                const rad = (mid * Math.PI) / 180;
                return (
                  <G key={segment.label}>
                    <Path d={wedge(140, 140, 130, start, end)} fill={segment.color} stroke="#fff" strokeWidth={2} />
                    <SvgText x={140 + Math.cos(rad) * 78} y={140 + Math.sin(rad) * 78} fill="#1A1420" fontSize={12} textAnchor="middle">
                      {segment.label}
                    </SvgText>
                  </G>
                );
              })}
            </G>
          </Svg>
        </Animated.View>
      </View>
      {!reward ? (
        <Pressable disabled={used || spinning} onPress={spin} style={{ marginTop: 16, backgroundColor: used ? theme.colors.chip : theme.colors.accent, borderRadius: theme.radius, padding: 14, alignItems: 'center' }}>
          <Text style={{ color: used ? theme.colors.chipInk : theme.colors.onAccent, fontFamily: theme.body }}>{spinning ? 'Spinning…' : used ? 'Come back tomorrow' : 'Spin'}</Text>
        </Pressable>
      ) : (
        <View style={{ marginTop: 12 }}>
          <RewardCard reward={reward} onClose={() => router.back()} />
        </View>
      )}
      {review.visible ? (
        <ReviewPrompt
          onClose={review.hide}
          onFeedback={() => {
            review.hide();
            router.push('/feedback' as Href);
          }}
        />
      ) : null}
    </Screen>
  );
}
