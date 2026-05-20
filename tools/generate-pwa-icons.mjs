// Gera PNGs PWA (192, 512, maskable 512) a partir dos SVGs.
// Requer: npm i -D sharp
import sharp from "sharp";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd(), "public/icons");
const icon = readFileSync(resolve(root, "icon.svg"));
const maskable = readFileSync(resolve(root, "icon-maskable.svg"));

await sharp(icon).resize(192, 192).png().toFile(resolve(root, "icon-192.png"));
await sharp(icon).resize(512, 512).png().toFile(resolve(root, "icon-512.png"));
await sharp(maskable).resize(512, 512).png().toFile(resolve(root, "icon-maskable-512.png"));

console.log("PWA icons gerados em /public/icons");
