import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Dev utility: adds `export { generateMetadata } from "..."` to admin modal pages.
 * Not used in build/CI — run manually after adding intercepting routes:
 *   node scripts/ensure-modal-metadata.mjs
 */

const APP = join(import.meta.dirname, "..", "src/app/[locale]");

/** @type {Array<{ page: string; metadataImport: string }>} */
const MODAL_METADATA = [
  {
    page: "(admin)/admin/@modal/(.)projects/new/page.tsx",
    metadataImport: "../../../projects/new/metadata",
  },
  {
    page: "(admin)/admin/@modal/(.)projects/[id]/edit/page.tsx",
    metadataImport: "../../../../projects/[id]/edit/metadata",
  },
  {
    page: "(admin)/admin/@modal/(.)services/new/page.tsx",
    metadataImport: "../../../services/new/metadata",
  },
  {
    page: "(admin)/admin/@modal/(.)services/[id]/edit/page.tsx",
    metadataImport: "../../../../services/[id]/edit/metadata",
  },
  {
    page: "(admin)/admin/@modal/(.)certifications/new/page.tsx",
    metadataImport: "../../../certifications/new/metadata",
  },
  {
    page: "(admin)/admin/@modal/(.)certifications/[id]/edit/page.tsx",
    metadataImport: "../../../../certifications/[id]/edit/metadata",
  },
  {
    page: "(admin)/admin/@modal/(.)skills/new/page.tsx",
    metadataImport: "../../../skills/new/metadata",
  },
  {
    page: "(admin)/admin/@modal/(.)skills/[id]/edit/page.tsx",
    metadataImport: "../../../../skills/[id]/edit/metadata",
  },
  {
    page: "(admin)/admin/@modal/(.)soft-skills/new/page.tsx",
    metadataImport: "../../../soft-skills/new/metadata",
  },
  {
    page: "(admin)/admin/@modal/(.)soft-skills/[id]/edit/page.tsx",
    metadataImport: "../../../../soft-skills/[id]/edit/metadata",
  },
  {
    page: "(admin)/admin/@modal/(.)soft-skills/settings/page.tsx",
    metadataImport: "../../../soft-skills/settings/metadata",
  },
  {
    page: "(admin)/admin/@modal/(.)timeline/new/page.tsx",
    metadataImport: "../../../timeline/new/metadata",
  },
  {
    page: "(admin)/admin/@modal/(.)timeline/[id]/edit/page.tsx",
    metadataImport: "../../../../timeline/[id]/edit/metadata",
  },
  {
    page: "(admin)/admin/@modal/(.)credentials/[provider]/page.tsx",
    metadataImport: "../../../credentials/[provider]/metadata",
  },
  {
    page: "(admin)/admin/@modal/(.)job-tracker/applications/new/page.tsx",
    metadataImport: "../../../../job-tracker/applications/new/metadata",
  },
  {
    page: "(admin)/admin/@modal/(.)job-tracker/applications/[id]/edit/page.tsx",
    metadataImport:
      "../../../../../job-tracker/applications/[id]/edit/metadata",
  },
  {
    page: "(admin)/admin/@modal/(.)job-tracker/companies/new/page.tsx",
    metadataImport: "../../../../job-tracker/companies/new/metadata",
  },
  {
    page: "(admin)/admin/@modal/(.)job-tracker/companies/[id]/edit/page.tsx",
    metadataImport: "../../../../../job-tracker/companies/[id]/edit/metadata",
  },
  {
    page: "(admin)/admin/@modal/(.)job-tracker/events/new/page.tsx",
    metadataImport: "../../../../job-tracker/events/new/metadata",
  },
];

const EXPORT_LINE = (metadataImport) =>
  `export { generateMetadata } from "${metadataImport}";\n`;

let updated = 0;

for (const { page, metadataImport } of MODAL_METADATA) {
  const pagePath = join(APP, page);
  if (!existsSync(pagePath)) continue;

  const source = readFileSync(pagePath, "utf8");
  const exportLine = EXPORT_LINE(metadataImport);
  const exportPattern = /^export \{ generateMetadata \} from "[^"]+";\n/m;

  if (exportPattern.test(source)) {
    const next = source.replace(exportPattern, exportLine);
    if (next !== source) {
      writeFileSync(pagePath, next);
      updated += 1;
    }
    continue;
  }

  if (source.includes("generateMetadata")) {
    const cleaned = source
      .replace(/^export async function generateMetadata[\s\S]*?\n}\n\n/m, "")
      .replace(/^export \{ generateMetadata \} from .+\n\n/m, "");
    writeFileSync(pagePath, exportLine + cleaned);
  } else {
    writeFileSync(pagePath, exportLine + source);
  }

  updated += 1;
}

console.log(`Modal metadata re-exports: ${updated} updated.`);
