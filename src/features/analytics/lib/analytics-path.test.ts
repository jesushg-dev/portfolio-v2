import { toAnalyticsPath, isSkippedAnalyticsPath } from "./analytics-path";

describe("toAnalyticsPath", () => {
  it("strips locale prefixes and query strings", () => {
    expect(toAnalyticsPath("/es/curriculum-vitae?ref=x")).toBe(
      "/curriculum-vitae",
    );
    expect(toAnalyticsPath("/nl/tijdlijn#top")).toBe("/timeline");
    expect(toAnalyticsPath("/privacy")).toBe("/privacy");
  });

  it("maps localized static routes to internal pathnames", () => {
    expect(toAnalyticsPath("/es/privacidad")).toBe("/privacy");
    expect(toAnalyticsPath("/es/estadisticas")).toBe("/stats");
    expect(toAnalyticsPath("/nl/statistieken")).toBe("/stats");
  });

  it("keeps slugs on localized dynamic routes", () => {
    expect(toAnalyticsPath("/es/proyectos/eleven")).toBe("/projects/eleven");
    expect(toAnalyticsPath("/nl/vaardigheden/csharp")).toBe("/skills/csharp");
    expect(toAnalyticsPath("/es/proceso/how-i-use-ai")).toBe(
      "/process/how-i-use-ai",
    );
  });

  it("caps overly long paths", () => {
    const longSlug = "a".repeat(300);
    expect(toAnalyticsPath(`/projects/${longSlug}`).length).toBeLessThanOrEqual(
      180,
    );
  });
});

describe("isSkippedAnalyticsPath", () => {
  it("skips admin, auth, and api routes", () => {
    expect(isSkippedAnalyticsPath("/admin")).toBe(true);
    expect(isSkippedAnalyticsPath("/admin/job-tracker")).toBe(true);
    expect(isSkippedAnalyticsPath("/login")).toBe(true);
    expect(isSkippedAnalyticsPath("/register")).toBe(true);
    expect(isSkippedAnalyticsPath("/forgot-password")).toBe(true);
    expect(isSkippedAnalyticsPath("/reset-password")).toBe(true);
    expect(isSkippedAnalyticsPath("/api/analytics/collect")).toBe(true);
  });

  it("allows public content paths", () => {
    expect(isSkippedAnalyticsPath("/")).toBe(false);
    expect(isSkippedAnalyticsPath("/stats")).toBe(false);
    expect(isSkippedAnalyticsPath("/projects/eleven")).toBe(false);
  });
});
