import {
  buildCombinedPrompt,
  buildImportPromptPackage,
} from "./prompt-package";
describe("resume-engine prompt packages", () => {
  it("builds a combined system/user prompt", () => {
    expect(buildCombinedPrompt("sys", "user")).toContain("SYSTEM:");
    expect(buildCombinedPrompt("sys", "user")).toContain("USER:");
  });

  it("includes resume sections in the import package", () => {
    const pkg = buildImportPromptPackage([
      { heading: "Experience", lines: ["Acme"] },
    ]);
    expect(pkg.userPrompt).toContain("RESUME SECTIONS");
    expect(pkg.combinedPrompt).toContain(pkg.systemPrompt);
  });
});
