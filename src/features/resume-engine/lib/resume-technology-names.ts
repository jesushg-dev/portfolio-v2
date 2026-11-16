import type { CvImportDraft } from "@/features/cv/lib/cv-import-draft";
import {
  createResumeTechnologyMatcher,
  isCommonTechnology,
  technologyNameKey,
} from "./extract-job-tools";
import { numericResumeFacts } from "./resume-content-validation";

export function resumeTechnologyCatalog(draft: CvImportDraft) {
  const technologies = new Map<string, string>();
  for (const group of draft.skills) {
    group.skillIds?.forEach((id, index) =>
      technologies.set(id, group.items[index]),
    );
  }
  for (const experience of draft.experiences) {
    experience.technologyIds?.forEach((id, index) => {
      const name = experience.technologies?.[index];
      if (name) technologies.set(id, name);
    });
  }
  return technologies;
}

export interface ResumeTechnologyName {
  skillId: string;
  name: string;
}

export function validateResumeTechnologyNames(
  profile: CvImportDraft,
  selected: CvImportDraft,
  names: ResumeTechnologyName[],
  jobDescription: string,
) {
  const catalog = resumeTechnologyCatalog(profile);
  const selectedCatalog = resumeTechnologyCatalog(selected);
  const vacancyNames = new Set(
    createResumeTechnologyMatcher([
      ...catalog.values(),
      ...names.map(({ name }) => name),
    ])(jobDescription).map(({ name }) => name),
  );
  const byId = new Map<string, string>();
  const catalogNameByVacancyName = new Map<string, string>();
  const displayNameBySpelling = new Map<string, string>();
  for (const { skillId, name } of names) {
    const original = selectedCatalog.get(skillId);
    const label = "technologyNames." + skillId;
    const key = technologyNameKey(name);
    if (!original)
      throw new Error(
        label + ": skill ID must belong to the selected CV evidence",
      );
    if (byId.has(skillId))
      throw new Error(label + ": duplicate display name proposal");
    if (!vacancyNames.has(name))
      throw new Error(
        label + ": copy the complete display name verbatim from the vacancy",
      );

    const originalKey = technologyNameKey(original);
    const existingOwner = [...catalog].some(
      ([id, title]) => id !== skillId && technologyNameKey(title) === key,
    );
    const proposedOwner = catalogNameByVacancyName.get(key);
    if (
      originalKey !== key &&
      (existingOwner ||
        (proposedOwner !== undefined && proposedOwner !== originalKey) ||
        (isCommonTechnology(original) && isCommonTechnology(name)))
    )
      throw new Error(
        label + ": display name belongs to a different technology",
      );
    if (
      numericResumeFacts(original).join("|") !==
      numericResumeFacts(name).join("|")
    )
      throw new Error(label + ": preserve technology versions from CMS");

    byId.set(skillId, name);
    catalogNameByVacancyName.set(key, originalKey);
    displayNameBySpelling.set(originalKey, name);
    displayNameBySpelling.set(key, name);
  }
  return { byId, catalogNameByVacancyName, displayNameBySpelling };
}
