import type { MoodId } from '../data/moods';

/**
 * Adding a buddy:
 * 1. Append a BuddyDef here (id, copy, perch, anchors, premium flag).
 * 2. Add a drawing function in BuddyView.tsx and register it in BUDDY_DRAW.
 * Outfits work the same way: add an OutfitDef, then a case in drawOutfit().
 */

export type BuddyContext = {
  mood: MoodId;
  streak: number;
  writing: boolean;
  finished: boolean;
  entryCount: number;
  prompt?: string;
  celebrate?: boolean;
};

export type Anchor = { x: number; y: number };

export type BuddyDef = {
  id: string;
  name: string;
  species: string;
  blurb: string;
  premium: boolean;
  perch: 'br' | 'tr' | 'tl' | 'bl' | 'banner';
  /** hat = crown, face = eyes, neck = between head and body, pin = chest. scale fits the pal's head. */
  anchors: { hat: Anchor; neck: Anchor; face: Anchor; pin: Anchor; scale: number };
  lines: {
    idle: string;
    writing: string;
    saved: string;
    streak: string;
    longStreak: string;
    moods: Partial<Record<MoodId, string>>;
  };
};

export type OutfitDef = {
  id: string;
  name: string;
  slot: 'hat' | 'neck' | 'face' | 'back' | 'pin';
  unlock: 'free' | 'game' | 'streak' | 'premium' | 'coins';
  price?: number;
  hint: string;
};

export const OUTFITS: OutfitDef[] = [
  { id: 'ribbon', name: 'Starter ribbon', slot: 'neck', unlock: 'free', hint: 'Tied on from the very first page.' },
  { id: 'bow', name: 'Star bow', slot: 'hat', unlock: 'game', hint: 'Win a round of memory match.' },
  { id: 'party-hat', name: 'Party hat', slot: 'hat', unlock: 'game', hint: 'Catch stickers in the tap game.' },
  { id: 'headphones', name: 'Headphones', slot: 'hat', unlock: 'game', hint: 'A drop from memory match.' },
  { id: 'scarf', name: 'Knit scarf', slot: 'neck', unlock: 'coins', price: 40, hint: '40 coins in the wardrobe.' },
  { id: 'glasses', name: 'Star glasses', slot: 'face', unlock: 'game', hint: 'Land on it in the daily spin.' },
  { id: 'crown-flower', name: 'Flower crown', slot: 'hat', unlock: 'streak', hint: 'Write three days in a row.' },
  { id: 'cape', name: 'Tiny cape', slot: 'back', unlock: 'game', hint: 'A rare drop from memory match.' },
  { id: 'pearls', name: 'Pearl strand', slot: 'neck', unlock: 'coins', price: 70, hint: '70 coins in the wardrobe.' },
  { id: 'moon-pin', name: 'Moon pin', slot: 'pin', unlock: 'streak', hint: 'Write seven days in a row.' },
  { id: 'wand', name: 'Spark wand', slot: 'pin', unlock: 'premium', hint: 'Included with Diary Plus.' },
  { id: 'halo', name: 'Little halo', slot: 'hat', unlock: 'premium', hint: 'Included with Diary Plus.' },
];

const baseAnchors = {
  hat: { x: 80, y: 46 },
  neck: { x: 80, y: 106 },
  face: { x: 80, y: 78 },
  pin: { x: 112, y: 128 },
  scale: 1,
};

