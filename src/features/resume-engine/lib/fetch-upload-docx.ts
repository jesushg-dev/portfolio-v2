import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@prisma/client";

import { parseDocxForImport } from "@/features/resume-engine/lib/docx/import-parser";
import {
  isDocxUpload,
  isPdfUpload,
  parsePdfForImport,
} from "@/features/resume-engine/lib/parse-pdf-for-import";

export async function fetchUploadResumeBuffer(
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
  const { upload, buffer } = await fetchUploadResumeBuffer(
    db,
    uploadId,
    userId,
  );

  if (isPdfUpload(upload.fileName, upload.mimeType)) {
    const { sections } = await parsePdfForImport(buffer);
    return { upload, sections };
  }

  if (!isDocxUpload(upload.fileName, upload.mimeType)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Only DOCX and PDF resumes are supported.",
    });
  }

  const { sections } = await parseDocxForImport(buffer);
  return { upload, sections };
}
