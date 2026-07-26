import sharp from "sharp";
import { copyFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(
  process.env.USERPROFILE || "",
  ".cursor/projects/c-Users-Maj-EJARATI/assets/icon-512.png",
);
const outDir = join(root, "public/icons");
mkdirSync(outDir, { recursive: true });
copyFileSync(src, join(outDir, "icon-512.png"));
await sharp(join(outDir, "icon-512.png")).resize(192, 192).png().toFile(join(outDir, "icon-192.png"));
await sharp(join(outDir, "icon-512.png")).resize(180, 180).png().toFile(join(outDir, "apple-touch-icon.png"));
console.log("icons ready");
