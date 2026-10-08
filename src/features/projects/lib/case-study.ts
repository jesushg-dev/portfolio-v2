import { Prisma } from "@prisma/client";
import { z } from "zod";

import type { LanguageRef } from "@/lib/i18n/editor-rows";

export const CASE_STUDY_SECTION_KINDS = [
  "CARDS",
  "DECISIONS",
  "LAYERS",
  "TABLE",
  "STEPS",
  "METRICS",
  "CODE",
  "SWATCHES",
] as const;

export type CaseStudySectionKind = (typeof CASE_STUDY_SECTION_KINDS)[number];

export const CASE_STUDY_ICONS = [
  "bolt",
  "case",
  "code",
  "db",
  "gauge",
  "globe",
  "layers",
  "layout",
  "mail",
  "music",
  "pal",
  "search",
  "shield",
  "term",
  "user",
  "users",
] as const;

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const text = z.string().trim().default("");
const textList = z.array(z.string().trim().min(1)).default([]);

export const CaseStudyItemSchema = z.object({
  key: z.string().trim().min(1).regex(KEBAB, "Use kebab-case"),
  title: text,
  summary: text,
  body: text,
  value: text,
  icon: z.union([z.enum(CASE_STUDY_ICONS), z.literal("")]).default(""),
  tags: textList,
  note: text,
});

export const CaseStudySectionSchema = z.object({
  key: z.string().trim().min(1).regex(KEBAB, "Use kebab-case"),
  kind: z.enum(CASE_STUDY_SECTION_KINDS),
  eyebrow: text,
  title: z.string().trim().min(1),
  lead: text,
  code: z.string().default(""),
  codeLabel: text,
  items: z.array(CaseStudyItemSchema).default([]),
  footnoteTitle: text,
  footnotes: textList,
  footnoteVariant: z.enum(["warning", "default"]).default("default"),
});

export const CaseStudyFactSchema = z.object({
  key: z.string().trim().min(1).regex(KEBAB, "Use kebab-case"),
  label: z.string().trim().min(1),
  value: z.string().trim().min(1),
});

function duplicates(keys: string[]): string[] {
  const seen = new Set<string>();
  const duplicate = new Set<string>();

  for (const key of keys) {
    if (seen.has(key)) duplicate.add(key);
    else seen.add(key);
  }

  return [...duplicate];
}

export const CaseStudyContentSchema = z
  .object({
    chips: textList,
    facts: z.array(CaseStudyFactSchema).default([]),
    nextProjectSlug: z.string().trim().default(""),
    context: text,
    roleTitle: text,
    roleIntro: text,
    tldr: z.array(CaseStudyItemSchema).default([]),
    responsibilities: z.array(CaseStudyItemSchema).default([]),
    constraints: textList,
    sections: z.array(CaseStudySectionSchema).default([]),
  })
  .superRefine((content, ctx) => {
    const check = (keys: string[], path: (string | number)[]) => {
      for (const key of duplicates(keys)) {
        ctx.addIssue({
          code: "custom",
          message: `Duplicate key "${key}"`,
          path,
        });
      }
    };

    check(
      content.tldr.map((item) => item.key),
      ["tldr"],
    );
    check(
      content.responsibilities.map((item) => item.key),
      ["responsibilities"],
    );
    check(
      content.sections.map((section) => section.key),
      ["sections"],
    );
    check(
      content.facts.map((fact) => fact.key),
      ["facts"],
    );
    content.sections.forEach((section, index) => {
      check(
        section.items.map((item) => item.key),
        ["sections", index, "items"],
      );
    });
  });

export type CaseStudyItemDTO = z.output<typeof CaseStudyItemSchema>;
export type CaseStudySectionDTO = z.output<typeof CaseStudySectionSchema>;
export type CaseStudyFactDTO = z.output<typeof CaseStudyFactSchema>;
export type CaseStudyContentDTO = z.output<typeof CaseStudyContentSchema>;

export type CaseStudyMap = Record<string, CaseStudyContentDTO>;
export const CaseStudyMapSchema = z.record(z.string(), CaseStudyContentSchema);

export interface CaseStudyItemRow {
  key: string;
  title?: string | null;
  summary?: string | null;
  body?: string | null;
  value?: string | null;
  icon?: string | null;
  tags?: string[] | null;
  note?: string | null;
}

