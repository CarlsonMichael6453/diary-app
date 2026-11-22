import { useEffect, useRef, type ReactNode } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { holdDecoration } from '../logic/pageGesture';
import { lockOpenMenu, rememberMenuScroll } from '../logic/menuScroll';
import { useTheme } from '../theme/BookTheme';

let holds = 0;

function retainPage(): () => void {
  holds += 1;
  if (holds === 1) holdDecoration(true);
  let done = false;
  return () => {
    if (done) return;
    done = true;
    holds = Math.max(0, holds - 1);
    if (holds === 0) holdDecoration(false);
  };
}

function Chevron({ open, color }: { open: boolean; color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14">
      <Path d={open ? 'M3 9 L7 5 L11 9' : 'M3 5 L7 9 L11 5'} stroke={color} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const listStyle = {
  height: 168,
  maxHeight: 168,
  overflowY: 'scroll',
  WebkitOverflowScrolling: 'touch',
  overscrollBehavior: 'contain',
  touchAction: 'pan-y',
} as object;

export function ChoiceMenu({
  label,
  summary,
  open,
  onToggle,
  children,
  pinPage = true,
}: {
  label: string;
  summary: ReactNode;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  /** Page menus hold the diary still. Browsing filters leave page turns alone. */
  pinPage?: boolean;
}) {
  const theme = useTheme();
  const host = useRef<any>(null);
  const list = useRef<any>(null);

  useEffect(() => {
    if (!open || !pinPage) return;
    const node = (host.current as HTMLElement | null) ?? null;
    const releaseMenu = Platform.OS === 'web' ? lockOpenMenu(node) : null;
    const releaseHold = retainPage();
    return () => {
      releaseHold();
      releaseMenu?.();
    };
  }, [open, pinPage]);

  useEffect(() => {
    const hostNode = host.current as HTMLElement | null;
    const node = list.current as HTMLElement | null;
    hostNode?.setAttribute?.('data-no-page-turn', '1');
    if (!node?.setAttribute) return;
    node.setAttribute('data-choice-list', '1');
    const stop = (event: Event) => event.stopPropagation();
    node.addEventListener('touchmove', stop);
    node.addEventListener('wheel', stop);
    return () => {
      node.removeEventListener('touchmove', stop);
      node.removeEventListener('wheel', stop);
    };
  }, [open]);

  return (
    <View ref={host} style={{ flex: 1 }} {...({ dataSet: { noPageTurn: '1' } } as object)}>
      <Pressable
        accessibilityLabel={label}
        accessibilityState={{ expanded: open }}
        onPressIn={() => rememberMenuScroll((host.current as HTMLElement | null) ?? null)}
        onPress={onToggle}
        style={{ minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.paperEdge, backgroundColor: theme.colors.card, paddingLeft: 10, paddingRight: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}
      >
        <View style={{ flex: 1 }}>{summary}</View>
        <Chevron open={open} color={theme.colors.paperSoft} />
      </Pressable>
      {open ? (
        Platform.OS === 'web' ? (
          <View
            ref={list}
            style={{ marginTop: 6, borderRadius: 12, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.paperEdge, ...listStyle }}
          >
            {children}
          </View>
        ) : (
          <ScrollView
            ref={list}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
            style={{ marginTop: 6, height: 168, maxHeight: 168, borderRadius: 12, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.paperEdge }}
          >
            {children}
          </ScrollView>
        )
      ) : null}
    </View>
  );
}

export function MenuLabel({ children }: { children: string }) {
  const theme = useTheme();
  return <Text numberOfLines={1} style={{ color: theme.colors.paperInk, fontFamily: theme.body }}>{children}</Text>;
}
