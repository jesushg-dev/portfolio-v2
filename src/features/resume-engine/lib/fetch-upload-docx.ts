import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@prisma/client";

import { parseDocx } from "@/lib/docx/parser";
import { parseDocxForImport } from "@/features/resume-engine/lib/docx/import-parser";
import {
  parsePdfForTailor,
  type ParsedPdfForTailor,
} from "@/features/resume-engine/lib/pdf/parse-pdf-for-tailor";
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

export async function fetchUploadDocxBuffer(
  db: PrismaClient,
  uploadId: string,
  userId: string,
) {
  return fetchUploadResumeBuffer(db, uploadId, userId);
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

export type UploadTailorSource =
  | {
      kind: "docx";
      upload: Awaited<ReturnType<typeof fetchUploadResumeBuffer>>["upload"];
      parsed: Awaited<ReturnType<typeof parseDocx>>;
      buffer: Buffer;
    }
  | {
      kind: "pdf";
      upload: Awaited<ReturnType<typeof fetchUploadResumeBuffer>>["upload"];
      parsed: ParsedPdfForTailor;
    };

export async function fetchUploadForTailor(
  db: PrismaClient,
  uploadId: string,
  userId: string,
): Promise<UploadTailorSource> {
  const { upload, buffer } = await fetchUploadResumeBuffer(
    db,
    uploadId,
    userId,
  );

  if (isPdfUpload(upload.fileName, upload.mimeType)) {
    const parsed = await parsePdfForTailor(buffer);
    return { kind: "pdf", upload, parsed };
  }

  if (!isDocxUpload(upload.fileName, upload.mimeType)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Only DOCX and PDF are supported for layout-preserving tailor.",
    });
  }

  const parsed = await parseDocx(buffer);

  if (parsed.sections.length === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "No adaptable sections found in the DOCX. Check that the file uses recognizable heading and bullet styles.",
    });
  }

  return { kind: "docx", upload, parsed, buffer };
}

/** @deprecated Use fetchUploadForTailor — kept for callers that require DOCX. */
export async function fetchUploadDocxForTailor(
  db: PrismaClient,
  uploadId: string,
  userId: string,
) {
  const source = await fetchUploadForTailor(db, uploadId, userId);
  if (source.kind !== "docx") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "This step requires a DOCX source.",
    });
  }
  return source;
}
