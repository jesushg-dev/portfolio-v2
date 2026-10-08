import type {
  CaseStudyContentDTO,
  CaseStudySectionDTO,
} from "@/features/projects/lib/case-study";

export interface ProjectCaseStudyViewProps {
  project: {
    slug: string | null;
    image: string;
    title: string;
    description: string;
    hook: string | null;
    challenge: string | null;
    outcome: string | null;
    githubUrl: string | null;
    websiteUrl: string | null;
    isPrivate: boolean;
    type: string;
    kind: string;
    status: string | null;
    startedAt: Date | string | null;
    endedAt: Date | string | null;
    caseStudy: CaseStudyContentDTO;
    skills: { title: string; image: string }[];
  };
  nextProject?: {
    slug: string;
    title: string;
    image: string;
    summary: string;
  } | null;
}

export type CaseStudyPageSection =
  | {
      key: string;
      eyebrow: string;
      title: string;
      navTitle: string;
      kind: "SUMMARY" | "CONTEXT" | "ROLE" | "CHALLENGE";
    }
  | {
      key: string;
      eyebrow: string;
      title: string;
      navTitle: string;
      kind: "CONTENT";
      section: CaseStudySectionDTO;
      relatedSection?: CaseStudySectionDTO;
      introText?: string;
    };
