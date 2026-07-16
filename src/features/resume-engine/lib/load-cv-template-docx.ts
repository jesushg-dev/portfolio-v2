import { readFile } from "node:fs/promises";
import path from "node:path";

import { TRPCError } from "@trpc/server";

import { parseDocx } from "@/lib/docx/parser";

const TEMPLATE_FILE_NAME = "cv-template.docx";

const TEMPLATE_PATH = path.join(
  process.cwd(),
  "src",
  "features",
  "resume-engine",
  "assets",
  TEMPLATE_FILE_NAME,
);

export async function loadCvTemplateDocxBuffer(): Promise<Buffer> {
  try {
    return await readFile(TEMPLATE_PATH);
  } catch {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `CV template not found at ${TEMPLATE_PATH}.`,
    });
  }
}

export async function loadCvTemplateForTailor() {
  const buffer = await loadCvTemplateDocxBuffer();
  const parsed = await parseDocx(buffer);

  if (parsed.sections.length === 0) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message:
        "CV template has no adaptable sections. Check heading and bullet styles in cv-template.docx.",
    });
  }

  return {
    buffer,
    parsed,
    fileName: TEMPLATE_FILE_NAME,
  };
}
