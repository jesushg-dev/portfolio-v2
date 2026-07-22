import type { Prisma, PrismaClient } from "@prisma/client";

import type { CvImportDraft } from "@/features/cv/lib/cv-import-draft";
import {
  buildEmptyTranslationMap,
  type TranslationMap,
} from "@/lib/i18n/translation-map";
import {
  optionalTextMapToLocalizedJson,
  textMapToLocalizedJson,
} from "@/lib/i18n/localized-text-map";

function buildImportTextMap(
  languages: { id: string; code: string }[],
  localeCode: string,
  text: string,
): TranslationMap<{ text: string }> {
  const map = buildEmptyTranslationMap(languages, { text: "" });
  const target =
    languages.find((lang) => lang.code === localeCode) ?? languages[0];
  if (target) {
    map[target.id] = { text };
  }
  return map;
}

function parseExperienceDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (/^\d{4}$/.test(trimmed)) {
    return new Date(`${trimmed}-01-01`);
  }
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export async function persistCvImportDraft(
  db: PrismaClient,
  userId: string,
  draft: CvImportDraft,
): Promise<void> {
  const languages = await db.appLanguage.findMany({ orderBy: { code: "asc" } });
  const locale = draft.detectedLocale;

  const degreeMap = draft.header.degree
    ? buildImportTextMap(languages, locale, draft.header.degree)
    : buildEmptyTranslationMap(languages, { text: "" });
  const degreeJson = textMapToLocalizedJson(degreeMap, languages);

  const heroSummaryMap = draft.header.summary
    ? buildImportTextMap(languages, locale, draft.header.summary)
    : undefined;
  const heroSummaryJson = heroSummaryMap
    ? (optionalTextMapToLocalizedJson(heroSummaryMap, languages) as
        Prisma.InputJsonValue | undefined)
    : undefined;

  await db.cvHeader.upsert({
    where: { userId },
    create: {
      userId,
      fullName: draft.header.fullName,
      degree: degreeJson as Prisma.InputJsonValue,
      heroSummary: heroSummaryJson ?? undefined,
    },
    update: {
      fullName: draft.header.fullName,
      degree: degreeJson as Prisma.InputJsonValue,
      ...(heroSummaryJson ? { heroSummary: heroSummaryJson } : {}),
    },
  });

  if (draft.header.summary) {
    const aboutMap = buildImportTextMap(
      languages,
      locale,
      draft.header.summary,
    );
    const aboutJson = textMapToLocalizedJson(aboutMap, languages);
    await db.cvAboutMe.upsert({
      where: { userId },
      create: { userId, aboutMe: aboutJson as Prisma.InputJsonValue },
      update: { aboutMe: aboutJson as Prisma.InputJsonValue },
    });
  }

  const existingContacts = await db.cvContact.count({ where: { userId } });
  for (const [index, contact] of draft.contacts.entries()) {
    await db.cvContact.create({
      data: {
        userId,
        type: contact.type,
        value: contact.value,
        order: existingContacts + index,
      },
    });
  }

  const existingEducation = await db.cvEducation.count({ where: { userId } });
  for (const [index, edu] of draft.education.entries()) {
    const degreeNameMap = buildImportTextMap(languages, locale, edu.degreeName);
    const locationMap = edu.location
      ? buildImportTextMap(languages, locale, edu.location)
      : undefined;

    await db.cvEducation.create({
      data: {
        userId,
        institution: edu.institution,
        degreeName: textMapToLocalizedJson(
          degreeNameMap,
          languages,
        ) as Prisma.InputJsonValue,
        location: locationMap
          ? (optionalTextMapToLocalizedJson(
              locationMap,
              languages,
            ) as Prisma.InputJsonValue)
          : undefined,
        startYear: edu.startYear,
        endYear: edu.endYear,
        order: existingEducation + index,
      },
    });
  }

  const existingLanguages = await db.cvLanguage.count({ where: { userId } });
  for (const [index, lang] of draft.languages.entries()) {
    const nameMap = buildImportTextMap(languages, locale, lang.name);
    const levelMap = buildImportTextMap(languages, locale, lang.level);
    await db.cvLanguage.create({
      data: {
        userId,
        name: textMapToLocalizedJson(
          nameMap,
          languages,
        ) as Prisma.InputJsonValue,
        level: textMapToLocalizedJson(
          levelMap,
          languages,
        ) as Prisma.InputJsonValue,
        order: existingLanguages + index,
      },
    });
  }

  const existingSkills = await db.cvTechnicalSkill.count({ where: { userId } });
  for (const [index, skillGroup] of draft.skills.entries()) {
    await db.cvTechnicalSkill.create({
      data: {
        userId,
        category: skillGroup.category,
        items: skillGroup.items,
        order: existingSkills + index,
      },
    });
  }

  const existingExperiences = await db.cvExperience.count({
    where: { userId },
  });
  for (const [index, exp] of draft.experiences.entries()) {
    const roleMap = buildImportTextMap(languages, locale, exp.role);
    const locationMap = exp.location
      ? buildImportTextMap(languages, locale, exp.location)
      : undefined;

    const responsibilities = exp.responsibilities.map((text, respIndex) => ({
      order: respIndex,
      text: textMapToLocalizedJson(
        buildImportTextMap(languages, locale, text),
        languages,
      ) as Prisma.InputJsonValue,
    }));

    await db.cvExperience.create({
      data: {
        userId,
        company: exp.company,
        role: textMapToLocalizedJson(
          roleMap,
          languages,
        ) as Prisma.InputJsonValue,
        location: locationMap
          ? (optionalTextMapToLocalizedJson(
              locationMap,
              languages,
            ) as Prisma.InputJsonValue)
          : undefined,
        startDate: parseExperienceDate(exp.startDate),
        endDate: parseExperienceDate(exp.endDate),
        current: exp.current ?? false,
        order: existingExperiences + index,
        responsibilities: responsibilities.length
          ? { createMany: { data: responsibilities } }
          : undefined,
      },
    });
  }
}
