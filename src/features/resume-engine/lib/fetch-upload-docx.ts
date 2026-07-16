import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@prisma/client";

import { parseDocx } from "@/lib/docx/parser";
import { parseDocxForImport } from "@/features/resume-engine/lib/docx/import-parser";

export async function fetchUploadDocxBuffer(
  db: PrismaClient,
  uploadId: string,
  userId: string,
) {
  const upload = await db.cvSourceUpload.findUnique({
    where: { id: uploadId },
  });

  if (upload?.userId !== userId) {
    throw new TRPCError({ code: "NOT_FOUND" });
  }

  if (
    !upload.mimeType.includes("wordprocessingml") &&
    !upload.fileName.toLowerCase().endsWith(".docx")
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Only DOCX import is supported in this phase. PDF coming soon.",
    });
  }

  const response = await fetch(upload.originalFileUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch uploaded file (${response.status})`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return { upload, buffer };
}

export async function fetchUploadDocxSections(
  db: PrismaClient,
  uploadId: string,
  userId: string,
) {
  const { upload, buffer } = await fetchUploadDocxBuffer(db, uploadId, userId);
  const { sections } = await parseDocxForImport(buffer);

  return { upload, sections };
}

export async function fetchUploadDocxForTailor(
  db: PrismaClient,
  uploadId: string,
  userId: string,
) {
  const { upload, buffer } = await fetchUploadDocxBuffer(db, uploadId, userId);
  const parsed = await parseDocx(buffer);

  if (parsed.sections.length === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "No adaptable sections found in the DOCX. Check that the file uses recognizable heading and bullet styles.",
    });
  }

  return { upload, parsed };
}
