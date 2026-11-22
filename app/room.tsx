import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Animated, PanResponder, Platform, Pressable, Text, View } from 'react-native';

import { BuddyView } from '@/src/buddies/BuddyView';
import { BUDDIES } from '@/src/buddies/catalog';
import { DrawingSurface } from '@/src/components/DrawingPad';
import { ItemPreview } from '@/src/components/ItemPreview';
import { Screen } from '@/src/components/Screen';
import { Button, CoinPill } from '@/src/components/ui';
import { strokesFrom } from '@/src/logic/drawing';
import { pickRoomPhoto } from '@/src/services/roomPhoto';
import { useDiary } from '@/src/store/useDiary';
import { useTheme } from '@/src/theme/BookTheme';
import { MOODS, type MoodId } from '@/src/data/moods';
import { FURNITURE, PLUSHES, ROOM_THEMES, goodsById, isFrame, themeById } from '@/src/room/catalog';
import { buyGoods, buyTheme, defaultRoom, flipItem, moveItem, patchItem, placeItem, removeItem, resizeItem, seatFor, type PalRoom, type PlacedItem } from '@/src/room/edit';
import { RoomBackdrop, RoomSprite, RoomSwatch, spriteBox } from '@/src/room/art';
import { Plushie } from '@/src/room/plush';
import { uid } from '@/src/logic/id';

type Panel = 'room' | 'shop' | 'themes' | 'plush' | 'easel';

