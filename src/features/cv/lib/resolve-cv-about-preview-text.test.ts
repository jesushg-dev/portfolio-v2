import { resolveCvAboutPreviewText } from "./resolve-cv-about-preview-text";

describe("resolveCvAboutPreviewText", () => {
  it("prefers aboutMe when both are present", () => {
    expect(resolveCvAboutPreviewText("Hero summary", "About me")).toBe(
      "About me",
    );
  });

  it("falls back to heroSummary when aboutMe is empty", () => {
    expect(resolveCvAboutPreviewText("Hero summary", "")).toBe("Hero summary");
    expect(resolveCvAboutPreviewText("Hero summary", "   ")).toBe(
      "Hero summary",
    );
    expect(resolveCvAboutPreviewText("Hero summary", null)).toBe(
      "Hero summary",
    );
    expect(resolveCvAboutPreviewText("Hero summary", undefined)).toBe(
      "Hero summary",
    );
  });

  it("returns null when both are empty", () => {
    expect(resolveCvAboutPreviewText("", "")).toBeNull();
    expect(resolveCvAboutPreviewText("  ", "  ")).toBeNull();
    expect(resolveCvAboutPreviewText(null, undefined)).toBeNull();
  });

  it("trims the selected value", () => {
    expect(resolveCvAboutPreviewText("Hero", "  About  ")).toBe("About");
    expect(resolveCvAboutPreviewText("  Hero  ", "")).toBe("Hero");
  });
});
