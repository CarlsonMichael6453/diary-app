import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Image, PanResponder, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BuddyView } from '@/src/buddies/BuddyView';
import { getBuddy } from '@/src/buddies/catalog';
import { EntryExtras } from '@/src/components/EntryExtras';
import { MoodPicker } from '@/src/components/MoodPicker';
import { FontFields } from '@/src/components/FontFields';
import { PageFlip, type PageFlipHandle } from '@/src/components/PageFlip';
import { Paper } from '@/src/components/Paper';
import { Screen } from '@/src/components/Screen';
import { StickerLayer } from '@/src/components/StickerLayer';
import { ReviewPrompt, useReviewMoment } from '@/src/components/ReviewPrompt';
import { Button, Confirm } from '@/src/components/ui';
import { type MoodId } from '@/src/data/moods';
import { promptForDate } from '@/src/data/prompts';
import { canUseItem } from '@/src/logic/access';
import { packIsListed } from '@/src/logic/packs';
import { birthdayFrom, shopToday } from '@/src/logic/seasons';
import { addDays, formatLong, todayKey } from '@/src/logic/dates';
import { uid } from '@/src/logic/id';
import { writingStreak } from '@/src/logic/streak';
import { claimHorizontalSwipe, releaseSwipe } from '@/src/logic/swipe';
import type { DiaryEntry, StickerPlacement } from '@/src/models/types';
import { lightTap } from '@/src/services/haptics';
import { playPageTurn } from '@/src/services/sounds';
import { pickDiaryPhoto } from '@/src/services/photos';
import { useDiary } from '@/src/store/useDiary';
import { PACKS, stickersInPack } from '@/src/stickers/catalog';
import { StickerView } from '@/src/stickers/StickerView';
import { ThemeOverride, useTheme } from '@/src/theme/BookTheme';
import { resolveEntryLook, type ColorDesign } from '@/src/theme/designs';
import { applyType, FONT_CHOICES, INK_SWATCHES, sanitizeInk } from '@/src/theme/fonts';
import { THEMES, getTheme, type ThemeId } from '@/src/theme/themes';

type Draft = {
  id: string;
  date: string;
  title: string;
  body: string;
  mood: MoodId;
  photos: string[];
  stickers: StickerPlacement[];
  themeOverride: ThemeId | null;
  design?: ColorDesign | null;
  fontId?: string | null;
  inkColor?: string | null;
  createdAt: number;
  bookId?: string;
  tags?: string[];
  activities?: string[];
  templateId?: string | null;
  voiceNote?: string | null;
  drawing?: string | null;
  placeLabel?: string | null;
  weather?: string | null;
};

function blank(date: string, bookId: string): Draft {
  return { id: uid('page'), date, title: '', body: '', mood: 'calm', photos: [], stickers: [], themeOverride: null, createdAt: Date.now(), bookId, tags: [], activities: [] };
}

function fromEntry(entry: DiaryEntry): Draft {
  return {
    id: entry.id,
    date: entry.date,
    title: entry.title,
    body: entry.body,
    mood: entry.mood,
    photos: entry.photos,
    stickers: entry.stickers,
    themeOverride: entry.themeOverride,
    design: entry.design,
    fontId: entry.fontId,
    inkColor: entry.inkColor,
    createdAt: entry.createdAt,
    bookId: entry.bookId,
    tags: entry.tags ?? [],
    activities: entry.activities ?? [],
    templateId: entry.templateId,
    voiceNote: entry.voiceNote,
    drawing: entry.drawing,
    placeLabel: entry.placeLabel,
    weather: entry.weather,
  };
}

