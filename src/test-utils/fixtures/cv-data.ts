import type { ComponentProps } from "react";

import type { CvData } from "@/components/curriculum-vitae/types";
import type CvPreview from "@/components/curriculum-vitae/cv-preview";

export const mockEducation: CvData["educations"][number] = {
  id: "edu-1",
  userId: "user-1",
  order: 0,
  institution: "Test University",
  degreeName: {
    default: "Computer Science",
    translations: { es: "Ciencias de la Computación" },
  },
  description: null,
  location: {
    default: "Madrid, Spain",
    translations: { en: "Madrid, Spain" },
  },
  dates: null,
  startYear: 2018,
  endYear: 2022,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockLanguage: CvData["languages"][number] = {
  id: "lang-1",
  userId: "user-1",
  order: 0,
  name: {
    default: "English",
    translations: { es: "Inglés" },
  },
  level: {
    default: "Fluent",
    translations: { es: "Fluido" },
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockSoftSkill: CvData["softSkills"][number] = {
  id: "skill-1",
  userId: "user-1",
  order: 0,
  name: {
    default: "Teamwork",
    translations: { es: "Trabajo en equipo" },
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockCvPreviewData = {
  header: {
    id: "header-1",
    userId: "user-1",
    fullName: "Jane Doe",
    degree: { default: "Software Engineer" },
    photoUrl: null,
    backgroundImageUrl: null,
    heroSummary: null,
    clientImageAlt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  profile: {
    id: "profile-1",
    userId: "user-1",
    username: "janedoe",
    displayName: "Jane Doe",
    isPublished: true,
    isPrimary: true,
    customDomain: null,
    cvPdfUrl: null,
    defaultLocale: "en",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  contacts: [],
  educations: [mockEducation],
  languages: [mockLanguage],
  technicalSkills: [],
  experiences: [],
  softSkills: [mockSoftSkill],
  additionalInformation: [],
} satisfies ComponentProps<typeof CvPreview>["data"];
