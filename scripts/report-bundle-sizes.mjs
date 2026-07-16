import fs from "node:fs";
import path from "node:path";

const chunksDir = path.join(process.cwd(), ".next/static/chunks");

if (!fs.existsSync(chunksDir)) {
  console.error("Run `pnpm build` first.");
  process.exit(1);
}

const files = fs
  .readdirSync(chunksDir)
  .filter((file) => file.endsWith(".js"))
  .map((file) => {
    const size = fs.statSync(path.join(chunksDir, file)).size;
    return { file, kb: Math.round(size / 1024) };
  })
  .sort((a, b) => b.kb - a.kb);

const totalKb = files.reduce((sum, file) => sum + file.kb, 0);

console.log("Top 15 client chunks (KB):");
for (const entry of files.slice(0, 15)) {
  console.log(`${String(entry.kb).padStart(4)}  ${entry.file}`);
}

console.log(
  `\nTotal client chunks: ${totalKb} KB across ${files.length} files`,
);

const homeManifest = path.join(
  process.cwd(),
  ".next/server/app/[locale]/(home)/page/build-manifest.json",
);

if (fs.existsSync(homeManifest)) {
  const manifest = JSON.parse(fs.readFileSync(homeManifest, "utf8"));
  console.log("\nHome polyfill files:", manifest.polyfillFiles ?? []);
}
