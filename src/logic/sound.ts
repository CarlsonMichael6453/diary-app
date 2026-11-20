export const BUDDY_SOUND_IDS = [
  'mochi',
  'batsy',
  'sprout',
  'glitter',
  'prism',
  'inky',
  'pip',
  'nova',
  'shelly',
  'ghosty',
  'ember',
  'lumi',
] as const;

export const PAGE_SOUND_IDS = [
  'real-1-slow-journal',
  'real-2-journal-rustle',
  'real-4-book-page-turn',
  'real-5-book-page-flip',
  'real-6-heavy-sketchbook',
] as const;

export type SoundKind = 'buddy' | 'page';

export type SoundPrefs = {
  soundEnabled: boolean;
  buddySounds: boolean;
  pageSounds: boolean;
  soundVolume: number;
};

export function canPlaySound(kind: SoundKind, prefs: SoundPrefs): boolean {
  if (!prefs.soundEnabled) return false;
  if (!(prefs.soundVolume > 0)) return false;
  if (kind === 'buddy' && !prefs.buddySounds) return false;
  if (kind === 'page' && !prefs.pageSounds) return false;
  return true;
}

/** Picks a page-turn clip, skipping the one that just played when another exists. */
export function pickPageSound(ids: readonly string[], previous: string | null, random: () => number = Math.random): string {
  if (ids.length === 0) return '';
  const pool = previous ? ids.filter((id) => id !== previous) : [...ids];
  const choices = pool.length > 0 ? pool : [...ids];
  const index = Math.min(choices.length - 1, Math.max(0, Math.floor(random() * choices.length)));
  return choices[index];
}
