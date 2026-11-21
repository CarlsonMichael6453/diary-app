import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useTheme } from '../theme/BookTheme';

/** Fade a toolbar out, then drop it so the page can use the space. */
export function FadeChrome({
  hidden,
  children,
  style,
}: {
  hidden: boolean;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const opacity = useRef(new Animated.Value(hidden ? 0 : 1)).current;
  const [gone, setGone] = useState(hidden);

  useEffect(() => {
    if (!hidden) setGone(false);
    const animation = Animated.timing(opacity, { toValue: hidden ? 0 : 1, duration: 220, useNativeDriver: false });
    animation.start(({ finished }) => {
      if (finished && hidden) setGone(true);
    });
    return () => animation.stop();
  }, [hidden, opacity]);

  if (gone && hidden) return null;
  return (
    <Animated.View pointerEvents={hidden ? 'none' : 'box-none'} style={[{ opacity }, style]}>
      {children}
    </Animated.View>
  );
}

export function DeepWritingButton({ on, onPress }: { on: boolean; onPress: () => void }) {
  const theme = useTheme();
  const ink = on ? theme.colors.onAccent : theme.colors.inkSoft;
  return (
    <Pressable
      accessibilityLabel="Deep writing mode"
      accessibilityState={{ selected: on }}
      onPress={onPress}
      style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? theme.colors.accent : 'transparent' }}
    >
      <Svg width={18} height={18} viewBox="0 0 18 18">
        <Path d="M3 6 V3 H6 M12 3 H15 V6 M15 12 V15 H12 M6 15 H3 V12" stroke={ink} strokeWidth={1.6} fill="none" strokeLinecap="round" />
      </Svg>
    </Pressable>
  );
}
