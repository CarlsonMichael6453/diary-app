import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { BookCover } from '@/src/components/BookCover';
import { PatternFill } from '@/src/components/PatternFill';
import { Screen } from '@/src/components/Screen';
import { Button } from '@/src/components/ui';
import { useDiary } from '@/src/store/useDiary';
import { useTheme } from '@/src/theme/BookTheme';
import {
  FREE_SWATCHES,
  METAL_CHOICES,
  MOTION_CHOICES,
  PATTERN_CHOICES,
  applyDesign,
  defaultDesign,
  designNeedsPlus,
  hslToHex,
  isMetalSwatch,
  swatchHex,
  type ColorDesign,
  type MetalId,
  type MotionId,
  type PatternId,
} from '@/src/theme/designs';

const HUES = [0, 18, 36, 52, 72, 110, 150, 190, 215, 250, 285, 325];

export default function ColorDesignerScreen() {
  const params = useLocalSearchParams<{ target?: string }>();
  const target = params.target === 'page' ? 'page' : 'book';
  const theme = useTheme();
  const premium = useDiary((state) => state.wallet.premium);
  const settings = useDiary((state) => state.settings);
  const setBookDesign = useDiary((state) => state.setBookDesign);
  const offerPageDesign = useDiary((state) => state.offerPageDesign);
  const book = settings.books.find((item) => item.id === settings.activeBookId);
  const seed = useDiary((state) => state.pageDesignSeed);
  const starting = target === 'page' ? seed ?? book?.design ?? defaultDesign() : book?.design ?? defaultDesign();
  const [draft, setDraft] = useState<ColorDesign>(starting ?? defaultDesign());
  const [slot, setSlot] = useState<'colorA' | 'colorB'>('colorA');
  const [notice, setNotice] = useState('');
  const preview = applyDesign(theme, draft, true);
  const locked = designNeedsPlus(draft) && !premium;

  function choose(patch: Partial<ColorDesign>) {
    setDraft((current) => ({ ...current, ...patch }));
    setNotice('');
  }

  function pickColor(value: string) {
    if (isMetalSwatch(value) && !premium) setNotice('Metallic colors are Diary Plus. The preview is local, and saving opens the paywall.');
    choose({ [slot]: value });
  }

  function save(where: 'book' | 'page') {
    if (designNeedsPlus(draft) && !premium) {
      router.push('/paywall' as Href);
      return;
    }
    if (where === 'book') {
      setBookDesign(draft);
      setNotice('This book’s cover and pages wear these colors.');
      return;
    }
    offerPageDesign(draft);
    router.back();
  }

  return (
    <Screen>
      <Button label="Back" tone="ghost" onPress={() => router.back()} />
      <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 36, marginTop: 8 }}>Color designer</Text>
      <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body }}>
        Patterns are free. Moving designs and metallic shine are Diary Plus. Nothing leaves this device.
      </Text>

      <View style={{ flexDirection: 'row', gap: 16, marginTop: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <BookCover title={settings.bookTitle} theme={preview} width={150} />
        <View style={{ width: 150, height: 190, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: preview.colors.paperEdge }}>
          <PatternFill design={preview.design ?? draft} />
          <View style={{ flex: 1, padding: 12, justifyContent: 'flex-end' }}>
            <Text style={{ color: preview.colors.ink, fontFamily: preview.script, fontSize: 22 }}>A live page</Text>
            <Text style={{ color: preview.colors.inkSoft, fontFamily: preview.body, fontSize: 13 }}>The pattern sits under the writing.</Text>
          </View>
        </View>
      </View>

      <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 26, marginTop: 18 }}>Pattern</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        {PATTERN_CHOICES.map((item) => (
          <Choice key={item.id} label={item.label} selected={draft.pattern === item.id} onPress={() => choose({ pattern: item.id as PatternId })} />
        ))}
      </View>

      <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 26, marginTop: 18 }}>Two colors</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
        <Choice label="Color A" selected={slot === 'colorA'} onPress={() => setSlot('colorA')} swatch={swatchHex(draft.colorA)} />
        <Choice label="Color B" selected={slot === 'colorB'} onPress={() => setSlot('colorB')} swatch={swatchHex(draft.colorB)} />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
        {FREE_SWATCHES.map((hex) => (
          <Pressable key={hex} accessibilityLabel={`Color ${hex}`} onPress={() => pickColor(hex)} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: hex, borderWidth: draft[slot] === hex ? 3 : 1, borderColor: draft[slot] === hex ? theme.colors.ink : '#FFFFFF' }} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        {HUES.map((hue) => {
          const hex = hslToHex(hue, 62, 62);
          return <Pressable key={hue} accessibilityLabel={`Hue ${hue}`} onPress={() => pickColor(hex)} style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: hex }} />;
        })}
      </View>

      <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 26, marginTop: 18 }}>Moving designs · Plus</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        <Choice label="Still" selected={draft.motion === 'none'} onPress={() => choose({ motion: 'none' })} />
        {MOTION_CHOICES.map((item) => (
          <Choice key={item.id} label={item.label} plus selected={draft.motion === item.id} onPress={() => choose({ motion: item.id as MotionId })} />
        ))}
      </View>

      <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 26, marginTop: 18 }}>Metallic · Plus</Text>
      <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body }}>A metal can be the finish, or color A or B. The shine sweeps across the cover and the page.</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        <Choice label="No metal" selected={draft.metal === 'none'} onPress={() => choose({ metal: 'none' })} />
        {METAL_CHOICES.map((item) => (
          <Choice
            key={item.id}
            label={item.label}
            plus
            swatch={item.base}
            selected={draft.metal === item.id || draft[slot] === item.id}
            onPress={() => {
              if (!premium) setNotice('Metallics shine with Diary Plus.');
              choose({ metal: item.id as MetalId, [slot]: item.id });
            }}
          />
        ))}
      </View>

      {notice ? <Text style={{ color: theme.colors.ink, fontFamily: theme.body, marginTop: 12 }}>{notice}</Text> : null}
      <View style={{ gap: 8, marginTop: 16 }}>
        <Button label={locked ? 'Use on this book · Plus' : 'Use on this book'} onPress={() => save('book')} />
        {target === 'page' ? <Button label={locked ? 'Use on this page · Plus' : 'Use on this page'} tone="ghost" onPress={() => save('page')} /> : null}
        <Button
          label="Clear custom colors"
          tone="ghost"
          onPress={() => {
            if (target === 'page') {
              offerPageDesign(null);
              router.back();
              return;
            }
            setBookDesign(null);
            setDraft(defaultDesign());
            setNotice('The book is back to its style colors.');
          }}
        />
      </View>
    </Screen>
  );
}

function Choice({
  label,
  selected,
  onPress,
  plus = false,
  swatch,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  plus?: boolean;
  swatch?: string;
}) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: selected ? theme.colors.accent : theme.colors.chip, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      {swatch ? <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: swatch }} /> : null}
      <Text style={{ color: selected ? theme.colors.onAccent : theme.colors.chipInk, fontFamily: theme.body }}>{label}</Text>
      {plus ? <Text style={{ color: selected ? theme.colors.onAccent : theme.colors.accent, fontFamily: theme.body, fontSize: 12 }}>Plus</Text> : null}
    </Pressable>
  );
}
