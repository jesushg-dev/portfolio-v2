import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import Image from "next/image";
import { api } from "@/trpc/server";
import { Link } from "@/i18n/routing";
import { Badge } from "@/components/ui/badge";
import { buildCloudinaryUrl } from "@/utils/tools/image";
import { TiptapRenderer } from "@/features/blog/components/tiptap-renderer";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const activeLocale = await getLocale();
  const t = await getTranslations("main.blog");
  const post = await api.blog.getBySlug({ slug, locale: activeLocale });

  if (!post) notFound();

  const { posts } = await api.blog.list({ locale: activeLocale, limit: 8 });
  const relatedPosts = posts
    .filter((item) => item.slug !== post.slug)
    .filter((item) => item.tags.some((tag) => post.tags.includes(tag)))
    .slice(0, 3);
  const seriesName =
    post.seriesName ??
    post.tags
      .find((tag) => tag.toLowerCase().startsWith("series:"))
      ?.replace(/^series:/i, "")
      .trim() ??
    null;
  const seriesPosts = seriesName
    ? (await api.blog.list({ locale: activeLocale, limit: 50, seriesName })).posts
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
  const currentSeriesIndex = seriesPosts.findIndex((item) => item.slug === post.slug);
  const previousInSeries =
    currentSeriesIndex > 0 ? seriesPosts[currentSeriesIndex - 1] : null;
  const nextInSeries =
    currentSeriesIndex >= 0 && currentSeriesIndex < seriesPosts.length - 1
      ? seriesPosts[currentSeriesIndex + 1]
      : null;

  const words = extractWords(post.content);
  const readingTime = Math.max(1, Math.ceil(words / 220));
  const headings = extractHeadings(post.content);

  return (
    <article className="mx-auto max-w-6xl px-4 py-16 md:px-10">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div>
          <Link
            href={{ pathname: "/blog" }}
            className="text-primary hover:text-primary/80 mb-8 inline-flex text-sm font-medium transition-colors"
          >
            ← {t("backToBlog")}
          </Link>

          {post.coverImage && (
            <div className="relative mb-8 aspect-video overflow-hidden rounded-xl">
              <Image
                src={buildCloudinaryUrl(post.coverImage, 1200)}
                alt={post.title}
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                priority
                className="object-cover"
              />
            </div>
          )}

          <header className="mb-10">
            <h1 className="text-foreground text-4xl font-bold tracking-tight md:text-5xl">
              {post.title}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {post.publishedAt && (
                <time className="text-muted-foreground text-sm">
                  {new Date(post.publishedAt).toLocaleDateString(activeLocale, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              )}
              <span className="text-muted-foreground text-sm">
                {t("minRead", { minutes: readingTime })}
              </span>
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={{
                    pathname: "/blog/tag/[tag]",
                    params: { tag },
                  }}
                >
                  <Badge variant="secondary">{tag}</Badge>
                </Link>
              ))}
            </div>
          </header>

          <TiptapRenderer content={post.content} />
        </div>
        {headings.length > 0 ? (
          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <div className="border-border bg-card rounded-xl border p-4">
              <p className="text-foreground mb-3 text-sm font-semibold">
                {t("tableOfContents")}
              </p>
              <nav className="space-y-2">
                {headings.map((heading) => (
                  <a
                    key={heading.id}
                    href={`#${heading.id}`}
                    className="text-muted-foreground hover:text-foreground block text-sm transition-colors"
                  >
                    {heading.text}
                  </a>
                ))}
              </nav>
            </div>
          </aside>
        ) : null}
      </div>

      {seriesName && (previousInSeries || nextInSeries) ? (
        <section className="border-border mt-12 border-t pt-8">
          <Link
            href={{
              pathname: "/blog/series/[series]",
              params: { series: seriesName },
            }}
            className="text-muted-foreground hover:text-foreground mb-3 inline-flex text-xs font-semibold tracking-wide uppercase transition-colors"
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
                className="border-border bg-card rounded-lg border p-4 transition-colors hover:bg-accent/40"
              >
                <p className="text-muted-foreground mb-1 text-xs">
                  {t("previousInSeries")}
                </p>
                <p className="text-foreground line-clamp-2 font-medium">
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
                className="border-border bg-card rounded-lg border p-4 transition-colors hover:bg-accent/40"
              >
                <p className="text-muted-foreground mb-1 text-xs">
                  {t("nextInSeries")}
                </p>
                <p className="text-foreground line-clamp-2 font-medium">
                  {nextInSeries.title}
                </p>
              </Link>
            ) : null}
          </div>
        </section>
      ) : null}

      {relatedPosts.length > 0 ? (
        <section className="border-border mt-16 border-t pt-10">
          <h2 className="text-foreground mb-4 text-2xl font-semibold">
            {t("relatedPosts")}
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {relatedPosts.map((item) => (
              <Link
                key={item.id}
                href={{ pathname: "/blog/[slug]", params: { slug: item.slug } }}
                className="border-border bg-card rounded-lg border p-4 transition-colors hover:bg-accent/40"
              >
                <p className="text-foreground line-clamp-2 font-medium">
                  {item.title}
                </p>
                <p className="text-muted-foreground mt-2 line-clamp-2 text-xs">
                  {item.excerpt}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}

function extractWords(serializedContent: string) {
  try {
    const parsed = JSON.parse(serializedContent) as { content?: unknown[] };
    const text = JSON.stringify(parsed.content ?? [])
      .replace(/[^\p{L}\p{N}\s]+/gu, " ")
      .trim();
    return text.length > 0 ? text.split(/\s+/).length : 0;
  } catch {
    const text = serializedContent
      .replace(/[^\p{L}\p{N}\s]+/gu, " ")
      .trim();
    return text.length > 0 ? text.split(/\s+/).length : 0;
  }
}

function extractHeadings(serializedContent: string) {
  try {
    const parsed = JSON.parse(serializedContent) as {
      content?: {
        type?: string;
        attrs?: { level?: number };
        content?: { text?: string }[];
      }[];
    };
    const nodes = parsed.content ?? [];
    return nodes
      .filter((node) => node.type === "heading" && (node.attrs?.level ?? 0) <= 3)
      .map((node, index) => {
        const text = (node.content ?? [])
          .map((child) => child.text ?? "")
          .join("")
          .trim();
        const safeText = text.length > 0 ? text : `section-${index + 1}`;
        return {
          id: slugifyHeading(safeText),
          text: safeText,
        };
      });
  } catch {
    return [];
  }
}

function slugifyHeading(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]+/gu, "")
    .trim()
    .replace(/\s+/g, "-");
}
