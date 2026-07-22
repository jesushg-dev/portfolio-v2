import "server-only";

import type { PrismaClient } from "@prisma/client";

import type { Locale } from "@/i18n/config";
import { rebuildDocx } from "@/lib/docx/rebuilder";
import { getLocalizedText } from "@/lib/i18n/localized";
import { mapDraftToTemplateSections } from "./map-draft-to-template-sections";
import { loadCvStructuredDraft } from "./load-cv-structured-draft";
import { loadCvTemplateForTailor } from "./load-cv-template-docx";

export async function generateCvDocxFromDb(
  db: PrismaClient,
  userId: string,
  locale: Locale,
  fallbackLocale: Locale,
): Promise<{ buffer: Buffer; fileName: string } | null> {
  const [draft, template, softSkills] = await Promise.all([
    loadCvStructuredDraft(db, userId, { locale, fallbackLocale }),
    loadCvTemplateForTailor(),
    db.cvSoftSkill.findMany({
      where: { userId },
      orderBy: { order: "asc" },
    }),
  ]);

  if (!draft) return null;

  const softSkillTexts = softSkills
    .map((skill) => getLocalizedText(skill.name, locale, fallbackLocale))
    .filter((text) => text.trim().length > 0);

  const adaptedSections = mapDraftToTemplateSections(
    template.parsed.sections,
    draft,
    softSkillTexts,
  );

  const buffer = await rebuildDocx(
    template.parsed.zipFiles,
    template.parsed.rawXml,
    template.parsed.sections,
    adaptedSections,
  );

  const sanitizedName = draft.header.fullName.replace(/[^\w.-]+/g, "_");
  return {
    buffer,
    fileName: `CV-${sanitizedName}.docx`,
  };
}
