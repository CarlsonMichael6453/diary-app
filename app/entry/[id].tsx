import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Platform, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BuddyView } from '@/src/buddies/BuddyView';
import { getBuddy } from '@/src/buddies/catalog';
import { DrawingSurface, DrawingToolbar, LegacyDrawing } from '@/src/components/DrawingPad';
import { EntryExtras } from '@/src/components/EntryExtras';
import { HorizontalStrip } from '@/src/components/HorizontalStrip';
import { MoodPicker } from '@/src/components/MoodPicker';
import { FontFields } from '@/src/components/FontFields';
import { PhotoNoteLayer } from '@/src/components/PhotoNoteLayer';
import { BlankSheet, EndPaper, NeighborPage } from '@/src/components/NeighborPage';
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
import { pageNeighbors, type PageStop } from '@/src/logic/bookPages';
import { formatLong, todayKey } from '@/src/logic/dates';
import { uid } from '@/src/logic/id';
import { countReviewEntries } from '@/src/logic/review';
import { writingStreak } from '@/src/logic/streak';
import { collageSlots, type CollagePreset } from '@/src/logic/collage';
import { bindPageScroll, holdDrawing, holdPage } from '@/src/logic/pageGesture';
import { PAGE_TEXT_ID, reorderStack, type LayerMove } from '@/src/logic/layers';
import type { DiaryEntry, NotePlacement, PhotoFrame, PhotoPlacement, StickerPlacement } from '@/src/models/types';
import { lightTap } from '@/src/services/haptics';
import { pickDiaryPhotos, takeDiaryPhoto } from '@/src/services/photos';
import { useDiary } from '@/src/store/useDiary';
import { PACKS, stickersInPack } from '@/src/stickers/catalog';
import { StickerView } from '@/src/stickers/StickerView';
import { ThemeOverride, useTheme } from '@/src/theme/BookTheme';
import { resolveEntryLook, type ColorDesign } from '@/src/theme/designs';
import { applyType, FONT_CHOICES, INK_SWATCHES, sanitizeInk } from '@/src/theme/fonts';
import { THEMES, getTheme, type ThemeId } from '@/src/theme/themes';

const webScroll = { touchAction: 'manipulation', overscrollBehaviorY: 'contain', WebkitOverflowScrolling: 'touch' } as const;

type Draft = {
  id: string;
  date: string;
  title: string;
  body: string;
  mood: MoodId;
  photos: string[];
  photoPlacements: PhotoPlacement[];
  notes: NotePlacement[];
  textZ: number;
  photoOnly: boolean;
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
  return { id: uid('page'), date, title: '', body: '', mood: 'calm', photos: [], photoPlacements: [], notes: [], textZ: 10, photoOnly: false, stickers: [], themeOverride: null, createdAt: Date.now(), bookId, tags: [], activities: [] };
}

