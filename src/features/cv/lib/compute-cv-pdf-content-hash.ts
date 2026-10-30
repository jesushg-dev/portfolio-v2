import { createHash } from "crypto";

import type { CvPreviewSnapshot } from "@/features/cv/lib/load-cv-preview-snapshot";

export function computeCvPdfContentHash(
  snapshot: CvPreviewSnapshot,
  paginatePages: boolean,
  design?: string,
): string {
  const payload = JSON.stringify({
    version: "v3-visual-template-v2",
    design: design ?? "default",
    paginatePages,
    snapshot,
  });
  return createHash("sha256").update(payload).digest("hex");
}
