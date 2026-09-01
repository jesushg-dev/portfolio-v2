import type { Prisma, PrismaClient } from "@prisma/client";
import type { Locale } from "@/i18n/config";

import { parseDocx } from "@/lib/docx/parser";
import { rebuildDocx } from "@/lib/docx/rebuilder";
import type { CvDocxTailorResult } from "@/features/resume-engine/lib/cv-docx-tailor-result";
import type { UploadTailorSource } from "@/features/resume-engine/lib/fetch-upload-docx";
import type { ParsedPdfForTailor } from "@/features/resume-engine/lib/pdf/parse-pdf-for-tailor";
import { rebuildPdfInPlace } from "@/features/resume-engine/lib/pdf/rebuild-pdf-in-place";
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
import { applyAdaptedSectionsToDraft } from "@/features/cv/lib/apply-adapted-sections-to-draft";
import {
  parseMatchAnalysis,
  type CvMatchAnalysis,
} from "@/features/resume-engine/lib/cv-match-analysis";
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
  matchAnalysis?: CvMatchAnalysis | null;
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
  matchAnalysis?: CvMatchAnalysis | null;
  aiProvider: string;
  sourceType: "studio" | "upload";
  sourceUploadId?: string;
  jobDescription: string;
  applicationId?: string;
  tailoredFor?: string;
  structuredSnapshot?: unknown;
  targetLocale?: Locale;
  /** Parsed `cv-template.pdf` plus AI output that uses those PDF run ids. */
  parsedPdf?: ParsedPdfForTailor;
  pdfAdaptedSections?: AdaptedSection[];
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
    matchAnalysis?: CvMatchAnalysis | null;
    aiProvider: string;
    sourceType: "studio" | "upload";
    sourceUploadId?: string;
    jobDescription: string;
    applicationId?: string;
    tailoredFor?: string;
    structuredSnapshot?: unknown;
    fileKind?: "docx" | "pdf";
    /** Sidecar PDF from `rebuildPdfInPlace` when the primary export is DOCX. */
    pdfBuffer?: Buffer;
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

  const fileKind = input.fileKind ?? "docx";
  const mimeType = fileKind === "pdf" ? "application/pdf" : DOCX_MIME;
  const fileName = buildAtsCvFileName({
    fullName: input.fullName,
    roleTrack,
    company: application?.company.name,
    locale: input.locale,
    extension: fileKind,
  });

  const { url, key } = await uploadBufferToUploadThing(
    userId,
    input.buffer,
    fileName,
    mimeType,
  );

  let pdfFileName: string | undefined;
  let pdfFileUrl: string | undefined;
  let pdfUploadThingKey: string | undefined;

  if (fileKind === "pdf") {
    pdfFileName = fileName;
    pdfFileUrl = url;
    pdfUploadThingKey = key;
  } else if (input.pdfBuffer) {
    pdfFileName = buildAtsCvFileName({
      fullName: input.fullName,
      roleTrack,
      company: application?.company.name,
      locale: input.locale,
      extension: "pdf",
    });
    const pdfUpload = await uploadBufferToUploadThing(
      userId,
      input.pdfBuffer,
      pdfFileName,
      "application/pdf",
    );
    pdfFileUrl = pdfUpload.url;
    pdfUploadThingKey = pdfUpload.key;
  }

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
      mimeType,
      ...(pdfFileUrl
        ? {
            pdfFileName,
            pdfFileUrl,
            pdfUploadThingKey,
          }
        : {}),
      sourceType: input.sourceType,
      sourceUploadId: input.sourceUploadId,
      tailoredFor,
      jobDescription: input.jobDescription,
      aiScore: input.aiScore != null ? Math.round(input.aiScore) : undefined,
      aiProvider: input.aiProvider,
      structuredSnapshot: input.structuredSnapshot as
        Prisma.InputJsonValue | undefined,
      matchAnalysis: (input.matchAnalysis
        ? {
            ...input.matchAnalysis,
            notes: input.matchNotes ?? input.matchAnalysis.notes,
          }
        : input.matchNotes
          ? { notes: input.matchNotes }
          : null) as Prisma.InputJsonValue | undefined,
      applicationId: application?.id,
    },
  });

  if (application) {
    await db.application.update({
      where: { id: application.id },
      data: {
        cvFile: {
          name: pdfFileName ?? fileName,
          url: pdfFileUrl ?? url,
          uploadedAt: new Date(),
        },
      },
    });
  }

  return {
    exportId: resumeExport.id,
    export: resumeExport,
    downloadUrl: url,
    aiScore: input.aiScore ?? null,
    matchNotes: input.matchNotes ?? null,
    matchAnalysis:
      parseMatchAnalysis(input.matchAnalysis) ?? input.matchAnalysis ?? null,
    structuredSnapshot: input.structuredSnapshot ?? null,
    provider: input.aiProvider,
    pdfDownloadUrl:
      resumeExport.pdfFileUrl ?? (fileKind === "pdf" ? url : null),
    pitchSubject: resumeExport.pitchSubject ?? null,
    pitchBody: resumeExport.pitchBody ?? null,
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
    matchAnalysis: input.matchAnalysis,
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
  let structuredSnapshot: unknown =
    input.structuredSnapshot ?? input.parsed.sections;

  if (draft.success) {
    structuredSnapshot = applyAdaptedSectionsToDraft(
      draft.data,
      input.parsed.sections,
      input.adaptedSections,
    );
  }

  if (draft.success && input.parsed.lockedParagraphs.length > 0) {
    const lockedAdapted = syncLockedParagraphsFromDraft(
      input.parsed.lockedParagraphs,
      draft.data,
      locale,
    );
    sections = withLockedMetaSection(sections, input.parsed.lockedParagraphs);
    adaptedSections = withLockedMetaAdaptations(adaptedSections, lockedAdapted);
  }

  const buffer = await rebuildDocx(
    input.parsed.zipFiles,
    input.parsed.rawXml,
    sections,
    adaptedSections,
    locale,
  );

  const pdfBuffer =
    input.parsedPdf && input.pdfAdaptedSections
      ? await rebuildPdfInPlace(
          input.parsedPdf.buffer,
          input.parsedPdf.items,
          input.pdfAdaptedSections,
        )
      : undefined;

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
    matchAnalysis: input.matchAnalysis,
    aiProvider: input.aiProvider,
    sourceType: input.sourceType,
    sourceUploadId: input.sourceUploadId,
    jobDescription: input.jobDescription,
    applicationId: input.applicationId,
    tailoredFor: input.tailoredFor,
    structuredSnapshot,
    pdfBuffer,
  });
}

