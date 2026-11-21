import { useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { IconButton, MicIcon } from './IconButton';
import { Button } from './ui';

export function VoiceNote({ value, onChange, compact = false }: { value: string | null | undefined; onChange: (next: string | null) => void; compact?: boolean }) {
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

  const label = recording ? 'Stop voice note' : value ? 'Replace voice note' : 'Record a voice note';
  if (compact) {
    return (
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
        <IconButton label={label} onPress={recording ? stop : start}>
          <MicIcon color={recording ? '#8C2F39' : '#3A2A32'} />
        </IconButton>
        {value ? <IconButton label="Remove voice note" onPress={() => onChange(null)}><Text style={{ fontSize: 16 }}>×</Text></IconButton> : null}
        {error ? <Text>{error}</Text> : null}
      </View>
    );
  }
  return (
    <View style={{ gap: 8 }}>
      <Button label={label} onPress={recording ? stop : start} />
      {value ? <Button label="Remove voice note" tone="ghost" onPress={() => onChange(null)} /> : null}
      {error ? <Text>{error}</Text> : null}
    </View>
  );
}
