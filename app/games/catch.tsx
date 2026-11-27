import { router, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { RewardCard } from '@/src/components/RewardCard';
import { ReviewPrompt, useReviewMoment } from '@/src/components/ReviewPrompt';
import { Screen } from '@/src/components/Screen';
import { todayKey } from '@/src/logic/dates';
import { rewardPoolFor } from '@/src/logic/packs';
import { countReviewEntries } from '@/src/logic/review';
import { resolveReward, rewardForCatch, type ResolvedReward } from '@/src/logic/rewards';
import { birthdayFrom } from '@/src/logic/seasons';
import { uid } from '@/src/logic/id';
import { useDiary } from '@/src/store/useDiary';
import { STICKERS } from '@/src/stickers/catalog';
import { StickerView } from '@/src/stickers/StickerView';
import { useTheme } from '@/src/theme/BookTheme';

type Faller = { id: string; x: number; y: number; good: boolean; stickerId?: string };

const FIELD = 420;
const POOL = STICKERS.filter((sticker) => sticker.unlock !== 'premium').slice(0, 20);

export default function CatchScreen() {
  const theme = useTheme();
  const wallet = useDiary((state) => state.wallet);
  const grantReward = useDiary((state) => state.grantReward);
  const [items, setItems] = useState<Faller[]>([]);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(25);
  const [running, setRunning] = useState(false);
  const [reward, setReward] = useState<ResolvedReward | null>(null);
  const scoreRef = useRef(0);
  const walletRef = useRef(wallet);
  walletRef.current = wallet;
  const paid = useRef(false);
  const review = useReviewMoment();

  function finish() {
    if (paid.current) return;
    paid.current = true;
    const current = walletRef.current;
    const allowDrop = current.dropDates.catch !== todayKey();
    const draft = rewardForCatch(scoreRef.current);
    const rewardDraft = allowDrop
      ? draft
      : { ...draft, stickerRarity: undefined, outfitId: undefined, detail: 'Coins only — the sticker basket refills tomorrow.' };
    const settings = useDiary.getState().settings;
    const pool = rewardPoolFor(settings.debugDate, birthdayFrom(settings.birthdayMonth, settings.birthdayDay));
    const resolved = resolveReward(rewardDraft, pool, current.ownedStickerIds, current.ownedOutfitIds);
    grantReward(resolved, allowDrop ? 'catch' : undefined);
    setReward(resolved);
    setRunning(false);
    if (scoreRef.current > 0) void review.consider('game-won', undefined, countReviewEntries(useDiary.getState().entries));
  }

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setTime((value) => {
        if (value <= 1) {
          finish();
          return 0;
        }
        return value - 1;
      });
      setItems((current) => current.map((item) => ({ ...item, y: item.y + (item.good ? 10 : 13) })).filter((item) => item.y < FIELD));
    }, 80);
    const spawner = setInterval(() => {
      const good = Math.random() > 0.22;
      const sticker = POOL[Math.floor(Math.random() * POOL.length)];
      setItems((current) => [...current, { id: uid('fall'), x: 8 + Math.random() * 78, y: 0, good, stickerId: good ? sticker?.id : undefined }]);
    }, 700);
    return () => {
      clearInterval(timer);
      clearInterval(spawner);
    };
  }, [running]);

  function start() {
    scoreRef.current = 0;
    paid.current = false;
    setScore(0);
    setItems([]);
    setReward(null);
    setTime(25);
    setRunning(true);
  }

  return (
    <Screen scroll={false} style={{ flex: 1, paddingHorizontal: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View />
        <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 28 }}>Catch</Text>
        <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body }}>{time}s · {score}</Text>
      </View>
      {!running && !reward ? (
        <View style={{ marginTop: 24, gap: 12 }}>
          <Text style={{ color: theme.colors.ink, fontFamily: theme.body, fontSize: 16 }}>Tap the stickers. Leave the ink blots alone. You have 25 seconds.</Text>
          <Pressable onPress={start} style={{ backgroundColor: theme.colors.accent, borderRadius: theme.radius, padding: 14, alignItems: 'center' }}>
            <Text style={{ color: theme.colors.onAccent, fontFamily: theme.body }}>Start</Text>
          </Pressable>
        </View>
      ) : null}
      <View style={{ marginTop: 12, height: FIELD, borderRadius: theme.radius, backgroundColor: theme.colors.card, overflow: 'hidden' }}>
        {items.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => {
              if (!running) return;
              setItems((current) => current.filter((entry) => entry.id !== item.id));
              setScore((value) => {
                const next = item.good ? value + 1 : Math.max(0, value - 1);
                scoreRef.current = next;
                return next;
              });
            }}
            style={{ position: 'absolute', left: `${item.x}%`, top: item.y }}
          >
            {item.good && item.stickerId ? <StickerView stickerId={item.stickerId} size={52} /> : <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: '#2C2433' }} />}
          </Pressable>
        ))}
      </View>
      {reward ? (
        <View style={{ marginTop: 12 }}>
          <RewardCard reward={reward} onClose={start} />
        </View>
      ) : null}
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
