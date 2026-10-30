import { readFile } from "node:fs/promises";
import path from "node:path";
import JSZip from "jszip";
import {
  DEFAULT_CV_TEMPLATE_VERSION,
  getResumeTemplate,
  type CvTemplateVersion,
} from "@/features/resume-engine/lib/template-registry";
import { validateResumeTemplate } from "@/features/resume-engine/lib/docx/render-template";

const ASSETS_DIR = path.join(
  process.cwd(),
  "src/features/resume-engine/assets",
);
export async function loadCvTemplateDocxBuffer(
  version: CvTemplateVersion = DEFAULT_CV_TEMPLATE_VERSION,
): Promise<Buffer> {
  const template = getResumeTemplate(version);
  const buffer = await readFile(path.join(ASSETS_DIR, template.docx));
  const zip = await JSZip.loadAsync(buffer);
  const xml = await zip.file("word/document.xml")?.async("string");
  if (!xml) throw new Error(`Template ${version} has no document.xml`);
  validateResumeTemplate(xml, template);
  return buffer;
}
