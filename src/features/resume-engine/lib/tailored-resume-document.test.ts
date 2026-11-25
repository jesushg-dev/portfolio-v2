import { experienceTextLength } from "./resume-pagination";
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
    source: drafts[locale],
    targetLocale: locale,
    templateId,
    jobDescription: "Buscamos una persona que programe con React.",
  };
  const response = resumeResponseFixture(drafts[locale], templateId);
  return { context, response };
}

describe("canonical multilingual resume", () => {
  it("copies saved language and availability for the detected locale even if an older prompt rewrote them", () => {
    const { context } = setup("en");
    context.targetLocale = undefined;
    context.localizedFacts = {
      es: {
        savedFields: {
          "language.lang-1.name": "Español",
          "language.lang-1.level": "Competencia profesional (B2)",
          "header.availability": "Disponible en dos semanas",
        },
        softSkills: [],
      },
    };
    const response = resumeResponseFixture(drafts.es, "v2");
    response.fields = response.fields.filter(
      (field) =>
        field.id !== "header.availability" &&
        field.id !== "language.lang-1.name",
    );
    response.fields.find(
      (field) => field.id === "language.lang-1.level",
    )!.text = "Dominio nativo C2";
    const document = validateTailoredResume(response, context).document;
    expect(document.languages[0]).toMatchObject({
      name: "Español",
      level: "Competencia profesional (B2)",
    });
    expect(document.header.availability).toBe("Disponible en dos semanas");
  });
  it("accepts typographic spacing around an unchanged percentage", () => {
    const { context, response } = setup("es");
    const field = response.fields.find((item) => item.text.includes("25%"))!;
    field.text = field.text.replace("25%", "25 %");
    expect(() => validateTailoredResume(response, context)).not.toThrow();
  });

  it("ignores embedded digits in technical acronyms like E2E or OAuth2 when checking numeric facts", () => {
    const { context, response } = setup("en");
    const summary = response.fields.find(({ id }) => id === "header.summary")!;
    summary.text =
      "Computer engineer with 6+ years of experience in E2E/unit testing, OAuth2, S3, and B2B platforms.";
    expect(() => validateTailoredResume(response, context)).not.toThrow();
  });
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
  it("applies the vacancy's React spelling to the sidebar and prose in both DOCX formats", async () => {
    const { context, response } = setup();
    context.jobDescription =
      "Experience in React.js, React Native and AngularJS.";
    const { document } = validateTailoredResume(
      {
        ...response,
        technologyNames: [{ skillId: "skill-react", name: "React.js" }],
      },
      context,
    );

    expect(context.source.skills[0].items[0]).toBe("React");
    expect(document.skills[0].skillIds?.[0]).toBe("skill-react");
    expect(document.skills[0].items[0]).toBe("React.js");
    expect(document.header.summary).toContain("with React.js and TypeScript");
    expect(document.experiences[0].responsibilities[0]).toContain(
      "React.js interfaces",
    );

    const template = RESUME_TEMPLATES.v2;
    const visual = await renderResumeTemplate(
      await loadCvTemplateDocxBuffer(template.id),
      document,
      template,
    );
    const ats = await generateDocxFromStructured(readResumeSnapshot(document)!);
    for (const buffer of [visual, ats]) {
      const xml = await (
        await JSZip.loadAsync(buffer)
      )
        .file("word/document.xml")!
        .async("string");
      expect(xml).toContain("React.js");
      expect(xml).not.toContain("React Native");
    }
  });

  it.each([
    "React Native",
    "React Router",
    "React.js 19",
    "Kubernetes",
    "AngularJS",
  ])("rejects unsupported claims about %s in a React CV", (technology) => {
    const { context, response } = setup();
    response.fields.find(
      ({ id }) => id === "experience.exp-0.bullet.resp-0-1",
    )!.text =
      "Built accessible " + technology + " interfaces for the customer portal.";
    expect(() => validateTailoredResume(response, context)).toThrow(
      technology === "React.js 19"
        ? "changed numeric facts"
        : "unsupported technologies",
    );
  });

  it("reports the original bullet number, text, and detected values for a rejected rewrite", () => {
    const { context } = setup();
    const selection = resumeSelectionFixture(context.source);
    selection.experiences[0].responsibilityIds = ["resp-0-2"];
    const response = resumeResponseFixture(context.source, "v2", selection);
    const fieldId = "experience.exp-0.bullet.resp-0-2";
    const proposed =
      "Reduced response times by 50% through SQL query optimization.";
    response.fields.find(({ id }) => id === fieldId)!.text = proposed;

    expect.assertions(1);
    try {
      validateTailoredResume(response, context);
    } catch (error) {
      expect(error).toMatchObject({
        fieldIssues: [
          {
            fieldId,
            field: "bullet",
            context: "Acme · Software Engineer",
            bullet: 2,
            reason: "numericFacts",
            original: context.source.experiences[0].responsibilities[1],
            proposed,
            numericFacts: { original: ["25%"], proposed: ["50%"] },
          },
        ],
      });
    }
  });

  it("uses the vacancy's casing and keeps distinct technologies separate", () => {
    const { context, response } = setup();
    context.jobDescription = "Experience with reactjs and NextJS.";
    const { document } = validateTailoredResume(
      {
        ...response,
        technologyNames: [
          { skillId: "skill-react", name: "reactjs" },
          { skillId: "skill-next", name: "NextJS" },
        ],
      },
      context,
    );
    expect(document.skills[0].items).toEqual([
      "reactjs",
      "TypeScript",
      "NextJS",
    ]);

    context.jobDescription = "Experience with React Native and AngularJS.";
    expect(
      validateTailoredResume(response, context).document.skills[0].items,
    ).toEqual(["React", "TypeScript", "Next.js"]);
  });

  it("accepts a vacancy acronym without a predefined spelling", () => {
    const { context } = setup();
    const frontend = context.source.skills[0];
    context.source = {
      ...context.source,
      skills: [
        {
          ...frontend,
          items: [...frontend.items, "Windows Presentation Foundation"],
          skillIds: [...frontend.skillIds!, "skill-wpf"],
        },
        ...context.source.skills.slice(1),
      ],
    };
    context.jobDescription = "Experience using WPF.";
    const response = resumeResponseFixture(context.source, "v2");
    const { document } = validateTailoredResume(
      {
        ...response,
        technologyNames: [{ skillId: "skill-wpf", name: "WPF" }],
      },
      context,
    );
    expect(document.skills[0].items).toContain("WPF");
  });

  it.each([
    ["v1", false],
    ["v2", false],
    ["v2", true],
  ] as const)(
    "exports the exact keyword APIs REST in %s with a display name proposal (%s)",
    async (templateId, rename) => {
      const source = resumeFixture("es");
      const group = source.skills[1];
      group.items.push("REST APIs");
      group.skillIds!.push("skill-rest");
      source.experiences[0].technologies = ["REST APIs"];
      source.experiences[0].technologyIds = ["skill-rest"];
      const { context } = setup("es", templateId);
      context.source = source;
      context.jobDescription =
        "Buscamos experiencia en desarrollo de APIs REST.";
      const response = resumeResponseFixture(source, templateId);
      const summary = response.fields.find(
        ({ id }) => id === "header.summary",
      )!;
      summary.text += " Diseño de REST APIs.";
      const { document } = validateTailoredResume(
        {
          ...response,
          technologyNames: rename
            ? [{ skillId: "skill-rest", name: "APIs REST" }]
            : [],
        },
        context,
      );
      const index = document.skills[1].skillIds!.indexOf("skill-rest");
      expect(document.skills[1].items[index]).toBe("APIs REST");
      expect(document.header.summary).toContain("APIs REST");
      expect(document.experiences[0].technologies).toEqual(["APIs REST"]);
      expect(group.items).toContain("REST APIs");
      const template = RESUME_TEMPLATES[templateId];
      for (const buffer of [
        await renderResumeTemplate(
          await loadCvTemplateDocxBuffer(template.id),
          document,
          template,
        ),
        await generateDocxFromStructured(readResumeSnapshot(document)!),
      ]) {
        const xml = await (
          await JSZip.loadAsync(buffer)
        )
          .file("word/document.xml")!
          .async("string");
        expect(xml).toContain("APIs REST");
        expect(xml).not.toContain("REST APIs");
      }
    },
  );

  it.each([
    ["Stack: NextJS, next.js, next.js.", "next.js"],
    ["Stack: NextJS, next.js.", "NextJS"],
  ])(
    "chooses the most frequent exact spelling and breaks a tie by first mention in %s",
    (vacancy, expected) => {
      const { context, response } = setup();
      context.jobDescription = vacancy;
      const { document } = validateTailoredResume(
        {
          ...response,
          technologyNames: [{ skillId: "skill-next", name: "next.js" }],
        },
        context,
      );
      expect(document.skills[0].items).toContain(expected);
    },
  );

  it("keeps a reordered spelling that has its own catalog ID with its owner", () => {
    const source = resumeFixture("es");
    source.skills[1].items.push("REST APIs", "APIs REST");
    source.skills[1].skillIds!.push("skill-rest", "other-skill");
    const { context } = setup("es");
    context.source = source;
    context.jobDescription = "Buscamos experiencia con APIs REST.";
    expect(() =>
      validateTailoredResume(
        {
          ...resumeResponseFixture(source, "v2"),
          technologyNames: [{ skillId: "skill-rest", name: "APIs REST" }],
        },
        context,
      ),
    ).toThrow("different technology");
  });

  it("rejects RESTful APIs for REST APIs until approved as an equivalence, then mirrors it cleanly", () => {
    const source = resumeFixture("en");
    const group = source.skills[1];
    group.items.push("REST APIs");
    group.skillIds!.push("skill-rest");
    source.experiences[0].technologies = ["REST APIs"];
    source.experiences[0].technologyIds = ["skill-rest"];
    const { context } = setup("en", "v2");
    context.source = source;
    context.jobDescription =
      "We build scalable RESTful APIs. Experience with RESTful APIs required.";

    const firstAttempt = resumeResponseFixture(source, "v2");
    expect(() =>
      validateTailoredResume(
        {
          ...firstAttempt,
          technologyNames: [{ skillId: "skill-rest", name: "RESTful APIs" }],
        },
        context,
      ),
    ).toThrow("different technology");

    const approvedContext: TailorContext = {
      ...context,
      technologyEquivalences: [
        { original: "REST APIs", proposed: "RESTful APIs" },
      ],
    };

    for (const [summarySuffix, technologyNames] of [
      [
        " Experience with RESTful APIs.",
        [{ skillId: "skill-rest", name: "RESTful APIs" }],
      ],
      [" Experience with REST APIs.", []],
    ] as const) {
      const nextResponse = resumeResponseFixture(source, "v2");
      nextResponse.fields.find(({ id }) => id === "header.summary")!.text +=
        summarySuffix;
      const { document } = validateTailoredResume(
        {
          ...nextResponse,
          technologyNames: [...technologyNames],
        },
        approvedContext,
      );
      const index = document.skills[1].skillIds!.indexOf("skill-rest");
      expect(document.skills[1].items[index]).toBe("RESTful APIs");
      expect(document.header.summary).toContain("RESTful APIs");
      expect(document.experiences[0].technologies).toEqual(["RESTful APIs"]);
    }
  });

  it.each([
    ["unknown-id", "", "React.js", "technologyNotSelected"],
    ["skill-next", "Next.js", "React.js", "technologyNotSelected"],
    ["skill-react", "React", "react.js", "technologyVacancySpelling"],
    ["skill-react", "React", "React Native", "technologyIdentity"],
    ["skill-react", "React", "React.js 19", "technologyVersion"],
  ])(
    "reports the names for %s (%s) when the proposal %s is rejected",
    (skillId, original, proposed, reason) => {
      const { context, response } = setup("en", "v1");
      response.selection.skills[0].skillIds = [
        "skill-react",
        "skill-typescript",
      ];
      context.jobDescription =
        "Experience with React.js, React Native, and React.js 19.";
      expect.assertions(3);
      try {
        validateTailoredResume(
          {
            ...response,
            technologyNames: [{ skillId, name: proposed }],
          },
          context,
        );
      } catch (error) {
        expect(error).toMatchObject({
          fieldIssues: [
            { field: "technologyName", original, proposed, reason },
          ],
        });
        expect((error as Error).message).toContain(
          original ? `“${original}” → “${proposed}”` : `“${proposed}”`,
        );
        expect((error as Error).message).not.toContain(skillId);
      }
    },
  );

  it("validates an auto-detected output locale against a profile sent in a single source locale", () => {
    const { context } = setup();
    context.targetLocale = undefined;
    context.jobDescription = "Buscamos experiencia con React.js.";
    const response = resumeResponseFixture(drafts.es, "v2");
    const { document } = validateTailoredResume(
      {
        ...response,
        technologyNames: [{ skillId: "skill-react", name: "React.js" }],
      },
      context,
    );
    expect(document.locale).toBe("es");
    expect(document.header.summary).toContain(
      "desarrollando plataformas web con React.js",
    );
  });
  it("rejects an AI locale conflicting with an explicit choice", () => {
    const { context, response } = setup();
    expect(() =>
      validateTailoredResume({ ...response, locale: "es" }, context),
    ).toThrow("locale: expected en");
  });
  it.each([
    [
      "Senior Software Engineer · Ingeniero en Computación",
      "use one professional title",
    ],
    ["Software Engineer", "untranslated content for es"],
    ["Ingeniero de software sénior", "seniority or leadership level"],
    ["Desarrollador de TypeScript", "unsupported technologies: TypeScript"],
  ])("rejects the professional title %s", (title, issue) => {
    const { context, response } = setup("es");
    response.fields.find((field) => field.id === "header.degree")!.text = title;
    expect(() => validateTailoredResume(response, context)).toThrow(
      `header.degree: ${issue}`,
    );
  });
  it("accepts .NET in the title when it is linked to a selected CMS role", () => {
    const { context } = setup("es", "v1");
    context.jobDescription = "Buscamos experiencia con .Net.";
    const source = {
      ...drafts.es,
      experiences: drafts.es.experiences.map((experience, index) =>
        index === 0 ? { ...experience, technologies: [".NET"] } : experience,
      ),
    };
    context.source = source;
    const selection = resumeSelectionFixture(source);
    const title = "Desarrollador .NET";
    const response = resumeResponseFixture(source, "v1", selection);
    response.fields.find((field) => field.id === "header.degree")!.text = title;
    expect(
      validateTailoredResume(response, context).document.header.degree,
    ).toBe("Desarrollador .Net");

    const withoutRole = resumeResponseFixture(source, "v1", {
      ...selection,
      experiences: selection.experiences.slice(1),
    });
    withoutRole.fields.find((field) => field.id === "header.degree")!.text =
      title;
    expect(() => validateTailoredResume(withoutRole, context)).toThrow(
      "header.degree: unsupported technologies: .NET",
    );
  });
  it("offers a professional title even when the CMS header has none", () => {
    const { context } = setup("es");
    const source = {
      ...drafts.es,
      header: { ...drafts.es.header, degree: undefined },
    };
    context.source = source;
    const response = resumeResponseFixture(source, "v2");
    expect(response.fields).toContainEqual({
      id: "header.degree",
      text: source.experiences[0].role,
    });
    expect(
      validateTailoredResume(response, context).document.header.degree,
    ).toBe(source.experiences[0].role);
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
    context.source = {
      ...drafts.en,
      header: {
        ...drafts.en.header,
        availability: drafts.es.header.availability,
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
    context.source = large;
    const response = resumeResponseFixture(large, "v1");
    expect(() => validateTailoredResume(response, context)).toThrow(
      "template capacity exceeded",
    );
  });
});

describe("official Word templates", () => {
  it("keeps individual skill bullets, the role heading and saved soft skills in V1", async () => {
    const { context, response } = setup("es", "v1");
    context.localizedFacts = {
      es: {
        savedFields: {},
        softSkills: [{ id: "team", name: "Colaboración" }],
      },
    };
    const { document } = validateTailoredResume(response, context);
    const visual = await renderResumeTemplate(
      await loadCvTemplateDocxBuffer("v1"),
      document,
      RESUME_TEMPLATES.v1,
    );
    const xml = await (
      await JSZip.loadAsync(visual)
    )
      .file("word/document.xml")!
      .async("string");
    expect(xml).toContain('w:pStyle w:val="Ttulo"');
    expect(xml).toContain(">Tiempo completo | Ingeniero de software<");
    for (const name of document.skills[0].items)
      expect(xml).toContain(`>${name}</w:t>`);
    expect(xml).toContain(">HABILIDADES BLANDAS<");
    expect(xml).toContain(">Colaboración<");
    expect(readResumeSnapshot(document)?.softSkills).toEqual(
      document.softSkills,
    );
  });
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
        skillIds: skill.skillIds.slice(0, 3),
      }));
      selection.certificationIds = [source.certifications[0].id];
      const context: TailorContext = {
        source,
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
      response.selection.skills[0].skillIds = ["unknown-id"];
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
    context.source = source;
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
    context.source = source;
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
    context.source = source;
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
      const title = {
        en: "React Software Engineer",
        es: "Desarrollador de React",
        nl: "React-ontwikkelaar",
      }[locale];
      response.fields.find((field) => field.id === "header.degree")!.text =
        title;
      const { document } = validateTailoredResume(response, context);
      expect(document.experiences[0].role).toBe(
        drafts[locale].experiences[0].role,
      );
      expect(document.education[0].degreeName).toBe(
        drafts[locale].education[0].degreeName,
      );
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
      for (const exportedXml of [xml, atsXml]) {
        expect(exportedXml.split(`>${title}<`)).toHaveLength(2);
      }
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
      const firstPageCharacters =
        (document.header.summary?.length ?? 0) +
        document.experiences
          .slice(0, 2)
          .reduce((sum, role) => sum + experienceTextLength(role) + 1, 0);
      const template = {
        ...RESUME_TEMPLATES.v2,
        maxPageCharacters: [firstPageCharacters, 5200],
      };
      const zip = await JSZip.loadAsync(
        await renderResumeTemplate(
          await loadCvTemplateDocxBuffer("v2"),
          document,
          template,
        ),
      );
      const xml = await zip.file("word/document.xml")!.async("string");
      const overallDates = resumeDates(
        { startDate: "2023-08", endDate: "2025-03" },
        locale,
      );
      // The first-page text budget splits this company group; both headers show its full range.
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
