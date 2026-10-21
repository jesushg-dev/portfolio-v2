import { PUBLIC_PAGE_LIVE } from "@/lib/public-preview-pages";

import {
  buildLocalizedSitemapEntry,
  INDEXABLE_SITEMAP_PATHS,
  PUBLIC_SITEMAP_PATHS,
} from "./build-sitemap";

describe("buildLocalizedSitemapEntry", () => {
  it("includes language alternates for a static path", () => {
    const entry = buildLocalizedSitemapEntry("/", {
      priority: 1,
      changeFrequency: "weekly",
    });

    expect(entry.url).toContain("/");
    expect(entry.priority).toBe(1);
    expect(entry.changeFrequency).toBe("weekly");
    expect(entry.alternates?.languages?.en).toBeTruthy();
    expect(entry.alternates?.languages?.["x-default"]).toBeTruthy();
  });
});

describe("INDEXABLE_SITEMAP_PATHS", () => {
  it("drops unpublished preview routes", () => {
    expect(INDEXABLE_SITEMAP_PATHS.includes("/colophon")).toBe(true);
    expect(INDEXABLE_SITEMAP_PATHS.includes("/stats")).toBe(true);
    expect(INDEXABLE_SITEMAP_PATHS.includes("/uses")).toBe(
      PUBLIC_PAGE_LIVE.uses,
    );
    expect(PUBLIC_SITEMAP_PATHS).toContain("/uses");
  });
});
