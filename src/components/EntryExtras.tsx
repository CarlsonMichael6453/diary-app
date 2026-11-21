import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { TEMPLATES } from '../logic/templates';
import { capturePlace } from '../services/place';
import { useDiary } from '../store/useDiary';
import { holdPage } from '../logic/pageGesture';
import { useTheme } from '../theme/BookTheme';
import { VoiceNote } from './VoiceNote';
import { Button, FieldLabel } from './ui';

const ACTIVITIES = ['walk', 'friends', 'work', 'rest', 'outside', 'cook'];

export function EntryExtras({
  draft,
  onChange,
  isNew,
  onDraw,
}: {
  draft: {
    title: string;
    body: string;
    tags?: string[];
    activities?: string[];
    templateId?: string | null;
    voiceNote?: string | null;
    drawing?: string | null;
    placeLabel?: string | null;
    weather?: string | null;
  };
  onChange: (patch: Partial<{ title: string; body: string; tags: string[]; activities: string[]; templateId: string | null; voiceNote: string | null; drawing: string | null; placeLabel: string | null; weather: string | null }>) => void;
  isNew: boolean;
  onDraw?: () => void;
}) {
  const theme = useTheme();
  const locationOn = useDiary((state) => state.settings.locationOnEntry);
  const weatherOn = useDiary((state) => state.settings.weatherOnEntry);
  const [tag, setTag] = useState('');

  useEffect(() => {
    if (!isNew || (!locationOn && !weatherOn) || draft.placeLabel) return;
    capturePlace().then((place) => {
      if ('error' in place) return;
      onChange({
        placeLabel: place.label,
        weather: weatherOn && place.summary ? `${place.summary}${place.temperatureC != null ? ` ${Math.round(place.temperatureC)}°C` : ''}` : draft.weather,
      });
    });
    // Capture once for a new page when the toggles are on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew, locationOn, weatherOn]);

  function toggleActivity(activity: string) {
    const current = draft.activities ?? [];
    const activities = current.includes(activity) ? current.filter((item) => item !== activity) : [...current, activity];
    onChange({ activities });
  }

  return (
    <View style={{ gap: 8, marginTop: 12 }}>
      {isNew && !draft.body ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {TEMPLATES.map((template) => (
            <Pressable key={template.id} onPressIn={() => holdPage(true)} onPressOut={() => holdPage(false)} onPress={() => onChange({ templateId: template.id, title: template.title || draft.title, body: template.body })} style={{ touchAction: 'none', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: theme.colors.chip } as object}>
              <Text style={{ color: theme.colors.chipInk, fontFamily: theme.body }}>{template.name}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <FieldLabel>Tags</FieldLabel>
      <View onTouchStart={() => holdPage(true)} onTouchEnd={() => holdPage(false)} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, touchAction: 'none' } as object}>
        {(draft.tags ?? []).map((item) => (
          <Text key={item} style={{ color: theme.colors.ink, fontFamily: theme.body }}>{item}</Text>
        ))}
      </View>
      <TextInput value={tag} onChangeText={setTag} placeholder="Add a tag" placeholderTextColor={theme.colors.inkSoft} onFocus={() => holdPage(true)} onBlur={() => holdPage(false)} onSubmitEditing={() => { if (!tag.trim()) return; onChange({ tags: [...(draft.tags ?? []), tag.trim()] }); setTag(''); }} style={{ backgroundColor: theme.colors.card, color: theme.colors.ink, borderRadius: 12, padding: 8, fontFamily: theme.body, touchAction: 'none' } as object} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {ACTIVITIES.map((activity) => (
          <Pressable key={activity} onPressIn={() => holdPage(true)} onPressOut={() => holdPage(false)} onPress={() => toggleActivity(activity)} style={{ touchAction: 'none', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: (draft.activities ?? []).includes(activity) ? theme.colors.accent : theme.colors.chip } as object}>
            <Text style={{ color: (draft.activities ?? []).includes(activity) ? theme.colors.onAccent : theme.colors.chipInk, fontFamily: theme.body }}>{activity}</Text>
          </Pressable>
        ))}
      </View>
      {draft.placeLabel || draft.weather ? <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body }}>{[draft.placeLabel, draft.weather].filter(Boolean).join(' · ')}</Text> : null}
      <VoiceNote value={draft.voiceNote} onChange={(voiceNote) => onChange({ voiceNote })} />
      <Button label="Draw on this page" tone="ghost" onPress={() => onDraw?.()} />
    </View>
  );
}
