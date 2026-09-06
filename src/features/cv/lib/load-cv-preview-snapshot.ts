import type { PrismaClient } from "@prisma/client";

import type { Locale } from "@/i18n/config";
import { getTenantPublicUrl } from "@/lib/tenant/public-url";
import { createLocalizedFieldResolver } from "@/lib/i18n/localized-display";
import { appendPortfolioWebsiteContact } from "@/lib/cv/append-portfolio-website-contact";
import { resolveCvAboutPreviewText } from "@/features/cv/lib/resolve-cv-about-preview-text";

function formatExperienceDate(date: Date | null): string {
  if (!date) return "";
  return date.toISOString().slice(0, 7);
}

export interface CvPreviewSnapshotData {
  header: {
    fullName: string;
    degree: string;
    photoUrl: string | null;
    backgroundImageUrl: string | null;
    heroSummary: string;
    clientImageAlt: string;
  };
  aboutMeText: string | null;
  contacts: {
    type: string;
    value: string;
    label: string;
    order: number;
  }[];
  educations: {
    institution: string;
    degreeName: string;
    location: string;
    description: string;
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
    location: string;
    startDate: string;
    endDate: string;
    current: boolean;
    order: number;
    responsibilities: {
      text: string;
      order: number;
    }[];
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

export type CvPreviewSnapshot = CvPreviewSnapshotData;

export async function loadCvPreviewSnapshot(
  db: PrismaClient,
  userId: string,
  locale: Locale,
): Promise<CvPreviewSnapshotData | null> {
  const [
    appLanguages,
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
    db.appLanguage.findMany({ orderBy: { code: "asc" } }),
    db.profile.findUnique({
      where: { userId },
      select: { username: true, isPrimary: true, customDomain: true },
    }),
    db.cvHeader.findUnique({
      where: { userId },
      include: { translations: true },
    }),
    db.cvAboutMe.findUnique({
      where: { userId },
      include: { translations: true },
    }),
    db.cvContact.findMany({
      where: { userId },
      include: { translations: true },
      orderBy: { order: "asc" },
    }),
    db.cvEducation.findMany({
      where: { userId },
      include: { translations: true },
      orderBy: { order: "asc" },
    }),
    db.cvLanguage.findMany({
      where: { userId },
      include: { translations: true },
      orderBy: { order: "asc" },
    }),
    db.cvTechnicalSkill.findMany({
      where: { userId },
      orderBy: { order: "asc" },
    }),
    db.cvExperience.findMany({
      where: { userId },
      include: {
        translations: true,
        responsibilities: {
          include: { translations: true },
          orderBy: { order: "asc" },
        },
        CvExperienceSkill: { include: { skill: true } },
      },
      orderBy: { order: "asc" },
    }),
    db.cvSoftSkill.findMany({
      where: { userId },
      include: { translations: true },
      orderBy: { order: "asc" },
    }),
    db.cvAdditionalInfo.findMany({
      where: { userId },
      include: { translations: true },
      orderBy: { order: "asc" },
    }),
  ]);

  if (!header) return null;

  const field = createLocalizedFieldResolver(appLanguages, locale);
  const headerT = field.for(header.translations);

  const aboutMeText = resolveCvAboutPreviewText(
    headerT("heroSummary"),
    aboutMe ? field(aboutMe.translations, "aboutMe") : null,
  );

  return {
    header: {
      fullName: header.fullName,
      degree: headerT("degree"),
      photoUrl: header.photoUrl,
      backgroundImageUrl: header.backgroundImageUrl,
      heroSummary: headerT("heroSummary"),
      clientImageAlt: headerT("clientImageAlt"),
    },
    aboutMeText: aboutMeText ?? null,
    contacts: profile
      ? appendPortfolioWebsiteContact(
          contacts.map((contact) => ({
            type: contact.type,
            value: contact.value,
            label: field(contact.translations, "label"),
            order: contact.order,
          })),
          getTenantPublicUrl(profile),
        )
      : contacts.map((contact) => ({
          type: contact.type,
          value: contact.value,
          label: field(contact.translations, "label"),
          order: contact.order,
        })),
    educations: educations.map((education) => {
      const eduT = field.for(education.translations);
      return {
        institution: education.institution,
        degreeName: eduT("degreeName"),
        location: eduT("location"),
        description: eduT("description"),
        startYear: education.startYear,
        endYear: education.endYear,
        dates: education.dates,
        order: education.order,
      };
    }),
    languages: languages.map((language) => {
      const langT = field.for(language.translations);
      return {
        name: langT("name"),
        level: langT("level"),
        order: language.order,
      };
    }),
    technicalSkills: technicalSkills.map((skill) => ({
      category: skill.category,
      items: [...skill.items].sort(),
      order: skill.order,
    })),
    experiences: experiences.map((experience) => {
      const expT = field.for(experience.translations);
      return {
        company: experience.company,
        role: expT("role"),
        location: expT("location"),
        startDate: formatExperienceDate(experience.startDate),
        endDate: formatExperienceDate(experience.endDate),
        current: experience.current,
        order: experience.order,
        responsibilities: experience.responsibilities
          .filter((responsibility) => !responsibility.atsOnly)
          .map((responsibility) => ({
            text: field(responsibility.translations, "text"),
            order: responsibility.order,
          })),
        skillNames: experience.CvExperienceSkill.map((item) => item.skill.title)
          .slice()
          .sort(),
      };
    }),
    softSkills: softSkills.map((skill) => ({
      name: field(skill.translations, "name"),
      order: skill.order,
    })),
    additionalInformation: additionalInformation.map((info) => ({
      text: field(info.translations, "text"),
      order: info.order,
    })),
  };
}