export default function PalRoomScreen() {
  const theme = useTheme();
  const settings = useDiary((state) => state.settings);
  const entries = useDiary((state) => state.entries);
  const wallet = useDiary((state) => state.wallet);
  const room = settings.room ?? defaultRoom();
  const [panel, setPanel] = useState<Panel>('room');
  const [decorate, setDecorate] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [easelId, setEaselId] = useState<string | null>(null);
  const [pen, setPen] = useState('#E85D4C');
  const latestMood = [...entries].sort((a, b) => b.date.localeCompare(a.date))[0]?.mood ?? 'happy';
  const [mood, setMood] = useState<MoodId>(latestMood);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const box = useRef({ width: 320, height: 420 });
  const look = themeById(room.themeId);
  const night = new Date().getHours() >= 19 || new Date().getHours() < 6;
  const seat = seatFor(room);
  const month = new Date().getMonth();

  function save(next: PalRoom, coins = wallet.coins) {
    useDiary.setState((state) => ({
      wallet: { ...state.wallet, coins },
      settings: { ...state.settings, room: next },
    }));
  }

  function buy(id: string) {
    const goods = goodsById(id);
    if (!goods) return false;
    const result = buyGoods(room, wallet.coins, wallet.premium, goods);
    setNote(result.message);
    if (!result.ok) {
      if (result.message.includes('Diary Plus')) router.push('/paywall');
      return false;
    }
    save(result.room, result.coins);
    return true;
  }

  async function choosePhoto(item: PlacedItem) {
    const uri = await pickRoomPhoto();
    if (!uri) return;
    save(patchItem(room, item.id, { photo: uri }));
  }

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Pressable onPress={() => (panel === 'room' ? router.back() : setPanel('room'))}><Text style={{ color: theme.colors.ink, fontFamily: theme.body }}>{panel === 'room' ? 'Back' : 'Room'}</Text></Pressable>
        <CoinPill coins={wallet.coins} />
      </View>
      <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 32, marginTop: 6 }}>Pal room</Text>
      {note ? <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body }}>{note}</Text> : null}

      {panel === 'room' ? (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 8 }}>
            <Button label={decorate ? 'Done decorating' : 'Decorate'} onPress={() => { setDecorate((value) => !value); setSelected(null); }} />
            <Button label="Shop" tone="ghost" onPress={() => setPanel('shop')} />
            <Button label="Themes" tone="ghost" onPress={() => setPanel('themes')} />
            <Button label="Plushies" tone="ghost" onPress={() => setPanel('plush')} />
          </View>
          <View
            onLayout={(event) => { box.current = { width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height }; }}
            style={{ height: 420, borderRadius: 18, overflow: 'hidden', backgroundColor: look.wall }}
          >
            <RoomBackdrop wall={look.wall} floor={look.floor} trim={look.trim} window={look.window} night={night} />
            {month === 10 ? <Text style={{ position: 'absolute', top: 8, right: 12, fontSize: 22 }}>🍂</Text> : null}
            {room.items.map((item) => (
              <RoomThing
                key={item.id}
                item={item}
                decorate={decorate}
                selected={selected === item.id}
                ink={theme.colors.ink}
                onSelect={() => {
                  setSelected(item.id);
                  if (item.kind === 'easel') setEaselId(item.id);
                }}
                onOpen={() => {
                  if (item.kind === 'easel') {
                    setEaselId(item.id);
                    setPanel('easel');
                  }
                  if (isFrame(item.kind)) void choosePhoto(item);
                }}
                onMove={(x, y) => save(moveItem(room, item.id, x, y))}
                onResize={(scale) => save(resizeItem(room, item.id, scale))}
              />
            ))}
            <View pointerEvents="box-none" style={{ position: 'absolute', left: `${(seat?.x ?? 0.55) * 100}%`, top: `${(seat?.y ?? 0.58) * 100}%`, marginLeft: -36, marginTop: -40 }}>
              <BuddyView buddyId={settings.buddyId === 'none' ? 'mochi' : settings.buddyId} outfits={settings.outfitIds} mood={mood} streak={3} writing={false} finished={mood !== 'tired'} entryCount={4} size={86} taps wander={!seat} />
            </View>
            <Text style={{ position: 'absolute', left: 16, bottom: 16, fontSize: 22 }}>🐈</Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {MOODS.map((item) => (
              <Pressable key={item.id} accessibilityLabel={item.label} onPress={() => setMood(item.id)} style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: mood === item.id ? item.color : theme.colors.chip }}>
                <Text>{item.emoji}</Text>
              </Pressable>
            ))}
          </View>
          {selected && isFrame(room.items.find((item) => item.id === selected)?.kind ?? '') ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              <Button label="Smaller" tone="ghost" onPress={() => save(resizeItem(room, selected, (room.items.find((item) => item.id === selected)?.scale ?? 1) - 0.15))} />
              <Button label="Bigger" tone="ghost" onPress={() => save(resizeItem(room, selected, (room.items.find((item) => item.id === selected)?.scale ?? 1) + 0.15))} />
              <Button label="Change photo" tone="ghost" onPress={() => { const item = room.items.find((entry) => entry.id === selected); if (item) void choosePhoto(item); }} />
              {room.items.find((item) => item.id === selected)?.photo ? <Button label="Clear photo" tone="ghost" onPress={() => save(patchItem(room, selected, { photo: null }))} /> : null}
            </View>
          ) : null}
          {decorate && selected ? (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <Button label="Flip" tone="ghost" onPress={() => save(flipItem(room, selected))} />
              <Button label="Remove" tone="danger" onPress={() => { save(removeItem(room, selected)); setSelected(null); }} />
            </View>
          ) : null}
        </>
      ) : null}

      {panel === 'shop' ? (
        <View style={{ gap: 8, marginTop: 8 }}>
          {FURNITURE.map((goods) => {
            const owned = room.ownedKinds.includes(goods.id);
            return (
              <Pressable key={goods.id} accessibilityLabel={`${goods.name} preview`} onPress={() => { setNote(''); setPreviewId(goods.id); }} style={{ backgroundColor: theme.colors.card, borderRadius: 12, padding: 8, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <RoomSprite kind={goods.id} size={64} ink={theme.colors.ink} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.colors.ink, fontFamily: theme.body }}>{goods.name}</Text>
                  <Text style={{ color: theme.colors.ink, fontFamily: theme.body, fontSize: 13 }}>{owned ? 'Owned' : goods.premium ? 'Diary Plus' : goods.price ? `${goods.price} coins` : 'Free'}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {panel === 'themes' ? (
        <View style={{ gap: 8, marginTop: 8 }}>
          {ROOM_THEMES.map((item) => (
            <Pressable key={item.id} accessibilityLabel={`${item.name} preview`} onPress={() => { setNote(''); setPreviewId(item.id); }} style={{ backgroundColor: theme.colors.card, borderRadius: 14, padding: 8, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: room.themeId === item.id ? 3 : 0, borderColor: theme.colors.accent }}>
              <RoomSwatch theme={item} width={96} height={68} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 22 }}>{item.name}</Text>
                <Text style={{ color: theme.colors.ink, fontFamily: theme.body }}>{room.ownedThemes.includes(item.id) ? (room.themeId === item.id ? 'In use' : 'Owned') : item.premium ? 'Diary Plus' : item.price ? `${item.price} coins` : 'Free'}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}

      {panel === 'plush' ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          {PLUSHES.map((goods) => {
            const owned = room.ownedKinds.includes(goods.id);
            const buddy = BUDDIES.find((item) => `plush-${item.id}` === goods.id);
            return (
              <Pressable key={goods.id} accessibilityLabel={`${buddy?.name ?? goods.name} plush preview`} onPress={() => { setNote(''); setPreviewId(goods.id); }} style={{ width: '30%', backgroundColor: theme.colors.card, borderRadius: 12, padding: 8, alignItems: 'center' }}>
                <Plushie buddyId={buddy?.id ?? 'mochi'} size={72} ink={theme.colors.ink} />
                <Text style={{ color: theme.colors.ink, fontFamily: theme.body, fontSize: 12 }}>{buddy?.name ?? goods.name}</Text>
                <Text style={{ color: theme.colors.ink, fontFamily: theme.body, fontSize: 11 }}>{owned ? 'Owned' : `${goods.price} coins`}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {panel === 'easel' && easelId ? (
        <View style={{ marginTop: 8, gap: 8 }}>
          <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 26 }}>Easel</Text>
          <View style={{ height: 240, borderRadius: 16, overflow: 'hidden', backgroundColor: '#FFFDF8' }}>
            <DrawingSurface
              value={room.items.find((item) => item.id === easelId)?.drawing}
              active
              color={pen}
              size={4}
              erase={false}
              paper="#FFFDF8"
              onChange={(drawing) => save(patchItem(room, easelId, { drawing }))}
            />
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {['#E85D4C', '#3A2A32', '#2E86FF', '#7DCE82'].map((color) => (
              <Pressable key={color} onPress={() => setPen(color)} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: color }} />
            ))}
          </View>
          <Button label="Back to the room" onPress={() => setPanel('room')} />
          <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body }}>{strokesFrom(room.items.find((item) => item.id === easelId)?.drawing).length} strokes on the canvas.</Text>
        </View>
      ) : null}
      <ShopPreview
        id={previewId}
        room={room}
        premium={wallet.premium}
        note={note}
        onClose={() => setPreviewId(null)}
        onBuy={(id) => {
          if (buy(id)) {
            setPreviewId(null);
            setPanel('room');
          }
        }}
        onTheme={(id) => {
          const result = buyTheme(room, wallet.coins, wallet.premium, id);
          setNote(result.message);
          if (!result.ok && result.message.includes('Diary Plus')) router.push('/paywall');
          if (!result.ok) return;
          save(result.room, result.coins);
          setPreviewId(null);
          setPanel('room');
        }}
        onPlace={(id) => {
          const goods = goodsById(id);
          save(placeItem(room, id, uid(goods?.kind === 'plush' ? 'plush' : 'room')));
          setPreviewId(null);
          setPanel('room');
          setDecorate(true);
        }}
      />
    </Screen>
  );
}

function ShopPreview({
  id,
  room,
  premium,
  note,
  onClose,
  onBuy,
  onTheme,
  onPlace,
}: {
  id: string | null;
  room: PalRoom;
  premium: boolean;
  note: string;
  onClose: () => void;
  onBuy: (id: string) => void;
  onTheme: (id: string) => void;
  onPlace: (id: string) => void;
}) {
  const goods = id ? goodsById(id) : undefined;
  const look = id ? ROOM_THEMES.find((item) => item.id === id) : undefined;
  const buddy = goods?.kind === 'plush' ? BUDDIES.find((item) => goods.id === `plush-${item.id}`) : undefined;
  const owned = goods ? room.ownedKinds.includes(goods.id) : look ? room.ownedThemes.includes(look.id) : false;
  const price = look
    ? owned
      ? room.themeId === look.id ? 'In use' : 'Owned'
      : look.premium ? 'Diary Plus' : look.price ? `${look.price} coins` : 'Free'
    : goods
      ? owned
        ? 'Owned'
        : goods.premium ? 'Diary Plus' : goods.price ? `${goods.price} coins` : 'Free'
      : '';
  const action = !id
    ? undefined
    : owned
      ? look ? 'Use this theme' : 'Place in the room'
      : (look?.premium || goods?.premium) && !premium
        ? 'See Diary Plus'
        : look
          ? look.price ? `Buy for ${look.price} coins` : 'Use this theme'
          : goods?.price
            ? `Buy for ${goods.price} coins`
            : 'Add it';
  return (
    <ItemPreview
      visible={Boolean(id && (goods || look))}
      title={look?.name ?? (buddy ? `${buddy.name} plush` : goods?.name ?? '')}
      detail={note && id ? `${price}. ${note}` : price}
      onClose={onClose}
      actionLabel={action}
      onAction={() => {
        if (!id) return;
        if (look) {
          onTheme(id);
          return;
        }
        if (owned) onPlace(id);
        else if ((goods?.premium) && !premium) onBuy(id);
        else onBuy(id);
      }}
    >
      {look ? <RoomSwatch theme={look} width={260} height={170} /> : null}
      {goods?.kind === 'furniture' ? <RoomSprite kind={goods.id} size={160} /> : null}
      {goods?.kind === 'plush' ? <Plushie buddyId={buddy?.id ?? 'mochi'} size={160} /> : null}
    </ItemPreview>
  );
}

function RoomThing({
  item,
  decorate,
  selected,
  ink,
  onSelect,
  onOpen,
  onMove,
  onResize,
}: {
  item: PlacedItem;
  decorate: boolean;
  selected: boolean;
  ink: string;
  onSelect: () => void;
  onOpen: () => void;
  onMove: (x: number, y: number) => void;
  onResize: (scale: number) => void;
}) {
  const plush = item.kind.startsWith('plush-');
  const frame = isFrame(item.kind);
  const canDrag = useRef(false);
  canDrag.current = decorate || plush || frame;
  const origin = useRef(item);
  origin.current = item;
  const dragOrigin = useRef(item);
  const pinch = useRef<{ dist: number; scale: number } | null>(null);
  const resizing = useRef(false);
  const squish = useRef(new Animated.Value(0)).current;
  function dropped() {
    if (!plush) return;
    squish.setValue(0);
    Animated.sequence([
      Animated.timing(squish, { toValue: 1, duration: 90, useNativeDriver: false }),
      Animated.timing(squish, { toValue: 0, duration: 160, useNativeDriver: false }),
    ]).start();
  }
  const drag = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => canDrag.current,
    onPanResponderGrant: (event) => {
      dragOrigin.current = origin.current;
      const touches = event.nativeEvent.touches ?? [];
      pinch.current = touches.length >= 2 ? { dist: touchGap(touches), scale: origin.current.scale ?? 1 } : null;
      onSelect();
    },
    onPanResponderMove: (event, gesture) => {
      const touches = event.nativeEvent.touches ?? [];
      if (isFrame(origin.current.kind) && touches.length >= 2 && pinch.current && pinch.current.dist > 0) {
        onResize(pinch.current.scale * (touchGap(touches) / pinch.current.dist));
        return;
      }
      onMove(dragOrigin.current.x + gesture.dx / 320, dragOrigin.current.y + gesture.dy / 420);
    },
    onPanResponderRelease: (_, gesture) => {
      dropped();
      if (!decorate && origin.current.kind === 'easel' && Math.hypot(gesture.dx, gesture.dy) < 8) onOpen();
    },
  })).current;
  const webDrag = Platform.OS === 'web' && (decorate || plush || frame)
    ? {
        onPointerDown: (event: { clientX: number; clientY: number; currentTarget: HTMLElement; target: EventTarget | null }) => {
          const target = event.target as HTMLElement | null;
          if (resizing.current || target?.closest?.('[aria-label="Resize frame"]')) return;
          onSelect();
          const parent = event.currentTarget.parentElement;
          const rect = parent?.getBoundingClientRect();
          if (!rect) return;
          const startX = event.clientX;
          const startY = event.clientY;
          let dragged = false;
          const move = (ev: PointerEvent) => {
            if (Math.hypot(ev.clientX - startX, ev.clientY - startY) > 6) dragged = true;
            if (dragged) onMove((ev.clientX - rect.left) / rect.width, (ev.clientY - rect.top) / rect.height);
          };
          const up = () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
            if (!dragged && !decorate && origin.current.kind === 'easel') onOpen();
            dropped();
          };
          window.addEventListener('pointermove', move);
          window.addEventListener('pointerup', up);
        },
      }
    : {};
  const box = spriteBox(item.kind, item.scale ?? 1);
  const squashX = squish.interpolate({ inputRange: [0, 1], outputRange: [1, 1.16] });
  const squashY = squish.interpolate({ inputRange: [0, 1], outputRange: [1, 0.84] });
  return (
    <Animated.View
      {...(canDrag.current && Platform.OS !== 'web' ? drag.panHandlers : {})}
      {...(webDrag as object)}
      style={{ position: 'absolute', left: `${item.x * 100}%`, top: `${item.y * 100}%`, marginLeft: -box.width / 2, marginTop: -box.height / 2, zIndex: (item.z ?? 0) + 1, borderWidth: selected ? 2 : 0, borderColor: '#8C2F39', borderRadius: 8, transform: [{ scaleX: item.flip ? -1 : 1 }] }}
    >
      <Animated.View style={{ transform: [{ scaleX: squashX }, { scaleY: squashY }] }}>
        <Pressable accessibilityRole="button" accessibilityLabel={item.kind === 'easel' ? 'Open easel' : frame ? 'Picture frame' : item.kind} onPress={() => { if (!decorate && !frame && item.kind === 'easel') onOpen(); }}>
          <RoomSprite kind={item.kind} photo={item.photo} drawing={item.drawing} ink={ink} width={box.width} />
        </Pressable>
        {selected && frame ? (
          <View
            accessibilityLabel="Resize frame"
            onPointerDown={(event: { nativeEvent: { pageX: number; pageY: number }; stopPropagation?: () => void }) => {
              resizing.current = true;
              event.stopPropagation?.();
              const startX = event.nativeEvent.pageX;
              const startScale = origin.current.scale ?? 1;
              const move = (ev: PointerEvent) => onResize(startScale + (ev.clientX - startX) / 110);
              const up = () => {
                resizing.current = false;
                window.removeEventListener('pointermove', move);
                window.removeEventListener('pointerup', up);
              };
              window.addEventListener('pointermove', move);
              window.addEventListener('pointerup', up);
            }}
            style={{ position: 'absolute', right: -6, bottom: -6, width: 22, height: 22, borderRadius: 6, backgroundColor: '#FFFDF8', borderWidth: 2, borderColor: '#8C2F39' }}
          />
        ) : null}
      </Animated.View>
    </Animated.View>
  );
}

function touchGap(touches: ReadonlyArray<{ pageX: number; pageY: number }>): number {
  if (touches.length < 2) return 0;
  return Math.hypot(touches[0].pageX - touches[1].pageX, touches[0].pageY - touches[1].pageY);
}