export interface CaseStudySectionRow {
  key: string;
  kind: string;
  eyebrow?: string | null;
  title: string;
  lead?: string | null;
  code?: string | null;
  codeLabel?: string | null;
  items?: CaseStudyItemRow[] | null;
  footnoteTitle?: string | null;
  footnotes?: string[] | null;
  footnoteVariant?: string | null;
}

export interface CaseStudyContentRow {
  chips?: string[] | null;
  facts?: CaseStudyFactDTO[] | null;
  stack?: string[] | null;
  nextProjectSlug?: string | null;
  context?: string | null;
  roleTitle?: string | null;
  roleIntro?: string | null;
  tldr?: CaseStudyItemRow[] | null;
  responsibilities?: CaseStudyItemRow[] | null;
  constraints?: string[] | null;
  sections?: CaseStudySectionRow[] | null;
}

export function buildEmptyCaseStudy(): CaseStudyContentDTO {
  return {
    chips: [],
    facts: [],
    nextProjectSlug: "",
    context: "",
    roleTitle: "",
    roleIntro: "",
    tldr: [],
    responsibilities: [],
    constraints: [],
    sections: [],
  };
}

const itemRowToDto = (row: CaseStudyItemRow): CaseStudyItemDTO => ({
  key: row.key,
  title: row.title ?? "",
  summary: row.summary ?? "",
  body: row.body ?? "",
  value: row.value ?? "",
  icon: (row.icon ?? "") as CaseStudyItemDTO["icon"],
  tags: row.tags ?? [],
  note: row.note ?? "",
});

export function caseStudyRowToDto(
  row: CaseStudyContentRow | null | undefined,
): CaseStudyContentDTO {
  if (!row) return buildEmptyCaseStudy();

  return {
    chips: row.chips ?? [],
    facts: row.facts ?? [],
    nextProjectSlug: row.nextProjectSlug ?? "",
    context: row.context ?? "",
    roleTitle: row.roleTitle ?? "",
    roleIntro: row.roleIntro ?? "",
    tldr: (row.tldr ?? []).map(itemRowToDto),
    responsibilities: (row.responsibilities ?? []).map(itemRowToDto),
    constraints: row.constraints ?? [],
    sections: (row.sections ?? []).map((section) => {
      const kind = section.kind as CaseStudySectionKind;
      return {
        key: section.key,
        kind: CASE_STUDY_SECTION_KINDS.includes(kind) ? kind : "CARDS",
        eyebrow: section.eyebrow ?? "",
        title: section.title,
        lead: section.lead ?? "",
        code: section.code ?? "",
        codeLabel: section.codeLabel ?? "",
        items: (section.items ?? []).map(itemRowToDto),
        footnoteTitle: section.footnoteTitle ?? "",
        footnotes: section.footnotes ?? [],
        footnoteVariant:
          section.footnoteVariant === "warning" ? "warning" : "default",
      };
    }),
  };
}

export function caseStudyDtoToWrite(
  dto: CaseStudyContentDTO | undefined | null,
): Prisma.CaseStudyContentCreateInput | null {
  if (!dto || isCaseStudyEmpty(dto)) return null;

  const itemToWrite = (
    item: CaseStudyItemDTO,
  ): Prisma.CaseStudyItemCreateInput => ({
    key: item.key,
    title: item.title,
    summary: item.summary || null,
    body: item.body || null,
    value: item.value || null,
    icon: item.icon || null,
    tags: item.tags,
    note: item.note || null,
  });

  const sectionToWrite = (
    section: CaseStudySectionDTO,
  ): Prisma.CaseStudySectionCreateInput => ({
    key: section.key,
    kind: section.kind,
    eyebrow: section.eyebrow || null,
    title: section.title,
    lead: section.lead || null,
    code: section.code || null,
    codeLabel: section.codeLabel || null,
    items: section.items.map(itemToWrite),
    footnoteTitle: section.footnoteTitle || null,
    footnotes: section.footnotes,
    footnoteVariant: section.footnoteVariant === "warning" ? "warning" : null,
  });

  return {
    chips: dto.chips,
    facts: dto.facts,
    nextProjectSlug: dto.nextProjectSlug || null,
    context: dto.context || null,
    roleTitle: dto.roleTitle || null,
    roleIntro: dto.roleIntro || null,
    tldr: dto.tldr.map(itemToWrite),
    responsibilities: dto.responsibilities.map(itemToWrite),
    constraints: dto.constraints,
    sections: dto.sections.map(sectionToWrite),
  };
}

