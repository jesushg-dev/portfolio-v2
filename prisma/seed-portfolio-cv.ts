import { readFileSync } from "node:fs";
import type {
  CvContactType,
  CvSkillCategory,
  Prisma,
  PrismaClient,
  Skill,
} from "@prisma/client";

import {
  DEFAULT_LOCALE,
  toLocalizedText,
  type LocaleMap,
} from "./lib/localized-text-seed";
import { portfolioProfile } from "./seed-portfolio-user";

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
  experiences: {
    key: string;
    company: string;
    dates: string;
    role: LocaleMap;
    skillKeys: string[];
    responsibilities: {
      text: LocaleMap;
      order: number;
    }[];
    order: number;
  }[];
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

function asJson(
  value: ReturnType<typeof toLocalizedText>,
): Prisma.InputJsonValue {
  return value;
}

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

export async function seedPortfolioCv(
  prisma: PrismaClient,
  userId: string,
  skillsByKey: Record<string, Skill>,
): Promise<void> {
  const data = portfolioCv;
  console.log("[seed-portfolio-cv] seeding CV sections...");

  await prisma.cvHeader.upsert({
    where: { userId },
    update: {
      fullName: data.header.fullName,
      degree: asJson(toLocalizedText(data.header.degree)),
      photoUrl: portfolioProfile.photoUrl,
      clientImageAlt: asJson(toLocalizedText(data.header.clientImageAlt)),
    },
    create: {
      userId,
      fullName: data.header.fullName,
      degree: asJson(toLocalizedText(data.header.degree)),
      photoUrl: portfolioProfile.photoUrl,
      clientImageAlt: asJson(toLocalizedText(data.header.clientImageAlt)),
    },
  });

  await prisma.cvAboutMe.upsert({
    where: { userId },
    update: {
      aboutMe: asJson(toLocalizedText(data.aboutMe)),
    },
    create: {
      userId,
      aboutMe: asJson(toLocalizedText(data.aboutMe)),
    },
  });

  await prisma.cvContact.deleteMany({ where: { userId } });
  for (const contact of data.contacts) {
    await prisma.cvContact.create({
      data: {
        userId,
        type: contact.type,
        value: contact.value,
        label: asJson(toLocalizedText(contact.label)),
        order: contact.order,
      },
    });
  }

  await prisma.cvEducation.deleteMany({ where: { userId } });
  for (const education of data.education) {
    await prisma.cvEducation.create({
      data: {
        userId,
        institution: education.institution,
        degreeName: asJson(toLocalizedText(education.degreeName)),
        location: asJson(toLocalizedText(education.location)),
        dates: education.dates,
        order: education.order,
      },
    });
  }

  await prisma.cvLanguage.deleteMany({ where: { userId } });
  for (const language of data.languages) {
    await prisma.cvLanguage.create({
      data: {
        userId,
        name: asJson(toLocalizedText(language.name)),
        level: asJson(toLocalizedText(language.level)),
        order: language.order,
      },
    });
  }

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
        role: asJson(toLocalizedText(experience.role)),
        dates: experience.dates,
        skills: null,
        order: experience.order,
        responsibilities: {
          createMany: {
            data: experience.responsibilities.map((responsibility) => ({
              text: asJson(toLocalizedText(responsibility.text)),
              order: responsibility.order,
            })),
          },
        },
      },
    });

    if (skillIds.length > 0) {
      await prisma.cvExperienceSkill.createMany({
        data: skillIds.map((skillId) => ({
          experienceId: createdExperience.id,
          skillId,
        })),
      });
    }
  }

  await prisma.cvSoftSkill.deleteMany({ where: { userId } });
  for (const softSkill of data.softSkills) {
    await prisma.cvSoftSkill.create({
      data: {
        userId,
        name: asJson(toLocalizedText(softSkill.name)),
        order: softSkill.order,
      },
    });
  }

  await prisma.cvAdditionalInfo.deleteMany({ where: { userId } });
  for (const item of data.additionalInformation) {
    await prisma.cvAdditionalInfo.create({
      data: {
        userId,
        text: asJson(toLocalizedText(item.text)),
        order: item.order,
      },
    });
  }

  await prisma.cvPersonalReference.deleteMany({ where: { userId } });
  for (const reference of data.personalReferences) {
    await prisma.cvPersonalReference.create({
      data: {
        userId,
        name: reference.name,
        role: asJson(toLocalizedText(reference.role)),
        contact: reference.contact,
        order: reference.order,
      },
    });
  }

  console.log(
    `[seed-portfolio-cv] done. userId=${userId} (defaultLocale=${DEFAULT_LOCALE})`,
  );
}

export { portfolioCv };