export const BUDDIES: BuddyDef[] = [
  {
    id: 'mochi',
    name: 'Mochi',
    species: 'Squishy cat',
    blurb: 'Naps on the page and wakes up when you start writing.',
    premium: false,
    perch: 'br',
    anchors: baseAnchors,
    lines: {
      idle: 'pspsps… five more minutes.',
      writing: 'Oh. You are here. I will stay awake.',
      saved: 'I kneaded the corner. It is official.',
      streak: 'We keep coming back. I am proud and sleepy.',
      longStreak: 'A whole week. I might actually stay up.',
      moods: {
        sad: 'I will sit close. No advice, just warmth.',
        anxious: 'One messy line is a whole page.',
        tired: 'Blink once if you want a nap too.',
        happy: 'Your mood feels like a sunbeam.',
        loved: 'I am purring at a polite volume.',
        angry: 'I will be a paperweight until it passes.',
        hopeful: 'Something small is growing. I can nap near it.',
        grateful: 'This page smells like a good day.',
        excited: 'I opened both eyes. That is a lot for me.',
        calm: 'We can be quiet together.',
      },
    },
  },
  {
    id: 'batsy',
    name: 'Batsy',
    species: 'Pocket bat',
    blurb: 'Hangs from the corner and sways while you write.',
    premium: false,
    perch: 'tr',
    anchors: { hat: { x: 80, y: 92 }, neck: { x: 80, y: 100 }, face: { x: 80, y: 110 }, pin: { x: 104, y: 82 }, scale: 0.85 },
    lines: {
      idle: 'Upside down is just another margin.',
      writing: 'The candle is lit. I am listening.',
      saved: 'A good page. I will guard it from the ceiling.',
      streak: 'You keep the night watch. I respect that.',
      longStreak: 'Seven moons of writing. Dramatic, in a good way.',
      moods: {
        sad: 'Even bats fold their wings sometimes.',
        angry: 'I will glare at the problem for you.',
        calm: 'The house is quiet. I like the quiet.',
        excited: 'My wings did a little involuntary flap.',
        loved: 'You can borrow my softest wing.',
        tired: 'Dawn is a rumor. Rest.',
        hopeful: 'There is gold in this dark.',
        grateful: 'Thank you for leaving the light on.',
        anxious: 'We can hang here until it shrinks.',
        happy: 'A bright mood looks good in black lace.',
      },
    },
  },
  {
    id: 'sprout',
    name: 'Sprout',
    species: 'Garden mushroom',
    blurb: 'Grows a flower for every day of your writing streak.',
    premium: false,
    perch: 'br',
    anchors: { hat: { x: 80, y: 74 }, neck: { x: 80, y: 122 }, face: { x: 80, y: 102 }, pin: { x: 96, y: 128 }, scale: 0.8 },
    lines: {
      idle: 'The soil of this page is still warm.',
      writing: 'Words are a kind of rain. Thank you.',
      saved: 'I tucked this page under a leaf.',
      streak: 'Look — a flower for each day you returned.',
      longStreak: 'The pot is getting crowded. I love it.',
      moods: {
        hopeful: 'I can feel a sprout under the ink.',
        sad: 'Even mushrooms like company in the rain.',
        calm: 'Tea temperature. Perfect.',
        grateful: 'The garden noticed you.',
        tired: 'Rest is part of growing.',
        happy: 'The cap of my day is sunny.',
        loved: 'I grew an extra petal for that.',
        anxious: 'Roots first. The flower can wait.',
        angry: 'Storms water the ground too.',
        excited: 'I almost popped a new spot.',
      },
    },
  },
  {
    id: 'glitter',
    name: 'Glitter',
    species: 'Bow bunny',
    blurb: 'Cheers, sparkles, and means it when you finish a page.',
    premium: false,
    perch: 'br',
    anchors: { hat: { x: 80, y: 56 }, neck: { x: 80, y: 116 }, face: { x: 80, y: 86 }, pin: { x: 104, y: 124 }, scale: 1 },
    lines: {
      idle: 'I warmed up the pom-poms.',
      writing: 'Yes yes yes, keep going.',
      saved: 'Finished! I am doing the small jump.',
      streak: 'Streak sparkles. I live for this.',
      longStreak: 'A week of pages. I need a bigger bow.',
      moods: {
        happy: 'Your smile has sequins on it.',
        excited: 'I cannot stop sparkling. Sorry. Not sorry.',
        loved: 'Heart eyes, but make it stationery.',
        sad: 'I will cheer very quietly.',
        anxious: 'We can do a tiny finish. It still counts.',
        calm: 'Soft sparkle only. I can be gentle.',
        grateful: 'I am clapping with my ears.',
        tired: 'Even bunnies sit the last dance out.',
        angry: 'I am on your side of the argument.',
        hopeful: 'Tomorrow already looks shiny.',
      },
    },
  },
  {
    id: 'prism',
    name: 'Prism',
    species: 'Rainbow axolotl',
    blurb: 'Shifts color to match the mood of the page.',
    premium: false,
    perch: 'banner',
    anchors: { hat: { x: 118, y: 76 }, neck: { x: 110, y: 108 }, face: { x: 118, y: 94 }, pin: { x: 96, y: 116 }, scale: 0.75 },
    lines: {
      idle: 'I am wearing the color of waiting.',
      writing: 'Tell me the mood. I will match it.',
      saved: 'I saved that color in my gills.',
      streak: 'The streak is a whole gradient now.',
      longStreak: 'Seven colors, seven days. Obviously.',
      moods: {
        happy: 'Yellow, but the warm kind.',
        calm: 'Blue that does not rush.',
        sad: 'I went periwinkle. It felt honest.',
        anxious: 'Lavender static. I am still here.',
        excited: 'Orange with the saturation turned up.',
        grateful: 'Pink. The thankful pink.',
        angry: 'A clean red. It will fade.',
        tired: 'Grey-blue, like a late window.',
        loved: 'The pink that means stay.',
        hopeful: 'Green at the edges.',
      },
    },
  },
  {
    id: 'inky',
    name: 'Inky',
    species: 'Ink blot',
    blurb: 'Doodles in the margin based on how the page feels.',
    premium: false,
    perch: 'tl',
    anchors: { hat: { x: 78, y: 50 }, neck: { x: 78, y: 108 }, face: { x: 78, y: 84 }, pin: { x: 112, y: 116 }, scale: 0.9 },
    lines: {
      idle: 'I am just testing the pen.',
      writing: 'Your letters have good shoulders.',
      saved: 'I signed the margin. Very small.',
      streak: 'I have a doodle for every day.',
      longStreak: 'The margin is basically a gallery.',
      moods: {
        happy: 'Hearts. I could not help it.',
        sad: 'A few raindrops. They dry.',
        anxious: 'Spirals, until the page settles.',
        excited: 'Stars. Too many stars.',
        calm: 'One clean wave.',
        tired: 'Zzz, but in calligraphy.',
        angry: 'Zigzags. Then I put the pen down.',
        grateful: 'A tiny flower, pressed flat.',
        hopeful: 'A sprout in the gutter.',
        loved: 'A heart with a better heart inside it.',
      },
    },
  },
  {
    id: 'pip',
    name: 'Pip',
    species: 'Fluffy chick',
    blurb: 'Reads the daily prompt out loud, in a chick way.',
    premium: false,
    perch: 'br',
    anchors: { hat: { x: 74, y: 48 }, neck: { x: 72, y: 104 }, face: { x: 73, y: 76 }, pin: { x: 92, y: 118 }, scale: 0.9 },
    lines: {
      idle: 'I have the prompt. No spoilers. Some spoilers.',
      writing: 'That is a good answer to the question.',
      saved: 'I bookmarked this with a crumb.',
      streak: 'You answered again. I love a series.',
      longStreak: 'Seven prompts. You are the sequel.',
      moods: {
        happy: 'The prompt liked your mood.',
        calm: 'We can read it slowly.',
        sad: 'The prompt can wait. I will not.',
        anxious: 'Pick one word from it. That is enough.',
        excited: 'I read the prompt twice from excitement.',
        grateful: 'Thank you for reading with me.',
        tired: 'I will whisper the prompt.',
        loved: 'This one feels like a hug.',
        angry: 'The prompt is not the boss of you.',
        hopeful: 'I underlined the kindest word.',
      },
    },
  },
  {
    id: 'nova',
    name: 'Nova',
    species: 'Sleepy star',
    blurb: 'Glows brighter the longer your writing streak lasts.',
    premium: false,
    perch: 'br',
    anchors: { hat: { x: 80, y: 40 }, neck: { x: 80, y: 108 }, face: { x: 80, y: 88 }, pin: { x: 108, y: 100 }, scale: 0.9 },
    lines: {
      idle: 'Low glow. I am conserving twinkle.',
      writing: 'You woke a point of light.',
      saved: 'I will hold this page in orbit.',
      streak: 'Brighter. You did that.',
      longStreak: 'I am almost too awake. Worth it.',
      moods: {
        tired: 'Same sky, lower wattage.',
        happy: 'I am doing the shiny thing.',
        calm: 'A night-light, not a spotlight.',
        sad: 'I dimmed so I would not glare.',
        hopeful: 'There is a dawn in the margin.',
        excited: 'Supernova, but pocket-sized.',
        loved: 'Warm light. Stay in it.',
        anxious: 'I will be a small steady star.',
        grateful: 'Thank you for looking up.',
        angry: 'Even storms have constellations.',
      },
    },
  },
  {
    id: 'shelly',
    name: 'Shelly',
    species: 'Moon jelly',
    blurb: 'Drifts across the top of the page while you write.',
    premium: false,
    perch: 'banner',
    anchors: { hat: { x: 80, y: 34 }, neck: { x: 80, y: 80 }, face: { x: 80, y: 64 }, pin: { x: 108, y: 70 }, scale: 0.85 },
    lines: {
      idle: 'Just drifting. The page is a tide pool.',
      writing: 'Your sentences make a current.',
      saved: 'I will float this one somewhere safe.',
      streak: 'The tide came back. So did you.',
      longStreak: 'A week of high tide. Beautiful.',
      moods: {
        calm: 'Still water. I like it here.',
        sad: 'I am translucent, not gone.',
        happy: 'Bubbles. Tiny ones.',
        excited: 'I pulsed. That is my jump.',
        loved: 'You can see my whole soft heart.',
        anxious: 'Float. You do not have to steer.',
        tired: 'I am mostly water and a nap.',
        hopeful: 'The next wave is gentle.',
        grateful: 'Salt and thanks.',
        angry: 'Even jellyfish can be firm.',
      },
    },
  },
  {
    id: 'ghosty',
    name: 'Ghosty',
    species: 'Shy ghost',
    blurb: 'Hides at first, then waves once the book fills up.',
    premium: false,
    perch: 'bl',
    anchors: { hat: { x: 80, y: 78 }, neck: { x: 80, y: 122 }, face: { x: 80, y: 102 }, pin: { x: 108, y: 128 }, scale: 0.95 },
    lines: {
      idle: '…hi. I live in the margin.',
      writing: 'I peeked. Your handwriting is kind.',
      saved: 'I will haunt this page in a friendly way.',
      streak: 'I am less see-through today.',
      longStreak: 'I practiced waving. Did you see?',
      moods: {
        sad: 'I brought a very small handkerchief.',
        anxious: 'We can both be half-hidden.',
        happy: 'Boo, but make it a compliment.',
        calm: 'I am just a wrinkle in the paper.',
        loved: 'I showed my whole face. That is new.',
        tired: 'Sheet ghosts understand bedtime.',
        hopeful: 'I think I might stay visible.',
        grateful: 'Thank you for not screaming.',
        excited: 'I did a tiny float.',
        angry: 'I can be spooky on your behalf.',
      },
    },
  },
  {
    id: 'ember',
    name: 'Ember',
    species: 'Baby dragon',
    blurb: 'A pocket dragon with opinions and a very small flame.',
    premium: true,
    perch: 'br',
    anchors: { hat: { x: 78, y: 46 }, neck: { x: 78, y: 100 }, face: { x: 78, y: 74 }, pin: { x: 104, y: 122 }, scale: 0.85 },
    lines: {
      idle: 'I am guarding the blank part.',
      writing: 'Tell me a treasure. A sentence counts.',
      saved: 'Hoard of one page. Excellent start.',
      streak: 'A dragon remembers every day you wrote.',
      longStreak: 'This streak could warm a castle.',
      moods: {
        happy: 'Little flame, big mood.',
        excited: 'I sparked. It was an accident of joy.',
        angry: 'I will roast the problem, not the page.',
        sad: 'Even dragons puddle sometimes.',
        calm: 'Smoke rings, very quiet.',
        loved: 'You are in the hoard. The good way.',
        tired: 'Wings folded. Diary still watched.',
        hopeful: 'I see gold in tomorrow.',
        grateful: 'Thank you for the cave of paper.',
        anxious: 'I am small and I am staying.',
      },
    },
  },
  {
    id: 'lumi',
    name: 'Lumi',
    species: 'Pocket unicorn',
    blurb: 'A round unicorn who treats every page like a meadow.',
    premium: true,
    perch: 'br',
    anchors: { hat: { x: 98, y: 48 }, neck: { x: 98, y: 96 }, face: { x: 106, y: 72 }, pin: { x: 70, y: 124 }, scale: 0.8 },
    lines: {
      idle: 'The meadow is this page. Hop on.',
      writing: 'I braided a little luck into the line.',
      saved: 'A wish, filed under today.',
      streak: 'The meadow is blooming on schedule.',
      longStreak: 'Seven days. My horn did a shine.',
      moods: {
        happy: 'Gallop is too strong. I did a prance.',
        loved: 'You get the softest part of the mane.',
        calm: 'Grazing on a quiet sentence.',
        sad: 'I will stand here until it eases.',
        hopeful: 'The next hill is gentle.',
        excited: 'Sparkles escaped. I am not sorry.',
        grateful: 'Thank you for the clearing.',
        tired: 'Even unicorns know bedtime.',
        anxious: 'One hoof in front of the other.',
        angry: 'I can be glitter and a boundary.',
      },
    },
  },
];

