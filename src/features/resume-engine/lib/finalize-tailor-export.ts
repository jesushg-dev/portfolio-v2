import type { Prisma, PrismaClient } from "@prisma/client";
import type { Locale } from "@/i18n/config";

import { parseDocx } from "@/lib/docx/parser";
import { rebuildDocx } from "@/lib/docx/rebuilder";
import type { AdaptedSection } from "@/lib/types";
import { generateDocxFromStructured } from "@/features/resume-engine/lib/docx/generate-from-structured";
import {
  buildAtsCvFileName,
  inferCvRoleTrack,
} from "@/features/resume-engine/lib/build-ats-cv-file-name";
import {
  CvImportDraftSchema,
  type CvImportDraft,
} from "@/features/cv/lib/cv-import-draft";
import { uploadBufferToUploadThing } from "@/lib/uploadthing/upload-buffer";
import {
  syncLockedParagraphsFromDraft,
  withLockedMetaAdaptations,
  withLockedMetaSection,
} from "@/features/resume-engine/lib/sync-locked-paragraphs-from-draft";

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
  targetLocale?: Locale;
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
  structuredSnapshot?: unknown;
  targetLocale?: Locale;
}

function fullNameFromSnapshot(snapshot: unknown): string | null {
  const parsed = CvImportDraftSchema.safeParse(snapshot);
  if (!parsed.success) return null;
  const name = parsed.data.header.fullName.trim();
  return name.length > 0 ? name : null;
}

async function resolveExportFullName(
  db: PrismaClient,
  userId: string,
  snapshot?: unknown,
  draft?: CvImportDraft,
): Promise<string> {
  const fromDraft = draft?.header.fullName.trim();
  if (fromDraft) return fromDraft;

  const fromSnapshot = fullNameFromSnapshot(snapshot);
  if (fromSnapshot) return fromSnapshot;

  const header = await db.cvHeader.findFirst({
    where: { userId },
    select: { fullName: true },
  });
  const fromHeader = header?.fullName.trim();
  return fromHeader && fromHeader.length > 0 ? fromHeader : "Candidate";
}

async function persistResumeExport(
  db: PrismaClient,
  userId: string,
  input: {
    buffer: Buffer;
    fullName: string;
    locale: Locale;
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

  const roleTrack = inferCvRoleTrack(
    [application?.position, input.tailoredFor, input.jobDescription]
      .filter(Boolean)
      .join(" "),
  );

  const fileName = buildAtsCvFileName({
    fullName: input.fullName,
    roleTrack,
    company: application?.company.name,
    locale: input.locale,
  });

  const { url, key } = await uploadBufferToUploadThing(
    userId,
    input.buffer,
    fileName,
    DOCX_MIME,
  );

  const tailoredFor =
    input.tailoredFor ??
    (application
      ? `${application.position} @ ${application.company.name}`
      : undefined);

  const resumeExport = await db.resumeExport.create({
    data: {
      userId,
      fileName,
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
          name: fileName,
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
  const fullName = await resolveExportFullName(
    db,
    userId,
    input.draft,
    input.draft,
  );
  const locale = input.targetLocale ?? input.draft.detectedLocale ?? "en";

  return persistResumeExport(db, userId, {
    buffer,
    fullName,
    locale,
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

/** Upload/studio path: rebuild original DOCX preserving layout, styles, and tables. */
export async function finalizeDocxTailorExport(
  db: PrismaClient,
  userId: string,
  input: FinalizeDocxTailorExportInput,
) {
  const locale = input.targetLocale ?? "en";
  const draft = CvImportDraftSchema.safeParse(input.structuredSnapshot);

  let sections = input.parsed.sections;
  let adaptedSections: AdaptedSection[] = input.adaptedSections;

  if (draft.success && input.parsed.lockedParagraphs.length > 0) {
    const lockedAdapted = syncLockedParagraphsFromDraft(
      input.parsed.lockedParagraphs,
      draft.data,
      locale,
    );
    sections = withLockedMetaSection(sections, input.parsed.lockedParagraphs);
    adaptedSections = withLockedMetaAdaptations(
      adaptedSections,
      lockedAdapted,
    );
  }

  const buffer = await rebuildDocx(
    input.parsed.zipFiles,
    input.parsed.rawXml,
    sections,
    adaptedSections,
    locale,
  );
  const fullName = await resolveExportFullName(
    db,
    userId,
    input.structuredSnapshot,
  );

  return persistResumeExport(db, userId, {
    buffer,
    fullName,
    locale,
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
