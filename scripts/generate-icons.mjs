import { createCanvas } from 'canvas';
import { writeFileSync, mkdirSync } from 'fs';

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#0f172a');
  gradient.addColorStop(1, '#1e293b');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Rounded rect mask
  ctx.beginPath();
  const radius = size * 0.125;
  ctx.roundRect(0, 0, size, size, radius);
  ctx.clip();

  // Dollar sign
  ctx.fillStyle = '#e2e8f0';
  ctx.font = `bold ${size * 0.4}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('$', size / 2, size / 2 + size * 0.08);

  // PI label
  ctx.font = `${size * 0.07}px system-ui, sans-serif`;
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('PI', size / 2, size * 0.78);

  return canvas.toBuffer('image/png');
}

const sizes = [192, 512];
mkdirSync('public', { recursive: true });

for (const size of sizes) {
  const buffer = generateIcon(size);
  writeFileSync(`public/icon-${size}.png`, buffer);
  console.log(`Generated public/icon-${size}.png`);
}