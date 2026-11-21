import type { CvImportDraft } from "@/features/cv/lib/cv-import-draft";
import {
  createTechnologyMatcher,
  extractJobTools,
  knownTechnologySpellings,
  technologyNameKey,
} from "./extract-job-tools";
import { numericResumeFacts } from "./resume-content-validation";
import {
  type ResumeTailorFieldIssue,
  ResumeTailorValidationError,
} from "./resume-tailor-validation-error";

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

function listedResumeTechnologies(source: CvImportDraft): string[] {
  return [
    ...source.skills.flatMap(({ items }) => items),
    ...source.experiences.flatMap(({ technologies }) => technologies ?? []),
  ];
}

export function declaredResumeTechnologies(source: CvImportDraft): string[] {
  const listed = listedResumeTechnologies(source);
  const evidence = [
    source.header.degree,
    source.header.summary,
    ...source.experiences.flatMap((exp) => [
      exp.role,
      ...exp.responsibilities,
      ...exp.atsResponsibilities,
    ]),
  ];
  return [
    ...new Set([
      ...listed,
      ...extractJobTools(evidence.filter(Boolean).join("\n"), listed),
    ]),
  ];
}

export function validateResumeTechnologyNames(
  profile: CvImportDraft,
  selected: CvImportDraft,
  names: ResumeTechnologyName[],
  jobDescription: string,
  confirmedTechnologies: string[] = [],
  vacancyTools: string[] = [],
) {
  const catalog = resumeTechnologyCatalog(profile);
  const selectedCatalog = resumeTechnologyCatalog(selected);
  const candidates = [
    ...vacancyTools,
    ...names.map(({ name }) => name),
    ...confirmedTechnologies,
  ];
  const spellings = knownTechnologySpellings(
    listedResumeTechnologies(profile),
    candidates,
  );
  const mentions = createTechnologyMatcher([
    ...spellings.keys(),
    ...candidates,
  ])(jobDescription);
  const counts = new Map<string, number>();
  const catalogNameByVacancyName = new Map<string, string>();
  for (const { name, key } of mentions) {
    counts.set(name, (counts.get(name) ?? 0) + 1);
    const owner = spellings.get(key);
    if (owner) catalogNameByVacancyName.set(key, owner);
  }
  const proposedIds = new Set<string>();
  const confirmedNames = new Set(confirmedTechnologies.map(technologyNameKey));
  for (const [index, { skillId, name }] of names.entries()) {
    const original = selectedCatalog.get(skillId);
    const invalidName = (
      reason: ResumeTailorFieldIssue["reason"],
      detail: string,
    ) => {
      const savedName = original ?? catalog.get(skillId);
      const proposal = savedName ? `“${savedName}” → “${name}”` : `“${name}”`;
      return new ResumeTailorValidationError(
        [`Technology name ${proposal}: ${detail}.`],
        [
          {
            fieldId: `technologyNames[${index}]`,
            field: "technologyName",
            original: savedName ?? "",
            proposed: name,
            reason,
          },
        ],
      );
    };
    const key = technologyNameKey(name);
    if (!original)
      throw invalidName(
        "technologyNotSelected",
        "skill ID must belong to the selected CV evidence",
      );
    if (proposedIds.has(skillId))
      throw invalidName(
        "duplicateTechnologyName",
        "duplicate display name proposal",
      );
    if (!counts.has(name))
      throw invalidName(
        "technologyVacancySpelling",
        "copy the complete display name verbatim from the vacancy",
      );

    const originalKey = technologyNameKey(original);
    const owner = catalogNameByVacancyName.get(key);
    if (
      numericResumeFacts(original).join("|") !==
      numericResumeFacts(name).join("|")
    )
      throw invalidName(
        "technologyVersion",
        "preserve technology versions from CMS",
      );
    // Punctuation, a JS suffix or an acronym can vary without changing
    // identity. An extra word can identify a different product.
    const compact = (value: string) =>
      technologyNameKey(value).replace(/[\s.-]/gu, "");
    const initials = original
      .match(/[\p{L}\d]+/gu)
      ?.map((word) => word[0])
      .join("")
      .toLowerCase();
    const originalSpelling = compact(original);
    const proposedSpelling = compact(name);
    const sameSpelling =
      owner === originalKey ||
      originalSpelling === proposedSpelling ||
      originalSpelling + "js" === proposedSpelling ||
      proposedSpelling + "js" === originalSpelling ||
      (original.includes(" ") && proposedSpelling === initials);
    if (
      originalKey !== key &&
      (confirmedNames.has(key) ||
        (owner !== undefined && owner !== originalKey) ||
        !sameSpelling)
    )
      throw invalidName(
        "technologyIdentity",
        "display name belongs to a different technology",
      );

    proposedIds.add(skillId);
    catalogNameByVacancyName.set(key, originalKey);
  }
  // Counts retain the posting's order, so equally common spellings use the first mention.
  const preferred = new Map<string, string>();
  for (const [name, count] of counts) {
    const owner = catalogNameByVacancyName.get(technologyNameKey(name));
    if (!owner) continue;
    const current = preferred.get(owner);
    if (!current || count > counts.get(current)!) preferred.set(owner, name);
  }
  const displayNameBySpelling = new Map<string, string>();
  for (const title of listedResumeTechnologies(selected)) {
    const key = technologyNameKey(title);
    const name = preferred.get(key);
    if (name) displayNameBySpelling.set(key, name);
  }
  const byId = new Map<string, string>();
  for (const [id, title] of selectedCatalog) {
    const name = displayNameBySpelling.get(technologyNameKey(title));
    if (name) byId.set(id, name);
  }
  for (const [key, owner] of catalogNameByVacancyName) {
    const name = displayNameBySpelling.get(owner);
    if (name) displayNameBySpelling.set(key, name);
  }
  return { byId, catalogNameByVacancyName, displayNameBySpelling };
}
