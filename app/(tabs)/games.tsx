import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { RewardCard } from '@/src/components/RewardCard';
import { Screen } from '@/src/components/Screen';
import { Button, CoinPill } from '@/src/components/ui';
import { todayKey } from '@/src/logic/dates';
import { loginProgress } from '@/src/logic/streak';
import { writingStreak } from '@/src/logic/streak';
import { useDiary } from '@/src/store/useDiary';
import { useTheme } from '@/src/theme/BookTheme';
import type { ResolvedReward } from '@/src/logic/rewards';

const GAMES = [
  { href: '/games/memory', title: 'Memory match', detail: 'Flip pairs of stickers. Fewer moves, more coins, and a chance at a rare drop.' },
  { href: '/games/catch', title: 'Sticker catch', detail: 'Tap the falling stickers. Skip the ink blots. Accessories sometimes tumble down.' },
  { href: '/games/spin', title: 'Daily spin', detail: 'One spin a day. Coins, a sticker, or star glasses for your pal.' },
];

export default function GamesScreen() {
  const theme = useTheme();
  const wallet = useDiary((state) => state.wallet);
  const entries = useDiary((state) => state.entries);
  const claimLogin = useDiary((state) => state.claimLogin);
  const [reward, setReward] = useState<ResolvedReward | null>(null);
  const [note, setNote] = useState('');
  const today = todayKey();
  const progress = loginProgress(wallet.lastLoginDate, wallet.loginStreak, today);
  const streak = writingStreak(entries.map((entry) => entry.date), today);

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 36 }}>Games</Text>
        <CoinPill coins={wallet.coins} />
      </View>
      <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body, marginTop: 4 }}>Writing streak: {streak} day{streak === 1 ? '' : 's'}. Coins buy common and rare stickers. Drops can be rarer.</Text>

      <View style={{ marginTop: 14, backgroundColor: theme.colors.card, borderRadius: theme.radius, padding: 14, gap: 8 }}>
        <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 24 }}>Daily visit</Text>
        <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body }}>
          {progress.claimed ? `Day ${progress.nextStreak} is already open.` : `Day ${progress.nextStreak} of the visit ribbon is waiting.`}
        </Text>
        {note ? <Text style={{ color: theme.colors.ink, fontFamily: theme.body }}>{note}</Text> : null}
        {reward ? <RewardCard reward={reward} onClose={() => setReward(null)} /> : null}
        {!progress.claimed && !reward ? (
          <Button
            label="Open today’s gift"
            onPress={() => {
              const result = claimLogin();
              if (!result.ok || !result.reward) {
                setNote(result.message ?? 'Nothing to open.');
                return;
              }
              setReward(result.reward);
              setNote('');
            }}
          />
        ) : null}
      </View>

      <View style={{ marginTop: 16, gap: 10 }}>
        {GAMES.map((game) => (
          <Pressable key={game.href} onPress={() => router.push(game.href as Href)} style={{ backgroundColor: theme.colors.card, borderRadius: theme.radius, padding: 14 }}>
            <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 24 }}>{game.title}</Text>
            <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body, marginTop: 4 }}>{game.detail}</Text>
          </Pressable>
        ))}
      </View>
      <View style={{ marginTop: 16 }}>
        <Button label="Sticker album" tone="ghost" onPress={() => router.push('/album' as Href)} />
      </View>
    </Screen>
  );
}
