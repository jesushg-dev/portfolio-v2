import type { PrismaClient } from "@prisma/client";

import type { Locale } from "@/i18n/config";
import type { CvImportDraft } from "@/features/cv/lib/cv-import-draft";
import { createLocalizedFieldResolver } from "@/lib/i18n/localized-display";
import { normalizeEmploymentType } from "./employment-type";
import { resolveUserTechnicalSkills } from "./resolve-user-technical-skills";

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
  /** Make all CMS achievements selectable for a single shared tailored document. */
  evidenceScope?: "visible" | "all";
}

export function certificationYear(
  value: number | null | undefined,
): number | undefined {
  if (value == null || !Number.isFinite(value)) return undefined;
  if (Number.isInteger(value) && value >= 1000 && value <= 9999) return value;
  // CMS date pickers persist Unix milliseconds; older records may contain a year.
  const year = new Date(value).getUTCFullYear();
  if (!Number.isInteger(year) || year < 1000 || year > 9999)
    throw new Error("certification.issuedDate: invalid date");
  return year;
}

async function loadResumeTechnicalSkills(db: PrismaClient, userId: string) {
  const curated = await db.cvTechnicalSkill.findMany({
    where: { userId },
    orderBy: { order: "asc" },
  });
  // The CV editor's curated categories are the source for printed skills.
  // Portfolio-wide skills are useful only when no CV-specific list exists.
  return curated.length ? curated : resolveUserTechnicalSkills(db, userId);
}

export async function loadCvStructuredDraft(
  db: PrismaClient,
  userId: string,
  options?: LoadCvStructuredDraftOptions,
): Promise<CvImportDraft | null> {
  const [
    appLanguages,
    header,
    profile,
    experiences,
    education,
    skills,
    contacts,
    languages,
    certifications,
  ] = await Promise.all([
    db.appLanguage.findMany({ orderBy: { code: "asc" } }),
    db.cvHeader.findUnique({
      where: { userId },
      include: { translations: true },
    }),
    db.profile.findUnique({
      where: { userId },
      select: { defaultLocale: true },
    }),
    db.cvExperience.findMany({
      where: { userId },
      include: {
        translations: true,
        responsibilities: {
          include: { translations: true },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { order: "asc" },
    }),
    db.cvEducation.findMany({
      where: { userId },
      include: { translations: true },
      orderBy: { order: "asc" },
    }),
    loadResumeTechnicalSkills(db, userId),
    db.cvContact.findMany({
      where: { userId },
      orderBy: { order: "asc" },
    }),
    db.cvLanguage.findMany({
      where: { userId },
      include: { translations: true },
      orderBy: { order: "asc" },
    }),
    db.certification.findMany({
      where: { userId },
      include: { CertificationTranslation: true },
      orderBy: { issuedDate: "desc" },
    }),
  ]);

  if (!header) return null;

  const profileDefaultLocale = resolveLocale(profile?.defaultLocale);
  const activeLocale = options?.locale ?? profileDefaultLocale;
  const field = createLocalizedFieldResolver(appLanguages, activeLocale);
  const headerT = field.for(header.translations);

  const summary =
    headerT("heroSummary") ||
    (await db.cvAboutMe
      .findUnique({
        where: { userId },
        include: { translations: true },
      })
      .then((about) => (about ? field(about.translations, "aboutMe") : ""))) ||
    undefined;

  return {
    detectedLocale: activeLocale,
    header: {
      fullName: header.fullName,
      photoUrl: header.photoUrl ?? undefined,
      availability: headerT("availabilityBadge") || undefined,
      degree: headerT("degree") || undefined,
      summary: summary !== "" ? summary : undefined,
    },
    experiences: experiences.map((exp, index) => {
      const expT = field.for(exp.translations);
      const visible: string[] = [];
      const responsibilityIds: string[] = [];
      const atsOnly: string[] = [];
      for (const resp of exp.responsibilities) {
        const text = field(resp.translations, "text");
        if (!text.trim()) continue;
        if (resp.atsOnly && options?.evidenceScope !== "all")
          atsOnly.push(text);
        else {
          visible.push(text);
          responsibilityIds.push(resp.id);
        }
      }
      return {
        id: exp.id || `exp-${index + 1}`,
        company: exp.company,
        companyLogoUrl: exp.companyLogoUrl ?? undefined,
        role: expT("role"),
        employmentType: normalizeEmploymentType(exp.employmentType),
        location: expT("location") || undefined,
        companyBlurb: expT("companyBlurb") || undefined,
        startDate: formatExperienceDate(exp.startDate),
        endDate: formatExperienceDate(exp.endDate),
        current: exp.current,
        responsibilities: visible,
        responsibilityIds,
        atsResponsibilities: atsOnly,
      };
    }),
    education: education.map((edu, index) => {
      const eduT = field.for(edu.translations);
      return {
        id: edu.id || `edu-${index + 1}`,
        institution: edu.institution,
        degreeName: eduT("degreeName"),
        location: eduT("location") || undefined,
        startYear: edu.startYear ?? undefined,
        endYear: edu.endYear ?? undefined,
        dates: edu.dates ?? undefined,
      };
    }),
    skills: skills.map((skill) => ({
      id: skill.id,
      category: skill.category,
      items: skill.items,
    })),
    languages: languages.map((lang) => {
      const langT = field.for(lang.translations);
      return {
        id: lang.id,
        name: langT("name"),
        level: langT("level"),
      };
    }),
    contacts: contacts.map((contact) => ({
      id: contact.id,
      type: contact.type,
      value: contact.value,
    })),
    certifications: certifications.map((cert) => {
      const translation = cert.CertificationTranslation.find(
        (row) =>
          appLanguages.find((lang) => lang.id === row.appLanguageId)?.code ===
          activeLocale,
      );
      const fallback = cert.CertificationTranslation[0];
      return {
        id: cert.id,
        title:
          [translation?.title, fallback?.title].find((value) =>
            Boolean(value?.trim()),
          ) ?? cert.company,
        issuer: cert.company.trim() ? cert.company : undefined,
        year: certificationYear(cert.issuedDate),
      };
    }),
  };
}
