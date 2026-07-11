import { PrismaClient } from "@prisma/client";

import { seedPortfolioCv } from "./seed-portfolio-cv";
import { seedPortfolioHome } from "./seed-portfolio-home";
import { seedPortfolioTimeline } from "./seed-portfolio-timeline";
import { seedPortfolioSoftSkills } from "./seed-portfolio-soft-skills";
import { seedPortfolioUser } from "./seed-portfolio-user";
import { seedPortfolioSkills } from "./seed-portfolio-skills";
import { seedPortfolioProjects } from "./seed-portfolio-projects";
import { seedPortfolioCertifications } from "./seed-portfolio-certifications";
import { seedPortfolioServices } from "./seed-portfolio-services";

const prisma = new PrismaClient();

async function main() {
  const langEs = await prisma.appLanguage.upsert({
    where: { code: "es" },
    update: {},
    create: {
      code: "es",
      name: "Spanish",
    },
  });

  const langEn = await prisma.appLanguage.upsert({
    where: { code: "en" },
    update: {},
    create: {
      code: "en",
      name: "English",
    },
  });

  const langNl = await prisma.appLanguage.upsert({
    where: { code: "nl" },
    update: {},
    create: {
      code: "nl",
      name: "Dutch",
    },
  });

  const langIds = {
    es: langEs.id,
    en: langEn.id,
    nl: langNl.id,
  };

  const { userId } = await seedPortfolioUser(prisma);

  const skillsByKey = await seedPortfolioSkills(prisma, langIds, userId);

  // services
  await prisma.service.deleteMany({ where: { userId } });

  console.log("Seeding services...");
  await seedPortfolioServices(
    prisma,
    { es: langEs.id, en: langEn.id, nl: langNl.id },
    userId,
  );

  await seedPortfolioProjects(prisma, langIds, skillsByKey, userId);

  await seedPortfolioCertifications(prisma, langIds, skillsByKey, userId);

  await seedPortfolioCv(prisma, userId, skillsByKey);

  await seedPortfolioHome(prisma, userId, langIds);

  await seedPortfolioTimeline(prisma, userId);

  await seedPortfolioSoftSkills(prisma, userId);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
