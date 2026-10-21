export interface CvRun {
  id: string;
  text: string;
  budget?: number;
  locked?: boolean;
}

export interface CvParagraph {
  id: string;
  runs: CvRun[];
  style: string;
  xmlIndex: number;
  locked?: boolean;
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
  /** Optional extra bullet texts to clone and append immediately after this paragraph */
  extraBullets?: string[];
}

export interface AdaptedSection {
  id: string;
  paragraphs: AdaptedParagraph[];
}
