import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@prisma/client";
import { loadCvStructuredDraft } from "@/features/cv/lib/load-cv-structured-draft";
import type { TailorContext } from "./tailored-resume-document";

export async function resolveTailorContext(
  db: PrismaClient,
  userId: string,
  input: Omit<TailorContext, "source">,
): Promise<TailorContext> {
  const source = await loadCvStructuredDraft(db, userId, {
    locale: input.targetLocale,
    evidenceScope: "all",
  });
  if (!source)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "Complete your CV in Resume Studio before generating a tailored resume.",
    });
  return { ...input, source };
}
