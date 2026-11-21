import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

import { VoiceChip } from './VoiceChip';

export function VoicePlayer({ source }: { source: string }) {
  const player = useAudioPlayer(source, { updateInterval: 200 });
  const status = useAudioPlayerStatus(player);

  function toggle() {
    if (status.playing) {
      player.pause();
      return;
    }
    if (status.duration > 0 && status.currentTime >= status.duration - 0.05) {
      void player.seekTo(0);
    }
    player.play();
  }

  return <VoiceChip playing={status.playing} position={status.currentTime} duration={status.duration} onToggle={toggle} />;
}