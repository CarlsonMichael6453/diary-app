import { StyleSheet, View } from 'react-native';

import type { Rarity } from '../logic/access';
import { getSticker } from './catalog';
import { StickerSvg } from './StickerSvg';

const RARITY_RING: Record<Rarity, string> = {
  common: '#FFFFFF',
  rare: '#6AA7E8',
  epic: '#B07BE0',
  legendary: '#E2B23A',
};

export function StickerView({
  stickerId,
  size = 72,
  framed = true,
}: {
  stickerId: string;
  size?: number;
  framed?: boolean;
}) {
  const sticker = getSticker(stickerId);
  if (!sticker) return null;
  const ring = RARITY_RING[sticker.rarity];
  if (!framed) {
    return <StickerSvg art={sticker.art} colors={sticker.colors} size={size} />;
  }
  return (
    <View
      style={[
        styles.card,
        {
          width: size,
          height: size,
          borderRadius: size * 0.22,
          borderColor: ring,
          borderWidth: sticker.rarity === 'common' ? 2 : 3,
        },
      ]}
    >
      <StickerSvg art={sticker.art} colors={sticker.colors} size={size * 0.78} />
      {sticker.rarity === 'legendary' ? <View style={[styles.foil, { borderRadius: size * 0.22 }]} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFEFB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3A2A32',
    shadowOpacity: 0.16,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  foil: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 236, 170, 0.9)',
  },
});
