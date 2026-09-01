import "server-only";

import fs from "node:fs";
import path from "node:path";

import { launchPdfBrowser } from "@/features/cv/lib/generate-cv-pdf-from-preview";

/* Playwright types from the dynamic Chromium launcher are not resolved in this file. */

function nodeModulesFile(...segments: string[]): string {
  const filePath = path.join(process.cwd(), "node_modules", ...segments);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing ${segments.join("/")}`);
  }
  return filePath;
}

function toBase64(buffer: Buffer): string {
  return buffer.toString("base64");
}

function printCss(pageWidthPx: number, pageHeightPx: number): string {
  return `
  @page {
    size: ${pageWidthPx}px ${pageHeightPx}px;
    margin: 0;
  }
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
    overflow: visible !important;
  }
  .docx-wrapper {
    background: #ffffff !important;
    padding: 0 !important;
    width: ${pageWidthPx}px !important;
  }
  .docx-wrapper > section.docx {
    box-shadow: none !important;
    margin: 0 !important;
    break-after: page;
    page-break-after: always;
  }
  .docx-wrapper > section.docx:last-child {
    break-after: auto;
    page-break-after: auto;
  }
`;
}

/**
 * Render the tailored DOCX with docx-preview (same layout as Word) and print
 * every page to PDF. Do not rebuild from the ATS HTML snapshot.
 */
export async function generatePdfFromDocxBuffer(
  buffer: Buffer,
): Promise<Buffer> {
  const jszipPath = nodeModulesFile("jszip", "dist", "jszip.min.js");
  const docxPreviewPath = nodeModulesFile(
    "docx-preview",
    "dist",
    "docx-preview.js",
  );
  const base64 = toBase64(buffer);

  const browser = await launchPdfBrowser();
  try {
    const page = await browser.newPage({
      viewport: { width: 816, height: 1056 },
    });
    await page.setContent(
      `<!DOCTYPE html><html><head><meta charset="utf-8" /></head>
       <body><div id="docx"></div></body></html>`,
      { waitUntil: "load" },
    );
    await page.addScriptTag({ path: jszipPath });
    await page.addScriptTag({ path: docxPreviewPath });
    await page.evaluate(async (payload) => {
      const binary = atob(payload);
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
      }
      const blob = new Blob([bytes], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const container = document.getElementById("docx");
      const docxApi = (
        window as unknown as {
          docx?: {
            renderAsync: (
              data: Blob,
              body: HTMLElement,
              style?: HTMLElement,
              options?: Record<string, unknown>,
            ) => Promise<unknown>;
          };
        }
      ).docx;
      if (!container || !docxApi?.renderAsync) {
        throw new Error("docx-preview failed to load");
      }
      await docxApi.renderAsync(blob, container, undefined, {
        inWrapper: true,
        breakPages: true,
        hideWrapperOnPrint: true,
        ignoreWidth: false,
        ignoreHeight: false,
        ignoreFonts: false,
        ignoreLastRenderedPageBreak: false,
        experimental: true,
        renderHeaders: true,
        renderFooters: true,
        renderFootnotes: true,
        renderEndnotes: true,
        renderAltChunks: true,
        useBase64URL: true,
      });
    }, base64);

    await page
      .locator("#docx .docx-wrapper, #docx section.docx")
      .first()
      .waitFor({
        state: "visible",
        timeout: 30_000,
      });

    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(
        [...document.images].map((image) => {
          if (image.complete) return Promise.resolve();
          return new Promise<void>((resolve) => {
            image.addEventListener("load", () => resolve(), { once: true });
            image.addEventListener("error", () => resolve(), { once: true });
          });
        }),
      );
    });

    const metrics = await page.evaluate(() => {
      const wrapper = document.querySelector(".docx-wrapper");
      const pages = [...document.querySelectorAll("section.docx")];
      const first = pages[0] as HTMLElement | undefined;
      const firstPositive = (...values: number[]) =>
        values.find((value) => value > 0) ?? 0;
      const width = Math.ceil(
        firstPositive(first?.offsetWidth ?? 0, wrapper?.scrollWidth ?? 0, 816),
      );
      const pageHeight = Math.ceil(
        firstPositive(first?.offsetHeight ?? 0, 1056),
      );
      const height = Math.ceil(
        firstPositive(
          wrapper?.scrollHeight ?? 0,
          pageHeight * Math.max(pages.length, 1),
        ),
      );
      return {
        width: Math.max(width, 1),
        height: Math.max(height, pageHeight),
        pageHeight: Math.max(pageHeight, 1),
      };
    });

    await page.setViewportSize({
      width: metrics.width,
      height: metrics.height,
    });
    await page.emulateMedia({ media: "print" });
    await page.addStyleTag({
      content: printCss(metrics.width, metrics.pageHeight),
    });

    const pdfBuffer = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

export async function fetchDocxBufferFromUrl(fileUrl: string): Promise<Buffer> {
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch DOCX for PDF (${response.status})`);
  }
  return Buffer.from(await response.arrayBuffer());
}
