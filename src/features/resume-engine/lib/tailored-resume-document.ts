import {
  paginateResumeExperiences,
  experienceTextLength,
} from "./resume-pagination";
import { z } from "zod";
import type { Locale } from "@/i18n/config";
import type { SavedResumeFacts } from "@/features/cv/lib/load-cv-structured-draft";
import {
  CvImportDraftSchema,
  type CvImportDraft,
} from "@/features/cv/lib/cv-import-draft";
import {
  CvMatchAnalysisSchema,
  CvScoreBreakdownSchema,
} from "./cv-match-analysis";
import {
  createTechnologyMatcher,
  extractJobTools,
  rewrittenTechnologyNames,
  technologyNameKey,
  type TechnologyEquivalence,
} from "./extract-job-tools";
import {
  declaredResumeTechnologies,
  validateResumeTechnologyNames,
} from "./resume-technology-names";
import { getResumeTemplate, type CvTemplateVersion } from "./template-registry";
import { RESUME_LABELS } from "@/lib/cv/resume-labels";
import {
  ResumeTailorValidationError,
  type ResumeTailorFieldIssue,
  type ResumeTailorFieldKind,
} from "./resume-tailor-validation-error";
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
  addsRoleLevel,
  RESUME_TITLE_SEPARATOR,
} from "./resume-content-validation";