export default function EntryScreen() {
  const params = useLocalSearchParams<{ id: string; date?: string }>();
  const routeId = String(params.id ?? 'new');
  const bookThemeId = useDiary((state) => state.settings.themeId);
  const premium = useDiary((state) => state.wallet.premium);
  const books = useDiary((state) => state.settings.books);
  const ticket = useDiary((state) => state.pageDesignTicket);
  const existing = useDiary((state) => state.entries.find((entry) => entry.id === routeId));
  const [draft, setDraft] = useState<Draft | null>(null);
  const seenTicket = useRef(0);
  const routeSeen = useRef(routeId);

  useEffect(() => {
    if (routeSeen.current === routeId) return;
    routeSeen.current = routeId;
    setDraft(null);
  }, [routeId]);

  useEffect(() => {
    if (!ticket || !draft || ticket.entryId !== draft.id || ticket.token === seenTicket.current) return;
    seenTicket.current = ticket.token;
    setDraft((current) => (current ? { ...current, design: ticket.design ?? undefined } : current));
  }, [ticket, draft]);

  useEffect(() => {
    if (draft) return;
    const next = routeId !== 'new' && existing ? fromEntry(existing) : blank(typeof params.date === 'string' ? params.date : todayKey(), useDiary.getState().settings.activeBookId);
    const pending = useDiary.getState().pageDesignTicket;
    if (pending && pending.entryId === next.id) {
      seenTicket.current = pending.token;
      next.design = pending.design ?? undefined;
    }
    setDraft(next);
  }, [draft, existing, params.date, routeId]);

  if (!draft) return null;
  const entryBook = books.find((book) => book.id === (draft.bookId ?? useDiary.getState().settings.activeBookId)) ?? books[0];
  const pageTheme = applyType(
    resolveEntryLook(entryBook ?? { themeId: bookThemeId }, draft, premium),
    draft.fontId ?? entryBook?.fontId,
    draft.inkColor ?? entryBook?.inkColor,
  );
  return (
    <ThemeOverride theme={pageTheme}>
      <Editor draft={draft} setDraft={setDraft} />
    </ThemeOverride>
  );
}

