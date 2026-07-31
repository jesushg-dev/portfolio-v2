import "server-only";

import type { PrismaClient } from "@prisma/client";

import type { Locale } from "@/i18n/config";
import { appendPortfolioWebsiteContact } from "@/lib/cv/append-portfolio-website-contact";
import { getLocalizedText } from "@/lib/i18n/localized";
import { getTenantPublicUrl } from "@/lib/tenant/public-url";

export interface CvPreviewSnapshot {
  header: {
    fullName: string;
    degree: string | null;
    photoUrl: string | null;
    backgroundImageUrl: string | null;
    heroSummary: string | null;
    clientImageAlt: string | null;
  } | null;
  aboutMeText: string | null;
  contacts: {
    type: string;
    value: string;
    label: string | null;
    order: number;
  }[];
  educations: {
    institution: string;
    degreeName: string;
    location: string | null;
    description: string | null;
    startYear: number | null;
    endYear: number | null;
    dates: string | null;
    order: number;
  }[];
  languages: {
    name: string;
    level: string;
    order: number;
  }[];
  technicalSkills: {
    category: string;
    items: string[];
    order: number;
  }[];
  experiences: {
    company: string;
    role: string;
    location: string | null;
    startDate: string | null;
    endDate: string | null;
    current: boolean;
    order: number;
    responsibilities: { text: string; order: number }[];
    skillNames: string[];
  }[];
  softSkills: {
    name: string;
    order: number;
  }[];
  additionalInformation: {
    text: string;
    order: number;
  }[];
}

function formatExperienceDate(date: Date | null | undefined): string | null {
  if (!date) return null;
  return date.toISOString().slice(0, 10);
}

export async function loadCvPreviewSnapshot(
  db: PrismaClient,
  userId: string,
  locale: Locale,
  fallbackLocale: Locale,
): Promise<CvPreviewSnapshot | null> {
  const [
    profile,
    header,
    aboutMe,
    contacts,
    educations,
    languages,
    technicalSkills,
    experiences,
    softSkills,
    additionalInformation,
  ] = await Promise.all([
    db.profile.findUnique({
      where: { userId },
      select: { username: true, isPrimary: true, customDomain: true },
    }),
    db.cvHeader.findUnique({ where: { userId } }),
    db.cvAboutMe.findUnique({ where: { userId } }),
    db.cvContact.findMany({
      where: { userId },
      orderBy: { order: "asc" },
    }),
    db.cvEducation.findMany({
      where: { userId },
      orderBy: { order: "asc" },
    }),
    db.cvLanguage.findMany({
      where: { userId },
      orderBy: { order: "asc" },
    }),
    db.cvTechnicalSkill.findMany({
      where: { userId },
      orderBy: { order: "asc" },
    }),
    db.cvExperience.findMany({
      where: { userId },
      include: {
        responsibilities: { orderBy: { order: "asc" } },
        CvExperienceSkill: { include: { skill: true } },
      },
      orderBy: { order: "asc" },
    }),
    db.cvSoftSkill.findMany({
      where: { userId },
      orderBy: { order: "asc" },
    }),
    db.cvAdditionalInfo.findMany({
      where: { userId },
      orderBy: { order: "asc" },
    }),
  ]);

  if (!header) return null;

  const aboutMeText =
    getLocalizedText(header.heroSummary, locale, fallbackLocale) ||
    (aboutMe
      ? getLocalizedText(aboutMe.aboutMe, locale, fallbackLocale)
      : null);

  return {
    header: {
      fullName: header.fullName,
      degree: getLocalizedText(header.degree, locale, fallbackLocale),
      photoUrl: header.photoUrl,
      backgroundImageUrl: header.backgroundImageUrl,
      heroSummary: getLocalizedText(header.heroSummary, locale, fallbackLocale),
      clientImageAlt: getLocalizedText(
        header.clientImageAlt,
        locale,
        fallbackLocale,
      ),
    },
    aboutMeText: aboutMeText ?? null,
    contacts: profile
      ? appendPortfolioWebsiteContact(
          contacts.map((contact) => ({
            type: contact.type,
            value: contact.value,
            label: getLocalizedText(contact.label, locale, fallbackLocale),
            order: contact.order,
          })),
          getTenantPublicUrl(profile),
        )
      : contacts.map((contact) => ({
          type: contact.type,
          value: contact.value,
          label: getLocalizedText(contact.label, locale, fallbackLocale),
          order: contact.order,
        })),
    educations: educations.map((education) => ({
      institution: education.institution,
      degreeName: getLocalizedText(
        education.degreeName,
        locale,
        fallbackLocale,
      ),
      location: getLocalizedText(education.location, locale, fallbackLocale),
      description: getLocalizedText(
        education.description,
        locale,
        fallbackLocale,
      ),
      startYear: education.startYear,
      endYear: education.endYear,
      dates: education.dates,
      order: education.order,
    })),
    languages: languages.map((language) => ({
      name: getLocalizedText(language.name, locale, fallbackLocale),
      level: getLocalizedText(language.level, locale, fallbackLocale),
      order: language.order,
    })),
    technicalSkills: technicalSkills.map((skill) => ({
      category: skill.category,
      items: [...skill.items].sort(),
      order: skill.order,
    })),
    experiences: experiences.map((experience) => ({
      company: experience.company,
      role: getLocalizedText(experience.role, locale, fallbackLocale),
      location: getLocalizedText(experience.location, locale, fallbackLocale),
      startDate: formatExperienceDate(experience.startDate),
      endDate: formatExperienceDate(experience.endDate),
      current: experience.current,
      order: experience.order,
      responsibilities: experience.responsibilities.map((responsibility) => ({
        text: getLocalizedText(responsibility.text, locale, fallbackLocale),
        order: responsibility.order,
      })),
      skillNames: experience.CvExperienceSkill.map((item) => item.skill.title)
        .slice()
        .sort(),
    })),
    softSkills: softSkills.map((skill) => ({
      name: getLocalizedText(skill.name, locale, fallbackLocale),
      order: skill.order,
    })),
    additionalInformation: additionalInformation.map((info) => ({
      text: getLocalizedText(info.text, locale, fallbackLocale),
      order: info.order,
    })),
  };
}
