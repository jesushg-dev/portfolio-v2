import JSZip from "jszip";

import { generateDocxFromStructured } from "./generate-from-structured";
import type { CvImportDraft } from "@/features/cv/lib/cv-import-draft";

describe("generateDocxFromStructured", () => {
  const baseDraft: CvImportDraft = {
    detectedLocale: "en",
    header: {
      fullName: "Jesús Hernández García",
      degree: "Senior Software Engineer",
      summary: "Experienced developer",
    },
    contacts: [{ type: "EMAIL", value: "jesus@example.com" }],
    experiences: [],
    education: [],
    skills: [],
    languages: [],
    certifications: [],
  };

  it("generates a valid docx buffer containing structured content", async () => {
    const buffer = await generateDocxFromStructured(baseDraft);
    expect(buffer).toBeInstanceOf(Buffer);

    const zip = await JSZip.loadAsync(buffer);
    const documentXml = await zip.file("word/document.xml")?.async("string");
    expect(documentXml).toBeDefined();
    expect(documentXml).toContain("Jesús Hernández García");
    expect(documentXml).toContain("Senior Software Engineer");
  });

  it("unifies consecutive experiences at the same company into a single entry with overall dates and combined bullets", async () => {
    const draft: CvImportDraft = {
      ...baseDraft,
      detectedLocale: "es",
      experiences: [
        {
          id: "exp-single",
          company: "Imagemaker",
          role: "Senior Software Engineer",
          location: "Remoto",
          startDate: "2025-09",
          current: true,
          responsibilities: ["Desarrollo full-stack."],
          atsResponsibilities: [],
        },
        {
          id: "exp-lead",
          company: "Contollo",
          role: "Development Team Lead",
          location: "Remoto · Texas, Estados Unidos",
          startDate: "2024-11",
          endDate: "2025-03",
          current: false,
          responsibilities: ["Liderazgo técnico."],
          atsResponsibilities: [],
        },
        {
          id: "exp-sse",
          company: "Contollo",
          role: "Senior Software Engineer",
          location: "Remoto · Texas, Estados Unidos",
          startDate: "2023-08",
          endDate: "2024-11",
          current: false,
          responsibilities: ["Desarrollo frontend y backend."],
          atsResponsibilities: [],
        },
      ],
    };

    const buffer = await generateDocxFromStructured(draft);
    const zip = await JSZip.loadAsync(buffer);
    const documentXml = await zip.file("word/document.xml")?.async("string");

    // Single experience retains role and company
    expect(documentXml).toContain("Senior Software Engineer — Imagemaker");

    // Contollo is unified under the highest role with overall dates
    expect(documentXml).toContain("Development Team Lead — Contollo");
    expect(documentXml).toContain("Agosto de 2023 – Marzo de 2025");
    // No second separate Contollo entry or subrole
    expect(documentXml).not.toContain("Senior Software Engineer — Contollo");
    expect(documentXml).not.toContain('w:pStyle w:val="SubRole"');

    // Responsibilities from both stints are rendered
    expect(documentXml).toContain("Desarrollo full-stack.");
    expect(documentXml).toContain("Liderazgo técnico.");
    expect(documentXml).toContain("Desarrollo frontend y backend.");
  });
});
