import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const fixturePath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../prisma/data/portfolio-cv.json",
);

export type LocalizedFixture = {
  es: string;
  en: string;
  nl: string;
};

export type PortfolioCvContactFixture = {
  type: string;
  value: string;
  label: LocalizedFixture;
  order: number;
};

export type PortfolioCvEducationFixture = {
  institution: string;
  dates?: string;
  degreeName: LocalizedFixture;
  location?: LocalizedFixture;
  description?: LocalizedFixture;
  order: number;
};

export type PortfolioCvLanguageFixture = {
  name: LocalizedFixture;
  level: LocalizedFixture;
  order: number;
};

export type PortfolioCvTechnicalSkillFixture = {
  category: string;
  items: string[];
  order: number;
};

export type PortfolioCvExperienceFixture = {
  key: string;
  company: string;
  dates: string;
  role: LocalizedFixture;
  skillKeys: string[];
  responsibilities: { text: LocalizedFixture; order: number }[];
  order: number;
};

export type PortfolioCvSoftSkillFixture = {
  name: LocalizedFixture;
  order: number;
};

export type PortfolioCvAdditionalFixture = {
  text: LocalizedFixture;
  order: number;
};

export interface PortfolioCvFixture {
  header: {
    fullName: string;
    degree: LocalizedFixture;
    clientImageAlt: LocalizedFixture;
  };
  aboutMe: LocalizedFixture;
  contacts: PortfolioCvContactFixture[];
  education: PortfolioCvEducationFixture[];
  languages: PortfolioCvLanguageFixture[];
  technicalSkills: PortfolioCvTechnicalSkillFixture[];
  experiences: PortfolioCvExperienceFixture[];
  softSkills: PortfolioCvSoftSkillFixture[];
  additionalInformation: PortfolioCvAdditionalFixture[];
}

const portfolioCv = JSON.parse(
  readFileSync(fixturePath, "utf8"),
) as PortfolioCvFixture;

export { portfolioCv };
