import "server-only";

import type { Locale } from "@/i18n/config";
import { CV_LETTER_WIDTH_PX } from "@/features/cv/lib/cv-letter-page";
import { launchPdfBrowser } from "@/features/cv/lib/generate-cv-pdf-from-preview";
import { mapDraftToLocalizedCv } from "@/features/cv/lib/map-draft-to-localized";
import {
  ATS_PREVIEW_LABELS,
  buildAtsPreviewHtml,
} from "@/features/resume-engine/lib/build-ats-preview-html";
import {
  CvImportDraftSchema,
  type CvImportDraft,
} from "@/features/cv/lib/cv-import-draft";

export async function generateCvPdfFromSnapshot(
  snapshot: unknown,
  locale: Locale,
): Promise<Buffer> {
  const draft = CvImportDraftSchema.parse(snapshot);
  return generateCvPdfFromDraft(draft, locale);
}

export async function generateCvPdfFromDraft(
  draft: CvImportDraft,
  locale: Locale,
): Promise<Buffer> {
  const { data, aboutMeText } = mapDraftToLocalizedCv(draft);
  const html = buildAtsPreviewHtml({
    data,
    aboutMeText,
    labels: ATS_PREVIEW_LABELS[locale],
  });

  const browser = await launchPdfBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load", timeout: 30_000 });
    const preview = page.locator("#cv-public-preview");
    await preview.waitFor({ state: "visible", timeout: 15_000 });

    const contentHeight = await preview.evaluate((element) =>
      Math.ceil(
        Math.max(element.getBoundingClientRect().height, element.scrollHeight),
      ),
    );

    await page.setViewportSize({
      width: CV_LETTER_WIDTH_PX,
      height: Math.max(contentHeight, 800),
    });

    const pdfBuffer = await page.pdf({
      width: `${CV_LETTER_WIDTH_PX}px`,
      height: `${Math.max(contentHeight, 800)}px`,
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
      preferCSSPageSize: false,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
