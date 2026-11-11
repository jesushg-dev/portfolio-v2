import { createHash } from "crypto";

import type { CvPreviewSnapshot } from "@/features/cv/lib/load-cv-preview-snapshot";
import {
  DEFAULT_CV_TEMPLATE_VERSION,
  RESUME_TEMPLATES,
} from "@/features/resume-engine/lib/template-registry";

export function computeCvPdfContentHash(
  snapshot: CvPreviewSnapshot,
  paginatePages: boolean,
  design?: string,
): string {
  const payload = JSON.stringify({
    version: "v3-visual-template-v2",
    templateRevision: RESUME_TEMPLATES[DEFAULT_CV_TEMPLATE_VERSION].revision,
    design: design ?? "default",
    paginatePages,
    snapshot,
  });
  return createHash("sha256").update(payload).digest("hex");
}
