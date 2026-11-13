import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { api } from "@/trpc/server";
import { Link } from "@/i18n/routing";
import { Badge } from "@/components/ui/badge";
import { TiptapRenderer } from "@/features/blog/components/tiptap-renderer";
import { BlogTableOfContents } from "@/features/blog/components/blog-table-of-contents";
import {
  extractHeadings,
  extractWords,
  isSeriesTag,
} from "@/features/blog/lib/blog-headings";
import { SITE_URL } from "@/lib/seo/site";

export { generateMetadata } from "./metadata";
export { publicBlogParams as generateStaticParams } from "@/lib/public-site/static-params";

interface BlogPostPageProps {
  params: Promise<{ locale: Locale; slug: string }>;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug, locale } = await params;
  const t = await getTranslations({ locale, namespace: "main.blog" });
  const post = await api.blog.getBySlug({ slug, locale });

  if (!post) notFound();

  const { posts } = await api.blog.list({ locale, limit: 8 });
  const relatedPosts = posts
    .filter((item) => item.slug !== post.slug)
    .filter((item) => item.tags.some((tag) => post.tags.includes(tag)))
    .slice(0, 3);

  const seriesSlug = post.seriesSlug;
  const seriesName = post.seriesName;

  const seriesPosts = seriesSlug
    ? (await api.blog.list({ locale, limit: 50, seriesSlug })).posts
        .slice()
        .sort((a, b) => {
          const aOrder = a.seriesOrder ?? Number.MAX_SAFE_INTEGER;
          const bOrder = b.seriesOrder ?? Number.MAX_SAFE_INTEGER;
          if (aOrder !== bOrder) return aOrder - bOrder;
          const aDate = a.publishedAt ? Date.parse(a.publishedAt) : 0;
          const bDate = b.publishedAt ? Date.parse(b.publishedAt) : 0;
          return aDate - bDate;
        })
    : [];

  const currentIndex = seriesPosts.findIndex((p) => p.slug === post.slug);
  const previousInSeries =
    currentIndex > 0 ? seriesPosts[currentIndex - 1] : null;
  const nextInSeries =
    currentIndex >= 0 && currentIndex < seriesPosts.length - 1
      ? seriesPosts[currentIndex + 1]
      : null;
  const visibleTags = post.tags.filter((tag) => !isSeriesTag(tag));

  const words = extractWords(post.content);
  const readingTime = Math.max(1, Math.ceil(words / 220));
  const headings = extractHeadings(post.content);

  const postUrl = `${SITE_URL}/blog/${post.slug}`;
  const blogUrl = `${SITE_URL}/blog`;
  const seriesUrl = seriesSlug ? `${SITE_URL}/blog/series/${seriesSlug}` : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${postUrl}#article`,
        headline: post.title,
        description: post.excerpt,
        image: post.coverImage ? [post.coverImage] : undefined,
        datePublished: post.publishedAt,
        dateModified: post.publishedAt,
        inLanguage: locale,
        wordCount: words,
        timeRequired: `PT${readingTime}M`,
        keywords: post.tags.join(", "),
        author: {
          "@type": "Person",
          name: "Jesús Hernández",
          url: SITE_URL,
        },
        publisher: {
          "@type": "Person",
          name: "Jesús Hernández",
          url: SITE_URL,
        },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": postUrl,
        },
        ...(seriesName && seriesUrl
          ? {
              partOfSeries: {
                "@type": "CreativeWorkSeries",
                name: seriesName,
                url: seriesUrl,
                ...(post.seriesOrder ? { position: post.seriesOrder } : {}),
              },
            }
          : {}),
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${postUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: SITE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: t("title") || "Blog",
            item: blogUrl,
          },
          ...(seriesName && seriesUrl
            ? [
                {
                  "@type": "ListItem",
                  position: 3,
                  name: seriesName,
                  item: seriesUrl,
                },
                {
                  "@type": "ListItem",
                  position: 4,
                  name: post.title,
                  item: postUrl,
                },
              ]
            : [
                {
                  "@type": "ListItem",
                  position: 3,
                  name: post.title,
                  item: postUrl,
                },
              ]),
        ],
      },
    ],
  };

  return (
    <article className="mx-auto max-w-6xl px-4 pt-28 pb-16 md:px-10 md:pt-32 md:pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link
        href={{ pathname: "/blog" }}
        className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-2 text-sm font-medium transition-colors"
      >
        <ArrowLeft className="size-4" />
        {t("backToBlog")}
      </Link>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_16.5rem]">
        <div className="min-w-0">
          {post.coverImage ? (
            <div className="border-border relative mb-10 aspect-video overflow-hidden rounded-2xl border shadow-sm">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                sizes="(max-width: 768px) 100vw, 800px"
                priority
                className="object-cover"
              />
            </div>
          ) : null}

          <header className="mb-10 max-w-2xl">
            {seriesSlug && seriesName ? (
              <Link
                href={{
                  pathname: "/blog/series/[series]",
                  params: { series: seriesSlug },
                }}
                className="text-primary mb-3 inline-flex text-xs font-semibold tracking-[0.14em] uppercase"
              >
                {t("series")} · {seriesName}
                {currentIndex >= 0
                  ? ` · ${t("chapterOf", {
                      current: currentIndex + 1,
                      total: seriesPosts.length,
                    })}`
                  : null}
              </Link>
            ) : null}

            <h1 className="text-foreground text-3xl font-bold tracking-tight sm:text-4xl md:text-[2.75rem] md:leading-[1.15]">
              {post.title}
            </h1>

            {post.excerpt ? (
              <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
                {post.excerpt}
              </p>
            ) : null}

            <div className="text-muted-foreground mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
              {post.publishedAt ? (
                <time>
                  {new Date(post.publishedAt).toLocaleDateString(locale, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              ) : null}
              <span className="bg-border hidden size-1 rounded-full sm:inline-block" />
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5" />
                {t("minRead", { minutes: readingTime })}
              </span>
            </div>

            {visibleTags.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {visibleTags.map((tag) => (
                  <Link
                    key={tag}
                    href={{ pathname: "/blog/tag/[tag]", params: { tag } }}
                  >
                    <Badge variant="secondary">{tag}</Badge>
                  </Link>
                ))}
              </div>
            ) : null}
          </header>

          {headings.length > 0 ? (
            <div className="mb-10 lg:hidden">
              <BlogTableOfContents
                headings={headings}
                title={t("tableOfContents")}
              />
            </div>
          ) : null}

          <TiptapRenderer content={post.content} />
        </div>

        {headings.length > 0 ? (
          <div className="hidden lg:block">
            <BlogTableOfContents
              headings={headings}
              title={t("tableOfContents")}
            />
          </div>
        ) : null}
      </div>

      {seriesSlug && seriesName && (previousInSeries || nextInSeries) ? (
        <section className="border-border mt-16 border-t pt-10">
          <Link
            href={{
              pathname: "/blog/series/[series]",
              params: { series: seriesSlug },
            }}
            className="text-primary mb-4 inline-flex text-xs font-semibold tracking-[0.14em] uppercase"
          >
            {t("series")} · {seriesName}
          </Link>
          <div className="grid gap-4 md:grid-cols-2">
            {previousInSeries ? (
              <Link
                href={{
                  pathname: "/blog/[slug]",
                  params: { slug: previousInSeries.slug },
                }}
                className="border-border bg-card hover:border-primary/30 group rounded-2xl border p-5 transition-all hover:shadow-md"
              >
                <p className="text-muted-foreground mb-2 inline-flex items-center gap-1.5 text-xs">
                  <ArrowLeft className="size-3.5" />
                  {t("previousInSeries")}
                </p>
                <p className="text-foreground group-hover:text-primary line-clamp-2 font-semibold tracking-tight transition-colors">
                  {previousInSeries.title}
                </p>
              </Link>
            ) : (
              <div />
            )}
            {nextInSeries ? (
              <Link
                href={{
                  pathname: "/blog/[slug]",
                  params: { slug: nextInSeries.slug },
                }}
                className="border-border bg-card hover:border-primary/30 group rounded-2xl border p-5 text-right transition-all hover:shadow-md"
              >
                <p className="text-muted-foreground mb-2 inline-flex items-center justify-end gap-1.5 text-xs">
                  {t("nextInSeries")}
                  <ArrowRight className="size-3.5" />
                </p>
                <p className="text-foreground group-hover:text-primary line-clamp-2 font-semibold tracking-tight transition-colors">
                  {nextInSeries.title}
                </p>
              </Link>
            ) : null}
          </div>
        </section>
      ) : null}

      {relatedPosts.length > 0 ? (
        <section className="border-border mt-16 border-t pt-10">
          <h2 className="text-foreground mb-6 text-2xl font-bold tracking-tight">
            {t("relatedPosts")}
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {relatedPosts.map((item) => (
              <Link
                key={item.id}
                href={{
                  pathname: "/blog/[slug]",
                  params: { slug: item.slug },
                }}
                className="border-border bg-card hover:border-primary/30 group flex flex-col rounded-2xl border p-5 transition-all hover:shadow-md"
              >
                <p className="text-foreground group-hover:text-primary line-clamp-2 font-semibold tracking-tight transition-colors">
                  {item.title}
                </p>
                {item.excerpt ? (
                  <p className="text-muted-foreground mt-2 line-clamp-3 text-sm leading-relaxed">
                    {item.excerpt}
                  </p>
                ) : null}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
