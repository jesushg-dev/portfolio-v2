import type { Metadata } from "next";
import type { Locale } from "next-intl";
import { api } from "@/trpc/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await api.blog.getBySlug({
    slug,
    locale: locale as Locale,
  });

  if (!post) return { title: "Not Found" };

  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    openGraph: post.coverImage
      ? { images: [{ url: post.coverImage }] }
      : undefined,
  };
}
