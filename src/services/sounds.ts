import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

import { BUDDY_SOUND_IDS, PAGE_SOUND_IDS, canPlaySound, pickPageSound } from '../logic/sound';
import { useDiary } from '../store/useDiary';

const buddySources: Record<(typeof BUDDY_SOUND_IDS)[number], number> = {
  mochi: require('../../assets/sounds/buddies/mochi.wav'),
  batsy: require('../../assets/sounds/buddies/batsy.wav'),
  sprout: require('../../assets/sounds/buddies/sprout.wav'),
  glitter: require('../../assets/sounds/buddies/glitter.wav'),
  prism: require('../../assets/sounds/buddies/prism.wav'),
  inky: require('../../assets/sounds/buddies/inky.wav'),
  pip: require('../../assets/sounds/buddies/pip.wav'),
  nova: require('../../assets/sounds/buddies/nova.wav'),
  shelly: require('../../assets/sounds/buddies/shelly.wav'),
  ghosty: require('../../assets/sounds/buddies/ghosty.wav'),
  ember: require('../../assets/sounds/buddies/ember.wav'),
  lumi: require('../../assets/sounds/buddies/lumi.wav'),
};

const pageSources: Record<(typeof PAGE_SOUND_IDS)[number], number> = {
  'real-1-slow-journal': require('../../assets/sounds/pageturn/real-1-slow-journal.mp3'),
  'real-1-slow-journal-faster': require('../../assets/sounds/pageturn/real-1-slow-journal-faster.mp3'),
  'real-1-slow-journal-slower': require('../../assets/sounds/pageturn/real-1-slow-journal-slower.mp3'),
  'real-2-journal-rustle': require('../../assets/sounds/pageturn/real-2-journal-rustle.mp3'),
  'real-2-journal-rustle-faster': require('../../assets/sounds/pageturn/real-2-journal-rustle-faster.mp3'),
  'real-2-journal-rustle-slower': require('../../assets/sounds/pageturn/real-2-journal-rustle-slower.mp3'),
  'real-4-book-page-turn': require('../../assets/sounds/pageturn/real-4-book-page-turn.mp3'),
  'real-4-book-page-turn-faster': require('../../assets/sounds/pageturn/real-4-book-page-turn-faster.mp3'),
  'real-4-book-page-turn-slower': require('../../assets/sounds/pageturn/real-4-book-page-turn-slower.mp3'),
  'real-5-book-page-flip': require('../../assets/sounds/pageturn/real-5-book-page-flip.mp3'),
  'real-5-book-page-flip-faster': require('../../assets/sounds/pageturn/real-5-book-page-flip-faster.mp3'),
  'real-5-book-page-flip-slower': require('../../assets/sounds/pageturn/real-5-book-page-flip-slower.mp3'),
  'real-6-heavy-sketchbook': require('../../assets/sounds/pageturn/real-6-heavy-sketchbook.mp3'),
  'real-6-heavy-sketchbook-faster': require('../../assets/sounds/pageturn/real-6-heavy-sketchbook-faster.mp3'),
  'real-6-heavy-sketchbook-slower': require('../../assets/sounds/pageturn/real-6-heavy-sketchbook-slower.mp3'),
};

const players = new Map<string, AudioPlayer>();
let lastPageId: string | null = null;
let modeReady: Promise<void> | null = null;

function ensureMode(): Promise<void> {
  modeReady ??= setAudioModeAsync({
    playsInSilentMode: false,
    shouldPlayInBackground: false,
    interruptionMode: 'mixWithOthers',
  })
    .then(() => undefined)
    .catch(() => undefined);
  return modeReady;
}

function playerFor(id: string, source: number): AudioPlayer {
  const existing = players.get(id);
  if (existing) return existing;
  const player = createAudioPlayer(source);
  players.set(id, player);
  return player;
}

async function play(id: string, source: number, volume: number): Promise<void> {
  await ensureMode();
  const player = playerFor(id, source);
  player.volume = Math.min(1, Math.max(0, volume));
  try {
    await player.seekTo(0);
  } catch {
    // A player that has not loaded yet can still start from the beginning.
  }
  player.play();
}

export function playBuddySound(buddyId: string): void {
  if (!(BUDDY_SOUND_IDS as readonly string[]).includes(buddyId)) return;
  const prefs = useDiary.getState().settings;
  if (!canPlaySound('buddy', prefs)) return;
  const source = buddySources[buddyId as (typeof BUDDY_SOUND_IDS)[number]];
  void play(buddyId, source, prefs.soundVolume);
}

export function playPageTurn(): void {
  const prefs = useDiary.getState().settings;
  if (!canPlaySound('page', prefs)) return;
  const id = pickPageSound(PAGE_SOUND_IDS, lastPageId);
  if (!id) return;
  lastPageId = id;
  const source = pageSources[id as (typeof PAGE_SOUND_IDS)[number]];
  void play(id, source, prefs.soundVolume);
}
