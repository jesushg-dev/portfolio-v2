export interface CvRun {
  id: string;
  text: string;
}

export interface CvParagraph {
  id: string;
  runs: CvRun[];
  style: string;
  xmlIndex: number;
}

/** Paragraphs skipped by the AI tailor but still written on rebuild (dates, company lines). */
export type LockedParagraphKind =
  "experience-meta" | "experience-role" | "education-dates";

export interface LockedParagraph {
  kind: LockedParagraphKind;
  paragraph: CvParagraph;
}

export interface CvSection {
  id: string;
  heading: string;
  paragraphs: CvParagraph[];
}

export interface AdaptedRun {
  id: string;
  text: string;
}

export interface AdaptedParagraph {
  id: string;
  runs: AdaptedRun[];
}

export interface AdaptedSection {
  id: string;
  paragraphs: AdaptedParagraph[];
}
