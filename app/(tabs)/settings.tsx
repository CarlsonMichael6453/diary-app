import { router, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, Share, Text, TextInput, View } from 'react-native';

import { getBuddy } from '@/src/buddies/catalog';
import { PasscodePad } from '@/src/components/LockScreen';
import { Screen } from '@/src/components/Screen';
import { Button, Confirm, FieldLabel } from '@/src/components/ui';
import { syncReminder } from '@/src/services/notifications';
import { biometricAvailable } from '@/src/services/biometrics';
import { checkPasscode, clearPasscode, hasPasscode, savePasscode } from '@/src/services/secure';
import { useDiary } from '@/src/store/useDiary';
import { useTheme } from '@/src/theme/BookTheme';
import { THEMES, type ThemeId } from '@/src/theme/themes';

const HOURS = [8, 12, 18, 20, 21, 22];

export default function SettingsScreen() {
  const theme = useTheme();
  const settings = useDiary((state) => state.settings);
  const wallet = useDiary((state) => state.wallet);
  const patchSettings = useDiary((state) => state.patchSettings);
  const removeSamples = useDiary((state) => state.removeSamples);
  const resetBook = useDiary((state) => state.resetBook);
  const importSnapshot = useDiary((state) => state.importSnapshot);
  const snapshot = useDiary((state) => state.snapshot);
  const [notice, setNotice] = useState('');
  const [bio, setBio] = useState(false);
  const [pinMode, setPinMode] = useState<'off' | 'create' | 'confirm' | 'unlock-off' | 'change'>('off');
  const [firstPin, setFirstPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [backupText, setBackupText] = useState('');
  const [confirm, setConfirm] = useState<'samples' | 'erase' | null>(null);

  useEffect(() => {
    biometricAvailable().then(setBio);
  }, []);

  async function toggleReminder(enabled: boolean) {
    patchSettings({ reminderEnabled: enabled });
    const message = await syncReminder(enabled, settings.reminderHour, settings.reminderMinute);
    setNotice(message);
  }

  async function pickHour(hour: number) {
    patchSettings({ reminderHour: hour, reminderMinute: 0, reminderEnabled: true });
    const message = await syncReminder(true, hour, 0);
    setNotice(message);
  }

  return (
    <Screen>
      <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 36 }}>Settings</Text>
      <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body, marginBottom: 12 }}>The book’s style, your pal, and the lock.</Text>

      <FieldLabel>Book title</FieldLabel>
      <TextInput value={settings.bookTitle} onChangeText={(bookTitle) => patchSettings({ bookTitle })} style={input(theme)} />
      <FieldLabel>Your name</FieldLabel>
      <TextInput value={settings.ownerName} onChangeText={(ownerName) => patchSettings({ ownerName })} style={input(theme)} />

      <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 26, marginTop: 18 }}>Book style</Text>
      <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body, marginBottom: 8 }}>This changes the whole book. A single page can still wear something else.</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {THEMES.map((item) => {
          const selected = settings.themeId === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => patchSettings({ themeId: item.id as ThemeId })}
              style={{
                width: '47%',
                backgroundColor: item.colors.paper,
                borderRadius: 16,
                padding: 12,
                borderWidth: selected ? 3 : 1,
                borderColor: selected ? item.colors.accent : item.colors.paperEdge,
              }}
            >
              <Text style={{ fontSize: 20 }}>{item.emoji}</Text>
              <Text style={{ color: item.colors.paperInk, fontFamily: item.display, fontSize: 18 }}>{item.name}</Text>
              <Text style={{ color: item.colors.paperSoft, fontFamily: item.body, fontSize: 12 }}>{item.tagline}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 26, marginTop: 18 }}>Your pal</Text>
      <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body, marginBottom: 8 }}>
        {settings.buddyId === 'none' ? 'No pal on the page.' : `${getBuddy(settings.buddyId)?.name ?? 'Pal'} is sitting in the margin.`}
      </Text>
      <Button label="Choose a pal and wardrobe" onPress={() => router.push('/buddies' as Href)} />

      <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 26, marginTop: 18 }}>Daily reminder</Text>
      <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body }}>
        {Platform.OS === 'web' ? 'On the web this is an in-app nudge. On a phone it is a local notification.' : 'A local notification on this phone. Nothing leaves the device.'}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        <Button label={settings.reminderEnabled ? 'Nudge is on' : 'Turn nudge on'} tone={settings.reminderEnabled ? 'primary' : 'ghost'} onPress={() => toggleReminder(!settings.reminderEnabled)} />
        {HOURS.map((hour) => (
          <Pressable key={hour} onPress={() => pickHour(hour)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: settings.reminderHour === hour ? theme.colors.accent : theme.colors.chip }}>
            <Text style={{ color: settings.reminderHour === hour ? theme.colors.onAccent : theme.colors.chipInk, fontFamily: theme.body }}>{hour % 12 || 12}{hour < 12 ? 'am' : 'pm'}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 26, marginTop: 18 }}>Lock</Text>
      <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body, marginBottom: 8 }}>A four-digit passcode. Face ID and fingerprint work in the phone app.</Text>
      <View style={{ gap: 8 }}>
        <Button
          label={settings.lockEnabled ? 'Change passcode' : 'Set a passcode'}
          onPress={() => {
            setPinError('');
            setPinMode(settings.lockEnabled ? 'change' : 'create');
          }}
        />
        {settings.lockEnabled ? <Button label="Remove passcode" tone="ghost" onPress={() => setPinMode('unlock-off')} /> : null}
        {bio ? (
          <Button
            label={settings.biometricsEnabled ? 'Face ID / fingerprint is on' : 'Allow Face ID / fingerprint'}
            tone="ghost"
            onPress={() => patchSettings({ biometricsEnabled: !settings.biometricsEnabled })}
          />
        ) : (
          <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body }}>Face ID and fingerprint appear on a phone with biometrics enrolled.</Text>
        )}
      </View>

      <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 26, marginTop: 18 }}>Diary Plus</Text>
      <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body }}>{wallet.premium ? 'Unlocked on this device (test purchase).' : 'Premium packs, Ember, and Lumi are locked. Purchases here are mock only.'}</Text>
      <View style={{ marginTop: 8 }}>
        <Button label={wallet.premium ? 'See Diary Plus' : 'Open the paywall'} onPress={() => router.push('/paywall' as Href)} />
      </View>

      <Text style={{ color: theme.colors.ink, fontFamily: theme.display, fontSize: 26, marginTop: 18 }}>On this device</Text>
      <Text style={{ color: theme.colors.inkSoft, fontFamily: theme.body, marginBottom: 8 }}>Pages stay in local storage. A backup file is the seam for a future sync.</Text>
      <View style={{ gap: 8 }}>
        <Button
          label="Save a backup"
          tone="ghost"
          onPress={async () => {
            const json = JSON.stringify(snapshot(), null, 2);
            if (Platform.OS === 'web') {
              const blob = new Blob([json], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const anchor = document.createElement('a');
              anchor.href = url;
              anchor.download = 'diary-app-backup.json';
              anchor.click();
              URL.revokeObjectURL(url);
              setNotice('Backup downloaded.');
              return;
            }
            await Share.share({ message: json });
          }}
        />
        {Platform.OS === 'web' ? (
          <Button
            label="Choose a backup file"
            tone="ghost"
            onPress={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'application/json';
              input.onchange = () => {
                const file = input.files?.[0];
                if (!file) return;
                file.text().then((text) => {
                  try {
                    setNotice(importSnapshot(JSON.parse(text)).message ?? '');
                  } catch {
                    setNotice('That file was not valid JSON.');
                  }
                });
              };
              input.click();
            }}
          />
        ) : null}
        <FieldLabel>Or paste backup JSON</FieldLabel>
        <TextInput value={backupText} onChangeText={setBackupText} multiline placeholder="Paste a backup here" placeholderTextColor={theme.colors.inkSoft} style={[input(theme), { minHeight: 80 }]} />
        <Button
          label="Restore pasted backup"
          tone="ghost"
          onPress={() => {
            try {
              setNotice(importSnapshot(JSON.parse(backupText)).message ?? '');
            } catch {
              setNotice('That text was not valid JSON.');
            }
          }}
        />
        <Button label="Remove sample pages" tone="ghost" onPress={() => setConfirm('samples')} />
        <Button label="Erase this book" tone="danger" onPress={() => setConfirm('erase')} />
      </View>
      {notice ? <Text style={{ color: theme.colors.ink, fontFamily: theme.body, marginTop: 12 }}>{notice}</Text> : null}

      {pinMode !== 'off' ? (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.colors.bg, padding: 20, justifyContent: 'center' }}>
          <PasscodePad
            title={pinMode === 'confirm' ? 'Repeat it' : pinMode === 'unlock-off' || pinMode === 'change' ? 'Current passcode' : 'Choose a passcode'}
            subtitle="Four digits. They stay on this device."
            errorMessage={pinError}
            onComplete={async (pin) => {
              if (pinMode === 'create') {
                setFirstPin(pin);
                setPinError('');
                setPinMode('confirm');
                return;
              }
              if (pinMode === 'confirm') {
                if (pin !== firstPin) {
                  setPinError('Those did not match. Start again.');
                  setPinMode('create');
                  return;
                }
                await savePasscode(pin);
                patchSettings({ lockEnabled: true });
                setPinMode('off');
                setNotice('Passcode saved. The book locks the next time it opens.');
                return;
              }
              const ok = await checkPasscode(pin);
              if (!ok && !(await hasPasscode())) {
                setPinError('No passcode is stored yet.');
                return;
              }
              if (!ok) {
                setPinError('That is not the current passcode.');
                return;
              }
              if (pinMode === 'unlock-off') {
                await clearPasscode();
                patchSettings({ lockEnabled: false, biometricsEnabled: false });
                setPinMode('off');
                setNotice('The lock is off.');
                return;
              }
              setPinError('');
              setPinMode('create');
            }}
          />
          <Button label="Cancel" tone="ghost" onPress={() => setPinMode('off')} />
        </View>
      ) : null}

      {confirm ? (
        <Confirm
          title={confirm === 'erase' ? 'Erase the book?' : 'Remove sample pages?'}
          body={confirm === 'erase' ? 'Entries, coins, and unlocked stickers on this device go back to the starter book.' : 'The four example pages will be deleted. Your own pages stay.'}
          confirmLabel={confirm === 'erase' ? 'Erase' : 'Remove'}
          danger={confirm === 'erase'}
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            if (confirm === 'erase') resetBook();
            else removeSamples();
            setConfirm(null);
          }}
        />
      ) : null}
    </Screen>
  );
}

function input(theme: ReturnType<typeof useTheme>) {
  return {
    backgroundColor: theme.colors.card,
    color: theme.colors.ink,
    fontFamily: theme.body,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  };
}