interface FinalizePdfTailorExportInput {
  parsed: ParsedPdfForTailor;
  adaptedSections: AdaptedSection[];
  aiScore?: number | null;
  matchNotes?: string | null;
  matchAnalysis?: CvMatchAnalysis | null;
  aiProvider: string;
  sourceType: "studio" | "upload";
  sourceUploadId?: string;
  jobDescription: string;
  applicationId?: string;
  tailoredFor?: string;
  structuredSnapshot?: unknown;
  targetLocale?: Locale;
}

/** Upload path: stamp adapted text onto the original PDF without rebuilding layout. */
export async function finalizePdfTailorExport(
  db: PrismaClient,
  userId: string,
  input: FinalizePdfTailorExportInput,
) {
  const locale = input.targetLocale ?? "en";
  const draft = CvImportDraftSchema.safeParse(input.structuredSnapshot);

  let structuredSnapshot: unknown =
    input.structuredSnapshot ?? input.parsed.sections;

  if (draft.success) {
    structuredSnapshot = applyAdaptedSectionsToDraft(
      draft.data,
      input.parsed.sections,
      input.adaptedSections,
    );
  }

  const buffer = await rebuildPdfInPlace(
    input.parsed.buffer,
    input.parsed.items,
    input.adaptedSections,
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
    matchAnalysis: input.matchAnalysis,
    aiProvider: input.aiProvider,
    sourceType: input.sourceType,
    sourceUploadId: input.sourceUploadId,
    jobDescription: input.jobDescription,
    applicationId: input.applicationId,
    tailoredFor: input.tailoredFor,
    structuredSnapshot,
    fileKind: "pdf",
  });
}

export async function finalizeUploadTailorExport(
  db: PrismaClient,
  userId: string,
  input: {
    source: UploadTailorSource;
    result: CvDocxTailorResult;
    aiProvider: string;
    jobDescription: string;
    applicationId?: string;
    tailoredFor?: string;
    targetLocale?: Locale;
  },
) {
  const shared = {
    adaptedSections: input.result.sections,
    aiScore: input.result.aiScore,
    matchNotes: input.result.matchNotes,
    matchAnalysis: input.result.matchAnalysis,
    aiProvider: input.aiProvider,
    sourceType: "upload" as const,
    sourceUploadId: input.source.upload.id,
    jobDescription: input.jobDescription,
    applicationId: input.applicationId,
    tailoredFor: input.tailoredFor,
    structuredSnapshot: input.source.upload.parsedDraft ?? undefined,
    targetLocale: input.result.detectedLocale ?? input.targetLocale,
  };

  if (input.source.kind === "pdf") {
    return finalizePdfTailorExport(db, userId, {
      parsed: input.source.parsed,
      ...shared,
    });
  }

  return finalizeDocxTailorExport(db, userId, {
    parsed: input.source.parsed,
    ...shared,
  });
}
