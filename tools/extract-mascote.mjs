import sharp from "sharp";
import { resolve } from "node:path";

const src = resolve(process.cwd(), "public/icons/mascote-full.png");

// Tenta detectar bordas pela cor: a "Versão Ícone" é um quadrado com fundo
// preto/cinza-escuro destacado. Pra simplificar, fazemos crops manuais
// ajustando após inspeção visual.
// Brand sheet: 1402x1122
// Coruja hero (full body): aproximadamente centro
// Versão Ícone (rosto): canto inferior direito, abaixo do título

// Coordenadas ajustadas:
const iconCrop = { left: 870, top: 760, width: 250, height: 230 };
const heroCrop = { left: 360, top: 80, width: 460, height: 900 };

await sharp(src)
  .extract(iconCrop)
  .resize(512, 512, { fit: "cover" })
  .png()
  .toFile(resolve(process.cwd(), "public/icons/mascote-icon.png"));

await sharp(src)
  .extract(heroCrop)
  .resize(600, 1150, { fit: "inside" })
  .png()
  .toFile(resolve(process.cwd(), "public/icons/mascote-hero.png"));

console.log("✔ generated");
