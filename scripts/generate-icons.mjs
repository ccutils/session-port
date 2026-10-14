import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const sharp = require(process.argv[2] || 'sharp');
const source = fileURLToPath(new URL('../icons/icon.svg', import.meta.url));

for (const size of [16, 32, 48, 128]) {
  const output = fileURLToPath(new URL(`../icons/icon-${size}.png`, import.meta.url));
  await sharp(source, { density: 384 })
    .resize(size, size)
    .png()
    .toFile(output);
  console.log(`Generated icon-${size}.png`);
}
