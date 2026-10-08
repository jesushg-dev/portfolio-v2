export type CaseStudyFact = readonly [label: string, value: string];

export interface CaseStudyCard {
  icon: string;
  label: string;
  text: string;
}

export interface CaseStudyDecision {
  title: string;
  summary: string;
  why: string;
  alternatives: string[];
  trade: string;
}

export interface CaseStudyArchitectureLayer {
  name: string;
  items: string[];
  via?: string;
}

export interface CaseStudyCodePoint {
  title: string;
  text: string;
}

export interface CaseStudyMetric {
  value: string;
  label: string;
}

export interface CaseStudySection {
  id: string;
  eyebrow: string;
  title: string;
  type:
    | "cards"
    | "text"
    | "accordion"
    | "architecture"
    | "code"
    | "security"
    | "steps"
    | "design"
    | "metrics";
  text?: string;
  cards?: CaseStudyCard[];
  decisions?: CaseStudyDecision[];
  layers?: CaseStudyArchitectureLayer[];
  note?: string;
  code?: string;
  points?: CaseStudyCodePoint[];
  stats?: [value: string, label: string][];
  rows?: [term: string, detail: string][];
  residual?: string[];
  steps?: { title: string; text: string }[];
  colors?: { name: string; hex: string }[];
  principles?: string[];
  themes?: [name: string, value: string][];
  metrics?: CaseStudyMetric[];
  scope?: [value: string, label: string][];
  constraints?: string[];
}

export interface CaseStudyProject {
  slug: string | null;
  image: string;
  title: string;
  description: string;
  hook: string | null;
  challenge: string | null;
  approach: string | null;
  outcome: string | null;
  githubUrl: string | null;
  websiteUrl: string | null;
  isPrivate: boolean;
  type: string;
  kind: string;
  skills: { title: string; image: string }[];
}

export interface CaseStudyNextProject {
  slug: string;
  title: string;
}
