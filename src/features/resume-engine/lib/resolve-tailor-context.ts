import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@prisma/client";
import { loadCvStructuredDraft } from "@/features/cv/lib/load-cv-structured-draft";
import type { TailorContext } from "./tailored-resume-document";

export async function resolveTailorContext(
  db: PrismaClient,
  userId: string,
  input: Omit<TailorContext, "drafts">,
): Promise<TailorContext> {
  const [en, es, nl] = await Promise.all(
    ["en", "es", "nl"].map((locale) =>
      loadCvStructuredDraft(db, userId, {
        locale: locale as "en" | "es" | "nl",
        evidenceScope: "all",
      }),
    ),
  );
  if (!en || !es || !nl)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "Complete your CV in Resume Studio before generating a tailored resume.",
    });
  return { ...input, drafts: { en, es, nl } };
}
