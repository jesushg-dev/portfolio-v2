/* eslint-disable @typescript-eslint/no-unused-vars */
import { ObjectId } from "bson";
import { PrismaClient } from "@prisma/client";

import { seedOwner } from "./seed-owner";
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

  const skillsByKey = await seedPortfolioSkills(prisma, {
    es: langEs.id,
    en: langEn.id,
    nl: langNl.id,
  });

  const skillJava = skillsByKey.Java;
  const skillPhp = skillsByKey.Php;
  const skillCsharp = skillsByKey.Csharp;
  const skillEntity = skillsByKey.Entity;
  const skillDotnet = skillsByKey.Dotnet;
  const skillSwagger = skillsByKey.Swagger;
  const skillNodejs = skillsByKey.Nodejs;
  const skillExpress = skillsByKey.Express;
  const skillMysql = skillsByKey.Mysql;
  const skillSqlServer = skillsByKey.SqlServer;
  const skillMongoDb = skillsByKey.MongoDb;
  const skillFirebase = skillsByKey.Firebase;
  const skillNpm = skillsByKey.Npm;
  const skillYarn = skillsByKey.Yarn;
  const skillVite = skillsByKey.Vite;
  const skillGit = skillsByKey.Git;
  const skillGithub = skillsByKey.Github;
  const skillBitbucket = skillsByKey.Bitbucket;
  const skillVscode = skillsByKey.Vscode;
  const skillPostman = skillsByKey.Postman;
  const skillGraphQL = skillsByKey.GraphQL;
  const skillPrisma = skillsByKey.Prisma;
  const skillAzure = skillsByKey.Azure;
  const skillNotion = skillsByKey.Notion;
  const skillHtml = skillsByKey.Html;
  const skillCss = skillsByKey.Css;
  const skillJavascript = skillsByKey.Javascript;
  const skillTypescript = skillsByKey.Typescript;
  const skillReact = skillsByKey.React;
  const skillNextjs = skillsByKey.Nextjs;
  const skillRedux = skillsByKey.Redux;
  const skillTailwind = skillsByKey.Tailwind;
  const skillMaterial = skillsByKey.Material;
  const skillStyled = skillsByKey.Styled;
  const skillSass = skillsByKey.Sass;
  const skillBootstrap = skillsByKey.Bootstrap;
  const skillApollo = skillsByKey.Apollo;
  const skillWebSockets = skillsByKey.WebSockets;
  const skillReactNative = skillsByKey.ReactNative;
  const skillAndroid = skillsByKey.Android;
  const skillWindforms = skillsByKey.Windforms;
  const skillDevExpress = skillsByKey.DevExpress;

  // services

  const serviceFrontendDevelopment = await prisma.service.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
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

  await seedPortfolioProjects(
    prisma,
    {
      es: langEs.id,
      en: langEn.id,
      nl: langNl.id,
    },
    skillsByKey,
  );

  await seedPortfolioCertifications(
    prisma,
    {
      es: langEs.id,
      en: langEn.id,
      nl: langNl.id,
    },
    skillsByKey,
  );

  // Create the primary owner (Jesús) and migrate the legacy `messages/*.json`
  // CV content into the new `Cv*` tables. Existing Project / Skill / Service
  // / Certification rows without a `userId` are also reassigned to the owner.
  await seedOwner(prisma);
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
