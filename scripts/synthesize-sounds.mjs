import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SR = 22050;
const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'sounds');

function env(i, n, attack = 0.015, release = 0.08) {
  const t = i / SR;
  const dur = n / SR;
  const a = attack <= 0 ? 1 : Math.min(1, t / attack);
  const r = release <= 0 ? 1 : Math.min(1, (dur - t) / release);
  return Math.max(0, Math.min(a, r));
}

function tone(freq, dur, { slide = 0, vib = 0, partial = 0, amp = 0.45, attack = 0.012, release = 0.08 } = {}) {
  const n = Math.floor(SR * dur);
  const out = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i += 1) {
    const t = i / SR;
    const f = freq + slide * t + (vib ? Math.sin((2 * Math.PI * 7 * t)) * vib : 0);
    phase += (2 * Math.PI * f) / SR;
    const s = Math.sin(phase) + partial * Math.sin(phase * 2);
    out[i] = s * env(i, n, attack, release) * amp;
  }
  return out;
}

function silence(dur) {
  return new Float32Array(Math.floor(SR * dur));
}

function concat(parts) {
  const n = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Float32Array(n);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function noise(dur, { amp = 0.35, color = 0.85, crack = 0.015, attack = 0.008, release = 0.1 } = {}) {
  const n = Math.floor(SR * dur);
  const out = new Float32Array(n);
  let prev = 0;
  let y = 0;
  for (let i = 0; i < n; i += 1) {
    const white = Math.random() * 2 - 1;
    y = color * (y + white - prev);
    prev = white;
    const pop = Math.random() < crack ? (Math.random() * 2 - 1) : 0;
    out[i] = (y * 0.28 + pop * 0.55) * env(i, n, attack, release) * amp;
  }
  return out;
}

function normalize(samples) {
  let peak = 0;
  for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
  if (peak < 0.001) return samples;
  const gain = 0.85 / peak;
  const out = new Float32Array(samples.length);
  for (let i = 0; i < samples.length; i += 1) out[i] = samples[i] * gain;
  return out;
}

function writeWav(path, samples) {
  const data = normalize(samples);
  const dataSize = data.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SR, 24);
  buffer.writeUInt32LE(SR * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < data.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, data[i]));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, buffer);
}

const buddies = {
  mochi: concat([tone(620, 0.09, { slide: -400, amp: 0.4 }), silence(0.02), tone(380, 0.16, { slide: -80, amp: 0.32, release: 0.1 })]),
  batsy: concat([tone(1680, 0.05, { slide: 500, amp: 0.28 }), silence(0.02), tone(1420, 0.07, { slide: -700, amp: 0.26 })]),
  sprout: concat([tone(320, 0.08, { partial: 0.3, amp: 0.4 }), silence(0.03), tone(430, 0.1, { partial: 0.25, amp: 0.36 })]),
  glitter: concat([tone(880, 0.06, { amp: 0.3 }), tone(1180, 0.06, { amp: 0.28 }), tone(1560, 0.1, { amp: 0.24, release: 0.08 })]),
  prism: tone(640, 0.28, { vib: 40, partial: 0.15, amp: 0.34, release: 0.12 }),
  inky: tone(170, 0.18, { slide: -40, partial: 0.45, amp: 0.5, attack: 0.02, release: 0.06 }),
  pip: concat([tone(980, 0.06, { amp: 0.36 }), silence(0.03), tone(1240, 0.08, { amp: 0.3 })]),
  nova: concat([tone(1320, 0.05, { amp: 0.28 }), silence(0.02), tone(1760, 0.12, { slide: 80, amp: 0.22, release: 0.1 })]),
  shelly: concat([tone(520, 0.16, { partial: 0.2, amp: 0.28, release: 0.1 }), tone(780, 0.2, { amp: 0.18, attack: 0.04, release: 0.12 })]),
  ghosty: tone(360, 0.36, { vib: 12, amp: 0.22, attack: 0.08, release: 0.16 }),
  ember: concat([tone(150, 0.1, { slide: 80, partial: 0.6, amp: 0.42 }), tone(210, 0.14, { slide: -30, partial: 0.4, amp: 0.34 })]),
  lumi: concat([tone(784, 0.14, { partial: 0.15, amp: 0.3, release: 0.1 }), silence(0.02), tone(1175, 0.18, { amp: 0.22, release: 0.12 })]),
};

