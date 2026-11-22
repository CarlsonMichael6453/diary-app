import { router, type Href } from 'expo-router';
import { useState } from 'react';
import type { MoodId } from '@/src/data/moods';
import { MOODS } from '@/src/data/moods';
import { Pressable, Text, View } from 'react-native';

import { BUDDIES, OUTFITS, canEquipOutfit, getBuddy } from '@/src/buddies/catalog';
import { BuddyView } from '@/src/buddies/BuddyView';
import { Screen } from '@/src/components/Screen';
import { Button, CoinPill } from '@/src/components/ui';
import { playBuddySound } from '@/src/services/sounds';
import { useDiary } from '@/src/store/useDiary';
import { useTheme } from '@/src/theme/BookTheme';

export default function BuddiesScreen() {
  const theme = useTheme();
  const settings = useDiary((state) => state.settings);
  const wallet = useDiary((state) => state.wallet);
  const setBuddy = useDiary((state) => state.setBuddy);
  const toggleOutfit = useDiary((state) => state.toggleOutfit);
  const buyOutfit = useDiary((state) => state.buyOutfit);
  const [note, setNote] = useState('');
  const [preview, setPreview] = useState<MoodId>('happy');
  const current = getBuddy(settings.buddyId);

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
          onPress={() => setBuddy('none')}
          style={{ width: '47%', padding: 12, borderRadius: 16, backgroundColor: theme.colors.card, borderWidth: settings.buddyId === 'none' ? 3 : 0, borderColor: theme.colors.accent, minHeight: 120, justifyContent: 'center' }}
        >
          <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 22 }}>None</Text>
          <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body }}>An empty margin.</Text>
        </Pressable>
        {BUDDIES.map((buddy) => {
          const locked = buddy.premium && !wallet.premium;
          const selected = settings.buddyId === buddy.id;
          return (
            <Pressable
              key={buddy.id}
              onPress={() => {
                if (locked) {
                  router.push('/paywall' as Href);
                  return;
                }
                playBuddySound(buddy.id);
                setBuddy(buddy.id);
              }}
              style={{ width: '47%', padding: 8, borderRadius: 16, backgroundColor: theme.colors.card, borderWidth: selected ? 3 : 0, borderColor: theme.colors.accent, opacity: locked ? 0.55 : 1 }}
            >
              <BuddyView buddyId={buddy.id} outfits={selected ? settings.outfitIds : []} mood="happy" streak={buddy.id === 'sprout' ? 3 : 1} writing finished={buddy.id === 'glitter'} entryCount={buddy.id === 'ghosty' ? 8 : 2} size={110} />
              <Text style={{ color: theme.colors.ink, fontFamily: theme.body }}>{buddy.name}{locked ? ' · Plus' : ''}</Text>
              <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body, fontSize: 12 }}>{buddy.blurb}</Text>
            </Pressable>
          );
        })}
      </View>

      <Button label="Visit their room" onPress={() => router.push('/room' as Href)} />
      <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 26, marginTop: 18 }}>Wardrobe</Text>
      <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body, marginBottom: 8 }}>Up to one item per spot. Games, streaks, and coins fill this out.</Text>
      {note ? <Text style={{ color: theme.colors.ink, fontFamily: theme.body, marginBottom: 8 }}>{note}</Text> : null}
      <View style={{ gap: 8 }}>
        {OUTFITS.map((outfit) => {
          const usable = canEquipOutfit(outfit, wallet);
          const equipped = settings.outfitIds.includes(outfit.id);
          return (
            <View key={outfit.id} style={{ backgroundColor: theme.colors.card, borderRadius: 14, padding: 12, gap: 4 }}>
              <Text style={{ color: theme.colors.ink, fontFamily: theme.body }}>{outfit.name}{equipped ? ' · wearing' : ''}</Text>
              <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body, fontSize: 13 }}>{outfit.hint}</Text>
              {usable ? (
                <Button label={equipped ? 'Take off' : 'Wear'} tone="ghost" onPress={() => setNote(toggleOutfit(outfit.id).message ?? '')} />
              ) : outfit.unlock === 'coins' ? (
                <Button label={`Buy for ${outfit.price} coins`} onPress={() => setNote(buyOutfit(outfit.id).message ?? '')} />
              ) : outfit.unlock === 'premium' ? (
                <Button label="Diary Plus" tone="ghost" onPress={() => router.push('/paywall' as Href)} />
              ) : (
                <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body, fontSize: 13 }}>Not earned yet.</Text>
              )}
            </View>
          );
        })}
      </View>
    </Screen>
  );
}
