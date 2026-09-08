import type { CvData } from "@/components/curriculum-vitae/types";
import type { Locale } from "@/i18n/config";
import type { LanguageRef } from "@/lib/i18n/editor-rows";

export const mockAppLanguages: LanguageRef[] = [
  { id: "lang-en", code: "en" },
  { id: "lang-es", code: "es" },
  { id: "lang-nl", code: "nl" },
];

export const mockCvLocaleProps: {
  locale: Locale;
  defaultLocale: Locale;
  appLanguages: LanguageRef[];
} = {
  locale: "en",
  defaultLocale: "en",
  appLanguages: mockAppLanguages,
};

export const mockEducation: CvData["educations"][number] = {
  id: "edu-1",
  userId: "user-1",
  order: 0,
  institution: "Test University",
  startYear: 2018,
  endYear: 2022,
  dates: "2018 - 2022",
  createdAt: new Date(),
  updatedAt: new Date(),
  translations: [
    {
      id: "edut-1",
      cvEducationId: "edu-1",
      appLanguageId: "lang-en",
      degreeName: "Computer Science",
      description: "Bachelor of Science",
      location: "Madrid, Spain",
      createdAt: new Date(),
    },
    {
      id: "edut-2",
      cvEducationId: "edu-1",
      appLanguageId: "lang-es",
      degreeName: "Ciencias de la Computación",
      description: "Licenciatura",
      location: "Madrid, España",
      createdAt: new Date(),
    },
  ],
};

export const mockLanguage: CvData["languages"][number] = {
  id: "lang-1",
  userId: "user-1",
  order: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  translations: [
    {
      id: "langt-1",
      cvLanguageId: "lang-1",
      appLanguageId: "lang-en",
      name: "English",
      level: "Fluent",
      createdAt: new Date(),
    },
    {
      id: "langt-2",
      cvLanguageId: "lang-1",
      appLanguageId: "lang-es",
      name: "Inglés",
      level: "Fluido",
      createdAt: new Date(),
    },
  ],
};

export const mockSoftSkill: CvData["softSkills"][number] = {
  id: "skill-1",
  userId: "user-1",
  order: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  translations: [
    {
      id: "skillt-1",
      cvSoftSkillId: "skill-1",
      appLanguageId: "lang-en",
      name: "Teamwork",
      createdAt: new Date(),
    },
    {
      id: "skillt-2",
      cvSoftSkillId: "skill-1",
      appLanguageId: "lang-es",
      name: "Trabajo en equipo",
      createdAt: new Date(),
    },
  ],
};

export const mockCvHeader = {
  id: "header-123",
  userId: "user-123",
  fullName: "Jane Doe",
  photoUrl: null,
  backgroundImageUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  translations: [
    {
      id: "headt-1",
      cvHeaderId: "header-123",
      appLanguageId: "lang-en",
      degree: "Software Engineer",
      heroSubtitle: "Senior Software Engineer",
      heroTagline: "Building things",
      heroSummary: null,
      clientImageAlt: null,
      createdAt: new Date(),
    },
  ],
};

export const mockCvPreviewData = {
  header: mockCvHeader,
  profile: {
    id: "profile-1",
    userId: "user-1",
    username: "janedoe",
    displayName: "Jane Doe",
    logoInitials: null,
    logoImageUrl: null,
    isPublished: true,
    isPrimary: true,
    customDomain: null,
    mapLocationLabel: null,
    mapLatitude: null,
    mapLongitude: null,
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
  aboutMe: null,
  personalReferences: [],
} satisfies CvData;
