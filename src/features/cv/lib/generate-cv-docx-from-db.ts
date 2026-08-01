import type { PrismaClient } from "@prisma/client";

import type { Locale } from "@/i18n/config";
import { createLocalizedFieldResolver } from "@/lib/i18n/localized-display";
import { loadCvStructuredDraft } from "@/features/cv/lib/load-cv-structured-draft";
import { loadCvTemplateForTailor } from "@/features/cv/lib/load-cv-template-docx";
import { mapDraftToTemplateSections } from "@/features/cv/lib/map-draft-to-template-sections";
import { rebuildDocx } from "@/lib/docx/rebuilder";

export async function generateCvDocxFromDb(
  db: PrismaClient,
  userId: string,
  locale: Locale,
  fallbackLocale: Locale,
): Promise<{ buffer: Buffer; fileName: string } | null> {
  const [appLanguages, draft, template, softSkills] = await Promise.all([
    db.appLanguage.findMany({ orderBy: { code: "asc" } }),
    loadCvStructuredDraft(db, userId, { locale, fallbackLocale }),
    loadCvTemplateForTailor(),
    db.cvSoftSkill.findMany({
      where: { userId },
      include: { translations: true },
      orderBy: { order: "asc" },
    }),
  ]);

  if (!draft) return null;

  const field = createLocalizedFieldResolver(appLanguages, locale);
  const softSkillTexts = softSkills
    .map((skill) => field(skill.translations, "name"))
    .filter((text: string) => text.trim().length > 0);

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
  const fileName = `CV_${sanitizedName}_${locale}.docx`;

  return { buffer, fileName };
}
