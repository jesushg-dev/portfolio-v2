import { Carlito } from "next/font/google";

/** Calibri first (DOCX template); Carlito is a metric-compatible web fallback. */
export const cvPreviewFont = Carlito({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  variable: "--font-cv-preview",
});

export const CV_PREVIEW_FONT_FAMILY =
  'Calibri, var(--font-cv-preview), "Segoe UI", "Helvetica Neue", Arial, sans-serif';
