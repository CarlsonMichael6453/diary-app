export const MOODS = [
  { id: 'happy', emoji: '😊', label: 'Happy', color: '#F6C445' },
  { id: 'calm', emoji: '😌', label: 'Calm', color: '#8ECAE6' },
  { id: 'sad', emoji: '😢', label: 'Sad', color: '#7A8CFF' },
  { id: 'anxious', emoji: '😰', label: 'Anxious', color: '#C9A0DC' },
  { id: 'excited', emoji: '🤩', label: 'Excited', color: '#FF8A5B' },
  { id: 'grateful', emoji: '🥰', label: 'Grateful', color: '#F4A4B8' },
  { id: 'angry', emoji: '😠', label: 'Angry', color: '#E85D4C' },
  { id: 'tired', emoji: '😴', label: 'Tired', color: '#9AA0B4' },
  { id: 'loved', emoji: '💗', label: 'Loved', color: '#FF6B9A' },
  { id: 'hopeful', emoji: '🌱', label: 'Hopeful', color: '#7DCE82' },
  { id: 'fired', emoji: '🔥', label: 'Fired up', color: '#FF5A36' },
] as const;

export type MoodId = (typeof MOODS)[number]['id'];

export function getMood(id: MoodId) {
  return MOODS.find((mood) => mood.id === id) ?? MOODS[1];
}
