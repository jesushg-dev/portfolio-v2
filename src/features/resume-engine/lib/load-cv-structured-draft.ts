import type { PrismaClient } from "@prisma/client";

import type { Locale } from "@/i18n/config";
import type { CvImportDraft } from "@/features/resume-engine/lib/cv-import-draft";
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

export async function loadCvStructuredDraft(
  db: PrismaClient,
  userId: string,
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

  const detectedLocale = resolveLocale(profile?.defaultLocale);

  const summary =
    getLocalizedText(header.heroSummary, detectedLocale) ||
    (await db.cvAboutMe
      .findUnique({ where: { userId } })
      .then((about) =>
        about ? getLocalizedText(about.aboutMe, detectedLocale) : "",
      )) ||
    undefined;

  return {
    detectedLocale,
    header: {
      fullName: header.fullName,
      degree: getLocalizedText(header.degree, detectedLocale) || undefined,
      summary: summary !== "" ? summary : undefined,
    },
    experiences: experiences.map((exp, index) => ({
      id: exp.id || `exp-${index + 1}`,
      company: exp.company,
      role: getLocalizedText(exp.role, detectedLocale),
      location: exp.location
        ? getLocalizedText(exp.location, detectedLocale) || undefined
        : undefined,
      startDate: formatExperienceDate(exp.startDate),
      endDate: formatExperienceDate(exp.endDate),
      current: exp.current,
      responsibilities: exp.responsibilities.map((resp) =>
        getLocalizedText(resp.text, detectedLocale),
      ),
    })),
    education: education.map((edu, index) => ({
      id: edu.id || `edu-${index + 1}`,
      institution: edu.institution,
      degreeName: getLocalizedText(edu.degreeName, detectedLocale),
      location: edu.location
        ? getLocalizedText(edu.location, detectedLocale) || undefined
        : undefined,
      startYear: edu.startYear ?? undefined,
      endYear: edu.endYear ?? undefined,
    })),
    skills: skills.map((skill) => ({
      category: skill.category,
      items: skill.items,
    })),
    languages: languages.map((lang) => ({
      name: getLocalizedText(lang.name, detectedLocale),
      level: getLocalizedText(lang.level, detectedLocale),
    })),
    contacts: contacts.map((contact) => ({
      type: contact.type,
      value: contact.value,
    })),
    certifications: [],
  };
}
