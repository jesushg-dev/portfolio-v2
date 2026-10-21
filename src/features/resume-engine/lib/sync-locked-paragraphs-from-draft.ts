import type { Locale } from "@/i18n/config";
import type { CvImportDraft } from "@/features/cv/lib/cv-import-draft";
import {
  parseExperienceDate,
  unifyConsecutiveExperiencesByCompany,
} from "@/lib/cv/group-consecutive-experiences-by-company";
import type {
  AdaptedParagraph,
  AdaptedSection,
  CvParagraph,
  CvSection,
  LockedParagraph,
} from "@/lib/types";
import { formatExperienceDates } from "@/utils/tools/date";
import { getEmploymentTypeLabel } from "@/features/cv/lib/employment-type";
import { WORKPLACE_OR_EMPLOYMENT_RE } from "@/lib/docx/parser";

export const LOCKED_META_SECTION_ID = "__locked_meta__";

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

const WORKPLACE_MODE_TRANSLATIONS: Record<Locale, Record<string, string>> = {
  en: {
    remoto: "Remote",
    remote: "Remote",
    hibrido: "Hybrid",
    híbrido: "Hybrid",
    hybrid: "Hybrid",
    presencial: "On-site",
    "on-site": "On-site",
    onsite: "On-site",
    "tiempo completo": "Full-time",
    "full-time": "Full-time",
    fulltime: "Full-time",
    "tiempo parcial": "Part-time",
    "part-time": "Part-time",
    parttime: "Part-time",
    voltijd: "Full-time",
    deeltijd: "Part-time",
  },
  es: {
    remoto: "Remoto",
    remote: "Remoto",
    hibrido: "Híbrido",
    híbrido: "Híbrido",
    hybrid: "Híbrido",
    presencial: "Presencial",
    "on-site": "Presencial",
    onsite: "Presencial",
    "tiempo completo": "Tiempo completo",
    "full-time": "Tiempo completo",
    fulltime: "Tiempo completo",
    "tiempo parcial": "Tiempo parcial",
    "part-time": "Tiempo parcial",
    parttime: "Tiempo parcial",
    voltijd: "Tiempo completo",
    deeltijd: "Tiempo parcial",
  },
  nl: {
    remoto: "Remote",
    remote: "Remote",
    hibrido: "Hybride",
    híbrido: "Hybride",
    hybrid: "Hybride",
    presencial: "Op locatie",
    "on-site": "Op locatie",
    onsite: "Op locatie",
    "tiempo completo": "Voltijd",
    "full-time": "Voltijd",
    fulltime: "Voltijd",
    "tiempo parcial": "Deeltijd",
    "part-time": "Deeltijd",
    parttime: "Deeltijd",
    voltijd: "Voltijd",
    deeltijd: "Deeltijd",
  },
};

function translateWorkplaceModes(location: string, locale: Locale): string {
  const dict = WORKPLACE_MODE_TRANSLATIONS[locale];
  if (!dict) return location;
  return location
    .split("·")
    .map((part) => {
      const trimmed = part.trim();
      const mapped = dict[trimmed.toLowerCase()];
      return mapped ?? trimmed;
    })
    .join(" · ");
}

function buildExperienceMetaLine(
  company: string,
  location: string | undefined,
  dateLine: string,
  previousText: string,
  locale: Locale,
): string {
  const parts = previousText
    .split("·")
    .map((part) => part.trim())
    .filter(Boolean);

  // If previousText does NOT start with a company name, but starts with workplace mode / employment type
  // (e.g. v2: "Tiempo completo · Remoto · San José, Costa Rica"), do not prepend company or append date.
  const firstPartIsModeOrEmployment =
    parts.length > 0 && WORKPLACE_OR_EMPLOYMENT_RE.test(parts[0]);

  if (firstPartIsModeOrEmployment) {
    return translateWorkplaceModes(previousText, locale);
  }

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

  let locationOut = ((location?.trim() ?? parts[1]) || "").trim();
  if (locationOut) {
    locationOut = translateWorkplaceModes(locationOut, locale);
  }

  // If the location has both mode and geography, e.g. "Remote · Texas, United States",
  // and the full line would overflow ~58 chars, compact to the workplace mode ("Remote")
  // to preserve single-line layout matching the template.
  if (locationOut.includes("·")) {
    const subParts = locationOut
      .split("·")
      .map((p) => p.trim())
      .filter(Boolean);
    const mode = subParts[0];
    const fullCandidate = `${companyOut} · ${locationOut} · ${dateLine}`;
    if (fullCandidate.length > 58 && mode) {
      locationOut = mode;
    }
  }

  if (locationOut) {
    return `${companyOut} · ${locationOut} · ${dateLine}`;
  }
  return `${companyOut} · ${dateLine}`;
}

function buildExperienceRoleLine(
  draftRole: string,
  employmentType: string | undefined,
  previousText: string,
  locale: Locale,
): string {
  const role = draftRole.trim();
  if (!role) return previousText;
  const pipeIndex = previousText.indexOf("|");
  // If there is no pipe in the template paragraph, just return the role.
  if (pipeIndex === -1) return role;
  const label = getEmploymentTypeLabel(employmentType, locale);
  return `${label} | ${role}`;
}

/**
 * Build adapted locked paragraphs (dates / company / role) from the CMS draft.
 * Order matches template locked lines in document order.
 * Consecutive stints at the same company are unified, and redundant slots are emptied for pruning.
 */
export function syncLockedParagraphsFromDraft(
  lockedParagraphs: LockedParagraph[],
  draft: CvImportDraft,
  locale: Locale,
): AdaptedParagraph[] {
  const isV2Template = lockedParagraphs.some(
    (lp) =>
      lp.kind === "experience-meta" &&
      WORKPLACE_OR_EMPLOYMENT_RE.test(
        lp.paragraph.runs[0]?.text?.split("·")[0]?.trim() ?? "",
      ),
  );
  const experiences = isV2Template
    ? draft.experiences
    : unifyConsecutiveExperiencesByCompany(draft.experiences);
  let experienceIndex = 0;
  let educationIndex = 0;
  const adapted: AdaptedParagraph[] = [];

  for (const locked of lockedParagraphs) {
    const previousText = locked.paragraph.runs.map((run) => run.text).join("");

    if (locked.kind === "experience-role") {
      const experience = experiences[experienceIndex];
      // Role line appears immediately before its meta line; same experience index.
      if (!experience?.role) {
        adapted.push(adaptParagraphText(locked.paragraph, ""));
        continue;
      }
      adapted.push(
        adaptParagraphText(
          locked.paragraph,
          buildExperienceRoleLine(
            experience.role,
            experience.employmentType,
            previousText,
            locale,
          ),
        ),
      );
      continue;
    }

    if (locked.kind === "experience-meta") {
      const experience = experiences[experienceIndex];
      experienceIndex += 1;
      if (!experience) {
        adapted.push(adaptParagraphText(locked.paragraph, ""));
        continue;
      }

      const dateLine = formatExperienceDates(
        parseExperienceDate(experience.startDate),
        parseExperienceDate(experience.endDate),
        Boolean(experience.current),
        locale,
      );
      if (!dateLine) {
        adapted.push(adaptParagraphText(locked.paragraph, ""));
        continue;
      }

      adapted.push(
        adaptParagraphText(
          locked.paragraph,
          buildExperienceMetaLine(
            experience.company,
            experience.location,
            dateLine,
            previousText,
            locale,
          ),
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
