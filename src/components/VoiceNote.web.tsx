import { useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from './ui';

export function VoiceNote({ value, onChange }: { value: string | null | undefined; onChange: (next: string | null) => void }) {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState('');
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const media = new MediaRecorder(stream);
      chunks.current = [];
      media.ondataavailable = (event) => {
        if (event.data.size) chunks.current.push(event.data);
      };
      media.onstop = () => {
        const blob = new Blob(chunks.current, { type: media.mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.onload = () => onChange(typeof reader.result === 'string' ? reader.result : null);
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.current = media;
      media.start();
      setRecording(true);
      setError('');
    } catch {
      setError('The microphone was not available.');
    }
  }

  function stop() {
    recorder.current?.stop();
    setRecording(false);
  }

  return (
    <View style={{ gap: 8 }}>
      <Button label={recording ? 'Stop voice note' : 'Record a voice note'} onPress={recording ? stop : start} />
      {value ? <Button label="Remove voice note" tone="ghost" onPress={() => onChange(null)} /> : null}
      {error ? <Text>{error}</Text> : null}
    </View>
  );
}
