import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Image, PanResponder, Platform, Pressable, Text, View } from 'react-native';

import { BuddyView } from '@/src/buddies/BuddyView';
import { BUDDIES } from '@/src/buddies/catalog';
import { DrawingSurface } from '@/src/components/DrawingPad';
import { Screen } from '@/src/components/Screen';
import { Button, CoinPill } from '@/src/components/ui';
import { strokesFrom } from '@/src/logic/drawing';
import { pickRoomPhoto } from '@/src/services/roomPhoto';
import { useDiary } from '@/src/store/useDiary';
import { useTheme } from '@/src/theme/BookTheme';
import { MOODS, type MoodId } from '@/src/data/moods';
import { FURNITURE, PLUSHES, ROOM_THEMES, goodsById, themeById } from '@/src/room/catalog';
import { buyGoods, buyTheme, defaultRoom, flipItem, moveItem, patchItem, placeItem, removeItem, seatFor, type PalRoom, type PlacedItem } from '@/src/room/edit';
import { RoomBackdrop, RoomSprite } from '@/src/room/art';
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
    if (!goods) return;
    const result = buyGoods(room, wallet.coins, wallet.premium, goods);
    setNote(result.message);
    if (!result.ok) {
      if (result.message.includes('Diary Plus')) router.push('/paywall');
      return;
    }
    save(result.room, result.coins);
  }

  function useThemeChoice(id: string) {
    const result = buyTheme(room, wallet.coins, wallet.premium, id);
    setNote(result.message);
    if (!result.ok && result.message.includes('Diary Plus')) router.push('/paywall');
    if (result.ok) save(result.room, result.coins);
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
                onSelect={() => {
                  setSelected(item.id);
                  if (!decorate && item.kind === 'easel') setPanel('easel');
                  if (!decorate && item.kind === 'frame') void choosePhoto(item);
                  setEaselId(item.kind === 'easel' ? item.id : null);
                }}
                onMove={(x, y) => save(moveItem(room, item.id, x, y))}
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
          {decorate && selected ? (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <Button label="Flip" tone="ghost" onPress={() => save(flipItem(room, selected))} />
              <Button label="Remove" tone="danger" onPress={() => { save(removeItem(room, selected)); setSelected(null); }} />
              {room.items.find((item) => item.id === selected)?.kind === 'frame' ? <Button label="Change photo" tone="ghost" onPress={() => { const item = room.items.find((entry) => entry.id === selected); if (item) void choosePhoto(item); }} /> : null}
              {room.items.find((item) => item.id === selected)?.kind === 'frame' && room.items.find((item) => item.id === selected)?.photo ? <Button label="Clear photo" tone="ghost" onPress={() => save(patchItem(room, selected, { photo: null }))} /> : null}
            </View>
          ) : null}
        </>
      ) : null}

      {panel === 'shop' ? (
        <View style={{ gap: 8, marginTop: 8 }}>
          {FURNITURE.map((goods) => {
            const owned = room.ownedKinds.includes(goods.id);
            return (
              <View key={goods.id} style={{ backgroundColor: theme.colors.card, borderRadius: 12, padding: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <RoomSprite kind={goods.id} />
                  <Text style={{ color: theme.colors.ink, fontFamily: theme.body }}>{goods.name}</Text>
                </View>
                {owned ? <Button label="Place" tone="ghost" onPress={() => { save(placeItem(room, goods.id, uid('room'))); setPanel('room'); setDecorate(true); }} /> : <Button label={goods.price ? `${goods.price} coins` : 'Free'} onPress={() => buy(goods.id)} />}
              </View>
            );
          })}
        </View>
      ) : null}

      {panel === 'themes' ? (
        <View style={{ gap: 8, marginTop: 8 }}>
          {ROOM_THEMES.map((item) => (
            <Pressable key={item.id} onPress={() => useThemeChoice(item.id)} style={{ backgroundColor: item.wall, borderRadius: 14, padding: 12, borderWidth: room.themeId === item.id ? 3 : 0, borderColor: theme.colors.accent }}>
              <Text style={{ color: item.id === 'starry' ? '#FFF6D8' : '#3A2A32', fontFamily: theme.display, fontSize: 22 }}>{item.name}</Text>
              <Text style={{ color: item.id === 'starry' ? '#FFF6D8' : '#3A2A32', fontFamily: theme.body }}>{room.ownedThemes.includes(item.id) ? 'Owned' : item.premium ? 'Diary Plus' : item.price ? `${item.price} coins` : 'Free'}</Text>
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
              <Pressable key={goods.id} onPress={() => (owned ? (save(placeItem(room, goods.id, uid('plush'))), setPanel('room')) : buy(goods.id))} style={{ width: '30%', backgroundColor: theme.colors.card, borderRadius: 12, padding: 8, alignItems: 'center' }}>
                <BuddyView buddyId={buddy?.id ?? 'mochi'} outfits={[]} mood="happy" streak={1} writing={false} finished={false} entryCount={1} size={64} />
                <Text style={{ color: theme.colors.ink, fontFamily: theme.body, fontSize: 12 }}>{buddy?.name ?? goods.name}</Text>
                <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body, fontSize: 11 }}>{owned ? 'Place' : `${goods.price} coins`}</Text>
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
    </Screen>
  );
}

function RoomThing({
  item,
  decorate,
  selected,
  onSelect,
  onMove,
}: {
  item: PlacedItem;
  decorate: boolean;
  selected: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
}) {
  const drag = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => decorate,
    onPanResponderGrant: () => onSelect(),
    onPanResponderMove: (_, gesture) => {
      onMove(item.x + gesture.dx / 320, item.y + gesture.dy / 420);
    },
  })).current;
  const webDrag = Platform.OS === 'web' && decorate
    ? {
        onPointerDown: (event: { clientX: number; clientY: number; currentTarget: HTMLElement }) => {
          onSelect();
          const parent = event.currentTarget.parentElement;
          const rect = parent?.getBoundingClientRect();
          if (!rect) return;
          const move = (ev: PointerEvent) => onMove((ev.clientX - rect.left) / rect.width, (ev.clientY - rect.top) / rect.height);
          const up = () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
          };
          window.addEventListener('pointermove', move);
          window.addEventListener('pointerup', up);
        },
      }
    : {};
  return (
    <View
      {...(decorate && Platform.OS !== 'web' ? drag.panHandlers : {})}
      {...(webDrag as object)}
      style={{ position: 'absolute', left: `${item.x * 100}%`, top: `${item.y * 100}%`, marginLeft: -36, marginTop: -36, transform: [{ scaleX: item.flip ? -1 : 1 }], zIndex: selected ? 5 : 1, borderWidth: selected ? 2 : 0, borderColor: '#8C2F39', borderRadius: 8 }}
    >
      <Pressable onPress={onSelect}>
        <RoomSprite kind={item.kind} photo={item.photo} drawing={item.drawing} />
        {item.kind === 'frame' && item.photo ? <Image source={{ uri: item.photo }} style={{ position: 'absolute', left: 14, top: 12, width: 44, height: 32, borderRadius: 2 }} /> : null}
      </Pressable>
    </View>
  );
}
