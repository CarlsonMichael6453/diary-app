import { addDays, parseKey, todayKey } from './dates';

/**
 * Seasonal packs are for sale from about two and a half weeks before a holiday
 * through a week after it. Moving dates use computus or a lookup through the 2030s.
 * Lunar New Year, Diwali, and Hanukkah dates follow published calendars
 * (Hong Kong Observatory / Wikipedia, Drik Panchang, Hebcal).
 */

export const SEASON_LEAD_DAYS = 18;
export const SEASON_LAG_DAYS = 7;

export type Birthday = { month: number; day: number };

export type SeasonSlot = {
  packId: string;
  start: string;
  end: string;
  days: number;
};

type Span = { start: string; end: string };

type Rule = {
  packId: string;
  lead: number;
  lag: number;
  span: (year: number, birthday: Birthday | null) => Span | null;
};

const LUNAR_NEW_YEAR: Record<number, string> = {
  2024: '2024-02-10',
  2025: '2025-01-29',
  2026: '2026-02-17',
  2027: '2027-02-06',
  2028: '2028-01-26',
  2029: '2029-02-13',
  2030: '2030-02-03',
  2031: '2031-01-23',
  2032: '2032-02-11',
  2033: '2033-01-31',
  2034: '2034-02-19',
  2035: '2035-02-08',
  2036: '2036-01-28',
  2037: '2037-02-15',
};

const DIWALI: Record<number, string> = {
  2024: '2024-11-01',
  2025: '2025-10-20',
  2026: '2026-11-08',
  2027: '2027-10-29',
  2028: '2028-10-17',
  2029: '2029-11-05',
  2030: '2030-10-26',
  2031: '2031-11-14',
  2032: '2032-11-02',
  2033: '2033-10-22',
  2034: '2034-11-10',
  2035: '2035-10-30',
  2036: '2036-10-19',
};

/** First candle, evening of this civil date. */
const HANUKKAH: Record<number, string> = {
  2024: '2024-12-25',
  2025: '2025-12-14',
  2026: '2026-12-04',
  2027: '2027-12-24',
  2028: '2028-12-12',
  2029: '2029-12-01',
  2030: '2030-12-20',
  2031: '2031-12-09',
  2032: '2032-11-27',
  2033: '2033-12-16',
  2034: '2034-12-06',
  2035: '2035-12-25',
  2036: '2036-12-13',
};

function key(year: number, month: number, day: number): string {
  return todayKey(new Date(year, month - 1, day));
}

function fixed(month: number, day: number, extra = 0) {
  return (year: number) => {
    const start = key(year, month, day);
    return { start, end: addDays(start, extra) };
  };
}

function range(startMonth: number, startDay: number, endMonth: number, endDay: number) {
  return (year: number) => {
    const start = key(year, startMonth, startDay);
    let end = key(year, endMonth, endDay);
    if (end < start) end = key(year + 1, endMonth, endDay);
    return { start, end };
  };
}

function nthWeekday(month: number, weekday: number, n: number) {
  return (year: number) => {
    const first = new Date(year, month - 1, 1);
    const delta = (weekday - first.getDay() + 7) % 7;
    const start = key(year, month, 1 + delta + (n - 1) * 7);
    return { start, end: start };
  };
}

function lookup(table: Record<number, string>, extra = 0) {
  return (year: number) => {
    const start = table[year];
    if (!start) return null;
    return { start, end: addDays(start, extra) };
  };
}

/** Anonymous Gregorian computus. Month is 3 or 4. */
export function easterSunday(year: number): string {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return key(year, month, day);
}

function birthdayWeek(year: number, birthday: Birthday | null): Span | null {
  if (!birthday) return null;
  const dim = new Date(year, birthday.month, 0).getDate();
  const day = Math.min(birthday.day, dim);
  const date = new Date(year, birthday.month - 1, day);
  const startDate = new Date(year, birthday.month - 1, day - date.getDay());
  const endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 6);
  return { start: todayKey(startDate), end: todayKey(endDate) };
}

const RULES: Rule[] = [
  { packId: 'new-year', lead: SEASON_LEAD_DAYS, lag: SEASON_LAG_DAYS, span: fixed(1, 1) },
  { packId: 'lunar-new-year', lead: SEASON_LEAD_DAYS, lag: SEASON_LAG_DAYS, span: lookup(LUNAR_NEW_YEAR, 14) },
  { packId: 'valentines', lead: SEASON_LEAD_DAYS, lag: SEASON_LAG_DAYS, span: fixed(2, 14) },
  { packId: 'st-patricks', lead: SEASON_LEAD_DAYS, lag: SEASON_LAG_DAYS, span: fixed(3, 17) },
  { packId: 'easter', lead: SEASON_LEAD_DAYS, lag: SEASON_LAG_DAYS, span: (year) => ({ start: easterSunday(year), end: easterSunday(year) }) },
  { packId: 'mothers-day', lead: SEASON_LEAD_DAYS, lag: SEASON_LAG_DAYS, span: nthWeekday(5, 0, 2) },
  { packId: 'fathers-day', lead: SEASON_LEAD_DAYS, lag: SEASON_LAG_DAYS, span: nthWeekday(6, 0, 3) },
  { packId: 'pride', lead: 21, lag: SEASON_LAG_DAYS, span: range(6, 1, 6, 30) },
  { packId: 'fourth-july', lead: SEASON_LEAD_DAYS, lag: SEASON_LAG_DAYS, span: fixed(7, 4) },
  { packId: 'summer', lead: 14, lag: SEASON_LAG_DAYS, span: range(6, 20, 8, 16) },
  { packId: 'back-to-school', lead: 14, lag: SEASON_LAG_DAYS, span: range(8, 15, 9, 8) },
  { packId: 'halloween', lead: SEASON_LEAD_DAYS, lag: SEASON_LAG_DAYS, span: fixed(10, 31) },
  { packId: 'dia-de-muertos', lead: SEASON_LEAD_DAYS, lag: SEASON_LAG_DAYS, span: fixed(11, 1, 1) },
  { packId: 'thanksgiving', lead: SEASON_LEAD_DAYS, lag: SEASON_LAG_DAYS, span: nthWeekday(11, 4, 4) },
  { packId: 'hanukkah', lead: SEASON_LEAD_DAYS, lag: SEASON_LAG_DAYS, span: lookup(HANUKKAH, 7) },
  { packId: 'diwali', lead: SEASON_LEAD_DAYS, lag: SEASON_LAG_DAYS, span: lookup(DIWALI, 4) },
  { packId: 'christmas', lead: SEASON_LEAD_DAYS, lag: SEASON_LAG_DAYS, span: fixed(12, 25) },
  { packId: 'kwanzaa', lead: SEASON_LEAD_DAYS, lag: SEASON_LAG_DAYS, span: range(12, 26, 1, 1) },
  { packId: 'birthday', lead: 0, lag: 0, span: birthdayWeek },
];

