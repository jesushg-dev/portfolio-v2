export type ResumeTailorFieldKind =
  | "title"
  | "summary"
  | "availability"
  | "role"
  | "bullet"
  | "location"
  | "companyContext"
  | "degree"
  | "dates"
  | "language"
  | "languageLevel"
  | "technologyName"
  | "certification"
  | "field";

export interface ResumeTailorFieldIssue {
  fieldId: string;
  field: ResumeTailorFieldKind;
  context?: string;
  bullet?: number;
  original: string;
  proposed: string;
  reason:
    | "length"
    | "translation"
    | "numericFacts"
    | "multipleTitles"
    | "seniority"
    | "proficiency"
    | "languageIdentity"
    | "technologies"
    | "technologyNotSelected"
    | "duplicateTechnologyName"
    | "technologyVacancySpelling"
    | "technologyVersion"
    | "technologyIdentity"
    | "credential"
    | "credentialTokens"
    | "missing";
  limit?: number;
  locale?: string;
  tokens?: string[];
  numericFacts?: { original: string[]; proposed: string[] };
}

export class ResumeTailorValidationError extends Error {
  constructor(
    issues: string[],
    readonly fieldIssues: ResumeTailorFieldIssue[],
  ) {
    super(`Resume validation failed:\n${issues.join("\n")}`);
    this.name = "ResumeTailorValidationError";
  }
}
