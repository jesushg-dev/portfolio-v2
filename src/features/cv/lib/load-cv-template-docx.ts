import { readFile } from "node:fs/promises";
import path from "node:path";

import { TRPCError } from "@trpc/server";

import { parseDocx } from "@/lib/docx/parser";

export type CvTemplateVersion = "v1" | "v2";
export const DEFAULT_CV_TEMPLATE_VERSION: CvTemplateVersion = "v2";

const ASSETS_DIR = path.join(
  process.cwd(),
  "src",
  "features",
  "resume-engine",
  "assets",
);

const TEMPLATE_FILES: Record<CvTemplateVersion, { docx: string; pdf: string }> =
  {
    v1: {
      docx: "cv-template.docx",
      pdf: "cv-template.pdf",
    },
    v2: {
      docx: "cv-template-v2.docx",
      pdf: "cv-template-v2.pdf",
    },
  };

export async function loadCvTemplateDocxBuffer(
  version: CvTemplateVersion = DEFAULT_CV_TEMPLATE_VERSION,
): Promise<Buffer> {
  const fileName = TEMPLATE_FILES[version]?.docx ?? TEMPLATE_FILES.v2.docx;
  const filePath = path.join(ASSETS_DIR, fileName);
  try {
    return await readFile(filePath);
  } catch {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `CV template (${version}) not found at ${filePath}.`,
    });
  }
}

export async function loadCvTemplatePdfBuffer(
  version: CvTemplateVersion = DEFAULT_CV_TEMPLATE_VERSION,
): Promise<Buffer> {
  const fileName = TEMPLATE_FILES[version]?.pdf ?? TEMPLATE_FILES.v2.pdf;
  const filePath = path.join(ASSETS_DIR, fileName);
  try {
    return await readFile(filePath);
  } catch {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `CV PDF template (${version}) not found at ${filePath}.`,
    });
  }
}

export async function loadCvTemplateForTailor(
  version: CvTemplateVersion = DEFAULT_CV_TEMPLATE_VERSION,
) {
  const buffer = await loadCvTemplateDocxBuffer(version);
  const parsed = await parseDocx(buffer);

  if (parsed.sections.length === 0) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `CV template (${version}) has no adaptable sections. Check heading and bullet styles in ${TEMPLATE_FILES[version]?.docx}.`,
    });
  }

  return {
    buffer,
    parsed,
    fileName: TEMPLATE_FILES[version]?.docx ?? TEMPLATE_FILES.v2.docx,
    version,
  };
}
