/* eslint-disable @typescript-eslint/no-unused-vars */
import { readFileSync } from "node:fs";
import { ObjectId } from "bson";
import { PrismaClient, type StackType } from "@prisma/client";

interface CertificationSeed {
  company: string;
  issuedDate: number;
  url: string;
  idCredential: string;
  image: string;
  type: StackType;
  translations: { title: string }[];
}

const certifications = JSON.parse(
  readFileSync(new URL("./data/certifications.json", import.meta.url), "utf8"),
) as CertificationSeed[];
import { seedOwner } from "./seed-owner";
import { seedPortfolioSkills } from "./seed-portfolio-skills";

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

  // projects
  const projectPortfolio = await prisma.project.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      image: "portf-1_bkhwxr",
      type: "FRONTEND",
      githubUrl: "https://github.com/jess232017/portfolio-v2",
      websiteUrl: "",
      // websiteUrl: 'https://www.jesushg.com/',
      isPrivate: false,
      ProjectTranslation: {
        createMany: {
          data: [
            {
              title: "Portfolio",
              description:
                "Pagina web de mi portafolio personal en donde expongo mis habilidades y conocimientos de forma dinámica.",
              appLanguageId: langEs.id,
            },
            {
              title: "Portfolio",
              description:
                "My personal portfolio website where I expose my skills and knowledge in a dynamic way.",
              appLanguageId: langEn.id,
            },
            {
              title: "Portfolio",
              description:
                "Mijn persoonlijke portfoliowebsite waar ik mijn vaardigheden en kennis op een dynamische manier blootleg.",
              appLanguageId: langNl.id,
            },
          ],
        },
      },
      ProjectSkill: {
        createMany: {
          data: [
            { skillId: skillReact.id },
            { skillId: skillNextjs.id },
            { skillId: skillTailwind.id },
            { skillId: skillTypescript.id },
            { skillId: skillPrisma.id },
            { skillId: skillMongoDb.id },
          ],
        },
      },
    },
  });

  const projectRickAndMorty = await prisma.project.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      type: "FRONTEND",
      image: "Rick_and_morty_dn7xnz",
      githubUrl: "https://github.com/jess232017/rick-and-morty",
      websiteUrl: "https://rick-and-morty-virid.vercel.app/",
      isPrivate: false,
      ProjectTranslation: {
        createMany: {
          data: [
            {
              title: "Rick y Morty | Wiki",
              description:
                "Aplicación web para consultar los personajes de la serie Rick y Morty.",
              appLanguageId: langEs.id,
            },
            {
              title: "Rick and Morty | Wiki",
              description:
                "Web application to consult the characters of the Rick and Morty series.",
              appLanguageId: langEn.id,
            },
            {
              title: "Rick und Morty | Wiki",
              description:
                "Webtoepassing om de personages van de Rick and Morty-serie te raadplegen.",
              appLanguageId: langNl.id,
            },
          ],
        },
      },
      ProjectSkill: {
        createMany: {
          data: [{ skillId: skillReact.id }, { skillId: skillBootstrap.id }],
        },
      },
    },
  });

  const projectSoftSkillsQuiz = await prisma.project.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      type: "FRONTEND",
      image: "soft-skill-quiz_rqnzmm",
      githubUrl: "https://github.com/jess232017/SoftSkill-Quiz",
      websiteUrl: "https://soft-skill-quiz.vercel.app/",
      isPrivate: false,
      ProjectTranslation: {
        createMany: {
          data: [
            {
              title: "Soft Skills Quiz",
              description:
                "Aplicación web que permite realizar un test de habilidades blandas para desarrolladores.",
              appLanguageId: langEs.id,
            },
            {
              title: "Soft Skills Quiz",
              description:
                "Web application that allows you to take a test of soft skills for developers.",
              appLanguageId: langEn.id,
            },
            {
              title: "Soft Skills Quiz",
              description:
                "Webapplicatie waarmee je een softwaretest voor ontwikkelaars kunt doen.",
              appLanguageId: langNl.id,
            },
          ],
        },
      },
      ProjectSkill: {
        createMany: {
          data: [
            { skillId: skillReact.id },
            { skillId: skillTailwind.id },
            { skillId: skillTypescript.id },
          ],
        },
      },
    },
  });

  const projectMusaEcommerce = await prisma.project.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      type: "FRONTEND",
      image: "musa-client_blxhyy",
      githubUrl: "musa-client_blxhyy",
      // websiteUrl: 'https://www.musafruit.com/',
      websiteUrl: "",
      isPrivate: true,
      ProjectTranslation: {
        createMany: {
          data: [
            {
              title: "Musa Ecommerce",
              description:
                "Aplicación web para la venta de productos perecederos.",
              appLanguageId: langEs.id,
            },
            {
              title: "Musa Ecommerce",
              description:
                "Web application for the sale of perishable products.",
              appLanguageId: langEn.id,
            },
            {
              title: "Musa Ecommerce",
              description:
                "Webapplicatie voor de verkoop van bederfelijke producten.",
              appLanguageId: langNl.id,
            },
          ],
        },
      },
      ProjectSkill: {
        createMany: {
          data: [
            { skillId: skillNextjs.id },
            { skillId: skillTailwind.id },
            { skillId: skillTypescript.id },
          ],
        },
      },
    },
  });

  const projectMusaAdmin = await prisma.project.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      type: "FRONTEND",
      image: "musa-admin_oufeum",
      githubUrl: "musa-admin_oufeum",
      websiteUrl: "",
      isPrivate: true,
      ProjectTranslation: {
        createMany: {
          data: [
            {
              title: "Musa Admin",
              description:
                "Aplicación web para la administración de la tienda online Musa Ecommerce.",
              appLanguageId: langEs.id,
            },
            {
              title: "Musa Admin",
              description:
                "Web application for the administration of the online store Musa Ecommerce.",
              appLanguageId: langEn.id,
            },
            {
              title: "Musa Admin",
              description:
                "WWebapplicatie voor de administratie van de online winkel Musa Ecommerce.",
              appLanguageId: langNl.id,
            },
          ],
        },
      },
      ProjectSkill: {
        createMany: {
          data: [
            { skillId: skillReact.id },
            { skillId: skillTailwind.id },
            { skillId: skillTypescript.id },
          ],
        },
      },
    },
  });

  const projectCovid19 = await prisma.project.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      type: "FRONTEND",
      image: "portf-2_crm7bn",
      githubUrl: "https://github.com/jess232017/SensorTemperatura",
      websiteUrl: "https://stc-uni.netlify.app/",
      isPrivate: false,
      ProjectTranslation: {
        createMany: {
          data: [
            {
              title: "Sistema de Control de Temperatura",
              description:
                "Proyecto Web que permite registrar el ingreso al recinto de los estudiantes y su temperatura.",
              appLanguageId: langEs.id,
            },
            {
              title: "Temperature Control System",
              description:
                "Web project that allows to register the entry of the students and their temperature.",
              appLanguageId: langEn.id,
            },
            {
              title: "Temperaturkontrollsystem",
              description:
                "Webproject voor het registreren van de binnenkomst van studenten en hun temperatuur.",
              appLanguageId: langNl.id,
            },
          ],
        },
      },
      ProjectSkill: {
        createMany: {
          data: [
            { skillId: skillHtml.id },
            { skillId: skillCss.id },
            { skillId: skillJavascript.id },
            { skillId: skillSass.id },
            { skillId: skillBootstrap.id },
            { skillId: skillFirebase.id },
          ],
        },
      },
    },
  });

  const projectLotty = await prisma.project.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      type: "FRONTEND",
      image: "loto-nic_mtnoh7",
      githubUrl: "https://github.com/jess232017/Loto-Nicaragua",
      websiteUrl: "https://loto-nicaragua.vercel.app/",
      isPrivate: false,
      ProjectTranslation: {
        createMany: {
          data: [
            {
              title: "Lotty",
              description:
                "Aplicación web para consultar los resultados de la loto de Nicaragua.",
              appLanguageId: langEs.id,
            },
            {
              title: "Lotty",
              description:
                "Web application to consult the results of the Nicaraguan lottery.",
              appLanguageId: langEn.id,
            },
            {
              title: "Lotty",
              description:
                "Webapplicatie om de resultaten van de Nicaraguaanse loterij te raadplegen.",
              appLanguageId: langNl.id,
            },
          ],
        },
      },
      ProjectSkill: {
        createMany: {
          data: [{ skillId: skillReact.id }, { skillId: skillBootstrap.id }],
        },
      },
    },
  });

  const projectLottyApi = await prisma.project.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      type: "BACKEND",
      image: "api-rest_u56jdu",
      githubUrl: "https://github.com/jess232017/Loto-Api",
      websiteUrl: "",
      isPrivate: false,
      ProjectTranslation: {
        createMany: {
          data: [
            {
              title: "Lotty Api",
              description: "Api Rest para la aplicación móvil Lucky App.",
              appLanguageId: langEs.id,
            },
            {
              title: "Lotty Api",
              description: "Rest Api for the mobile application Lucky App.",
              appLanguageId: langEn.id,
            },
            {
              title: "Lotty Api",
              description: "Rest Api voor de mobiele applicatie Lucky App.",
              appLanguageId: langNl.id,
            },
          ],
        },
      },
      ProjectSkill: {
        createMany: {
          data: [{ skillId: skillNodejs.id }, { skillId: skillMysql.id }],
        },
      },
    },
  });

  const projectTechService = await prisma.project.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      type: "MOBILE",
      image: "Tech_Service_xjuilx",
      githubUrl: "https://github.com/jess232017/TechService",
      websiteUrl: "",
      isPrivate: false,
      ProjectTranslation: {
        createMany: {
          data: [
            {
              title: "Tech Service",
              description:
                "Aplicación móvil Android para el control de servicios de reparación brindados a dispositivos tecnológicos.",
              appLanguageId: langEs.id,
            },
            {
              title: "Tech Service",
              description:
                "Android mobile application for the control of repair services provided to technological devices.",
              appLanguageId: langEn.id,
            },
            {
              title: "Tech Service",
              description:
                "Mobiele Android-toepassing voor de controle van reparatiediensten voor technologische apparaten.",
              appLanguageId: langNl.id,
            },
          ],
        },
      },
      ProjectSkill: {
        createMany: {
          data: [
            { skillId: skillJava.id },
            { skillId: skillAndroid.id },
            { skillId: skillPhp.id },
          ],
        },
      },
    },
  });

  const projectTechServiceApi = await prisma.project.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      type: "BACKEND",
      image: "api-rest_szxffg",
      githubUrl: "https://github.com/jess232017/Api_TechService",
      isPrivate: false,
      ProjectTranslation: {
        createMany: {
          data: [
            {
              title: "Tech Service API",
              description:
                "API REST para el control de servicios de reparación brindados a dispositivos tecnológicos.",
              appLanguageId: langEs.id,
            },
            {
              title: "Tech Service API",
              description:
                "REST API for the control of repair services provided to technological devices.",
              appLanguageId: langEn.id,
            },
            {
              title: "Tech Service API",
              description:
                "REST API voor het beheer van reparatieservices voor technologische apparaten.",
              appLanguageId: langNl.id,
            },
          ],
        },
      },
      ProjectSkill: {
        createMany: {
          data: [{ skillId: skillPhp.id }, { skillId: skillMysql.id }],
        },
      },
    },
  });

  const projectPosInventory = await prisma.project.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      type: "DESKTOP",
      image: "portf-5_f1z3la",
      githubUrl: "https://github.com/jess232017/Control-Inventario-y-Ventas",
      websiteUrl: "",
      isPrivate: false,
      ProjectTranslation: {
        createMany: {
          data: [
            {
              title: "Control de Inventario y Ventas",
              description:
                "Sistema de control de inventario y ventas para una tienda de ropa.",
              appLanguageId: langEs.id,
            },
            {
              title: "Inventory and Sales Control",
              description:
                "Inventory and sales control system for a clothing store.",
              appLanguageId: langEn.id,
            },
            {
              title: "Inventar- und Verkaufskontrolle",
              description:
                "Inventaris- en verkoopcontrolesysteem voor een kledingwinkel.",
              appLanguageId: langNl.id,
            },
          ],
        },
      },
      ProjectSkill: {
        createMany: {
          data: [
            { skillId: skillCsharp.id },
            { skillId: skillSqlServer.id },
            { skillId: skillWindforms.id },
            { skillId: skillDevExpress.id },
          ],
        },
      },
    },
  });

  const projectFoodDelivery = await prisma.project.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      type: "MOBILE",
      image: "port-6_avknde",
      githubUrl: "https://github.com/jess232017/Food-Service",
      websiteUrl: "",
      isPrivate: false,
      ProjectTranslation: {
        createMany: {
          data: [
            {
              title: "Food Service",
              description:
                "Aplicación móvil Android para el control de pedidos de comida.",
              appLanguageId: langEs.id,
            },
            {
              title: "Food Service",
              description:
                "Android mobile application for the control of food orders.",
              appLanguageId: langEn.id,
            },
            {
              title: "Food Service",
              description:
                "Mobiele Android-applicatie voor de controle van voedselbestellingen.",
              appLanguageId: langNl.id,
            },
          ],
        },
      },
      ProjectSkill: {
        createMany: {
          data: [
            { skillId: skillJava.id },
            { skillId: skillAndroid.id },
            { skillId: skillMysql.id },
          ],
        },
      },
    },
  });

  const projectEcommerce = await prisma.project.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      type: "FRONTEND",
      image: "port-7png_jclbvc",
      githubUrl: "https://github.com/jess232017/Tienda-AdminMUI",
      websiteUrl: "",
      isPrivate: false,
      ProjectTranslation: {
        createMany: {
          data: [
            {
              title: "Tienda Cliente",
              description:
                "Aplicación web para la compra de productos en línea.",
              appLanguageId: langEs.id,
            },
            {
              title: "Store Client",
              description: "Web application for online product purchase.",
              appLanguageId: langEn.id,
            },
            {
              title: "Store Client",
              description: "Webtoepassing voor online aankoop van producten.",
              appLanguageId: langNl.id,
            },
          ],
        },
      },
      ProjectSkill: {
        createMany: {
          data: [
            { skillId: skillReact.id },
            { skillId: skillRedux.id },
            { skillId: skillMaterial.id },
            { skillId: skillSass.id },
          ],
        },
      },
    },
  });

  const projectEcommerceAdmin = await prisma.project.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      type: "FRONTEND",
      image: "port-8_njbkie",
      githubUrl: "https://github.com/jess232017/Tienda-Admin",
      websiteUrl: "https://tiendajs-admin.netlify.app/",
      isPrivate: false,
      ProjectTranslation: {
        createMany: {
          data: [
            {
              title: "Tienda Admin",
              description: "Administrador de una tienda online.",
              appLanguageId: langEs.id,
            },
            {
              title: "Store Admin",
              description: "Administrator of an online store.",
              appLanguageId: langEn.id,
            },
            {
              title: "Store Admin",
              description: "Beheerder van een online winkel.",
              appLanguageId: langNl.id,
            },
          ],
        },
      },
      ProjectSkill: {
        createMany: {
          data: [
            { skillId: skillReact.id },
            { skillId: skillRedux.id },
            { skillId: skillMaterial.id },
            { skillId: skillSass.id },
          ],
        },
      },
    },
  });

  const projectEcommerceApi = await prisma.project.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      type: "BACKEND",
      image: "api-rest_yaux6m",
      githubUrl: "-",
      websiteUrl: "",
      isPrivate: false,
      ProjectTranslation: {
        createMany: {
          data: [
            {
              title: "Tienda Api",
              description:
                "Api Rest para el administrador de una tienda online.",
              appLanguageId: langEs.id,
            },
            {
              title: "Store Api",
              description: "Rest Api for the administrator of an online store.",
              appLanguageId: langEn.id,
            },
            {
              title: "Store Api",
              description: "Rest Api voor de beheerder van een online winkel.",
              appLanguageId: langNl.id,
            },
          ],
        },
      },
      ProjectSkill: {
        createMany: {
          data: [
            { skillId: skillCsharp.id },
            { skillId: skillSqlServer.id },
            { skillId: skillEntity.id },
            { skillId: skillDotnet.id },
            { skillId: skillSwagger.id },
          ],
        },
      },
    },
  });

  const projectKwhMonitor = await prisma.project.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      type: "MOBILE",
      image: "port-9_lw4apk",
      githubUrl: "https://github.com/jess232017/Gestor-de-Consumo-Eletrico",
      websiteUrl: "",
      isPrivate: false,
      ProjectTranslation: {
        createMany: {
          data: [
            {
              title: "Kwh Monitor",
              description:
                "Aplicación móvil Android para el control de consumo de energía eléctrica.",
              appLanguageId: langEs.id,
            },
            {
              title: "Kwh Monitor",
              description:
                "Android mobile application for the control of electricity consumption.",
              appLanguageId: langEn.id,
            },
            {
              title: "Kwh Monitor",
              description:
                "Mobiele Android-toepassing voor de controle van het elektriciteitsverbruik.",
              appLanguageId: langNl.id,
            },
          ],
        },
      },
      ProjectSkill: {
        createMany: {
          data: [
            { skillId: skillJava.id },
            { skillId: skillAndroid.id },
            { skillId: skillMysql.id },
            { skillId: skillNodejs.id },
          ],
        },
      },
    },
  });

  const projectKwhMonitorApi = await prisma.project.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      type: "BACKEND",
      image: "api-rest_u56jdu",
      githubUrl: "https://github.com/jess232017/Consultar-Consumo-API",
      websiteUrl: "",
      isPrivate: false,
      ProjectTranslation: {
        createMany: {
          data: [
            {
              title: "Kwh Monitor Api",
              description: "Api Rest para la aplicación móvil Kwh Monitor.",
              appLanguageId: langEs.id,
            },
            {
              title: "Kwh Monitor Api",
              description: "Rest Api for the mobile application Kwh Monitor.",
              appLanguageId: langEn.id,
            },
            {
              title: "Kwh Monitor Api",
              description: "Rest Api voor de mobiele toepassing Kwh Monitor.",
              appLanguageId: langNl.id,
            },
          ],
        },
      },
      ProjectSkill: {
        createMany: {
          data: [{ skillId: skillNodejs.id }, { skillId: skillMysql.id }],
        },
      },
    },
  });

  const projectLuckyApp = await prisma.project.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      type: "MOBILE",
      image: "port-10_f80urb",
      githubUrl: "https://github.com/jess232017/Rifa-App",
      websiteUrl: "",
      isPrivate: false,
      ProjectTranslation: {
        createMany: {
          data: [
            {
              title: "Lucky App",
              description:
                "Aplicación móvil Android para el control de pedidos de comida.",
              appLanguageId: langEs.id,
            },
            {
              title: "Lucky App",
              description:
                "Android mobile application for the control of food orders.",
              appLanguageId: langEn.id,
            },
            {
              title: "Lucky App",
              description:
                "Mobiele Android-applicatie voor de controle van voedselbestellingen.",
              appLanguageId: langNl.id,
            },
          ],
        },
      },
      ProjectSkill: {
        createMany: {
          data: [{ skillId: skillJava.id }, { skillId: skillAndroid.id }],
        },
      },
    },
  });

  const projectYourFarm = await prisma.project.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      type: "MOBILE",
      image: "port-11_cng5re",
      githubUrl: "https://github.com/jess232017/Tu-Finca",
      websiteUrl: "",
      isPrivate: false,

      ProjectTranslation: {
        createMany: {
          data: [
            {
              title: "Tu finca",
              description:
                "Aplicación móvil Android para el control de pedidos de comida.",
              appLanguageId: langEs.id,
            },
            {
              title: "Your farm",
              description:
                "Android mobile application for the control of food orders.",
              appLanguageId: langEn.id,
            },
            {
              title: "Your farm",
              description:
                "Mobiele Android-applicatie voor de controle van voedselbestellingen.",
              appLanguageId: langNl.id,
            },
          ],
        },
      },
      ProjectSkill: {
        createMany: {
          data: [{ skillId: skillJava.id }, { skillId: skillAndroid.id }],
        },
      },
    },
  });

  await seedCertificates(langEs.id, langEn.id, langNl.id);

  // Create the primary owner (Jesús) and migrate the legacy `messages/*.json`
  // CV content into the new `Cv*` tables. Existing Project / Skill / Service
  // / Certification rows without a `userId` are also reassigned to the owner.
  await seedOwner(prisma);
}

// seed certificates data
async function seedCertificates(esId: string, enId: string, deId: string) {
  const certPromises = certifications.map(
    async (certificate: CertificationSeed) => {
      const { translations, ...rest } = certificate;

      const newCertificate = await prisma.certification.upsert({
        where: { id: new ObjectId().toString() },
        update: {},
        create: {
          ...rest,
          type: [certificate.type],
          CertificationTranslation: {
            createMany: {
              data: [
                {
                  title: translations[0]?.title ?? "",
                  appLanguageId: esId,
                },
                {
                  title: translations[1]?.title ?? "",
                  appLanguageId: enId,
                },
                {
                  title: translations[2]?.title ?? "",
                  appLanguageId: deId,
                },
              ],
            },
          },
        },
      });

      return newCertificate;
    },
  );

  const result = await Promise.all(certPromises);
  return result;
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
