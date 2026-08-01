import { readFileSync } from "node:fs";
import type {
  CvContactType,
  CvSkillCategory,
  PrismaClient,
  Skill,
} from "@prisma/client";

import { DEFAULT_LOCALE, type LocaleMap } from "./lib/localized-text-seed";
import { portfolioProfile } from "./seed-portfolio-user";

type LocaleCode = "es" | "en" | "nl";

interface ExperienceSeed {
  key: string;
  company: string;
  companyLogoUrl?: string;
  startDate?: string;
  endDate?: string;
  role: LocaleMap;
  skillKeys: string[];
  responsibilities: {
    text: LocaleMap;
    order: number;
  }[];
  order: number;
  featuredOnHome?: boolean;
}

export interface PortfolioCvSeed {
  header: {
    fullName: string;
    degree: LocaleMap;
    clientImageAlt: LocaleMap;
  };
  aboutMe: LocaleMap;
  contacts: {
    type: CvContactType;
    value: string;
    label: LocaleMap;
    order: number;
  }[];
  education: {
    institution: string;
    dates: string;
    degreeName: LocaleMap;
    location: LocaleMap;
    order: number;
  }[];
  languages: {
    name: LocaleMap;
    level: LocaleMap;
    order: number;
  }[];
  technicalSkills: {
    category: CvSkillCategory;
    items: string[];
    order: number;
  }[];
  experiences: ExperienceSeed[];
  softSkills: {
    name: LocaleMap;
    order: number;
  }[];
  additionalInformation: {
    text: LocaleMap;
    order: number;
  }[];
  personalReferences: {
    name: string;
    contact: string;
    role: LocaleMap;
    order: number;
  }[];
}

const portfolioCv = JSON.parse(
  readFileSync(new URL("./data/portfolio-cv.json", import.meta.url), "utf8"),
) as PortfolioCvSeed;

function resolveSkillIds(
  skillKeys: string[],
  skillsByKey: Record<string, Skill>,
  context: string,
): string[] {
  return skillKeys.map((skillKey) => {
    const skill = skillsByKey[skillKey];
    if (!skill) {
      throw new Error(`${context} references unknown skill key "${skillKey}"`);
    }
    return skill.id;
  });
}

function getTranslationValue(map: LocaleMap, langCode: string): string {
  return map[langCode as LocaleCode] ?? map.es ?? map.en ?? "";
}

