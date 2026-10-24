import type { Prisma, PrismaClient } from "@prisma/client";
import type { Locale } from "@/i18n/config";
import { loadCvTemplateDocxBuffer } from "@/features/cv/lib/load-cv-template-docx";
import { uploadBufferToUploadThing } from "@/lib/uploadthing/upload-buffer";
import { buildAtsCvFileName, inferCvRoleTrack } from "./build-ats-cv-file-name";
import { parseMatchAnalysis, type CvMatchAnalysis } from "./cv-match-analysis";
import { getResumeTemplate, type CvTemplateVersion } from "./template-registry";
import type {
  TailoredResumeDocument,
  TailoredResumeResponse,
} from "./tailored-resume-document";
import { renderResumeTemplate } from "./docx/render-template";
import { loadResumeImages } from "./docx/resume-photo";
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
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

    jobDescription: string;
    applicationId?: string;
    tailoredFor?: string;
    structuredSnapshot: TailoredResumeDocument;
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

  const mimeType = DOCX_MIME;
  const fileName = buildAtsCvFileName({
    fullName: input.fullName,
    roleTrack,
    company: application?.company.name,
    locale: input.locale,
    extension: "docx",
  });

  const { url, key } = await uploadBufferToUploadThing(
    userId,
    input.buffer,
    fileName,
    mimeType,
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
      mimeType,
      sourceType: "studio",
      tailoredFor,
      jobDescription: input.jobDescription,
      aiScore: input.aiScore != null ? Math.round(input.aiScore) : undefined,
      aiProvider: input.aiProvider,
      structuredSnapshot: input.structuredSnapshot,
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
          name: fileName,
          url,
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
    pdfDownloadUrl: resumeExport.pdfFileUrl ?? null,
    pitchSubject: resumeExport.pitchSubject ?? null,
    pitchBody: resumeExport.pitchBody ?? null,
  };
}

export async function finalizeTailoredResume(
  db: PrismaClient,
  userId: string,
  input: {
    document: TailoredResumeDocument;
    result: TailoredResumeResponse;
    aiProvider: string;
    jobDescription: string;
    applicationId?: string;
    tailoredFor?: string;
  },
) {
  const template = getResumeTemplate(input.document.templateId);
  const source = await loadCvTemplateDocxBuffer(
    template.id as CvTemplateVersion,
  );
  const { photo, companyLogos } = await loadResumeImages(
    input.document,
    template.capabilities.companyLogos,
  );
  const buffer = await renderResumeTemplate(
    source,
    input.document,
    template,
    photo,
    companyLogos,
  );
  return persistResumeExport(db, userId, {
    buffer,
    fullName: input.document.header.fullName,
    locale: input.document.locale,
    aiScore: input.result.aiScore,
    matchNotes: input.result.matchNotes,
    matchAnalysis: input.result.matchAnalysis,
    aiProvider: input.aiProvider,
    jobDescription: input.jobDescription,
    applicationId: input.applicationId,
    tailoredFor: input.tailoredFor,
    structuredSnapshot: input.document,
  });
}
