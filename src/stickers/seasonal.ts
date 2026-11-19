import { coinPrice, type Rarity } from '../logic/access';
import { slug } from '../logic/id';
import type { ArtKey, PackDef, Palette, StickerDef } from './types';

const C = {
  gold: { main: '#F2C14E', alt: '#FFE7A3', accent: '#E39B2B', detail: '#6A4A12', soft: '#FFF8E4' },
  red: { main: '#E2544A', alt: '#FFD0C6', accent: '#F2C14E', detail: '#5A1C18', soft: '#FFF4F0' },
  pink: { main: '#F4A3B8', alt: '#FFE4EE', accent: '#E45B86', detail: '#5C3040', soft: '#FFF6F8' },
  rose: { main: '#E36B8A', alt: '#FFD0DC', accent: '#FF8FB0', detail: '#6A243C', soft: '#FFF0F4' },
  green: { main: '#3E9A78', alt: '#D7F3E6', accent: '#F2C14E', detail: '#143828', soft: '#F3FBF7' },
  forest: { main: '#1F6B3A', alt: '#C9E6D2', accent: '#F2C14E', detail: '#102818', soft: '#F2F8F4' },
  mint: { main: '#8FD0B8', alt: '#E5F6EE', accent: '#3E9A78', detail: '#1E4A38', soft: '#F4FBF8' },
  blue: { main: '#2F6FAD', alt: '#D5E6F8', accent: '#F2C14E', detail: '#14243C', soft: '#F4F8FC' },
  navy: { main: '#1C3F6E', alt: '#D5DDEA', accent: '#E2544A', detail: '#101828', soft: '#F4F6FA' },
  ice: { main: '#D7E7F7', alt: '#FFFFFF', accent: '#7AA2E3', detail: '#243656', soft: '#F7FBFF' },
  lilac: { main: '#C9B6F2', alt: '#E6DCFF', accent: '#8B6AD6', detail: '#3A2A55', soft: '#F7F3FF' },
  grape: { main: '#8B6AD6', alt: '#E4D8FF', accent: '#FF8AD4', detail: '#2E2148', soft: '#F8F4FF' },
  hot: { main: '#FF4F9A', alt: '#FFD0E8', accent: '#7C5CFF', detail: '#4A1038', soft: '#FFF0F8' },
  sun: { main: '#FFE56A', alt: '#FFF6C2', accent: '#FF8A5B', detail: '#5A4810', soft: '#FFFEF4' },
  peach: { main: '#FFC2A8', alt: '#FFE8DC', accent: '#FF8A7A', detail: '#6A3A30', soft: '#FFF8F4' },
  cocoa: { main: '#C47B5A', alt: '#F0D2B8', accent: '#F2C14E', detail: '#4A2E22', soft: '#FFF6EE' },
  cream: { main: '#F7F1E1', alt: '#E7D7B8', accent: '#E7B15A', detail: '#6A5438', soft: '#FFFCF6' },
  ink: { main: '#2C2433', alt: '#5A4558', accent: '#F2C14E', detail: '#F4E7D4', soft: '#3A3142' },
  orange: { main: '#F08A3C', alt: '#FFD7B0', accent: '#6B2D6B', detail: '#4A2410', soft: '#FFF6EE' },
  plum: { main: '#6E3A55', alt: '#E7C2D4', accent: '#F2C14E', detail: '#1A1218', soft: '#F6E8EF' },
  sea: { main: '#1F8A9E', alt: '#B7E4EA', accent: '#F2B56B', detail: '#0E3038', soft: '#E7F7F8' },
  coral: { main: '#FF8A7A', alt: '#FFD2C8', accent: '#FFE08A', detail: '#6A3030', soft: '#FFF6F2' },
} satisfies Record<string, Palette>;

type Spec = [string, ArtKey];

function build(packId: string, colors: [Palette, Palette], items: Spec[]): StickerDef[] {
  return items.map(([name, art], index) => {
    const rarity: Rarity = index === items.length - 1 ? 'epic' : index >= items.length - 3 ? 'rare' : 'common';
    return {
      id: `${packId}-${slug(name)}`,
      packId,
      name,
      art,
      rarity,
      unlock: 'coins',
      price: coinPrice(rarity),
      colors: colors[index % 2],
    };
  });
}

