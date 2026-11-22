import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { BUDDIES } from '@/src/buddies/catalog';
import { BuddyView } from '@/src/buddies/BuddyView';
import { Screen } from '@/src/components/Screen';
import { SparkleBurst } from '@/src/components/SparkleBurst';
import { Button } from '@/src/components/ui';
import { getProduct, getPurchaseProvider } from '@/src/services/purchases';
import { playPlusSound } from '@/src/services/sounds';
import { useDiary } from '@/src/store/useDiary';
import { PACKS, stickersInPack } from '@/src/stickers/catalog';
import { StickerView } from '@/src/stickers/StickerView';
import { useTheme } from '@/src/theme/BookTheme';
import { THEMES } from '@/src/theme/themes';

export default function PaywallScreen() {
  const theme = useTheme();
  const premium = useDiary((state) => state.wallet.premium);
  const outfitIds = useDiary((state) => state.settings.outfitIds);
  const applyPurchase = useDiary((state) => state.applyPurchase);
  const restorePremium = useDiary((state) => state.restorePremium);
  const purchases = useDiary((state) => state.wallet.purchases);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const provider = getPurchaseProvider();
  const premiumPacks = PACKS.filter((pack) => pack.premium && !pack.seasonal && !pack.hidden);
  const premiumBuddies = BUDDIES.filter((buddy) => buddy.premium);

  async function buy(productId: string) {
    setBusy(true);
    const result = await provider.purchase(productId);
    setBusy(false);
    if (!result.ok) {
      setNote(result.message);
      return;
    }
    const hadPlus = useDiary.getState().wallet.premium;
    const applied = applyPurchase(productId);
    const product = getProduct(productId);
    setNote(applied.ok ? `${applied.message} Test mode — no charge.` : applied.message);
    if (product?.kind === 'premium' && applied.ok) {
      setNote('Diary Plus is unlocked on this device. Test mode — no charge.');
      if (!hadPlus) {
        setCelebrate(true);
        playPlusSound();
      }
    }
  }

  return (
    <Screen>
      <Button label="Close" tone="ghost" onPress={() => router.back()} />
      <View style={{ marginTop: 12, backgroundColor: theme.colors.accent, borderRadius: theme.radius, padding: 16 }}>
        {celebrate ? <SparkleBurst /> : null}
        <Text style={{ color: theme.colors.onAccent, fontFamily: theme.body, fontSize: 12 }}>TEST MODE</Text>
        <Text style={{ color: theme.colors.onAccent, fontFamily: theme.display, fontSize: 36 }}>Diary Plus</Text>
        <Text style={{ color: theme.colors.onAccent, fontFamily: theme.body }}>
          Rare packs, Ember and Lumi, animated book styles, and the color designer’s moving patterns and metallic shine. This screen is a mock checkout so RevenueCat can be plugged in later. Nothing is charged.
        </Text>
      </View>
      {premium ? <Text style={{ color: theme.colors.ink, fontFamily: theme.body, marginTop: 12 }}>You already have Diary Plus on this device.</Text> : null}
      <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 26, marginTop: 16 }}>Pals</Text>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {premiumBuddies.map((buddy) => (
          <View key={buddy.id} style={{ alignItems: 'center' }}>
            <BuddyView buddyId={buddy.id} outfits={outfitIds} mood="happy" streak={3} writing finished entryCount={6} size={110} />
            <Text style={{ color: theme.colors.ink, fontFamily: theme.body }}>{buddy.name}</Text>
          </View>
        ))}
      </View>
      <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 26, marginTop: 8 }}>Animated styles</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        {THEMES.filter((item) => item.premium).map((item) => (
          <View key={item.id} style={{ width: 86, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: item.colors.paperEdge, backgroundColor: item.colors.paper }}>
            <View style={{ height: 54, backgroundColor: item.colors.bg, paddingLeft: 10, paddingTop: 8 }}>
              <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 7, backgroundColor: item.colors.binding }} />
              <View style={{ height: 7, width: 40, borderRadius: 4, backgroundColor: item.colors.accent, marginLeft: 6 }} />
              <View style={{ height: 3, width: 46, borderRadius: 2, backgroundColor: item.colors.line, marginLeft: 6, marginTop: 6 }} />
              <View style={{ height: 3, width: 28, borderRadius: 2, backgroundColor: item.colors.line, marginLeft: 6, marginTop: 4 }} />
            </View>
            <Text style={{ color: item.colors.paperInk, fontFamily: theme.body, fontSize: 11, padding: 6 }}>{item.name}</Text>
          </View>
        ))}
      </View>
      <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 26, marginTop: 8 }}>Packs</Text>
      <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body }}>Seasonal Plus packs show up in the shop during their holiday, then stay in your book.</Text>
      {premiumPacks.map((pack) => (
        <View key={pack.id} style={{ marginTop: 10 }}>
          <Text style={{ color: theme.colors.ink, fontFamily: theme.body }}>{pack.name}</Text>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
            {stickersInPack(pack.id).slice(0, 5).map((sticker) => (
              <StickerView key={sticker.id} stickerId={sticker.id} size={56} />
            ))}
          </View>
        </View>
      ))}
      <View style={{ gap: 10, marginTop: 16 }}>
        {provider.getProducts().map((product) => (
          <View key={product.id} style={{ backgroundColor: theme.colors.card, borderRadius: theme.radius, padding: 12, gap: 6 }}>
            <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 22 }}>{product.title}</Text>
            <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body }}>{product.detail}</Text>
            <Button label={busy ? 'Working…' : `Test-buy ${product.priceLabel}`} disabled={busy} onPress={() => buy(product.id)} />
          </View>
        ))}
        <Button
          label="Restore purchases"
          tone="ghost"
          onPress={async () => {
            const result = await provider.restore(purchases.map((purchase) => purchase.productId));
            const hadPlus = premium;
            const restored = restorePremium() || result.premium;
            setNote(restored ? 'Diary Plus restored on this device.' : 'No previous test purchase was found.');
            if (restored && !hadPlus) {
              setCelebrate(true);
              playPlusSound();
            }
          }}
        />
      </View>
      {note ? (
        <View style={{ marginTop: 12, minHeight: 88, position: 'relative' }}>
          {celebrate ? <SparkleBurst /> : null}
          <Text style={{ color: theme.colors.ink, fontFamily: theme.body }}>{note}</Text>
        </View>
      ) : null}
    </Screen>
  );
}
