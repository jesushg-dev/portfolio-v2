import {
  detectLinkedInLoginWall,
  hasImportedContent,
  parseLinkedInPage,
} from "./parse-linkedin-page";

const JOB_FIXTURE = `<!DOCTYPE html>
<html>
<head>
  <title>JuegaOk hiring Desarrollador in Managua, Nicaragua | LinkedIn</title>
  <meta property="og:title" content="JuegaOk hiring Desarrollador in Managua, Nicaragua">
  <meta property="og:description" content="Desarrollador de Software. Modalidad presencial | Managua, Nicaragua">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": "Desarrollador",
    "description": "<p>🚀 ¡Estamos contratando!</p><p><strong>Desarrollador de Software</strong></p><p>📍 Modalidad presencial | Managua, Nicaragua</p><p>En JuegaOK buscamos una persona con bases sólidas en desarrollo de software.</p><p><strong>Principales responsabilidades:</strong></p><ul><li>Desarrollar componentes backend, interfaces y procesos de integración entre aplicaciones.</li><li>Brindar mantenimiento preventivo y correctivo a sistemas existentes.</li></ul>",
    "hiringOrganization": { "@type": "Organization", "name": "JuegaOk" },
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Managua",
        "addressCountry": "Nicaragua"
      }
    }
  }
  </script>
</head>
<body>
  <h1>Desarrollador</h1>
</body>
</html>`;

const POST_FIXTURE = `<!DOCTYPE html>
<html>
<head>
  <title>#backenddeveloper #dotnet #netcore #aws | Carol Dayanna Perez</title>
  <meta property="og:title" content="#backenddeveloper #dotnet #netcore #aws | Carol Dayanna Perez">
  <meta property="og:description" content="En Ready buscamos un Backend Developer .NET / AWS! 100% remoto LATAM Requisitos técnicos: Experiencia sólida en .NET Core">
</head>
<body>
  <p>Agree &amp; Join LinkedIn</p>
  <p>En Ready buscamos un Backend Developer .NET / AWS! 100% remoto LATAM Requisitos técnicos: * Experiencia sólida en desarrollo backend con .NET Core y ASP.NET Core. * Experiencia en AWS, especialmente con servicios como Lambda, API Gateway, DynamoDB, ECS/EKS, S3 y CloudWatch. * Conocimientos y experiencia en diseño e implementación de arquitecturas de microservicios y soluciones Serverless.</p>
</body>
</html>`;

const LOGIN_WALL_FIXTURE = `<!DOCTYPE html>
<html>
<head>
  <title>Sign in | LinkedIn</title>
  <meta property="og:title" content="LinkedIn">
  <meta property="og:description" content="Sign in">
</head>
<body>
  <form action="/uas/login">
    <input name="session_key" type="text" />
    <p>Sign in to view this post</p>
  </form>
</body>
</html>`;

const GUEST_JOB_FIXTURE = `<!DOCTYPE html>
<html>
<head>
  <title>Desarrollador en JuegaOk — Managua, Nicaragua | Empleos de LinkedIn</title>
  <meta property="og:title" content="Desarrollador en JuegaOk — Managua, Nicaragua | Empleos de LinkedIn">
  <meta property="og:description" content="Solicita el puesto de Desarrollador en JuegaOk en Managua, Nicaragua: Jornada completa Sin experiencia.">
</head>
<body>
  <h1 class="top-card-layout__title font-sans text-lg topcard__title">Desarrollador</h1>
  <a class="topcard__org-name-link topcard__flavor--black-link" href="https://ni.linkedin.com/company/juegaok">
    JuegaOk
  </a>
  <span class="topcard__flavor topcard__flavor--bullet">
    Managua, Nicaragua
  </span>
  <div class="show-more-less-html__markup show-more-less-html__markup--clamp-after-20
            relative overflow-hidden">
    <p>Principales responsabilidades:</p>
    <ul><li>Desarrollar componentes backend, interfaces y procesos de integración.</li></ul>
  </div>
</body>
</html>`;

describe("parseLinkedInPage", () => {
  it("extracts job fields from JSON-LD", () => {
    const listing = parseLinkedInPage(JOB_FIXTURE, "job");
    expect(listing.sourceType).toBe("job");
    expect(listing.position).toBe("Desarrollador");
    expect(listing.companyName).toBe("JuegaOk");
    expect(listing.location).toContain("Managua");
    expect(listing.description).toContain("responsabilidades");
    expect(listing.description).toContain("Desarrollar componentes backend");
    expect(listing.description).not.toContain("Similar jobs");
  });

  it("falls back to guest markup and card fields when JSON-LD is missing", () => {
    const listing = parseLinkedInPage(GUEST_JOB_FIXTURE, "job");
    expect(listing.position).toBe("Desarrollador");
    expect(listing.companyName).toBe("JuegaOk");
    expect(listing.location).toContain("Managua");
    expect(listing.description).toContain("responsabilidades");
    expect(listing.description).toContain("Desarrollar componentes backend");
  });

  it("extracts post body and infers company, position, and location", () => {
    const listing = parseLinkedInPage(POST_FIXTURE, "post");
    expect(listing.sourceType).toBe("post");
    expect(listing.companyName).toBe("Ready");
    expect(listing.position).toMatch(/Backend Developer/i);
    expect(listing.location.toLowerCase()).toContain("remoto");
    expect(listing.description).toContain(".NET");
    expect(listing.description).toContain("AWS");
    expect(listing.description).toContain("Ready");
    expect(listing.description).not.toContain("Agree & Join");
  });
});

describe("detectLinkedInLoginWall", () => {
  it("detects a sign-in wall without job content", () => {
    expect(detectLinkedInLoginWall(LOGIN_WALL_FIXTURE)).toBe(true);
    expect(
      hasImportedContent(parseLinkedInPage(LOGIN_WALL_FIXTURE, "post")),
    ).toBe(false);
  });

  it("does not treat a public job page as a login wall", () => {
    expect(detectLinkedInLoginWall(JOB_FIXTURE)).toBe(false);
  });
});
