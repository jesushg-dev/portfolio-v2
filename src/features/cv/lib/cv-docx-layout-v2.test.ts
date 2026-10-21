import { loadCvTemplateForTailor, DEFAULT_CV_TEMPLATE_VERSION } from "./load-cv-template-docx";

describe("CV DOCX layout v2 (extended 6 experiences, 21 bullets)", () => {
  it("defaults to v2 template version", () => {
    expect(DEFAULT_CV_TEMPLATE_VERSION).toBe("v2");
  });

  it("loads cv-template-v2.docx by default and parses 6 experiences and 21 bullets", async () => {
    const template = await loadCvTemplateForTailor();

    expect(template.version).toBe("v2");
    expect(template.fileName).toBe("cv-template-v2.docx");
    expect(template.parsed.sections.length).toBeGreaterThan(0);

    const expSection = template.parsed.sections.find(
      (s) =>
        s.heading.toUpperCase().includes("EXPERIENCIA") ||
        s.heading.toUpperCase().includes("EXPERIENCE"),
    );

    expect(expSection).toBeDefined();

    // 21 bullet points across 6 experiences
    expect(expSection?.paragraphs.length).toBe(21);

    // Verify company names are preserved in the template's document XML
    expect(template.parsed.rawXml).toContain("Claro Nicaragua");
    expect(template.parsed.rawXml).toContain("Contollo");
    expect(template.parsed.rawXml).toContain("Musa");
    expect(template.parsed.rawXml).toContain("Telo Group");
    expect(template.parsed.rawXml).toContain("Asociación de Iglesias Reformadas");
  });

  it("can also load v1 explicitly when requested", async () => {
    const v1Template = await loadCvTemplateForTailor("v1");

    expect(v1Template.version).toBe("v1");
    expect(v1Template.fileName).toBe("cv-template.docx");

    const expSection = v1Template.parsed.sections.find((s) =>
      s.heading.toUpperCase().includes("EXPERIENCE"),
    );
    expect(expSection).toBeDefined();
    // V1 has 14 bullets
    expect(expSection?.paragraphs.length).toBe(14);
  });

  it("extracts HABILIDADES TÉCNICAS section in v2 and maps portfolio skills", async () => {
    const template = await loadCvTemplateForTailor("v2");
    const skillsSection = template.parsed.sections.find((s) =>
      s.heading.toUpperCase().includes("HABILIDADES"),
    );

    expect(skillsSection).toBeDefined();
    expect(skillsSection!.paragraphs.length).toBe(4);

    const { mapDraftToTemplateSections } = await import(
      "./map-draft-to-template-sections"
    );
    const { rebuildDocx } = await import("@/lib/docx/rebuilder");
    const JSZip = (await import("jszip")).default;

    const mockDraft = {
      detectedLocale: "es" as const,
      header: { fullName: "Jesus Hernandez" },
      experiences: [],
      education: [],
      skills: [
        {
          category: "FRONTEND" as const,
          items: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
        },
        {
          category: "BACKEND" as const,
          items: ["NestJS", "Node.js", "GraphQL", "Express"],
        },
        {
          category: "DATABASE" as const,
          items: ["PostgreSQL", "MongoDB", "Redis"],
        },
        {
          category: "DEVOPS" as const,
          items: ["Docker", "Kubernetes", "AWS", "GitHub Actions"],
        },
      ],
      languages: [],
      contacts: [],
      certifications: [],
    };

    const adapted = mapDraftToTemplateSections(
      template.parsed.sections,
      mockDraft,
      [],
    );

    const adaptedSkills = adapted.find((s) => s.id === skillsSection!.id);
    expect(adaptedSkills).toBeDefined();
    expect(adaptedSkills!.paragraphs[0]?.runs[0]?.text).toBe(
      "React · Next.js · TypeScript · Tailwind CSS",
    );
    expect(adaptedSkills!.paragraphs[1]?.runs[0]?.text).toBe(
      "NestJS · Node.js · GraphQL · Express",
    );
    expect(adaptedSkills!.paragraphs[2]?.runs[0]?.text).toBe(
      "PostgreSQL · MongoDB · Redis",
    );
    expect(adaptedSkills!.paragraphs[3]?.runs[0]?.text).toBe(
      "Docker · Kubernetes · AWS · GitHub Actions",
    );

    const buffer = await rebuildDocx(
      template.parsed.zipFiles,
      template.parsed.rawXml,
      template.parsed.sections,
      adapted,
      "es",
    );

    const zip = await JSZip.loadAsync(buffer);
    const xml = await zip.file("word/document.xml")!.async("string");

    expect(xml).toContain("React · Next.js · TypeScript · Tailwind CSS");
    expect(xml).toContain("NestJS · Node.js · GraphQL · Express");
    expect(xml).toContain("PostgreSQL · MongoDB · Redis");
    expect(xml).toContain("Docker · Kubernetes · AWS · GitHub Actions");

    // Also test V1 rebuild
    const v1Template = await loadCvTemplateForTailor("v1");
    const v1Adapted = mapDraftToTemplateSections(
      v1Template.parsed.sections,
      mockDraft,
      [],
    );
    const v1Buffer = await rebuildDocx(
      v1Template.parsed.zipFiles,
      v1Template.parsed.rawXml,
      v1Template.parsed.sections,
      v1Adapted,
      "en",
    );
    expect(v1Buffer).toBeDefined();
  });

  it("checks lockedParagraphs in v2 template", async () => {
    const template = await loadCvTemplateForTailor("v2");
    console.log(
      "V2 LOCKED:",
      JSON.stringify(
        template.parsed.lockedParagraphs.map((lp) => ({
          kind: lp.kind,
          xmlIndex: lp.paragraph.xmlIndex,
          text: lp.paragraph.runs.map((r) => r.text).join(" [RUN] "),
        })),
        null,
        2,
      ),
    );
  });
});
