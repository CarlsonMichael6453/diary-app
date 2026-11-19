import { router, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { BuddyView } from '@/src/buddies/BuddyView';
import { getBuddy } from '@/src/buddies/catalog';
import { Paper } from '@/src/components/Paper';
import { Screen } from '@/src/components/Screen';
import { CoinPill } from '@/src/components/ui';
import { getMood } from '@/src/data/moods';
import { promptForDate } from '@/src/data/prompts';
import { formatPretty, todayKey } from '@/src/logic/dates';
import { backupIsDue, entryBookId, memoriesOnThisDay } from '@/src/logic/memories';
import { birthdayFrom, seasonArrivals, shopToday } from '@/src/logic/seasons';
import { inQuietHours, pickSaying } from '@/src/logic/sayings';
import { pingPal } from '@/src/services/notifications';
import { getPack } from '@/src/stickers/catalog';
import { writingStreak } from '@/src/logic/streak';
import { entriesOn, useDiary } from '@/src/store/useDiary';
import { useTheme } from '@/src/theme/BookTheme';

export default function DiaryHome() {
  const theme = useTheme();
  const entries = useDiary((state) => state.entries);
  const settings = useDiary((state) => state.settings);
  const coins = useDiary((state) => state.wallet.coins);
  const dismissNudge = useDiary((state) => state.dismissNudge);
  const patchSettings = useDiary((state) => state.patchSettings);
  const setActiveBook = useDiary((state) => state.setActiveBook);
  const [seasonNote, setSeasonNote] = useState('');
  const today = todayKey();
  const shop = shopToday(settings.debugDate);
  const visible = entries.filter((entry) => entryBookId(entry) === settings.activeBookId);
  const memories = memoriesOnThisDay(visible, today);
  const backupDue = backupIsDue(settings.lastBackupAt, today, settings.backupReminderDays);
  const saying = pickSaying(settings.lastSayingId, settings.buddyId);
  const prompt = promptForDate(today);
  const streak = writingStreak(visible.map((entry) => entry.date), today);
  const todayEntries = entriesOn(visible, today);
  const wroteToday = todayEntries.length > 0;
  const earlier = [...visible].filter((entry) => entry.date !== today).sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt - a.updatedAt);
  const showNudge = settings.reminderEnabled && !wroteToday && settings.dismissedNudgeDate !== today;

  useEffect(() => {
    if (!settings.seenWelcome || !settings.palNotifications) return;
    if (inQuietHours(new Date().getHours(), settings.quietStart, settings.quietEnd)) return;
    const arrivals = seasonArrivals(shop, birthdayFrom(settings.birthdayMonth, settings.birthdayDay), settings.seasonAnnounced ?? []);
    if (arrivals.length === 0) return;
    const buddy = getBuddy(settings.buddyId);
    const names = arrivals.map((item) => getPack(item.packId)?.name).filter((name): name is string => Boolean(name));
    const line = names.length === 1
      ? `${buddy?.name ?? 'Your pal'} brought the ${names[0]} stickers.`
      : `${buddy?.name ?? 'Your pal'} says ${names.length} seasonal packs are in the shop.`;
    setSeasonNote(line);
    patchSettings({ seasonAnnounced: [...(settings.seasonAnnounced ?? []), ...arrivals.map((item) => item.key)] });
    void pingPal(buddy?.name ?? 'Your pal', line);
  }, [settings.seenWelcome, settings.palNotifications, settings.quietStart, settings.quietEnd, settings.buddyId, settings.birthdayMonth, settings.birthdayDay, settings.seasonAnnounced, settings.debugDate, shop, patchSettings]);

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body, fontSize: 14 }}>Hello, {settings.ownerName}</Text>
          <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 36 }}>{settings.bookTitle}</Text>
          <Pressable
            onPress={() => router.push('/feedback' as Href)}
            accessibilityRole="button"
            accessibilityLabel="Send feedback"
            style={{ alignSelf: 'flex-start', marginTop: 2 }}
          >
            <Text style={{ color: theme.colors.accent, fontFamily: theme.body, fontSize: 15 }}>Send feedback</Text>
          </Pressable>
        </View>
        <CoinPill coins={coins} />
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
        {settings.books.map((book) => (
          <Pressable key={book.id} onPress={() => setActiveBook(book.id)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: book.id === settings.activeBookId ? theme.colors.accent : theme.colors.chip }}>
            <Text style={{ color: book.id === settings.activeBookId ? theme.colors.onAccent : theme.colors.chipInk, fontFamily: theme.body }}>{book.title}</Text>
          </Pressable>
        ))}
      </View>

      {memories[0] ? (
        <Pressable onPress={() => router.push(`/entry/${memories[0].entry.id}` as Href)} style={{ marginTop: 12, backgroundColor: theme.colors.card, borderRadius: theme.radius, padding: 14 }}>
          <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 22 }}>On this day</Text>
          <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body }}>{memories[0].yearsAgo === 1 ? 'A year ago' : `${memories[0].yearsAgo} years ago`} · {memories[0].entry.title || 'Untitled page'}</Text>
        </Pressable>
      ) : null}
      {backupDue ? <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body, marginTop: 8 }}>No recent backup. Settings can save a JSON, CSV, or PDF copy.</Text> : null}
      {seasonNote ? (
        <Pressable onPress={() => router.push('/sticker-store' as Href)} style={{ marginTop: 12, backgroundColor: theme.colors.card, borderRadius: theme.radius, padding: 14 }}>
          <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 22 }}>Seasonal stickers</Text>
          <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body }}>{seasonNote}</Text>
        </Pressable>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <View style={{ backgroundColor: theme.colors.chip, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
          <Text style={{ color: theme.colors.chipInk, fontFamily: theme.body }}>{streak > 0 ? `${streak}-day writing streak` : 'No streak yet — today’s page is open'}</Text>
        </View>
      </View>

      <View style={{ marginTop: 14 }}>
        <BuddyView
          buddyId={settings.buddyId}
          outfits={settings.outfitIds}
          mood={todayEntries[0]?.mood ?? 'calm'}
          streak={streak}
          writing={wroteToday}
          finished={wroteToday}
          entryCount={entries.length}
          prompt={prompt}
          showLine
          layout="row"
          size={120}
          taps
          onPress={() => router.push('/buddies' as Href)}
        />
      </View>

      {showNudge ? (
        <View style={{ marginTop: 12, backgroundColor: theme.colors.card, borderRadius: theme.radius, padding: 14, gap: 8 }}>
          <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 22 }}>A gentle nudge</Text>
          <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body }}>{settings.palNotifications ? saying.text : 'Today’s page is still blank. A few lines is enough.'}</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable onPress={() => router.push(`/entry/new?date=${today}` as Href)}>
              <Text style={{ color: theme.colors.accent, fontFamily: theme.body }}>Write now</Text>
            </Pressable>
            <Pressable onPress={() => dismissNudge(today)}>
              <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body }}>Not now</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <Pressable onPress={() => router.push(`/entry/new?date=${today}` as Href)} style={{ marginTop: 16 }}>
        <Paper>
          <View style={{ padding: 18, paddingLeft: 28, gap: 8 }}>
            <Text style={{ color: theme.colors.paperSoft, fontFamily: theme.body }}>{formatPretty(today)}</Text>
            <Text style={{ color: theme.colors.paperInk, fontFamily: theme.script, fontSize: 28 }}>Today’s prompt</Text>
            <Text style={{ color: theme.colors.paperInk, fontFamily: theme.body, fontSize: 16, lineHeight: 24 }}>{prompt}</Text>
            <Text style={{ color: theme.colors.accent, fontFamily: theme.body, marginTop: 6 }}>{wroteToday ? 'Write another page' : 'Open today’s page'}</Text>
          </View>
        </Paper>
      </Pressable>

      {todayEntries.length > 0 ? (
        <View style={{ marginTop: 18, gap: 10 }}>
          <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 24 }}>Written today</Text>
          {todayEntries.map((entry) => (
            <EntryRow key={entry.id} id={entry.id} title={entry.title} body={entry.body} mood={entry.mood} date={entry.date} />
          ))}
        </View>
      ) : null}

      <View style={{ marginTop: 18, gap: 10, marginBottom: 12 }}>
        <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 24 }}>Earlier pages</Text>
        {earlier.length === 0 ? (
          <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body }}>Nothing earlier yet. The book starts whenever you do.</Text>
        ) : (
          earlier.map((entry) => (
            <EntryRow key={entry.id} id={entry.id} title={entry.title} body={entry.body} mood={entry.mood} date={entry.date} />
          ))
        )}
      </View>
    </Screen>
  );
}

function EntryRow({ id, title, body, mood, date }: { id: string; title: string; body: string; mood: string; date: string }) {
  const theme = useTheme();
  const moodInfo = getMood(mood as 'calm');
  return (
    <Pressable onPress={() => router.push(`/entry/${id}` as Href)}>
      <View style={{ backgroundColor: theme.colors.card, borderRadius: theme.radius, padding: 14, borderLeftWidth: 6, borderLeftColor: moodInfo.color }}>
        <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body, fontSize: 12 }}>{formatPretty(date)} · {moodInfo.emoji} {moodInfo.label}</Text>
        <Text style={{ color: theme.colors.ink, fontFamily: theme.script, fontSize: 24 }} numberOfLines={1}>{title || 'Untitled page'}</Text>
        <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body }} numberOfLines={2}>{body}</Text>
      </View>
    </Pressable>
  );
}
