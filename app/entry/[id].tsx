import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BuddyView } from '@/src/buddies/BuddyView';
import { getBuddy } from '@/src/buddies/catalog';
import { MoodPicker } from '@/src/components/MoodPicker';
import { Paper } from '@/src/components/Paper';
import { Screen } from '@/src/components/Screen';
import { StickerLayer } from '@/src/components/StickerLayer';
import { Button, Confirm } from '@/src/components/ui';
import { type MoodId } from '@/src/data/moods';
import { promptForDate } from '@/src/data/prompts';
import { canUseItem } from '@/src/logic/access';
import { addDays, formatLong, todayKey } from '@/src/logic/dates';
import { uid } from '@/src/logic/id';
import { writingStreak } from '@/src/logic/streak';
import type { DiaryEntry, StickerPlacement } from '@/src/models/types';
import { lightTap } from '@/src/services/haptics';
import { pickDiaryPhoto } from '@/src/services/photos';
import { useDiary } from '@/src/store/useDiary';
import { PACKS, stickersInPack } from '@/src/stickers/catalog';
import { StickerView } from '@/src/stickers/StickerView';
import { ThemeOverride, useTheme } from '@/src/theme/BookTheme';
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
  createdAt: number;
};

function blank(date: string): Draft {
  return { id: uid('page'), date, title: '', body: '', mood: 'calm', photos: [], stickers: [], themeOverride: null, createdAt: Date.now() };
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
    createdAt: entry.createdAt,
  };
}

