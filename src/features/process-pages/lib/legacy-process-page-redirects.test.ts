import { matchLegacyProcessPageRedirect } from "./legacy-process-page-redirects";

describe("matchLegacyProcessPageRedirect", () => {
  it("maps English legacy URLs to /process/[slug]", () => {
    expect(matchLegacyProcessPageRedirect("/how-i-use-ai")).toBe(
      "/process/how-i-use-ai",
    );
    expect(matchLegacyProcessPageRedirect("/qa-collaboration")).toBe(
      "/process/qa-collaboration",
    );
  });

  it("maps localized Spanish and Dutch URLs with locale prefixes", () => {
    expect(matchLegacyProcessPageRedirect("/es/como-uso-ia")).toBe(
      "/es/proceso/how-i-use-ai",
    );
    expect(matchLegacyProcessPageRedirect("/es/colaboracion-qa")).toBe(
      "/es/proceso/qa-collaboration",
    );
    expect(matchLegacyProcessPageRedirect("/nl/hoe-ik-ai-gebruik")).toBe(
      "/nl/proces/how-i-use-ai",
    );
    expect(matchLegacyProcessPageRedirect("/nl/qa-samenwerking")).toBe(
      "/nl/proces/qa-collaboration",
    );
  });

  it("keeps an explicit locale prefix when the English slug is used", () => {
    expect(matchLegacyProcessPageRedirect("/es/how-i-use-ai")).toBe(
      "/es/proceso/how-i-use-ai",
    );
    expect(matchLegacyProcessPageRedirect("/en/qa-collaboration")).toBe(
      "/process/qa-collaboration",
    );
  });

  it("returns null for current process URLs and unrelated paths", () => {
    expect(matchLegacyProcessPageRedirect("/process/how-i-use-ai")).toBeNull();
    expect(
      matchLegacyProcessPageRedirect("/es/proceso/how-i-use-ai"),
    ).toBeNull();
    expect(matchLegacyProcessPageRedirect("/uses")).toBeNull();
  });
});
