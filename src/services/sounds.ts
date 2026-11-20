import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';

import type { MoodId } from '../data/moods';
import { OPEN_FAMILIES, type OpenFamily } from '../logic/bookOpen';
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
const pagePools = new Map<string, AudioPlayer[]>();
let lastPageId: string | null = null;
let modeReady: Promise<void> | null = null;
let pageSoundsPrimed = false;
let suppressRouteUntil = 0;

function ensurePagePool(): void {
  for (const id of PAGE_SOUND_IDS) {
    if (pagePools.has(id)) continue;
    pagePools.set(id, [createAudioPlayer(pageSources[id])]);
  }
}

function takePagePlayer(id: (typeof PAGE_SOUND_IDS)[number]): AudioPlayer {
  ensurePagePool();
  const list = pagePools.get(id) ?? [];
  const free = list.find((player) => !player.playing);
  if (free) return free;
  const extra = createAudioPlayer(pageSources[id]);
  list.push(extra);
  pagePools.set(id, list);
  return extra;
}

/** Create the 15 page-turn players. On web, start them inside a user gesture so later flips are allowed to overlap. */
export function primePageSounds(): void {
  ensurePagePool();
  ensureOpenPool();
  if (pageSoundsPrimed) return;
  pageSoundsPrimed = true;
  if (Platform.OS !== 'web') return;
  for (const list of pagePools.values()) {
    const player = list[0];
    if (!player) continue;
    player.volume = 0;
    try {
      player.play();
      player.pause();
    } catch {
      // The element is still created; a later gesture can unlock it.
    }
  }
}

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  const unlock = () => {
    primePageSounds();
    window.removeEventListener('pointerdown', unlock, true);
  };
  window.addEventListener('pointerdown', unlock, true);
}

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

const moodSources: Record<MoodId, number> = {
  happy: require('../../assets/sounds/moods/happy.wav'),
  calm: require('../../assets/sounds/moods/calm.wav'),
  sad: require('../../assets/sounds/moods/sad.wav'),
  anxious: require('../../assets/sounds/moods/anxious.wav'),
  excited: require('../../assets/sounds/moods/excited.wav'),
  grateful: require('../../assets/sounds/moods/grateful.wav'),
  angry: require('../../assets/sounds/moods/angry.wav'),
  tired: require('../../assets/sounds/moods/tired.wav'),
  loved: require('../../assets/sounds/moods/loved.wav'),
  hopeful: require('../../assets/sounds/moods/hopeful.wav'),
};

export function playMoodSound(moodId: MoodId): void {
  const prefs = useDiary.getState().settings;
  if (!prefs.soundEnabled || !(prefs.soundVolume > 0)) return;
  const source = moodSources[moodId];
  if (!source) return;
  void play(`mood-${moodId}`, source, Math.min(0.85, prefs.soundVolume));
}

export function playPageTurn(): boolean {
  const prefs = useDiary.getState().settings;
  if (!canPlaySound('page', prefs)) return false;
  ensurePagePool();
  const id = pickPageSound(PAGE_SOUND_IDS, lastPageId);
  if (!id) return false;
  lastPageId = id;
  const sourceId = id as (typeof PAGE_SOUND_IDS)[number];
  const player = takePagePlayer(sourceId);
  player.volume = Math.min(1, Math.max(0, prefs.soundVolume));
  try {
    void player.seekTo(0);
  } catch {
    // A player that has not loaded yet can still start from the beginning.
  }
  player.play();
  if (typeof __DEV__ !== 'undefined' && __DEV__) console.log('[page-turn] play', id);
  return true;
}

/** A curl, arrow, Back, or open committed. The matching route-change sound is skipped so this one is the only play. */
export function playCurlCommit(): boolean {
  suppressRouteUntil = Date.now() + 700;
  return playPageTurn();
}

/** Tab and screen changes. Skipped when a page curl just committed the same navigation. */
export function playRouteTurn(): boolean {
  if (Date.now() < suppressRouteUntil) return false;
  return playPageTurn();
}

const plusSource = require('../../assets/sounds/plus/celebrate.wav');

const openSources: Record<OpenFamily, number> = {
  cozy: require('../../assets/sounds/open/cozy.wav'),
  floral: require('../../assets/sounds/open/floral.wav'),
  ocean: require('../../assets/sounds/open/ocean.wav'),
  forest: require('../../assets/sounds/open/forest.wav'),
  night: require('../../assets/sounds/open/night.wav'),
  retro: require('../../assets/sounds/open/retro.wav'),
  elegant: require('../../assets/sounds/open/elegant.wav'),
  christmas: require('../../assets/sounds/open/christmas.wav'),
  halloween: require('../../assets/sounds/open/halloween.wav'),
  valentine: require('../../assets/sounds/open/valentine.wav'),
  festival: require('../../assets/sounds/open/festival.wav'),
  sunset: require('../../assets/sounds/open/sunset.wav'),
};

const openPlayers = new Map<OpenFamily, AudioPlayer>();

function ensureOpenPool(): void {
  for (const id of OPEN_FAMILIES) {
    if (openPlayers.has(id)) continue;
    openPlayers.set(id, createAudioPlayer(openSources[id]));
  }
}

ensurePagePool();
ensureOpenPool();

/** Opening the closed book. Not a page turn. Follows the master switch, volume, and the book-opening toggle. */
export function playBookOpen(family: OpenFamily): boolean {
  const prefs = useDiary.getState().settings;
  if (!prefs.soundEnabled || !(prefs.soundVolume > 0) || prefs.bookOpenMusic === false) return false;
  ensureOpenPool();
  const player = openPlayers.get(family) ?? openPlayers.get('cozy');
  if (!player) return false;
  player.volume = Math.min(0.8, Math.max(0, prefs.soundVolume));
  try {
    void player.seekTo(0);
  } catch {
    // Start from wherever the clip is if it has not seeked yet.
  }
  player.play();
  if (typeof __DEV__ !== 'undefined' && __DEV__) console.log('[book-open] play', family);
  return true;
}

export function playPlusSound(): void {
  const prefs = useDiary.getState().settings;
  if (!prefs.soundEnabled || !(prefs.soundVolume > 0)) return;
  void play('plus-celebrate', plusSource, Math.min(0.8, prefs.soundVolume));
}
