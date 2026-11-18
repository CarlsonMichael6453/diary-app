import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Screen } from '@/src/components/Screen';
import { Button, CoinPill } from '@/src/components/ui';
import { canUseItem, rarityLabel } from '@/src/logic/access';
import { useDiary } from '@/src/store/useDiary';
import { PACKS, stickersInPack } from '@/src/stickers/catalog';
import { StickerView } from '@/src/stickers/StickerView';
import { useTheme } from '@/src/theme/BookTheme';

export default function AlbumScreen() {
  const theme = useTheme();
  const wallet = useDiary((state) => state.wallet);
  const buySticker = useDiary((state) => state.buySticker);
  const [packId, setPackId] = useState(PACKS[0].id);
  const [note, setNote] = useState('');
  const pack = PACKS.find((item) => item.id === packId) ?? PACKS[0];

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Pressable onPress={() => router.back()}><Text style={{ color: theme.colors.ink, fontFamily: theme.body }}>Back</Text></Pressable>
        <CoinPill coins={wallet.coins} />
      </View>
      <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 36, marginTop: 8 }}>Sticker album</Text>
      <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body }}>{pack.blurb}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 12 }}>
        {PACKS.map((item) => (
          <Pressable key={item.id} onPress={() => setPackId(item.id)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: item.id === packId ? item.swatch : theme.colors.chip }}>
            <Text style={{ color: item.id === packId ? '#1A1420' : theme.colors.chipInk, fontFamily: theme.body, fontSize: 12 }}>{item.name}</Text>
          </Pressable>
        ))}
      </View>
      {pack.premium && !wallet.premium ? <Button label="This pack is Diary Plus" onPress={() => router.push('/paywall' as Href)} /> : null}
      {note ? <Text style={{ color: theme.colors.ink, fontFamily: theme.body, marginVertical: 8 }}>{note}</Text> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
        {stickersInPack(pack.id).map((sticker) => {
          const owned = canUseItem(sticker, { ownedIds: wallet.ownedStickerIds, premium: wallet.premium });
          return (
            <Pressable
              key={sticker.id}
              onPress={() => {
                if (owned) {
                  setNote(`${sticker.name} · ${rarityLabel(sticker.rarity)}`);
                  return;
                }
                if (sticker.unlock === 'coins') {
                  setNote(buySticker(sticker.id).message ?? '');
                  return;
                }
                router.push('/paywall' as Href);
              }}
              style={{ width: 104, alignItems: 'center', opacity: owned ? 1 : 0.5 }}
            >
              <StickerView stickerId={sticker.id} size={84} />
              <Text style={{ color: theme.colors.ink, fontFamily: theme.body, fontSize: 12, textAlign: 'center' }}>{sticker.name}</Text>
              <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body, fontSize: 11 }}>{owned ? rarityLabel(sticker.rarity) : sticker.unlock === 'coins' ? `${sticker.price} coins` : 'Diary Plus'}</Text>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
