/** Run before deploying the sections-only project model. Dry-run unless --apply is provided. */
import "../lib/seed-env";
import { PrismaClient, type Prisma } from "@prisma/client";
import { z } from "zod";

import { migrateProjectCaseStudy } from "../lib/project-case-study-migration";

const retiredFields = ["hook", "challenge", "approach", "outcome"] as const;
const snapshotFields = [...retiredFields, "caseStudy"] as const;
const documentSchema = z.object({
  _id: z.object({ $oid: z.string() }),
  appLanguageId: z.object({ $oid: z.string() }),
  hook: z.string().nullable().optional(),
  challenge: z.string().nullable().optional(),
  approach: z.string().nullable().optional(),
  outcome: z.string().nullable().optional(),
  caseStudy: z.json().optional(),
});

const prisma = new PrismaClient();

async function migrate(): Promise<void> {
  const apply = process.argv.includes("--apply");
  const languages = await prisma.appLanguage.findMany({
    select: { id: true, code: true },
  });
  const localeById = new Map(
    languages.map((language) => [language.id, language.code]),
  );
  const raw = await prisma.projectTranslation.findRaw({
    filter: {
      $or: [
        ...retiredFields.map((field) => ({ [field]: { $exists: true } })),
        { "caseStudy.constraints": { $exists: true } },
        { "caseStudy.stack": { $exists: true } },
      ],
    },
  });
  const documents = z.array(documentSchema).parse(raw);
  // Validate every conversion before applying any updates.
  const planned = documents.map((document) => {
    const locale = localeById.get(document.appLanguageId.$oid);
    if (!locale)
      throw new Error(`Missing language for translation ${document._id.$oid}`);
    return { document, caseStudy: migrateProjectCaseStudy(document, locale) };
  });
  console.log(
    `[project-case-studies] ${planned.length} translations ready; mode=${apply ? "apply" : "dry-run"}`,
  );
  if (!apply) return;

  for (const { document, caseStudy } of planned) {
    const query: Record<string, Prisma.InputJsonValue | null> = {
      _id: document._id,
    };
    for (const field of snapshotFields) {
      query[field] =
        document[field] === undefined ? { $exists: false } : document[field];
    }
    const unset: Record<string, string> = Object.fromEntries(
      retiredFields.map((field) => [field, ""]),
    );
    if (!caseStudy) unset.caseStudy = "";
    const result = await prisma.$runCommandRaw({
      update: "ProjectTranslation",
      updates: [
        {
          q: query,
          u: { ...(caseStudy ? { $set: { caseStudy } } : {}), $unset: unset },
        },
      ],
    });
    const written = z
      .object({ n: z.number(), writeErrors: z.array(z.unknown()).optional() })
      .parse(result);
    if (written.n !== 1 || written.writeErrors?.length) {
      throw new Error(
        `Update failed or translation changed concurrently: ${document._id.$oid}; rerun the dry-run.`,
      );
    }
  }
  console.log(`[project-case-studies] migrated ${planned.length} translations`);
}

migrate()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
