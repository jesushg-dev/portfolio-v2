import type { Prisma, PrismaClient } from "@prisma/client";

import { parseDocx } from "@/lib/docx/parser";
import { rebuildDocx } from "@/lib/docx/rebuilder";
import type { AdaptedSection } from "@/lib/types";
import {
  buildTailoredFileName,
  generateDocxFromStructured,
} from "@/features/resume-engine/lib/docx/generate-from-structured";
import type { CvImportDraft } from "@/features/cv/lib/cv-import-draft";
import { uploadBufferToUploadThing } from "@/lib/uploadthing/upload-buffer";

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

interface FinalizeTailorExportInput {
  draft: CvImportDraft;
  aiScore?: number | null;
  matchNotes?: string | null;
  aiProvider: string;
  sourceType: "studio" | "upload";
  sourceUploadId?: string;
  jobDescription: string;
  applicationId?: string;
  tailoredFor?: string;
  baseFileName?: string;
}

interface FinalizeDocxTailorExportInput {
  parsed: Awaited<ReturnType<typeof parseDocx>>;
  adaptedSections: AdaptedSection[];
  aiScore?: number | null;
  matchNotes?: string | null;
  aiProvider: string;
  sourceType: "studio" | "upload";
  sourceUploadId?: string;
  jobDescription: string;
  applicationId?: string;
  tailoredFor?: string;
  baseFileName: string;
  structuredSnapshot?: unknown;
}

async function persistResumeExport(
  db: PrismaClient,
  userId: string,
  input: {
    buffer: Buffer;
    fileName: string;
    aiScore?: number | null;
    matchNotes?: string | null;
    aiProvider: string;
    sourceType: "studio" | "upload";
    sourceUploadId?: string;
    jobDescription: string;
    applicationId?: string;
    tailoredFor?: string;
    structuredSnapshot?: unknown;
  },
) {
  const { url, key } = await uploadBufferToUploadThing(
    input.buffer,
    input.fileName,
    DOCX_MIME,
  );

  let application: {
    id: string;
    position: string;
    company: { name: string };
  } | null = null;

  if (input.applicationId) {
    application = await db.application.findFirst({
      where: { id: input.applicationId, userId },
      include: { company: true },
    });
  }

  const tailoredFor =
    input.tailoredFor ??
    (application
      ? `${application.position} @ ${application.company.name}`
      : undefined);

  const resumeExport = await db.resumeExport.create({
    data: {
      userId,
      fileName: input.fileName,
      fileUrl: url,
      uploadThingKey: key,
      mimeType: DOCX_MIME,
      sourceType: input.sourceType,
      sourceUploadId: input.sourceUploadId,
      tailoredFor,
      jobDescription: input.jobDescription,
      aiScore: input.aiScore != null ? Math.round(input.aiScore) : undefined,
      aiProvider: input.aiProvider,
      structuredSnapshot: input.structuredSnapshot as
        Prisma.InputJsonValue | undefined,
      applicationId: application?.id,
    },
  });

  if (application) {
    await db.application.update({
      where: { id: application.id },
      data: {
        cvFile: {
          name: input.fileName,
          url,
          uploadedAt: new Date(),
        },
      },
    });
  }

  return {
    export: resumeExport,
    downloadUrl: url,
    aiScore: input.aiScore ?? null,
    matchNotes: input.matchNotes ?? null,
    provider: input.aiProvider,
  };
}

/** Studio path: generate DOCX from structured CMS draft (no layout preservation). */
export async function finalizeTailorExport(
  db: PrismaClient,
  userId: string,
  input: FinalizeTailorExportInput,
) {
  const buffer = await generateDocxFromStructured(input.draft);
  const baseName =
    input.baseFileName ??
    `${input.draft.header.fullName.replace(/\s+/g, "_")}_resume.docx`;
  const fileName = buildTailoredFileName(baseName);

  return persistResumeExport(db, userId, {
    buffer,
    fileName,
    aiScore: input.aiScore,
    matchNotes: input.matchNotes,
    aiProvider: input.aiProvider,
    sourceType: input.sourceType,
    sourceUploadId: input.sourceUploadId,
    jobDescription: input.jobDescription,
    applicationId: input.applicationId,
    tailoredFor: input.tailoredFor,
    structuredSnapshot: input.draft,
  });
}

/** Upload path: rebuild original DOCX preserving layout, styles, and tables. */
export async function finalizeDocxTailorExport(
  db: PrismaClient,
  userId: string,
  input: FinalizeDocxTailorExportInput,
) {
  const buffer = await rebuildDocx(
    input.parsed.zipFiles,
    input.parsed.rawXml,
    input.parsed.sections,
    input.adaptedSections,
  );
  const fileName = buildTailoredFileName(input.baseFileName);

  return persistResumeExport(db, userId, {
    buffer,
    fileName,
    aiScore: input.aiScore,
    matchNotes: input.matchNotes,
    aiProvider: input.aiProvider,
    sourceType: input.sourceType,
    sourceUploadId: input.sourceUploadId,
    jobDescription: input.jobDescription,
    applicationId: input.applicationId,
    tailoredFor: input.tailoredFor,
    structuredSnapshot: input.structuredSnapshot ?? input.parsed.sections,
  });
}
