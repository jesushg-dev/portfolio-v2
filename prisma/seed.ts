/* eslint-disable @typescript-eslint/no-unused-vars */
import { ObjectId } from "bson";
import { PrismaClient } from "@prisma/client";

import { seedPortfolioCv } from "./seed-portfolio-cv";
import { seedPortfolioHome } from "./seed-portfolio-home";
import { seedPortfolioTimeline } from "./seed-portfolio-timeline";
import { seedPortfolioSoftSkills } from "./seed-portfolio-soft-skills";
import { seedPortfolioUser } from "./seed-portfolio-user";
import { seedPortfolioSkills } from "./seed-portfolio-skills";
import { seedPortfolioProjects } from "./seed-portfolio-projects";
import { seedPortfolioCertifications } from "./seed-portfolio-certifications";

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

  const serviceFrontendDevelopment = await prisma.service.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      userId,
      type: "FRONTEND",
      image: "frontend",
      ServiceTranslation: {
        createMany: {
          data: [
            {
              title: "Desarrollo frontend",
              description: "Desarrollo de interfaces de usuario.",
              appLanguageId: langEs.id,
            },
            {
              title: "Frontend development",
              description: "User interface development.",
              appLanguageId: langEn.id,
            },
            {
              title: "Frontend-Entwicklung",
              description: "Entwicklung der Benutzeroberfläche.",
              appLanguageId: langNl.id,
            },
          ],
        },
      },
    },
  });

  const serviceBackendDevelopment = await prisma.service.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      userId,
      type: "BACKEND",
      image: "backend",
      ServiceTranslation: {
        createMany: {
          data: [
            {
              title: "Desarrollo backend",
              description: "Desarrollo de servicios y APIs.",
              appLanguageId: langEs.id,
            },
            {
              title: "Backend development",
              description: "Services and APIs development.",
              appLanguageId: langEn.id,
            },
            {
              title: "Backend-Entwicklung",
              description: "Entwicklung von Diensten und APIs.",
              appLanguageId: langNl.id,
            },
          ],
        },
      },
    },
  });

  const serviceMobileDevelopment = await prisma.service.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      userId,
      type: "MOBILE",
      image: "mobile",
      ServiceTranslation: {
        createMany: {
          data: [
            {
              title: "Desarrollo móvil",
              description: "Desarrollo de aplicaciones móviles.",
              appLanguageId: langEs.id,
            },
            {
              title: "Mobile development",
              description: "Mobile applications development.",
              appLanguageId: langEn.id,
            },
            {
              title: "Mobile Entwicklung",
              description: "Entwicklung von mobilen Anwendungen.",
              appLanguageId: langNl.id,
            },
          ],
        },
      },
    },
  });

  const serviceSysAdmin = await prisma.service.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      userId,
      type: "TOOLS",
      image: "sysadmin",
      ServiceTranslation: {
        createMany: {
          data: [
            {
              title: "Administración de sistemas",
              description:
                "Administración de servidores y sistemas Web, FTP, SSH, VoIP, etc. en Linux",
              appLanguageId: langEs.id,
            },
            {
              title: "Systems administration",
              description:
                "Servers and systems administration Web, FTP, SSH, VoIP, etc. in Linux",
              appLanguageId: langEn.id,
            },
            {
              title: "Systemadministration",
              description:
                "Server- und Systemadministration Web, FTP, SSH, VoIP, etc. in Linux",
              appLanguageId: langNl.id,
            },
          ],
        },
      },
    },
  });

  const serviceCyberSecurity = await prisma.service.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      userId,
      type: "TOOLS",
      image: "cybersecurity",
      ServiceTranslation: {
        createMany: {
          data: [
            {
              title: "Ciberseguridad",
              description:
                "Auditorías de seguridad, análisis de vulnerabilidades, pentesting, etc.",
              appLanguageId: langEs.id,
            },
            {
              title: "Cybersecurity",
              description:
                "Security audits, vulnerability analysis, pentesting, etc.",
              appLanguageId: langEn.id,
            },
            {
              title: "Cybersicherheit",
              description:
                "Sicherheitsaudits, Schwachstellenanalyse, Pentesting, etc.",
              appLanguageId: langNl.id,
            },
          ],
        },
      },
    },
  });

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
