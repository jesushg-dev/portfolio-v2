import { resolveCvAboutPreviewText } from "./resolve-cv-about-preview-text";

describe("resolveCvAboutPreviewText", () => {
  it("prefers heroSummary when both are present", () => {
    expect(resolveCvAboutPreviewText("Hero summary", "About me")).toBe(
      "Hero summary",
    );
  });

  it("falls back to aboutMe when heroSummary is empty", () => {
    expect(resolveCvAboutPreviewText("", "About me")).toBe("About me");
    expect(resolveCvAboutPreviewText("   ", "About me")).toBe("About me");
    expect(resolveCvAboutPreviewText(null, "About me")).toBe("About me");
    expect(resolveCvAboutPreviewText(undefined, "About me")).toBe("About me");
  });

  it("returns null when both are empty", () => {
    expect(resolveCvAboutPreviewText("", "")).toBeNull();
    expect(resolveCvAboutPreviewText("  ", "  ")).toBeNull();
    expect(resolveCvAboutPreviewText(null, undefined)).toBeNull();
  });

  it("trims the selected value", () => {
    expect(resolveCvAboutPreviewText("  Hero  ", "About")).toBe("Hero");
    expect(resolveCvAboutPreviewText("", "  About  ")).toBe("About");
  });
});
