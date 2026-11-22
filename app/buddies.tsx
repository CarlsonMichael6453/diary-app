import { router, type Href } from 'expo-router';
import { useState } from 'react';
import type { MoodId } from '@/src/data/moods';
import { MOODS } from '@/src/data/moods';
import { Pressable, Text, View } from 'react-native';

import { BUDDIES, OUTFITS, canEquipOutfit, getBuddy, getOutfit } from '@/src/buddies/catalog';
import { BuddyView } from '@/src/buddies/BuddyView';
import { ItemPreview } from '@/src/components/ItemPreview';
import { Screen } from '@/src/components/Screen';
import { Button, CoinPill } from '@/src/components/ui';
import { playBuddySound } from '@/src/services/sounds';
import { useDiary } from '@/src/store/useDiary';
import { useTheme } from '@/src/theme/BookTheme';

function outfitActionLabel(outfit: { unlock: string; price?: number }, usable: boolean, equipped: boolean): string | undefined {
  if (usable) return equipped ? 'Take off' : 'Wear';
  if (outfit.unlock === 'coins') return `Buy for ${outfit.price} coins`;
  if (outfit.unlock === 'premium') return 'Diary Plus';
  return undefined;
}

export default function BuddiesScreen() {
  const theme = useTheme();
  const settings = useDiary((state) => state.settings);
  const wallet = useDiary((state) => state.wallet);
  const setBuddy = useDiary((state) => state.setBuddy);
  const toggleOutfit = useDiary((state) => state.toggleOutfit);
  const buyOutfit = useDiary((state) => state.buyOutfit);
  const [note, setNote] = useState('');
  const [preview, setPreview] = useState<MoodId>('happy');
  const [palLook, setPalLook] = useState<string | null>(null);
  const [outfitLook, setOutfitLook] = useState<string | null>(null);
  const current = getBuddy(settings.buddyId);
  const looked = palLook && palLook !== 'none' ? getBuddy(palLook) : null;
  const lookedOutfit = outfitLook ? getOutfit(outfitLook) : undefined;
  const wearer = current?.id ?? 'mochi';

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Pressable onPress={() => router.back()}><Text style={{ color: theme.colors.ink, fontFamily: theme.body }}>Back</Text></Pressable>
        <CoinPill coins={wallet.coins} />
      </View>
      <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 36, marginTop: 8 }}>Your pal</Text>
      <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body }}>They sit on the page, react to the mood, and wear what you earn.</Text>
      {current ? (
        <View style={{ alignItems: 'center', marginVertical: 8 }}>
          <BuddyView buddyId={current.id} outfits={settings.outfitIds} mood={preview} streak={4} writing finished entryCount={8} showLine size={160} taps />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
            {MOODS.map((mood) => (
              <Pressable key={mood.id} accessibilityLabel={mood.label} onPress={() => setPreview(mood.id)} style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: preview === mood.id ? mood.color : theme.colors.chip }}>
                <Text>{mood.emoji}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : (
        <Text style={{ color: theme.colors.ink, fontFamily: theme.script, fontSize: 22, marginVertical: 12 }}>The page is just yours. No pal.</Text>
      )}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        <Pressable
          onPress={() => setPalLook('none')}
          style={{ width: '47%', padding: 12, borderRadius: 16, backgroundColor: theme.colors.card, borderWidth: settings.buddyId === 'none' ? 3 : 0, borderColor: theme.colors.accent, minHeight: 120, justifyContent: 'center' }}
        >
          <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 22 }}>None</Text>
          <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body }}>An empty margin.</Text>
          <Text style={{ color: theme.colors.ink, fontFamily: theme.body, fontSize: 12, marginTop: 4 }}>Free</Text>
        </Pressable>
        {BUDDIES.map((buddy) => {
          const locked = buddy.premium && !wallet.premium;
          const selected = settings.buddyId === buddy.id;
          return (
            <Pressable
              key={buddy.id}
              accessibilityLabel={`${buddy.name} preview`}
              onPress={() => setPalLook(buddy.id)}
              style={{ width: '47%', padding: 8, borderRadius: 16, backgroundColor: theme.colors.card, borderWidth: selected ? 3 : 0, borderColor: theme.colors.accent, opacity: locked ? 0.55 : 1 }}
            >
              <BuddyView buddyId={buddy.id} outfits={selected ? settings.outfitIds : []} mood="happy" streak={buddy.id === 'sprout' ? 3 : 1} writing finished={buddy.id === 'glitter'} entryCount={buddy.id === 'ghosty' ? 8 : 2} size={110} still />
              <Text style={{ color: theme.colors.ink, fontFamily: theme.body }}>{buddy.name}</Text>
              <Text style={{ color: theme.colors.ink, fontFamily: theme.body, fontSize: 12 }}>{locked ? 'Diary Plus' : 'Free'}</Text>
              <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body, fontSize: 12 }}>{buddy.blurb}</Text>
            </Pressable>
          );
        })}
      </View>
      <ItemPreview
        visible={palLook !== null}
        title={palLook === 'none' ? 'None' : looked?.name ?? 'Pal'}
        detail={palLook === 'none' ? 'An empty margin. Free.' : looked?.premium && !wallet.premium ? 'Diary Plus' : 'Free'}
        onClose={() => setPalLook(null)}
        actionLabel={palLook === 'none' ? 'Leave the page empty' : looked?.premium && !wallet.premium ? 'See Diary Plus' : 'Choose this pal'}
        onAction={() => {
          if (!palLook) return;
          if (looked?.premium && !wallet.premium) {
            router.push('/paywall' as Href);
            return;
          }
          if (palLook !== 'none') playBuddySound(palLook);
          setBuddy(palLook);
          setPalLook(null);
        }}
      >
        {looked ? (
          <BuddyView buddyId={looked.id} outfits={settings.buddyId === looked.id ? settings.outfitIds : []} mood={preview} streak={4} writing finished entryCount={8} size={180} />
        ) : (
          <Text style={{ color: theme.colors.paperInk, fontFamily: theme.script, fontSize: 22 }}>Just the page.</Text>
        )}
      </ItemPreview>

      <Button label="Visit their room" onPress={() => router.push('/room' as Href)} />
      <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 26, marginTop: 18 }}>Wardrobe</Text>
      <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body, marginBottom: 8 }}>Up to one item per spot. Games, streaks, and coins fill this out.</Text>
      {note ? <Text style={{ color: theme.colors.ink, fontFamily: theme.body, marginBottom: 8 }}>{note}</Text> : null}
      <View style={{ gap: 8 }}>
        {OUTFITS.map((outfit) => {
          const equipped = settings.outfitIds.includes(outfit.id);
          const price = outfit.unlock === 'coins' ? `${outfit.price} coins` : outfit.unlock === 'premium' ? 'Diary Plus' : outfit.unlock === 'free' ? 'Free' : outfit.hint;
          return (
            <Pressable key={outfit.id} accessibilityLabel={`${outfit.name} preview`} onPress={() => setOutfitLook(outfit.id)} style={{ backgroundColor: theme.colors.card, borderRadius: 14, padding: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <BuddyView buddyId={wearer} outfits={[outfit.id]} mood="happy" streak={2} writing finished entryCount={4} size={72} still />
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.ink, fontFamily: theme.body }}>{outfit.name}{equipped ? ' · wearing' : ''}</Text>
                <Text style={{ color: theme.colors.ink, fontFamily: theme.body, fontSize: 13 }}>{price}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      <ItemPreview
        visible={Boolean(lookedOutfit)}
        title={lookedOutfit?.name ?? ''}
        detail={lookedOutfit ? lookedOutfit.hint : ''}
        onClose={() => setOutfitLook(null)}
        actionLabel={lookedOutfit ? outfitActionLabel(lookedOutfit, canEquipOutfit(lookedOutfit, wallet), settings.outfitIds.includes(lookedOutfit.id)) : undefined}
        onAction={lookedOutfit ? () => {
          if (canEquipOutfit(lookedOutfit, wallet)) {
            setNote(toggleOutfit(lookedOutfit.id).message ?? '');
            setOutfitLook(null);
            return;
          }
          if (lookedOutfit.unlock === 'coins') {
            const result = buyOutfit(lookedOutfit.id);
            setNote(result.message ?? '');
            if (result.ok) setOutfitLook(null);
            return;
          }
          if (lookedOutfit.unlock === 'premium') router.push('/paywall' as Href);
        } : undefined}
      >
        {lookedOutfit ? <BuddyView buddyId={wearer} outfits={[lookedOutfit.id]} mood="happy" streak={3} writing finished entryCount={6} size={180} /> : null}
      </ItemPreview>
    </Screen>
  );
}
