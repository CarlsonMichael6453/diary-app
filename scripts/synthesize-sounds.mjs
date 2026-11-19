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

const pages = [
  noise(0.28, { color: 0.72, crack: 0.03, amp: 0.55 }),
  noise(0.42, { color: 0.9, crack: 0.012, amp: 0.4, release: 0.16 }),
  concat([noise(0.12, { color: 0.6, crack: 0.05, amp: 0.6 }), silence(0.03), noise(0.18, { color: 0.8, crack: 0.02, amp: 0.35 })]),
  noise(0.22, { color: 0.5, crack: 0.04, amp: 0.5, attack: 0.004, release: 0.05 }),
  concat([noise(0.08, { color: 0.95, crack: 0.008, amp: 0.3 }), noise(0.3, { color: 0.78, crack: 0.025, amp: 0.45, attack: 0.04 })]),
  noise(0.36, { color: 0.66, crack: 0.018, amp: 0.48, attack: 0.02, release: 0.14 }),
];

for (const [id, samples] of Object.entries(buddies)) {
  writeWav(join(root, 'buddies', `${id}.wav`), samples);
}
pages.forEach((samples, index) => {
  writeWav(join(root, 'pages', `flip-${index + 1}.wav`), samples);
});

console.log(`wrote ${Object.keys(buddies).length} buddy sounds and ${pages.length} page turns`);