export async function seedPortfolioCv(
  prisma: PrismaClient,
  userId: string,
  skillsByKey: Record<string, Skill>,
): Promise<void> {
  const data = portfolioCv;
  console.log("[seed-portfolio-cv] seeding CV sections...");

  const appLanguages = await prisma.appLanguage.findMany();

  // 1. CvHeader
  await prisma.cvHeader.deleteMany({ where: { userId } });
  await prisma.cvHeader.create({
    data: {
      userId,
      fullName: data.header.fullName,
      photoUrl: portfolioProfile.photoUrl,
      translations: {
        create: appLanguages.map((lang) => ({
          appLanguageId: lang.id,
          degree: getTranslationValue(data.header.degree, lang.code),
          clientImageAlt: getTranslationValue(
            data.header.clientImageAlt,
            lang.code,
          ),
        })),
      },
    },
  });

  // 2. CvAboutMe
  await prisma.cvAboutMe.deleteMany({ where: { userId } });
  await prisma.cvAboutMe.create({
    data: {
      userId,
      translations: {
        create: appLanguages.map((lang) => ({
          appLanguageId: lang.id,
          aboutMe: getTranslationValue(data.aboutMe, lang.code),
        })),
      },
    },
  });

  // 3. CvContact
  await prisma.cvContact.deleteMany({ where: { userId } });
  for (const contact of data.contacts) {
    await prisma.cvContact.create({
      data: {
        userId,
        type: contact.type,
        value: contact.value,
        order: contact.order,
        translations: {
          create: appLanguages.map((lang) => ({
            appLanguageId: lang.id,
            label: getTranslationValue(contact.label, lang.code),
          })),
        },
      },
    });
  }

  // 4. CvEducation
  await prisma.cvEducation.deleteMany({ where: { userId } });
  for (const education of data.education) {
    await prisma.cvEducation.create({
      data: {
        userId,
        institution: education.institution,
        dates: education.dates,
        order: education.order,
        translations: {
          create: appLanguages.map((lang) => ({
            appLanguageId: lang.id,
            degreeName: getTranslationValue(education.degreeName, lang.code),
            location: getTranslationValue(education.location, lang.code),
          })),
        },
      },
    });
  }

  // 5. CvLanguage
  await prisma.cvLanguage.deleteMany({ where: { userId } });
  for (const language of data.languages) {
    await prisma.cvLanguage.create({
      data: {
        userId,
        order: language.order,
        translations: {
          create: appLanguages.map((lang) => ({
            appLanguageId: lang.id,
            name: getTranslationValue(language.name, lang.code),
            level: getTranslationValue(language.level, lang.code),
          })),
        },
      },
    });
  }

  // 6. CvTechnicalSkill
  await prisma.cvTechnicalSkill.deleteMany({ where: { userId } });
  for (const section of data.technicalSkills) {
    await prisma.cvTechnicalSkill.create({
      data: {
        userId,
        category: section.category,
        items: section.items,
        order: section.order,
      },
    });
  }

  // 7. CvExperience & Responsibilities
  await prisma.cvExperience.deleteMany({ where: { userId } });
  for (const experience of data.experiences) {
    const skillIds = resolveSkillIds(
      experience.skillKeys,
      skillsByKey,
      `Experience "${experience.key}"`,
    );

    const createdExperience = await prisma.cvExperience.create({
      data: {
        userId,
        company: experience.company,
        companyLogoUrl: experience.companyLogoUrl ?? null,
        startDate: experience.startDate ? new Date(experience.startDate) : null,
        endDate: experience.endDate ? new Date(experience.endDate) : null,
        current: !experience.endDate,
        skills: null,
        featuredOnHome: experience.featuredOnHome ?? false,
        order: experience.order,
        translations: {
          create: appLanguages.map((lang) => ({
            appLanguageId: lang.id,
            role: getTranslationValue(experience.role, lang.code),
          })),
        },
      },
    });

    for (const resp of experience.responsibilities) {
      await prisma.cvResponsibility.create({
        data: {
          experienceId: createdExperience.id,
          order: resp.order,
          translations: {
            create: appLanguages.map((lang) => ({
              appLanguageId: lang.id,
              text: getTranslationValue(resp.text, lang.code),
            })),
          },
        },
      });
    }

    if (skillIds.length > 0) {
      await prisma.cvExperienceSkill.createMany({
        data: skillIds.map((skillId) => ({
          experienceId: createdExperience.id,
          skillId,
        })),
      });
    }
  }

  // 8. CvSoftSkill
  await prisma.cvSoftSkill.deleteMany({ where: { userId } });
  for (const softSkill of data.softSkills) {
    await prisma.cvSoftSkill.create({
      data: {
        userId,
        order: softSkill.order,
        translations: {
          create: appLanguages.map((lang) => ({
            appLanguageId: lang.id,
            name: getTranslationValue(softSkill.name, lang.code),
          })),
        },
      },
    });
  }

  // 9. CvAdditionalInfo
  await prisma.cvAdditionalInfo.deleteMany({ where: { userId } });
  for (const item of data.additionalInformation) {
    await prisma.cvAdditionalInfo.create({
      data: {
        userId,
        order: item.order,
        translations: {
          create: appLanguages.map((lang) => ({
            appLanguageId: lang.id,
            text: getTranslationValue(item.text, lang.code),
          })),
        },
      },
    });
  }

  // 10. CvPersonalReference
  await prisma.cvPersonalReference.deleteMany({ where: { userId } });
  for (const reference of data.personalReferences) {
    await prisma.cvPersonalReference.create({
      data: {
        userId,
        name: reference.name,
        contact: reference.contact,
        order: reference.order,
        translations: {
          create: appLanguages.map((lang) => ({
            appLanguageId: lang.id,
            role: getTranslationValue(reference.role, lang.code),
          })),
        },
      },
    });
  }

  console.log(
    `[seed-portfolio-cv] done. userId=${userId} (defaultLocale=${DEFAULT_LOCALE})`,
  );
}

export { portfolioCv };
