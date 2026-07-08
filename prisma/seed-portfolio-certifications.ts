import { readFileSync } from "node:fs";
import { ObjectId } from "bson";
import type {
  Certification,
  PrismaClient,
  Skill,
  StackType,
} from "@prisma/client";

import { matchCertificationSkillKeys } from "./lib/match-certification-skills";
import { portfolioSkills } from "./seed-portfolio-skills";

export interface PortfolioCertificationSeed {
  key: string;
  company: string;
  issuedDate: number | null;
  url: string;
  idCredential: string;
  image: string;
  type: StackType;
  skillKeys: string[];
  translations: {
    locale: "es" | "en" | "nl";
    title: string;
  }[];
}

const portfolioCertifications = JSON.parse(
  readFileSync(
    new URL("./data/portfolio-certifications.json", import.meta.url),
    "utf8",
  ),
) as PortfolioCertificationSeed[];

export async function seedPortfolioCertifications(
  prisma: PrismaClient,
  langIds: Record<"es" | "en" | "nl", string>,
  skillsByKey: Record<string, Skill>,
): Promise<Record<string, Certification>> {
  const result: Record<string, Certification> = {};

  for (const certification of portfolioCertifications) {
    const skillKeys =
      certification.skillKeys.length > 0
        ? certification.skillKeys
        : matchCertificationSkillKeys(certification, portfolioSkills);

    const skillIds = skillKeys.map((skillKey) => {
      const skill = skillsByKey[skillKey];
      if (!skill) {
        throw new Error(
          `Certification "${certification.key}" references unknown skill key "${skillKey}"`,
        );
      }
      return skill.id;
    });

    const created = await prisma.certification.upsert({
      where: { id: new ObjectId().toString() },
      update: {},
      create: {
        company: certification.company,
        issuedDate: certification.issuedDate,
        url: certification.url.trim() || null,
        idCredential: certification.idCredential.trim() || null,
        image: certification.image.trim() || null,
        type: [certification.type],
        CertificationTranslation: {
          createMany: {
            data: certification.translations.map((translation) => ({
              title: translation.title,
              appLanguageId: langIds[translation.locale],
            })),
          },
        },
        CertificateSkill: skillIds.length
          ? { createMany: { data: skillIds.map((skillId) => ({ skillId })) } }
          : undefined,
      },
    });

    result[certification.key] = created;
  }

  return result;
}

export { portfolioCertifications };
