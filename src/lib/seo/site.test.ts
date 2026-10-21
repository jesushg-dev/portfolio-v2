import {
  buildSocialMetadata,
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  TWITTER_HANDLE,
} from "./site";

describe("buildSocialMetadata", () => {
  it("builds Open Graph and Twitter cards with defaults", () => {
    const metadata = buildSocialMetadata({
      title: "Stats",
      description: "Public analytics",
      url: "https://www.jesushg.com/stats",
    });

    expect(metadata.openGraph).toMatchObject({
      title: "Stats",
      description: "Public analytics",
      url: "https://www.jesushg.com/stats",
      siteName: SITE_NAME,
      type: "website",
      images: [{ url: DEFAULT_OG_IMAGE, alt: "Stats" }],
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      site: TWITTER_HANDLE,
      title: "Stats",
    });
  });

  it("uses a custom image and alt", () => {
    const metadata = buildSocialMetadata({
      title: "CV",
      description: "Resume",
      url: "https://example.com/cv",
      imageUrl: "https://cdn.example/og.png",
      imageAlt: "Portrait",
      siteName: "Tenant",
    });

    expect(metadata.openGraph?.images).toEqual([
      { url: "https://cdn.example/og.png", alt: "Portrait" },
    ]);
    expect(metadata.openGraph?.siteName).toBe("Tenant");
  });
});
