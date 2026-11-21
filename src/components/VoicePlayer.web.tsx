import { useEffect, useRef, useState } from 'react';

import { VoiceChip } from './VoiceChip';

export function VoicePlayer({ source }: { source: string }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const element = new Audio(source);
    audio.current = element;
    const onTime = () => setPosition(element.currentTime || 0);
    const onMeta = () => setDuration(Number.isFinite(element.duration) ? element.duration : 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnd = () => {
      setPlaying(false);
      setPosition(0);
    };
    element.addEventListener('timeupdate', onTime);
    element.addEventListener('loadedmetadata', onMeta);
    element.addEventListener('durationchange', onMeta);
    element.addEventListener('play', onPlay);
    element.addEventListener('pause', onPause);
    element.addEventListener('ended', onEnd);
    return () => {
      element.pause();
      element.removeEventListener('timeupdate', onTime);
      element.removeEventListener('loadedmetadata', onMeta);
      element.removeEventListener('durationchange', onMeta);
      element.removeEventListener('play', onPlay);
      element.removeEventListener('pause', onPause);
      element.removeEventListener('ended', onEnd);
      audio.current = null;
    };
  }, [source]);

  function toggle() {
    const element = audio.current;
    if (!element) return;
    if (!element.paused) {
      element.pause();
      return;
    }
    if (element.duration && element.currentTime >= element.duration - 0.05) element.currentTime = 0;
    void element.play();
  }

  return <VoiceChip playing={playing} position={position} duration={duration} onToggle={toggle} />;
}