import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const fixturePath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../prisma/data/portfolio-profile.json",
);

const portfolioProfile = JSON.parse(
  readFileSync(fixturePath, "utf8"),
) as PortfolioProfileFixture;

export interface PortfolioProfileFixture {
  name: string;
  username: string;
  displayName: string;
  defaultLocale: "es" | "en" | "nl";
  cvPdfUrl: string;
  photoUrl: string;
}

export { portfolioProfile };
