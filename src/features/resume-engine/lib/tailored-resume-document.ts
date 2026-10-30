import { z } from "zod";
import type { Locale } from "@/i18n/config";
import {
  CvImportDraftSchema,
  type CvImportDraft,
} from "@/features/cv/lib/cv-import-draft";
import {
  CvMatchAnalysisSchema,
  CvScoreBreakdownSchema,
} from "./cv-match-analysis";
import { extractJobTools } from "./extract-job-tools";
import { getResumeTemplate, type CvTemplateVersion } from "./template-registry";
import { RESUME_LABELS } from "@/lib/cv/resume-labels";
import {
  ResumeSelectionSchema,
  selectResumeSource,
  validateResumeCoverage,
} from "./resume-selection";
import {
  contentLanguage,
  numericResumeFacts,
  changesProficiency,
  changesLanguageName,
  addsCredential,
} from "./resume-content-validation";

export const TailoredResumeDocumentSchema = CvImportDraftSchema.omit({
  detectedLocale: true,
})
  .extend({
    schemaVersion: z.literal(1),
    locale: z.enum(["en", "es", "nl"]),
    templateId: z.string().min(1),
    templateRevision: z.number().int().positive(),
    selection: z
      .object({
        omittedCertificationIds: z.array(z.string()),
        manifest: ResumeSelectionSchema.optional(),
      })
      .optional(),
    contacts: z.array(
      CvImportDraftSchema.shape.contacts.element.extend({
        id: z.string().min(1),
      }),
    ),
    skills: z.array(
      CvImportDraftSchema.shape.skills.element.extend({
        id: z.string().min(1),
      }),
    ),
    languages: z.array(
      CvImportDraftSchema.shape.languages.element.extend({
        id: z.string().min(1),
      }),
    ),
    certifications: z.array(
      CvImportDraftSchema.shape.certifications.element.extend({
        id: z.string().min(1),
      }),
    ),
    experiences: z.array(
      CvImportDraftSchema.shape.experiences.element.extend({
        id: z.string().min(1),
        responsibilityIds: z.array(z.string().min(1)),
      }),
    ),
  })
  .superRefine((document, ctx) => {
    for (const key of [
      "experiences",
      "education",
      "contacts",
      "skills",
      "languages",
      "certifications",
    ] as const) {
      const ids = document[key].map((item) => item.id);
      if (new Set(ids).size !== ids.length || ids.some((id) => !id))
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: "CMS identifiers must be nonempty and unique",
        });
    }
    document.experiences.forEach((exp, index) => {
      if (
        exp.responsibilityIds.length !== exp.responsibilities.length ||
        new Set(exp.responsibilityIds).size !== exp.responsibilityIds.length
      )
        ctx.addIssue({
          code: "custom",
          path: ["experiences", index, "responsibilityIds"],
          message: "Each bullet needs one unique CMS identifier",
        });
    });
  });
export type TailoredResumeDocument = z.infer<
  typeof TailoredResumeDocumentSchema
>;
export const TailoredResumeResponseSchema = z
  .object({
    schemaVersion: z.literal(1),
    locale: z.enum(["en", "es", "nl"]),
    selection: ResumeSelectionSchema,
    fields: z.array(z.object({ id: z.string(), text: z.string() }).strict()),
    aiScore: z.number().min(0).max(100),
    matchNotes: z.string().optional(),
    matchAnalysis: CvMatchAnalysisSchema.extend({
      scoreBreakdown: CvScoreBreakdownSchema,
      strengths: z.array(z.string().trim().min(1)).min(1),
    }),
  })
  .strict()
  .superRefine((response, ctx) => {
    const total = Object.values(response.matchAnalysis.scoreBreakdown).reduce(
      (sum, dimension) => sum + dimension.score,
      0,
    );
    if (response.aiScore !== total)
      ctx.addIssue({
        code: "custom",
        path: ["aiScore"],
        message: `aiScore must equal the sum of the five scoreBreakdown scores (${total})`,
      });
  });
export type TailoredResumeResponse = z.infer<
  typeof TailoredResumeResponseSchema
>;
export interface ResumeTextField {
  id: string;
  text: string;
  budget: number;
}
export interface TailorContext {
  drafts: Record<Locale, CvImportDraft>;
  templateId: CvTemplateVersion;
  targetLocale?: Locale;
  jobDescription: string;
  uiLocale?: Locale;
}

