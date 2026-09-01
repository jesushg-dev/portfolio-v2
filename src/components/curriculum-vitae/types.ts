import type { RouterOutputs } from "@/trpc/react";
import { createLocalizedFieldResolver } from "@/lib/i18n/localized-display";
import type { LanguageRef } from "@/lib/i18n/editor-rows";
import type { Locale } from "@/i18n/config";
import type { CvContactType, CvSkillCategory } from "@prisma/client";

/**
 * Server-resolved CV data — the shape returned by `cv.getPublic` /
 * `cv.getMine` tRPC endpoints.
 */
export type CvData = NonNullable<RouterOutputs["cv"]["getPublic"]>;

export interface LocalizedCvData {
  header?: {
    id: string;
    fullName: string;
    photoUrl: string | null;
    backgroundImageUrl: string | null;
    degree: string;
    clientImageAlt: string;
  } | null;
  profile?: {
    displayName: string | null;
    username: string | null;
  } | null;
  contacts: {
    id: string;
    type: CvContactType;
    value: string;
    order: number;
    label: string;
  }[];
  educations: {
    id: string;
    institution: string;
    startYear: number | null;
    endYear: number | null;
    dates: string | null;
    order: number;
    degreeName: string;
    location: string;
  }[];
  languages: {
    id: string;
    order: number;
    name: string;
    level: string;
  }[];
  technicalSkills: {
    id: string;
    category: CvSkillCategory;
    items: string[];
    order: number;
  }[];
  experiences: {
    id: string;
    company: string;
    companyLogoUrl: string | null;
    startDate: Date | null;
    endDate: Date | null;
    current: boolean;
    order: number;
    role: string;
    location: string;
    companyBlurb?: string;
    responsibilities: {
      id: string;
      order: number;
      text: string;
    }[];
    skills: string[];
  }[];
  softSkills: {
    id: string;
    order: number;
    name: string;
  }[];
  additionalInformation: {
    id: string;
    order: number;
    text: string;
  }[];
  personalReferences: {
    id: string;
    name: string;
    contact: string | null;
    order: number;
    role: string;
  }[];
  certifications: {
    id: string;
    title: string;
    issuer?: string;
    year?: number;
  }[];
}

export function mapCvDataToLocalized(
  data: CvData,
  appLanguages: LanguageRef[],
  locale: Locale,
): LocalizedCvData {
  const resolver = createLocalizedFieldResolver(appLanguages, locale);

  const header = data.header
    ? {
        id: data.header.id,
        fullName: data.header.fullName,
        photoUrl: data.header.photoUrl,
        backgroundImageUrl: data.header.backgroundImageUrl,
        degree: resolver(data.header.translations, "degree"),
        clientImageAlt: resolver(data.header.translations, "clientImageAlt"),
      }
    : null;

  const contacts = data.contacts.map((contact) => ({
    id: contact.id,
    type: contact.type,
    value: contact.value,
    order: contact.order,
    label: resolver(contact.translations, "label"),
  }));

  const educations = data.educations.map((edu) => ({
    id: edu.id,
    institution: edu.institution,
    startYear: edu.startYear,
    endYear: edu.endYear,
    dates: edu.dates,
    order: edu.order,
    degreeName: resolver(edu.translations, "degreeName"),
    location: resolver(edu.translations, "location") ?? "",
  }));

  const languages = data.languages.map((lang) => ({
    id: lang.id,
    order: lang.order,
    name: resolver(lang.translations, "name"),
    level: resolver(lang.translations, "level"),
  }));

  const technicalSkills = data.technicalSkills.map((ts) => ({
    id: ts.id,
    category: ts.category,
    items: ts.items,
    order: ts.order,
  }));

  const experiences = data.experiences.map((exp) => ({
    id: exp.id,
    company: exp.company,
    companyLogoUrl: exp.companyLogoUrl,
    startDate: exp.startDate,
    endDate: exp.endDate,
    current: exp.current,
    order: exp.order,
    role: resolver(exp.translations, "role"),
    location: resolver(exp.translations, "location") ?? "",
    companyBlurb: resolver(exp.translations, "companyBlurb") || undefined,
    responsibilities: exp.responsibilities
      .filter((resp) => !resp.atsOnly)
      .map((resp) => ({
        id: resp.id,
        order: resp.order,
        text: resolver(resp.translations, "text"),
      })),
    skills: exp.CvExperienceSkill.map((s) => s.skill.title),
  }));

  const softSkills = data.softSkills.map((ss) => ({
    id: ss.id,
    order: ss.order,
    name: resolver(ss.translations, "name"),
  }));

  const additionalInformation = data.additionalInformation.map((ai) => ({
    id: ai.id,
    order: ai.order,
    text: resolver(ai.translations, "text"),
  }));

  const personalReferences = (data.personalReferences ?? []).map((pr) => ({
    id: pr.id,
    name: pr.name,
    contact: pr.contact,
    order: pr.order,
    role: resolver(pr.translations, "role") ?? "",
  }));

  return {
    header,
    profile: data.profile
      ? {
          displayName: data.profile.displayName,
          username: data.profile.username,
        }
      : null,
    contacts,
    educations,
    languages,
    technicalSkills,
    experiences,
    softSkills,
    additionalInformation,
    personalReferences,
    certifications: [],
  };
}
