import { StyleSheet, Text, View } from 'react-native';

import type { Rarity } from '../logic/access';
import { getSticker } from './catalog';
import { StickerSvg } from './StickerSvg';

const RARITY_GLOW: Record<Rarity, string | null> = {
  common: null,
  rare: '#7EB6FF',
  epic: '#C9A0FF',
  legendary: '#E2B23A',
};

const RARITY_MARK: Record<Rarity, string> = {
  common: '',
  rare: 'R',
  epic: 'E',
  legendary: 'L',
};

export function StickerView({
  stickerId,
  size = 72,
  selected = false,
}: {
  stickerId: string;
  size?: number;
  selected?: boolean;
}) {
  const sticker = getSticker(stickerId);
  if (!sticker) return null;
  const glow = RARITY_GLOW[sticker.rarity];
  return (
    <View style={[styles.art, { width: size, height: size }, selected && styles.selected]}>
      <View
        style={
          glow
            ? {
                shadowColor: glow,
                shadowOpacity: 0.95,
                shadowRadius: Math.max(6, size * 0.12),
                shadowOffset: { width: 0, height: 0 },
              }
            : undefined
        }
      >
        <StickerSvg art={sticker.art} colors={sticker.colors} size={size} />
      </View>
      {glow ? (
        <View style={[styles.badge, { backgroundColor: glow }]}>
          <Text style={styles.badgeText}>{RARITY_MARK[sticker.rarity]}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  art: { backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  selected: { borderRadius: 999, borderWidth: 1.5, borderColor: 'rgba(226,178,58,0.9)' },
  badge: { position: 'absolute', top: 0, right: 0, minWidth: 14, height: 14, borderRadius: 7, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
  badgeText: { color: '#1A1420', fontSize: 8, fontWeight: '700' },
});
