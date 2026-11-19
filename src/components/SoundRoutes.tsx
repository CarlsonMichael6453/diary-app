import { usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';

import { playPageTurn } from '../services/sounds';

/** Page-turn sound when the reader moves between tabs and screens. */
export function SoundRoutes() {
  const path = usePathname();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    playPageTurn();
  }, [path]);

  return null;
}
