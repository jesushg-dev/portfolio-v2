import type { CaseStudySectionDTO } from "@/features/projects/lib/case-study";

import { CaseStudyDataSection } from "./case-study-data-sections";
import { CaseStudyOverviewSection } from "./case-study-overview-sections";
import { CaseStudyPresentationSection } from "./case-study-presentation-sections";
import type { CaseStudySectionProps } from "./case-study-section-types";

export default function CaseStudySection(props: CaseStudySectionProps) {
  const sectionKind: CaseStudySectionDTO["kind"] = props.section.kind;

  switch (sectionKind) {
    case "CARDS":
    case "DECISIONS":
    case "LAYERS":
      return <CaseStudyOverviewSection {...props} />;
    case "CODE":
    case "TABLE":
    case "METRICS":
      return <CaseStudyDataSection {...props} />;
    case "STEPS":
    case "SWATCHES":
      return <CaseStudyPresentationSection {...props} />;
    default:
      return null;
  }
}
