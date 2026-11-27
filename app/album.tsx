import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Screen } from '@/src/components/Screen';
import { Button, CoinPill } from '@/src/components/ui';
import { canUseItem, rarityLabel } from '@/src/logic/access';
import { PACK_EMOJI, packIsListed, packIsOwned } from '@/src/logic/packs';
import { birthdayFrom, shopToday } from '@/src/logic/seasons';
import { useDiary } from '@/src/store/useDiary';
import { PACKS, stickersInPack } from '@/src/stickers/catalog';
import { StickerView } from '@/src/stickers/StickerView';
import { useTheme } from '@/src/theme/BookTheme';

export default function AlbumScreen() {
  const theme = useTheme();
  const wallet = useDiary((state) => state.wallet);
  const settings = useDiary((state) => state.settings);
  const buySticker = useDiary((state) => state.buySticker);
  const today = shopToday(settings.debugDate);
  const birthday = birthdayFrom(settings.birthdayMonth, settings.birthdayDay);
  const listed = PACKS.filter((item) => packIsListed(item, wallet.ownedPackIds, today, birthday));
  const [packId, setPackId] = useState(listed[0]?.id ?? PACKS[0].id);
  const [note, setNote] = useState('');
  const pack = listed.find((item) => item.id === packId) ?? listed[0] ?? PACKS[0];

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View />
        <CoinPill coins={wallet.coins} />
      </View>
      <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 36, marginTop: 8 }}>Sticker album</Text>
      <Button label="Sticker pack store" onPress={() => router.push('/sticker-store' as Href)} />
      <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body }}>{pack.blurb}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 12 }}>
        {listed.map((item) => (
          <Pressable key={item.id} onPress={() => setPackId(item.id)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: item.id === packId ? item.swatch : theme.colors.chip }}>
            <Text style={{ color: item.id === packId ? '#1A1420' : theme.colors.chipInk, fontFamily: theme.body, fontSize: 12 }}>{item.name}</Text>
          </Pressable>
        ))}
      </View>
      {pack.premium && !wallet.premium ? <Button label="This pack is Diary Plus" onPress={() => router.push('/paywall' as Href)} /> : null}
      {note ? <Text style={{ color: theme.colors.ink, fontFamily: theme.body, marginVertical: 8 }}>{note}</Text> : null}
      <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 22, marginTop: 8 }}>Owned packs</Text>
      {PACKS.filter((item) => packIsOwned(item, wallet.ownedPackIds, wallet.premium)).map((ownedPack) => (
        <View key={ownedPack.id} style={{ marginTop: 12 }}>
          <Text style={{ color: theme.colors.ink, fontFamily: theme.body }}>{ownedPack.emoji ?? PACK_EMOJI[ownedPack.id] ?? '✦'} {ownedPack.name}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
            {stickersInPack(ownedPack.id).filter((sticker) => canUseItem(sticker, { ownedIds: wallet.ownedStickerIds, premium: wallet.premium })).map((sticker) => (
              <StickerView key={sticker.id} stickerId={sticker.id} size={64} />
            ))}
          </View>
        </View>
      ))}
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
                  const result = buySticker(sticker.id);
                  if (!result.ok && result.message?.includes('Diary Plus')) {
                    router.push('/paywall' as Href);
                    return;
                  }
                  setNote(result.message ?? '');
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
