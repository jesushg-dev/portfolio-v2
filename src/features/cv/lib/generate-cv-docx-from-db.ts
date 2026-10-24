import type { PrismaClient } from "@prisma/client";
import type { Locale } from "@/i18n/config";
import { loadCvStructuredDraft } from "./load-cv-structured-draft";
import { loadCvTemplateDocxBuffer } from "./load-cv-template-docx";
import {
  getResumeTemplate,
  DEFAULT_CV_TEMPLATE_VERSION,
} from "@/features/resume-engine/lib/template-registry";
import { TailoredResumeDocumentSchema } from "@/features/resume-engine/lib/tailored-resume-document";
import { renderResumeTemplate } from "@/features/resume-engine/lib/docx/render-template";
import { loadResumeImages } from "@/features/resume-engine/lib/docx/resume-photo";

export async function generateCvDocxFromDb(
  db: PrismaClient,
  userId: string,
  locale: Locale,
  fallbackLocale: Locale,
): Promise<{ buffer: Buffer; fileName: string } | null> {
  const draft = await loadCvStructuredDraft(db, userId, {
    locale,
    fallbackLocale,
  });
  if (!draft) return null;
  const template = getResumeTemplate(DEFAULT_CV_TEMPLATE_VERSION);
  const document = TailoredResumeDocumentSchema.parse({
    ...draft,
    schemaVersion: 1,
    locale,
    templateId: template.id,
    templateRevision: template.revision,
  });
  const images = await loadResumeImages(
    document,
    template.capabilities.companyLogos,
  );
  const buffer = await renderResumeTemplate(
    await loadCvTemplateDocxBuffer(DEFAULT_CV_TEMPLATE_VERSION),
    document,
    template,
    images.photo,
    images.companyLogos,
  );
  return {
    buffer,
    fileName: `CV_${draft.header.fullName.replace(/[^\w.-]+/g, "_")}_${locale}.docx`,
  };
}
