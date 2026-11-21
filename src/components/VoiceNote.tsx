import { useState } from 'react';
import { Text, View } from 'react-native';
import { RecordingPresets, requestRecordingPermissionsAsync, useAudioRecorder } from 'expo-audio';

import { IconButton, MicIcon } from './IconButton';
import { Button } from './ui';

export function VoiceNote({ value, onChange, compact = false }: { value: string | null | undefined; onChange: (next: string | null) => void; compact?: boolean }) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState('');

  async function start() {
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      setError('Microphone permission was not granted.');
      return;
    }
    await recorder.prepareToRecordAsync();
    recorder.record();
    setRecording(true);
  }

  async function stop() {
    await recorder.stop();
    setRecording(false);
    onChange(recorder.uri);
  }

  const label = recording ? 'Stop voice note' : value ? 'Replace voice note' : 'Record a voice note';
  if (compact) {
    return (
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
        <IconButton label={label} onPress={recording ? () => void stop() : () => void start()}>
          <MicIcon color={recording ? '#8C2F39' : '#3A2A32'} />
        </IconButton>
        {value ? <IconButton label="Remove voice note" onPress={() => onChange(null)}><Text style={{ fontSize: 16 }}>×</Text></IconButton> : null}
        {error ? <Text>{error}</Text> : null}
      </View>
    );
  }
  return (
    <View style={{ gap: 8 }}>
      <Button label={label} onPress={recording ? () => void stop() : () => void start()} />
      {value ? <Button label="Remove voice note" tone="ghost" onPress={() => onChange(null)} /> : null}
      {error ? <Text>{error}</Text> : null}
    </View>
  );
}
