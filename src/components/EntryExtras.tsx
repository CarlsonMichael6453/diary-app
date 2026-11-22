import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { cleanTag, mergeTagCatalog, renameInList, renameTag, selectCreatedTag, tagSummary, toggleTag } from '../logic/tags';
import { TEMPLATES } from '../logic/templates';
import { capturePlace } from '../services/place';
import { useDiary } from '../store/useDiary';
import { holdPage } from '../logic/pageGesture';
import { useTheme } from '../theme/BookTheme';
import { ChoiceMenu } from './ChoiceMenu';

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
  const entries = useDiary((state) => state.entries);
  const savedTags = useDiary((state) => state.settings.savedTags ?? []);
  const patchSettings = useDiary((state) => state.patchSettings);
  const [open, setOpen] = useState(false);
  const [tag, setTag] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const held = useRef(false);
  const chosen = activities ?? [];
  const selected = tags ?? [];
  const catalog = useMemo(() => mergeTagCatalog(savedTags, [...entries, { tags: selected }]), [savedTags, entries, selected]);

  function createTag() {
    const next = selectCreatedTag(selected, catalog, tag);
    if (!cleanTag(tag)) return;
    onChange({ tags: next.tags });
    patchSettings({ savedTags: next.catalog });
    setTag('');
    setEditing(null);
    const name = next.tags[next.tags.length - 1];
    if (typeof document === 'undefined' || !name) return;
    requestAnimationFrame(() => {
      const item = document.querySelector(`[data-tag-name="${CSS.escape(name)}"]`);
      const list = item?.closest('[data-choice-list="1"]') as HTMLElement | null;
      if (!item || !list) return;
      const itemRect = item.getBoundingClientRect();
      const listRect = list.getBoundingClientRect();
      list.scrollTop += itemRect.top - listRect.top - 8;
    });
  }

  function beginRename(name: string) {
    held.current = true;
    setEditing(name);
    setEditValue(name);
  }

  function commitRename() {
    if (!editing) return;
    const next = renameTag(selected, catalog, editing, editValue);
    onChange({ tags: next.tags });
    useDiary.setState((state) => ({
      entries: state.entries.map((entry) => ({ ...entry, tags: renameInList(entry.tags, editing, editValue) })),
      settings: { ...state.settings, savedTags: next.catalog },
    }));
    setEditing(null);
  }

  return (
    <ChoiceMenu label="Tags" open={open} onToggle={() => setOpen((shown) => !shown)} summary={<Text numberOfLines={1} style={{ color: theme.colors.paperInk, fontFamily: theme.body }}>{tagSummary(tags, activities)}</Text>}>
      <View style={{ padding: 8, gap: 8 }}>
        {ACTIVITIES.map((activity) => {
          const on = chosen.includes(activity);
          return (
            <Pressable
              key={activity}
              accessibilityLabel={activity}
              accessibilityState={{ checked: on }}
              onPress={() => onChange({ activities: on ? chosen.filter((item) => item !== activity) : [...chosen, activity] })}
              style={{ paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, backgroundColor: on ? theme.colors.accent : theme.colors.chip, alignSelf: 'flex-start' }}
            >
              <Text style={{ color: on ? theme.colors.onAccent : theme.colors.chipInk, fontFamily: theme.body }}>{on ? '✓ ' : ''}{activity}</Text>
            </Pressable>
          );
        })}
        {catalog.map((item) => {
          const on = selected.some((value) => value.toLowerCase() === item.toLowerCase());
          if (editing?.toLowerCase() === item.toLowerCase()) {
            return (
              <View key={item} style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                <TextInput
                  value={editValue}
                  onChangeText={setEditValue}
                  autoFocus
                  accessibilityLabel={`Rename ${item}`}
                  onSubmitEditing={commitRename}
                  style={{ flex: 1, backgroundColor: theme.colors.bg, color: theme.colors.ink, borderRadius: 10, padding: 8, fontFamily: theme.body }}
                />
                <Pressable accessibilityLabel="Save tag name" onPress={commitRename} style={{ paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, backgroundColor: theme.colors.accent }}>
                  <Text style={{ color: theme.colors.onAccent, fontFamily: theme.body }}>Save</Text>
                </Pressable>
              </View>
            );
          }
          return (
            <View key={item} style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderRadius: 999, backgroundColor: on ? theme.colors.accent : theme.colors.chip, borderWidth: on ? 2 : 0, borderColor: theme.colors.paperInk }} {...({ dataSet: { tagName: item } } as object)}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityLabel={`Tag ${item}`}
                accessibilityState={{ checked: on }}
                delayLongPress={450}
                onLongPress={() => beginRename(item)}
                onPress={() => {
                  if (held.current) {
                    held.current = false;
                    return;
                  }
                  onChange({ tags: toggleTag(selected, item) });
                }}
                style={{ paddingLeft: 10, paddingRight: 6, paddingVertical: 8 }}
              >
                <Text style={{ color: on ? theme.colors.onAccent : theme.colors.chipInk, fontFamily: theme.body }}>{on ? '✓ ' : ''}{item}</Text>
              </Pressable>
              <Pressable accessibilityLabel={`Rename ${item}`} onPress={() => beginRename(item)} style={{ paddingRight: 10, paddingVertical: 8 }}>
                <Text style={{ color: on ? theme.colors.onAccent : theme.colors.chipInk, fontFamily: theme.body }}>✎</Text>
              </Pressable>
            </View>
          );
        })}
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          <TextInput
            value={tag}
            onChangeText={setTag}
            placeholder="Add a tag"
            placeholderTextColor={theme.colors.inkSoft}
            onSubmitEditing={createTag}
            returnKeyType="done"
            style={{ flex: 1, backgroundColor: theme.colors.bg, color: theme.colors.ink, borderRadius: 10, padding: 8, fontFamily: theme.body }}
          />
          <Pressable accessibilityLabel="Add tag" onPress={createTag} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: theme.colors.accent }}>
            <Text style={{ color: theme.colors.onAccent, fontFamily: theme.body }}>Add</Text>
          </Pressable>
        </View>
      </View>
    </ChoiceMenu>
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
