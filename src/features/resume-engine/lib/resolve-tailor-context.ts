import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@prisma/client";
import { loadCvStructuredDraft } from "@/features/cv/lib/load-cv-structured-draft";
import type { TailorContext } from "./tailored-resume-document";
import { declaredResumeTechnologies } from "./resume-technology-names";
import {
  knownTechnologySpellings,
  literalVacancyTerm,
  technologyNameKey,
  type TechnologyEquivalence,
} from "./extract-job-tools";

function equivalencePairKey(original: string, proposed: string): string {
  return `${technologyNameKey(original)}->${technologyNameKey(proposed)}`;
}

export async function resolveTailorContext(
  db: PrismaClient,
  userId: string,
  input: Omit<TailorContext, "source" | "localizedFacts">,
): Promise<TailorContext> {
  const [draft, savedRows] = await Promise.all([
    loadCvStructuredDraft(db, userId, {
      locale: input.targetLocale,
      evidenceScope: "all",
      includeSoftSkills: input.templateId === "v1",
    }),
    db.cvTechnologyEquivalence?.findMany({
      where: { userId },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { original: true, proposed: true },
    }) ?? [],
  ]);
  if (!draft)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "Complete your CV in Resume Studio before generating a tailored resume.",
    });
  const { localizedFacts, ...source } = draft;
  const declared = declaredResumeTechnologies(source);
  const declaredByKey = new Map(
    declared.map((name) => [technologyNameKey(name), name]),
  );
  const seenRejected = new Set<string>();
  const rejectedTechnologyEquivalences: TechnologyEquivalence[] = [];
  for (const pair of input.rejectedTechnologyEquivalences ?? []) {
    const original = pair.original.trim();
    const proposed = pair.proposed.trim();
    if (!original || !proposed) continue;
    const key = equivalencePairKey(original, proposed);
    if (seenRejected.has(key)) continue;
    seenRejected.add(key);
    rejectedTechnologyEquivalences.push({ original, proposed });
  }
  const seenEquivalences = new Set<string>();
  const technologyEquivalences: TechnologyEquivalence[] = [];
  for (const pair of input.technologyEquivalences ?? []) {
    const original = declaredByKey.get(technologyNameKey(pair.original));
    if (!original)
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Equivalences must reference a technology saved in your CV.",
      });
    const spelling = literalVacancyTerm(input.jobDescription, pair.proposed);
    if (!spelling)
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Confirm only technology names appearing in this vacancy.",
      });
    const key = equivalencePairKey(original, spelling);
    if (seenEquivalences.has(key)) continue;
    seenEquivalences.add(key);
    technologyEquivalences.push({ original, proposed: spelling });
  }
  for (const saved of savedRows) {
    const original = declaredByKey.get(technologyNameKey(saved.original));
    if (!original) continue;
    const spelling = literalVacancyTerm(input.jobDescription, saved.proposed);
    if (!spelling) continue;
    const key = equivalencePairKey(original, spelling);
    if (seenRejected.has(key) || seenEquivalences.has(key)) continue;
    seenEquivalences.add(key);
    technologyEquivalences.push({ original, proposed: spelling });
  }
  const requested = input.confirmedTechnologies ?? [];
  const seen = new Set(
    knownTechnologySpellings(
      declared,
      requested,
      technologyEquivalences,
    ).keys(),
  );
  const confirmedTechnologies = requested.flatMap((name) => {
    const spelling = literalVacancyTerm(input.jobDescription, name);
    if (!spelling)
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Confirm only technology names appearing in this vacancy.",
      });
    const key = technologyNameKey(spelling);
    if (seen.has(key)) return [];
    seen.add(key);
    return [spelling];
  });
  return {
    ...input,
    source,
    localizedFacts,
    confirmedTechnologies,
    technologyEquivalences,
    rejectedTechnologyEquivalences,
  };
}