export const SEASONAL_PACKS: PackDef[] = [
  { id: 'new-year', name: "New Year's", blurb: 'Sparks for the first page of the year.', premium: false, swatch: '#F2C14E', emoji: '🎆', coinPrice: 70, seasonal: true },
  { id: 'lunar-new-year', name: 'Lunar New Year', blurb: 'Lanterns, envelopes, and a bright moon.', premium: false, swatch: '#E2544A', emoji: '🏮', coinPrice: 90, seasonal: true },
  { id: 'valentines', name: "Valentine's Day", blurb: 'Hearts and a bow that means it.', premium: false, swatch: '#E36B8A', emoji: '💌', coinPrice: 80, seasonal: true },
  { id: 'st-patricks', name: "St. Patrick's Day", blurb: 'Green luck and a small rainbow.', premium: false, swatch: '#3E9A78', emoji: '☘️', coinPrice: 60, seasonal: true },
  { id: 'easter', name: 'Easter & spring', blurb: 'Bunnies, chicks, and new blossoms.', premium: false, swatch: '#FFC2A8', emoji: '🐣', coinPrice: 80, seasonal: true },
  { id: 'mothers-day', name: "Mother's Day", blurb: 'Flowers for the person who stayed.', premium: true, swatch: '#F4A3B8', emoji: '🌷', seasonal: true },
  { id: 'fathers-day', name: "Father's Day", blurb: 'A mug, a key, and a quiet thank-you.', premium: false, swatch: '#5C6B7A', emoji: '☕️', coinPrice: 70, seasonal: true },
  { id: 'pride', name: 'Pride Month', blurb: 'Every color, kept on the page.', premium: true, swatch: '#7C5CFF', emoji: '🏳️‍🌈', seasonal: true },
  { id: 'fourth-july', name: 'Fourth of July', blurb: 'Stars and a summer sparkler.', premium: false, swatch: '#1C3F6E', emoji: '🎇', coinPrice: 70, seasonal: true },
  { id: 'summer', name: 'Summer break', blurb: 'Waves, shells, and a slow afternoon.', premium: false, swatch: '#1F8A9E', emoji: '🏖️', coinPrice: 80, seasonal: true },
  { id: 'back-to-school', name: 'Back to school', blurb: 'Books, clips, and a fresh start.', premium: false, swatch: '#C47B5A', emoji: '📚', coinPrice: 70, seasonal: true },
  { id: 'halloween', name: 'Halloween', blurb: 'Bats, ghosts, and one friendly pumpkin.', premium: true, swatch: '#F08A3C', emoji: '🎃', seasonal: true },
  { id: 'dia-de-muertos', name: 'Día de los Muertos', blurb: 'Marigolds and candles for the table.', premium: false, swatch: '#F08A3C', emoji: '🌼', coinPrice: 80, seasonal: true },
  { id: 'thanksgiving', name: 'Thanksgiving', blurb: 'Pie, leaves, and a full table.', premium: false, swatch: '#C47B5A', emoji: '🥧', coinPrice: 70, seasonal: true },
  { id: 'hanukkah', name: 'Hanukkah', blurb: 'Candles for eight bright nights.', premium: true, swatch: '#1C3F6E', emoji: '🕎', seasonal: true },
  { id: 'diwali', name: 'Diwali', blurb: 'Lamps in a row, and a little gold.', premium: false, swatch: '#F2C14E', emoji: '🪔', coinPrice: 90, seasonal: true },
  { id: 'christmas', name: 'Christmas', blurb: 'Stars, bows, and a quiet snow moon.', premium: true, swatch: '#D4536A', emoji: '🎄', seasonal: true },
  { id: 'kwanzaa', name: 'Kwanzaa', blurb: 'Candles and a shared table.', premium: false, swatch: '#1F6B3A', emoji: '🕯️', coinPrice: 80, seasonal: true },
  { id: 'birthday', name: 'Your birthday', blurb: 'A cake that shows up on your week.', premium: false, swatch: '#FF8AD4', emoji: '🎂', coinPrice: 50, seasonal: true },
];

