import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

/**
 * Dev utility: scaffolds `metadata.ts` files for app routes from ROUTES config.
 * Not used in build/CI — run manually when adding new localized pages:
 *   node scripts/generate-page-metadata.mjs
 */

const ROOT = join(import.meta.dirname, "..");
const APP = join(ROOT, "src/app/[locale]");

/** @type {Array<{ file: string; namespace: string; titleKey?: string; descriptionKey?: string; pathname?: string; dynamic?: boolean }>} */
const ROUTES = [
  // Auth
  {
    file: "(auth)/login/metadata.ts",
    namespace: "auth.login",
    titleKey: "title",
    descriptionKey: "subtitleDefault",
    pathname: "/login",
  },
  {
    file: "(auth)/register/metadata.ts",
    namespace: "auth.register",
    titleKey: "titlePortfolio",
    descriptionKey: "descriptionPortfolio",
    pathname: "/register",
  },
  {
    file: "(auth)/forgot-password/metadata.ts",
    namespace: "auth.forgotPassword",
    titleKey: "title",
    descriptionKey: "description",
    pathname: "/forgot-password",
  },
  {
    file: "(auth)/reset-password/metadata.ts",
    namespace: "auth.resetPassword",
    titleKey: "title",
    descriptionKey: "description",
    pathname: "/reset-password",
  },
  // Portfolio
  {
    file: "(portfolio)/privacy/metadata.ts",
    namespace: "legal.privacy",
    pathname: "/privacy",
  },
  {
    file: "(home)/metadata.ts",
    namespace: "main",
    titleKey: "meta.title",
    descriptionKey: "meta.description",
    pathname: "/",
  },
  {
    file: "(home)/schedule/metadata.ts",
    namespace: "main.contact",
    titleKey: "schedulePageTitle",
    pathname: "/schedule",
  },
  {
    file: "(portfolio)/certificates/[[...slug]]/metadata.ts",
    namespace: "certification",
    titleKey: "title",
    descriptionKey: "description",
    pathname: "/certificates",
  },
  {
    file: "(admin)/admin/profile/@tabs/console/metadata.ts",
    namespace: "admin.profile",
    titleKey: "consoleTab",
    descriptionKey: "heroConsoleSubtitle",
  },
  // Admin — list pages
  {
    file: "(admin)/admin/metadata.ts",
    namespace: "admin.dashboard",
    titleKey: "title",
  },
  {
    file: "(admin)/admin/projects/metadata.ts",
    namespace: "admin.projects",
    titleKey: "title",
  },
  {
    file: "(admin)/admin/projects/new/metadata.ts",
    namespace: "admin.projects",
    titleKey: "create",
    descriptionKey: "createDescription",
  },
  {
    file: "(admin)/admin/projects/[id]/edit/metadata.ts",
    namespace: "admin.projects",
    titleKey: "edit",
    descriptionKey: "editDescription",
  },
  {
    file: "(admin)/admin/services/metadata.ts",
    namespace: "admin.services",
    titleKey: "title",
  },
  {
    file: "(admin)/admin/services/new/metadata.ts",
    namespace: "admin.services",
    titleKey: "create",
    descriptionKey: "createDescription",
  },
  {
    file: "(admin)/admin/services/[id]/edit/metadata.ts",
    namespace: "admin.services",
    titleKey: "edit",
    descriptionKey: "editDescription",
  },
  {
    file: "(admin)/admin/certifications/metadata.ts",
    namespace: "admin.certifications",
    titleKey: "title",
  },
  {
    file: "(admin)/admin/certifications/new/metadata.ts",
    namespace: "admin.certifications",
    titleKey: "create",
  },
  {
    file: "(admin)/admin/certifications/[id]/edit/metadata.ts",
    namespace: "admin.certifications",
    titleKey: "edit",
  },
  {
    file: "(admin)/admin/skills/metadata.ts",
    namespace: "admin.skills",
    titleKey: "title",
  },
  {
    file: "(admin)/admin/skills/new/metadata.ts",
    namespace: "admin.skills",
    titleKey: "create",
  },
  {
    file: "(admin)/admin/skills/[id]/edit/metadata.ts",
    namespace: "admin.skills",
    titleKey: "edit",
  },
  {
    file: "(admin)/admin/soft-skills/metadata.ts",
    namespace: "admin.softSkills",
    titleKey: "title",
  },
  {
    file: "(admin)/admin/soft-skills/new/metadata.ts",
    namespace: "admin.softSkills",
    titleKey: "addNew",
    descriptionKey: "createDescription",
  },
  {
    file: "(admin)/admin/soft-skills/[id]/edit/metadata.ts",
    namespace: "admin.softSkills",
    titleKey: "edit",
    descriptionKey: "editDescription",
  },
  {
    file: "(admin)/admin/soft-skills/settings/metadata.ts",
    namespace: "admin.softSkills",
    titleKey: "sectionSettings",
    descriptionKey: "sectionSettingsDescription",
  },
  {
    file: "(admin)/admin/timeline/metadata.ts",
    namespace: "admin.timeline",
    titleKey: "title",
  },
  {
    file: "(admin)/admin/timeline/new/metadata.ts",
    namespace: "admin.timeline",
    titleKey: "create",
  },
  {
    file: "(admin)/admin/timeline/[id]/edit/metadata.ts",
    namespace: "admin.timeline",
    titleKey: "edit",
  },
  {
    file: "(admin)/admin/cv/metadata.ts",
    namespace: "admin.cv",
    titleKey: "title",
  },
  {
    file: "(admin)/admin/settings/metadata.ts",
    namespace: "admin.settings",
    titleKey: "title",
  },
  {
    file: "(admin)/admin/spotify/metadata.ts",
    namespace: "admin.spotify",
    titleKey: "title",
  },
  {
    file: "(admin)/admin/credentials/metadata.ts",
    namespace: "adminCredentials",
    titleKey: "title",
  },
  {
    file: "(admin)/admin/credentials/[provider]/metadata.ts",
    namespace: "adminCredentials",
    titleKey: "title",
  },
  {
    file: "(admin)/admin/job-tracker/metadata.ts",
    namespace: "admin.jobTracker",
    titleKey: "title",
  },
  {
    file: "(admin)/admin/job-tracker/applications/[id]/metadata.ts",
    namespace: "admin.jobTracker",
    titleKey: "view",
    descriptionKey: "pageDescription",
  },
  {
    file: "(admin)/admin/job-tracker/applications/[id]/edit/metadata.ts",
    namespace: "admin.jobTracker",
    titleKey: "editApplication",
    descriptionKey: "editApplicationDescription",
  },
  {
    file: "(admin)/admin/job-tracker/applications/new/metadata.ts",
    namespace: "admin.jobTracker",
    titleKey: "createApplication",
    descriptionKey: "createApplicationDescription",
  },
  {
    file: "(admin)/admin/job-tracker/companies/new/metadata.ts",
    namespace: "admin.jobTracker",
    titleKey: "createCompany",
    descriptionKey: "createCompanyDescription",
  },
  {
    file: "(admin)/admin/job-tracker/companies/[id]/edit/metadata.ts",
    namespace: "admin.jobTracker",
    titleKey: "editCompany",
    descriptionKey: "editCompanyDescription",
  },
  {
    file: "(admin)/admin/job-tracker/events/new/metadata.ts",
    namespace: "admin.jobTracker",
    titleKey: "createEvent",
    descriptionKey: "createEventDescription",
  },
  {
    file: "(admin)/admin/profile/metadata.ts",
    namespace: "admin.profile",
    titleKey: "title",
  },
];

