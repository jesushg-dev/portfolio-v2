import fs from "node:fs";
import path from "node:path";

const root = ".next/server/app";
/** @type {string[]} */
const traces = fs
  .readdirSync(root, { recursive: true, encoding: "utf8" })
  .filter((file) => /(?:page|route)\.js\.nft\.json$/.test(file));
const rows = traces
  .map((file) => {
    const trace = path.join(root, file);
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
    let bytes = 0;
    const missing = [];
    for (const entry of new Set(files)) {
      try {
        bytes += fs.statSync(path.resolve(path.dirname(trace), entry)).size;
      } catch {
        missing.push(entry);
      }
    }
    return {
      route: file
        .split("\\")
        .join("/")
        .replace(/\/(page|route)\.js\.nft\.json$/, ""),
      bytes,
      files: files.length,
      cvAssets: files.filter((entry) =>
        /cv-template.*\.(docx|pdf)$/.test(entry),
      ),
      pdfjs: files.filter((entry) => /unpdf|pdfjs/i.test(entry)),
      missing,
    };
  })
  .sort((a, b) => a.route.localeCompare(b.route));

if (process.argv.includes("--check-public")) {
  const publicRows = rows.filter((row) => row.route.includes("(home)"));
  if (publicRows.length === 0) throw new Error("No public traces found");
  for (const row of publicRows) {
    if (row.cvAssets.length || row.pdfjs.length || row.missing.length) {
      throw new Error(
        `Public trace contains CV assets, PDF.js or missing files: ${row.route}`,
      );
    }
  }
  const templates = fs
    .readdirSync("src/features/resume-engine/assets")
    .filter((file) => /\.(docx|pdf)$/.test(file));
  for (const route of ["api/cv/docx", "api/cv/pdf", "api/trpc/[trpc]"]) {
    const row = rows.find((entry) => entry.route === route);
    if (
      !row ||
      templates.some(
        (file) => !row.cvAssets.some((entry) => entry.endsWith(`/${file}`)),
      )
    ) {
      throw new Error(`CV API trace is missing templates: ${route}`);
    }
  }
}

if (process.argv.includes("--json")) console.log(JSON.stringify(rows, null, 2));
else
  for (const row of rows) {
    console.log(
      `${(row.bytes / 1048576).toFixed(2).padStart(7)} MiB  ${row.route}  CV=${row.cvAssets.length} PDF.js=${row.pdfjs.length} missing=${row.missing.length}`,
    );
  }
