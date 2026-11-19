import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { entriesToCsv, openSealedBackup, parseImport, sealBackup } from '../logic/backup';
import { backupIsDue } from '../logic/memories';
import { todayKey } from '../logic/dates';
import { setVaultEncryption } from '../services/vault';
import { exportPdf, pickTextFile, saveTextFile } from '../services/files';
import { useDiary } from '../store/useDiary';
import { useTheme } from '../theme/BookTheme';
import { Button, FieldLabel } from './ui';

export function LibraryPanel() {
  const theme = useTheme();
  const settings = useDiary((state) => state.settings);
  const entries = useDiary((state) => state.entries);
  const snapshot = useDiary((state) => state.snapshot);
  const importSnapshot = useDiary((state) => state.importSnapshot);
  const markBackup = useDiary((state) => state.markBackup);
  const patchSettings = useDiary((state) => state.patchSettings);
  const addBook = useDiary((state) => state.addBook);
  const setActiveBook = useDiary((state) => state.setActiveBook);
  const [passphrase, setPassphrase] = useState('');
  const [bookName, setBookName] = useState('');
  const [notice, setNotice] = useState('');
  const due = backupIsDue(settings.lastBackupAt, todayKey(), settings.backupReminderDays);
  const mine = entries.filter((entry) => (entry.bookId ?? 'daily') === settings.activeBookId);

  async function downloadJson(encrypted: boolean) {
    const json = JSON.stringify(snapshot(), null, 2);
    const body = encrypted && passphrase ? sealBackup(json, passphrase) : json;
    if (encrypted && !passphrase) {
      setNotice('Add a passphrase to encrypt the file, or save it plain.');
      return;
    }
    const message = await saveTextFile(encrypted ? 'diary-backup.enc.json' : 'diary-backup.json', body, 'application/json');
    markBackup(new Date().toISOString());
    setNotice(message);
  }

  return (
    <View style={{ gap: 8, marginTop: 8 }}>
      <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 26 }}>Backup</Text>
      <Text style={{ color: theme.colors.ink, fontFamily: theme.body }}>
        Last backup: {settings.lastBackupAt ? settings.lastBackupAt.slice(0, 16).replace('T', ' ') : 'never'}
      </Text>
      {due ? <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body }}>It has been a while. A backup file is the copy you can restore.</Text> : null}
      <FieldLabel>Optional passphrase for the file</FieldLabel>
      <TextInput value={passphrase} onChangeText={setPassphrase} secureTextEntry placeholder="Leave blank for a plain backup" placeholderTextColor={theme.colors.inkSoft} style={{ backgroundColor: theme.colors.card, color: theme.colors.ink, borderRadius: 14, padding: 10, fontFamily: theme.body }} />
      <Button label="Save JSON backup" onPress={() => downloadJson(Boolean(passphrase))} />
      <Button label="Save CSV" tone="ghost" onPress={() => saveTextFile('diary.csv', entriesToCsv(mine), 'text/csv').then((message) => { markBackup(new Date().toISOString()); setNotice(message); })} />
      <Button label="Save a readable PDF" tone="ghost" onPress={() => exportPdf(settings.bookTitle, mine).then(setNotice)} />
      <Button
        label="Import a backup or other diary"
        tone="ghost"
        onPress={() => {
          pickTextFile().then((text) => {
            if (!text) return;
            try {
              const parsed = JSON.parse(text) as { encrypted?: boolean };
              const json = parsed.encrypted ? openSealedBackup(text, passphrase) : text;
              if (json.trim().startsWith('{') && json.includes('"entries"') && (json.includes('"version"') || json.includes('"settings"'))) {
                setNotice(importSnapshot(JSON.parse(json)).message ?? '');
                return;
              }
            } catch {
              // Fall through to Day One, Daylio, or plain text.
            }
            const imported = parseImport(text);
            if (imported.entries.length === 0) {
              setNotice('Nothing in that file could be read.');
              return;
            }
            const current = snapshot();
            const entries = [
              ...current.entries,
              ...imported.entries.map((entry, index) => ({
                id: `import-${Date.now()}-${index}`,
                date: entry.date,
                title: entry.title,
                body: entry.body,
                mood: (entry.mood as 'calm') || 'calm',
                photos: [],
                stickers: [],
                themeOverride: null,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                bookId: settings.activeBookId,
                tags: entry.tags ?? [],
              })),
            ];
            setNotice(importSnapshot({ ...current, version: 2, entries }).message ?? `Imported ${imported.entries.length} from ${imported.source}.`);
          });
        }}
      />
      <Button label={settings.encryptAtRest ? 'Encryption at rest is on' : 'Encrypt entries on this device'} tone="ghost" onPress={() => { setVaultEncryption(!settings.encryptAtRest); patchSettings({ encryptAtRest: !settings.encryptAtRest }); }} />
      <Button label="Privacy, in plain language" tone="ghost" onPress={() => router.push('/privacy' as Href)} />
      <Button label="Mood stats" tone="ghost" onPress={() => router.push('/stats' as Href)} />
      <Button label="Widget preview" tone="ghost" onPress={() => router.push('/widget-preview' as Href)} />

      <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 26, marginTop: 10 }}>Books</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {settings.books.map((book) => (
          <Button key={book.id} label={book.id === settings.activeBookId ? book.title : book.title} tone={book.id === settings.activeBookId ? 'primary' : 'ghost'} onPress={() => setActiveBook(book.id)} />
        ))}
      </View>
      <TextInput value={bookName} onChangeText={setBookName} placeholder="Travel, Secrets…" placeholderTextColor={theme.colors.inkSoft} style={{ backgroundColor: theme.colors.card, color: theme.colors.ink, borderRadius: 14, padding: 10, fontFamily: theme.body }} />
      <Button label="Add a book" tone="ghost" onPress={() => { if (bookName.trim()) { addBook(bookName.trim()); setBookName(''); } }} />
      <Button label={settings.locationOnEntry ? 'Place on new pages is on' : 'Add place on new pages'} tone="ghost" onPress={() => patchSettings({ locationOnEntry: !settings.locationOnEntry })} />
      <Button label={settings.weatherOnEntry ? 'Weather on new pages is on' : 'Add weather on new pages'} tone="ghost" onPress={() => patchSettings({ weatherOnEntry: !settings.weatherOnEntry })} />
      <Button label={settings.healthCorrelation ? 'Health notes are on' : 'Correlate steps and sleep'} tone="ghost" onPress={() => patchSettings({ healthCorrelation: !settings.healthCorrelation })} />
      <Button label={settings.palNotifications ? 'Pal reminders are on' : 'Pal reminders are off'} tone="ghost" onPress={() => patchSettings({ palNotifications: !settings.palNotifications })} />
      {notice ? <Text style={{ color: theme.colors.ink, fontFamily: theme.body }}>{notice}</Text> : null}
    </View>
  );
}