const ResumeSnapshotSchema = CvImportDraftSchema.omit({
  detectedLocale: true,
})
  .extend({
    schemaVersion: z.literal(1),
    locale: z.enum(["en", "es", "nl"]),
    templateId: z.string().min(1),
    templateRevision: z.number().int().positive(),
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
export const TailoredResumeDocumentSchema = ResumeSnapshotSchema.safeExtend({
  selection: z
    .object({
      omittedCertificationIds: z.array(z.string()),
      manifest: ResumeSelectionSchema.optional(),
    })
    .optional(),
});
export type TailoredResumeDocument = z.infer<
  typeof TailoredResumeDocumentSchema
>;
export const TailoredResumeResponseSchema = z
  .object({
    schemaVersion: z.literal(1),
    locale: z.enum(["en", "es", "nl"]),
    selection: ResumeSelectionSchema,
    technologyNames: z
      .array(
        z
          .object({
            skillId: z.string().min(1),
            name: z
              .string()
              .min(1)
              .refine((name) => name === name.trim() && !/[\r\n]/u.test(name)),
          })
          .strict(),
      )
      .optional(),
    fields: z.array(z.object({ id: z.string(), text: z.string() }).strict()),
    aiScore: z.number().min(0).max(100),
    matchNotes: z
      .preprocess((val) => {
        if (typeof val !== "string") return val;
        const words = val.trim().split(/\s+/u);
        return words.length > 250 ? words.slice(0, 250).join(" ") : val;
      }, z.string())
      .optional(),
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
export type { TechnologyEquivalence } from "./extract-job-tools";

export interface TailorContext {
  source: CvImportDraft;
  localizedFacts?: SavedResumeFacts;
  confirmedTechnologies?: string[];
  technologyEquivalences?: TechnologyEquivalence[];
  rejectedTechnologyEquivalences?: TechnologyEquivalence[];
  vacancyTechnologies?: string[];
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
  const savedTitle = draft.header.degree?.trim();
  add(
    "header.degree",
    savedTitle?.length ? savedTitle : draft.experiences[0]?.role,
    limits.title,
  );
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

function applyVacancyTechnologyNames(
  text: string,
  mentions: ReturnType<ReturnType<typeof createTechnologyMatcher>>,
  spellings: Map<string, string>,
) {
  let result = "";
  let end = 0;
  for (const { name, key, index } of mentions) {
    result += text.slice(end, index) + (spellings.get(key) ?? name);
    end = index + name.length;
  }
  return result + text.slice(end);
}

function resumeFieldLocation(
  fieldId: string,
  profile: CvImportDraft,
): Pick<ResumeTailorFieldIssue, "field" | "context" | "bullet"> {
  const [section, recordId, key, bulletId] = fieldId.split(".");
  if (section === "experience") {
    const experience = profile.experiences.find(({ id }) => id === recordId);
    const fields: Record<string, ResumeTailorFieldKind> = {
      role: "role",
      location: "location",
      context: "companyContext",
      bullet: "bullet",
    };
    const index = experience?.responsibilityIds?.indexOf(bulletId) ?? -1;
    return {
      field: fields[key] ?? "field",
      context: experience
        ? `${experience.company} · ${experience.role}`
        : undefined,
      bullet: index >= 0 ? index + 1 : undefined,
    };
  }
  if (section === "education") {
    return {
      field:
        key === "degree" ? "degree" : key === "dates" ? "dates" : "location",
      context: profile.education.find(({ id }) => id === recordId)?.institution,
    };
  }
  if (section === "language") {
    return {
      field: key === "level" ? "languageLevel" : "language",
      context: profile.languages.find(({ id }) => id === recordId)?.name,
    };
  }
  if (section === "certification") {
    return {
      field: "certification",
      context: profile.certifications.find(({ id }) => id === recordId)?.title,
    };
  }
  const fields: Record<string, ResumeTailorFieldKind> = {
    "header.degree": "title",
    "header.summary": "summary",
    "header.availability": "availability",
    contact: "location",
  };
  return { field: fields[fieldId] ?? fields[section] ?? "field" };
}

export function validateTailoredResume(
  raw: unknown,
  context: TailorContext,
): { document: TailoredResumeDocument; result: TailoredResumeResponse } {
  const result = TailoredResumeResponseSchema.parse(raw);
  if (context.targetLocale && result.locale !== context.targetLocale)
    throw new Error(
      `locale: expected ${context.targetLocale}, received ${result.locale}`,
    );
  const profile = context.source;
  const template = getResumeTemplate(context.templateId);
  const source = selectResumeSource(profile, result.selection);
  validateResumeCoverage(profile, result.selection, template);
  const inventory = resumeTextFields(source, context.templateId);
  const saved = context.localizedFacts?.[result.locale];
  const supplied = new Map(
    inventory.flatMap(({ id }) =>
      saved?.savedFields[id] ? [[id, saved.savedFields[id]] as const] : [],
    ),
  );
  const allowed = new Map(inventory.map((field) => [field.id, field]));
  const issues: string[] = [];
  const fieldIssues: ResumeTailorFieldIssue[] = [];
  const reportFieldIssue = (
    field: ResumeTextField,
    proposed: string,
    reason: ResumeTailorFieldIssue["reason"],
    technical: string,
    details?: Pick<
      ResumeTailorFieldIssue,
      "limit" | "locale" | "tokens" | "numericFacts"
    >,
  ) => {
    issues.push(`${field.id}: ${technical}`);
    fieldIssues.push({
      fieldId: field.id,
      ...resumeFieldLocation(field.id, profile),
      original: field.text,
      proposed,
      reason,
      ...details,
    });
  };
  const profileNames = declaredResumeTechnologies(profile);
  const vacancyTools = extractJobTools(
    context.jobDescription,
    profileNames,
    [
      ...(context.vacancyTechnologies ?? []),
      ...(result.matchAnalysis.vacancyTechnologies ?? []),
    ],
    context.technologyEquivalences,
  );
  const names = validateResumeTechnologyNames(
    profile,
    source,
    result.technologyNames ?? [],
    context.jobDescription,
    context.confirmedTechnologies,
    vacancyTools,
    context.technologyEquivalences,
  );
  const evidenceTechnologies = createTechnologyMatcher([
    ...profileNames,
    ...vacancyTools,
  ]);
  const matchTechnologies = createTechnologyMatcher([
    ...profileNames,
    ...vacancyTools,
    ...names.displayNameBySpelling.keys(),
    ...(context.confirmedTechnologies ?? []),
  ]);
  const evidenceKeys = (text: string) =>
    evidenceTechnologies(text).map(
      ({ key }) => names.catalogNameByVacancyName.get(key) ?? key,
    );
  const sourceTools = new Set([
    ...source.skills.flatMap((skill) => skill.items.map(technologyNameKey)),
    ...source.experiences.flatMap((experience) =>
      (experience.technologies ?? []).map(technologyNameKey),
    ),
    ...inventory.flatMap(({ text }) => evidenceKeys(text)),
  ]);
  const sourceRoles = source.experiences.map((experience) => experience.role);
  const summaryTools = new Set([
    ...sourceTools,
    ...(context.confirmedTechnologies ?? []).map(technologyNameKey),
  ]);
  const titleTools = new Set(
    source.experiences.flatMap((experience) => [
      ...(experience.technologies ?? []).map(technologyNameKey),
      ...[experience.role, ...experience.responsibilities].flatMap(
        evidenceKeys,
      ),
    ]),
  );
  for (const field of result.fields) {
    if (field.id === "header.fullName") {
      issues.push(
        "header.fullName: immutable CMS identity; remove this entry from fields. The application copies the name automatically. Use only IDs from the prompt's field inventory.",
      );
      continue;
    }
    const original = allowed.get(field.id);
    // Previously copied manual prompts may still return a saved field.
    if (original && saved?.savedFields[field.id]) continue;
    if (!original || supplied.has(field.id)) {
      issues.push(`${field.id}: unknown, unselected or duplicate field`);
      continue;
    }
    const submittedText = field.text.trim();
    const mentions = matchTechnologies(submittedText);
    const tailorTechnologyNames =
      field.id === "header.degree" ||
      field.id === "header.summary" ||
      /^experience\.[^.]+\.(?:role$|context$|bullet\.)/u.test(field.id);
    const text = tailorTechnologyNames
      ? applyVacancyTechnologyNames(
          submittedText,
          mentions,
          names.displayNameBySpelling,
        )
      : submittedText;
    supplied.set(field.id, text);
    if (!text || text.length > original.budget)
      reportFieldIssue(
        original,
        text,
        "length",
        `required text, maximum ${original.budget} characters (received ${text?.length ?? 0})`,
        { limit: original.budget },
      );
    if (!text) continue;
    const isProfessionalTitle = field.id === "header.degree";
    const language = contentLanguage(text, isProfessionalTitle ? 1 : 2);
    if (
      FOREIGN_PHRASES[result.locale].test(text) ||
      (language && language !== result.locale)
    )
      reportFieldIssue(
        original,
        text,
        "translation",
        `untranslated content for ${result.locale}`,
        { locale: result.locale },
      );
    const sourceNumbers = numericResumeFacts(original.text);
    const numbers = numericResumeFacts(text);
    if (
      isProfessionalTitle
        ? numbers.some((number) => !sourceNumbers.includes(number))
        : numbers.join("|") !== sourceNumbers.join("|")
    )
      reportFieldIssue(
        original,
        text,
        "numericFacts",
        "changed numeric facts (including explicit CEFR codes)",
        {
          numericFacts: { original: sourceNumbers, proposed: numbers },
        },
      );
    if (isProfessionalTitle) {
      if (RESUME_TITLE_SEPARATOR.test(text))
        reportFieldIssue(
          original,
          text,
          "multipleTitles",
          "use one professional title without a second role or degree",
        );
      if (addsRoleLevel(text, sourceRoles))
        reportFieldIssue(
          original,
          text,
          "seniority",
          "seniority or leadership level is unsupported by the selected roles",
        );
    }
    if (
      field.id.startsWith("language.") &&
      field.id.endsWith(".level") &&
      changesProficiency(original.text, text)
    )
      reportFieldIssue(
        original,
        text,
        "proficiency",
        "changed proficiency level",
      );
    if (
      field.id.startsWith("language.") &&
      field.id.endsWith(".name") &&
      changesLanguageName(original.text, text)
    )
      reportFieldIssue(
        original,
        text,
        "languageIdentity",
        "changed language identity",
      );
    const supportedTools = isProfessionalTitle
      ? titleTools
      : field.id === "header.summary"
        ? summaryTools
        : sourceTools;
    const verifiedMentions = [...mentions];
    if (field.id === "header.summary" || field.id.includes(".bullet.")) {
      for (const name of rewrittenTechnologyNames(
        original.text,
        submittedText,
        evidenceTechnologies,
      )) {
        const key = technologyNameKey(name);
        if (!verifiedMentions.some((mention) => mention.key === key))
          verifiedMentions.push({
            name,
            key,
            index: submittedText.indexOf(name),
          });
      }
    }
    const unexpected = verifiedMentions.flatMap(({ key, name }) =>
      supportedTools.has(names.catalogNameByVacancyName.get(key) ?? key)
        ? []
        : [name],
    );
    if (unexpected.length)
      reportFieldIssue(
        original,
        text,
        "technologies",
        `unsupported technologies: ${unexpected.join(", ")}${isProfessionalTitle ? ". Use technologies linked to or demonstrated by a selected experience." : ""}`,
        { tokens: unexpected },
      );
    if (addsCredential(original.text, text))
      reportFieldIssue(original, text, "credential", "unsupported credential");
    if (field.id.startsWith("certification.")) {
      const tokens = [
        ...extractJobTools(original.text, profileNames),
        ...(original.text.match(
          /\b[a-z]{2,}-\d+(?:-\d+)*\b|\b[a-z]\d+[a-z]\b/giu,
        ) ?? []),
      ];
      const changed = tokens.filter(
        (token) => !text.toLowerCase().includes(token.toLowerCase()),
      );
      if (changed.length)
        reportFieldIssue(
          original,
          text,
          "credentialTokens",
          `preserve credential codes and technology names: ${changed.join(", ")}`,
          { tokens: changed },
        );
    }
  }
  for (const field of inventory)
    if (!supplied.has(field.id))
      reportFieldIssue(field, "", "missing", "missing translation");
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
      technologies: exp.technologies?.map(
        (name) =>
          names.displayNameBySpelling.get(technologyNameKey(name)) ?? name,
      ),
      role: supplied.get(`experience.${exp.id}.role`) ?? "",
      location: supplied.get(`experience.${exp.id}.location`),
      companyBlurb: supplied.get(`experience.${exp.id}.context`),
      responsibilities: bullets.map((b) => b.text),
      responsibilityIds: bullets.map((b) => b.id),
      atsResponsibilities: [],
    };
  });
  if (issues.length) throw new ResumeTailorValidationError(issues, fieldIssues);
  const skills = source.skills.map((skill) => ({
    ...skill,
    items: skill.items.map(
      (name, index) => names.byId.get(skill.skillIds?.[index] ?? "") ?? name,
    ),
  }));
  const confirmed = context.confirmedTechnologies ?? [];
  if (confirmed.length) {
    const other = skills.find((group) => group.category === "OTHER");
    const items = [...(other?.items ?? []), ...confirmed];
    const skillIds = [
      ...(other?.skillIds ?? []),
      ...confirmed.map((name) => `vacancy:${technologyNameKey(name)}`),
    ];
    if (other) Object.assign(other, { items, skillIds });
    else
      skills.push({ id: "vacancy-skills", category: "OTHER", items, skillIds });
  }
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
    skills,
    softSkills: saved?.softSkills.length ? saved.softSkills : undefined,
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
  if (experiences.length > template.maxExperiences)
    throw new Error(
      "experiences: template capacity exceeded; choose a larger design",
    );
  paginateResumeExperiences(document, template).forEach(
    (pageExperiences, page) => {
      const textLength =
        pageExperiences.reduce(
          (sum, experience) => sum + experienceTextLength(experience) + 1,
          0,
        ) + (page === 0 ? (document.header.summary?.length ?? 0) : 0);
      if (textLength > template.maxPageCharacters[page])
        issues.push(
          "experiences.page." +
            (page + 1) +
            ": shorten content to " +
            template.maxPageCharacters[page] +
            " characters",
        );
    },
  );
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
  const document = ResumeSnapshotSchema.safeParse(snapshot);
  if (document.success) return documentToDraft(document.data);
  const historical = CvImportDraftSchema.safeParse(snapshot);
  return historical.success ? historical.data : null;
}
