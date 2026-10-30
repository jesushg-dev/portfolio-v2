import {
  resumeSelectionFixture,
  resumeResponseFixture,
} from "./tailored-resume.fixture";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import JSZip from "jszip";
import { XMLValidator } from "fast-xml-parser";
import { resumeFixture } from "./tailored-resume.fixture";
import {
  validateTailoredResume,
  readResumeSnapshot,
  type TailorContext,
} from "./tailored-resume-document";
import { RESUME_TEMPLATES } from "./template-registry";
import { RESUME_LABELS, resumeDates } from "@/lib/cv/resume-labels";
import { loadCvTemplateDocxBuffer } from "@/features/cv/lib/load-cv-template-docx";
import {
  renderResumeTemplate,
  validateResumeTemplate,
} from "./docx/render-template";
import { generateDocxFromStructured } from "./docx/generate-from-structured";

const drafts = {
  en: resumeFixture("en"),
  es: resumeFixture("es"),
  nl: resumeFixture("nl"),
};
function setup(
  locale: "en" | "es" | "nl" = "en",
  templateId: "v1" | "v2" = "v2",
) {
  const context: TailorContext = {
    drafts,
    targetLocale: locale,
    templateId,
    jobDescription: "Buscamos una persona que programe con React.",
  };
  const response = resumeResponseFixture(drafts[locale], templateId);
  return { context, response };
}

describe("canonical multilingual resume", () => {
  it("rejects even an unchanged name returned as editable text with an actionable correction", () => {
    const { context, response } = setup();
    response.fields.push({
      id: "header.fullName",
      text: drafts.en.header.fullName,
    });
    expect(() => validateTailoredResume(response, context)).toThrow(
      "immutable CMS identity; remove this entry from fields",
    );
  });
  it.each(["en", "es", "nl"] as const)(
    "validates %s without changing CMS facts",
    (locale) => {
      const { context, response } = setup(locale);
      const { document } = validateTailoredResume(response, context);
      expect(document.locale).toBe(locale);
      expect(document.education[0].institution).toBe(
        drafts.en.education[0].institution,
      );
      expect(document.experiences[0].responsibilityIds).toEqual([
        "resp-0-1",
        "resp-0-2",
      ]);
      expect(readResumeSnapshot(document)?.detectedLocale).toBe(locale);
    },
  );
  it("rejects an AI locale conflicting with an explicit choice", () => {
    const { context, response } = setup();
    expect(() =>
      validateTailoredResume({ ...response, locale: "es" }, context),
    ).toThrow("locale: expected en");
  });
  it.each([
    "missing",
    "unknown",
    "duplicate",
    "empty",
    "long",
    "metrics",
    "technology",
    "credential",
    "language",
  ])("rejects %s content with a field-specific error", (kind) => {
    const { context, response } = setup();
    const summary = response.fields.find(
      (field) => field.id === "header.summary",
    )!;
    if (kind === "missing") response.fields.shift();
    if (kind === "unknown")
      response.fields.push({ id: "new-id", text: "test" });
    if (kind === "duplicate") response.fields.push(response.fields[0]);
    if (kind === "empty") summary.text = "";
    if (kind === "long") summary.text = "a".repeat(1000);
    if (kind === "metrics") summary.text = summary.text.replace("6+", "20+");
    if (kind === "technology") summary.text += " Kubernetes";
    if (kind === "credential")
      response.fields.find((f) => f.id === "education.edu-1.degree")!.text =
        "PhD in Computer Engineering";
    if (kind === "language")
      response.fields.find((f) => f.id === "header.availability")!.text =
        "Disponibilidad inmediata";
    expect(() => validateTailoredResume(response, context)).toThrow(
      /header\.|education\.|new-id/,
    );
  });
  it("does not silently fall back when a translation is missing or rejected", () => {
    const { context, response } = setup();
    context.drafts = {
      ...drafts,
      en: {
        ...drafts.en,
        header: {
          ...drafts.en.header,
          availability: drafts.es.header.availability,
        },
      },
    };
    expect(
      validateTailoredResume(response, context).document.header.availability,
    ).toBe("Available immediately");
    response.fields = response.fields.filter(
      (f) => f.id !== "header.availability",
    );
    expect(() => validateTailoredResume(response, context)).toThrow(
      "header.availability: missing",
    );
  });
  it("rejects all-empty experience bullets", () => {
    const { context, response } = setup();
    response.fields.forEach((f) => {
      if (f.id.includes(".bullet.")) f.text = "";
    });
    expect(() => validateTailoredResume(response, context)).toThrow(
      "experience.exp-0: select",
    );
  });
  it("reads historical snapshots without regeneration", () =>
    expect(readResumeSnapshot(drafts.es)).toEqual(drafts.es));
  it("rejects inflated proficiency and changed language names", () => {
    const { context, response } = setup();
    response.fields.find(
      (field) => field.id === "language.lang-1.level",
    )!.text = "Basic";
    expect(() => validateTailoredResume(response, context)).toThrow(
      "changed proficiency",
    );
    response.fields.find((field) => field.id === "language.lang-1.name")!.text =
      "English";
    expect(() => validateTailoredResume(response, context)).toThrow(
      "changed language identity",
    );
  });
  it("rejects selecting more roles than the design capacity", () => {
    const { context } = setup("en", "v1");
    const large = {
      ...drafts.en,
      experiences: Array.from({ length: 7 }, (_, i) => ({
        ...drafts.en.experiences[0],
        id: `exp-${i}`,
      })),
    };
    context.drafts = { ...drafts, en: large };
    const response = resumeResponseFixture(large, "v1");
    expect(() => validateTailoredResume(response, context)).toThrow(
      "template capacity exceeded",
    );
  });
});

