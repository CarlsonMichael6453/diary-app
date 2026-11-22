import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

import { BUDDIES, OUTFITS } from '@/src/buddies/catalog';
import { BuddyView } from '@/src/buddies/BuddyView';

/**
 * Unlinked fit sheet. One accessory, every pal, full body.
 * Open /pal-fit?item=scarf (any outfit id). Not linked from the diary.
 */
export default function PalFitScreen() {
  const params = useLocalSearchParams<{ item?: string }>();
  const requested = typeof params.item === 'string' ? params.item : 'scarf';
  const outfit = OUTFITS.find((item) => item.id === requested) ?? OUTFITS[0];

  return (
    <View style={{ backgroundColor: '#C5D0DC', paddingHorizontal: 12, paddingTop: 10, paddingBottom: 16 }} testID="pal-fit">
      <Text testID="sheet-title" style={{ color: '#241820', fontSize: 18, fontWeight: '700', marginBottom: 6 }}>
        {outfit.name}
      </Text>
      <View style={{ width: 880, flexDirection: 'row', flexWrap: 'wrap' }}>
        {BUDDIES.map((buddy) => (
          <View
            key={buddy.id}
            testID={`pal-${buddy.id}`}
            accessibilityLabel={`${buddy.name} wearing ${outfit.name}`}
            style={{ width: 220, height: 216, alignItems: 'center', overflow: 'visible' }}
          >
            <BuddyView
              buddyId={buddy.id}
              outfits={[outfit.id]}
              mood="happy"
              streak={3}
              writing={false}
              finished={false}
              entryCount={8}
              size={156}
              still
            />
            <Text style={{ color: '#241820', fontSize: 13, fontWeight: '700', marginTop: 2 }}>{buddy.name}</Text>
            <Text style={{ color: '#4A3A44', fontSize: 12 }}>{outfit.name}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
