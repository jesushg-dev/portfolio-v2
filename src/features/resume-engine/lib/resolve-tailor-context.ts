import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@prisma/client";
import { loadCvStructuredDraft } from "@/features/cv/lib/load-cv-structured-draft";
import type { TailorContext } from "./tailored-resume-document";
import { declaredResumeTechnologies } from "./resume-technology-names";
import {
  knownTechnologySpellings,
  literalVacancyTerm,
  technologyNameKey,
} from "./extract-job-tools";

export async function resolveTailorContext(
  db: PrismaClient,
  userId: string,
  input: Omit<TailorContext, "source" | "localizedFacts">,
): Promise<TailorContext> {
  const draft = await loadCvStructuredDraft(db, userId, {
    locale: input.targetLocale,
    evidenceScope: "all",
    includeSoftSkills: input.templateId === "v1",
  });
  if (!draft)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "Complete your CV in Resume Studio before generating a tailored resume.",
    });
  const { localizedFacts, ...source } = draft;
  const requested = input.confirmedTechnologies ?? [];
  const seen = new Set(
    knownTechnologySpellings(
      declaredResumeTechnologies(source),
      requested,
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
  return { ...input, source, localizedFacts, confirmedTechnologies };
}