function fromEntry(entry: DiaryEntry): Draft {
  return {
    id: entry.id,
    date: entry.date,
    title: entry.title,
    body: entry.body,
    mood: entry.mood,
    photos: entry.photos,
    photoPlacements: entry.photoPlacements ?? entry.photos.map((uri, index) => ({ id: `photo-${entry.id}-${index}`, uri, x: 0.22 + (index % 3) * 0.28, y: 0.72, scale: 0.9, rotation: 0, frame: 'none' as const, z: 20 + index })),
    notes: entry.notes ?? [],
    textZ: entry.textZ ?? 10,
    photoOnly: entry.photoOnly ?? false,
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
  const dateParam = typeof params.date === 'string' ? params.date : '';
  const routeSeen = useRef(`${routeId}:${dateParam}`);

  useEffect(() => {
    const key = `${routeId}:${dateParam}`;
    if (routeSeen.current === key) return;
    routeSeen.current = key;
    setDraft(null);
  }, [routeId, dateParam]);

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
  const [drawingMode, setDrawingMode] = useState(false);
  const [drawScroll, setDrawScroll] = useState(false);
  const [penColor, setPenColor] = useState('#3A2A32');
  const [penSize, setPenSize] = useState(5);
  const [erasing, setErasing] = useState(false);
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const leaving = useRef(false);

  useEffect(() => {
    holdDrawing(drawingMode);
    return () => holdDrawing(false);
  }, [drawingMode]);

  useEffect(() => {
    bindPageScroll((enabled) => {
      const node = scrollRef.current;
      const el = node?.getScrollableNode?.() ?? node;
      const allow = enabled && (!drawingMode || drawScroll);
      if (el?.style) el.style.overflowY = allow ? 'auto' : 'hidden';
      if (Platform.OS !== 'web') setScrollOn(allow);
    });
    return () => bindPageScroll(null);
  }, [drawingMode, drawScroll]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onScroll = (event: Event) => setDrawScroll(Boolean((event as CustomEvent<boolean>).detail));
    window.addEventListener('diary-draw-scroll', onScroll);
    return () => window.removeEventListener('diary-draw-scroll', onScroll);
  }, []);

  function rememberColor(next: string) {
    setPenColor(next);
    setRecentColors((colors) => [next, ...colors.filter((color) => color !== next)].slice(0, 6));
  }
  const scrollRef = useRef<{ getScrollableNode?: () => { style: CSSStyleDeclaration }; style?: CSSStyleDeclaration } | null>(null);
  const screen = useWindowDimensions();
  const pageMin = Math.max(640, screen.height - insets.top - 132);
  const flipRef = useRef<PageFlipHandle>(null);
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
      const savedEntries = useDiary.getState().entries;
      const streakNow = writingStreak(savedEntries.map((item) => item.date));
      void review.consider('entry-saved', streakNow, countReviewEntries(savedEntries));
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
    const leave = () => {
      if (router.canGoBack()) router.back();
      else router.replace('/');
    };
    if (flipRef.current) flipRef.current.finish('prev', leave);
    else leave();
  }

  function turnPage(delta: number) {
    if (drawingMode) return;
    const go = () => stepEntry(delta);
    if (flipRef.current) flipRef.current.finish(delta > 0 ? 'next' : 'prev', go);
    else go();
  }

  function pagesInBook() {
    const bookId = draft.bookId ?? settings.activeBookId;
    return entries.filter((entry) => (entry.bookId ?? 'daily') === bookId);
  }

  function sheetFor(stop: PageStop | null, edge: 'start' | 'end') {
    if (!stop) return <EndPaper edge={edge} />;
    if (stop.kind === 'blank') return <BlankSheet date={stop.date} />;
    const entry = entries.find((item) => item.id === stop.id);
    if (!entry) return <EndPaper edge={edge} />;
    const book = settings.books.find((item) => item.id === (entry.bookId ?? settings.activeBookId));
    return <NeighborPage entry={entry} book={book} premium={wallet.premium} />;
  }

  function openStop(stop: PageStop | null) {
    if (!stop) return;
    if (stop.kind === 'entry') router.replace(`/entry/${stop.id}` as Href);
    else router.replace(`/entry/new?date=${stop.date}` as Href);
  }

  function stepEntry(delta: number) {
    if (drawingMode) return;
    const { prev, next } = pageNeighbors(pagesInBook(), draft, todayKey());
    openStop(delta > 0 ? next : prev);
  }

  const neighbors = useMemo(() => {
    const bookId = draft.bookId ?? settings.activeBookId;
    const pages = entries.filter((entry) => (entry.bookId ?? 'daily') === bookId);
    return pageNeighbors(pages, draft, todayKey());
  }, [draft, entries, settings.activeBookId]);

  function pageNeedsSave(latest: Draft): boolean {
  const content = latest.title.trim() || latest.body.trim() || latest.photos.length > 0 || latest.stickers.length > 0 || latest.photoPlacements.length > 0 || latest.notes.length > 0 || latest.photoOnly || latest.drawing || latest.voiceNote || latest.themeOverride || latest.design || latest.fontId || latest.inkColor;
  const stored = useDiary.getState().entries.find((entry) => entry.id === latest.id);
  const lookChanged = Boolean(stored) && ((stored?.themeOverride ?? null) !== (latest.themeOverride ?? null) || JSON.stringify(stored?.design ?? null) !== JSON.stringify(latest.design ?? null) || (stored?.fontId ?? null) !== (latest.fontId ?? null) || (stored?.inkColor ?? null) !== (latest.inkColor ?? null));
  return Boolean(content || lookChanged);
}