for (const [id, samples] of Object.entries(buddies)) {
  writeWav(join(root, 'buddies', `${id}.wav`), samples);
}

const moods = {
  happy: concat([tone(1046, 0.12, { amp: 0.22, attack: 0.005, release: 0.08 }), silence(0.02), tone(1318, 0.18, { amp: 0.2, release: 0.12 })]),
  excited: concat([tone(784, 0.08, { amp: 0.16 }), tone(988, 0.08, { amp: 0.16 }), tone(1318, 0.08, { amp: 0.18 }), tone(1568, 0.16, { amp: 0.16, release: 0.1 })]),
  calm: tone(523, 0.7, { amp: 0.12, attack: 0.12, release: 0.28, partial: 0.15 }),
  loved: concat([tone(659, 0.22, { amp: 0.18, attack: 0.02, release: 0.12 }), silence(0.03), tone(784, 0.28, { amp: 0.16, release: 0.16 })]),
  sad: concat([tone(440, 0.22, { amp: 0.14, release: 0.1 }), tone(349, 0.26, { amp: 0.12, slide: -20, release: 0.14 })]),
  angry: tone(98, 0.16, { amp: 0.28, attack: 0.004, release: 0.08, partial: 0.2 }),
  anxious: tone(880, 0.45, { amp: 0.1, vib: 28, attack: 0.02, release: 0.12 }),
  tired: tone(392, 0.7, { amp: 0.12, slide: -180, attack: 0.08, release: 0.22 }),
  grateful: concat([tone(523, 0.2, { amp: 0.16, release: 0.1 }), tone(659, 0.28, { amp: 0.14, release: 0.16 })]),
  hopeful: concat([tone(392, 0.18, { amp: 0.14 }), tone(587, 0.32, { amp: 0.16, slide: 20, release: 0.16 })]),
  fired: concat([tone(220, 0.06, { amp: 0.2, partial: 0.3 }), tone(440, 0.08, { amp: 0.18 }), tone(880, 0.14, { amp: 0.16, slide: 40, release: 0.08 })]),
};

for (const [id, samples] of Object.entries(moods)) {
  writeWav(join(root, 'moods', `${id}.wav`), samples);
}

const plus = concat([
  tone(1046, 0.11, { amp: 0.14, attack: 0.004, release: 0.07 }),
  tone(1318, 0.11, { amp: 0.14, release: 0.07 }),
  tone(1568, 0.11, { amp: 0.15, release: 0.08 }),
  tone(2093, 0.16, { amp: 0.14, partial: 0.12, release: 0.1 }),
  silence(0.03),
  tone(1568, 0.1, { amp: 0.1 }),
  tone(2093, 0.1, { amp: 0.11 }),
  tone(2637, 0.28, { amp: 0.12, partial: 0.18, release: 0.16 }),
  tone(3136, 0.34, { amp: 0.07, attack: 0.01, release: 0.22 }),
]);
writeWav(join(root, 'plus', 'celebrate.wav'), plus);

function phrase(notes, { amp = 0.08, partial = 0.4, attack = 0.01, release = 0.2, gap = 0.05 } = {}) {
  const parts = [];
  for (const [freq, dur] of notes) {
    parts.push(tone(freq, dur, { amp, partial, attack, release: Math.min(release, dur * 0.75) }));
    parts.push(silence(gap));
  }
  return concat(parts);
}

function hash(text) {
  let h = 2166136261;
  for (const char of text) h = Math.imul(h ^ char.charCodeAt(0), 16777619);
  return h >>> 0;
}

