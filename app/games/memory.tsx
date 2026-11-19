import { router, type Href } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { RewardCard } from '@/src/components/RewardCard';
import { ReviewPrompt, useReviewMoment } from '@/src/components/ReviewPrompt';
import { Screen } from '@/src/components/Screen';
import { Button } from '@/src/components/ui';
import { todayKey } from '@/src/logic/dates';
import { resolveReward, rewardForMemory, type ResolvedReward } from '@/src/logic/rewards';
import { useDiary } from '@/src/store/useDiary';
import { STICKERS } from '@/src/stickers/catalog';
import { StickerView } from '@/src/stickers/StickerView';
import { useTheme } from '@/src/theme/BookTheme';

type Card = { key: string; stickerId: string; uid: string };

function shuffle<T>(list: T[]): T[] {
  const next = [...list];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [next[index], next[swap]] = [next[swap], next[index]];
  }
  return next;
}

function makeDeck(): Card[] {
  const faces = STICKERS.filter((sticker) => sticker.unlock === 'free').slice(0, 8);
  return shuffle(faces.flatMap((sticker) => [
    { key: sticker.id, stickerId: sticker.id, uid: `${sticker.id}-a` },
    { key: sticker.id, stickerId: sticker.id, uid: `${sticker.id}-b` },
  ]));
}

export default function MemoryScreen() {
  const theme = useTheme();
  const wallet = useDiary((state) => state.wallet);
  const grantReward = useDiary((state) => state.grantReward);
  const [deck, setDeck] = useState(makeDeck);
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [lock, setLock] = useState(false);
  const [reward, setReward] = useState<ResolvedReward | null>(null);
  const won = matched.length === 8;
  const walletRef = useRef(wallet);
  walletRef.current = wallet;
  const paid = useRef(false);
  const review = useReviewMoment();

  function finish(finalMoves: number) {
    if (paid.current) return;
    paid.current = true;
    const current = walletRef.current;
    const allowDrop = current.dropDates.memory !== todayKey();
    const draft = rewardForMemory(finalMoves);
    const rewardDraft = allowDrop
      ? draft
      : { ...draft, stickerRarity: undefined, outfitId: undefined, detail: 'Coins for this round. Sticker drops refresh tomorrow.' };
    const resolved = resolveReward(rewardDraft, STICKERS, current.ownedStickerIds, current.ownedOutfitIds);
    grantReward(resolved, allowDrop ? 'memory' : undefined);
    setReward(resolved);
    void review.consider('game-won');
  }

  const status = useMemo(() => `${moves} moves`, [moves]);

  function tap(index: number) {
    if (lock || won || open.includes(index) || matched.includes(deck[index].key)) return;
    const next = [...open, index];
    setOpen(next);
    if (next.length < 2) return;
    const nextMoves = moves + 1;
    setMoves(nextMoves);
    const [a, b] = next;
    if (deck[a].key === deck[b].key) {
      const nextMatched = [...matched, deck[a].key];
      setMatched(nextMatched);
      setOpen([]);
      if (nextMatched.length === 8) finish(nextMoves);
    } else {
      setLock(true);
      setTimeout(() => {
        setOpen([]);
        setLock(false);
      }, 700);
    }
  }

  return (
    <Screen scroll={false} style={{ flex: 1, paddingHorizontal: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Pressable onPress={() => router.back()}><Text style={{ color: theme.colors.ink, fontFamily: theme.body }}>Back</Text></Pressable>
        <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 28 }}>Memory</Text>
        <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body }}>{status}</Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16, justifyContent: 'center' }}>
        {deck.map((card, index) => {
          const faceUp = open.includes(index) || matched.includes(card.key);
          return (
            <Pressable key={card.uid} onPress={() => tap(index)} style={{ width: '22%', aspectRatio: 1, borderRadius: 14, backgroundColor: faceUp ? theme.colors.card : theme.colors.accent, alignItems: 'center', justifyContent: 'center' }}>
              {faceUp ? <StickerView stickerId={card.stickerId} size={58} /> : <Text style={{ color: theme.colors.onAccent, fontFamily: theme.display, fontSize: 22 }}>?</Text>}
            </Pressable>
          );
        })}
      </View>
      {reward ? (
        <View style={{ marginTop: 16 }}>
          <RewardCard
            reward={reward}
            onClose={() => {
              paid.current = false;
              setDeck(makeDeck());
              setOpen([]);
              setMatched([]);
              setMoves(0);
              setReward(null);
            }}
          />
        </View>
      ) : (
        <View style={{ marginTop: 16 }}>
          <Button label="Shuffle again" tone="ghost" onPress={() => { setDeck(makeDeck()); setOpen([]); setMatched([]); setMoves(0); }} />
        </View>
      )}
      {review.visible ? (
        <ReviewPrompt
          onClose={review.hide}
          onFeedback={() => {
            review.hide();
            router.push('/feedback' as Href);
          }}
        />
      ) : null}
    </Screen>
  );
}