function updateSticker(next: StickerPlacement) {
    setDraft({ ...draft, stickers: draft.stickers.map((item) => (item.id === next.id ? next : item)) });
  }

  function nextZ(): number {
    const values = [draft.textZ, ...draft.stickers.map((item) => item.z ?? 0), ...draft.photoPlacements.map((item) => item.z ?? 0), ...draft.notes.map((item) => item.z ?? 0)];
    return Math.max(...values) + 1;
  }

  function moveLayer(id: string, move: LayerMove) {
    const items = [
      { id: PAGE_TEXT_ID, z: draft.textZ },
      ...draft.stickers.map((item) => ({ id: item.id, z: item.z ?? draft.textZ + 1 })),
      ...draft.photoPlacements.map((item) => ({ id: item.id, z: item.z ?? draft.textZ + 1 })),
      ...draft.notes.map((item) => ({ id: item.id, z: item.z ?? draft.textZ + 1 })),
    ];
    const stacked = reorderStack(items, id, move);
    const zOf = (itemId: string) => stacked.find((item) => item.id === itemId)?.z ?? 0;
    setDraft({
      ...draft,
      textZ: zOf(PAGE_TEXT_ID),
      stickers: draft.stickers.map((item) => ({ ...item, z: zOf(item.id) })),
      photoPlacements: draft.photoPlacements.map((item) => ({ ...item, z: zOf(item.id) })),
      notes: draft.notes.map((item) => ({ ...item, z: zOf(item.id) })),
    });
  }

  async function addPhotos(uris: string[]) {
    const room = Math.max(0, 12 - draft.photoPlacements.length);
    const take = uris.slice(0, room);
    if (take.length === 0) {
      setToast('This page already has twelve photos.');
      return;
    }
    const slots = collageSlots('grid', draft.photoPlacements.length + take.length).slice(draft.photoPlacements.length);
    const placed: PhotoPlacement[] = take.map((uri, index) => ({
      id: uid('photo'),
      uri,
      ...slots[index],
      z: nextZ() + index,
    }));
    setDraft({
      ...draft,
      photos: [...draft.photos, ...take],
      photoPlacements: [...draft.photoPlacements, ...placed],
    });
    setSelectedId(placed[0]?.id ?? null);
  }

  function applyCollage(preset: CollagePreset) {
    const slots = collageSlots(preset, draft.photoPlacements.length);
    setDraft({
      ...draft,
      photoPlacements: draft.photoPlacements.map((photo, index) => ({ ...photo, ...slots[index] })),
    });
  }

  const selected = draft.stickers.find((item) => item.id === selectedId) ?? null;
  const selectedPhoto = draft.photoPlacements.find((item) => item.id === selectedId) ?? null;
  const selectedNote = draft.notes.find((item) => item.id === selectedId) ?? null;
  const selectedLayer = selectedId;
  const padding = {
    paddingTop: perch === 'tr' || perch === 'banner' ? 108 : 18,
    paddingBottom: perch === 'br' || perch === 'bl' ? 130 : 24,
    paddingLeft: perch === 'tl' ? 86 : 26,
    paddingRight: 16,
  };

  return (
    <Screen nav={false} scroll={false} padded={false} style={{ flex: 1, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 8, zIndex: 200 }}>
        <Pressable onPress={goBack} accessibilityLabel="Back"><Text style={{ color: theme.colors.ink, fontFamily: theme.body, fontSize: 16 }}>‹ Back</Text></Pressable>
        <Pressable onPress={() => router.navigate('/')} accessibilityLabel="Home"><Text style={{ color: theme.colors.ink, fontFamily: theme.body, fontSize: 16 }}>Home</Text></Pressable>
        <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body }}>{toast || (saved ? 'On this device' : 'Not saved yet')}</Text>
        <Pressable onPress={() => setConfirmDelete(true)}><Text style={{ color: theme.colors.danger, fontFamily: theme.body }}>Delete</Text></Pressable>
      </View>
      <ScrollView
        ref={scrollRef as never}
        style={[{ flex: 1 }, webScroll]}
        scrollEnabled={scrollOn && (!drawingMode || drawScroll)}
        contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: decorate ? 12 : 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <PageFlip
          ref={flipRef}
          flipKey={`${draft.id}:${draft.date}`}
          editing={editing}
          canNext={Boolean(neighbors.next)}
          canPrev={Boolean(neighbors.prev)}
          onScrollLock={(enabled) => {
            const node = scrollRef.current;
            const el = node?.getScrollableNode?.() ?? node;
            if (el?.style) el.style.overflowY = enabled ? 'auto' : 'hidden';
            if (Platform.OS !== 'web') setScrollOn(enabled);
          }}
          style={{ flexGrow: 1, minHeight: pageMin }}
          onCommit={(direction) => stepEntry(direction === 'next' ? 1 : -1)}
          nextSheet={sheetFor(neighbors.next, 'end')}
          prevSheet={sheetFor(neighbors.prev, 'start')}
        >
        <View onLayout={(event) => setPageSize({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })}>
          <Paper style={{ flexGrow: 1, minHeight: pageMin }}>
            <View pointerEvents={decorate ? 'none' : 'auto'} style={[padding, { zIndex: 80, position: 'relative', paddingBottom: 0 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Pressable accessibilityLabel="Previous page" onPress={() => turnPage(-1)}><Text style={{ color: theme.colors.paperInk, fontSize: 20 }}>‹</Text></Pressable>
                <Text style={{ color: theme.colors.paperSoft, fontFamily: theme.body }}>{formatLong(draft.date)}</Text>
                <Pressable accessibilityLabel="Next page" onPress={() => turnPage(1)}><Text style={{ color: theme.colors.paperInk, fontSize: 20 }}>›</Text></Pressable>
              </View>
              <Text style={{ color: theme.colors.paperInk, fontFamily: theme.script, fontSize: 22, marginTop: 8 }}>{prompt}</Text>
              <MoodPicker value={draft.mood} onChange={(mood) => setDraft({ ...draft, mood })} />
              <EntryExtras isNew={!saved} draft={draft} onChange={(patch) => setDraft({ ...draft, ...patch })} onDraw={() => { setDrawingMode(true); setDrawScroll(false); }} />
              <LegacyDrawing value={draft.drawing} paper={theme.colors.paper} />
              {draft.photoOnly ? <Text style={{ color: theme.colors.paperSoft, fontFamily: theme.body, marginTop: 12 }}>Photo page</Text> : null}
            </View>
            {draft.photoOnly ? null : (
              <View pointerEvents={decorate ? 'none' : 'auto'} style={{ zIndex: 12, position: 'relative', paddingLeft: padding.paddingLeft, paddingRight: padding.paddingRight, paddingBottom: padding.paddingBottom }}>
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
              </View>
            )}
            <StickerLayer
              stickers={draft.stickers}
              width={pageSize.width}
              height={pageSize.height}
              decorate={decorate}
              selectedId={selectedId}
              textZ={draft.textZ}
              onSelect={setSelectedId}
              onChange={updateSticker}
              onDeselect={() => setSelectedId(null)}
            />
            <PhotoNoteLayer
              photos={draft.photoPlacements}
              notes={draft.notes}
              width={pageSize.width}
              height={pageSize.height}
              textZ={draft.textZ}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onChangePhoto={(next) => setDraft({ ...draft, photoPlacements: draft.photoPlacements.map((item) => (item.id === next.id ? next : item)) })}
              onChangeNote={(next) => setDraft({ ...draft, notes: draft.notes.map((item) => (item.id === next.id ? next : item)) })}
              onEditNote={(id, text) => setDraft({ ...draft, notes: draft.notes.map((item) => (item.id === id ? { ...item, text } : item)) })}
              onEditing={setEditing}
              decorate={decorate}
            />
            {buddy ? (
              <View
                pointerEvents="box-none"
                style={[
                  { zIndex: 180 },
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
            <DrawingSurface
              value={draft.drawing}
              active={drawingMode && !drawScroll}
              color={penColor}
              size={penSize}
              erase={erasing}
              paper={theme.colors.paper}
              onChange={(drawing) => setDraft({ ...draft, drawing })}
            />
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
            <HorizontalStrip contentContainerStyle={{ gap: 8 }}>
              {THEMES.map((item) => (
                <Pressable key={item.id} onPress={() => { if (item.premium && !wallet.premium) { router.push('/paywall' as Href); return; } setDraft({ ...draft, themeOverride: item.id }); }} style={{ padding: 10, borderRadius: 12, backgroundColor: item.colors.paper, borderWidth: draft.themeOverride === item.id ? 2 : 0, borderColor: item.colors.accent, opacity: item.premium && !wallet.premium ? 0.55 : 1 }}>
                  <Text style={{ color: item.colors.paperInk, fontFamily: item.body }}>{item.emoji} {item.name}{item.premium ? ' · Plus' : ''}</Text>
                </Pressable>
              ))}
            </HorizontalStrip>
          </View>
        ) : null}
      </ScrollView>

      {decorate ? (
        <View style={{ maxHeight: '28%', backgroundColor: theme.colors.card, borderTopWidth: 1, borderTopColor: theme.colors.paperEdge, paddingHorizontal: 10, paddingTop: 6, paddingBottom: Math.max(insets.bottom, 8), zIndex: 200 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body, fontSize: 12 }}>Drag a sticker. Empty page scrolls. Two fingers scroll too.</Text>
            <Button label="Done" onPress={() => setDecorate(false)} />
          </View>
          {selectedLayer ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
              <Button label="Front" tone="ghost" onPress={() => moveLayer(selectedLayer, 'front')} />
              <Button label="Forward" tone="ghost" onPress={() => moveLayer(selectedLayer, 'forward')} />
              <Button label="Backward" tone="ghost" onPress={() => moveLayer(selectedLayer, 'backward')} />
              <Button label="Back" tone="ghost" onPress={() => moveLayer(selectedLayer, 'back')} />
              {selected ? (
                <>
                  <Button label="Smaller" tone="ghost" onPress={() => updateSticker({ ...selected, scale: Math.max(0.45, selected.scale / 1.12) })} />
                  <Button label="Bigger" tone="ghost" onPress={() => updateSticker({ ...selected, scale: Math.min(2.3, selected.scale * 1.12) })} />
                  <Button label="Rotate" tone="ghost" onPress={() => updateSticker({ ...selected, rotation: (selected.rotation + 15) % 360 })} />
                  <Button label="Remove" tone="danger" onPress={() => { setDraft({ ...draft, stickers: draft.stickers.filter((item) => item.id !== selected.id) }); setSelectedId(null); }} />
                </>
              ) : null}
              {selectedPhoto ? (
                <>
                  <Button label="Frame" tone="ghost" onPress={() => {
                    const frames: PhotoFrame[] = ['none', 'polaroid', 'tape', 'round'];
                    const frame = frames[(frames.indexOf(selectedPhoto.frame) + 1) % frames.length];
                    setDraft({ ...draft, photoPlacements: draft.photoPlacements.map((item) => (item.id === selectedPhoto.id ? { ...item, frame } : item)) });
                  }} />
                  <Button label="Remove" tone="danger" onPress={() => setDraft({ ...draft, photoPlacements: draft.photoPlacements.filter((item) => item.id !== selectedPhoto.id), photos: draft.photoPlacements.filter((item) => item.id !== selectedPhoto.id).map((item) => item.uri) })} />
                </>
              ) : null}
              {selectedNote ? (
                <>
                  <Button label="Style" tone="ghost" onPress={() => {
                    const styles = ['none', 'sticky', 'bubble', 'tag', 'torn', 'highlight'] as const;
                    const style = styles[(styles.indexOf(selectedNote.style) + 1) % styles.length];
                    setDraft({ ...draft, notes: draft.notes.map((item) => (item.id === selectedNote.id ? { ...item, style } : item)) });
                  }} />
                  <Button label="Remove" tone="danger" onPress={() => { setDraft({ ...draft, notes: draft.notes.filter((item) => item.id !== selectedNote.id) }); setSelectedId(null); }} />
                </>
              ) : null}
            </View>
          ) : null}
          <HorizontalStrip contentContainerStyle={{ gap: 8, paddingBottom: 6 }}>
            <Button label="Photos" tone="ghost" onPress={async () => {
              const result = await pickDiaryPhotos();
              if ('error' in result) {
                if (result.error) setToast(result.error);
                return;
              }
              await addPhotos(result.uris);
            }} />
            <Button label="Camera" tone="ghost" onPress={async () => {
              const result = await takeDiaryPhoto();
              if ('error' in result) {
                if (result.error) setToast(result.error);
                return;
              }
              await addPhotos([result.uri]);
            }} />
            <Button label="Note" tone="ghost" onPress={() => {
              const note: NotePlacement = { id: uid('note'), text: '', x: 0.5, y: 0.55, scale: 1, rotation: -4, style: 'sticky', fontId: draft.fontId, inkColor: draft.inkColor, z: nextZ() };
              setDraft({ ...draft, notes: [...draft.notes, note] });
              setSelectedId(note.id);
            }} />
            <Button label={draft.photoOnly ? 'Add writing' : 'Photo page'} tone="ghost" onPress={() => setDraft({ ...draft, photoOnly: !draft.photoOnly })} />
            {(['two', 'three', 'grid', 'scatter', 'full'] as const).map((preset) => (
              <Button key={preset} label={preset === 'two' ? '2-up' : preset === 'three' ? '3-up' : preset === 'grid' ? 'Grid' : preset === 'scatter' ? 'Scatter' : 'Full'} tone="ghost" onPress={() => applyCollage(preset)} />
            ))}
            <Button label="Page text" tone={selectedId === PAGE_TEXT_ID ? 'primary' : 'ghost'} onPress={() => setSelectedId(PAGE_TEXT_ID)} />
          </HorizontalStrip>
          {selectedNote ? (
            <HorizontalStrip contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
              {FONT_CHOICES.map((font) => (
                <Pressable key={font.id} onPress={() => setDraft({ ...draft, notes: draft.notes.map((item) => (item.id === selectedNote.id ? { ...item, fontId: font.id } : item)) })} style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: selectedNote.fontId === font.id ? theme.colors.accent : theme.colors.chip }}>
                  <Text style={{ color: selectedNote.fontId === font.id ? theme.colors.onAccent : theme.colors.chipInk, fontFamily: font.script }}>{font.name}</Text>
                </Pressable>
              ))}
              {INK_SWATCHES.slice(0, 12).map((hex) => (
                <Pressable key={hex} accessibilityLabel="Note ink swatch" onPress={() => setDraft({ ...draft, notes: draft.notes.map((item) => (item.id === selectedNote.id ? { ...item, inkColor: hex } : item)) })} style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: hex, borderWidth: selectedNote.inkColor === hex ? 2 : 0, borderColor: theme.colors.accent }} />
              ))}
            </HorizontalStrip>
          ) : null}
          <HorizontalStrip contentContainerStyle={{ gap: 8 }}>
            {listedPacks.map((pack) => (
              <Pressable key={pack.id} onPress={() => setPackId(pack.id)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: activePack.id === pack.id ? theme.colors.accent : theme.colors.chip }}>
                <Text style={{ color: activePack.id === pack.id ? theme.colors.onAccent : theme.colors.chipInk, fontFamily: theme.body, fontSize: 12 }}>{pack.name}</Text>
              </Pressable>
            ))}
          </HorizontalStrip>
          <HorizontalStrip contentContainerStyle={{ gap: 8, paddingTop: 8 }}>
            {stickersInPack(activePack.id).map((sticker) => {
              const owned = canUseItem(sticker, { ownedIds: wallet.ownedStickerIds, premium: wallet.premium && !activePack.seasonal });
              const plusPack = Boolean(activePack.premium) && !wallet.premium;
              return (
                <Pressable
                  key={sticker.id}
                  onPressIn={() => holdPage(true)}
                  onPressOut={() => holdPage(false)}
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
                      z: nextZ(),
                    };
                    const scroller = (scrollRef.current?.getScrollableNode?.() ?? scrollRef.current) as { scrollTop?: number } | null;
                    const kept = scroller?.scrollTop ?? 0;
                    setDraft({ ...draft, stickers: [...draft.stickers, placed] });
                    setSelectedId(placed.id);
                    requestAnimationFrame(() => {
                      if (scroller) scroller.scrollTop = kept;
                    });
                  }}
                  style={{ opacity: owned ? 1 : 0.45, alignItems: 'center', width: 74, touchAction: 'pan-x' } as object}
                >
                  <StickerView stickerId={sticker.id} size={64} />
                  <Text numberOfLines={1} style={{ color: theme.colors.inkSoft, fontSize: 10, fontFamily: theme.body }}>{owned ? sticker.name : plusPack || sticker.unlock !== 'coins' ? 'Plus' : `${sticker.price}🪙`}</Text>
                </Pressable>
              );
            })}
          </HorizontalStrip>
        </View>
      ) : drawingMode ? (
        <View style={{ backgroundColor: theme.colors.card, borderTopWidth: 1, borderTopColor: theme.colors.paperEdge, paddingHorizontal: 12, paddingTop: 8, paddingBottom: Math.max(insets.bottom, 8), zIndex: 200 }}>
          <DrawingToolbar
            color={penColor}
            size={penSize}
            erase={erasing}
            recent={recentColors}
            scrolling={drawScroll}
            onColor={rememberColor}
            onSize={setPenSize}
            onErase={setErasing}
            onScroll={setDrawScroll}
            onDone={() => { setDrawingMode(false); setDrawScroll(false); }}
          />
        </View>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 12, paddingBottom: Math.max(insets.bottom, 12), zIndex: 200 }}>
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
