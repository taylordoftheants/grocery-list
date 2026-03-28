import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = resolve(__dirname, '../public/crest.png');

for (const size of [192, 512]) {
  await sharp(src)
    .resize(size, size, { fit: 'contain', background: { r: 26, g: 26, b: 46, alpha: 1 } })
    .png()
    .toFile(resolve(__dirname, `../public/icon-${size}.png`));
  console.log(`Generated icon-${size}.png`);
}
