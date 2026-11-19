import { useState } from 'react';
import { Text, View } from 'react-native';
import { RecordingPresets, requestRecordingPermissionsAsync, useAudioRecorder } from 'expo-audio';

import { Button } from './ui';

export function VoiceNote({ value, onChange }: { value: string | null | undefined; onChange: (next: string | null) => void }) {
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

  return (
    <View style={{ gap: 8 }}>
      <Button label={recording ? 'Stop voice note' : value ? 'Replace voice note' : 'Record a voice note'} onPress={recording ? () => void stop() : () => void start()} />
      {value ? <Button label="Remove voice note" tone="ghost" onPress={() => onChange(null)} /> : null}
      {error ? <Text>{error}</Text> : null}
    </View>
  );
}