/** IDs come from CMS records; no DOCX positions or visible heading names. */
export function resumeTextFields(
  draft: CvImportDraft,
  templateId: CvTemplateVersion,
): ResumeTextField[] {
  const limits = getResumeTemplate(templateId).limits;
  const fields: ResumeTextField[] = [];
  const add = (id: string, text: string | undefined, budget = 180) => {
    if (text?.trim()) fields.push({ id, text, budget });
  };
  add("header.degree", draft.header.degree, 90);
  add("header.summary", draft.header.summary, limits.summary);
  add("header.availability", draft.header.availability, 70);
  for (const exp of draft.experiences) {
    add(`experience.${exp.id}.role`, exp.role, 100);
    add(`experience.${exp.id}.location`, exp.location, 100);
    add(`experience.${exp.id}.context`, exp.companyBlurb, 240);
    exp.responsibilities.forEach((text, i) => {
      if (!exp.responsibilityIds?.[i])
        throw new Error(
          `experience.${exp.id}: missing CMS responsibility identifier`,
        );
      add(
        `experience.${exp.id}.bullet.${exp.responsibilityIds[i]}`,
        text,
        limits.bullet,
      );
    });
  }
  for (const edu of draft.education) {
    add(`education.${edu.id}.degree`, edu.degreeName, 150);
    add(`education.${edu.id}.location`, edu.location, 100);
    if (!edu.startYear && !edu.endYear)
      add(`education.${edu.id}.dates`, edu.dates, 80);
  }
  draft.contacts
    .filter((contact) => contact.type === "LOCATION")
    .forEach((contact) =>
      add(`contact.${contact.id}.value`, contact.value, 100),
    );
  draft.languages.forEach((lang) => {
    if (!lang.id) throw new Error("languages: missing CMS identifier");
    add(`language.${lang.id}.name`, lang.name, 70);
    add(`language.${lang.id}.level`, lang.level, 100);
  });
  draft.certifications.forEach((cert) => {
    if (!cert.id) throw new Error("certifications: missing CMS identifier");
    add(`certification.${cert.id}.title`, cert.title, 180);
  });
  return fields;
}

const FOREIGN_PHRASES: Record<Locale, RegExp> = {
  en: /\b(sobre mí|experiencia laboral|disponibilidad inmediata|nativo o bilingüe|competencia profesional|desarrollé|implementé|ingeniero en|básico|holandés)\b/iu,
  es: /\b(native or bilingual|professional working proficiency|immediate availability|werkervaring|beschikbaarheid)\b/iu,
  nl: /\b(sobre mí|experiencia laboral|disponibilidad inmediata|nativo o bilingüe|competencia profesional|native or bilingual|professional working proficiency)\b/iu,
};

