import "server-only";

import type { Locale } from "@/i18n/config";
import { resolveCvPdfAsset } from "@/features/cv/lib/resolve-cv-pdf-asset";

export async function getCvPdfDownload(
  userId: string,
  username: string,
  locale: Locale,
  fallbackLocale: Locale,
  options?: { paginatePages?: boolean; design?: string },
) {
  return resolveCvPdfAsset(userId, username, locale, fallbackLocale, {
    paginatePages: options?.paginatePages ?? false,
    includeBuffer: true,
    design: options?.design,
  });
}
