import { ObjectId } from "bson";
import { PrismaClient } from "@prisma/client";

import certifications from "./data/certifications.json";

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

  const langDe = await prisma.appLanguage.upsert({
    where: { code: "nl" },
    update: {},
    create: {
      code: "nl",
      name: "Dutch",
    },
  });

  const skillJava = await prisma.skill.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      title: "Java",
      type: "BACKEND",
      image: "apachenetbeanside",
      SkillTranslation: {
        createMany: {
          data: [
            {
              description:
                "Lenguaje de programación orientado a objetos, independiente de la plataforma hardware.",
              urlWiki:
                "https://es.wikipedia.org/wiki/Java_(lenguaje_de_programaci%C3%B3n)",
              appLanguageId: langEs.id,
            },
            {
              description:
                "Object-oriented programming language, independent of the hardware platform.",
              urlWiki:
                "https://en.wikipedia.org/wiki/Java_(programming_language)",
              appLanguageId: langEn.id,
            },
            {
              description:
                "Objektorientierte Programmiersprache, unabhängig von der Hardwareplattform.",
              urlWiki:
                "https://de.wikipedia.org/wiki/Java_(Programmiersprache)",
              appLanguageId: langDe.id,
            },
          ],
        },
      },
    },
  });

  const skillPhp = await prisma.skill.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      title: "PHP",
      type: "BACKEND",
      image: "php",
      SkillTranslation: {
        createMany: {
          data: [
            {
              description:
                "Lenguaje de programación de propósito general de código del lado del servidor originalmente diseñado para el desarrollo web de contenido dinámico.",
              urlWiki: "https://es.wikipedia.org/wiki/PHP",
              appLanguageId: langEs.id,
            },
            {
              description:
                "General-purpose server-side scripting language originally designed for web development to produce dynamic web pages.",
              urlWiki: "https://en.wikipedia.org/wiki/PHP",
              appLanguageId: langEn.id,
            },
            {
              description:
                "Allgemeine serverseitige Skriptsprache, die ursprünglich für die Webentwicklung zur Erstellung dynamischer Webseiten entwickelt wurde.",
              urlWiki: "https://de.wikipedia.org/wiki/PHP",
              appLanguageId: langDe.id,
            },
          ],
        },
      },
    },
  });

  const skillCsharp = await prisma.skill.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      title: "C#",
      type: "BACKEND",
      image: "csharp",
      SkillTranslation: {
        createMany: {
          data: [
            {
              description:
                "Lenguaje de programación orientado a objetos desarrollado por Microsoft como parte de su plataforma .NET.",
              urlWiki: "https://es.wikipedia.org/wiki/C_Sharp",
              appLanguageId: langEs.id,
            },
            {
              description:
                "Object-oriented programming language developed by Microsoft as part of its .NET initiative.",
              urlWiki:
                "https://en.wikipedia.org/wiki/C_Sharp_(programming_language)",
              appLanguageId: langEn.id,
            },
            {
              description:
                "Objektorientierte Programmiersprache, die von Microsoft als Teil seiner .NET-Initiative entwickelt wurde.",
              urlWiki: "https://de.wikipedia.org/wiki/C_Sharp",
              appLanguageId: langDe.id,
            },
          ],
        },
      },
    },
  });

  const skillEntity = await prisma.skill.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      title: "Entity Framework",
      type: "BACKEND",
      image: "dotnet",
      SkillTranslation: {
        createMany: {
          data: [
            {
              description:
                "Framework de código abierto para el desarrollo de aplicaciones basadas en el patrón de diseño repositorio y el mapeo objeto-relacional (ORM).",
              urlWiki: "https://es.wikipedia.org/wiki/Entity_Framework",
              appLanguageId: langEs.id,
            },
            {
              description:
                "Open-source framework for developing applications based on the repository pattern and the object-relational mapping (ORM).",
              urlWiki: "https://en.wikipedia.org/wiki/Entity_Framework",
              appLanguageId: langEn.id,
            },
            {
              description:
                "Open-Source-Framework für die Entwicklung von Anwendungen auf der Grundlage des Repository-Musters und der objektorientierten Abbildung (ORM).",
              urlWiki: "https://de.wikipedia.org/wiki/Entity_Framework",
              appLanguageId: langDe.id,
            },
          ],
        },
      },
    },
  });

  const skillDotnet = await prisma.skill.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      title: ".NET",
      type: "BACKEND",
      image: "dotnet",
      SkillTranslation: {
        createMany: {
          data: [
            {
              description:
                "Plataforma de desarrollo de software de código abierto para la creación de aplicaciones web, móviles y de escritorio.",
              urlWiki: "https://es.wikipedia.org/wiki/.NET",
              appLanguageId: langEs.id,
            },
            {
              description:
                "Open-source software development platform to create web, mobile, and desktop apps.",
              urlWiki: "https://en.wikipedia.org/wiki/.NET",
              appLanguageId: langEn.id,
            },
            {
              description:
                "Open-Source-Software-Entwicklungsplattform zur Erstellung von Web-, Mobil- und Desktopanwendungen.",
              urlWiki: "https://de.wikipedia.org/wiki/.NET",
              appLanguageId: langDe.id,
            },
          ],
        },
      },
    },
  });

  const skillSwagger = await prisma.skill.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      title: "Swagger",
      type: "BACKEND",
      image: "swagger",
      SkillTranslation: {
        createMany: {
          data: [
            {
              description:
                "Herramienta de código abierto para el diseño, construcción, documentación y consumo de servicios web RESTful.",
              urlWiki: "https://es.wikipedia.org/wiki/Swagger",
              appLanguageId: langEs.id,
            },
            {
              description:
                "Open-source tool for designing, building, documenting, and using RESTful web services.",
              urlWiki: "https://en.wikipedia.org/wiki/Swagger_(software)",
              appLanguageId: langEn.id,
            },
            {
              description:
                "Open-Source-Tool zum Entwerfen, Erstellen, Dokumentieren und Verwenden von RESTful-Webdiensten.",
              urlWiki: "https://de.wikipedia.org/wiki/Swagger_(Software)",
              appLanguageId: langDe.id,
            },
          ],
        },
      },
    },
  });

  const skillNodejs = await prisma.skill.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      title: "Node.js",
      type: "BACKEND",
      image: "nodedotjs",
      SkillTranslation: {
        createMany: {
          data: [
            {
              description:
                "Entorno de ejecución para JavaScript construido con el motor de JavaScript V8 de Chrome.",
              urlWiki: "https://es.wikipedia.org/wiki/Node.js",
              appLanguageId: langEs.id,
            },
            {
              description:
                "JavaScript runtime built on Chrome's V8 JavaScript engine.",
              urlWiki: "https://en.wikipedia.org/wiki/Node.js",
              appLanguageId: langEn.id,
            },
            {
              description:
                "JavaScript-Laufzeitumgebung, die auf der JavaScript-Engine V8 von Chrome basiert.",
              urlWiki: "https://de.wikipedia.org/wiki/Node.js",
              appLanguageId: langDe.id,
            },
          ],
        },
      },
    },
  });

  const skillExpress = await prisma.skill.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      title: "Express",
      type: "BACKEND",
      image: "express",
      SkillTranslation: {
        createMany: {
          data: [
            {
              description:
                "Framework de Node.js para aplicaciones web y API REST. Es minimalista y flexible, proporcionando un conjunto sólido de características para aplicaciones web y móviles.",
              urlWiki: "https://es.wikipedia.org/wiki/Express.js",
              appLanguageId: langEs.id,
            },
            {
              description:
                "Node.js framework for web applications and REST API. It is minimalist and flexible, providing a solid set of features for web and mobile applications.",
              urlWiki: "https://en.wikipedia.org/wiki/Express.js",
              appLanguageId: langEn.id,
            },
            {
              description:
                "Node.js-Framework für Webanwendungen und REST-API. Es ist minimalistisch und flexibel und bietet einen soliden Satz von Funktionen für Web- und Mobile-Anwendungen.",
              urlWiki: "https://de.wikipedia.org/wiki/Express.js",
              appLanguageId: langDe.id,
            },
          ],
        },
      },
    },
  });

  // Database
  const skillMysql = await prisma.skill.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      title: "MySQL",
      type: "BACKEND",
      image: "mysql",
      SkillTranslation: {
        createMany: {
          data: [
            {
              description:
                "Sistema de gestión de bases de datos relacional, código abierto y multiplataforma, que se usa principalmente para el desarrollo de aplicaciones web.",
              urlWiki: "https://es.wikipedia.org/wiki/MySQL",
              appLanguageId: langEs.id,
            },
            {
              description:
                "Relational database management system, open-source and cross-platform, used mainly for web development.",
              urlWiki: "https://en.wikipedia.org/wiki/MySQL",
              appLanguageId: langEn.id,
            },
            {
              description:
                "Relationales Datenbankmanagementsystem, Open-Source und plattformübergreifend, das hauptsächlich für die Webentwicklung verwendet wird.",
              urlWiki: "https://de.wikipedia.org/wiki/MySQL",
              appLanguageId: langDe.id,
            },
          ],
        },
      },
    },
  });

  const skillSqlServer = await prisma.skill.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      title: "SQL Server",
      type: "BACKEND",
      image: "microsoftsqlserver",
      SkillTranslation: {
        createMany: {
          data: [
            {
              description:
                "Sistema de gestión de bases de datos relacional desarrollado por Microsoft como parte de su familia de productos Microsoft SQL Server.",
              urlWiki: "https://es.wikipedia.org/wiki/Microsoft_SQL_Server",
              appLanguageId: langEs.id,
            },
            {
              description:
                "Relational database management system developed by Microsoft as part of its Microsoft SQL Server family.",
              urlWiki: "https://en.wikipedia.org/wiki/Microsoft_SQL_Server",
              appLanguageId: langEn.id,
            },
            {
              description:
                "Relationales Datenbankmanagementsystem, das von Microsoft als Teil seiner Microsoft SQL Server-Familie entwickelt wurde.",
              urlWiki: "https://de.wikipedia.org/wiki/Microsoft_SQL_Server",
              appLanguageId: langDe.id,
            },
          ],
        },
      },
    },
  });

  const skillMongoDb = await prisma.skill.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      title: "MongoDB",
      type: "BACKEND",
      image: "mongodb",
      SkillTranslation: {
        createMany: {
          data: [
            {
              description:
                "Sistema de gestión de bases de datos no relacional orientado a documentos y de código abierto.",
              urlWiki: "https://es.wikipedia.org/wiki/MongoDB",
              appLanguageId: langEs.id,
            },
            {
              description:
                "Document-oriented, NoSQL, and open-source database.",
              urlWiki: "https://en.wikipedia.org/wiki/MongoDB",
              appLanguageId: langEn.id,
            },
            {
              description:
                "Dokumentenorientierte, NoSQL- und Open-Source-Datenbank.",
              urlWiki: "https://de.wikipedia.org/wiki/MongoDB",
              appLanguageId: langDe.id,
            },
          ],
        },
      },
    },
  });

  const skillFirebase = await prisma.skill.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      title: "Firebase",
      type: "BACKEND",
      image: "firebase",
      SkillTranslation: {
        createMany: {
          data: [
            {
              description:
                "Plataforma de desarrollo de aplicaciones móviles y web, creada por Firebase, Inc. en 2011, adquirida por Google en 2014.",
              urlWiki: "https://es.wikipedia.org/wiki/Firebase",
              appLanguageId: langEs.id,
            },
            {
              description:
                "Mobile and web application development platform created by Firebase, Inc. in 2011, acquired by Google in 2014.",
              urlWiki: "https://en.wikipedia.org/wiki/Firebase",
              appLanguageId: langEn.id,
            },
            {
              description:
                "Mobile und Web Application Development Platform, die 2011 von Firebase, Inc. entwickelt und 2014 von Google übernommen wurde.",
              urlWiki: "https://de.wikipedia.org/wiki/Firebase",
              appLanguageId: langDe.id,
            },
          ],
        },
      },
    },
  });

  /** ****************Tools */
  const skillNpm = await prisma.skill.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      title: "NPM",
      type: "TOOLS",
      image: "npm",
      SkillTranslation: {
        createMany: {
          data: [
            {
              description:
                "Administrador de paquetes para el lenguaje de programación JavaScript, el ecosistema más grande de librerías de código abierto en el mundo.",
              urlWiki: "https://es.wikipedia.org/wiki/Npm",
              appLanguageId: langEs.id,
            },
            {
              description:
                "Package manager for the JavaScript programming language, the largest ecosystem of open-source libraries in the world.",
              urlWiki: "https://en.wikipedia.org/wiki/Npm_(software)",
              appLanguageId: langEn.id,
            },
            {
              description:
                "Package Manager für die Programmiersprache JavaScript, das größte Ökosystem von Open-Source-Bibliotheken der Welt.",
              urlWiki: "https://de.wikipedia.org/wiki/Npm_(Software)",
              appLanguageId: langDe.id,
            },
          ],
        },
      },
    },
  });

  const skillYarn = await prisma.skill.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      title: "Yarn",
      type: "TOOLS",
      image: "yarn",
      SkillTranslation: {
        createMany: {
          data: [
            {
              description:
                "Administrador de paquetes para el lenguaje de programación JavaScript, el ecosistema más grande de librerías de código abierto en el mundo.",
              urlWiki:
                "https://es.wikipedia.org/wiki/Yarn_(administrador_de_paquetes)",
              appLanguageId: langEs.id,
            },
            {
              description:
                "Package manager for the JavaScript programming language, the largest ecosystem of open-source libraries in the world.",
              urlWiki: "https://en.wikipedia.org/wiki/Yarn_(package_manager)",
              appLanguageId: langEn.id,
            },
            {
              description:
                "Package Manager für die Programmiersprache JavaScript, das größte Ökosystem von Open-Source-Bibliotheken der Welt.",
              urlWiki: "https://de.wikipedia.org/wiki/Yarn_(Software)",
              appLanguageId: langDe.id,
            },
          ],
        },
      },
    },
  });

  const skillVite = await prisma.skill.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      title: "Vite",
      type: "TOOLS",
      image: "vite",
      SkillTranslation: {
        createMany: {
          data: [
            {
              description:
                "Paquete de herramientas de desarrollo web moderno que proporciona una experiencia de desarrollo rápida y fluida.",
              urlWiki: "https://es.wikipedia.org/wiki/Vite",
              appLanguageId: langEs.id,
            },
            {
              description:
                "Modern web development tooling that provides a fast and fluid development experience.",
              urlWiki: "https://en.wikipedia.org/wiki/Vite",
              appLanguageId: langEn.id,
            },
            {
              description:
                "Modernes Webentwicklungstooling, das ein schnelles und flüssiges Entwicklungserlebnis bietet.",
              urlWiki: "https://de.wikipedia.org/wiki/Vite",
              appLanguageId: langDe.id,
            },
          ],
        },
      },
    },
  });

  const skillGit = await prisma.skill.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      title: "Git",
      type: "TOOLS",
      image: "git",
      SkillTranslation: {
        createMany: {
          data: [
            {
              description:
                "Sistema de control de versiones distribuido, diseñado para manejar todo, desde proyectos pequeños a muy grandes, con velocidad y eficiencia.",
              urlWiki: "https://es.wikipedia.org/wiki/Git",
              appLanguageId: langEs.id,
            },
            {
              description:
                "Distributed version control system designed to handle everything from small to very large projects with speed and efficiency.",
              urlWiki: "https://en.wikipedia.org/wiki/Git",
              appLanguageId: langEn.id,
            },
            {
              description:
                "Verteiltes Versionskontrollsystem, das entwickelt wurde, um alles von kleinen bis sehr großen Projekten mit Geschwindigkeit und Effizienz zu handhaben.",
              urlWiki: "https://de.wikipedia.org/wiki/Git",
              appLanguageId: langDe.id,
            },
          ],
        },
      },
    },
  });

  const skillGithub = await prisma.skill.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      title: "Github",
      type: "TOOLS",
      image: "github",
      SkillTranslation: {
        createMany: {
          data: [
            {
              description:
                "Plataforma de desarrollo colaborativo para alojar proyectos utilizando el sistema de control de versiones Git.",
              urlWiki: "https://es.wikipedia.org/wiki/GitHub",
              appLanguageId: langEs.id,
            },
            {
              description:
                "Collaborative development platform to host projects using the Git version control system.",
              urlWiki: "https://en.wikipedia.org/wiki/GitHub",
              appLanguageId: langEn.id,
            },
            {
              description:
                "Kollaborative Entwicklungsplattform zum Hosten von Projekten mit dem Git-Versionierungssystem.",
              urlWiki: "https://de.wikipedia.org/wiki/GitHub",
              appLanguageId: langDe.id,
            },
          ],
        },
      },
    },
  });

  const skillBitbucket = await prisma.skill.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      title: "Bitbucket",
      type: "TOOLS",
      image: "bitbucket",
      SkillTranslation: {
        createMany: {
          data: [
            {
              description:
                "Plataforma de desarrollo colaborativo para alojar proyectos utilizando el sistema de control de versiones Git.",
              urlWiki: "https://es.wikipedia.org/wiki/Bitbucket",
              appLanguageId: langEs.id,
            },
            {
              description:
                "Collaborative development platform to host projects using the Git version control system.",
              urlWiki: "https://en.wikipedia.org/wiki/Bitbucket",
              appLanguageId: langEn.id,
            },
            {
              description:
                "Kollaborative Entwicklungsplattform zum Hosten von Projekten mit dem Git-Versionierungssystem.",
              urlWiki: "https://de.wikipedia.org/wiki/Bitbucket",
              appLanguageId: langDe.id,
            },
          ],
        },
      },
    },
  });

  const skillVscode = await prisma.skill.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      title: "VS Code",
      type: "TOOLS",
      image: "visualstudiocode",
      SkillTranslation: {
        createMany: {
          data: [
            {
              description:
                "Editor de código fuente desarrollado por Microsoft para Windows, Linux y macOS. Incluye soporte para depuración, control de versiones integrado, resaltado de sintaxis, finalización inteligente de código, snippets y refactoring de código.",
              urlWiki: "https://es.wikipedia.org/wiki/Visual_Studio_Code",
              appLanguageId: langEs.id,
            },
            {
              description:
                "Source code editor developed by Microsoft for Windows, Linux and macOS. It includes support for debugging, integrated version control, syntax highlighting, intelligent code completion, snippets, and code refactoring.",
              urlWiki: "https://en.wikipedia.org/wiki/Visual_Studio_Code",
              appLanguageId: langEn.id,
            },
            {
              description:
                "Source-Code-Editor, der von Microsoft für Windows, Linux und macOS entwickelt wurde. Er unterstützt Debugging, integrierte Versionskontrolle, Syntaxhervorhebung, intelligentes Code-Completion, Snippets und Code-Refactoring.",
              urlWiki: "https://de.wikipedia.org/wiki/Visual_Studio_Code",
              appLanguageId: langDe.id,
            },
          ],
        },
      },
    },
  });

  const skillPostman = await prisma.skill.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      title: "Postman",
      type: "TOOLS",
      image: "postman",
      SkillTranslation: {
        createMany: {
          data: [
            {
              description:
                "Plataforma de desarrollo colaborativo para alojar proyectos utilizando el sistema de control de versiones Git.",
              urlWiki: "https://es.wikipedia.org/wiki/GitHub",
              appLanguageId: langEs.id,
            },
            {
              description:
                "Collaborative development platform to host projects using the Git version control system.",
              urlWiki: "https://en.wikipedia.org/wiki/GitHub",
              appLanguageId: langEn.id,
            },
            {
              description:
                "Kollaborative Entwicklungsplattform zum Hosten von Projekten mit dem Git-Versionierungssystem.",
              urlWiki: "https://de.wikipedia.org/wiki/GitHub",
              appLanguageId: langDe.id,
            },
          ],
        },
      },
    },
  });

  const skillGraphQL = await prisma.skill.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      title: "GraphQL",
      type: "BACKEND",
      image: "graphql",
      SkillTranslation: {
        createMany: {
          data: [
            {
              description:
                "Lenguaje de consulta para APIs y una implementación de tiempo de ejecución para cumplir con las consultas.",
              urlWiki: "https://es.wikipedia.org/wiki/GraphQL",
              appLanguageId: langEs.id,
            },
            {
              description:
                "Query language for APIs and a runtime for fulfilling queries with existing data.",
              urlWiki: "https://en.wikipedia.org/wiki/GraphQL",
              appLanguageId: langEn.id,
            },
            {
              description:
                "Abfragesprache für APIs und eine Laufzeitumgebung zur Erfüllung von Abfragen mit vorhandenen Daten.",
              urlWiki: "https://de.wikipedia.org/wiki/GraphQL",
              appLanguageId: langDe.id,
            },
          ],
        },
      },
    },
  });

  const skillPrisma = await prisma.skill.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      title: "Prisma",
      type: "BACKEND",
      image: "prisma",
      SkillTranslation: {
        createMany: {
          data: [
            {
              description:
                "Prisma es un ORM (Object Relational Mapper) que te ayuda a trabajar con bases de datos relacionales como MySQL o PostgreSQL. Prisma te permite definir tu esquema de base de datos y generar modelos y resolvers para GraphQL o REST APIs.",
              urlWiki: "https://es.wikipedia.org/wiki/Prisma_(software)",
              appLanguageId: langEs.id,
            },
            {
              description:
                "Prisma is an ORM (Object Relational Mapper) that helps you to work with relational databases such as MySQL or PostgreSQL. Prisma lets you define your database schema and generates models and resolvers for GraphQL or REST APIs.",
              urlWiki: "https://en.wikipedia.org/wiki/Prisma_(software)",
              appLanguageId: langEn.id,
            },
            {
              description:
                "Prisma ist ein ORM (Object Relational Mapper), mit dem Sie mit relationalen Datenbanken wie MySQL oder PostgreSQL arbeiten können. Prisma ermöglicht es Ihnen, Ihr Datenbankschema zu definieren und Modelle und Resolver für GraphQL- oder REST-APIs zu generieren.",
              urlWiki: "https://de.wikipedia.org/wiki/Prisma_(software)",
              appLanguageId: langDe.id,
            },
          ],
        },
      },
    },
  });

  const skillAzure = await prisma.skill.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      title: "Azure",
      type: "TOOLS",
      image: "microsoftazure",
      SkillTranslation: {
        createMany: {
          data: [
            {
              description:
                "Plataforma de computación en la nube de Microsoft. Ofrece una amplia variedad de servicios de computación en la nube, incluidos análisis, almacenamiento en la nube, bases de datos, redes, inteligencia artificial y desarrollo de aplicaciones.",
              urlWiki: "https://es.wikipedia.org/wiki/Microsoft_Azure",
              appLanguageId: langEs.id,
            },
            {
              description:
                "Microsoft cloud computing platform. It offers a wide variety of cloud computing services including analysis, cloud storage, databases, networks, artificial intelligence and application development.",
              urlWiki: "https://en.wikipedia.org/wiki/Microsoft_Azure",
              appLanguageId: langEn.id,
            },
            {
              description:
                "Microsoft Cloud-Computing-Plattform. Es bietet eine Vielzahl von Cloud-Computing-Diensten, darunter Analyse, Cloud-Speicher, Datenbanken, Netzwerke, künstliche Intelligenz und Anwendungsentwicklung.",
              urlWiki: "https://de.wikipedia.org/wiki/Microsoft_Azure",
              appLanguageId: langDe.id,
            },
          ],
        },
      },
    },
  });

  const skillNotion = await prisma.skill.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      title: "Notion",
      type: "TOOLS",
      image: "notion",
      SkillTranslation: {
        createMany: {
          data: [
            {
              description:
                "Plataforma de productividad y colaboración que combina las herramientas de un wiki con las de un bloc de notas. Permite crear páginas web y tableros de trabajo, así como organizar y compartir información.",
              urlWiki: "https://es.wikipedia.org/wiki/Notion_(software)",
              appLanguageId: langEs.id,
            },
            {
              description:
                "Productivity and collaboration platform that combines the tools of a wiki with those of a notebook. It allows you to create web pages and workboards, as well as organize and share information.",
              urlWiki: "https://en.wikipedia.org/wiki/Notion_(software)",
              appLanguageId: langEn.id,
            },
            {
              description:
                "Produktivitäts- und Kollaborationsplattform, die die Tools eines Wikis mit denen eines Notizbuchs kombiniert. Es ermöglicht das Erstellen von Webseiten und Arbeitsplatten sowie das Organisieren und Teilen von Informationen.",
              urlWiki: "https://de.wikipedia.org/wiki/Notion_(software)",
              appLanguageId: langDe.id,
            },
          ],
        },
      },
    },
  });

  // Skills Frontend
  const skillHtml = await prisma.skill.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      title: "HTML5",
      type: "FRONTEND",
      image: "html5",
      SkillTranslation: {
        createMany: {
          data: [
            {
              description:
                "Lenguaje de marcado para la elaboración de páginas web en un navegador web.",
              urlWiki: "https://es.wikipedia.org/wiki/HTML",
              appLanguageId: langEs.id,
            },
            {
              description:
                "Markup language for the creation of web pages in a web browser.",
              urlWiki: "https://en.wikipedia.org/wiki/HTML",
              appLanguageId: langEn.id,
            },
            {
              description:
                "Auszeichnungssprache zur Erstellung von Webseiten in einem Webbrowser.",
              urlWiki:
                "https://de.wikipedia.org/wiki/Hypertext_Markup_Language",
              appLanguageId: langDe.id,
            },
          ],
        },
      },
    },
  });

  const skillCss = await prisma.skill.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      title: "CSS3",
      type: "FRONTEND",
      image: "css3",
      SkillTranslation: {
        createMany: {
          data: [
            {
              description:
                "Lenguaje de hojas de estilo usadas para describir la presentación de un documento escrito en HTML.",
              urlWiki:
                "https://es.wikipedia.org/wiki/Hoja_de_estilos_en_cascada",
              appLanguageId: langEs.id,
            },
            {
              description:
                "Style sheet language used for describing the presentation of a document written in HTML.",
              urlWiki: "https://en.wikipedia.org/wiki/Cascading_Style_Sheets",
              appLanguageId: langEn.id,
            },
            {
              description:
                "Stylesheet-Sprache, die zum Beschreiben der Präsentation eines in HTML geschriebenen Dokuments verwendet wird.",
              urlWiki: "https://de.wikipedia.org/wiki/Cascading_Style_Sheets",
              appLanguageId: langDe.id,
            },
          ],
        },
      },
    },
  });

  const skillJavascript = await prisma.skill.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      title: "JavaScript",
      type: "FRONTEND",
      image: "javascript",
      SkillTranslation: {
        createMany: {
          data: [
            {
              description:
                "Lenguaje de programación interpretado, dialecto del estándar ECMAScript. Se define como orientado a objetos,​ basado en prototipos, imperativo, débilmente tipado y dinámico.",
              urlWiki: "https://es.wikipedia.org/wiki/JavaScript",
              appLanguageId: langEs.id,
            },
            {
              description:
                "Interpreted programming language, dialect of the ECMAScript standard. It is defined as an object-oriented, prototype-based, imperative, weakly typed and dynamic language.",
              urlWiki: "https://en.wikipedia.org/wiki/JavaScript",
              appLanguageId: langEn.id,
            },
            {
              description:
                "Interpretierte Programmiersprache, Dialekt des ECMAScript-Standards. Es wird als objektorientierte, prototypbasierte, imperative, schwach typisierte und dynamische Sprache definiert.",
              urlWiki: "https://de.wikipedia.org/wiki/JavaScript",
              appLanguageId: langDe.id,
            },
          ],
        },
      },
    },
  });

  const skillTypescript = await prisma.skill.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      title: "TypeScript",
      type: "FRONTEND",
      image: "typescript",
      SkillTranslation: {
        createMany: {
          data: [
            {
              description:
                "Superset de JavaScript desarrollado por Microsoft que añade tipado estático y objetos basados en clases.",
              urlWiki: "https://es.wikipedia.org/wiki/TypeScript",
              appLanguageId: langEs.id,
            },
            {
              description:
                "Superset of JavaScript developed by Microsoft that adds static typing and objects based on classes.",
              urlWiki: "https://en.wikipedia.org/wiki/TypeScript",
              appLanguageId: langEn.id,
            },
            {
              description:
                "Superset von JavaScript, das von Microsoft entwickelt wurde und statische Typisierung und objektorientierte Klassen hinzufügt.",
              urlWiki: "https://de.wikipedia.org/wiki/TypeScript",
              appLanguageId: langDe.id,
            },
          ],
        },
      },
    },
  });

  const skillReact = await prisma.skill.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      title: "React",
      type: "FRONTEND",
      image: "react",
      SkillTranslation: {
        createMany: {
          data: [
            {
              description:
                "Librería JavaScript de código abierto diseñada para crear interfaces de usuario con el objetivo de facilitar el desarrollo de aplicaciones en una sola página.",
              urlWiki: "https://es.wikipedia.org/wiki/React_(librer%C3%ADa)",
              appLanguageId: langEs.id,
            },
            {
              description:
                "Open-source JavaScript library designed to create user interfaces with the aim of facilitating the development of single-page applications.",
              urlWiki:
                "https://en.wikipedia.org/wiki/React_(JavaScript_library)",
              appLanguageId: langEn.id,
            },
            {
              description:
                "Open-Source-JavaScript-Bibliothek, die entwickelt wurde, um Benutzeroberflächen zu erstellen, mit dem Ziel, die Entwicklung von Single-Page-Anwendungen zu erleichtern.",
              urlWiki:
                "https://de.wikipedia.org/wiki/React_(JavaScript-Bibliothek)",
              appLanguageId: langDe.id,
            },
          ],
        },
      },
    },
  });

  const skillNextjs = await prisma.skill.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      title: "Next.js",
      type: "FRONTEND",
      image: "nextdotjs",
      SkillTranslation: {
        createMany: {
          data: [
            {
              description:
                "Framework de JavaScript de código abierto diseñado para crear aplicaciones web de una sola página con React que permiten funcionalidades como renderizado del lado del servidor y generación de sitios estáticos para aplicaciones web basadas en React.",
              urlWiki: "https://es.wikipedia.org/wiki/Next.js",
              appLanguageId: langEs.id,
            },
            {
              description:
                "Open-source JavaScript framework designed to create single-page web applications with React that allows features such as server-side rendering and static site generation for web applications based on React.",
              urlWiki: "https://en.wikipedia.org/wiki/Next.js",
              appLanguageId: langEn.id,
            },
            {
              description:
                "Open-Source-JavaScript-Framework, das entwickelt wurde, um Single-Page-Webanwendungen mit React zu erstellen, die Funktionen wie serverseitiges Rendern und statische Site-Generierung für Webanwendungen auf React ermöglichen.",
              urlWiki: "https://de.wikipedia.org/wiki/Next.js",
              appLanguageId: langDe.id,
            },
          ],
        },
      },
    },
  });

  const skillRedux = await prisma.skill.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      title: "Redux",
      type: "FRONTEND",
      image: "redux",
      SkillTranslation: {
        createMany: {
          data: [
            {
              description:
                "Librería de JavaScript de código abierto para el desarrollo de aplicaciones web que se centra en el manejo de estados de la aplicación.",
              urlWiki: "https://es.wikipedia.org/wiki/Redux_(librer%C3%ADa)",
              appLanguageId: langEs.id,
            },
            {
              description:
                "Open-source JavaScript library for the development of web applications that focuses on the management of application states.",
              urlWiki:
                "https://en.wikipedia.org/wiki/Redux_(JavaScript_library)",
              appLanguageId: langEn.id,
            },
            {
              description:
                "Open-Source-JavaScript-Bibliothek für die Entwicklung von Webanwendungen, die sich auf das Management von Anwendungsstatus konzentriert.",
              urlWiki:
                "https://de.wikipedia.org/wiki/Redux_(JavaScript-Bibliothek)",
              appLanguageId: langDe.id,
            },
          ],
        },
      },
    },
  });

  const skillTailwind = await prisma.skill.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      title: "Tailwind CSS",
      type: "FRONTEND",
      image: "tailwindcss",
      SkillTranslation: {
        createMany: {
          data: [
            {
              description:
                "Framework de CSS de código abierto que te ayuda a construir rápidamente interfaces de usuario personalizadas.",
              urlWiki: "https://es.wikipedia.org/wiki/Tailwind_CSS",
              appLanguageId: langEs.id,
            },
            {
              description:
                "Open-source CSS framework that helps you build custom user interfaces quickly.",
              urlWiki: "https://en.wikipedia.org/wiki/Tailwind_CSS",
              appLanguageId: langEn.id,
            },
            {
              description:
                "Open-Source-CSS-Framework, mit dem Sie schnell benutzerdefinierte Benutzeroberflächen erstellen können.",
              urlWiki: "https://de.wikipedia.org/wiki/Tailwind_CSS",
              appLanguageId: langDe.id,
            },
          ],
        },
      },
    },
  });

  const skillMaterial = await prisma.skill.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      title: "Material UI",
      type: "FRONTEND",
      image: "mui",
      SkillTranslation: {
        createMany: {
          data: [
            {
              description:
                "Framework de componentes de React que implementa Material Design.",
              urlWiki: "https://es.wikipedia.org/wiki/Material_UI",
              appLanguageId: langEs.id,
            },
            {
              description:
                "React component framework that implements Material Design.",
              urlWiki: "https://en.wikipedia.org/wiki/Material_UI",
              appLanguageId: langEn.id,
            },
            {
              description:
                "React-Komponentenframework, das Material Design implementiert.",
              urlWiki: "https://de.wikipedia.org/wiki/Material_UI",
              appLanguageId: langDe.id,
            },
          ],
        },
      },
    },
  });

  const skillStyled = await prisma.skill.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      title: "Styled Components",
      type: "FRONTEND",
      image: "styledcomponents",
      SkillTranslation: {
        createMany: {
          data: [
            {
              description:
                "Librería de JavaScript para React y React Native que permite usar estilos CSS en componentes de React.",
              urlWiki: "https://es.wikipedia.org/wiki/Styled_Components",
              appLanguageId: langEs.id,
            },
            {
              description:
                "JavaScript library for React and React Native that allows you to use CSS styles in React components.",
              urlWiki: "https://en.wikipedia.org/wiki/Styled_Components",
              appLanguageId: langEn.id,
            },
            {
              description:
                "JavaScript-Bibliothek für React und React Native, mit der Sie CSS-Stile in React-Komponenten verwenden können.",
              urlWiki: "https://de.wikipedia.org/wiki/Styled_Components",
              appLanguageId: langDe.id,
            },
          ],
        },
      },
    },
  });

  const skillSass = await prisma.skill.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      title: "Sass",
      type: "FRONTEND",
      image: "sass",
      SkillTranslation: {
        createMany: {
          data: [
            {
              description:
                "Lenguaje de hojas de estilo en cascada que es interpretado o compilado en CSS.",
              urlWiki: "https://es.wikipedia.org/wiki/Sass_(lenguaje)",
              appLanguageId: langEs.id,
            },
            {
              description:
                "Cascading style sheet language that is interpreted or compiled into CSS.",
              urlWiki:
                "https://en.wikipedia.org/wiki/Sass_(stylesheet_language)",
              appLanguageId: langEn.id,
            },
            {
              description:
                "Kaskadierende Stylesheet-Sprache, die in CSS interpretiert oder kompiliert wird.",
              urlWiki:
                "https://de.wikipedia.org/wiki/Sass_(Stylesheet-Sprache)",
              appLanguageId: langDe.id,
            },
          ],
        },
      },
    },
  });

  const skillBootstrap = await prisma.skill.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      title: "Bootstrap",
      type: "FRONTEND",
      image: "bootstrap",
      SkillTranslation: {
        createMany: {
          data: [
            {
              description:
                "Framework de código abierto para desarrollar sitios y aplicaciones web con HTML, CSS y JavaScript.",
              urlWiki: "https://es.wikipedia.org/wiki/Bootstrap_(framework)",
              appLanguageId: langEs.id,
            },
            {
              description:
                "Open-source framework to develop websites and web applications with HTML, CSS, and JavaScript.",
              urlWiki:
                "https://en.wikipedia.org/wiki/Bootstrap_(front-end_framework)",
              appLanguageId: langEn.id,
            },
            {
              description:
                "Open-Source-Framework zum Entwickeln von Websites und Webanwendungen mit HTML, CSS und JavaScript.",
              urlWiki: "https://de.wikipedia.org/wiki/Bootstrap_(Framework)",
              appLanguageId: langDe.id,
            },
          ],
        },
      },
    },
  });

  const skillApollo = await prisma.skill.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      title: "Apollo GraphQL",
      type: "FRONTEND",
      image: "apollographql",
      SkillTranslation: {
        createMany: {
          data: [
            {
              description:
                "Plataforma de código abierto para crear, administrar y conectar aplicaciones de datos.",
              urlWiki: "https://es.wikipedia.org/wiki/Apollo_(plataforma)",
              appLanguageId: langEs.id,
            },
            {
              description:
                "Open-source platform to create, manage, and connect data applications.",
              urlWiki: "https://en.wikipedia.org/wiki/Apollo_(platform)",
              appLanguageId: langEn.id,
            },
            {
              description:
                "Open-Source-Plattform zum Erstellen, Verwalten und Verbinden von Datenanwendungen.",
              urlWiki: "https://de.wikipedia.org/wiki/Apollo_(Plattform)",
              appLanguageId: langDe.id,
            },
          ],
        },
      },
    },
  });

  const skillWebSockets = await prisma.skill.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      title: "WebSockets",
      type: "FRONTEND",
      image: "socketdotio",
      SkillTranslation: {
        createMany: {
          data: [
            {
              description:
                "Protocolo de comunicación bidireccional que permite la comunicación entre un cliente y un servidor a través de una única conexión TCP.",
              urlWiki: "https://es.wikipedia.org/wiki/WebSocket",
              appLanguageId: langEs.id,
            },
            {
              description:
                "Bidirectional communication protocol that allows communication between a client and a server through a single TCP connection.",
              urlWiki: "https://en.wikipedia.org/wiki/WebSocket",
              appLanguageId: langEn.id,
            },
            {
              description:
                "Bidirektionales Kommunikationsprotokoll, das die Kommunikation zwischen einem Client und einem Server über eine einzelne TCP-Verbindung ermöglicht.",
              urlWiki: "https://de.wikipedia.org/wiki/WebSocket",
              appLanguageId: langDe.id,
            },
          ],
        },
      },
    },
  });

  // mobile
  const skillReactNative = await prisma.skill.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      title: "React Native",
      type: "MOBILE",
      image: "react-native",
      SkillTranslation: {
        createMany: {
          data: [
            {
              description:
                "Framework de código abierto para desarrollar aplicaciones móviles para Android y iOS usando React.",
              urlWiki: "https://es.wikipedia.org/wiki/React_Native",
              appLanguageId: langEs.id,
            },
            {
              description:
                "Open-source framework to develop mobile applications for Android and iOS using React.",
              urlWiki: "https://en.wikipedia.org/wiki/React_Native",
              appLanguageId: langEn.id,
            },
            {
              description:
                "Open-Source-Framework zum Entwickeln von mobilen Anwendungen für Android und iOS mit React.",
              urlWiki: "https://de.wikipedia.org/wiki/React_Native",
              appLanguageId: langDe.id,
            },
          ],
        },
      },
    },
  });

  const skillAndroid = await prisma.skill.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      title: "Android",
      type: "MOBILE",
      image: "android",
      SkillTranslation: {
        createMany: {
          data: [
            {
              description:
                "Sistema operativo móvil basado en núcleo Linux, desarrollado por Google y lanzado en 2008.",
              urlWiki:
                "https://es.wikipedia.org/wiki/Android_(sistema_operativo)",
              appLanguageId: langEs.id,
            },
            {
              description:
                "Mobile operating system based on Linux kernel, developed by Google and launched in 2008.",
              urlWiki:
                "https://en.wikipedia.org/wiki/Android_(operating_system)",
              appLanguageId: langEn.id,
            },
            {
              description:
                "Mobiles Betriebssystem auf Linux-Kernelbasis, das von Google entwickelt und 2008 veröffentlicht wurde.",
              urlWiki: "https://de.wikipedia.org/wiki/Android_(Betriebssystem)",
              appLanguageId: langDe.id,
            },
          ],
        },
      },
    },
  });

  // desktop
  const skillWindforms = await prisma.skill.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      title: "WinForms",
      type: "DESKTOP",
      image: "windowsxp",
      SkillTranslation: {
        createMany: {
          data: [
            {
              description:
                "Framework de Microsoft para desarrollar aplicaciones de escritorio con el lenguaje de programación C#.",
              urlWiki: "https://es.wikipedia.org/wiki/Windows_Forms",
              appLanguageId: langEs.id,
            },
            {
              description:
                "Microsoft framework to develop desktop applications with the C# programming language.",
              urlWiki: "https://en.wikipedia.org/wiki/Windows_Forms",
              appLanguageId: langEn.id,
            },
            {
              description:
                "Microsoft Framework zum Entwickeln von Desktopanwendungen mit der Programmiersprache C#.",
              urlWiki: "https://de.wikipedia.org/wiki/Windows_Forms",
              appLanguageId: langDe.id,
            },
          ],
        },
      },
    },
  });

  const skillDevExpress = await prisma.skill.upsert({
    where: { id: new ObjectId().toString() },
    update: {},
    create: {
      type: "TOOLS",
      title: "DevExpress",
      image: "devexpress",
      SkillTranslation: {
        createMany: {
          data: [
            {
              description:
                "Suite de componentes de software para desarrollar aplicaciones de escritorio y web con el lenguaje de programación C#.",
              urlWiki: "https://es.wikipedia.org/wiki/DevExpress",
              appLanguageId: langEs.id,
            },
            {
              description:
                "Software components suite to develop desktop and web applications with the C# programming language.",
              urlWiki: "https://en.wikipedia.org/wiki/DevExpress",
              appLanguageId: langEn.id,
            },
            {
              description:
                "Softwarekomponenten-Suite zum Entwickeln von Desktop- und Webanwendungen mit der Programmiersprache C#.",
              urlWiki: "https://de.wikipedia.org/wiki/DevExpress",
              appLanguageId: langDe.id,
            },
          ],
        },
      },
    },
  });

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
              appLanguageId: langDe.id,
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
              appLanguageId: langDe.id,
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
              appLanguageId: langDe.id,
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
              appLanguageId: langDe.id,
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
              appLanguageId: langDe.id,
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
              appLanguageId: langDe.id,
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
              appLanguageId: langDe.id,
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
              appLanguageId: langDe.id,
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
              appLanguageId: langDe.id,
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
              appLanguageId: langDe.id,
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
              appLanguageId: langDe.id,
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
              appLanguageId: langDe.id,
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
              appLanguageId: langDe.id,
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
              appLanguageId: langDe.id,
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
              appLanguageId: langDe.id,
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
              appLanguageId: langDe.id,
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
              appLanguageId: langDe.id,
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
              appLanguageId: langDe.id,
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
              appLanguageId: langDe.id,
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
              appLanguageId: langDe.id,
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
              appLanguageId: langDe.id,
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
              appLanguageId: langDe.id,
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
              appLanguageId: langDe.id,
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
              appLanguageId: langDe.id,
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

  await seedCertificates(langEs.id, langEn.id, langDe.id);
}

// seed certificates data
async function seedCertificates(esId: string, enId: string, deId: string) {
  const certPromises = certifications.map(async (certificate) => {
    const { translations, ...rest } = certificate;

    const newCertificate = await prisma.certification.upsert({
      where: { id: new ObjectId().toString() },
      update: {},
      create: {
        ...rest,
        type: [certificate.type] as any,
        CertificationTranslation: {
          createMany: {
            data: [
              {
                title: translations[0].title,
                appLanguageId: esId,
              },
              {
                title: translations[1].title,
                appLanguageId: enId,
              },
              {
                title: translations[2].title,
                appLanguageId: deId,
              },
            ],
          },
        },
      },
    });

    return newCertificate;
  });

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