export function validateTailoredResume(
  raw: unknown,
  context: TailorContext,
): { document: TailoredResumeDocument; result: TailoredResumeResponse } {
  const result = TailoredResumeResponseSchema.parse(raw);
  if (context.targetLocale && result.locale !== context.targetLocale)
    throw new Error(
      `locale: expected ${context.targetLocale}, received ${result.locale}`,
    );
  const profile = context.drafts[result.locale];
  const template = getResumeTemplate(context.templateId);
  validateResumeCoverage(profile, result.selection, template);
  const source = selectResumeSource(profile, result.selection);
  const inventory = resumeTextFields(source, context.templateId);
  const supplied = new Map<string, string>();
  const allowed = new Map(inventory.map((field) => [field.id, field]));
  const issues: string[] = [];
  const sourceTools = new Set(
    extractJobTools(JSON.stringify(source)).map((tool) => tool.toLowerCase()),
  );
  for (const field of result.fields) {
    if (field.id === "header.fullName") {
      issues.push(
        "header.fullName: immutable CMS identity; remove this entry from fields. The application copies the name automatically. Use only IDs from the prompt's field inventory.",
      );
      continue;
    }
    const original = allowed.get(field.id);
    if (!original || supplied.has(field.id)) {
      issues.push(`${field.id}: unknown, unselected or duplicate field`);
      continue;
    }
    const text = field.text.trim();
    supplied.set(field.id, text);
    if (!text || text.length > original.budget)
      issues.push(
        `${field.id}: required text, maximum ${original.budget} characters`,
      );
    if (!text) continue;
    const language = contentLanguage(text);
    if (
      FOREIGN_PHRASES[result.locale].test(text) ||
      (language && language !== result.locale)
    )
      issues.push(`${field.id}: untranslated content for ${result.locale}`);
    if (
      numericResumeFacts(text).join("|") !==
      numericResumeFacts(original.text).join("|")
    )
      issues.push(`${field.id}: changed numeric facts or proficiency level`);
    if (
      field.id.startsWith("language.") &&
      field.id.endsWith(".level") &&
      changesProficiency(original.text, text)
    )
      issues.push(`${field.id}: changed proficiency level`);
    if (
      field.id.startsWith("language.") &&
      field.id.endsWith(".name") &&
      changesLanguageName(original.text, text)
    )
      issues.push(`${field.id}: changed language identity`);
    const unexpected = extractJobTools(text).filter(
      (tool) => !sourceTools.has(tool.toLowerCase()),
    );
    if (unexpected.length)
      issues.push(
        `${field.id}: unsupported technologies: ${unexpected.join(", ")}`,
      );
    if (addsCredential(original.text, text))
      issues.push(`${field.id}: unsupported credential`);
    if (field.id.startsWith("certification.")) {
      const tokens =
        original.text.match(
          /\b[a-z]{2,}-\d+(?:-\d+)*\b|\bi\d+n\b|\bc#|(?:asp)?\.net(?:\s+core)?/giu,
        ) ?? [];
      const changed = tokens.filter(
        (token) => !text.toLowerCase().includes(token.toLowerCase()),
      );
      if (changed.length)
        issues.push(
          `${field.id}: preserve credential codes and technology names: ${changed.join(", ")}`,
        );
    }
  }
  for (const field of inventory)
    if (!supplied.has(field.id))
      issues.push(`${field.id}: missing translation`);
  const experiences = source.experiences.map((exp) => {
    const bullets = exp.responsibilities
      .map((_, i) => ({
        id: exp.responsibilityIds?.[i] ?? String(i),
        text:
          supplied.get(
            `experience.${exp.id}.bullet.${exp.responsibilityIds?.[i] ?? i}`,
          ) ?? "",
      }))
      .filter((b) => b.text);
    if (
      exp.responsibilities.length &&
      (!bullets.length || bullets.length > template.limits.bulletsPerExperience)
    )
      issues.push(
        `experience.${exp.id}: select 1–${template.limits.bulletsPerExperience} bullets`,
      );
    return {
      ...exp,
      role: supplied.get(`experience.${exp.id}.role`) ?? "",
      location: supplied.get(`experience.${exp.id}.location`),
      companyBlurb: supplied.get(`experience.${exp.id}.context`),
      responsibilities: bullets.map((b) => b.text),
      responsibilityIds: bullets.map((b) => b.id),
      atsResponsibilities: [],
    };
  });
  if (issues.length)
    throw new Error(`Resume validation failed:\n${issues.join("\n")}`);
  const document = TailoredResumeDocumentSchema.parse({
    ...source,
    schemaVersion: 1,
    locale: result.locale,
    templateId: template.id,
    templateRevision: template.revision,
    header: {
      ...source.header,
      degree: supplied.get("header.degree"),
      summary: supplied.get("header.summary"),
      availability: supplied.get("header.availability"),
    },
    experiences,
    education: source.education.map((edu) => ({
      ...edu,
      degreeName: supplied.get(`education.${edu.id}.degree`) ?? "",
      location: supplied.get(`education.${edu.id}.location`),
      dates:
        edu.startYear || edu.endYear
          ? undefined
          : supplied.get(`education.${edu.id}.dates`),
    })),
    contacts: source.contacts.map((contact) =>
      contact.type === "LOCATION"
        ? {
            ...contact,
            value: supplied.get(`contact.${contact.id}.value`) ?? "",
          }
        : contact,
    ),
    languages: source.languages.map((lang) => ({
      ...lang,
      name: supplied.get(`language.${lang.id}.name`) ?? "",
      level: supplied.get(`language.${lang.id}.level`) ?? "",
    })),
    selection: {
      manifest: result.selection,
      omittedCertificationIds: profile.certifications
        .filter(
          (cert) =>
            cert.id && !result.selection.certificationIds.includes(cert.id),
        )
        .map((cert) => cert.id),
    },
    certifications: source.certifications.map((cert) => ({
      ...cert,
      title: supplied.get(`certification.${cert.id}.title`) ?? "",
    })),
  });
  let offset = 0;
  if (
    experiences.length >
    template.experiencePages.reduce((sum, count) => sum + count, 0)
  )
    throw new Error(
      "experiences: template capacity exceeded; choose a larger design",
    );
  template.experiencePages.forEach((count, page) => {
    const pageExperiences = experiences.slice(offset, offset + count);
    const textLength =
      pageExperiences
        .map((exp) =>
          [
            exp.company,
            exp.role,
            exp.companyBlurb,
            exp.location,
            exp.startDate,
            exp.endDate,
            ...exp.responsibilities,
          ]
            .filter(Boolean)
            .join("\n"),
        )
        .join("\n").length +
      (page === 0 ? (document.header.summary?.length ?? 0) : 0);
    if (textLength > template.maxPageCharacters[page])
      issues.push(
        `experiences.page.${page + 1}: shorten content to ${template.maxPageCharacters[page]} characters`,
      );
    offset += count;
  });
  // Measure printed text, never serialized IDs, JSON keys or provenance.
  const sidebarSections = {
    education: document.education
      .map((edu) =>
        [
          edu.degreeName,
          edu.institution,
          edu.location,
          edu.startYear,
          edu.endYear,
          edu.dates,
        ]
          .filter(Boolean)
          .join(" · "),
      )
      .join("\n").length,
    skills: document.skills
      .map((skill) =>
        [RESUME_LABELS[document.locale][skill.category], ...skill.items].join(
          " · ",
        ),
      )
      .join("\n").length,
    languages: document.languages
      .map((lang) => `${lang.name}: ${lang.level}`)
      .join("\n").length,
    certifications: document.certifications
      .map((cert) =>
        [cert.title, cert.issuer, cert.year].filter(Boolean).join(" · "),
      )
      .join("\n").length,
    availability: document.header.availability?.length ?? 0,
  };
  const sidebarLength = Object.values(sidebarSections).reduce(
    (sum, count) => sum + count,
    0,
  );
  if (document.certifications.length > template.limits.certifications)
    issues.push(
      `selection.certificationIds: selected ${document.certifications.length}; maximum ${template.limits.certifications} for ${template.id}. Select only credentials that add relevant evidence; zero is allowed.`,
    );
  if (sidebarLength > template.limits.sidebarCharacters)
    issues.push(
      `selection: sidebar uses ${sidebarLength}/${template.limits.sidebarCharacters} visible characters (${sidebarLength - template.limits.sidebarCharacters} over). Sections: ${JSON.stringify(sidebarSections)}. Condense descriptions and omit optional certifications first. Skills may be reduced above requiredCoverage minimums; never remove required education, languages or roles. Remove fields only for legitimately unselected records. Preserve facts in retained items.`,
    );
  if (issues.length)
    throw new Error(`Resume validation failed:\n${issues.join("\n")}`);
  const selectionChanged =
    profile.experiences.length !== document.experiences.length ||
    profile.education.length !== document.education.length ||
    profile.languages.length !== document.languages.length ||
    profile.certifications.length !== document.certifications.length ||
    profile.skills.reduce((sum, group) => sum + group.items.length, 0) !==
      document.skills.reduce((sum, group) => sum + group.items.length, 0) ||
    profile.experiences.reduce(
      (sum, exp) => sum + exp.responsibilities.length,
      0,
    ) !==
      document.experiences.reduce(
        (sum, exp) => sum + exp.responsibilities.length,
        0,
      );
  if (selectionChanged) {
    const note = {
      en: `Selected for this job: ${document.experiences.length} experiences, ${document.education.length} education records, ${document.skills.reduce((sum, group) => sum + group.items.length, 0)} skills and ${document.certifications.length} certifications. The complete profile remains in the CMS.`,
      es: `Selección para esta oferta: ${document.experiences.length} experiencias, ${document.education.length} registros de formación, ${document.skills.reduce((sum, group) => sum + group.items.length, 0)} habilidades y ${document.certifications.length} certificaciones. El perfil completo sigue en el CMS.`,
      nl: `Geselecteerd voor deze vacature: ${document.experiences.length} werkervaringen, ${document.education.length} opleidingen, ${document.skills.reduce((sum, group) => sum + group.items.length, 0)} vaardigheden en ${document.certifications.length} certificeringen. Het volledige profiel blijft in het CMS.`,
    }[context.uiLocale ?? document.locale];
    result.matchNotes = [result.matchNotes, note].filter(Boolean).join("\n");
  }
  return { document, result };
}

export function documentToDraft(
  document: TailoredResumeDocument,
): CvImportDraft {
  return CvImportDraftSchema.parse({
    ...document,
    detectedLocale: document.locale,
  });
}

/** Existing export snapshots remain readable; they are never migrated or retranslated. */
export function readResumeSnapshot(snapshot: unknown): CvImportDraft | null {
  const document = TailoredResumeDocumentSchema.safeParse(snapshot);
  if (document.success) return documentToDraft(document.data);
  const historical = CvImportDraftSchema.safeParse(snapshot);
  return historical.success ? historical.data : null;
}
