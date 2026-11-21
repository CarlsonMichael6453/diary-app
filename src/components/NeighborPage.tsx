import { memo, useState } from 'react';
import { Image, Text, View } from 'react-native';

import type { DiaryBook, DiaryEntry } from '../models/types';
import { getMood } from '../data/moods';
import { StickerView } from '../stickers/StickerView';
import { ThemeOverride, useTheme } from '../theme/BookTheme';
import { resolveEntryLook } from '../theme/designs';
import { applyType, fontById } from '../theme/fonts';
import { Paper } from './Paper';

/** A non-interactive copy of a real page, prerendered under the curl. */
export const NeighborPage = memo(function NeighborPage({ entry, book, premium }: { entry: DiaryEntry; book?: DiaryBook; premium: boolean }) {
  const look = applyType(resolveEntryLook(book ?? { themeId: 'cutesy' }, entry, premium), entry.fontId ?? book?.fontId, entry.inkColor ?? book?.inkColor);
  const mood = getMood(entry.mood);
  const [box, setBox] = useState({ w: 0, h: 0 });
  return (
    <ThemeOverride theme={look}>
      <Paper style={{ minHeight: 640 }}>
        <View style={{ minHeight: 640 }} onLayout={(event) => setBox({ w: event.nativeEvent.layout.width, h: event.nativeEvent.layout.height })}>
          <View style={{ padding: 22, paddingTop: 28 }}>
            <Text style={{ color: look.colors.paperSoft, fontFamily: look.body }}>{entry.date}</Text>
            <Text style={{ color: look.colors.paperInk, fontFamily: look.body, marginTop: 8 }}>{mood.emoji} {mood.label}</Text>
            {entry.photoOnly ? null : (
              <>
                <Text style={{ color: look.colors.paperInk, fontFamily: look.script, fontSize: 32, marginTop: 12 }}>{entry.title}</Text>
                <Text style={{ color: look.colors.paperInk, fontFamily: look.body, fontSize: 16, lineHeight: 24, marginTop: 8 }}>{entry.body}</Text>
              </>
            )}
          </View>
          {(entry.photoPlacements ?? []).map((photo) => (
            <Image key={photo.id} source={{ uri: photo.uri }} style={{ position: 'absolute', left: photo.x * box.w - 48, top: photo.y * box.h - 40, width: 96 * photo.scale, height: 78 * photo.scale, borderRadius: photo.frame === 'round' ? 16 : 4, transform: [{ rotate: `${photo.rotation}deg` }] }} />
          ))}
          {(entry.notes ?? []).map((note) => {
            const font = fontById(note.fontId);
            return (
              <Text key={note.id} style={{ position: 'absolute', left: note.x * box.w - 40, top: note.y * box.h - 16, color: note.inkColor || look.colors.paperInk, fontFamily: font?.script ?? look.script, fontSize: 16, transform: [{ rotate: `${note.rotation}deg` }] }}>
                {note.text}
              </Text>
            );
          })}
          {entry.stickers.map((sticker) => (
            <View key={sticker.id} pointerEvents="none" style={{ position: 'absolute', left: sticker.x * box.w - 32, top: sticker.y * box.h - 32, transform: [{ rotate: `${sticker.rotation}deg` }] }}>
              <StickerView stickerId={sticker.stickerId} size={64 * sticker.scale} />
            </View>
          ))}
        </View>
      </Paper>
    </ThemeOverride>
  );
});

export function BlankSheet({ date }: { date: string }) {
  const theme = useTheme();
  return (
    <Paper style={{ minHeight: 640 }}>
      <View style={{ minHeight: 640, padding: 28 }}>
        <Text style={{ color: theme.colors.paperSoft, fontFamily: theme.body }}>{date}</Text>
        <Text style={{ color: theme.colors.paperInk, fontFamily: theme.script, fontSize: 28, marginTop: 16 }}>A blank page</Text>
      </View>
    </Paper>
  );
}

export function EndPaper({ edge }: { edge: 'start' | 'end' }) {
  const theme = useTheme();
  return (
    <Paper style={{ minHeight: 640 }}>
      <View style={{ minHeight: 640, alignItems: 'center', justifyContent: 'center', padding: 28 }}>
        <Text style={{ color: theme.colors.paperSoft, fontFamily: theme.body, fontSize: 18, textAlign: 'center' }}>
          {edge === 'end' ? 'The rest of this book is still blank.' : 'This is the first page.'}
        </Text>
      </View>
    </Paper>
  );
}
