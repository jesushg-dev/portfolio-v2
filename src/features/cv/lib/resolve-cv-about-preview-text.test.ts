import { resolveCvAboutPreviewText } from "./resolve-cv-about-preview-text";

describe("resolveCvAboutPreviewText", () => {
  it("prefers aboutMe when both are present", () => {
    expect(resolveCvAboutPreviewText("About me")).toBe("About me");
  });

  it("keeps missing CV text empty without consulting public content", () => {
    expect(resolveCvAboutPreviewText("")).toBeNull();
    expect(resolveCvAboutPreviewText("   ")).toBeNull();
    expect(resolveCvAboutPreviewText(null)).toBeNull();
    expect(resolveCvAboutPreviewText(undefined)).toBeNull();
  });

  it("returns null when both are empty", () => {
    expect(resolveCvAboutPreviewText("")).toBeNull();
    expect(resolveCvAboutPreviewText("  ")).toBeNull();
    expect(resolveCvAboutPreviewText(undefined)).toBeNull();
  });

  it("trims the selected value", () => {
    expect(resolveCvAboutPreviewText("  About  ")).toBe("About");
  });
});
