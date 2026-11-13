import type { Metadata } from "next";
import { type Locale } from "@/i18n/config";
import { api } from "@/trpc/server";
import { buildPublicAlternates } from "@/lib/public-site/metadata";
import { SITE_NAME, TWITTER_HANDLE } from "@/lib/seo/site";

interface BlogPostMetadataProps {
  params: Promise<{
    locale: Locale;
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: BlogPostMetadataProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await api.blog.getBySlug({
    slug,
    locale,
  });

  if (!post) {
    return { title: "Article Not Found" };
  }

  const title = post.title;
  const description = post.excerpt || undefined;
  const alternates = await buildPublicAlternates(locale, {
    pathname: "/blog/[slug]",
    params: { slug },
  });

  const ogImages = post.coverImage
    ? [{ url: post.coverImage, alt: title }]
    : undefined;

  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      type: "article",
      url: alternates.canonical,
      siteName: SITE_NAME,
      publishedTime: post.publishedAt ?? undefined,
      authors: ["Jesús Hernández"],
      tags: post.tags,
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      site: TWITTER_HANDLE,
      images: post.coverImage ? [post.coverImage] : undefined,
    },
  };
}
