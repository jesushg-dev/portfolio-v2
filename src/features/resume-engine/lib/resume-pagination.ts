import type {
  CvImportDraft,
  CvImportExperienceDraft,
} from "@/features/cv/lib/cv-import-draft";
import type { ResumeTemplate } from "./template-registry";

export function experienceTextLength(experience: CvImportExperienceDraft) {
  return [
    experience.company,
    experience.role,
    experience.companyBlurb,
    experience.location,
    experience.startDate,
    experience.endDate,
    ...experience.responsibilities,
  ]
    .filter(Boolean)
    .join("\n").length;
}

function lines(text: string, width: number) {
  return text
    .split("\n")
    .reduce(
      (sum, part) => sum + Math.max(1, Math.ceil(part.length / width)),
      0,
    );
}

/** Estimate wrapping conservatively; Word remains the final layout authority. */
export function paginateResumeExperiences(
  document: Pick<CvImportDraft, "header" | "experiences">,
  template: ResumeTemplate,
) {
  const pages = template.experiencePageLayout.map(
    () => [] as CvImportExperienceDraft[],
  );
  let page = 0;
  let characters = document.header.summary?.length ?? 0;
  let usedLines =
    2 +
    lines(
      document.header.summary ?? "",
      template.experiencePageLayout[0].charactersPerLine,
    );
  for (const experience of document.experiences) {
    const measure = (index: number) => {
      const width = template.experiencePageLayout[index].charactersPerLine;
      const newCompany = pages[index].at(-1)?.company !== experience.company;
      return (
        (newCompany ? 2 + lines(experience.companyBlurb ?? "", width) : 1) +
        lines(experience.role, Math.floor(width * 0.65)) +
        lines(experience.location ?? "", width) +
        experience.responsibilities.reduce(
          (sum, bullet) => sum + lines(bullet, width - 4) + 0.2,
          0,
        )
      );
    };
    const size = experienceTextLength(experience) + 1;
    let height = measure(page);
    if (
      pages[page].length &&
      page < pages.length - 1 &&
      (characters + size > template.maxPageCharacters[page] ||
        usedLines + height > template.experiencePageLayout[page].maxLines)
    ) {
      page++;
      characters = 0;
      usedLines = 0;
      height = measure(page);
    }
    pages[page].push(experience);
    characters += size;
    usedLines += height;
  }
  return pages;
}
