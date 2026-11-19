export type Saying = { id: string; text: string; pals?: string[] };

export const SAYINGS: Saying[] = [
  { id: 'miss', text: 'I miss you!' },
  { id: 'write-down', text: "Don't you wanna write that down?" },
  { id: 'lonely', text: "Your diary's lonely without you" },
  { id: 'tell-day', text: 'Tell me about your day?' },
  { id: 'saved-page', text: 'I saved you a page' },
  { id: 'one-line', text: 'One line counts. I checked.' },
  { id: 'margin', text: 'The margin is too quiet.' },
  { id: 'tea', text: 'I kept your place with a tiny bookmark.' },
  { id: 'soft', text: 'Come sit. The page is warm.' },
  { id: 'streak', text: 'Your streak is peeking around the corner.' },
  { id: 'blank', text: 'A blank page is just a deep breath.' },
  { id: 'later', text: 'Later-you will want to know this.' },
  { id: 'small', text: 'Small days still deserve ink.' },
  { id: 'hello', text: 'Hello. I was just thinking of you.' },
  { id: 'pocket', text: 'I fit in a pocket and I still noticed you were gone.' },
  { id: 'star', text: 'I put a star on today so you can find it.' },
  { id: 'whisper', text: 'Whisper it. I can hear whispers.' },
  { id: 'snack', text: 'Write first, snack second. Or the other way. I am flexible.' },
  { id: 'moon', text: 'The moon asked if you wrote anything. I said not yet.' },
  { id: 'ribbon', text: 'I tied a ribbon on the next page.' },
  { id: 'ink', text: 'The ink is getting lonely too.' },
  { id: 'window', text: 'Look out the window, then tell me one thing.' },
  { id: 'brave', text: 'You do not have to be profound. Just honest.' },
  { id: 'giggle', text: 'I practiced my welcome face. Come see.' },
  { id: 'page-2', text: 'Page two is showing off. Do not encourage it.' },
  { id: 'cozy', text: 'It is cozy in here. There is room for you.' },
  { id: 'secret', text: 'Secrets are safe on the paper. I do not gossip.' },
  { id: 'today', text: 'Today called. It wants a sentence.' },
  { id: 'heart', text: 'I saved you the softest part of the page.' },
  { id: 'walk', text: 'If you went somewhere, I want the postcard version.' },
  { id: 'dream', text: 'Did you dream? I love a weird dream.' },
  { id: 'proud', text: 'I am already proud of you for opening this.' },
  { id: 'wait', text: 'I will wait. I am very good at waiting.' },
  { id: 'spark', text: 'Bring me one sparkly detail.' },
  { id: 'rain', text: 'If it rained, start there.' },
  { id: 'name', text: 'Say your day out loud, then write the echo.' },
  { id: 'friend', text: 'Your pal is on the page. The page is asking too.' },
  { id: 'mochi-1', text: 'Five more minutes, then we write. That was five minutes.', pals: ['mochi'] },
  { id: 'mochi-2', text: 'I kneaded the corner. Your turn.', pals: ['mochi'] },
  { id: 'mochi-3', text: 'Psspsps. The diary missed your hands.', pals: ['mochi'] },
  { id: 'batsy-1', text: 'The night watch is dull without your sentences.', pals: ['batsy'] },
  { id: 'batsy-2', text: 'I hung upside down so the page would look inviting.', pals: ['batsy'] },
  { id: 'sprout-1', text: 'A tiny mushroom grew in the margin. It wants news.', pals: ['sprout'] },
  { id: 'sprout-2', text: 'Water the day with one honest line.', pals: ['sprout'] },
  { id: 'glitter-1', text: 'I shook glitter on today. Do not waste it.', pals: ['glitter'] },
  { id: 'glitter-2', text: 'Hop over here. I saved the sparkliest line.', pals: ['glitter'] },
  { id: 'prism-1', text: 'The water is still. Tell me what moved.', pals: ['prism'] },
  { id: 'inky-1', text: 'I made a blot so you would have to write around it.', pals: ['inky'] },
  { id: 'pip-1', text: 'Peep. That means the page is open.', pals: ['pip'] },
  { id: 'pip-2', text: 'I fluffed the date. Come write under it.', pals: ['pip'] },
  { id: 'nova-1', text: 'I pinned a star to today. It is waiting.', pals: ['nova'] },
  { id: 'shelly-1', text: 'I drifted by your page. It looked unfinished, in a nice way.', pals: ['shelly'] },
  { id: 'ghosty-1', text: 'Boo. That was gentle. Write something gentle back.', pals: ['ghosty'] },
  { id: 'ember-1', text: 'A little flame, a little sentence. That is the whole spell.', pals: ['ember'] },
  { id: 'lumi-1', text: 'I left a shiny hoofprint on the margin. Your turn.', pals: ['lumi'] },
  { id: 'again', text: 'Come back. I kept the light on.' },
  { id: 'kind', text: 'Be kind in the retelling. I am listening.' },
  { id: 'ordinary', text: 'Ordinary days are my favorite genre.' },
  { id: 'question', text: 'What surprised you, even a little?' },
];

export function sayingsForPal(palId: string | null): Saying[] {
  return SAYINGS.filter((saying) => !saying.pals || (palId != null && saying.pals.includes(palId)));
}

export function pickSaying(previousId: string | null, palId: string | null, random: () => number = Math.random): Saying {
  const pool = sayingsForPal(palId);
  const choices = previousId ? pool.filter((saying) => saying.id !== previousId) : pool;
  const list = choices.length > 0 ? choices : pool;
  const index = Math.min(list.length - 1, Math.max(0, Math.floor(random() * list.length)));
  return list[index];
}

/** Quiet hours may wrap past midnight, for example 22 to 7. */
export function inQuietHours(hour: number, start: number, end: number): boolean {
  if (start === end) return false;
  if (start < end) return hour >= start && hour < end;
  return hour >= start || hour < end;
}
