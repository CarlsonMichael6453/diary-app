import { dayOfYear } from '../logic/dates';

export const PROMPTS = [
  'What is one small thing that felt like yours today?',
  'Who would you write a postcard to, and what would the picture be?',
  'Describe a sound from today that you do not want to forget.',
  'What did you almost say out loud?',
  'Write about a meal, a sip, or a snack as if it were a scene.',
  'What is something you are carrying that could be set down?',
  'Which color showed up the most today?',
  'Write a letter to yourself this time last year.',
  'What made you laugh, even briefly?',
  'Describe the sky the last time you looked at it.',
  'What is a tiny bravery from this week?',
  'Who feels like home, and why today?',
  'What are you avoiding, written as kindly as you can?',
  'List five things in the room that would tell a stranger about you.',
  'What would “enough” look like before bedtime?',
  'Write about a place you miss without explaining it away.',
  'What song, or silence, matched your mood?',
  'Describe your hands right now.',
  'What did you do just for the pleasure of it?',
  'Write the weather inside your chest.',
  'What is a question you wish someone would ask you?',
  'Name a boundary that protected you recently.',
  'What are you proud of that nobody clapped for?',
  'Describe a conversation in only the parts you remember.',
  'What would you repeat from today?',
  'What would you kindly edit out of today?',
  'Write about something that is growing, even slowly.',
  'Who did you think about and not text?',
  'What does rest look like when you are not earning it?',
  'Describe a door you walked through today.',
  'What is a fear that got smaller when you looked at it?',
  'Write three lines of dialogue you wish had happened.',
  'What object in your bag has a story?',
  'How did your body ask for something today?',
  'What is a hope that feels quiet rather than loud?',
  'Describe a kindness you noticed, given or received.',
  'What are you learning about the way you love people?',
  'Write about a plan you are allowed to change.',
  'What smelled like a memory?',
  'If today were a page in a picture book, what is the caption?',
  'What did you make, mend, cook, or tidy?',
  'Write to the version of you who is already asleep tonight.',
  'What is something beautiful that was not meant for you, and you enjoyed anyway?',
  'Name a habit that is actually on your side.',
  'What felt heavy, and what was the lightest part of it?',
  'Describe a face you were glad to see.',
  'What do you want more of this month, in plain words?',
  'Write about water — rain, a shower, a glass, the sea.',
  'What is a story you tell yourself that might be out of date?',
  'Who are you when nobody needs anything?',
  'Describe the last time you felt proud of your taste.',
  'What is a sentence you needed to hear?',
  'Write about a mistake without a moral.',
  'What are you curious about that has no deadline?',
  'Describe a room where you can breathe.',
  'What did you wear, and how did it feel on you?',
  'Write a list of tiny luxuries you already have.',
  'What is changing that you have not announced?',
  'Describe a walk, even if it was only down a hallway.',
  'What would you put in a pocket to remember this week?',
  'Write about anger as if it were weather passing through.',
  'Who did you forgive a little, including yourself?',
  'What is a dream you had, or a daydream you kept?',
  'Describe something old that still works.',
  'What do you want your days to taste like?',
  'Write about a boundary with a plant, a pet, a person, or a phone.',
  'What is a compliment you can give yourself without flinching?',
  'Describe the light in the room where you are writing.',
  'What did you say yes to? What did you say no to?',
  'Write about a friendship in one specific moment.',
  'What is a project you are allowed to do badly at first?',
  'Describe a morning you would like to repeat.',
  'What are you grieving that does not look like grief?',
  'Write a note you could leave on the kitchen table.',
  'What felt like play today?',
  'Describe a risk the size of a postcard.',
  'What do you know now that you did not know on Monday?',
  'Write about the moon, the streetlight, or a screen in the dark.',
  'Who brings out a softer voice in you?',
  'What is a recipe, ritual, or route that steadies you?',
  'Describe a mess you are not going to apologize for.',
  'What would you like tomorrow’s first hour to hold?',
  'Write about a book, show, or song as if it sat beside you.',
  'What part of today do you want to keep private, and what part can be shared?',
  'Name a quality you are practicing, not performing.',
  'Describe an animal, real or imagined, that matches your energy.',
  'What is a promise you can keep that is smaller than you think?',
  'Write the next page as if a friend will read only the kind parts.',
  'What surprised you by being ordinary and lovely?',
  'Describe a chair, bed, or patch of floor that knows you.',
  'What are three true sentences about right now?',
  'If your mood were a season, which one, and what is the weather doing?',
  'What do you want to remember when this month is a story?',
  'Write about enough sleep, enough food, or enough quiet.',
  'What is a door you are not ready to open, and what is the porch like?',
  'End with one line you would embroider on the edge of this page.',
] as const;

export function promptForDate(dateKey: string): string {
  const index = Math.abs(dayOfYear(dateKey)) % PROMPTS.length;
  return PROMPTS[index];
}

/** A different prompt. Never returns the one on the page now. */
export function nextPrompt(current: string, random: () => number = Math.random): string {
  const others = PROMPTS.filter((prompt) => prompt !== current);
  if (others.length === 0) return current;
  const index = Math.min(others.length - 1, Math.max(0, Math.floor(random() * others.length)));
  return others[index];
}

/** The question on a page, or nothing when prompts are off or this page hid it. */
export function visiblePrompt(
  page: { date: string; prompt?: string | null; promptHidden?: boolean },
  promptsOn: boolean,
): string | null {
  if (!promptsOn || page.promptHidden) return null;
  return page.prompt || promptForDate(page.date);
}