function rng(seed) {
  let state = seed || 1;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function mixAt(base, extra, offset = 0) {
  const length = Math.max(base.length, offset + extra.length);
  const out = new Float32Array(length);
  out.set(base);
  for (let i = 0; i < extra.length; i += 1) out[offset + i] += extra[i];
  return out;
}

const materials = {
  leather: concat([noise(0.55, { amp: 0.22, color: 0.94, crack: 0.004, attack: 0.04, release: 0.28 }), tone(90, 0.18, { amp: 0.08, partial: 0.2 })]),
  cloth: concat([tone(70, 0.16, { amp: 0.16, attack: 0.002, release: 0.1 }), noise(0.22, { amp: 0.08, color: 0.7, crack: 0, attack: 0.01, release: 0.12 })]),
  sparkle: phrase([[1568, 0.08], [2093, 0.1], [2637, 0.14], [3136, 0.16]], { amp: 0.05, partial: 0.7, gap: 0.02 }),
  paper: noise(0.28, { amp: 0.2, color: 0.35, crack: 0.04, attack: 0.002, release: 0.08 }),
  metal: concat([tone(1480, 0.08, { amp: 0.08, partial: 0.8, release: 0.12 }), tone(2210, 0.16, { amp: 0.05, partial: 0.4, release: 0.14 })]),
  vinyl: concat([tone(180, 0.07, { amp: 0.14, attack: 0.001, release: 0.05 }), noise(0.12, { amp: 0.06, color: 0.5, crack: 0.01, attack: 0.001, release: 0.06 })]),
  sky: noise(0.7, { amp: 0.06, color: 0.97, crack: 0, attack: 0.12, release: 0.3 }),
  lava: tone(98, 0.45, { amp: 0.1, vib: 14, slide: 30, partial: 0.3, attack: 0.04, release: 0.2 }),
};

const scales = {
  leather: [196, 220, 247, 262, 294, 330, 392],
  cloth: [262, 294, 330, 392, 440, 494, 523],
  sparkle: [784, 880, 988, 1175, 1319, 1568],
  paper: [349, 392, 440, 523, 587, 659],
  metal: [523, 587, 659, 784, 880, 1047, 1175],
  vinyl: [311, 349, 415, 466, 523, 622],
  sky: [247, 294, 349, 392, 466, 523, 587],
  lava: [220, 247, 277, 330, 370, 415, 494],
};

const styleMaterial = {
  cutesy: 'sparkle', girlypop: 'sparkle', kawaii: 'cloth', candy: 'paper', cottagecore: 'cloth',
  academia: 'leather', steampunk: 'metal', grunge: 'leather', ocean: 'sky', forest: 'cloth',
  goth: 'leather', witchy: 'sky', galaxy: 'sky', 'galaxy-drift': 'sky', minimal: 'paper',
  aurora: 'sparkle', 'sparkle-rain': 'sparkle', y2k: 'metal', retro: 'vinyl', vaporwave: 'vinyl',
  psychedelic: 'vinyl', neon: 'metal', 'neon-glow': 'metal', cyberpunk: 'metal', rainbow: 'sparkle',
  sunset: 'cloth', 'lava-lamp': 'lava',
};

for (const [id, material] of Object.entries(styleMaterial)) {
  const random = rng(hash(id));
  const scale = scales[material];
  const notes = [];
  let length = 0;
  while (length < 1.85) {
    const freq = scale[Math.floor(random() * scale.length)];
    const dur = 0.16 + random() * 0.2;
    notes.push([freq * (random() > 0.82 ? 2 : 1), dur]);
    length += dur + 0.045;
  }
  const tune = phrase(notes, { amp: 0.065, partial: material === 'sparkle' || material === 'metal' ? 0.55 : 0.28, gap: 0.045 });
  writeWav(join(root, 'open', `${id}.wav`), mixAt(tune, materials[material], Math.floor(SR * 0.05)));
}

console.log(`wrote ${Object.keys(buddies).length} buddy sounds, ${Object.keys(moods).length} mood sounds, the Plus chime, and ${Object.keys(styleMaterial).length} book-opening clips`);
