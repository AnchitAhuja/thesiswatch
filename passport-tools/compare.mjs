import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const a = readFileSync(new URL('./results/a.mp4', import.meta.url));
const b = readFileSync(new URL('./results/b.mp4', import.meta.url));
function normalize(buffer, start = 0, end = buffer.length) {
  for (let pos = start; pos + 8 <= end;) {
    const size = buffer.readUInt32BE(pos);
    const type = buffer.toString('ascii', pos + 4, pos + 8);
    if (size < 8 || pos + size > end) throw new Error('Invalid MP4 box');
    if (['moov', 'trak', 'mdia'].includes(type)) normalize(buffer, pos + 8, pos + size);
    if (['mvhd', 'tkhd', 'mdhd'].includes(type)) {
      const n = buffer[pos + 8] === 1 ? 16 : 8;
      buffer.fill(0, pos + 12, pos + 12 + n);
    }
    pos += size;
  }
}
normalize(a);
normalize(b);
console.log('Bit-identical after ignoring only MP4 saved-time fields:', a.equals(b));
const result = { identicalExceptSavedTime: a.equals(b), normalizedShaA: createHash('sha256').update(a).digest('hex'), normalizedShaB: createHash('sha256').update(b).digest('hex') };
writeFileSync(new URL('./results/byte-comparison.json', import.meta.url), JSON.stringify(result, null, 2));
if (!a.equals(b)) process.exitCode = 1;
