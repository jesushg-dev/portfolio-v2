import fs from "node:fs";
import path from "node:path";

const trace =
  process.argv[2] ??
  ".next/server/app/p/[site]/[locale]/(home)/page.js.nft.json";
const parsed = /** @type {unknown} */ (
  JSON.parse(fs.readFileSync(trace, "utf8"))
);
if (
  typeof parsed !== "object" ||
  parsed === null ||
  !("files" in parsed) ||
  !Array.isArray(parsed.files) ||
  !parsed.files.every((entry) => typeof entry === "string")
)
  throw new Error(`Invalid trace file: ${trace}`);
const files = parsed.files;
const rows = files.map((file) => {
  const absolute = path.resolve(path.dirname(trace), file);
  return { file, bytes: fs.statSync(absolute).size };
});
rows
  .sort((a, b) => b.bytes - a.bytes)
  .slice(0, 25)
  .forEach(({ file, bytes }) => {
    console.log(`${(bytes / 1048576).toFixed(2).padStart(7)} MiB  ${file}`);
  });
