import type { Locale } from "@/i18n/config";
import type { CvImportDraft } from "@/features/cv/lib/cv-import-draft";
import type {
  AdaptedParagraph,
  AdaptedSection,
  CvParagraph,
  CvSection,
  LockedParagraph,
} from "@/lib/types";
import { formatExperienceDates } from "@/utils/tools/date";

export const LOCKED_META_SECTION_ID = "__locked_meta__";

function parseYearMonth(value?: string): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})(?:-\d{2})?$/.exec(value.trim());
  if (!match) return null;
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1));
}

function formatEducationDates(
  startYear?: number,
  endYear?: number,
  dates?: string,
): string | null {
  if (startYear && endYear) return `${startYear}-${endYear}`;
  if (endYear) return String(endYear);
  if (startYear) return String(startYear);
  const trimmed = dates?.trim();
  if (!trimmed) return null;
  // Normalize en/em dashes to a compact template style: 2017-2024
  return trimmed.replace(/\s*[–—-]\s*/g, "-");
}

function adaptParagraphText(
  paragraph: CvParagraph,
  newText: string,
): AdaptedParagraph {
  return {
    id: paragraph.id,
    runs: paragraph.runs.map((run, index) => ({
      id: run.id,
      text: index === 0 ? newText : "",
    })),
  };
}

function buildExperienceMetaLine(
  company: string,
  location: string | undefined,
  dateLine: string,
  previousText: string,
): string {
  const parts = previousText
    .split("·")
    .map((part) => part.trim())
    .filter(Boolean);

  // Preserve client annotations in company when draft company is a short match,
  // e.g. template "Imagemaker (Client: Walmart…)" + draft "Imagemaker".
  let companyOut = company.trim();
  const previousCompany = parts[0] ?? "";
  if (
    previousCompany &&
    previousCompany.toLowerCase().startsWith(companyOut.toLowerCase()) &&
    previousCompany.length > companyOut.length
  ) {
    companyOut = previousCompany;
  }

  const locationOut = ((location?.trim() ?? parts[1]) || "").trim();
  if (locationOut) {
    return `${companyOut} · ${locationOut} · ${dateLine}`;
  }
  return `${companyOut} · ${dateLine}`;
}

function buildExperienceRoleLine(
  draftRole: string,
  previousText: string,
): string {
  const role = draftRole.trim();
  if (!role) return previousText;
  const pipeIndex = previousText.indexOf("|");
  if (pipeIndex === -1) return role;
  const prefix = previousText.slice(0, pipeIndex).trim();
  return prefix ? `${prefix} | ${role}` : role;
}

/**
 * Build adapted locked paragraphs (dates / company / role) from the CMS draft.
 * Order matches template locked lines in document order.
 */
export function syncLockedParagraphsFromDraft(
  lockedParagraphs: LockedParagraph[],
  draft: CvImportDraft,
  locale: Locale,
): AdaptedParagraph[] {
  let experienceIndex = 0;
  let educationIndex = 0;
  const adapted: AdaptedParagraph[] = [];

  for (const locked of lockedParagraphs) {
    const previousText = locked.paragraph.runs.map((run) => run.text).join("");

    if (locked.kind === "experience-meta") {
      const experience = draft.experiences[experienceIndex];
      experienceIndex += 1;
      if (!experience) continue;

      const dateLine = formatExperienceDates(
        parseYearMonth(experience.startDate),
        parseYearMonth(experience.endDate),
        Boolean(experience.current),
        locale,
      );
      if (!dateLine) continue;

      adapted.push(
        adaptParagraphText(
          locked.paragraph,
          buildExperienceMetaLine(
            experience.company,
            experience.location,
            dateLine,
            previousText,
          ),
        ),
      );
      continue;
    }

    if (locked.kind === "experience-role") {
      const experience = draft.experiences[experienceIndex];
      // Role line appears immediately before its meta line; same experience index.
      if (!experience?.role) continue;
      adapted.push(
        adaptParagraphText(
          locked.paragraph,
          buildExperienceRoleLine(experience.role, previousText),
        ),
      );
      continue;
    }

    if (locked.kind === "education-dates") {
      const education = draft.education[educationIndex];
      educationIndex += 1;
      if (!education) continue;
      const dates = formatEducationDates(
        education.startYear,
        education.endYear,
        education.dates,
      );
      if (!dates) continue;
      adapted.push(adaptParagraphText(locked.paragraph, dates));
    }
  }

  return adapted;
}

/** Merge locked paragraphs into the section list used by rebuildDocx. */
export function withLockedMetaSection(
  sections: CvSection[],
  lockedParagraphs: LockedParagraph[],
): CvSection[] {
  if (lockedParagraphs.length === 0) return sections;
  return [
    ...sections,
    {
      id: LOCKED_META_SECTION_ID,
      heading: LOCKED_META_SECTION_ID,
      paragraphs: lockedParagraphs.map((item) => item.paragraph),
    },
  ];
}

/** Merge synced locked adaptations into the AI adapted sections. */
export function withLockedMetaAdaptations(
  adaptedSections: AdaptedSection[],
  lockedAdaptedParagraphs: AdaptedParagraph[],
): AdaptedSection[] {
  if (lockedAdaptedParagraphs.length === 0) return adaptedSections;
  return [
    ...adaptedSections,
    {
      id: LOCKED_META_SECTION_ID,
      paragraphs: lockedAdaptedParagraphs,
    },
  ];
}
