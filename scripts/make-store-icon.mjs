// Builds the store icon Tapsell accepts: same artwork, no cropping, just scaled
// down and encoded small enough to stay under 50 KB.
// Usage: node scripts/make-store-icon.mjs
import sharp from 'sharp';
import { writeFileSync, statSync } from 'node:fs';
import zlib from 'node:zlib';

const SRC = 'design/blockestan-icon.png';
const OUT = 'release/store/icon-512-tapsell.png';
const LIMIT = 50 * 1000;
const SIZE = 512;

/* ------------------------------ PNG encoder ------------------------------ */

const crcTable = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
}

function encodeIndexedPng(width, height, indices, palette) {
  const stride = width;
  const out = Buffer.alloc((stride + 1) * height);
  const zero = Buffer.alloc(stride);
  const cand = [Buffer.alloc(stride), Buffer.alloc(stride), Buffer.alloc(stride), Buffer.alloc(stride), Buffer.alloc(stride)];
  let prev = zero;

  for (let y = 0; y < height; y++) {
    const row = indices.subarray(y * stride, y * stride + stride);
    // candidate filters
    for (let x = 0; x < stride; x++) {
      const a = x > 0 ? row[x - 1] : 0;
      const b = prev[x];
      const c = x > 0 ? prev[x - 1] : 0;
      cand[0][x] = row[x];
      cand[1][x] = (row[x] - a) & 0xff;
      cand[2][x] = (row[x] - b) & 0xff;
      cand[3][x] = (row[x] - ((a + b) >> 1)) & 0xff;
      cand[4][x] = (row[x] - paeth(a, b, c)) & 0xff;
    }
    let best = 0;
    let bestScore = Infinity;
    for (let f = 0; f < 5; f++) {
      let score = 0;
      const c = cand[f];
      for (let x = 0; x < stride; x++) {
        const v = c[x];
        score += v < 128 ? v : 256 - v;
      }
      if (score < bestScore) {
        bestScore = score;
        best = f;
      }
    }
    out[y * (stride + 1)] = best;
    cand[best].copy(out, y * (stride + 1) + 1);
    prev = row;
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 3; // indexed colour
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const plte = Buffer.alloc(palette.length * 3);
  palette.forEach((c, i) => {
    plte[i * 3] = c[0];
    plte[i * 3 + 1] = c[1];
    plte[i * 3 + 2] = c[2];
  });

  const idat = zlib.deflateSync(out, { level: 9, memLevel: 9 });

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('PLTE', plte),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* --------------------------- Colour quantizer ---------------------------- */

function quantize(rgba, width, height, maxColours) {
  const counts = new Map();
  const pixels = width * height;
  for (let i = 0; i < pixels; i++) {
    const o = i * 4;
    const key = (rgba[o] << 16) | (rgba[o + 1] << 8) | rgba[o + 2];
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  let colors = [...counts.entries()].map(([key, count]) => [
    (key >> 16) & 0xff,
    (key >> 8) & 0xff,
    key & 0xff,
    count,
  ]);

  let boxes = [colors];
  while (boxes.length < maxColours) {
    let target = -1;
    let targetRange = -1;
    let targetChannel = 0;
    boxes.forEach((box, bi) => {
      if (box.length < 2) return;
      for (let ch = 0; ch < 3; ch++) {
        let min = 255;
        let max = 0;
        for (const c of box) {
          if (c[ch] < min) min = c[ch];
          if (c[ch] > max) max = c[ch];
        }
        const range = max - min;
        if (range > targetRange) {
          targetRange = range;
          target = bi;
          targetChannel = ch;
        }
      }
    });
    if (target === -1) break;

    const box = boxes[target].slice().sort((a, b) => a[targetChannel] - b[targetChannel]);
    const total = box.reduce((s, c) => s + c[3], 0);
    let acc = 0;
    let split = 1;
    for (let i = 0; i < box.length - 1; i++) {
      acc += box[i][3];
      if (acc >= total / 2) {
        split = i + 1;
        break;
      }
    }
    boxes.splice(target, 1, box.slice(0, split), box.slice(split));
  }

  const palette = boxes.map((box) => {
    let r = 0;
    let g = 0;
    let b = 0;
    let n = 0;
    for (const c of box) {
      r += c[0] * c[3];
      g += c[1] * c[3];
      b += c[2] * c[3];
      n += c[3];
    }
    return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
  });

  const cache = new Map();
  const indices = Buffer.alloc(pixels);
  for (let i = 0; i < pixels; i++) {
    const o = i * 4;
    const key = (rgba[o] << 16) | (rgba[o + 1] << 8) | rgba[o + 2];
    let idx = cache.get(key);
    if (idx === undefined) {
      let bestDist = Infinity;
      idx = 0;
      for (let p = 0; p < palette.length; p++) {
        const dr = rgba[o] - palette[p][0];
        const dg = rgba[o + 1] - palette[p][1];
        const db = rgba[o + 2] - palette[p][2];
        const d = dr * dr + dg * dg + db * db;
        if (d < bestDist) {
          bestDist = d;
          idx = p;
        }
      }
      cache.set(key, idx);
    }
    indices[i] = idx;
  }

  return { palette, indices };
}

/* --------------------------------- Build --------------------------------- */

// Full artwork, aspect ratio preserved (fit: fill keeps the square square),
// a whisper of smoothing so the palette compresses well at store size.
const attempts = [
  { colours: 256, blur: 0.3 },
  { colours: 256, blur: 0.6 },
  { colours: 192, blur: 0.6 },
  { colours: 160, blur: 0.8 },
  { colours: 128, blur: 0.8 },
  { colours: 96, blur: 1.0 },
  { colours: 64, blur: 1.0 },
];

let saved = false;
for (const a of attempts) {
  let img = sharp(SRC).resize(SIZE, SIZE, { fit: 'fill' });
  if (a.blur > 0) img = img.blur(a.blur);
  const { data } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  const { palette, indices } = quantize(data, SIZE, SIZE, a.colours);
  const png = encodeIndexedPng(SIZE, SIZE, indices, palette);
  if (png.length <= LIMIT) {
    writeFileSync(OUT, png);
    console.log(
      `Saved ${OUT} — ${SIZE}x${SIZE}, ${a.colours} colours, ${(png.length / 1024).toFixed(1)} KB`
    );
    saved = true;
    break;
  }
  console.log(`too big: ${a.colours} colours / blur ${a.blur} → ${(png.length / 1024).toFixed(1)} KB`);
}

if (!saved) {
  console.error('No attempt fit under 50 KB.');
  process.exit(1);
}
