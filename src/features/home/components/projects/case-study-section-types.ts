import type { CaseStudySectionDTO } from "@/features/projects/lib/case-study";

export interface CaseStudySectionProps {
  section: CaseStudySectionDTO;
  index: number;
  relatedSection?: CaseStudySectionDTO;
  introText?: string | null;
}
