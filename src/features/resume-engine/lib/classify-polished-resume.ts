import { isPdfUpload } from "@/features/resume-engine/lib/parse-pdf-for-import";

export type PolishedResumeKind = "docx" | "pdf";

export function classifyPolishedResumeFile(
  fileName: string,
  mimeType: string,
): PolishedResumeKind {
  if (isPdfUpload(fileName, mimeType)) return "pdf";
  return "docx";
}
