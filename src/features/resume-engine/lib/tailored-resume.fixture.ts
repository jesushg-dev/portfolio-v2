import { resumeTextFields } from "./tailored-resume-document";
import { selectResumeSource, type ResumeSelection } from "./resume-selection";
import type { CvTemplateVersion } from "./template-registry";
import type { CvImportDraft } from "@/features/cv/lib/cv-import-draft";
import type { Locale } from "@/i18n/config";

/** A CMS-shaped fixture with stable record IDs and genuine translations. */
export function resumeFixture(locale: Locale): CvImportDraft {
  const text = {
    en: {
      role: "Software Engineer",
      summary:
        "Computer engineer with 6+ years of experience building web platforms with React and TypeScript.",
      availability: "Available immediately",
      context: "E-commerce platform serving customers across Central America.",
      bullets: [
        "Built accessible React interfaces for the customer portal.",
        "Reduced response times by 25% through SQL query optimization.",
      ],
      degree: "Computer Engineering",
      language: "Spanish",
      level: "Native or bilingual",
      degree2: "Web Development",
      certification: "Cloud fundamentals",
    },
    es: {
      role: "Ingeniero de software",
      summary:
        "Ingeniero informático con 6+ años de experiencia desarrollando plataformas web con React y TypeScript.",
      availability: "Disponibilidad inmediata",
      context:
        "Plataforma de comercio electrónico para clientes de Centroamérica.",
      bullets: [
        "Desarrollé interfaces accesibles con React para el portal de clientes.",
        "Reduje los tiempos de respuesta un 25% mediante optimización de consultas SQL.",
      ],
      degree: "Ingeniería informática",
      language: "Español",
      level: "Nativo o bilingüe",
      degree2: "Desarrollo web",
      certification: "Fundamentos de la nube",
    },
    nl: {
      role: "Softwareontwikkelaar",
      summary:
        "Informatica-ingenieur met 6+ jaar ervaring in het bouwen van webplatforms met React en TypeScript.",
      availability: "Per direct beschikbaar",
      context: "E-commerceplatform voor klanten in Midden-Amerika.",
      bullets: [
        "Toegankelijke React-interfaces gebouwd voor het klantenportaal.",
        "Responstijden met 25% verkort door SQL-queryoptimalisatie.",
      ],
      degree: "Informatica",
      language: "Spaans",
      level: "Moedertaal of tweetalig",
      degree2: "Webontwikkeling",
      certification: "Basisprincipes van de cloud",
    },
  }[locale];
  return {
    detectedLocale: locale,
    header: {
      fullName: "Alex Hernández",
      degree: text.role,
      summary: text.summary,
      availability: text.availability,
    },
    experiences: ["Acme", "Claro", "Telo"].map((company, i) => ({
      id: `exp-${i}`,
      company,
      role: text.role,
      companyBlurb: text.context,
      location: "Managua, Nicaragua",
      employmentType: "FULL_TIME",
      startDate: `${2024 - i}-01`,
      endDate: `${2025 - i}-08`,
      current: i === 0,
      responsibilities: text.bullets,
      responsibilityIds: [`resp-${i}-1`, `resp-${i}-2`],
      atsResponsibilities: [],
    })),
    education: [
      {
        id: "edu-1",
        institution: "Universidad Nacional de Ingeniería",
        degreeName: text.degree,
        startYear: 2017,
        endYear: 2024,
        location: "Managua",
      },
      {
        id: "edu-2",
        institution: "Platzi",
        degreeName: text.degree2,
        startYear: 2022,
        endYear: 2024,
      },
    ],
    skills: [
      {
        id: "skills-front",
        category: "FRONTEND",
        items: ["React", "TypeScript", "Next.js"],
      },
      { id: "skills-back", category: "BACKEND", items: ["Node.js", "SQL"] },
      { id: "skills-devops", category: "DEVOPS", items: ["Docker", "Git"] },
    ],
    languages: [{ id: "lang-1", name: text.language, level: text.level }],
    contacts: [
      { id: "email", type: "EMAIL", value: "alex@example.com" },
      { id: "website", type: "WEBSITE", value: "https://example.com" },
      { id: "booking", type: "CALENDLY", value: "https://calendly.com/alex" },
    ],
    certifications: [
      {
        id: "cert-1",
        title: text.certification,
        issuer: "Acme Academy",
        year: 2024,
      },
    ],
  };
}

export function resumeSelectionFixture(draft: CvImportDraft): ResumeSelection {
  return {
    experiences: draft.experiences.map((exp) => ({
      id: exp.id,
      responsibilityIds: exp.responsibilityIds ?? [],
    })),
    educationIds: draft.education.map((edu) => edu.id),
    skills: draft.skills.map((skill) => ({
      id: skill.id!,
      items: skill.items,
    })),
    languageIds: draft.languages.map((lang) => lang.id!),
    certificationIds: draft.certifications.map((cert) => cert.id!),
  };
}

export function resumeResponseFixture(
  draft: CvImportDraft,
  templateId: CvTemplateVersion,
  selection = resumeSelectionFixture(draft),
) {
  const selected = selectResumeSource(draft, selection);
  return {
    schemaVersion: 1 as const,
    locale: draft.detectedLocale,
    selection,
    aiScore: 85,
    fields: resumeTextFields(selected, templateId).map(({ id, text }) => ({
      id,
      text,
    })),
  };
}
