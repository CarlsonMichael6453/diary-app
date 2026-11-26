import { unzipSync, strFromU8 } from 'fflate';

import { decryptWithPassphrase, encryptWithPassphrase } from './crypto';

export type BackupEntry = {
  id: string;
  date: string;
  title: string;
  body: string;
  mood?: string;
  tags?: string[];
  activities?: string[];
  bookId?: string;
  photos?: string[];
};

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function entriesToCsv(entries: BackupEntry[]): string {
  const lines = ['date,book,mood,title,tags,activities,body'];
  for (const entry of entries) {
    lines.push(
      [
        entry.date,
        entry.bookId ?? 'daily',
        entry.mood ?? '',
        entry.title,
        (entry.tags ?? []).join('|'),
        (entry.activities ?? []).join('|'),
        entry.body,
      ]
        .map((cell) => csvCell(cell))
        .join(','),
    );
  }
  return lines.join('\n');
}

export function entriesToHtml(bookTitle: string, entries: BackupEntry[]): string {
  const pages = entries
    .map(
      (entry) => `<article><h2>${escapeHtml(entry.date)} · ${escapeHtml(entry.title || 'Untitled')}</h2><p>${escapeHtml(entry.body).replace(/\n/g, '<br>')}</p></article>`,
    )
    .join('');
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(bookTitle)}</title></head><body><h1>${escapeHtml(bookTitle)}</h1>${pages}</body></html>`;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function sealBackup(json: string, passphrase: string): string {
  const sealed = encryptWithPassphrase(json, passphrase);
  return JSON.stringify({ version: 2, encrypted: true, salt: sealed.salt, rounds: sealed.rounds, payload: sealed.payload });
}

export function openSealedBackup(raw: string, passphrase: string): string {
  const parsed = JSON.parse(raw) as { encrypted?: boolean; salt?: string; payload?: string; rounds?: number };
  if (!parsed.encrypted || !parsed.salt || !parsed.payload) throw new Error('That file is not an encrypted backup.');
  // Files without `rounds` were sealed with the old 20,000-round setting.
  const rounds = typeof parsed.rounds === 'number' && Number.isInteger(parsed.rounds) && parsed.rounds > 0 && parsed.rounds <= 5_000_000 ? parsed.rounds : undefined;
  return decryptWithPassphrase(parsed.payload, parsed.salt, passphrase, rounds);
}

export function weatherUrl(latitude: number, longitude: number): string {
  const lat = latitude.toFixed(4);
  const lon = longitude.toFixed(4);
  return `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`;
}

export function weatherSummary(code: number): string {
  if (code === 0) return 'Clear';
  if (code < 4) return 'Cloudy';
  if (code < 50) return 'Fog';
  if (code < 70) return 'Rain';
  if (code < 80) return 'Snow';
  if (code < 100) return 'Showers';
  return 'Weather';
}

type Imported = { date: string; title: string; body: string; mood?: string; tags?: string[]; bookId?: string };

export function parseImport(text: string, filename = ''): { entries: Imported[]; source: string } {
  const trimmed = text.trim();
  if (!trimmed) return { entries: [], source: 'empty' };
  if (filename.toLowerCase().endsWith('.zip') || trimmed.startsWith('PK')) {
    return parseZip(text, filename);
  }
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return parseJson(trimmed);
  }
  if (/mood/i.test(trimmed.split('\n')[0] ?? '') && trimmed.includes(',')) {
    return { entries: parseDaylio(trimmed), source: 'daylio' };
  }
  return {
    source: 'text',
    entries: [{ date: new Date().toISOString().slice(0, 10), title: 'Imported note', body: trimmed, bookId: 'daily' }],
  };
}

function parseZip(text: string, filename: string): { entries: Imported[]; source: string } {
  try {
    const bytes = Uint8Array.from(text, (char) => char.charCodeAt(0) & 255);
    const files = unzipSync(bytes);
    const jsonName = Object.keys(files).find((name) => name.toLowerCase().endsWith('.json'));
    if (!jsonName) return { entries: [], source: 'zip' };
    return { ...parseJson(strFromU8(files[jsonName])), source: 'day-one' };
  } catch {
    return { entries: [], source: filename ? 'zip' : 'zip' };
  }
}

function parseJson(text: string): { entries: Imported[]; source: string } {
  const parsed = JSON.parse(text) as unknown;
  if (Array.isArray(parsed)) return { source: 'json', entries: parsed.map(asImported).filter((entry): entry is Imported => Boolean(entry)) };
  if (!parsed || typeof parsed !== 'object') return { entries: [], source: 'json' };
  const record = parsed as { entries?: unknown; version?: number };
  if (Array.isArray(record.entries)) {
    const source = record.entries.some((entry) => entry && typeof entry === 'object' && 'creationDate' in (entry as object)) ? 'day-one' : 'json';
    return { source, entries: record.entries.map(asImported).filter((entry): entry is Imported => Boolean(entry)) };
  }
  return { entries: [], source: 'json' };
}

function asImported(value: unknown): Imported | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const body = String(record.body ?? record.text ?? record.note ?? record.richText ?? '');
  const title = String(record.title ?? record.textTitle ?? 'Imported page');
  const date = String(record.date ?? record.creationDate ?? record.full_date ?? '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !body) return null;
  const tags = Array.isArray(record.tags) ? record.tags.map(String) : undefined;
  const mood = typeof record.mood === 'string' ? record.mood : undefined;
  return { date, title, body, mood, tags, bookId: 'daily' };
}

function parseDaylio(csv: string): Imported[] {
  const lines = csv.split(/\r?\n/).filter(Boolean);
  const header = lines[0].split(',').map((cell) => cell.trim().toLowerCase());
  const dateIndex = header.findIndex((cell) => cell === 'full_date' || cell === 'date');
  const moodIndex = header.findIndex((cell) => cell === 'mood');
  const noteIndex = header.findIndex((cell) => cell === 'note' || cell === 'notes');
  const activityIndex = header.findIndex((cell) => cell.includes('activit'));
  const imported: Imported[] = [];
  for (const line of lines.slice(1)) {
    const cells = splitCsv(line);
    const date = (cells[dateIndex] ?? '').slice(0, 10);
    const body = cells[noteIndex] ?? '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !body) continue;
    const activities = activityIndex >= 0 ? (cells[activityIndex] ?? '').split('|').filter(Boolean) : [];
    imported.push({
      date,
      title: 'Daylio',
      body,
      mood: mapDaylioMood(cells[moodIndex] ?? ''),
      tags: activities,
      bookId: 'daily',
    });
  }
  return imported;
}

function mapDaylioMood(mood: string): string {
  const value = mood.toLowerCase();
  if (value.includes('rad') || value.includes('good') || value.includes('great')) return 'happy';
  if (value.includes('meh') || value.includes('ok')) return 'calm';
  if (value.includes('bad') || value.includes('awful')) return 'sad';
  return 'calm';
}

function splitCsv(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else quoted = !quoted;
    } else if (char === ',' && !quoted) {
      cells.push(current);
      current = '';
    } else current += char;
  }
  cells.push(current);
  return cells;
}
