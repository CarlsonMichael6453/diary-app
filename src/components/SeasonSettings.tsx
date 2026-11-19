import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { birthdayFrom, isDateKey, shopToday } from '../logic/seasons';
import { useDiary } from '../store/useDiary';
import { useTheme } from '../theme/BookTheme';
import { Button, FieldLabel } from './ui';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function SeasonSettings() {
  const theme = useTheme();
  const settings = useDiary((state) => state.settings);
  const patchSettings = useDiary((state) => state.patchSettings);
  const [draft, setDraft] = useState(settings.debugDate ?? '');
  const [dayText, setDayText] = useState(settings.birthdayDay ? String(settings.birthdayDay) : '');
  const [note, setNote] = useState('');
  const shop = shopToday(settings.debugDate);

  function saveBirthday(month: number | null, day: number | null) {
    if (month && day && !birthdayFrom(month, day)) {
      setNote('That day is not in that month. February can be 29.');
      patchSettings({ birthdayMonth: month, birthdayDay: null });
      return;
    }
    setNote('');
    patchSettings({ birthdayMonth: month, birthdayDay: day });
  }

  function setMonth(month: number) {
    const day = Number(dayText);
    saveBirthday(month, day >= 1 && day <= 31 ? day : settings.birthdayDay);
  }

  function setDay(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 2);
    setDayText(digits);
    if (!digits) {
      saveBirthday(settings.birthdayMonth, null);
      return;
    }
    const day = Number(digits);
    if (day < 1 || day > 31) return;
    saveBirthday(settings.birthdayMonth, day);
  }

  return (
    <View style={{ marginTop: 18, gap: 8 }}>
      <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 26 }}>Seasonal stickers</Text>
      <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body }}>
        Holiday packs are in the shop for a few weeks, then they come back next year. Anything you already own stays in the sticker book.
      </Text>
      <FieldLabel>Birthday, if you want a birthday pack</FieldLabel>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {MONTHS.map((label, index) => {
          const month = index + 1;
          const selected = settings.birthdayMonth === month;
          return (
            <Pressable key={label} onPress={() => setMonth(month)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: selected ? theme.colors.accent : theme.colors.chip }}>
              <Text style={{ color: selected ? theme.colors.onAccent : theme.colors.chipInk, fontFamily: theme.body }}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
      <TextInput
        value={dayText}
        onChangeText={setDay}
        keyboardType="number-pad"
        placeholder="Day"
        placeholderTextColor={theme.colors.inkSoft}
        accessibilityLabel="Birthday day"
        style={{ backgroundColor: theme.colors.card, color: theme.colors.ink, borderRadius: 14, padding: 10, fontFamily: theme.body, maxWidth: 120 }}
      />
      <Button label="Clear birthday" tone="ghost" onPress={() => { setDayText(''); patchSettings({ birthdayMonth: null, birthdayDay: null }); }} />
      <FieldLabel>Shop date for testing</FieldLabel>
      <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body }}>The shop thinks today is {shop}. Pages still use the real date.</Text>
      <TextInput
        value={draft}
        onChangeText={setDraft}
        autoCapitalize="none"
        placeholder="YYYY-MM-DD"
        placeholderTextColor={theme.colors.inkSoft}
        accessibilityLabel="Shop preview date"
        style={{ backgroundColor: theme.colors.card, color: theme.colors.ink, borderRadius: 14, padding: 10, fontFamily: theme.body }}
      />
      <Button
        label="Preview this date"
        onPress={() => {
          if (!isDateKey(draft.trim())) {
            setNote('Use a real calendar date, like 2026-12-20.');
            return;
          }
          patchSettings({ debugDate: draft.trim() });
          setNote(`The shop is previewing ${draft.trim()}.`);
        }}
      />
      <Button label="Use the real date" tone="ghost" onPress={() => { setDraft(''); patchSettings({ debugDate: null }); setNote('The shop is back on today’s date.'); }} />
      {note ? <Text style={{ color: theme.colors.ink, fontFamily: theme.body }}>{note}</Text> : null}
    </View>
  );
}