function Editor({ draft, setDraft }: { draft: Draft; setDraft: (draft: Draft) => void }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const settings = useDiary((state) => state.settings);
  const wallet = useDiary((state) => state.wallet);
  const entries = useDiary((state) => state.entries);
  const upsertEntry = useDiary((state) => state.upsertEntry);
  const deleteEntry = useDiary((state) => state.deleteEntry);
  const buySticker = useDiary((state) => state.buySticker);
  const [decorate, setDecorate] = useState(false);
  const [packId, setPackId] = useState(PACKS[0].id);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const [toast, setToast] = useState('');
  const [celebrate, setCelebrate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [editing, setEditing] = useState(false);
  const [scrollOn, setScrollOn] = useState(true);
  const leaving = useRef(false);
  const flipRef = useRef<PageFlipHandle>(null);
  const editingRef = useRef(false);
  const widthRef = useRef(1);
  editingRef.current = editing;
  widthRef.current = pageSize.width || 1;
  const review = useReviewMoment();
  const prompt = promptForDate(draft.date);
  const listedPacks = PACKS.filter((pack) => packIsListed(pack, wallet.ownedPackIds, shopToday(settings.debugDate), birthdayFrom(settings.birthdayMonth, settings.birthdayDay)));
  const activePack = listedPacks.find((pack) => pack.id === packId) ?? listedPacks[0] ?? PACKS[0];
  const streak = writingStreak(entries.map((entry) => entry.date));
  const buddy = getBuddy(settings.buddyId);
  const perch = buddy?.perch ?? 'br';
  const saved = entries.some((entry) => entry.id === draft.id);

  const signature = useMemo(() => JSON.stringify(draft), [draft]);
  const skipFirstSave = useRef(true);
  const draftRef = useRef(draft);
  const savedSig = useRef(signature);
  draftRef.current = draft;

  useEffect(() => {
    if (skipFirstSave.current) {
      skipFirstSave.current = false;
      savedSig.current = signature;
      return;
    }
    if (!pageNeedsSave(draft)) {
      savedSig.current = signature;
      return;
    }
    const handle = setTimeout(() => {
      const bonus = upsertEntry({ ...draft, updatedAt: Date.now(), sample: false });
      savedSig.current = signature;
      if (bonus > 0) {
        setToast(`Saved. +${bonus} coins for writing.`);
        setCelebrate(true);
        setTimeout(() => setCelebrate(false), 3200);
      } else setToast('Saved on this device.');
      const streakNow = writingStreak(useDiary.getState().entries.map((item) => item.date));
      void review.consider('entry-saved', streakNow);
    }, 400);
    return () => clearTimeout(handle);
  }, [signature]);

  useEffect(() => {
    return () => {
      const latest = draftRef.current;
      const latestSig = JSON.stringify(latest);
      if (latestSig === savedSig.current) return;
      if (!pageNeedsSave(latest)) return;
      upsertEntry({ ...latest, updatedAt: Date.now(), sample: false });
    };
    // signature is the draft snapshot; upsertEntry is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack();
      return true;
    });
    return () => sub.remove();
  }, [draft.id]);

  function goBack() {
    if (leaving.current) return;
    leaving.current = true;
    void playPageTurn();
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  function stepEntry(delta: number) {
    const bookId = draft.bookId ?? settings.activeBookId;
    const ordered = entries
      .filter((entry) => (entry.bookId ?? 'daily') === bookId)
      .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);
    const index = ordered.findIndex((entry) => entry.id === draft.id);
    const neighbor = ordered[index + delta];
    if (neighbor) {
      router.replace(`/entry/${neighbor.id}` as Href);
      return;
    }
    setDraft({ ...draft, date: addDays(draft.date, delta) });
  }

  const stepRef = useRef(stepEntry);
  stepRef.current = stepEntry;
  const swipe = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) => claimHorizontalSwipe(gesture.dx, gesture.dy, editingRef.current),
        onPanResponderGrant: () => setScrollOn(false),
        onPanResponderMove: (_, gesture) => {
          flipRef.current?.follow(gesture.dx / Math.max(widthRef.current, 240));
        },
        onPanResponderRelease: (_, gesture) => {
          setScrollOn(true);
          const decision = releaseSwipe(gesture.dx / Math.max(widthRef.current, 240));
          if (decision === 'cancel') flipRef.current?.cancel();
          else flipRef.current?.finish(decision, () => stepRef.current(decision === 'next' ? 1 : -1));
        },
        onPanResponderTerminate: () => {
          setScrollOn(true);
          flipRef.current?.cancel();
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [],
  );

  function pageNeedsSave(latest: Draft): boolean {
  const content = latest.title.trim() || latest.body.trim() || latest.photos.length > 0 || latest.stickers.length > 0 || latest.themeOverride || latest.design || latest.fontId || latest.inkColor;
  const stored = useDiary.getState().entries.find((entry) => entry.id === latest.id);
  const lookChanged = Boolean(stored) && ((stored?.themeOverride ?? null) !== (latest.themeOverride ?? null) || JSON.stringify(stored?.design ?? null) !== JSON.stringify(latest.design ?? null) || (stored?.fontId ?? null) !== (latest.fontId ?? null) || (stored?.inkColor ?? null) !== (latest.inkColor ?? null));
  return Boolean(content || lookChanged);
}

