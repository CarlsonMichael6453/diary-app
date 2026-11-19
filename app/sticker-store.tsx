import { router, type Href } from 'expo-router';
import { Text, View } from 'react-native';

import { Screen } from '@/src/components/Screen';
import { Button } from '@/src/components/ui';
import { PACK_EMOJI, packIsOwned, packOffer } from '@/src/logic/packs';
import { useDiary } from '@/src/store/useDiary';
import { PACKS, stickersInPack } from '@/src/stickers/catalog';
import { StickerView } from '@/src/stickers/StickerView';
import { useTheme } from '@/src/theme/BookTheme';

export default function StickerStoreScreen() {
  const theme = useTheme();
  const wallet = useDiary((state) => state.wallet);
  const buyPack = useDiary((state) => state.buyPack);
  return (
    <Screen>
      <Button label="Back" tone="ghost" onPress={() => router.back()} />
      <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 36, marginTop: 8 }}>Sticker packs</Text>
      <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body }}>Coins or Diary Plus. Nothing is charged. The artwork has no card behind it.</Text>
      <Text style={{ color: theme.colors.ink, fontFamily: theme.body, marginTop: 8 }}>{wallet.coins} coins</Text>
      <View style={{ gap: 14, marginTop: 12 }}>
        {PACKS.map((pack) => {
          const offer = packOffer(pack);
          const owned = packIsOwned(pack, wallet.ownedPackIds, wallet.premium);
          const preview = stickersInPack(pack.id).slice(0, 4);
          return (
            <View key={pack.id} style={{ backgroundColor: theme.colors.card, borderRadius: theme.radius, padding: 14, gap: 8 }}>
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <View style={{ width: 72, height: 88, borderRadius: 8, backgroundColor: pack.swatch, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 32 }}>{pack.emoji ?? PACK_EMOJI[pack.id] ?? '✦'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 24 }}>{pack.name}</Text>
                  <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body }}>{pack.blurb}</Text>
                  <Text style={{ color: theme.colors.ink, fontFamily: theme.body, marginTop: 4 }}>
                    {owned ? 'In your sticker book' : offer.kind === 'premium' ? 'Diary Plus' : offer.kind === 'free' ? 'Free' : `${offer.coins} coins`}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, backgroundColor: 'transparent' }}>
                {preview.map((sticker) => (
                  <StickerView key={sticker.id} stickerId={sticker.id} size={56} />
                ))}
              </View>
              {owned ? null : offer.kind === 'premium' ? (
                <Button label="See Diary Plus" onPress={() => router.push('/paywall' as Href)} />
              ) : offer.kind === 'coins' ? (
                <Button
                  label={`Test-buy for ${offer.coins} coins`}
                  onPress={() => {
                    const result = buyPack(pack.id);
                    if (!result.ok && result.message.includes('Diary Plus')) router.push('/paywall' as Href);
                  }}
                />
              ) : (
                <Button label="Add this pack" onPress={() => buyPack(pack.id)} />
              )}
            </View>
          );
        })}
      </View>
    </Screen>
  );
}
