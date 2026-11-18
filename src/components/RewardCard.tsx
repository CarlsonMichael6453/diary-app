import { Text, View } from 'react-native';

import { BuddyView } from '../buddies/BuddyView';
import { getOutfit } from '../buddies/catalog';
import type { MoodId } from '../data/moods';
import type { ResolvedReward } from '../logic/rewards';
import { getSticker } from '../stickers/catalog';
import { StickerView } from '../stickers/StickerView';
import { useTheme } from '../theme/BookTheme';
import { useDiary } from '../store/useDiary';
import { Button } from './ui';

export function RewardCard({
  reward,
  onClose,
  mood = 'happy',
}: {
  reward: ResolvedReward;
  onClose: () => void;
  mood?: MoodId;
}) {
  const theme = useTheme();
  const buddyId = useDiary((state) => state.settings.buddyId);
  const outfits = useDiary((state) => state.settings.outfitIds);
  const sticker = reward.stickerId ? getSticker(reward.stickerId) : undefined;
  const outfit = reward.outfitId ? getOutfit(reward.outfitId) : undefined;
  return (
    <View style={{ backgroundColor: theme.colors.card, borderRadius: theme.radius, padding: 16, gap: 10 }}>
      <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 28 }}>{reward.title}</Text>
      <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body, fontSize: 15 }}>{reward.detail}</Text>
      <Text style={{ color: theme.colors.ink, fontFamily: theme.body, fontSize: 18 }}>+{reward.coins} coins</Text>
      {sticker ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <StickerView stickerId={sticker.id} size={64} />
          <Text style={{ color: theme.colors.ink, fontFamily: theme.body }}>{sticker.name}</Text>
        </View>
      ) : null}
      {outfit ? <Text style={{ color: theme.colors.ink, fontFamily: theme.body }}>Wardrobe: {outfit.name}</Text> : null}
      <BuddyView buddyId={buddyId} outfits={outfits} mood={mood} streak={3} writing finished entryCount={4} celebrate size={96} showLine={false} />
      <Button label="Collect" onPress={onClose} />
    </View>
  );
}
