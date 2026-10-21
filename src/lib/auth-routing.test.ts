import { buildLocalizedCallbackUrl, safeInternalPath } from "./auth-routing";

describe("safeInternalPath", () => {
  it("falls back to /admin for missing or protocol-relative values", () => {
    expect(safeInternalPath(null)).toBe("/admin");
    expect(safeInternalPath("")).toBe("/admin");
    expect(safeInternalPath("https://evil.example")).toBe("/admin");
    expect(safeInternalPath("//evil.example")).toBe("/admin");
  });

  it("keeps an internal path", () => {
    expect(safeInternalPath("/admin/cv")).toBe("/admin/cv");
  });
});

describe("buildLocalizedCallbackUrl", () => {
  it("joins origin and the localized pathname", () => {
    expect(
      buildLocalizedCallbackUrl("en", "/admin", "https://jesushg.com"),
    ).toBe("https://jesushg.com/admin");
  });
});
