// Gera /public/icons/apple-touch-icon.png a partir de app-icon.png.
// Tudo que NÃO é preto (logo) vira verde Atlas sólido — sem gradientes, sem halo.
// iOS arredonda os cantos sozinho, então o ícone é um quadrado full bleed.

import sharp from "sharp";
import { resolve } from "node:path";

const src = resolve(process.cwd(), "public/icons/app-icon.png");
const out = resolve(process.cwd(), "public/icons/apple-touch-icon.png");

const GREEN = [198, 255, 0]; // #C6FF00
const BLACK_THRESHOLD = 80; // pixels com RGB médio <= 80 viram preto puro

const { data, info } = await sharp(src)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const buf = Buffer.from(data);
let logoPx = 0;
let greenPx = 0;
for (let i = 0; i < buf.length; i += 4) {
  const r = buf[i],
    g = buf[i + 1],
    b = buf[i + 2];
  const avg = (r + g + b) / 3;
  if (avg <= BLACK_THRESHOLD) {
    buf[i] = 0;
    buf[i + 1] = 0;
    buf[i + 2] = 0;
    buf[i + 3] = 255;
    logoPx++;
  } else {
    buf[i] = GREEN[0];
    buf[i + 1] = GREEN[1];
    buf[i + 2] = GREEN[2];
    buf[i + 3] = 255;
    greenPx++;
  }
}

await sharp(buf, {
  raw: { width: info.width, height: info.height, channels: 4 },
})
  .resize(512, 512, { fit: "cover" })
  .png()
  .toFile(out);

console.log(
  `✔ apple-touch-icon.png (${info.width}x${info.height} -> 512x512, logo:${logoPx}px verde:${greenPx}px)`,
);
