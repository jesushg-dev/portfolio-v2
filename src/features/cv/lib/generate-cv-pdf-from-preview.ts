import "server-only";

import type { Locale } from "@/i18n/config";
import { TENANT_USERNAME_HEADER } from "@/lib/tenant/resolve";
import { getServerBaseUrl } from "@/lib/url/get-base-url";
import { CV_LETTER_WIDTH_PX } from "@/features/cv/lib/cv-letter-page";

export interface GenerateCvPdfOptions {
  locale: Locale;
  tenantUsername?: string;
  baseUrl?: string;
  paginatePages?: boolean;
}

function buildCvPreviewPath(locale: Locale): string {
  return locale === "en"
    ? "/curriculum-vitae?pdf=1"
    : `/${locale}/curriculum-vitae?pdf=1`;
}

const PDF_RESET_CSS = `
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
    min-height: 0 !important;
    height: auto !important;
    overflow: visible !important;
    display: block !important;
  }
  body > * {
    margin: 0 !important;
    padding: 0 !important;
  }
  #cv-public-preview {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    width: ${CV_LETTER_WIDTH_PX}px !important;
    max-width: ${CV_LETTER_WIDTH_PX}px !important;
    max-height: none !important;
    height: auto !important;
    overflow: visible !important;
    box-shadow: none !important;
    font-family: Calibri, var(--font-cv-preview), "Segoe UI", "Helvetica Neue", Arial, sans-serif !important;
  }
  #cv-public-preview * {
    font-family: inherit !important;
  }
`;

export async function generateCvPdfFromPreview(
  options: GenerateCvPdfOptions,
): Promise<Buffer> {
  const { chromium } = await import("playwright");
  const baseUrl = (options.baseUrl ?? getServerBaseUrl()).replace(/\/$/, "");
  const targetUrl = `${baseUrl}${buildCvPreviewPath(options.locale)}`;

  const browser = await chromium.launch({
    headless: true,
  });

  try {
    const context = await browser.newContext({
      viewport: {
        width: CV_LETTER_WIDTH_PX,
        height: 800,
      },
      extraHTTPHeaders: options.tenantUsername
        ? { [TENANT_USERNAME_HEADER]: options.tenantUsername }
        : undefined,
    });
    const page = await context.newPage();

    await page.goto(targetUrl, {
      waitUntil: "networkidle",
      timeout: 60_000,
    });

    const preview = page.locator("#cv-public-preview");
    await preview.waitFor({
      state: "visible",
      timeout: 30_000,
    });

    await page.addStyleTag({ content: PDF_RESET_CSS });
    await page.evaluate(() => window.scrollTo(0, 0));

    const contentHeight = await preview.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return Math.ceil(Math.max(rect.height, element.scrollHeight));
    });

    await page.setViewportSize({
      width: CV_LETTER_WIDTH_PX,
      height: contentHeight,
    });

    const pageHeight = contentHeight;
    const paginatePages = options.paginatePages ?? false;

    const pdfBuffer = await page.pdf(
      paginatePages
        ? {
            format: "Letter",
            printBackground: true,
            margin: { top: "0", right: "0", bottom: "0", left: "0" },
            preferCSSPageSize: false,
          }
        : {
            width: `${CV_LETTER_WIDTH_PX}px`,
            height: `${pageHeight}px`,
            printBackground: true,
            margin: { top: "0", right: "0", bottom: "0", left: "0" },
            preferCSSPageSize: false,
          },
    );

    await context.close();
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
