import JSZip from "jszip";
import { loadCvTemplateForTailor } from "./load-cv-template-docx";
import { mapDraftToTemplateSections } from "./map-draft-to-template-sections";
import {
  syncLockedParagraphsFromDraft,
  withLockedMetaAdaptations,
  withLockedMetaSection,
} from "@/features/resume-engine/lib/sync-locked-paragraphs-from-draft";
import { rebuildDocx } from "@/lib/docx/rebuilder";
import type { CvImportDraft } from "./cv-import-draft";

const draftFixture: CvImportDraft = {
  detectedLocale: "en",
  header: {
    fullName: "Jesús Hernández García",
    degree: "Senior Full Stack Engineer",
  },
  contacts: [{ type: "EMAIL", value: "jesus@example.com" }],
  experiences: [
    {
      id: "e0",
      company: "Imagemaker",
      role: "Senior Software Engineer",
      location: "Remote · San José, Costa Rica",
      startDate: "2025-08",
      endDate: "2026-08",
      current: false,
      responsibilities: [
        "Developed key full-stack features (React, Flutter, VTEX) for critical flows: search, catalog, checkout, orders, account, and billing, defining standards and onboarding for new projects.",
        "Resolved critical production incidents in checkout, orders, and account across mobile and backend, improving MTTR by 40%.",
        "Strengthened quality with E2E Playwright and unit tests, increasing critical flow coverage by 30 points and reducing regressions from 7 to 4 days.",
      ],
      atsResponsibilities: [],
    },
    {
      id: "e1",
      company: "Claro Nicaragua",
      role: "Software Engineer",
      location: "Remote · Managua, Nicaragua",
      startDate: "2024-09",
      endDate: "2025-08",
      current: false,
      responsibilities: [
        "Built telecom service orchestration platform from scratch with Next.js, tRPC, Prisma, TypeScript, and SQL Server.",
        "Automated real-time status transitions and notifications, increasing traceability by 80% and saving 120+ operational hours per month.",
      ],
      atsResponsibilities: [],
    },
    {
      id: "e2",
      company: "Contollo Consulting",
      role: "Development Team Lead",
      location: "Remote · Texas, United States",
      startDate: "2024-11",
      endDate: "2025-03",
      current: false,
      responsibilities: [
        "Led frontend architecture for 5+ React/Next.js projects, defining reusable component libraries and standards.",
        "Migrated Angular UI to React/TypeScript for better performance.",
        "Implemented CI/CD, automated testing, and monitoring to improve team delivery efficiency.",
        "Built secure C#/.NET and Nest.js APIs integrated with QuickBooks, and mentored 4 junior developers.",
      ],
      atsResponsibilities: [],
    },
    {
      id: "e3",
      company: "Contollo Consulting",
      role: "Senior Software Engineer",
      location: "Remote · Texas, United States",
      startDate: "2023-08",
      endDate: "2024-11",
      current: false,
      responsibilities: [
        "Built responsive React/Next.js interfaces for a 1k+ user platform and designed GraphQL/Nest.js APIs, improving sync reliability by 90%",
        "Refactored legacy jQuery to React+TS and implemented CQRS and event-driven architecture, increasing system performance by 35%.",
      ],
      atsResponsibilities: [],
    },
    {
      id: "e4",
      company: "Musa",
      role: "Full Stack Developer",
      location: "Remote · Managua, Nicaragua",
      startDate: "2022-06",
      endDate: "2023-07",
      current: false,
      responsibilities: ["Musa responsibility 1", "Musa responsibility 2"],
      atsResponsibilities: [],
    },
  ],
  education: [],
  skills: [],
  languages: [],
  certifications: [],
};

describe("CV DOCX layout and experience mapping", () => {
  it("renders experiences without bullet spillover and with correct alignment", async () => {
    const template = await loadCvTemplateForTailor();
    const adaptedSections = mapDraftToTemplateSections(
      template.parsed.sections,
      draftFixture,
      [],
    );
    const lockedAdapted = syncLockedParagraphsFromDraft(
      template.parsed.lockedParagraphs,
      draftFixture,
      "en",
    );

    const buffer = await rebuildDocx(
      template.parsed.zipFiles,
      template.parsed.rawXml,
      withLockedMetaSection(
        template.parsed.sections,
        template.parsed.lockedParagraphs,
      ),
      withLockedMetaAdaptations(adaptedSections, lockedAdapted),
      "en",
    );

    const zip = await JSZip.loadAsync(buffer);
    const xml = await zip.file("word/document.xml")!.async("string");

    const pRegex = /<w:p\b[\s\S]*?<\/w:p>/g;
    const paragraphs = [...xml.matchAll(pRegex)].map((m) => m[0]);

    expect(buffer).toBeDefined();

    // Verify all role paragraphs have w:left="141"
    const roleParas = paragraphs.filter((pXml) => {
      const text = pXml.replace(/<[^>]+>/g, "");
      return text.includes("Full-time |");
    });
    expect(roleParas.length).toBeGreaterThanOrEqual(4);
    for (const rolePara of roleParas) {
      expect(rolePara).toMatch(/<w:ind[^>]*\bw:left="141"/);
    }

    // Verify all meta paragraphs have w:left="141"
    const metaParas = paragraphs.filter((pXml) => {
      const text = pXml.replace(/<[^>]+>/g, "");
      return (
        text.includes("·") &&
        (text.includes("Remote") || text.includes("Hybrid"))
      );
    });
    for (const metaPara of metaParas) {
      expect(metaPara).toMatch(/<w:ind[^>]*\bw:left="141"/);
    }

    // Verify Contollo unified meta line fits single-line compact format
    const contolloMeta = paragraphs.find((pXml) =>
      pXml.includes("Contollo Consulting"),
    );
    expect(contolloMeta).toBeDefined();
    expect(contolloMeta?.replace(/<[^>]+>/g, "")).toBe(
      "Contollo Consulting · Remote · August 2023 – March 2025",
    );

    // Verify Musa has Musa's responsibilities, NOT Contollo's overflow
    const musaMetaIdx = paragraphs.findIndex((pXml) => pXml.includes("Musa ·"));
    expect(musaMetaIdx).toBeGreaterThan(0);
    const musaBullet1 = paragraphs[musaMetaIdx + 1]?.replace(/<[^>]+>/g, "");
    const musaBullet2 = paragraphs[musaMetaIdx + 2]?.replace(/<[^>]+>/g, "");
    expect(musaBullet1).toBe("Musa responsibility 1");
    expect(musaBullet2).toBe("Musa responsibility 2");
  });
});
