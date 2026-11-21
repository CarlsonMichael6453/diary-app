import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { tagSummary } from '../logic/tags';
import { TEMPLATES } from '../logic/templates';
import { capturePlace } from '../services/place';
import { useDiary } from '../store/useDiary';
import { holdPage } from '../logic/pageGesture';
import { useTheme } from '../theme/BookTheme';

const ACTIVITIES = ['walk', 'friends', 'work', 'rest', 'outside', 'cook'];

export function TagMenu({
  tags,
  activities,
  onChange,
}: {
  tags?: string[];
  activities?: string[];
  onChange: (patch: { tags?: string[]; activities?: string[] }) => void;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [tag, setTag] = useState('');
  const chosen = activities ?? [];
  return (
    <View style={{ flex: 1 }}>
      <Pressable
        accessibilityLabel="Tags"
        onPressIn={() => holdPage(true)}
        onPressOut={() => holdPage(false)}
        onPress={() => setOpen((shown) => !shown)}
        style={{ minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.paperEdge, backgroundColor: theme.colors.card, paddingHorizontal: 10, justifyContent: 'center' }}
      >
        <Text numberOfLines={1} style={{ color: theme.colors.paperInk, fontFamily: theme.body }}>{tagSummary(tags, activities)}</Text>
      </Pressable>
      {open ? (
        <View style={{ marginTop: 6, borderRadius: 12, backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.paperEdge, padding: 8, gap: 8 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {ACTIVITIES.map((activity) => {
              const selected = chosen.includes(activity);
              return (
                <Pressable
                  key={activity}
                  accessibilityLabel={activity}
                  onPressIn={() => holdPage(true)}
                  onPressOut={() => holdPage(false)}
                  onPress={() => onChange({ activities: selected ? chosen.filter((item) => item !== activity) : [...chosen, activity] })}
                  style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: selected ? theme.colors.accent : theme.colors.chip }}
                >
                  <Text style={{ color: selected ? theme.colors.onAccent : theme.colors.chipInk, fontFamily: theme.body }}>{activity}</Text>
                </Pressable>
              );
            })}
          </View>
          {(tags ?? []).map((item) => (
            <Text key={item} style={{ color: theme.colors.ink, fontFamily: theme.body }}>{item}</Text>
          ))}
          <TextInput
            value={tag}
            onChangeText={setTag}
            placeholder="Add a tag"
            placeholderTextColor={theme.colors.inkSoft}
            onFocus={() => holdPage(true)}
            onBlur={() => holdPage(false)}
            onSubmitEditing={() => {
              const next = tag.trim();
              if (!next || (tags ?? []).includes(next)) return;
              onChange({ tags: [...(tags ?? []), next] });
              setTag('');
            }}
            style={{ backgroundColor: theme.colors.bg, color: theme.colors.ink, borderRadius: 10, padding: 8, fontFamily: theme.body }}
          />
        </View>
      ) : null}
    </View>
  );
}

export function EntryExtras({
  draft,
  onChange,
  isNew,
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
}) {
  const theme = useTheme();
  const locationOn = useDiary((state) => state.settings.locationOnEntry);
  const weatherOn = useDiary((state) => state.settings.weatherOnEntry);
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
      {draft.placeLabel || draft.weather ? <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body }}>{[draft.placeLabel, draft.weather].filter(Boolean).join(' · ')}</Text> : null}
    </View>
  );
}
