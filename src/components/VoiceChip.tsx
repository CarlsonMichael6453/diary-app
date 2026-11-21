import { Pressable, Text, View } from 'react-native';

import { formatVoiceTime, voiceProgress } from '../logic/voice';
import { useTheme } from '../theme/BookTheme';

export function VoiceChip({
  playing,
  position,
  duration,
  onToggle,
}: {
  playing: boolean;
  position: number;
  duration: number;
  onToggle: () => void;
}) {
  const theme = useTheme();
  const progress = voiceProgress(position, duration);
  return (
    <View
      accessibilityLabel="Voice note"
      style={{
        marginTop: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 14,
        backgroundColor: theme.colors.card,
        borderWidth: 1,
        borderColor: theme.colors.paperEdge,
      }}
    >
      <Pressable
        accessibilityLabel={playing ? 'Pause voice note' : 'Play voice note'}
        onPress={onToggle}
        style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.accent }}
      >
        <Text style={{ color: theme.colors.onAccent, fontSize: 14, marginLeft: playing ? 0 : 2 }}>{playing ? '❚❚' : '▶'}</Text>
      </Pressable>
      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ height: 3, borderRadius: 2, backgroundColor: theme.colors.paperEdge, overflow: 'hidden' }}>
          <View style={{ width: `${progress * 100}%`, height: 3, backgroundColor: theme.colors.accent }} />
        </View>
        <Text style={{ color: theme.colors.paperSoft, fontFamily: theme.body, fontSize: 12 }}>
          {formatVoiceTime(position)} / {formatVoiceTime(duration)}
        </Text>
      </View>
    </View>
  );
}

export function VoiceMark() {
  return <Text accessibilityLabel="Has a voice note">🎤</Text>;
}