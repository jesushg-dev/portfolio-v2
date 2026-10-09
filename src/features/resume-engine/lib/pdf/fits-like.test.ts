import { readFile } from "node:fs/promises";
import path from "node:path";
import { fitsLike } from "./fits-like";

describe("Page Fit Verification (T5)", () => {
  const pdfTemplatePath = path.join(
    process.cwd(),
    "src",
    "features",
    "resume-engine",
    "assets",
    "cv-template.pdf",
  );

  it("verifies template PDF fits against itself", async () => {
    const buffer = await readFile(pdfTemplatePath);
    const result = await fitsLike(buffer, buffer);

    expect(result.ok).toBe(true);
    expect(result.pages).toBe(1);
    expect(result.perColumn).toHaveLength(1);
    expect(result.perColumn[0].ok).toBe(true);
    expect(result.perColumn[0].columns.left.ok).toBe(true);
    expect(result.perColumn[0].columns.right.ok).toBe(true);
  });
});