export default function EntryScreen() {
  const params = useLocalSearchParams<{ id: string; date?: string }>();
  const routeId = String(params.id ?? 'new');
  const bookThemeId = useDiary((state) => state.settings.themeId);
  const existing = useDiary((state) => state.entries.find((entry) => entry.id === routeId));
  const [draft, setDraft] = useState<Draft | null>(null);

  useEffect(() => {
    if (draft) return;
    if (routeId !== 'new' && existing) setDraft(fromEntry(existing));
    else setDraft(blank(typeof params.date === 'string' ? params.date : todayKey()));
  }, [draft, existing, params.date, routeId]);

  if (!draft) return null;
  const pageTheme = draft.themeOverride ? getTheme(draft.themeOverride) : null;
  return (
    <ThemeOverride theme={pageTheme ?? getTheme(bookThemeId)}>
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
  const prompt = promptForDate(draft.date);
  const streak = writingStreak(entries.map((entry) => entry.date));
  const buddy = getBuddy(settings.buddyId);
  const perch = buddy?.perch ?? 'br';
  const saved = entries.some((entry) => entry.id === draft.id);

  const signature = useMemo(() => JSON.stringify(draft), [draft]);
  const skipFirstSave = useRef(true);

  useEffect(() => {
    if (skipFirstSave.current) {
      skipFirstSave.current = false;
      return;
    }
    const dirty = draft.title.trim() || draft.body.trim() || draft.photos.length > 0 || draft.stickers.length > 0;
    if (!dirty) return;
    const handle = setTimeout(() => {
      const bonus = upsertEntry({ ...draft, updatedAt: Date.now(), sample: false });
      if (bonus > 0) {
        setToast(`Saved. +${bonus} coins for writing.`);
        setCelebrate(true);
        setTimeout(() => setCelebrate(false), 3200);
      } else setToast('Saved on this device.');
    }, 650);
    return () => clearTimeout(handle);
    // signature is the draft snapshot; upsertEntry is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

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
    <Screen scroll={false} padded={false} style={{ flex: 1, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 8 }}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Back"><Text style={{ color: theme.colors.ink, fontFamily: theme.body, fontSize: 16 }}>Back</Text></Pressable>
        <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body }}>{toast || (saved ? 'On this device' : 'Not saved yet')}</Text>
        <Pressable onPress={() => setConfirmDelete(true)}><Text style={{ color: theme.colors.danger, fontFamily: theme.body }}>Delete</Text></Pressable>
      </View>
      <ScrollView scrollEnabled={!decorate} contentContainerStyle={{ padding: 16, paddingBottom: decorate ? 20 : 40 }} keyboardShouldPersistTaps="handled">
        <View onLayout={(event) => setPageSize({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })}>
          <Paper style={{ minHeight: 640 }}>
            <View pointerEvents={decorate ? 'none' : 'auto'} style={[padding, { zIndex: decorate ? 0 : 3 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Pressable onPress={() => setDraft({ ...draft, date: addDays(draft.date, -1) })}><Text style={{ color: theme.colors.paperInk, fontSize: 20 }}>‹</Text></Pressable>
                <Text style={{ color: theme.colors.paperSoft, fontFamily: theme.body }}>{formatLong(draft.date)}</Text>
                <Pressable onPress={() => setDraft({ ...draft, date: addDays(draft.date, 1) })}><Text style={{ color: theme.colors.paperInk, fontSize: 20 }}>›</Text></Pressable>
              </View>
              <Text style={{ color: theme.colors.paperInk, fontFamily: theme.script, fontSize: 22, marginTop: 8 }}>{prompt}</Text>
              <MoodPicker value={draft.mood} onChange={(mood) => setDraft({ ...draft, mood })} />
              <TextInput
                value={draft.title}
                onChangeText={(title) => setDraft({ ...draft, title })}
                placeholder="Title"
                placeholderTextColor={theme.colors.paperSoft}
                editable={!decorate}
                style={{ color: theme.colors.paperInk, fontFamily: theme.script, fontSize: 34, marginTop: 8 }}
              />
              <TextInput
                value={draft.body}
                onChangeText={(body) => setDraft({ ...draft, body })}
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
                pointerEvents="none"
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
                />
              </View>
            ) : null}
          </Paper>
        </View>
        {showThemes ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 12 }}>
            <Pressable onPress={() => setDraft({ ...draft, themeOverride: null })} style={{ padding: 10, borderRadius: 12, backgroundColor: draft.themeOverride ? theme.colors.chip : theme.colors.accent }}>
              <Text style={{ color: draft.themeOverride ? theme.colors.chipInk : theme.colors.onAccent, fontFamily: theme.body }}>Match the book</Text>
            </Pressable>
            {THEMES.map((item) => (
              <Pressable key={item.id} onPress={() => setDraft({ ...draft, themeOverride: item.id })} style={{ padding: 10, borderRadius: 12, backgroundColor: item.colors.paper, borderWidth: draft.themeOverride === item.id ? 2 : 0, borderColor: item.colors.accent }}>
                <Text style={{ color: item.colors.paperInk, fontFamily: item.body }}>{item.emoji} {item.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}
      </ScrollView>

      {decorate ? (
        <View style={{ backgroundColor: theme.colors.card, borderTopWidth: 1, borderTopColor: theme.colors.paperEdge, padding: 10, paddingBottom: Math.max(insets.bottom, 10) }}>
          {selected ? (
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
              <Button label="Smaller" tone="ghost" onPress={() => updateSticker({ ...selected, scale: Math.max(0.45, selected.scale / 1.12) })} />
              <Button label="Bigger" tone="ghost" onPress={() => updateSticker({ ...selected, scale: Math.min(2.3, selected.scale * 1.12) })} />
              <Button label="Rotate" tone="ghost" onPress={() => updateSticker({ ...selected, rotation: (selected.rotation + 15) % 360 })} />
              <Button label="Remove" tone="danger" onPress={() => { setDraft({ ...draft, stickers: draft.stickers.filter((item) => item.id !== selected.id) }); setSelectedId(null); }} />
            </View>
          ) : (
            <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body, marginBottom: 6 }}>Drag a sticker. The gold dot resizes it.</Text>
          )}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {PACKS.map((pack) => (
              <Pressable key={pack.id} onPress={() => setPackId(pack.id)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: packId === pack.id ? theme.colors.accent : theme.colors.chip }}>
                <Text style={{ color: packId === pack.id ? theme.colors.onAccent : theme.colors.chipInk, fontFamily: theme.body, fontSize: 12 }}>{pack.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 8 }}>
            {stickersInPack(packId).map((sticker) => {
              const owned = canUseItem(sticker, { ownedIds: wallet.ownedStickerIds, premium: wallet.premium });
              return (
                <Pressable
                  key={sticker.id}
                  onPress={() => {
                    if (!owned) {
                      if (sticker.unlock === 'premium' || sticker.rarity === 'legendary' || sticker.rarity === 'epic') router.push('/paywall' as Href);
                      else {
                        const result = buySticker(sticker.id);
                        setToast(result.message ?? '');
                      }
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
                  <Text numberOfLines={1} style={{ color: theme.colors.inkSoft, fontSize: 10, fontFamily: theme.body }}>{owned ? sticker.name : sticker.unlock === 'coins' ? `${sticker.price}🪙` : 'Plus'}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <Button label="Done decorating" onPress={() => setDecorate(false)} style={{ marginTop: 8 }} />
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: 8, padding: 12, paddingBottom: Math.max(insets.bottom, 12) }}>
          <Button label="Decorate" onPress={() => setDecorate(true)} style={{ flex: 1 }} />
          <Button label={draft.themeOverride ? `${getTheme(draft.themeOverride).name} page` : 'Page style'} tone="ghost" onPress={() => setShowThemes((value) => !value)} style={{ flex: 1 }} />
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
    </Screen>
  );
}