const SETS: Record<string, [Palette, Palette, Spec[]]> = {
  'new-year': [C.gold, C.ice, [
    ['Midnight star', 'star'], ['First spark', 'sparkle'], ['Year comet', 'comet'], ['Toast ribbon', 'ribbon'],
    ['Clock moon', 'moon'], ['Party crown', 'crown'], ['Confetti gem', 'gem'], ['Wish heart', 'heart'],
    ['Firework pop', 'pop'], ['Gold hour', 'crystal'],
  ]],
  'lunar-new-year': [C.red, C.gold, [
    ['Red envelope', 'envelope'], ['Lantern moon', 'moon'], ['Spring blossom', 'blossom'], ['Coin knot', 'gem'],
    ['Koi', 'fish'], ['Firecracker', 'sparkle'], ['Lion ribbon', 'ribbon'], ['Dumpling', 'riceball'],
    ['Lucky star', 'star'], ['Parade crown', 'crown'],
  ]],
  valentines: [C.rose, C.pink, [
    ['Love note', 'envelope'], ['Heart bow', 'bow'], ['Rose', 'rose'], ['Sweet heart', 'heart'],
    ['Twin cherry', 'cherry'], ['Pink butterfly', 'butterfly'], ['Ribbon kiss', 'ribbon'], ['Candy heart', 'heart'],
    ['Blush spark', 'sparkle'], ['True heart', 'heart'],
  ]],
  'st-patricks': [C.green, C.gold, [
    ['Shamrock', 'leaf'], ['Little rainbow', 'rainbow'], ['Luck coin', 'gem'], ['Green bow', 'bow'],
    ['Pot star', 'star'], ['Clover heart', 'heart'], ['Parade ribbon', 'ribbon'], ['Moss spark', 'sparkle'],
    ['Gold harp moon', 'moon'], ['Lucky crown', 'crown'],
  ]],
  easter: [C.peach, C.mint, [
    ['Spring bunny', 'bunny'], ['Chick', 'chick'], ['Blossom egg', 'blossom'], ['Daisy', 'daisy'],
    ['Tulip', 'tulip'], ['Meadow butterfly', 'butterfly'], ['Nest ribbon', 'ribbon'], ['Soft sun', 'sun'],
    ['Pastel heart', 'heart'], ['Garden crown', 'crown'],
  ]],
  'mothers-day': [C.pink, C.rose, [
    ['Tulip bunch', 'tulip'], ['Thank-you heart', 'heart'], ['Rose', 'rose'], ['Daisy pin', 'daisy'],
    ['Soft bow', 'bow'], ['Note', 'envelope'], ['Blossom', 'blossom'], ['Butterfly', 'butterfly'],
    ['Ribbon', 'ribbon'], ['Mother crown', 'crown'],
  ]],
  'fathers-day': [C.cocoa, C.navy, [
    ['Morning mug', 'mug'], ['House key', 'key'], ['Quiet star', 'star'], ['Loaf', 'loaf'],
    ['Anchor', 'anchor'], ['Notebook', 'book'], ['Pen', 'quill'], ['Warm heart', 'heart'],
    ['Ribbon tag', 'ribbon'], ['Dad crown', 'crown'],
  ]],
  pride: [C.hot, C.sun, [
    ['Pride heart', 'heart'], ['Rainbow', 'rainbow'], ['March star', 'star'], ['Sun', 'sun'],
    ['Butterfly', 'butterfly'], ['Ribbon', 'ribbon'], ['Spark', 'sparkle'], ['Smile', 'smiley'],
    ['Gem', 'gem'], ['Pride crown', 'crown'],
  ]],
  'fourth-july': [C.navy, C.red, [
    ['Field star', 'star'], ['Sparkler', 'sparkle'], ['Ribbon stripe', 'ribbon'], ['Summer comet', 'comet'],
    ['Heart star', 'heart'], ['Sunburst', 'sun'], ['Night gem', 'gem'], ['Pop', 'pop'],
    ['Parade bow', 'bow'], ['Sky crown', 'crown'],
  ]],
  summer: [C.sea, C.sun, [
    ['Wave', 'wave'], ['Shell', 'shell'], ['Starfish', 'starfish'], ['Sun hat day', 'sun'],
    ['Melting scoop', 'scoop'], ['Little whale', 'whale'], ['Coral', 'coral'], ['Seahorse', 'seahorse'],
    ['Beach heart', 'heart'], ['Tide crown', 'crown'],
  ]],
  'back-to-school': [C.cocoa, C.blue, [
    ['Fresh book', 'book'], ['Pencil quill', 'quill'], ['Paper clip', 'clip'], ['Apple', 'strawberry'],
    ['Specs', 'specs'], ['Star sticker', 'star'], ['Note', 'envelope'], ['Tape', 'tape'],
    ['Lunch heart', 'heart'], ['Class crown', 'crown'],
  ]],
  halloween: [C.orange, C.ink, [
    ['Pumpkin', 'mushroom'], ['Tiny bat', 'bat'], ['Shy ghost', 'ghost'], ['Web', 'web'],
    ['Candle', 'candle'], ['Black cat', 'cat'], ['Moon', 'moon'], ['Potion', 'potion'],
    ['Candy', 'pop'], ['Night crown', 'crown'],
  ]],
  'dia-de-muertos': [C.orange, C.plum, [
    ['Marigold', 'daisy'], ['Altar candle', 'candle'], ['Sugar heart', 'heart'], ['Petal path', 'blossom'],
    ['Moon', 'moon'], ['Ribbon', 'ribbon'], ['Flame', 'flame'], ['Butterfly', 'butterfly'],
    ['Gold spark', 'sparkle'], ['Ofrenda crown', 'crown'],
  ]],
  thanksgiving: [C.cocoa, C.gold, [
    ['Pie slice', 'pie'], ['Maple leaf', 'leaf'], ['Loaf', 'loaf'], ['Acorn', 'acorn'],
    ['Table heart', 'heart'], ['Harvest sun', 'sun'], ['Berry', 'strawberry'], ['Ribbon', 'ribbon'],
    ['Grateful star', 'star'], ['Feast crown', 'crown'],
  ]],
  hanukkah: [C.blue, C.gold, [
    ['First candle', 'candle'], ['Second flame', 'flame'], ['Night star', 'star'], ['Spark', 'sparkle'],
    ['Moon', 'moon'], ['Blue gem', 'gem'], ['Ribbon', 'ribbon'], ['Heart', 'heart'],
    ['Crystal', 'crystal'], ['Light crown', 'crown'],
  ]],
  diwali: [C.gold, C.orange, [
    ['Diya', 'flame'], ['Lamp row', 'candle'], ['Rangoli', 'blossom'], ['Spark', 'sparkle'],
    ['Star', 'star'], ['Lotus', 'blossom'], ['Moon', 'moon'], ['Gold heart', 'heart'],
    ['Gem', 'gem'], ['Light crown', 'crown'],
  ]],
  christmas: [C.red, C.forest, [
    ['Tree star', 'star'], ['Bow', 'bow'], ['Ribbon', 'ribbon'], ['Snow moon', 'moon'],
    ['Cookie', 'cookie'], ['Candle', 'candle'], ['Heart', 'heart'], ['Holly', 'leaf'],
    ['Bell spark', 'sparkle'], ['Tree crown', 'crown'],
  ]],
  kwanzaa: [C.forest, C.red, [
    ['Unity candle', 'candle'], ['Flame', 'flame'], ['Harvest sun', 'sun'], ['Shared heart', 'heart'],
    ['Table star', 'star'], ['Fruit', 'strawberry'], ['Ear of corn', 'leaf'], ['Loaf', 'loaf'],
    ['Ribbon', 'ribbon'], ['Table crown', 'crown'],
  ]],
  birthday: [C.hot, C.gold, [
    ['Cake', 'cake'], ['Candle', 'candle'], ['Balloon heart', 'heart'], ['Party bow', 'bow'],
    ['Confetti', 'sparkle'], ['Star', 'star'], ['Ribbon', 'ribbon'], ['Cupcake', 'cupcake'],
    ['Wish gem', 'gem'], ['Party crown', 'crown'],
  ]],
};

export const SEASONAL_STICKERS: StickerDef[] = SEASONAL_PACKS.flatMap((pack) => {
  const set = SETS[pack.id];
  if (!set) return [];
  const [primary, secondary, items] = set;
  return build(pack.id, [primary, secondary], items);
});
