import { usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';

import { playRouteTurn } from '../services/sounds';

/** Page-turn sound when the reader moves between tabs and screens. */
export function SoundRoutes() {
  const path = usePathname();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (path.includes('/entry')) return;
    playRouteTurn();
  }, [path]);

  return null;
}
