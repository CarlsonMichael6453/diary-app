export type HealthDay = { date: string; steps?: number; sleepHours?: number; mood: string };

export function healthMoodNotes(days: HealthDay[]): string[] {
  const withSteps = days.filter((day) => typeof day.steps === 'number' && day.mood);
  const withSleep = days.filter((day) => typeof day.sleepHours === 'number' && day.mood);
  const notes: string[] = [];
  const score = (mood: string) => ({ happy: 5, loved: 5, grateful: 4, hopeful: 4, excited: 4, calm: 3, tired: 2, anxious: 2, sad: 1, angry: 1 }[mood] ?? 3);
  if (withSteps.length >= 4) {
    const sorted = [...withSteps].sort((a, b) => (a.steps ?? 0) - (b.steps ?? 0));
    const mid = Math.floor(sorted.length / 2);
    const low = sorted.slice(0, mid);
    const high = sorted.slice(mid);
    const avg = (list: HealthDay[]) => list.reduce((sum, day) => sum + score(day.mood), 0) / list.length;
    if (avg(high) - avg(low) >= 0.4) notes.push('On days you walk more, your mood tends to sit a little higher.');
  }
  if (withSleep.length >= 4) {
    const rested = withSleep.filter((day) => (day.sleepHours ?? 0) >= 7);
    const short = withSleep.filter((day) => (day.sleepHours ?? 0) < 7);
    if (rested.length && short.length) {
      const avg = (list: HealthDay[]) => list.reduce((sum, day) => sum + score(day.mood), 0) / list.length;
      if (avg(rested) - avg(short) >= 0.4) notes.push('After seven hours of sleep, the pages tend to sound kinder.');
    }
  }
  return notes;
}

export const HEALTH_BUILD_NOTE = 'Apple Health and Health Connect need a development build with those entitlements. Expo Go and the website cannot read steps or sleep. Nothing is uploaded.';