function buildMetadataFile(route) {
  const configLines = [
    `namespace: "${route.namespace}",`,
    route.titleKey ? `titleKey: "${route.titleKey}",` : null,
    route.descriptionKey ? `descriptionKey: "${route.descriptionKey}",` : null,
    route.pathname ? `pathname: "${route.pathname}",` : null,
  ].filter(Boolean);

  return `import type { Metadata } from "next";

import { createTranslatedMetadata } from "@/lib/seo/create-translated-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  return createTranslatedMetadata(params, {
    ${configLines.join("\n    ")}
  });
}
`;
}

function ensurePageExportsMetadata(pagePath) {
  if (!existsSync(pagePath)) return;

  const source = readFileSync(pagePath, "utf8");
  if (source.includes("generateMetadata")) return;

  const exportLine = `export { generateMetadata } from "./metadata";\n`;
  writeFileSync(pagePath, exportLine + source);
}

let created = 0;
let skipped = 0;

for (const route of ROUTES) {
  const metadataPath = join(APP, route.file);
  const pagePath = metadataPath.replace(/metadata\.ts$/, "page.tsx");

  if (existsSync(metadataPath)) {
    skipped += 1;
    continue;
  }

  mkdirSync(dirname(metadataPath), { recursive: true });
  writeFileSync(metadataPath, buildMetadataFile(route));
  ensurePageExportsMetadata(pagePath);
  created += 1;
}

console.log(`Metadata: ${created} created, ${skipped} skipped.`);
