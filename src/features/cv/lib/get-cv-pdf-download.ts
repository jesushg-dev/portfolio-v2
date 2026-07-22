import "server-only";

import type { Locale } from "@/i18n/config";
import { generateCvPdfFromPreview } from "@/features/cv/lib/generate-cv-pdf-from-preview";
import { loadCvStructuredDraft } from "./load-cv-structured-draft";
import { db } from "@/server/db";

function sanitizeFileName(value: string): string {
  return value.replace(/[^\w.-]+/g, "_");
}

export async function getCvPdfDownloadBuffer(
  userId: string,
  username: string,
  locale: Locale,
  fallbackLocale: Locale,
  options?: { paginatePages?: boolean },
): Promise<{ buffer: Buffer; fileName: string } | null> {
  const draft = await loadCvStructuredDraft(db, userId, {
    locale,
    fallbackLocale,
  });

  if (!draft) return null;

  const buffer = await generateCvPdfFromPreview({
    locale,
    tenantUsername: username,
    paginatePages: options?.paginatePages ?? false,
  });

  return {
    buffer,
    fileName: `CV-${sanitizeFileName(draft.header.fullName)}.pdf`,
  };
}