export function isCaseStudyEmpty(dto: CaseStudyContentDTO): boolean {
  return (
    dto.chips.length === 0 &&
    dto.facts.length === 0 &&
    dto.nextProjectSlug === "" &&
    dto.context === "" &&
    dto.roleTitle === "" &&
    dto.roleIntro === "" &&
    dto.tldr.length === 0 &&
    dto.responsibilities.length === 0 &&
    dto.constraints.length === 0 &&
    dto.sections.length === 0
  );
}

export function mergeCaseStudyMap(
  languages: LanguageRef[],
  rows: { appLanguageId: string; caseStudy?: CaseStudyContentRow | null }[],
): Record<string, CaseStudyContentDTO> {
  return Object.fromEntries(
    languages.map(({ id, code }) => {
      const row = rows.find((entry) => entry.appLanguageId === id);
      return [code, caseStudyRowToDto(row?.caseStudy ?? null)];
    }),
  );
}

export function auditCaseStudyParity(
  map: Record<string, CaseStudyContentDTO>,
  referenceLocale: string,
): { locale: string; path: string; problem: string }[] {
  const reference = map[referenceLocale];
  if (!reference) return [];

  const issues: { locale: string; path: string; problem: string }[] = [];

  for (const [locale, content] of Object.entries(map)) {
    if (locale === referenceLocale) continue;

    if (isCaseStudyEmpty(content)) {
      issues.push({ locale, path: "caseStudy", problem: "missing" });
      continue;
    }

    const referenceSections = new Map(
      reference.sections.map((section) => [section.key, section]),
    );
    const actualSections = new Map(
      content.sections.map((section) => [section.key, section]),
    );

    for (const [key, section] of referenceSections) {
      if (!actualSections.has(key)) {
        issues.push({ locale, path: `sections.${key}`, problem: "missing" });
        continue;
      }

      const actual = actualSections.get(key)!;
      if (section.kind !== actual.kind) {
        issues.push({
          locale,
          path: `sections.${key}.kind`,
          problem: "mismatch",
        });
      }

      const referenceItems = new Map(
        section.items.map((item) => [item.key, item]),
      );
      const actualItems = new Map(actual.items.map((item) => [item.key, item]));

      for (const [itemKey, referenceItem] of referenceItems) {
        const actualItem = actualItems.get(itemKey);
        if (!actualItem) {
          issues.push({
            locale,
            path: `sections.${key}.items.${itemKey}`,
            problem: "missing",
          });
          continue;
        }

        if (
          (referenceItem.title && actualItem.title === "") ||
          (referenceItem.body && actualItem.body === "")
        ) {
          issues.push({
            locale,
            path: `sections.${key}.items.${itemKey}`,
            problem: "empty",
          });
        }
      }

      for (const [itemKey] of actualItems) {
        if (!referenceItems.has(itemKey)) {
          issues.push({
            locale,
            path: `sections.${key}.items.${itemKey}`,
            problem: "extra",
          });
        }
      }
    }

    for (const [key] of actualSections) {
      if (!referenceSections.has(key)) {
        issues.push({ locale, path: `sections.${key}`, problem: "extra" });
      }
    }

    if (reference.constraints.length !== content.constraints.length) {
      issues.push({ locale, path: "constraints", problem: "missing" });
    }
  }

  return issues;
}

export function caseStudyUpdatePatch(
  map: Record<string, CaseStudyContentDTO>,
  languageId: string,
): Record<
  string,
  { set: Prisma.CaseStudyContentCreateInput } | { unset: true }
> {
  const entry = map[languageId];
  if (!entry) return {};

  if (isCaseStudyEmpty(entry)) {
    return { caseStudy: { unset: true } };
  }

  return { caseStudy: { set: caseStudyDtoToWrite(entry)! } };
}

export function caseStudyMapFromProject(
  project: {
    ProjectTranslation: {
      appLanguageId: string;
      caseStudy?: CaseStudyContentRow | null;
    }[];
  },
  languages: LanguageRef[],
): CaseStudyMap {
  return mergeCaseStudyMap(
    languages,
    project.ProjectTranslation.map((translation) => ({
      appLanguageId: translation.appLanguageId,
      caseStudy: translation.caseStudy ?? null,
    })),
  );
}
