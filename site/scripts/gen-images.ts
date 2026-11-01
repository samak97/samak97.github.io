// Renders the Open Graph preview and app icons into public/.
// Run: bun scripts/gen-images.ts   (re-run after changing the title or colours)
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const pub = (f: string) => fileURLToPath(new URL(`../public/${f}`, import.meta.url));

// Deterministic "markers" for the background.
let s = 7;
const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
const dots = Array.from({ length: 420 }, () => {
  const x = 560 + rand() * 640;
  const y = rand() * 630;
  const r = rand() * 2.6 + 0.8;
  const c = ['#5eead4', '#7c9cff', '#a78bfa', '#f5b74e'][Math.floor(rand() * (rand() > 0.95 ? 4 : 3))];
  return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${c}" opacity="${(0.35 + rand() * 0.6).toFixed(2)}"/>`;
}).join('');

const og = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="glow" cx="80%" cy="20%" r="70%">
      <stop offset="0" stop-color="#5eead4" stop-opacity=".28"/>
      <stop offset="1" stop-color="#0a0c10" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow2" cx="10%" cy="100%" r="60%">
      <stop offset="0" stop-color="#a78bfa" stop-opacity=".22"/>
      <stop offset="1" stop-color="#0a0c10" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="name" x1="0" x2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#bff7ee"/>
    </linearGradient>
    <linearGradient id="fade" x1="0" x2="1">
      <stop offset="0" stop-color="#0a0c10"/>
      <stop offset=".55" stop-color="#0a0c10" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="#0a0c10"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <rect width="1200" height="630" fill="url(#glow2)"/>
  ${dots}
  <rect width="1200" height="630" fill="url(#fade)"/>
  <g font-family="Segoe UI, Arial, sans-serif">
    <text x="72" y="120" font-family="Consolas, monospace" font-size="24" fill="#8d97a8">docs / ahmed-samak / <tspan fill="#5eead4">README.md</tspan></text>
    <text x="68" y="270" font-size="112" font-weight="800" fill="url(#name)" letter-spacing="-4">Ahmed Samak</text>
    <text x="72" y="340" font-size="38" font-weight="600" fill="#e7eaf0">Senior Software Engineer &amp; Team Lead</text>
    <text x="72" y="400" font-family="Consolas, monospace" font-size="27" fill="#f5b74e">Web · 3D Graphics · Cloud · C++ · Games</text>
    <rect x="72" y="470" width="260" height="56" rx="28" fill="#5eead4"/>
    <text x="202" y="507" text-anchor="middle" font-size="24" font-weight="700" fill="#04201c">samak97.github.io</text>
  </g>
</svg>`;

await sharp(Buffer.from(og)).png({ compressionLevel: 9 }).toFile(pub('og.png'));

const icon = readFileSync(pub('favicon.svg'));
await sharp(icon, { density: 600 }).resize(180, 180).png().toFile(pub('apple-touch-icon.png'));
await sharp(icon, { density: 900 }).resize(512, 512).png().toFile(pub('icon-512.png'));

console.log('Wrote og.png, apple-touch-icon.png, icon-512.png');
