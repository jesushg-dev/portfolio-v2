import type { PrismaClient } from "@prisma/client";

import type { Locale } from "@/i18n/config";
import type { CvImportDraft } from "@/features/cv/lib/cv-import-draft";
import { getLocalizedText } from "@/lib/i18n/localized";

function formatExperienceDate(
  date: Date | null | undefined,
): string | undefined {
  if (!date) return undefined;
  return date.toISOString().slice(0, 7);
}

function resolveLocale(value: string | undefined): Locale {
  if (value === "es" || value === "nl") return value;
  return "en";
}

export interface LoadCvStructuredDraftOptions {
  locale: Locale;
  fallbackLocale?: Locale;
}

export async function loadCvStructuredDraft(
  db: PrismaClient,
  userId: string,
  options?: LoadCvStructuredDraftOptions,
): Promise<CvImportDraft | null> {
  const [header, profile, experiences, education, skills, contacts, languages] =
    await Promise.all([
      db.cvHeader.findUnique({ where: { userId } }),
      db.profile.findUnique({
        where: { userId },
        select: { defaultLocale: true },
      }),
      db.cvExperience.findMany({
        where: { userId },
        include: { responsibilities: { orderBy: { order: "asc" } } },
        orderBy: { order: "asc" },
      }),
      db.cvEducation.findMany({
        where: { userId },
        orderBy: { order: "asc" },
      }),
      db.cvTechnicalSkill.findMany({
        where: { userId },
        orderBy: { order: "asc" },
      }),
      db.cvContact.findMany({
        where: { userId },
        orderBy: { order: "asc" },
      }),
      db.cvLanguage.findMany({
        where: { userId },
        orderBy: { order: "asc" },
      }),
    ]);

  if (!header) return null;

  const profileDefaultLocale = resolveLocale(profile?.defaultLocale);
  const activeLocale = options?.locale ?? profileDefaultLocale;
  const fallbackLocale = options?.fallbackLocale ?? profileDefaultLocale;

  const summary =
    getLocalizedText(header.heroSummary, activeLocale, fallbackLocale) ||
    (await db.cvAboutMe
      .findUnique({ where: { userId } })
      .then((about) =>
        about
          ? getLocalizedText(about.aboutMe, activeLocale, fallbackLocale)
          : "",
      )) ||
    undefined;

  return {
    detectedLocale: activeLocale,
    header: {
      fullName: header.fullName,
      degree:
        getLocalizedText(header.degree, activeLocale, fallbackLocale) ||
        undefined,
      summary: summary !== "" ? summary : undefined,
    },
    experiences: experiences.map((exp, index) => ({
      id: exp.id || `exp-${index + 1}`,
      company: exp.company,
      role: getLocalizedText(exp.role, activeLocale, fallbackLocale),
      location: exp.location
        ? getLocalizedText(exp.location, activeLocale, fallbackLocale) ||
          undefined
        : undefined,
      startDate: formatExperienceDate(exp.startDate),
      endDate: formatExperienceDate(exp.endDate),
      current: exp.current,
      responsibilities: exp.responsibilities.map((resp) =>
        getLocalizedText(resp.text, activeLocale, fallbackLocale),
      ),
    })),
    education: education.map((edu, index) => ({
      id: edu.id || `edu-${index + 1}`,
      institution: edu.institution,
      degreeName: getLocalizedText(
        edu.degreeName,
        activeLocale,
        fallbackLocale,
      ),
      location: edu.location
        ? getLocalizedText(edu.location, activeLocale, fallbackLocale) ||
          undefined
        : undefined,
      startYear: edu.startYear ?? undefined,
      endYear: edu.endYear ?? undefined,
    })),
    skills: skills.map((skill) => ({
      category: skill.category,
      items: skill.items,
    })),
    languages: languages.map((lang) => ({
      name: getLocalizedText(lang.name, activeLocale, fallbackLocale),
      level: getLocalizedText(lang.level, activeLocale, fallbackLocale),
    })),
    contacts: contacts.map((contact) => ({
      type: contact.type,
      value: contact.value,
    })),
    certifications: [],
  };
}
