import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const publicFile = (name) => new URL(`../public/${name}`, import.meta.url);
const svg = await readFile(publicFile("favicon.svg"), "utf8");
const squareSvg = svg.replace('rx="14"', 'rx="0"');
// Keep all artwork inside the central safe area used by maskable app icons.
const maskableSvg = squareSvg
  .replace("<path", '<g transform="translate(6.4 6.4) scale(.8)"><path')
  .replace("</svg>", "</g></svg>");

for (const size of [192, 256, 384, 512]) {
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(fileURLToPath(publicFile(`icon-${size}x${size}.png`)));
}

await sharp(Buffer.from(squareSvg))
  .resize(180, 180)
  .png()
  .toFile(fileURLToPath(publicFile("apple-touch-icon.png")));
await sharp(Buffer.from(maskableSvg))
  .resize(512, 512)
  .png()
  .toFile(fileURLToPath(publicFile("icon-512x512-maskable.png")));

const sizes = [16, 32, 48];
const images = await Promise.all(
  sizes.map((size) =>
    sharp(Buffer.from(svg)).resize(size, size).png().toBuffer(),
  ),
);
const header = Buffer.alloc(6 + sizes.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;

images.forEach((image, index) => {
  const entry = 6 + index * 16;
  header.writeUInt8(sizes[index], entry);
  header.writeUInt8(sizes[index], entry + 1);
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(image.length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += image.length;
});

await writeFile(publicFile("favicon.ico"), Buffer.concat([header, ...images]));
console.log("Generated JH favicon, Apple touch icon, and PWA icons.");
