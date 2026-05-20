import { put } from "@vercel/blob";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

// Upload um arquivo e retorna a URL pública pra salvar no banco.
//   - Em produção/Vercel: usa Vercel Blob (BLOB_READ_WRITE_TOKEN configurado).
//   - Em dev local: salva em /public/uploads e serve via /uploads/...
export async function uploadFile({
  file,
  prefix,
}: {
  file: File;
  prefix: string;
}): Promise<{ url: string }> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `${prefix}/${Date.now()}-${safeName}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(key, file, {
      access: "public",
      contentType: file.type,
    });
    return { url: blob.url };
  }

  // Fallback dev: filesystem (não funciona em Vercel, mas ok pra `npm run dev`)
  const relPath = `/uploads/${key}`;
  const absPath = path.join(process.cwd(), "public", relPath);
  await mkdir(path.dirname(absPath), { recursive: true });
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(absPath, buf);
  return { url: relPath };
}