const SEASON_IDS = new Set(RULES.map((rule) => rule.packId));

export function isSeasonalPack(packId: string): boolean {
  return SEASON_IDS.has(packId);
}

export function isDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return todayKey(parseKey(value)) === value;
}

/** Shop clock. A debug date previews the seasonal case without moving diary pages. */
export function shopToday(debugDate: string | null | undefined, now = new Date()): string {
  if (debugDate && isDateKey(debugDate)) return debugDate;
  return todayKey(now);
}

export function birthdayFrom(month: number | null | undefined, day: number | null | undefined): Birthday | null {
  if (month == null || day == null) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const dim = new Date(2028, month, 0).getDate();
  if (day > dim) return null;
  return { month, day };
}

export function diffDays(from: string, to: string): number {
  if (from === to) return 0;
  if (from > to) return -diffDays(to, from);
  let days = 0;
  let cursor = from;
  while (cursor < to) {
    cursor = addDays(cursor, 1);
    days += 1;
  }
  return days;
}

export function holidaySpan(packId: string, year: number, birthday: Birthday | null = null): Span | null {
  const rule = RULES.find((item) => item.packId === packId);
  if (!rule) return null;
  return rule.span(year, birthday);
}

export function shopWindow(packId: string, year: number, birthday: Birthday | null = null): Span | null {
  const rule = RULES.find((item) => item.packId === packId);
  if (!rule) return null;
  const span = rule.span(year, birthday);
  if (!span) return null;
  return { start: addDays(span.start, -rule.lead), end: addDays(span.end, rule.lag) };
}

function yearsAround(today: string): number[] {
  const year = Number(today.slice(0, 4));
  return [year - 1, year, year + 1, year + 2];
}

function openWindow(rule: Rule, today: string, birthday: Birthday | null): Span | null {
  for (const year of yearsAround(today)) {
    const span = rule.span(year, birthday);
    if (!span) continue;
    const start = addDays(span.start, -rule.lead);
    const end = addDays(span.end, rule.lag);
    if (today >= start && today <= end) return { start, end };
  }
  return null;
}

function nextWindow(rule: Rule, today: string, birthday: Birthday | null): Span | null {
  let best: Span | null = null;
  for (const year of yearsAround(today)) {
    const span = rule.span(year, birthday);
    if (!span) continue;
    const start = addDays(span.start, -rule.lead);
    const end = addDays(span.end, rule.lag);
    if (start <= today) continue;
    if (!best || start < best.start) best = { start, end };
  }
  return best;
}

export function openSeasons(today: string, birthday: Birthday | null = null): SeasonSlot[] {
  const slots: SeasonSlot[] = [];
  for (const rule of RULES) {
    const window = openWindow(rule, today, birthday);
    if (!window) continue;
    slots.push({ packId: rule.packId, start: window.start, end: window.end, days: diffDays(today, window.end) });
  }
  return slots.sort((a, b) => a.days - b.days || a.packId.localeCompare(b.packId));
}

export function upcomingSeasons(today: string, birthday: Birthday | null = null, limit = 4): SeasonSlot[] {
  const openIds = new Set(openSeasons(today, birthday).map((slot) => slot.packId));
  const slots: SeasonSlot[] = [];
  for (const rule of RULES) {
    if (openIds.has(rule.packId)) continue;
    const window = nextWindow(rule, today, birthday);
    if (!window) continue;
    slots.push({ packId: rule.packId, start: window.start, end: window.end, days: diffDays(today, window.start) });
  }
  return slots.sort((a, b) => a.start.localeCompare(b.start) || a.packId.localeCompare(b.packId)).slice(0, limit);
}

export function packOnSale(packId: string, today: string, birthday: Birthday | null = null): boolean {
  return openSeasons(today, birthday).some((slot) => slot.packId === packId);
}

/** Packs whose shop window opened in the last three days and have not been announced. */
export function seasonArrivals(today: string, birthday: Birthday | null, announced: string[]): { packId: string; key: string }[] {
  return openSeasons(today, birthday)
    .filter((slot) => diffDays(slot.start, today) <= 2)
    .map((slot) => ({ packId: slot.packId, key: `${slot.packId}:${slot.start}` }))
    .filter((item) => !announced.includes(item.key));
}

export function leavingLabel(days: number): string {
  if (days <= 0) return 'Leaves today';
  if (days === 1) return 'Leaving in 1 day';
  return `Leaving in ${days} days`;
}

export function arrivingLabel(days: number): string {
  if (days <= 0) return 'Arrives today';
  if (days === 1) return 'Arrives in 1 day';
  return `Arrives in ${days} days`;
}
