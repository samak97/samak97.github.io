// Renders the app icons into public/ from favicon.svg.
// Run: bun scripts/gen-images.ts   (re-run after changing favicon.svg)
// The link-preview image (og.png) is rendered by scripts/gen-og.sh instead.
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const pub = (f: string) => fileURLToPath(new URL(`../public/${f}`, import.meta.url));

const icon = readFileSync(pub('favicon.svg'));
await sharp(icon, { density: 600 }).resize(180, 180).png().toFile(pub('apple-touch-icon.png'));
await sharp(icon, { density: 900 }).resize(512, 512).png().toFile(pub('icon-512.png'));

console.log('Wrote apple-touch-icon.png, icon-512.png');
