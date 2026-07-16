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
