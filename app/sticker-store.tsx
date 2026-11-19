import { router, type Href } from 'expo-router';
import { Text, View } from 'react-native';

import { Screen } from '@/src/components/Screen';
import { Button } from '@/src/components/ui';
import { PACK_EMOJI, packIsOwned, packOffer } from '@/src/logic/packs';
import { arrivingLabel, birthdayFrom, leavingLabel, openSeasons, shopToday, upcomingSeasons, type SeasonSlot } from '@/src/logic/seasons';
import { useDiary } from '@/src/store/useDiary';
import { PACKS, getPack, stickersInPack } from '@/src/stickers/catalog';
import { StickerView } from '@/src/stickers/StickerView';
import type { PackDef } from '@/src/stickers/types';
import { useTheme } from '@/src/theme/BookTheme';

export default function StickerStoreScreen() {
  const theme = useTheme();
  const wallet = useDiary((state) => state.wallet);
  const settings = useDiary((state) => state.settings);
  const buyPack = useDiary((state) => state.buyPack);
  const today = shopToday(settings.debugDate);
  const birthday = birthdayFrom(settings.birthdayMonth, settings.birthdayDay);
  const open = openSeasons(today, birthday);
  const soon = upcomingSeasons(today, birthday, 4);
  const yearRound = PACKS.filter((pack) => !pack.seasonal && !pack.hidden);

  return (
    <Screen>
      <Button label="Back" tone="ghost" onPress={() => router.back()} />
      <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 36, marginTop: 8 }}>Sticker packs</Text>
      <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body }}>Coins or Diary Plus. Nothing is charged. Seasonal packs return every year, and owned stickers stay.</Text>
      <Text style={{ color: theme.colors.ink, fontFamily: theme.body, marginTop: 8 }}>{wallet.coins} coins{settings.debugDate ? ` · shop date ${today}` : ''}</Text>

      <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 28, marginTop: 18 }}>Seasonal</Text>
      {open.length === 0 ? <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body }}>Nothing seasonal is in the shop this week.</Text> : null}
      <View style={{ gap: 14, marginTop: 8 }}>
        {open.map((slot) => {
          const pack = getPack(slot.packId);
          if (!pack) return null;
          return <PackCard key={slot.packId} pack={pack} slot={slot} owned={packIsOwned(pack, wallet.ownedPackIds, wallet.premium)} premium={wallet.premium} onBuy={() => buy(pack, buyPack)} />;
        })}
      </View>

      <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 28, marginTop: 22 }}>Coming soon</Text>
      {!birthday ? (
        <View style={{ marginTop: 8, backgroundColor: theme.colors.card, borderRadius: theme.radius, padding: 14, gap: 6 }}>
          <Text style={{ fontSize: 28 }}>🎂</Text>
          <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 22 }}>Your birthday</Text>
          <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body }}>Add a month and day in Settings. The pack unlocks during your birthday week.</Text>
        </View>
      ) : null}
      <View style={{ gap: 14, marginTop: 8 }}>
        {soon.map((slot) => {
          const pack = getPack(slot.packId);
          if (!pack) return null;
          return <Teaser key={slot.packId} pack={pack} slot={slot} />;
        })}
      </View>

      <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 28, marginTop: 22 }}>Always in the shop</Text>
      <View style={{ gap: 14, marginTop: 8 }}>
        {yearRound.map((pack) => (
          <PackCard key={pack.id} pack={pack} owned={packIsOwned(pack, wallet.ownedPackIds, wallet.premium)} premium={wallet.premium} onBuy={() => buy(pack, buyPack)} />
        ))}
      </View>
    </Screen>
  );
}

function buy(pack: PackDef, buyPack: (packId: string) => { ok: boolean; message?: string }) {
  const result = buyPack(pack.id);
  if (!result.ok && result.message?.includes('Diary Plus')) router.push('/paywall' as Href);
}

function PackCard({
  pack,
  slot,
  owned,
  premium,
  onBuy,
}: {
  pack: PackDef;
  slot?: SeasonSlot;
  owned: boolean;
  premium: boolean;
  onBuy: () => void;
}) {
  const theme = useTheme();
  const offer = packOffer(pack);
  const preview = stickersInPack(pack.id).slice(0, 4);
  const price = owned ? 'In your sticker book' : offer.kind === 'premium' ? 'Diary Plus' : offer.kind === 'free' ? 'Free' : `${offer.coins} coins`;
  return (
    <View style={{ backgroundColor: theme.colors.card, borderRadius: theme.radius, padding: 14, gap: 8 }}>
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <View style={{ width: 72, height: 88, borderRadius: 8, backgroundColor: pack.swatch, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 32 }}>{pack.emoji ?? PACK_EMOJI[pack.id] ?? '✦'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 24 }}>{pack.name}</Text>
          <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body }}>{pack.blurb}</Text>
          <Text style={{ color: theme.colors.ink, fontFamily: theme.body, marginTop: 4 }}>{price}</Text>
          {slot ? <Text style={{ color: theme.colors.accent, fontFamily: theme.body, marginTop: 2 }}>{owned ? `${leavingLabel(slot.days)} · yours to keep` : leavingLabel(slot.days)}</Text> : null}
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, backgroundColor: 'transparent' }}>
        {preview.map((sticker) => (
          <StickerView key={sticker.id} stickerId={sticker.id} size={56} />
        ))}
      </View>
      {owned ? null : offer.kind === 'premium' && !premium ? (
        <Button label="See Diary Plus" onPress={() => router.push('/paywall' as Href)} />
      ) : offer.kind === 'premium' ? (
        <Button label="Add with Diary Plus" onPress={onBuy} />
      ) : offer.kind === 'coins' ? (
        <Button label={`Test-buy for ${offer.coins} coins`} onPress={onBuy} />
      ) : (
        <Button label="Add this pack" onPress={onBuy} />
      )}
    </View>
  );
}

function Teaser({ pack, slot }: { pack: PackDef; slot: SeasonSlot }) {
  const theme = useTheme();
  const offer = packOffer(pack);
  const price = offer.kind === 'premium' ? 'Diary Plus' : `${offer.coins} coins`;
  return (
    <View style={{ backgroundColor: theme.colors.card, borderRadius: theme.radius, padding: 14, gap: 4, opacity: 0.92 }}>
      <Text style={{ fontSize: 28 }}>{pack.emoji ?? '✦'}</Text>
      <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 22 }}>{pack.name}</Text>
      <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body }}>{pack.blurb}</Text>
      <Text style={{ color: theme.colors.accent, fontFamily: theme.body }}>{arrivingLabel(slot.days)}</Text>
      <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body }}>{price} · preview opens when it arrives</Text>
    </View>
  );
}
