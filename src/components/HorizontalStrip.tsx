import { useCallback, type ReactNode } from 'react';
import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';

import { holdStrip } from '../logic/pageGesture';

function markStrip(node: unknown) {
  const el = node as { setAttribute?: (name: string, value: string) => void; getScrollableNode?: () => { setAttribute?: (name: string, value: string) => void } } | null;
  el?.setAttribute?.('data-no-page-turn', '1');
  el?.getScrollableNode?.()?.setAttribute?.('data-no-page-turn', '1');
}

/** A sideways scroller. Touches that start here scroll the strip and never turn the page. */
export function HorizontalStrip({
  children,
  contentContainerStyle,
  style,
}: {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
}) {
  const ref = useCallback((node: unknown) => markStrip(node), []);
  return (
    <View ref={ref} onTouchStart={() => holdStrip(true)} onTouchEnd={() => holdStrip(false)} onTouchCancel={() => holdStrip(false)}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        ref={ref}
        style={[{ touchAction: 'pan-x' } as ViewStyle, style]}
        contentContainerStyle={contentContainerStyle}
      >
        {children}
      </ScrollView>
    </View>
  );
}
