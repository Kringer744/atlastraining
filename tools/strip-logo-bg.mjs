// Remove o fundo preto do logo-mark.png deixando-o transparente.
// Uso: node tools/strip-logo-bg.mjs

import sharp from "sharp";
import { resolve } from "node:path";

const input = resolve(process.cwd(), "public/icons/logo-mark.png");
const output = input; // sobrescreve

const { data, info } = await sharp(input)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const threshold = 35; // pixels com RGB <= 35 viram transparentes
let stripped = 0;
const buf = Buffer.from(data);
for (let i = 0; i < buf.length; i += 4) {
  const r = buf[i], g = buf[i + 1], b = buf[i + 2];
  if (r <= threshold && g <= threshold && b <= threshold) {
    buf[i + 3] = 0;
    stripped++;
  }
}

await sharp(buf, { raw: { width: info.width, height: info.height, channels: 4 } })
  .png()
  .toFile(output + ".tmp");

await sharp(output + ".tmp").toFile(output);
const fs = await import("node:fs/promises");
await fs.unlink(output + ".tmp");

console.log(`✔ ${input}: ${stripped} px transparentes (${info.width}x${info.height})`);
