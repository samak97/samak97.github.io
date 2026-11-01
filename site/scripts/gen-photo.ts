// Crops the portrait to head-and-shoulders and writes web sizes into public/.
// Run: bun scripts/gen-photo.ts [path-to-photo]   (defaults to the photo in ../Documents)
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const src = process.argv[2] ?? fileURLToPath(new URL('../../Documents/71179663_10214900559938036_4670441905476075520_o.jpg', import.meta.url));
const pub = (f: string) => fileURLToPath(new URL(`../public/${f}`, import.meta.url));

// Square crop around the face in the 1536x1536 original.
const crop = { left: 330, top: 360, width: 800, height: 800 };

const base = sharp(src).extract(crop).modulate({ saturation: 1.05 });
await base.clone().resize(640, 640).webp({ quality: 82 }).toFile(pub('me-640.webp'));
await base.clone().resize(320, 320).webp({ quality: 82 }).toFile(pub('me-320.webp'));
// JPEG for social cards / structured data, where WebP support is patchy.
await base.clone().resize(640, 640).jpeg({ quality: 84, mozjpeg: true }).toFile(pub('me.jpg'));

console.log('Wrote me-640.webp, me-320.webp, me.jpg');
