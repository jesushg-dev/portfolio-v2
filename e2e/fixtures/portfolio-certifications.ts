import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const fixturePath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../prisma/data/portfolio-certifications.json",
);

export interface PortfolioCertificationSeed {
  key: string;
  company: string;
  issuedDate: number | null;
  url: string;
  idCredential: string;
  image: string;
  type: string;
  skillKeys: string[];
  translations: {
    locale: "es" | "en" | "nl";
    title: string;
  }[];
}

export type PortfolioCertificationFixture = PortfolioCertificationSeed;

const portfolioCertifications = JSON.parse(
  readFileSync(fixturePath, "utf8"),
) as PortfolioCertificationSeed[];

export { portfolioCertifications };