function updateSticker(next: StickerPlacement) {
    setDraft({ ...draft, stickers: draft.stickers.map((item) => (item.id === next.id ? next : item)) });
  }

  const selected = draft.stickers.find((item) => item.id === selectedId) ?? null;
  const padding = {
    paddingTop: perch === 'tr' || perch === 'banner' ? 108 : 18,
    paddingBottom: perch === 'br' || perch === 'bl' ? 130 : 24,
    paddingLeft: perch === 'tl' ? 86 : 26,
    paddingRight: 16,
  };

  return (
    <Screen nav={false} scroll={false} padded={false} style={{ flex: 1, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 8 }}>
        <Pressable onPress={goBack} accessibilityLabel="Back"><Text style={{ color: theme.colors.ink, fontFamily: theme.body, fontSize: 16 }}>‹ Back</Text></Pressable>
        <Pressable onPress={() => router.navigate('/')} accessibilityLabel="Home"><Text style={{ color: theme.colors.ink, fontFamily: theme.body, fontSize: 16 }}>Home</Text></Pressable>
        <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body }}>{toast || (saved ? 'On this device' : 'Not saved yet')}</Text>
        <Pressable onPress={() => setConfirmDelete(true)}><Text style={{ color: theme.colors.danger, fontFamily: theme.body }}>Delete</Text></Pressable>
      </View>
      <ScrollView style={{ flex: 1 }} scrollEnabled={scrollOn} contentContainerStyle={{ padding: 16, paddingBottom: decorate ? 12 : 40 }} keyboardShouldPersistTaps="handled">
        <PageFlip ref={flipRef} flipKey={`${draft.id}:${draft.date}`}>
        <View {...swipe.panHandlers} onLayout={(event) => setPageSize({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })}>
          <Paper style={{ minHeight: 640 }}>
            <View pointerEvents={decorate ? 'none' : 'auto'} style={[padding, { zIndex: decorate ? 0 : 3 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Pressable accessibilityLabel="Previous page" onPress={() => stepEntry(-1)}><Text style={{ color: theme.colors.paperInk, fontSize: 20 }}>‹</Text></Pressable>
                <Text style={{ color: theme.colors.paperSoft, fontFamily: theme.body }}>{formatLong(draft.date)}</Text>
                <Pressable accessibilityLabel="Next page" onPress={() => stepEntry(1)}><Text style={{ color: theme.colors.paperInk, fontSize: 20 }}>›</Text></Pressable>
              </View>
              <Text style={{ color: theme.colors.paperInk, fontFamily: theme.script, fontSize: 22, marginTop: 8 }}>{prompt}</Text>
              <MoodPicker value={draft.mood} onChange={(mood) => setDraft({ ...draft, mood })} />
              <EntryExtras isNew={!saved} draft={draft} onChange={(patch) => setDraft({ ...draft, ...patch })} />
              <TextInput
                value={draft.title}
                onChangeText={(title) => setDraft({ ...draft, title })}
                onFocus={() => setEditing(true)}
                onBlur={() => setEditing(false)}
                placeholder="Title"
                placeholderTextColor={theme.colors.paperSoft}
                editable={!decorate}
                style={{ color: theme.colors.paperInk, fontFamily: theme.script, fontSize: 34, marginTop: 8 }}
              />
              <TextInput
                value={draft.body}
                onChangeText={(body) => setDraft({ ...draft, body })}
                onFocus={() => setEditing(true)}
                onBlur={() => setEditing(false)}
                placeholder="Write the page…"
                placeholderTextColor={theme.colors.paperSoft}
                multiline
                editable={!decorate}
                style={{ color: theme.colors.paperInk, fontFamily: theme.body, fontSize: 17, lineHeight: 28, minHeight: 220, textAlignVertical: 'top' }}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 8 }}>
                {draft.photos.map((uri) => (
                  <Pressable key={uri.slice(0, 32)} onPress={() => setDraft({ ...draft, photos: draft.photos.filter((item) => item !== uri) })}>
                    <View style={{ backgroundColor: '#fff', padding: 6, paddingBottom: 16, transform: [{ rotate: '-2deg' }] }}>
                      <Image source={{ uri }} style={{ width: 96, height: 96 }} />
                    </View>
                  </Pressable>
                ))}
                {draft.photos.length < 4 ? (
                  <Pressable
                    onPress={async () => {
                      const result = await pickDiaryPhoto();
                      if ('error' in result) {
                        if (result.error) setToast(result.error);
                        return;
                      }
                      setDraft({ ...draft, photos: [...draft.photos, result.uri] });
                    }}
                    style={{ width: 96, height: 120, borderWidth: 1.5, borderStyle: 'dashed', borderColor: theme.colors.paperEdge, alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}
                  >
                    <Text style={{ color: theme.colors.paperSoft, fontFamily: theme.body, textAlign: 'center' }}>Add a photo</Text>
                  </Pressable>
                ) : null}
              </ScrollView>
            </View>
            <View pointerEvents="box-none" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: decorate ? 5 : 1 }}>
            <StickerLayer
              stickers={draft.stickers}
              width={pageSize.width}
              height={pageSize.height}
              decorate={decorate}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onChange={updateSticker}
            />
            </View>
            {buddy ? (
              <View
                pointerEvents="box-none"
                style={[
                  { zIndex: 6 },
                  perch === 'tr'
                    ? { position: 'absolute', top: 0, right: 4 }
                    : perch === 'tl'
                      ? { position: 'absolute', top: 64, left: 8 }
                      : perch === 'bl'
                        ? { position: 'absolute', bottom: 8, left: 8 }
                        : perch === 'banner'
                          ? { position: 'absolute', top: 4, left: 0, right: 0, alignItems: 'center' }
                          : { position: 'absolute', bottom: 4, right: 4 },
                ]}
              >
                <BuddyView
                  buddyId={buddy.id}
                  outfits={settings.outfitIds}
                  mood={draft.mood}
                  streak={streak}
                  writing={draft.body.trim().length > 0 || draft.title.trim().length > 0}
                  finished={draft.body.trim().length > 40 || celebrate}
                  entryCount={entries.length}
                  prompt={prompt}
                  celebrate={celebrate}
                  showLine
                  size={118}
                  taps
                />
              </View>
            ) : null}
          </Paper>
        </View>
        </PageFlip>
        {showThemes ? (
          <View style={{ paddingVertical: 8, gap: 8 }}>
            <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 22 }}>Page theme</Text>
            <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body }}>
              {draft.themeOverride || draft.design ? 'This page keeps its own look. Other pages still follow the book.' : 'This page uses the book design. A choice here stays on this page only.'}
            </Text>
            <Button label="Use book design" tone={draft.themeOverride || draft.design || draft.fontId || draft.inkColor ? 'primary' : 'ghost'} onPress={() => setDraft({ ...draft, themeOverride: null, design: undefined, fontId: undefined, inkColor: undefined })} />
            <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 22 }}>Page font</Text>
            <FontFields
              fontId={draft.fontId ?? null}
              inkColor={draft.inkColor ?? null}
              onFont={(fontId) => setDraft({ ...draft, fontId })}
              onInk={(inkColor) => setDraft({ ...draft, inkColor: sanitizeInk(inkColor) })}
              onReset={() => setDraft({ ...draft, fontId: undefined, inkColor: undefined })}
            />
            <Button
              label={draft.design ? 'This page has its own colors' : 'Custom colors for this page'}
              tone="ghost"
              onPress={() => {
                useDiary.getState().rememberPageDesign(draft.design ?? null);
                router.push(`/color-designer?target=page&entry=${draft.id}` as Href);
              }}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {THEMES.map((item) => (
                <Pressable key={item.id} onPress={() => { if (item.premium && !wallet.premium) { router.push('/paywall' as Href); return; } setDraft({ ...draft, themeOverride: item.id }); }} style={{ padding: 10, borderRadius: 12, backgroundColor: item.colors.paper, borderWidth: draft.themeOverride === item.id ? 2 : 0, borderColor: item.colors.accent, opacity: item.premium && !wallet.premium ? 0.55 : 1 }}>
                  <Text style={{ color: item.colors.paperInk, fontFamily: item.body }}>{item.emoji} {item.name}{item.premium ? ' · Plus' : ''}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </ScrollView>

      {decorate ? (
        <View style={{ maxHeight: '28%', backgroundColor: theme.colors.card, borderTopWidth: 1, borderTopColor: theme.colors.paperEdge, paddingHorizontal: 10, paddingTop: 6, paddingBottom: Math.max(insets.bottom, 8) }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body, fontSize: 12 }}>Drag a sticker. Empty page scrolls. Two fingers scroll too.</Text>
            <Button label="Done" onPress={() => setDecorate(false)} />
          </View>
          {selected ? (
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
              <Button label="Smaller" tone="ghost" onPress={() => updateSticker({ ...selected, scale: Math.max(0.45, selected.scale / 1.12) })} />
              <Button label="Bigger" tone="ghost" onPress={() => updateSticker({ ...selected, scale: Math.min(2.3, selected.scale * 1.12) })} />
              <Button label="Rotate" tone="ghost" onPress={() => updateSticker({ ...selected, rotation: (selected.rotation + 15) % 360 })} />
              <Button label="Remove" tone="danger" onPress={() => { setDraft({ ...draft, stickers: draft.stickers.filter((item) => item.id !== selected.id) }); setSelectedId(null); }} />
            </View>
          ) : null}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {listedPacks.map((pack) => (
              <Pressable key={pack.id} onPress={() => setPackId(pack.id)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: activePack.id === pack.id ? theme.colors.accent : theme.colors.chip }}>
                <Text style={{ color: activePack.id === pack.id ? theme.colors.onAccent : theme.colors.chipInk, fontFamily: theme.body, fontSize: 12 }}>{pack.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 8 }}>
            {stickersInPack(activePack.id).map((sticker) => {
              const owned = canUseItem(sticker, { ownedIds: wallet.ownedStickerIds, premium: wallet.premium && !activePack.seasonal });
              const plusPack = Boolean(activePack.premium) && !wallet.premium;
              return (
                <Pressable
                  key={sticker.id}
                  onPress={() => {
                    if (!owned) {
                      if (plusPack || sticker.unlock === 'premium' || sticker.rarity === 'legendary') {
                        router.push('/paywall' as Href);
                        return;
                      }
                      const result = buySticker(sticker.id);
                      if (!result.ok && result.message?.includes('Diary Plus')) router.push('/paywall' as Href);
                      else setToast(result.message ?? '');
                      return;
                    }
                    if (draft.stickers.length >= 24) {
                      setToast('This page is full of stickers.');
                      return;
                    }
                    lightTap();
                    const placed: StickerPlacement = {
                      id: uid('stk'),
                      stickerId: sticker.id,
                      x: 0.42 + Math.random() * 0.2,
                      y: 0.42 + Math.random() * 0.2,
                      scale: 1,
                      rotation: Math.round(Math.random() * 20 - 10),
                    };
                    setDraft({ ...draft, stickers: [...draft.stickers, placed] });
                    setSelectedId(placed.id);
                  }}
                  style={{ opacity: owned ? 1 : 0.45, alignItems: 'center', width: 74 }}
                >
                  <StickerView stickerId={sticker.id} size={64} />
                  <Text numberOfLines={1} style={{ color: theme.colors.inkSoft, fontSize: 10, fontFamily: theme.body }}>{owned ? sticker.name : plusPack || sticker.unlock !== 'coins' ? 'Plus' : `${sticker.price}🪙`}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 12, paddingBottom: Math.max(insets.bottom, 12) }}>
          <Button label="Decorate" onPress={() => setDecorate(true)} style={{ flex: 1 }} />
          <Button label={draft.themeOverride || draft.design ? 'Page theme · custom' : 'Page theme'} tone={showThemes ? 'primary' : 'ghost'} onPress={() => setShowThemes((value) => !value)} style={{ flex: 1 }} />
          <Button label="Pal" tone="ghost" onPress={() => router.push('/buddies' as Href)} />
        </View>
      )}
      {confirmDelete ? (
        <Confirm
          title="Delete this page?"
          body="It leaves this device. There is no undo."
          confirmLabel="Delete"
          danger
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            deleteEntry(draft.id);
            router.back();
          }}
        />
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