export function getBuddy(id: string | null | undefined): BuddyDef | undefined {
  if (!id || id === 'none') return undefined;
  return BUDDIES.find((buddy) => buddy.id === id);
}

export function getOutfit(id: string): OutfitDef | undefined {
  return OUTFITS.find((outfit) => outfit.id === id);
}

export function buddyLine(buddy: BuddyDef, ctx: BuddyContext): string {
  if (ctx.celebrate) return buddy.lines.saved;
  if (ctx.streak >= 7) return buddy.lines.longStreak;
  if (ctx.streak >= 3) return buddy.lines.streak;
  if (buddy.id === 'mochi' && !ctx.writing && !ctx.finished) return buddy.lines.idle;
  if (buddy.id === 'ghosty' && ctx.entryCount < 2 && !ctx.writing) return '…';
  if (ctx.writing) return buddy.lines.moods[ctx.mood] ?? buddy.lines.writing;
  return buddy.lines.moods[ctx.mood] ?? buddy.lines.idle;
}

export function ghostyOpacity(entryCount: number): number {
  return Math.max(0.34, Math.min(1, 0.32 + entryCount * 0.08));
}

export function novaGlow(streak: number): number {
  return Math.max(0.18, Math.min(1, 0.2 + streak * 0.12));
}

export function sproutBlooms(streak: number): number {
  return Math.max(0, Math.min(6, streak));
}

export function canEquipOutfit(
  outfit: OutfitDef,
  wallet: { ownedOutfitIds: string[]; premium: boolean },
): boolean {
  if (outfit.unlock === 'free') return true;
  if (wallet.ownedOutfitIds.includes(outfit.id)) return true;
  if (outfit.unlock === 'premium' && wallet.premium) return true;
  return false;
}
