import { isPublicPageLive, PUBLIC_PAGE_LIVE } from "./public-preview-pages";

describe("isPublicPageLive", () => {
  it("returns the live flag for each preview page", () => {
    expect(isPublicPageLive("uses")).toBe(PUBLIC_PAGE_LIVE.uses);
    expect(isPublicPageLive("now")).toBe(PUBLIC_PAGE_LIVE.now);
    expect(isPublicPageLive("colophon")).toBe(true);
    expect(isPublicPageLive("stats")).toBe(true);
  });
});
