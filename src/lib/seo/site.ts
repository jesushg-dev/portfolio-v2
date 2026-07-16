import type { Metadata } from "next";

export const SITE_URL = "https://www.jesushg.com";

export const SITE_NAME = "Jesús Hernández Portfolio";

export const DEFAULT_OG_IMAGE =
  "https://res.cloudinary.com/js-media/image/upload/v1784232689/portfolio/pages/home_csgb00.png";

export const TWITTER_HANDLE = "@jesus_hg";

interface SocialMetadataInput {
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  imageAlt?: string;
}

export function buildSocialMetadata({
  title,
  description,
  url,
  imageUrl = DEFAULT_OG_IMAGE,
  imageAlt,
}: SocialMetadataInput): Pick<Metadata, "openGraph" | "twitter"> {
  const alt = imageAlt ?? title;

  return {
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      images: [{ url: imageUrl, alt }],
    },
    twitter: {
      card: "summary_large_image",
      site: TWITTER_HANDLE,
      title,
      description,
      images: [imageUrl],
    },
  };
}
