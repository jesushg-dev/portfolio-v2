import { shouldSkipCollect } from "./should-skip-collect";

describe("shouldSkipCollect", () => {
  const base = {
    userAgent: "Mozilla/5.0",
    analyticsPath: "/",
    isOwner: false,
  };

  it("skips the portfolio owner", () => {
    expect(shouldSkipCollect({ ...base, isOwner: true })).toBe(true);
  });

  it("skips DNT and Global Privacy Control", () => {
    expect(shouldSkipCollect({ ...base, dnt: "1" })).toBe(true);
    expect(shouldSkipCollect({ ...base, gpc: "1" })).toBe(true);
  });

  it("skips bots and empty user agents", () => {
    expect(shouldSkipCollect({ ...base, userAgent: "Googlebot/2.1" })).toBe(
      true,
    );
    expect(shouldSkipCollect({ ...base, userAgent: "" })).toBe(true);
  });

  it("skips admin paths after normalization", () => {
    expect(
      shouldSkipCollect({ ...base, analyticsPath: "/admin/services" }),
    ).toBe(true);
  });

  it("allows anonymous human pageviews", () => {
    expect(shouldSkipCollect(base)).toBe(false);
  });
});
