import type { CaseStudyContentDTO, CaseStudyItemDTO } from "./case-study";

export function renderCaseStudySection(
  section: CaseStudyContentDTO["sections"][number],
) {
  switch (section.kind) {
    case "DECISIONS":
      return section.items.map((item) => ({
        ...item,
        summary: item.summary,
        body: item.body,
        tags: item.tags,
        note: item.note,
      }));
    case "LAYERS":
      return section.items;
    case "CODE":
      return {
        code: section.code,
        codeLabel: section.codeLabel,
        items: section.items,
      };
    case "TABLE":
      return section.items;
    case "STEPS":
      return section.items;
    case "METRICS":
      return section.items;
    case "CARDS":
      return section.items;
    case "SWATCHES":
      return section.items;
    default:
      return [] as CaseStudyItemDTO[];
  }
}
