import { createHash } from "crypto";

import type { CvPreviewSnapshot } from "@/features/cv/lib/load-cv-preview-snapshot";

export function computeCvPdfContentHash(
  snapshot: CvPreviewSnapshot,
  paginatePages: boolean,
): string {
  const payload = JSON.stringify({
    version: "v2-ats-name",
    paginatePages,
    snapshot,
  });
  return createHash("sha256").update(payload).digest("hex");
}