describe("official Word templates", () => {
  it.each(
    Object.values(RESUME_TEMPLATES).flatMap((template) =>
      (["en", "es", "nl"] as const).map((locale) => ({ template, locale })),
    ),
  )(
    "curates a large profile for $template.id / $locale without translating omitted records",
    async ({ template, locale }) => {
      const source = {
        ...drafts[locale],
        certifications: Array.from({ length: 50 }, (_, index) => ({
          id: `cert-${index}`,
          title: index === 0 ? "AZ-900 i18n C# .NET 8" : `Course ${index}`,
          issuer: "Academy",
          year: 2024,
        })),
        education: Array.from({ length: 20 }, (_, index) => ({
          ...drafts[locale].education[0],
          id: `education-${index}`,
        })),
      };
      const selection = resumeSelectionFixture(source);
      selection.experiences = selection.experiences.map((exp) => ({
        ...exp,
        responsibilityIds: exp.responsibilityIds.slice(0, 1),
      }));
      selection.educationIds = selection.educationIds.slice(
        0,
        template.pages > 1 ? 3 : 2,
      );
      selection.skills = selection.skills.map((skill) => ({
        ...skill,
        items: skill.items.slice(0, 3),
      }));
      selection.certificationIds = [source.certifications[0].id];
      const context: TailorContext = {
        drafts: { ...drafts, [locale]: source },
        templateId: template.id,
        targetLocale: locale,
        jobDescription: "Senior web engineer using Azure and .NET.",
      };
      const response = resumeResponseFixture(source, template.id, selection);
      const before = JSON.stringify(source);
      const { document } = validateTailoredResume(response, context);
      expect(document.certifications).toHaveLength(1);
      expect(document.education).toHaveLength(template.pages > 1 ? 3 : 2);
      expect(document.experiences).toHaveLength(3);
      expect(document.experiences[0].responsibilities).toHaveLength(1);
      expect(document.skills[0].items).toHaveLength(3);
      expect(document.selection?.omittedCertificationIds).toHaveLength(49);
      expect(document.selection?.manifest).toEqual(selection);
      expect(JSON.stringify(source)).toBe(before);
      expect(
        response.fields.some(
          (field) => field.id === "certification.cert-49.title",
        ),
      ).toBe(false);
      const visual = await renderResumeTemplate(
        await loadCvTemplateDocxBuffer(template.id),
        document,
        template,
      );
      const ats = await generateDocxFromStructured(
        readResumeSnapshot(document)!,
      );
      for (const buffer of [visual, ats]) {
        const xml = await (
          await JSZip.loadAsync(buffer)
        )
          .file("word/document.xml")!
          .async("string");
        expect(xml).toContain("AZ-900 i18n C# .NET 8");
        expect(xml).not.toContain("Course 49");
      }
    },
  );
  it("allows selecting zero certifications without listing their IDs in fields", () => {
    const selection = resumeSelectionFixture(drafts.en);
    selection.certificationIds = [];
    const { context } = setup();
    const response = resumeResponseFixture(drafts.en, "v2", selection);
    expect(
      response.fields.some((field) => field.id.startsWith("certification.")),
    ).toBe(false);
    expect(
      validateTailoredResume(response, context).document.certifications,
    ).toEqual([]);
  });
  it.each([
    "unknown",
    "duplicate",
    "unknownSkill",
    "foreignBullet",
    "emptyAchievements",
  ])("rejects invalid selection: %s", (kind) => {
    const { context, response } = setup();
    if (kind === "unknown")
      response.selection.certificationIds = ["unknown-id"];
    if (kind === "duplicate")
      response.selection.certificationIds.push(
        response.selection.certificationIds[0],
      );
    if (kind === "unknownSkill")
      response.selection.skills[0].items = ["Invented skill"];
    if (kind === "foreignBullet")
      response.selection.experiences[0].responsibilityIds = ["resp-1-1"];
    if (kind === "emptyAchievements")
      response.selection.experiences[0].responsibilityIds = [];
    expect(() => validateTailoredResume(response, context)).toThrow(
      /selection/,
    );
  });
  it("still requires translations for selected records", () => {
    const { context, response } = setup();
    response.fields = response.fields.filter(
      (field) => field.id !== "certification.cert-1.title",
    );
    expect(() => validateTailoredResume(response, context)).toThrow(
      "certification.cert-1.title: missing translation",
    );
  });
  it("rejects fields for records excluded from the selection", () => {
    const { context } = setup();
    const selection = resumeSelectionFixture(drafts.en);
    selection.certificationIds = [];
    const response = resumeResponseFixture(drafts.en, "v2", selection);
    response.fields.push({
      id: "certification.cert-1.title",
      text: drafts.en.certifications[0].title,
    });
    expect(() => validateTailoredResume(response, context)).toThrow(
      "certification.cert-1.title",
    );
  });
  it("requires nonempty text for a selected certification", () => {
    const { context, response } = setup();
    response.fields.find(
      (field) => field.id === "certification.cert-1.title",
    )!.text = "";
    expect(() => validateTailoredResume(response, context)).toThrow(
      "certification.cert-1.title: required text",
    );
  });
  it("treats certificate limits as ceilings rather than requiring a quota", () => {
    const source = {
      ...drafts.en,
      certifications: Array.from({ length: 3 }, (_, index) => ({
        id: `cert-${index}`,
        title: `Course ${index}`,
        year: 2024,
      })),
    };
    const { context } = setup();
    context.drafts = { ...drafts, en: source };
    expect(() =>
      validateTailoredResume(resumeResponseFixture(source, "v2"), context),
    ).toThrow("selection.certificationIds: selected 3; maximum 2");
  });
  it("does not count CMS IDs as sidebar text", () => {
    const source = {
      ...drafts.en,
      certifications: [
        { ...drafts.en.certifications[0], id: "c".repeat(4000) },
      ],
    };
    const { context } = setup();
    context.drafts = { ...drafts, en: source };
    expect(() =>
      validateTailoredResume(resumeResponseFixture(source, "v2"), context),
    ).not.toThrow();
  });
  it("rejects damaging a selected credential instead of selecting fewer records", () => {
    const source = {
      ...drafts.en,
      certifications: [
        { id: "code", title: "AZ-900 i18n C# .NET 8", year: 2024 },
      ],
    };
    const { context } = setup();
    context.drafts = { ...drafts, en: source };
    const response = resumeResponseFixture(source, "v2");
    response.fields.find(
      (field) => field.id === "certification.code.title",
    )!.text = "AZ-900 i18n C .NET 8";
    expect(() => validateTailoredResume(response, context)).toThrow(
      "preserve credential codes",
    );
  });
  it("omits empty sections and the unused continuation page", async () => {
    const { context, response } = setup();
    const { document } = validateTailoredResume(response, context);
    document.experiences = document.experiences.slice(0, 1);
    document.education = [];
    document.languages = [];
    document.skills = [];
    document.certifications = [];
    const buffer = await renderResumeTemplate(
      await loadCvTemplateDocxBuffer("v2"),
      document,
      RESUME_TEMPLATES.v2,
    );
    const xml = await (
      await JSZip.loadAsync(buffer)
    )
      .file("word/document.xml")!
      .async("string");
    expect(xml).not.toContain('w:type="page"');
    expect(xml).not.toContain("Certifications");
    expect(xml).not.toContain("Education");
    expect(xml).not.toContain("Languages");
  });
  it.each(
    Object.values(RESUME_TEMPLATES).flatMap((template) =>
      (["en", "es", "nl"] as const).map((locale) => ({ template, locale })),
    ),
  )(
    "renders $template.id / $locale from the same persisted document as ATS",
    async ({ template, locale }) => {
      const { context, response } = setup(locale, template.id);
      const { document } = validateTailoredResume(response, context);
      const input = await loadCvTemplateDocxBuffer(template.id);
      const buffer = await renderResumeTemplate(input, document, template);
      const xml = await (
        await JSZip.loadAsync(buffer)
      )
        .file("word/document.xml")!
        .async("string");
      expect(XMLValidator.validate(xml)).toBe(true);
      expect(xml).not.toContain("<w:sdt>");
      expect(xml.toLocaleUpperCase(locale)).toContain(
        RESUME_LABELS[locale].experience.toLocaleUpperCase(locale),
      );
      expect(xml).toContain(document.header.availability);
      expect(xml).toContain(document.certifications[0].title);
      expect(xml).not.toContain('r:embed="rId16"');
      expect(xml).toContain('r:id="rIdResumeContact0"');
      const rels = await (
        await JSZip.loadAsync(buffer)
      )
        .file("word/_rels/document.xml.rels")!
        .async("string");
      expect(rels).toContain('Target="mailto:alex@example.com"');
      expect(rels).toContain('Target="https://calendly.com/alex"');
      for (const exp of document.experiences) {
        expect(xml).toContain(exp.company);
        expect(xml).toContain(exp.responsibilities[0]);
      }
      const ats = await generateDocxFromStructured(
        readResumeSnapshot(document)!,
      );
      const atsXml = await (
        await JSZip.loadAsync(ats)
      )
        .file("word/document.xml")!
        .async("string");
      expect(atsXml).toContain(document.header.availability);
      expect(atsXml).toContain(document.experiences[0].companyBlurb);
      if (process.env.RESUME_QA_OUTPUT) {
        await mkdir("scratch/resume-qa", { recursive: true });
        await writeFile(
          `scratch/resume-qa/${template.id}-${locale}.docx`,
          buffer,
        );
        await writeFile(
          `scratch/resume-qa/${template.id}-${locale}-ats.docx`,
          ats,
        );
        const sampleZip = await JSZip.loadAsync(input);
        const sampleRels = await sampleZip
          .file("word/_rels/document.xml.rels")!
          .async("string");
        const photoTarget =
          /<Relationship[^>]*Id="rId16"[^>]*Target="([^"]+)"/.exec(
            sampleRels,
          )?.[1];
        if (photoTarget) {
          const sample = await sampleZip
            .file(`word/${photoTarget}`)!
            .async("nodebuffer");
          const logoId =
            /w:val="image:companyLogo"[\s\S]*?r:embed="([^"]+)"/.exec(
              await sampleZip.file("word/document.xml")!.async("string"),
            )?.[1];
          const logoTarget = logoId
            ? new RegExp(
                `<Relationship[^>]*Id="${logoId}"[^>]*Target="([^"]+)"`,
              ).exec(sampleRels)?.[1]
            : undefined;
          const logoData = logoTarget
            ? await sampleZip.file(`word/${logoTarget}`)!.async("nodebuffer")
            : undefined;
          const companyLogos = logoData
            ? Object.fromEntries(
                document.experiences.map((exp) => [
                  exp.id,
                  { data: logoData, extension: "png" as const },
                ]),
              )
            : {};
          const withPhoto = await renderResumeTemplate(
            input,
            document,
            template,
            {
              data: sample,
              extension: photoTarget.endsWith("png") ? "png" : "jpeg",
            },
            companyLogos,
          );
          await writeFile(
            `scratch/resume-qa/${template.id}-${locale}-photo.docx`,
            withPhoto,
          );
        }
      }
    },
  );
  it("injects the supplied photo instead of the sample image", async () => {
    const { context, response } = setup();
    const { document } = validateTailoredResume(response, context);
    const photo = {
      data: Buffer.from("test image"),
      extension: "png" as const,
    };
    const zip = await JSZip.loadAsync(
      await renderResumeTemplate(
        await loadCvTemplateDocxBuffer("v2"),
        document,
        RESUME_TEMPLATES.v2,
        photo,
      ),
    );
    expect(
      await zip.file("word/media/resume-photo.png")!.async("nodebuffer"),
    ).toEqual(photo.data);
    expect(await zip.file("word/document.xml")!.async("string")).toContain(
      'r:embed="rIdResumePhoto"',
    );
  });
  it("keeps company logos bound to CMS experience IDs", async () => {
    const { context, response } = setup();
    const { document } = validateTailoredResume(response, context);
    const logo = {
      data: Buffer.from("company logo"),
      extension: "png" as const,
    };
    const zip = await JSZip.loadAsync(
      await renderResumeTemplate(
        await loadCvTemplateDocxBuffer("v2"),
        document,
        RESUME_TEMPLATES.v2,
        undefined,
        { "exp-1": logo },
      ),
    );
    const xml = await zip.file("word/document.xml")!.async("string");
    expect(xml.match(/r:embed="rIdResumeLogo1"/g)).toHaveLength(1);
    expect(
      await zip.file("word/media/resume-logo-1.png")!.async("nodebuffer"),
    ).toEqual(logo.data);
  });
  it.each(["en", "es", "nl"] as const)(
    "preserves company progression across pages in %s and separates later stints",
    async (locale) => {
      const { context, response } = setup(locale);
      const { document } = validateTailoredResume(response, context);
      const base = document.experiences[0];
      document.experiences = [
        { ...base, id: "other", company: "Other", current: false },
        {
          ...base,
          id: "lead",
          company: "Contollo",
          role: "Team Lead",
          startDate: "2024-11",
          endDate: "2025-03",
          current: false,
        },
        {
          ...base,
          id: "senior",
          company: "Contollo",
          role: "Senior Engineer",
          startDate: "2023-08",
          endDate: "2024-11",
          current: false,
        },
        { ...base, id: "musa", company: "Musa", current: false },
        {
          ...base,
          id: "earlier-stint",
          company: "Contollo",
          startDate: "2020-01",
          endDate: "2021-01",
          current: false,
        },
      ];
      const zip = await JSZip.loadAsync(
        await renderResumeTemplate(
          await loadCvTemplateDocxBuffer("v2"),
          document,
          RESUME_TEMPLATES.v2,
        ),
      );
      const xml = await zip.file("word/document.xml")!.async("string");
      const overallDates = resumeDates(
        { startDate: "2023-08", endDate: "2025-03" },
        locale,
      );
      // The group crosses the configured page boundary; both headers show its full range.
      expect(xml.split(overallDates)).toHaveLength(3);
      for (const role of document.experiences)
        expect(xml).toContain(resumeDates(role, locale));
      expect(xml.match(/w:val="CV-CareerRole-Progression"/g)).toHaveLength(2);
      expect(xml.match(/w:val="CV-CareerRole"/g)).toHaveLength(3);
      expect(xml.match(/>Contollo</g)).toHaveLength(3);
      const logoDrawings = [
        ...xml.matchAll(/<wp:inline\b[^>]*>[\s\S]*?<\/wp:inline>/g),
      ]
        .map(([drawing]) => drawing)
        .filter((drawing) => drawing.includes('r:embed="rIdResumeLogo'));
      expect(logoDrawings).toHaveLength(5);
      for (const drawing of logoDrawings) {
        expect(drawing).toContain('<wp:extent cx="300000" cy="300000"/>');
        expect(drawing).toContain('prst="roundRect"');
      }
    },
  );
  it("accepts another registered design without engine conditionals", async () => {
    const { context, response } = setup("en", "v1");
    const { document } = validateTailoredResume(response, context);
    const example = { ...RESUME_TEMPLATES.v1, id: "example", revision: 2 };
    await expect(
      renderResumeTemplate(
        await loadCvTemplateDocxBuffer("v1"),
        {
          ...document,
          templateId: example.id,
          templateRevision: example.revision,
        },
        example,
      ),
    ).resolves.toBeInstanceOf(Buffer);
  });
  it("fails clearly when required template tags are absent", async () => {
    const zip = await JSZip.loadAsync(
      await readFile("src/features/resume-engine/assets/cv-template.docx"),
    );
    const xml = await zip.file("word/document.xml")!.async("string");
    expect(() =>
      validateResumeTemplate(
        xml.replace('w:val="field:header.fullName"', 'w:val="field:unknown"'),
        RESUME_TEMPLATES.v1,
      ),
    ).toThrow("Unknown field");
  });
});
