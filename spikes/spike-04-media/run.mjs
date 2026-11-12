// THROWAWAY SPIKE-04 (local half): sharp derivatives, dominant colour, palette, timing/memory for a ~20 MB image.
import sharp from 'sharp';
import fs from 'node:fs';
const out = {};
sharp.concurrency(1); // closer to a 1-vCPU serverless function
// 1) synthetic high-entropy source (~20 MB PNG): 4800x3600 random noise + gradients
const W = 4800, H = 3600;
if (!fs.existsSync('source.png')) {
  const buf = Buffer.alloc(W * H * 3);
  let s = 7; for (let i = 0; i < buf.length; i += 3) { s = (s * 1103515245 + 12345) & 0x7fffffff; const x = (i / 3) % W, y = Math.floor(i / 3 / W);
    buf[i] = (x * 255 / W + (s & 63)) & 255; buf[i + 1] = (y * 255 / H + ((s >> 6) & 63)) & 255; buf[i + 2] = (128 + ((s >> 12) & 127)) & 255; }
  await sharp(buf, { raw: { width: W, height: H, channels: 3 } }).png({ compressionLevel: 1 }).toFile('source.png');
}
out.source_bytes = fs.statSync('source.png').size;
const input = fs.readFileSync('source.png');
const rss0 = process.memoryUsage().rss;
let peak = rss0; const iv = setInterval(() => { peak = Math.max(peak, process.memoryUsage().rss); }, 5);
const t0 = performance.now();
const meta = await sharp(input).metadata();
out.meta = { width: meta.width, height: meta.height, format: meta.format };
// 2) derivatives: 4:3 centre crops as WebP at the feed widths + a large detail size
fs.mkdirSync('derivatives', { recursive: true });
const widths = [400, 800, 1200];
const base = sharp(input, { limitInputPixels: 50_000_000 }).rotate();
const results = [];
for (const w of widths) {
  const info = await base.clone().resize(w, Math.round(w * 3 / 4), { fit: 'cover', position: 'centre' }).webp({ quality: 80 }).toFile(`derivatives/feed-${w}.webp`);
  results.push({ name: `feed-${w}.webp`, bytes: info.size });
}
const detail = await base.clone().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 82 }).toFile('derivatives/detail-1600.webp');
results.push({ name: 'detail-1600.webp', bytes: detail.size });
out.derivatives = results;
// 3) dominant colour + 7-colour palette (small k-means on a 64x64 thumbnail)
const stats = await sharp(input).stats();
out.dominant = '#' + [stats.dominant.r, stats.dominant.g, stats.dominant.b].map((v) => v.toString(16).padStart(2, '0')).join('');
const { data } = await sharp(input).resize(64, 64, { fit: 'cover' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const px = []; for (let i = 0; i < data.length; i += 3) px.push([data[i], data[i + 1], data[i + 2]]);
let cent = Array.from({ length: 7 }, (_, k) => px[Math.floor(k * px.length / 7)]);
for (let it = 0; it < 10; it++) {
  const acc = cent.map(() => [0, 0, 0, 0]);
  for (const p of px) { let b = 0, bd = Infinity; cent.forEach((c, k) => { const d = (c[0] - p[0]) ** 2 + (c[1] - p[1]) ** 2 + (c[2] - p[2]) ** 2; if (d < bd) { bd = d; b = k; } }); acc[b][0] += p[0]; acc[b][1] += p[1]; acc[b][2] += p[2]; acc[b][3]++; }
  cent = acc.map((a, k) => a[3] ? [a[0] / a[3], a[1] / a[3], a[2] / a[3]] : cent[k]);
}
out.palette = cent.map((c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join(''));
out.total_ms = Math.round(performance.now() - t0);
clearInterval(iv);
out.rss_start_mb = Math.round(rss0 / 1048576); out.rss_peak_mb = Math.round(peak / 1048576);
// 4) rejection of non-images / oversized dimensions
try { await sharp(Buffer.from('not an image')).metadata(); out.non_image = 'accepted'; } catch (e) { out.non_image = 'rejected: ' + e.message.slice(0, 60); }
try { await sharp(input, { limitInputPixels: 10_000_000 }).metadata().then(() => sharp(input, { limitInputPixels: 10_000_000 }).toBuffer()); out.pixel_limit = 'not enforced'; } catch (e) { out.pixel_limit = 'enforced: ' + e.message.slice(0, 70); }
console.log(JSON.stringify(out, null, 2));
