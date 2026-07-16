import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@prisma/client";

import {
  CvImportDraftSchema,
  type CvImportDraft,
} from "@/features/resume-engine/lib/cv-import-draft";
import { loadCvStructuredDraft } from "@/features/resume-engine/lib/load-cv-structured-draft";

export async function resolveTailorBaseDraft(
  db: PrismaClient,
  userId: string,
  sourceType: "studio" | "upload",
  uploadId?: string,
): Promise<{ draft: CvImportDraft; sourceUploadId?: string }> {
  if (sourceType === "studio") {
    const draft = await loadCvStructuredDraft(db, userId);
    if (!draft) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "No resume data in Resume Studio. Import a resume or edit your CV first.",
      });
    }
    return { draft };
  }

  if (!uploadId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "uploadId is required when sourceType is upload.",
    });
  }

  const upload = await db.cvSourceUpload.findUnique({
    where: { id: uploadId },
  });

  if (upload?.userId !== userId) {
    throw new TRPCError({ code: "NOT_FOUND" });
  }

  if (!upload.parsedDraft) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "Upload has no structured draft. Parse or paste import JSON first.",
    });
  }

  return {
    draft: CvImportDraftSchema.parse(upload.parsedDraft),
    sourceUploadId: upload.id,
  };
}
